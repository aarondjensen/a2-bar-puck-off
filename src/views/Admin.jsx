import { useEffect, useState } from "react";
import { currentConfig, validateConfig } from "../lib/config.js";

export default function Admin({ store, isAdmin }) {
  const [cfg, setCfg] = useState(currentConfig);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [code, setCode] = useState("");
  const [codeMsg, setCodeMsg] = useState(null);
  useEffect(() => { if (isAdmin) store.getCode().then(setCode); }, [store, isAdmin]);

  if (!isAdmin) return <p className="muted">Admin only</p>;

  const edit = (fn) => { setCfg((c) => { const n = structuredClone(c); fn(n); return n; }); setMsg(null); };

  async function save() {
    const v = validateConfig(cfg);
    if (!v.ok) { setMsg({ err: v.error }); return; }
    setBusy(true);
    const r = await store.saveConfig({
      ...cfg,
      teams: cfg.teams.map((t) => ({ id: t.id, name: t.name.trim(), players: t.players.map((p) => p.trim()) })),
    });
    setBusy(false);
    setMsg(r.ok ? { ok: "Saved" } : { err: r.error });
  }

  async function saveCode() {
    if (!code.trim()) { setCodeMsg({ err: "Enter a code" }); return; }
    const r = await store.saveCode(code.trim());
    setCodeMsg(r.ok ? { ok: "Saved" } : { err: r.error });
  }

  return (
    <>
      <h3 className="sub">League code</h3>
      <section className="card form">
        <input className="field" aria-label="League code" autoCapitalize="none" autoCorrect="off" value={code}
          onChange={(e) => { setCode(e.target.value); setCodeMsg(null); }} />
        <button className="btn" onClick={saveCode}>Save code</button>
        {codeMsg?.err && <p className="err">{codeMsg.err}</p>}
        {codeMsg?.ok && <p className="warn">{codeMsg.ok}</p>}
      </section>
      <h3 className="sub">Teams</h3>
      {cfg.teams.map((t, i) => (
        <section key={t.id} className="card form">
          <input className="field" aria-label="Team name" value={t.name}
            onChange={(e) => edit((n) => { n.teams[i].name = e.target.value; })} />
          <div className="two">
            {[0, 1].map((k) => (
              <input key={k} className="field" aria-label={`Player ${k + 1}`} value={t.players[k]}
                onChange={(e) => edit((n) => { n.teams[i].players[k] = e.target.value; })} />
            ))}
          </div>
        </section>
      ))}
      <h3 className="sub">Dates</h3>
      <section className="card form">
        {cfg.dates.map((d, i) => (
          <label key={i} className="dateline">
            <span>Session {i + 1}</span>
            <input type="date" value={d} onChange={(e) => edit((n) => { n.dates[i] = e.target.value; })} />
          </label>
        ))}
        <label className="dateline">
          <span>Playoffs</span>
          <input type="date" value={cfg.playoff} onChange={(e) => edit((n) => { n.playoff = e.target.value; })} />
        </label>
      </section>
      <button className="btn signprompt" disabled={busy} onClick={save}>Save</button>
      {msg?.err && <p className="err">{msg.err}</p>}
      {msg?.ok && <p className="warn">{msg.ok}</p>}
    </>
  );
}
