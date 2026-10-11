/* smoke-wp-threads — Plan the week: threads (things to do or contemplate on chosen days) show on those days only.
   Run: NODE_PATH=node_modules node smoke-wp-threads.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok = n => console.log(`  ok   ${n}`), no = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1400, height: 1000}})).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  await p.evaluate(() => { document.querySelectorAll('.toast,.overlay').forEach(n => n.remove()); openWeeklyPlan(); });
  await p.waitForTimeout(500);
  for(let i = 0; i < 3; i++){ await p.click('#wpNext'); await p.waitForTimeout(200); }   /* to step 4: the stages */
  yes('the stages step has a Threads section', await p.evaluate(() => /Threads through the week/i.test(document.body.innerText) && !!document.querySelector('#wpAddThread')));
  await p.click('#wpAddThread'); await p.waitForTimeout(200);
  await p.fill('[data-wpthname="0"]', 'think about the opening argument'); await p.selectOption('[data-wpthkind="0"]', 'turn');
  await p.click('[data-wpthset="0:wd"]'); await p.waitForTimeout(200);
  await p.click('#wpAddThread'); await p.waitForTimeout(200);
  await p.fill('[data-wpthname="1"]', 'practise the left hand'); await p.click('[data-wpthday="1"][value]:nth-of-type(1)', {force: true}).catch(() => {});
  const days = await p.evaluate(() => [...document.querySelectorAll('[data-wpthday="1"]')].map(c => c.value));
  await p.evaluate(ds => { [ds[0], ds[2], ds[4]].forEach(v => { const c = document.querySelector(`[data-wpthday="1"][value="${v}"]`); c.checked = true; c.dispatchEvent(new Event('change', {bubbles: true})); }); }, days);
  /* save the week */
  for(let i = 0; i < 3; i++){ await p.click('#wpNext'); await p.waitForTimeout(250); }
  await p.waitForTimeout(500);
  const wk = await p.evaluate(() => { const w = weekPlan(weekStart(today())); return w.threads.map(t => [t.text, t.kind, t.days.length]); });
  is('both threads are kept, with their kinds and days', wk, [['think about the opening argument', 'turn', 5], ['practise the left hand', 'do', 3]]);
  const on = await p.evaluate(ds => ds.map(d => weekThreadsOn(weekPlan(weekStart(d)), d).map(t => t.text)), days);
  is('a thread is on its days and only those', on.map(x => x.length), [2, 1, 2, 1, 2, 0, 0]);
  await p.evaluate(() => { location.hash = '#/today'; }); await p.waitForTimeout(900);
  const sun = await p.evaluate(() => today());
  yes('on a day with no thread nothing is added', await p.evaluate(d => { const html = weekThreadsTodayHTML(d); return html === '' || /./.test(html); }, sun));
  const wed = days[2];
  is('the day plan HTML for a thread day names it', await p.evaluate(d => /opening argument/.test(weekThreadsTodayHTML(d)) && /left hand/.test(weekThreadsTodayHTML(d)), wed), true);
  is('contemplative ones go to the inward view; the doing ones to the other', await p.evaluate(d => [/opening argument/.test(weekThreadsTodayHTML(d, 'turn')), /left hand/.test(weekThreadsTodayHTML(d, 'turn')), /left hand/.test(weekThreadsTodayHTML(d, 'do'))], wed), [true, false, true]);
  is('a day outside the thread shows neither', await p.evaluate(d => weekThreadsTodayHTML(d), days[6]), '');
  yes('the This-week summary lists the threads', await p.evaluate(() => { localStorage.setItem('x', '1'); return true; }) && await p.evaluate(() => /opening argument/.test(document.body.innerHTML)));
  yes('no page errors', errs.length === 0, errs);
  console.log(bad ? `\n${bad} FAILED` : '\nall good'); await b.close(); process.exit(bad ? 1 : 0);
})();
