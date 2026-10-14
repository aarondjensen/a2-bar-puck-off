// One interface, two backends. With VITE_FIREBASE_* set it talks to Firestore; without,
// it keeps everything in this browser's localStorage so the app can be built and tried
// with no project behind it. Local mode is a development convenience only: nothing is
// shared between phones, and "Admin" there is a switch, not a check.
//
// store = { subscribe(cb), submit(id, result), override(id, result), clear(id),
//           onAdmin(cb), signIn(), signOut(), mode }
// submit never overwrites: a second submit for a match that has a result is refused.
// override and clear are admin-only (enforced by firestore.rules, not by the UI).

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

function createLocalStore() {
  const KEY = "sbl_results";
  const ADMIN = "sbl_admin";
  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
  };
  const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private mode */ } };
  const subs = new Set();
  const admins = new Set();
  const emit = () => subs.forEach((cb) => cb(read()));
  const isAdmin = () => { try { return localStorage.getItem(ADMIN) === "1"; } catch { return false; } };
  const emitAdmin = () => admins.forEach((cb) => cb(isAdmin()));
  return {
    mode: "local",
    subscribe(cb) { subs.add(cb); cb(read()); return () => subs.delete(cb); },
    async submit(id, result) {
      const all = read();
      if (all[id]) return { ok: false, error: ALREADY };
      write({ ...all, [id]: { ...result, at: Date.now() } });
      emit();
      return { ok: true };
    },
    async override(id, result) {
      write({ ...read(), [id]: { ...result, at: Date.now(), edited: true } });
      emit();
      return { ok: true };
    },
    async clear(id) {
      const all = read();
      delete all[id];
      write(all);
      emit();
      return { ok: true };
    },
    onAdmin(cb) { admins.add(cb); cb(isAdmin()); return () => admins.delete(cb); },
    async signIn() { try { localStorage.setItem(ADMIN, "1"); } catch { /* ignore */ } emitAdmin(); },
    async signOut() { try { localStorage.removeItem(ADMIN); } catch { /* ignore */ } emitAdmin(); },
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
  const failure = (e, fallback) =>
    e?.code === "permission-denied" ? fallback : "Could not save. Check your connection.";
  const stamp = (r) => ({ a: r.a, b: r.b, scoreA: r.scoreA, scoreB: r.scoreB });

  return {
    mode: "firebase",
    subscribe(cb) {
      return fs.onSnapshot(fs.collection(db, "results"), (snap) => {
        cb(Object.fromEntries(snap.docs.map((d) => [d.id, d.data()])));
      });
    },
    async submit(id, result) {
      try {
        // Rules allow create to anyone and update to the admin only, so this is
        // refused for a match that already has a result.
        await fs.setDoc(fs.doc(db, "results", id), { ...stamp(result), at: fs.serverTimestamp() });
        return { ok: true };
      } catch (e) {
        return { ok: false, error: failure(e, ALREADY) };
      }
    },
    async override(id, result) {
      try {
        await fs.setDoc(fs.doc(db, "results", id), {
          ...stamp(result),
          at: fs.serverTimestamp(),
          edited: true,
        });
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
    onAdmin(cb) {
      let alive = true;
      const off = au.onAuthStateChanged(auth, async (user) => {
        if (!user) { cb(false); return; }
        try {
          const snap = await fs.getDoc(fs.doc(db, "admins", user.uid));
          if (alive) cb(snap.exists());
        } catch { if (alive) cb(false); }
      });
      return () => { alive = false; off(); };
    },
    async signIn() { await au.signInWithPopup(auth, new au.GoogleAuthProvider()); },
    async signOut() { await au.signOut(auth); },
  };
}
