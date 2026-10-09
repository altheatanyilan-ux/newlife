# Execution overhaul — Phase 0 report (reconnaissance; no code changed)

*Answers the brief's Phase 0: confirm or correct each Part C finding in `EXECUTION-INVENTORY.md`, resolve the "unverified" items, and propose a technical plan for Phases 1–9. Everything below is read from the code (no code run). Where I only read and did not reproduce, it says "from code".*

---

## 1. The four items the brief told me to verify

| Question | Answer | Where |
|---|---|---|
| **Does a fast plan path exist?** | **No.** `planMyDay` is always the six-step flow; the only entry points are the Today buttons (`#planTomorrow`, `#planStart`, `#planRedo`). The only "quick" thing is a one-line add into the legacy plan-items list (below), which is not the tasks. | `16-rhythm.js:505`, `09-today.js:885`, `16-rhythm.js:489` |
| **How are repeats anchored?** | **Both ways exist.** Patterns `daily / weekly / monthly / yearly` count from the task's **due day** (`t.day`); the pattern `after_completion` counts from **today** (the haircut case). Completing a repeat books a *copy* and the old one stops repeating. **Likely bug (from code, reproduce first):** the copy carries `doDay`/`doEnd` over **unshifted**, so the next occurrence can arrive with a do-date already in the past and show up as "carried over". | `17-planning-data.js:624 planNextDue`, `:646 planRollRecurrence` (`doDay:t.doDay, doEnd:t.doEnd`) |
| **Do task tags reach time entries?** | **No.** A focus sitting's entry gets `what`, `categoryId`, and the task link only (`focusEntryFields`). `e.tags` exists on entries but is only ever set by hand. Also a naming split: a task's category is `t.timeCategory`, a habit's is `h.timeCat`. | `19-time-focus.js:67`, `19-time-data.js:192`, `17-planning-data.js:111`, `17-habits-data` / `16-rituals.js:161` |
| **How far does list `activeFrom` hiding reach?** | **Honoured:** smart lists Today / Tomorrow / Next 7 / All (`activeOrInbox` in `planSmartFilter`), Today's task pool, the plan-tomorrow pool, `17-tasks.js:645`, the sidebar ("Future" group), the commitment total, and a new task in a future list defaults its do-date to `activeFrom`. **Not honoured:** folder, tag and saved-smart-list selections (`planSelectionTasks`), `allTaskRefs()` consumers (search, time-start pickers, week-plan "find by name"), and anything fed by those (calendar/matrix when the selection is a folder or tag). | `17-planning-data.js:327–335`, `09-today.js:333`, `16-rhythm.js:435`, `17-planning-data.js:415–433` |

## 2. Part C, finding by finding

**Confirmed (as written):** 3 (time blocks write-only), 4 (no dependencies/templates; repeats resolved above), 5 (Kanban vestigial — fields `kanbanColumns` per list and `kanbanColumn` per task are still written by `planSetDone`, task copies, the seed file `19-planning-seed.js:77`, but no view reads them), 7, 8, 10, 12, 13 (no CSV/ICS; JSON backup only), 14, 15 (no habit reminders), 18, 19 (3 of 8 nudges), 22 (no fast lane), 23.

**Corrected or sharpened:**

