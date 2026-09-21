/* smoke161 — the values solar system. A ranked list says which value you put
   first. It cannot say which one you have actually been tending, which is
   slipping, which has any weight of evidence behind it, or which you named as
   important and then built nothing toward. The system says all of that, and
   the only thing worth pinning about it is that every property is a fact:
   orbit is rank, size is evidence, saturation is how much of that evidence
   was embodied, a broken orbit is a blind spot. If any of those ever stops
   being read off the data, the picture is decoration and this file should
   fail. */
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
  const p = await b.newPage({viewport:{width:1340, height:1000}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource|ERR_CERT_AUTHORITY_INVALID/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1600); }

  const values = async () => { await p.evaluate(() => { location.hash = '#/values'; }); await p.waitForTimeout(1100); };
  /* every planet where it is on the screen this instant */
  const spots = () => p.evaluate(() => {
    const s = _solar, r = s.cv.getBoundingClientRect();
    return s.planets.map(q => { const {x, y} = s.pos(q, q.ang == null ? q.seed : q.ang);
      return {id: q.id, name: q.name, rank: q.rank, orbit: q.orbit, radius: q.radius,
        served: q.served, x: Math.round(r.left + x), y: Math.round(r.top + y)}; });
  });
  await values();

  console.log('\n1. the system is on the page, and it is one planet per value');
  yes('the canvas is mounted', await p.$('#solarCv') !== null);
  const n = await p.evaluate(() => S.valueOrder.filter(id => byId(S.values, id)).length);
  is('one planet for every ranked value', (await spots()).length, n);
  const sized = await p.evaluate(() => { const c = document.querySelector('#solarCv');
    return {w: c.clientWidth, h: c.clientHeight}; });
  yes('the canvas has been given a size', sized.w > 300 && sized.h > 200, JSON.stringify(sized));

  console.log('\n2. every property is read off the data, not chosen');
  let ps = await spots();
  const byRank = [...ps].sort((a, b) => a.rank - b.rank);
  yes('further out is lower priority', byRank.every((q, i) => !i || q.orbit > byRank[i-1].orbit),
    byRank.map(q => `${q.rank}:${Math.round(q.orbit)}`).join(' '));
  yes('the innermost orbit clears the sun', byRank[0].orbit >= 80, String(byRank[0].orbit));
  /* size is evidence, and an untouched value still has to be visible */
  const ev = await p.evaluate(() => valuePlanets().map(q => ({n: q.name, e: q.evidence, r: q.radius})));
  yes('size is how much evidence there is', ev.every(q => Math.abs(q.r - (12 + Math.min(q.e, 50) * .48)) < .001),
    JSON.stringify(ev));
  yes('a value with no evidence is still a planet', ev.every(q => q.r >= 12));
  /* a value nothing is built toward is drawn broken */
  const served = await p.evaluate(() => {
    const id = S.valueOrder[0];
    const before = valueServed(id);
    S.visions.push({id: 'vx-smoke', title: 'x', links: {values: [{id}]}, valueIds: []});
    const after = valueServed(id);
    S.visions.pop();
    return {before, after};
  });
  is('a vision that names a value serves it', served.after, true);
  is('and without one it does not', served.before, false);

  console.log('\n3. the card under the pointer says what the planet is');
  await p.evaluate(() => { document.querySelector('#solarBox').scrollIntoView({block: 'center'}); });
  await p.waitForTimeout(400);
  await p.evaluate(() => _solar.stop());          /* hold it still to aim at one */
  ps = await spots();
  const target = ps.find(q => q.rank === 2) || ps[0];
  await p.mouse.move(target.x, target.y); await p.waitForTimeout(250);
  const tip = await p.evaluate(() => { const e = document.querySelector('#solarTip');
    return {hidden: e.hidden, text: e.innerText, left: parseFloat(e.style.left), top: parseFloat(e.style.top),
      w: e.offsetWidth, h: e.offsetHeight, boxW: e.parentElement.clientWidth, boxH: e.parentElement.clientHeight}; });
  yes('the card opens', !tip.hidden);
  yes('it names the planet', tip.text.includes(target.name), tip.text.slice(0, 60));
  yes('it gives the rank', /priority #2 of/i.test(tip.text), tip.text.slice(0, 80));
  for(const word of ['congruence', 'evidence', 'last tended'])
    yes(`it gives ${word}`, tip.text.toLowerCase().includes(word));
  yes('and names the blind spot when there is one',
    !target.served ? /nothing is being built toward/i.test(tip.text) : true);
  yes('it stays inside the box', tip.left >= 0 && tip.top >= 0
    && tip.left + tip.w <= tip.boxW + 1 && tip.top + tip.h <= tip.boxH + 1, JSON.stringify(tip));
  await p.mouse.move(5, 5); await p.waitForTimeout(200);
  yes('and closes when the pointer leaves', await p.evaluate(() => document.querySelector('#solarTip').hidden));

  console.log('\n4. a click opens the value; a hold re-ranks it');
  await values();
  await p.evaluate(() => { document.querySelector('#solarBox').scrollIntoView({block: 'center'}); });
  await p.waitForTimeout(400);
  await p.evaluate(() => _solar.stop());
  ps = await spots();
  const one = ps[1];
  await p.mouse.move(one.x, one.y); await p.waitForTimeout(120);
  await p.mouse.down(); await p.waitForTimeout(70); await p.mouse.up();
  await p.waitForTimeout(700);
  is('a quick click opens that value', await p.evaluate(() => location.hash), '#/value/' + one.id);

  await values();
  await p.evaluate(() => { document.querySelector('#solarBox').scrollIntoView({block: 'center'}); });
  await p.waitForTimeout(400);
  await p.evaluate(() => _solar.stop());
  ps = await spots();
  const last = ps[ps.length - 1], first = ps[0];
  const before = await p.evaluate(() => [...S.valueOrder]);
  const rank0 = await p.evaluate(() => S.valueOrderHistory.length);
  await p.mouse.move(last.x, last.y); await p.waitForTimeout(120);
  await p.mouse.down(); await p.waitForTimeout(420);
  yes('a hold detaches the planet', await p.evaluate(() => !!(_solar && _solar.drag)));
  await p.mouse.move(first.x, first.y, {steps: 12}); await p.waitForTimeout(220);
  is('the orbit it would land in is the one it is nearest',
    await p.evaluate(() => _solar.dragOver && _solar.dragOver.id), first.id);
  await p.mouse.up(); await p.waitForTimeout(800);
  const after = await p.evaluate(() => [...S.valueOrder]);
  is('dropping it on the innermost orbit makes it first', after[0], last.id);
  is('and the rest keep their order', after.slice(1), before.filter(id => id !== last.id));
  is('the previous order is kept', await p.evaluate(() => S.valueOrderHistory.length), rank0 + 1);
  is('and it survives the redraw', await p.evaluate(() => S.valueOrder[0]), last.id);

  console.log('\n5. the planets are actually going round, and each is its own object');
  await values();
  /* A house with nothing in it yet is the state every new house is in, and it
     used to draw at half a degree a second — twelve minutes for one circuit,
     which reads as nailed down. Two degrees a second is the floor worth
     defending: below it nobody can see the system move. */
  const turn = async () => {
    const a0 = await p.evaluate(() => _solar.planets.map(q => q.ang));
    await p.waitForTimeout(1500);
    const a1 = await p.evaluate(() => _solar.planets.map(q => q.ang));
    return a0.map((a, i) => ((a1[i] - a) * 180 / Math.PI + 720) % 360 / 1.5);
  };
  const degs = await turn();
  yes('every planet turns at two degrees a second or better',
    degs.every(d => d >= 2), degs.map(d => d.toFixed(1)).join(' / '));
  /* Kepler, and the reason the picture reads as a system rather than a plate */
  yes('  and the further out, the slower round',
    degs.every((d, i) => i === 0 || d < degs[i - 1] + .01),
    degs.map(d => d.toFixed(1)).join(' / '));
  const made = await p.evaluate(() => _solar.planets.map(q =>
    [q.face, q.ringed ? 'ring' : '', q.storm ? 'storm' : '', q.moon ? 'moon' : ''].filter(Boolean).join('+')));
  yes('  and every one of them is made of something nameable',
    made.every(m => /^(banded|cratered|marbled|swirled|capped|smooth)/.test(m)), made.join(' / '));

  /* The one thing in the drawing that read as broken. A planet under the
     pointer stops so it can be read; when the pointer leaves it used to
     resume from where it WOULD have got to, so it jumped forward by however
     long you had lingered. */
  console.log('\n6. a planet that was held starts again from where it stopped');
  ps = await spots();
  const held = ps[0];
  await p.mouse.move(held.x, held.y); await p.waitForTimeout(150);
  yes('the pointer stops it', await p.evaluate(() => !!_solar.hover));
  const frozen = await p.evaluate(() => _solar.hover.ang);
  await p.waitForTimeout(1200);
  is('  and it stays stopped', await p.evaluate(() => _solar.hover.ang), frozen);
  await p.mouse.move(held.x, held.y - 260); await p.waitForTimeout(80);
  const after1 = await p.evaluate(() => _solar.planets[0].ang);
  const jump = Math.abs(after1 - frozen) * 180 / Math.PI;
  yes('  and it does not jump when the pointer leaves', jump < 3, jump.toFixed(2) + ' deg');
  await p.waitForTimeout(900);
  yes('  it simply carries on', await p.evaluate(() => _solar.planets[0].ang) > after1);

  console.log('\n7. it stops when nobody has asked for motion');
  await p.emulateMedia({reducedMotion: 'reduce'});
  await p.evaluate(() => rerender()); await p.waitForTimeout(900);
  yes('a still system draws one frame and no loop',
    await p.evaluate(() => !!(_solar && _solar.soft && !_solar.raf)),
    await p.evaluate(() => _solar ? `soft=${_solar.soft} raf=${_solar.raf}` : 'no system'));
  const painted = await p.evaluate(() => {
    const c = document.querySelector('#solarCv'), g = c.getContext('2d');
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let lit = 0; for(let i = 3; i < d.length; i += 4) if(d[i] > 8) lit++;
    return lit;
  });
  yes('and the one frame is actually drawn', painted > 2000, String(painted));
  await p.emulateMedia({reducedMotion: 'no-preference'});
  await p.evaluate(() => rerender()); await p.waitForTimeout(900);
  yes('and asking for motion back puts the loop back',
    await p.evaluate(() => !!(_solar && !_solar.soft && _solar.raf)));
  await p.evaluate(() => { location.hash = '#/today'; }); await p.waitForTimeout(900);
  yes('leaving the page stops it', await p.evaluate(() => !document.querySelector('#solarCv')));

  console.log('\n8. the key says what it all means, in words');
  await values();
  const key = await p.evaluate(() =>
    [...document.querySelectorAll('.solar-key dt')].map(n => n.textContent.trim().toLowerCase()));
  for(const term of ['how far out', 'how fast', 'how bright', 'how big', 'how saturated', 'the tail', 'a broken orbit'])
    yes(`the key explains "${term}"`, key.includes(term), key.join(' / '));

  /* A solar system drawn on white paper is a diagram. The aura, the corona,
     the comet tail and the rim light are all light against dark, and every one
     of them disappears on a cream ground — so the canvas keeps the night
     whether or not the rest of the house is in it. It is DRAWN, not set as a
     background, because a rectangle of black dropped into a daylit page is a
     hole in the page: an ellipse that covers every planet and reaches nothing
     before it reaches any edge. */
  console.log('\n9. the system is always at night, and the night is a shape');
  await p.emulateMedia({reducedMotion: 'no-preference'});
  await p.evaluate(() => { S.settings.theme = 'light'; applyTheme(); }); await values();
  const ground = () => p.evaluate(() => {
    const cv = document.querySelector('#solarCv'), g = cv.getContext('2d');
    const a = (fx, fy) => g.getImageData(Math.round(cv.width * fx), Math.round(cv.height * fy), 1, 1).data[3] / 255;
    /* under every planet and the label beneath it, in canvas coordinates */
    const s = _solar, dpr = s.dpr;
    const under = s.planets.map(q => { const {x, y} = s.pos(q, q.ang == null ? q.seed : q.ang);
      const ly = Math.min(s.h - 1, y + q.radius + 14);
      return {name: q.name,
        on: g.getImageData(Math.round(x * dpr), Math.round(y * dpr), 1, 1).data[3] / 255,
        label: g.getImageData(Math.round(x * dpr), Math.round(ly * dpr), 1, 1).data[3] / 255}; });
    return {corners: [a(.01,.02), a(.99,.02), a(.01,.98), a(.99,.98)],
      middle: a(.5,.5), ink: s.ink().label, under};
  });
  const gr = await ground();
  is('  the palette is the night one even on a daylit page', gr.ink, '#e8e0d4');
  yes('  the middle is night', gr.middle > .9, String(gr.middle));
  yes('  and every corner of the canvas is the page showing through',
    gr.corners.every(a => a < .02), gr.corners.map(a => a.toFixed(2)).join(' '));
  /* The first version of this fell from .88 to nothing over the last sixth of
     the radius, in four straight segments. It read as a grey shape pasted onto
     the page rather than as a sky, and the reason is that a straight segment
     ends in a kink and the eye finds a kink. Walking out from the centre, no
     single step may jump, and the fade must be long. */
  const walk = await p.evaluate(() => {
    const cv = document.querySelector('#solarCv'), g = cv.getContext('2d');
    const s = _solar, dpr = s.dpr;
    /* THE PLANETS WILL NOT HOLD STILL, so stop trying to make them.
       They orbit on the wall clock, and anything drawn on top of the sky is
       not the sky — so a single line out from the centre reads partly the
       ground and partly Saturn, and which is which changes between the frame
       that painted and the line that reads. Discarding the dirty samples
       made the COVERAGE move instead: eleven usable readings one afternoon,
       twenty-four the next, and a claim whose coverage is decided by where a
       planet happens to be is a claim that fails on a Tuesday.
       Pinning the angles does not work either, because the next frame
       recomputes them from the clock.
       So: read along twenty-four radii at once and take the median of each
       ring. A planet sits on two or three of them; it cannot move a median
       of twenty-four. Every reading below is of the ground, on every run,
       without anything having to be held still — and it measures the fade
       all the way round rather than along one lucky line. */
    const rings = 24, rays = 24;
    const cx = s.w / 2, cy = s.h / 2;
    const mid = xs => { const v = xs.slice().sort((a, b) => a - b);
      return v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2; };
    const out = [];
    for(let i = 0; i <= rings; i++){
      const reads = [];
      for(let k = 0; k < rays; k++){
        const dir = (k / rays) * 2 * Math.PI;
        const dx = Math.cos(dir), dy = Math.sin(dir) * s.ysq;
        const far = Math.min(Math.abs(dx) < 1e-6 ? 1e9 : (cx - 1) / Math.abs(dx),
          Math.abs(dy) < 1e-6 ? 1e9 : (cy - 1) / Math.abs(dy));
        const r = far * (i / rings);
        const px = Math.max(0, Math.min(cv.width - 1, Math.round((cx + r * dx) * dpr)));
        const py = Math.max(0, Math.min(cv.height - 1, Math.round((cy + r * dy) * dpr)));
        reads.push(g.getImageData(px, py, 1, 1).data[3] / 255);
      }
      out.push({a: mid(reads), rays: reads.length, clear: true});
    }
    return out;
  });
  /* a step is only a step between two readings that are both of the ground */
  const steps = walk.slice(1).map((x, i) => walk[i].clear && x.clear ? walk[i].a - x.a : null)
    .filter(d => d != null);
  is('  every ring is the median of twenty-four radii, so none of it is planet',
    [steps.length, walk[0].rays], [24, 24]);
  yes('  the night never drops away in a step', Math.max(...steps) < .2,
    'biggest step ' + Math.max(...steps).toFixed(3));
  yes('    and it never brightens on the way out', Math.min(...steps) > -.06,
    'biggest rise ' + (-Math.min(...steps)).toFixed(3));
  /* a third of the half-width or more spent fading, rather than a sixth */
  const fading = steps.filter(d => d > .004).length / steps.length;
  yes('    it spends a third of the way out fading', fading > .3, fading.toFixed(2));
  /* the whole point of reserving room for the fade: a bright planet sitting in
     the last tenth of the gradient is a lit thing on a half-lit ground with an
     unreadable label under it */
  yes('  every planet is on ground that is actually dark',
    gr.under.every(u => u.on > .8), gr.under.map(u => `${u.name} ${u.on.toFixed(2)}`).join(' / '));
  yes('    and so is the label under it',
    gr.under.every(u => u.label > .8), gr.under.map(u => `${u.name} ${u.label.toFixed(2)}`).join(' / '));

  /* Always dark and always black are not the same thing, and on a light page
     the difference is the whole thing. A near-black disc on a cream ground is
     a hole punched in the page however softly it fades — the dark was never
     wrong, the pitch was. So on a light page the ground is a dusk: two
     colours, warm close in and cool further out, the way the sky over the
     house is built. In dark mode it stays as deep as it ever was, because
     somebody who has put the whole house in the dark is not asking for dusk. */
  console.log('\n10. the night is a dusk on a light page and a night on a dark one');
  /* the ground itself, not the sun sitting on top of it: the median of a ring
     well inside the core, so a planet crossing it cannot swing the answer */
  const ring = () => p.evaluate(() => {
    const cv = document.querySelector('#solarCv'), g = cv.getContext('2d');
    const lum = [];
    for(let i = 0; i < 32; i++){
      const a = i / 32 * Math.PI * 2;
      const x = Math.round(cv.width / 2 + Math.cos(a) * cv.width * .22);
      const y = Math.round(cv.height / 2 + Math.sin(a) * cv.height * .22);
      const d = g.getImageData(x, y, 1, 1).data;
      lum.push({v: (d[0] * .2126 + d[1] * .7152 + d[2] * .0722) * (d[3] / 255), a: d[3] / 255});
    }
    lum.sort((m, n) => m.v - n.v);
    return lum[16];
  });
  await p.evaluate(() => { S.settings.theme = 'light'; applyTheme(); }); await values();
  const day = await ring();
  const dayMix = await p.evaluate(() => _solar.sky());
  await p.evaluate(() => { S.settings.theme = 'dark'; applyTheme(); }); await values();
  const night = await ring();
  const nightMix = await p.evaluate(() => _solar.sky());
  await p.evaluate(() => { S.settings.theme = 'light'; applyTheme(); }); await values();

  yes('on a light page the ground is a dusk, not a hole', day.v > 18,
    `luminance ${day.v.toFixed(1)}`);
  yes('  built out of two colours, warm in and cool out, like the sky over the house',
    dayMix.core.join() !== dayMix.edge.join(), JSON.stringify(dayMix));
  yes('  and still dark enough to hold a pale planet', day.v < 90 && day.a > .7,
    `luminance ${day.v.toFixed(1)}, alpha ${day.a.toFixed(2)}`);
  yes('in the dark it stays as deep as it ever was', night.v < day.v * .6,
    `${night.v.toFixed(1)} against ${day.v.toFixed(1)}`);
  yes('  which is a darker ink than the dusk, not merely a dimmer one',
    nightMix.core.join() !== dayMix.core.join(), JSON.stringify(nightMix));

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(bad ? `\nsmoke161  ${bad} FAILED` : '\nsmoke161  all good');
  process.exit(bad ? 1 : 0);
})();
