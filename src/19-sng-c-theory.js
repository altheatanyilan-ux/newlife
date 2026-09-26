/* ============================================================
   SONGWRITING STUDIO — THE THEORY UNDER THE TOOLS

   Plain functions of plain data: key colours and their chords, Roman
   numerals both ways, voicings (triad, add2, shells, rootless, stacked
   gospel, and the tensions a chord's scale allows), the Chord-Scale Map,
   and the emotion presets the melody generator starts from. Nothing here
   draws or sounds; everything is rule-based and can be read.

   The Chord-Scale Map is general jazz chord-scale pedagogy, not taken
   from the curriculum's books (they contribute only the pentatonic, blues,
   Mixolydian and Dorian lessons of Kachulis, Melody Unit IV).
   ============================================================ */
const SNG_NOTE_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const SNG_SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const sngPc = n => ((n % 12) + 12) % 12;
const sngNoteName = (pc, sharps) => (sharps ? SNG_SHARP_NAMES : SNG_NOTE_NAMES)[sngPc(pc)];
/* "C3", "F#4", "Bb2" → MIDI (C4 = 60) */
function sngMidiOf(name){
  const m = String(name || '').trim().match(/^([A-Ga-g])\s*([#♯b♭]?)\s*(-?\d)$/);
  if(!m) return null;
  const base = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11}[m[1].toUpperCase()];
  const acc = m[2] === '#' || m[2] === '♯' ? 1 : m[2] === 'b' || m[2] === '♭' ? -1 : 0;
  return 12 * (+m[3] + 1) + base + acc;
}
const sngMidiName = m => sngNoteName(m) + (Math.floor(m / 12) - 1);

/* ---------- key colours (Kachulis, Harmony Units I–III) ---------- */
/* each chord: roman, intervals above the key's tonic, function T / PD / D */
const SNG_KEY_COLOURS = {
  major: {name: 'Major', mood: 'bright, settled', scale: [0, 2, 4, 5, 7, 9, 11], chords: [
    ['I', [0, 4, 7], 'T'], ['ii', [2, 5, 9], 'PD'], ['iii', [4, 7, 11], 'T'], ['IV', [5, 9, 0], 'PD'], ['V', [7, 11, 2], 'D'], ['vi', [9, 0, 4], 'T'], ['vii°', [11, 2, 5], 'D']]},
  minor: {name: 'Minor', mood: 'dark, inward', scale: [0, 2, 3, 5, 7, 8, 10], chords: [
    ['i', [0, 3, 7], 'T'], ['ii°', [2, 5, 8], 'PD'], ['♭III', [3, 7, 10], 'T'], ['iv', [5, 8, 0], 'PD'], ['v', [7, 10, 2], 'D'], ['♭VI', [8, 0, 3], 'PD'], ['♭VII', [10, 2, 5], 'D'], ['V', [7, 11, 2], 'D']]},
  mixolydian: {name: 'Mixolydian', mood: 'earthy, rock-and-roll', scale: [0, 2, 4, 5, 7, 9, 10], chords: [
    ['I', [0, 4, 7], 'T'], ['ii', [2, 5, 9], 'PD'], ['iii°', [4, 7, 10], 'T'], ['IV', [5, 9, 0], 'PD'], ['v', [7, 10, 2], 'D'], ['vi', [9, 0, 4], 'T'], ['♭VII', [10, 2, 5], 'D']]},
  dorian: {name: 'Dorian', mood: 'cool, soulful minor', scale: [0, 2, 3, 5, 7, 9, 10], chords: [
    ['i', [0, 3, 7], 'T'], ['ii', [2, 5, 9], 'PD'], ['♭III', [3, 7, 10], 'T'], ['IV', [5, 9, 0], 'PD'], ['v', [7, 10, 2], 'D'], ['vi°', [9, 0, 3], 'T'], ['♭VII', [10, 2, 5], 'D']]},
  blues: {name: 'Blues', mood: 'gritty, knowing', scale: [0, 3, 5, 6, 7, 10], chords: [
    ['I7', [0, 4, 7, 10], 'T'], ['IV7', [5, 9, 0, 3], 'PD'], ['V7', [7, 11, 2, 5], 'D'], ['♭III', [3, 7, 10], 'T'], ['♭VII', [10, 2, 5], 'D']]},
};
/* borrowed and outside colours for the palette (Kachulis, Harmony VIII) */
const SNG_OUTSIDE = [['iv', [5, 8, 0], 'PD', 'borrowed from minor'], ['♭VI', [8, 0, 3], 'PD', 'borrowed from minor'], ['♭VII', [10, 2, 5], 'D', 'borrowed from Mixolydian'],
  ['II', [2, 6, 9], 'D', 'V of V'], ['III', [4, 8, 11], 'D', 'V of vi'], ['VI', [9, 1, 4], 'D', 'V of ii'], ['I7', [0, 4, 7, 10], 'D', 'V of IV'], ['♭III', [3, 7, 10], 'T', 'borrowed from minor']];
/* A chord as the room keeps it: {roman, root (semitones above the key's
   tonic), quality ('maj'|'min'|'dim'|'aug'|'7'|'maj7'|'m7'|'m7b5'|'dim7'|'sus4'|'7sus4'|'6'|'m6'), fn}.
   Roman numerals parse both ways: "♭VII", "bVII", "ii7", "V7", "viiø7", "IVmaj7". */
const SNG_ROMAN_DEG = {I: 0, II: 2, III: 4, IV: 5, V: 7, VI: 9, VII: 11};
function sngParseRoman(r){
  const m = String(r || '').trim().match(/^([♭b#♯]?)(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(°|ø|\+)?(maj7|Maj7|M7|7sus4|sus4|m7b5|dim7|7|6|9|13|add2|add9)?$/);
  if(!m) return null;
  const upper = m[2] === m[2].toUpperCase();
  let root = SNG_ROMAN_DEG[m[2].toUpperCase()] + (m[1] === '♭' || m[1] === 'b' ? -1 : m[1] === '#' || m[1] === '♯' ? 1 : 0);
  const ext = m[4] || '';
  let quality = upper ? 'maj' : 'min';
  if(m[3] === '°') quality = ext === '7' || ext === 'dim7' ? 'dim7' : 'dim';
  else if(m[3] === 'ø') quality = 'm7b5';
  else if(m[3] === '+') quality = 'aug';
  if(ext === 'maj7' || ext === 'Maj7' || ext === 'M7') quality = upper ? 'maj7' : 'mMaj7';
  else if(ext === '7') quality = m[3] ? quality : upper ? '7' : 'm7';
  else if(ext === 'm7b5') quality = 'm7b5';
  else if(ext === '7sus4') quality = '7sus4';
  else if(ext === 'sus4') quality = 'sus4';
  else if(ext === '6') quality = upper ? '6' : 'm6';
  else if(ext === '9') quality = upper ? '9' : 'm9';
  else if(ext === '13') quality = '13';
  else if(ext === 'add2' || ext === 'add9') quality = upper ? 'add2' : 'madd2';
  return {roman: String(r).replace(/^b/, '♭').replace(/^#/, '♯'), root: sngPc(root), quality};
}
const SNG_QUALITY = {maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8], '7': [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], mMaj7: [0, 3, 7, 11],
  m7b5: [0, 3, 6, 10], dim7: [0, 3, 6, 9], sus4: [0, 5, 7], '7sus4': [0, 5, 7, 10], '6': [0, 4, 7, 9], m6: [0, 3, 7, 9], '9': [0, 4, 7, 10, 14], m9: [0, 3, 7, 10, 14],
  '13': [0, 4, 7, 10, 14, 21], add2: [0, 2, 4, 7], madd2: [0, 2, 3, 7]};
const SNG_QUALITY_SUFFIX = {maj: '', min: 'm', dim: '°', aug: '+', '7': '7', maj7: 'maj7', m7: 'm7', mMaj7: 'm(maj7)', m7b5: 'm7♭5', dim7: '°7', sus4: 'sus4', '7sus4': '7sus4',
  '6': '6', m6: 'm6', '9': '9', m9: 'm9', '13': '13', add2: 'add2', madd2: 'm(add2)'};
/* a chord from its intervals above the tonic (as the key-colour lists hold them) */
function sngChordFromIntervals(roman, iv, fn){
  const root = iv[0], rel = iv.map(x => sngPc(x - root)).sort((a, b) => a - b).join(',');
  const q = {'0,4,7': 'maj', '0,3,7': 'min', '0,3,6': 'dim', '0,4,8': 'aug', '0,4,7,10': '7', '0,4,7,11': 'maj7', '0,3,7,10': 'm7', '0,3,6,10': 'm7b5'}[rel] || 'maj';
  return {roman, root: sngPc(root), quality: q, fn: fn || null};
}
function sngChordName(ch, keyPc){ return sngNoteName(keyPc + ch.root) + (SNG_QUALITY_SUFFIX[ch.quality] || ''); }
/* the palette of a key colour, plus the outside colours */
function sngPalette(colour){
  const kc = SNG_KEY_COLOURS[colour] || SNG_KEY_COLOURS.major;
  return kc.chords.map(([r, iv, fn]) => sngChordFromIntervals(r, iv, fn));
}
function sngOutsidePalette(){ return SNG_OUTSIDE.map(([r, iv, fn, why]) => Object.assign(sngChordFromIntervals(r, iv, fn), {why})); }

/* ---------- voicings ---------- */
/* MIDI notes for a chord in a key, voiced one of the Chord Lab's ways, kept
   round middle C and led smoothly from `prev` when given */
const SNG_VOICINGS = [['triad', 'Triad'], ['add2', 'Add2'], ['shell', 'Shells (1-3-7)'], ['rootless', 'Rootless (3-5-7-9)'], ['stacked', 'Stacked gospel'], ['tension', 'Tensions from its scale']];
function sngVoice(ch, keyPc, type, prev, scale){
  const root = sngPc(keyPc + ch.root);
  const q = SNG_QUALITY[ch.quality] || SNG_QUALITY.maj;
  const third = q.includes(4) ? 4 : q.includes(3) ? 3 : q.includes(5) ? 5 : 4;
  const fifth = q.includes(6) ? 6 : q.includes(8) ? 8 : 7;
  const hasSev = q.find(x => x === 10 || x === 11 || x === 9 && ch.quality.includes('dim'));
  const sev = hasSev != null ? hasSev : (third === 3 ? 10 : ch.quality === 'maj' ? 11 : 10);
  let iv;
  switch(type){
    case 'add2': iv = [0, 2, third, fifth]; break;
    case 'shell': iv = [0, third, sev]; break;
    case 'rootless': iv = [third, fifth, sev, 14]; break;
    case 'stacked': iv = [0, 7, 12 + third, 12 + sev, 24 + 2, 24 + (third === 4 ? 4 : 3)]; break;
    case 'tension': { const t = (scale && scale.tensions && scale.tensions.length) ? scale.tensions : [14];
      iv = [third, sev].concat(t.slice(0, 2).map(x => x < 12 ? x + 12 : x)); break; }
    default: iv = q.slice(0, ch.quality === '7' || ch.quality.includes('7') ? 4 : 3);
  }
  /* place round C4–C5, then move each voice to be nearest the last chord */
  let notes = iv.map(x => 60 + sngPc(root - 0) + x).map(n => n > 76 ? n - 12 : n);
  if(prev && prev.length){
    const c = prev.reduce((a, b) => a + b, 0) / prev.length;
    const shift = [-12, 0, 12].reduce((best, s) => { const m = notes.reduce((a, b) => a + b + s, 0) / notes.length; return Math.abs(m - c) < Math.abs(best.m - c) ? {s, m} : best; }, {s: 0, m: Infinity}).s;
    notes = notes.map(n => n + shift);
  }
  return notes.sort((a, b) => a - b);
}
const sngBassNote = (ch, keyPc) => 36 + sngPc(keyPc + ch.root);

/* ---------- the Chord-Scale Map ---------- */
/* degrees are semitones above the chord's root */
const SNG_SCALES = {
  ionian:      {name: 'Ionian (major)', deg: [0, 2, 4, 5, 7, 9, 11], tensions: [14, 21], avoid: [5], colour: 11, mood: 'settled, sunny'},
  lydian:      {name: 'Lydian', deg: [0, 2, 4, 6, 7, 9, 11], tensions: [14, 18, 21], avoid: [], colour: 6, mood: 'dreamy, modern'},
  majPent:     {name: 'Major pentatonic', deg: [0, 2, 4, 7, 9], tensions: [14], avoid: [], colour: 9, mood: 'open, singable'},
  mixolydian:  {name: 'Mixolydian', deg: [0, 2, 4, 5, 7, 9, 10], tensions: [14, 21], avoid: [5], colour: 10, mood: 'earthy, bluesy-bright'},
  bebopDom:    {name: 'Bebop dominant', deg: [0, 2, 4, 5, 7, 9, 10, 11], tensions: [14, 21], avoid: [5], colour: 11, mood: 'swinging, chromatic'},
  lydianDom:   {name: 'Lydian dominant', deg: [0, 2, 4, 6, 7, 9, 10], tensions: [14, 18, 21], avoid: [], colour: 6, mood: 'bright tension that does not need to resolve'},
  altered:     {name: 'Altered', deg: [0, 1, 3, 4, 6, 8, 10], tensions: [13, 15, 18, 20], avoid: [], colour: 8, mood: 'maximum pull home'},
  halfWhole:   {name: 'Half-whole diminished', deg: [0, 1, 3, 4, 6, 7, 9, 10], tensions: [13, 15, 18, 21], avoid: [], colour: 1, mood: 'crunchy, symmetrical'},
  wholeTone:   {name: 'Whole tone', deg: [0, 2, 4, 6, 8, 10], tensions: [14, 18, 20], avoid: [], colour: 8, mood: 'floating, unresolved'},
  phrygianDom: {name: 'Phrygian dominant', deg: [0, 1, 4, 5, 7, 8, 10], tensions: [13, 20], avoid: [5], colour: 8, mood: 'exotic, pulls to minor'},
  dorian:      {name: 'Dorian', deg: [0, 2, 3, 5, 7, 9, 10], tensions: [14, 17, 21], avoid: [], colour: 9, mood: 'cool, soulful'},
  phrygian:    {name: 'Phrygian', deg: [0, 1, 3, 5, 7, 8, 10], tensions: [17], avoid: [1, 8], colour: 1, mood: 'dark, Spanish'},
  aeolian:     {name: 'Aeolian (natural minor)', deg: [0, 2, 3, 5, 7, 8, 10], tensions: [14, 17], avoid: [8], colour: 8, mood: 'sad, plain'},
  minPent:     {name: 'Minor pentatonic', deg: [0, 3, 5, 7, 10], tensions: [17], avoid: [], colour: 10, mood: 'bluesy, direct'},
  melMinor:    {name: 'Melodic minor', deg: [0, 2, 3, 5, 7, 9, 11], tensions: [14, 17, 21], avoid: [], colour: 11, mood: 'bittersweet, sophisticated'},
  harmMinor:   {name: 'Harmonic minor', deg: [0, 2, 3, 5, 7, 8, 11], tensions: [14, 17], avoid: [8], colour: 11, mood: 'dramatic, old-world'},
  locrian:     {name: 'Locrian', deg: [0, 1, 3, 5, 6, 8, 10], tensions: [17, 20], avoid: [1], colour: 6, mood: 'unstable, shadowed'},
  locrian2:    {name: 'Locrian ♮2', deg: [0, 2, 3, 5, 6, 8, 10], tensions: [14, 17, 20], avoid: [], colour: 2, mood: 'smoother half-diminished'},
  wholeHalf:   {name: 'Whole-half diminished', deg: [0, 2, 3, 5, 6, 8, 9, 11], tensions: [14, 17, 20, 23], avoid: [], colour: 2, mood: 'suspended, ghostly'},
  lydianAug:   {name: 'Lydian augmented', deg: [0, 2, 4, 6, 8, 9, 11], tensions: [14, 18], avoid: [], colour: 8, mood: 'shimmering, strange'},
  majBlues:    {name: 'Major blues', deg: [0, 2, 3, 4, 7, 9], tensions: [], avoid: [], colour: 3, mood: 'sweet with a bent note'},
  minBlues:    {name: 'Minor blues', deg: [0, 3, 5, 6, 7, 10], tensions: [], avoid: [], colour: 6, mood: 'gritty, knowing'},
};
/* the recommended scales for a chord, ranked from inside to outside, from
   its quality AND what it does in the progression:
   ctx = {keyPc, colour, next (the chord after), blues (in a blues form)} */
function sngScalesFor(ch, ctx = {}){
  const q = ch.quality, r = ch.root, nxt = ctx.next;
  const resolvesTo = nxt ? sngPc(nxt.root - r) : null;       /* 5 = down a fifth */
  const targetMinor = nxt && /^(min|m7|m6|mMaj7|m9)$/.test(nxt.quality);
  const why = [];
  let ids;
  if(/^(maj|maj7|6|add2)$/.test(q)){
    if(r === 5 && ctx.colour !== 'minor'){ ids = ['lydian', 'ionian', 'majPent']; why.push('IV of the key: Lydian keeps its ♯11 inside the key'); }
    else if(r === 8 || r === 3){ ids = ['lydian', 'ionian', 'majPent']; why.push('a borrowed major chord: Lydian avoids the clash with the key'); }
    else { ids = ['ionian', 'majPent', 'lydian']; why.push('a major chord at rest: Ionian (the 4th is an avoid note), or Lydian for a modern colour'); }
  } else if(/^(7|9|13)$/.test(q)){
    if(ctx.blues){ ids = ['mixolydian', 'majBlues', 'minBlues', 'lydianDom']; why.push('a blues dominant: Mixolydian, and the blues scales over the whole form'); }
    else if(resolvesTo === 5 && targetMinor){ ids = ['phrygianDom', 'altered', 'halfWhole']; why.push(`resolves to a minor chord: Phrygian dominant (harmonic minor, 5th mode) or altered`); }
    else if(resolvesTo === 5){ ids = ['mixolydian', 'bebopDom', 'altered', 'halfWhole', 'wholeTone']; why.push('resolves to a major chord: Mixolydian inside, altered / diminished / whole-tone for tension'); }
    else { ids = ['lydianDom', 'mixolydian', 'wholeTone']; why.push(`a dominant that does not resolve (like ♭VII7, II7, IV7 in a blues): Lydian dominant`); }
  } else if(/^(7sus4|sus4)$/.test(q)){ ids = ['mixolydian', 'dorian']; why.push('sus: Mixolydian with the 4th allowed, or Dorian from the root'); }
  else if(/^(min|m7|m9)$/.test(q)){
    if(r === 4){ ids = ['phrygian', 'aeolian', 'minPent']; why.push('iii of the key: Phrygian'); }
    else if(r === 9 && ctx.colour !== 'dorian'){ ids = ['aeolian', 'dorian', 'minPent']; why.push('vi of the key: Aeolian'); }
    else if(r === 0 && ctx.colour === 'minor'){ ids = ['aeolian', 'dorian', 'melMinor', 'minPent']; why.push('the minor tonic'); }
    else { ids = ['dorian', 'minPent', 'aeolian']; why.push(r === 2 ? 'ii of the key: Dorian' : 'minor 7: Dorian, the jazz minor sound'); }
  } else if(/^(m6|mMaj7)$/.test(q)){ ids = q === 'mMaj7' ? ['melMinor', 'harmMinor'] : ['melMinor', 'dorian']; why.push('minor 6 / minor-major 7: melodic minor'); }
  else if(q === 'm7b5' || q === 'dim'){ ids = ['locrian2', 'locrian']; why.push('half-diminished: Locrian ♮2 (melodic minor, 6th mode) is smoother than Locrian'); }
  else if(q === 'dim7'){ ids = ['wholeHalf']; why.push('diminished 7: whole-half diminished'); }
  else if(q === 'aug'){ ids = ['lydianAug', 'wholeTone']; why.push('augmented: Lydian augmented'); }
  else { ids = ['ionian']; }
  return {scales: ids.map(id => Object.assign({id}, SNG_SCALES[id])), why: why.join('; ')};
}
/* each note of a scale over a chord, as what it is: chord tone, tension,
   avoid, colour */
function sngScaleRoles(ch, scale){
  const q = SNG_QUALITY[ch.quality] || SNG_QUALITY.maj;
  const tones = new Set(q.map(sngPc));
  return scale.deg.map(d => ({deg: d, role: tones.has(d) ? 'chord' : scale.avoid.includes(d) ? 'avoid' : d === sngPc(scale.colour) ? 'colour' : 'tension'}));
}
/* the guide tones (3rd and 7th) of each chord, moving by the smallest step */
function sngGuideTones(chords, keyPc){
  let prev = null; const out = [];
  chords.forEach(ch => {
    const q = SNG_QUALITY[ch.quality] || SNG_QUALITY.maj;
    const third = q.includes(4) ? 4 : q.includes(3) ? 3 : 5, sev = q.find(x => x === 10 || x === 11) != null ? q.find(x => x === 10 || x === 11) : (third === 3 ? 10 : 11);
    const cands = [third, sev].map(iv => 60 + sngPc(keyPc + ch.root + iv)).flatMap(m => [m - 12, m, m + 12]).filter(m => m >= 55 && m <= 76);
    const pick = prev == null ? cands.sort((a, b) => Math.abs(a - 64) - Math.abs(b - 64))[0] : cands.sort((a, b) => Math.abs(a - prev) - Math.abs(b - prev))[0];
    out.push({midi: pick, role: sngPc(pick - (keyPc + ch.root)) === third ? '3rd' : '7th'}); prev = pick;
  });
  return out;
}

/* ---------- emotion presets for the melody generator ----------
   Common tendencies, not laws: each is only a starting point for the
   controls, every one of which can be changed after it is picked. */
const SNG_EMOTIONS = [
  {id: 'joyful', name: 'Joyful / uplifting', source: 'major', register: 'mid-high', range: 10, contour: 'arch', steps: 60, maxLeap: 7, stable: 70, density: 'medium', sync: 30, start: 'on', ending: 'resolved', endDeg: [1, 3], dev: 'varied', novelty: 40, chroma: 5, note: 'major, a climb to a bright peak, resolved endings'},
  {id: 'tender', name: 'Tender / intimate', source: 'majPent', register: 'mid', range: 9, contour: 'arch', steps: 80, maxLeap: 4, stable: 75, density: 'low', sync: 15, start: 'after', ending: 'resolved', endDeg: [3, 5], dev: 'exact', novelty: 25, chroma: 0, note: 'pentatonic, a narrow range (about a sixth), long notes at phrase ends, ending on 3 or 5'},
  {id: 'melancholy', name: 'Melancholy', source: 'minor', register: 'low-mid', range: 9, contour: 'descending', steps: 75, maxLeap: 5, stable: 45, density: 'low', sync: 20, start: 'after', ending: 'resolved', endDeg: [1, 5], dev: 'varied', novelty: 35, chroma: 5, sigh: true, note: 'natural minor, low-mid register, falling "sigh" intervals, unstable notes on strong beats resolving down, endings on 1 or 5'},
  {id: 'longing', name: 'Longing / yearning', source: 'major', register: 'mid', range: 12, contour: 'leap-descend', steps: 70, maxLeap: 9, stable: 45, density: 'medium', sync: 25, start: 'before', ending: 'open', endDeg: [2, 4, 7], dev: 'varied', novelty: 40, chroma: 5, note: 'major, a rising leap (a 6th) then a stepwise fall, endings left on 2, 4 or 7'},
  {id: 'hopeful', name: 'Hopeful / bittersweet', source: 'major', register: 'mid', range: 10, contour: 'ascending', steps: 70, maxLeap: 7, stable: 55, density: 'medium', sync: 25, start: 'after', ending: 'open', endDeg: [3, 2], dev: 'varied', novelty: 40, chroma: 10, note: 'major with a borrowed minor shade, rising lines that stop just short of home'},
  {id: 'dreamy', name: 'Dreamy / floating', source: 'lydian', register: 'mid-high', range: 12, contour: 'arch', steps: 65, maxLeap: 7, stable: 50, density: 'low', sync: 10, start: 'after', ending: 'open', endDeg: [2, 5, 7], dev: 'sequence', novelty: 45, chroma: 0, note: 'Lydian or pentatonic, long values, a wide gentle range, weak or avoided cadences'},
  {id: 'bluesy', name: 'Bluesy / soulful', source: 'blues', register: 'mid', range: 10, contour: 'zigzag', steps: 65, maxLeap: 5, stable: 50, density: 'medium', sync: 60, start: 'before', ending: 'resolved', endDeg: [1], dev: 'varied', novelty: 35, chroma: 25, graces: true, note: 'minor pentatonic / blues over major chords, blue notes ♭3 ♭5 ♭7, slides, lots of syncopation'},
  {id: 'tense', name: 'Tense / anxious', source: 'harmMinor', register: 'mid', range: 8, contour: 'straight', steps: 75, maxLeap: 8, stable: 30, density: 'high', sync: 45, start: 'before', ending: 'open', endDeg: [2, 7], dev: 'modified', novelty: 50, chroma: 35, repeats: true, note: 'harmonic minor or Phrygian, repeated notes, chromatic neighbours, a narrow range broken by sudden leaps, unresolved endings'},
  {id: 'triumphant', name: 'Triumphant / anthemic', source: 'major', register: 'mid-high', range: 14, contour: 'ascending', steps: 45, maxLeap: 12, stable: 75, density: 'medium', sync: 20, start: 'on', ending: 'resolved', endDeg: [1], dev: 'exact', novelty: 30, chroma: 0, titleDown: true, note: 'major, a wide range climbing to a peak near the end, leaps of 4ths, 5ths and octaves, the title on the downbeat, ending on 1'},
  {id: 'playful', name: 'Playful', source: 'majPent', register: 'mid-high', range: 9, contour: 'zigzag', steps: 60, maxLeap: 5, stable: 60, density: 'high', sync: 50, start: 'after', ending: 'resolved', endDeg: [1, 5], dev: 'sequence', novelty: 45, chroma: 10, note: 'major pentatonic or Mixolydian, short notes, a zigzag shape, neighbour notes, syncopation'},
  {id: 'dark', name: 'Dark / mysterious', source: 'phrygian', register: 'low', range: 9, contour: 'inverted', steps: 70, maxLeap: 6, stable: 40, density: 'low', sync: 25, start: 'after', ending: 'open', endDeg: [1, 2], dev: 'modified', novelty: 40, chroma: 20, note: 'Phrygian or harmonic minor, low register, ♭2 and the tritone allowed'},
  {id: 'jazzy', name: 'Jazzy / sophisticated', source: 'chord-scale', register: 'mid', range: 12, contour: 'arch', steps: 65, maxLeap: 7, stable: 50, density: 'medium', sync: 45, start: 'before', ending: 'open', endDeg: [3, 7, 2], dev: 'sequence', novelty: 45, chroma: 30, guide: true, note: 'pitch sets from the Chord-Scale Map, guide tones on strong beats, enclosures and chromatic approaches, 9ths, 11ths and 13ths as colour'},
];
/* the pitch sources the generator can draw from, as semitones above the key's tonic */
const SNG_PITCH_SOURCES = {major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], mixolydian: [0, 2, 4, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11], phrygian: [0, 1, 3, 5, 7, 8, 10], harmMinor: [0, 2, 3, 5, 7, 8, 11], majPent: [0, 2, 4, 7, 9], minPent: [0, 3, 5, 7, 10], blues: [0, 3, 5, 6, 7, 10]};
const SNG_CONTOURS = [['ascending', 'Ascending'], ['descending', 'Descending'], ['arch', 'Arch'], ['inverted', 'Inverted arch'], ['zigzag', 'Zigzag'], ['straight', 'Straight line'], ['leap-descend', 'Leap up, then step down']];
const SNG_DEVELOP = [['exact', 'Exact repetition'], ['varied', 'Varied repetition'], ['modified', 'Modified repetition'], ['sequence', 'Sequence'], ['inversion', 'Inversion'], ['shorten', 'Shorten / lengthen']];

/* a seeded random number generator (mulberry32): the same seed, the same melody */
function sngRng(seed){
  let a = (seed >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
