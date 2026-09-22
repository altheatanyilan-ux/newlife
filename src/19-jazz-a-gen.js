/* ============================================================
   THE JAZZ ENGRAVER'S LIBRARY — brought in whole, not rewritten.

   This file and the two beside it are the curriculum itself: the generator
   that writes a MusicXML document for an exercise in any key, and the
   catalogue of what the exercises are, with the page of Siskind each one
   comes from. They arrived written, and they are kept as they arrived apart
   from the changes noted below, because a curriculum retyped is a curriculum
   with new mistakes in it, and because the next correction to it should be a
   drop-in rather than a translation.

   What was changed, and only this:
     — the module.exports tail, which this house has no use for;
     — nothing else.

   It is concatenated before the catalogues that add methods to it, which is
   why the file names run a, b, c: a class read after the code that writes
   into it is a class that does not exist yet.
   ============================================================ */

/**
 * ============================================================================
 * JAZZ PRACTICE STUDIO — MusicXML Exercise Generator
 * ============================================================================
 *
 * A comprehensive, single-file library that generates MusicXML 4.0 partwise
 * documents for every stage of the Jazz Practice Studio curriculum.
 *
 * Every public generator function accepts `key` (string, e.g. "C", "Db", "F#")
 * as its first parameter so exercises can be transposed to any of 12 keys.
 *
 * Sources:
 *   - Frank Mantooth, "Voicings for Jazz Keyboard"
 *   - Berklee, "The Berklee Book of Jazz Harmony" (Mulholland & Hojnacki)
 *   - Mark Levine, "The Jazz Theory Book"
 *   - Bob Stoloff, "Scat! Vocal Improvisation Techniques"
 *   - Michele Weir, "Fearless Vocal Improvisation"
 *
 * @file JazzExerciseGenerator.js
 */

// ============================================================================
// PART 1: SHARED INFRASTRUCTURE
// ============================================================================

class JazzExerciseGenerator {

  // --------------------------------------------------------------------------
  // 1-A  PITCH MAPS
  // --------------------------------------------------------------------------

  /**
   * Maps pitch class 0-11 to MusicXML <step> and <alter>.
   * Uses flats for black keys by default (jazz convention).
   * @type {Object.<number, {step: string, alter: number}>}
   */
  static PITCH_MAP = {
    0:  { step: 'C', alter: 0 },
    1:  { step: 'D', alter: -1 },
    2:  { step: 'D', alter: 0 },
    3:  { step: 'E', alter: -1 },
    4:  { step: 'E', alter: 0 },
    5:  { step: 'F', alter: 0 },
    6:  { step: 'F', alter: 1 },
    7:  { step: 'G', alter: 0 },
    8:  { step: 'A', alter: -1 },
    9:  { step: 'A', alter: 0 },
    10: { step: 'B', alter: -1 },
    11: { step: 'B', alter: 0 }
  };

  /**
   * Sharp-preference pitch map (used when key signature favors sharps).
   * @type {Object.<number, {step: string, alter: number}>}
   */
  static PITCH_MAP_SHARPS = {
    0:  { step: 'C', alter: 0 },
    1:  { step: 'C', alter: 1 },
    2:  { step: 'D', alter: 0 },
    3:  { step: 'D', alter: 1 },
    4:  { step: 'E', alter: 0 },
    5:  { step: 'F', alter: 0 },
    6:  { step: 'F', alter: 1 },
    7:  { step: 'G', alter: 0 },
    8:  { step: 'G', alter: 1 },
    9:  { step: 'A', alter: 0 },
    10: { step: 'A', alter: 1 },
    11: { step: 'B', alter: 0 }
  };

  /**
   * Maps key name strings to pitch class integers.
   * Supports enharmonic equivalents.
   * @type {Object.<string, number>}
   */
  static KEY_TO_PC = {
    'C': 0, 'B#': 0,
    'Db': 1, 'C#': 1,
    'D': 2,
    'Eb': 3, 'D#': 3,
    'E': 4, 'Fb': 4,
    'F': 5, 'E#': 5,
    'F#': 6, 'Gb': 6,
    'G': 7,
    'Ab': 8, 'G#': 8,
    'A': 9,
    'Bb': 10, 'A#': 10,
    'B': 11, 'Cb': 11
  };

  /**
   * Keys that conventionally use sharps in their spelling.
   * @type {Set<string>}
   */
  static SHARP_KEYS = new Set(['G', 'D', 'A', 'E', 'B', 'F#', 'C#']);

  // --------------------------------------------------------------------------
  // 1-B  CORE UTILITIES
  // --------------------------------------------------------------------------

  /**
   * Returns the pitch class (0-11) for a given key name string.
   * @param {string} key - e.g. "C", "Db", "F#"
   * @returns {number} pitch class 0-11
   */
  static keyPC(key) {
    const pc = JazzExerciseGenerator.KEY_TO_PC[key];
    if (pc === undefined) throw new Error(`Unknown key: ${key}`);
    return pc;
  }

  /**
   * Selects the appropriate pitch map (flat vs sharp) for the given key.
   * @param {string} key
   * @returns {Object}
   */
  static pitchMapForKey(key) {
    return JazzExerciseGenerator.SHARP_KEYS.has(key)
      ? JazzExerciseGenerator.PITCH_MAP_SHARPS
      : JazzExerciseGenerator.PITCH_MAP;
  }

  /**
   * Converts a MIDI note number to a MusicXML <pitch> element string.
   * @param {number} midi - MIDI note number (e.g. 60 = middle C)
   * @param {string} [key='C'] - key context for enharmonic spelling
   * @returns {string} MusicXML <pitch>...</pitch>
   */
  static midiToXmlPitch(midi, key = 'C') {
    const pc = ((midi % 12) + 12) % 12;
    const octave = Math.floor(midi / 12) - 1;
    const map = JazzExerciseGenerator.pitchMapForKey(key);
    const { step, alter } = map[pc];
    let xml = `        <pitch>\n          <step>${step}</step>\n`;
    if (alter !== 0) {
      xml += `          <alter>${alter}</alter>\n`;
    }
    xml += `          <octave>${octave}</octave>\n        </pitch>`;
    return xml;
  }

  /**
   * Converts a note name + octave to a MIDI number.
   * @param {string} noteName - e.g. "C", "Db", "F#"
   * @param {number} octave - octave (4 = middle-C octave)
   * @returns {number} MIDI note number
   */
  static noteNameToMidi(noteName, octave) {
    const pc = JazzExerciseGenerator.KEY_TO_PC[noteName];
    if (pc === undefined) throw new Error(`Unknown note: ${noteName}`);
    return (octave + 1) * 12 + pc;
  }

  // --------------------------------------------------------------------------
  // 1-C  XML FRAGMENT GENERATORS
  // --------------------------------------------------------------------------

  /**
   * Generates a stacked chord (multiple notes sounding simultaneously).
   * @param {number[]} midiNotes - MIDI numbers, lowest to highest
   * @param {number} duration - MusicXML duration value (e.g. 4 = quarter)
   * @param {string} type - MusicXML note type ("whole","half","quarter","eighth")
   * @param {string} [key='C']
   * @returns {string} MusicXML <note> elements for the chord
   */
  static generateChord(midiNotes, duration = 4, type = 'quarter', key = 'C') {
    if (!midiNotes || midiNotes.length === 0) return '';
    let xml = '';
    for (let i = 0; i < midiNotes.length; i++) {
      xml += '      <note>\n';
      if (i > 0) xml += '        <chord/>\n';
      xml += JazzExerciseGenerator.midiToXmlPitch(midiNotes[i], key) + '\n';
      xml += `        <duration>${duration}</duration>\n`;
      xml += `        <type>${type}</type>\n`;
      xml += '      </note>\n';
    }
    return xml;
  }

  /**
   * Generates a single note.
   * @param {number} midi
   * @param {number} duration
   * @param {string} type
   * @param {string} [key='C']
   * @returns {string}
   */
  static generateSingleNote(midi, duration = 4, type = 'quarter', key = 'C') {
    let xml = '      <note>\n';
    xml += JazzExerciseGenerator.midiToXmlPitch(midi, key) + '\n';
    xml += `        <duration>${duration}</duration>\n`;
    xml += `        <type>${type}</type>\n`;
    xml += '      </note>\n';
    return xml;
  }

  /**
   * Generates a rest.
   * @param {number} duration
   * @param {string} type
   * @returns {string}
   */
  static generateRest(duration = 4, type = 'quarter') {
    return `      <note>\n        <rest/>\n        <duration>${duration}</duration>\n        <type>${type}</type>\n      </note>\n`;
  }

  /**
   * Generates a complete measure containing a single chord with optional
   * chord symbol annotation.
   * @param {number[]} midiNotes - stacked chord pitches
   * @param {number} measureNum
   * @param {string} [chordSymbol=''] - e.g. "CMaj7"
   * @param {string} [key='C']
   * @returns {string}
   */
  static generateMeasure(midiNotes, measureNum, chordSymbol = '', key = 'C') {
    let xml = `    <measure number="${measureNum}">\n`;
    if (measureNum === 1) {
      xml += '      <attributes>\n';
      xml += '        <divisions>4</divisions>\n';
      xml += '        <time>\n          <beats>4</beats>\n          <beat-type>4</beat-type>\n        </time>\n';
      xml += '        <clef>\n          <sign>G</sign>\n          <line>2</line>\n        </clef>\n';
      xml += '      </attributes>\n';
    }
    if (chordSymbol) {
      xml += `      <direction placement="above">\n        <direction-type>\n          <words default-y="40" font-size="12" font-weight="bold">${chordSymbol}</words>\n        </direction-type>\n      </direction>\n`;
    }
    xml += JazzExerciseGenerator.generateChord(midiNotes, 16, 'whole', key);
    xml += `    </measure>\n`;
    return xml;
  }

  /**
   * Generates a melody measure with individual notes and durations.
   * @param {number[]} midiNotes - sequential pitches
   * @param {number[]} durations - MusicXML durations matching each note
   * @param {number} measureNum
   * @param {string} [chordSymbol='']
   * @param {string} [key='C']
   * @returns {string}
   */
  static generateMelodyMeasure(midiNotes, durations, measureNum, chordSymbol = '', key = 'C') {
    const typeMap = { 1: 'sixteenth', 2: 'eighth', 4: 'quarter', 8: 'half', 16: 'whole' };
    let xml = `    <measure number="${measureNum}">\n`;
    if (measureNum === 1) {
      xml += '      <attributes>\n';
      xml += '        <divisions>4</divisions>\n';
      xml += '        <time>\n          <beats>4</beats>\n          <beat-type>4</beat-type>\n        </time>\n';
      xml += '        <clef>\n          <sign>G</sign>\n          <line>2</line>\n        </clef>\n';
      xml += '      </attributes>\n';
    }
    if (chordSymbol) {
      xml += `      <direction placement="above">\n        <direction-type>\n          <words default-y="40" font-size="12" font-weight="bold">${chordSymbol}</words>\n        </direction-type>\n      </direction>\n`;
    }
    for (let i = 0; i < midiNotes.length; i++) {
      const dur = durations[i] || 4;
      const tp = typeMap[dur] || 'quarter';
      xml += JazzExerciseGenerator.generateSingleNote(midiNotes[i], dur, tp, key);
    }
    xml += `    </measure>\n`;
    return xml;
  }

