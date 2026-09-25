#!/usr/bin/env node
/* ============================================================
   THE CLASSICAL TEST SET for recording sync (test-sync-accuracy.js)

   What Repertoire is for — classical scores with a recording beside
   them — needs testing on classical playing, with its rubato, its
   pedal, its repeats taken and not taken. Two sources:

   ASAP (Aligned Scores and Performances; Foscarin, McLeod, Rigaux,
   Jacquemard, Sakai, ISMIR 2020): MusicXML scores with REAL
   performances by conservatory pianists (the MAESTRO competition
   recordings, as MIDI: every key's timing and velocity and the pedal),
   every beat and downbeat annotated by hand. The harness plays the MIDI
   on the Steinway samples, so the rubato, dynamics and pedalling are a
   real pianist's and the answer is known. CC BY-NC-SA 4.0.

   OpenScore String Quartets: scores in MusicXML, CC0. The harness
   plays them on the VSCO strings (and orchestrated), with rubato of its
   own making.

   Copies only the files the cases use into tools/sync-testset/, with the
   licences. Run by hand; the output is committed:
     node tools/fetch-sync-testset.js [--src DIR]
   ============================================================ */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'tools', 'sync-testset');
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const SRC = arg('--src') || process.env.SAMPLE_SOURCES || '/home/user';
const REPOS = {
  asap: {url: 'https://github.com/fosfrancesco/asap-dataset', dir: 'fosfrancesco/asap-dataset'},
  osq: {url: 'https://github.com/OpenScore/StringQuartets', dir: 'openscore/stringquartets'},
};
/* id, title, the score, the performance, what it tests */
const ASAP = [
  ['bach-846', 'Bach — Prelude in C major, BWV 846', 'Bach/Prelude/bwv_846', 'Bach/Prelude/bwv_846/Shi05M', 'steady arpeggios; the easiest case'],
  ['chopin-10-3', 'Chopin — Étude Op. 10 No. 3 ("Tristesse")', 'Chopin/Etudes_op_10/3', 'Chopin/Etudes_op_10/3/SunMeiting08', 'lyrical rubato, a stormy middle'],
  ['beethoven-8-2', 'Beethoven — Sonata Op. 13 ("Pathétique"), ii. Adagio cantabile', 'Beethoven/Piano_Sonatas/8-2', 'Beethoven/Piano_Sonatas/8-2/Na06', 'slow, sustained, pedalled'],
  ['haydn-32-1', 'Haydn — Sonata Hob. XVI:44 (No. 32), i. — repeats taken', 'Haydn/Keyboard_Sonatas/32-1', 'Haydn/Keyboard_Sonatas/32-1/SUDBIN01', 'repeats played as written'],
  ['haydn-32-1-norep', 'Haydn — Sonata Hob. XVI:44 (No. 32), i. — repeats skipped', 'Haydn/Keyboard_Sonatas/32-1', 'Haydn/Keyboard_Sonatas/32-1_no_repeat/Goldberg01', 'the score has repeats, the pianist does not take them'],
  ['schubert-90-3', 'Schubert — Impromptu Op. 90 No. 3 in G♭', 'Schubert/Impromptu_op.90_D.899/3', 'Schubert/Impromptu_op.90_D.899/3/Hou06M', 'flowing, pedalled, a long melody over triplets'],
  ['kreisleriana-1', 'Schumann — Kreisleriana Op. 16 No. 1', 'Schumann/Kreisleriana/1', 'Schumann/Kreisleriana/1/Yarden09M', 'fast, agitated, dense'],
  ['mozart-12-1', 'Mozart — Sonata K. 332, i. Allegro', 'Mozart/Piano_Sonatas/12-1', 'Mozart/Piano_Sonatas/12-1/MunA03M', 'Classical allegro, exposition repeat'],
  ['berceuse', 'Chopin — Berceuse Op. 57', 'Chopin/Berceuse_op_57', 'Chopin/Berceuse_op_57/Tario07M', 'one harmony rocking for bars on end: little for the harmony to hold on to'],
  ['debussy-reflets', 'Debussy — Images I, "Reflets dans l\'eau"', 'Debussy/Images_Book_1/1_Reflets_dans_lEau', 'Debussy/Images_Book_1/1_Reflets_dans_lEau/Kleisen11M', 'free tempo, washes of pedal: the hardest case'],
];
const QUARTETS = [
  ['haydn-lark', 'Haydn — String Quartet Op. 64 No. 5 ("The Lark"), i. (opening)', "scores/Haydn,_Joseph/String_Quartet_in_D_major,_Hob.III63,_Op.64_No.5/sq7284122.mxl", {bars: 56}],
];

