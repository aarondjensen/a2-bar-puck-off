import { useEffect, useState } from "react";
import { currentConfig, toStored, validateConfig } from "../lib/config.js";
import { SESSIONS } from "../lib/schedule.js";
import { formatDate } from "../lib/dates.js";

export default function Admin({ store, isAdmin, finalized }) {
  const [cfg, setCfg] = useState(currentConfig);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [code, setCode] = useState("");
  const [codeMsg, setCodeMsg] = useState(null);
  const [members, setMembers] = useState([]);
  const [removing, setRemoving] = useState(null);
  const [memberErr, setMemberErr] = useState(null);
  useEffect(() => { if (isAdmin) store.getCode().then(setCode); }, [store, isAdmin]);
  useEffect(() => (isAdmin ? store.subscribeMembers(setMembers) : undefined), [store, isAdmin]);

  if (!isAdmin) return <p className="muted">Admin only</p>;

  const edit = (fn) => { setCfg((c) => { const n = structuredClone(c); fn(n); return n; }); setMsg(null); };

  async function save() {
    const v = validateConfig(cfg);
    if (!v.ok) { setMsg({ err: v.error }); return; }
    setBusy(true);
    const r = await store.saveConfig(toStored(cfg));
    setBusy(false);
    setMsg(r.ok ? { ok: "Saved" } : { err: r.error });
  }

  async function saveCode() {
    if (!code.trim()) { setCodeMsg({ err: "Enter a code" }); return; }
    const r = await store.saveCode(code.trim());
    setCodeMsg(r.ok ? { ok: "Saved" } : { err: r.error });
  }

  async function remove(uid) {
    const r = await store.removeMember(uid);
    setRemoving(null);
    setMemberErr(r.ok ? null : r.error);
  }

  const sorted = [...members].sort((a, b) => a.email.localeCompare(b.email));

  const weeks = SESSIONS.filter((x) => finalized.has(x.n));

  return (
    <>
      {weeks.length > 0 && (
        <>
          <h3 className="sub">Finalized weeks</h3>
          <section className="card">
            {weeks.map((w) => (
              <div key={w.n} className="memberrow">
                <span>{formatDate(w.date)}</span>
                <button className="link" onClick={() => store.reopenWeek(w.n)}>Reopen</button>
              </div>
            ))}
          </section>
        </>
      )}
      <h3 className="sub">Members</h3>
      <section className="card">
        {sorted.length === 0 && <p className="muted center">No members yet</p>}
        {sorted.map((m) => (
          <div key={m.uid} className="memberrow">
            <span className="mail">{m.email || m.uid}</span>
            {removing === m.uid ? (
              <span className="rm">
                <button className="link danger" onClick={() => remove(m.uid)}>Remove</button>
                <button className="link" onClick={() => setRemoving(null)}>Cancel</button>
              </span>
            ) : (
              <button className="link" onClick={() => setRemoving(m.uid)}>Remove</button>
            )}
          </div>
        ))}
        {memberErr && <p className="err">{memberErr}</p>}
      </section>
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
        {cfg.weeks.map((w, i) => (
          <div key={i} className="dateline">
            <input type="date" value={w.date} onChange={(e) => edit((n) => { n.weeks[i].date = e.target.value; })} />
            <button type="button" className={`kind ${w.kind}`}
              onClick={() => edit((n) => { n.weeks[i].kind = w.kind === "regular" ? "playoffs" : "regular"; })}>
              {w.kind === "regular" ? "Regular season" : "Playoffs"}
            </button>
            <button type="button" className="link danger" aria-label="Remove date"
              onClick={() => edit((n) => { n.weeks.splice(i, 1); })}>✕</button>
          </div>
        ))}
        <button type="button" className="btn ghost" onClick={() => edit((n) => {
          const last = n.weeks.map((x) => x.date).filter(Boolean).sort().pop();
          const d = last ? new Date(`${last}T12:00:00Z`) : new Date();
          if (last) d.setUTCDate(d.getUTCDate() + 7);
          const regular = n.weeks.filter((x) => x.kind === "regular").length;
          n.weeks.push({ date: d.toISOString().slice(0, 10), kind: regular < SESSIONS.length ? "regular" : "playoffs" });
        })}>Add a date</button>
      </section>
      <button className="btn signprompt" disabled={busy} onClick={save}>Save</button>
      {msg?.err && <p className="err">{msg.err}</p>}
      {msg?.ok && <p className="warn">{msg.ok}</p>}
    </>
  );
}
