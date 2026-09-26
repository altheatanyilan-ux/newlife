/* ============================================================
   SONGWRITING STUDIO — THE GROOVE ENGINE

   Plays a progression in a rhythm style. Every note is booked on the
   AudioContext's own clock a little ahead of time (a lookahead scheduler:
   a 25 ms timer books whatever falls in the next 150 ms), never timed by
   setTimeout, so the groove does not stumble when the page is busy.

   Sounds are synthesized (the piano is the house's grand where it is
   loaded) and the patterns are simplified standard versions — the room
   says so. The same events feed the MIDI writer: chords on channel 1,
   bass on 2, drums on 10 (General MIDI).

   sngGrooveEvents(o, fromBar, bars) → the events, in sixteenth-note steps;
   sngGroove(o) → a player {start, stop, set, running, bar};
   sngMidiFile(o, bars) → the bytes of a Standard MIDI File.
   o = {chords: [{root, quality}] (one per bar), keyPc, style, bpm, swing,
   humanize, anticipation, voicing, tone, level ('thin'|'normal'|'thick'),
   bassGen, grid (an edited rhythmic idea: {chord: [steps], bass, drums}),
   mute {chords, bass, drums}, vol {chords, bass, drums}, loop}
   ============================================================ */
const SNG_BASS_GENS = [['style', 'As the style plays it'], ['root', 'Roots'], ['root-fifth', 'Root and fifth'], ['walking', 'Walking (chromatic approach)'],
  ['boogie', 'Boogie'], ['bossa', 'Bossa'], ['tumbao', 'Tumbao'], ['habanera', 'Habanera'], ['808', '808 (long, sliding)']];
const SNG_TONES = [['piano', 'Piano'], ['rhodes', 'Rhodes'], ['pad', 'Pad']];
const SNG_DRUM_GM = {kick: 36, snare: 38, rimclick: 37, hat: 42, hatOpen: 46, ride: 51, brush: 38, clave: 75, cowbell: 56, shaker: 70, congaLow: 64, congaHi: 63, surdo: 41};

const sngBarSteps = style => { const [n, d] = (style && style.timeSig) || [4, 4]; return Math.round(n * 16 / d); };
const sngPatternBars = style => { let mx = 0; const all = [...Object.values(style.drums || {}).flat(), ...((style.bass || {}).notes || []), ...((style.voicing || {}).hits || [])];
  all.forEach(e => { mx = Math.max(mx, e.t + 0.001); }); return Math.max(1, Math.ceil(mx / sngBarSteps(style))); };
/* seconds per step: a sixteenth of a quarter in x/4; in x/8 the beat is the dotted quarter */
const sngStepSec = (style, bpm) => { const d = ((style && style.timeSig) || [4, 4])[1]; return d === 8 ? 60 / bpm / 6 : 60 / bpm / 4; };

/* ---------- the events ---------- */
/* thinner: only the strong beats (the downbeat and the middle of the bar);
   a pattern that already plays only those keeps every other hit */
