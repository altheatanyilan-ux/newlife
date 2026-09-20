/* smoke198 — the harmony and the fingers.

   Two things a practice score can do that a printed one cannot.

   IT READS THE HARMONY OFF THE NOTES. A lead sheet tells you the chord; a
   piano score expects you to hear it, which is the skill that takes years.
   The naive way to work it out is to test chord shapes as subsets and take
   the first that fits — and a subset test finds C major inside A C E G and
   stops, so every seventh in the piece comes out named as the triad three
   notes up. Here every root and every shape is scored and the best fit wins,
   with a note the name cannot explain counting twice as heavily against it as
   a chord tone nobody played.

   IT REMEMBERS WHICH FINGER. A fingering is the decision you lose first and
   spend the longest rediscovering. It is anchored to the bar, the beat, the
   staff and the note's place in the chord, so it survives a zoom, a
   re-engraving and a change of key — anything hung on the engraver's own note
   objects would not, because those are rebuilt every time the file is read.
 */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

/* a whole note, and a chord built on one */
const W = (step, oct, alter) => `<note><pitch><step>${step}</step>${
  alter ? `<alter>${alter}</alter>` : ''}<octave>${oct}</octave></pitch><duration>16</duration><type>whole</type></note>`;
const CH = list => list.map((p, i) => `<note>${i ? '<chord/>' : ''}<pitch><step>${p[0]}</step>${
  p[2] ? `<alter>${p[2]}</alter>` : ''}<octave>${p[1]}</octave></pitch><duration>16</duration><type>whole</type></note>`).join('');
const head = `<attributes><divisions>4</divisions><key><fifths>0</fifths><mode>major</mode></key>
  <time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`;
const bass = `<attributes><divisions>4</divisions><key><fifths>0</fifths><mode>major</mode></key>
  <time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>F</sign><line>4</line></clef></attributes>`;
/* six bars, each one a question the reader has to get right */
/* four quarters, so something can change inside a bar while the bass holds */
const Q = list => list.map(ps => ps.map((pp, j) =>
  `<note>${j ? '<chord/>' : ''}<pitch><step>${pp[0]}</step><octave>${pp[1]}</octave></pitch><duration>4</duration><type>quarter</type></note>`).join('')).join('');
const TOP = [
  CH([['C',4],['E',4],['G',4]]),                 /* 1. root position            */
  CH([['E',4],['G',4],['C',5]]),                 /* 2. first inversion          */
  CH([['C',5],['E',5],['G',5]]),                 /* 3. an Am7 with the A below  */
  CH([['A',4],['C',5],['F',5]]),                 /* 4. an F with its fifth low  */
  CH([['C',4,1],['D',4],['E',4,-1]]),            /* 5. not a chord at all       */
  CH([['C',4],['E',4],['G',4]]),                 /* 6. back to where it began   */
  CH([['A',4],['C',5],['E',5],['G',5]]),         /* 7. bar 3's notes, C beneath */
  Q([[['C',4],['E',4],['G',4]], [['C',4],['E',4],['G',4]],
     [['D',4],['F',4],['A',4]], [['D',4],['F',4],['A',4]]]),  /* 8. under a held A */
];
const LOW = [W('C',3), W('E',3), W('A',2), W('C',3), W('D',4), W('C',3), W('C',3), W('A',2)];
const bars = list => list.map((n, i) =>
  `<measure number="${i+1}">${i === 0 ? '' : ''}${n}</measure>`).join('\n');
const CHORDS = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1">
  <work><work-title>Six Questions</work-title></work>
  <part-list><score-part id="P1"><part-name>Right</part-name></score-part>
    <score-part id="P2"><part-name>Left</part-name></score-part></part-list>
  <part id="P1">${TOP.map((n, i) =>
    `<measure number="${i+1}">${i === 0 ? head : ''}${n}</measure>`).join('')}</part>
  <part id="P2">${LOW.map((n, i) =>
    `<measure number="${i+1}">${i === 0 ? bass : ''}${n}</measure>`).join('')}</part>
