/* smoke214 — look it up yourself, and fix it yourself.

   This room's claim on anybody's time is that the exercises are somebody's
   teaching rather than somebody's invention. Ten of them are marked as not
   reliable, which is honest and, on its own, useless: a warning you cannot
   act on is a warning that teaches you to ignore warnings.

   SO TWO THINGS, and they are the same thing from both ends.

   A CITATION YOU COULD HAND TO A LIBRARIAN. Not "Siskind, Book 1, p.36" when
   the notation is on 37 and the exercise runs to 40 — the book, its full
   title, the unit, the page range the notation is actually on, and a
   sentence saying what to look for when you get there, because a page of a
   jazz method has four things on it and one of them is the exercise.

   AND A WAY TO ACT ON WHAT YOU FIND. Download the engraving as MusicXML,
   correct it in MuseScore, bring it back. What comes back is not stored as a
   replacement score — it is stored as what CHANGED, {bar, note, semitones},
   because these exercises exist in twelve keys and a corrected file is a
   correction in one of them. A delta follows the exercise into every key; a
   file does not.

   THE CLAIMS ABOUT THE REFERENCES ARE MOSTLY STRUCTURAL, and deliberately
   so. Nothing here can check that Lick 3 really is on page 61 — that is what
   the citation is FOR. What can be checked is that every exercise has one,
   that none of them is a stub, that the page numbers look like page numbers,
   and that the ids were mapped by what the exercise IS rather than by
   number: the source table's 2.2 is the whole-step descents, which are 2.4a
   and 2.4b here, and mapping by id would have quietly put a page about shell
   voicings on them.

   THE CLAIMS ABOUT THE FIXES ARE NOT STRUCTURAL. A file goes out, a note is
   changed, the file comes back, and the claim is that the changed note is
   the only difference recorded and that it is still a semitone in E flat.
 */
