# Score Study — the pre-build report (Step 1)

Before any code: what the Repertoire room already is, how the house around it
works, what the fallback database can do, whether the engraver can give
note-level positions, the file names, and the schema change. **Nothing below
has been built. The schema change waits for your approval** (tasks #236–#239
are queued behind it).

---

## 1. The Repertoire room, in full

### How a score gets in
- **Upload:** the "Add a score" control in the Repertoire library
  (`src/19-score-page.js`) takes `.musicxml`, `.xml` and compressed `.mxl`.
  `readMusicXmlFile` in `src/19-score-data.js` unpacks `.mxl` with its own
  small zip reader (`zipEntries` / `zipRead`, using `DecompressionStream`
  for deflate). It follows `META-INF/container.xml` to the root file, and a
  `.mxl` renamed `.xml` is still recognised as a zip.
- **Title and composer** come from the file (`musicXmlTitle`). The period is
  guessed from the composer (`scorePeriodGuess`).
- **Only MusicXML.** There is no PDF or image import and no OMR.

### How it is stored
- **One row per score** in the `scores` store (`'id, title'`), with the whole
  MusicXML text in `x.musicXml`. The rows are loaded into the in-memory state
  `S.scores`, like every other array store.
- **Recordings** (the audio behind a sync map) are Blobs in `scoreAudio`
  (`'id, scoreId'`). They are kept out of backups and out of the two-machine
  sync.

### How it is rendered
- **Engraver:** OpenSheetMusicDisplay, inlined into the single file and
  started lazily (`src/19-score-osmd.js`). There is no CDN at runtime.
- **Display:** zoom, bars per line, a page-by-page read mode, hidden parts,
  and jump to measure.
- **Geometry:** `plxGeometry` (`src/19-score-play.js`) reads OSMD's
  `GraphicSheet.MeasureList` and returns, for each written bar, its rectangle
  and the x of every onset in it. The overlay code in `src/19-score-osmd.js`
  walks the same structures down to the staff entries.
- **Note list:** `musicXmlTimeline(xml)` (`src/19-score-play.js`) is the
  parser the player uses. For every note it gives the quarter-note onset, the
  position in the bar, the MIDI pitch, part, staff, voice, duration, ties and
  chord membership. It also carries repeats, endings, time signatures per
  measure and tempo marks.

### The data model: fields on each `scores` row
| Field | What it holds |
|---|---|
| `id, title, composer, period, createdAt, lastOpened, familiar, hidden` | Identity and library state |
| `musicXml, totalMeasures, instruments` | The notation itself |
| `sections[]` | Practice sections: `id, name, startMeasure, endMeasure, status, comfortTempo, targetTempo, practiceCount, lastPracticedDate, notes, color` |
| `practice[]` | One row per sitting: `id, date, at, minutes, sectionId, sections[], tempo, quality, focus, discoveries`, plus the ensemble fields `withPartnerPlayback, tempoPercent, finalGuideLevel, loopsCompleted` |
| `pins[]` | Measure-anchored notes: `id, measure, text, color, ruleId, createdAt`. A pin can be promoted to a cross-score "rule" (`src/19-score-rules.js`). |
| `fingerings` | Fingering marks per note |
| `chordOverrides` | Your corrections to the chord symbols read off the notes (`src/19-score-chords.js`) |
| `overlays` | Note names, scale degrees and beat counts on or off |
| `metronome` | Metronome settings (`src/19-score-metronome.js`) |
| `transpose` | Transposition (`src/19-score-transpose.js`) |
| `playback`, `ensembleSettings` | The player bar and the parts panel (`src/19-score-ensemble.js`) |
| `recordings[]` | Sync maps, each with a `reading` and a performance memory (`src/19-sync-*.js`) |
| `zoom`, `barsPerLine` | View settings |

**Relationships.**
- A section, practice row, pin or recording refers to its score by being
  nested inside it.
- A practice row refers to sections by id.
- A recording's audio is found by `scoreAudio.scoreId`.

### Every existing practice feature
- **Library:** the list, the familiar/doubt state, readiness and rust, the
  suggestions, and the setlist with a print view.
- **Sections:** named measure ranges with a status and comfort and target
  tempos. The focus/overlay mode dims everything outside the section.
