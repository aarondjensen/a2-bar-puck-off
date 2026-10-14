import { useState } from "react";
import { formatDate } from "../lib/dates.js";

// Shown to the director when every score of the next week is in. Finalizing moves the
// week to Completed, advances the schedule and counts its results in the standings.
export default function FinalizePrompt({ week, store }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function finalize() {
    setBusy(true);
    const r = await store.finalizeWeek(week.n);
    setBusy(false);
    if (!r.ok) { setError(r.error); setConfirm(false); }
  }

  return (
    <section className="card finalize">
      <p className="warn">
        {confirm
          ? `Finalize ${formatDate(week.date)}? Standings will update.`
          : `${formatDate(week.date)}: all scores are in`}
      </p>
      <div className="actions">
        {confirm ? (
          <>
            <button className="btn" disabled={busy} onClick={finalize}>Finalize</button>
            <button className="btn ghost" onClick={() => setConfirm(false)}>Back</button>
          </>
        ) : (
          <button className="btn" onClick={() => setConfirm(true)}>Finalize week</button>
        )}
      </div>
      {error && <p className="err">{error}</p>}
    </section>
  );
}
