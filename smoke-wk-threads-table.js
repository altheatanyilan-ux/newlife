/* smoke-wk-threads-table — Today, execution view, This week: the threads as a table;
   each applicable day is a button that marks it done; today's threads are outlined darker.
   Run: NODE_PATH=node_modules node smoke-wk-threads-table.js */
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
    const T = today(), wk = weekStart(T), pl = weekPlan(wk); pl.theme = 'A test week';
    const other = addDays(wk, (parseDay(T).getDay() + 6) % 7 === 0 ? 3 : 0);   /* a day that is not today */
    pl.threads = [{id: 't1', text: 'Walk before work', kind: 'do', days: [T, addDays(wk, 6)].filter((x, i, a) => a.indexOf(x) === i), done: {}},
                  {id: 't2', text: 'Sit with the thesis question', kind: 'turn', days: [other], done: {}}];
    window.OTHER = other; saveNow(); S.settings.todayView = 'do'; location.hash = '#/today'; rerender(); });
  await p.waitForTimeout(1000);
  await p.evaluate(() => { const d = document.querySelector('[data-plansec="week"]').closest('details'); if(d) d.open = true; });
  await p.click('[data-plansec="week"]'); await p.waitForTimeout(500);
  const g = await p.evaluate(() => { const t = document.querySelector('.wk-carry .tt'); if(!t) return null;
    const rows = [...t.querySelectorAll('.tt-row')];
    return {heads: t.querySelectorAll('thead th').length, rows: rows.length, todayRows: rows.filter(r => r.classList.contains('today')).map(r => r.querySelector('.tt-text').textContent),
      btns: rows.map(r => r.querySelectorAll('[data-wkth]').length), todayCol: t.querySelectorAll('thead th.now').length,
      outline: rows.map(r => getComputedStyle(r.querySelector('td')).borderTopWidth), box: getComputedStyle(document.querySelector('.wk-tt')).borderTopWidth}; });
  yes('the threads are a table with a name column and seven days', g && g.heads === 8 && g.rows === 2, JSON.stringify(g));
  yes('each applicable day is a button', g && g.btns[1] === 1 && g.btns[0] >= 1, JSON.stringify(g && g.btns));
  yes('only the thread that applies today has the darker outline', g && g.todayRows.length === 1 && g.todayRows[0] === 'Walk before work' && g.outline[0] !== '0px' && g.outline[1] === '0px', JSON.stringify(g));
  yes('today\'s column is marked, and there is no box round the table', g && g.todayCol === 1 && g.box === '0px', JSON.stringify(g));
  await p.evaluate(() => document.querySelector('[data-wkth^="t1|' + today() + '"]').scrollIntoView({block: 'center'}));
  await p.click('[data-wkth^="t1|"]'); await p.waitForTimeout(300);
  const done = await p.evaluate(() => ({btn: document.querySelector('[data-wkth^="t1|' + today() + '"]').classList.contains('done'),
    saved: !!weekPlan(weekStart(today())).threads.find(t => t.id === 't1').done[today()], count: document.querySelector('.tt-row.today .tt-kind').textContent}));
  yes('pressing a day marks it done, and it is kept', done.btn && done.saved && /1 of /.test(done.count), JSON.stringify(done));
  await p.screenshot({path: '/tmp/claude-0/-home-user-newlife/923b6cf5-ecb3-57ac-957e-178011b85c4d/scratchpad/tt.png'});
  await p.reload(); await p.waitForTimeout(1500);
  await p.evaluate(() => { const d = document.querySelector('[data-plansec="week"]').closest('details'); if(d) d.open = true; }); await p.click('[data-plansec="week"]'); await p.waitForTimeout(500);
  yes('and it is still done after a reload', await p.evaluate(() => !!document.querySelector('[data-wkth^="t1|' + today() + '"].done')));
  await p.click('[data-wkth^="t1|' + await p.evaluate(() => today()) + '"]'); await p.waitForTimeout(200);
  yes('pressing again undoes it', await p.evaluate(() => !weekPlan(weekStart(today())).threads.find(t => t.id === 't1').done[today()]));
  yes('no page errors', errs.length === 0, errs.join(';'));
  await b.close(); console.log(bad ? 'FAILURES' : 'all good'); process.exit(bad ? 1 : 0);
})();
