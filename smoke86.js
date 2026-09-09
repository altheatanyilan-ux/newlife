/* Banners that bloom instead of growing — flowers only, and only where the
   words are not — plus Money in your own words moved to the top of Finance. */
const { chromium } = require('playwright');
const ROUTES = ['#/compass','#/journals','#/values','#/skills','#/projects','#/finance',
                '#/commonplace','#/people','#/timeline','#/writing','#/settings'];
let fails = 0;
const ok = (n, cond, detail) => { console.log((cond ? '  ok   ' : '  FAIL ') + n + (cond ? '' : '  — ' + detail)); if(!cond) fails++; };

/* the same measurement the page itself makes, redone independently here: every
   line box of text and every control in the banner */
const WORDS = () => {
  const h = document.querySelector('.page-head'); if(!h) return null;
  const plant = h.querySelector('.ph-plant'); if(!plant) return {none:true};
  const rects = []; const add = r => { if(r.width > 1 && r.height > 1) rects.push(r); };
  const w = document.createTreeWalker(h, NodeFilter.SHOW_TEXT,
    {acceptNode: n => (n.nodeValue.trim() && !plant.contains(n)) ? 1 : 2});
  const range = document.createRange(); let n;
  while((n = w.nextNode())){ range.selectNodeContents(n); Array.from(range.getClientRects()).forEach(add); }
  h.querySelectorAll('button,input,select,textarea,a,svg,img,.toggle,.btn')
    .forEach(e => { if(!plant.contains(e)) add(e.getBoundingClientRect()); });
  const hb = h.getBoundingClientRect();
  const blooms = Array.from(plant.querySelectorAll('.ph-bloom'));
  const hit = blooms.filter(b => { const r = b.getBoundingClientRect();
    return rects.some(t => r.right > t.left && r.left < t.right && r.bottom > t.top && r.top < t.bottom); });
  const spill = blooms.filter(b => { const r = b.getBoundingClientRect();
    return r.left < hb.left - .5 || r.right > hb.right + .5 || r.top < hb.top - .5 || r.bottom > hb.bottom + .5; });
  return {n: blooms.length, hit: hit.length, spill: spill.length, words: rects.length,
          stems: plant.querySelectorAll('.bp-stem, .bp-leaf, path[class*="stem"]').length};
};

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1400,height:1000});
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(2200);
  const go = async h => { await page.evaluate(x => { location.hash = x; rerender(); }, h); await page.waitForTimeout(1500); };

  console.log('\n1. every banner blooms, and nothing lands on a word');
  const bare = [], onWords = [], spilling = [], stemmed = [];
  for(const r of ROUTES){
    await go(r);
    const m = await page.evaluate(WORDS);
    if(!m || m.none){ bare.push(r + ' (no flower layer)'); continue; }
    if(m.n < 3) bare.push(r + ' → only ' + m.n);
    if(m.hit) onWords.push(r + ' → ' + m.hit + ' of ' + m.n);
    if(m.spill) spilling.push(r + ' → ' + m.spill);
    if(m.stems) stemmed.push(r + ' → ' + m.stems);
  }
  ok('every banner carries flowers', bare.length === 0, bare.join(' ; '));
  ok('no flower touches a word or a control', onWords.length === 0, onWords.join(' ; '));
  ok('no flower is cut off by the banner edge', spilling.length === 0, spilling.join(' ; '));
  ok('no stems and no leaves are left anywhere', stemmed.length === 0, stemmed.join(' ; '));

  console.log('\n2. nothing travels: a flower opens where it is and stays there');
  await go('#/values');
  const travel = await page.evaluate(async () => {
    const b = document.querySelector('.ph-bloom'); if(!b) return null;
    const at = () => { const r = b.getBoundingClientRect(); return {x: r.left + r.width/2, y: r.top + r.height/2, w: r.width}; };
    const a = at();
    await new Promise(r => setTimeout(r, 2600));
    const c = at();
    return {dx: Math.abs(c.x - a.x), dy: Math.abs(c.y - a.y), dw: Math.abs(c.w - a.w)};
  });
  ok('a settled flower drifts by a couple of pixels at most',
     travel && travel.dx < 4 && travel.dy < 4 && travel.dw < 5, JSON.stringify(travel));

  console.log('\n3. a wrapped title pushes the flowers out rather than under itself');
  await page.setViewportSize({width:620,height:900});
  await page.waitForTimeout(900);
  const narrow = [];
  for(const r of ['#/compass','#/people','#/projects','#/timeline']){
    await go(r);
    const m = await page.evaluate(WORDS);
    if(m && !m.none && m.hit) narrow.push(r + ' → ' + m.hit);
  }
  ok('still nothing on the words at 620px', narrow.length === 0, narrow.join(' ; '));
  await page.setViewportSize({width:1400,height:1000});
  await page.waitForTimeout(600);

  console.log('\n4. the banner does not swallow clicks meant for the head');
  await go('#/people');
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
