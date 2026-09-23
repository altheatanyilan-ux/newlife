/* ============================================================
   THE SCORE EDITOR — a score you click on, and a keyboard.

   What was here before was a form: a card per bar, a text field
   per note, and a preview that appended a new rendering every
   time you touched anything. It was three override layers deep
   and nobody could tell which one was drawing.

   This is one layer and one idea, taken from MuseScore. There
   are two modes. In Normal mode you select a note and change it:
   arrows move its pitch, a letter replaces it, a number changes
   its length, Delete turns it into a rest. In Note Input mode you
   choose a length and then type pitches, and the cursor walks
   forward as you go. That is the whole interaction.

   ONE PREVIEW. One OpenSheetMusicDisplay instance is made when
   the editor opens and the same one is re-rendered after every
   edit. Nothing is ever appended. That was the bug that made the
   old editor unusable and it is worth being explicit about.

   PITCHES ARE INTERVALS. A note is stored as a MIDI number
   relative to C, the way the generators think, so a score edited
   in C is correct in the other eleven keys without being edited
   twice.
   ============================================================ */

/* ---------- what is stored ---------- */
function jazzEditedState(){
  const j = jazzState();
  j.editedScores = j.editedScores && typeof j.editedScores === 'object' ? j.editedScores : {};
  return j.editedScores;
}
function jazzEdited(id){ return jazzEditedState()[id] || null; }
function jazzSetEdited(id, score){
  jazzEditedState()[id] = Object.assign({}, score, {lastEdited: new Date().toISOString()});
  saveNow();
}
function jazzClearEdited(id){ delete jazzEditedState()[id]; saveNow(); }
function jazzEditedCount(){ return Object.keys(jazzEditedState()).length; }

/* The staff a score is drawn on. Saved per exercise and honoured by the
   normal exercise view as well as by the editor, which is the point of
   having it — an exercise that is really one hand should not be drawn on a
   brace for the rest of time. */
function jazzStaffConfig(id){
  const s = jazzEdited(id);
  return (s && s.staffConfig) || 'grand';
}

/* The banner on an exercise whose score you have changed. */
function jazzEditedBannerHTML(id){
  const s = jazzEdited(id);
  if(!s) return '';
  return `<div class="jz-editbanner">
    <span class="jz-editbanner-i" aria-hidden="true">✏️</span>
    <div><b>You have edited this score.</b>
      <p>It is drawn from your version rather than from the generator, in every key.${
        s.editedInKey ? ` Edited in ${esc(jazzPretty(s.editedInKey))}.` : ''}</p></div>
  </div>`;
}

/* ---------- durations ----------
   Sixteenths are the unit, because that is the smallest thing the toolbar
   offers and it keeps every duration a whole number. */
const JZE_DURS = [
  {n:1, type:'whole',     units:16, glyph:'\u{1d15d}'},
  {n:2, type:'half',      units:8,  glyph:'\u{1d15e}'},
  {n:3, type:'quarter',   units:4,  glyph:'♩'},
  {n:4, type:'eighth',    units:2,  glyph:'♪'},
  {n:5, type:'16th',      units:1,  glyph:'\u{1d161}'}
];
const jzeDurByN    = n => JZE_DURS.find(d => d.n === +n) || JZE_DURS[2];
const jzeDurByType = t => JZE_DURS.find(d => d.type === t) || JZE_DURS[2];
const jzeUnitsOf = note => {
  const base = jzeDurByType(note.type).units;
  return note.dotted ? base + Math.floor(base / 2) : base;
};

/* ---------- reading a generated score into the model ----------
   The generator's MusicXML is the starting point: the editor opens on what
   is already drawn rather than on an empty stave. */
const JZE_DIV_TARGET = 4;   /* divisions per quarter in what we write */

