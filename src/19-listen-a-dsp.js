/* ============================================================
   HEARING THE PIANO — the signal processing.

   Everything in this file is plain arithmetic on numbers: no page, no
   audio context, no storage. That is so the same code can run in three
   places without a copy of it drifting: in the Worker that listens to
   the microphone (19-listen-c-live.js builds the Worker from these very
   functions), on the page when the test harness checks a recording you
   uploaded, and in Node when tools/listen-harness.js measures accuracy.
   The functions are named ld* and must only call each other, Math, and
   typed arrays — anything else would not exist inside the Worker.

   What it does, in order:

   1. ONSETS. The sound is cut into short overlapping frames (2048
      samples, a new one every 512). For each, the log-magnitude spectrum;
      the "flux" is how much louder any frequency got since the frame
      before, summed. A key going down makes every partial jump at once,
      so the flux spikes; a note that is only ringing does not. A spike
      above the recent typical flux (and above what the room's own noise
      makes) is an onset.

   2. WHAT WAS STRUCK. A little after the onset (about a tenth of a
      second — enough for the pitch to be clear, soon enough for feedback
      to feel immediate) one longer window is taken and a fine spectrum
      computed. Every piano key's harmonic series is looked for in it:
      the fundamental and its partials, at the tuning this piano actually
      has, and stretched the way piano strings stretch them
      (inharmonicity — the stiffer the string, the sharper its upper
      partials). The spectrum just before the onset is compared too, so a
      note already ringing under the pedal is not mistaken for one just
      played.

   3. EXPLAINING AWAY. The best candidate is taken, and what it accounts
      for is removed from the spectrum — but only as much of each partial
      as a smooth series would have (Klapuri's spectral smoothness), so an
      octave above, whose partials coincide with every other one of the
      lower note's, keeps the excess that is really its own. Then the
      next best, and so on.

   4. VERIFYING. When the notes that should be played are known (an
      exercise step), those are looked for first and more readily — you
      are far more likely to have played what the page asks than
      anything else — and only then is the rest searched, more sternly,
      for extra notes.

   5. LEARNING THE PIANO. Every note that is confidently confirmed leaves
      the shape of its partials behind, and the matching uses those
      shapes from then on: the engine slowly learns this instrument in
      this room, with no calibration asked of anybody.
   ============================================================ */

