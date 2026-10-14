import { TEAMS } from "./teams.js";
import { SESSIONS, PLAYOFF_DATES, setPlayoffDates } from "./schedule.js";

// What the director can change: team names and players, and the dates. The season is
// exactly as many regular-season dates as there are sessions (the matchups are fixed, so
// a regular-season date is just when a session is played) plus one or more playoff dates. Team ids,
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

// The form edits one list of weeks; it is stored as the regular dates plus the playoff dates.
export function currentConfig() {
  return {
    teams: TEAMS.map((t) => ({ id: t.id, name: t.name, players: [...t.players] })),
    weeks: [
      ...SESSIONS.map((s) => ({ date: s.date, kind: "regular" })),
      ...PLAYOFF_DATES.map((d) => ({ date: d, kind: "playoffs" })),
    ],
  };
}

export function toStored(cfg) {
  const byDate = [...cfg.weeks].sort((a, b) => a.date.localeCompare(b.date));
  return {
    teams: cfg.teams.map((t) => ({ id: t.id, name: t.name.trim(), players: t.players.map((p) => p.trim()) })),
    dates: byDate.filter((w) => w.kind === "regular").map((w) => w.date),
    playoffs: byDate.filter((w) => w.kind === "playoffs").map((w) => w.date),
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
  if (!cfg.weeks.every((w) => realDate(w.date))) return { ok: false, error: "Fill in every date" };
  if (new Set(cfg.weeks.map((w) => w.date)).size !== cfg.weeks.length) return { ok: false, error: "Two weeks share a date" };
  const { dates, playoffs } = toStored(cfg);
  if (dates.length !== SESSIONS.length) {
    return { ok: false, error: `The season needs exactly ${SESSIONS.length} regular season dates` };
  }
  if (playoffs.length < 1) return { ok: false, error: "Add a playoffs date" };
  if (playoffs.length > 6) return { ok: false, error: "Six playoff dates at most" };
  if (playoffs[0] <= dates[dates.length - 1]) return { ok: false, error: "Playoffs come after the last regular season date" };
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
  // An older save stored a single `playoff` string.
  const po = Array.isArray(cfg.playoffs) ? cfg.playoffs : cfg.playoff ? [cfg.playoff] : [];
  if (po.length && po.every(realDate)) setPlayoffDates(po);
}
