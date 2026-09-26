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
  /* the solo violin and cello: the long, two-layer recordings in
     vendor/strings when the page has them (first of the list that is
     there), played as a bow plays — see bowedNote below */
  violin:            {name: 'Violin', sustain: true, level: 1.9, release: 0.18, orch: ['violin-hq', 'violin-solo'], first: true, bowed: true, family: 'strings'},
  cello:             {name: 'Cello', sustain: true, level: 1.9, release: 0.2, orch: ['cello-solo', 'celli'], first: true, bowed: true, family: 'strings'},
  flute:             {name: 'Flute', sustain: true, level: 1.8, release: 0.12, orch: ['flute'], short: ['flute-stac'], family: 'wind'},
  string_ensemble_1: {name: 'Strings', sustain: true, level: 1.8, release: 0.3, orch: ['basses', 'celli', 'violas', 'violins'], room: true,
    short: ['basses-spic', 'celli-spic', 'violas-spic', 'violins-spic'], pizz: ['bass-pizz', 'celli-pizz', 'violas-pizz', 'violins-pizz'], family: 'strings'},
  /* the rest of the orchestra: real samples only (the GM set has none of
     these; where the orchestra is missing they fall back as named).
     short: the recordings of short notes (spiccato, staccato) a quick or a
     staccato note is played from; pizz: what a "pizz." plucks */
  violins:           {name: 'Violins', sustain: true, level: 1.8, release: 0.25, orch: ['violins'], gm: 'string_ensemble_1', room: true,
    short: ['violins-spic'], pizz: ['violins-pizz'], family: 'strings'},
  viola:             {name: 'Viola', sustain: true, level: 1.9, release: 0.2, orch: ['violas'], gm: 'violin', room: true,
    short: ['violas-spic'], pizz: ['violas-pizz'], family: 'strings'},
  celli:             {name: 'Cellos', sustain: true, level: 1.8, release: 0.28, orch: ['celli'], gm: 'cello', room: true,
    short: ['celli-spic'], pizz: ['celli-pizz'], family: 'strings'},
  contrabass:        {name: 'Double bass (bowed)', sustain: true, level: 1.8, release: 0.2, orch: ['basses'], gm: 'cello', room: true,
    short: ['basses-spic'], pizz: ['bass-pizz'], family: 'strings'},
  pizzicato_strings: {name: 'Strings, pizzicato', sustain: false, level: 1.7, release: 0.1, orch: ['celli-pizz', 'violas-pizz', 'violins-pizz'], gm: 'acoustic_bass'},
  harp:              {name: 'Harp', sustain: false, level: 1.6, release: 0.4, orch: ['harp']},
  piccolo:           {name: 'Piccolo', sustain: true, level: 1.5, release: 0.1, orch: ['piccolo'], gm: 'flute', family: 'wind'},
  oboe:              {name: 'Oboe', sustain: true, level: 1.7, release: 0.1, orch: ['oboe'], gm: 'flute', short: ['oboe-stac'], family: 'wind'},
  clarinet:          {name: 'Clarinet', sustain: true, level: 1.7, release: 0.1, orch: ['clarinet'], gm: 'flute', short: ['clarinet-stac'], family: 'wind'},
  bassoon:           {name: 'Bassoon', sustain: true, level: 1.8, release: 0.1, orch: ['bassoon'], gm: 'cello', short: ['bassoon-stac'], family: 'wind'},
  horn:              {name: 'Horn', sustain: true, level: 1.7, release: 0.15, orch: ['horn'], gm: 'cello', short: ['horn-stac'], family: 'brass'},
  trumpet:           {name: 'Trumpet', sustain: true, level: 1.5, release: 0.1, orch: ['trumpet'], gm: 'flute', short: ['trumpet-stac'], family: 'brass'},
  trombone:          {name: 'Trombone', sustain: true, level: 1.6, release: 0.12, orch: ['trombone'], gm: 'cello', short: ['trombone-stac'], family: 'brass'},
  tuba:              {name: 'Tuba', sustain: true, level: 1.8, release: 0.12, orch: ['tuba'], gm: 'acoustic_bass', short: ['tuba-stac'], family: 'brass'},
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
  if(def.orch && orchIds(def).some(o => _orch.sets[o])) return true;
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
    /* the long recordings loop a stretch of their own steady middle, only
       ever reached by a note held longer than the recording */
    const loop = m.length ? [Math.max(0.9, m.length * 0.4), Math.max(1.4, m.length - 0.75)] : INSTR_LOOP;
    const set = {kind: 'pitched', sustain: !!m.sustain, notes: [], range: m.range, layers: m.layers || 1, loop, vibrato: m.vibrato !== false, hq: !!m.length};
    await Promise.all(m.notes.map(async n => { const buf = await orchDecode(n.file); if(buf) set.notes.push({midi: n.midi, layer: n.layer || 0, tune: n.tune || 0, buf: m.sustain ? instrLoopable(buf, loop) : buf}); }));
    set.notes.sort((a, b) => a.midi - b.midi);
    set.layerGain = m.balance ? orchLayerGains(set) : null;
    _orch.sets[oid] = set; return set.notes.length > 0;
  })().catch(e => { console.warn(`the ${oid} could not be loaded`, e); return false; }).finally(() => { delete _orch.loading[oid]; });
  return _orch.loading[oid];
}
/* The soft recording of a note is much quieter than the loud one — that is
   the point of it, the tone of a bow drawn lightly — but played as it is, a
   mezzo-forte passage disappears under the piano. Each layer is brought to
   a fixed share of the loudest layer's level (measured once, at decoding),
   keeping its tone; the note's own loudness then shades within the layer. */
