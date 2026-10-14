import { useEffect, useState } from "react";
import SignIn from "./views/SignIn.jsx";
import { useLeague } from "./useLeague.js";
import Schedule from "./views/Schedule.jsx";
import Scores from "./views/Scores.jsx";
import Standings from "./views/Standings.jsx";
import Playoffs from "./views/Playoffs.jsx";
import Admin from "./views/Admin.jsx";

const TABS = [
  ["schedule", "Schedule"],
  ["scores", "Scores"],
  ["standings", "Standings"],
  ["playoffs", "Playoffs"],
];
const ADMIN_TAB = ["admin", "Admin"];

export default function App() {
  const league = useLeague();
  const [tab, setTab] = useState(() => {
    const h = location.hash.slice(1);
    return [...TABS, ADMIN_TAB].some(([k]) => k === h) ? h : "schedule";
  });
  const [signingIn, setSigningIn] = useState(false);
  const tabs = league.isAdmin ? [...TABS, ADMIN_TAB] : TABS;
  const shown = tab === "admin" && !league.isAdmin ? "schedule" : tab;
  useEffect(() => {
    if (!signingIn) return;
    const onKey = (e) => e.key === "Escape" && setSigningIn(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [signingIn]);
  const go = (k) => { setTab(k); history.replaceState(null, "", `#${k}`); };

  if (league.error) return <p className="boot">{league.error}</p>;
  if (!league.store) return <p className="boot">Loading…</p>;

  return (
    <div className="shell">
      <header className="top">
        <h1 className="brand"><img className="logo" src="/logo.png" alt="A2 Bar Puck Off" /></h1>
        {league.user ? (
          <button className="link" onClick={() => league.store.signOut()}>
            Sign out
          </button>
        ) : (
          <button className="link" onClick={() => setSigningIn(true)}>Sign in</button>
        )}
      </header>
      {signingIn && !league.user && (
        <div className="modal" onClick={() => setSigningIn(false)}>
          <div role="dialog" aria-modal="true" aria-label="Sign in" onClick={(e) => e.stopPropagation()}>
            <SignIn store={league.store} onDone={() => setSigningIn(false)} />
          </div>
        </div>
      )}
      <main className="page">
        {shown === "schedule" && <Schedule {...league} />}
        {shown === "scores" && <Scores {...league} onSignIn={() => setSigningIn(true)} />}
        {shown === "standings" && <Standings {...league} />}
        {shown === "playoffs" && <Playoffs {...league} />}
        {shown === "admin" && <Admin key={JSON.stringify(league.config)} {...league} />}
      </main>
      <nav className="tabs">
        {tabs.map(([k, label]) => (
          <button key={k} className={shown === k ? "on" : ""} onClick={() => go(k)}>{label}</button>
        ))}
      </nav>
    </div>
  );
}