function sngThin(hits, style){
  const S = sngBarSteps(style), strong = hits.filter(h => h.t % (S / 2) === 0 || h.t % S === 0);
  if(strong.length && strong.length < hits.length) return strong;
  return hits.filter((h, i) => i % 2 === 0);
}
function sngThicken(hits, style){
  const L = sngBarSteps(style) * sngPatternBars(style), out = hits.slice();
  hits.forEach((h, i) => { const nx = i + 1 < hits.length ? hits[i + 1].t : L; const mid = Math.round((h.t + nx) / 2);
    if(nx - h.t >= 4 && !hits.some(x => x.t === mid)) out.push({t: mid, dur: Math.max(1, (nx - h.t) / 2), vel: (h.vel || 0.6) * 0.75}); });
  return out.sort((a, b) => a.t - b.t);
}
/* the bass line for one bar, from a generator or the style's own pattern */
function sngBassBar(o, ch, next, barIdx){
  const style = o.style, S = sngBarSteps(style), root = sngBassNote(ch, o.keyPc), q = SNG_QUALITY[ch.quality] || SNG_QUALITY.maj;
  const fifth = q.includes(6) ? 6 : q.includes(8) ? 8 : 7, third = q.includes(3) ? 3 : 4;
  const nextRoot = next ? sngBassNote(next, o.keyPc) : root;
  const beat = style.timeSig[1] === 8 ? 6 : 4, beats = Math.max(1, Math.round(S / beat));
  const N = (t, midi, dur, vel = 0.8) => ({t, midi, dur, vel});
  switch(o.bassGen){
    case 'root': return [N(0, root, S * 0.9)];
    case 'root-fifth': return beats >= 4 ? [N(0, root, beat * 2 - 1), N(beat * 2, root + fifth, beat * 2 - 1)] : [N(0, root, beat - 1), N(beat, root + fifth, beat * (beats - 1) - 1)];
    case 'walking': {
      /* chord tones on the strong beats, a chromatic approach into the next root */
      const line = [root, root + (beats > 2 ? third : fifth), root + fifth];
      const out = [];
      for(let b = 0; b < beats; b++){
        let m = b === beats - 1 ? nextRoot + (nextRoot > root ? -1 : 1) : line[b % line.length];
        while(m < 31) m += 12; while(m > 55) m -= 12;
        out.push(N(b * beat, m, beat - 0.5, b === 0 ? 0.85 : 0.7));
      }
      return out;
    }
    case 'boogie': { const seq = [0, 4, 7, 9, 10, 9, 7, 4].map(x => x === 4 ? third : x); return seq.slice(0, Math.max(1, S / 2)).map((x, i) => N(i * 2, root + x, 1.8, i % 2 ? 0.65 : 0.8)); }
    case 'bossa': return [N(0, root, 5.5), N(6, root + fifth, 1.8), N(8, root + fifth, 5.5), N(14, root, 1.8)].filter(n => n.t < S);
    case 'tumbao': return [N(6, root + fifth, 3.5), N(10, root, 2), N(12, root, 3.5)].filter(n => n.t < S);
    case 'habanera': return [N(0, root, 2.8), N(3, root + fifth, 0.9), N(4, root + fifth, 3.8), N(8, root, 3.8), N(12, root + fifth, 3.8)].filter(n => n.t < S);
    case '808': return [N(0, root - 12, S * 0.6, 0.95), N(Math.round(S * 0.625), root - 12, S * 0.3, 0.8)];
    default: {
      const bars = sngPatternBars(style), off = (barIdx % bars) * S;
      return ((style.bass || {}).notes || []).filter(n => n.t >= off && n.t < off + S).map(n => N(n.t - off, root + (n.oct != null ? (n.oct - 2) * 12 : 0) + (n.deg || 0), n.dur || 2, 0.8));
    }
  }
}
/* all events of bars [from, from + n): {t (steps from the first bar), dur, kind, midi, vel, voice} */
function sngGrooveEvents(o, from, n){
  const style = o.style, S = sngBarSteps(style), pb = sngPatternBars(style), out = [];
  const chords = o.chords && o.chords.length ? o.chords : [{root: 0, quality: 'maj'}];
  let prevVoicing = null;
  const scaleOf = ch => o.voicing === 'tension' ? sngScalesFor(ch, {keyPc: o.keyPc, colour: o.colour}).scales[0] : null;
  for(let b = from; b < from + n; b++){
    const ch = chords[((b % chords.length) + chords.length) % chords.length], next = chords[(((b + 1) % chords.length) + chords.length) % chords.length];
    const base = (b - from) * S, off = (b % pb) * S;
    /* the chord hits: the edited grid, or the style's, thinned or thickened */
    let hits = o.grid && o.grid.chord ? o.grid.chord.map(t => ({t: t + off, dur: 2, vel: 0.6})) : ((style.voicing || {}).hits || []).slice();
    if(o.level === 'thin') hits = sngThin(hits, style); else if(o.level === 'thick') hits = sngThicken(hits, style);
    hits = hits.filter(h => h.t >= off && h.t < off + S).map(h => Object.assign({}, h, {t: h.t - off}));
    const notes = sngVoice(ch, o.keyPc, o.voicing || style.voicingDefault || 'triad', prevVoicing, scaleOf(ch)); prevVoicing = notes;
    const nextNotes = sngVoice(next, o.keyPc, o.voicing || style.voicingDefault || 'triad', notes, scaleOf(next));
    /* anticipation: the next bar's downbeat chord comes an eighth early,
       at the end of this bar, and is not struck again on the downbeat */
    const half = style.timeSig[1] === 8 ? 3 : 2;
    const antic = o.anticipation && hits.length > 0;
    if(antic){
      if(b > from) hits = hits.filter(h => h.t !== 0);
      hits = hits.filter(h => h.t < S - half);
    }
    const put = (h, midis) => { if((style.voicing || {}).type === 'arp') midis.forEach((m, i) => out.push({t: base + h.t + i * 0.5, dur: Math.max(1, (h.dur || 2) - i * 0.5), kind: 'chord', midi: m, vel: (h.vel || 0.6) * 0.8}));
      else midis.forEach(m => out.push({t: base + h.t, dur: h.dur || 2, kind: 'chord', midi: m, vel: h.vel || 0.6})); };
    if(!(o.mute && o.mute.chords)){
      hits.forEach(h => put(h, notes));
      if(antic && (b + 1 < from + n || o.loop !== false)) put({t: S - half, dur: half + 2, vel: 0.7}, nextNotes);
    }
    if(!(o.mute && o.mute.bass)){
      const gridBass = o.grid && o.grid.bass;
      const line = gridBass ? gridBass.map(t => ({t: t - (t >= S ? S : 0), midi: sngBassNote(ch, o.keyPc), dur: 1.8, vel: 0.8})).filter(n => n.t < S) : sngBassBar(o, ch, next, b);
      line.forEach(nb => out.push({t: base + nb.t, dur: nb.dur, kind: 'bass', midi: nb.midi, vel: nb.vel, slide: o.bassGen === '808'}));
    }
    if(!(o.mute && o.mute.drums)){
      const drums = o.grid && o.grid.drums ? o.grid.drums : style.drums || {};
      Object.entries(drums).forEach(([voice, list]) => (list || []).forEach(h => {
        const t = typeof h === 'number' ? h : h.t, vel = typeof h === 'number' ? 0.7 : (h.vel || 0.7);
        if(t < off || t >= off + S) return;
        const v = (style.kit && style.kit[voice]) || voice;
        out.push({t: base + t - off, dur: 1, kind: 'drum', voice: v, midi: SNG_DRUM_GM[v] || 38, vel});
      }));
    }
  }
  return out.sort((a, c) => a.t - c.t);
}
/* a step's place in time: swung eighths (and sixteenths with them) in x/4 */
function sngSwungStep(t, swing, style){
  if(!swing || swing <= 0.5 || style.timeSig[1] !== 4) return t;
  const beat = Math.floor(t / 4), f = t - beat * 4;
  const s = swing, map = f <= 2 ? f * (s * 4) / 2 : s * 4 + (f - 2) * ((1 - s) * 4) / 2;
  return beat * 4 + map;
}

