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
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
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

  console.log('\n5. it stops when nobody has asked for motion');
  await p.evaluate(() => { S.settings.decor = 'plain'; applyDecor(); rerender(); });
  await p.waitForTimeout(900);
  yes('plain draws one frame and no loop',
    await p.evaluate(() => !!(_solar && _solar.soft && !_solar.raf)),
    await p.evaluate(() => _solar ? `soft=${_solar.soft} raf=${_solar.raf}` : 'no system'));
  const painted = await p.evaluate(() => {
    const c = document.querySelector('#solarCv'), g = c.getContext('2d');
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let lit = 0; for(let i = 3; i < d.length; i += 4) if(d[i] > 8) lit++;
    return lit;
  });
  yes('and the one frame is actually drawn', painted > 2000, String(painted));
  await p.evaluate(() => { S.settings.decor = 'full'; applyDecor(); rerender(); });
  await p.waitForTimeout(900);
  yes('and full puts the loop back', await p.evaluate(() => !!(_solar && !_solar.soft && _solar.raf)));
  await p.evaluate(() => { location.hash = '#/today'; }); await p.waitForTimeout(900);
  yes('leaving the page stops it', await p.evaluate(() => !document.querySelector('#solarCv')));

  console.log('\n6. the key says what it all means, in words');
  await values();
  const key = await p.evaluate(() =>
    [...document.querySelectorAll('.solar-key dt')].map(n => n.textContent.trim().toLowerCase()));
  for(const term of ['how far out', 'how fast', 'how bright', 'how big', 'how saturated', 'the tail', 'a broken orbit'])
    yes(`the key explains "${term}"`, key.includes(term), key.join(' / '));

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(bad ? `\nsmoke161  ${bad} FAILED` : '\nsmoke161  all good');
  process.exit(bad ? 1 : 0);
})();
