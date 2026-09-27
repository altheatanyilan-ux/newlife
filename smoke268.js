/* smoke268 — the Repertoire shelf, tidied.

   The claims.

   THE TOP. No heading and no paragraph: the page opens on "Add a score",
   with a small drop box right beside it (a tenth of the old one or less),
   and a file dropped anywhere on the page is taken.

   ONE LIST. The score cards are gone. The inventory, with its filters, is
   the list, and it is the first thing under the controls.

   THE RULES ARE A VIEW. The unwritten rules are not under the inventory;
   a switch at the top opens them, and the same switch goes back.

   NOTHING VOUCHES. "never practised in this room, so nothing here can vouch
   for it" is not said, about any piece.

   COMPOSERS ARE CHOSEN. The composer is picked from a list you can search,
   and a new name is added from the same box. Names that look like one
   person written different ways are offered for tidying; a merge puts every
   piece under one name, keeps the name each file gave, and remembers the
   spelling so the next file arrives under the right name. "They are
   different people" is remembered too.

   Run: NODE_PATH=node_modules node smoke268.js */
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
  await p.evaluate(async () => {
    const xml = '<?xml version="1.0"?><score-partwise><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1"><measure number="1"></measure></part></score-partwise>';
    for(const [t, c, fam] of [['Nocturne', 'Chopin', 'ready'], ['Ballade', 'Frédéric Chopin', 'learning'], ['Etude', 'CHOPIN, F.', 'learning'],
      ['Prelude in C', 'J.S. Bach', 'learning'], ['Invention', 'C.P.E. Bach', 'learning']])
      addScore({title: t, composer: c, musicXml: xml, familiar: fam});
    await saveNow(); scoreUi().id = null; scoreUi().libView = null; location.hash = '#/score';
    await new Promise(r => setTimeout(r, 1200)); });

  console.log('\n1. the top of the page');
  const top = await p.evaluate(() => {
    const page = document.querySelector('.sc-page'), txt = page.textContent;
    const add = document.querySelector('#ctxAdd'), drop = document.querySelector('#scDrop');
    const ra = add.getBoundingClientRect(), rd = drop.getBoundingClientRect();
    return {h1: !!page.querySelector('h1'), lede: /The notation, and what you have written on it/.test(txt),
      sameRow: Math.abs((ra.top + ra.bottom) / 2 - (rd.top + rd.bottom) / 2) < 12, beside: rd.left > ra.left && rd.left - ra.right < 40,
      area: Math.round(rd.width * rd.height), w: Math.round(rd.width), h: Math.round(rd.height)};
  });
  yes('no heading and no paragraph', !top.h1 && !top.lede, top);
  yes('  the drop box is beside "Add a score", on its row', top.sameRow && top.beside, top);
  /* the old one was the width of the page and ~150px tall: 1000 × 150 */
  yes('  and a tenth of the size it was, or less', top.area <= 15000, `${top.w}×${top.h}`);

  console.log('\n2. one list, at the top');
  const list = await p.evaluate(() => {
    const kids = [...document.querySelector('.sc-page').children].filter(n => !n.matches('input,.sc-warn,.ctx-add'));
    return {shelf: !!document.querySelector('.sc-shelf, .sc-item'), inv: !!document.querySelector('#scInv'),
      second: kids[1] && kids[1].id, rows: document.querySelectorAll('.sc-invrow').length,
      rules: !!document.querySelector('#scRules'), weigh: !!document.querySelector('.sc-weigh')};
  });
  yes('no score cards', !list.shelf, list);
  is('  the inventory is the first thing under the controls', list.second, 'scInv');
  is('  every piece is on it', list.rows, 5);
  yes('  and the rules are not under it', !list.rules && list.weigh, list);

  console.log('\n3. the rules are a view');
  await p.click('[data-sclib="rules"]'); await p.waitForTimeout(500);
  const rv = await p.evaluate(() => ({rules: !!document.querySelector('#scRules'), inv: !!document.querySelector('#scInv'),
    on: document.querySelector('[data-sclib].on')?.dataset.sclib}));
  yes('pressing it opens the unwritten rules in place of the inventory', rv.rules && !rv.inv && rv.on === 'rules', rv);
  await p.click('[data-sclib="inv"]'); await p.waitForTimeout(500);
  yes('  and the switch goes back', await p.evaluate(() => !!document.querySelector('#scInv') && !document.querySelector('#scRules')));

  console.log('\n4. nothing here vouches');
  yes('"nothing here can vouch for it" is not said', await p.evaluate(() =>
    !/vouch/.test(document.body.textContent) && scoreState().every(x => !/vouch/.test(scoreFamiliarDoubt(x)))));

  console.log('\n5. composers written more than one way');
  const tw = await p.evaluate(() => ({notice: document.querySelector('.sc-twice')?.textContent.replace(/\s+/g, ' ') || '',
    groups: scoreComposerGroups().map(g => g.names.map(([n]) => n).sort())}));
  yes('the inventory says so', /more than one way/.test(tw.notice) && /Frédéric Chopin/.test(tw.notice), tw.notice);
  yes('  Chopin three ways is one group', tw.groups.some(g => g.length === 3 && g.includes('CHOPIN, F.')), tw.groups);
  await p.click('#scTidy'); await p.waitForTimeout(400);
  const gi = await p.evaluate(() => scoreComposerGroups().findIndex(g => g.names.some(([n]) => n === 'Chopin')));
  const bi = await p.evaluate(() => scoreComposerGroups().findIndex(g => g.names.some(([n]) => /Bach/.test(n))));
  await p.evaluate(gi => { document.querySelector(`[data-sccg="${gi}"] input[value="Chopin"]`).checked = true; }, gi);
  await p.click(`[data-sccmerge="${gi}"]`); await p.waitForTimeout(400);
  const merged = await p.evaluate(() => ({comps: scoreState().filter(x => /Nocturne|Ballade|Etude/.test(x.title)).map(x => x.composer),
    kept: scoreState().filter(x => x.composerFile).map(x => x.composerFile).sort(),
    next: scoreComposerCanonical('Frédéric Chopin'), next2: scoreComposerCanonical('chopin, f')}));
  is('merging puts every piece under the one name', merged.comps, ['Chopin', 'Chopin', 'Chopin']);
  is('  each keeps the name its file gave', merged.kept, ['CHOPIN, F.', 'Frédéric Chopin']);
  is('  and the next file spelt that way arrives as Chopin', [merged.next, merged.next2], ['Chopin', 'Chopin']);
  if(bi >= 0){
    const bj = await p.evaluate(() => scoreComposerGroups().findIndex(g => g.names.some(([n]) => /Bach/.test(n))));
    await p.click(`[data-sccapart="${bj}"]`); await p.waitForTimeout(300);
  }
  is('"they are different people" is remembered', await p.evaluate(() => scoreComposerGroups().length), 0);
  await p.evaluate(() => closeModals());

  console.log('\n6. choosing a composer, and adding one');
  await p.evaluate(() => { const x = scoreState().find(y => y.title === 'Invention'); openScoreDetails(x.id); });
  await p.waitForTimeout(300);
  yes('the composer is a chooser you can search', await p.evaluate(() => {
    const s = document.querySelector('#sdComposer'); return s && s.tagName === 'SELECT' && s.hasAttribute('data-search') && s.hasAttribute('data-add'); }));
  await p.click('#sdComposer'); await p.waitForTimeout(250);
  await p.keyboard.type('cho');
  const found = await p.evaluate(() => [...document.querySelectorAll('.sm-pop .sm-opt:not(.sm-addopt) .sm-lbl')].map(n => n.textContent));
  yes('typing narrows the list', found.length === 1 && /^Chopin/.test(found[0]), found);
  await p.keyboard.press('Control+A'); await p.keyboard.type('Scarlatti');
  const offer = await p.evaluate(() => document.querySelector('.sm-pop .sm-addopt')?.textContent.trim());
  yes('  a name that is not there is offered as a new one', /Add “Scarlatti”/.test(offer || ''), offer);
  await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  is('  Enter adds it and picks it', await p.evaluate(() => document.querySelector('#sdComposer').value), 'Scarlatti');
  await p.click('#sdSave'); await p.waitForTimeout(400);
  const after = await p.evaluate(async () => { await saveNow(); await load();
    return {c: scoreState().find(y => y.title === 'Invention').composer, names: scoreComposerNames().map(([n]) => n)}; });
  is('  saved on the piece', after.c, 'Scarlatti');
  yes('  and on the list for next time', after.names.includes('Scarlatti'), after.names);

  console.log('\n7. nothing broke on the way');
  is('no page errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
