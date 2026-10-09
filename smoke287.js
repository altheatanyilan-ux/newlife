/* smoke287 — the arrow on a pending duty goes somewhere, and Today's head is tight.

   The claims.

   1. The arrow beside a pending duty takes you to the thing, even when the
      thing is in the other half of the day: a duty whose spot is in "Looking
      inward" brings that view up, opens the folds round it and scrolls to it
      (it did nothing, because the spot was hidden); a duty that lives in another
      room goes to that room; the weekly and monthly reviews go to the Review;
      the morning card opens; and a spot that is on the page is scrolled to.
   2. Above each view's own content, Today is tight: in the Execution view the
      first section of its own starts well inside the first screen, and in the
      room views the room starts within about 200px.

   Run: NODE_PATH=node_modules node smoke287.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1300, height: 800}})).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  const clear = () => p.evaluate(() => { closeModals(); document.querySelectorAll('.overlay,.toast').forEach(n => n.remove()); });
  await clear();

  console.log('\n1. the arrow on a pending duty');
  await p.evaluate(() => { setTodayView('do'); }); await p.waitForTimeout(1500); await clear();
  is('to start with it is the Execution view', await p.evaluate(() => todayView()), 'do');
  yes('the spot a duty points at, "check-in", is in the other half of the day (hidden here)', await p.evaluate(() => {
    const el = document.querySelector('#t-checkin'); return !!el && !!el.closest('.today-view[hidden]'); }));
  await p.evaluate(() => todayDutyGo(document, 'morning_practice', '#/today', '#t-checkin')); await p.waitForTimeout(1600);
  const after = await p.evaluate(() => { const el = document.querySelector('#t-checkin'); const r = el && el.getBoundingClientRect();
    return {view: todayView(), shown: !!el && !el.closest('[hidden]') && r.height > 0, open: !!el && el.open,
      onScreen: !!r && r.top < innerHeight && r.bottom > 0}; });
  yes('it brings up Looking inward, opens the fold, and the check-in is on screen', after.view === 'in' && after.shown && after.open && after.onScreen, after);
  await p.evaluate(() => { setTodayView('do'); }); await p.waitForTimeout(1200); await clear();
  await p.evaluate(() => todayDutyGo(document, 'wake_log', '#/today', '#wokeAt')); await p.waitForTimeout(600);
  is('a spot on this very page is scrolled to, and the view does not change', await p.evaluate(() => todayView()), 'do');
  yes('  and flashed once so the eye finds it', await p.evaluate(() => document.querySelector('#wokeAt').classList.contains('duty-flash')));
  await p.evaluate(() => todayDutyGo(document, 'weekly_review', '#/today', '[data-duty-id="weekly_review"]')); await p.waitForTimeout(1200);
  is('the weekly review, which has no spot to point at, goes to the Review', await p.evaluate(() => location.hash), '#/today/review');
  await p.evaluate(() => { setTodayView('do'); }); await p.waitForTimeout(1200); await clear();
  await p.evaluate(() => todayDutyGo(document, 'stillness_practice', '#/stillness', '[data-duty-id="stillness_practice"]')); await p.waitForTimeout(900);
  is('a duty that lives in another room goes there', await p.evaluate(() => parseHash().name), 'stillness');
  await p.evaluate(() => { location.hash = '#/today'; setTodayView('do'); }); await p.waitForTimeout(1500); await clear();
  await p.evaluate(() => todayDutyGo(document, 'morning_card', '#/today', '[data-duty-id="morning_card"]')); await p.waitForTimeout(900);
  yes('the morning card, which has no spot, opens', await p.evaluate(() => !!document.querySelector('.overlay, .modal, .mc-card, [class*="morning"]')));
  await clear();
  /* and the real button, where one is pending at this hour */
  await p.evaluate(() => { location.hash = '#/today'; setTodayView('do'); }); await p.waitForTimeout(1500); await clear();
  const real = await p.evaluate(() => { const b = document.querySelector('[data-duty-go][data-duty-anchor="#t-checkin"]'); if(!b) return 'none pending'; b.click(); return 'clicked'; });
  if(real === 'clicked'){ await p.waitForTimeout(1500);
    yes('pressing the real arrow on "Morning practice" brings up Looking inward', await p.evaluate(() => todayView() === 'in' && !!document.querySelector('#t-checkin').getBoundingClientRect().height)); }
  else ok('(no morning practice pending at this hour: the real button is covered by the calls above)');

  console.log('\n2. Today is tight above its own content');
  await p.evaluate(() => { location.hash = '#/today'; setTodayView('do'); }); await p.waitForTimeout(1800); await clear();
  await p.evaluate(() => window.scrollTo(0, 0));
  const exec = await p.evaluate(() => { const n = document.querySelector('#t-plan');
    const dd = document.querySelector('.dd-panel'), r = dd && dd.getBoundingClientRect();
    return {firstSection: n ? Math.round(n.getBoundingClientRect().top) : null, ddBottom: r ? Math.round(r.bottom) : null, vh: innerHeight}; });
  yes('Execution: the first section of its own starts in the top half of a 800px screen, pending list included', exec.firstSection !== null && exec.firstSection < 480, exec);
  yes('  and the pending list does not run past the middle of the screen', exec.ddBottom === null || exec.ddBottom < 520, exec);
  for(const v of ['tasks', 'habits']){
    await p.evaluate(v => { setTodayView(v); }, v); await p.waitForTimeout(1800); await clear();
    const top = await p.evaluate(() => { const room = document.querySelector('#todayRoom'); return room ? Math.round(room.getBoundingClientRect().top) : null; });
    yes(`${v}: the room starts within 200px of the top`, top !== null && top <= 200, top);
  }
  yes('the date is still there and still the biggest thing in the head', await p.evaluate(() => { const d = document.querySelector('.today-date');
    return !!d && parseFloat(getComputedStyle(d).fontSize) >= 24; }));

  console.log('\n3. nothing broke on the way');
  yes('no page errors', !errs.length, errs.join(' | '));
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
