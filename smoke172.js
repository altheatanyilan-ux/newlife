/* smoke172 — the house as a room rather than a picture of one.

   The zones were flat scenes: a wall rectangle, a floor rectangle, and
   everything standing on the line between them. They are rooms now — a floor
   plane you look down onto, a wall standing behind it, and every object
   standing up off the floor at its own depth with its own shadow. CSS 3D
   only: no WebGL, no library, nothing fetched.

   The art did not change, and that is the point of how it is built. Each
   object group is lifted out of the flat drawing by its own bounding box and
   put down at a depth taken from where it already sat in the composition —
   things drawn higher up were always meant to be further back. No coordinate
   is hand-measured, so the rooms cannot drift out of step with the drawing.

   Four things have to keep holding.

   Everything that was in the flat scene is still in the room. Lifting only
   the zones once dropped the candles on the floor, which are not decoration:
   they are how recently you sat down.

   Nothing is lost behind the wall. A billboard leans back to face the camera,
   so the taller it is the further its top reaches into the room behind it —
   which is how the bookshelf ended up painted behind the wall it hangs on.
   The room has a porch for that, and the backdrop is painted ON the wall
   rather than stood in front of it.

   The labels are on the glass. In the art they lie flat on the floor and
   shear with it, and they are the one thing here that has to be read.

   And the camera writes to one element. Counter-rotating thirty billboards on
   every pointer frame is the same mistake, in a new costume, as the custom
   property on the root element that made this house lag in the first place. */
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
    p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
    await p.goto(FILE); await p.waitForTimeout(1000);
    if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1900); }
    return p;
  };
  /* wait for the room to actually be there rather than guessing at a delay:
     the zone is redrawn on a hash change and then built on the next frame */
  const go = async (p, zone) => {
    await p.evaluate(z => {
      if(location.hash === '#/house/' + z) rerender(); else location.hash = '#/house/' + z; }, zone);
    await p.waitForFunction(z => {
      const st = document.querySelector('.house-stage');
      return st && st.dataset.zone === z && (st.querySelector('.h3-room') || st.querySelector('svg.sacred-room'));
    }, zone, {timeout: 8000}).catch(() => {});
    await p.waitForTimeout(500);
  };

  let p = await open();

  console.log('\n1. it is a room, built out of the drawing');
  await go(p, 'main');
  const room = await p.evaluate(() => {
    const r = document.querySelector('.h3-room'); if(!r) return null;
    return {objs: r.querySelectorAll('.h3-obj').length,
      floors: r.querySelectorAll('.h3-floor').length,
      walls: r.querySelectorAll('.h3-wall, .h3-horizon').length,
      backdrop: r.querySelectorAll('.h3-backdrop').length,
      shadows: r.querySelectorAll('.h3-shadow').length,
      flat: r.querySelectorAll('svg.sacred-room').length};
  });
  yes('the room is built', room !== null);
  yes('  with a floor and a wall', room && room.floors === 1 && room.walls === 1,
    room && `${room.floors} floors, ${room.walls} walls`);
  yes('  every object standing up on its own', room && room.objs >= 6, room && String(room.objs));
  is('  each with a shadow under it', room && room.shadows, room && room.objs);
  is('  and the flat scene is gone, not merely covered', room && room.flat, 0);
  /* the backdrop is painted ON the wall, not stood in front of it */
  is('  the backdrop belongs to the wall', await p.evaluate(() =>
    document.querySelector('.h3-backdrop')?.parentElement?.className), 'h3-wall h3-wall-back');

  console.log('\n2. nothing the drawing had is missing from the room');
  /* the candles are not a zone, and they are not decoration either: they are
     how recently you sat down */
  await p.evaluate(() => { stillness().sessions = [{date: today(), kind:'breath', actual: 12}]; saveNow(); });
  await go(p, 'sanctuary');
  yes('the candles came up with everything else',
    await p.evaluate(() => document.querySelectorAll('.h3-room .rm-candles').length) === 1);
  is('  and they still burn to when you last sat',
    await p.evaluate(() => document.querySelector('.room-wrap').dataset.lit), 'high');
  /* every door the flat scene had, the room still has */
  const doors = await p.evaluate(() =>
    [...document.querySelectorAll('.h3-room [data-room]')].map(n => n.dataset.room).sort());
  for(const k of ['mirror','blessing','fashion','soundbath','cushion','sanctuary','tarot','iching','oracle','charms'])
    yes(`  the ${k} is still a door`, doors.includes(k), doors.join(' '));

  console.log('\n3. nothing is lost behind the wall');
  await go(p, 'main');
  /* Every object has to be somewhere a person could see it. A billboard that
     leans back into the wall gets painted behind it and simply vanishes, which
     is what happened to the bookshelf and the noticeboard. */
  const seen = await p.evaluate(() => {
    const host = document.querySelector('.house-room').getBoundingClientRect();
    return [...document.querySelectorAll('.h3-obj')].map(n => {
      const r = n.getBoundingClientRect();
      const g = n.querySelector('[data-room]');
      return {what: (g && g.dataset.room) || '?',
        inside: r.width > 4 && r.height > 4 && r.bottom > host.top && r.top < host.bottom};
    });
  });
  yes('every object is somewhere you could look at it',
    seen.every(s => s.inside), seen.filter(s => !s.inside).map(s => s.what).join(' ') || 'all of them');
  /* outside, what would be on a wall is in the sky */
  await go(p, 'roof');
  yes('on the roof the values are in the sky, not on the decking',
    await p.evaluate(() => !!document.querySelector('.h3-backdrop .zone-sky')));
  yes('  and so are the people', await p.evaluate(() => !!document.querySelector('.h3-backdrop .zone-stars')));

  console.log('\n4. the labels are on the glass');
  await go(p, 'main');
  yes('the drawn labels are not shown flat on the floor', await p.evaluate(() =>
    [...document.querySelectorAll('.h3-room .rm-say')].every(n => getComputedStyle(n).opacity === '0')));
  const piano = await p.evaluate(() => { const n = document.querySelector('.h3-obj [data-room="piano"]');
    if(!n) return null;
    const r = n.closest('.h3-obj').getBoundingClientRect();
    return {x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2)}; });
  yes('the piano is in the room to be reached for', piano !== null);
  if(!piano){ console.log('\nsmoke172  ' + (bad + 1) + ' FAILED'); await b.close(); process.exit(1); }
  await p.mouse.move(piano.x, piano.y); await p.waitForTimeout(350);
  const said = await p.evaluate(() => { const t = document.querySelector('.h3-say');
    return t && {on: t.classList.contains('on'), text: t.textContent,
      square: getComputedStyle(t).transform}; });
  yes('reaching for the piano says what it is', said && said.on && /beautiful/.test(said.text),
    said && said.text);
  yes('  square on the glass rather than sheared with the floor',
    said && !/matrix3d/.test(said.square), said && said.square);

  console.log('\n5. the camera writes to one element');
  const writes = await p.evaluate(async () => {
    const st = document.querySelector('.h3-scene');
    const touched = new Set();
    const seen2 = [];
    /* watch what the pointer actually changes */
    const obs = new MutationObserver(ms => ms.forEach(m => {
      touched.add(m.target === st ? 'scene' : (m.target.className || m.target.nodeName));
      seen2.push(1);
    }));
    obs.observe(document.querySelector('.h3-room'),
      {attributes:true, subtree:true, attributeFilter:['style','transform']});
    for(let i = 0; i < 24; i++){
      dispatchEvent(new PointerEvent('pointermove', {clientX: 300 + i * 20, clientY: 400 + i * 8}));
      await new Promise(r => requestAnimationFrame(r));
    }
    await new Promise(r => setTimeout(r, 120));
    obs.disconnect();
    return {targets: [...touched], n: seen2.length};
  });
  is('  a pointer sweep writes to the scene and nothing else', writes.targets, ['scene']);
  yes('    once a frame, not once an object', writes.n <= 30, String(writes.n));
  await p.close();

  console.log('\n6. and when a room cannot be a room, the house still opens');
  /* A machine that measurably cannot keep up gets the flat scene. Measuring
     it here would be measuring this machine, which proves nothing about
     anybody else's, so the verdict is set by hand and the consequence of it
     is what gets checked. */
  p = await open();
  await go(p, 'main');
  yes('a room is built on a machine that can manage one',
    await p.evaluate(() => !!document.querySelector('.h3-room')));
  yes('  and the house knows how to give up on one', await p.evaluate(() =>
    typeof House3D.slow === 'boolean'));
  await p.evaluate(() => { House3D.slow = true; rerender(); }); await p.waitForTimeout(800);
  yes('  and a machine that cannot gets the flat scene instead',
    await p.evaluate(() => !document.querySelector('.h3-room') && !!document.querySelector('svg.sacred-room')));
  yes('    with every door still working there', await p.evaluate(() =>
    [...document.querySelectorAll('.house-room [data-room]')].length >= 6));
  await p.close();

  p = await open({reducedMotion: 'reduce'});
  await go(p, 'main');
  yes('less motion asked for keeps the flat scene',
    await p.evaluate(() => !document.querySelector('.h3-room') && !!document.querySelector('svg.sacred-room')));
  yes('  and every door still works there', await p.evaluate(() =>
    [...document.querySelectorAll('.house-room [data-room]')].length >= 6));
  await p.close();
  p = await open({viewport:{width:720, height:900}, hasTouch:true, isMobile:true});
  await go(p, 'main');
  yes('a phone gets the flat scene too',
    await p.evaluate(() => !document.querySelector('.h3-room') && !!document.querySelector('svg.sacred-room')));
  await p.close();

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(`\nsmoke172  ${bad ? bad + ' FAILED' : 'all good'}`);
  process.exit(bad ? 1 : 0);
})();
