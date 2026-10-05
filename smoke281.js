/* smoke281 — a do date can be a stretch of days, not only one.

   The claims.

   A task can be given a first day (`doDay`) and a last (`doEnd`); with no last
   day it is the single day it always was. The task is then on every day of
   the stretch: it is on Today on each of them, in the calendar square of each,
   and in any period that takes in any one of them — not only the two ends.
   A stretch under way today is not "carried over"; one that ended unfinished
   is. A stretch finished early stops at the day it was finished. An end that
   is not after the start is let go, and naming only an end means "from today".
   "Not today" on a stretch gives up today only: it carries on tomorrow, or,
   on its last day, comes off like a single day. Carried across a month's
   edge the calendar shows only the days that fall in that month, and dragging
   one pill moves the whole stretch. The task's own panel has a field for the
   last day.

   Run: NODE_PATH=node_modules node smoke281.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1300, height: 1000}})).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  /* a Tuesday: the 6th of October 2026 */
  await p.clock.install({time: new Date('2026-10-06T10:00:00')});
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  await p.evaluate(() => { closeModals(); document.querySelectorAll('.toast').forEach(n => n.remove()); });

  const ids = await p.evaluate(() => {
    S.tasks.splice(0);
    const mk = (text, a, z) => { const t = newPlanTask(text, '', {listId: 'inbox'}); t.day = ''; taskSetDoRange(t, a, z); S.tasks.push(t); return t.id; };
    const o = {
      run:    mk('Write the chapter',  '2026-10-05', '2026-10-08'),   /* under way today */
      future: mk('Sand the table',     '2026-10-09', '2026-10-11'),
      past:   mk('Clear the garage',   '2026-10-01', '2026-10-03'),   /* ended, not done */
      last:   mk('Finish the report',  '2026-10-05', '2026-10-06'),   /* last day is today */
      one:    mk('Ring the bank',      '2026-10-06', ''),             /* the old single day */
      early:  mk('Paint the fence',    '2026-10-05', '2026-10-12'),
      edge:   mk('Move house',         '2026-09-29', '2026-10-02'),   /* over a month's edge */
    };
    const e = S.tasks.find(t => t.id === o.early); e.done = true; e.doneAt = '2026-10-07';
    saveNow();
    return o;
  });
  const T = id => `S.tasks.find(t => t.id === '${id}')`;

  console.log('\n1. the task is on each day of the stretch');
  const on = await p.evaluate(({id}) => { const t = S.tasks.find(x => x.id === id);
    return ['2026-10-04','2026-10-05','2026-10-06','2026-10-07','2026-10-08','2026-10-09'].map(d => planOnDay(planTaskDefaults(t), d)); }, {id: ids.run});
  is('on 5–8 October, not the day before or after', on, [false, true, true, true, true, false]);
  const rows = await p.evaluate(({id}) => ['2026-10-04','2026-10-07','2026-10-09'].map(d => tasksForDay(d).some(r => r.id === id)), {id: ids.run});
  is('and tasksForDay agrees', rows, [false, true, false]);
  yes('a period that takes in only its middle still has it', await p.evaluate(({id}) =>
    planOnWithin(planTaskDefaults(S.tasks.find(t => t.id === id)), '2026-10-10', '2026-10-10'), {id: ids.future}));
  is('the old single day is still one day', await p.evaluate(({id}) =>
    ['2026-10-05','2026-10-06','2026-10-07'].map(d => planOnDay(planTaskDefaults(S.tasks.find(t => t.id === id)), d)), {id: ids.one}), [false, true, false]);
  is('finished early, it stops at the day it was finished', await p.evaluate(({id}) =>
    ['2026-10-05','2026-10-07','2026-10-08'].map(d => taskDoCovers(S.tasks.find(t => t.id === id), d)), {id: ids.early}), [true, true, false]);

  console.log('\n2. setting the dates is forgiving');
  const f = await p.evaluate(() => {
    const t = {}, o = {};
    taskSetDoRange(t, '2026-10-10', '2026-10-08'); o.backwards = [t.doDay, t.doEnd];
    taskSetDoRange(t, '2026-10-10', '2026-10-10'); o.same = [t.doDay, t.doEnd];
    taskSetDoRange(t, '', '2026-10-20');           o.onlyEnd = [t.doDay, t.doEnd];
    taskSetDoRange(t, '', '2026-10-01');           o.pastEnd = [t.doDay, t.doEnd];
    taskSetDoRange(t, '', '');                     o.cleared = [t.doDay, t.doEnd];
    return o; });
  is('an end before the start is let go', f.backwards, ['2026-10-10', '']);
  is('an end on the start is no stretch', f.same, ['2026-10-10', '']);
  is('only an end: from today until then', f.onlyEnd, ['2026-10-06', '2026-10-20']);
  is('only an end that is past: just that day', f.pastEnd, ['2026-10-01', '']);
  is('cleared is cleared', f.cleared, ['', '']);

  console.log('\n3. Today');
  await p.evaluate(() => { S.settings.todayView = 'do'; location.hash = '#/today/do'; rerender(); }); await p.waitForTimeout(1400);
  const row = id => p.evaluate(id => { const r = document.querySelector(`[data-taskrow="${id}"]`);
    return r ? (r.textContent || '').replace(/\s+/g, ' ') : null; }, id);
  const run = await row(ids.run);
  yes('a stretch under way is on today\'s list', run !== null);
  yes('  and says it is a stretch', run && /–/.test(run), run);
  is('one that starts later is not', await row(ids.future), null);
  yes('one that ended unfinished is carried, not listed', (await row(ids.past)) === null && !!(await p.$('#carryAll')));
  yes('the one under way is not offered to be carried', await p.evaluate(({id}) =>
    !(document.querySelector('#carryAll')?.closest('div')?.textContent || '').includes('Write the chapter'), {id: ids.run}));

  console.log('\n4. "not today" gives up today only');
  await p.evaluate(id => document.querySelector(`[data-tdefer="${id}"]`).click(), ids.run); await p.waitForTimeout(400);
  is('a stretch carries on from tomorrow', await p.evaluate(({id}) => { const t = S.tasks.find(x => x.id === id); return [t.doDay, t.doEnd]; }, {id: ids.run}), ['2026-10-07', '2026-10-08']);
  await p.evaluate(id => document.querySelector(`[data-tdefer="${id}"]`).click(), ids.last); await p.waitForTimeout(400);
  is('on its last day it comes off like a single day', await p.evaluate(({id}) => { const t = S.tasks.find(x => x.id === id); return [t.doDay, t.doEnd]; }, {id: ids.last}), ['', '']);

  console.log('\n5. the calendar');
  const cal = await p.evaluate(({future, edge}) => {
    const tasks = planOwnTasks();
    const html = planCalMonthHTML('2026-10-15', tasks);
    const n = id => (html.match(new RegExp(`data-ptcard="${id}"`, 'g')) || []).length;
    return {future: n(future), edge: n(edge)}; }, ids);
  is('a three-day stretch is in three squares', cal.future, 3);
  is('one over the month\'s edge is only in the days that are this month\'s', cal.edge, 2);
  await p.evaluate(({future}) => planMoveCalDate(S.tasks.find(t => t.id === future), '2026-10-10', '2026-10-12'), ids);
  is('dragging one pill moves the whole stretch', await p.evaluate(({id}) => { const t = S.tasks.find(x => x.id === id); return [t.doDay, t.doEnd]; }, {id: ids.future}), ['2026-10-11', '2026-10-13']);

  console.log('\n6. the task\'s own panel');
  await p.evaluate(() => { location.hash = '#/planning'; }); await p.waitForTimeout(1200);
  await p.evaluate(id => openPlanTask(id), ids.one); await p.waitForTimeout(500);
  yes('there is a field for the last day', !!(await p.$('#pdDoEnd')));
  const setv = (sel, v) => p.evaluate(({sel, v}) => { const x = document.querySelector(sel); x.value = v; x.dispatchEvent(new Event('change', {bubbles: true})); }, {sel, v});
  await setv('#pdDoEnd', '2026-10-09'); await p.waitForTimeout(300);
  is('naming the last day makes it a stretch', await p.evaluate(({id}) => { const t = S.tasks.find(x => x.id === id); return [t.doDay, t.doEnd]; }, {id: ids.one}), ['2026-10-06', '2026-10-09']);
  await setv('#pdDoEnd', '2026-10-05'); await p.waitForTimeout(300);
  is('a last day before the first is let go', await p.evaluate(({id}) => { const t = S.tasks.find(x => x.id === id); return [t.doDay, t.doEnd]; }, {id: ids.one}), ['2026-10-06', '']);

  console.log('\n7. nothing broke on the way');
  yes('no page errors', !errs.length, errs.join(' | '));
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
