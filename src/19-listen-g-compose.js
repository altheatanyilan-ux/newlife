/* ============================================================
   PLAY TO COMPOSE — from what you played to what a musician would write.

   The input is the NoteEvent stream (19-listen-b-live.js): pitches with
   onsets and offsets in seconds, from a MIDI keyboard as they were, or from
   the Transcribe Engine (19-listen-f-transcribe.js) after a microphone
   take. The output is a score model and its MusicXML. Everything here is
   arithmetic on those lists — no page, no audio — so the same code runs in
   the page and in Node for the tests. Every function is named cp*.

   The clean-up, in the order it is done, none of it asked of you:

   1. THE BEAT. With the click on, the beat is the click. Without it, the
      tempo is the one whose beat grid (and half-beat grid, more lightly)
      the onsets fall on best, weighed against how likely that tempo is at
      all; then the beats are followed through the take, each one nudged
      toward the onset nearest where it was expected, so a performance that
      drifts is followed rather than fought. The downbeat is the beat of the
      bar where the most weight — loud notes, low notes — lands.

   2. THE GRID. Each beat is written in quarters, eighths, triplets or
      sixteenths, whichever puts the notes nearest where they were played,
      with a charge for every step of complication, so a beat of slightly
      uneven eighths is written as eighths rather than as a sixteenth, a
      dotted eighth and a thirty-second.

   3. SWING. When the note after the beat lands consistently late — past
      58% of the beat — the eighths are swung. They are written straight,
      with "Swing" at the top and the ratio in the sound, the way a lead
      sheet is written; nobody writes a swung line as dotted triplets.

   4. THE HANDS. Notes played together are split between the staves where
      the split costs least: each hand is expected near where it just was,
      a hand does not stretch past a tenth, and the treble is not asked to
      play at the bottom of the keyboard nor the bass at the top. So a left
      hand that climbs over middle C stays in the bass staff.

   5. THE VOICES. In a staff, where the top note moves while the notes
      under it hold (or the other way round), the top line is a voice of
      its own and the chord under it another.

   6. THE KEY AND THE SPELLING. The key is the one whose profile the
      durations fit best (Krumhansl–Kessler). A note is spelled as the chord
      it belongs to spells it — the third of D7 is F sharp, in any key —
      and otherwise as the key does, nearest the key on the line of fifths:
      B flat, not A sharp, in F. Ties across bar lines, rests, beams by the
      beat, accidentals where the key signature and the bar say they are
      needed, and not otherwise.

   7. CHORD SYMBOLS. Every half bar, the pitches sounding (weighted by how
      long they sound) and the lowest of them are fitted against the jazz
      chord shapes, rootless ones included: a voicing of the third, seventh,
      ninth and thirteenth with nobody playing the root is the chord the bass
      note and the progression around it say it is. A move down a fifth from
      the chord before is preferred when two names fit about as well — that
      is what ii–V–I sounds like. A symbol it is unsure of is written grey.

   8. THE PEDAL. From a MIDI keyboard the pedal is known (controller 64):
      it is written as pedal marks, and the notes are written as long as the
      keys were held, not as long as the pedal kept them ringing.
   ============================================================ */