const ORCH_LAYER_SHARE = [0.62, 1];
function orchLayerGains(set){
  if(!set.layers || set.layers < 2) return null;
  const rms = [];
  set.notes.forEach(n => { const d = n.buf.getChannelData(0), sr = n.buf.sampleRate;
    const a = Math.round(0.1 * sr), z = Math.min(d.length, Math.round(1.6 * sr)); let e = 0, c = 0;
    for(let i = a; i < z; i += 4){ e += d[i] * d[i]; c++; }
    if(c){ (rms[n.layer] = rms[n.layer] || []).push(Math.sqrt(e / c)); } });
  const mean = xs => xs && xs.length ? xs.reduce((x, y) => x + y, 0) / xs.length : 0;
  const top = mean(rms[set.layers - 1]);
  if(!top) return null;
  return [...Array(set.layers)].map((_, L) => { const m = mean(rms[L]);
    const share = ORCH_LAYER_SHARE[Math.round(L / Math.max(1, set.layers - 1) * (ORCH_LAYER_SHARE.length - 1))];
    return m ? Math.max(1, Math.min(3, share * top / m)) : 1; });
}
/* the sample for a note: from the set whose range holds it (strings split
   by range), then the nearest note of that set */
function orchPick(ids, midi, vel){
  const sets = ids.map(o => _orch.sets[o]).filter(x => x && x.notes && x.notes.length);
  if(!sets.length) return null;
  let set = sets.find(x => midi >= x.range[0] && midi <= x.range[1]);
  if(!set) set = sets.slice().sort((a, b) => Math.min(Math.abs(midi - a.range[0]), Math.abs(midi - a.range[1])) - Math.min(Math.abs(midi - b.range[0]), Math.abs(midi - b.range[1])))[0];
  /* the dynamic layer the note's loudness calls for: the soft recording up
     to mezzo-forte, the loud one from forte (0.74 in the player) up */
  const v = vel == null ? 0.6 : vel;
  const want = set.layers > 1 ? Math.min(set.layers - 1, Math.max(0, Math.floor((v - 0.3) / 0.42 * (set.layers - 1) + 1e-9))) : 0;
  const pool = set.notes.filter(n => (n.layer || 0) === want);
  const from = pool.length ? pool : set.notes;
  let best = from[0]; for(const n of from) if(Math.abs(n.midi - midi) < Math.abs(best.midi - midi)) best = n;
  return {n: best, set, layer: want};
}
/* the instrument ids of the orchestra to load for a part: all of them for
   a section split by range, the first the page carries for a solo */
