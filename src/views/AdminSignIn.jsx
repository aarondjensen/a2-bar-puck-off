import { useState } from "react";

export default function AdminSignIn({ store, onDone }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const r = await store.signIn(email.trim(), password);
    setBusy(false);
    if (r.ok) onDone(); else setError(r.error);
  }

  return (
    <form className="card signin" onSubmit={submit}>
      <input type="email" autoComplete="username" placeholder="Email" value={email}
        onChange={(e) => { setEmail(e.target.value); setError(null); }} />
      <input type="password" autoComplete="current-password" placeholder="Password" value={password}
        onChange={(e) => { setPassword(e.target.value); setError(null); }} />
      <button className="btn" disabled={busy || !email || !password}>Sign in</button>
      {error && <p className="err">{error}</p>}
    </form>
  );
}
