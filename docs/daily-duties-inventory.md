# Daily Duties — Phase 0 Inventory

Audit date: 2026-10-04  
Source: exhaustive search of `src/` — not GUIDE.md.

---

## Full inventory

| # | id | Label (as shown in UI) | File / function | Done when | None/skip valid | Recurrence | Proposed window | Default on | Confidence |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `wake_log` | "I woke up at" | `09-today.js` → `openMorningGreeting()`; `16-nudges.js` nudge `wake-unlogged` | `S.checkins[T].wakeAt` truthy | Yes — "not now" / snooze | Daily | 07:00–09:00 | On | CERTAIN |
| 2 | `dream_log` | "I dreamt" / "Nothing came back" | `13-dreams.js` → `dreamStateOn()`, `noDreamOn()`; `09-today.js` → `dreamEdgeHTML()` | State is `'dreamt'` or `'blank'` (not `'unasked'`) | Yes — blank is a first-class answer | Daily | 07:00–09:00 | On | HIGH |
| 3 | `morning_card` | "☀︎ Good morning" / morning tarot draw | `09-morningcard.js` → `shouldDrawMorningCard()` | `S.settings.morningCardOn === T` | Yes — "not today" / "stop asking" | Daily | 07:00–09:00 | On | HIGH |
| 4 | `morning_practice` | "Morning practice" / Begin → flowMorning | `16-reviewflows.js` → `flowMorning()`; `16-reviewsdue.js` cycle `lastMorning` | `reviewDone('lastMorning')` called | Yes — cycle chip can be skipped | Daily | 07:00–09:30 | On | CERTAIN |
| 5 | `plan_tomorrow` | "◑ Plan tomorrow" (intentions + task selection) | `16-rhythm.js` → `planMyDay(d)`; `09-today.js` `#planTomorrow` | `S.plans[tomorrow].intentions.filter(Boolean).length > 0` | Yes — modal closable | Daily (evening) | 21:00–23:00 | On | HIGH |
| 6 | `evening_review` | "Evening review" / flowEvening | `16-reviewflows.js` → `flowEvening()`; `16-reviewsdue.js` cycle `lastEvening`; nudge `close-day` | `reviewDone('lastEvening')` called; `c.eveningFlowAt` set | Yes — nudge snoozable | Daily | 22:00–23:30 | On | CERTAIN |
| 7 | `habit_rings` | Habit rings (one per habit) | `17-habits-data.js` → `habDue()`, `habKept()`; `09-today.js` → `habitRingRow()` | `habKept(h, T)` returns true for each due habit | Yes — partial / resisted valid | Daily (per habit schedule) | Flexible | On | CERTAIN |
| 8 | `theatre_21` | Theatre 21-day ring / "Mark today" | `16-theatre.js` → `theatreDoneToday()`, `theatreMark()` | `S.rehearsal.days.includes(T)` or any session entry dated today | No — missing a day breaks the streak | Daily | Flexible | On | CERTAIN |
| 9 | `stillness_practice` | Stillness / meditation session | `16-stillness.js` → `stillMinutesOn()`, `stillStreak()` | `stillMinutesOn(T) > 0` | Yes — no hard gate | Daily | Flexible | On | HIGH |
| 10 | `study_deck` | "N cards to review" / "five minutes" | `19-sd-e-dialogs.js` → `studyTodayHTML()`; `19-sd-b-sched.js` → `sdDailyUnbury()` | `sdDueCount() === 0` | Yes — skipping defers to tomorrow | Daily when due | Flexible | On | CERTAIN |
| 11 | `knowledge_tree_tend` | "Tend the Knowledge Tree" strip | `19-tree-f-tend.js` → `treeTendItem()`, `treeTodayHTML()` | `treeTendItem()` returns null (nothing due) | Yes — individual items dismissible | Daily when due (ladder: 3/14/60/180/365d) | Flexible | On | HIGH |
| 12 | `ls_recall` | "Recall due: [branch]" strip | `19-ls-a-model.js` → `lsTodayHTML()` | `lsRecalls` entry within 3 days; tray chips cleared | Yes — informational strip | Every 3 days per board | Flexible | On | HIGH |
| 13 | `clock_sitting` | "Nothing being tracked" nudge | `16-nudges.js` nudge `clock-idle`; `09-today.js` 60s interval | `FocusTimer.state().running === true` or last sitting < N min ago | Yes — snoozable / suppress | Continuous waking hours | Waking hours | On | CERTAIN |
| 14 | `weekly_review` | "Weekly review" / flowWeekly | `16-reviewflows.js` → `flowWeekly()`; cycle `lastWeekly` | `reviewDone('lastWeekly')` called | Yes — chip dismissible | Weekly (Sunday) | Sunday | On | CERTAIN |
| 15 | `plan_week` | "Plan the week" | `16-rhythm.js` → `openWeeklyPlan()`; `09-today.js` `#planNextWeek` | No separate completion flag (part of flowWeekly) | Yes | Weekly | Sunday | On | HIGH |
| 16 | `values_snapshot` | Values congruence snapshot | `12-values.js`; `16-reviewflows.js` step in flowWeekly; `19-nav.js` health indicator | Snapshot saved; `snapDays <= 7` | Yes — optional step in weekly review | Weekly | Sunday | On | HIGH |
| 17 | `people_attention` | People needing attention (cadence overdue) | `12-people.js` → `peopleNeedingAttention()`; Today "People" section | `personOverdue(p) === null` for all due contacts | Yes — no hard gate | Per-person variable (daily → annually) | Flexible | On | HIGH |
| 18 | `monthly_review` | "Monthly review" / flowMonthly | `16-reviewflows.js` → `flowMonthly()`; cycle `lastMonthly` | `reviewDone('lastMonthly')` called | Yes — chip dismissible | Monthly (end of month) | End of month | On | CERTAIN |
| 19 | `finance_log` | Finance / income log | `19-nav.js` nav health indicator (`cadence: 'monthly'`) | Finance entry recorded within the month | Yes — informational indicator | Monthly | End of month | Off | MEDIUM |
| 20 | `seasonal_review` | "Seasonal review" | `16-reviewflows.js` → `flowSeasonal()`; cycle `lastSeasonal` | `reviewDone('lastSeasonal')` called | Yes | Quarterly | End of quarter | On | CERTAIN |
| 21 | `half_review` | "Half-year review" | `16-reviewflows.js` → `flowHalf()`; cycle `lastHalf` | `reviewDone('lastHalf')` called | Yes | Every 182 days | June / Dec | On | CERTAIN |
| 22 | `annual_review` | "Annual review" | `16-reviewflows.js` → `flowAnnual()`; cycle `lastAnnual` | `reviewDone('lastAnnual')` called | Yes | Yearly | End of year | On | CERTAIN |
| 23 | `sealed_letters` | "A letter you sealed is now open" | `13-letters.js` → `lettersOpeningNow()` | `openedAt` set on the letter | Yes — user can defer | Event-driven (sealed date reached) | Any | On | HIGH |
| 24 | `decisions_due` | Decision review due | `13-letters.js` → `decisionsDue()` | `reviewedAt` set | Yes — user can postpone | Event-driven (`reviewOn` date) | Any | On | HIGH |
| 25 | `backup_banner` | "Back up your data" | `06-db.js` → `daysSinceBackup()` | Export completed; counter resets | Yes — dismissible per session | Threshold-based | Any | On | HIGH |
| 26 | `jazz_daily_plan` | Jazz practice plan / today's exercises | `19-jazz-f-plan.js` → `jazzTodaysPlan()` | No per-day completion flag confirmed | Yes | Daily | Practice session | Off | MEDIUM |

