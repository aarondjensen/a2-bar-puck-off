import { useEffect, useMemo, useState } from "react";
import { createStore } from "./lib/store.js";
import { computeStandings } from "./lib/standings.js";
import { resolveBracket } from "./lib/bracket.js";
import { applyConfig } from "./lib/config.js";

export function useLeague() {
  const [store, setStore] = useState(null);
  const [results, setResults] = useState({});
  const [auth, setAuth] = useState({ user: null, isAdmin: false });
  const [config, setConfig] = useState(null);
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
          // Applied in place before the state change so the re-render reads the new names and dates.
          s.subscribeConfig((c) => { applyConfig(c); setConfig(c); }),
        ];
      })
      .catch((e) => alive && setError(e.message));
    return () => { alive = false; off.forEach((f) => f()); };
  }, []);

  const standings = useMemo(() => computeStandings(results), [results]);
  const bracket = useMemo(
    () => resolveBracket(standings.map((r) => r.id), results),
    [standings, results],
  );
  return { store, results, config, user: auth.user, isAdmin: auth.isAdmin, error, standings, bracket };
}
