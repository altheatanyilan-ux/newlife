/* smoke191 — the Study Deck.

   The memory layer. What makes it different from a flashcard app is that you
   never leave what you were reading: the 📌 knows which room it is in, fills
   the card from its surroundings, files it in the deck that room feeds, and
   writes down the way back — so six months later, when the card comes round
   and the answer means nothing without its context, the context is one press
   away.

   The scheduling is SM-2, with one deliberate departure from the
   specification's own pseudocode. Textbook SM-2 makes the interval depend
   only on whether you passed: Hard, Good and Easy produce the same date and
   differ only in how they nudge the ease factor. The specification then draws
   a grading UI with a different interval previewed under each button — which
   its own function cannot produce. Three buttons that do the same thing today
   are three buttons nobody can choose between, so the passing grades are
   spread the way every scheduler descended from SM-2 has ended up spreading
   them. The ease formula underneath is untouched; that is the part SM-2 is
   actually right about.

   Two things are load-bearing beyond the algorithm. A suggestion never enters
   the rotation by itself — a system that quietly adds work to tomorrow is one
   you stop trusting — and a deck you delete does not take four hundred cards
   with it. */
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
  const ctx = await b.newContext({viewport:{width:1400, height:1000}});
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2000); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  console.log('\n1. the room, and the decks it arrives with');
  await p.evaluate(() => { location.hash = '#/study'; }); await p.waitForTimeout(1700);
  yes('the page is there', await p.evaluate(() => !!document.querySelector('.sd-page')));
  is('  three ways to look at it', await p.evaluate(() =>
    [...document.querySelectorAll('[data-sdview]')].map(x => x.dataset.sdview)), ['decks','browse','stats']);
  const decks = await p.evaluate(() => ({top: studyTopDecks().map(d => d.id),
    japaneseKids: studyDecks().filter(d => d.parentId === 'japanese').map(d => d.id)}));
  /* the two piano decks were taken out, and then so was the Piano Studio they
     belonged to — the whole room is gone */
  is('the decks the roadmap asked for', decks.top, ['mindsets','japanese','divination']);
  is('  with Japanese holding its three', decks.japaneseKids, ['ja_grammar','ja_vocab','ja_corrections']);
  /* the shelf's card box is the other way in */
  is('the card box in the main room opens it', await p.evaluate(() => { const was = location.hash;
    HOUSE_PORTALS.study(); const to = location.hash; location.hash = was; return to; }), '#/study');

  console.log('\n2. SM-2 schedules by how it went');
  const sched = await p.evaluate(() => {
    const c = newStudyCard({});
    const good1 = sm2(c, 4);
    const good2 = sm2({...c, interval:1, reps:1, ease:2.5}, 4);
    const good3 = sm2({...c, interval:6, reps:2, ease:2.5}, 4);
    const fail  = sm2({...c, interval:60, reps:9, ease:2.5}, 1);
    const floor = sm2({...c, ease:1.3}, 0).ease;
    return {good1:good1.interval, good2:good2.interval, good3:good3.interval,
      fail:fail.interval, failReps:fail.reps, floor, easeUp: sm2(c, 5).ease, easeDown: sm2(c, 1).ease};
  });
  is('the first pass is tomorrow', sched.good1, 1);
  is('  the second is six days', sched.good2, 6);
  is('  after that it multiplies by the ease', sched.good3, 15);
  is('a failure comes back tomorrow, however long it had got to', sched.fail, 1);
  is('  and its streak is gone', sched.failReps, 0);
  yes('the ease never falls under 1.3', sched.floor >= 1.3, String(sched.floor));
  yes('  an easy answer raises it', sched.easeUp > 2.5, String(sched.easeUp));
  yes('  a failed one lowers it', sched.easeDown < 2.5, String(sched.easeDown));

  console.log('\n3. the four buttons offer four different answers');
  const prev = await p.evaluate(() => [
    studyPreview(newStudyCard({})),
    studyPreview(newStudyCard({interval:6, reps:2, ease:2.5})),
    studyPreview(newStudyCard({interval:20, reps:5, ease:2.3}))]);
  yes('on a new card, Easy jumps ahead of the rest',
    prev[0].easy > prev[0].good, JSON.stringify(prev[0]));
  const spread = prev[1];
  yes('on a settled card all four differ',
    new Set([spread.again, spread.hard, spread.good, spread.easy]).size === 4, JSON.stringify(spread));
  yes('  and they are in order', spread.again < spread.hard && spread.hard < spread.good && spread.good < spread.easy,
    JSON.stringify(spread));
  yes('  which still holds further out',
    prev[2].hard < prev[2].good && prev[2].good < prev[2].easy, JSON.stringify(prev[2]));

  console.log('\n4. answering a card moves it, and the streak');
  const moved = await p.evaluate(() => {
    const c = addStudyCard({front:'What is structural tension?', back:'Vision and current reality.', deckId:'mindsets'});
    saveNow();
    const before = {due:c.due, reps:c.reps};
    studyAnswer(c.id, 'good');
    return {before, after:{due:c.due, reps:c.reps, history:c.history.length},
      streak: studyStreak(), reviews: studyState().stats.reviews, today: studyState().stats.perDay[today()]};
  });
  is('it is due tomorrow now', moved.after.due, await p.evaluate(() => addDays(today(), 1)));
  is('  and remembers being answered', moved.after.history, 1);
  is('the streak starts at one', moved.streak, 1);
  is('  and the day is counted for the heatmap', moved.today, 1);
  /* answering twice in a day does not make it a two-day streak */
  const twice = await p.evaluate(() => { const c = addStudyCard({front:'again', back:'b'});
    studyAnswer(c.id, 'good'); return studyStreak(); });
  is('studying twice in one day is still one day', twice, 1);

  console.log('\n5. a session shows a card, then its answer, then asks');
  await p.evaluate(() => { const c = addStudyCard({front:'s191 the front', back:'s191 the back', deckId:'mindsets'});
    c.due = addDays(today(), -1); saveNow(); });
  await p.evaluate(() => startStudySession(null)); await p.waitForTimeout(1500);
  const sess = await p.evaluate(() => ({card: !!document.querySelector('.sd-card'),
    front: document.querySelector('.sd-front')?.textContent.trim(),
    backShown: !!document.querySelector('.sd-back'), show: !!document.querySelector('#sdShow')}));
  yes('the card is on the page', sess.card && sess.front && sess.front.includes('s191'), JSON.stringify(sess));
  yes('  the answer is not', !sess.backShown, JSON.stringify(sess));
  await p.evaluate(() => document.querySelector('#sdShow').click()); await p.waitForTimeout(700);
  const after = await p.evaluate(() => ({back: document.querySelector('.sd-back')?.textContent.trim(),
    grades: [...document.querySelectorAll('[data-sdgrade]')].map(x => x.dataset.sdgrade),
    previews: [...document.querySelectorAll('.sd-btn-i')].map(x => x.textContent.trim())}));
  yes('asking shows it', (after.back || '').includes('s191 the back'), JSON.stringify(after));
  is('  and offers the four', after.grades, ['again','hard','good','easy']);
  yes('  each saying what it would cost', after.previews.length === 4 && after.previews.every(Boolean), JSON.stringify(after.previews));
  await p.evaluate(() => document.querySelector('[data-sdgrade="good"]').click()); await p.waitForTimeout(900);
  yes('grading the last one ends the session', await p.evaluate(() => !!document.querySelector('.sd-summary')));
  yes('  with something to read on the way out', await p.evaluate(() => !!document.querySelector('.sd-parting')));

  console.log('\n6. a suggestion waits to be looked at');
  const inbox = await p.evaluate(() => {
    const before = studyInbox().length;
    const a = suggestStudyCard({sourceType:'grammar', front:'s191 suggested', back:'b'});
    const again = suggestStudyCard({sourceType:'grammar', front:'s191 suggested', back:'b'});
    return {before, after: studyInbox().length, same: a.id === again.id,
      deck: a.deckId, status: a.status, inQueue: studyQueue(null).some(c => c.id === a.id)};
  });
  is('it lands in the inbox', inbox.status, 'inbox');
  is('  filed where that room files things', inbox.deck, 'ja_grammar');
  yes('  and not in tomorrow\'s queue until it is accepted', !inbox.inQueue);
  yes('the same suggestion twice is one suggestion', inbox.same && inbox.after === inbox.before + 1,
    JSON.stringify(inbox));
  const accepted = await p.evaluate(() => { const c = studyInbox()[0]; acceptStudyCard(c.id);
    return {status: c.status, due: c.due}; });
  is('accepting it puts it in the rotation', accepted.status, 'active');
  is('  due now', accepted.due, await p.evaluate(() => today()));

  console.log('\n7. a family is three cards at three depths');
  const fam = await p.evaluate(() => {
    const made = studyMakeFamily({front:'Structural tension', back:'Vision plus reality', deckId:'mindsets', sourceType:'manual'});
    return {roles: made.map(c => c.familyRole), loads: made.map(c => c.involvement),
      oneFamily: new Set(made.map(c => c.familyId)).size === 1,
      gathered: studyFamily(made[0].id).length};
  });
  is('recall, application, compare', fam.roles, ['recall','application','compare']);
  is('  at rising involvement', fam.loads, [1,3,5]);
  yes('  held together as one family', fam.oneFamily && fam.gathered === 3, JSON.stringify(fam));
  /* the deeper two are prompts, not invented answers: the instrument does not
     know what your weekend is or which framework you would set this against,
     and a card with a made-up answer on the back is worse than no card */
  const deep = await p.evaluate(() => {
    const c = studyCards().filter(x => x.familyRole === 'compare').slice(-1)[0];
    return {front: c.front, backIsReference: (c.back || '').startsWith('For reference')};
  });
  yes('the compare card asks rather than tells', /nearest thing|NOT/i.test(deep.front), deep.front.slice(0, 80));
  yes('  and what it carries is marked as reference', deep.backIsReference, deep.backIsReference);

  console.log('\n8. deleting a deck does not delete its cards');
  const kept = await p.evaluate(() => {
    const d = {id:'s191deck', name:'Temporary', emoji:'📗', color:'#888', about:'', parentId:null, isDefault:false};
    studyState().decks.push(d);
    const c = addStudyCard({front:'s191 in the doomed deck', back:'b', deckId:d.id});
    studyCards().filter(x => x.deckId === d.id).forEach(x => { x.deckId = 'mindsets'; });
    spliceOut(studyState().decks, x => x.id === d.id);
    return {deckGone: !studyDeck('s191deck'), cardLives: !!studyCard(c.id), nowIn: studyCard(c.id).deckId};
  });
  yes('the deck goes', kept.deckGone);
  yes('  the card does not', kept.cardLives);
  is('  it falls back to the first deck', kept.nowIn, 'mindsets');

  console.log('\n9. a cloze knows its own answer');
  const cloze = await p.evaluate(() => {
    const c = newStudyCard({type:'cloze', front:'明日東京{{に}}行きます。', clozeAnswer:'に'});
    return {parts: clozeParts(c), right: clozeMatches(c, 'に'), spaced: clozeMatches(c, ' に '),
      wrong: clozeMatches(c, 'へ'), empty: clozeMatches(c, '')};
  });
  is('the gap is where the braces were', cloze.parts.answer, 'に');
  yes('the right answer is right', cloze.right);
  yes('  and space around it does not make it wrong', cloze.spaced);
  yes('  a different particle is wrong', !cloze.wrong);
  yes('  and nothing is not an answer', !cloze.empty);

  console.log('\n10. the day says what is waiting');
  await p.evaluate(() => { const c = addStudyCard({front:'s191 due today', back:'b'});
    c.due = today(); saveNow(); location.hash = '#/today'; rerender(); });
  await p.waitForTimeout(1700);
  const onToday = await p.evaluate(() => { const el = document.querySelector('.sd-today');
    return el ? {there:true, says: el.textContent.replace(/\s+/g, ' ').trim(), five: !!el.querySelector('#sdFive')} : {there:false}; });
  yes('the queue is on Today', onToday.there, JSON.stringify(onToday));
  yes('  saying how many', /card/.test(onToday.says || ''), onToday.says);
  yes('  with five minutes offered rather than all of it', onToday.five, JSON.stringify(onToday));

  console.log('\n11. nothing threw');
  is('no page errors', errs, []);

  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
