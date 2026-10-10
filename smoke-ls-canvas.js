/* smoke-ls-canvas — the Learning Studio's canvas: keywords can be made, dragged, undone, kept; arrows are drawn; the board's own keys are its own.
   Run: NODE_PATH=node_modules node smoke-ls-canvas.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1400, height: 900}})).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept('typed'));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  await p.evaluate(() => { document.querySelectorAll('.toast,.overlay').forEach(n => n.remove());
    const r = treeSavePage({title: 'How memory works', kind: 'root'}).node; treeSavePage({title: 'Encoding', kind: 'branch', parentId: r.id}); saveNow(); location.hash = '#/studio'; });
  await p.waitForTimeout(1200);
  console.log('\n1. a board, and keywords on it');
  await p.evaluate(() => document.querySelector('.ls-pick-branch').click()); await p.waitForTimeout(1200);
  const box = await (await p.$('.ls-canvas-root')).boundingBox();
  for(const [i, t] of ['Alpha', 'Beta', 'Gamma'].entries()){ await p.mouse.dblclick(box.x + 100 + i * 220, box.y + 100); await p.waitForTimeout(150); await p.keyboard.type(t); await p.keyboard.press('Escape'); await p.waitForTimeout(220); }
  const pos = () => p.evaluate(() => S.lsPlacements.map(x => [S.lsChips.find(c => c.id === x.cardId).text, Math.round(x.x), Math.round(x.y)]));
  is('double-click on the empty board makes a keyword each time', (await pos()).map(x => x[0]), ['Alpha', 'Beta', 'Gamma']);
  console.log('\n2. dragging a keyword once it exists');
  const drag = async (sel, dx, dy, keys) => { const c = await p.$(sel); const cb = await c.boundingBox(); await p.mouse.move(cb.x + 30, cb.y + 20); await p.mouse.down(); for(let i = 1; i <= 10; i++){ await p.mouse.move(cb.x + 30 + dx * i / 10, cb.y + 20 + dy * i / 10); await p.waitForTimeout(15); } await p.mouse.up(); await p.waitForTimeout(250); };
  await drag('.ls-card[data-ctype=chip]', 200, 100);
  is('a drag moves it by as far as the pointer went', (await pos())[0], ['Alpha', 300, 200]);
  yes('and it stays a real card on the board (not redrawn out from under the pointer)', await p.evaluate(() => document.querySelectorAll('.ls-card').length === 3));
  await p.keyboard.press('Control+z'); await p.waitForTimeout(200);
  is('Ctrl+Z puts it back', (await pos())[0], ['Alpha', 100, 100]);
  await p.keyboard.press('Control+Shift+z'); await p.waitForTimeout(200);
  is('and Ctrl+Shift+Z moves it again', (await pos())[0], ['Alpha', 300, 200]);
  await p.waitForTimeout(1200); await p.reload(); await p.waitForTimeout(2200);
  is('a reload keeps where it was put', (await pos()).find(x => x[0] === 'Alpha'), ['Alpha', 300, 200]);
  /* several at once */
  await p.keyboard.press('Control+a'); await p.waitForTimeout(150);
  const before = await pos();
  await drag('.ls-card[data-ctype=chip]', 60, 40);
  const after = await pos();
  yes('with all selected, they move together', before.every((x, i) => Math.abs(after[i][1] - x[1] - 60) <= 1 && Math.abs(after[i][2] - x[2] - 40) <= 1), [before, after]);
  console.log('\n3. the rest of the board');
  await p.evaluate(() => { S.lsPlacements.forEach((x, i) => { x.x = 100 + i * 220; x.y = 100; }); saveNow(); rerender(); }); await p.waitForTimeout(800);
  await p.keyboard.press('6'); await p.waitForTimeout(200);
  await p.click('.ls-card:nth-of-type(1)'); await p.waitForTimeout(150); await p.click('.ls-card:nth-of-type(2)'); await p.waitForTimeout(300);
  await p.click('[data-type="supports"]'); await p.fill('.ls-relate-why', 'because'); await p.click('[data-confirm]'); await p.waitForTimeout(300);
  yes('a connection is drawn as an arrow on the board', await p.evaluate(() => document.querySelectorAll('[data-arrows] line').length === 1));
  await p.keyboard.press('1'); await p.waitForTimeout(150);
  const vp0 = await p.evaluate(() => document.querySelector('[data-canvas-inner]').style.transform);
  await p.keyboard.down('Space'); await p.mouse.move(box.x + 700, box.y + 400); await p.mouse.down(); await p.mouse.move(box.x + 760, box.y + 440, {steps: 4}); await p.mouse.up(); await p.keyboard.up('Space'); await p.waitForTimeout(200);
  yes('holding Space and dragging the empty board pans it', await p.evaluate(v => document.querySelector('[data-canvas-inner]').style.transform !== v, vp0));
  const n0 = await p.evaluate(() => S.lsChips.length);
  await p.keyboard.press('/'); await p.keyboard.type('quick'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  is('/ is the board\'s quick-add, not the house search', await p.evaluate(() => [S.lsChips.length, !!document.querySelector('#palQ')]), [n0 + 1, false]);
  await p.keyboard.press('Alt+k'); await p.waitForTimeout(300);
  yes('Alt+K puts a capture in the tray, and the tray shows it at once', await p.evaluate(() => /typed/.test(document.querySelector('[data-tray]').innerText)));
  yes('no page errors', errs.length === 0, errs);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close(); process.exit(bad ? 1 : 0);
})();
