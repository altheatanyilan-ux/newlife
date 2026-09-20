/* ============================================================
   STAGE P0 — INTERVALS, AND THE TWELVE BY TWELVE.

   Came as a fragment meant to be pasted into the generator's class body,
   which is not something a file can be. So it is declared as a subclass and
   its static members are copied onto the generator: the same result as
   pasting, without editing somebody else's class by hand and without the
   next version of this file needing the same surgery again.
   ============================================================ */
class JazzP0Mixin extends JazzExerciseGenerator {

  // --------------------------------------------------------------------------
  // P0-A  INTERVAL MAP
  // --------------------------------------------------------------------------

  /**
   * Complete map of the 13 intervals from unison through octave.
   * Each entry: semitones from root, abbreviation, full name.
   * @type {Object.<string, {semitones: number, abbrev: string, name: string}>}
   */
  static INTERVAL_MAP = {
    'unison':     { semitones: 0,  abbrev: 'P1',  name: 'Perfect Unison' },
    'minor2nd':   { semitones: 1,  abbrev: 'm2',  name: 'Minor 2nd' },
    'major2nd':   { semitones: 2,  abbrev: 'M2',  name: 'Major 2nd' },
    'minor3rd':   { semitones: 3,  abbrev: 'm3',  name: 'Minor 3rd' },
    'major3rd':   { semitones: 4,  abbrev: 'M3',  name: 'Major 3rd' },
    'perfect4th': { semitones: 5,  abbrev: 'P4',  name: 'Perfect 4th' },
    'tritone':    { semitones: 6,  abbrev: 'TT',  name: 'Tritone' },
    'perfect5th': { semitones: 7,  abbrev: 'P5',  name: 'Perfect 5th' },
    'minor6th':   { semitones: 8,  abbrev: 'm6',  name: 'Minor 6th' },
    'major6th':   { semitones: 9,  abbrev: 'M6',  name: 'Major 6th' },
    'minor7th':   { semitones: 10, abbrev: 'm7',  name: 'Minor 7th' },
    'major7th':   { semitones: 11, abbrev: 'M7',  name: 'Major 7th' },
    'octave':     { semitones: 12, abbrev: 'P8',  name: 'Perfect Octave' }
  };

  /**
   * The 12 non-unison interval keys, ordered chromatically (m2 → P8).
   * Used for matrix rows, "all intervals" generators, etc.
   * @type {string[]}
   */
  static INTERVAL_KEYS_12 = [
    'minor2nd', 'major2nd', 'minor3rd', 'major3rd', 'perfect4th',
    'tritone', 'perfect5th', 'minor6th', 'major6th', 'minor7th',
    'major7th', 'octave'
  ];



  // --------------------------------------------------------------------------
  // P0.1  Single Interval Display
  // --------------------------------------------------------------------------

  /**
   * Shows root note (whole note) then interval note (whole note) in 2 measures.
   * @param {string} key - root key, e.g. "C", "Db", "F#"
   * @param {string} intervalName - key into INTERVAL_MAP, e.g. "minor3rd"
   * @returns {string} MusicXML document
   */
  static generateInterval(key, intervalName) {
    const interval = JazzExerciseGenerator.INTERVAL_MAP[intervalName];
    if (!interval) throw new Error(`Unknown interval: ${intervalName}`);
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const rootMidi = 60 + t;
    const intMidi  = rootMidi + interval.semitones;

    let measures = '';
    // Measure 1: root as whole note, labeled with key name
    measures += JazzExerciseGenerator.generateMelodyMeasure(
      [rootMidi], [16], 1, key, key
    );
    // Measure 2: interval note as whole note, labeled with interval abbrev
    measures += JazzExerciseGenerator.generateMelodyMeasure(
      [intMidi], [16], 2, interval.abbrev, key
    );

    return JazzExerciseGenerator.wrapDocument(measures,
      `P0.1 ${interval.name} from ${key}`);
  }

  // --------------------------------------------------------------------------
  // P0.2  Single Interval Ascending + Descending
  // --------------------------------------------------------------------------

  /**
   * 4 measures: root (whole), interval up (whole), interval note (whole),
   * root down (whole).  Ascending then descending.
   * @param {string} key
   * @param {string} intervalName
   * @returns {string} MusicXML document
   */
  static generateIntervalAscDesc(key, intervalName) {
    const interval = JazzExerciseGenerator.INTERVAL_MAP[intervalName];
    if (!interval) throw new Error(`Unknown interval: ${intervalName}`);
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const rootMidi = 60 + t;
    const intMidi  = rootMidi + interval.semitones;

    let measures = '';
    // Ascending: root → interval
    measures += JazzExerciseGenerator.generateMelodyMeasure(
      [rootMidi], [16], 1, `${key} (root)`, key
    );
    measures += JazzExerciseGenerator.generateMelodyMeasure(
      [intMidi], [16], 2, `${interval.abbrev} ↑`, key
    );
    // Descending: interval → root
    measures += JazzExerciseGenerator.generateMelodyMeasure(
      [intMidi], [16], 3, `${interval.abbrev}`, key
    );
    measures += JazzExerciseGenerator.generateMelodyMeasure(
      [rootMidi], [16], 4, `${key} (root) ↓`, key
    );

    return JazzExerciseGenerator.wrapDocument(measures,
      `P0.2 ${interval.name} from ${key} — Asc + Desc`);
  }

