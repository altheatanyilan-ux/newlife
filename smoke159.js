/* smoke159 — the volume the design is set at. Everything here was once
   calibrated for someone staring at a single element for half a minute, and
   at those numbers none of it could be seen at all. These are the numbers
   that make an effect land inside the second or two a glance actually lasts:
   how far a word travels and how far apart the words are, how wide the
   cursor is, how much depth a pressed thing has, and how many motes are in
   the air. The point of pinning them is that the next person to touch this
   file has to mean it. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);
const atLeast = (n,a,b,g='') => a >= b ? ok(n, g||String(a)) : no(n, `${a} is under ${b}`);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1340, height:1000}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1600); }
  const dark = async () => { await p.evaluate(() => { S.settings.theme = 'dark'; applyTheme(); }); await p.waitForTimeout(300); };
  const tok = n => p.evaluate(k => getComputedStyle(document.documentElement).getPropertyValue(k).trim(), n);
  /* The textures are data URIs, so everything inside them is percent-encoded
     by the time it reaches a computed style. Only the URIs can be decoded:
     --card-face ends in a gradient whose 0% and 100% stops sit outside them
     and make decodeURIComponent on the whole value throw. */
  const plain = s => s.replace(/data:image\/svg\+xml,[^"]*/g,
    u => { try { return decodeURIComponent(u); } catch(e){ return u; } });

  console.log('\n1. the ground and the surfaces are made of something');
  for(const [room, set] of [['light', 'light'], ['dark', 'dark']]){
    await p.evaluate(t => { S.settings.theme = t; applyTheme(); }, set);
    await p.waitForTimeout(250);
    const grain = plain(await tok('--grain')), face = plain(await tok('--card-face'));
    /* Tooth, and a coarser pass under it for body. Nothing else: the version
       that drew the loose fibres of real 宣纸 read as scratches across a flat
       tint at page scale, and the wide soft wash under them read as stains. */
    is(`the ${room} ground is tooth and nothing else`,
      (grain.match(/feTurbulence/g) || []).length, 2);
    yes(`  and none of it has a direction`, !/baseFrequency='[.\d]+ /.test(grain),
      'a stretched baseFrequency is a streak, which is what cheap looks like');
    yes(`  smooth noise, because tooth is speckle rather than filament`,
      !/type='turbulence'/.test(grain));
    atLeast(`the ${room} surfaces are stone: hairlines, veins and the drift under them`,
      (face.match(/feTurbulence/g) || []).length, 3);
    yes(`  laid on a tile wider than any card`, /width='900'/.test(face));
  }

  console.log('\n2. depth is a fact rather than an argument');
  await dark();
  const lev = await p.evaluate(() => [0,1,2,3,4].map(i =>
    getComputedStyle(document.documentElement).getPropertyValue('--elev-' + i).trim()));
  const lum = h => { const n = parseInt(h.slice(1), 16); return ((n>>16&255)+(n>>8&255)+(n&255))/3; };
  const steps = lev.slice(1).map((c, i) => lum(c) - lum(lev[i]));
  yes('every level is lighter than the one under it', steps.every(s => s > 0), steps.join(', '));
  atLeast('  and by enough to see', Math.min(...steps), 4, 'smallest step ' + Math.min(...steps).toFixed(1));
  const ring = await tok('--focus-ring');
  atLeast('the focus ring is a ring, a halo and two widths of warmth past it',
    ring.split(/\),/).length, 4, ring.split(/\),/).length + ' layers');

  console.log('\n3. words arrive far enough apart to be read arriving');
  await p.evaluate(() => location.hash = '#/today'); await p.waitForTimeout(1200);
  const wd = await p.evaluate(() => {
    const n = document.querySelector('[data-reveal] .wd:nth-child(4)');
    if(!n) return null;
    const cs = getComputedStyle(n);
    return {delay: cs.transitionDelay, i: n.style.getPropertyValue('--i')};
  });
  yes('a revealed block is split into words', !!wd, 'no [data-reveal] .wd found');
  if(wd) is('  each waiting fifty milliseconds longer than the last',
    Math.round(parseFloat(wd.delay) * 1000 / wd.i), 50);

  console.log('\n4. a cursor you can see from reading distance');
  const cur = await p.evaluate(async () => {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:0;top:0';
    document.body.appendChild(host);
    Kinetic.type(host, 'abcdef');
    await new Promise(r => setTimeout(r, 60));
    const c = host.querySelector('.tw-cursor');
    const w = c ? getComputedStyle(c).width : null;
    return {w, glyph: c ? c.textContent : null};
  });
  is('the cursor is three pixels of drawn bar', cur.w, '3px');
  is('  and not a glyph that half the faces here do not have', cur.glyph, '');

  console.log('\n5. there is something in the air');
  const air = await p.evaluate(() => {
    const s = [...document.querySelectorAll('script')].map(n => n.textContent).join('\n');
    const m = s.match(/for\(let i = 0; i < (\d+); i\+\+\) ps\.push\(\{/);
    return m ? +m[1] : 0;
  });
  atLeast('the room carries at least twenty-five motes', air, 25, air + ' motes');
  const burst = await p.evaluate(() => { const f = Object.create(ParticleField.prototype);
    f.ps = []; f.w = 800; f.h = 600; f.run = () => {}; f.burst(400, 300); return f.ps.length; });
  atLeast('a card that turns throws at least forty sparks', burst, 40, burst + ' sparks');
  const shim = await p.evaluate(() => { const f = Object.create(ParticleField.prototype);
    f.ps = []; f.w = 800; f.h = 600; f.run = () => {}; f.shimmer(); return f.ps.length; });
  atLeast('  and the wind at the end of a spread is eighty or more', shim, 80, shim + ' motes');

  console.log('\n6. things that are artefacts sit where they were put down');
  const col = await p.evaluate(() => {
    const w = document.createElement('div'); w.className = 'entries';
    w.innerHTML = ['memory','letter','quote','reflection'].map(t =>
      `<article class="entry" data-type="${t}"${t === 'letter' ? ' data-stamp="sealed"' : ''}>x</article>`).join('');
    document.body.appendChild(w);
    const cs = i => getComputedStyle(w.children[i]);
    const out = {
      angles: [0,1,2,3].map(i => cs(i).rotate),
      torn: [0,1,2,3].map(i => cs(i).clipPath !== 'none'),
      straight: (() => { w.children[0].classList.add('x'); return true; })(),
      stamp: getComputedStyle(w.children[1], '::before').backgroundImage.slice(0, 26),
      stampTilt: getComputedStyle(w.children[1], '::before').rotate,
    };
    w.remove(); return out;
  });
  yes('no two neighbours lean the same way', new Set(col.angles).size === 4, col.angles.join(' '));
  yes('  and none of them is straight', col.angles.every(a => a !== 'none' && parseFloat(a) !== 0));
  is('a memory is torn from something', col.torn[0], true);
  is('  so is a letter and so is a quote', col.torn[1] && col.torn[2], true);
  is('  a reflection is not', col.torn[3], false);
  yes('a sealed letter carries a stamp', /^url\("data:image/.test(col.stamp));
  yes('  pressed at the angle a hand presses one', parseFloat(col.stampTilt) !== 0, col.stampTilt);

  console.log('\n7. the decode is deciphering rather than loading');
  yes('there are characters in the scramble set, not just marks',
    await p.evaluate(() => /[一-鿿]/.test(SCRAMBLE_GLYPHS)));

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(bad ? `\nsmoke159  ${bad} FAILED` : '\nsmoke159  all good');
  process.exit(bad ? 1 : 0);
})();
