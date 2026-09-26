/* Banners that bloom instead of growing — flowers only, and only where the
   words are not — plus Money in your own words moved to the top of Finance.

   Since this was written the flowers have been taken off. Not moved, not
   restyled: `.ph-plant{display:none!important}` in the block of the stylesheet
   headed WHAT THE HOUSE DOES NOT DRAW, which exists so that the answer to "why
   is this not drawn" is one place. They were a hundred small animated things,
   each on its own element, each recalculated when anything near them moved,
   and the performance work took every ornament of that kind off for everybody.

   The section below used to check where each flower sat. Three of its four
   checks went on passing after the flowers stopped being drawn, because an
   element with no layout has a zero-size rect at the origin: a rect that size
   overlaps no word, so "no flower touches a word" passed vacuously, and eleven
   blooms still counted as eleven, so "every banner carries flowers" passed on
   a count of things nobody can see. Only "no flower is cut off by the banner
   edge" noticed, and it reported the wrong thing — it said the flowers were
   spilling when what was true is that there were no flowers.

   So it asks what is actually true now: the layer is still built, and it is
   not drawn. */
const { chromium } = require('playwright');
/* Seven rooms had their banner taken off them — Planning, Content Studio,
   Projects, Finance, Skill Tree, Values and People — so there is nothing left
   there to bloom. These are the ones that still open with one. */
/* #/compass is not among them: the Compass became the Review, a view of Today with no banner */
const ROUTES = ['#/journals','#/commonplace','#/timeline','#/settings'];
/* and these must have no banner at all, nor anything that grew on it */
const BARE = ['#/planning','#/writing','#/projects','#/finance','#/skills','#/values','#/people'];
let fails = 0;
const ok = (n, cond, detail) => { console.log((cond ? '  ok   ' : '  FAIL ') + n + (cond ? '' : '  — ' + detail)); if(!cond) fails++; };

/* The WORDS measurement lived here — every line box of text and every control
   in the banner, so that a flower could be checked against them. It went with
   the sections that used it. */

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1400,height:1000});
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION|ERR_CERT_AUTHORITY_INVALID/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  /* A fresh profile is asked about theme and sound before anything else, and
     the rest of boot waits behind that dialog. Take the defaults and get on
     with it, the way a first-time user would. */
  await page.waitForTimeout(900);
  if(await page.$('#frGo')){ await page.click('#frGo'); await page.waitForTimeout(1800); }

  await page.waitForTimeout(2200);
  const go = async h => { await page.evaluate(x => { location.hash = x; rerender(); }, h); await page.waitForTimeout(1500); };

  console.log('\n1. the banner is bare, on purpose');
  const drawn = [], missingLayer = [];
  for(const r of ROUTES){
    await go(r);
    const m = await page.evaluate(() => {
      const h = document.querySelector('.page-head'); if(!h) return null;
      const plant = h.querySelector('.ph-plant'); if(!plant) return {none:true};
      const cs = getComputedStyle(plant);
      return {n: plant.querySelectorAll('.ph-bloom').length, display: cs.display,
        /* an element with no layout has a zero rect, which is the only honest
           way to ask whether something is on the screen */
        painted: plant.getClientRects().length > 0};
    });
    if(!m || m.none){ missingLayer.push(r); continue; }
    if(m.display !== 'none' || m.painted) drawn.push(r + ' → ' + JSON.stringify(m));
  }
  ok('the pages that still open with a banner still build the layer',
     missingLayer.length === 0, missingLayer.join(' ; '));
  ok('and not one of them draws it', drawn.length === 0, drawn.join(' ; '));

  const stray = [];
  for(const r of BARE){
    await go(r);
    const m = await page.evaluate(() => ({head: !!document.querySelector('#main .page-head'),
      plant: document.querySelectorAll('#main .ph-plant, #main .ph-bloom').length}));
    if(m.head || m.plant) stray.push(r + ' → ' + JSON.stringify(m));
  }
  ok('and the rooms that lost their banner kept nothing of it', stray.length === 0, stray.join(' ; '));

  /* Sections 2 and 3 were here: that a settled flower does not drift, and
     that a title wrapping at 620px pushes the flowers aside rather than under
     itself. Both were measuring the flowers, and both went on passing after
     the flowers stopped being drawn — an element with no layout does not drift
     and does not overlap anything. There is no subject left to test, and a
     check that cannot fail is worse than no check, so they are gone rather
     than rewritten. Section 1 records what replaced them. */

  console.log('\n4. the banner does not swallow clicks meant for the head');
  await go('#/journals');
  const blocked = await page.evaluate(() => Array.from(document.querySelectorAll('.page-head button'))
    .map(b => { const r = b.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
      return (top === b || b.contains(top)) ? null : b.textContent.trim().slice(0,16); }).filter(Boolean));
  ok('every control in the banner is still hittable', blocked.length === 0, blocked.join(', '));

  console.log('\n5. Finance: money in your own words, at the top');
  await go('#/finance');
  const fin = await page.evaluate(() => ({
    order: Array.from(document.querySelectorAll('.page > section, .page > details')).map(n => n.querySelector('.sc')?.textContent.trim()),
    isDetails: document.querySelector('#finWords')?.tagName === 'DETAILS',
    open: document.querySelector('#finWords')?.open}));
  ok('it is the first section on the page', fin.order[0] === 'Money, in your own words', JSON.stringify(fin.order));
  ok('the other three still follow it',
     JSON.stringify(fin.order.slice(1)) === JSON.stringify(['Income streams','The life you want to fund','The gap — structural tension, made visible']),
     JSON.stringify(fin.order));
  ok('it is still a toggle, and still closed to begin with', fin.isDetails && fin.open === false, JSON.stringify(fin));

  const toggles = await page.evaluate(async () => {
    const d = document.querySelector('#finWords');
    d.querySelector('summary').click(); await new Promise(r => setTimeout(r, 200));
    const opened = d.open;
    rerender(); await new Promise(r => setTimeout(r, 400));
    const kept = document.querySelector('#finWords').open;
    document.querySelector('#finWords summary').click(); await new Promise(r => setTimeout(r, 200));
    rerender(); await new Promise(r => setTimeout(r, 400));
    return {opened, kept, closedAgain: document.querySelector('#finWords').open};
  });
  ok('opening it works, and a rerender does not shut it',
     toggles.opened && toggles.kept && toggles.closedAgain === false, JSON.stringify(toggles));

  console.log('\n6. nothing threw');
  ok('no page or console errors', errors.length === 0, errors.join(' | '));

  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
