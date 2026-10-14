import { describe, expect, it } from "vitest";
import { BRACKET, playoffMatchId, resolveBracket } from "./bracket.js";

const seeds = ["s1", "s2", "s3", "s4", "s5", "s6"];
const get = (b, id) => b.matches.find((m) => m.id === id);

// Builds a results map by playing matches in order; `winners` maps match id -> who wins.
function play(order, pick) {
  const results = {};
  for (const id of order) {
    const m = get(resolveBracket(seeds, results), id);
    if (!m.a || !m.b) throw new Error(`${id} not ready`);
    const aWins = pick[id] === m.a;
    results[playoffMatchId(id)] = { a: m.a, b: m.b, scoreA: aWins ? 21 : 7, scoreB: aWins ? 7 : 21 };
  }
  return results;
}

describe("bracket", () => {
  it("gives seeds 1 and 2 a bye into the second round", () => {
    const b = resolveBracket(seeds, {});
    expect(get(b, "W1")).toMatchObject({ a: "s3", b: "s6" });
    expect(get(b, "W2")).toMatchObject({ a: "s4", b: "s5" });
    expect(get(b, "W3")).toMatchObject({ a: "s1", b: null });
    expect(get(b, "W4")).toMatchObject({ a: "s2", b: null });
  });

  it("advances winners and drops losers as results arrive", () => {
    const results = play(["W1", "W2"], { W1: "s3", W2: "s5" });
    const b = resolveBracket(seeds, results);
    expect(get(b, "W3")).toMatchObject({ a: "s1", b: "s5" });
    expect(get(b, "W4")).toMatchObject({ a: "s2", b: "s3" });
    expect(get(b, "L1")).toMatchObject({ a: "s6", b: "s4" });
  });

  it("crowns the unbeaten team without a reset when it wins the first final", () => {
    const pick = { W1: "s3", W2: "s4", W3: "s1", W4: "s2", W5: "s1", L1: "s6", L2: "s2", L3: "s2", L4: "s2", F1: "s1" };
    const b = resolveBracket(seeds, play(["W1", "W2", "W3", "W4", "W5", "L1", "L2", "L3", "L4", "F1"], pick));
    expect(get(b, "F2").needed).toBe(false);
    expect(b.champion).toBe("s1");
  });

  it("needs the reset final when the losers-bracket team wins the first", () => {
    const pick = { W1: "s3", W2: "s4", W3: "s1", W4: "s2", W5: "s1", L1: "s6", L2: "s2", L3: "s2", L4: "s2", F1: "s2", F2: "s2" };
    const order = ["W1", "W2", "W3", "W4", "W5", "L1", "L2", "L3", "L4", "F1"];
    const mid = resolveBracket(seeds, play(order, pick));
    expect(get(mid, "F2").needed).toBe(true);
    expect(mid.champion).toBe(null);
    const done = resolveBracket(seeds, play([...order, "F2"], pick));
    expect(done.champion).toBe("s2");
  });

  it("flags a result as stale when an earlier score changed who is playing", () => {
    const results = play(["W1", "W2", "W3"], { W1: "s3", W2: "s4", W3: "s1" });
    // W1 is corrected the other way round, so W4 now has a different opponent.
    results[playoffMatchId("W1")] = { a: "s3", b: "s6", scoreA: 5, scoreB: 21 };
    const b = resolveBracket(seeds, results);
    expect(get(b, "W4")).toMatchObject({ a: "s2", b: "s6" });
    expect(get(b, "W3").winner).toBe("s1");
  });

  it("has 10 required matches plus a reset", () => {
    expect(BRACKET.filter((m) => !m.reset)).toHaveLength(10);
    expect(BRACKET.filter((m) => m.reset)).toHaveLength(1);
  });
});
