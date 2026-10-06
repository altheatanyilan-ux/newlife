/* smoke282 — pressing a milestone twice opens it.

   The claims.

   On the milestone line (above a list in Planning, and at the top of Today),
   a pin's pencil was the only way into the milestone, and when two dates sit
   close one pin can cover another's pencil. Now two presses in a row on the
   pin itself — anywhere on it — open the milestone. One press still does what
   it did: in Planning it narrows the list to that milestone's work (and a
   second, separate press lets go); on Today it opens that work in Tasks. A
   double press does not leave either of those behind. The pencil still opens
   the milestone at once. The pin under the pointer comes to the front.

   Run: NODE_PATH=node_modules node smoke282.js */
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
  await p.clock.install({time: new Date('2026-10-06T10:00:00')});
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  await p.evaluate(() => { closeModals(); document.querySelectorAll('.toast').forEach(n => n.remove()); });

  const ids = await p.evaluate(() => {
    const l = planNewList('The thesis');
    const a = planAddMilestone(l.id, {name: 'First draft in', date: addDays(today(), 2)});
    const c = planAddMilestone(l.id, {name: 'Committee meets', date: addDays(today(), 5)});
    S._planFilter = {}; planSetSel('list', l.id); saveNow();
    return {list: l.id, a: a.id, c: c.id};
  });
  const modalOpen = name => p.evaluate(n => { const x = document.querySelector('#msName'); return !!x && x.value === n; }, name);
  const filter = () => p.evaluate(() => (S._planFilter || {}).milestone || null);
  const closeAll = async () => { await p.evaluate(() => closeModals()); await p.waitForTimeout(150); };

  console.log('\n1. Planning: two presses on the pin open it');
  await p.evaluate(() => { location.hash = '#/planning'; }); await p.waitForTimeout(1400);
  const pin = id => p.locator(`.pl-msline:not(.compact) .pl-mspin[data-plmsfilter="${id}"]`);
  yes('the strip shows both dates', (await pin(ids.a).count()) === 1 && (await pin(ids.c).count()) === 1);
  await pin(ids.a).locator('.pl-mslabel').dblclick(); await p.waitForTimeout(500);
  yes('a double press on the name opens the milestone', await modalOpen('First draft in'));
  is('  and leaves the list unfiltered', await filter(), null);
  await closeAll();

  console.log('\n2. one press still narrows the list');
  await pin(ids.c).locator('.pl-mslabel').click(); await p.waitForTimeout(600);
  is('a single press filters to that date\'s work', await filter(), ids.c);
  yes('  and does not open it', !(await modalOpen('Committee meets')));
  await pin(ids.c).locator('.pl-mslabel').click(); await p.waitForTimeout(600);
  is('pressed again, later, it lets go', await filter(), null);

  console.log('\n3. the pencil still opens it at once');
  await pin(ids.a).hover();
  await pin(ids.a).locator('.pl-msedit').click(); await p.waitForTimeout(250);
  yes('one press on the pencil, no waiting', await modalOpen('First draft in'));
  await closeAll();

  console.log('\n4. the pin under the pointer comes to the front');
  await pin(ids.c).hover(); await p.waitForTimeout(150);
  is('hovered pin is raised', await pin(ids.c).evaluate(e => getComputedStyle(e).zIndex), '4');

  console.log('\n5. Today');
  await p.evaluate(() => { S.settings.todayView = 'do'; location.hash = '#/today/do'; rerender(); }); await p.waitForTimeout(1400);
  await p.evaluate(() => { const d = document.querySelector('.today-ms'); if(d && !d.open) d.open = true; }); await p.waitForTimeout(500);
  const tpin = id => p.locator(`.today-ms .pl-mspin[data-plmsfilter="${id}"]`);
  yes('the strip on Today shows the date', (await tpin(ids.a).count()) === 1);
  await tpin(ids.a).locator('.pl-mslabel').dblclick(); await p.waitForTimeout(500);
  yes('a double press opens the milestone', await modalOpen('First draft in'));
  yes('  and stays on Today', await p.evaluate(() => location.hash.startsWith('#/today/do')));
  await closeAll();
  await tpin(ids.c).locator('.pl-mslabel').click(); await p.waitForTimeout(700);
  yes('a single press opens its work in Tasks', await p.evaluate(() => location.hash === '#/today/tasks'));

  console.log('\n6. nothing broke on the way');
  yes('no page errors', !errs.length, errs.join(' | '));
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