- **Practice log:** minutes, tempo, quality, focus, discoveries and the
  per-section history. The tempo chart has a "with partner" line.
- **Pins, rules and the notebook:** pins at a measure, rules shared across
  scores, and the notebook view that gathers them (`scoreNotebook`).
- **Markings:** fingerings, the cursor, and printing.
- **Reading aids:** note names, scale degrees and beat counts, plus chord
  symbols read off the notes, with overrides.
- **Transposition.**
- **The player bar:** tempo %, count-in, click, loop (the focus section or a
  two-click range), start from the bar under the cursor, keyboard control,
  auto-scroll, and the GM/orchestra instruments.
- **Ensemble play-along:** the parts panel (Mine, Partner, Show & Play,
  Silent), the guide fade per loop, the partner cue strip, fermata holds,
  per-section tempo overrides with rit. and accel. ramps, tap-to-lead, and
  Web MIDI wait mode.
- **Recordings:** the audio aligned to the score (sync map), listen-along
  with the lit bar, the performance memory (tempo and dynamics per bar), and
  "play it as I played it".

**For Score Study, the parts that already exist are:**
- loops and sections;
- a tempo-over-time record: the recordings' tempo curves, which a tap-along
  take can sit beside;
- measure-level annotation (pins);
- chord reading (`19-score-chords.js`, which is simple symbol spelling, not
  Roman-numeral analysis).

## 2. The house around it

- **Build.** `build.js` concatenates `src/` alphabetically into one
  `<script>`. The CSS lives in `src/02-css-sections.html`. Large assets are
  embedded as `<script type="text/plain">` blocks: OSMD, the grand piano, the
  GM set and the orchestra.
- **Rooms and routing.** Each room is a `routes.<name> = (root) => …`
  renderer. The hash router calls it, and `19-nav.js` holds the sidebar zones.
  Repertoire is `routes.score`.
- **Shared entry model.** `S.entries` holds typed entries (journal,
  gratitude, lifeevent and others). Each one carries
  `links:{stages, threads, values, visions, skills, projects, people}`, so one
  entry shows up in several rooms. The "reflect" button would create one of
  these, of the journal type, with the score and measure in `extra`.
- **Styling.** Room CSS is scoped by a page class (`.score-page …`) in
  `02-css-sections.html`. The page themes supply the colour tokens. Room
  headings use the site's serif and the body text its sans.
- **Database layer.**
  - Everything lives in memory in `S`. `load()` hydrates `S` from Dexie
    stores.
  - `persist()` writes back **only the stores whose JSON changed**. It
    rewrites a dirty store whole (clear, then `bulkPut`).
  - Only `META_KEYS` and `ARRAY_STORES` are saved. `build.js` refuses to
    build a state key that nothing saves.
  - Ids are short random strings (`uid()`), not auto-increment.
- **Knowledge Tree:** **it does not exist yet.** Its own pre-build report is
  task #230. Section 7 describes the hook left for it.

## 3. What the fallback database supports (MiniDexie, `src/06-db.js`)

| Level | Methods |
|---|---|
| **Database** | `version(n).stores(schema)`, `open()`, `transaction('r' \| 'rw', tables, fn)`, `delete()`, `tables` |
| **Table** | `get(key)`, `put(obj)`, `bulkPut(arr)`, `delete(key)`, `bulkDelete(keys)`, `clear()`, `toArray()`, `count()` |
| **Index queries** | only `where(index).equals(v).toArray()` |

**Not supported:**
- `add`, `update` and `modify`;
- `++id` auto-increment;
- compound indexes;
- `between`, `anyOf`, `orderBy`, `filter` and `each`;
- Dexie's `upgrade()` callbacks.

**Consequence.** The new stores use string ids from `uid()`, and every query
happens on the in-memory arrays. That is how every room works already, and it
means the fallback needs no new methods. A migration is done the way the
house does all of them: new stores are declared at the next version, and
`migrate()` fills in defaults on load.

## 4. The renderer: reuse it, don't bundle a second one

OSMD can expose note-level positions, so it is reused. **No second renderer,
and no added size.**

**What OSMD exposes.**
- Its graphical model goes `MeasureList[bar][staff]` → `staffEntries` →
  `graphicalVoiceEntries` → `notes`.
