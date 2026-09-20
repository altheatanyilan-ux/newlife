/* ============================================================
   STAGES 0 TO 12 — the curriculum, out of Siskind's three books.

   Kept as it arrived, with two changes: the module.exports tail is gone,
   and the one-letter alias it used for the generator is spelled JZG. One
   letter is a fine name inside a file and a bad one in a house where every
   file shares a scope with every other.
   ============================================================ */

/**
 * ============================================================================
 * STAGES 0–12: SISKIND-BASED CURRICULUM (Books 1, 2, and 3)
 * ============================================================================
 *
 * Adds static generator methods and a comprehensive catalog covering
 * Stages 0 through 12 of the Jazz Practice Studio curriculum, based on
 * Noah Siskind's "Jazz Piano Fundamentals" series.
 *
 *   Book 1  →  Stages 1–7   (chord construction through altered dominants)
 *   Book 3  →  Stages 8–12  (modal jazz through odd time signatures)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * INTEGRATION INSTRUCTIONS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1.  Load JazzExerciseGenerator.js first (it defines the class and all
 *     shared infrastructure: keyPC, transpositionFromC, midiToXmlPitch,
 *     generateSingleNote, generateChord, generateMelodyMeasure,
 *     generateMeasure, wrapDocument, etc.).
 *
 * 2.  Load Stage_P0_Intervals.js if you want Stage 0 / P0 content —
 *     this file does NOT duplicate P0; it references it in the catalog.
 *
 * 3.  Load this file.  All generators are added to the existing
 *     JazzExerciseGenerator class via static method assignment.
 *
 * 4.  Merge STAGES_0_12_CATALOG into your master catalog object.
 *
 * Sources:
 *   - Noah Siskind, "Jazz Piano Fundamentals, Book 1"
 *   - Noah Siskind, "Jazz Piano Fundamentals, Book 3"
 *   - Jazz Practice Studio Design with MXL Transposition (design doc)
 *
 * divisions=4  |  duration: 2=eighth, 4=quarter, 8=half, 16=whole
 *
 * @file Stages_0_through_12_Siskind.js
 */

// Alias for brevity within this file
const JZG = JazzExerciseGenerator;


// ============================================================================
// STAGE 0: INTERVALS & FOUNDATIONS  (reference only)
// ============================================================================
//
// Stage 0 / P0 is fully covered by Stage_P0_Intervals.js.
// See STAGE_P0_CATALOG for exercise entries P0.1 through P0.12.
// The catalog section below includes a cross-reference entry.


// ============================================================================
// STAGE 1: CHORD CONSTRUCTION  (Book 1, Units 1–2)
// ============================================================================
//
// "For the vast majority of this book, you will be dealing with three
//  crucial chord types."  — Siskind, Book 1, p.16

/**
 * Chord interval formulas (semitones above root).
 * @type {Object.<string, number[]>}
 */
JZG.CHORD_INTERVALS = {
  'maj7':    [0, 4, 7, 11],
  'dom7':    [0, 4, 7, 10],
  'min7':    [0, 3, 7, 10],
  'min7b5':  [0, 3, 6, 10],
  'dim7':    [0, 3, 6, 9],
  'min6':    [0, 3, 7, 9],
  'sus7':    [0, 5, 7, 10],
  'maj6':    [0, 4, 7, 9]
};

/**
 * 1.x  generateSingleChordExercise(key, chordType)
 * Builds a single root-position chord and wraps it as a MusicXML document.
 *
 * @param {string} key        – e.g. "C", "Db", "F#"
 * @param {string} chordType  – one of 'maj7','dom7','min7','min7b5','dim7'
 * @returns {string} MusicXML document
 */
JZG.generateSingleChordExercise = function (key, chordType) {
  const t = JZG.transpositionFromC(key);
  const root = 60 + t;                       // C4 = MIDI 60
  const ivls = JZG.CHORD_INTERVALS[chordType];
  if (!ivls) throw new Error(`Unknown chordType: ${chordType}`);
  const notes = ivls.map(i => root + i);
  const label = `${key}${chordType === 'maj7' ? 'Maj7' : chordType === 'dom7' ? '7' : chordType === 'min7' ? 'min7' : chordType === 'min7b5' ? 'ø7' : 'dim7'}`;
  const measures = JZG.generateMeasure(notes, 1, label, key);
  return JZG.wrapDocument(measures, `Chord Construction: ${label}`);
};


// ============================================================================
// STAGE 2: ii-V-I PROGRESSION  (Book 1, Units 3–5)
// ============================================================================
//
// "The ii-V-I progression and its components makes up a high percentage of
//  the harmonic landscape of jazz standards."  — Siskind, Book 1, p.36

/**
 * 2.1  generate251RootPosition(key)
 * Root-position ii-V-I: Dm7 → G7 → CMaj7 in key of C.
 */
JZG.generate251RootPosition = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 60 + t;

  // ii = min7 built on 2nd degree
  const iiRoot = root + 2;
  const iiNotes = JZG.CHORD_INTERVALS['min7'].map(i => iiRoot + i);

  // V = dom7 built on 5th degree
  const vRoot = root + 7;
  const vNotes = JZG.CHORD_INTERVALS['dom7'].map(i => vRoot + i);

  // I = maj7 on root (up an octave for voice leading continuity)
  const iRoot = root + 12;
  const iNotes = JZG.CHORD_INTERVALS['maj7'].map(i => iRoot + i);

  const iiLabel = `${JZG.pcToKeyName((root + 2) % 12)}min7`;
  const vLabel  = `${JZG.pcToKeyName((root + 7) % 12)}7`;
  const iLabel  = `${key}Maj7`;

  let xml = '';
  xml += JZG.generateMeasure(iiNotes, 1, iiLabel, key);
  xml += JZG.generateMeasure(vNotes, 2, vLabel, key);
  xml += JZG.generateMeasure(iNotes, 3, iLabel, key);

  return JZG.wrapDocument(xml, `ii-V-I Root Position — ${key}`);
};

/**
 * 2.2  generateShellVoicing(key, chordType)
 * Shell voicing: 3rd + 7th only (the two "guide tones").
 */
JZG.generateShellVoicing = function (key, chordType) {
  const t = JZG.transpositionFromC(key);
  const root = 60 + t;
  const ivls = JZG.CHORD_INTERVALS[chordType];
  if (!ivls) throw new Error(`Unknown chordType: ${chordType}`);
  // 3rd = ivls[1], 7th = ivls[3]
  const notes = [root + ivls[1], root + ivls[3]].sort((a, b) => a - b);
  const label = `${key} Shell (${chordType})`;
  const measures = JZG.generateMeasure(notes, 1, label, key);
  return JZG.wrapDocument(measures, `Shell Voicing: ${label}`);
};

/**
 * 2.3  generateMinor251(key)
 * Minor ii-V-i:  iiø7 → V7(b9) → iMin6
 *   iiø: root+2, [0,3,6,10]
 *   V7:  root+7, [0,4,7,10]   (b9 is the note root+7+1 = root+8)
 *   i:   root,   [0,3,7,9]    (min6)
 */
JZG.generateMinor251 = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 60 + t;

  const iiRoot = root + 2;
  const iiNotes = JZG.CHORD_INTERVALS['min7b5'].map(i => iiRoot + i);

  const vRoot = root + 7;
  // dom7 + b9 on top
  const vNotes = [...JZG.CHORD_INTERVALS['dom7'].map(i => vRoot + i), vRoot + 13];

  const iRoot = root + 12;
  const iNotes = JZG.CHORD_INTERVALS['min6'].map(i => iRoot + i);

  const iiLabel = `${JZG.pcToKeyName((root + 2) % 12)}ø7`;
  const vLabel  = `${JZG.pcToKeyName((root + 7) % 12)}7(b9)`;
  const iLabel  = `${key}min6`;

  let xml = '';
  xml += JZG.generateMeasure(iiNotes, 1, iiLabel, key);
  xml += JZG.generateMeasure(vNotes, 2, vLabel, key);
  xml += JZG.generateMeasure(iNotes, 3, iLabel, key);

  return JZG.wrapDocument(xml, `Minor ii-V-i — ${key}`);
};


// ============================================================================
// STAGE 3: TYPE A/B VOICINGS  (Book 1, Unit 6)
// ============================================================================
//
// "Type A/B voicings place the chord's essential tones, the thirds and
//  sevenths, in the left hand."  — Siskind, Book 1, p.86
//
// Type A: bottom-to-top = 3rd, 7th, 9th, 5th
// Type B: bottom-to-top = 7th, 3rd, 5th, 9th

/**
 * Voicing interval tables (semitones above root).
 * Each array is [bottom … top].  Octave adjustments keep voices in range.
 *
 * For Type A on ii (min7, root = degree 2):
 *   3rd = +3, 7th = +10, 9th = +14, 5th = +19
 * Type B starts with 7th lowest:
 *   7th = -2 (i.e. root+10 dropped an octave below root = root-2),
 *   3rd = +4, 5th = +7, 9th = +14
 */
JZG.VOICING_TYPE_A = {
  'min7':   [3, 10, 14, 19],    // ii chord
  'dom7':   [4, 10, 14, 19],    // V chord
  'maj7':   [4, 11, 14, 19],    // I chord
  'min7b5': [3, 10, 14, 18],    // iiø (b5 = 18 st above root)
  'dim7':   [3, 9, 14, 18]      // dim7
};

JZG.VOICING_TYPE_B = {
  'min7':   [-2, 3, 7, 14],     // ii chord
  'dom7':   [-2, 4, 7, 14],     // V chord
  'maj7':   [-1, 4, 7, 14],     // I chord
  'min7b5': [-2, 3, 6, 14],     // iiø
  'dim7':   [-3, 3, 6, 14]      // dim7
};

/**
 * Internal helper: build a 4-note voicing from a table.
 */
JZG._buildVoicing = function (rootMidi, chordType, table) {
  const ivls = table[chordType];
  if (!ivls) throw new Error(`No voicing for ${chordType}`);
  return ivls.map(i => rootMidi + i).sort((a, b) => a - b);
};

/**
 * 3.1  generate251TypeA(key)
 * ii-V-I with Type A → B → A alternation (A starts on ii).
 */
JZG.generate251TypeA = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;   // Start in lower octave for voicing spread

  const iiNotes = JZG._buildVoicing(root + 2, 'min7', JZG.VOICING_TYPE_A);
  const vNotes  = JZG._buildVoicing(root + 7, 'dom7', JZG.VOICING_TYPE_B);
  const iNotes  = JZG._buildVoicing(root + 12, 'maj7', JZG.VOICING_TYPE_A);

  const iiLabel = `${JZG.pcToKeyName((root + 2) % 12)}min7`;
  const vLabel  = `${JZG.pcToKeyName((root + 7) % 12)}7`;
  const iLabel  = `${key}Maj7`;

  let xml = '';
  xml += JZG.generateMeasure(iiNotes, 1, iiLabel, key);
  xml += JZG.generateMeasure(vNotes,  2, vLabel, key);
  xml += JZG.generateMeasure(iNotes,  3, iLabel, key);

  return JZG.wrapDocument(xml, `ii-V-I Type A Voicing — ${key}`);
};

/**
 * 3.2  generate251TypeB(key)
 * Starting on Type B for ii.
 */
JZG.generate251TypeB = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  const iiNotes = JZG._buildVoicing(root + 2, 'min7', JZG.VOICING_TYPE_B);
  const vNotes  = JZG._buildVoicing(root + 7, 'dom7', JZG.VOICING_TYPE_A);
  const iNotes  = JZG._buildVoicing(root + 12, 'maj7', JZG.VOICING_TYPE_B);

  const iiLabel = `${JZG.pcToKeyName((root + 2) % 12)}min7`;
  const vLabel  = `${JZG.pcToKeyName((root + 7) % 12)}7`;
  const iLabel  = `${key}Maj7`;

  let xml = '';
  xml += JZG.generateMeasure(iiNotes, 1, iiLabel, key);
  xml += JZG.generateMeasure(vNotes,  2, vLabel, key);
  xml += JZG.generateMeasure(iNotes,  3, iLabel, key);

  return JZG.wrapDocument(xml, `ii-V-I Type B Voicing — ${key}`);
};

/**
 * 3.3  generateDim7Voicing(key)
 * Dim7 with Type A/B treatment: LH = 3rd + 7th (dim), RH = b5 + root.
 */
JZG.generateDim7Voicing = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  const typeA = JZG._buildVoicing(root, 'dim7', JZG.VOICING_TYPE_A);
  const typeB = JZG._buildVoicing(root, 'dim7', JZG.VOICING_TYPE_B);

  let xml = '';
  xml += JZG.generateMeasure(typeA, 1, `${key}dim7 (A)`, key);
  xml += JZG.generateMeasure(typeB, 2, `${key}dim7 (B)`, key);

  return JZG.wrapDocument(xml, `Dim7 Type A/B Voicing — ${key}`);
};


// ============================================================================
// STAGE 4: ONE-HANDED VOICINGS  (Book 1, Unit 8)
// ============================================================================

/**
 * One-handed shell intervals (semitones above root).
 * Type A one-handed: 3, 7, 9   (three notes)
 * Type B one-handed: 7, 3, 5
 */
JZG.ONE_HAND_A = {
  'min7':  [3, 10, 14],
  'dom7':  [4, 10, 14],
  'maj7':  [4, 11, 14]
};

JZG.ONE_HAND_B = {
  'min7':  [10, 15, 19],   // 7th, 3rd(+octave), 5th(+octave)
  'dom7':  [10, 16, 19],
  'maj7':  [11, 16, 19]
};

/**
 * 4.1  generate251OneHandedShell(key, voicingType)
 * ii-V-I with 3-note one-handed voicings, Type A or B.
 */
JZG.generate251OneHandedShell = function (key, voicingType) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;
  const tbl = voicingType === 'B' ? JZG.ONE_HAND_B : JZG.ONE_HAND_A;

  const iiNotes = tbl['min7'].map(i => (root + 2) + i).sort((a, b) => a - b);
  const vNotes  = tbl['dom7'].map(i => (root + 7) + i).sort((a, b) => a - b);
  const iNotes  = tbl['maj7'].map(i => (root + 12) + i).sort((a, b) => a - b);

  const iiLabel = `${JZG.pcToKeyName((root + 2) % 12)}min7`;
  const vLabel  = `${JZG.pcToKeyName((root + 7) % 12)}7`;
  const iLabel  = `${key}Maj7`;

  let xml = '';
  xml += JZG.generateMeasure(iiNotes, 1, iiLabel, key);
  xml += JZG.generateMeasure(vNotes,  2, vLabel, key);
  xml += JZG.generateMeasure(iNotes,  3, iLabel, key);

  return JZG.wrapDocument(xml,
    `ii-V-I One-Handed Shell Type ${voicingType} — ${key}`);
};

/**
 * 4.2  generateBasslineInTwo(key)
 * Half-note bass line: root on beat 1, 5th on beat 3, over ii-V-I.
 */
