/* smoke231 — the band, further: flashcards with a band, call and response,
   a tune as a performance, and the singer's range.

   WHAT IS CLAIMED. In band mode a flashcard's key is called (big, and said
   aloud), the drums play a reaction window, the band comes in on the
   downbeat and plays the progression, the answer is turned over, and after
   the grade the next card follows a bar of drums later — on the bar line,
   because the drums never stopped. The window shrinks from two bars to one
   to two beats after three clean answers in a row; each answer keeps its
   window; the exercise says how the window has come down and the fastest
   reaction. Call and response plays a phrase and leaves the next two bars
   for you, with the notes hidden until asked. A singer gets a starting note
   before the count, a range kept once, the keys that leave it marked, and
   the octave or nearest key offered. A tune plays head → solos → head out,
   trades fours with the drums if asked, carries its melody (heard and shown
   independently) when it has one, and always says where in the form it is.
   Chord symbols as printed — B♭maj7, Cm7♭5, C7♭9 — are read.

   HOW IT COULD BE WRONG AND STILL PASS. Speech is caught, not heard; the
   band's timing is read from the scheduler, not from the speakers.

   Run: NODE_PATH=node_modules node smoke231.js */
const { chromium } = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n)
  : no(n, `\n         got  ${JSON.stringify(a)}\n         want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

const MELODY = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P1"><part-name>Melody</part-name></score-part></part-list><part id="P1">${
  ['C', 'F', 'G', 'C'].map((s, i) => `<measure number="${i + 1}">${i === 0 ? '<attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>' : ''}<note><pitch><step>${s}</step><octave>5</octave></pitch><duration>4</duration><voice>1</voice><type>whole</type></note></measure>`).join('')}</part></score-partwise>`;

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--autoplay-policy=no-user-gesture-required']});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1300, height:1000}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.addInitScript(() => { window.__said = [];
    Object.defineProperty(window, 'speechSynthesis', {configurable: true, value: {speak: u => window.__said.push(u.text), cancel(){}}});
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {configurable: true, writable: true, value: function(t){ this.text = t; }}); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }

  console.log('\n1. chord symbols as they are printed');
  const CH = await p.evaluate(() => ({bb: jazzParseChord('B♭maj7'), hd: jazzParseChord('Cm7♭5').quality, b9: jazzChordSpec('C7♭9').tones.includes(13),
    b13: jazzChordSpec('C7b13').tones.includes(21), s9: jazzChordSpec('C7♯9').tones.includes(15)}));
  yes('B♭maj7, Cm7♭5, C7♭9 and C7♯9 are read as written; a ♭13 is not a thirteenth chord',
    CH.bb && CH.bb.root === 'Bb' && CH.bb.quality === 'maj' && CH.hd === 'hd' && CH.b9 && CH.s9 && !CH.b13, CH);

  console.log('\n2. the reaction window');
  const W = await p.evaluate(() => {
    const st = jazzState(); delete st.progress['2.1']; st.flashes = st.flashes.filter(f => f.exerciseId !== '2.1');
    const b = jazzBandCardSettings(); b.window = 'auto';
    const seq = [jazzReactionWindow('2.1')];
    for(let i = 0; i < 3; i++) jazzBandGraded('2.1', 'nailed', seq[seq.length - 1], 120);
    seq.push(jazzReactionWindow('2.1'));
    jazzBandGraded('2.1', 'nailed', 4, 120); jazzBandGraded('2.1', 'struggled', 4, 120);
    seq.push(jazzReactionWindow('2.1'));
    for(let i = 0; i < 3; i++) jazzBandGraded('2.1', 'nailed', 4, 160);
    seq.push(jazzReactionWindow('2.1'));
    b.window = 4; const over = jazzReactionWindow('2.1'); b.window = 'auto';
    /* three weeks of answers */
    const at = d => new Date(Date.now() - d * 864e5).toISOString();
    jazzGrade('2.1', 'C', 'nailed', null, {reactionWindowBeats: 8, bpm: 120}); st.flashes[0].at = at(21);
    jazzGrade('2.1', 'F', 'nailed', null, {reactionWindowBeats: 2, bpm: 160});
    return {seq, over, trend: jazzReactionTrend('2.1'), fast: jazzRecord('2.1').fastestReaction, kept: st.flashes[0].reactionWindowBeats};
  });
  is('two bars, then after three clean answers one bar; a struggle resets the run; three more and two beats', W.seq, [8, 4, 4, 2]);
  yes('  a window chosen by hand is the window', W.over === 4, W);
  yes('  every answer keeps its window, and the exercise says how it has come down', W.kept === 2 && W.trend && W.trend.said === 'Reaction window: 8 beats → 2 beats over 3 weeks', W.trend);
  is('  the fastest reaction: two beats at ♩=160', W.fast, {beats: 2, bpm: 160});

  console.log('\n3. a card, with the band');
  const CT = await p.evaluate(() => {
    const b = jazzBandCardSettings(); b.window = 4; b.bpm = 200; b.times = 1;
    const c = jzbcCardTimeline({exerciseId: '2.1', key: 'Eb'}, b);
    const pc = m => ((m % 12) + 12) % 12;
    const bass = c.tl.events.filter(e => e.part === 1); b.window = 'auto';
    return {lead: c.lead, callAt: c.callAt, drumsFirst: c.tl.events.filter(e => e.part === 2)[0].q, bassFirst: [bass[0].q, pc(bass[0].midi)],
      noBassBefore: bass.every(e => e.q >= c.lead), mine: c.tl.events.filter(e => e.part === 0).length, comp: c.tl.events.filter(e => e.part === 3).length};
  });
  yes('a bar of drums, the key called on the next bar line, a one-bar window, and the band in on the downbeat after it (the bass on F, the ii of E♭)',
    CT.lead === 8 && CT.callAt === 4 && CT.drumsFirst === 0 && CT.bassFirst[0] === 8 && CT.bassFirst[1] === 5 && CT.noBassBefore, CT);
  yes('  you are the pianist: no comping, and nothing of the answer played', CT.comp === 0 && CT.mine > 0, CT);
  /* the whole drill, fast */
  await p.evaluate(() => { const st = jazzState().settings; st.syllabus = ['2.1']; st.cards = 3; st.keyMode = 'all';
    Object.assign(jazzBandCardSettings(), {on: true, bpm: 280, window: 2, times: 1, speak: true}); saveNow(); location.hash = '#/jazz/cards'; });
  await p.waitForTimeout(1500);
  const S0 = await p.evaluate(() => ({on: document.getElementById('jzbcOn').checked, win: document.getElementById('jzbcWin').value, bpm: document.getElementById('jzbcBpm').value}));
  yes('the flashcards page offers band mode: tempo, the reaction window, times through, the key said aloud', S0.on && S0.win === '2' && S0.bpm === '280', S0);
  await p.click('#jzBegin'); await p.waitForTimeout(800);
  const K0 = await p.evaluate(() => ({key: document.getElementById('jzbcKey').textContent, go: !!document.getElementById('jzbcStart'), card: jazzUi().flash.cards[0].key}));
  yes('a card shows the prompt and the key, huge, and "▶ Count me in"', K0.go && K0.key.length >= 1, K0);
  await p.click('#jzbcStart');
  await p.waitForFunction(() => _jzbc.run && _jzbc.run.phase === 'call', null, {timeout: 20000});
  const K1 = await p.evaluate(() => ({said: window.__said.slice(), call: document.getElementById('jzbcKey').classList.contains('call'), phase: document.getElementById('jzbcPhase').textContent,
    want: ({C: 'C', Db: 'D flat', D: 'D', Eb: 'E flat', E: 'E', F: 'F', Gb: 'G flat', G: 'G', Ab: 'A flat', A: 'A', Bb: 'B flat', B: 'B'})[jazzUi().flash.cards[0].key]}));
  yes('the key is called — lit, and said aloud ("E flat", not "Eb") — and the window counted', K1.call && K1.said[K1.said.length - 1] === K1.want && /two beats — get your hands there/.test(K1.phase), K1);
  await p.waitForFunction(() => _jzbc.run && _jzbc.run.phase === 'band', null, {timeout: 20000});
  yes('  then the band is in', await p.evaluate(() => /the band is in/.test(document.getElementById('jzbcPhase').textContent)));
  await p.waitForFunction(() => _jzbc.run && _jzbc.run.phase === 'answer', null, {timeout: 20000});
  await p.waitForTimeout(1200);
  const K2 = await p.evaluate(() => ({ans: !document.getElementById('jzbcAnswer').hidden, svg: !!document.querySelector('#jzCardScore svg'),
    drums: !!(_jzbc.drums && _jzbc.drums.player.running)}));
  yes('the progression over: the answer turned over, engraved, and the drums keeping time', K2.ans && K2.svg && K2.drums, K2);
  const grid = await p.evaluate(() => ({at: _jzbc.drums.at, bar: 4 * 60 / 280}));
  await p.click('[data-jzbcg="nailed"]'); await p.waitForTimeout(600);
  const K3 = await p.evaluate(g => { const r = _jzbc.run; const k = (r.at - g.at) / g.bar;
    return {next: jazzUi().flash.at, running: !!r, onGrid: Math.abs(k - Math.round(k)) < 1e-6, kept: jazzState().flashes[0].reactionWindowBeats, band: jazzState().flashes[0].band}; }, grid);
  yes('graded: the next card comes in by itself, on the drums\' bar line, and the answer kept its window', K3.next === 1 && K3.running && K3.onGrid && K3.kept === 2 && K3.band === true, K3);
  await p.click('#jzQuit'); await p.waitForTimeout(500);
  yes('  stopping stops the band', await p.evaluate(() => !_jzbc.run && !_jzbc.drums));
  await p.evaluate(() => { jazzBandCardSettings().on = false; saveNow(); });

  console.log('\n4. call and response');
  const CR = await p.evaluate(() => {
    const s = Object.assign(jzbDefaults('6.1'), {callResponse: true, callVoice: 'voice', bpm: 200});
    const tl = jazzBackingTimeline({id: '6.1', keys: ['C', 'F'], settings: s});
    return {phrase: jzbPhrase('6.1'), voicing: jzbPhrase('3.1'), passes: tl.choruses.map(c => `${c.key}:${c.call ? 'call' : c.response ? 'response' : ''}`),
      heard: tl.choruses.map((c, i) => tl.events.filter(e => e.part === 0 && tl.perf[e.perf].chorus === i).length),
      band: tl.choruses.map((c, i) => tl.events.filter(e => e.part === 1 && tl.perf[e.perf].chorus === i).length > 0), inst: tl.parts[0].inst};
  });
  yes('a lick is a phrase to call and answer; a voicing is not', CR.phrase && !CR.voicing, CR);
  is('  each key twice: the call, then your response', CR.passes, ['C:call', 'C:response', 'F:call', 'F:response']);
  yes('  the phrase is heard in the call and not in the response; the band plays through both; the call on a soft voice',
    CR.heard[0] > 0 && CR.heard[1] === 0 && CR.heard[2] > 0 && CR.heard[3] === 0 && CR.band.every(Boolean) && CR.inst === 'flute', CR);
  await p.evaluate(() => { jzbSave('6.1', {callResponse: true, bpm: 240, countIn: 0, keyCycle: 'this', choruses: 1, startNote: false}); jazzUi().key = 'C'; location.hash = '#/jazz/6.1'; });
  await p.waitForTimeout(3500);
  yes('on the lick\'s page: "call and response"', await p.evaluate(() => !!document.getElementById('jzbCR') && document.getElementById('jzbCR').checked));
  await p.click('#jzbGo');
  await p.waitForFunction(() => _jzb.run && _jzb.run.player.running && _jzb.run.lastChorus === 0, null, {timeout: 20000});
  await p.waitForTimeout(200);
  const C1 = await p.evaluate(() => ({say: document.querySelector('#jzbCall b').textContent, hidden: document.querySelector('.jz-stage-box').classList.contains('jzb-hidden')}));
  yes('  playing: "the call — listen", the notes hidden', /the call — listen/.test(C1.say) && C1.hidden, C1);
  await p.waitForFunction(() => _jzb.run && _jzb.run.lastChorus === 1, null, {timeout: 20000});
  await p.waitForTimeout(100);
  const C2 = await p.evaluate(() => document.querySelector('#jzbCall b').textContent);
  yes('  then "your turn — play it back"', /your turn/.test(C2), C2);
  await p.click('#jzbShowMe'); await p.waitForTimeout(200);
  yes('  and "show me" turns the notes over', await p.evaluate(() => !document.querySelector('.jz-stage-box').classList.contains('jzb-hidden')));
  await p.waitForFunction(() => !_jzb.run, null, {timeout: 20000});

  console.log('\n5. the singer');
  const V = await p.evaluate(async () => {
    const d = jzbDefaults('V2.4');
    const was = jzVoiceKeys, heard = [];
    jzVoiceKeys = (ctx, dest, m) => heard.push(m);
    jzbSave('V2.4', {bpm: 240, countIn: 0, choruses: 1, keyCycle: 'this', startNote: true});
    jazzUi().key = 'C'; location.hash = '#/jazz/V2.4';
    await new Promise(r => setTimeout(r, 3000));
    const root = document.getElementById('main') || document.body;
    await jzbStart(root, 'V2.4');
    const at = _jzb.run.player.opts.at, now = _jzb.run.player.audioTime;
    const first = _jzb.run.tl.events.find(e => e.part === 0).midi;
    jzbStop('x'); jzVoiceKeys = was;
    return {d: [d.comping, d.startNote, d.callVoice], heard, first, later: at - now > 1};
  });
  yes('a vocal pattern comps, gives the starting note, and calls on a voice by default', V.d.join() === 'charleston,true,voice', V.d);
  yes('  and before the count it plays the pattern\'s first note, then waits a breath', V.heard[0] === V.first && V.later, V);
  /* a one-octave pattern (V2.1a, C4–C5 in C), a range of G3–E5, and the page in A */
  await p.evaluate(() => { jazzState().settings.vocalRange = {lowMidi: 55, highMidi: 76}; jazzUi().key = 'A'; location.hash = '#/jazz/V2.1a'; });
  await p.waitForTimeout(3000);
  const R = await p.evaluate(() => {
    const out = [...document.querySelectorAll('[data-jzkey].jzv-out')].map(b => b.dataset.jzkey);
    const w = document.getElementById('jzvWarn');
    return {out, warn: w ? w.textContent.replace(/\s+/g, ' ').trim() : '', range: !!document.getElementById('jzvLo'), lo: (document.getElementById('jzvLo') || {}).value};
  });
  is('with a range of G3–E5 kept, the keys that take the pattern out of it are marked on the key picker', R.out, ['F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']);
  yes('  the range is set on the page itself, and kept', R.range && R.lo === '55', R);
  yes('  in A: "This key goes above your range (up to A5)", with the octave down and the nearest key that fits (C)',
    /^This key goes above your range \(up to A5\)/.test(R.warn) && /sing it an octave down/.test(R.warn) && /try C/.test(R.warn), R);
  await p.click('#jzvOct'); await p.waitForTimeout(2500);
  const R2 = await p.evaluate(() => ({oct: jzbSettings('V2.1a').octave, warn: !!document.getElementById('jzvWarn'), sel: (document.getElementById('jzbOct') || {}).value}));
  yes('  "sing it an octave down": the guide goes down an octave, and A fits', R2.oct === -12 && !R2.warn && R2.sel === '-12', R2);
  await p.evaluate(() => { jzbSave('V2.1a', {octave: 0}); jazzState().settings.vocalRange = null; saveNow(); });

  console.log('\n6. a tune, as a performance');
  const T = await p.evaluate(() => {
    const row = [...jazzTuneIndex().byId.values()].find(r => r.tune && r.tune.chordProgression && /autumn leaves/i.test(r.title || r.tune.title));
    const t = row.tune;
    const s = Object.assign({}, jazzTunePlaySettings(t), {choruses: 2, trading: true, bpm: 200});
    const tl = jazzTuneTimeline(t, 'G', s);
    const kinds = tl.choruses.map(c => c.kind);
    const solo = tl.perf.filter(v => v.kind === 'solo' && v.chorus === 1);
    const drumsBars = solo.filter(v => v.trade === 'drums').map(v => v.i);
    const inDrums = tl.events.filter(e => drumsBars.includes(e.perf));
    return {id: t.id, kinds, bars: tl.form.length, form: [...new Set(tl.form)].filter(Boolean), trades: solo.slice(0, 8).map(v => v.trade),
      drumsOnly: inDrums.length > 0 && inDrums.every(e => e.part === 2), headTrade: tl.perf.filter(v => v.kind === 'head').every(v => v.trade == null)};
  });
  is('head → two choruses of solos → head out', T.kinds, ['head', 'solo', 'solo', 'head_out']);
  yes('  the form said bar by bar (A1, A2, B…)', T.form.length >= 2 && T.bars >= 16, T);
  yes('  trading fours in the solos: four bars you, four bars drums alone (no bass, no piano), never in the head',
    T.trades.join() === 'you,you,you,you,drums,drums,drums,drums' && T.drumsOnly && T.headTrade, T);
  const M = await p.evaluate(xml => {
    const t = {id: 'mine-1', title: 'Four Bars', chordProgression: '| C | F | G | C |', timeSignature: '4/4', form: 'A', melodyMusicXml: xml, key: 'C'};
    const tl = jazzTuneTimeline(t, 'C', Object.assign({}, jazzTunePlaySettings(t), {choruses: 1}));
    const mel = c => tl.events.filter(e => e.part === 0 && tl.perf[e.perf].chorus === c).map(e => e.midi);
    return {head: mel(0), solo: mel(1), out: mel(2), inst: tl.parts[0].inst};
  }, MELODY);
  yes('a tune with a melody plays it in the head and the head out, not in the solos', M.head.join() === '72,77,79,72' && M.solo.length === 0 && M.out.length === 4 && M.inst === 'flute', M);
  await p.evaluate(id => { jazzTuneUi().key = 'G'; Object.assign(jazzTunePlaySettings(jazzTune(id)), {bpm: 240, choruses: 1, trading: false, countIn: 0}); location.hash = '#/jazz/tune/' + id; }, T.id);
  await p.waitForTimeout(3000);
  yes('on the tune page: "Play the tune — head · solos · head out"', await p.evaluate(() => /Play the tune/.test(document.getElementById('jzbt').textContent)));
  await p.click('#jzbtGo');
  await p.waitForFunction(() => _jzbt.run && _jzbt.run.player.running && document.getElementById('jzbtWhere').textContent, null, {timeout: 20000});
  await p.waitForTimeout(300);
  const U = await p.evaluate(() => ({where: document.getElementById('jzbtWhere').textContent, sec: document.getElementById('jzbtSec').textContent, lit: !!document.querySelector('.jt-bar.now')}));
  yes('  playing: "Head · bar n of N", the section, and the bar lit on the chart', /^Head · bar \d+ of \d+$/.test(U.where) && U.sec && U.lit, U);
  await p.click('#jzbtGo'); await p.waitForTimeout(300);
  yes('  ■ stops it', await p.evaluate(() => !_jzbt.run));

  console.log('\n7. on a phone');
  await p.setViewportSize({width: 390, height: 844}); await p.waitForTimeout(500);
  const PH = await p.evaluate(() => ({over: document.documentElement.scrollWidth - innerWidth}));
  yes('the tune page with its new panel fits 390px', PH.over <= 1, PH);

  yes('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