function orchIds(def, which){
  const list = which ? def[which] : def.orch;
  if(!list) return [];
  const src = orchSrc(), man = src ? src.manifest.instruments : {};
  /* the recording made for the player (vendor/orchestra-hq: both dynamic
     layers, 32 kHz, five-second notes) wherever the page carries one */
  const ids = list.map(o => man[o + '-hq'] ? o + '-hq' : o);
  if(which) return ids.filter(o => man[o]);
  if(!def.first) return ids;
  const have = src ? ids.filter(o => man[o]) : [];
  return have.length ? [have[0]] : ids.slice(0, 1);
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
function instrLoopable(buf, loop = INSTR_LOOP){
  const sr = buf.sampleRate, a = Math.round(loop[0] * sr), z = Math.min(buf.length, Math.round(loop[1] * sr));
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
  if(INSTRUMENTS[id].orch && orchestraAvailable()){
    const def = INSTRUMENTS[id];
    /* the short notes and the pizzicato come with it, when the page has
       them, so the first staccato is already a staccato */
    const extra = Promise.all(orchIds(def, 'short').concat(orchIds(def, 'pizz')).map(orchLoad));
    return Promise.all([Promise.all(orchIds(def).map(orchLoad)), extra]).then(([r]) => r.some(Boolean) ? true
      : (def.gm ? instrumentLoad(def.gm) : false));
  }
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
function instrumentNote(ctx, dest, id, midi, t, dur, vel, held, level, art){
  /* the microphone, if it is open, is told what the app itself is sounding
     (the grand says so for itself, below) */
  if(id && id !== 'piano' && id !== 'drums' && id !== 'kit' && typeof listenAppNote === 'function') listenAppNote(ctx, midi, t, held || dur);
  if(!id || id === 'piano') return typeof grandPianoNote === 'function' && grandPianoNote(ctx, dest, midi, t, dur, vel, held, level);
  if(id === 'drums' || id === 'kit') return orchKitHit(ctx, dest, Math.round(midi), t, vel, dur);
  const def0 = INSTRUMENTS[id];
  if(def0 && def0.orch){
    /* a player's few milliseconds either side of the beat, so that a chord
       from six parts is not six recordings started on the same sample */
    if(art && art.human && t > 0) t = Math.max(0, t + (Math.random() - 0.5) * 0.012);
    const ring = held || dur || 0.5;
    /* plucked where the score says pizz. */
    if(art && art.pizz){ const pk = orchPick(orchIds(def0, 'pizz'), Math.round(midi), vel);
      if(pk){ _instr.stats.pizz = (_instr.stats.pizz || 0) + 1;
        return orchNote(ctx, dest, Object.assign({}, def0, {sustain: false, release: 0.3, level: def0.level * 0.95}), pk, midi, t, dur, vel, Math.max(ring, 0.6), level); } }
    /* a staccato note, or a quick one not under a slur: the recording of a
       short note, which speaks at once and ends as a short note ends —
       where a held note cut off after a tenth of a second has not begun */
    if(art && (art.staccato || (ring < ORCH_SHORT && !art.slur))){ const pk = orchPick(orchIds(def0, 'short'), Math.round(midi), vel);
      if(pk) return shortNote(ctx, dest, def0, pk, midi, t, dur, vel, level); }
    const pk = orchPick(orchIds(def0), Math.round(midi), vel);
    if(pk) return pk.set.hq ? bowedNote(ctx, dest, def0, pk, midi, t, dur, vel, held, level, art) : orchNote(ctx, dest, def0, pk, midi, t, dur, vel, held, level); }
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
  if(def.room && !dest._hall){ const r = stringsRoom(ctx, dest); if(r) g.connect(r); }
  _instr.stats.sampled++;
  return true;
}
/* A short note: the recording of one (spiccato, staccato), let ring as it
   was recorded, into the room it was recorded in, and not cut. */
const ORCH_SHORT = 0.2;
function shortNote(ctx, dest, def, pk, midi, t, dur, vel, level){
  if(!ctx || !dest) return false;
  const {n, set, layer} = pk, rate = Math.pow(2, (midi - (n.midi + n.tune / 100)) / 12), buf = n.buf;
  const v = Math.max(0.03, Math.min(1, vel == null ? 0.6 : vel));
  const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
  if(src.detune) src.detune.value = (Math.random() - 0.5) * 6;
  const g = ctx.createGain(), tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.Q.value = 0.3;
  tone.frequency.value = Math.min(15000, 3500 + 11500 * v);
  const lg = set.layerGain ? set.layerGain[layer] || 1 : 1;
  const peak = (level == null ? 1 : level) * def.level * 0.8 * lg * (0.35 + 0.65 * v);
  const start = Math.max(0, t), len = buf.duration / rate;
  g.gain.setValueAtTime(0.0001, start); g.gain.linearRampToValueAtTime(peak, start + 0.004);
  g.gain.setValueAtTime(peak, start + Math.max(0.01, len - 0.08)); g.gain.linearRampToValueAtTime(0.0001, start + len);
  src.connect(tone); tone.connect(g); g.connect(dest);
  if(def.room && !dest._hall){ const r = stringsRoom(ctx, dest); if(r) g.connect(r); }
  src.start(start); src.stop(start + len + 0.02);
  _instr.stats.sampled++; _instr.stats.short = (_instr.stats.short || 0) + 1;
  return true;
}

/* ---------- a held note, on the long recordings ----------
   The violin and cello were the two sounds that gave the player away, and
   then the whole orchestra: a short recording, moved a long way in pitch,
   started at full strength and cut off dead, dry. None of the instruments
   does that. So, for every part played from the long recordings (the solo
   strings, and vendor/orchestra-hq: the sections, the winds, the brass):
   - the recording nearest the note, from the dynamic layer its loudness
     calls for (a soft note is a soft recording, not a loud one turned down),
     each layer brought to a fixed share of the loudest (orchLayerGains);
   - a bow comes in: a short swell, slower for a quiet note; a wind or brass
     note keeps the attack it was recorded with, only eased at the very start;
   - under a slur, a quick note is taken from a little way into its
     recording, past the slow start a section makes, so a run is heard;
   - the cello, recorded without vibrato, is given one — a little after the
     note starts, widening, a touch uneven, as a cellist's is (the others'
     own recorded vibrato is left alone);
   - held past its recording, it loops a stretch of its own steady middle;
   - it comes off rather than stopping: a release of a quarter to a third of
     a second, into the hall (the player's, shared by the orchestra) or, on
     its own, a short dark room (stringsRoom). */
function bowedNote(ctx, dest, def, pk, midi, t, dur, vel, held, level, art){
  if(!ctx || !dest) return false;
  const {n, set, layer} = pk, buf = n.buf;
  const strings = def.family === 'strings' || def.bowed;
  const detune0 = (Math.random() - 0.5) * (strings ? 4 : 2);      /* a player is never quite on the grid */
  const rate = Math.pow(2, (midi - (n.midi + n.tune / 100)) / 12);
  const v = Math.max(0.03, Math.min(1, vel == null ? 0.6 : vel));
  const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
  if(src.detune) src.detune.value = detune0;
  const start = Math.max(0, t), ring = Math.max(0.06, held || dur || 0.5), end = start + ring;
  /* loudness: the layer carries most of it, so the gain only shades within a layer */
  const lg = set.layerGain ? set.layerGain[layer] || 1 : 1;
  const peak = (level == null ? 1 : level) * def.level * 0.8 * lg * (0.55 + 0.45 * v);
  const g = ctx.createGain();
  const quick = !!(art && art.slur) && ring < 0.45;
  const atk = strings ? Math.min(ring * 0.4, quick ? 0.02 : 0.03 + 0.07 * (1 - v)) : Math.min(ring * 0.3, 0.012);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.linearRampToValueAtTime(peak * 0.7, start + atk * 0.5);
  g.gain.linearRampToValueAtTime(peak, start + atk);
  /* a gentle tone: a soft note is a little darker */
  const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.Q.value = 0.3;
  tone.frequency.value = Math.min(15000, 5500 + 9500 * v);
  /* vibrato where the recording has none */
  if(!set.vibrato && ring > 0.3 && src.detune){
    const lfo = ctx.createOscillator(), depth = ctx.createGain();
    lfo.frequency.value = 5.1 + Math.random() * 0.8;
    const d = 9 + 6 * v;
    depth.gain.setValueAtTime(0, start);
    depth.gain.setValueAtTime(0, start + Math.min(0.28, ring * 0.3));
    depth.gain.linearRampToValueAtTime(d, start + Math.min(0.85, ring * 0.7));
    lfo.connect(depth); depth.connect(src.detune);
    lfo.start(start); lfo.stop(end + 0.6);
  }
  const L = set.loop || INSTR_LOOP;
  if(set.sustain && (end - start) * rate > L[1] - 0.05){ src.loop = true; src.loopStart = L[0]; src.loopEnd = Math.min(buf.duration, L[1]); }
  /* a slurred note overlaps the next a little, as a legato does */
  const rel = strings ? (quick ? 0.2 : 0.34) : 0.24, tail = art && art.slur ? 0.05 : 0;
  g.gain.setValueAtTime(peak, Math.max(start + atk, end + tail));
  g.gain.setTargetAtTime(0.0001, Math.max(start + atk, end + tail), rel / 3);
  const offset = quick && strings ? Math.min(0.07, buf.duration * 0.05) : 0;
  const stop = Math.min(src.loop ? Infinity : start + (buf.duration - offset) / rate, end + tail + rel * 2.2);
  src.connect(tone); tone.connect(g); g.connect(dest);
  if(!dest._hall){ const room = stringsRoom(ctx, dest); if(room) g.connect(room); }
  src.start(start, offset); src.stop(Math.max(start + 0.05, stop));
  _instr.stats.sampled++; _instr.stats.bowed = (_instr.stats.bowed || 0) + 1;
  return true;
}
/* The room: a convolution with an impulse response made here, not fetched —
   seeded noise (the same every time) under an exponential decay of about
   two seconds, darkened as a hall darkens, after an 18 ms gap. One per
   output, sent to quietly; it is what makes a dry recording sound played. */
const STRINGS_ROOM = {send: 0.3, decay: 0.32, len: 2.2, pre: 0.018};
function stringsRoom(ctx, dest){
  try {
    if(dest._liRoom && dest._liRoom.context === ctx) return dest._liRoom;
    const sr = ctx.sampleRate, len = Math.round(sr * STRINGS_ROOM.len), pre = Math.round(sr * STRINGS_ROOM.pre);
    const ir = ctx.createBuffer(2, len, sr);
    for(let ch = 0; ch < 2; ch++){
      const d = ir.getChannelData(ch); let seed = ch ? 48271 : 16807, lp = 0;
      for(let i = pre; i < len; i++){
        seed = (seed * 16807) % 2147483647;
        const r = seed / 2147483647 * 2 - 1, tt = (i - pre) / sr;
        /* the tail grows darker as it goes: less high end the later it is */
        const a = 0.55 * Math.exp(-tt / 0.6) + 0.08;
        lp += a * (r - lp);
        d[i] = lp * Math.exp(-tt / STRINGS_ROOM.decay) * (1 - Math.exp(-tt / 0.006));
      }
    }
    /* to unit energy, so the send is the same loudness at any rate */
    let e = 0; for(let ch = 0; ch < 2; ch++){ const d = ir.getChannelData(ch); for(let i = 0; i < len; i++) e += d[i] * d[i]; }
    const k = 1 / Math.sqrt(e / 2 || 1); for(let ch = 0; ch < 2; ch++){ const d = ir.getChannelData(ch); for(let i = 0; i < len; i++) d[i] *= k; }
    const conv = ctx.createConvolver(); conv.normalize = false; conv.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = STRINGS_ROOM.send;
    conv.connect(wet); wet.connect(dest);
    dest._liRoom = conv;
    return conv;
  } catch(e){ return null; }
}

/* The hall an orchestra plays in: one convolution for the whole of it (the
   player sends each part in, from its own gain), made here as the room
   above is — seeded noise under a two-and-a-half-second decay, darker as it
   goes, a 24 ms gap before it answers — but longer and wider, the two ears
   hearing different reflections. Cached on the output it feeds. */
const ORCH_HALL = {decay: 0.4, len: 2.8, pre: 0.024};
function orchHall(ctx, into){
  try {
    if(into._orchHall && into._orchHall.context === ctx) return into._orchHall;
    const sr = ctx.sampleRate, len = Math.round(sr * ORCH_HALL.len), pre = Math.round(sr * ORCH_HALL.pre);
    const ir = ctx.createBuffer(2, len, sr);
    for(let ch = 0; ch < 2; ch++){
      const d = ir.getChannelData(ch); let seed = ch ? 69621 : 40692, lp = 0;
      for(let i = pre + ch * Math.round(sr * 0.0035); i < len; i++){
        seed = (seed * 16807) % 2147483647;
        const r = seed / 2147483647 * 2 - 1, tt = (i - pre) / sr;
        const a = 0.5 * Math.exp(-tt / 0.7) + 0.07;
        lp += a * (r - lp);
        d[i] = lp * Math.exp(-tt / ORCH_HALL.decay) * (1 - Math.exp(-tt / 0.012));
      }
    }
    let e = 0; for(let ch = 0; ch < 2; ch++){ const d = ir.getChannelData(ch); for(let i = 0; i < len; i++) e += d[i] * d[i]; }
    const k = 1 / Math.sqrt(e / 2 || 1); for(let ch = 0; ch < 2; ch++){ const d = ir.getChannelData(ch); for(let i = 0; i < len; i++) d[i] *= k; }
    const conv = ctx.createConvolver(); conv.normalize = false; conv.buffer = ir;
    conv.connect(into);
    into._orchHall = conv;
    _instr.stats.halls = (_instr.stats.halls || 0) + 1;
    return conv;
  } catch(e){ return null; }
}

/* ---------- an orchestra: sections and a soloist, seats, the hall ----------
   A symphony's "Violin I" is sixteen violins, not one; a concerto's
   "Violin" in front of them is one. So once the score is an orchestra —
   winds, brass or timpani beside at least three string parts, or seven
   parts or more — its violin and cello parts are played by the sections,
   except the soloist: the part named solo or principal, or the one string
   part left unnumbered (or singular) among numbered (or plural) ones. A
   "Contrabass" in an orchestra is bowed, not a jazz bass. Then each part
   is given its seat (pan) and its share of the hall; a solo piano piece is
   left exactly as it was. */
const ORCH_SEAT = {violins: -0.45, violin: -0.06, viola: 0.14, celli: 0.32, cello: 0.1, contrabass: 0.45, acoustic_bass: 0.4,
  harp: -0.55, piccolo: -0.2, flute: -0.14, oboe: 0.06, clarinet: -0.06, bassoon: 0.12, horn: -0.3, trumpet: 0.16, trombone: 0.3,
  tuba: 0.4, timpani: 0.08, pizzicato_strings: -0.2, string_ensemble_1: 0, organ: 0, harpsichord: -0.12, piano: 0.04,
  glockenspiel: 0.22, xylophone: 0.22, marimba: 0.2, tubular_bells: 0.26, vibraphone: 0.2, sax: 0.1, drums: 0.1};
const ORCH_SEND = {strings: 0.34, wind: 0.36, brass: 0.38, perc: 0.4, keys: 0.16};
const ORCH_WINDS = new Set(['piccolo', 'flute', 'oboe', 'clarinet', 'bassoon', 'horn', 'trumpet', 'trombone', 'tuba', 'timpani']);
const ORCH_STRINGS = new Set(['violin', 'violins', 'viola', 'cello', 'celli', 'contrabass', 'string_ensemble_1', 'acoustic_bass']);
function instrumentsOrchestrate(parts){
  if(!parts || !parts.length) return parts;
  const sounding = parts.filter(p => p.inst && p.inst !== 'drums');
  const strings = sounding.filter(p => ORCH_STRINGS.has(p.inst)), winds = sounding.filter(p => ORCH_WINDS.has(p.inst));
  const orchestral = (winds.length >= 1 && strings.length >= 3) || sounding.length >= 7;
  const soloNamed = p => /\b(solo|soloist|principale?|principal|concertante|obbligato)\b/i.test(p.name || '');
  const numbered = p => /(\b(i{1,3}|iv|[1-4])\b|\b(1st|2nd|first|second)\b|\d\s*$)/i.test(p.name || '');
  const plural = p => /violins|violini|violinen|violons|cellos|celli\b|violoncelli|contrabbassi|kontrabässe|basses\b/i.test(p.name || '');
  if(orchestral){
    ['violin', 'cello'].forEach(kind => {
      const group = parts.filter(p => p.inst === kind || p.inst === (kind === 'violin' ? 'violins' : 'celli'));
      const solo = group.filter(soloNamed);
      let soloist = solo.length ? solo : [];
      if(!soloist.length && group.length >= 2){
        const loose = group.filter(p => !numbered(p) && !plural(p));
        if(loose.length === 1 && group.some(p => numbered(p) || plural(p))) soloist = loose;
      }
      group.forEach(p => { p.solo = soloist.includes(p);
        p.inst = p.solo ? kind : (kind === 'violin' ? 'violins' : 'celli'); });
    });
    parts.forEach(p => { if(p.inst === 'acoustic_bass') p.inst = 'contrabass'; });
  }
  /* seats, and the hall: an orchestra, a chamber group, or a duet — never
     a piece for one instrument, which the player already sounds as it did */
  if(sounding.length < 2) return parts;
  const seen = {};
  parts.forEach(p => {
    if(!p.inst || p.inst === 'drums') return;
    const def = INSTRUMENTS[p.inst] || {};
    let pan = ORCH_SEAT[p.inst] != null ? ORCH_SEAT[p.inst] : 0;
    if(p.solo) pan = p.inst === 'violin' ? -0.08 : 0.08;
    /* the second of two violin sections sits inside the first */
    const n = seen[p.inst] = (seen[p.inst] || 0) + 1;
    if(p.inst === 'violins' && n === 2) pan = -0.22;
    else if(n > 1) pan += (n % 2 ? -1 : 1) * 0.06 * Math.ceil((n - 1) / 2);
    if(!orchestral) pan *= 0.6;
    p.pan = Math.max(-0.8, Math.min(0.8, pan));
    const fam = def.family === 'strings' ? 'strings' : def.family === 'wind' ? 'wind' : def.family === 'brass' ? 'brass'
      : ['timpani', 'glockenspiel', 'xylophone', 'marimba', 'tubular_bells', 'vibraphone', 'harp'].includes(p.inst) ? 'perc' : 'keys';
    p.hall = ORCH_SEND[fam] * (p.solo ? 0.7 : 1) * (orchestral ? 1 : 0.8);
    /* many parts together are louder than any one: each is trimmed by its
       share, the soloist less, so the tutti fits under full scale and the
       solo still stands out of it */
    if(orchestral) p.trim = Math.min(1, 2.1 / Math.sqrt(sounding.length)) * (p.solo || p.inst === 'piano' ? 1.35 : 1);
  });
  return parts;
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
  /* the cello before the violin: "violoncello" and "violoncelle" have a violin in them */
  if(/cello|violoncell|\bvc\b|\bvlc\b/.test(n)) return 'cello';
  if(/violins|violini|violinen|violons|vl\.? ?i{1,2}\b|violin [12i]/.test(n)) return 'violins';
  if(/violin|violino|violon\b|vln/.test(n)) return 'violin';
  if(/viola|viole\b|vla\b|bratsche/.test(n)) return 'viola';
  if(/contrabass|contrabbass|contrebass|double bass|kontrab|string bass|upright bass/.test(n)) return 'acoustic_bass';
  if(/sax/.test(n)) return 'sax';
  if(/\bbass\b/.test(n) && !/clarinet|trombone|voice|choir|tuba|sax/.test(n) && !choir) return 'acoustic_bass';
  if(/piccolo|ottavino/.test(n)) return 'piccolo';
  if(/flute|flauti?\b|flauto|recorder|flöte|flote|flûte/.test(n)) return 'flute';
  if(/oboe|obo[ei]\b|english horn|cor anglais|corno inglese|hautbois/.test(n)) return 'oboe';
  if(/clarinet|klarinette|clarinetto/.test(n)) return 'clarinet';
  if(/bassoon|fagott|fagotto|basson/.test(n)) return 'bassoon';
  if(/trombone|tromboni|posaune/.test(n)) return 'trombone';
  if(/horn|hörner|corno|corni\b|\bcors?\b/.test(n)) return 'horn';
  if(/trumpet|tromba|trombe\b|trompete|trompette|cornet|flugel/.test(n)) return 'trumpet';
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
  const byProgram = instrumentForProgram(part && part.program);
  const byName = instrumentForName(part && (part.instrumentName || part.name), allNames);
  /* a program says "strings" or "violin"; the name can say which, and how
     many: a "Violins" part is the section, a "Viola" part on the string
     ensemble program is the violas */
  if(byProgram === 'string_ensemble_1' && ['violin', 'violins', 'viola', 'cello', 'acoustic_bass'].includes(byName)) return byName === 'acoustic_bass' ? 'contrabass' : byName;
  const plural = /violins|violini|violinen|violons/i.test((part && (part.name || part.instrumentName)) || '');
  if(byProgram === 'violin' && plural) return 'violins';
  return byProgram || byName;
}
const instrumentName = id => id === 'piano' ? 'Piano' : (INSTRUMENTS[id] || {}).name || id;
function instrumentsCreditHTML(){
  return `<span class="grand-credit mono faint">${orchestraAvailable() ? `the orchestra and the kit: <a href="https://github.com/sgossner/VSCO-2-CE" target="_blank" rel="noopener">VSCO-2 Community Edition</a> and
    <a href="https://versilian-studios.com/" target="_blank" rel="noopener">Versilian Studios</a> (CC0) · ` : ''}strings, flute and bass: <a href="${INSTR_CREDIT.url}" target="_blank" rel="noopener">${INSTR_CREDIT.name}</a>
    · ${INSTR_CREDIT.by} · <a href="${INSTR_CREDIT.licenceUrl}" target="_blank" rel="noopener">${INSTR_CREDIT.licence}</a></span>`;
}
