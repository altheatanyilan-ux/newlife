/* smoke184 — in the Inbox, the pile stands beside the boxes it is going into.

   "only for inbox view in the planning page, show the not yet placed list on
   the left of the eisenhower matrix."

   The matrix has always kept its unplaced tasks in a tray underneath, which is
   right for every list but one. In a project list the placed tasks are the
   subject and the stragglers are a footnote. In the Inbox it is the other way
   round: the Inbox IS the pile, and you are there to empty it into the four
   boxes. Underneath, that drag went off the bottom of the screen and back.

   So: only for the Inbox, and only on the matrix, the tray is a column down
   the left. Two things worth pinning down, because both would be easy to get
   subtly wrong and neither would look wrong in a screenshot —

     · "only for the Inbox": every other selection keeps the tray underneath,
       which is what section 2 is for;
     · the tray is still the same tray. It is a drop target either way round,
       so a card dragged out of a quadrant still comes back to it. What does
       change is the card width: across, each card needed a width of its own
       and a handle to drag it by; down a column the column is the width, so
       the handle has nothing left to set and is gone. */
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
  await p.evaluate(() => { location.hash = '#/planning'; }); await p.waitForTimeout(1400);
  await p.evaluate(() => { ['smoke184 a stray thought','smoke184 call the bank','smoke184 read the thing']
    .forEach(t => S.tasks.push(newPlanTask(t, '', {listId:'inbox'})));
    saveNow(); }); await p.waitForTimeout(400);

  const shape = async () => p.evaluate(() => {
    const w = document.querySelector('.pe-withtray');
    const tray = document.querySelector('.pe-tray'), grid = document.querySelector('.pe-grid');
    const r = n => n ? n.getBoundingClientRect() : null;
    const t = r(tray), g = r(grid);
    return {aside: !!w, tray: !!tray, grid: !!grid,
      trayLeftOfGrid: t && g ? Math.round(t.x) < Math.round(g.x) : null,
      sideBySide: t && g ? Math.abs(Math.round(t.y) - Math.round(g.y)) < 40 : null,
      cards: document.querySelectorAll('.pe-traybox .pk-card').length,
      grips: [...document.querySelectorAll('.pe-traybox .pe-grip')]
        .filter(n => getComputedStyle(n).display !== 'none').length,
      dropTarget: !!document.querySelector('.pe-traybox[data-pequad="0"]')};
  });

  console.log('\n1. the Inbox puts the pile beside the boxes');
  await p.evaluate(() => { planSetSel('list', 'inbox'); }); await p.waitForTimeout(1100);
  await p.evaluate(() => { planSetView('eisenhower'); }); await p.waitForTimeout(1200);
  const inbox = await shape();
  yes('the matrix is laid out with the tray alongside', inbox.aside, JSON.stringify(inbox));
  yes('  the unplaced are on the left of it', inbox.trayLeftOfGrid, JSON.stringify(inbox));
  yes('  and level with it, not above or below', inbox.sideBySide, JSON.stringify(inbox));
  yes('  with the tasks in it', inbox.cards >= 3, String(inbox.cards));
  yes('  it is still the same drop target', inbox.dropTarget);
  is('  and the width handle is gone, since the column is the width', inbox.grips, 0);

  console.log('\n2. every other list keeps it underneath, where it belongs');
  const other = await p.evaluate(() => planLists().find(l => l.id !== 'inbox')?.id);
  await p.evaluate(id => { planSetSel('list', id); }, other); await p.waitForTimeout(1100);
  await p.evaluate(() => { planSetView('eisenhower'); }); await p.waitForTimeout(1200);
  const list = await shape();
  yes('a project list is not rearranged', !list.aside, JSON.stringify(list));
  yes('  its tray is below the quadrants', list.tray && list.grid && !list.trayLeftOfGrid,
      JSON.stringify(list));
  await p.evaluate(() => { planSetSel('smart', 'today'); }); await p.waitForTimeout(1100);
  await p.evaluate(() => { planSetView('eisenhower'); }); await p.waitForTimeout(1200);
  yes('  and nor is a date', !(await shape()).aside);

  console.log('\n3. it is the matrix this applies to, not the Inbox everywhere');
  await p.evaluate(() => { planSetSel('list', 'inbox'); }); await p.waitForTimeout(1100);
  await p.evaluate(() => { planSetView('list'); }); await p.waitForTimeout(1200);
  const asList = await p.evaluate(() => ({aside: !!document.querySelector('.pe-withtray'),
    rows: document.querySelectorAll('[data-ptrow]').length}));
  yes('reading the Inbox as a list is untouched', !asList.aside);
  yes('  and still shows what is in it', asList.rows >= 3, String(asList.rows));

  console.log('\n4. and the tray still does what a tray does');
  await p.evaluate(() => { planSetView('eisenhower'); }); await p.waitForTimeout(1200);
  /* the starter set puts things in the Inbox too, so count what is there
     rather than assuming it is only what this test wrote */
  const before = (await shape()).cards;
  const moved = await p.evaluate(() => {
    /* place one by hand, the way a drop would, and see it leave the tray */
    const t = S.tasks.find(x => x.text === 'smoke184 call the bank');
    t.quadrant = 1; saveNow(); rerender(); return t.id;
  });
  await p.waitForTimeout(1200);
  const after = await p.evaluate(id => ({
    inTray: !!document.querySelector(`.pe-traybox [data-ptcard="${id}"], .pe-traybox [data-ptrow="${id}"]`),
    inQuad: !!document.querySelector(`.pe-quad[data-pequad="1"] [data-ptcard="${id}"], .pe-quad[data-pequad="1"] [data-ptcard]`),
    left: document.querySelectorAll('.pe-traybox .pk-card').length}), moved);
  yes('placing one takes it out of the pile', !after.inTray, JSON.stringify(after));
  yes('  and puts it in the box', after.inQuad, JSON.stringify(after));
  is('  leaving the rest where they were', after.left, before - 1);

  console.log('\n5. a narrow window stacks it again rather than squeezing it');
  const narrow = await b.newContext({viewport:{width:800, height:900}});
  const q = await narrow.newPage();
  q.on('pageerror', e => errs.push('pageerror(narrow): ' + e.message));
  await q.goto(FILE); await q.waitForTimeout(1000);
  if(await q.$('#frGo')){ await q.click('#frGo'); await q.waitForTimeout(2000); }
  await q.evaluate(() => { location.hash = '#/planning'; }); await q.waitForTimeout(1400);
  await q.evaluate(() => { planSetSel('list','inbox'); }); await q.waitForTimeout(1100);
  await q.evaluate(() => { planSetView('eisenhower'); }); await q.waitForTimeout(1200);
  const small = await q.evaluate(() => {
    const t = document.querySelector('.pe-tray'), g = document.querySelector('.pe-grid');
    const tr = t?.getBoundingClientRect(), gr = g?.getBoundingClientRect();
    return {aside: !!document.querySelector('.pe-withtray'),
      stacked: tr && gr ? Math.round(tr.bottom) <= Math.round(gr.y) + 8 : null,
      hscroll: document.documentElement.scrollWidth - document.documentElement.clientWidth};
  });
  yes('the wrapper is still there', small.aside);
  yes('  but the column becomes a row above the boxes', small.stacked, JSON.stringify(small));
  is('  and nothing hangs off the side', small.hscroll, 0);
  await narrow.close();

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(`\nsmoke184  ${bad ? bad + ' FAILED' : 'all good'}`);
  process.exit(bad ? 1 : 0);
})();