  // --------------------------------------------------------------------------
  // P0.3  All 12 Intervals from One Root (Chromatic Staircase — Harmonic)
  // --------------------------------------------------------------------------

  /**
   * 12 measures, each containing root + interval note stacked as a harmonic
   * interval (two notes sounded together).  m2 through P8.
   * The "ruler of pitch" — hearing the entire spectrum from one starting note.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateAllIntervalsFromRoot(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const rootMidi = 60 + t;
    let measures = '';

    JazzExerciseGenerator.INTERVAL_KEYS_12.forEach((intKey, i) => {
      const interval = JazzExerciseGenerator.INTERVAL_MAP[intKey];
      const intMidi  = rootMidi + interval.semitones;
      measures += JazzExerciseGenerator.generateMeasure(
        [rootMidi, intMidi], i + 1, interval.abbrev, key
      );
    });

    return JazzExerciseGenerator.wrapDocument(measures,
      `P0.3 All 12 Intervals from ${key} — Chromatic Staircase (Harmonic)`);
  }

  // --------------------------------------------------------------------------
  // P0.4  All 12 Intervals as Melodic (Ascending)
  // --------------------------------------------------------------------------

  /**
   * 12 measures, each with root then interval note as quarter notes,
   * followed by a half rest.  Ascending only — hear each interval melodically.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateAllIntervalsMelodic(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const rootMidi = 60 + t;
    let measures = '';

    JazzExerciseGenerator.INTERVAL_KEYS_12.forEach((intKey, i) => {
      const interval = JazzExerciseGenerator.INTERVAL_MAP[intKey];
      const intMidi  = rootMidi + interval.semitones;
      // quarter root, quarter interval, half rest
      let xml = `    <measure number="${i + 1}">\n`;
      if (i === 0) {
        xml += '      <attributes>\n';
        xml += '        <divisions>4</divisions>\n';
        xml += '        <time>\n          <beats>4</beats>\n          <beat-type>4</beat-type>\n        </time>\n';
        xml += '        <clef>\n          <sign>G</sign>\n          <line>2</line>\n        </clef>\n';
        xml += '      </attributes>\n';
      }
      xml += `      <direction placement="above">\n        <direction-type>\n          <words default-y="40" font-size="12" font-weight="bold">${interval.abbrev}</words>\n        </direction-type>\n      </direction>\n`;
      xml += JazzExerciseGenerator.generateSingleNote(rootMidi, 4, 'quarter', key);
      xml += JazzExerciseGenerator.generateSingleNote(intMidi, 4, 'quarter', key);
      xml += JazzExerciseGenerator.generateRest(8, 'half');
      xml += `    </measure>\n`;
      measures += xml;
    });

    return JazzExerciseGenerator.wrapDocument(measures,
      `P0.4 All 12 Intervals from ${key} — Melodic Ascending`);
  }

  // --------------------------------------------------------------------------
  // P0.5  Interval Sprint: Circle of 4ths
  // --------------------------------------------------------------------------

  /**
   * 12 measures, one per key in circle-of-4ths order
   * (C→F→Bb→Eb→Ab→Db→Gb→B→E→A→D→G).
   * Each measure: root (quarter) then interval (quarter) then half rest.
   * The core "sprint" drill — same interval, all 12 keys, jazz-natural order.
   * @param {string} intervalName - key into INTERVAL_MAP
   * @returns {string} MusicXML document
   */
  static generateIntervalSprint_CircleOf4ths(intervalName) {
    const interval = JazzExerciseGenerator.INTERVAL_MAP[intervalName];
    if (!interval) throw new Error(`Unknown interval: ${intervalName}`);

    let measures = '';
    JazzExerciseGenerator.KEY_NAMES_CYCLE5.forEach((k, i) => {
      const rootMidi = 60 + JazzExerciseGenerator.transpositionFromC(k);
      const intMidi  = rootMidi + interval.semitones;

      let xml = `    <measure number="${i + 1}">\n`;
      if (i === 0) {
        xml += '      <attributes>\n';
        xml += '        <divisions>4</divisions>\n';
        xml += '        <time>\n          <beats>4</beats>\n          <beat-type>4</beat-type>\n        </time>\n';
        xml += '        <clef>\n          <sign>G</sign>\n          <line>2</line>\n        </clef>\n';
        xml += '      </attributes>\n';
      }
      xml += `      <direction placement="above">\n        <direction-type>\n          <words default-y="40" font-size="12" font-weight="bold">${k}</words>\n        </direction-type>\n      </direction>\n`;
      xml += JazzExerciseGenerator.generateSingleNote(rootMidi, 4, 'quarter', k);
      xml += JazzExerciseGenerator.generateSingleNote(intMidi, 4, 'quarter', k);
      xml += JazzExerciseGenerator.generateRest(8, 'half');
      xml += `    </measure>\n`;
      measures += xml;
    });

    return JazzExerciseGenerator.wrapDocument(measures,
      `P0.5 ${interval.name} Sprint — Circle of 4ths`);
  }

