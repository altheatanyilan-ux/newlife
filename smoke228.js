/* smoke228 — the shared engine: instruments and the transport.

   WHAT IS CLAIMED. A part that is not piano is played on its own
   instrument — bass, violin, cello, flute or strings, from the Fluid R3 set
   carried in the page (CC BY 3.0, credited) — chosen by the part's General
   MIDI program or, failing that, its name; anything else is the grand. A
   bowed or blown note lasts as long as it is written, looped past its
   three-second recording; a plucked bass dies away. The tempo map holds the
   score's own marks and, on top of them, a section's own tempo (steady or a
   ramp for a rit.) and fermatas held longer (2× unless told), all scaled by
   the tempo percentage. The player can wait at a place until released. The
   transport has ⏮ ▶ ⏹, the bar counter, ♩ with the score's own tempo beside
   it, tempo as a percentage, a count-in of 0–2 bars shown big over the
   score, a loop set with two taps, a click on beats or only downbeats, a
   master volume; stopping remembers the bar for the next ▶; the keys move
   it (← → a bar, L the loop, − + 5%); and the first press loads the sounds
   the parts need.
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

const note = (step, oct, dur, extra = '') => `<note><pitch><step>${step}</step><octave>${oct}</octave></pitch><duration>${dur}</duration>${extra}<voice>1</voice></note>`;
const DUET = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>Violin and Piano</work-title></work><part-list>
  <score-part id="P1"><part-name>Violin</part-name><score-instrument id="P1-I1"><instrument-name>Violin</instrument-name></score-instrument><midi-instrument id="P1-I1"><midi-channel>1</midi-channel><midi-program>41</midi-program></midi-instrument></score-part>
  <score-part id="P2"><part-name>Piano</part-name><score-instrument id="P2-I1"><instrument-name>Piano</instrument-name></score-instrument><midi-instrument id="P2-I1"><midi-channel>2</midi-channel><midi-program>1</midi-program></midi-instrument></score-part></part-list>
  <part id="P1">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<measure number="${n}">${n === 1 ? '<attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><direction><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>120</per-minute></metronome></direction-type><sound tempo="120"/></direction>' : ''}${note('A', 4, 4)}</measure>`).join('')}</part>
  <part id="P2">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<measure number="${n}">${n === 1 ? '<attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>F</sign><line>4</line></clef></attributes>' : ''}${note('A', 2, 4)}</measure>`).join('')}</part></score-partwise>`;
const FERMATA = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">
  <measure number="1"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes><sound tempo="60"/>${note('C', 4, 4, '<notations><fermata/></notations>')}</measure>
  <measure number="2">${note('D', 4, 4)}</measure><measure number="3">${note('E', 4, 4)}</measure></part></score-partwise>`;

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--autoplay-policy=no-user-gesture-required']});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1300, height:1000}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }

  console.log('\n1. the other instruments');
  const I = await p.evaluate(async () => {
    const src = JSON.parse(document.getElementById('gmSrc').textContent);
    const loaded = {};
    for(const id of Object.keys(INSTRUMENTS)){ loaded[id] = await instrumentLoad(id); }
    const set = _instr.sets.violin;
    return {names: Object.keys(src).sort(), counts: Object.fromEntries(Object.entries(src).map(([k, v]) => [k, Object.keys(v).length])),
      loaded, violinLen: +set.buffers.get(set.keys[3]).duration.toFixed(2), credit: [INSTR_CREDIT.name, INSTR_CREDIT.by, INSTR_CREDIT.licence]};
  });
  is('five instruments are in the page', I.names, ['acoustic_bass', 'cello', 'flute', 'string_ensemble_1', 'violin']);
  yes('  every minor third across each one\'s range', Object.values(I.counts).every(n => n >= 12 && n <= 20), I.counts);
  yes('  and each decodes', Object.values(I.loaded).every(Boolean), I.loaded);
  is('credited: the Fluid R3 GM SoundFont, Frank Wen, CC BY 3.0', I.credit, ['Fluid (R3) General MIDI SoundFont', 'Frank Wen', 'CC BY 3.0']);
  const M = await p.evaluate(() => ({
    programs: [41, 42, 43, 44, 33, 49, 74, 72, 1, 57].map(instrumentForProgram),
    names: ['Violoncello', 'Double Bass', 'Flauto', 'Strings', 'Oboe', 'Trumpet', 'Klavier'].map(n => instrumentForName(n, [])),
    satb: instrumentForName('Bass', ['Soprano', 'Alto', 'Tenor', 'Bass']),
    jazzBass: instrumentForName('Bass', ['Piano', 'Bass', 'Drums']) }));
  is('a part\'s General MIDI program picks its instrument', M.programs,
    ['violin', 'violin', 'cello', 'cello', 'acoustic_bass', 'string_ensemble_1', 'flute', 'flute', 'piano', 'piano']);
  is('  and, without one, its name', M.names, ['cello', 'acoustic_bass', 'flute', 'string_ensemble_1', 'flute', 'piano', 'piano']);
  is('  a choir\'s Bass is a voice, not a double bass; a combo\'s is', [M.satb, M.jazzBass], ['piano', 'acoustic_bass']);
  const PT = await p.evaluate(xml => musicXmlTimeline(xml).parts.map(x => [x.name, x.program, x.inst]), DUET);
  is('the score\'s parts are read with their programs and instruments', PT, [['Violin', 41, 'violin'], ['Piano', 1, 'piano']]);

  console.log('\n2. a held note lasts as long as it is written');
  const H = await p.evaluate(async () => {
    const render = async (id, m, dur) => { const ctx = new OfflineAudioContext(1, 44100 * (dur + 1), 44100);
      instrumentNote(ctx, ctx.destination, id, m, 0.01, dur, 0.7, dur, 1); const d = (await ctx.startRendering()).getChannelData(0);
      const rms = (a, z) => { let s = 0; for(let i = Math.round(a * 44100); i < Math.round(z * 44100); i++) s += d[i] * d[i]; return Math.sqrt(s / ((z - a) * 44100)); };
      return {early: rms(0.8, 1.6), late: rms(6.0, 6.8), after: rms(dur + 0.6, dur + 0.95)}; };
    const pitch = async (id, m) => { const ctx = new OfflineAudioContext(1, 44100 * 2, 44100);
      instrumentNote(ctx, ctx.destination, id, m, 0.01, 1.8, 0.7, 1.8, 1); const d = (await ctx.startRendering()).getChannelData(0);
      const sr = 44100, from = Math.round(0.6 * sr), n = 8192; let best = 0, bl = 0;
      for(let lag = Math.round(sr / 1500); lag < Math.round(sr / 30); lag++){ let s = 0; for(let i = 0; i < n; i++) s += d[from + i] * d[from + i + lag]; if(s > best){ best = s; bl = lag; } }
      return sr / bl; };
    return {violin: await render('violin', 69, 7.5), cello: await render('cello', 48, 7.5), bass: await render('acoustic_bass', 40, 7.5),
      hzViolin: await pitch('violin', 70), hzCello: await pitch('cello', 50)};
  });
  yes('a violin whole note seven seconds long is still sounding at six (looped past its recording)', H.violin.late > H.violin.early * 0.4, H.violin);
  yes('  and a cello\'s', H.cello.late > H.cello.early * 0.4, H.cello);
  yes('  and each stops when the note ends', H.violin.after < H.violin.late * 0.1 && H.cello.after < H.cello.late * 0.1, [H.violin, H.cello]);
  yes('a plucked bass dies away as a bass does', H.bass.late < H.bass.early * 0.3, H.bass);
  const cents = (f, m) => 1200 * Math.log2(f / (440 * Math.pow(2, (m - 69) / 12)));
  yes('each plays its note at its pitch (B♭4 on the violin, D3 on the cello)', Math.abs(cents(H.hzViolin, 70) % 1200) < 40 && Math.abs(cents(H.hzCello, 50) % 1200) < 40,
    [H.hzViolin, H.hzCello]);
  const D = await p.evaluate(async xml => {
    const before = _instr.stats.sampled;
    const r = await scorePlayRender(xml, 3, {muted: new Set(['p:1'])});
    return {peak: r.peak, violinNotes: _instr.stats.sampled - before}; }, DUET);
  yes('a duet with the piano muted plays the violin, on the violin', D.peak > 0.02 && D.violinNotes > 0, D);

  console.log('\n3. the tempo map');
  const T = await p.evaluate(fx => {
    const tl = musicXmlTimeline(fx);
    const plain = scorePlayer(tl, {fermata: 1});
    const held = scorePlayer(tl, {});
    const three = scorePlayer(tl, {fermata: 3});
    const slow = scorePlayer(tl, {fermata: 1, bpm: 30});
    const rit = scorePlayer(tl, {fermata: 1, overrides: [{q0: 4, q1: 8, start: 60, end: 30}]});
    const steady = scorePlayer(tl, {fermata: 1, overrides: [{q0: 4, q1: 8, start: 120, end: null}]});
    return {plain: plain.secs(0, 12), held: held.secs(0, 12), three: three.secs(0, 4), slow: slow.secs(0, 12),
      rit: rit.secs(4, 8), ritMid: rit.bpmAt(6), steady: steady.secs(4, 8), after: rit.secs(8, 12)};
  }, FERMATA);
  const close = (a, b) => Math.abs(a - b) < 0.01;
  yes('three bars of ♩=60 are twelve seconds', close(T.plain, 12), T.plain);
  yes('  with the fermata held twice as long (the default) the first bar is eight, not four', close(T.held, 16), T.held);
  yes('  and held three times, twelve', close(T.three, 12), T.three);
  yes('at half the tempo, twice as long', close(T.slow, 24), T.slow);
  yes('a section ramping from ♩=60 to ♩=30 takes 8·ln2 seconds, and is ♩=45 halfway', close(T.rit, 8 * Math.log(2)) && close(T.ritMid, 45), [T.rit, T.ritMid]);
  yes('  a section at a steady ♩=120 takes two; after it the score\'s own tempo again', close(T.steady, 2) && close(T.after, 4), [T.steady, T.after]);

  console.log('\n4. it can wait');
  const G = await p.evaluate(async fx => {
    const tl = musicXmlTimeline(fx);
    let gated = null;
    const pl = scorePlayer(tl, {fermata: 1, bpm: 600, gates: [4], onGate: q => { gated = q; }});
    pl.start();
    await new Promise(r => setTimeout(r, 900));
    const w = {waiting: pl.waiting, gated, pos: pl.position()};
    await new Promise(r => setTimeout(r, 400));
    const still = pl.position();
    pl.release();
    await new Promise(r => setTimeout(r, 700));
    const after = pl.position(); pl.stop();
    return {w, still, after};
  }, FERMATA);
  yes('it stops at the place it was told to wait, and says so', G.w.waiting === 4 && G.w.gated === 4 && G.w.pos === 4 && G.still === 4, G);
  yes('  and goes on when released', G.after > 4, G.after);

  console.log('\n5. the transport');
  const id = await p.evaluate(async xml => (await takeScoreFile(new File([xml], 'Violin and Piano.musicxml'))).id, DUET);
  await p.evaluate(() => { Object.keys(_instr.sets).forEach(k => delete _instr.sets[k]); });
  await p.evaluate(id => { scoreUi().focus = null; location.hash = '#/score/' + id; }, id); await p.waitForTimeout(4000);
  const R0 = await p.evaluate(() => { const q = s => document.querySelector('#scPlayRow ' + s);
    return {rew: !!q('[data-plxrew]'), stop: !!q('[data-plxstop]'), bpm: q('[data-plxbpm]').value, score: q('[data-plxscore]').textContent,
      pct: q('[data-plxpct]').value, count: [...q('[data-plxcount]').options].map(o => o.textContent), click: [...q('[data-plxclick]').options].map(o => o.textContent),
      vol: !!q('[data-plxvol]'), pick: !!q('[data-plxpick]'), where: q('[data-plxwhere]').textContent}; });
  yes('⏮ ▶ ⏹, "♩ = 120 (score: 120)", the tempo at 100%, count-in and click choices, volume, set loop',
    R0.rew && R0.stop && R0.bpm === '120' && R0.score === '(score: 120)' && R0.pct === '100' && R0.count.join() === 'none,1 bar,2 bars'
    && R0.click.join() === 'off,beats,downbeats' && R0.vol && R0.pick && R0.where === '8 bars', R0);
  await p.evaluate(() => { const r = document.querySelector('#scPlayRow [data-plxpct]'); r.value = 50; r.dispatchEvent(new Event('input')); r.dispatchEvent(new Event('change')); });
  is('the tempo at 50% is ♩ = 60', await p.evaluate(() => document.querySelector('#scPlayRow [data-plxbpm]').value), '60');
  await p.selectOption('#scPlayRow [data-plxcount]', '1');
  const before = await p.evaluate(() => _instr.stats.sampled);
  await p.click('#scPlayRow [data-plxgo]');
  const L0 = await p.evaluate(() => ({go: document.querySelector('#scPlayRow [data-plxgo]').textContent, loading: document.querySelector('#scPlayRow .plx-bar').classList.contains('loading')}));
  yes('the first press loads the violin first: "Loading sounds…" on the button', /Loading sounds/.test(L0.go) && L0.loading, L0);
  await p.waitForTimeout(700);
  const C = await p.evaluate(() => { const c = document.querySelector('.plx-count'); return {shown: !!c, n: c && c.textContent}; });
  yes('  then a bar of count-in, counted down big over the score', C.shown && /^[1-4]$/.test(C.n), C);
  await p.waitForTimeout(3600);
  const P1 = await p.evaluate(() => ({running: !!(_plxNow && _plxNow.player && _plxNow.player.running), where: document.querySelector('#scPlayRow [data-plxwhere]').textContent}));
  yes('  then it plays, "m. 1 / 8" and on', P1.running && /^m\. \d \/ 8$/.test(P1.where), P1);
  yes('  and the violin part is the violin', await p.evaluate(b => _instr.stats.sampled > b, before));
  await p.keyboard.press('Equal'); await p.waitForTimeout(200);
  is('+ speeds it up 5%', await p.evaluate(() => [document.querySelector('#scPlayRow [data-plxpctv]').textContent, _plxNow.player.opts.bpm]), ['55%', 66]);
  await p.keyboard.press('Minus'); await p.waitForTimeout(200);
  is('  − back down', await p.evaluate(() => document.querySelector('#scPlayRow [data-plxpctv]').textContent), '50%');
  await p.click('#scPlayRow [data-plxgo]'); await p.waitForTimeout(300);
  const PA = await p.evaluate(() => { const h = document.querySelector('#scStage > .plx-hl'); return {paused: h && !h.hidden && h.classList.contains('paused'), where: document.querySelector('#scPlayRow [data-plxwhere]').textContent}; });
  yes('paused, the lit bar stays, dimmed', PA.paused, PA);
  const m0 = +(/m\. (\d+)/.exec(PA.where) || [])[1];
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200);
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200);
  const m1 = await p.evaluate(() => +(/m\. (\d+)/.exec(document.querySelector('#scPlayRow [data-plxwhere]').textContent) || [])[1]);
  is('→ → moves it on two bars', m1, Math.min(8, m0 + 2));
  await p.keyboard.press('KeyL'); await p.waitForTimeout(150);
  is('L turns the loop on', await p.evaluate(() => document.querySelector('#scPlayRow [data-plxopt="loop"]').classList.contains('on')), true);
  await p.keyboard.press('KeyL');
  await p.click('#scPlayRow [data-plxgo]'); await p.waitForTimeout(400);
  const back = await p.evaluate(() => +(/m\. (\d+)/.exec(document.querySelector('#scPlayRow [data-plxwhere]').textContent) || [])[1]);
  yes('  and ▶ goes on from there', back >= m1, [m1, back]);
  await p.click('#scPlayRow [data-plxstop]'); await p.waitForTimeout(300);
  await p.click('#scPlayRow [data-plxgo]'); await p.waitForTimeout(1700);
  const again = await p.evaluate(() => +(/m\. (\d+)/.exec(document.querySelector('#scPlayRow [data-plxwhere]').textContent) || [])[1]);
  yes('⏹ then ▶ starts again from the bar it stopped in, not the top', again >= m1, [m1, again]);
  await p.click('#scPlayRow [data-plxrew]'); await p.waitForTimeout(1600);
  const rw = await p.evaluate(() => +(/m\. (\d+)/.exec(document.querySelector('#scPlayRow [data-plxwhere]').textContent) || [])[1]);
  yes('⏮ goes back to the top', rw <= 2, rw);
  await p.click('#scPlayRow [data-plxstop]'); await p.waitForTimeout(200);
  /* the loop, set with two taps */
  await p.click('#scPlayRow [data-plxpick]');
  const tap = async n => { const c = await p.evaluate(n => { const b = measureBox(n), r = document.getElementById('scCanvas').getBoundingClientRect();
    return {x: r.left + b.x + b.w / 2, y: r.top + b.y + b.h / 2}; }, n); await p.mouse.click(c.x, c.y); await p.waitForTimeout(250); };
  yes('"set loop…" asks for the first bar', /tap its first bar/.test(await p.evaluate(() => document.querySelector('#scPlayRow [data-plxwhere]').textContent)));
  await tap(3); await tap(5);
  const LP = await p.evaluate(() => ({range: scoreById(scoreUi().id).playback.loopRange, loop: scoreById(scoreUi().id).playback.loop,
    btn: document.querySelector('#scPlayRow [data-plxpick]').textContent, where: document.querySelector('#scPlayRow [data-plxwhere]').textContent,
    modal: !!document.querySelector('#modals .overlay')}));
  is('  two taps on bars 3 and 5 loop them, and pin nothing', [LP.range, LP.loop, LP.btn, LP.where, LP.modal], [[3, 5], true, 'loop m. 3–5 ✕', '3 bars', false]);
  await p.click('#scPlayRow [data-plxpick]');
  is('  ✕ takes the loop off', await p.evaluate(() => scoreById(scoreUi().id).playback.loopRange), null);
  /* the click: only the downbeats */
  const K = await p.evaluate(async xml => {
    const seen = []; const was = plxClick;
    plxClick = (ctx, dest, t, accent) => { seen.push(accent); return was(ctx, dest, t, accent); };
    try { const tl = musicXmlTimeline(xml); const ctx = new OfflineAudioContext(1, 44100 * 5, 44100);
      scorePlayer(tl, {click: 'downbeats', countIn: 2, bpm: 240}).start(ctx); await ctx.startRendering();
      const all = seen.length; seen.length = 0;
      const ctx2 = new OfflineAudioContext(1, 44100 * 5, 44100);
      scorePlayer(tl, {click: 'beats', countIn: 0, bpm: 240}).start(ctx2); await ctx2.startRendering();
      return {downbeats: all, beats: seen.length}; } finally { plxClick = was; }
  }, DUET);
  yes('a two-bar count-in is eight clicks; "downbeats" clicks once a bar after it (three bars in the three seconds left), "beats" every beat', K.downbeats >= 8 + 3 && K.downbeats <= 8 + 4 && K.beats >= 16, K);
  const V = await p.evaluate(() => { const v = document.querySelector('#scPlayRow [data-plxvol]'); v.value = 30; v.dispatchEvent(new Event('input')); v.dispatchEvent(new Event('change'));
    return scoreById(scoreUi().id).playback.volume; });
  is('the volume is kept with the piece', V, 0.3);
  await p.click('#scPlayRow [data-plxmore]'); await p.waitForTimeout(150);
  yes('the options credit the instruments as well as the piano', await p.evaluate(() => /Fluid \(R3\)/.test(document.querySelector('#scPlayRow [data-plxopts]').textContent)
    && /Salamander/.test(document.querySelector('#scPlayRow [data-plxopts]').textContent)));

  is('no page errors', errs, []);
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})();
