/* ============================================================
   THE OTHER INSTRUMENTS — bass, violin, cello, flute, strings.

   A duet, a sonata, a concerto reduction, the Jazz Studio's rhythm
   section: the parts that are not piano. Five instruments from the Fluid
   (R3) General MIDI SoundFont by Frank Wen, as rendered by the
   midi-js-soundfonts project, CC BY 3.0 (vendor/gm/LICENSE.md), every minor
   third across each one's range, carried in the page like the piano
   (build.js). Anything else a score names is played on the grand, which is
   what the document asked for when an instrument cannot be found.

   Each is decoded the first time a part needs it, not before: a solo piano
   piece never pays for a violin.

   A BOWED OR BLOWN NOTE IS HELD AS LONG AS IT IS WRITTEN. The recordings
   are three seconds long; a whole note at a slow tempo is longer. Those
   instruments hold a steady tone after their first half-second, so the
   steady part is looped for as long as the note lasts, and the join is
   crossfaded when the note is decoded so the loop does not click. The bass
   is plucked: it rings and dies as a bass does, and is not looped.
   ============================================================ */

/* `orch`: the real instrument (or instruments, split by range) from the
   orchestra set (vendor/orchestra-lite, CC0) that plays this part when the
   page carries it; the GM sample is the fallback. `gm`: which GM set to
   fall back to for an instrument the GM set does not have. */
const INSTRUMENTS = {
  acoustic_bass:     {name: 'Double bass', sustain: false, level: 1.5, release: 0.08, orch: ['bass-pizz']},
  violin:            {name: 'Violin', sustain: true, level: 1.9, release: 0.18, orch: ['violin-solo']},
  cello:             {name: 'Cello', sustain: true, level: 1.9, release: 0.2, orch: ['celli']},
  flute:             {name: 'Flute', sustain: true, level: 1.8, release: 0.12, orch: ['flute']},
  string_ensemble_1: {name: 'Strings', sustain: true, level: 1.8, release: 0.3, orch: ['basses', 'celli', 'violas', 'violins']},
  /* the rest of the orchestra: real samples only (the GM set has none of
     these; where the orchestra is missing they fall back as named) */
  violins:           {name: 'Violins', sustain: true, level: 1.8, release: 0.25, orch: ['violins'], gm: 'string_ensemble_1'},
  viola:             {name: 'Viola', sustain: true, level: 1.9, release: 0.2, orch: ['violas'], gm: 'violin'},
  contrabass:        {name: 'Double bass (bowed)', sustain: true, level: 1.8, release: 0.2, orch: ['basses'], gm: 'cello'},
  pizzicato_strings: {name: 'Strings, pizzicato', sustain: false, level: 1.7, release: 0.1, orch: ['celli-pizz', 'violas-pizz', 'violins-pizz'], gm: 'acoustic_bass'},
  harp:              {name: 'Harp', sustain: false, level: 1.6, release: 0.4, orch: ['harp']},
  piccolo:           {name: 'Piccolo', sustain: true, level: 1.5, release: 0.1, orch: ['piccolo'], gm: 'flute'},
  oboe:              {name: 'Oboe', sustain: true, level: 1.7, release: 0.1, orch: ['oboe'], gm: 'flute'},
  clarinet:          {name: 'Clarinet', sustain: true, level: 1.7, release: 0.1, orch: ['clarinet'], gm: 'flute'},
  bassoon:           {name: 'Bassoon', sustain: true, level: 1.8, release: 0.1, orch: ['bassoon'], gm: 'cello'},
  horn:              {name: 'Horn', sustain: true, level: 1.7, release: 0.15, orch: ['horn'], gm: 'cello'},
  trumpet:           {name: 'Trumpet', sustain: true, level: 1.5, release: 0.1, orch: ['trumpet'], gm: 'flute'},
  trombone:          {name: 'Trombone', sustain: true, level: 1.6, release: 0.12, orch: ['trombone'], gm: 'cello'},
  tuba:              {name: 'Tuba', sustain: true, level: 1.8, release: 0.12, orch: ['tuba'], gm: 'acoustic_bass'},
  sax:               {name: 'Saxophone', sustain: true, level: 1.6, release: 0.1, orch: ['tenor-sax'], gm: 'flute'},
  organ:             {name: 'Organ', sustain: true, level: 1.3, release: 0.15, orch: ['organ']},
  harpsichord:       {name: 'Harpsichord', sustain: false, level: 1.5, release: 0.2, orch: ['harpsichord']},
  vibraphone:        {name: 'Vibraphone', sustain: false, level: 1.5, release: 0.6, orch: ['vibraphone']},
  marimba:           {name: 'Marimba', sustain: false, level: 1.6, release: 0.3, orch: ['marimba']},
  xylophone:         {name: 'Xylophone', sustain: false, level: 1.4, release: 0.2, orch: ['xylophone']},
  glockenspiel:      {name: 'Glockenspiel', sustain: false, level: 1.2, release: 0.5, orch: ['glockenspiel']},
  tubular_bells:     {name: 'Tubular bells', sustain: false, level: 1.3, release: 0.8, orch: ['tubular-bells']},
  timpani:           {name: 'Timpani', sustain: false, level: 1.8, release: 0.5, orch: ['timpani']}
};
/* the looped stretch of a sustained note, and the crossfade that hides its join */
const INSTR_LOOP = [0.9, 2.85], INSTR_XFADE = 0.12;
const INSTR_CREDIT = {name: 'Fluid (R3) General MIDI SoundFont', by: 'Frank Wen', via: 'midi-js-soundfonts',
  licence: 'CC BY 3.0', url: 'https://github.com/gleitz/midi-js-soundfonts', licenceUrl: 'https://creativecommons.org/licenses/by/3.0/us/'};
