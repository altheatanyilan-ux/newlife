/* ============================================================
   THE ANALYSIS EXPORT — a file to hand to an AI, about you

   Pick a stretch (today, this week, the last month, everything) and download
   what the house knows about it as one Markdown file (or JSON, or both),
   written so that a model with no knowledge of this app can read it:
   a short brief at the top, what each number means and whether it was typed by
   you or measured by the house, then the days one by one.

   It is as much about what is missing as what is there. Every day says when
   you woke, slept, first opened the house and last left it, how long you were
   actually active, how much of it was past the hour you said the day ends;
   then which records were written and which were not. Near the end, every part
   of the house is listed with how much you used it and when you last did — the
   rooms you did not touch matter as much as the ones you did.

   Nothing leaves the browser: this builds a file and the browser saves it.
   The writing section holds the full text of what you wrote (it can be turned
   off before downloading).
   ============================================================ */
const AX_AREAS = {entries: 'Journal & reflections', tasks: 'Tasks', habits: 'Habits (definitions)', reminders: 'Reminders', projects: 'Projects',
  people: 'People', interactions: 'People — interactions', skills: 'Skills', timeEntries: 'Time tracker', timeBlocks: 'Time blocks', wins: 'Wins',
  rescueSheets: 'Overwhelm rescue pages', rescueBank: 'Overwhelm rescue bank', practiceLog: 'Practice log', scores: 'Scores (music)', analyses: 'Analyses (music)',
  writeups: 'Writeups', takes: 'Takes', performanceNotes: 'Performance notes', treeNodes: 'Knowledge tree', treeReviews: 'Knowledge tree reviews', lsBoards: 'Learning studio boards',
  lsSessions: 'Learning studio sessions', txns: 'Finance — transactions', accounts: 'Finance — accounts', budgets: 'Finance — budgets', affirmations: 'Affirmations', beliefs: 'Beliefs',
  bets: 'Bets', retreats: 'Retreats', ideas: 'Ideas', boards: 'Boards', visions: 'Visions', values: 'Values', threads: 'Threads', tensions: 'Tensions', compost: 'Compost',
  mediaQueue: 'Media queue', dutyLog: 'Duties log', breaks: 'Breaks', alignmentChecks: 'Alignment checks', strengths: 'Strengths', habitsToDrop: 'Habits to drop'};
const AX_DATE_FIELDS = ['createdAt', 'updatedAt', 'doneAt', 'at', 'date', 'day', 'occurredAt', 'startTime', 'when', 'lastTouched', 'closedAt'];
const AX_DAYKEYED = {checkins: 'Daily check-in', reviewLog: 'Evening review', plans: 'Day plans', habitLog: 'Habit ticks', dailyRhythm: 'Sleep / wake record'};
const AX_PRESETS = [['today', 'Today'], ['week', 'This week'], ['7', 'Last 7 days'], ['month', 'This month'], ['30', 'Last 30 days'], ['90', 'Last 90 days'], ['all', 'Everything'], ['custom', 'Pick dates']];

