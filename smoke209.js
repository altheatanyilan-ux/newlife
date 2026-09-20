/* smoke209 — the Jazz Studio: a pattern, and the twelve keys it lives in.

   The score room holds pieces. This room holds the other kind of work: the
   two-five-one is not something you learn once, it is something you play in
   every key until the hands go there unasked, and the unit of progress is
   therefore the pattern-in-a-key rather than the pattern.

   Which decides nearly everything below.

   THE NOTATION IS WRITTEN, NOT STORED. Twelve files of the same idea would
   be twelve places to correct it. So an exercise is a list of degrees, and
   the engraving is made when a key is asked for. The claim that matters is
   the dull one: that every exercise in the book draws in every one of the
   twelve keys, because a generator that is wrong is wrong silently and only
   in the keys nobody checked.

   AND THE SPELLING IS BY DEGREE. The easy way to name a pitch is a table of
   twelve names, and every table like that writes the third of an E major
   seventh as A flat — a note that is right to the ear and wrong on the page,
   and that makes a reader stop. A third is two letters up whatever it
   sounds like, so it comes out G sharp. Several claims here are about
   nothing but that, in the keys where it bites.

   THE GRID IS NOT TICKED BY HAND. Twelve keys all feel fine in the twenty
   minutes after you have practised them. So the flashcards ask cold, in a
   key you did not choose, and three clean answers is what marks a key off.
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
  const p = await (await b.newContext({viewport:{width:1500, height:1000}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  console.log('\n1. a note is named by which degree it is, not by its pitch');
  const spelt = await p.evaluate(() => {
    const say = (key, deg, quality, voicing) =>
      jazzVoiceChord(jazzRootOf(key, deg, 4), quality, voicing || 'root').map(n => n.step + (
        n.alter > 0 ? '#'.repeat(n.alter) : n.alter < 0 ? 'b'.repeat(-n.alter) : ''));
    return {E: say('E','I','maj7'), Db: say('Db','ii','min7'), Gb: say('Gb','V','dom7'),
      B: say('B','I','maj7','typeA'), F: say('F','I','dom7'),
      /* every note of every exercise in every key, looking for a name that
         no reader would accept — three sharps on one letter, say */
      wild: (() => { const out = [];
        Object.keys(JAZZ_EXERCISES).forEach(id => JAZZ_KEY_NAMES.forEach(k => {
          const pat = JAZZ_EXERCISES[id].pattern;
          const bars = pat.line ? [{on:'I', chord:'maj7'}] : (pat.bars || []);
          bars.forEach(barDef => {
            const root = jazzRootOf(k, barDef.on || 'I', 4);
            jazzVoiceChord(root, barDef.chord, barDef.voicing || pat.voicing || 'root')
              .forEach(n => { if(Math.abs(n.alter) > 2) out.push([id, k, n.step, n.alter]); });
          });
        }));
        return out; })()};
  });
  /* the one a pitch table always gets wrong */
  is('the third of an E major seventh is a G sharp', spelt.E, ['E','G#','B','D#']);
  is('  and a D flat two chord is spelt in flats', spelt.Db, ['Eb','Gb','Bb','Db']);
  /* Db7 in G flat: its seventh is a kind of C, so C flat, not B */
  is('  and the seventh of the five in G flat is a C flat', spelt.Gb, ['Db','F','Ab','Cb']);
  is('  a B major seventh voicing is all sharps', spelt.B, ['D#','A#','C#','F#']);
  is('  and an F seventh keeps its E flat', spelt.F, ['F','A','C','Eb']);
  is('no note anywhere in the book needs more than a double accidental', spelt.wild, []);

  console.log('\n2. every exercise, in every key, actually draws');
  await p.evaluate(() => osmdBoot());
  await p.waitForTimeout(3500);
  const drawn = await p.evaluate(async () => {
    const box = document.createElement('div');
    box.style.width = '760px'; document.body.appendChild(box);
    const bad = [];
    let n = 0;
    for(const id of Object.keys(JAZZ_EXERCISES)){
      for(const key of JAZZ_KEY_NAMES){
        const xml = jazzScoreXml(JAZZ_EXERCISES[id].pattern, key);
        try {
          const o = new opensheetmusicdisplay.OpenSheetMusicDisplay(box, {autoResize:false,
            backend:'svg', drawTitle:false, drawComposer:false, drawCredits:false,
            drawPartNames:false, drawMeasureNumbers:false});
          await o.load(xml);
          o.zoom = 1; o.render();
          if(!box.querySelector('.vf-notehead')) bad.push([id, key, 'nothing drawn']);
          n++;
        } catch(e){ bad.push([id, key, e.message]); }
        box.innerHTML = '';
      }
    }
    box.remove();
    return {n, bad: bad.slice(0, 6), total: bad.length};
  });
  is('nothing in the book refuses to engrave', drawn.total, 0);
  yes('  and that is every exercise in all twelve keys',
    drawn.n === Object.keys(await p.evaluate(() => JAZZ_EXERCISES)).length * 12,
    String(drawn.n));
  if(drawn.total) console.log('     ' + JSON.stringify(drawn.bad));

  console.log('\n3. the roadmap says what to do and what not to do yet');
  const road = await p.evaluate(async () => {
    location.hash = '#/jazz';
    await new Promise(r => setTimeout(r, 900));
    const stages = [...document.querySelectorAll('[data-jzstage]')];
    return {n: stages.length,
      shut: stages.filter(s => s.classList.contains('shut')).map(s => s.dataset.jzstage),
      open: stages.filter(s => !s.classList.contains('shut')).map(s => s.dataset.jzstage),
      subs: document.querySelectorAll('[data-jzopen]').length,
      pips: document.querySelectorAll('.jz-keys > i').length};
  });
  is('there are eight stages', road.n, 8);
  is('  and only the first is open to start with', road.open, ['s1']);
  yes('  with the rest shut until it is finished', road.shut.length === 7, JSON.stringify(road.shut));
  yes('  and a shut stage offers nothing to open', road.subs === 4, String(road.subs));
  is('  each exercise showing twelve pips, one per key', road.pips, 48);

  console.log('\n4. an exercise, and one key of it');
  const open = await p.evaluate(async () => {
    document.querySelector('[data-jzopen="e-maj7"]').click();
    await new Promise(r => setTimeout(r, 1400));
    const before = document.querySelector('.jz-score svg') ? 1 : 0;
    /* choose a key that is not the one it opened on */
    document.querySelector('[data-jzkey="Eb"]').click();
    await new Promise(r => setTimeout(r, 1400));
    const svg = document.querySelector('.jz-score svg');
    return {drewOnOpen: before, key: jazzUi().key, drew: !!svg,
      lit: !!document.querySelector('[data-jzkey="Eb"].on'),
      running: (timeRunning() || {}).categoryId};
  });
  is('opening one draws it', open.drewOnOpen, 1);
  is('  choosing another key changes the key', open.key, 'Eb');
  yes('  and re-engraves it', open.drew);
  yes('  with that key lit', open.lit);
  /* the clock should not have to be asked twice for piano practice */
  is('  and the clock is running, as piano', open.running, 'piano');

  console.log('\n5. a key you have is written down, and stays');
  const marked = await p.evaluate(async () => {
    document.querySelector('#jzGot').click();
    await new Promise(r => setTimeout(r, 700));
    await saveNow(); await load();
    return {got: jazzKeysGot('e-maj7'), has: !!jazzRecord('e-maj7').keys['Eb'],
      others: JAZZ_KEY_NAMES.filter(k => jazzRecord('e-maj7').keys[k])};
  });
  is('marking a key counts it', marked.got, 1);
  is('  and only that one', marked.others, ['Eb']);
  yes('  and it is still there after a reload', marked.has);

  console.log('\n6. a stage stays shut until the one before it is finished');
  const shut = await p.evaluate(async () => {
    const s2 = jazzStage('s2');
    const before = jazzStageOpen(s2);
    /* all four of stage one, in all twelve */
    jazzStage('s1').subs.forEach(b => JAZZ_KEY_NAMES.forEach(k => jazzSetKey(b.ex, k, true)));
    const after = jazzStageOpen(s2);
    location.hash = '#/jazz';
    await new Promise(r => setTimeout(r, 900));
    return {before, after,
      open: [...document.querySelectorAll('[data-jzstage]')]
        .filter(s => !s.classList.contains('shut')).map(s => s.dataset.jzstage)};
  });
  yes('the second stage is shut while the first is unfinished', shut.before === false);
  yes('  and opens when it is', shut.after === true);
  is('  which the roadmap shows', shut.open, ['s1','s2']);

  console.log('\n7. the cards ask cold, and they are what marks a key off');
  const dealt = await p.evaluate(async () => {
    const st = jazzState().settings;
    st.syllabus = ['e-shell'];
    st.keyMode = 'unmastered';
    st.cards = 6;
    const hand = jazzDeal(st.syllabus, 6, 'unmastered', []);
    return {n: hand.length, ids: [...new Set(hand.map(c => c.exerciseId))],
      keys: hand.map(c => c.key), allKeys: hand.every(c => JAZZ_KEY_NAMES.includes(c.key))};
  });
  is('a hand is dealt from the syllabus', dealt.ids, ['e-shell']);
  is('  as many cards as were asked for', dealt.n, 6);
  yes('  each one a real key', dealt.allKeys, JSON.stringify(dealt.keys));
  yes('  and not the same key six times',
    new Set(dealt.keys).size >= 5, JSON.stringify(dealt.keys));
  const graded = await p.evaluate(() => {
    const seen = [], grid = [];
    for(let i = 0; i < 3; i++){ seen.push(jazzGrade('e-shell', 'A', 'nailed', 4));
      grid.push(!!jazzRecord('e-shell').keys['A']); }
    const got = !!jazzRecord('e-shell').keys['A'];
    /* and a miss takes it back off, because it clearly was not in there */
    jazzGrade('e-shell', 'A', 'couldnt', 9);
    return {seen, grid, got, after: !!jazzRecord('e-shell').keys['A'],
      logged: jazzState().flashes.length};
  });
  is('the answers are counted', graded.seen, [1, 2, 3]);
  /* the grid after each one, which is the claim: one good answer is a good
     answer, not a key you have */
  is('  one clean answer does not mark the key off', graded.grid, [false, false, true]);
  yes('  three of them does', graded.got === true);
  yes('  and a miss takes it back off', graded.after === false);
  is('  every answer is kept', graded.logged, 4);

  console.log('\n8. the card itself');
  const card = await p.evaluate(async () => {
    const ui = jazzUi();
    ui.flash = {cards:[{exerciseId:'e-251-root', key:'Ab'}], at:0, shown:false,
      from: Date.now(), got:{nailed:0, struggled:0, couldnt:0}};
    location.hash = '#/jazz/cards';
    await new Promise(r => setTimeout(r, 900));
    const asked = document.querySelector('.jz-card').textContent.replace(/\s+/g, ' ');
    const score = !!document.querySelector('.jz-score svg');
    document.querySelector('#jzShow').click();
    await new Promise(r => setTimeout(r, 1600));
    const mine = document.querySelector('#jzCardScore svg');
    /* An answer in the wrong key is worse than no answer: it teaches the
       shape in C and calls it A flat. So the drawn notation is compared
       against the same exercise engraved here, in A flat and in C, through
       the same function \u2014 it must be one of them and not the other. */
    const flat = (n) => n ? n.outerHTML.replace(/\sid="[^"]*"/g, '')
      .replace(/vf-[0-9a-z]+/g, '') : '';
    const drawn = flat(mine);
    /* drawn back into the card's own box, so the width and therefore the
       whole layout is identical and only the key can differ */
    const box = document.querySelector('#jzCardScore');
    const ex2 = JAZZ_EXERCISES['e-251-root'];
    box.innerHTML = '';
    await jazzEngrave(box, jazzScoreXml(ex2.pattern, 'Ab'));
    await new Promise(r => setTimeout(r, 200));
    const inAb = flat(box.querySelector('svg'));
    box.innerHTML = '';
    await jazzEngrave(box, jazzScoreXml(ex2.pattern, 'C'));
    await new Promise(r => setTimeout(r, 200));
    const inC = flat(box.querySelector('svg'));
    return {asked, hidden: !score,
      shown: !!mine,
      sameKey: drawn === inAb, otherKey: drawn === inC,
      differ: inAb !== inC,
      grades: [...document.querySelectorAll('[data-jzg]')].map(n => n.dataset.jzg)};
  });
  yes('the card asks for one exercise in one key',
    /two-five-one/i.test(card.asked) && /A♭/.test(card.asked), card.asked.slice(0, 140));
  yes('  with no notation until you say you have played it', card.hidden);
  yes('  and then the answer', card.shown);
  yes('    engraved in the key the card asked for', card.sameKey && !card.otherKey,
    JSON.stringify({sameKey: card.sameKey, otherKey: card.otherKey}));
  yes('    which is a different engraving from the same thing in C', card.differ);
  is('  and three ways to say how it went', card.grades, ['couldnt','struggled','nailed']);

  console.log('\n9. nothing broke on the way');
  is('no errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
