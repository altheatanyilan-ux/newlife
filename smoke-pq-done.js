/* smoke-pq-done — a reminder prompt's "done" button visibly does something: the task is ticked and the prompt goes */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const yes = (n, c, g='') => { if(c) console.log('  ok   ' + n); else { bad++; console.log('  FAIL ' + n + '  — ' + JSON.stringify(g)); } };
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const errs = []; const p = await (await b.newContext({viewport: {width: 1300, height: 950}})).newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, 'index.html')); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  const q = (f, a) => p.evaluate(f, a);
  await q(() => { S.settings.rescueGate = 'off'; window.__r = planAddReminder({text: 'ring the dentist'}); saveNow(); location.hash = '#/today'; rerender(); }); await p.waitForTimeout(1500);
  await q(() => document.querySelectorAll('.toast, #toasts > *, #modals .overlay').forEach(t => t.remove()));
  const row = '.pq-row.cat-remind .pq-go';
  yes('the reminder is among the prompts with a done button', await q(s => { const g = document.querySelector(s); return !!g && g.textContent === 'done'; }, row));
  yes('and nothing covers it', await q(s => { const g = document.querySelector(s), r = g.getBoundingClientRect(), e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return e === g || g.contains(e); }, row));
  await p.click(row); await p.waitForTimeout(500);
  yes('pressing it ticks the reminder and takes the prompt away', await q(() => S.tasks.find(t => t.id === window.__r.id).done === true && !document.querySelector('.pq-row.cat-remind')));
  console.log(errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'no page errors'); if(errs.length) bad++;
  await b.close(); console.log(bad ? 'FAILED ' + bad : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
