/* ============================================================
   HEARING THE PIANO — the input layer.

   One stream of notes for the whole house, whether they came from a MIDI
   keyboard or from an acoustic piano through the microphone. Everything
   downstream (the Verify Engine, and later the feedback, the flashcards
   and Compose) listens to this and never asks where a note came from:

     NoteEvent = {pitch, onset, offset, velocity, confidence, source}

   onset and offset are seconds on one clock (performance.now() / 1000),
   so a key on the MIDI keyboard and a string heard by the microphone are
   on the same timeline as the metronome and the backing.

   THE MICROPHONE. Asked for with echo cancellation, noise suppression and
   automatic gain all off: those are built for voices on calls and they eat
   a piano alive (the cancellation takes the sustain for an echo, the gain
   pumps the decay). The sound goes from an AudioWorklet — which runs on
   the audio thread — straight to a Worker through a MessageChannel, so
   the page's own thread never carries a sample and never stalls the
   analysis, and the analysis never stalls the page. Where a browser has
   no AudioWorklet, a ScriptProcessor does the same job less elegantly.

   NOTHING LEAVES THE DEVICE. No audio is recorded or kept by any of this;
   it is analysed as it arrives and dropped. What is kept is what was
   learned about the piano: its tuning, how its strings stretch, the shape
   of its notes — per microphone, so the practice-room piano and the one at
   home each have their own.

   THE APP'S OWN SOUND. When the house is playing (a backing band, the
   score player, a recording) through the speakers, the microphone hears
   it. The notes the app itself is sounding are known exactly, so a note
   heard at the same pitch while the app is playing it is set aside. If a
   lot of what is heard is the app, the page says so rather than marking
   you wrong for the band's piano, and the first time the microphone and
   the speakers are on together it suggests headphones.
   ============================================================ */

function listenState(){
  if(!S.listen || typeof S.listen !== 'object') S.listen = {};
  const L = S.listen;
  L.v = 1;
  L.source = ['auto', 'mic', 'midi'].includes(L.source) ? L.source : 'auto';
  L.devices = L.devices && typeof L.devices === 'object' ? L.devices : {};
  L.tipHeadphones = !!L.tipHeadphones;
  L.strictness = ['lenient', 'standard', 'strict'].includes(L.strictness) ? L.strictness : 'standard';
  L.mode = ['exact', 'pitch-class'].includes(L.mode) ? L.mode : 'exact';
  L.harness = Array.isArray(L.harness) ? L.harness : [];
  return L;
}

/* ---------- the bus ---------- */
const _li = {subs: new Set(), recent: [], active: null, midi: null, mic: null, expect: null, verifySubs: new Set(),
  app: [], leakCount: 0, heardCount: 0, leakWarned: false, levelSubs: new Set(), level: null};
function listenOn(fn){ _li.subs.add(fn); return () => _li.subs.delete(fn); }
function listenOnVerify(fn){ _li.verifySubs.add(fn); return () => _li.verifySubs.delete(fn); }
function listenOnLevel(fn){ _li.levelSubs.add(fn); return () => _li.levelSubs.delete(fn); }
function listenNow(){ return performance.now() / 1000; }
function listenEmit(ev){
  _li.recent.push(ev); if(_li.recent.length > 64) _li.recent.shift();
  _li.subs.forEach(f => { try { f(ev); } catch(e){ console.warn('listener failed', e); } });
}
function listenRecent(n){ return _li.recent.slice(-(n || 16)); }
function listenActive(){ return _li.active; }   /* 'mic' | 'midi' | null */

/* ---------- which source ---------- */
async function listenStart(opts){
  const L = listenState();
  const want = (opts && opts.source) || L.source;
  await listenStop();
  if(want === 'midi' || want === 'auto'){
    const ok = await listenMidiStart().catch(() => false);
    if(ok){ _li.active = 'midi'; listenIndicator(); return 'midi'; }
    if(want === 'midi') throw new Error('No MIDI keyboard is connected (or this browser has no Web MIDI).');
  }
  await listenMicStart();
  _li.active = 'mic';
  listenIndicator();
  return 'mic';
}
async function listenStop(){
  if(_li.mic) await listenMicStop();
  if(_li.midi) listenMidiStop();
  _li.active = null;
  listenIndicator();
}

