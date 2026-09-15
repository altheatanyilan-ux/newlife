/* smoke166 — what scrolling costs.

   The house was draggy, and the reason was not the number of ornaments. It was
   two lines, each of which wrote a CSS custom property onto the root element
   on every frame of every scroll — one to drift the ink ridges, one to drift a
   banner glyph. A custom property set on :root invalidates the style of
   everything that could inherit it, which is the whole document; so two
   ornaments, moving a total of about thirty pixels over a long scroll, were
   recalculating style for a few thousand elements sixty times a second.
   Measured on the Projects page, that alone was five seconds of renderer time
   in a scroll that should cost well under one.

   Both are written onto the elements that actually read them now, and both are
   written only when their value has changed — the mist in steps of eight
   scrolled pixels, the ridges in steps of sixty-four, because the ridges are a
   full-viewport drawing and re-rasterising one to move it two pixels is the
   expensive half of the bargain.

   The other half of the file is the one loop. Every moving thing used to ask
   for its own frames; they ask this one instead, it holds each to a budget,
   and the ambient layers stand down while a room is drawing its own canvas.

   These are the two things that must not quietly come back. */
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
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource|ERR_CERT_AUTHORITY_INVALID/.test(m.text())) errs.push('console: ' + m.text()); });
  /* every rAF the page asks for, counted */
  await p.addInitScript(() => {
    window.__raf = 0;
    const o = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = fn => { window.__raf++; return o(fn); };
  });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1700); }
  const go = async h => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(1600); };
  const scroll = async () => { for(let i = 0; i < 14; i++){ await p.mouse.wheel(0, 160); await p.waitForTimeout(30); } };

  console.log('\n1. nothing writes to the root while the page scrolls');
  await go('#/compass');
  const root = await p.evaluate(() => {
    /* catch anyone setting a property on the root, from anywhere */
    window.__rootWrites = [];
    const st = document.documentElement.style;
    const real = st.setProperty.bind(st);
    st.setProperty = (k, v) => { window.__rootWrites.push(k); return real(k, v); };
    return true;
  });
  yes('the trap is set', root);
  await scroll();
  const wrote = await p.evaluate(() => [...new Set(window.__rootWrites)]);
  is('a whole scroll writes nothing to the root', wrote, []);
  /* and specifically not the two that used to */
  const onRoot = await p.evaluate(() => ({
    ink: document.documentElement.style.getPropertyValue('--ink-par'),
    page: document.documentElement.style.getPropertyValue('--page-par')}));
  is('  the mist variable is not on the root', onRoot.ink, '');
  is('  nor the banner one', onRoot.page, '');

  console.log('\n2. the parallax is written where it is read, and in steps');
  const par = await p.evaluate(() => { const a = document.querySelector('.ambient');
    return {mist: a.style.getPropertyValue('--ink-par'), ridge: a.style.getPropertyValue('--ink-par-slow')}; });
  yes('the mist rides a variable on the ambient layer', par.mist !== '', JSON.stringify(par));
  yes('  and the ridges ride a second, coarser one', par.ridge !== '', JSON.stringify(par));
  is('  the mist steps in eights', +par.mist % 8, 0);
  is('  the ridges in sixty-fours', +par.ridge % 64, 0);
  /* a small scroll must move the fine one and leave the coarse one alone */
  const before = par.ridge;
  await p.mouse.wheel(0, 24); await p.waitForTimeout(250);
  const after = await p.evaluate(() => { const a = document.querySelector('.ambient');
    return {mist: a.style.getPropertyValue('--ink-par'), ridge: a.style.getPropertyValue('--ink-par-slow')}; });
  is('  and a small scroll does not repaint the ridges', after.ridge, before);
  /* the banner variable belongs to the banner, on the rooms that still have one */
  await go('#/settings');
  await p.evaluate(() => { document.documentElement.dataset.motion = 'calm'; });
  await scroll();
  yes('the banner glyph rides a variable on the banner',
    await p.evaluate(() => !!document.querySelector('#main .page-head')
      && document.querySelector('#main .page-head').style.getPropertyValue('--page-par') !== ''));

  console.log('\n3. one loop, with a budget for each layer');
  await go('#/today');
  const st = await p.evaluate(() => Animator.stats());
  yes('there is a loop and it is running', st.frames);
  is('  the dust is a background layer', st.loops.find(l => l.id === 'dust')?.priority, 0);
  is('  held to twenty frames a second', st.loops.find(l => l.id === 'dust')?.fps, 20);
  await go('#/skills');
  const sk = await p.evaluate(() => Animator.stats());
  is('  the wind is one too, at thirty', sk.loops.find(l => l.id === 'sway')?.fps, 30);
  yes('  and both are on the one loop rather than two',
    sk.loops.filter(l => l.active).length >= 2 && sk.frames);

  console.log('\n4. the ambient layers give way to what the room is drawing');
  await go('#/values');
  await p.evaluate(() => { document.querySelector('#solarBox').scrollIntoView({block: 'center'}); });
  await p.waitForTimeout(600);
  const sol = await p.evaluate(() => Animator.stats());
  is('the solar system is a foreground layer', sol.loops.find(l => l.id === 'solar')?.priority, 2);
  yes('  so the room counts as drawing', sol.foreground);
  /* the dust stays registered and simply is not called: it comes back by itself */
  yes('  the dust is still registered rather than torn down',
    !!sol.loops.find(l => l.id === 'dust'));
  await go('#/today');
  await p.waitForTimeout(600);
  const back = await p.evaluate(() => Animator.stats());
  yes('  and leaving the room gives the ambient layers back', !back.foreground);

  console.log('\n5. nobody is looking, nothing is drawn');
  await p.evaluate(() => { window.__raf = 0; });
  await p.waitForTimeout(1200);
  const awake = await p.evaluate(() => window.__raf);
  yes('a visible page asks for frames', awake > 20, String(awake));
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', {get: () => true, configurable: true});
    document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForTimeout(400);
  await p.evaluate(() => { window.__raf = 0; });
  await p.waitForTimeout(1200);
  is('a hidden one asks for none', await p.evaluate(() => window.__raf), 0);
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', {get: () => false, configurable: true});
    document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForTimeout(600);
  yes('  and it starts again when it comes back', await p.evaluate(() => Animator.stats().frames));

  console.log('\n6. the lawn is a lawn, not six hundred elements');
  await go('#/skills');
  await p.waitForTimeout(1200);
  const lawn = await p.evaluate(() => ({blades: document.querySelectorAll('.blade').length,
    /* it is still a lawn: the merged paths carry many blades each */
    moves: [...document.querySelectorAll('.blade')].reduce((n, b) =>
      n + (b.getAttribute('d') || '').split('M').length - 1, 0),
    nodes: document.querySelectorAll('#main *').length}));
  yes('the grass is drawn in under a hundred paths', lawn.blades > 0 && lawn.blades < 100,
    String(lawn.blades));
  yes('  carrying five hundred blades or more between them', lawn.moves >= 500, String(lawn.moves));
  /* The tree is grown rather than drawn, so its element count wanders by
     several hundred from one render to the next — it is the two lines above
     that pin the lawn, and this only guards the order of magnitude. Six
     hundred single-blade paths put this room past three thousand, which was a
     third of every element in the house standing in the grass. */
  yes('  and the heaviest room is lighter than it was', lawn.nodes < 2900,
    `${lawn.nodes}, was 3041`);

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(bad ? `\nsmoke166  ${bad} FAILED` : '\nsmoke166  all good');
  process.exit(bad ? 1 : 0);
})();
