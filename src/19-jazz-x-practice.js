/* ============================================================
   PRACTICE MODE ON THE CHART — looping, tempo and key by the repeat,
   what to play over a chord, how to voice it, and a journal of takes.

   The play-along used to be a room of its own that you went to. Now the
   player sits on the chart itself — on every tune page, and in the
   play-along room for the curriculum's own progressions — because the
   point of looping bars 15 to 17 is that you can see bars 15 to 17.

     looping     tap a start bar and an end bar while it plays (or after
                 "set a loop"); tap a pattern's coloured bar, or its ⟳ in
                 "what the analysis found", to loop exactly that ii-V-I.
     each repeat the tempo can climb by a few beats a minute, and the key
                 can move round the cycle of fourths, chromatically either
                 way, or at random through all twelve.
     a chord     tap it: the scales that go with it, in the job it is doing
                 in this tune, and six ways to voice it on a keyboard.
     a take      record yourself over the band; each take is kept under the
                 tune with the tempo, key and bars it was played at.

   The harmonic analysis this reads is the room's own (jazzTuneAnalysis):
   the delivered database carries no bar-by-bar analysis, and a tune that
   ever brings one (harmonicAnalysis.iiViLocations and the rest) is read
   from that first.
   ============================================================ */

/* ---------- scales ---------- */
/* steps: the letter each degree is spelled on, so a scale reads as a scale;
   the altered and diminished scales take the flat-third spelling players
   read (B altered: B C D D♯ F G A, not B C C𝄪 D♯) */
const JAZZ_SCALES = {
  'Ionian':               {iv: [0, 2, 4, 5, 7, 9, 11], st: [0, 1, 2, 3, 4, 5, 6]},
  'Dorian':               {iv: [0, 2, 3, 5, 7, 9, 10], st: [0, 1, 2, 3, 4, 5, 6]},
  'Phrygian':             {iv: [0, 1, 3, 5, 7, 8, 10], st: [0, 1, 2, 3, 4, 5, 6]},
  'Lydian':               {iv: [0, 2, 4, 6, 7, 9, 11], st: [0, 1, 2, 3, 4, 5, 6]},
  'Mixolydian':           {iv: [0, 2, 4, 5, 7, 9, 10], st: [0, 1, 2, 3, 4, 5, 6]},
  'Aeolian':              {iv: [0, 2, 3, 5, 7, 8, 10], st: [0, 1, 2, 3, 4, 5, 6]},
  'Locrian':              {iv: [0, 1, 3, 5, 6, 8, 10], st: [0, 1, 2, 3, 4, 5, 6]},
  'Locrian ♮2':           {iv: [0, 2, 3, 5, 6, 8, 10], st: [0, 1, 2, 3, 4, 5, 6]},
  'Melodic Minor':        {iv: [0, 2, 3, 5, 7, 9, 11], st: [0, 1, 2, 3, 4, 5, 6]},
  'Lydian Dominant':      {iv: [0, 2, 4, 6, 7, 9, 10], st: [0, 1, 2, 3, 4, 5, 6]},
  'Altered':              {iv: [0, 1, 3, 4, 6, 8, 10], st: [0, 1, 2, 2, 4, 5, 6]},
  'Phrygian Dominant':    {iv: [0, 1, 4, 5, 7, 8, 10], st: [0, 1, 2, 3, 4, 5, 6]},
  'Bebop Dominant':       {iv: [0, 2, 4, 5, 7, 9, 10, 11], st: [0, 1, 2, 3, 4, 5, 6, 6]},
  'Half-Whole Diminished':{iv: [0, 1, 3, 4, 6, 7, 9, 10], st: [0, 1, 2, 2, 4, 4, 5, 6]},
  'Whole-Half Diminished':{iv: [0, 2, 3, 5, 6, 8, 9, 11], st: [0, 1, 2, 3, 4, 5, 5, 6]},
  'Whole Tone':           {iv: [0, 2, 4, 6, 8, 10], st: [0, 1, 2, 4, 5, 6]},
  'Major Pentatonic':     {iv: [0, 2, 4, 7, 9], st: [0, 1, 2, 4, 5]},
  'Minor Pentatonic':     {iv: [0, 3, 5, 7, 10], st: [0, 2, 3, 4, 6]}};
/* which scales, by the chord's quality and the job it is doing: the brief's
   map, with the first of each list the safe choice and the rest more colour */
const JAZZ_SCALE_CHORD_MAP = {
  '7': {default: ['Mixolydian', 'Bebop Dominant', 'Lydian Dominant', 'Whole Tone'],
    asSecondaryDominant: ['Mixolydian', 'Lydian Dominant', 'Half-Whole Diminished'],
    inMinorIiVi: ['Altered', 'Half-Whole Diminished', 'Phrygian Dominant'],
    asTritoneSubstitution: ['Lydian Dominant', 'Mixolydian'],
    altered: ['Altered', 'Half-Whole Diminished', 'Whole Tone']},
  'm7': {default: ['Dorian', 'Aeolian'], asIiChord: ['Dorian'], asViChord: ['Aeolian', 'Dorian'],
    asIiiChord: ['Phrygian', 'Dorian'], asMinorIiChord: ['Locrian ♮2', 'Dorian']},
  'maj7': {default: ['Ionian', 'Lydian', 'Major Pentatonic'], asIChord: ['Ionian', 'Major Pentatonic'], asIVChord: ['Lydian', 'Ionian']},
  '6': {default: ['Ionian', 'Major Pentatonic']},
  'm6': {default: ['Dorian', 'Melodic Minor']},
  'mMaj7': {default: ['Melodic Minor']},
  'm': {default: ['Dorian', 'Aeolian', 'Minor Pentatonic']},
  'm7b5': {default: ['Locrian', 'Locrian ♮2']},
  'dim7': {default: ['Whole-Half Diminished']},
  'aug': {default: ['Whole Tone']},
  '7sus': {default: ['Mixolydian', 'Dorian']}};
/* the curriculum's word for each thing a chord can be */
const JAZZ_SCALE_STAGE = {default: '4', inMinorIiVi: '7', asMinorIiChord: '7', asTritoneSubstitution: '11', dim: '5'};

