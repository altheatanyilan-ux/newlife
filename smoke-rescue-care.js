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
  await p.evaluate(() => { S.settings.rescueGate = 'off'; S.settings.rescueCarry = false; saveNow(); }); /* the gate has its own smoke */
  await p.evaluate(() => { document.querySelectorAll('.overlay,.toast').forEach(n => n.remove()); location.hash = '#/rescue'; }); await p.waitForTimeout(900);

  console.log('\n1. the pack');
  const pack = await p.evaluate(() => ({items: RESCUE_CARE.length, variants: RESCUE_CARE.map(r => r[4].length), areas: [...new Set(RESCUE_CARE.map(r => r[1]))].length, pre: RESCUE_CARE.filter(r => r[3].pre).length, mid: RESCUE_CARE.filter(r => r[3].mid).length}));
  yes('about twenty things, each with several wordings, across several areas, some for during a page', pack.items >= 18 && Math.min(...pack.variants) >= 2 && pack.areas >= 6 && pack.mid >= 5, pack);
  const bag = await p.evaluate(() => { const c = rescueCareState(); c.bag = {}; const n = rescueCareItem('water').variants.length; const seq = []; for(let i = 0; i < n * 2; i++) seq.push(rescueCareVariant('water').idx);
    return {n, first: seq.slice(0, n), second: seq.slice(n), seam: seq[n - 1] !== seq[n]}; });
  yes('every wording of an item is used before any is repeated (a shuffled pack)', new Set(bag.first).size === bag.n && new Set(bag.second).size === bag.n && bag.seam, bag);

  console.log('\n2. the essentials are all there every time; only the wording changes');
  const first = await p.evaluate(() => { const c = document.querySelector('.rs-ready'); return c && {core: [...c.querySelectorAll('.rs-ready-i.core')].map(li => li.querySelector('.rs-ready-t > span').textContent), extras: c.querySelectorAll('.rs-ready-i:not(.core)').length, head: c.querySelector('.rs-ready-h .serif').textContent, n: c.querySelector('#rdN').textContent, ids: _rs.ready.picks.filter(x => x.core).map(x => x.id)}; });
  yes('a blank page lists every essential (nine by default) and a couple of optional extras under "and, maybe"', first && first.core.length === 9 && first.extras === 2 && first.n === '0 of 9', first);
  yes('and they are kind invitations, not commands', first && first.core.every(t => t.length > 12 && t.length < 190) && !/\bmust\b|\byou have to\b/i.test(first.core.join(' ')));
  const draws = await p.evaluate(() => { const out = []; for(let i = 0; i < 5; i++){ rescueReadyShow(document, true); out.push({ids: _rs.ready.picks.filter(x => x.core).map(x => x.id).join(), texts: _rs.ready.picks.filter(x => x.core).map(x => x.text)}); } return out; });
  yes('the same essentials come up every time', new Set(draws.map(d => d.ids)).size === 1, draws[0].ids);
  const diff = draws.slice(1).map((d, k) => d.texts.filter((t, i) => t !== draws[k].texts[i]).length);
  yes('but each one is put differently from the last time', diff.every(n => n === 9), diff);
  const heads = await p.evaluate(() => { const s = new Set(); let prev = ''; let same = 0; for(let i = 0; i < 12; i++){ const h = rescueReadyHead(); if(h === prev) same++; prev = h; s.add(h); } return {n: s.size, same}; });
  yes('the opening line varies and never repeats back to back', heads.n >= 4 && heads.same === 0, heads);
  await p.evaluate(() => { const c = rescueCareState(); c.done = {}; c.shown = {}; rescueReadyShow(document, true); });
  await p.click('.rs-ready-i.core [data-rd="tick"]'); await p.waitForTimeout(250);
  yes('ticking one marks it done and counts it', await p.evaluate(() => { const c = rescueCareState(); const id = _rs.ready.picks[0].id; return !!c.done[id] && document.querySelector('#rdN').textContent === '1 of 9'; }));
  const sw = await p.evaluate(() => { const li = document.querySelectorAll('.rs-ready-i.core')[1]; const before = li.querySelector('.rs-ready-t > span').textContent, id = _rs.ready.picks[1].id; li.querySelector('[data-rd="swap"]').click(); const li2 = document.querySelectorAll('.rs-ready-i.core')[1]; return {before, after: li2.querySelector('.rs-ready-t > span').textContent, sameThing: _rs.ready.picks[1].id === id}; });
  yes('↻ on an essential says the same thing another way', sw.before !== sw.after && sw.sameThing, sw);
  const sx = await p.evaluate(() => { const ex = document.querySelector('.rs-ready-i:not(.core)'); const before = ex.querySelector('.rs-ready-t > span').textContent, idx = +ex.dataset.ri2, id = _rs.ready.picks[idx].id; ex.querySelector('[data-rd="swap"]').click(); const now = _rs.ready.picks[idx]; return {changed: now.id !== id, notCore: !rescueCareCoreIds().includes(now.id), flag: now.core === false}; });
  yes('↻ on an optional extra brings a different thing, never one of the essentials', sx.changed && sx.notCore && sx.flag, sx);
  await p.evaluate(() => { document.querySelector('[data-rd="all"]').click(); }); await p.waitForTimeout(300);
  yes('"already all done" ticks the essentials, and the room says it is ready in a different line each time', await p.evaluate(() => document.querySelector('.rs-ready').classList.contains('ready') && RESCUE_CARE_DONE.includes(document.querySelector('.rs-ready-h .serif').textContent) && document.querySelector('#rdN').textContent === '9 of 9'));
  await p.evaluate(() => rescueReadyShow(document, true));
  yes('and something ticked a little while ago is marked, so it need not be redone', await p.evaluate(() => /ticked/.test(document.querySelector('.rs-ready-t .rs-rec') ? document.querySelector('.rs-ready-t .rs-rec').textContent : '')));
  console.log('\n2b. choosing what is always checked');
  await p.click('[data-rd="essentials"]'); await p.waitForTimeout(250);
  yes('"my essentials" lists every thing, the nine ticked', await p.evaluate(() => document.querySelectorAll('[data-ess]').length >= 18 && document.querySelectorAll('[data-ess]:checked').length === 9));
  await p.uncheck('[data-ess="power"]'); await p.check('[data-ess="move"]'); await p.check('[data-ess="fuel"]');
  await p.click('#essOk'); await p.waitForTimeout(300);
  const ess = await p.evaluate(() => ({core: rescueCareCoreIds().sort().join(), onCard: [...document.querySelectorAll('.rs-ready-i.core')].length, extrasNotCore: _rs.ready.picks.filter(x => !x.core).every(x => !rescueCareCoreIds().includes(x.id))}));
  yes('the card now shows exactly those, ten, and the extras come from the rest', ess.onCard === 10 && /move/.test(ess.core) && /fuel/.test(ess.core) && !/power/.test(ess.core) && ess.extrasNotCore, ess);
  await p.evaluate(() => { rescueCareState().core = null; rescueReadyShow(document, true); });

  console.log('\n3. writing folds it away; the record is kept');
  const cb = await (await p.$('#rsCanvas')).boundingBox();
  await p.mouse.click(cb.x + 40, cb.y + cb.height - 70); await p.keyboard.type('hello'); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  yes('the first box folds the card to a small mark of what was done', await p.evaluate(() => !document.querySelector('.rs-ready') && /things? done/.test((document.querySelector('.rs-ready-pill') || {}).textContent || '')));
  yes('and the page records what was readied', await p.evaluate(() => rescueSheets()[0].ready.length >= 9));
  await p.click('.rs-ready-pill'); await p.waitForTimeout(250);
  yes('the mark opens a fresh invitation', await p.evaluate(() => !!document.querySelector('.rs-ready')));
  await p.evaluate(() => { document.querySelector('.rs-ready-x').click(); });

  console.log('\n4. one of my own, and the quiet lines during a page');
  await p.evaluate(() => rescueReadyShow(document, true)); await p.click('[data-rd="mine"]'); await p.waitForTimeout(250);
  await p.fill('#rcOwn', 'put on the green lamp'); await p.check('#rcAlways'); await p.click('#rcAdd'); await p.waitForTimeout(400);
  yes('your own is added to the pack', await p.evaluate(() => rescueCareState().mine.some(m => m.text === 'put on the green lamp')));
  yes('marked "every time", it is on the card among the essentials', await p.evaluate(() => [...document.querySelectorAll('.rs-ready-i.core .rs-ready-t > span')].some(x => x.textContent === 'put on the green lamp')));
  await p.evaluate(() => { rescueCareState().mine.forEach(m => { m.always = false; }); });
  const mine = await p.evaluate(() => { let hit = 0; for(let i = 0; i < 80; i++){ const k = rescueCarePick(3, 'pre'); if(k.some(x => x.mine)) hit++; } return hit; });
  yes('unmarked, it turns up now and then in the extras, not every time', mine > 5 && mine < 70, mine);
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