---

## Excluded (not checkoff duties)

| id | Reason |
|---|---|
| `pinned_passages` | Pure ambient display; no completion state. |
| `tasks_review` | Not a standalone duty — it is a step inside `flowEvening`. |

---

## Found in code but not documented in GUIDE.md

1. **Three-level nudge dismissal** (`S.nudgeDismiss`): snooze 30 min / not today (hides until midnight) / permanent suppress — each is a distinct persisted state.
2. **`shouldGreetMorning()` gap logic** — `WAKE_PROMPT_GAP_H = 5`: the morning greeting fires only if 5 h have elapsed since `lastSeenAt`, preventing it after a short break.
3. **`sdDailyUnbury()`** — silently unbury buried Study Deck cards once per day; gated on `s.lastUnbury === sdToday()`. User never sees this explicitly.
4. **`planCheckReminders`** (`17-planning-remind.js`) — a second 60-second polling loop separate from the nudge slot, checking plan-related reminders.
5. **`effectiveDate()` / `isLateNight()` / `dayBoundaryHour()`** — before ~01:00 is still "yesterday". Every duty keyed on `today()` is subject to this boundary; the Daily Duties system must use `effectiveDate()` not `new Date()`.

---

## Ambiguous — needs your decision

1. **`finance_log` (#19)**: Only a nav health indicator was confirmed; the actual entry modal was not fully traced. Include or exclude from duties UI?
2. **`jazz_daily_plan` (#26)**: No explicit "done today" flag found in the plan engine. If included, it would be an "open" duty that pulses all day with no automatic green tick — just a presence reminder. Acceptable, or only include checkoff duties?
3. **`people_attention` (#17)**: Each person has their own cadence. A "due today" person could be represented as one duty slot (count badge) or as individual per-person duty items. Which?
4. **`ls_recall` (#12)**: The Learning Studio is new and may not be in regular use yet. Include in the duty list or keep as an informational strip only?

---

## Proposed default on/off

Duties default **On**: 1–18, 20–25 (everything with HIGH or CERTAIN confidence, plus the cycle reviews).  
Duties default **Off**: `finance_log` (MEDIUM confidence), `jazz_daily_plan` (no completion flag), `ls_recall` (conditional on LS being in use).  
All defaults overridable in Settings → Daily duties.
