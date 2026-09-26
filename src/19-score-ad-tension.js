/* ============================================================
   SCORE STUDY — from analysis to playing: tension, arrival weight, phrase
   arches, and the tap-along takes.

   THE TENSION ESTIMATE approximates Lerdahl's tonal tension (Tonal Pitch
   Space, 2001) from the confirmed chords. For each chord c:

     hierarchical  δ(c, the local tonic triad) + wKey · δk(local key, home key)
     sequential    δ(previous chord, c)
     surface       ½ per non-chord tone in c's span, +1 an inversion, +2 a
                   six-four, +1 a seventh
     attraction    the pull on the soprano at c's onset toward a more stable
                   neighbour a semitone or tone away: max (S_to / S_from) / d²,
                   with anchoring strength S 4 root, 3 chord tone, 2 diatonic,
                   1 chromatic

     tension = wH·hierarchical + wS·sequential + wD·surface + wA·attraction,
     then scaled so the piece's highest point is 1.

   δ(x, y) = i + j + k: i the key distance (steps on the circle of fifths),
   j the root distance on the circle of fifths, k the pitch classes of y's
   basic space (root, fifth, triad, diatonic collection) not in x's. The
   weights are yours to change. It is a HARMONIC tension estimate — rhythm,
   dynamics, register and timbre also matter, and it knows none of them.

   TAKES: press Space on each beat while you play or listen; each tap lands
   on the next beat of the score from the bar you start at. Inter-onset
   intervals give a local tempo; three-point smoothing is optional.
   ============================================================ */

const AN_TENSION_DEFAULTS = {hier: 1, seq: 0.5, key: 1.5, surface: 1, attract: 1.2};
const AN_ARRIVAL = {motive: 1, phrase: 2, theme: 3, section: 4};
function anFifthsOf(pc){ return (pc * 7) % 12; }
function anCircleDist(a, b){ const d = Math.abs(anFifthsOf(a) - anFifthsOf(b)); return Math.min(d, 12 - d); }
function anChordPcsOf(c, key){
  if(/^(It|Fr|Ger)/.test(c.roman)){ const add = c.roman.startsWith('It') ? [8, 0, 6] : c.roman.startsWith('Fr') ? [8, 0, 2, 6] : [8, 0, 3, 6]; return {root: (key.tonic + 8) % 12, pcs: add.map(p => (key.tonic + p) % 12)}; }
  const rp = anKeyParse(c.root || '') || anKeyParse(key.name); const root = rp ? rp.tonic : key.tonic;
  const q = c.quality && AN_QUAL[c.quality] ? c.quality : 'maj';
  return {root, pcs: AN_QUAL[q].map(x => (x + root) % 12)};
}
function anBasicSpace(root, pcs, key){
  const dia = AN_SCALE[key.mode].map(x => (x + key.tonic) % 12);
  return [[root], [root, (root + 7) % 12], pcs, dia];
}
function anTpsDelta(x, y){
  const i = x.key && y.key ? anCircleDist(anKeyFifthsTonic(x.key), anKeyFifthsTonic(y.key)) : 0;
  const j = anCircleDist(x.root, y.root);
  const bx = anBasicSpace(x.root, x.pcs, x.key), by = anBasicSpace(y.root, y.pcs, y.key);
  let k = 0; by.forEach((lvl, li) => lvl.forEach(pc => { if(!bx[li].includes(pc)) k++; }));
  return i + j + k;
}
/* a key's place on the circle, as the pitch class of its relative major */
function anKeyFifthsTonic(k){ return k.mode === 'minor' ? (k.tonic + 3) % 12 : k.tonic; }
function anTension(a, parsed, weights){
  const w = Object.assign({}, AN_TENSION_DEFAULTS, weights || {});
  const ch = anChords(a); if(!ch.length) return {method: 'Lerdahl TPS approximation', params: w, curve: []};
  const home = anKeyParse(ch[0].key);
  let prev = null; const raw = [];
  ch.forEach(c => {
    const key = anKeyParse(c.key) || home;
    const cp = anChordPcsOf(c, key), me = {root: cp.root, pcs: cp.pcs, key};
    const tonicT = {root: key.tonic, pcs: AN_QUAL[key.mode === 'minor' ? 'min' : 'maj'].map(x => (x + key.tonic) % 12), key};
    const hier = anTpsDelta(tonicT, me) + w.key * (home ? anCircleDist(anKeyFifthsTonic(key), anKeyFifthsTonic(home)) : 0);
    const seq = prev ? anTpsDelta(prev, me) : 0;
    const inv = /64$/.test(c.roman) ? 2 : /(6|65|43|42)$/.test(c.roman) ? 1 : 0;
    const surface = 0.5 * (c.nct || []).length + inv + (/7|65|43|42/.test(c.roman) ? 1 : 0);
    const {sop} = anOuterAt(parsed.notes, c.on + 1e-3);
    let attract = 0;
    if(sop){
      const dia = AN_SCALE[key.mode].map(x => (x + key.tonic) % 12);
      const S = pc => pc === cp.root ? 4 : cp.pcs.includes(pc) ? 3 : dia.includes(pc) ? 2 : 1;
      const s0 = S(sop.pc);
      [-2, -1, 1, 2].forEach(d => { const t = (sop.pc + d + 12) % 12, st = S(t); if(st > s0) attract = Math.max(attract, (st / s0) / (d * d)); });
    }
    const value = w.hier * hier + w.seq * seq + w.surface * surface + w.attract * attract;
    raw.push({measure: c.measure, beat: c.beat, on: c.on, roman: c.roman, value, parts: {hier: +hier.toFixed(2), seq: +seq.toFixed(2), surface: +surface.toFixed(2), attract: +attract.toFixed(2)}});
    prev = me;
  });
  const max = Math.max(...raw.map(r => r.value)) || 1;
  raw.forEach(r => { r.raw = +r.value.toFixed(3); r.value = +(r.value / max).toFixed(3); });
  return {method: 'Lerdahl TPS approximation (see the comment in 19-score-ad-tension.js)', params: w, curve: raw};
}
function anArrivalWeight(c){ return (AN_ARRIVAL[c.level] || 1) * ({PAC: 1.2, IAC: 1, HC: 0.9, DC: 1}[c.type] || 0.7); }

