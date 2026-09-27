/* smoke262 — the arrows in a review's Life Tape step go somewhere.

   The claims.

   THE WEEKLY REVIEW. Its first step, "The week, in shape.", draws the week;
   ‹ goes to the week before, › to the week after, "this week" back — and
   the review stays open, on the same step. A day pressed is read in full,
   in the step, with a way back to the week.

   THE OTHERS. The month in the monthly review, the year in the annual and
   the quarterly, the six months in the half-year: their ‹ › move too.

   Run: NODE_PATH=node_modules node smoke262.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport: {width: 1280, height: 900}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const head = () => p.evaluate(() => { const b = document.querySelector('#flowBody'); const h = b && b.querySelector('b.serif, h2');
    return {head: h ? h.textContent.trim() : null, step: (document.querySelector('.flow-step, .mono') || {}).textContent, open: !!document.querySelector('#flowBody')}; });
  const press = async sel => { await p.click(`#flowBody ${sel}`); await p.waitForTimeout(250); };
  const T = await p.evaluate(() => today());
  const wk = d => p.evaluate(d => 'Week of ' + fmtDate(planDaysFrom(d)[0], 'med'), d);

  console.log('\n1. the weekly review');
  await p.evaluate(() => flowWeekly()); await p.waitForTimeout(500);
  const W0 = await head();
  is('it opens on this week', W0.head, await wk(T));
  await press('[data-tapeweek]:first-of-type');
  const W1 = await head();
  is('‹ goes to the week before', W1.head, await wk(await p.evaluate(d => addDays(d, -7), T)));
  const onStep = await p.evaluate(() => { const b = document.querySelector('#flowBody'); let n = b; while(n && n.parentElement && !/step \d+ of/i.test(n.textContent)) n = n.parentElement;
    return n ? (/step (\d+) of/i.exec(n.textContent) || [])[1] : null; });
  yes('  and the review is still open, on its first step', W1.open && onStep === '1', [W1.open, onStep]);
  await press('[data-tapeweek]:first-of-type');
  is('  ‹ again, the week before that', (await head()).head, await wk(await p.evaluate(d => addDays(d, -14), T)));
  await press('[data-tapeweek]:last-of-type');
  is('› comes forward a week', (await head()).head, await wk(await p.evaluate(d => addDays(d, -7), T)));
  await p.click('#flowBody [data-tapeweek]:nth-of-type(2)'); await p.waitForTimeout(250);
  is('"this week" comes back', (await head()).head, await wk(T));
  const col = await p.evaluate(() => document.querySelector('#flowBody .tw-col').dataset.tapeday);
  await press(`.tw-col[data-tapeday="${col}"]`);
  const D = await p.evaluate(() => ({h: (document.querySelector('#flowBody h2') || {}).textContent, back: !!document.querySelector('#flowBody [data-flowtapeback]')}));
  is('a day pressed is read in full, in the step', D.h, await p.evaluate(d => fmtDate(d), col));
  yes('  with a way back to the week', D.back, D);
  await press('[data-flowtapeback]');
  is('  which goes back to that week', (await head()).head, await wk(col));
  await p.evaluate(() => document.querySelectorAll('.modal-bg, .modal').forEach(m => m.remove()));

  console.log('\n2. the other reviews');
  const moved = async (open, sel) => { await p.evaluate(open); await p.waitForTimeout(500);
    const a = (await head()).head; await press(sel); const z = (await head()).head;
    await p.evaluate(() => document.querySelectorAll('.modal-bg, .modal').forEach(m => m.remove())); return [a, z]; };
  const M = await moved(() => flowMonthly(), '[data-tapemonth]:first-of-type');
  yes('the monthly review\'s ‹ goes to the month before', M[0] && M[1] && M[0] !== M[1], M);
  const Y = await moved(() => flowAnnual(), '[data-tapeyear]:first-of-type');
  yes('the annual review\'s ‹ goes to the year before', Y[0] && Y[1] && Y[0] !== Y[1], Y);
  const Q = await moved(() => flowSeasonal(), '[data-tapeyear]:first-of-type');
  yes('the quarterly review\'s ‹ too', Q[0] && Q[1] && Q[0] !== Q[1], Q);
  const H = await moved(() => flowHalf(), '[data-tapespan]:first-of-type');
  yes('the half-year review\'s ‹ too', H[0] && H[1] && H[0] !== H[1], H);

  is('no page errors', errs, []);
  console.log(`\n${bad ? bad + ' FAILED' : 'all good'}`);
  await b.close(); process.exit(bad ? 1 : 0);
})();
