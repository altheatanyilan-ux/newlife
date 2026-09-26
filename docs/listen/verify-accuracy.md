# Piano input: how well the Verify Engine hears a piano

Phases 1 and 2 of the piano-recognition spec are built. As the spec asks,
here is the engine's accuracy **before** the live-feedback UI (Phase 3) and
Compose (Phases 4–5) are started.

- **Raw numbers:** `verify-accuracy.json`.
- **Reproduce:** `node tools/listen-harness.js --json docs/listen/verify-accuracy.json`
- **On your own piano:** open **Jazz Studio › Piano input › How well does it
  hear my piano?** and give it a recording plus the MusicXML of what you
  played. It reports the same measures for your piano, your room and your
  microphone. Those are the numbers that matter most, and I haven't got
  them yet.

## What was tested

**The instruments** are real recordings of two real pianos, played the way
the site's own sampler plays them: nearest recorded key moved to pitch,
velocity, damper on key-up or held by the pedal.

- **Salamander Grand** (a Yamaha C5, the samples the site already uses).
- **A Steinway B** from the Versilian Community Sample Library. This is a
  different instrument with a different sound, kept to the range it was
  recorded in.

Both go through a small room (a short reverb) with a little room noise and
mains hum, because a phone on a music desk hears the room, not a line out.

**Set A: voicings.** 400 per piano:
- 2–5 note chords in the middle of the keyboard (shells, closed and drop-2
  four-note chords, five-note spreads, dyads), about one per second;
- 30% under the pedal, with the previous chord still ringing.

About half are asked for exactly as played. The rest are asked for
something slightly different, and the right answer is "not yet":
- one note a semitone off;
- one note fewer played than asked;
- one note more played than asked.

The score is the share of pass/fail decisions that were right, at Standard
strictness.

**Set B: repertoire.** The first 30 seconds of each of 10 ASAP performances:
a concert pianist's actual key presses and pedalling, from Bach to Debussy.

- **"Told":** the engine is told, 80 ms before each chord, which notes it
  has, as an exercise would.
- **"Not told":** the same audio with no expectations at all, for
  comparison.
- **The score:** note-level precision, recall and F1, where a note counts
  as found only if reported within ±50 ms of when it was played.

## Results

### Set A: voicings (the target: at least 95% right, typical latency under 150 ms)

| | Salamander grand | Steinway B |
|---|---|---|
| **Pass/fail decisions right** | **97.5%** (400) | **96.8%** (400) |
| Played as asked (should pass) | 99.1% | 100.0% |
| One note a semitone off (should fail) | 98.6% | 95.7% |
| A note asked for but not played (should fail) | 91.7% | 90.7% |
| An extra note played (should fail) | 94.3% | 89.6% |
| **Latency after the attack** | **≈ 126 ms** | **≈ 127 ms** |
| of which, arithmetic per chord | 7.0 ms | 6.6 ms |

**Both pianos meet the target.**

The errors lean to one side: the engine wrongly says "right" more often than
it wrongly says "not yet" (8 and 13 false passes, against 2 and 0 false
fails). Two cases are hardest:
- **A note asked for but not played**, when it shares partials with a note
  that was played (a fifth or an octave above it).
- **An extra note** that sits on another note's overtones.

### Set B: repertoire, F1 at ±50 ms

| | Salamander, told | Salamander, not told | Steinway, told | Steinway, not told |
|---|---|---|---|---|
| **All ten pieces** | **78.7%** | 67.9% | **77.3%** | 66.4% |
| Bass (below C3) | 67.4% | | 71.5% | |
| Middle (C3–C5) | 80.7% | | 79.5% | |
| Treble (above C5) | 77.5% | | 74.4% | |
| Pedal down | 77.5% | | 75.2% | |
| Pedal up | 81.1% | | 81.2% | |

**By piece, told (Salamander / Steinway):**

