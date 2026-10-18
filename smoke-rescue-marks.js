/* smoke-rescue-marks — "→ a task" on a rescue card goes when the task it made is deleted */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const yes = (n, c, g='') => { if(c) console.log('  ok   ' + n); else { bad++; console.log('  FAIL ' + n + '  — ' + JSON.stringify(g)); } };
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport: {width: 1300, height: 900}})).newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => { location.hash = '#/rescue/new'; }); await p.waitForTimeout(1500);
  if(await p.$('.rs-ready-x')) await p.click('.rs-ready-x');
  const r = await p.evaluate(() => {
    const n = _rs.newBox(80, 80); n.ta.value = 'write the abstract'; n.b.text = 'write the abstract';
    const text = n.b.text, ctx = {b: n.b, el: n.el, text, whole: true, step(){}, place(){}};
    rescueDone(ctx, 'task', rescueMakeTasks(text));
    const marks1 = n.el.querySelector('.rs-marks').textContent, fate1 = n.b.fate, ids = n.b.exits[0].ids.slice();
    ids.forEach(id => { const i = S.tasks.findIndex(t => t.id === id); if(i >= 0) S.tasks.splice(i, 1); });
    rescueRefsPaint(n.el, n.b);
    const second = (() => { const m = _rs.newBox(80, 200); m.b.text = 'ring the bank'; const c2 = {b: m.b, el: m.el, text: m.b.text, whole: true, step(){}, place(){}};
      rescueDone(c2, 'task', rescueMakeTasks(m.b.text)); rescueRefsPaint(m.el, m.b); return m.el.querySelector('.rs-marks').textContent; })();
    return {marks1, fate1, ids: ids.length, marks2: n.el.querySelector('.rs-marks').textContent, fate2: n.b.fate, exits: n.b.exits.length, handled: n.el.classList.contains('handled'), second};
  });
  yes('the mark records the task it made', r.ids === 1 && /a task/.test(r.marks1) && r.fate1 === 'task', r);
  yes('deleting the task takes the mark away', r.marks2 === '' && r.exits === 0, r);
  yes('and the card is loose again', r.fate2 === '' && !r.handled, r);
  yes('a mark whose task still exists stays', /a task/.test(r.second), r);
  yes('no page errors', !errs.length, errs);
  await b.close(); process.exit(bad ? 1 : 0);
})();
