/* smoke186 — three small repairs, two of them things that silently did nothing.

   THE QUEUE. "adding entry to personal queue under library of lived record
   don't work." The save handler read `m.querySelector('#qiVision').value` — a
   field this dialog does not have. It was dropped from the markup at some
   point and the reader was left behind, so querySelector returned null, the
   handler threw on .value, and it threw BEFORE the push: pressing "Add to
   queue" closed nothing, saved nothing and said nothing. A dialog that throws
   on its own save button is indistinguishable from a dead button.

   THE COUNT. "there might be some tasks that are not given a due date but
   finished on today — they will also be counted towards today's tasks done."
   A day's work is what was put on that day plus whatever was actually finished
   on it. Some of what you do is never scheduled: you think of it, you do it,
   you tick it. Counting only the dated ones made a day where six unplanned
   things got cleared read as "0 of 0 done".

   THE CLOCK'S NAME. It was a plain link to #/today, which on a page this long
   means the top of it and no clue where the thing you are timing sits. It goes
   to the row now — which took two goes, because restoreScroll() puts a forward
   navigation back at the top and does it again at the next frame, at 60ms and
   at 160ms, and because the page is still growing while the reveals run, so a
   scroll target measured once lands short of the row. */
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

  console.log('\n1. adding to the personal queue adds to the personal queue');
  await p.evaluate(() => { location.hash = '#/journals/library/lists'; }); await p.waitForTimeout(1700);
  yes('the Lists & Queue view is there', await p.evaluate(() => !!document.querySelector('#queueList')));
  const before = await p.evaluate(() => S.mediaQueue.length);
  await p.click('#qAdd'); await p.waitForTimeout(800);
  const fields = await p.evaluate(() => ({title: !!document.querySelector('#qiTitle'),
    save: !!document.querySelector('#qiSave'),
    /* the field whose absence broke the save */
    vision: !!document.querySelector('#qiVision')}));
  yes('the dialog opens', fields.title && fields.save, JSON.stringify(fields));
  yes('  and it still has no vision field, which is the point', !fields.vision);
  await p.fill('#qiTitle', 'smoke186 a book to read next');
  await p.fill('#qiWhy', 'somebody kept mentioning it');
  await p.click('#qiSave'); await p.waitForTimeout(1100);
  is('the queue is one longer', await p.evaluate(() => S.mediaQueue.length), before + 1);
  const it = await p.evaluate(() => S.mediaQueue.find(x => x.title === 'smoke186 a book to read next'));
  yes('  carrying what was typed', it && it.why === 'somebody kept mentioning it', JSON.stringify(it));
  yes('  the dialog closed behind it', await p.evaluate(() => !document.querySelector('#qiSave')));
  yes('  and it is on the page', await p.evaluate(() =>
    /smoke186 a book to read next/.test(document.querySelector('#queueList')?.textContent || '')));

  console.log('\n2. a day counts what was finished on it, not only what was dated for it');
  const counts = await p.evaluate(() => {
    const T = today();
    const before = tasksForDay(T).length;
    const a = newPlanTask('smoke186 unplanned, done', '', {listId:'inbox'});
    a.done = true; a.doneAt = T; S.tasks.push(a);
    const c = newPlanTask('smoke186 unplanned, not done', '', {listId:'inbox'});
    S.tasks.push(c);
    saveNow();
    const rows = tasksForDay(T);
    return {before, after: rows.length,
      hasDone: rows.some(r => r.text === 'smoke186 unplanned, done'),
      hasOpen: rows.some(r => r.text === 'smoke186 unplanned, not done'),
      marked: (rows.find(r => r.text === 'smoke186 unplanned, done') || {}).elsewhere === true};
  });
  is('an undated task finished today joins the day', counts.after, counts.before + 1);
  yes('  it is the finished one', counts.hasDone);
  yes('  and an undated one still open is not dragged in with it', !counts.hasOpen);
  yes('  the row says it was not on the list', counts.marked);
  /* a task dated another day but finished today belongs to today too, once */
  const both = await p.evaluate(() => {
    const T = today();
    const t = newPlanTask('smoke186 dated tomorrow, done today', addDays(T, 1), {listId:'inbox'});
    t.done = true; t.doneAt = T; S.tasks.push(t); saveNow();
    const rows = tasksForDay(T);
    return {here: rows.filter(r => r.text === 'smoke186 dated tomorrow, done today').length,
      noDoubles: new Set(rows.map(r => r.id)).size === rows.length};
  });
  is('  one dated tomorrow and finished today lands on today', both.here, 1);
  yes('  and nothing is counted twice', both.noDoubles);
  /* and Today's own summary moves with it */
  await p.evaluate(() => { setTodayView('do'); location.hash = '#/today'; }); await p.waitForTimeout(1700);
  await p.evaluate(() => { const d = document.querySelector('#t-tasks'); if(d) d.open = true; });
  await p.waitForTimeout(700);
  const said = await p.evaluate(() => document.querySelector('#t-tasks > summary')?.textContent || '');
  yes('the section says how many are done', /\d+ of \d+ done/.test(said), said.replace(/\s+/g, ' ').trim());

  console.log('\n3. the name under the clock goes to the task');
  const id = await p.evaluate(() => {
    /* a long day, so the row is genuinely below the fold and a scroll is
       needed rather than lucky */
    for(let i = 0; i < 25; i++) S.tasks.push(newPlanTask('smoke186 filler ' + i, today(), {listId:'inbox'}));
    const last = newPlanTask('smoke186 the one being timed', today(), {listId:'inbox'});
    last.order = 9e12; S.tasks.push(last); saveNow();
    FocusTimer.setTask(last.id); return last.id;
  });
  await p.evaluate(() => { location.hash = '#/planning'; }); await p.waitForTimeout(1500);
  is('the clock names the task it is holding',
     await p.evaluate(() => document.querySelector('.fd-onname')?.textContent), 'smoke186 the one being timed');
  yes('  and the name is a way back to it', await p.evaluate(() => !!document.querySelector('[data-fdjump]')));
  await p.evaluate(() => document.querySelector('[data-fdjump]').click());
  await p.waitForTimeout(2600);
  const landed = await p.evaluate(i => {
    const row = document.querySelector(`[data-taskrow="${i}"]`);
    const r = row ? row.getBoundingClientRect() : null;
    return {hash: location.hash, view: S.settings.todayView, found: !!row,
      onScreen: r ? (r.top > 0 && r.bottom < innerHeight) : null,
      scrolled: Math.round(window.scrollY)};
  }, id);
  is('pressing it goes to Today', landed.hash, '#/today');
  is('  on the half the tasks are on', landed.view, 'do');
  yes('  and the page is scrolled, not left at the top', landed.scrolled > 100, `${landed.scrolled}px`);
  yes('  with the task itself on the screen', landed.found && landed.onScreen, JSON.stringify(landed));
  /* with nothing parked there is nowhere to go, so it is not a link at all */
  await p.evaluate(() => { FocusTimer.setTask(null); rerender(); }); await p.waitForTimeout(1100);
  yes('and with nothing parked it offers no jump',
      await p.evaluate(() => !document.querySelector('[data-fdjump]')));

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(`\nsmoke186  ${bad ? bad + ' FAILED' : 'all good'}`);
  process.exit(bad ? 1 : 0);
})();
