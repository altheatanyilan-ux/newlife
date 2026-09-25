/* ============================================================
   THE METRONOME.

   The room can play a score to you now (19-score-play.js), but hearing it
   is not practising it. A metronome is the one thing that turns reading into
   practising: it is what
   makes "slowly" mean a number rather than a feeling, and what catches the
   fact that you speed up in the easy bar and slow down in the hard one, which
   is the single most common thing wrong with an amateur performance and the
   one thing you cannot hear yourself doing.

   Two decisions worth writing down.

   IT IS SCHEDULED AGAINST THE AUDIO CLOCK. The obvious way is setInterval at
   60000/bpm, and it is wrong: the timer runs on the main thread, so it slips
   every time anything else happens — a render, a save, a scroll — and it
   slips in one direction. Within a minute it is audibly not the tempo you
   asked for, which is worse than no metronome, because you will trust it. So
   a short timer only looks ahead, and every click is booked at an exact time
   on the audio clock, which is a different clock and does not slip.

   AND IT IS NOT THE HOUSE'S CHIMES. Turning off the interface sounds is
   saying you do not want to be pinged at; it is not saying you do not want a
   metronome. It keeps its own audio, its own volume and its own switch.
   ============================================================ */

const ScoreMetronome = (() => {
  let ctx = null, out = null;
  let on = false, bpm = 90, perBar = 4, at = 0;
  let timer = null, nextAt = 0, vol = 0.5, accent = true;
  const listeners = new Set();
  /* Look a fifth of a second ahead and wake five times as often as that. Both
     numbers are unremarkable on purpose: long enough that a busy frame cannot
     starve the schedule, short enough that a tempo change is heard at once. */
  const AHEAD = 0.2, TICK = 40;

  function ensure(){
    if(ctx){ if(ctx.state === 'suspended') ctx.resume().catch(() => {}); return ctx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return null;
    ctx = new AC();
    out = ctx.createGain();
    out.gain.value = 1;
    out.connect(ctx.destination);
    return ctx;
  }
  /* A wooden click rather than a beep: a short noise burst through a tight
     band-pass, which is what a block of wood being struck actually is. The
     downbeat is the same sound a fifth higher and a little louder, because a
     bar you can hear the start of is a bar you can count — unless the accent
     is switched off, when every beat is the same click (for hearing the
     pulse without the bar, or for a piece whose accents are not on one). */
  function click(when, strong){
    if(!ctx) return;
    const dur = 0.035;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for(let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.2);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = strong ? 2400 : 1600;
    band.Q.value = 6;
    const g = ctx.createGain();
    const peak = clamp(vol, 0, 1) * (strong ? 0.5 : 0.3);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), when + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(band); band.connect(g); g.connect(out);
    src.start(when); src.stop(when + dur + 0.01);
  }
  /* The whole of the timing. Everything already booked stays booked, so a
     frame that takes too long costs nothing — the clicks were scheduled
     before it started. */
  function pump(){
    if(!on || !ctx) return;
    while(nextAt < ctx.currentTime + AHEAD){
      const strong = accent && at % Math.max(1, perBar) === 0;
      click(nextAt, strong);
      beatSeen(nextAt, strong);
      nextAt += 60 / clamp(bpm, 20, 300);
      at += 1;
    }
  }
  /* The visible pulse is a separate thing from the audible one. It is handed
     out for the moment the click will sound rather than the moment it was
     scheduled, which is up to a fifth of a second earlier — a dot that
     flashes before the sound is worse than no dot.

     It carries `when`, the exact time the click was booked on the audio
     clock. That is the only honest record of the timing: the listener runs on
     the main thread and is therefore late whenever anything else is busy,
     while the sound is not. Anything measuring this metronome has to measure
     what was booked, not when it heard about it. */
  function beatSeen(when, strong){
    const lead = Math.max(0, (when - ctx.currentTime) * 1000);
    const beat = at;
    setTimeout(() => { if(on) listeners.forEach(f => { try { f({strong, beat, when}); } catch(e){} }); }, lead);
  }
  function start(){
    if(on) return true;
    if(!ensure()) return false;
    on = true; at = 0;
    nextAt = ctx.currentTime + 0.08;
    pump();
    timer = setInterval(pump, TICK);
    return true;
  }
  function stop(){
    on = false;
    if(timer){ clearInterval(timer); timer = null; }
  }
  return {
    start, stop,
    toggle(){ return on ? (stop(), false) : start(); },
    get running(){ return on; },
    get bpm(){ return bpm; },
    /* changing tempo mid-count keeps the beat you are on and re-spaces the
       ones after it, so it speeds up rather than stumbling */
    setBpm(n){ bpm = clamp(Math.round(+n || 0), 20, 300); return bpm; },
    get perBar(){ return perBar; },
    setPerBar(n){ perBar = clamp(Math.round(+n || 4), 1, 16); return perBar; },
    setVolume(v){ vol = clamp(+v, 0, 1); return vol; },
    get accent(){ return accent; },
    setAccent(v){ accent = v !== false; return accent; },
    get volume(){ return vol; },
    onBeat(fn){ listeners.add(fn); return () => listeners.delete(fn); },
  };
})();

/* ---------- tap tempo ----------
   Four taps is a tempo; two is a guess. The window is generous at the slow end
   and the run is dropped once you stop, because a tap two bars after the last
   one is the start of a new answer rather than part of the old one. */
let _tapTimes = [];
function scoreTapTempo(){
  const now = Date.now();
  if(_tapTimes.length && now - _tapTimes[_tapTimes.length - 1] > 2500) _tapTimes = [];
  _tapTimes.push(now);
  if(_tapTimes.length > 6) _tapTimes = _tapTimes.slice(-6);
  if(_tapTimes.length < 2) return null;
  const gaps = [];
  for(let i = 1; i < _tapTimes.length; i++) gaps.push(_tapTimes[i] - _tapTimes[i - 1]);
  const avg = sum(gaps) / gaps.length;
  if(!avg) return null;
  return clamp(Math.round(60000 / avg), 20, 300);
}
const scoreTapCount = () => _tapTimes.length;
function scoreTapReset(){ _tapTimes = []; }
