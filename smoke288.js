/* smoke288 — Phase 1 of the execution overhaul: the foundations.

   1. A day ends at the boundary hour, not at midnight, for time: a sitting at
      1:30 a.m. belongs to the evening before, one that crosses the boundary is
      split when read (the stored times are untouched), and a clock face earlier
      than the boundary typed on a day lands after midnight.
   2. One reading of when the day started and ended: the day record, else the
      check-in, else Settings; writing a wake time keeps both in line; duty
      windows read it.
   3. One unit for how long a thing takes: minutes, in `duration`. A task with
      an hour-valued `est` and a plan item from the old panel are carried over
      without losing anything.
   4. The retired Kanban fields are cleaned off, and nothing writes them.
   5. A repeating task's next occurrence has its do-days moved with its due day.
   6. The focus section is drawn again in place: starting a sitting does not
      redraw the page.

   Run: NODE_PATH=node_modules node smoke288.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1300, height: 900}})).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  await p.evaluate(() => { closeModals(); document.querySelectorAll('.overlay,.toast').forEach(n => n.remove()); });

  console.log('\n1. the living day, for time');
  const t1 = await p.evaluate(() => {
    S.settings.dayBoundaryHour = 4;
    const local = (day, hm) => timeAtOn(day, hm);
    timeState(); S.timeEntries.length = 0;
    const D = '2026-03-06';                                   /* a Friday */
    const sat = addDays(D, 1);
    const at = (d, hm) => { const [h, m] = hm.split(':').map(Number); const x = parseDay(d); x.setHours(h, m, 0, 0); return x.toISOString(); };
    const late = timeEntryDefaults({id: 'late', what: 'night work', startTime: at(sat, '01:30'), endTime: at(sat, '02:30'), categoryId: 'work'});
    const cross = timeEntryDefaults({id: 'cross', what: 'crossing', startTime: at(sat, '03:00'), endTime: at(sat, '05:00'), categoryId: 'work'});
    const norm = timeEntryDefaults({id: 'norm', what: 'afternoon', startTime: at(D, '14:00'), endTime: at(D, '15:00'), categoryId: 'work'});
    S.timeEntries.push(late, cross, norm);
    const mins = d => Math.round(timeOnDay(d).reduce((n, e) => n + timeMinutes(e), 0));
    return {
      livingLate: timeLivingDay(late.startTime), livingCross: timeLivingDay(cross.startTime), livingNorm: timeLivingDay(norm.startTime),
      friMins: mins(D), satMins: mins(sat),
      friIds: timeOnDay(D).map(e => e.id).sort(), satIds: timeOnDay(sat).map(e => e.id).sort(),
      storedCross: [cross.startTime === at(sat, '03:00'), cross.endTime === at(sat, '05:00')],
      clippedMarked: timeOnDay(D).filter(e => e._clipOf).map(e => e.id),
      cal: timeOnCalendarDay(sat).map(e => e.id).sort(),
      typed: timeAtOn(D, '01:30') === at(sat, '01:30') && timeAtOn(D, '09:00') === at(D, '09:00'),
      between: Math.round(timeBetween(D, sat).reduce((n, e) => n + timeMinutes(e), 0)) };
  });
  is('1:30 a.m. belongs to the evening before; 3 a.m. is the same night; the afternoon is the same day',
    [t1.livingLate, t1.livingCross, t1.livingNorm], ['2026-03-06', '2026-03-06', '2026-03-06']);
  is('Friday holds the afternoon, the 1:30 sitting and the part of the crossing sitting before 4 a.m. (60 + 60 + 60)', t1.friMins, 60 + 60 + 60);
  is('and Saturday holds the part after 4 a.m. only (60)', t1.satMins, 60);
  is('the crossing sitting is in both days, the others in one', [t1.friIds, t1.satIds], [['cross', 'late', 'norm'], ['cross']]);
  yes('the stored times of the crossing sitting are exactly what was written', t1.storedCross[0] && t1.storedCross[1], t1.storedCross);
  is('the part of it shown on Friday is marked as a part', t1.clippedMarked, ['cross']);
  is('a clock-face bar, which is midnight to midnight, still has the small hours on the calendar date', t1.cal, ['cross', 'late']);
  yes('a clock face before the boundary typed on Friday lands after midnight; a daytime one does not', t1.typed);
  is('a range over both days counts every minute once', t1.between, 60 + 120 + 60);

  console.log('\n2. one reading of when the day starts and ends');
  const t2 = await p.evaluate(() => {
    const D = '2026-04-10', E = '2026-04-11';
    S.settings.wakeTime = '07:00'; S.settings.sleepTime = '23:00';
    S.dailyRhythm = S.dailyRhythm || {}; S.checkins = S.checkins || {};
    delete S.dailyRhythm[D]; delete S.checkins[D];
    const out = {};
    out.setting = [dayWakeOrSetting(D), dayBedOrSetting(D)];
    out.readCreated = !S.dailyRhythm[D];
    S.checkins[D] = {wakeAt: (() => { const x = parseDay(D); x.setHours(6, 15, 0, 0); return x.toISOString(); })()};
    out.checkin = dayWakeOrSetting(D);
    S.dailyRhythm[D] = {wakeTime: '06:40', sleepTime: '22:10', blocks: []};
    out.rhythm = [dayWakeOrSetting(D), dayBedOrSetting(D)];
    S.dailyRhythm[E] = {wakeTime: '07:00', sleepTime: '01:30', blocks: []};
    out.pastMidnightBed = dayBedOrSetting(E);
    daySetWake(E, '05:50');
    out.setBoth = [S.dailyRhythm[E].wakeTime, (() => { const x = new Date(S.checkins[E].wakeAt); return String(x.getHours()).padStart(2,'0') + ':' + String(x.getMinutes()).padStart(2,'0'); })()];
    for(let i = 1; i <= 5; i++){ const d = addDays(today(), -i); S.dailyRhythm[d] = {wakeTime: '06:30', sleepTime: '23:00', blocks: []}; }
    out.median = [dutyMedianWake(), dutyMedianSleep()];
    return out; });
  is('with nothing logged, the Settings defaults answer — and asking does not create a day record', [t2.setting, t2.readCreated], [['07:00', '23:00'], true]);
  is('a check-in with a wake time answers over the default', t2.checkin, '06:15');
  is('the day record answers over the check-in', t2.rhythm, ['06:40', '22:10']);
  is('a bedtime past midnight (which would end the day before it began) falls back to the default end', t2.pastMidnightBed, '23:00');
  is('writing a wake time keeps the day record and the check-in in line', t2.setBoth, ['05:50', '05:50']);
  is('duty windows read the same logged days: median wake 06:30, median bed 23:00', t2.median, [6 * 60 + 30, 23 * 60]);

  console.log('\n3. one unit for how long a thing takes');
  const t3 = await p.evaluate(() => {
    const D = '2026-05-02';
    const a = newTask('legacy hours'); a.est = 1.5;
    const b2 = newTask('has both'); b2.est = 2; b2.duration = 20;
    const c = newTask('no estimate');
    S.tasks.push(a, b2, c);
    S.plans = S.plans || {};
    S.plans[D] = {intentions: ['', '', ''], capacity: 8, planned: true, items: [
      {id: 'i1', text: 'old plan item', est: 0.5, done: false},
      {id: 'i2', text: 'old done item', est: 1, done: true, doneAt: '10:00'},
      {id: 'i3', text: 'already a task', est: 1, done: false, ref: a.id}]};
    const before = S.tasks.length;
    migrateTasks();
    migrateTasks();                                                      /* a second pass changes nothing */
    const get = id => S.tasks.find(t => t.id === id);
    const items = S.tasks.filter(t => t.fromPlanItem);
    return {a: [get(a.id).duration, get(a.id).est], b: [get(b2.id).duration, get(b2.id).est], c: get(c.id).duration || 0,
      added: S.tasks.length - before, items: items.map(t => [t.text, t.duration, t.done, t.doneAt, t.doDay]).sort(),
      gone: S.plans[D].items === undefined, est: taskEstOf(get(a.id)) };
  });
  is('hours become minutes in `duration` and the old field is gone', t3.a, [90, undefined]);
  is('a task that already had minutes keeps them (they were the ones in use)', t3.b, [20, undefined]);
  is('a task with no estimate stays without one', t3.c, 0);
  is('the two plan items that were not tasks become Inbox tasks for their day, with their length and done state; the one that was a task is not copied twice', t3.items,
    [['old done item', 60, true, '2026-05-02', '2026-05-02'], ['old plan item', 30, false, null, '2026-05-02']]);
  yes('the old items list is gone, and a second migration adds nothing', t3.gone && t3.added === 2, t3);
  is('the estimate readers agree', t3.est, 90);

  console.log('\n4. the board’s leftovers');
  const t4 = await p.evaluate(() => {
    const t = newTask('old board task'); t.kanbanColumn = 'todo'; t.kanbanPinned = true; S.tasks.push(t);
    planState().lists.forEach(l => { l.kanbanColumns = [{id: 'todo'}]; });
    migratePlanning();
    const nl = planNewList('fresh'); const nt = newPlanTask('fresh task', '');
    return {task: [t.kanbanColumn, t.kanbanPinned], lists: planState().lists.some(l => 'kanbanColumns' in l), newList: 'kanbanColumns' in nl,
      newTask: 'kanbanColumn' in nt, defaultConst: typeof DEFAULT_KANBAN, col: typeof planTaskColumn }; });
  is('a task carrying board fields is cleaned', t4.task, [undefined, undefined]);
  yes('no list carries board columns, and new ones are not made with them', !t4.lists && !t4.newList && !t4.newTask, t4);
  is('the helpers that only the board used are gone', [t4.defaultConst, t4.col], ['undefined', 'undefined']);

  console.log('\n5. a repeating task’s next occurrence');
  const t5 = await p.evaluate(() => {
    const T = today();
    const t = newPlanTask('weekly thing', addDays(T, 0), {recurrence: {pattern: 'daily', interval: 1}, doDay: addDays(T, -2), doEnd: addDays(T, -1)});
    S.tasks.push(t);
    const next = planSetDone(t, true);
    return {due: next && next.day, doDay: next && next.doDay, doEnd: next && next.doEnd, today: T};
  });
  is('the next day’s due is a day later', t5.due, addDays0(t5.today, 1));
  is('and its do-days moved the same one day (they used to stay in the past)', [t5.doDay, t5.doEnd], [addDays0(t5.today, -1), addDays0(t5.today, 0)]);

  console.log('\n6. the focus section is drawn in place');
  await p.evaluate(() => { location.hash = '#/today'; setTodayView('do'); }); await p.waitForTimeout(1800);
  await p.evaluate(() => { document.querySelectorAll('.overlay,.toast').forEach(n => n.remove());
    document.querySelector('.today-page').__mark = 'same page'; document.getElementById('t-focus').__mark = 'old section';
    window.__r = 0; const f = window.rerender; window.rerender = function(){ window.__r++; return f.apply(this, arguments); }; });
  await p.evaluate(() => { FocusTimer.start(); }); await p.waitForTimeout(1200);
  const t6 = await p.evaluate(() => ({page: document.querySelector('.today-page').__mark, section: document.getElementById('t-focus').__mark || 'new section',
    running: FocusTimer.state().running, clock: !!document.querySelector('#t-focus .tf-clock'), redraws: window.__r}));
  is('the page is the same page', t6.page, 'same page');
  is('the focus section was replaced, and says it is running', [t6.section, t6.running, t6.clock], ['new section', true, true]);
  is('without the whole page being redrawn', t6.redraws, 0);
  await p.evaluate(() => { FocusTimer.stop && FocusTimer.stop(); }); await p.waitForTimeout(800);

  console.log('\n7. nothing broke on the way');
  yes('no page errors', !errs.length, errs.join(' | '));
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
  function addDays0(s, n){ const [y, m, d] = s.split('-').map(Number); const x = new Date(y, m - 1, d + n);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; }
})();
