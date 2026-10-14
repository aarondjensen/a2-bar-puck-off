export const TARGET = 21;
export const MAX_SCORE = 99;

// A match is played to 21 and cannot end level. The winner may overshoot 21,
// so the only rules are a whole number in range, no tie, and a winner at 21 or more.
export function validateScore(a, b) {
  const ok = (n) => Number.isInteger(n) && n >= 0 && n <= MAX_SCORE;
  if (!ok(a) || !ok(b)) return { ok: false, error: "Enter both scores" };
  if (a === b) return { ok: false, error: "No ties" };
  if (Math.max(a, b) < TARGET) return { ok: false, error: `Winner needs ${TARGET}` };
  return { ok: true };
}

// A stored result belongs to the two teams named on it. This returns that team's score,
// or null when the result is for a different pairing (a playoff slot that has since changed).
export function scoreFor(result, teamId) {
  if (!result) return null;
  if (result.a === teamId) return result.scoreA;
  if (result.b === teamId) return result.scoreB;
  return null;
}

export function resultFits(result, a, b) {
  return !!result && ((result.a === a && result.b === b) || (result.a === b && result.b === a));
}
