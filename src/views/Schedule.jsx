import { SESSIONS, PLAYOFF_DATES } from "../lib/schedule.js";
import { teamById } from "../lib/teams.js";
import { formatDate } from "../lib/dates.js";
import { scoreFor, resultFits } from "../lib/scoring.js";
import OddsLine from "./OddsLine.jsx";

// Scores show on a match as soon as it has one, so a week waiting to be finalized is readable.
function Session({ s, results, odds, collapsed }) {
  const rows = s.matches.map((m, i) => {
    const r = results[m.id];
    const played = resultFits(r, m.a, m.b);
    const a = played ? scoreFor(r, m.a) : null, b = played ? scoreFor(r, m.b) : null;
    return (
      <div key={m.id} className={`row ${i === 3 ? "gap" : ""}`}>
        <span className={`team ${played && a > b ? "win" : ""}`}>
          {teamById(m.a).name}
          {odds && <OddsLine line={played ? null : odds(m.a, m.b)} side="a" />}
        </span>
        <span className="vs">{played ? `${a}–${b}` : "vs"}</span>
        <span className={`team right ${played && b > a ? "win" : ""}`}>
          {teamById(m.b).name}
          {odds && <OddsLine line={played ? null : odds(m.a, m.b)} side="b" />}
        </span>
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

export default function Schedule({ results, finalized, odds }) {
  const past = SESSIONS.filter((s) => finalized.has(s.n));
  const rest = SESSIONS.filter((s) => !finalized.has(s.n));
  const [next, ...upcoming] = rest;
  const playoffs = (
    <section className="card">
      <h2 className="date">Playoffs · {PLAYOFF_DATES.map(formatDate).join(", ")}</h2>
    </section>
  );

  return (
    <>
      <h3 className="sub">Next</h3>
      {next ? <Session s={next} results={results} odds={odds} /> : playoffs}
      {next && (
        <>
          <h3 className="sub">Upcoming</h3>
          {upcoming.map((s) => <Session key={s.n} s={s} results={results} odds={odds} collapsed />)}
          {playoffs}
        </>
      )}
      {past.length > 0 && (
        <>
          <h3 className="sub">Completed</h3>
          {[...past].reverse().map((s) => <Session key={s.n} s={s} results={results} collapsed />)}
        </>
      )}
    </>
  );
}
