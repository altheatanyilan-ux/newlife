/* smoke178 — the week as bars, and where a night goes.

   The sleep chart was two dots a day joined by a line, and the line was the
   trouble. Its length was the night; but a line drawn between "went to bed"
   and "got up" reads, to anyone not told otherwise, as the part of the day
   you were IN — so the picture said the opposite of what it meant. And a
   bedtime in the small hours crossed midnight, which left the awake figure
   looking like arithmetic you had to take on trust.

   One bar a day now, midnight to midnight, dark where you were asleep. The
   waking day is the gap between the two dark ends, which needs no line and no
   legend, and the hours in it are printed at the end of the row.

   The half of this worth testing is where a night lands. A night belongs to
   two calendar days and which two depends on the clock:

     to bed 23:30 Monday  →  Monday  dark 23:30–24:00
                             Tuesday dark 00:00–Tuesday's wake
     to bed 01:30 Monday  →  Monday  dark 01:30–Monday's wake, and nothing
                             at Monday's other end

   and the test for which is the house's own boundary hour — the same four in
   the morning it uses everywhere else to decide which day you are in. Not a
   second rule invented for a chart. Move the boundary and this moves with it,
   which is the last thing this file checks.

   The waking gap is not empty either. The blocks the day strip has always
   kept — a start, an end, a label — are drawn inside it, so a day reads as
   sleep, the things that happen whether you like them or not, and what is
   left. That last figure is the one worth having and the one nobody could
   see. No new store was invented for it: the blocks were already there. */
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
  const ctx = await b.newContext({viewport:{width:1280, height:1100}});
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1900); }

  /* a week with one ordinary night, one late one, and the morning after it */
  const seed = () => p.evaluate(() => {
    const T = today();
    S.dailyRhythm = S.dailyRhythm || {};
    const set = (d, wake, sleep, blocks) => {
      S.dailyRhythm[d] = {wakeTime: wake, sleepTime: sleep, blocks: blocks || []}; };
    set(addDays(T,-6), '07:00', '23:10');
    set(addDays(T,-5), '07:20', '23:45');
    set(addDays(T,-4), '08:00', '01:30');   // turned in after midnight
    set(addDays(T,-3), '09:30', '22:50');   // so this morning's sleep starts at 01:30
    set(addDays(T,-2), '06:50', '23:05', [
      {id:'b1', startTime:'08:00', endTime:'08:45', kind:'commute', tag:'Commute'},
      {id:'b2', startTime:'12:30', endTime:'13:15', kind:'meal',    tag:'Meal'},
      {id:'b3', startTime:'18:00', endTime:'19:00', kind:'exercise',tag:'Exercise'}]);
    set(addDays(T,-1), '07:10', '23:40');
    set(T, '07:05', '');
    saveNow(); location.hash = '#/journals/review';
  });
  await seed(); await p.waitForTimeout(1700);

  console.log('\n1. it is bars, one to a day, midnight to midnight');
  const shape = await p.evaluate(() => ({
    rows: document.querySelectorAll('.wk-row').length,
    bars: document.querySelectorAll('.wk-row .wk-bar').length,
    axis: [...document.querySelectorAll('.wk-axis span')].map(n => n.textContent),
    today: document.querySelectorAll('.wk-row.is-today').length,
    /* the thing it replaced */
    line: document.querySelectorAll('.wk-svg, polyline, .wk-line').length}));
  is('a row for each of the seven days', shape.rows, 7);
  is('  each of them a bar', shape.bars, 7);
  is('  the day runs midnight to midnight', shape.axis, ['0:00','4:00','8:00','12:00','16:00','20:00','24:00']);
  is('  today is marked', shape.today, 1);
  is('  and the dots and the line are gone', shape.line, 0);

  console.log('\n2. where a night goes');
  const spans = await p.evaluate(() => {
    const T = today();
    const at = d => daySleepSpans(d).map(s => [s.a, s.b, s.end]);
    return {late: at(addDays(T,-4)), after: at(addDays(T,-3)), ordinary: at(addDays(T,-5))};
  });
  /* to bed at 23:45 the night before, up at 08:00, to bed at 01:30 tonight:
     asleep from midnight to eight, and nothing at this day's other end,
     because half past one belongs to tomorrow's bar */
  is('an ordinary night ends one day and begins the next',
    spans.ordinary, [[0, 440, 'morning'], [1425, 1440, 'evening']]);
  is('  a night begun after midnight leaves this day with no evening',
    spans.late, [[0, 480, 'morning']]);
  is('  and lands on the next day, starting when you actually turned in',
    spans.after, [[90, 570, 'morning'], [1370, 1440, 'evening']]);

  console.log('\n3. the waking day is the gap, and it is stated');
  const awake = await p.evaluate(() => {
    const T = today();
    const mins = d => dayAwakeMinutes(d);
    return {after: mins(addDays(T,-3)), ordinary: mins(addDays(T,-5)),
      shown: [...document.querySelectorAll('.wk-awake')].map(n => n.textContent.trim())};
  });
  /* 24h less (01:30→09:30) less (22:50→24:00) = 14h 50m */
  is('the hours awake are the day less the dark', awake.after, 890);
  is('  and on an ordinary day too', awake.ordinary, 1440 - 440 - 15);
  yes('  every row says its own figure',
    awake.shown.filter(t => /awake/.test(t)).length >= 6, awake.shown.join(' | '));

  console.log('\n4. the gap is filled from the blocks the day already had');
  const acct = await p.evaluate(() => {
    const d = addDays(today(), -2);
    const a = dayAccount(d);
    return {by: a.by, free: a.free, awake: a.awake,
      drawn: document.querySelectorAll('.wk-act').length,
      /* no second store was invented for these */
      onTheDay: (S.dailyRhythm[d].blocks || []).length,
      newStore: typeof S.timeBlocks};
  });
  is('what was logged is read off the day itself', acct.onTheDay, 3);
  is('  not out of a store invented for the chart', acct.newStore, 'undefined');
  is('  and each one is drawn in the gap', acct.drawn, 3);
  is('  counted by what it was', acct.by, {commute: 45, meal: 45, exercise: 60});
  is('  and what is left over is what is yours', acct.free, acct.awake - 150);

  console.log('\n5. a block logged across the night is told, not counted quietly');
  await p.evaluate(() => {
    const d = addDays(today(), -2);
    S.dailyRhythm[d].blocks.push({id:'bx', startTime:'02:00', endTime:'03:00', kind:'chores', tag:'Chores'});
    saveNow(); rerender();
  });
  await p.waitForTimeout(1200);
  yes('it is marked as wrong where it is drawn',
    await p.evaluate(() => document.querySelectorAll('.wk-act.is-over').length === 1));

  console.log('\n6. one line says the day you are looking at');
  const readout = await p.evaluate(() => {
    const T = today();
    const box = document.querySelector('#wkAccount');
    const shown = () => [...box.querySelectorAll('.wk-acct')].filter(n => !n.hidden).map(n => n.dataset.acct);
    const before = shown();
    document.querySelector(`.wk-row[data-day="${addDays(T,-2)}"]`)
      .dispatchEvent(new PointerEvent('pointerenter', {bubbles: true}));
    return {before, after: shown(), rest: box.querySelector('.wk-acct.rest')?.dataset.acct};
  });
  is('it rests on today', readout.before, [readout.rest]);
  is('  and follows the row you are on', readout.after, [await p.evaluate(() => addDays(today(), -2))]);

  console.log('\n7. logging one takes a line, not a page');
  const added = await p.evaluate(() => {
    const f = document.querySelector('[data-wkadd]');
    if(!f) return null;
    const d = addDays(today(), -6);
    f.day.value = d; f.kind.value = 'meal'; f.from.value = '19:00'; f.to.value = '19:40';
    f.dispatchEvent(new Event('submit', {cancelable: true, bubbles: true}));
    return d;
  });
  await p.waitForTimeout(900);
  yes('the form is one line with four fields and a button', !!added);
  is('  and what it adds lands on the day it was told',
    await p.evaluate(d => (S.dailyRhythm[d].blocks || [])
      .filter(b => b.kind === 'meal' && b.startTime === '19:00').length, added), 1);

  console.log('\n8. and the rule is the house\'s boundary, not a number typed here');
  /* Move the hour the day turns over and a 05:00 bedtime stops being an early
     night and becomes a late one — the same reading, filed on the other day. */
  const moved = await p.evaluate(() => {
    const T = today(), d = addDays(T, -6);
    S.dailyRhythm[d] = {wakeTime: '', sleepTime: '05:00', blocks: []};
    S.dailyRhythm[addDays(T, -5)] = {wakeTime: '12:00', sleepTime: '', blocks: []};
    S.settings.dayBoundaryHour = 4; saveNow();
    const at4 = daySleepSpans(addDays(T, -5)).map(s => [s.a, s.b]);
    S.settings.dayBoundaryHour = 6; saveNow();
    const at6 = daySleepSpans(addDays(T, -5)).map(s => [s.a, s.b]);
    S.settings.dayBoundaryHour = 4; saveNow();
    return {at4, at6};
  });
  /* at a four o'clock boundary five in the morning is an evening, so the night
     was already under way at midnight; at six it is the small hours, and the
     night began at five */
  is('with the day turning at four, five in the morning is an early night', moved.at4, [[0, 720]]);
  is('  with it turning at six, the same reading is a late one', moved.at6, [[300, 720]]);

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(`\nsmoke178  ${bad ? bad + ' FAILED' : 'all good'}`);
  process.exit(bad ? 1 : 0);
})();
