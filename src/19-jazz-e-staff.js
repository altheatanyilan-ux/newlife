/* ============================================================
   A GRAND STAFF, AND NOTES ON THE CLEF THEY BELONG TO.

   The generators in this room were written one clef at a time, and every one
   of them wrote a treble. Which is wrong for most of what this room teaches:
   Siskind's Type A and Type B voicings sit between B2 and C4, his shell
   voicings between F2 and E3, and his bass lines lower still. On a treble
   staff those come out hanging under the stave on four and five ledger
   lines, which is not how the book prints them and is not how anybody reads
   them. It is a piano. It has two hands and two clefs.

   ONE PLACE RATHER THAN ELEVEN. Eleven separate functions across four files
   wrote `<clef><sign>G</sign></clef>` into a measure, and correcting all
   eleven would mean correcting the twelfth the day somebody adds it. So this
   is a pass over the finished MusicXML instead: whatever the generators
   write, it comes out of jazzScoreXml as a grand staff. A generator that
   already writes one — the blues, the shells over a bass in two — says so
   with <staves> and is left alone.

   WHERE THE LINE IS DRAWN. Middle C, which is where a pianist draws it.

   A CHORD is one hand's grab until it is too wide to be one, and a hand's
   grab is printed on one staff. Siskind's Type A on D is D3-F3-A3-C4: it
   crosses middle C by one note and it is one hand, and an engraver prints
   the lot on the bass staff with a ledger line over the C — splitting it
   would put three notes on one stave and a single whole note on the other,
   which is harder to read than the ledger line it saved. So a chord goes
   whole onto one stave: the bass when it only reaches a little above middle
   C, the treble when it only dips a little below it. It is split note by
   note at middle C only when it is wider than a hand can hold, which is
   what two hands look like — and the shipped catalogue, being a book about
   what one hand does, contains no such chord.

   A MELODIC LINE is not split note by note, because a line that crosses
   middle C twice in a bar would hop staves twice in a bar, and nobody
   engraves a phrase that way. The whole line goes to one staff, chosen by
   where the majority of it sits — a lick to the treble, a bass line to the
   bass — and the few notes on the wrong side of the line take a ledger line,
   which is what a human engraver does with them too.

   THE OTHER STAFF IS STILL DRAWN. A voicing exercise whose notes are all in
   the left hand leaves the treble staff empty, and it is still there, with
   rests in it. A grand staff with one stave is a treble staff with extra
   steps; the point of asking for the bass clef is to read the register
   correctly, and that only works if both are on the page.
   ============================================================ */

const JAZZ_MIDDLE_C = 60;               /* where the hands divide */
const JAZZ_TREBLE = 1, JAZZ_BASS = 2;
/* a tenth: what one hand reaches, and what one stave prints without asking
   the reader to count ledger lines */
const JAZZ_HAND_SPAN = 16;
/* and how far a chord that crosses middle C may reach on either side before
   the ledger lines cost more than a split would: a fifth above it for a
   bass-staff chord, and an octave below it for a treble-staff one, which is
   two ledger lines each */
const JAZZ_BASS_CEIL = 67;
const JAZZ_TREBLE_FLOOR = 48;

/* A measure's notes in sounding order, grouped: a note and the <chord/>
   notes that sound with it are one event. */
function jazzStaffEvents(measure){
  const out = [];
  [...measure.children].forEach(el => {
    if(el.tagName !== 'note') return;
    const chord = [...el.children].some(c => c.tagName === 'chord');
    if(chord && out.length) out[out.length - 1].notes.push(el);
    else out.push({notes: [el]});
  });
  return out;
}
const jazzNoteDur = n => { const d = [...n.children].find(c => c.tagName === 'duration');
  return d ? +d.textContent || 0 : 0; };
const jazzIsRest = n => [...n.children].some(c => c.tagName === 'rest');

/* Which staff a whole melodic line belongs on. The median rather than the
   mean, so one low pedal note under thirty notes of a lick does not drag the
   phrase into the bass. */
function jazzLineStaff(midis){
  const got = midis.filter(m => m != null).sort((a, b) => a - b);
  if(!got.length) return JAZZ_TREBLE;
  const mid = got[Math.floor(got.length / 2)];
  return mid < JAZZ_MIDDLE_C ? JAZZ_BASS : JAZZ_TREBLE;
}

/* One staff for the whole chord, or null when it has to be split. A chord
   that sits entirely on one side of middle C never needs asking; one that
   crosses it is still one hand if it is narrow enough and does not climb too
   far, and one hand is one stave. */