- **#1 (three planning vocabularies) is really five ways to say "when/what":** `S.timeBlocks` (the plan's blocks), **`S.dailyRhythm[d].blocks`** (a *retrospective* "claim this stretch" log tagged intentional/wasted — `09-position.js:449`, drawn in the sleep bars `09-sleepbars.js:102`), **`task.at` / `habit.at` + `S.events`** (the old rhythm day page: `dayBlocks`/`moveBlock`, `16-rhythm.js:145–159`, with `task.est` in *hours*), the day plan's text intentions and legacy `items[]`, and time entries themselves. The brief says "No start-time field: the hour lives on blocks" — **`task.at` exists today**, so Phase 1/6 needs a decision about the old day page (see Questions).
- **#2 (estimate units):** confirmed, and wider: `dayBlocks` reads `task.est || 1` as hours; `planListCommitmentData` reads `est || duration`. `renderPlanPanel` (`16-rhythm.js:429`) **has no callers** — dead, together with `p.items`, `EST_OPTIONS`, `planQuick`, `planPull`, `planWeekly/Monthly` buttons inside it.
- **#9 (two clocks) — the brief's premise needs refining.** The sitting record (`planState().focusSessions`, live copy `timerLive`) is **already** the source of truth for focus work, and the tracker's entries are *projections* rewritten from it (`timeSyncFocus`), called from `logSession` (every minute, pause, mark, end) and from `timeFollowFocus` (subscribed to `FocusTimer`) and `timeRepairFocus` (widget mount). The real second clock is every **non-focus** timer: the pill's unlabeled start, and rooms via `timeAutoStart/Stop` — those are plain `timeEntries` rows with `endTime:null` that the sitting model knows nothing about. So Phase 2 is "make *those* sittings too", not "delete a sync job". The minute-by-minute write is the live-part projection, and removing it means the live part must be read, not stored.
- **#16 (stacking):** `habit.stackAfter` is **already a habit id**, shown as a chip and cleaned up on delete (`17-habits-bind.js:224, 318`). Phase 4.4 only needs the "Next: …, start?" card, not a field migration.
- **#17 (`18-habit-area.js` is a stub) is wrong.** It is a real 212-line feature: routes `#/habit-area/:category` and `#/habit-detail/:id`, linked from the Habits dashboard (`17-habits-views.js:75`). **Do not retire it in Phase 1 without your say-so.**
- **#20 (two wake truths) is three:** `checkins[d].wakeAt` (what "I woke up at" writes), `dailyRhythm[d].wakeTime` (copied *once* from the check-in, then independent — `09-position.js:36`; used by the sleep bars), and `settings.wakeTime` (the plan-tomorrow timeline and the duty fallback). Duty windows use the median of `wakeAt` with the setting as fallback (`16-duties.js:45–63`).
- **#11:** the tags finding above resolves the "unverified" there.

**New findings (not in the inventory):**

- **A. Time entries ignore `dayBoundaryHour`.** `timeDayOf()` uses calendar midnight; `today()` uses the 4 AM boundary (`04-core.js:48`). So a 1:30 AM sitting is filed on the *new* calendar day while Today still says the previous day, and an entry crossing the boundary is never split. House rule 9 is therefore **not met today**; it is a Phase 1 item.
- **B. The sync exchange works on whole units** (a whole store, or one meta key), clashes when both sides changed, and writes a safety copy first (`19-sync.js`). Two consequences: new stores are included automatically (it reads every store), but the granularity matters — the live sitting sits inside `meta:planning` (lists, prefs, `focusSessions`, `timerLive`), so a timer running on one device makes that unit "changed" on every exchange. **Recommendation:** give sittings their own store in Phase 2 rather than growing `planning`.
- **C. Backup/restore:** every store must be in `DB_SCHEMA` + `ARRAY_STORES` (or `META_KEYS`); `build.js` already fails the build if one is missing, which is the safety net for rule 8. DB is at v22 (`timeBlocks`).
- **D. `dailyRhythm` blocks use "intentional / wasted"** (and legacy `hoursUsed/hoursWasted`). That vocabulary conflicts with house rule 3 (not a scoreboard) — see Questions.
- **E. Field-name drift** to normalise in Phase 1: task `timeCategory` vs habit `timeCat`; `t.title || t.text` (the focus code defends against both); `isCompleted` (subtasks) vs `done`.

## 3. Technical plan, Phases 1–9

Conventions for every phase: one commit per logical change; DB version bump + non-destructive migration; new stores added to `DB_SCHEMA`/`ARRAY_STORES` (the build guard checks); GUIDE updated; a smoke test per phase; stop and report.

