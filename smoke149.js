/* smoke149 — a milestone as a lens. A task points at the date it is being
   done towards; pressing the date narrows the list to its work; opening it
   shows that work; and choosing tomorrow happens in front of the dates. */
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
  const p = await b.newPage({viewport:{width:1500, height:1000}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource|ERR_CERT_AUTHORITY_INVALID/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2100); }

  const rows = () => p.$$eval('[data-ptcard]', n => n.map(x =>
    x.querySelector('.pt-title, .pk-title')?.textContent.trim() || x.textContent.replace(/\s+/g,' ').trim().slice(0,30)));

  const ids = await p.evaluate(() => {
    const l = planNewList('Ship it');
    const a = planAddMilestone(l.id, {name:'Ship v1',     date: addDays(today(), 10)});
    const c = planAddMilestone(l.id, {name:'The hearing', date: addDays(today(), 30)});
    const mk = (t, ms) => { const x = newTask(t, ''); x.listId = l.id; x.milestoneId = ms; S.tasks.push(x); return x.id; };
    const t1 = mk('Write the release note', a.id);
    const t2 = mk('Cut the branch',         a.id);
    const t3 = mk('Something else entirely', null);
    S._planSel = {kind:'list', id:l.id}; S._planFilter = {}; saveNow();
    location.hash = '#/planning'; rerender();
    return {l:l.id, a:a.id, c:c.id, t1, t2, t3};
  });
  await p.waitForTimeout(1600);

  console.log('\n1. a task knows the date it is for');
  is('the field is on the task', await p.evaluate(i => planTaskById(i).milestoneId, ids.t1), ids.a);
  is('  and a task without one holds null', await p.evaluate(i => planTaskById(i).milestoneId, ids.t3), null);
  is('  a milestone knows its work in return',
     await p.evaluate(i => planMilestoneTasks(i).map(t => t.text).join(' | '), ids.a),
     'Write the release note | Cut the branch');
  is('  and how much of it is left',
     await p.evaluate(i => JSON.stringify(planMilestoneProgress(i)), ids.a), '{"total":2,"done":0}');

  console.log('\n2. pressing a date narrows the list to its work');
  is('everything shows to begin with', (await rows()).length, 3);
  await p.evaluate(i => document.querySelector(`[data-plmsfilter="${i}"]`).click(), ids.a);
  await p.waitForTimeout(1300);
  const only = await rows();
  is('  pressing one leaves only its tasks', only.length, 2);
  yes('  which are the right two', only.join(' ').includes('release note') && only.join(' ').includes('Cut the branch'),
      only.join(' | '));
  yes('  the pin says it is the one on',
      await p.evaluate(i => document.querySelector(`[data-plmsfilter="${i}"]`).classList.contains('on'), ids.a));
  yes('  and the header names it',
      await p.evaluate(() => /Ship v1/.test(document.querySelector('[data-pfclear="milestone"]')?.textContent || '')));
  is('  the filter counts as one axis', await p.evaluate(() => planFilterCount(S._planFilter)), 1);
  /* pressing it again lets go — a filter you cannot clear where you set it is a trap */
  await p.evaluate(i => document.querySelector(`[data-plmsfilter="${i}"]`).click(), ids.a);
  await p.waitForTimeout(1200);
  is('pressing it again shows everything', (await rows()).length, 3);
  is('  and the filter is empty', await p.evaluate(() => S._planFilter?.milestone || null), null);
  /* the other date has no work, and says so rather than emptying the list silently */
  await p.evaluate(i => document.querySelector(`[data-plmsfilter="${i}"]`).click(), ids.c);
  await p.waitForTimeout(1200);
  is('a date with nothing under it shows nothing', (await rows()).length, 0);
  await p.evaluate(() => { S._planFilter = {}; rerender(); }); await p.waitForTimeout(900);

  console.log('\n3. opening a milestone shows the work that is for it');
  await p.evaluate(i => openPlanMilestone(i), ids.a); await p.waitForTimeout(800);
  is('it lists them', await p.$$eval('.ms-task-t', n => n.map(x => x.textContent).join(' | ')),
     'Write the release note | Cut the branch');
  yes('  and counts what is done', await p.evaluate(() =>
    /0 of 2 done/.test(document.querySelector('.modal')?.textContent || '')));
  /* the tick works from here, because the panel is where you are looking */
  await p.evaluate(() => document.querySelector('[data-mstick]').click()); await p.waitForTimeout(1000);
  is('  a task can be ticked from the panel', await p.evaluate(i => !!planTaskById(i).done, ids.t1), true);
  yes('  and the count follows', await p.evaluate(() =>
    /1 of 2 done/.test(document.querySelector('.modal')?.textContent || '')));
  await p.evaluate(() => document.querySelector('#msOnly').click()); await p.waitForTimeout(1200);
  is('  "show only its work" sets the filter', await p.evaluate(() => S._planFilter?.milestone), ids.a);
  await p.evaluate(() => { S._planFilter = {}; rerender(); }); await p.waitForTimeout(800);

  console.log('\n4. the task panel is where a task is given its date');
  await p.evaluate(i => openPlanTask(i), ids.t3); await p.waitForTimeout(800);
  yes('the picker is there', await p.evaluate(() => !!document.querySelector('#pdMilestone')));
  is('  offering the list\'s own dates, and none',
     await p.$$eval('#pdMilestone option', n => n.length), 3);
  await p.evaluate(i => { const s = document.querySelector('#pdMilestone'); s.value = i; s.onchange(); }, ids.a);
  await p.waitForTimeout(900);
  is('  choosing one writes it down', await p.evaluate(i => planTaskById(i).milestoneId, ids.t3), ids.a);
  is('  and the milestone gains it', await p.evaluate(i => planMilestoneTasks(i).length, ids.a), 3);
  await p.evaluate(() => document.querySelectorAll('#panel, .overlay').forEach(n => n.remove()));

  console.log('\n5. removing a date does not remove the work');
  const before = await p.evaluate(i => planMilestoneTasks(i).length, ids.a);
  await p.evaluate(i => planDeleteMilestone(i), ids.a); await p.waitForTimeout(400);
  is('the tasks are still there', await p.evaluate(i => !!planTaskById(i), ids.t1), true);
  is('  but they point at nothing now', await p.evaluate(i => planTaskById(i).milestoneId, ids.t1), null);
  is('  and the milestone is gone', await p.evaluate(i => !!planFindMilestone(i), ids.a), false);
  yes('  it was three tasks that were let go', before === 3, String(before));

  console.log('\n6. tomorrow is chosen in front of the dates');
  await p.evaluate(() => { /* a fresh date with work under it */
    const l = planList(planLists().find(x => x.name === 'Ship it').id);
    const m = planAddMilestone(l.id, {name:'Ship v2', date: addDays(today(), 12)});
    const x = newTask('The last of it', ''); x.listId = l.id; x.milestoneId = m.id; S.tasks.push(x);
    saveNow(); location.hash = '#/today'; rerender(); });
  await p.waitForTimeout(1400);
  await p.evaluate(() => planMyDay(addDays(today(), 1))); await p.waitForTimeout(800);
  for(let i = 0; i < 2; i++){ await p.evaluate(() => document.querySelector('#pmNext').click()); await p.waitForTimeout(600); }
  const step = await p.evaluate(() => document.querySelector('.modal')?.textContent || '');
  yes('the step where work is chosen names the dates ahead', /running towards/.test(step));
  yes('  with the milestone on it', /Ship v2/.test(step), step.slice(0, 140));
  yes('  how soon it is, and what is left', /in 12d · 1 left/.test(step));
  /* it is a door, not a label */
  await p.evaluate(() => document.querySelector('[data-planms]').click()); await p.waitForTimeout(1400);
  is('  pressing one opens Planning', await p.evaluate(() => location.hash), '#/planning');
  yes('  already narrowed to that date', await p.evaluate(() => !!S._planFilter?.milestone));
  is('  on the list the date belongs to',
     await p.evaluate(() => planList(S._planSel?.id)?.name), 'Ship it');
  is('  showing only its work', (await rows()).length, 1);

  console.log('\n7. quiet');
  is('no errors on the console', errs.length, 0, errs.join(' | '));
  if(errs.length) errs.forEach(e => console.log('    ' + e));

  console.log(bad ? `\n${bad} FAILED` : '\nsmoke149  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