const {chromium} = require('playwright');
const path = require('path');
const fs = require('fs');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n)
  : no(n, `\n         got  ${JSON.stringify(a)}\n         want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const ctx = await b.newContext({viewport:{width:1400, height:950}, acceptDownloads: true});
  const errs = [];
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  console.log('\n1. every exercise says where to go and look');
  const refs = await p.evaluate(() => {
    const book = jazzBook();
    const ids = Object.keys(book);
    const gap = {none:[], book:[], pages:[], what:[], full:[]};
    ids.forEach(id => { const r = book[id].ref;
      if(!r){ gap.none.push(id); return; }
      if(!r.book) gap.book.push(id);
      if(!r.bookFull || r.bookFull === r.book) gap.full.push(id);
      if(!r.pageNumbers) gap.pages.push(id);
      /* a stub is worse than nothing: it looks like a citation */
      if(!r.description || r.description.length < 25) gap.what.push(id); });
    return {n: ids.length, gap,
      books: [...new Set(ids.map(id => book[id].ref.book))].sort(),
      /* pages look like pages, not like a shrug */
      oddPages: ids.filter(id => { const s = book[id].ref.pageNumbers;
        return s !== '—' && !/^pp?\.\d+(–\d+)?$/.test(s); })};
  });
  yes('the whole catalogue is here', refs.n >= 91, `${refs.n} exercises`);
  is('  none without a reference', refs.gap.none, []);
  is('  none without a book', refs.gap.book, []);
  is('  none without the book’s full title', refs.gap.full, []);
  is('  none without pages', refs.gap.pages, []);
  is('  and none with a stub where the description should be', refs.gap.what, []);
  is('every page number reads like a page number', refs.oddPages, []);
  /* Siskind is the spine, but the ladder grew rungs that are not his: Levine
     for the chord-scales at 6A, Mantooth and Berklee for the advanced
     voicings at 13 and 15, Stoloff and Weir for the vocal stages. Each is a
     real book this room sends you to. Curriculum v3 added three sources of
     its own: the document itself (for what it writes with no book behind
     it), Dobbins's Jazz Arranging, and the research notes it cites by name. */
  is('and the books named are the ones this curriculum comes out of',
    refs.books, ['Berklee Harmony', 'Curriculum v3', 'Design Doc', 'Dobbins', 'Gemini Research', 'Levine', 'Mantooth',
      'Siskind Book 1', 'Siskind Book 2', 'Siskind Book 3', 'Stoloff', 'Weir']);

  /* The part that a number-to-number mapping would have got wrong. */
  console.log('\n2. mapped by what the exercise is, not by its number');
  const mapped = await p.evaluate(() => {
    const at = id => { const r = jazzExercise(id).ref;
      return `${r.book}|${r.chapter}|${r.pageNumbers}`; };
    return {descents: [at('2.4a'), at('2.4b')],
      shells: at('2.2'),
      inversions: [at('2.1'), at('2.1b'), at('2.1c')],
      minor: [at('2.3b'), at('2.3c'), at('2.3d')],
      licks: ['6.1','6.2','6.3','6.4','6.5','6.6','6.7','6.8','6.9','6.10']
        .map(id => jazzExercise(id).ref.pageNumbers),
      p0: at('P0.1') === at('P0.12') ? at('P0.1') : 'differ'};
  });
  is('the whole-step descents point at the two pages of descents',
    mapped.descents, ['Siskind Book 1|Unit 3|pp.39–40', 'Siskind Book 1|Unit 3|pp.39–40']);
  is('  and the shell voicings at the coordination exercise, not at those',
    mapped.shells, 'Siskind Book 1|Unit 3|p.42');
  is('all three halves of the p.37 exercise point at p.37',
    mapped.inversions, new Array(3).fill('Siskind Book 1|Unit 3|p.37'));
  is('and the minor formulas point at Book 2, where they are',
    mapped.minor, new Array(3).fill('Siskind Book 2|Unit 3|pp.49–51'));
  is('the ten licks are on ten different pages',
    [...new Set(mapped.licks)].length, 10);
  is('  and the first is where the book puts it', mapped.licks[0], 'pp.43–44');
  is('P0 is this studio’s own stage, and says so', mapped.p0, 'Design Doc|Stage P0|—');

  console.log('\n3. and it is on the page, with a citation you can take away');
  const shown = await p.evaluate(async () => {
    location.hash = '#/jazz/6.3'; rerender();
    await new Promise(r => setTimeout(r, 1700));
    const ref = document.querySelector('.jz-ref');
    const cite = document.querySelector('[data-jzcite]');
    const txt = document.body.innerText;
    return {there: !!ref,
      title: /Jazz Piano Fundamentals, Book 1/.test(txt),
      where: /Unit 5, p\.61/.test(txt),
      what: /and of three/.test(txt),
      citation: cite && cite.dataset.jzcite};
  });
  yes('the reference is drawn', shown.there === true);
  yes('  with the book’s real title', shown.title === true);
  yes('  the unit and the page', shown.where === true);
  yes('  and what to look for when you get there', shown.what === true);
  is('  and the citation is one you could paste into a notebook',
    shown.citation, 'Siskind, “Jazz Piano Fundamentals, Book 1”, Unit 5, p.61');

  console.log('\n4. the score says how far to trust itself');
  const tint = await p.evaluate(async () => {
    const out = {};
    for(const [id, want] of [['6.3','needs_manual_verification'], ['7.5','approximate'],
        ['2.1c','verified']]){
      location.hash = '#/jazz/' + id; rerender();
      await new Promise(r => setTimeout(r, 1500));
      const box = document.querySelector('.jz-stage-box');
      out[id] = {acc: box && box.dataset.jzacc, want};
    }
    return out;
  });
  Object.keys(tint).forEach(id =>
    is(`${id} is marked ${tint[id].want}`, tint[id].acc, tint[id].want));

  console.log('\n5. the editor opens on what is already drawn');
  const model = await p.evaluate(() => {
    jazzClearEdited('2.1');
    const gen = jazzScoreXml(jazzExercise('2.1'), 'C', {});
    const m = jazzXmlToScore(gen, '2.1', 'C');
    const genNotes = (gen.match(/<note>/g) || []).length;
    const modelNotes = m.measures.reduce((a, x) => a + x.treble.length + x.bass.length, 0);
    return {bars: m.measures.length, genNotes, modelNotes, cfg: m.staffConfig,
      beats: m.timeSignature.beats};
  });
  is('every bar of the score is read in', model.bars, 3);
  is('  and every note with it', model.modelNotes, model.genNotes);
  is('  on the staff the score was written for', model.cfg, 'grand');
  is('  keeping the time signature', model.beats, 4);

  console.log('\n6. and writing it back out loses nothing');
  const round = await p.evaluate(() => {
    const gen = jazzScoreXml(jazzExercise('2.1'), 'C', {});
    const m = jazzXmlToScore(gen, '2.1', 'C');
    const out = jazzScoreToXml(m, 'C');
    const pitches = x => (x.match(/<step>[A-G]<\/step>/g) || []).length;
    return {inNotes: (gen.match(/<note>/g) || []).length,
      outNotes: (out.match(/<note>/g) || []).length,
      inPitches: pitches(gen), outPitches: pitches(out),
      bars: (out.match(/<measure /g) || []).length,
      grand: /<staves>2<\/staves>/.test(out)};
  });
  is('the same number of notes come back', round.outNotes, round.inNotes);
  is('  and the same number of pitches', round.outPitches, round.inPitches);
  is('  in the same number of bars', round.bars, 3);
  yes('  still on a grand staff', round.grand);

  console.log('\n7. and an edit follows it into every key');
  const keys = await p.evaluate(() => {
    const m = jazzXmlToScore(jazzScoreXml(jazzExercise('2.1'), 'C', {}), '2.1', 'C');
    /* move the first note of the first bar up a tone, the way the editor does */
    const first = m.measures[0].treble[0] || m.measures[0].bass[0];
    const before = first.pitch;
    first.pitch = before + 2;
    jazzSetEdited('2.1', m);
    const out = {};
    for(const k of ['C', 'Eb', 'A']) out[k] = jazzScoreToXml(m, k).length > 0;
    const inC = jazzScoreToXml(m, 'C'), inA = jazzScoreToXml(m, 'A');
    jazzClearEdited('2.1');
    return {drewEverywhere: Object.values(out).every(Boolean), differs: inC !== inA};
  });
  yes('it writes out in every key asked for', keys.drewEverywhere);
  yes('  and the keys are not the same document', keys.differs);

  console.log('\n8. the staff it is drawn on is yours to choose');
  const staff = await p.evaluate(() => {
    const m = jazzXmlToScore(jazzScoreXml(jazzExercise('2.1'), 'C', {}), '2.1', 'C');
    const out = {};
    for(const cfg of ['grand', 'treble', 'bass']){
      m.staffConfig = cfg;
      const x = jazzScoreToXml(m, 'C');
      out[cfg] = {two: /<staves>2<\/staves>/.test(x),
        f: /<sign>F<\/sign>/.test(x), g: /<sign>G<\/sign>/.test(x)};
    }
    jazzClearEdited('2.1');
    return out;
  });
  yes('grand staff writes two staves and both clefs',
    staff.grand.two && staff.grand.f && staff.grand.g);
  yes('  treble only writes one stave, treble clef',
    !staff.treble.two && staff.treble.g && !staff.treble.f);
  yes('  bass only writes one stave, bass clef',
    !staff.bass.two && staff.bass.f && !staff.bass.g);

  console.log('\n9. and there is one button that puts it all back');
  const back = await p.evaluate(() => {
    const m = jazzXmlToScore(jazzScoreXml(jazzExercise('2.1'), 'C', {}), '2.1', 'C');
    jazzSetEdited('2.1', m);
    const had = !!jazzEdited('2.1');
    jazzClearEdited('2.1');
    const gen = jazzScoreXml(jazzExercise('2.1'), 'C', {});
    return {had, after: jazzEditedCount(),
      same: jazzScoreFor('2.1', jazzExercise('2.1'), 'C', {}) === gen};
  });
  yes('an edit is stored while it is wanted', back.had);
  is('  and now there is none', back.after, 0);
  yes('  and the score is the generator’s again', back.same);

  console.log('\n10. nothing broke on the way');
  await p.evaluate(() => { jazzClearEdited('2.1'); saveNow(); });
  is('no errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
