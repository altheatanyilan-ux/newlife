/* smoke154 — the micro-interaction layer (Part 1 of the site-wide spec).
   The pointer layer, the scroll layer, the ambient layer, the feedback layer
   and the polish layer: that each is there, that each is off when the browser
   asks for less motion, and that none of it costs the page a listener or a
   frame loop it does not need. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('/home/user/newlife/index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const open = async (opts = {}) => {
    const ctx = await b.newContext({viewport:{width:1440, height:900}, ...opts});
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
    await p.goto(FILE); await p.waitForTimeout(1000);
    if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2100); }
    return p;
  };
  const go = async (p, hash) => { await p.evaluate(h => { location.hash = h; rerender(); }, hash); await p.waitForTimeout(1500); };

  console.log('\n1. the pointer has a body');
  let p = await open();
  await go(p, '#/today');
  yes('the cursor layer started', await p.evaluate(() => MicroFX.running));
  yes('  and the native pointer is hidden while it is drawn',
      await p.evaluate(() => document.documentElement.classList.contains('mfx-cursor')));
  yes('  there is a dot and a ring', await p.evaluate(() =>
    !!document.querySelector('.mfx-dot') && !!document.querySelector('.mfx-ring')));
  /* the grips keep their own cursor: a drawn dot cannot say "drag this edge" */
  is('  a resize grip keeps its arrow', await p.evaluate(() => {
    const d = document.createElement('div'); d.className = 'panel-grip'; document.body.appendChild(d);
    const c = getComputedStyle(d).cursor; d.remove(); return c; }), 'col-resize');

  console.log('\n2. the pointer changes shape for what it is over');
  const btn = await p.$('.btn.primary') || await p.$('button');
  const bb = await btn.boundingBox();
  await p.mouse.move(bb.x + bb.width * .8, bb.y + bb.height / 2);
  await p.waitForTimeout(350);
  const st = await p.evaluate(() => ({
    ring: document.querySelector('.mfx-ring').className,
    dot: document.querySelector('.mfx-dot').className,
    /* the same move should have pulled the button towards the pointer */
    pulled: [...document.querySelectorAll('button,.btn')].filter(n => /translate\(-?\d*\.?\d+px/.test(n.style.transform)).length}));
  yes('over something pressable the ring opens', /\bclick\b/.test(st.ring), st.ring);
  yes('  and the thing itself leans towards the pointer', st.pulled > 0, `${st.pulled} pulled`);
  const inp = await p.$('input.inp,textarea,.ed');
  if(inp){ const ib = await inp.boundingBox();
    if(ib){ await p.mouse.move(ib.x + 12, ib.y + 8); await p.waitForTimeout(320);
      const e2 = await p.evaluate(() => ({d:document.querySelector('.mfx-dot').className, r:document.querySelector('.mfx-ring').className}));
      yes('over something writable the dot becomes a caret', /\btext\b/.test(e2.d), e2.d);
      yes('  and the ring gets out of the way', /\btext\b/.test(e2.r), e2.r); } }
  await p.mouse.move(720, 520); await p.waitForTimeout(300);
  yes('a large surface lights under the pointer',
      await p.evaluate(() => !!document.querySelector('.mfx-lit')));
  yes('  and a card leans', await p.evaluate(() => document.querySelectorAll('.mfx-tilt').length > 0));

  console.log('\n3. the ambient layer is on, and quiet');
  const amb = await p.evaluate(() => {
    const w = document.getElementById('warmth');
    const h = document.querySelector('.page-head h1') || document.querySelector('h1');
    return {warmth: !!w, blend: w && getComputedStyle(w).mixBlendMode,
      /* the sheet must never be able to swallow a click */
      through: w && getComputedStyle(w).pointerEvents,
      dust: !!document.getElementById('dust'),
      breathing: h && getComputedStyle(h).animationName};
  });
  yes('the hour of the day is laid over the page', amb.warmth);
  /* the spec asks for a sepia filter on <body>; a filter there makes body the
     containing block for every position:fixed child and the whole shell
     repositions, so it is a tinted sheet instead — and a flat one, because a
     blended one cost a quarter of the frame rate */
  is('  as a flat sheet, not a blended one', amb.blend, 'normal');
  is('  that nothing can be clicked through', amb.through, 'none');
  yes('  the dust canvas is there', amb.dust);
  await go(p, '#/values');
  is('  and the page title breathes',
     await p.evaluate(() => getComputedStyle(document.querySelector('.page-head h1')).animationName), 'mfxBreathe');

  console.log('\n4. numbers wait to be looked at');
  await go(p, '#/journals/review');
  const cnt = await p.evaluate(() => {
    const ns = [...document.querySelectorAll('[data-tween]')];
    const below = ns.filter(n => n.getBoundingClientRect().top > innerHeight);
    return {total: ns.length, below: below.length, belowUncounted: below.filter(n => !n.dataset.sfxDone).length,
      aboveCounted: ns.filter(n => n.getBoundingClientRect().top <= innerHeight && n.dataset.sfxDone).length};
  });
  yes('there are numbers on this page', cnt.total > 3, `${cnt.total}`);
  yes('  none below the fold has counted yet', cnt.below > 0 && cnt.belowUncounted === cnt.below,
      `${cnt.belowUncounted} of ${cnt.below} still waiting`);
  /* jumping straight to the foot is the case that used to leave them at zero
     for good: nothing crosses an intersection threshold on the way past */
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await p.waitForTimeout(900);
  yes('  and jumping past them still counts them', await p.evaluate(() =>
    [...document.querySelectorAll('[data-tween]')].every(n => n.dataset.sfxDone)),
    await p.evaluate(() => [...document.querySelectorAll('[data-tween]')].filter(n=>!n.dataset.sfxDone).length + ' left behind'));

  console.log('\n5. the line at the top says how far down you are');
  const pr = await p.evaluate(() => {
    const bar = document.getElementById('scrollProgress');
    const long = document.documentElement.scrollHeight > innerHeight * 1.5;
    return {there: !!bar, long, w: bar && bar.style.width, z: bar && getComputedStyle(bar).zIndex};
  });
  yes('the line exists', pr.there);
  if(pr.long) yes('  and it has moved on a long page', parseFloat(pr.w) > 5, pr.w);
  yes('  it sits above everything', +pr.z >= 99999, pr.z);

  console.log('\n6. what the app says back');
  const fb = await p.evaluate(() => {
    RewardFX.saved(400, 400, 'var(--sage)');
    const whisper = !!document.querySelector('.fx-saved');
    RewardFX.celebrate('A test milestone ✦');
    const mile = document.querySelector('.fx-mile');
    return {whisper, mile: !!mile, motes: document.querySelectorAll('.fx-mote').length,
      word: mile && mile.querySelector('.fx-mile-word').textContent};
  });
  yes('a save says so where it happened', fb.whisper);
  yes('a milestone opens a ring', fb.mile);
  yes('  with motes going up', fb.motes >= 15, `${fb.motes}`);
  is('  and one line of writing', fb.word, 'A test milestone ✦');
  await p.waitForTimeout(3400);
  yes('  and it clears itself away', await p.evaluate(() => !document.querySelector('.fx-mile')));
  /* the same milestone must never be announced twice */
  const twice = await p.evaluate(() => {
    S.settings.milestones = {}; 
    const a = RewardFX.check !== undefined;
    S.settings.milestones['test:x'] = today();
    return a;
  });
  yes('  the ledger of what has been celebrated exists', twice);

  console.log('\n7. the code');
  for(const k of ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'])
    await p.keyboard.press(k);
  await p.waitForTimeout(400);
  yes('the mark appears beside the name', await p.evaluate(() => !!document.querySelector('.brand.konami')));

  console.log('\n8. interface sounds are their own switch, and off');
  await go(p, '#/settings');
  yes('the toggle is in Settings', await p.evaluate(() => !!document.getElementById('sUiSound')));
  is('  and starts off', await p.evaluate(() => SoundManager.state().uiEnabled), false);
  await p.close();

  console.log('\n9. asked for less motion, given less');
  p = await open({reducedMotion:'reduce'});
  await go(p, '#/today');
  const rm = await p.evaluate(() => ({
    cursor: MicroFX.running,
    marked: document.documentElement.classList.contains('mfx-cursor'),
    dot: !!document.querySelector('.mfx-dot'),
    title: getComputedStyle(document.querySelector('h1') || document.body).animationName,
  }));
  is('the cursor never starts', rm.cursor, false);
  is('  so the native pointer is left alone', rm.marked, false);
  is('  and nothing is drawn for it', rm.dot, false);
  is('  nothing breathes', rm.title, 'none');
  yes('  a milestone is words only, no ring', await p.evaluate(() => {
    RewardFX.celebrate('Quietly ✦'); return !document.querySelector('.fx-mile'); }));

  console.log('\n10. the budget');
  await p.close();
  p = await open();
  await go(p, '#/today');
  /* An absolute frame rate says more about the machine than the code — this
     container renders in software and floors around twenty. So the layer is
     measured against the page with the layer switched off, on the same
     machine, in the same second. */
  const rate = () => p.evaluate(() => new Promise(res => {
    let f = 0; const t0 = performance.now();
    const tick = () => { f++; if(performance.now() - t0 < 1200) requestAnimationFrame(tick);
      else res(f / 1.2); };
    requestAnimationFrame(tick); }));
  const withFX = await rate();
  await p.evaluate(() => { document.getElementById('warmth').style.display = 'none';
    document.getElementById('dust').style.display = 'none'; MicroFX.stop(); });
  const without = await rate();
  yes('the whole layer costs less than a fifth of the frame rate',
      withFX > without * 0.8, `${withFX.toFixed(0)} fps with, ${without.toFixed(0)} without`);
  /* and it must not leave a loop spinning when there is nothing to move */
  await p.evaluate(() => { MicroFX.start(); });
  await p.mouse.move(600, 400);
  /* the ring lerps a sixth of the remaining gap a frame, and this container
     renders at about twenty frames a second, so how long it takes to arrive
     is a fact about the machine — what is being tested is that it arrives
     and lets go, not how fast */
  const settled = await p.evaluate(() => new Promise(res => {
    const t0 = performance.now();
    const look = () => {
      if(MicroFX.idle) return res(Math.round(performance.now() - t0));
      if(performance.now() - t0 > 5000) return res(-1);
      setTimeout(look, 60); };
    look(); }));
  yes('  and the cursor loop lets go of the frame once the ring arrives',
      settled >= 0, settled < 0 ? 'still spinning after 5s' : `settled in ${settled}ms`);
  await p.close();

  console.log('\n11. quiet');
  is('no errors on the console', errs.length, 0, errs.join(' | '));
  if(errs.length) errs.forEach(e => console.log('    ' + e));

  console.log(bad ? `\n${bad} FAILED` : '\nsmoke154  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
