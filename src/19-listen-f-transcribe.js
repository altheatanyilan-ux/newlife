/* ============================================================
   HEARING THE PIANO — the Transcribe Engine: every note, with nothing
   expected.

   The Verify Engine is told what should be there; this one is not. It is
   what Compose uses after a microphone take, and anything else that has to
   write down what was played without knowing it in advance.

   WHY NOT A TRAINED MODEL. The request named two: Magenta's Onsets and
   Frames and Spotify's Basic Pitch. Both are good, and both are
   TensorFlow.js programs whose weights (tens of megabytes) are fetched from
   a server the first time they run — a new runtime dependency and a network
   request, the two things this house does not do. So the in-browser engine
   is the house's own signal processing, run over the whole take after it
   is recorded, in a Worker, with the post-processing the request asks for.
   The engine sits behind an interface (TX_ENGINES) so a better one can be
   put in its place without anything upstream noticing; the one there is
   room for now is a local helper (tools/transcribe.py, ByteDance's
   piano_transcription_inference, which also hears the sustain pedal) whose
   MIDI file Compose imports. That runs on your machine, never in the page.

   What it does, in order:

   1. The take goes through the same onset-and-harmonics analysis the live
      microphone uses (19-listen-a-dsp.js), at the tuning and with the
      string stretch and note shapes this piano has taught it, but faster
      than real time and all at once.

   2. OFFSETS. The microphone never says when a key came up, so each note's
      end is measured: the strength of its first partials frame by frame,
      from the attack until it has fallen 24 dB below its peak, or into the
      room's noise, or until the same key is struck again.

   3. CLEAN-UP. Notes too short or too uncertain to be real go. A note
      "struck" again while the same string is still ringing, with no rise in
      its strength, is the same note heard twice and is joined back up. A
      faint note an octave, a twelfth or two octaves above a loud one that
      began at the same instant is usually the loud one's own partials or a
      string ringing in sympathy under the pedal, and goes too.
   ============================================================ */

