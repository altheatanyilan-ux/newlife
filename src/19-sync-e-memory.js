/* ============================================================
   RECORDING SYNC — PHASES 3 AND 4: THE PERFORMANCE MEMORY

   A synced recording already knows where every beat fell. This adds how
   loud: each note of the score is found in the audio at the moment the map
   puts it, and its loudness measured — the level of the whole sound as it
   is struck, and the energy at the note's own pitch rising out of what was
   there just before. Together they are the performance memory:

     timing   — every beat's time (from the sync map itself), so the
                rubato is the performer's to the beat;
     dynamics — a velocity for every note of every bar played, and the
                loudness of each bar, so the phrase shapes are kept.

   Played back, the score follows that memory: the MIDI of the piece — or
   any one part of it, with the others silent — at the performer's timing
   and dynamics. Bars the performer did not play (a repeat skipped) borrow
   the timing and dynamics of the time they did play that bar. The tempo
   slider still works: it scales the performance, rubato and all.

   rec.memory = {v, at, bars: [{k, n, v}] (velocities, 0–255 base64, one
   per note of written bar k in (inBar, part, midi) order, per bar of the
   reading), barDb [loudness a bar played, dB], range [lo, hi]}.
   Nothing here leaves the device; the memory is numbers, not sound.
   ============================================================ */
const SYNC_MEMORY_V = 1;

/* the notes of a written bar, in a fixed order: the timeline's events of
   its first occurrence, pitched notes only */
function syncBarNotes(tl){
  const first = new Map(), out = new Map();
  tl.perf.forEach(p => { if(!first.has(p.k)) first.set(p.k, p.i); });
  tl.events.forEach(e => { if(e.chord || e.perc || e.midi == null) return; const p = tl.perf[e.perf]; if(!p || first.get(p.k) !== p.i) return;
    if(!out.has(p.k)) out.set(p.k, []); out.get(p.k).push(e); });
  out.forEach(l => l.sort((a, b) => a.inBar - b.inBar || a.part - b.part || a.midi - b.midi));
  return out;
}
const syncNoteKey = e => `${Math.round(e.inBar * 96)}|${e.part}|${e.midi}`;
/* for each bar of the written timeline, the bar of the reading that played
   it: the same occurrence where there is one, else the nearest played */
function syncPerfToReading(map, tl){
  const order = syncReadingOrder(map, tl); if(!order) return null;
  const byK = new Map(); order.forEach((k, i) => { if(!byK.has(k)) byK.set(k, []); byK.get(k).push(i + 1); });
  const seen = new Map();
  return tl.perf.map(p => { const n = seen.get(p.k) || 0; seen.set(p.k, n + 1); const l = byK.get(p.k); return l ? l[Math.min(n, l.length - 1)] : null; });
}

/* ---------- timing ---------- */
/* The recording's timing as the score player reads a tempo map: T(q) the
   seconds from the start to quarter q of the written timeline, Q(t) its
   inverse, bpmAt(q). `first` is the score's own tempo, so the player's
   tempo slider scales the performance as a whole. */
