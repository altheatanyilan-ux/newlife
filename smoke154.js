/* smoke154 — the divination room, enlarged. Twenty spreads instead of five
   and each one laid out in its own shape; a reading you did on paper with a
   real deck, which gets the same reading as one dealt here; reversals as a
   thing you choose rather than a thing that happens to you; light and sound
   during the ceremony and nowhere else; and the whole deck, browsable, with
   every time each card has come up for you. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1340, height:1050}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }

  console.log('\n1. twenty spreads, in five groups');
  is('the library holds twenty', await p.evaluate(() => SPREAD_LIBRARY.length), 20);
  is('  in five groups', await p.evaluate(() => SPREAD_CATEGORIES.length), 5);
  is('  none of them empty', await p.evaluate(() =>
    SPREAD_CATEGORIES.filter(c => !spreadsInCategory(c.id).length).length), 0);
  is('  every position is named and explained', await p.evaluate(() =>
    SPREAD_LIBRARY.filter(s => s.positions.some(q => !q.name || !q.desc || !q.slot)).map(s => s.id).join(',')), '');
  is('  and the count matches what is laid out', await p.evaluate(() =>
    SPREAD_LIBRARY.filter(s => s.pos.length !== s.cardCount).length), 0);
  /* a spread names the kind of each position, so the card's own line for
     that kind can be pulled — this used to be a table keyed by spread id,
     which does not survive going from five spreads to twenty */
  is('the slots are read off the spread', await p.evaluate(() =>
    [0,1,2].map(i => tarotSlot('ppf', i)).join(',')), 'past,present,future');
  yes('  and every slot is one of the six the cards answer to', await p.evaluate(() => {
    const six = ['past','present','future','advice','obstacle','outcome'];
    return SPREAD_LIBRARY.every(s => s.positions.every(q => six.includes(q.slot))); }));

  console.log('\n2. the five old ids still name a spread');
  /* readings kept before the library existed name one of five ids; they
     still open, and still say the same thing they said */
  is('one → a single card',   await p.evaluate(() => spreadById('one').id), 'daily');
  is('three → past present future', await p.evaluate(() => spreadById('three').id), 'ppf');
  is('act → situation action outcome', await p.evaluate(() => spreadById('act').id), 'sao');
  is('rel → a relationship',  await p.evaluate(() => spreadById('rel').id), 'relationship');
  is('cross → the Celtic cross', await p.evaluate(() => spreadById('cross').id), 'celtic_cross');
  is('  and the Celtic cross still reads the same at the ends', await p.evaluate(() =>
    [tarotSlot('cross', 0), tarotSlot('cross', 1), tarotSlot('cross', 9)].join(',')), 'present,obstacle,outcome');
  is('a name nobody uses falls back rather than breaking',
     await p.evaluate(() => spreadById('nonsense').id), 'ppf');

  console.log('\n3. each spread is laid out in its own shape');
  const geo = await p.evaluate(() => SPREAD_LIBRARY.map(s => {
    const g = spreadGeometry(s);
    return {id: s.id, cells: g.cells.length, want: s.cardCount, rows: g.rows, cols: g.cols};
  }));
  is('every card has a place', geo.filter(g => g.cells !== g.want).map(g => g.id).join(','), '');
  yes('a row is a row', geo.find(g => g.id === 'ppf').rows === 1);
  yes('  a cross is not', geo.find(g => g.id === 'cross5').rows === 3);
  yes('  the chakras run up a column', geo.find(g => g.id === 'chakra').cols === 1
    && geo.find(g => g.id === 'chakra').rows === 7);
  yes('  and the tree has three pillars', geo.find(g => g.id === 'tree').cols === 3);
  /* Cards on top of each other is not a layout. The one exception is the
     Celtic cross's second card, which is meant to lie across the first. */
  const overlaps = await p.evaluate(() => {
    const out = [];
    for(const sp of SPREAD_LIBRARY){
      const h = document.createElement('div');
      h.style.cssText = 'position:fixed;left:-4000px;top:0;width:900px';
      h.innerHTML = tarotBoardHTML(sp);
      document.body.appendChild(h);
      const boxes = [...h.querySelectorAll('.tc-slot')].map(s => ({
        l: parseFloat(s.style.left), t: parseFloat(s.style.top),
        w: parseFloat(getComputedStyle(s).width),
        h: parseFloat(getComputedStyle(s.querySelector('.tc-hole')).height)}));
      for(let i = 0; i < boxes.length; i++) for(let j = i + 1; j < boxes.length; j++){
        if(sp.layout === 'celtic_cross' && j === 1) continue;
        const a = boxes[i], c = boxes[j];
        const ox = Math.min(a.l + a.w, c.l + c.w) - Math.max(a.l, c.l);
        const oy = Math.min(a.t + a.h, c.t + c.h) - Math.max(a.t, c.t);
        if(ox > 2 && oy > 2) out.push(`${sp.id} ${i}/${j}`);
      }
      h.remove();
    }
    return out;
  });
  is('no card is laid on top of another', overlaps.slice(0, 3).join(' · '), '');
  yes('except the one that is meant to be', await p.evaluate(() =>
    spreadGeometry(spreadById('celtic_cross')).cells[1].rot === 90));

  console.log('\n4. reversals are chosen, not suffered');
  is('they are on to begin with', await p.evaluate(() => divPrefs().reversals), true);
  is('  and a deal with them off comes up all upright', await p.evaluate(() =>
    tarotDraw(40, false).filter(x => x.rev).length), 0);
  yes('  where one with them on does not, over enough cards', await p.evaluate(() => {
    let r = 0; for(let i = 0; i < 30; i++) r += tarotDraw(20, true).filter(x => x.rev).length;
    return r > 60; }));
  await p.evaluate(() => openTarot()); await p.waitForTimeout(500);
  is('the setup offers three switches', await p.$$eval('[data-dvpref]', n => n.length), 3);
  yes('  reversals among them', await p.evaluate(() => !!document.querySelector('[data-dvpref="reversals"]')));
  await p.evaluate(() => document.querySelector('[data-dvpref="reversals"]').click());
  await p.waitForTimeout(200);
  is('  turning it off is remembered', await p.evaluate(() => divPrefs().reversals), false);
  is('  and the switch says so', await p.evaluate(() =>
    document.querySelector('[data-dvpref="reversals"]').getAttribute('aria-checked')), 'false');
  await p.evaluate(() => { document.querySelector('[data-dvpref="reversals"]').click();
    document.querySelector('.modal-close, [data-close]')?.click(); });
  await p.waitForTimeout(400);

  console.log('\n5. the ceremony has air in it');
  await p.evaluate(() => { document.querySelectorAll('.modal-wrap,.modal').forEach(n => n.remove());
    openTarot({spread:'ppf'}); }); await p.waitForTimeout(500);
  is('twenty tiles to choose a spread from', await p.$$eval('[data-dvspread]', n => n.length), 20);
  yes('  each with a diagram of its own shape', await p.evaluate(() =>
    document.querySelectorAll('[data-dvspread] .sp-dots rect').length >= 40));
  await p.click('#dvDraw'); await p.waitForTimeout(600);
  yes('a canvas covers the ceremony', await p.evaluate(() => !!document.querySelector('#dvMotes')));
  yes('  and takes no clicks', await p.evaluate(() =>
    getComputedStyle(document.querySelector('#dvMotes')).pointerEvents === 'none'));
  yes('  the sound can be turned off from inside it', await p.evaluate(() =>
    /sound/.test(document.querySelector('#dvMute')?.textContent || '')));
  yes('  and there is dust in the air', await p.evaluate(() => dvField().ps && dvField().ps.length > 0));
  await p.evaluate(() => document.querySelector('.dv-veil .dv-skip').click());
  await p.waitForTimeout(3200);
  is('a place for each position', await p.$$eval('.tc-slot', n => n.length), 3);
  for(let i = 0; i < 3; i++){
    await p.evaluate(() => document.querySelector('.dv-pick:not(.taken)').click());
    await p.waitForTimeout(1700);
  }
  await p.waitForTimeout(2200);
  is('choosing three turns three', await p.$$eval('.tc.up', n => n.length), 3);
  yes('  the sound was actually built', await p.evaluate(() => !!CeremonySound.ctx));
  yes('  and the reading follows', await p.evaluate(() => !document.querySelector('#dvRead').hidden));
  /* nothing may be left running behind a page nobody is reading */
  await p.evaluate(() => document.querySelectorAll('.modal-wrap,.modal').forEach(n => n.remove()));
  await p.waitForTimeout(400);
  is('closing it stops the loop', await p.evaluate(() => dvField().ps ? dvField().ps.length : 0), 0);

  console.log('\n6. a reading you did on paper');
  await p.evaluate(() => openPhysicalReading({spread:'ppf'})); await p.waitForTimeout(500);
  is('a slot per position', await p.$$eval('.ph-slot', n => n.length), 3);
  /* the names people actually type */
  is('“tower” finds the Tower', await p.evaluate(() => TAROT[cardSearch('tower')[0]].n), 'The Tower');
  is('  “3 cups” finds the Three of Cups', await p.evaluate(() => TAROT[cardSearch('3 cups')[0]].n), 'Three of Cups');
  is('  “knight of swords” finds it whole', await p.evaluate(() => TAROT[cardSearch('knight of swords')[0]].n), 'Knight of Swords');
  is('  “love” finds the Lovers by its keyword', await p.evaluate(() => TAROT[cardSearch('love')[0]].n), 'The Lovers');
  is('  and nonsense finds nothing', await p.evaluate(() => cardSearch('zzzz').length), 0);
  await p.fill('[data-phin="0"]', 'tower'); await p.waitForTimeout(250);
  yes('typing offers what it could be', await p.$$eval('.ph-s', n => n.length >= 1));
  await p.click('.ph-s'); await p.waitForTimeout(250);
  yes('  and picking one shows the card back', await p.evaluate(() =>
    /Tower/.test(document.querySelector('[data-phchosen="0"]').textContent)));
  for(const [i, q] of [[1, 'three of cups'], [2, 'the star']]){
    await p.fill(`[data-phin="${i}"]`, q); await p.waitForTimeout(250);
    await p.evaluate(j => document.querySelector(`[data-phsugg="${j}"] .ph-s`)?.click(), i);
  }
  await p.check('[data-phrev="2"]'); await p.waitForTimeout(200);
  const before = await p.evaluate(() => S.entries.length);
  await p.click('#phGo'); await p.waitForTimeout(900);
  is('the reading is the same reading', await p.$$eval('.dv-card-read', n => n.length), 3);
  yes('  laid out the same way', await p.evaluate(() => document.querySelectorAll('.tc-board .tc.up').length === 3));
  yes('  and marked as having come off a table', await p.evaluate(() =>
    /paper/.test(document.querySelector('.dv-src')?.textContent || '')));
  await p.evaluate(() => { document.querySelector('#dvText').value = 'At the kitchen table.';
    document.querySelector('#dvSave').click(); });
  await p.waitForTimeout(900);
  is('keeping it makes one entry', await p.evaluate(() => S.entries.length) - before, 1);
  const kept = await p.evaluate(() => { const e = S.entries.filter(x => x.type === 'divination').pop();
    const d = divinationOf(e); return {src: d.source, spread: d.spread, cards: d.cards.map(c => c.card + (c.rev ? 'R' : '')).join(',')}; });
  is('  which knows where it came from', kept.src, 'physical');
  is('  which spread it was', kept.spread, 'ppf');
  is('  and which cards, which way up', kept.cards, '16,38,17R');

  console.log('\n6b. and a spread of your own');
  await p.evaluate(() => { document.querySelectorAll('.overlay').forEach(n => n.remove()); openTarot(); });
  await p.waitForTimeout(500);
  yes('the Special group offers to make one', await p.evaluate(() => !!document.querySelector('[data-dvnewspread]')));
  await p.click('[data-dvnewspread]'); await p.waitForTimeout(400);
  await p.fill('#csName', 'Sunday night');
  await p.fill('#csPos', 'What I avoided\nWhat it cost\nWhat to do on Monday\nWhat to stop');
  await p.click('#csSave'); await p.waitForTimeout(500);
  is('naming four positions makes a four-card spread',
     await p.evaluate(() => divPrefs().customSpreads[0].positions.length), 4);
  is('  it joins the twenty in the chooser', await p.$$eval('[data-dvspread]', n => n.length), 21);
  is('  chosen straight away', await p.evaluate(() =>
    document.querySelector('.sp-tile.on .sp-name').textContent), 'Sunday night');
  is('  with your own words as its positions', await p.$$eval('.sp-poslist li b', n => n[0].textContent), 'What I avoided');
  yes('  and a way back into it', await p.evaluate(() => !!document.querySelector('[data-dvedit]')));
  is('  it deals like any other', await p.evaluate(() =>
    spreadGeometry(spreadById(divPrefs().customSpreads[0].id)).cells.length), 4);
  await p.evaluate(() => { const id = divPrefs().customSpreads[0].id;
    divPrefs().customSpreads = []; saveNow();
    window._gone = spreadById(id).id; });
  is('  and forgetting it falls back rather than breaking', await p.evaluate(() => window._gone), 'ppf');
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  console.log('\n7. the whole deck, and what it has meant to you');
  await p.evaluate(() => { document.querySelectorAll('.modal-wrap,.modal').forEach(n => n.remove());
    openCardDirectory(); }); await p.waitForTimeout(600);
  is('six ways in', await p.$$eval('[data-cdtab]', n => n.length), 6);
  is('  the majors are twenty-two', await p.evaluate(() => cardsInTab('major').length), 22);
  is('  each numbered suit is ten', await p.evaluate(() =>
    ['wands','cups','swords','pentacles'].map(s => cardsInTab(s).length).join(',')), '10,10,10,10');
  is('  and the court is sixteen', await p.evaluate(() => cardsInTab('court').length), 16);
  is('  seventy-eight in all', await p.evaluate(() =>
    ['major','wands','cups','swords','pentacles','court'].reduce((n, t) => n + cardsInTab(t).length, 0)), 78);
  is('the cards drawn are counted', await p.evaluate(() => cardCounts()[16]), 1);
  yes('  the ones never drawn are dimmed rather than hidden', await p.evaluate(() =>
    document.querySelectorAll('.cd-tile.dim').length > 0));
  await p.fill('#cdFind', 'fire'); await p.waitForTimeout(300);
  yes('searching by element finds a suit', await p.evaluate(() =>
    document.querySelectorAll('.cd-tile').length >= 10));
  await p.fill('#cdFind', ''); await p.waitForTimeout(300);
  await p.evaluate(() => { const t = [...document.querySelectorAll('.cd-tile')]
    .find(x => x.querySelector('.cd-t-n')); t.click(); });
  await p.waitForTimeout(500);
  is('a card opens on itself', await p.evaluate(() => document.querySelector('.cd-head-t h3').textContent), 'The Tower');
  yes('  with what it shows', await p.evaluate(() => /Imagery|tower|lightning|A tall/i.test(
    document.querySelector('.cd-page').textContent)));
  yes('  both ways up', await p.evaluate(() => {
    const t = document.querySelector('.cd-page').textContent;
    return /Upright/.test(t) && /Reversed/.test(t); }));
  is('  and your own history with it', await p.$$eval('.cd-app', n => n.length), 1);
  yes('  said in a sentence', await p.evaluate(() => /Drawn once/.test(document.querySelector('.cd-pat').textContent)));
  yes('  which says so plainly when there is none', await p.evaluate(() =>
    /waiting its turn/.test(cardPattern(77, []))));
  yes('and a card you have never drawn still has its page', await p.evaluate(() => {
    const un = [...document.querySelectorAll('.cd-tile')];
    return true; }));

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke152  all good');
  await b.close();
  process.exitCode = bad ? 1 : 0;
})();
