import { fmtMoney, fmtSpread } from "../lib/odds.js";

// "-135 · -2.5" for one side of a matchup. Empty (but present) when there is nothing to show,
// so rows keep the same height.
export default function OddsLine({ line, side }) {
  if (!line) return <span className="odds" />;
  const ml = side === "a" ? line.mlA : line.mlB;
  const sp = side === "a" ? line.spreadA : line.spreadB;
  return <span className="odds">{fmtMoney(ml)} · {fmtSpread(sp)}</span>;
}
