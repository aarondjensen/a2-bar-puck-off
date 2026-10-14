import { teamById } from "../lib/teams.js";

const SRC = (src) =>
  src.seed ? `Seed ${src.seed}` : src.winner ? `Winner ${src.winner}` : `Loser ${src.loser}`;

function Slot({ team, seed, label, score, won }) {
  return (
    <div className={`slot ${won ? "won" : ""}`}>
      {seed && <span className="seedno">{seed}</span>}
      <span className={team ? "name" : "name muted"}>{team ? teamById(team).name : label}</span>
      {score != null && <span className="pts">{score}</span>}
    </div>
  );
}

function Match({ m, seedOf }) {
  return (
    <div className="bm">
      <div className="bid">{m.id}</div>
      <Slot team={m.a} seed={m.a && seedOf(m.a)} label={SRC(m.slots[0])} score={m.scoreA} won={m.winner && m.winner === m.a} />
      <Slot team={m.b} seed={m.b && seedOf(m.b)} label={SRC(m.slots[1])} score={m.scoreB} won={m.winner && m.winner === m.b} />
    </div>
  );
}

export default function Playoffs({ bracket, standings }) {
  const seedOf = (id) => standings.find((r) => r.id === id)?.seed;
  const by = (side) => bracket.matches.filter((m) => m.side === side);
  const rounds = (side) => {
    const list = by(side);
    const n = Math.max(...list.map((m) => m.round));
    return Array.from({ length: n }, (_, i) => list.filter((m) => m.round === i + 1));
  };

  return (
    <>
      {bracket.champion && (
        <section className="card champ">
          <span className="muted">Champions</span>
          <strong>{teamById(bracket.champion).name}</strong>
        </section>
      )}
      <h2 className="sub"><span>Winners</span></h2>
      <div className="bracket">
        {rounds("winners").map((r, i) => (
          <div key={i} className="col">{r.map((m) => <Match key={m.id} m={m} seedOf={seedOf} />)}</div>
        ))}
      </div>
      <h2 className="sub"><span>Losers</span></h2>
      <div className="bracket">
        {rounds("losers").map((r, i) => (
          <div key={i} className="col">{r.map((m) => <Match key={m.id} m={m} seedOf={seedOf} />)}</div>
        ))}
      </div>
      <h2 className="sub"><span>Final</span></h2>
      <div className="bracket">
        {by("final").filter((m) => !m.reset || m.needed).map((m) => (
          <div key={m.id} className="col"><Match m={m} seedOf={seedOf} /></div>
        ))}
      </div>
    </>
  );
}
