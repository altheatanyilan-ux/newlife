/* ============================================================
   RECORDING SYNC — PHASE 1: THE SYNC MAP

   A sync map ties a recording to a piece: where, in the audio, each bar
   of each chorus falls. It is made by the alignment engine (Phase 2,
   19-sync-b-engine.js) and read by everything that follows a recording
   along the page. Nothing here touches the page, the database or the
   audio; these are plain functions of plain data, so the same code runs
   in the page, in a Worker and under Node for the unit tests
   (test-syncmap.js).

   THE MAP, as specified:
     {id, pieceId, recordingId, transposition, tuningOffsetCents,
      performanceOrder: [{label, type: 'head'|'solo'|'unmapped', chorus,
                          audioStart, audioEnd}],
      syncPoints: [{chorus, measure, beat, time, confidence}],
      overallConfidence, engineVersion, createdAt}
   plus one field the functions cannot do without: `form`, the length of
   one chorus — {measures, beats (per measure), measureBeats?: [per
   measure, where the metre changes]} — because "bar 3 of chorus 2" is a
   point in the audio only once it is known how many beats a chorus has.

   NUMBERING. Choruses and measures count from 1, as a musician counts.
   `beat` is a beat number, 1 on the downbeat, and may be fractional:
   2.5 is the "and" of two. Inside the functions a place in the music is
   one number — beats since the downbeat of bar 1 of chorus 1 — and the
   sync points are a monotone piecewise-linear function from that number
   to seconds, so both directions are one binary search and one
   interpolation. Before the first point and after the last, the nearest
   segment's tempo carries on (a map made by the engine always has points
   at the first and last bar it heard, so this matters only for the edges
   of a bar).

   UNROLLING. What the recording plays is the chart unrolled: repeats,
   1st/2nd endings, D.C. and D.S., To Coda, Fine. The road map for that
   is the one the score player already follows (plxRoadMap in
   19-score-play.js), so a MusicXML score and a chord chart are unrolled
   the same way. A chart from the tune database is read by the Jazz
   Studio's own parser (jazzParseChart — a number in parentheses is a
   number of bars there, "Dm7(16)", and two chords in a bar split it),
   and its sections are put in the order the tune's `form` and `measures`
   say, where the chart writes each section only once.
   ============================================================ */
const SYNC_ENGINE_VERSION = 'sync-2.0';