</score-partwise>`;


(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1500, height:1000}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));
  await p.evaluate(() => { location.hash = '#/score'; }); await p.waitForTimeout(1300);
  await p.evaluate(async xml => { await takeScoreFile(new File([xml], 'Six Questions.musicxml')); }, CHORDS);
  await p.waitForTimeout(5000);
  await p.evaluate(() => { if(!scoreUi().more){ scoreUi().more = true; rerender(); } });
  await p.waitForTimeout(700);

  const chords = async () => p.evaluate(() => {
    const x = scores().find(y => y.title === 'Six Questions');
    x.overlays.chords = true; scoreLayersPaint(x);
    return [...document.querySelectorAll('.sc-lab-chord')].map(n =>
      [n.textContent, n.dataset.scchord, n.classList.contains('unsure')]);
  });

  console.log('\n1. what the notes add up to');
  let c = await chords();
  is('a triad on its own root is just its letter', c[0] && c[0][0], 'C');
  is('  a triad over another of its notes is a slash chord', c[1] && c[1][0], 'C/E');
  /* the whole reason this is scored rather than a subset search */
  is('  and a seventh is a seventh, not the triad inside it', c[2] && c[2][0], 'Am7');
  yes('    which a subset search would have called C', c[2] && c[2][0] !== 'C',
    JSON.stringify(c[2]));
  is('  a triad over its own fifth names its root, not the bass', c[3] && c[3][0], 'F/C');
  /* the same four notes, and which one is underneath decides what they are:
     an A minor seventh over an A, a C sixth over a C */
  is('  and the bass is what decides between two names that both fit',
    [c[2] && c[2][0], c[6] && c[6][0]], ['Am7', 'C6']);

  console.log('\n2. it says when it is guessing');
  yes('four notes that are not a chord are written faintly',
    c[4] && c[4][2] === true, JSON.stringify(c[4]));
  yes('  while the ones it is sure of are not',
    c[0] && c[0][2] === false && c[2][2] === false, JSON.stringify([c[0], c[2]]));

  console.log('\n3. one symbol per change, not one per beat');
  is('eight bars of harmony make nine symbols', c.length, 9);
  const held = await p.evaluate(() => {
    /* the bass note is a whole note: it is part of the harmony on every beat
       it lasts, not only the one it was struck on */
    const x = scores().find(y => y.title === 'Six Questions');
    return scoreChordLine(scoreNotes(), {flat:false}).map(v => [v.measure, v.beat, v.say]);
  });
  is('  each one where the harmony turns over',
    held.map(v => [v[0], v[1]]), [[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[8,2]]);
  /* the last bar is the one that proves a held note keeps sounding: the A is
     struck once and is part of both chords over it, so the two halves of the
     bar are an A minor seventh and a D minor over an A \u2014 and not, as reading
     only what is struck on the beat would have it, a plain C and a plain Dm */
  is('  and a note held under a change is part of what comes after it',
    [held[7][2], held[8][2]], ['Am7', 'Dm/A']);

  console.log('\n4. writing over it by hand');
  const over = await p.evaluate(async () => {
    const lab = document.querySelector('[data-scchord]');
    lab.click();
    await new Promise(r => setTimeout(r, 300));
    document.querySelector('#chSay').value = 'Cmaj9';
    document.querySelector('#chSave').click();
    await new Promise(r => setTimeout(r, 300));
    const x = scores().find(y => y.title === 'Six Questions');
    const now = document.querySelector('[data-scchord]');
    return {said: now.textContent, mine: now.classList.contains('mine'),
      kept: x.chordOverrides};
  });
  is('what you write is what it says', over.said, 'Cmaj9');
  yes('  and it is marked as yours', over.mine, JSON.stringify(over));
  is('  and kept against the bar and the beat', over.kept, {'1|0':'Cmaj9'});
  const back = await p.evaluate(async () => {
    document.querySelector('[data-scchord]').click();
    await new Promise(r => setTimeout(r, 300));
    document.querySelector('#chAuto').click();
    await new Promise(r => setTimeout(r, 300));
    const now = document.querySelector('[data-scchord]');
    return {said: now.textContent, mine: now.classList.contains('mine')};
  });
  is('and it can be handed back to the room', back.said, 'C');
  yes('  no longer marked as yours', !back.mine, JSON.stringify(back));

  console.log('\n5. the harmony moves with the key');
  const moved = await p.evaluate(async () => {
    const x = scores().find(y => y.title === 'Six Questions');
    x.transpose = 1; await scoreRedraw(x);
    await new Promise(r => setTimeout(r, 900));
    const up = [...document.querySelectorAll('.sc-lab-chord')].map(n => n.textContent);
    x.transpose = 0; await scoreRedraw(x);
    await new Promise(r => setTimeout(r, 900));
    return {up, home: [...document.querySelectorAll('.sc-lab-chord')].map(n => n.textContent)};
  });
  is('up a semitone the C chord is a D flat chord', moved.up[0], 'D♭');
  /* spelled the way the key it landed in is spelled — five flats, not seven
     sharps, so a C sharp chord would be wrong even though it is the same sound */
  yes('  spelled in flats, because that is the key it landed in',
    moved.up[0].indexOf('♯') < 0, moved.up[0]);
  is('  and the seventh moved with it', moved.up[2], 'B♭m7');
  is('and back again', moved.home[0], 'C');

  console.log('\n6. fingerings');
  const fing = await p.evaluate(async () => {
    const x = scores().find(y => y.title === 'Six Questions');
    x.overlays.fingerings = true;
    const canvas = document.getElementById('scCanvas');
    const r = canvas.getBoundingClientRect();
    const n = scoreNotes().filter(v => v.midi != null).sort((a, v) => a.measure - v.measure || a.midi - v.midi)[0];
    canvas.parentElement.dispatchEvent(new MouseEvent('click', {bubbles:true,
      clientX: r.left + n.x, clientY: r.top + n.y}));
    await new Promise(r => setTimeout(r, 200));
    const pick = document.querySelector('.sc-fingpick');
    if(!pick) return {opened:false};
    pick.querySelector('[data-fing="L5"]').click();
    await new Promise(r => setTimeout(r, 200));
    return {opened:true, kept: x.fingerings,
      drawn: [...document.querySelectorAll('.sc-fing')].map(v => [v.textContent, v.className.indexOf('lh') > -1])};
  });
  yes('a press on a note head offers the ten fingers', fing.opened, JSON.stringify(fing));
  is('  and the one you chose is written on the note', fing.drawn, [['5', true]]);
  /* the lowest note of the first bar is in the left hand, which is the second
     staff — the key says so, and that is what makes it findable again */
  is('  against the bar, the beat, the staff and the place in the chord',
    Object.keys(fing.kept || {}), ['1|0|1|0']);
  const survived = await p.evaluate(async () => {
    const x = scores().find(y => y.title === 'Six Questions');
    const at = () => { const n = document.querySelector('.sc-fing');
      return n ? {say:n.textContent, x: Math.round(parseFloat(n.style.left))} : null; };
    const small = at();
    x.zoom = 2; await scoreRedraw(x); await new Promise(r => setTimeout(r, 600));
    const big = at();
    x.transpose = 5; await scoreRedraw(x); await new Promise(r => setTimeout(r, 900));
    const other = at();
    x.zoom = 1; x.transpose = 0; await scoreRedraw(x); await new Promise(r => setTimeout(r, 900));
    return {small, big, other};
  });
  yes('it is still there at another size', survived.big && survived.big.say === '5',
    JSON.stringify(survived));
  yes('  and moved with the engraving rather than staying put',
    survived.big && survived.big.x > survived.small.x * 1.5, JSON.stringify(survived));
  yes('  and still there in another key, which is the point of anchoring it to the bar',
    survived.other && survived.other.say === '5', JSON.stringify(survived));
  const cleared = await p.evaluate(async () => {
    const x = scores().find(y => y.title === 'Six Questions');
    document.querySelector('.sc-fing').click();
    await new Promise(r => setTimeout(r, 200));
    const pick = document.querySelector('.sc-fingpick');
    if(pick) pick.querySelector('[data-fing=""]').click();
    await new Promise(r => setTimeout(r, 200));
    return {kept: x.fingerings, drawn: document.querySelectorAll('.sc-fing').length};
  });
  is('and it can be taken off again', cleared.drawn, 0);
  is('  leaving nothing behind', cleared.kept, {});

  console.log('\n7. a press with the layer off is for the bar, not the note');
  const pinned = await p.evaluate(async () => {
    const x = scores().find(y => y.title === 'Six Questions');
    x.overlays.fingerings = false; scoreLayersPaint(x);
    const canvas = document.getElementById('scCanvas');
    const r = canvas.getBoundingClientRect();
    const n = scoreNotes().filter(v => v.midi != null)[0];
    canvas.parentElement.dispatchEvent(new MouseEvent('click', {bubbles:true,
      clientX: r.left + n.x, clientY: r.top + n.y}));
    await new Promise(r => setTimeout(r, 300));
    const open = !!document.querySelector('#pinText');
    const pick = !!document.querySelector('.sc-fingpick');
    document.querySelectorAll('.modal-wrap, .overlay').forEach(v => v.remove());
    return {open, pick};
  });
  yes('the same press asks to pin a note to the bar', pinned.open, JSON.stringify(pinned));
  yes('  and does not offer fingers', !pinned.pick, JSON.stringify(pinned));

  console.log('\n8. nothing threw');
  is('no page errors', errs, []);

  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
