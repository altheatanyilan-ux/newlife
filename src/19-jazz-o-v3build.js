/* ============================================================
   CURRICULUM v3 — THE NOTATION.

   Two jobs.

   THE DOCUMENT'S OWN MUSICXML, IN ANY KEY. Fifty of its entries carry
   MusicXML, written in one key. The key picker on every exercise asks
   for twelve, so this moves a finished score from the key it is written
   in to the key asked for — at the level of the score itself, pitch by
   pitch and chord symbol by chord symbol, so that everything else in it
   survives untouched: the slash noteheads (which are placeholders on the
   middle line and are NOT moved), the ties, the fermatas, the 3/4 and
   5/4 bars, two chord symbols in one bar. Spelling follows the key
   signature the result lands in, so C minor moved to D minor is written
   with one flat rather than with a D-sharp.

   THE SCORES THE DOCUMENT ONLY DESCRIBES. Many entries say what the
   score should be in a sentence — "[Score]: 4 chords descending by
   half-step to final chord: Dmaj7 - Dbmaj7 - Cmaj7 - Bmaj7 resolving to
   Bbmaj7" — and give no notation. Each of those is written out below
   from its sentence, in its home key, and moved to the chosen key the
   same way. They carry the accuracy mark that says so.

   A SMALL NOTATION, because forty scores written as raw MusicXML would
   be forty places to get a <backup> wrong. A staff is a string of
   tokens, "dur:notes", where dur is w h q e s (with a dot for dotted)
   and notes is a note, several joined with +, r for a rest, or / for a
   rhythm slash; a trailing ~ ties it to the next, and a trailing !
   puts a fermata on it.
       "q:C4~ e:C4 e:r h:r"          the Charleston
       "w:D3+F3+A3+C4"               a chord
       "q:/ q:/ q:/ q:/"             four slashes
   ============================================================ */

/* ---------- moving a finished score ----------
   By interval, not by key signature. Every note keeps the relation its
   spelling had to the key: a C-sharp that was the third of A7 in C comes
   out as the third of B7 in D (D-sharp), not as whatever the new key's
   black notes happen to be called. The key signature moves round the
   circle by the same distance; where that would need eight flats, the
   enharmonic key is used instead (C minor to G-flat minor is written as
   F-sharp minor). A double sharp or double flat, which interval
   transposition can produce, is simplified to the plain note, because a
   jazz chart does not print a B-double-flat where it can print an A. */
const JV3_SIG = {'-7':'Cb', '-6':'Gb', '-5':'Db', '-4':'Ab', '-3':'Eb', '-2':'Bb', '-1':'F', '0':'C',
  '1':'G', '2':'D', '3':'A', '4':'E', '5':'B', '6':'F#', '7':'C#'};
const JV3_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const jv3KeyFifths = k => { const row = (typeof JAZZ_KEYS === 'object' ? JAZZ_KEYS : []).find(r => r[0] === k);
  return row ? row[3] : 0; };
/* the shortest way from one key to another, as the editor measures it */
const jv3Shift = (from, to) => typeof jzeTranspose === 'function' ? jzeTranspose(from || 'C', to || 'C') : 0;
/* a pitch moved by `semis` and `letters`, spelled by the interval */
function jv3MoveSpelled(letter, alter, octave, semis, letters){
  const li = JV3_LETTERS.indexOf(letter);
  const midi = (octave + 1) * 12 + JAZZ_STEP_PC[letter] + alter + semis;
  let nl = ((li + letters) % 7 + 7) % 7;
  const at = l => { const pc = JAZZ_STEP_PC[JV3_LETTERS[l]];
    const oct = Math.round((midi - pc) / 12) - 1;
    return {step: JV3_LETTERS[l], alter: midi - ((oct + 1) * 12 + pc), octave: oct}; };
  let sp = at(nl);
  if(sp.alter >= 2) sp = at((nl + 1) % 7);
  else if(sp.alter <= -2) sp = at((nl + 6) % 7);
  return sp;
}
function jazzTransposeXml(xml, from, to){
  if(!xml || typeof DOMParser === 'undefined') return xml;
  const semis = jv3Shift(from, to);
  if(!semis) return xml;
  let doc;
  try { doc = new DOMParser().parseFromString(xml, 'application/xml'); } catch(e){ return xml; }
  if(!doc || doc.querySelector('parsererror')) return xml;
  const f0El = doc.querySelector('key > fifths');
  const f0 = f0El ? +f0El.textContent || 0 : 0;
  let f1 = f0 + (jv3KeyFifths(to) - jv3KeyFifths(from));
  if(f1 < -7) f1 += 12; else if(f1 > 7) f1 -= 12;
  /* how many letters: from the signature's tonic to the new one's */
  const l0 = JV3_LETTERS.indexOf(JV3_SIG[String(f0)].charAt(0));
  const l1 = JV3_LETTERS.indexOf(JV3_SIG[String(f1)].charAt(0));
  let letters = ((l1 - l0) % 7 + 7) % 7;
  if(semis < 0 && letters > 0) letters -= 7;
  [...doc.querySelectorAll('key > fifths')].forEach(f => f.textContent = String(f1));
  const put = (parent, stepTag, alterTag, octTag, sp) => {
    const st = parent.querySelector(stepTag);
    st.textContent = sp.step;
    let al = parent.querySelector(alterTag);
    if(sp.alter){
      if(!al){ al = doc.createElementNS(st.namespaceURI, alterTag); st.after(al); }
      al.textContent = String(sp.alter);
    } else if(al) al.remove();
    if(octTag){ const oc = parent.querySelector(octTag); if(oc) oc.textContent = String(sp.octave); }
  };
  const read = (parent, stepTag, alterTag, octTag) => {
    const st = parent.querySelector(stepTag); if(!st) return null;
    const al = parent.querySelector(alterTag), oc = octTag ? parent.querySelector(octTag) : null;
    return {step: st.textContent.trim(), alter: al ? +al.textContent || 0 : 0, octave: oc ? +oc.textContent : 4};
  };
  [...doc.querySelectorAll('note')].forEach(n => {
    const nh = n.querySelector('notehead');
    if(nh && /slash/.test(nh.textContent)) return;      /* a rhythm slash has no pitch to move */
    const p = n.querySelector('pitch');
    if(!p) return;
    const r = read(p, 'step', 'alter', 'octave'); if(!r) return;
    put(p, 'step', 'alter', 'octave', jv3MoveSpelled(r.step, r.alter, r.octave, semis, letters));
    const acc = n.querySelector('accidental'); if(acc) acc.remove();
  });
  const movePc = (parent, stepTag, alterTag) => {
    const r = read(parent, stepTag, alterTag, null); if(!r) return;
    put(parent, stepTag, alterTag, null, jv3MoveSpelled(r.step, r.alter, 4, semis, letters));
  };
  [...doc.querySelectorAll('harmony')].forEach(h => {
    const r = h.querySelector('root'); if(r) movePc(r, 'root-step', 'root-alter');
    const b = h.querySelector('bass'); if(b) movePc(b, 'bass-step', 'bass-alter');
  });
  return new XMLSerializer().serializeToString(doc);
}

