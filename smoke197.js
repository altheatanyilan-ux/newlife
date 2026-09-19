/* smoke197 — moving a piece into another key.

   A score gets transposed for reasons that have nothing to do with the piece:
   a singer who cannot reach the top note, a horn that reads a tone out, a
   left hand that wants the whole thing a third down for a week. The one thing
   that must not happen is losing the work you have done on the score, so the
   rewrite happens in memory and the file on disk is never touched — and
   everything you have written on it is anchored to bar numbers, not pitches,
   so it survives the move.

   Three claims carry it.

   THE NOTES MOVE AND SO DOES THE SIGNATURE. Rewriting the pitches and leaving
   the key signature alone would put a piece in D major on a page that still
   says two sharps, and every accidental would be written out by hand.

   THE SIGNATURE IS RIGHT. Up a semitone is seven steps clockwise round the
   circle of fifths, not half a step, and past six accidentals the key is
   better written the other way round. D major up a semitone is E flat with
   three flats — never D sharp with nine sharps, which is what the arithmetic
   the specification suggests would give you.

   AND THE SPELLING FOLLOWS THE KEY. A piece that lands in flats is spelled in
   flats, because E flat and D sharp are the same sound and never the same
   thing on a page. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

/* D major — two sharps, a chord symbol written into the file, and a bar with
   an F sharp in it so the spelling has something to get wrong */
const bar = (n, notes) => `<measure number="${n}">${notes}</measure>`;
const N = (step, alter, oct, dur='2', type='quarter') =>
  `<note><pitch><step>${step}</step>${alter?`<alter>${alter}</alter>`:''}<octave>${oct}</octave></pitch><duration>${dur}</duration><type>${type}</type></note>`;
