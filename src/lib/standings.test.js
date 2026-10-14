import { describe, expect, it } from "vitest";
import { computeStandings } from "./standings.js";
import { REGULAR_MATCHES } from "./schedule.js";
import { validateScore } from "./scoring.js";

const res = (m, scoreA, scoreB) => ({ a: m.a, b: m.b, scoreA, scoreB });

describe("standings", () => {
  it("is empty and in team order before anything is played", () => {
    const t = computeStandings({});
    expect(t.map((r) => r.gp)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(t[0].id).toBe("born-to-puck");
  });

  it("ranks by wins and counts only completed matches", () => {
    const [m1, m2] = REGULAR_MATCHES;
    const t = computeStandings({ [m1.id]: res(m1, 21, 10) });
    expect(t[0]).toMatchObject({ id: m1.a, w: 1, l: 0, pf: 21, pa: 10, diff: 11 });
    expect(t[5]).toMatchObject({ id: m1.b, w: 0, l: 1, diff: -11 });
    expect(t.find((r) => r.id === REGULAR_MATCHES[2].a).gp).toBe(0);
    expect(m2).toBeTruthy();
  });

  it("splits equal records by point differential", () => {
    // Two teams each 1-0: the bigger margin ranks higher, whichever was entered first.
    const [m1, m2] = REGULAR_MATCHES;
    const t = computeStandings({
      [m1.id]: res(m1, 21, 19),
      [m2.id]: res(m2, 21, 2),
    });
    expect(t[0].id).toBe(m2.a);
    expect(t[1].id).toBe(m1.a);
  });

  it("counts a loss for the lower side when team b wins", () => {
    const [m1] = REGULAR_MATCHES;
    const t = computeStandings({ [m1.id]: res(m1, 4, 21) });
    expect(t[0].id).toBe(m1.b);
  });

  it("ignores a result recorded for a different pairing", () => {
    const [m1, , m3] = REGULAR_MATCHES;
    const t = computeStandings({ [m1.id]: { a: m3.a, b: m3.b, scoreA: 21, scoreB: 1 } });
    expect(t.every((r) => r.gp === 0)).toBe(true);
  });
});

describe("validateScore", () => {
  it("accepts a win to 21 or past it", () => {
    expect(validateScore(21, 0).ok).toBe(true);
    expect(validateScore(13, 23).ok).toBe(true);
  });
  it("refuses ties, short games and junk", () => {
    expect(validateScore(21, 21).ok).toBe(false);
    expect(validateScore(20, 15).ok).toBe(false);
    expect(validateScore(NaN, 5).ok).toBe(false);
    expect(validateScore(21, -1).ok).toBe(false);
    expect(validateScore(21.5, 3).ok).toBe(false);
  });
});