const git = (dir, args, input) => cp.execFileSync('git', ['-C', dir].concat(args), {input, maxBuffer: 1 << 28, env: Object.assign({}, process.env, {GIT_LFS_SKIP_SMUDGE: '1'})});
function repo(key){
  const r = REPOS[key], d = path.join(SRC, r.dir);
  if(!fs.existsSync(path.join(d, '.git'))){
    fs.mkdirSync(path.dirname(d), {recursive: true});
    cp.execFileSync('git', ['clone', '--depth', '1', '--filter=blob:none', '--no-checkout', r.url, d], {stdio: 'inherit'});
  }
  return d;
}
const copy = (key, from, to) => {
  const d = repo(key);
  const blob = git(d, ['show', 'HEAD:' + from]);
  fs.mkdirSync(path.dirname(to), {recursive: true});
  fs.writeFileSync(to, blob);
  return blob.length;
};

fs.mkdirSync(OUT, {recursive: true});
const manifest = {version: 1, cases: []};
let bytes = 0;
for(const [id, title, piece, perf, tests] of ASAP){
  const dir = path.join(OUT, 'asap', id);
  bytes += copy('asap', piece + '/xml_score.musicxml', path.join(dir, 'score.musicxml'));
  bytes += copy('asap', perf + '.mid', path.join(dir, 'performance.mid'));
  bytes += copy('asap', perf + '_annotations.txt', path.join(dir, 'annotations.txt'));
  /* the score unfolded as this pianist played it (repeats taken or not),
     with its own downbeats: how a performed downbeat is placed in the score */
  const folder = perf.slice(0, perf.lastIndexOf('/'));
  bytes += copy('asap', folder + '/midi_score.mid', path.join(dir, 'score.mid'));
  bytes += copy('asap', folder + '/midi_score_annotations.txt', path.join(dir, 'score_annotations.txt'));
  manifest.cases.push({id, title, kind: 'asap', tests, score: `asap/${id}/score.musicxml`, performance: `asap/${id}/performance.mid`,
    annotations: `asap/${id}/annotations.txt`, scoreMidi: `asap/${id}/score.mid`, scoreAnnotations: `asap/${id}/score_annotations.txt`, source: `ASAP: ${perf}`});
  console.log(`  ${id}`);
}
for(const [id, title, file, o] of QUARTETS){
  const to = path.join(OUT, 'openscore', id + '.mxl');
  bytes += copy('osq', file, to);
  manifest.cases.push({id, title, kind: 'ensemble', score: `openscore/${id}.mxl`, bars: o.bars, source: `OpenScore String Quartets: ${file}`});
  console.log(`  ${id}`);
}
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
fs.writeFileSync(path.join(OUT, 'LICENSE.md'), `# The classical test set — sources and licences

These files are used only by the recording-sync accuracy harness
(\`test-sync-accuracy.js\`); they are not part of the site.

## asap/ — ASAP: Aligned Scores and Performances
MusicXML scores, MIDI performances and beat/downbeat annotations from the
ASAP dataset, https://github.com/fosfrancesco/asap-dataset

> F. Foscarin, A. McLeod, P. Rigaux, F. Jacquemard, M. Sakai. "ASAP: a
> dataset of aligned scores and performances for piano transcription."
> ISMIR 2020, pp. 534–541.

The performances come from the MAESTRO dataset (the International
Piano-e-Competition). Licensed **CC BY-NC-SA 4.0**
(https://creativecommons.org/licenses/by-nc-sa/4.0/): attribution,
non-commercial use only, share-alike. Files are unmodified (renamed).

## openscore/ — OpenScore String Quartets
MusicXML from https://github.com/OpenScore/StringQuartets, dedicated to the
public domain under **CC0 1.0**.
`);
console.log(`\n${manifest.cases.length} cases, ${(bytes / 1048576).toFixed(1)} MB in tools/sync-testset`);
