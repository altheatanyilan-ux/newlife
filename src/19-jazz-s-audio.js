/* ============================================================
   THE JAZZ STUDIO'S SOUND — synthesised, and the microphone.

   Curriculum v3 Section 4 asks for sound in five places: a play-along
   with tempo and key (4C), a metronome that clicks on two and four with
   a swing ratio (4C), a drone to improvise and record over (4B), the
   chord a student has just audiated (4D), and recordings to play back
   slowly, loop, compare and export (4B). All of it is Web Audio, all of
   it synthesised here; nothing is downloaded.

   THE BAND is three voices: a grand piano (the recorded Salamander grand,
   19-grand-piano.js), a plucked bass, and a brushed kit (ride, hi-hat on
   two and four). Every other note the studio plays — a chord or a voicing
   heard, a key pressed, the drone — is that grand too. The play-along reads
   a chart — a tune from the database, or a progression — and plays it:
   a walking bass, the piano comping a Charleston, the kit keeping time.
   Each voice can be muted or soloed, which is Section 4C's "solo track
   mode" made literal, because a synthesised band has its stems already.

   THE MICROPHONE is MediaRecorder, and the recordings are Blobs in a
   store of their own, never in the state (see jazzAudio in 06-db.js).
   ============================================================ */

let _jzCtx = null;
/* made inside the gesture that first needs it, and reused */
function jazzAudioCtx(){
  if(_jzCtx && _jzCtx.state !== 'closed') return _jzCtx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) return null;
  _jzCtx = new AC();
  return _jzCtx;
}
const jzMidiHz = m => 440 * Math.pow(2, (m - 69) / 12);

