/* ============================================================
   THE TUNE DATABASE, JOINED TO THE CURRICULUM.

   Curriculum v3 Section 7 asks for five modules over the Real Book
   database: a library of all 917 entries, a repertoire tracker, a
   harmonic analysis tool, a lead-sheet renderer, and a system that
   recommends tunes on every exercise. This file is the engine under
   all five; 19-jazz-r-tunesui.js draws them.

   THE INDEX (Module 1: "Build a Map keyed by tune id for O(1) lookups.
   Build secondary indexes for each filter dimension."). The table of
   contents has 917 entries but 798 ids, because a tune can be in more
   than one volume — Afro Blue is in Volume 1 and Volume 2 — so an id
   maps to one row carrying every volume and page it appears on.

   THE STAGES (7A and 7B). The delivered alignments use the old
   seventeen-stage numbers; they are moved to v3 by the document's own
   table, old Stage 7 split between the altered dominants (v3 Stage 4)
   and the minor ii-V-i (v3 Stage 7). The v3 rules are then applied to
   every analysed tune on top, and a stage a rule gives as primary beats
   one the remap gave as secondary.

   THE CHART (Module 4). The chordProgression strings are not uniform:
   section labels (A1:, B:, Intro:, A(Latin):), bars split by pipes, "%"
   for a repeated bar, a number in parentheses after a chord, chords in
   parentheses for an optional turnaround, and here and there a word
   ("vamp", "drum solo", "FINE"). The parser reads all of it and never
   throws: what is not a chord is kept as text in the bar it was in.

   A NUMBER IN PARENTHESES IS A NUMBER OF BARS. The document says
   "F7(2)|Bb7(2)" is a beat allocation, but the data it describes
   cannot be read that way: So What is "Dm7(16)|Ebm7(8)|Dm7(8)" — its
   thirty-two bars — and Equinox is "Cm7(4)|Fm7(2)|Cm7(2)", the minor
   blues. So a lone chord with (n) fills n bars. Where two chords share a
   bar, the bar is split between them, which is the split-bar layout the
   document asks for.
   ============================================================ */

/* ---------- 7A: the old stages, moved to v3 ---------- */
const JAZZ_TUNE_OLD_TO_V3 = {1:[1], 2:[2], 3:[2], 5:[3], 6:[3], 7:'split', 8:[10], 9:[11], 10:[10], 11:[12], 13:[12]};
/* ---------- 7B: the v3 rules ---------- */
const JAZZ_TUNE_COMMON_KEYS = ['C', 'F', 'Bb', 'Eb'];
const JAZZ_TUNE_RULES = [
  [1, 'primary', t => t.difficulty === 'beginner' && JAZZ_TUNE_COMMON_KEYS.includes(jazzTuneTonic(t).name)],
  [2, 'primary', t => t.harmonicTags.hasIiVI === true],
  [3, 'primary', t => t.harmonicTags.hasBluesForm === true],
  [4, 'primary', t => (t.harmonicTags.dominantAlteredCount || 0) >= 1],
  /* No delivered tune carries a hasTritoneSubstitution tag, so the rule
     as written would put one tune on Stage 5. The chart analysis finds
     where the substitutions and the diminished passing chords actually
     are, and a tune it finds them in counts as having them. */
  [5, 'primary', t => { const h = t.harmonicTags, c = jazzTuneAnalysis(t).counts;
    return !!(h.hasDimWalkup || h.hasTritoneSubstitution || c.tritone || c.dim); }],
  /* "Any tune suitable for transcription practice": a tune with a named
     recording to transcribe from */
  [6, 'primary', t => (t.recordings || []).length > 0],
  [7, 'primary', t => t.harmonicTags.hasMinorIiVi === true],
  [8, 'primary', t => t.harmonicTags.hasRhythmChanges === true],
  [9, 'primary', t => t.category === 'ballad'],
  [10, 'primary', t => t.harmonicTags.isModal === true],
  [11, 'primary', t => (t.harmonicTags.keyChangeCount || 0) >= 2],
  [12, 'secondary', t => true]
];
function jazzTuneV3Alignment(t){
  const out = {};
  const put = (stage, role) => { const k = String(stage);
    if(!out[k] || (out[k] === 'secondary' && role === 'primary')) out[k] = role; };
  (t.stageAlignment || []).forEach(a => {
    const m = JAZZ_TUNE_OLD_TO_V3[a.stage];
    if(m === 'split'){
      const h = t.harmonicTags || {};
      if(h.hasMinorIiVi) put(7, a.role);
      if((h.dominantAlteredCount || 0) >= 1 || !h.hasMinorIiVi) put(4, a.role);
    } else (m || []).forEach(s => put(s, a.role));
  });
  JAZZ_TUNE_RULES.forEach(([s, role, test]) => { try { if(test(t)) put(s, role); } catch(e){} });
  return Object.keys(out).map(k => ({stage: +k, role: out[k]})).sort((a, b) => a.stage - b.stage);
}

