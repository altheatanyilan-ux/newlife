/* smoke194 — a deck you can throw away, and a deck that runs by its own rules.

   Two complaints, and they are the same complaint twice: the shelf was
   somebody else's. You could make a deck but not open it again, and you could
   not remove the six the room arrived with, so a Study Deck for somebody who
   does not study Japanese had four Japanese decks on it for ever.

   THROWING ONE AWAY. Any deck goes, the shipped ones included. Two things
   make that safe rather than frightening. The cards outlive it — they move to
   a deck you name, and they are only deleted if you say so in as many words.
   And it stays gone: a shipped deck is remembered as retired, because a
   delete that quietly undoes itself on the next load teaches you not to trust
   the button. The single refusal is the last deck, since a card has to be
   filed somewhere.

   RUNNING ONE. A deck of two hundred kanji and a deck of eleven mental models
   want completely different days, so the daily limits, the graduation
   distance and the order are per-deck. Every one of them is blank by default
   and blank means "whatever the room says" — an override you have to set on
   every deck before the room works is a form, not a choice. Blank is not
   zero: no new cards a day is a real instruction and has to stay tellable
   from never having said. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1400, height:1000}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2000); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));
  await p.evaluate(() => { location.hash = '#/study'; }); await p.waitForTimeout(1700);
  const shut = () => p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  console.log('\n1. every deck can be opened again, the shipped ones included');
  const gears = await p.evaluate(() => ({
    decks: studyDecks().length,
    gears: [...document.querySelectorAll('[data-sdgear]')].map(g => g.dataset.sdgear)}));
  is('there is a way into every one of them', gears.gears.length, gears.decks);
  yes('  including the sub-decks', gears.gears.includes('ja_grammar'), JSON.stringify(gears.gears));
  await p.evaluate(() => document.querySelector('[data-sdgear="mindsets"]').click());
  await p.waitForTimeout(700);
  const open = await p.evaluate(() => ({
    name: document.querySelector('#dkName')?.value,
    swatches: document.querySelectorAll('[data-dkcol]').length,
    picked: document.querySelector('[data-dkcol].on')?.dataset.dkcol,
    rules: ['#dk_newPerDay','#dk_reviewsPerDay','#dk_graduateAt','#dkOrder'].filter(x => !!document.querySelector(x)).length,
    blank: ['#dk_newPerDay','#dk_reviewsPerDay','#dk_graduateAt'].every(x => document.querySelector(x).value === ''),
    says: document.querySelector('#dk_newPerDay').placeholder,
    del: !!document.querySelector('#dkDel')}));
  is('  it opens on the deck it was pressed for', open.name, 'Mindsets & Principles');
  is('  with a palette rather than a colour wheel', open.swatches, 9);
  is('    and the one it is already wearing marked', open.picked, '#8a6a5e');
  is('  four things it may decide for itself', open.rules, 4);
  yes('  all of them blank, meaning "as the room does"', open.blank);
  is('    with what the room does shown as the placeholder', open.says, '20');
  yes('  and a shipped deck offers to be thrown away like any other', open.del);
  await shut();

  console.log('\n2. blank is not zero');
  const kept = await p.evaluate(() => {
    const d = studyDeck('divination');
    d.newPerDay = 0; d.reviewsPerDay = null; saveNow();
    return {zero: studyRule('divination', 'newPerDay'),
      blank: studyRule('divination', 'reviewsPerDay'),
      roomReviews: studyState().settings.reviewsPerDay};
  });
  is('a deck told "no new cards" gets none', kept.zero, 0);
  is('  while one that never said follows the room', [kept.blank, kept.roomReviews], [100, 100]);
  /* and the queue honours it: this is the whole point of the setting */
  const capped = await p.evaluate(() => {
    const st = studyState();
    st.cards = st.cards.filter(c => c.deckId !== 'divination');
    for(let i = 0; i < 6; i++) st.cards.push(newStudyCard({deckId:'divination', front:'s194 new ' + i, back:'x'}));
    st.cards.push(newStudyCard({deckId:'divination', front:'s194 seen', back:'x', reps:3, interval:4}));
    saveNow();
    const none = studyQueue('divination').map(c => c.front);
    studyDeck('divination').newPerDay = 2; saveNow();
    const two = studyQueue('divination').filter(c => !c.reps).length;
    studyDeck('divination').newPerDay = null; saveNow();
    return {none, two, room: studyQueue('divination').filter(c => !c.reps).length};
  });
  is('no new cards means only the ones you have seen before', capped.none, ['s194 seen']);
  is('  two means two', capped.two, 2);
  is('  and blank goes back to the room\'s twenty', capped.room, 6);

  console.log('\n3. the deck decides its own order and its own graduation');
  const own = await p.evaluate(() => {
    const st = studyState();
    st.settings.order = 'due_first';
    studyDeck('divination').order = 'new_first';
    saveNow();
    const q = studyQueue('divination');
    /* new_first reverses the seen-then-new queue, so a new card leads it */
    const leads = !q[0].reps;
    studyDeck('divination').order = null;
    /* graduation is read off the card's own deck rather than the room */
    studyDeck('divination').graduateAt = 40;
    const c = newStudyCard({deckId:'divination', front:'s194 far out', back:'x', reps:9, interval:60, ease:2.5});
    st.cards.push(c);
    studyAnswer(c.id, 'good');
    const far = studyCard(c.id).status;
    const c2 = newStudyCard({deckId:'mindsets', front:'s194 far out too', back:'x', reps:9, interval:60, ease:2.5});
    st.cards.push(c2);
    studyAnswer(c2.id, 'good');
    return {leads, far, roomDeck: studyCard(c2.id).status, roomAt: st.settings.graduateAt};
  });
  yes('an order of its own is obeyed', own.leads);
  is('  a deck that graduates past forty days graduates it', own.far, 'graduated');
  is('    while the room still says a hundred and eighty', own.roomAt, 180);
  is('    so the same card in another deck stays in the rotation', own.roomDeck, 'active');

  console.log('\n4. throwing one away moves the cards rather than burning them');
  const thrown = await p.evaluate(() => {
    const st = studyState();
    const d = {id:'s194d', name:'Throwaway', emoji:'🗑', color:'#6b7f8e', about:'', parentId:null};
    st.decks.push(studyDeckDefaults(d));
    st.cards.push(newStudyCard({id:'s194c1', deckId:'s194d', front:'s194 kept', back:'x'}));
    st.cards.push(newStudyCard({id:'s194c2', deckId:'s194d', front:'s194 kept too', back:'x'}));
    const res = removeStudyDeck('s194d', {moveTo:'divination'});
    return {res, gone: !studyDeck('s194d'),
      where: [studyCard('s194c1')?.deckId, studyCard('s194c2')?.deckId],
      front: studyCard('s194c1')?.front};
  });
  yes('the deck is gone', thrown.gone && thrown.res.ok, JSON.stringify(thrown.res));
  is('  and both cards are where you sent them', thrown.where, ['divination','divination']);
  is('  word for word', thrown.front, 's194 kept');
  is('  which it says out loud', thrown.res.moved, 2);

  console.log('\n5. a deck takes its sub-decks with it, and its cards still land');
  const family = await p.evaluate(() => {
    const st = studyState();
    st.cards.push(newStudyCard({id:'s194g', deckId:'ja_grammar', front:'s194 grammar', back:'x'}));
    const before = studyDecks().length;
    const res = removeStudyDeck('japanese', {moveTo:'mindsets'});
    return {res, before, after: studyDecks().length,
      kids: ['ja_grammar','ja_vocab','ja_corrections'].filter(id => !!studyDeck(id)),
      card: studyCard('s194g')?.deckId};
  });
  is('the parent and its three go together', family.res.removed, 4);
  is('  none of them is left on the shelf', family.kids, []);
  is('  and a card from inside one of them lands where you said', family.card, 'mindsets');

  console.log('\n6. a shipped deck stays thrown away');
  const stays = await p.evaluate(() => {
    const st = studyState();
    const retired = st.retired.slice();
    /* the same thing the next load does: build the shelf again from the save */
    const again = studyState();
    return {retired, back: ['japanese','ja_grammar','ja_vocab','ja_corrections'].filter(id => !!byId(again.decks, id))};
  });
  yes('it is remembered as retired', stays.retired.includes('japanese'), JSON.stringify(stays.retired));
  is('  and building the shelf again does not hand it back', stays.back, []);
  /* one you made yourself needs no remembering: nothing would return it */
  yes('  a deck of your own is not on that list', !stays.retired.includes('s194d'), JSON.stringify(stays.retired));

  console.log('\n7. the cards may be deleted, but only in as many words');
  const burnt = await p.evaluate(() => {
    const st = studyState();
    const d = {id:'s194b', name:'Mistake', emoji:'💀', color:'#6b7f8e', about:'', parentId:null};
    st.decks.push(studyDeckDefaults(d));
    st.cards.push(newStudyCard({id:'s194x', deckId:'s194b', front:'s194 burnt', back:'x'}));
    const n = st.cards.length;
    const res = removeStudyDeck('s194b', {deleteCards:true});
    return {res, card: !!studyCard('s194x'), lost: n - studyState().cards.length};
  });
  is('asked to, it deletes them with the deck', burnt.res.deleted, 1);
  is('  and they are really gone', [burnt.card, burnt.lost], [false, 1]);

  console.log('\n8. the last deck will not go');
  /* emptied the honest way — one at a time, through the same door, until one
     is left. Assigning the shelf by hand would not reach the guard, because
     building the state hands the shipped decks back. */
  const last = await p.evaluate(() => {
    const tries = [];
    for(let i = 0; i < 20; i++){
      const tops = studyTopDecks();
      if(tops.length <= 1 && !studyDecks().some(d => d.parentId)) break;
      tries.push(removeStudyDeck(tops[tries.length % tops.length].id, {}));
    }
    const only = studyDecks()[0];
    const card = newStudyCard({id:'s194o', deckId:only.id, front:'s194 alone', back:'x'});
    studyState().cards.push(card);
    const res = removeStudyDeck(only.id, {});
    return {res, left: studyDecks().length, still: !!studyDeck(only.id),
      card: studyCard('s194o')?.deckId, onlyId: only.id};
  });
  is('it can be emptied down to one', last.left, 1);
  yes('  and the last one refuses to go', !last.res.ok && last.still, JSON.stringify(last.res));
  yes('    saying why', /every deck/.test(last.res.why || ''), last.res.why);
  is('    so the card it holds still has somewhere to be', last.card, last.onlyId);

  console.log('\n9. a card is never left filed in a deck that is not there');
  const orphan = await p.evaluate(() => {
    const st = studyState();
    st.cards.push(newStudyCard({id:'s194orph', deckId:'a-deck-that-never-was', front:'s194 orphan', back:'x'}));
    const again = studyState();
    const home = studyHomeId(again.decks);
    return {where: studyCard('s194orph').deckId, home, onShelf: !!studyDeck(studyCard('s194orph').deckId)};
  });
  yes('it is brought home when the shelf is built', orphan.onShelf, JSON.stringify(orphan));
  is('  to the first deck there is', orphan.where, orphan.home);

  console.log('\n10. the shelf says which decks run by their own rules');
  await p.evaluate(() => {
    /* a clean shelf: earlier sections left overrides scattered about */
    const st = studyState();
    st.decks.forEach(d => { d.newPerDay = d.reviewsPerDay = d.graduateAt = d.order = null; });
    st.decks[0].newPerDay = 3;
    saveNow(); S._studyView = 'decks'; location.hash = '#/study'; rerender(); });
  await p.waitForTimeout(1300);
  const said = await p.evaluate(() => (document.querySelector('.sd-deck-rule') || {}).textContent || '');
  yes('a deck with an override wears it on its face', /3 new a day/.test(said), said);
  await p.evaluate(() => { studyState().decks.forEach(d => { d.newPerDay = null; }); saveNow(); rerender(); });
  await p.waitForTimeout(1100);
  is('  and one that follows the room says nothing',
    await p.evaluate(() => document.querySelectorAll('.sd-deck-rule').length), 0);

  console.log('\n11. the way through it, by hand');
  await p.evaluate(() => { location.hash = '#/study'; rerender(); }); await p.waitForTimeout(1400);
  const made = await p.evaluate(() => {
    document.querySelector('#sdNewDeck').click();
    return !!document.querySelector('#dkName');
  });
  yes('the new-deck button opens the same editor', made);
  await p.evaluate(() => {
    document.querySelector('#dkName').value = 'Ottoman tax law';
    document.querySelector('#dkEmoji').value = '🏛';
    document.querySelector('[data-dkcol="#7f6a8e"]').click();
    document.querySelector('#dk_newPerDay').value = '5';
    document.querySelector('#dkOrder').value = 'mixed';
    document.querySelector('#dkSave').click();
  });
  await p.waitForTimeout(900);
  const fresh = await p.evaluate(() => { const d = studyDecks().find(x => x.name === 'Ottoman tax law');
    return d && {color: d.color, emoji: d.emoji, newPerDay: d.newPerDay, order: d.order,
      reviews: d.reviewsPerDay, grad: d.graduateAt}; });
  is('and what you chose is what it is', fresh,
    {color:'#7f6a8e', emoji:'🏛', newPerDay:5, order:'mixed', reviews:null, grad:null});
  /* pressing the gear on it and pressing throw-away reaches the second modal */
  await p.evaluate(() => { const d = studyDecks().find(x => x.name === 'Ottoman tax law');
    openDeckModal(studyDeck(d.id)); document.querySelector('#dkDel').click(); });
  await p.waitForTimeout(700);
  const asks = await p.evaluate(() => ({heading: document.querySelector('.modal h2')?.textContent,
    yes: !!document.querySelector('#dkYes'), no: !!document.querySelector('#dkNo')}));
  yes('throwing it away asks first', /Throw away/.test(asks.heading || '') && asks.yes && asks.no, JSON.stringify(asks));
  await p.evaluate(() => document.querySelector('#dkYes').click()); await p.waitForTimeout(900);
  yes('  and pressing it through removes the deck',
    await p.evaluate(() => !studyDecks().some(x => x.name === 'Ottoman tax law')));

  console.log('\n12. nothing threw');
  is('no page errors', errs, []);

  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