/* ---------- MIDI: the notes as they are, with a certainty of one ---------- */
async function listenMidiStart(){
  if(!navigator.requestMIDIAccess) return false;
  const acc = await navigator.requestMIDIAccess();
  const inputs = [...acc.inputs.values()];
  if(!inputs.length) return false;
  const open = new Map();
  const hook = input => { input.onmidimessage = e => {
    const [st, a, b] = e.data, hi = st & 0xf0;
    const t = (e.timeStamp || performance.now()) / 1000;
    if(hi === 0x90 && b > 0){
      const ev = {pitch: a, onset: t, offset: null, velocity: +(b / 127).toFixed(2), confidence: 1, source: 'midi'};
      open.set(a, ev); listenEmit(ev); listenMidiVerify(ev);
    } else if(hi === 0x80 || (hi === 0x90 && b === 0)){
      const ev = open.get(a); if(ev){ ev.offset = t; open.delete(a); }
    }
  }; };
  inputs.forEach(hook);
  acc.onstatechange = () => [...acc.inputs.values()].forEach(hook);
  _li.midi = {acc, inputs};
  listenIndicator();
  return true;
}
function listenMidiStop(){
  if(!_li.midi) return;
  [..._li.midi.acc.inputs.values()].forEach(i => { i.onmidimessage = null; });
  _li.midi = null;
}
/* MIDI knows its notes exactly, so a step is judged on the keys: the notes
   that arrive within a short window of the first make up the chord */
let _liMidiStep = null;
function listenMidiVerify(ev){
  if(!_li.expect) return;
  const now = ev.onset;
  if(!_liMidiStep || now - _liMidiStep.t > 0.08){
    _liMidiStep = {t: now, notes: [], timer: null, expect: _li.expect};
  }
  _liMidiStep.notes.push({pitch: ev.pitch, conf: 1});
  clearTimeout(_liMidiStep.timer);
  const step = _liMidiStep;
  step.timer = setTimeout(() => {
    const v = ldVerifyStep(step.expect.notes, step.notes, step.expect.eo);
    listenVerified({t: step.t, verify: v, notes: step.notes.map(n => n.pitch), source: 'midi', latency: listenNow() - step.t});
  }, 70);
}
function listenVerified(r){ _li.verifySubs.forEach(f => { try { f(r); } catch(e){ console.warn(e); } }); }

/* ---------- what the current step asks for ---------- */
function listenExpect(notes, eo){
  const L = listenState();
  const opts = Object.assign({mode: L.mode, strictness: L.strictness}, eo || {});
  _li.expect = notes && notes.length ? {notes: notes.slice(), eo: opts} : null;
  if(_li.mic && _li.mic.worker) _li.mic.worker.postMessage({type: 'expect', notes: _li.expect ? _li.expect.notes : null, eo: opts});
}