- Each graphical note has a `PositionAndShape` (x, y, bounding box) and a
  `sourceNote` with its pitch, the length, the voice and the staff (parent
  `SourceMeasure`, parent staff, `voiceEntry.ParentVoice.VoiceId`).
- `plxGeometry` already walks this far, down to the staff entry.
  Annotations need one more level.

**How annotations will be anchored.**
- The anchor is `{partId, measure (written index), staff, voice, onset (in
  quarters, as a fraction), noteIndex in the chord from the bottom, pitch}`.
- `musicXmlTimeline` produces exactly these fields per note, so an anchor
  comes from the data and never from pixels.
- At draw time, the anchor is matched to the graphical note with the same
  measure, staff, voice, onset and pitch. Positions are recomputed after
  every render, zoom or resize, as the lit bar already is.

**The parser.** Analysis needs spelled pitch (step, alter, octave), which
`musicXmlTimeline` does not keep: it goes straight to MIDI. Phase 1 adds the
spelling to its events as extra fields. The player ignores them.

## 5. The new files

The prefixes sort after the DB layer and beside the other Repertoire parts:
`19-score-*`, lettered `19-score-s*` so they sit together and after
`19-score-rules.js`.

| File | Contents |
|---|---|
| `src/19-score-sa-model.js` | Data defaults and migration helpers; RomanText read and write |
| `src/19-score-sb-key.js` | Key profiles (KK, TKP, Aarden-Essen, Bellman-Budge), windowed KS correlation, Viterbi with a modulation penalty |
| `src/19-score-sc-chords.js` | Segmentation, spelled-pitch chord identification, NCT marking, Roman numerals, function and functional-bass labels |
| `src/19-score-sd-worker.js` | The inline-blob Web Worker running `sb` and `sc` (the pattern of `19-sync-c-worker.js`) |
| `src/19-score-se-cadence.js` | Cadence finder, units and sections, phrase model, norm flags |
| `src/19-score-sf-writeup.js` | Rule and template write-ups, and the annotation proposals |
| `src/19-score-sg-tension.js` | Tension estimate, arrival weights, phrase arches |
| `src/19-score-sh-takes.js` | Tap-along capture, tempo, the overlay and comparison charts (SVG) |
| `src/19-score-si-notes.js` | Pinpoint annotations: anchors, the inline/pin display, the popover |
| `src/19-score-sj-schemata.js` | Schema detector, reduction view, Neo-Riemannian fallback |
| `src/19-score-sk-study.js` | The Study tab UI inside the existing score view |
| `tools/analyze.py` | The companion (AugmentedNet → `.rntxt` and CSV). Not part of the build. |
| `tests/fixtures/study/*.musicxml` | The 3–4 fixtures, with `smoke239.js` as their test |

## 6. The schema change: v17 → v18

### Why the data model must adapt

The spec's model has 14 tables, most keyed `'++id'`, with one row per chord
label, cadence, measure review and so on. Two facts about this house change
that:

1. **No `++id` in the fallback.** It would need `uid()` string ids anyway.
2. **`persist()` rewrites a dirty store whole.** With one row per chord
   label, a single "accept" click on a 200-bar score would clear and rewrite
   every chord label of every analysis in the house. That cost grows with the
   library.

### The proposal

Group what is written together, keep apart what grows independently, and keep
the add-only records in stores of their own.

```js
// src/06-db.js — added to DB_SCHEMA (existing stores untouched)
analyses:         'id, scoreId, createdAt',   // one row per analysis VERSION
writeups:         'id, analysisId, sectionId, createdAt',   // add-only versions
takes:            'id, scoreId, createdAt',   // tap-along captures
performanceNotes: 'id, scoreId, analysisId',  // pinpoint annotations
ambiguities:      'id, scoreId, createdAt',   // add-only decision log
omrReviews:       'id, scoreId',              // one row per score: a status per measure

db.version(18).stores(DB_SCHEMA);   // … v18 score study (new stores only; nothing existing changes)
// + the six names appended to ARRAY_STORES, so they are saved, backed up and synced as text
```

### An `analyses` row

It carries the spec's granular tables as nested arrays. The field names are
the spec's.

