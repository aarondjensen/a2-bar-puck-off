import { SESSIONS, PLAYOFF_DATE } from "../lib/schedule.js";
import { teamById } from "../lib/teams.js";
import { formatDate } from "../lib/dates.js";

export default function Schedule() {
  return (
    <>
      {SESSIONS.map((s) => (
        <section key={s.n} className="card">
          <h2><span>Session {s.n}</span><span className="muted">{formatDate(s.date)}</span></h2>
          {s.matches.map((m, i) => (
            <div key={m.id} className={`row ${i === 3 ? "gap" : ""}`}>
              <span className="team">{teamById(m.a).name}</span>
              <span className="vs">vs</span>
              <span className="team right">{teamById(m.b).name}</span>
            </div>
          ))}
        </section>
      ))}
      <section className="card">
        <h2><span>Playoffs</span><span className="muted">{formatDate(PLAYOFF_DATE)}</span></h2>
      </section>
    </>
  );
}
