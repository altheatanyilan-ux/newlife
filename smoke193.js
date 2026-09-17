/* smoke193 — the small stopwatch, the two decks that came out, and a deck
   you can ask an AI for.

   Three deliveries in one sitting, and what they have in common is that all
   three are subtraction or its opposite: less furniture standing around doing
   nothing, fewer places keeping the same fact twice, and one new way in that
   removes the only real cost of a spaced-repetition deck — typing the cards.

   THE CLOCK, IDLE, IS A DIAL. The gadget used to take its shape from the
   sidebar alone: sidebar open, clock open. So a panel with two idle buttons on
   it sat in the corner of every page all day announcing that nothing was
   running, which is a lot of furniture for a fact nobody asked for. Now the
   shape follows the work: it opens for a sitting, and for a press, and a press
   is a peek that ends when you fold it away or when the sitting does.

   THE TWO PIANO DECKS. The Piano Studio already keeps a record of a piece and
   a concept. A second copy of both, living in a flashcard queue, was the same
   thing written down in two places — and two records of one fact is one record
   and one lie waiting to happen. They go. What was filed in them does not: the
   decks are removed and the cards move to the first deck, because retiring a
   room is not a reason to burn what was in it.

   A DECK FROM ANYWHERE. A model will write two hundred cards on Ottoman tax
   law at two in the morning; the cost has always been typing them in. So the
   deck has a written format, the room hands you the prompt that asks for it,
   and the import is forgiving about everything except the two things it cannot
   guess — a card with no front, and a gap-fill with no gap. Those it names and
   leaves out, because a wrong card in the deck is worse than one that never
   arrived. Nothing is written until you have seen what it found. */
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

  /* what the gadget is showing, and what the sidebar is doing under it */
  const dock = () => p.evaluate(() => {
    const d = document.getElementById('focusDock');
    return {bubble: !!d.querySelector('.fd-bubble'), card: !!d.querySelector('.fd-card'),
      fold: !!d.querySelector('#fpFold'), stop: !!d.querySelector('#fpStop'),
      narrow: document.documentElement.classList.contains('sb-collapsed')};
  });

  console.log('\n1. with nothing running the clock is a dial, whatever the sidebar is doing');
  await p.evaluate(() => { document.documentElement.classList.remove('sb-collapsed');
    S._fdPeek = false; FocusTimer.stop(); paintFocusDock(true); });
  await p.waitForTimeout(600);
  const idleWide = await dock();
  yes('the sidebar is at its full width', !idleWide.narrow);
  yes('  and the clock is still only the dial', idleWide.bubble && !idleWide.card, JSON.stringify(idleWide));

  console.log('\n2. it opens for a sitting, and closes again when the sitting ends');
  await p.evaluate(() => { FocusTimer.start(); paintFocusDock(true); }); await p.waitForTimeout(600);
  const running = await dock();
  yes('a sitting opens it', running.card && !running.bubble, JSON.stringify(running));
  yes('  with the button that ends the sitting on it', running.stop);
  yes('  the sidebar was not narrowed to do it', !running.narrow);
  await p.evaluate(() => { FocusTimer.stop(); paintFocusDock(true); }); await p.waitForTimeout(600);
  const after = await dock();
  yes('ending it folds the clock away again', after.bubble && !after.card, JSON.stringify(after));
  /* A task parked on the clock is the clock in use, even before the sitting
     starts: it is holding something you put there deliberately, and the name
     on it is the way back to that task. Finishing empties it of both, so no
     parked task is left behind to keep the panel standing open. */
  const parked = await p.evaluate(() => {
    const t = {id: uid(), text:'s193 the one being timed', day: today(), done:false, doneAt:null,
      notes:'', order:0, createdAt:new Date().toISOString(), links:{projects:[], skills:[]}};
    planTaskDefaults(t); S.tasks.push(t); saveNow();
    FocusTimer.setTask(t.id); paintFocusDock(true);
    const held = {card: !!document.querySelector('.fd-card'),
      name: (document.querySelector('.fd-onname') || {}).textContent,
      jump: !!document.querySelector('[data-fdjump]'), idle: FocusTimer.state().idle};
    FocusTimer.stop(); paintFocusDock(true);
    return {held, after: {bubble: !!document.querySelector('.fd-bubble'), task: FocusTimer.state().taskId}};
  });
  yes('a task parked on it opens it, although nothing is running yet',
    parked.held.card && parked.held.idle, JSON.stringify(parked.held));
  is('  and it says which task', parked.held.name, 's193 the one being timed');
  yes('  with the name as the way back to it', parked.held.jump);
  is('finishing empties it of the task as well as the sitting',
    [parked.after.bubble, parked.after.task], [true, null]);

  console.log('\n3. a press is a peek, and the peek ends when you fold it');
  await p.evaluate(() => document.querySelector('#fdOpen').click()); await p.waitForTimeout(600);
  const peek = await p.evaluate(() => ({open: !!document.querySelector('.fd-card'),
    fold: !!document.querySelector('#fpFold'), peek: !!S._fdPeek}));
  yes('pressing the dial opens it although nothing is running', peek.open, JSON.stringify(peek));
  yes('  and it knows it is only peeking', peek.peek);
  yes('  the button on it folds rather than finishes', peek.fold);
  await p.evaluate(() => document.querySelector('#fpFold').click()); await p.waitForTimeout(600);
  const folded = await dock();
  yes('folding it away leaves the dial', folded.bubble && !folded.card, JSON.stringify(folded));
  /* and a peek does not survive the sitting it was opened over: finishing one
     is a moment you want the sidebar back, not a panel left standing open */
  const survives = await p.evaluate(() => {
    S._fdPeek = true; FocusTimer.start(); paintFocusDock(true);
    FocusTimer.stop(); paintFocusDock(true);
    return {peek: !!S._fdPeek, card: !!document.querySelector('.fd-card')};
  });
  is('a peek does not outlive the sitting', [survives.peek, survives.card], [false, false]);

  console.log('\n4. narrowed, it is the dial and nothing else');
  await p.evaluate(() => { document.documentElement.classList.add('sb-collapsed');
    FocusTimer.start(); paintFocusDock(true); }); await p.waitForTimeout(600);
  const narrow = await dock();
  yes('even with a sitting under way', narrow.bubble && !narrow.card, JSON.stringify(narrow));
  await p.evaluate(() => { FocusTimer.stop(); document.documentElement.classList.remove('sb-collapsed');
    S._fdPeek = false; paintFocusDock(true); });

  console.log('\n5. the two piano decks are gone, and nothing filed in them went with them');
  await p.evaluate(() => { location.hash = '#/study'; }); await p.waitForTimeout(1600);
  const decks = await p.evaluate(() => studyDecks().map(d => d.id));
  is('neither is in the defaults', decks.filter(id => id === 'jazz' || id === 'repertoire'), []);
  const moved = await p.evaluate(() => {
    /* a save written before they were retired, with work in both of them */
    const st = studyState();
    st.decks.push({id:'jazz', name:'Jazz Piano', emoji:'🎹', color:'#000', isDefault:true, parentId:null, about:''});
    st.decks.push({id:'repertoire', name:'Repertoire Memory', emoji:'🎼', color:'#000', isDefault:true, parentId:null, about:''});
    st.cards.push(newStudyCard({id:'s193j', deckId:'jazz', front:'ii-V-I in Eb', back:'Fm7 Bb7 Ebmaj7'}));
    st.cards.push(newStudyCard({id:'s193r', deckId:'repertoire', front:'bars 17-24, from memory', back:''}));
    saveNow();
    const again = studyState();
    const j = studyCard('s193j'), r = studyCard('s193r');
    return {decks: again.decks.filter(d => d.id === 'jazz' || d.id === 'repertoire').map(d => d.id),
      where: [j && j.deckId, r && r.deckId], front: j && j.front,
      lands: studyDeck(studySourceDeck('jazz_concept')) ? studySourceDeck('jazz_concept') : null};
  });
  is('a save that still holds them loses them', moved.decks, []);
  is('  but the cards in them move rather than vanish', moved.where, ['mindsets','mindsets']);
  is('  word for word', moved.front, 'ii-V-I in Eb');
  /* the Piano Studio's old capture route named a deck that is not there any
     more; a card with nowhere to land is a card that disappears */
  yes('nothing can be filed into a deck that no longer exists', !!moved.lands, String(moved.lands));

  console.log('\n6. a paste is read before anything is written');
  const read = await p.evaluate(() => {
    const before = studyCards().length;
    const r = studyImportRead(JSON.stringify({
      deck:{name:'Ottoman Tax Law', emoji:'🏛', about:'the fiscal machinery'},
      cards:[
        {type:'text_recall', front:'What was a timar?', back:'A revenue assignment', tags:['ottoman']},
        {question:'And a zeamet?', answer:'A larger one'},
        {type:'cloze', front:'The {{devşirme}} was a levy of boys'},
        {type:'action', front:'Draw the 1500 tax map', reference:'compare with the atlas'},
        {type:'cloze', front:'a gap-fill with no gap in it'},
        {type:'text_recall', front:'a question with no answer'},
        'not a card at all']}));
    return {r, wrote: studyCards().length - before};
  });
  is('reading a paste writes nothing', read.wrote, 0);
  is('  four cards survive it', read.r.rows.length, 4);
  is('  the deck comes out of the paste', [read.r.deck.name, read.r.deck.emoji], ['Ottoman Tax Law', '🏛']);
  /* "question" and "answer" are what a model reaches for unprompted. Refusing
     them would mean doing the typing by hand anyway. */
  is('  a model\'s own words for front and back are understood',
    [read.r.rows[1].front, read.r.rows[1].back], ['And a zeamet?', 'A larger one']);
  is('  and the three it could not use are named, with the reason',
    read.r.problems.map(x => x.at), [5, 6, 7]);
  yes('    the gap-fill with no gap says so', /gap/.test(read.r.problems[0].why), read.r.problems[0].why);
  yes('    the question with no answer says so', /back/.test(read.r.problems[1].why), read.r.problems[1].why);

  console.log('\n7. forgiving about the wrapping, strict about the card');
  const loose = await p.evaluate(() => ({
    fenced: studyImportRead('```json\n{"cards":[{"front":"a","back":"b"}]}\n```').rows.length,
    chatty: studyImportRead('Here you go!\n\n{"cards":[{"front":"a","back":"b"}]}\n\nHope that helps.').rows.length,
    bare:   studyImportRead('[{"front":"a","back":"b"},{"front":"c","back":"d"}]').rows.length,
    bareDeck: studyImportRead('[{"front":"a","back":"b"}]').deck,
    junk:   studyImportRead('sorry, I cannot do that').error,
    none:   studyImportRead('{"cards":[]}').error,
    quiet:  studyImportRead('   ').empty}));
  is('a code fence round it is still a deck', loose.fenced, 1);
  is('  and so is a sentence either side of it', loose.chatty, 1);
  is('  a bare list of cards is a deck with no name yet', [loose.bare, loose.bareDeck], [2, null]);
  yes('prose that is not JSON is refused in words', /not valid JSON/.test(loose.junk), loose.junk);
  yes('  and so is an empty list', /empty/.test(loose.none), loose.none);
  yes('nothing typed yet says nothing at all', loose.quiet);

  console.log('\n8. bringing them in');
  const done = await p.evaluate(() => {
    const parsed = studyImportRead(JSON.stringify({deck:{name:'Ottoman Tax Law', emoji:'🏛'},
      cards:[{type:'text_recall', front:'What was a timar?', back:'A revenue assignment'},
             {type:'cloze', front:'The {{devşirme}} was a levy', options:['devşirme','timar','zeamet','iltizam']}]}));
    const first = studyImportApply(parsed);
    const deck = studyDeck(first.deckId);
    const one = studyCard(first.made[0].id);
    /* the same name a second time fills the deck rather than making another */
    const again = studyImportApply(studyImportRead(JSON.stringify({deck:{name:'ottoman tax law'},
      cards:[{front:'And a zeamet?', back:'A larger one'}]})));
    return {name: deck.name, emoji: deck.emoji, n: first.made.length,
      status: one.status, due: one.due === today(), say: one.sourceLabel, back: one.sourceGo,
      cloze: first.made[1].clozeOptions, sameDeck: again.deckId === first.deckId,
      copies: studyDecks().filter(d => /ottoman/i.test(d.name)).length,
      inDeck: studyDeckCount(first.deckId).total};
  });
  is('a deck that was not there is made', [done.name, done.emoji], ['Ottoman Tax Law', '🏛']);
  is('  with both cards in it', done.n, 2);
  is('  in the rotation, due today', [done.status, done.due], ['active', true]);
  yes('  and every one of them says where it came from', /^Imported /.test(done.say || ''), done.say);
  is('  the multiple choice survives the trip', done.cloze, ['devşirme','timar','zeamet','iltizam']);
  /* importing "Kanji" twice should leave one Kanji deck, not two half-empty ones */
  yes('the same name a second time fills that deck', done.sameDeck && done.copies === 1, JSON.stringify(done));
  is('  so the deck holds all three', done.inDeck, 3);
  const held = await p.evaluate(() => {
    const r = studyImportApply(studyImportRead('[{"front":"held","back":"back"}]'), {hold:true, deckId:'mindsets'});
    return {status: studyCard(r.made[0].id).status, inbox: studyInbox().some(c => c.front === 'held')};
  });
  is('asked to hold them, they wait in the inbox instead', [held.status, held.inbox], ['inbox', true]);

  console.log('\n9. the format is not a claim — a deck can be written back out in it');
  const round = await p.evaluate(() => {
    const id = studyDecks().find(d => d.name === 'Ottoman Tax Law').id;
    const text = studyDeckExport(id);
    const back = studyImportRead(text);
    const cloze = back.rows.find(r => r.type === 'cloze');
    return {deck: back.deck, n: back.rows.length, problems: back.problems.length,
      options: cloze ? cloze.clozeOptions : null};
  });
  is('what comes out goes back in', [round.n, round.problems], [3, 0]);
  is('  with its name on it', round.deck.name, 'Ottoman Tax Law');
  /* the four to choose from are the part a careless export loses: the answer
     is still in the front text, so a deck that lost them would look fine */
  is('  and its four choices with it', round.options, ['devşirme','timar','zeamet','iltizam']);
  /* the prompt that asks for it has to describe the format the parser reads,
     or the whole arrangement is two documents drifting apart */
  const prompt = await p.evaluate(() => STUDY_IMPORT_PROMPT);
  yes('the prompt names every type the parser knows',
    ['text_recall','production','cloze','action'].every(t => prompt.includes(t)), prompt.slice(0, 80));
  yes('  and explains where the gap goes', /\{\{/.test(prompt));

  console.log('\n10. the way in is on the page');
  await p.evaluate(() => { S._studyView = 'decks'; location.hash = '#/study'; rerender(); });
  await p.waitForTimeout(1500);
  yes('there is a button for it beside the one that makes a deck',
    await p.evaluate(() => !!document.querySelector('#sdImport')));
  await p.evaluate(() => document.querySelector('#sdImport').click()); await p.waitForTimeout(800);
  const modal = await p.evaluate(() => ({prompt: !!document.querySelector('#sdImpPrompt'),
    paste: !!document.querySelector('#sdImpText'), out: (document.querySelector('#sdImpOut') || {}).textContent,
    go: document.querySelector('#sdImpGo')?.disabled}));
  yes('it hands you the prompt to ask with', modal.prompt);
  yes('  and somewhere to paste the answer', modal.paste);
  yes('  with nothing to say until you have pasted something', !modal.out);
  yes('  and nothing to press', modal.go);
  await p.evaluate(() => { const ta = document.querySelector('#sdImpText');
    ta.value = '{"deck":{"name":"Kanji"},"cards":[{"front":"日","back":"sun"},{"front":"月","back":"moon"},{"front":"x"}]}';
    ta.dispatchEvent(new Event('input')); });
  await p.waitForTimeout(700);
  const preview = await p.evaluate(() => ({out: document.querySelector('#sdImpOut').textContent.replace(/\s+/g, ' '),
    go: document.querySelector('#sdImpGo').textContent}));
  yes('pasting says how many are ready and where they will go',
    /2 cards ready/.test(preview.out) && /Kanji/.test(preview.out), preview.out.slice(0, 120));
  yes('  and names the one it is leaving out', /1 left out/.test(preview.out), preview.out.slice(0, 200));
  yes('  the button says what it is about to do', /Bring in 2 cards/.test(preview.go), preview.go);
  await p.evaluate(() => document.querySelector('#sdImpGo').click()); await p.waitForTimeout(900);
  const landed = await p.evaluate(() => { const d = studyDecks().find(x => x.name === 'Kanji');
    return {made: !!d, n: d ? studyDeckCount(d.id).total : 0, shut: !document.querySelector('.sd-import')}; });
  is('pressing it brings them in', [landed.made, landed.n], [true, 2]);
  yes('  and the modal is done with', landed.shut);

  console.log('\n11. nothing threw');
  is('no page errors', errs, []);

  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