```js
{ id, scoreId, version, parentId,            // parentId: the version this one was revised from
  origin: 'auto' | 'companion' | 'expert-import' | 'mine',
  frozen: false,                              // a frozen version is never edited; revising one creates a new row
  createdAt, updatedAt, settings: {profile, penalty, cadenceDefinition: 'strict' | 'broad', …},
  rntxt: '…',                                 // the harmonic labels as RomanText (export and import format)
  keySpans:    [{id, startMeasure, startBeat, key, confidence, alternatives[], status}],
  chordLabels: [{id, measure, beat, roman, function, functionalBass, confidence, alt, status, nct[]}],
  cadences:    [{id, measure, beat, type, level, limitedScope, confidence, status}],
  units:       [{id, startMeasure, startBeat, endMeasure, endBeat, kind, status}],
  sections:    [{id, startMeasure, startBeat, endMeasure, endBeat, label, formalRole, parentId}],
  schemata:    [{id, startMeasure, endMeasure, name, placement, status}],
  structLine:  [{id, measure, beat, staff, voice, pitch}],
  tension:     {method, params, curve: [{measure, beat, value}]} }
```

### Why this shape

- **Add-only versions still hold.** Confirming labels edits the current draft
  version. "Save this interpretation" freezes it. The next edit starts a new
  row copied from the frozen one, with `parentId` pointing back. No version is
  ever overwritten or deleted by the room.
- **Decisions are add-only in their own store.** Every override and every
  choice between readings appends to `ambiguities`, with the competing
  readings, your choice and the optional "why?". Rows are never edited.
  The same holds for `writeups` versions.
- **The migration.** New stores are empty at v18, and `migrate()` needs
  nothing beyond defaults for them. No existing store, row or field is
  touched. The Repertoire scores, the practice rows inside them, the pins,
  the recordings and `scoreAudio` stay byte-for-byte as they are.
- **Backup and import.** The six stores are text, so they go into the JSON
  export and import through `ARRAY_STORES` with no special case. The import
  validation still lists only the older required stores, so an old backup
  (without these stores) restores cleanly and simply has no analyses.
- **Deleting a score.** Its analysis rows are *not* deleted with it. They are
  kept (add-only) and marked orphaned, and undo restores the link. Say if you
  would rather they go with the score.

### An alternative, if you want it

The spec's granular tables can be kept literally (`keySpans`, `chordLabels`
and so on, as separate stores with string ids). It works with the fallback.
The cost is the whole-store rewrite described above, which grows with the
library. I recommend the grouped shape.

## 7. Integration points, and anything that conflicts

- **Study is a tab in the existing score view,** beside the others, and reads
  the same `scores` row. There is no new list or upload flow.
- **Sections are not merged.** Formal sections in an analysis are not
  practice sections. "Practise this section" on a write-up finds or creates a
  practice section with the same measure range and starts the existing loop
  on it.
- **Annotations are new; pins are left alone.** Pins stay measure-level.
  Performance notes are note-level and live in `performanceNotes`. Both show
  in the practice view under one "Notes" layer toggle, with filters by hand,
  category and importance.
- **Takes** are recorded against the score. A take made during a logged
  sitting stores that practice row's id.
- **Reflect** creates an `S.entries` journal entry with
  `extra: {scoreId, measure, analysisId}` and the score title in the body. It
  opens in the Journal.
- **The Knowledge Tree hook.** "Send to the Tree" calls
  `typeof knowledgeTreeInbox === 'function' && knowledgeTreeInbox({text,
  source: {room: 'score', scoreId, measures}})`. When the room doesn't
  exist, the button is hidden.
- **Synced playback.** The spec asks for a "simple synth; no external
  samples". The house already has an offline, embedded player with the grand
  piano and the orchestra. The proposal is to reuse that player (the current
  chord lit, and its function shown) rather than add a second synth. No
  network is involved either way.
- **OMR.** The OMR route is documentation plus the per-measure review pass
  (`omrReviews`), as asked. Nothing runs OMR in the site.
- **Service worker and `file://`:** unchanged.

---

**Waiting for approval on:**
1. the grouped v18 schema, or the literal one;
2. whether analyses go with a deleted score, or are kept;
3. reusing the existing player for synced playback instead of a simple synth.
