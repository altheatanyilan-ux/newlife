/* ============================================================
   RECORDING SYNC — PHASE 2: THE ALIGNMENT ENGINE

   Everything the engine does is inside one function, syncEngineModule,
   which uses nothing from outside itself: the page turns its source into
   a Worker (19-sync-c-worker.js), and the accuracy harness calls it
   directly under Node (test-sync-accuracy.js). No network, no library.

   THE PIPELINE, for a recording and a chart:
   1. Features. The audio at 11 025 Hz, mono. Chroma — the energy of each
      of the twelve pitch classes, treble and bass apart — every 46 ms
      (4096-point FFT); an onset envelope — spectral flux — every 23 ms.
      The tuning: where the spectral peaks sit against A = 440, as a
      circular mean, so a band tuned 30 cents sharp still reads as its
      own notes.
   2. The beat. Tempo from the onset envelope's autocorrelation, weighted
      toward the tune's own tempo word; beats by dynamic programming over
      the onsets (Ellis 2007). How sure it is: how far the onsets on the
      beats stand above the rest, and how even the beats are.
   3. The chart as sound. Each chord a 24-point template, treble and bass:
      root, third and seventh weighted highest, the fifth less, written
      extensions a little; the bass the root (or the slash note).
   4. The key. The recording's average chroma against the chart's at all
      twelve transpositions; the best three go forward and the alignment
      decides between them.
   5. Structure and coarse alignment in one pass: dynamic time warping of
      the recording (93 ms frames) against the chorus as a CYCLE — the
      path may leave the end of the chorus for its start any number of
      times — with an "unmapped" state before and after, for the intro
      and the ending. The chorus count, where each chorus starts and a
      first place for every beat come out of the one path. The warping
      steps allow half to double the expected tempo at a price, so a
      chorus may run from about three quarters to one and a third of its
      length without cost to speak of (the ±25% search the specification
      asks for), and more if the music really does that.
   6. Fine alignment. With a confident beat grid (heads and solos with a
      rhythm section) every beat moves to the nearest tracked beat, and
      each chorus is tested one beat either way against the harmony; then
      onto an onset peak within ±60 ms. Without one (rubato) the path is
      refined by a second warping at 46 ms inside a band round the first,
      then the downbeats snap to onsets within ±60 ms.
   7. Confidence, bar by bar: how much better the harmony fits here than
      anywhere else in the chorus; whether the beats fell on the grid;
      whether the bar's length agrees with its neighbours'. A bar held
      only by counting beats through a long unchanging chord (a modal
      tune) gets the grid's confidence, which fades with distance from
      the last chord change. Bars below 0.35 are interpolated from their
      neighbours and marked; time only goes forward; neighbouring bars may
      not differ in tempo by more than 40% unless one holds a fermata.
      Below 0.6 overall, the second-best key and any alternate form of
      the chart are tried, and the better map kept.
   ============================================================ */
