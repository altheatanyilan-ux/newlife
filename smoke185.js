/* smoke185 — one Enter makes one task; a filter belongs to the list it was set
   on; and a list you are working in holds still.

   THE DUPLICATE. "sometimes when adding a task, two entries or three entries
   will be added; this doesn't happen every time, not sure what caused it."

   rerenderPlanBody replaces #plBody and leaves the sidebar, the header and the
   milestone strip standing, then binds the whole page again. Handlers set with
   `node.onclick = …` replace, so binding twice is harmless — and almost
   everything here is set that way, which is why this went unnoticed. The
   quick-add uses addEventListener, which STACKS. The add field is in the
   header now, so it survived every partial redraw and collected one more
   keydown handler each time: tick a task, rename one, edit one in the panel —
   each of those redraws the body — and then one Enter made two tasks, then
   three. Which is exactly as baffling as the report says, because the number
   depends on how much you happened to do since the last full redraw.

   So the test does the thing that causes it — redraw the body a few times —
   and then adds one task. Section 1 counts tasks, not handlers: what matters
   is what ends up in the data.

   THE FILTER. "when clicking to a different list on the tasks, previous
   filters automatically stop applying." A filter set at the foot of the
   sidebar stayed on across every list you opened afterwards, so a list came up
   half empty for a reason three clicks away, and read as wrong rather than as
   narrowed. The search box keeps its text, because its text is on the screen.

   THE TILT. "when navigating the tasks, don't give that kind of micro
   interaction where the rectangle tilt when my cursor moves." The card holding
   the day's tasks was in the tilt table, so reading down a list tipped every
   row you were aiming at by a few degrees. */
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
  await p.evaluate(() => { location.hash = '#/planning'; }); await p.waitForTimeout(1500);

  const addOne = async text => {
    const before = await p.evaluate(t => S.tasks.filter(x => x.text === t).length, text);
    await p.fill('.pl-top .pl-add-input', text);
    await p.press('.pl-top .pl-add-input', 'Enter');
    await p.waitForTimeout(1000);
    const after = await p.evaluate(t => S.tasks.filter(x => x.text === t).length, text);
    return after - before;
  };

  console.log('\n1. one Enter makes one task, however much came before it');
  is('on a page that has just been drawn', await addOne('smoke185 the first'), 1);
  /* the thing that caused it: a partial redraw, which is what ticking,
     renaming or editing a task does */
  await p.evaluate(() => rerenderPlanBody()); await p.waitForTimeout(800);
  is('  after one partial redraw', await addOne('smoke185 the second'), 1);
  await p.evaluate(() => { rerenderPlanBody(); rerenderPlanBody(); rerenderPlanBody(); });
  await p.waitForTimeout(900);
  is('  after four', await addOne('smoke185 the third'), 1);
  /* and through the door it actually comes in by */
  await p.evaluate(() => { const t = S.tasks.find(x => !x.done);
    document.querySelector(`[data-ptdone="${t.id}"]`)?.click(); });
  await p.waitForTimeout(1000);
  await p.evaluate(() => { const t = S.tasks.find(x => !x.done);
    document.querySelector(`[data-ptdone="${t.id}"]`)?.click(); });
  await p.waitForTimeout(1000);
  is('  and after ticking two tasks off, which is what does it', await addOne('smoke185 the fourth'), 1);

  console.log('\n2. the field inside the list still works after a redraw');
  await p.evaluate(() => { planSetView('list'); }); await p.waitForTimeout(1300);
  await p.evaluate(() => rerenderPlanBody()); await p.waitForTimeout(900);
  const innerMade = await p.evaluate(() => {
    const f = [...document.querySelectorAll('[data-pqadd]')].find(n => !n.classList.contains('pl-add-input'));
    if(!f) return 'no field in the body';
    f.value = 'smoke185 from inside the list';
    f.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true}));
    return true;
  });
  await p.waitForTimeout(1100);
  yes('there is an add field in the list as well', innerMade === true, String(innerMade));
  is('  and it makes exactly one', await p.evaluate(() =>
    S.tasks.filter(t => t.text === 'smoke185 from inside the list').length), 1);

  console.log('\n3. a filter belongs to the list it was set on');
  const two = await p.evaluate(() => planLists().filter(l => l.id !== 'inbox').slice(0, 2).map(l => l.id));
  yes('there are two lists to move between', two.length === 2, JSON.stringify(two));
  await p.evaluate(i => planSetSel('list', i), two[0]); await p.waitForTimeout(1000);
  await p.evaluate(() => { S._planFilter = {priorities: [3]}; rerender(); }); await p.waitForTimeout(900);
  is('a filter is on', await p.evaluate(() => planFilterCount(S._planFilter)), 1);
  yes('  and the page says so', await p.evaluate(() => !!document.querySelector('.pl-filter.on')));
  await p.evaluate(i => planSetSel('list', i), two[1]); await p.waitForTimeout(1000);
  is('  opening another list drops it', await p.evaluate(() => planFilterCount(S._planFilter)), 0);
  /* but staying where you are does not throw away what you just set */
  await p.evaluate(() => { S._planFilter = {priorities: [3]}; rerender(); }); await p.waitForTimeout(800);
  await p.evaluate(i => planSetSel('list', i), two[1]); await p.waitForTimeout(900);
  is('  while re-choosing the list you are on keeps it',
     await p.evaluate(() => planFilterCount(S._planFilter)), 1);
  /* the search is a different thing: its text is on the screen, so it stays */
  await p.evaluate(() => { S._planQ = 'zzz'; rerender(); }); await p.waitForTimeout(800);
  await p.evaluate(i => planSetSel('list', i), two[0]); await p.waitForTimeout(900);
  is('  and the search, which is visible, is left alone', await p.evaluate(() => S._planQ), 'zzz');
  await p.evaluate(() => { S._planQ = ''; S._planFilter = {}; rerender(); }); await p.waitForTimeout(700);

  console.log('\n4. the list you are working in holds still');
  await p.evaluate(() => { setTodayView('do'); location.hash = '#/today'; }); await p.waitForTimeout(1700);
  await p.evaluate(() => { const d = document.querySelector('#t-tasks'); if(d) d.open = true; });
  await p.waitForTimeout(700);
  const row = await p.evaluate(() => { const n = document.querySelector('.task-row');
    if(!n) return null; const r = n.getBoundingClientRect();
    return {x: r.x + r.width / 2, y: r.y + r.height / 2}; });
  yes('there are task rows on Today', !!row, 'none');
  await p.mouse.move(row.x - 90, row.y); await p.waitForTimeout(260);
  await p.mouse.move(row.x + 90, row.y + 14); await p.waitForTimeout(450);
  const card = await p.evaluate(() => { const c = document.querySelector('.task-row').closest('.card');
    return {opted: c.classList.contains('no-tilt'), tilted: c.classList.contains('mfx-tilt'),
      transform: getComputedStyle(c).transform}; });
  yes('the card holding them is out of the tilt table', card.opted, JSON.stringify(card));
  yes('  so sweeping the pointer across it does not tip it',
      !card.tilted && card.transform === 'none', JSON.stringify(card));
  /* the opt-out is a class, not the end of tilting: a card you only look at
     still has it */
  const still = await p.evaluate(() => {
    const n = document.createElement('div'); n.className = 'card'; n.textContent = 'x';
    document.querySelector('#main').appendChild(n);
    const has = !n.classList.contains('no-tilt'); n.remove(); return has; });
  yes('  and an ordinary card is untouched by the opt-out', still);

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(`\nsmoke185  ${bad ? bad + ' FAILED' : 'all good'}`);
  process.exit(bad ? 1 : 0);
})();
