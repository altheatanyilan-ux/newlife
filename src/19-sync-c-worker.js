/* ============================================================
   RECORDING SYNC — THE ENGINE IN A WORKER

   The engine (19-sync-b-engine.js) is one self-contained function; its
   source becomes a Blob, the Blob a Worker, so the analysis never holds
   the page. A Blob worker needs no file beside index.html and runs from
   file:// as well as from a server. Where a Worker cannot be made at
   all, the same function runs on the page, and says so.

   What goes in: the recording as mono samples at 11 025 Hz (decoded and
   resampled here by the browser's own OfflineAudioContext) and the chart
   as the engine reads it. What comes back: the sync map's fields, a
   per-bar confidence log, and the computed features, which the caller
   may keep so that re-aligning against another chart or form skips the
   analysis. Nothing here uploads anything: the audio stays in this
   browser.
   ============================================================ */

/* the tempo a tune's tempo word implies, for the beat tracker's prior */
const SYNC_TEMPO_WORDS = [[/ballad/i, 66], [/slow/i, 80], [/bossa|samba/i, 132], [/latin/i, 150], [/waltz/i, 140],
  [/medium[\s-]*up|med\.?\s*up/i, 190], [/medium[\s-]*fast/i, 200], [/medium[\s-]*slow/i, 104], [/medium[\s-]*swing/i, 140],
  [/medium/i, 132], [/up|fast|bright/i, 250], [/blues/i, 132], [/swing/i, 150]];
function syncTempoHint(word, fallback){
  const n = +String(word || '').replace(/[^\d.]/g, '');
  if(n >= 30 && n <= 360) return n;
  for(const [re, bpm] of SYNC_TEMPO_WORDS) if(re.test(String(word || ''))) return bpm;
  return fallback || 120;
}

/* A tune from the database (or one the user added) as the engine reads
   it: its chart unrolled, the tempo word as a number, and the other
   ways the chart might be laid out, to try when the first fits badly. */
function syncScoreFromTune(tune){
  const u = syncUnrollChart(tune);
  const score = syncScoreFromUnrolled(u, tune);
  /* the other readings of the form, for the retry */
  const alt = [];
  const want = +tune.measures || 0;
  ['as written', 'first section repeated'].forEach(how => {
    if(how === u.how) return;
    const v = syncUnrollChartAs(tune, how);
    if(v && v.measures && v.measures !== u.measures && (!want || Math.abs(v.measures - want) <= want * 0.5))
      alt.push(Object.assign(syncScoreFromUnrolled(v, tune), {how, form: syncFormOf(v)}));
  });
  score.alternates = alt;
  return score;
}
function syncScoreFromUnrolled(u, tune){
  return {bars: u.bars.map(b => ({beats: b.beats, fermata: !!b.fermata,
      chords: b.chords.map(c => ({root: c.root, bass: c.bass, quality: c.quality, q: c.q, beats: c.beats, at: c.at, text: c.text}))})),
    beats: u.beats, measureBeats: u.measureBeats || null, sections: u.sections || [],
    tempoHint: syncTempoHint(tune && tune.tempo, 132), how: u.how, form: syncFormOf(u)};
}
/* the chart read one particular way */
function syncUnrollChartAs(tune, how){
  const t = Object.assign({}, tune);
  if(how === 'as written') t.measures = 0;
  const u = syncUnrollChart(t);
  if(how === 'as written') return u;
  if(how === 'first section repeated' && u.sections.length > 1 && u.sections[0].label){
    const n = u.sections[0].length;
    const bars = u.bars.slice(0, n).map(b => Object.assign({}, b)).concat(u.bars.map(b => Object.assign({}, b)));
    bars.forEach((b, i) => b.i = i);
    const sections = [{label: u.sections[0].label, start: 1, length: n}].concat(u.sections.map(s => Object.assign({}, s, {start: s.start + n})));
    return Object.assign(syncFormFromBars(bars), {sections, how});
  }
  return null;
}

/* A MusicXML score as the engine reads it (the Repertoire's path): not
   chord symbols but the notes themselves, a quarter note at a time, as
   pitch-class weights — the treble everything sounding (a note struck in
   that quarter counts more than one held into it), the bass its lowest
   note. For a written-out piece this is a far better picture of the sound
   than any chord name. The whole piece is one pass ("chorus"); the
   engine does not look for it to come round again.

   Performers do not always take the repeats. The score is offered as
   written and, where it has repeats, as played without them (first
   endings left out); the engine keeps whichever the recording fits. */