  /**
   * Wraps measure XML into a complete MusicXML 4.0 partwise document.
   * @param {string} measuresXml - concatenated <measure> elements
   * @param {string} title - document / work title
   * @returns {string} complete MusicXML document
   */
  static wrapDocument(measuresXml, title = 'Jazz Exercise') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN"
  "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work>
    <work-title>${title}</work-title>
  </work>
  <identification>
    <creator type="composer">Jazz Practice Studio</creator>
    <encoding>
      <software>JazzExerciseGenerator</software>
      <encoding-date>${new Date().toISOString().slice(0, 10)}</encoding-date>
    </encoding>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>
  <part id="P1">
${measuresXml}  </part>
</score-partwise>`;
  }

  // --------------------------------------------------------------------------
  // 1-D  TRANSPOSITION HELPERS
  // --------------------------------------------------------------------------

  /**
   * Transposes a set of MIDI notes by interval.
   * @param {number[]} notes
   * @param {number} semitones
   * @returns {number[]}
   */
  static transpose(notes, semitones) {
    return notes.map(n => n + semitones);
  }

  /**
   * Returns the transposition interval from C to the given key.
   * @param {string} key
   * @returns {number}
   */
  static transpositionFromC(key) {
    return JazzExerciseGenerator.keyPC(key);
  }

  /**
   * Builds a major triad from a root MIDI note.
   * @param {number} root
   * @returns {number[]}
   */
  static majorTriad(root) {
    return [root, root + 4, root + 7];
  }

  /**
   * Builds a minor triad from a root MIDI note.
   * @param {number} root
   * @returns {number[]}
   */
  static minorTriad(root) {
    return [root, root + 3, root + 7];
  }

  /**
   * Key-name array for display (cycle of 5ths order).
   * @type {string[]}
   */
  static KEY_NAMES_CYCLE5 = [
    'C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'B', 'E', 'A', 'D', 'G'
  ];

  /**
   * Key-name array in chromatic order.
   * @type {string[]}
   */
  static KEY_NAMES_CHROMATIC = [
    'C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'
  ];

  /**
   * Returns a human-readable key name from a pitch class.
   * @param {number} pc - pitch class 0-11
   * @returns {string}
   */
  static pcToKeyName(pc) {
    return JazzExerciseGenerator.KEY_NAMES_CHROMATIC[((pc % 12) + 12) % 12];
  }

  // ============================================================================
  // PART 2: STAGE 13 -- ADVANCED VOICINGS
  // ============================================================================

  // --------------------------------------------------------------------------
  // 13.1  GENERIC VOICINGS (Mantooth Ch. 2)
  // --------------------------------------------------------------------------
  //
  // "Generic Voicings are five-note chord constructions which function for
  //  three basic chord families: major, minor, and dominant."
  //
  // Construction: start on a chord tone, descend by perfect 4ths (5 semitones).
  // "Keep the right-hand thumb in the octave between middle C and C1."

  /**
   * Generic Major voicing starting from the tonic -- produces a 6/9 sound.
   * Start on root (MIDI 60 = C4 in C), descend in P4ths (5 semitones each).
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateGenericMajorFromTonic(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const top = 60 + t;
    const notes = [top, top - 5, top - 10, top - 15, top - 20];
    notes.sort((a, b) => a - b);
    const measures = JazzExerciseGenerator.generateMeasure(notes, 1, `${key}Maj6/9`, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `Generic Major from Tonic -- ${key}`);
  }

  /**
   * Generic Major voicing starting from the 5th -- produces a Maj9 sound.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateGenericMajorFrom5th(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const top = 67 + t;
    const notes = [top, top - 5, top - 10, top - 15, top - 20];
    notes.sort((a, b) => a - b);
    const measures = JazzExerciseGenerator.generateMeasure(notes, 1, `${key}Maj9`, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `Generic Major from 5th -- ${key}`);
  }

  /**
   * Generic Minor voicing -- start on minor 3rd, descend in P4ths.
   * Produces a min11 sound.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateGenericMinor(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const top = 63 + t;
    const notes = [top, top - 5, top - 10, top - 15, top - 20];
    notes.sort((a, b) => a - b);
    const measures = JazzExerciseGenerator.generateMeasure(notes, 1, `${key}min11`, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `Generic Minor -- ${key}`);
  }

  /**
   * Generic Dominant voicing from tonic.
   * Top 3 voices: quartal from root (root, root-5, root-10).
   * Bottom 2: major 3rd and dominant 7th (tritone indicators).
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateGenericDomFromTonic(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const root = 60 + t;
    const topVoices = [root, root - 5, root - 10];
    const third = root - 20 + 4;
    const seventh = root - 20 + 10;
    const notes = [third, seventh, ...topVoices].sort((a, b) => a - b);
    const measures = JazzExerciseGenerator.generateMeasure(notes, 1, `${key}9`, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `Generic Dominant from Tonic -- ${key}`);
  }

  /**
   * Generic Dominant voicing from 5th.
   * Top 3 quartal from 5th; bottom 2: b7 and 3rd (reversed tritone).
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateGenericDomFrom5th(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const fifth = 67 + t;
    const topVoices = [fifth, fifth - 5, fifth - 10];
    const seventh = fifth - 15 + 3;
    const third = fifth - 20 + 9;
    const notes = [third, seventh, ...topVoices].sort((a, b) => a - b);
    const measures = JazzExerciseGenerator.generateMeasure(notes, 1, `${key}13`, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `Generic Dominant from 5th -- ${key}`);
  }

  /**
   * Generic voicing workout: ii-V7-I using generic voicings.
   * @param {string} key - the key of the I chord
   * @returns {string} MusicXML document
   */
  static generateGenericVoicingWorkout_iiVI(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const iiRoot = 62 + t;
    const iiM3 = iiRoot + 3;
    const iiNotes = [iiM3, iiM3 - 5, iiM3 - 10, iiM3 - 15, iiM3 - 20].sort((a, b) => a - b);

    const vRoot = 67 + t;
    const vThird = vRoot - 20 + 4;
    const vSeventh = vRoot - 20 + 10;
    const vNotes = [vThird, vSeventh, vRoot, vRoot - 5, vRoot - 10].sort((a, b) => a - b);

    const iRoot = 60 + t;
    const iNotes = [iRoot, iRoot - 5, iRoot - 10, iRoot - 15, iRoot - 20].sort((a, b) => a - b);

    const iiName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 2) % 12);
    const vName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 7) % 12);

    let measures = '';
    measures += JazzExerciseGenerator.generateMeasure(iiNotes, 1, `${iiName}min11`, key);
    measures += JazzExerciseGenerator.generateMeasure(vNotes, 2, `${vName}9`, key);
    measures += JazzExerciseGenerator.generateMeasure(iNotes, 3, `${key}Maj6/9`, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `Generic Voicing ii-V-I Workout -- ${key}`);
  }

  // --------------------------------------------------------------------------
  // 13.2  MIRACLE VOICINGS (Mantooth Ch. 4)
  // --------------------------------------------------------------------------

  /**
   * Miracle Voicing I.
   * From top note descend: M3, P4, P4, P4 = intervals [0, -4, -9, -14, -19].
   * @param {string} key - root of the intended chord
   * @param {string} functionType - 'strongMajor'|'weakMajor'|'minor'|'susDom'|'lydian'
   * @returns {string} MusicXML document
   */
  static generateMiracleVoicingI(key, functionType = 'strongMajor') {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    let topNote, label;
    switch (functionType) {
      case 'strongMajor':
        topNote = 60 + t + 11;
        label = `${key}Maj7 (M.V.I Strong)`;
        break;
      case 'weakMajor':
        topNote = 60 + t + 14;
        label = `${key}Maj9 (M.V.I Weak)`;
        break;
      case 'minor':
        topNote = 60 + t + 19;
        label = `${key}min9 (M.V.I)`;
        break;
      case 'susDom':
        topNote = 60 + t + 14;
        label = `${key}7sus (M.V.I)`;
        break;
      case 'lydian':
        topNote = 60 + t + 6;
        label = `${key}Lyd (M.V.I)`;
        break;
      default:
        topNote = 60 + t + 11;
        label = `${key}Maj7 (M.V.I)`;
    }
    const notes = [topNote, topNote - 4, topNote - 9, topNote - 14, topNote - 19];
    notes.sort((a, b) => a - b);
    const measures = JazzExerciseGenerator.generateMeasure(notes, 1, label, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `Miracle Voicing I (${functionType}) -- ${key}`);
  }

  /**
   * Miracle Voicing II (all P4ths -- identical to Generic Major from 5th).
   * @param {string} key
   * @param {string} functionType
   * @returns {string} MusicXML document
   */
  static generateMiracleVoicingII(key, functionType = 'strongMajor') {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    let topNote, label;
    switch (functionType) {
      case 'strongMajor':
        topNote = 60 + t + 11;
        label = `${key}Maj7 (M.V.II Strong)`;
        break;
      case 'weakMajor':
        topNote = 60 + t + 14;
        label = `${key}Maj9 (M.V.II Weak)`;
        break;
      case 'minor':
        topNote = 60 + t + 19;
        label = `${key}min11 (M.V.II)`;
        break;
      case 'susDom':
        topNote = 60 + t + 14;
        label = `${key}7sus (M.V.II)`;
        break;
      case 'lydian':
        topNote = 60 + t + 6;
        label = `${key}Lyd (M.V.II)`;
        break;
      default:
        topNote = 60 + t + 11;
        label = `${key}Maj7 (M.V.II)`;
    }
    const notes = [topNote, topNote - 5, topNote - 10, topNote - 15, topNote - 20];
    notes.sort((a, b) => a - b);
    const measures = JazzExerciseGenerator.generateMeasure(notes, 1, label, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `Miracle Voicing II (${functionType}) -- ${key}`);
  }

  /**
   * Miracle Voicing Workout -- ii-V-I using both MVs.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateMiracleVoicingWorkout(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const iiName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 2) % 12);
    const vName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 7) % 12);

    const iiTop = 62 + t + 19;
    const iiNotes = [iiTop, iiTop - 4, iiTop - 9, iiTop - 14, iiTop - 19].sort((a, b) => a - b);

    const vTop = 67 + t + 14;
    const vNotes = [vTop, vTop - 5, vTop - 10, vTop - 15, vTop - 20].sort((a, b) => a - b);

    const iTop = 60 + t + 11;
    const iNotes = [iTop, iTop - 4, iTop - 9, iTop - 14, iTop - 19].sort((a, b) => a - b);

    let measures = '';
    measures += JazzExerciseGenerator.generateMeasure(iiNotes, 1, `${iiName}min9 (M.V.I)`, key);
    measures += JazzExerciseGenerator.generateMeasure(vNotes, 2, `${vName}7sus (M.V.II)`, key);
    measures += JazzExerciseGenerator.generateMeasure(iNotes, 3, `${key}Maj7 (M.V.I)`, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `Miracle Voicing Workout ii-V-I -- ${key}`);
  }

  // --------------------------------------------------------------------------
  // 13.3  POLYCHORD FRACTIONS (Mantooth Ch. 6-7)
  // --------------------------------------------------------------------------

  /**
   * Generates a polychord fraction voicing for a dominant chord on `key`.
   * @param {string} key - root of the dominant chord
   * @param {string} fractionType - '11sus'|'13sharp11'|'7sharp9'|'7flat9'|'13flat9'|'7sharp9sharp5'
   * @returns {string} MusicXML document
   */
  static generatePolychordFraction(key, fractionType = '7flat9') {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const root = 48 + t;
    const third = root + 4;
    const seventh = root + 10;
    const fifth = root + 7;
    let lh, rh, label;
    switch (fractionType) {
      case '11sus':
        lh = [root, fifth];
        rh = JazzExerciseGenerator.majorTriad(root + 10 + 12);
        label = `${key}11sus`;
        break;
      case '13sharp11':
        lh = [third, seventh];
        rh = JazzExerciseGenerator.majorTriad(root + 6 + 12);
        label = `${key}13(#11)`;
        break;
      case '7sharp9':
        lh = [third, seventh];
        rh = JazzExerciseGenerator.majorTriad(root + 3 + 12);
        label = `${key}7(#9)`;
        break;
      case '7flat9':
        lh = [third, seventh];
        rh = JazzExerciseGenerator.majorTriad(root + 1 + 12);
        label = `${key}7(b9)`;
        break;
      case '13flat9':
        lh = [third, seventh];
        rh = JazzExerciseGenerator.majorTriad(root + 7 + 12);
        label = `${key}13(b9)`;
        break;
      case '7sharp9sharp5':
        lh = [third, seventh];
        rh = JazzExerciseGenerator.majorTriad(root + 8 + 12);
        label = `${key}7(#9/#5)`;
        break;
      default:
        throw new Error(`Unknown fraction type: ${fractionType}`);
    }
    const notes = [...lh, ...rh].sort((a, b) => a - b);
    const measures = JazzExerciseGenerator.generateMeasure(notes, 1, label, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `Polychord Fraction ${fractionType} -- ${key}`);
  }

  /**
   * ii-V7(b9)-I using M.V.I (ii) + polychord fraction bII (V) + generic maj (I).
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generate251WithPolychord_b9(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const iiName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 2) % 12);
    const vName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 7) % 12);

    const iiTop = 62 + t + 19;
    const iiNotes = [iiTop, iiTop - 4, iiTop - 9, iiTop - 14, iiTop - 19].sort((a, b) => a - b);

    const vRoot = 48 + t + 7;
    const vThird = vRoot + 4;
    const vSeventh = vRoot + 10;
    const vRH = JazzExerciseGenerator.majorTriad(vRoot + 1 + 12);
    const vNotes = [vThird, vSeventh, ...vRH].sort((a, b) => a - b);

    const iRoot = 60 + t;
    const iNotes = [iRoot, iRoot - 5, iRoot - 10, iRoot - 15, iRoot - 20].sort((a, b) => a - b);

    let measures = '';
    measures += JazzExerciseGenerator.generateMeasure(iiNotes, 1, `${iiName}min9`, key);
    measures += JazzExerciseGenerator.generateMeasure(vNotes, 2, `${vName}7(b9)`, key);
    measures += JazzExerciseGenerator.generateMeasure(iNotes, 3, `${key}Maj6/9`, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `ii-V7(b9)-I Polychord -- ${key}`);
  }

  /**
   * ii-V7(#9/#5)-I using polychord fraction bVI.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generate251WithPolychord_sharp9sharp5(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const iiName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 2) % 12);
    const vName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 7) % 12);

    const iiTop = 62 + t + 19;
    const iiNotes = [iiTop, iiTop - 4, iiTop - 9, iiTop - 14, iiTop - 19].sort((a, b) => a - b);

    const vRoot = 48 + t + 7;
    const vThird = vRoot + 4;
    const vSeventh = vRoot + 10;
    const vRH = JazzExerciseGenerator.majorTriad(vRoot + 8 + 12);
    const vNotes = [vThird, vSeventh, ...vRH].sort((a, b) => a - b);

    const iRoot = 60 + t;
    const iNotes = [iRoot, iRoot - 5, iRoot - 10, iRoot - 15, iRoot - 20].sort((a, b) => a - b);

    let measures = '';
    measures += JazzExerciseGenerator.generateMeasure(iiNotes, 1, `${iiName}min9`, key);
    measures += JazzExerciseGenerator.generateMeasure(vNotes, 2, `${vName}7(#9/#5)`, key);
    measures += JazzExerciseGenerator.generateMeasure(iNotes, 3, `${key}Maj6/9`, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `ii-V7(#9/#5)-I Polychord -- ${key}`);
  }

  /**
   * ii-V7(b9/b5)-I.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generate251WithPolychord_b9b5(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const iiName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 2) % 12);
    const vName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 7) % 12);

    const iiTop = 62 + t + 19;
    const iiNotes = [iiTop, iiTop - 4, iiTop - 9, iiTop - 14, iiTop - 19].sort((a, b) => a - b);

    const vRoot = 48 + t + 7;
    const vThird = vRoot + 4;
    const vSeventh = vRoot + 10;
    const bII = vRoot + 1 + 12;
    const vRH = [bII, bII + 4, bII + 6];
    const vNotes = [vThird, vSeventh, ...vRH].sort((a, b) => a - b);

    const iRoot = 60 + t;
    const iNotes = [iRoot, iRoot - 5, iRoot - 10, iRoot - 15, iRoot - 20].sort((a, b) => a - b);

    let measures = '';
    measures += JazzExerciseGenerator.generateMeasure(iiNotes, 1, `${iiName}min9`, key);
    measures += JazzExerciseGenerator.generateMeasure(vNotes, 2, `${vName}7(b9/b5)`, key);
    measures += JazzExerciseGenerator.generateMeasure(iNotes, 3, `${key}Maj6/9`, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `ii-V7(b9/b5)-I Polychord -- ${key}`);
  }

  /**
   * Cycles a polychord fraction through all 12 keys chromatically.
   * @param {string} fractionType
   * @returns {string} MusicXML document
   */
  static generatePolychord12KeyCycle(fractionType = '7flat9') {
    let measures = '';
    const keys = JazzExerciseGenerator.KEY_NAMES_CHROMATIC;
    for (let i = 0; i < 12; i++) {
      const k = keys[i];
      const t = JazzExerciseGenerator.transpositionFromC(k);
      const root = 48 + t;
      const third = root + 4;
      const seventh = root + 10;
      const fifth = root + 7;
      let lh, rh, label;
      switch (fractionType) {
        case '11sus':
          lh = [root, fifth]; rh = JazzExerciseGenerator.majorTriad(root + 10 + 12);
          label = `${k}11sus`; break;
        case '13sharp11':
          lh = [third, seventh]; rh = JazzExerciseGenerator.majorTriad(root + 6 + 12);
          label = `${k}13(#11)`; break;
        case '7sharp9':
          lh = [third, seventh]; rh = JazzExerciseGenerator.majorTriad(root + 3 + 12);
          label = `${k}7(#9)`; break;
        case '7flat9':
          lh = [third, seventh]; rh = JazzExerciseGenerator.majorTriad(root + 1 + 12);
          label = `${k}7(b9)`; break;
        case '13flat9':
          lh = [third, seventh]; rh = JazzExerciseGenerator.majorTriad(root + 7 + 12);
          label = `${k}13(b9)`; break;
        case '7sharp9sharp5':
          lh = [third, seventh]; rh = JazzExerciseGenerator.majorTriad(root + 8 + 12);
          label = `${k}7(#9/#5)`; break;
        default:
          lh = [third, seventh]; rh = JazzExerciseGenerator.majorTriad(root + 1 + 12);
          label = `${k}7(b9)`;
      }
      const notes = [...lh, ...rh].sort((a, b) => a - b);
      measures += JazzExerciseGenerator.generateMeasure(notes, i + 1, label, k);
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `Polychord Fraction ${fractionType} -- 12-Key Cycle`);
  }

  // --------------------------------------------------------------------------
  // 13.4  BERKLEE JAZZ VOICINGS (Berklee Book of Jazz Harmony Ch. 11)
  // --------------------------------------------------------------------------

  /**
   * 3-note guide-tone voicing through ii-V-I.
   * Root + 3rd + 7th. Voice-led: cycle-5 motion 3->7, 7->3.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateGuideTone3Note_251(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const iiRoot = 50 + t;
    const iiNotes = [iiRoot, iiRoot + 3, iiRoot + 10];

    const vRoot = 55 + t;
    const vNotes = [vRoot, vRoot + 4, vRoot + 10];

    const iRoot = 48 + t;
    const iNotes = [iRoot, iRoot + 4, iRoot + 11];

    const iiName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 2) % 12);
    const vName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 7) % 12);

    let measures = '';
    measures += JazzExerciseGenerator.generateMeasure(iiNotes, 1, `${iiName}min7`, key);
    measures += JazzExerciseGenerator.generateMeasure(vNotes, 2, `${vName}7`, key);
    measures += JazzExerciseGenerator.generateMeasure(iNotes, 3, `${key}Maj7`, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `3-Note Guide Tones ii-V-I -- ${key}`);
  }

  /**
   * 4-note voicing through ii-V-I.
   * Guide tones + tension: when 3 is on top add 13; when 7 is on top add 9.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateGuideTone4Note_251(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const iiRoot = 50 + t;
    const iiNotes = [iiRoot, iiRoot + 3, iiRoot + 10, iiRoot + 14].sort((a, b) => a - b);

    const vRoot = 55 + t;
    const v13 = vRoot + 9;
    const vNotes = [vRoot, vRoot + 4, v13, vRoot + 10].sort((a, b) => a - b);

    const iRoot = 48 + t;
    const iNotes = [iRoot, iRoot + 4, iRoot + 11, iRoot + 14].sort((a, b) => a - b);

    const iiName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 2) % 12);
    const vName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 7) % 12);

    let measures = '';
    measures += JazzExerciseGenerator.generateMeasure(iiNotes, 1, `${iiName}min9`, key);
    measures += JazzExerciseGenerator.generateMeasure(vNotes, 2, `${vName}13`, key);
    measures += JazzExerciseGenerator.generateMeasure(iNotes, 3, `${key}Maj9`, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `4-Note Guide Tones ii-V-I -- ${key}`);
  }

  /**
   * 4-way close voicing through ii-V-I.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generate4WayClose_251(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    // ii-7: D-7 = D,F,A,C close over D bass
    const iiBass = 38 + t;
    const iiClose = [iiBass, 62 + t, 65 + t, 69 + t, 72 + t].sort((a, b) => a - b);

    // V7: G7 = G,B,D,F close over G bass
    const vBass = 43 + t;
    const vClose = [vBass, 59 + t, 62 + t, 65 + t, 67 + t].sort((a, b) => a - b);

    // IMaj7: CMaj7 = C,E,G,B close over C bass
    const iBass = 36 + t;
    const iClose = [iBass, 64 + t, 67 + t, 71 + t, 72 + t].sort((a, b) => a - b);

    const iiName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 2) % 12);
    const vName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 7) % 12);

    let measures = '';
    measures += JazzExerciseGenerator.generateMeasure(iiClose, 1, `${iiName}min7`, key);
    measures += JazzExerciseGenerator.generateMeasure(vClose, 2, `${vName}7`, key);
    measures += JazzExerciseGenerator.generateMeasure(iClose, 3, `${key}Maj7`, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `4-Way Close ii-V-I -- ${key}`);
  }

  /**
   * 4-way close with tension substitutions: 9 replaces root, 13 replaces 5th.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generate4WayCloseTensionSub_251(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const iiBass = 38 + t;
    const iiClose = [iiBass, 64 + t, 65 + t, 71 + t, 72 + t].sort((a, b) => a - b);

    const vBass = 43 + t;
    const vClose = [vBass, 69 + t, 71 + t, 64 + t + 12, 65 + t + 12].sort((a, b) => a - b);

    const iBass = 36 + t;
    const iClose = [iBass, 62 + t, 64 + t, 69 + t, 71 + t].sort((a, b) => a - b);

    const iiName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 2) % 12);
    const vName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 7) % 12);

    let measures = '';
    measures += JazzExerciseGenerator.generateMeasure(iiClose, 1, `${iiName}min13`, key);
    measures += JazzExerciseGenerator.generateMeasure(vClose, 2, `${vName}13`, key);
    measures += JazzExerciseGenerator.generateMeasure(iClose, 3, `${key}Maj13`, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `4-Way Close Tension Sub ii-V-I -- ${key}`);
  }

  // --------------------------------------------------------------------------
  // 13.5  HYBRID VOICINGS (Berklee Ch. 11, pp. 218-225)
  // --------------------------------------------------------------------------

  /**
   * Hybrid voicing for a given chord type.
   * @param {string} key - chord root
   * @param {string} chordType - 'maj7'|'min7'|'dom7'|'min7b5'
   * @returns {string} MusicXML document
   */
  static generateHybridVoicing(key, chordType = 'maj7') {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const bass = 36 + t;
    let upper, label;
    switch (chordType) {
      case 'maj7':
        upper = JazzExerciseGenerator.majorTriad(67 + t);
        label = `${key}Maj7 (hybrid)`;
        break;
      case 'min7':
        upper = JazzExerciseGenerator.majorTriad(63 + t);
        label = `${key}min7 (hybrid)`;
        break;
      case 'dom7':
        upper = JazzExerciseGenerator.majorTriad(62 + t);
        label = `${key}13 (hybrid)`;
        break;
      case 'min7b5':
        upper = JazzExerciseGenerator.majorTriad(61 + t);
        label = `${key}min7b5 (hybrid)`;
        break;
      default:
        upper = JazzExerciseGenerator.majorTriad(67 + t);
        label = `${key}Maj7 (hybrid)`;
    }
    const notes = [bass, ...upper].sort((a, b) => a - b);
    const measures = JazzExerciseGenerator.generateMeasure(notes, 1, label, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `Hybrid Voicing ${chordType} -- ${key}`);
  }

  /**
   * I-vi-IV-V hybrid voicing progression.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateHybridProgression_1645(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const chords = [
      { root: 0, type: 'maj7', label: `${key}Maj7` },
      { root: 9, type: 'min7', label: `${JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 9) % 12)}min7` },
      { root: 5, type: 'maj7', label: `${JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 5) % 12)}Maj7` },
      { root: 7, type: 'dom7', label: `${JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 7) % 12)}7` }
    ];
    let measures = '';
    chords.forEach((ch, i) => {
      const bass = 36 + t + ch.root;
      let upper;
      switch (ch.type) {
        case 'maj7': upper = JazzExerciseGenerator.majorTriad(67 + t + ch.root); break;
        case 'min7': upper = JazzExerciseGenerator.majorTriad(63 + t + ch.root); break;
        case 'dom7': upper = JazzExerciseGenerator.majorTriad(62 + t + ch.root); break;
        default: upper = JazzExerciseGenerator.majorTriad(67 + t + ch.root);
      }
      const notes = [bass, ...upper].sort((a, b) => a - b);
      measures += JazzExerciseGenerator.generateMeasure(notes, i + 1, ch.label, key);
    });
    return JazzExerciseGenerator.wrapDocument(measures,
      `Hybrid Voicing I-vi-IV-V -- ${key}`);
  }

  // --------------------------------------------------------------------------
  // 13.6  POLYCHORD VOICINGS (Berklee Ch. 11, pp. 215-218)
  // --------------------------------------------------------------------------

  /**
   * Polychord (upper-structure) voicing.
   * @param {string} key - chord root
   * @param {string} chordType - 'maj7'|'min7'|'dom7'
   * @returns {string} MusicXML document
   */
  static generatePolychordVoicing(key, chordType = 'dom7') {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const root = 48 + t;
    let lower, upper, label;
    switch (chordType) {
      case 'maj7':
        lower = [root, root + 11];
        upper = JazzExerciseGenerator.majorTriad(root + 14);
        label = `${key}Maj13(#11) (polychord)`;
        break;
      case 'min7':
        lower = [root, root + 10];
        upper = JazzExerciseGenerator.majorTriad(root + 10 + 12);
        label = `${key}min11 (polychord)`;
        break;
      case 'dom7':
        lower = [root + 4, root + 10];
        upper = JazzExerciseGenerator.majorTriad(root + 14);
        label = `${key}13(#11) (polychord)`;
        break;
      default:
        lower = [root, root + 11];
        upper = JazzExerciseGenerator.majorTriad(root + 14);
        label = `${key} (polychord)`;
    }
    const notes = [...lower, ...upper].sort((a, b) => a - b);
    const measures = JazzExerciseGenerator.generateMeasure(notes, 1, label, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `Polychord Voicing ${chordType} -- ${key}`);
  }

  /**
   * III-VI-II-V-I polychord progression.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generatePolychordProgression_36251(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const pc = JazzExerciseGenerator.keyPC(key);
    const degrees = [
      { interval: 4, type: 'min7', numeral: 'iii' },
      { interval: 9, type: 'min7', numeral: 'vi' },
      { interval: 2, type: 'min7', numeral: 'ii' },
      { interval: 7, type: 'dom7', numeral: 'V' },
      { interval: 0, type: 'maj7', numeral: 'I' }
    ];
    let measures = '';
    degrees.forEach((deg, i) => {
      const chRoot = 48 + t + deg.interval;
      const chName = JazzExerciseGenerator.pcToKeyName((pc + deg.interval) % 12);
      let lower, upper;
      switch (deg.type) {
        case 'min7':
          lower = [chRoot, chRoot + 10];
          upper = JazzExerciseGenerator.majorTriad(chRoot + 10 + 12);
          break;
        case 'dom7':
          lower = [chRoot + 4, chRoot + 10];
          upper = JazzExerciseGenerator.majorTriad(chRoot + 14);
          break;
        case 'maj7':
          lower = [chRoot, chRoot + 11];
          upper = JazzExerciseGenerator.majorTriad(chRoot + 14);
          break;
        default:
          lower = [chRoot, chRoot + 11];
          upper = JazzExerciseGenerator.majorTriad(chRoot + 14);
      }
      const notes = [...lower, ...upper].sort((a, b) => a - b);
      const label = `${chName}${deg.type === 'min7' ? 'min7' : deg.type === 'dom7' ? '13(#11)' : 'Maj13(#11)'}`;
      measures += JazzExerciseGenerator.generateMeasure(notes, i + 1, label, key);
    });
    return JazzExerciseGenerator.wrapDocument(measures,
      `Polychord iii-vi-ii-V-I -- ${key}`);
  }

  // --------------------------------------------------------------------------
  // 13.7  QUARTAL VOICINGS (Berklee Ch. 11, pp. 226-229)
  // --------------------------------------------------------------------------

  /**
   * Quartal voicing for the given chord type.
   * @param {string} key - chord root
   * @param {string} chordType - 'maj7'|'min7'|'dom7'
   * @returns {string} MusicXML document
   */
  static generateQuartalVoicing(key, chordType = 'dom7') {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const bass = 36 + t;
    let startNote, label;
    switch (chordType) {
      case 'maj7':
        startNote = bass + 16;
        label = `${key}Maj7 (quartal)`;
        break;
      case 'min7':
        startNote = bass + 22;
        label = `${key}min7 (quartal)`;
        break;
      case 'dom7':
        startNote = bass + 16;
        label = `${key}7 (quartal)`;
        break;
      default:
        startNote = bass + 16;
        label = `${key} (quartal)`;
    }
    const stack = [bass, startNote, startNote + 5, startNote + 10, startNote + 15];
    const notes = stack.sort((a, b) => a - b);
    const measures = JazzExerciseGenerator.generateMeasure(notes, 1, label, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `Quartal Voicing ${chordType} -- ${key}`);
  }

  /**
   * Quartal voicing ii-V-I progression.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateQuartalProgression_251(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const pc = JazzExerciseGenerator.keyPC(key);
    const iiName = JazzExerciseGenerator.pcToKeyName((pc + 2) % 12);
    const vName = JazzExerciseGenerator.pcToKeyName((pc + 7) % 12);

    const iiBass = 38 + t;
    const iiStack = [iiBass, iiBass + 22, iiBass + 27, iiBass + 32, iiBass + 37].sort((a, b) => a - b);

    const vBass = 43 + t;
    const vStack = [vBass, vBass + 16, vBass + 21, vBass + 26, vBass + 31].sort((a, b) => a - b);

    const iBass = 36 + t;
    const iStack = [iBass, iBass + 16, iBass + 21, iBass + 26, iBass + 31].sort((a, b) => a - b);

    let measures = '';
    measures += JazzExerciseGenerator.generateMeasure(iiStack, 1, `${iiName}min7 (quartal)`, key);
    measures += JazzExerciseGenerator.generateMeasure(vStack, 2, `${vName}7 (quartal)`, key);
    measures += JazzExerciseGenerator.generateMeasure(iStack, 3, `${key}Maj7 (quartal)`, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `Quartal Voicing ii-V-I -- ${key}`);
  }

  // ============================================================================
  // PART 3: STAGE 15 -- CONSTANT STRUCTURE PROGRESSIONS (Berklee Ch. 10)
  // ============================================================================

  /**
   * Maj7 chords ascending chromatically from the given key.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateConstantStructure_Maj7_halfSteps(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    let measures = '';
    for (let i = 0; i < 8; i++) {
      const root = 48 + t + i;
      const notes = [root, root + 4, root + 7, root + 11];
      const chName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + i) % 12);
      measures += JazzExerciseGenerator.generateMeasure(notes, i + 1, `${chName}Maj7`, key);
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `Constant Structure Maj7 -- Half Steps from ${key}`);
  }

  /**
   * Maj7 chords descending in minor 3rds.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateConstantStructure_Maj7_minorThirds(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    let measures = '';
    for (let i = 0; i < 4; i++) {
      const root = 60 + t - (i * 3);
      const notes = [root, root + 4, root + 7, root + 11];
      const chName = JazzExerciseGenerator.pcToKeyName(((JazzExerciseGenerator.keyPC(key) - i * 3) % 12 + 12) % 12);
      measures += JazzExerciseGenerator.generateMeasure(notes, i + 1, `${chName}Maj7`, key);
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `Constant Structure Maj7 -- Minor 3rds from ${key}`);
  }

  /**
   * min7 chords in chromatic approach to a diatonic target.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateConstantStructure_Min7_chromatic(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    let measures = '';
    for (let i = -4; i <= 0; i++) {
      const root = 48 + t + i;
      const notes = [root, root + 3, root + 7, root + 10];
      const chName = JazzExerciseGenerator.pcToKeyName(((JazzExerciseGenerator.keyPC(key) + i) % 12 + 12) % 12);
      measures += JazzExerciseGenerator.generateMeasure(notes, i + 5, `${chName}min7`, key);
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `Constant Structure min7 Chromatic Approach -- ${key}`);
  }

  /**
   * Constant structure pattern: descending minor 3rds + ascending minor 2nds.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateConstantStructure_pattern(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    let measures = '';
    let root = 60 + t;
    for (let i = 0; i < 8; i++) {
      const notes = [root, root + 4, root + 7, root + 11];
      const chName = JazzExerciseGenerator.pcToKeyName(((root % 12) + 12) % 12);
      measures += JazzExerciseGenerator.generateMeasure(notes, i + 1, `${chName}Maj7`, key);
      if (i % 2 === 0) {
        root -= 3;
      } else {
        root += 1;
      }
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `Constant Structure Pattern (desc m3 / asc m2) -- ${key}`);
  }

  /**
   * Coltrane changes: major 3rd cycle.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateColtraneCyclePattern(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const centers = [0, 8, 4];
    const sequence = [];
    for (let c = 0; c < 3; c++) {
      const majRoot = 48 + t + centers[c];
      const majPC = ((JazzExerciseGenerator.keyPC(key) + centers[c]) % 12 + 12) % 12;
      const nextCenter = centers[(c + 1) % 3];
      let domRoot = 48 + t + nextCenter + 7;
      if (domRoot > 60) domRoot -= 12;
      const domPC = ((JazzExerciseGenerator.keyPC(key) + nextCenter + 7) % 12 + 12) % 12;
      sequence.push({ root: majRoot, type: 'maj7', pc: majPC });
      sequence.push({ root: domRoot, type: 'dom7', pc: domPC });
    }
    sequence.push({ root: 48 + t, type: 'maj7', pc: JazzExerciseGenerator.keyPC(key) });

    let measures = '';
    sequence.forEach((ch, i) => {
      const r = ch.root;
      let notes;
      if (ch.type === 'maj7') {
        notes = [r, r + 4, r + 7, r + 11];
      } else {
        notes = [r, r + 4, r + 7, r + 10];
      }
      const name = JazzExerciseGenerator.pcToKeyName(ch.pc);
      const label = ch.type === 'maj7' ? `${name}Maj7` : `${name}7`;
      measures += JazzExerciseGenerator.generateMeasure(notes, i + 1, label, key);
    });
    return JazzExerciseGenerator.wrapDocument(measures,
      `Coltrane Cycle (Major 3rd Cycle) -- ${key}`);
  }

  // ============================================================================
  // PART 4: STAGE 6A -- CHORD-SCALE THEORY (Levine Jazz Theory Book)
  // ============================================================================

  /** Major scale mode intervals. */
  static MAJOR_MODE_INTERVALS = [
    [0, 2, 4, 5, 7, 9, 11],
    [0, 2, 3, 5, 7, 9, 10],
    [0, 1, 3, 5, 7, 8, 10],
    [0, 2, 4, 6, 7, 9, 11],
    [0, 2, 4, 5, 7, 9, 10],
    [0, 2, 3, 5, 7, 8, 10],
    [0, 1, 3, 5, 6, 8, 10]
  ];

  static MAJOR_MODE_NAMES = [
    'Ionian', 'Dorian', 'Phrygian', 'Lydian',
    'Mixolydian', 'Aeolian', 'Locrian'
  ];

  static MAJOR_MODE_CHORDS = [
    'Maj7', 'min7', 'sus(b9)', 'Maj7(#11)',
    'Dom7', 'min7(b6)', 'half-dim'
  ];

  /** Melodic minor mode intervals. */
  static MELODIC_MINOR_INTERVALS = [
    [0, 2, 3, 5, 7, 9, 11],
    [0, 1, 3, 5, 7, 9, 10],
    [0, 2, 4, 6, 8, 9, 11],
    [0, 2, 4, 6, 7, 9, 10],
    [0, 2, 4, 5, 7, 8, 10],
    [0, 2, 3, 5, 6, 8, 10],
    [0, 1, 3, 4, 6, 8, 10]
  ];

  static MELODIC_MINOR_MODE_NAMES = [
    'Minor-Major', 'Dorian b2', 'Lydian Augmented',
    'Lydian Dominant', 'Mixolydian b6', 'Locrian #2', 'Altered'
  ];

  static MELODIC_MINOR_MODE_CHORDS = [
    'min(Maj7)', 'sus(b9)', 'Maj7(#5)', 'Dom7(#11)',
    'Dom7(b13)', 'min7(b5)', 'Alt7'
  ];

  /**
   * Generates a single major-scale mode as ascending + descending.
   * @param {string} key
   * @param {number} modeNumber - 1-7
   * @returns {string} MusicXML document
   */
  static generateMajorScaleMode(key, modeNumber = 1) {
    const idx = modeNumber - 1;
    if (idx < 0 || idx > 6) throw new Error('modeNumber must be 1-7');
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const intervals = JazzExerciseGenerator.MAJOR_MODE_INTERVALS[idx];
    const modeName = JazzExerciseGenerator.MAJOR_MODE_NAMES[idx];

    const ascending = intervals.map(i => 60 + t + i);
    ascending.push(60 + t + 12);
    const descending = [...ascending].reverse().slice(1);
    const allNotes = [...ascending, ...descending];
    const durations = allNotes.map(() => 2);

    let measures = '';
    let mNum = 1;
    for (let i = 0; i < allNotes.length; i += 8) {
      const chunk = allNotes.slice(i, i + 8);
      const durs = durations.slice(i, i + 8);
      const label = mNum === 1 ? `${key} ${modeName}` : '';
      measures += JazzExerciseGenerator.generateMelodyMeasure(chunk, durs, mNum, label, key);
      mNum++;
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `${key} ${modeName} (Mode ${modeNumber}) -- ${JazzExerciseGenerator.MAJOR_MODE_CHORDS[idx]}`);
  }

  /**
   * Generates all 7 modes from one parent major key.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateAllModesFromKey(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const parentIntervals = JazzExerciseGenerator.MAJOR_MODE_INTERVALS[0];
    let measures = '';
    let mNum = 1;
    for (let mode = 0; mode < 7; mode++) {
      const modeRoot = 60 + t + parentIntervals[mode];
      const intervals = JazzExerciseGenerator.MAJOR_MODE_INTERVALS[mode];
      const ascending = intervals.map(i => modeRoot + i);
      ascending.push(modeRoot + 12);
      const modeName = JazzExerciseGenerator.MAJOR_MODE_NAMES[mode];
      const rootName = JazzExerciseGenerator.pcToKeyName(((modeRoot % 12) + 12) % 12);
      const durations = ascending.map(() => 2);
      measures += JazzExerciseGenerator.generateMelodyMeasure(ascending, durations, mNum, `${rootName} ${modeName}`, key);
      mNum++;
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `All 7 Modes from ${key} Major`);
  }

  /**
   * Generates a melodic minor mode scale.
   * @param {string} key
   * @param {number} modeNumber - 1-7
   * @returns {string} MusicXML document
   */
  static generateMelodicMinorMode(key, modeNumber = 1) {
    const idx = modeNumber - 1;
    if (idx < 0 || idx > 6) throw new Error('modeNumber must be 1-7');
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const intervals = JazzExerciseGenerator.MELODIC_MINOR_INTERVALS[idx];
    const modeName = JazzExerciseGenerator.MELODIC_MINOR_MODE_NAMES[idx];

    const ascending = intervals.map(i => 60 + t + i);
    ascending.push(60 + t + 12);
    const descending = [...ascending].reverse().slice(1);
    const allNotes = [...ascending, ...descending];
    const durations = allNotes.map(() => 2);

    let measures = '';
    let mNum = 1;
    for (let i = 0; i < allNotes.length; i += 8) {
      const chunk = allNotes.slice(i, i + 8);
      const durs = durations.slice(i, i + 8);
      const label = mNum === 1 ? `${key} ${modeName}` : '';
      measures += JazzExerciseGenerator.generateMelodyMeasure(chunk, durs, mNum, label, key);
      mNum++;
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `${key} ${modeName} (Mel. Minor Mode ${modeNumber}) -- ${JazzExerciseGenerator.MELODIC_MINOR_MODE_CHORDS[idx]}`);
  }

  /**
   * Generates all 7 melodic minor modes from one parent key.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateAllMelodicMinorModes(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const parentIntervals = JazzExerciseGenerator.MELODIC_MINOR_INTERVALS[0];
    let measures = '';
    let mNum = 1;
    for (let mode = 0; mode < 7; mode++) {
      const modeRoot = 60 + t + parentIntervals[mode];
      const intervals = JazzExerciseGenerator.MELODIC_MINOR_INTERVALS[mode];
      const ascending = intervals.map(i => modeRoot + i);
      ascending.push(modeRoot + 12);
      const modeName = JazzExerciseGenerator.MELODIC_MINOR_MODE_NAMES[mode];
      const rootName = JazzExerciseGenerator.pcToKeyName(((modeRoot % 12) + 12) % 12);
      const durations = ascending.map(() => 2);
      measures += JazzExerciseGenerator.generateMelodyMeasure(ascending, durations, mNum, `${rootName} ${modeName}`, key);
      mNum++;
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `All 7 Melodic Minor Modes from ${key}`);
  }

  // --------------------------------------------------------------------------
  // 4-D  SYMMETRIC SCALES
  // --------------------------------------------------------------------------

  /**
   * Half-whole diminished scale (8 notes). Used over V7(b9).
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateDiminishedScale_halfWhole(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const intervals = [0, 1, 3, 4, 6, 7, 9, 10];
    const ascending = intervals.map(i => 60 + t + i);
    ascending.push(60 + t + 12);
    const descending = [...ascending].reverse().slice(1);
    const allNotes = [...ascending, ...descending];
    const durations = allNotes.map(() => 2);

    let measures = '';
    let mNum = 1;
    for (let i = 0; i < allNotes.length; i += 8) {
      const chunk = allNotes.slice(i, i + 8);
      const durs = durations.slice(i, i + 8);
      const label = mNum === 1 ? `${key} Dim (H-W)` : '';
      measures += JazzExerciseGenerator.generateMelodyMeasure(chunk, durs, mNum, label, key);
      mNum++;
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `${key} Diminished Scale (Half-Whole) -- V7(b9)`);
  }

  /**
   * Whole-half diminished scale. Used over dim7 chords.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateDiminishedScale_wholeHalf(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const intervals = [0, 2, 3, 5, 6, 8, 9, 11];
    const ascending = intervals.map(i => 60 + t + i);
    ascending.push(60 + t + 12);
    const descending = [...ascending].reverse().slice(1);
    const allNotes = [...ascending, ...descending];
    const durations = allNotes.map(() => 2);

    let measures = '';
    let mNum = 1;
    for (let i = 0; i < allNotes.length; i += 8) {
      const chunk = allNotes.slice(i, i + 8);
      const durs = durations.slice(i, i + 8);
      const label = mNum === 1 ? `${key} Dim (W-H)` : '';
      measures += JazzExerciseGenerator.generateMelodyMeasure(chunk, durs, mNum, label, key);
      mNum++;
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `${key} Diminished Scale (Whole-Half) -- dim7`);
  }

  /**
   * Diminished lick: 4-note motif repeated down minor 3rds.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateDiminishedLick_minor3rdPattern(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const motif = [0, 3, 4, 7];
    const allNotes = [];
    const durations = [];
    for (let i = 0; i < 4; i++) {
      const offset = -(i * 3);
      motif.forEach(n => {
        allNotes.push(60 + t + n + offset);
        durations.push(2);
      });
    }

    let measures = '';
    let mNum = 1;
    for (let i = 0; i < allNotes.length; i += 8) {
      const chunk = allNotes.slice(i, i + 8);
      const durs = durations.slice(i, i + 8);
      const label = mNum === 1 ? `${key} Dim Lick` : '';
      measures += JazzExerciseGenerator.generateMelodyMeasure(chunk, durs, mNum, label, key);
      mNum++;
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `${key} Diminished Lick -- Minor 3rd Repetition`);
  }

  /**
   * Whole-tone scale (6 notes).
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateWholeToneScale(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const intervals = [0, 2, 4, 6, 8, 10];
    const ascending = intervals.map(i => 60 + t + i);
    ascending.push(60 + t + 12);
    const descending = [...ascending].reverse().slice(1);
    const allNotes = [...ascending, ...descending];
    const durations = allNotes.map(() => 2);

    let measures = '';
    let mNum = 1;
    for (let i = 0; i < allNotes.length; i += 8) {
      const chunk = allNotes.slice(i, i + 8);
      const durs = durations.slice(i, i + 8);
      const label = mNum === 1 ? `${key} Whole Tone` : '';
      measures += JazzExerciseGenerator.generateMelodyMeasure(chunk, durs, mNum, label, key);
      mNum++;
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `${key} Whole-Tone Scale -- Dom7(#5)`);
  }

  // ============================================================================
  // PART 5: VOCAL STAGES V1-V3 (Stoloff "Scat!")
  // ============================================================================

  /**
   * V1.3 Scat syllable warm-up: single pitch ascending by half steps.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateScatSyllableWarmup(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    let measures = '';
    for (let i = 0; i < 8; i++) {
      const pitch = 60 + t + i;
      const notes = Array(8).fill(pitch);
      const durs = Array(8).fill(2);
      const label = i === 0 ? `Scat Warm-Up (${key})` : '';
      measures += JazzExerciseGenerator.generateMelodyMeasure(notes, durs, i + 1, label, key);
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `V1.3 Scat Syllable Warm-Up -- ${key}`);
  }

  // V2 functions

  /**
   * V2.1 Diatonic pattern -- ascending.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateDiatonicPattern_ascending(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const scale = JazzExerciseGenerator.MAJOR_MODE_INTERVALS[0];
    const notes = scale.map(i => 60 + t + i);
    notes.push(60 + t + 12);
    const durations = notes.map(() => 2);
    const measures = JazzExerciseGenerator.generateMelodyMeasure(notes, durations, 1, `${key} Diatonic Asc.`, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `V2.1 Diatonic Pattern -- Ascending -- ${key}`);
  }

  /**
   * V2.1 Diatonic pattern -- descending.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateDiatonicPattern_descending(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const scale = JazzExerciseGenerator.MAJOR_MODE_INTERVALS[0];
    const descNotes = [...scale.map(i => 60 + t + i), 60 + t + 12].reverse();
    const durations = descNotes.map(() => 2);
    const measures = JazzExerciseGenerator.generateMelodyMeasure(descNotes, durations, 1, `${key} Diatonic Desc.`, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `V2.1 Diatonic Pattern -- Descending -- ${key}`);
  }

  /**
   * V2.1 Jazz waltz diatonic pattern (3/4).
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateDiatonicPattern_jazzWaltz(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const scale = JazzExerciseGenerator.MAJOR_MODE_INTERVALS[0];
    let measures = '';
    for (let deg = 0; deg < 7; deg++) {
      const root = 60 + t + scale[deg];
      const third = 60 + t + scale[(deg + 2) % 7] + (deg + 2 >= 7 ? 12 : 0);
      const fifth = 60 + t + scale[(deg + 4) % 7] + (deg + 4 >= 7 ? 12 : 0);
      const notes = [root, third, fifth];
      let xml = `    <measure number="${deg + 1}">\n`;
      if (deg === 0) {
        xml += '      <attributes>\n';
        xml += '        <divisions>4</divisions>\n';
        xml += '        <time>\n          <beats>3</beats>\n          <beat-type>4</beat-type>\n        </time>\n';
        xml += '        <clef>\n          <sign>G</sign>\n          <line>2</line>\n        </clef>\n';
        xml += '      </attributes>\n';
        xml += `      <direction placement="above">\n        <direction-type>\n          <words default-y="40" font-size="12" font-weight="bold">${key} Jazz Waltz Arpeggios</words>\n        </direction-type>\n      </direction>\n`;
      }
      notes.forEach(n => {
        xml += JazzExerciseGenerator.generateSingleNote(n, 4, 'quarter', key);
      });
      xml += `    </measure>\n`;
      measures += xml;
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `V2.1 Diatonic Pattern -- Jazz Waltz -- ${key}`);
  }

  /**
   * V2.2 ii-V modal pattern -- 1-measure.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generate_iiV_modalPattern_oneMeasure(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const iiRoot = 60 + t + 2;
    const vRoot = 60 + t + 7;
    const dorian = JazzExerciseGenerator.MAJOR_MODE_INTERVALS[1];
    const mixo = JazzExerciseGenerator.MAJOR_MODE_INTERVALS[4];

    const iiNotes = dorian.slice(0, 8).map(i => iiRoot + i);
    while (iiNotes.length < 8) iiNotes.push(iiRoot + 12);
    const iiDurs = iiNotes.map(() => 2);

    const vAsc = mixo.map(i => vRoot + i);
    vAsc.push(vRoot + 12);
    const vNotes = vAsc.reverse().slice(0, 8);
    const vDurs = vNotes.map(() => 2);

    const iiName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 2) % 12);
    const vName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 7) % 12);

    let measures = '';
    measures += JazzExerciseGenerator.generateMelodyMeasure(iiNotes, iiDurs, 1, `${iiName}min7 (Dorian)`, key);
    measures += JazzExerciseGenerator.generateMelodyMeasure(vNotes, vDurs, 2, `${vName}7 (Mixolydian)`, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `V2.2 ii-V Modal Pattern (1-Measure) -- ${key}`);
  }

  /**
   * V2.2 ii-V modal pattern -- 2-measure.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generate_iiV_modalPattern_twoMeasure(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const iiRoot = 60 + t + 2;
    const vRoot = 55 + t + 7;
    const dorian = JazzExerciseGenerator.MAJOR_MODE_INTERVALS[1];
    const mixo = JazzExerciseGenerator.MAJOR_MODE_INTERVALS[4];

    const iiAsc = dorian.map(i => iiRoot + i);
    iiAsc.push(iiRoot + 12);
    const iiDurs = iiAsc.map(() => 2);

    const vDesc = mixo.map(i => vRoot + i);
    vDesc.push(vRoot + 12);
    vDesc.reverse();
    const vDurs = vDesc.map(() => 2);

    const iiName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 2) % 12);
    const vName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 7) % 12);

    let measures = '';
    measures += JazzExerciseGenerator.generateMelodyMeasure(iiAsc.slice(0, 8), iiDurs.slice(0, 8), 1, `${iiName}min7`, key);
    if (iiAsc.length > 8) {
      measures += JazzExerciseGenerator.generateMelodyMeasure(iiAsc.slice(8), iiDurs.slice(8), 2, '', key);
    }
    measures += JazzExerciseGenerator.generateMelodyMeasure(vDesc.slice(0, 8), vDurs.slice(0, 8), 3, `${vName}7`, key);
    if (vDesc.length > 8) {
      measures += JazzExerciseGenerator.generateMelodyMeasure(vDesc.slice(8), vDurs.slice(8), 4, '', key);
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `V2.2 ii-V Modal Pattern (2-Measure) -- ${key}`);
  }

  /**
   * V2.3 Melodic embellishment: triplet on ii resolving to V.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateMelodicEmbellishment_triplet(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const iiRoot = 60 + t + 2;
    const vRoot = 60 + t + 7;
    const iiNotes = [iiRoot, iiRoot + 1, iiRoot + 3, iiRoot + 5, iiRoot + 7, iiRoot + 3];
    const iiDurs = [2, 2, 2, 2, 4, 4];
    const vNotes = [vRoot, vRoot + 4, vRoot + 7, vRoot + 10];
    const vDurs = [4, 4, 4, 4];

    const iiName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 2) % 12);
    const vName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 7) % 12);

    let measures = '';
    measures += JazzExerciseGenerator.generateMelodyMeasure(iiNotes, iiDurs, 1, `${iiName}min7 (triplet)`, key);
    measures += JazzExerciseGenerator.generateMelodyMeasure(vNotes, vDurs, 2, `${vName}7`, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `V2.3 Melodic Embellishment -- Triplet -- ${key}`);
  }

  /**
   * V2.4 Extended ii-V arpeggio through cycle of 5ths.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateExtended_iiV_arpeggio(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    let measures = '';
    let mNum = 1;
    for (let cycle = 0; cycle < 4; cycle++) {
      const keyOffset = -(cycle * 7) % 12;
      const iiRoot = 60 + t + 2 + keyOffset;
      const vRoot = 60 + t + 7 + keyOffset - 12;
      const iiNotes = [iiRoot, iiRoot + 3, iiRoot + 7, iiRoot + 10];
      const iiDurs = [4, 4, 4, 4];
      const vNotes = [vRoot, vRoot + 4, vRoot + 7, vRoot + 10];
      const vDurs = [4, 4, 4, 4];
      const localPC = ((JazzExerciseGenerator.keyPC(key) + keyOffset) % 12 + 12) % 12;
      const iiName = JazzExerciseGenerator.pcToKeyName((localPC + 2) % 12);
      const vName = JazzExerciseGenerator.pcToKeyName((localPC + 7) % 12);
      measures += JazzExerciseGenerator.generateMelodyMeasure(iiNotes, iiDurs, mNum, `${iiName}min7`, key);
      mNum++;
      measures += JazzExerciseGenerator.generateMelodyMeasure(vNotes, vDurs, mNum, `${vName}7`, key);
      mNum++;
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `V2.4 Extended ii-V Arpeggio -- Cycle of 5ths -- ${key}`);
  }

  /** V2.6 Chord scale - major (Ionian). */
  static generateChordScale_vocal_major(key) {
    return JazzExerciseGenerator.generateMajorScaleMode(key, 1);
  }

  /** V2.6 Chord scale - Dorian. */
  static generateChordScale_vocal_dorian(key) {
    return JazzExerciseGenerator.generateMajorScaleMode(key, 2);
  }

  /** V2.6 Chord scale - Mixolydian. */
  static generateChordScale_vocal_mixolydian(key) {
    return JazzExerciseGenerator.generateMajorScaleMode(key, 5);
  }

  /** V2.6 Chord scale - altered dominant. */
  static generateChordScale_vocal_altered(key) {
    return JazzExerciseGenerator.generateMelodicMinorMode(key, 7);
  }

  // --------------------------------------------------------------------------
  // V3: VOCAL BASS LINES (Stoloff pp. 90-102)
  // --------------------------------------------------------------------------

  /**
   * V3.5 Vocal bass line: roots and 5ths through cycle of 5ths.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateVocalBassLine_roots5ths(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    let measures = '';
    let currentRoot = 48 + t;
    for (let i = 0; i < 6; i++) {
      const notes = [currentRoot, currentRoot + 7, currentRoot, currentRoot + 7];
      const durs = [4, 4, 4, 4];
      const chName = JazzExerciseGenerator.pcToKeyName(((currentRoot % 12) + 12) % 12);
      measures += JazzExerciseGenerator.generateMelodyMeasure(notes, durs, i + 1, `${chName}7`, key);
      currentRoot -= 7;
      if (currentRoot < 36) currentRoot += 12;
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `V3.5 Vocal Bass Line -- Roots & 5ths -- ${key}`);
  }

  /**
   * V3.5 Vocal bass line: roots, 5ths, and 7ths.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateVocalBassLine_roots5ths7ths(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    let measures = '';
    let currentRoot = 48 + t;
    for (let i = 0; i < 6; i++) {
      const notes = [currentRoot, currentRoot + 7, currentRoot + 10, currentRoot + 7];
      const durs = [4, 4, 4, 4];
      const chName = JazzExerciseGenerator.pcToKeyName(((currentRoot % 12) + 12) % 12);
      measures += JazzExerciseGenerator.generateMelodyMeasure(notes, durs, i + 1, `${chName}7`, key);
      currentRoot -= 7;
      if (currentRoot < 36) currentRoot += 12;
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `V3.5 Vocal Bass Line -- Roots, 5ths & 7ths -- ${key}`);
  }

  /**
   * V3.5 Vocal bass line: roots, 3rds, and 7ths.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateVocalBassLine_roots3rds7ths(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    let measures = '';
    let currentRoot = 48 + t;
    for (let i = 0; i < 6; i++) {
      const isMinor = (i % 2 === 0);
      const third = isMinor ? currentRoot + 3 : currentRoot + 4;
      const seventh = currentRoot + 10;
      const notes = [currentRoot, third, seventh, currentRoot];
      const durs = [4, 4, 4, 4];
      const chName = JazzExerciseGenerator.pcToKeyName(((currentRoot % 12) + 12) % 12);
      const suffix = isMinor ? 'min7' : '7';
      measures += JazzExerciseGenerator.generateMelodyMeasure(notes, durs, i + 1, `${chName}${suffix}`, key);
      currentRoot -= 7;
      if (currentRoot < 36) currentRoot += 12;
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `V3.5 Vocal Bass Line -- Roots, 3rds & 7ths -- ${key}`);
  }

  /**
   * V3.5 Walking bass line through cycle of 5ths.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateVocalBassLine_walking(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    let measures = '';
    let currentRoot = 48 + t;
    for (let i = 0; i < 6; i++) {
      const nextRoot = currentRoot - 7;
      const adjustedNext = nextRoot < 36 ? nextRoot + 12 : nextRoot;
      const third = currentRoot + 4;
      const fifth = currentRoot + 7;
      const approach = adjustedNext - 1;
      const notes = [currentRoot, third, fifth, approach];
      const durs = [4, 4, 4, 4];
      const chName = JazzExerciseGenerator.pcToKeyName(((currentRoot % 12) + 12) % 12);
      measures += JazzExerciseGenerator.generateMelodyMeasure(notes, durs, i + 1, `${chName}7`, key);
      currentRoot = adjustedNext;
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `V3.5 Vocal Walking Bass Line -- ${key}`);
  }

  // ============================================================================
  // PART 6: VOCAL STAGE V4 (Weir "Fearless Vocal Improvisation")
  // ============================================================================

  /**
   * V4.1 Ascending diatonic line.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateDiatonicLine_ascending(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const scale = JazzExerciseGenerator.MAJOR_MODE_INTERVALS[0];
    const notes = scale.map(i => 60 + t + i);
    notes.push(60 + t + 12);
    const durs = notes.map(() => 4);
    let measures = '';
    let mNum = 1;
    for (let i = 0; i < notes.length; i += 4) {
      const chunk = notes.slice(i, i + 4);
      const d = durs.slice(i, i + 4);
      measures += JazzExerciseGenerator.generateMelodyMeasure(chunk, d, mNum, mNum === 1 ? `${key} Ascending` : '', key);
      mNum++;
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `V4.1 Diatonic Line -- Ascending -- ${key}`);
  }

  /**
   * V4.1 Descending diatonic line.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateDiatonicLine_descending(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const scale = JazzExerciseGenerator.MAJOR_MODE_INTERVALS[0];
    const notes = [...scale.map(i => 60 + t + i), 60 + t + 12].reverse();
    const durs = notes.map(() => 4);
    let measures = '';
    let mNum = 1;
    for (let i = 0; i < notes.length; i += 4) {
      const chunk = notes.slice(i, i + 4);
      const d = durs.slice(i, i + 4);
      measures += JazzExerciseGenerator.generateMelodyMeasure(chunk, d, mNum, mNum === 1 ? `${key} Descending` : '', key);
      mNum++;
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `V4.1 Diatonic Line -- Descending -- ${key}`);
  }

  /**
   * V4.1 Wave-pattern diatonic line (ascending 3rds).
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateDiatonicLine_wave(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const scale = JazzExerciseGenerator.MAJOR_MODE_INTERVALS[0];
    const fullScale = [...scale.map(i => 60 + t + i), ...scale.map(i => 72 + t + i)];
    const pattern = [0, 2, 1, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 7, 9];
    const notes = pattern.filter(p => p < fullScale.length).map(p => fullScale[p]);
    const durs = notes.map(() => 2);

    let measures = '';
    let mNum = 1;
    for (let i = 0; i < notes.length; i += 8) {
      const chunk = notes.slice(i, i + 8);
      const d = durs.slice(i, i + 8);
      measures += JazzExerciseGenerator.generateMelodyMeasure(chunk, d, mNum, mNum === 1 ? `${key} Wave Pattern` : '', key);
      mNum++;
    }
    return JazzExerciseGenerator.wrapDocument(measures,
      `V4.1 Diatonic Line -- Wave -- ${key}`);
  }

  /**
   * V4.2 Bebop lick with chromatic passing tone.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateBebopLick_chromaticPassing(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const notes = [60+t, 62+t, 63+t, 64+t, 67+t, 65+t, 64+t, 60+t];
    const durs = notes.map(() => 2);
    const measures = JazzExerciseGenerator.generateMelodyMeasure(notes, durs, 1, `${key}Maj7 (bebop)`, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `V4.2 Bebop Lick -- Chromatic Passing -- ${key}`);
  }

  /**
   * V4.2 Bebop enclosure lick.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateBebopLick_enclosure(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const notes = [65+t, 63+t, 64+t, 67+t, 62+t, 59+t, 60+t, 60+t+12];
    const durs = notes.map(() => 2);
    const measures = JazzExerciseGenerator.generateMelodyMeasure(notes, durs, 1, `${key} Enclosure`, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `V4.2 Bebop Lick -- Enclosure -- ${key}`);
  }

  /**
   * V4.2 Bebop ii-V lick.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateBebopLick_iiV(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const iiName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 2) % 12);
    const vName = JazzExerciseGenerator.pcToKeyName((JazzExerciseGenerator.keyPC(key) + 7) % 12);

    const iiNotes = [62+t, 65+t, 66+t, 67+t, 69+t, 67+t, 65+t, 64+t];
    const vNotes = [67+t, 71+t, 70+t, 69+t, 67+t, 65+t, 64+t, 60+t];
    const durs = Array(8).fill(2);

    let measures = '';
    measures += JazzExerciseGenerator.generateMelodyMeasure(iiNotes, durs, 1, `${iiName}min7`, key);
    measures += JazzExerciseGenerator.generateMelodyMeasure(vNotes, durs, 2, `${vName}7`, key);
    return JazzExerciseGenerator.wrapDocument(measures,
      `V4.2 Bebop Lick -- ii-V -- ${key}`);
  }

  // V4.3 Hearing the Changes

  /**
   * V4.3 Sing roots through I-vi-ii-V.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateHearingChanges_roots(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const pc = JazzExerciseGenerator.keyPC(key);
    const degrees = [
      { interval: 0, label: `${key}Maj7` },
      { interval: 9, label: `${JazzExerciseGenerator.pcToKeyName((pc + 9) % 12)}min7` },
      { interval: 2, label: `${JazzExerciseGenerator.pcToKeyName((pc + 2) % 12)}min7` },
      { interval: 7, label: `${JazzExerciseGenerator.pcToKeyName((pc + 7) % 12)}7` }
    ];
    let measures = '';
    degrees.forEach((deg, i) => {
      const root = 60 + t + deg.interval;
      measures += JazzExerciseGenerator.generateMeasure([root], i + 1, deg.label, key);
    });
    return JazzExerciseGenerator.wrapDocument(measures,
      `V4.3 Hearing Changes -- Roots -- ${key}`);
  }

  /**
   * V4.3 Sing arpeggios through I-vi-ii-V.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateHearingChanges_arpeggios(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const pc = JazzExerciseGenerator.keyPC(key);
    const chords = [
      { interval: 0, quality: [0, 4, 7, 11], label: `${key}Maj7` },
      { interval: 9, quality: [0, 3, 7, 10], label: `${JazzExerciseGenerator.pcToKeyName((pc + 9) % 12)}min7` },
      { interval: 2, quality: [0, 3, 7, 10], label: `${JazzExerciseGenerator.pcToKeyName((pc + 2) % 12)}min7` },
      { interval: 7, quality: [0, 4, 7, 10], label: `${JazzExerciseGenerator.pcToKeyName((pc + 7) % 12)}7` }
    ];
    let measures = '';
    chords.forEach((ch, i) => {
      const root = 60 + t + ch.interval;
      const notes = ch.quality.map(q => root + q);
      const durs = [4, 4, 4, 4];
      measures += JazzExerciseGenerator.generateMelodyMeasure(notes, durs, i + 1, ch.label, key);
    });
    return JazzExerciseGenerator.wrapDocument(measures,
      `V4.3 Hearing Changes -- Arpeggios -- ${key}`);
  }

  /**
   * V4.3 Sing guide tones (3rds and 7ths) through I-vi-ii-V.
   * @param {string} key
   * @returns {string} MusicXML document
   */
  static generateHearingChanges_guideTones(key) {
    const t = JazzExerciseGenerator.transpositionFromC(key);
    const pc = JazzExerciseGenerator.keyPC(key);
    const chords = [
      { interval: 0, third: 4, seventh: 11, label: `${key}Maj7` },
      { interval: 9, third: 3, seventh: 10, label: `${JazzExerciseGenerator.pcToKeyName((pc + 9) % 12)}min7` },
      { interval: 2, third: 3, seventh: 10, label: `${JazzExerciseGenerator.pcToKeyName((pc + 2) % 12)}min7` },
      { interval: 7, third: 4, seventh: 10, label: `${JazzExerciseGenerator.pcToKeyName((pc + 7) % 12)}7` }
    ];
    let measures = '';
    chords.forEach((ch, i) => {
      const root = 60 + t + ch.interval;
      const notes = [root + ch.third, root + ch.seventh];
      const durs = [8, 8];
      measures += JazzExerciseGenerator.generateMelodyMeasure(notes, durs, i + 1, ch.label, key);
    });
    return JazzExerciseGenerator.wrapDocument(measures,
      `V4.3 Hearing Changes -- Guide Tones -- ${key}`);
  }

  // ============================================================================
  // PART 7: EXERCISE CATALOG
  // ============================================================================

  static JAZZ_EXERCISE_CATALOG = {
    '13.1.1': { stage: 13, substage: '13.1', name: 'Generic Major from Tonic', generator: 'generateGenericMajorFromTonic', generatorType: 'voicing', flashcardPrompt: 'Play the Generic Major voicing starting from the tonic in the given key.', whyItMatters: 'The 6/9 voicing is one of the most versatile major sounds.', memorizationTips: 'Root, then 4 perfect 4ths down. Same shape in every key.', source: 'Mantooth, Voicings for Jazz Keyboard, Ch.2' },
    '13.1.2': { stage: 13, substage: '13.1', name: 'Generic Major from 5th', generator: 'generateGenericMajorFrom5th', generatorType: 'voicing', flashcardPrompt: 'Play the Generic Major voicing starting from the 5th.', whyItMatters: 'Starting from the 5th produces a Maj9 sound with different melody possibilities.', memorizationTips: 'Same hand shape as from-tonic, just start a 5th higher.', source: 'Mantooth, Voicings for Jazz Keyboard, Ch.2' },
    '13.1.3': { stage: 13, substage: '13.1', name: 'Generic Minor', generator: 'generateGenericMinor', generatorType: 'voicing', flashcardPrompt: 'Play the Generic Minor voicing in the given key.', whyItMatters: 'One voicing shape covers min7, min9, and min11 contexts.', memorizationTips: 'Start on the minor 3rd, then all P4ths down.', source: 'Mantooth, Voicings for Jazz Keyboard, Ch.2' },
    '13.1.4': { stage: 13, substage: '13.1', name: 'Generic Dominant from Tonic', generator: 'generateGenericDomFromTonic', generatorType: 'voicing', flashcardPrompt: 'Play the Generic Dominant voicing (tonic start).', whyItMatters: 'The 3rd and 7th in the LH define the dominant sound; quartal RH adds color.', memorizationTips: 'RH: root + 2 P4ths down. LH: tritone (3 and b7).', source: 'Mantooth, Voicings for Jazz Keyboard, Ch.2' },
    '13.1.5': { stage: 13, substage: '13.1', name: 'Generic Dominant from 5th', generator: 'generateGenericDomFrom5th', generatorType: 'voicing', flashcardPrompt: 'Play the Generic Dominant voicing (5th start).', whyItMatters: 'Reversed tritone in LH provides variety and smoother voice leading.', memorizationTips: 'Same as tonic but shift RH up to 5th; swap 3 and 7 in LH.', source: 'Mantooth, Voicings for Jazz Keyboard, Ch.2' },
    '13.1.6': { stage: 13, substage: '13.1', name: 'Generic Voicing ii-V-I Workout', generator: 'generateGenericVoicingWorkout_iiVI', generatorType: 'voicing', flashcardPrompt: 'Play a ii-V-I using only generic voicings.', whyItMatters: 'Connects all three generic shapes in the most common jazz progression.', memorizationTips: 'ii=minor generic, V=dom generic, I=major generic.', source: 'Mantooth, Voicings for Jazz Keyboard, Ch.2' },
    '13.2.1': { stage: 13, substage: '13.2', name: 'Miracle Voicing I', generator: 'generateMiracleVoicingI', generatorType: 'voicing', flashcardPrompt: 'Play Miracle Voicing I for the given chord function.', whyItMatters: 'One shape, five functions -- major, minor, sus, and Lydian chords.', memorizationTips: 'From top: M3 down, then 3 P4ths. "1 third + 3 fourths."', source: 'Mantooth, Voicings for Jazz Keyboard, Ch.4' },
    '13.2.2': { stage: 13, substage: '13.2', name: 'Miracle Voicing II', generator: 'generateMiracleVoicingII', generatorType: 'voicing', flashcardPrompt: 'Play Miracle Voicing II for the given chord function.', whyItMatters: 'All-fourths voicing; identical to Generic Major from 5th, 5 functions.', memorizationTips: 'All P4ths from top -- the most symmetrical jazz voicing.', source: 'Mantooth, Voicings for Jazz Keyboard, Ch.4' },
    '13.2.3': { stage: 13, substage: '13.2', name: 'Miracle Voicing Workout', generator: 'generateMiracleVoicingWorkout', generatorType: 'voicing', flashcardPrompt: 'Play a ii-V-I using Miracle Voicings I and II.', whyItMatters: 'Tests your ability to assign functions to MV shapes in context.', memorizationTips: 'ii=MV.I minor, V=MV.II susDom, I=MV.I strongMajor.', source: 'Mantooth, Voicings for Jazz Keyboard, Ch.4' },
    '13.3.1': { stage: 13, substage: '13.3', name: 'Polychord Fraction', generator: 'generatePolychordFraction', generatorType: 'voicing', flashcardPrompt: 'Play the specified polychord fraction type for a dominant chord.', whyItMatters: 'Polychord fractions give instant access to every altered dominant color.', memorizationTips: 'LH = tritone indicators (3+b7). RH = major triad at specified interval.', source: 'Mantooth, Voicings for Jazz Keyboard, Ch.6-7' },
    '13.3.2': { stage: 13, substage: '13.3', name: 'ii-V7(b9)-I with Polychord', generator: 'generate251WithPolychord_b9', generatorType: 'voicing', flashcardPrompt: 'Play ii-V7(b9)-I using the bII polychord fraction.', whyItMatters: 'The b9 is the most common altered dominant sound in jazz.', memorizationTips: 'V chord: bII major triad over the tritone.', source: 'Mantooth, Voicings for Jazz Keyboard, Ch.6-7' },
    '13.3.3': { stage: 13, substage: '13.3', name: 'ii-V7(#9/#5)-I with Polychord', generator: 'generate251WithPolychord_sharp9sharp5', generatorType: 'voicing', flashcardPrompt: 'Play ii-V7(#9/#5)-I using the bVI polychord fraction.', whyItMatters: 'The #9/#5 sound is deeply associated with blues and funk jazz.', memorizationTips: 'V chord: bVI major triad over the tritone.', source: 'Mantooth, Voicings for Jazz Keyboard, Ch.6-7' },
    '13.3.4': { stage: 13, substage: '13.3', name: 'ii-V7(b9/b5)-I with Polychord', generator: 'generate251WithPolychord_b9b5', generatorType: 'voicing', flashcardPrompt: 'Play ii-V7(b9/b5)-I.', whyItMatters: 'Combines b9 and b5 for a maximally altered dominant approach.', memorizationTips: 'Like 7(b9) but with diminished 5th in the upper triad.', source: 'Mantooth, Voicings for Jazz Keyboard, Ch.6-7' },
    '13.3.5': { stage: 13, substage: '13.3', name: 'Polychord 12-Key Cycle', generator: 'generatePolychord12KeyCycle', generatorType: 'voicing', flashcardPrompt: 'Play the specified polychord fraction through all 12 keys.', whyItMatters: 'Fluency in all keys is essential.', memorizationTips: 'RH triad shape stays constant; only LH tritone moves chromatically.', source: 'Mantooth, Voicings for Jazz Keyboard, Ch.6-7' },
    '13.4.1': { stage: 13, substage: '13.4', name: '3-Note Guide Tone ii-V-I', generator: 'generateGuideTone3Note_251', generatorType: 'voicing', flashcardPrompt: 'Play 3-note guide-tone voicings through ii-V-I.', whyItMatters: 'Guide tones are the skeleton of jazz harmony.', memorizationTips: 'Cycle-5 voice leading: 3rd becomes 7th of the next chord.', source: 'Berklee Book of Jazz Harmony, Ch.11' },
    '13.4.2': { stage: 13, substage: '13.4', name: '4-Note Guide Tone ii-V-I', generator: 'generateGuideTone4Note_251', generatorType: 'voicing', flashcardPrompt: 'Play 4-note voicings (guide tones + tension) through ii-V-I.', whyItMatters: 'Adding one tension creates a richer, more modern sound.', memorizationTips: 'When 3 is on top, add 13. When 7 is on top, add 9.', source: 'Berklee Book of Jazz Harmony, Ch.11' },
    '13.4.3': { stage: 13, substage: '13.4', name: '4-Way Close ii-V-I', generator: 'generate4WayClose_251', generatorType: 'voicing', flashcardPrompt: 'Play 4-way close voicings through ii-V-I.', whyItMatters: 'The big-band sax-section sound.', memorizationTips: 'Stack all 4 chord tones within an octave, bass note separate below.', source: 'Berklee Book of Jazz Harmony, Ch.11' },
    '13.4.4': { stage: 13, substage: '13.4', name: '4-Way Close with Tension Subs', generator: 'generate4WayCloseTensionSub_251', generatorType: 'voicing', flashcardPrompt: 'Play 4-way close with tension substitutions (9 for 1, 13 for 5).', whyItMatters: 'Replacing root with 9 and 5th with 13 modernizes the voicing.', memorizationTips: '9 replaces root, 13 replaces 5th.', source: 'Berklee Book of Jazz Harmony, Ch.11' },
    '13.5.1': { stage: 13, substage: '13.5', name: 'Hybrid Voicing', generator: 'generateHybridVoicing', generatorType: 'voicing', flashcardPrompt: 'Play the hybrid voicing for the given chord.', whyItMatters: 'Hybrid voicings give a big, open sound used in modern jazz.', memorizationTips: 'Bass alone in LH. RH plays a simple triad on the 5th (Maj7) or b3 (min7).', source: 'Berklee Book of Jazz Harmony, Ch.11, pp.218-225' },
    '13.5.2': { stage: 13, substage: '13.5', name: 'Hybrid Progression I-vi-IV-V', generator: 'generateHybridProgression_1645', generatorType: 'voicing', flashcardPrompt: 'Play I-vi-IV-V with hybrid voicings.', whyItMatters: 'Classic progression tests hybrid voicing fluency.', memorizationTips: 'Each chord: LH = root, RH = triad based on chord type.', source: 'Berklee Book of Jazz Harmony, Ch.11, pp.218-225' },
    '13.6.1': { stage: 13, substage: '13.6', name: 'Polychord Voicing', generator: 'generatePolychordVoicing', generatorType: 'voicing', flashcardPrompt: 'Play the upper-structure polychord voicing.', whyItMatters: 'Upper-structure triads over chord tones create rich extended harmony.', memorizationTips: 'Lower = chord tones. Upper = triad from chord scale with tension.', source: 'Berklee Book of Jazz Harmony, Ch.11, pp.215-218' },
    '13.6.2': { stage: 13, substage: '13.6', name: 'Polychord iii-vi-ii-V-I', generator: 'generatePolychordProgression_36251', generatorType: 'voicing', flashcardPrompt: 'Play iii-vi-ii-V-I using polychord voicings.', whyItMatters: 'Extended turnaround demonstrates polychord voice leading.', memorizationTips: 'Each chord: LH = structural tones, RH = upper-structure triad.', source: 'Berklee Book of Jazz Harmony, Ch.11, pp.215-218' },
    '13.7.1': { stage: 13, substage: '13.7', name: 'Quartal Voicing', generator: 'generateQuartalVoicing', generatorType: 'voicing', flashcardPrompt: 'Play a quartal voicing for the given chord type.', whyItMatters: 'Stacked fourths are the modal jazz sound.', memorizationTips: 'Stack P4ths from 3rd (major/dom) or b7 (minor). Bass gives identity.', source: 'Berklee Book of Jazz Harmony, Ch.11, pp.226-229' },
    '13.7.2': { stage: 13, substage: '13.7', name: 'Quartal ii-V-I', generator: 'generateQuartalProgression_251', generatorType: 'voicing', flashcardPrompt: 'Play ii-V-I using quartal voicings.', whyItMatters: 'McCoy Tyner made this the signature sound of modal jazz.', memorizationTips: 'ii: stack from b7. V and I: stack from 3rd.', source: 'Berklee Book of Jazz Harmony, Ch.11, pp.226-229' },
    '15.1': { stage: 15, substage: '15.1', name: 'Constant Structure -- Maj7 Half Steps', generator: 'generateConstantStructure_Maj7_halfSteps', generatorType: 'voicing', flashcardPrompt: 'Play Maj7 chords ascending chromatically.', whyItMatters: 'Non-functional harmony: same quality moving by half step.', memorizationTips: 'Same Maj7 shape, slide up one half step each bar.', source: 'Berklee Book of Jazz Harmony, Ch.10' },
    '15.2': { stage: 15, substage: '15.2', name: 'Constant Structure -- Maj7 Minor 3rds', generator: 'generateConstantStructure_Maj7_minorThirds', generatorType: 'voicing', flashcardPrompt: 'Play Maj7 chords descending in minor 3rds.', whyItMatters: 'Minor-3rd motion connects to diminished-scale symmetry.', memorizationTips: 'Down 3 semitones each time; cycles through 4 chords.', source: 'Berklee Book of Jazz Harmony, Ch.10' },
    '15.3': { stage: 15, substage: '15.3', name: 'Constant Structure -- min7 Chromatic', generator: 'generateConstantStructure_Min7_chromatic', generatorType: 'voicing', flashcardPrompt: 'Approach a diatonic min7 target chromatically.', whyItMatters: 'Chromatic approach creates strong forward motion.', memorizationTips: 'Same min7 shape sliding up by half steps.', source: 'Berklee Book of Jazz Harmony, Ch.10' },
    '15.4': { stage: 15, substage: '15.4', name: 'Constant Structure -- Pattern', generator: 'generateConstantStructure_pattern', generatorType: 'voicing', flashcardPrompt: 'Play the desc-m3 / asc-m2 constant structure pattern.', whyItMatters: 'Zigzag pattern creates a controlled sophisticated descent.', memorizationTips: 'Down 3, up 1, down 3, up 1 -- net descent of 2 per pair.', source: 'Berklee Book of Jazz Harmony, Ch.10' },
    '15.5': { stage: 15, substage: '15.5', name: 'Coltrane Cycle', generator: 'generateColtraneCyclePattern', generatorType: 'voicing', flashcardPrompt: 'Play Coltrane changes: major 3rd cycle with dominant approaches.', whyItMatters: 'Coltrane cycle divides the octave into 3 equal tonal centers.', memorizationTips: 'Three key centers a major 3rd apart, each approached by its V7.', source: 'Berklee Book of Jazz Harmony, Ch.10' },
    '6A.1': { stage: '6A', substage: '6A', name: 'Major Scale Mode', generator: 'generateMajorScaleMode', generatorType: 'scale', flashcardPrompt: 'Play the specified mode ascending and descending.', whyItMatters: 'Every jazz improviser must hear and play all 7 modes fluently.', memorizationTips: 'Learn the parent key: every mode is the major scale starting on a different degree.', source: 'Levine, The Jazz Theory Book' },
    '6A.2': { stage: '6A', substage: '6A', name: 'All Modes from One Key', generator: 'generateAllModesFromKey', generatorType: 'scale', flashcardPrompt: 'Play all 7 modes derived from a single major key.', whyItMatters: 'Hearing all modes from one parent reinforces chord-scale relationships.', memorizationTips: 'Same 7 notes, 7 different starting points.', source: 'Levine, The Jazz Theory Book' },
    '6A.3': { stage: '6A', substage: '6A', name: 'Melodic Minor Mode', generator: 'generateMelodicMinorMode', generatorType: 'scale', flashcardPrompt: 'Play the specified mode of the melodic minor scale.', whyItMatters: 'Melodic minor modes cover altered dominants, Lydian dominant, and half-dim sounds.', memorizationTips: 'Major scale with a flatted 3rd.', source: 'Levine, The Jazz Theory Book' },
    '6A.4': { stage: '6A', substage: '6A', name: 'All Melodic Minor Modes', generator: 'generateAllMelodicMinorModes', generatorType: 'scale', flashcardPrompt: 'Play all 7 modes from one melodic minor parent key.', whyItMatters: 'The altered scale (mode VII) is the most important for dominant resolution.', memorizationTips: 'Same 7 notes, 7 starting points.', source: 'Levine, The Jazz Theory Book' },
    '6A.5': { stage: '6A', substage: '6A', name: 'Diminished Scale (H-W)', generator: 'generateDiminishedScale_halfWhole', generatorType: 'scale', flashcardPrompt: 'Play the half-whole diminished scale.', whyItMatters: 'Used over V7(b9) -- provides b9, #9, #11, and 13.', memorizationTips: 'Alternating H-W steps. Only 3 unique diminished scales exist.', source: 'Levine, The Jazz Theory Book' },
    '6A.6': { stage: '6A', substage: '6A', name: 'Diminished Scale (W-H)', generator: 'generateDiminishedScale_wholeHalf', generatorType: 'scale', flashcardPrompt: 'Play the whole-half diminished scale.', whyItMatters: 'Used over dim7 chords.', memorizationTips: 'Start with a whole step. Same scale, different starting point.', source: 'Levine, The Jazz Theory Book' },
    '6A.7': { stage: '6A', substage: '6A', name: 'Diminished Lick', generator: 'generateDiminishedLick_minor3rdPattern', generatorType: 'melody', flashcardPrompt: 'Play a 4-note diminished motif repeating down in minor 3rds.', whyItMatters: 'Exploits diminished-scale symmetry.', memorizationTips: 'One 4-note shape moved down 3 semitones.', source: 'Levine, The Jazz Theory Book' },
    '6A.8': { stage: '6A', substage: '6A', name: 'Whole-Tone Scale', generator: 'generateWholeToneScale', generatorType: 'scale', flashcardPrompt: 'Play the whole-tone scale.', whyItMatters: 'Goes with dominant 7th #5 chords. Only 2 unique whole-tone scales exist.', memorizationTips: 'All whole steps.', source: 'Levine, The Jazz Theory Book' },
    'V1.3': { stage: 'V1', substage: 'V1.3', name: 'Scat Syllable Warm-Up', generator: 'generateScatSyllableWarmup', generatorType: 'melody', flashcardPrompt: 'Sing straight 8ths on one pitch using ba, da, la, na. Ascend by half step.', whyItMatters: 'Builds vocal agility and syllable clarity.', memorizationTips: 'One pitch per bar, up a half step.', source: 'Stoloff, Scat!, p.26' },
    'V1.4': { stage: 'V1', substage: 'V1.4', name: 'Rhythm Etudes 1-4', generator: null, generatorType: 'rhythm_only', flashcardPrompt: 'Practice rhythm etudes with syllables from the book.', whyItMatters: 'Rhythmic precision is the foundation of scat singing.', memorizationTips: 'Tap the rhythm, then add syllables.', source: 'Stoloff, Scat!, pp.16-24' },
    'V2.1a': { stage: 'V2', substage: 'V2.1', name: 'Diatonic Pattern -- Ascending', generator: 'generateDiatonicPattern_ascending', generatorType: 'melody', flashcardPrompt: 'Sing ascending diatonic scale pattern.', whyItMatters: 'Simple stepwise motion is the foundation of melodic improv.', memorizationTips: 'Scale degrees 1-2-3-4-5-6-7-8.', source: 'Stoloff, Scat!, pp.28-36' },
    'V2.1b': { stage: 'V2', substage: 'V2.1', name: 'Diatonic Pattern -- Descending', generator: 'generateDiatonicPattern_descending', generatorType: 'melody', flashcardPrompt: 'Sing descending diatonic scale pattern.', whyItMatters: 'Descending lines resolve melodic tension.', memorizationTips: 'Reverse the ascending pattern.', source: 'Stoloff, Scat!, pp.28-36' },
    'V2.1c': { stage: 'V2', substage: 'V2.1', name: 'Diatonic Pattern -- Jazz Waltz', generator: 'generateDiatonicPattern_jazzWaltz', generatorType: 'melody', flashcardPrompt: 'Sing diatonic 7th-chord arpeggios in 3/4.', whyItMatters: 'Arpeggios outline harmony; 3/4 develops metric flexibility.', memorizationTips: 'Root-3rd-5th on each diatonic degree.', source: 'Stoloff, Scat!, pp.28-36' },
    'V2.2a': { stage: 'V2', substage: 'V2.2', name: 'ii-V Modal Pattern (1-Measure)', generator: 'generate_iiV_modalPattern_oneMeasure', generatorType: 'melody', flashcardPrompt: 'Sing a 1-measure ii-V pattern.', whyItMatters: 'The ii-V is the most common harmonic motion in jazz.', memorizationTips: 'ii = Dorian ascending. V = Mixolydian descending.', source: 'Stoloff, Scat!, pp.37-41' },
    'V2.2b': { stage: 'V2', substage: 'V2.2', name: 'ii-V Modal Pattern (2-Measure)', generator: 'generate_iiV_modalPattern_twoMeasure', generatorType: 'melody', flashcardPrompt: 'Sing a 2-measure ii-V pattern.', whyItMatters: 'Longer phrases develop melodic continuity.', memorizationTips: '2 bars of ii, 2 bars of V.', source: 'Stoloff, Scat!, pp.37-41' },
    'V2.3': { stage: 'V2', substage: 'V2.3', name: 'Melodic Embellishment -- Triplet', generator: 'generateMelodicEmbellishment_triplet', generatorType: 'melody', flashcardPrompt: 'Sing triplet embellishment on ii resolving to V.', whyItMatters: 'Triplet figures add rhythmic variety.', memorizationTips: 'Du-ee-a on beat 1, then smooth quarter notes.', source: 'Stoloff, Scat!, pp.42-45' },
    'V2.4': { stage: 'V2', substage: 'V2.4', name: 'Extended ii-V Arpeggio', generator: 'generateExtended_iiV_arpeggio', generatorType: 'melody', flashcardPrompt: 'Sing arpeggios through ii-V cycle of 5ths.', whyItMatters: 'Arpeggio fluency through changing keys is essential.', memorizationTips: 'Root-b3-5-b7 for ii, Root-3-5-b7 for V. Descend by 5ths.', source: 'Stoloff, Scat!, p.48' },
    'V2.6a': { stage: 'V2', substage: 'V2.6', name: 'Chord Scale -- Vocal Major', generator: 'generateChordScale_vocal_major', generatorType: 'scale', flashcardPrompt: 'Sing the Ionian scale ascending and descending.', whyItMatters: 'The major scale is the reference for all other scales.', memorizationTips: 'Do-Re-Mi-Fa-Sol-La-Ti-Do.', source: 'Stoloff, Scat!, pp.54-77' },
    'V2.6b': { stage: 'V2', substage: 'V2.6', name: 'Chord Scale -- Vocal Dorian', generator: 'generateChordScale_vocal_dorian', generatorType: 'scale', flashcardPrompt: 'Sing the Dorian scale for min7 chords.', whyItMatters: 'Dorian is the default minor scale in jazz.', memorizationTips: 'Major scale with b3 and b7.', source: 'Stoloff, Scat!, pp.54-77' },
    'V2.6c': { stage: 'V2', substage: 'V2.6', name: 'Chord Scale -- Vocal Mixolydian', generator: 'generateChordScale_vocal_mixolydian', generatorType: 'scale', flashcardPrompt: 'Sing the Mixolydian scale for dom7 chords.', whyItMatters: 'Mixolydian is the default dominant scale.', memorizationTips: 'Major scale with b7.', source: 'Stoloff, Scat!, pp.54-77' },
    'V2.6d': { stage: 'V2', substage: 'V2.6', name: 'Chord Scale -- Vocal Altered', generator: 'generateChordScale_vocal_altered', generatorType: 'scale', flashcardPrompt: 'Sing the altered dominant scale.', whyItMatters: 'Contains every alteration (b9, #9, #11, b13).', memorizationTips: 'Melodic minor a half step above the dominant root.', source: 'Stoloff, Scat!, pp.54-77' },
    'V3.5a': { stage: 'V3', substage: 'V3.5', name: 'Vocal Bass -- Roots & 5ths', generator: 'generateVocalBassLine_roots5ths', generatorType: 'bass_line', flashcardPrompt: 'Sing bass: roots and 5ths through cycle of 5ths.', whyItMatters: 'The syllable doon sounds most authentic on the quarter note.', memorizationTips: 'Root, 5th, Root, 5th. Move down a 5th.', source: 'Stoloff, Scat!, pp.90-102' },
    'V3.5b': { stage: 'V3', substage: 'V3.5', name: 'Vocal Bass -- Roots, 5ths & 7ths', generator: 'generateVocalBassLine_roots5ths7ths', generatorType: 'bass_line', flashcardPrompt: 'Sing bass: roots, 5ths, 7ths through cycle of 5ths.', whyItMatters: 'Adding the 7th creates stronger harmonic motion.', memorizationTips: 'Root, 5th, b7, 5th.', source: 'Stoloff, Scat!, pp.90-102' },
    'V3.5c': { stage: 'V3', substage: 'V3.5', name: 'Vocal Bass -- Roots, 3rds & 7ths', generator: 'generateVocalBassLine_roots3rds7ths', generatorType: 'bass_line', flashcardPrompt: 'Sing bass: roots, 3rds, 7ths through cycle of 5ths.', whyItMatters: 'Root, 3rd, and 7th are the essential chord tones.', memorizationTips: 'Root, 3rd, b7, Root.', source: 'Stoloff, Scat!, pp.90-102' },
    'V3.5d': { stage: 'V3', substage: 'V3.5', name: 'Vocal Walking Bass', generator: 'generateVocalBassLine_walking', generatorType: 'bass_line', flashcardPrompt: 'Sing a walking bass with chromatic approaches.', whyItMatters: 'Walking bass develops harmonic hearing and time feel.', memorizationTips: 'Root, 3rd, 5th, chromatic approach to next root.', source: 'Stoloff, Scat!, pp.90-102' },
    'V4.1a': { stage: 'V4', substage: 'V4.1', name: 'Diatonic Line -- Ascending', generator: 'generateDiatonicLine_ascending', generatorType: 'melody', flashcardPrompt: 'Sing a simple ascending diatonic line.', whyItMatters: 'The simplest melodic material is the basis for improvisation.', memorizationTips: 'Quarter notes ascending through the scale.', source: 'Weir, Fearless Vocal Improvisation' },
    'V4.1b': { stage: 'V4', substage: 'V4.1', name: 'Diatonic Line -- Descending', generator: 'generateDiatonicLine_descending', generatorType: 'melody', flashcardPrompt: 'Sing a simple descending diatonic line.', whyItMatters: 'Descending lines are more common in jazz improv.', memorizationTips: 'Reverse the ascending line.', source: 'Weir, Fearless Vocal Improvisation' },
    'V4.1c': { stage: 'V4', substage: 'V4.1', name: 'Diatonic Line -- Wave', generator: 'generateDiatonicLine_wave', generatorType: 'melody', flashcardPrompt: 'Sing a wave-pattern diatonic line.', whyItMatters: 'Wave pattern creates more interesting contour.', memorizationTips: 'Up a 3rd, down a 2nd, zigzag ascent.', source: 'Weir, Fearless Vocal Improvisation' },
    'V4.2a': { stage: 'V4', substage: 'V4.2', name: 'Bebop -- Chromatic Passing', generator: 'generateBebopLick_chromaticPassing', generatorType: 'melody', flashcardPrompt: 'Sing a bebop lick with chromatic passing tones.', whyItMatters: 'Chromatic passing notes leading to chord tones = bebop essence.', memorizationTips: 'Target a chord tone, approach by half step from below.', source: 'Weir, Fearless Vocal Improvisation' },
    'V4.2b': { stage: 'V4', substage: 'V4.2', name: 'Bebop -- Enclosure', generator: 'generateBebopLick_enclosure', generatorType: 'melody', flashcardPrompt: 'Sing a bebop enclosure around a goal note.', whyItMatters: 'Approach notes surrounding a chord tone = fundamental bebop device.', memorizationTips: 'Above-below-target. Practice on every chord tone.', source: 'Weir, Fearless Vocal Improvisation' },
    'V4.2c': { stage: 'V4', substage: 'V4.2', name: 'Bebop -- ii-V Lick', generator: 'generateBebopLick_iiV', generatorType: 'melody', flashcardPrompt: 'Sing a bebop lick over ii-V.', whyItMatters: 'Connects Dorian and Mixolydian with bebop chromaticism.', memorizationTips: 'ii: Dorian with chromatic passing. V: Mixolydian resolving to I.', source: 'Weir, Fearless Vocal Improvisation' },
    'V4.3a': { stage: 'V4', substage: 'V4.3', name: 'Hearing Changes -- Roots', generator: 'generateHearingChanges_roots', generatorType: 'melody', flashcardPrompt: 'Sing the root of each chord through I-vi-ii-V.', whyItMatters: 'Hearing shifting key centers is one of the biggest challenges.', memorizationTips: 'One note per chord. Simple but powerful ear training.', source: 'Weir, Fearless Vocal Improvisation' },
    'V4.3b': { stage: 'V4', substage: 'V4.3', name: 'Hearing Changes -- Arpeggios', generator: 'generateHearingChanges_arpeggios', generatorType: 'melody', flashcardPrompt: 'Sing arpeggios through I-vi-ii-V.', whyItMatters: 'Singing arpeggios trains internal hearing of chord quality.', memorizationTips: 'Root-3-5-7 for each chord.', source: 'Weir, Fearless Vocal Improvisation' },
    'V4.3c': { stage: 'V4', substage: 'V4.3', name: 'Hearing Changes -- Guide Tones', generator: 'generateHearingChanges_guideTones', generatorType: 'melody', flashcardPrompt: 'Sing guide tones (3rds and 7ths) through I-vi-ii-V.', whyItMatters: 'Guide tones are the minimal information to define harmony.', memorizationTips: 'Just 2 notes per chord: 3rd and 7th.', source: 'Weir, Fearless Vocal Improvisation' }
  };

} // end class JazzExerciseGenerator


