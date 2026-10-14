import { useState } from "react";
import SignIn from "./views/SignIn.jsx";
import { useLeague } from "./useLeague.js";
import Schedule from "./views/Schedule.jsx";
import Scores from "./views/Scores.jsx";
import Standings from "./views/Standings.jsx";
import Playoffs from "./views/Playoffs.jsx";

const TABS = [
  ["schedule", "Schedule"],
  ["scores", "Scores"],
  ["standings", "Standings"],
  ["playoffs", "Playoffs"],
];

export default function App() {
  const league = useLeague();
  const [tab, setTab] = useState(() => {
    const h = location.hash.slice(1);
    return TABS.some(([k]) => k === h) ? h : "schedule";
  });
  const [signingIn, setSigningIn] = useState(false);
  const go = (k) => { setTab(k); history.replaceState(null, "", `#${k}`); };

  if (league.error) return <p className="boot">{league.error}</p>;
  if (!league.store) return <p className="boot">Loading…</p>;

  return (
    <div className="shell">
      <header className="top">
        <h1>A2 Bar Puck Off</h1>
        {league.user ? (
          <button className="link" onClick={() => league.store.signOut()}>
            {league.isAdmin ? "Admin · Sign out" : "Sign out"}
          </button>
        ) : (
          <button className="link" onClick={() => setSigningIn((v) => !v)}>Sign in</button>
        )}
      </header>
      {signingIn && !league.user && (
        <SignIn store={league.store} onDone={() => setSigningIn(false)} />
      )}
      <main className="page">
        {tab === "schedule" && <Schedule />}
        {tab === "scores" && <Scores {...league} onSignIn={() => setSigningIn(true)} />}
        {tab === "standings" && <Standings {...league} />}
        {tab === "playoffs" && <Playoffs {...league} />}
      </main>
      <nav className="tabs">
        {TABS.map(([k, label]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => go(k)}>{label}</button>
        ))}
      </nav>
    </div>
  );
}
