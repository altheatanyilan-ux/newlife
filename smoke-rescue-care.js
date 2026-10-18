/* smoke-rescue-care — "Ready the room": environmental engineering before a hard hour, never worded the same twice.
   Run: NODE_PATH=node_modules node smoke-rescue-care.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const yes = (n, c, g = '') => c ? console.log('  ok   ' + n) : (bad++, console.log('  FAIL ' + n + (g !== '' ? '  — ' + (typeof g === 'string' ? g : JSON.stringify(g)) : '')));
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1300, height: 950}})).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  await p.evaluate(() => { document.querySelectorAll('.overlay,.toast').forEach(n => n.remove()); location.hash = '#/rescue'; }); await p.waitForTimeout(900);

  console.log('\n1. the pack');
  const pack = await p.evaluate(() => ({items: RESCUE_CARE.length, variants: RESCUE_CARE.map(r => r[4].length), areas: [...new Set(RESCUE_CARE.map(r => r[1]))].length, pre: RESCUE_CARE.filter(r => r[3].pre).length, mid: RESCUE_CARE.filter(r => r[3].mid).length}));
  yes('about twenty things, each with several wordings, across several areas, some for during a page', pack.items >= 18 && Math.min(...pack.variants) >= 2 && pack.areas >= 6 && pack.mid >= 5, pack);
  const bag = await p.evaluate(() => { const c = rescueCareState(); c.bag = {}; const n = rescueCareItem('water').variants.length; const seq = []; for(let i = 0; i < n * 2; i++) seq.push(rescueCareVariant('water').idx);
    return {n, first: seq.slice(0, n), second: seq.slice(n), seam: seq[n - 1] !== seq[n]}; });
  yes('every wording of an item is used before any is repeated (a shuffled pack)', new Set(bag.first).size === bag.n && new Set(bag.second).size === bag.n && bag.seam, bag);

  console.log('\n2. the invitation on a blank page');
  const card = await p.evaluate(() => { const c = document.querySelector('.rs-ready'); return c && {items: [...c.querySelectorAll('.rs-ready-t > span')].map(x => x.textContent), head: c.querySelector('.rs-ready-h .serif').textContent, ticks: c.querySelectorAll('.rs-tick').length}; });
  yes('a blank page offers three small things, one to an area', card && card.items.length === 3 && card.ticks === 3, card);
  yes('and they are kind invitations, not a checklist of commands', card && card.items.every(t => t.length > 12 && t.length < 160) && !/must|have to/i.test(card.items.join(' ')), card && card.items);
  const heads = await p.evaluate(() => { const s = new Set(); let prev = ''; let same = 0; for(let i = 0; i < 12; i++){ const h = rescueReadyHead(); if(h === prev) same++; prev = h; s.add(h); } return {n: s.size, same}; });
  yes('the opening line varies and never repeats back to back', heads.n >= 4 && heads.same === 0, heads);
  const texts = await p.evaluate(() => { const seen = []; for(let i = 0; i < 6; i++){ rescueReadyShow(document, true); seen.push([...document.querySelectorAll('.rs-ready-t > span')].map(x => x.textContent).join(' | ')); } return seen; });
  yes('opening it again gives different things each time', new Set(texts).size >= 5, texts.length);
  await p.evaluate(() => { const c = rescueCareState(); c.done = {}; c.shown = {}; rescueReadyShow(document, true); });
  await p.click('.rs-ready-i [data-rd="tick"]'); await p.waitForTimeout(250);
  yes('ticking one marks it done, so it is not offered again soon', await p.evaluate(() => { const c = rescueCareState(); const id = _rs.ready.picks[0].id; return !!c.done[id] && document.querySelector('.rs-ready-i').classList.contains('on'); }));
  const swapBefore = await p.evaluate(() => document.querySelectorAll('.rs-ready-t > span')[1].textContent);
  await p.evaluate(() => document.querySelectorAll('.rs-ready-i')[1].querySelector('[data-rd="swap"]').click()); await p.waitForTimeout(200);
  yes('↻ swaps one for another, from a different area', await p.evaluate(b => { const t = document.querySelectorAll('.rs-ready-t > span')[1].textContent; const areas = _rs.ready.picks.map(x => x.area); return t !== b && new Set(areas).size === 3; }, swapBefore));
  await p.evaluate(() => { document.querySelectorAll('.rs-ready-i').forEach(li => { if(!li.classList.contains('on')) li.querySelector('.rs-tick').click(); }); }); await p.waitForTimeout(300);
  yes('when all three are done the room says so, in a different line each time', await p.evaluate(() => document.querySelector('.rs-ready').classList.contains('ready') && RESCUE_CARE_DONE.includes(document.querySelector('.rs-ready-h .serif').textContent)));
  console.log('\n3. writing folds it away; the record is kept');
  const cb = await (await p.$('#rsCanvas')).boundingBox();
  await p.mouse.click(cb.x + 200, cb.y + 300); await p.keyboard.type('hello'); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  yes('the first box folds the card to a small mark of what was done', await p.evaluate(() => !document.querySelector('.rs-ready') && /3 things done/.test((document.querySelector('.rs-ready-pill') || {}).textContent || '')));
  yes('and the page records what was readied', await p.evaluate(() => rescueSheets()[0].ready.length === 3));
  await p.click('.rs-ready-pill'); await p.waitForTimeout(250);
  yes('the mark opens a fresh invitation', await p.evaluate(() => !!document.querySelector('.rs-ready')));
  await p.evaluate(() => { document.querySelector('.rs-ready-x').click(); });

  console.log('\n4. one of my own, and the quiet lines during a page');
  await p.evaluate(() => rescueReadyShow(document, true)); await p.click('[data-rd="mine"]'); await p.waitForTimeout(250);
  await p.fill('#rcOwn', 'put on the green lamp'); await p.click('#rcAdd'); await p.waitForTimeout(200);
  yes('your own is added to the pack', await p.evaluate(() => rescueCareState().mine.some(m => m.text === 'put on the green lamp')));
  const mine = await p.evaluate(() => { let hit = 0; for(let i = 0; i < 80; i++){ const k = rescueCarePick(3, 'pre'); if(k.some(x => x.mine)) hit++; } return hit; });
  yes('and turns up now and then, not every time', mine > 5 && mine < 70, mine);
  await p.evaluate(() => { rescueCareState().done = {water: new Date(Date.now() - 5 * 3600000).toISOString()}; document.querySelector('#rsWhisper').classList.remove('on'); rescueCareNudge(document); });
  await p.waitForTimeout(300);
  const nud = await p.evaluate(() => ({on: document.querySelector('#rsWhisper').classList.contains('on'), txt: document.querySelector('#rsWhisper .rs-w').textContent, care: document.querySelector('#rsWhisper .rs-w').classList.contains('care')}));
  yes('a body-care line leans in at the edge, with a way to say done or not now', nud.on && nud.care && nud.txt.length > 10, nud);
  const mid = await p.evaluate(() => { const ids = []; for(let i = 0; i < 40; i++) rescueCarePick(1, 'mid').forEach(x => ids.push(x.id)); return [...new Set(ids)]; });
  yes('during a page only the small body-care things are chosen (no bin runs)', mid.length >= 4 && !mid.includes('trash') && !mid.includes('surface'), mid);
  await p.evaluate(() => { S.settings.rescueCareNudges = false; document.querySelector('#rsWhisper').classList.remove('on'); rescueCareNudge(document); });
  yes('and they can be turned off in Settings', await p.evaluate(() => !document.querySelector('#rsWhisper').classList.contains('on')));
  await p.evaluate(() => { location.hash = '#/settings'; }); await p.waitForTimeout(800);
  yes('Settings has both switches', await p.evaluate(() => !!document.querySelector('#sRescueReady') && !!document.querySelector('#sRescueCare')));
  yes('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(bad ? '\nFAILURES' : '\nall good'); process.exit(bad ? 1 : 0);
})();