/* ---------- chords, as notes ---------- */
/* the intervals of a chord symbol, the ones it requires, and a voicing */
function jazzChordSpec(sym){
  sym = String(sym || '').trim().replace(/♭/g, 'b').replace(/♯/g, '#');
  const c = typeof jazzParseChord === 'function' ? jazzParseChord(sym) : null;
  if(!c || c.pc == null) return null;
  const q = c.q || '';
  let tones;
  if(c.quality === 'hd') tones = [0, 3, 6, 10];
  else if(c.quality === 'dim') tones = /7/.test(q) ? [0, 3, 6, 9] : [0, 3, 6];
  else if(c.quality === 'aug') tones = [0, 4, 8];
  else if(c.quality === 'sus') tones = /7|9|13/.test(q) ? [0, 5, 7, 10] : [0, 5, 7];
  else if(c.quality === 'min'){
    tones = /\(?(maj7|M7)\)?/.test(q) ? [0, 3, 7, 11] : /6/.test(q) ? [0, 3, 7, 9]
      : /11/.test(q) ? [0, 3, 7, 10, 14, 17] : /9/.test(q) ? [0, 3, 7, 10, 14] : /7/.test(q) ? [0, 3, 7, 10] : [0, 3, 7];
  } else if(c.quality === 'maj'){
    tones = /69/.test(q) ? [0, 4, 7, 9, 14] : /6/.test(q) ? [0, 4, 7, 9]
      : /(maj13|M13)/.test(q) ? [0, 4, 7, 11, 14, 21] : /(maj9|M9)/.test(q) ? [0, 4, 7, 11, 14] : /(maj|M7|Δ|\^)/.test(q) ? [0, 4, 7, 11] : [0, 4, 7];
  } else if(c.quality === 'dom'){
    tones = /alt/.test(q) ? [0, 4, 10, 13, 15, 20] : /(^|[^b#])13/.test(q) ? [0, 4, 7, 10, 14, 21]
      : /^9/.test(q) ? [0, 4, 7, 10, 14] : [0, 4, 7, 10];
    if(/(\+|#5)/.test(q)) tones = tones.map(t => t === 7 ? 8 : t);
  } else tones = [0, 4, 7];
  /* named alterations add their tone, and the one they alter goes */
  const add = (re, t, drop) => { if(re.test(q)){ if(!tones.includes(t)) tones.push(t); if(drop != null) tones = tones.filter(x => x !== drop); } };
  add(/b9/, 13, 14); add(/#9/, 15); add(/(#11|#4)/, 18); add(/b13/, 20); add(/b5/, 6, 7); add(/#5/, 8, 7);
  tones = [...new Set(tones)].sort((a, b) => a - b);
  /* what a voicing must contain to be this chord: the third (or the
     suspension) and the seventh (or sixth), and every named alteration */
  const req = [];
  const third = tones.find(t => t === 3 || t === 4) ?? tones.find(t => t === 5);
  const seventh = tones.find(t => t === 10 || t === 11 || t === 9 && tones.length > 3 && c.quality !== 'dim');
  if(third != null) req.push(third);
  if(seventh != null) req.push(seventh);
  if(c.quality === 'dim' || c.quality === 'hd' || c.quality === 'aug') tones.filter(t => [6, 8, 9].includes(t)).forEach(t => req.push(t));
  (q.match(/(b9|#9|#11|#4|b13|b5|#5)/g) || []).forEach(a => req.push({b9: 13, '#9': 15, '#11': 18, '#4': 18, b13: 20, b5: 6, '#5': 8}[a]));
  if(tones.length === 3) req.push(0, tones[1], tones[2]);
  const bassPc = c.bass ? JAZZ_TUNE_PC[c.bass] : null;
  return {sym, root: c.root, pc: c.pc, tones, required: [...new Set(req.map(t => t % 12))],
    pcs: [...new Set(tones.map(t => (c.pc + t) % 12))], bassPc};
}
/* a rootless voicing around middle C: the third, the seventh and one colour */
function jazzCompVoicing(spec, near){
  if(!spec) return [];
  const pick = spec.tones.filter(t => t !== 0);
  const colour = pick.find(t => t > 12) ?? pick.find(t => t === 7 || t === 8 || t === 6);
  const want = [...new Set(spec.required.concat(colour != null ? [colour % 12] : []))].slice(0, 4);
  const centre = near || 60;
  const notes = want.map(t => { let m = 48 + ((spec.pc + t) % 12); while(m < centre - 7) m += 12; return m; });
  return notes.sort((a, b) => a - b);
}

/* ---------- the voices ---------- */
/* the band's piano: the grand, or until its notes are decoded, a soft
   synthesised chord in its place */
function jzVoicePiano(ctx, dest, midi, t, dur, vel){
  if(typeof grandPianoNote === 'function'){
    if(grandPianoNote(ctx, dest, midi, t, dur, vel, null, 0.72)) return;
    grandPianoMissed();
  }
  jzVoiceSynthPiano(ctx, dest, midi, t, dur, vel);
}
/* any note heard on its own — a chord, a voicing, a key pressed — is the
   grand, low notes included; the stand-ins keep the old split */
function jzVoiceKeys(ctx, dest, midi, t, dur, vel){
  if(typeof grandPianoNote === 'function'){
    if(grandPianoNote(ctx, dest, midi, t, dur, vel, null, 0.75)) return;
    grandPianoMissed();
  }
  (midi < 48 ? jzVoiceBass : jzVoiceSynthPiano)(ctx, dest, midi, t, dur, vel);
}
function jzVoiceSynthPiano(ctx, dest, midi, t, dur, vel){
  const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  o1.type = 'triangle'; o2.type = 'sine';
  o1.frequency.value = jzMidiHz(midi); o2.frequency.value = jzMidiHz(midi) * 2;
  f.type = 'lowpass'; f.frequency.value = 2600;
  const v = (vel || 0.5) * 0.16;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + 0.012);
  g.gain.exponentialRampToValueAtTime(v * 0.45, t + 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.2, dur));
  const g2 = ctx.createGain(); g2.gain.value = 0.25;
  o1.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(dest);
  o1.start(t); o2.start(t); o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
}
function jzVoiceBass(ctx, dest, midi, t, dur, vel){
  const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  o.type = 'sine'; o2.type = 'triangle';
  o.frequency.value = jzMidiHz(midi); o2.frequency.value = jzMidiHz(midi);
  f.type = 'lowpass'; f.frequency.value = 900;
  const v = (vel || 0.8) * 0.5;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + 0.008);
  g.gain.exponentialRampToValueAtTime(v * 0.35, t + 0.18);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.15, dur * 0.95));
  const g2 = ctx.createGain(); g2.gain.value = 0.3;
  o.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(dest);
  o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
}
let _jzNoise = null;
function jzNoise(ctx){
  if(_jzNoise && _jzNoise.sampleRate === ctx.sampleRate && _jzNoise._ctx === ctx) return _jzNoise;
  const b = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
  const d = b.getChannelData(0); for(let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  b._ctx = ctx; _jzNoise = b; return b;
}
function jzVoiceCymbal(ctx, dest, t, kind, vel){
  const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  n.buffer = jzNoise(ctx);
  f.type = kind === 'hat' ? 'highpass' : 'bandpass';
  f.frequency.value = kind === 'hat' ? 7000 : 6200; f.Q.value = kind === 'hat' ? 0.7 : 1.4;
  const v = (vel || 0.5) * (kind === 'hat' ? 0.12 : 0.08), dur = kind === 'hat' ? 0.05 : 0.32;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(f); f.connect(g); g.connect(dest); n.start(t); n.stop(t + dur + 0.02);
}
function jzVoiceClick(ctx, dest, t, accent){
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'square'; o.frequency.value = accent ? 1760 : 1320;
  g.gain.setValueAtTime(accent ? 0.16 : 0.1, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.05);
}

/* ---------- a chart as beats ----------
   From a parsed chart (jazzParseChart): one entry a beat, carrying the
   chord that sounds on it and whether it is the chord's first beat. */
function jazzChartBeats(chart, beatsPerBar, semis, toKey){
  const out = [];
  let last = null;
  (chart.bars || []).forEach(b => {
    const cs = b.chords.filter(c => !c.optional || b.chords.every(x => x.optional));
    if(!cs.length){ for(let i = 0; i < beatsPerBar; i++) out.push({bar: b.n, beat: i, sym: last, first: false}); return; }
    const total = cs.reduce((a, c) => a + (c.beats || 1), 0);
    let beat = 0;
    cs.forEach((c, ci) => {
      const len = ci === cs.length - 1 ? beatsPerBar - beat : Math.max(1, Math.round((c.beats || 1) / total * beatsPerBar));
      const sym = typeof jazzTransposeChord === 'function' ? jazzTransposeChord(c.text, semis || 0, toKey) : c.text;
      for(let i = 0; i < len && beat < beatsPerBar; i++, beat++)
        out.push({bar: b.n, beat, sym, first: i === 0 && !(b.repeat && sym === last)});
      last = sym;
    });
  });
  return out;
}
/* a walking line: root on the chord's first beat, chord tones between,
   and a half step into the next root on the beat before it changes */
function jazzWalkBass(beats, loop){
  const line = [];
  let prev = 36;
  beats.forEach((b, i) => {
    const spec = jazzChordSpec(b.sym);
    if(!spec){ line.push(null); return; }
    /* looping, the last bar walks into the first */
    const after = beats[i + 1] || (loop ? beats[0] : null);
    const next = after && after.sym !== b.sym ? jazzChordSpec(after.sym) : null;
    const place = pc => { let m = 28 + ((pc - 28) % 12 + 12) % 12; while(Math.abs(m - prev) > 7 && m + 12 <= 55) m += 12; while(m > 52) m -= 12; return m; };
    let m;
    if(b.first || i === 0) m = place(spec.bassPc != null ? spec.bassPc : spec.pc);
    else if(next) m = place((next.pc + (i % 2 ? 11 : 1)) % 12);
    else { const t = spec.tones[(b.beat % 2) + 1] ?? 7; m = place((spec.pc + t) % 12); }
    line.push(m); prev = m;
  });
  return line;
}

/* ---------- the play-along ----------
   opts: {bpm, swing (0.5 straight – 0.75 hard), semis, toKey, loop,
   layers: {bass, piano, drums} true/false, countIn, style:'swing'|'bossa'|'waltz',
   at (the audio-clock time of the first beat, when something else counted in),
   onBar(n), onEnd()} */
function jazzBand(chart, opts){
  const o = Object.assign({bpm: 120, swing: 0.62, semis: 0, loop: true, countIn: true, style: 'swing',
    layers: {bass: true, piano: true, drums: true}}, opts || {});
  const per = o.style === 'waltz' ? 3 : 4;
  /* range: [from, to] — only those bars, as the chart numbers them */
  const barsIn = () => { const r = o.range;
    return r ? {bars: (chart.bars || []).filter(b => b.n >= r[0] && b.n <= r[1])} : chart; };
  let beats = [], bass = [];
  const build = () => { beats = jazzChartBeats(barsIn(), per, o.semis, o.toKey); bass = jazzWalkBass(beats, o.loop); };
  build();
  let ctx = null, master = null, timer = null, i = 0, next = 0, running = false, voicing = null, pass = 1, dirty = false;
  const spb = () => 60 / o.bpm;
  const schedule = limit => {
    const until = limit != null ? limit : ctx.currentTime + 0.12;
    while(running && next < until){
      if(i >= beats.length){
        if(!o.loop){ running = false; setTimeout(() => o.onEnd && o.onEnd(), 300); return; }
        i = 0; pass++;
        /* a repeat: the caller may change the tempo, the key or the range for
           the next pass (onLoop gets the pass number and how many ms until it
           is heard); a new key or range is written out before it plays */
        if(o.onLoop){ try { o.onLoop(pass, Math.max(0, (next - ctx.currentTime) * 1000)); } catch(e){ console.warn(e); } }
        if(!running) return;
        if(dirty){ dirty = false; build(); voicing = null; }
        if(!beats.length){ running = false; return; }
      }
      const b = beats[i], t = next, beat = spb();
      const sw = beat * o.swing;                         /* where the "and" of the beat falls */
      if(b.beat === 0 && o.onBar) setTimeout(() => running && o.onBar(b.bar), Math.max(0, (t - ctx.currentTime) * 1000));
      const L = o.layers;
      if(L.drums){
        if(o.style === 'bossa'){ jzVoiceCymbal(ctx, master, t, 'hat', 0.4); jzVoiceCymbal(ctx, master, t + beat / 2, 'hat', 0.3); }
        else {
          jzVoiceCymbal(ctx, master, t, 'ride', b.beat % 2 ? 0.55 : 0.7);
          if(b.beat % 2 === 1) jzVoiceCymbal(ctx, master, t + sw, 'ride', 0.45);
          if(b.beat % 2 === 1 && o.style !== 'waltz') jzVoiceCymbal(ctx, master, t, 'hat', 0.7);
        }
      }
      if(L.bass && bass[i] != null){
        if(o.style === 'bossa'){ if(b.beat % 2 === 0) jzVoiceBass(ctx, master, bass[i], t, beat * 1.4, 0.8); }
        else jzVoiceBass(ctx, master, bass[i], t, beat * 0.92, 0.8);
      }
      if(L.piano && b.sym){
        const spec = jazzChordSpec(b.sym);
        if(spec && b.first) voicing = jazzCompVoicing(spec, voicing ? voicing[0] + 4 : 60);
        if(voicing){
          /* the Charleston: on one, and on the and of two */
          if(o.style === 'waltz'){ if(b.beat === 0 || b.beat === 2) voicing.forEach(m => jzVoicePiano(ctx, master, m, t, beat * 0.8, 0.5)); }
          else if(o.style === 'bossa'){ if(b.beat === 0 || b.beat === 2) voicing.forEach(m => jzVoicePiano(ctx, master, m, t + (b.beat === 2 ? beat / 2 : 0), beat * 0.7, 0.45)); }
          else {
            if(b.beat === 0 || (b.first && b.beat === 2)) voicing.forEach(m => jzVoicePiano(ctx, master, m, t, beat * 1.2, 0.5));
            if(b.beat === 1) voicing.forEach(m => jzVoicePiano(ctx, master, m, t + sw, beat * 0.6, 0.42));
          }
        }
      }
      next += beat; i++;
    }
  };
  return {
    start(ctxIn){
      ctx = ctxIn || jazzAudioCtx(); if(!ctx) return false;
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const offline = !!(OAC && ctx instanceof OAC);
      if(!offline && ctx.resume) ctx.resume();
      master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
      next = o.at != null ? Math.max(o.at, ctx.currentTime + 0.02) : ctx.currentTime + 0.1; i = 0; pass = 1; running = true; voicing = null;
      if(o.countIn){ for(let k = 0; k < per; k++) jzVoiceClick(ctx, master, next + k * spb(), k === 0); next += per * spb(); }
      /* offline, everything is scheduled at once, up to the end of the buffer */
      if(offline){ schedule(ctx.length / ctx.sampleRate); running = false; return true; }
      timer = setInterval(() => schedule(), 25); schedule();
      return true;
    },
    stop(){ running = false; if(timer) clearInterval(timer); timer = null;
      if(master){ try { master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05); } catch(e){} setTimeout(() => { try { master.disconnect(); } catch(e){} }, 400); } },
    set(k, v){ o[k] = v; if(k === 'semis' || k === 'toKey' || k === 'range') dirty = true; },
    setLayer(k, on){ o.layers[k] = on; },
    get beats(){ return beats; },
    get pass(){ return pass; },
    get bpm(){ return o.bpm; },
    get running(){ return running; }
  };
}
/* The same band, rendered offline — for the smoke test to prove it makes a sound. */
async function jazzBandRenderPeak(chart, opts, seconds){
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if(!OAC) return 0;
  const ctx = new OAC(1, 44100 * (seconds || 3), 44100);
  const band = jazzBand(chart, Object.assign({loop: false, countIn: false}, opts || {}));
  band.start(ctx);
  const buf = await ctx.startRendering();
  const d = buf.getChannelData(0); let peak = 0;
  for(let k = 0; k < d.length; k += 7) peak = Math.max(peak, Math.abs(d[k]));
  return peak;
}

/* ---------- the metronome ----------
   Section 4C: "clicks on 2 and 4 (simulating hi-hat), adjustable swing
   ratio". With the swing on, the and of every beat clicks softly where
   a swung eighth falls, so the ratio can be heard. */
function jazzMetronome(o){
  const opt = Object.assign({bpm: 120, beats: 4, on24: true, swing: 0.62, eighths: false}, o || {});
  let ctx, g, timer, n = 0, next = 0, run = false;
  const tick = () => {
    const spb = 60 / opt.bpm;
    while(run && next < ctx.currentTime + 0.12){
      const b = n % opt.beats;
      if(!opt.on24 || b % 2 === 1) jzVoiceClick(ctx, g, next, !opt.on24 && b === 0);
      if(opt.eighths) jzVoiceCymbal(ctx, g, next + spb * opt.swing, 'hat', 0.4);
      next += spb; n++;
    }
  };
  return {start(){ ctx = jazzAudioCtx(); if(!ctx) return; ctx.resume && ctx.resume(); g = ctx.createGain(); g.gain.value = 0.9; g.connect(ctx.destination);
      next = ctx.currentTime + 0.05; n = 0; run = true; timer = setInterval(tick, 25); tick(); },
    stop(){ run = false; clearInterval(timer); if(g) setTimeout(() => { try { g.disconnect(); } catch(e){} }, 200); },
    set(k, v){ opt[k] = v; }, get running(){ return run; }};
}

/* ---------- the drone ----------
   Section 4B: "Record over the drone." An open fifth low in the piano,
   held until stopped — the drone of Siskind's first improvisation. */
function jazzDrone(rootPc){
  const ctx = jazzAudioCtx(); if(!ctx) return {stop(){}};
  ctx.resume && ctx.resume();
  /* on the grand: the fifth struck softly and struck again before it dies,
     so it is held the way a pianist holds it, with the pedal down */
  if(typeof grandPianoReady === 'function' && grandPianoReady()){
    const g = ctx.createGain(); g.gain.value = 0.9; g.connect(ctx.destination);
    const root = 36 + (((rootPc || 0) % 12) + 12) % 12;
    const strike = () => { const t = ctx.currentTime + 0.03;
      [root, root + 7, root + 12].forEach((m, k) => grandPianoNote(ctx, g, m, t + k * 0.012, 6, k === 2 ? 0.3 : 0.4, 6.5, 0.6)); };
    strike();
    const timer = setInterval(strike, 4200);
    return {stop(){ clearInterval(timer); const t = ctx.currentTime;
      g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.setTargetAtTime(0.0001, t, 0.2);
      setTimeout(() => { try { g.disconnect(); } catch(e){} }, 2500); }};
  }
  const g = ctx.createGain(); g.gain.value = 0.0001; g.connect(ctx.destination);
  g.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.8);
  const root = 36 + (((rootPc || 0) % 12) + 12) % 12;
  const oscs = [root, root + 7, root + 12].map((m, k) => {
    const o = ctx.createOscillator(); o.type = k === 2 ? 'sine' : 'triangle'; o.frequency.value = jzMidiHz(m);
    o.detune.value = k === 1 ? 2 : 0;
    const og = ctx.createGain(); og.gain.value = k === 2 ? 0.35 : 0.6; o.connect(og); og.connect(g); o.start(); return o; });
  return {stop(){ const t = ctx.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); oscs.forEach(o => o.stop(t + 0.7)); }};
}
/* one chord, heard — for the audiation reveal and the flashcards' answer */
function jazzPlayChord(sym, arpeggiate){
  const spec = jazzChordSpec(sym); const ctx = jazzAudioCtx(); if(!spec || !ctx) return;
  ctx.resume && ctx.resume();
  const g = ctx.createGain(); g.gain.value = 0.9; g.connect(ctx.destination);
  jzWhenPiano(() => {
    const t = ctx.currentTime + 0.03;
    jzVoiceKeys(ctx, g, 36 + ((spec.bassPc != null ? spec.bassPc : spec.pc) % 12), t, 2.2, 0.55);
    jazzCompVoicing(spec, 60).forEach((m, k) => jzVoiceKeys(ctx, g, m, t + (arpeggiate ? k * 0.12 : 0), 2.2, 0.55));
  });
}
/* the first note of a session waits the moment it takes to decode the grand,
   so what is heard is the piano and not its stand-in */
function jzWhenPiano(fn){
  if(typeof grandPianoSettled !== 'function' || grandPianoSettled()) return fn();
  grandPianoLoad().then(fn);
}
function jazzPlayMidis(midis, arpeggiate){
  const ctx = jazzAudioCtx(); if(!ctx) return; ctx.resume && ctx.resume();
  const g = ctx.createGain(); g.gain.value = 0.9; g.connect(ctx.destination);
  jzWhenPiano(() => {
    const t = ctx.currentTime + 0.03;
    midis.forEach((m, k) => jzVoiceKeys(ctx, g, m, t + (arpeggiate ? k * 0.12 : 0), 1.8, 0.55));
  });
}

/* ---------- the microphone ---------- */
const jazzCanRecord = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && typeof MediaRecorder === 'function');
async function jazzRecorder(){
  if(!jazzCanRecord()) throw new Error('This browser cannot record from a microphone.');
  const stream = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: false, noiseSuppression: false}});
  const rec = new MediaRecorder(stream);
  const parts = []; let t0 = 0;
  rec.ondataavailable = e => { if(e.data && e.data.size) parts.push(e.data); };
  return {
    start(){ t0 = performance.now(); rec.start(250); },
    stop(){ return new Promise(res => {
      rec.onstop = () => { stream.getTracks().forEach(t => t.stop());
        res({blob: parts.length ? new Blob(parts, {type: parts[0].type || 'audio/webm'}) : null,
          seconds: Math.round((performance.now() - t0) / 100) / 10}); };
      try { rec.stop(); } catch(e){ res({blob: null, seconds: 0}); } }); },
    stream
  };
}
/* the recordings' blobs, in their own store */
async function jazzPutAudio(blob){
  if(!blob) return null;
  const id = uid();
  try { await db.jazzAudio.put({id, blob, at: new Date().toISOString()}); return id; }
  catch(e){ console.warn('the recording could not be kept', e); return null; }
}
async function jazzGetAudio(id){
  if(!id) return null;
  try { const row = await db.jazzAudio.get(id); return row ? row.blob : null; } catch(e){ return null; }
}
async function jazzDropAudio(id){ if(id) try { await db.jazzAudio.delete(id); } catch(e){} }
/* what the state keeps about a recording: everything but the sound */
function jazzRecordings(){
  const j = jazzState();
  j.recordings = Array.isArray(j.recordings) ? j.recordings : [];
  return j.recordings;
}
function jazzAddRecording(r){
  const list = jazzRecordings();
  const rec = Object.assign({id: uid(), at: new Date().toISOString(), day: today()}, r);
  list.unshift(rec); saveNow(); return rec;
}
async function jazzRemoveRecording(id){
  const list = jazzRecordings(), r = list.find(x => x.id === id);
  if(!r) return;
  await Promise.all([r.audioId, r.vocalId, r.pianoId].filter(Boolean).map(jazzDropAudio));
  jazzState().recordings = list.filter(x => x.id !== id); saveNow();
}

