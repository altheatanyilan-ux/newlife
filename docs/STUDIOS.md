# The Jazz Studio and the Songwriting Studio

A long explanation of the two music rooms, written from the code (`src/19-jazz-*.js`, `src/19-listen-*.js`, `src/19-sng-*.js`) rather than from memory. It says what each room is *for*, what is shipped and what is yours, how each decision is made (every rule here is a rule you can read in the source), and where the edges are.

Both rooms follow the same house rules, which are worth knowing first:

- **Rule-based, not AI.** No suggestion, grade, melody or solo in either room comes from a model. Where something looks clever (a walking bass, an improvised solo, a six-melody generator) it is a seeded dice-roll inside rules that the room can show you. The same seed gives the same result.
- **Shipped teaching vs. your record.** The curriculum, the tunes, the golden tips are shipped with the app and will be corrected in later versions; what is stored in *your* data is only what you did (which keys you have, what you logged, what you wrote). That is why an exercise can move between stages without losing a key.
- **Suggestions, not locks.** Readiness indicators say "four of five" and the button is live anyway. Nothing moves you on by itself.
- **Everything stays on this device.** Both rooms work offline. The microphone is analysed as it arrives and dropped; recordings are Blobs in their own IndexedDB stores, never in the JSON state, so a backup (text) does not carry them.
- **One clock.** Practice minutes are real minutes from the house's one stopwatch (Time tracking); the studios add *what the minutes were spent on*, which no stopwatch knows.

Contents: **Part I — Jazz Studio** · **Part II — Songwriting Studio** · **Part III — shared pieces and cross-room links** · **Part IV — things worth knowing** · **Part V — where to find things**.

---

# Part I — The Jazz Studio (`#/jazz`)

## 1. What it is

A jazz-piano practice room built on one idea: **the unit is the pattern-in-a-key, not the piece.** Nobody "learns" a ii–V–I once; you play it until the hands go there unasked, in all twelve keys. So the whole room counts in twelves: the roadmap counts keys owned out of 12 × exercises, flashcards deal a random *key* rather than a random exercise, and an exercise is marked off one key at a time.

It is a study-from-books room. The spine is **Siskind's three-book curriculum** (Stages P0–12 as originally brought in), re-laid onto the **Curriculum v3 "Master Build Document"** (thirteen stages 0–12 with poetic titles, a six-level Voice Track and a dual-tasking track), and joined to a **917-entry Real Book tune database**. Every exercise carries a citation (book, unit, page range, and what to look for on the page) so the room's claim — "this is somebody's teaching, not my invention" — can be checked.

Pages are addresses, so the browser's Back works between them:

| Address | What it is |
|---|---|
| `#/jazz` | The roadmap (stages → modules → exercises) |
| `#/jazz/<exerciseId>` | One exercise: notation, twelve keys, logs, checkpoints, tips |
| `#/jazz/plan` · `/session` · `/progress` | Today's plan · the session being logged · where it adds up |
| `#/jazz/cards` (+ `/A` `/B` `/C`) | Twelve-key flashcards · lead-sheet cards, three modes |
| `#/jazz/tunes` · `/tune/<id>` · `/repertoire` · `/analysis` | Tune library · one tune · repertoire tracker · harmonic analysis |
| `#/jazz/playalong` | Play-along band for a chart or progression |
| `#/jazz/listen` · `/improv` · `/units` | Listening library · improvisation exercises · Siskind unit assignments |
| `#/jazz/record` · `/journal` · `/audiation` · `/mindset` | Recorder · journal · Gordon audiation ladder · mindset |
| `#/jazz/piano` · `/compose` · `/ear` | Piano input · Play to compose · ear & reading drills |
| `#/jazz/about` | "About v3": the document, and every place it disagrees with the room |

## 2. What is kept (`S.jazz`)

`jazzState()` returns one object saved as a meta row, and repairs/migrates it on every read:

- `progress[exerciseId]` — **created only when something actually happens**, so an untouched catalogue costs nothing: `{keys:{C:true,…}, nailed:{key:n}, logs:[…], checks:{hash:true}, lastAt, fastestReaction?}`.
- `flashes[]` — the flashcard history (capped at 2,000), each `{exerciseId, key, at, day, result, seconds, reactionWindowBeats?, bpm?}`.
- `settings` — `cards` (3–60, default 15), `keyMode` (`all` | `unmastered` | `custom`), `customKeys`, `syllabus`, `gate` (one stage at a time, default **off**), `checks` (also ask mastery checkpoints, default **on**), plus the band, pace, vocal range and so on.
- `tierOverrides` — your own corrections to the core/enrichment/fast-track split.
- Plan state: today's generated plan (stored, so a swap stays swapped and a re-render doesn't reshuffle), session records, chosen pace per stage, starred golden tips.
- Separate stores: recordings (`jazzAudio`, Blobs), editor edits (`jazzEdited`), tune-library notes/takes/repertoire status.

A record whose exercise has since left the shipped book is **kept, not swept** — it is a record of your practice, not of the catalogue.

## 3. The curriculum

### 3.1 The thirteen stages (v3)

| Stage | Title | Subtitle |
|---|---|---|
| 0 | The Twelve Distances | Intervals |
| 1 | Day One at the Piano | Chords, swing & your first tune |
| 2 | The Progression That Is Most of the Music | ii–V–I & voicings |
| 3 | Every Session There Has Ever Been | Blues & first improvisation |
| 4 | What Scale Goes With This Chord | Modes & altered dominants (applied) |
| 5 | The Harmony Beneath the Harmony | Slash chords, diminished devices, dominant chains |
| 6 | Learning From Records | Transcription, COREA & advanced comping |
| 7 | The Minor Side | Minor ii–V–i, guidetone lines & scale patterns |
| 8 | The Second Most Common Form | Rhythm changes, intros & endings |
| 9 | Playing Alone, Playing Slow | Ballads, solo piano & walking bass |
| 10 | When the Harmony Stops Moving | Modal jazz & pentatonics |
| 11 | Somewhere Else to Take It | Reharmonization & modulation |
| 12 | Where the Studying Stops | Advanced voicings, odd meters & composition |

Beside the main line run the **Voice Track** (V1–V6, e.g. "Singing While You Play", "Singing with Others, and Past the Usual Sounds", "Writing for Voices") and the **dual-tasking track (DT)**, which sits after Stage 9. Each stage has a one-line blurb, a prerequisite stage (`needs`), and for some a Golden Tip ("You will play wrong notes. This is not failure — it's jazz." on Stage 1; "Your first solo will sound terrible. Record it anyway." on Stage 3).

### 3.2 How the layers fit (and why the files are named as they are)

