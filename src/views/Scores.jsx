import { useState } from "react";
import { SESSIONS, PLAYOFF_DATE } from "../lib/schedule.js";
import { playoffMatchId } from "../lib/bracket.js";
import { resultFits, validateScore } from "../lib/scoring.js";
import { teamById } from "../lib/teams.js";
import { formatDate, todayYmd } from "../lib/dates.js";

// The session to open on: tonight's, else the next one, else the last.
function defaultSession() {
  const today = todayYmd();
  return SESSIONS.find((s) => s.date >= today)?.n ?? SESSIONS.length;
}

export default function Scores({ store, results, user, isAdmin, bracket, onSignIn }) {
  const [session, setSession] = useState(defaultSession);
  const playoffs = session === 6;
  const s = SESSIONS[session - 1];

  const matches = playoffs
    ? bracket.matches.filter((m) => !m.reset || m.needed).map((m) => ({
        id: playoffMatchId(m.id), label: m.id, a: m.a, b: m.b, stale: m.stale,
      }))
    : s.matches;

  return (
    <>
      <div className="chips">
        {SESSIONS.map((x) => (
          <button key={x.n} className={session === x.n ? "on" : ""} onClick={() => setSession(x.n)}>
            {formatDate(x.date)}
          </button>
        ))}
        <button className={playoffs ? "on" : ""} onClick={() => setSession(6)}>{formatDate(PLAYOFF_DATE)}</button>
      </div>
      {!user && (
        <button className="btn signprompt" onClick={() => { onSignIn(); window.scrollTo(0, 0); }}>
          Sign in to enter scores
        </button>
      )}
      <section className="card">
        <h2 className="date">{playoffs ? `Playoffs · ${formatDate(PLAYOFF_DATE)}` : formatDate(s.date)}</h2>
        {matches.map((m) => (
          <MatchRow key={m.id} m={m} result={results[m.id]} store={store} user={user} isAdmin={isAdmin} />
        ))}
      </section>
    </>
  );
}

function MatchRow({ m, result, store, user, isAdmin }) {
  const [editing, setEditing] = useState(false);
  const A = teamById(m.a);
  const B = teamById(m.b);

  const head = (
    <div className="matchhead">
      {m.label && <span className="tag">{m.label}</span>}
      <span className="team">{A ? A.name : "TBD"}</span>
      <span className="vs">vs</span>
      <span className="team right">{B ? B.name : "TBD"}</span>
    </div>
  );

  if (!A || !B) return <div className="match dim">{head}</div>;

  const done = resultFits(result, m.a, m.b);
  // A result exists but belongs to an earlier pairing (a score upstream was corrected).
  const stale = !!result && !done;

  // Only a signed-in user gets a form; everybody sees finished scores.
  if (!result && !user) return <div className="match">{head}</div>;

  if (!result || editing) {
    return (
      <div className="match">
        {head}
        <ScoreForm
          m={m} A={A} B={B} store={store}
          replacing={!!result}
          initial={done ? result : null}
          onDone={() => setEditing(false)}
          onCancel={result ? () => setEditing(false) : null}
        />
      </div>
    );
  }

  const sa = result.a === m.a ? result.scoreA : result.scoreB;
  const sb = result.a === m.a ? result.scoreB : result.scoreA;
  return (
    <div className="match">
      {head}
      <div className="final">
        {done ? (
          <>
            <span className={sa > sb ? "win" : ""}>{sa}</span>
            <span className="muted">–</span>
            <span className={sb > sa ? "win" : ""}>{sb}</span>
          </>
        ) : (
          <span className="muted">Awaiting admin</span>
        )}
        {isAdmin && (
          <button className="link" onClick={() => setEditing(true)}>{stale ? "Fix" : "Edit"}</button>
        )}
      </div>
    </div>
  );
}

function ScoreForm({ m, A, B, store, replacing, initial, onDone, onCancel }) {
  const orient = (r, id) => (r ? (r.a === id ? r.scoreA : r.scoreB) : "");
  const [a, setA] = useState(String(orient(initial, m.a)));
  const [b, setB] = useState(String(orient(initial, m.b)));
  const [confirm, setConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const na = a === "" ? NaN : Number(a);
  const nb = b === "" ? NaN : Number(b);

  async function send() {
    const v = validateScore(na, nb);
    if (!v.ok) { setError(v.error); setConfirm(false); return; }
    setBusy(true);
    const payload = { a: m.a, b: m.b, scoreA: na, scoreB: nb };
    const r = replacing ? await store.override(m.id, payload) : await store.submit(m.id, payload);
    setBusy(false);
    if (!r.ok) { setError(r.error); setConfirm(false); return; }
    onDone();
  }

  async function clear() {
    setBusy(true);
    const r = await store.clear(m.id);
    setBusy(false);
    if (!r.ok) { setError(r.error); setClearing(false); return; }
    onDone();
  }

  if (clearing) {
    return (
      <div className="form">
        <p className="warn">Remove the {A.name} vs {B.name} score?</p>
        <div className="actions">
          <button className="btn danger" disabled={busy} onClick={clear}>Remove</button>
          <button className="btn ghost" onClick={() => setClearing(false)}>Back</button>
        </div>
      </div>
    );
  }

  if (confirm) {
    return (
      <div className="form">
        <p className="warn">
          Submit {A.name} {na} – {nb} {B.name}?
          {!replacing && " Only the admin can change it afterwards."}
        </p>
        <div className="actions">
          <button className="btn" disabled={busy} onClick={send}>Submit</button>
          <button className="btn ghost" onClick={() => setConfirm(false)}>Back</button>
        </div>
        {error && <p className="err">{error}</p>}
      </div>
    );
  }

  return (
    <div className="form">
      <div className="inputs">
        <label>
          <span>{A.name}</span>
          <input inputMode="numeric" pattern="[0-9]*" value={a}
            onChange={(e) => { setA(e.target.value.replace(/\D/g, "")); setError(null); }} />
        </label>
        <label>
          <span>{B.name}</span>
          <input inputMode="numeric" pattern="[0-9]*" value={b}
            onChange={(e) => { setB(e.target.value.replace(/\D/g, "")); setError(null); }} />
        </label>
      </div>
      <div className="actions">
        <button className="btn" onClick={() => {
          const v = validateScore(na, nb);
          if (!v.ok) setError(v.error); else { setError(null); setConfirm(true); }
        }}>Submit</button>
        {onCancel && <button className="btn ghost" onClick={onCancel}>Cancel</button>}
        {replacing && <button className="btn ghost" onClick={() => setClearing(true)}>Remove</button>}
      </div>
      {error && <p className="err">{error}</p>}
    </div>
  );
}