  // --------------------------------------------------------------------------
  // P0.6  Interval Sprint: Chromatic
  // --------------------------------------------------------------------------

  /**
   * 12 measures, one per key in chromatic order
   * (C→Db→D→Eb→E→F→F#→G→Ab→A→Bb→B).
   * Each measure: root (quarter) then interval (quarter) then half rest.
   * Covers different physical patterns on the instrument.
   * @param {string} intervalName - key into INTERVAL_MAP
   * @returns {string} MusicXML document
   */
  static generateIntervalSprint_Chromatic(intervalName) {
    const interval = JazzExerciseGenerator.INTERVAL_MAP[intervalName];
    if (!interval) throw new Error(`Unknown interval: ${intervalName}`);

    let measures = '';
    JazzExerciseGenerator.KEY_NAMES_CHROMATIC.forEach((k, i) => {
      const rootMidi = 60 + JazzExerciseGenerator.transpositionFromC(k);
      const intMidi  = rootMidi + interval.semitones;

      let xml = `    <measure number="${i + 1}">\n`;
      if (i === 0) {
        xml += '      <attributes>\n';
        xml += '        <divisions>4</divisions>\n';
        xml += '        <time>\n          <beats>4</beats>\n          <beat-type>4</beat-type>\n        </time>\n';
        xml += '        <clef>\n          <sign>G</sign>\n          <line>2</line>\n        </clef>\n';
        xml += '      </attributes>\n';
      }
      xml += `      <direction placement="above">\n        <direction-type>\n          <words default-y="40" font-size="12" font-weight="bold">${k}</words>\n        </direction-type>\n      </direction>\n`;
      xml += JazzExerciseGenerator.generateSingleNote(rootMidi, 4, 'quarter', k);
      xml += JazzExerciseGenerator.generateSingleNote(intMidi, 4, 'quarter', k);
      xml += JazzExerciseGenerator.generateRest(8, 'half');
      xml += `    </measure>\n`;
      measures += xml;
    });

    return JazzExerciseGenerator.wrapDocument(measures,
      `P0.6 ${interval.name} Sprint — Chromatic`);
  }

  // --------------------------------------------------------------------------
  // P0.7  Perfect Intervals Group
  // --------------------------------------------------------------------------

  /**
   * Shows P1 (unison), P4, P5, P8 from one root as harmonic intervals (stacked).
   * 4 measures — the "stable, open" intervals.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generatePerfectIntervals(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const rootMidi = 60 + t;
    const perfects = ['unison', 'perfect4th', 'perfect5th', 'octave'];

    let measures = '';
    perfects.forEach((intKey, i) => {
      const interval = JazzExerciseGenerator.INTERVAL_MAP[intKey];
      const intMidi  = rootMidi + interval.semitones;
      // For unison, just show one note; for others, stack root + interval
      const notes = interval.semitones === 0
        ? [rootMidi]
        : [rootMidi, intMidi];
      measures += JazzExerciseGenerator.generateMeasure(
        notes, i + 1, interval.abbrev, key
      );
    });

    return JazzExerciseGenerator.wrapDocument(measures,
      `P0.7 Perfect Intervals from ${key}`);
  }

  // --------------------------------------------------------------------------
  // P0.8  Major Intervals Group
  // --------------------------------------------------------------------------

  /**
   * Shows M2, M3, M6, M7 from one root as harmonic intervals (stacked).
   * 4 measures.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateMajorIntervals(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const rootMidi = 60 + t;
    const majors = ['major2nd', 'major3rd', 'major6th', 'major7th'];

    let measures = '';
    majors.forEach((intKey, i) => {
      const interval = JazzExerciseGenerator.INTERVAL_MAP[intKey];
      const intMidi  = rootMidi + interval.semitones;
      measures += JazzExerciseGenerator.generateMeasure(
        [rootMidi, intMidi], i + 1, interval.abbrev, key
      );
    });

    return JazzExerciseGenerator.wrapDocument(measures,
      `P0.8 Major Intervals from ${key}`);
  }

  // --------------------------------------------------------------------------
  // P0.9  Minor Intervals Group
  // --------------------------------------------------------------------------

  /**
   * Shows m2, m3, m6, m7 from one root as harmonic intervals (stacked).
   * 4 measures.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateMinorIntervals(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const rootMidi = 60 + t;
    const minors = ['minor2nd', 'minor3rd', 'minor6th', 'minor7th'];

    let measures = '';
    minors.forEach((intKey, i) => {
      const interval = JazzExerciseGenerator.INTERVAL_MAP[intKey];
      const intMidi  = rootMidi + interval.semitones;
      measures += JazzExerciseGenerator.generateMeasure(
        [rootMidi, intMidi], i + 1, interval.abbrev, key
      );
    });

    return JazzExerciseGenerator.wrapDocument(measures,
      `P0.9 Minor Intervals from ${key}`);
  }

  // --------------------------------------------------------------------------
  // P0.10  The Tritone (Special Focus)
  // --------------------------------------------------------------------------

  /**
   * The tritone gets its own exercise — it is the engine of jazz harmony.
   * 12 measures showing the tritone from each of the 12 roots in circle-of-4ths
   * order.  Each measure: root (quarter) + tritone (quarter) + root+tritone
   * stacked (half note).
   * @param {string} key - starting key (used for document title; all 12 keys
   *                       are always covered)
   * @returns {string} MusicXML document
   */
  static generateTritoneExercise(key) {
    let measures = '';

    JazzExerciseGenerator.KEY_NAMES_CYCLE5.forEach((k, i) => {
      const rootMidi = 60 + JazzExerciseGenerator.transpositionFromC(k);
      const ttMidi   = rootMidi + 6; // tritone = 6 semitones

      let xml = `    <measure number="${i + 1}">\n`;
      if (i === 0) {
        xml += '      <attributes>\n';
        xml += '        <divisions>4</divisions>\n';
        xml += '        <time>\n          <beats>4</beats>\n          <beat-type>4</beat-type>\n        </time>\n';
        xml += '        <clef>\n          <sign>G</sign>\n          <line>2</line>\n        </clef>\n';
        xml += '      </attributes>\n';
      }
      xml += `      <direction placement="above">\n        <direction-type>\n          <words default-y="40" font-size="12" font-weight="bold">${k} TT</words>\n        </direction-type>\n      </direction>\n`;
      // Beat 1: root (quarter)
      xml += JazzExerciseGenerator.generateSingleNote(rootMidi, 4, 'quarter', k);
      // Beat 2: tritone (quarter)
      xml += JazzExerciseGenerator.generateSingleNote(ttMidi, 4, 'quarter', k);
      // Beats 3-4: root + tritone stacked (half note)
      xml += JazzExerciseGenerator.generateChord([rootMidi, ttMidi], 8, 'half', k);
      xml += `    </measure>\n`;
      measures += xml;
    });

    return JazzExerciseGenerator.wrapDocument(measures,
      `P0.10 The Tritone — The Engine of Jazz Harmony`);
  }

