/* smoke-sd-cursor — the page's cursor follows the pointer inside a Study Deck card.
   Run: NODE_PATH=node_modules node smoke-sd-cursor.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const yes = (n, c, g = '') => c ? console.log('  ok   ' + n) : (bad++, console.log('  FAIL ' + n + ' ' + g));
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1300, height: 800}})).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));
  const id = await p.evaluate(() => { const d = sdEnsureDeck('Cur'); addStudyCard({front: 'where is the cursor', back: 'here', deckId: d.id}); return d.id; });
  await p.evaluate(i => { location.hash = '#/study/review/' + i; }, id); await p.waitForTimeout(1500);
  yes('the page cursor is running', await p.evaluate(() => document.documentElement.classList.contains('mfx-cursor')));
  const r = await p.evaluate(() => { const b = document.getElementById('sxCard').getBoundingClientRect(); return {x: b.left, y: b.top, w: b.width, h: b.height}; });
  yes('the native pointer is hidden inside the card too', /html,html \*\{cursor:none/.test(await p.evaluate(() => document.getElementById('sxCard').srcdoc)));
  for(const [fx, fy] of [[.3, .5], [.7, .4], [.5, .8]]){
    const X = r.x + r.w * fx, Y = r.y + r.h * fy;
    await p.mouse.move(X - 20, Y - 10); await p.mouse.move(X, Y, {steps: 4}); await p.waitForTimeout(500);
    const d = await p.evaluate(([X, Y]) => { const e = document.querySelector('.mfx-dot'); const q = e.getBoundingClientRect(); return Math.hypot(q.left + q.width / 2 - X, q.top + q.height / 2 - Y); }, [X, Y]);
    yes(`the dot is under the pointer inside the card (${fx},${fy})`, d < 4, d.toFixed(1));
  }
  yes('no page errors', errs.length === 0, errs.join(';'));
  await b.close(); console.log(bad ? 'FAILURES' : 'all good'); process.exit(bad ? 1 : 0);
})();
