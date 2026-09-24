/* smoke224 — practice mode on the tune page.

   WHAT IS CLAIMED. The band plays only the bars you loop, and tells the page
   each time the loop comes round; a new key or a new range is written out
   before the next pass. On the tune page a loop can be set by tapping two
   bars, by a pattern under the chart, or by a ⟳ beside what the analysis
   found. With auto tempo the band climbs by the step each repeat and stops
   at 300; with auto keys it walks the twelve in the pattern chosen (random
   never repeats a key before all twelve), redrawing the chart in each, and
   "Loop all 12 keys" off stops it after the twelfth. Turning either on while
   the band plays keeps the band and its read-out going. Tapping a chord says
   what it is doing in the tune and offers the scales for that job and six
   voicings, each tagged with the stage that teaches it; where the brief's
   Type A/B and the book's differ, both are shown. A take recorded over the
   band is kept with its tempo, key and loop, listed on the tune and in the
   journal, counted in the library, found by the journal's filters, exported
   as a zip any unzipper opens, and deleted only on a second click.
 */
const {chromium} = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');
const {execFileSync} = require('child_process');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n)
  : no(n, `\n         got  ${JSON.stringify(a)}\n         want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));
const TUNE = 'autumn-leaves';

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium',
    args:['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required']});
  const errs = [];
  const ctx = await b.newContext({viewport:{width:1400, height:1200}, permissions:['microphone'], acceptDownloads: true});
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  const tunePage = async () => { await p.evaluate(id => { location.hash = '#/jazz'; }, TUNE); await p.waitForTimeout(200);
    await p.evaluate(id => { location.hash = '#/jazz/tune/' + id; }, TUNE); await p.waitForTimeout(1300); };
  const P = () => p.evaluate(id => JSON.parse(JSON.stringify(jazzPracFor(id))), TUNE);
  const statusText = () => p.evaluate(() => (document.querySelector('.jzx-status') || {}).textContent.replace(/\s+/g, ' ').trim());

  console.log('\n1. the band plays the loop, and says when it comes round');
  const E = await p.evaluate(async () => {
    const chart = jazzParseChart(jazzTune('autumn-leaves').chordProgression);
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const ctx = new OAC(1, 44100 * 12, 44100);
    const passes = [], bars = [], syms = [];
    let band = null;
    band = jazzBand(chart, {bpm: 240, countIn: false, loop: true, range: [5, 7],
      onLoop: (pass, ms) => { passes.push({pass, bpm: band.bpm, bars: [...new Set(band.beats.map(x => x.bar))]});
        band.set('bpm', Math.min(300, band.bpm + 20));
        if(pass === 3){ band.set('range', [1, 2]); band.set('toKey', 'A'); band.set('semis', jazzTuneShift(jazzTune('autumn-leaves'), 'A')); } }});
    const first = [...new Set(band.beats.map(x => x.bar))];
    band.start(ctx);
    const after = {bars: [...new Set(band.beats.map(x => x.bar))], syms: [...new Set(band.beats.filter(x => x.sym).map(x => x.sym))]};
    const buf = await ctx.startRendering();
    const d = buf.getChannelData(0); let peak = 0; for(let k = 0; k < d.length; k += 7) peak = Math.max(peak, Math.abs(d[k]));
    return {first, passes, after, peak};
  });
  is('only the looped bars are built', E.first, [5, 6, 7]);
  yes('the loop comes round, and says which pass it is', E.passes.length >= 3 && E.passes.every((x, i) => x.pass === i + 2), E.passes.map(x => x.pass));
  is('  each pass at the tempo the last one set', E.passes.slice(0, 4).map(x => x.bpm), [240, 260, 280, 300].slice(0, Math.min(4, E.passes.length)));
  yes('  and it stops climbing where it was told to', E.passes.every(x => x.bpm <= 300), E.passes.map(x => x.bpm));
  is('a new range and key are written out before the next pass', E.after.bars, [1, 2]);
  yes('  in the new key (A: Bm7 E7, not Am7 D7)', E.after.syms.includes('Bm7') && E.after.syms.includes('E7') && !E.after.syms.includes('D7'), E.after.syms);
  yes('and it makes a sound', E.peak > 0.01, E.peak);

  console.log('\n2. the twelve keys, in each pattern');
  const K = await p.evaluate(() => {
    let seed = 7; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    let seed2 = 99; const rand2 = () => (seed2 = (seed2 * 16807) % 2147483647) / 2147483647;
    const r1 = jazzKeyCycle('random', 'G', rand), r2 = jazzKeyCycle('random', 'G', rand2);
    return {f: jazzKeyCycle('fourths', 'Eb'), u: jazzKeyCycle('up', 'C'), d: jazzKeyCycle('down', 'C'),
      r1, r2, sharp: jazzKeyCycle('fourths', 'F#')};
  });
  is('cycle of fourths from E♭', K.f, ['Eb', 'Ab', 'Db', 'Gb', 'B', 'E', 'A', 'D', 'G', 'C', 'F', 'Bb']);
  is('chromatic up from C', K.u, ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']);
  is('chromatic down from C', K.d, ['C', 'B', 'Bb', 'A', 'Ab', 'G', 'Gb', 'F', 'E', 'Eb', 'D', 'Db']);
  yes('random: all twelve, no key twice, from where you are', new Set(K.r1).size === 12 && K.r1[0] === 'G', K.r1.join(' '));
  yes('  and not the same order every time', K.r1.join() !== K.r2.join(), [K.r1.join(' '), K.r2.join(' ')]);
  is('a sharp key starts the ring at its flat name', K.sharp[0], 'Gb');

  console.log('\n3. setting a loop on the tune page');
  await p.evaluate(id => { jazzTuneUi().key = ''; jazzTuneUi().overlay = false; delete S._jprac; }, TUNE);
  await tunePage();
  yes('the practice panel is on the tune page', await p.$('.jzx-panel #jpGo') && await p.$('.jt-chart'));
  await p.click('[data-jxpick]'); await p.click('.jt-bar[data-bar="5"]'); await p.waitForTimeout(150);
  yes('  the first tap marks where the loop starts', /loop from bar 5 to/.test(await statusText()), await statusText());
  await p.click('.jt-bar[data-bar="7"]'); await p.waitForTimeout(250);
  let L = await p.evaluate(() => ({lit: [...document.querySelectorAll('.jt-bar.jt-loop')].map(b => +b.dataset.bar)}));
  is('two taps loop the bars between', (await P()).loop, [5, 7]);
  is('  lit on the chart with the patterns off', L.lit, [5, 6, 7]);
  yes('  and said: "Looping bars 5–7"', /Looping bars 5–7/.test(await statusText()), await statusText());
  await p.click('#jpGo'); await p.waitForTimeout(700);
  const B1 = await p.evaluate(() => ({running: !!(_jzBand && _jzBand.running), bars: [...new Set(_jzBand.beats.map(x => x.bar))]}));
  yes('the band plays just those bars', B1.running && JSON.stringify(B1.bars) === '[5,6,7]', B1);
  await p.click('.jt-bar[data-bar="9"]'); await p.click('.jt-bar[data-bar="9"]'); await p.waitForTimeout(700);
  const B2 = await p.evaluate(() => ({running: !!(_jzBand && _jzBand.running), bars: [...new Set(_jzBand.beats.map(x => x.bar))]}));
  yes('  while playing, two taps on one bar loop that bar, and the band follows', B2.running && JSON.stringify(B2.bars) === '[9]', B2);
  await p.click('[data-jxclear]'); await p.waitForTimeout(600);
  is('✕ ends the loop', (await P()).loop, null);
  await p.click('#jpGo'); await p.waitForTimeout(200);
  await p.click('#jtOverlay'); await p.waitForTimeout(900);
  await p.click('.jt-bar[data-bar="6"] .jt-marks i[data-kind="minor"]'); await p.waitForTimeout(300);
  is('a pattern under the chart loops its span (the minor ii-V-i, bars 5–7)', (await P()).loop, [5, 7]);
  const lb = await p.evaluate(() => [...document.querySelectorAll('[data-jtloop]')].map(x => x.dataset.jtloop));
  yes('each thing the analysis found has a ⟳', lb.length >= 4 && lb.includes('1-3'), lb);
  await p.click('[data-jtloop="1-3"]'); await p.waitForTimeout(300);
  is('  and ⟳ loops it', (await P()).loop, [1, 3]);
  await p.click('#jtOverlay'); await p.waitForTimeout(900);
  is('the loop survives a redraw', (await P()).loop, [1, 3]);

  console.log('\n4. auto tempo and auto keys, repeat by repeat');
  await p.evaluate(id => { const P = jazzPracFor(id); P.loop = [1, 1]; P.bpm = 280;
    P.autoTempo = {on: true, step: 5}; P.autoKey = {on: true, pattern: 'fourths', all12: false}; rerender(); }, TUNE);
  await p.waitForTimeout(900);
  yes('the settings show the step, reset, pattern and "all 12"',
    await p.$('[data-jxstep]') && await p.$('[data-jxreset]') && await p.$('[data-jxpattern]') && await p.$('[data-jxall12]'));
  await p.evaluate(() => { window._keysSeen = []; window._statusSeen = [];
    window._keyPoll = setInterval(() => { const k = jazzTuneUi().key || 'G';
      if(_keysSeen[_keysSeen.length - 1] !== k) _keysSeen.push(k);
      const s = (document.querySelector('.jzx-status') || {}).textContent || ''; if(_statusSeen[_statusSeen.length - 1] !== s) _statusSeen.push(s.replace(/\s+/g, ' ').trim()); }, 60); });
  await p.click('#jpGo');
  for(let i = 0; i < 90; i++){ await p.waitForTimeout(250); if(!(await p.evaluate(() => !!(_jzBand && _jzBand.running)))) break; }
  await p.waitForTimeout(1200);
  const A = await p.evaluate(id => { clearInterval(window._keyPoll); const P = jazzPracFor(id);
    return {keys: _keysSeen, statuses: _statusSeen, bpm: P.bpm, trail: P.trail, cycle: P.cycleKeys, running: !!(_jzBand && _jzBand.running),
      chart: (document.querySelector('.jt-bar[data-bar="1"] [data-ci]') || {}).dataset.sym, key: jazzTuneUi().key,
      go: document.querySelector('#jpGo').textContent}; }, TUNE);
  is('the key walks the cycle of fourths from the tune\'s own', A.keys, ['G', 'C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'B', 'E', 'A', 'D']);
  yes('  and with "Loop all 12 keys" off it stops after the twelfth', !A.running && /Play along/.test(A.go), A);
  is('the tempo climbs 5 a repeat and stops at 300', [A.trail.slice(0, 4), A.bpm, Math.max(...A.trail)], [[285, 290, 295, 300], 300, 300]);
  yes('  said as "♩ = 280 → 285 → …, Key: …(n of 12)"', A.statuses.some(s => /♩ = 280 → 285/.test(s)) && A.statuses.some(s => /Key: E♭ \(5 of 12\)/.test(s)),
    A.statuses.slice(0, 8));
  is('the chart is redrawn in the key it has reached (D: Em7)', [A.key, A.chart], ['D', 'Em7']);
  await p.click('[data-jxreset]'); await p.waitForTimeout(300);
  is('reset tempo goes back to where it started', (await P()).bpm, 280);

  /* turning auto tempo on while the band plays: the band plays on, and the
     read-out on the redrawn page keeps up with it */
  await p.evaluate(id => { const P = jazzPracFor(id); P.loop = [1, 1]; P.bpm = 240;
    P.autoTempo = {on: false, step: 10}; P.autoKey = {on: false, pattern: 'fourths', all12: true}; jazzTuneUi().key = ''; rerender(); }, TUNE);
  await p.waitForTimeout(900);
  await p.click('#jpGo'); await p.waitForTimeout(500);
  await p.click('.jzx-settings summary'); await p.check('[data-jxauto="tempo"]'); await p.waitForTimeout(3600);
  const M = await p.evaluate(id => ({running: !!(_jzBand && _jzBand.running), bpm: _jzBand && _jzBand.bpm, go: document.querySelector('#jpGo').textContent,
    status: document.querySelector('.jzx-status').textContent, shown: document.querySelector('#jpBpmV').textContent}), TUNE);
  yes('switched on mid-play, the band keeps playing and climbs', M.running && M.bpm > 240 && /Stop/.test(M.go), M);
  yes('  and the page shows it', /240 → 250/.test(M.status) && +M.shown > 240, M);
  await p.click('#jpGo'); await p.waitForTimeout(200);
  await p.evaluate(id => { const P = jazzPracFor(id); P.autoTempo.on = false; P.loop = null; P.bpm = 132; rerender(); }, TUNE);
  await p.waitForTimeout(800);

  console.log('\n5. a chord, looked into');
  await p.click('.jt-bar[data-bar="2"] [data-ci]'); await p.waitForTimeout(400);
  const C = await p.evaluate(() => { const pop = document.querySelector('.jzx-pop'); if(!pop) return null;
    return {role: pop.querySelector('.jzx-role').textContent,
      scales: [...pop.querySelectorAll('.jzx-scales li')].map(li => [...li.children].map(x => x.textContent.trim()).join(' | ')),
      stage: (pop.querySelector('.jzx-stage') || {}).textContent || '', kb: pop.querySelectorAll('.jzkb-k.lit').length,
      bg: getComputedStyle(pop).backgroundColor}; });
  yes('tapping a chord opens its card', C, C);
  is('  D7 in bar 2 is the V of the ii-V-I to G', C && C.role, 'V7 in ii-V-I to G');
  is('  Mixolydian first, marked safest, spelled D E F♯ G A B C', C && C.scales[0], 'Mixolydian | safest | D E F♯ G A B C');
  yes('  then the other dominant scales', C && ['Bebop Dominant', 'Lydian Dominant', 'Whole Tone'].every(n => C.scales.some(s => s.startsWith(n))), C && C.scales);
  yes('  the scale lit on a keyboard (eight keys, the octave too)', C && C.kb === 8, C && C.kb);
  yes('  with the stage that teaches it', C && /covered in Stage \d+/.test(C.stage), C && C.stage);
  yes('  on a solid card, not see-through', C && !/rgba\(.*, 0\)|transparent/.test(C.bg), C && C.bg);
  await p.click('[data-jxsame]'); await p.waitForTimeout(200);
  const same = await p.evaluate(() => [...document.querySelectorAll('.jt-bar.same')].map(b => +b.dataset.bar));
  const dom = await p.evaluate(() => jazzParseChart(jazzTune('autumn-leaves').chordProgression).bars
    .filter(b => b.chords.some(c => jazzChordQualityKey(jazzParseChord(c.text)) === '7')).map(b => b.n));
  is('"show on chart" lights every bar with a dominant seventh', same, dom);
  await p.click('[data-jxtab="voicings"]'); await p.waitForTimeout(150);
  const seen = [];
  for(let i = 0; i < 6; i++){
    seen.push(await p.evaluate(() => { const pop = document.querySelector('.jzx-pop');
      return {name: pop.querySelector('.jzx-how').previousElementSibling.querySelector('b').textContent,
        stage: pop.querySelector('.jzx-how').previousElementSibling.querySelector('.faint').textContent.replace(/\D/g, ''),
        notes: pop.querySelector('.jzx-notes').textContent, lh: pop.querySelectorAll('.jzkb-k.lh').length, rh: pop.querySelectorAll('.jzkb-k.rh').length,
        differs: !!pop.querySelector('.jzx-differs'), play: !!pop.querySelector('[data-jxplay]')}; }));
    await p.click('[data-jxv="1"]'); await p.waitForTimeout(80);
  }
  is('six voicings, each tagged with its stage', seen.map(v => `${v.name}:${v.stage}`),
    ['Root position:1', 'Shell voicing:2', 'Type A:2', 'Type B:2', 'Drop 2:4', 'Left hand + right hand:4']);
  is('  D7 Type A is 3-5-7-9 with the 13 for the 5 (F♯ B C E)', seen[2].notes.replace(/\d/g, ''), 'F♯ B C E');
  is('  D7 Type B is 7-9-3-5 (C E F♯ B)', seen[3].notes.replace(/\d/g, ''), 'C E F♯ B');
  yes('  where the book\'s Type A/B differ, both are shown', seen[2].differs && seen[3].differs);
  yes('  the two hands in two colours', seen[5].lh === 2 && seen[5].rh === 3, seen[5]);
  yes('  and every one can be played', seen.every(v => v.play));
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  yes('Escape closes the card', !(await p.$('.jzx-pop')));
  await p.click('.jt-bar[data-bar="4"] [data-ci]'); await p.waitForTimeout(300);
  is('  a chord after the ii-V-I is named in the key it arrived in', await p.evaluate(() => document.querySelector('.jzx-role').textContent), 'IV in G');
  const box = await (await p.$('.jzx-panel')).boundingBox();
  await p.mouse.click(box.x + 4, box.y + 4); await p.waitForTimeout(200);
  yes('  and a click outside closes it', !(await p.$('.jzx-pop')));
  await p.evaluate(() => { jazzTuneUi().key = 'A'; rerender(); }); await p.waitForTimeout(800);
  await p.click('.jt-bar[data-bar="2"] [data-ci]'); await p.waitForTimeout(300);
  const CA = await p.evaluate(() => [document.querySelector('.jzx-sym').textContent, document.querySelector('.jzx-role').textContent]);
  is('in another key the card speaks that key', CA, ['E7', 'V7 in ii-V-I to A']);
  await p.keyboard.press('Escape');
  const V = await p.evaluate(() => { const v = s => Object.fromEntries(jazzGenerateVoicings(s).map(x => [x.name, x.notes.join(' ')]));
    return {c7: v('C7'), cm7: v('Cm7'), book: jazzBookTypeAB('C7'), b7: jazzScaleSuggestions('B7b9', {context: 'inMinorIiVi'})[0]}; });
  is('C7 Type A E-A-B♭-D and Type B B♭-D-E-A, as the brief gives them', [V.c7['Type A'], V.c7['Type B']], ['E3 A3 B♭3 D4', 'B♭3 D4 E4 A4']);
  is('  Cm7 Type A E♭-G-B♭-D', V.cm7['Type A'], 'E♭3 G3 B♭3 D4');
  is('  root position and shell', [V.c7['Root position'], V.c7['Shell voicing']], ['C3 E3 G3 B♭3', 'C3 E3 B♭3']);
  is('  the book\'s own Type A for C7 (Siskind 3.1) kept beside it', V.book.A, ['E', 'B♭', 'D', 'G']);
  is('a V7 in a minor ii-V-i asks for the altered scale first', [V.b7.name, V.b7.notes.join(' ')], ['Altered', 'B C D D♯ F G A']);

  console.log('\n6. the practice journal');
  await p.evaluate(() => { jazzTuneUi().key = 'Bb'; }); await tunePage();
  await p.evaluate(id => { jazzPracFor(id).loop = [5, 7]; }, TUNE);
  yes('the tune has a journal before any take', /Total recorded practice: 0s across 0 sessions/.test(await p.evaluate(() => document.querySelector('#jzjSide').textContent)));
  await p.click('[data-jxrec]'); await p.waitForTimeout(400);
  yes('🎙 shows it is recording', await p.evaluate(() => !document.querySelector('.jzx-recind').hidden && /Stop recording/.test(document.querySelector('[data-jxrec]').textContent)));
  await p.waitForTimeout(1800);
  await p.click('[data-jxrec]'); await p.waitForTimeout(900);
  const title = await p.evaluate(() => (document.querySelector('#jjTitle') || {}).value);
  yes('the save dialog proposes "Autumn Leaves — Sep 24, 2026 6:45 PM"', /^Autumn Leaves — [A-Z][a-z]{2} \d{1,2}, \d{4} \d{1,2}:\d{2} [AP]M$/.test(title || ''), title);
  await p.fill('#jjNote', 'Working on the minor ii-V-i in bars 5–7'); await p.click('#jjSave'); await p.waitForTimeout(1200);
  const J = await p.evaluate(async id => { const r = jazzTuneTakes(id)[0]; const blob = r && await jazzGetAudio(r.audioId);
    return {n: jazzTuneTakes(id).length, r, size: blob ? blob.size : 0,
      side: document.querySelector('#jzjSide').textContent.replace(/\s+/g, ' '), rows: document.querySelectorAll('#jzjSide .jzj-row').length}; }, TUNE);
  is('the take is kept, with its note, tempo, key and loop',
    J.r && [J.r.kind, J.r.tuneId, J.r.note, J.r.context.tempo, J.r.context.key, J.r.context.loopedBars],
    ['tune', TUNE, 'Working on the minor ii-V-i in bars 5–7', 132, 'Bb', [5, 7]]);
  yes('  and the sound with it', J.size > 500 && J.r.seconds >= 1, [J.size, J.r && J.r.seconds]);
  yes('it is listed under the tune, with the total', J.rows === 1 && /across 1 session/.test(J.side) && /♩=132/.test(J.side) && /key B♭/.test(J.side) && /bars 5–7/.test(J.side), J.side);
  await p.evaluate(async () => { await saveNow(); await load(); });
  is('  and it is still there after a reload', await p.evaluate(id => jazzTuneTakes(id).length, TUNE), 1);
  await p.evaluate(() => { location.hash = '#/jazz/tunes'; }); await p.waitForTimeout(1300);
  is('the library shows 🎙 1 on the tune', await p.evaluate(id => { const a = document.querySelector(`a.jt-title[href="#/jazz/tune/${id}"] .jt-takes`); return a && a.textContent.trim(); }, TUNE), '🎙 1');
  await p.evaluate(() => { location.hash = '#/jazz/journal'; }); await p.waitForTimeout(1500);
  const G = await p.evaluate(() => ({rows: document.querySelectorAll('.jzj-row').length, link: !!document.querySelector('.jzj-row a[href="#/jazz/tune/autumn-leaves"]'),
    store: document.querySelector('#jjStore').textContent}));
  yes('the journal lists every take, with its tune', G.rows === 1 && G.link, G);
  yes('  and says how much storage is used', /Storage used: .+ of .+\(|does not say/.test(G.store), G.store);
  await p.fill('[data-jjf="q"]', 'bridge'); await p.waitForTimeout(700);
  yes('searching the notes for what is not there finds nothing', await p.evaluate(() => /Nothing matches/.test(document.body.textContent) && !document.querySelector('.jzj-row')));
  await p.fill('[data-jjf="q"]', 'minor ii-V'); await p.waitForTimeout(700);
  is('  and for what is there finds it', await p.evaluate(() => document.querySelectorAll('.jzj-row').length), 1);
  const tomorrow = await p.evaluate(() => addDays(today(), 1));
  await p.fill('[data-jjf="from"]', tomorrow); await p.dispatchEvent('[data-jjf="from"]', 'change'); await p.waitForTimeout(600);
  is('a date range after it hides it', await p.evaluate(() => document.querySelectorAll('.jzj-row').length), 0);
  await p.evaluate(() => { S._jjournal = {tune: '', from: '', to: '', q: ''}; rerender(); }); await p.waitForTimeout(600);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#jjExport')]);
  const zipPath = path.join(os.tmpdir(), 'smoke224-journal.zip');
  await dl.saveAs(zipPath);
  let Z = null;
  try { Z = JSON.parse(execFileSync('python3', ['-c',
    'import zipfile,json,sys; z=zipfile.ZipFile(sys.argv[1]); bad=z.testzip(); j=json.loads(z.read("journal.json")); print(json.dumps({"bad":bad,"names":z.namelist(),"j":j}))', zipPath]).toString());
  } catch(e){ Z = {error: String(e.message).slice(0, 200)}; }
  yes('"Export all" writes a zip that an unzipper opens, every CRC right', Z && Z.bad === null && Z.names, Z);
  yes('  with the take under its tune and a journal.json', Z && Z.names && Z.names.some(n => /^autumn-leaves\/\d{4}-\d{2}-\d{2}-.+\.(webm|ogg|m4a|wav)$/.test(n)) && Z.names.includes('journal.json'), Z && Z.names);
  is('  the journal.json carries the note and the context', Z && Z.j && [Z.j[0].note, Z.j[0].context.key], ['Working on the minor ii-V-i in bars 5–7', 'Bb']);
  try { fs.unlinkSync(zipPath); } catch(e){}
  await p.click('[data-jjdel]'); await p.waitForTimeout(300);
  is('delete asks once more', await p.evaluate(id => [jazzTuneTakes(id).length, document.querySelector('[data-jjdel]').textContent], TUNE), [1, 'sure? delete']);
  await p.click('[data-jjdel]'); await p.waitForTimeout(800);
  is('  and the second click deletes it', await p.evaluate(id => jazzTuneTakes(id).length, TUNE), 0);

  console.log('\n7. the play-along room uses the same panel');
  await p.evaluate(() => { jazzTuneUi().key = ''; location.hash = '#/jazz/playalong'; }); await p.waitForTimeout(1300);
  yes('the room has the tune picker, the keys and the panel', await p.$('#jpTune') && await p.$('.jzx-panel') && await p.$('.jt-chart'));
  await p.click('#jpGo'); await p.waitForTimeout(2200);
  const PA = await p.evaluate(() => ({running: !!(_jzBand && _jzBand.running), now: (document.querySelector('.jt-bar.now') || {dataset: {}}).dataset.bar}));
  yes('  and the band plays there, lighting the bar it is on', PA.running && PA.now, PA);
  await p.click('#jpGo');
  await p.evaluate(() => { location.hash = '#/jazz'; }); await p.waitForTimeout(400);
  yes('leaving the page stops the band', await p.evaluate(() => !(_jzBand && _jzBand.running)));

  is('no page errors', errs, []);
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})();
