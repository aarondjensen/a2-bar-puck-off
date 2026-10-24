// Last season's 30 results, from the league spreadsheet: winner, loser, loser's score.
// Every winner scored 21. Five of this year's six teams played (the sixth, TBD, is new), and
// the odds use these games lightly as a starting point; see PARAMS.priorWeight in odds.js.
const RESULTS = [
  ["born-to-puck", "exquisite-hangers", 4],
  ["puck-buddies", "puck-and-cover", 7],
  ["puck-buddies", "exquisite-hangers", 10],
  ["born-to-puck", "puck-and-cover", 9],
  ["born-to-puck", "pucked-from-the-start", 16],
  ["pucked-from-the-start", "puck-buddies", 9],
  ["puck-and-cover", "pucked-from-the-start", 9],
  ["exquisite-hangers", "pucked-from-the-start", 4],
  ["puck-buddies", "born-to-puck", 18],
  ["puck-and-cover", "exquisite-hangers", 14],
  ["pucked-from-the-start", "exquisite-hangers", 14],
  ["born-to-puck", "puck-buddies", 6],
  ["puck-and-cover", "exquisite-hangers", 19],
  ["born-to-puck", "puck-and-cover", 16],
  ["pucked-from-the-start", "puck-and-cover", 20],
  ["exquisite-hangers", "puck-buddies", 20],
  ["pucked-from-the-start", "puck-buddies", 7],
  ["puck-and-cover", "puck-buddies", 12],
  ["exquisite-hangers", "born-to-puck", 14],
  ["born-to-puck", "pucked-from-the-start", 13],
  ["born-to-puck", "puck-buddies", 8],
  ["exquisite-hangers", "pucked-from-the-start", 6],
  ["puck-and-cover", "pucked-from-the-start", 13],
  ["puck-buddies", "exquisite-hangers", 18],
  ["puck-and-cover", "exquisite-hangers", 18],
  ["puck-and-cover", "born-to-puck", 16],
  ["pucked-from-the-start", "puck-buddies", 19],
  ["puck-and-cover", "puck-buddies", 16],
  ["born-to-puck", "exquisite-hangers", 17],
  ["pucked-from-the-start", "born-to-puck", 18],
];

export const LAST_SEASON = RESULTS.map(([a, b, loserScore]) => ({ a, b, scoreA: 21, scoreB: loserScore }));