JZG.generateBasslineInTwo = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 36 + t;  // Low register for bass

  // ii
  const iiRoot = root + 2;
  const ii5th  = iiRoot + 7;
  // V
  const vRoot = root + 7;
  const v5th  = vRoot + 7;
  // I
  const iRoot = root + 12;
  const i5th  = iRoot + 7;

  const iiLabel = `${JZG.pcToKeyName((root + 2) % 12)}min7`;
  const vLabel  = `${JZG.pcToKeyName((root + 7) % 12)}7`;
  const iLabel  = `${key}Maj7`;

  let xml = '';
  xml += JZG.generateMelodyMeasure([iiRoot, ii5th], [8, 8], 1, iiLabel, key);
  xml += JZG.generateMelodyMeasure([vRoot, v5th],   [8, 8], 2, vLabel, key);
  xml += JZG.generateMelodyMeasure([iRoot, i5th],   [8, 8], 3, iLabel, key);

  return JZG.wrapDocument(xml, `Bass Line in Two — ${key}`);
};


// ============================================================================
// STAGE 5: BLUES FORM  (Book 1, Units 7–9)
// ============================================================================
//
// "About a quarter of jazz standards are blues tunes or some variation
//  of the blues."  — Siskind, Book 1, p.104

/**
 * 5.1  generateJazzBlues(key)
 * 12-bar jazz blues: I7 | IV7 | I7 | I7 | IV7 | IV7 | I7 | I7 |
 *                    ii-7 | V7 | I7 | ii-7 V7
 */
JZG.generateJazzBlues = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  const I7   = JZG.CHORD_INTERVALS['dom7'].map(i => root + i);
  const IV7  = JZG.CHORD_INTERVALS['dom7'].map(i => root + 5 + i);
  const ii7  = JZG.CHORD_INTERVALS['min7'].map(i => root + 2 + i);
  const V7   = JZG.CHORD_INTERVALS['dom7'].map(i => root + 7 + i);

  const ILbl   = `${key}7`;
  const IVLbl  = `${JZG.pcToKeyName((t + 5) % 12)}7`;
  const iiLbl  = `${JZG.pcToKeyName((t + 2) % 12)}min7`;
  const VLbl   = `${JZG.pcToKeyName((t + 7) % 12)}7`;

  // 12-bar form
  const bars = [
    [I7,  ILbl],   // 1
    [IV7, IVLbl],  // 2
    [I7,  ILbl],   // 3
    [I7,  ILbl],   // 4
    [IV7, IVLbl],  // 5
    [IV7, IVLbl],  // 6
    [I7,  ILbl],   // 7
    [I7,  ILbl],   // 8
    [ii7, iiLbl],  // 9
    [V7,  VLbl],   // 10
    [I7,  ILbl],   // 11
    // Bar 12: ii-7 V7 (two half-note chords)
    null           // handled specially
  ];

  let xml = '';
  for (let m = 0; m < 11; m++) {
    xml += JZG.generateMeasure(bars[m][0], m + 1, bars[m][1], key);
  }

  // Bar 12: turnaround — ii-7 (half note) then V7 (half note)
  let m12 = `    <measure number="12">\n`;
  m12 += `      <direction placement="above">\n        <direction-type>\n          <words default-y="40" font-size="12" font-weight="bold">${iiLbl}  ${VLbl}</words>\n        </direction-type>\n      </direction>\n`;
  m12 += JZG.generateChord(ii7, 8, 'half', key);
  m12 += JZG.generateChord(V7,  8, 'half', key);
  m12 += `    </measure>\n`;
  xml += m12;

  return JZG.wrapDocument(xml, `12-Bar Jazz Blues — ${key}`);
};

/**
 * 5.2  generateBluesScale(key)
 * Blues scale: root, b3, 4, #4/b5, 5, b7, octave
 * Intervals: [0, 3, 5, 6, 7, 10, 12]
 */
JZG.generateBluesScale = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 60 + t;
  const intervals = [0, 3, 5, 6, 7, 10, 12];
  const notes = intervals.map(i => root + i);
  const durations = notes.map(() => 4);  // quarter notes

  let xml = '';
  // Ascending
  xml += JZG.generateMelodyMeasure(notes.slice(0, 4), durations.slice(0, 4), 1, `${key} Blues Scale ↑`, key);
  xml += JZG.generateMelodyMeasure(notes.slice(4), durations.slice(4), 2, '', key);
  // Descending
  const desc = [...notes].reverse();
  xml += JZG.generateMelodyMeasure(desc.slice(0, 4), durations.slice(0, 4), 3, `${key} Blues Scale ↓`, key);
  xml += JZG.generateMelodyMeasure(desc.slice(4), durations.slice(4), 4, '', key);

  return JZG.wrapDocument(xml, `Blues Scale — ${key}`);
};

/**
 * 5.3  generateSweetScale(key)
 * "Bright blues" / Sweet scale: [0, 2, 3, 4, 7, 9]
 */
JZG.generateSweetScale = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 60 + t;
  const intervals = [0, 2, 3, 4, 7, 9, 12];  // add octave for completeness
  const notes = intervals.map(i => root + i);
  const durations = notes.map(() => 4);

  let xml = '';
  xml += JZG.generateMelodyMeasure(notes.slice(0, 4), durations.slice(0, 4), 1, `${key} Sweet Scale ↑`, key);
  xml += JZG.generateMelodyMeasure(notes.slice(4), durations.slice(4), 2, '', key);
  const desc = [...notes].reverse();
  xml += JZG.generateMelodyMeasure(desc.slice(0, 4), durations.slice(0, 4), 3, `${key} Sweet Scale ↓`, key);
  xml += JZG.generateMelodyMeasure(desc.slice(4), durations.slice(4), 4, '', key);

  return JZG.wrapDocument(xml, `Sweet Scale — ${key}`);
};


// ============================================================================
// STAGE 6: LICKS & IMPROVISATION  (Book 1, Units 3–12)
// ============================================================================
//
// "Learning to rattle off set phrases without thinking is very useful."
//  — Siskind, Book 1, p.43
//
// ACCURACY NOTE: Licks are specific melodic phrases from the Siskind book.
// Where exact note-for-note transcription is not possible from text
// extraction, the generator uses the best available interval pattern from
// descriptions and is marked with NOTE_ACCURACY: 'approximate'.

/**
 * Lick data: intervals from the key root at C4 (MIDI 60).
 * Each lick: { intervals: number[], durations: number[], resolution: {intervals, durations},
 *              accuracy: 'exact'|'approximate', source: string }
 */
JZG.LICK_DATA = {
  1: {
    // "starts on 3rd of Dm7 (F), ascends through chord tones to I chord.
    //  7 notes + whole note resolution."
    // In C: F4-A4-C5-D5-B4-G4-A4 → E4
    intervals:  [5, 9, 12, 14, 11, 7, 9],
    durations:  [2, 2, 2, 2, 2, 2, 2],
    resolution: { intervals: [4], durations: [16] },
    chordSymbols: ['Dm7', 'G7', 'CMaj7'],
    accuracy: 'exact',
    source: 'Book 1, p.43'
  },
  2: {
    // "designed to remind you of the parent scale"
    // Ascending scale through ii-V, landing on chord tones of I.
    intervals:  [2, 4, 5, 7, 9, 11, 12, 14],
    durations:  [2, 2, 2, 2, 2, 2, 2, 2],
    resolution: { intervals: [12, 11], durations: [8, 8] },
    chordSymbols: ['Dm7', 'G7', 'CMaj7'],
    accuracy: 'exact',
    source: 'Book 1, p.57'
  },
  3: {
    // "interesting shape created by the leap on the 'and of three'"
    intervals:  [5, 7, 9, 12, 7, 9, 11],
    durations:  [2, 2, 2, 2, 2, 2, 2],
    resolution: { intervals: [12], durations: [16] },
    chordSymbols: ['Dm7', 'G7', 'CMaj7'],
    accuracy: 'approximate',
    source: 'Book 1, p.62'
  },
  4: {
    // "3-5-7-9 arpeggio, a turn, and a fingering maneuver"
    intervals:  [5, 7, 10, 14, 12, 11, 9, 7, 5, 4],
    durations:  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    resolution: { intervals: [4], durations: [16] },
    chordSymbols: ['Dm7', 'G7', 'CMaj7'],
    accuracy: 'approximate',
    source: 'Book 1, p.84'
  },
  5: {
    // "double notes and turns, almost sounds like it belongs in a minor key"
    intervals:  [3, 5, 7, 5, 3, 2, 0, 3, 5, 7],
    durations:  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    resolution: { intervals: [7], durations: [16] },
    chordSymbols: ['Blues'],
    accuracy: 'approximate',
    source: 'Book 1, p.102'
  },
  6: {
    // "fits with the V chord of a long-form ii-V-I"
    // Sweet scale pattern over V chord: [0, 2, 3, 4, 7, 9]
    intervals:  [7, 9, 10, 11, 14, 16, 14, 11],
    durations:  [2, 2, 2, 2, 2, 2, 2, 2],
    resolution: { intervals: [12], durations: [16] },
    chordSymbols: ['G7', 'CMaj7'],
    accuracy: 'approximate',
    source: 'Book 1, p.114'
  },
  7: {
    // "3-5-7-9 arpeggios with 13th substituting for 5th on V chord"
    intervals:  [5, 7, 10, 14, 11, 13, 10, 14],
    durations:  [2, 2, 2, 2, 2, 2, 2, 2],
    resolution: { intervals: [12], durations: [16] },
    chordSymbols: ['Dm7', 'G7', 'CMaj7'],
    accuracy: 'approximate',
    source: 'Book 1, p.136'
  },
  8: {
    // "adds altered tones on the V chord for more color"
    // Same shape as Lick 7 but with b9/b13 alterations on V.
    intervals:  [5, 7, 10, 14, 10, 13, 8, 14],
    durations:  [2, 2, 2, 2, 2, 2, 2, 2],
    resolution: { intervals: [12], durations: [16] },
    chordSymbols: ['Dm7', 'G7alt', 'CMaj7'],
    accuracy: 'approximate',
    source: 'Book 1, p.153'
  },
  9: {
    // "uses the flat nine and sharp eleven in an arpeggio over V chord"
    // With chromatic enclosure.
    intervals:  [5, 7, 10, 14, 8, 12, 11, 13],
    durations:  [2, 2, 2, 2, 2, 2, 2, 2],
    resolution: { intervals: [12], durations: [16] },
    chordSymbols: ['Dm7', 'G7alt', 'CMaj7'],
    accuracy: 'approximate',
    source: 'Book 1, p.169'
  },
  10: {
    // "uses the G altered scale over the V chord. All four altered tones."
    // Includes chromatic enclosures, ghost note, and turn.
    intervals:  [5, 7, 10, 14, 8, 10, 11, 13, 12, 11],
    durations:  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    resolution: { intervals: [12], durations: [16] },
    chordSymbols: ['Dm7', 'G7alt', 'CMaj7'],
    accuracy: 'approximate',
    source: 'Book 1, p.182'
  }
};

/**
 * 6.1–6.10  generateLick(key, lickNumber)
 * Generates one of the 10 Siskind licks, transposed to the given key.
 *
 * @param {string} key
 * @param {number} lickNumber – 1 through 10
 * @returns {string} MusicXML document
 */
JZG.generateLick = function (key, lickNumber) {
  const data = JZG.LICK_DATA[lickNumber];
  if (!data) throw new Error(`Unknown lick number: ${lickNumber}`);

  const t = JZG.transpositionFromC(key);
  const base = 60 + t;  // C4 transposed

  const notes = data.intervals.map(i => base + i);
  const durs  = data.durations;

  const resNotes = data.resolution.intervals.map(i => base + i);
  const resDurs  = data.resolution.durations;

  // Determine how many measures for the lick body
  // Sum durations; divisions=4, so 16 per measure in 4/4
  let totalDur = durs.reduce((a, b) => a + b, 0);
  let measCount = Math.ceil(totalDur / 16);

  let xml = '';
  let noteIdx = 0;
  let durLeft = 16;

  for (let m = 1; m <= measCount; m++) {
    const mNotes = [];
    const mDurs  = [];
    let barDur = 0;
    while (noteIdx < notes.length && barDur + durs[noteIdx] <= 16) {
      mNotes.push(notes[noteIdx]);
      mDurs.push(durs[noteIdx]);
      barDur += durs[noteIdx];
      noteIdx++;
    }
    // Pad remainder if needed
    if (barDur < 16 && noteIdx >= notes.length) {
      // leave it — resolution measure will fill
    }
    const sym = m === 1 ? (data.chordSymbols[0] || '') : (data.chordSymbols[Math.min(m - 1, data.chordSymbols.length - 1)] || '');
    xml += JZG.generateMelodyMeasure(mNotes, mDurs, m, sym, key);
  }

  // Resolution measure
  const resMeasNum = measCount + 1;
  const resSym = data.chordSymbols[data.chordSymbols.length - 1] || '';
  xml += JZG.generateMelodyMeasure(resNotes, resDurs, resMeasNum, resSym, key);

  const accTag = data.accuracy === 'approximate' ? ' [APPROXIMATE]' : '';
  return JZG.wrapDocument(xml,
    `Lick ${lickNumber}${accTag} — ${key} (${data.source})`);
};

/**
 * 6.11  generate3579Arpeggios(key)
 * 3-5-7-9 arpeggios over ii-V-I.
 */
JZG.generate3579Arpeggios = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 60 + t;

  // ii (min7 on 2nd degree): 3rd, 5th, 7th, 9th
  const iiRoot = root + 2;
  const iiArp = [iiRoot + 3, iiRoot + 7, iiRoot + 10, iiRoot + 14];

  // V (dom7 on 5th degree)
  const vRoot = root + 7;
  const vArp = [vRoot + 4, vRoot + 7, vRoot + 10, vRoot + 14];

  // I (maj7 on root, up octave)
  const iRoot = root + 12;
  const iArp = [iRoot + 4, iRoot + 7, iRoot + 11, iRoot + 14];

  const q = [4, 4, 4, 4];

  const iiLabel = `${JZG.pcToKeyName((root + 2) % 12)}min7`;
  const vLabel  = `${JZG.pcToKeyName((root + 7) % 12)}7`;
  const iLabel  = `${key}Maj7`;

  let xml = '';
  xml += JZG.generateMelodyMeasure(iiArp, q, 1, iiLabel, key);
  xml += JZG.generateMelodyMeasure(vArp,  q, 2, vLabel, key);
  xml += JZG.generateMelodyMeasure(iArp,  q, 3, iLabel, key);

  return JZG.wrapDocument(xml, `3-5-7-9 Arpeggios over ii-V-I — ${key}`);
};


// ============================================================================
// STAGE 7: ALTERED DOMINANTS  (Book 1, Units 10–12)
// ============================================================================
//
// "Altered dominant chords are created by raising or lowering the color
//  tones of a dominant seventh chord by a half step."
//  — Siskind, Book 1, p.154

/**
 * 7.1  generateAlteredDomB9(key, voicingType)
 * Dom7(b9): base Type A or B voicing with the 9th lowered by 1 semitone.
 */
JZG.generateAlteredDomB9 = function (key, voicingType) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;
  const tbl = voicingType === 'B' ? JZG.VOICING_TYPE_B : JZG.VOICING_TYPE_A;
  const ivls = [...tbl['dom7']];
  // Lower the 9th (14) by 1 semitone → 13
  for (let i = 0; i < ivls.length; i++) {
    if (ivls[i] === 14) { ivls[i] = 13; break; }
  }
  const notes = ivls.map(i => root + i).sort((a, b) => a - b);
  const label = `${key}7(b9) Type ${voicingType}`;
  const measures = JZG.generateMeasure(notes, 1, label, key);
  return JZG.wrapDocument(measures, `Altered Dom7(b9) — ${key}`);
};

