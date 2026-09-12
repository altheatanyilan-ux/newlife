/* smoke102 — Planning opens on the matrix, and habits are a room of their own */
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
  const p = await b.newPage({viewport:{width:1400, height:1000}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const plan = async () => { await p.evaluate(() => { if(location.hash === '#/planning') rerender(); else location.hash = '#/planning'; }); await p.waitForTimeout(1500); };

  console.log('\n1. the matrix leads');
  await plan();
  is('Planning opens on it', await p.evaluate(() => planView()), 'eisenhower');
  is('and it is the first button in the row',
     await p.$$eval('[data-plview]', n => n[0].dataset.plview), 'eisenhower');
  yes('  which is the one shown as chosen',
      await p.$$eval('[data-plview]', n => n[0].classList.contains('on')));
  is('the number keys follow the buttons rather than an older order',
     await p.evaluate(() => PLAN_VIEWS.map((v, i) => PLAN_KEYS[i + 1] === v.id).every(Boolean)), true);
  is('  so 1 is the matrix', await p.evaluate(() => PLAN_KEYS[1]), 'eisenhower');

  console.log('\n2. an install that already chose "list" is brought across, once');
  await p.evaluate(() => { planState().prefs.view = 'list'; delete planState().prefs.matrixFirst; saveNow(); });
  await p.evaluate(() => flushSave());
  await p.reload(); await p.waitForTimeout(2500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  await plan();
  is('the old default is moved to the matrix', await p.evaluate(() => planView()), 'eisenhower');
  await p.evaluate(() => { planState().prefs.view = 'calendar'; saveNow(); });
  await p.evaluate(() => flushSave());
  await p.reload(); await p.waitForTimeout(2500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  await plan();
  is('but a view chosen deliberately since is left alone', await p.evaluate(() => planView()), 'calendar');
  await p.evaluate(() => { planState().prefs.view = 'eisenhower'; saveNow(); });

  console.log('\n3. tasks, habits and statistics are rooms, not list items');
  await plan();
  const rooms = await p.$$eval('[data-plroom]', n => n.map(x => x.dataset.plroom));
  /* Statistics joined them later: the numbers about the work are a peer of the
     work, not a view of one list of it. */
  is('the three rooms, in order', rooms.join(','), 'tasks,habits,stats');
  yes('habits is no longer buried among the task views',
      await p.evaluate(() => !document.querySelector('[data-plsel="smart:habits"]')));
  yes('the task room has its list sidebar', !!(await p.$('.pl-side')));

  console.log('\n3b. and steps are legible in the view the page opens on');
  await p.evaluate(() => {
    const t = S.tasks.find(x => !x.done) || S.tasks[0];
    if(!t) return;
    t.quadrant = 1; t.day = today();
    t.subtasks = [{id: uid(), title: 'a step on a matrix card', isCompleted: false, completedAt: null, sortOrder: 0}];
    saveNow(); S._planView = 'eisenhower'; rerender();
  });
  await p.waitForTimeout(1100);
  is('the page is on the matrix', await p.evaluate(() => planView()), 'eisenhower');
  yes('a card shows its steps without anything being opened',
      await p.evaluate(() => !!document.querySelector('.pk-card .sub-wrap .sub-row')));
  yes('and no detail panel was needed', !(await p.$('#panel')));
  const tickedIn = await p.evaluate(() => {
    const btn = document.querySelector('.pk-card .sub-wrap [data-subcheck]');
    if(!btn) return null;
    btn.click(); return true;
  });
  await p.waitForTimeout(900);
  yes('a step can be ticked straight from the card', tickedIn &&
      await p.evaluate(() => S.tasks.some(t => (t.subtasks || []).some(s => s.isCompleted))));

  console.log('\n4. the habits room is the whole page');
  await p.evaluate(() => {
    if(!S.habits.length) S.habits.push({id: uid(), name: 'Walk before the desk',
      freq: {type:'daily', days: [], count: 7}, color: 'var(--sage)', archived: false,
      negative: false, dimension: 'phys', createdAt: new Date().toISOString()});
    saveNow();
  });
  await p.click('[data-plroom="habits"]');
  await p.waitForTimeout(1300);
  yes('it opens', !!(await p.$('.pl-habits-room')));
  yes('with no list sidebar, because habits do not live in lists', !(await p.$('.pl-side')));
  yes('and no task view switcher either', !(await p.$('[data-plview]')));
  yes('the habit is there', await p.evaluate(() => document.querySelectorAll('[data-phtick]').length > 0));

  console.log('\n5. ticking a habit works inside its own room');
  const before = await p.evaluate(() => Object.keys(S.habitLog[today()] || {}).length);
  await p.evaluate(() => document.querySelector('[data-phtick]').click());
  await p.waitForTimeout(1000);
  is('the tick is recorded',
     await p.evaluate(() => Object.keys(S.habitLog[today()] || {}).length), before + 1);
  yes('and it did not throw you back to the task room', !!(await p.$('.pl-habits-room')));
  yes('  nor leave the tick unpainted',
      await p.evaluate(() => !!document.querySelector('.ph-card.done')));

  console.log('\n6. the room is remembered, and the old address still works');
  await p.evaluate(() => flushSave());
  await p.reload(); await p.waitForTimeout(2500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  await p.evaluate(() => { location.hash = '#/planning'; });
  await p.waitForTimeout(1500);
  is('it comes back to habits', await p.evaluate(() => planRoom()), 'habits');
  await p.evaluate(() => { location.hash = '#/planning/today'; });
  await p.waitForTimeout(1400);
  is('an address naming a task view returns to the task room',
     await p.evaluate(() => planRoom()), 'tasks');
  await p.evaluate(() => { location.hash = '#/planning/habits'; });
  await p.waitForTimeout(1400);
  is('and the old habits address opens the habits room',
     await p.evaluate(() => planRoom()), 'habits');
  yes('  really showing it', !!(await p.$('.pl-habits-room')));

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke102  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
