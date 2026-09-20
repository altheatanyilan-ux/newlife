/* ============================================================
   THE JAZZ ENGRAVER — a pattern, and every key it can live in.

   A jazz exercise is not a piece. "Major seventh chord" is one shape that
   exists twelve times, and storing twelve files of it would be storing the
   same idea twelve times and having to correct it twelve times. So an
   exercise here is a pattern — a list of chords said in scale degrees — and
   the notation is written out of it whenever a key is asked for.

   THE PART WORTH GETTING RIGHT IS THE SPELLING. The obvious way to turn a
   pitch into a note is a table from the twelve pitch classes to twelve
   names, and every table like that is wrong somewhere: it writes the third
   of an E major seventh as A flat, which is a note no musician reading in E
   wants to see. What decides a note's name is not its pitch, it is which
   degree of the chord it is. So a chord is described as degrees — a third is
   two letters up whatever it sounds like — and the accidental is whatever
   makes that letter come out at the right pitch. G sharp, then, because the
   third of an E chord is a kind of G.

   Everything below is in service of that one idea.
   ============================================================ */

/* The twelve keys a jazz exercise is asked for, spelled the way a jazz
   musician spells them: six flat keys, five sharps' worth of naturals, and
   G flat rather than F sharp because that is what the books print.
   [name, letter 0-6 from C, alteration, fifths for the key signature] */
const JAZZ_KEYS = [
  ['C',  0,  0,  0], ['Db', 1, -1, -5], ['D',  1,  0,  2], ['Eb', 2, -1, -3],
  ['E',  2,  0,  4], ['F',  3,  0, -1], ['Gb', 4, -1, -6], ['G',  4,  0,  1],
  ['Ab', 5, -1, -4], ['A',  5,  0,  3], ['Bb', 6, -1, -2], ['B',  6,  0,  5]];
const JAZZ_KEY_NAMES = JAZZ_KEYS.map(k => k[0]);
const jazzKey = name => JAZZ_KEYS.find(k => k[0] === name) || JAZZ_KEYS[0];
/* what each letter sounds like on its own, which is the whole of the
   arithmetic below: everything else is an accidental away from one of these */