/**
 * 7.2  generateTritone251(key)
 * Tritone substitution: ii → bII7 → I.
 * bII root = root + 1 semitone.
 */
JZG.generateTritone251 = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  // ii = min7 on 2nd degree
  const iiRoot = root + 2;
  const iiNotes = JZG._buildVoicing(iiRoot, 'min7', JZG.VOICING_TYPE_A);

  // bII7 = dom7 on root + 1 (tritone sub for V7)
  const bIIRoot = root + 1;
  const bIINotes = JZG._buildVoicing(bIIRoot, 'dom7', JZG.VOICING_TYPE_B);

  // I = maj7
  const iRoot = root + 12;
  const iNotes = JZG._buildVoicing(iRoot, 'maj7', JZG.VOICING_TYPE_A);

  const iiLabel  = `${JZG.pcToKeyName((root + 2) % 12)}min7`;
  const bIILabel = `${JZG.pcToKeyName((root + 1) % 12)}7 (tritone sub)`;
  const iLabel   = `${key}Maj7`;

  let xml = '';
  xml += JZG.generateMeasure(iiNotes,  1, iiLabel, key);
  xml += JZG.generateMeasure(bIINotes, 2, bIILabel, key);
  xml += JZG.generateMeasure(iNotes,   3, iLabel, key);

  return JZG.wrapDocument(xml, `Tritone Sub ii-V-I — ${key}`);
};

/**
 * 7.3  generateAlteredScale(key)
 * The altered scale: melodic minor a half-step above root.
 * Intervals: [0, 1, 3, 4, 6, 8, 10, 12]
 */
JZG.generateAlteredScale = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 60 + t;
  const intervals = [0, 1, 3, 4, 6, 8, 10, 12];
  const notes = intervals.map(i => root + i);
  const durations = notes.map(() => 4);

  let xml = '';
  xml += JZG.generateMelodyMeasure(notes.slice(0, 4), durations.slice(0, 4), 1, `${key} Altered Scale ↑`, key);
  xml += JZG.generateMelodyMeasure(notes.slice(4), durations.slice(4), 2, '', key);
  const desc = [...notes].reverse();
  xml += JZG.generateMelodyMeasure(desc.slice(0, 4), durations.slice(0, 4), 3, `${key} Altered Scale ↓`, key);
  xml += JZG.generateMelodyMeasure(desc.slice(4), durations.slice(4), 4, '', key);

  return JZG.wrapDocument(xml, `Altered Scale — ${key}`);
};

/**
 * 7.4  generateCombinedAlterations(key)
 * Multiple alterations: #9+b5, b9+b13, full altered voicing.
 */
JZG.generateCombinedAlterations = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  // Dom7(#9, b5): root, 4(3rd), 6(b5), 10(b7), 15(#9)
  const sharp9b5 = [root, root + 4, root + 6, root + 10, root + 15];

  // Dom7(b9, b13): root, 4(3rd), 7(5th), 10(b7), 13(b9), 20(b13)
  const b9b13 = [root, root + 4, root + 7, root + 10, root + 13, root + 20];

  // Full altered: root, 4(3rd), 6(b5), 10(b7), 13(b9), 15(#9), 20(b13)
  const fullAlt = [root, root + 4, root + 6, root + 10, root + 13, root + 15];

  let xml = '';
  xml += JZG.generateMeasure(sharp9b5, 1, `${key}7(#9,b5)`, key);
  xml += JZG.generateMeasure(b9b13,    2, `${key}7(b9,b13)`, key);
  xml += JZG.generateMeasure(fullAlt,  3, `${key}7alt`, key);

  return JZG.wrapDocument(xml, `Combined Altered Voicings — ${key}`);
};


// ============================================================================
// STAGE 8: MODAL JAZZ  (Book 3, Units 1–4)
// ============================================================================
//
// "Modal jazz features slow harmonic rhythm, ambiguous tonal centers, and
//  root movements outside the circle of fifths."
//  — Siskind, Book 3, Unit 1

/**
 * Mode interval patterns (semitones from root).
 */
JZG.MODE_INTERVALS = {
  'ionian':     [0, 2, 4, 5, 7, 9, 11, 12],
  'dorian':     [0, 2, 3, 5, 7, 9, 10, 12],
  'phrygian':   [0, 1, 3, 5, 7, 8, 10, 12],
  'lydian':     [0, 2, 4, 6, 7, 9, 11, 12],
  'mixolydian': [0, 2, 4, 5, 7, 9, 10, 12],
  'aeolian':    [0, 2, 3, 5, 7, 8, 10, 12],
  'locrian':    [0, 1, 3, 5, 6, 8, 10, 12]
};

/**
 * 8.1  generateAllModes(key)
 * All 7 modes from one root, each ascending one octave.
 */
JZG.generateAllModes = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 60 + t;
  const modeNames = Object.keys(JZG.MODE_INTERVALS);

  let xml = '';
  let mNum = 1;
  for (const mode of modeNames) {
    const ivls = JZG.MODE_INTERVALS[mode];
    const notes = ivls.map(i => root + i);
    // Two measures per mode (4 notes each)
    xml += JZG.generateMelodyMeasure(
      notes.slice(0, 4), [4, 4, 4, 4], mNum, `${key} ${mode}`, key);
    mNum++;
    xml += JZG.generateMelodyMeasure(
      notes.slice(4), [4, 4, 4, 4], mNum, '', key);
    mNum++;
  }

  return JZG.wrapDocument(xml, `All 7 Modes from ${key}`);
};

/**
 * 8.2  generateModalDrone(key, modeName)
 * Scale over a drone: whole-note root in bass staff concept,
 * ascending/descending scale in treble. Rendered as melody with
 * chord symbol showing the drone.
 */
JZG.generateModalDrone = function (key, modeName) {
  const t = JZG.transpositionFromC(key);
  const root = 60 + t;
  const mode = modeName || 'dorian';
  const ivls = JZG.MODE_INTERVALS[mode];
  if (!ivls) throw new Error(`Unknown mode: ${mode}`);

  const notes = ivls.map(i => root + i);
  const desc  = [...notes].reverse();
  const q4    = notes.map(() => 4);

  let xml = '';
  xml += JZG.generateMelodyMeasure(notes.slice(0, 4), q4.slice(0, 4), 1, `${key} ${mode} (drone)`, key);
  xml += JZG.generateMelodyMeasure(notes.slice(4), q4.slice(4), 2, '', key);
  xml += JZG.generateMelodyMeasure(desc.slice(0, 4), q4.slice(0, 4), 3, '', key);
  xml += JZG.generateMelodyMeasure(desc.slice(4), q4.slice(4), 4, '', key);

  return JZG.wrapDocument(xml, `Modal Drone: ${key} ${mode}`);
};

/**
 * 8.3a  generateSoWhatVoicing(key)
 * "A third on top with fourths draped below."
 * 5 notes: from bottom, stacked P4, P4, P4, then M3 (or m3) on top.
 * In D dorian on D: D-G-C-F-A → [0, 5, 10, 15, 19] from bottom.
 *
 * Generates this voicing on each degree of the dorian mode.
 */
JZG.generateSoWhatVoicing = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;  // Lower octave for voicings
  const dorian = JZG.MODE_INTERVALS['dorian']; // [0,2,3,5,7,9,10,12]

  let xml = '';
  for (let deg = 0; deg < 7; deg++) {
    const bottom = root + dorian[deg];
    // Stack from the mode: use diatonic 4ths (follow the mode)
    // Each "4th" is the note 3 scale degrees up
    const degNotes = [];
    for (let stack = 0; stack < 5; stack++) {
      const idx = deg + (stack * 3); // every 3rd scale degree = diatonic 4th
      // Wrap around the mode, adding octaves as needed
      const octShift = Math.floor(idx / 7) * 12;
      const scaleIdx = idx % 7;
      degNotes.push(root + dorian[scaleIdx] + octShift);
    }
    degNotes.sort((a, b) => a - b);

    const degLabel = `So What on degree ${deg + 1}`;
    xml += JZG.generateMeasure(degNotes, deg + 1, degLabel, key);
  }

  return JZG.wrapDocument(xml, `So What Voicings — ${key} Dorian`);
};

/**
 * 8.3b  generate3NoteQuartalVoicing(key)
 * Three stacked diatonic 4ths from each mode degree.
 */
JZG.generate3NoteQuartalVoicing = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;
  const dorian = JZG.MODE_INTERVALS['dorian'];

  let xml = '';
  for (let deg = 0; deg < 7; deg++) {
    const degNotes = [];
    for (let stack = 0; stack < 3; stack++) {
      const idx = deg + (stack * 3);
      const octShift = Math.floor(idx / 7) * 12;
      const scaleIdx = idx % 7;
      degNotes.push(root + dorian[scaleIdx] + octShift);
    }
    degNotes.sort((a, b) => a - b);
    xml += JZG.generateMeasure(degNotes, deg + 1, `Quartal-3 deg ${deg + 1}`, key);
  }

  return JZG.wrapDocument(xml, `3-Note Quartal Voicings — ${key}`);
};

/**
 * 8.3c  generate5NoteQuartalVoicing(key)
 * Five stacked diatonic 4ths.
 */
JZG.generate5NoteQuartalVoicing = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;
  const dorian = JZG.MODE_INTERVALS['dorian'];

  let xml = '';
  for (let deg = 0; deg < 7; deg++) {
    const degNotes = [];
    for (let stack = 0; stack < 5; stack++) {
      const idx = deg + (stack * 3);
      const octShift = Math.floor(idx / 7) * 12;
      const scaleIdx = idx % 7;
      degNotes.push(root + dorian[scaleIdx] + octShift);
    }
    degNotes.sort((a, b) => a - b);
    xml += JZG.generateMeasure(degNotes, deg + 1, `Quartal-5 deg ${deg + 1}`, key);
  }

  return JZG.wrapDocument(xml, `5-Note Quartal Voicings — ${key}`);
};

/**
 * 8.3d  generateClusterVoicing(key)
 * Three stacked diatonic 2nds (cluster) from each mode degree.
 */
JZG.generateClusterVoicing = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 60 + t;
  const dorian = JZG.MODE_INTERVALS['dorian'];

  let xml = '';
  for (let deg = 0; deg < 7; deg++) {
    const degNotes = [];
    for (let stack = 0; stack < 3; stack++) {
      const idx = deg + stack; // consecutive scale degrees
      const octShift = Math.floor(idx / 7) * 12;
      const scaleIdx = idx % 7;
      degNotes.push(root + dorian[scaleIdx] + octShift);
    }
    degNotes.sort((a, b) => a - b);
    xml += JZG.generateMeasure(degNotes, deg + 1, `Cluster deg ${deg + 1}`, key);
  }

  return JZG.wrapDocument(xml, `Cluster Voicings — ${key}`);
};

/**
 * 8.4  generateUpperStructureTriads(key)
 * Diatonic triads within the Dorian mode (upper structures).
 */
JZG.generateUpperStructureTriads = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 60 + t;
  const dorian = JZG.MODE_INTERVALS['dorian']; // without octave for indexing

  // Diatonic triads: root, 3rd, 5th within the mode (every other scale degree)
  let xml = '';
  for (let deg = 0; deg < 7; deg++) {
    const triadNotes = [];
    for (let n = 0; n < 3; n++) {
      const idx = deg + (n * 2);
      const octShift = Math.floor(idx / 7) * 12;
      const scaleIdx = idx % 7;
      triadNotes.push(root + dorian[scaleIdx] + octShift);
    }
    triadNotes.sort((a, b) => a - b);
    xml += JZG.generateMeasure(triadNotes, deg + 1, `Triad deg ${deg + 1}`, key);
  }

  return JZG.wrapDocument(xml, `Upper Structure Triads — ${key} Dorian`);
};

/**
 * Pentatonic scale formulas.
 */
JZG.PENTATONIC_SCALES = {
  'major':       [0, 2, 4, 7, 9],
  'minor':       [0, 3, 5, 7, 10],
  'dorian':      [0, 2, 3, 7, 9],    // primary for min7
  'mixolydian':  [0, 2, 4, 7, 10],   // primary for dom7
  'lydian':      [0, 2, 4, 7, 11]    // secondary for maj7
};

/**
 * Chord-to-pentatonic mapping: primary and secondary.
 */
JZG.PENTATONIC_FOR_CHORD = {
  'maj7':  { primary: 'major', secondary: 'lydian' },
  'dom7':  { primary: 'mixolydian', secondary: 'major' },
  'min7':  { primary: 'dorian', secondary: 'minor' },
  'min7b5': { primary: 'minor', secondary: 'dorian' }
};

/**
 * 8.5  generatePentatonicForChord(key, chordType)
 * Primary and secondary pentatonic scales for a given chord type.
 */
JZG.generatePentatonicForChord = function (key, chordType) {
  const t = JZG.transpositionFromC(key);
  const root = 60 + t;
  const mapping = JZG.PENTATONIC_FOR_CHORD[chordType];
  if (!mapping) throw new Error(`No pentatonic mapping for ${chordType}`);

  const primary = JZG.PENTATONIC_SCALES[mapping.primary];
  const secondary = JZG.PENTATONIC_SCALES[mapping.secondary];

  const pNotes = [...primary.map(i => root + i), root + 12]; // add octave
  const sNotes = [...secondary.map(i => root + i), root + 12];
  const q = pNotes.map(() => 4);

  let xml = '';
  // Primary ascending
  xml += JZG.generateMelodyMeasure(pNotes.slice(0, 4), q.slice(0, 4), 1,
    `${key} ${mapping.primary} pent (primary)`, key);
  xml += JZG.generateMelodyMeasure(pNotes.slice(4), q.slice(4), 2, '', key);
  // Secondary ascending
  xml += JZG.generateMelodyMeasure(sNotes.slice(0, 4), q.slice(0, 4), 3,
    `${key} ${mapping.secondary} pent (secondary)`, key);
  xml += JZG.generateMelodyMeasure(sNotes.slice(4), q.slice(4), 4, '', key);

  return JZG.wrapDocument(xml,
    `Pentatonic Scales for ${key}${chordType}`);
};

/**
 * 8.6  generatePentatonicVoicing(key)
 * "Select every other note of the pentatonic scale until all five are
 *  present." Builds spread voicings from the major pentatonic.
 */
JZG.generatePentatonicVoicing = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;
  const pent = JZG.PENTATONIC_SCALES['major']; // [0, 2, 4, 7, 9]

  // Build a 2-octave pentatonic pool
  const pool = [];
  for (let oct = 0; oct < 3; oct++) {
    for (const p of pent) {
      pool.push(root + p + oct * 12);
    }
  }

  let xml = '';
  // For each starting note in the first octave, pick every other note
  for (let start = 0; start < 5; start++) {
    const voicing = [];
    let idx = start;
    for (let n = 0; n < 5; n++) {
      voicing.push(pool[idx]);
      idx += 2;
    }
    voicing.sort((a, b) => a - b);
    xml += JZG.generateMeasure(voicing, start + 1, `Pent voicing ${start + 1}`, key);
  }

  return JZG.wrapDocument(xml, `Pentatonic Voicings — ${key}`);
};