function syncScoreFromMusicXml(xml){
  const tl = xml && xml.order && xml.measures ? xml : musicXmlTimeline(xml);
  /* each written bar's quarters, from the first time it is played */
  const firstPerf = new Map();
  tl.order.forEach((k, i) => { if(!firstPerf.has(k)) firstPerf.set(k, i); });
  const evs = (tl.events || []).filter(e => !e.chord && !e.perc && e.midi != null);
  const byPerf = new Map();
  evs.forEach(e => { if(!byPerf.has(e.perf)) byPerf.set(e.perf, []); byPerf.get(e.perf).push(e); });
  const barTpl = new Map();
  const quartersOf = k => Math.max(1, Math.round((tl.measures[k] && tl.measures[k].len) || 4));
  firstPerf.forEach((i, k) => {
    const len = (tl.measures[k] && tl.measures[k].len) || 4, n = quartersOf(k);
    const list = byPerf.get(i) || [];
    /* notes still sounding from the bar before */
    /* written lengths, not the pedal's: a template is what the score
       sounds on that beat, and a pedalled note ringing on is already in
       the audio's own blur — counting it twice drags each bar toward the
       one before */
    const carry = (byPerf.get(i - 1) || []).filter(e => e.inBar + e.d > ((tl.measures[tl.order[i - 1]] || {}).len || 4) - 1e-6)
      .map(e => ({midi: e.midi, inBar: 0, d: e.inBar + e.d - ((tl.measures[tl.order[i - 1]] || {}).len || 4), carried: true}));
    const all = list.concat(carry);
    const chords = [];
    for(let u = 0; u < n; u++){
      const a = u * len / n, z = (u + 1) * len / n;
      const tre = new Array(12).fill(0), bas = new Array(12).fill(0);
      let low = null;
      /* the notes struck on this beat itself, for placing it on their attack */
      const on = [...new Set(list.filter(e => Math.abs(e.inBar - a) < 0.03).map(e => e.midi))];
      /* every note struck within this beat, with where in the beat (0–1) */
      const ons = list.filter(e => e.inBar >= a - 0.03 && e.inBar < z - 0.03).map(e => [Math.max(0, Math.min(0.999, (e.inBar - a) / (z - a))), e.midi]);
      all.forEach(e => { const s = e.inBar, f = e.inBar + e.d; if(f <= a + 1e-6 || s >= z - 1e-6) return;
        const w = Math.min(f, z) - Math.max(s, a);
        tre[((e.midi % 12) + 12) % 12] += w * (!e.carried && s >= a - 1e-6 ? 1.5 : 1);
        if(low == null || e.midi < low) low = e.midi; });
      if(low != null) bas[((low % 12) + 12) % 12] = 1;
      chords.push({template: tre.map(v => Math.sqrt(v)).concat(bas.map(v => v * 0.8)), beats: 1, at: u, root: low == null ? null : ((low % 12) + 12) % 12, harmonics: true, on, ons});
    }
    /* the bar's own notes, as the score would sound them: where, how long
       (the pedal's length where the pedal is marked), how loud, and a
       fermata — what the engine plays through as its reference */
    const notes = list.map(e => [+e.inBar.toFixed(4), +Math.max(0.05, e.held || e.d || 0.1).toFixed(4), e.midi, +(e.vel || 0.6).toFixed(2), e.fermata ? 1 : 0]);
    const q0 = (tl.perf[i] || {}).q0 || 0;
    let bpm = null; (tl.tempos || []).forEach(t => { if(t.q <= q0 + 1e-6) bpm = t.bpm; });
    const info = (tl.barInfo || [])[k] || {};
    barTpl.set(k, {beats: n, chords, number: (tl.measures[k] || {}).number, notes, len, bpm, words: info.words || '', tempoWord: info.tempoWord || null});
  });
  const build = (order, how) => {
    const bars = order.map((k, i) => ({i, k, number: (tl.measures[k] || {}).number, beats: quartersOf(k), fermata: /fermata/i.test(((tl.barInfo || [])[k] || {}).words || '')}));
    const u = syncFormFromBars(bars, {how});
    return {bars: order.map(k => { const t = barTpl.get(k);
        return {beats: t.beats, chords: t.chords, k, number: t.number, notes: t.notes, len: t.len, bpm: t.bpm, words: t.words, tempoWord: t.tempoWord}; }),
      beats: u.beats, measureBeats: u.measureBeats || null, sections: [], singlePass: true,
      tempoHint: tl.bpm || 96, how, form: syncFormOf(u), order: order.slice()};
  };
  const score = build(tl.order, 'as written');
  /* every way of taking or skipping the repeats; bar numbers as printed */
  const info = (tl.barInfo || []).map((b, k) => Object.assign({}, b, {number: (tl.measures[k] || {}).number}));
  score.alternates = info.some(b => b.back) ? syncRoadMapReadings(info).slice(1).map(r => build(r.order,
    r.how.replace(/bars? ([\d, ]+)$/, (m, list) => 'bar' + (list.includes(',') ? 's ' : ' ') + list.split(',').map(x => (tl.measures[+x.trim() - 1] || {}).number || x.trim()).join(', ')))) : [];
  return score;
}

/* ---------- decoding: the recording at the engine's rate ---------- */
/* The file decoded by the browser, made mono at its own rate, and handed
   to the engine as it is: the engine brings it down to 11 025 Hz itself,
   through a proper low-pass (a windowed sinc) in the Worker. The browser's
   own resampling (an OfflineAudioContext at a lower rate) is NOT used: it
   interpolates without filtering first, and a recording's cymbals and
   upper partials fold down into exactly the range the harmony is read
   from — enough to make it hear the wrong key. */
