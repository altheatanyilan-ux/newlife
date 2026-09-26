/* smoke249 — a violin and a cello that sound played, not synthesised.

   The claims.

   THE RECORDINGS. A violin part plays the VSCO-2 solo violin and a cello
   part the Karoryfer x Bigcat solo cello (a real solo cello, where it used
   to be a cello section): both CC0, credited in vendor/strings/LICENSE.md,
   carried in the page at 32 kHz, notes up to seven seconds long, every note
   the libraries recorded, two dynamic layers.

   THE LOUDNESS picks the recording: up to mezzo-forte the soft one, from
   forte the loud one — a quiet passage is a quiet bow, not a loud one
   turned down. At mezzo-forte the strings are gentler than they were.

   THE BOW. A note swells in over tens of milliseconds rather than starting
   at full strength; the cello, recorded without vibrato, is given one,
   after the note has begun; a note comes off over a third of a second, into
   a quiet room, rather than stopping dead.

   Run: NODE_PATH=node_modules node smoke249.js */
const {chromium} = require('playwright');
const path = require('path'), fs = require('fs');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await b.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);

  console.log('\n1. the recordings');
  const lic = fs.readFileSync(path.join(__dirname, 'vendor', 'strings', 'LICENSE.md'), 'utf8');
  const R = await p.evaluate(async () => {
    await instrumentsLoad(['violin', 'cello']);
    const m = orchSrc().manifest.instruments, v = m['violin-hq'], c = m['cello-solo'];
    return {violin: orchIds(INSTRUMENTS.violin), cello: orchIds(INSTRUMENTS.cello),
      vn: v.notes.length, cn: c.notes.length, layers: [v.layers, c.layers], sr: [v.sampleRate, c.sampleRate], src: [v.source, c.source],
      longest: +Math.max(..._orch.sets['violin-hq'].notes.map(n => n.buf.duration)).toFixed(1), celloVib: _orch.sets['cello-solo'].vibrato};
  });
  is('a violin part plays the solo violin; a cello part the solo cello', [R.violin, R.cello], [['violin-hq'], ['cello-solo']]);
  yes('  every note the libraries recorded, two dynamic layers each, 32 kHz', R.vn >= 28 && R.cn >= 30 && R.layers.join() === '2,2' && R.sr.join() === '32000,32000', R);
  yes('  notes long enough for a slow bow (six seconds before any looping)', R.longest >= 6, R.longest);
  yes('  both CC0 and credited', /CC0/.test(lic) && /VSCO-2/.test(R.src[0]) && /Karoryfer/.test(R.src[1]) && /Karoryfer/.test(lic) && /VSCO-2/.test(lic), R.src);
  is('  the cello was recorded straight, so it is the one given a vibrato', R.celloVib, false);

  console.log('\n2. the loudness picks the recording');
  const L = await p.evaluate(() => [0.36, 0.48, 0.6, 0.74, 0.86].map(v => orchPick(['cello-solo'], 50, v).layer));
  is('p, mp and mf play the soft recording; f and ff the loud one', L, [0, 0, 0, 1, 1]);

  console.log('\n3. the bow');
  const B = await p.evaluate(async () => {
    const sr = 44100;
    const render = async (id, m, dur, vel) => { const ctx = new OfflineAudioContext(1, sr * (dur + 1.5), sr);
      instrumentNote(ctx, ctx.destination, id, m, 0.05, dur, vel, dur, 1); return (await ctx.startRendering()).getChannelData(0); };
    const rms = (d, a, z) => { let s = 0; const i0 = Math.round(a * sr), i1 = Math.round(z * sr); for(let i = i0; i < i1; i++) s += d[i] * d[i]; return Math.sqrt(s / (i1 - i0)); };
    const peak = (d, a, z) => { let m = 0; for(let i = Math.round(a * sr); i < Math.round(z * sr); i++) m = Math.max(m, Math.abs(d[i])); return m; };
    /* pitch in cents over time, by zero crossings of the low-passed signal */
    const track = (d, f0) => { const out = []; const w = Math.round(0.05 * sr);
      let y = 0; const lp = new Float32Array(d.length); const a = 1 - Math.exp(-2 * Math.PI * f0 * 1.6 / sr);
      for(let i = 0; i < d.length; i++){ y += a * (d[i] - y); lp[i] = y; }
      for(let s0 = Math.round(0.1 * sr); s0 + w < lp.length && s0 < 2.6 * sr; s0 += w){ const zc = []; for(let i = s0 + 1; i < s0 + w; i++) if(lp[i - 1] < 0 && lp[i] >= 0) zc.push(i);
        if(zc.length > 2) out.push({t: s0 / sr, c: 1200 * Math.log2((sr * (zc.length - 1) / (zc[zc.length - 1] - zc[0])) / f0)}); }
      return out; };
    const f0 = 440 * Math.pow(2, (48 - 69) / 12), sd = xs => { const m = xs.reduce((s, x) => s + x, 0) / xs.length; return Math.sqrt(xs.reduce((s, x) => s + (x - m) * (x - m), 0) / xs.length); };
    const wobble = async on => { _orch.sets['cello-solo'].vibrato = !on; const d = await render('cello', 48, 3, 0.6); _orch.sets['cello-solo'].vibrato = false;
      return track(d, f0).filter(x => x.t > 1.0 && x.t < 2.6).map(x => x.c); };
    /* the same note with the added vibrato and without it: the bow's own
       wobble is in both, the vibrato only in one */
    const late = await wobble(true), plain = await wobble(false);
    const violin = await render('violin', 69, 2, 0.6);
    return {onset: peak(violin, 0.05, 0.057) / peak(violin, 0.3, 1.5), vibPlain: +sd(plain).toFixed(1), vibLate: +sd(late).toFixed(1),
      held: rms(violin, 1.2, 1.9), after: rms(violin, 2.05 + 0.7, 2.05 + 1.1), justAfter: rms(violin, 2.05 + 0.05, 2.05 + 0.15)};
  });
  yes('a note swells in: in its first 7 ms it is well under half its strength', B.onset < 0.5, B.onset.toFixed(2));
  yes('the cello is given a vibrato: its pitch swings wider than the same note played straight', B.vibLate > B.vibPlain + 2.5, [B.vibPlain, B.vibLate]);
  yes('the bow comes off: still sounding just after the note, gone (but for the room) a moment later', B.justAfter > B.held * 0.1 && B.after < B.held * 0.12, B);

  console.log('\n4. gentler than it was');
  /* The thin strings this replaced (a single loud recording, 22 kHz) are no
     longer carried — the orchestra plays from vendor/orchestra-hq now — so
     what they gave is kept as a number: the same phrase, at mezzo-forte,
     peaked at 0.794 on the build before (measured when they were taken out). */
  const WAS = 0.794;
  const G = await p.evaluate(async () => {
    const sr = 44100, ctx = new OfflineAudioContext(2, sr * 6, sr);
    [[76, 0.2, 1.2], [74, 1.4, 0.6], [72, 2.0, 1.8]].forEach(([m, t, d]) => instrumentNote(ctx, ctx.destination, 'violin', m, t, d, 0.6, null, 1));
    [[48, 0.2, 2.4], [43, 2.6, 2.4]].forEach(([m, t, d]) => instrumentNote(ctx, ctx.destination, 'cello', m, t, d, 0.6, null, 1));
    const d = (await ctx.startRendering()).getChannelData(0); let pk = 0; for(let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i]));
    return +pk.toFixed(3);
  });
  yes('at mezzo-forte the loudest moment is lower than with the old strings', G < WAS, {now: G, was: WAS});

  is('no page errors', errs, []);
  console.log(`\n${bad ? bad + ' FAILED' : 'all good'}`);
  await b.close(); process.exit(bad ? 1 : 0);
})();
