#!/usr/bin/env node
/* ============================================================
   THE ORCHESTRA FOR THE PAGE — vendor/orchestra thinned to what the site
   carries (vendor/orchestra-lite), for the score player and the bands.

   vendor/orchestra (tools/fetch-orchestra.js) is the full CC0 set the
   sync harness renders with: two dynamic layers, round robins, about
   20 MB. The page does not need all of that to sound like an orchestra.
   Kept here: one layer (the louder, which carries the instrument's
   character), a note every three to four semitones, mono, 22 050 Hz, 40
   kb/s, cut to 3 s (a sustained note is looped from 0.9 s, as the GM set
   is, so 3 s is all a held note needs), with a short fade. Drums and
   percussion: two hits each (a soft and a hard one).
   Staccato and variant takes, and the piano (the page has the grand), are
   left out.

   Run: node tools/build-orchestra-lite.js   (needs an ffmpeg: imageio-ffmpeg's, or one on the PATH)
   ============================================================ */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..'), SRC = path.join(ROOT, 'vendor', 'orchestra'), OUT = path.join(ROOT, 'vendor', 'orchestra-lite');
let FF = 'ffmpeg';
try { FF = cp.execSync('python3 -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())"', {stdio: ['ignore', 'pipe', 'ignore']}).toString().trim() || FF; } catch(e){}
const man = JSON.parse(fs.readFileSync(path.join(SRC, 'instruments.json'), 'utf8'));
const SKIP = /(-stac|-vib|-harmon|-bell|-swirly|-pedal|-ghost|^piano$|-spic)$/;
/* held notes: bowed, blown, the organ */
const SUSTAIN = new Set(['violins', 'violin-solo', 'violas', 'celli', 'basses', 'flute', 'piccolo', 'oboe', 'clarinet', 'bassoon', 'horn', 'trumpet', 'trombone', 'tuba', 'tenor-sax', 'organ']);
const out = {version: 1, sampleRate: 22050, instruments: {}};
fs.rmSync(OUT, {recursive: true, force: true}); fs.mkdirSync(OUT, {recursive: true});
let bytes = 0, files = 0;
const enc = (from, to, secs) => {
  cp.execFileSync(FF, ['-v', 'error', '-y', '-i', from, '-ac', '1', '-ar', '22050', '-t', String(secs), '-af', `afade=t=out:st=${Math.max(0.05, secs - 0.12)}:d=0.12`,
    '-codec:a', 'libmp3lame', '-b:a', '40k', to]);
  bytes += fs.statSync(to).size; files++;
};
for(const [id, v] of Object.entries(man.instruments)){
  if(SKIP.test(id)) continue;
  fs.mkdirSync(path.join(OUT, id), {recursive: true});
  if(v.kind === 'hits'){
    const layers = [...new Set(v.hits.map(h => h.layer))].sort((a, b) => a - b);
    const pick = [layers[0], layers[layers.length - 1]].filter((x, i, a) => a.indexOf(x) === i);
    const hits = pick.map((L, i) => { const h = v.hits.find(x => x.layer === L && (x.rr || 0) === 0) || v.hits.find(x => x.layer === L);
      const to = path.join(OUT, id, `${i}.mp3`); enc(path.join(SRC, h.file), to, id.includes('cymbal') || id === 'crash' || id === 'ride' ? 3 : 1.6); return {file: `${id}/${i}.mp3`, vel: i ? 1 : 0.5}; });
    out.instruments[id] = {name: v.name, family: v.family, kind: 'hits', source: v.source, hits};
    continue;
  }
  const layers = [...new Set(v.notes.map(n => n.layer))];
  const L = Math.max(...layers);
  const byMidi = new Map(); v.notes.filter(n => n.layer === L).forEach(n => { if(!byMidi.has(n.midi)) byMidi.set(n.midi, n); });
  v.notes.forEach(n => { if(!byMidi.has(n.midi)) byMidi.set(n.midi, n); });
  const all = [...byMidi.keys()].sort((a, b) => a - b), keep = [];
  all.forEach(m => { if(!keep.length || m - keep[keep.length - 1] >= 3 || m === all[all.length - 1]) keep.push(m); });
  const notes = keep.map(m => { const n = byMidi.get(m); const to = path.join(OUT, id, `${m}.mp3`);
    enc(path.join(SRC, n.file), to, SUSTAIN.has(id) ? 3 : 2.4); return {midi: m, tune: n.tune || 0, file: `${id}/${m}.mp3`}; });
  out.instruments[id] = {name: v.name, family: v.family, kind: 'pitched', source: v.source, sustain: SUSTAIN.has(id), notes, range: [notes[0].midi, notes[notes.length - 1].midi]};
  process.stdout.write(`${id} ${notes.length}  `);
}
fs.writeFileSync(path.join(OUT, 'instruments.json'), JSON.stringify(out, null, 1));
fs.copyFileSync(path.join(SRC, 'LICENSE.md'), path.join(OUT, 'LICENSE.md'));
console.log(`\n${Object.keys(out.instruments).length} instruments, ${files} files, ${(bytes / 1048576).toFixed(2)} MB in vendor/orchestra-lite`);
