/* ============================================================
   THE GRAND PIANO — a real one, recorded.

   Every note the house plays on a piano goes through here: a score played
   back, the Jazz Studio's comping behind the play-along, a chord, a
   voicing or a scale heard, a key pressed on the on-screen keyboard or
   the computer's, the drone, the ambient slow piano. It is the Salamander
   Grand Piano V3 — a Yamaha C5 sampled by Alexander Holm, CC BY 3.0
   (vendor/salamander/LICENSE.md) — thirty recorded notes, one every minor
   third from A0 to C8, so no key is more than a semitone from a recording
   of itself.

   THE FILES ARE IN THE PAGE. build.js puts them after the app's script as
   text the browser keeps and never parses (like the engraver), so the piano
   works offline and from a file on disk. They are turned into sound once,
   the first time a room with music in it opens, and the decoded notes serve
   every audio context in the house.

   ONE RECORDED LOUDNESS, PLAYED AT ANY. A struck string is darker played
   softly as well as quieter, so a soft note is both turned down and put
   through a lowpass that opens as the key goes down harder. When the key
   comes up the damper stops the string in a tenth of a second — except at
   the top of the keyboard, where a real piano has no dampers and the
   strings ring on. Until the notes are decoded (a moment, once) a caller
   falls back to its synthesised voice rather than playing nothing.
   ============================================================ */

const GRAND_CREDIT = {name: 'Salamander Grand Piano V3', by: 'Alexander Holm', licence: 'CC BY 3.0',
  url: 'https://archive.org/details/SalamanderGrandPianoV3', licenceUrl: 'https://creativecommons.org/licenses/by/3.0/'};
const _grand = {state: 'idle', buffers: new Map(), keys: [], promise: null, stats: {sampled: 0, synth: 0}};

/* the recordings are named C, Ds, Fs and A in each octave */
function grandMidiOf(name){
  const m = /^(C|Ds|Fs|A)(\d)$/.exec(name);
  return m ? 12 * (+m[2] + 1) + {C: 0, Ds: 3, Fs: 6, A: 9}[m[1]] : null;
}
/* asked often, and the payload is megabytes: its length is read off the
   text node (which copies nothing), and once it is known to be there it is */
let _grandHas = false;
const grandPianoAvailable = () => { if(_grandHas) return true;
  const t = document.getElementById('grandPianoSrc');
  return _grandHas = !!(t && t.firstChild && t.firstChild.length > 1000); };
const grandPianoReady = () => _grand.state === 'ready';
/* ready, or never going to be: either way a caller can go ahead */
const grandPianoSettled = () => _grand.state === 'ready' || _grand.state === 'failed' || !grandPianoAvailable();
const grandPianoStats = () => _grand.stats;

/* The recordings run to the last audible trace: twenty seconds for a low
   note. Nothing here holds a key that long, so each is kept for as long as
   its register is ever heard (nine seconds low down, seven in the middle,
   four and a half at the top) and faded out over the last half-second, the
   way a damper settles. With the 32 kHz decode, about 50 MB in all. */