/* ---------- looking at a recording ---------- */
async function jazzDecode(blob){
  const ctx = jazzAudioCtx(); if(!ctx || !blob) return null;
  try { return await ctx.decodeAudioData(await blob.arrayBuffer()); } catch(e){ return null; }
}
/* the peaks of one or more recordings, drawn over each other */
function jazzDrawWaves(canvas, buffers, colours){
  if(!canvas) return;
  const w = canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1) || 600;
  const h = canvas.height = (canvas.clientHeight || 90) * (window.devicePixelRatio || 1);
  const g = canvas.getContext('2d'); g.clearRect(0, 0, w, h);
  const longest = Math.max(1, ...buffers.filter(Boolean).map(b => b.duration));
  buffers.forEach((b, k) => {
    if(!b) return;
    const d = b.getChannelData(0), span = Math.max(1, Math.floor(w * b.duration / longest));
    const step = Math.max(1, Math.floor(d.length / span));
    g.fillStyle = colours[k] || '#888'; g.globalAlpha = buffers.length > 1 ? 0.6 : 0.9;
    for(let x = 0; x < span; x++){
      let mx = 0; for(let i = x * step; i < (x + 1) * step && i < d.length; i += 4) mx = Math.max(mx, Math.abs(d[i]));
      const y = mx * h * 0.48; g.fillRect(x, h / 2 - y, 1, Math.max(1, y * 2));
    }
  });
  g.globalAlpha = 1;
}
/* Section 4B: "Optional pitch detection showing note names." Autocorrelation
   over short windows; a note is reported when the same pitch holds for a
   few windows running, so a slide or a breath does not become a note. */
