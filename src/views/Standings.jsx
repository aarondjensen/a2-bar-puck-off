import { teamById } from "../lib/teams.js";

export default function Standings({ standings }) {
  return (
    <section className="card">
      <table className="table">
        <thead>
          <tr><th></th><th className="l">Team</th><th>W</th><th>L</th><th>PF</th><th>PA</th><th>+/-</th></tr>
        </thead>
        <tbody>
          {standings.map((r) => (
            <tr key={r.id} className={r.seed <= 2 ? "bye" : ""}>
              <td className="muted">{r.seed}</td>
              <td className="l">{teamById(r.id).name}</td>
              <td>{r.w}</td><td>{r.l}</td><td>{r.pf}</td><td>{r.pa}</td>
              <td>{r.diff > 0 ? `+${r.diff}` : r.diff}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