// ============================================================================
// STAGE 9: REHARMONIZATION  (Book 3 + Jazz Practice Studio formulas)
// ============================================================================

/**
 * 9.1  generateSecondaryDominant(key, target)
 * Secondary dominants: V/ii, V/vi, V/V with Type A voicings.
 * target: 'ii', 'vi', or 'V'
 */
JZG.generateSecondaryDominant = function (key, target) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  const targetDegrees = {
    'ii':  2,
    'iii': 4,
    'IV':  5,
    'V':   7,
    'vi':  9
  };

  const deg = targetDegrees[target];
  if (deg === undefined) throw new Error(`Unknown target: ${target}`);

  // V7 of the target = dom7 a P5 above the target degree
  const secDomRoot = root + deg + 7; // P5 above target
  // Adjust to keep in range: use modular approach
  const secDomRootAdj = root + ((deg + 7) % 12);

  const secDomNotes = JZG._buildVoicing(secDomRootAdj, 'dom7', JZG.VOICING_TYPE_A);
  const targetRoot = root + deg;
  // Target chord type depends on degree
  const targetType = (deg === 2 || deg === 9) ? 'min7' : (deg === 5 || deg === 7) ? 'maj7' : 'min7';
  const targetNotes = JZG._buildVoicing(targetRoot, targetType, JZG.VOICING_TYPE_B);

  const secLabel = `${JZG.pcToKeyName((t + deg + 7) % 12)}7 (V/${target})`;
  const tgtLabel = `${JZG.pcToKeyName((t + deg) % 12)}${targetType === 'min7' ? 'min7' : 'Maj7'}`;

  let xml = '';
  xml += JZG.generateMeasure(secDomNotes, 1, secLabel, key);
  xml += JZG.generateMeasure(targetNotes, 2, tgtLabel, key);

  return JZG.wrapDocument(xml, `Secondary Dominant V/${target} — ${key}`);
};

/**
 * 9.2  generateBackdooriiV(key)
 * Backdoor ii-V: iv-7 → bVII7 → IMaj7
 * e.g. in C: Fm7 → Bb7 → CMaj7
 */
JZG.generateBackdooriiV = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  // iv-7: root + 5 (P4)
  const ivRoot = root + 5;
  const ivNotes = JZG._buildVoicing(ivRoot, 'min7', JZG.VOICING_TYPE_A);

  // bVII7: root + 10
  const bVIIRoot = root + 10;
  const bVIINotes = JZG._buildVoicing(bVIIRoot, 'dom7', JZG.VOICING_TYPE_B);

  // IMaj7
  const iRoot = root + 12;
  const iNotes = JZG._buildVoicing(iRoot, 'maj7', JZG.VOICING_TYPE_A);

  const ivLabel   = `${JZG.pcToKeyName((t + 5) % 12)}min7`;
  const bVIILabel = `${JZG.pcToKeyName((t + 10) % 12)}7`;
  const iLabel    = `${key}Maj7`;

  let xml = '';
  xml += JZG.generateMeasure(ivNotes,   1, ivLabel, key);
  xml += JZG.generateMeasure(bVIINotes, 2, bVIILabel, key);
  xml += JZG.generateMeasure(iNotes,    3, iLabel, key);

  return JZG.wrapDocument(xml, `Backdoor ii-V — ${key}`);
};

/**
 * 9.3  generateDimWalkUp(key)
 * Diminished walk-up: I → #Io7 → ii → #iio7 → I/3 …
 * Alternating diatonic and diminished chords with chromatic ascending bass.
 */
JZG.generateDimWalkUp = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  // I (maj7)
  const I_notes = JZG.CHORD_INTERVALS['maj7'].map(i => root + i);
  // #Io7 (dim7 on root+1)
  const shIo_notes = JZG.CHORD_INTERVALS['dim7'].map(i => root + 1 + i);
  // ii (min7 on root+2)
  const ii_notes = JZG.CHORD_INTERVALS['min7'].map(i => root + 2 + i);
  // #iio7 (dim7 on root+3)
  const shIIo_notes = JZG.CHORD_INTERVALS['dim7'].map(i => root + 3 + i);
  // I/3 (maj7 with 3rd in bass, root+4 lowest)
  const I3_notes = [root + 4, ...JZG.CHORD_INTERVALS['maj7'].slice(1).map(i => root + i + 12)];

  const labels = [
    `${key}Maj7`,
    `${JZG.pcToKeyName((t + 1) % 12)}dim7`,
    `${JZG.pcToKeyName((t + 2) % 12)}min7`,
    `${JZG.pcToKeyName((t + 3) % 12)}dim7`,
    `${key}Maj7/3`
  ];

  let xml = '';
  [I_notes, shIo_notes, ii_notes, shIIo_notes, I3_notes].forEach((notes, i) => {
    xml += JZG.generateMeasure(notes, i + 1, labels[i], key);
  });

  return JZG.wrapDocument(xml, `Diminished Walk-Up — ${key}`);
};

/**
 * 9.4  generateTurnaround_1625(key)
 * I-vi-ii-V turnaround in Type A/B voicings.
 */
JZG.generateTurnaround_1625 = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  const I_notes  = JZG._buildVoicing(root,     'maj7', JZG.VOICING_TYPE_A);
  const vi_notes = JZG._buildVoicing(root + 9, 'min7', JZG.VOICING_TYPE_B);
  const ii_notes = JZG._buildVoicing(root + 2, 'min7', JZG.VOICING_TYPE_A);
  const V_notes  = JZG._buildVoicing(root + 7, 'dom7', JZG.VOICING_TYPE_B);

  const labels = [
    `${key}Maj7`,
    `${JZG.pcToKeyName((t + 9) % 12)}min7`,
    `${JZG.pcToKeyName((t + 2) % 12)}min7`,
    `${JZG.pcToKeyName((t + 7) % 12)}7`
  ];

  let xml = '';
  [I_notes, vi_notes, ii_notes, V_notes].forEach((notes, i) => {
    xml += JZG.generateMeasure(notes, i + 1, labels[i], key);
  });

  return JZG.wrapDocument(xml, `Turnaround I-vi-ii-V — ${key}`);
};

/**
 * 9.5  generateTurnaround_3625(key)
 * iii-vi-ii-V turnaround.
 */
JZG.generateTurnaround_3625 = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  const iii_notes = JZG._buildVoicing(root + 4, 'min7', JZG.VOICING_TYPE_A);
  const vi_notes  = JZG._buildVoicing(root + 9, 'dom7', JZG.VOICING_TYPE_B);
  const ii_notes  = JZG._buildVoicing(root + 2, 'min7', JZG.VOICING_TYPE_A);
  const V_notes   = JZG._buildVoicing(root + 7, 'dom7', JZG.VOICING_TYPE_B);

  const labels = [
    `${JZG.pcToKeyName((t + 4) % 12)}min7`,
    `${JZG.pcToKeyName((t + 9) % 12)}7`,
    `${JZG.pcToKeyName((t + 2) % 12)}min7`,
    `${JZG.pcToKeyName((t + 7) % 12)}7`
  ];

  let xml = '';
  [iii_notes, vi_notes, ii_notes, V_notes].forEach((notes, i) => {
    xml += JZG.generateMeasure(notes, i + 1, labels[i], key);
  });

  return JZG.wrapDocument(xml, `Turnaround iii-vi-ii-V — ${key}`);
};

/**
 * 9.6  generateColtraneChanges(key)
 * Coltrane substitution: major-3rd cycle replacing ii-V-I.
 * |IMaj7|bIII7|bVIMaj7|VII7|IIMaj7|#IV7|IMaj7|
 */
JZG.generateColtraneChanges = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  // Degrees (semitones from root): I(0), bIII(3), bVI(8), VII(11), II(2+12), #IV(6+12), I(0+12)
  const chords = [
    { deg: 0,  type: 'maj7', label: `${key}Maj7` },
    { deg: 3,  type: 'dom7', label: `${JZG.pcToKeyName((t + 3) % 12)}7` },
    { deg: 8,  type: 'maj7', label: `${JZG.pcToKeyName((t + 8) % 12)}Maj7` },
    { deg: 11, type: 'dom7', label: `${JZG.pcToKeyName((t + 11) % 12)}7` },
    { deg: 14, type: 'maj7', label: `${JZG.pcToKeyName((t + 2) % 12)}Maj7` },
    { deg: 18, type: 'dom7', label: `${JZG.pcToKeyName((t + 6) % 12)}7` },
    { deg: 24, type: 'maj7', label: `${key}Maj7` }
  ];

  let xml = '';
  chords.forEach((c, i) => {
    const notes = JZG._buildVoicing(root + c.deg, c.type,
      i % 2 === 0 ? JZG.VOICING_TYPE_A : JZG.VOICING_TYPE_B);
    xml += JZG.generateMeasure(notes, i + 1, c.label, key);
  });

  return JZG.wrapDocument(xml, `Coltrane Changes — ${key}`);
};


// ============================================================================
// STAGE 10: MODAL INTERCHANGE  (Book 3, Units 7–8)
// ============================================================================
//
// "Three principal methods for adding notes from outside: tonicization,
//  sidestepping, planing."  — Siskind, Book 3, Unit 7

/**
 * 10.1  generateModalBorrowing(key)
 * Exchange chords from parallel minor: IV → iv, I → i, etc.
 * Demonstrates: IMaj7 → ivMin7 → IMaj7 → bVIMaj7
 */
JZG.generateModalBorrowing = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  const I_maj   = JZG._buildVoicing(root,     'maj7', JZG.VOICING_TYPE_A);
  const iv_min  = JZG._buildVoicing(root + 5, 'min7', JZG.VOICING_TYPE_B);
  const I_maj2  = JZG._buildVoicing(root + 12, 'maj7', JZG.VOICING_TYPE_A);
  const bVI_maj = JZG._buildVoicing(root + 8, 'maj7', JZG.VOICING_TYPE_B);

  const labels = [
    `${key}Maj7`,
    `${JZG.pcToKeyName((t + 5) % 12)}min7 (iv)`,
    `${key}Maj7`,
    `${JZG.pcToKeyName((t + 8) % 12)}Maj7 (bVI)`
  ];

  let xml = '';
  [I_maj, iv_min, I_maj2, bVI_maj].forEach((notes, i) => {
    xml += JZG.generateMeasure(notes, i + 1, labels[i], key);
  });

  return JZG.wrapDocument(xml, `Modal Borrowing — ${key}`);
};

/**
 * 10.2  generateTonicization(key)
 * Precede a chord with its V7 to create tension.
 * Pattern: V7/ii → ii → V7/V → V → V7/I → I
 */
JZG.generateTonicization = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  const chords = [
    { r: (2 + 7) % 12, type: 'dom7', label: `V7/ii` },
    { r: 2,            type: 'min7', label: `ii` },
    { r: (7 + 7) % 12, type: 'dom7', label: `V7/V` },
    { r: 7,            type: 'dom7', label: `V7` },
    { r: 7,            type: 'dom7', label: `V7/I` },
    { r: 0,            type: 'maj7', label: `IMaj7` }
  ];

  let xml = '';
  chords.forEach((c, i) => {
    const notes = JZG._buildVoicing(root + c.r, c.type,
      i % 2 === 0 ? JZG.VOICING_TYPE_A : JZG.VOICING_TYPE_B);
    const fullLabel = `${JZG.pcToKeyName((t + c.r) % 12)}${c.type === 'dom7' ? '7' : c.type === 'min7' ? 'min7' : 'Maj7'} (${c.label})`;
    xml += JZG.generateMeasure(notes, i + 1, fullLabel, key);
  });

  return JZG.wrapDocument(xml, `Tonicization Chain — ${key}`);
};

/**
 * 10.3  generateSidestep(key)
 * Target chord approached from half-step above and below.
 * Pattern: ii-V from half-step above → target ii-V-I
 */
JZG.generateSidestep = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  // Sidestep from above (key + 1 semitone)
  const ssAbove_ii = JZG._buildVoicing(root + 1 + 2, 'min7', JZG.VOICING_TYPE_A);
  const ssAbove_V  = JZG._buildVoicing(root + 1 + 7, 'dom7', JZG.VOICING_TYPE_B);

  // Target ii-V-I
  const ii_notes = JZG._buildVoicing(root + 2,  'min7', JZG.VOICING_TYPE_A);
  const V_notes  = JZG._buildVoicing(root + 7,  'dom7', JZG.VOICING_TYPE_B);
  const I_notes  = JZG._buildVoicing(root + 12, 'maj7', JZG.VOICING_TYPE_A);

  const labels = [
    `${JZG.pcToKeyName((t + 3) % 12)}min7 (sidestep)`,
    `${JZG.pcToKeyName((t + 8) % 12)}7 (sidestep)`,
    `${JZG.pcToKeyName((t + 2) % 12)}min7`,
    `${JZG.pcToKeyName((t + 7) % 12)}7`,
    `${key}Maj7`
  ];

  let xml = '';
  [ssAbove_ii, ssAbove_V, ii_notes, V_notes, I_notes].forEach((notes, i) => {
    xml += JZG.generateMeasure(notes, i + 1, labels[i], key);
  });

  return JZG.wrapDocument(xml, `Sidestep ii-V — ${key}`);
};

/**
 * 10.4  generatePlaning(key)
 * Parallel motion: transpose a voicing chromatically, by whole-tone,
 * minor 3rds, and major 3rds.
 */
JZG.generatePlaning = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  const baseVoicing = JZG._buildVoicing(root, 'min7', JZG.VOICING_TYPE_A);

  const motionTypes = [
    { name: 'chromatic',  steps: [0, 1, 2, 3] },
    { name: 'whole-tone', steps: [0, 2, 4, 6] },
    { name: 'minor 3rd',  steps: [0, 3, 6, 9] },
    { name: 'major 3rd',  steps: [0, 4, 8, 12] }
  ];

  let xml = '';
  let mNum = 1;
  for (const motion of motionTypes) {
    for (const step of motion.steps) {
      const notes = baseVoicing.map(n => n + step);
      xml += JZG.generateMeasure(notes, mNum,
        `${JZG.pcToKeyName((t + step) % 12)}min7 (${motion.name})`, key);
      mNum++;
    }
  }

  return JZG.wrapDocument(xml, `Planing Exercise — ${key}`);
};

/**
 * 10.5  generateModalInterchangeOverStatic(key)
 * Cycle through different modes over one static chord.
 * One chord per measure, holding the root constant.
 */
JZG.generateModalInterchangeOverStatic = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  // Different chord qualities from each mode of the same root
  const modalChords = [
    { type: 'maj7',   label: 'Ionian (Maj7)' },
    { type: 'dom7',   label: 'Mixolydian (7)' },
    { type: 'min7',   label: 'Dorian (min7)' },
    { type: 'min7b5', label: 'Locrian (ø7)' }
  ];

  let xml = '';
  modalChords.forEach((c, i) => {
    const notes = JZG._buildVoicing(root, c.type,
      i % 2 === 0 ? JZG.VOICING_TYPE_A : JZG.VOICING_TYPE_B);
    xml += JZG.generateMeasure(notes, i + 1, `${key} ${c.label}`, key);
  });

  return JZG.wrapDocument(xml, `Modal Interchange over Static Root — ${key}`);
};


