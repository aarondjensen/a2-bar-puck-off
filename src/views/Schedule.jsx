import { SESSIONS, PLAYOFF_DATE } from "../lib/schedule.js";
import { teamById } from "../lib/teams.js";
import { formatDate } from "../lib/dates.js";
import { scoreFor, resultFits } from "../lib/scoring.js";

const done = (s, results) =>
  s.matches.every((m) => resultFits(results[m.id], m.a, m.b));

function Session({ s, results, scored, collapsed }) {
  const rows = s.matches.map((m, i) => {
    const r = results[m.id];
    const a = scoreFor(r, m.a), b = scoreFor(r, m.b);
    return (
      <div key={m.id} className={`row ${i === 3 ? "gap" : ""}`}>
        <span className={`team ${scored && a > b ? "win" : ""}`}>{teamById(m.a).name}</span>
        <span className="vs">{scored ? `${a}–${b}` : "vs"}</span>
        <span className={`team right ${scored && b > a ? "win" : ""}`}>{teamById(m.b).name}</span>
      </div>
    );
  });
  if (!collapsed) {
    return (
      <section className="card">
        <h2 className="date">{formatDate(s.date)}</h2>
        {rows}
      </section>
    );
  }
  return (
    <details className="card fold">
      <summary>{formatDate(s.date)}</summary>
      {rows}
    </details>
  );
}

export default function Schedule({ results }) {
  const past = SESSIONS.filter((s) => done(s, results));
  const rest = SESSIONS.filter((s) => !done(s, results));
  const [next, ...upcoming] = rest;
  const playoffs = (
    <section className="card">
      <h2 className="date">Playoffs · {formatDate(PLAYOFF_DATE)}</h2>
    </section>
  );

  return (
    <>
      <h3 className="sub">Next</h3>
      {next ? <Session s={next} results={results} /> : playoffs}
      {next && (
        <>
          <h3 className="sub">Upcoming</h3>
          {upcoming.map((s) => <Session key={s.n} s={s} results={results} collapsed />)}
          {playoffs}
        </>
      )}
      {past.length > 0 && (
        <>
          <h3 className="sub">Completed</h3>
          {[...past].reverse().map((s) => <Session key={s.n} s={s} results={results} scored collapsed />)}
        </>
      )}
    </>
  );
}
