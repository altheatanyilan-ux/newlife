#!/usr/bin/env node
/* ============================================================
   THE ORCHESTRA AND THE BAND — real recorded instruments

   The recording-sync harness (test-sync-accuracy.js) plays the test
   tunes on real instruments, not synthesis: every note it plays is a
   recording of that instrument playing that note. This fetches them.

   All of it is public domain (CC0 1.0), from five libraries:
     VSCO-2 Community Edition — Versilian Studios: the orchestra's
       strings, woodwinds, brass, harp, timpani, organ
     VCSL — Versilian Community Sample Library: tenor saxophone, the
       Steinway B grand, vibraphone, glockenspiel, xylophone, marimba,
       tubular bells, harpsichord, triangle, tambourine
     Virtuosity Drums — Versilian Studios: the jazz kit (ride, hi-hat,
       kick, snare, cross-stick, crash), room microphones
     Swirly Drums — Karoryfer Samples: brushes (the stir), a second ride
     Rubner double bass — D. Smolken: jazz pizzicato bass
   See vendor/orchestra/LICENSE.md.

   Only what the harness plays is kept: pitched instruments every minor
   third across the range they are played in (the renderer moves a
   sample by at most a semitone and a half), one or two dynamic layers,
   trimmed to how long a note is ever held, mono MP3. Every pitched
   sample's pitch is MEASURED (YIN), not trusted from its file name: the
   libraries name octaves differently, and a sample a few cents off is
   corrected when it is played.

   Needs git and ffmpeg (any ffmpeg; `pip install imageio-ffmpeg` gives
   one). Downloads only the chosen files. Run by hand; the output is
   committed:
     node tools/fetch-orchestra.js [--src DIR] [--only id,id]
   ============================================================ */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
/* --set strings: the solo violin and cello the site's player uses, at a
   higher quality than the rest (vendor/strings) */
const SET = (process.argv.indexOf('--set') > 0 ? process.argv[process.argv.indexOf('--set') + 1] : 'orchestra');
const OUT = path.join(ROOT, 'vendor', SET === 'strings' ? 'strings' : 'orchestra');
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const SRC = arg('--src') || process.env.SAMPLE_SOURCES || '/home/user';
const ONLY = (arg('--only') || '').split(',').filter(Boolean);
const SR = 44100;

const REPOS = {
  vsco: {url: 'https://github.com/sgossner/VSCO-2-CE', dir: 'sgossner/vsco-2-ce', credit: 'VSCO-2 Community Edition, Versilian Studios'},
  vcsl: {url: 'https://github.com/sgossner/VCSL', dir: 'sgossner/vcsl', credit: 'Versilian Community Sample Library (VCSL), Versilian Studios'},
  virt: {url: 'https://github.com/sfzinstruments/virtuosity_drums', dir: 'sfzinstruments/virtuosity_drums', credit: 'Virtuosity Drums, Versilian Studios'},
  swirly: {url: 'https://github.com/sfzinstruments/karoryfer.swirly-drums', dir: 'sfzinstruments/karoryfer.swirly-drums', credit: 'Swirly Drums, Karoryfer Samples'},
  smolken: {url: 'https://github.com/sfzinstruments/dsmolken.double-bass', dir: 'sfzinstruments/dsmolken.double-bass', credit: '1958 Otto Rubner double bass, D. Smolken'},
  kbcello: {url: 'https://github.com/sfzinstruments/karoryfer-bigcat.cello', dir: 'sfzinstruments/karoryfer-bigcat.cello', credit: 'Karoryfer Samples and Bigcat Instruments open source cello'},
};

/* id, what it is, where, which files; range is the sounding MIDI range kept;
   layers: how many dynamic layers; dur: the longest a note is kept (s) */
const P = (id, name, family, repo, dir, o = {}) => Object.assign({id, name, family, repo, dir, kind: 'pitched', layers: 1, dur: 3.2, range: [0, 127]}, o);
const H = (id, name, family, repo, dir, o = {}) => Object.assign({id, name, family, repo, dir, kind: 'hits', layers: 2, rr: 3, dur: 1.2}, o);
/* The two solo strings the Repertoire player uses. Each note as long as a
   slow bow holds it, at 32 kHz rather than 22 (the brilliance of a violin
   is above 11 kHz), two dynamic layers, every note the library has. The
   violin is VSCO-2's solo violin, recorded with vibrato; the cello is the
   Karoryfer x Bigcat solo cello (a real solo cello, not a section),
   recorded without vibrato so the player can add its own. */
