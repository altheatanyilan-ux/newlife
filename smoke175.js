/* smoke175 — the garden turns with the year, and lies about nothing.

   The house already knew the hour: the sky goes from morning to night, the
   moon is at the phase it is actually at. This is the other clock, and the
   garden is the one room where a year shows.

   The thing worth guarding here is not that the tree changes colour. It is
   the line between the two kinds of thing in that garden.

   Four things out there are READINGS. The herbs stand as tall as your health
   values are being kept; the fire keeps its embers while you have been
   writing letters; the chest opens on the artifacts you have made; the tree
   has one branch for every skill. A person can look at the garden and learn
   something true about their own record.

   Everything else means nothing on its own — the colour of the canopy, what
   it is carrying, what has fallen on the ground — and that is exactly what
   the year is allowed to move. A winter that shortened the herbs would be the
   garden telling somebody they had let their health slip when all that had
   happened was December, and a garden that can lie about one thing cannot be
   trusted about any of them.

   So: the year changes what it should, and the readings come back identical
   in all four seasons off the same data. That second half is the test.

   And one trap, which this walked straight into. The app stamps the season on
   the <html> element for the page themes, so a selector written as
   [data-season="autumn"] matches through that ancestor in every room and in
   every season. The garden came out in autumn colours all year round, and it
   was only visible at all because the day it was written was in September. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const ctx = await b.newContext({viewport:{width:1440, height:1000}});
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource|ERR_CERT_AUTHORITY_INVALID/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1900); }
  /* daylight, so a night sky is not the thing being measured */
  await p.evaluate(() => { window.houseHour = () => 'midday'; });
  /* And the document put into a season the stylesheet has no opinion about,
     so that these readings are what the GARDEN looks like. Left alone it says
     whatever month it really is, and then every baseline below is taken under
     the very bug section 5 is trying to catch: on a day in September the
     autumn rules bleed through the <html> element into all four readings, and
     comparing two contaminated numbers agrees perfectly. */
  await p.evaluate(() => { document.documentElement.dataset.season = 'nil'; });

  /* everything the garden is, in one reading */
  const walk = async year => {
    await p.evaluate(s => {
      window.season = () => s;
      S.settings.todayView = 'in';
      S.settings.todayOpen = S.settings.todayOpen || {};
      S.settings.todayOpen['t-sacred'] = true;
      S._houseZone = 'garden'; S.settings.houseZone = 'garden';
      saveNow();
      /* the house is a section on Today now, not a page of its own */
      if(location.hash !== '#/today') location.hash = '#/today'; else rerender();
    }, year);
    await p.waitForFunction(s => {
      const w = document.querySelector('#t-sacred .house-stage .room-wrap');
      return w && w.dataset.season === s; }, year, {timeout: 9000}).catch(() => {});
    await p.waitForTimeout(350);
    return p.evaluate(() => {
      const q = s => [...document.querySelectorAll(s)];
      const d = n => n ? n.getAttribute('d') : null;
      return {
        /* what the year is allowed to move */
        says: document.querySelector('#t-sacred .house-stage .room-wrap').dataset.season,
        canopy: q('.hg-canopy').length,
        canopyFill: q('.hg-canopy')[0] ? getComputedStyle(q('.hg-canopy')[0]).fill : '-',
        bears: q('.hg-blossom')[0]?.dataset.bears || '',
        borne: q('.hg-blossom').length,
        drop: document.querySelector('.hg-litter')?.dataset.drop || '',
        ground: getComputedStyle(document.querySelector('.hg-ground')).fill,
        /* what it is not */
        herbs: q('.hg-herb').length, herbShapes: q('.hg-herb').map(d),
        embers: q('.hg-ember').length, fire: q('.hg-flames').length,
        chest: d(document.querySelector('.hg-chest-lid')),
        branches: q('.hg-branch').length,
        doors: q('.house-room [data-room]').map(n => n.dataset.room).sort()};
    });
  };

  console.log('\n1. the garden knows what month it is');
  const year = {};
  for(const s of SEASONS) year[s] = await walk(s);
  for(const s of SEASONS) is(`  it is ${s} in ${s}`, year[s].says, s);
  yes('the four seasons do not look alike',
    new Set(SEASONS.map(s => `${year[s].canopy}|${year[s].canopyFill}|${year[s].bears}|${year[s].drop}`)).size === 4,
    SEASONS.map(s => `${s}:${year[s].canopyFill}/${year[s].bears || '-'}/${year[s].drop || '-'}`).join(' '));

  console.log('\n2. and the year moves only what means nothing on its own');
  /* the reason this file exists */
  const reading = s => JSON.stringify({herbs: year[s].herbs, herbShapes: year[s].herbShapes,
    embers: year[s].embers, fire: year[s].fire, chest: year[s].chest,
    branches: year[s].branches, doors: year[s].doors});
  const odd = SEASONS.filter(s => reading(s) !== reading('spring'));
  yes('the herbs, the fire, the chest and the branches read the same all year',
    odd.length === 0, odd.join(' '));
  yes('  and they are actually there to be read',
    year.winter.herbs > 0 && year.winter.branches > 0 && year.winter.doors.length >= 3,
    JSON.stringify({herbs: year.winter.herbs, branches: year.winter.branches, doors: year.winter.doors}));

  console.log('\n3. what each season actually does');
  yes('spring blossoms', year.spring.bears === 'blossom' && year.spring.borne > 0);
  yes('  and drops petals', year.spring.drop === 'petal');
  yes('summer bears fruit rather than flowers', year.summer.bears === 'fruit');
  yes('  and a summer garden has nothing lying about in it', year.summer.drop === '');
  yes('autumn carries nothing', year.autumn.bears === '' && year.autumn.borne === 0);
  yes('  and the leaves are on the ground', year.autumn.drop === 'leaf');
  yes('winter has no canopy at all', year.winter.canopy === 0);
  yes('  and a frost instead', year.winter.drop === 'frost');
  yes('  with a colder ground under it', year.winter.ground !== year.summer.ground,
    `${year.winter.ground} vs ${year.summer.ground}`);

  console.log('\n4. bare, the branches have to be the tree');
  /* At their leafed length they are stubs the canopy was hiding, and a trunk
     with a few stubs on it is not a winter tree, it is a broken one. */
  const reach = await p.evaluate(() => {
    const box = n => { const b = n.getBBox(); return Math.max(b.width, b.height); };
    return [...document.querySelectorAll('.hg-branch')].map(box);
  });
  await walk('summer');
  const leafed = await p.evaluate(() => {
    const box = n => { const b = n.getBBox(); return Math.max(b.width, b.height); };
    return [...document.querySelectorAll('.hg-branch')].map(box);
  });
  yes('a bare branch reaches further than a leafed one',
    reach.length === leafed.length && reach.every((v, i) => v > leafed[i] * 1.6),
    `${reach.map(Math.round).join(',')} vs ${leafed.map(Math.round).join(',')}`);

  console.log('\n5. the garden follows its own season, not the document\'s');
  /* The app stamps the season on <html> for the page themes. A season rule
     that is not anchored to the room matches through it, and the garden comes
     out in one season all year. */
  /* The document has to be put into a season that the stylesheet has an
     opinion about, and the garden into one it does not, or there is nothing
     for the bug to bleed through with. Autumn and winter both repaint the
     ground; summer leaves it alone. So: a summer garden in an autumn
     document, which is exactly the shape of the original mistake. */
  await walk('summer');
  await p.evaluate(() => { document.documentElement.dataset.season = 'autumn'; });
  await p.waitForTimeout(200);
  const own = await p.evaluate(() => ({
    html: document.documentElement.dataset.season,
    room: document.querySelector('#t-sacred .house-stage .room-wrap').dataset.season,
    canopy: getComputedStyle(document.querySelector('.hg-canopy')).fill,
    ground: getComputedStyle(document.querySelector('.hg-ground')).fill}));
  is('  the document can say one thing', own.html, 'autumn');
  is('  the garden another', own.room, 'summer');
  yes('  and the garden is the one that decides what the garden looks like',
    own.ground === year.summer.ground && own.canopy === year.summer.canopyFill,
    `${JSON.stringify(own)} — autumn is ${year.autumn.ground} / ${year.autumn.canopyFill}`);

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(`\nsmoke175  ${bad ? bad + ' FAILED' : 'all good'}`);
  process.exit(bad ? 1 : 0);
})();
