/* smoke206 — the engraver falling over on one mark, and the room surviving it.

   A score arrived that would not draw. The page said "Cannot read properties
   of undefined (reading 'graphicalVoiceEntries')" and showed nothing: no
   notes, no bars, no way in. The file was fine. What was wrong was one 8va
   bracket.

   OSMD works a bracket out by walking from where it starts to where it stops.
   When the bracket runs past the end of a line, it has to hang the
   continuation on the first note of the next line — and it takes that note
   without checking there is one. A line that opens with a bar the hand rests
   in has no first note, so what it hands the bracket is nothing, and the
   bracket reads it. One mark over one bar, and the whole piece refuses.

   It is a family, not a bug: slurs, glissandi, pedal lines and wavy lines are
   all worked out the same way and all assume notes the whole way along. So
   there are two claims here, and they are different claims.

   THE BRACKET REFUSES WHAT IT IS HANDED. Given nothing to hang on it says no,
   which is what the pedal line beside it already did.

   AND A PASS THAT CANNOT FINISH LOSES ONLY ITSELF. Every pass that decorates
   an engraving already drawn is netted, so the notes arrive even when a mark
   over them does not — and the room says which marks it lost rather than
   leaving somebody to wonder where their phrasing went.

   What is being tested is the second one hardest, because it is the one that
   decides whether a file nobody has seen yet opens or does not.
 */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

const HEAD = `<attributes><divisions>4</divisions><key><fifths>0</fifths></key>
  <time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`;
const N = (s, o) => `<note><pitch><step>${s}</step><octave>${o}</octave></pitch><duration>4</duration><voice>1</voice><type>quarter</type></note>`;
const run = o => `${N('C',o)}${N('D',o)}${N('E',o)}${N('F',o)}`;
const bar = (n, body) => `<measure number="${n}">${body}</measure>`;
const UP = `<direction placement="above"><direction-type><octave-shift type="up" size="8" number="1"/></direction-type></direction>`;
const STOP = `<direction placement="above"><direction-type><octave-shift type="stop" size="8" number="1"/></direction-type></direction>`;
const piece = (title, bars) => `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1">
  <work><work-title>${title}</work-title></work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">${bars}</part></score-partwise>`;

/* Two to a line. The 8va runs bars one to six, and bar five — which opens the
   third line — is a bar the hand rests through and writes nothing at all. */
const EIGHTS = piece('The Eight Above', [
  bar(1, HEAD + UP + run(6)), bar(2, run(6)),
  bar(3, run(6)),             bar(4, run(6)),
  bar(5, ''),                 bar(6, run(6) + STOP),
  bar(7, run(5)),             bar(8, run(5))].join(''));
/* the same shape with a slur, which is worked out the same way */
const SLURRED = piece('The Long Phrase', [
  bar(1, HEAD + `<note><pitch><step>C</step><octave>5</octave></pitch><duration>4</duration><voice>1</voice><type>quarter</type><notations><slur type="start" number="1"/></notations></note>${N('D',5)}${N('E',5)}${N('F',5)}`),
  bar(2, run(5)), bar(3, run(5)), bar(4, run(5)), bar(5, ''),
  bar(6, `${N('C',5)}${N('D',5)}${N('E',5)}<note><pitch><step>F</step><octave>5</octave></pitch><duration>4</duration><voice>1</voice><type>quarter</type><notations><slur type="stop" number="1"/></notations></note>`)].join(''));
/* and a piece with nothing clever in it at all */
const PLAIN = piece('Four Plain Bars',
  [bar(1, HEAD + run(5)), bar(2, run(5)), bar(3, run(5)), bar(4, run(5))].join(''));

/* the room's own way in, then two bars to a line and a fresh engraving */
const open = async (p, xml, name, perLine) => {
  await p.evaluate(async x => { await takeScoreFile(new File([x], 'x.musicxml')); }, xml);
  await p.waitForTimeout(4000);
  const r = await p.evaluate(async ([name, perLine]) => {
    const x = scores().find(y => y.title === name);
    x.barsPerLine = perLine;
    await scorePaint(x);
    await new Promise(r => setTimeout(r, 600));
    const said = document.getElementById('scLoading');
    const line = document.querySelector('.sc-dropped');
    return {refused: said ? said.textContent : '',
      heads: document.querySelectorAll('#scCanvas .vf-notehead').length,
      dropped: (scoreView() || {}).dropped || [],
      line: line ? line.textContent : ''};
  }, [name, perLine]);
  return r;
};

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

  console.log('\n1. the bracket that brought the page down');
  const eight = await open(p, EIGHTS, 'The Eight Above', 2);
  /* the whole point: before this, the stage said so and held nothing else */
  yes('a score with an 8va over a bar the hand rests in is drawn',
    eight.refused === '', eight.refused);
  yes('  with its notes on the page, not an apology',
    eight.heads >= 24, String(eight.heads));
  is('  and the bracket is what was given up', eight.dropped, ['octave brackets']);
  yes('  said once, quietly, under the score',
    /octave brackets/.test(eight.line), eight.line);

  console.log('\n2. the refusal itself');
  const refuses = await p.evaluate(() => {
    const proto = opensheetmusicdisplay.VexFlowOctaveShift.prototype;
    /* handed nothing, as the engraver hands it on a line that opens on a rest */
    const nothing = proto.setStartNote.call({}, undefined);
    const empty = proto.setEndNote.call({}, undefined);
    /* and handed a real staff entry it still does its job */
    const real = scoreView() && scoreView().osmd.GraphicSheet.MeasureList
      .map(line => line[0]).filter(m => m && m.staffEntries.length)[0];
    const held = {};
    const took = real ? proto.setStartNote.call(held, real.staffEntries[0]) : null;
    return {nothing, empty, took, got: !!held.startNote};
  });
  is('handed nothing, the bracket says no rather than reading it',
    [refuses.nothing, refuses.empty], [false, false]);
  yes('  and handed a real note it still takes it',
    refuses.took === true && refuses.got === true, JSON.stringify(refuses));

  console.log('\n3. the same shape, worked out the same way');
  const slur = await open(p, SLURRED, 'The Long Phrase', 2);
  yes('a long slur over a silent bar draws too', slur.refused === '', slur.refused);
  yes('  with its notes', slur.heads >= 20, String(slur.heads));

  console.log('\n4. a piece with nothing clever in it');
  const plain = await open(p, PLAIN, 'Four Plain Bars', 2);
  yes('an ordinary score draws', plain.refused === '' && plain.heads >= 16,
    JSON.stringify(plain));
  is('  and nothing was given up', plain.dropped, []);
  is('  so nothing is said', plain.line, '');
  /* the tally belongs to the engraving in front of you, not to the session:
     a score that lost a bracket must not leave the line over the next one */
  yes('  and the line from the score before it is gone',
    !(await p.evaluate(() => !!document.querySelector('.sc-dropped'))));

  console.log('\n5. nothing broke on the way');
  is('no errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