/* ---------- the offsets ---------- */
function txFrames(pcm, sr, frame, hop){
  const n = Math.max(0, Math.floor((pcm.length - frame) / hop) + 1);
  const win = ldHann(frame), half = frame / 2 + 1;
  const mags = new Array(n);
  const re = new Float64Array(frame), im = new Float64Array(frame);
  for(let f = 0; f < n; f++){
    const o = f * hop;
    for(let i = 0; i < frame; i++){ re[i] = pcm[o + i] * win[i]; im[i] = 0; }
    ldFFT(re, im);
    const m = new Float32Array(half);
    for(let k = 0; k < half; k++) m[k] = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
    mags[f] = m;
  }
  return mags;
}
function txStrength(mag, p, sr, frame, cents){
  const binHz = sr / frame;
  let s = 0;
  for(let k = 1; k <= 3; k++){
    const f = ldPartialHz(p, k, cents); if(f > sr * 0.45) break;
    const b = Math.round(f / binHz); let best = 0;
    for(let j = b - 1; j <= b + 1; j++) if(j > 0 && j < mag.length && mag[j] > best) best = mag[j];
    s += best / k;
  }
  return s;
}
function txOffsets(pcm, sr, notes, cents, onProgress){
  const frame = 4096, hop = 1024;
  const mags = txFrames(pcm, sr, frame, hop);
  const tOf = f => (f * hop + frame / 2) / sr, fOf = t => Math.max(0, Math.round((t * sr - frame / 2) / hop));
  /* the room: the median strength across all frames, per note, is its floor */
  const floorCache = {};
  const floorOf = p => { if(floorCache[p] != null) return floorCache[p];
    const xs = []; for(let f = 0; f < mags.length; f += 7) xs.push(txStrength(mags[f], p, sr, frame, cents));
    xs.sort((a, b) => a - b); return (floorCache[p] = xs[Math.floor(xs.length * 0.2)] || 1e-6); };
  const byPitch = {}; notes.forEach(n => (byPitch[n.pitch] = byPitch[n.pitch] || []).push(n));
  Object.values(byPitch).forEach(l => l.sort((a, b) => a.onset - b.onset));
  notes.forEach((n, i) => {
    if(onProgress && i % 50 === 0) onProgress(i / notes.length);
    const f0 = fOf(n.onset), fl = floorOf(n.pitch);
    const next = byPitch[n.pitch].find(x => x.onset > n.onset + 0.03);
    const fMax = Math.min(mags.length - 1, fOf(next ? next.onset : n.onset + 8));
    let peak = 0, pf = f0;
    for(let f = f0; f <= Math.min(fMax, f0 + 5); f++){ const s = txStrength(mags[f], n.pitch, sr, frame, cents); if(s > peak){ peak = s; pf = f; } }
    const stop = Math.max(peak * Math.pow(10, -24 / 20), fl * 2);
    let end = fMax, below = 0;
    for(let f = pf + 1; f <= fMax; f++){
      const s = txStrength(mags[f], n.pitch, sr, frame, cents);
      if(s < stop){ if(++below >= 2){ end = f - 1; break; } } else below = 0;
    }
    n.offset = +Math.max(n.onset + 0.05, next ? Math.min(tOf(end), next.onset) : tOf(end)).toFixed(3);
    n.peak = peak; n.floor = fl;
    /* for the merge: was the strength rising at this onset, or only carrying on? */
    const before = f0 >= 3 ? txStrength(mags[f0 - 3], n.pitch, sr, frame, cents) : 0;
    n.rise = before > 0 ? 20 * Math.log10(Math.max(1e-9, peak) / before) : 60;
  });
  return notes;
}
/* ---------- the clean-up ---------- */
function txPost(notes, opts){
  const o = Object.assign({minConf: 0.4, minDur: 0.05, mergeDb: 3}, opts || {});
  if(o.minConf == null) o.minConf = 0.4;
  let out = notes.filter(n => n.confidence >= o.minConf).sort((a, b) => a.onset - b.onset || a.pitch - b.pitch);
  /* the same string heard twice while ringing, with no new attack */
  const kept = [];
  out.forEach(n => {
    const prev = kept.filter(k => k.pitch === n.pitch && k.offset >= n.onset - 0.02).pop();
    if(prev && n.rise < o.mergeDb){ prev.offset = Math.max(prev.offset, n.offset); prev.merged = (prev.merged || 0) + 1; return; }
    kept.push(n);
  });
  /* partials and sympathy: a faint note a 12th/octave/two octaves over a loud one begun with it */
  const loud = kept.slice();
  out = kept.filter(q => !loud.some(p => p !== q && Math.abs(p.onset - q.onset) < 0.04 && [12, 19, 24, 28, 31].includes(q.pitch - p.pitch)
    && (p.S != null && q.S != null ? p.S - q.S > (o.shadowDb != null ? o.shadowDb : 10) : q.velocity < 0.75 * p.velocity + 0.05) && q.confidence < (o.shadowConf != null ? o.shadowConf : 0.9)));
  out = out.filter(n => n.offset - n.onset >= o.minDur);
  return out;
}
/* ---------- what each onset struck: the rise, explained note by note ----------
   Offline, with the whole take in hand, each onset is looked at through what
   got LOUDER at it: the spectrum just after, less the spectrum just before
   (taken at its loudest over the width of a partial, so a note that is only
   ringing on cancels out). What is left is the new notes and nothing else.
   Then the note that explains most of it — its partials weighted toward the
   lower ones (Klapuri's harmonic summation) — is taken, what it accounts for
   is removed as smoothly as a real series would have it, and the next, until
   nothing that remains stands out. */
