/* smoke188 — two dates on a task, and they answer different questions.

   "aside from the due date, there should be a do date for the tasks and tasks
   with due day that's today will automatically appearing on today's page."

   A task had one date. It was labelled "due", and everything treated it as
   both the deadline and the plan — which meant that a thing owed on Friday sat
   in Friday until Friday. That is how a week ends in a wall: four days of
   empty pages and then a day nobody could have done.

   So there are two now. `day` is the deadline, the day the thing is owed, and
   it is often owed to somebody who is not you. `doDay` is the appointment you
   made with yourself. A task needs neither, either, or both, and it is on a
   day when either of them falls on it.

   What follows from that is the interesting part, and most of it is about not
   falsifying the deadline. Dragging a task onto Thursday says you will do it
   on Thursday; it does not tell your client it is now owed on Thursday.
   Sitting down with a task moves the day you are doing it, not the day it is
   due — otherwise every task you ever touched would read as due today.
   Bringing carried-over work forward moves the plan and leaves the lateness
   where it is, because "this was owed on Monday" is the fact you most need.
   And taking something off a day lets go of whichever date put it there. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const ctx = await b.newContext({viewport:{width:1400, height:1000}});
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2000); }

  /* four shapes: owed later but planned for today, owed today but planned for
     later, planned only, and one with neither date */
  const ids = await p.evaluate(() => {
    const T = today(), L = addDays(T, 4);
    const mk = (text, day, doDay) => { const t = newPlanTask(text, day, {doDay}); S.tasks.push(t); return t.id; };
    const out = {
      plan:  mk('s188 owed later, doing today', addDays(today(), 4), today()),
      owed:  mk('s188 owed today, doing later', today(), addDays(today(), 4)),
      only:  mk('s188 only planned for today', '', today()),
      none:  mk('s188 no date at all', '', ''),
      late:  mk('s188 planned for last week', '', addDays(today(), -6)),
      overdue: mk('s188 was owed last week', addDays(today(), -6), '')};
    saveNow(); return out;
  });
  const T = await p.evaluate(() => today());
  const names = rs => rs.filter(t => t.startsWith('s188')).sort();

  console.log('\n1. a day is either of a task’s two dates');
  const onToday = await p.evaluate(() => tasksForDay(today()).map(r => r.text));
  is('today holds all three that point at it', names(onToday),
    ['s188 only planned for today', 's188 owed later, doing today', 's188 owed today, doing later']);
  yes('  and not the one with no dates', !onToday.includes('s188 no date at all'));
  const later = await p.evaluate(() => tasksForDay(addDays(today(), 4)).map(r => r.text));
  is('the later day holds both of the ones pointing at it', names(later),
    ['s188 owed later, doing today', 's188 owed today, doing later']);

  console.log('\n2. a task with only a do date is scheduled, not unscheduled');
  const un = await p.evaluate(() => unscheduledTasks().map(r => r.text));
  yes('the one with neither date is unscheduled', un.includes('s188 no date at all'));
  yes('  the one planned for today is not', !un.includes('s188 only planned for today'));

  console.log('\n3. the planning date lists ask the same question');
  const sm = await p.evaluate(() => ({
    today: planSmartFilter('today').map(t => t.text),
    next7: planSmartFilter('next7').map(t => t.text),
    tomorrow: planSmartFilter('tomorrow').map(t => t.text)}));
  is('Today gathers everything pointing at today or earlier', names(sm.today),
    ['s188 only planned for today', 's188 owed later, doing today', 's188 owed today, doing later',
     's188 planned for last week', 's188 was owed last week']);
  is('the next seven days reach the one owed in four', names(sm.next7),
    ['s188 only planned for today', 's188 owed later, doing today', 's188 owed today, doing later']);
  is('tomorrow has none of them', names(sm.tomorrow), []);

  console.log('\n4. lateness is still about the deadline alone');
  const late = await p.evaluate(() => planOwnTasks().filter(planIsLate).map(t => t.text));
  yes('a missed deadline is late', late.includes('s188 was owed last week'));
  yes('  a day you set for yourself and did not keep is not', !late.includes('s188 planned for last week'),
    JSON.stringify(names(late)));

  console.log('\n5. the row says why it is on this day when the dates differ');
  await p.evaluate(() => { location.hash = '#/today'; rerender(); }); await p.waitForTimeout(1800);
  const rows = await p.evaluate(() => [...document.querySelectorAll('.task-row')]
    .filter(r => r.textContent.includes('s188'))
    .map(r => ({text: r.querySelector('.task-text').textContent,
                why: r.querySelector('.task-when')?.textContent || ''})));
  const why = t => (rows.find(r => r.text === t) || {}).why;
  yes('the one owed later says when it is owed', /due/.test(why('s188 owed later, doing today') || ''),
    JSON.stringify(rows));
  yes('the one planned for later says when it will be done', /to do/.test(why('s188 owed today, doing later') || ''),
    JSON.stringify(rows));
  is('the one with only a do date has nothing to explain', why('s188 only planned for today'), '');

  console.log('\n5b. a planning row shows the day set aside for it');
  await p.evaluate(() => { location.hash = '#/planning'; }); await p.waitForTimeout(1500);
  await p.evaluate(() => { planSetSel('smart', 'today'); S._planView = 'list'; rerender(); });
  await p.waitForTimeout(1200);
  const pills = await p.evaluate(() => [...document.querySelectorAll('[data-ptrow]')]
    .filter(r => r.textContent.includes('s188'))
    .map(r => ({text: r.querySelector('.pt-name, .pt-text')?.textContent || r.textContent.slice(0, 40),
      doPill: !!r.querySelector('.pt-do')})));
  yes('the one owed later, planned for today, says so',
    pills.some(x => /owed later/.test(x.text) && x.doPill), JSON.stringify(pills));
  yes('  and so does the one with only a do date, which is all it has',
    pills.some(x => /only planned for today/.test(x.text) && x.doPill), JSON.stringify(pills));
  /* when the two dates are the same day there is nothing extra to say, and a
     row that says "17 Sep · to do 17 Sep" is a row saying it twice */
  const agreed = await p.evaluate(ids => {
    const t = planTaskById(ids.none); t.day = today(); t.doDay = today(); saveNow(); rerender();
    return t.id; }, ids);
  await p.waitForTimeout(1100);
  is('a task whose two dates agree says it once', await p.evaluate(i => {
    const row = document.querySelector(`[data-ptrow="${i}"]`);
    return row ? !!row.querySelector('.pt-do') : 'no row'; }, agreed), false);

  console.log('\n6. carried-over work is either kind of missed day, and comes forward as a plan');
  await p.evaluate(() => { setTodayView('do'); location.hash = '#/today'; rerender(); const d = document.querySelector('#t-tasks'); if(d) d.open = true; }); await p.waitForTimeout(1600);
  const carried = await p.evaluate(() => {
    const el = [...document.querySelectorAll('.mono')].find(x => /carried over/.test(x.textContent));
    return el ? el.textContent : ''; });
  yes('both missed days are counted as carried over', /[2-9]\d* carried over/.test(carried), carried);
  await p.evaluate(() => { const b = document.querySelector('#carryAll'); if(b) b.click(); });
  await p.waitForTimeout(900);
  const after = await p.evaluate(ids => {
    const t = planTaskById(ids.overdue); return {day: t.day, doDay: t.doDay}; }, ids);
  is('bringing it forward sets the day you will do it', after.doDay, T);
  is('  and leaves the deadline where it was, so it is still late', after.day, await p.evaluate(() => addDays(today(), -6)));

  console.log('\n7. dropping a task on a day plans it, and does not move a deadline');
  /* the real gesture: the page's drag protocol puts the id on window and the
     column's own drop handler reads it, so this is the handler under test */
  const dropped = await p.evaluate(ids => {
    const col = document.querySelector('[data-daydrop]');
    if(!col) return {no: 'no column'};
    const t = planTaskById(ids.overdue);
    const before = {day: t.day, doDay: t.doDay};
    window._taskDrag = ids.overdue;
    const ev = new Event('drop', {bubbles: true, cancelable: true});
    ev.dataTransfer = {getData: () => ids.overdue};
    col.dispatchEvent(ev);
    window._taskDrag = null;
    const now = planTaskById(ids.overdue);
    return {before, day: now.day, doDay: now.doDay, onto: col.dataset.daydrop};
  }, ids);
  is('the do date lands on the day dropped on', dropped.doDay, dropped.onto);
  is('  the deadline is untouched', dropped.day, dropped.before.day);
  yes('  and the deadline is still in the past, so it is still late',
    dropped.day && dropped.day < T, JSON.stringify(dropped));

  console.log('\n8. sitting down with a task moves the plan, not the deadline');
  const sat = await p.evaluate(ids => {
    const t = planTaskById(ids.owed);
    t.day = addDays(today(), 4); t.doDay = addDays(today(), 4);
    focusOnTask(ids.owed, 0);
    return {day: t.day, doDay: t.doDay};
  }, ids);
  is('it is on today now', sat.doDay, T);
  is('  and still owed when it was owed', sat.day, await p.evaluate(() => addDays(today(), 4)));

  console.log('\n9. the panel has both boxes, and they write to different fields');
  await p.evaluate(() => { location.hash = '#/planning'; }); await p.waitForTimeout(1500);
  await p.evaluate(i => openPlanTask(i), ids.plan); await p.waitForTimeout(1000);
  const boxes = await p.evaluate(() => ({due: document.querySelector('#pdDay')?.value,
    doOn: document.querySelector('#pdDoDay')?.value}));
  is('due holds the deadline', boxes.due, await p.evaluate(() => addDays(today(), 4)));
  is('do on holds the plan', boxes.doOn, T);
  await p.evaluate(() => { const f = document.querySelector('#pdDoDay');
    f.value = addDays(today(), 3); f.dispatchEvent(new Event('change')); });
  await p.waitForTimeout(700);
  const written = await p.evaluate(i => { const t = planTaskById(i); return {day:t.day, doDay:t.doDay}; }, ids.plan);
  is('rewriting "do on" writes the do date', written.doDay, await p.evaluate(() => addDays(today(), 3)));
  is('  and leaves the deadline alone', written.day, await p.evaluate(() => addDays(today(), 4)));

  console.log('\n10. nothing threw');
  is('no page errors', errs, []);

  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
