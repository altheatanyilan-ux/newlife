/* smoke187 — the milestone strip on a dated selection, and the clock as a
   stopwatch you can drop work onto.

   THE STRIP. "when clicking on today/tomorrow/next 7 days, there should also
   be a milestone timeline showing all milestones that's within the selected
   period." The strip existed but only for a list or a folder, because a
   milestone belongs to a list and Today is not one. Today, Tomorrow and Next
   seven days are a window instead: every list's milestones, narrowed to the
   days the selection names. Today means today and anything already overdue,
   the same window its tasks come from — a strip that showed only the dates
   falling exactly on today would hide the one you have already missed, which
   is the one you most need to see.

   And the scale is the period, not the spread. Seven days should look like
   seven days even when both milestones in them fall on the Thursday;
   otherwise two dates a day apart fill the whole rail and read as a month.

   THE STOPWATCH. "for tasks where I didn't give an estimate, I can drag it
   onto the stopwatch and it will start counting up. and when i say pause
   session or end session for that one, the total time spent on task will show
   up." Dropping used to call setTask and leave the clock however it was set,
   so a task with no estimate got a 25-minute countdown — a length nobody
   chose, for work nobody has measured. Now the drop asks the task: where
   there is an estimate left, sit down with what is left of it; where there is
   none, count up.

   The figure was the other half, and finishing nearly did not get it: stop()
   writes the minutes down and then empties the clock, so reading the task off
   the timer AFTER stopping read null and said nothing at all. It is asked
   before. */
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
  const ctx = await b.newContext({viewport:{width:1400, height:900}});
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2000); }

  /* four milestones on one list, spread so that each window catches a
     different set: one overdue, one today, one tomorrow, one inside the week,
     one well outside it. */
  await p.evaluate(() => {
    const l = planLists()[0];
    l.milestones = [
      {id:'ms_over', name:'smoke187 overdue',  date: addDays(today(), -3)},
      {id:'ms_now',  name:'smoke187 today',    date: today()},
      {id:'ms_tom',  name:'smoke187 tomorrow', date: addDays(today(), 1)},
      {id:'ms_wk',   name:'smoke187 in the week', date: addDays(today(), 5)},
      {id:'ms_far',  name:'smoke187 far off',  date: addDays(today(), 40)}];
    saveNow();
  });

  console.log('\n1. a dated selection knows which milestones it is about');
  const window_ = await p.evaluate(() => ({
    today:    planMilestonesFor({kind:'smart', id:'today'}).map(x => x.m.id),
    tomorrow: planMilestonesFor({kind:'smart', id:'tomorrow'}).map(x => x.m.id),
    next7:    planMilestonesFor({kind:'smart', id:'next7'}).map(x => x.m.id)}));
  is('today is today and whatever is already overdue', window_.today, ['ms_over', 'ms_now']);
  is('tomorrow is tomorrow alone', window_.tomorrow, ['ms_tom']);
  is('the next seven days start at today', window_.next7, ['ms_now', 'ms_tom', 'ms_wk']);
  yes('  and none of them reach the one forty days out',
    !['today','tomorrow','next7'].some(k => window_[k].includes('ms_far')));

  console.log('\n2. the scale is the period the selection names, not the spread of its dates');
  const span = await p.evaluate(() => {
    const items = planMilestonesFor({kind:'smart', id:'next7'});
    const s = planDatedSpan('next7', items);
    return {days: daysBetween(s.from, s.to), holdsToday: s.from <= today() && s.to >= today(),
      holdsTheSeventh: s.to >= addDays(today(), 7)};
  });
  yes('seven days is drawn as at least seven days', span.days >= 7, `got ${span.days}`);
  yes('  today is inside the window', span.holdsToday);
  yes('  and so is the seventh day, even with nothing on it', span.holdsTheSeventh);

  console.log('\n3. the strip is on the page for today, tomorrow and the next seven');
  await p.evaluate(() => { location.hash = '#/planning'; }); await p.waitForTimeout(1500);
  for(const [id, want] of [['today', 2], ['tomorrow', 1], ['next7', 3]]){
    await p.evaluate(i => { planSetSel('smart', i); rerender(); }, id);
    await p.waitForTimeout(900);
    const seen = await p.evaluate(() => {
      const line = document.querySelector('.pl-msline');
      return {strip: !!document.querySelector('.pl-ms'), pins: line ? line.querySelectorAll('.pl-mspin').length : -1,
        empty: !!document.querySelector('.pl-ms.empty-strip')};
    });
    yes(`${id}: the strip is there`, seen.strip && !seen.empty, JSON.stringify(seen));
    is(`  with ${want} milestone${want===1?'':'s'} on it`, seen.pins, want);
  }

  console.log('\n4. a list still gets its own milestones, not the window');
  await p.evaluate(() => { const l = planLists()[0]; planSetSel('list', l.id); rerender(); });
  await p.waitForTimeout(900);
  is('all five of the list\'s dates are on its strip',
    await p.evaluate(() => document.querySelectorAll('.pl-msline .pl-mspin').length), 5);

  console.log('\n5. a task with no estimate dropped on the clock counts up');
  const noEst = await p.evaluate(() => {
    const t = newTask('smoke187 a thing nobody has measured'); S.tasks.push(t); saveNow(); return t.id; });
  await p.evaluate(i => { focusTakeTask(i); }, noEst);
  await p.waitForTimeout(1400);
  const up = await p.evaluate(() => { const s = FocusTimer.state();
    return {mode:s.mode, running:s.running, mine:s.taskId, elapsed:s.elapsed}; });
  is('the clock is a stopwatch', up.mode, 'stopwatch');
  yes('  running, on that task', up.running && up.mine === noEst, JSON.stringify(up));
  yes('  and counting up rather than down', up.elapsed >= 1, `elapsed ${up.elapsed}`);

  console.log('\n6. a task with an estimate still counts that estimate down');
  const withEst = await p.evaluate(() => {
    const t = newTask('smoke187 a thing with half an hour on it'); t.duration = 30;
    S.tasks.push(t); saveNow(); return t.id; });
  await p.evaluate(i => { focusTakeTask(i); }, withEst);
  await p.waitForTimeout(500);
  const down = await p.evaluate(() => { const s = FocusTimer.state();
    return {mode:s.mode, running:s.running, leftMin: Math.round(s.left / 60)}; });
  is('the clock counts down', down.mode, 'countdown');
  is('  the length is what is left of the estimate', down.leftMin, 30);

  console.log('\n7. pausing and finishing both say how long the task has had');
  await p.evaluate(() => { location.hash = '#/today'; }); await p.waitForTimeout(1400);
  await p.evaluate(() => { window._said = []; const o = window.toast;
    window.toast = m => { window._said.push(String(m)); o(m); }; });
  /* an hour of history on the task, so there is a figure to report */
  await p.evaluate(i => { planState().focusSessions.push({id:uid(), taskId:i, type:'focus',
    duration:42, startedAt:new Date().toISOString(), endedAt:new Date().toISOString()}); saveNow(); }, noEst);
  await p.evaluate(i => { focusTakeTask(i); paintFocusDock(); }, noEst);
  await p.waitForTimeout(500);
  await p.evaluate(() => { const g = document.querySelector('#fpGo'); if(g) g.click(); });
  await p.waitForTimeout(500);
  const onPause = await p.evaluate(() => window._said.slice());
  yes('pausing reports the total', onPause.some(m => /Paused/.test(m) && /42m/.test(m)), JSON.stringify(onPause));
  yes('  naming the task', onPause.some(m => /nobody has measured/.test(m)), JSON.stringify(onPause));
  await p.evaluate(() => { window._said = []; });
  await p.evaluate(() => { const s = document.querySelector('#fpStop'); if(s) s.click(); });
  await p.waitForTimeout(500);
  const onStop = await p.evaluate(() => window._said.slice());
  yes('finishing reports it too', onStop.some(m => /Finished/.test(m) && /42m/.test(m)), JSON.stringify(onStop));
  yes('  naming the task, not "this"', onStop.some(m => /nobody has measured/.test(m)), JSON.stringify(onStop));

  console.log('\n8. nothing threw');
  is('no page errors', errs, []);

  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