function syncEngineModule(){
  'use strict';
  const VERSION = 'sync-2.0';
  const SR = 11025;
  const N_F = 1024, HOP_F = 256;       /* onsets: 23.2 ms */
  const N_C = 4096, HOP_C = 512;       /* chroma: 46.4 ms */
  const COARSE = 2;                    /* coarse frames: 92.9 ms */
  const W_BASS = 0.8;
  const now = () => (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

  /* ---------- FFT: radix-2, two real frames per complex transform ---------- */
  const plans = new Map();
  function plan(n){
    if(plans.has(n)) return plans.get(n);
    const bits = Math.log2(n) | 0, rev = new Uint32Array(n);
    for(let i = 0; i < n; i++){ let r = 0, x = i; for(let b = 0; b < bits; b++){ r = (r << 1) | (x & 1); x >>= 1; } rev[i] = r; }
    const cos = new Float64Array(n / 2), sin = new Float64Array(n / 2);
    for(let i = 0; i < n / 2; i++){ cos[i] = Math.cos(2 * Math.PI * i / n); sin[i] = -Math.sin(2 * Math.PI * i / n); }
    const win = new Float64Array(n);
    for(let i = 0; i < n; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / n);
    const p = {n, rev, cos, sin, win, re: new Float64Array(n), im: new Float64Array(n)};
    plans.set(n, p);
    return p;
  }
  function fftInPlace(p){
    const {n, rev, cos, sin, re, im} = p;
    for(let i = 0; i < n; i++){ const j = rev[i]; if(j > i){ let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for(let size = 2; size <= n; size <<= 1){
      const half = size >> 1, step = n / size;
      for(let s = 0; s < n; s += size){
        for(let k = 0, t = 0; k < half; k++, t += step){
          const a = s + k, b = a + half;
          const wr = cos[t], wi = sin[t];
          const xr = re[b] * wr - im[b] * wi, xi = re[b] * wi + im[b] * wr;
          re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
        }
      }
    }
  }
  /* the magnitude spectra (0..n/2) of the frames starting at a and b */
  function mags(x, a, b, p, outA, outB){
    const {n, win, re, im} = p, len = x.length;
    for(let i = 0; i < n; i++){
      const ia = a + i, ib = b + i;
      re[i] = ia >= 0 && ia < len ? x[ia] * win[i] : 0;
      im[i] = b >= 0 && ib >= 0 && ib < len ? x[ib] * win[i] : 0;
    }
    fftInPlace(p);
    for(let k = 0; k <= n / 2; k++){
      const j = (n - k) % n;
      const xr = re[k], xi = im[k], yr = re[j], yi = im[j];
      outA[k] = 0.5 * Math.hypot(xr + yr, xi - yi);
      if(outB) outB[k] = 0.5 * Math.hypot(xi + yi, xr - yr);
    }
  }

  /* ---------- to 11 025 Hz, mono ---------- */
  function toEngineRate(pcm, sr){
    if(sr === SR) return pcm instanceof Float32Array ? pcm : Float32Array.from(pcm);
    const ratio = sr / SR, out = new Float32Array(Math.floor(pcm.length / ratio));
    /* a windowed-sinc low-pass at 0.45 of the new rate, then take samples */
    const fc = 0.45 / ratio, half = Math.ceil(8 * ratio), taps = new Float64Array(2 * half + 1);
    let sum = 0;
    for(let i = -half; i <= half; i++){
      const w = 0.42 + 0.5 * Math.cos(Math.PI * i / half) + 0.08 * Math.cos(2 * Math.PI * i / half);
      const s = i === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * i) / (Math.PI * i);
      taps[i + half] = s * w; sum += s * w;
    }
    for(let i = 0; i < taps.length; i++) taps[i] /= sum;
    for(let o = 0; o < out.length; o++){
      const c = o * ratio, ci = Math.floor(c);
      let acc = 0;
      for(let t = -half; t <= half; t++){ const k = ci + t; if(k >= 0 && k < pcm.length) acc += pcm[k] * taps[t + half]; }
      out[o] = acc;
    }
    return out;
  }

  /* ---------- 1. features ---------- */
  function estimateTuning(x){
    const p = plan(N_C), n = N_C, A = new Float64Array(n / 2 + 1), B = new Float64Array(n / 2 + 1);
    const frames = Math.floor((x.length - n) / HOP_C);
    const every = Math.max(1, Math.floor(frames / 700)) * 2;
    let cx = 0, cy = 0;
    const lo = Math.ceil(100 * n / SR), hi = Math.floor(1500 * n / SR);
    const one = S => {
      let mx = 0; for(let k = lo; k <= hi; k++) if(S[k] > mx) mx = S[k];
      if(mx <= 0) return;
      for(let k = lo + 1; k < hi; k++){
        const v = S[k];
        if(v < 0.15 * mx || v <= S[k - 1] || v < S[k + 1]) continue;
        const a = S[k - 1], c = S[k + 1], d = 0.5 * (a - c) / (a - 2 * v + c || 1e-12);
        const f = (k + d) * SR / n, m = 69 + 12 * Math.log2(f / 440), dev = m - Math.round(m);
        const w = v / mx;
        cx += w * Math.cos(2 * Math.PI * dev); cy += w * Math.sin(2 * Math.PI * dev);
      }
    };
    for(let f = 0; f + every / 2 < frames; f += every){ mags(x, f * HOP_C, (f + every / 2) * HOP_C, p, A, B); one(A); one(B); }
    if(!cx && !cy) return 0;
    return Math.round(100 * Math.atan2(cy, cx) / (2 * Math.PI) * 10) / 10;
  }

  function chromaMap(tuning){
    const bins = [], pcs = [], ws = [], bass = [];
    for(let k = 1; k <= N_C / 2; k++){
      const f = k * SR / N_C;
      if(f < 38 || f > 2100) continue;
      const m = 69 + 12 * Math.log2(f / 440) - tuning / 100, r = Math.round(m), d = m - r;
      const w = Math.pow(Math.cos(Math.PI * d), 2);
      if(w < 0.05) continue;
      if(f <= 230){ bins.push(k); pcs.push(((r % 12) + 12) % 12); ws.push(w); bass.push(1); }
      if(f >= 170){ bins.push(k); pcs.push(((r % 12) + 12) % 12); ws.push(w); bass.push(0); }
    }
    return {bins: Int32Array.from(bins), pcs: Int8Array.from(pcs), ws: Float64Array.from(ws), bass: Uint8Array.from(bass)};
  }

  function analyse(pcmIn, srIn, opts = {}){
    const progress = opts.progress || (() => {});
    const t0 = now();
    progress('Analysing recording…', 0.02);
    let x = toEngineRate(pcmIn, srIn);
    /* level: the loud parts at about one, so the compressions below mean the same thing on any recording */
    let pk = 0; for(let i = 0; i < x.length; i += 7){ const v = Math.abs(x[i]); if(v > pk) pk = v; }
    if(pk > 0 && Math.abs(pk - 1) > 0.05){ const y = new Float32Array(x.length); for(let i = 0; i < x.length; i++) y[i] = x[i] / pk; x = y; }
    const duration = x.length / SR;

    /* onsets */
    const pf = plan(N_F), nb = N_F / 2 + 1, top = Math.floor(5000 * N_F / SR);
    const nF = Math.max(1, Math.floor(x.length / HOP_F));
    const flux = new Float32Array(nF), fluxHi = new Float32Array(nF);
    const hiLo = Math.floor(2500 * N_F / SR);
    let prev = new Float64Array(nb), A = new Float64Array(nb), B = new Float64Array(nb);
    const logs = (S, out) => { for(let k = 1; k <= top; k++) out[k] = Math.log1p(20 * S[k]); };
    const LA = new Float64Array(nb), LB = new Float64Array(nb);
    /* the fine spectrum, kept for placing individual notes' attacks */
    const KB = Math.min(top, Math.floor(2600 * N_F / SR)), spec = new Float32Array(nF * (KB + 1));
    for(let f = 0; f < nF; f += 2){
      mags(x, f * HOP_F - N_F / 2, (f + 1) * HOP_F - N_F / 2, pf, A, f + 1 < nF ? B : null);
      logs(A, LA);
      let s = 0, h = 0; for(let k = 1; k <= top; k++){ const d = LA[k] - prev[k]; if(d > 0){ s += d; if(k >= hiLo) h += d; } }
      flux[f] = s; fluxHi[f] = h; prev.set(LA);
      for(let k = 0; k <= KB; k++) spec[f * (KB + 1) + k] = LA[k];
      if(f + 1 < nF){ logs(B, LB); s = 0; h = 0; for(let k = 1; k <= top; k++){ const d = LB[k] - prev[k]; if(d > 0){ s += d; if(k >= hiLo) h += d; } } flux[f + 1] = s; fluxHi[f + 1] = h; prev.set(LB);
        for(let k = 0; k <= KB; k++) spec[(f + 1) * (KB + 1) + k] = LB[k]; }
      if((f & 2047) === 0) progress('Analysing recording…', 0.02 + 0.18 * f / nF);
    }
    flux[0] = 0; fluxHi[0] = 0;
    const onset = detrend(flux, Math.round(1.0 * SR / HOP_F));
    const onsetHi = detrend(fluxHi, Math.round(1.0 * SR / HOP_F));

    /* tuning, then chroma */
    progress('Analysing recording… tuning', 0.22);
    const tuningCents = estimateTuning(x);
    const cm = chromaMap(tuningCents);
    const pc = plan(N_C), nC = Math.max(1, Math.floor(x.length / HOP_C));
    const chroma = new Float32Array(nC * 24), energy = new Float32Array(nC);
    const CA = new Float64Array(N_C / 2 + 1), CB = new Float64Array(N_C / 2 + 1);
    /* whitened: each bin's log magnitude above the average of the bins
       round it, so a drum's broadband noise lifts nothing and only
       tonal peaks vote */
    const nbC = N_C / 2 + 1, Lg = new Float64Array(nbC), Wh = new Float64Array(nbC), cs = new Float64Array(nbC + 1);
    const kTop = Math.min(nbC - 1, Math.ceil(2200 * N_C / SR) + 12);
    const fold = (S, f) => {
      const o = f * 24;
      let e = 0;
      for(let k = 0; k <= kTop; k++){ Lg[k] = Math.log1p(8 * S[k]); cs[k + 1] = cs[k] + Lg[k]; }
      for(let k = 1; k < kTop; k++){
        const w = k < 40 ? 6 : 10, lo = Math.max(0, k - w), hi = Math.min(kTop, k + w);
        const m = (cs[hi + 1] - cs[lo]) / (hi + 1 - lo);
        Wh[k] = Lg[k] > m ? Lg[k] - m : 0;
      }
      for(let i = 0; i < cm.bins.length; i++){
        const v = Wh[cm.bins[i]] * cm.ws[i];
        chroma[o + (cm.bass[i] ? 12 : 0) + cm.pcs[i]] += v;
        if(!cm.bass[i]) e += v;
      }
      energy[f] = e;
    };
    for(let f = 0; f < nC; f += 2){
      mags(x, f * HOP_C - N_C / 2, (f + 1) * HOP_C - N_C / 2, pc, CA, f + 1 < nC ? CB : null);
      fold(CA, f); if(f + 1 < nC) fold(CB, f + 1);
      if((f & 511) === 0) progress('Analysing recording… harmony', 0.25 + 0.35 * f / nC);
    }
    /* each frame's treble and bass to unit length (silence stays silent) */
    let emed = median(Array.from(energy).filter(v => v > 0)) || 1;
    for(let f = 0; f < nC; f++) normChroma(chroma, f * 24, energy[f] / emed);

    /* Onset chroma: which pitch classes are newly struck in each 23 ms
       frame — the rise of the fine spectrum, bin by bin, folded to pitch
       classes at the recording's tuning; normalised by the loudest attack
       within a second and a half, so a soft passage's attacks count as
       much as a loud one's. A held (or pedalled) note does not rise, so it
       does not appear: this is what tells a new bar's first note from the
       old bar still ringing. */
    const oc = new Float32Array(nF * 12);
    {
      const KB = spec.length / nF, kmin = Math.ceil(170 * N_F / SR);
      const pcB = new Int8Array(KB), wB = new Float32Array(KB);
      for(let k = kmin; k < KB; k++){ const m = 69 + 12 * Math.log2(k * SR / N_F / 440) - tuningCents / 100, r = Math.round(m);
        pcB[k] = ((r % 12) + 12) % 12; wB[k] = Math.pow(Math.cos(Math.PI * (m - r)), 2); }
      const norm = new Float32Array(nF);
      for(let f = 1; f < nF; f++){
        const o = f * KB, q = (f - 1) * KB;
        for(let k = kmin; k < KB; k++){ const d = spec[o + k] - spec[q + k]; if(d > 0) oc[f * 12 + pcB[k]] += d * wB[k]; }
        let s2 = 0; for(let c = 0; c < 12; c++) s2 += oc[f * 12 + c] * oc[f * 12 + c]; norm[f] = Math.sqrt(s2);
      }
      const W = Math.round(1.5 * SR / HOP_F);
      /* running maximum of the norm over ±1.5 s (a monotone deque) */
      const lm = new Float32Array(nF), dq = [];
      for(let f = 0, g = 0; f < nF; f++){
        while(g < nF && g <= f + W){ while(dq.length && norm[dq[dq.length - 1]] <= norm[g]) dq.pop(); dq.push(g); g++; }
        while(dq[0] < f - W) dq.shift();
        lm[f] = norm[dq[0]];
      }
      for(let f = 0; f < nF; f++){ const d = lm[f] > 1e-6 ? 1 / lm[f] : 0; for(let c = 0; c < 12; c++) oc[f * 12 + c] *= d; }
    }

    progress('Finding the beat…', 0.62);
    const beat = trackBeats(onset, opts.tempoHint || 120);
    return {version: VERSION, sr: SR, duration, tuningCents, spec, specBins: KB + 1, specN: N_F, oc,
      onset, onsetHi, onsetHop: HOP_F / SR, chroma, energy, chromaHop: HOP_C / SR, beat, analyseMs: Math.round(now() - t0)};
  }
  function normChroma(c, o, level){
    /* treble and bass each to unit length, then scaled down where the
       frame is nearly silent so it cannot vote */
    const damp = Math.min(1, level / 0.15);
    for(const base of [o, o + 12]){
      let s = 0; for(let k = 0; k < 12; k++) s += c[base + k] * c[base + k];
      s = Math.sqrt(s);
      if(s > 1e-9) for(let k = 0; k < 12; k++) c[base + k] = c[base + k] / s * damp;
    }
  }
  function detrend(a, w){
    const n = a.length, out = new Float32Array(n);
    let acc = 0; const q = [];
    const cs = new Float64Array(n + 1); for(let i = 0; i < n; i++) cs[i + 1] = cs[i] + a[i];
    for(let i = 0; i < n; i++){
      const lo = Math.max(0, i - w), hi = Math.min(n, i + w + 1);
      const m = (cs[hi] - cs[lo]) / (hi - lo);
      out[i] = Math.max(0, a[i] - m);
    }
    let s = 0, s2 = 0; for(let i = 0; i < n; i++){ s += out[i]; s2 += out[i] * out[i]; }
    const sd = Math.sqrt(Math.max(1e-12, s2 / n - (s / n) * (s / n)));
    for(let i = 0; i < n; i++) out[i] /= sd;
    return out;
  }
  function median(a){ if(!a.length) return 0; const b = Float64Array.from(a).sort(); return b[b.length >> 1]; }
  function quantile(a, q){ if(!a.length) return 0; const b = Float64Array.from(a).sort(); return b[Math.min(b.length - 1, Math.max(0, Math.floor(q * (b.length - 1))))]; }

  /* ---------- 2. the beat ---------- */
  function tempoCandidates(o, hint){
    const fps = SR / HOP_F, lmin = Math.floor(fps * 60 / 320), lmax = Math.ceil(fps * 60 / 38);
    const n = o.length, ac = new Float64Array(lmax + 2);
    for(let l = lmin - 1; l <= lmax + 1; l++){
      let s = 0; for(let i = 0; i + l < n; i++) s += o[i] * o[i + l];
      ac[l] = s / (n - l);
    }
    const out = [];
    for(let l = lmin; l <= lmax; l++){
      if(ac[l] < ac[l - 1] || ac[l] < ac[l + 1]) continue;
      const d = 0.5 * (ac[l - 1] - ac[l + 1]) / (ac[l - 1] - 2 * ac[l] + ac[l + 1] || 1e-12);
      const lag = l + d, bpm = 60 * fps / lag;
      /* a peak also backed by its double: the pulse, not a subdivision */
      const l2 = Math.round(2 * lag), dbl = l2 <= lmax + 1 ? ac[l2] : 0;
      const prior = Math.exp(-0.5 * Math.pow(Math.log2(bpm / hint) / 0.9, 2));
      out.push({bpm, lag, score: (ac[l] + 0.5 * dbl) * prior, raw: ac[l]});
    }
    out.sort((a, b) => b.score - a.score);
    return out;
  }
  function trackBeats(o, hint, fixedBpm){
    const cands = tempoCandidates(o, hint);
    if(!cands.length && !fixedBpm) return {times: [], bpm: hint, confidence: 0, candidates: []};
    const P = fixedBpm ? 60 * SR / HOP_F / fixedBpm : cands[0].lag, n = o.length;
    /* smoothed onsets */
    const sg = Math.max(1, P / 32), hw = Math.ceil(3 * sg), ker = [];
    for(let k = -hw; k <= hw; k++) ker.push(Math.exp(-0.5 * (k / sg) * (k / sg)));
    const ls = new Float64Array(n);
    for(let i = 0; i < n; i++){ let s = 0; for(let k = -hw; k <= hw; k++){ const j = i + k; if(j >= 0 && j < n) s += o[j] * ker[k + hw]; } ls[i] = s; }
    const cum = new Float64Array(n), back = new Int32Array(n).fill(-1), tight = 100;
    const lo = Math.round(P / 2), hi = Math.round(2 * P);
    for(let i = 0; i < n; i++){
      let best = -Infinity, bj = -1;
      for(let l = lo; l <= hi; l++){
        const j = i - l; if(j < 0) break;
        const v = cum[j] - tight * Math.pow(Math.log(l / P), 2);
        if(v > best){ best = v; bj = j; }
      }
      cum[i] = ls[i] + (bj >= 0 && best > 0 ? best : 0);
      back[i] = bj >= 0 && best > 0 ? bj : -1;
    }
    /* backtrack from the best place in the last beat */
    let e = n - 1, bv = -Infinity;
    for(let i = Math.max(0, n - Math.ceil(P)); i < n; i++) if(cum[i] > bv){ bv = cum[i]; e = i; }
    const idx = [];
    while(e >= 0){ idx.push(e); e = back[e]; }
    idx.reverse();
    const hop = HOP_F / SR;
    const times = idx.map(i => i * hop);
    /* how sure: onsets on the beats against onsets anywhere, and evenness */
    let on = 0; idx.forEach(i => on += ls[i]); on /= Math.max(1, idx.length);
    let all = 0; for(let i = 0; i < n; i++) all += ls[i]; all /= n;
    const ibi = []; for(let i = 1; i < idx.length; i++) ibi.push(idx[i] - idx[i - 1]);
    const mi = ibi.reduce((a, b) => a + b, 0) / Math.max(1, ibi.length);
    const cv = Math.sqrt(ibi.reduce((a, b) => a + (b - mi) * (b - mi), 0) / Math.max(1, ibi.length)) / (mi || 1);
    const strength = Math.max(0, Math.min(1, (on / (all || 1e-9) - 1.2) / 1.6));
    const even = Math.max(0, Math.min(1, 1 - (cv - 0.04) / 0.14));
    /* each beat's own support: its onset against the median around it */
    const local = idx.map(i => ls[i]);
    const med = median(local) || 1;
    const support = Float32Array.from(local.map(v => Math.max(0, Math.min(1, v / (med * 1.2)))));
    return {times, bpm: 60 / (P * hop), confidence: Math.round(strength * even * 1000) / 1000, strength, even,
      support, candidates: cands.slice(0, 6).map(c => ({bpm: Math.round(c.bpm * 10) / 10, score: c.score}))};
  }

  /* ---------- 3. the chart as sound ---------- */
  const EXT = [[/b9/, 1, 0.3], [/#9/, 3, 0.3], [/(^|[^b#])9/, 2, 0.25], [/#11|#4/, 6, 0.3], [/(^|[^#])11/, 5, 0.2], [/b13/, 8, 0.3], [/(^|[^b])13/, 9, 0.25]];
  function chordTemplate(ch, role){
    const v = new Float64Array(24);
    if(!ch || ch.root == null) { for(let k = 0; k < 24; k++) v[k] = 1; return unit(v); }
    const q = String(ch.q || ''), Q = ch.quality || 'maj', r = ch.root;
    const add = (iv, w) => { const k = (r + iv) % 12; v[k] = Math.max(v[k], w); };
    add(0, 1);
    const third = Q === 'min' || Q === 'hd' || Q === 'dim' ? 3 : Q === 'sus' ? 5 : 4;
    add(third, 0.85);
    const fifth = Q === 'hd' || Q === 'dim' || /b5/.test(q) ? 6 : Q === 'aug' || /#5|\+/.test(q) ? 8 : 7;
    add(fifth, 0.4);
    let seventh = null;
    if(Q === 'dim') seventh = 9;
    else if(Q === 'dom' || Q === 'hd' || Q === 'sus' || (Q === 'aug' && /7/.test(q))) seventh = 10;
    else if(Q === 'maj') seventh = /^(6|69)/.test(q) ? 9 : /M7|maj|Δ|\^|M9/.test(q) ? 11 : null;
    else if(Q === 'min') seventh = /\(?(M7|maj7)\)?/.test(q) ? 11 : /^m6|^mi6|^-6/.test(q) ? 9 : /7|9|11/.test(q) ? 10 : null;
    else if(/7/.test(q)) seventh = 10;
    if(seventh != null) add(seventh, 0.85);
    EXT.forEach(([re, iv, w]) => { if(re.test(q)) add(iv, w); });
    if(/alt/.test(q)){ add(1, 0.25); add(3, 0.25); add(8, 0.25); }
    /* what an instrument actually sounds: each tone's third and fifth
       harmonics land a twelfth and two octaves and a third above it */
    const pure = Float64Array.from(v.subarray(0, 12));
    for(let k = 0; k < 12; k++) if(pure[k]){ v[(k + 7) % 12] += 0.22 * pure[k]; v[(k + 4) % 12] += 0.1 * pure[k]; }
    /* The bass: where the chord changes it plays the root (or the slash
       note); on the downbeat of a bar it usually still does; on the beats
       between, a walking line moves through the chord. So the bass
       template depends on the beat, and a path a beat out of phase puts
       the walk where the root should be. */
    const b = ch.bass != null ? ch.bass : r;
    const R0 = role === 'change' ? 1 : role === 'downbeat' ? 0.85 : 0.7, spread = role === 'change' ? 0.25 : role === 'downbeat' ? 0.38 : 0.45;
    v[12 + b] = R0;
    v[12 + (r + fifth) % 12] = Math.max(v[12 + (r + fifth) % 12], spread);
    v[12 + (r + third) % 12] = Math.max(v[12 + (r + third) % 12], spread * 0.9);
    if(seventh != null) v[12 + (r + seventh) % 12] = Math.max(v[12 + (r + seventh) % 12], spread * 0.7);
    if(b !== r) v[12 + r] = Math.max(v[12 + r], spread);
    const pb = Float64Array.from(v.subarray(12, 24));
    for(let k = 0; k < 12; k++) if(pb[k]){ v[12 + (k + 7) % 12] += 0.3 * pb[k]; v[12 + (k + 4) % 12] += 0.12 * pb[k]; }
    for(let k = 12; k < 24; k++) v[k] *= W_BASS;
    return unit(v);
  }
  /* a template made from the score's own notes, with the overtones an
     instrument adds (the twelfth and the seventeenth) */
  function noteTemplate(t){
    const v = Float64Array.from(t);
    const tre = v.slice(0, 12), bas = v.slice(12, 24);
    for(let k = 0; k < 12; k++){ v[(k + 7) % 12] += 0.22 * tre[k]; v[(k + 4) % 12] += 0.1 * tre[k]; v[12 + (k + 7) % 12] += 0.3 * bas[k]; v[12 + (k + 4) % 12] += 0.12 * bas[k]; }
    return unit(v);
  }
  function unit(v){ let s = 0; for(let k = 0; k < v.length; k++) s += v[k] * v[k]; s = Math.sqrt(s) || 1; for(let k = 0; k < v.length; k++) v[k] /= s; return v; }
  /* per beat of one chorus: a template, and whether a chord changes there */
  function scoreTemplates(score){
    const beats = [];
    let last = null;
    (score.bars || []).forEach((b, m) => {
      const n = Math.max(1, Math.round(b.beats || score.beats || 4));
      for(let k = 0; k < n; k++){
        const c = (b.chords || []).find(x => k >= x.at - 1e-9 && k < x.at + x.beats - 1e-9) || (b.pcs ? b : null) || last;
        beats.push({measure: m + 1, beat: k + 1, chord: c, fermata: !!b.fermata, on: c && c.on ? c.on : null, ons: c && c.ons ? c.ons : null});
        if(c) last = c;
      }
    });
    /* bars before the first chord take the first chord */
    const first = beats.find(x => x.chord);
    beats.forEach(x => { if(!x.chord && first) x.chord = first.chord; });
    const L = beats.length, T = new Float64Array(L * 24);
    const change = new Uint8Array(L);
    beats.forEach((x, j) => { const pj = beats[(j - 1 + L) % L]; change[j] = !pj || pj.chord !== x.chord && keyOf(pj.chord) !== keyOf(x.chord) ? 1 : 0; });
    beats.forEach((x, j) => {
      const role = change[j] ? 'change' : x.beat === 1 ? 'downbeat' : 'walk';
      const v = x.chord && x.chord.template ? noteTemplate(x.chord.template) : chordTemplate(x.chord, role);
      T.set(v, j * 24);
    });
    const barStart = []; let acc = 0;
    (score.bars || []).forEach(b => { barStart.push(acc); acc += Math.max(1, Math.round(b.beats || score.beats || 4)); });
    return {beats, L, T, change, barStart, bars: (score.bars || []).length};
  }
  const keyOf = c => c ? (c.template ? 't' + c.template.join(',') : c.root + ':' + c.quality + ':' + (c.q || '') + ':' + (c.bass == null ? '' : c.bass)) : '';
  /* a template rotated by t semitones: the chart as heard t semitones up */
  function rotated(T, L, t){
    const R = new Float64Array(L * 24), s = ((t % 12) + 12) % 12;
    for(let j = 0; j < L; j++) for(let k = 0; k < 12; k++){ R[j * 24 + (k + s) % 12] = T[j * 24 + k]; R[j * 24 + 12 + (k + s) % 12] = T[j * 24 + 12 + k]; }
    return R;
  }

  /* ---------- 4. the key ---------- */
  function keyCandidates(feat, tpl){
    const {chroma, energy} = feat, n = energy.length;
    const m = new Float64Array(24);
    for(let f = 0; f < n; f++) for(let k = 0; k < 24; k++) m[k] += chroma[f * 24 + k];
    const t = new Float64Array(24);
    for(let j = 0; j < tpl.L; j++) for(let k = 0; k < 24; k++) t[k] += tpl.T[j * 24 + k];
    const zc = a => { const o = new Float64Array(12); let s = 0; for(let k = 0; k < 12; k++) s += a[k]; for(let k = 0; k < 12; k++) o[k] = a[k] - s / 12; return o; };
    const mt = zc(m), mb = zc(m.subarray(12)), tt = zc(t), tb = zc(t.subarray(12));
    const out = [];
    for(let s = 0; s < 12; s++){
      let a = 0, b = 0;
      for(let k = 0; k < 12; k++){ a += mt[(k + s) % 12] * tt[k]; b += mb[(k + s) % 12] * tb[k]; }
      out.push({t: s > 6 ? s - 12 : s, score: a + 0.7 * b});
    }
    return out.sort((x, y) => y.score - x.score);
  }

  /* ---------- 5. structure and coarse alignment ---------- */
  function coarseFrames(feat){
    const {chroma, energy} = feat, n = Math.floor(energy.length / COARSE);
    const X = new Float64Array(n * 24), E = new Float64Array(n);
    for(let i = 0; i < n; i++){
      for(let c = 0; c < COARSE; c++){ const f = i * COARSE + c; for(let k = 0; k < 24; k++) X[i * 24 + k] += chroma[f * 24 + k]; E[i] += energy[f]; }
      E[i] /= COARSE;
    }
    /* a little smoothing in time, so one passing note in a solo does not
       outvote the chord round it */
    const Y = new Float64Array(n * 24);
    for(let i = 0; i < n; i++) for(let k = 0; k < 24; k++)
      Y[i * 24 + k] = 0.5 * X[i * 24 + k] + 0.25 * X[Math.max(0, i - 1) * 24 + k] + 0.25 * X[Math.min(n - 1, i + 1) * 24 + k];
    return {X: Y, E, n, hop: feat.chromaHop * COARSE};
  }
  /* similarity of every frame to every chart beat: n × L */
  function simMatrix(X, n, T, L){
    const S = new Float32Array(n * L);
    for(let i = 0; i < n; i++){
      const xo = i * 24;
      let xn = 0; for(let k = 0; k < 24; k++) xn += X[xo + k] * X[xo + k];
      xn = Math.sqrt(xn) || 1;
      for(let j = 0; j < L; j++){
        const to = j * 24; let s = 0;
        for(let k = 0; k < 24; k++) s += X[xo + k] * T[to + k];
        S[i * L + j] = s / xn;
      }
    }
    return S;
  }
  /* The warping. Frames i against states s of the chorus drawn out at F
     states a beat; a state's beat is floor(s / F). Steps: s → s+1 (in
     time), s → s (slower), s → s+2 (faster); s = S-1 → 0 is the next
     chorus. U0 before the first chorus, U1 after the last. `band`, when
     given, keeps the path within that many frames of a first path. */
  function warp(Sm, n, L, F, change, barStartBeats, opt){
    const S = Math.max(L, Math.round(L * F));
    const beatOf = new Int32Array(S);
    for(let s = 0; s < S; s++) beatOf[s] = Math.min(L - 1, Math.floor(s * L / S));
    const cost = new Float64Array(S), ucost = opt.u;
    const pStay = opt.pStay, pSkip = opt.pSkip, cyclic = opt.cyclic !== false;
    const onsetT = opt.onset ? opt.onset(S) : null;
    const isBarStart = new Uint8Array(S), isBarEnd = new Uint8Array(S);
    barStartBeats.forEach(b => { const s = Math.round(b * S / L) % S; isBarStart[s] = 1; isBarEnd[(s - 1 + S) % S] = 1; });
    const entryPen = new Float64Array(S).fill(Infinity);
    entryPen[0] = 0;
    (opt.sectionStarts || []).forEach(b => { const s = Math.round(b * S / L) % S; if(s) entryPen[s] = opt.pEnterMid; });
    let D = new Float64Array(S).fill(Infinity), Dn = new Float64Array(S);
    const bp = new Uint8Array(n * S);            /* 0 stay, 1 step, 2 skip, 3 from U0 */
    const u1from = new Int32Array(n).fill(-2);   /* -1: stayed in U1; s: came from state s */
    let U0 = 0, U1 = Infinity;
    const band = opt.band;
    for(let i = 0; i < n; i++){
      const row = i * L;
      const lo = band ? band.lo[i] : 0, hi = band ? band.hi[i] : S - 1;
      /* cost of each state at this frame */
      for(let s = 0; s < S; s++) cost[s] = Sm[row + beatOf[s]];
      if(onsetT){
        /* attacks where the score has them; a strong attack where it has none costs a little */
        const o = i * 12; let an = 0;
        for(let c = 0; c < 12; c++) an += onsetT.OC[o + c] * onsetT.OC[o + c];
        an = Math.sqrt(an);
        for(let s = 0; s < S; s++){
          if(onsetT.has[s]){ let d = 0; const q = s * 12; for(let c = 0; c < 12; c++) d += onsetT.OC[o + c] * onsetT.OT[q + c]; cost[s] -= onsetT.lambda * d; }
          else cost[s] += onsetT.lambda * onsetT.mu * an;
        }
      }
      let bestExit = Infinity, exitS = -1;
      for(let s = 0; s < S; s++){
        if(band && (lo < 0 || !inBand(s, lo, hi, S))){ Dn[s] = Infinity; continue; }
        const s1 = s === 0 ? (cyclic ? S - 1 : -1) : s - 1, s2 = s <= 1 ? (cyclic ? S - 2 + s : -1) : s - 2;
        let b = D[s] + pStay, k = 0;
        const a1 = s1 >= 0 ? D[s1] : Infinity; if(a1 < b){ b = a1; k = 1; }
        const a2 = s2 >= 0 ? D[s2] + pSkip : Infinity; if(a2 < b){ b = a2; k = 2; }
        const e = U0 + entryPen[s]; if(e < b){ b = e; k = 3; }
        Dn[s] = b + cost[s];
        bp[i * S + s] = k;
      }
      /* leave for the ending: after the last state of a chorus, or (at a
         price) at the end of any bar — a fade-out */
      for(let s = 0; s < S; s++){
        if(!isBarEnd[s]) continue;
        const v = D[s] + (s === S - 1 ? 0 : opt.pExitMid);
        if(v < bestExit){ bestExit = v; exitS = s; }
      }
      const stay = U1;
      if(bestExit < stay){ U1 = bestExit + ucost; u1from[i] = exitS; } else { U1 = stay + ucost; u1from[i] = -1; }
      U0 += ucost;
      const t = D; D = Dn; Dn = t;
    }
    /* the end: in U1, or in a state at the end of a chorus / bar */
    let endS = -1, endV = U1;
    for(let s = 0; s < S; s++){ const v = D[s] + (s === S - 1 || isBarEnd[s] ? (s === S - 1 ? 0 : opt.pExitMid) : Infinity); if(v < endV){ endV = v; endS = s; } }
    /* back along the path */
    const path = new Int32Array(n);   /* state, -1 = U0, -2 = U1 */
    let s = endS, inU1 = endS < 0;
    for(let i = n - 1; i >= 0; i--){
      if(inU1){
        path[i] = -2;
        const f = u1from[i];
        if(f >= 0){ s = f; inU1 = false; }
        continue;
      }
      if(s === -1){ path[i] = -1; continue; }
      path[i] = s;
      const k = bp[i * S + s];
      if(k === 3){ s = -1; }
      else if(k === 1) s = s === 0 ? S - 1 : s - 1;
      else if(k === 2) s = s <= 1 ? S - 2 + s : s - 2;
    }
    return {path, S, total: endV, F: S / L};
  }
  /* Similarity → cost, frame by frame: how many standard deviations this
     place in the chart fits better than the chart on average. A frame
     that fits everything equally (drums alone, silence) costs nothing
     anywhere and so decides nothing; a frame that clearly belongs to one
     chord pulls the path hard. Every frame is one step of the path, so
     negative costs favour no path length over another. */
  function zCost(Sm, n, L){
    const C = new Float32Array(n * L);
    for(let i = 0; i < n; i++){
      let s = 0, s2 = 0; const o = i * L;
      for(let j = 0; j < L; j++){ const v = Sm[o + j]; s += v; s2 += v * v; }
      const mu = s / L, sd = Math.sqrt(Math.max(0, s2 / L - mu * mu));
      if(sd < 0.015) continue;
      for(let j = 0; j < L; j++){ const z = (Sm[o + j] - mu) / sd; C[o + j] = -(z > 3 ? 3 : z < -3 ? -3 : z); }
    }
    return C;
  }
  function inBand(s, lo, hi, S){ return lo <= hi ? s >= lo && s <= hi : s >= lo || s <= hi; }

  /* the path as times: for every chorus, the time each beat starts */
  function pathToBeats(path, S, L, hop){
    /* hop: seconds a unit, or the time of a (fractional) unit */
    const at = typeof hop === 'function' ? hop : x => x * hop;
    const choruses = [];
    let cur = null, prevS = null, u0end = 0, u1start = null;
    for(let i = 0; i < path.length; i++){
      const s = path[i];
      if(s === -1){ u0end = at(i + 1); continue; }
      if(s === -2){ if(u1start == null) u1start = at(i); continue; }
      if(cur == null || (prevS != null && s < prevS - S / 2)) { cur = {frames: []}; choruses.push(cur); }
      cur.frames.push([i, s]);
      prevS = s;
    }
    const out = choruses.map(ch => {
      const t = new Float64Array(L).fill(NaN);
      /* the beat j starts where the state first reaches j·S/L; within a
         frame, where it would by linear progress */
      const fr = ch.frames;
      for(let q = 0; q < fr.length; q++){
        const [i, s] = fr[q];
        const sNext = q + 1 < fr.length ? fr[q + 1][1] + (fr[q + 1][1] < s ? S : 0) : s + 1;
        const j0 = Math.ceil(s * L / S - 1e-9), j1 = Math.ceil(sNext * L / S - 1e-9);
        for(let j = j0; j < j1 && j < L; j++) if(isNaN(t[j])){
          const frac = sNext > s ? (j * S / L - s) / (sNext - s) : 0;
          t[j] = at(i + Math.max(0, Math.min(1, frac)));
        }
      }
      const firstS = fr[0][1], lastS = fr[fr.length - 1][1];
      let steps = 0; for(let q = 1; q < fr.length; q++){ const d = fr[q][1] - fr[q - 1][1]; steps += d < 0 ? d + S : d; }
      return {t, start: at(fr[0][0]), end: at(fr[fr.length - 1][0] + 1), complete: firstS < S * 0.1 && lastS > S * 0.9, firstS, lastS,
        cover: Math.min(1, (steps + 1) / S)};
    });
    return {choruses: out, introEnd: u0end, outroStart: u1start};
  }

  /* ---------- 6. fine alignment ---------- */
  function nearest(arr, x){
    let lo = 0, hi = arr.length - 1;
    if(hi < 0) return -1;
    while(hi - lo > 1){ const m = (lo + hi) >> 1; if(arr[m] <= x) lo = m; else hi = m; }
    return Math.abs(arr[lo] - x) <= Math.abs(arr[hi] - x) ? lo : hi;
  }
  function snapToGrid(t, grid, period, tol){
    const out = Float64Array.from(t), hit = new Uint8Array(t.length);
    for(let j = 0; j < t.length; j++){
      if(isNaN(t[j])) continue;
      const k = nearest(grid, t[j]);
      if(k >= 0 && Math.abs(grid[k] - t[j]) <= tol * period){ out[j] = grid[k]; hit[j] = 1; }
    }
    /* two beats on one grid point: keep the nearer */
    for(let j = 1; j < t.length; j++) if(hit[j] && hit[j - 1] && out[j] <= out[j - 1] + 1e-6){
      if(Math.abs(t[j] - out[j]) < Math.abs(t[j - 1] - out[j - 1])) { hit[j - 1] = 0; out[j - 1] = t[j - 1]; } else { hit[j] = 0; out[j] = t[j]; }
    }
    return {t: out, hit};
  }
  function onsetSnap(t, onset, hop, win, thresh){
    const out = Float64Array.from(t), w = Math.round(win / hop);
    for(let j = 0; j < t.length; j++){
      if(isNaN(t[j])) continue;
      const c = Math.round(t[j] / hop);
      let best = -1, bv = thresh;
      for(let k = c - w; k <= c + w; k++){ if(k < 1 || k >= onset.length - 1) continue;
        const v = onset[k]; if(v > bv && v >= onset[k - 1] && v >= onset[k + 1]){ bv = v; best = k; } }
      if(best >= 0) out[j] = best * hop;
    }
    return out;
  }
  /* fill gaps (NaN) by linear interpolation in beats, and carry the
     edge tempo out past the first and last known beat */
  function fillLinear(t){
    const n = t.length, known = [];
    for(let j = 0; j < n; j++) if(!isNaN(t[j])) known.push(j);
    if(!known.length) return t;
    if(known.length === 1){ return t; }
    for(let q = 0; q + 1 < known.length; q++){
      const a = known[q], b = known[q + 1];
      for(let j = a + 1; j < b; j++) t[j] = t[a] + (t[b] - t[a]) * (j - a) / (b - a);
    }
    const a0 = known[0], a1 = known[1], z0 = known[known.length - 2], z1 = known[known.length - 1];
    const sp0 = (t[a1] - t[a0]) / (a1 - a0), sp1 = (t[z1] - t[z0]) / (z1 - z0);
    for(let j = 0; j < a0; j++) t[j] = t[a0] - (a0 - j) * sp0;
    for(let j = z1 + 1; j < n; j++) t[j] = t[z1] + (j - z1) * sp1;
    return t;
  }

  /* ---------- the whole alignment ---------- */
  function align(feat, score, opts = {}){
    const progress = opts.progress || (() => {});
    const t0 = now();
    const tpl = scoreTemplates(score);
    const L = tpl.L;
    if(!L) throw new Error('The chart has no bars to align.');
    const cf = coarseFrames(feat);
    const beat = feat.beat;
    const sectionStarts = (score.sections || []).slice(1).map(s => tpl.barStart[s.start - 1]).filter(x => x != null);

    progress('Detecting key…', 0.66);
    let keys = keyCandidates(feat, tpl);
    if(opts.transposition != null) keys = [{t: opts.transposition, score: 1}];
    const hint = score.tempoHint || 120;
    /* tempi to try: the tracked tempo and its octave neighbours, kept
       within reach of the tune's own */
    const tr = beat.bpm || hint;
    let tempi = [tr, tr * 2, tr / 2].filter(b => b >= 40 && b <= 340 && Math.abs(Math.log2(b / hint)) <= 1.2);
    if(!tempi.length) tempi = [hint];
    /* a piece played once through: its average tempo is its length in
       quarters over the time the music sounds — sturdier than any beat
       tracker in rubato */
    const single = !!score.singlePass;
    let span = null;
    if(single){ span = musicSpan(feat); tempi = [60 * L / Math.max(1, span.end - span.start)]; }
    const tries = [], tplBase = tpl;
    const ons = hasOnsets(tpl) && feat.oc && opts.onsetW !== 0;
    const ocC = ons ? pooledOC(feat, cf.hop, cf.n) : null;
    const runOne = (tShift, bpm, tplX) => {
      const tpl = tplX || tplBase, L = tpl.L;
      const T = rotated(tpl.T, L, tShift);
      const Sm = simMatrix(cf.X, cf.n, T, L);
      const F = (60 / bpm) / cf.hop;
      const u = 0.1;
      const k = opts.coarsePen != null ? opts.coarsePen : 2.5;
      const onset = ons ? (S => Object.assign({OC: ocC, lambda: opts.onsetW != null ? opts.onsetW : 1.2, mu: 0.35}, onsetStates(tpl, S, tShift))) : null;
      const w = warp(zCost(Sm, cf.n, L), cf.n, L, F, tpl.change, tpl.barStart, {u, pStay: 0.15 * k, pSkip: 0.3 * k, pEnterMid: 4, pExitMid: single ? 12 : 4, sectionStarts, cyclic: !single, onset});
      /* a tempo the beat does not support has to fit the harmony that much
         better: the further from the tracked beat, and the surer the
         tracker, the more it costs */
      const prior = (opts.tempoPrior != null ? opts.tempoPrior : 0) * beat.confidence * Math.abs(Math.log2(bpm / (beat.bpm || bpm)));
      return {tShift, bpm, F, Sm, T, u, w, total: w.total / cf.n + prior};
    };
    progress('Finding the choruses…', 0.7);
    keys.slice(0, 3).forEach(k => tries.push(runOne(k.t, tempi[0])));
    tries.sort((a, b) => a.total - b.total);
    const kbest = tries[0].tShift;
    tempi.slice(1).forEach(b => tries.push(runOne(kbest, b)));
    tries.sort((a, b) => a.total - b.total);
    const ranked = tries.slice();
    /* A piece: which repeats did the performer take? Every reading of the
       repeats (all, none, and each combination) is warped against the
       recording at the coarse level, each at the tempo its own length
       implies, and the one the recording fits best — the lowest cost over
       the same audio — is the one finished. */
    if(single && !opts.noRetry && (score.alternates || []).length){
      const md = span || musicSpan(feat), readings = [{how: score.how || 'as written', cost: ranked[0].total, alt: null}];
      score.alternates.forEach((alt, i) => {
        progress(`Which repeats were played… ${i + 2} of ${score.alternates.length + 1}`, 0.72);
        const tA = scoreTemplates(alt), bpmA = 60 * tA.L / Math.max(1, md.end - md.start);
        readings.push({how: alt.how, cost: runOne(ranked[0].tShift, bpmA, tA).total, alt});
      });
      let bestR = readings.reduce((a, b) => (b.cost < a.cost - 0.005 ? b : a));
      if(opts.reading) bestR = readings.find(r => r.how === opts.reading) || bestR;
      const list = readings.map(r => ({how: r.how, cost: round3(r.cost)}));
      if(bestR.alt){
        const r = align(feat, Object.assign({}, bestR.alt, {alternates: null}), Object.assign({}, opts, {noRetry: true, transposition: ranked[0].tShift, progress}));
        r.form = bestR.alt.form || r.form; r.alternate = bestR.how; r.diagnostics.readings = list; r.alignMs = Math.round(now() - t0);
        return r;
      }
      const res0 = finish(ranked[0]);
      res0.diagnostics.cost = round3(ranked[0].total); res0.diagnostics.readings = list; res0.alignMs = Math.round(now() - t0);
      return res0;
    }
    let result = finish(ranked[0]);
    result.diagnostics.cost = round3(ranked[0].total);
    /* not sure enough: the next key, the next form */
    if(result.overallConfidence < 0.6 && !opts.noRetry){
      const alts = [];
      const second = ranked.find(x => x.tShift !== ranked[0].tShift);
      if(second) alts.push(() => finish(second));
      (score.alternates || []).forEach(alt => alts.push(() => {
        const r = align(feat, Object.assign({}, alt, {alternates: null, tempoHint: hint}), Object.assign({}, opts, {noRetry: true, progress: () => {}}));
        r.form = alt.form || r.form; r.alternate = alt.how || 'alternate form';
        return r;
      }));
      alts.forEach(f => { const r = f(); if(r.overallConfidence > result.overallConfidence){ r.retried = true; result = r; } });
    }
    result.alignMs = Math.round(now() - t0);
    return result;

    function finish(best){
      const pbC = pathToBeats(best.w.path, best.w.S, L, cf.hop);
      /* the beat tracked again at the tempo the harmony chose, when the
         tracker had settled on its half or double */
      let bt = beat;
      if(Math.abs(Math.log2(best.bpm / (beat.bpm || best.bpm))) > 0.3) bt = trackBeats(feat.onset, best.bpm, best.bpm);
      const beat2 = bt;
      const grid = Float64Array.from(beat2.times);
      const period = 60 / best.bpm;
      const AGREE = opts.agree != null ? opts.agree : 0.35;
      /* Does the tracked beat agree with where the harmony puts the beats?
         Chorus by chorus (for a piece, the whole of it): as many tracked
         beats as chart beats, give or take a fifth, and most chart beats
         within a fifth of a beat of one. A rubato head, a free cadenza, a
         Chopin nocturne: no, and those are aligned by the harmony alone. */
      const agree = pbC.choruses.map(ch => gridAgreement(ch, grid, L));
      /* the tracked beat is used only where it is sure of itself (a rhythm
         section, a steady texture) and at the density of the chart's beats */
      const dens = pbC.choruses.map(ch => gridDensityOK(ch, grid, L));
      const beatOK = beat2.confidence >= (opts.beatSure != null ? opts.beatSure : single ? Infinity : 0.8) && grid.length > 8 && dens.filter(Boolean).length >= Math.ceil(dens.length / 2);
      /* with a beat to count on, the structure is decided again beat by
         beat: every tracked beat against every beat of the chart, inside
         a band round the first path, so one consistent phase has to fit
         every chord change at once */
      const pbB = beatOK ? beatLevel(pbC, grid, best.T, feat, L, tpl, period, opts) : null;
      let pb = pbC, onGridCh = pbC.choruses.map(() => false);
      if(pbB){
        /* the beat-level path decides the structure; a chorus whose stretch
           of the recording the beat does not follow (a rubato head) keeps
           the harmony's own timing instead */
        const cover = ch => { let bi = -1, bo = 0; pbC.choruses.forEach((c, i) => { const o = Math.min(c.end, ch.end) - Math.max(c.start, ch.start); if(o > bo){ bo = o; bi = i; } }); return bi; };
        onGridCh = pbB.choruses.map(ch => { const i = cover(ch); return i < 0 || dens[i]; });
        pb = {choruses: pbB.choruses.map((ch, k) => { if(onGridCh[k]) return ch; const i = cover(ch); return i >= 0 ? pbC.choruses[i] : ch; })};
      }
      const onGrid = onGridCh.some(Boolean);
      /* a scrap of a chorus at the very end (a held last chord taken for
         the start of another chorus) is the ending, not a chorus */
      while(pb.choruses.length > 1 && pb.choruses[pb.choruses.length - 1].cover < 0.3) pb.choruses.pop();
      const nCh = pb.choruses.length;
      /* the fine chroma, for the fine warping and the confidence */
      const fine = {X: feat.chroma, n: feat.energy.length, hop: feat.chromaHop};
      const SmF = simMatrix(Float64Array.from(fine.X), fine.n, best.T, L);
      const stats = frameStats(SmF, fine.n, L);
      const chor = [], stages = [];
      pb.choruses.forEach((ch, ci) => {
        progress(`Aligning chorus ${ci + 1} of ${nCh}…`, 0.75 + 0.2 * ci / Math.max(1, nCh));
        let t = fillLinear(Float64Array.from(ch.t));
        let hit = new Uint8Array(L);
        if(onGridCh[ci]){
          /* each beat on a tracked beat; where the path skipped one, between */
          for(let j = 0; j < L; j++){ const k = nearest(grid, t[j]); hit[j] = k >= 0 && Math.abs(grid[k] - t[j]) < 0.002 ? 1 : 0; }
          if(tpl.beats.some(b => b.on && b.on.length)){
            /* a score: onto the attack of the beat's own notes, close by */
            t = pitchSnap(t, tpl.beats, feat, best.tShift, {win: 0.12, sigma: 0.06}).t;
            for(let j = 1; j < L; j++) if(t[j] <= t[j - 1]) t[j] = t[j - 1] + 0.02;
          } else t = onsetSnap(t, feat.onset, feat.onsetHop, 0.06, 1.5);
        } else {
          const stage = {coarse: Array.from(t)};
          /* the finer warping only where there are no notes to place beats
             on (a chart); for a score the coarse path goes straight to the
             attacks, which are closer than any finer warping gets */
          if(!ons || opts.fineWarp) t = refineRubato(t, SmF, fine, L, period, ons ? {feat, tpl, shift: best.tShift, lambda: opts.onsetW != null ? opts.onsetW : 1.2} : null);
          stage.fine = Array.from(t);
          stages[ci] = stage;
          if(tpl.beats.some(b => b.on && b.on.length)){
            /* the score says which notes begin on each beat: place the beat on their attack */
            const so = opts.snap || {};
            /* Anchors first. Where the texture repeats itself (an arpeggio on
               one harmony, a triplet accompaniment) the warping can drift by
               seconds, and a note that recurs every beat cannot say which beat
               it is. But some notes are struck once and not again for a while
               (a new bass note, a melody note): those are searched for far and
               wide, and trusted if they agree with their neighbours. Everything
               between them moves with them. */
            if(so.anchors === true) t = anchorCorrect(t, tpl, feat, best.tShift, so);
            let ps = pitchSnap(t, tpl.beats, feat, best.tShift, {win: so.win || 0.6, sigma: so.sigma || 0.3, ratio: so.ratio, floor: so.floor});
            /* a second pass: the beats not placed are moved by the correction
               their placed neighbours needed (the warping's lag under the
               pedal is local, not random), then searched again, closely */
            if(so.twoPass !== false){
              const dt = new Float64Array(L).fill(NaN);
              for(let j = 0; j < L; j++) if(ps.moved[j]) dt[j] = ps.t[j] - t[j];
              const t2 = Float64Array.from(ps.t);
              for(let j = 0; j < L; j++) if(!ps.moved[j]){
                const near = []; for(let k = Math.max(0, j - 8); k <= Math.min(L - 1, j + 8); k++) if(!isNaN(dt[k])) near.push(dt[k]);
                if(near.length >= 2){ near.sort((a, b) => a - b); t2[j] = t[j] + near[near.length >> 1]; }
              }
              const ps2 = pitchSnap(t2, tpl.beats, feat, best.tShift, {win: 0.25, sigma: 0.1, ratio: so.ratio, floor: so.floor});
              for(let j = 0; j < L; j++) if(ps.moved[j]) ps2.t[j] = ps.t[j], ps2.moved[j] = 1;
              ps = ps2;
            }
            t = ps.t;
            /* the beats with nothing of their own to place them: between their neighbours */
            const tt = Float64Array.from(t); let any = false;
            for(let j = 0; j < L; j++) if(!ps.moved[j] && tpl.beats[j].on && tpl.beats[j].on.length === 0){ tt[j] = NaN; any = true; }
            if(any) t = fillLinear(tt);
            for(let j = 1; j < L; j++) if(t[j] <= t[j - 1]) t[j] = t[j - 1] + 0.02;
          } else {
            /* the downbeats onto a clear onset, when there is one */
            const down = Float64Array.from(t).fill(NaN);
            tpl.barStart.forEach(b => down[b] = t[b]);
            const sn = onsetSnap(down, feat.onset, feat.onsetHop, 0.06, 2.0);
            tpl.barStart.forEach(b => { t[b] = sn[b]; });
          }
        }
        if(stages[ci]) stages[ci].final = Array.from(t);
        chor.push({t, hit, start: ch.start, end: ch.end, complete: ch.complete, firstS: ch.firstS, lastS: ch.lastS, onGrid: onGridCh[ci]});
      });

      /* confidence, bar by bar */
      const bars = tpl.bars, perBar = [];
      const barBeats = b => [tpl.barStart[b], b + 1 < bars ? tpl.barStart[b + 1] : L];
      /* how far each bar is from a chord change (for the long modal chords) */
      const sinceChange = new Float64Array(bars);
      for(let b = 0; b < bars; b++){
        let d = Infinity;
        for(let j = 0; j < L; j++) if(tpl.change[j]){ const bb = beatBar(j); let x = Math.abs(bb - b); x = Math.min(x, bars - x); if(x < d) d = x; }
        sinceChange[b] = d === Infinity ? bars : d;
      }
      function beatBar(j){ let b = 0; while(b + 1 < bars && tpl.barStart[b + 1] <= j) b++; return b; }
      chor.forEach((ch, ci) => {
        const durs = [];
        for(let b = 0; b < bars; b++){ const [a, z] = barBeats(b); const tz = z < L ? ch.t[z] : (ci + 1 < chor.length ? chor[ci + 1].t[0] : ch.t[L - 1] + (ch.t[L - 1] - ch.t[L - 2])); durs.push(tz - ch.t[a]); }
        for(let b = 0; b < bars; b++){
          const [a, z] = barBeats(b);
          const ta = ch.t[a], tz = ta + durs[b];
          /* harmony: how much better than elsewhere in the chorus */
          let zs = 0, nz = 0;
          const f0 = Math.max(0, Math.floor(ta / fine.hop)), f1 = Math.min(fine.n - 1, Math.ceil(tz / fine.hop));
          for(let f = f0; f < f1; f++){
            const tt = f * fine.hop;
            let j = a; while(j + 1 < z && ch.t[j + 1] <= tt) j++;
            const s = SmF[f * L + j];
            if(stats.sd[f] > 1e-6){ zs += (s - stats.mu[f]) / stats.sd[f]; nz++; }
          }
          const zz = nz ? zs / nz : 0;
          let h = 1 / (1 + Math.exp(-1.6 * (zz - 0.6)));
          /* a bar deep inside one long chord is placed by counting, not harmony */
          const flat = sinceChange[b] >= 2;
          const grid = ch.onGrid ? (() => { let s = 0; for(let j = a; j < z; j++) s += ch.hit[j]; return s / (z - a); })() : 0;
          const gridConf = ch.onGrid ? beat2.confidence * (0.4 + 0.6 * grid) : 0.25;
          if(flat) h = Math.max(h * 0.5, gridConf * Math.pow(0.96, sinceChange[b] - 1));
          /* tempo: the bar against its neighbours */
          const nb = [durs[b - 1], durs[b + 1]].filter(x => x > 0);
          const ref = nb.length ? nb.reduce((p, q) => p + q, 0) / nb.length : durs[b];
          const lr = Math.abs(Math.log(durs[b] / ref));
          const tc = durs[b] > 0 ? Math.max(0, Math.min(1, 1 - (lr - Math.log(1.12)) / (Math.log(1.4) - Math.log(1.12)))) : 0;
          let conf = ch.onGrid ? 0.5 * h + 0.3 * gridConf + 0.2 * tc : 0.7 * h + 0.3 * tc;
          /* a chorus the path only touched the edge of */
          if(!ch.complete && ((ci === 0 && a * best.w.S / L < ch.firstS) || (ci === chor.length - 1 && a * best.w.S / L > ch.lastS))) conf *= 0.3;
          perBar.push({chorus: ci + 1, measure: b + 1, time: ta, duration: durs[b], harmony: round3(h), grid: round3(grid), tempo: round3(tc), confidence: round3(Math.max(0, Math.min(1, conf)))});
        }
      });

      /* the rules: unsure bars interpolated, time forward, tempo within 40% */
      const fermata = new Set(); tpl.beats.forEach(x => { if(x.fermata) fermata.add(x.measure); });
      const flatT = [], flatC = [], flatBar = [], interp = [];
      chor.forEach((ch, ci) => { for(let j = 0; j < L; j++){ flatT.push(ch.t[j]); const b = beatBar(j); const pbr = perBar[ci * bars + b]; flatC.push(pbr.confidence); flatBar.push(ci * bars + b); interp.push(0); } });
      const N = flatT.length;
      const idxOf = (ci, j) => ci * L + j;
      /* unsure bars */
      for(let q = 0; q < N; q++) if(flatC[q] < 0.35){ interp[q] = 1; }
      /* tempo lurches: the less sure side of the lurch goes */
      for(let pass = 0; pass < 2; pass++){
        chor.forEach((ch, ci) => {
          for(let b = 1; b < bars; b++){
            const p = perBar[ci * bars + b - 1], c = perBar[ci * bars + b];
            if(!(p.duration > 0 && c.duration > 0)) continue;
            const r = c.duration / p.duration;
            if((r > 1.4 || r < 1 / 1.4) && !fermata.has(b + 1) && !fermata.has(b)){
              const worse = p.confidence < c.confidence ? b - 1 : b;
              const [a, z] = barBeats(worse);
              for(let j = a; j < z; j++) interp[idxOf(ci, j)] = 1;
              perBar[ci * bars + worse].lurch = true;
            }
          }
        });
      }
      const T2 = Float64Array.from(flatT);
      if(interp.some(x => !x)){
        for(let q = 0; q < N; q++) if(interp[q]) T2[q] = NaN;
        fillLinear(T2);
      }
      /* forward only */
      for(let q = 1; q < N; q++) if(!(T2[q] > T2[q - 1])) T2[q] = T2[q - 1] + 0.01;
      perBar.forEach((pbr, k) => { const q = Math.floor(k / bars) * L + tpl.barStart[k % bars]; pbr.time = round3(T2[q]); pbr.interpolated = !!interp[q]; });

      const syncPoints = [];
      for(let q = 0; q < N; q++){
        const ci = Math.floor(q / L), j = q % L, bt = tpl.beats[j];
        syncPoints.push(Object.assign({chorus: ci + 1, measure: bt.measure, beat: bt.beat, time: round3(T2[q]), confidence: flatC[q]}, interp[q] ? {interpolated: true} : {}));
      }
      /* and the downbeat after the last chorus closes it */
      if(chor.length){
        const last = T2[N - 1], prevB = T2[N - 2];
        const endT = Math.min(chor[chor.length - 1].end + cf.hop, last + (last - prevB));
        syncPoints.push({chorus: chor.length + 1, measure: 1, beat: 1, time: round3(Math.max(last + 0.05, endT)), confidence: flatC[N - 1] * 0.8, interpolated: true});
      }

      /* the performance order */
      const po = [];
      const firstT = chor.length ? T2[0] : feat.duration;
      const lastT = syncPoints.length ? syncPoints[syncPoints.length - 1].time : feat.duration;
      if(firstT > 0.25) po.push({label: 'Intro', type: 'unmapped', chorus: null, audioStart: 0, audioEnd: round3(firstT)});
      chor.forEach((ch, ci) => {
        const a = T2[ci * L], z = ci + 1 < chor.length ? T2[(ci + 1) * L] : lastT;
        const head = ci === 0 || ci === chor.length - 1;
        const solo = chor.length > 2 ? ci : 0;
        po.push({label: head ? (ci === 0 ? 'Head' : 'Head out') : 'Solo ' + solo, type: head ? 'head' : 'solo', chorus: ci + 1, audioStart: round3(a), audioEnd: round3(z)});
      });
      if(feat.duration - lastT > 0.25) po.push({label: 'Ending', type: 'unmapped', chorus: null, audioStart: round3(lastT), audioEnd: round3(feat.duration)});

      const cs = perBar.map(x => x.confidence);
      let overall = cs.length ? cs.reduce((p, q) => p + q, 0) / cs.length : 0;
      if(!chor.length) overall = 0;
      return {
        transposition: best.tShift, tuningOffsetCents: feat.tuningCents,
        performanceOrder: po, syncPoints, overallConfidence: round3(overall), engineVersion: VERSION,
        form: {measures: bars, beats: score.beats || 4, measureBeats: score.measureBeats || null},
        perBar, diagnostics: {bpm: round3(best.bpm), musicSpan: span, beatConfidence: beat2.confidence, beatMode: onGrid, beatLevel: onGrid, gridAgreement: agree.map(round3), choruses: chor.length,
          stages: opts.stages ? stages.map(st => st && {coarse: tpl.barStart.map(b => st.coarse[b]), fine: tpl.barStart.map(b => st.fine[b]), final: tpl.barStart.map(b => st.final[b])}) : null,
          keyScores: keys.slice(0, 3).map(k => ({t: k.t, score: round3(k.score)})), tries: ranked.map(x => ({t: x.tShift, bpm: Math.round(x.bpm), cost: round3(x.total)})),
          unmappedCost: round3(best.u)}
      };
    }
  }
  /* where the music starts and stops: the first and last stretch of a
     second loud enough to be playing */
  function musicSpan(feat){
    const E = feat.energy, hop = feat.chromaHop, n = E.length;
    const win = Math.max(1, Math.round(1 / hop));
    const loud = quantile(Array.from(E), 0.9) || 1;
    const on = i => { let s = 0; for(let k = i; k < Math.min(n, i + win); k++) s += E[k]; return s / win > 0.08 * loud; };
    let a = 0; while(a < n && !on(a)) a++;
    let z = n - 1; while(z > a && !on(Math.max(0, z - win + 1))) z--;
    return {start: a * hop, end: (z + 1) * hop};
  }
  function round3(x){ return Math.round(x * 1000) / 1000; }
  function frameStats(Sm, n, L){
    const mu = new Float64Array(n), sd = new Float64Array(n);
    for(let i = 0; i < n; i++){
      let s = 0, s2 = 0; for(let j = 0; j < L; j++){ const v = Sm[i * L + j]; s += v; s2 += v * v; }
      mu[i] = s / L; sd[i] = Math.sqrt(Math.max(0, s2 / L - mu[i] * mu[i]));
    }
    return {mu, sd};
  }
  /* the cost of saying a frame is not the tune: between a good fit and a
     random one, frame by frame, then the median */
  function unmappedCost(Sm, n, L, E){
    const v = [];
    for(let i = 0; i < n; i++){
      let mx = 0, s = 0; for(let j = 0; j < L; j++){ const x = Sm[i * L + j]; if(x > mx) mx = x; s += x; }
      const good = 1 - mx, avg = 1 - s / L;
      v.push(0.45 * good + 0.55 * avg);
    }
    return quantile(v, 0.45);
  }
  /* the onset chroma pooled to a coarser frame (the loudest attack of the
     fine frames inside it), for frames of `hop` seconds */
  function pooledOC(feat, hop, n){
    const fh = feat.onsetHop, oc = feat.oc, nF = oc.length / 12, out = new Float32Array(n * 12);
    for(let i = 0; i < n; i++){
      const a = Math.max(0, Math.round((i - 0.5) * hop / fh)), z = Math.min(nF - 1, Math.round((i + 0.5) * hop / fh));
      for(let f = a; f <= z; f++) for(let c = 0; c < 12; c++){ const v = oc[f * 12 + c]; if(v > out[i * 12 + c]) out[i * 12 + c] = v; }
    }
    return out;
  }
  /* what the score strikes, state by state: each note at the state its
     place in the beat falls in, with the overtones a piano adds */
  function onsetStates(tpl, S, shift){
    const L = tpl.L, OT = new Float32Array(S * 12), has = new Uint8Array(S);
    tpl.beats.forEach((b, j) => (b.ons || []).forEach(([pos, midi]) => {
      const s = Math.min(S - 1, Math.floor((j + pos) * S / L)), pc = ((midi + shift) % 12 + 12) % 12;
      OT[s * 12 + pc] += 1; OT[s * 12 + (pc + 7) % 12] += 0.35; OT[s * 12 + (pc + 4) % 12] += 0.15; has[s] = 1; }));
    for(let s = 0; s < S; s++) if(has[s]){ let n = 0; for(let c = 0; c < 12; c++) n += OT[s * 12 + c] * OT[s * 12 + c]; n = Math.sqrt(n); for(let c = 0; c < 12; c++) OT[s * 12 + c] /= n; }
    return {OT, has};
  }
  const hasOnsets = tpl => tpl.beats.some(b => b.ons && b.ons.length);

  /* a chorus one beat early or late: which fits the harmony best */
  function bestShift(t, SmF, hop, L, grid, period){
    const score = tt => {
      let s = 0;
      for(let j = 0; j < L; j++){
        const a = tt[j], z = j + 1 < L ? tt[j + 1] : tt[j] + period;
        for(let x = a; x < z; x += hop){ const f = Math.round(x / hop); if(f >= 0 && f * L + j < SmF.length) s += SmF[f * L + j]; }
      }
      return s;
    };
    const shifted = d => { const o = new Float64Array(L); for(let j = 0; j < L; j++) o[j] = t[j] + d * period; return o; };
    let best = {shift: 0, t, s: score(t)};
    for(const d of [-1, 1]){ const tt = shifted(d), s = score(tt); if(s > best.s * 1.02) best = {shift: d, t: tt, s}; }
    return best;
  }
  /* How well the tracked beat follows this chorus: the offsets between the
     harmony's beats and the nearest tracked beat, as phases of a beat,
     and how tightly they cluster (the length of their mean vector, 0 to
     1). In time the offsets sit together, however coarse the harmony's
     own placing; in rubato they scatter round the circle. A tracked beat
     at the wrong density agrees with nothing. */
  function gridDensityOK(ch, grid, L){
    const t = ch.t, ok = [];
    for(let j = 0; j < L; j++) if(!isNaN(t[j])) ok.push(j);
    if(ok.length < 8 || grid.length < 8) return false;
    const a = t[ok[0]], z = t[ok[ok.length - 1]], span = ok[ok.length - 1] - ok[0];
    let inside = 0; for(const g of grid) if(g >= a && g <= z) inside++;
    const d = (inside - 1) / Math.max(1, span);
    return d >= 0.8 && d <= 1.25;
  }
  function gridAgreement(ch, grid, L){
    const t = ch.t, ok = [];
    for(let j = 0; j < L; j++) if(!isNaN(t[j])) ok.push(j);
    if(ok.length < 8 || grid.length < 8) return 0;
    const a = t[ok[0]], z = t[ok[ok.length - 1]], beatsSpan = ok[ok.length - 1] - ok[0];
    let inside = 0; for(const g of grid) if(g >= a && g <= z) inside++;
    const density = (inside - 1) / Math.max(1, beatsSpan);
    if(density < 0.8 || density > 1.25) return 0;
    let cx = 0, cy = 0, n = 0;
    for(const j of ok){
      const k = nearest(grid, t[j]);
      if(k < 0) continue;
      const P = k + 1 < grid.length ? grid[k + 1] - grid[k] : grid[k] - grid[k - 1];
      const ph = 2 * Math.PI * (t[j] - grid[k]) / Math.max(0.05, P);
      cx += Math.cos(ph); cy += Math.sin(ph); n++;
    }
    return n ? Math.hypot(cx, cy) / n : 0;
  }
  /* The beat-level warping. Units are the tracked beats; each gets the
     chroma of the frames that fall inside it. The chart's beats are the
     states, one each; a step of one beat per beat is free, anything else
     costs, so the path can absorb a beat the tracker added or lost but
     not drift. The band keeps it within two beats of the coarse path. */
  function beatLevel(pbC, grid, T, feat, L, tpl, period, o = {}){
    const pen = o.beatPen != null ? o.beatPen : 2.5, off = o.beatOffset != null ? o.beatOffset : 0;
    const G = grid, nG = G.length, hop = feat.chromaHop, nF = feat.energy.length;
    if(nG < 8 || !pbC.choruses.length) return null;
    const X = new Float64Array(nG * 24);
    for(let i = 0; i < nG; i++){
      const d = (i + 1 < nG ? G[i + 1] : G[i] + period) - G[i];
      const a = G[i] + off * d, z = a + d;
      const f0 = Math.max(0, Math.round(a / hop)), f1 = Math.min(nF, Math.max(f0 + 1, Math.round(z / hop)));
      for(let f = f0; f < f1; f++) for(let k = 0; k < 24; k++) X[i * 24 + k] += feat.chroma[f * 24 + k];
    }
    const C = zCost(simMatrix(X, nG, T, L), nG, L);
    /* The backbeat. In swing the hi-hat closes on 2 and 4 and the ride
       leans on them; a beat a beat out of phase puts that accent on 1 and
       3. Its weight is how clearly this recording alternates. */
    const bb = backbeat(G, feat, tpl, o.backbeat != null ? o.backbeat : 0.8);
    if(bb){ for(let i = 0; i < nG; i++) for(let j = 0; j < L; j++) C[i * L + j] -= bb.w * bb.z[i] * bb.sign[j]; }
    /* where the coarse path says each tracked beat is, in beats from the top */
    const pts = [];
    pbC.choruses.forEach((ch, ci) => { for(let j = 0; j < L; j++) if(!isNaN(ch.t[j])) pts.push([ch.t[j], ci * L + j]); });
    pts.sort((p, q) => p[0] - q[0]);
    if(pts.length < 2) return null;
    const lo = new Int32Array(nG), hi = new Int32Array(nG), W = 2;
    let q = 0;
    for(let i = 0; i < nG; i++){
      const t = G[i];
      if(t < pts[0][0] - 2.5 * period || t > pts[pts.length - 1][0] + 2.5 * period){ lo[i] = -1; hi[i] = -1; continue; }
      while(q + 1 < pts.length - 1 && pts[q + 1][0] <= t) q++;
      const [ta, ga] = pts[q], [tb, gb] = pts[Math.min(q + 1, pts.length - 1)];
      const g = tb > ta ? ga + (t - ta) * (gb - ga) / (tb - ta) : ga + (t - ta) / period;
      const s = ((Math.round(g) % L) + L) % L;
      lo[i] = (s - W + L) % L; hi[i] = (s + W) % L;
    }
    const w = warp(C, nG, L, 1, tpl.change, tpl.barStart, {u: 0.1, pStay: pen, pSkip: pen, pEnterMid: Infinity, pExitMid: 4, band: {lo, hi}});
    const at = x => { const i = Math.max(0, Math.min(nG - 1, Math.floor(x))), f = x - i; return i + 1 < nG ? G[i] + f * (G[i + 1] - G[i]) : G[i] + f * period; };
    const pb = pathToBeats(w.path, w.S, L, at);
    return pb.choruses.length ? pb : null;
  }

  function backbeat(G, feat, tpl, weight){
    const hi = feat.onsetHi, hop = feat.onsetHop, nG = G.length;
    if(!hi || !weight) return null;
    /* only where the chart's bars are four beats (two backbeats a bar) */
    const sign = new Float64Array(tpl.L);
    let any = false;
    tpl.beats.forEach((x, j) => { const n = (tpl.barStart[x.measure] != null ? tpl.barStart[x.measure] : tpl.L) - tpl.barStart[x.measure - 1];
      if(n === 4){ sign[j] = x.beat % 2 === 0 ? 1 : -1; any = true; } });
    if(!any) return null;
    const h = new Float64Array(nG);
    for(let i = 0; i < nG; i++){ const c = Math.round(G[i] / hop); let m = 0; for(let k = c - 1; k <= c + 1; k++) if(k >= 0 && k < hi.length && hi[k] > m) m = hi[k]; h[i] = m; }
    const z = new Float64Array(nG);
    for(let i = 0; i < nG; i++){ const a = i > 0 ? h[i - 1] : h[i + 1], b = i + 1 < nG ? h[i + 1] : h[i - 1]; z[i] = h[i] - 0.5 * (a + b); }
    let s2 = 0; for(let i = 0; i < nG; i++) s2 += z[i] * z[i];
    const sd = Math.sqrt(s2 / nG) || 1;
    for(let i = 0; i < nG; i++) z[i] = Math.max(-2, Math.min(2, z[i] / sd));
    /* how clearly it alternates, sixteen beats at a time */
    let cl = 0, nw = 0;
    for(let a = 0; a + 16 <= nG; a += 8){ let m = 0; for(let i = a; i < a + 16; i++) m += (i % 2 ? 1 : -1) * z[i]; cl += Math.abs(m / 16); nw++; }
    cl = nw ? cl / nw : 0;
    const w = weight * Math.max(0, Math.min(1, (cl - 0.15) / 0.35));
    return w > 0.02 ? {z, sign, w, clarity: cl} : null;
  }

  /* Each beat onto the attack of the notes the score starts on it.
     For every expected pitch, the rise of the fine spectrum at its
     fundamental and first overtones (tuned and transposed as the recording
     is); summed, that is how strongly those notes begin in each frame. The
     beat moves to the strongest such attack near where the warping put it,
     weighted toward that place; a beat whose notes do not stand out is left
     where it was. Sustained, pedalled notes do not rise, so they do not
     count — which is exactly what chroma cannot tell apart. */
  function pitchSnap(t, beats, feat, shift, o = {}){
    const spec = feat.spec, KB = feat.specBins, hop = feat.onsetHop, nF = spec ? spec.length / KB : 0;
    if(!spec) return {t, moved: new Uint8Array(t.length)};
    const tune = feat.tuningCents / 1200, win = o.win || 0.3, sig = o.sigma || 0.12, bias = o.bias || 0;
    const binOf = f => f * feat.specN / feat.sr;
    const out = Float64Array.from(t), moved = new Uint8Array(t.length);
    for(let j = 0; j < t.length; j++){
      const on = o.pitches ? o.pitches[j] : beats[j] && beats[j].on;
      if(!on || !on.length || isNaN(t[j])) continue;
      const bins = [];
      on.forEach(m => { for(let h = 1; h <= 4; h++){ const f = h * 440 * Math.pow(2, (m + shift - 69) / 12 + tune); const b = binOf(f);
        if(b > 2 && b < KB - 2) bins.push([Math.round(b), [1, 0.7, 0.5, 0.35][h - 1]]); } });
      if(!bins.length) continue;
      const c = Math.round(t[j] / hop), w = Math.round(win / hop);
      const sc = [];
      for(let f = Math.max(1, c - w); f <= Math.min(nF - 1, c + w); f++){
        let s = 0;
        for(const [b, wt] of bins){ let best = 0; for(let k = b - 1; k <= b + 1; k++){ const d = spec[f * KB + k] - spec[(f - 1) * KB + k]; if(d > best) best = d; } s += wt * best; }
        sc.push([f, s]);
      }
      if(sc.length < 3) continue;
      const vals = sc.map(x => x[1]).sort((a, b) => a - b), med = vals[vals.length >> 1] || 1e-9;
      let bf = -1, bv = 0;
      sc.forEach(([f, s]) => { const pri = Math.exp(-0.5 * Math.pow((f * hop - t[j]) / sig, 2)); const v = s * pri; if(v > bv){ bv = v; bf = f; } });
      const peak = sc.find(x => x[0] === bf);
      if(bf >= 0 && peak[1] > (o.ratio || 2.5) * med && peak[1] > (o.floor || 0.4)){ out[j] = bf * hop + bias; moved[j] = 1; }
    }
    return {t: out, moved};
  }

  function anchorCorrect(t, tpl, feat, shift, so){
    const L = t.length, beats = tpl.beats, W = so.uniqueQ || 6;
    /* each beat's struck notes that no beat within W quarters strikes too */
    const uniq = beats.map((b, j) => {
      if(!b.on || !b.on.length) return null;
      const near = new Set();
      for(let k = Math.max(0, j - W); k <= Math.min(L - 1, j + W); k++) if(k !== j && beats[k].on) beats[k].on.forEach(m => near.add(m));
      const u = b.on.filter(m => !near.has(m));
      return u.length ? u : null;
    });
    const ps = pitchSnap(t, beats, feat, shift, {pitches: uniq, win: so.anchorWin || 2.5, sigma: so.anchorSigma || 1.2, ratio: so.anchorRatio || 3, floor: so.floor});
    /* the anchors' corrections; one that disagrees by more than a second
       with the median of its neighbours is a mistaken match */
    const idx = [], off = [];
    for(let j = 0; j < L; j++) if(ps.moved[j]){ idx.push(j); off.push(ps.t[j] - t[j]); }
    if(idx.length < 3) return t;
    const keep = idx.map((j, a) => {
      const nb = []; for(let b = Math.max(0, a - 3); b <= Math.min(idx.length - 1, a + 3); b++) if(b !== a) nb.push(off[b]);
      nb.sort((x, y) => x - y); const med = nb.length ? nb[nb.length >> 1] : 0;
      return Math.abs(off[a] - med) <= (so.anchorAgree || 1.0);
    });
    const I = [], O = [];
    idx.forEach((j, a) => { if(keep[a]){ I.push(j); O.push(off[a]); } });
    if(I.length < 2) return t;
    /* every beat moved by the correction interpolated between its anchors */
    const out = Float64Array.from(t);
    let a = 0;
    for(let j = 0; j < L; j++){
      while(a + 1 < I.length && I[a + 1] <= j) a++;
      let d;
      if(j <= I[0]) d = O[0];
      else if(j >= I[I.length - 1]) d = O[O.length - 1];
      else { const f = (j - I[a]) / (I[a + 1] - I[a]); d = O[a] + f * (O[a + 1] - O[a]); }
      out[j] = t[j] + d;
    }
    for(let j = 1; j < L; j++) if(out[j] <= out[j - 1]) out[j] = out[j - 1] + 0.02;
    return out;
  }

  /* rubato: a second warping at 46 ms inside a band round the first */
  function refineRubato(t, SmF, fine, L, period, on){
    const a = t[0], z = t[L - 1] + (t[L - 1] - t[L - 2]);
    const f0 = Math.max(0, Math.floor((a - 1.0) / fine.hop)), f1 = Math.min(fine.n, Math.ceil((z + 1.0) / fine.hop));
    const n = f1 - f0;
    if(n < L) return t;
    /* the frames' own slice of the similarity */
    const Sm = SmF.subarray(f0 * L, f1 * L);
    const F = (z - a) / L / fine.hop;
    const S = Math.max(L, Math.round(L * F));
    const bandW = Math.round(0.9 / fine.hop);
    const lo = new Int32Array(n), hi = new Int32Array(n);
    /* the band: the state the first path was in at each frame, ± the width */
    for(let i = 0; i < n; i++){
      const tt = (i + f0) * fine.hop;
      let j = 0; while(j + 1 < L && t[j + 1] <= tt) j++;
      const frac = j + 1 < L ? Math.max(0, Math.min(1, (tt - t[j]) / (t[j + 1] - t[j]))) : 0;
      const s = Math.round((j + frac) * S / L);
      lo[i] = Math.max(0, s - Math.round(bandW * S / L / F * F)); hi[i] = Math.min(S - 1, s + Math.round(bandW * S / L / F * F));
      if(tt < a - 0.2) { lo[i] = 0; hi[i] = Math.min(S - 1, hi[i]); }
    }
    let onset = null;
    if(on){
      const all = pooledOC(on.feat, fine.hop, fine.n), OC = all.subarray(f0 * 12, f1 * 12);
      onset = S2 => Object.assign({OC, lambda: on.lambda, mu: 0.35}, onsetStates(on.tpl, S2, on.shift));
    }
    const w = warp(zCost(Sm, n, L), n, L, F, null, [0], {u: 0.1, pStay: 0.1, pSkip: 0.2, pEnterMid: Infinity, pExitMid: Infinity, band: {lo, hi}, onset});
    const pb = pathToBeats(w.path, w.S, L, fine.hop);
    if(!pb.choruses.length) return t;
    const ch = pb.choruses.reduce((p, q) => (q.end - q.start > p.end - p.start ? q : p));
    const out = Float64Array.from(ch.t);
    for(let j = 0; j < L; j++) out[j] = isNaN(out[j]) ? t[j] : out[j] + f0 * fine.hop;
    /* the refinement may not move a beat further than the band allows */
    for(let j = 0; j < L; j++) if(Math.abs(out[j] - t[j]) > 1.0) out[j] = t[j];
    return out;
  }

  /* everything, start to finish */
  function run(pcm, sr, score, opts = {}){
    const feat = opts.features || analyse(pcm, sr, {progress: opts.progress, tempoHint: score.tempoHint});
    const r = align(feat, score, opts);
    r.analyseMs = feat.analyseMs || 0;
    r.features = opts.keepFeatures ? feat : null;
    return r;
  }

  return {VERSION, SR, analyse, align, run, chordTemplate, keyCandidates, trackBeats, estimateTuning, toEngineRate,
    _internal: {scoreTemplates, warp, pathToBeats, simMatrix, coarseFrames}};
}