async function syncDecodeForEngine(arrayBuffer){
  const AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) throw new Error('This browser cannot decode audio.');
  const ctx = new AC();
  let buf;
  try { buf = await ctx.decodeAudioData(arrayBuffer.slice(0)); } finally { try { ctx.close(); } catch(e){} }
  const n = buf.length, ch = buf.numberOfChannels, pcm = new Float32Array(n);
  for(let c = 0; c < ch; c++){ const d = buf.getChannelData(c); for(let i = 0; i < n; i++) pcm[i] += d[i] / ch; }
  return {pcm, sr: buf.sampleRate, duration: buf.duration};
}

/* ---------- the Worker ---------- */
let _syncWorkerUrl = null;
function syncWorkerUrl(){
  if(_syncWorkerUrl) return _syncWorkerUrl;
  const src = `'use strict';
const ENGINE = (${syncEngineModule.toString()})();
onmessage = e => {
  const m = e.data || {};
  const progress = (text, fraction) => postMessage({type: 'progress', id: m.id, text, fraction});
  try {
    let r;
    if(m.op === 'analyse') r = ENGINE.analyse(m.pcm, m.sr, {progress, tempoHint: m.score && m.score.tempoHint});
    else if(m.op === 'align') r = ENGINE.align(m.features, m.score, {progress, transposition: m.transposition});
    else r = ENGINE.run(m.pcm, m.sr, m.score, Object.assign({}, m.engine || {}, {progress, keepFeatures: !!m.keepFeatures, features: m.features || null, transposition: m.transposition}));
    postMessage({type: 'done', id: m.id, result: r});
  } catch(err){ postMessage({type: 'error', id: m.id, message: String(err && err.message || err)}); }
};`;
  _syncWorkerUrl = URL.createObjectURL(new Blob([src], {type: 'text/javascript'}));
  return _syncWorkerUrl;
}
/**
 * Align a recording to a score, off the page.
 * @param {{pcm, sr}|{features}} audio — samples (any rate; 11 025 Hz is quickest) or features from an earlier run
 * @param {object} score — syncScoreFromTune / syncScoreFromMusicXml
 * @param {{onProgress?, keepFeatures?, transposition?, pieceId?, recordingId?}} opts
 * @returns {Promise<{syncMap, perBar, diagnostics, features?, inWorker}>}
 */
function syncAlign(audio, score, opts = {}){
  const on = opts.onProgress || (() => {});
  const wrap = (r, inWorker) => {
    const map = syncMapNew({pieceId: opts.pieceId || null, recordingId: opts.recordingId || null, transposition: r.transposition,
      tuningOffsetCents: r.tuningOffsetCents, form: r.form || score.form, performanceOrder: r.performanceOrder, syncPoints: r.syncPoints,
      overallConfidence: r.overallConfidence, engineVersion: r.engineVersion});
    return {syncMap: map, perBar: r.perBar, diagnostics: Object.assign({}, r.diagnostics, {analyseMs: r.analyseMs, alignMs: r.alignMs,
      retried: !!r.retried, alternate: r.alternate || null}), features: r.features || null, inWorker};
  };
  const msg = {op: 'run', id: Math.random().toString(36).slice(2), pcm: audio.pcm || null, sr: audio.sr || 11025,
    features: audio.features || null, score, keepFeatures: !!opts.keepFeatures, transposition: opts.transposition, engine: opts.engine || null};
  let w = null;
  try { w = new Worker(syncWorkerUrl()); } catch(e){ w = null; }
  if(!w){
    /* no Worker: the same engine on the page */
    return new Promise((res, rej) => setTimeout(() => {
      try { const E = syncEngineModule();
        const r = E.run(msg.pcm, msg.sr, score, Object.assign({}, msg.engine || {}, {progress: on, keepFeatures: msg.keepFeatures, features: msg.features, transposition: msg.transposition}));
        res(wrap(r, false)); } catch(err){ rej(err); }
    }, 0));
  }
  return new Promise((res, rej) => {
    w.onmessage = e => { const m = e.data || {};
      if(m.id !== msg.id) return;
      if(m.type === 'progress') on(m.text, m.fraction);
      else if(m.type === 'done'){ w.terminate(); res(wrap(m.result, true)); }
      else if(m.type === 'error'){ w.terminate(); rej(new Error(m.message)); } };
    w.onerror = e => { w.terminate(); rej(new Error(e.message || 'The analysis stopped.')); };
    /* the samples are handed over, not copied */
    const tr = msg.pcm && msg.pcm.buffer && !opts.keepPcm ? [msg.pcm.buffer] : [];
    w.postMessage(msg, tr);
  });
}

/* ---------- a later backend (not used; the interface it would fill) ----------
   A server-side aligner (librosa / madmom / synctoolbox) could replace
   the Worker behind the same call: it would take the features — never
   the audio, which stays on this device — and return the same result
   shape: {transposition, tuningOffsetCents, performanceOrder, syncPoints,
   overallConfidence, engineVersion, form, perBar, diagnostics}. Nothing
   calls it; there is no network in this build. */
const SYNC_BACKEND = null;
