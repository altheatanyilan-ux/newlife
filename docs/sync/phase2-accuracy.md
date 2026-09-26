# Recording sync — Phase 2 accuracy

Run 2026-09-26 17:40 UTC by `node test-sync-accuracy.js --write`; every number below is
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
| Bach — Prelude in C major, BWV 846 | 142.1s | ✓ as written | 9 ms | 94% | **94%** | 97% | 3.6s |
| Chopin — Étude Op. 10 No. 3 ("Tristesse") | 257.6s | ✓ as written | 36 ms | 61% | **73%** | 82% | 12.4s |
| Beethoven — Sonata Op. 13 ("Pathétique"), ii. Adagio cantabile | 297.8s | ✓ as written | 30 ms | 77% | **88%** | 89% | 6.8s |
| Haydn — Sonata Hob. XVI:44 (No. 32), i. — repeats taken | 300.5s | ✓ as written | 15 ms | 83% | **93%** | 96% | 11.6s |
| Haydn — Sonata Hob. XVI:44 (No. 32), i. — repeats skipped | 197.5s | ✓ without the repeats | 15 ms | 87% | **93%** | 96% | 13.6s |
| Schubert — Impromptu Op. 90 No. 3 in G♭ | 323.7s | ✓ as written | 14 ms | 81% | **86%** | 88% | 13.5s |
| Schumann — Kreisleriana Op. 16 No. 1 | 164.7s | ✓ as written | 11 ms | 70% | **78%** | 86% | 9.1s |
| Mozart — Sonata K. 332, i. Allegro | 276.2s | ✓ as written | 13 ms | 90% | **94%** | 95% | 14.5s |
| Chopin — Berceuse Op. 57 | 264.3s | ✓ as written | 17 ms | 74% | **81%** | 83% | 15.7s |
| Debussy — Images I, "Reflets dans l'eau" | 290s | ✓ as written | 32 ms | 59% | **60%** | 65% | 7.3s |
| Haydn — String Quartet Op. 64 No. 5 ("The Lark"), i. (opening) — string quartet | 122.1s | ✓ as written | 32 ms | 63% | **79%** | 93% | 3.0s |
| Haydn — String Quartet Op. 64 No. 5 ("The Lark"), i. (opening) — orchestrated | 142.1s | ✓ as written | 23 ms | 84% | **96%** | 98% | 2.9s |

## Jazz

| Piece | Length | Repeats / choruses found | Median error | ±50 ms | ±100 ms | ±200 ms | Engine |
|---|---|---|---|---|---|---|---|
| Autumn Leaves | 329.8s | 6 choruses (played: 5 choruses) | 7 ms | 97% | **97%** | 97% | 8.0s |
| There Will Never Be Another You | 214.6s | ✓ 5 choruses | 8 ms | 99% | **99%** | 99% | 5.7s |
| Au Privave | 143.6s | 11 choruses (played: 10 choruses) | 6 ms | 100% | **100%** | 100% | 4.9s |
| Billie's Bounce | 156.4s | ✓ 9 choruses | 6 ms | 97% | **97%** | 97% | 3.6s |
| My Funny Valentine | 334.9s | ✓ 3 choruses | 136 ms | 31% | **38%** | 67% | 6.0s |
| So What | 278.7s | ✓ 5 choruses | 7 ms | 89% | **90%** | 93% | 3.7s |

## Per-bar confidence

The engine marks each bar with how sure it is. Bars it marked sure (≥ 0.6): 1656, mean error
55 ms. Bars it marked unsure: 200, mean error 541 ms. The Recordings panel
draws these as the strip under each recording (sure / fairly sure / guessed), so a bar that is
wrong is usually one it has already said it doubts. It is not a guarantee: a bar the engine is
confidently wrong about can happen, most often in the passages named below.

## Following the score as well as the harmony

Quick notes and a free tempo are where following the recording's harmony alone loses its place:
one harmony held under a run of sixteenths says little about which sixteenth is sounding, and a
pianist who pulls the tempo about gives the path nothing steady to count by. So for a score played
once through the engine also plays the score itself through — every bar's own notes, where they fall,
how long and how loud, at the bar's written tempo — and aligns the recording to that rendering, not
only to its chords. The score's own words are read as a plan for the rubato: a *rit.* or *rall.*
expects the bars to lengthen, an *accel.* to shorten, a fermata to hold, *a tempo* to return; the
alignment is steered towards that plan and free to leave it where the recording does.

Both placements are then made — along the harmony, and along the score — and the engine keeps the one
whose frames fit the harmony of the beats they fall in better (the mean z-score of the chroma
similarity along it), a measure taken from the recording alone. On these ten performances it keeps
the better one in nine; the tenth (Kreisleriana) is within three points either way. The clean-up rules
written for the harmony path (an unsure bar interpolated, a lurch in tempo smoothed away) stand down
after the score path, which follows a real ritardando that those rules would have taken for a
mistake. The Berceuse, where one harmony rocks under the melody for pages, goes from 26% of downbeats
within 100 ms to 81%; the Chopin étude from 55% to 73%; nothing else is worse.
Both fits and the choice are in each map's diagnostics (`pick`).

## Where it does well, and where it does not

- **Steady and moderately free playing is followed closely.** Bach, Mozart, both Haydn readings,
  the Beethoven Adagio, the Schubert and the orchestrated quartet all have 86–96% of downbeats within
  100 ms, most within 50 ms.
- **Repeats.** Where the pianist skips the repeats (Haydn, second performance), the engine finds
  that reading by itself. Every combination of repeats taken and skipped is tried.
- **Hard cases.** The Chopin étude's stormy middle section and Debussy's washes of pedal are still
  the hardest: there the map stays in the right region but can sit off the bar line. Following the
  score (above) rescued the Berceuse and most of the étude; Debussy is placed better by the harmony,
  and the engine keeps that. Two sessions with the same recording give the same map, and the strip
  says where it is unsure.
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