function txFloor(pcm, sr, nfft){
  const at = i => i >= 0 && i < pcm.length ? pcm[i] : 0, len = 4096, cols = [];
  const step = Math.max(len, Math.floor(pcm.length / 60));
  for(let s0 = 0; s0 + len < pcm.length; s0 += step) cols.push(ldSpectrum(at, s0, len, nfft));
  const nb = nfft / 2 + 1, f = new Float32Array(nb);
  if(!cols.length){ f.fill(1e-6); return f; }
  const col = new Float32Array(cols.length), q = Math.floor(cols.length * 0.15);
  for(let k = 0; k < nb; k++){ for(let h = 0; h < cols.length; h++) col[h] = cols[h][k]; col.sort(); f[k] = Math.max(1e-7, col[q]); }
  /* smoothed, so one quiet bin does not make a hole */
  const g = new Float32Array(nb);
  for(let k = 0; k < nb; k++){ let m = 0, c = 0; for(let j = Math.max(0, k - 8); j <= Math.min(nb - 1, k + 8); j++){ m += f[j]; c++; } g[k] = m / c; }
  return g;
}
function txRiseNotes(pcm, sr, t0, until, cents, floor, T){
  const at = i => i >= 0 && i < pcm.length ? pcm[i] : 0;
  const nfft = 16384, binHz = sr / nfft;
  const postStart = t0 - Math.round(0.004 * sr);
  const postLen = Math.max(Math.round(0.04 * sr), Math.min(Math.round((T.postSec || 0.09) * sr), until - postStart));
  const preLen = Math.round(0.07 * sr);
  const post = ldSpectrum(at, postStart, postLen, nfft);
  const pre = ldSpectrum(at, t0 - Math.round(0.01 * sr) - preLen, preLen, nfft);
  const lobe = Math.max(1, Math.ceil(2 * nfft / Math.min(postLen, preLen)));
  const D = new Float32Array(post.length);
  for(let k = 0; k < post.length; k++){
    let m = 0; for(let j = Math.max(0, k - lobe); j <= Math.min(pre.length - 1, k + lobe); j++) if(pre[j] > m) m = pre[j];
    D[k] = Math.max(0, post[k] - (T.preK || 1) * m);
  }
  const noiseAt = f => floor[Math.min(floor.length - 1, Math.max(0, Math.round(f / binHz)))] * (T.noiseK || 4);
  const work = D;
  const partialsOf = p => { const f1 = ldMidiHz(p, cents); return Math.max(1, Math.min(p < 40 ? 16 : p < 55 ? 12 : p < 70 ? 9 : p < 84 ? 6 : 3, Math.floor(Math.min(sr * 0.45, 6500) / f1))); };
  const sal = p => {
    const f1 = ldMidiHz(p, cents), K = partialsOf(p);
    let s = 0, hits = 0, fund = 0, low = 0; const amps = [];
    for(let k = 1; k <= K; k++){
      const f = ldPartialHz(p, k, cents), pk = ldPeakNear(work, f, binHz, 22 + 2 * k, 1.2);
      const v = pk.peak ? pk.v : pk.v * 0.3, loud = v > noiseAt(f);
      const g = (f1 + 52) / (k * f1 + 320);
      if(loud){ s += g * v; hits++; if(k === 1) fund = v; if(k >= 2 && k <= 5) low++; }
      amps.push({k, bin: pk.bin, v: loud ? v : 0});
    }
    return {s, hits, fund, low, amps, K};
  };
  const remove = sc => {
    const a = sc.amps.map(x => x.v);
    sc.amps.forEach((x, i) => { if(!a[i]) return;
      const nb = [a[i - 1], a[i], a[i + 1]].filter(v => v != null && v > 0);
      const take = Math.min(a[i], (nb.reduce((q, v) => q + v, 0) / nb.length) * 1.15);
      const frac = Math.max(0, 1 - take / a[i]);
      const span = lobe * 1.5, lo = Math.max(0, Math.floor(x.bin - span)), hi = Math.min(work.length - 1, Math.ceil(x.bin + span));
      for(let b = lo; b <= hi; b++){ const u = Math.abs(b - x.bin) / span, w = u >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * u); work[b] *= 1 - w * (1 - frac); } });
  };
  const out = []; let first = null;
  for(let it = 0; it < (T.maxNotes || 8); it++){
    let best = null;
    for(let p = 21; p <= 108; p++){
      if(out.some(n => n.pitch === p)) continue;
      const sc = sal(p);
      const need = p >= 84 ? 1 : p < 48 ? 3 : 2;
      if(sc.hits < need) continue;
      if(p >= 57 && !sc.fund) continue;              /* above the bass, a piano's fundamental is there */
      if(p < 45 && sc.low < 2) continue;
      if(!best || sc.s > best.sc.s) best = {p, sc};
    }
    if(!best) break;
    if(!first) first = best.sc.s;
    /* an octave, a twelfth or two octaves over a note already taken is most often what that note left behind */
    const over = out.some(n => [12, 19, 24, 28, 31].includes(best.p - n.pitch));
    if(best.sc.s < first * (over ? (T.octRel || 0.4) : (T.relStop || 0.2))){ if(over){ remove(best.sc); out.skip = (out.skip || 0) + 1; if(out.skip < 3) continue; } break; }
    /* a candidate an octave or a twelfth above one already taken must stand well clear of what that one left */
    remove(best.sc);
    const conf = Math.max(0.2, Math.min(1, 0.35 + 0.65 * best.sc.s / first));
    let e = 0; best.sc.amps.forEach(x => e += x.v * x.v);
    const fl = noiseAt(ldMidiHz(best.p, cents)) / (T.noiseK || 4);
    const vel = Math.max(0.05, Math.min(1, (10 * Math.log10(Math.max(1e-18, e)) - 20 * Math.log10(Math.max(1e-9, fl)) - 6) / 60));
    out.push({pitch: best.p, conf: +conf.toFixed(2), vel: +vel.toFixed(2), S: +(20 * Math.log10(Math.max(1e-9, best.sc.s))).toFixed(1)});
  }
  out.first = first || 0;
  return out;
}
/* ---------- the whole engine, in one place (it runs in a Worker) ---------- */
function txRunDsp(pcm, sr, opts, progress){
  const o = opts || {};
  /* the onset detector and the note search, set for writing everything down rather than for
     refusing extras: softer onsets count, and a note needs less to stand out from a chord */
  const T = Object.assign({}, TX_TUNING, o.tuning || {});
  const an = ldCreate(sr, {cents: o.cents || 0, templates: o.templates || null, inharm: o.inharm || null,
    minFlux: T.minFlux, medK: T.medK, medAdd: T.medAdd, maskSec: T.maskSec, maskRatio: T.maskRatio, refractory: T.refractory, onsetBias: T.onsetBias});
  an.expect(null, {thr: T.thr, relDb: T.relDb, riseMin: T.riseMin, riseK: T.riseK, sMin: T.sMin, sRel: T.sRel});
  const ev = [];
  const step = 8192;
  for(let i = 0; i < pcm.length; i += step){
    const r = an.push(pcm.subarray(i, Math.min(pcm.length, i + step)));
    r.forEach(e => ev.push(e));
    if(progress && (i / step) % 24 === 0) progress(0.7 * i / pcm.length, 'Hearing the notes…');
  }
  an.flush().forEach(e => ev.push(e));
  const cents = an.tuning();
  const notes = [];
  if((o.engine || T.engine) === 'rise'){
    /* the onsets from the live detector; what they struck, from the rise */
    const floor = txFloor(pcm, sr, 16384);
    const ons = ev.filter(e => e.type === 'onset').map(e => Math.round(e.t * sr));
    const per = ons.map((t0, i) => {
      if(progress && i % 20 === 0) progress(0.4 + 0.3 * i / ons.length, 'Hearing the notes…');
      const until = i + 1 < ons.length ? ons[i + 1] - Math.round(0.004 * sr) : t0 + Math.round(0.1 * sr);
      return {t0, got: txRiseNotes(pcm, sr, t0, until, cents, floor, T)};
    });
    /* an "onset" whose rise is a small fraction of a typical attack in this take is the room or a decay, not a key */
    const firsts = per.map(x => x.got.first).filter(v => v > 0).sort((a, b) => a - b);
    const typical = firsts.length ? firsts[Math.floor(firsts.length * 0.5)] : 0;
    per.forEach(({t0, got}) => { if(got.first < typical * (T.onsetRel || 0.1)) return;
      got.forEach(n => notes.push({pitch: n.pitch, onset: +(t0 / sr + (T.shift || 0)).toFixed(4), offset: null, velocity: n.vel, confidence: n.conf, S: n.S, source: 'mic'})); });
  } else ev.forEach(e => { if(e.type !== 'notes') return; e.notes.forEach(n => notes.push({pitch: n.pitch, onset: +(e.t + (T.shift || 0)).toFixed(4), offset: null, velocity: n.vel != null ? n.vel : 0.6, confidence: n.conf, S: n.S, source: 'mic'})); });
  if(progress) progress(0.72, 'Finding where each note ends…');
  txOffsets(pcm, sr, notes, cents, f => progress && progress(0.72 + 0.25 * f, 'Finding where each note ends…'));
  const clean = txPost(notes, o);
  if(progress) progress(1, 'Done');
  return {notes: clean.map(n => ({pitch: n.pitch, onset: n.onset, offset: n.offset, velocity: n.velocity, confidence: n.confidence, source: 'mic'})),
    raw: notes.length, cents, pedal: []};
}
const TX_WORKER_PARTS = () => [txFrames, txStrength, txOffsets, txPost, txFloor, txRiseNotes, txRunDsp];
/* the settings the test set chose (smoke246 reports the F1 they give) */
const TX_TUNING = {engine: 'rise', shift: -0.015, relStop: 0.2, octRel: 0.4, onsetRel: 0.2, minFlux: 3.5, medK: 1.4, medAdd: 3, maskSec: 0.09, maskRatio: 0.5, refractory: 0.045, onsetBias: 0, thr: 16, relDb: 15, riseMin: 6, riseK: 0.6, sMin: 10, sRel: 18};

