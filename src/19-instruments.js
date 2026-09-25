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

const INSTRUMENTS = {
  acoustic_bass:     {name: 'Double bass', sustain: false, level: 1.5, release: 0.08},
  violin:            {name: 'Violin', sustain: true, level: 1.9, release: 0.18},
  cello:             {name: 'Cello', sustain: true, level: 1.9, release: 0.2},
  flute:             {name: 'Flute', sustain: true, level: 1.8, release: 0.12},
  string_ensemble_1: {name: 'Strings', sustain: true, level: 1.8, release: 0.3}
};
/* the looped stretch of a sustained note, and the crossfade that hides its join */
const INSTR_LOOP = [0.9, 2.85], INSTR_XFADE = 0.12;
const INSTR_CREDIT = {name: 'Fluid (R3) General MIDI SoundFont', by: 'Frank Wen', via: 'midi-js-soundfonts',
  licence: 'CC BY 3.0', url: 'https://github.com/gleitz/midi-js-soundfonts', licenceUrl: 'https://creativecommons.org/licenses/by/3.0/us/'};
const _instr = {src: null, sets: {}, loading: {}, stats: {sampled: 0}};

const instrumentsAvailable = () => { const t = document.getElementById('gmSrc'); return !!(t && t.firstChild && t.firstChild.length > 1000); };
const instrumentReady = id => id === 'piano' ? (typeof grandPianoReady === 'function' && grandPianoReady()) : !!(_instr.sets[id] && _instr.sets[id].keys.length);
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
  if(!INSTRUMENTS[id]) return Promise.resolve(false);
  if(instrumentReady(id)) return Promise.resolve(true);
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
function instrumentsLoad(ids){ return Promise.all([...new Set(ids)].map(instrumentLoad)); }

/**
 * One note on an instrument. Same shape as grandPianoNote; 'piano' is the grand.
 * Returns false when the instrument is not ready, so the caller can use its own voice.
 */
function instrumentNote(ctx, dest, id, midi, t, dur, vel, held, level){
  if(!id || id === 'piano') return typeof grandPianoNote === 'function' && grandPianoNote(ctx, dest, midi, t, dur, vel, held, level);
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

/* ---------- which instrument a part is ----------
   MusicXML says it two ways: a General MIDI program on the part's
   <midi-instrument>, and the part's name. The program is trusted first; a
   name is read only when there is none. */
function instrumentForProgram(program){
  const p = +program;
  if(!p) return null;
  if(p >= 33 && p <= 40) return 'acoustic_bass';
  if(p === 41 || p === 42) return 'violin';            /* violin, viola */
  if(p === 43 || p === 44) return 'cello';             /* cello, contrabass (bowed) */
  if(p === 45 || (p >= 49 && p <= 52)) return 'string_ensemble_1';
  if(p >= 69 && p <= 80) return 'flute';               /* oboe, horn, bassoon, clarinet, the pipes */
  return 'piano';
}
function instrumentForName(name, allNames){
  const n = String(name || '').toLowerCase();
  const choir = (allNames || []).some(x => /soprano|alto|tenor/i.test(x));
  if(/violin|violino|vln|viola|vla\b/.test(n)) return 'violin';
  if(/cello|violoncell|\bvc\b/.test(n)) return 'cello';
  if(/contrabass|double bass|kontrabass|string bass|upright bass/.test(n)) return 'acoustic_bass';
  if(/\bbass\b/.test(n) && !/clarinet|trombone|voice|choir/.test(n) && !choir) return 'acoustic_bass';
  if(/flute|flauto|piccolo|recorder|oboe|clarinet|bassoon|fagott/.test(n)) return 'flute';
  if(/strings|string ensemble|orchestra|violins|streicher/.test(n)) return 'string_ensemble_1';
  return 'piano';
}
function instrumentFor(part, allNames){
  return instrumentForProgram(part && part.program) || instrumentForName(part && (part.instrumentName || part.name), allNames);
}
const instrumentName = id => id === 'piano' ? 'Piano' : (INSTRUMENTS[id] || {}).name || id;
function instrumentsCreditHTML(){
  return `<span class="grand-credit mono faint">strings, flute and bass: <a href="${INSTR_CREDIT.url}" target="_blank" rel="noopener">${INSTR_CREDIT.name}</a>
    · ${INSTR_CREDIT.by} · <a href="${INSTR_CREDIT.licenceUrl}" target="_blank" rel="noopener">${INSTR_CREDIT.licence}</a></span>`;
}