  // --------------------------------------------------------------------------
  // P0.11  Interval Flashcard
  // --------------------------------------------------------------------------

  /**
   * Shows ONLY the root note (whole note, 1 measure).  The answer (interval
   * note) is NOT shown — the user must play it, then check by calling
   * generateInterval().  This is the "randomizer" drill.
   * @param {string} key
   * @param {string} intervalName - key into INTERVAL_MAP
   * @returns {string} MusicXML document
   */
  static generateIntervalFlashcard(key, intervalName) {
    const interval = JazzExerciseGenerator.INTERVAL_MAP[intervalName];
    if (!interval) throw new Error(`Unknown interval: ${intervalName}`);
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const rootMidi = 60 + t;

    const measures = JazzExerciseGenerator.generateMelodyMeasure(
      [rootMidi], [16], 1, `Play the ${interval.abbrev}!`, key
    );

    return JazzExerciseGenerator.wrapDocument(measures,
      `P0.11 Flashcard: ${interval.name} from ${key} — Play the Interval!`);
  }

  // --------------------------------------------------------------------------
  // P0.12  The 12×12 Matrix Row
  // --------------------------------------------------------------------------

  /**
   * All 12 intervals from one root, played melodically as running eighth notes.
   * Root + 12 intervals + octave = 14 notes across 4 measures of 4/4
   * (each measure holds 8 eighth notes = 16 divisions worth of duration).
   * The last measure is padded with a quarter rest if needed.
   *
   * Layout (divisions=4, eighth = duration 2):
   *   Measure 1 (8 eighths): root, m2, M2, m3, M3, P4, TT, P5
   *   Measure 2 (8 eighths): m6, M6, m7, M7, P8, root(8va), root(8va), rest(q)
   *
   * Actually 14 unique pitches fit nicely into ~2 measures of running 8ths
   * with a half-rest pad at the end.
   *
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateMatrixRow(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const rootMidi = 60 + t;

    // Build all 14 MIDI pitches: root + 12 intervals + octave root again
    const allSemitones = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const allMidi = allSemitones.map(s => rootMidi + s);
    // Add the root an octave up one more time as a landing note
    allMidi.push(rootMidi + 12);
    // 14 notes total

    // Distribute into measures of 8 eighth notes each
    // Measure 1: notes 0-7 (root through P5)
    // Measure 2: notes 8-13 (m6 through octave-root) + quarter rest pad
    const m1Notes = allMidi.slice(0, 8);
    const m1Durs  = [2, 2, 2, 2, 2, 2, 2, 2]; // 8 eighths = 16 divs = full bar

    const m2Notes = allMidi.slice(8, 14);
    const m2Durs  = [2, 2, 2, 2, 2, 2]; // 6 eighths = 12 divs, need 4 more

    let measures = '';

    // Measure 1
    measures += JazzExerciseGenerator.generateMelodyMeasure(
      m1Notes, m1Durs, 1,
      `${key}: P1 → P5`,
      key
    );

    // Measure 2 — custom build to add rest padding
    let xml = `    <measure number="2">\n`;
    xml += `      <direction placement="above">\n        <direction-type>\n          <words default-y="40" font-size="12" font-weight="bold">${key}: m6 → P8</words>\n        </direction-type>\n      </direction>\n`;
    for (let i = 0; i < m2Notes.length; i++) {
      xml += JazzExerciseGenerator.generateSingleNote(m2Notes[i], 2, 'eighth', key);
    }
    // Pad with a quarter rest (duration 4)
    xml += JazzExerciseGenerator.generateRest(4, 'quarter');
    xml += `    </measure>\n`;
    measures += xml;

    return JazzExerciseGenerator.wrapDocument(measures,
      `P0.12 The 12×12 Matrix Row — ${key}`);
  }


//

}
/* the paste, done by the machine rather than by hand */
Object.getOwnPropertyNames(JazzP0Mixin).forEach(k => {
  if(k === 'length' || k === 'name' || k === 'prototype') return;
  JazzExerciseGenerator[k] = JazzP0Mixin[k];
});

const STAGE_P0_CATALOG = {

  // --------------------------------------------------------------------------
  // Stage-level metadata  (attach to a wrapping stage object or read as docs)
  // --------------------------------------------------------------------------
  _stageInfo: {
    name: 'Preliminary Stage P0: Intervals & the 12×12 Matrix',
    difficulty: 'foundational',
    description: 'Before chords, before scales, before voicings — there are intervals. This stage builds complete command of the 12 distances between any two notes, in every key, by ear and by hand.',

    theoryNotes: `## Preliminary Stage P0 — Intervals & the 12×12 Matrix

### The Foundation of Everything

In Western music, there are only **12 unique notes**. From any one of those 12 notes, you can move to any of the other 12 (including staying on the same note — a unison — or jumping up exactly 12 semitones to the octave). That gives us **12 distinct interval distances** (minor 2nd through octave), plus the trivial unison. These intervals are the atoms of all harmony and melody.

Every chord, every scale, every voicing, every melodic line is built from intervals. A major chord is not some abstract object — it is a **root + Major 3rd + Perfect 5th**. A dominant 7th chord is **root + M3 + P5 + m7**. If you cannot hear and play every interval instantly from any starting note, you are building jazz on sand.

---

### The Vocabulary of Distance

Each interval has a unique **emotional flavor**:

| Interval | Semitones | Character |
|----------|-----------|-----------|
| **Minor 2nd (m2)** | 1 | Tension, dissonance, "Jaws" menace |
| **Major 2nd (M2)** | 2 | Bright step, "Happy Birthday" opening |
| **Minor 3rd (m3)** | 3 | Sad, yearning — the minor-chord sound |
| **Major 3rd (M3)** | 4 | Warm, happy — the major-chord sound |
| **Perfect 4th (P4)** | 5 | Open, questioning — "Here Comes the Bride" |
| **Tritone (TT)** | 6 | Unstable, mysterious — the engine of jazz harmony |
| **Perfect 5th (P5)** | 7 | Stable, powerful — "Star Wars" fanfare |
| **Minor 6th (m6)** | 8 | Bittersweet, reaching |
| **Major 6th (M6)** | 9 | Warm nostalgia — "My Bonnie Lies Over the Ocean" |
| **Minor 7th (m7)** | 10 | Bluesy pull, dominant anticipation |
| **Major 7th (M7)** | 11 | Dreamy tension, almost-octave shimmer |
| **Perfect Octave (P8)** | 12 | Resolution, completeness — "Somewhere Over the Rainbow" |

---

### The 12×12 Matrix

There are 12 starting notes × 12 intervals = **144 combinations**. That is the complete atlas of pitch relationships in Western music. You must own all 144.

Think of it as a grid:

\`\`\`
         m2  M2  m3  M3  P4  TT  P5  m6  M6  m7  M7  P8
  C  →   Db  D   Eb  E   F   F#  G   Ab  A   Bb  B   C
  Db →   D   Eb  E   F   Gb  G   Ab  A   Bb  B   C   Db
  D  →   Eb  E   F   F#  G   Ab  A   Bb  B   C   C#  D
  ...
  B  →   C   C#  D   D#  E   F   F#  G   G#  A   A#  B
\`\`\`

When you can play any cell in this matrix *instantly*, you have the foundation for everything that follows.

---

### Why Jazz Demands Instant Recall

Jazz does not sit still. A song will constantly shift starting points. Therefore, a musician must know what a Major 3rd is not just from C, but from F#, from Eb, from A — from *every* root.

**Chord formulas are interval recipes:**
- Maj7 = R + M3 + P5 + M7
- min7 = R + m3 + P5 + m7
- Dom7 = R + M3 + P5 + m7
- dim7 = R + m3 + TT + M6(= dim7th)
- min7b5 = R + m3 + TT + m7

**Improvisation is real-time interval selection.** When a soloist hears an Eb7 chord and instantly plays a G (Major 3rd above Eb), that is interval mastery in action. There is no time to count semitones on a bandstand.

**Voice leading is interval management.** The smoothest chord progressions move each voice by the smallest possible interval. Hearing a half step vs. a whole step vs. staying on the same note — that is interval awareness applied to harmonic motion.

---

### Learning Strategies

**1. Chunking by Family**
- *Perfect intervals* (P1, P4, P5, P8): stable, open, consonant
- *Major intervals* (M2, M3, M6, M7): bright, wide
- *Minor intervals* (m2, m3, m6, m7): dark, narrow
- *The Tritone* (TT): unstable, unique — stands alone

**2. Emotional / Song Anchors**
Every interval has a famous melody that begins with that leap:
- m2: "Jaws" theme
- M2: "Happy Birthday" (first two notes)
- m3: "Hey Jude" or "Greensleeves"
- M3: "When the Saints Go Marching In"
- P4: "Here Comes the Bride" or "Amazing Grace"
- TT: "The Simpsons" theme or "Maria" (West Side Story)
- P5: "Star Wars" opening or "Twinkle Twinkle Little Star"
- m6: "The Entertainer" (Scott Joplin)
- M6: "My Bonnie Lies Over the Ocean"
- m7: "Somewhere" from West Side Story (there → over)
- M7: "Take On Me" chorus (first note to second)
- P8: "Somewhere Over the Rainbow" (first two notes: "Some-where")

**3. Instrument Shapes**
On piano, every interval has a fixed physical distance on the keyboard. A Perfect 5th is always 7 keys apart. A Major 3rd is always 4 keys apart. Your hands learn the shapes.

For vocalists, intervals become physical *feelings* in the voice — the stretch of a 5th, the small slide of a 2nd, the dramatic leap of an octave.

**4. Micro-Practice (2 Minutes, Deep Focus)**
Pick ONE interval. Set a timer for 2 minutes. Play it from every root in circle-of-4ths order. That is 12 repetitions in under 2 minutes. Do this daily and you will own all 144 combinations within weeks.

---

### The Three Core Drills

**Drill 1: Singing-and-Playing Match (P0.1 – P0.4)**
Play an interval on the piano. Sing it back. Then sing it first and check on the piano. This builds the ear-to-voice-to-instrument connection that is the foundation of jazz musicianship.

**Drill 2: Circle of 4ths Sprints (P0.5 – P0.6)**
Pick one interval. Play it from C, then F, then Bb, then Eb — all the way around the circle of 4ths. This is how jazz musicians naturally move through keys (because ii-V-I progressions move in 4ths). Speed it up until it is automatic.

**Drill 3: Randomizer Flashcard (P0.11)**
Because jazz requires you to pull any interval out of thin air instantly, predictability is the enemy of progress. The flashcard shows you a root and an interval name — you must play the answer before checking. Randomize the key AND the interval for maximum challenge.`,

    wernerQuote: 'Many musicians are so fixated on complex elements that they fail to spend enough time on the basics. Fear of not becoming great has kept you from becoming great.'
  },

  // --------------------------------------------------------------------------
  // Individual exercise entries (merge into JAZZ_EXERCISE_CATALOG)
  // --------------------------------------------------------------------------

  'P0.1': {
    stage: 'P0',
    substage: 'P0.1',
    name: 'Single Interval Display',
    generator: 'generateInterval',
    generatorType: 'interval',
    generatorArgs: ['key', 'intervalName'],
    flashcardPrompt: 'Play the specified interval from the given root.',
    whyItMatters: 'Hearing and seeing a single interval in isolation is the first step toward owning the 12×12 matrix. Every chord and scale you will ever play is built from these atoms.',
    memorizationTips: 'Sing the interval using its song anchor before you play it. Minor 2nd = "Jaws." Major 3rd = "When the Saints." Perfect 5th = "Star Wars." Connect the sound to something you already know.',
    source: 'Jazz Practice Studio — Stage P0: Intervals & the 12×12 Matrix'
  },

  'P0.2': {
    stage: 'P0',
    substage: 'P0.2',
    name: 'Single Interval Ascending + Descending',
    generator: 'generateIntervalAscDesc',
    generatorType: 'interval',
    generatorArgs: ['key', 'intervalName'],
    flashcardPrompt: 'Play the specified interval ascending, then descending, from the given root.',
    whyItMatters: 'An interval sounds different going up versus coming down. Training both directions develops complete interval recognition — essential for hearing melodic lines that rise and fall.',
    memorizationTips: 'Ascending: use the song anchor. Descending: many intervals sound like different songs going down. A descending minor 3rd is the "nah-nah" playground taunt. A descending Perfect 5th is "Flintstones" ("Flint-stones").',
    source: 'Jazz Practice Studio — Stage P0: Intervals & the 12×12 Matrix'
  },

  'P0.3': {
    stage: 'P0',
    substage: 'P0.3',
    name: 'All 12 Intervals from One Root (Chromatic Staircase)',
    generator: 'generateAllIntervalsFromRoot',
    generatorType: 'interval',
    generatorArgs: ['key'],
    flashcardPrompt: 'Play all 12 intervals as harmonic (stacked) intervals from the given root, ascending chromatically.',
    whyItMatters: 'This is the "ruler of pitch" — hearing the entire spectrum of distance from one starting note. It calibrates your ear to the full range of consonance and dissonance.',
    memorizationTips: 'Notice the arc: tight dissonance (m2, M2) → warmth (3rds) → open stability (P4, P5) → reaching tension (6ths, 7ths) → resolution (octave). Feel the emotional journey.',
    source: 'Jazz Practice Studio — Stage P0: Intervals & the 12×12 Matrix'
  },

  'P0.4': {
    stage: 'P0',
    substage: 'P0.4',
    name: 'All 12 Intervals Melodic (Ascending)',
    generator: 'generateAllIntervalsMelodic',
    generatorType: 'interval',
    generatorArgs: ['key'],
    flashcardPrompt: 'Play all 12 intervals melodically (root then interval note) from the given root.',
    whyItMatters: 'Harmonic intervals (stacked) and melodic intervals (sequential) activate different parts of your ear. Melodic training is critical for improvisation, where you play one note at a time.',
    memorizationTips: 'Sing each interval before you play it. The voice-to-instrument connection is the fastest path to internalization.',
    source: 'Jazz Practice Studio — Stage P0: Intervals & the 12×12 Matrix'
  },

  'P0.5': {
    stage: 'P0',
    substage: 'P0.5',
    name: 'Interval Sprint — Circle of 4ths',
    generator: 'generateIntervalSprint_CircleOf4ths',
    generatorType: 'interval',
    generatorArgs: ['intervalName'],
    flashcardPrompt: 'Play the specified interval from every root through the circle of 4ths: C→F→Bb→Eb→Ab→Db→Gb→B→E→A→D→G.',
    whyItMatters: 'Jazz does not sit still. A song will constantly shift starting points. Therefore, a musician must know what a Major 3rd is not just from C, but from F#, from Eb, from A. The circle of 4ths is the natural key order of jazz — every ii-V-I moves this way.',
    memorizationTips: 'Start slow: 2 minutes, one interval, all 12 keys. Speed up over days. The physical hand-shape stays the same for every key — only the starting position moves. Your body learns this faster than your mind.',
    source: 'Jazz Practice Studio — Stage P0: Intervals & the 12×12 Matrix'
  },

  'P0.6': {
    stage: 'P0',
    substage: 'P0.6',
    name: 'Interval Sprint — Chromatic',
    generator: 'generateIntervalSprint_Chromatic',
    generatorType: 'interval',
    generatorArgs: ['intervalName'],
    flashcardPrompt: 'Play the specified interval from every root chromatically: C→Db→D→Eb→E→F→F#→G→Ab→A→Bb→B.',
    whyItMatters: 'Chromatic order covers different physical patterns than the circle of 4ths. Some intervals are harder from certain roots — chromatic drilling exposes and fixes those weak spots.',
    memorizationTips: 'Chromatic = "walk up the piano one key at a time." Notice which roots feel awkward and spend extra time there.',
    source: 'Jazz Practice Studio — Stage P0: Intervals & the 12×12 Matrix'
  },

  'P0.7': {
    stage: 'P0',
    substage: 'P0.7',
    name: 'Perfect Intervals Group',
    generator: 'generatePerfectIntervals',
    generatorType: 'interval',
    generatorArgs: ['key'],
    flashcardPrompt: 'Play all four Perfect intervals (P1, P4, P5, P8) as harmonic intervals from the given root.',
    whyItMatters: 'The Perfect intervals are the skeleton of tonality. The 5th defines power chords. The 4th defines sus chords. The octave defines register. These are the stable, open sounds that everything else leans against.',
    memorizationTips: 'Perfect intervals are called "perfect" because they sound the same whether you invert them (P4 inverted = P5). They are the most consonant intervals after the unison and octave. Sing: P1 (unison hum), P4 ("Here Comes the Bride"), P5 ("Star Wars"), P8 ("Somewhere Over the Rainbow").',
    source: 'Jazz Practice Studio — Stage P0: Intervals & the 12×12 Matrix'
  },

  'P0.8': {
    stage: 'P0',
    substage: 'P0.8',
    name: 'Major Intervals Group',
    generator: 'generateMajorIntervals',
    generatorType: 'interval',
    generatorArgs: ['key'],
    flashcardPrompt: 'Play all four Major intervals (M2, M3, M6, M7) as harmonic intervals from the given root.',
    whyItMatters: 'The Major intervals define the "bright side" of harmony. M3 is the soul of every major chord. M7 is the shimmer of every Maj7 chord. M6 is the warmth of the 6/9 voicing. M2 is the foundation of every scale step.',
    memorizationTips: 'Major = bright, wide, happy. Sing: M2 ("Happy Birthday"), M3 ("When the Saints"), M6 ("My Bonnie"), M7 ("Take On Me" chorus). Notice each one is exactly one semitone wider than its minor counterpart.',
    source: 'Jazz Practice Studio — Stage P0: Intervals & the 12×12 Matrix'
  },

  'P0.9': {
    stage: 'P0',
    substage: 'P0.9',
    name: 'Minor Intervals Group',
    generator: 'generateMinorIntervals',
    generatorType: 'interval',
    generatorArgs: ['key'],
    flashcardPrompt: 'Play all four Minor intervals (m2, m3, m6, m7) as harmonic intervals from the given root.',
    whyItMatters: 'The Minor intervals define the "dark side" of harmony. m3 is the soul of every minor chord. m7 is the gravity of every dominant chord. m2 is maximum dissonance (the "rub"). m6 is the bittersweet reach.',
    memorizationTips: 'Minor = dark, narrow, yearning. Sing: m2 ("Jaws"), m3 ("Hey Jude" or "Greensleeves"), m6 ("The Entertainer"), m7 ("Somewhere" — West Side Story, "there" to "over"). Each is one semitone narrower than its Major counterpart.',
    source: 'Jazz Practice Studio — Stage P0: Intervals & the 12×12 Matrix'
  },

  'P0.10': {
    stage: 'P0',
    substage: 'P0.10',
    name: 'The Tritone — The Engine of Jazz Harmony',
    generator: 'generateTritoneExercise',
    generatorType: 'interval',
    generatorArgs: ['key'],
    flashcardPrompt: 'Play the tritone from every root through the circle of 4ths. Each measure: root (quarter), tritone (quarter), then both stacked (half note).',
    whyItMatters: 'The tritone is the engine of jazz harmony — it is the unstable distance that creates the "pull" in every dominant chord wanting to resolve. Every V7→I resolution is powered by the tritone between the 3rd and b7th of the dominant chord collapsing inward (or outward) to the root and 3rd of the tonic. Master the tritone and you understand why jazz harmony *moves*.',
    memorizationTips: 'The tritone divides the octave exactly in half — 6 semitones up, 6 semitones down. It is the only interval that is its own inversion. Song anchor: "The Simpsons" theme or "Maria" from West Side Story. On piano, the tritone from any white key always lands on a black key (and vice versa) — except B→F and F→B.',
    source: 'Jazz Practice Studio — Stage P0: Intervals & the 12×12 Matrix'
  },

  'P0.11': {
    stage: 'P0',
    substage: 'P0.11',
    name: 'Interval Flashcard (Randomizer)',
    generator: 'generateIntervalFlashcard',
    generatorType: 'interval_flashcard',
    generatorArgs: ['key', 'intervalName'],
    flashcardPrompt: 'You see only the root note. Play the specified interval WITHOUT looking at the answer. Then use P0.1 to check.',
    whyItMatters: 'Because jazz requires you to pull any interval out of thin air instantly, predictability is the enemy of progress. The flashcard forces recall, not recognition. Randomize both the key AND the interval for maximum challenge. This is the drill that turns knowledge into reflex.',
    memorizationTips: 'Use this drill daily. Randomize the key and interval. If you get one wrong, do NOT move on — repeat it 3 times correctly before continuing. The spaced-repetition effect of flashcard drilling is the fastest known method for building instant recall.',
    source: 'Jazz Practice Studio — Stage P0: Intervals & the 12×12 Matrix'
  },

  'P0.12': {
    stage: 'P0',
    substage: 'P0.12',
    name: 'The 12×12 Matrix Row',
    generator: 'generateMatrixRow',
    generatorType: 'interval',
    generatorArgs: ['key'],
    flashcardPrompt: 'Play the complete matrix row: all 12 intervals from the given root as running eighth notes, ascending chromatically from m2 to octave.',
    whyItMatters: 'This is one full row of the 12×12 matrix. Play it from all 12 roots and you have covered every cell — all 144 interval/key combinations. This is the ultimate interval fluency test.',
    memorizationTips: 'Start slow — this is a chromatic scale disguised as an interval exercise. Let your ear label each note as it passes: "that is the minor 3rd… that is the Perfect 4th…" Speed comes after labeling becomes automatic. Practice one row per day, cycling through all 12 keys over two weeks.',
    source: 'Jazz Practice Studio — Stage P0: Intervals & the 12×12 Matrix'
  }

};


// ============================================================================
// INTEGRATION HELPER
// ============================================================================
//
// To merge STAGE_P0_CATALOG into the existing JAZZ_EXERCISE_CATALOG, add this
// after both objects are defined:
//
//   Object.assign(JazzExerciseGenerator.JAZZ_EXERCISE_CATALOG, STAGE_P0_CATALOG);
//
// Or manually copy each 'P0.x' key into the catalog object.
//
// For the stage-level metadata (_stageInfo), you can store it as:
//
//   JazzExerciseGenerator.STAGE_P0_INFO = STAGE_P0_CATALOG._stageInfo;
//
// ============================================================================