// ============================================================================
// STAGE 11: MODAL BLUES  (Book 3, Unit 10)
// ============================================================================
//
// "By using modal harmonies, musicians can create alternate versions of
//  the blues."  — Siskind, Book 3, Unit 10

/**
 * Helper: generate a 12-bar blues form from a chord map.
 * chordMap: array of 12 entries, each { notes: number[], label: string }
 */
JZG._generate12BarForm = function (chordMap, title, key) {
  let xml = '';
  for (let m = 0; m < 12; m++) {
    xml += JZG.generateMeasure(chordMap[m].notes, m + 1, chordMap[m].label, key);
  }
  return JZG.wrapDocument(xml, title);
};

/**
 * 11.1  generateMixolydianBlues(key)
 * Replace dom7 with sus7 chords throughout the 12-bar form.
 */
JZG.generateMixolydianBlues = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  const Isus  = JZG.CHORD_INTERVALS['sus7'].map(i => root + i);
  const IVsus = JZG.CHORD_INTERVALS['sus7'].map(i => root + 5 + i);
  const ii7   = JZG.CHORD_INTERVALS['min7'].map(i => root + 2 + i);
  const Vsus  = JZG.CHORD_INTERVALS['sus7'].map(i => root + 7 + i);

  const ILbl  = `${key}sus7`;
  const IVLbl = `${JZG.pcToKeyName((t + 5) % 12)}sus7`;
  const iiLbl = `${JZG.pcToKeyName((t + 2) % 12)}min7`;
  const VLbl  = `${JZG.pcToKeyName((t + 7) % 12)}sus7`;

  const map = [
    { notes: Isus,  label: ILbl },   // 1
    { notes: IVsus, label: IVLbl },  // 2
    { notes: Isus,  label: ILbl },   // 3
    { notes: Isus,  label: ILbl },   // 4
    { notes: IVsus, label: IVLbl },  // 5
    { notes: IVsus, label: IVLbl },  // 6
    { notes: Isus,  label: ILbl },   // 7
    { notes: Isus,  label: ILbl },   // 8
    { notes: ii7,   label: iiLbl },  // 9
    { notes: Vsus,  label: VLbl },   // 10
    { notes: Isus,  label: ILbl },   // 11
    { notes: Isus,  label: ILbl }    // 12
  ];

  return JZG._generate12BarForm(map, `Mixolydian Blues — ${key}`, key);
};

/**
 * 11.2  generateDorianBlues(key)
 * All min7 chords: I=min7, IV=min7, V=min7.
 */
JZG.generateDorianBlues = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  const Im7   = JZG.CHORD_INTERVALS['min7'].map(i => root + i);
  const IVm7  = JZG.CHORD_INTERVALS['min7'].map(i => root + 5 + i);
  const Vm7   = JZG.CHORD_INTERVALS['min7'].map(i => root + 7 + i);

  const ILbl  = `${key}min7`;
  const IVLbl = `${JZG.pcToKeyName((t + 5) % 12)}min7`;
  const VLbl  = `${JZG.pcToKeyName((t + 7) % 12)}min7`;

  const map = [
    { notes: Im7,  label: ILbl },
    { notes: IVm7, label: IVLbl },
    { notes: Im7,  label: ILbl },
    { notes: Im7,  label: ILbl },
    { notes: IVm7, label: IVLbl },
    { notes: IVm7, label: IVLbl },
    { notes: Im7,  label: ILbl },
    { notes: Im7,  label: ILbl },
    { notes: Vm7,  label: VLbl },
    { notes: Vm7,  label: VLbl },
    { notes: Im7,  label: ILbl },
    { notes: Im7,  label: ILbl }
  ];

  return JZG._generate12BarForm(map, `Dorian Blues — ${key}`, key);
};

/**
 * 11.3  generateAeolianBlues(key)
 * Natural minor: i-7, iv-7, bVI-7, bVII-7.
 */
JZG.generateAeolianBlues = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  const im7    = JZG.CHORD_INTERVALS['min7'].map(i => root + i);
  const ivm7   = JZG.CHORD_INTERVALS['min7'].map(i => root + 5 + i);
  const bVIm7  = JZG.CHORD_INTERVALS['min7'].map(i => root + 8 + i);
  const bVIIm7 = JZG.CHORD_INTERVALS['min7'].map(i => root + 10 + i);
  const vm7    = JZG.CHORD_INTERVALS['min7'].map(i => root + 7 + i);

  const iLbl    = `${key}min7`;
  const ivLbl   = `${JZG.pcToKeyName((t + 5) % 12)}min7`;
  const bVILbl  = `${JZG.pcToKeyName((t + 8) % 12)}min7`;
  const bVIILbl = `${JZG.pcToKeyName((t + 10) % 12)}min7`;
  const vLbl    = `${JZG.pcToKeyName((t + 7) % 12)}min7`;

  const map = [
    { notes: im7,    label: iLbl },     // 1
    { notes: ivm7,   label: ivLbl },    // 2
    { notes: im7,    label: iLbl },     // 3
    { notes: im7,    label: iLbl },     // 4
    { notes: ivm7,   label: ivLbl },    // 5
    { notes: ivm7,   label: ivLbl },    // 6
    { notes: im7,    label: iLbl },     // 7
    { notes: im7,    label: iLbl },     // 8
    { notes: bVIm7,  label: bVILbl },   // 9
    { notes: bVIIm7, label: bVIILbl },  // 10
    { notes: im7,    label: iLbl },     // 11
    { notes: vm7,    label: vLbl }      // 12
  ];

  return JZG._generate12BarForm(map, `Aeolian Blues — ${key}`, key);
};

/**
 * 11.4  generateMinor251InBlues(key)
 * Minor ii-V-i with quartal voicings in blues context.
 * Uses the minor 251 in bars 9-11 of a minor blues.
 */
JZG.generateMinor251InBlues = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  // Minor blues: im7 for most bars, minor 251 at bars 9-11
  const im7 = JZG.CHORD_INTERVALS['min7'].map(i => root + i);
  const ivm7 = JZG.CHORD_INTERVALS['min7'].map(i => root + 5 + i);

  // Minor 251: iiø7 → V7 → im7
  const iiHD = JZG.CHORD_INTERVALS['min7b5'].map(i => root + 2 + i);
  const V7   = JZG.CHORD_INTERVALS['dom7'].map(i => root + 7 + i);

  const iLbl  = `${key}min7`;
  const ivLbl = `${JZG.pcToKeyName((t + 5) % 12)}min7`;
  const iiLbl = `${JZG.pcToKeyName((t + 2) % 12)}ø7`;
  const VLbl  = `${JZG.pcToKeyName((t + 7) % 12)}7`;

  const map = [
    { notes: im7,  label: iLbl },
    { notes: ivm7, label: ivLbl },
    { notes: im7,  label: iLbl },
    { notes: im7,  label: iLbl },
    { notes: ivm7, label: ivLbl },
    { notes: ivm7, label: ivLbl },
    { notes: im7,  label: iLbl },
    { notes: im7,  label: iLbl },
    { notes: iiHD, label: iiLbl },
    { notes: V7,   label: VLbl },
    { notes: im7,  label: iLbl },
    { notes: im7,  label: iLbl }
  ];

  return JZG._generate12BarForm(map, `Minor ii-V-i in Blues — ${key}`, key);
};

/**
 * 11.5  generateReharmedBlues(key)
 * Blues with tonicization chains, sidestep ii-V's, and backdoor ii-V's.
 * Reharmonized 12-bar form with more complex chord movement.
 */
JZG.generateReharmedBlues = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  // Reharmonized blues:
  // |I7|IV7|I7|V7/ii|ii-7|V7/V|V7|I7|iv-7|bVII7|I7|ii-7 V7|
  const chords = [
    { r: 0,  type: 'dom7', label: `${key}7` },
    { r: 5,  type: 'dom7', label: `${JZG.pcToKeyName((t + 5) % 12)}7` },
    { r: 0,  type: 'dom7', label: `${key}7` },
    { r: 9,  type: 'dom7', label: `${JZG.pcToKeyName((t + 9) % 12)}7 (V/ii)` },
    { r: 2,  type: 'min7', label: `${JZG.pcToKeyName((t + 2) % 12)}min7` },
    { r: 2,  type: 'dom7', label: `${JZG.pcToKeyName((t + 2) % 12)}7 (V/V)` },
    { r: 7,  type: 'dom7', label: `${JZG.pcToKeyName((t + 7) % 12)}7` },
    { r: 0,  type: 'dom7', label: `${key}7` },
    { r: 5,  type: 'min7', label: `${JZG.pcToKeyName((t + 5) % 12)}min7 (iv)` },
    { r: 10, type: 'dom7', label: `${JZG.pcToKeyName((t + 10) % 12)}7 (bVII)` },
    { r: 0,  type: 'maj7', label: `${key}Maj7` },
    { r: 2,  type: 'min7', label: `${JZG.pcToKeyName((t + 2) % 12)}min7` }  // turnaround
  ];

  let xml = '';
  chords.forEach((c, i) => {
    const notes = JZG._buildVoicing(root + c.r, c.type,
      i % 2 === 0 ? JZG.VOICING_TYPE_A : JZG.VOICING_TYPE_B);
    xml += JZG.generateMeasure(notes, i + 1, c.label, key);
  });

  return JZG.wrapDocument(xml, `Reharmonized Blues — ${key}`);
};


// ============================================================================
// STAGE 12: ODD TIME SIGNATURES  (Book 3, Unit 11)
// ============================================================================
//
// "When tunes originally in 4/4 are adapted to 5/4, every other measure
//  loses one beat."  — Siskind, Book 3, Unit 11

/**
 * Helper: generate a measure with a custom time signature.
 * @param {number[]} midiNotes
 * @param {number[]} durations
 * @param {number} measureNum
 * @param {number} beats       – numerator of time sig
 * @param {number} beatType    – denominator of time sig
 * @param {string} chordSymbol
 * @param {string} key
 * @returns {string}
 */
JZG._generateOddTimeMeasure = function (midiNotes, durations, measureNum, beats, beatType, chordSymbol, key) {
  const typeMap = { 1: 'sixteenth', 2: 'eighth', 4: 'quarter', 8: 'half', 16: 'whole' };
  let xml = `    <measure number="${measureNum}">\n`;
  if (measureNum === 1) {
    xml += '      <attributes>\n';
    xml += '        <divisions>4</divisions>\n';
    xml += `        <time>\n          <beats>${beats}</beats>\n          <beat-type>${beatType}</beat-type>\n        </time>\n`;
    xml += '        <clef>\n          <sign>G</sign>\n          <line>2</line>\n        </clef>\n';
    xml += '      </attributes>\n';
  }
  if (chordSymbol) {
    xml += `      <direction placement="above">\n        <direction-type>\n          <words default-y="40" font-size="12" font-weight="bold">${chordSymbol}</words>\n        </direction-type>\n      </direction>\n`;
  }
  for (let i = 0; i < midiNotes.length; i++) {
    const dur = durations[i] || 4;
    const tp = typeMap[dur] || 'quarter';
    xml += JZG.generateSingleNote(midiNotes[i], dur, tp, key);
  }
  xml += `    </measure>\n`;
  return xml;
};

/**
 * Helper: generate a chord measure with custom time signature.
 */
JZG._generateOddTimeChordMeasure = function (midiNotes, duration, type, measureNum, beats, beatType, chordSymbol, key) {
  let xml = `    <measure number="${measureNum}">\n`;
  if (measureNum === 1) {
    xml += '      <attributes>\n';
    xml += '        <divisions>4</divisions>\n';
    xml += `        <time>\n          <beats>${beats}</beats>\n          <beat-type>${beatType}</beat-type>\n        </time>\n`;
    xml += '        <clef>\n          <sign>G</sign>\n          <line>2</line>\n        </clef>\n';
    xml += '      </attributes>\n';
  }
  if (chordSymbol) {
    xml += `      <direction placement="above">\n        <direction-type>\n          <words default-y="40" font-size="12" font-weight="bold">${chordSymbol}</words>\n        </direction-type>\n      </direction>\n`;
  }
  xml += JZG.generateChord(midiNotes, duration, type, key);
  xml += `    </measure>\n`;
  return xml;
};

/**
 * 12.1  generateStandardIn5_4(key)
 * ii-V-I adapted to 5/4 time. Each chord gets 5 beats (duration=20).
 */
JZG.generateStandardIn5_4 = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  const iiNotes = JZG._buildVoicing(root + 2, 'min7', JZG.VOICING_TYPE_A);
  const vNotes  = JZG._buildVoicing(root + 7, 'dom7', JZG.VOICING_TYPE_B);
  const iNotes  = JZG._buildVoicing(root + 12, 'maj7', JZG.VOICING_TYPE_A);

  const iiLabel = `${JZG.pcToKeyName((t + 2) % 12)}min7`;
  const vLabel  = `${JZG.pcToKeyName((t + 7) % 12)}7`;
  const iLabel  = `${key}Maj7`;

  // 5/4: use a dotted whole (duration=20 with divisions=4, 5 quarter beats)
  // MusicXML doesn't have a "5-beat" type, so use whole + quarter tied
  // Simplification: render as whole note (16) + quarter (4) tied
  let xml = '';

  // Measure 1: ii chord — whole note tied to quarter
  xml += `    <measure number="1">\n`;
  xml += '      <attributes>\n';
  xml += '        <divisions>4</divisions>\n';
  xml += '        <time>\n          <beats>5</beats>\n          <beat-type>4</beat-type>\n        </time>\n';
  xml += '        <clef>\n          <sign>G</sign>\n          <line>2</line>\n        </clef>\n';
  xml += '      </attributes>\n';
  xml += `      <direction placement="above">\n        <direction-type>\n          <words default-y="40" font-size="12" font-weight="bold">${iiLabel}</words>\n        </direction-type>\n      </direction>\n`;
  // Whole note chord (16) + quarter note chord (4) for 5 beats
  xml += JZG.generateChord(iiNotes, 16, 'whole', key);
  xml += JZG.generateChord(iiNotes, 4, 'quarter', key);
  xml += `    </measure>\n`;

  // Measure 2: V chord
  xml += `    <measure number="2">\n`;
  xml += `      <direction placement="above">\n        <direction-type>\n          <words default-y="40" font-size="12" font-weight="bold">${vLabel}</words>\n        </direction-type>\n      </direction>\n`;
  xml += JZG.generateChord(vNotes, 16, 'whole', key);
  xml += JZG.generateChord(vNotes, 4, 'quarter', key);
  xml += `    </measure>\n`;

  // Measure 3: I chord
  xml += `    <measure number="3">\n`;
  xml += `      <direction placement="above">\n        <direction-type>\n          <words default-y="40" font-size="12" font-weight="bold">${iLabel}</words>\n        </direction-type>\n      </direction>\n`;
  xml += JZG.generateChord(iNotes, 16, 'whole', key);
  xml += JZG.generateChord(iNotes, 4, 'quarter', key);
  xml += `    </measure>\n`;

  return JZG.wrapDocument(xml, `ii-V-I in 5/4 — ${key}`);
};