- `19-jazz-a-gen.js` — **the engraver's library**, brought in whole: a generator that writes MusicXML for an exercise in *any* key. `19-jazz-b-p0.js` adds Stage P0 (intervals). `19-jazz-c-stages.js` is the catalogue of what the exercises *are*, with the page of Siskind each cites. These are kept as delivered ("a curriculum retyped is a curriculum with new mistakes in it").
- `19-jazz-k-units.js` — **thirty-six Siskind unit assignments** (12 per book): what to do each day, for how long, in what order, each item classified as fundamentals / rote / tunes / listening.
- `19-jazz-l-catalog.js` — **the thirteen data models**: every named comping pattern with its beats, coordination exercise with two hands written out, scale pattern, worksheet, transcription project (five COREA steps)… data only, seeded from Books 1–3.
- `19-jazz-m-materials.js` / `-n-materialui.js` — that material put **on the ladder**: each item becomes a substage of the stage its book and unit belong to, drawn *as blocks on the exercise it belongs to* rather than in separate rooms ("material kept in a library of its own is material nobody opens").
- `19-jazz-o-v3doc.js` — **the v3 document word for word** (every entry's type tag, description, score line, MusicXML, theory text and YouTube searches; Section 1 overviews; Section 3 outcomes; Section 4 feature specs; Section 5 repertoire ladder; Section 6 omissions; Section 7 tune database). Extracted from the .docx mechanically, never retyped.
- `19-jazz-o-v3.js` — **placement and nothing else**: for each stage in the document's own order, which document entries appear and which of the room's exercises sit under each. Three kinds of line: an exercise `id`; `{doc:key}` (new to the room); `{doc:key, onto:'id'}` (the entry *is* an existing exercise, so the words merge rather than duplicate).
- `19-jazz-o-v3build.js` — the notation: moves the document's MusicXML into any key at score level (slashes, ties, fermatas, odd bars survive; spelling follows the new key signature), and writes the scores the document only *describes* from a small token notation (`"q:C4~ e:C4 e:r h:r"`). Those carry an accuracy mark saying they were written from a sentence.
- `19-jazz-x-modules.js` — **modules**: each stage is split into two to four named clusters (same technique / same week of Siskind's plan). The **current module** is the first whose exercises are not all mastered; the daily plan boosts it and the roadmap opens it by default and folds the rest.
- `19-jazz-d-rich.js` — **enrichment**: per stage, where the music came from, expected difficulty and honest time-to-master ("three to five weeks, and most people hit a wall in the first"); per exercise, what to listen to, common mistakes, how to know you have it, when you'd use it, connections, practice strategy and a creative challenge. A mastery checklist is written where the source has one and **derived** (slowly → at tempo → in all twelve → from memory → inside a tune) where not — and a derived one says so.
- `19-jazz-d-refs.js` — **citations**, matched by what the exercise *is*, not by id (ids drifted from the source table). The accuracy mark is not copied from the table; it is the catalogue's own.
- `19-jazz-d-tips.js` — **the forty-eight golden tips**: general advice (metronome on two and four; slow down when it stops improving; every key; sing what you play; listen twenty times; make a mess before you make music), each attributed to a book, chapter and page, chosen for what the exercise is, and rotating daily. You can star them.

### 3.3 Where the room and the document disagree

When the v3 document and the room's own (book-checked) version of an exercise differ, **both are kept**; which is right is for the player to decide after reading both. Every pair is in `JAZZ_V3_CONFLICTS`, each side says so on its own page, and `#/jazz/about` lists them in one table.

### 3.4 Exercise IDs never change

Everything practised is kept under the exercise id, so moving an exercise between stages keeps its keys, logs and checkpoints. New entries take the document's own number where free (`5.4 Bird Blues`), `v3-` + number where the room already uses that number (`v3-2.4a`), or `v3-` + slug.

## 4. Tiers: core, enrichment, fast track

`19-jazz-v-tiers.js`. Every exercise is exactly one of:

- **core** — Siskind's numbered exercises, the coordination exercises (the `.9xx` numbers), the first improvising (`IMP-B1-*`), and Stage 0's foundations.
- **enrichment** — everything from the other books (Levine, Berklee, Mantooth, Dobbins, Stoloff, Weir, Peckham) and the v3 document's own entries, plus every worksheet, listening assignment, song-form analysis and "write it in these keys".
- **fast-track** — the eight-to-ten core exercises per stage you must have to be ready for the next: the first playable exercise of each subsection (where each new idea arrives), at least one coordination and one improvising exercise, **never** a worksheet, a listening or a page of pure theory. Where a main-line stage has fewer than eight playable core exercises (Stage 4 is mostly Levine, Stage 5 has no Siskind at all, Stage 11 is mostly Berklee), its own playable exercises are promoted to core in document order, the room's originals first, until it has eight.

Corrections: `JAZZ_TIER_OVERRIDES` (ships) and `S.jazz.tierOverrides` (yours). The "full curriculum" vs "fast track" switch changes what the roadmap and the daily plan draw from.

## 5. The exercise page and the twelve keys

An exercise is one pattern and its twelve keys. The page engraves the pattern **fresh in the chosen key** (a key picker with all twelve), on a **grand staff** — `19-jazz-e-staff.js` is a single pass over the finished MusicXML (not eleven patches in eleven generators) that puts notes on the clef they belong to, split at middle C: a chord goes whole onto one stave unless wider than a hand; a melodic line goes whole to the staff where most of it sits, and stray notes take ledger lines like an engraver would. Each exercise carries:

- the notation + the **player bar** (the house's MusicXML player; the grand piano is the recorded Salamander sampler);
- the **12-key grid** (see §6 for how keys are earned);
- the **citation**, the **golden tips**, **enrichment** (listen-to, common mistakes, when you'd use it, creative challenge), and any v3 document text beside the room's own;
- the **mastery checklist** ("at ♩=100", "eyes closed", "name the third and seventh") — each tick is stored by a *hash of the checkpoint's own words*, not its position, so reordering a list never corrupts ticks;
- a **practice log** (date, minutes, quality `shaky/ok/solid/automatic`, notes) — sittings are real clock minutes where the clock was running;
- the **Play it strip** (§12): live feedback from a MIDI keyboard or the microphone;
- an **edit pencil** for the score editor (§11);
- for some exercises, blocks from the "ten views" (coordination two-hands + twelve keys, transcription COREA steps with counters, the seventeen-question self-analysis with beat-distribution chart, the drone recorder on 1.10, the sing-then-play recorder on 1.11).

`jazzWantsInterval` exercises (Stage 0) also deal a random **interval** alongside the key.

## 6. How a key becomes yours: flashcards and the "three nailed" rule

`19-jazz-cards.js` and `jazzGrade/jazzDeal` in `19-jazz-data.js`. The rationale is stated in the file: *a twelve-key grid you tick yourself is a grid that fills up.* After twenty minutes all twelve feel fine; three days later you can't play it in E. So the cards ask **cold**: "play a ii–V–I in E♭", no score in front of you. You play, turn the card over, and the answer is engraved in that key at that moment. Then you grade yourself: **nailed / struggled / couldn't**.

- `nailed` → `nailed[key] += 1`; at **3** (`JAZZ_NAILED_FOR`) the key is marked owned (`keys[key] = true`).
- `struggled` / `couldn't` → `nailed[key]` steps back by one (not to zero: "one bad morning should not wipe out a fortnight of getting it right"). `couldn't` additionally **un-owns** the key.
- Every answer is also appended to `flashes[]`, with the reaction window if the band called the key (§9).

**Dealing** (`jazzDeal`) builds a weighted pool of (exercise, key) cards: **3 tickets** for a key whose last answer was "couldn't", **2** for "struggled" or a never-seen/unowned key, **1** for a key already yours. Which keys enter the pool is `keyMode`: `unmastered` (default — keys you do not own come first; owned ones only when nothing is left), `all`, or `custom`. Unless turned off (`settings.checks`), mastery checkpoints are dealt as cards too (a checkpoint about moving between keys draws a second key). The deck is `settings.cards` long (3–60, default 15).

The grid is therefore **not ticked by hand from the cards**; ownership of a key is evidence, not feeling. (You can still mark keys in the exercise grid.) A hand-tick and a card-earned key are the same field — the card is the stricter route.

### Lead-sheet flashcards (`19-jazz-u-leadcards.js`, v3 §4A)

Three modes, at `#/jazz/cards/A|B|C`:

- **A — Symbol recognition**: a chord symbol, seconds to play it; scored on the notes, a time bonus and a streak multiplier; symbols grow with your stage (Stage 1 basic triads → Stage 12 upper structures).
- **B — Progression reading**: four or eight bars of a real tune, a metronome, comp through them; graded on chord quality, time, and how far the hands moved.
- **C — Form identification**: a whole lead sheet with section letters removed; mark where each section starts; the chart's own labels (or the database's form) say if you were right.

Notes come from a MIDI keyboard, on-screen keys, or the computer keyboard; on an acoustic piano the card just asks how it went.

## 7. The daily plan: "What should I practise today?"

Two files cooperate. `19-jazz-f-plan.js` is the **benchmark, templates and session log**; `19-jazz-w-dayplan.js` is the **generator**; `19-jazz-g-planpage.js` draws it (plan / session / progress).

### 7.1 Benchmark, pace and templates

Each stage has a template: `{hours, days, daily, parts:[[category, minutes, [[activity, text, minutes, keys, pick]]]]}`. Categories are Siskind's four assignment classes — **fundamentals, rote, tunes, listening** — and the minute proportions are the book's own assignment-page splits. Two numbers that look alike but are not: the per-activity minutes are the book's *stated minimums* (they sum to ~90–100), while `daily` is what the *benchmark* needs (30 hours over a fortnight ≈ 128 min/day → 120). The generator keeps the book's **proportions** and scales them to fill the day.

v3 gives each stage a length (Section 3: "~2 weeks" to "~12 weeks", up to "~78 weeks" for the longest) which becomes `days` (weeks × 7) at the document's two-hour day; **Stage 0 keeps its half-hour warm-up day**.

**Pace** is a fraction of *the stage's own day*, not a fixed number of minutes (so a five-minute singing drill isn't inflated to twenty):

| Pace | Fraction of day | Stretch of timeline | Who |
|---|---|---|---|
| Relaxed | ×0.5 | ×2 | A busy schedule, and still moving forward |
| Standard | ×1 | ×1 | The Siskind benchmark — a serious student's pace |
| Intensive | ×1.5 | ×0.67 | The time to move fast, and the wish to |

### 7.2 `generateDailyPlan` — the rules a teacher would use

A stage has twenty to forty exercises and a day has two hours; showing all of them is showing none. So the day is **four to six things**, chosen by:

- **rotation** — nothing two days running; a core exercise comes round every two or three days; the less comfortable it is, the sooner it returns;
- **keys** — three or four keys a session, round the **cycle of fourths** (C F B♭ E♭ A♭ D♭ G♭ B E A D G), unmarked keys first, so all twelve come round in three or four days;
- **balance** — one harmony/voicing exercise, one coordination/rhythm exercise, one improvising and (on the full curriculum) one enrichment item (a record to hear, a worksheet, a page to read); a warm-up and a cool-down tune either side;
- **time** — three or four exercises in an hour, five or six in two, never more than seven;
- **module preference** — the current module's exercises come up more often (§3.2);
- **readiness** — when every core exercise is in all twelve keys and comfortable (4 of 5) it *asks* whether you are ready for the next stage; it never moves you on by itself;
- **two weeks** — Siskind writes each unit for about fourteen days, so a stage runs in fourteen-day cycles: on day ten, if the core isn't near done, it says give the stage another cycle; on day fourteen it says what is yours and what isn't.

The function is **pure**: the same state and date give the same plan, so it can be tested with made-up students. The plan is stored for the day, so swapping an item stays swapped.

### 7.3 The session and its log

A session (`#/jazz/session`) is run against the plan; each activity is handed to the sitting log it belongs to, **marked with the session it came from**, so totals add both without double-counting. Listening is counted too: Siskind's rule is **listen at least twenty times** (`JAZZ_LISTEN_TARGET`) before moving on — "not once to check the box"; counts are shared between the plan and the Listening Library.

### 7.4 Readiness (`jazzReadiness`) — five rows, advisory

1. Hours logged ≥ 90% of the stage's target hours (at your pace);
2. Practised in all twelve keys (keys owned / possible);
3. Every exercise's latest log rated *solid* or *automatic*;
4. Every listening track for the stage heard 20 times (or "nothing to listen to");
5. All checkpoints ticked.

The indicator says "N of 5"; the stage-finish button is live regardless. The optional `settings.gate` ("one stage at a time") exists but is **off** by default — "the ladder was unlocked on purpose earlier and this does not quietly put the doors back."

## 8. The Tune Library (917 entries) and its five modules

Data: `19-jazz-p-tunedb.js` is `RealBookTuneDatabase_FINAL.js` as delivered (Real Book 5th ed., Hal Leonard): **76 analysed tunes**, the **table of contents of all three volumes (917 entries)**, and aggregate stats. The 917 entries are only **798 distinct ids**, because a tune can be in more than one volume (Afro Blue is in Volumes 1 and 2); an id maps to one row carrying every volume and page. `19-jazz-q-tunes.js` is the engine, `19-jazz-r-tunesui.js` draws it.

1. **Library** — search/filter by stage, volume, key, form, difficulty, category; O(1) lookup via a Map plus secondary indexes.
2. **Repertoire tracker** — per tune: status, key(s) known, date, notes, takes.
3. **Harmonic analysis** — search by feature, compare tunes, statistics. The delivered database carries counts but **not where** patterns occur, so `jazzTuneAnalysis(t)` *finds* them from the chords: ii–V–I spans (a minor ii–V–i is counted with them and named as minor), tonicisations, tritone substitutions, diminished walk-ups.
4. **Lead-sheet renderer** — the chart as a grid in any key, patterns coloured (ii–V–I blue, tonicisation green, tritone sub orange, diminished walk-up purple). The `chordProgression` strings are non-uniform (section labels like `A1:`, pipes, `%` for a repeated bar, chords in parentheses for an optional turnaround, words like "vamp") — the parser reads all of it, **never throws**, and keeps non-chords as text. **A number in parentheses is a number of bars**: `Dm7(16)|Ebm7(8)|Dm7(8)` is *So What*'s thirty-two bars. Where two chords share a bar, the bar splits.
5. **Recommended tunes on every exercise** — each tune is mapped to stages: old stage numbers moved to v3 by the document's table (old 7 splits between altered dominants → Stage 4 and minor ii–V–i → Stage 7), then **v3 rules** applied on top, a rule's "primary" beating the remap's "secondary": e.g. Stage 1 = beginner tune in C/F/B♭/E♭; 2 = has ii–V–I; 3 = blues form; 4 = has an altered dominant; 5 = tritone sub/dim walk-up (found by the chart analysis, since no delivered tune carries the tag); 6 = a named recording exists; 7 = minor ii–V–i; 8 = rhythm changes; 9 = ballad; 10 = modal.

There is also an **enrichment pathway**: analysing a tune the database doesn't have yet.

## 9. Practice mode on the chart, the band, and key cycling

`19-jazz-x-practice.js`: the player sits on the chart itself.

- **Looping** — tap a start and end bar (or tap a coloured pattern, or its ⟳ in "what the analysis found") to loop exactly that ii–V–I.
- **Each repeat**: tempo can climb a few BPM; key can move round the cycle of fourths, chromatically either way, or at random through all twelve.
- **Tap a chord**: the scales that go with it, in the job it is doing in *this* tune, and six ways to voice it.
- **Takes** — record yourself over the band; each is kept under the tune with tempo, key and bars.

### The synthesised band (`19-jazz-s-audio.js`, `19-jazz-y-backing.js`)

Three voices — grand piano (Salamander), plucked bass, brushed kit — all Web Audio, nothing downloaded except the piano samples shipped in the build. Each voice can be muted or soloed ("solo track mode": "a synthesised band has its stems already"). Options (`jzbDefaults` sets sensible ones from the exercise's name/type; you override):

- **Bass**: roots · two-feel (root, then mostly the fifth; sometimes the third, or a half step into the next root) · **walking** (one note a beat: root on beat one; a half-step or scale-step approach into the next root on the last beat; between, a scored search toward the goal, chord tones preferred, small steps favoured, with a little randomness).
- **Drums**: swing (ride on 2 and 4 with skip notes, feathered kick, soft off-beat snare comping ~18% of bars) · ballad (brushes) · straight · bossa (with its two-bar cross-stick figure) · off.
- **Comping**: Charleston · reverse Charleston · mixed · off — voiced as Siskind's **Type A / Type B** voicings, whichever shape is nearest the last one (minimum hand movement), kept inside the book's register (B2–C4).
- **Swing** ratio is loosened automatically above ♩≈220 (`jzbSwing`) because real swing straightens at speed.
- **Key order**: cycle of fourths, chromatic up/down, random, or a custom list; **choruses** and **count-in** are set per exercise.
- **Vocal range** (set once): a key that would take a pattern out of your voice is *said before it is sung*, with the octave or nearest key that fits.

The random elements use a seeded generator (`jzbRand`) so a given run is repeatable.

### Band mode on the flashcards, call-and-response, a tune as a performance (`19-jazz-z-band.js`)

- **Band mode**: "play it in E♭" the way a bandleader asks — the key is *called* (big, and out loud if you like), drums count a **reaction window**, and the band comes in on the downbeat whether you are ready or not; it plays the progression, the card turns over, you grade, and after one bar of drums the next key is called. Drums never stop between cards. **Three clean answers in a row shorten the window for that exercise — two bars, then one, then two beats** (`JZBC_WINDOWS = [8, 4, 2]` beats) — and each answer keeps the window it was given, so the exercise can report how it has come down (and the fastest reaction in seconds).
- **Call and response**: for a lick or sung pattern the band plays and the room plays the phrase (two bars; or a soft voice on the Voice Track), then two bars of band alone for you to play it back. The notes stay hidden until you ask ("Show me").
- **A tune as a performance**: the head, N choruses of solos, the head out; melody shown/hidden and heard/silent independently; trading fours with the drums; the section and chorus always said so the form is never lost.
- **The singer**: comping on, a starting note before the count, the guide melody fading.

### The generated soloist (`19-jazz-zz-solo.js`)

An improvised line over a tune's changes, from the **Chord-Scale Map** (shared with the Songwriting Studio — §P.II 9), for tenor sax, trumpet, trombone, flute, clarinet, vibes, piano or violin, each kept in its comfortable range. The rules it keeps (and which "show the solo" lists *per note*): chord tones on strong beats; at a chord change, a **guide tone** (3rd or 7th) of the new chord, reached by the smallest step; the eighth before a change approaches that guide tone by half-step or **enclosure**; between, the chord's scale with bebop passing tones off the beat; how far outside it may go is a setting (**chord tones → scale → tensions → altered → chromatic**); phrases of two or four bars with air, sometimes restating the last rhythm on the new chord (a motif developed by sequence); an arpeggio up now and then, a scale line down after. **Seeded**: the same seed plays the same solo; "a new solo" draws another. Density: sparse / medium / busy.

## 10. Listening, improvisation, units

- **Listening Library** (`19-jazz-h-listen.js`) — **36 guided tracks and 35 comping masters**, each with personnel, form map (timestamped sections and chorus counts), style and concept tags, difficulty, and the stage it belongs to. Listens are counted toward the twenty.
- **Improvisation Exercises** (`19-jazz-i-improv.js`) — **36 Siskind exercises + 12 vocal + reference cards**: setup (left-hand vamp, keys, tempo, timer), points of focus with practice prompts, FAQ ("This seems easy. Can I skip it?" — "Drone improvisation isn't meant to be easy or hard. It's meant to be habit-forming."), prerequisites. Progress is tracked in the plan state, since "a session is a session whether logged here or from the daily plan."
- **Units** (`#/jazz/units`) — the 36 Siskind unit assignments, with per-item done-flags.
- **Audiation** (Gordon's ladder), **Mindset** (Werner: practice time — analytical, slow, repetitive — vs. play time — fearless, unedited, no consequences; "The Space" before sessions), **Journal**, **Record** (drone recorder, two-track sing-then-play, self-transcription player, COREA comparison). All in `19-jazz-t-tools.js` (v3 §4B–4H) and shown on the exercises they serve as well as in their own rooms.

## 11. The score editor (`19-jazz-j-editor.js`, `-k-editorui.js`)

Replaces an earlier form-per-bar editor that stacked a new rendering on every keystroke. One idea (from MuseScore), one layer, one OSMD instance for the editor's life, re-rendered after each edit; never appended. **Normal mode**: click a note (invisible buttons are laid over each notehead, rebuilt with each render so they can't drift), then arrows move pitch, a letter replaces it, a number changes length, Delete → rest. **Note-input mode**: choose a length and type pitches; the cursor walks forward. Pitches are stored as **intervals relative to C**, so a score edited in C is correct in all twelve keys. MusicXML both ways. Save / load / reset; the "pencil" marks an exercise you have edited (`jazzEdited(id)`).

## 12. Hearing the piano (`19-listen-*`) — "Piano input", Play it, Play to compose, ear drills

All local; nothing leaves the device; no audio is kept (only what was learned about *this piano*, per microphone: its tuning, string stretch, note shapes).

- **Input layer** (`-b-live`) — one `NoteEvent = {pitch, onset, offset, velocity, confidence, source}` stream for the house, whether from a **MIDI keyboard** or an **acoustic piano via the microphone**; everything downstream never asks which. The mic is requested with echo cancellation, noise suppression and AGC **off** (they eat a piano — cancellation takes sustain for echo); audio goes AudioWorklet → Worker over a MessageChannel so the page thread never carries a sample. The app's own playback (band, score player) is known exactly and set aside from what's heard.
- **DSP** (`-a-dsp`, plain arithmetic, `ld*`) — spectral-flux **onsets**; a longer window a tenth of a second later; each key's **harmonic series with inharmonicity**; "explaining away" of the best candidate; comparison with the spectrum just before the onset so a note already ringing under the pedal isn't mistaken for a new one.
- **Verify Engine + harness** (`-c-panel`) — told what *should* be there; measured on **your own recordings** (recording + MusicXML of what you played; the recording-sync engine aligns them; reports note precision/recall/F1 within ±50 ms, chord verification — each step also asked with one note moved a semitone, which must fail — latency, split by register and pedal).
- **"Play it" strip** (`-e-feedback`) under every engraved exercise — noteheads turn green (played), red (wrong note instead), grey (missed); stray notes appear as small red ghosts at the pitch actually played; a **timing lane** shows early/late ticks. Two modes: **Wait** (cursor stays until right — for learning) and **Play along** (a click counts you in and the cursor moves regardless — for time). Chords get a keyboard strip (expected keys outlined; green/red/pulsing for missing).
- **Scorecard** (`-d-analysis`) — per exercise kind: chords (every expected note, nothing else, reaction time); scales (alignment-based accuracy so one slip doesn't spoil the rest, evenness as coefficient of variation, tempo reached, swing ratio); comping (average early/late per rhythmic position, in words: "you rush the and of 2 by 35 ms"); lead-sheet cards (guide tones present, nothing outside the chord and tensions); free playing (inside the mode, range, density). **Three passes in a row in one key, at Standard strictness or stricter, each with timing ≥ 80** marks the key as got — and the page *suggests* raising your comfort rating; "it suggests; it does not decide." A "loop the tricky bit" button replays the worst bars.
- **Transcribe Engine** (`-f-transcribe`) — every note, nothing expected. Deliberately **not** a trained model (Onsets & Frames / Basic Pitch need tens of MB of weights fetched over a network — a new runtime dependency); it's the house's own DSP run over the whole take in a Worker with offsets measured (until 24 dB below peak, into noise, or re-strike) and clean-up. It sits behind `TX_ENGINES` so a better one can be dropped in; an optional **local helper** (`tools/transcribe.py`, ByteDance piano-transcription, also hears the pedal) produces a MIDI file Compose can import — it runs on your machine, never in the page.
- **Play to compose** (`-g-compose`, `-h-composeui`) — from what you played to what a musician would write: find the beat (click, or the tempo whose grid the onsets fit best, followed through drift; downbeat = where weight lands), pick a grid (quarters/eighths/triplets/sixteenths with a charge for complication), detect **swing** (the off-eighth consistently past 58% of the beat → written straight with "Swing" marked), split hands where the split costs least. Every recording is a *take*; add the next 4 or 8 bars as another take; keep or delete the sound; rerun the clean-up with other settings; light hand-correction toolbar (and **every hand correction is counted** — how many notes needed fixing is how good the transcription was). Exports MusicXML 4.0, compressed .mxl and MIDI; saves to Repertoire as a score, or keeps as an exercise the Play-it strip then checks you on.
- **Ear and reading** (`-i-drills`) — aural test (phrase played twice, then it listens, aligned note by note), sight-reading (a melody shown for a set time, then a click bar, then it listens), and **Play what you sing** (a YIN pitch detector for the voice; compared by note name since voice and hands rarely share an octave).

## 13. How the Jazz Studio connects to the rest of the house

- **The clock** — a session starts/uses the one clock; minutes in the log are real Time-tracking minutes.
- **Habits** — a habit can be linked to the room (`h.linkedRooms` includes `jazz`); the **habit fixture** (ring, streak, next milestone, today's minutes) shows at the top of the plan page (`#/jazz/plan`).
- **Repertoire** — Play to compose saves to the score shelf; the tune library and Repertoire are separate trackers (tunes vs scores).
- **Study Deck** — the jazz decks were deliberately removed from it; the flashcards live in the Jazz Studio.
- **Daily/weekly flows** — practice appears in Today's plan and the review flows via the time and habit bridges.
- **Backup** — all state is in `S.jazz` plus stores in `ARRAY_STORES`/meta; recordings (Blobs) are device-local.

---

# Part II — The Songwriting Studio (`#/songwriting`)

## 1. What it is

*A curriculum and a workshop* for writing original songs — words and music — as someone who plays piano and sings. **The Path** is eleven stages (131 exercises) plus a capstone; **the Studio** is the workbench the exercises send you to (thirteen tools); **the Seedbank** keeps everything a tool makes; **the Songbook** keeps songs; **the Listening Room** is for analysing songs you love. Production is explicitly out of scope — "production happens in a DAW; this room is everything before that."

Sources, named on every exercise (paraphrased; **no passage of any book and no song lyric is quoted**): Pat Pattison (*Writing Better Lyrics*, *Songwriting Without Boundaries*), Andrea Stolpe (*Popular Lyric Writing: 10 Steps*), Jimmy Kachulis (*The Songwriter's Workshop: Harmony* and *Melody*), Hooktheory I; the Chord-Scale Map is general jazz pedagogy.

**Everything is rule-based and can be read.** Every check says what it measured; none claims to know what a line *means*.

Addresses: `#/songwriting` (Today) · `/path` · `/stage/<n>` · `/ex/<id>` · `/capstone` · `/studio` · `/tool/<id>` · `/seeds` · `/songs` · `/song/<id>` · `/listening`.

## 2. First visit

An onboarding card asks two things (both changeable later):

1. **Your vocal range** (lowest/highest comfortable notes, e.g. `C3`–`C5`, with a "hear them" button). Melody tools keep inside this range and warn when a line leaves it.
2. **When you write** (morning / midday / evening / whenever) — object writing "works best first thing in the morning, before the day has opinions."

## 3. What is kept (`S.songwriting`, one meta row)

Versioned (`SNG_VERSION = 1`), migrated by `sngMigrate` which **only ever adds** (never drops a field it doesn't know). Shape: `{v, profile{lowNote, highNote, dailyTime, onboarded}, owDates[], outputs{exId:{text{field:value}, savedAt, versions[], selfCheck, reflection, level}}, seeds[], songs[], grooves[], melodies[], presets[], listening[], sessions[], badges[], lab{…last settings}, capstone{}}`. Each exercise's output keeps up to **20 earlier versions** (restorable). Sessions are capped at 2,000. **Voice memos are Blobs in their own store (`sngAudio`)**, never in this object (a Blob through JSON is `{}`, and a backup is text) — so, like the other recordings in the house, they stay on this device. An early prototype's `localStorage` shape (`sng_v1`) is absorbed.

## 4. Today

- **Habit fixtures** linked to the room (`habFixturesForRoom('songwriting')`) appear first. The **42-day ring** is deliberately a separate counter from any habit.
- **Morning page** — object writing, once a day.
- **Next on the Path** — the first exercise not yet saved, in path order.
- **Today's warm-up** — one of six Kachulis warm-ups rotated by day of month (six rhythmic settings of one lyric; six melodies over one progression; six melodic shapes for one lyric; six progressions under one melody; six grooves of one progression; "rhythm of the day": a random style to improvise over), plus "5 minutes: play chords and name their colour/emotion."
- Stats (exercises, seeds, songs, days written) and **badges**.

**The 42-day ring** (in the header of every tab): a dot for each *calendar day you completed an object-writing round* (`owDates`), out of Pattison's six weeks. Filling it is a badge (`Six Weeks Deep`), 14 days is another (`Diver`).

## 5. The Path: eleven stages, 131 exercises

| Stage | Name | Subtitle | Exercises |
|---|---|---|---|
| 0 | Opening the Studio | Orientation | 4 |
| 1 | The Senses | Lyric foundations (14 days of diving deep) | 18 |
| 2 | Home Base | Harmony foundations | 10 |
| 3 | Words in Time | Stress & meter | 7 |
| 4 | Melody I: Rhythm | Rhythmic melody | 11 |
| 5 | Rhyme & Metaphor | The sound of meaning | 21 |
| 6 | Melody II: Notes | Pitch & shape | 16 |
| 7 | Structure & Motion | Prosody & form | 9 |
| 8 | Harmony II: Progressions | Power chords & colour | 14 |
| 9 | The Story | Song development | 12 |
| 10 | Melody III: Colors | Scales & modes | 9 |
| ★ | The Process (capstone) | Three songs by the Ten-Step process | — |

Stage 0's last exercise is **0.4 "A Song in an Hour, Badly"** — "prove the loop exists." Stage 1 is fourteen days of object writing (What ×5, Who ×3, When ×3, …). Stage 2 builds grooves and chord colour (one-chord groove → four chord colours → hearing home → functions & cadences → key colours → colours outside the key → contrasting sections → **six grooves of one progression**). Stage 5 is rhyme types, family rhyme, cliché detox, rhyme worksheets, and **six days of metaphor collisions** (adjective–noun, noun–verb, finding nouns from adjectives and so on). Stage 6 walks from one chord tone to arpeggios, scales, stability, motive development (repetition, sequence, inversion, shorten/lengthen), cadences, harmonising a melody, and *generate, sing, rewrite*. Stage 7 is Pattison's stability/motion. Stage 8 is power progressions by colour, the "50s swap", reharmonisation, bridge away/away, jazz extension, groove swap. Stage 9 is boxes, travelogue check, you-I-we & past-present-future, point of view, chorus types & title placement, **pyramiding**, plot progressions, second verse & bridge, tense, conversational pass. Stage 10 is pentatonic, blues, Mixolydian, Dorian, motion against the bass, bass strategies, modulation, and the Chord-Scale Map ("improvise, then write").

### An exercise (`sngExerciseHTML`)

`{id, title, source, purpose, instructions[], outputFields[], selfCheck?, toolLink?, constraints?, reflection?, levels?}`. The page shows **why**, a timing constraint if any, numbered instructions, optional **level** radios, a button that opens the **tool** it names (the Path *sends you to the workbench*), output fields as textareas (bigger for fields that sound like writing: "lyric/verse/chorus/song/output…"), **Save**, **Harvest to the Seedbank** (selected phrase, else the first line), an optional **self-check** checkbox, a free **Reflect** box, and **earlier versions** with one-click restore. Saving marks the exercise done, logs a session, and runs the badge check. Previous/next links walk the stage (crossing into the next stage).

Each stage also names a **stage song** — a small song to write on the Song Desk to use what the stage taught — and the **books** it draws on. Stage cards on the Path are "rooms of the house": dark until started, lit in proportion to the share done (`--lit`); every door opens (in order is best, nothing is locked).

### Badges (nine)

*First Bad Song* (exercise 0.4) · *Diver* (14 object-writing days) · *Six Weeks Deep* (42) · *Collider* (finish stage 5) · *Juggler* (stage 7) · *Home & Away* (stage 8) · *Storyteller* (stage 9) · *Process Writer* (first capstone song finished) · *Three Songs Strong* (three capstone songs / three finished). A toast announces each.

## 6. The Studio: thirteen tools

Each tool registers `{html(), bind(host)}` in `SNG_TOOL_VIEWS`; the page draws it inside the Studio and the Path links exercises to them.

| Tool | What it does |
|---|---|
| 🖊 **Object Writing Desk** | Timed sense-bound writing |
| 🎹 **Chord Lab** | Progressions in five key colours, played in 55 grooves |
| 🥁 **Groove Maker** | A rhythmic idea on a step grid |
| 🗺 **Chord-Scale Map** | Which notes each chord allows |
| 🎶 **Melody Sketcher** | Scale degrees over chords, developed by hand |
| 🎲 **Melody Generator** | An emotion → rules → six melodies |
| 📝 **Lyric Sheet & Structure Lab** | Stress, motion, stability, power positions, contrast |
| 🔤 **Rhyme Workbench** | Five rhyme types, consonant families, worksheets |
| 💥 **Metaphor Lab** | Collisions, identity, keys, linking qualities |
| 🎨 **Colour a Word** | One melody note, many chords: hear the word change |
| 📋 **Song Desk** | Brief, plot, boxes, sections, the rewrite |
| 🃏 **Writer's-Block Deck** | 24 technique cards for when you're stuck |
| ⏱ **Metronome** | A click and tap tempo |

### 6.1 The Object Writing Desk (Pattison)

Pick a prompt category — **what / who / when / where** (30 / 15 / 10 / 10 built-in prompts — "puddle", "lantern", "zipper"…) — or type your own; pick a time (**10 min / 5 min / 90 s**); press Start. **When time is up the page stops taking words, even mid-word** (`readOnly`, a "stopped" style) — the point is to stop. The seven senses (**Sight, Sound, Smell, Taste, Touch, Body, Motion**) sit beside the page to tick as you reach them ("sight and sound come first; smell, taste, body and motion are where the surprises are"). Afterwards you read it back and **harvest a hot spot** — select a phrase with heat in it and save it as a seed. Finishing a round marks today in the 42-day ring.

### 6.2 The Chord Lab (with the groove engine)

Choose a **key** (12) and a **key colour** — Major (bright, settled), Minor (dark, inward), Mixolydian (earthy), Dorian (cool, soulful), Blues (gritty, knowing). The colour's chords appear as a palette tagged by **function** — T (tonic, home), PD (predominant), D (dominant) — and a collapsible **colours outside the key** drawer offers borrowed/secondary chords (iv, ♭VI, ♭VII, II = V of V, III = V of vi, VI = V of ii, I7 = V of IV, ♭III) each with its reason. **Power progressions** per colour are one-click. Build up to **eight bars, one chord a bar**. Chords are Roman numerals that parse both ways (`♭VII`, `bVII`, `ii7`, `V7`, `viiø7`, `IVmaj7`…), with qualities from triads up to 7ths, sus, 6, 9, 13, add2.

The **Scale Lane** under the progression shows the Chord-Scale Map's first pick for each chord, with its reason on hover. Then **play it through the groove engine**:

- **55 styles in 12 families** — Pop (10), Rock (3), Soul/R&B (3), Hip-hop (3), Jazz (10, incl. swing four/Freddie Green, Charleston, reverse Charleston, anticipation comp, two-feel, stride), Latin (9, incl. son montuno 2-3 and 3-2 clave, bolero, habanera/tango), Brazilian (4: bossa, samba, baião, partido-alto), Caribbean (3), Funk (2), Country (3), Electronic (2), World (2), Blues (1). Filter by family and mood.
- Kachulis's four groove choices — **tempo, feel, rhythmic level** (thinner / as written / thicker, via `sngThin`/`sngThicken`), **rhythmic idea** — plus swing (50–75%), humanize, voicing (triad, add2, shells 1-3-7, rootless 3-5-7-9, stacked/gospel, tensions the scale allows), tone (piano / Rhodes / pad), bass generator (as the style plays it, roots, root-and-fifth, walking), "anticipate the next chord (an eighth early)", per-layer mute and volume for chords/bass/drums, A/B between two styles, and **Same chords, six grooves** (the six: pop ballad, rock straight, classic soul, jazz swing, bossa, reggae).
- **Save as my groove**, **Keep the progression** (to the Seedbank), **Export MIDI** (chords on channel 1, bass on 2, drums on 10, General MIDI).

**How it plays**: a lookahead scheduler — a 25 ms timer books whatever falls in the next 150 ms *on the AudioContext's own clock*, never `setTimeout` for a note, so the groove doesn't stumble when the page is busy. Sounds are synthesised (the house grand where loaded); patterns are "simplified standard versions — adjust by ear" and the room says so.

### 6.3 The Groove Maker

A **step grid** (16 steps a bar in 4/4; 6/8 styles use six per beat) with rows for chords, bass and each drum voice, started from a copy of a style so you can alter it. Grooves are named, listed in a picker (a first one, "My first groove", is made for you) and stored in `grooves[]` with their style, tempo, swing, progression and key; one can be played in the Chord Lab in place of the style ("Playing your own rhythmic idea from the Groove Maker… back to the style's").

### 6.4 The Chord-Scale Map (`CSM`, tool `chord-scale`)

Given a progression (presets like ii–V–I, minor ii–V–i), it picks for each chord a **scale from quality *and* function** (`sngScalesFor` uses key colour, the next chord and the chord's job), with a **reason** and an **outside level** you set — *chord tones → the scale → with tensions → altered → chromatic*. It shows the scale's roles per chord tone (`sngScaleRoles`), guide tones across the progression (`sngGuideTones`), and a card to deal yourself a chord. It is the same theory the Jazz Studio's generated soloist uses. It is "general jazz chord-scale pedagogy, not taken from the curriculum's books."

### 6.5 The Melody Sketcher and the Melody Generator

**Sketcher**: scale degrees over chords inside your range, developed by hand — **repeat, sequence, invert** (and more); a piano-roll view; play with or without the chords; export MIDI.

**Generator** — *rules and a dice, not a mind*. Pick an **emotion preset** (joyful, tender, melancholy, longing, hopeful/bittersweet, dreamy, bluesy, tense, triumphant, playful, dark, jazzy — each with a note saying what it assumes). The preset only **sets the controls**; every one can be changed:

- pitch source (major, minor, Dorian, Mixolydian, Lydian, Phrygian, harmonic minor, major/minor pentatonic, blues, or *each chord's scale from the Chord-Scale Map*), register, range (5–19 semitones), contour (ascending / descending / arch / inverted / zigzag / straight / leap-then-step), % steps, largest leap, % chord tones on strong beats, density, syncopation, phrase start (before / on / after the downbeat), phrase endings (resolved or open; which scale degrees), development (exact / varied / modified repetition, sequence, inversion, shorten-lengthen), novelty, chromaticism, optional "title on the downbeat", and a **lyric** (its syllables and stresses set the rhythm).
- **The mechanics**: the rhythm comes first (from the lyric's syllables and stress if given, else from the density and syncopation controls); then a **seeded random walk** proposes notes; **every note that breaks a hard rule is thrown back and drawn again**; each kept note carries the list of rules it satisfies. "**Explain this melody**" shows those lists and a **compliance panel** ticks the hard rules (every note inside the range; no leap wider than the max unless it's locked or by design; about the requested % of steps; phrase endings on the requested degrees). A big leap is followed by a step back; an unstable strong note resolves by step to a chord tone.
- **Six melodies at a time**, lockable note-by-note, seeded (same seed → same melody), playable over the Chord Lab's progression, saved to the Seedbank, exported as MIDI. Your own presets can be saved.

### 6.6 The Lyric Sheet & Structure Lab (`19-sng-h-lyric.js`)

Words are measured by rule: `sngSyllables` (heuristic counter), `sngScan` (stress per syllable — function words are weak, content words strong, and you can override marks), `SNG_ABSTRACT` / concrete hints for show-vs-tell, `SNG_CLICHES` and rhyme cliché pairs (heart/apart, fire/desire, love/above, …).

For each **section** (verse / prechorus / chorus / bridge / intro / outro) it computes Pattison's **stability** — four measurable elements, each marked stable or unstable with its reason:

1. **number of lines** — even closes, odd leans;
2. **line lengths** — matched in pairs or not;
3. **rhyme at the end** — does the last line rhyme back to an earlier one (resolved) or not (open)?
4. **rhyme type** — perfect rhymes outweighing imperfect (firm) or softer.

The **five elements** compared between sections: number of lines, line length, rhythm (stress density), rhyme scheme (computed as `abab`-style letters from the line endings), and rhyme type — and **contrast** is how many of those five differ between neighbouring sections. It also checks **point of view** (counts of I/we, you, he/she/they words), **tense** (past vs present by crude word lists — flagged as a heuristic), **show vs tell**, **clichés**, **power positions** (first line, trigger line before the chorus), and **conversational quality** (prepositions and conjunctions). Rhyme types in the Workbench: **perfect, family, additive/subtractive, assonance, consonance** with consonant families (voiced/unvoiced plosives, fricatives, nasals…) and a word pool drawn from a base list plus words you have used.

### 6.7 The Rhyme Workbench, Metaphor Lab, Colour a Word

- **Rhyme Workbench**: classifies a pair as **perfect** (same vowel, same consonants after it), **family** (same vowel, consonants from the same family), **additive/subtractive** (one consonant more or fewer), **assonance** (same vowel, different consonants) or **consonance** (different vowels, same consonants); builds worksheets (a column of words, rhyme pairs within and between columns, "rhyme as chords"); family-rhyme hunt; cliché detox.
- **Metaphor Lab**: four tabs — **Collisions** (an adjective that doesn't belong to a noun, drawn at random or typed, then a sentence — ninety seconds, object-writing style — that makes sense of it), **Identity** (three weights of "X is Y", "the Y of X", "X's Y"), **Keys** and **Linking** (qualities that connect two things). It proposes; *you* decide what each collision means.
- **Colour a Word**: hold one melody note on a word and change the chord beneath it — hear the word change. The hands-on version of Stage 8's "Color a Word / Color a Phrase".

### 6.8 The Song Desk (`19-sng-j-songs.js`)

A song: `{id, title, brief, status 'draft'|'finished', plot{type, steps[]}, boxes[], sections[{id, type, feel 'stable'|'unstable', lines[{text, stress?}], prog?, melodyId?}], rewrite{item:true}, versions[], pov, tense, capstone?, tenStep?, tenNotes{}, createdAt, updatedAt}`.

- **Brief**: what the song is for.
- **Plot**: Plot 1 (the situation → how it feels → what it means) or Plot 2 (then → now → next).
- **Boxes**: Stolpe's box plan for development.
- **Sections** with a stable/unstable intent; a progression and melody can be attached.
- **Rewrite Room**: the *rewrite checklist* (from the capstone) is shown with checks the room can run for you, by checklist index: **show before tell** (an image before the first abstract word), **trigger line** (the last line before the chorus), **point of view and tense** (≤ 2 POVs and not mixed), **clichés**, **stability matches the intended feel** (a section meant unstable that scores ≥ 0.6, or vice versa, is flagged), and **contrast** (≥ 3 of 5 elements differ between neighbouring different-type sections). The other items are yours to tick.
- **Versions**, and a **print view** (lyric with chords, plain serif page).
- **Ten Steps wizard** for capstone songs (see §7).

### 6.9 The Writer's-Block Deck and the Metronome

24 cards ("Change the chord order", "Set your title after…", each with a tool link and its source). The metronome clicks with tap tempo.

## 7. The Capstone and the Ten Steps

"Write three complete songs using the full Ten-Step process, then build your Songbook." The ten steps (Stolpe): destination-write and make external/internal columns → find rhyme pairs within and between columns → choose rhyme scheme and toggle pattern → add prepositions/conjunctions for conversational flow → choose a plot progression (1 or 2) → destination-write again in thought/feeling language → look for titles and write the chorus → write the second verse and prechorus → write the bridge → final touches: verbs, tense, point of view, conversational quality. The wizard stores a note per step (`tenNotes`), marks the song finished at step ten, and two or three finished capstone songs earn the last badges.

## 8. The Seedbank

Anything a tool makes can be kept: types **line, image, title, progression, groove, melody, metaphor, rhyme and voice memo**, with tags and a source (which tool made it). Filter by type/text; edit; play back (progressions/grooves/melodies re-sound from their data). Voice memos use `sngRecord()` — `MediaRecorder` where present (from `file://` Chrome asks), else an audio file can be chosen. The Seedbank is the connective tissue: Object Writing harvests lines/images into it, the Chord Lab keeps progressions, the Listening Room keeps "what to borrow."

## 9. The Songbook and the Listening Room

- **Songbook**: finished songs on a shelf of spines; drafts "on the desk"; **print the songbook** (all finished songs, one per page).
- **Listening Room**: analyse songs you love — *no lyrics are copied; note what the song does*. Fields: sections & bar counts, key & progressions (Roman numerals), title placement, power positions, the five elements per section, boxes & development, point of view, and "what to borrow" (which can be sent to the Seedbank).

## 10. The theory and audio underneath

- **Theory** (`19-sng-c-theory.js`) — plain functions of plain data; "nothing here draws or sounds": note names (flats or sharps), Roman numerals both ways, key colours with T/PD/D function, outside chords, voicings (`sngVoice` keeps voice-leading from the previous chord), the Chord-Scale Map (`SNG_SCALES`, `sngScalesFor`), emotion presets, pitch sources, contours, and a seeded RNG (`sngRng`, mulberry32).
- **Styles** (`19-sng-b-styles.js`) — one editable list: id, name, family, mood, BPM range/default, time signature, swing (0 or the long eighth's share 0.5–0.75), `drums{voice:[{t,vel}]}`, `bass{notes}`, `voicing{type,hits}`, feel, "try for", anticipation, voicing default, and `kit` (a voice sounded as another — brushes for a ballad's snare, a surdo for a samba's kick).
- **Audio** (`19-sng-d-audio.js`) — the lookahead groove engine described in §6.2; synthesised piano/Rhodes/pad, bass and drums; the same events feed the MIDI writer (`sngMidiBytes`/`sngMidiFile`).

## 11. How the Songwriting Studio connects to the rest of the house

- **Habits** — link a habit to the room (`linkedRooms: ['songwriting']`) and the fixture appears on Today; the habit-area pages for *craft* and *creative* habits link to the studio.
- **Purpose layer** — the global **P** (open the Purpose sheet) and **R** shortcuts are switched off on the writing, content, Repertoire, Jazz, Songwriting and Japanese pages, so typing a lyric never navigates away. The Muse (Inner Life) holds ideas separately from the Seedbank.
- **Quick add** — the page registers the contextual "+" with *Object writing*, *A seed* and *A new song*.
- **Tutorial** — worked example entries can be added from Settings → Worked examples and removed in one click.
- **Backup** — all state in `S.songwriting`; voice memos are device-local Blobs (`sngAudio`).

---

# Part III — Shared pieces and cross-room links

The two rooms stay two rooms: separate engines, separate state, separate looks. What joins them is one module, `src/19-studio-shared.js`, which loads after both, wraps their routes (`routes.jazz`, `routes.songwriting`) and draws over what they drew. Every rule below says what it does and where its edge is. The test that holds them all is `smoke-studio.js`.

## III.1 What was always shared

- **The Chord-Scale Map** is written once (`19-sng-c-theory.js`) and read by both rooms: the Songwriting Studio shows it and the melody generator draws from it; the Jazz Studio's soloist (`jzsSets`) calls it for scale choice and "inside to outside".
- **The groove engine** (songwriting) and the **backing band** (jazz) are *separate* engines: songwriting plays 55 styles from step-data patterns; jazz generates walking bass/ride/comping by rule for Siskind exercises and charts. Both are lookahead-scheduled on the Web Audio clock. The studio module does not merge them; it only *chooses band settings* for a progression handed across (III.5).
- **The engraver** (OSMD, lazy-loaded) draws the jazz exercises, the editor, Play-to-compose and the Repertoire. The Songwriting Studio's own view of a melody stays the piano-roll; "Show as notation" (III.8) opens a read-only engraving in a window and is the only place it uses the engraver.
- **Hearing the piano** (`19-listen-*`) is Jazz-Studio-housed but serves the whole house ("Everything downstream listens to this and never asks where a note came from"). "Check me on the piano" on a melody (III.8) is that same strip.
- **Tune Library vs Repertoire; the 42-day ring vs habits; jazz decks out of the Study Deck.** These separations are deliberate and unchanged. A tune handed across is a *synthetic* tune that lives for the page (ids `studio-lab`, `studio-song-<id>`, `studio-seed-<id>`) and is never written to the tune library.

## III.2 The one small row: `S.studio`

One meta row (`META_KEYS` includes `'studio'`), versioned and additive: `{v: 1, bar: {collapsed}, bridgesDismissed: {key: true}, practiceToWriting: false, vocalRangeNoticeSeen: false}`. It holds **no user content**. A backup without the row restores and means the defaults; the row is written the next time anything saves. `studioState()` is the only reader. Seed `source` (III.8) is the only other field that changed shape, and it is additive too (below).

## III.3 The studio bar, minutes, and one vocal range

- **The bar** sits above each room's own header: the two rooms as tabs; *today's minutes in each* (and the week in the tooltip), read from the Time-tracking clock — entries whose `feature` is the room; and "Continue in the other room: …" (from Jazz: the Songwriting morning page or the next Path exercise; from Songwriting: *Today's plan — N of M done*, read by peeking at the stored plan, never by generating one). It folds to one word (`bar.collapsed`). It changes nothing in either room.
- **Minutes.** The Songwriting Studio used not to touch the clock. Its *work* pages (an exercise, a tool, a song, the Capstone) now ask the clock to start the way Jazz exercise pages always did — only when automatic tracking is on and nothing else is running; Today, the Path and the Seedbank start nothing. Leaving the room stops its own entry (`timeAutoStop`).
- **One vocal range.** The Jazz Studio keeps `S.jazz.settings.vocalRange {lowMidi, highMidi}`; the Songwriting profile keeps `lowNote`/`highNote`. `studioSetVocalRange()` writes both; everything that warns about range (the Melody Sketcher and Generator, the Jazz "sing it" panel, the Song Desk) reads `studioVocalRange()`. The Songwriting first-visit card is prefilled from the Jazz range. If old data holds two *different* ranges, a one-time notice asks which both should use (or "Keep both"), and `vocalRangeNoticeSeen` stops it asking again. Nothing is changed without that choice.

## III.4 Hand-offs: `?from=&ref=`

- **The address.** `studioLink(target, ref, from)` adds a query suffix: `#/jazz/playalong?from=songwriting&ref=lab`, `…?ref=song:<id>`, `…?ref=seed:<id>`, `#/songwriting/tool/chord-lab?from=jazz&ref=tune:<id>:<startBar>-<endBar>` or `…ref=exercise:<id>:<key>`. The router's `parseHash()` now returns `{name, params, query}` and every route ignores the query, so a refresh and Back work.
- **Resolution.** `studioReadHandoff()` parses and validates; `studioResolveRef()` looks the reference up in persisted data (the Chord Lab's last settings, `songs[]`, `seeds[]`, the tune database, the exercise catalogue). If it no longer resolves (a deleted song), the page shows a calm notice and opens as usual.
- **Nothing is written by a hand-off.** The target decides what to load; user data changes only when the person presses Keep/Save in the target room. The one exception is the Chord Lab's *working progression*, which is scratch by nature (and applied once per address, stamped in `S._studioApplied`, so a redraw does not re-apply it).

## III.5 Progressions across the door

- **Two converters** (`studioRomanToSymbols`, `studioSymbolsToRoman`) carry a progression between the Chord Lab's Roman numerals (with a key and a colour) and the Jazz Studio's chord symbols, on theory both rooms already have (`sngParseRoman`, `jazzParseChord`). They never throw — a token they cannot read comes back as the text it was. Symbols come back **ASCII-flat** (`Eb`, `Bb7`); `studioPretty` prints ♭/♯.
- **Edges.** The Chord Lab holds eight bars, one chord to a bar: a longer selection is cut to the first eight, and a bar with two chords gives its first — and the page says so.
- **Into the play-along.** From the Chord Lab, a Song Desk song or a seed, "Play along in the Jazz Studio" opens the play-along on a synthetic tune. The band follows the groove you chose where the table `STUDIO_GROOVE_TO_BAND` says so (the Jazz-family grooves: Charleston, reverse Charleston, two-feel, walking, swing, ballad, bossa); any other groove is read by its *name* the way the band's own defaults read an exercise's name (bossa/latin → bossa, ballad → ballad, otherwise swing) and the page says "plays its own defaults for this groove". Band settings live in memory (`S._studioPlay`), not in the tune's saved settings.
- **From Jazz into the Chord Lab.** A tune (and the bars you are looping), or an exercise that *is* a progression (a ii–V–I, the minor ii–V–i, the blues, rhythm changes — in the key shown), gets "Open in Chord Lab" / "Write with this" / "Keep progression in Seedbank". An exercise that is not a progression shows no button.

## III.6 One analysis, two vocabularies

`studioFindPatterns` / `studioAnalyseSymbols` hold the Jazz Studio's pattern finder (ii–V–I, minor ii–V–i, tritone substitution, turnaround, blues and rhythm-changes spans), moved out of `jazzTuneAnalysis` so both rooms read the same rules. **The Jazz output is exactly what it was** — `smoke-studio.js` compares the spans bar-for-bar on So What, Blues for Alice, Anthropology, Oleo and Autumn Leaves, and the whole 76-tune analysed set was compared before and after. The colours are one table (`STUDIO_PATTERN_COLOURS`, which fills `JAZZ_TUNE_PATTERNS`). In the Chord Lab and on a Song Desk section, the progression is coloured with the same patterns, each with its reason on hover and, where one exists, "Practise this pattern in all twelve keys" linking to the matching Jazz exercise (`STUDIO_PATTERN_EXERCISE`).

**The Listening Room from a Real Book tune.** "Start from a Real Book tune" searches the 917 entries and *prefills* sections and bar counts, key, and the chords as Roman numerals (by the converter); the Jazz tune page has "Analyse as a songwriter". Nothing is kept until "Keep as a listening note", and then only the tune's **id** and the person's own fields are stored: what the Jazz Studio found is read live from the tune each time. The database has no lyrics, and none are added. An entry the Jazz Studio has not analysed (most of the 917) brings its title only.

## III.7 "In the other room": curriculum bridges

`STUDIO_BRIDGES` is a short, static, editable list (15 entries) of where one room's lessons meet the other's — a stage, exercises, a tool, a tab or a page on each side, one sentence of *why*, and a `direction`. Each is checked against the real catalogues by the smoke test (every id resolves; every exercise is in the stage it is filed under). A small collapsible card **"In the other room"** shows the bridged items with their reason and a direct link on: each open Jazz stage on the roadmap; a Jazz exercise page (the entries naming that exercise, else its stage's) and the Mindset page; a Songwriting stage, exercise, tool, Listening and Capstone page. **It is advice only**: it never affects readiness, the daily plan, stage lighting or a badge. "Hide for this stage" is remembered per place in `bridgesDismissed` and leaves a "show" link.

*Names that differ from the brief:* in the catalogue, "Singing While You Play" is stage `DT`; the voice stages `V1`–`V6` are scat syllables … writing for voices. The bridge uses `DT` for singing-while-playing and `V6` for writing for voices.

## III.8 The Seedbank as the shared shelf

- **Source can say where it came from.** A seed's `source` was always a string (the tool). It may now also be `{room: 'jazz', kind: 'tune' | 'exercise' | 'recording' | 'compose' | 'page', id, bars?}`. Both forms are read everywhere (`studioSeedSource`); old strings are never rewritten. A seed from Jazz shows a small 🎷 and "Open where it came from".
- **Jazz "+".** Every Jazz page's contextual "+" offers **A seed (Songwriting Seedbank)**: a small form prefilled from where you are (the tune and the bars you loop, or the exercise in the key shown) with a source that points home. Nothing is kept until "Keep it". The Songwriting room's own quick-add entries are unchanged.
- **Melodies as seeds.** A melody seed carries `data.melody = {notes: [{midi, t, d}], keyPc, colour, bpm, beats, prog}` (times in beats) — what the Melody Sketcher keeps. So it re-sounds ("▶ hear it"), opens in the Melody Sketcher (a *copy* is made when you press it, not before), is shown as notation, and is checked on the piano. **Play to compose** gains "Send to Seedbank as a melody" (the top note at each onset, each as long as it sounds); "Save to Repertoire" is exactly as it was. The Sketcher's own "Keep in the Seedbank" now carries its notes too.
- **Check me on the piano / Show as notation** are on a Seedbank melody and on a Song Desk section's melody. *Show as notation* writes MusicXML from the notes (`studioMelodyXml`: one treble staff, a sixteenth grid, notes tied over bar lines) and draws it with the existing lazy engraver in a window — read-only, no editor, no new dependency. *Check me on the piano* opens the existing Play-it strip on the same engraving.
- **Recorded takes are never copied into JSON.** "Keep as a voice-memo seed" on a Jazz take stores a **reference** to the Jazz recording (`audioRef: {store: 'jazzAudio', id}`) and plays it from there; the Blob never enters the seed. If the take is deleted in the Jazz Studio, the memo says "that take is no longer on this device" instead of failing. *Choice:* reference, not Blob-to-Blob copy, because it keeps a single copy of the sound and one place to delete it.

## III.9 The opt-in practice-to-writing loop

One setting, off by default — **"Let my practice suggest writing prompts (and vice versa)"** (`practiceToWriting`; the switch sits at the foot of Songwriting Today and of the Jazz plan page). When on:

- **Songwriting Today** shows **From your jazz practice**, built by rule from the Jazz Studio's *current module* (the first module of the stage you are on whose exercises are not all mastered) and the keys you own on its exercises (`S.jazz.progress[id].keys`), e.g. "Your current module is Shells & one-handed voicings. Write a four-bar progression that lands a ii–V–I under the title line, in a key you already own (E♭, A♭)", with a link into the Chord Lab (prefilled when one of the module's exercises is a progression). **No jazz progress, no card.** The sentence comes from a small table (`STUDIO_MODULE_PROMPTS`) keyed on the module.
- **The Jazz plan page** shows **Optional: today's songwriting warm-up** (the Kachulis warm-up, rotated by day of the month) as a link. It is drawn *outside* the generated plan and its minutes; `generateDailyPlan` is not read differently and its output for a fixed state and date is unchanged (the smoke test holds three plans to a recorded signature).

Independently of the setting, the Chord Lab's **key picker marks keys where you already own the related Jazz pattern** with a small ● (ii–V–I for major, the minor ii–V–i for minor, the 12-bar blues for blues), with the tooltip "You own ii–V–I in this key (Jazz Studio)". Information only.

## III.10 One vocabulary for the shared pieces

Presentation only; each room's logic is its own.

- `studioSeedControl` — "Seed 48213 · Same again · New" for the Jazz generated soloist and the Melody Generator (same seed, same output, as before).
- `studioExplainPanel` — the per-note rules behind "show the solo" and "Explain this melody": one layout, headed *what it measured*.
- `studioProgress` — the bar for advice, not locks: the Path's stage cards and the Jazz readiness count use the same colour ramp (`--studio-ramp-*`) and the tooltip "Advice, not a lock."
- `studioSourceChip` — a citation as one chip (book · unit/chapter · page): Jazz references and golden tips, Songwriting exercise sources and stage books.
- `studioHonestyBadge` — one badge for "written from a sentence", approximate/unverified notes, "heuristic" (the Songwriting checks) and "simplified standard version" (the grooves).
- `studioDeviceLocalNote` — the same words wherever a recording is made or kept: "Kept on this device only. Not in your backup — export notes, MIDI or MusicXML to take it elsewhere."
- `studioCardDeck` — a shared frame for the Jazz flashcards, the lead-sheet cards and the Writer's-Block Deck (what is on a card, how it is dealt and how it is graded stay in each room). *Not done:* the golden tips keep their own list layout.
- `studioTapTempo` — one tap-tempo function: the Chord Lab and Metronome use it, and the Jazz band's tempo boxes gained a tap button. *Not done:* the two click engines stay separate.
- **Habit fixture** — `habFixturesForRoom` renders the same component on `#/jazz/plan` and on Songwriting Today.

---

# Part IV — Things worth knowing

1. **Both rooms are guided but never gating.** Readiness (jazz) and stage-lighting (songwriting) are advice. The only gate is the optional Jazz setting "one stage at a time" (`settings.gate`, off). The cross-room cards (III.7, III.9) are advice in the same way and never move it.
2. **Key ownership is earned by evidence in the Jazz Studio.** The cards' three-nailed rule and the Play-it strip's three-passes rule are the two "automatic" routes; the grid can be hand-marked too, but then it is your word against the cold ask.
3. **Jazz exercise IDs are permanent.** Everything you practised follows the ID across the v3 re-homing; a record whose exercise left the book is kept.
4. **Where the v3 document and the books disagree, both are shown** (`#/jazz/about`), not silently merged.
5. **Some notation is "from a sentence."** Document entries that only *describe* a score are written out in `19-jazz-o-v3build.js` and carry an accuracy mark saying so; the book-checked ones have their own accuracy marks. `noteAccuracy` warnings appear where notes aren't verified against the printed page.
6. **The Songwriting checks are heuristics.** Syllable counting, stress marking, POV/tense and "abstract" word lists are simple rules (and say they are). They are there to point, not to judge: "Every check is a rule that can be read here. None of them knows what a line means; each says what it measured, and the writer decides."
7. **The melody generator and the soloist are not AI.** Same seed, same output. Both show their rules per note.
8. **Recordings never go in the backup.** Jazz recordings (`jazzAudio`), takes and Play-to-compose sound, and songwriting voice memos (`sngAudio`) are device-local; export the notes/MusicXML/MIDI if you want them elsewhere. A seed that points at a Jazz take holds only the pointer (III.8); both rooms say the same sentence about it.
9. **Synthesised sound is a sketch.** The room says its drum and bass patterns are "simplified standard versions" and the synthesised voices are not a production tool; the *grand piano* is the exception (real samples).
10. **The microphone is optional.** MIDI keyboard, on-screen keys and "tell me how it went" all work for the jazz cards and Play-it features; the mic is what makes an acoustic piano count.
11. **Not every module of the Jazz Studio has full per-exercise enrichment.** Stages P0–12 carry full per-exercise data; the newer stages (6A, 13, 15, V1–V4 in the catalogue) carry stage-level data and fall back to it (`jazzMergeEnrichment`) for exercises without their own.
12. **Time-based numbers are conventions.** The "14-day unit" and the stage hours come from Siskind's units and the v3 document's own "~N weeks"; the room's pace multipliers (×0.5 / ×1 / ×1.5) rescale them, they don't change the teaching.

---

# Part V — Where to find things

| You want… | Look in |
|---|---|
| Jazz room page, routes | `src/19-jazz-page.js` |
| State, key ownership, flashcard grading/dealing | `src/19-jazz-data.js`, `19-jazz-cards.js` |
| Engraver + catalogue | `19-jazz-a-gen.js`, `-b-p0.js`, `-c-stages.js`, `-l-catalog.js`, `-m-materials.js` |
| v3 document, placement, notation | `19-jazz-o-v3doc.js`, `-o-v3.js`, `-o-v3build.js`, `-o-v3ui.js` |
| Tiers, modules | `19-jazz-v-tiers.js`, `19-jazz-x-modules.js` |
| Daily plan, pace, readiness, session | `19-jazz-w-dayplan.js`, `19-jazz-f-plan.js`, `19-jazz-g-planpage.js` |
| Tunes | `19-jazz-p-tunedb.js`, `-q-tunes.js`, `-r-tunesui.js` |
| Band, key cycling, solo | `19-jazz-s-audio.js`, `-y-backing.js`, `-z-band.js`, `-zz-solo.js`, `-x-practice.js` |
| Lead-sheet cards | `19-jazz-u-leadcards.js` |
| Editor | `19-jazz-j-editor.js`, `-k-editorui.js` |
| Piano input, Play it, compose, ear | `19-listen-a…i-*.js` |
| Songwriting curriculum data | `19-sng-a-data.js` |
| Songwriting styles / theory / audio | `19-sng-b-styles.js`, `-c-theory.js`, `-d-audio.js` |
| Songwriting state, page, tools | `19-sng-e-state.js`, `-f-page.js`, `-g-tools.js`, `-h-lyric.js`, `-i-melody.js`, `-j-songs.js` |
| The studio module: bar, one vocal range, hand-offs, converters, shared analysis, bridges, Seedbank shelf, the practice-to-writing loop, shared pieces | `src/19-studio-shared.js` (its CSS block is marked `studio synergy` in `src/02-css-sections.html`) |
| The router's query suffix | `parseHash()` in `src/04-core.js` (`{name, params, query}`) |
| The `S.studio` row and the backup | `META_KEYS` in `src/06-db.js`; `studioState()` |
| Where each room calls the shared module | Jazz: `19-jazz-page.js` (Write with this, references), `-q-tunes.js` (analysis), `-r-tunesui.js` (tune buttons), `-t-tools.js` (play-along, recorder takes), `-y-backing.js` / `-z-band.js` (band, tap tempo, seed control), `-zz-solo.js` (explain panel); Songwriting: `19-sng-f-page.js` (first visit, Seedbank), `-g-tools.js` (Chord Lab), `-i-melody.js` (Sketcher, Generator), `-j-songs.js` (Song Desk, Listening Room); Play to compose: `19-listen-h-composeui.js` |
| Tests | `smoke*.js` (the songwriting and jazz smokes; `smoke-studio.js` for everything in Part III; `tools/listen-harness.js` for piano-input accuracy) |

*Companion docs:* `docs/GUIDE.md` (every area of the site), `docs/INNER-LIFE.md` (the inward-facing rooms), `docs/PURPOSE.md` (the Purpose layer).
