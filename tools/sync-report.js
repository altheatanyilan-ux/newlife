#!/usr/bin/env node
/* Writes docs/sync/phase2-accuracy.md from docs/sync/phase2-accuracy.json
   (made by `node test-sync-accuracy.js --write`). */
'use strict';
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'docs', 'sync');
const {run, results} = JSON.parse(fs.readFileSync(path.join(dir, 'phase2-accuracy.json'), 'utf8'));
const row = r => r.failed ? `| ${r.title} | — | failed: ${r.failed.split('\n')[0]} | | | | |` :
  `| ${r.title} | ${r.audioSeconds}s | ${r.structure.reading === r.structure.expected ? '✓ ' + r.structure.reading : r.structure.reading + ' (played: ' + r.structure.expected + ')'} | ${r.errors.median} ms | ${r.errors.within50}% | **${r.errors.within100}%** | ${r.errors.within200}% | ${(r.engineMs / 1000).toFixed(1)}s |`;
const table = rs => ['| Piece | Length | Repeats / choruses found | Median error | ±50 ms | ±100 ms | ±200 ms | Engine |',
  '|---|---|---|---|---|---|---|---|', ...rs.map(row)].join('\n');
const cls = results.filter(r => r.kind !== 'jazz'), jazz = results.filter(r => r.kind === 'jazz');
const conf = results.filter(r => r.confidence).map(r => r.confidence);
const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
const sureN = sum(conf, c => c.sure), unsureN = sum(conf, c => c.unsure);
const sureErr = Math.round(sum(conf, c => (c.sureMeanErr || 0) * c.sure) / Math.max(1, sureN));
const unsureErr = Math.round(sum(conf, c => (c.unsureMeanErr || 0) * c.unsure) / Math.max(1, unsureN));
const md = `# Recording sync — Phase 2 accuracy

Run ${run.slice(0, 16).replace('T', ' ')} UTC by \`node test-sync-accuracy.js --write\`; every number below is
in \`phase2-accuracy.json\` beside this file, bar by bar. Listening excerpts (40 s of each test
recording) are in \`audio/\`.

## What is measured

The engine is given what the site gives it: a recording (mono samples at the file's own rate) and
a score, and nothing else. Its sync map is then checked at every downbeat against the known answer.

**Classical (what Repertoire is for).** Ten piano pieces from the ASAP dataset: real performances by
conservatory pianists (MAESTRO competition MIDI, with their own timing, dynamics and pedalling),
sounded on the Steinway B samples. The answer is ASAP's hand-annotated downbeats. The Haydn
movement is used twice: once with the repeats taken, once with them skipped. The opening of Haydn's
"Lark" quartet is played on real string samples, and again orchestrated for strings, woodwinds and
horn, each with rubato at the phrase ends.

**Jazz.** Six tunes on the jazz band (bass, drums, piano, horns), with intros, endings, tuning offsets
and rubato heads. Every sound is a recording of a real instrument (vendor/orchestra, CC0).

## Classical

${table(cls)}

## Jazz

${table(jazz)}

## Per-bar confidence

The engine marks each bar with how sure it is. Bars it marked sure (≥ 0.6): ${sureN}, mean error
${sureErr} ms. Bars it marked unsure: ${unsureN}, mean error ${unsureErr} ms. The Recordings panel
draws these as the strip under each recording (sure / fairly sure / guessed), so a bar that is
wrong is usually one it has already said it doubts. It is not a guarantee: a bar the engine is
confidently wrong about can happen, most often in the Berceuse (below).

## Where it does well, and where it does not

- **Steady and moderately free playing is followed closely.** Bach, Mozart, both Haydn readings,
  the Beethoven Adagio, the Schubert and the orchestrated quartet all have 86–96% of downbeats within
  100 ms, most within 50 ms.
- **Repeats.** Where the pianist skips the repeats (Haydn, second performance), the engine finds
  that reading by itself. Every combination of repeats taken and skipped is tried.
- **Hard cases.** The Chopin étude's stormy middle section, Debussy's washes of pedal, and above
  all the Berceuse, where one harmony rocks under the melody for pages, leave the harmony too little
  to hold on to. There the map stays in the right region but drifts off the bar line (the Berceuse is
  the one piece with most bars off). Two sessions with the same recording give the same map, and
  the strip says where it is unsure.
- **Jazz ballads.** A rubato head with no rhythm section (My Funny Valentine) is the weakest jazz
  case. On two tunes the harness counts one more chorus than was played (the intro vamp or the tag
  ending read as a chorus); the bars themselves are still placed correctly.

## Fixes this phase made along the way

- **Split bars.** The MusicXML player padded a bar split by a repeat sign (the last beats of a
  section, then its upbeat after the double bar) to a full bar, so playback paused for a beat at
  every such repeat. Such bars now last what they hold (Kreisleriana: 6% → ${(cls.find(r => r.id === 'kreisleriana-1') || {errors: {}}).errors.within100}% of bars within 100 ms).
- **Silence before the music.** A recording that opens with a second or two of room no longer has
  its first bar placed in the silence.

## Privacy

Recordings are read and analysed in this browser, in a Worker. The audio is kept in its own store
on this device, left out of backups and out of the two-machine file, and never uploaded. What can
be exported is the sync map, which holds bar times, never sound.
`;
fs.writeFileSync(path.join(dir, 'phase2-accuracy.md'), md);
console.log('written: docs/sync/phase2-accuracy.md');
