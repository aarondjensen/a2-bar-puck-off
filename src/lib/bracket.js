import { resultFits, scoreFor } from "./scoring.js";

// Six teams, double elimination, seeds 1 and 2 on a bye. Each slot says where its team
// comes from: a seed, or the winner/loser of another match.
const seed = (n) => ({ seed: n });
const win = (id) => ({ winner: id });
const lose = (id) => ({ loser: id });

export const BRACKET = [
  { id: "W1", side: "winners", round: 1, slots: [seed(3), seed(6)] },
  { id: "W2", side: "winners", round: 1, slots: [seed(4), seed(5)] },
  { id: "W3", side: "winners", round: 2, slots: [seed(1), win("W2")] },
  { id: "W4", side: "winners", round: 2, slots: [seed(2), win("W1")] },
  { id: "W5", side: "winners", round: 3, slots: [win("W3"), win("W4")] },
  { id: "L1", side: "losers", round: 1, slots: [lose("W1"), lose("W2")] },
  { id: "L2", side: "losers", round: 2, slots: [win("L1"), lose("W4")] },
  { id: "L3", side: "losers", round: 3, slots: [win("L2"), lose("W3")] },
  { id: "L4", side: "losers", round: 4, slots: [win("L3"), lose("W5")] },
  { id: "F1", side: "final", round: 1, slots: [win("W5"), win("L4")] },
  // Only played if the team out of the losers bracket beats the unbeaten one.
  { id: "F2", side: "final", round: 2, slots: [win("W5"), win("L4")], reset: true },
];

export const playoffMatchId = (id) => `p-${id}`;

// seeds: team ids ordered seed 1..6. results: the stored results, keyed by match id.
// Returns every match with its teams, result, winner and loser worked out from the
// results above it. A stored result whose teams no longer match the slot (an earlier
// score was corrected) is surfaced as `stale` and treated as unplayed.
export function resolveBracket(seeds, results) {
  const out = new Map();
  const teamOf = (src) => {
    if (src.seed) return seeds[src.seed - 1] || null;
    const m = out.get(src.winner || src.loser);
    if (!m) return null;
    return src.winner ? m.winner : m.loser;
  };
  for (const def of BRACKET) {
    const a = teamOf(def.slots[0]);
    const b = teamOf(def.slots[1]);
    const stored = results[playoffMatchId(def.id)] || null;
    const played = !!(a && b) && resultFits(stored, a, b);
    let winner = null;
    let loser = null;
    if (played) {
      const sa = scoreFor(stored, a);
      const sb = scoreFor(stored, b);
      winner = sa > sb ? a : b;
      loser = sa > sb ? b : a;
    }
    // The reset final exists only when the losers-bracket team won the first final.
    let needed = true;
    if (def.reset) {
      const f1 = out.get("F1");
      needed = !!f1?.winner && f1.winner === f1.b;
    }
    out.set(def.id, {
      ...def,
      a,
      b,
      result: played ? stored : null,
      stale: !!stored && !played && !!(a && b),
      scoreA: played ? scoreFor(stored, a) : null,
      scoreB: played ? scoreFor(stored, b) : null,
      winner,
      loser,
      needed,
    });
  }
  const matches = [...out.values()];
  const f1 = out.get("F1");
  const f2 = out.get("F2");
  const champion = f1.winner && f1.winner === f1.a ? f1.winner : f2.needed ? f2.winner : null;
  return { matches, champion };
}