function jazzChordQualityKey(c){
  if(!c) return 'maj7';
  const q = c.q || '';
  if(c.quality === 'hd') return 'm7b5';
  if(c.quality === 'dim') return 'dim7';
  if(c.quality === 'aug') return 'aug';
  if(c.quality === 'sus') return '7sus';
  if(c.quality === 'min') return /maj7|M7/.test(q) ? 'mMaj7' : /6/.test(q) ? 'm6' : /7|9|11|13/.test(q) ? 'm7' : 'm';
  if(c.quality === 'dom') return '7';
  if(/^6|^69/.test(q)) return '6';
  return 'maj7';
}
/* a note name by the letter its degree sits on */
function jazzScaleNotes(root, name){
  const s = JAZZ_SCALES[name]; if(!s) return [];
  return s.iv.map((iv, i) => jazzPrettyNote(jzlSpell(root, iv, s.st[i])));
}
const jazzPrettyNote = n => String(n).replace(/##/, '𝄪').replace(/bb$/, '𝄫').replace(/#/, '♯').replace(/^([A-G])b/, '$1♭');

/* ---------- the job a chord is doing in this tune ---------- */
/* The database gives some keys two ways ("Gm/Em": the book's key, and the
   one this chart is written in). The chart's own is the one it ends on. */
function jzxChartTonic(t){
  const raw = String((t && t.key) || 'C');
  const opts = raw.split('/').map(k => /^([A-G][b#]?)(m(?!aj))?/.exec(k.trim())).filter(Boolean)
    .map(m => ({name: m[1], pc: JAZZ_TUNE_PC[m[1]], minor: !!m[2] || /dorian|aeolian|phrygian/i.test(raw)}))
    .filter(k => k.pc != null);
  if(!opts.length) return jazzTuneTonic(t);
  if(opts.length > 1){
    const bars = jazzParseChart(t.chordProgression).bars || [];
    const lastBar = bars.filter(b => b.chords && b.chords.length).pop();
    const end = lastBar ? jazzParseChord(lastBar.chords[lastBar.chords.length - 1].text) : null;
    const hit = end && opts.find(k => k.pc === end.pc);
    if(hit) return Object.assign({}, hit, {minor: end.quality === 'min'});
  }
  return opts[0];
}
const JAZZ_NUMERALS = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'];
function jazzChordRole(t, bar, orig){
  const a = jazzTuneAnalysis(t);
  const ev = a.events;
  let at = ev.findIndex(e => e.bar === bar && e.text === orig);
  if(at < 0) for(let i = ev.length - 1; i >= 0; i--) if(ev[i].bar <= bar && ev[i].text === orig){ at = i; break; }
  const c = jazzParseChord(orig);
  const q = jazzChordQualityKey(c);
  const tonic = jazzTuneTonic(t);
  /* the delivered analysis, if a tune ever carries one, before the room's own */
  const ha = t.harmonicAnalysis;
  if(ha && Array.isArray(ha.tonicizationLocations)){
    const hit = ha.tonicizationLocations.find(x => bar >= x.startMeasure && bar <= x.endMeasure);
    if(hit && q === '7') return {label: `V7 of ${hit.key || hit.target || '?'} (tonicization)`, context: 'asSecondaryDominant', kind: 'tonicization'};
  }
  const spans = at < 0 ? [] : a.spans.filter(s => at >= s.at[0] && at <= s.at[1]);
  for(const s of spans){
    const pos = at - s.at[0];
    if((s.kind === 'iivi' || s.kind === 'minor' || s.kind === 'tonicization') && /ii-V/.test(s.label)){
      const minor = s.kind === 'minor';
      const to = `${s.target}${minor ? 'm' : ''}`;
      if(pos === 0) return {label: `ii${minor ? 'ø' : ''} in ${minor ? 'minor ii-V-i' : 'ii-V-I'} to ${to}`, context: minor ? 'asMinorIiChord' : 'asIiChord', kind: s.kind, target: s.target};
      if(pos === 1) return {label: `V7 in ${minor ? 'minor ii-V-i' : 'ii-V-I'} to ${to}`,
        context: minor ? 'inMinorIiVi' : s.kind === 'tonicization' ? 'asSecondaryDominant' : 'default', kind: s.kind, target: s.target};
      return {label: `${minor ? 'i' : 'I'}, where the ${minor ? 'ii-V-i' : 'ii-V-I'} to ${to} arrives`, context: q === 'maj7' ? 'asIChord' : 'default', kind: s.kind, target: s.target};
    }
    if(s.kind === 'tonicization' && pos === 0) return {label: `V7 of ${s.target} (tonicization)`, context: 'asSecondaryDominant', kind: s.kind, target: s.target};
    if(s.kind === 'tritone' && pos === 0) return {label: `Tritone substitution — ${s.label}`, context: 'asTritoneSubstitution', kind: s.kind, target: s.target};
    if(s.kind === 'dim' && pos === 0) return {label: `Passing diminished, walking up to ${s.target}`, context: 'default', kind: 'dim', target: s.target};
  }
  /* no pattern: its scale degree — in the key the last ii-V-I has just
     arrived in (Autumn Leaves' CM7 is IV in G, not a chord of E minor), else
     in the key the chart is in */
  const prev = at < 0 ? null : a.spans.filter(s => s.target && s.at[1] < at && at - s.at[1] <= 2
    && (s.kind === 'iivi' || s.kind === 'minor')).pop();
  if(prev && JAZZ_TUNE_PC[prev.target] != null) Object.assign(tonic, {name: prev.target, pc: JAZZ_TUNE_PC[prev.target], minor: prev.kind === 'minor'});
  else Object.assign(tonic, jzxChartTonic(t));
  const deg = c && c.pc != null ? ((c.pc - tonic.pc) % 12 + 12) % 12 : 0;
  let num = JAZZ_NUMERALS[deg];
  if(['m7', 'm', 'm6', 'mMaj7', 'm7b5', 'dim7'].includes(q)) num = num.toLowerCase();
  const context = q === 'm7' ? (deg === 9 ? 'asViChord' : deg === 4 ? 'asIiiChord' : deg === 2 ? 'asIiChord' : 'default')
    : q === 'maj7' ? (deg === 5 ? 'asIVChord' : deg === 0 ? 'asIChord' : 'default')
    : q === '7' ? (c && c.altered ? 'altered' : deg === 7 ? 'default' : 'asSecondaryDominant') : 'default';
  return {label: `${num}${q === '7' ? '7' : q === 'm7b5' ? 'ø7' : q === 'dim7' ? '°7' : ''} in ${jazzPrettyNote(tonic.name)}${tonic.minor ? ' minor' : ''}`,
    context, kind: null};
}
/**
 * The scales for a chord in the job it is doing, safest first.
 * @returns [{name, notes, pcs, safe}]
 */
function jazzScaleSuggestions(sym, role){
  const c = jazzParseChord(sym);
  if(!c) return [];
  const q = jazzChordQualityKey(c);
  const m = JAZZ_SCALE_CHORD_MAP[q] || JAZZ_SCALE_CHORD_MAP.maj7;
  let ctx = (role && role.context) || 'default';
  if(q === '7' && c.altered && ctx === 'default') ctx = 'altered';
  const names = [...new Set((m[ctx] || m.default).concat(m.default))];
  return names.map((name, i) => ({name, safe: i === 0, notes: jazzScaleNotes(c.root, name),
    pcs: JAZZ_SCALES[name].iv.map(v => (c.pc + v) % 12), context: ctx}));
}

/* ---------- voicings ----------
   Six ways to put a chord under the hands, each tagged with the stage
   that teaches it. Type A and Type B are as the brief gives them (the
   Levine convention: A from the third, 3-5-7-9, a dominant's thirteenth
   for its fifth; B from the seventh, 7-9-3-5). The book's Type A on 3.1–3.3
   is Siskind's 3-7-9-5; where the two differ the page shows both. */
function jzxDegrees(spec){
  const T = spec.tones;
  const third = T.includes(3) ? 3 : T.includes(4) ? 4 : 5;
  const fifth = T.includes(6) && !T.includes(7) ? 6 : T.includes(8) && !T.includes(7) ? 8 : 7;
  const seventh = T.includes(11) ? 11 : T.includes(10) ? 10 : T.includes(9) ? 9 : null;
  const ninth = T.includes(13) ? 13 : T.includes(15) ? 15 : 14;
  const thirteenth = T.includes(20) ? 20 : 21;
  return {third, fifth, seventh, ninth, thirteenth};
}
const JZX_STEPS = {0: 0, 3: 2, 4: 2, 5: 3, 6: 4, 7: 4, 8: 4, 9: 5, 10: 6, 11: 6, 13: 1, 14: 1, 15: 1, 17: 3, 18: 3, 20: 5, 21: 5};
function jazzGenerateVoicings(sym){
  const spec = jazzChordSpec(sym);
  const c = jazzParseChord(sym);
  if(!spec || !c) return [];
  const q = jazzChordQualityKey(c);
  const d = jzxDegrees(spec);
  const dim = q === 'dim7';
  const seventh = d.seventh != null ? d.seventh : 9;              /* a triad's colour note is the sixth */
  const name = iv => jazzPrettyNote(jzlSpell(c.root, iv % 12, dim && iv === 9 ? 6 : (JZX_STEPS[iv] ?? JZX_STEPS[iv % 12] ?? 0)));
  /* stack intervals upward from a bottom note placed in [lo, lo+11] */
  const stack = (ivs, lo) => { let prev = null;
    return ivs.map(iv => { const pc = (spec.pc + iv) % 12;
      let m = prev == null ? lo + ((pc - lo) % 12 + 12) % 12 : prev + 1 + ((pc - (prev + 1)) % 12 + 12) % 12;
      prev = m; return {m, iv}; }); };
  const voiced = (title, stage, parts, how) => {
    const all = parts.left.concat(parts.right).sort((a, b) => a.m - b.m);
    return {name: title, stage, how, notes: all.map(n => name(n.iv) + (Math.floor(n.m / 12) - 1)),
      midis: all.map(n => n.m), hands: {left: parts.left.map(n => n.m), right: parts.right.map(n => n.m)}};
  };
  const out = [];
  const colour = q === '7' ? d.thirteenth : d.fifth;
  out.push(voiced('Root position', 1, {left: [], right: stack([0, d.third, d.fifth, seventh], 48)}, 'every note stacked from the root'));
  if(d.seventh != null) out.push(voiced('Shell voicing', 2, {left: stack([0, d.third, d.seventh], 41), right: []}, 'root, third and seventh — no fifth; the left hand'));
  if(d.seventh != null){
    const a = dim ? [d.third, d.fifth, 9, 12] : q === 'm7b5' ? [d.third, d.fifth, d.seventh, 12] : [d.third, colour, d.seventh, d.ninth];
    const b = dim ? [9, 12, d.third, d.fifth] : q === 'm7b5' ? [d.seventh, 12, d.third, d.fifth] : [d.seventh, d.ninth, d.third, colour];
    out.push(voiced('Type A', 2, {left: stack(a, 50), right: []}, q === '7' ? 'from the third: 3-13-7-9' : 'from the third: 3-5-7-9'));
    out.push(voiced('Type B', 2, {left: stack(b, 47), right: []}, q === '7' ? 'from the seventh: 7-9-3-13' : 'from the seventh: 7-9-3-5'));
  }
  /* drop 2: close position, root at the bottom, the second voice from the top down an octave */
  const close = stack([0, d.third, d.fifth, seventh], 60);
  const dropped = close[2];
  out.push(voiced('Drop 2', 4, {left: [{m: dropped.m - 12, iv: dropped.iv}], right: [close[0], close[1], close[3]]},
    'close position with the second voice from the top dropped an octave'));
  if(d.seventh != null){
    const rh = q === 'm7b5' ? [d.third, d.fifth, 12] : dim ? [d.third, d.fifth, 9] : [d.third, colour, d.ninth];
    out.push(voiced('Left hand + right hand', 4, {left: stack([0, d.seventh], 36), right: stack(rh, 60)},
      'the shell in the left hand, the colour tones in the right'));
  }
  return out;
}
/* the book's own Type A / B for this chord, from the room's generator tables */
function jazzBookTypeAB(sym){
  const G = typeof JazzExerciseGenerator !== 'undefined' ? JazzExerciseGenerator : null;
  const c = jazzParseChord(sym);
  if(!G || !G.VOICING_TYPE_A || !c) return null;
  const q = jazzChordQualityKey(c);
  const type = {'7': 'dom7', 'm7': 'min7', 'maj7': 'maj7', 'm7b5': 'min7b5', 'dim7': 'dim7'}[q];
  if(!type) return null;
  const spell = iv => { const r = ((iv % 12) + 12) % 12;
    return jazzPrettyNote(jzlSpell(c.root, r, JZX_STEPS[r] ?? JZX_STEPS[iv] ?? 0)); };
  return {A: G.VOICING_TYPE_A[type].map(spell), B: G.VOICING_TYPE_B[type].map(spell)};
}

/* a keyboard whose keys can be lit in two colours, one per hand */
function jzxKeyboardHTML(lo, hi, marks){
  const black = [1, 3, 6, 8, 10];
  const keys = []; for(let m = lo; m <= hi; m++) keys.push(m);
  const whites = keys.filter(m => !black.includes(m % 12));
  const w = 100 / whites.length;
  return `<div class="jzkb jzx-kb">${keys.map(m => { const isB = black.includes(m % 12);
    const x = isB ? (whites.filter(k => k < m).length * w - w * 0.3) : whites.indexOf(m) * w;
    const mk = marks[m] || '';
    return `<span class="jzkb-k${isB ? ' b' : ''}${mk ? ' ' + mk : ''}" style="left:${x}%;width:${isB ? w * 0.6 : w}%"></span>`; }).join('')}</div>`;
}

/* ---------- the practice panel ---------- */
const jazzPracUi = () => S._jprac = S._jprac || {};
function jazzPracFor(id){
  const u = jazzPracUi();
  u[id] = u[id] || {loop: null, picking: false, pickA: null, bpm: null, swing: 0.62,
    layers: {bass: true, piano: true, drums: true}, click: false,
    autoTempo: {on: false, step: 5}, autoKey: {on: false, pattern: 'fourths', all12: true},
    trail: [], cycleKeys: [], cycleAt: 0, startBpm: null};
  return u[id];
}
/* a tempo from the database's words for it */
function jazzTempoOf(t){
  const w = String((t && t.tempo) || '').toLowerCase();
  if(/ballad/.test(w)) return 66;
  if(/slow/.test(w)) return 88;
  if(/up|fast|burn/.test(w)) return 200;
  if(/bossa|latin|samba/.test(w)) return 130;
  if(/medium/.test(w)) return 132;
  const n = parseInt(w, 10); return n > 30 && n < 400 ? n : 120;
}
const JAZZ_KEY_CYCLES = {
  fourths: ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'B', 'E', 'A', 'D', 'G'],
  up: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
  down: ['C', 'B', 'Bb', 'A', 'Ab', 'G', 'Gb', 'F', 'E', 'Eb', 'D', 'Db']};
const JAZZ_KEY_PATTERN_SAID = {fourths: 'Cycle of 4ths', up: 'Chromatic up', down: 'Chromatic down', random: 'Random'};
/**
 * The twelve keys in the order the pattern visits them, starting where you are.
 * Random is a shuffle: no key twice until all twelve have come round.
 */
function jazzKeyCycle(pattern, from, rand){
  const start = JAZZ_TUNE_FLAT[((JAZZ_TUNE_PC[from] ?? 0) % 12 + 12) % 12];
  if(pattern === 'random'){
    const rest = JAZZ_TUNE_FLAT.filter(k => k !== start);
    const r = rand || Math.random;
    for(let i = rest.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
    return [start].concat(rest);
  }
  const ring = JAZZ_KEY_CYCLES[pattern] || JAZZ_KEY_CYCLES.fourths;
  const at = Math.max(0, ring.indexOf(start));
  return ring.slice(at).concat(ring.slice(0, at));
}
const jazzTuneKeyNow = t => { const k = jazzTuneUi().key; return JAZZ_KEY_NAMES.includes(k) ? k : jazzTuneTonic(t).name; };
const jzxStyleOf = t => t.category === 'bossa' || /bossa|latin/i.test(t.tempo || '') ? 'bossa' : /3\/4/.test(t.timeSignature || '') ? 'waltz' : 'swing';

function jazzPracticePanelHTML(t){
  const P = jazzPracFor(t.id);
  if(P.bpm == null) P.bpm = jazzTempoOf(t);
  const playing = !!(_jzBand && _jzBand.running && _jzBand._tune === t.id);
  const key = jazzTuneKeyNow(t);
  return `<div class="jzp-panel jzx-panel" data-jzxtune="${esc(t.id)}">
    <div class="row" style="gap:6px;flex-wrap:wrap;align-items:center">
      <button class="btn primary" id="jpGo">${playing ? '■ Stop' : '▶ Play along'}</button>
      <button class="btn sm ghost${P.picking ? ' on' : ''}" data-jxpick title="tap a start bar, then an end bar">⟳ ${P.picking ? 'tap the bars…' : 'set a loop'}</button>
      <button class="btn sm ghost" data-jxrec>🎙 Record</button>
      <span class="jzx-recind mono" hidden><i></i><b>0:00</b></span>
      <a class="btn sm ghost" href="${esc(jazzIrealLink(t, JAZZ_KEY_NAMES.includes(jazzTuneUi().key) ? jazzTuneUi().key : ''))}">iReal Pro ↗</a></div>
    <div class="jzx-status mono" aria-live="polite">${jzxStatusHTML(t)}</div>
    <div class="jzp-row">
      <label class="pd-q"><span class="k">tempo <b class="mono" id="jpBpmV">${P.bpm}</b> bpm</span>
        <input type="range" min="40" max="300" step="2" id="jpBpm" value="${P.bpm}"></label>
      <label class="pd-q"><span class="k">swing <b class="mono" id="jpSwingV">${Math.round(P.swing * 100)}%</b></span>
        <input type="range" min="50" max="75" step="1" id="jpSwing" value="${Math.round(P.swing * 100)}"></label></div>
    <div class="row" style="gap:6px;flex-wrap:wrap;align-items:center">
      ${['bass', 'piano', 'drums'].map(k => `<span class="jzp-layer"><label class="jz-gate mono"><input type="checkbox" data-jplayer="${k}" ${P.layers[k] ? 'checked' : ''}> ${k}</label>
        <button class="tbtn" data-jpsolo="${k}" title="hear only the ${k}">solo</button></span>`).join('')}
      <label class="jz-gate mono"><input type="checkbox" id="jpClick" ${P.click ? 'checked' : ''}> metronome on 2 and 4</label>
      <span class="mono faint">${esc(jzxStyleOf(t))} · ${esc(jazzPrettyNote(key))}</span></div>
    <details class="jzx-settings"${P.autoTempo.on || P.autoKey.on ? ' open' : ''}><summary class="mono">Practice settings</summary>
      <div class="jzx-set">
        <label class="jz-gate mono"><input type="checkbox" data-jxauto="tempo" ${P.autoTempo.on ? 'checked' : ''}> Auto tempo increase</label>
        ${P.autoTempo.on ? `<label class="mono">Increase by <input class="inp mono jzx-num" type="number" min="1" max="20" data-jxstep value="${P.autoTempo.step}"> BPM each repeat</label>
          <button class="tbtn" data-jxreset>reset tempo</button>` : ''}</div>
      <div class="jzx-set">
        <label class="jz-gate mono"><input type="checkbox" data-jxauto="key" ${P.autoKey.on ? 'checked' : ''}> Auto key cycling</label>
        ${P.autoKey.on ? `<select class="sel sm" data-jxpattern>${Object.keys(JAZZ_KEY_PATTERN_SAID).map(k =>
          `<option value="${k}" ${P.autoKey.pattern === k ? 'selected' : ''}>${JAZZ_KEY_PATTERN_SAID[k]}</option>`).join('')}</select>
          <label class="jz-gate mono"><input type="checkbox" data-jxall12 ${P.autoKey.all12 ? 'checked' : ''}> Loop all 12 keys</label>` : ''}</div>
      <p class="faint jzx-note">Each time the tune — or the looped bars — comes round, the tempo climbs and the key moves on. Tempo stops climbing at 300.</p>
    </details>
  </div>`;
}
function jzxStatusHTML(t){
  const P = jazzPracFor(t.id);
  const parts = [];
  const trail = P.trail.length ? [P.startBpm].concat(P.trail).slice(-5) : [P.bpm];
  parts.push(`♩ = ${trail.join(' → ')}`);
  if(P.autoKey.on && P.cycleKeys.length) parts.push(`Key: ${jazzPrettyNote(P.cycleKeys[P.cycleAt] || jazzTuneKeyNow(t))} (${P.cycleAt + 1} of 12)`);
  else parts.push(`Key: ${jazzPrettyNote(jazzTuneKeyNow(t))}`);
  let s = parts.join(', ');
  if(P.loop) s += ` · <span class="jzx-looping">Looping bars ${P.loop[0]}${P.loop[1] !== P.loop[0] ? '–' + P.loop[1] : ''} <button class="tbtn" data-jxclear title="stop looping">✕</button></span>`;
  else if(P.picking && P.pickA != null) s += ` · loop from bar ${P.pickA} to…`;
  return s;
}
/* the loop's bars, lit on the chart whether or not the patterns are shown */
function jzxPaintLoop(root, t){
  const P = jazzPracFor(t.id);
  $$('.jt-bar', root).forEach(b => { const n = +b.dataset.bar;
    b.classList.toggle('jt-loop', !!P.loop && n >= P.loop[0] && n <= P.loop[1]);
    b.classList.toggle('jt-loop-a', !!P.loop && n === P.loop[0]);
    b.classList.toggle('jt-loop-b', !!P.loop && n === P.loop[1]);
    b.classList.toggle('jt-loop-pick', P.pickA != null && n === P.pickA); });
}
/**
 * Bind the panel and the chart under it. opts.onKey(key) is how the page
 * changes key (the tune page and the play-along both keep it in jazzTuneUi).
 */
function bindJazzPracticePanel(root, t){
  const P = jazzPracFor(t.id);
  const panel = root.querySelector('.jzx-panel'); if(!panel) return;
  /* a settings toggle redraws the page while the band plays on: the band's
     callbacks then look for the panel that is on the page now */
  const pan = () => panel.isConnected ? panel : (root.querySelector('.jzx-panel') || panel);
  const status = () => { const panel = pan(); const s = panel.querySelector('.jzx-status'); if(s) s.innerHTML = jzxStatusHTML(t);
    const x = panel.querySelector('[data-jxclear]'); if(x) x.onclick = ev => { ev.stopPropagation(); setLoop(null); }; };
  const chartOf = () => root.querySelector('.jt-chart');
  const key = () => jazzTuneKeyNow(t);
  const redrawChart = () => { const c = chartOf(); if(!c) return;
    c.outerHTML = jazzChartHTML(t, JAZZ_KEY_NAMES.includes(jazzTuneUi().key) ? jazzTuneUi().key : '', !!jazzTuneUi().overlay);
    bindChart(); jzxPaintLoop(root, t);
    $$('[data-jtkey]', root).forEach(b => b.classList.toggle('on', b.dataset.jtkey === (jazzTuneUi().key || ''))); };
  let clickM = null;
  const stop = () => { if(_jzBand){ _jzBand.stop(); _jzBand = null; } if(clickM){ clickM.stop(); clickM = null; }
    if(_jzClick){ _jzClick.stop(); _jzClick = null; }
    $$('.jt-bar.now', root).forEach(b => b.classList.remove('now'));
    const g = pan().querySelector('#jpGo'); if(g) g.textContent = '▶ Play along'; };
  const start = () => {
    stop();
    P.trail = []; P.startBpm = P.bpm;
    const k = key();
    if(P.autoKey.on){ P.cycleKeys = jazzKeyCycle(P.autoKey.pattern, k); P.cycleAt = 0; }
    const chart = jazzParseChart(t.chordProgression);
    const toKey = JAZZ_KEY_NAMES.includes(jazzTuneUi().key) ? jazzTuneUi().key : '';
    _jzBand = jazzBand(chart, {bpm: P.bpm, swing: P.swing, semis: jazzTuneShift(t, toKey), toKey, style: jzxStyleOf(t),
      layers: Object.assign({}, P.layers), range: P.loop, loop: true,
      onBar: n => { $$('.jt-bar.now', root).forEach(b => b.classList.remove('now'));
        const el = root.querySelector(`.jt-bar[data-bar="${n}"]`); if(el) el.classList.add('now'); },
      onLoop: (pass, ms) => onRepeat(pass, ms)});
    _jzBand._tune = t.id;
    _jzBand.start();
    if(P.click){ _jzClick = jazzMetronome({bpm: P.bpm, beats: jzxStyleOf(t) === 'waltz' ? 3 : 4}); _jzClick.start(); }
    const g = pan().querySelector('#jpGo'); if(g) g.textContent = '■ Stop';
    status();
  };
  /* each repeat: the tempo up, the key on — heard from the next pass */
  const onRepeat = (pass, ms) => {
    const b = _jzBand; if(!b) return;
    if(P.autoTempo.on){
      const nb = Math.min(300, b.bpm + (+P.autoTempo.step || 5));
      if(nb !== b.bpm){ b.set('bpm', nb); if(_jzClick) _jzClick.set('bpm', nb); P.bpm = nb; P.trail.push(nb); }
    }
    if(P.autoKey.on){
      let nextAt = P.cycleAt + 1;
      if(nextAt >= 12){
        if(!P.autoKey.all12){ setTimeout(() => { stop(); status(); toast('All twelve keys.'); }, ms); b.stop(); return; }
        P.cycleKeys = jazzKeyCycle(P.autoKey.pattern, P.cycleKeys[0]); nextAt = 0;
      }
      P.cycleAt = nextAt;
      const k = P.cycleKeys[nextAt];
      b.set('toKey', k); b.set('semis', jazzTuneShift(t, k));
      setTimeout(() => { jazzTuneUi().key = k; redrawChart(); status(); }, ms);
    }
    setTimeout(() => { const v = pan().querySelector('#jpBpmV'), r = pan().querySelector('#jpBpm');
      if(v) v.textContent = P.bpm; if(r) r.value = P.bpm; status(); }, ms);
  };
  const setLoop = range => {
    P.loop = range; P.pickA = null; P.picking = false;
    const pk = pan().querySelector('[data-jxpick]'); if(pk){ pk.classList.remove('on'); pk.textContent = '⟳ set a loop'; }
    jzxPaintLoop(root, t); status();
    if(_jzBand && _jzBand.running && _jzBand._tune === t.id) start();
  };
  jazzPracticeLoopSetter = setLoop;
  /* the chart: bars to loop, chords to look into, patterns to loop */
  const bindChart = () => {
    const c = chartOf(); if(!c) return;
    $$('.jt-bar', c).forEach(bar => bar.onclick = ev => {
      if(ev.target.closest('.jt-marks i')) return;
      const n = +bar.dataset.bar;
      const loopy = P.picking || (_jzBand && _jzBand.running && _jzBand._tune === t.id);
      if(!loopy){ const ch = ev.target.closest('[data-ci]'); if(ch) openJazzChordPop(t, n, ch); return; }
      if(P.pickA == null){ P.pickA = n; jzxPaintLoop(root, t); status(); return; }
      const a = Math.min(P.pickA, n), z = Math.max(P.pickA, n);
      setLoop([a, z]);
    });
    $$('.jt-marks i[data-kind]', c).forEach(i => i.onclick = ev => { ev.stopPropagation();
      const n = +i.closest('.jt-bar').dataset.bar;
      const s = jazzTuneAnalysis(t).spans.find(x => x.kind === i.dataset.kind && n >= x.from && n <= x.to);
      if(s){ setLoop([s.from, s.to]); sound('click'); } });
  };
  bindChart(); jzxPaintLoop(root, t);
  $$('[data-jtloop]', root).forEach(b => b.onclick = () => { const [a, z] = b.dataset.jtloop.split('-').map(Number); setLoop([a, z]); sound('click'); });
  panel.querySelector('#jpGo').onclick = () => { if(_jzBand && _jzBand.running){ stop(); status(); } else start(); };
  panel.querySelector('[data-jxpick]').onclick = e => { P.picking = !P.picking; P.pickA = null;
    e.currentTarget.classList.toggle('on', P.picking); e.currentTarget.textContent = P.picking ? '⟳ tap the bars…' : '⟳ set a loop';
    jzxPaintLoop(root, t); status(); };
  const bpm = panel.querySelector('#jpBpm');
  bpm.oninput = () => { P.bpm = +bpm.value; P.startBpm = P.bpm; P.trail = []; panel.querySelector('#jpBpmV').textContent = P.bpm;
    if(_jzBand) _jzBand.set('bpm', P.bpm); if(_jzClick) _jzClick.set('bpm', P.bpm); status(); };
  const sw = panel.querySelector('#jpSwing');
  sw.oninput = () => { P.swing = +sw.value / 100; panel.querySelector('#jpSwingV').textContent = sw.value + '%'; if(_jzBand) _jzBand.set('swing', P.swing); };
  $$('[data-jplayer]', panel).forEach(c => c.onchange = () => { P.layers[c.dataset.jplayer] = c.checked; if(_jzBand) _jzBand.setLayer(c.dataset.jplayer, c.checked); });
  $$('[data-jpsolo]', panel).forEach(b => b.onclick = () => ['bass', 'piano', 'drums'].forEach(k => { P.layers[k] = k === b.dataset.jpsolo;
    const c = panel.querySelector(`[data-jplayer="${k}"]`); if(c) c.checked = P.layers[k]; if(_jzBand) _jzBand.setLayer(k, P.layers[k]); }));
  panel.querySelector('#jpClick').onchange = e => { P.click = e.target.checked;
    if(_jzBand && _jzBand.running){ if(P.click && !_jzClick){ _jzClick = jazzMetronome({bpm: P.bpm, beats: jzxStyleOf(t) === 'waltz' ? 3 : 4}); _jzClick.start(); }
      else if(!P.click && _jzClick){ _jzClick.stop(); _jzClick = null; } } };
  $$('[data-jxauto]', panel).forEach(c => c.onchange = () => { const k = c.dataset.jxauto;
    (k === 'tempo' ? P.autoTempo : P.autoKey).on = c.checked; rerenderKeepingBand(); });
  const step = panel.querySelector('[data-jxstep]');
  if(step) step.onchange = () => { P.autoTempo.step = Math.max(1, Math.min(20, +step.value || 5)); step.value = P.autoTempo.step; };
  const reset = panel.querySelector('[data-jxreset]');
  if(reset) reset.onclick = () => { if(P.startBpm){ P.bpm = P.startBpm; P.trail = [];
    if(_jzBand) _jzBand.set('bpm', P.bpm); if(_jzClick) _jzClick.set('bpm', P.bpm);
    panel.querySelector('#jpBpmV').textContent = P.bpm; panel.querySelector('#jpBpm').value = P.bpm; status(); } };
  const pat = panel.querySelector('[data-jxpattern]');
  if(pat) pat.onchange = () => { P.autoKey.pattern = pat.value;
    if(_jzBand && _jzBand.running){ P.cycleKeys = jazzKeyCycle(P.autoKey.pattern, key()); P.cycleAt = 0; status(); } };
  const all12 = panel.querySelector('[data-jxall12]');
  if(all12) all12.onchange = () => { P.autoKey.all12 = all12.checked; };
  bindJazzTakeRecorder(root, t);
  status();
  addEventListener('hashchange', () => { stop(); closeJazzChordPop(); }, {once: true});
}
/* a settings toggle redraws the page without stopping the band */
function rerenderKeepingBand(){ const b = _jzBand; _jzBand = null; rerender(); _jzBand = b;
  const g = document.querySelector('#jpGo'); if(g && b && b.running) g.textContent = '■ Stop'; }
let jazzPracticeLoopSetter = null;

/* ---------- a chord, looked into ---------- */
let _jzxPop = null;
function closeJazzChordPop(){ if(_jzxPop){ _jzxPop.remove(); _jzxPop = null; } $$('.jt-bar.same').forEach(b => b.classList.remove('same')); }
function openJazzChordPop(t, bar, el){
  closeJazzChordPop();
  const sym = el.dataset.sym, orig = el.dataset.orig;
  const c = jazzParseChord(sym);
  if(!c) return;
  const role = jazzChordRole(t, bar, orig);
  /* the analysis names its targets in the written key: say them in this one */
  const semis = jazzTuneShift(t, JAZZ_KEY_NAMES.includes(jazzTuneUi().key) ? jazzTuneUi().key : '');
  if(role.target && semis){ const moved = jazzTransposeChord(role.target, semis, jazzTuneUi().key);
    role.label = role.label.replace(new RegExp(`\\b${role.target.replace('#', '\\#')}(m?)\\b`), `${moved}$1`); }
  const scales = jazzScaleSuggestions(sym, role);
  const voicings = jazzGenerateVoicings(sym);
  const book = jazzBookTypeAB(sym);
  const stageFor = role.context === 'inMinorIiVi' || role.context === 'asMinorIiChord' ? '7'
    : role.context === 'asTritoneSubstitution' ? '11' : role.kind === 'dim' ? '5' : '4';
  const st = jazzStage(stageFor);
  const u = {tab: 'scales', scale: 0, voicing: 0};
  const pop = document.createElement('div');
  pop.className = 'jzx-pop';
  pop.setAttribute('role', 'dialog');
  const draw = () => {
    const sc = scales[u.scale] || scales[0];
    const v = voicings[u.voicing] || voicings[0];
    const marks = {};
    if(v){ v.hands.left.forEach(m => marks[m] = 'lh'); v.hands.right.forEach(m => marks[m] = 'rh'); }
    const lo = v ? Math.min(48, Math.floor(Math.min(...v.midis) / 12) * 12) : 48;
    const hi = v ? Math.max(72, Math.ceil((Math.max(...v.midis) + 1) / 12) * 12) : 72;
    const smarks = {}; if(sc) sc.pcs.forEach(pc => { smarks[60 + pc] = 'lit'; if(pc === sc.pcs[0]) smarks[72 + pc] = 'lit'; });
    const typeNote = v && book && (v.name === 'Type A' || v.name === 'Type B')
      ? (() => { const mine = v.notes.map(n => n.replace(/-?\d+$/, ''));
          const bk = v.name === 'Type A' ? book.A : book.B;
          return mine.join('') === bk.join('') ? '' : `<p class="jzx-differs"><span class="jzv3-diff" data-jzxgo="#/jazz/3.1">↔ differs</span>
            The room's ${v.name} on 3.1–3.3 (Siskind) is ${esc(bk.join('–'))}; this one (the brief's convention) is ${esc(mine.join('–'))}. Both are kept.</p>`; })()
      : '';
    pop.innerHTML = `<div class="row between" style="align-items:baseline;gap:8px">
        <b class="serif jzx-sym">${esc(jazzPrettyChord(sym))}</b>
        <button class="tbtn" data-jxclose aria-label="close">✕</button></div>
      <p class="jzx-role">${esc(role.label)}</p>
      <div class="jz-view-tabs" role="tablist">
        <button class="jz-view-tab${u.tab === 'scales' ? ' on' : ''}" data-jxtab="scales">Scales</button>
        <button class="jz-view-tab${u.tab === 'voicings' ? ' on' : ''}" data-jxtab="voicings">Piano Voicings</button></div>
      ${u.tab === 'scales' ? `
        <ol class="jzx-scales">${scales.map((s, i) => `<li class="${i === u.scale ? 'on' : ''}" data-jxscale="${i}">
          <b>${esc(s.name)}</b>${s.safe ? ' <span class="mono faint">safest</span>' : ''}<span class="mono">${esc(s.notes.join(' '))}</span></li>`).join('')}</ol>
        ${sc ? jzxKeyboardHTML(60, 72 + (sc.pcs[0] || 0), smarks) : ''}
        <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px">
          <button class="tbtn" data-jxsame>show on chart</button>
          <button class="tbtn" data-jxhear>▶ hear the scale</button></div>
        ${st ? `<p class="faint jzx-stage">This concept is covered in Stage ${esc(String(st.n))}: ${esc(st.name)}.</p>` : ''}`
      : `
        ${v ? `<div class="row between" style="align-items:baseline;gap:6px">
            <button class="tbtn" data-jxv="-1" aria-label="previous voicing">←</button>
            <span><b>${esc(v.name)}</b> <span class="mono faint">· Stage ${v.stage}</span></span>
            <button class="tbtn" data-jxv="1" aria-label="next voicing">→</button></div>
          <p class="mono faint jzx-how">${esc(v.how)} · ${u.voicing + 1} of ${voicings.length}</p>
          ${jzxKeyboardHTML(lo, hi, marks)}
          <p class="mono jzx-notes">${esc(v.notes.join(' '))}</p>
          ${v.hands.left.length && v.hands.right.length ? '<p class="jzx-legend mono"><i class="lh"></i>left hand <i class="rh"></i>right hand</p>'
            : `<p class="jzx-legend mono"><i class="${v.hands.left.length ? 'lh' : 'rh'}"></i>${v.hands.left.length ? 'left hand' : 'right hand'}</p>`}
          ${typeNote}
          <button class="btn sm primary" data-jxplay>▶ Play voicing</button>` : '<p class="faint">No voicing for this symbol.</p>'}`}`;
    pop.querySelector('[data-jxclose]').onclick = closeJazzChordPop;
    $$('[data-jxtab]', pop).forEach(b => b.onclick = () => { u.tab = b.dataset.jxtab; draw(); });
    $$('[data-jxscale]', pop).forEach(li => li.onclick = () => { u.scale = +li.dataset.jxscale; draw(); });
    $$('[data-jxv]', pop).forEach(b => b.onclick = () => { u.voicing = (u.voicing + +b.dataset.jxv + voicings.length) % voicings.length; draw(); });
    const play = pop.querySelector('[data-jxplay]'); if(play) play.onclick = () => jazzPlayMidis(v.midis);
    const hear = pop.querySelector('[data-jxhear]'); if(hear) hear.onclick = () => { if(!sc) return;
      const ms = sc.pcs.map(pc => 60 + pc).sort((a, b) => a - b); jazzPlayMidis(ms.concat([ms[0] + 12]), true); };
    const same = pop.querySelector('[data-jxsame]'); if(same) same.onclick = () => {
      const qk = jazzChordQualityKey(c);
      $$('.jt-bar').forEach(b => b.classList.toggle('same', $$('[data-sym]', b).some(x => jazzChordQualityKey(jazzParseChord(x.dataset.sym)) === qk))); };
    const go = pop.querySelector('[data-jzxgo]'); if(go) go.onclick = () => { closeJazzChordPop(); navigate(go.dataset.jzxgo); };
  };
  draw();
  document.body.appendChild(pop);
  const r = el.getBoundingClientRect();
  const w = Math.min(420, innerWidth - 24);
  pop.style.width = w + 'px';
  pop.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.left + scrollX - 20)) + 'px';
  pop.style.top = (r.bottom + scrollY + 8) + 'px';
  _jzxPop = pop;
  setTimeout(() => {
    const away = ev => { if(!_jzxPop) return document.removeEventListener('pointerdown', away, true);
      if(!_jzxPop.contains(ev.target) && !ev.target.closest('[data-ci]')){ closeJazzChordPop(); document.removeEventListener('pointerdown', away, true); } };
    const esc_ = ev => { if(ev.key === 'Escape'){ closeJazzChordPop(); document.removeEventListener('keydown', esc_); } };
    document.addEventListener('pointerdown', away, true); document.addEventListener('keydown', esc_);
  }, 0);
}

/* ---------- the journal ---------- */
const jazzTuneTakes = tuneId => jazzRecordings().filter(r => r.kind === 'tune' && (!tuneId || r.tuneId === tuneId));
function jazzTakeLength(sec){ const s = Math.round(+sec || 0);
  const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60;
  return h ? `${h}h ${m}m` : m ? `${m}:${String(x).padStart(2, '0')}` : `0:${String(x).padStart(2, '0')}`; }
function jazzJournalTotal(takes){
  const secs = sum(takes.map(r => +r.seconds || 0));
  const h = Math.floor(secs / 3600), m = Math.round(secs / 60) % 60;
  return `Total recorded practice: ${h ? `${h}h ${m}m` : secs < 60 ? `${Math.round(secs)}s` : `${Math.round(secs / 60)}m`} across ${takes.length} session${takes.length === 1 ? '' : 's'}`;
}
function jazzTakeTitle(t, when){
  const d = when || new Date();
  const s = d.toLocaleString('en-US', {month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'});
  return `${t.title} — ${s.replace(/[\u202f\u00a0]/g, ' ').replace(/, (\d{1,2}:\d{2})/, ' $1')}`;
}
function jazzTakeTags(r){
  const c = r.context || {};
  return [c.tempo ? `♩=${c.tempo}` : '', c.key ? `key ${jazzPrettyNote(c.key)}` : '',
    c.loopedBars ? `bars ${c.loopedBars[0]}–${c.loopedBars[1]}` : '',
    c.autoTempo ? 'auto tempo' : '', c.autoKeyCycling ? 'key cycling' : ''].filter(Boolean);
}
function jazzTakeRowHTML(r, withTune){
  const t = withTune ? jazzTune(r.tuneId) : null;
  return `<li class="jzj-row" data-jjid="${esc(r.id)}">
    <div class="jzj-top"><span class="mono">${esc(fmtDate(r.day, 'short'))} · ${esc(jazzTakeLength(r.seconds))}</span>
      ${withTune ? `<a href="#/jazz/tune/${esc(r.tuneId)}">${esc(t ? t.title : r.tuneId)}</a>` : ''}
      <span class="grow"></span>
      <button class="tbtn" data-jjplay>▶</button>
      <button class="tbtn danger" data-jjdel>delete</button></div>
    ${r.note ? `<p class="jzj-note">${esc(r.note)}</p>` : ''}
    <div class="jzj-tags">${jazzTakeTags(r).map(x => `<span class="mono">${esc(x)}</span>`).join('')}</div>
    <div class="jzj-audio"></div></li>`;
}
function bindJazzTakeRows(host, after){
  $$('[data-jjid]', host).forEach(li => {
    const r = jazzRecordings().find(x => x.id === li.dataset.jjid); if(!r) return;
    li.querySelector('[data-jjplay]').onclick = async () => {
      const box = li.querySelector('.jzj-audio');
      if(box.querySelector('audio')){ box.querySelector('audio').play(); return; }
      const blob = await jazzGetAudio(r.audioId);
      if(!blob){ box.innerHTML = '<span class="faint">The sound for this one is not in this browser.</span>'; return; }
      box.innerHTML = `<audio controls class="jzr-a" src="${URL.createObjectURL(blob)}"></audio>`;
      box.querySelector('audio').play().catch(() => {});
    };
    const del = li.querySelector('[data-jjdel]');
    del.onclick = async () => {
      if(!del.dataset.sure){ del.dataset.sure = '1'; del.textContent = 'sure? delete'; setTimeout(() => { if(del.isConnected){ delete del.dataset.sure; del.textContent = 'delete'; } }, 4000); return; }
      await jazzRemoveRecording(r.id); sound('click'); after && after();
    };
  });
}
function jazzJournalSideHTML(tuneId){
  const takes = jazzTuneTakes(tuneId);
  return `<div class="jz-note jzj" id="jzjSide"><span class="sc">My practice journal</span>
    <p class="mono">${esc(jazzJournalTotal(takes))}</p>
    ${takes.length ? `<ol class="jzj-list">${takes.map(r => jazzTakeRowHTML(r, false)).join('')}</ol>`
      : '<p class="faint">Record yourself over the band — each take is kept here, newest first.</p>'}
    <button class="tbtn" data-jzgo="#/jazz/journal">every tune’s journal →</button></div>`;
}
/* 🎙: the take, and where it is kept */
let _jzxRec = null;
function bindJazzTakeRecorder(root, t){
  const b = root.querySelector('[data-jxrec]'); if(!b) return;
  const ind = root.querySelector('.jzx-recind');
  if(!jazzCanRecord()){ b.disabled = true; b.title = 'This browser cannot record from a microphone.'; return; }
  b.onclick = async () => {
    if(_jzxRec){
      const r = _jzxRec; _jzxRec = null; clearInterval(r.timer);
      const got = await r.rec.stop();
      b.textContent = '🎙 Record'; if(ind) ind.hidden = true;
      openJazzTakeSave(t, got, r.context);
      return;
    }
    try {
      const rec = await jazzRecorder(); rec.start();
      const P = jazzPracFor(t.id);
      const context = {tempo: P.bpm, key: jazzTuneKeyNow(t), loopedBars: P.loop ? P.loop.slice() : null,
        autoTempo: !!P.autoTempo.on, autoKeyCycling: !!P.autoKey.on, pattern: P.autoKey.on ? P.autoKey.pattern : null};
      const t0 = Date.now();
      _jzxRec = {rec, context, timer: setInterval(() => { if(ind) ind.querySelector('b').textContent = jazzTakeLength((Date.now() - t0) / 1000); }, 500)};
      b.textContent = '■ Stop recording'; if(ind){ ind.hidden = false; }
      sound('click');
    } catch(e){ toast(e.message || 'The microphone is not available.'); }
  };
  addEventListener('hashchange', () => { if(_jzxRec){ clearInterval(_jzxRec.timer); _jzxRec.rec.stop(); _jzxRec = null; } }, {once: true});
}
function openJazzTakeSave(t, got, context){
  const when = new Date();
  const tags = jazzTakeTags({context});
  const m = openModal(`<h2>Keep this take</h2>
    <label class="pd-q"><span class="k">title</span><input class="inp" id="jjTitle" value="${esc(jazzTakeTitle(t, when))}"></label>
    <label class="pd-q" style="margin-top:8px"><span class="k">a note</span>
      <input class="inp" id="jjNote" placeholder="Working on the ii-V-I in bars 15–17"></label>
    <p class="mono faint" style="margin-top:8px">${esc(jazzTakeLength(got.seconds))}${tags.length ? ' · ' + esc(tags.join(' · ')) : ''}</p>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px">
      <button class="btn sm ghost" id="jjDrop">Discard</button><button class="btn primary" id="jjSave">Save</button></div>`, 'narrow');
  m.querySelector('#jjDrop').onclick = () => m.remove();
  m.querySelector('#jjSave').onclick = async () => {
    const audioId = await jazzPutAudio(got.blob);
    jazzAddRecording({kind: 'tune', tuneId: t.id, title: m.querySelector('#jjTitle').value.trim() || jazzTakeTitle(t, when),
      note: m.querySelector('#jjNote').value.trim(), date: when.toISOString(), seconds: got.seconds, audioId, context});
    m.remove(); sound('success'); toast('Kept in the journal.');
    const side = document.querySelector('#jzjSide');
    if(side){ side.outerHTML = jazzJournalSideHTML(t.id); const s2 = document.querySelector('#jzjSide');
      bindJazzTakeRows(s2, () => { s2.outerHTML = jazzJournalSideHTML(t.id); });
      $$('[data-jzgo]', s2).forEach(b => b.onclick = () => navigate(b.dataset.jzgo)); }
  };
}

/* the whole journal: every take on every tune */
const jazzJournalUi = () => S._jjournal = S._jjournal || {tune: '', from: '', to: '', q: ''};
function jazzJournalHTML(){
  const u = jazzJournalUi();
  const all = jazzTuneTakes();
  const tunes = [...new Set(all.map(r => r.tuneId))].map(id => ({id, title: (jazzTune(id) || {}).title || id}))
    .sort((a, b) => a.title.localeCompare(b.title));
  const q = u.q.trim().toLowerCase();
  const shown = all.filter(r => (!u.tune || r.tuneId === u.tune) && (!u.from || r.day >= u.from) && (!u.to || r.day <= u.to)
    && (!q || `${r.note || ''} ${r.title || ''}`.toLowerCase().includes(q)));
  return `<div class="row between" style="align-items:baseline">
      <h1 class="serif" style="margin:0">Practice journal</h1>
      <button class="btn sm ghost" data-jzgo="#/jazz/tunes">← the library</button></div>
    <p class="page-blurb">Every take you have recorded over a tune, newest first. ${esc(jazzJournalTotal(all))}.</p>
    <div class="jzj-filters">
      <select class="sel sm" data-jjf="tune"><option value="">every tune</option>${tunes.map(x =>
        `<option value="${esc(x.id)}" ${u.tune === x.id ? 'selected' : ''}>${esc(x.title)}</option>`).join('')}</select>
      <label class="mono">from <input class="inp sm" type="date" data-jjf="from" value="${esc(u.from)}"></label>
      <label class="mono">to <input class="inp sm" type="date" data-jjf="to" value="${esc(u.to)}"></label>
      <input class="inp sm" type="search" data-jjf="q" value="${esc(u.q)}" placeholder="search the notes"></div>
    <div class="row" style="gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0">
      <button class="btn sm ghost" id="jjExport" ${all.length ? '' : 'disabled'}>⬇ Export all recordings (.zip)</button>
      <span class="mono faint" id="jjStore">working out the storage…</span></div>
    ${shown.length ? `<ol class="jzj-list">${shown.map(r => jazzTakeRowHTML(r, true)).join('')}</ol>`
      : `<div class="empty">${all.length ? 'Nothing matches those filters.' : 'No takes yet. Record one from any tune page.'}</div>`}`;
}
function bindJazzJournal(root){
  const u = jazzJournalUi();
  $$('[data-jzgo]', root).forEach(b => b.onclick = () => navigate(b.dataset.jzgo));
  $$('[data-jjf]', root).forEach(el => el.onchange = () => { u[el.dataset.jjf] = el.value; rerender(); });
  const qEl = root.querySelector('[data-jjf="q"]');
  if(qEl) qEl.oninput = () => { clearTimeout(qEl._t); qEl._t = setTimeout(() => { u.q = qEl.value; rerender();
    const n = document.querySelector('[data-jjf="q"]'); if(n){ n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 350); };
  bindJazzTakeRows(root, () => rerender());
  const ex = root.querySelector('#jjExport');
  if(ex) ex.onclick = async () => { ex.disabled = true; ex.textContent = 'Packing…';
    try { await jazzExportTakes(); } finally { ex.disabled = false; ex.textContent = '⬇ Export all recordings (.zip)'; } };
  jazzStorageSaid().then(s => { const el = root.querySelector('#jjStore'); if(el){ el.textContent = s.said; el.classList.toggle('jzj-warn', s.warn); } });
}
async function jazzStorageSaid(){
  try {
    const e = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null;
    if(!e || !e.quota) return {said: 'This browser does not say how much storage is left.', warn: false};
    const mb = x => x >= 1e9 ? (x / 1e9).toFixed(1) + ' GB' : (x / 1e6).toFixed(1) + ' MB';
    const pct = e.usage / e.quota * 100;
    const warn = pct >= 80;
    return {warn, pct, said: `Storage used: ${mb(e.usage)} of ${mb(e.quota)} (${pct < 1 ? pct.toFixed(2) : Math.round(pct)}%)${
      warn ? ' — nearly full. Export the recordings and delete old ones.' : ''}`};
  } catch(e){ return {said: 'Storage could not be measured.', warn: false}; }
}
/* ---------- a zip, stored rather than compressed (audio does not compress) ---------- */
let _jzCrcTable = null;
function jazzCrc32(bytes){
  if(!_jzCrcTable){ _jzCrcTable = new Uint32Array(256);
    for(let n = 0; n < 256; n++){ let c = n; for(let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; _jzCrcTable[n] = c >>> 0; } }
  let c = 0xFFFFFFFF;
  for(let i = 0; i < bytes.length; i++) c = _jzCrcTable[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
/** files: [{name, data: Uint8Array, date?: Date}] → a Blob in the zip format */
function jazzZipStore(files){
  const enc = new TextEncoder();
  const parts = [], central = [];
  let offset = 0;
  const dosTime = d => ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF;
  const dosDate = d => (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  files.forEach(f => {
    const name = enc.encode(f.name), data = f.data, d = f.date || new Date(), crc = jazzCrc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint16(10, dosTime(d), true); h.setUint16(12, dosDate(d), true); h.setUint32(14, crc, true);
    h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), name, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
    c.setUint16(12, dosTime(d), true); c.setUint16(14, dosDate(d), true); c.setUint32(16, crc, true);
    c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true);
    c.setUint32(42, offset, true);
    central.push(new Uint8Array(c.buffer), name);
    offset += 30 + name.length + data.length;
  });
  const size = central.reduce((a, x) => a + x.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, size, true); end.setUint32(16, offset, true);
  return new Blob(parts.concat(central, [new Uint8Array(end.buffer)]), {type: 'application/zip'});
}
const jazzSlug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'take';
async function jazzTakesZip(){
  const takes = jazzTuneTakes();
  const files = [];
  for(const r of takes){
    const blob = await jazzGetAudio(r.audioId); if(!blob) continue;
    const t = jazzTune(r.tuneId);
    const ext = /ogg/.test(blob.type) ? 'ogg' : /mp4|aac/.test(blob.type) ? 'm4a' : /wav/.test(blob.type) ? 'wav' : 'webm';
    files.push({name: `${jazzSlug(t ? t.title : r.tuneId)}/${r.day}-${jazzSlug(r.note || r.id)}.${ext}`,
      data: new Uint8Array(await blob.arrayBuffer()), date: new Date(r.at || Date.now())});
  }
  files.push({name: 'journal.json', data: new TextEncoder().encode(JSON.stringify(takes.map(r => ({
    id: r.id, tuneId: r.tuneId, title: r.title, note: r.note, date: r.date || new Date(r.at).toISOString(),
    duration: r.seconds, context: r.context})), null, 2))});
  return jazzZipStore(files);
}
async function jazzExportTakes(){
  const blob = await jazzTakesZip();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `jazz-practice-journal-${today()}.zip`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast('Exported.');
}