/**
 * 12.2  generateStandardIn7_4(key)
 * ii-V-I adapted to 7/4 time. Each chord gets 7 beats.
 */
JZG.generateStandardIn7_4 = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 48 + t;

  const iiNotes = JZG._buildVoicing(root + 2, 'min7', JZG.VOICING_TYPE_A);
  const vNotes  = JZG._buildVoicing(root + 7, 'dom7', JZG.VOICING_TYPE_B);
  const iNotes  = JZG._buildVoicing(root + 12, 'maj7', JZG.VOICING_TYPE_A);

  const iiLabel = `${JZG.pcToKeyName((t + 2) % 12)}min7`;
  const vLabel  = `${JZG.pcToKeyName((t + 7) % 12)}7`;
  const iLabel  = `${key}Maj7`;

  // 7/4: whole note (16) + dotted half (12) = 28 divisions = 7 beats
  let xml = '';

  // Measure 1
  xml += `    <measure number="1">\n`;
  xml += '      <attributes>\n';
  xml += '        <divisions>4</divisions>\n';
  xml += '        <time>\n          <beats>7</beats>\n          <beat-type>4</beat-type>\n        </time>\n';
  xml += '        <clef>\n          <sign>G</sign>\n          <line>2</line>\n        </clef>\n';
  xml += '      </attributes>\n';
  xml += `      <direction placement="above">\n        <direction-type>\n          <words default-y="40" font-size="12" font-weight="bold">${iiLabel}</words>\n        </direction-type>\n      </direction>\n`;
  xml += JZG.generateChord(iiNotes, 16, 'whole', key);
  xml += JZG.generateChord(iiNotes, 8, 'half', key);
  xml += JZG.generateChord(iiNotes, 4, 'quarter', key);
  xml += `    </measure>\n`;

  // Measure 2
  xml += `    <measure number="2">\n`;
  xml += `      <direction placement="above">\n        <direction-type>\n          <words default-y="40" font-size="12" font-weight="bold">${vLabel}</words>\n        </direction-type>\n      </direction>\n`;
  xml += JZG.generateChord(vNotes, 16, 'whole', key);
  xml += JZG.generateChord(vNotes, 8, 'half', key);
  xml += JZG.generateChord(vNotes, 4, 'quarter', key);
  xml += `    </measure>\n`;

  // Measure 3
  xml += `    <measure number="3">\n`;
  xml += `      <direction placement="above">\n        <direction-type>\n          <words default-y="40" font-size="12" font-weight="bold">${iLabel}</words>\n        </direction-type>\n      </direction>\n`;
  xml += JZG.generateChord(iNotes, 16, 'whole', key);
  xml += JZG.generateChord(iNotes, 8, 'half', key);
  xml += JZG.generateChord(iNotes, 4, 'quarter', key);
  xml += `    </measure>\n`;

  return JZG.wrapDocument(xml, `ii-V-I in 7/4 — ${key}`);
};

/**
 * 12.3  generateHemiola(key)
 * 3-against-2 pattern: groups of 3 eighth notes over 4/4 time.
 * Arpeggiates through ii-V-I chord tones in dotted-quarter groupings.
 */
JZG.generateHemiola = function (key) {
  const t = JZG.transpositionFromC(key);
  const root = 60 + t;

  // ii chord tones grouped in 3 eighth notes
  const iiTones = [root + 2, root + 5, root + 9, root + 12,
                   root + 5, root + 9, root + 12, root + 14];
  // All eighth notes (duration=2)
  const eighths = iiTones.map(() => 2);

  // V chord tones
  const vTones = [root + 7, root + 11, root + 14, root + 17,
                  root + 11, root + 14, root + 17, root + 19];

  // I chord tones
  const iTones = [root + 12, root + 16, root + 19, root + 23,
                  root + 16, root + 19, root + 23, root + 24];

  const iiLabel = `${JZG.pcToKeyName((t + 2) % 12)}min7 (hemiola)`;
  const vLabel  = `${JZG.pcToKeyName((t + 7) % 12)}7 (hemiola)`;
  const iLabel  = `${key}Maj7 (hemiola)`;

  let xml = '';
  xml += JZG.generateMelodyMeasure(iiTones, eighths, 1, iiLabel, key);
  xml += JZG.generateMelodyMeasure(vTones,  eighths, 2, vLabel, key);
  xml += JZG.generateMelodyMeasure(iTones,  eighths, 3, iLabel, key);

  return JZG.wrapDocument(xml, `Hemiola (3-against-2) — ${key}`);
};


// ============================================================================
// STAGES 0–12 CATALOG
// ============================================================================