const XML = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1">
  <work><work-title>Two Sharps</work-title></work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1"><attributes><divisions>2</divisions><key><fifths>2</fifths><mode>major</mode></key>
      <time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>
      <harmony><root><root-step>D</root-step></root><kind>major</kind></harmony>
      ${N('D',0,4)}${N('F',1,4)}${N('A',0,4)}${N('D',0,5)}</measure>
    ${[2,3,4,5,6,7,8].map(n => bar(n, N('E',0,4)+N('G',0,4)+N('B',0,4)+N('C',1,5))).join('\n    ')}
  </part>
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
  await p.evaluate(async xml => { await takeScoreFile(new File([xml], 'Two Sharps.musicxml')); }, XML);
  await p.waitForTimeout(5000);

  /* what the score says it is, and what its first bar actually sounds */
  const read = async () => p.evaluate(() => ({
    key: scoreKey(), name: scoreKeyName(),
    first: scoreNotes().filter(n => n.measure === 1 && n.midi != null)
      .sort((a, x) => a.midi - x.midi).map(n => [noteLetter(n), n.midi]),
  }));

  console.log('\n1. as the composer wrote it');
  let r = await read();
  is('two sharps', r.key, {fifths:2, minor:false});
  is('  which is D major', r.name, 'D major');
  is('and the first bar is a D chord', r.first, [['D',62],['F♯',66],['A',69],['D',74]]);

  console.log('\n2. up a tone');
  await p.evaluate(async () => { const x = scores()[0]; x.transpose = 2; await scoreRedraw(x); });
  await p.waitForTimeout(1200);
  r = await read();
  is('four sharps', r.key, {fifths:4, minor:false});
  is('  which is E major', r.name, 'E major');
  /* the signature moved with the notes: if it had not, every note in the
     piece would be carrying a written-out accidental */
  is('and the chord came up with it', r.first, [['E',64],['G♯',68],['B',71],['E',76]]);

  console.log('\n3. up a semitone, which is the one the arithmetic gets wrong');
  await p.evaluate(async () => { const x = scores()[0]; x.transpose = 1; await scoreRedraw(x); });
  await p.waitForTimeout(1200);
  r = await read();
  /* seven steps clockwise from two sharps is nine sharps, and nine sharps is
     three flats written the other way round. Nobody has ever engraved D sharp
     major and nobody wants to read it. */
  is('three flats, not nine sharps', r.key, {fifths:-3, minor:false});
  is('  which is E flat major', r.name, 'E♭ major');
  yes('  rather than D sharp major', r.name.indexOf('D♯') < 0, r.name);
  is('and the notes are spelled in flats to match', r.first, [['E♭',63],['G',67],['B♭',70],['E♭',75]]);

  console.log('\n4. down a semitone');
  await p.evaluate(async () => { const x = scores()[0]; x.transpose = -1; await scoreRedraw(x); });
  await p.waitForTimeout(1200);
  r = await read();
  is('five flats', r.key, {fifths:-5, minor:false});
  is('  which is D flat major', r.name, 'D♭ major');
  is('and the chord went down with it', r.first, [['D♭',61],['F',65],['A♭',68],['D♭',73]]);

  console.log('\n5. an octave moves the notes and leaves the key alone');
  await p.evaluate(async () => { const x = scores()[0]; x.transpose = 12; await scoreRedraw(x); });
  await p.waitForTimeout(1200);
  r = await read();
  is('still two sharps', r.key, {fifths:2, minor:false});
  is('  and every note twelve higher', r.first, [['D',74],['F♯',78],['A',81],['D',86]]);

  console.log('\n6. back to what is written');
  await p.evaluate(async () => { const x = scores()[0]; x.transpose = 0; await scoreRedraw(x); });
  await p.waitForTimeout(1200);
  r = await read();
  is('two sharps again', r.key, {fifths:2, minor:false});
  is('  and the bar as the composer left it', r.first, [['D',62],['F♯',66],['A',69],['D',74]]);
  /* the whole reason the rewrite happens in memory */
  const kept = await p.evaluate(() => {
    const x = scores()[0];
    return {fifths: /<fifths>(-?\d+)<\/fifths>/.exec(x.musicXml)[1],
      step: /<step>([A-G])<\/step>/.exec(x.musicXml)[1]};
  });
  is('the file on disk was never touched', kept, {fifths:'2', step:'D'});

  console.log('\n7. the buttons, and what they say');
  await p.evaluate(() => { const n = document.querySelector('#scMore'); if(n) n.click(); });
  await p.waitForTimeout(400);
  const flat = await p.evaluate(async () => {
    document.querySelector('[data-scxp="-1"]').click();
    await new Promise(r => setTimeout(r, 2500));
    const x = scores()[0];
    return {by: x.transpose, say: document.querySelector('#scXpSay').textContent,
      off: document.querySelector('#scXpOff').disabled};
  });
  is('the flat button takes it down a semitone', flat.by, -1);
  is('  and the readout names the key it landed in', flat.say, 'D♭ major · −1');
  yes('  with the way back no longer greyed out', flat.off === false, JSON.stringify(flat));
  const back = await p.evaluate(async () => {
    document.querySelector('#scXpOff').click();
    await new Promise(r => setTimeout(r, 2500));
    const x = scores()[0];
    return {by: x.transpose, say: document.querySelector('#scXpSay').textContent,
      off: document.querySelector('#scXpOff').disabled};
  });
  is('"as written" puts it back', back.by, 0);
  is('  and says so', back.say, 'D major');
  yes('  and greys itself out again', back.off === true, JSON.stringify(back));

  console.log('\n8. what you wrote on the score survives the move');
  const marks = await p.evaluate(async () => {
    const x = scores()[0];
    addScoreSection(x.id, {name:'Opening', startMeasure:1, endMeasure:4, color:'#5c7c8a'});
    x.pins.push(scorePinDefaults({id:uid(), measure:3, text:'thumb under here'}));
    x.transpose = 3;
    await scoreRedraw(x);
    await new Promise(r => setTimeout(r, 600));
    const y = scores()[0];
    return {secs: y.sections.map(s => [s.name, s.startMeasure, s.endMeasure]),
      pins: y.pins.map(q => [q.measure, q.text]),
      bands: document.querySelectorAll('.sc-band').length,
      dots: document.querySelectorAll('.sc-pin').length};
  });
  is('the section is still on the bars it was on', marks.secs, [['Opening',1,4]]);
  is('  and the pin on its bar', marks.pins, [[3,'thumb under here']]);
  yes('  both still drawn on the page', marks.bands > 0 && marks.dots > 0, JSON.stringify(marks));

  console.log('\n9. the interval is the piece’s, and it keeps');
  await p.evaluate(() => { scoreUi().id = null; rerender(); });
  await p.waitForTimeout(500);
  await p.reload(); await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));
  await p.evaluate(() => { location.hash = '#/score'; }); await p.waitForTimeout(1200);
  const after = await p.evaluate(() => scores()[0].transpose);
  is('it is still a minor third up when you come back', after, 3);
  await p.evaluate(async () => { const x = scores()[0]; scoreUi().id = x.id; rerender(); });
  await p.waitForTimeout(5000);
  r = await read();
  is('  and the piece opens in the key you left it in', r.name, 'F major');

  console.log('\n10. the rewrite is done once, not on every redraw');
  /* Counting the calls, not comparing the strings: two separate rewrites of
     the same file produce equal text, so `a === b` is true whether the work
     was cached or done three times over — which is the bug it was meant to
     catch. Rewriting a three-hundred-kilobyte document on every redraw is the
     difference between a zoom that is instant and one that stutters. */
  const cached = await p.evaluate(() => {
    const x = scores()[0];
    const real = window.transposeMusicXml;
    let calls = 0;
    window.transposeMusicXml = (xml, by) => { calls++; return real(xml, by); };
    x.transpose = 7;
    const a = scoreXmlFor(x), b = scoreXmlFor(x), c = scoreXmlFor(x);
    const thrice = calls;
    x.transpose = 4;
    const d = scoreXmlFor(x);
    const after = calls;
    window.transposeMusicXml = real;
    x.transpose = 3;
    return {thrice, after, same: a === b && b === c, moved: d !== a, notTheFile: a !== x.musicXml};
  });
  is('three redraws in one key do the work once', cached.thrice, 1);
  is('  and a change of key does it once more', cached.after, 2);
  yes('asking twice gives the same rewrite back', cached.same, JSON.stringify(cached));
  /* a chord symbol is a pitch too, and one that would otherwise be left
     naming the old key over the new notes */
  const harm = await p.evaluate(() => {
    const x = scores()[0];
    const at = by => { const out = transposeMusicXml(x.musicXml, by);
      const st = /<root-step>([A-G])<\/root-step>/.exec(out);
      const al = /<root-alter>(-?\d+)<\/root-alter>/.exec(out);
      return (st ? st[1] : '?') + (al ? (al[1] === '-1' ? '\u266d' : '\u266f') : ''); };
    return {up: at(2), down: at(-1)};
  });
  is('a chord symbol moves with the notes', harm, {up:'E', down:'D\u266d'});
  yes('  changing the interval does the work again', cached.moved, JSON.stringify(cached));
  yes('  and none of it is the file itself', cached.notTheFile, JSON.stringify(cached));

  console.log('\n11. nothing threw');
  is('no page errors', errs, []);

  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