const CP_DIV = 12;   /* divisions of a quarter: eighths 6, triplets 4, sixteenths 3 */
const CP_KK = {major: [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
  minor: [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]};
/* the key signature a tonic is written with: [fifths, prefer flats] */
const CP_MAJ_FIFTHS = [0, -5, 2, -3, 4, -1, 6, 1, -4, 3, -2, 5];
const CP_MIN_FIFTHS = [-3, 4, -1, -6, 1, -4, 3, -2, 5, 0, -5, 2];

/* ---------- small things ---------- */
function cpPc(p){ return ((p % 12) + 12) % 12; }
function cpMedian(xs){ const s = xs.slice().sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0; }
function cpCorr(a, b){
  const ma = a.reduce((s, x) => s + x, 0) / a.length, mb = b.reduce((s, x) => s + x, 0) / b.length;
  let num = 0, da = 0, db = 0;
  for(let i = 0; i < a.length; i++){ const x = a[i] - ma, y = b[i] - mb; num += x * y; da += x * x; db += y * y; }
  return da && db ? num / Math.sqrt(da * db) : 0;
}
/* a place on the line of fifths, as a letter and an alteration: 0 = C, 1 = G, -1 = F, 6 = F#, -2 = Bb */
function cpFifthsName(f){
  const letters = 'FCGDAEB', i = ((f + 1) % 7 + 7) % 7;
  return {step: letters[i], alter: Math.floor((f + 1) / 7)};
}
function cpFifthsOfPc(pc){ return ((pc * 7) % 12 + 12) % 12; }   /* the sharp-side spelling: 0..11 */
/* the fifths position nearest `center` that spells pitch class pc */
function cpSpellNear(pc, center){
  const base = cpFifthsOfPc(pc);
  let best = base, bd = Infinity;
  for(let k = -3; k <= 3; k++){ const f = base + 12 * k; const d = Math.abs(f - center); if(d < bd){ bd = d; best = f; } }
  return best;
}

/* ---------- 1. the events, tidied ---------- */
function cpPrepare(events, opts){
  const o = opts || {};
  const minConf = o.minConf != null ? o.minConf : 0.3;
  const ev = (events || []).filter(e => e && e.pitch != null && isFinite(e.onset) && (e.confidence == null || e.confidence >= minConf))
    .map((e, i) => ({i, pitch: Math.round(e.pitch), on: +e.onset, off: e.offset != null && isFinite(e.offset) ? +e.offset : null, vel: e.velocity != null ? +e.velocity : 0.7, conf: e.confidence != null ? +e.confidence : 1}))
    .sort((a, b) => a.on - b.on || a.pitch - b.pitch);
  /* a note with no end known ends where the same key is struck again, or half a second on */
  ev.forEach((e, k) => {
    if(e.off != null && e.off > e.on) return;
    const again = ev.slice(k + 1).find(x => x.pitch === e.pitch);
    e.off = again ? Math.min(again.on, e.on + 2) : e.on + 0.5;
  });
  return ev;
}
/* notes struck together, as one event with a weight */
function cpClusters(ev, tol){
  const t = tol || 0.035, out = [];
  ev.forEach(e => {
    const c = out[out.length - 1];
    if(c && e.on - c.t0 <= t){ c.notes.push(e); c.w += 0.4 + e.vel; c.bass = Math.min(c.bass, e.pitch); }
    else out.push({t0: e.on, t: e.on, notes: [e], w: 0.6 + e.vel, bass: e.pitch});
  });
  out.forEach(c => { c.t = c.notes.reduce((s, n) => s + n.on, 0) / c.notes.length; });
  return out;
}

/* ---------- 2. the beat ---------- */
/* the tempo whose grid the onsets fall on best, times how plausible that tempo is */
function cpTempo(cl, hint){
  if(cl.length < 3) return {bpm: hint || 100, phase: cl.length ? cl[0].t : 0, score: 0};
  const center = hint || 105;
  let best = null;
  const span = cl[cl.length - 1].t - cl[0].t;
  for(let bpm = 40; bpm <= 240; bpm += 0.5){
    const P = 60 / bpm;
    if(span < 2 * P) continue;
    const sig = 0.045;   /* in beats */
    let bestPh = null;
    for(let k = 0; k < 24; k++){
      const ph = cl[0].t + (k / 24 - 0.5) * P;
      let s = 0;
      for(const c of cl){
        const x = (c.t - ph) / P, d = x - Math.round(x);
        s += c.w * (Math.exp(-(d * d) / (2 * sig * sig)) + 0.3 * Math.exp(-((Math.abs(d) - 0.5) ** 2) / (2 * sig * sig)));
      }
      if(!bestPh || s > bestPh.s) bestPh = {s, ph};
    }
    const lg = Math.log2(bpm / center);
    const score = bestPh.s * Math.exp(-0.5 * (lg / (hint ? 0.35 : 0.6)) ** 2);
    if(!best || score > best.score) best = {bpm, phase: bestPh.ph, score};
  }
  return best;
}
/* the beats, followed through the take */
function cpTrackBeats(cl, bpm, phase, until){
  let P = 60 / bpm;
  const first = cl.length ? cl[0].t : 0;
  let b = phase - Math.ceil((phase - first) / P - 1e-6) * P;
  if(b > first + 0.02) b -= P;
  const beats = [b];
  const P0 = P;
  let guard = 0;
  while(b < until + P && guard++ < 20000){
    const pred = b + P;
    let hit = null, hd = Infinity;
    for(const c of cl){ if(c.t < pred - 0.22 * P) continue; if(c.t > pred + 0.22 * P) break; const d = Math.abs(c.t - pred) / (0.6 + c.w); if(d < hd){ hd = d; hit = c; } }
    const nb = hit ? pred + 0.55 * (hit.t - pred) : pred;
    P = Math.max(P0 * 0.8, Math.min(P0 * 1.25, 0.85 * P + 0.15 * (nb - b)));
    b = nb; beats.push(b);
  }
  return beats;
}
/* the tempo from the onsets' own rhythm: the autocorrelation of their strength
   (10 ms frames), each lag weighed by how often music is at that tempo (a
   log-normal around 110) and helped by the lag twice as long — a beat is a
   period whose double is a period too */
function cpTempoAC(cl, until, hint){
  const hop = 0.01, n = Math.max(2, Math.ceil((until + 0.5) / hop));
  const o = new Float32Array(n);
  cl.forEach(c => { const k = Math.round(c.t / hop); for(let d = -2; d <= 2; d++){ const j = k + d; if(j >= 0 && j < n) o[j] += c.w * Math.exp(-d * d / 2); } });
  let mean = 0; for(let i = 0; i < n; i++) mean += o[i]; mean /= n; for(let i = 0; i < n; i++) o[i] -= mean;
  const lagLo = Math.round(60 / 240 / hop), lagHi = Math.min(n - 1, Math.round(60 / 40 / hop) * 2 + 2);
  const ac = new Float32Array(lagHi + 1);
  for(let L = lagLo; L <= lagHi; L++){ let v = 0; for(let i = 0; i + L < n; i++) v += o[i] * o[i + L]; ac[L] = v / (n - L); }
  const center = hint ? 60 / hint : 60 / 110;
  let best = null;
  for(let L = lagLo; L * 2 <= lagHi && L * hop <= 60 / 40; L++){
    const sec = L * hop, prior = Math.exp(-0.5 * (Math.log2(sec / center) / (hint ? 0.35 : 0.9)) ** 2);
    const v = (Math.max(0, ac[L]) + 0.5 * Math.max(0, ac[2 * L]) + 0.25 * Math.max(0, ac[Math.round(L * 1.5)] || 0)) * prior;
    if(!best || v > best.v) best = {v, L};
  }
  /* refine the lag between frames */
  const L = best ? best.L : Math.round(center / hop);
  const a = ac[L - 1] || 0, b = ac[L] || 0, c = ac[L + 1] || 0, den = a - 2 * b + c;
  const Lf = den < 0 ? L + 0.5 * (a - c) / den : L;
  return 60 / (Lf * hop);
}
/* the beats by dynamic programming (Ellis, 2007): every onset-strength frame
   is a possible beat, scored by its own strength plus the best path that
   reaches it from about one period back, a path paying for every step that
   is not the period — so the beats follow a tempo that breathes, and land on
   onsets where there are onsets and keep time through the gaps where there
   are none */
function cpTrackBeatsDP(cl, bpm, until, alpha){
  const hop = 0.01, n = Math.max(2, Math.ceil((until + 0.5) / hop));
  const o = new Float32Array(n);
  cl.forEach(c => { const k = Math.round(c.t / hop); for(let d = -2; d <= 2; d++){ const j = k + d; if(j >= 0 && j < n) o[j] += c.w * Math.exp(-d * d / 2); } });
  let mx = 0; for(let i = 0; i < n; i++) mx = Math.max(mx, o[i]); if(mx > 0) for(let i = 0; i < n; i++) o[i] /= mx;
  const tau = 60 / bpm / hop, a = alpha != null ? alpha : 3;
  const C = new Float32Array(n), prev = new Int32Array(n).fill(-1);
  const lo = Math.round(tau * 0.5), hi = Math.round(tau * 2);
  for(let i = 0; i < n; i++){
    let best = -Infinity, bj = -1;
    for(let d = lo; d <= hi && i - d >= 0; d++){ const v = C[i - d] - a * Math.log(d / tau) ** 2; if(v > best){ best = v; bj = i - d; } }
    C[i] = o[i] + (bj >= 0 && best > 0 ? best : 0); prev[i] = bj >= 0 && best > 0 ? bj : -1;
  }
  /* the end: the best score in the last period */
  let end = n - 1, bv = -Infinity; for(let i = Math.max(0, n - Math.round(tau)); i < n; i++) if(C[i] > bv){ bv = C[i]; end = i; }
  const out = []; for(let i = end; i >= 0; i = prev[i]) { out.unshift(i * hop); if(prev[i] < 0) break; }
  /* extend a period either side, so notes before the first beat and after the last have a grid */
  const P = out.length > 1 ? (out[out.length - 1] - out[0]) / (out.length - 1) : 60 / bpm;
  while(out[0] > (cl.length ? cl[0].t : 0) - 0.02) out.unshift(out[0] - P);
  while(out[out.length - 1] < until + P) out.push(out[out.length - 1] + P);
  return out;
}
/* which beat of the bar each beat is: where the weight lands */
function cpDownbeat(cl, beats, perBar){
  if(perBar <= 1) return 0;
  const P = beats.length > 1 ? (beats[beats.length - 1] - beats[0]) / (beats.length - 1) : 0.5;
  const strength = beats.map(t => {
    let s = 0; for(const c of cl){ if(c.t < t - 0.12 * P) continue; if(c.t > t + 0.12 * P) break;
      s += c.w + (c.bass < 55 ? 1.2 : 0) + 0.25 * c.notes.length; }
    return s; });
  let best = 0, bs = -1;
  for(let o = 0; o < perBar; o++){
    let s = 0, n = 0; for(let k = o; k < strength.length; k += perBar){ s += strength[k]; n++; }
    s = n ? s / n : 0;
    if(s > bs + 1e-9){ bs = s; best = o; }
  }
  return best;
}
/* seconds to beats, on a tracked grid (extrapolated past either end) */
function cpBeatPos(beats, t){
  const n = beats.length;
  if(n < 2) return 0;
  if(t <= beats[0]) return (t - beats[0]) / (beats[1] - beats[0]);
  if(t >= beats[n - 1]) return n - 1 + (t - beats[n - 1]) / (beats[n - 1] - beats[n - 2]);
  let lo = 0, hi = n - 1;
  while(hi - lo > 1){ const m = (lo + hi) >> 1; if(beats[m] <= t) lo = m; else hi = m; }
  return lo + (t - beats[lo]) / (beats[lo + 1] - beats[lo]);
}

/* ---------- 3. swing ---------- */
/* where the note after the beat lands, in beats where there is exactly one */
function cpSwing(ev, beats){
  const byBeat = new Map();
  ev.forEach(e => { const x = cpBeatPos(beats, e.on), k = Math.floor(x + 0.08), f = x - k; if(k < 0) return;
    const l = byBeat.get(k) || byBeat.set(k, []).get(k); l.push(f); });
  const offs = [];
  byBeat.forEach(fs => {
    const uniq = [...new Set(fs.map(f => Math.round(f * 50) / 50))].sort((a, b) => a - b);
    const on = uniq.filter(f => f < 0.12 || f > 0.92), mid = uniq.filter(f => f >= 0.3 && f <= 0.85);
    if(on.length && mid.length === 1 && uniq.length === on.length + 1) offs.push(mid[0]);
  });
  if(offs.length < 4) return {on: false, ratio: 1, at: 0.5, n: offs.length};
  const at = cpMedian(offs);
  const spread = cpMedian(offs.map(f => Math.abs(f - at)));
  const on = at >= 0.575 && at <= 0.76 && spread < 0.08;
  return {on, ratio: +(at / (1 - at)).toFixed(2), at: +at.toFixed(3), n: offs.length};
}
/* a swung position in the beat, straightened: the late offbeat goes back to the middle */
function cpUnswing(f, at){
  if(!(at > 0.5)) return f;
  return f <= at ? f * 0.5 / at : 0.5 + (f - at) * 0.5 / (1 - at);
}

/* ---------- 4. the grid, beat by beat ---------- */
const CP_SUBDIV = {auto: [1, 2, 3, 4], '8': [1, 2], '3': [1, 3], '16': [1, 2, 4], '4': [1]};
const CP_COMPLEX = {1: 0, 2: 0.004, 3: 0.012, 4: 0.01, 6: 0.012};
function cpChooseGrid(fracs, options){
  let best = null;
  for(const S of options){
    let err = 0; fracs.forEach(f => { const q = Math.round(f * S) / S; err += (f - q) ** 2; });
    const cost = err + CP_COMPLEX[S] * (fracs.length ? 1 : 0) + (S === 3 && fracs.length < 2 ? 0.05 : 0);
    if(!best || cost < best.cost - 1e-12) best = {S, cost};
  }
  return best ? best.S : 1;
}

/* ---------- 5. the hands ---------- */
function cpHands(clusters, split){
  let cR = 67, cL = 50;
  const cost = (p, h, c) => Math.abs(p - c) * 0.12 + (h === 'L' ? Math.max(0, p - 66) * 0.45 : Math.max(0, 55 - p) * 0.45);
  clusters.forEach(cl => {
    const ps = cl.notes.slice().sort((a, b) => a.pitch - b.pitch);
    if(split != null && split !== 'auto'){ ps.forEach(n => n.staff = n.pitch >= +split ? 1 : 2); return; }
    let best = null;
    for(let s = 0; s <= ps.length; s++){
      const L = ps.slice(0, s), R = ps.slice(s);
      let c = 0;
      L.forEach(n => c += cost(n.pitch, 'L', cL)); R.forEach(n => c += cost(n.pitch, 'R', cR));
      if(L.length && L[L.length - 1].pitch - L[0].pitch > 15) c += 12;
      if(R.length && R[R.length - 1].pitch - R[0].pitch > 15) c += 12;
      if(L.length > 5) c += 4; if(R.length > 5) c += 4;
      if(!best || c < best.c) best = {c, s};
    }
    ps.forEach((n, i) => n.staff = i < best.s ? 2 : 1);
    const L = ps.filter(n => n.staff === 2), R = ps.filter(n => n.staff === 1);
    if(L.length) cL = 0.55 * cL + 0.45 * (L.reduce((a, n) => a + n.pitch, 0) / L.length);
    if(R.length) cR = 0.55 * cR + 0.45 * (R.reduce((a, n) => a + n.pitch, 0) / R.length);
  });
}

/* ---------- 6. the key ---------- */
function cpKey(notes, secOf){
  const h = new Array(12).fill(0);
  notes.forEach(n => { h[cpPc(n.pitch)] += Math.max(0.05, secOf ? secOf(n) : (n.dur || 1)); });
  let best = null;
  for(let t = 0; t < 12; t++) for(const mode of ['major', 'minor']){
    const prof = CP_KK[mode].map((_, i) => CP_KK[mode][(i - t + 12) % 12]);
    const r = cpCorr(h, prof);
    if(!best || r > best.r) best = {tonic: t, mode, r};
  }
  const fifths = (best.mode === 'major' ? CP_MAJ_FIFTHS : CP_MIN_FIFTHS)[best.tonic];
  const tn = cpFifthsName(best.mode === 'major' ? fifths : fifths + 3);
  return {tonic: best.tonic, mode: best.mode, fifths, r: +best.r.toFixed(3), name: tn.step + (tn.alter > 0 ? '#' : tn.alter < 0 ? 'b' : '') + (best.mode === 'minor' ? 'm' : '')};
}

/* ---------- 7. chord symbols ---------- */
/* [name, intervals, how odd the name is, MusicXML kind] */
const CP_SHAPES = [
  ['',      [0, 4, 7], 0, 'major'],            ['m',     [0, 3, 7], 0, 'minor'],
  ['dim',   [0, 3, 6], 1.0, 'diminished'],     ['aug',   [0, 4, 8], 1.4, 'augmented'],
  ['sus4',  [0, 5, 7], 1.1, 'suspended-fourth'], ['6',   [0, 4, 7, 9], 0.8, 'major-sixth'],
  ['m6',    [0, 3, 7, 9], 1.0, 'minor-sixth'],  ['7',    [0, 4, 7, 10], 0.25, 'dominant'],
  ['maj7',  [0, 4, 7, 11], 0.35, 'major-seventh'], ['m7', [0, 3, 7, 10], 0.3, 'minor-seventh'],
  ['m7b5',  [0, 3, 6, 10], 0.8, 'half-diminished'], ['dim7', [0, 3, 6, 9], 1.0, 'diminished-seventh'],
  ['7sus4', [0, 5, 7, 10], 0.9, 'suspended-fourth'], ['9', [0, 4, 7, 10, 14], 0.7, 'dominant-ninth'],
  ['maj9',  [0, 4, 7, 11, 14], 0.8, 'major-ninth'], ['m9', [0, 3, 7, 10, 14], 0.75, 'minor-ninth'],
  ['13',    [0, 4, 7, 10, 14, 21], 1.0, 'dominant-13th'], ['m11', [0, 3, 7, 10, 14, 17], 1.2, 'minor-11th'],
  ['6/9',   [0, 4, 7, 9, 14], 1.0, 'major-sixth'], ['7b9', [0, 4, 7, 10, 13], 1.1, 'dominant'],
  ['7#9',   [0, 4, 7, 10, 15], 1.1, 'dominant'],   ['7alt', [0, 4, 10, 13, 15, 20], 1.4, 'dominant'],
  ['m(maj7)', [0, 3, 7, 11], 1.3, 'major-minor']];
function cpChordFit(hold, bass, prevRoot){
  const pcs = Object.keys(hold).map(Number).filter(p => hold[p] > 0.05);
  if(pcs.length < 2) return null;
  const all = [];
  for(let r = 0; r < 12; r++) for(const [name, iv, odd, kind] of CP_SHAPES){
    const tones = iv.map(t => t % 12), has = new Set(tones);
    let cost = odd + tones.length * 0.05;
    const third = tones.find(t => t === 3 || t === 4), seventh = tones.find(t => t === 10 || t === 11 || (t === 9 && name === 'dim7'));
    /* rootless: the 3rd and 7th are there and something above them; the root is the bass's to supply */
    const rootless = third != null && seventh != null && hold[(r + third) % 12] > 0.2 && hold[(r + seventh) % 12] > 0.2 && tones.length >= 5;
    tones.forEach(t => { if(!(hold[(r + t) % 12] > 0.05)) cost += t === 7 ? 0.35 : t === 0 ? (rootless ? 0.45 : 1.0) : t === 3 || t === 4 ? 1.3 : t === 10 || t === 11 ? 1.1 : 0.7; });
    pcs.forEach(p => { if(!has.has(((p - r) % 12 + 12) % 12)) cost += 2.0 * Math.max(0.2, Math.min(1, hold[p])); });
    if(bass != null && bass === r) cost -= 1.2;
    else if(bass != null && !has.has(((bass - r) % 12 + 12) % 12)) cost += 0.6;
    if(prevRoot != null && ((prevRoot - r + 12) % 12) === 7) cost -= 0.35;   /* down a fifth: ii–V–I */
    all.push({cost, root: r, name, kind, tones});
  }
  all.sort((a, b) => a.cost - b.cost);
  const best = all[0], next = all.find(x => x.root !== best.root || x.name !== best.name);
  return Object.assign({}, best, {margin: next ? +(next.cost - best.cost).toFixed(2) : 9});
}

/* ---------- the whole clean-up ---------- */
function cpClean(events, opts){
  const o = Object.assign({bpm: 120, ts: [4, 4], click: false, t0: null, grid: 'auto', swing: 'auto', split: 'auto', mode: 'piano', chords: null, pedal: [], title: 'Untitled', minDur: 0.04}, opts || {});
  const ev = cpPrepare(events, o).filter(e => e.off - e.on >= o.minDur || e.conf >= 0.95);
  const ts = o.ts, compound = ts[1] === 8 && ts[0] % 3 === 0 && ts[0] > 3;
  const beatDiv = compound ? CP_DIV * 1.5 : CP_DIV * 4 / ts[1];
  const perBar = compound ? ts[0] / 3 : ts[0];
  const barDiv = beatDiv * perBar;
  const cl = cpClusters(ev);
  const until = ev.reduce((m, e) => Math.max(m, e.off), 0);
  /* 1. the beat */
  let beats, bpm, t0Idx = 0, tempoFound = null;
  if(o.click && o.bpm){
    const P = 60 / o.bpm * (compound ? 1.5 : 1);
    const start = o.t0 != null ? o.t0 : (cl.length ? cl[0].t : 0);
    const first = cl.length ? Math.min(start, cl[0].t) : start;
    const back = Math.max(0, Math.ceil((start - first) / P - 0.25));
    beats = []; for(let t = start - back * P; t <= until + P * 2; t += P) beats.push(t);
    /* the bar starts on the click's downbeat; whatever came before it is a pickup */
    t0Idx = back - perBar * Math.ceil(back / perBar);
    bpm = compound ? o.bpm / 1.5 : o.bpm;
  } else {
    tempoFound = cpTempo(cl, o.free ? null : (o.bpmHint || null));
    bpm = o.tempo === 'comb' ? tempoFound.bpm : cpTempoAC(cl, until, o.free ? null : (o.bpmHint || null));
    beats = o.tracker === 'simple' ? cpTrackBeats(cl, bpm, tempoFound.phase, until) : cpTrackBeatsDP(cl, bpm, until, o.alpha);
    t0Idx = cpDownbeat(cl, beats, perBar);
  }
  const posOf = t => cpBeatPos(beats, t) - t0Idx;   /* in beats from the first bar line */
  /* 2–3. swing, then the grid */
  const sw = o.swing === 'off' ? {on: false, ratio: 1, at: 0.5} : cpSwing(ev, beats);
  if(o.swing === 'on' && !sw.on){ sw.on = true; if(!(sw.at > 0.55)) { sw.at = 0.64; sw.ratio = 1.78; } }
  const swungAt = sw.on && !compound ? sw.at : 0.5;
  const options = compound ? ({auto: [1, 3, 6], '8': [1, 3], '16': [1, 3, 6], '3': [1, 3], '4': [1]}[o.grid] || [1, 3, 6])
    : (CP_SUBDIV[o.grid] || CP_SUBDIV.auto).filter(S => !(sw.on && S === 3 && o.grid === 'auto'));
  const straight = x => { const k = Math.floor(x), f = x - k; return k + cpUnswing(f, swungAt); };
  const onPos = ev.map(e => straight(posOf(e.on)));
  const byBeat = new Map();
  onPos.forEach((x, i) => { const k = Math.floor(x + 0.001); const l = byBeat.get(k) || byBeat.set(k, []).get(k); l.push({f: x - k, i}); });
  const gridOf = new Map();
  byBeat.forEach((l, k) => gridOf.set(k, cpChooseGrid(l.map(z => z.f), options)));
  const snap = x => { const k = Math.floor(x + 0.001), S = gridOf.get(k) || options[Math.min(1, options.length - 1)] || 1; const f = x - k; return Math.round((k + Math.round(f * S) / S) * beatDiv); };
  const snapEnd = (x, start) => {
    const k = Math.floor(x), S = gridOf.get(k) || gridOf.get(k - 1) || 2, f = x - k;
    let d = Math.round((k + Math.round(f * S) / S) * beatDiv);
    const unit = Math.round(beatDiv / Math.max(1, gridOf.get(Math.floor(start / beatDiv)) || 2));
    return Math.max(start + unit, d);
  };
  /* the pedal: known only from MIDI */
  const pedal = (o.pedal || []).map(p => ({div: Math.max(0, snap(straight(posOf(p.t)))), down: !!p.down})).sort((a, b) => a.div - b.div);
  let notes = ev.map((e, i) => {
    const start = Math.max(0, snap(onPos[i]));
    const end = snapEnd(straight(posOf(e.off)), start);
    return {id: 'n' + i, pitch: e.pitch, start, dur: end - start, vel: e.vel, conf: e.conf, src: e.i, staff: 1, voice: 1};
  });
  /* the same key struck twice at one grid point is one note */
  const seen = new Map();
  notes = notes.filter(n => { const k = n.pitch + '@' + n.start; if(seen.has(k)){ const m = seen.get(k); m.dur = Math.max(m.dur, n.dur); return false; } seen.set(k, n); return true; });
  /* 4. the hands */
  const qcl = []; notes.slice().sort((a, b) => a.start - b.start || a.pitch - b.pitch).forEach(n => {
    const c = qcl[qcl.length - 1]; if(c && c.start === n.start) c.notes.push(n); else qcl.push({start: n.start, notes: [n]}); });
  if(o.mode === 'lead'){
    /* the melody is the top line; the rest is the harmony the symbols are read from */
    qcl.forEach(c => { const top = c.notes.reduce((a, b) => b.pitch > a.pitch ? b : a); c.notes.forEach(n => n.staff = n === top && n.pitch >= (o.split !== 'auto' && o.split != null ? +o.split : 57) ? 1 : 2); });
  } else cpHands(qcl, o.split);
  /* 5. voices, and nothing in a voice overlapping the next thing in it */
  cpVoices(notes);
  /* 6. the key */
  const secPerDiv = 60 / bpm / (beatDiv / CP_DIV) / CP_DIV;
  const key = cpKey(notes, n => n.dur * secPerDiv);
  /* 7. chord symbols */
  const wantChords = o.chords != null ? o.chords : o.mode === 'lead';
  const lastEnd = notes.reduce((m, n) => Math.max(m, n.start + n.dur), 0);
  const measures = Math.max(1, Math.ceil(lastEnd / barDiv - 1e-9));
  const chords = wantChords ? cpChordSymbols(notes, barDiv, measures, ts, key) : [];
  /* the spelling, now the key and chords are known */
  cpSpellAll(notes, key, chords);
  return {v: 1, bpm: Math.round(bpm), ts: ts.slice(), compound, beatDiv, barDiv, perBar, measures, key, swing: sw, notes, chords, pedal,
    mode: o.mode, title: o.title, grid: o.grid, split: o.split, beats: beats.map(b => +b.toFixed(3)), t0Idx, tempoScore: tempoFound ? +tempoFound.score.toFixed(2) : null,
    gridUsed: [...gridOf.entries()].reduce((m, [k, S]) => (m[S] = (m[S] || 0) + 1, m), {})};
}
/* voice 1 is the top line where the top moves apart from what is under it */
function cpVoices(notes){
  [1, 2].forEach(st => {
    const mine = notes.filter(n => n.staff === st).sort((a, b) => a.start - b.start || b.pitch - a.pitch);
    const groups = []; mine.forEach(n => { const g = groups[groups.length - 1]; if(g && g.start === n.start) g.notes.push(n); else groups.push({start: n.start, notes: [n]}); });
    groups.forEach(g => {
      g.notes.sort((a, b) => b.pitch - a.pitch);
      const top = g.notes[0], rest = g.notes.slice(1);
      g.notes.forEach(n => n.voice = 1);
      if(rest.length && rest.some(n => n.dur !== top.dur)){
        /* the chord under a melody note of another length: its own voice */
        const long = rest.every(n => n.dur === rest[0].dur);
        if(long) rest.forEach(n => n.voice = 2);
        else rest.forEach(n => { n.dur = top.dur; });
      }
    });
    /* within a voice, a note lasts no longer than the next thing that starts in it */
    [1, 2].forEach(v => {
      const vs = mine.filter(n => n.voice === v).sort((a, b) => a.start - b.start);
      for(let i = 0; i < vs.length; i++){
        const next = vs.find(x => x.start > vs[i].start);
        if(next && vs[i].start + vs[i].dur > next.start) vs[i].dur = next.start - vs[i].start;
        /* a gap smaller than a sixteenth is closed: legato, not a flurry of rests */
        if(next && next.start - (vs[i].start + vs[i].dur) > 0 && next.start - (vs[i].start + vs[i].dur) < CP_DIV / 2) vs[i].dur = next.start - vs[i].start;
      }
      /* the notes of one chord end together */
      const byStart = new Map(); vs.forEach(n => { const l = byStart.get(n.start) || byStart.set(n.start, []).get(n.start); l.push(n); });
      byStart.forEach(l => { const d = Math.min(...l.map(n => n.dur)); l.forEach(n => n.dur = d); });
    });
  });
}
function cpChordSymbols(notes, barDiv, measures, ts, key){
  const halves = ts[0] === 4 && ts[1] === 4 ? 2 : 1;
  const seg = barDiv / halves, out = [];
  let prevRoot = null;
  for(let m = 0; m < measures; m++) for(let h = 0; h < halves; h++){
    const a = m * barDiv + h * seg, z = a + seg;
    const hold = {}; let bass = null, lowest = Infinity;
    notes.forEach(n => { const s = Math.max(a, n.start), e = Math.min(z, n.start + n.dur); if(e <= s) return;
      const pc = cpPc(n.pitch); hold[pc] = Math.min(1, (hold[pc] || 0) + (e - s) / seg);
      if(n.pitch < lowest && n.start <= a + seg * 0.5){ lowest = n.pitch; bass = pc; } });
    const fit = cpChordFit(hold, bass, prevRoot);
    if(!fit) continue;
    const last = out[out.length - 1];
    if(last && last.root === fit.root && last.name === fit.name){ last.dur += seg; continue; }
    out.push({start: a, dur: seg, root: fit.root, name: fit.name, kind: fit.kind, bass: bass != null && bass !== fit.root && fit.tones.indexOf(((bass - fit.root) % 12 + 12) % 12) >= 0 ? bass : null,
      conf: +Math.max(0, Math.min(1, fit.margin / 1.5)).toFixed(2), unsure: fit.margin < 0.6, tones: fit.tones});
    prevRoot = fit.root;
  }
  /* the chord roots spelled the way the key spells them */
  const center = key.fifths + 2;
  out.forEach(c => { c.rootF = cpSpellNear(c.root, center); const r = cpFifthsName(c.rootF); c.rootStep = r.step; c.rootAlter = r.alter;
    if(c.bass != null){ const b = cpFifthsName(cpSpellNear(c.bass, c.rootF + 2)); c.bassStep = b.step; c.bassAlter = b.alter; }
    c.symbol = c.rootStep + (c.rootAlter > 0 ? '#' : c.rootAlter < 0 ? 'b' : '') + c.name + (c.bass != null ? '/' + c.bassStep + (c.bassAlter > 0 ? '#' : c.bassAlter < 0 ? 'b' : '') : ''); });
  return out;
}
/* each interval above a chord root, on the line of fifths: the third of D is F#, the flat nine of G is Ab */
const CP_IV_FIFTHS = {0: 0, 1: -5, 2: 2, 3: -3, 4: 4, 5: -1, 6: 6, 7: 1, 8: -4, 9: 3, 10: -2, 11: 5};
function cpSpellAll(notes, key, chords){
  const center = key.fifths + 2;
  notes.forEach(n => {
    const pc = cpPc(n.pitch);
    const c = chords.find(x => n.start >= x.start && n.start < x.start + x.dur);
    let f;
    if(c && c.tones.map(t => t % 12).includes(((pc - c.root) % 12 + 12) % 12)){
      const iv = ((pc - c.root) % 12 + 12) % 12;
      let off = CP_IV_FIFTHS[iv];
      if(iv === 6 && /dim|b5/.test(c.name)) off = -6;          /* the diminished fifth */
      if(iv === 8 && /aug|\+|#5/.test(c.name)) off = 8;         /* the augmented fifth */
      if(iv === 3 && /#9|alt/.test(c.name)) off = 9;            /* the sharp nine */
      if(iv === 9 && c.name === 'dim7') off = -9;               /* the diminished seventh */
      f = c.rootF + off;
      /* a spelling that far from the key is not worth it (Fb in C) */
      if(Math.abs(f - center) > 9) f = cpSpellNear(pc, center);
    } else f = cpSpellNear(pc, center);
    const nm = cpFifthsName(f);
    n.step = nm.step; n.alter = nm.alter;
    n.octave = Math.floor((n.pitch - nm.alter) / 12) - 1;
  });
}

/* ---------- MusicXML ---------- */
const CP_TYPES = [[48, 'whole', 0], [36, 'half', 1], [24, 'half', 0], [18, 'quarter', 1], [12, 'quarter', 0], [9, 'eighth', 1], [6, 'eighth', 0], [3, '16th', 0]];
const CP_TRIP = [[8, 'quarter'], [4, 'eighth'], [2, '16th']];
function cpXmlEsc(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
/* a stretch of time in one voice, cut at the beat where it must be, into written values */
function cpPieces(start, dur, beatDiv, barStart, gridAt, barDiv){
  const out = [], end = start + dur;
  const allowed = (d, pos) => d <= beatDiv || (d % beatDiv === 0 && pos % d === 0) || (d === 36 && barDiv === 48 && pos === 12);
  let t = start, guard = 0;
  while(t < end - 1e-9 && guard++ < 64){
    const k = Math.floor((t - barStart) / beatDiv + 1e-9), bStart = barStart + k * beatDiv, bEnd = bStart + beatDiv;
    const onBeat = Math.abs(t - bStart) < 1e-9;
    if(gridAt(k) === 3 && beatDiv === 12 && !(onBeat && end - t >= 12 - 1e-9)){
      const len = Math.min(end, bEnd) - t, at = t - bStart;
      const d = len >= 8 && at === 0 ? 8 : len >= 4 ? 4 : len >= 2 ? 2 : len;
      out.push({d, type: d === 8 ? 'quarter' : d === 4 ? 'eighth' : '16th', dot: 0, trip: true}); t += d; continue;
    }
    if(!onBeat){
      const len = Math.min(end, bEnd) - t;
      const pick = CP_TYPES.find(([d]) => d <= len + 1e-9 && d < beatDiv);
      const d = pick ? pick[0] : len;
      out.push({d, type: pick ? pick[1] : '16th', dot: pick ? pick[2] : 0}); t += d; continue;
    }
    const len = end - t, pos = t - barStart;
    const pick = CP_TYPES.find(([d]) => d <= len + 1e-9 && allowed(d, pos));
    const d = pick ? pick[0] : len;
    out.push({d, type: pick ? pick[1] : 'quarter', dot: pick ? pick[2] : 0}); t += d;
  }
  return out;
}
const CP_KIND_TEXT = {'': '', m: 'm', dim: 'dim', aug: '+', sus4: 'sus4', '6': '6', m6: 'm6', '7': '7', maj7: 'maj7', m7: 'm7', m7b5: 'm7b5', dim7: 'dim7', '7sus4': '7sus4', '9': '9', maj9: 'maj9', m9: 'm9',
  '13': '13', m11: 'm11', '6/9': '6/9', '7b9': '7b9', '7#9': '7#9', '7alt': '7alt', 'm(maj7)': 'm(maj7)'};
function cpHarmonyXml(c, offset){
  const alter = a => a ? `<root-alter>${a}</root-alter>` : '';
  const degrees = ({'7sus4': [[7, -1, 'add']], '6/9': [[9, 0, 'add']], '7b9': [[9, -1, 'add']], '7#9': [[9, 1, 'add']], '7alt': [[5, 1, 'alter'], [9, 1, 'add']]}[c.name] || [])
    .map(([v, a, t]) => `<degree><degree-value>${v}</degree-value><degree-alter>${a}</degree-alter><degree-type>${t}</degree-type></degree>`).join('');
  return `<harmony${c.unsure ? ' color="#9A9A9A"' : ''} print-frame="no"><root><root-step>${c.rootStep}</root-step>${alter(c.rootAlter)}</root><kind text="${cpXmlEsc(CP_KIND_TEXT[c.name] != null ? CP_KIND_TEXT[c.name] : c.name)}">${c.kind}</kind>${c.bass != null ? `<bass><bass-step>${c.bassStep}</bass-step>${c.bassAlter ? `<bass-alter>${c.bassAlter}</bass-alter>` : ''}</bass>` : ''}${degrees}${offset ? `<offset>${offset}</offset>` : ''}</harmony>`;
}
function cpToMusicXML(model, opts){
  const o = Object.assign({title: model.title || 'Untitled', composer: '', chords: model.chords && model.chords.length > 0}, opts || {});
  const M = model, lead = M.mode === 'lead';
  const staves = lead ? [1] : [1, 2];
  const keyAlter = {}; 'FCGDAEB'.split('').forEach((l, i) => { keyAlter[l] = M.key.fifths > 0 ? (i < M.key.fifths ? 1 : 0) : (6 - i < -M.key.fifths ? -1 : 0); });
  /* which grid each beat was written in, for the triplets */
  const tripBeats = new Set();
  M.notes.forEach(n => { const k = Math.floor(n.start / M.beatDiv); if(n.start % M.beatDiv && (n.start % M.beatDiv) % 4 === 0 && (n.start % M.beatDiv) % 6 !== 0 && M.beatDiv === 12) tripBeats.add(k); });
  const gridAtAbs = k => tripBeats.has(k) ? 3 : 2;
  const lastEnd = M.notes.reduce((m, n) => Math.max(m, n.start + n.dur), 0);
  const nMeas = Math.max(1, Math.ceil(Math.max(lastEnd, M.barDiv) / M.barDiv - 1e-9));
  const shown = n => lead ? n.staff === 1 : true;
  let body = '';
  for(let m = 0; m < nMeas; m++){
    const ms = m * M.barDiv, me = ms + M.barDiv;
    let x = `<measure number="${m + 1}">`;
    if(m === 0){
      x += `<attributes><divisions>${CP_DIV}</divisions><key><fifths>${M.key.fifths}</fifths><mode>${M.key.mode}</mode></key><time><beats>${M.ts[0]}</beats><beat-type>${M.ts[1]}</beat-type></time>`
        + (lead ? '<clef><sign>G</sign><line>2</line></clef>' : '<staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef>') + '</attributes>';
      const beatUnit = M.compound ? 'quarter' : M.ts[1] === 8 ? 'eighth' : M.ts[1] === 2 ? 'half' : 'quarter';
      x += `<direction placement="above"><direction-type><metronome><beat-unit>${beatUnit}</beat-unit>${M.compound ? '<beat-unit-dot/>' : ''}<per-minute>${M.bpm}</per-minute></metronome></direction-type><sound tempo="${M.compound ? Math.round(M.bpm * 1.5) : M.bpm}"/></direction>`;
      if(M.swing && M.swing.on) x += `<direction placement="above"><direction-type><words font-weight="bold">Swing</words></direction-type><sound><swing><first>${Math.round(M.swing.ratio * 10)}</first><second>10</second><swing-type>eighth</swing-type></swing></sound></direction>`;
    }
    const accState = {};
    let first = true;
    staves.forEach(st => {
      const voices = [...new Set(M.notes.filter(n => n.staff === st && shown(n)).map(n => n.voice))].sort();
      if(!voices.length) voices.push(1);
      voices.forEach(v => {
        const mine = M.notes.filter(n => n.staff === st && n.voice === v && shown(n) && n.start < me && n.start + n.dur > ms).sort((a, b) => a.start - b.start || a.pitch - b.pitch);
        if(v !== 1 && !mine.length) return;
        if(!first) x += `<backup><duration>${M.barDiv}</duration></backup>`;
        first = false;
        const vNum = (st - 1) * 4 + v;
        /* the stretches of this bar: chords of notes, and rests between */
        const groups = []; mine.forEach(n => { const g = groups[groups.length - 1]; if(g && g.start === n.start) g.notes.push(n); else groups.push({start: n.start, end: n.start + n.dur, notes: [n]}); });
        const segs = []; let t = ms;
        groups.forEach(g => { const s = Math.max(ms, g.start), e = Math.min(me, g.end); if(s > t) segs.push({rest: true, s: t, e: s}); if(e > s) segs.push({s, e, g, tieIn: g.start < ms, tieOut: g.end > me}); t = Math.max(t, e); });
        if(t < me && (v === 1 || segs.length)) segs.push({rest: true, s: t, e: me});
        const harm = st === 1 && v === 1 && o.chords ? (M.chords || []).filter(c => c.start >= ms && c.start < me) : [];
        let beam = [];
        const flushBeam = () => { if(beam.length > 1) beam.forEach((b, i) => { b.beam = i === 0 ? 'begin' : i === beam.length - 1 ? 'end' : 'continue'; }); beam = []; };
        const items = [];
        segs.forEach(sg => {
          if(sg.rest && sg.s === ms && sg.e === me){ items.push({rest: true, whole: true, d: M.barDiv, s: sg.s}); return; }
          const pieces = cpPieces(sg.s, sg.e - sg.s, M.beatDiv, ms, k => gridAtAbs(Math.floor(ms / M.beatDiv) + k), M.barDiv);
          let at = sg.s;
          pieces.forEach((p, i) => { items.push(Object.assign({}, p, {s: at, rest: !!sg.rest, g: sg.g, tieStart: !sg.rest && (i < pieces.length - 1 || sg.tieOut), tieStop: !sg.rest && (i > 0 || sg.tieIn)})); at += p.d; });
        });
        /* beams: eighths and shorter, in one beat, with no rest between */
        let curBeat = null;
        items.forEach(it => {
          const k = Math.floor((it.s - ms) / M.beatDiv + 1e-9);
          const short = !it.rest && ['eighth', '16th'].includes(it.type);
          if(!short || k !== curBeat){ flushBeam(); }
          curBeat = k;
          if(short) beam.push(it); else flushBeam();
        });
        flushBeam();
        let tripOpen = false;
        items.forEach((it, idx) => {
          harm.filter(c => c.start >= it.s && c.start < it.s + it.d && !c.done).forEach(c => { c.done = true; x += cpHarmonyXml(c, c.start - it.s); });
          const nextIt = items[idx + 1];
          const tupStart = it.trip && !tripOpen, tupStop = it.trip && (!nextIt || !nextIt.trip || Math.floor((nextIt.s - ms) / M.beatDiv) !== Math.floor((it.s - ms) / M.beatDiv));
          if(tupStart) tripOpen = true; if(tupStop) tripOpen = false;
          const tm = it.trip ? '<time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>' : '';
          const tup = it.trip && (tupStart || tupStop) ? `<notations>${tupStart ? '<tuplet type="start" bracket="yes"/>' : ''}${tupStop ? '<tuplet type="stop"/>' : ''}</notations>` : '';
          if(it.rest){
            x += it.whole ? `<note><rest measure="yes"/><duration>${it.d}</duration><voice>${vNum}</voice>${lead ? '' : `<staff>${st}</staff>`}</note>`
              : `<note><rest/><duration>${it.d}</duration><voice>${vNum}</voice><type>${it.type}</type>${it.dot ? '<dot/>' : ''}${tm}${lead ? '' : `<staff>${st}</staff>`}${tup}</note>`;
            return;
          }
          const ns = it.g.notes.slice().sort((a, b) => a.pitch - b.pitch);
          ns.forEach((n, j) => {
            const accKey = st + n.step + n.octave;
            const want = n.alter || 0, have = accState[accKey] != null ? accState[accKey] : keyAlter[n.step];
            let acc = '';
            if(!it.tieStop && want !== have){ acc = `<accidental>${{'-2': 'flat-flat', '-1': 'flat', '0': 'natural', '1': 'sharp', '2': 'double-sharp'}[want]}</accidental>`; }
            if(!it.tieStop) accState[accKey] = want;
            const ties = (it.tieStop ? '<tie type="stop"/>' : '') + (it.tieStart ? '<tie type="start"/>' : '');
            const tied = (it.tieStop ? '<tied type="stop"/>' : '') + (it.tieStart ? '<tied type="start"/>' : '');
            const beams = it.beam && j === 0 ? `<beam number="1">${it.beam}</beam>` + (it.type === '16th' ? `<beam number="2">${it.beam}</beam>` : '') : '';
            const nots = (tied || (tup && j === 0)) ? `<notations>${tied}${j === 0 && it.trip && tupStart ? '<tuplet type="start" bracket="yes"/>' : ''}${j === 0 && it.trip && tupStop ? '<tuplet type="stop"/>' : ''}</notations>` : '';
            x += `<note${n.id && !it.tieStop ? ` id="${cpXmlEsc(n.id)}"` : ''}>${j > 0 ? '<chord/>' : ''}<pitch><step>${n.step}</step>${n.alter ? `<alter>${n.alter}</alter>` : ''}<octave>${n.octave}</octave></pitch><duration>${it.d}</duration>${ties}<voice>${vNum}</voice><type>${it.type}</type>${it.dot ? '<dot/>' : ''}${acc}${tm}${lead ? '' : `<staff>${st}</staff>`}${beams}${nots}</note>`;
          });
        });
        /* a harmony that starts in a stretch of this voice that is not here (a voice-2 bar) */
        harm.filter(c => !c.done).forEach(c => { c.done = true; });
      });
    });
    /* the pedal, under the bass staff */
    const peds = (M.pedal || []).filter(p => p.div >= ms && p.div < me);
    if(peds.length){
      x += `<backup><duration>${M.barDiv}</duration></backup>`;
      let cur = ms;
      peds.forEach(p => { if(p.div > cur){ x += `<forward><duration>${p.div - cur}</duration></forward>`; cur = p.div; }
        x += `<direction placement="below"><direction-type><pedal type="${p.down ? 'start' : 'stop'}" line="no"/></direction-type>${lead ? '' : '<staff>2</staff>'}</direction>`; });
      if(cur < me) x += `<forward><duration>${me - cur}</duration></forward>`;
    }
    if(m === nMeas - 1) x += '<barline location="right"><bar-style>light-heavy</bar-style></barline>';
    x += '</measure>';
    body += x;
  }
  (M.chords || []).forEach(c => { delete c.done; });
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0"><work><work-title>${cpXmlEsc(o.title)}</work-title></work><identification>${o.composer ? `<creator type="composer">${cpXmlEsc(o.composer)}</creator>` : ''}<encoding><software>Life Instrument — Play to compose</software></encoding></identification>
<part-list><score-part id="P1"><part-name>${lead ? 'Melody' : 'Piano'}</part-name><score-instrument id="P1-I1"><instrument-name>Piano</instrument-name></score-instrument><midi-instrument id="P1-I1"><midi-channel>1</midi-channel><midi-program>1</midi-program></midi-instrument></score-part></part-list>
<part id="P1">${body}</part></score-partwise>`;
}

/* ---------- .mxl: MusicXML in a zip, stored ---------- */
function cpCrc32(bytes){
  let t = cpCrc32.t;
  if(!t){ t = cpCrc32.t = new Uint32Array(256); for(let n = 0; n < 256; n++){ let c = n; for(let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } }
  let c = 0xffffffff; for(let i = 0; i < bytes.length; i++) c = t[(c ^ bytes[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function cpUtf8(s){ return typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(s) : Uint8Array.from(Buffer.from(s, 'utf8')); }
function cpZip(files){
  const parts = [], central = []; let off = 0;
  const u16 = n => [n & 255, (n >> 8) & 255], u32 = n => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
  files.forEach(f => {
    const name = cpUtf8(f.name), data = typeof f.data === 'string' ? cpUtf8(f.data) : f.data, crc = cpCrc32(data);
    const head = [...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0)];
    parts.push(Uint8Array.from(head), name, data);
    central.push(Uint8Array.from([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), name);
    off += head.length + name.length + data.length;
  });
  const cdSize = central.reduce((s, p) => s + p.length, 0);
  const end = Uint8Array.from([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(off), ...u16(0)]);
  const all = [...parts, ...central, end], total = all.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total); let p = 0; all.forEach(a => { out.set(a, p); p += a.length; });
  return out;
}
function cpToMxl(xml, name){
  const file = (name || 'score').replace(/[^\w.-]+/g, '_') + '.musicxml';
  return cpZip([{name: 'mimetype', data: 'application/vnd.recordare.musicxml'},
    {name: 'META-INF/container.xml', data: `<?xml version="1.0" encoding="UTF-8"?>\n<container><rootfiles><rootfile full-path="${file}" media-type="application/vnd.recordare.musicxml+xml"/></rootfiles></container>`},
    {name: file, data: xml}]);
}

/* ---------- .mid ---------- */
/* written, the notes as notated (quantised, at the written tempo); played, the take as it was */
function cpToMidi(model, asPlayed, rawEvents, pedalRaw){
  const vlq = n => { const b = [n & 0x7f]; while((n >>= 7)) b.unshift((n & 0x7f) | 0x80); return b; };
  const str = s => [...s].map(c => c.charCodeAt(0));
  const u32 = n => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255], u16 = n => [(n >> 8) & 255, n & 255];
  const TPQ = 480, bpm = model.compound ? model.bpm * 1.5 : model.bpm, us = Math.round(60000000 / bpm);
  const evs = [{tick: 0, bytes: [0xff, 0x51, 3, (us >> 16) & 255, (us >> 8) & 255, us & 255]}, {tick: 0, bytes: [0xff, 0x58, 4, model.ts[0], Math.round(Math.log2(model.ts[1])), 24, 8]},
    {tick: 0, bytes: [0xff, 0x59, 2, (model.key.fifths + 256) & 255, model.key.mode === 'minor' ? 1 : 0]}, {tick: 0, bytes: [0xc0, 0]}];
  if(asPlayed && rawEvents && rawEvents.length){
    const t0 = Math.min(...rawEvents.map(e => e.onset));
    const tk = s => Math.max(0, Math.round((s - t0) * bpm / 60 * TPQ));
    rawEvents.forEach(e => { const off = e.offset != null ? e.offset : e.onset + 0.4; const v = Math.max(1, Math.min(127, Math.round((e.velocity || 0.7) * 127)));
      evs.push({tick: tk(e.onset), bytes: [0x90, e.pitch, v]}, {tick: Math.max(tk(e.onset) + 1, tk(off)), bytes: [0x80, e.pitch, 0]}); });
    (pedalRaw || []).forEach(p => evs.push({tick: tk(p.t), bytes: [0xb0, 64, p.down ? 127 : 0]}));
  } else {
    const tk = d => Math.round(d * TPQ / CP_DIV);
    model.notes.forEach(n => { const v = Math.max(1, Math.min(127, Math.round((n.vel || 0.7) * 127)));
      evs.push({tick: tk(n.start), bytes: [0x90, n.pitch, v]}, {tick: tk(n.start + n.dur), bytes: [0x80, n.pitch, 0]}); });
    (model.pedal || []).forEach(p => evs.push({tick: tk(p.div), bytes: [0xb0, 64, p.down ? 127 : 0]}));
  }
  evs.sort((a, b) => a.tick - b.tick || ((a.bytes[0] & 0xf0) === 0x80 ? -1 : 0) - ((b.bytes[0] & 0xf0) === 0x80 ? -1 : 0));
  let last = 0; const data = [];
  evs.forEach(e => { data.push(...vlq(Math.max(0, e.tick - last)), ...e.bytes); last = e.tick; });
  data.push(0, 0xff, 0x2f, 0);
  return new Uint8Array([...str('MThd'), ...u32(6), ...u16(0), ...u16(1), ...u16(TPQ), ...str('MTrk'), ...u32(data.length), ...data]);
}

/* ---------- the light edits, on the cleaned model ---------- */
/* each returns true when it changed something; the caller counts them */
function cpEdit(model, op, id, arg){
  const n = model.notes.find(x => x.id === id);
  if(op === 'regrid') return false;
  if(!n) return false;
  const key = model.key, chords = model.chords || [];
  if(op === 'delete'){ model.notes = model.notes.filter(x => x !== n); return true; }
  if(op === 'pitch'){ n.pitch = Math.max(21, Math.min(108, n.pitch + (arg || 1))); cpSpellAll([n], key, chords); return true; }
  if(op === 'longer' || op === 'shorter'){
    const unit = model.beatDiv / 2;
    n.dur = Math.max(unit / 2, n.dur + (op === 'longer' ? unit : -unit)); return true; }
  if(op === 'staff'){ n.staff = n.staff === 1 ? 2 : 1; n.voice = 1; return true; }
  return false;
}

if(typeof module !== 'undefined' && module.exports) module.exports = {cpTempoAC, cpTrackBeatsDP, cpClean, cpToMusicXML, cpToMxl, cpToMidi, cpZip, cpCrc32, cpTempo, cpTrackBeats, cpClusters, cpPrepare, cpSwing, cpKey, cpChordFit, cpEdit, cpBeatPos, CP_DIV};
