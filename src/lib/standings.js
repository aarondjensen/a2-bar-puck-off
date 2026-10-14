import { TEAMS } from "./teams.js";
import { REGULAR_MATCHES } from "./schedule.js";
import { resultFits, scoreFor } from "./scoring.js";

// Ordered by wins, then fewest losses, then point differential over completed matches.
// Two teams level on all three are split by points scored, then by schedule order,
// so the table (and the playoff seeding read off it) is always one definite order.
export function computeStandings(results, matches = REGULAR_MATCHES, teams = TEAMS) {
  const rows = new Map(
    teams.map((t, order) => [t.id, { id: t.id, order, w: 0, l: 0, pf: 0, pa: 0 }]),
  );
  for (const m of matches) {
    const r = results[m.id];
    if (!resultFits(r, m.a, m.b)) continue;
    const sa = scoreFor(r, m.a);
    const sb = scoreFor(r, m.b);
    const A = rows.get(m.a);
    const B = rows.get(m.b);
    A.pf += sa; A.pa += sb;
    B.pf += sb; B.pa += sa;
    if (sa > sb) { A.w++; B.l++; } else { B.w++; A.l++; }
  }
  const table = [...rows.values()].map((r) => ({ ...r, diff: r.pf - r.pa, gp: r.w + r.l }));
  table.sort(
    (x, y) => y.w - x.w || x.l - y.l || y.diff - x.diff || y.pf - x.pf || x.order - y.order,
  );
  return table.map((r, i) => ({ ...r, seed: i + 1 }));
}

export const completedCount = (results, matches = REGULAR_MATCHES) =>
  matches.filter((m) => resultFits(results[m.id], m.a, m.b)).length;
