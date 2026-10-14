import { describe, it, expect } from "vitest";
import { currentConfig, toStored, validateConfig } from "./config.js";

describe("league config", () => {
  it("accepts the defaults", () => {
    expect(validateConfig(currentConfig()).ok).toBe(true);
  });
  it("rejects a blank team name and duplicate names", () => {
    const c = currentConfig();
    c.teams[0].name = " ";
    expect(validateConfig(c).ok).toBe(false);
    const d = currentConfig();
    d.teams[1].name = d.teams[0].name.toUpperCase();
    expect(validateConfig(d).ok).toBe(false);
  });
  it("needs exactly five regular dates and playoffs after them", () => {
    const missing = currentConfig();
    missing.weeks.splice(0, 1);
    expect(validateConfig(missing).ok).toBe(false);
    const extra = currentConfig();
    extra.weeks.push({ date: "2027-06-01", kind: "regular" });
    expect(validateConfig(extra).ok).toBe(false);
    const none = currentConfig();
    none.weeks.pop();
    expect(validateConfig(none).ok).toBe(false);
    const early = currentConfig();
    early.weeks[5].date = "2027-03-01";
    expect(validateConfig(early).ok).toBe(false);
  });
  it("allows a second playoff night and a moved regular date", () => {
    const c = currentConfig();
    c.weeks.push({ date: "2027-05-08", kind: "playoffs" });
    c.weeks[0].date = "2026-12-11";
    const v = validateConfig(c);
    expect(v.ok).toBe(true);
    expect(toStored(c).playoffs).toEqual(["2027-05-07", "2027-05-08"]);
  });
  it("rejects two weeks on one date and a date that is not on the calendar", () => {
    const c = currentConfig();
    c.weeks[1].date = c.weeks[0].date;
    expect(validateConfig(c).ok).toBe(false);
    const d = currentConfig();
    d.weeks[0].date = "2026-02-30";
    expect(validateConfig(d).ok).toBe(false);
  });
});
