/* smoke265 — planning the week: the work under a goal can be added to and
   edited where it is chosen.

   The claims.

   ADDING. Step 3 of "Plan the week" puts work under each goal. Under a goal
   that sits in a list, a line takes a new task in the planner's own grammar
   ("~30m friday !high"), files it in that list, and puts it under the goal —
   and the line is ready for the next one.

   EDITING. Every task shown there can be renamed where it stands, and ✎ opens
   its do date, due date and time, estimate (typed, or 15m…2h) and priority.
   Every change is written to the task itself — the task Planning and Today
   show — and the line beside it says the new dates and length at once.

   STAYING PUT. Adding a task or opening a row does not fold the goal back up.

   PROJECTS. A goal put under a project sees that project's tasks (a project
   is a planner list under the same id) and adds to it.

   Run: NODE_PATH=node_modules node smoke265.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport: {width: 1280, height: 900}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  const ids = await p.evaluate(() => {
    const l = planNewList('Writing week');
    const t1 = newPlanTask('Read the notes', '', {listId: l.id}); const t2 = newPlanTask('Call the editor', '', {listId: l.id});
    S.tasks.push(t1, t2);
    const pr = {id: uid(), name: 'The garden', description: '', tags: [], status: 'active', priority: 'P3', startDate: today(), targetDate: '',
      phases: [], resources: [], linkedSkills: [], linkedVisionEra: null, notes: '', link: '', income: {model: '', current: 0, target: 0, milestones: []}, createdAt: today()};
    S.projects.push(pr); projectListsSync();
    const t3 = newPlanTask('Order the seeds', '', {listId: pr.id}); S.tasks.push(t3);
    saveNow(); return {list: l.id, t1: t1.id, t2: t2.id, proj: pr.id, t3: t3.id};
  });
  await p.evaluate(() => { location.hash = '#/today'; }); await p.waitForTimeout(800);
  await p.evaluate(() => openWeeklyPlan(addDays(today(), 7))); await p.waitForTimeout(400);
  await p.click('#wpNext'); await p.waitForTimeout(250); await p.click('#wpNext'); await p.waitForTimeout(300);
  const h2 = await p.$eval('.modal h2', h => h.textContent);
  is('step 3 is "What the week is carrying"', h2, 'What the week is carrying');
  /* goal 1 in the list, goal 2 in the project */
  await p.fill('[data-wpout="0"]', 'Finish the essay'); await p.dispatchEvent('[data-wpout="0"]', 'change'); await p.waitForTimeout(200);
  await p.selectOption('[data-wplink="0"]', 'list:' + ids.list).catch(async () => {
    await p.evaluate(v => { const s = document.querySelector('[data-wplink="0"]'); s.value = v; s.dispatchEvent(new Event('change')); }, 'list:' + ids.list); });
  await p.waitForTimeout(300);
  await p.evaluate(() => { const d = document.querySelector('[data-wpunder="0"]'); if(d && !d.open){ d.open = true; d.dispatchEvent(new Event('toggle')); } });
  await p.waitForTimeout(150);
  const rows = await p.$$eval('[data-wpunder="0"] [data-wptrow]', r => r.map(x => x.dataset.wptrow));
  is('the list\'s open work is under the goal, to choose from', rows.sort(), [ids.t1, ids.t2].sort());

  console.log('\n1. editing where it is chosen');
  await p.click(`[data-wptedit="${ids.t1}"]`); await p.waitForTimeout(250);
  yes('✎ opens the task\'s dates, estimate and priority', !!(await p.$(`[data-wptrow="${ids.t1}"] .wp-tedit`)));
  const doD = await p.evaluate(() => addDays(today(), 8)), dueD = await p.evaluate(() => addDays(today(), 11));
  const setF = (k, v) => p.evaluate(([id, k, v]) => { const i = document.querySelector(`[data-wptf="${k}"][data-wpid="${id}"]`); i.value = v; i.dispatchEvent(new Event('change')); }, [ids.t1, k, v]);
  await setF('doDay', doD); await setF('day', dueD); await setF('dueTime', '14:30'); await setF('priority', '3');
  await p.click(`[data-wptq="45"][data-wpid="${ids.t1}"]`); await p.waitForTimeout(200);
  const T1 = await p.evaluate(id => { const t = S.tasks.find(x => x.id === id); return {doDay: t.doDay, day: t.day, dueTime: t.dueTime, duration: t.duration, priority: t.priority}; }, ids.t1);
  is('  do date, due date and time, estimate and priority are written to the task', T1, {doDay: doD, day: dueD, dueTime: '14:30', duration: 45, priority: 3});
  const chips = await p.$eval(`[data-wptrow="${ids.t1}"] .wp-tchips`, e => e.textContent);
  yes('  and the line beside it says so at once', /do /.test(chips) && /due /.test(chips) && /45m/.test(chips), chips);
  await setF('duration', '70');
  is('  a typed estimate too', await p.evaluate(id => S.tasks.find(x => x.id === id).duration, ids.t1), 70);
  await p.fill(`[data-wptext="${ids.t2}"]`, 'Call the editor about the cover'); await p.waitForTimeout(100);
  await p.dispatchEvent(`[data-wptext="${ids.t2}"]`, 'change'); await p.waitForTimeout(100);
  is('a task is renamed where it stands', await p.evaluate(id => S.tasks.find(x => x.id === id).text, ids.t2), 'Call the editor about the cover');

  console.log('\n2. adding where it is chosen');
  await p.fill('[data-wpadd="0"]', 'Draft the outline ~30m !high'); await p.press('[data-wpadd="0"]', 'Enter'); await p.waitForTimeout(350);
  const A = await p.evaluate(list => { const t = S.tasks.find(x => x.text === 'Draft the outline');
    return t && {list: t.listId === list, duration: t.duration, priority: t.priority, id: t.id}; }, ids.list);
  yes('a new task is filed in the goal\'s list, the grammar read', A && A.list && A.duration === 30 && A.priority === 3, A);
  const under = await p.evaluate(id => { const wk = weekStart(addDays(today(), 7)); return weekPlan(wk).outcomes[0].taskIds.includes(id); }, A && A.id);
  yes('  and put under the goal', under);
  const st = await p.evaluate(id => ({open: document.querySelector('[data-wpunder="0"]').open, row: !!document.querySelector(`[data-wptrow="${id}"]`),
    focus: document.activeElement && document.activeElement.dataset.wpadd, stillEditing: !!document.querySelector('.wp-tedit')}), A && A.id);
  yes('  the goal stays open, the new row is there, and the line is ready for the next', st.open && st.row && st.focus === '0', st);
  yes('the row being edited stays open across it', st.stillEditing, st);

  console.log('\n3. a goal under a project');
  await p.fill('[data-wpout="1"]', 'Get the garden going'); await p.dispatchEvent('[data-wpout="1"]', 'change'); await p.waitForTimeout(200);
  await p.evaluate(v => { const s = document.querySelector('[data-wplink="1"]'); s.value = v; s.dispatchEvent(new Event('change')); }, 'project:' + ids.proj);
  await p.waitForTimeout(300);
  await p.evaluate(() => { const d = document.querySelector('[data-wpunder="1"]'); if(d && !d.open){ d.open = true; d.dispatchEvent(new Event('toggle')); } });
  const prow = await p.$$eval('[data-wpunder="1"] [data-wptrow]', r => r.map(x => x.dataset.wptrow));
  yes('it sees the project\'s tasks', prow.includes(ids.t3), prow);
  await p.fill('[data-wpadd="1"]', 'Dig the beds'); await p.click('[data-wpaddgo="1"]'); await p.waitForTimeout(300);
  is('  and adds to the project', await p.evaluate(pid => { const t = S.tasks.find(x => x.text === 'Dig the beds'); return t && t.listId === pid; }, ids.proj), true);

  console.log('\n4. and the plan saves');
  await p.click('#wpNext'); await p.waitForTimeout(150); await p.click('#wpNext'); await p.waitForTimeout(150); await p.click('#wpNext'); await p.waitForTimeout(300);
  const saved = await p.evaluate(() => { const o = weekPlan(weekStart(addDays(today(), 7))).outcomes; return [o[0].taskIds.length, o[1].taskIds.length]; });
  yes('both goals keep the work put under them', saved[0] >= 1 && saved[1] >= 1, saved);

  is('no page errors', errs, []);
  console.log(`\n${bad ? bad + ' FAILED' : 'all good'}`);
  await b.close(); process.exit(bad ? 1 : 0);
})();
