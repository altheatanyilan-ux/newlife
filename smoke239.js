/* smoke239 — Piano input: hearing an acoustic piano (Phases 1 and 2).

   The claims.

   ONE STREAM OF NOTES. A note from the microphone and a note from a MIDI
   keyboard arrive as the same NoteEvent {pitch, onset, offset, velocity,
   confidence, source} on one clock, and whoever listens cannot tell the
   difference except by asking.

   THE MICROPHONE PATH IS REAL. getUserMedia with the speech processing off,
   an AudioWorklet handing the samples to a Worker (even from file://), a
   level, a noise floor, a tuning — tested here with Chromium's fake
   microphone playing a recording of a piano (the Salamander grand, the
   site's own samples, through a small room).

   THE VERIFY ENGINE JUDGES A STEP. Told to expect F4 C5, it passes F4 C5,
   fails F4 B4 (C5 missing, B4 extra), and fails F4 C5 with an F3 under it
   at Standard strictness. Sequences are aligned (Needleman–Wunsch) so one
   wrong note does not wreck the rest; timing is read against a grid.

   THE APP'S OWN NOTES ARE NOT YOURS. A pitch the app is sounding is set
   aside when the microphone hears it.

   NOTHING IS KEPT BUT WHAT WAS LEARNED. The tuning and the note shapes
   are stored per microphone in S.listen; no audio is. */
const {chromium} = require('playwright');
const path = require('path'), fs = require('fs'), os = require('os');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

/* a take for the fake microphone: F4 C5, F4 C5, F4 B4, F4 C5, F3 F4 C5 */
function makeTake(){
  const H = require('./tools/listen-harness.js');
  const piano = H.salamander(), SR = H.SR;
  const chords = [[65, 72], [65, 72], [65, 71], [65, 72], [53, 65, 72]];
  const audio = new Float32Array(SR * 12);
  chords.forEach((c, i) => c.forEach(m => H.addNote(audio, piano, m, 1.5 + i * 2, 1.2, 0.7)));
  const x = H.room(audio);
  const b = Buffer.alloc(44 + x.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + x.length * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(x.length * 2, 40);
  for(let i = 0; i < x.length; i++) b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(x[i] * 32767 * 1.5))), 44 + i * 2);
  const f = path.join(os.tmpdir(), 'smoke239-take.wav'); fs.writeFileSync(f, b); return f;
}