/* ---------- chord symbols ---------- */
function jv3Harmony(sym){
  const m = /^([A-G])([b#]?)(.*?)(?:\/([A-G])([b#]?))?$/.exec(String(sym || '').trim());
  if(!m) return '';
  const alt = a => a === 'b' ? -1 : a === '#' ? 1 : 0;
  let q = m[3] || '';
  const deg = [];
  const add = (v, a, t) => deg.push(`<degree><degree-value>${v}</degree-value><degree-alter>${a}</degree-alter><degree-type>${t || 'add'}</degree-type></degree>`);
  let kind = 'major';
  const alters = () => { let x; const re = /([b#])(5|9|11|13)/g;
    while((x = re.exec(q))) add(x[2], x[1] === 'b' ? -1 : 1, x[2] === '5' ? 'alter' : 'add'); };
  if(/^(maj7|M7|\u0394)/.test(q)){ kind = 'major-seventh'; q = q.replace(/^(maj7|M7|\u0394)/, ''); alters(); }
  else if(/^maj9/.test(q)){ kind = 'major-ninth'; q = q.slice(4); alters(); }
  else if(/^69/.test(q)){ kind = 'major-sixth'; add(9, 0); }
  else if(/^6/.test(q)){ kind = 'major-sixth'; }
  else if(/^m\(?(maj7|M7)\)?/.test(q)){ kind = 'major-minor'; }
  else if(/^(m7b5|\u00f8)/.test(q)){ kind = 'half-diminished'; }
  else if(/^m9/.test(q)){ kind = 'minor-ninth'; }
  else if(/^m11/.test(q)){ kind = 'minor-11th'; }
  else if(/^m6/.test(q)){ kind = 'minor-sixth'; }
  else if(/^m7/.test(q)){ kind = 'minor-seventh'; }
  else if(/^m/.test(q)){ kind = 'minor'; }
  else if(/^(dim7|o7|\u00b07)/.test(q)){ kind = 'diminished-seventh'; }
  else if(/^(dim|o|\u00b0)/.test(q)){ kind = 'diminished'; }
  else if(/^(\+|aug)/.test(q)){ kind = 'augmented'; }
  else if(/^7alt|^alt/.test(q)){ kind = 'dominant'; add(9, -1); add(9, 1); add(13, -1); }
  else if(/^13/.test(q)){ kind = 'dominant-13th'; q = q.slice(2); alters(); }
  else if(/^9/.test(q)){ kind = 'dominant-ninth'; q = q.slice(1); alters(); }
  else if(/^7/.test(q)){ kind = 'dominant'; q = q.slice(1); alters(); }
  const bass = m[4] ? `<bass><bass-step>${m[4]}</bass-step>${alt(m[5]) ? `<bass-alter>${alt(m[5])}</bass-alter>` : ''}</bass>` : '';
  return `<harmony><root><root-step>${m[1]}</root-step>${alt(m[2]) ? `<root-alter>${alt(m[2])}</root-alter>` : ''}</root><kind>${kind}</kind>${bass}${deg.join('')}</harmony>`;
}

/* ---------- the small notation ---------- */
const JV3_DUR = {w:16, h:8, q:4, e:2, s:1};
const JV3_TYPE = {w:'whole', h:'half', q:'quarter', e:'eighth', s:'16th'};
function jv3Pitch(name){
  const m = /^([A-G])(bb|b|##|#)?(-?\d)$/.exec(name);
  if(!m) throw new Error('v3: not a note — ' + name);
  const alter = {b:-1, bb:-2, '#':1, '##':2}[m[2]] || 0;
  return `<pitch><step>${m[1]}</step>${alter ? `<alter>${alter}</alter>` : ''}<octave>${m[3]}</octave></pitch>`;
}
/* a note name → MIDI */
function jv3MidiOf(name){
  const m = /^([A-G])(bb|b|##|#)?(-?\d)$/.exec(name);
  if(!m) throw new Error('v3: not a note — ' + name);
  return (+m[3] + 1) * 12 + JAZZ_STEP_PC[m[1]] + ({b:-1, bb:-2, '#':1, '##':2}[m[2]] || 0);
}
/* a staff's tokens → [{units, xml}]. Ties are read first and written
   second, because the note a tie stops on is the NEXT token. */
function jv3Events(tokens, staff, grand){
  const evs = String(tokens || '').trim().split(/\s+/).filter(Boolean).map(tok => {
    const m = /^([whqes])(\.?):(.+?)(~?)(!?)$/.exec(tok);
    if(!m) throw new Error('v3: cannot read ' + tok);
    const body = m[3];
    return {dur: m[1], dot: !!m[2], units: JV3_DUR[m[1]] * (m[2] ? 1.5 : 1),
      parts: body === 'r' ? ['r'] : body === '/' ? ['/'] : body.split('+'),
      tieStart: !!m[4], tieStop: false, fermata: !!m[5]};
  });
  for(let i = 0; i < evs.length - 1; i++) if(evs[i].tieStart) evs[i + 1].tieStop = true;
  evs.forEach(ev => {
    ev.xml = ev.parts.map((p, i) => {
      const rest = p === 'r', slash = p === '/';
      const bits = [];
      if(i > 0) bits.push('<chord/>');
      if(rest) bits.push('<rest/>');
      else if(slash) bits.push('<pitch><step>B</step><octave>4</octave></pitch>');
      else bits.push(jv3Pitch(p));
      bits.push(`<duration>${ev.units}</duration>`);
      if(!rest && ev.tieStop) bits.push('<tie type="stop"/>');
      if(!rest && ev.tieStart) bits.push('<tie type="start"/>');
      bits.push(`<voice>${staff}</voice>`);
      bits.push(`<type>${JV3_TYPE[ev.dur]}</type>`);
      if(ev.dot) bits.push('<dot/>');
      if(slash) bits.push('<stem>none</stem><notehead>slash</notehead>');
      if(grand) bits.push(`<staff>${staff}</staff>`);
      const nots = [];
      if(!rest && ev.tieStop) nots.push('<tied type="stop"/>');
      if(!rest && ev.tieStart) nots.push('<tied type="start"/>');
      if(ev.fermata && i === 0) nots.push('<fermata type="upright"/>');
      if(nots.length) bits.push(`<notations>${nots.join('')}</notations>`);
      return `<note>${bits.join('')}</note>`;
    }).join('');
  });
  return evs;
}
/* harmony at a beat: "Dm7 G7" spreads over the bar; [['Dm7',0],['G7',2]] places them */
function jv3HarmAt(h, beats){
  if(!h) return [];
  if(Array.isArray(h)) return h.map(([s, b]) => ({sym: s, at: Math.round(b * 4)}));
  const syms = String(h).trim().split(/\s+/);
  const step = beats * 4 / syms.length;
  return syms.map((s, i) => ({sym: s, at: Math.round(i * step)}));
}
/**
 * A score from the small notation.
 * @param {object} d  {staves:'grand'|'treble'|'bass', beats, beatType, fifths, title, measures:[{h, t, b, words, mark}]}
 */
function jv3Score(d){
  const beats = d.beats || 4, beatType = d.beatType || 4;
  const grand = d.staves === 'grand';
  const clefSingle = d.staves === 'bass' ? '<clef><sign>F</sign><line>4</line></clef>' : '<clef><sign>G</sign><line>2</line></clef>';
  const measures = d.measures.map((m, i) => {
    let x = '';
    if(i === 0) x += `<attributes><divisions>4</divisions><key><fifths>${d.fifths || 0}</fifths></key>`
      + `<time><beats>${beats}</beats><beat-type>${beatType}</beat-type></time>`
      + (grand ? '<staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef>' : clefSingle)
      + '</attributes>';
    if(m.time) x += `<attributes><time><beats>${m.time[0]}</beats><beat-type>${m.time[1]}</beat-type></time></attributes>`;
    if(m.mark) x += `<direction placement="above"><direction-type><rehearsal>${m.mark}</rehearsal></direction-type></direction>`;
    if(m.words) x += `<direction placement="above"><direction-type><words font-style="italic">${String(m.words).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</words></direction-type></direction>`;
    const barBeats = m.time ? m.time[0] : beats;
    const harms = jv3HarmAt(m.h, barBeats);
    const top = grand || d.staves !== 'bass' ? (m.t || `w:r`) : (m.b || 'w:r');
    const evs = jv3Events(top, 1, grand);
    let pos = 0, hi = 0;
    evs.forEach(ev => {
      while(hi < harms.length && harms[hi].at <= pos){ x += jv3Harmony(harms[hi].sym); hi++; }
      x += ev.xml; pos += ev.units;
    });
    while(hi < harms.length){ x += jv3Harmony(harms[hi].sym); hi++; }
    if(grand){
      x += `<backup><duration>${pos}</duration></backup>`;
      jv3Events(m.b || 'w:r', 2, true).forEach(ev => { x += ev.xml; });
    }
    return `<measure number="${i + 1}">${x}</measure>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">${grand ? '<!-- jz-grand-staff -->' : d.single ? '<!-- jz-single-staff -->' : ''}
<work><work-title>${String(d.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</work-title></work>
<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
<part id="P1">${measures}</part></score-partwise>`;
}
/* chord-symbol bars as slashes, one slash a beat */
/* a chart of slashes is a lead sheet, and a lead sheet is one staff: the
   grand-staff pass is told to leave it alone */
function jv3Slashes(bars, beats){
  const n = beats || 4;
  return bars.map(b => (typeof b === 'string' ? {h: b} : b)).map(b => Object.assign({t: Array(b.time ? b.time[0] : n).fill('q:/').join(' ')}, b));
}
/* a chord symbol's four-note voicing, spread from a lowest note — used
   where a builder needs "the chord" and the document names no voicing */
const jv3Seq = (list, dur) => list.map(n => `${dur}:${n}`).join(' ');

/* ---------- the builders ----------
   Each is {home, build(opts)} and returns MusicXML in its home key (or a
   list of {subtitle, xml} for an entry the document gives two versions
   of). Every one quotes the [Score] line it was written from. */
const JAZZ_V3_BUILD = {
  /* P0.1 — "Two whole notes on treble clef forming a harmonic interval.
     The app selects a random interval and root each time." The harmonic
     version of the room's melodic P0.1, for whichever distance is chosen. */
  harmonicInterval: {home:'C', build(o){
    const iv = (typeof JAZZ_INTERVALS === 'object' ? JAZZ_INTERVALS.indexOf((o && o.interval) || 'major3rd') : 3) + 1;
    const top = jazzSpellMidi(60 + Math.max(1, iv), 'C');
    const name = top.step + (top.alter === -1 ? 'b' : top.alter === 1 ? '#' : '') + top.octave;
    return jv3Score({staves:'treble', title:'Harmonic interval', measures:[{t:`w:C4+${name}`}]});
  }},
  /* 1.902 — "Eighth rest, eighth note on and-of-1 tied to quarter on beat 2, half rest." */
  reverseCharleston: {home:'C', build(){
    return jv3Score({staves:'treble', title:'Reverse Charleston', measures:[{t:'e:r e:C4~ q:C4 h:r'}]});
  }},
  /* 1.903–1.913 — "Treble and bass clef, 4/4. Swing eighth notes in right hand over steady quarter notes in left hand." */
  swingEighths: {home:'C', build(){
    return jv3Score({staves:'grand', title:'Swing eighth notes', measures:[
      {words:'Swing', t:jv3Seq(['C4','D4','E4','F4','G4','A4','B4','C5'], 'e'), b:jv3Seq(['C3','G2','C3','G2'], 'q')},
      {t:jv3Seq(['C5','B4','A4','G4','F4','E4','D4','C4'], 'e'), b:jv3Seq(['C3','G2','C3','G2'], 'q')}]});
  }},
  /* 2.1b — "RH: Dm7 2nd inversion (A-C-D-F), G7 root (G-B-D-F with F carried over), Cmaj7 2nd inversion (G-B-C-E)." */
  iiVIInversions: {home:'C', build(){
    return jv3Score({staves:'grand', title:'ii-V-I inversions', measures:[
      {h:'Dm7', t:'w:A3+C4+D4+F4', b:'w:D3'}, {h:'G7', t:'w:G3+B3+D4+F4', b:'w:G2'},
      {h:'Cmaj7', t:'w:G3+B3+C4+E4', b:'w:C3'}]});
  }},
  /* 2.1c — "Practice the ii-V-I progression through all 12 keys following the
     circle of 4ths: C, F, Bb, Eb, Ab, Db, Gb, B, E, A, D, G. Use smooth voice
     leading from 2.1b." Starting from the key chosen. */
  iiVIAllKeys: {home:'C', build(){
    const cyc = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'B', 'E', 'A', 'D', 'G'];
    const base = [{h:['D','m7'], t:[['A',3],['C',4],['D',4],['F',4]], b:[['D',3]]},
      {h:['G','7'], t:[['G',3],['B',3],['D',4],['F',4]], b:[['G',2]]},
      {h:['C','maj7'], t:[['G',3],['B',3],['C',4],['E',4]], b:[['C',3]]}];
    const name = sp => sp.step + (sp.alter === -1 ? 'b' : sp.alter === 1 ? '#' : '') ;
    const measures = [];
    cyc.forEach(k => {
      const semis = jv3Shift('C', k);
      let letters = ((JV3_LETTERS.indexOf(k.charAt(0)) - 0) % 7 + 7) % 7;
      if(semis < 0 && letters > 0) letters -= 7;
      const mv = ([l, o]) => { const sp = jv3MoveSpelled(l, 0, o, semis, letters); return name(sp) + sp.octave; };
      base.forEach((c, i) => {
        const root = jv3MoveSpelled(c.h[0], 0, 4, semis, letters);
        measures.push(Object.assign(i === 0 ? {mark: k.replace('b', '♭')} : {},
          {h: name(root) + c.h[1], t: 'w:' + c.t.map(mv).join('+'), b: 'w:' + c.b.map(mv).join('+')}));
      });
    });
    return jv3Score({staves:'grand', title:'ii-V-I, all twelve keys', measures});
  }},
  /* 2.4a — "LH: roots D, G, C. RH: Dm7 (C4-F4), G7 (F4-B4), Cmaj7 (B3-E4)." */
  shells73: {home:'C', build(){
    return jv3Score({staves:'grand', title:'Shells, 7-3', measures:[
      {h:'Dm7', t:'w:C4+F4', b:'w:D3'}, {h:'G7', t:'w:F4+B4', b:'w:G2'}, {h:'Cmaj7', t:'w:B3+E4', b:'w:C3'}]});
  }},
  /* 2.4b — "LH: roots. RH: three-note voicings — 3rd, 5th, 7th for each chord." */
  shellsWith5: {home:'C', build(){
    return jv3Score({staves:'grand', title:'Shells with the 5th', measures:[
      {h:'Dm7', t:'w:F4+A4+C5', b:'w:D3'}, {h:'G7', t:'w:B3+D4+F4', b:'w:G2'}, {h:'Cmaj7', t:'w:E4+G4+B4', b:'w:C3'}]});
  }},
  /* 3.4 — "Dm7: LH (D3-C4), RH (E4-F4-A4). G7: LH (G2-F3), RH (A3-B3-D4). Cmaj7: LH (C3-B3), RH (D4-E4-G4)." */
  fiveNoteTwoHanded: {home:'C', build(){
    return jv3Score({staves:'grand', title:'Five-note two-handed voicings', measures:[
      {h:'Dm7', t:'w:E4+F4+A4', b:'w:D3+C4'}, {h:'G7', t:'w:A3+B3+D4', b:'w:G2+F3'},
      {h:'Cmaj7', t:'w:D4+E4+G4', b:'w:C3+B3'}]});
  }},
  /* 4.1a–4.2 — "LH: Dm7 voiced as F-A-C-D (3-5-7-root), G7 as F-A-B-D (7-9-3-5), Cmaj7 as E-G-B-D (3-5-7-9). Compact spacing in the middle register." */
  oneHandedFour: {home:'C', build(){
    return jv3Score({staves:'grand', title:'One-handed voicings', measures:[
      {h:'Dm7', t:'w:r', b:'w:F3+A3+C4+D4'}, {h:'G7', t:'w:r', b:'w:F3+A3+B3+D4'},
      {h:'Cmaj7', t:'w:r', b:'w:E3+G3+B3+D4'}]});
  }},
  /* 2.901–4.903 — "Various rhythmic patterns applied to ii-V-I voicings. Charleston rhythm, syncopated comping, and walking bass patterns." */
  coordinationIIVI: {home:'C', build(){
    const v = {Dm7:'A3+C4+D4+F4', G7:'G3+B3+D4+F4', Cmaj7:'G3+B3+C4+E4'};
    const charl = c => `q:${v[c]}~ e:${v[c]} e:r h:r`;
    return jv3Score({staves:'grand', title:'Coordination on the ii-V-I', measures:[
      {words:'Whole notes', h:'Dm7', t:`w:${v.Dm7}`, b:'w:D3'}, {h:'G7', t:`w:${v.G7}`, b:'w:G2'}, {h:'Cmaj7', t:`w:${v.Cmaj7}`, b:'w:C3'},
      {words:'Charleston', h:'Dm7', t:charl('Dm7'), b:'w:D3'}, {h:'G7', t:charl('G7'), b:'w:G2'}, {h:'Cmaj7', t:charl('Cmaj7'), b:'w:C3'},
      {words:'Walking bass', h:'Dm7', t:`w:${v.Dm7}`, b:jv3Seq(['D3','E3','F3','F#3'], 'q')},
      {h:'G7', t:`w:${v.G7}`, b:jv3Seq(['G2','A2','B2','B2'], 'q')},
      {h:'Cmaj7', t:`w:${v.Cmaj7}`, b:jv3Seq(['C3','E3','G3','E3'], 'q')}]});
  }},
  /* 5.1b — "12 measures. LH: root whole notes following the blues form. RH: shell voicings (3-7) for F7, Bb7, C7." */
  bluesShells: {home:'F', build(){
    const sh = {F7:'A3+Eb4', Bb7:'Ab3+D4', C7:'Bb3+E4'}, rt = {F7:'F2', Bb7:'Bb2', C7:'C3'};
    const form = ['F7','F7','F7','F7','Bb7','Bb7','F7','F7','C7','Bb7','F7','C7'];
    return jv3Score({staves:'grand', fifths:-1, title:'Blues with shells',
      measures: form.map(c => ({h:c, t:`w:${sh[c]}`, b:`w:${rt[c]}`}))});
  }},
  /* 5.2–5.3 — "Jazz blues changes add ii-V motion: F7|Bb7|F7|Cm7 F7|Bb7|Bdim7|F7|Am7 D7|Gm7|C7|F7 D7|Gm7 C7. Quick-IV blues moves to IV in bar 2: F7|Bb7|F7|F7|Bb7|..." */
  bluesVariations: {home:'F', multi:true, build(){
    const jazz = ['F7','Bb7','F7','Cm7 F7','Bb7','Bdim7','F7','Am7 D7','Gm7','C7','F7 D7','Gm7 C7'];
    const quick = ['F7','Bb7','F7','F7','Bb7','Bb7','F7','F7','C7','Bb7','F7','C7'];
    return [{subtitle:'Jazz blues', xml: jv3Score({staves:'treble', single:true, fifths:-1, title:'Jazz blues', measures: jv3Slashes(jazz)})},
      {subtitle:'Quick-IV blues', xml: jv3Score({staves:'treble', single:true, fifths:-1, title:'Quick-IV blues', measures: jv3Slashes(quick)})}];
  }},
  /* 5.4 — "12 bars with chord symbols: Fmaj7|Em7b5 A7|Dm7|Cm7 F7|Bb7|Bbm7 Eb7|Am7 D7|Abm7 Db7|Gm7|C7|Fmaj7|Gm7 C7. Slash notation." */
  birdBlues: {home:'F', build(){
    return jv3Score({staves:'treble', single:true, fifths:-1, title:'Bird Blues', measures: jv3Slashes(
      ['Fmaj7','Em7b5 A7','Dm7','Cm7 F7','Bb7','Bbm7 Eb7','Am7 D7','Abm7 Db7','Gm7','C7','Fmaj7','Gm7 C7'])});
  }},
  /* 5.5 — "16 measures of slash notation with chord symbols. Bars 1-8 standard blues, bars 9-12 bridge (contrasting harmony), bars 13-16 return to blues turnaround." */
  bluesBridge: {home:'F', build(){
    const bars = jv3Slashes(['F7','F7','F7','F7','Bb7','Bb7','F7','F7',
      'Bb7','Bb7','Bbm7 Eb7','Am7 D7', 'Gm7','C7','F7 D7','Gm7 C7']);
    bars[0].mark = 'A'; bars[8].mark = 'Bridge'; bars[12].mark = 'Turnaround';
    return jv3Score({staves:'treble', single:true, fifths:-1, title:'Blues with a bridge', measures: bars});
  }},
  /* 5.901–5.903 — "LH: walking quarter notes (root-5th-root-approach) under each blues chord. RH: syncopated shell voicing hits." */
  bluesCoordination: {home:'F', build(){
    const sh = {F7:'A3+Eb4', Bb7:'Ab3+D4', C7:'Bb3+E4'};
    const walk = {F7:['F2','C3','F2'], Bb7:['Bb2','F2','Bb2'], C7:['C3','G2','C3']};
    const below = {F7:'E2', Bb7:'A2', C7:'B2'};
    const form = ['F7','F7','F7','F7','Bb7','Bb7','F7','F7','C7','Bb7','F7','C7'];
    return jv3Score({staves:'grand', fifths:-1, title:'Blues coordination', measures: form.map((c, i) => {
      const next = form[(i + 1) % 12];
      return {h:c, t:`q:${sh[c]} e:r e:${sh[c]} h:r`, b: jv3Seq(walk[c].concat(below[next]), 'q')};
    })});
  }},
  /* Slash Chords — "Grand staff, 4 measures showing common slash chords: C/E, F/G, Db/C, Ab/Bb." */
  slashChords: {home:'C', build(){
    return jv3Score({staves:'grand', title:'Slash chords', measures:[
      {h:'C/E', t:'w:C4+E4+G4', b:'w:E3'}, {h:'F/G', t:'w:C4+F4+A4', b:'w:G2'},
      {h:'Db/C', t:'w:Db4+F4+Ab4', b:'w:C3'}, {h:'Ab/Bb', t:'w:C4+Eb4+Ab4', b:'w:Bb2'}]});
  }},
  /* Melodic Soprano Voice Leading — "4 measures showing smooth soprano line over Dm7-G7-Cmaj7-Am7, with the top voice moving stepwise: C-B-B-C." */
  sopranoLine: {home:'C', build(){
    return jv3Score({staves:'grand', title:'The soprano line', measures:[
      {h:'Dm7', t:'w:F4+A4+C5', b:'w:D3'}, {h:'G7', t:'w:F4+G4+B4', b:'w:G2'},
      {h:'Cmaj7', t:'w:E4+G4+B4', b:'w:C3'}, {h:'Am7', t:'w:E4+G4+C5', b:'w:A2'}]});
  }},
  /* 7B.901–7B.903 — "4 measures of comping in C minor: Cm(maj7) | Cm7 | Dm7b5 | G7alt with syncopated rhythms." */
  minorComping: {home:'C', build(){
    const hit = v => `q:${v} e:r e:${v} h:r`;
    return jv3Score({staves:'grand', fifths:-3, title:'Minor comping', measures:[
      {h:'Cm(maj7)', t:hit('Eb4+G4+B4+D5'), b:'w:C3'}, {h:'Cm7', t:hit('Eb4+G4+Bb4+D5'), b:'w:C3'},
      {h:'Dm7b5', t:hit('C4+F4+Ab4'), b:'w:D3'}, {h:'G7alt', t:hit('B3+F4+Ab4+Eb5'), b:'w:G2'}]});
  }},
  /* 7C.902-7C.905 — "Full 32-bar form with chord symbols and slash notation." The document's example is the A section; this is the whole AABA. */
  rhythmChanges: {home:'Bb', build(){
    const A = ['Bbmaj7 G7','Cm7 F7','Dm7 G7','Cm7 F7','Fm7 Bb7','Ebmaj7 Ab7','Dm7 G7','Cm7 F7'];
    const B = ['D7','D7','G7','G7','C7','C7','F7','F7'];
    const bars = jv3Slashes(A.concat(A, B, A));
    bars[0].mark = 'A'; bars[8].mark = 'A'; bars[16].mark = 'B'; bars[24].mark = 'A';
    return jv3Score({staves:'treble', single:true, fifths:-2, title:'Rhythm changes', measures: bars});
  }},
  /* Chromatic Descent Ending — "4 chords descending by half-step to final chord: Dmaj7 - Dbmaj7 - Cmaj7 - Bmaj7 resolving to Bbmaj7." */
  chromaticDescentEnding: {home:'Bb', build(){
    return jv3Score({staves:'grand', fifths:-2, title:'Chromatic descent ending', measures:[
      {h:'Dmaj7 Dbmaj7', t:'h:C#4+E4+F#4+A4 h:C4+Eb4+F4+Ab4', b:'h:D3 h:Db3'},
      {h:'Cmaj7 Bmaj7', t:'h:B3+D4+E4+G4 h:A#3+C#4+D#4+F#4', b:'h:C3 h:B2'},
      {h:'Bbmaj7', t:'w:A3+C4+D4+F4!', b:'w:Bb2!'}]});
  }},
  /* Barry Harris Application — "4 measures of ascending C6 diminished scale in quarter notes with alternating harmony." */
  bhApplication: {home:'C', build(){ return jv3BarryHarris(['C4','D4','E4','F4','G4','Ab4','A4','B4','C5','D5','E5','F5','G5','Ab5','A5','B5'], 'q', 'C6 diminished, harmonised'); }},
  /* 4H Exercise 1 — "Play the C6 diminished scale ascending and descending." */
  bhScale: {home:'C', build(){
    return jv3Score({staves:'treble', title:'C6 diminished scale', measures:[
      {h:'C6', t: jv3Seq(['C4','D4','E4','F4','G4','Ab4','A4','B4'], 'e')},
      {t: jv3Seq(['C5','B4','A4','Ab4','G4','F4','E4','D4'], 'e')}, {t:'w:C4'}]});
  }},
  /* 4H Exercise 2 — "Harmonize each note of the scale — notes from C6 get C6 voicing, notes from dim7 get Bdim7 voicing." */
  bhHarmonised: {home:'C', build(){ return jv3BarryHarris(['C5','D5','E5','F5','G5','Ab5','A5','B5','C6'], 'q', 'Each note harmonised'); }},
  /* 4H Exercise 3 — "take a simple melody and harmonize every note using the alternating 6th/dim system" */
  bhMelody: {home:'C', build(){
    const mel = [['E5','q'],['D5','q'],['C5','q'],['D5','q'], ['E5','q'],['E5','q'],['E5','h'],
      ['D5','q'],['D5','q'],['D5','h'], ['E5','q'],['G5','q'],['G5','h']];
    return jv3BarryHarrisRhythm(mel, 'A simple melody, harmonised');
  }},
  /* 4H Exercise 4 — "use the Bb6 diminished scale over the A section of Rhythm Changes" */
  bhRhythmChanges: {home:'Bb', build(){
    const A = ['Bbmaj7 G7','Cm7 F7','Dm7 G7','Cm7 F7','Fm7 Bb7','Ebmaj7 Ab7','Dm7 G7','Cm7 F7'];
    const up = ['Bb4','C5','D5','Eb5','F5','Gb5','G5','A5'], down = ['Bb5','A5','G5','Gb5','F5','Eb5','D5','C5'];
    return jv3Score({staves:'treble', fifths:-2, title:'B\u266d6 diminished over the A section',
      measures: A.map((h, i) => ({h, t: jv3Seq(i % 2 ? down : up, 'e')}))});
  }},
  /* Octatonic Voicings — "Octatonic voicings over C7: stacking notes from C half-whole diminished scale." The four major triads the scale contains, over the same shell. */
  octatonicVoicing: {home:'C', build(){
    return jv3Score({staves:'grand', title:'Octatonic voicings over C7', measures:[
      {h:'C7', t:'w:C4+E4+G4', b:'w:C3+Bb3'}, {h:'C7#9', t:'w:Eb4+G4+Bb4', b:'w:C3+Bb3'},
      {h:'C7b9#11', t:'w:F#4+A#4+C#5', b:'w:C3+Bb3'}, {h:'C13b9', t:'w:A4+C#5+E5', b:'w:C3+Bb3'}]});
  }},
  /* Double Time Feel — "2 bars at regular tempo followed by 2 bars in double-time feel." */
  doubleTime: {home:'C', build(){
    return jv3Score({staves:'treble', title:'Double time feel', measures:[
      {words:'Regular', h:'Dm7', t: jv3Seq(['D4','F4','A4','C5'], 'q')}, {h:'G7', t: jv3Seq(['B4','A4','G4','F4'], 'q')},
      {words:'Double time', h:'Dm7', t: jv3Seq(['D4','E4','F4','G4','A4','C5','B4','A4'], 'e')},
      {h:'G7', t: jv3Seq(['G4','A4','B4','D5','F5','E5','D5','B4'], 'e')}]});
  }},
  /* Kenny Barron Pattern — "2 bars of characteristic Barron melodic pattern over Dm7." Pentatonic fragments with chromatic approach notes. */
  kennyBarron: {home:'D', build(){
    return jv3Score({staves:'treble', title:'In the manner of Kenny Barron', measures:[
      {h:'Dm7', t: jv3Seq(['G#4','A4','C5','D5','E5','F5','D5','C5'], 'e')},
      {t: jv3Seq(['B4','C5','A4','G4','F4','E4'], 'e') + ' q:D4'}]});
  }},
  /* Oscar Peterson Pattern — "2 bars of blues-inflected Peterson-style run over F7." */
  oscarPeterson: {home:'F', build(){
    return jv3Score({staves:'treble', fifths:-1, title:'In the manner of Oscar Peterson', measures:[
      {h:'F7', t: jv3Seq(['F4','Ab4','A4','C5','Eb5','F5','Ab5','A5'], 'e')},
      {t: jv3Seq(['F5','Eb5','C5','A4','Ab4','F4'], 'e') + ' q:F3'}]});
  }},
  /* 8.1-8.2 — "8 bars of Dm7 with slash notation." The document's example is four; this is the eight. */
  modalBasics: {home:'D', build(){
    return jv3Score({staves:'treble', single:true, title:'Modal: eight bars of Dm7', measures: jv3Slashes(Array(8).fill('Dm7'))});
  }},
  /* Modal Jazz Basics — Notation — "D Dorian ascending and descending over Dm7." */
  dorianOverDm7: {home:'D', build(){
    return jv3Score({staves:'treble', title:'D Dorian over Dm7', measures:[
      {h:'Dm7', t: jv3Seq(['D4','E4','F4','G4','A4','B4','C5','D5'], 'e')},
      {t: jv3Seq(['D5','C5','B4','A4','G4','F4','E4','D4'], 'e')}]});
  }},
  /* Complementary Voicings — Notation — "Two voicings of Dm7 with common tones highlighted." The same five tones, the hands swapping which they hold. */
  complementary: {home:'D', build(){
    return jv3Score({staves:'grand', title:'Complementary voicings of Dm7', measures:[
      {h:'Dm9', words:'LH 1-5, RH 7-9-3', t:'w:C4+E4+F4', b:'w:D3+A3'},
      {h:'Dm9', words:'LH 3-7, RH 9-5-1', t:'w:E4+A4+D5', b:'w:F3+C4'}]});
  }},
  /* the three pentatonics Siskind Book 3 Unit 5 adds — "C melodic minor pentatonic ascending", "C dominant pentatonic ascending", "C flat-sixth pentatonic ascending" */
  pentatonic: {home:'C', build(o, args){
    const kind = (args && args[0]) || 'dominant';
    const set = {melodicMinor: ['Cm(maj7)', ['C4','D4','Eb4','G4','A4','C5']],
      dominant: ['C7', ['C4','D4','E4','G4','Bb4','C5']],
      flatSix: ['C7b13', ['C4','D4','E4','G4','Ab4','C5']]}[kind];
    return jv3Score({staves:'treble', title:`${kind} pentatonic`, measures:[
      {h:set[0], t: jv3Seq(set[1], 'e') + ' q:r'}]});
  }},
  /* MP1-MP10 — "2 bars of Dorian 3rds pattern ascending." */
  dorianThirds: {home:'D', build(){
    return jv3Score({staves:'treble', title:'Dorian in thirds', measures:[
      {h:'Dm7', t: jv3Seq(['D4','F4','E4','G4','F4','A4','G4','B4'], 'e')},
      {t: jv3Seq(['A4','C5','B4','D5','C5','E5'], 'e') + ' q:D5'}]});
  }},
  /* Basic Reharmonization — Applied — "3 versions of ii-V-I with progressive reharmonization." Dm7-G7-Cmaj7; Dm7-Db7-Cmaj7; Dm7-Ab7-Db7-Cmaj7. */
  reharmApplied: {home:'C', build(){
    const v = {Dm7:'F4+C5+E5', G7:'F4+B4+E5', Db7:'F4+B4+Eb5', Ab7:'Gb4+C5+F5', Cmaj7:'E4+B4+D5'};
    return jv3Score({staves:'grand', title:'Reharmonising a ii-V-I', measures:[
      {words:'Original', h:'Dm7', t:`w:${v.Dm7}`, b:'w:D3'}, {h:'G7', t:`w:${v.G7}`, b:'w:G2'}, {h:'Cmaj7', t:`w:${v.Cmaj7}`, b:'w:C3'},
      {words:'Tritone substitution', h:'Dm7', t:`w:${v.Dm7}`, b:'w:D3'}, {h:'Db7', t:`w:${v.Db7}`, b:'w:Db3'}, {h:'Cmaj7', t:`w:${v.Cmaj7}`, b:'w:C3'},
      {words:'With an inserted chord', h:'Dm7', t:`w:${v.Dm7}`, b:'w:D3'},
      {h:'Ab7 Db7', t:`h:${v.Ab7} h:${v.Db7}`, b:'h:Ab2 h:Db3'}, {h:'Cmaj7', t:`w:${v.Cmaj7}`, b:'w:C3'}]});
  }},
  /* Singer-Songwriter Reharmonization — Notation — "8 bars with two-handed voicings for reharmonized pop progression." C|Am|F|G, then C|A7|Dm Db7|C. */
  songwriterVoiced: {home:'C', build(){
    return jv3Score({staves:'grand', title:'The pop progression, reharmonised', measures:[
      {words:'As written', h:'C', t:'w:E4+G4+C5', b:'w:C3+G3'}, {h:'Am', t:'w:C4+E4+A4', b:'w:A2+E3'},
      {h:'F', t:'w:A3+C4+F4', b:'w:F2+C3'}, {h:'G', t:'w:B3+D4+G4', b:'w:G2+D3'},
      {words:'Reharmonised', h:'C', t:'w:E4+G4+C5', b:'w:C3+G3'}, {h:'A7', t:'w:C#4+E4+G4', b:'w:A2+E3'},
      {h:'Dm Db7', t:'h:D4+F4+A4 h:F4+Ab4+B4', b:'h:D3+A3 h:Db3+Ab3'}, {h:'C', t:'w:E4+G4+C5', b:'w:C3+G3'}]});
  }},
  /* 9.901 — "4 bars of comping over a standard with real-time reharmonization choices annotated." The first four bars of Autumn Leaves, reharmonised as the document's 9.1 does it. */
  reharmComping: {home:'Bb', build(){
    const hit = v => `q:${v} e:r e:${v} h:r`;
    return jv3Score({staves:'grand', fifths:-2, title:'Comping, reharmonising as you go', measures:[
      {words:'Cm9 for Cm7', h:'Cm9', t:hit('Eb4+Bb4+D5'), b:'w:C3'},
      {words:'B7: the tritone sub for F7', h:'B7', t:hit('D#4+A4+C#5'), b:'w:B2'},
      {words:'A7alt leads to Ab by half step', h:'Bbmaj9 A7alt', t:'h:D4+A4+C5 h:C#4+G4+Bb4', b:'h:Bb2 h:A2'},
      {words:'Abmaj7#11 for Ebmaj7', h:'Abmaj7#11', t:hit('C4+G4+D5'), b:'w:Ab2'}]});
  }},
  /* Diminished Voicings & Half-Step Preparation — "Diminished approach: Bdim7 resolving to Cmaj7 by half-step voice leading." */
  dimApproach: {home:'C', build(){
    return jv3Score({staves:'grand', title:'The diminished approach', measures:[
      {h:'Bdim7', t:'w:D4+F4+Ab4+B4', b:'w:B2'}, {h:'Cmaj7', t:'w:C4+E4+G4+B4', b:'w:C3'}]});
  }},
  /* Modern Piano Devices — "2 bars showing parallel tenths in RH over LH voicing." */
  parallelTenths: {home:'C', build(){
    return jv3Score({staves:'grand', title:'Parallel tenths', measures:[
      {h:'Cmaj7', t:'q:C4+E5 q:D4+F5 q:E4+G5 q:F4+A5', b:'w:C3+E3+B3'},
      {h:'Cmaj7', t:'q:G4+B5 q:F4+A5 q:E4+G5 q:D4+F5', b:'w:C3+E3+B3'}]});
  }}
};
/* Barry Harris: each melody note on top of the chord it belongs to, in
   close position — C6 (C E G A) under a note of C6, B diminished (B D F
   Ab) under a note of the diminished chord. */
const JV3_C6 = [0, 4, 7, 9], JV3_DIM = [2, 5, 8, 11];
function jv3BhChord(topName){
  const top = jv3MidiOf(topName);
  const set = JV3_C6.includes(top % 12) ? JV3_C6 : JV3_DIM;
  const below = [];
  for(let m = top - 1; below.length < 3; m--) if(set.includes(((m % 12) + 12) % 12)) below.push(m);
  const nm = x => { const s = jazzSpellMidi(x, 'C'); return s.step + (s.alter === -1 ? 'b' : s.alter === 1 ? '#' : '') + s.octave; };
  return {notes: below.reverse().map(nm).concat(topName), sym: set === JV3_C6 ? 'C6' : 'Bdim7'};
}
function jv3BarryHarris(tops, dur, title){
  const per = 16 / JV3_DUR[dur], measures = [];
  for(let i = 0; i < tops.length; i += per){
    const chunk = tops.slice(i, i + per);
    const chords = chunk.map(jv3BhChord);
    const units = JV3_DUR[dur] / 4;
    measures.push({h: chords.map((c, j) => [c.sym, j * units]),
      t: chords.map(c => `${dur}:${c.notes.join('+')}`).join(' ') + (chunk.length < per ? ` ${'q:r '.repeat(per - chunk.length).trim()}` : '')});
  }
  return jv3Score({staves:'treble', title, measures});
}
function jv3BarryHarrisRhythm(mel, title){
  const measures = []; let cur = null, pos = 0;
  mel.forEach(([n, d]) => {
    if(!cur || pos >= 16){ cur = {h: [], t: []}; measures.push(cur); pos = 0; }
    const c = jv3BhChord(n);
    cur.h.push([c.sym, pos / 4]); cur.t.push(`${d}:${c.notes.join('+')}`); pos += JV3_DUR[d];
  });
  measures.forEach(m => m.t = m.t.join(' '));
  return jv3Score({staves:'treble', title, measures});
}

/* ---------- what the exercise page asks for ---------- */
const _jv3Built = {};
function jazzV3Built(name, args, opts){
  const b = JAZZ_V3_BUILD[name];
  if(!b) return null;
  const k = name + '|' + JSON.stringify(args || []) + '|' + ((opts && opts.interval) || '');
  if(!_jv3Built[k]) _jv3Built[k] = b.build(opts || {}, args || []);
  return _jv3Built[k];
}
const jv3Gs = x => typeof jazzGrandStaff === 'function' ? jazzGrandStaff(x) : x;
function jazzV3ScoreXml(ex, key, opts){
  if(!ex) return null;
  if(ex.v3gen){
    const b = JAZZ_V3_BUILD[ex.v3gen];
    if(!b) return null;
    const home = b.home || 'C';
    const built = jazzV3Built(ex.v3gen, ex.v3args, opts);
    const move = x => jv3Gs(jazzTransposeXml(x, home, key));
    const docs = Array.isArray(built) ? built.map(d => ({subtitle: d.subtitle, mxl: move(d.xml)}))
      : [{subtitle: 'From the [Score] description', mxl: move(built)}];
    if(ex.xmlSample) docs.push({subtitle: 'The document\u2019s own example',
      mxl: jv3Lead(jazzTransposeXml(ex.xmlSample, ex.home || home, key))});
    return docs.length > 1 ? {title: ex.name, documents: docs} : docs[0].mxl;
  }
  if(ex.xml) return jv3Lead(jazzTransposeXml(ex.xml, ex.home || 'C', key));
  return null;
}
/* the document's own slash-notation charts are lead sheets too: one staff,
   and marked as one on purpose, so nothing downstream mistakes it for a
   piano score that lost its bass clef */
const jv3Lead = x => /<notehead>slash<\/notehead>/.test(x || '') && !/<staves>/.test(x || '')
  ? (/jz-single-staff/.test(x) ? x : x.replace(/(<score-partwise[^>]*>)/, '$1<!-- jz-single-staff: lead sheet -->')) : jv3Gs(x);
/* the document's version, drawn beside the room's generator */
function jazzV3TabXml(ex, key, opts){
  const t = ex && ex.v3tab;
  if(!t) return null;
  if(t.gen){
    const b = JAZZ_V3_BUILD[t.gen]; if(!b) return null;
    return jv3Gs(jazzTransposeXml(jazzV3Built(t.gen, t.args, opts), b.home || 'C', key));
  }
  if(ex.xmlSample) return jv3Lead(jazzTransposeXml(ex.xmlSample, t.home || ex.home || 'C', key));
  return null;
}
