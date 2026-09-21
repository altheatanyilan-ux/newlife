/* smoke212 — the layer a textbook leaves out.

   The catalogue was complete about WHAT to play and silent about everything
   a teacher supplies in the room: the record this came off, the mistake
   everybody makes in week two, how you would know you had it, and what to do
   with it once you did. Nine fields close that gap, at two levels — three on
   a stage, seven on an exercise — and a tenth thing falls out of them: the
   checkpoints become flashcards.

   THE CLAIMS HERE ARE MOSTLY ABOUT COVERAGE AND ABOUT HONESTY. Coverage,
   because seventy-six exercises with one field quietly empty is exactly the
   kind of gap that never gets noticed from the page — you would have to open
   all seventy-six. And honesty, because most of this layer falls back: an
   exercise with no listening of its own shows the stage's, and an exercise
   with no checklist in the source gets the standard rungs. Both are correct
   behaviour and both are indistinguishable from a citation unless the page
   says which it is. So there are claims that the fallbacks happen AND claims
   that they are labelled.

   THE REWRITER IS THE INTERESTING PART. A checkpoint is written about all
   twelve keys — "can play ii-V-I in all 12 keys without pausing" — and a
   card is one of them. Rather than hand-writing a second set of prompts,
   which would drift from the first the moment one was corrected, the
   sentence is turned round: the "Can" comes off and any claim about all
   twelve becomes a claim about the key the card is about to name. Some
   checkpoints cannot survive that — "play all twelve major sevenths
   ascending chromatically" is irreducibly about the twelve — and those are
   kept OFF the deck rather than dealt as a question that cannot be answered
   as asked. That is the same fault, in the same room, that the interval
   flashcards were fixed for.

   WHAT IS NOT CLAIMED. The prose is not claimed to be correct; no test can
   tell whether Red Garland really plays Type A voicings on Billy Boy. What
   is claimed is that every exercise has the fields, that they reach the
   page, that the fallbacks are labelled as fallbacks, and that the cards
   generated from them can be answered.
 */
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
  const p = await (await b.newContext({viewport:{width:1400, height:950}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  console.log('\n1. every exercise carries all seven');
  const cover = await p.evaluate(() => {
    const book = jazzBook();
    const ids = Object.keys(book);
    const gap = {listening:[], mistakes:[], when:[], connections:[], strategy:[], challenge:[], checks:[]};
    ids.forEach(id => { const e = book[id];
      if(!(e.listeningAssignments || []).length) gap.listening.push(id);
      if(!(e.commonMistakes || []).length) gap.mistakes.push(id);
      if(!e.whenToUse) gap.when.push(id);
      if(!(e.connections || []).length) gap.connections.push(id);
      if(!e.practiceStrategy) gap.strategy.push(id);
      if(!e.creativeChallenge) gap.challenge.push(id);
      if(!(e.masteryChecklist || []).length) gap.checks.push(id); });
    return {n: ids.length, gap};
  });
  yes('the catalogue is all there', cover.n === 76, `${cover.n} exercises`);
  is('nothing is missing its listening', cover.gap.listening, []);
  is('nothing is missing its mistakes', cover.gap.mistakes, []);
  is('nothing is missing when you would use it', cover.gap.when, []);
  is('nothing is missing what it joins onto', cover.gap.connections, []);
  is('nothing is missing how to practise it', cover.gap.strategy, []);
  is('nothing is missing something to make with it', cover.gap.challenge, []);
  is('nothing is missing its checkpoints', cover.gap.checks, []);

  /* A listening assignment with no artist or no track is worse than none:
     it looks like a citation and cannot be followed. */
  const recs = await p.evaluate(() => {
    const book = jazzBook();
    const broken = [];
    let n = 0;
    Object.keys(book).forEach(id => (book[id].listeningAssignments || []).forEach(a => { n++;
      if(!a.artist || !a.track || !a.listenFor) broken.push(id + ': ' + JSON.stringify(a).slice(0, 60));
      if(a.year && (a.year < 1900 || a.year > 2030)) broken.push(id + ': year ' + a.year); }));
    return {n, broken};
  });
  yes('every record cited names an artist, a track and what to listen for',
    recs.broken.length === 0, recs.broken.slice(0, 3).join(' | '));
  yes('  and there are a good many of them', recs.n > 100, `${recs.n} citations`);

  console.log('\n2. every stage carries its three');
  const stages = await p.evaluate(() => {
    const gap = [];
    const rungs = [];
    jazzStages().forEach(s => {
      if(!s.historicalContext) gap.push(s.id + ': no history');
      if(!s.typicalTimeToMaster) gap.push(s.id + ': no time');
      if(!JAZZ_DIFFICULTY.includes(s.expectedDifficulty)) gap.push(s.id + ': difficulty ' + s.expectedDifficulty);
      rungs.push(jazzDifficultyRank(s.expectedDifficulty));
    });
    return {n: jazzStages().length, gap, rungs};
  });
  is('all thirteen rungs of the ladder', stages.n, 13);
  is('  and none of them is missing anything', stages.gap, []);
  /* the ladder should get harder, not wander */
  yes('  and the difficulty never goes backwards',
    stages.rungs.every((v, i) => i === 0 || v >= stages.rungs[i - 1]), JSON.stringify(stages.rungs));

  console.log('\n3. a checklist nobody wrote says so');
  const derived = await p.evaluate(() => {
    const book = jazzBook();
    const ids = Object.keys(book);
    const written = ids.filter(id => !book[id].checklistDerived);
    const der = ids.filter(id => book[id].checklistDerived);
    /* the brief asks for three to five rungs on a derived one */
    const wrong = der.filter(id => book[id].masteryChecklist.length < 3 || book[id].masteryChecklist.length > 6);
    return {written: written.sort(), derived: der.length, wrong,
      /* a derived checklist names the exercise it belongs to */
      names: der.slice(0, 3).map(id => book[id].masteryChecklist[0].includes(book[id].name))};
  });
  yes('the ones the source has a checklist for are marked as written',
    derived.written.length >= 10, `${derived.written.length}: ${derived.written.join(' ')}`);
  yes('  and the rest are marked as derived', derived.derived === 76 - derived.written.length);
  is('  every derived ladder is three to six rungs', derived.wrong, []);
  is('  and names the exercise it was derived for', derived.names, [true, true, true]);

  console.log('\n4. a fallback is labelled as a fallback');
  const fall = await p.evaluate(() => {
    const book = jazzBook();
    const own = Object.keys(book).filter(id => !book[id].listeningFromStage);
    const borrowed = Object.keys(book).filter(id => book[id].listeningFromStage);
    /* an exercise that borrows shows the same records as its stage */
    const one = book[borrowed[0]];
    const st = jazzStage(one.stage);
    return {own: own.length, borrowed: borrowed.length,
      matches: JSON.stringify(one.listeningAssignments) === JSON.stringify(st.listeningAssignments),
      id: one.id};
  });
  yes('some exercises cite a record of their own', fall.own >= 8, `${fall.own}`);
  yes('  and the rest borrow their stage’s', fall.borrowed === 76 - fall.own);
  yes('  and what they borrow is exactly the stage’s', fall.matches === true, fall.id);

  console.log('\n5. it reaches the roadmap');
  const road = await p.evaluate(async () => {
    location.hash = '#/jazz'; rerender();
    await new Promise(r => setTimeout(r, 900));
    document.querySelectorAll('.jz-why').forEach(d => d.open = true);
    await new Promise(r => setTimeout(r, 300));
    const txt = document.body.innerText;
    return {badges: document.querySelectorAll('.jz-diff').length,
      howLong: document.querySelectorAll('.jz-howlong').length,
      records: document.querySelectorAll('.jz-rec').length,
      mistakes: document.querySelectorAll('.jz-mistakes li').length,
      guido: txt.includes('Guido d’Arezzo'),
      wall: txt.includes('hit their first real wall'),
      brubeck: txt.includes('Take Five')};
  });
  is('every stage wears its difficulty', road.badges, 13);
  is('  and says how long it honestly takes', road.howLong, 13);
  yes('  and cites its records', road.records >= 20, `${road.records}`);
  yes('  and lists what goes wrong', road.mistakes >= 25, `${road.mistakes}`);
  yes('the history is on the page', road.guido === true);
  yes('  and so is the sentence about the wall in week one', road.wall === true);
  yes('  and so is the last stage’s listening', road.brubeck === true);

  console.log('\n6. it reaches an exercise');
  const ex = await p.evaluate(async () => {
    location.hash = '#/jazz/3.1'; rerender();
    await new Promise(r => setTimeout(r, 1400));
    const txt = document.body.innerText;
    return {checks: document.querySelectorAll('.jz-check').length,
      records: document.querySelectorAll('.jz-rec').length,
      mistakes: document.querySelectorAll('.jz-mistakes li').length,
      conns: document.querySelectorAll('.jz-conns li').length,
      challenge: document.querySelectorAll('.jz-challenge').length,
      garland: txt.includes('Billy Boy'),
      typewriter: txt.includes('typewriter rule'),
      when: txt.includes('bread-and-butter'),
      ladyBird: txt.includes('Lady Bird')};
  });
  is('the exercise shows its checkpoints', ex.checks, 6);
  yes('  and its records', ex.records === 3, `${ex.records}`);
  yes('  and its mistakes', ex.mistakes === 4, `${ex.mistakes}`);
  yes('  and what it joins onto', ex.conns === 3, `${ex.conns}`);
  is('  and something to make with it', ex.challenge, 1);
  yes('the Red Garland track is named', ex.garland === true);
  yes('  and the typewriter rule is warned about', ex.typewriter === true);
  yes('  and it says when you would use it', ex.when === true);
  yes('  and what to go and play', ex.ladyBird === true);

  console.log('\n7. a checkpoint is yours to tick, and the tick survives');
  const tick = await p.evaluate(async () => {
    const id = '3.1';
    const item = jazzExercise(id).masteryChecklist[0];
    jazzSetCheck(id, item, false);
    const before = jazzChecksGot(id);
    const box = document.querySelector('[data-jzchk]');
    box.click();
    await new Promise(r => setTimeout(r, 400));
    const after = jazzChecksGot(id);
    const onDisk = jazzCheckGot(id, item);
    /* and it is keyed by the words rather than by the position, so inserting
       a checkpoint above it does not move the tick to a different claim */
    const byWords = jazzCheckId(item) === jazzCheckId(jazzExercise(id).masteryChecklist[0]);
    const different = jazzCheckId(item) !== jazzCheckId(item + ' at tempo');
    jazzSetCheck(id, item, false);
    return {before: before.done, after: after.done, of: after.of, onDisk, byWords, different};
  });
  is('nothing was ticked to begin with', tick.before, 0);
  is('  and clicking one ticks it', tick.after, 1);
  is('  out of six', tick.of, 6);
  yes('  and it is written down', tick.onDisk === true);
  yes('a tick is keyed by the checkpoint’s own words', tick.byWords === true);
  yes('  so a reworded checkpoint is a different claim', tick.different === true);

  console.log('\n8. the rewriter turns a checkpoint into a question');
  const ask = await p.evaluate(() => ({
    all12:  jazzCheckAsk('Can play ii-V-I in all 12 keys without pausing, in root position'),
    any:    jazzCheckAsk('Can name the 3rd and 7th of any Maj7 chord instantly'),
    roots:  jazzCheckAsk('Can play this interval from all 12 roots in cycle-of-4ths order without pausing'),
    random: jazzCheckAsk('Can SING the interval before playing it, from any random root'),
    six:    jazzCheckAsk('Can play it eyes-closed in at least 6 keys'),
    plain:  jazzCheckAsk('Can play it at ♩=120, one chord per beat'),
    none:   jazzCheckAsk('')}));
  is('the "Can" comes off the front', ask.plain, 'Play it at ♩=120, one chord per beat');
  is('all twelve keys becomes this key', ask.all12, 'Play ii-V-I in this key without pausing, in root position');
  is('all twelve roots becomes this root', ask.roots, 'Play this interval from this root without pausing');
  is('any random root becomes this root', ask.random, 'SING the interval before playing it, from this root');
  is('at least six keys becomes this key', ask.six, 'Play it eyes-closed in this key');
  is('and "any Maj7" becomes "the Maj7"', ask.any, 'Name the 3rd and 7th of the Maj7 chord instantly');
  is('nothing in, nothing out', ask.none, '');

  /* The one that matters most: a checkpoint that cannot be asked about one
     key must not become a card. This is the same fault as an interval card
     with no interval on it — a question that cannot be answered as asked. */
  const cardable = await p.evaluate(() => {
    const book = jazzBook();
    const out = [];
    Object.keys(book).forEach(id => (book[id].masteryChecklist || []).forEach(t => {
      if(!jazzCheckCardable(t)) out.push(id + '|' + t); }));
    return {refused: out,
      twelve: jazzCheckCardable('Can play all 12 Maj7 chords ascending chromatically without stopping'),
      named:  jazzCheckCardable('Can play the 12-bar jazz blues from memory in C, F, G and B♭'),
      /* the sprint's own wording IS rewritten into one root, so it stays a
         card; what cannot be is an order that survives the rewrite */
      sprint: jazzCheckCardable('Can play it from all 12 roots in cycle-of-4ths order'),
      circle: jazzCheckCardable('Can play the whole matrix row ascending chromatically'),
      /* and an exercise CALLED "All 12 Intervals from One Root" is still fine */
      oneRoot: jazzCheckCardable('Can play All 12 Intervals from One Root (Chromatic Staircase) in this key slowly and cleanly, without stopping'),
      ordinary: jazzCheckCardable('Can play it at ♩=100 without the time slipping')};
  });
  yes('a checkpoint about all twelve chords at once is refused', cardable.twelve === false);
  yes('  and one that names its own keys is refused', cardable.named === false);
  yes('  and one about an order across roots is refused', cardable.circle === false);
  yes('  while the sprint, whose wording the rewriter can reduce, stays', cardable.sprint === true);
  yes('an exercise merely CALLED "All 12 Intervals from One Root" is not', cardable.oneRoot === true);
  yes('  and an ordinary checkpoint is not', cardable.ordinary === true);
  yes('only a couple of the shipped checkpoints are refused',
    cardable.refused.length === 2, JSON.stringify(cardable.refused));

  console.log('\n9. the deck asks the checkpoints too');
  const deal = await p.evaluate(() => {
    const st = jazzState().settings;
    st.checks = true;
    /* a clean slate: nothing ticked, nothing marked */
    S.jazz.progress = {};
    /* 1.1 and 5.1 are in here on purpose: between them they carry the only
       two shipped checkpoints that cannot be asked about a single key, so a
       deck drawn from them is where a missing filter would show. */
    const cards = jazzDeal(['3.1', '2.1', '1.1', '5.1'], 40, 'all', []);
    const checks = cards.filter(c => c.check);
    const plain = cards.filter(c => !c.check);
    const twoKey = cards.filter(c => c.toKey);
    const answerable = checks.every(c => jazzCheckCardable(c.check));
    const refused = ['Can play all 12 Maj7 chords ascending chromatically without stopping',
      'Can play the 12-bar jazz blues from memory in C, F, G and B\u266d'];
    const leaked = checks.filter(c => refused.includes(c.check)).map(c => c.check);
    const named = checks.every(c => !!jazzCheckAsk(c.check));
    return {n: cards.length, checks: checks.length, plain: plain.length,
      twoKey: twoKey.length, answerable, named,
      /* every card that needs a second key has one, and no card that does
         not need one has been given one */
      twoKeyOk: checks.every(c => !!c.toKey === jazzCheckTwoKeys(c.check)),
      leaked,
      keysDiffer: twoKey.every(c => c.toKey !== c.key),
      /* and every card still knows which exercise and key it is */
      whole: cards.every(c => c.exerciseId && c.key)};
  });
  is('forty cards were dealt', deal.n, 40);
  yes('some of them are checkpoints', deal.checks >= 8, `${deal.checks}`);
  yes('  and most of them are still "play the thing"', deal.plain > deal.checks,
    `${deal.plain} plain, ${deal.checks} checkpoints`);
  yes('  and every checkpoint dealt can be answered about one key', deal.answerable === true);
  is('  so neither of the two that cannot be is in the deck', deal.leaked, []);
  yes('  and every one of them has words', deal.named === true);
  yes('  and every card knows its exercise and its key', deal.whole === true);
  yes('every voice-leading card that was dealt carries a second key',
    deal.twoKeyOk === true, `${deal.twoKey} of them`);
  yes('  and it is never the same key twice', deal.keysDiffer === true);

  /* Whether a shuffle of forty happens to contain one is luck, and a claim
     that rests on luck is a claim that fails on a Tuesday. So: two keys and
     one exercise, which makes twelve possible checkpoint cards and thirteen
     slots to put them in. All twelve must appear, and two of them are the
     voice-leading one. */
  const certain = await p.evaluate(() => {
    S.jazz.progress = {};
    jazzState().settings.checks = true;
    const cards = jazzDeal(['3.1'], 40, 'custom', ['Eb', 'A']);
    const two = cards.filter(c => c.toKey);
    return {n: cards.length, two: two.length,
      pairs: two.map(c => `${c.key}\u2192${c.toKey}`).sort().filter((v, i, a) => a.indexOf(v) === i),
      allInPool: two.every(c => ['Eb', 'A'].includes(c.toKey)),
      right: two.every(c => jazzCheckTwoKeys(c.check))};
  });
  is('forty again, from one exercise and two keys', certain.n, 40);
  yes('the voice-leading checkpoint is certainly dealt', certain.two >= 2, `${certain.two}`);
  is('  once from each key, to the other one', certain.pairs, ['A\u2192Eb', 'Eb\u2192A']);
  yes('  and the second key is always one you asked for', certain.allInPool === true);
  yes('  and only voice-leading checkpoints get one', certain.right === true);

  /* turning the switch off should leave the deck exactly as it was before
     any of this — the old behaviour is still somebody's preference */
  const off = await p.evaluate(() => {
    jazzState().settings.checks = false;
    const cards = jazzDeal(['3.1', '2.1'], 20, 'all', []);
    jazzState().settings.checks = true;
    return {n: cards.length, checks: cards.filter(c => c.check).length};
  });
  is('with the switch off, twenty cards', off.n, 20);
  is('  and not one of them a checkpoint', off.checks, 0);

  /* a checkpoint you have ticked is a claim the deck takes you at your word on */
  const ticked = await p.evaluate(() => {
    const ex = jazzExercise('3.1');
    ex.masteryChecklist.forEach(t => jazzSetCheck('3.1', t, true));
    const cards = jazzDeal(['3.1'], 30, 'all', []);
    ex.masteryChecklist.forEach(t => jazzSetCheck('3.1', t, false));
    return cards.filter(c => c.check).length;
  });
  is('a checkpoint you have ticked stops being asked', ticked, 0);

  console.log('\n10. and a checkpoint card can be turned over');
  const card = await p.evaluate(async () => {
    const st = jazzState().settings;
    st.syllabus = ['3.1']; st.checks = true; st.cards = 5; st.keyMode = 'all';
    S.jazz.progress = {};
    const ui = jazzUi();
    /* deal by hand so the claim is about a checkpoint card rather than luck */
    const item = jazzExercise('3.1').masteryChecklist.find(t => jazzCheckCardable(t)
      && jazzCheckTwoKeys(t));
    ui.flash = {cards: [{exerciseId:'3.1', key:'Eb', check: item, toKey:'A'}], at:0, shown:false,
      from: Date.now(), got:{nailed:0, struggled:0, couldnt:0}};
    location.hash = '#/jazz/cards'; rerender();
    await new Promise(r => setTimeout(r, 900));
    const front = document.body.innerText;
    const asked = {name: front.includes('ii-V-I Type A Voicing'),
      claim: front.includes(jazzCheckAsk(item)),
      tag: !!document.querySelector('.jz-ctag'),
      both: !!document.querySelector('.jz-cto'),
      noAnswer: !document.querySelector('#jzCardScore')};
    document.querySelector('#jzShow').click();
    await new Promise(r => setTimeout(r, 4200));
    const one = document.querySelector('#jzCardScore');
    const two = document.querySelector('#jzCardScore2');
    const back = {said: document.querySelector('.jz-cask').textContent,
      drawn: !!(one && one.querySelector('svg')),
      drawnTwo: !!(two && two.querySelector('svg'))};
    /* and grading it still marks the exercise and key it was about */
    document.querySelector('[data-jzg="nailed"]').click();
    await new Promise(r => setTimeout(r, 900));
    return {asked, back, nailed: jazzRecord('3.1').nailed['Eb'] || 0};
  });
  yes('the front names the exercise', card.asked.name === true);
  yes('  and asks the checkpoint', card.asked.claim === true);
  yes('  and says it is a checkpoint', card.asked.tag === true);
  yes('  and shows both keys', card.asked.both === true);
  yes('  and gives nothing away before you press', card.asked.noAnswer === true);
  yes('the back says what was asked', /Type A/.test(card.back.said) && /→/.test(card.back.said),
    card.back.said);
  yes('  and engraves the first key', card.back.drawn === true);
  yes('  and the second one too', card.back.drawnTwo === true);
  is('  and grading it counts against that exercise and key', card.nailed, 1);

  console.log('\n11. nothing broke on the way');
  await p.evaluate(() => { S.jazz.progress = {}; jazzState().settings.syllabus = [];
    jazzUi().flash = null; saveNow(); });
  is('no errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
