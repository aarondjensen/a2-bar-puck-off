// One interface, two backends. With VITE_FIREBASE_* set it talks to Firestore; without,
// it keeps everything in this browser's localStorage so the app can be built and tried
// with no project behind it. Local mode is a development convenience only: nothing is
// shared between phones, and "Google" there signs in as an admin without checking anything.
//
// store = { mode, subscribe(cb), onAuth(cb), submit(id, result), override(id, result),
//           clear(id), signIn(email, pw), signUp(email, pw), signInGoogle(), signOut() }
// subscribeConfig(cb) calls back with the director's saved config or null; saveConfig(cfg) is admin-only.
// onAuth calls back with { user: { uid, email } | null, isAdmin }.
// submit never overwrites: a second submit for a match that has a result is refused.
// override and clear are admin-only, and so is every write by someone not signed in;
// that is enforced by firestore.rules, not by the UI.

const ENV = import.meta.env;
const FIREBASE_KEYS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
];

export async function createStore() {
  const present = FIREBASE_KEYS.filter((k) => ENV[k]);
  if (present.length === 0) return createLocalStore();
  if (present.length !== FIREBASE_KEYS.length) {
    throw new Error("Set every VITE_FIREBASE_* variable or none of them.");
  }
  return createFirebaseStore();
}

const ALREADY = "Already submitted";
const SIGN_IN_FIRST = "Sign in to enter scores";

function createLocalStore() {
  const KEY = "sbl_results";
  const USER = "sbl_user";
  const CONFIG = "sbl_config";
  const cfgSubs = new Set();
  const get = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const put = (k, v) => {
    try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ }
  };
  const read = () => get(KEY) || {};
  const subs = new Set();
  const auths = new Set();
  const emit = () => subs.forEach((cb) => cb(read()));
  const session = () => {
    const u = get(USER);
    return u ? { user: { uid: u.uid, email: u.email }, isAdmin: !!u.admin } : { user: null, isAdmin: false };
  };
  const emitAuth = () => auths.forEach((cb) => cb(session()));
  const login = (email, admin) => { put(USER, { uid: email, email, admin }); emitAuth(); return { ok: true }; };
  const write = (id, result, extra = {}) => {
    put(KEY, { ...read(), [id]: { ...result, by: session().user.uid, at: Date.now(), ...extra } });
    emit();
    return { ok: true };
  };
  return {
    mode: "local",
    subscribe(cb) { subs.add(cb); cb(read()); return () => subs.delete(cb); },
    onAuth(cb) { auths.add(cb); cb(session()); return () => auths.delete(cb); },
    async submit(id, result) {
      if (!session().user) return { ok: false, error: SIGN_IN_FIRST };
      if (read()[id]) return { ok: false, error: ALREADY };
      return write(id, result);
    },
    async override(id, result) {
      if (!session().isAdmin) return { ok: false, error: "Admin only" };
      return write(id, result, { edited: true });
    },
    async clear(id) {
      if (!session().isAdmin) return { ok: false, error: "Admin only" };
      const all = read();
      delete all[id];
      put(KEY, all);
      emit();
      return { ok: true };
    },
    subscribeConfig(cb) {
      const f = () => cb(get(CONFIG));
      cfgSubs.add(f); f();
      return () => cfgSubs.delete(f);
    },
    async saveConfig(cfg) {
      if (!session().isAdmin) return { ok: false, error: "Admin only" };
      put(CONFIG, cfg);
      cfgSubs.forEach((f) => f());
      return { ok: true };
    },
    async signIn(email) { return login(email, false); },
    async signUp(email) { return login(email, false); },
    async signInGoogle() { return login("admin@local", true); },
    async signOut() { put(USER, null); emitAuth(); },
  };
}

async function createFirebaseStore() {
  const [{ initializeApp }, fs, au] = await Promise.all([
    import("firebase/app"),
    import("firebase/firestore"),
    import("firebase/auth"),
  ]);
  const app = initializeApp({
    apiKey: ENV.VITE_FIREBASE_API_KEY,
    authDomain: ENV.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: ENV.VITE_FIREBASE_PROJECT_ID,
    appId: ENV.VITE_FIREBASE_APP_ID,
  });
  const db = fs.getFirestore(app);
  const auth = au.getAuth(app);

  // A refused write is reported, never swallowed: the form must not look saved when it is not.
  const failure = (e, denied) =>
    e?.code === "permission-denied" ? denied : "Could not save. Check your connection.";
  const body = (r) => ({
    a: r.a, b: r.b, scoreA: r.scoreA, scoreB: r.scoreB,
    by: auth.currentUser?.uid, at: fs.serverTimestamp(),
  });

  const authError = (e) => {
    switch (e?.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Wrong email or password";
      case "auth/invalid-email": return "Enter a valid email";
      case "auth/email-already-in-use": return "That email already has an account";
      case "auth/weak-password": return "Password needs at least 6 characters";
      case "auth/too-many-requests": return "Too many tries. Wait a minute.";
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request": return null;
      default: return "Could not sign in. Check your connection.";
    }
  };
  const attempt = async (fn) => {
    try { await fn(); return { ok: true }; } catch (e) { return { ok: false, error: authError(e) }; }
  };

  return {
    mode: "firebase",
    subscribe(cb) {
      return fs.onSnapshot(fs.collection(db, "results"), (snap) => {
        cb(Object.fromEntries(snap.docs.map((d) => [d.id, d.data()])));
      });
    },
    subscribeConfig(cb) {
      return fs.onSnapshot(fs.doc(db, "config", "league"), (snap) => cb(snap.exists() ? snap.data() : null));
    },
    async saveConfig(cfg) {
      try {
        await fs.setDoc(fs.doc(db, "config", "league"), {
          teams: cfg.teams, dates: cfg.dates, playoff: cfg.playoff,
          by: auth.currentUser?.uid, at: fs.serverTimestamp(),
        });
        return { ok: true };
      } catch (e) {
        return { ok: false, error: failure(e, "Admin only") };
      }
    },
    async submit(id, result) {
      try {
        // Rules allow create to a signed-in user and update to the admin only, so this
        // is refused for a match that already has a result.
        await fs.setDoc(fs.doc(db, "results", id), body(result));
        return { ok: true };
      } catch (e) {
        return { ok: false, error: failure(e, ALREADY) };
      }
    },
    async override(id, result) {
      try {
        await fs.setDoc(fs.doc(db, "results", id), { ...body(result), edited: true });
        return { ok: true };
      } catch (e) {
        return { ok: false, error: failure(e, "Admin only") };
      }
    },
    async clear(id) {
      try {
        await fs.deleteDoc(fs.doc(db, "results", id));
        return { ok: true };
      } catch (e) {
        return { ok: false, error: failure(e, "Admin only") };
      }
    },
    onAuth(cb) {
      let alive = true;
      const off = au.onAuthStateChanged(auth, async (u) => {
        if (!u) { cb({ user: null, isAdmin: false }); return; }
        let isAdmin = false;
        try { isAdmin = (await fs.getDoc(fs.doc(db, "admins", u.uid))).exists(); } catch { /* not an admin */ }
        if (alive) cb({ user: { uid: u.uid, email: u.email }, isAdmin });
      });
      return () => { alive = false; off(); };
    },
    signIn: (email, pw) => attempt(() => au.signInWithEmailAndPassword(auth, email, pw)),
    signUp: (email, pw) => attempt(() => au.createUserWithEmailAndPassword(auth, email, pw)),
    signInGoogle: () => attempt(() => au.signInWithPopup(auth, new au.GoogleAuthProvider())),
    signOut: () => au.signOut(auth),
  };
}