function jazzXmlToScore(xml, id, key){
  const out = {exerciseId: id, staffConfig:'grand',
    timeSignature:{beats:4, beatType:4}, keySignature:0,
    measures: [], editedInKey: key || 'C', lastEdited: null};
  if(!xml || typeof DOMParser === 'undefined') return out;
  let doc;
  try { doc = new DOMParser().parseFromString(xml, 'application/xml'); } catch(e){ return out; }
  if(!doc || doc.querySelector('parsererror')) return out;

  const first = doc.querySelector('measure');
  if(first){
    const beats = first.querySelector('time > beats');
    const bt = first.querySelector('time > beat-type');
    if(beats) out.timeSignature.beats = +beats.textContent || 4;
    if(bt) out.timeSignature.beatType = +bt.textContent || 4;
    const fifths = first.querySelector('key > fifths');
    if(fifths) out.keySignature = +fifths.textContent || 0;
  }
  const staves = doc.querySelector('staves');
  const nStaves = staves ? (+staves.textContent || 1) : 1;
  if(nStaves < 2){
    /* one stave: which clef decides whether it is the treble or the bass */
    const sign = (doc.querySelector('clef > sign') || {}).textContent || 'G';
    out.staffConfig = sign === 'F' ? 'bass' : 'treble';
  }
  const divEl = doc.querySelector('divisions');
  const divisions = divEl ? (+divEl.textContent || 1) : 1;
  const toUnits = d => Math.max(1, Math.round((d / divisions) * JZE_DIV_TARGET));

  for(const bar of [...doc.querySelectorAll('measure')]){
    const m = {chordSymbol: null, treble: [], bass: []};
    const harm = bar.querySelector('harmony');
    if(harm){
      const step = (harm.querySelector('root-step') || {}).textContent || '';
      const alter = +((harm.querySelector('root-alter') || {}).textContent || 0);
      const kind = (harm.querySelector('kind') || {}).textContent || '';
      if(step) m.chordSymbol = step + (alter === 1 ? '#' : alter === -1 ? 'b' : '')
        + jzeKindShort(kind);
    }
    for(const n of [...bar.querySelectorAll('note')]){
      const isRest = !!n.querySelector('rest');
      const staffEl = n.querySelector('staff');
      const staff = (staffEl && staffEl.textContent === '2') ? 'bass'
        : (nStaves < 2 && out.staffConfig === 'bass') ? 'bass' : 'treble';
      const durEl = n.querySelector('duration');
      const units = durEl ? toUnits(+durEl.textContent || 1) : 4;
      const typeEl = n.querySelector('type');
      const type = typeEl ? typeEl.textContent : jzeTypeForUnits(units);
      const note = {
        pitch: isRest ? null : jazzPitchMidi(n.querySelector('pitch')),
        duration: units, type: jzeDurByType(type).type,
        isRest, isChord: !!n.querySelector('chord'),
        dotted: !!n.querySelector('dot'), tied: !!n.querySelector('tie')
      };
      if(note.pitch == null && !isRest) continue;
      m[staff].push(note);
    }
    out.measures.push(m);
  }
  if(!out.measures.length) out.measures.push(jzeBlankMeasure(out));
  return out;
}
const jzeKindShort = k =>
  /major-seventh/.test(k) ? 'maj7' : /minor-seventh/.test(k) ? 'm7'
  : /half-diminished/.test(k) ? 'm7b5' : /diminished/.test(k) ? 'dim7'
  : /dominant/.test(k) ? '7' : /minor/.test(k) ? 'm' : '';
function jzeTypeForUnits(u){
  let best = JZE_DURS[2];
  for(const d of JZE_DURS) if(d.units <= u && d.units >= best.units) best = d;
  return best.type;
}
function jzeBlankMeasure(score){
  const per = Math.round(16 * (score.timeSignature.beats / score.timeSignature.beatType));
  const rest = () => [{pitch:null, duration:per, type:jzeTypeForUnits(per),
    isRest:true, isChord:false, dotted:false, tied:false}];
  return {chordSymbol:null, treble:rest(), bass:rest()};
}

/* ---------- writing the model back out ----------
   Grand staff gets <staves>2</staves> and two clefs; treble or bass only get
   a single clef with the right sign. The jz-grand-staff marker tells the
   grand-staff pass that this document already knows what it is doing. */
