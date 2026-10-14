import { describe, it, expect } from "vitest";
import { currentConfig, validateConfig } from "./config.js";

describe("league config", () => {
  it("accepts the defaults", () => {
    expect(validateConfig(currentConfig()).ok).toBe(true);
  });
  it("rejects a blank team name, duplicate names, and out-of-order dates", () => {
    const c = currentConfig();
    c.teams[0].name = " ";
    expect(validateConfig(c).ok).toBe(false);
    const d = currentConfig();
    d.teams[1].name = d.teams[0].name.toUpperCase();
    expect(validateConfig(d).ok).toBe(false);
    const e = currentConfig();
    e.dates[2] = "2026-01-01";
    expect(validateConfig(e).ok).toBe(false);
    const f = currentConfig();
    f.playoff = f.dates[4];
    expect(validateConfig(f).ok).toBe(false);
  });
  it("rejects a date that is not on the calendar", () => {
    const c = currentConfig();
    c.dates[0] = "2026-02-30";
    expect(validateConfig(c).ok).toBe(false);
  });
});