/* ---------- the arithmetic ---------- */
function ldFFT(re, im){
  const n = re.length;
  for(let i = 1, j = 0; i < n; i++){
    let bit = n >> 1;
    for(; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if(i < j){ let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  for(let len = 2; len <= n; len <<= 1){
    const half = len >> 1, tw = ldTwiddles(len);
    for(let i = 0; i < n; i += len){
      for(let k = 0; k < half; k++){
        const a = i + k, b = a + half, cr = tw[2 * k], ci = tw[2 * k + 1];
        const xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
      }
    }
  }
}
function ldTwiddles(len){
  const _ldTw = ldTwiddles.cache = ldTwiddles.cache || {};
  if(_ldTw[len]) return _ldTw[len];
  const half = len >> 1, t = new Float64Array(len);
  for(let k = 0; k < half; k++){ const a = -2 * Math.PI * k / len; t[2 * k] = Math.cos(a); t[2 * k + 1] = Math.sin(a); }
  return (_ldTw[len] = t);
}
function ldHann(n){
  const _ldWin = ldHann.cache = ldHann.cache || {};
  if(_ldWin[n]) return _ldWin[n];
  const w = new Float32Array(n);
  for(let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * (i + 0.5) / n);
  return (_ldWin[n] = w);
}
/* The amplitude spectrum of `len` samples of x starting at `start` (read
   through `at`, so a ring buffer works), Hann-windowed and zero-padded to
   nfft. Scaled so a sine of amplitude A reads about A at its peak. */
function ldSpectrum(at, start, len, nfft){
  const re = new Float64Array(nfft), im = new Float64Array(nfft), w = ldHann(len);
  for(let i = 0; i < len; i++) re[i] = at(start + i) * w[i];
  ldFFT(re, im);
  const out = new Float32Array(nfft / 2 + 1), sc = 4 / len;
  for(let k = 0; k <= nfft / 2; k++) out[k] = Math.sqrt(re[k] * re[k] + im[k] * im[k]) * sc;
  return out;
}
function ldMidiHz(p, cents){ return 440 * Math.pow(2, (p - 69) / 12 + (cents || 0) / 1200); }
/* How much a piano string stretches its partials: f_k = k·f1·√((1+Bk²)/(1+B)).
   B rises steeply up the keyboard (short, stiff strings) and a little at
   the very bottom (the wound bass strings); these are typical values for a
   grand, and the per-piano templates absorb the rest. */
function ldInharm(p){
  const def = p >= 60 ? 1.2e-4 * Math.pow(10, (p - 60) / 34) : 1.2e-4 * Math.pow(10, (60 - p) / 120);
  /* what this piano has shown us, octave by octave, once it has shown us
     enough — an upright's short bass strings stretch their partials several
     times further than a concert grand's */
  const L = ldInharm.learned, band = Math.max(0, Math.min(7, Math.floor((p - 21) / 12)));
  const b = L && L[band];
  return b && b.n >= 3 ? b.B : def;
}
function ldPartialHz(p, k, cents){
  const B = ldInharm(p);
  return k * ldMidiHz(p, cents) * Math.sqrt((1 + B * k * k) / (1 + B));
}
/* how many partials to look at: more for the bass, whose fundamental is
   weak and whose pitch lives in the upper partials */
function ldPartials(p, sr){
  const f1 = ldMidiHz(p), top = Math.min(sr * 0.45, 7000);
  const want = p < 40 ? 20 : p < 52 ? 14 : p < 64 ? 10 : p < 76 ? 8 : p < 88 ? 5 : 3;
  return Math.max(1, Math.min(want, Math.floor(top / f1)));
}

/* ---------- reading a partial off a spectrum ---------- */
/* the largest bin within ±c cents (or ±minBins) of f; its index and value */
function ldPeakNear(spec, f, binHz, cents, minBins){
  const w = Math.max(minBins, f * (Math.pow(2, cents / 1200) - 1) / binHz);
  const lo = Math.max(1, Math.floor(f / binHz - w)), hi = Math.min(spec.length - 2, Math.ceil(f / binHz + w));
  let bi = lo, bv = 0;
  for(let b = lo; b <= hi; b++) if(spec[b] > bv){ bv = spec[b]; bi = b; }
  /* the largest bin in the window may only be the slope of a neighbour's
     peak — the next key's partial, a semitone away. A partial is a peak. */
  const peak = bv > 0 && spec[bi] >= (spec[bi - 1] || 0) && spec[bi] >= (spec[bi + 1] || 0);
  return {bin: bi, v: bv, peak};
}
/* the frequency of a peak, from the parabola through its three bins */
function ldPeakHz(spec, bin, binHz){
  const a = spec[bin - 1] || 0, b = spec[bin] || 0, c = spec[bin + 1] || 0;
  const la = Math.log(a + 1e-12), lb = Math.log(b + 1e-12), lc = Math.log(c + 1e-12);
  const d = la - 2 * lb + lc;
  const off = d < 0 ? 0.5 * (la - lc) / d : 0;
  return (bin + Math.max(-0.5, Math.min(0.5, off))) * binHz;
}
function ldDb(x){ return 20 * Math.log10(Math.max(1e-9, x)); }
/* the typical level either side of a peak, past its main lobe */
function ldBackground(spec, bin, lobe){
  const a = Math.ceil(lobe * 1.5), z = Math.ceil(lobe * 4), v = [];
  for(let b = bin - z; b <= bin - a; b++) if(b > 0) v.push(spec[b]);
  for(let b = bin + a; b <= bin + z; b++) if(b < spec.length) v.push(spec[b]);
  if(!v.length) return 1e-9;
  v.sort((x, y) => x - y);
  return v[v.length >> 1];
}

/* ---------- the analyser ----------
   ldCreate(sr, opts) → an object you push samples into; it hands back
   what it heard. State that should outlive a session (the tuning, the
   learned templates) goes in and comes out as plain data.

   push(Float32Array) → [{type:'onset', t}, {type:'notes', t, notes:[{pitch, conf, vel}], verify?}, ...]
   expect(set | null, opts) — the notes the current step asks for
   level() → {rms, db, floorDb, listening}
   tuning() → cents; templates() → {pitch: [...]} */
function ldCreate(sr, opts){
  const o = Object.assign({hop: 512, frame: 2048, post: 0.105, pre: 0.1, nfft: 16384, cents: 0,
    templates: null, onsetBias: 0}, opts || {});
  const RING = 1 << 17, ring = new Float32Array(RING);
  let n = 0;                                   /* samples seen */
  const at = i => (i < 0 || i >= n || i < n - RING) ? 0 : ring[i & (RING - 1)];
  const nb = o.frame / 2 + 1, frameHz = sr / o.frame;
  const kLo = Math.max(1, Math.round(30 / frameHz)), kHi = Math.min(nb - 1, Math.round(6000 / frameHz));
  let prevL = null, sinceHop = 0;
  const flux = [], fluxT = [];
  let lastOnset = -1e9, lastFlux = 0;
  /* the room: a running minimum of every bin over the last second and a
     half, lightly smoothed — "minimum statistics", which finds the noise
     floor even while someone is playing, because between notes, in some
     band, it is always quiet somewhere */
  const minHist = [], FLOOR_FRAMES = Math.round(1.5 * sr / o.hop);
  let floor = null, floorRms = 1e-4, floorFlux = 0, frames = 0, lastRms = 0;
  let cents = o.cents || 0;
  const tuneObs = [];
  const tpl = o.templates ? JSON.parse(JSON.stringify(o.templates)) : {};
  ldInharm.learned = o.inharm ? JSON.parse(JSON.stringify(o.inharm)) : {};
  const bObs = {};
  let expected = null, expectOpts = {};
  const pending = [];
  const out = [];

  function frameAt(end){
    const s = ldSpectrum(at, end - o.frame, o.frame, o.frame);
    let e = 0; for(let i = end - o.frame; i < end; i++){ const v = at(i); e += v * v; }
    return {s, rms: Math.sqrt(e / o.frame)};
  }
  /* The floor is the fifth-quietest reading in every twenty of each bin
     over the last second and a half: low enough that notes rarely reach
     into it, steady enough that the room's own flutter does not. A bare
     minimum over that many frames sits an order of magnitude under the
     noise's typical level, and everything above it counted as sound. Held
     notes lift it, which is right for finding onsets — only what is new
     should count — and the dB-above-floor of a note is read with that in
     mind (the rise since before the onset is what decides). */
  const kTop = Math.min(nb - 1, Math.round(8000 / frameHz));
  function updateFloor(s, rms){
    minHist.push(s); if(minHist.length > FLOOR_FRAMES) minHist.shift();
    if(frames % 8 === 0 || !floor){
      const f = new Float32Array(nb), H = minHist.length, col = new Float32Array(H);
      const q = Math.floor(H * 0.2);
      for(let k = 0; k <= kTop; k++){
        for(let h = 0; h < H; h++) col[h] = minHist[h][k];
        col.sort();
        f[k] = Math.max(1e-7, col[q] * 1.9);
      }
      for(let k = kTop + 1; k < nb; k++) f[k] = f[kTop];
      floor = f;
    }
    floorRms = floorRms ? Math.min(Math.max(floorRms * 0.999, 1e-5), rms > floorRms ? floorRms * 1.0005 : rms) : rms;
  }
  const floorAt = (f, len) => {
    if(!floor) return 1e-6;
    const k = Math.min(nb - 1, Math.max(0, Math.round(f / frameHz)));
    return floor[k] * Math.sqrt(o.frame / len);
  };

  function hop(){
    const end = n;
    const {s, rms} = frameAt(end);
    frames++; lastRms = rms;
    updateFloor(s, rms);
    /* each bin as how far it stands above the room's own noise there, so a
       soft note under the pedal counts as much as a loud one in a quiet
       room; bins that are only noise (under three times the floor) do not
       count at all, which keeps the flux of an empty room near nothing */
    const L = new Float32Array(nb);
    for(let k = 0; k < nb; k++){ const r = s[k] / (floor ? floor[k] : 1e-4); L[k] = r > 2.2 ? Math.log(r / 2.2) : 0; }
    let fx = 0;
    if(prevL) for(let k = kLo; k <= kHi; k++){ const d = L[k] - prevL[k]; if(d > 0) fx += d; }
    prevL = L;
    flux.push(fx); fluxT.push(end);
    if(flux.length > 64){ flux.shift(); fluxT.shift(); }
    /* the flux the room makes on its own, learned in the first moments and
       then followed slowly downwards */
    if(frames < 20) floorFlux = Math.max(floorFlux, fx);
    else if(fx < floorFlux) floorFlux = floorFlux * 0.98 + fx * 0.02;
    /* a peak one hop back is an onset if it stands above its surroundings */
    const m = flux.length;
    if(m >= 3 && frames > 6){
      const a = flux[m - 3], b = flux[m - 2], c = flux[m - 1];
      const recent = flux.slice(Math.max(0, m - 24), m - 2).sort((x, y) => x - y);
      const med = recent.length ? recent[recent.length >> 1] : 0;
      const thr = Math.max(floorFlux * 1.5 + (o.minFlux || 3.5), med * 1.4 + 3);
      const tEnd = fluxT[m - 2];
      if(o.trace) o.trace.push([+(tEnd / sr).toFixed(3), +b.toFixed(1), +thr.toFixed(1), +floorFlux.toFixed(1), +med.toFixed(1)]);
      /* just after a strong attack, a much weaker spike is that attack still
         blooming (partials arriving at different speeds, the room answering)
         and not a new key */
      const masked = (tEnd - lastOnset) < 0.09 * sr && b < lastFlux * 0.5;
      if(b > a && b >= c && b > thr && (tEnd - lastOnset) > 0.045 * sr && !masked){
        lastFlux = b;
        /* the attack sits in the newest part of the frame that jumped */
        const t0 = Math.round(tEnd - o.hop * 1.5 + o.onsetBias * sr);
        lastOnset = tEnd;
        out.push({type: 'onset', t: t0 / sr, strength: b / Math.max(1, thr)});
        /* a new onset cuts short the look at the one before */
        pending.forEach(p => { if(!p.until) p.until = t0 - Math.round(0.004 * sr); });
        pending.push({t0, until: null, expect: expected ? expected.slice() : null, eo: Object.assign({}, expectOpts)});
      }
    }
  }
  function evaluateReady(){
    for(let i = 0; i < pending.length; i++){
      const p = pending[i];
      const full = p.t0 + Math.round(o.post * sr);
      const stop = p.until != null ? Math.min(full, p.until) : full;
      if(n < stop && p.until == null) continue;
      pending.splice(i--, 1);
      const r = analyse(p.t0, stop, p.expect, p.eo);
      out.push(r);
    }
  }

  /* ---------- one onset, looked at closely ---------- */
  function analyse(t0, stop, exp, eo){
    const startPost = t0 - Math.round(0.008 * sr);
    const len = Math.max(Math.round(0.035 * sr), stop - startPost);
    const nfft = o.nfft, binHz = sr / nfft;
    const post = ldSpectrum(at, startPost, len, nfft);
    const plen = Math.round(o.pre * sr);
    const pre = ldSpectrum(at, t0 - Math.round(0.012 * sr) - plen, plen, nfft);
    const work = post.slice();
    const res = ldEstimate({post, pre, work, binHz, len, plen, sr, cents, tpl, floorAt, exp, eo});
    /* velocity from how loud the attack was against the room */
    const vel = Math.max(0, Math.min(1, (ldDb(lastRms) - ldDb(floorRms) - 6) / 50));
    res.notes.forEach(x => { x.vel = +(Math.max(0.05, Math.min(1, x.vel != null ? x.vel : vel))).toFixed(2); });
    learn(res, post, binHz);
    return {type: 'notes', t: t0 / sr, notes: res.notes, verify: res.verify || null, faint: res.faint, window: len / sr};
  }

  /* ---------- the tuning, and the templates ---------- */
  function learn(res, post, binHz){
    const sure = res.notes.filter(x => x.conf >= 0.8);
    /* tuning: each clear note's first partials, measured exactly */
    sure.forEach(x => {
      if(x.pitch < 45 || x.pitch > 96) return;
      for(let k = 1; k <= 3; k++){
        const f = ldPartialHz(x.pitch, k, 0);
        const pk = ldPeakNear(post, f * Math.pow(2, cents / 1200), binHz, 60, 2);
        if(pk.v <= 0) continue;
        const hz = ldPeakHz(post, pk.bin, binHz);
        const c = 1200 * Math.log2(hz / f);
        if(Math.abs(c) < 60) tuneObs.push(c);
      }
    });
    /* inharmonicity: how far this piano's partials stretch, from notes
       heard alone and clearly */
    if(sure.length === 1 || (res.verify && res.verify.pass && res.notes.length === 1)){
      const x = sure[0] || res.notes[0];
      if(x && x.pitch >= 21 && x.pitch <= 84){
        const f1pk = ldPeakNear(post, ldMidiHz(x.pitch, cents), binHz, 50, 2);
        if(f1pk.v > 0 && f1pk.peak){
          const f1 = ldPeakHz(post, f1pk.bin, binHz), est = [];
          const K = Math.min(12, ldPartials(x.pitch, sr));
          for(let k = 3; k <= K; k++){
            const guess = k * f1 * Math.sqrt(1 + ldInharm(x.pitch) * k * k);
            const pk = ldPeakNear(post, guess, binHz, 60, 2);
            if(!pk.peak || pk.v <= 0) continue;
            const r = ldPeakHz(post, pk.bin, binHz) / (k * f1), r2 = r * r;
            const B = (r2 - 1) / (k * k - r2);
            if(B > 0 && B < 0.01) est.push(B);
          }
          if(est.length >= 2){
            est.sort((a, b) => a - b);
            const band = Math.max(0, Math.min(7, Math.floor((x.pitch - 21) / 12)));
            const ob = bObs[band] = bObs[band] || []; ob.push(est[est.length >> 1]); if(ob.length > 40) ob.shift();
            const sorted = ob.slice().sort((a, b) => a - b);
            ldInharm.learned[band] = {B: sorted[sorted.length >> 1], n: ob.length};
          }
        }
      }
    }
    while(tuneObs.length > 300) tuneObs.shift();
    if(tuneObs.length >= 12){
      const s = tuneObs.slice().sort((a, b) => a - b);
      cents = s[s.length >> 1];
    }
    /* templates: only from a step that was verified whole and clean, and
       only for notes no other note in it shares low partials with */
    if(res.verify && res.verify.pass){
      const ps = res.notes.map(x => x.pitch);
      res.notes.forEach(x => {
        const clash = ps.some(q => q !== x.pitch && [12, 19, 24, 28, 31, 36].includes(Math.abs(q - x.pitch)));
        if(clash) return;
        const K = ldPartials(x.pitch, sr), amp = [];
        for(let k = 1; k <= K; k++) amp.push(ldPeakNear(post, ldPartialHz(x.pitch, k, cents), binHz, 25, 1.5).v);
        const top = Math.max(...amp); if(top <= 0) return;
        const shape = amp.map(a => a / top);
        const t = tpl[x.pitch];
        if(!t) tpl[x.pitch] = {n: 1, w: shape};
        else { const a = Math.max(0.1, 1 / (t.n + 1)); t.w = t.w.map((v, i) => v * (1 - a) + (shape[i] || 0) * a); t.n++; }
      });
    }
  }

  return {
    push(x){
      for(let i = 0; i < x.length; i++){
        ring[n & (RING - 1)] = x[i]; n++;
        if(++sinceHop >= o.hop){ sinceHop = 0; if(n >= o.frame) hop(); evaluateReady(); }
      }
      const r = out.splice(0, out.length);
      return r;
    },
    /* the end of a recording: look at whatever is still waiting */
    flush(){
      pending.forEach(p => { p.until = Math.min(n, p.t0 + Math.round(o.post * sr)); });
      evaluateReady();
      return out.splice(0, out.length);
    },
    expect(set, eo){ expected = set && set.length ? set.slice() : null; expectOpts = eo || {}; },
    level(){ return {rms: lastRms, db: +ldDb(lastRms).toFixed(1), floorDb: +ldDb(floorRms).toFixed(1)}; },
    tuning(){ return +cents.toFixed(1); },
    setTuning(c){ cents = +c || 0; },
    templates(){ return tpl; },
    inharmonicity(){ return JSON.parse(JSON.stringify(ldInharm.learned || {})); },
    time(){ return n / sr; }
  };
}

/* ---------- which keys were struck ----------
   post/pre: spectra after and before the onset; work: a copy of post that
   is worn down as candidates explain it. Returns {notes, verify?}. */
function ldEstimate(c){
  const {post, pre, work, binHz, len, plen, sr, cents, tpl, floorAt} = c;
  const exp = c.exp && c.exp.length ? c.exp : null, eo = c.eo || {};
  const lobe = 2.2 * (post.length - 1) * 2 / len;   /* half a main lobe, in padded bins */
  const lobeBins = Math.max(2, lobe);
  const cache = {};
  /* how strongly pitch p is there, in dB above the room, weighted over its
     partials; and how much of it is new since just before the onset */
  /* the partials of every note already accepted: a candidate that only
     shows up where those are is an echo of them, not a key */
  const owned = [];
  const ownedNear = f => owned.some(g => Math.abs(1200 * Math.log2(f / g.f)) < g.tol);
  /* a real string's upper partials stray further from the model the higher
     they are, so the tolerance widens with the partial number */
  function own(p){ for(let k = 1; k <= 30; k++){ const f = ldPartialHz(p, k, cents); if(f > Math.min(sr * 0.45, 8000)) break; owned.push({f, tol: 35 + 3 * k}); } }
  function score(p, spec, uniqueOnly){
    const K = ldPartials(p, sr), t = tpl[p];
    let sw = 0, sd = 0, sr_ = 0, srw = 0, hits = 0, fundOk = false;
    const amps = [];
    for(let k = 1; k <= K; k++){
      const f = ldPartialHz(p, k, cents);
      if(f > sr * 0.45) break;
      if(uniqueOnly && ownedNear(f)) continue;
      const pk = ldPeakNear(spec, f, binHz, 20 + 1.5 * k, 1.2);
      /* a peak in what is left after other notes were taken out has to have
         been a peak before too — the edge of a hole cut for a neighbour's
         partial is not a partial */
      const real = spec === post ? pk.peak : pk.peak && ldPeakNear(post, f, binHz, 20 + 1.5 * k, 1.2).peak;
      if(!real) pk.v *= 0.25;
      const fl = floorAt(f, len);
      /* a partial is a narrow peak standing clear of what is around it; the
         thump of a hammer, broad and low, raises everything near it at once
         and stands clear of nothing */
      const prom = ldDb(pk.v) - ldDb(ldBackground(spec, pk.bin, lobeBins));
      const d = Math.max(0, Math.min(60, ldDb(pk.v) - ldDb(fl), prom + 4));
      const w = t && t.w[k - 1] != null ? 0.25 + t.w[k - 1] : (p < 48 ? 1 : 1 / Math.pow(k, 0.6));
      sw += w; sd += w * d; if(d > 6){ hits++; if(k === 1) fundOk = true; }
      amps.push({k, bin: pk.bin, v: pk.v, d});
      if(d > 6){
        const pp = ldPeakNear(pre, f, binHz, 22, 1.2);
        const dpre = ldDb(pp.v * Math.sqrt(plen / len)) - ldDb(fl);
        sr_ += w * Math.max(-12, Math.min(30, d - Math.max(0, dpre))); srw += w;
      }
    }
    const S = sw ? sd / sw : 0, R = srw ? sr_ / srw : 0;
    /* the salience that ranks candidates against each other: summed, not
       averaged — a low note that explains ten partials outweighs one of its
       own upper partials taken for a note — and marked down for every low
       partial it should have and does not (the octave below a note has
       every other one missing) */
    /* how strong its strongest partials are — a bass note's pitch lives in
       a handful of upper partials and the rest are faint, so an average over
       all twenty would bury it */
    const topN = Math.min(6, Math.max(2, Math.ceil(amps.length / 2)));
    const top6 = amps.map(x => x.d).sort((a, b) => b - a).slice(0, topN);
    const lowHits = amps.filter(x => x.k >= 2 && x.k <= 5 && x.d >= 6).length;
    const Sb = top6.length ? top6.reduce((a, b) => a + b, 0) / top6.length : 0;
    let sal = 0;
    amps.forEach(x => { const d = x.d; const w = 1 / Math.sqrt(x.k);
      if(d >= 6) sal += w * d;
      else if(x.k <= 4 && !(x.k === 1 && p < 45)) sal -= w * 10; });
    /* a fundamental with nothing above it is more likely a partial of
       something lower, or noise; ask for at least two partials heard */
    const need = Math.min(2, amps.length);
    return {S, R, hits, need, amps, fundOk, used: amps.length, sal, Sb, lowHits};
  }
  function remove(p, sc){
    /* spectral smoothness: take off each partial only as much as a smooth
       series would put there, so what is left can be another note's */
    const a = sc.amps.map(x => x.v);
    sc.amps.forEach((x, i) => {
      const nb = [a[i - 1], a[i], a[i + 1]].filter(v => v != null);
      const smooth = nb.reduce((s, v) => s + v, 0) / nb.length;
      const take = Math.min(a[i], smooth * 1.1);
      if(a[i] <= 0) return;
      const frac = Math.max(0, 1 - take / a[i]);
      /* tapered, so what is taken out leaves no edge behind */
      const span = lobeBins * 1.6;
      const lo = Math.max(0, Math.floor(x.bin - span)), hi = Math.min(work.length - 1, Math.ceil(x.bin + span));
      for(let b = lo; b <= hi; b++){
        const u = Math.abs(b - x.bin) / span, wgt = u >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * u);
        work[b] *= 1 - wgt * (1 - frac);
      }
    });
  }
  const isNew = sc => sc.R >= 3 || sc.S - Math.max(0, sc.S - sc.R) >= 8;
  const notes = [], taken = new Set();
  const conf = (sc, thr) => Math.max(0, Math.min(1, 0.5 + (sc.S - thr) / 16));
  const ACCEPT_EXP = eo.expThr != null ? eo.expThr : 9, ACCEPT = eo.thr != null ? eo.thr : 16;
  let top = 0;
  /* the expected notes first, the most evident first */
  const faint = [];
  if(exp){
    const order = exp.map(p => ({p, sc: score(p, work)})).sort((x, y) => y.sc.S - x.sc.S);
    order.forEach(({p}) => {
      /* what is left once the notes already heard are taken out: a note
         whose every partial is also another's (E6 over A4 — a twelfth and
         an octave) shows only as more than that other note alone explains */
      const scU = notes.length ? score(p, work, true) : null;
      const sc = scU && scU.used >= 2 ? scU : score(p, work, false);
      const need = p >= 76 ? 1 : sc.need;
      const thr = Math.max(ACCEPT_EXP, top - 24);
      /* a note just under the bar that clearly rose with the attack was
         struck; one that did not rise is the room, or another string */
      const rescued = sc.S >= thr - 4 && sc.R >= 10 && sc.hits >= 2;
      if(((sc.S >= thr && sc.hits >= need) || rescued) && (isNew(sc) || sc.S >= thr + 10)){
        notes.push({pitch: p, conf: +conf(sc, ACCEPT_EXP).toFixed(2), S: +sc.S.toFixed(1), R: +sc.R.toFixed(1), sal: sc.sal, Sb: sc.Sb, expected: true});
        taken.add(p); top = Math.max(top, sc.S); remove(p, score(p, work, false)); own(p);
      } else faint.push({pitch: p, S: +sc.S.toFixed(1), R: +sc.R.toFixed(1), hits: sc.hits, thr: +thr.toFixed(1)});
    });
  }
  /* then anything else that is plainly there — judged only on partials
     no accepted note accounts for, and against the loudest note struck:
     a key played with the others lands within a dozen or so decibels of
     them, and rises with them; an echo of their partials does neither */
  let topSal = notes.reduce((m, x) => Math.max(m, x.sal || 0), 0), topB = notes.reduce((m, x) => Math.max(m, x.Sb || 0), 0);
  const rises = () => { const r = notes.map(x => x.R).sort((a, b) => a - b); return r.length ? r[r.length >> 1] : 0; };
  for(let iter = 0; iter < 10; iter++){
    let best = null;
    const rNeedNow = notes.length ? Math.max(6, rises() * 0.6) : 3;
    for(let p = 21; p <= 108; p++){
      if(taken.has(p)) continue;
      const sc = score(p, work, notes.length > 0);
      const need = p >= 84 ? 1 : 2;
      if(sc.used < need || sc.hits < need || !isNew(sc)) continue;
      /* above middle C a piano's fundamental is its loudest partial: a
         candidate there without one is somebody's overtone */
      if(p >= 60 && !sc.fundOk) continue;
      /* and below the bass clef's middle a string sounds most in its second
         to fifth partials; without two of those it is not a note */
      if(p < 48 && sc.lowHits < 2) continue;
      if(sc.Sb < Math.max(ACCEPT, topB - (eo.relDb != null ? eo.relDb : 15))) continue;
      /* and on average across its partials, not only its best few */
      if(notes.length && sc.S < Math.max(10, top - 18)) continue;
      if(sc.sal <= 0) continue;
      /* every test is applied before choosing, so that one strong candidate
         failing the last of them does not end the search for the others */
      if(sc.R < rNeedNow || (topSal && sc.sal < topSal * 0.25)) continue;
      if(!best || sc.sal > best.sc.sal) best = {p, sc};
    }
    if(eo.trace){ const q = eo.trace.pitch; if(q != null && !taken.has(q)){ const sc = score(q, work, notes.length > 0);
      eo.trace.log.push({iter, q, S: +sc.S.toFixed(1), Sb: +sc.Sb.toFixed(1), sal: +sc.sal.toFixed(1), R: +sc.R.toFixed(1), hits: sc.hits, used: sc.used, fundOk: sc.fundOk, low: sc.lowHits,
        top: +top.toFixed(1), topB: +topB.toFixed(1), best: best && best.p}); } }
    if(!best) break;
    const thr = Math.max(ACCEPT, top - (eo.relDb != null ? eo.relDb : 15));
    topSal = Math.max(topSal, best.sc.sal); topB = Math.max(topB, best.sc.Sb);
    /* a weak note an octave or a twelfth above a stronger one that came in
       with it is far more often that note's resonance than a key */
    const shadow = notes.some(x => [12, 19, 24].includes(best.p - x.pitch) && x.S > best.sc.S + 6);
    taken.add(best.p);
    const full = score(best.p, work, false);
    remove(best.p, full);
    if(shadow) continue;
    own(best.p);
    notes.push({pitch: best.p, conf: +conf(best.sc, thr).toFixed(2), S: +best.sc.S.toFixed(1), R: +best.sc.R.toFixed(1),
      Sb: +best.sc.Sb.toFixed(1), sal: +best.sc.sal.toFixed(1), low: best.sc.lowHits, used: best.sc.used, expected: false});
    top = Math.max(top, best.sc.S);
  }
  const res = {notes, faint};
  if(exp) res.verify = ldVerifyStep(exp, notes, eo);
  return res;
}

/* ---------- the verdict on one step ----------
   mode: 'exact' (the pitches, in their octaves) or 'pitch-class' (the
   names, in any octave). strictness: 'lenient' | 'standard' | 'strict' —
   lenient forgives an extra note and a missing inner voice; standard
   forgives neither extras nor... (see below); strict forgives nothing. */
function ldVerifyStep(exp, heard, eo){
  const mode = (eo && eo.mode) || 'exact', strict = (eo && eo.strictness) || 'standard';
  const pc = mode === 'pitch-class';
  const key = p => pc ? ((p % 12) + 12) % 12 : p;
  const heardKeys = new Set(heard.map(x => key(x.pitch)));
  const expKeys = [...new Set(exp.map(key))];
  const present = [], missing = [];
  expKeys.forEach(k => (heardKeys.has(k) ? present : missing).push(k));
  const expSet = new Set(expKeys);
  const extra = [...new Set(heard.filter(x => !expSet.has(key(x.pitch))).map(x => x.pitch))];
  const sorted = exp.slice().sort((a, b) => a - b);
  const outer = new Set(pc ? [] : [sorted[0], sorted[sorted.length - 1]]);
  let pass;
  if(strict === 'lenient'){
    /* the outer voices must be there; one inner voice may be missing; extra
       notes are reported but do not fail the step */
    const missOuter = missing.some(k => outer.has(k));
    pass = !missOuter && missing.length <= (expKeys.length >= 4 ? 1 : 0);
  } else if(strict === 'standard'){
    pass = !missing.length && extra.length === 0;
  } else pass = !missing.length && extra.length === 0;
  return {pass, present, missing, extra, mode, strictness: strict};
}

/* ---------- sequences: which played note answers which written one ----------
   Needleman–Wunsch over the two lists, so one wrong or missed note does
   not push everything after it out of line. played: [pitch], expected:
   [pitch]. Returns one row per expected note — {expected, played|null,
   ok} — and the played notes that answered nothing. */
function ldAlign(expected, played, mode){
  const pc = mode === 'pitch-class';
  const same = (a, b) => pc ? ((a - b) % 12 + 12) % 12 === 0 : a === b;
  const E = expected.length, P = played.length;
  const MATCH = 2, MIS = -1, GAP = -1;
  const D = [], T = [];
  for(let i = 0; i <= E; i++){ D.push(new Float64Array(P + 1)); T.push(new Uint8Array(P + 1)); }
  for(let i = 1; i <= E; i++){ D[i][0] = i * GAP; T[i][0] = 1; }
  for(let j = 1; j <= P; j++){ D[0][j] = j * GAP; T[0][j] = 2; }
  for(let i = 1; i <= E; i++) for(let j = 1; j <= P; j++){
    const d = D[i - 1][j - 1] + (same(expected[i - 1], played[j - 1]) ? MATCH : MIS);
    const u = D[i - 1][j] + GAP, l = D[i][j - 1] + GAP;
    if(d >= u && d >= l){ D[i][j] = d; T[i][j] = 0; } else if(u >= l){ D[i][j] = u; T[i][j] = 1; } else { D[i][j] = l; T[i][j] = 2; }
  }
  const rows = [], extra = [];
  let i = E, j = P;
  while(i > 0 || j > 0){
    const t = i > 0 && j > 0 ? T[i][j] : i > 0 ? 1 : 2;
    if(t === 0){ rows.unshift({expected: expected[i - 1], played: played[j - 1], at: j - 1, ok: same(expected[i - 1], played[j - 1])}); i--; j--; }
    else if(t === 1){ rows.unshift({expected: expected[i - 1], played: null, at: null, ok: false}); i--; }
    else { extra.unshift({played: played[j - 1], at: j - 1}); j--; }
  }
  const right = rows.filter(r => r.ok).length;
  return {rows, extra, accuracy: E ? right / E : 1};
}

/* ---------- timing against a grid ----------
   onsets and grid in seconds; each written position takes the nearest
   onset within the window. The signed offsets say early (−) or late (+). */
function ldRhythm(onsets, grid, windowMs){
  const w = (windowMs || 150) / 1000;
  const used = new Set();
  return grid.map(g => {
    let best = -1, bd = Infinity;
    onsets.forEach((t, i) => { const d = Math.abs(t - g.t); if(d < bd && d <= w && !used.has(i)){ bd = d; best = i; } });
    if(best < 0) return {label: g.label, t: g.t, hit: false, offsetMs: null};
    used.add(best);
    return {label: g.label, t: g.t, hit: true, offsetMs: Math.round((onsets[best] - g.t) * 1000)};
  });
}

/* the strictness settings, in one place */
const LD_STRICTNESS = {
  lenient:  {windowMs: 150, extraIsError: false, innerMayMiss: true},
  standard: {windowMs: 80,  extraIsError: true,  innerMayMiss: false},
  strict:   {windowMs: 40,  extraIsError: true,  innerMayMiss: false}
};

/* everything the Worker needs, by name, so it can be rebuilt from source */
const LD_WORKER_PARTS = () => [ldMidiHz, ldDb, ldFFT, ldTwiddles, ldHann, ldSpectrum, ldInharm, ldPartialHz, ldPartials,
  ldPeakNear, ldPeakHz, ldBackground, ldCreate, ldEstimate, ldVerifyStep, ldAlign, ldRhythm];

if(typeof module !== 'undefined' && module.exports) module.exports = {ldCreate, ldEstimate, ldVerifyStep, ldAlign, ldRhythm, ldSpectrum, ldMidiHz, ldPartialHz, LD_STRICTNESS};
