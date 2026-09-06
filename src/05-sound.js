/* ============================================================
   SOUND — two layers, all synthesised, nothing downloaded
   Layer 1: interaction sounds.  Layer 2: opt-in brown-noise ambient.
   The AudioContext is created lazily inside the first user gesture
   (pointerdown / keydown) and reused for everything after.
   ============================================================ */
const SoundManager = (() => {
  const LS_SOUND = 'soundEnabled', LS_AMBIENT = 'ambientEnabled';
  const readFlag = (k, fallback=false) => { try { const v = localStorage.getItem(k); return v === null ? fallback : v === 'true'; } catch(e){ return fallback; } };
  const writeFlag = (k, v) => { try { localStorage.setItem(k, String(!!v)); } catch(e){} };
  let ctx = null, master = null;
  let soundOn = readFlag(LS_SOUND, false), ambientOn = readFlag(LS_AMBIENT, false);
  let ambient = null;               // {source, filter, gain}
  let pendingClick = null;          // generic click scheduled by the delegated listener
  let lastPlay = 0;
  const listeners = new Set();
  const AMBIENT_GAIN = .03, DUCK_GAIN = .015, DUCK_RECOVER = .8;

  /* ---- context lifecycle (gesture-gated) ---- */
  function ensureCtx(){
    if(ctx) { if(ctx.state === 'suspended') ctx.resume().catch(()=>{}); return ctx; }
    const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return null;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
    return ctx;
  }
  function onFirstGesture(){
    if(!soundOn && !ambientOn) return;                 // nothing wants audio yet — stay silent, stay lazy
    ensureCtx();
    if(ambientOn && !ambient) startAmbient();
  }
  document.addEventListener('pointerdown', onFirstGesture, {capture:true});
  document.addEventListener('keydown', onFirstGesture, {capture:true});

  /* ---- tone primitive ---- */
  function tone({freq, dur, gain=.08, type='sine', attack=.005, at=0, glide=null}){
    if(!ctx) return; const t = ctx.currentTime + at;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if(glide) o.frequency.exponentialRampToValueAtTime(glide, t+dur);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(gain, t+attack); g.gain.exponentialRampToValueAtTime(.0001, t+dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t+dur+.03);
  }
  const recipes = {
    click:   () => { tone({freq:528, dur:.18, gain:.08}); tone({freq:660, dur:.12, gain:.08, at:.18}); },
    nav:     () => tone({freq:432, dur:.3, gain:.06}),
    success: () => { tone({freq:440, dur:.15, gain:.08}); tone({freq:880, dur:.15, gain:.08, at:.15}); },
    error:   () => tone({freq:220, dur:.2, gain:.05}),
    open:    () => tone({freq:396, dur:.3, gain:.07, attack:.05}),
    leaf:    () => tone({freq:880, glide:660, dur:.25, gain:.02}),
  };

  /* ---- layer 1 ---- */
  function play(kind){
    if(kind !== 'click' && pendingClick){ clearTimeout(pendingClick); pendingClick = null; }   // a specific sound wins over the generic click
    if(!soundOn || !recipes[kind]) return;
    if(!ctx){ if(!ensureCtx()) return; }                 // play() is only ever called from inside a gesture handler
    if(ctx.state === 'suspended'){ ctx.resume().catch(()=>{}); }
    const now = performance.now(); if(now - lastPlay < 40) return; lastPlay = now;   // collapse doubled handlers
    recipes[kind]();
    duck();
  }
  function scheduleClick(){ if(!soundOn) return; clearTimeout(pendingClick); pendingClick = setTimeout(() => { pendingClick = null; play('click'); }, 0); }
  const CLICKABLE = 'button, .btn, a[href], .chip.click, .signal, .tile, .mood, .dots i, .tracker i, .ring-h, .values-list li, .node, .branch, .mnode, .medge, [data-go], .jnav button, .tabs button, .typerow button, .ladder button, .feeling button, .energy-pick button, .dur-pick button, .rubric li, .res, .toggle';
  document.addEventListener('click', e => {
    const t = e.target.closest(CLICKABLE); if(!t) return;
    if(t.closest('.ed') || t.matches('[data-nosound], .close, #btnSound, #btnAmbient')) return;
    if(t.matches('.danger, [data-del], [data-pdel], [data-x="yes"], [data-tdel], [data-tndel], [data-idel], [data-artdel], [data-songdel], [data-evdel], [data-resdel], [data-mdel]')) { play('error'); return; }
    if(t.matches('a[href^="#/"], [data-go]') && !t.matches('.chip')) return;   // navigation: the hashchange plays the nav tone instead
    scheduleClick();
  }, true);

  /* ---- layer 2: brown noise ---- */
  const workletSrc = `class BrownNoise extends AudioWorkletProcessor{constructor(){super();this.last=0}process(inputs,outputs){const out=outputs[0];for(let c=0;c<out.length;c++){const ch=out[c];for(let i=0;i<ch.length;i++){const white=Math.random()*2-1;this.last=(this.last+.02*white)/1.02;ch[i]=this.last*3.5}}return true}}registerProcessor('brown-noise',BrownNoise);`;
  let workletReady = null;
  async function makeNoiseNode(){
    if(ctx.audioWorklet){
      try { workletReady = workletReady || ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([workletSrc],{type:'application/javascript'}))); await workletReady; return new AudioWorkletNode(ctx, 'brown-noise', {numberOfInputs:0, outputChannelCount:[2]}); } catch(e){ /* fall through */ }
    }
    const sp = ctx.createScriptProcessor(4096, 1, 2); let last = 0;
    sp.onaudioprocess = ev => { const L = ev.outputBuffer.getChannelData(0), R = ev.outputBuffer.getChannelData(1); for(let i=0;i<L.length;i++){ const white = Math.random()*2-1; last = (last + .02*white)/1.02; L[i] = R[i] = last*3.5; } };
    return sp;
  }
  async function startAmbient(){
    if(!ensureCtx() || ambient) return;
    const source = await makeNoiseNode(); if(ambient) { try{ source.disconnect(); }catch(e){} return; }
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 200; filter.Q.value = .7;
    const gain = ctx.createGain(); gain.gain.setValueAtTime(.0001, ctx.currentTime); gain.gain.linearRampToValueAtTime(AMBIENT_GAIN, ctx.currentTime + 1.5);
    source.connect(filter); filter.connect(gain); gain.connect(master);
    ambient = {source, filter, gain};
    if(ctx.state === 'suspended') ctx.resume().catch(()=>{});
  }
  function stopAmbient(){
    if(!ambient) return; const a = ambient; ambient = null; const t = ctx.currentTime;
    a.gain.gain.cancelScheduledValues(t); a.gain.gain.setValueAtTime(a.gain.gain.value, t); a.gain.gain.linearRampToValueAtTime(.0001, t+.6);
    setTimeout(() => { try { a.source.disconnect(); a.filter.disconnect(); a.gain.disconnect(); if(a.source.port) a.source.port.close?.(); } catch(e){} }, 700);
  }
  function duck(){
    if(!ambient || !ambientOn) return; const g = ambient.gain.gain, t = ctx.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(DUCK_GAIN, t); g.linearRampToValueAtTime(AMBIENT_GAIN, t + DUCK_RECOVER);
  }

  /* ---- public state ---- */
  function notify(){ listeners.forEach(fn => { try { fn(state()); } catch(e){} }); }
  function state(){ return {soundEnabled: soundOn, ambientEnabled: ambientOn, ready: !!ctx}; }
  function setSound(v){ soundOn = !!v; writeFlag(LS_SOUND, soundOn); if(soundOn){ ensureCtx(); play('click'); } notify(); }
  function setAmbient(v){ ambientOn = !!v; writeFlag(LS_AMBIENT, ambientOn); if(ambientOn){ ensureCtx(); startAmbient(); } else stopAmbient(); notify(); }
  return { play, state, setSound, setAmbient, toggleSound: () => setSound(!soundOn), toggleAmbient: () => setAmbient(!ambientOn), subscribe(fn){ listeners.add(fn); return () => listeners.delete(fn); }, get context(){ return ctx; }, get ambientGain(){ return ambient ? ambient.gain.gain : null; } };
})();
/* hook-shaped accessor, for symmetry with component code: const {play, toggleSound} = useSoundManager(); */
function useSoundManager(){ return SoundManager; }
/* legacy names used across the site → new recipes */
const SOUND_ALIASES = {save:'click', page:'nav', chime:'success', leaf:'leaf', click:'click', nav:'nav', success:'success', error:'error', open:'open'};
function sound(kind){ SoundManager.play(SOUND_ALIASES[kind] || kind); }
function syncSoundButtons(){
  const {soundEnabled, ambientEnabled} = SoundManager.state();
  const b = $('#btnSound'); if(b){ b.textContent = soundEnabled ? '🔔' : '🔕'; b.title = soundEnabled ? 'Interaction sounds on' : 'Interaction sounds off'; b.classList.toggle('on', soundEnabled); }
  const a = $('#btnAmbient'); if(a){ a.textContent = '🌊'; a.title = ambientEnabled ? 'Ambient on' : 'Ambient off'; a.classList.toggle('on', ambientEnabled); a.style.opacity = ambientEnabled ? '1' : '.45'; }
}
SoundManager.subscribe(syncSoundButtons);
