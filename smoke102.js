/* smoke102 — Planning opens on the matrix, and habits are a room of their own.

   One exception has been carved out of "the matrix leads" since: Today,
   Tomorrow and the next seven days open as a day (smoke179). They are not
   asking "what should I touch first" — the answer to that is the order the day
   is already in — they are asking what is there, and the matrix takes a day
   and sorts it into four boxes when what you wanted was the day. Everything
   else still opens on the matrix, so this file asks a list. */
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
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource|ERR_CERT_AUTHORITY_INVALID/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const plan = async () => { await p.evaluate(() => { if(location.hash === '#/planning') rerender(); else location.hash = '#/planning'; }); await p.waitForTimeout(1500); };
  /* a list, not a date: a date is the one selection the matrix does not lead on */
  const onAList = async () => { await plan();
    await p.evaluate(() => { const l = planLists().find(x => x.id !== 'inbox') || planLists()[0];
      planSetSel('list', l.id); delete S._planView; });
    await p.waitForTimeout(1200); };

  console.log('\n1. the matrix leads');
  await onAList();
  is('a list opens on it', await p.evaluate(() => planView()), 'eisenhower');
  /* and the one exception, stated here so that losing it shows up */
  await plan();
  await p.evaluate(() => { planSetSel('smart', 'today'); }); await p.waitForTimeout(1100);
  is('  while a date opens as a day', await p.evaluate(() => planView()), 'list');
  await onAList();
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
  await onAList();
  is('the old default is moved to the matrix', await p.evaluate(() => planView()), 'eisenhower');
  await p.evaluate(() => { planState().prefs.view = 'calendar'; saveNow(); });
  await p.evaluate(() => flushSave());
  await p.reload(); await p.waitForTimeout(2500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  await onAList();
  is('but a view chosen deliberately since is left alone', await p.evaluate(() => planView()), 'calendar');
  await p.evaluate(() => { planState().prefs.view = 'eisenhower'; saveNow(); });

  console.log('\n3. tasks, habits and statistics are rooms, not list items');
  await plan();
  /* Statistics joined them later: the numbers about the work are a peer of the
     work, not a view of one list of it. Later still the three became views of
     Today (Tasks, Habits, and the statistics under Review). */
  const rooms = await p.$$eval('.today-switch [data-tview]', n => n.map(x => x.dataset.tview).filter(v => ['tasks', 'habits', 'review'].includes(v)));
  is('the three rooms, in order, as views of Today', rooms.join(','), 'tasks,habits,review');
  yes('habits is no longer buried among the task views',
      await p.evaluate(() => !document.querySelector('[data-plsel="smart:habits"]')));
  yes('the task room has its list sidebar', !!(await p.$('.pl-side')));

  console.log('\n3b. and steps are legible in the view the page opens on');
  await p.evaluate(() => {
    const t = S.tasks.find(x => !x.done) || S.tasks[0];
    if(!t) return;
    t.quadrant = 1; t.day = today();
    t.subtasks = [{id: uid(), title: 'a step on a matrix card', isCompleted: false, completedAt: null, sortOrder: 0}];
    /* look at the list this task is actually in, or the card is not on the
       page to tick a step from */
    planSetSel('list', t.listId || 'inbox');
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
  /* the room was rewritten afterwards: three views of its own, and a tick
     against every habit that opens a check-in */
  yes('the habit is there', await p.evaluate(() => document.querySelectorAll('[data-hbcheck]').length > 0));

  console.log('\n5. ticking a habit works inside its own room');
  const before = await p.evaluate(() => Object.keys(S.habitLog[today()] || {}).length);
  /* ticking asks how it went before it writes the day, so the tick opens a
     check-in and the check-in is what records it */
  await p.evaluate(() => document.querySelector('[data-hbcheck]').click());
  await p.waitForTimeout(800);
  yes('the tick opens a check-in', await p.evaluate(() => !!document.querySelector('#ciSave')));
  await p.evaluate(() => document.querySelector('#ciSave').click());
  await p.waitForTimeout(1000);
  is('  and saving it records the day',
     await p.evaluate(() => Object.keys(S.habitLog[today()] || {}).length), before + 1);
  yes('and it did not throw you back to the task room', !!(await p.$('.pl-habits-room')));
  yes('  nor leave the tick unpainted',
      await p.evaluate(() => { const T = today();
        const id = Object.keys(S.habitLog[T] || {})[0];
        return !!id && !!habitDone(byId(S.habits, id), T); }));

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
