/* smoke236 — Today in six views: the planner's tasks and habits, the Review
   (with the planner's statistics) and the time tracker moved in.

   WHAT IS CLAIMED. Today's switch reads Execution, Looking inward, Tasks,
   Habits, Review, Time tracking. Tasks and Habits are the planner's two rooms,
   drawn whole under Today's head; the Review is the Compass charts with the
   planner's statistics beside them, then the written reviews; Time tracking is
   the time tracker, renamed. Each has an address (#/today/tasks …) and the old
   ones — #/planning, #/planning/<view>, #/time/<view>, #/journals/review —
   lead there, carrying what they named. Planning and Time are no longer doors
   in the sidebar or the phone's bar, and the Lived Record no longer has a
   Review. Today reopens on the view last used. The planner's keys still work
   in its view. Focus mode is the desk on Execution and Tasks, and the page
   itself on the rest. Nothing overflows a phone.

   Run: NODE_PATH=node_modules node smoke236.js */
const { chromium } = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n)
  : no(n, `\n         got  ${JSON.stringify(a)}\n         want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1400, height:950}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  const go = async h => { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(1300); };
  const state = () => p.evaluate(() => ({hash: location.hash, view: S.settings.todayView,
    on: (document.querySelector('.today-switch button.on') || {}).textContent || ''}));

  console.log('\n1. the doors');
  await go('#/today');
  const N = await p.evaluate(() => ({side: [...document.querySelectorAll('.sidebar .nav a[data-page]')].map(a => a.dataset.page),
    tabs: [...document.querySelectorAll('.today-switch [data-tview]')].map(b => b.textContent.trim())}));
  yes('the sidebar has Today and no Planning or Time door', N.side.includes('today') && !N.side.includes('planning') && !N.side.includes('time'), N.side);
  is('Today\'s switch, in order', N.tabs, ['Execution', 'Looking inward', 'Tasks', 'Habits', 'Review', 'Time tracking']);

  console.log('\n2. Tasks');
  await p.click('.today-switch [data-tview="tasks"]'); await p.waitForTimeout(1300);
  const T = await p.evaluate(() => ({hash: location.hash, date: !!document.querySelector('.today-head .today-date'),
    top: !!document.querySelector('#todayRoom .pl-top'), side: !!document.querySelector('#todayRoom .pl-side'),
    rooms: !!document.querySelector('.pl-rooms'), on: document.querySelector('.today-switch button.on').textContent}));
  yes('pressed: #/today/tasks — the planner, whole, under Today\'s date', T.hash === '#/today/tasks' && T.date && T.top && T.side && T.on === 'Tasks', T);
  yes('  without the planner\'s own Tasks / Habits / Statistics tabs', !T.rooms, T);
  await p.keyboard.press('3'); await p.waitForTimeout(700);
  const K = await p.evaluate(() => planView());
  await p.keyboard.press('2'); await p.waitForTimeout(700);
  const K2 = await p.evaluate(() => planView());
  yes('the planner\'s keys work in it: 3 is the calendar, 2 the list', K === 'calendar' && K2 === 'list', {K, K2});

  console.log('\n3. the old addresses');
  await go('#/planning');
  yes('#/planning opens Today\'s Tasks', (await state()).hash === '#/today/tasks');
  await go('#/planning/next7');
  const P7 = await p.evaluate(() => ({hash: location.hash, sel: planSel(), title: document.querySelector('.pl-title').textContent}));
  yes('#/planning/next7 opens it on the next seven days', P7.hash === '#/today/tasks' && P7.sel.id === 'next7', P7);
  await p.evaluate(() => { S._planRoom = 'habits'; }); await go('#/planning');
  yes('#/planning with the habits room remembered opens Today\'s Habits', (await state()).hash === '#/today/habits');
  await go('#/time/week');
  const TM = await p.evaluate(() => ({hash: location.hash, h1: (document.querySelector('#todayRoom h1') || {}).textContent,
    week: (document.querySelector('[data-tmview].on') || {}).dataset?.tmview}));
  yes('#/time/week opens Time tracking, on its week', TM.hash === '#/today/time/week' && TM.h1 === 'Time tracking' && TM.week === 'week', TM);
  await go('#/journals/review');
  const RV = await p.evaluate(() => ({hash: location.hash, charts: !!document.querySelector('#todayRoom .rv-dash'),
    stats: !!document.querySelector('#todayRoom #rvStats .ps'), statsHead: (document.querySelector('#rvStats .sc') || {}).textContent,
    order: [...document.querySelectorAll('#todayRoom .today-review > *')].map(n => n.className.split(' ')[0] || n.tagName).slice(0, 3),
    dupDate: getComputedStyle(document.querySelector('.today-review .cmp-when') || document.body).display}));
  yes('#/journals/review opens Today\'s Review: the charts, then "Tasks and focus" — the planner\'s statistics', RV.hash === '#/today/review' && RV.charts && RV.stats && RV.statsHead === 'Tasks and focus' && RV.order[0] === 'rv-dash' && RV.order[1] === 'section', RV);
  yes('  and it does not repeat the date Today already shows', RV.dupDate === 'none', RV.dupDate);
  await go('#/journals');
  const JR = await p.evaluate(() => [...document.querySelectorAll('.jr-views [data-jrview]')].map(b => b.dataset.jrview));
  is('the Lived Record keeps Journals, Timeline and Library', JR, ['entries', 'timeline', 'library']);

  console.log('\n4. remembered, and back');
  await go('#/today/habits'); await go('#/journals'); await go('#/today');
  const R1 = await state();
  yes('Today reopens on the view last used', R1.view === 'habits' && R1.on === 'Habits' && !!(await p.$('#todayRoom .hb-grid, #todayRoom .hb-focus, #todayRoom .pl-habits-room')), R1);
  await p.click('.today-switch [data-tview="do"]'); await p.waitForTimeout(1300);
  const R2 = await p.evaluate(() => ({hash: location.hash, view: S.settings.todayView, focus: !!document.querySelector('#t-focus'), room: !!document.querySelector('#todayRoom')}));
  yes('Execution is the day itself again, at #/today', R2.hash === '#/today' && R2.view === 'do' && R2.focus && !R2.room, R2);

  console.log('\n5. focus mode');
  await go('#/today/tasks'); await p.keyboard.press('z'); await p.waitForTimeout(800);
  const F1 = await p.evaluate(() => !!document.querySelector('.pf-desk'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  await go('#/today/review'); await p.keyboard.press('z'); await p.waitForTimeout(800);
  const F2 = await p.evaluate(() => ({desk: !!document.querySelector('.pf-desk'), review: !!document.querySelector('.today-review')}));
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  yes('focus mode is the desk on Tasks, and the Review itself on the Review', F1 && !F2.desk && F2.review, {F1, F2});

  console.log('\n6. on a phone');
  await p.setViewportSize({width: 390, height: 844});
  const over = [];
  for(const v of ['tasks', 'habits', 'review', 'time']){ await go('#/today/' + v);
    const o = await p.evaluate(() => ({o: document.documentElement.scrollWidth - innerWidth,
      seen: (() => { const pill = document.querySelector('.today-switch'), on = pill.querySelector('.on'); const a = pill.getBoundingClientRect(), r = on.getBoundingClientRect(); return r.left >= a.left - 1 && r.right <= a.right + 1; })()}));
    over.push([v, o.o, o.seen]); }
  yes('no view overflows, and the one you are in is in sight on the switch', over.every(([, o, s]) => o <= 1 && s), over);
  const MB = await p.evaluate(() => [...document.querySelectorAll('.mobile-nav [data-page]')].map(a => a.dataset.page));
  yes('the phone\'s bar has no Plan', !MB.includes('planning') && MB[0] === 'today', MB);

  yes('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