const STAGES_0_12_CATALOG = {

  // --------------------------------------------------------------------------
  // STAGE 0 (cross-reference to P0)
  // --------------------------------------------------------------------------
  '0.0': {
    stage: 0,
    name: 'Intervals & Foundations (see Stage P0)',
    generator: null,
    generatorType: 'reference',
    flashcardPrompt: 'See Stage_P0_Intervals.js for all interval exercises.',
    whyItMatters: 'Intervals are the DNA of all chords, scales, and melodies.',
    memorizationTips: 'Covered in Stage P0.',
    source: 'Stage_P0_Intervals.js',
    theoryNotes: 'See STAGE_P0_CATALOG for exercises P0.1–P0.12.'
  },

  // --------------------------------------------------------------------------
  // STAGE 1: Chord Construction (Book 1, Units 1–2)
  // --------------------------------------------------------------------------
  '1.1': {
    stage: 1,
    name: 'Major 7th Chord',
    generator: 'generateSingleChordExercise',
    generatorArgs: ['key', 'maj7'],
    generatorType: 'chord',
    flashcardPrompt: 'Play a Maj7 chord in root position.',
    whyItMatters: 'The major 7th chord is the tonic sound of major keys.',
    memorizationTips: 'Root + M3 + P5 + M7. Bright, dreamy sound.',
    source: 'Siskind, Book 1, p.16'
  },
  '1.2': {
    stage: 1,
    name: 'Dominant 7th Chord',
    generator: 'generateSingleChordExercise',
    generatorArgs: ['key', 'dom7'],
    generatorType: 'chord',
    flashcardPrompt: 'Play a Dom7 chord in root position.',
    whyItMatters: 'The dominant 7th creates tension that resolves to the tonic.',
    memorizationTips: 'Root + M3 + P5 + m7. Strong, bluesy pull.',
    source: 'Siskind, Book 1, p.16'
  },
  '1.3': {
    stage: 1,
    name: 'Minor 7th Chord',
    generator: 'generateSingleChordExercise',
    generatorArgs: ['key', 'min7'],
    generatorType: 'chord',
    flashcardPrompt: 'Play a min7 chord in root position.',
    whyItMatters: 'The minor 7th is the most common minor chord in jazz.',
    memorizationTips: 'Root + m3 + P5 + m7. Warm, mellow sound.',
    source: 'Siskind, Book 1, p.16'
  },
  '1.4': {
    stage: 1,
    name: 'Half-Diminished 7th Chord',
    generator: 'generateSingleChordExercise',
    generatorArgs: ['key', 'min7b5'],
    generatorType: 'chord',
    flashcardPrompt: 'Play a min7(b5) / half-dim chord in root position.',
    whyItMatters: 'The ii chord in minor keys; gateway to minor ii-V-i.',
    memorizationTips: 'Root + m3 + dim5 + m7. Dark and tense.',
    source: 'Siskind, Book 1, p.16'
  },
  '1.5': {
    stage: 1,
    name: 'Diminished 7th Chord',
    generator: 'generateSingleChordExercise',
    generatorArgs: ['key', 'dim7'],
    generatorType: 'chord',
    flashcardPrompt: 'Play a dim7 chord in root position.',
    whyItMatters: 'Symmetrical chord used for passing motion and walk-ups.',
    memorizationTips: 'All minor 3rds stacked. Only 3 unique dim7 chords exist.',
    source: 'Siskind, Book 1, p.16',
    theoryNotes: '"For the vast majority of this book, you will be dealing with three crucial chord types." — Siskind, Book 1, p.16'
  },

  // --------------------------------------------------------------------------
  // STAGE 2: ii-V-I Progression (Book 1, Units 3–5)
  // --------------------------------------------------------------------------
  '2.1': {
    stage: 2,
    name: 'ii-V-I Root Position',
    generator: 'generate251RootPosition',
    generatorType: 'progression',
    flashcardPrompt: 'Play a ii-V-I in root position.',
    whyItMatters: 'The most important harmonic progression in jazz.',
    memorizationTips: 'ii = min7 on 2nd degree, V = dom7 on 5th, I = maj7 on root.',
    source: 'Siskind, Book 1, p.36',
    theoryNotes: '"The ii-V-I progression and its components makes up a high percentage of the harmonic landscape of jazz standards." — Siskind, Book 1, p.36'
  },
  '2.2': {
    stage: 2,
    name: 'Shell Voicing',
    generator: 'generateShellVoicing',
    generatorArgs: ['key', 'min7'],
    generatorType: 'voicing',
    flashcardPrompt: 'Play the shell voicing (3rd + 7th) for the given chord.',
    whyItMatters: 'Shell voicings strip chords to their essential identity: 3rd and 7th.',
    memorizationTips: 'Just two notes define the chord quality.',
    source: 'Siskind, Book 1, p.36'
  },
  '2.3': {
    stage: 2,
    name: 'Minor ii-V-i',
    generator: 'generateMinor251',
    generatorType: 'progression',
    flashcardPrompt: 'Play a minor ii-V-i: iiø7 → V7(b9) → iMin6.',
    whyItMatters: 'The minor equivalent of the major ii-V-I; essential for minor standards.',
    memorizationTips: 'Half-dim → dom7(b9) → min6. Darker color.',
    source: 'Siskind, Book 1, p.36'
  },

  // --------------------------------------------------------------------------
  // STAGE 3: Type A/B Voicings (Book 1, Unit 6)
  // --------------------------------------------------------------------------
  '3.1': {
    stage: 3,
    name: 'ii-V-I Type A Voicing',
    generator: 'generate251TypeA',
    generatorType: 'voicing',
    flashcardPrompt: 'Play ii-V-I with Type A voicing (3-7-9-5).',
    whyItMatters: 'Type A/B voicings are the bread and butter of jazz piano comping.',
    memorizationTips: 'Type A bottom-to-top: 3rd, 7th, 9th, 5th. LH = guide tones.',
    source: 'Siskind, Book 1, p.86',
    theoryNotes: '"Type A/B voicings place the chord\'s essential tones, the thirds and sevenths, in the left hand." — Siskind, Book 1, p.86'
  },
  '3.2': {
    stage: 3,
    name: 'ii-V-I Type B Voicing',
    generator: 'generate251TypeB',
    generatorType: 'voicing',
    flashcardPrompt: 'Play ii-V-I with Type B voicing (7-3-5-9).',
    whyItMatters: 'Type B is the inversion of Type A, creating smooth voice leading.',
    memorizationTips: 'Type B bottom-to-top: 7th, 3rd, 5th, 9th.',
    source: 'Siskind, Book 1, p.86'
  },
  '3.3': {
    stage: 3,
    name: 'Dim7 Type A/B Voicing',
    generator: 'generateDim7Voicing',
    generatorType: 'voicing',
    flashcardPrompt: 'Play a dim7 chord with Type A and Type B voicings.',
    whyItMatters: 'Dim7 voicings enable passing chords and chromatic walk-ups.',
    memorizationTips: 'LH = 3rd + 7th(dim), RH = b5 + root.',
    source: 'Siskind, Book 1, p.86'
  },

  // --------------------------------------------------------------------------
  // STAGE 4: One-Handed Voicings (Book 1, Unit 8)
  // --------------------------------------------------------------------------
  '4.1a': {
    stage: 4,
    name: 'One-Handed Shell Type A',
    generator: 'generate251OneHandedShell',
    generatorArgs: ['key', 'A'],
    generatorType: 'voicing',
    flashcardPrompt: 'Play ii-V-I with one-handed Type A shells (3-7-9).',
    whyItMatters: 'Frees the other hand for melody or bass.',
    memorizationTips: 'Three notes: 3rd, 7th, 9th from bottom.',
    source: 'Siskind, Book 1, Unit 8'
  },
  '4.1b': {
    stage: 4,
    name: 'One-Handed Shell Type B',
    generator: 'generate251OneHandedShell',
    generatorArgs: ['key', 'B'],
    generatorType: 'voicing',
    flashcardPrompt: 'Play ii-V-I with one-handed Type B shells (7-3-5).',
    whyItMatters: 'Alternate inversion for smooth comping with one hand.',
    memorizationTips: 'Three notes: 7th, 3rd, 5th from bottom.',
    source: 'Siskind, Book 1, Unit 8'
  },
  '4.2': {
    stage: 4,
    name: 'Bass Line in Two',
    generator: 'generateBasslineInTwo',
    generatorType: 'bass_line',
    flashcardPrompt: 'Play half-note bass: root on beat 1, 5th on beat 3, through ii-V-I.',
    whyItMatters: 'Develops left-hand independence for solo piano playing.',
    memorizationTips: 'Root, then 5th. Two notes per bar.',
    source: 'Siskind, Book 1, Unit 8'
  },

  // --------------------------------------------------------------------------
  // STAGE 5: Blues Form (Book 1, Units 7–9)
  // --------------------------------------------------------------------------
  '5.1': {
    stage: 5,
    name: '12-Bar Jazz Blues',
    generator: 'generateJazzBlues',
    generatorType: 'form',
    flashcardPrompt: 'Play the 12-bar jazz blues form.',
    whyItMatters: 'The blues is the foundation of jazz; this is the standard 12-bar form.',
    memorizationTips: 'I-IV-I-I | IV-IV-I-I | ii-V-I-turnaround.',
    source: 'Siskind, Book 1, p.104',
    theoryNotes: '"About a quarter of jazz standards are blues tunes or some variation of the blues." — Siskind, Book 1, p.104'
  },
  '5.2': {
    stage: 5,
    name: 'Blues Scale',
    generator: 'generateBluesScale',
    generatorType: 'scale',
    flashcardPrompt: 'Play the blues scale ascending and descending.',
    whyItMatters: 'The blues scale is the most recognizable sound in American music.',
    memorizationTips: '1-b3-4-#4-5-b7. Six notes, one color.',
    source: 'Siskind, Book 1, p.104'
  },
  '5.3': {
    stage: 5,
    name: 'Sweet Scale',
    generator: 'generateSweetScale',
    generatorType: 'scale',
    flashcardPrompt: 'Play the sweet (bright blues) scale ascending and descending.',
    whyItMatters: 'Adds a brighter color to blues playing.',
    memorizationTips: '1-2-b3-3-5-6. Major-side blues flavor.',
    source: 'Siskind, Book 1, p.104'
  },

  // --------------------------------------------------------------------------
  // STAGE 6: Licks & Improvisation (Book 1, Units 3–12)
  // --------------------------------------------------------------------------
  '6.1': {
    stage: 6,
    name: 'Lick 1 (Short-Form)',
    generator: 'generateLick',
    generatorArgs: ['key', 1],
    generatorType: 'melody',
    flashcardPrompt: 'Play Lick 1 over ii-V-I.',
    whyItMatters: 'First lick vocabulary: ascending chord tones resolving to I.',
    memorizationTips: 'Starts on 3rd of ii, ascends through chord tones, whole-note resolution.',
    source: 'Siskind, Book 1, p.43',
    noteAccuracy: 'exact',
    theoryNotes: '"Learning to rattle off set phrases without thinking is very useful." — Siskind, Book 1, p.43'
  },
  '6.2': {
    stage: 6,
    name: 'Lick 2 (Long-Form)',
    generator: 'generateLick',
    generatorArgs: ['key', 2],
    generatorType: 'melody',
    flashcardPrompt: 'Play Lick 2 over ii-V-I.',
    whyItMatters: 'Reminds you of the parent scale; builds scalar fluency.',
    memorizationTips: 'Ascending scale through ii-V, descending resolution on I.',
    source: 'Siskind, Book 1, p.57',
    noteAccuracy: 'exact'
  },
  '6.3': {
    stage: 6,
    name: 'Lick 3 (Short-Form with Leap)',
    generator: 'generateLick',
    generatorArgs: ['key', 3],
    generatorType: 'melody',
    flashcardPrompt: 'Play Lick 3 over ii-V-I.',
    whyItMatters: 'Interesting shape created by the leap on the "and of three."',
    memorizationTips: 'Scale fragments with a notable leap in the middle.',
    source: 'Siskind, Book 1, p.62',
    noteAccuracy: 'approximate'
  },
  '6.4': {
    stage: 6,
    name: 'Lick 4 (Arpeggio + Turn)',
    generator: 'generateLick',
    generatorArgs: ['key', 4],
    generatorType: 'melody',
    flashcardPrompt: 'Play Lick 4 over ii-V-I.',
    whyItMatters: '3-5-7-9 arpeggio with a turn develops arpeggio fluency.',
    memorizationTips: 'Arpeggio up, turn at the top, descend.',
    source: 'Siskind, Book 1, p.84',
    noteAccuracy: 'approximate'
  },
  '6.5': {
    stage: 6,
    name: 'Lick 5 (Blues-Style)',
    generator: 'generateLick',
    generatorArgs: ['key', 5],
    generatorType: 'melody',
    flashcardPrompt: 'Play Lick 5 (blues style).',
    whyItMatters: 'Blues/minor-key flavor with double notes and turns.',
    memorizationTips: 'Uses blues scale intervals. "Almost sounds like a minor key."',
    source: 'Siskind, Book 1, p.102',
    noteAccuracy: 'approximate'
  },
  '6.6': {
    stage: 6,
    name: 'Lick 6 (Blues V-Chord)',
    generator: 'generateLick',
    generatorArgs: ['key', 6],
    generatorType: 'melody',
    flashcardPrompt: 'Play Lick 6 over the V chord (blues context).',
    whyItMatters: 'Fits with the V chord of a long-form ii-V-I; sweet scale sound.',
    memorizationTips: 'Sweet scale pattern ascending then descending over V.',
    source: 'Siskind, Book 1, p.114',
    noteAccuracy: 'approximate'
  },
  '6.7': {
    stage: 6,
    name: 'Lick 7 (3-5-7-9 Arpeggio with 13th)',
    generator: 'generateLick',
    generatorArgs: ['key', 7],
    generatorType: 'melody',
    flashcardPrompt: 'Play Lick 7: 3-5-7-9 arpeggios with 13th sub on V.',
    whyItMatters: 'The 13th substituting for 5th adds sophistication to arpeggio licks.',
    memorizationTips: 'Same as Lick 4 shape but with 13th replacing 5th on V.',
    source: 'Siskind, Book 1, p.136',
    noteAccuracy: 'approximate'
  },
  '6.8': {
    stage: 6,
    name: 'Lick 8 (Altered)',
    generator: 'generateLick',
    generatorArgs: ['key', 8],
    generatorType: 'melody',
    flashcardPrompt: 'Play Lick 8: altered tones on V chord.',
    whyItMatters: 'Adds altered color (b9/b13) for more tension on V.',
    memorizationTips: 'Same shape as Lick 7 but with altered tones.',
    source: 'Siskind, Book 1, p.153',
    noteAccuracy: 'approximate'
  },
  '6.9': {
    stage: 6,
    name: 'Lick 9 (Altered Dom with b9/#11)',
    generator: 'generateLick',
    generatorArgs: ['key', 9],
    generatorType: 'melody',
    flashcardPrompt: 'Play Lick 9: b9 and #11 arpeggio over V.',
    whyItMatters: 'Uses flat nine and sharp eleven in an arpeggio over V chord.',
    memorizationTips: 'Chromatic enclosure targeting altered chord tones.',
    source: 'Siskind, Book 1, p.169',
    noteAccuracy: 'approximate'
  },
  '6.10': {
    stage: 6,
    name: 'Lick 10 (Full Altered Scale)',
    generator: 'generateLick',
    generatorArgs: ['key', 10],
    generatorType: 'melody',
    flashcardPrompt: 'Play Lick 10: all four altered tones over V.',
    whyItMatters: 'Uses the altered scale over V; includes all four altered tones.',
    memorizationTips: 'Chromatic enclosures, ghost note, and turn. Most complex lick.',
    source: 'Siskind, Book 1, p.182',
    noteAccuracy: 'approximate'
  },
  '6.11': {
    stage: 6,
    name: '3-5-7-9 Arpeggios over ii-V-I',
    generator: 'generate3579Arpeggios',
    generatorType: 'melody',
    flashcardPrompt: 'Play 3-5-7-9 arpeggios through ii-V-I.',
    whyItMatters: 'Arpeggio fluency is the foundation of melodic improvisation.',
    memorizationTips: '3rd, 5th, 7th, 9th of each chord in sequence.',
    source: 'Siskind, Book 1'
  },
  '6.12': {
    stage: 6,
    name: 'Coordination Exercise',
    generator: null,
    generatorType: 'non_mxl',
    flashcardPrompt: 'Practice comping with LH voicings while RH plays licks.',
    whyItMatters: 'Two-hand coordination is essential for solo jazz piano.',
    memorizationTips: 'Start slowly. LH plays shells on beats 1 & 3; RH plays lick.',
    source: 'Siskind, Book 1'
  },

  // --------------------------------------------------------------------------
  // STAGE 7: Altered Dominants (Book 1, Units 10–12)
  // --------------------------------------------------------------------------
  '7.1a': {
    stage: 7,
    name: 'Altered Dom7(b9) Type A',
    generator: 'generateAlteredDomB9',
    generatorArgs: ['key', 'A'],
    generatorType: 'voicing',
    flashcardPrompt: 'Play a Dom7(b9) with Type A voicing.',
    whyItMatters: 'The b9 is the first and most common alteration on dominant chords.',
    memorizationTips: 'Take Type A dom7 voicing, lower the 9th by half step.',
    source: 'Siskind, Book 1, p.154',
    theoryNotes: '"Altered dominant chords are created by raising or lowering the color tones of a dominant seventh chord by a half step." — Siskind, Book 1, p.154'
  },
  '7.1b': {
    stage: 7,
    name: 'Altered Dom7(b9) Type B',
    generator: 'generateAlteredDomB9',
    generatorArgs: ['key', 'B'],
    generatorType: 'voicing',
    flashcardPrompt: 'Play a Dom7(b9) with Type B voicing.',
    whyItMatters: 'Type B inversion of the altered dominant for voice-leading options.',
    memorizationTips: 'Take Type B dom7 voicing, lower the 9th by half step.',
    source: 'Siskind, Book 1, p.154'
  },
  '7.2': {
    stage: 7,
    name: 'Tritone Substitution ii-V-I',
    generator: 'generateTritone251',
    generatorType: 'progression',
    flashcardPrompt: 'Play ii → bII7 → I (tritone sub).',
    whyItMatters: 'The tritone sub replaces V7 with a dom7 a tritone away for chromatic bass motion.',
    memorizationTips: 'bII = one half step above the root. Same tritone, different root.',
    source: 'Siskind, Book 1, p.154'
  },
  '7.3': {
    stage: 7,
    name: 'Altered Scale',
    generator: 'generateAlteredScale',
    generatorType: 'scale',
    flashcardPrompt: 'Play the altered scale (melodic minor from half-step above).',
    whyItMatters: 'Contains all four altered tones: b9, #9, #11, b13.',
    memorizationTips: 'Think melodic minor a half step up. Intervals: 1-b2-#2-3-b5-b6-b7.',
    source: 'Siskind, Book 1, p.154'
  },
  '7.4': {
    stage: 7,
    name: 'Combined Altered Voicings',
    generator: 'generateCombinedAlterations',
    generatorType: 'voicing',
    flashcardPrompt: 'Play dom7 with #9+b5, b9+b13, and full altered voicing.',
    whyItMatters: 'Combining alterations creates maximum tension before resolution.',
    memorizationTips: 'Three voicings: #9+b5, b9+b13, full altered. Each adds more color.',
    source: 'Siskind, Book 1, p.154'
  },

  // --------------------------------------------------------------------------
  // STAGE 8: Modal Jazz (Book 3, Units 1–4)
  // --------------------------------------------------------------------------
  '8.1': {
    stage: 8,
    name: 'All 7 Modes',
    generator: 'generateAllModes',
    generatorType: 'scale',
    flashcardPrompt: 'Play all 7 modes starting from the same root.',
    whyItMatters: 'Modal jazz requires fluency in all seven modes of the major scale.',
    memorizationTips: 'I-D-P-L-M-A-L: Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian.',
    source: 'Siskind, Book 3, Unit 1',
    theoryNotes: '"Modal jazz features slow harmonic rhythm, ambiguous tonal centers, and root movements outside the circle of fifths." — Siskind, Book 3, Unit 1'
  },
  '8.2': {
    stage: 8,
    name: 'Modal Drone',
    generator: 'generateModalDrone',
    generatorArgs: ['key', 'dorian'],
    generatorType: 'scale',
    flashcardPrompt: 'Play a mode ascending/descending over a drone bass note.',
    whyItMatters: 'Playing over a drone develops modal ear training.',
    memorizationTips: 'Hold the root in bass (or sustain), play mode in RH.',
    source: 'Siskind, Book 3, Unit 1'
  },
  '8.3a': {
    stage: 8,
    name: 'So What Voicing',
    generator: 'generateSoWhatVoicing',
    generatorType: 'voicing',
    flashcardPrompt: 'Play the So What voicing on each degree of the Dorian mode.',
    whyItMatters: 'The iconic voicing from Miles Davis\'s "So What" — defines modal jazz piano.',
    memorizationTips: '"A third on top with fourths draped below." Four P4ths + M3 on top.',
    source: 'Siskind, Book 3, Unit 2'
  },
  '8.3b': {
    stage: 8,
    name: '3-Note Quartal Voicing',
    generator: 'generate3NoteQuartalVoicing',
    generatorType: 'voicing',
    flashcardPrompt: 'Play 3-note quartal (stacked 4ths) voicings on each mode degree.',
    whyItMatters: 'Quartal voicings are the harmonic language of modal jazz.',
    memorizationTips: 'Three diatonic 4ths stacked. Follow the mode.',
    source: 'Siskind, Book 3, Unit 2'
  },
  '8.3c': {
    stage: 8,
    name: '5-Note Quartal Voicing',
    generator: 'generate5NoteQuartalVoicing',
    generatorType: 'voicing',
    flashcardPrompt: 'Play 5-note quartal voicings on each mode degree.',
    whyItMatters: 'Extended quartal voicings create the full modal jazz sound.',
    memorizationTips: 'Five diatonic 4ths stacked. Rich, open sound.',
    source: 'Siskind, Book 3, Unit 2'
  },
  '8.3d': {
    stage: 8,
    name: 'Cluster Voicing',
    generator: 'generateClusterVoicing',
    generatorType: 'voicing',
    flashcardPrompt: 'Play cluster voicings (stacked 2nds) on each mode degree.',
    whyItMatters: 'Cluster voicings create dense, modern-sounding harmonies.',
    memorizationTips: 'Three consecutive scale degrees sounding together.',
    source: 'Siskind, Book 3, Unit 2'
  },
  '8.4': {
    stage: 8,
    name: 'Upper Structure Triads',
    generator: 'generateUpperStructureTriads',
    generatorType: 'voicing',
    flashcardPrompt: 'Play diatonic triads within the Dorian mode.',
    whyItMatters: 'Upper structure triads add harmonic color to modal comping.',
    memorizationTips: 'Build a triad on each degree using only notes from the mode.',
    source: 'Siskind, Book 3, Unit 3'
  },
  '8.5': {
    stage: 8,
    name: 'Pentatonic for Chord',
    generator: 'generatePentatonicForChord',
    generatorArgs: ['key', 'min7'],
    generatorType: 'scale',
    flashcardPrompt: 'Play the primary and secondary pentatonic scales for a given chord type.',
    whyItMatters: 'Pentatonic scales are the simplest melodic tool for modal improvisation.',
    memorizationTips: 'Each chord type has a primary and secondary pentatonic.',
    source: 'Siskind, Book 3, Unit 3'
  },
  '8.6': {
    stage: 8,
    name: 'Pentatonic Voicing',
    generator: 'generatePentatonicVoicing',
    generatorType: 'voicing',
    flashcardPrompt: 'Play pentatonic voicings (every other note of the pentatonic).',
    whyItMatters: 'Spread pentatonic voicings create an open, modern sound.',
    memorizationTips: '"Select every other note of the pentatonic scale until all five are present."',
    source: 'Siskind, Book 3, Unit 4'
  },

  // --------------------------------------------------------------------------
  // STAGE 9: Reharmonization (Book 3 + Jazz Practice Studio)
  // --------------------------------------------------------------------------
  '9.1': {
    stage: 9,
    name: 'Secondary Dominant',
    generator: 'generateSecondaryDominant',
    generatorArgs: ['key', 'ii'],
    generatorType: 'progression',
    flashcardPrompt: 'Play a secondary dominant (V/ii, V/vi, V/V) resolving to its target.',
    whyItMatters: 'Secondary dominants add harmonic motion and color to progressions.',
    memorizationTips: 'Build a dom7 a P5 above the target chord.',
    source: 'Siskind, Book 3'
  },
  '9.2': {
    stage: 9,
    name: 'Backdoor ii-V',
    generator: 'generateBackdooriiV',
    generatorType: 'progression',
    flashcardPrompt: 'Play iv-7 → bVII7 → IMaj7 (backdoor ii-V).',
    whyItMatters: 'The backdoor ii-V is a common alternative resolution to the tonic.',
    memorizationTips: 'iv-7 and bVII7. Think: minor plagal cadence with a dominant color.',
    source: 'Siskind, Book 3'
  },
  '9.3': {
    stage: 9,
    name: 'Diminished Walk-Up',
    generator: 'generateDimWalkUp',
    generatorType: 'progression',
    flashcardPrompt: 'Play the diminished walk-up: I → #Io7 → ii → #iio7 → I/3.',
    whyItMatters: 'Chromatic ascending bass with alternating diatonic/dim chords.',
    memorizationTips: 'Diatonic chord, then dim7 one semitone up. Repeat.',
    source: 'Siskind, Book 3'
  },
  '9.4': {
    stage: 9,
    name: 'Turnaround I-vi-ii-V',
    generator: 'generateTurnaround_1625',
    generatorType: 'progression',
    flashcardPrompt: 'Play the I-vi-ii-V turnaround with Type A/B voicings.',
    whyItMatters: 'The most common turnaround in jazz standards.',
    memorizationTips: 'I-vi-ii-V. Descending by diatonic 3rds, then the "final approach."',
    source: 'Siskind, Book 3'
  },
  '9.5': {
    stage: 9,
    name: 'Turnaround iii-vi-ii-V',
    generator: 'generateTurnaround_3625',
    generatorType: 'progression',
    flashcardPrompt: 'Play the iii-vi-ii-V turnaround.',
    whyItMatters: 'Starting on iii creates a longer chain of dominant motion.',
    memorizationTips: 'iii-vi-ii-V. All roots descend by P5ths.',
    source: 'Siskind, Book 3'
  },
  '9.6': {
    stage: 9,
    name: 'Coltrane Changes',
    generator: 'generateColtraneChanges',
    generatorType: 'progression',
    flashcardPrompt: 'Play the Coltrane substitution: major-3rd cycle replacing ii-V-I.',
    whyItMatters: 'Coltrane changes divide the octave into major 3rds for maximum harmonic motion.',
    memorizationTips: '|IMaj7|bIII7|bVIMaj7|VII7|IIMaj7|#IV7|IMaj7|. Descend by M3rds.',
    source: 'Siskind, Book 3'
  },

  // --------------------------------------------------------------------------
  // STAGE 10: Modal Interchange (Book 3, Units 7–8)
  // --------------------------------------------------------------------------
  '10.1': {
    stage: 10,
    name: 'Modal Borrowing',
    generator: 'generateModalBorrowing',
    generatorType: 'progression',
    flashcardPrompt: 'Play a progression with borrowed chords from the parallel minor.',
    whyItMatters: 'Modal borrowing adds color by mixing major and minor tonalities.',
    memorizationTips: 'Swap a major-key chord for its parallel-minor equivalent (IV → iv, I → i).',
    source: 'Siskind, Book 3, Unit 7',
    theoryNotes: '"Three principal methods for adding notes from outside: tonicization, sidestepping, planing." — Siskind, Book 3, Unit 7'
  },
  '10.2': {
    stage: 10,
    name: 'Tonicization',
    generator: 'generateTonicization',
    generatorType: 'progression',
    flashcardPrompt: 'Play a tonicization chain: V7/ii → ii → V7/V → V → V7/I → I.',
    whyItMatters: 'Preceding a chord with its V7 creates tension and forward motion.',
    memorizationTips: 'Each chord is "tonicized" by its own dominant.',
    source: 'Siskind, Book 3, Unit 7'
  },
  '10.3': {
    stage: 10,
    name: 'Sidestep ii-V',
    generator: 'generateSidestep',
    generatorType: 'progression',
    flashcardPrompt: 'Play a sidestep approach: ii-V from half-step above, then target ii-V-I.',
    whyItMatters: 'Sidestepping creates outside sound by approaching from a half step away.',
    memorizationTips: 'Play a ii-V one semitone above the target, then resolve into the real ii-V-I.',
    source: 'Siskind, Book 3, Unit 7'
  },
  '10.4': {
    stage: 10,
    name: 'Planing',
    generator: 'generatePlaning',
    generatorType: 'progression',
    flashcardPrompt: 'Transpose a voicing in parallel: chromatic, whole-tone, m3, M3 motion.',
    whyItMatters: 'Planing creates modern, impressionistic sound through parallel movement.',
    memorizationTips: 'Same voicing shape, different transposition intervals.',
    source: 'Siskind, Book 3, Unit 7'
  },
  '10.5': {
    stage: 10,
    name: 'Modal Interchange over Static Chord',
    generator: 'generateModalInterchangeOverStatic',
    generatorType: 'progression',
    flashcardPrompt: 'Cycle through different modal chord qualities over one root.',
    whyItMatters: 'Hearing how different modes color the same root develops modal fluency.',
    memorizationTips: 'Same root, different chord quality: Maj7, 7, min7, ø7.',
    source: 'Siskind, Book 3, Unit 8'
  },

  // --------------------------------------------------------------------------
  // STAGE 11: Modal Blues (Book 3, Unit 10)
  // --------------------------------------------------------------------------
  '11.1': {
    stage: 11,
    name: 'Mixolydian Blues',
    generator: 'generateMixolydianBlues',
    generatorType: 'form',
    flashcardPrompt: 'Play the Mixolydian blues: 12-bar form with sus7 chords.',
    whyItMatters: 'Suspended chords remove the major/minor 3rd, creating an open modal sound.',
    memorizationTips: 'Replace all dom7 chords with sus7. Same 12-bar form.',
    source: 'Siskind, Book 3, Unit 10',
    theoryNotes: '"By using modal harmonies, musicians can create alternate versions of the blues." — Siskind, Book 3, Unit 10'
  },
  '11.2': {
    stage: 11,
    name: 'Dorian Blues',
    generator: 'generateDorianBlues',
    generatorType: 'form',
    flashcardPrompt: 'Play the Dorian blues: 12-bar form with all min7 chords.',
    whyItMatters: 'Dorian blues creates a darker, minor-key blues sound.',
    memorizationTips: 'I=min7, IV=min7, V=min7. All minor, all the time.',
    source: 'Siskind, Book 3, Unit 10'
  },
  '11.3': {
    stage: 11,
    name: 'Aeolian Blues',
    generator: 'generateAeolianBlues',
    generatorType: 'form',
    flashcardPrompt: 'Play the Aeolian blues: natural minor sound.',
    whyItMatters: 'Aeolian blues uses bVI and bVII for a natural minor color.',
    memorizationTips: 'i-iv-bVI-bVII. Think natural minor chords.',
    source: 'Siskind, Book 3, Unit 10'
  },
  '11.4': {
    stage: 11,
    name: 'Minor ii-V-i in Blues',
    generator: 'generateMinor251InBlues',
    generatorType: 'form',
    flashcardPrompt: 'Play a minor blues with minor ii-V-i at bars 9-11.',
    whyItMatters: 'Integrates minor ii-V-i into the blues form for richer harmony.',
    memorizationTips: 'Standard minor blues + iiø-V7-im at the turnaround.',
    source: 'Siskind, Book 3, Unit 10'
  },
  '11.5': {
    stage: 11,
    name: 'Reharmonized Blues',
    generator: 'generateReharmedBlues',
    generatorType: 'form',
    flashcardPrompt: 'Play a reharmonized blues with tonicizations, sidesteps, and backdoor ii-V.',
    whyItMatters: 'Combines all reharmonization techniques in the most common jazz form.',
    memorizationTips: 'Standard blues + secondary dominants, backdoor ii-V in bars 9-10.',
    source: 'Siskind, Book 3, Unit 10'
  },

  // --------------------------------------------------------------------------
  // STAGE 12: Odd Time Signatures (Book 3, Unit 11)
  // --------------------------------------------------------------------------
  '12.1': {
    stage: 12,
    name: 'ii-V-I in 5/4',
    generator: 'generateStandardIn5_4',
    generatorType: 'progression',
    flashcardPrompt: 'Play ii-V-I adapted to 5/4 time.',
    whyItMatters: '5/4 is the most common odd meter in jazz (e.g., "Take Five").',
    memorizationTips: 'Same voicings, but each chord lasts 5 beats instead of 4.',
    source: 'Siskind, Book 3, Unit 11',
    theoryNotes: '"When tunes originally in 4/4 are adapted to 5/4, every other measure loses one beat." — Siskind, Book 3, Unit 11'
  },
  '12.2': {
    stage: 12,
    name: 'ii-V-I in 7/4',
    generator: 'generateStandardIn7_4',
    generatorType: 'progression',
    flashcardPrompt: 'Play ii-V-I adapted to 7/4 time.',
    whyItMatters: '7/4 is used in jazz fusion and world music contexts.',
    memorizationTips: 'Same voicings, 7 beats per chord. Feel it as 4+3 or 3+4.',
    source: 'Siskind, Book 3, Unit 11'
  },
  '12.3': {
    stage: 12,
    name: 'Hemiola (3-against-2)',
    generator: 'generateHemiola',
    generatorType: 'melody',
    flashcardPrompt: 'Play a hemiola pattern: groups of 3 eighth notes over 4/4.',
    whyItMatters: 'Hemiola creates polyrhythmic tension; a hallmark of advanced jazz phrasing.',
    memorizationTips: 'Eighth notes grouped in 3s over 4/4. The downbeats shift.',
    source: 'Siskind, Book 3, Unit 11'
  },
  '12.4': {
    stage: 12,
    name: 'Odd-Meter Composition Exercise',
    generator: null,
    generatorType: 'non_mxl',
    flashcardPrompt: 'Compose a 16-bar melody in 5/4 or 7/4.',
    whyItMatters: 'Composition in odd meters develops internalization of asymmetric pulse.',
    memorizationTips: 'Write a melody, then comp underneath it.',
    source: 'Siskind, Book 3, Unit 11'
  },
  '12.5': {
    stage: 12,
    name: 'Metric Modulation Exercise',
    generator: null,
    generatorType: 'non_mxl',
    flashcardPrompt: 'Practice metric modulation: switch between 4/4 and 3/4 mid-phrase.',
    whyItMatters: 'Metric modulation is a hallmark of modern jazz and fusion.',
    memorizationTips: 'Use a metronome. The "one" shifts when you modulate.',
    source: 'Siskind, Book 3, Unit 11'
  }
};


