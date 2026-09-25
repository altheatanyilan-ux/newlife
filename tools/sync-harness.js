/* sync-harness — runs inside the built site (index.html), in Chromium,
   driven by test-sync-accuracy.js.

   Everything the engine touches is the production path: the MusicXML is
   read by musicXmlTimeline, the score built by syncScoreFromMusicXml (or a
   tune's chart by syncScoreFromTune), the audio resampled by the browser's
   OfflineAudioContext as syncDecodeForEngine does, and the alignment run by
   syncAlign — in its Worker. The performance is played from real samples
   (tools/sync-band.js, vendor/orchestra) and the answer is known: for the
   ASAP pieces, a pianist's hand-annotated downbeats; for the rest, the
   band's own grid.

   Needs window.syncBand (tools/sync-band.js) and window.midiRead
   (tools/midi-read.js) loaded first. */
(function(root){
'use strict';
const H = {base: '', sr: 22050};
let BANK = null;

/* ---------- the instruments ---------- */
async function decodeTo(url, sr){
  const ab = await (await fetch(url)).arrayBuffer();
  const buf = await new OfflineAudioContext(1, 1, 44100).decodeAudioData(ab);
  const off = new OfflineAudioContext(1, Math.max(1, Math.ceil(buf.duration * sr)), sr);
  const s = off.createBufferSource(); s.buffer = buf; s.connect(off.destination); s.start();
  return (await off.startRendering()).getChannelData(0).slice();
}
H.loadBank = async function(){
  if(BANK) return Object.keys(BANK).length;
  const idx = await (await fetch(H.base + 'vendor/orchestra/instruments.json')).json();
  const jobs = [], bank = {};
  for(const [id, e] of Object.entries(idx.instruments)){
    bank[id] = {kind: e.kind, layers: e.layers, notes: (e.notes || []).map(n => Object.assign({}, n)), hits: (e.hits || []).map(h => Object.assign({}, h))};
    bank[id].notes.concat(bank[id].hits).forEach(x => jobs.push(x));
  }
  let i = 0;
  const worker = async () => { while(i < jobs.length){ const x = jobs[i++]; x.pcm = await decodeTo(H.base + 'vendor/orchestra/' + x.file, H.sr); } };
  await Promise.all([...Array(12)].map(worker));
  BANK = bank;
  return Object.keys(bank).length;
};

/* the recording as the engine will get it from a real file: resampled by
   the browser to 11 025 Hz */
async function toEngine(mono, sr){
  const ctx = new OfflineAudioContext(1, Math.ceil(mono.length * 11025 / sr), 11025);
  const b = ctx.createBuffer(1, mono.length, sr); b.copyToChannel(mono, 0);
  const s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start();
  return (await ctx.startRendering()).getChannelData(0).slice();
}

/* ---------- the truth ---------- */
/* a measure shorter than its time signature that begins mid-bar (a pickup,
   or the pickup's return after a repeat) has no downbeat of its own */
function pickups(tl, order){
  const nominal = k => { const m = tl.measures[k] || {}; return (m.beats || 4) * 4 / (m.beatType || 4); };
  const short = order.map(k => ((tl.measures[k] || {}).len || 4) < nominal(k) - 1e-6);
  return order.map((k, i) => short[i] && (i === 0 || short[i - 1]));
}
const keyed = order => { const seen = {}; return order.map(k => { seen[k] = (seen[k] || 0) + 1; return k + '#' + seen[k]; }); };
/* The truth, placed in the score. ASAP gives each performance's
   downbeats, and the score unfolded as that pianist played it (a MIDI
   file, with its own downbeats in the same order): the i-th performed
   downbeat is the i-th of the unfolded score, whose position in quarter
   notes is read through that file's tempo map. A bar of our score whose
   start is at that position is the bar the downbeat belongs to — however
   the two editions count their bars. The reading of the repeats played is
   the one whose length matches the unfolded score's. */
function asapTruth(tl, perfText, scoreMidi, scoreText){
  const dbs = txt => txt.trim().split(/\n/).map(l => l.split('\t')).filter(r => r.length >= 3 && /^db/.test(r[2])).map(r => +r[0]);
  const down = dbs(perfText), sdown = dbs(scoreText);
  const n = Math.min(down.length, sdown.length);
  /* each performed bar's content: the pitches the unfolded score strikes in it */
  const mq = scoreMidi.notes.map(x => ({q: scoreMidi.quarters(x.t), m: x.midi}));
  const qs = sdown.slice(0, n).map(t => scoreMidi.quarters(t));
  const sigM = qs.map((q, i) => { const z = i + 1 < qs.length ? qs[i + 1] : Infinity; return mq.filter(x => x.q >= q - 0.01 && x.q < z - 0.01).map(x => x.m).sort((a, b) => a - b).join(','); });
  /* each written bar's content, the same way, from the first time it is played */
  const firstPerf = new Map(); tl.order.forEach((k, i) => { if(!firstPerf.has(k)) firstPerf.set(k, i); });
  const byPerf = new Map(); (tl.events || []).filter(e => !e.chord && e.midi != null && !e.perc && !e.grace).forEach(e => { if(!byPerf.has(e.perf)) byPerf.set(e.perf, []); byPerf.get(e.perf).push(e.midi); });
  const sigK = k => (byPerf.get(firstPerf.get(k)) || []).slice().sort((a, b) => a - b).join(',');
  /* every way of taking the repeats; the one whose bars match the performed bars */
  const readings = tl.barInfo && tl.barInfo.some(b => b.back) ? syncRoadMapReadings(tl.barInfo).map(r => ({how: r.how, order: r.order})) : [{how: 'as written', order: tl.order}];
  const sim = (a, b) => { if(a === b) return 1; const A = a ? a.split(',') : [], B = b ? b.split(',') : []; if(!A.length || !B.length) return 0;
    const cnt = {}; A.forEach(x => cnt[x] = (cnt[x] || 0) + 1); let c = 0; B.forEach(x => { if(cnt[x] > 0){ cnt[x]--; c++; } }); return 2 * c / (A.length + B.length); };
  let best = null;
  readings.forEach(r => {
    const pk = pickups(tl, r.order), bars = r.order.map((k, i) => ({k, i})).filter(x => !pk[x.i]);
    let s = 0; for(let i = 0; i < Math.min(n, bars.length); i++) s += sim(sigM[i], sigK(bars[i].k));
    s -= Math.abs(bars.length - n) * 0.5;
    if(!best || s > best.s) best = {s, r, bars};
  });
  const keys = keyed(best.r.order), list = [];
  for(let i = 0; i < Math.min(n, best.bars.length); i++){ const b = best.bars[i]; list.push({key: keys[b.i], i: b.i, number: (tl.measures[b.k] || {}).number, t: down[i]}); }
  return {list, reading: best.r.how, countDiff: n - list.length, downbeats: down.length, match: +(best.s / Math.max(1, n)).toFixed(2)};
}

/* ---------- the engine's answer, in the same terms ---------- */
function engineBars(res, score, tl){
  const alt = res.diagnostics.alternate, chosen = alt ? (score.alternates || []).find(a => a.how === alt) || score : score;
  const order = chosen.order, keys = keyed(order), pk = pickups(tl, order), map = res.syncMap;
  const out = [];
  order.forEach((k, i) => { if(pk[i]) return; out.push({key: keys[i], i, t: scoreToAudioTime(map, 1, i + 1, 1)}); });
  return {list: out, reading: chosen.how || 'as written'};
}

/* ---------- running a case ---------- */
async function perform(c){
  await H.loadBank();
  if(c.kind === 'asap'){
    const xml = await (await fetch(H.base + 'tools/sync-testset/' + c.score)).text();
    const tl = musicXmlTimeline(xml);
    const midi = midiRead.read(new Uint8Array(await (await fetch(H.base + 'tools/sync-testset/' + c.performance)).arrayBuffer()));
    const events = midiRead.pianoEvents(midi);
    const duration = midi.duration + 3;
    const txt = async f => (await fetch(H.base + 'tools/sync-testset/' + f)).text();
    const scoreMidi = midiRead.read(new Uint8Array(await (await fetch(H.base + 'tools/sync-testset/' + c.scoreMidi)).arrayBuffer()));
    return {tl, score: syncScoreFromMusicXml(tl), events, duration, truth: asapTruth(tl, await txt(c.annotations), scoreMidi, await txt(c.scoreAnnotations)), transpose: 0, cents: 0};
  }
  if(c.kind === 'ensemble'){
    const buf = await (await fetch(H.base + 'tools/sync-testset/' + c.score)).arrayBuffer();
    let xml = await readCompressedMusicXml(buf);
    if(c.bars) xml = firstBars(xml, c.bars);
    const tl = musicXmlTimeline(xml);
    const perf = syncBand.performScore(tl, c.plan || {});
    const keys = keyed(perf.truth.order), pk = pickups(tl, perf.truth.order);
    const list = []; perf.truth.order.forEach((k, i) => { if(!pk[i]) list.push({key: keys[i], i, number: (tl.measures[k] || {}).number, t: perf.truth.barTimes[i]}); });
    return {tl, score: syncScoreFromMusicXml(tl), events: perf.events, duration: perf.duration, truth: {list, reading: 'as written', countDiff: 0},
      transpose: (c.plan || {}).transpose || 0, cents: (c.plan || {}).cents || 0};
  }
  /* a jazz tune from its chart */
  const tune = c.tune || REAL_BOOK_TUNE_DATABASE.find(t => t.id === c.id);
  const u = syncUnrollChart(tune), score = syncScoreFromTune(tune);
  const play = syncBand.perform(u, c.plan);
  const list = [];
  play.truth.choruses.forEach((ch, ci) => u.bars.forEach((b, m) => { const tt = ch.beats[play.truth.barStarts[m]];
    if(tt != null) list.push({key: (ci + 1) + ':' + (m + 1), chorus: ci + 1, m: m + 1, t: tt, type: ch.type, rubato: ch.rubato}); }));
  return {tune, u, score, events: play.events, duration: play.duration, truth: {list, reading: 'as written', countDiff: 0, choruses: play.truth.choruses.length},
    transpose: c.plan.transpose || 0, cents: c.plan.cents || 0, jazz: true};
}
/* the opening of a long score: every part cut after the same bar */
function firstBars(xml, n){
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  [...doc.getElementsByTagName('part')].forEach(p => { const ms = [...p.children].filter(x => x.nodeName === 'measure'); ms.slice(n).forEach(m => p.removeChild(m));
    /* the last bar kept closes the piece: no repeat back into what was cut */
    const last = ms[Math.min(n, ms.length) - 1]; if(last) [...last.getElementsByTagName('repeat')].forEach(r => r.parentNode.removeChild(r)); });
  return new XMLSerializer().serializeToString(doc);
}

H.run = async function(c){
  const t0 = performance.now();
  const P = await perform(c);
  const audio = syncBand.render(BANK, P.events, {sr: H.sr, duration: P.duration, seed: (c.plan && c.plan.seed) || 7});
  const tRender = performance.now() - t0;
  /* as syncDecodeForEngine hands a real file over: mono, at its own rate */
  const pcm = audio.mono.slice(0);
  if(c.dumpMix){ const u = new Uint8Array(audio.mono.buffer.slice(0)); let s = ''; for(let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); H._mix = btoa(s); H._events = P.events.length; }
  if(c.dumpPcm){ const u = new Uint8Array(pcm.buffer.slice(0)); let s = ''; for(let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    H._dump = {pcm: btoa(s), score: JSON.parse(JSON.stringify(P.score))}; }
  const progress = [];
  const t1 = performance.now();
  const res = await syncAlign({pcm, sr: H.sr}, P.score, {engine: H.engineOpts || null, onProgress: (text) => { if(progress[progress.length - 1] !== text) progress.push(text); }});
  const engineMs = performance.now() - t1;
  /* compare */
  const rows = [];
  let found;
  if(P.jazz){
    const map = res.syncMap;
    P.truth.list.forEach(x => { const est = x.chorus <= res.diagnostics.choruses ? scoreToAudioTime(map, x.chorus, x.m, 1) : null;
      const pb = (res.perBar || []).find(p => p.chorus === x.chorus && p.measure === x.m);
      const tol = x.type === 'head' && !x.rubato && c.plan.style !== 'ballad' ? 50 : 100;
      rows.push({bar: x.key, type: x.type + (x.rubato ? ' rubato' : ''), truth: x.t, est, err: est == null ? null : Math.round((est - x.t) * 1000), tol,
        confidence: pb ? pb.confidence : 0, interpolated: !!(pb && pb.interpolated)}); });
    found = {reading: res.diagnostics.choruses + ' choruses', expected: P.truth.choruses + ' choruses'};
  } else {
    const E = engineBars(res, P.score, P.tl), byKey = new Map(E.list.map(x => [x.key, x]));
    P.truth.list.forEach(x => { const e = byKey.get(x.key), est = e ? e.t : null;
      const pb = e ? (res.perBar || []).find(p => p.measure === e.i + 1) : null;
      rows.push({bar: x.number + (x.key.endsWith('#1') ? '' : ' (' + x.key.split('#')[1] + ')'), truth: x.t, est, err: est == null ? null : Math.round((est - x.t) * 1000), tol: 100,
        confidence: pb ? pb.confidence : 0, interpolated: !!(pb && pb.interpolated)}); });
    found = {reading: E.reading, expected: P.truth.reading};
    /* the error after each stage of the engine, for the bars of the first pass */
    const st = res.diagnostics.stages && res.diagnostics.stages[0];
    if(st){
      const alt = res.diagnostics.alternate, chosen = alt ? (P.score.alternates || []).find(a => a.how === alt) || P.score : P.score;
      const keys = keyed(chosen.order), pos = new Map(keys.map((k, i) => [k, i]));
      const med = arr => { const e = P.truth.list.map(x => { const i = pos.get(x.key); return i == null || arr[i] == null ? null : Math.abs(arr[i] - x.t) * 1000; }).filter(v => v != null).sort((a, b) => a - b);
        return {median: Math.round(e[e.length >> 1]), within100: Math.round(100 * e.filter(v => v <= 100).length / e.length)}; };
      found.stages = {coarse: med(st.coarse), fine: med(st.fine), final: med(st.final)};
    }
  }
  const errs = rows.filter(r => r.err != null).map(r => Math.abs(r.err)).sort((a, b) => a - b);
  const q = p => errs.length ? errs[Math.min(errs.length - 1, Math.floor(p * (errs.length - 1)))] : null;
  const within = ms => rows.length ? Math.round(100 * rows.filter(r => r.err != null && Math.abs(r.err) <= ms).length / rows.length) : null;
  const sure = rows.filter(r => r.confidence >= 0.6 && r.err != null), unsure = rows.filter(r => r.confidence < 0.6 && r.err != null);
  const mean = a => a.length ? Math.round(a.reduce((s, r) => s + Math.abs(r.err), 0) / a.length) : null;
  const pitchErr = (res.syncMap.transposition * 100 + res.syncMap.tuningOffsetCents) - (P.transpose * 100 + P.cents);
  const T = P.truth;
  return {truthInfo: T.downbeats != null ? `${T.downbeats} annotated downbeats, ${T.list.length} placed (bar content match ${T.match})` : null,
    id: c.id, title: c.title, kind: c.kind, tests: c.tests || c.note || '', audioSeconds: +(audio.mono.length / H.sr).toFixed(1),
    renderMs: Math.round(tRender), engineMs: Math.round(engineMs), inWorker: res.inWorker,
    key: {transposition: res.syncMap.transposition, cents: res.syncMap.tuningOffsetCents, pitchErrorCents: Math.round(pitchErr), ok: Math.abs(pitchErr) <= 20},
    structure: Object.assign(found, {order: res.syncMap.performanceOrder.map(e => e.label).join(' · '), readings: res.diagnostics.readings || null}),
    errors: {n: rows.length, matched: errs.length, median: q(0.5), p90: q(0.9), max: errs.length ? errs[errs.length - 1] : null,
      within50: within(50), within100: within(100), within200: within(200),
      withinTarget: rows.length ? Math.round(100 * rows.filter(r => r.err != null && Math.abs(r.err) <= r.tol).length / rows.length) : null},
    confidence: {overall: res.syncMap.overallConfidence, sure: sure.length, sureMeanErr: mean(sure), unsure: unsure.length, unsureMeanErr: mean(unsure),
      interpolated: rows.filter(r => r.interpolated).length},
    diagnostics: res.diagnostics, progress, rows,
    _audio: c.excerpt ? wavBase64(audio, Math.min(audio.mono.length / H.sr, c.excerpt)) : null};
};

/* the first seconds as a 16-bit stereo WAV, for listening */
function wavBase64(a, secs){
  const n = Math.floor(secs * a.sr), buf = new ArrayBuffer(44 + n * 4), v = new DataView(buf);
  const w = (o, s) => { for(let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
  v.setUint32(24, a.sr, true); v.setUint32(28, a.sr * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 4, true);
  for(let i = 0; i < n; i++){ v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, a.left[i])) * 32767, true); v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, a.right[i])) * 32767, true); }
  let s = ''; const u = new Uint8Array(buf); for(let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(s);
}
/* How well the score's bars can be told apart in this recording: at the
   true alignment, does each bar's audio fit its own template better than
   its neighbours' (one and two bars either side)? For diagnosis. */
