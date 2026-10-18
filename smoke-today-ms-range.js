/* smoke-today-ms-range — the milestones strip at the top of Today looks as far ahead as you choose, and keeps it;
   this week's threads for today are in Execution, not Looking inward.
   Run: NODE_PATH=node_modules node smoke-today-ms-range.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const yes = (n, c, g = '') => c ? console.log('  ok   ' + n) : (bad++, console.log('  FAIL ' + n + ' ' + g));
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1300, height: 1000}})).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => { document.querySelectorAll('.overlay').forEach(n => n.remove());
    const l = planNewList('Thesis'); l.milestones = [{id: 'm1', name: 'Outline in', date: addDays(today(), 5)}, {id: 'm2', name: 'First draft in', date: addDays(today(), 25)}, {id: 'm3', name: 'Viva', date: addDays(today(), 80)}];
    delete S.settings.todayMsDays; saveNow(); S.settings.todayView = 'do'; location.hash = '#/today'; rerender(); });
  await p.waitForTimeout(900);
  const names = () => p.evaluate(() => [...document.querySelectorAll('#t-ms .pl-mslabel')].map(n => n.textContent.trim()));
  yes('by default: the next seven days', JSON.stringify(await names()) === '["Outline in"]' && /seven days/.test(await p.evaluate(() => document.querySelector('#t-ms summary .k').textContent)), JSON.stringify(await names()));
  await p.evaluate(() => { document.getElementById('t-ms').open = true; });
  await p.selectOption('[data-msrange]', '30'); await p.waitForTimeout(700);
  yes('next month adds the one 25 days away, and the line says so', (await names()).length === 2 && /next month/.test(await p.evaluate(() => document.querySelector('#t-ms summary .k').textContent)), JSON.stringify(await names()));
  await p.selectOption('[data-msrange]', '90'); await p.waitForTimeout(700);
  yes('three months takes all three', (await names()).length === 3, JSON.stringify(await names()));
  yes('the choice is kept in the settings', await p.evaluate(() => S.settings.todayMsDays === 90));
  await p.reload(); await p.waitForTimeout(1500);
  yes('and is the same after a refresh', await p.evaluate(() => document.querySelector('[data-msrange]').value === '90') && (await names()).length === 3);
  await p.selectOption('[data-msrange]', '7'); await p.waitForTimeout(500);
  yes('until it is changed again', (await names()).length === 1);
  /* threads in Execution */
  await p.evaluate(() => { const T = today(), pl = weekPlan(weekStart(T)); pl.threads = [{id: 'c1', text: 'Sit with the thesis question', kind: 'turn', days: [T], done: {}}, {id: 'c2', text: 'Walk before work', kind: 'do', days: [T], done: {}}]; saveNow(); rerender(); });
  await p.waitForTimeout(700);
  const where = await p.evaluate(() => ({exec: [...document.querySelectorAll('[data-view="do"] .wk-thread-text')].map(n => n.textContent), inward: [...document.querySelectorAll('[data-view="in"] .wk-thread-text')].map(n => n.textContent)}));
  yes('today\'s threads, contemplative ones too, are in Execution', where.exec.length === 2, JSON.stringify(where));
  yes('and none are under Looking inward', where.inward.length === 0, JSON.stringify(where));
  yes('no page errors', errs.length === 0, errs.join(';'));
  await b.close(); console.log(bad ? 'FAILURES' : 'all good'); process.exit(bad ? 1 : 0);
})();
