/* smoke195 — Score Practice.

   A practice companion rather than a notation editor, and the distinction is
   the whole design. It does not teach you the piece, play it, or let you
   change a note. It engraves the notation you bring and keeps what you have
   written on it, because a sentence about bar 60 belongs at bar 60: in a
   practice diary it is something you read in three weeks, on the page it is
   something you cannot miss the next time you play it.

   Four claims are load-bearing.

   THE ENGRAVER COSTS NOTHING UNTIL IT IS USED. A megabyte of library renders
   the notation, and a megabyte of JavaScript parsed at boot to serve one room
   most days go by without opening is a tax on every other room. So it is not
   in the script the app lives in — it sits at the end of the document as a
   payload the browser stores and does not parse, and the room compiles it the
   first time somebody opens a score.

   ONLY YOUR PART. Switching a part off is why a duet player wants this room at
   all, and the one refusal is switching off the last one: a score with nothing
   visible is a blank box, which reads as a fault rather than a choice.

   A SECTION IS A MEASURE RANGE AND A PARAGRAPH. Named, coloured, banded behind
   the right bars on the page, carrying what that passage needs and how it is
   going.

   AND FOCUS IS A REAL CLIP. Practising a section draws that section and
   nothing else. Dimming the rest would have been cheaper and would have left
   the passage surrounded by the thing you were trying to stop looking at. It
   costs a re-reading of the file, and it is only ever paid when the range
   changes — never for a zoom, a part, or a note written in the margin. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

/* a two-part score, short enough to engrave quickly and long enough to mark
   sections in and leave some of it outside a focus range */
const part = (id, bars) => `    <part id="${id}">
      <measure number="1">
        <attributes><divisions>1</divisions><key><fifths>0</fifths></key>
          <time><beats>4</beats><beat-type>4</beat-type></time>
          <clef><sign>G</sign><line>2</line></clef></attributes>
        <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note>
      </measure>
${Array.from({length: bars - 1}, (_, i) => `      <measure number="${i + 2}">
        <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note>
      </measure>`).join('\n')}
    </part>`;
const XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <work><work-title>Sonatina for Two</work-title></work>
  <identification><creator type="composer">A Test Composer</creator></identification>
  <part-list>
    <score-part id="P1"><part-name>Primo</part-name></score-part>
    <score-part id="P2"><part-name>Secondo</part-name></score-part>
  </part-list>
