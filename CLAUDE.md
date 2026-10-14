# A2 Bar Puck Off

Web app for a six-team doubles shuffleboard league (a2barpuckoff.com). Director: TJ.
Vite + React, Firestore for shared results, Vercel for hosting. Code is written by Aaron with Claude.

## Working agreement

- **Land it, don't ask.** Build the change and merge it; `git revert` is cheap. Ask only
  when the change can fail where nobody can see it: a score that silently doesn't save,
  `firestore.rules`, anything a revert doesn't undo, or work that is inert until deployed.
  Flag once, at the point of merging.
- **Ship the control, not the explanation.** No helper text under a control. Text only for
  a destructive confirm, a format that can't be guessed, or a rule of this event.
- **One task, one branch, one squashed PR.** Rebase on `origin/main` (never merge main in),
  land through a PR with `--squash --delete-branch`, never reuse a branch across sessions.
- Before every commit: `npm test` and `npm run build` pass.

## The league (rules TJ set)

- Six teams, double round robin, five sessions of six matches (12/4, 1/8, 2/5, 3/5, 4/9),
  playoffs 5/7. Each team plays twice a session, never the same opponent twice in a night,
  and the first round robin finishes before the second starts. `lib/schedule.js` is fixed
  data; `schedule.test.js` proves those rules, so re-run it before touching the table.
- Matches go to 21 and need only a final score. **Anyone may submit; only the admin may
  change or remove one after.** That is enforced by `firestore.rules` (create for anyone,
  update/delete for `admins/{uid}`), not by the UI. Admin signs in with email and password (Firebase Auth; no Google or Apple).
- Standings: wins, then fewest losses, then point differential over completed matches;
  still level → points scored → schedule order (TJ didn't specify beyond differential).
- Playoffs: seeds 1-6 read live from the standings, 1 and 2 on a bye, double elimination
  (`lib/bracket.js`). A reset final is played only if the losers-bracket team wins the first.
  A stored playoff result whose teams no longer match its slot (an earlier score was
  corrected) is treated as unplayed and shows "Awaiting admin".
- Dates are `YYYY-MM-DD` strings, never parsed with `new Date(str)` (see `lib/dates.js`).

## Firebase

With no `VITE_FIREBASE_*` set the app uses browser localStorage, where "Admin" is just a
switch. That is for development only; nothing is shared between phones. Set all four vars
(`.env.example`) to use Firestore. Use a scratch project for development, never the live one.
Admin accounts are made by hand: Authentication → Users → Add user, then an `admins/{uid}` document with that uid. There is no sign-up screen. Deploy the app
first and `firestore.rules` second.