/* ---------- the interface ---------- */
const TX_ENGINES = {
  dsp: {name: 'Built in', about: 'This device’s own signal processing, in a Worker. Nothing to install, nothing fetched.',
    available: () => typeof Worker === 'function'},
  helper: {name: 'Local helper', about: 'tools/transcribe.py on your own computer (ByteDance piano_transcription_inference, which also hears the pedal). It writes a MIDI file; import it here.',
    available: () => true}
};
let _txUrl = null;
function txWorkerUrl(){
  if(_txUrl) return _txUrl;
  const parts = LD_WORKER_PARTS().concat(TX_WORKER_PARTS()).map(f => f.toString()).join('\n');
  const src = `'use strict';\nconst TX_TUNING = ${JSON.stringify(TX_TUNING)};\n${parts}\nonmessage = e => { const m = e.data; try {
    const r = txRunDsp(m.pcm, m.sr, m.opts || {}, (f, text) => postMessage({type: 'progress', f, text}));
    postMessage({type: 'done', result: r});
  } catch(err){ postMessage({type: 'error', message: String(err && err.message || err)}); } };`;
  _txUrl = URL.createObjectURL(new Blob([src], {type: 'text/javascript'}));
  return _txUrl;
}
/* pcm: Float32Array, mono; returns {notes, cents, pedal, ms, where} */
function txTranscribe(pcm, sr, opts, onProgress){
  const t0 = performance.now();
  const dev = txDeviceProfile();
  const o = Object.assign({cents: dev ? dev.cents : 0, templates: dev ? dev.templates : null, inharm: dev ? dev.inharm : null}, opts || {});
  if(typeof Worker !== 'function' || o.inPage){
    const r = txRunDsp(pcm, sr, o, onProgress);
    return Promise.resolve(Object.assign(r, {ms: Math.round(performance.now() - t0), where: 'page'}));
  }
  return new Promise((res, rej) => {
    let w;
    try { w = new Worker(txWorkerUrl()); } catch(e){ const r = txRunDsp(pcm, sr, o, onProgress); res(Object.assign(r, {ms: Math.round(performance.now() - t0), where: 'page'})); return; }
    w.onmessage = e => { const m = e.data;
      if(m.type === 'progress'){ if(onProgress) onProgress(m.f, m.text); return; }
      w.terminate();
      if(m.type === 'done') res(Object.assign(m.result, {ms: Math.round(performance.now() - t0), where: 'worker'}));
      else rej(new Error(m.message)); };
    w.onerror = e => { w.terminate(); rej(new Error(e.message || 'The transcription failed.')); };
    const copy = new Float32Array(pcm);
    const wo = {cents: o.cents, templates: o.templates, inharm: o.inharm}; if(o.minConf != null) wo.minConf = o.minConf;
    w.postMessage({pcm: copy, sr, opts: wo}, [copy.buffer]);
  });
}
/* what the microphone last learned about the piano (tuning, stretch, note shapes) */
function txDeviceProfile(){
  try { const L = listenState(); const ds = Object.values(L.devices || {}).sort((a, b) => String(b.lastUsed || '').localeCompare(String(a.lastUsed || ''))); return ds[0] || null; } catch(e){ return null; }
}
/* ---------- a MIDI file (the helper's, or any) as NoteEvents and pedal ---------- */
function txReadMidi(bytes){
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let p = 0;
  const u32 = () => { const v = (b[p] << 24 | b[p + 1] << 16 | b[p + 2] << 8 | b[p + 3]) >>> 0; p += 4; return v; };
  const u16 = () => { const v = b[p] << 8 | b[p + 1]; p += 2; return v; };
  const vlq = () => { let v = 0, c; do { c = b[p++]; v = (v << 7) | (c & 0x7f); } while(c & 0x80); return v; };
  const tag = () => String.fromCharCode(b[p], b[p + 1], b[p + 2], b[p + 3]);
  if(tag() !== 'MThd') throw new Error('That is not a MIDI file.');
  p += 4; const hl = u32(); const fmt = u16(), ntr = u16(), div = u16(); p += hl - 6;
  const raw = [], tempos = [{tick: 0, us: 500000}];
  for(let t = 0; t < ntr && p < b.length; t++){
    while(p < b.length && tag() !== 'MTrk'){ p += 4; const l = u32(); p += l; }
    if(p >= b.length) break;
    p += 4; const len = u32(), end = p + len;
    let tick = 0, run = 0;
    while(p < end){
      tick += vlq();
      let st = b[p];
      if(st & 0x80) p++; else st = run;
      if(st === 0xff){ const ty = b[p++], l = vlq(); if(ty === 0x51) tempos.push({tick, us: b[p] << 16 | b[p + 1] << 8 | b[p + 2]}); p += l; continue; }
      if(st === 0xf0 || st === 0xf7){ const l = vlq(); p += l; continue; }
      run = st;
      const hi = st & 0xf0, a = b[p++], c2 = hi === 0xc0 || hi === 0xd0 ? 0 : b[p++];
      raw.push({tick, hi, a, v: c2});
    }
    p = end;
  }
  tempos.sort((x, y) => x.tick - y.tick);
  const sec = tick => { let s = 0, last = 0, us = 500000; for(const tp of tempos){ if(tp.tick > tick) break; s += (tp.tick - last) * us / div / 1e6; last = tp.tick; us = tp.us; } return s + (tick - last) * us / div / 1e6; };
  raw.sort((x, y) => x.tick - y.tick);
  const open = {}, notes = [], pedal = [];
  raw.forEach(r => {
    const t = sec(r.tick);
    if(r.hi === 0x90 && r.v > 0){ const n = {pitch: r.a, onset: t, offset: null, velocity: +(r.v / 127).toFixed(2), confidence: 1, source: 'midi'}; (open[r.a] = open[r.a] || []).push(n); notes.push(n); }
    else if(r.hi === 0x80 || (r.hi === 0x90 && r.v === 0)){ const l = open[r.a]; if(l && l.length){ l.shift().offset = t; } }
    else if(r.hi === 0xb0 && r.a === 64){ const down = r.v >= 64; if(!pedal.length || pedal[pedal.length - 1].down !== down) pedal.push({t, down}); }
  });
  notes.forEach(n => { if(n.offset == null) n.offset = n.onset + 0.5; });
  return {notes, pedal, format: fmt};
}
/* ---------- a take as a WAV file (for keeping, and for the recording-sync path) ---------- */
function txWav(pcm, sr){
  const n = pcm.length, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const s = (o, t) => { for(let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  s(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); s(8, 'WAVE'); s(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); s(36, 'data'); v.setUint32(40, n * 2, true);
  for(let i = 0; i < n; i++){ const x = Math.max(-1, Math.min(1, pcm[i])); v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true); }
  return new Blob([buf], {type: 'audio/wav'});
}
/* ---------- recording the microphone, for a take ----------
   The same honest microphone the live listener asks for (no echo
   cancellation, no noise suppression, no automatic gain), captured whole.
   The samples are held in memory for the transcription and let go
   afterwards unless you choose to keep the take. */
async function txMicRecord(){
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('This browser offers no microphone.');
  const stream = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1}});
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC({latencyHint: 'interactive'});
  const src = ctx.createMediaStreamSource(stream);
  const chunks = []; let n = 0, level = 0;
  let node = null, sp = null;
  const take = d => { chunks.push(d); n += d.length; let e = 0; for(let i = 0; i < d.length; i += 4) e += d[i] * d[i]; level = Math.sqrt(e / (d.length / 4)); };
  if(ctx.audioWorklet && typeof AudioWorkletNode === 'function' && typeof listenWorkletUrl === 'function'){
    try {
      listenWorkletUrl();
      let ok = false; for(const u of _li.workletUrls){ try { await ctx.audioWorklet.addModule(u); ok = true; break; } catch(e){} }
      if(!ok) throw new Error('no worklet');
      node = new AudioWorkletNode(ctx, 'li-capture', {numberOfInputs: 1, numberOfOutputs: 0, channelCount: 1});
      const ch = new MessageChannel();
      node.port.postMessage({port: ch.port1}, [ch.port1]);
      ch.port2.onmessage = e => { const d = e.data; if(d && d.start != null) return; take(d); };
      src.connect(node);
    } catch(e){ node = null; }
  }
  if(!node){ sp = ctx.createScriptProcessor(4096, 1, 1); sp.onaudioprocess = e => take(e.inputBuffer.getChannelData(0).slice()); src.connect(sp); sp.connect(ctx.destination); }
  const off = () => { try { const ts = ctx.getOutputTimestamp(); if(ts && ts.performanceTime) return ts.performanceTime / 1000 - ts.contextTime; } catch(e){} return performance.now() / 1000 - ctx.currentTime; };
  const startedAt = performance.now() / 1000;
  return {sr: ctx.sampleRate, startedAt, level: () => level, seconds: () => n / ctx.sampleRate,
    async stop(){
      try { stream.getTracks().forEach(t => t.stop()); } catch(e){}
      try { node && node.disconnect(); sp && sp.disconnect(); src.disconnect(); } catch(e){}
      const pcm = new Float32Array(n); let p = 0; chunks.forEach(c => { pcm.set(c, p); p += c.length; });
      try { await ctx.close(); } catch(e){}
      return {pcm, sr: ctx.sampleRate, startedAt};
    }};
}