**Phase 1 — Foundations** *(low risk, mostly mechanical)*
- *Estimate unit:* migrate `p.items[].est` (hours) and any `task.est` → `duration` minutes; `taskEstOf` stays; fix `planListCommitmentData`; delete `renderPlanPanel` + `EST_OPTIONS` + `p.items` after confirming zero callers (done above) and moving anything the day page needs. Files: `16-rhythm.js`, `17-planning-tools.js`, `17-planning-data.js`, `09-focus.js`.
- *Day start/end helper:* `dayStart(d)` / `dayEnd(d)` = logged `checkins.wakeAt`/bed time → else `settings`; make `rhythmDay().wakeTime` derive from it (stop the one-time copy) and point `dutyMedianWake/Sleep`, plan-tomorrow, sleepbars at it. Files: `16-duties.js`, `09-position.js`, `09-sleepbars.js`, `16-rhythm.js`.
- *Day boundary:* one `timeDay(iso)` that applies `dayBoundaryHour`, used by `timeDayOf`, `timeOnDay` and aggregations; entries crossing the boundary are **split at read** (not rewritten), so corrected entries are never touched (rule 10).
- *Retire leftovers behind a migration:* Kanban fields (`kanbanColumns`, `kanbanColumn`) — strip on migrate, stop writing; keep regex habit matching (as the brief says).
- *Partial re-rendering:* targeted `paint*` paths for the focus section, timestrip/day bar. The dock already does this (`paintFocusDock`, `paintTimeDock`); extend the pattern to `focusSectionHTML` and the `09-today.js` blocks strip.
- *Risk:* the day-boundary change touches every time total (Day/Week/Reports, habit `timeHabitMet`, reviews). Mitigation: one helper, tested against a fixture with entries at 23:50, 00:10, 03:59, 04:01.

**Phase 2 — One clock** *(highest risk — the past source of bugs)*
- Promote the sitting record to cover **every** timer: add `source/feature/categoryId/link` to the record, give sittings their own store (`sittings`), keep `timerLive` as the single running state. The pill's unlabeled start = a sitting with no target; `timeAutoStart/Stop` open/close sittings with `source:'auto'` and the "never start a second / never stop one you didn't start" guard.
- `timeEntries` become a ledger written **at events** (start, pause, mark, end, correction), not every minute; the *running part* is read from the sitting by every view (pill, dock, Today section, desk). Replace `timeSyncFocus`'s minute re-sync and `timeFollowFocus`'s live-row creation with event-driven writes; keep `timeRepairFocus`'s logic as the on-load repair.
- Migration: existing `focusSit/focusFrom` entries are already tied to records; non-focus entries stay as they are (they become "closed sittings" lazily). The `edited`/`focusTimeSkip` correction rules carry over unchanged.
- *Testing the clock:* a deterministic harness using Playwright's `page.clock` (fake time) driving `FocusTimer` through: start → reload mid-sitting → pause/resume → Return mark → end; countdown expiring while the page is closed; 6-hour runaway; <30 s part; a room starting a clock while a sitting runs (refused) and the reverse; a user-edited entry surviving a re-sync; a deleted entry not coming back. For each, snapshot `{focusSessions, timeEntries}` **before and after the change** and require identical *finished* entries (the acceptance test in the brief). Existing suites to keep green: `smoke277–279`, `smoke233`, `smoke207`, `smoke186/187/193` (all reference `FocusTimer`/`timeSyncFocus`).
- *Risk:* two truths during migration; a partially-written sitting on reload. Mitigation: write the sitting first, ledger second, and make the ledger writer idempotent (key = sitting id + part start, as `focusSit/focusFrom` already is).