function syncTiming(rec, tl, scoreBpm){
  const map = rec && rec.map; if(!map) return null;
  const toR = syncPerfToReading(map, tl); if(!toR) return null;
  const form = map.form || {}, beatsOf = m => (form.measureBeats && form.measureBeats[m - 1]) || form.beats || 4;
  const at = (m, b) => scoreToAudioTime(map, 1, m, b);
  /* the performer's typical second a quarter, for a bar they never played */
  const perQ = []; for(let m = 1; m < (form.measures || 0); m++){ const a = at(m, 1), z = at(m + 1, 1); const k = syncReadingOrder(map, tl)[m - 1]; const len = (tl.measures[k] || {}).len || 4;
    if(a != null && z != null && z > a) perQ.push((z - a) / len); }
  perQ.sort((a, b) => a - b); const medQ = perQ.length ? perQ[perQ.length >> 1] : 0.6;
  const kq = [0], kt = [0];
  tl.perf.forEach((p, i) => {
    const m = toR[i], B = m ? beatsOf(m) : Math.max(1, Math.round(p.len));
    for(let j = 0; j < B; j++){
      let d = null;
      if(m){ const a = at(m, 1 + j), z = at(m, 2 + j); if(a != null && z != null && z > a) d = z - a; }
      if(d == null || !isFinite(d) || d <= 0.01) d = medQ * p.len / B;
      d = Math.min(d, medQ * p.len / B * 6);   /* a fermata, not a stop */
      kq.push(p.q0 + (j + 1) * p.len / B); kt.push(kt[kt.length - 1] + d);
    }
  });
  const n = kq.length;
  const seg = (A, x) => { let lo = 0, hi = n - 1; if(x <= A[0]) return 0; if(x >= A[n - 1]) return n - 2; while(hi - lo > 1){ const mid = (lo + hi) >> 1; if(A[mid] <= x) lo = mid; else hi = mid; } return lo; };
  const T = q => { const i = seg(kq, q); const f = (q - kq[i]) / Math.max(1e-9, kq[i + 1] - kq[i]); return kt[i] + f * (kt[i + 1] - kt[i]); };
  const Q = t => { const i = seg(kt, t); const f = (t - kt[i]) / Math.max(1e-9, kt[i + 1] - kt[i]); return kq[i] + f * (kq[i + 1] - kq[i]); };
  const bpmAt = q => { const i = seg(kq, q); return 60 * (kq[i + 1] - kq[i]) / Math.max(1e-6, kt[i + 1] - kt[i]); };
  return {T, Q, bpmAt, first: scoreBpm || (60 / medQ), performance: true, knots: {kq, kt}};
}