| Piece | Salamander | Steinway |
|---|---|---|
| Bach prelude | 94.1% | 96.9% |
| Chopin Berceuse | 94.0% | 91.5% |
| Haydn | 90.1% | 90.4% |
| Mozart | 85.8% | 86.5% |
| Debussy | 85.3% | 75.9% |
| Chopin Op. 10 No. 3 | 82.4% | 74.9% |
| Beethoven | 69.4% | 64.3% |
| Kreisleriana | 64.0% | 68.4% |
| Schubert Op. 90 No. 3 | 52.7% | 55.0% |

**Where it struggles:**
- **Dense, fast, pedalled textures.** In the Schubert (a running accompaniment
  under the pedal), Kreisleriana and Beethoven, notes come faster than the
  tenth of a second the engine looks at each attack.
- **The bass.** The bass is weaker than the middle and treble on both pianos.
- **The pedal.** With the pedal down, F1 is 4–6 points lower than with it up.

### Onset timing

The detected onset lands on average 15 ms (Salamander) and 4 ms (Steinway)
after the true attack. The typical absolute error is 18 ms and 10 ms. All of
this is well inside the ±50 ms tolerance.

### Live, through the microphone

`smoke239.js` plays a recording through Chromium's fake microphone. It
checks that the whole live path works from `file://`:

- the audio runs AudioWorklet → Worker;
- each step is judged: right, right, wrong (B4 for C5), right, wrong (an
  extra F3);
- every verdict arrives within 150 ms of the attack (86–140 ms observed).

## What the engine does (short version)

1. **Onsets.** Spectral flux is measured against the room's own noise
   floor. That floor is estimated continuously, so there is no silence to
   ask for. Just after a strong attack, a much weaker spike is ignored.
2. **The look.** About 0.1 s after each onset, a fine spectrum is taken,
   plus one from just before the onset.
3. **Scoring each key.**
   - Each key's harmonic series is scored at this piano's tuning (learned
     automatically, per microphone) and with its strings' stretch
     (inharmonicity, learned per octave).
   - A partial must be a real, prominent peak, not a neighbour's slope or
     the hammer's thump.
   - What rose since just before the attack decides what was struck, as
     opposed to what was already ringing.
4. **Explaining away.** When a note is accepted, only the share of each
   partial a smooth series would have is removed (Klapuri's spectral
   smoothness). An octave above keeps what is really its own.
5. **Verifying.** Expected notes are looked for first and more readily.
   Extra notes are then looked for sternly, only on partials no accepted
   note accounts for.
6. **Learning the piano.** Each clean, confirmed note leaves its partial
   shape behind, and the matching uses those shapes from then on.

## Built (Phases 1 and 2)

**Input**
- The NoteEvent stream `{pitch, onset, offset, velocity, confidence, source}`,
  shared by the microphone and Web MIDI, on one clock.
- The microphone with echo cancellation, noise suppression and automatic
  gain off, running AudioWorklet → Worker, with a ScriptProcessor fallback.
- A level meter and a "Listening" mark on every page.

**Automatic, with no calibration step**
- The noise floor.
- The tuning, stored per device.
- String inharmonicity per octave.
- Per-piano note templates.

**Sources and playback**
- Mic / MIDI / Auto selector.
- Leakage handling: notes the app itself is playing are set aside, there is
  a one-time headphones tip, and a warning if much of what is heard is the
  app.

**The Verify Engine**
- Modes: exact, pitch-class, sequence (Needleman–Wunsch), rhythm (offsets
  against a grid) and free.
- Strictness: Lenient, Standard and Strict.

**The harnesses**
- In-app, for your recordings: the recording sync engine finds where each
  written note falls, and the report is split by register and by pedal.
- In Node, for the numbers above.

**Privacy:** nothing is recorded or sent. Only the tuning, the stretch and
the note shapes are kept, per microphone.

## Not built yet (waiting for your go-ahead, as the spec asks)

- **Phase 3:** the live feedback UI (coloured noteheads, timing lane, the
  keyboard view, scorecards, "Loop the tricky bit", progress logging).
- **Phases 4–5:** transcription and play-to-compose.
- **Phase 6:** the integrations.