// ============================================================================
// ATTACH CATALOG TO CLASS
// ============================================================================
JZG.STAGES_0_12_CATALOG = STAGES_0_12_CATALOG;


// ============================================================================
// COMPLETION TRACKER — Stages 0–12
// ============================================================================
//
// ### COMPLETE (generator works):
//
// Stage 1 — Chord Construction:
//   1.1  generateSingleChordExercise(key, 'maj7')         COMPLETE
//   1.2  generateSingleChordExercise(key, 'dom7')         COMPLETE
//   1.3  generateSingleChordExercise(key, 'min7')         COMPLETE
//   1.4  generateSingleChordExercise(key, 'min7b5')       COMPLETE
//   1.5  generateSingleChordExercise(key, 'dim7')         COMPLETE
//
// Stage 2 — ii-V-I Progression:
//   2.1  generate251RootPosition(key)                     COMPLETE
//   2.2  generateShellVoicing(key, chordType)             COMPLETE
//   2.3  generateMinor251(key)                            COMPLETE
//
// Stage 3 — Type A/B Voicings:
//   3.1  generate251TypeA(key)                            COMPLETE
//   3.2  generate251TypeB(key)                            COMPLETE
//   3.3  generateDim7Voicing(key)                         COMPLETE
//
// Stage 4 — One-Handed Voicings:
//   4.1a generate251OneHandedShell(key, 'A')              COMPLETE
//   4.1b generate251OneHandedShell(key, 'B')              COMPLETE
//   4.2  generateBasslineInTwo(key)                       COMPLETE
//
// Stage 5 — Blues Form:
//   5.1  generateJazzBlues(key)                           COMPLETE
//   5.2  generateBluesScale(key)                          COMPLETE
//   5.3  generateSweetScale(key)                          COMPLETE
//
// Stage 6 — Licks & Improvisation:
//   6.1  generateLick(key, 1)                             COMPLETE (exact)
//   6.2  generateLick(key, 2)                             COMPLETE (exact)
//   6.3  generateLick(key, 3)                             APPROXIMATE
//   6.4  generateLick(key, 4)                             APPROXIMATE
//   6.5  generateLick(key, 5)                             APPROXIMATE
//   6.6  generateLick(key, 6)                             APPROXIMATE
//   6.7  generateLick(key, 7)                             APPROXIMATE
//   6.8  generateLick(key, 8)                             APPROXIMATE
//   6.9  generateLick(key, 9)                             APPROXIMATE
//   6.10 generateLick(key, 10)                            APPROXIMATE
//   6.11 generate3579Arpeggios(key)                       COMPLETE
//   6.12 Coordination exercise                            NON_MXL
//
// Stage 7 — Altered Dominants:
//   7.1a generateAlteredDomB9(key, 'A')                   COMPLETE
//   7.1b generateAlteredDomB9(key, 'B')                   COMPLETE
//   7.2  generateTritone251(key)                          COMPLETE
//   7.3  generateAlteredScale(key)                        COMPLETE
//   7.4  generateCombinedAlterations(key)                 COMPLETE
//
// Stage 8 — Modal Jazz:
//   8.1  generateAllModes(key)                            COMPLETE
//   8.2  generateModalDrone(key, modeName)                COMPLETE
//   8.3a generateSoWhatVoicing(key)                       COMPLETE
//   8.3b generate3NoteQuartalVoicing(key)                 COMPLETE
//   8.3c generate5NoteQuartalVoicing(key)                 COMPLETE
//   8.3d generateClusterVoicing(key)                      COMPLETE
//   8.4  generateUpperStructureTriads(key)                COMPLETE
//   8.5  generatePentatonicForChord(key, chordType)       COMPLETE
//   8.6  generatePentatonicVoicing(key)                   COMPLETE
//
// Stage 9 — Reharmonization:
//   9.1  generateSecondaryDominant(key, target)           COMPLETE
//   9.2  generateBackdooriiV(key)                         COMPLETE
//   9.3  generateDimWalkUp(key)                           COMPLETE
//   9.4  generateTurnaround_1625(key)                     COMPLETE
//   9.5  generateTurnaround_3625(key)                     COMPLETE
//   9.6  generateColtraneChanges(key)                     COMPLETE
//
// Stage 10 — Modal Interchange:
//   10.1 generateModalBorrowing(key)                      COMPLETE
//   10.2 generateTonicization(key)                        COMPLETE
//   10.3 generateSidestep(key)                            COMPLETE
//   10.4 generatePlaning(key)                             COMPLETE
//   10.5 generateModalInterchangeOverStatic(key)          COMPLETE
//
// Stage 11 — Modal Blues:
//   11.1 generateMixolydianBlues(key)                     COMPLETE
//   11.2 generateDorianBlues(key)                         COMPLETE
//   11.3 generateAeolianBlues(key)                        COMPLETE
//   11.4 generateMinor251InBlues(key)                     COMPLETE
//   11.5 generateReharmedBlues(key)                       COMPLETE
//
// Stage 12 — Odd Time Signatures:
//   12.1 generateStandardIn5_4(key)                       COMPLETE
//   12.2 generateStandardIn7_4(key)                       COMPLETE
//   12.3 generateHemiola(key)                             COMPLETE
//   12.4 Odd-meter composition exercise                   NON_MXL
//   12.5 Metric modulation exercise                       NON_MXL
//
// --------------------------------------------------------------------------
// STAGE 0 (P0): Intervals — COMPLETE (see Stage_P0_Intervals.js)
// --------------------------------------------------------------------------
//
// TOTALS:
//   COMPLETE:    55 generators
//   APPROXIMATE:  8 lick generators (Licks 3–10, interval patterns from
//                   text descriptions — exact notation requires book pages)
//   NON_MXL:      3 exercises (coordination, composition, metric modulation)
//
// ============================================================================
