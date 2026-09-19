/* ============================================================
   TRANSPOSITION.

   Shifting the whole score up or down, at the moment it is drawn. The file
   is never touched: everything you have written on the score — the sections,
   the pins, the fingerings — is anchored to bar numbers rather than to
   pitches, so it all survives a piece being moved into another key, which is
   the whole reason this is worth having.

   It is done by rewriting the notation in memory rather than asking the
   engraver to do it, because a rewritten file is a file the chord reading,
   the note names and the scale degrees all see — transpose into E flat and
   the letters, the degrees and the chord symbols move with it, because they
   are all reading the same notes.

   The part the specification waves at is the key signature. Its own note says
   the arithmetic is a simplification, and it is: it divides by twelve where it
   should multiply. Moving up a semitone is seven steps clockwise round the
   circle of fifths, not half a step, and the difference is the difference
   between D flat major and a key signature nobody has ever seen.
   ============================================================ */

/* Where each letter sits in the octave, and the way back. */
const XP_STEPS = {C:0, D:2, E:4, F:5, G:7, A:9, B:11};
/* Two spellings of every pitch class: the one a sharp key wants and the one a
   flat key wants. C sharp and D flat are the same note and never the same
   thing on a page. */
const XP_SHARP = [['C',0],['C',1],['D',0],['D',1],['E',0],['F',0],['F',1],['G',0],['G',1],['A',0],['A',1],['B',0]];
const XP_FLAT  = [['C',0],['D',-1],['D',0],['E',-1],['E',0],['F',0],['G',-1],['G',0],['A',-1],['A',0],['B',-1],['B',0]];

/* Up a semitone is seven steps clockwise. Past six accidentals the same key
   is better written the other way round — seven sharps is C sharp major, and
   nobody reading a practice score wants C sharp major when D flat is the same
   sound with five flats. */
function transposedFifths(fifths, semitones){
  let f = (+fifths || 0) + 7 * (+semitones || 0);
  while(f > 6) f -= 12;
  while(f < -6) f += 12;
  return f;
}
const transposedKeyName = (fifths, minor, semitones) =>
  scoreKeyNameOf(transposedFifths(fifths, semitones), minor);
/* naming a key from its signature alone, without needing a rendered score */
function scoreKeyNameOf(fifths, minor){
  const root = keyRootOf(fifths, minor);
  const table = (+fifths || 0) < 0 ? XP_FLAT : XP_SHARP;
  const [letter, alter] = table[root];
  return `${letter}${alter > 0 ? '♯' : alter < 0 ? '♭' : ''}${minor ? ' minor' : ' major'}`;
}

/* The rewrite. Every sounding pitch moves; every key signature moves with it;
   nothing else is touched. */
function transposeMusicXml(xml, semitones){
  const by = Math.round(+semitones || 0);
  if(!by) return xml;
  let doc;
  try {
    doc = new DOMParser().parseFromString(xml, 'application/xml');
    if(doc.querySelector('parsererror')) return xml;
  } catch(e){ return xml; }

  /* which way to spell the result, decided once from where the key lands —
     a piece in flats stays in flats */
  const firstKey = doc.querySelector('key fifths');
  const startFifths = firstKey ? parseInt(firstKey.textContent, 10) || 0 : 0;
  const flat = transposedFifths(startFifths, by) < 0;
  const table = flat ? XP_FLAT : XP_SHARP;

  doc.querySelectorAll('note > pitch').forEach(pitch => {
    const stepEl = pitch.querySelector('step');
    const octEl = pitch.querySelector('octave');
    if(!stepEl || !octEl) return;
    const alterEl = pitch.querySelector('alter');
    const base = XP_STEPS[stepEl.textContent.trim().toUpperCase()];
    if(base == null) return;
    const alter = alterEl ? parseInt(alterEl.textContent, 10) || 0 : 0;
    const octave = parseInt(octEl.textContent, 10) || 4;
    /* MusicXML's octave changes at C, so the arithmetic is the same as MIDI's
       and the octave falls out of the division */
    const midi = (octave + 1) * 12 + base + alter + by;
    const [letter, newAlter] = table[((midi % 12) + 12) % 12];
    stepEl.textContent = letter;
    octEl.textContent = String(Math.floor(midi / 12) - 1);
    if(newAlter){
      if(alterEl) alterEl.textContent = String(newAlter);
      else {
        const el = doc.createElement('alter');
        el.textContent = String(newAlter);
        /* MusicXML wants step, alter, octave in that order */
        pitch.insertBefore(el, octEl);
      }
    } else if(alterEl) alterEl.remove();
  });

  doc.querySelectorAll('key > fifths').forEach(k => {
    k.textContent = String(transposedFifths(parseInt(k.textContent, 10) || 0, by));
  });
  /* A chord symbol written into the file is a pitch too, and one that would
     otherwise be left naming the old key over the new notes. */
  doc.querySelectorAll('harmony root, harmony bass').forEach(node => {
    const stepEl = node.querySelector('root-step, bass-step');
    if(!stepEl) return;
    const alterEl = node.querySelector('root-alter, bass-alter');
    const base = XP_STEPS[stepEl.textContent.trim().toUpperCase()];
    if(base == null) return;
    const alter = alterEl ? parseInt(alterEl.textContent, 10) || 0 : 0;
    const [letter, newAlter] = table[(((base + alter + by) % 12) + 12) % 12];
    stepEl.textContent = letter;
    if(newAlter){
      if(alterEl) alterEl.textContent = String(newAlter);
      else {
        const el = doc.createElement(stepEl.tagName.startsWith('root') ? 'root-alter' : 'bass-alter');
        el.textContent = String(newAlter);
        node.appendChild(el);
      }
    } else if(alterEl) alterEl.remove();
  });

  try { return new XMLSerializer().serializeToString(doc); } catch(e){ return xml; }
}

/* The notation as it should be drawn now. Cached against the file and the
   interval, because rewriting a three-hundred-kilobyte document is not
   something to do on every redraw — only when the interval changes. */
let _xpCache = {id:null, by:null, xml:null};
function scoreXmlFor(rec){
  const by = Math.round(+rec.transpose || 0);
  if(!by) return rec.musicXml;
  if(_xpCache.id === rec.id && _xpCache.by === by && _xpCache.xml) return _xpCache.xml;
  const xml = transposeMusicXml(rec.musicXml, by);
  _xpCache = {id:rec.id, by, xml};
  return xml;
}
/* the interval, said the way a musician would say it */
const XP_NAMES = ['', 'a semitone', 'a tone', 'a minor third', 'a major third', 'a fourth',
  'a tritone', 'a fifth', 'a minor sixth', 'a major sixth', 'a minor seventh', 'a major seventh', 'an octave'];
function transposeSaid(by){
  const n = Math.round(+by || 0);
  if(!n) return 'as written';
  const name = XP_NAMES[Math.min(12, Math.abs(n))] || `${Math.abs(n)} semitones`;
  return `${n > 0 ? '+' : '−'}${Math.abs(n)} · ${name} ${n > 0 ? 'up' : 'down'}`;
}