const _instr = {src: null, sets: {}, loading: {}, stats: {sampled: 0}, failed: {}};

const instrumentsAvailable = () => { const t = document.getElementById('gmSrc'); return !!(t && t.firstChild && t.firstChild.length > 1000); };
/* ready: loaded — or nothing more can be loaded for it, so the player's own
   stand-in voice plays it rather than the page waiting for ever */
function instrumentReady(id){
  if(id === 'piano') return typeof grandPianoReady === 'function' && grandPianoReady();
  if(id === 'kit' || id === 'drums') return !orchestraAvailable() || orchKitReady() || !!_instr.failed.kit;
  const def = INSTRUMENTS[id]; if(!def) return true;
  if(def.orch && def.orch.some(o => _orch.sets[o])) return true;
  if(_instr.sets[id] && _instr.sets[id].keys.length) return true;
  if(def.gm && _instr.sets[def.gm] && _instr.sets[def.gm].keys.length) return true;
  if(!orchestraAvailable() && !instrumentsAvailable()) return true;
  return !!_instr.failed[id];
}

/* ---------- the orchestra (vendor/orchestra-lite) ---------- */
const _orch = {src: null, sets: {}, loading: {}};
const orchestraAvailable = () => { const t = document.getElementById('orchSrc'); return !!(t && t.firstChild && t.firstChild.length > 1000); };
function orchSrc(){ if(!_orch.src && orchestraAvailable()) try { _orch.src = JSON.parse(document.getElementById('orchSrc').textContent); } catch(e){ _orch.src = null; } return _orch.src; }
async function orchDecode(file){
  const src = orchSrc(); const b64 = src && src.files[file]; if(!b64) return null;
  const bin = atob(b64), bytes = new Uint8Array(bin.length); for(let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext; const dec = new OAC(1, 1, 22050);
  return await new Promise((res, rej) => { const p = dec.decodeAudioData(bytes.buffer, res, rej); if(p && p.then) p.then(res, rej); });
}
/** Decode one instrument of the orchestra (its sample id), once. */
function orchLoad(oid){
  if(_orch.sets[oid]) return Promise.resolve(true);
  if(_orch.loading[oid]) return _orch.loading[oid];
  _orch.loading[oid] = (async () => {
    const src = orchSrc(); const m = src && src.manifest.instruments[oid]; if(!m) return false;
    if(m.kind === 'hits'){ const hits = []; for(const h of m.hits){ const buf = await orchDecode(h.file); if(buf) hits.push({buf, vel: h.vel}); }
      _orch.sets[oid] = {kind: 'hits', hits}; return hits.length > 0; }
    const set = {kind: 'pitched', sustain: !!m.sustain, notes: [], range: m.range};
    await Promise.all(m.notes.map(async n => { const buf = await orchDecode(n.file); if(buf) set.notes.push({midi: n.midi, tune: n.tune || 0, buf: m.sustain ? instrLoopable(buf) : buf}); }));
    set.notes.sort((a, b) => a.midi - b.midi);
    _orch.sets[oid] = set; return set.notes.length > 0;
  })().catch(e => { console.warn(`the ${oid} could not be loaded`, e); return false; }).finally(() => { delete _orch.loading[oid]; });
  return _orch.loading[oid];
}
/* the sample for a note: from the set whose range holds it (strings split
   by range), then the nearest note of that set */
function orchPick(ids, midi){
  const sets = ids.map(o => _orch.sets[o]).filter(x => x && x.notes && x.notes.length);
  if(!sets.length) return null;
  let set = sets.find(x => midi >= x.range[0] && midi <= x.range[1]);
  if(!set) set = sets.slice().sort((a, b) => Math.min(Math.abs(midi - a.range[0]), Math.abs(midi - a.range[1])) - Math.min(Math.abs(midi - b.range[0]), Math.abs(midi - b.range[1])))[0];
  let best = set.notes[0]; for(const n of set.notes) if(Math.abs(n.midi - midi) < Math.abs(best.midi - midi)) best = n;
  return {n: best, set};
}
/* THE KIT: the recorded drums in the orchestra set, by General MIDI number */
const ORCH_KIT = {35: 'kick', 36: 'kick', 37: 'cross-stick', 38: 'snare', 40: 'snare', 42: 'hihat-closed', 44: 'hihat-closed', 46: 'hihat-open', 49: 'crash', 57: 'crash',
  51: 'ride', 59: 'ride', 53: 'ride', 25: 'brush-stir', 24: 'brush-tap', 54: 'tambourine', 81: 'triangle', 80: 'triangle', 41: 'bass-drum', 52: 'cymbals', 55: 'sus-cymbal'};
const orchKitReady = () => ['kick', 'snare', 'hihat-closed', 'ride'].every(o => _orch.sets[o]);
function orchKitLoad(){ return Promise.all([...new Set(Object.values(ORCH_KIT))].map(orchLoad)); }
/* one drum hit on the recorded kit; false where there is no sample, so the
   caller keeps its synthesised one */
function orchKitHit(ctx, dest, midi, t, vel, dur){
  const oid = ORCH_KIT[midi], set = oid && _orch.sets[oid];
  if(!set || !set.hits || !set.hits.length || !ctx || !dest) return false;
  const v = Math.max(0.03, Math.min(1, vel == null ? 0.6 : vel));
  const h = set.hits.length > 1 && v > 0.55 ? set.hits[set.hits.length - 1] : set.hits[0];
  const src = ctx.createBufferSource(); src.buffer = h.buf;
  const g = ctx.createGain(); const peak = (midi === 44 ? 0.5 : 1) * 1.4 * Math.pow(v / (h.vel || 1), 0.8);
  g.gain.setValueAtTime(Math.min(2.2, peak), Math.max(0, t));
  if(midi === 25 && dur){ g.gain.setTargetAtTime(0.0001, t + Math.max(0.2, dur * 0.8), 0.08); }
  src.connect(g); g.connect(dest); src.start(Math.max(0, t)); src.stop(Math.max(0, t) + Math.min(h.buf.duration, midi === 25 && dur ? dur + 0.4 : 9));
  return true;
}
const INSTR_PC = {C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11};
function instrMidiOf(name){ const m = /^([A-G]b?)(\d)$/.exec(name); return m ? 12 * (+m[2] + 1) + INSTR_PC[m[1]] : null; }

/* a sustained note's loop, joined so it does not click: the last stretch
   before loopEnd is blended into what comes before loopStart, so at the
   moment the loop wraps the signal is where it was when it started */
function instrLoopable(buf){
  const sr = buf.sampleRate, a = Math.round(INSTR_LOOP[0] * sr), z = Math.min(buf.length, Math.round(INSTR_LOOP[1] * sr));
  const x = Math.min(Math.round(INSTR_XFADE * sr), a, z - a - 1);
  if(x <= 0) return buf;
  let out;
  try { out = new AudioBuffer({length: z, numberOfChannels: buf.numberOfChannels, sampleRate: sr}); } catch(e){ return buf; }
  for(let ch = 0; ch < buf.numberOfChannels; ch++){
    const d = buf.getChannelData(ch).subarray(0, z).slice();
    for(let i = 0; i < x; i++){ const w = i / x; d[z - x + i] = d[z - x + i] * (1 - w) + d[a - x + i] * w; }
    out.copyToChannel(d, ch);
  }
  return out;
}
/** Decode one instrument, once. Resolves true when it can play. */
function instrumentLoad(id){
  if(id === 'piano') return typeof grandPianoLoad === 'function' ? grandPianoLoad() : Promise.resolve(false);
  if(id === 'kit' || id === 'drums') return orchestraAvailable() ? orchKitLoad().then(() => orchKitReady()) : Promise.resolve(false);
  if(!INSTRUMENTS[id]) return Promise.resolve(false);
  if(instrumentReady(id)) return Promise.resolve(true);
  /* the real instrument where the page carries the orchestra */
  if(INSTRUMENTS[id].orch && orchestraAvailable()) return Promise.all(INSTRUMENTS[id].orch.map(orchLoad)).then(r => r.some(Boolean) ? true
    : (INSTRUMENTS[id].gm ? instrumentLoad(INSTRUMENTS[id].gm) : false));
  if(INSTRUMENTS[id].gm && !(_instr.src || instrumentsAvailable()) ) return Promise.resolve(false);
  if(INSTRUMENTS[id].gm) return instrumentLoad(INSTRUMENTS[id].gm);
  if(_instr.loading[id]) return _instr.loading[id];
  _instr.loading[id] = (async () => {
    if(!instrumentsAvailable()) return false;
    if(!_instr.src) _instr.src = JSON.parse(document.getElementById('gmSrc').textContent);
    const files = _instr.src[id]; if(!files) return false;
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const dec = new OAC(1, 1, 32000);
    const set = {buffers: new Map(), keys: []};
    await Promise.all(Object.keys(files).map(async name => {
      const midi = instrMidiOf(name); if(midi == null) return;
      const bin = atob(files[name]); const bytes = new Uint8Array(bin.length);
      for(let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const buf = await new Promise((res, rej) => { const p = dec.decodeAudioData(bytes.buffer, res, rej); if(p && p.then) p.then(res, rej); });
      set.buffers.set(midi, INSTRUMENTS[id].sustain ? instrLoopable(buf) : buf);
    }));
    set.keys = [...set.buffers.keys()].sort((a, b) => a - b);
    _instr.sets[id] = set;
    return set.keys.length > 0;
  })().catch(e => { console.warn(`the ${id} could not be loaded`, e); return false; })
    .finally(() => { delete _instr.loading[id]; });
  return _instr.loading[id];
}
/** Load every instrument in a list (the piano included); resolves when all can play. */
function instrumentsLoad(ids){ return Promise.all([...new Set(ids)].map(id => instrumentLoad(id).then(ok => { if(!ok) _instr.failed[id === 'drums' ? 'kit' : id] = true; return ok; }))); }

/**
 * One note on an instrument. Same shape as grandPianoNote; 'piano' is the grand.
 * Returns false when the instrument is not ready, so the caller can use its own voice.
 */
function instrumentNote(ctx, dest, id, midi, t, dur, vel, held, level){
  if(!id || id === 'piano') return typeof grandPianoNote === 'function' && grandPianoNote(ctx, dest, midi, t, dur, vel, held, level);
  if(id === 'drums' || id === 'kit') return orchKitHit(ctx, dest, Math.round(midi), t, vel, dur);
  const def0 = INSTRUMENTS[id];
  if(def0 && def0.orch){ const pk = orchPick(def0.orch, Math.round(midi)); if(pk) return orchNote(ctx, dest, def0, pk, midi, t, dur, vel, held, level); }
  if(def0 && def0.gm && !_instr.sets[id]) return instrumentNote(ctx, dest, def0.gm, midi, t, dur, vel, held, level);
  const set = _instr.sets[id], def = INSTRUMENTS[id];
  if(!set || !set.keys.length || !def || !ctx || !dest) return false;
  const m = Math.round(midi);
  let k = set.keys[0];
  for(const x of set.keys) if(Math.abs(x - m) < Math.abs(k - m)) k = x;
  const buf = set.buffers.get(k);
  const rate = Math.pow(2, (m - k) / 12);
  const v = Math.max(0.03, Math.min(1, vel == null ? 0.6 : vel));
  const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
  const g = ctx.createGain();
  const peak = (level == null ? 1 : level) * def.level * Math.pow(v, 1.2);
  const start = Math.max(0, t), ring = Math.max(0.05, held || dur || 0.5), end = start + ring;
  const soft = ctx.createBiquadFilter(); soft.type = 'lowpass'; soft.Q.value = 0.2;
  soft.frequency.value = Math.min(16000, 1200 + 15000 * Math.pow(v, 1.5));
  g.gain.setValueAtTime(peak, start);
  let stop;
  if(def.sustain){
    /* held past its recording: loop the steady part until the note ends */
    if(end - start > (INSTR_LOOP[0] / rate)){ src.loop = true; src.loopStart = INSTR_LOOP[0]; src.loopEnd = buf.duration; }
    g.gain.setValueAtTime(peak, end);
    g.gain.setTargetAtTime(0.0001, end, def.release / 3);
    stop = end + def.release * 2 + 0.05;
  } else {
    g.gain.setValueAtTime(peak, end);
    g.gain.setTargetAtTime(0.0001, end, def.release / 3);
    stop = Math.min(start + buf.duration / rate, end + def.release * 2 + 0.05);
  }
  src.connect(soft); soft.connect(g); g.connect(dest);
  src.start(start); src.stop(stop);
  _instr.stats.sampled++;
  return true;
}

/* a note on a real instrument: the nearest sample, retuned by its own
   measured cents, held by the looped steady part for bowed and blown notes */
function orchNote(ctx, dest, def, pk, midi, t, dur, vel, held, level){
  if(!ctx || !dest) return false;
  const {n} = pk, rate = Math.pow(2, (midi - (n.midi + n.tune / 100)) / 12), buf = n.buf;
  const v = Math.max(0.03, Math.min(1, vel == null ? 0.6 : vel));
  const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
  const g = ctx.createGain(), soft = ctx.createBiquadFilter(); soft.type = 'lowpass'; soft.Q.value = 0.2;
  soft.frequency.value = Math.min(16000, 1500 + 15000 * Math.pow(v, 1.4));
  const peak = (level == null ? 1 : level) * def.level * 0.75 * Math.pow(v, 1.1);
  const start = Math.max(0, t), ring = Math.max(0.05, held || dur || 0.5), end = start + ring;
  g.gain.setValueAtTime(0.0001, start); g.gain.linearRampToValueAtTime(peak, start + (def.sustain ? 0.02 : 0.004));
  let stop;
  if(def.sustain){
    if(end - start > INSTR_LOOP[0] / rate){ src.loop = true; src.loopStart = INSTR_LOOP[0]; src.loopEnd = Math.min(buf.duration, INSTR_LOOP[1]); }
    g.gain.setValueAtTime(peak, end); g.gain.setTargetAtTime(0.0001, end, def.release / 3);
    stop = end + def.release * 2 + 0.05;
  } else {
    g.gain.setValueAtTime(peak, Math.max(start + 0.01, end)); g.gain.setTargetAtTime(0.0001, Math.max(start + 0.01, end), def.release / 3);
    stop = Math.min(start + buf.duration / rate, end + def.release * 2 + 0.05);
  }
  src.connect(soft); soft.connect(g); g.connect(dest); src.start(start); src.stop(stop);
  _instr.stats.sampled++;
  return true;
}

/* ---------- which instrument a part is ----------
   MusicXML says it two ways: a General MIDI program on the part's
   <midi-instrument>, and the part's name. The program is trusted first; a
   name is read only when there is none. */
/* General MIDI programs (1-based), to the instruments this page has */
function instrumentForProgram(program){
  const p = +program;
  if(!p) return null;
  if(p === 7) return 'harpsichord';
  if(p === 10) return 'glockenspiel'; if(p === 12) return 'vibraphone'; if(p === 13) return 'marimba'; if(p === 14) return 'xylophone'; if(p === 15) return 'tubular_bells';
  if(p >= 17 && p <= 24) return 'organ';
  if(p >= 33 && p <= 40) return 'acoustic_bass';
  if(p === 41) return 'violin';
  if(p === 42) return 'viola';
  if(p === 43) return 'cello';
  if(p === 44) return 'contrabass';
  if(p === 46) return 'pizzicato_strings';
  if(p === 47) return 'harp';
  if(p === 48) return 'timpani';
  if(p === 45 || (p >= 49 && p <= 52)) return 'string_ensemble_1';
  if(p === 57 || p === 60) return 'trumpet';
  if(p === 58) return 'trombone';
  if(p === 59) return 'tuba';
  if(p === 61) return 'horn';
  if(p >= 62 && p <= 64) return 'horn';                /* brass section */
  if(p >= 65 && p <= 68) return 'sax';
  if(p === 69 || p === 70) return 'oboe';              /* oboe, English horn */
  if(p === 71) return 'bassoon';
  if(p === 72) return 'clarinet';
  if(p === 73) return 'piccolo';
  if(p >= 74 && p <= 80) return 'flute';
  return 'piano';
}
function instrumentForName(name, allNames){
  const n = String(name || '').toLowerCase();
  const choir = (allNames || []).some(x => /soprano|alto|tenor/i.test(x) && !/sax/i.test(x));
  if(/pizz/.test(n)) return 'pizzicato_strings';
  if(/violins|violini|vl\.? ?i{1,2}\b|violin [12i]/.test(n)) return 'violins';
  if(/violin|violino|vln/.test(n)) return 'violin';
  if(/viola|vla\b|bratsche/.test(n)) return 'viola';
  if(/cello|violoncell|\bvc\b/.test(n)) return 'cello';
  if(/contrabass|double bass|kontrabass|string bass|upright bass/.test(n)) return 'acoustic_bass';
  if(/sax/.test(n)) return 'sax';
  if(/\bbass\b/.test(n) && !/clarinet|trombone|voice|choir|tuba|sax/.test(n) && !choir) return 'acoustic_bass';
  if(/piccolo/.test(n)) return 'piccolo';
  if(/flute|flauto|recorder|flöte|flote/.test(n)) return 'flute';
  if(/oboe|english horn|cor anglais|hautbois/.test(n)) return 'oboe';
  if(/clarinet|klarinette|clarinetto/.test(n)) return 'clarinet';
  if(/bassoon|fagott|fagotto/.test(n)) return 'bassoon';
  if(/horn|corno|cor\b/.test(n)) return 'horn';
  if(/trumpet|tromba|trompete|cornet|flugel/.test(n)) return 'trumpet';
  if(/trombone|posaune/.test(n)) return 'trombone';
  if(/tuba|euphonium/.test(n)) return 'tuba';
  if(/harp|arpa|harfe/.test(n)) return 'harp';
  if(/timpani|pauken|timbales/.test(n)) return 'timpani';
  if(/organ|orgel|organo/.test(n)) return 'organ';
  if(/harpsichord|cembalo|clavecin/.test(n)) return 'harpsichord';
  if(/vibraphone|vibes/.test(n)) return 'vibraphone';
  if(/marimba/.test(n)) return 'marimba';
  if(/xylophon/.test(n)) return 'xylophone';
  if(/glocken|celesta/.test(n)) return 'glockenspiel';
  if(/bells|chimes|campane/.test(n)) return 'tubular_bells';
  if(/strings|string ensemble|orchestra|streicher/.test(n)) return 'string_ensemble_1';
  return 'piano';
}
function instrumentFor(part, allNames){
  return instrumentForProgram(part && part.program) || instrumentForName(part && (part.instrumentName || part.name), allNames);
}
const instrumentName = id => id === 'piano' ? 'Piano' : (INSTRUMENTS[id] || {}).name || id;
function instrumentsCreditHTML(){
  return `<span class="grand-credit mono faint">${orchestraAvailable() ? `the orchestra and the kit: <a href="https://github.com/sgossner/VSCO-2-CE" target="_blank" rel="noopener">VSCO-2 Community Edition</a> and
    <a href="https://versilian-studios.com/" target="_blank" rel="noopener">Versilian Studios</a> (CC0) · ` : ''}strings, flute and bass: <a href="${INSTR_CREDIT.url}" target="_blank" rel="noopener">${INSTR_CREDIT.name}</a>
    · ${INSTR_CREDIT.by} · <a href="${INSTR_CREDIT.licenceUrl}" target="_blank" rel="noopener">${INSTR_CREDIT.licence}</a></span>`;
}
