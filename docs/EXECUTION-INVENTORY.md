# Execution & documentation — what the site does today

*A recount of everything in the site that is about documenting and strategising execution: tasks and planning, the focus timer, time tracking, habits, the plan-tomorrow / plan-the-week flows, reviews, reminders and nudges. Written from the code (file names in `code` so each claim can be checked) and from `docs/GUIDE.md`. Built for planning the next version, so Part C lists the seams and gaps I found, and Part D the levers. Where I have not verified something it says so.*

---

## Part A — The map

### A1. The day, as it runs now

```
 night before                 morning                          through the day                      evening
 ─────────────                ───────                          ───────────────                      ───────
 ◑ Plan tomorrow  ──────▶  morning card → wake time →  ┌ Pending (duties) ─ nudges ─ reminders ┐   ☾ Evening review
   (6 steps, incl.          dream → check-in            │ Today's plan (intent, 3, first move) │     rings, set-point,
   "Shape tomorrow"        (Looking inward)             │ Focus: sittings, stretches, parked,  │     what got done,
   time blocks)                                         │   distractions                        │     plan vs actual
 🗓 Plan the week ──▶ week card on Today (stage,       │ Today's tasks (do-date driven)        │   ◑ Plan tomorrow …
   (6 steps, stages,   goals, progress)                 │ Habit rings + account of the missed   │
   goals→tasks)                                         └───────────────────────────────────────┘
```

Six **views** of Today (`TODAY_VIEWS` in `09-today.js`): **Execution**, **Looking inward**, **Tasks**, **Habits**, **Review**, **Time tracking**. The last four are whole rooms drawn under Today's head (`todayRoomRender`).

### A2. Where the data lives (stores and the objects in them)

| What | Where | Shape (key fields) |
|---|---|---|
| Tasks | `S.tasks` (array store) — `newTask`, `migrateTasks` in `17-tasks.js` | `id, text, day` (due), `doDay`, `doEnd` (a stretch of do-days), `done, doneAt, notes, order, listId, tags, priority, duration` (**minutes**), `subtasks[]` (each with `minutes`, `done`), `repeat`, `milestoneId, timeCat, shop, remind, links` |
| Planner state | `S.planning` — `planState()` in `17-planning-data.js` | `lists[]` (+ `folders, tags, smartLists, reminders`), `prefs` (view, span, sort, group, calMode…), `timer` config, `timerLive` (the running sitting), `focusSessions[]` |
| Lists | `S.planning.lists[]` | `name, color, folderId, listType (task/project/skill), priority, importance (core/supporting/background), activeFrom, description, targetHoursPerWeek, targetWeeks, milestones[], sections[], kanbanColumns` |
| Milestones | `list.milestones[]` | `id, name, date, prepFrom, status (open / in-progress / on-track / prepared / slipping), statusOverride, done, doneAt, winNote` |
| Wins | `S.wins` (add-only intent) | milestone label, early/late days, hours invested, reflection |
| Focus sittings | `S.planning.focusSessions[]` + live `timerLive` | start/end, task, sub-task, breaks (each with a note), stretches, notes, parked count |
| Time entries | `S.timeEntries` — `timeState`, `timeEntryDefaults` in `19-time-data.js` | `startTime, endTime` (**null = running**), `categoryId, what, tags, linkedType/Id/Label` (score, vision, project, person, skill, task, deck, journal), `source` (timer/manual/auto), `feature`, `notes[], entryIds[]` — length is *derived* from the two times, never stored |
| Time categories | `S.time` | 16 defaults (piano, japanese, meditation, writing, reading, exercise, work, social, spiritual, study, creative, errands, commute, meal, rest, tasks), user-editable; 5 are room-fed |
| Time blocks (plan) | `S.timeBlocks` (store, DB v22) | `id, date, start, end, kind (task/habit/break/meal/commute/label), label` — written by "Shape tomorrow" |
| Day plan | `S.plans[date]` — `dayPlan()` in `16-rhythm.js` | `why, intentions[3], firstMove, risk, protect, energyHigh, energyLow, ifThen, letGo, habitIntentions{}, items[], capacity, planned` |
| Week plan | `S.weekPlans[weekStart]` — `weekPlan()` | `theme, outcomes[]` (goals, each with `taskIds[]`), `periods[]` (stages with days, focus, taskIds), `wins[]` (+why), `risks[]` (+prevent), `energyBudget` |
| Month plan / review | `monthPlan()`, `monthReview()` | theme + review fields (lighter than the week) |
| Habits | `S.habits` — `habDefaults()` in `17-habits-data.js` | building or breaking; why/vision/identity; `cue, environment, specificTime, freq{type,count}, difficulty, min` (worst-day version), `ideal, preRitual, postRitual, progression[], personalBest, milestones[], links{values,skills,projects}, linkedRooms[], timeCat/timeMins`; breaking: `replacement, harm, reframe, protocol, triggers[], urgeLog[]` |
| Habit log | `S.habitLog[date][habitId]` | status + miss reason + note (`habSetEntry`, `habStatus`), plus period accounts for weekly/monthly habits (`habAccounts`) |
| Daily check-in / review log | `S.checkins[date]`, `S.reviewLog[date]` | `wakeAt`, intention, set-point, `eveningFlowAt`, closedAt, note |
| Reviews | `S.reviews` + cycle log | weekly / monthly / quarterly / half / annual written reviews, each a guided flow |
| Duties | `DUTIES` registry + `S.duties*` — `16-duties.js` | 25 recurring routines with time windows relative to your median wake/sleep (see B3) |
| Nudges | `S.nudgeDismiss`, `S.settings.nudgeDisabled` — `16-nudges.js` | snooze (30 min) / not today / permanent per nudge id |
| Parked thoughts, distractions | `parkedAll()` in `09-parked.js`, `dxAll()` in `09-distractions.js` | kind (todo/note/idea/look-up/worry), settled state; distraction text + count + counter-measure |
| Settings that govern execution | `S.settings.*` | `wakeTime, sleepTime, dayStartTime, availableHoursPerDay, trackingNudgeMinutes, sleepPromptAt, dayBoundaryHour` (4 AM), clock options, todayView |

