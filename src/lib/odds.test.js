import { describe, expect, it } from "vitest";
import { buildOdds, fitRatings, lineFor, PARAMS } from "./odds.js";
import { REGULAR_MATCHES } from "./schedule.js";
import { TEAMS } from "./teams.js";

const ids = TEAMS.map((t) => t.id);
const [A, B, C, D] = ids;
const g = (a, b, scoreA, scoreB) => ({ a, b, scoreA, scoreB });
const line = (games, a, b) => lineFor(fitRatings(games, ids), a, b);

describe("odds", () => {
  it("opens every matchup at a pick'em with the book's edge on both sides", () => {
    const l = line([], A, B);
    expect(l.pA).toBeCloseTo(0.5, 6);
    expect(l.mlA).toBe(-110);
    expect(l.mlB).toBe(-110);
    expect(l.spreadA).toBe(0);
  });

  it("is symmetric: swapping the teams swaps the lines", () => {
    const games = [g(A, B, 21, 10), g(C, A, 21, 18)];
    const x = line(games, A, C);
    const y = line(games, C, A);
    expect(x.pA).toBeCloseTo(y.pB, 9);
    expect(x.spreadA).toBe(-y.spreadA);
  });

  it("moves toward the winner after a result, more for a bigger margin", () => {
    const close = line([g(A, B, 21, 19)], A, C);
    const blowout = line([g(A, B, 21, 3)], A, C);
    expect(close.pA).toBeGreaterThan(0.5);
    expect(blowout.pA).toBeGreaterThan(close.pA);
    expect(blowout.mlA).toBeLessThan(close.mlA);
  });

  it("credits who was beaten: beating a strong team beats beating a weak one", () => {
    const games = [g(B, D, 21, 5), g(B, C, 21, 8)]; // B looks strong
    const overB = line([...games, g(A, B, 21, 18)], A, D);
    const overWeak = line([...games, g(A, D, 21, 18)], A, B);
    expect(overB.pA).toBeGreaterThan(0.5);
    expect(overWeak.pA).toBeLessThan(0.5); // A only beat the team B already crushed
  });

  it("never swings far on one game and keeps the sides' chances summing to one", () => {
    const l = line([g(A, B, 21, 0)], A, B);
    expect(l.pA).toBeLessThan(0.75);
    expect(l.pA + l.pB).toBeCloseTo(1, 9);
    expect(l.mlA).toBeLessThan(0);
    expect(l.mlB).toBeGreaterThan(0);
  });

  it("buildOdds reads stored results and ignores a result that does not fit its match", () => {
    const [m1, m2] = REGULAR_MATCHES;
    const results = { [m1.id]: g(m1.a, m1.b, 21, 7), [m2.id]: g(A, A, 21, 7) };
    const lookup = buildOdds(results, REGULAR_MATCHES, ids);
    expect(lookup(m1.a, m1.b).pA).toBeGreaterThan(0.5);
    expect(PARAMS.vig).toBeGreaterThan(0);
  });
});
