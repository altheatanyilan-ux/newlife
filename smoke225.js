/* smoke225 — every score plays.

   WHAT IS CLAIMED. Any MusicXML the house draws can be heard: a file brought
   to the Score Practice room (.musicxml, or .mxl compressed), every exercise
   in the Jazz Studio in any key, a flashcard's answer, the editor's preview.
   The notes are read from the file itself — chords, voices written one after
   another, ties, grace notes, tempo marks and changes, dynamics, the sustain
   pedal, transposing instruments, pickups, compound time — and played in the
   order the road map says: repeats, first and second endings, D.C. al Fine.
   While it plays, the bar being played is lit on the engraving, exactly over
   the bar the engraver drew, and a press on another bar goes there. It plays
   what is on the glass: the key it has been moved to, only the bars in focus,
   the hands left switched on, at the tempo asked for.
 */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n)
  : no(n, `\n         got  ${JSON.stringify(a)}\n         want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

/* ---- the fixtures: small files, each with one thing in it ---- */
const head = parts => `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list>${
  parts.map((p, i) => `<score-part id="P${i + 1}"><part-name>${p}</part-name></score-part>`).join('')}</part-list>`;
const attrs = (extra = '') => `<attributes><divisions>4</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time>${extra}<clef><sign>G</sign><line>2</line></clef></attributes>`;
const n = (step, oct, dur, more = '') => `<note><pitch><step>${step}</step><octave>${oct}</octave></pitch><duration>${dur}</duration>${more}<voice>1</voice><type>quarter</type></note>`;
const X = {
  repeats: head(['Piano']) + `<part id="P1">
    <measure number="1">${attrs()}<barline location="left"><repeat direction="forward"/></barline>${n('C', 4, 16)}</measure>
    <measure number="2"><barline location="left"><ending number="1" type="start"/></barline>${n('D', 4, 16)}<barline location="right"><ending number="1" type="stop"/><repeat direction="backward"/></barline></measure>
    <measure number="3"><barline location="left"><ending number="2" type="start"/></barline>${n('E', 4, 16)}<barline location="right"><ending number="2" type="discontinue"/></barline></measure>
    <measure number="4">${n('F', 4, 16)}</measure></part></score-partwise>`,
  thrice: head(['Piano']) + `<part id="P1"><measure number="1">${attrs()}${n('C', 4, 16)}<barline location="right"><repeat direction="backward" times="3"/></barline></measure><measure number="2">${n('D', 4, 16)}</measure></part></score-partwise>`,
  tie: head(['Piano']) + `<part id="P1"><measure number="1">${attrs()}${n('C', 4, 16, '<tie type="start"/>')}</measure><measure number="2">${n('C', 4, 8, '<tie type="stop"/>')}${n('G', 4, 8)}</measure></part></score-partwise>`,
  voices: head(['Piano']) + `<part id="P1"><measure number="1">${attrs()}${n('E', 5, 4)}<note><chord/><pitch><step>G</step><octave>5</octave></pitch><duration>4</duration><voice>1</voice></note>${n('F', 5, 4)}${n('G', 5, 4)}${n('A', 5, 4)}<backup><duration>16</duration></backup><note><pitch><step>C</step><octave>3</octave></pitch><duration>16</duration><voice>2</voice><staff>2</staff></note></measure></part></score-partwise>`,
  tempo: head(['Piano']) + `<part id="P1"><measure number="1">${attrs()}<direction><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>60</per-minute></metronome></direction-type><sound tempo="60"/></direction>${n('C', 4, 16)}</measure><measure number="2">${n('C', 4, 16)}</measure><measure number="3"><direction><direction-type><words>faster</words></direction-type><sound tempo="120"/></direction>${n('C', 4, 16)}</measure></part></score-partwise>`,
  metroOnly: head(['Piano']) + `<part id="P1"><measure number="1">${attrs()}<direction><direction-type><metronome><beat-unit>half</beat-unit><beat-unit-dot/><per-minute>40</per-minute></metronome></direction-type></direction>${n('C', 4, 16)}</measure></part></score-partwise>`,
  clarinet: head(['Clarinet in B♭']) + `<part id="P1"><measure number="1">${attrs('<transpose><diatonic>-1</diatonic><chromatic>-2</chromatic></transpose>')}${n('D', 5, 16)}</measure></part></score-partwise>`,
  dcfine: head(['Piano']) + `<part id="P1"><measure number="1">${attrs()}${n('C', 4, 16)}</measure><measure number="2">${n('D', 4, 16)}<direction><direction-type><words>Fine</words></direction-type><sound fine="yes"/></direction></measure><measure number="3">${n('E', 4, 16)}<direction><direction-type><words>D.C. al Fine</words></direction-type><sound dacapo="yes"/></direction></measure></part></score-partwise>`,
  pickup: head(['Piano']) + `<part id="P1"><measure number="0" implicit="yes">${attrs()}${n('G', 4, 4)}</measure><measure number="1">${n('C', 5, 16)}</measure></part></score-partwise>`,
  pedal: head(['Piano']) + `<part id="P1"><measure number="1">${attrs()}<direction><direction-type><pedal type="start"/></direction-type></direction>${n('C', 4, 4)}${n('E', 4, 4)}${n('G', 4, 8)}</measure><measure number="2"><direction><direction-type><pedal type="stop"/></direction-type></direction>${n('C', 5, 16)}</measure></part></score-partwise>`,
  dyn: head(['Piano']) + `<part id="P1"><measure number="1">${attrs()}<direction><direction-type><dynamics><pp/></dynamics></direction-type></direction>${n('C', 4, 8)}<direction><direction-type><dynamics><f/></dynamics></direction-type></direction>${n('D', 4, 8)}</measure></part></score-partwise>`,
  grace: head(['Piano']) + `<part id="P1"><measure number="1">${attrs()}<note><grace slash="yes"/><pitch><step>B</step><octave>4</octave></pitch><voice>1</voice><type>eighth</type></note>${n('C', 5, 16)}</measure></part></score-partwise>`,
  six8: head(['Piano']) + `<part id="P1"><measure number="1"><attributes><divisions>2</divisions><time><beats>6</beats><beat-type>8</beat-type></time></attributes>${n('C', 4, 3)}${n('D', 4, 3)}</measure></part></score-partwise>`,
  chart: head(['Piano']) + `<part id="P1"><measure number="1">${attrs()}<direction placement="above"><direction-type><words font-weight="bold">Dmin7</words></direction-type></direction><note><rest measure="yes"/><duration>16</duration><voice>1</voice></note></measure><measure number="2"><direction placement="above"><direction-type><words font-weight="bold">G7</words></direction-type></direction><note><rest measure="yes"/><duration>16</duration><voice>1</voice></note></measure></part></score-partwise>`,
  lead: head(['Voice']) + `<part id="P1"><measure number="1">${attrs()}<harmony><root><root-step>G</root-step></root><kind>dominant</kind><degree><degree-value>9</degree-value><degree-alter>-1</degree-alter><degree-type>alter</degree-type></degree></harmony>${n('B', 4, 16)}</measure><measure number="2"><harmony><root><root-step>C</root-step></root><kind>major-seventh</kind><bass><bass-step>E</bass-step></bass></harmony><note><rest/><duration>16</duration><voice>1</voice></note></measure></part></score-partwise>`,
  words: head(['Piano']) + `<part id="P1"><measure number="1">${attrs()}<direction><direction-type><words>Step 1: explore the scale (no time)</words></direction-type></direction><note><rest measure="yes"/><duration>16</duration><voice>1</voice></note></measure></part></score-partwise>`,
  duet: head(['Flute', 'Piano']) + `<part id="P1"><measure number="1">${attrs()}${n('A', 5, 16)}</measure></part><part id="P2"><measure number="1">${attrs('<staves>2</staves>')}<note><pitch><step>C</step><octave>5</octave></pitch><duration>16</duration><voice>1</voice><staff>1</staff></note><backup><duration>16</duration></backup><note><pitch><step>C</step><octave>3</octave></pitch><duration>16</duration><voice>2</voice><staff>2</staff></note></measure></part></score-partwise>`,
};
/* a piece to bring to the room: twelve bars for two hands, marked ♩ = 96 */
const BARS = k => [...Array(k)].map((_, i) => `<measure number="${i + 1}">${i === 0 ? `<attributes><divisions>2</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes><direction><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>96</per-minute></metronome></direction-type><sound tempo="96"/></direction>` : ''}
  ${['C', 'D', 'E', 'F'].map(s => `<note><pitch><step>${s}</step><octave>5</octave></pitch><duration>2</duration><voice>1</voice><type>quarter</type><staff>1</staff></note>`).join('')}
  <backup><duration>8</duration></backup><note><pitch><step>C</step><octave>3</octave></pitch><duration>8</duration><voice>2</voice><type>whole</type><staff>2</staff></note></measure>`).join('');
const PIECE = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>Twelve Bars Heard</work-title></work><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${BARS(12)}</part></score-partwise>`;

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--autoplay-policy=no-user-gesture-required']});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1400, height:1100}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  const playing = () => p.evaluate(() => !!(_plxNow && _plxNow.player && _plxNow.player.running));

  console.log('\n1. the file, read as music');
  const T = await p.evaluate(X => { const out = {};
    for(const [k, x] of Object.entries(X)){ const t = musicXmlTimeline(x);
      out[k] = {order: t.order, len: t.length, tempos: t.tempos.map(x => [x.q, x.bpm]),
        ev: t.events.map(e => [e.q, e.d, e.midi]), vel: t.events.map(e => +e.vel.toFixed(2)),
        staff: t.events.map(e => e.staff), grace: t.events.map(e => !!e.grace), held: t.events.map(e => e.held || 0),
        perf: t.perf.map(m => [m.number, m.q0, m.len]), parts: t.parts.map(p => [p.name, p.staves]),
        chords: t.events.filter(e => e.chord).map(e => [e.q, e.sym, e.auto]).filter((x, i, a) => a.findIndex(y => y[0] === x[0]) === i),
        chordNotes: t.events.filter(e => e.chord && e.q === 0).map(e => e.midi), playable: t.playable}; }
    const tp = musicXmlTimeline(X.tempo);
    out.secs = [scorePlayer(tp, {}).secs(0, 4), scorePlayer(tp, {}).secs(0, 12), scorePlayer(tp, {bpm: 120}).secs(0, 12)];
    return out; }, X);
  is('repeat with first and second endings: 1, 2, 1, 3, 4', T.repeats.order, [0, 1, 0, 2, 3]);
  is('  a repeat marked three times is played three times', T.thrice.order, [0, 0, 0, 1]);
  is('  D.C. al Fine: back to the top, and stop at Fine', T.dcfine.order, [0, 1, 2, 0, 1]);
  is('a tie is one sound, as long as both notes', T.tie.ev, [[0, 6, 60], [6, 2, 67]]);
  is('a chord, and a second voice after <backup>', T.voices.ev, [[0, 4, 48], [0, 1, 76], [0, 1, 79], [1, 1, 77], [2, 1, 79], [3, 1, 81]]);
  is('  on the staff it is written on', T.voices.staff, [2, 1, 1, 1, 1, 1]);
  is('the tempo mark and a change of tempo', T.tempo.tempos, [[0, 60], [8, 120]]);
  is('  timed by them: a bar of ♩=60 is 4 s; the piece 10 s; asked for ♩=120, 5 s', T.secs, [4, 10, 5]);
  is('  a metronome mark alone is read too (dotted half = 40 is ♩ = 120)', T.metroOnly.tempos, [[0, 120]]);
  is('a B♭ clarinet\'s written D sounds C', T.clarinet.ev.map(e => e[2]), [72]);
  is('a pickup bar is as long as what is in it', T.pickup.perf, [[0, 0, 1], [1, 1, 4]]);
  is('six-eight is two dotted quarters', T.six8.ev, [[0, 1.5, 60], [1.5, 1.5, 62]]);
  is('the pedal holds what it catches until it comes up', T.pedal.held, [4, 3, 0, 0]);
  is('pp is soft and f is loud', T.dyn.vel, [0.26, 0.74]);
  is('a grace note is played before the note it leans on', [T.grace.grace, T.grace.ev.map(e => e[2])], [[true, false], [71, 72]]);
  is('two parts, and a piano\'s two staves', T.duet.parts, [['Flute', 1], ['Piano', 2]]);
  is('a chord chart — symbols over empty bars — plays its chords', [T.chart.chords, T.chart.playable], [[[0, 'Dmin7', true], [4, 'G7', true]], true]);
  yes('  Dm7 as D low in the bass, and F, A and C above it round middle C', T.chart.chordNotes[0] === 38
    && [5, 9, 0].every(pc => T.chart.chordNotes.slice(1).some(m => m % 12 === pc && m >= 50 && m <= 74)), T.chart.chordNotes);
  is('<harmony> is read: G7(♭9), then Cmaj7 over E — under the melody only when asked, alone in the empty bar',
    T.lead.chords, [[0, 'G7b9', false], [4, 'Cmaj7/E', true]]);
  is('a page of words over rests has nothing to play', T.words.playable, false);

  console.log('\n2. it makes a sound');
  const R = await p.evaluate(async X => ({
    all: await scorePlayRender(X.voices, 3),
    noHands: await scorePlayRender(X.voices, 3, {muted: new Set(['p:0:s:1', 'p:0:s:2'])}),
    rightOnly: await scorePlayRender(X.voices, 3, {muted: new Set(['p:0:s:2'])}),
    flute: await scorePlayRender(X.duet, 3, {muted: new Set(['p:1'])}),
    bad: (() => { try { musicXmlTimeline('%PDF not a score'); return 'read it'; } catch(e){ return e.message; } })()}), X);
  yes('the notes are heard', R.all.peak > 0.05, R.all);
  yes('  with both hands silenced, nothing is', R.noHands.peak < 0.002, R.noHands);
  yes('  one hand alone is heard', R.rightOnly.peak > 0.02, R.rightOnly);
  yes('  and one part of two', R.flute.peak > 0.02, R.flute);
  yes('a file that is not music says so rather than playing silence', /not MusicXML|not a MusicXML/.test(R.bad), R.bad);

  console.log('\n3. every exercise in the Jazz Studio can be played');
  const J = await p.evaluate(() => {
    const ids = jazzStages().flatMap(s => s.subs).filter(id => jazzHasScore(jazzExercise(id)));
    const fails = [], counts = [], words = [];
    const docs = (id, k) => { const x = jazzScoreFor(id, jazzExercise(id), k, {interval: 'major3rd'});
      return !x ? [] : x.documents ? x.documents.map(d => d.mxl) : [x]; };
    ids.forEach(id => docs(id, 'C').forEach((xml, di) => {
      try { const t = musicXmlTimeline(xml);
        const badPitch = t.events.filter(e => e.midi < 21 || e.midi > 108);
        const sub = (jazzScoreFor(id, jazzExercise(id), 'C', {}).documents || [])[di];
        if(!t.playable){ if(sub && /\(text\)/.test(sub.subtitle)) words.push(`${id}[${di}]`); else fails.push(`${id}[${di}]: nothing to play`); }
        else if(badPitch.length) fails.push(`${id}[${di}]: pitch ${badPitch[0].midi}`);
        else if(t.perf.some(m => !(m.len > 0))) fails.push(`${id}[${di}]: an empty bar`);
        counts.push(t.events.length);
      } catch(e){ fails.push(`${id}[${di}]: ${e.message}`); } }));
    /* and every key, for a spread of them */
    const keys = JAZZ_KEY_NAMES, some = ids.filter((_, i) => i % 12 === 0);
    some.forEach(id => keys.forEach(k => docs(id, k).forEach((xml, di) => {
      try { if(!musicXmlTimeline(xml).events.length) fails.push(`${id} in ${k}[${di}]: no notes`); }
      catch(e){ fails.push(`${id} in ${k}[${di}]: ${e.message}`); } })));
    return {n: ids.length, docs: counts.length, fails, some: some.length, words};
  });
  yes(`all ${J.n} exercises with a score (${J.docs} pages of notation) read as music with notes in them`, J.n > 200 && !J.fails.length, J.fails.slice(0, 8));
  yes(`  and ${J.some} of them in all twelve keys`, J.some > 15 && !J.fails.length);
  yes(`  the only pages with nothing to play are pages of words (${J.words.join(', ')})`, J.words.length <= 3, J.words);
  const JR = await p.evaluate(async () => scorePlayRender(jazzScoreXml(jazzExercise('3.1'), 'Eb'), 4));
  yes('  3.1 in E♭ is heard', JR.peak > 0.05, JR);

  console.log('\n4. an .mxl brought to the Score Practice room');
  const imp = await p.evaluate(async xml => {
    const enc = new TextEncoder();
    const container = '<?xml version="1.0" encoding="UTF-8"?><container><rootfiles><rootfile full-path="score.xml" media-type="application/vnd.recordare.musicxml+xml"/></rootfiles></container>';
    const blob = jazzZipStore([{name: 'META-INF/container.xml', data: enc.encode(container)}, {name: 'score.xml', data: enc.encode(xml)}]);
    const rec = await takeScoreFile(new File([blob], 'Twelve Bars Heard.mxl'));
    return rec && {id: rec.id, title: rec.title};
  }, PIECE);
  yes('the compressed file is taken in', imp && imp.title === 'Twelve Bars Heard', imp);
  await p.evaluate(id => { scoreUi().focus = null; location.hash = '#/score/' + id; }, imp.id); await p.waitForTimeout(4500);
  const S0 = await p.evaluate(() => ({bars: document.querySelectorAll('#scPlayRow .plx-bar').length,
    where: document.querySelector('#scPlayRow [data-plxwhere]').textContent, bpm: document.querySelector('#scPlayRow [data-plxbpmv]').textContent}));
  is('the room has a play bar, which knows the piece: 12 bars at the marked ♩ = 96', [S0.bars, S0.where, S0.bpm], [1, '12 bars', '96']);
  await p.click('#scPlayRow [data-plxgo]'); await p.waitForTimeout(3300);
  const S1 = await p.evaluate(() => { const hl = document.querySelector('#scStage > .plx-hl');
    const w = document.querySelector('#scPlayRow [data-plxwhere]').textContent;
    const n = +(/bar (\d+)/.exec(w) || [])[1];
    const box = n && measureBox(n);
    const st = document.getElementById('scStage');
    return {running: !!(_plxNow && _plxNow.player && _plxNow.player.running), where: w, n,
      hl: hl && !hl.hidden ? {x: parseFloat(hl.style.left), w: parseFloat(hl.style.width)} : null,
      box: box && {x: box.x + 10, w: box.w}, go: document.querySelector('#scPlayRow [data-plxgo]').textContent}; });
  yes('▶ plays it, and says which bar it is in', S1.running && S1.n >= 2 && /❚❚ Pause/.test(S1.go), S1);
  yes('  that bar is lit, exactly over where the engraver drew it', S1.hl && S1.box && Math.abs(S1.hl.x - S1.box.x) < 2 && Math.abs(S1.hl.w - S1.box.w) < 2, S1);
  /* a press on bar 9 while it plays goes to bar 9 */
  const c9 = await p.evaluate(() => { const b = measureBox(9), r = document.getElementById('scCanvas').getBoundingClientRect();
    return b && {x: r.left + b.x + b.w / 2, y: r.top + b.y + b.h / 2}; });
  await p.mouse.click(c9.x, c9.y); await p.waitForTimeout(700);
  const S2 = await p.evaluate(() => ({where: document.querySelector('#scPlayRow [data-plxwhere]').textContent, modal: !!document.querySelector('#modals .overlay')}));
  yes('  a press on another bar while it plays goes there, and pins nothing', /bar (9|10) /.test(S2.where) && !S2.modal, S2);
  await p.click('#scPlayRow [data-plxgo]'); await p.waitForTimeout(300);
  is('pause, and it waits where it was', [await playing(), await p.evaluate(() => document.querySelector('#scPlayRow [data-plxgo]').textContent)], [false, '▶ Resume']);
  await p.click('#scPlayRow [data-plxstop]'); await p.waitForTimeout(200);
  await p.click('#scPlayRow [data-plxmore]'); await p.waitForTimeout(200);
  const opts = await p.evaluate(() => [...document.querySelectorAll('#scPlayRow [data-plxopt], #scPlayRow [data-plxmute]')].map(b => b.textContent.trim()));
  yes('the options: loop, count-in, click, swing, and each hand of the piano', ['⟳ loop', 'count-in', 'click', 'swing', 'right hand', 'left hand'].every(o => opts.includes(o)), opts);
  await p.click('#scPlayRow [data-plxmute="p:0:s:2"]'); await p.click('#scPlayRow [data-plxopt="loop"]');
  await p.evaluate(() => { const r = document.querySelector('#scPlayRow [data-plxbpm]'); r.value = 180; r.dispatchEvent(new Event('input')); r.dispatchEvent(new Event('change')); });
  const kept = await p.evaluate(() => scoreById(scoreUi().id).playback);
  yes('  and they are kept with the piece', kept && kept.bpm === 180 && kept.loop === true && kept.muted.includes('p:0:s:2'), kept);
  /* the section in focus: only its bars */
  await p.evaluate(() => { const x = scoreById(scoreUi().id);
    x.sections = [{id: 'sec1', name: 'Middle', startMeasure: 5, endMeasure: 6, color: '#c47832', notes: ''}]; scoreUi().focus = 'sec1'; rerender(); });
  await p.waitForTimeout(3500);
  is('in focus, it plays the section: 2 bars', await p.evaluate(() => document.querySelector('#scPlayRow [data-plxwhere]').textContent), '2 bars');
  await p.click('#scPlayRow [data-plxgo]'); await p.waitForTimeout(1400);
  const F = await p.evaluate(() => ({where: document.querySelector('#scPlayRow [data-plxwhere]').textContent,
    muted: [..._plxNow.player.opts.muted], loop: _plxNow.player.opts.loop, bpm: _plxNow.player.opts.bpm}));
  yes('  from its first bar, looping, at the tempo set, without the left hand', /^bar [56] · [12] of 2$/.test(F.where) && F.loop && F.bpm === 180 && F.muted.includes('p:0:s:2'), F);
  await p.waitForTimeout(2600);
  yes('  and it goes round again rather than stopping', await playing());
  const m0 = await p.evaluate(() => _plxNow.timeline.events.find(e => e.staff === 1).midi);
  await p.click('#scMore'); await p.waitForTimeout(1500);
  yes('the page drawn again under it does not stop it', await playing());
  await p.click('[data-scxp="1"]'); await p.waitForTimeout(2500);
  const m1 = await p.evaluate(() => _plxNow && _plxNow.timeline && _plxNow.timeline.events.find(e => e.staff === 1).midi);
  yes('moved up a semitone while it plays, it plays on — a semitone up', (await playing()) && m1 === m0 + 1, [m0, m1]);
  await p.evaluate(() => { scorePlayStopAll(); const x = scoreById(scoreUi().id); x.transpose = 0; scoreUi().focus = null; });

  console.log('\n5. the Jazz Studio\'s scores');
  await p.evaluate(() => { jazzUi().key = 'C'; location.hash = '#/jazz/2.1'; }); await p.waitForTimeout(3500);
  const G = await p.evaluate(() => { const bar = document.querySelector('.plx-bar');
    return bar && {next: bar.nextElementSibling.className, where: bar.querySelector('[data-plxwhere]').textContent, bpm: bar.querySelector('[data-plxbpmv]').textContent}; });
  yes('an exercise has ▶ above its score, at a practice tempo (♩ = 80)', G && /jz-stage-box/.test(G.next) && G.bpm === '80' && /\d+ bars/.test(G.where), G);
  await p.click('.plx-bar [data-plxgo]'); await p.waitForTimeout(2000);
  const G1 = await p.evaluate(() => ({running: !!(_plxNow && _plxNow.player && _plxNow.player.running),
    hl: !!document.querySelector('#jzScore > .plx-hl:not([hidden])'), swing: _plxNow.player.opts.swing}));
  yes('  it plays, lit on the score, swung', G1.running && G1.hl && G1.swing > 0.5, G1);
  const low0 = await p.evaluate(() => Math.min(..._plxNow.timeline.events.filter(e => !e.chord).map(e => e.midi)));
  await p.click('[data-jzkey="F"]'); await p.waitForTimeout(3000);
  const low1 = await p.evaluate(() => _plxNow && _plxNow.timeline && Math.min(..._plxNow.timeline.events.filter(e => !e.chord).map(e => e.midi)));
  yes('  another key while it plays: it goes on, in the new key', (await playing()) && low1 != null && low1 !== low0, [low0, low1]);
  await p.keyboard.press('Space'); await p.waitForTimeout(300);
  yes('space pauses it', !(await playing()));
  await p.keyboard.press('Space'); await p.waitForTimeout(400);
  yes('  and space again goes on', await playing());
  await p.evaluate(() => { location.hash = '#/jazz'; }); await p.waitForTimeout(500);
  yes('leaving the page stops it', !(await playing()));
  /* a chord chart plays; a page of words shows no ▶ */
  await p.evaluate(() => { location.hash = '#/jazz/IMP-B1-05'; }); await p.waitForTimeout(3000);
  await p.click('[data-jzex="5"]'); await p.waitForTimeout(2000);
  const CC = await p.evaluate(() => { const bar = document.querySelector('.plx-bar'); return {shown: bar && !bar.hidden && bar.offsetParent !== null}; });
  await p.click('.plx-bar [data-plxgo]'); await p.waitForTimeout(900);
  yes('the chord chart page (IMP-B1-05, slash notation) plays its chords', CC.shown && (await playing()), CC);
  await p.evaluate(() => scorePlayStopAll());
  await p.evaluate(() => { location.hash = '#/jazz/IMP-B1-12'; }); await p.waitForTimeout(3000);
  await p.click('[data-jzex="4"]'); await p.waitForTimeout(2000);
  yes('  and a page of words (IMP-B1-12\'s practice summary) has no ▶ on it', await p.evaluate(() => { const bar = document.querySelector('.plx-bar'); return !!bar && bar.offsetParent === null; }));
  /* a flashcard's answer */
  await p.evaluate(() => { jazzUi().flash = {cards: [{exerciseId: '2.1', key: 'Ab'}], at: 0, shown: true,
    from: Date.now(), got: {nailed: 0, struggled: 0, couldnt: 0}}; location.hash = '#/jazz/cards'; });
  await p.waitForTimeout(3000);
  yes('a flashcard\'s answer can be heard', await p.evaluate(() => !!document.querySelector('.jz-card .plx-bar, .plx-bar + .jz-stage-box #jzCardScore')));
  await p.evaluate(() => { jazzUi().flash = null; location.hash = '#/jazz/2.1'; }); await p.waitForTimeout(3000);
  /* the editor's preview */
  await p.click('#jzEdit'); await p.waitForTimeout(3000);
  const E = await p.evaluate(() => { const bar = document.querySelector('.jze-modal .plx-bar');
    return {bar: !!bar, next: bar && bar.nextElementSibling.className}; });
  yes('the editor plays what you have written', E.bar && /jze-stage/.test(E.next), E);
  await p.click('.jze-modal .plx-bar [data-plxgo]'); await p.waitForTimeout(1200);
  yes('  and it sounds', await playing());
  await p.click('.jze-modal .plx-bar [data-plxstop]');

  is('no page errors', errs, []);
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})();