---

## Part B — Function by function

### B1. Capturing and organising tasks (`17-tasks.js`, `17-planning-*.js`)

**Capture**
- **Quick-add grammar** (`parseQuickTask`, `17-planning-parse.js`): `tomorrow / friday / 15 Jan`, `at 2pm`, `!high`, `#tag`, `^List`, `~45m`, `*daily / *weekly / *every 2 weeks`, `/ description`. Shows what it understood before committing (`quickParsePreviewHTML`).
- Quick-add exists in the planner, on Today (`bindQuickTask`), and from the global **＋** (`18-add.js`). Anything unplaced goes to the **Inbox**.
- **Shopping list** (`17-planning-shop.js`): comma-split items, basket, kept out of dated views. **Reminders** (`17-planning-reminders.js`, `17-planning-remind.js`): dated (and optionally timed) one-liners that sit on Today and float over every page until ticked; browser notification once at the time if permitted.
- **Parked thoughts** (`09-parked.js`): one-line capture during a sitting (hotkey `P`), kinds by prefix; each can become a task, a journal "unfinished thought", be let go, or be ticked.
- **Bulk import** (`18-import.js`) — the Import Station; the *general* spreadsheet import (#262/#263) is **paused**, not built.

**Organise**
- Lists in **folders**; **tags**; **smart lists** (Today, Tomorrow, Next 7 days, All, Completed — `planSmartFilter`); a **filter** modal (list, tag, priority, dates, steps) and saved quick filters (`openPlanFilterModal`, `openPlanQuickFilter`).
- A list has a **type** (task / project / skill), **priority**, **importance**, a start date (`activeFrom` — a not-yet-active list sits under "Future" and is meant to be hidden from live views), **target hours/week × weeks** (a stated commitment), a description, **sections**, and **milestones**.
- **Projects** were folded into lists (`17-planning-projects.js`: `planListMakeProject`, `projectTaskRefs`); legacy project phases still surface as tasks (`allTaskRefs`).
- **Batch actions** on a ticked set (`planBatchBarHTML`), drag-reorder (`bindPlanTaskReorder`), row menu, undoable delete (`requestDelete`).

**Three views of the same work** (`17-planning-views.js`, `17-planning-page.js`)
- **Matrix** (Eisenhower; default). Quadrants: do first / schedule / delegate / let go; drag between; an **Inbox tray** of unplaced tasks (resizable). The "delegate" quadrant also carries `waiting`; `deepWork` is a flag with a badge.
- **List** — ordered, grouped (by list when over "All"), drag to reorder.
- **Calendar** — month / week / day; drag a task to a day; **stretches** drawn across days; a calendar day opens `openDayPage` (day record).
- Keys: `N` add, `1/2/3` view, `T` today, `E` first task, `F` focus timer, `S` stats, `?` help (`17-planning-keys.js`, `planning` binds).

**A task, opened** (`17-planning-detail.js`)
- Title, done, priority (4 dots), **due** (+ time), **do-on** (the day you will sit down with it — what puts it on Today), **to** (a stretch of do-days), **starts** (cannot begin before).
- List/section, shopping and reminder switches (with "show it from"), **time category**, **milestone**, tags, **duration estimate**, markdown notes, **Additional**, **subtasks** (each timed and ticked on its own), **repeat** (`planRollRecurrence`), and the **record of sittings** on it.
- Estimate flows into the timer (the "45m" chip starts a countdown on that task from anywhere — `bindTaskTimers`, `taskEstHTML`). `taskEstOf` sums sub-task minutes, else uses `duration`; `taskSpentOn` reads the sittings back ("13m of 15m").

**Milestones** (`17-planning-page.js`, `17-planning-data.js`)
- A dated strip (`planMilestoneLineHTML`) above every view and, folded, at the top of every Today view (next seven days, with a skill's level-due-by date on the same line). One press narrows to that milestone's work; two presses (or ✎) open it. Status ladder with an **auto "slipping" flag** (`planMilestoneSlipCheck`: remaining estimate vs hours available at the list's weekly commitment) and a **celebration + win note** on "prepared" (`openMilestoneCelebration`, `winCardHTML`).
- **List commitment** popover (`planListCommitmentData`): open tasks, estimated total, unestimated count, next/final milestone, required vs actual hours per week, and a verdict (ahead / behind / on-track / unknown). `planSuggestImportance` suggests core/supporting/background.

**Do-dates and "carried over"** (`taskDatesOn`, `taskDoCovers`, `tasksForDay`)
- Today's tasks = do-day covers today, or due today with no do-day, or finished today (so unplanned wins count). **Carried over** = open work from earlier days; **Bring to today** moves the do-day only, never the due date. **Not today** gives up only today of a stretch.

### B2. Today's Execution view (`09-today.js`)

In page order (all of it is *view-specific* except the head):
1. **Head, every view**: milestones line · date/season/moon · "yesterday you set out to…" · **I woke up at** (never auto-filled) · **record a dream / none** · reminders due · sealed letters due · "where today went" one-liner (`timeTodaySay`).
2. **Switch + jump index** (sticky). Jumps per view: Execution — plan, focus, tasks, habits, before you sleep; Inward — check-in, theatre, sacred space, unfinished.
3. **Auto-prompts / nudge slot** (`todayAutoPromptsHTML`, `nudgeQueue`).
4. **Pending** duty list (`dutyQueueHTML`) — see B3.
5. **Today's plan** — the why, three intentions, first move, risk (from last night), plus the **week card**: theme, goals with progress, the win, and **which stage you are in** (`weekPeriodOn`).
6. **Focus** section (`focusSectionHTML`) — clock, ledger, stretches, parked, distraction sheet (B4).
7. **Today's tasks** — "2 of 5 done", bonus count, list filter chips, per-row ›/✎/estimate/✦✧ compulsory-vs-bonus/not today/×, **pull in**, **carried over**; the section tick is the "tasks reviewed" morning step, timestamped.
8. **Study and Tree cards**; **today's habits** (rings + account of the unsaid); **skill milestones within 30 days**; **time spent writing**.
9. **Time-block strip** (`S.timeBlocks` for today, `09-today.js` ~571).
10. **Before you sleep**: ◑ Plan tomorrow, 🗓 Plan the week (highlighted Sunday evening), ☾ Evening review, review chips for cycles closing.
11. **I went to sleep at —** at the foot; "Ready to close the day?" late at night.

Looking inward (execution-adjacent): the **check-in** (set-point, intention; mood/energy fields were removed), **Morning Theatre**, sacred space, unfinished thoughts.

### B3. Duties, nudges, reminders — three overlapping prompting systems

- **Duties** (`16-duties.js`): `DUTIES` is a registry of 25 routines — wake log, dream, morning card, morning practice, theatre, habit rings, stillness, jazz daily plan, study deck, tree tending, learning-studio recall, clock sitting, values snapshot, people attention, weekly review, plan the week, plan tomorrow, evening review, monthly review, finance log, seasonal / half-year / annual review, sealed letters, decisions due. Each has: label, **anchor + route**, a **window** defined relative to *your median wake/sleep* (`dutyMedianWake/Sleep`, `dutyWindowFor`), a recurrence, `skipDone` (auto-detect done: `_dutyDoneCheck`), `notify`, `defaultOn`. State: upcoming → **due** → **overdue** → done / snoozed / dismissed (`dutyState`). Surfaced as the **Pending** list and a count (`dutyPendingCount`); buttons: → go, +30m snooze, × skip today. Overdue labels paint onto the real sections (`dutyUpdateUI`, every minute).
- **Nudges** (`16-nudges.js`, **three** implemented): *close-day* (past wind-down, evening flow not done, tomorrow unplanned), *clock-idle* (nothing tracked for N minutes during waking hours; default 45), *wake-unlogged* (an hour past wake time). One at a time; snooze 30 min / not today / permanent; per-id disable in Settings.
- **Reminders** (`17-planning-reminders.js`): the task-as-reminder; floating list (`mountRemindFloat`), browser notification (`planCheckReminders`).
- **Review chips** (`16-reviewsdue.js`): week / month / quarter / half / year closing → a chip until done or dismissed for that period (`reviewsDue`, `cycleDismissed`).

### B4. The focus timer and the sitting (`17-planning-tools.js` `FocusTimer`, `09-focus*.js`, `19-time-focus.js`)

- **One timer, held outside any render** (survives navigation, tab close and reload; a stopwatch past 6 h is closed at 6 h; a countdown that expired while closed is written as ending when it expired). State in `planState().timerLive`.
- **Modes**: **countdown** (default 25 min focus / 5 short / 15 long / long break after 4; auto-start breaks on, auto-start focus off) and **stopwatch** (counts up, never ends itself, no break handed out). Mode locks while it runs.
- **Starting**: drag a task onto the clock; press a task's estimate chip; start with no task; from a task's panel. Starting stops any other running clock first and says so. **Changing task mid-sitting** closes the sitting and opens a new one.
- **Pause = break**: asks what it is for; a "what are you actually doing?" field while running; both are **multi-line notes written as it happens**. **Stretches**: Return in that field closes a timed stretch (from the last mark), the clock keeps running; each stretch becomes its own time entry.
- **Where it shows**: the **sidebar dock** (`09-focus-dock.js`; floats as a small circle on every page while running; bubble with peek), the **Focus section** on Today, the **focus desk** (focus mode `Z` on Today/Tasks: stopwatch + today's tasks + notes + parked pocket), the planner's timer panel.
- **Finishing the task** ends the sitting, books minutes against the task, fireworks (`celebrateFinish`, `endSittingWithACheer`).
- **Ledger** (`focusLogHTML`): today's sittings with times, length, task, what was done, every break and note, **how many thoughts were parked** during each.
- **Parked** (`09-parked.js`) and **Distraction cheat sheet** (`09-distractions.js`): the latter counts repeats, stores a counter-measure per distraction, **flashes at the start of every sitting** (most frequent first, tick each as cleared; auto-dismisses), "handled" archives one.
- **Agreement with time tracking** (`19-time-focus.js`): a sitting is *always* a set of time entries — each unbroken stretch its own finished entry, under the task's time category, named for the task — re-synced every minute and at every pause/mark/end (`timeSyncFocus`, `timeRepairFocus`, `focusTimeAgreement`). A user-corrected entry is never rewritten; a deleted one is not restored. Parts under 30 s are dropped.
- **Statistics** it feeds (`planStatsHTML`): intervals, focus today, where the focus went, ninety days of focus, estimate-vs-actual, "from writing it to doing it".

### B5. Time tracking (`19-time-*.js`)

- **Model**: one entry with `endTime: null` *is* the running clock; length is derived; rounding (1/5/15 min) only at display. Runaway guard at 6 h.
- **The pill/dock** (`19-time-widget.js`): press for an immediate unlabeled start, or pick description + category; survives page changes. **＋ Start the clock**, **＋ A sitting after the fact** (start defaults to the end of the day's last sitting, else the wake time; searchable category and journal-entry-type pickers; `timeStartingPoint`).
- **Rooms start it for you** (`timeAutoStart/Stop`, `19-time-bridges.js`): stillness, study-deck review, writing sessions, practice at a score (`TIME_FED_BY_ROOM`). Two rules: never start a second clock; never stop one it didn't start. Settings → *The clock*: walking into a room starts it (on/off), corner timer visible, default category.
- **Views** (`19-time-page.js`): **Day** (midnight-to-midnight bar, untracked hours drawn not hidden), **Week** (seven stacked), **Reports** (by category / link; trend), **Categories** editor. Review shows 12-week hours tracked, "hours made use of", and sleep + waking-day bars (`09-sleepbars.js`, `09-position.js` `timeUseHTML`, `weekShapeHTML`).
- **Bridges** (what a sitting feeds): project → a nod in it (`timeMakeNod`); skill → hours (`timeCreditSkill`); person → an interaction (`timeMakeInteraction`); **habit** → a habit with `timeCat` + `timeMins` is *met by the hours* (`timeHabitMet`, `timeHabitShare` — the ring fills, no tick); list → `timeOnList`; reviews get a three-line summary (`timeReviewLines`). Corrections propagate rather than add.
- **Sleep**: wake/bed times (`timeBedOn`, `timeSleepNight`, `timeSleepBlocks`), a bedtime ask (`maybeAskBedtime`), a day-boundary hour so a 1 a.m. entry belongs to the day you were living.

### B6. Habits (`17-habits-*.js`, `16-rhythm.js` rings, `18-habit-area.js`)

- **Two kinds**: *building* (cue, set-up, before/after rituals, worst-day minimum, ideal, progression by week, personal best, identity, reward, accountability) and *breaking* (replacement, harm, reframe, protocol, a **trigger map** with intensity and strategy, an **urge log**).
- **Frequency**: daily, specific weekdays, **N per week / per month** — `habRhythm`: daily habits are answerable per day; weekly/monthly ones are answerable for the **period, once it closes** (`habPeriodsToAccount`, `openHabitPeriodAccount`), so a 3×/week habit is never scolded for the other four days.
- **Check-in** (`openHabitCheckIn`): kept / partial / not kept, with **miss reasons** (Ran out of time, Too tired, Forgot, Chose something else, Not where I could, Unwell) + note. **The account** (`habAccounts`, `habUnaccountedOn`): Today lists the habits you have said nothing about.
- **Rings** (`habitRingHTML`, `habitRingsRow`, `habitPartialMenu`) on Today and in the evening review (a ring fills the moment it is pressed). **Habit fixtures** (`habitFixtureHTML`, `habFixturesForRoom`) put a habit's ring/streak/next milestone inside the room it is linked to (`linkedRooms`: Stillness, Japanese… partially wired; the regex name-matching it replaces still exists as a fallback).
- **Three views**: Dashboard (cards; filter by kind/category), Today (due, grouped by time of day), Analytics (90-day heat, **health score** = 60 % rate + 20 % consistency + 20 % trend, milestones, longest runs). Also 12-week grid, oscillation and chain views (`habit8wHTML`, `habitChainsHTML`).
- **Streaks and milestones**: 7 / 21 / 30 / 60 / 90 / 365 (`habCheckMilestones`), celebration (`habCelebrate`, `celebrateStreak`).
- **Retire** at 21 held days (`habRetireReady`, `habRetire`, can come back); **archive** for stopped habits.
- Links to Values and Skills; `18-habit-area.js` is nearly empty (the planned area pages were not built).

### B7. Planning ahead

**◑ Plan tomorrow** (`planMyDay`, `16-rhythm.js`, 6 steps)
1. *What is tomorrow for?* — one sentence + yesterday for reference.
2. *The three* — three intentions (one may be empty).
3. *What from the week is tomorrow's? / Anything waiting?* — the stage's work first, then the rest of the week's, then undated tasks grouped by list; milestones and "in focus" skills/pieces shown with how long since each was touched; **capacity bar** (committed minutes vs `availableHoursPerDay`); estimate chips.
4. **Shape tomorrow** — a vertical time-block timeline from wake to sleep: tasks placed in order from the day-start time, drag to move, drag the edge to resize (snap), add break/meal/commute/label, **energy band** from "high at / low at", over-capacity warning. Saved to `S.timeBlocks`.
5. *Habits* — those due, with an optional time each (`habitIntentions`).
6. *What does tomorrow start with?* — first move, protect, energy high/low, obstacle + **if–then**, let-go; recap.
Appears the next morning as **Today's plan**. Needs `wakeTime/sleepTime/dayStartTime/availableHoursPerDay` in Settings.

**🗓 Plan the week** (`openWeeklyPlan`, 6 steps) — theme; **goals** (any number) with the work each gathers (add tasks right there with do/due/estimate/priority; milestones alongside); **the week in stages** (cut into 1–3+ spans; each stage has days, a name, purpose, and *its share of the work*; a task can be in two stages; shows work in no stage yet); **wins** (each with why); **risks** (each with prevention); name + recap. Result: goal progress (`weekGoalProgress`), stage progress (`weekPeriodProgress`), shown daily on Today and in the day-planning step.

**Monthly** — `openMonthlyPlan` (theme) and `openMonthlyReview`; lighter than the week. **Quarter / half / year** exist as reviews only (no forward plan flow).

**Evening plan-vs-actual** — the evening flow shows `S.timeBlocks` for the day beside the time actually tracked (`16-reviewflows.js` ~113). Time blocks do **not** yet start the clock, and do **not** raise a "did this happen?" prompt (the planned nudges 6–8 are unbuilt).

### B8. Reviews and statistics (`16-review*.js`, `16-reviewflows.js`, `17-planning-tools.js`)

- **Guided reviews** (`guidedFlow`): morning, evening (daily), weekly, monthly, quarterly, half-year, annual — each step pre-filled with what the house knows (`reviewGather`, `periodDigest`, `tasksReviewHTML`); ends "anything else worth capturing?"; filed as journal entries (`reviewMakeEntry`, `reviewSyncJournal`).
- **The Life Tape** (`flowTapeStep`, `16-lifetape.js`): everything lived, merged by date, six zooms, ‹ › navigation.
- **The Days**: every day you put something into, with a one-line summary ("1/1 done · 1h 15m focused · 0/2 kept · 2 written").
- **Statistics** (`planStatsHTML`): finished today, kept to the date, overdue, writing-to-doing delay, focus today / this week / 30 days / 90 days, intervals, wins, milestone status counts, breakdown by priority / list / tag (the "day scored" tile, `planProductivityScore`, was taken out in the execution overhaul).
- **Position** (`09-position.js`): Maslow-seven and Spiral scores computed from habits, sleep, time, skills, writing, people, runway — "where am I right now?".

### B9. Cross-room execution hooks

Time ↔ projects/skills/people/habits (B5); Study Deck five-minute offer on Today; Knowledge Tree tending cards and **Learning Studio** recall (`lsTodayHTML`) as Today duties; Jazz Studio daily plan and Repertoire practice start the clock; the Writing Studio and Content Studio create "Write: …" tasks; Reading export / morning card for an outside reader.

---

## Part C — Seams, gaps and inconsistencies (what I found)

*Evidence-based; "unverified" where I did not run it. Resolved and corrected by `docs/EXECUTION-PHASE0.md` (read that for the latest).*

**Planning model**
1. **Three planning vocabularies for one day.** A task has `day` (due) and `doDay/doEnd`; a day plan has `intentions[3]` (free text) and a legacy `items[]` (`est` in **hours**); the week plan holds `taskIds` per goal/stage; time blocks hold their own `label`s. Only the do-date drives Today. The "three that matter" are *text*, not references to tasks, so completing a task never ticks an intention.
2. **Estimate field drift.** Tasks store `duration` in **minutes**; `planListCommitmentData` reads `t.est || t.duration` as the same unit; the legacy day-plan panel stores `est` in hours (`EST_OPTIONS`). `renderPlanPanel` has no callers (dead code — verify before removing); `p.items` plan items are a separate list from tasks.
3. **Time blocks are write-only.** Written by "Shape tomorrow", drawn on Today and in the evening review — but they do not start timers, do not become tasks' do-times, do not move when the day slips, and there is no calendar/day-view editing after the plan step. Tasks have no start-time field except `due` time.
4. **No task dependencies, no waiting-on dates, no templates/recurring plans, no checklist templates** (grep: none). `waiting` and `deepWork` are flags only. Repeats exist (`*daily`, `*every 2 weeks`) but there is no "repeat from completion vs from due" choice I could find (unverified).
5. **Kanban is vestigial** — `kanbanColumns` still in every list but no view uses it.
6. **List "activeFrom" hiding** was designed to keep future lists out of Today/smart lists/matrix/search; only the sidebar "Future" group and the activation banner are confirmed — verify the rest (unverified).
7. **Weekly goal ↔ task link is one-way text of ids.** Progress is computed, but a goal cannot be given a measurable target, a deadline, or a link to a milestone/skill/value.
8. **Quarter / half / year have reviews but no plans**; there is no "objectives → projects → tasks" ladder, no OKR-like cascade, and no yearly theme feeding down.

**Time tracking & focus**
9. **Two sources of time, one of them already derived.** *(Phase 0 refinement: the focus sitting record is the source of truth and the tracker's focus entries are projections of it; the second clock is every non-focus timer — the pill's unlabeled start and room-started clocks — which are plain rows with no sitting behind them. See `EXECUTION-PHASE0.md`.)* Original note: The focus timer (a state machine in `FocusTimer` + `timerLive`) and the time tracker (rows with `endTime:null`) are kept in agreement by `timeSyncFocus` every minute and on every event. It works, but it is the most intricate subsystem and the source of most prior bugs.
10. **Estimates are not learned.** Estimate vs actual is *displayed* ("13m of 15m", writing-to-doing delay) but no estimate is suggested from history, and the day-capacity bar uses raw estimates.
11. **Categories are flat and per-task single-valued**; no project/client dimension, no billable flag, no tags on tasks flowing to entries (entries have `tags` but the task→entry path only sets category and link — unverified).
12. **No idle/away detection and no automatic capture** (by design: "no network, no analytics"), so untracked time is shown honestly but never inferred or prompted beyond the idle nudge.
13. **Reports are views, not exports**: no CSV/ICS/print export of time or tasks that I could find (the backup is JSON); no goals for time (target hours per category per week) except per-list `targetHoursPerWeek` and per-habit `timeMins`.
14. **Pomodoro rounds and the "break" notion** exist in the countdown mode, but breaks are free-form notes — no break suggestions, no longest-streak or focus-quality metric beyond parked-thought count.

**Habits**
15. **No scheduled reminders for habits** (reminders exist only for tasks); habit "time of day" is used for grouping, not alerting.
16. **Habit ↔ task is loose**: a habit can be linked to values/skills/rooms and credited by tracked hours, but cannot spawn or be fulfilled by a task, and "stacking after another habit" is a text field, not a chain the UI enforces (unverified).
17. ~~`18-habit-area.js` is a stub~~ **Corrected in Phase 0:** it is a real 212-line feature (routes `#/habit-area/:category` and `#/habit-detail/:id`, linked from the Habits dashboard). Habit fixtures in rooms are half-wired (Stillness, Japanese; the regex fallback remains).
18. **No streak protection** (freeze/grace) — deliberate (the design is "accounts, not scolding") but a lever to decide on.

**Prompting**
19. **Three prompt systems that don't share a queue** (duties → Pending, nudges → one slot, reminders → floating list + banner). Only 3 of the 8 designed nudges exist; "start the next block", "did this happen?", "habit milestone near", "person in a time label" do not.
20. **Three truths for the start of the day** (Phase 0): `checkins[d].wakeAt`, `dailyRhythm[d].wakeTime` (copied once, then independent) and `settings.wakeTime`.

**Surface and cost**
21. **Today carries a lot above the fold** (milestones, head, switch, jump index, nudge, pending) — partly fixed in the latest update, but at 800 px tall the Execution view's own content still starts around 270 px down.
22. **Dense data entry**: a habit has ~35 fields; plan-tomorrow is 6 steps; the week plan is 6 steps with sub-flows. Good for depth, heavy for a bad day; there is no "quick plan" path (**unverified**: whether a one-step fast path exists).
23. **Performance**: the engine re-renders whole sections on change (`rerender`); fine today, but any version that adds live timelines or drag-heavy calendars will need partial updates.

---

## Part D — Levers for the next version (my read, to argue with)

Ordered by how much of Part C each removes:

1. **One planning object.** Make the day a *plan of references* — tasks, habits, time blocks — instead of three vocabularies: an intention points at a task or goal; a block points at a task/habit and carries its own do-time; completing the target ticks the line.
2. **Make time blocks live.** Start/stop from a block; drift handling ("this ran long — push the rest / drop one"); a day view where blocks, tracked time and the clock are one canvas; auto "did this happen?" at block end; plan-vs-actual as a first-class score.
3. **Learn estimates.** Per-list / per-category actual-vs-estimate ratios, suggested estimates and a day-capacity bar that uses them; a weekly "planning accuracy" line in the review.
4. **One prompt queue.** Merge duties, nudges and reminders into a single ranked, explainable queue with the same snooze/skip semantics, then finish the designed nudges (block start, habit near-milestone, unplanned tomorrow, overdue milestones).
5. **Close the loop upward.** Plans for quarter/half/year; goals with measures and deadlines; goal→milestone→list→task ladder; a weekly "alignment" read (hours and tasks per goal vs intended).
6. **Habits that can act.** Reminders, a "minimum version" quick-tick, linking a habit to a recurring task or block, stacking that actually chains, optional grace rules, per-habit time goals tied to the clock.
7. **Dependencies and waiting.** Task dependencies, "waiting on" with a chase date, templates for repeated projects/routines, checklists.
8. **A fast lane.** A one-screen "plan my day in 60 seconds" and "re-plan from here" after a derailed afternoon; the guided flows become the slow, deep lane.
9. **Get data out.** CSV/ICS/print for time, tasks, habits; weekly digest file; calendar export of blocks.
10. **Retire the vestigial.** Kanban fields, `renderPlanPanel`, `p.items`, `18-habit-area.js`, the old regex name-matching — decide, then delete behind a migration.

---

## Part E — Quick reference: where to read the code

| Topic | Start here |
|---|---|
| Task model, do-dates, Today's task list | `src/17-tasks.js` |
| Planner (lists, milestones, smart lists, stats data) | `src/17-planning-data.js`, `17-planning-page.js`, `17-planning-views.js`, `17-planning-bind.js`, `17-planning-detail.js` |
| Quick-add grammar | `src/17-planning-parse.js` |
| Focus timer state machine, stats, habit panels (older), commitment | `src/17-planning-tools.js` |
| Focus section, dock, ledger, estimates, celebrations | `src/09-focus.js`, `09-focus-dock.js` |
| Parked thoughts, distractions | `src/09-parked.js`, `09-distractions.js` |
| Time data, bridges, focus sync, widget, page | `src/19-time-data.js`, `19-time-bridges.js`, `19-time-focus.js`, `19-time-widget.js`, `19-time-page.js` |
| Habits data / views / binds | `src/17-habits-data.js`, `17-habits-views.js`, `17-habits-bind.js` |
| Plan tomorrow / week / month, rings, day plan model | `src/16-rhythm.js` |
| Reviews and cycles | `src/16-reviewflows.js`, `16-review.js`, `16-reviewsdue.js`, `16-lifetape.js` |
| Duties, nudges, reminders | `src/16-duties.js`, `16-nudges.js`, `17-planning-reminders.js`, `17-planning-remind.js` |
| Today page assembly | `src/09-today.js` |
| Position/Maslow/week shape | `src/09-position.js`, `09-sleepbars.js` |
| Settings that govern execution | `src/17-map-settings.js` |
| Plain-language description of all of this | `docs/GUIDE.md` §5–§11, §26 |
