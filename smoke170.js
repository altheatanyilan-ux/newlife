/* smoke170 — the house.

   The rooms of this app are a list in a sidebar. A list is the right shape for
   finding something you can already name, and the wrong shape for the half of
   this that is a practice rather than a task: you do not decide to "open
   Stillness", you go and sit down. So there is a house, and walking through it
   is navigating.

   Four things have to hold or it is a picture of a house rather than a way
   into anything.

   Every object is a door, and the door opens the thing it is a picture of. A
   mirror that does not open the mirror work is scenery.

   Where you are standing is the address. It was a variable first, and the
   route read the zone back out of the hash on every draw — so walking through
   a door set the state, redrew, and put you back where you started. It also
   means a floor of the house can be linked to and survives a reload.

   The sacred room's mechanics survive being grown into a whole floor: the
   candles still burn to how recently you sat, the cushion still keeps its
   impression, the vine still grows with the streak, a deck consulted this
   morning is still lit.

   And it is still one SVG per zone with no loop of its own. The moment the
   house asks for frames, the prettiest thing here is the most expensive. */
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
  const p = await b.newPage({viewport:{width:1340, height:1100}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }

  /* setting the hash you are already on fires nothing, so a redraw after a
     change of data has to be asked for rather than assumed */
  const go = async hash => {
    await p.evaluate(h => { if(location.hash === h) rerender(); else location.hash = h; }, hash);
    await p.waitForTimeout(1000);
  };
  const zone = () => p.evaluate(() => document.querySelector('.house-stage')?.dataset.zone);
  const shut = () => p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  console.log('\n1. there is a house, and it is in the sidebar');
  yes('the sidebar offers it', await p.evaluate(() =>
    [...document.querySelectorAll('.nav a')].some(a => a.getAttribute('href') === '#/house')));
  /* it is offered BESIDE the list, never instead of it */
  yes('  and the list it stands beside is untouched', await p.evaluate(() =>
    ['#/today','#/planning','#/values','#/people','#/skills']
      .every(h => [...document.querySelectorAll('.nav a')].some(a => a.getAttribute('href') === h))));
  await go('#/house/sanctuary');
  is('the sanctuary floor draws', await zone(), 'sanctuary');
  const shape = await p.evaluate(() => { const st = document.querySelector('.house-stage');
    return {svg: st.querySelectorAll('svg').length, canvas: st.querySelectorAll('canvas').length,
      img: st.querySelectorAll('img,image').length}; });
  is('  one svg for the zone', shape.svg, 1);
  is('  no canvas', shape.canvas, 0);
  is('  and no images', shape.img, 0);

  console.log('\n2. every object in it is a door');
  const doors = await p.evaluate(() =>
    [...document.querySelectorAll('.house-room [data-room]')].map(n => n.dataset.room));
  for(const k of ['mirror','blessing','fashion','soundbath','cushion','sanctuary','tarot','iching','oracle','charms'])
    yes(`  you can reach the ${k}`, doors.includes(k), doors.join(' '));
  yes('  and every one of them is reachable from the keyboard', await p.evaluate(() =>
    [...document.querySelectorAll('.house-room [data-room]')]
      .every(n => n.getAttribute('tabindex') === '0' && n.getAttribute('aria-label'))));

  /* a door that does not open the thing it is a picture of is scenery */
  await p.click('.zone-blessing .hs-lowtable'); await p.waitForTimeout(900);
  is('the bowls open the gratitude journal', await p.evaluate(() => location.hash), '#/journals/gratitude');
  await go('#/house/sanctuary');
  await p.click('.zone-mirror .hs-mirror-glass'); await p.waitForTimeout(1200);
  is('the mirror opens the morning theatre, and opens it',
    await p.evaluate(() => location.hash + '|' + !!document.querySelector('#t-theatre')?.open),
    '#/today|true');
  await go('#/house/sanctuary');
  await p.click('.obj-tarot .rm-card-face'); await p.waitForTimeout(1200);
  yes('reaching for the deck opens the tarot', await p.evaluate(() => !!document.querySelector('.overlay')));
  await shut();

  console.log('\n3. where you are standing is the address');
  await go('#/house/sanctuary');
  await p.click('.house-exit[data-hgo="main"]'); await p.waitForTimeout(1200);
  is('walking downstairs puts you downstairs', await zone(), 'main');
  is('  and the address says so', await p.evaluate(() => location.hash), '#/house/main');
  await p.click('.hm-cell[data-hgo="roof"]'); await p.waitForTimeout(1200);
  is('the plan of the house jumps you to a floor', await zone(), 'roof');
  await p.reload(); await p.waitForTimeout(2200);
  is('  and a reload leaves you where you were standing', await zone(), 'roof');
  /* the plan covers no art: it used to sit in the corner, squarely on the
     oracle table, and a control that covers the most important object in the
     room is an obstacle rather than a control */
  const over = await p.evaluate(() => {
    const m = document.querySelector('.house-map'), r = document.querySelector('.room-wrap');
    if(!m || !r) return null;
    const a = m.getBoundingClientRect(), b = r.getBoundingClientRect();
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  });
  is('  and it covers none of the scene', over, false);

  console.log('\n4. the sacred room survives being grown into a floor');
  await p.evaluate(() => { stillness().sessions = []; saveNow(); });
  await go('#/house/sanctuary');
  const cold = await p.evaluate(() => document.querySelector('.room-wrap').dataset.lit);
  is('  a floor nobody has sat on burns low', cold, 'low');
  yes('    and the cushion carries no mark', await p.$('.rm-impression') === null);
  await p.evaluate(() => { stillness().sessions = [0,1,2,3].map(i =>
    ({date: addDays(today(), -i), kind:'breath', actual:12})); saveNow(); });
  await go('#/house/sanctuary');
  is('  sat in today, it burns high',
    await p.evaluate(() => document.querySelector('.room-wrap').dataset.lit), 'high');
  yes('    the cushion keeps its mark', await p.$('.rm-impression') !== null);
  is('    and four days running is four leaves',
    await p.evaluate(() => document.querySelectorAll('.rm-leaf').length), 4);
  await p.evaluate(() => { S.entries = (S.entries||[]).filter(e => e.type !== 'divination');
    S.entries.push({id:'d1', type:'divination', occurredAt: today(), extra:{divination:{system:'oracle'}}});
    saveNow(); });
  await go('#/house/sanctuary');
  is('    and the deck you drew from this morning is still lit',
    await p.evaluate(() => ({oracle: document.querySelector('.obj-oracle').classList.contains('consulted'),
      tarot: document.querySelector('.obj-tarot').classList.contains('consulted')})),
    {oracle: true, tarot: false});

  console.log('\n5. it costs one paint and then nothing');
  const loops = await p.evaluate(() => Animator.stats().loops.map(l => l.id));
  yes('  the house asks for no loop of its own',
    !loops.some(id => /house|sanct|zone/i.test(id)), loops.join(' '));
  const moving = await p.evaluate(() => [...document.querySelectorAll('.house-stage *')]
    .map(n => getComputedStyle(n).animationName).filter(a => a && a !== 'none'));
  yes('  and only the candlelight and the vine move on their own',
    moving.every(a => /rmFlame|rmLeaf/.test(a)), moving.join(' ') || 'nothing at all');
  yes('    which is under a dozen elements', moving.length < 12, String(moving.length));

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(`\nsmoke170  ${bad ? bad + ' FAILED' : 'all good'}`);
  process.exit(bad ? 1 : 0);
})();
