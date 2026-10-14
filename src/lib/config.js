import { TEAMS } from "./teams.js";
import { SESSIONS, PLAYOFF_DATE, setPlayoffDate } from "./schedule.js";

// What the director can change: team names and players, and the session dates. Team ids,
// the matchups and the number of sessions are fixed (schedule.js), so scores already
// stored stay attached to the right teams. A saved config is applied over the defaults
// by mutating TEAMS and SESSIONS in place, so every view that reads them sees the change.
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const realDate = (s) => {
  if (!YMD.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
};

export function currentConfig() {
  return {
    teams: TEAMS.map((t) => ({ id: t.id, name: t.name, players: [...t.players] })),
    dates: SESSIONS.map((s) => s.date),
    playoff: PLAYOFF_DATE,
  };
}

export function validateConfig(cfg) {
  for (const t of cfg.teams) {
    if (!t.name.trim()) return { ok: false, error: "Every team needs a name" };
    if (t.name.trim().length > 30) return { ok: false, error: "Team names are 30 letters at most" };
    if (t.players.some((p) => !p.trim())) return { ok: false, error: `${t.name.trim()} needs two players` };
    if (t.players.some((p) => p.trim().length > 30)) return { ok: false, error: "Player names are 30 letters at most" };
  }
  const names = cfg.teams.map((t) => t.name.trim().toLowerCase());
  if (new Set(names).size !== names.length) return { ok: false, error: "Two teams share a name" };
  const all = [...cfg.dates, cfg.playoff];
  if (!all.every(realDate)) return { ok: false, error: "Fill in every date" };
  for (let i = 1; i < all.length; i++) {
    if (all[i] <= all[i - 1]) return { ok: false, error: "Dates must run in order, playoffs last" };
  }
  return { ok: true };
}

export function applyConfig(cfg) {
  if (!cfg) return;
  for (const c of cfg.teams || []) {
    const t = TEAMS.find((x) => x.id === c.id);
    if (t && typeof c.name === "string" && c.name.trim()) {
      t.name = c.name.trim();
      if (Array.isArray(c.players) && c.players.length === 2) t.players = c.players.map((p) => String(p).trim());
    }
  }
  if (Array.isArray(cfg.dates) && cfg.dates.length === SESSIONS.length && cfg.dates.every(realDate)) {
    cfg.dates.forEach((d, i) => { SESSIONS[i].date = d; });
  }
  if (realDate(cfg.playoff)) setPlayoffDate(cfg.playoff);
}
