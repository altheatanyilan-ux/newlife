/* smoke226 — the grand piano.

   WHAT IS CLAIMED. Every piano the house plays is a recording of a real
   one: the Salamander Grand Piano V3 (a Yamaha C5, Alexander Holm, CC BY
   3.0), carried in the page so it works offline. Its thirty notes decode to
   something a phone can hold, every key is played at its own pitch from the
   nearest recording, a soft note is quieter than a loud one, and the damper
   stops a note when the key comes up — except at the top, where a piano has
   no dampers. Each path that used to synthesise a piano now plays the
   recordings: a score played back, the play-along's comping, a chord or a
   voicing heard, a key pressed, the drone, the ambient slow piano. The
   band's bass and drums stay what they are. The first press of a session
   waits the moment it takes to decode, rather than playing a stand-in; and
   the piano is credited where it is played.
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

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--autoplay-policy=no-user-gesture-required']});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1300, height:1000}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }

  console.log('\n1. the piano is in the page');
  const P = await p.evaluate(() => { const tag = document.getElementById('grandPianoSrc');
    const files = tag ? JSON.parse(tag.textContent) : {};
    return {n: Object.keys(files).length, names: Object.keys(files).every(k => /^(C|Ds|Fs|A)\d$/.test(k)),
      mp3: Object.values(files).every(v => /^(SUQz|\/\/)/.test(v)), type: tag && tag.type, before: _grand.state,
      credit: GRAND_CREDIT}; });
  yes('thirty recorded notes, named by the keys they were played on', P.n === 30 && P.names, P);
  yes('  as MP3s, in a payload the browser stores and does not run', P.mp3 && P.type === 'text/plain', P.type);
  is('  and nothing decoded until something asks for it', P.before, 'idle');
  is('credited to the Salamander Grand Piano V3, Alexander Holm, CC BY 3.0', [P.credit.name, P.credit.by, P.credit.licence],
    ['Salamander Grand Piano V3', 'Alexander Holm', 'CC BY 3.0']);

  console.log('\n2. decoded, to something a phone can hold');
  const D = await p.evaluate(async () => { const t0 = performance.now(); const ok = await grandPianoLoad();
    const bufs = _grand.keys.map(k => _grand.buffers.get(k));
    const secs = bufs.reduce((a, x) => a + x.duration, 0);
    return {ok, ms: Math.round(performance.now() - t0), keys: _grand.keys, rate: bufs[0].sampleRate, ch: bufs[0].numberOfChannels,
      longest: Math.max(...bufs.map(x => x.duration)), mb: Math.round(secs * bufs[0].sampleRate * bufs[0].numberOfChannels * 4 / 1e6)}; });
  yes(`decoded (${D.ms} ms)`, D.ok && D.keys.length === 30);
  is('  one every minor third from A0 to C8', [D.keys[0], D.keys[29], D.keys.every((k, i) => i === 0 || k - D.keys[i - 1] === 3)], [21, 108, true]);
  yes(`  in stereo, and about ${D.mb} MB in memory rather than 150`, D.ch === 2 && D.mb < 60 && D.longest <= 9.01, D);

  console.log('\n3. it plays the right note, as hard as it is asked, and stops when the key comes up');
  const S = await p.evaluate(async () => {
    const render = async (fn, secs) => { const ctx = new OfflineAudioContext(1, 44100 * secs, 44100); fn(ctx); return (await ctx.startRendering()).getChannelData(0); };
    /* the fundamental, by autocorrelation over a steady stretch */
    const pitch = d => { const sr = 44100, from = Math.round(0.3 * sr), n = 8192; let best = 0, bl = 0;
      for(let lag = Math.round(sr / 1200); lag < Math.round(sr / 25); lag++){ let s = 0; for(let i = 0; i < n; i++) s += d[from + i] * d[from + i + lag]; if(s > best){ best = s; bl = lag; } }
      return sr / bl; };
    const rms = (d, a, z) => { let s = 0; for(let i = Math.round(a * 44100); i < Math.round(z * 44100); i++) s += d[i] * d[i]; return Math.sqrt(s / ((z - a) * 44100)); };
    const note = (m, v, held) => ctx => grandPianoNote(ctx, ctx.destination, m, 0.01, held, v, held);
    const hz = {};
    for(const m of [45, 57, 61, 62, 70, 76]) hz[m] = pitch(await render(note(m, 0.7, 1.5), 1));
    const soft = rms(await render(note(60, 0.3, 1), 1), 0.02, 0.5), loud = rms(await render(note(60, 0.9, 1), 1), 0.02, 0.5);
    /* the same key let go after 0.3 s, and held down: what is left at 0.7–1.1 s */
    const after = async m => rms(await render(note(m, 0.7, 0.3), 1.2), 0.7, 1.1) / rms(await render(note(m, 0.7, 2), 1.2), 0.7, 1.1);
    return {hz, soft, loud, mid: await after(60), top: await after(98)};
  });
  const want = m => 440 * Math.pow(2, (m - 69) / 12);
  const off = Object.entries(S.hz).filter(([m, f]) => {
    /* the strongest period can be the octave's: fold it before comparing */
    const r = f / want(+m), c = Math.abs(Math.log2(r) - Math.round(Math.log2(r)));
    return c * 1200 > 25; }).map(([m, f]) => `${m}: ${f.toFixed(1)} Hz, want ${want(+m).toFixed(1)}`);
  is('A2, A3, C♯4, D4, B♭4 and E5 each sound at their own pitch (within a quarter of a semitone)', off, []);
  yes('a soft note is quieter than a loud one', S.loud > S.soft * 2, [S.soft, S.loud]);
  yes('the damper stops middle C when the key comes up', S.mid < 0.02, S.mid);
  yes('  but the top of the keyboard, which has no dampers, rings on as if still held', S.top > 0.9, S.top);

  console.log('\n4. every piano in the house is this one');
  const W = await p.evaluate(async () => {
    const st = grandPianoStats(); const at = () => ({sampled: st.sampled, synth: st.synth});
    const run = async (name, fn, wait) => { const a = at(); await fn(); await new Promise(r => setTimeout(r, wait || 120)); const z = at();
      return [name, z.sampled - a.sampled, z.synth - a.synth]; };
    const out = [];
    out.push(await run('a score played back', () => scorePlayRender(jazzScoreXml(jazzExercise('3.1'), 'C'), 3)));
    out.push(await run('the play-along\'s piano', () => jazzBandRenderPeak(jazzParseChart('Dm7 | G7 | CM7 | %'), {bpm: 160}, 4)));
    out.push(await run('a chord heard', () => jazzPlayChord('Dm7')));
    out.push(await run('a voicing heard', () => jazzPlayMidis([36, 46, 52, 57, 62])));
    out.push(await run('a key pressed', () => jazzPlayMidis([60])));
    out.push(await run('the drone', () => { const d = jazzDrone(2); setTimeout(() => d.stop(), 200); }, 400));
    return out;
  });
  yes('each of them plays the recorded grand, and none of them the stand-in',
    W.every(([, s, x]) => s > 0 && x === 0), W.map(w => w.join(': ')).join(' · '));
  const V = await p.evaluate(async () => {
    const low = []; const was = jzVoiceBass; jzVoiceBass = (...a) => { low.push(a[2]); };
    try { await jazzBandRenderPeak(jazzParseChart('Dm7 | G7'), {bpm: 160}, 2); } finally { jzVoiceBass = was; }
    const got = []; const was2 = jzVoiceBass; jzVoiceBass = (...a) => { got.push(a[2]); };
    try { jazzPlayMidis([36, 40]); jazzPlayChord('C7'); await new Promise(r => setTimeout(r, 150)); } finally { jzVoiceBass = was2; }
    return {bandBass: low.length, pianoLowOnBass: got.length};
  });
  yes('the band keeps its walking bass', V.bandBass > 0, V);
  is('  but a voicing\'s low notes and a chord\'s root are the piano\'s left hand, not the bass', V.pianoLowOnBass, 0);
  await p.evaluate(() => { SoundManager.setAmbientKind('piano'); SoundManager.setAmbient(true); });
  const a0 = await p.evaluate(() => grandPianoStats().sampled);
  await p.waitForTimeout(4500);
  const a1 = await p.evaluate(() => { const n = grandPianoStats().sampled; SoundManager.setAmbient(false); return n; });
  yes('the ambient slow piano is the grand too', a1 > a0, [a0, a1]);

  console.log('\n5. the first press waits for the piano');
  const p2 = await (await b.newContext({viewport:{width:1300, height:1000}})).newPage();
  p2.on('pageerror', e => errs.push('pageerror (2): ' + e.message));
  await p2.goto(FILE); await p2.waitForTimeout(1200);
  if(await p2.$('#frGo')){ await p2.click('#frGo'); await p2.waitForTimeout(2200); }
  await p2.evaluate(() => { location.hash = '#/jazz/2.1'; }); await p2.waitForTimeout(150);
  /* straight to ▶ with nothing decoded: the warm-up the page started is let
     finish, then forgotten, so the press is the first */
  await p2.waitForSelector('.plx-bar [data-plxgo]', {timeout: 8000});
  /* the press lands in the same moment as the reset, so the page's own
     warm-up cannot slip in between them */
  const w0 = await p2.evaluate(async () => { await (_grand.promise || Promise.resolve());
    _grand.state = 'idle'; _grand.promise = null; _grand.buffers.clear(); _grand.keys = []; _grand.stats.synth = 0; _grand.stats.sampled = 0;
    document.querySelector('.plx-bar [data-plxgo]').click();
    return document.querySelector('.plx-bar [data-plxwhere]').textContent; });
  await p2.waitForTimeout(3000);
  const w1 = await p2.evaluate(() => ({running: !!(_plxNow && _plxNow.player && _plxNow.player.running), state: _grand.state, stats: grandPianoStats()}));
  yes('it says it is tuning the piano, then plays — the piano, not a stand-in', /tuning the piano/.test(w0) && w1.running && w1.state === 'ready' && w1.stats.synth === 0 && w1.stats.sampled > 0, [w0, w1]);
  await p2.evaluate(() => scorePlayStopAll());

  console.log('\n6. credited where it is played');
  await p2.click('.plx-bar [data-plxmore]'); await p2.waitForTimeout(200);
  yes('the play bar\'s options credit the piano, with its licence', await p2.evaluate(() => {
    const c = document.querySelector('.plx-bar .grand-credit'); return !!c && /Salamander Grand Piano V3/.test(c.textContent) && /Alexander Holm/.test(c.textContent)
      && !!c.querySelector('a[href*="archive.org"]') && !!c.querySelector('a[href*="creativecommons.org/licenses/by/3.0"]'); }));
  await p2.evaluate(() => { location.hash = '#/settings'; }); await p2.waitForTimeout(1500);
  yes('  and so does Settings, under the atmosphere', await p2.evaluate(() => /Salamander Grand Piano V3/.test((document.querySelector('#ambSettings') || {}).parentNode ? document.querySelector('#ambSettings').parentNode.textContent : '')));

  is('no page errors', errs, []);
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})();