const GRAND_RATE = 32000;
const GRAND_UNDAMPED = 90;   /* F♯6 and above: no dampers */
const grandKeep = midi => midi < 48 ? 9 : midi < 84 ? 7 : 4.5;
function grandTrim(buf, midi){
  const len = Math.min(buf.length, Math.round(grandKeep(midi) * buf.sampleRate));
  if(len >= buf.length) return buf;
  let out;
  try { out = new AudioBuffer({length: len, numberOfChannels: buf.numberOfChannels, sampleRate: buf.sampleRate}); }
  catch(e){ return buf; }
  const fade = Math.min(len, Math.round(0.5 * buf.sampleRate));
  /* copied straight across and faded where it lands: no second copy of each
     recording made on the way, which on a slow machine was most of the work
     and all of the garbage */
  for(let ch = 0; ch < buf.numberOfChannels; ch++){
    out.copyToChannel(buf.getChannelData(ch).subarray(0, len), ch);
    const d = out.getChannelData(ch), at = len - fade;
    for(let i = 0; i < fade; i++){ const k = 1 - i / fade; d[at + i] *= k * k; }
  }
  return out;
}
/** Decode the thirty notes, once. Resolves true when the piano can play. */
function grandPianoLoad(opts){
  /* anyone but the warm-up is waiting on the sound, so the unpacking stops
     pausing between notes — including one already under way */
  if(!(opts && opts.idle)) _grand.hurry = true;
  if(_grand.state === 'ready') return Promise.resolve(true);
  if(_grand.promise) return _grand.promise;
  if(!grandPianoAvailable()){ _grand.state = 'failed'; return Promise.resolve(false); }
  _grand.state = 'loading';
  _grand.promise = (async () => {
    const files = JSON.parse(document.getElementById('grandPianoSrc').textContent);
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const AC = window.AudioContext || window.webkitAudioContext;
    /* A context used only to decode (an offline one costs no audio device),
       at 32 kHz: a piano has nothing above 16 kHz worth the memory, and the
       recordings decoded at full rate and full length are 150 MB. */
    const dec = OAC ? new OAC(2, 1, GRAND_RATE) : AC ? new AC() : null;
    if(!dec) throw new Error('this browser has no Web Audio');
    /* One recording at a time off the page's text, with a breath between —
       thirty of them unpacked in one go was a long stall on a slow machine,
       at exactly the moment a score was being drawn. The decoding itself
       still runs side by side, off the page's thread. */
    const pending = [];
    for(const name of Object.keys(files)){
      const midi = grandMidiOf(name); if(midi == null) continue;
      const bin = atob(files[name]);
      const bytes = new Uint8Array(bin.length);
      for(let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      pending.push(new Promise((res, rej) => {
        const p = dec.decodeAudioData(bytes.buffer, res, rej);
        if(p && typeof p.then === 'function') p.then(res, rej);
      }).then(buf => { _grand.buffers.set(midi, grandTrim(buf, midi)); }));
      if(!_grand.hurry) await new Promise(r => setTimeout(r, 0));
    }
    await Promise.all(pending);
    _grand.keys = [..._grand.buffers.keys()].sort((a, b) => a - b);
    if(!_grand.keys.length) throw new Error('no notes decoded');
    _grand.state = 'ready';
    return true;
  })().catch(e => { console.warn('the grand piano could not be loaded', e); _grand.state = 'failed'; return false; });
  return _grand.promise;
}
/* start decoding when the browser has a moment, so the first press is the piano */
function grandPianoWarm(){
  if(_grand.state !== 'idle' || !grandPianoAvailable()) return;
  const go = () => { grandPianoLoad({idle: true}); };
  if(typeof requestIdleCallback === 'function') requestIdleCallback(go, {timeout: 1500}); else setTimeout(go, 200);
}

/**
 * One note on the grand. vel 0–1 is how hard the key goes down; held is how
 * long it rings (the sustain pedal can make that longer than the note);
 * level scales it to sit with whatever else the caller is mixing.
 * Returns false when the piano is not ready, so the caller can use its own voice.
 */
function grandPianoNote(ctx, dest, midi, t, dur, vel, held, level){
  if(_grand.state !== 'ready' || !ctx || !dest) return false;
  const m = Math.round(midi);
  let k = _grand.keys[0];
  for(const x of _grand.keys) if(Math.abs(x - m) < Math.abs(k - m)) k = x;
  const buf = _grand.buffers.get(k);
  if(!buf) return false;
  const v = Math.max(0.03, Math.min(1, vel == null ? 0.6 : vel));
  const rate = Math.pow(2, (m - k) / 12);
  const src = ctx.createBufferSource();
  src.buffer = buf; src.playbackRate.value = rate;
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass'; tone.Q.value = 0.2;
  tone.frequency.value = Math.min(18000, 700 + 17500 * Math.pow(v, 1.6));
  const g = ctx.createGain();
  const peak = (level == null ? 1 : level) * 1.1 * Math.pow(v, 1.35);
  const start = Math.max(0, t);
  const ring = Math.max(0.05, held || dur || 0.5);
  const end = start + ring;
  /* The damper, when the key comes up. From about F♯6 a grand has none: the
     strings are short enough to die away by themselves, and they ring until
     they do. */
  g.gain.setValueAtTime(peak, start);
  const undamped = m >= GRAND_UNDAMPED;
  const tau = m < 40 ? 0.07 : 0.045;
  let stop = start + buf.duration / rate;
  if(!undamped){
    g.gain.setValueAtTime(peak, end);
    g.gain.setTargetAtTime(0.0001, end, tau);
    stop = Math.min(stop, end + tau * 8 + 0.05);
  }
  src.connect(tone); tone.connect(g); g.connect(dest);
  src.start(start);
  src.stop(stop);
  _grand.stats.sampled++;
  return true;
}
/* a caller that had to use its own voice says so, and the piano starts loading */
function grandPianoMissed(){ _grand.stats.synth++; if(_grand.state === 'idle') grandPianoLoad(); }

/* the credit the licence asks for, where the piano is played */
function grandPianoCreditHTML(){
  return `<span class="grand-credit mono faint">piano: <a href="${GRAND_CREDIT.url}" target="_blank" rel="noopener">${GRAND_CREDIT.name}</a>
    · ${GRAND_CREDIT.by} · <a href="${GRAND_CREDIT.licenceUrl}" target="_blank" rel="noopener">${GRAND_CREDIT.licence}</a></span>`;
}
/* The Jazz Studio warms it up as it opens. Score Practice does not: decoding
   the piano while a score is being engraved made both slower, so that room
   warms it itself once the notes are on the screen (scorePaint). */
addEventListener('hashchange', () => {
  try { const n = parseHash().name; if(n === 'jazz') grandPianoWarm(); } catch(e){}
});