/* ---------- the microphone ---------- */
function listenWorkerUrl(){
  if(_li.workerUrl) return _li.workerUrl;
  const parts = LD_WORKER_PARTS().map(f => f.toString()).join('\n');
  const src = `'use strict';
${parts}
let an = null, sr = 48000, f0 = null, lastLevel = -1, saveAt = 0;
function feed(buf){
  if(!an) return;
  const r = an.push(buf);
  if(r.length) postMessage({type: 'events', events: r, f0});
  const now = an.time();
  if(now - lastLevel > 0.05){ lastLevel = now; const l = an.level(); postMessage({type: 'level', rms: l.rms, db: l.db, floorDb: l.floorDb, t: now, tuning: an.tuning()}); }
  if(now - saveAt > 15){ saveAt = now; postMessage({type: 'learned', tuning: an.tuning(), templates: an.templates(), inharm: an.inharmonicity()}); }
}
onmessage = e => {
  const m = e.data;
  if(m.type === 'init'){
    sr = m.sr; an = ldCreate(sr, m.opts || {});
    if(m.port) m.port.onmessage = ev => { const d = ev.data; if(d && d.start != null){ f0 = d.start; return; } feed(d); };
    return;
  }
  if(!an) return;
  if(m.type === 'audio') feed(m.data);
  else if(m.type === 'expect') an.expect(m.notes, m.eo);
  else if(m.type === 'learned') postMessage({type: 'learned', tuning: an.tuning(), templates: an.templates(), inharm: an.inharmonicity(), final: !!m.final});
};`;
  _li.workerUrl = URL.createObjectURL(new Blob([src], {type: 'text/javascript'}));
  return _li.workerUrl;
}
function listenWorkletUrl(){
  if(_li.workletUrl) return _li.workletUrl;
  const src = `class LiCapture extends AudioWorkletProcessor {
  constructor(){ super(); this.buf = new Float32Array(1024); this.n = 0; this.out = null; this.started = false;
    this.port.onmessage = e => { if(e.data && e.data.port) this.out = e.data.port; }; }
  process(inputs){
    const ch = inputs[0] && inputs[0][0];
    if(!ch || !this.out) return true;
    if(!this.started){ this.started = true; this.out.postMessage({start: currentFrame}); }
    for(let i = 0; i < ch.length; i++){
      this.buf[this.n++] = ch[i];
      if(this.n === this.buf.length){ const b = this.buf; this.out.postMessage(b, [b.buffer]); this.buf = new Float32Array(1024); this.n = 0; }
    }
    return true;
  }
}
registerProcessor('li-capture', LiCapture);`;
  /* a page opened from a file has no origin a blob: module can be loaded
     from, so the worklet is offered as a data: URL first, and a blob: second */
  _li.workletUrls = ['data:text/javascript;base64,' + btoa(unescape(encodeURIComponent(src))),
    URL.createObjectURL(new Blob([src], {type: 'text/javascript'}))];
  _li.workletUrl = _li.workletUrls[0];
  return _li.workletUrl;
}
function listenDeviceKey(track){
  const s = track && track.getSettings ? track.getSettings() : {};
  return (s.deviceId && s.deviceId !== 'default' ? s.deviceId : '') || (track && track.label) || 'default';
}
async function listenMicStart(){
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('This browser offers no microphone.');
  const stream = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1}});
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC({latencyHint: 'interactive'});
  const src = ctx.createMediaStreamSource(stream);
  const track = stream.getAudioTracks()[0];
  const key = listenDeviceKey(track);
  const L = listenState();
  const dev = L.devices[key] = L.devices[key] || {label: (track && track.label) || 'Microphone', cents: 0, inharm: {}, templates: {}, firstUsed: new Date().toISOString()};
  dev.lastUsed = new Date().toISOString();
  const worker = new Worker(listenWorkerUrl());
  const initOpts = {cents: dev.cents || 0, templates: dev.templates || null, inharm: dev.inharm || null};
  let node = null, sp = null;
  if(ctx.audioWorklet && typeof AudioWorkletNode === 'function'){
    try {
      listenWorkletUrl();
      let loaded = false, lastErr = null;
      for(const u of _li.workletUrls){ try { await ctx.audioWorklet.addModule(u); loaded = true; break; } catch(e){ lastErr = e; } }
      if(!loaded) throw lastErr || new Error('no worklet');
      node = new AudioWorkletNode(ctx, 'li-capture', {numberOfInputs: 1, numberOfOutputs: 0, channelCount: 1});
      const ch = new MessageChannel();
      node.port.postMessage({port: ch.port1}, [ch.port1]);
      worker.postMessage({type: 'init', sr: ctx.sampleRate, opts: initOpts, port: ch.port2}, [ch.port2]);
      src.connect(node);
    } catch(e){ node = null; _li.workletError = String(e && e.message || e); }
  }
  if(!node){
    worker.postMessage({type: 'init', sr: ctx.sampleRate, opts: initOpts});
    /* the older way, on the page's thread: only moving samples, never analysing them */
    sp = ctx.createScriptProcessor(2048, 1, 1);
    sp.onaudioprocess = e => { const d = e.inputBuffer.getChannelData(0).slice(); worker.postMessage({type: 'audio', data: d}, [d.buffer]); };
    src.connect(sp); sp.connect(ctx.destination);
  }
  /* the audio clock against the page's: where the microphone's samples sit
     on the one timeline every NoteEvent uses */
  const offset = () => { try { const ts = ctx.getOutputTimestamp(); if(ts && ts.performanceTime) return ts.performanceTime / 1000 - ts.contextTime; } catch(e){} return listenNow() - ctx.currentTime; };
  const m = _li.mic = {stream, ctx, src, node, sp, worker, key, dev, off: offset(), startedAt: listenNow(), ctx0: ctx.currentTime};
  worker.onmessage = e => listenWorkerMessage(m, e.data);
  _li.leakCount = 0; _li.heardCount = 0; _li.leakWarned = false;
  if(_li.expect) worker.postMessage({type: 'expect', notes: _li.expect.notes, eo: _li.expect.eo});
  listenIndicator();
  return true;
}
async function listenMicStop(){
  const m = _li.mic; if(!m) return;
  /* what was learned about the piano this time is asked for first, and the
     answer waited for (briefly), so a short session still leaves it behind */
  m.closing = true;
  try {
    await new Promise(r => { m.onLearned = r; m.worker.postMessage({type: 'learned', final: true}); setTimeout(r, 400); });
  } catch(e){}
  _li.mic = null;
  try { m.stream.getTracks().forEach(t => t.stop()); } catch(e){}
  try { m.node && m.node.disconnect(); m.sp && m.sp.disconnect(); m.src.disconnect(); } catch(e){}
  try { await m.ctx.close(); } catch(e){}
  setTimeout(() => { try { m.worker.terminate(); } catch(e){} }, 200);
  _li.level = null;
  _li.levelSubs.forEach(f => { try { f(null); } catch(e){} });
}
/* a stream time from the Worker, onto the shared clock */
function listenMicClock(m, t, f0){
  const ctxT = (f0 != null ? f0 / m.ctx.sampleRate : m.ctx0) + t;
  return ctxT + m.off;
}
function listenWorkerMessage(m, d){
  if(_li.mic !== m) return;
  if(m.closing && d.type !== 'learned') return;
  if(d.type === 'level'){
    _li.level = {db: d.db, floorDb: d.floorDb, tuning: d.tuning, measuring: listenNow() - m.startedAt < 1.2};
    _li.levelSubs.forEach(f => { try { f(_li.level); } catch(e){} });
    listenIndicatorLevel(d.db, d.floorDb);
    return;
  }
  if(d.type === 'learned'){
    m.dev.cents = d.tuning; m.dev.templates = d.templates || {}; m.dev.inharm = d.inharm || {};
    m.dev.updatedAt = new Date().toISOString();
    if(typeof saveNow === 'function') saveNow();
    if(d.final && m.onLearned) m.onLearned();
    return;
  }
  if(d.type !== 'events') return;
  d.events.forEach(ev => {
    if(ev.type !== 'notes') return;
    const onset = listenMicClock(m, ev.t, d.f0);
    const kept = [];
    ev.notes.forEach(n => {
      _li.heardCount++;
      if(listenIsApp(n.pitch, onset)){ _li.leakCount++; return; }
      kept.push(n);
      listenEmit({pitch: n.pitch, onset: +onset.toFixed(3), offset: null, velocity: n.vel, confidence: n.conf, source: 'mic'});
    });
    listenLeakCheck();
    if(ev.verify){
      /* a verdict that leaned on notes the app itself was playing is not the
         player's; judged again on what is left */
      const v = kept.length === ev.notes.length ? ev.verify
        : ldVerifyStep(_li.expect ? _li.expect.notes : [], kept, _li.expect ? _li.expect.eo : {});
      listenVerified({t: onset, verify: v, notes: kept.map(n => n.pitch), faint: ev.faint || [], source: 'mic', latency: listenNow() - onset});
    }
  });
}

