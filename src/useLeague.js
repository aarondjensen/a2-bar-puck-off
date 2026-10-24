import { useEffect, useMemo, useState } from "react";
import { createStore } from "./lib/store.js";
import { computeStandings } from "./lib/standings.js";
import { SESSIONS } from "./lib/schedule.js";
import { resultFits } from "./lib/scoring.js";
import { buildOdds } from "./lib/odds.js";
import { REGULAR_MATCHES } from "./lib/schedule.js";
import { TEAMS } from "./lib/teams.js";
import { playoffMatchId } from "./lib/bracket.js";
import { resolveBracket } from "./lib/bracket.js";
import { applyConfig } from "./lib/config.js";

export function useLeague() {
  const [store, setStore] = useState(null);
  const [results, setResults] = useState({});
  const [auth, setAuth] = useState({ user: null, isAdmin: false, isMember: false });
  const [config, setConfig] = useState(null);
  const [finalized, setFinalized] = useState(() => new Set());
  const [error, setError] = useState(null);

  useEffect(() => {
    let off = [];
    let alive = true;
    createStore()
      .then((s) => {
        if (!alive) return;
        setStore(s);
        off = [
          s.subscribe(setResults),
          s.onAuth(setAuth),
          s.subscribeWeeks(setFinalized),
          // Applied in place before the state change so the re-render reads the new names and dates.
          s.subscribeConfig((c) => { applyConfig(c); setConfig(c); }),
        ];
      })
      .catch((e) => alive && setError(e.message));
    return () => { alive = false; off.forEach((f) => f()); };
  }, []);

  // Standings count only weeks the director has finalized.
  const standings = useMemo(
    () => computeStandings(results, SESSIONS.filter((s) => finalized.has(s.n)).flatMap((s) => s.matches)),
    [results, finalized],
  );
  // The next week to finalize, once all six of its scores are in.
  const pendingWeek = useMemo(() => {
    const next = SESSIONS.find((s) => !finalized.has(s.n));
    return next && next.matches.every((m) => resultFits(results[m.id], m.a, m.b)) ? next : null;
  }, [results, finalized]);
  const bracket = useMemo(
    () => resolveBracket(standings.map((r) => r.id), results),
    [standings, results],
  );
  // Lines are rebuilt from every posted result, so they move after each game, not each week.
  const odds = useMemo(() => {
    const playoffGames = bracket.matches
      .filter((m) => m.a && m.b)
      .map((m) => ({ id: playoffMatchId(m.id), a: m.a, b: m.b }));
    return buildOdds(results, [...REGULAR_MATCHES, ...playoffGames], TEAMS.map((t) => t.id));
  }, [results, bracket]);
  return { store, results, config, finalized, pendingWeek, odds, user: auth.user, isAdmin: auth.isAdmin, isMember: auth.isMember, error, standings, bracket };
}
