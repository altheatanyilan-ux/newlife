/* smoke-sng-voice — the vocal range is scrolled to, and found; the metronome is a bar on every page */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
const WAV = process.env.VOICE_WAV || '/tmp/claude-0/-home-user-newlife/923b6cf5-ecb3-57ac-957e-178011b85c4d/scratchpad/voice.wav';
let bad = 0;
const yes = (n, c, g='') => { if(c) console.log('  ok   ' + n); else { bad++; console.log('  FAIL ' + n + '  — ' + JSON.stringify(g)); } };
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + WAV]});
  const errs = [];
  const ctx = await b.newContext({viewport: {width: 1300, height: 950}, permissions: ['microphone']});
  const p = await ctx.newPage();
  p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR', e.message); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  const q = (f, a) => p.evaluate(f, a);

  console.log('1. the pitch finder');
  const y = await q(() => { const sr = 48000, out = {}; for(const [name, f] of [['G2', 98], ['A3', 220], ['C5', 523.25], ['E3', 164.81]]){
    const buf = new Float32Array(4096); for(let i = 0; i < 4096; i++){ const t = i / sr; buf[i] = 0.4 * (Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(4 * Math.PI * f * t) + 0.3 * Math.sin(6 * Math.PI * f * t)); }
    const r = sngYin(buf, sr); out[name] = r ? +sngFreqMidi(r.f0).toFixed(2) : null; } out.quiet = sngYin(new Float32Array(4096), sr); out.noise = (() => { const buf = new Float32Array(4096); for(let i = 0; i < 4096; i++) buf[i] = (Math.random() - .5) * 0.5; const r = sngYin(buf, sr); return r && r.clarity >= 0.8 ? 'pitched' : 'none'; })(); return out; });
  yes('a held tone is named within a few cents (G2 A3 E3 C5)', Math.abs(y.G2 - 43) < 0.1 && Math.abs(y.A3 - 57) < 0.1 && Math.abs(y.E3 - 52) < 0.1 && Math.abs(y.C5 - 72) < 0.1, y);
  yes('silence and noise are not mistaken for a voice', y.quiet === null && y.noise === 'none', y);

  console.log('\n2. the onboarding: wheels, not boxes');
  await q(() => { S.songwriting = S.songwriting || {}; sngState().profile.onboarded = false; saveNow(); location.hash = '#/songwriting'; }); await p.waitForTimeout(1200);
  yes('two wheels replace the typed notes', (await p.$$('.sng-wheel-list')).length === 2 && !(await p.$('#sngLow')));
  const w0 = await q(() => ({names: document.querySelector('#sngRangeNames').textContent, span: document.querySelector('#sngRangeSpan').textContent, voice: document.querySelector('#sngRangeVoice').textContent}));
  yes('they start on a range, and say how wide it is and which voice it sits like', /C3 – C5/.test(w0.names) && /2 octaves/.test(w0.span) && /tenor/.test(w0.voice), w0);
  await q(() => { const l = document.querySelector('[data-wheel="lo"] .sng-wheel-list'); l.scrollTop += 38 * 5; }); await p.waitForTimeout(500);
  const w1 = await q(() => document.querySelector('#sngRangeNames').textContent);
  yes('scrolling the low wheel down five notes lowers it to G2', /^G2 – C5/.test(w1), w1);
  await p.click('[data-wheel="hi"] .sng-wh[data-m="76"]'); await p.waitForTimeout(500);
  yes('pressing a note on the high wheel takes it there (E5)', /E5$/.test(await q(() => document.querySelector('#sngRangeNames').textContent)));
  await p.focus('[data-wheel="hi"] .sng-wheel-list'); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(500);
  yes('and the arrow keys move it a note at a time', /E♭5$/.test(await q(() => document.querySelector('#sngRangeNames').textContent)) || /D♯5$/.test(await q(() => document.querySelector('#sngRangeNames').textContent)));

  console.log('\n3. finding it with the microphone');
  await q(() => document.querySelectorAll('.toast, #toasts > *').forEach(t => t.remove()));
  await q(() => document.querySelector('[data-rangefind]').click()); await p.waitForTimeout(600);
  await p.click('#frListen'); await p.waitForTimeout(9500);
  const fr = await q(() => ({res: document.querySelector('#frResult').textContent, live: document.querySelector('#frNote').textContent, use: !document.querySelector('#frUse').disabled, voice: document.querySelector('#frVoice').textContent}));
  yes('it hears the lowest and the highest note held, and offers the comfortable range inside them', /reached\s*G2\s*to\s*D5/.test(fr.res) && /comfortable range\s*A2 – C5|comfortable range\s*[A-G]/.test(fr.res) && fr.use, fr);
  await p.click('#frUse'); await p.waitForTimeout(500);
  const used = await q(() => document.querySelector('#sngRangeNames').textContent);
  yes('“Use this range” puts it on the wheels', /A2 – C5|A♭2|B♭2/.test(used) || /^[A-G]/.test(used) && !/G2 – /.test(used), used);

  await p.click('#sngGo'); await p.waitForTimeout(1200);
  const kept = await q(() => ({lo: sngState().profile.lowNote, hi: sngState().profile.highNote, loM: sngMidiOf(sngState().profile.lowNote), hiM: sngMidiOf(sngState().profile.highNote), jz: jazzState().settings.vocalRange, onb: sngState().profile.onboarded}));
  yes('and the studio opens with it, the Jazz Studio following', kept.onb && kept.lo && kept.jz && kept.jz.lowMidi === kept.loM && kept.jz.highMidi === kept.hiM, kept);

  console.log('\n4. changing it later');
  yes('a chip under the title shows it, on every page', /🎙/.test(await q(() => document.querySelector('[data-sngrange]').textContent)));
  await p.click('[data-sngrange]'); await p.waitForTimeout(500);
  yes('and opens the same wheels', (await p.$$('.modal .sng-wheel-list')).length === 2);
  await p.click('#frNo').catch(() => {}); await q(() => document.querySelectorAll('.overlay').forEach(o => o.remove()));

  console.log('\n5. the metronome is a bar, not a desk');
  const where = await q(async () => { const res = {}; for(const h of ['#/songwriting', '#/songwriting/path', '#/songwriting/studio', '#/songwriting/tool/chord-lab', '#/songwriting/tool/song-desk', '#/songwriting/seeds']){ location.hash = h; await new Promise(r => setTimeout(r, 700)); res[h] = !!document.querySelector('#sngMetBar'); } return res; });
  yes('it sits under the tabs on every page of the studio', Object.values(where).every(Boolean), where);
  yes('and is no longer a desk of its own', !(await q(() => SNG_TOOLS.some(t => t.id === 'metronome'))));
  await q(() => { location.hash = '#/songwriting/tool/chord-lab'; }); await p.waitForTimeout(600);
  await p.click('[data-met="go"]'); await p.waitForTimeout(600);
  yes('it starts from there', await q(() => !!_sngMetro && document.querySelector('[data-met="go"]').textContent === '■'));
  await p.click('[data-met="up"]'); await p.click('[data-met="up"]');
  yes('the tempo changes while it plays', await q(() => sngMetBpm() === 92));
  await q(() => { location.hash = '#/songwriting/seeds'; }); await p.waitForTimeout(700);
  yes('it keeps going as you move to another page of the studio', await q(() => !!_sngMetro && document.querySelector('#sngMetBar.on')));
  await q(() => { location.hash = '#/today'; }); await p.waitForTimeout(500);
  yes('and stops when you leave the studio', await q(() => !_sngMetro));
  const old = await q(async () => { location.hash = '#/songwriting/tool/metronome'; await new Promise(r => setTimeout(r, 900)); return {bar: !!document.querySelector('#sngMetBar'), gone: /That tool is not here/.test((document.querySelector('.sng-body') || {textContent: ''}).textContent), hash: location.hash}; });
  yes('an old link to the metronome desk lands in the studio', old.bar && !old.gone, old);
  yes('no page errors', !errs.length, errs);
  await b.close(); process.exit(bad ? 1 : 0);
})();
