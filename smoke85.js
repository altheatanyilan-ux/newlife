/* The Compass batch: the rainbow pyramid with a real apex, the level detail
   moved beside it, the reworked long view, transparent grounds, the select
   chevron that no longer sits on the text, the reveal transform that never
   settled, and the Timeline tab that now hides the stage view's furniture. */
const { chromium } = require('playwright');
const ROUTES = ['#/compass','#/today','#/journals','#/values','#/skills','#/projects','#/finance',
                '#/commonplace','#/people','#/timeline','#/timeline/threads','#/writing','#/settings'];
let fails = 0;
const ok = (n, cond, detail) => { console.log((cond ? '  ok   ' : '  FAIL ') + n + (cond ? '' : '  — ' + detail)); if(!cond) fails++; };

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1400,height:1100});
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(2200);

  const go = async h => { await page.evaluate(x => { location.hash = x; rerender(); }, h);
    await page.waitForTimeout(500);
    await page.evaluate(async () => { const H = document.documentElement.scrollHeight;
      for(let y=0;y<H;y+=600){ window.scrollTo(0,y); await new Promise(r=>setTimeout(r,60)); } window.scrollTo(0,0); });
    await page.waitForTimeout(1200); };

  await go('#/compass');

  console.log('\n1. the pyramid');
  const pyr = await page.evaluate(() => {
    const tiers = Array.from(document.querySelectorAll('.mas-tier'));
    const apex = tiers.find(t => t.querySelector('polygon')?.getAttribute('points').split(' ').length === 3);
    return {n: tiers.length,
      hues: tiers.map(t => t.style.getPropertyValue('--mc')),
      apex: !!apex,
      labels: tiers.map(t => t.querySelector('.mas-lbl')?.textContent.trim()),
      fills: tiers.map(t => +t.querySelector('polygon').getAttribute('fill-opacity'))};
  });
  ok('eight levels', pyr.n === 8, 'saw ' + pyr.n);
  ok('the top row is a triangle, not another slab', pyr.apex, 'no three-point polygon');
  ok('every level has its own colour', new Set(pyr.hues).size === 8, JSON.stringify(pyr.hues));
  ok('the topmost is self-transcendence', /BEYOND/i.test(pyr.labels.join(' ')), JSON.stringify(pyr.labels));
  ok('an unread level is still a visible ghost', pyr.fills.every(f => f > 0), JSON.stringify(pyr.fills));

  console.log('\n2. what the Compass no longer carries');
  const gone = await page.evaluate(() => {
    const txt = Array.from(document.querySelectorAll('.page .sc, .page h1, .page h2, .page h3')).map(n=>n.textContent.toLowerCase()).join(' | ');
    return {txt, spiok: !!document.querySelector('[data-spiok]'), spinote: !!document.querySelector('#spiNote')};
  });
  ok('no Stage resonance', !/stage resonance/.test(gone.txt), gone.txt);
  ok("no Today's focus", !/today.s focus/.test(gone.txt), gone.txt);
  ok('no Gentle prompt', !/gentle prompt/.test(gone.txt), gone.txt);
  ok('no orphaned spiral controls', !gone.spiok && !gone.spinote, 'a [data-spiok] or #spiNote survived');

  console.log('\n3. the level detail sits beside the pyramid');
  const side = await page.evaluate(() => {
    const g = document.querySelector('.pos-grid'); if(!g) return null;
    const p = g.querySelector('.pos-pyr'), s = g.querySelector('.pos-side');
    if(!p || !s) return null;
    return {pl: Math.round(p.getBoundingClientRect().left), sl: Math.round(s.getBoundingClientRect().left),
      pt: Math.round(p.getBoundingClientRect().top), st: Math.round(s.getBoundingClientRect().top),
      legend: s.querySelectorAll('.mas-leg').length};
  });
  ok('a pyramid column and a side column', !!side, 'no .pos-grid with both columns');
  if(side){
    ok('the side sits to the right of the pyramid, not under it', side.sl > side.pl && Math.abs(side.st - side.pt) < 90,
       JSON.stringify(side));
    ok('one legend button per level', side.legend === 8, 'saw ' + side.legend);
  }

  console.log('\n4. the long view');
  const lv = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.bento .card'));
    const rows = {}; cards.forEach(c => { const t = Math.round(c.getBoundingClientRect().top); rows[t] = (rows[t]||0)+1; });
    return {n: cards.length, rows: Object.values(rows),
      keys: cards.map(c => c.querySelector('.k')?.textContent.replace('→','').trim()),
      bg: cards.map(c => getComputedStyle(c).backgroundColor),
      house: getComputedStyle(document.querySelector('.house-wrap')).backgroundColor,
      lefts: [...new Set(cards.filter((_,i)=>i%3===0).map(c => Math.round(c.getBoundingClientRect().left)))]};
  });
  ok('nine readings', lv.n === 9, 'saw ' + lv.n);
  ok('three even rows, no ragged tail', lv.rows.length === 3 && lv.rows.every(r => r === 3), JSON.stringify(lv.rows));
  ok('People and Money are among them', /People/.test(lv.keys.join('|')) && /Money/.test(lv.keys.join('|')), lv.keys.join(' | '));
  ok('every card ground is transparent', lv.bg.every(b => /rgba\(0, 0, 0, 0\)|transparent/.test(b)), JSON.stringify(lv.bg.slice(0,3)));
  ok('the house ground is transparent', /rgba\(0, 0, 0, 0\)|transparent/.test(lv.house), lv.house);
  ok('the first card of each row starts on one left edge', lv.lefts.length === 1, JSON.stringify(lv.lefts));

  console.log('\n5. every select keeps room for its chevron');
  let tight = [];
  for(const r of ROUTES){
    await go(r);
    const bad = await page.evaluate(() => Array.from(document.querySelectorAll('select.sel'))
      .filter(s => s.offsetWidth && parseFloat(getComputedStyle(s).paddingRight) < 20)
      .map(s => (s.className||'') + '::' + (s.getAttribute('data-streamstatus') || s.id || s.name || s.value).toString().slice(0,30)));
    if(bad.length) tight.push(r + ' → ' + bad.join(', '));
  }
  ok('no select paints its text under the arrow', tight.length === 0, tight.join(' ; '));

  console.log('\n6. every page settles on one left edge');
  let off = [];
  for(const r of ROUTES){
    await go(r);
    const bad = await page.evaluate(() => {
      const pg = document.querySelector('.page'); if(!pg) return ['NO PAGE'];
      const head = pg.querySelector('.page-head'); if(!head) return [];
      const base = Math.round(head.getBoundingClientRect().left);
      return Array.from(pg.children).filter(c => {
        const b = c.getBoundingClientRect();
        if(b.width < 4 || b.height < 4) return false;
        if(getComputedStyle(c).position === 'fixed') return false;
        return Math.abs(Math.round(b.left) - base) > 1;
      }).map(c => (c.className||c.tagName).toString().slice(0,32) + '@' + Math.round(c.getBoundingClientRect().left) + ' vs ' + base);
    });
    if(bad.length) off.push(r + ' → ' + bad.join(', '));
  }
  ok('no section drifts from its own page head', off.length === 0, off.join(' ; '));

  console.log('\n7. Threads & Tensions is its own room');
  await go('#/timeline');
  const stageTab = await page.evaluate(() => ({spine: !!document.querySelector('.spine-wrap'), ribbons: !!document.querySelector('#ribbons'),
    felt: !!document.querySelector('#feltToggle'), rib: !!document.querySelector('#ribToggle')}));
  ok('the stage view still has its spine, ribbons and toggles',
     stageTab.spine && stageTab.ribbons && stageTab.felt && stageTab.rib, JSON.stringify(stageTab));
  await go('#/timeline/threads');
  const thrTab = await page.evaluate(() => ({spine: !!document.querySelector('.spine-wrap'), ribbons: !!document.querySelector('#ribbons'),
    felt: !!document.querySelector('#feltToggle'), rib: !!document.querySelector('#ribToggle'),
    threads: !!document.querySelector('#addThread')}));
  ok('the threads tab hides every piece of the stage view',
     !thrTab.spine && !thrTab.ribbons && !thrTab.felt && !thrTab.rib, JSON.stringify(thrTab));
  ok('and still shows the threads themselves', thrTab.threads, 'no #addThread');

  console.log('\n8. nothing threw');
  ok('no page or console errors', errors.length === 0, errors.join(' | '));

  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
