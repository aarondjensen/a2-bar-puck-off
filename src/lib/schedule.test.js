import { describe, expect, it } from "vitest";
import { REGULAR_MATCHES, SESSIONS } from "./schedule.js";
import { TEAMS } from "./teams.js";

const pairKey = (m) => [m.a, m.b].sort().join("|");

describe("schedule", () => {
  it("has five sessions of six matches on TJ's dates", () => {
    expect(SESSIONS.map((s) => s.date)).toEqual([
      "2026-12-04", "2027-01-08", "2027-02-05", "2027-03-05", "2027-04-09",
    ]);
    for (const s of SESSIONS) expect(s.matches).toHaveLength(6);
    expect(new Set(REGULAR_MATCHES.map((m) => m.id)).size).toBe(30);
  });

  it("plays every pair exactly twice", () => {
    const counts = {};
    for (const m of REGULAR_MATCHES) counts[pairKey(m)] = (counts[pairKey(m)] || 0) + 1;
    expect(Object.keys(counts)).toHaveLength(15);
    expect(Object.values(counts).every((n) => n === 2)).toBe(true);
  });

  it("has each team play twice a session, never the same opponent twice", () => {
    for (const s of SESSIONS) {
      const pairs = s.matches.map(pairKey);
      expect(new Set(pairs).size).toBe(6);
      for (const t of TEAMS) {
        expect(s.matches.filter((m) => m.a === t.id || m.b === t.id)).toHaveLength(2);
      }
    }
  });

  it("finishes the first round robin before the second begins", () => {
    // The first 15 matches in order must be 15 different pairs.
    const first = REGULAR_MATCHES.slice(0, 15).map(pairKey);
    expect(new Set(first).size).toBe(15);
    const second = REGULAR_MATCHES.slice(15).map(pairKey);
    expect(new Set(second).size).toBe(15);
  });

  it("never repeats a pairing on consecutive nights", () => {
    for (let i = 0; i < SESSIONS.length - 1; i++) {
      const next = new Set(SESSIONS[i + 1].matches.map(pairKey));
      for (const m of SESSIONS[i].matches) expect(next.has(pairKey(m))).toBe(false);
    }
  });

  it("has each half of a night use every team once", () => {
    for (const s of SESSIONS) {
      for (const half of [s.matches.slice(0, 3), s.matches.slice(3)]) {
        expect(new Set(half.flatMap((m) => [m.a, m.b])).size).toBe(6);
      }
    }
  });
});
