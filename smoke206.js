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

   TWO DEFENCES HERE ARE NOT COVERED, and saying so is better than leaving
   them looking tested. The net under the octave-shift pass, and the quiet
   guard around the spacing calculations, both sit beneath a cause that has
   since been fixed properly — empty bars are filled with a rest nobody
   prints, so the brackets always have something to hang on. Nothing that can
   be written as MusicXML trips either of them any more. They stay, because
   the fix is a setting on somebody else's library and the next version of it
   could move; but no sabotage of them makes a claim below fail, and they
   should be read as unproven.
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
/* An 8va that runs past the end of a line, with the bracket left to be
   picked up on the next one. This is the shape that used to take the whole
   score down and then, once it could not, used to have its bracket quietly
   dropped instead. */
const OTTAVA = piece('The Eight Held', [
  bar(1, HEAD + UP + run(6)), bar(2, run(6)), bar(3, run(6)), bar(4, run(6)),
  bar(5, run(6)), bar(6, run(6) + STOP), bar(7, run(5)), bar(8, run(5))].join(''));
/* a trill held across bars where the hand it belongs to has nothing written
   for it at all \u2014 not even a rest, which is how engravers write it */
const TRILL = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1">
  <work><work-title>The Long Trill</work-title></work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
  <measure number="1"><attributes><divisions>4</divisions><key><fifths>0</fifths></key>
    <time><beats>4</beats><beat-type>4</beat-type></time><staves>2</staves>
    <clef number="1"><sign>G</sign><line>2</line></clef>
    <clef number="2"><sign>F</sign><line>4</line></clef></attributes>
    <note><pitch><step>C</step><octave>5</octave></pitch><duration>16</duration><voice>1</voice><type>whole</type><staff>1</staff></note>
    <backup><duration>16</duration></backup>
    <note><pitch><step>C</step><octave>3</octave></pitch><duration>16</duration><voice>2</voice><type>whole</type><staff>2</staff><notations><ornaments><trill-mark/><wavy-line type="start" number="1"/></ornaments></notations></note>
  </measure>
  <measure number="2"><note><pitch><step>D</step><octave>5</octave></pitch><duration>16</duration><voice>1</voice><type>whole</type><staff>1</staff></note></measure>
  <measure number="3"><note><pitch><step>E</step><octave>5</octave></pitch><duration>16</duration><voice>1</voice><type>whole</type><staff>1</staff></note></measure>
  <measure number="4"><note><pitch><step>F</step><octave>5</octave></pitch><duration>16</duration><voice>1</voice><type>whole</type><staff>1</staff></note>
    <backup><duration>16</duration></backup>
    <note><pitch><step>C</step><octave>3</octave></pitch><duration>16</duration><voice>2</voice><type>whole</type><staff>2</staff><notations><ornaments><wavy-line type="stop" number="1"/></ornaments></notations></note>
  </measure>
  </part></score-partwise>`;

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
  /* It used to lose the bracket to save the score. It does not any more —
     see section 5 — so there is nothing to report here. */
  is('  and nothing is given up to do it', eight.dropped, []);
  is('  so the room says nothing', eight.line, '');
  /* The net is still under everything, and there is no longer a file in hand
     that trips it. What can be tested is what it would say if it ever did,
     which is the part somebody would have to read. */
  const wouldSay = await p.evaluate(() => {
    const was = scoreView().dropped;
    const one = (() => { scoreView().dropped = ['octave brackets'];
      scoreDroppedPaint();
      const n = document.querySelector('.sc-dropped');
      return n ? n.textContent : ''; })();
    const two = (() => { scoreView().dropped = ['slurs', 'wavy lines'];
      return scoreDroppedSay(); })();
    scoreView().dropped = was; scoreDroppedPaint();
    return {one, two, gone: !document.querySelector('.sc-dropped')};
  });
  yes('  and if a mark ever were lost, it would be said once and quietly',
    /octave brackets/.test(wouldSay.one), wouldSay.one);
  yes('    naming each one that went', /slurs and wavy lines/.test(wouldSay.two), wouldSay.two);
  yes('    and saying nothing when nothing went', wouldSay.gone);

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

  console.log('\n5. the marks are drawn, not given up');
  /* Catching a failure and losing the mark is better than losing the score
     and worse than drawing the mark. What made all three of these fall over
     is one thing: a bar the hand rests through, written in the file as
     nothing at all. The engraver can fill those with a whole rest it does
     not print, and then the brackets have something to hang on. */
  const held = await open(p, OTTAVA, 'The Eight Held', 2);
  yes('an 8va that runs past the end of a line still draws the score',
    held.refused === '' && held.heads >= 24, JSON.stringify(held));
  is('  and gives nothing up to do it', held.dropped, []);
  const bracket = await p.evaluate(() => {
    const svg = document.querySelector('#scCanvas');
    const said = [...svg.querySelectorAll('text')].map(t => t.textContent.trim()).join('');
    /* what the engraver holds, and what it put on the page */
    let n = 0;
    for(const page of scoreView().osmd.GraphicSheet.MusicPages)
      for(const sys of page.MusicSystems) for(const sl of sys.StaffLines)
        n += (sl.OctaveShifts || []).length;
    return {held: n, said: /8v/.test(said.replace(/\s/g, ''))};
  });
  yes('  the bracket is worked out', bracket.held > 0, String(bracket.held));
  yes('  and it is on the page', bracket.said);

  /* two bars to a line, which is the layout that puts the trill's two ends
     on different lines with nothing written on that staff in between — the
     shape that used to take every wavy line in the piece with it */
  const trill = await open(p, TRILL, 'The Long Trill', 2);
  yes('a trill over bars the hand rests through draws too',
    trill.refused === '' && trill.heads >= 4, JSON.stringify(trill));
  is('  with nothing given up', trill.dropped, []);
  const wavy = await p.evaluate(() => {
    let n = 0;
    for(const page of scoreView().osmd.GraphicSheet.MusicPages)
      for(const sys of page.MusicSystems) for(const sl of sys.StaffLines)
        n += (sl.WavyLines || []).length;
    return n;
  });
  yes('  and the trill line itself is there', wavy > 0, String(wavy));

  /* The whole rest the engraver fills an empty bar with must not be printed:
     a bar the file leaves empty is a bar the reader should see as empty. It
     takes room on the page either way — that is how it gives the brackets
     somewhere to hang — so the question is only whether any ink lands on
     it. Drawn twice at the same size, once the room's way and once with the
     rest made visible: same layout, and the room's way has less on it. */
  const draw = async fill => {
    const h = await p.evaluate(async ([fill]) => {
      document.querySelectorAll('#pixbox').forEach(n => n.remove());
      const box = document.createElement('div');
      box.id = 'pixbox';
      box.style.cssText = 'width:820px;background:#fff;position:fixed;left:0;top:0;z-index:99999';
      document.body.appendChild(box);
      const lib = await osmdBoot();
      const o = new lib.OpenSheetMusicDisplay(box, {autoResize:false, backend:'svg',
        drawTitle:false, drawComposer:false, drawCredits:false, drawPartNames:false,
        drawMeasureNumbers:false});
      const r = o.EngravingRules || o.rules;
      if(r){ r.FillEmptyMeasuresWithWholeRest = fill;
        r.RenderXMeasuresPerLineAkaSystem = 2; }
      await o.load(scores().find(x => x.title === 'The Long Trill').musicXml);
      o.zoom = 1; o.render();
      const svg = box.querySelector('svg');
      return Math.round(svg.getBoundingClientRect().height);
    }, [fill]);
    await p.waitForTimeout(400);
    return {shot: await p.locator('#pixbox').screenshot(), h};
  };
  const roomFill = await p.evaluate(() => {
    const r = scoreView().osmd.EngravingRules || scoreView().osmd.rules;
    return r ? r.FillEmptyMeasuresWithWholeRest : -1; });
  const mine = await draw(roomFill), inked = await draw(1);
  await p.evaluate(() => document.querySelectorAll('#pixbox').forEach(n => n.remove()));
  is('  the bar it filled in takes the same room either way', mine.h, inked.h);
  yes('    and the room does not print what it filled it with',
    Buffer.compare(mine.shot, inked.shot) !== 0,
    `fill=${roomFill}: ${mine.shot.length} vs ${inked.shot.length} bytes`);

  console.log('\n6. nothing broke on the way');
  is('no errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