function axRange(kind, from, to){
  const T = today();
  if(kind === 'today') return [T, T];
  if(kind === 'week') return [weekStart(T), T];
  if(kind === '7') return [addDays(T, -6), T];
  if(kind === 'month') return [T.slice(0, 8) + '01', T];
  if(kind === '30') return [addDays(T, -29), T];
  if(kind === '90') return [addDays(T, -89), T];
  if(kind === 'all'){ const ds = axAllDates(); return [ds.length ? ds[0] : T, T]; }
  return [from && from <= (to || T) ? from : T, to || T];
}
const axDay = v => { const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(v || '')); return m ? m[1] : ''; };
/* every date the house has anything on, for "everything" and for the area scan */
function axScan(){
  const by = {};   /* store → {date → n} */
  const add = (k, d) => { if(!d) return; const o = by[k] = by[k] || {}; o[d] = (o[d] || 0) + 1; };
  const stores = Object.keys(AX_AREAS);
  stores.forEach(k => { const arr = S[k]; if(!Array.isArray(arr)) return; by[k] = by[k] || {};
    arr.forEach(it => { if(!it || typeof it !== 'object') return; const seen = new Set();
      AX_DATE_FIELDS.forEach(f => { const d = axDay(it[f]); if(d && !seen.has(d)){ seen.add(d); add(k, d); } }); }); });
  Object.keys(AX_DAYKEYED).forEach(k => { const o = S[k]; if(!o || typeof o !== 'object') return; by[k] = by[k] || {};
    Object.keys(o).forEach(d => { if(/^\d{4}-\d{2}-\d{2}$/.test(d)){
      const v = o[d]; const real = k === 'habitLog' ? Object.keys(v || {}).length : k === 'dailyRhythm' ? (v && (v.wakeTime || v.sleepTime || (v.blocks || []).length)) : k === 'reviewLog' ? (v && (v.closedAt || v.note || v.energy)) : k === 'plans' ? (v && (v.planned || (v.intentions || []).some(Boolean))) : true;
      if(real) add(k, d); } }); });
  return by;
}
function axAllDates(){ const by = axScan(), ds = new Set(); Object.values(by).forEach(o => Object.keys(o).forEach(d => ds.add(d))); Object.keys(rkState().presence).forEach(d => ds.add(d)); return [...ds].sort(); }
const axHM = iso => { if(!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const axLocalDay = iso => { if(!iso) return ''; const d = new Date(iso); return isNaN(d) ? axDay(iso) : isoDay(d); };
const axWd = d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][parseDay(d).getDay()];
function axMedian(v){ v = v.filter(x => x != null).sort((a, b) => a - b); if(!v.length) return null; const m = v.length >> 1; return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2; }
function axSd(v){ v = v.filter(x => x != null); if(v.length < 2) return null; const m = v.reduce((a, b) => a + b, 0) / v.length; return Math.sqrt(v.reduce((a, b) => a + (b - m) * (b - m), 0) / (v.length - 1)); }
/* clock times that straddle midnight are averaged on a line that starts at noon */
const axClockLine = hm => { const m = hm2min(hm); return m == null ? null : (m < 720 ? m + 1440 : m); };
const axFromLine = m => m == null ? '' : min2hm(m);

/* the journal's own entries; the Writing and Media rooms keep their pieces in the same store, and a draft is not a day's account */
const axJournal = e => !!e && !['media', 'writing'].includes(e.type) && !!(String(e.body || '').trim() || String(e.title || '').trim()) && !!e.createdAt;
function axBuild(from, to, opt = {}){
  const a = rkState(), T = today(), days = [];
  for(let d = from, i = 0; d <= to && i < 800; d = addDays(d, 1), i++) days.push(d);
  const inR = d => d && d >= from && d <= to;
  const scan = axScan(), cutoff = rkCutoffHM(), tracked = a.presenceSince || '';
  const safe = (fn, dflt) => { try { return fn(); } catch(e){ return dflt; } };

  const allRefs = safe(() => allTaskRefs().filter(x => !taskIsAside(x.task)), []);
  /* ----- the days ----- */
  const rows = days.map(d => {
    const r = (S.dailyRhythm || {})[d] || {}, c = (S.checkins || {})[d] || {}, rv = (S.reviewLog || {})[d] || {}, pl = (S.plans || {})[d] || {}, pr = presenceDay(d);
    const wake = dayWakeHM(d) || '', bed = dayBedHM(d) || '', wakeNext = dayWakeHM(addDays(d, 1)) || '';
    let nightH = null; const b = hm2min(bed), w2 = hm2min(wakeNext);
    if(b != null && w2 != null){ let m = w2 - b; if(m <= 0) m += 1440; nightH = Math.round(m / 6) / 10; }
    const habs = safe(() => (S.habits || []).filter(h => !h.archived).map(h => ({h, due: typeof habDue === 'function' ? habDue(h, d) : habitDue(h, d)})).filter(x => x.due), []);
    const kept = safe(() => habs.filter(x => habKept(x.h, d)).length, 0);
    const tasksDone = allRefs.filter(x => x.done && (x.task.doneAt || '') === d).length;
    const entries = (S.entries || []).filter(e => axJournal(e) && axLocalDay(e.createdAt) === d);
    const stmt = entries.find(e => e.extra && e.extra.statement);
    const ints = (pl.intentions || []).filter(x => String(x || '').trim());
    return {date: d, weekday: axWd(d), living_day: d === T,
      woke: wake || null, bedtime_that_night: bed || null, bedtime_source: bed ? (r.sleepTime ? 'typed' : 'from check-in') : null, hours_slept_that_night: nightH,
      wake_goal: (S.settings || {}).wakeTime || null, sleep_goal: (S.settings || {}).sleepTime || null,
      house_first_opened: pr ? (pr.first || null) : null, house_last_seen: pr ? (pr.last || null) : null, sittings: pr ? pr.sittings : null,
      minutes_open: pr ? pr.openMin : null, minutes_active: pr ? pr.activeMin : null, minutes_past_cutoff_or_before_6am: pr ? pr.lateMin : null,
      presence_tracked: !!pr,
      planned_the_day: !!(pl.planned || ints.length), intentions: ints, first_move: pl.firstMove || '', why_today: pl.why || '', expected_obstacle: pl.risk || '',
      evening_review_closed_at: rv.closedAt || null, evening_note: rv.note || '', energy_1_to_5: rv.energy || null, moods: rv.moods || [],
      checkin_mood: c.mood || null, checkin_sentence: c.sentence || '', checkin_intention: c.intention || '',
      habits_due: habs.length, habits_kept: kept, habits_missed: d === T ? [] : habs.filter(x => !habKept(x.h, d)).map(x => x.h.name || x.h.title || x.h.id),
      tasks_completed: tasksDone, wrote_entries: entries.length, wrote_daily_statement: !!stmt,
      diligence_self_rating: stmt && stmt.extra ? (stmt.extra.diligence || null) : null, avoided: stmt && stmt.extra ? (stmt.extra.avoided || '') : '',
    };
  });

  /* ----- summary facts, no verdicts ----- */
  const have = k => rows.map(r => r[k]).filter(v => v != null && v !== '');
  const wakeLine = have('woke').map(axClockLine), bedLine = have('bedtime_that_night').map(axClockLine);
  const lateDays = rows.filter(r => (r.minutes_past_cutoff_or_before_6am || 0) >= 30);
  const nightsRec = Object.keys(a.nights).filter(inR).sort().map(d => Object.assign({date: d}, a.nights[d]));
  const hrs = have('hours_slept_that_night');
  const summary = {
    from, to, days: days.length, generated_at: new Date().toISOString(), presence_tracked_since: tracked || null,
    days_with_wake_recorded: have('woke').length, days_with_bedtime_recorded: have('bedtime_that_night').length,
    median_wake: axFromLine(axMedian(wakeLine)) || null, wake_sd_minutes: axSd(wakeLine) == null ? null : Math.round(axSd(wakeLine)),
    median_bedtime: axFromLine(axMedian(bedLine)) || null, bedtime_sd_minutes: axSd(bedLine) == null ? null : Math.round(axSd(bedLine)),
    median_hours_slept: hrs.length ? axMedian(hrs) : null, nights_under_6h: hrs.filter(h => h < 6).length, nights_6_to_9h: hrs.filter(h => h >= 6 && h <= 9).length, nights_over_9h: hrs.filter(h => h > 9).length,
    days_planned: rows.filter(r => r.planned_the_day).length, days_evening_closed: rows.filter(r => r.evening_review_closed_at).length,
    days_with_written_statement: rows.filter(r => r.wrote_daily_statement).length, days_with_any_entry: rows.filter(r => r.wrote_entries).length,
    days_house_opened: rows.filter(r => r.presence_tracked && r.sittings).length, days_presence_tracked: rows.filter(r => r.presence_tracked).length,
    median_first_open: axFromLine(axMedian(have('house_first_opened').map(x => hm2min(x)))) || null,
    median_minutes_active: axMedian(rows.filter(r => r.presence_tracked).map(r => r.minutes_active)),
    days_active_30m_past_cutoff_or_before_6am: lateDays.length, total_late_minutes: rows.reduce((s, r) => s + (r.minutes_past_cutoff_or_before_6am || 0), 0),
    habit_due_days: rows.filter(r => !r.living_day).reduce((s, r) => s + r.habits_due, 0), habit_kept_days: rows.filter(r => !r.living_day).reduce((s, r) => s + r.habits_kept, 0),
    tasks_completed: rows.reduce((s, r) => s + r.tasks_completed, 0),
    diligence_ratings: have('diligence_self_rating'),
  };

  /* ----- the writing ----- */
  const writing = (S.entries || []).filter(e => axJournal(e) && inR(axLocalDay(e.createdAt))).sort((x, y) => String(x.createdAt || '').localeCompare(String(y.createdAt || ''))).map(e => ({
    date: axLocalDay(e.createdAt), about_date: e.occurredAt && e.occurredAt !== axLocalDay(e.createdAt) ? e.occurredAt : '', written_at: axLocalDay(e.createdAt) + ' ' + axHM(e.createdAt), type: e.type, title: e.title || '', text: opt.text === false ? `(${String(e.body || '').length} characters, text left out)` : (e.body || ''),
    emotions: e.emotions || [], tags: e.tags || [], diligence: e.extra && e.extra.diligence || null, avoided: e.extra && e.extra.avoided || ''}));

  /* ----- tasks ----- */
  const refs = allRefs;
  const tasks = {
    completed: refs.filter(r => r.done && inR(r.task.doneAt || '')).map(r => ({text: r.text, done_on: r.task.doneAt, created: axDay(r.task.createdAt), due: r.day || r.doDay || '', where: r.where || ''})),
    created_in_range: refs.filter(r => inR(axDay(r.task.createdAt))).length,
    overdue_open: refs.filter(r => !r.done && r.day && r.day < to).map(r => ({text: r.text, due: r.day, days_overdue: daysBetween(r.day, to), where: r.where || ''})).sort((x, y) => y.days_overdue - x.days_overdue).slice(0, 40),
    open_total: refs.filter(r => !r.done).length,
    oldest_open_no_date: refs.filter(r => !r.done && !r.day && !r.doDay && axDay(r.task.createdAt)).map(r => ({text: r.text, created: axDay(r.task.createdAt), age_days: daysBetween(axDay(r.task.createdAt), to)})).sort((x, y) => y.age_days - x.age_days).slice(0, 25),
  };

  /* ----- habits ----- */
  const habits = safe(() => (S.habits || []).filter(h => !h.archived).map(h => {
    const due = days.filter(d => (typeof habDue === 'function' ? habDue(h, d) : habitDue(h, d)) && d <= T), kept = due.filter(d => habKept(h, d)), missed = due.filter(d => !kept.includes(d));
    return {name: h.name || h.title || h.id, kind: h.negative ? 'breaking' : 'building', due_days: due.length, kept_days: kept.length, missed_days: missed.length, missed_dates: missed.length <= 16 ? missed : missed.slice(-16).concat(['…']), ever_ticked_before_range: Object.keys(S.habitLog || {}).some(d => d < from && S.habitLog[d] && S.habitLog[d][h.id])};
  }), []);

  /* ----- time tracker ----- */
  const time = safe(() => { const te = (S.timeEntries || []).filter(e => inR(axLocalDay(e.startTime))), by = {}, perDay = {};
    te.forEach(e => { const mins = e.endTime ? Math.max(0, Math.round((new Date(e.endTime) - new Date(e.startTime)) / 60000)) : 0; const cat = (typeof timeCategory === 'function' && timeCategory(e.categoryId) || {}).name || 'uncategorised';
      by[cat] = (by[cat] || 0) + mins; const d = axLocalDay(e.startTime); perDay[d] = (perDay[d] || 0) + mins; });
    return {entries: te.length, minutes_by_category: by, minutes_per_day: perDay, total_minutes: Object.values(by).reduce((x, y) => x + y, 0)}; }, {entries: 0});

  /* ----- touched and untouched ----- */
  const span = days.length, prevFrom = addDays(from, -span), prevTo = addDays(from, -1);
  const areas = [];
  const all = Object.assign({}, AX_AREAS, AX_DAYKEYED);
  Object.keys(all).forEach(k => { const o = scan[k] || {}, ds = Object.keys(o).sort(); const total = ds.reduce((s, d) => s + o[d], 0);
    if(!total && !AX_AREAS[k]) return;
    const inN = ds.filter(inR).reduce((s, d) => s + o[d], 0), prev = ds.filter(d => d >= prevFrom && d <= prevTo).reduce((s, d) => s + o[d], 0), last = ds.length ? ds[ds.length - 1] : '';
    const upToTo = ds.filter(d => d <= to), lastUp = upToTo.length ? upToTo[upToTo.length - 1] : '';
    areas.push({area: all[k], key: k, records_ever: total, active_days_in_range: ds.filter(inR).length, records_in_range: inN, records_in_previous_equal_period: prev, last_activity: lastUp || null, days_since_last_activity_at_range_end: lastUp ? daysBetween(lastUp, to) : null, status: !total ? 'never used' : inN ? 'touched' : 'NOT TOUCHED in range'}); });
  const rank = x => x.status === 'touched' ? 2 : x.status === 'never used' ? 1 : 0;
  areas.sort((x, y) => rank(x) - rank(y) || (y.days_since_last_activity_at_range_end || 0) - (x.days_since_last_activity_at_range_end || 0));
  const rooms = (typeof NAV_PAGES === 'object' ? Object.keys(NAV_PAGES) : []).length;

  /* ----- the record keeper ----- */
  const keeper = {mode: a.mode, since: a.since || null, day_ends_at: cutoff, wake_due_by: a.wakeBy, plan_due_by: a.planBy, statement_due_by: a.traceBy,
    nights: nightsRec.map(n => ({date: n.date, first_seen_after_cutoff: n.first, last_seen: n.last, times_asked: n.asked, said_it_had_to_be_done: n.need || [], answers_to_hard_questions: n.answers || [], came_back_after_goodnight: n.relapses || [], went_to_bed_via_prompt: !!n.sleeping, next_morning_account: n.debrief || null})),
    borrows: a.borrowLog.filter(b => inR(axLocalDay(b.at))).map(b => ({at: b.at, minutes: b.mins, reason: b.reason, owed_at_the_time: b.owed || []})),
    owed_right_now: rkOn() ? rkOwed().map(r => r.label) : []};
  const settings = {sleep_goal: (S.settings || {}).sleepTime || null, wake_goal: (S.settings || {}).wakeTime || null, day_rolls_over_at_hour: dayBoundaryHour()};
  return {summary, days: rows, writing, tasks, habits, time, areas, record_keeper: keeper, settings, rooms_in_house: rooms};
}

/* ---------- rendering ---------- */
const axC = v => String(v == null || v === '' ? '—' : v).replace(/\|/g, '/').replace(/\s*\n\s*/g, ' ');
function axTable(head, rows){ return '| ' + head.join(' | ') + ' |\n|' + head.map(() => '---').join('|') + '|\n' + rows.map(r => '| ' + r.map(axC).join(' | ') + ' |').join('\n') + '\n'; }
const AX_BRIEF = `# How to read this, and what I'd like from you

This is a self-tracking export from a personal life-management app I use (a single-file offline app). It covers **{RANGE}** ({N} days). I'd like you to analyse my patterns honestly — I'm not looking for reassurance.

Please cover, citing dates:
1. **Sleep and wake** — regularity, social jetlag between days, how late I go to bed against the goal, whether the pattern is healthy.
2. **When I'm in the app** — first-open and last-seen times, late-night use (past my cutoff or before 6am), whether the hours I'm active line up with what I say I want.
3. **Diligence** — what I planned vs what I did (plans, tasks, habits), my own 1–5 rating vs what the data shows.
4. **Emotion and avoidance** — recurring moods, what I wrote about, what I say I avoided.
5. **What I did not touch** — the parts of the app and my life with no activity (this matters as much as what I did) and what that suggests.
6. **My relationship with accountability** — records I skipped, how I used borrows, what I said when asked at night.
7. Three small, concrete experiments for the next two weeks, each with a way to tell whether it worked.

Distinguish clearly between what I **typed** (self-reported), what the app **measured** (presence), and what is **missing**. Don't diagnose; flag anything that looks worth taking to a professional. Ask me questions if the data is ambiguous.

## Data notes
- Times are local, 24-hour. A "bedtime" listed on a date is the night that begins that evening; "hours slept" is from that bedtime to the next recorded wake time.
- **Presence** (first open, last seen, sittings, minutes open/active, late minutes) is measured automatically by the app once a minute while the page is visible. "Active" means a key, click or scroll in the previous 3 minutes. Presence tracking began on **{SINCE}**; earlier days show "—" (not tracked), which is *not* the same as zero.
- "Late" means after **{CUTOFF}** (the hour I said my day ends) or before 06:00.
- The day rolls over at {BOUNDARY}:00, so 01:30 still belongs to the previous "living day" in the app, but the dates here are calendar dates unless stated.
- A blank means nothing was recorded, which is itself information.
`;
function axMarkdown(D, opt = {}){
  const s = D.summary, L = [];
  const range = s.from === s.to ? s.from : `${s.from} to ${s.to}`;
  L.push(`# Life-tracking export — ${range}\n`);
  if(opt.brief !== false) L.push(AX_BRIEF.replace('{RANGE}', range).replace('{N}', s.days).replace('{SINCE}', s.presence_tracked_since || 'never (no presence data)').replace('{CUTOFF}', D.record_keeper.day_ends_at).replace('{BOUNDARY}', D.settings.day_rolls_over_at_hour));
  L.push('\n---\n\n## 1. Summary (facts only)\n');
  const kv = [['Days covered', s.days], ['Days the house was opened (tracked days only)', `${s.days_house_opened} of ${s.days_presence_tracked} tracked`], ['Median first open of the day', s.median_first_open], ['Median minutes active per tracked day', s.median_minutes_active],
    ['Days with ≥30 min active past cutoff / before 6am', `${s.days_active_30m_past_cutoff_or_before_6am}`], ['Total minutes active-or-open past cutoff / before 6am', s.total_late_minutes],
    ['Wake time recorded', `${s.days_with_wake_recorded} of ${s.days} days`], ['Median wake', s.median_wake], ['Wake-time variability (SD, minutes)', s.wake_sd_minutes],
    ['Bedtime recorded', `${s.days_with_bedtime_recorded} of ${s.days} days`], ['Median bedtime', s.median_bedtime], ['Bedtime variability (SD, minutes)', s.bedtime_sd_minutes],
    ['Median hours slept', s.median_hours_slept], ['Nights <6h / 6–9h / >9h', `${s.nights_under_6h} / ${s.nights_6_to_9h} / ${s.nights_over_9h}`],
    ['Days planned', `${s.days_planned} of ${s.days}`], ['Evenings closed', `${s.days_evening_closed} of ${s.days}`], ['Days with a written daily statement', `${s.days_with_written_statement} of ${s.days}`], ['Days with any journal entry', `${s.days_with_any_entry} of ${s.days}`],
    ['Habit days kept / due', `${s.habit_kept_days} / ${s.habit_due_days}`], ['Tasks completed', s.tasks_completed], ['My own diligence ratings (1–5)', s.diligence_ratings.length ? s.diligence_ratings.join(', ') : '—'],
    ['Sleep goal / wake goal', `${D.settings.sleep_goal || '—'} / ${D.settings.wake_goal || '—'}`]];
  L.push(axTable(['Fact', 'Value'], kv));
  L.push('\n## 2. Day by day (table)\n');
  L.push(axTable(['Date', 'Day', 'Woke', 'Bed (that night)', 'Slept h', 'First open', 'Last seen', 'Sittings', 'Min open', 'Min active', 'Late min', 'Planned', 'Closed', 'Wrote', 'Habits kept/due', 'Tasks done', 'Diligence'],
    D.days.map(r => [r.date, r.weekday, r.woke, r.bedtime_that_night, r.hours_slept_that_night, r.presence_tracked ? r.house_first_opened || 'not opened' : 'n/t', r.presence_tracked ? r.house_last_seen : 'n/t', r.sittings, r.minutes_open, r.minutes_active, r.minutes_past_cutoff_or_before_6am, r.planned_the_day ? 'yes' : 'no', r.evening_review_closed_at || 'no', r.wrote_entries, `${r.habits_kept}/${r.habits_due}`, r.tasks_completed, r.diligence_self_rating])));
  L.push('\n(n/t = presence not tracked that day; — = nothing recorded)\n\n## 3. Each day, in detail\n');
  D.days.forEach(r => {
    const bits = [];
    if(r.intentions.length) bits.push(`**Intended:** ${r.intentions.join(' · ')}`);
    if(r.first_move) bits.push(`**First move:** ${r.first_move}`); if(r.why_today) bits.push(`**Why:** ${r.why_today}`); if(r.expected_obstacle) bits.push(`**Expected obstacle:** ${r.expected_obstacle}`);
    if(r.checkin_sentence) bits.push(`**Check-in:** ${r.checkin_sentence}${r.checkin_mood ? ` (mood ${r.checkin_mood})` : ''}`);
    if(r.evening_note) bits.push(`**Evening note:** ${r.evening_note}`); if(r.moods.length) bits.push(`**Moods:** ${r.moods.join(', ')}${r.energy_1_to_5 ? ` · energy ${r.energy_1_to_5}` : ''}`);
    if(r.avoided) bits.push(`**Avoided:** ${r.avoided}`); if(r.habits_missed.length) bits.push(`**Habits missed:** ${r.habits_missed.join(', ')}`);
    if(!r.planned_the_day) bits.push('**No plan was written.**'); if(!r.woke) bits.push('**No wake time recorded.**'); if(!r.bedtime_that_night) bits.push('**No bedtime recorded for the night.**'); if(!r.evening_review_closed_at) bits.push('**Day not closed.**');
    if(r.presence_tracked && !r.sittings) bits.push('**House not opened at all.**');
    L.push(`### ${r.date} ${r.weekday}${r.living_day ? ' (today — partial)' : ''}\n${bits.length ? bits.map(b => '- ' + b).join('\n') : '- nothing written for this day'}\n`);
  });
  L.push('\n## 4. Late nights and the night watch\n');
  const nk = D.record_keeper; L.push(`Record keeper mode: **${nk.mode}**${nk.since ? ` (on since ${nk.since})` : ''}. Day ends at ${nk.day_ends_at}. Wake owed by ${nk.wake_due_by}, plan by ${nk.plan_due_by}, a daily statement by ${nk.statement_due_by}. Owed right now: ${nk.owed_right_now.length ? nk.owed_right_now.join('; ') : 'nothing'}.\n`);
  if(nk.nights.length) nk.nights.forEach(n => { L.push(`### Night of ${n.date}\n- First seen after cutoff: ${n.first_seen_after_cutoff || '—'} · last seen: ${n.last_seen || '—'} · asked ${n.times_asked} time(s)${n.went_to_bed_via_prompt ? ' · chose to go to bed when asked' : ''}`);
    (n.said_it_had_to_be_done || []).forEach(x => L.push(`- Said it had to be done tonight: "${x.what}" — if it waited: "${x.cost}" (${x.mins} min)`));
    (n.answers_to_hard_questions || []).forEach(x => L.push(`- Asked "${x.q}" at ${x.at} — I answered: "${x.a}"`));
    (n.came_back_after_goodnight || []).forEach(x => L.push(`- Came back after saying goodnight (${axHM(x.at)}): "${x.why}"`));
    if(n.next_morning_account) L.push(`- Next morning: ${n.next_morning_account.what} · did it need doing that night? **${n.next_morning_account.need}** · what changes: ${n.next_morning_account.fix}`); L.push(''); });
  else L.push('No night-watch records in this range.\n');
  L.push('\n### Borrowed time (opening a closed room by giving a reason)\n');
  L.push(nk.borrows.length ? nk.borrows.map(b => `- ${b.at.slice(0, 16).replace('T', ' ')} · ${b.minutes ? b.minutes + ' min' : 'eased the mode'} · "${b.reason}"${b.owed_at_the_time.length ? ` (owed: ${b.owed_at_the_time.join(', ')})` : ''}`).join('\n') + '\n' : 'None.\n');
  L.push('\n## 5. What I wrote\n');
  L.push(D.writing.length ? D.writing.map(w => `### ${w.date} — ${w.type}${w.title ? ': ' + w.title : ''}\n*written ${w.written_at}${w.about_date ? ' · about ' + w.about_date : ''}${w.emotions.length ? ' · feeling: ' + w.emotions.join(', ') : ''}${w.diligence ? ' · diligence ' + w.diligence + '/5' : ''}${w.tags.length ? ' · tags: ' + w.tags.join(', ') : ''}*\n\n${w.text}${w.avoided ? `\n\n*Avoided: ${w.avoided}*` : ''}\n`).join('\n') : 'Nothing was written in this range.\n');
  L.push('\n## 6. Tasks\n');
  const t = D.tasks; L.push(`Completed in range: **${t.completed.length}** · created in range: **${t.created_in_range}** · open in total: **${t.open_total}**.\n`);
  if(t.completed.length) L.push('**Completed**\n' + t.completed.slice(0, 120).map(x => `- ${x.done_on} — ${x.text}${x.where ? ' [' + x.where + ']' : ''}`).join('\n') + '\n');
  if(t.overdue_open.length) L.push('\n**Overdue and still open** (most overdue first)\n' + t.overdue_open.map(x => `- ${x.text} — due ${x.due}, ${x.days_overdue} days overdue${x.where ? ' [' + x.where + ']' : ''}`).join('\n') + '\n');
  if(t.oldest_open_no_date.length) L.push('\n**Oldest open tasks with no date** (sitting there)\n' + t.oldest_open_no_date.map(x => `- ${x.text} — created ${x.created}, ${x.age_days} days ago`).join('\n') + '\n');
  L.push('\n## 7. Habits\n');
  L.push(D.habits.length ? axTable(['Habit', 'Kind', 'Due days', 'Kept', 'Missed', 'Missed on', 'Ever ticked before range'], D.habits.map(h => [h.name, h.kind, h.due_days, h.kept_days, h.missed_days, h.missed_dates.join(', '), h.ever_ticked_before_range ? 'yes' : 'no'])) : 'No habits defined.\n');
  L.push('\n## 8. Time tracker\n');
  L.push(D.time.entries ? `${D.time.entries} entries, ${Math.round(D.time.total_minutes / 6) / 10} h tracked.\n\n` + axTable(['Category', 'Hours'], Object.entries(D.time.minutes_by_category).sort((x, y) => y[1] - x[1]).map(([k, v]) => [k, Math.round(v / 6) / 10])) : 'Nothing tracked in this range.\n');
  L.push('\n## 9. What I touched and what I did not\nSorted with the parts used before but NOT touched in this range first (longest-neglected at the top), then parts never used, then the ones that were touched. "Last activity" is the most recent date with any record in that part of the app, up to the end of the range.\n');
  L.push(axTable(['Part of the app', 'Status', 'Records in range', 'Active days in range', 'Previous equal period', 'Last activity', 'Days since (at range end)', 'Records ever'], D.areas.map(x => [x.area, x.status, x.records_in_range, x.active_days_in_range, x.records_in_previous_equal_period, x.last_activity, x.days_since_last_activity_at_range_end, x.records_ever])));
  return L.join('\n');
}

/* ---------- the dialog ---------- */
function axDownload(name, text, mime){
  const blob = new Blob([text], {type: mime}), url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function analysisOpen(preset){
  const T = today(), st = {kind: preset || 'week', from: addDays(T, -6), to: T, format: 'md', text: true, brief: true};
  const m = openModal(`<span class="mono faint">for an AI to read</span><h2 class="serif" style="margin:2px 0 6px">Download my record</h2>
    <p class="muted" style="margin:0 0 10px;font-size:.88rem">One file: the days, when I woke, slept and was in the house, what I wrote, what I did and did not do, and which parts of the house I never touched. Feed it to an AI and ask what it sees.</p>
    <div class="rk-opts" style="flex-direction:row;flex-wrap:wrap;gap:6px" id="axP">${AX_PRESETS.map(([k, t]) => `<button class="chip sm" data-axp="${k}">${t}</button>`).join('')}</div>
    <div class="row" id="axCustom" style="gap:8px;margin:8px 0;display:none"><input class="inp" type="date" id="axF"><span class="muted">to</span><input class="inp" type="date" id="axT"></div>
    <p class="mono faint" id="axInfo" style="margin:10px 0 6px"></p>
    <div class="opt"><div><b>Format</b></div><select class="sel" style="width:auto" id="axFmt"><option value="md">Markdown (.md) — best for AI</option><option value="json">JSON (.json)</option><option value="both">Both</option></select></div>
    <div class="opt"><div><b>Full text of what I wrote</b><div class="d">Off keeps dates, types and lengths only.</div></div><label class="toggle on" id="axTxt"><span class="sw"></span></label></div>
    <div class="opt"><div><b>Brief at the top</b><div class="d">Tells the AI what this is and what to analyse.</div></div><label class="toggle on" id="axBr"><span class="sw"></span></label></div>
    <div class="row" style="justify-content:space-between;margin-top:14px;gap:8px;flex-wrap:wrap"><button class="btn ghost" id="axSay">Say something about today first</button><span class="row" style="gap:8px"><button class="btn" id="axCopy">Copy</button><button class="btn primary" id="axGo">Download</button></span></div>
    <p class="faint" style="font-size:.76rem;margin:10px 0 0">It is built in this browser and saved to your device. It contains personal writing — you choose where it goes next.</p>`, 'narrow');
  const info = () => { const [f, t] = axRange(st.kind, st.from, st.to); const n = daysBetween(f, t) + 1;
    m.querySelector('#axInfo').textContent = `${f === t ? f : f + ' → ' + t} · ${n} day${n === 1 ? '' : 's'}`;
    m.querySelectorAll('[data-axp]').forEach(b => b.classList.toggle('on', b.dataset.axp === st.kind)); m.querySelector('#axCustom').style.display = st.kind === 'custom' ? 'flex' : 'none'; };
  m.querySelectorAll('[data-axp]').forEach(b => b.onclick = () => { st.kind = b.dataset.axp; if(st.kind === 'custom'){ m.querySelector('#axF').value = st.from; m.querySelector('#axT').value = st.to; } info(); });
  m.querySelector('#axF').onchange = e => { st.from = e.target.value || st.from; info(); }; m.querySelector('#axT').onchange = e => { st.to = e.target.value || st.to; info(); };
  m.querySelector('#axFmt').onchange = e => { st.format = e.target.value; };
  [['#axTxt', 'text'], ['#axBr', 'brief']].forEach(([sel, k]) => { const el = m.querySelector(sel); el.onclick = () => { st[k] = !st[k]; el.classList.toggle('on', st[k]); }; });
  const build = () => { const [f, t] = axRange(st.kind, st.from, st.to), D = axBuild(f, t, {text: st.text}); return {D, f, t, md: axMarkdown(D, {brief: st.brief})}; };
  m.querySelector('#axGo').onclick = () => { const {D, f, t, md} = build(), base = `life-record-${f === t ? f : f + '_to_' + t}`;
    if(st.format !== 'json') axDownload(base + '.md', md, 'text/markdown'); if(st.format !== 'md') axDownload(base + '.json', JSON.stringify(D, null, 1), 'application/json');
    toast(`Saved ${base}${st.format === 'both' ? ' (.md and .json)' : st.format === 'json' ? '.json' : '.md'} — ${Math.round((st.format === 'json' ? JSON.stringify(D).length : md.length) / 1024)} KB.`, 5500); };
  m.querySelector('#axCopy').onclick = async () => { const {md} = build(); try { await navigator.clipboard.writeText(md); toast('Copied. Paste it into the AI.'); } catch(e){ axDownload('life-record.md', md, 'text/markdown'); toast('Could not copy — saved it instead.'); } };
  m.querySelector('#axSay').onclick = () => { m.remove(); rkSayToday(() => analysisOpen(st.kind)); };
  info();
  return m;
}
