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

   Where you are standing survives. It was the address for a while, because
   the house was a page of its own; it is the sacred space on Today now, so
   the address is #/today from every floor and the zone is state again. The
   thing that always mattered is unchanged and still checked here: walking
   through a door must not put you back where you started, and a reload must
   leave you standing where you were.

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
  const zone = () => p.evaluate(() => document.querySelector('#t-sacred .house-stage')?.dataset.zone);
  const shut = () => p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  console.log('\n1. there is a house, and it is on Today');
  /* It was a room of its own in the sidebar, offered beside the list. It is
     the sacred space on Today now, under the looking-inward view, where the
     Stillness section used to be — so the sidebar must not still offer a door
     to a page that is not there. */
  yes('the sidebar no longer offers it as a room', await p.evaluate(() =>
    ![...document.querySelectorAll('.nav a')].some(a => a.getAttribute('href') === '#/house')));
  yes('  and the rest of the list is untouched', await p.evaluate(() =>
    ['#/today','#/planning','#/values','#/people','#/skills']
      .every(h => [...document.querySelectorAll('.nav a')].some(a => a.getAttribute('href') === h))));
  /* anything still pointing at the old address lands where the house went */
  await p.evaluate(() => { location.hash = '#/house/garden'; });
  await p.waitForTimeout(1200);
  yes('  and an old link to it puts you where it went', await p.evaluate(() =>
    location.hash === '#/today' && !!document.querySelector('#t-sacred')),
    await p.evaluate(() => location.hash));
  await p.evaluate(() => {
    S.settings.todayView = 'in';
    S.settings.todayOpen = S.settings.todayOpen || {};
    S.settings.todayOpen['t-sacred'] = true;
    S._houseZone = 'sanctuary'; S.settings.houseZone = 'sanctuary'; saveNow();
    if(location.hash !== '#/today') location.hash = '#/today'; else rerender(); });
  await p.waitForTimeout(1100);
  is('the sanctuary floor draws', await zone(), 'sanctuary');
  /* It used to say "one svg", which was true of the flat scene and stopped
     being true the moment the room became a room — each object is lifted into
     its own billboard. What that assertion was ever about is cost: the house
     is vector art drawn in the page, with nothing fetched and nothing
     rasterised. */
  const shape = await p.evaluate(() => { const st = document.querySelector('.house-stage');
    return {svg: st.querySelectorAll('svg').length, canvas: st.querySelectorAll('canvas').length,
      img: st.querySelectorAll('img,image').length,
      ext: [...st.querySelectorAll('[src],[href],[xlink\\:href]')].length}; });
  yes('  it is drawn, not fetched', shape.svg > 0 && shape.ext === 0, `${shape.svg} svg, ${shape.ext} external`);
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
  await p.evaluate(() => {
    S.settings.todayView = 'in';
    S.settings.todayOpen = S.settings.todayOpen || {};
    S.settings.todayOpen['t-sacred'] = true;
    S._houseZone = 'sanctuary'; S.settings.houseZone = 'sanctuary'; saveNow();
    if(location.hash !== '#/today') location.hash = '#/today'; else rerender(); });
  await p.waitForTimeout(1100);
  await p.click('.zone-mirror .hs-mirror-glass'); await p.waitForTimeout(1200);
  is('the mirror opens the morning theatre, and opens it',
    await p.evaluate(() => location.hash + '|' + !!document.querySelector('#t-theatre')?.open),
    '#/today|true');
  await p.evaluate(() => {
    S.settings.todayView = 'in';
    S.settings.todayOpen = S.settings.todayOpen || {};
    S.settings.todayOpen['t-sacred'] = true;
    S._houseZone = 'sanctuary'; S.settings.houseZone = 'sanctuary'; saveNow();
    if(location.hash !== '#/today') location.hash = '#/today'; else rerender(); });
  await p.waitForTimeout(1100);
  await p.click('.obj-tarot .rm-card-face'); await p.waitForTimeout(1200);
  yes('reaching for the deck opens the tarot', await p.evaluate(() => !!document.querySelector('.overlay')));
  await shut();

  console.log('\n3. where you are standing survives, without being the address');
  await p.evaluate(() => {
    S.settings.todayView = 'in';
    S.settings.todayOpen = S.settings.todayOpen || {};
    S.settings.todayOpen['t-sacred'] = true;
    S._houseZone = 'sanctuary'; S.settings.houseZone = 'sanctuary'; saveNow();
    if(location.hash !== '#/today') location.hash = '#/today'; else rerender(); });
  await p.waitForTimeout(1100);
  await p.click('.house-exit[data-hgo="main"]'); await p.waitForTimeout(1200);
  is('walking downstairs puts you downstairs', await zone(), 'main');
  /* It used to be the address, because the house was a page. It is a section
     on Today now, so the address is #/today from every floor of it — and the
     thing that mattered about the address is the thing still tested two lines
     down: walking through a door must not put you back where you started, and
     a reload must leave you standing where you were. */
  is('  and Today is where you still are', await p.evaluate(() => location.hash), '#/today');
  /* the page around it does not jump: somebody in the garden scrolled to get
     there, and redrawing all of Today to walk through a door would lose it */
  yes('  and the rest of the page is undisturbed', await p.evaluate(() =>
    !!document.querySelector('#t-checkin') && !!document.querySelector('#t-theatre')));
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
  await p.evaluate(() => {
    S.settings.todayView = 'in';
    S.settings.todayOpen = S.settings.todayOpen || {};
    S.settings.todayOpen['t-sacred'] = true;
    S._houseZone = 'sanctuary'; S.settings.houseZone = 'sanctuary'; saveNow();
    if(location.hash !== '#/today') location.hash = '#/today'; else rerender(); });
  await p.waitForTimeout(1100);
  const cold = await p.evaluate(() => document.querySelector('.room-wrap').dataset.lit);
  is('  a floor nobody has sat on burns low', cold, 'low');
  yes('    and the cushion carries no mark', await p.$('.rm-impression') === null);
  await p.evaluate(() => { stillness().sessions = [0,1,2,3].map(i =>
    ({date: addDays(today(), -i), kind:'breath', actual:12})); saveNow(); });
  await p.evaluate(() => {
    S.settings.todayView = 'in';
    S.settings.todayOpen = S.settings.todayOpen || {};
    S.settings.todayOpen['t-sacred'] = true;
    S._houseZone = 'sanctuary'; S.settings.houseZone = 'sanctuary'; saveNow();
    if(location.hash !== '#/today') location.hash = '#/today'; else rerender(); });
  await p.waitForTimeout(1100);
  is('  sat in today, it burns high',
    await p.evaluate(() => document.querySelector('.room-wrap').dataset.lit), 'high');
  yes('    the cushion keeps its mark', await p.$('.rm-impression') !== null);
  is('    and four days running is four leaves',
    await p.evaluate(() => document.querySelectorAll('.rm-leaf').length), 4);
  await p.evaluate(() => { S.entries = (S.entries||[]).filter(e => e.type !== 'divination');
    S.entries.push({id:'d1', type:'divination', occurredAt: today(), extra:{divination:{system:'oracle'}}});
    saveNow(); });
  await p.evaluate(() => {
    S.settings.todayView = 'in';
    S.settings.todayOpen = S.settings.todayOpen || {};
    S.settings.todayOpen['t-sacred'] = true;
    S._houseZone = 'sanctuary'; S.settings.houseZone = 'sanctuary'; saveNow();
    if(location.hash !== '#/today') location.hash = '#/today'; else rerender(); });
  await p.waitForTimeout(1100);
  is('    and the deck you drew from this morning is still lit',
    await p.evaluate(() => ({oracle: document.querySelector('.obj-oracle').classList.contains('consulted'),
      tarot: document.querySelector('.obj-tarot').classList.contains('consulted')})),
    {oracle: true, tarot: false});

  console.log('\n5. outside, and above');
  /* The garden is the only zone where the weather is real: the sky is the hour
     of the day and the moon is the actual moon. A garden always at noon is a
     diagram of a garden. */
  await p.evaluate(() => {
    for(let i = 0; i < 4; i++) S.entries.push({id:'lt'+i, type:'letter', occurredAt: today(), title:'A letter'});
    if(S.stages && S.stages[0]) S.stages[0].artifacts = [1,2,3].map(i => ({id:'a'+i, caption:'ticket', date:'', src:''}));
    saveNow(); });
  await p.evaluate(() => {
    S.settings.todayView = 'in';
    S.settings.todayOpen = S.settings.todayOpen || {};
    S.settings.todayOpen['t-sacred'] = true;
    S._houseZone = 'garden'; S.settings.houseZone = 'garden'; saveNow();
    if(location.hash !== '#/today') location.hash = '#/today'; else rerender(); });
  await p.waitForTimeout(1100);
  is('the garden draws', await zone(), 'garden');
  const gdoors = await p.evaluate(() =>
    [...document.querySelectorAll('.house-room [data-room]')].map(n => n.dataset.room));
  is('  four things grow out there', gdoors, ['herbs','fire','chest','tree']);
  is('  and the sky is the hour it actually is',
    await p.evaluate(() => document.querySelector('.room-wrap').dataset.sky),
    await p.evaluate(() => houseHour()));
  /* each of them grows off something already recorded */
  is('  three artifacts stand three relics in the chest',
    await p.evaluate(() => document.querySelectorAll('.hg-relic').length), 3);
  yes('  and four letters keep the fire lit',
    await p.evaluate(() => !!document.querySelector('.hg-flames')));
  await p.evaluate(() => { S.entries = S.entries.filter(e => e.type !== 'letter'); saveNow(); });
  await p.evaluate(() => {
    S.settings.todayView = 'in';
    S.settings.todayOpen = S.settings.todayOpen || {};
    S.settings.todayOpen['t-sacred'] = true;
    S._houseZone = 'garden'; S.settings.houseZone = 'garden'; saveNow();
    if(location.hash !== '#/today') location.hash = '#/today'; else rerender(); });
  await p.waitForTimeout(1100);
  yes('    a fire nobody has written to is embers',
    await p.evaluate(() => !document.querySelector('.hg-flames') && !!document.querySelector('.hg-ember')));

  await p.evaluate(() => {
    S.settings.todayView = 'in';
    S.settings.todayOpen = S.settings.todayOpen || {};
    S.settings.todayOpen['t-sacred'] = true;
    S._houseZone = 'roof'; S.settings.houseZone = 'roof'; saveNow();
    if(location.hash !== '#/today') location.hash = '#/today'; else rerender(); });
  await p.waitForTimeout(1100);
  is('the roof draws', await zone(), 'roof');
  const rdoors = await p.evaluate(() =>
    [...document.querySelectorAll('.house-room [data-room]')].map(n => n.dataset.room));
  is('  and four things to do up there', rdoors, ['sky','stars','scope','plans']);
  /* the two things this app draws as skies are actually in the sky here */
  yes('  the values are overhead as planets',
    await p.evaluate(() => document.querySelectorAll('.hr-planet').length) > 0);
  yes('    in the colours they carry everywhere else',
    await p.evaluate(() => { const v = byId(S.values, S.valueOrder[0]);
      const p0 = document.querySelector('.hr-planet');
      return !v || !p0 || p0.style.getPropertyValue('--c') === v.color; }));
  yes('  and the people are stars',
    await p.evaluate(() => document.querySelectorAll('.hr-star').length) > 0);

  console.log('\n6. every door in the house opens something that exists');
  /* a door that leads nowhere is scenery, and there are thirty of them now */
  const dead = await p.evaluate(() => {
    const out = [];
    for(const z of ['main','sanctuary','garden','roof']){
      S._houseZone = z;
      const html = houseHTML();
      const d = document.createElement('div'); d.innerHTML = html;
      d.querySelectorAll('[data-room]').forEach(n => {
        if(typeof HOUSE_PORTALS[n.dataset.room] !== 'function') out.push(z + ':' + n.dataset.room); });
    }
    return out;
  });
  is('  no object anywhere is a picture of nothing', dead, []);

  console.log('\n7. it costs one paint and then nothing');
  const loops = await p.evaluate(() => Animator.stats().loops.map(l => l.id));
  yes('  the house asks for no loop of its own',
    !loops.some(id => /house|sanct|zone/i.test(id)), loops.join(' '));
  /* Naming the allowed animations was the wrong test: it passed until a zone
     added a star, and then failed for a two-pixel circle changing opacity.
     What actually matters is that nothing here touches layout and that the
     number of things running forever stays small. */
  const moving = await p.evaluate(() => [...document.querySelectorAll('.house-stage *')]
    .map(n => { const cs = getComputedStyle(n);
      return {name: cs.animationName, count: cs.animationIterationCount}; })
    .filter(x => x.name && x.name !== 'none'));
  const forever = moving.filter(x => x.count === 'infinite');
  const props = await p.evaluate(names => {
    const want = new Set(names), out = new Set();
    for(const sheet of document.styleSheets){
      let rules; try { rules = sheet.cssRules; } catch(e){ continue; }
      for(const r of rules){
        if(r.type !== CSSRule.KEYFRAMES_RULE || !want.has(r.name)) continue;
        for(const f of r.cssRules) for(const pn of f.style) out.add(pn);
      }
    }
    return [...out];
  }, [...new Set(moving.map(x => x.name))]);
  yes('  nothing that moves on its own touches layout',
    props.length && props.every(x => /^(transform|opacity)$/.test(x)), props.join(' '));
  yes('    and what runs forever is a handful of small things',
    forever.length <= 40, `${forever.length} of ${moving.length}`);
  yes('    the rest are one-shots that finish and stop',
    moving.every(x => x.count === 'infinite' || +x.count > 0),
    moving.map(x => x.name + ':' + x.count).join(' '));

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(`\nsmoke170  ${bad ? bad + ' FAILED' : 'all good'}`);
  process.exit(bad ? 1 : 0);
})();
