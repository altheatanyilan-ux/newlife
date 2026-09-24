/* smoke209 — the Jazz Studio, with the real book in it.

   The room was built first against eighteen exercises written here. What it
   holds now is the curriculum itself: Stage P0 and Stages 1 to 12 out of
   Siskind's three books, seventy-six exercises, each one citing the page it
   came from, each one carrying its own way of being written out in any key.
   That arrived as three files and is kept as it arrived, because a
   curriculum retyped is a curriculum with new mistakes in it.

   Which moves where the risk is. It is no longer in the music theory — that
   is somebody's published teaching. It is in the seam: seventy-six entries
   naming their generator by string, passing arguments by name, and a room
   that has to resolve every one of them and get notation back. A name that
   does not resolve, an argument list a generator does not accept, a key
   spelling it cannot handle — each of those is silent, and each of them only
   shows up in the one exercise and the one key nobody opened.

   SO THE CLAIM THAT MATTERS IS THE DULL ONE. Every exercise in the book, in
   every one of the twelve keys, must produce notation. Nine hundred and
   twelve of them. Writing them out is cheap and is done exhaustively;
   engraving them was going to be sampled until it turned out to cost two
   minutes to do the lot. So both are exhaustive: nine hundred and twelve
   documents written, and nine hundred and twelve of them drawn.

   TWO GUARDS HERE ARE NOT COVERED. The catalogue is filtered for
   cross-reference entries \u2014 signposts rather than exercises \u2014 and
   nothing in the book is currently both a signpost and on a listed stage,
   so removing that filter changes nothing. And the generated scores never
   contain an empty bar, so the setting that fills empty bars with a rest
   nobody prints is inert for this room. Both stay: the first because the
   next version of the book may well add one, the second because it costs
   nothing and the room shares its engraver with the score room. Neither is
   proven by anything below.
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

  console.log('\n1. the whole book is in the room');
  const book = await p.evaluate(() => {
    const ladder = jazzStages();
    const ids = ladder.flatMap(s => s.subs);
    const G = JazzExerciseGenerator;
    return {stages: ladder.map(s => s.id), n: ids.length,
      pianoN: ladder.filter(s => !/^V/.test(String(s.id))).flatMap(s => s.subs).length,
      /* the seam: every generator the catalogue names by string */
      missing: ids.map(jazzExercise).filter(e => e.gen && typeof G[e.gen] !== 'function')
        .map(e => `${e.id}:${e.gen}`),
      noScore: ids.map(jazzExercise).filter(e => !jazzHasScore(e)).map(e => e.id),
      /* since Curriculum v3, what has nothing to draw is what the document
         says is not notation: theory, drills, improvising, listening,
         worksheets. A NOTATION entry with nothing to draw would be a gap. */
      notationUndrawn: ids.map(jazzExercise).filter(e => !jazzHasScore(e) && e.type === 'NOTATION').map(e => e.id),
      sourced: ids.map(jazzExercise).filter(e => e.source).length,
      /* the room's own exercises carry a why; the document's entries carry
         its description, which is the same thing said by the document */
      why: ids.map(jazzExercise).filter(e => e.why || (e.v3 && (e.v3.description || e.v3.theory))).length,
      dupes: ids.length - new Set(ids).size};
  });
  is('the ladder runs from the intervals to where the studying stops, with its two tracks',
    book.stages, ['P0','1','2','3','4','5','6','7','8','9','DT','10','11','12','V1','V2','V3','V4','V5','V6']);
  yes('  with seventy-odd exercises on it', book.n >= 70, String(book.n));
  is('  and none of them twice', book.dupes, 0);
  /* the seam, stated as a claim rather than hoped for */
  is('every generator the book names is one this copy has', book.missing, []);
  is('  and every exercise says why it is there', book.why, book.n);
  yes('  and which page of the book it came from',
    book.sourced >= book.n - 2, `${book.sourced} of ${book.n}`);
  is('  and what has nothing to draw is never something the document calls notation', book.notationUndrawn, []);

  console.log('\n2. every exercise, in every key, comes out as notation');
  const written = await p.evaluate(() => {
    const ids = jazzStages().flatMap(s => s.subs).filter(id => jazzHasScore(jazzExercise(id)));
    const threw = [], empty = [], wild = [];
    let n = 0;
    for(const id of ids){
      const ex = jazzExercise(id);
      for(const key of JAZZ_KEY_NAMES){
        let res = null;
        try { res = jazzScoreXml(ex, key, {interval:'major3rd'}); }
        catch(e){ threw.push([id, key, e.message]); continue; }
        n++;
        /* an exercise with more than one example, or the document's version
           beside the room's, comes back as several documents: each is checked */
        const xml = res && res.documents ? res.documents.map(d => d.mxl).join('\n') : res;
        if(!xml || !/<score-partwise/.test(xml) || !/<note[ >]/.test(xml)){ empty.push([id, key]); continue; }
        /* a note nobody could read: more than a double sharp or double flat */
        for(const m of xml.matchAll(/<alter>(-?\d+)<\/alter>/g))
          if(Math.abs(+m[1]) > 2){ wild.push([id, key, m[1]]); break; }
      }
    }
    return {n, threw: threw.slice(0, 5), nThrew: threw.length,
      empty: empty.slice(0, 5), nEmpty: empty.length,
      wild: wild.slice(0, 5), nWild: wild.length};
  });
  yes('that is nine hundred of them', written.n >= 850, String(written.n));
  is('  none of which throws', written.nThrew, 0);
  if(written.nThrew) console.log('     ' + JSON.stringify(written.threw));
  is('  none of which comes back empty', written.nEmpty, 0);
  if(written.nEmpty) console.log('     ' + JSON.stringify(written.empty));
  /* the check that caught a voicing bug in seventy-two places last time */
  is('  and no note in any of them needs more than a double accidental', written.nWild, 0);
  if(written.nWild) console.log('     ' + JSON.stringify(written.wild));

  console.log('\n3. and the engraver can draw them');
  await p.evaluate(() => osmdBoot()); await p.waitForTimeout(3500);
  /* Every pairing, engraved. It was going to be a sample \u2014 one hard key
     each \u2014 and the whole lot turned out to cost a couple of minutes, which
     is a cheap price for the difference between believing this and knowing
     it. A generator that is wrong is wrong silently, and only in the key
     nobody opened. */
  const drawn = await p.evaluate(async () => {
    const box = document.createElement('div');
    box.style.width = '760px'; document.body.appendChild(box);
    const lib = await osmdBoot();
    const bad = [];
    let n = 0, heads = 0;
    const ids = jazzStages().flatMap(s => s.subs).filter(id => jazzHasScore(jazzExercise(id)));
    const pairs = [];
    ids.forEach(id => JAZZ_KEY_NAMES.forEach(key => pairs.push([id, key])));
    for(const [id, key] of pairs){
      const res = jazzScoreXml(jazzExercise(id), key, {interval:'major3rd'});
      const xml = res && res.documents ? res.documents[0].mxl : res;
      try {
        const o = new lib.OpenSheetMusicDisplay(box, {autoResize:false, backend:'svg',
          drawTitle:false, drawComposer:false, drawCredits:false, drawPartNames:false,
          drawMeasureNumbers:false});
        const r = o.EngravingRules || o.rules;
        if(r) r.FillEmptyMeasuresWithWholeRest = 2;
        await o.load(xml); o.zoom = 1; o.render();
        const h = box.querySelectorAll('.vf-notehead').length;
        if(!h) bad.push([id, key, 'nothing drawn']);
        heads += h; n++;
      } catch(e){ bad.push([id, key, e.message]); }
      box.innerHTML = '';
    }
    box.remove();
    return {n, heads, bad: bad.slice(0, 5), nBad: bad.length};
  });
  is('every exercise in the book draws in every one of the twelve keys', drawn.nBad, 0);
  yes('  which is nine hundred engravings, not a sample',
    drawn.n >= 850, String(drawn.n));
  if(drawn.nBad) console.log('     ' + JSON.stringify(drawn.bad));
  yes('  with notes on the page', drawn.heads > drawn.n, `${drawn.heads} noteheads over ${drawn.n} scores`);
  const twelve = await p.evaluate(async () => {
    const box = document.createElement('div');
    box.style.width = '760px'; document.body.appendChild(box);
    const lib = await osmdBoot();
    const bad = [];
    for(const key of JAZZ_KEY_NAMES){
      try {
        const o = new lib.OpenSheetMusicDisplay(box, {autoResize:false, backend:'svg',
          drawTitle:false, drawComposer:false, drawCredits:false, drawPartNames:false,
          drawMeasureNumbers:false});
        const r = o.EngravingRules || o.rules;
        if(r) r.FillEmptyMeasuresWithWholeRest = 2;
        await o.load(jazzScoreXml(jazzExercise('2.1'), key));
        o.zoom = 1; o.render();
        if(!box.querySelectorAll('.vf-notehead').length) bad.push([key, 'nothing drawn']);
      } catch(e){ bad.push([key, e.message]); }
      box.innerHTML = '';
    }
    box.remove();
    return bad;
  });
  is('  and the two-five-one draws in all twelve', twelve, []);

  console.log('\n4. the roadmap says what to do and what not to do yet');
  const road = await p.evaluate(async () => {
    location.hash = '#/jazz';
    await new Promise(r => setTimeout(r, 1200));
    const st = [...document.querySelectorAll('[data-jzstage]')];
    return {n: st.length, open: st.filter(s => !s.classList.contains('shut')).map(s => s.dataset.jzstage),
      rungs: document.querySelectorAll('button.jz-sub[data-jzopen]').length,
      /* twelve pips for a twelve-key exercise, one mark for a single-mark one */
      pips: document.querySelectorAll('.jz-keys:not(.jz-one) > i').length,
      twelves: [...document.querySelectorAll('button.jz-sub[data-jzopen]')].filter(b => !jazzIsSingle(b.dataset.jzopen)).length,
      here: (st.find(s => s.classList.contains('here')) || {dataset:{}}).dataset.jzstage,
      ahead: document.querySelectorAll('.jz-ahead').length};
  });
  /* the piano tab: thirteen stages and the DT track after Stage 9; the
     voice levels are on their own tab */
  const piano = book.stages.filter(s => !/^V/.test(s));
  is('every stage is on the page', road.n, piano.length);
  /* Locking stages was the first design and it was wrong for this room: a
     shelf you cannot look at is a shelf you cannot decide about. Everything
     opens; the ladder is advice. */
  is('  and all of them are open to look at', road.open.length, piano.length);
  is('  so every exercise on them can be reached', road.rungs, book.pianoN);
  is('  each twelve-key one showing twelve pips, one per key', road.pips, road.twelves * 12);
  yes('  with the stage you are actually on marked', road.here === 'P0', road.here);
  yes('    and the ones you have run ahead to saying so', road.ahead >= 12, String(road.ahead));
  /* and the discipline of one-at-a-time is there for anybody who wants it */
  const gated = await p.evaluate(async () => {
    document.querySelector('#jzGate').click();
    await new Promise(r => setTimeout(r, 900));
    const st = [...document.querySelectorAll('[data-jzstage]')];
    const open = st.filter(s => !s.classList.contains('shut')).map(s => s.dataset.jzstage);
    document.querySelector('#jzGate').click();
    await new Promise(r => setTimeout(r, 900));
    return {open, back: [...document.querySelectorAll('[data-jzstage]')]
      .filter(s => !s.classList.contains('shut')).length};
  });
  is('  and it can be made a lock, if that is what you want', gated.open, ['P0']);
  is('    and unlocked again', gated.back, piano.length);

  console.log('\n5. one exercise, its key, and its distance');
  const open = await p.evaluate(async () => {
    document.querySelector('[data-jzopen="P0.1"]').click();
    await new Promise(r => setTimeout(r, 2200));
    const first = document.querySelector('.jz-score svg') ? 1 : 0;
    const said = (document.querySelector('.jz-side') || {}).textContent || '';
    document.querySelector('[data-jzkey="Eb"]').click();
    await new Promise(r => setTimeout(r, 2000));
    const k = jazzUi().key;
    const flat = () => { const n = document.querySelector('.jz-score svg');
      return n ? n.outerHTML.replace(/\sid="[^"]*"/g, '').replace(/vf-[0-9a-z]+/g, '') : ''; };
    const third = flat();
    document.querySelector('[data-jzint="minor7th"]').click();
    await new Promise(r => setTimeout(r, 2000));
    const seventh = flat();
    return {first, key: k, interval: jazzUi().interval, moved: third !== seventh && !!third,
      drew: !!document.querySelector('.jz-score svg'),
      source: /Siskind|interval|P0/i.test(said),
      running: (timeRunning() || {}).categoryId};
  });
  is('opening one draws it', open.first, 1);
  is('  another key changes the key', open.key, 'Eb');
  is('  and the first stage can be asked for a distance too', open.interval, 'minor7th');
  yes('  each of which re-engraves it', open.drew);
  /* the point of the picker: a different distance is different notation,
     not the same two notes with a new label */
  yes('    and a different distance is a different pair of notes', open.moved);
  is('  and the clock is running, as piano', open.running, 'piano');

  /* The mindset passage is the only long piece of prose in the room and it
     was being set in a column seventy pixels wide — eleven characters to a
     line, eighteen lines, one word per line. The grid gave the quote one
     column and dropped the line under it into the ICON's column, which then
     had to be wide enough for a paragraph and took the room the quote
     needed. Measured rather than eyeballed, because "looks fine" is how it
     shipped the first time. */
  const measure = await p.evaluate(() => {
    const q = document.querySelector('.jz-side .jz-werner p');
    const m = document.querySelector('.jz-side .jz-werner .jz-wm');
    const ico = document.querySelector('.jz-side .jz-werner .jz-wi');
    if(!q || !m || !ico) return null;
    const cs = getComputedStyle(q);
    const probe = document.createElement('span');
    probe.style.cssText = `font:${cs.font};visibility:hidden;white-space:pre`;
    probe.textContent = 'x'.repeat(100);
    q.appendChild(probe);
    const per = probe.getBoundingClientRect().width / 100;
    probe.remove();
    const qb = q.getBoundingClientRect(), mb = m.getBoundingClientRect();
    return {chars: Math.round(qb.width / per),
      lines: Math.round(qb.height / parseFloat(cs.lineHeight)),
      /* the quote and the line under it belong to the same column */
      aligned: Math.abs(qb.left - mb.left) < 2,
      /* and both of them start after the figure, not under it */
      afterIcon: qb.left > ico.getBoundingClientRect().right,
      len: q.textContent.trim().length};
  });
  yes('the mindset passage is set at a width somebody could read',
    measure && measure.chars >= 35 && measure.chars <= 78,
    JSON.stringify(measure));
  yes('  rather than a column of single words',
    measure && measure.lines <= Math.ceil(measure.len / 30),
    JSON.stringify(measure));
  yes('  with the line under it in the same column, not under the figure',
    measure && measure.aligned && measure.afterIcon, JSON.stringify(measure));

  console.log('\n6. a key you have is written down, and stays');
  const marked = await p.evaluate(async () => {
    document.querySelector('#jzGot').click();
    await new Promise(r => setTimeout(r, 700));
    await saveNow(); await load();
    return {got: jazzKeysGot('P0.1'), keys: JAZZ_KEY_NAMES.filter(k => jazzRecord('P0.1').keys[k])};
  });
  is('marking a key counts it', marked.got, 1);
  is('  and only that one', marked.keys, ['Eb']);

  console.log('\n7. the cards ask cold, and they are what marks a key off');
  const dealt = await p.evaluate(() => {
    const st = jazzState().settings;
    st.syllabus = ['P0.3']; st.keyMode = 'unmastered'; st.cards = 6;
    /* This claim is about the PLAIN deck spreading across the twelve keys,
       and it was written before the deck also asked the mastery checkpoints.
       A checkpoint card is the same exercise in the same key asked a
       different way, so with them switched on six cards legitimately cover
       four keys rather than five and the claim measures the wrong thing.
       They have a suite of their own; here they are off on purpose. */
    st.checks = false;
    const hand = jazzDeal(st.syllabus, 6, 'unmastered', []);
    st.checks = true;
    return {ids: [...new Set(hand.map(c => c.exerciseId))], n: hand.length,
      spread: new Set(hand.map(c => c.key)).size};
  });
  is('a hand is dealt from the syllabus', dealt.ids, ['P0.3']);
  is('  as many cards as were asked for', dealt.n, 6);
  yes('  and not the same key six times', dealt.spread >= 5, String(dealt.spread));
  const graded = await p.evaluate(() => {
    const grid = [];
    for(let i = 0; i < 3; i++){ jazzGrade('P0.3', 'A', 'nailed', 4);
      grid.push(!!jazzRecord('P0.3').keys['A']); }
    jazzGrade('P0.3', 'A', 'couldnt', 9);
    return {grid, after: !!jazzRecord('P0.3').keys['A'], logged: jazzState().flashes.length};
  });
  is('one clean answer does not mark the key off', graded.grid, [false, false, true]);
  yes('  three of them does', graded.grid[2] === true);
  yes('  and a miss takes it back off', graded.after === false);
  is('  every answer is kept', graded.logged, 4);

  console.log('\n8. the card itself');
  const card = await p.evaluate(async () => {
    const ui = jazzUi();
    ui.flash = {cards:[{exerciseId:'2.1', key:'Ab'}], at:0, shown:false,
      from: Date.now(), got:{nailed:0, struggled:0, couldnt:0}};
    location.hash = '#/jazz/cards';
    await new Promise(r => setTimeout(r, 1000));
    const asked = document.querySelector('.jz-card').textContent.replace(/\s+/g, ' ');
    const hidden = !document.querySelector('.jz-score svg');
    document.querySelector('#jzShow').click();
    await new Promise(r => setTimeout(r, 2200));
    const mine = document.querySelector('#jzCardScore svg');
    const flat = n => n ? n.outerHTML.replace(/\sid="[^"]*"/g, '').replace(/vf-[0-9a-z]+/g, '') : '';
    const drawn = flat(mine);
    const box = document.querySelector('#jzCardScore');
    const again = async key => { box.innerHTML = '';
      await jazzEngrave(box, jazzScoreXml(jazzExercise('2.1'), key));
      await new Promise(r => setTimeout(r, 200));
      return flat(box.querySelector('svg')); };
    const inAb = await again('Ab'), inC = await again('C');
    return {asked, hidden, shown: !!mine, sameKey: drawn === inAb, otherKey: drawn === inC,
      differ: inAb !== inC,
      grades: [...document.querySelectorAll('[data-jzg]')].map(n => n.dataset.jzg)};
  });
  yes('the card asks for one exercise in one key',
    /A♭/.test(card.asked), card.asked.slice(0, 140));
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
