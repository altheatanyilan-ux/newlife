# Recording sync — Phase 2 accuracy

Run 2026-09-25 23:32 UTC by `node test-sync-accuracy.js --write`; every number below is
in `phase2-accuracy.json` beside this file, bar by bar. Listening excerpts (40 s of each test
recording) are in `audio/`.

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

| Piece | Length | Repeats / choruses found | Median error | ±50 ms | ±100 ms | ±200 ms | Engine |
|---|---|---|---|---|---|---|---|
| Bach — Prelude in C major, BWV 846 | 142.1s | ✓ as written | 9 ms | 94% | **94%** | 97% | 1.7s |
| Chopin — Étude Op. 10 No. 3 ("Tristesse") | 257.6s | ✓ as written | 90 ms | 42% | **55%** | 64% | 2.8s |
| Beethoven — Sonata Op. 13 ("Pathétique"), ii. Adagio cantabile | 297.8s | ✓ as written | 30 ms | 77% | **88%** | 89% | 3.4s |
| Haydn — Sonata Hob. XVI:44 (No. 32), i. — repeats taken | 300.5s | ✓ as written | 15 ms | 83% | **93%** | 96% | 4.0s |
| Haydn — Sonata Hob. XVI:44 (No. 32), i. — repeats skipped | 197.5s | ✓ without the repeats | 15 ms | 87% | **93%** | 96% | 2.8s |
| Schubert — Impromptu Op. 90 No. 3 in G♭ | 323.7s | ✓ as written | 14 ms | 81% | **86%** | 88% | 4.8s |
| Schumann — Kreisleriana Op. 16 No. 1 | 164.7s | ✓ as written | 11 ms | 70% | **78%** | 86% | 4.1s |
| Mozart — Sonata K. 332, i. Allegro | 276.2s | ✓ as written | 13 ms | 90% | **94%** | 95% | 3.5s |
| Chopin — Berceuse Op. 57 | 264.3s | ✓ as written | 12912 ms | 20% | **26%** | 26% | 3.1s |
| Debussy — Images I, "Reflets dans l'eau" | 290s | ✓ as written | 32 ms | 59% | **60%** | 65% | 3.4s |
| Haydn — String Quartet Op. 64 No. 5 ("The Lark"), i. (opening) — string quartet | 122.1s | ✓ as written | 32 ms | 63% | **79%** | 93% | 1.4s |
| Haydn — String Quartet Op. 64 No. 5 ("The Lark"), i. (opening) — orchestrated | 142.1s | ✓ as written | 23 ms | 84% | **96%** | 98% | 1.5s |

## Jazz

| Piece | Length | Repeats / choruses found | Median error | ±50 ms | ±100 ms | ±200 ms | Engine |
|---|---|---|---|---|---|---|---|
| Autumn Leaves | 329.8s | 6 choruses (played: 5 choruses) | 7 ms | 97% | **97%** | 97% | 3.1s |
| There Will Never Be Another You | 214.6s | ✓ 5 choruses | 8 ms | 99% | **99%** | 99% | 2.1s |
| Au Privave | 143.6s | 11 choruses (played: 10 choruses) | 6 ms | 100% | **100%** | 100% | 1.4s |
| Billie's Bounce | 156.4s | ✓ 9 choruses | 6 ms | 97% | **97%** | 97% | 1.5s |
| My Funny Valentine | 334.9s | ✓ 3 choruses | 136 ms | 31% | **38%** | 67% | 3.3s |
| So What | 278.7s | ✓ 5 choruses | 7 ms | 89% | **90%** | 93% | 2.8s |

## Per-bar confidence

The engine marks each bar with how sure it is. Bars it marked sure (≥ 0.6): 1662, mean error
69 ms. Bars it marked unsure: 194, mean error 8272 ms. The Recordings panel
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
  every such repeat. Such bars now last what they hold (Kreisleriana: 6% → 78% of bars within 100 ms).
- **Silence before the music.** A recording that opens with a second or two of room no longer has
  its first bar placed in the silence.

## Privacy

Recordings are read and analysed in this browser, in a Worker. The audio is kept in its own store
on this device, left out of backups and out of the two-machine file, and never uploaded. What can
be exported is the sync map, which holds bar times, never sound.
