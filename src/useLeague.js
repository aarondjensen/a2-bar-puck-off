import { useEffect, useMemo, useState } from "react";
import { createStore } from "./lib/store.js";
import { computeStandings } from "./lib/standings.js";
import { resolveBracket } from "./lib/bracket.js";

export function useLeague() {
  const [store, setStore] = useState(null);
  const [results, setResults] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let off = [];
    let alive = true;
    createStore()
      .then((s) => {
        if (!alive) return;
        setStore(s);
        off = [s.subscribe(setResults), s.onAdmin(setIsAdmin)];
      })
      .catch((e) => alive && setError(e.message));
    return () => { alive = false; off.forEach((f) => f()); };
  }, []);

  const standings = useMemo(() => computeStandings(results), [results]);
  const bracket = useMemo(
    () => resolveBracket(standings.map((r) => r.id), results),
    [standings, results],
  );
  return { store, results, isAdmin, error, standings, bracket };
}