/* ---------- the app's own notes ---------- */
/* Called by every voice the house plays through (the grand, the GM and
   orchestra sets): which pitch, when on the shared clock, for how long. */
function listenAppNote(ctx, midi, t, dur){
  if(!_li.mic || !ctx || typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext) return;
  let off; try { const ts = ctx.getOutputTimestamp(); off = ts && ts.performanceTime ? ts.performanceTime / 1000 - ts.contextTime : listenNow() - ctx.currentTime; } catch(e){ off = listenNow() - ctx.currentTime; }
  const from = t + off, to = from + Math.max(0.1, dur || 0.5);
  _li.app.push({pitch: Math.round(midi), from, to});
  const cut = listenNow() - 12; while(_li.app.length && _li.app[0].to < cut) _li.app.shift();
  listenHeadphoneTip();
}
function listenIsApp(pitch, t){
  return _li.app.some(a => (a.pitch === pitch || Math.abs(a.pitch - pitch) === 12) && t >= a.from - 0.06 && t <= a.to + 0.25);
}
function listenLeakCheck(){
  if(_li.leakWarned || _li.heardCount < 12) return;
  if(_li.leakCount / _li.heardCount > 0.35){
    _li.leakWarned = true;
    if(typeof toast === 'function') toast('The microphone is hearing the app’s own playback. Its notes are being set aside, but headphones would make this much surer.', 7000);
  }
}
function listenHeadphoneTip(){
  const L = listenState();
  if(L.tipHeadphones) return;
  L.tipHeadphones = true;
  if(typeof saveNow === 'function') saveNow();
  if(typeof toast === 'function') toast('Listening and playing at once: headphones keep the app’s sound out of the microphone.', 7000);
}