const JZ_NOTE_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
function jazzDetectPitches(buf){
  if(!buf) return [];
  const d = buf.getChannelData(0), sr = buf.sampleRate, size = 2048, hop = 1024;
  const out = []; let run = null;
  for(let s = 0; s + size < d.length; s += hop){
    let rms = 0; for(let i = 0; i < size; i++) rms += d[s + i] * d[s + i];
    rms = Math.sqrt(rms / size);
    let midi = null;
    if(rms > 0.02){
      let best = 0, bestLag = -1;
      const minLag = Math.floor(sr / 1100), maxLag = Math.floor(sr / 70);
      for(let lag = minLag; lag <= maxLag; lag++){
        let c = 0; for(let i = 0; i < size - lag; i += 2) c += d[s + i] * d[s + i + lag];
        if(c > best){ best = c; bestLag = lag; }
      }
      if(bestLag > 0) midi = Math.round(69 + 12 * Math.log2((sr / bestLag) / 440));
    }
    if(midi != null && run && run.midi === midi) run.n++;
    else { if(run && run.n >= 3) out.push(run.midi); run = midi != null ? {midi, n: 1} : null; }
  }
  if(run && run.n >= 3) out.push(run.midi);
  return out.filter((m, i) => m !== out[i - 1]);
}
const jazzMidiName = m => JZ_NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