${part('P1', 16)}
${part('P2', 16)}
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

  console.log('\n1. the engraver is carried but not parsed');
  const cold = await p.evaluate(() => ({
    payload: !!document.getElementById('osmdSrc'),
    heavy: (document.getElementById('osmdSrc') || {textContent:''}).textContent.length > 500000,
    type: (document.getElementById('osmdSrc') || {}).getAttribute
      ? document.getElementById('osmdSrc').getAttribute('type') : null,
    compiled: typeof opensheetmusicdisplay,
    known: osmdBuiltIn()}));
  yes('it is in the document', cold.payload && cold.heavy, JSON.stringify(cold));
  is('  as something the browser will not run', cold.type, 'text/plain');
  is('  so nothing of it has been compiled yet', cold.compiled, 'undefined');
  yes('  and the room knows it is there', cold.known);

  console.log('\n2. the room, and a score brought into it');
  await p.evaluate(() => { location.hash = '#/score'; }); await p.waitForTimeout(1400);
  yes('the page is there', await p.evaluate(() => !!document.querySelector('.sc-page')));
  yes('  with somewhere to drop a file', await p.evaluate(() => !!document.querySelector('#scDrop')));
  yes('  and the sidebar opens it', await p.evaluate(() => !!document.querySelector('.nav a[href="#/score"]')));
  /* the title and the composer come off the file, so a score arrives named */
  const made = await p.evaluate(async xml => {
    const rec = await takeScoreFile(new File([xml], 'whatever-i-called-it.musicxml'));
    return rec && {title: rec.title, composer: rec.composer, bytes: rec.musicXml.length};
  }, XML);
  is('the score names itself from the file', [made.title, made.composer],
    ['Sonatina for Two', 'A Test Composer']);
  await p.waitForTimeout(4500);
  const drawn = await p.evaluate(() => ({
    svg: !!document.querySelector('#scCanvas svg'),
    notes: document.querySelectorAll('#scCanvas .vf-stavenote').length,
    bars: scores()[0].totalMeasures,
    compiled: typeof opensheetmusicdisplay}));
  yes('it is engraved', drawn.svg && drawn.notes > 0, JSON.stringify(drawn));
  is('  all sixteen bars of it', drawn.bars, 16);
  is('  and opening one is what compiled the engraver', drawn.compiled, 'object');
  /* a file that is not notation is refused in words rather than half-read */
  const refused = await p.evaluate(async () => {
    const before = scores().length;
    await takeScoreFile(new File(['%PDF-1.7 not notation at all'], 'scan.musicxml'));
    return scores().length - before; });
  is('a file with no notation in it is not taken', refused, 0);

  console.log('\n3. only your part');
  const parts = await p.evaluate(() => scoreParts(scores()[0]).map(x => [x.name, x.visible]));
  is('both parts are known, and both are on', parts, [['Primo', true], ['Secondo', true]]);
  const solo = await p.evaluate(async () => {
    const x = scores()[0];
    setScorePartVisible(x, 1, false);
    await scoreRedraw(x);
    return {hidden: x.hidden, notes: document.querySelectorAll('#scCanvas .vf-stavenote').length};
  });
  is('switching one off hides it', solo.hidden, [1]);
  is('  and half the notes go with it', solo.notes, 16);
  /* the refusal that matters: a score with nothing visible is a blank box,
     which reads as a fault rather than as something you asked for */
  const lastOne = await p.evaluate(() => {
    const x = scores()[0];
    const took = setScorePartVisible(x, 0, false);
    return {took, hidden: x.hidden};
  });
  is('the last visible part will not go', [lastOne.took, lastOne.hidden], [false, [1]]);
  await p.evaluate(async () => { const x = scores()[0]; x.hidden = []; await scoreRedraw(x); });
  await p.waitForTimeout(1500);
  is('  and both come back', await p.evaluate(() => document.querySelectorAll('#scCanvas .vf-stavenote').length), 32);

  console.log('\n4. a section is a range, a colour and a paragraph');
  const secs = await p.evaluate(() => {
    const x = scores()[0];
    addScoreSection(x.id, {name:'Exposition', startMeasure:1, endMeasure:6, color:'#5c7c8a',
      status:'working', notes:'Do not rush the arpeggios in m.4.'});
    addScoreSection(x.id, {name:'Coda', startMeasure:12, endMeasure:16, color:'#b0705e', status:'rough'});
    /* a range that runs off the end of the piece is clamped to the notation
       that exists rather than drawn into empty space */
    const over = addScoreSection(x.id, {name:'Off the end', startMeasure:14, endMeasure:900});
    scoreSidePaint(x); scoreOverlayPaint(x);
    return {names: x.sections.map(s => s.name), clamped: over.endMeasure};
  });
  is('they are kept in the order they are played', secs.names, ['Exposition', 'Coda', 'Off the end']);
  is('  and a range past the last bar stops at the last bar', secs.clamped, 16);
  await p.waitForTimeout(700);
  const bands = await p.evaluate(() => [...document.querySelectorAll('.sc-band')]
    .map(n => ({w: Math.round(parseFloat(n.style.width)), h: Math.round(parseFloat(n.style.height))})));
  yes('each one is a band behind the notation', bands.length >= 2, JSON.stringify(bands));
  /* A band one staff-gap tall is a stripe through the middle of the notes. A
     band a whole system tall is a block hanging down the page across the lines
     underneath. Both have shipped from this file, in that order, so the claim
     is bounded at both ends: it is the height of one staff. */
  yes('  as tall as the staff it sits behind, and no taller',
    bands.every(x => x.h >= 30 && x.h <= 70), JSON.stringify(bands));
  yes('  and the panel reads them back with what each one needs',
    await p.evaluate(() => /Do not rush the arpeggios/.test(document.querySelector('#scSide').textContent)));
  is('  saying how each is going', await p.evaluate(() =>
    [...document.querySelectorAll('.sc-sec-s')].map(n =>
      (n.textContent.replace(/\s+/g, ' ').trim().split('·')[0].trim().split(' ')[1]) || '')),
    ['Working', 'Rough', 'Not']);

  console.log('\n5. focus is a clip, not a dimming');
  const before = await p.evaluate(() => document.querySelectorAll('#scCanvas .vf-stavenote').length);
  await p.evaluate(() => { const x = scores()[0]; scoreUi().focus = x.sections[0].id; rerender(); });
  await p.waitForTimeout(5000);
  const inFocus = await p.evaluate(() => ({
    notes: document.querySelectorAll('#scCanvas .vf-stavenote').length,
    bars: [...new Set(measureBoxes().map(m => m.measure))].sort((a, b) => a - b),
    bar: !!document.querySelector('.sc-focusbar'),
    log: !!document.querySelector('#scLog')}));
  is('only the section is drawn', inFocus.bars, [1,2,3,4,5,6]);
  yes('  the rest of the piece is not on the page at all', inFocus.notes < before,
    `${inFocus.notes} of ${before}`);
  yes('  and the room says which passage you are in, with a way to log it',
    inFocus.bar && inFocus.log);
  await p.evaluate(() => { scoreUi().focus = null; rerender(); });
  await p.waitForTimeout(5000);
  is('leaving it brings the whole piece back',
    await p.evaluate(() => document.querySelectorAll('#scCanvas .vf-stavenote').length), before);

  console.log('\n6. a pin is a sentence about one bar');
  const pinned = await p.evaluate(() => {
    const x = scores()[0];
    x.pins.push(scorePinDefaults({measure:4, text:'5-3-1 here, not 5-2-1.'}));
    saveNow(); scoreSidePaint(x); scoreOverlayPaint(x);
    return {drawn: document.querySelectorAll('.sc-pin').length,
      listed: /5-3-1 here/.test(document.querySelector('#scSide').textContent),
      /* it knows which section it fell in, which is how the popover can say so */
      inSection: (sectionAtMeasure(x, 4) || {}).name};
  });
  is('it is drawn on the page', pinned.drawn, 1);
  yes('  and listed beside it', pinned.listed);
  is('  knowing which section it landed in', pinned.inSection, 'Exposition');
  /* a pin on a bar that is not being drawn is not drawn either — it would
     otherwise be pinned over whatever is at those coordinates instead */
  const away = await p.evaluate(() => {
    const x = scores()[0];
    x.pins.push(scorePinDefaults({measure:14, text:'a pin outside the focus'}));
    scoreUi().focus = x.sections[0].id;
    return renderScore(x, {from:1, to:6}).then(() => { scoreOverlayPaint(x);
      return document.querySelectorAll('.sc-pin').length; });
  });
  is('a pin outside the clipped range is left off', away, 1);
  await p.evaluate(() => { scoreUi().focus = null; const x = scores()[0];
    x.pins = x.pins.filter(y => y.measure === 4); rerender(); });
  await p.waitForTimeout(5000);

  console.log('\n7. practising a section is what moves it');
  const logged = await p.evaluate(() => {
    const x = scores()[0], s = x.sections[0];
    S.skills = (S.skills || []).filter(k => !/piano/i.test(k.name || ''));
    const invented = (() => { logScorePractice(x.id, s.id, 30);
      return (S.skills || []).some(k => /piano/i.test(k.name || '')); })();
    S.skills.push({id:uid(), name:'Piano', hours:1, cat:'craft'});
    logScorePractice(x.id, s.id, 30);
    const sk = S.skills.find(k => k.name === 'Piano');
    return {invented, count: s.practiceCount, when: s.lastPracticedDate,
      hours: Math.round((sk.hours - 1) * 100) / 100, rows: x.practice.length,
      today: scoreMinutesOn(x, today())};
  });
  yes('practising invents no skill', !logged.invented);
  is('  the section counts it', logged.count, 2);
  is('  and dates it', logged.when, await p.evaluate(() => today()));
  is('  half an hour is half an hour on the skill', logged.hours, 0.5);
  is('  and the day knows what it held', logged.today, 60);

  console.log('\n8. two tempos, and the distance between them');
  /* A target alone is a wish. A target beside what you can hold today is a
     plan, and the gap closing is the only evidence the slow practice works. */
  const tempo = await p.evaluate(() => {
    const x = scores()[0], s = x.sections[1];
    const quiet = scoreTempoSay(s);
    s.targetTempo = 120; s.comfortTempo = 80;
    const said = scoreTempoSay(s);
    /* logging a faster comfortable tempo is how the gap closes */
    logScorePractice(x.id, s.id, 15, {comfort: 104});
    return {quiet, said, after: s.comfortTempo, closed: scoreTempoSay(s)};
  });
  is('a section nobody has put a number on says nothing', tempo.quiet, '');
  yes('  one with both says how far there is to go', /120/.test(tempo.said) && /40 to go/.test(tempo.said), tempo.said);
  is('logging what you could hold moves it', tempo.after, 104);
  yes('  and the distance closes with it', /16 to go/.test(tempo.closed), tempo.closed);

  console.log('\n9. what the library costs, said out loud');
  const cost = await p.evaluate(() => ({
    weight: scoreLibraryWeight(), said: scoreSaid(scoreLibraryWeight()),
    heavy: scoreLibraryHeavy(),
    heavyWhenBig: (() => { const x = scores()[0], keep = x.musicXml;
      x.musicXml = 'x'.repeat(7 * 1024 * 1024);
      const h = scoreLibraryHeavy(); x.musicXml = keep; return h; })()}));
  yes('the room knows what it is carrying', cost.weight > 1000, String(cost.weight));
  yes('  and says it in a unit a person reads', /KB|MB/.test(cost.said), cost.said);
  yes('  quietly while it is small', !cost.heavy);
  yes('  and out loud once it is not', cost.heavyWhenBig);
  await p.evaluate(() => { location.hash = '#/score'; scoreUi().id = null; rerender(); });
  await p.waitForTimeout(1300);
  yes('the shelf says it too', await p.evaluate(() => !!document.querySelector('.sc-weigh')));

  console.log('\n10. the week, in the review');
  const lines = await p.evaluate(() => scoreReviewLines(addDays(today(), -7), today()));
  yes('it counts the sections practised', lines.some(l => /practised at the score/.test(l)), JSON.stringify(lines));
  yes('  and names one that has never been touched',
    lines.some(l => /never been practised/.test(l)), JSON.stringify(lines));
  const quiet = await p.evaluate(() => { const keep = S.scores; S.scores = [];
    const said = scoreReviewLines(addDays(today(), -7), today()); S.scores = keep; return said; });
  is('a shelf with nothing on it has nothing to say', quiet, []);

  console.log('\n11. bars to a line');
  /* section nine left us on the shelf; open the score again */
  await p.evaluate(() => { const x = scores()[0]; scoreUi().id = x.id; scoreUi().focus = null;
    location.hash = '#/score/' + x.id; });
  await p.waitForTimeout(5000);
  /* Two bars to a line is not a score, it is a lookup. The eye reads a phrase
     and a phrase is rarely two bars long, so the number is adjustable — and it
     is a promise rather than a ceiling: the engraver's own setting will
     happily give five when eight were asked for, if five is all the width
     takes, so the engraving is shrunk until the number asked for arrives. */
  const perLine = async n => {
    await p.evaluate(async k => { const x = scores()[0]; x.barsPerLine = k; await scoreRedraw(x); }, n);
    await p.waitForTimeout(900);
    return p.evaluate(() => { const rows = {};
      measureBoxes().forEach(b => { const k = Math.round(b.y / 20); rows[k] = (rows[k] || 0) + 1; });
      return Math.max(...Object.values(rows)); });
  };
  is('asking for four gives four', await perLine(4), 4);
  is('  asking for six gives six', await perLine(6), 6);
  /* the one that proves it is a promise: six fits at this width, eight does
     not, and eight still arrives */
  is('  and asking for eight gives eight, by making the engraving smaller', await perLine(8), 8);
  /* Eight may well fit at full size on a wide screen, so the mechanism is only
     really shown by asking for a number that cannot: fourteen bars in this
     column is not a thing the engraver will do until the engraving is made
     smaller, and fourteen still arrive. */
  is('  and fourteen, which needs the shrinking', await perLine(14), 14);
  const sized = await p.evaluate(() => { const sv = scoreView();
    return {fitted: !!sv.fitted, zoom: sv.fitted && sv.fitted.zoom, set: scores()[0].zoom}; });
  yes('    which is where the size came from', sized.fitted && sized.zoom < sized.set,
    JSON.stringify(sized));
  await p.evaluate(async () => { const x = scores()[0]; x.barsPerLine = 0; await scoreRedraw(x); });
  await p.waitForTimeout(900);
  is('nought hands the line breaks back to the engraver',
    await p.evaluate(() => !!scoreView().fitted), false);

  console.log('\n12. reading: the score, and nothing else');
  /* A tablet on the music desk. Everything you press between sittings is
     something you are not looking at while your hands are busy. */
  await p.evaluate(() => document.querySelector('#scRead').click());
  await p.waitForTimeout(4500);
  const reading = await p.evaluate(() => ({
    on: document.documentElement.classList.contains('sc-reading'),
    sidebar: getComputedStyle(document.querySelector('.sidebar')).display,
    panel: document.querySelector('.sc-side') ? getComputedStyle(document.querySelector('.sc-side')).display : 'gone',
    bar: document.querySelector('.sc-bar') ? getComputedStyle(document.querySelector('.sc-bar')).display : 'gone',
    strip: !!document.querySelector('#scStrip'),
    out: !!document.querySelector('#scUnread'),
    full: Math.round(document.querySelector('#scStage').getBoundingClientRect().height) >= innerHeight - 2}));
  yes('the room goes', reading.on && reading.sidebar === 'none'
    && reading.panel === 'none' && reading.bar === 'none', JSON.stringify(reading));
  yes('  the stage takes the whole glass', reading.full, JSON.stringify(reading));
  yes('  and the one strip left carries the way out', reading.strip && reading.out);
  /* more width is more bars a line, which is most of why this mode exists */
  const wide = await p.evaluate(() => { const rows = {};
    measureBoxes().forEach(b => { const k = Math.round(b.y / 20); rows[k] = (rows[k] || 0) + 1; });
    return Math.max(...Object.values(rows)); });
  yes('  and the line gets longer for it', wide >= 6, `${wide} bars a line`);
  /* the strip takes itself away, and a touch brings it back */
  await p.waitForTimeout(4200);
  yes('the strip goes quiet on its own',
    await p.evaluate(() => document.documentElement.classList.contains('sc-quiet')));
  await p.mouse.move(500, 400); await p.waitForTimeout(400);
  yes('  and a touch brings it back',
    await p.evaluate(() => !document.documentElement.classList.contains('sc-quiet')));
  /* a tap on the page is for waking the strip, never for pinning: your hands
     are on the keys and an accidental pin every time you brush the glass is
     worse than having no pins at all */
  const tapped = await p.evaluate(() => {
    const x = scores()[0], stage = document.querySelector('#scStage');
    /* squarely in the middle of a real bar, in the coordinates the handler
       reads — a tap at an arbitrary point would land on nothing and pass
       whether the guard is there or not */
    const box = measureBoxes()[0];
    const r = stage.getBoundingClientRect();
    const at = {clientX: r.left + box.x + box.w / 2 - stage.scrollLeft,
      clientY: r.top + box.y + box.h / 2 - stage.scrollTop};
    const hits = measureAt(box.x + box.w / 2, box.y + box.h / 2);
    stage.dispatchEvent(new MouseEvent('click', Object.assign({bubbles:true}, at)));
    return {onABar: hits, after: x.pins.length, before: x.pins.length,
      open: !!document.querySelector('.sc-modal')};
  });
  yes('the tap really did land on a bar', !!tapped.onABar, String(tapped.onABar));
  yes('  and it opened nothing', !tapped.open);
  /* the marks are yours to keep or hide, since they are notes rather than chrome */
  const marks = await p.evaluate(() => { const before = document.querySelectorAll('.sc-band').length;
    document.querySelector('#scMarks').click();
    return {before, after: document.querySelectorAll('.sc-band').length}; });
  yes('the marks can be taken off the page', marks.before > 0 && marks.after === 0, JSON.stringify(marks));
  await p.evaluate(() => document.querySelector('#scMarks').click()); await p.waitForTimeout(400);
  /* leaving by any other door has to put the instrument back, or the whole
     app is left without a sidebar */
  await p.evaluate(() => { location.hash = '#/today'; }); await p.waitForTimeout(1600);
  const left = await p.evaluate(() => ({cls: document.documentElement.classList.contains('sc-reading'),
    sidebar: getComputedStyle(document.querySelector('.sidebar')).display,
    quiet: document.documentElement.classList.contains('sc-quiet')}));
  yes('walking out of the room another way puts it back',
    !left.cls && left.sidebar !== 'none' && !left.quiet, JSON.stringify(left));
  await p.evaluate(() => { location.hash = '#/score/' + scores()[0].id; }); await p.waitForTimeout(4000);

  console.log('\n13. taking one off the shelf');
  const gone = await p.evaluate(() => { const id = scores()[0].id;
    removeScore(id); return {left: scores().length, still: !!scoreById(id)}; });
  is('the score goes, and its notes with it', [gone.left, gone.still], [0, false]);

  console.log('\n14. nothing threw');
  is('no page errors', errs, []);

  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
