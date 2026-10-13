/* smoke-sd-fit — Study Deck review: the card is as tall as its content, and the answer buttons stay put.
   Run: NODE_PATH=node_modules node smoke-sd-fit.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const is = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? console.log('  ok   ' + n) : (bad++, console.log(`  FAIL ${n} got ${JSON.stringify(a)} want ${JSON.stringify(b)}`));
const yes = (n, c, g = '') => c ? console.log('  ok   ' + n) : (bad++, console.log('  FAIL ' + n + ' ' + g));
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1300, height: 800}})).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));
  const id = await p.evaluate(() => { const d = sdEnsureDeck('Fit');
    addStudyCard({front: 'short', back: 'ans', deckId: d.id});
    addStudyCard({front: 'long ' + 'lorem ipsum dolor sit amet '.repeat(60), back: 'ans ' + 'consectetur '.repeat(80), deckId: d.id});
    return d.id; });
  await p.evaluate(i => { location.hash = '#/study/review/' + i; }, id); await p.waitForTimeout(1500);
  const m = () => p.evaluate(() => { const r = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
    const bar = r('#sxBar'), btn = r('#sxShow') || r('.sx-ans'), card = r('#sxCardWrap');
    return {barTop: Math.round(bar.top), btnTop: Math.round(btn.top), cardH: Math.round(card.height), barBottom: Math.round(bar.bottom), vh: innerHeight,
      which: (document.getElementById('sxCard').srcdoc.match(/>(short|long)/) || [])[1]}; });
  const seen = [];
  for(let i = 0; i < 2; i++){ seen.push(await m()); await p.keyboard.press('Space'); await p.waitForTimeout(700); seen.push(await m()); await p.keyboard.press('3'); await p.waitForTimeout(900); }
  const [q0, a0, q1, a1] = seen;
  yes('a short card is only as tall as its content', q0.cardH < 200, q0.cardH);
  yes('the answer on a short card is still short', a0.cardH < 260, a0.cardH);
  yes('a long card does not grow past the room', q1.cardH < q1.barTop && a1.cardH < a1.barTop);
  is('the buttons are at the same place on every card', [...new Set(seen.map(s => s.btnTop))].length, 1);
  yes('and on screen without scrolling', seen.every(s => s.barBottom <= s.vh), JSON.stringify(seen.map(s => s.barBottom)));
  is('no page errors', errs, []);
  await b.close(); console.log(bad ? 'FAILURES' : 'all good'); process.exit(bad ? 1 : 0);
})();
