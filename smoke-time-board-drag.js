/* smoke-time-board-drag — Time tracking, hour-by-hour board: drag down the tracked column to write a sitting down;
   the "now" line sits under the blocks and never across their words.
   Run: NODE_PATH=node_modules node smoke-time-board-drag.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const yes = (n, c, g = '') => c ? console.log('  ok   ' + n) : (bad++, console.log('  FAIL ' + n + ' ' + g));
const is = (n, a, b) => yes(n, JSON.stringify(a) === JSON.stringify(b), `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1300, height: 1000}})).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => { document.querySelectorAll('.overlay').forEach(n => n.remove()); S.timeEntries = [];
    const y = new Date(); y.setDate(y.getDate() - 1); const u = timeViewState(); u.unit = 'day'; u.day = timeDayOf(y.toISOString()); window.YD = u.day;
    location.hash = '#/time/overview'; });
  await p.waitForTimeout(1200);
  yes('an empty day still has its hours to drag on', await p.evaluate(() => !!document.querySelector('.tmb-track[data-tmbday]')));
  const geo = async () => p.evaluate(() => { const t = document.querySelector('.tmb-track[data-tmbday]'); t.scrollIntoView({block: 'center'}); const r = t.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top, lo: +t.dataset.tmblo, day: t.dataset.tmbday}; });
  let g = await geo();
  const Y = m => g.y + (m - g.lo) * 0.9;
  await p.mouse.move(g.x, Y(g.lo + 120)); await p.mouse.down(); await p.mouse.move(g.x, Y(g.lo + 150), {steps: 4}); await p.mouse.move(g.x, Y(g.lo + 215), {steps: 4});
  const tip = await p.evaluate(() => document.querySelector('.tm-dragtip')?.textContent);
  yes('a label follows the pull with the times and length', /^\d\d:\d\d.\d\d:\d\d . 1h 35m$/.test(tip || ''), tip);
  await p.mouse.up(); await p.waitForTimeout(400);
  const f = await p.evaluate(() => [document.getElementById('teFrom')?.value, document.getElementById('teTo')?.value]);
  const lo = g.lo, hm = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  is('the form opens with the stretch filled in', f, [hm(lo + 120), hm(lo + 215)]);
  await p.fill('#teWhat', 'dragged on the board'); await p.click('#teSave'); await p.waitForTimeout(600);
  is('the sitting is written', await p.evaluate(() => S.timeEntries.map(e => [e.what, timeClockOf(e.startTime), timeClockOf(e.endTime)])), [['dragged on the board', hm(lo + 120), hm(lo + 215)]]);
  yes('and drawn as a block in the tracked column', await p.evaluate(() => document.querySelectorAll('.tmb-track .tmb-b.did').length === 1));
  g = await geo();
  await p.mouse.move(g.x, Y(lo + 400)); await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(300);
  yes('a press that does not move writes nothing', !(await p.$('#teSave')));
  await p.mouse.click(g.x, Y(lo + 160)); await p.waitForTimeout(300);
  yes('a press on a block opens that sitting', await p.evaluate(() => !!document.querySelector('#teDel') && teWhat.value === 'dragged on the board'));
  /* the now line, on today */
  await p.evaluate(() => { document.querySelectorAll('.overlay,.modal').forEach(n => n.remove()); const u = timeViewState(); u.day = null; S.timeEntries = [];
    const n = new Date(); const s = new Date(n.getTime() - 20 * 60000); S.timeEntries.push({id: uid(), what: 'right now work', startTime: s.toISOString(), endTime: n.toISOString(), categoryId: null, tags: [], notes: []}); rerender(); });
  await p.waitForTimeout(800);
  const now = await p.evaluate(() => { const l = document.querySelector('.tmb-now'); if(!l) return {none: true}; const cs = getComputedStyle(l), b = document.querySelector('.tmb-b.did'); return {w: cs.borderTopWidth, z: cs.zIndex, bz: b ? getComputedStyle(b).zIndex : null}; });
  yes('the now line is a hairline beneath the blocks', now.none || (now.w === '1px' && +now.z < +now.bz), JSON.stringify(now));
  is('no page errors', errs, []);
  await b.close(); console.log(bad ? 'FAILURES' : 'all good'); process.exit(bad ? 1 : 0);
})();
