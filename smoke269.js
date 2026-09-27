/* smoke269 — time tracking: a category you can search, and writing about a
   sitting.

   The claims.

   SEARCH, DON'T SCROLL. Adding a sitting (or starting one), the category is
   chosen from a list with a search box at the top: typing a few letters
   narrows it, and Enter takes the one highlighted.

   WRITE ABOUT IT. Every sitting has a "write about it" chooser of journal
   entry types, searchable the same way. Choosing one opens that kind of
   entry, dated to the sitting's day; once saved, the sitting lists it and
   the entry knows which sitting it was about. The sitting's own form has the
   same chooser.

   Run: NODE_PATH=node_modules node smoke269.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport: {width: 1280, height: 900}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  await p.evaluate(async () => { timeState(); timeUi().day = today(); location.hash = '#/time/day';
    await new Promise(r => setTimeout(r, 900)); });

  console.log('\n1. adding a sitting, the category searched for');
  await p.click('#tmAdd'); await p.waitForTimeout(300);
  yes('the category is a searchable chooser', await p.evaluate(() => document.querySelector('#teCat')?.hasAttribute('data-search')));
  const want = await p.evaluate(() => { const c = timeCategories().find(c => /read/i.test(c.name)) || timeCategories()[3]; return {id: c.id, name: c.name}; });
  await p.fill('#teWhat', 'the Jazz Piano Book, chapter 3');
  await p.fill('#teFrom', '10:00'); await p.fill('#teTo', '11:15');
  await p.click('#teCat'); await p.waitForTimeout(200);
  yes('  opening it puts the cursor in a search box', await p.evaluate(() => document.activeElement?.classList.contains('sm-q')));
  const all = await p.evaluate(() => document.querySelectorAll('.sm-pop .sm-opt').length);
  await p.keyboard.type(want.name.slice(0, 4));
  const narrowed = await p.evaluate(() => [...document.querySelectorAll('.sm-pop .sm-opt .sm-lbl')].map(n => n.textContent.trim()));
  yes('  typing narrows the list', narrowed.length < all && narrowed.some(t => t.includes(want.name)), `${all} → ${JSON.stringify(narrowed)}`);
  /* the highlighted one is the first match; walk to the one wanted */
  for(let i = 0; i < narrowed.length; i++){
    const at = await p.evaluate(() => document.querySelector('.sm-pop .sm-opt.cursor .sm-lbl')?.textContent || '');
    if(at.includes(want.name)) break; await p.keyboard.press('ArrowDown'); }
  await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  is('  Enter takes it', await p.evaluate(() => document.querySelector('#teCat').value), want.id);
  await p.click('#teSave'); await p.waitForTimeout(500);
  const sit = await p.evaluate(() => { const e = S.timeEntries.find(x => /Jazz Piano Book/.test(x.what)); return e && {id: e.id, cat: e.categoryId}; });
  yes('  and the sitting is saved under it', sit && sit.cat === want.id, sit);

  console.log('\n2. writing about it, from the row');
  const row = await p.evaluate(id => { const r = document.querySelector(`[data-tmrow="${id}"]`);
    const s = r && r.querySelector('[data-tmwrite]');
    return {row: !!r, pick: !!s, search: s && s.hasAttribute('data-search'), n: s ? s.options.length : 0}; }, sit.id);
  yes('every sitting has a "write about it" chooser', row.row && row.pick && row.search, row);
  await p.click(`[data-tmrow="${sit.id}"] [data-tmwrite]`); await p.waitForTimeout(200);
  await p.keyboard.type('memo');
  const opts = await p.evaluate(() => [...document.querySelectorAll('.sm-pop .sm-opt .sm-lbl')].map(n => n.textContent.trim()));
  yes('  searching it finds the kind of entry', opts.length === 1 && /Memory/.test(opts[0]), opts);
  await p.keyboard.press('Control+A'); await p.keyboard.type('reflec'); await p.keyboard.press('Enter');
  await p.waitForTimeout(500);
  const modal = await p.evaluate(() => ({open: !!document.querySelector('#eTitle'), when: document.querySelector('#eWhen')?.value,
    head: document.querySelector('.modal h2')?.textContent || ''}));
  yes('  choosing Reflection opens a reflection, dated to the sitting', modal.open && /Reflection/.test(modal.head) && modal.when, modal);
  await p.fill('#eTitle', 'Why chapter 3 went slowly');
  await p.evaluate(() => { const b = document.querySelector('#eBody'); if(b){ if('value' in b) b.value = 'the voicings, again'; else b.textContent = 'the voicings, again'; } });
  await p.click('#eSave');
  await p.waitForTimeout(700);
  const linked = await p.evaluate(id => { const e = S.timeEntries.find(x => x.id === id);
    const ent = S.entries.find(x => x.title === 'Why chapter 3 went slowly');
    const chip = document.querySelector(`[data-tmrow="${id}"] .tm-wchip`);
    return {ids: e.entryIds.length, back: ent && ent.extra && ent.extra.sittingId === id, type: ent && ent.type,
      chip: chip ? chip.textContent.trim() : ''}; }, sit.id);
  is('  saved, it is a reflection', linked.type, 'reflection');
  yes('  the sitting lists it', linked.ids === 1 && /Why chapter 3/.test(linked.chip), linked);
  yes('  and it knows which sitting it was about', linked.back);

  console.log('\n3. and from the sitting\'s own form');
  await p.click(`[data-tmedit="${sit.id}"]`); await p.waitForTimeout(300);
  const form = await p.evaluate(() => ({pick: !!document.querySelector('.modal .tm-writebox [data-tmwrite]'),
    chip: document.querySelector('.modal .tm-writebox .tm-wchip')?.textContent.trim() || ''}));
  yes('the form has the chooser, and what was written', form.pick && /Why chapter 3/.test(form.chip), form);
  await p.evaluate(() => closeModals());

  console.log('\n4. it all survives a reload');
  const kept = await p.evaluate(async id => { await saveNow(); await load(); const e = S.timeEntries.find(x => x.id === id);
    return {ids: e.entryIds.length, found: timeEntriesOf(e).map(x => x.title)}; }, sit.id);
  is('the link is kept', kept.found, ['Why chapter 3 went slowly']);

  console.log('\n5. nothing broke on the way');
  is('no page errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