(async () => {
  const wav = makeTake();
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + wav, '--autoplay-policy=no-user-gesture-required']});
  const ctx = await b.newContext({viewport: {width: 1300, height: 950}, permissions: ['microphone']});
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type() === 'error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/i.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  console.log('\n1. the arithmetic, on its own');
  const unit = await p.evaluate(() => {
    const v1 = ldVerifyStep([65, 72], [{pitch: 65}, {pitch: 72}], {mode: 'exact', strictness: 'standard'});
    const v2 = ldVerifyStep([65, 72], [{pitch: 65}, {pitch: 71}], {mode: 'exact', strictness: 'standard'});
    const v3 = ldVerifyStep([65, 72], [{pitch: 53}, {pitch: 65}, {pitch: 72}], {mode: 'exact', strictness: 'standard'});
    const v4 = ldVerifyStep([65, 72], [{pitch: 53}, {pitch: 65}, {pitch: 72}], {mode: 'exact', strictness: 'lenient'});
    const v5 = ldVerifyStep([60, 64, 67], [{pitch: 72}, {pitch: 76}, {pitch: 79}], {mode: 'pitch-class', strictness: 'standard'});
    const v6 = ldVerifyStep([60, 64, 67, 71], [{pitch: 60}, {pitch: 67}, {pitch: 71}], {mode: 'exact', strictness: 'lenient'});
    const al = ldAlign([60, 62, 64, 65, 67], [60, 62, 63, 65, 67]);
    const al2 = ldAlign([60, 62, 64, 65, 67], [60, 64, 65, 67]);
    const rh = ldRhythm([1.02, 1.49, 2.1], [{t: 1, label: '1'}, {t: 1.5, label: '&2'}, {t: 2, label: '3'}], 150);
    return {v1: v1.pass, v2: [v2.pass, v2.missing, v2.extra], v3: [v3.pass, v3.extra], v4: v4.pass, v5: v5.pass, v6: v6.pass,
      al: al.rows.map(r => r.ok), acc: al.accuracy, al2: al2.rows.map(r => r.played), rh: rh.map(r => r.offsetMs),
      parts: LD_WORKER_PARTS().every(f => typeof f === 'function'), names: listenParseNotes('F4 C5 Bb3 C#6')};
  });
  is('F4 C5 heard as F4 C5 passes', unit.v1, true);
  is('F4 B4 fails: C5 missing, B4 extra', unit.v2, [false, [72], [71]]);
  is('an F3 under it fails at Standard, as an extra', unit.v3, [false, [53]]);
  is('  and passes at Lenient, where extras are reported but forgiven', unit.v4, true);
  is('by note name, C E G an octave up passes', unit.v5, true);
  is('Lenient forgives one missing inner voice of a four-note chord', unit.v6, true);
  is('a sequence with one wrong note: only that note is wrong', unit.al, [true, true, false, true, true]);
  is('  a sequence with one note left out keeps the rest in line', unit.al2, [60, null, 64, 65, 67]);
  is('timing against the grid, early and late in ms', unit.rh, [20, -10, 100]);
  yes('the Worker is built from the same functions the page uses', unit.parts);
  is('notes typed by name', unit.names, [65, 72, 58, 85]);

  console.log('\n2. the room');
  await p.evaluate(() => { location.hash = '#/jazz/piano'; }); await p.waitForTimeout(1400);
  const room = await p.evaluate(() => ({cards: document.querySelectorAll('.li-page .li-card').length,
    heads: [...document.querySelectorAll('.li-card h2')].map(h => h.textContent),
    seg: [...document.querySelectorAll('[data-lisrc]')].map(b => b.dataset.lisrc),
    privacy: /No sound is recorded, kept or sent/.test(document.querySelector('.li-lede').textContent),
    link: !!(() => { location.hash; return true; })()}));
  is('five parts: the input, what it hears, check a chord, your piano, the harness', room.cards, 5);
  is('  named', room.heads, ['What it hears', 'Check a chord', 'Your piano', 'How well does it hear my piano?']);
  is('Auto, Microphone, MIDI keyboard', room.seg, ['auto', 'mic', 'midi']);
  yes('it says nothing is recorded or sent', room.privacy);
  const tool = await p.evaluate(async () => { location.hash = '#/jazz'; await new Promise(r => setTimeout(r, 1200));
    return !!document.querySelector('[data-jzgo="#/jazz/piano"]'); });
  yes('the Jazz Studio has a way in', tool);

  console.log('\n3. the microphone, live');
  await p.evaluate(() => { location.hash = '#/jazz/piano'; }); await p.waitForTimeout(1200);
  await p.click('[data-lisrc="mic"]'); await p.waitForTimeout(300);
  await p.evaluate(() => { window.__ev = []; window.__vf = []; listenOn(e => __ev.push(e)); listenOnVerify(r => __vf.push(r)); });
  await p.fill('#liExp', 'F4 C5'); await p.dispatchEvent('#liExp', 'change');
  await p.click('#liGo');
  await p.waitForTimeout(11500);
  const live = await p.evaluate(() => ({active: listenActive(), worklet: !!(_li.mic && _li.mic.node),
    ev: __ev.slice(0, 3), shapes: __ev.every(e => ['pitch', 'onset', 'offset', 'velocity', 'confidence', 'source'].every(k => k in e)),
    sources: [...new Set(__ev.map(e => e.source))], pitches: [...new Set(__ev.map(e => e.pitch))].sort((a, b) => a - b),
    verdicts: __vf.map(v => ({pass: v.verify.pass, missing: v.verify.missing, extra: v.verify.extra, t: v.t, ms: Math.round(v.latency * 1000)})),
    level: _li.level, pill: !!document.getElementById('liPill'), shown: (document.getElementById('liVerdict') || {}).textContent || ''}));
  is('listening through the microphone', live.active, 'mic');
  yes('  through an AudioWorklet, even from file://', live.worklet);
  yes('  with the "Listening" mark on every page', live.pill);
  yes('every event is a NoteEvent', live.shapes && live.ev.length > 0, JSON.stringify(live.ev));
  is('  from the microphone', live.sources, ['mic']);
  yes('it heard F4, C5 and B4 (and the F3)', [65, 71, 72].every(q => live.pitches.includes(q)), JSON.stringify(live.pitches));
  yes('a level and a noise floor', live.level && isFinite(live.level.db) && isFinite(live.level.floorDb) && live.level.floorDb < live.level.db, JSON.stringify(live.level));
  const firstFive = [];
  live.verdicts.forEach(v => { if(!firstFive.length || v.t - firstFive[firstFive.length - 1].t > 1) firstFive.push(v); });
  const f5 = firstFive.slice(0, 5);
  is('five steps judged: right, right, wrong, right, wrong', f5.map(v => v.pass), [true, true, false, true, false]);
  yes('  the third: B4 heard where C5 was asked', (f5[2] || {}).extra && f5[2].extra.includes(71) || ((f5[2] || {}).missing || []).includes(72), JSON.stringify(f5[2]));
  yes('  the fifth: the F3 is the extra', ((f5[4] || {}).extra || []).includes(53), JSON.stringify(f5[4]));
  yes('every verdict within 150 ms of the attack', live.verdicts.every(v => v.ms <= 150), JSON.stringify(live.verdicts.map(v => v.ms)));
  yes('the verdict is on the page', /Right|Not yet/.test(live.shown), live.shown);
  await p.click('#liGo'); await p.waitForTimeout(900);
  const after = await p.evaluate(() => ({active: listenActive(), pill: !!document.getElementById('liPill'),
    dev: Object.values(listenState().devices)[0], meta: META_KEYS.includes('listen')}));
  is('stopping stops it, and the mark goes', [after.active, after.pill], [null, false]);
  yes('the tuning is kept for this microphone', after.dev && typeof after.dev.cents === 'number', JSON.stringify(after.dev && after.dev.cents));
  yes('  and the shapes of the notes it confirmed', after.dev && Object.keys(after.dev.templates || {}).length >= 1, JSON.stringify(Object.keys((after.dev || {}).templates || {})));
  yes('  and no audio', after.dev && !JSON.stringify(after.dev).includes('Float32') && JSON.stringify(after.dev).length < 20000);
  yes('S.listen is saved', after.meta);

  console.log('\n4. MIDI is the same stream');
  const midi = await p.evaluate(async () => {
    const got = [], ver = [];
    const off1 = listenOn(e => got.push(e)), off2 = listenOnVerify(v => ver.push(v));
    listenExpect([65, 72], {mode: 'exact', strictness: 'standard'});
    const t = listenNow();
    [65, 72].forEach(pch => { const ev = {pitch: pch, onset: t, offset: null, velocity: 0.7, confidence: 1, source: 'midi'}; listenEmit(ev); listenMidiVerify(ev); });
    await new Promise(r => setTimeout(r, 200));
    off1(); off2();
    return {n: got.length, src: got.map(e => e.source), conf: got.map(e => e.confidence), pass: ver.map(v => v.verify.pass)};
  });
  is('two keys, two NoteEvents, certainty one', [midi.n, midi.conf], [2, [1, 1]]);
  is('  judged by the same verdict', midi.pass, [true]);

  console.log('\n5. the app’s own notes');
  const leak = await p.evaluate(() => {
    _li.mic = _li.mic || {fake: true};
    const now = listenNow();
    _li.app.push({pitch: 60, from: now - 0.1, to: now + 1});
    const r = [listenIsApp(60, now), listenIsApp(72, now), listenIsApp(61, now), listenIsApp(60, now + 3)];
    if(_li.mic.fake) _li.mic = null;
    return r;
  });
  is('a C the app is playing is set aside (and its octave); a C♯, or later, is not', leak, [true, true, false, false]);

  console.log('\n6. the harness is in the room');
  const h = await p.evaluate(() => ({audio: !!document.getElementById('liHAudio'), xml: !!document.getElementById('liHXml'),
    pedal: !!document.getElementById('liHPedal'), run: typeof listenHarnessRun === 'function'}));
  yes('a recording, its MusicXML, the pedal, and Measure', h.audio && h.xml && h.pedal && h.run);

  console.log('\n7. phone width');
  await p.setViewportSize({width: 390, height: 844}); await p.waitForTimeout(600);
  const w = await p.evaluate(() => ({sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth}));
  yes('no sideways scroll at 390px', w.sw <= w.cw + 1, JSON.stringify(w));

  is('no page errors', errs, []);
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})();