/* ---------- the tonic a tune is written in ---------- */
const JAZZ_TUNE_PC = {C:0, 'C#':1, Db:1, D:2, 'D#':3, Eb:3, E:4, F:5, 'F#':6, Gb:6, G:7, 'G#':8, Ab:8, A:9, 'A#':10, Bb:10, B:11, Cb:11};
function jazzTuneTonic(t){
  const m = /^([A-G][b#]?)(m(?!aj))?/.exec(String((t && t.key) || 'C').trim());
  const name = m ? m[1] : 'C';
  return {name, pc: JAZZ_TUNE_PC[name] != null ? JAZZ_TUNE_PC[name] : 0, minor: !!(m && m[2])};
}

/* ---------- the user's additions (7D: the enrichment pathway) ---------- */
function jazzTunesState(){
  const j = jazzState();
  j.tunesAdded = Array.isArray(j.tunesAdded) ? j.tunesAdded : [];
  j.repertoire = j.repertoire && typeof j.repertoire === 'object' ? j.repertoire : {};
  j.tuneUi = j.tuneUi && typeof j.tuneUi === 'object' ? j.tuneUi : {};
  return j;
}

/* ---------- Module 1: the index ---------- */
let _jazzTuneIndex = null;
const jazzTuneIndexReset = () => { _jazzTuneIndex = null; };
function jazzTuneIndex(){
  if(_jazzTuneIndex) return _jazzTuneIndex;
  const db = (typeof REAL_BOOK_TUNE_DATABASE !== 'undefined' ? REAL_BOOK_TUNE_DATABASE : []).slice();
  const added = jazzTunesState().tunesAdded.filter(t => t && t.id && t.chordProgression);
  const toc = typeof REAL_BOOK_TOC !== 'undefined'
    ? [].concat(REAL_BOOK_TOC.volume1 || [], REAL_BOOK_TOC.volume2 || [], REAL_BOOK_TOC.volume3 || []) : [];
  const byId = new Map();
  const row = id => { if(!byId.has(id)) byId.set(id, {id, title: '', toc: [], tune: null, userAdded: false}); return byId.get(id); };
  toc.forEach(e => { const r = row(e.id); r.title = r.title || e.title;
    r.toc.push({volume: e.realBook.volume, page: e.realBook.page}); });
  db.concat(added).forEach(t => {
    const r = row(t.id);
    r.title = t.title || r.title;
    r.tune = t; r.userAdded = added.includes(t);
    if(!r.toc.length && t.realBook) r.toc.push({volume: t.realBook.volume, page: t.realBook.page});
  });
  /* the secondary indexes, one per filter dimension */
  const idx = {difficulty: new Map(), category: new Map(), form: new Map(), volume: new Map(),
    stage: new Map(), feature: new Map()};
  const add = (map, k, id) => { if(k == null || k === '') return; const key = String(k);
    if(!map.has(key)) map.set(key, new Set()); map.get(key).add(id); };
  byId.forEach(r => {
    r.analyzed = !!r.tune;
    r.volumes = [...new Set(r.toc.map(x => x.volume))];
    r.volumes.forEach(v => add(idx.volume, v, r.id));
    if(!r.tune) return;
    const t = r.tune;
    r.v3 = jazzTuneV3Alignment(t);
    add(idx.difficulty, t.difficulty, r.id);
    add(idx.category, t.category, r.id);
    add(idx.form, t.form, r.id);
    r.v3.forEach(a => add(idx.stage, a.stage, r.id));
    Object.keys(t.harmonicTags || {}).forEach(k => {
      const v = t.harmonicTags[k];
      if(v === true || (typeof v === 'number' && v > 0) || (Array.isArray(v) && v.length)) add(idx.feature, k, r.id);
    });
    /* the patterns the analysis finds, as features too, so "tritone
       substitutions" can be searched for even though no delivered tune
       carries a hasTritoneSubstitution tag */
    const found = jazzTuneAnalysis(t);
    if(found.counts.tritone) add(idx.feature, 'foundTritoneSub', r.id);
    if(found.counts.dim) add(idx.feature, 'foundDimPassing', r.id);
    if(found.counts.iivi) add(idx.feature, 'foundIiVI', r.id);
    if(found.counts.minor) add(idx.feature, 'foundMinorIiVi', r.id);
    if(found.counts.tonicization) add(idx.feature, 'foundTonicization', r.id);
  });
  const rows = [...byId.values()].sort((a, b) => a.title.localeCompare(b.title));
  _jazzTuneIndex = {byId, rows, idx, total: toc.length, analyzed: rows.filter(r => r.analyzed).length};
  return _jazzTuneIndex;
}
const jazzTuneRow = id => jazzTuneIndex().byId.get(id) || null;
const jazzTune = id => (jazzTuneRow(id) || {}).tune || null;
/* the v3 stages a tune belongs to */
const jazzTuneStages = id => (jazzTuneRow(id) || {}).v3 || [];

/* the filter, over the indexes — every dimension optional */
function jazzTuneFilter(f){
  const I = jazzTuneIndex();
  const q = String((f && f.q) || '').trim().toLowerCase();
  let ids = null;
  const narrow = set => { ids = ids ? new Set([...ids].filter(x => set.has(x))) : new Set(set); };
  ['difficulty', 'category', 'form', 'volume', 'stage'].forEach(d => {
    if(f && f[d]) narrow(I.idx[d].get(String(f[d])) || new Set()); });
  (f && f.features || []).forEach(k => narrow(I.idx.feature.get(k) || new Set()));
  let rows = ids ? I.rows.filter(r => ids.has(r.id)) : I.rows;
  if(f && f.analyzedOnly) rows = rows.filter(r => r.analyzed);
  if(q) rows = rows.filter(r => r.title.toLowerCase().includes(q)
    || (r.tune && `${r.tune.composer} ${r.tune.key} ${r.tune.form}`.toLowerCase().includes(q)));
  if(f && f.iiViKey) rows = rows.filter(r => r.tune && jazzTuneAnalysis(r.tune).iiViKeys.includes(f.iiViKey));
  return rows;
}

/* ---------- Module 4: reading a chart ---------- */
const JAZZ_CHORD_RE = /^([A-G])([b#]?)([^/\s]*?)(?:\/([A-G])([b#]?))?$/;
function jazzParseChord(tok){
  /* as printed: B♭maj7, C7♯9, Cm7♭5 */
  tok = String(tok == null ? '' : tok).trim().replace(/♭/g, 'b').replace(/♯/g, '#');
  const m = JAZZ_CHORD_RE.exec(tok);
  if(!m) return null;
  const q = m[3] || '';
  /* the quality the analysis needs, from however the chart spells it */
  const quality = /^(m7b5|ø|-7b5|mi7b5)/.test(q) ? 'hd'
    : /^(o|dim|°)/.test(q) ? 'dim'
    : /^(M7|maj|Δ|\^|6|69|M9)/.test(q) || q === '' ? 'maj'
    : /^(m|mi|min|-)/.test(q) ? 'min'
    : /^(\+|aug)/.test(q) && !/7/.test(q) ? 'aug'
    : /sus/.test(q) ? 'sus'
    : /^(7|9|11|13|\+7|7\+)/.test(q) || /^\+?7/.test(q) ? 'dom'
    : 'other';
  const altered = quality === 'dom' && /(b9|#9|b13|alt|#5|\+|b5|#11|#4)/.test(q);
  return {root: m[1] + (m[2] || ''), pc: JAZZ_TUNE_PC[m[1] + (m[2] || '')], q, quality, altered,
    bass: m[4] ? m[4] + (m[5] || '') : null, text: tok};
}
/**
 * A chart from a chordProgression string.
 * @returns {sections:[{label, bars:[{n, chords:[{text, chord, beats, optional}], notes:[]}]}], bars}
 */
function jazzParseChart(str){
  const s = String(str || '').trim();
  const out = {sections: [], bars: [], prose: ''};
  if(!s) return out;
  /* a line with no pipes and no chord at the front is a description, not a chart */
  if(!/\|/.test(s) && !/^[A-G][b#]?\S*(\s|$)/.test(s) && !/^[A-Z]\d?:/.test(s)){ out.prose = s; return out; }
  const labelRe = /(?:^|[\s|])((?:Intro|Coda|Outro|Tag|Interlude|[A-D]\d?)(?:\([A-Za-z ]+\))?):\s*/g;
  const marks = [];
  let m;
  while((m = labelRe.exec(s))) marks.push({label: m[1], at: m.index + m[0].indexOf(m[1]), end: labelRe.lastIndex});
  const chunks = [];
  if(!marks.length || marks[0].at > 0) chunks.push({label: '', text: s.slice(0, marks.length ? marks[0].at : s.length)});
  marks.forEach((mk, i) => chunks.push({label: mk.label, text: s.slice(mk.end, i + 1 < marks.length ? marks[i + 1].at : s.length)}));
  let n = 0, prev = null;
  chunks.forEach(ch => {
    const sec = {label: ch.label, bars: []};
    ch.text.split('|').map(x => x.trim()).filter((x, i, a) => x || (i > 0 && i < a.length - 1)).forEach(raw => {
      if(!raw) return;
      const toks = raw.replace(/\)\(/g, ') (').split(/\s+/).filter(Boolean);
      if(toks.length === 1 && (toks[0] === '%' || toks[0] === 'x')){
        const bar = {n: ++n, chords: prev ? prev.chords.map(c => Object.assign({}, c, {repeat: true})) : [], notes: [], repeat: true};
        sec.bars.push(bar); out.bars.push(bar); prev = bar; return;
      }
      const chords = [], notes = [];
      let span = 1;
      toks.forEach(tok => {
        let t = tok, optional = false, count = null, note = null;
        if(/^\(.*\)$/.test(t) && JAZZ_CHORD_RE.test(t.slice(1, -1).replace(/\(.*\)$/, ''))){ optional = true; t = t.slice(1, -1); }
        else if(/^\(/.test(t) && !/\)/.test(t)){ optional = true; t = t.slice(1); }
        else if(/\)$/.test(t) && !/\(/.test(t)){ optional = true; t = t.slice(0, -1); }
        const cm = /^(.*?)\((\d+)\)$/.exec(t);
        if(cm){ t = cm[1]; count = +cm[2]; }
        const wm = /^(.*?)\(([A-Za-z][A-Za-z .]+|[A-G][b#]?)\)$/.exec(t);
        if(wm && JAZZ_CHORD_RE.test(wm[1]) && !/^(b|#|M7|maj7|b6|b9|#9|#11|b13)/.test(wm[2])){ t = wm[1]; note = wm[2]; }
        if(/\.\.\.$/.test(t)){ t = t.replace(/\.\.\.$/, ''); notes.push('…'); }
        /* road-map words ("D.C. al FINE") are directions, not an F chord and a D */
        const chord = t && !/^(D\.[CS]\.?|FINE|Fine|al|Coda|CODA|Segno)$/.test(t) ? jazzParseChord(t) : null;
        if(chord){ chords.push({text: t, chord, optional}); if(count && toks.length === 1) span = count; else if(count) chords[chords.length - 1].beats = count; }
        else if(t) notes.push(t);
        if(note) notes.push(note);
      });
      /* the beats: given, or shared evenly */
      const free = chords.filter(c => !c.beats);
      const given = chords.reduce((a, c) => a + (c.beats || 0), 0);
      free.forEach(c => c.beats = Math.max(1, Math.round((4 - Math.min(given, 3)) / free.length)));
      const bar = {n: ++n, chords, notes};
      sec.bars.push(bar); out.bars.push(bar); prev = bar;
      for(let k = 1; k < span; k++){
        const rep = {n: ++n, chords: chords.map(c => Object.assign({}, c, {repeat: true})), notes: [], repeat: true};
        sec.bars.push(rep); out.bars.push(rep); prev = rep;
      }
    });
    if(sec.bars.length || sec.label) out.sections.push(sec);
  });
  return out;
}

/* ---------- transposing a chart ---------- */
const JAZZ_TUNE_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const JAZZ_TUNE_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const JAZZ_TUNE_SHARP_KEYS = ['G', 'D', 'A', 'E', 'B', 'F#'];
function jazzTuneShift(t, toKey){
  if(!toKey) return 0;
  const from = jazzTuneTonic(t).pc, to = JAZZ_TUNE_PC[toKey];
  if(to == null) return 0;
  let d = ((to - from) % 12 + 12) % 12;
  if(d > 6) d -= 12;
  return d;
}
function jazzTransposeChord(text, semis, toKey){
  if(!semis) return text;
  const names = JAZZ_TUNE_SHARP_KEYS.includes(toKey) ? JAZZ_TUNE_SHARP : JAZZ_TUNE_FLAT;
  const mv = r => { const pc = JAZZ_TUNE_PC[r]; return pc == null ? r : names[((pc + semis) % 12 + 12) % 12]; };
  const m = JAZZ_CHORD_RE.exec(text);
  if(!m) return text;
  return mv(m[1] + (m[2] || '')) + (m[3] || '') + (m[4] ? '/' + mv(m[4] + (m[5] || '')) : '');
}
/* how a chord symbol is printed: flats and sharps as signs */
const jazzPrettyChord = t => String(t || '').replace(/^([A-G])b/, '$1♭').replace(/^([A-G])#/, '$1♯')
  .replace(/\/([A-G])b/, '/$1♭').replace(/\/([A-G])#/, '/$1♯')
  .replace(/M7/g, 'maj7').replace(/^([A-G][♭♯]?)o7/, '$1°7').replace(/^([A-G][♭♯]?)o$/, '$1°');

/* ---------- Module 3: the patterns in a chart ----------
   What the document colours on the chart: ii-V-I spans in blue,
   tonicisations in green, tritone substitutions in orange, diminished
   walk-ups in purple. The delivered tunes carry counts but not WHERE;
   this finds where, from the chords. A minor ii-V-i is counted with the
   ii-V-Is (it is one) and named as minor. */
function jazzTuneAnalysis(t){
  if(!t) return {spans: [], counts: {}, iiViKeys: []};
  if(t._analysis) return t._analysis;
  const chart = jazzParseChart(t.chordProgression);
  const ev = [];
  /* a repeated bar is the same chord held, not the chord played again */
  chart.bars.forEach(b => b.chords.forEach(c => {
    if(c.repeat && ev.length && ev[ev.length - 1].text === c.text) return;
    ev.push({bar: b.n, text: c.text, ...c.chord}); }));
  const tonic = jazzTuneTonic(t);
  const spans = [];
  const up4 = (a, b) => a != null && b != null && ((b - a + 12) % 12) === 5;
  for(let i = 0; i < ev.length; i++){
    const a = ev[i], b = ev[i + 1], c = ev[i + 2];
    /* ii-V-I and ii-V-i */
    if(b && c && up4(a.pc, b.pc) && up4(b.pc, c.pc) && b.quality === 'dom'){
      if(a.quality === 'min' && (c.quality === 'maj' || c.quality === 'dom')){
        const home = c.pc === tonic.pc;
        spans.push({kind: home ? 'iivi' : 'tonicization', from: a.bar, to: c.bar, at: [i, i + 2],
          label: `ii-V-I to ${c.root}`, target: c.root});
      } else if((a.quality === 'hd' || a.quality === 'min') && c.quality === 'min'){
        spans.push({kind: 'minor', from: a.bar, to: c.bar, at: [i, i + 2], label: `minor ii-V-i to ${c.root}m`, target: c.root});
      }
    }
    /* a dominant a fifth above a chord that is not the tonic: a tonicisation, when no ii-V-I already said so */
    if(b && a.quality === 'dom' && up4(a.pc, b.pc) && b.pc !== tonic.pc && (b.quality === 'maj' || b.quality === 'min')
       && !spans.some(s => s.at[1] === i + 1 && s.at[0] === i - 1)){
      spans.push({kind: 'tonicization', from: a.bar, to: b.bar, at: [i, i + 1], label: `V7 of ${b.root}`, target: b.root});
    }
    /* a dominant resolving down a half step: a tritone substitution */
    if(b && a.quality === 'dom' && a.pc != null && b.pc != null && ((a.pc - b.pc + 12) % 12) === 1){
      spans.push({kind: 'tritone', from: a.bar, to: b.bar, at: [i, i + 1], label: `${a.root}7 for ${JAZZ_TUNE_FLAT[(a.pc + 6) % 12]}7, into ${b.root}`, target: b.root});
    }
    /* a diminished chord between two chords a half step either side: passing */
    if(b && a.quality === 'dim' && a.pc != null && b.pc != null && (((b.pc - a.pc + 12) % 12) === 1)){
      const before = ev[i - 1];
      spans.push({kind: 'dim', from: before && ((a.pc - before.pc + 12) % 12) === 1 ? before.bar : a.bar, to: b.bar,
        at: [i, i + 1], label: `${a.root}° walking up to ${b.root}`, target: b.root});
    }
  }
  const counts = {};
  spans.forEach(s => counts[s.kind] = (counts[s.kind] || 0) + 1);
  const iiViKeys = [...new Set(spans.filter(s => s.kind === 'iivi' || s.kind === 'tonicization')
    .filter(s => /ii-V-I/.test(s.label)).map(s => s.target))];
  const res = {chart, events: ev, spans, counts, iiViKeys};
  Object.defineProperty(t, '_analysis', {value: res, enumerable: false, configurable: true});
  return res;
}
/* the bars a pattern of each kind touches, for colouring a chart */
function jazzTuneBarMarks(t){
  const marks = {};
  jazzTuneAnalysis(t).spans.forEach(s => {
    for(let b = s.from; b <= s.to; b++){ (marks[b] = marks[b] || []); if(!marks[b].includes(s.kind)) marks[b].push(s.kind); }
  });
  return marks;
}
/* The document's four colours, as CSS variables so each theme has its own
   step (02-css-sections.html). Validated for colour-blind separation across
   every pair, in both themes; the minor ii-V-i shares the ii-V-I's blue and
   is told apart by a dashed edge, and every mark carries its name as text. */
const JAZZ_TUNE_PATTERNS = {
  iivi:         {color: 'var(--jzp-iivi)', said: 'ii-V-I'},
  minor:        {color: 'var(--jzp-iivi)', said: 'minor ii-V-i', dashed: true},
  tonicization: {color: 'var(--jzp-ton)', said: 'tonicisation'},
  tritone:      {color: 'var(--jzp-tri)', said: 'tritone substitution'},
  dim:          {color: 'var(--jzp-dim)', said: 'diminished walk-up / passing'}
};

/* ---------- Module 2: the repertoire ---------- */
const JAZZ_REP_STATUS = [['want', 'Want to learn'], ['learning', 'Learning'], ['learned', 'Learned']];
const jazzRepStatus = id => (jazzTunesState().repertoire[id] || {}).status || null;
function jazzRepSet(id, status){
  const rep = jazzTunesState().repertoire;
  if(!status){ delete rep[id]; saveNow(); return null; }
  const was = rep[id] || {};
  rep[id] = {status, since: was.status === status ? was.since : today(), updated: today()};
  saveNow();
  return rep[id];
}
/* "B1-U2, B2-U3" → the v3 stages those units belong to */
function jazzTuneUnitStages(t){
  const code = String(((t && t.lists) || {}).siskindUnitSuggestion || '');
  return (code.match(/B\d-U\d+/g) || []).map(c => ({unit: c, stage: jazzV3StageOfUnitCode(c)}));
}
/* the progress the document asks the tracker to show */
function jazzRepertoireProgress(){
  const I = jazzTuneIndex(), rep = jazzTunesState().repertoire;
  const learned = I.rows.filter(r => (rep[r.id] || {}).status === 'learned');
  const perStage = {};
  (typeof JAZZ_V3_ORDER === 'object' ? JAZZ_V3_ORDER : []).filter(s => /^\d+$/.test(s)).forEach(s => {
    const on = I.rows.filter(r => r.analyzed && (r.v3 || []).some(a => String(a.stage) === s && a.role === 'primary'));
    perStage[s] = {learned: on.filter(r => (rep[r.id] || {}).status === 'learned').length,
      learning: on.filter(r => (rep[r.id] || {}).status === 'learning').length, of: on.length};
  });
  const bank = I.rows.filter(r => r.tune && r.tune.lists && r.tune.lists.siskindTuneBank);
  const bankLearned = bank.filter(r => (rep[r.id] || {}).status === 'learned');
  const concepts = {};
  ['hasIiVI', 'hasMinorIiVi', 'hasBluesForm', 'hasRhythmChanges', 'isModal', 'hasTonicization',
   'hasDimWalkup', 'hasColtraneChanges', 'hasBackdoorIiV', 'hasChromaticMovement', 'dominantAlteredCount', 'keyChangeCount']
    .forEach(k => { const all = I.idx.feature.get(k) || new Set();
      concepts[k] = {learned: learned.filter(r => all.has(r.id)).length, of: all.size}; });
  return {learned: learned.length, learning: I.rows.filter(r => (rep[r.id] || {}).status === 'learning').length,
    want: I.rows.filter(r => (rep[r.id] || {}).status === 'want').length,
    perStage, bank: {learned: bankLearned.length, of: bank.length,
      pct: bank.length ? Math.round(bankLearned.length / bank.length * 100) : 0}, concepts};
}

/* ---------- Module 5: tunes for an exercise ----------
   "For each v3 stage, build a pre-computed list of primary and secondary
   tunes … display a 'Recommended Tunes' sidebar showing the top 5 tunes
   for that stage." The document names particular tunes for three
   exercises, and those lead where they apply. */
const JAZZ_TUNE_PICKS = {
  '2': ['autumn-leaves'],
  '3': ['blue-monk', 'billies-bounce', 'straight-no-chaser'],
  '7': ['autumn-leaves', 'my-funny-valentine', 'a-night-in-tunisia']
};
/* which delivered feature each stage's exercises should be linked to (Module 3) */
const JAZZ_TUNE_STAGE_FEATURE = {'2': ['hasIiVI'], '4': ['dominantAlteredCount'],
  '5': ['hasDimWalkup', 'foundTritoneSub'], '7': ['hasMinorIiVi'], '10': ['isModal']};
let _jazzTunesByStage = null;
function jazzTunesForStage(sid){
  if(!_jazzTunesByStage){
    _jazzTunesByStage = {};
    const I = jazzTuneIndex();
    const rank = r => [r.tune.lists && r.tune.lists.siskindTuneBank ? 0 : 1,
      ['beginner', 'intermediate', 'advanced'].indexOf(r.tune.difficulty)];
    I.rows.filter(r => r.analyzed).forEach(r => (r.v3 || []).forEach(a => {
      (_jazzTunesByStage[a.stage] = _jazzTunesByStage[a.stage] || []).push({row: r, role: a.role}); }));
    Object.keys(_jazzTunesByStage).forEach(s => _jazzTunesByStage[s].sort((x, y) => {
      if(x.role !== y.role) return x.role === 'primary' ? -1 : 1;
      const a = rank(x.row), b = rank(y.row);
      return a[0] - b[0] || a[1] - b[1] || x.row.title.localeCompare(y.row.title);
    }));
  }
  const n = /^\d+$/.test(String(sid)) ? +sid : null;
  return n == null ? [] : (_jazzTunesByStage[n] || []);
}
function jazzRecommendedTunes(ex, limit){
  const sid = String((ex && ex.stage) || '');
  const list = jazzTunesForStage(sid);
  const picks = (JAZZ_TUNE_PICKS[sid] || []).filter(id => jazzTune(id));
  const out = picks.map(id => ({row: jazzTuneRow(id), role: 'named', named: true}));
  list.forEach(x => { if(out.length < (limit || 5) && !out.some(o => o.row.id === x.row.id)) out.push(x); });
  return out.slice(0, limit || 5);
}

/* ---------- iReal Pro ----------
   Section 4C asks for an iReal Pro chart link for every tune. iReal Pro
   opens an "irealbook://" link as a chart: title, composer, style, key,
   and the changes in its own shorthand (^7 for major seventh, -7 for
   minor, h7 for half-diminished, x for a repeated bar). */
function jazzIrealChord(text){
  return String(text).replace(/(maj7|M7|Δ)/, '^7').replace(/maj9/, '^9').replace(/m7b5/, 'h7')
    .replace(/^([A-G][b#]?)m(?!aj)/, '$1-').replace(/o7/, 'o7').replace(/\+7/, '7#5');
}
function jazzIrealLink(t, toKey){
  const chart = jazzParseChart(t.chordProgression);
  const semis = jazzTuneShift(t, toKey);
  const key = toKey || jazzTuneTonic(t).name;
  const body = chart.sections.map(sec => {
    const lab = /^[A-D]/.test(sec.label) ? `*${sec.label.charAt(0)}` : '';
    return lab + '[' + sec.bars.map(b => b.repeat && !b.chords.length ? 'x'
      : b.repeat ? 'x' : b.chords.map(c => jazzIrealChord(jazzTransposeChord(c.text, semis, toKey))).join(' ')).join('|') + ']';
  }).join(' ');
  const [time] = String(t.timeSignature || '4/4').split('/');
  const style = t.category === 'bossa' ? 'Bossa Nova' : t.category === 'ballad' ? 'Ballad'
    : t.category === 'waltz' ? 'Jazz Waltz' : 'Medium Swing';
  return 'irealbook://' + [t.title, t.composer, style, key + (jazzTuneTonic(t).minor ? '-' : ''), 'n',
    `T${time}${String(t.timeSignature || '4/4').split('/')[1] || '4'}${body}`].map(x => encodeURIComponent(x)).join('=');
}
