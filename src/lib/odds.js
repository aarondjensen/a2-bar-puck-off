// Matchup lines for fun: a moneyline and a point spread for every pairing, rebuilt from the
// results after each game. Display only; nothing here moves money.
//
// Two ratings are fitted to every game played so far, then blended:
//  - Margin: a ridge-regularized Massey rating. Each game says (rating A - rating B) should
//    equal the final margin, so it credits point differential and adjusts for who was played.
//  - Record: a Bradley-Terry rating fitted to wins and losses only, so a team that wins close
//    games still gets credit for the wins.
// Both are pulled toward "everybody is equal" by a prior worth a few games, so one result
// never swings a line far and the lines open at a pick'em. The margin rating turns into a win
// chance with a normal curve whose spread is the league's own game-to-game noise.
//
// Checked against last season's real results (30 games, 5 teams), predicting each game from the
// ones before it: no setting beat a coin flip, and the heavier the pull toward "equal" the better
// it did. Games to 21 swing about 9 points, so a short season says little about who is better.
// The priors are therefore heavy, and last season's games count as a light head start
// (priorWeight) so the opening lines are not all identical.
export const PARAMS = {
  marginPrior: 8,   // ridge strength for the margin rating, in "games of no margin"
  recordPrior: 12,  // ridge strength for the win/loss rating
  sigma0: 9.5,      // prior sd of a game's margin, in points (last season's was 9.4)
  sigmaWeight: 6,   // how many games the prior sigma is worth
  priorWeight: 0.25, // how much one game from last season counts against one from this season
  blend: 0.5,       // share of the margin model in the final win chance
  vig: 0.045,       // book's overround: both sides' implied chances add up to 1 + vig
};

// Solve A x = b for a small dense system by Gaussian elimination.
function solve(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
    x[r] = s / M[r][r];
  }
  return x;
}

// Standard normal CDF (Abramowitz & Stegun 7.1.26).
function phi(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

const logistic = (x) => 1 / (1 + Math.exp(-x));

// games: [{ a, b, scoreA, scoreB }]; ids: the team ids, in any fixed order.
export function fitRatings(games, ids, params = PARAMS) {
  const n = ids.length;
  const ix = new Map(ids.map((id, i) => [id, i]));
  const gs = games
    .filter((g) => ix.has(g.a) && ix.has(g.b))
    .map((g) => ({ a: ix.get(g.a), b: ix.get(g.b), y: g.scoreA - g.scoreB, w: g.w ?? 1 }));

  // Margin rating: (X'X + lambda I) r = X'y.
  const A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? params.marginPrior : 0)));
  const rhs = new Array(n).fill(0);
  for (const g of gs) {
    A[g.a][g.a] += g.w; A[g.b][g.b] += g.w;
    A[g.a][g.b] -= g.w; A[g.b][g.a] -= g.w;
    rhs[g.a] += g.w * g.y; rhs[g.b] -= g.w * g.y;
  }
  const margin = solve(A, rhs);

  // The league's own game-to-game noise, shrunk toward the prior.
  let sse = 0;
  let weight = 0;
  for (const g of gs) { sse += g.w * (g.y - (margin[g.a] - margin[g.b])) ** 2; weight += g.w; }
  const sigma = Math.sqrt((sse + params.sigmaWeight * params.sigma0 ** 2) / (weight + params.sigmaWeight));

  // Record rating: ridge-penalized logistic fit by Newton's method.
  let rec = new Array(n).fill(0);
  for (let it = 0; it < 25; it++) {
    const grad = rec.map((r) => -params.recordPrior * r);
    const H = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? params.recordPrior : 0)));
    for (const g of gs) {
      const p = logistic(rec[g.a] - rec[g.b]);
      const won = g.y > 0 ? 1 : 0;
      grad[g.a] += g.w * (won - p); grad[g.b] -= g.w * (won - p);
      const w = g.w * p * (1 - p);
      H[g.a][g.a] += w; H[g.b][g.b] += w;
      H[g.a][g.b] -= w; H[g.b][g.a] -= w;
    }
    const step = solve(H, grad);
    rec = rec.map((r, i) => r + step[i]);
  }
  return { ids, ix, margin, record: rec, sigma, games: weight };
}

const american = (p) => {
  const v = p >= 0.5 ? -(100 * p) / (1 - p) : (100 * (1 - p)) / p;
  return Math.round(v / 5) * 5 || -100;
};
export const fmtMoney = (v) => (v > 0 ? `+${v}` : `${v}`);
export const fmtSpread = (v) => (v === 0 ? "PK" : v > 0 ? `+${v}` : `${v}`);

// Lines for a vs b. spread is a's handicap (negative when a is the favorite), to the half point.
export function lineFor(rt, a, b, params = PARAMS) {
  const i = rt.ix.get(a);
  const j = rt.ix.get(b);
  const m = rt.margin[i] - rt.margin[j];
  const pMargin = phi(m / rt.sigma);
  const pRecord = logistic(rt.record[i] - rt.record[j]);
  const pA = params.blend * pMargin + (1 - params.blend) * pRecord;
  const pB = 1 - pA;
  // Add the book's edge: scale both implied chances up so they sum to 1 + vig.
  const ia = pA * (1 + params.vig);
  const ib = pB * (1 + params.vig);
  const half = Math.round(m * 2) / 2;
  return {
    pA, pB,
    mlA: american(ia), mlB: american(ib),
    spreadA: half === 0 ? 0 : -half,
    spreadB: half === 0 ? 0 : half,
  };
}

// Convenience: fit from stored results over a list of matches (plus last season's games at a
// reduced weight), then return a lookup.
export function buildOdds(results, matches, ids, params = PARAMS, priorGames = []) {
  const games = priorGames.map((g) => ({ ...g, w: params.priorWeight }));
  for (const m of matches) {
    const r = results[m.id];
    if (!r) continue;
    const ok = (r.a === m.a && r.b === m.b) || (r.a === m.b && r.b === m.a);
    if (!ok) continue;
    games.push(r.a === m.a
      ? { a: m.a, b: m.b, scoreA: r.scoreA, scoreB: r.scoreB }
      : { a: m.a, b: m.b, scoreA: r.scoreB, scoreB: r.scoreA });
  }
  const rt = fitRatings(games, ids, params);
  return (a, b) => lineFor(rt, a, b, params);
}