function jazzChordStaff(midis){
  const got = midis.filter(m => m != null);
  if(!got.length) return JAZZ_TREBLE;
  const low = Math.min(...got), high = Math.max(...got);
  if(high < JAZZ_MIDDLE_C) return JAZZ_BASS;
  if(low >= JAZZ_MIDDLE_C) return JAZZ_TREBLE;
  if(high - low > JAZZ_HAND_SPAN) return null;      /* two hands, and two staves */
  /* it crosses middle C and it is one hand, so it goes on whichever stave it
     sits closer to — the bass when it only reaches a little above the line,
     the treble when it only dips a little below it */
  if(high <= JAZZ_BASS_CEIL) return JAZZ_BASS;
  if(low >= JAZZ_TREBLE_FLOOR) return JAZZ_TREBLE;
  return null;
}

/* ---------- writing the two staves ---------- */
const JAZZ_REST_TYPES = {1:'16th', 2:'eighth', 4:'quarter', 8:'half', 16:'whole'};
function jazzMakeRest(doc, dur, staff, whole){
  const n = doc.createElement('note');
  const rest = doc.createElement('rest');
  /* a bar's worth of nothing is a measure rest, which every engraver centres
     in the bar rather than drawing as a whole note on the third line */
  if(whole) rest.setAttribute('measure', 'yes');
  n.appendChild(rest);
  const d = doc.createElement('duration'); d.textContent = String(dur); n.appendChild(d);
  const v = doc.createElement('voice'); v.textContent = String(staff); n.appendChild(v);
  /* A measure rest is conventionally written without a <type>, and left
     without one OSMD reads the duration instead and draws a whole rest with
     two augmentation dots in a 4/4 bar — which says "six beats of silence" in
     a bar of four. The type it should be drawn as is always a whole rest,
     whatever the metre, so it is said outright. */
  const type = whole ? 'whole' : JAZZ_REST_TYPES[dur];
  if(type){ const t = doc.createElement('type'); t.textContent = type; n.appendChild(t); }
  const s = doc.createElement('staff'); s.textContent = String(staff); n.appendChild(s);
  return n;
}
/* <staff> and <voice> go in the places the format puts them: voice after the
   duration and the ties, staff after the stem and before the beams. Writing
   them at the end instead produces a file this app will happily draw and
   MuseScore will refuse, which is the worst of both. */
function jazzSetStaff(note, staff){
  const doc = note.ownerDocument;
  const kids = [...note.children];
  let voice = kids.find(c => c.tagName === 'voice');
  if(!voice){
    voice = doc.createElement('voice');
    const type = kids.find(c => c.tagName === 'type');
    note.insertBefore(voice, type || null);
  }
  voice.textContent = String(staff);
  let st = [...note.children].find(c => c.tagName === 'staff');
  if(!st) st = doc.createElement('staff');
  st.textContent = String(staff);
  const after = [...note.children].find(c => ['beam','notations','lyric'].includes(c.tagName));
  note.insertBefore(st, after || null);
  return note;
}
const jazzSetChord = (note, on) => {
  const doc = note.ownerDocument;
  const had = [...note.children].find(c => c.tagName === 'chord');
  if(on && !had) note.insertBefore(doc.createElement('chord'), note.firstChild);
  if(!on && had) had.remove();
};

/* One measure, rewritten as two. */
function jazzSplitMeasure(measure, lineStaff){
  const doc = measure.ownerDocument;
  const events = jazzStaffEvents(measure);
  if(!events.length) return;
  /* what goes where, and how long the bar is */
  let total = 0;
  const plan = events.map(ev => {
    const dur = jazzNoteDur(ev.notes[0]);
    total += dur;
    const rest = jazzIsRest(ev.notes[0]);
    const by = {1: [], 2: []};
    if(rest){ /* a rest belongs to whichever staff the line is on; the other
                 staff gets one of its own when the bar is laid out */ }
    else if(ev.notes.length === 1) by[lineStaff].push(ev.notes[0]);
    else {
      const midis = ev.notes.map(n => { const p = [...n.children].find(c => c.tagName === 'pitch');
        return p ? jazzPitchMidi(p) : null; });
      const whole = jazzChordStaff(midis);
      ev.notes.forEach((n, i) => by[whole || (midis[i] != null && midis[i] < JAZZ_MIDDLE_C
        ? JAZZ_BASS : JAZZ_TREBLE)].push(n));
    }
    return {dur, rest, by};
  });
  /* take every note and backup out, then lay the bar down one staff at a time */
  [...measure.children].forEach(el => {
    if(el.tagName === 'note' || el.tagName === 'backup' || el.tagName === 'forward') el.remove();
    /* a chord symbol hangs over the top staff, not between them */
    if(el.tagName === 'direction' && ![...el.children].some(c => c.tagName === 'staff')){
      const s = doc.createElement('staff'); s.textContent = '1'; el.appendChild(s);
    }
  });
  const lay = staff => {
    const empty = plan.every(p => !p.by[staff].length);
    if(empty){ measure.appendChild(jazzMakeRest(doc, total, staff, true)); return; }
    plan.forEach(p => {
      const mine = p.by[staff];
      if(!mine.length){ measure.appendChild(jazzMakeRest(doc, p.dur, staff, false)); return; }
      mine.forEach((n, i) => { jazzSetChord(n, i > 0); jazzSetStaff(n, staff); measure.appendChild(n); });
    });
  };
  lay(JAZZ_TREBLE);
  const back = doc.createElement('backup');
  const bd = doc.createElement('duration'); bd.textContent = String(total);
  back.appendChild(bd);
  measure.appendChild(back);
  lay(JAZZ_BASS);
}