/* ---------- takes ---------- */
/* the beats of the score, from a bar on: {measure, beat, on} */
function anBeatGrid(parsed, fromMeasure){
  const out = [];
  parsed.measures.forEach(M => { if(M.num < fromMeasure) return; const bl = anBeatLen(M);
    for(let t = 0, b = 1; t < M.len - 1e-6; t += bl, b++) out.push({measure: M.num, beat: b, on: M.start + t, beatLen: bl}); });
  return out;
}
function anTakeTempo(take, parsed, smooth){
  const grid = anBeatGrid(parsed, take.startMeasure || 1);
  const taps = take.taps || [];
  const pts = [];
  for(let i = 1; i < taps.length; i++){
    const g0 = grid[i - 1], g1 = grid[i]; if(!g0 || !g1) break;
    const dt = (taps[i].time - taps[i - 1].time) / 1000; if(dt <= 0) continue;
    const quarters = g1.on - g0.on;
    pts.push({measure: g0.measure, beat: g0.beat, on: g0.on, bpm: 60 * quarters / dt, ioi: dt});
  }
  if(smooth) return pts.map((p, i) => { const w = pts.slice(Math.max(0, i - 1), i + 2); return Object.assign({}, p, {bpm: w.reduce((s, x) => s + x.bpm, 0) / w.length}); });
  return pts;
}
function anMedian(xs){ const s = xs.slice().sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0; }
/* the plain facts about a take against the structure */
function anTakeFacts(take, a, parsed){
  const pts = anTakeTempo(take, parsed, false); if(pts.length < 4) return {lines: ['Too few taps to say anything yet.'], pts};
  const med = anMedian(pts.map(p => p.bpm));
  const cads = (a && a.cadences || []).filter(c => c.status === 'accepted' || c.status === 'relabelled');
  const big = cads.filter(c => AN_LEVELS.indexOf(c.level) >= 1);
  const slow = pts.map((p, i) => Object.assign({}, p, {ratio: p.bpm / med, i})).filter((p, i, arr) => p.ratio < 0.88 && (!arr[i - 1] || p.bpm <= arr[i - 1].bpm) && (!arr[i + 1] || p.bpm <= arr[i + 1].bpm))
    .sort((x, y) => x.ratio - y.ratio).slice(0, 5);
  const near = slow.filter(s => big.some(c => Math.abs(c.on - s.on) <= 4 + 1e-6));
  const units = (a && a.units || []).filter(u => u.status !== 'rejected');
  const endSet = new Set(units.map(u => u.endMeasure));
  const endPts = pts.filter(p => endSet.has(p.measure)), midPts = pts.filter(p => !endSet.has(p.measure));
  const avg = xs => xs.length ? xs.reduce((s, p) => s + p.bpm / med, 0) / xs.length : null;
  const lines = [`Median tempo ${Math.round(med)} (quarter-note beats per minute).`];
  if(slow.length) lines.push(`Your biggest slowings: ${slow.map(s => `bar ${s.measure} beat ${s.beat} (${Math.round((1 - s.ratio) * 100)}% slower)`).join(', ')}.` +
    (big.length ? ` ${near.length} of ${slow.length} fall within a bar of a phrase-level or higher cadence.` : ''));
  if(endPts.length && midPts.length) lines.push(`At phrase ends you average ${Math.round(avg(endPts) * 100)}% of your median tempo; mid-phrase, ${Math.round(avg(midPts) * 100)}%.`);
  return {lines, pts, median: med};
}
/* how alike your takes are at each phrase end: the spread of tempo ratios */
function anTakesConsistency(takes, a, parsed){
  const units = (a && a.units || []).filter(u => u.status !== 'rejected');
  return units.map(u => {
    const vals = takes.map(t => { const f = anTakeFacts(t, a, parsed); const p = (f.pts || []).filter(x => x.measure === u.endMeasure); return p.length && f.median ? p.reduce((s, x) => s + x.bpm, 0) / p.length / f.median : null; }).filter(v => v != null);
    const m = vals.reduce((s, v) => s + v, 0) / (vals.length || 1);
    const sd = vals.length > 1 ? Math.sqrt(vals.reduce((s, v) => s + (v - m) * (v - m), 0) / (vals.length - 1)) : null;
    return {unit: u, n: vals.length, mean: vals.length ? +m.toFixed(3) : null, sd: sd == null ? null : +sd.toFixed(3)};
  });
}
/* two panels on one x axis (score position): tempo above, tension below; cadences and phrase boundaries through both */
function anOverlaySVG(parsed, a, series){
  const W = 720, L = 44, R = 10, H1 = 150, H2 = 90, G = 18, T = 8;
  const M = parsed.measures, end = M.length ? M[M.length - 1].start + M[M.length - 1].len : 1;
  const X = on => L + (on / end) * (W - L - R);
  const allBpm = series.flatMap(s => s.pts.map(p => p.bpm));
  const lo = allBpm.length ? Math.floor(Math.min(...allBpm) / 10) * 10 : 40, hi = allBpm.length ? Math.ceil(Math.max(...allBpm) / 10) * 10 : 160;
  const Y1 = v => T + H1 - ((v - lo) / Math.max(1, hi - lo)) * H1;
  const y2 = T + H1 + G, Y2 = v => y2 + H2 - v * H2;
  const cads = (a && a.cadences || []).filter(c => c.status === 'accepted' || c.status === 'relabelled');
  const units = (a && a.units || []).filter(u => u.status !== 'rejected' && u.kind !== 'period');
  const curve = a && a.tension ? a.tension.curve : [];
  let g = '';
  [lo, Math.round((lo + hi) / 2), hi].forEach(v => g += `<line class="an-grid" x1="${L}" x2="${W - R}" y1="${Y1(v)}" y2="${Y1(v)}"/><text class="an-ax" x="${L - 5}" y="${Y1(v) + 3}" text-anchor="end">${v}</text>`);
  [0, 0.5, 1].forEach(v => g += `<line class="an-grid" x1="${L}" x2="${W - R}" y1="${Y2(v)}" y2="${Y2(v)}"/><text class="an-ax" x="${L - 5}" y="${Y2(v) + 3}" text-anchor="end">${v}</text>`);
  units.forEach(u => { const m = M.find(x => x.num === u.endMeasure); if(!m) return; const x = X(m.start + m.len); g += `<line class="an-bound" x1="${x}" x2="${x}" y1="${T}" y2="${y2 + H2}"/>`; });
  cads.forEach(c => { const x = X(c.on); g += `<line class="an-cadline ${c.type}" x1="${x}" x2="${x}" y1="${T}" y2="${y2 + H2}" stroke-width="${0.6 + anArrivalWeight(c) * 0.5}"><title>${esc(AN_CAD_TYPES[c.type] || c.type)} cadence, bar ${c.measure} (${c.level})</title></line>`; });
  series.forEach((s, si) => { if(s.pts.length) g += `<polyline class="an-tempo s${si}" points="${s.pts.map(p => `${X(p.on).toFixed(1)},${Y1(p.bpm).toFixed(1)}`).join(' ')}"/>`; });
  if(curve.length) g += `<polyline class="an-tension" points="${curve.map(p => `${X(p.on).toFixed(1)},${Y2(p.value).toFixed(1)}`).join(' ')}"/>`;
  const ticks = M.filter((m, i) => i % Math.max(1, Math.ceil(M.length / 12)) === 0).map(m => `<text class="an-ax" x="${X(m.start)}" y="${y2 + H2 + 14}" text-anchor="middle">${m.num}</text>`).join('');
  return `<svg class="an-overlay" viewBox="0 0 ${W} ${y2 + H2 + 20}" role="img" aria-label="Tempo against the harmonic tension estimate, with cadences and phrase boundaries">
    <text class="an-ax" x="${L}" y="${T + 2}">tempo (♩/min)</text><text class="an-ax" x="${L}" y="${y2 + 2}">harmonic tension estimate</text>${g}${ticks}</svg>`;
}