const STRING_SPECS = [
  P('violin-hq', 'Violin (solo)', 'strings', 'vsco', 'Strings/Solo Violin/Arco Vib/', {layers: 2, dur: 7, range: [55, 100], sr: 32000, kbps: 96, every: true}),
  P('cello-solo', 'Cello (solo)', 'strings', 'kbcello', 'Samples/sus/', {inc: /_d\.wav$/, layers: 2, dur: 4.6, range: [36, 84], sr: 32000, kbps: 96, every: true, vibrato: false}),
];
const SPECS = SET === 'strings' ? STRING_SPECS : [
  /* the jazz band */
  P('bass-pizz', 'Double bass, pizzicato', 'band', 'smolken', 'pizz/', {inc: /\/pizz_[a-g]#?\d_[fm][a-d]\.wav$/i, layers: 2, dur: 2.4, range: [28, 62]}),
  P('piano', 'Grand piano (Steinway B)', 'band', 'vcsl', 'Chordophones/Zithers/Grand Piano, Steinway B/NoSus/', {inc: /_Close_/, layers: 2, dur: 5, range: [33, 99]}),
  P('tenor-sax', 'Tenor saxophone', 'band', 'vcsl', 'Aerophones/Reed Aerophones/Tenor Saxophone/Non-Vibrato/', {layers: 2, dur: 2.6, range: [44, 77]}),
  P('tenor-sax-vib', 'Tenor saxophone, vibrato', 'band', 'vcsl', 'Aerophones/Reed Aerophones/Tenor Saxophone/Vibrato/', {dur: 3.2, range: [44, 77]}),
  P('tenor-sax-stac', 'Tenor saxophone, staccato', 'band', 'vcsl', 'Aerophones/Reed Aerophones/Tenor Saxophone/Staccato/', {dur: 0.8, range: [44, 77]}),
  P('trumpet', 'Trumpet', 'brass', 'vsco', 'Brass/Trumpet/sus/', {layers: 2, dur: 2.6, range: [54, 84]}),
  P('trumpet-stac', 'Trumpet, staccato', 'brass', 'vsco', 'Brass/Trumpet/stac/', {dur: 0.7, range: [54, 84]}),
  P('trumpet-harmon', 'Trumpet, harmon mute', 'brass', 'vsco', 'Brass/Trumpet/harmonM-sus/', {dur: 2.6, range: [54, 82]}),
  P('trombone', 'Tenor trombone', 'brass', 'vsco', 'Brass/Tenor Trombone/sus/', {layers: 2, dur: 2.6, range: [40, 72]}),
  P('trombone-stac', 'Tenor trombone, staccato', 'brass', 'vsco', 'Brass/Tenor Trombone/stac/', {dur: 0.7, range: [40, 72]}),
  P('vibraphone', 'Vibraphone', 'band', 'vcsl', 'Idiophones/Struck Idiophones/Vibraphone/Soft Mallets/', {layers: 2, dur: 3.5, range: [53, 89]}),
  /* the orchestra: strings */
  P('violins', 'Violins (section)', 'strings', 'vsco', 'Strings/Violin Section/susVib/', {layers: 2, dur: 3.2, range: [55, 96]}),
  P('violins-pizz', 'Violins, pizzicato', 'strings', 'vsco', 'Strings/Violin Section/Pizz/', {dur: 1.0, range: [55, 91]}),
  P('violins-spic', 'Violins, spiccato', 'strings', 'vsco', 'Strings/Violin Section/Spic/', {dur: 0.6, range: [55, 91]}),
  P('violin-solo', 'Violin (solo)', 'strings', 'vsco', 'Strings/Solo Violin/Arco Vib/', {layers: 2, dur: 3.2, range: [55, 96]}),
  P('violas', 'Violas (section)', 'strings', 'vsco', 'Strings/Viola Section/susvib/', {layers: 2, dur: 3.2, range: [48, 84]}),
  P('violas-pizz', 'Violas, pizzicato', 'strings', 'vsco', 'Strings/Viola Section/pizz/', {dur: 1.0, range: [48, 81]}),
  P('celli', 'Cellos (section)', 'strings', 'vsco', 'Strings/Cello Section/susvib/', {layers: 2, dur: 3.2, range: [36, 76]}),
  P('celli-pizz', 'Cellos, pizzicato', 'strings', 'vsco', 'Strings/Cello Section/pizzT/', {dur: 1.2, range: [36, 72]}),
  P('basses', 'Double basses (arco)', 'strings', 'vsco', 'Strings/Solo Contrabass/SusVib/', {dur: 3.2, range: [28, 60]}),
  P('harp', 'Harp', 'strings', 'vsco', 'Strings/Harp/', {dur: 3, range: [24, 103]}),
  /* woodwinds */
  P('piccolo', 'Piccolo', 'woodwinds', 'vsco', 'Woodwinds/Piccolo/Sus/', {dur: 2.4, range: [74, 108]}),
  P('flute', 'Flute', 'woodwinds', 'vsco', 'Woodwinds/Flute/susvib/', {layers: 2, dur: 3, range: [60, 96]}),
  P('flute-stac', 'Flute, staccato', 'woodwinds', 'vsco', 'Woodwinds/Flute/stac/', {dur: 0.6, range: [60, 96]}),
  P('oboe', 'Oboe', 'woodwinds', 'vsco', 'Woodwinds/Oboe/Vib/', {layers: 2, dur: 3, range: [58, 91]}),
  P('oboe-stac', 'Oboe, staccato', 'woodwinds', 'vsco', 'Woodwinds/Oboe/Stacc/', {dur: 0.6, range: [58, 91]}),
  P('clarinet', 'Clarinet', 'woodwinds', 'vsco', 'Woodwinds/Clarinet/susLong/', {layers: 2, dur: 3, range: [50, 91]}),
  P('clarinet-stac', 'Clarinet, staccato', 'woodwinds', 'vsco', 'Woodwinds/Clarinet/stac/', {dur: 0.6, range: [50, 91]}),
  P('bassoon', 'Bassoon', 'woodwinds', 'vsco', 'Woodwinds/Bassoon/sus/', {layers: 2, dur: 3, range: [34, 75]}),
  P('bassoon-stac', 'Bassoon, staccato', 'woodwinds', 'vsco', 'Woodwinds/Bassoon/stac/', {dur: 0.6, range: [34, 75]}),
  /* brass */
  P('horn', 'French horn', 'brass', 'vsco', 'Brass/F Horn/sus/', {layers: 2, dur: 3, range: [34, 77]}),
  P('horn-stac', 'French horn, staccato', 'brass', 'vsco', 'Brass/F Horn/stac/', {dur: 0.7, range: [34, 77]}),
  P('tuba', 'Tuba', 'brass', 'vsco', 'Brass/Tuba/sus/', {dur: 3, range: [26, 65]}),
  P('tuba-stac', 'Tuba, staccato', 'brass', 'vsco', 'Brass/Tuba/stac/', {dur: 0.7, range: [26, 65]}),
  /* keyboards and tuned percussion */
  P('organ', 'Pipe organ', 'keys', 'vsco', 'Keys/Organ/Loud/', {dur: 3, range: [24, 96], unnamed: true}),
  P('harpsichord', 'Harpsichord', 'keys', 'vcsl', 'Chordophones/Zithers/Harpsichord, Flemish/', {exc: /Releases|Rel_/, dur: 2.5, range: [29, 89]}),
  P('glockenspiel', 'Glockenspiel', 'percussion', 'vcsl', 'Idiophones/Struck Idiophones/Glockenspiel/', {dur: 2, range: [79, 108]}),
  P('xylophone', 'Xylophone', 'percussion', 'vcsl', 'Idiophones/Struck Idiophones/Xylophone/Hard Mallets/', {dur: 1, range: [65, 108]}),
  P('marimba', 'Marimba', 'percussion', 'vcsl', 'Idiophones/Struck Idiophones/Marimba/', {dur: 1.8, range: [45, 96]}),
  P('tubular-bells', 'Tubular bells', 'percussion', 'vcsl', 'Idiophones/Struck Idiophones/Tubular Bells 1/', {dur: 3.5, range: [60, 77]}),
  P('timpani', 'Timpani', 'percussion', 'vsco', 'Percussion/Timpani/', {exc: /Roll/i, dur: 2.5, range: [38, 60], unnamed: true}),
  /* the jazz kit */
  H('ride', 'Ride cymbal', 'drums', 'virt', 'Samples/room/ride/', {inc: /room_ride_ride_/, layers: 3, dur: 2.5}),
  H('ride-bell', 'Ride cymbal, bell', 'drums', 'virt', 'Samples/room/ride/', {inc: /room_ride_bell_/, layers: 2, rr: 2, dur: 2}),
  H('ride-swirly', 'Ride cymbal (second kit)', 'drums', 'swirly', 'Samples/ride/', {exc: /wet/, layers: 3, dur: 2.5}),
  H('hihat-pedal', 'Hi-hat, foot', 'drums', 'virt', 'Samples/room/hh/', {inc: /room_hh_pedal_/, layers: 2, dur: 0.5}),
  H('hihat-closed', 'Hi-hat, closed', 'drums', 'virt', 'Samples/room/hh/', {inc: /room_hh_closed_/, layers: 2, dur: 0.5}),
  H('hihat-open', 'Hi-hat, open', 'drums', 'virt', 'Samples/room/hh/', {inc: /room_hh_open_/, layers: 2, rr: 2, dur: 1.5}),
  H('kick', 'Bass drum (kit)', 'drums', 'virt', 'Samples/room/kick/', {inc: /room_kick_snoff_/, layers: 3, dur: 0.8}),
  H('snare', 'Snare drum', 'drums', 'virt', 'Samples/room/snare/', {inc: /room_snare_center_/, layers: 3, dur: 0.8}),
  H('snare-ghost', 'Snare drum, ghost note', 'drums', 'virt', 'Samples/room/snare/', {inc: /room_snare_offcenter_/, layers: 1, low: true, dur: 0.5}),
  H('cross-stick', 'Cross-stick', 'drums', 'virt', 'Samples/room/snare/', {inc: /room_snare_crossstick_/, layers: 2, dur: 0.5}),
  H('crash', 'Crash cymbal', 'drums', 'virt', 'Samples/room/crash/', {inc: /room_crash_crash_/, layers: 2, rr: 2, dur: 3.5}),
  H('brush-stir', 'Brushes, stirred on the snare', 'drums', 'swirly', 'Samples/snare_stir/', {exc: /wet|skin/, layers: 2, rr: 3, dur: 2.5}),
  H('brush-tap', 'Brushes, snare tap', 'drums', 'swirly', 'Samples/snare_stir/', {inc: /skin/, exc: /wet/, layers: 2, rr: 3, dur: 1.5}),
  /* orchestral percussion */
  H('bass-drum', 'Bass drum (orchestral)', 'percussion', 'vsco', 'Percussion/', {inc: /\/BDrumNewhit_/, layers: 2, rr: 2, dur: 2.5}),
  H('snare-orch', 'Snare drum (orchestral)', 'percussion', 'vsco', 'Percussion/', {inc: /\/Snare2-HitNS_/, layers: 2, rr: 2, dur: 0.8}),
  H('cymbals', 'Clash cymbals', 'percussion', 'vsco', 'Percussion/', {inc: /\/cymbal-crash1_/, layers: 2, rr: 1, dur: 3.5}),
  H('sus-cymbal', 'Suspended cymbal', 'percussion', 'vsco', 'Percussion/', {inc: /\/susCymb1-hitstick_/, layers: 2, rr: 1, dur: 3}),
  H('triangle', 'Triangle', 'percussion', 'vsco', 'Percussion/', {inc: /\/Triangle3-Hit_/, layers: 2, rr: 1, dur: 2.5}),
  H('tambourine', 'Tambourine', 'percussion', 'vcsl', 'Idiophones/Struck Idiophones/Tambourine 1/', {inc: /Hit/, layers: 2, rr: 1, dur: 0.8}),
];

/* ---------- tools ---------- */
function ffmpegPath(){
  const tryRun = p => { try { cp.execFileSync(p, ['-version'], {stdio: 'ignore'}); return p; } catch(e){ return null; } };
  return tryRun('ffmpeg') || (() => { try { return tryRun(cp.execSync('python3 -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())"').toString().trim()); } catch(e){ return null; } })()
    || (() => { throw new Error('ffmpeg is needed: install it, or `pip install imageio-ffmpeg`.'); })();
}
const FF = ffmpegPath();
const git = (dir, args, input) => cp.execFileSync('git', ['-C', dir].concat(args), {input, maxBuffer: 1 << 28, env: Object.assign({}, process.env, {GIT_LFS_SKIP_SMUDGE: '1'})}).toString();
function repoDir(key){
  const r = REPOS[key], d = path.join(SRC, r.dir);
  if(!fs.existsSync(path.join(d, '.git'))){
    fs.mkdirSync(path.dirname(d), {recursive: true});
    console.log(`  cloning ${r.url} (file list only)…`);
    cp.execFileSync('git', ['clone', '--depth', '1', '--filter=blob:none', '--no-checkout', r.url, d], {stdio: 'inherit', env: Object.assign({}, process.env, {GIT_LFS_SKIP_SMUDGE: '1'})});
  }
  return d;
}
const listCache = {};
const listOf = key => listCache[key] || (listCache[key] = git(repoDir(key), ['ls-tree', '-r', 'HEAD', '--name-only']).split('\n').filter(Boolean));
function fetchFiles(key, files){
  const d = repoDir(key), need = files.filter(f => !fs.existsSync(path.join(d, f)));
  if(!need.length) return;
  git(d, ['checkout', 'HEAD', '--pathspec-from-file=-', '--pathspec-file-nul'], Buffer.from(need.join('\0')));
}
function decode(file){
  const out = cp.execFileSync(FF, ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], {maxBuffer: 1 << 28});
  return new Float32Array(out.buffer, out.byteOffset, out.length / 4);
}
function encode(pcm, file, o = {}){
  fs.mkdirSync(path.dirname(file), {recursive: true});
  cp.execFileSync(FF, ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', '-'].concat(o.sr ? ['-ar', String(o.sr)] : [])
    .concat(['-codec:a', 'libmp3lame', '-b:a', (o.kbps || 96) + 'k', file]),
    {input: Buffer.from(pcm.buffer, pcm.byteOffset, pcm.length * 4)});
}

/* ---------- names ---------- */
const PC = {c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11};
function noteOf(name){
  const m = /(?:^|[_\s-])([A-Ga-g])(#|b|s)?(-?\d)(?=[_\s.-]|$)/.exec(name);
  if(!m) return null;
  return 12 * (+m[3] + 1) + PC[m[1].toLowerCase()] + (m[2] === '#' || m[2] === 's' ? 1 : m[2] === 'b' ? -1 : 0);
}
const DYN = {ppp: 1, pp: 2, p: 3, mp: 4, mf: 5, f: 6, ff: 7, fff: 8, quiet: 3, soft: 3, med: 5, medium: 5, loud: 7};
function layerOf(name){
  let m = /_v[l]?(\d+)(?=[_.])/i.exec(name); if(m) return +m[1];
  m = /_dl(\d+)/i.exec(name); if(m) return +m[1];
  m = /_(ppp|pp|p|mp|mf|f|ff|fff)\d*(?=[_.])/.exec(name); if(m) return DYN[m[1]];
  m = /_(quiet|soft|med|medium|loud)(?=[_.])/i.exec(name); if(m) return DYN[m[1].toLowerCase()];
  m = /_([fm])[a-d]\.wav$/i.exec(name); if(m) return m[1] === 'f' ? 6 : 4;
  return 5;
}
function rrOf(name){
  let m = /_rr(\d+)/i.exec(name); if(m) return +m[1];
  m = /_var(\d+)/i.exec(name); if(m) return +m[1];
  m = /_[fm]([a-d])\.wav$/i.exec(name); if(m) return 'abcd'.indexOf(m[1]) + 1;
  m = /_(\d+)(?:_\w+)?\.(wav|flac)$/i.exec(name); if(m) return +m[1];
  return 1;
}

/* ---------- pitch: YIN on the steady part ---------- */
function yin(x, sr, len, long){
  /* to about 11 kHz, a few frames inside the note, the median; then each
     frame's period refined at the full rate, where a high note's period
     is only a few samples long at 11 kHz */
  const f = Math.max(1, Math.round(sr / 11025)), y = [];
  for(let i = 0; i + f <= x.length; i += f){ let s = 0; for(let k = 0; k < f; k++) s += x[i + k]; y.push(s / f); }
  const rs = sr / f, W = 1024, tmax = Math.min(W, Math.floor(rs / 26)), tmin = Math.floor(rs / 4200);
  const est = [];
  const audible = Math.max(0.12, (len || x.length) / sr);
  /* a note played with vibrato swings ±20–30 cents, so four frames can
     land anywhere on the swing: for the long solo strings, the median of
     a frame every 50 ms across the steady part */
  const places = long ? Array.from({length: 60}, (_, i) => 0.4 + i * 0.05).filter(t => t < Math.min(3.6, audible * 0.85))
    : [0.15, 0.3, 0.45, 0.6].map(p => Math.min(0.7, Math.max(0.04, p * audible)));
  for(const at of places){
    const o = Math.floor(at * rs);
    if(o + W + tmax >= y.length) continue;
    let e = 0; for(let i = 0; i < W; i++) e += y[o + i] * y[o + i];
    if(e < 1e-6) continue;
    const d = new Float64Array(tmax + 1);
    for(let t = 1; t <= tmax; t++){ let s = 0; for(let i = 0; i < W; i++){ const v = y[o + i] - y[o + i + t]; s += v * v; } d[t] = s; }
    let run = 0; const c = new Float64Array(tmax + 1); c[0] = 1;
    for(let t = 1; t <= tmax; t++){ run += d[t]; c[t] = d[t] * t / (run || 1); }
    let T = -1;
    for(let t = Math.max(2, tmin); t < tmax; t++) if(c[t] < 0.15 && c[t] <= c[t - 1] && c[t] <= c[t + 1]){ T = t; break; }
    if(T < 0){ let b = Infinity; for(let t = Math.max(2, tmin); t < tmax; t++) if(c[t] < b){ b = c[t]; T = t; } if(b > 0.4) continue; }
    /* the full-rate refinement round f·T */
    const o2 = Math.floor(at * sr), W2 = Math.min(4096, Math.max(1024, 4 * T * f)), lo = Math.max(2, f * T - 2 * f), hi = f * T + 2 * f;
    let per = null;
    if(o2 + W2 + hi + 1 < x.length){
      const dd = t => { let s = 0; for(let i = 0; i < W2; i++){ const v = x[o2 + i] - x[o2 + i + t]; s += v * v; } return s; };
      let bt = lo, bv = Infinity; const vals = {};
      for(let t = lo - 1; t <= hi + 1; t++){ vals[t] = dd(t); if(t >= lo && t <= hi && vals[t] < bv){ bv = vals[t]; bt = t; } }
      const a = vals[bt - 1], b = vals[bt], g = vals[bt + 1], den = a - 2 * b + g;
      per = bt + (den ? 0.5 * (a - g) / den : 0);
    }
    if(per == null){ const a = c[T - 1], b = c[T], g = c[T + 1], den = a - 2 * b + g; per = f * (T + (den ? 0.5 * (a - g) / den : 0)); }
    est.push(69 + 12 * Math.log2(sr / per / 440));
  }
  if(!est.length) return null;
  est.sort((p, q) => p - q);
  return est[est.length >> 1];
}

/* the sample from its first sound */
function fromOnset(x){
  let pk = 0; for(let i = 0; i < x.length; i++) pk = Math.max(pk, Math.abs(x[i]));
  const th = pk * Math.pow(10, -45 / 20); let s = 0; while(s < x.length && Math.abs(x[s]) < th) s++;
  return x.subarray(s);
}
/* how long the note sounds before it falls 40 dB */
function audibleLength(x){
  let pk = 0; for(let i = 0; i < x.length; i++) pk = Math.max(pk, Math.abs(x[i]));
  const th = pk / 100; let s = 0; while(s < x.length && Math.abs(x[s]) < th) s++;
  let e = x.length - 1; while(e > s && Math.abs(x[e]) < th) e--;
  return Math.max(0, e - s);
}
/* ---------- trim ---------- */
function prepare(x, dur){
  let pk = 0; for(let i = 0; i < x.length; i++) pk = Math.max(pk, Math.abs(x[i]));
  const th = pk * Math.pow(10, -45 / 20);
  let s = 0; while(s < x.length && Math.abs(x[s]) < th) s++;
  s = Math.max(0, s - Math.round(0.004 * SR));
  const n = Math.min(x.length - s, Math.round(dur * SR));
  const y = x.slice(s, s + n);
  const fade = Math.min(Math.round(0.25 * SR), Math.round(n * 0.2));
  for(let i = 0; i < fade; i++) y[n - 1 - i] *= i / fade;
  return y;
}

/* ---------- choosing ---------- */
function pickLayers(all, k, low){
  const ls = [...new Set(all)].sort((a, b) => a - b);
  if(low) return ls.slice(0, 1);
  if(ls.length <= k) return ls;
  if(k === 1) return [ls[Math.round((ls.length - 1) * 0.6)]];
  if(k === 2) return [ls[Math.round((ls.length - 1) * 0.35)], ls[ls.length - 1]];
  return [ls[Math.round((ls.length - 1) * 0.2)], ls[Math.round((ls.length - 1) * 0.55)], ls[ls.length - 1]];
}

function build(spec){
  const files = listOf(spec.repo).filter(f => f.startsWith(spec.dir) && /\.(wav|flac)$/i.test(f)
    && (!spec.inc || spec.inc.test(f)) && (!spec.exc || !spec.exc.test(f)));
  if(!files.length) throw new Error(`${spec.id}: no files under ${spec.dir}`);
  const rows = files.map(f => ({f, name: path.basename(f), layer: layerOf(path.basename(f)), rr: rrOf(path.basename(f)), note: spec.kind === 'pitched' && !spec.unnamed ? noteOf(path.basename(f)) : null}));
  let chosen;
  if(spec.kind === 'hits'){
    const layers = pickLayers(rows.map(r => r.layer), spec.layers, spec.low);
    chosen = [];
    layers.forEach((L, li) => { const rs = rows.filter(r => r.layer === L).sort((a, b) => a.rr - b.rr).slice(0, spec.rr); rs.forEach((r, k) => chosen.push(Object.assign(r, {li, k}))); });
  } else {
    /* one round robin, the layers wanted, then the notes */
    const byNote = new Map();
    rows.forEach(r => { const key = spec.unnamed ? r.name : r.note; if(key == null) return;
      if(!byNote.has(key)) byNote.set(key, []); byNote.get(key).push(r); });
    const layers = pickLayers(rows.map(r => r.layer), spec.layers);
    chosen = [];
    byNote.forEach(rs => layers.forEach((L, li) => {
      const cands = rs.filter(r => r.layer === L).sort((a, b) => a.rr - b.rr);
      const r = cands[0] || rs.filter(x => Math.abs(x.layer - L) <= 1).sort((a, b) => Math.abs(a.layer - L) - Math.abs(b.layer - L) || a.rr - b.rr)[0];
      if(r && !chosen.includes(r)) chosen.push(Object.assign({}, r, {li}));
    }));
  }
  /* fetch just these */
  fetchFiles(spec.repo, [...new Set(chosen.map(c => c.f))]);
  const d = repoDir(spec.repo);
  chosen.forEach(c => { try { c.pcm = decode(path.join(d, c.f)); } catch(e){ c.pcm = null; console.log(`    (skipped ${c.name}: the library's file cannot be read)`); } });
  chosen = chosen.filter(c => c.pcm && c.pcm.length > 100);
  if(spec.kind === 'pitched'){
    /* the octave the library names its notes in: the offset most samples agree on */
    chosen.forEach(c => { const x = fromOnset(c.pcm); c.measured = yin(x, SR, audibleLength(x), !!spec.every); });
    let shift = 0;
    if(!spec.unnamed){
      const votes = {};
      chosen.forEach(c => { if(c.measured == null || c.note == null) return; const o = Math.round((c.measured - c.note) / 12) * 12; votes[o] = (votes[o] || 0) + 1; });
      shift = +Object.keys(votes).sort((a, b) => votes[b] - votes[a])[0] || 0;
    }
    chosen.forEach(c => {
      if(spec.unnamed){ if(c.measured == null) { c.midi = null; return; } c.midi = Math.round(c.measured); c.tune = Math.round((c.measured - c.midi) * 100); return; }
      c.midi = c.note + shift;
      const dev = c.measured == null ? 0 : (c.measured - c.midi) * 100;
      /* a measurement an octave or more away is the detector's mistake, not the sample's */
      c.tune = Math.abs(dev) <= 45 ? Math.round(dev) : 0;
      c.pitchNote = Math.abs(dev) <= 45 ? 'measured' : c.measured == null ? 'unmeasured' : 'name';
    });
    chosen = chosen.filter(c => c.midi != null && c.midi >= spec.range[0] - 2 && c.midi <= spec.range[1] + 2);
    /* every minor third: for each target, the nearest sample, per layer
       (or, for the solo strings, every note the library recorded) */
    const keep = [];
    if(spec.every){ chosen = chosen.filter(c => c.midi >= spec.range[0] - 2 && c.midi <= spec.range[1] + 2); }
    else {
    const layersN = Math.max(...chosen.map(c => c.li)) + 1;
    for(let li = 0; li < layersN; li++){
      const cands = chosen.filter(c => c.li === li);
      const got = new Set();
      for(let t = spec.range[0]; t <= spec.range[1] + 2; t += 3){
        const best = cands.filter(c => Math.abs(c.midi - t) <= 1).sort((a, b) => Math.abs(a.midi - t) - Math.abs(b.midi - t))[0];
        if(best && !got.has(best)){ got.add(best); keep.push(best); }
      }
      /* where the library is sparser than a minor third, everything it has */
      cands.forEach(c => { if(!got.has(c) && !cands.some(o => got.has(o) && Math.abs(o.midi - c.midi) <= 2)){ got.add(c); keep.push(c); } });
    }
    chosen = keep;
    }
  }
  /* trim, one gain for the instrument so its layers keep their difference */
  chosen.forEach(c => { c.pcm = prepare(c.pcm, spec.dur); });
  let pk = 0; chosen.forEach(c => { for(let i = 0; i < c.pcm.length; i++) pk = Math.max(pk, Math.abs(c.pcm[i])); });
  const g = pk > 0 ? 0.89 / pk : 1;
  const entry = {name: spec.name, family: spec.family, kind: spec.kind, source: REPOS[spec.repo].credit, layers: 0};
  if(spec.kind === 'pitched'){
    entry.notes = [];
    chosen.sort((a, b) => a.midi - b.midi || a.li - b.li).forEach(c => {
      const file = `${spec.id}/${c.midi}_${c.li}.mp3`;
      for(let i = 0; i < c.pcm.length; i++) c.pcm[i] *= g;
      encode(c.pcm, path.join(OUT, file), spec);
      entry.notes.push({midi: c.midi, layer: c.li, tune: c.tune || 0, file, from: c.name});
    });
    entry.layers = Math.max(...entry.notes.map(n => n.layer)) + 1;
    entry.range = [entry.notes[0].midi, entry.notes[entry.notes.length - 1].midi];
    if(spec.sr){ entry.sampleRate = spec.sr; entry.sustain = true; entry.length = spec.dur; }
    if(spec.vibrato === false) entry.vibrato = false;
  } else {
    entry.hits = [];
    chosen.forEach(c => {
      const file = `${spec.id}/${c.li}_${c.k}.mp3`;
      for(let i = 0; i < c.pcm.length; i++) c.pcm[i] *= g;
      encode(c.pcm, path.join(OUT, file));
      entry.hits.push({layer: c.li, rr: c.k, file, from: c.name});
    });
    entry.layers = Math.max(...entry.hits.map(n => n.layer)) + 1;
  }
  return entry;
}

(function main(){
  fs.mkdirSync(OUT, {recursive: true});
  const idxFile = path.join(OUT, 'instruments.json');
  const index = fs.existsSync(idxFile) && ONLY.length ? JSON.parse(fs.readFileSync(idxFile, 'utf8')) : {version: 1, sampleRate: SR, instruments: {}};
  for(const spec of SPECS){
    if(ONLY.length && !ONLY.includes(spec.id)) continue;
    const t0 = Date.now();
    try {
      fs.rmSync(path.join(OUT, spec.id), {recursive: true, force: true});
      const e = build(spec);
      index.instruments[spec.id] = e;
      const n = e.notes ? e.notes.length : e.hits.length;
      const off = e.notes ? e.notes.filter(x => Math.abs(x.tune) > 10).map(x => x.midi + ':' + x.tune).join(' ') : '';
      console.log(`  ${spec.id.padEnd(16)} ${String(n).padStart(3)} samples${e.range ? `, MIDI ${e.range[0]}–${e.range[1]}` : ''}${off ? ', tuned: ' + off : ''}  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    } catch(err){ console.log(`  ${spec.id.padEnd(16)} FAILED: ${err.message}`); }
  }
  fs.writeFileSync(idxFile, JSON.stringify(index, null, 1));
  const credits = [...new Set(Object.values(index.instruments).map(e => e.source))];
  const used = new Set(Object.values(index.instruments).map(e => e.source));
  fs.writeFileSync(path.join(OUT, 'LICENSE.md'), SET === 'strings' ? `# The solo violin and cello — licences

The Repertoire player's violin and cello. Every sample is a recording of a
real instrument, trimmed, made mono, resampled to 32 kHz and encoded as MP3
by \`node tools/fetch-orchestra.js --set strings\`. All of it is dedicated to
the public domain under **Creative Commons CC0 1.0 Universal** by its makers:

${[...used].map(c => '- ' + c).join('\n')}

Sources:
${Object.values(REPOS).filter(r => used.has(r.credit)).map(r => `- ${r.credit}: ${r.url}`).join('\n')}

CC0 asks for nothing; the credit is given because it is owed.
` : `# The orchestra and the band — licences

Every sample in this folder is a recording of a real instrument, trimmed,
made mono and encoded as MP3 by \`tools/fetch-orchestra.js\`. All of it is
dedicated to the public domain under **Creative Commons CC0 1.0 Universal**
by its makers:

${credits.map(c => '- ' + c).join('\n')}

Sources:
${Object.values(REPOS).map(r => `- ${r.credit}: ${r.url}`).join('\n')}

CC0 asks for nothing; the credit is given because it is owed.
`);
  let bytes = 0; const walk = d => fs.readdirSync(d, {withFileTypes: true}).forEach(e => { const p = path.join(d, e.name); if(e.isDirectory()) walk(p); else bytes += fs.statSync(p).size; });
  walk(OUT);
  console.log(`\n${Object.keys(index.instruments).length} instruments, ${(bytes / 1048576).toFixed(1)} MB in ${path.relative(ROOT, OUT)}`);
})();