// ============================================================================
// PART 8: COMPLETION TRACKER
// ============================================================================
//
// ### COMPLETED (with generators):
//
// Stage 13.1 (Mantooth Ch.2): Generic Major from Tonic, Generic Major from 5th,
//   Generic Minor, Generic Dominant from Tonic, Generic Dominant from 5th,
//   Generic Voicing ii-V-I Workout
//
// Stage 13.2 (Mantooth Ch.4): Miracle Voicing I (5 functions), Miracle Voicing II
//   (5 functions), Miracle Voicing Workout
//
// Stage 13.3 (Mantooth Ch.6-7): Polychord Fraction (6 types), ii-V7(b9)-I,
//   ii-V7(#9/#5)-I, ii-V7(b9/b5)-I, Polychord 12-Key Cycle
//
// Stage 13.4 (Berklee Ch.11): 3-Note Guide Tones ii-V-I, 4-Note Guide Tones
//   ii-V-I, 4-Way Close ii-V-I, 4-Way Close with Tension Subs
//
// Stage 13.5 (Berklee Ch.11 pp.218-225): Hybrid Voicing (4 chord types),
//   Hybrid Progression I-vi-IV-V
//
// Stage 13.6 (Berklee Ch.11 pp.215-218): Polychord Voicing (3 types),
//   Polychord Progression iii-vi-ii-V-I
//
// Stage 13.7 (Berklee Ch.11 pp.226-229): Quartal Voicing (3 types),
//   Quartal Progression ii-V-I
//
// Stage 15 (Berklee Ch.10): Constant Structure Maj7 Half Steps,
//   Constant Structure Maj7 Minor 3rds, Constant Structure min7 Chromatic
//   Approach, Constant Structure Pattern (desc m3 / asc m2), Coltrane Cycle
//   (Major 3rd Cycle)
//
// Stage 6A (Levine): All 7 Major Scale Modes, All Modes from One Key,
//   All 7 Melodic Minor Modes, All Melodic Minor Modes from One Key,
//   Diminished Scale Half-Whole, Diminished Scale Whole-Half,
//   Diminished Lick Minor 3rd Pattern, Whole-Tone Scale
//
// V1.3 (Stoloff p.26): Scat Syllable Warm-Up
//
// V2.1 (Stoloff pp.28-36): Diatonic Pattern Ascending, Descending, Jazz Waltz
//
// V2.2 (Stoloff pp.37-41): ii-V Modal Pattern 1-Measure, 2-Measure
//
// V2.3 (Stoloff pp.42-45): Melodic Embellishment Triplet
//
// V2.4 (Stoloff p.48): Extended ii-V Arpeggio (Cycle of 5ths)
//
// V2.6 (Stoloff pp.54-77): Chord Scales -- Major (Ionian), Dorian,
//   Mixolydian, Altered
//
// V3.5 (Stoloff pp.90-102): Vocal Bass Lines -- Roots & 5ths, Roots/5ths/7ths,
//   Roots/3rds/7ths, Walking Bass
//
// V4.1 (Weir): Diatonic Lines -- Ascending, Descending, Wave
//
// V4.2 (Weir): Bebop Licks -- Chromatic Passing, Enclosure, ii-V
//
// V4.3 (Weir): Hearing Changes -- Roots, Arpeggios, Guide Tones
//
// ---------------------------------------------------------------------------
//
// ### RHYTHM-ONLY / NON-MXL (no generator possible):
//
// V0:   Vocal technique (Peckham) -- physical exercises, checklist only
// V1.4: Rhythm Etudes 1-4 (Stoloff pp.16-24) -- non-pitched rhythmic syllable
//        exercises
// V1.5: Blues Artists Study -- listening/analysis only
// V3.1-V3.4: Transcribed scat solos (Stoloff) -- exact note-for-note
//             transcription needed from the book
// V3.6: Solo a cappella technique -- complex multi-voice, needs manual
//        transcription
// V4.4: Vocal drum articulations -- percussion syllables, not pitched
// V4.5: Sing-along patterns -- accompaniment tracks, not single-voice
// V4.6: Transcription projects -- listening/analysis only
// V5:   Performance & Repertoire -- non-exercise content
//
// ---------------------------------------------------------------------------
//
// ### PENDING (need Siskind Books 1 & 3 -- NOT attached):
//
// Stages 0-2: Intervals, chord construction, ii-V-I root position
//              (Siskind Book 1)
// Stage 3:    Type A/B voicings (Book 1 Unit 6) -- FORMULAS ALREADY IN
//              JAZZ PRACTICE STUDIO DOC, generators exist in prior version
// Stage 4:    One-handed shells (Book 1 Unit 8) -- same, formulas known
// Stage 5:    Blues form (Book 1 Units 7-9) -- same
// Stage 6:    Licks 1-10 -- EXACT NOTE SEQUENCES NEEDED from book pages
// Stage 6B:   Jazz forms -- analysis exercises, mostly non-MXL
// Stage 6C:   Chord extensions -- formulaic, generators possible from
//              known intervals
// Stage 7:    Altered dominants -- formulas known from practice studio doc
// Stages 8-12: Modal jazz, reharmonization, modal interchange, modal blues,
//              odd time (Siskind Book 3)
// Stage 14:   Advanced improvisation techniques (Berklee PSIJ courses --
//              no single textbook)
// Stage 16:   Professional improvisation (Berklee PSIJ 5-6 --
//              transcription-based)
//
// NOTE: Stages 0-5, 7, 6C already have generator functions defined in the
//       original Jazz Practice Studio document. Those should be merged from
//       the existing JazzExerciseGenerator code.
//
// ============================================================================