function jazzScoreToXml(score, key){
  const cfg = score.staffConfig || 'grand';
  const grand = cfg === 'grand';
  const shift = jzeTranspose(score.editedInKey || 'C', key || 'C');
  const per = Math.round(16 * (score.timeSignature.beats / score.timeSignature.beatType));

  const noteXml = (note, staffNo) => {
    const dur = Math.max(1, note.duration | 0);
    const bits = [];
    if(note.isChord) bits.push('<chord/>');
    if(note.isRest) bits.push('<rest/>');
    else {
      const sp = jazzSpellMidi(note.pitch + shift, key);
      bits.push(`<pitch><step>${sp.step}</step>${
        sp.alter ? `<alter>${sp.alter}</alter>` : ''}<octave>${sp.octave}</octave></pitch>`);
    }
    bits.push(`<duration>${dur}</duration>`);
    if(note.tied && !note.isRest) bits.push('<tie type="start"/>');
    bits.push(`<type>${note.type}</type>`);
    if(note.dotted) bits.push('<dot/>');
    if(grand) bits.push(`<staff>${staffNo}</staff>`);
    return `<note>${bits.join('')}</note>`;
  };
  const fill = arr => (arr && arr.length) ? arr
    : [{pitch:null, duration:per, type:jzeTypeForUnits(per), isRest:true,
        isChord:false, dotted:false, tied:false}];
  const used = arr => arr.reduce((s, n) => s + (n.isChord ? 0 : Math.max(1, n.duration | 0)), 0);

  const measures = score.measures.map((m, i) => {
    const attrs = i === 0 ? `<attributes><divisions>${JZE_DIV_TARGET}</divisions>` +
      `<key><fifths>${jzeFifthsFor(key, score.keySignature)}</fifths></key>` +
      `<time><beats>${score.timeSignature.beats}</beats>` +
      `<beat-type>${score.timeSignature.beatType}</beat-type></time>` +
      (grand ? '<staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef>' +
        '<clef number="2"><sign>F</sign><line>4</line></clef>'
        : cfg === 'bass' ? '<clef><sign>F</sign><line>4</line></clef>'
        : '<clef><sign>G</sign><line>2</line></clef>') +
      '</attributes>' : '';
    const harm = m.chordSymbol ? jzeHarmonyXml(m.chordSymbol, shift) : '';
    const top = fill(grand || cfg === 'treble' ? m.treble : m.bass);
    const topXml = top.map(n => noteXml(n, 1)).join('');
    let body = topXml;
    if(grand){
      const bot = fill(m.bass);
      /* back up by exactly what the top staff consumed, so the second staff
         starts at beat one rather than wherever the first one ended */
      body += `<backup><duration>${Math.max(1, used(top))}</duration></backup>`
        + bot.map(n => noteXml(n, 2)).join('');
    }
    return `<measure number="${i + 1}">${attrs}${harm}${body}</measure>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1"><!-- jz-grand-staff -->
<part-list><score-part id="P1"><part-name>${grand ? 'Piano' : 'Music'}</part-name></score-part></part-list>
<part id="P1">${measures}</part></score-partwise>`;
}
function jzeHarmonyXml(sym, shift){
  const m = /^([A-G])([#b]?)(.*)$/.exec(sym || '');
  if(!m) return '';
  const pc = {C:0, D:2, E:4, F:5, G:7, A:9, B:11}[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const sp = jazzSpellMidi(60 + ((pc + shift) % 12 + 12) % 12, 'C');
  const q = m[3] || '';
  const kind = /maj7/.test(q) ? 'major-seventh' : /m7b5/.test(q) ? 'half-diminished'
    : /dim/.test(q) ? 'diminished-seventh' : /m7/.test(q) ? 'minor-seventh'
    : /^7/.test(q) ? 'dominant' : /^m/.test(q) ? 'minor' : 'major';
  return `<harmony><root><root-step>${sp.step}</root-step>${
    sp.alter ? `<root-alter>${sp.alter}</root-alter>` : ''}</root><kind>${kind}</kind></harmony>`;
}
/* How far the key on the screen is from the key it was edited in. */
const JZE_KEY_PC = {C:0, 'C#':1, Db:1, D:2, 'D#':3, Eb:3, E:4, F:5, 'F#':6, Gb:6,
  G:7, 'G#':8, Ab:8, A:9, 'A#':10, Bb:10, B:11};
function jzeTranspose(from, to){
  const a = JZE_KEY_PC[from], b = JZE_KEY_PC[to];
  if(a == null || b == null) return 0;
  let d = (b - a) % 12;
  if(d > 6) d -= 12;
  if(d < -6) d += 12;
  return d;
}
const JZE_FIFTHS = {C:0, G:1, D:2, A:3, E:4, B:5, 'F#':6, Gb:-6, Db:-5, Ab:-4,
  Eb:-3, Bb:-2, F:-1, 'C#':7, 'D#':-3, 'G#':-4, 'A#':-2};
const jzeFifthsFor = (key, fallback) =>
  JZE_FIFTHS[key] != null ? JZE_FIFTHS[key] : (fallback || 0);

/* ---------- what the exercise page draws ----------
   Your score if you have made one, the generator's if you have not. */
function jazzScoreFor(id, ex, key, opts){
  const mine = jazzEdited(id);
  if(mine) { try { return jazzScoreToXml(mine, key); } catch(e){ console.warn('edited score would not build', e); } }
  return jazzScoreXml(ex, key, opts);
}
