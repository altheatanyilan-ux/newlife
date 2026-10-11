/* smoke-wp-tidy — Plan the week, step 3: tick tasks off the list as done, or delete them (with undo).
   Run: NODE_PATH=node_modules node smoke-wp-tidy.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok = (n) => console.log(`  ok   ${n}`), no = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1400, height: 1000}})).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  await p.evaluate(() => { document.querySelectorAll('.toast,.overlay').forEach(n => n.remove());
    const l = planNewList('Thesis'); window.LID = l.id;
    ['alpha task', 'beta task', 'gamma task', 'delta task'].forEach(t => { const x = newPlanTask(t, '', {listId: l.id}); S.tasks.push(x); });
    saveNow(); openWeeklyPlan(); });
  await p.waitForTimeout(500);
  await p.click('#wpNext'); await p.click('#wpNext'); await p.waitForTimeout(300);   /* to step 3: the goals */
  await p.fill('[data-wpout="0"]', 'Write the thesis'); await p.waitForTimeout(100);
  await p.selectOption('[data-wplink="0"]', 'list:' + await p.evaluate(() => LID)); await p.waitForTimeout(300);
  await p.evaluate(() => { const d = document.querySelector('[data-wpunder="0"]'); d.open = true; });
  yes('step 3 lists the list\'s tasks, with a "tick tasks off" control', await p.evaluate(() => document.querySelectorAll('[data-wptlist="0"] .wp-trow').length === 4 && !!document.querySelector('[data-wptidy="on"]')));
  await p.click('[data-wpunder="0"] [data-wptidy="on"]'); await p.waitForTimeout(300);
  await p.evaluate(() => { const d = document.querySelector('[data-wpunder="0"]'); d.open = true; });
  yes('in tick-off mode each row gets its own tick box, and the bar says 0 ticked', await p.evaluate(() => document.querySelectorAll('[data-wptlist="0"] [data-wpsel]').length === 4 && /0 ticked/.test(document.querySelector('.wp-tidybar.on').textContent)));
  const rows = await p.$$('[data-wptlist="0"] [data-wpsel]'); await rows[0].check(); await rows[1].check(); await p.waitForTimeout(200);
  is('ticking counts them', await p.evaluate(() => /2 ticked/.test(document.querySelector('.wp-tidybar.on').textContent)), true);
  await p.click('[data-wptidy="done"]'); await p.waitForTimeout(400);
  is('Mark done finishes exactly those two', await p.evaluate(() => S.tasks.filter(t => t.listId === LID && t.done).map(t => t.text).sort()), ['alpha task', 'beta task']);
  yes('and they leave the list of open work', await p.evaluate(() => document.querySelectorAll('[data-wptlist="0"] .wp-trow').length === 2));
  await p.evaluate(() => { document.querySelector('[data-wpunder="0"]').open = true; });
  const r2 = await p.$$('[data-wptlist="0"] [data-wpsel]'); await r2[0].check(); await p.waitForTimeout(150);
  await p.evaluate(() => { document.querySelector('[data-wpunder="0"]').open = true; });
  await p.click('[data-wptidy="del"]'); await p.waitForTimeout(500);
  is('Delete removes the ticked task from the planner', await p.evaluate(() => S.tasks.filter(t => t.listId === LID).length), 3);
  yes('and offers an Undo', await p.evaluate(() => /deleted/.test(document.body.innerText) && !!document.querySelector('.toast button, .toast [data-undo], .toast a')));
  await p.evaluate(() => { const b = [...document.querySelectorAll('.toast button')].find(x => /Undo/i.test(x.textContent)); b && b.click(); }); await p.waitForTimeout(500);
  is('Undo puts it back', await p.evaluate(() => S.tasks.filter(t => t.listId === LID).length), 4);
  yes('no page errors', errs.length === 0, errs);
  console.log(bad ? `\n${bad} FAILED` : '\nall good'); await b.close(); process.exit(bad ? 1 : 0);
})();
