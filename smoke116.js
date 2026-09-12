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
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const title = () => p.evaluate(() => document.querySelector('.pl-title')?.textContent || null);
  const go = async h => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(1700); };

  console.log('\n1. Statistics fills the page');
  await go('#/planning/stats');
  const w = await p.evaluate(() => ({room: Math.round(document.querySelector('.pl-stats-room').getBoundingClientRect().width),
    page: Math.round(document.querySelector('.plan-page').getBoundingClientRect().width)}));
  is('as wide as the page it is in', w.room, w.page);
  yes('  which is far more than the reading column', w.room > 900, JSON.stringify(w));

  console.log('\n2. an address is where you arrived, not a standing order');
  await go('#/planning/today');
  is('it opens on the span named', await title(), 'Today');
  is('  and the address is spent', await p.evaluate(() => location.hash), '#/planning');
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
  await go('#/planning/habits');
  is('habits opens', await p.evaluate(() => planRoom()), 'habits');
  await p.click('[data-plroom="tasks"]'); await p.waitForTimeout(1300);
  is('  and you can leave it again', await p.evaluate(() => planRoom()), 'tasks');
  await p.evaluate(() => rerender()); await p.waitForTimeout(1000);
  is('  without being dragged back', await p.evaluate(() => planRoom()), 'tasks');

  console.log('\n3. every selection opens on the matrix');
  await p.evaluate(() => { planSetView('calendar'); }); await p.waitForTimeout(1200);
  is('a view chosen by hand is honoured', await p.evaluate(() => planView()), 'calendar');
  await p.click(`[data-plsel="list:${listId}"]`); await p.waitForTimeout(1300);
  is('then picking a list goes back to the matrix', await p.evaluate(() => planView()), 'eisenhower');
  await p.evaluate(() => { planSetView('kanban'); }); await p.waitForTimeout(1100);
  await p.click('[data-plsel="smart:all"]'); await p.waitForTimeout(1300);
  is('  and so does picking All', await p.evaluate(() => planView()), 'eisenhower');
  await p.evaluate(() => { planSetView('list'); }); await p.waitForTimeout(1100);
  await p.click('[data-plspan="tomorrow"]'); await p.waitForTimeout(1300);
  is('  and choosing a span', await p.evaluate(() => planView()), 'eisenhower');
  const folder = await p.evaluate(() => planState().folders[0]?.id);
  if(folder){
    await p.evaluate(() => { planSetView('timeline'); }); await p.waitForTimeout(1100);
    await p.click(`[data-plsel="folder:${folder}"]`); await p.waitForTimeout(1300);
    is('  and a folder', await p.evaluate(() => planView()), 'eisenhower');
  }

  console.log('\n3b. a list given a view of its own still gets it');
  await p.evaluate(i => { planList(i).defaultView = 'kanban'; saveNow(); }, listId);
  await p.click(`[data-plsel="list:${listId}"]`); await p.waitForTimeout(1300);
  is('the board, as that list asked', await p.evaluate(() => planView()), 'kanban');

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke116  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
