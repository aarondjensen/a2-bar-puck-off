import { useState } from "react";

export default function SignIn({ store, onDone }) {
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function run(fn) {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    if (r.ok) onDone(); else setError(r.error);
  }

  const submit = (e) => {
    e.preventDefault();
    run(() => (creating ? store.signUp(email.trim(), password) : store.signIn(email.trim(), password)));
  };

  return (
    <form className="card signin" onSubmit={submit}>
      <input type="email" autoFocus autoComplete="username" placeholder="Email" value={email}
        onChange={(e) => { setEmail(e.target.value); setError(null); }} />
      <input type="password" autoComplete={creating ? "new-password" : "current-password"}
        placeholder="Password" value={password}
        onChange={(e) => { setPassword(e.target.value); setError(null); }} />
      <button className="btn" disabled={busy || !email || !password}>
        {creating ? "Create account" : "Sign in"}
      </button>
      <div className="actions">
        <button type="button" className="btn ghost" disabled={busy}
          onClick={() => run(() => store.signInGoogle())}>Google</button>
        <button type="button" className="btn ghost"
          onClick={() => { setCreating((v) => !v); setError(null); }}>
          {creating ? "I have an account" : "Create account"}
        </button>
      </div>
      {error && <p className="err">{error}</p>}
    </form>
  );
}