H.discriminability = async function(c){
  const P = await perform(c);
  const audio = syncBand.render(BANK, P.events, {sr: H.sr, duration: P.duration, seed: 7});
  const E = syncEngineModule(), I = E._internal;
  const feat = E.analyse(audio.mono, H.sr, {tempoHint: P.score.tempoHint});
  const tpl = I.scoreTemplates(P.score), cf = I.coarseFrames(feat);
  const Sm = I.simMatrix(cf.X, cf.n, tpl.T, tpl.L);
  const keys = keyed(P.score.order), pos = new Map(keys.map((k, i) => [k, i]));
  const T = P.truth.list.map(x => ({i: pos.get(x.key), t: x.t})).filter(x => x.i != null).sort((a, b) => a.t - b.t);
  let wins = 0, n = 0, margin = 0; const lost = [];
  for(let q = 0; q + 1 < T.length; q++){
    const {i, t} = T[q], t1 = T[q + 1].t;
    const f0 = Math.floor(t / cf.hop), f1 = Math.floor(t1 / cf.hop);
    if(f1 <= f0) continue;
    const fit = d => { const b = i + d; if(b < 0 || b >= tpl.bars) return -Infinity;
      const a = tpl.barStart[b], z = b + 1 < tpl.bars ? tpl.barStart[b + 1] : tpl.L; let s = 0;
      for(let f = f0; f < f1; f++){ const x = (f - f0) / (f1 - f0); s += Sm[f * tpl.L + Math.min(z - 1, a + Math.floor(x * (z - a)))]; } return s / (f1 - f0); };
    const fits = [-2, -1, 0, 1, 2].map(fit), own = fits[2], other = Math.max(fits[0], fits[1], fits[3], fits[4]);
    const bestD = [-2, -1, 0, 1, 2][fits.indexOf(Math.max(...fits))]; H._bestD = H._bestD || {}; H._bestD[bestD] = (H._bestD[bestD] || 0) + 1;
    n++; if(own > other) wins++; else lost.push(tl_number(P, i)); margin += own - other;
  }
  const bd = H._bestD; H._bestD = null;
  return {bars: n, ownBest: Math.round(100 * wins / n), meanMargin: +(margin / n).toFixed(3), bestOffset: bd, lost: lost.slice(0, 12)};
};
function tl_number(P, i){ return (P.tl.measures[P.score.order[i]] || {}).number; }
root.syncHarness = H;
})(window);