/* The two clefs, and the declaration that there are two staves. */
function jazzGrandAttributes(measure){
  const doc = measure.ownerDocument;
  const attrs = [...measure.children].find(c => c.tagName === 'attributes');
  if(!attrs) return false;
  [...attrs.children].filter(c => c.tagName === 'clef').forEach(c => c.remove());
  if(![...attrs.children].some(c => c.tagName === 'staves')){
    const s = doc.createElement('staves'); s.textContent = '2';
    /* <staves> belongs after <time> and before the clefs */
    const clefAfter = [...attrs.children].find(c => ['part-symbol','instruments','clef','staff-details','transpose'].includes(c.tagName));
    attrs.insertBefore(s, clefAfter || null);
  }
  const clef = (n, sign, line) => {
    const c = doc.createElement('clef'); c.setAttribute('number', String(n));
    const sg = doc.createElement('sign'); sg.textContent = sign; c.appendChild(sg);
    const ln = doc.createElement('line'); ln.textContent = String(line); c.appendChild(ln);
    attrs.appendChild(c);
  };
  clef(1, 'G', 2);
  clef(2, 'F', 4);
  return true;
}

/* ---------- the pass ----------
   Handed anything it cannot make sense of, it hands it back unchanged: a
   score that will not parse, a part with no measures, one that already has
   two staves. A room that draws the wrong clef is a nuisance; a room that
   draws nothing is broken. */
/* ---------- reading and writing a pitch in a MusicXML document ----------
   These live here rather than with the editor because the grand-staff pass
   below needs them to decide which hand a line belongs to, and that pass
   runs on every generated score whether anything has been edited or not. */
const JAZZ_STEP_PC = {C:0, D:2, E:4, F:5, G:7, A:9, B:11};
function jazzPitchMidi(pitchEl){
  if(!pitchEl) return null;
  const step = (pitchEl.querySelector('step') || {}).textContent;
  const oct = +((pitchEl.querySelector('octave') || {}).textContent);
  const alter = +((pitchEl.querySelector('alter') || {}).textContent || 0);
  if(!step || !isFinite(oct)) return null;
  return (oct + 1) * 12 + JAZZ_STEP_PC[step] + alter;
}
/* Spelled the way the key spells it, so a note edited in G♭ does not come
   back as F♯ and disagree with the accidentals in the rest of the bar. */
function jazzSpellMidi(midi, key){
  const G = typeof JazzExerciseGenerator !== 'undefined' ? JazzExerciseGenerator : null;
  const map = G && G.pitchMapForKey ? G.pitchMapForKey(key) : null;
  const pc = ((midi % 12) + 12) % 12;
  const spelling = (map && map[pc]) ||
    [{step:'C',alter:0},{step:'D',alter:-1},{step:'D',alter:0},{step:'E',alter:-1},
     {step:'E',alter:0},{step:'F',alter:0},{step:'G',alter:-1},{step:'G',alter:0},
     {step:'A',alter:-1},{step:'A',alter:0},{step:'B',alter:-1},{step:'B',alter:0}][pc];
  return {step: spelling.step, alter: spelling.alter || 0,
    octave: Math.floor(midi / 12) - 1};
}

function jazzGrandStaff(xml){
  if(!xml || typeof DOMParser === 'undefined') return xml;
  if(/<staves>/.test(xml)) return xml;
  /* wrapBassClefOnlyDocument and wrapGrandStaffDocument embed these markers
     to tell the pass they are already correctly laid out */
  if(/jz-single-staff/.test(xml) || /jz-grand-staff/.test(xml)) return xml;
  try {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if(doc.querySelector('parsererror')) return xml;
    const measures = [...doc.querySelectorAll('measure')];
    if(!measures.length) return xml;
    /* the line's hand is decided once for the whole exercise, not once a bar,
       so a phrase that dips under middle C in its third bar does not change
       clef for that bar and change back */
    const line = [];
    measures.forEach(m => jazzStaffEvents(m).forEach(ev => {
      if(ev.notes.length !== 1 || jazzIsRest(ev.notes[0])) return;
      const p = [...ev.notes[0].children].find(c => c.tagName === 'pitch');
      const midi = p ? jazzPitchMidi(p) : null;
      if(midi != null) line.push(midi);
    }));
    const lineStaff = jazzLineStaff(line);
    if(!jazzGrandAttributes(measures[0])) return xml;
    measures.forEach(m => jazzSplitMeasure(m, lineStaff));
    return new XMLSerializer().serializeToString(doc);
  } catch(e){
    console.warn('the grand-staff pass could not read that score', e);
    return xml;
  }
}
