/* smoke116 — Statistics fills the page, a selection opens on the matrix, and
   an address naming a span stops overriding what you click */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('/home/user/newlife/index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1500, height:1200}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource|ERR_CERT_AUTHORITY_INVALID/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const title = () => p.evaluate(() => document.querySelector('.pl-title')?.textContent || null);
  const go = async h => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(1700); };

  console.log('\n1. Statistics fills the page');
  /* Statistics lives in Today's Review view now; the old address still leads there */
  await go('#/planning/stats');
  is('the old address leads to Today → Review, where Statistics is', await p.evaluate(() => location.hash), '#/today/review');
  const w = await p.evaluate(() => ({room: Math.round(document.querySelector('#rvStats').getBoundingClientRect().width),
    page: Math.round(document.querySelector('.today-room').getBoundingClientRect().width)}));
  yes('as wide as the page it is in', Math.abs(w.room - w.page) <= 40, JSON.stringify(w));
  yes('  which is far more than the reading column', w.room > 900, JSON.stringify(w));

  console.log('\n2. an address is where you arrived, not a standing order');
  await go('#/planning/today');
  is('it opens on the span named', await title(), 'Today');
  /* Planning is Today's Tasks view now, so the address it settles on is that view's */
  is('  and the address is spent', await p.evaluate(() => location.hash), '#/today/tasks');
  const listId = await p.evaluate(() => planLists().find(l => l.id !== 'inbox').id);
  const listName = await p.evaluate(i => planList(i).name, listId);
  await p.click(`[data-plsel="list:${listId}"]`); await p.waitForTimeout(1400);
  is('clicking a list actually opens that list', await title(), listName);
  is('  and the selection stayed put', await p.evaluate(() => planSel().kind), 'list');
  /* the bug was that the next redraw reverted it, so force one */
  await p.evaluate(() => rerender()); await p.waitForTimeout(1100);
  is('  and a redraw does not put Today back', await title(), listName);

  console.log('\n2b. the same from tomorrow and next7');
  for(const span of ['tomorrow', 'next7']){
    await go('#/planning/' + span);
    await p.click(`[data-plsel="list:${listId}"]`); await p.waitForTimeout(1300);
    is(`from ${span}, a list opens`, await title(), listName);
  }

  console.log('\n2c. and the room addresses still work');
  /* the rooms are Today's views now: the switch at the top of Today */
  await go('#/planning/habits');
  is('habits opens', await p.evaluate(() => todayView()), 'habits');
  await p.click('.today-switch [data-tview="tasks"]'); await p.waitForTimeout(1300);
  is('  and you can leave it again', await p.evaluate(() => todayView()), 'tasks');
  await p.evaluate(() => rerender()); await p.waitForTimeout(1000);
  is('  without being dragged back', await p.evaluate(() => todayView()), 'tasks');

  console.log('\n3. every selection opens on the matrix');
  await p.evaluate(() => { planSetView('calendar'); }); await p.waitForTimeout(1200);
  is('a view chosen by hand is honoured', await p.evaluate(() => planView()), 'calendar');
  await p.click(`[data-plsel="list:${listId}"]`); await p.waitForTimeout(1300);
  is('then picking a list goes back to the matrix', await p.evaluate(() => planView()), 'eisenhower');
  /* "All" has gone from the sidebar — a list of every task in the house is the
     one view that never answers a question. A span is the other change: Today,
     Tomorrow and the next seven days open as a day rather than a matrix, on
     purpose (smoke179), so the span is held to that instead. */
  await p.evaluate(() => { planSetView('calendar'); }); await p.waitForTimeout(1100);
  await p.click('[data-plspan="tomorrow"]'); await p.waitForTimeout(1300);
  is('  while choosing a span opens the day', await p.evaluate(() => planView()), 'list');
  const folder = await p.evaluate(() => planState().folders[0]?.id);
  if(folder){
    await p.evaluate(() => { planSetView('calendar'); }); await p.waitForTimeout(1100);
    await p.click(`[data-plsel="folder:${folder}"]`); await p.waitForTimeout(1300);
    is('  and a folder is back on the matrix', await p.evaluate(() => planView()), 'eisenhower');
  }

  console.log('\n3b. a list given a view of its own still gets it');
  /* the Board is retired, so a list asks for the calendar instead */
  await p.evaluate(i => { planList(i).defaultView = 'calendar'; saveNow(); }, listId);
  await p.click(`[data-plsel="list:${listId}"]`); await p.waitForTimeout(1300);
  is('the calendar, as that list asked', await p.evaluate(() => planView()), 'calendar');

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke116  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
