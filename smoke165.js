/* smoke165 — three things that were wrong with the chrome, and one measurement
   each.

   1. A running clock rebuilt itself. It subscribes to the timer and the timer
      speaks every second, so the card was thrown away and made again sixty
      times a minute — replaying its entrance animation each time, which is
      what a person sees as a flicker. It is rebuilt only when its shape
      changes: idle to running, a break opening, the task swapped, the sidebar
      narrowing. The rest of the time the hands move and nothing else is
      touched.

   2. The Back button is fixed to the top-left of the content and Today pinned
      its view switch to the same place, so scrolling put "Back" over the word
      "Execution". Everything the page pins now starts below the band the
      chrome occupies.

   3. The clock stood over the page. It stands in the foot of the sidebar now,
      which was empty, so nothing it does can cover anybody's words. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1340, height:900}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1700); }
  await p.evaluate(() => { location.hash = '#/today'; }); await p.waitForTimeout(1300);

  console.log('\n1. a running clock does not rebuild itself');
  await p.evaluate(() => setFocusDockShut(false)); await p.waitForTimeout(700);
  await p.evaluate(() => {
    window.__rebuilds = 0;
    const dock = document.getElementById('focusDock');
    new MutationObserver(ms => ms.forEach(m => {
      if(m.target === dock && m.addedNodes.length) window.__rebuilds++; })).observe(dock, {childList: true});
  });
  await p.click('#focusDock #fpGo');
  await p.waitForTimeout(11000);
  const run = await p.evaluate(() => ({n: window.__rebuilds, running: FocusTimer.state().running,
    face: document.querySelector('#focusDock .fp-time')?.textContent}));
  yes('it is running', run.running);
  yes('  and eleven seconds of it cost one rebuild, not eleven',
      run.n <= 2, `${run.n} rebuilds`);
  yes('  while the face still moved', /^00:1[01234]$/.test(run.face || ''), run.face);
  /* but the things that change its shape still rebuild it */
  const before = await p.evaluate(() => window.__rebuilds);
  await p.click('#focusDock #fpGo'); await p.waitForTimeout(800);
  const after = await p.evaluate(() => window.__rebuilds);
  yes('pausing rebuilds it, because the break note is new', after > before, `${before} → ${after}`);
  /* the note about the break is on Today, with the other words */
  yes('  and the break note is there, on the page', !!(await p.$('#t-focus #fpBreakNote')));
  await p.evaluate(() => { FocusTimer.stop(); FocusTimer.reset(); }); await p.waitForTimeout(600);

  console.log('\n2. nothing the page pins lands in the chrome band');
  /* the Back button only shows when there is somewhere to go back to; the page
     has to behave as though there always is */
  await p.evaluate(() => { const bb = document.querySelector('#backBtn');
    bb.hidden = false; bb.classList.remove('leaving'); });
  await p.evaluate(() => scrollTo(0, 900)); await p.waitForTimeout(700);
  const band = await p.evaluate(() => {
    const r = sel => { const n = document.querySelector(sel); if(!n) return null;
      const b = n.getBoundingClientRect();
      return {l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom)}; };
    const hits = (a, c) => !!(a && c && a.r > c.l && a.l < c.r && a.b > c.t && a.t < c.b);
    const back = r('#backBtn'), sw = r('.today-switch'), jump = r('.today-jump'), top = r('.topbar');
    return {back, sw, jump, top, backOverSwitch: hits(back, sw), backOverJump: hits(back, jump),
      topOverSwitch: hits(top, sw), switchOverJump: hits(sw, jump)};
  });
  yes('the switch is pinned, not scrolled away', band.sw && band.sw.t < 200, JSON.stringify(band.sw));
  yes('Back does not land on the view switch', !band.backOverSwitch, JSON.stringify(band));
  yes('  nor on the index under it', !band.backOverJump);
  yes('  nor does the topbar', !band.topOverSwitch);
  yes('  and the switch and the index do not land on each other', !band.switchOverJump);
  yes('everything pinned starts below the chrome', band.sw.t >= band.back.b, `${band.sw.t} vs ${band.back.b}`);

  console.log('\n3. the clock is beside the page, never over it');
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(500);
  const over = await p.evaluate(() => {
    const d = document.querySelector('#focusDock').getBoundingClientRect();
    const main = document.querySelector('#main').getBoundingClientRect();
    const sb = document.querySelector('.sidebar').getBoundingClientRect();
    return {overMain: d.right > main.left + 1, inSidebar: d.left >= sb.left - 1 && d.right <= sb.right + 1};
  });
  yes('it does not reach into the page', !over.overMain, JSON.stringify(over));
  yes('  because it is in the sidebar', over.inSidebar, JSON.stringify(over));
  /* narrowed, the same */
  await p.click('#sbToggle'); await p.waitForTimeout(700);
  const over2 = await p.evaluate(() => {
    const d = document.querySelector('#focusDock').getBoundingClientRect();
    const main = document.querySelector('#main').getBoundingClientRect();
    return d.right <= main.left + 1;
  });
  yes('narrowed too', over2);
  await p.click('#sbToggle'); await p.waitForTimeout(700);

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(bad ? `\nsmoke165  ${bad} FAILED` : '\nsmoke165  all good');
  process.exit(bad ? 1 : 0);
})();
