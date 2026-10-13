/* smoke-wk-goals — Today, This week: each goal opens onto its tasks (tick, add), and each win takes bubbles of evidence.
   Run: NODE_PATH=node_modules node smoke-wk-goals.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const yes = (n, c, g = '') => c ? console.log('  ok   ' + n) : (bad++, console.log('  FAIL ' + n + ' ' + g));
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1300, height: 1100}})).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => { document.querySelectorAll('.overlay').forEach(n => n.remove());
    const l = planNewList('Thesis'); const a = newPlanTask('read chapter two', '', {listId: l.id}), c = newPlanTask('outline chapter three', '', {listId: l.id}); S.tasks.push(a, c);
    const pl = weekPlan(weekStart(today())); pl.theme = 'x';
    pl.outcomes = [{id: 'g1', text: 'Finish the thesis draft', linkType: 'list', linkId: l.id, taskIds: [a.id, c.id]}, {id: 'g2', text: 'Rest properly', linkType: '', linkId: null, taskIds: []}];
    pl.wins = [{id: 'w1', text: 'Chapter two is done', why: 'it unblocks the rest'}]; window.LID = l.id; window.AID = a.id;
    saveNow(); S.settings.todayView = 'do'; S.settings.planSection = 'week'; location.hash = '#/today'; rerender(); });
  await p.waitForTimeout(1000);
  await p.evaluate(() => { const d = document.querySelector('.wk-goal').closest('details.card, details'); document.querySelectorAll('details').forEach(x => { if(x.querySelector('.wk-carry')) x.open = true; }); });
  yes('each goal is a line with its count, closed', await p.evaluate(() => document.querySelectorAll('.wk-goal').length === 2 && [...document.querySelectorAll('.wk-goal-n')].map(x => x.textContent).join() === '0/2,—' && !document.querySelector('.wk-goal').open));
  await p.click('[data-wkgoal="g1"] > summary'); await p.waitForTimeout(300);
  yes('opening it lists its tasks as task rows', await p.evaluate(() => document.querySelectorAll('[data-wkgoal="g1"] .task-row').length === 2));
  await p.click(`[data-wkgoal="g1"] [data-tcheck="${await p.evaluate(() => AID)}"]`); await p.waitForTimeout(400);
  yes('ticking one marks it done and the count follows, and the goal stays open', await p.evaluate(() => document.querySelector('[data-wkgoal="g1"] .wk-goal-n').textContent === '1/2' && document.querySelector('[data-wkgoal="g1"]').open && !!findTaskRef(AID).done));
  await p.fill('[data-wkgoaladd="g1"]', 'write the abstract ~30m'); await p.press('[data-wkgoaladd="g1"]', 'Enter'); await p.waitForTimeout(400);
  const added = await p.evaluate(() => { const o = weekPlan(weekStart(today())).outcomes[0]; const t = findTaskRef(o.taskIds[o.taskIds.length - 1]); return {n: o.taskIds.length, text: t && t.text, list: t && t.task.listId === LID, rows: document.querySelectorAll('[data-wkgoal="g1"] .task-row').length, count: document.querySelector('[data-wkgoal="g1"] .wk-goal-n').textContent}; });
  yes('a new task goes under the goal and into its list', added.n === 3 && /abstract/.test(added.text) && added.list && added.rows === 3 && added.count === '1/3', JSON.stringify(added));
  await p.click('[data-wkgoal="g2"] > summary'); await p.fill('[data-wkgoaladd="g2"]', 'a long walk'); await p.click('[data-wkgoaladdgo="g2"]'); await p.waitForTimeout(400);
  yes('a goal with no list sends its new task to the Inbox', await p.evaluate(() => { const o = weekPlan(weekStart(today())).outcomes[1]; const t = findTaskRef(o.taskIds[0]); return t && t.task.listId === 'inbox'; }));
  /* wins and evidence */
  await p.fill('[data-wkevadd="0"]', 'sent the draft to my supervisor'); await p.press('[data-wkevadd="0"]', 'Enter'); await p.waitForTimeout(300);
  await p.fill('[data-wkevadd="0"]', 'two hours of writing, Tuesday'); await p.press('[data-wkevadd="0"]', 'Enter'); await p.waitForTimeout(300);
  yes('evidence becomes bubbles under the win, and is kept on it', await p.evaluate(() => document.querySelectorAll('.wk-ev-b').length === 2 && weekPlan(weekStart(today())).wins[0].evidence.length === 2 && weekPlan(weekStart(today())).wins[0].evidence[0].at === today()));
  await p.click('[data-wkevdel]'); await p.waitForTimeout(300);
  yes('a bubble can be taken out', await p.evaluate(() => document.querySelectorAll('.wk-ev-b').length === 1));
  await p.reload(); await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelectorAll('details').forEach(x => { if(x.querySelector('.wk-carry')) x.open = true; }));
  await p.screenshot({path: '/tmp/claude-0/-home-user-newlife/923b6cf5-ecb3-57ac-957e-178011b85c4d/scratchpad/goals.png'});
  yes('all of it is there after a reload', await p.evaluate(() => document.querySelectorAll('.wk-ev-b').length === 1 && document.querySelectorAll('.wk-goal').length === 2));
  /* the planner keeps the evidence when it saves */
  await p.evaluate(() => { openWeeklyPlan(today()); }); await p.waitForTimeout(500);
  for(let i = 0; i < 4; i++){ await p.click('#wpNext'); await p.waitForTimeout(250); }
  yes('the planner saving leaves the evidence on the win', await p.evaluate(() => (weekPlan(weekStart(today())).wins[0].evidence || []).length === 1));
  yes('no page errors', errs.length === 0, errs.join(';'));
  await b.close(); console.log(bad ? 'FAILURES' : 'all good'); process.exit(bad ? 1 : 0);
})();