const JAZZ_NATURAL = [0, 2, 4, 5, 7, 9, 11];
const JAZZ_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const jazzPretty = n => String(n || '').replace(/b$/, '♭').replace(/#$/, '♯');

/* ---------- a note, named by which degree it is ----------
   A note here is three things: a letter, an accidental and the octave the
   letter is written in. Given a root and a degree — so many letters up, so
   many semitones up — all three follow exactly, with no table and no choice
   to get wrong.

   The letter is the root's letter plus the steps, wrapping every seven and
   carrying an octave when it wraps. The sound is the root's pitch plus the
   semitones. The accidental is simply the gap between the two, which is why
   this spells rather than guesses: the third of an E chord is a kind of G
   because a third is two letters up, and it is G sharp because that is what
   makes a G sound four semitones above E.

   Nothing needs folding into a range. A C flat comes out as a C with one
   flat in octave four, which is the note as a reader wants to see it, and it
   sounds a semitone below — which is exactly right and which no amount of
   normalising the accidental would have got. */
const jazzMidiOf = n => (n.octave + 1) * 12 + JAZZ_NATURAL[n.letter] + n.alter;
function jazzStep(root, steps, semis){
  /* steps can be negative — a Type B voicing puts the seventh a letter
     BELOW the root and an octave down — and JavaScript's remainder of a
     negative number is negative, which would ask for letter minus one. */
  const letter = (((root.letter + steps) % 7) + 7) % 7;
  const octave = root.octave + Math.floor((root.letter + steps) / 7);
  const midi = jazzMidiOf(root) + semis;
  /* what that letter sounds like with no accidental, in that octave */
  const plain = (octave + 1) * 12 + JAZZ_NATURAL[letter];
  return {letter, alter: midi - plain, octave, midi,
    step: JAZZ_LETTERS[letter],
    name: JAZZ_LETTERS[letter] + (midi - plain === -1 ? 'b' : midi - plain === 1 ? '#'
      : midi - plain === 0 ? '' : String(midi - plain))};
}

/* ---------- chords, as degrees rather than pitches ----------
   [steps up the letters, semitones up the sound]. A minor seventh is a
   seventh, so six letters up and ten semitones — which is why an A flat
   minor seventh gets a G flat on top and not an F sharp. */
const JAZZ_CHORDS = {
  maj7:   {say: 'maj7',  kind: 'major-seventh',          tones: [[0,0],[2,4],[4,7],[6,11]]},
  dom7:   {say: '7',     kind: 'dominant',               tones: [[0,0],[2,4],[4,7],[6,10]]},
  min7:   {say: 'm7',    kind: 'minor-seventh',          tones: [[0,0],[2,3],[4,7],[6,10]]},
  min7b5: {say: 'm7♭5', kind: 'half-diminished',    tones: [[0,0],[2,3],[4,6],[6,10]]},
  dim7:   {say: '°7', kind: 'diminished-seventh',   tones: [[0,0],[2,3],[4,6],[5,9]]},
  dom7b9: {say: '7♭9', kind: 'dominant',            tones: [[0,0],[2,4],[4,7],[6,10],[8,13]]},
};
/* the two-note guide tones, and the four-note voicings built on them. A
   Type A voicing is third on the bottom; a Type B is the seventh. The point
   of alternating them is that one pair holds while the other steps down. */
const JAZZ_VOICINGS = {
  shell:  {maj7: [[2,4],[6,11]], dom7: [[2,4],[6,10]], min7: [[2,3],[6,10]], min7b5: [[2,3],[6,10]]},
  typeA:  {maj7: [[2,4],[6,11],[8,14],[11,19]], dom7: [[2,4],[6,10],[8,14],[11,19]],
           min7: [[2,3],[6,10],[8,14],[11,19]], min7b5: [[2,3],[6,10],[8,14],[11,18]]},
  /* the seventh is written a letter below the root and an octave down, which
     is what -1 means here — saying it as "six letters up, two semitones
     down" asks for a B with a dozen flats on it */
  typeB:  {maj7: [[-1,-1],[2,4],[4,7],[8,14]], dom7: [[-1,-2],[2,4],[4,7],[8,14]],
           min7: [[-1,-2],[2,3],[4,7],[8,14]], min7b5: [[-1,-2],[2,3],[4,6],[8,14]]},
  /* three notes, one hand, so the other hand is free for a bassline */
  oneA:   {maj7: [[2,4],[6,11],[8,14]], dom7: [[2,4],[6,10],[8,14]],
           min7: [[2,3],[6,10],[8,14]], min7b5: [[2,3],[6,10],[8,14]]},
  oneB:   {maj7: [[-1,-1],[2,4],[4,7]], dom7: [[-1,-2],[2,4],[4,7]],
           min7: [[-1,-2],[2,3],[4,7]], min7b5: [[-1,-2],[2,3],[4,6]]},
  /* fourths stacked rather than thirds — a spacing rather than a chord
     quality. It is here rather than beside the exercise that wants it
     because this file is concatenated after the catalogue, and a catalogue
     that reached back into this table would be reading a const before it
     had been declared. That is a whole app that does not boot, for one
     modal voicing. */
  quartal:{min7: [[0,0],[3,5],[6,10],[9,15]], maj7: [[0,0],[3,5],[6,11],[9,16]],
           dom7: [[0,0],[3,5],[6,10],[9,14]], min7b5: [[0,0],[3,5],[6,10],[9,15]]},
};

/* A chord's root, as a degree of the key. ii is one letter and two semitones
   up from the tonic; V is four letters and seven. */
const JAZZ_DEGREES = {
  I:   [0, 0],  bII: [0, 1],  ii:  [1, 2],  iii: [2, 4],
  IV:  [3, 5],  V:   [4, 7],  vi:  [5, 9],  vii: [6, 11],
};

/* the root of a degree of a key, which is the same arithmetic with the key's
   own tonic as the root */
function jazzRootOf(keyName, degree, octave){
  const k = jazzKey(keyName);
  const [steps, semis] = JAZZ_DEGREES[degree] || [0, 0];
  return jazzStep({letter: k[1], alter: k[2], octave}, steps, semis);
}
const jazzChordNote = (root, [steps, semis]) => jazzStep(root, steps, semis);

/* ---------- from a chord to a bar of notation ---------- */
const jazzXmlPitch = n => `<pitch><step>${n.step}</step>${
  n.alter ? `<alter>${n.alter}</alter>` : ''}<octave>${n.octave}</octave></pitch>`;
/* A note of a chord after the first carries <chord/>, which is MusicXML for
   "at the same time as the one before". Staff is written whenever there are
   two, because a grand staff with no staff numbers puts everything on the
   treble and a two-handed voicing becomes unreadable. */
function jazzXmlNote(n, {first, dur, type, staff, voice}){
  return `<note>${first ? '' : '<chord/>'}${jazzXmlPitch(n)}<duration>${dur}</duration>` +
    `<voice>${voice}</voice><type>${type}</type>${staff ? `<staff>${staff}</staff>` : ''}</note>`;
}
const jazzXmlHarmony = (root, kind) => `<harmony><root><root-step>${root.step || root.name[0]}</root-step>${
  root.alter ? `<root-alter>${root.alter}</root-alter>` : ''}</root><kind>${kind}</kind></harmony>`;

/* One bar. `notes` are already sorted low to high; on a grand staff anything
   below middle C goes to the left hand, which is where a pianist's left hand
   in fact is for all of this material. */
function jazzXmlBar(n, notes, {hands, harmony, dur, type}){
  const low = notes.filter(v => v.midi < 60), high = notes.filter(v => v.midi >= 60);
  const head = n === 1 ? '' : '';
  if(hands < 2 || !low.length || !high.length){
    const on = hands < 2 ? null : (low.length ? 2 : 1);
    return `<measure number="${n}">${head}${harmony || ''}${
      notes.map((v, i) => jazzXmlNote(v, {first: !i, dur, type, staff: on, voice: 1})).join('')}</measure>`;
  }
  return `<measure number="${n}">${head}${harmony || ''}${
    high.map((v, i) => jazzXmlNote(v, {first: !i, dur, type, staff: 1, voice: 1})).join('')}` +
    `<backup><duration>${dur}</duration></backup>` +
    low.map((v, i) => jazzXmlNote(v, {first: !i, dur, type, staff: 2, voice: 2})).join('') +
    `</measure>`;
}
function jazzXmlHead(keyName, {hands, beats}){
  const k = jazzKey(keyName);
  return `<attributes><divisions>4</divisions><key><fifths>${k[3]}</fifths><mode>major</mode></key>` +
    `<time><beats>${beats}</beats><beat-type>4</beat-type></time>${hands > 1
      ? `<staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef>` +
        `<clef number="2"><sign>F</sign><line>4</line></clef>`
      : `<clef><sign>G</sign><line>2</line></clef>`}</attributes>`;
}
const jazzXmlDoc = (title, bars) => `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <work><work-title>${esc(title)}</work-title></work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">${bars}</part>
</score-partwise>`;

/* ---------- the patterns themselves ----------
   A pattern says which chords, on which degrees, voiced how. Everything the
   catalogue needs is one of these; nothing in it mentions a pitch. */
function jazzVoiceChord(root, quality, voicing){
  const shape = voicing === 'root' ? JAZZ_CHORDS[quality].tones
    : (JAZZ_VOICINGS[voicing] && JAZZ_VOICINGS[voicing][quality]) || JAZZ_CHORDS[quality].tones;
  return shape.map(t => jazzChordNote(root, t)).sort((a, b) => a.midi - b.midi);
}
/* the score for one pattern in one key, as MusicXML */
function jazzScoreXml(pattern, keyName){
  const p = pattern || {};
  const octave = p.octave == null ? 3 : p.octave;
  const hands = p.hands || 1;
  const beats = p.beats || 4;
  const bars = (p.bars || []).map((bar, i) => {
    const root = jazzRootOf(keyName, bar.on || 'I', octave + (bar.up || 0));
    const notes = jazzVoiceChord(root, bar.chord, bar.voicing || p.voicing || 'root');
    const kind = (JAZZ_CHORDS[bar.chord] || JAZZ_CHORDS.maj7).kind;
    const say = p.symbols === false ? '' : jazzXmlHarmony(
      {step: JAZZ_LETTERS[root.letter], alter: root.alter}, kind);
    const body = jazzXmlBar(i + 1, notes, {hands, harmony: say, dur: 16, type: 'whole'});
    return i === 0 ? body.replace('>', '>' + jazzXmlHead(keyName, {hands, beats})) : body;
  });
  /* a run of single notes — a scale — rather than a stack of them */
  if(p.line) return jazzLineXml(p, keyName);
  return jazzXmlDoc(jazzPatternTitle(p, keyName), bars.join(''));
}
/* a scale, written as one note after another rather than a chord */
function jazzLineXml(p, keyName){
  const root = jazzRootOf(keyName, 'I', p.octave == null ? 4 : p.octave);
  const notes = p.line.map(t => jazzChordNote(root, t));
  const beats = p.line.length;
  const body = `<measure number="1">${jazzXmlHead(keyName, {hands: 1, beats})}${
    notes.map(n => `<note>${jazzXmlPitch(n)}<duration>4</duration><voice>1</voice><type>quarter</type></note>`).join('')}</measure>`;
  return jazzXmlDoc(jazzPatternTitle(p, keyName), body);
}
const jazzPatternTitle = (p, keyName) => `${p.title || 'Exercise'} — ${jazzPretty(keyName)}`;