/* ---------- dynamics ---------- */
const syncB64 = u8 => { let s = ''; for(let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const syncUnB64 = b => { const s = atob(b || ''), u = new Uint8Array(s.length); for(let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
/* the energy at one frequency in a window (Goertzel) */
function syncGoertzel(x, from, N, f, sr){
  const w = 2 * Math.PI * f / sr, c = 2 * Math.cos(w); let s1 = 0, s2 = 0;
  const a = Math.max(0, from), z = Math.min(x.length, from + N);
  for(let i = a; i < z; i++){ const h = 0.5 - 0.5 * Math.cos(2 * Math.PI * (i - a) / N); const s0 = x[i] * h + c * s1 - s2; s2 = s1; s1 = s0; }
  return Math.sqrt(Math.max(0, s1 * s1 + s2 * s2 - c * s1 * s2)) / (N / 2);
}
/**
 * Measure the performance memory from the recording's samples.
 * @param pcm Float32Array mono, sr its rate; rec (with map); tl the score's timeline
 * @returns Promise<memory>
 */
async function syncMeasureDynamics(pcm, sr, rec, tl, onProgress){
  const map = rec.map, order = syncReadingOrder(map, tl); if(!order) throw new Error('the map and the score do not match');
  const form = map.form || {}, beatsOf = m => (form.measureBeats && form.measureBeats[m - 1]) || form.beats || 4;
  /* the level of the whole sound, every 10 ms */
  const hop = Math.round(sr * 0.01), nE = Math.floor(pcm.length / hop), env = new Float32Array(nE);
  for(let f = 0; f < nE; f++){ let s = 0; const o = f * hop; for(let i = 0; i < hop; i++){ const v = pcm[o + i]; s += v * v; } env[f] = 10 * Math.log10(s / hop + 1e-10); }
  const envAt = (t0, t1) => { let mx = -120; for(let f = Math.max(0, Math.floor(t0 / 0.01)); f <= Math.min(nE - 1, Math.floor(t1 / 0.01)); f++) if(env[f] > mx) mx = env[f]; return mx; };
  const notesOf = syncBarNotes(tl);
  const N = 1 << Math.round(Math.log2(sr * 0.046));
  const raw = [];     /* per reading bar: [{g, p}] */
  const barDb = [];
  for(let m = 1; m <= order.length; m++){
    const k = order[m - 1], len = (tl.measures[k] || {}).len || 4, B = beatsOf(m), list = notesOf.get(k) || [];
    const a = scoreToAudioTime(map, 1, m, 1), z = scoreToAudioTime(map, 1, m + 1, 1);
    let bs = 0, bn = 0; if(a != null && z != null) for(let f = Math.max(0, Math.floor(a / 0.01)); f < Math.min(nE, Math.floor(z / 0.01)); f++){ bs += env[f]; bn++; }
    barDb.push(bn ? Math.round(bs / bn * 10) / 10 : null);
    raw.push(list.map(e => {
      const t = scoreToAudioTime(map, 1, m, 1 + e.inBar / len * B);
      if(t == null || !isFinite(t)) return null;
      const g = envAt(t - 0.01, t + 0.08);
      const hz = 440 * Math.pow(2, (e.midi + (map.transposition || 0) - 69) / 12);
      const s = Math.round((t + 0.012) * sr), pre = Math.round((t - 0.06) * sr);
      const after = syncGoertzel(pcm, s, N, hz, sr) + 0.5 * syncGoertzel(pcm, s, N, hz * 2, sr);
      const before = syncGoertzel(pcm, pre, N, hz, sr) + 0.5 * syncGoertzel(pcm, pre, N, hz * 2, sr);
      const p = 20 * Math.log10(after + 1e-9), rise = 20 * Math.log10((after + 1e-9) / (before + 1e-9));
      return {g, p, rise};
    }));
    if(m % 20 === 0){ if(onProgress) onProgress(m / order.length); await new Promise(r => setTimeout(r, 0)); }
  }
  /* each note's strength: the whole sound as it is struck, and its own
     pitch rising out of what was sounding — normalised over the piece */
  const all = raw.flat().filter(Boolean);
  const q = (arr, p) => { const s = arr.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))] : 0; };
  const gs = all.map(x => x.g), ps = all.map(x => x.p + Math.max(0, x.rise) * 0.3);
  const g0 = q(gs, 0.05), g1 = q(gs, 0.97), p0 = q(ps, 0.05), p1 = q(ps, 0.97);
  const bars = raw.map((list, i) => {
    const v = new Uint8Array(list.length);
    list.forEach((x, j) => { if(!x){ v[j] = 0; return; }
      const a = Math.max(0, Math.min(1, (x.g - g0) / Math.max(1, g1 - g0))), b = Math.max(0, Math.min(1, (x.p + Math.max(0, x.rise) * 0.3 - p0) / Math.max(1, p1 - p0)));
      v[j] = Math.max(1, Math.round(255 * (0.12 + 0.88 * (0.6 * a + 0.4 * b)))); });
    return {k: order[i], n: list.length, v: syncB64(v)};
  });
  return {v: SYNC_MEMORY_V, at: new Date().toISOString(), bars, barDb, range: [Math.round(g0), Math.round(g1)], notes: all.length};
}
/* the velocity the performer gave a note of the written timeline, or null */
function syncVelOf(rec, tl){
  const mem = rec && rec.memory; if(!mem || !mem.bars) return null;
  const toR = syncPerfToReading(rec.map, tl); if(!toR) return null;
  const notesOf = syncBarNotes(tl), idx = new Map();
  notesOf.forEach((list, k) => { const m = new Map(); list.forEach((e, j) => m.set(syncNoteKey(e), j)); idx.set(k, m); });
  const cache = new Map();
  const velsOf = m => { if(!cache.has(m)){ const b = mem.bars[m - 1]; cache.set(m, b ? syncUnB64(b.v) : null); } return cache.get(m); };
  return e => {
    if(e.chord || e.perc) return null;
    const p = tl.perf[e.perf]; if(!p) return null;
    const m = toR[e.perf]; if(!m) return null;
    const j = (idx.get(p.k) || new Map()).get(syncNoteKey(e)); if(j == null) return null;
    const v = velsOf(m); if(!v || v.length !== (notesOf.get(p.k) || []).length || !v[j]) return null;
    return v[j] / 255;
  };
}
/* the performance as one bar a value: tempo (bpm) and loudness (dB) */
function syncMemoryCurves(rec, tl){
  const map = rec.map, order = syncReadingOrder(map, tl) || [];
  const tempo = order.map((k, i) => { const a = scoreToAudioTime(map, 1, i + 1, 1), z = scoreToAudioTime(map, 1, i + 2, 1), len = (tl.measures[k] || {}).len || 4;
    return a != null && z != null && z > a ? 60 * len / (z - a) : null; });
  return {tempo, loud: (rec.memory && rec.memory.barDb) || []};
}
/* two small charts, one above the other — tempo and loudness have
   different units, so they are never drawn on one axis */
function syncMemoryChartHTML(rec, tl){
  const {tempo, loud} = syncMemoryCurves(rec, tl);
  const line = (vals, h, cls, label, fmt) => {
    const v = vals.map(x => x == null || !isFinite(x) ? null : x), ok = v.filter(x => x != null);
    if(ok.length < 2) return '';
    const s = ok.slice().sort((a, b) => a - b), lo = s[Math.floor(s.length * 0.03)], hi = s[Math.ceil(s.length * 0.97) - 1] || s[s.length - 1];
    const W = 300, x = i => (i / Math.max(1, v.length - 1) * (W - 4) + 2).toFixed(1), y = val => (h - 3 - (Math.max(lo, Math.min(hi, val)) - lo) / Math.max(1e-6, hi - lo) * (h - 6)).toFixed(1);
    let d = '', pen = false; v.forEach((val, i) => { if(val == null){ pen = false; return; } d += `${pen ? 'L' : 'M'}${x(i)} ${y(val)} `; pen = true; });
    return `<div class="sy-curve"><span class="mono faint">${label} <b>${fmt(lo)}–${fmt(hi)}</b></span>
      <svg viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" role="img" aria-label="${esc(label)} across the performance, bar by bar"><path class="${cls}" d="${d}"/></svg></div>`;
  };
  return line(tempo, 34, 'sy-c-tempo', 'rubato ♩', x => Math.round(x)) + line(loud, 34, 'sy-c-loud', 'dynamics dB', x => Math.round(x));
}

/* ---------- MIDI with the performer's timing and dynamics ---------- */
function syncPerformanceMidi(rec, tl, muted){
  const timing = syncTiming(rec, tl, 120), velOf = syncVelOf(rec, tl);
  if(!timing) return null;
  const TPS = 960;   /* ticks a second, at a fixed 120 bpm (480 a quarter) */
  const tracks = [], chans = [];
  tl.parts.forEach((p, pi) => {
    if(muted && muted.has(`p:${pi}`)) return;
    const ch = pi >= 9 ? pi + 1 : pi; if(ch > 15) return;
    const evs = [{tick: 0, bytes: [0xc0 | ch, Math.max(0, Math.min(127, (+p.program || 1) - 1))]}];
    const name = String(p.name || `Part ${pi + 1}`).slice(0, 60); evs.push({tick: 0, bytes: [0xff, 0x03, name.length, ...[...name].map(c => c.charCodeAt(0) & 0x7f)]});
    tl.events.forEach(e => { if(e.part !== pi || e.chord || e.midi == null) return;
      const drum = e.perc; const c = drum ? 9 : ch;
      const t0 = timing.T(e.q), t1 = timing.T(e.q + Math.max(e.d, e.held || 0));
      const v = Math.max(1, Math.min(127, Math.round(127 * ((velOf && velOf(e)) || e.vel || 0.6))));
      evs.push({tick: Math.round(t0 * TPS), bytes: [0x90 | c, e.midi & 0x7f, v]}, {tick: Math.max(Math.round(t0 * TPS) + 10, Math.round(t1 * TPS) - 5), bytes: [0x80 | c, e.midi & 0x7f, 0]}); });
    tracks.push(evs); chans.push(ch);
  });
  return sngMidiBytes ? sngMidiBytes(tracks, 120, [4, 4]) : null;
}
