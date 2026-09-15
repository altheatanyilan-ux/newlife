/* smoke168 — the sacred room.

   Stillness was a row of four tabs and divination was a row of five buttons.
   Both were correct, and both asked you to pick a noun off a form before you
   had arrived anywhere. A practice is a place you go to, and the going is half
   of it. So there is a room, seen from the doorway: the cushion is on the
   floor, the four systems are laid out on a table against the right wall, the
   quiet room is through the door at the back, and two candles are burning.

   Three things about it have to stay true or it is wallpaper.

   It has to be a way IN. Every zone has to actually open the thing it is a
   picture of — the cushion the four ways to be still, the deck the tarot, the
   coins the I Ching, the door the sanctuary.

   It has to REMEMBER. The candles burn to the height of how recently you sat;
   the cushion keeps the mark of having been sat on; a system you consulted
   this morning keeps its light until tomorrow; a streak of three days puts out
   a vine with a leaf for every day. None of it is announced, and all of it is
   read off the same data the rest of the page reads.

   And it has to cost nothing. It is one SVG: no canvas, no images, no loop.
   Nine elements animate and every one of them is a transform or an opacity.
   The moment anything in here asks for a frame of its own, the cheapest thing
   on Today has become the most expensive. */
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

  /* the room lives in the Stillness section of the looking-inward half of Today */
  const room = async () => {
    /* the section it lives in is "My sacred space" now, and it holds the whole
       house rather than the one room — the sanctuary is where that room went */
    await p.evaluate(() => {
      S.settings.todayView = 'in';
      S.settings.todayOpen = S.settings.todayOpen || {};
      S.settings.todayOpen['t-sacred'] = true;
      S._houseZone = 'sanctuary'; S.settings.houseZone = 'sanctuary'; saveNow();
      location.hash = '#/today'; rerender(); }); await p.waitForTimeout(900);
    if(await p.$('[data-tview="in"]')) await p.click('[data-tview="in"]');
    await p.waitForTimeout(700);
    await p.evaluate(() => { const d = document.querySelector('#t-sacred'); if(d) d.open = true; });
    await p.waitForTimeout(500);
    await p.evaluate(() => document.querySelector('.room-wrap')?.scrollIntoView({block:'center'}));
    await p.waitForTimeout(300);
  };
  /* where a zone is on the screen this instant */
  const at = sel => p.evaluate(s => { const n = document.querySelector(s); if(!n) return null;
    const r = n.getBoundingClientRect();
    return {x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2)}; }, sel);
  const shut = () => p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  await room();

  console.log('\n1. it is a room, and it is one drawing');
  yes('the room is on the page', await p.$('.sacred-room') !== null);
  const shape = await p.evaluate(() => { const w = document.querySelector('.room-wrap');
    const r = w.getBoundingClientRect();
    return {w: Math.round(r.width), h: Math.round(r.height),
      kids: [...w.children].map(n => n.tagName.toLowerCase()),
      canvas: w.querySelectorAll('canvas').length, img: w.querySelectorAll('img,image').length}; });
  yes('  drawn with one svg and nothing else', shape.kids.length === 1 && shape.kids[0] === 'svg',
    shape.kids.join(','));
  is('  no canvas in it', shape.canvas, 0);
  is('  and no images', shape.img, 0);
  /* an svg with a fixed viewBox and a capped height letterboxes: a room with a
     bar of nothing down each side is a picture of a room rather than a room */
  yes('  it fills its frame rather than sitting letterboxed in it',
    Math.abs(shape.w / shape.h - 2) < .06, `${shape.w}x${shape.h}`);

  console.log('\n2. everything in it is a way in');
  const zones = await p.evaluate(() =>
    [...document.querySelectorAll('.room-wrap [data-room]')].map(n => n.dataset.room));
  /* The shelf is not on this list any more and that is not a loss. The room
     grew into a whole floor and then into a whole house: the books went
     downstairs to the main room, where there is a wall for them, and the
     shelf here would have been the same door drawn twice. */
  for(const k of ['sanctuary','cushion','tarot','iching','oracle','charms'])
    yes(`  you can reach the ${k}`, zones.includes(k), zones.join(' '));
  yes('  and the books are downstairs rather than drawn twice',
    !zones.includes('shelf'), zones.join(' '));
  yes('  and every one of them can be reached from the keyboard',
    await p.evaluate(() => [...document.querySelectorAll('.room-wrap [data-room]')]
      .every(n => n.getAttribute('tabindex') === '0' && n.getAttribute('aria-label'))));

  /* the cushion is the one that is not a shortcut to an existing screen: you
     sit down first, and the four ways to be still are offered round you */
  let spot = await at('.zone-cushion');
  await p.mouse.click(spot.x, spot.y); await p.waitForTimeout(700);
  yes('sitting down offers the four ways to be still', await p.$('.sit-ring') !== null);
  is('  all four of them', await p.evaluate(() =>
    [...document.querySelectorAll('[data-sitkind]')].map(n => n.dataset.sitkind)),
    ['meditation','breath','scan','sanctuary']);
  await p.click('[data-sitkind="breath"]'); await p.waitForTimeout(900);
  is('  and choosing one is the same setting the tabs set',
    await p.evaluate(() => stillness().prefs.kind), 'breath');
  yes('  the ring closes behind you', await p.$('.sit-ring') === null);

  /* the table: reaching for the deck opens the deck */
  await room();
  spot = await at('.obj-tarot');
  await p.mouse.click(spot.x, spot.y); await p.waitForTimeout(1100);
  yes('reaching for the deck opens the tarot',
    await p.evaluate(() => !!document.querySelector('.overlay')));
  await shut();
  await room();
  spot = await at('.obj-coins');
  await p.mouse.click(spot.x, spot.y); await p.waitForTimeout(1100);
  yes('reaching for the coins opens the I Ching',
    await p.evaluate(() => !!document.querySelector('.overlay')));
  await shut();

  console.log('\n3. the room remembers, and says nothing about it');
  /* the candles are the last time you sat. A week away and they gutter; this
     is the room's one honest opinion of you and it is never written down. */
  const litOf = () => p.evaluate(() => ({
    band: document.querySelector('.room-wrap').dataset.lit,
    lit: +document.querySelector('.rm-candles').style.getPropertyValue('--lit')}));
  await p.evaluate(() => { stillness().sessions = []; saveNow(); });
  await room();
  const cold = await litOf();
  is('  a room nobody has sat in burns low', cold.band, 'low');
  await p.evaluate(() => { stillness().sessions = [{date: today(), kind:'breath', actual: 10}]; saveNow(); });
  await room();
  const warm = await litOf();
  is('  sat in today, it burns high', warm.band, 'high');
  yes('  and the flames are taller for it', warm.lit > cold.lit, `${cold.lit} then ${warm.lit}`);
  yes('  the cushion keeps the mark of having been sat on',
    await p.$('.rm-impression') !== null);
  await p.evaluate(() => { stillness().sessions = []; saveNow(); });
  await room();
  yes('  and a cushion nobody has sat on does not', await p.$('.rm-impression') === null);

  /* three days running and something grows beside the cushion */
  await p.evaluate(() => { stillness().sessions = [0,1,2,3].map(i =>
    ({date: addDays(today(), -i), kind:'breath', actual: 10})); saveNow(); });
  await room();
  const leaves = await p.evaluate(() => document.querySelectorAll('.rm-leaf').length);
  is('  four days running puts out a vine with four leaves', leaves, 4);
  await p.evaluate(() => { stillness().sessions = [{date: today(), kind:'breath', actual: 10}]; saveNow(); });
  await room();
  is('  and one day is not a streak, so nothing grows',
    await p.evaluate(() => document.querySelectorAll('.rm-leaf').length), 0);

  /* a system you consulted this morning keeps its light until tomorrow */
  await p.evaluate(() => { S.entries = (S.entries || []).filter(e => e.type !== 'divination');
    S.entries.push({id:'d1', type:'divination', occurredAt: today(),
      extra:{divination:{system:'tarot'}}}); saveNow(); });
  await room();
  const glow = await p.evaluate(() => ({
    tarot: document.querySelector('.obj-tarot').classList.contains('consulted'),
    coins: document.querySelector('.obj-coins').classList.contains('consulted'),
    op: getComputedStyle(document.querySelector('.obj-tarot .obj-aura')).opacity}));
  yes('  the deck you drew from this morning is still lit', glow.tarot);
  yes('    and it is actually painted, not only labelled', +glow.op > .05, glow.op);
  yes('    while the ones you did not reach for are not', !glow.coins);

  console.log('\n4. it costs one paint and then nothing');
  /* the whole point of drawing it in SVG. If anything in here ever asks the
     Animator for frames, the cheapest thing on Today is the most expensive. */
  const loops = await p.evaluate(() => Animator.stats().loops.map(l => l.id));
  yes('  the room has asked for no loop of its own',
    !loops.some(id => /room|sacred|candle/i.test(id)), loops.join(' '));
  const moving = await p.evaluate(() => [...document.querySelectorAll('.room-wrap *')]
    .map(n => ({c: (n.className.baseVal ?? n.className) || n.tagName,
      a: getComputedStyle(n).animationName, t: getComputedStyle(n).transitionProperty}))
    .filter(x => x.a && x.a !== 'none'));
  yes('  and the only thing moving on its own is the candlelight',
    moving.length && moving.every(x => /rmFlame|rmLeaf/.test(x.a)),
    moving.map(x => x.a).join(' ') || 'nothing at all');
  yes('    which is under a dozen elements', moving.length < 12, String(moving.length));
  /* the animations are transform and opacity; nothing here touches layout */
  const props = await p.evaluate(() => {
    const out = new Set();
    for(const sheet of document.styleSheets){
      let rules; try { rules = sheet.cssRules; } catch(e){ continue; }
      for(const r of rules){
        if(r.type !== CSSRule.KEYFRAMES_RULE || !/^rm[A-Z]/.test(r.name)) continue;
        for(const f of r.cssRules) for(const pn of f.style) out.add(pn);
      }
    }
    return [...out];
  });
  yes('  every frame of every keyframe is transform or opacity',
    props.length && props.every(x => /^(transform|opacity)$/.test(x)), props.join(' '));

  console.log('\n5. the tabs are still there, because switching is not a journey');
  await room();
  yes('the row of four is under the room', await p.$('.still-tabs') !== null);
  yes('  and the pane it drives with it', await p.$('.still-pane') !== null);

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(`\nsmoke168  ${bad ? bad + ' FAILED' : 'all good'}`);
  process.exit(bad ? 1 : 0);
})();
