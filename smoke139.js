/* smoke139 — the Content Studio pipeline: columns wide enough to read, and
   each one's width dragged and remembered */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('/home/user/newlife/index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1500, height:1000}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const go = async () => { await p.evaluate(() => { if(location.hash === '#/content') rerender(); else location.hash = '#/content'; });
    await p.waitForTimeout(1600); await p.evaluate(() => document.querySelectorAll('.toast').forEach(n => n.remove())); };
  await p.evaluate(() => { if(S.settings.ctColW) delete S.settings.ctColW; });
  await go();

  console.log('\n1. a column is wide enough to read a card in');
  const w = await p.$$eval('.ct-col', n => n.map(x => Math.round(x.getBoundingClientRect().width)));
  is('every column starts at the same width', new Set(w).size, 1);
  yes('  and that width is a readable one', w[0] >= 230, w[0] + 'px');
  is('  all eight are there', w.length, 8);
  /* the board scrolls sideways instead of squeezing eight columns into a laptop */
  yes('the board scrolls rather than squeezing',
      await p.evaluate(() => { const el = document.querySelector('.ct-board');
        return el.scrollWidth > el.clientWidth && getComputedStyle(el).overflowX === 'auto'; }));
  /* a card title that used to break over four lines fits in two */
  yes('  a card title is no longer a column of single words',
      await p.evaluate(() => [...document.querySelectorAll('.ct-title')].every(t =>
        t.getBoundingClientRect().height <= 4 * parseFloat(getComputedStyle(t).lineHeight) + 2)));

  console.log('\n2. each column has its own handle');
  is('one grip per column', await p.$$eval('[data-ctgrip]', n => n.length), 8);
  is('  reachable from the keyboard', await p.evaluate(() =>
    document.querySelector('[data-ctgrip]').getAttribute('tabindex')), '0');

  console.log('\n3. dragging one widens that column and no other');
  const grip = await p.$('[data-ctgrip="seed"]');
  const box = await grip.boundingBox();
  await p.mouse.move(box.x + box.width/2, box.y + box.height/2);
  await p.mouse.down();
  await p.mouse.move(box.x + box.width/2 + 140, box.y + box.height/2, {steps:8});
  await p.mouse.up();
  await p.waitForTimeout(500);
  const w2 = await p.$$eval('.ct-col', n => n.map(x => Math.round(x.getBoundingClientRect().width)));
  yes('the dragged one grew by about what was dragged', Math.abs(w2[1] - (w[1] + 140)) <= 4, `${w[1]} → ${w2[1]}`);
  yes('  and the rest are untouched', w2.filter((x,i) => i !== 1).every(x => x === w[0]), JSON.stringify(w2));
  is('  it is written down', await p.evaluate(() => S.settings.ctColW?.seed), w2[1]);
  await go();
  is('  and survives a redraw', await p.$$eval('.ct-col', n => Math.round(n[1].getBoundingClientRect().width)), w2[1]);

  console.log('\n4. it cannot be dragged to nothing, or off the page');
  await p.evaluate(() => { ctSetColWidth('idea', 10); ctSetColWidth('draft', 5000); saveNow(); }); await go();
  const w3 = await p.$$eval('.ct-col', n => n.map(x => Math.round(x.getBoundingClientRect().width)));
  yes('a column has a floor', w3[0] >= 150, w3[0] + 'px');
  yes('  and a ceiling', w3[3] <= 620, w3[3] + 'px');

  console.log('\n5. a double-click puts one back');
  await p.evaluate(() => document.querySelector('[data-ctgrip="seed"]').dispatchEvent(new MouseEvent('dblclick', {bubbles:true})));
  await p.waitForTimeout(400);
  is('back to the default', await p.evaluate(() => S.settings.ctColW.seed), 248);

  console.log('\n6. a card can still be dragged between columns');
  const moved = await p.evaluate(() => {
    const card = document.querySelector('[data-ctcard]'); const id = card.dataset.ctcard;
    const from = contentPiece(id).extra.content.stage;
    window._ctDrag = id;
    const col = document.querySelector('[data-ctcol="ready"]');
    col.dispatchEvent(new Event('drop', {bubbles:true, cancelable:true}));
    return {from, to: contentPiece(id).extra.content.stage};
  });
  is('dropping it still changes its stage', moved.to, 'ready');

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke139  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
