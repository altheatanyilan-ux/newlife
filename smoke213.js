/* smoke213 — the notes are the book's notes.

   The generators in this room were first written from interval formulas:
   pick a root octave, add the formula, print it. That produces something
   plausible in every key and, for several of these exercises, not the
   exercise. The clearest case is the one the correction called highest
   priority: Siskind's ii-V-I on page 37 alternates root position and second
   inversion so that "either the bottom two notes move and the top two notes
   hold or the top two notes move and the bottom two hold". A generator that
   always builds from a fixed root octave breaks every one of those holds, and
   what is left is three correct chords and no exercise.

   SO THE CLAIMS HERE ARE MOSTLY LITERAL NOTE NAMES. Eighteen chords for the
   ii-V-I in the three keys the book prints, six for the Type A/B voicings,
   four altered dominants, three for the minor Formula HN, three for each
   quartal formula, one So What voicing, one bass in two. Where the source
   gives notes, those notes are the test; nothing here is checking that an
   array came back the shape the code that built it expected.

   AND THE REST IS ABOUT SAYING WHAT IS NOT VERIFIED. The source was honest
   that eight of the ten licks could not be read off the scan at a resolution
   that resolves a single melodic line, and that two more are unconfirmed.
   Those are not small caveats: a lick learnt wrong in twelve keys takes
   longer to correct than it took to learn. So every exercise now carries how
   far its notes can be trusted, and the room says so on the exercise and
   again on the flashcard, before you grade yourself against it.

   WHAT IS NOT CLAIMED. That the licks are right — they are marked as not
   right. That Formulas LN and R of the minor ii-V-i are right — the source
   describes them and does not print them, and they say so too. Marking
   something unverified is not the same as verifying it, and this suite does
   not pretend otherwise.
 */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n)
  : no(n, `\n         got  ${JSON.stringify(a)}\n         want ${JSON.stringify(b)}`);
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

  /* the notes as a reader of the score would name them, read back out of the
     MusicXML rather than out of the array that made it */
  await p.evaluate(() => {
    const STEP = {C:0, D:2, E:4, F:5, G:7, A:9, B:11};
    const NAMES = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
    window._bars = xml => xml.split('<measure ').slice(1).map(m => {
      const out = [];
      const re = /<step>([A-G])<\/step>\s*(?:<alter>(-?\d+)<\/alter>\s*)?<octave>(-?\d+)<\/octave>/g;
      let x; while((x = re.exec(m))) out.push((+x[3] + 1) * 12 + STEP[x[1]] + (+(x[2] || 0)));
      return out; });
    window._N = m => NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
    window._say = a => a.map(window._N).join(' ');
    window._sayAll = xml => window._bars(xml).map(window._say);
  });

  console.log('\n1. the ii-V-I as Book 1 page 37 prints it');
  const rp = await p.evaluate(() => ({
    C:  _sayAll(JazzExerciseGenerator.generate251RootPosition('C')),
    F:  _sayAll(JazzExerciseGenerator.generate251RootPosition('F')),
    Bb: _sayAll(JazzExerciseGenerator.generate251RootPosition('Bb'))}));
  is('root position in C',  rp.C,  ['D3 F3 A3 C4', 'G2 B2 D3 F3', 'C3 E3 G3 B3']);
  is('root position in F',  rp.F,  ['G2 Bb2 D3 F3', 'C3 E3 G3 Bb3', 'F2 A2 C3 E3']);
  is('root position in B♭', rp.Bb, ['C3 Eb3 G3 Bb3', 'F2 A2 C3 Eb3', 'Bb2 D3 F3 A3']);
  const si = await p.evaluate(() => ({
    C:  _sayAll(JazzExerciseGenerator.generate251SecondInversion('C')),
    F:  _sayAll(JazzExerciseGenerator.generate251SecondInversion('F')),
    Bb: _sayAll(JazzExerciseGenerator.generate251SecondInversion('Bb'))}));
  is('second inversion in C',  si.C,  ['A2 C3 D3 F3', 'D3 F3 G3 B3', 'G2 B2 C3 E3']);
  is('second inversion in F',  si.F,  ['D3 F3 G3 Bb3', 'G2 Bb2 C3 E3', 'C3 E3 F3 A3']);
  is('second inversion in B♭', si.Bb, ['G2 Bb2 C3 Eb3', 'C3 Eb3 F3 A3', 'F2 A2 Bb2 D3']);

  /* THE claim. Everything above is a presentation of the exercise; this is
     the exercise, and it is the one the old generator could not do. */
  console.log('\n2. and alternating them holds two notes at every join');
  const alt = await p.evaluate(() => {
    const out = {};
    const keyPcOf = k => JazzExerciseGenerator.transpositionFromC(k);
    JAZZ_KEY_NAMES.forEach(k => {
      const b = _bars(JazzExerciseGenerator.generate251Alternating(k));
      const held = (x, y) => x.filter(n => y.includes(n)).length;
      out[k] = {bars: b.length,
        joins: [held(b[0],b[1]), held(b[1],b[2]), held(b[3],b[4]), held(b[4],b[5])],
        low: Math.min.apply(null, b.map(c => c[0])),
        high: Math.max.apply(null, b.map(c => c[3])),
        /* the first three bars start on the root, the last three on the
           fifth — otherwise it is the same three bars printed twice and the
           second half of the exercise has quietly gone missing */
        bottoms: [0, 3].map(i => {
          let d = b[i][0] - ((((keyPcOf(k) + 2) % 12) + 12) % 12 + 36);
          while(d < 0) d += 12; return d % 12; }),
        /* and the two that hold are a PAIR: either the bottom two or the top two */
        pairs: [0,1,3,4].map(i => {
          const x = b[i], y = b[i + 1];
          const lowPair = x[0] === y[0] && x[1] === y[1];
          const highPair = x[2] === y[2] && x[3] === y[3];
          return lowPair || highPair; })};
    });
    return out;
  });
  Object.keys(alt).forEach(k => {
    const a = alt[k];
    yes(`${k}: six bars, ${a.joins.join('/')} notes held, ${_n(a.low)}–${_n(a.high)}`,
      a.bars === 6 && a.joins.every(n => n >= 2) && a.pairs.every(Boolean)
      && a.low >= 36 && a.high <= 67, JSON.stringify(a));
    is(`  and it turns round: root on the bottom, then the fifth`, a.bottoms, [0, 7]);
  });
  function _n(m){ const NAMES = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
    return NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1); }

  console.log('\n3. the two descending sets, and the join between keys');
  const desc = await p.evaluate(() => {
    const out = {};
    ['A','B'].forEach(w => {
      const b = _bars(JazzExerciseGenerator.generate251DescentSet('C', w));
      const joins = [];
      for(let n = 2; n + 1 < b.length; n += 3){
        const I = b[n], ii = b[n + 1];
        const oct = Math.round((ii[0] - I[0]) / 12) * 12;
        const moved = I.map(x => x + oct).filter((x, j) => x !== ii[j]).length;
        const lowered = I.map(x => x + oct).filter((x, j) => x - ii[j] === 1).length;
        joins.push(moved === 2 && lowered === 2);
      }
      out[w] = {bars: b.length, joins, low: Math.min.apply(null, b.map(c => c[0]))};
    });
    return out;
  });
  is('Set A is six keys, eighteen bars', desc.A.bars, 18);
  yes('  and every join lowers exactly the third and the seventh',
    desc.A.joins.length === 5 && desc.A.joins.every(Boolean), JSON.stringify(desc.A.joins));
  is('Set B is six keys, eighteen bars', desc.B.bars, 18);
  yes('  and so does every join of Set B',
    desc.B.joins.length === 5 && desc.B.joins.every(Boolean), JSON.stringify(desc.B.joins));
  yes('  and neither walks off the bottom of the keyboard',
    desc.A.low >= 36 && desc.B.low >= 36, `${_n(desc.A.low)} / ${_n(desc.B.low)}`);
  const together = await p.evaluate(() => {
    const seen = {};
    ['A','B'].forEach(w => (w === 'A' ? JazzExerciseGenerator.DESCENT_SET_A
      : JazzExerciseGenerator.DESCENT_SET_B).forEach(k => seen[k] = true));
    return Object.keys(seen).sort();
  });
  is('  and between them the two sets cover all twelve keys', together.length, 12);

  /* The root-position descent would come out the same whether the voicing is
     carried forward or rebuilt from scratch: the next ii has the same root as
     the previous I, and the same window rule puts it in the same octave. In
     the Type A/B descent it does not — there the register is inherited, and
     rebuilding each key on its own loses the join. So the carry is claimed
     where it actually does something. */
  const carried = await p.evaluate(() => {
    const out = {};
    ['A','B'].forEach(v => {
      const b = _bars(JazzExerciseGenerator.generate251DescentSet('C', 'A', v));
      const joins = [];
      for(let n = 2; n + 1 < b.length; n += 3){
        const I = b[n], ii = b[n + 1];
        const oct = Math.round((ii[0] - I[0]) / 12) * 12;
        const shifted = I.map(x => x + oct);
        joins.push(shifted.filter((x, j) => x !== ii[j]).length === 2
          && shifted.filter((x, j) => x - ii[j] === 1).length === 2);
      }
      out[v] = {bars: b.length, joins, low: Math.min.apply(null, b.map(c => c[0]))};
    });
    return out;
  });
  ['A','B'].forEach(v => {
    yes(`Set A in Type ${v} voicings: every key's ii is the last I, two notes lower`,
      carried[v].bars === 18 && carried[v].joins.length === 5
      && carried[v].joins.every(Boolean), JSON.stringify(carried[v].joins));
    yes(`  and it stays in register the whole way down`, carried[v].low >= 47,
      _n(carried[v].low));
  });

  console.log('\n4. Type A/B voicings as Book 1 pages 87-89 print them');
  const ab = await p.evaluate(() => ({
    a: _sayAll(JazzExerciseGenerator.generate251TypeA('C')),
    b: _sayAll(JazzExerciseGenerator.generate251TypeB('C'))}));
  is('A-start in C', ab.a, ['F3 C4 E4 A4', 'F3 B3 D4 A4', 'E3 B3 D4 G4']);
  is('B-start in C', ab.b, ['C3 F3 A3 E4', 'B2 F3 A3 D4', 'B2 E3 G3 D4']);
  const reg = await p.evaluate(() => {
    const bad = [];
    JAZZ_KEY_NAMES.forEach(k => ['A','B'].forEach(t => {
      const b = _bars(t === 'A' ? JazzExerciseGenerator.generate251TypeA(k)
                                : JazzExerciseGenerator.generate251TypeB(k));
      const held = (x, y) => x.filter(n => y.includes(n)).length;
      const low = Math.min.apply(null, b.map(c => c[0]));
      /* Siskind: keep the lowest note roughly between the C below middle C
         and middle C. His own printed G7 Type A starts on B2, so B2 is the
         floor here rather than his sentence. */
      if(low < 47 || low > 60 || held(b[0],b[1]) < 2 || held(b[1],b[2]) < 2)
        bad.push(`${k} ${t}: ${_N(low)} ${held(b[0],b[1])}/${held(b[1],b[2])}`);
    }));
    return bad;
  });
  is('all twenty-four stay in register and hold two notes at each join', reg, []);

  console.log('\n5. an alteration replaces a note, it does not join it');
  const al = await p.evaluate(() => ({
    ab9:  _sayAll(JazzExerciseGenerator.generateAlteredDomB9('G', 'A'))[0],
    bb9:  _sayAll(JazzExerciseGenerator.generateAlteredDomB9('G', 'B'))[0],
    ab13: _sayAll(JazzExerciseGenerator.generateAlteredDomB13('G', 'A'))[0],
    bb13: _sayAll(JazzExerciseGenerator.generateAlteredDomB13('G', 'B'))[0],
    sizes: ['A','B'].map(t => [
      _bars(JazzExerciseGenerator.generateAlteredDomB9('G', t))[0].length,
      _bars(JazzExerciseGenerator.generateAlteredDomB13('G', t))[0].length])}));
  is('G7(b9) Type A',  al.ab9,  'B2 F3 Ab3 D4');
  is('G7(b9) Type B',  al.bb9,  'F3 B3 D4 Ab4');
  is('G7(b13) Type A', al.ab13, 'B2 F3 A3 Eb4');
  is('G7(b13) Type B', al.bb13, 'F3 B3 Eb4 A4');
  is('  and every one of them is still four notes', al.sizes, [[4,4],[4,4]]);

  console.log('\n6. the tritone sub does NOT alternate');
  const tri = await p.evaluate(() => {
    const out = {};
    ['A','B'].forEach(t => {
      const b = _bars(JazzExerciseGenerator.generateTritone251('C', t));
      const roots = [2, 1, 0];
      out[t] = b.map((c, n) => {
        let d = c[0] - ((((roots[n] % 12) + 12) % 12) + 36);
        while(d < 0) d += 12; return d % 12; });
    });
    /* and a plain ii-V-I, which does */
    const plain = _bars(JazzExerciseGenerator.generate251TypeA('C')).map((c, n) => {
      let d = c[0] - (((([2,7,0][n] % 12) + 12) % 12) + 36);
      while(d < 0) d += 12; return d % 12; });
    return {out, plain};
  });
  is('Type A: the third is on the bottom of all three chords', tri.out.A, [3, 4, 4]);
  is('Type B: the seventh is on the bottom of all three', tri.out.B, [10, 10, 11]);
  yes('  where a plain ii-V-I alternates between the two',
    JSON.stringify(tri.plain) !== JSON.stringify(tri.out.A), JSON.stringify(tri.plain));

  console.log('\n7. the minor ii-V-i, Formula HN, as Book 2 prints it');
  const hn = await p.evaluate(() =>
    _sayAll(JazzExerciseGenerator.generateMinor251Formula('C', 'HN')));
  is('C minor, Formula HN', hn, ['F3 C4 Eb4 Ab4', 'Eb3 B3 D4 Ab4', 'Eb3 A3 C4 G4']);
  const others = await p.evaluate(() => ['LN','R'].map(f => {
    const b = _bars(JazzExerciseGenerator.generateMinor251Formula('C', f));
    return b.length === 3 && b.every(c => c.length === 4)
      && Math.min.apply(null, b.map(c => c[0])) >= 47; }));
  is('  and LN and R draw three four-note chords in register', others, [true, true]);

  console.log('\n8. the quartal formulas, as Book 3 prints them');
  const q = await p.evaluate(() => ({
    one: _sayAll(JazzExerciseGenerator.generateQuartal251('Bb', 1)),
    two: _sayAll(JazzExerciseGenerator.generateQuartal251('Bb', 2)),
    min: _sayAll(JazzExerciseGenerator.generateQuartalMinor251('C', 'minor')),
    maj: _sayAll(JazzExerciseGenerator.generateQuartalMinor251('C', 'major'))}));
  is('B♭ major, Formula 1', q.one, ['Bb3 Eb4 Ab4', 'A3 D4 G4', 'A3 D4 G4']);
  is('B♭ major, Formula 2', q.two, ['Eb3 Ab3 Bb3', 'D3 G3 A3', 'D3 G3 A3']);
  is('C minor, from the minor scales', q.min, ['D3 G3 C4 F4', 'Db3 G3 B3 F4', 'C3 F3 Bb3 Eb4']);
  is('C minor, from the major modes',  q.maj, ['D3 G3 C4 F4', 'D3 G3 Bb3 E4', 'C3 F3 Bb3 Eb4']);

  console.log('\n9. the So What voicing is three fourths and a THIRD');
  const sw = await p.evaluate(() => {
    const xml = JazzExerciseGenerator.generateSoWhatVoicing('D');
    return {first: _sayAll(xml)[0], flagged: xml.split('pass through').length - 1,
      which: _bars(xml).map(c => { for(let i = 0; i < c.length; i++)
        for(let j = i + 1; j < c.length; j++) if(c[j] - c[i] === 13) return true;
        return false; })};
  });
  is('D dorian, on the root', sw.first, 'D3 G3 C4 F4 A4');
  is('  and exactly two of the seven carry a minor ninth', sw.flagged, 2);
  is('    the third degree and the sixth, which is what Siskind says',
    sw.which, [false, false, true, false, false, true, false]);

  console.log('\n10. the bass in two, and the grand staff it belongs on');
  const bass = await p.evaluate(() => {
    const G = JazzExerciseGenerator;
    const say = a => a.map(_N).join(' ');
    return {fifth: say(G._bassInTwo(3, 'dom7', 'fifth', 8)),
      third: say(G._bassInTwo(3, 'dom7', 'third', 8)),
      neighbour: say(G._bassInTwo(3, 'dom7', 'neighbour', 8))};
  });
  is('E♭7, root then the fifth', bass.fifth, 'Eb2 Bb2');
  is('E♭7, root then the third', bass.third, 'Eb2 G2');
  is('E♭7 into A♭7, root then a semitone into it', bass.neighbour, 'Eb2 G2');
  const grand = await p.evaluate(() => {
    const out = {};
    [['hands', JazzExerciseGenerator.generate251OneHandWithBass('C', 'A', 'fifth')],
     ['blues', JazzExerciseGenerator.generateJazzBluesWithBass('F', 'A', 'fifth')]]
      .forEach(([n, xml]) => {
        const lh = [];
        xml.split('<backup>').slice(1).forEach(seg => {
          const body = seg.split('</measure>')[0];
          const re = /<step>([A-G])<\/step>\s*(?:<alter>(-?\d+)<\/alter>\s*)?<octave>(-?\d+)<\/octave>/g;
          const STEP = {C:0, D:2, E:4, F:5, G:7, A:9, B:11};
          let x; while((x = re.exec(body))) lh.push((+x[3] + 1) * 12 + STEP[x[1]] + (+(x[2] || 0)));
        });
        out[n] = {staves: /<staves>2<\/staves>/.test(xml),
          clefs: /<clef number="1">\s*<sign>G</.test(xml) && /<clef number="2">\s*<sign>F</.test(xml),
          backups: (xml.match(/<backup>/g) || []).length,
          bars: (xml.match(/<measure /g) || []).length,
          notes: _bars(xml).map(c => c.length),
          lhTop: Math.max.apply(null, lh)};
      });
    return out;
  });
  ['hands','blues'].forEach(n => {
    const g = grand[n];
    yes(`${n}: two staves, a treble and a bass clef`, g.staves && g.clefs);
    is(`  a backup in every one of the ${g.bars} bars`, g.backups, g.bars);
    yes(`  and a voicing over two bass notes in each`, g.notes.every(x => x === 5),
      JSON.stringify(g.notes));
    yes(`  with the left hand under the right`, g.lhTop < 47, _n(g.lhTop));
  });

  console.log('\n11. what has not been checked says so');
  const acc = await p.evaluate(() => {
    const book = jazzBook();
    const by = {};
    Object.keys(book).forEach(id => { const a = book[id].acc || '?';
      (by[a] = by[a] || []).push(id); });
    return {kinds: Object.keys(by).sort(), counts: Object.keys(by).reduce((o, k) =>
      (o[k] = by[k].length, o), {}),
      licks: ['6.1','6.2','6.3','6.10'].map(id => book[id].acc),
      minor: ['2.3b','2.3c','2.3d'].map(id => book[id].acc),
      verifiedNew: ['2.1','2.1b','2.1c','2.4a','2.4b','3.1','7.2','8.7a','8.8a'].map(id => book[id].acc),
      unmarked: Object.keys(book).filter(id => !book[id].acc)};
  });
  is('every exercise in the book carries a mark', acc.unmarked, []);
  is('  and only the three the brief names are used', acc.kinds,
    ['approximate', 'needs_manual_verification', 'verified']);
  is('licks 1 and 2 are approximate, 3 and 10 are unverified',
    acc.licks, ['approximate', 'approximate', 'needs_manual_verification', 'needs_manual_verification']);
  is('the minor formula the book prints is verified; the two it describes are not',
    acc.minor, ['verified', 'needs_manual_verification', 'needs_manual_verification']);
  is('and everything checked against the book above says verified',
    acc.verifiedNew, new Array(9).fill('verified'));
  yes('  with a real number of unverified ones, not none',
    acc.counts.needs_manual_verification >= 10, JSON.stringify(acc.counts));

  console.log('\n12. and the room says it out loud');
  const shown = await p.evaluate(async () => {
    location.hash = '#/jazz/6.3'; rerender();
    await new Promise(r => setTimeout(r, 1600));
    const warn = document.querySelector('.jz-doubt');
    const txt = document.body.innerText;
    return {there: !!warn, kind: warn && warn.dataset.jzacc,
      loud: /have not been verified/i.test(txt),
      page: /p\.62/.test(txt),
      /* above the notation, not below it */
      first: !!(warn && document.querySelector('.jz-stage-box')
        && warn.compareDocumentPosition(document.querySelector('.jz-stage-box'))
           & Node.DOCUMENT_POSITION_FOLLOWING)};
  });
  yes('an unverified exercise carries a warning', shown.there === true);
  is('  which says which kind', shown.kind, 'needs_manual_verification');
  yes('  in words rather than a code', shown.loud === true);
  yes('  naming the page to check it against', shown.page === true);
  yes('  and above the notation, not under it', shown.first === true);
  const quiet = await p.evaluate(async () => {
    location.hash = '#/jazz/2.1c'; rerender();
    await new Promise(r => setTimeout(r, 1600));
    return {warn: !!document.querySelector('.jz-doubt'),
      drew: !!document.querySelector('#jzScore svg')};
  });
  yes('a verified exercise carries none', quiet.warn === false);
  yes('  and still draws', quiet.drew === true);

  const onCard = await p.evaluate(async () => {
    jazzState().settings.checks = false;
    jazzUi().flash = {cards: [{exerciseId:'6.3', key:'Eb'}], at:0, shown:true,
      from: Date.now(), got:{nailed:0, struggled:0, couldnt:0}};
    location.hash = '#/jazz/cards'; rerender();
    await new Promise(r => setTimeout(r, 2600));
    const warn = document.querySelector('.jz-doubt');
    const grade = document.querySelector('[data-jzg]');
    return {there: !!warn,
      beforeGrading: !!(warn && grade
        && warn.compareDocumentPosition(grade) & Node.DOCUMENT_POSITION_FOLLOWING)};
  });
  yes('and the flashcard says it too', onCard.there === true);
  yes('  before you are asked whether you had it', onCard.beforeGrading === true);

  console.log('\n13. nothing broke on the way');
  await p.evaluate(() => { jazzUi().flash = null; S.jazz.progress = {};
    jazzState().settings.syllabus = []; jazzState().settings.checks = true; saveNow(); });
  is('no errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
