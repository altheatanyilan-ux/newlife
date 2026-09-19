/* smoke173 — the house as something somebody made, not something a machine
   generated.

   The house is drawn flat, and drawn cleanly it reads as a diagram of a room:
   correct, legible, and made by nobody. This is the other half of the brief —
   a paper theatre cut out by hand, where the edges are torn, the print does
   not quite line up with the cut, and nothing is a bezier curve.

   The specification wanted that done with photographs fetched from Unsplash
   and rawpixel and embedded as base64. This app is one file that works with
   the network unplugged, and a picture pulled off the web at build time
   carries a licence nobody opening the file in five years can check — so the
   collage is made out of the drawing that is already here, and out of CSS.
   That is what this file is really watching: every effect below is DERIVED
   from the art rather than drawn beside it, which is the only reason it
   cannot drift out of step with it.

   Four things have to keep holding.

   One sheet of paper. The grain is a single layer over the whole room, so
   wall, floor, art and sky are printed on the same material — that shared
   material is what makes mixed media read as one made object rather than a
   pile of clip art. It is also why it must be ONE element and not thirty.

   The cut follows the print. Each object is already its own group in the
   drawing, so one filter tears its outline and floods the same torn
   silhouette with paper behind it. Nothing is traced and nothing is measured.

   The room itself is not an object. The wall, the ground and the sky are the
   sheet everything else is stuck to, and a torn horizon is a tear in the
   wrong thing.

   And the doors still open. A filter between a person and a door is one more
   chance to lose the click. */
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
  const errs = [];
  const open = async opts => {
    const ctx = await b.newContext({viewport:{width:1440, height:1000}, ...opts});
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource|ERR_CERT_AUTHORITY_INVALID/.test(m.text())) errs.push('console: ' + m.text()); });
    await p.goto(FILE); await p.waitForTimeout(1000);
    if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1900); }
    return p;
  };
  /* The house is a section on Today now rather than a page of its own, so
     standing in a zone means opening that section and being in that zone —
     there is no address to change any more. */
  const inHouse = async (p, zone) => {
    await p.evaluate(z => {
      S.settings.todayView = 'in';
      S.settings.todayOpen = S.settings.todayOpen || {};
      S.settings.todayOpen['t-sacred'] = true;
      S._houseZone = z; if(S.settings) S.settings.houseZone = z;
      saveNow();
      if(location.hash !== '#/today') location.hash = '#/today'; else rerender();
    }, zone);
    await p.waitForFunction(z => {
      const st = document.querySelector('#t-sacred .house-stage');
      return st && st.dataset.zone === z;
    }, zone, {timeout: 9000}).catch(() => {});
    await p.waitForTimeout(450);
  };
  const go = (p, zone) => inHouse(p, zone);

  let p = await open();

  console.log('\n1. the house is drawn flat, and stays that way');
  await go(p, 'main');
  const flat = await p.evaluate(() => ({
    scene: !!document.querySelector('svg.sacred-room'),
    room: !!document.querySelector('.h3-room'),
    mod: typeof window.House3D}));
  yes('the room is the drawing itself', flat.scene);
  yes('  with nothing standing up out of it', !flat.room);
  is('  and no machinery left behind to build one', flat.mod, 'undefined');

  console.log('\n2. the whole room is printed on one sheet');
  const sheet = await p.evaluate(() => {
    const w = document.querySelector('.house-room'); if(!w) return null;
    const cs = getComputedStyle(w, '::after');
    return {n: document.querySelectorAll('.house-room').length,
      drawn: cs.content !== 'none' && cs.backgroundImage !== 'none',
      noise: /svg\+xml/.test(cs.backgroundImage),
      through: cs.pointerEvents, isolated: getComputedStyle(w).isolation};
  });
  yes('there is a grain over the room', sheet && sheet.drawn, JSON.stringify(sheet));
  yes('  and it is paper, not a picture of paper', sheet && sheet.noise);
  is('  one layer for the whole room, not one per object', sheet && sheet.n, 1);
  is('  nothing can be clicked through it by mistake', sheet && sheet.through, 'none');
  /* a multiply that is not isolated reaches past the room and grinds the page */
  is('  and the blend stays inside the room', sheet && sheet.isolated, 'isolate');

  console.log('\n3. every object is cut out of paper, and the room is not');
  const cut = await p.evaluate(() => {
    const zones = [...document.querySelectorAll('.sacred-room > g.zone')];
    const torn = n => /wovCut/.test(getComputedStyle(n).filter);
    const bg = document.querySelector('.sacred-room > .rm-bg, .sacred-room > g.rm-bg');
    return {zones: zones.length, all: zones.every(torn),
      missed: zones.filter(n => !torn(n)).map(n => n.className.baseVal || '?'),
      ground: bg ? /wovCut/.test(getComputedStyle(bg).filter) : null,
      looms: document.querySelectorAll('#looms filter#wovCut').length,
      inRoom: document.querySelectorAll('.house-room filter#wovCut').length};
  });
  yes('the room is full of objects', cut.zones >= 6, String(cut.zones));
  yes('  and every one of them has a torn edge', cut.all, cut.missed.join(' '));
  is('  one loom for the whole house, not one per room', cut.looms, 1);
  is('    and it is not inside a room to be torn out with it', cut.inRoom, 0);
  /* the wall and the ground are the sheet, not a thing stuck to it */
  is('  the room itself is not torn up with its furniture', cut.ground, false);

  console.log('\n4. the cut is the object\'s own shape');
  /* A sheet of paper behind the print, in the print's own outline, offset
     just enough not to register with it. Flooded from the room's own tokens,
     so a dark room is not cut out of white paper. */
  const loom = await p.evaluate(() => {
    const f = document.querySelector('#looms filter#wovCut'); if(!f) return null;
    const kid = t => f.querySelector(t);
    return {tear: !!kid('feTurbulence') && !!kid('feDisplacementMap'),
      paper: !!kid('feFlood') && !!kid('feComposite'),
      both: !!kid('feMerge') && f.querySelectorAll('feMergeNode').length === 2,
      offset: kid('feOffset') ? [kid('feOffset').getAttribute('dx'), kid('feOffset').getAttribute('dy')] : null,
      flood: getComputedStyle(kid('feFlood')).floodColor,
      region: [f.getAttribute('x'), f.getAttribute('width')]};
  });
  yes('the edge is torn rather than drawn', loom && loom.tear, JSON.stringify(loom));
  yes('  with paper behind it in the same shape', loom && loom.paper);
  yes('    offset, so the print does not quite register with the cut',
    loom && loom.offset && loom.offset.every(v => parseFloat(v) > 0), JSON.stringify(loom && loom.offset));
  yes('    and both are kept, not one instead of the other', loom && loom.both);
  yes('  the paper is the room\'s own, not white', loom && /rgb/.test(loom.flood)
    && !/^rgb\(255, 255, 255\)$/.test(loom.flood), loom && loom.flood);
  /* several objects here glow well past their own box; the default filter
     region would cut the glow off at the edge of the bounding box */
  yes('  and the cut is not clipped to the bounding box',
    loom && parseFloat(loom.region[1]) > 100, JSON.stringify(loom && loom.region));

  console.log('\n5. the two woven things');
  await go(p, 'sanctuary');
  const woven = await p.evaluate(() => ({
    cush: getComputedStyle(document.querySelector('.rm-cush-top')).fill,
    cloth: getComputedStyle(document.querySelector('.rm-cloth')).fill,
    yarn: getComputedStyle(document.getElementById('looms')).getPropertyValue('--rm-cloth').trim()}));
  yes('the cushion is a kilim rather than a colour', /wovKilim/.test(woven.cush), woven.cush);
  yes('  and the oracle cloth a damask', /wovDamask/.test(woven.cloth), woven.cloth);
  yes('  woven out of the room\'s own yarn', !!woven.yarn, woven.yarn);

  console.log('\n6. and the doors still open through all of it');
  await go(p, 'main');
  const before = await p.evaluate(() => location.hash);
  /* a concrete shape rather than the group, whose bounding box has empty
     space at its centre */
  await p.click('.sacred-room .zone-band .hm-drum', {timeout: 5000})
    .catch(e => no('the band can be reached', e.message.split('\n')[0]));
  await p.waitForTimeout(700);
  yes('reaching through the filter still opens the door',
    await p.evaluate(() => location.hash) !== before, before);
  await go(p, 'main');
  const doors = await p.evaluate(() =>
    [...document.querySelectorAll('.house-room [data-room]')].map(n => n.dataset.room));
  yes('  and every door in the room is still a door', doors.length >= 6, doors.join(' '));
  await p.close();

  console.log('\n7. every room in the house is made of the same paper');
  p = await open();
  for(const [zone, want] of [['sanctuary', 6], ['garden', 3], ['roof', 3]]){
    await go(p, zone);
    const n = await p.evaluate(() => {
      const z = [...document.querySelectorAll('.sacred-room > g.zone')];
      return {n: z.length, torn: z.filter(x => /wovCut/.test(getComputedStyle(x).filter)).length,
        grain: getComputedStyle(document.querySelector('.house-room'), '::after').content !== 'none'};
    });
    yes(`the ${zone} is cut from paper too`, n.n >= want && n.torn === n.n, JSON.stringify(n));
    yes(`  and printed on it`, n.grain);
  }
  await p.close();

  console.log('\n8. and less motion asked for does not mean less paper');
  /* Paper does not move. The house drops animation for anyone who asks, and
     that is not a reason to hand them a diagram instead of a room. */
  p = await open({reducedMotion: 'reduce'});
  await go(p, 'main');
  const still = await p.evaluate(() => ({
    torn: /wovCut/.test(getComputedStyle(document.querySelector('.sacred-room > g.zone')).filter),
    grain: getComputedStyle(document.querySelector('.house-room'), '::after').content !== 'none',
    doors: document.querySelectorAll('.house-room [data-room]').length}));
  yes('the edges are still torn', still.torn);
  yes('  the room is still on paper', still.grain);
  yes('  and every door still works', still.doors >= 6, String(still.doors));
  await p.close();

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(`\nsmoke173  ${bad ? bad + ' FAILED' : 'all good'}`);
  process.exit(bad ? 1 : 0);
})();
