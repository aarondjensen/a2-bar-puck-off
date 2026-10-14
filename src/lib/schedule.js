import { TEAMS } from "./teams.js";

// Six teams, double round robin, five sessions, six matches a night.
//
// Every session is a single six-cycle through the teams: each team plays twice and
// never the same opponent twice in a night. Each night's first three matches are one
// pairing of the cycle and the last three are the other, so a team plays once in each
// half. Sessions 1-2 are the first round robin; the 3 pairs it leaves over open
// session 3, which is why that night's first half is the end of round robin one and
// its second half the start of round two. No pair meets on consecutive nights.
// Entries are indexes into TEAMS. schedule.test.js proves every rule above.
const NIGHTS = [
  { date: "2026-12-04", matches: [[0, 1], [2, 3], [4, 5], [1, 2], [3, 4], [0, 5]] },
  { date: "2027-01-08", matches: [[0, 2], [4, 1], [5, 3], [2, 4], [1, 5], [3, 0]] },
  { date: "2027-02-05", matches: [[0, 4], [1, 3], [2, 5], [0, 1], [2, 3], [4, 5]] },
  { date: "2027-03-05", matches: [[0, 2], [1, 4], [3, 5], [2, 1], [4, 3], [5, 0]] },
  { date: "2027-04-09", matches: [[0, 3], [1, 5], [2, 4], [3, 1], [5, 2], [4, 0]] },
];

export let PLAYOFF_DATE = "2027-05-07";
export const setPlayoffDate = (d) => { PLAYOFF_DATE = d; };

export const SESSIONS = NIGHTS.map((night, i) => ({
  n: i + 1,
  date: night.date,
  matches: night.matches.map(([a, b], j) => ({
    id: `s${i + 1}-m${j + 1}`,
    session: i + 1,
    a: TEAMS[a].id,
    b: TEAMS[b].id,
  })),
}));

export const REGULAR_MATCHES = SESSIONS.flatMap((s) => s.matches);