function syncMapNew(o = {}){
  const form = o.form || {};
  return {
    id: o.id || ('sync-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)),
    pieceId: o.pieceId || null,
    recordingId: o.recordingId || null,
    transposition: o.transposition || 0,
    tuningOffsetCents: o.tuningOffsetCents || 0,
    form: {measures: Math.max(1, form.measures | 0 || 32), beats: Math.max(1, form.beats | 0 || 4),
      measureBeats: Array.isArray(form.measureBeats) && form.measureBeats.length ? form.measureBeats.slice() : null},
    performanceOrder: (o.performanceOrder || []).map(e => Object.assign({}, e)),
    syncPoints: (o.syncPoints || []).map(p => Object.assign({}, p)),
    overallConfidence: o.overallConfidence == null ? 0 : o.overallConfidence,
    engineVersion: o.engineVersion || SYNC_ENGINE_VERSION,
    createdAt: o.createdAt || new Date().toISOString(),
  };
}

/* ---------- a place in the music as one number ---------- */
/* where each measure of a chorus starts, in beats; the last entry is the
   length of the chorus */
function syncMeasureStarts(form){
  const f = form || {}, n = Math.max(1, f.measures | 0 || 1), per = f.beats || 4;
  const mb = Array.isArray(f.measureBeats) ? f.measureBeats : null;
  const out = new Float64Array(n + 1);
  for(let m = 0; m < n; m++) out[m + 1] = out[m] + (mb && mb[m] > 0 ? mb[m] : per);
  return out;
}
const _syncStarts = new WeakMap();
function syncStartsOf(map){
  const f = map.form || {};
  const key = (f.measures | 0) + '/' + (f.beats || 4) + '/' + (f.measureBeats ? f.measureBeats.join(',') : '');
  const c = _syncStarts.get(map);
  if(c && c.key === key) return c.starts;
  const starts = syncMeasureStarts(f);
  _syncStarts.set(map, {key, starts});
  return starts;
}
/* chorus, measure, beat → beats since the top. A measure past the end of
   the chorus runs on into the next one. */
function syncPos(map, chorus, measure, beat){
  const st = syncStartsOf(map), n = st.length - 1, len = st[n];
  let c = (chorus == null ? 1 : +chorus) - 1, m = (measure == null ? 1 : +measure) - 1;
  const b = (beat == null ? 1 : +beat) - 1;
  if(!isFinite(c) || !isFinite(m) || !isFinite(b)) return NaN;
  const mi = Math.floor(m), mf = m - mi;
  c += Math.floor(mi / n);
  const k = ((mi % n) + n) % n;
  return c * len + st[k] + mf * (st[k + 1] - st[k]) + b;
}
/* beats since the top → chorus, measure, beat */
function syncPlace(map, p){
  const st = syncStartsOf(map), n = st.length - 1, len = st[n];
  const c = Math.floor(p / len + 1e-9);
  let r = p - c * len;
  if(r < 0) r = 0;
  let lo = 0, hi = n - 1;
  while(lo < hi){ const mid = (lo + hi + 1) >> 1; if(st[mid] <= r + 1e-9) lo = mid; else hi = mid - 1; }
  const beat = r - st[lo] + 1;
  return {chorus: c + 1, measure: lo + 1, beat: Math.round(beat * 1e6) / 1e6};
}

/* ---------- the points, as a monotone function ---------- */
/* Sorted by time; a point that would make the music go backwards (or
   stand still while the clock runs, or the reverse) is left out, so the
   function is always invertible. Cached per map and rebuilt when the
   points change. */
const _syncTrack = new WeakMap();
function syncTrack(map){
  const pts = map.syncPoints || [];
  const sig = pts.length + ':' + (pts.length ? pts[0].time + '/' + pts[pts.length - 1].time : '') + ':' + JSON.stringify(map.form || {});
  const c = _syncTrack.get(map);
  if(c && c.pts === pts && c.sig === sig) return c;
  const rows = pts.map(q => ({p: syncPos(map, q.chorus, q.measure, q.beat), t: +q.time, c: q.confidence == null ? 1 : +q.confidence, q}))
    .filter(r => isFinite(r.p) && isFinite(r.t)).sort((a, b) => a.t - b.t || a.p - b.p);
  const P = [], T = [], C = [], Q = [];
  rows.forEach(r => {
    const k = P.length;
    if(k && (r.p <= P[k - 1] + 1e-9 || r.t <= T[k - 1] + 1e-9)) return;
    P.push(r.p); T.push(r.t); C.push(r.c); Q.push(r.q);
  });
  const out = {pts, sig, P: Float64Array.from(P), T: Float64Array.from(T), C: Float64Array.from(C), Q};
  _syncTrack.set(map, out);
  return out;
}
/* the segment [i, i+1] holding x in the sorted array A, clamped to the ends */
function syncSeg(A, x){
  const n = A.length;
  if(n < 2) return 0;
  if(x <= A[0]) return 0;
  if(x >= A[n - 1]) return n - 2;
  let lo = 0, hi = n - 1;
  while(hi - lo > 1){ const mid = (lo + hi) >> 1; if(A[mid] <= x) lo = mid; else hi = mid; }
  return lo;
}

/**
 * Where a place in the music is heard in the recording.
 * @param {object} syncMap
 * @param {number} chorus   1-based; choruses count across the whole performance
 * @param {number} measure  1-based within the chorus (fractional allowed)
 * @param {number} beatFraction  1-based beat, fractional allowed (2.5 = "and" of 2)
 * @returns {number|null} seconds into the audio, or null with fewer than two points
 */
function scoreToAudioTime(syncMap, chorus, measure, beatFraction){
  if(!syncMap) return null;
  const tr = syncTrack(syncMap), P = tr.P, T = tr.T;
  const p = syncPos(syncMap, chorus, measure, beatFraction == null ? 1 : beatFraction);
  if(!isFinite(p) || !P.length) return null;
  if(P.length === 1) return Math.abs(p - P[0]) < 1e-9 ? T[0] : null;
  const i = syncSeg(P, p);
  return T[i] + (p - P[i]) * (T[i + 1] - T[i]) / (P[i + 1] - P[i]);
}

/* the stretch of the performance a moment falls in */
function syncSectionAt(syncMap, seconds){
  const po = (syncMap && syncMap.performanceOrder) || [];
  for(let i = 0; i < po.length; i++){
    const e = po[i];
    if(seconds >= e.audioStart && seconds < e.audioEnd) return e;
  }
  /* the very end of the last stretch belongs to it */
  const last = po[po.length - 1];
  return last && seconds === last.audioEnd ? last : null;
}

/**
 * What is being played at a moment of the recording.
 * @returns {{chorus, measure, beat, sectionType, label?}} — sectionType
 *   'unmapped' (with chorus, measure and beat null) in an intro, an ending,
 *   applause, a drum solo: anywhere the performance order says is not the
 *   form, and anywhere before the first sync point or after the last.
 */
function audioToScoreTime(syncMap, seconds){
  const none = label => ({chorus: null, measure: null, beat: null, sectionType: 'unmapped', label: label || null});
  if(!syncMap || !isFinite(seconds)) return none();
  const sec = syncSectionAt(syncMap, seconds);
  if(sec && sec.type === 'unmapped') return none(sec.label);
  const tr = syncTrack(syncMap), P = tr.P, T = tr.T;
  if(P.length < 2 || seconds < T[0] - 1e-6 || seconds > T[T.length - 1] + 1e-6) return none(sec && sec.label);
  const i = syncSeg(T, seconds);
  const p = P[i] + (seconds - T[i]) * (P[i + 1] - P[i]) / (T[i + 1] - T[i]);
  const at = syncPlace(syncMap, p);
  const own = sec && sec.chorus === at.chorus ? sec
    : ((syncMap.performanceOrder || []).find(e => e.type !== 'unmapped' && e.chorus === at.chorus) || sec);
  return {chorus: at.chorus, measure: at.measure, beat: at.beat,
    sectionType: own && own.type !== 'unmapped' ? own.type : 'head', label: own ? own.label : null};
}

/**
 * The tempo as it was played: between each pair of neighbouring sync
 * points, beats per minute = 60 × beats ÷ seconds.
 * @param {object} syncMap
 * @param {{smooth?: number}} [opts] smooth: average over that many beats either side
 * @returns {[{time, start, end, bpm, chorus, measure, beat, confidence}]}
 *   time is the middle of the stretch; chorus/measure/beat where it starts.
 */
function getTempoCurve(syncMap, opts = {}){
  if(!syncMap) return [];
  const tr = syncTrack(syncMap), P = tr.P, T = tr.T, C = tr.C, n = P.length;
  const out = [];
  for(let i = 0; i + 1 < n; i++){
    const at = syncPlace(syncMap, P[i]);
    out.push({time: (T[i] + T[i + 1]) / 2, start: T[i], end: T[i + 1], bpm: 60 * (P[i + 1] - P[i]) / (T[i + 1] - T[i]),
      chorus: at.chorus, measure: at.measure, beat: at.beat, confidence: Math.min(C[i], C[i + 1])});
  }
  const w = +opts.smooth || 0;
  if(w > 0 && out.length > 1){
    /* over a window of beats: total beats ÷ total time, so a long slow
       stretch weighs what it lasted, not one vote */
    const mid = out.map((_, i) => (P[i] + P[i + 1]) / 2);
    return out.map((r, i) => {
      let lo = i, hi = i;
      while(lo > 0 && mid[i] - mid[lo - 1] <= w) lo--;
      while(hi < out.length - 1 && mid[hi + 1] - mid[i] <= w) hi++;
      return Object.assign({}, r, {bpm: 60 * (P[hi + 1] - P[lo]) / (T[hi + 1] - T[lo])});
    });
  }
  return out;
}

/* ---------- unrolling ---------- */
/* A MusicXML score's bars in the order they are played. Each is one
   measure of the unrolled "chorus": {k (written bar), number (as
   printed), beats}. */
function syncUnrollMusicXml(xml){
  /* a timeline already read is used as it is */
  const tl = xml && xml.order && xml.measures ? xml : musicXmlTimeline(xml);
  const bars = tl.order.map((k, i) => ({i, k, number: tl.measures[k].number, beats: tl.measures[k].len || tl.measures[k].beats || 4}));
  return syncFormFromBars(bars, {issues: tl.issues, how: 'the score\'s own road map'});
}

/* The same road map with the repeats not taken, as a performer who skips
   them plays it: repeat barlines ignored, first endings left out (the last
   ending is the one that leads on), D.C., D.S., To Coda and Fine kept. */
function syncRoadMapNoRepeats(info){
  const n = info.length, drop = new Uint8Array(n);
  for(let k = 0; k < n; k++) if(info[k].ending){
    let j = k; while(j < n - 1 && !info[j].endingStop && !(j > k && info[j].ending)) j++;
    if(j > k && info[j].ending) j--;
    const next = info[j + 1];
    if(next && next.ending) for(let q = k; q <= j; q++) drop[q] = 1;
  }
  const plain = info.map(b => { const c = Object.assign({}, b); delete c.back; delete c.fwd; delete c.ending; delete c.endingStop; return c; });
  return plxRoadMap(plain).filter(k => !drop[k]);
}

/* Every way a performer might take a score's repeats: each repeat sign
   (a backward barline) taken or not, independently — Kreisleriana players
   take some and skip others. For up to four repeats every combination;
   beyond that, all, none, and each one alone skipped or alone taken.
   Returns [{how, order}] with the as-written reading first. */
function syncRoadMapReadings(info){
  const n = info.length, backs = [];
  for(let k = 0; k < n; k++) if(info[k].back) backs.push(k);
  const out = [{how: 'as written', order: plxRoadMap(info)}];
  if(!backs.length) return out;
  /* the ending bracket (if any) a repeat's backward barline sits in */
  const bracketOf = k => {
    if(!info[k].ending) return null;
    let a = k; while(a > 0 && !info[a].ending) a--;
    while(a > 0 && info[a - 1].ending && !info[a - 1].endingStop && info[a - 1].ending === info[a].ending) a--;
    return [a, k];
  };
  const endingsAfter = k => { const r = []; let j = k + 1; while(j < n && info[j].ending){ r.push(j); j++; } return r; };
  const skipOrder = skip => {
    const plain = info.map(b => Object.assign({}, b)), drop = new Uint8Array(n);
    skip.forEach(k => {
      delete plain[k].back;
      const br = bracketOf(k);
      if(br){ for(let q = br[0]; q <= br[1]; q++) drop[q] = 1; endingsAfter(k).forEach(q => { delete plain[q].ending; delete plain[q].endingStop; }); }
    });
    return plxRoadMap(plain).filter(k => !drop[k]);
  };
  const sets = [];
  const R = backs.length;
  if(R <= 4){ for(let m = 1; m < (1 << R); m++) sets.push(backs.filter((_, i) => m & (1 << i))); }
  else { sets.push(backs.slice()); backs.forEach(b => sets.push([b])); backs.forEach(b => sets.push(backs.filter(x => x !== b))); }
  const seen = new Set([out[0].order.join(',')]);
  sets.forEach(sk => {
    const order = skipOrder(sk), key = order.join(',');
    if(seen.has(key)) return; seen.add(key);
    const bars = sk.map(k => (info[k].number != null ? info[k].number : k + 1));
    out.push({how: sk.length === R ? 'without the repeats' : 'skipping the repeat' + (sk.length > 1 ? 's' : '') + ' at bar' + (sk.length > 1 ? 's ' : ' ') + sk.map(k => k + 1).join(', '), order});
  });
  return out;
}

/* the map's `form` from a list of unrolled bars */
function syncFormFromBars(bars, extra = {}){
  const beats = syncMostCommon(bars.map(b => b.beats || 4)) || 4;
  const mb = bars.map(b => b.beats || beats);
  return Object.assign({bars, measures: bars.length, beats, measureBeats: mb.some(x => x !== beats) ? mb : null}, extra);
}
function syncMostCommon(a){
  const n = new Map(); let best = null, bn = 0;
  a.forEach(x => { const c = (n.get(x) || 0) + 1; n.set(x, c); if(c > bn){ bn = c; best = x; } });
  return best;
}

/* The road-map marks in a chart bar: the words the parser kept aside
   ("FINE", "D.C. al FINE", "Segno", "To Coda") and the section it opens. */
function syncChartMarks(bar, label){
  const w = (bar.notes || []).join(' ') + ' ' + (bar._words || '');
  const info = {};
  if(/\bFINE\b|\bFine\b/.test(w) && !/al\s+FINE|al\s+Fine/.test(w)) info.fine = true;
  if(/\bD\.\s?C\.|\bDa Capo\b/i.test(w)){ info.dacapo = true; if(/al\s+fine/i.test(w)) info.alFine = true; }
  if(/\bD\.\s?S\.|\bDal Segno\b/i.test(w)){ info.dalsegno = 'segno'; if(/al\s+fine/i.test(w)) info.alFine = true; }
  if(/\bSegno\b/i.test(w)) info.segno = 'segno';
  if(/\bto\s+coda\b/i.test(w)) info.tocoda = 'coda';
  if(/^coda$/i.test(label || '')) info.coda = 'coda';
  return info;
}

/* The words "D.C. al FINE" at the end of a chart are separated by the
   parser into the notes of the last bar, and "FINE" can arrive as a note
   of the bar before a section label ("Fm FINE B: …"). */
function syncChartRoadInfo(chart){
  const flat = [];
  (chart.sections || []).forEach(sec => sec.bars.forEach((b, j) => flat.push({bar: b, label: j === 0 ? sec.label : '', section: sec.label})));
  const info = flat.map(f => syncChartMarks(f.bar, f.label));
  /* "…D.C. al FINE" written without a FINE anywhere plays to the end */
  return {flat, info};
}

/**
 * A chord chart unrolled into one chorus as it is played.
 * @param {object} tune — a tune database record: {chordProgression, form, measures, timeSignature}
 * @returns {{bars: [{i, label, section, chords: [{text, root, quality, beats, at}]}],
 *   measures, beats, measureBeats, sections: [{label, start, length}], how, mismatch}}
 */
function syncUnrollChart(tune){
  const t = tune || {};
  const chart = jazzParseChart(t.chordProgression || '');
  const beats = +(String(t.timeSignature || '4/4').split('/')[0]) || 4;
  const {flat, info} = syncChartRoadInfo(chart);
  if(!flat.length) return Object.assign(syncFormFromBars([]), {sections: [], how: 'empty', mismatch: true});
  /* the road map first: D.C., Fine and codas written into the chart */
  const road = info.some(x => x.dacapo || x.dalsegno || x.fine || x.tocoda) ? plxRoadMap(info) : flat.map((_, k) => k);
  let written = road.map(k => flat[k]);

  /* then the form: a chart that writes each section once */
  const want = +t.measures || 0;
  const secs = [];
  written.forEach(w => { const last = secs[secs.length - 1];
    if(!last || w.label || w.section !== last.label) secs.push({label: w.section, rows: [w]}); else last.rows.push(w); });
  const letters = String(t.form || '').replace(/\s/g, '');
  const tries = [{how: 'as written', seq: secs}];
  if(/^[A-D]{2,}$/.test(letters)){
    const byLetter = {};
    secs.forEach(s => { const L = (s.label || '').charAt(0); if(/[A-D]/.test(L) && !byLetter[L]) byLetter[L] = s; });
    if(letters.split('').every(L => byLetter[L]))
      tries.push({how: 'by the form ' + letters, seq: letters.split('').map(L => byLetter[L])});
  }
  if(secs.length > 1 && secs[0].label) tries.push({how: 'first section repeated', seq: [secs[0]].concat(secs)});
  const len = s => s.reduce((a, x) => a + x.rows.length, 0);
  let pick = tries[0];
  if(want){
    const exact = tries.find(x => len(x.seq) === want);
    if(exact) pick = exact;
    else if(len(tries[0].seq) !== want){
      /* nothing fits exactly: the one closest to the tune's length, the
         chart as written when it is a tie */
      pick = tries.reduce((a, b) => Math.abs(len(b.seq) - want) < Math.abs(len(a.seq) - want) ? b : a);
    }
  }
  const rows = [];
  const sections = [];
  pick.seq.forEach(s => { sections.push({label: s.label || '', start: rows.length + 1, length: s.rows.length}); s.rows.forEach(r => rows.push(r)); });

  /* a chart with no section letters but a form of equal sections: the
     letters from the form (So What is AABA in four eights) */
  if(sections.length === 1 && !sections[0].label && /^[A-D]{2,}$/.test(letters) && rows.length % letters.length === 0){
    const each = rows.length / letters.length;
    sections.length = 0;
    letters.split('').forEach((L, i) => sections.push({label: L, start: i * each + 1, length: each}));
  }
  const bars = rows.map((r, i) => {
    const sec = sections.find(s => i + 1 >= s.start && i + 1 < s.start + s.length) || {};
    let at = 0;
    const chords = (r.bar.chords || []).filter(c => c.chord).map(c => {
      const b = c.beats || beats, x = {text: c.text, root: c.chord.pc, bass: c.chord.bass ? (JAZZ_TUNE_PC[c.chord.bass] ?? null) : null,
        quality: c.chord.quality, q: c.chord.q, beats: b, at, optional: !!c.optional};
      at += b; return x; });
    /* the beats in a split bar always add up to the bar */
    const sum = chords.reduce((a, c) => a + c.beats, 0);
    if(chords.length && Math.abs(sum - beats) > 1e-9){
      let acc = 0; chords.forEach(c => { c.beats = c.beats * beats / sum; c.at = acc; acc += c.beats; });
    }
    return {i, label: sec.label || '', section: sec.label || '', chords, beats,
      fermata: /fermata|𝄐|hold/i.test((r.bar.notes || []).join(' '))};
  });
  return Object.assign(syncFormFromBars(bars), {sections, how: pick.how, mismatch: !!want && want !== bars.length, written: flat.length});
}

/* The form a sync map carries, from an unrolled chart or score. */
const syncFormOf = u => ({measures: u.measures, beats: u.beats, measureBeats: u.measureBeats || null});

/* The chart as the engine reads it: per beat of one chorus, the chord
   sounding. Tolerant of a chart with gaps (a bar of prose): the chord
   before carries on. */
function syncChordsPerBeat(unrolled){
  const out = [];
  let last = null;
  (unrolled.bars || []).forEach((b, m) => {
    const n = Math.round(b.beats || unrolled.beats || 4);
    for(let k = 0; k < n; k++){
      const c = (b.chords || []).find(x => k >= x.at - 1e-9 && k < x.at + x.beats - 1e-9) || last;
      out.push({measure: m + 1, beat: k + 1, chord: c || null, fermata: !!b.fermata && k === n - 1});
      if(c) last = c;
    }
  });
  return out;
}

/* ---------- checks the engine and the UI both rely on ---------- */
/* Monotone time, and a tempo that does not lurch: consecutive bars within
   ±40% of each other, unless the bar carries a fermata. Returns the
   indices of the points that break either rule. */
function syncMapProblems(syncMap, fermataBars){
  const tr = syncTrack(syncMap), P = tr.P, T = tr.T;
  const bad = [];
  if((syncMap.syncPoints || []).length !== P.length) bad.push({why: 'not monotone', dropped: (syncMap.syncPoints || []).length - P.length});
  for(let i = 1; i + 1 < P.length; i++){
    const a = (P[i] - P[i - 1]) / (T[i] - T[i - 1]), b = (P[i + 1] - P[i]) / (T[i + 1] - T[i]);
    const r = b / a;
    const at = syncPlace(syncMap, P[i]);
    if((r > 1.4 || r < 1 / 1.4) && !(fermataBars && fermataBars.has(at.measure))) bad.push({why: 'tempo jump', i, ratio: r, chorus: at.chorus, measure: at.measure});
  }
  return bad;
}

/* ---------- export and import: sync maps and profiles, never audio ---------- */
function syncMapExport(maps){
  const clean = (Array.isArray(maps) ? maps : [maps]).filter(Boolean).map(m => {
    const o = syncMapNew(m);
    /* only what the map is; anything the page may have hung on it
       (a decoded buffer, a blob) stays behind */
    return {id: o.id, pieceId: o.pieceId, recordingId: o.recordingId, transposition: o.transposition,
      tuningOffsetCents: o.tuningOffsetCents, form: o.form, performanceOrder: o.performanceOrder.map(e => ({label: e.label, type: e.type,
        chorus: e.chorus == null ? null : e.chorus, audioStart: e.audioStart, audioEnd: e.audioEnd})),
      syncPoints: o.syncPoints.map(p => ({chorus: p.chorus, measure: p.measure, beat: p.beat, time: p.time, confidence: p.confidence,
        ...(p.interpolated ? {interpolated: true} : {})})),
      overallConfidence: o.overallConfidence, engineVersion: o.engineVersion, createdAt: o.createdAt};
  });
  return JSON.stringify({kind: 'life-instrument-sync-maps', version: 1, maps: clean}, null, 1);
}
function syncMapImport(json){
  const o = typeof json === 'string' ? JSON.parse(json) : json;
  if(!o || o.kind !== 'life-instrument-sync-maps' || !Array.isArray(o.maps)) throw new Error('That is not a file of sync maps.');
  return o.maps.map(m => syncMapNew(m));
}
