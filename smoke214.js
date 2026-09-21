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
  is('and the books named are the ones this curriculum comes out of',
    refs.books, ['Design Doc', 'Siskind Book 1', 'Siskind Book 2', 'Siskind Book 3']);

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

  console.log('\n5. taking it away');
  await p.evaluate(async () => { jazzClearFixes('2.1');
    location.hash = '#/jazz/2.1'; rerender(); await new Promise(r => setTimeout(r, 2200)); });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#jzDown')]);
  const saved = '/tmp/smoke214.musicxml';
  await dl.saveAs(saved);
  const xml = fs.readFileSync(saved, 'utf8');
  is('the file is named after the exercise and the key',
    dl.suggestedFilename(), 'ii-V-I_Root_Position_C.musicxml');
  yes('  and it is the score, not a stub',
    /<score-partwise/.test(xml) && (xml.match(/<measure /g) || []).length === 3,
    `${xml.length} bytes`);
  yes('  which any MusicXML reader would accept', /<!DOCTYPE score-partwise/.test(xml));

  console.log('\n6. correcting it and bringing it back');
  /* one note moved a whole tone up, the way somebody would in MuseScore */
  const bumped = xml.replace(
    /(<measure number="2">[\s\S]*?<note>\s*<pitch>\s*<step>)([A-G])(<\/step>)/,
    (m, a, st, c) => a + ({C:'D',D:'E',E:'F',F:'G',G:'A',A:'B',B:'C'}[st]) + c);
  yes('the file really was changed', bumped !== xml);
  fs.writeFileSync('/tmp/smoke214-fixed.musicxml', bumped);
  await p.setInputFiles('#jzUpFile', '/tmp/smoke214-fixed.musicxml');
  await p.waitForTimeout(2600);
  const took = await p.evaluate(() => ({
    fixes: jazzFixes('2.1'),
    badge: !!document.querySelector('.jz-fixed'),
    acc: (document.querySelector('.jz-stage-box') || {dataset:{}}).dataset.jzacc,
    said: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent)
      .some(t => /corrected/i.test(t)),
    from: jazzFixSource('2.1')}));
  is('exactly the one note that moved is recorded', took.fixes, [{bar:1, i:0, d:2}]);
  yes('  and the room says so', took.said === true);
  yes('  and the score says you changed it', took.acc === 'user_modified' && took.badge === true,
    took.acc);
  yes('  and remembers where it came from', /smoke214-fixed/.test(took.from), took.from);

  /* THE claim. A corrected file is a correction in one key; a delta is a
     correction in all twelve, which is what these exercises are made of. */
  console.log('\n7. and the correction follows it into every key');
  const everywhere = await p.evaluate(() => {
    const STEP = {C:0, D:2, E:4, F:5, G:7, A:9, B:11};
    const bars = x => x.split('<measure ').slice(1).map(m => {
      const o = []; const re = /<step>([A-G])<\/step>\s*(?:<alter>(-?\d+)<\/alter>\s*)?<octave>(-?\d+)<\/octave>/g;
      let y; while((y = re.exec(m))) o.push((+y[3] + 1) * 12 + STEP[y[1]] + (+(y[2] || 0)));
      return o; });
    const ex = jazzExercise('2.1');
    const out = {};
    JAZZ_KEY_NAMES.forEach(k => {
      const plain = jazzScoreXml(ex, k, {});
      const fixed = jazzApplyFixes(plain, '2.1', k);
      out[k] = bars(fixed)[1].map((n, i) => n - bars(plain)[1][i]);
    });
    return out;
  });
  const keys = Object.keys(everywhere);
  is('twelve keys', keys.length, 12);
  yes('  and in every one of them the same note is a whole tone higher',
    keys.every(k => JSON.stringify(everywhere[k]) === JSON.stringify([2,0,0,0])),
    JSON.stringify(everywhere.Eb));

  /* Everything above proves the correction is RECORDED and that applying it
     works. This proves the page actually applies it — the engraver is handed
     the corrected score rather than the generator's. */
  console.log('\n7b. and the page engraves the corrected one, not the original');
  const engraved = await p.evaluate(async () => {
    const seen = [];
    const was = jazzEngrave;
    jazzEngrave = function(box, xml){ seen.push(xml); return was.apply(this, arguments); };
    jazzUi().key = 'Eb';
    location.hash = '#/jazz/2.1'; rerender();
    await new Promise(r => setTimeout(r, 2400));
    jazzEngrave = was;
    const ex = jazzExercise('2.1');
    const plain = jazzScoreXml(ex, 'Eb', {});
    const fixed = jazzApplyFixes(plain, '2.1', 'Eb');
    jazzUi().key = 'C';
    return {n: seen.length, isFixed: seen.some(x => x === fixed),
      isPlain: seen.some(x => x === plain), differ: plain !== fixed};
  });
  yes('the exercise page engraved something', engraved.n >= 1, `${engraved.n} engravings`);
  yes('  and the two versions really are different', engraved.differ === true);
  yes('  and what it handed the engraver was the corrected one',
    engraved.isFixed === true && engraved.isPlain === false,
    JSON.stringify({fixed: engraved.isFixed, plain: engraved.isPlain}));

  console.log('\n8. a file that is not a correction is not stored as one');
  const refused = await p.evaluate(async () => {
    const ex = jazzExercise('2.1');
    const same = jazzScoreXml(ex, 'C', {});
    const nothing = jazzDiffXML(same, same);
    const shorter = jazzDiffXML(same, same.split('<measure ').slice(0, 3).join('<measure ') + '</part></score-partwise>');
    const junk = jazzDiffXML(same, 'this is not a score at all');
    return {nothing: nothing.fixes && nothing.fixes.length, looked: nothing.looked,
      shorter: shorter.error || null, junk: junk.error || null};
  });
  is('an unchanged file records nothing', refused.nothing, 0);
  yes('  though it did look at every note', refused.looked >= 12, `${refused.looked}`);
  yes('a file with the wrong number of bars is refused, in words',
    /different piece of music/.test(refused.shorter || ''), refused.shorter);
  yes('  and so is something that is not MusicXML',
    /could not be read/.test(refused.junk || ''), refused.junk);

  console.log('\n9. and there is one button that puts it all back');
  const back = await p.evaluate(async () => {
    location.hash = '#/jazz/2.1'; rerender();
    await new Promise(r => setTimeout(r, 1800));
    const before = jazzFixCount('2.1');
    const btn = document.querySelector('#jzReset');
    if(btn) btn.click();
    await new Promise(r => setTimeout(r, 1400));
    return {before, after: jazzFixCount('2.1'),
      acc: (document.querySelector('.jz-stage-box') || {dataset:{}}).dataset.jzacc,
      gone: !document.querySelector('#jzReset')};
  });
  is('there was a correction to put back', back.before, 1);
  is('  and now there is none', back.after, 0);
  is('  and the score is the generator’s again', back.acc, 'verified');
  yes('  and the button has gone with it', back.gone === true);

  console.log('\n10. nothing broke on the way');
  await p.evaluate(() => { jazzClearFixes('2.1'); saveNow(); });
  is('no errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
