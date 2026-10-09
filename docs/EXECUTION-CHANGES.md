# The execution overhaul — what changed

Everything done since the overhaul document, by phase, then the repairs and the later requests. Every user-visible change is also written up in `docs/GUIDE.md`. Commits are on `claude/commonplace-cross-mapping-refine-5fz5ni`.

House rules held throughout: local only, no AI or network calls, every suggestion states its rule, readings not scores, add-only where it matters, deletes with an undo, new stores and fields in backup/restore and sync with a versioned non-destructive migration, the day boundary respected, the Writing Studio untouched.

## Phase 0 — report (`607a95c`)
The inventory of the execution and documentation functions, with seams and levers (`docs/EXECUTION-INVENTORY.md`).

## Phase 1 — one day, one estimate (`77df2c6`)
- The day boundary is applied when entries are read; stored times are never rewritten. One wake/bed helper.
- Estimates are minutes everywhere; a non-destructive migration.
- The Kanban board is retired. The focus section repaints in part. Repeating do-dates roll with the deadline.

## Phase 2 — one clock
- The pill, the rooms and the focus timer are one clock: a sitting. The day's record is projected from the sitting at its events, not rewritten every minute. A reload mid-sitting is exact.

## Phase 3 — breaks and readings
- A pause opens a break stretch: chips (walk, stretch, snack, water, nap, breathe, messages, phone), a planned length, an overrun that splits the break into the planned part and its overrun, and "still the same?".
- "now:" switches the kind of a stretch (work, admin, leisure, social, break).
- *Meant it · partly · drifted* readings, add-only, with the chip's usual answer suggested; skip is recorded.
- A distraction can be tagged to a breaking habit's urge log.

## Phase 4 — habits counted by the clock
- A habit can count by the clock (`countsAs`, `thresholdMin`); links are proposed and confirmed one by one.
- The ring shows partial progress and the sitting that completed it; start the minimum; stacking that chains.
- The limiting-habits register with trigger states; miss reasons set beside the time. The regex name-matching fallbacks stay, gated.

## Phase 5 — life inside a sitting (`2f47792`)
- A margin on every estimate (25% until learned), shown as "36m + 9m margin".
- A card before a sitting (the least that would make it worth it, the room, what to clear), a stake that is private and never applied.
- A soft chime at the end of the estimate; the countdown runs on as overtime and nothing stops.
- A Kolb reflection offered after three sittings on a subject; a close-out card (pick up here, was the minimum kept).

## Phase 6 — the planning board
- A block is a reference to its work with a length (estimate + margin, then a buffer); ink, pencil and window are worked out, never stored; a ghost on the day a due task would best go, with its reason.
- The day's capacity against waking hours with a 75% cap, the rule shown, never a refusal.
- A day and week board: drag to an hour, to the tray, back to the right (undo); plan in sixty seconds; re-plan from here; protected time; the day's intentions as references with a top two.
- Plan against what happened in the evening review and the Time view.

## Phase 7 — one prompt queue
- Duties, nudges, reminders, block prompts and review chips are one ranked queue on Today, five at a time, each row showing its rule, with the same later / not today / off exits (Settings → Prompts turns kinds back on). Dismissals last the period only.
- New nudges and flags: start the next block, did this happen, a habit near a milestone, tomorrow unplanned, a milestone overdue or slipping, a person named in a time label, unlabelled time, an intention at risk, a list behind its pace, a skill in focus with no hours, a list with no time in fourteen days, estimates running over, break overruns rising, the top two missed three days, protected time used for something else, a reflection put off.
- Habit blocks send a browser notification when permitted, once a day.

## Phase 8 — the Time view
- A period switch (Day/Week/Month/Quarter/Year) with arrows; a glance (tracked, untracked awake, focused, meant it, investing) against your own four earlier periods, like for like for a period not over; one rule-based sentence; the Phase 7 time flags.
- The breakdown by category, list/project, skill, person, habit, value or tag, with a second grouping; clicking a bar narrows the whole page. Value time is split evenly across the values a habit, skill, project or list serves, and says so.
- Twelve periods with a rolling average; the ledger (day bar, week bars, editable entries).
- Categories gain a kind (investing, maintaining, restoring, drift), a parent and a value; a list can say which values it serves.
- A focus-quality panel (start delay, break overruns, restful breaks, distractions an hour, estimates) shared with the Review and the weekly review.
- Process wins ("started when the block said", "estimates held", "restful breaks up three weeks running", "the most time in focus") written once into the wins store.
- "The day, scored" (`planProductivityScore`) was **deleted at your word**.

## Phase 9 — learning, goals, reviews, export (`013e36d`)
- Learned estimates: once ten sittings stand behind a list or category its margin is what your finished tasks say; used by countdowns, blocks, the capacity gauge and ghost placement; a planning-accuracy line in the weekly review; a Settings table and a switch.
- Time intentions (`timeIntentions`, four at most), rings, risk flags with their rules, suggestions from list hours, habit minutes and week goals.
- Performance goals (`perfGoals`): one for the year, three for thirty days, three for fourteen; SMARTER fields and a persona line; read through process signals, never hours; the persona line offered to the Morning Theatre script; a sealed commitment letter.
- Reviews: a system review every two to three weeks (in the queue); a small-gains step in the weekly review; an optional risk worksheet on a decision.
- Export: CSV (time entries, tasks, habits), ICS (planned blocks and dated tasks), the week on a sheet; all local.
- Database v23: new stores `timeIntentions`, `perfGoals`; new saved key `sysReview`; `promptState` (Phase 7) too.

## Later requests
- `planProductivityScore` deleted (`360f3d9`).
- Study Deck: Space only shows the answer; Enter shows then rates Good; the undo chip moved to the lower left, clear of the card and answer buttons (`cefdf30`).

## Failures that were there before, now repaired
A real bug: the Deep-work filter row broke the Inbox matrix layout (the grid fell under the tray); fixed in the code (`smoke184`). The rest were stale expectations: `smoke84`, `94`, `125`, `126`, `178`, `208`, `222`, `233`, `234`, `241`, `245`, `266`, `270` (the migration suites now pin the old builds in history and compare rows, not fields).

## New and changed tests
New: `smoke288`–`smoke296`. Updated: `smoke84`, `88`, `94`, `105`, `109`, `120`, `125`, `126`, `131`, `132`, `147`, `178`, `184`, `200`, `208`, `211`, `222`, `233`, `234`, `236`, `240`, `241`, `245`, `266`, `270`, `276`–`279`, `293`.

## New source files
`09-sitting-life`, `16-planboard-data`, `16-planboard-ui`, `16-planboard-live`, `16-promptqueue`, `16-learned`, `16-intentions`, `16-sysreview`, `17-habits-clock`, `19-time-insight`, `19-time-view`, `19-export`.

## Still open
- A final full sweep is running; `smoke145` failed in it (a sitting on a project task does not name itself) and is being looked at.
- The regex name-matching fallbacks in the habit code stay until you confirm removal.
- The paused bulk-import tasks are untouched.
