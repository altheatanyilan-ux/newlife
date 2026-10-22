/* smoke-rescue-gather — cards left after others are let go come close together */
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
  const q = (f, a) => p.evaluate(f, a);
  await q(() => { S.settings.rescueGate = 'off'; S.settings.rescueCarry = false; saveNow(); location.hash = '#/rescue/new'; }); await p.waitForTimeout(1500);
  if(await p.$('.rs-ready-x')) await p.click('.rs-ready-x');
  await q(() => { const spots = [[60, 80], [820, 60], [300, 520], [900, 480], [100, 900], [700, 1000]];
    spots.forEach(([x, y], i) => { const n = _rs.newBox(x, y); n.ta.value = 'thought number ' + (i + 1) + ' with a few more words in it'; n.b.text = n.ta.value; rescueFit(n.ta); n.el.style.left = x + 'px'; n.el.style.top = y + 'px'; n.b.x = x; n.b.y = y; });
    const bs = _rs.sheet.boxes; bs[1].fate = 'letgo'; bs[4].fate = 'letgo'; rescuePaintAll(document); });
  await p.waitForTimeout(300);
  const spread = () => q(() => { const els = [...document.querySelectorAll('.rs-box:not(.gone)')]; const r = els.map(e => e.getBoundingClientRect());
    return {n: els.length, w: Math.max(...r.map(x => x.right)) - Math.min(...r.map(x => x.left)), h: Math.max(...r.map(x => x.bottom)) - Math.min(...r.map(x => x.top))}; });
  const s0 = await spread();
  yes('four cards are left, scattered over a wide page', s0.n === 4 && s0.h > 600, s0);
  await p.click('[data-rs="gather"]'); await p.waitForTimeout(1200);
  const s1 = await spread();
  const ov = await q(() => { const r = [...document.querySelectorAll('.rs-box:not(.gone)')].map(e => e.getBoundingClientRect()); let o = 0;
    for(let i = 0; i < r.length; i++) for(let j = i + 1; j < r.length; j++){ const a = r[i], c = r[j]; if(a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) o++; } return o; });
  yes('they come close together, so they can be seen at once', s1.h < s0.h / 2 && s1.n === 4, {s0, s1});
  yes('and none sits on another', ov === 0, ov);
  yes('the ones let go were left alone', await q(() => _rs.sheet.boxes.filter(b => b.fate === 'letgo').every(b => b.y === 80 || b.y === 60 || b.y === 900 || b.x === 820 || b.x === 100)));
  const kept = await q(() => _rs.sheet.boxes.filter(b => b.fate !== 'letgo').map(b => [b.x, b.y]));
  yes('the new places are kept on the page', kept.every(([x, y]) => x < 1000 && y < 700), kept);
  await q(() => { const a = [...document.querySelectorAll('.toast-act')].filter(x => /undo/.test(x.textContent)).pop(); if(a) a.click(); }); await p.waitForTimeout(900);
  const s2 = await spread();
  yes('undo puts them back where they were', Math.abs(s2.h - s0.h) < 4, {s0, s2});
  /* with the horizons showing, each stays in its column */
  await p.click('[data-rs="bands"]'); await p.waitForTimeout(500);
  const colsBefore = await q(() => [...document.querySelectorAll('.rs-box:not(.gone)')].map(e => Math.floor((e.offsetLeft + 12) / (document.querySelector('#rsCanvas').clientWidth / 5))));
  await p.click('[data-rs="gather"]'); await p.waitForTimeout(1200);
  const colsAfter = await q(() => [...document.querySelectorAll('.rs-box:not(.gone)')].map(e => Math.floor((e.offsetLeft + 12) / (document.querySelector('#rsCanvas').clientWidth / 5))));
  yes('with the horizons showing, every card stays in its own column', JSON.stringify(colsBefore.slice().sort()) === JSON.stringify(colsAfter.slice().sort()), {colsBefore, colsAfter});
  yes('no page errors', !errs.length, errs);
  await b.close(); process.exit(bad ? 1 : 0);
})();