**Phase 3 — Stretches with kind and verdict** — extend `segments[]` in the sitting (the brief's fields) and the entry projection; pause opens a break stretch (`FocusTimer` pause path), planned-break countdown + overrun split (dock paints "+Nm"), the one-tap verdict (add-only: `verdict`, `verdictAt`), chips in Settings → The clock. Distraction → breaking-habit `urgeLog` link (`09-distractions.js` → `habit.urgeLog`). Risk: pause semantics change (a pause today is a "break" with a free-text note) — migrate old breaks to `kind:'break'` stretches.

**Phase 4 — Habits × clock** — add `countsAs`, `thresholdMin`, `completedBy` (sitting id); migrate each regex match to a *proposed* link shown one by one (code reuses the existing match functions in `16-stillness.js`, `jaCredit`, `19-time-bridges`); `timeHabitMet` re-evaluates from the ledger on any entry edit/delete (it is already a pure read — the new part is storing *which* sitting completed it and "partial, not miss" handling); "Start the minimum" button; "Next: [stacked habit]" card (field already a reference); the limiting-habits register is a new store. Risk: the regex fallback is load-bearing for old data, so it stays until you confirm each link.

**Phase 5 — Session lifecycle** — preflight card (replaces the cheat-sheet flash `dxFlash`), margin-based countdown length, overtime display, close-out card with required "pick up here", Kolb reflection every 3rd sitting on the same skill/project. Mostly UI over the Phase 2/3 record; new stores: environment checklist. Risk: the preflight must never block starting — skip is recorded.

**Phase 6 — One planning object and the timestrip** *(largest UI)* — extend `S.timeBlocks` with `ref/durationMin/marginMin/bufferMin/state/source`; day-plan `intentions[]` → references (migrate text intentions to `{text}` with no ref, never lose them); replace "Shape tomorrow" with the board; placement computed not stored (ink/pencil/window/ghost) in a pure function with a unit test fixture; live blocks hook into the Phase 7 queue; plan-vs-actual component shared with the evening flow. Decision needed on the old rhythm day page (`task.at`, `S.events`, `dailyRhythm.blocks`) — see Questions. Risk: drag/resize on touch and keeping it fast — needs partial re-render (SVG/DOM positioned by transform; no full `rerender()` per pointer move).

**Phase 7 — One prompt queue** — one ranked `promptQueue(T)` over duties (`16-duties.js`), nudges (`16-nudges.js`), reminders (`17-planning-reminders.js`), review chips (`16-reviewsdue.js`); one dismissal model (snooze 30 m / not today / per-period / disable) migrating `S.nudgeDismiss` + duty dismissals; each item carries `rule`. New nudges listed in the brief are pure functions over the stores (cheap to test). Habit reminders: browser notifications reusing `planAskNotifyPermission`.

**Phase 8 — Time view** — new components (Glance, Breakdown, Trend, Ledger) in SVG/DOM, no libraries; category `kind/parentId/valueId` migration with sensible defaults (e.g. `meal/rest → restore`, `commute/errands → maintain`); shared with Review. `planProductivityScore` untouched pending your answer.

**Phase 9 — Learning, goals, reviews, export** — estimate ratios (≥10 sittings), `timeIntentions` and performance-goal stores, review additions, CSV/ICS/print generated locally via Blob downloads.

## 4. Where partial re-rendering is needed

| Surface | Today | Plan |
|---|---|---|
| Focus section on Today | whole-section repaint on timer events (`focusSectionFollow`) | paint only the clock face + current stretch; list re-renders on mark/pause/end |
| Dock / pill | already partial (`paintFocusDock`, `paintTimeDock`) | keep; feed both from the same state getter |
| Timestrip / day bar | full re-render on any change | positioned elements updated by transform; rebuild only on structural change |
| Planning board (Phase 6) | n/a | pointer-move updates a single block element; commit on pointer-up |
| Pending/queue list | `dutyUpdateUI` every minute | repaint rows whose state changed |

## 5. Questions (the brief says to ask before these)

1. **`18-habit-area.js` is not a stub** (area pages + habit detail, linked from the dashboard). Keep it, fold it into the Habits room later, or delete it?
2. **The old rhythm day page** (`openDayPage`, `dayBlocks`, `task.at`, `habit.at`, `S.events` calendar) and **`dailyRhythm.blocks`** ("used intentionally / wasted" claims): keep as is until Phase 6, migrate into `S.timeBlocks`/entries, or remove? The "wasted" vocabulary conflicts with house rule 3.
3. **Day boundary for time entries (finding A):** OK to split entries at the 4 AM boundary at *read* time (stored times untouched)? Or store split entries?
4. **Sittings in their own store** (finding B) — agree, instead of keeping them inside `planning`?
5. **Repeat bug** (`doDay/doEnd` not shifted): fix in Phase 1 as a small separate commit once reproduced?
6. **Phase 1 order:** I propose (a) day-boundary + wake helper, (b) estimate units, (c) retire leftovers, (d) partial re-render — so the riskiest (a) gets the most test time. OK?

Nothing has been changed in the code. Waiting for your go-ahead (and answers to 1–6) before Phase 1.