/* ---------- the small "Listening" mark, whenever the microphone is open ---------- */
function listenIndicator(){
  let el = document.getElementById('liPill');
  if(!_li.active){ if(el) el.remove(); return; }
  if(!el){
    el = document.createElement('button');
    el.id = 'liPill'; el.className = 'li-pill'; el.type = 'button';
    el.title = 'The piano is being listened to on this device only. Press to stop.';
    el.onclick = () => { listenStop(); if(typeof rerender === 'function' && location.hash.startsWith('#/jazz/piano')) rerender(); };
    document.body.appendChild(el);
  }
  el.innerHTML = `<span class="li-dot"></span><span>${_li.active === 'midi' ? 'MIDI keyboard' : 'Listening'}</span>${_li.active === 'mic' ? '<span class="li-mini"><i></i></span>' : ''}`;
}
function listenIndicatorLevel(db, floorDb){
  const bar = document.querySelector('#liPill .li-mini i');
  if(bar) bar.style.width = Math.max(0, Math.min(100, (db + 70) / 60 * 100)) + '%';
}

/* ---------- names ---------- */
const LI_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
function listenNoteName(p){ return LI_NAMES[((p % 12) + 12) % 12] + (Math.floor(p / 12) - 1); }
function listenParseNotes(text){
  const pc = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11};
  return String(text || '').split(/[\s,]+/).map(w => {
    const m = w.trim().match(/^([A-Ga-g])([#♯b♭]?)(-?\d)$/); if(!m) return null;
    const acc = /[#♯]/.test(m[2]) ? 1 : /[b♭]/.test(m[2]) ? -1 : 0;
    return 12 * (+m[3] + 1) + pc[m[1].toUpperCase()] + acc;
  }).filter(v => v != null);
}