/* ---------- the voices ---------- */
let _sngNoise = null;
function sngNoiseBuf(ctx){ if(_sngNoise && _sngNoise.sampleRate === ctx.sampleRate) return _sngNoise;
  const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0); for(let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return (_sngNoise = b); }
const sngHz = m => 440 * Math.pow(2, (m - 69) / 12);
function sngEnv(ctx, dest, t, a, peak, d, sus, r, len){
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.setTargetAtTime(peak * sus, t + a, d); g.gain.setTargetAtTime(0.0001, t + Math.max(a, len), r); g.connect(dest); return g;
}
function sngOsc(ctx, type, hz, t, stop, dest, detune){ const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(hz, t); if(detune) o.detune.setValueAtTime(detune, t); o.connect(dest); o.start(t); o.stop(stop); return o; }
function sngTone(ctx, dest, tone, midi, t, dur, vel){
  if(tone === 'piano' && typeof plxPiano === 'function'){ try { plxPiano(ctx, dest, midi, t, dur, vel, dur); return; } catch(e){} }
  const hz = sngHz(midi), end = t + dur + 1.2;
  if(tone === 'pad'){
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.Q.value = 0.5; f.connect(dest);
    const g = sngEnv(ctx, f, t, 0.35, 0.09 * vel, 0.8, 0.8, 0.6, dur);
    [-7, 7].forEach(dt => sngOsc(ctx, 'sawtooth', hz, t, end + 1, g, dt));
    return;
  }
  if(tone === 'rhodes'){
    /* a sine struck by a quick, decaying modulator: the tine's bell */
    const g = sngEnv(ctx, dest, t, 0.005, 0.28 * vel, 0.9, 0.35, 0.35, dur);
    const car = ctx.createOscillator(); car.frequency.setValueAtTime(hz, t);
    const mod = ctx.createOscillator(); mod.frequency.setValueAtTime(hz * 14, t);
    const mg = ctx.createGain(); mg.gain.setValueAtTime(hz * 2.2 * vel, t); mg.gain.setTargetAtTime(hz * 0.05, t, 0.08);
    mod.connect(mg); mg.connect(car.frequency); car.connect(g);
    car.start(t); mod.start(t); car.stop(end); mod.stop(end);
    return;
  }
  /* the fallback piano: two partials and a quick decay */
  const g = sngEnv(ctx, dest, t, 0.004, 0.22 * vel, 0.5, 0.25, 0.3, dur);
  sngOsc(ctx, 'triangle', hz, t, end, g); const g2 = ctx.createGain(); g2.gain.value = 0.3; g2.connect(g); sngOsc(ctx, 'sine', hz * 2, t, end, g2);
}
function sngBass(ctx, dest, midi, t, dur, vel, slide){
  if(!slide && typeof instrumentNote === 'function' && typeof instrumentReady === 'function' && typeof orchestraAvailable === 'function' && orchestraAvailable()
    && instrumentReady('acoustic_bass') && instrumentNote(ctx, dest, 'acoustic_bass', midi, t, dur, vel * 0.9, dur, 1)) return;
  const hz = sngHz(midi), end = t + dur + 0.4;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(slide ? 400 : 700, t); f.connect(dest);
  const g = sngEnv(ctx, f, t, 0.006, (slide ? 0.55 : 0.4) * vel, 0.25, slide ? 0.8 : 0.45, 0.08, dur);
  const o = sngOsc(ctx, slide ? 'sine' : 'triangle', hz, t, end, g);
  if(slide){ o.frequency.setValueAtTime(hz * 1.5, t); o.frequency.exponentialRampToValueAtTime(hz, t + 0.06); }
  if(!slide){ const s = ctx.createGain(); s.gain.value = 0.6; s.connect(g); sngOsc(ctx, 'sine', hz, t, end, s); }
}
/* the recorded kit (19-instruments.js) where it is loaded; synthesised otherwise */
const SNG_KIT_GM = {kick: 36, snare: 38, rimclick: 37, hat: 42, hatOpen: 46, ride: 51, brush: 24, surdo: 41};
function sngDrum(ctx, dest, voice, t, vel){
  if(typeof orchKitHit === 'function' && SNG_KIT_GM[voice] && orchKitHit(ctx, dest, SNG_KIT_GM[voice], t, vel * 0.9, 0.3)) return;
  const noise = (len, type, freq, q, peak, dec) => { const src = ctx.createBufferSource(); src.buffer = sngNoiseBuf(ctx);
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; if(q) f.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(peak * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    src.connect(f); f.connect(g); g.connect(dest); src.start(t, Math.random() * 0.5); src.stop(t + len); };
  const tone = (f0, f1, dec, peak, type = 'sine') => { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if(f1) o.frequency.exponentialRampToValueAtTime(f1, t + dec * 0.6);
    const g = ctx.createGain(); g.gain.setValueAtTime(peak * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dec); o.connect(g); g.connect(dest); o.start(t); o.stop(t + dec + 0.02); };
  switch(voice){
    case 'kick': tone(120, 45, 0.35, 0.9); break;
    case 'surdo': tone(80, 55, 0.6, 0.8); break;
    case 'snare': noise(0.2, 'highpass', 1500, 0, 0.45, 0.16); tone(190, 150, 0.08, 0.35, 'triangle'); break;
    case 'brush': noise(0.3, 'bandpass', 3000, 0.7, 0.18, 0.25); break;
    case 'rimclick': tone(1700, 0, 0.03, 0.35, 'square'); noise(0.03, 'highpass', 3000, 0, 0.15, 0.02); break;
    case 'hat': noise(0.06, 'highpass', 7000, 0, 0.22, 0.045); break;
    case 'hatOpen': noise(0.3, 'highpass', 6500, 0, 0.2, 0.25); break;
    case 'ride': noise(0.5, 'bandpass', 6000, 1.5, 0.12, 0.4); tone(3300, 0, 0.35, 0.03, 'square'); break;
    case 'clave': tone(2500, 0, 0.05, 0.4); break;
    case 'cowbell': tone(560, 0, 0.18, 0.18, 'square'); tone(845, 0, 0.18, 0.12, 'square'); break;
    case 'shaker': noise(0.08, 'highpass', 5000, 0, 0.15, 0.06); break;
    case 'congaLow': tone(210, 180, 0.22, 0.5); break;
    case 'congaHi': tone(330, 300, 0.16, 0.45); break;
    default: tone(1000, 0, 0.04, 0.3);
  }
}
function sngCtx(){ const c = typeof plxAudioCtx === 'function' ? plxAudioCtx() : (window._sngCtx = window._sngCtx || new (window.AudioContext || window.webkitAudioContext)()); try { if(c && c.resume) c.resume(); } catch(e){} return c; }

/* ---------- the player ---------- */
let _sngNow = null;
function sngStopAll(){ if(_sngNow){ try { _sngNow.stop(); } catch(e){} _sngNow = null; } }
function sngGroove(opts){
  const o = Object.assign({bpm: 100, swing: 0, humanize: 0, anticipation: false, voicing: null, tone: 'piano', level: 'normal', bassGen: 'style', mute: {}, vol: {chords: 0.8, bass: 0.9, drums: 0.8}, loop: true}, opts || {});
  let ctx = null, bus = null, gains = {}, timer = null, running = false, t0 = 0, nextBar = 0, booked = 0, bar = 0;
  const S = () => sngBarSteps(o.style);
  const stepSec = () => sngStepSec(o.style, o.bpm);
  const rnd = sngRng(Date.now() & 0xffff);
  const bookBar = b => {
    const barStart = t0 + (b - nextBarBase) * S() * stepSec() + barOffset;
    sngGrooveEvents(o, b, 1).forEach(e => {
      const hum = o.humanize ? (rnd() - 0.5) * 0.03 * o.humanize : 0;
      const t = barStart + sngSwungStep(e.t, o.swing, o.style) * stepSec() + hum;
      const dur = Math.max(0.05, e.dur * stepSec());
      const vel = Math.max(0.05, Math.min(1, e.vel * (o.humanize ? 1 + (rnd() - 0.5) * 0.2 * o.humanize : 1)));
      if(t < ctx.currentTime - 0.01) return;
      if(e.kind === 'chord') sngTone(ctx, gains.chords, o.tone, e.midi, t, dur, vel);
      else if(e.kind === 'bass') sngBass(ctx, gains.bass, e.midi, t, dur, vel, e.slide);
      else sngDrum(ctx, gains.drums, e.voice, t, vel);
    });
    const at = barStart;
    setTimeout(() => { if(running){ bar = b; if(o.onBar) o.onBar(b, (b % (o.chords.length || 1))); } }, Math.max(0, (at - ctx.currentTime) * 1000));
  };
  let nextBarBase = 0, barOffset = 0;
  const pump = () => {
    if(!running) return;
    const until = ctx.currentTime + 0.15;
    while(true){
      const start = t0 + (nextBar - nextBarBase) * S() * stepSec() + barOffset;
      if(start > until) break;
      if(!o.loop && nextBar >= (o.bars || o.chords.length)){ const endAt = start; running = false; setTimeout(() => { if(o.onEnd) o.onEnd(); }, Math.max(0, (endAt - ctx.currentTime) * 1000 + 300)); break; }
      bookBar(nextBar); nextBar++;
    }
  };
  const api = {
    start(){
      ctx = sngCtx(); if(!ctx) return false;
      /* the recorded kit and bass, decoded in the background: the first bars may be synthesised */
      if(typeof instrumentsLoad === 'function') try { instrumentsLoad(['kit', 'acoustic_bass']); } catch(e){}
      sngStopAll(); _sngNow = api;
      bus = ctx.createGain(); bus.gain.value = 0.85; bus.connect(ctx.destination);
      ['chords', 'bass', 'drums'].forEach(k => { gains[k] = ctx.createGain(); gains[k].gain.value = o.mute[k] ? 0 : (o.vol[k] == null ? 0.8 : o.vol[k]); gains[k].connect(bus); });
      t0 = ctx.currentTime + 0.08; nextBar = 0; nextBarBase = 0; barOffset = 0; running = true;
      pump(); timer = setInterval(pump, 25);
      return true;
    },
    stop(){ running = false; if(timer) clearInterval(timer); timer = null;
      if(bus){ try { bus.gain.setTargetAtTime(0, ctx.currentTime, 0.02); const b = bus; setTimeout(() => { try { b.disconnect(); } catch(e){} }, 300); } catch(e){} }
      bus = null; if(_sngNow === api) _sngNow = null; if(o.onStop) o.onStop(); },
    /* a change is heard from the next bar not yet booked; a tempo change
       re-anchors the clock there so the beat does not jump */
    set(k, v){
      if(k === 'bpm' && running){
        const at = t0 + (nextBar - nextBarBase) * S() * stepSec() + barOffset;
        o.bpm = v; t0 = at; nextBarBase = nextBar; barOffset = 0; return;
      }
      if(k === 'style' && running){
        const at = t0 + (nextBar - nextBarBase) * S() * stepSec() + barOffset;
        o.style = v; t0 = at; nextBarBase = nextBar; barOffset = 0; return;
      }
      o[k] = v;
      if((k === 'mute' || k === 'vol') && running) ['chords', 'bass', 'drums'].forEach(x => { try { gains[x].gain.setTargetAtTime(o.mute[x] ? 0 : (o.vol[x] == null ? 0.8 : o.vol[x]), ctx.currentTime, 0.03); } catch(e){} });
    },
    get running(){ return running; }, get bar(){ return bar; }, get opts(){ return o; }
  };
  return api;
}
/* a one-off: a chord (or a note) now */
function sngPlayChord(midis, tone = 'piano', dur = 1.2){ const ctx = sngCtx(); if(!ctx) return; const g = ctx.createGain(); g.gain.value = 0.8; g.connect(ctx.destination);
  const t = ctx.currentTime + 0.02; midis.forEach(m => sngTone(ctx, g, tone, m, t, dur, 0.7)); }
/* a melody: [{midi, t (beats), d (beats)}] at bpm, with optional chords under it */
function sngPlayMelody(notes, bpm = 90, o = {}){
  const ctx = sngCtx(); if(!ctx) return null; sngStopAll();
  const g = ctx.createGain(); g.gain.value = 0.9; g.connect(ctx.destination);
  const t0 = ctx.currentTime + 0.08, beat = 60 / bpm;
  notes.forEach(n => { if(n.midi == null) return; sngTone(ctx, g, o.tone || 'rhodes', n.midi, t0 + n.t * beat, Math.max(0.1, n.d * beat * 0.95), n.vel || 0.75); });
  (o.chords || []).forEach(c => c.midis.forEach(m => sngTone(ctx, g, 'pad', m, t0 + c.t * beat, c.d * beat, 0.5)));
  const end = notes.reduce((z, n) => Math.max(z, n.t + n.d), 0) * beat;
  const api = {stop(){ try { g.gain.setTargetAtTime(0, ctx.currentTime, 0.02); setTimeout(() => { try { g.disconnect(); } catch(e){} }, 300); } catch(e){} if(_sngNow === api) _sngNow = null; }, running: true, t0, beat, end};
  _sngNow = api; setTimeout(() => { if(_sngNow === api){ api.running = false; _sngNow = null; if(o.onEnd) o.onEnd(); } }, end * 1000 + 400);
  return api;
}

/* ---------- MIDI ---------- */
/* a small writer: format 1, 480 ticks a quarter; tracks of [{tick, bytes}] */
function sngMidiBytes(tracks, bpm, timeSig){
  const vlq = n => { const b = [n & 0x7f]; while((n >>= 7)) b.unshift((n & 0x7f) | 0x80); return b; };
  const str = s => [...s].map(c => c.charCodeAt(0));
  const u32 = n => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255], u16 = n => [(n >> 8) & 255, n & 255];
  const us = Math.round(60000000 / bpm), [nn, dd] = timeSig || [4, 4];
  const meta = [{tick: 0, bytes: [0xff, 0x51, 3, (us >> 16) & 255, (us >> 8) & 255, us & 255]}, {tick: 0, bytes: [0xff, 0x58, 4, nn, Math.round(Math.log2(dd)), 24, 8]}];
  const chunk = evs => { evs.sort((a, b) => a.tick - b.tick || (a.bytes[0] & 0xf0) - (b.bytes[0] & 0xf0)); let last = 0; const data = [];
    evs.forEach(e => { data.push(...vlq(Math.max(0, e.tick - last)), ...e.bytes); last = e.tick; }); data.push(0, 0xff, 0x2f, 0);
    return [...str('MTrk'), ...u32(data.length), ...data]; };
  const out = [...str('MThd'), ...u32(6), ...u16(1), ...u16(tracks.length + 1), ...u16(480), ...chunk(meta)];
  tracks.forEach(t => out.push(...chunk(t)));
  return new Uint8Array(out);
}
function sngMidiFile(o, bars){
  const style = o.style, perStep = 120;   /* ticks a sixteenth, at 480 a quarter */
  const evs = sngGrooveEvents(Object.assign({}, o, {mute: {}}), 0, bars || Math.max(4, o.chords.length));
  const tr = {chord: [], bass: [], drum: []}, ch = {chord: 0, bass: 1, drum: 9};
  tr.chord.push({tick: 0, bytes: [0xc0, 0]}); tr.bass.push({tick: 0, bytes: [0xc1, 33]});
  evs.forEach(e => {
    const k = e.kind === 'drum' ? 'drum' : e.kind, c = ch[k];
    const on = Math.round(sngSwungStep(e.t, o.swing, style) * perStep), off = on + Math.max(20, Math.round((e.kind === 'drum' ? 0.5 : e.dur) * perStep));
    const v = Math.max(1, Math.min(127, Math.round(e.vel * 110)));
    tr[k].push({tick: on, bytes: [0x90 | c, e.midi, v]}, {tick: off, bytes: [0x80 | c, e.midi, 0]});
  });
  /* the tempo meta is in quarters; in x/8 a step is still a sixteenth */
  const qbpm = style.timeSig[1] === 8 ? o.bpm * 1.5 : o.bpm;
  return sngMidiBytes([tr.chord, tr.bass, tr.drum], qbpm, style.timeSig);
}
function sngDownload(bytes, name, type){
  const blob = new Blob([bytes], {type: type || 'audio/midi'}), url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}
