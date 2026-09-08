/* ============================================================
   SOUND — two layers, all synthesised, nothing downloaded.
   Layer 1: interaction sounds. Every one of them is a singing
            bowl — a rin gong struck with a padded mallet, in
            a range of sizes. What makes a bowl a bowl and not
            a bell is two things: its overtones are not whole
            multiples of the fundamental (roughly 1 : 2.75 :
            5.18 : 8.16 : 11.9, the modes of a thin metal
            shell), and each of those modes is really a pair
            split a few cents apart, so the note breathes in
            and out a few times a second. Both are modelled
            here, then put in a stone room.
   Layer 2: an opt-in atmosphere — noise beds, or a slow
            generative piano that never repeats itself.
   The AudioContext is created lazily inside the first user
   gesture (pointerdown / keydown) and reused for everything.
   ============================================================ */
const AMBIENT_KINDS = [
  {id:'off',      name:'Off',            desc:'silence'},
  {id:'brown',    name:'Brown noise',    desc:'a low, even hush'},
  {id:'rain',     name:'Rain',           desc:'steady rain on a window'},
  {id:'ocean',    name:'Ocean',          desc:'slow waves, long breaths'},
  {id:'piano',    name:'Slow piano',     desc:'a quiet room, someone playing to themselves'},
  {id:'musicbox', name:'Music box',      desc:'sparse bells, further away'},
];
const SoundManager = (() => {
  const LS_SOUND = 'soundEnabled', LS_AMBIENT = 'ambientEnabled', LS_KIND = 'ambientKind', LS_VOL = 'ambientVolume';
  const readFlag = (k, fallback=false) => { try { const v = localStorage.getItem(k); return v === null ? fallback : v === 'true'; } catch(e){ return fallback; } };
  const writeFlag = (k, v) => { try { localStorage.setItem(k, String(!!v)); } catch(e){} };
  const readStr = (k, fallback) => { try { return localStorage.getItem(k) ?? fallback; } catch(e){ return fallback; } };
  const writeStr = (k, v) => { try { localStorage.setItem(k, String(v)); } catch(e){} };
  let ctx = null, master = null, verb = null, verbSend = null, dry = null;
  let soundOn = readFlag(LS_SOUND, false), ambientOn = readFlag(LS_AMBIENT, false);
  let ambientKind = readStr(LS_KIND, 'brown'), ambientVol = parseFloat(readStr(LS_VOL, '0.5'));
  let ambient = null;               // {nodes:[], gain, timer}
  let pendingClick = null, lastPlay = 0;
  const listeners = new Set();
  const BASE_GAIN = .05, DUCK_RATIO = .45, DUCK_RECOVER = .9;
  const ambientGainValue = () => BASE_GAIN * clamp(ambientVol, 0, 1) * 2;

  /* ---- context lifecycle (gesture-gated) ---- */
  function makeImpulse(seconds=2.6, decay=2.2){
    const rate = ctx.sampleRate, len = Math.floor(rate*seconds);
    const buf = ctx.createBuffer(2, len, rate);
    for(let c=0;c<2;c++){ const d = buf.getChannelData(c);
      for(let i=0;i<len;i++){ d[i] = (Math.random()*2-1) * Math.pow(1 - i/len, decay); } }
    return buf;
  }
  function ensureCtx(){
    if(ctx){ if(ctx.state === 'suspended') ctx.resume().catch(()=>{}); return ctx; }
    const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
    dry = ctx.createGain(); dry.gain.value = 1; dry.connect(master);
    try {
      verb = ctx.createConvolver(); verb.buffer = makeImpulse();
      const wet = ctx.createGain(); wet.gain.value = 1.05; verb.connect(wet); wet.connect(master);
      verbSend = ctx.createGain(); verbSend.gain.value = .3; verbSend.connect(verb);
    } catch(e){ verb = verbSend = null; }
    return ctx;
  }
  function onFirstGesture(){ if(!soundOn && !ambientOn) return; ensureCtx(); if(ambientOn && !ambient) startAmbient(); }
  document.addEventListener('pointerdown', onFirstGesture, {capture:true});
  document.addEventListener('keydown', onFirstGesture, {capture:true});
  const out = () => dry || master;
  const send = (node) => { if(verbSend) node.connect(verbSend); };

  /* ---- primitives ---- */
  /* the modes of a bowl: inharmonic, and each one a doublet a few cents apart */
  const BOWL_MODES = [1, 2.75, 5.18, 8.16, 11.9];
  /* a struck bowl. `size` stretches the decay of the higher partials — a big
     bowl keeps its shimmer, a small one loses it almost at once. `beat` is how
     far apart the two halves of each mode sit, in cents: that split is the slow
     wobble you hear in the tail. */
  function bowl({freq, dur=1.2, gain=.05, beat=7, modes=BOWL_MODES, size=1, at=0, wet=1, attack=0}){
    if(!ctx) return; const t = ctx.currentTime + at;
    const bus = ctx.createGain(); bus.gain.value = 1; bus.connect(out()); if(wet) send(bus);
    modes.forEach((m, i) => {
      /* higher modes are quieter and die sooner — the strike is bright, the tail is not */
      const amp = gain * Math.pow(.52, i) * (i ? 1 : 1.25);
      const d = Math.max(.09, dur * Math.pow(.62, i) * (i ? size : 1));
      const f = freq * m * (1 + (i ? (i % 2 ? .004 : -.003) : 0));   // real bowls are never exactly on ratio
      [-1, 1].forEach(side => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(f, t);
        o.detune.setValueAtTime(side * beat * (1 + i * .5), t);       // the split that makes it breathe
        g.gain.setValueAtTime(.0001, t);
        g.gain.linearRampToValueAtTime(amp / 2, t + .006 + i * .002 + attack); // metal takes a moment to speak
        g.gain.exponentialRampToValueAtTime(.0001, t + d);
        o.connect(g); g.connect(bus); o.start(t); o.stop(t + d + .05);
      });
    });
  }
  /* the mallet itself: leather on metal, felt for the softer ones. Almost subliminal. */
  function mallet({freq=900, dur=.05, gain=.02, q=.8, at=0}){ noise({dur, freq, q, gain, sweep:freq*.45, wet:.35, at}); }
  /* a short filtered noise transient: the touch, the felt, the breath */
  function noise({dur=.08, freq=1200, q=1.2, gain=.05, type='bandpass', at=0, sweep=null, wet=.5}){
    if(!ctx) return; const t = ctx.currentTime + at;
    const len = Math.max(1, Math.floor(ctx.sampleRate * (dur + .05)));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate); const d = buf.getChannelData(0);
    for(let i=0;i<len;i++) d[i] = Math.random()*2-1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if(sweep) f.frequency.exponentialRampToValueAtTime(sweep, t+dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(gain, t+.006); g.gain.exponentialRampToValueAtTime(.0001, t+dur);
    src.connect(f); f.connect(g); g.connect(out()); if(wet && verbSend){ const w = ctx.createGain(); w.gain.value = wet; g.connect(w); w.connect(verbSend); }
    src.start(t); src.stop(t+dur+.05);
  }
  const recipes = {
    /* Not struck — sounded. No mallet, so there is no noise transient and
       nothing to hear as a "click"; just a sine and its octave, which is as
       pure as this synth gets. The onset is eased over ~16ms so the tone
       arrives rather than hits, the two halves sit 3 cents apart so it
       breathes about once a second instead of warbling, and the tail is long
       and wet enough to feel like a room rather than a UI. */
    click:   () => bowl({freq:440, dur:.9, gain:.026, beat:3, size:1, modes:[1, 2], attack:.01, wet:1}),
    /* the same bowl, lower and softer — a page turning in a quiet room */
    nav:     () => { mallet({freq:900, dur:.05, gain:.012, q:.5}); bowl({freq:392, dur:.9, gain:.034, beat:6, size:.75, wet:1}); },
    /* a full bowl, struck properly and allowed to ring out */
    success: () => { mallet({freq:2000, dur:.035, gain:.02}); bowl({freq:261.63, dur:2.8, gain:.05, beat:5, size:1, wet:1});
                     bowl({freq:392, dur:1.9, gain:.02, beat:8, size:.8, at:.09, wet:1}); },
    /* struck, then a palm on the rim: it stops before it can bloom */
    error:   () => { mallet({freq:520, dur:.05, gain:.024, q:1.2}); bowl({freq:174.61, dur:.42, gain:.05, beat:11, size:.4, modes:[1,2.75,5.18], wet:.5}); },
    /* not struck at all — the rim rubbed, so the note arrives instead of starting */
    open:    () => { bowl({freq:196, dur:1.6, gain:.03, beat:4, size:1, modes:[1,2.75,5.18], attack:.26, wet:1});
                     noise({dur:.5, freq:700, q:.4, gain:.012, sweep:2200, wet:.9}); },
    /* the smallest bowl there is, barely touched */
    leaf:    () => bowl({freq:1046.5, dur:.42, gain:.014, beat:12, size:.45, modes:[1,2.75,5.18], wet:1}),
  };

  /* ---- layer 1 ---- */
  function play(kind){
    if(kind !== 'click' && pendingClick){ clearTimeout(pendingClick); pendingClick = null; }
    if(!soundOn || !recipes[kind]) return;
    if(!ctx){ if(!ensureCtx()) return; }
    if(ctx.state === 'suspended'){ ctx.resume().catch(()=>{}); }
    const now = performance.now(); if(now - lastPlay < 60) return; lastPlay = now;
    recipes[kind](); duck();
  }
  function scheduleClick(){ if(!soundOn) return; clearTimeout(pendingClick); pendingClick = setTimeout(() => { pendingClick = null; play('click'); }, 0); }
  const CLICKABLE = 'button, .btn, a[href], .chip.click, .signal, .tile, .mood, .dots i, .tracker i, .ring-h, .values-list li, .compass-list li, .node, .branch, .mnode, .medge, [data-go], .jnav button, .tabs button, .typerow button, .ladder button, .feeling button, .entry, .work, .task-check, .mode-switch button';
  document.addEventListener('click', e => {
    const t = e.target.closest(CLICKABLE); if(!t) return;
    if(t.closest('.ed') || t.matches('[data-nosound], .close, #btnSound, #btnAmbient')) return;
    if(t.matches('.danger, .destructive, .del-x, [data-del], [data-pdel], [data-x="yes"], [data-tdel], [data-tndel], [data-idel], [data-artdel], [data-songdel], [data-evdel], [data-resdel], [data-mdel]')) { play('error'); return; }
    if(t.matches('a[href^="#/"], [data-go]') && !t.matches('.chip')) return;
    scheduleClick();
  }, true);

  /* ---- layer 2: atmospheres ---- */
  const workletSrc = `class BrownNoise extends AudioWorkletProcessor{constructor(){super();this.last=0}process(inputs,outputs){const out=outputs[0];for(let c=0;c<out.length;c++){const ch=out[c];for(let i=0;i<ch.length;i++){const white=Math.random()*2-1;this.last=(this.last+.02*white)/1.02;ch[i]=this.last*3.5}}return true}}registerProcessor('brown-noise',BrownNoise)`;
  let workletReady = null;
  async function makeNoiseNode(){
    if(ctx.audioWorklet){
      try { workletReady = workletReady || ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([workletSrc],{type:'application/javascript'}))); await workletReady; return new AudioWorkletNode(ctx, 'brown-noise', {numberOfInputs:0, outputChannelCount:[2]}); } catch(e){}
    }
    const sp = ctx.createScriptProcessor(4096, 1, 2); let last = 0;
    sp.onaudioprocess = ev => { const L = ev.outputBuffer.getChannelData(0), R = ev.outputBuffer.getChannelData(1); for(let i=0;i<L.length;i++){ const white = Math.random()*2-1; last = (last + .02*white)/1.02; L[i] = R[i] = last*3.5; } };
    return sp;
  }
  /* a slow generative line: pentatonic over a drifting pair of chords, never the same twice */
  const SCALE = [0,2,4,7,9];                                   // major pentatonic degrees
  const ROOTS = [55, 58.27, 49, 65.41];                        // A1, Bb1, G1, C2 — slow harmonic drift
  function noteHz(root, deg, oct){ return root * Math.pow(2, oct + SCALE[deg]/12); }
  function startMusic(kind){
    const bed = ctx.createGain(); bed.gain.setValueAtTime(.0001, ctx.currentTime);
    bed.gain.linearRampToValueAtTime(ambientGainValue()*(kind==='musicbox'?1.1:1.4), ctx.currentTime + 3);
    bed.connect(out()); if(verbSend){ const w = ctx.createGain(); w.gain.value = kind==='musicbox' ? 1.1 : .8; bed.connect(w); w.connect(verbSend); }
    let chord = 0, step = 0;
    const beat = kind === 'musicbox' ? 2400 : 1750;
    const tick = () => {
      if(!ambient) return;
      const root = ROOTS[chord];
      const play1 = (deg, oct, at, gain, dur) => {
        const t = ctx.currentTime + at; const f = noteHz(root, deg, oct);
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = kind === 'musicbox' ? 'triangle' : 'sine'; o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(gain, t + (kind==='musicbox'?.006:.03)); g.gain.exponentialRampToValueAtTime(.0001, t+dur);
        o.connect(g); g.connect(bed); o.start(t); o.stop(t+dur+.05);
        if(kind !== 'musicbox'){ const o2 = ctx.createOscillator(), g2 = ctx.createGain();  // a soft octave shimmer
          o2.type='sine'; o2.frequency.setValueAtTime(f*2, t); g2.gain.setValueAtTime(.0001,t); g2.gain.linearRampToValueAtTime(gain*.22, t+.05); g2.gain.exponentialRampToValueAtTime(.0001, t+dur*.7);
          o2.connect(g2); g2.connect(bed); o2.start(t); o2.stop(t+dur*.8); }
      };
      const deg = SCALE.length;
      if(kind === 'musicbox'){
        play1(Math.floor(Math.random()*deg), 3 + (Math.random()<.3?1:0), 0, .05, 3.2);
        if(Math.random() < .45) play1(Math.floor(Math.random()*deg), 3, .55 + Math.random()*.5, .032, 2.6);
      } else {
        if(step % 4 === 0) play1(0, 1, 0, .05, 7);                                  // the low root, sustained
        play1(Math.floor(Math.random()*deg), 2, .1, .045, 4.2);
        if(Math.random() < .6) play1(Math.floor(Math.random()*deg), 3, .5 + Math.random()*.6, .03, 3.4);
        if(Math.random() < .25) play1(Math.floor(Math.random()*deg), 2, 1.05, .022, 3);
      }
      step++; if(step % 4 === 0) chord = (chord + (Math.random()<.5?1:2)) % ROOTS.length;
      ambient.timer = setTimeout(tick, beat + Math.random()*500);
    };
    ambient = {nodes:[], gain:bed, timer:null};
    tick();
  }
  async function startAmbient(){
    if(!ensureCtx() || ambient || ambientKind === 'off') return;
    if(ambientKind === 'piano' || ambientKind === 'musicbox'){ startMusic(ambientKind); return; }
    const source = await makeNoiseNode(); if(ambient){ try{ source.disconnect(); }catch(e){} return; }
    const nodes = [source]; const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter(); nodes.push(filter);
    let last = filter;
    if(ambientKind === 'rain'){
      filter.type = 'bandpass'; filter.frequency.value = 1100; filter.Q.value = .55;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 380; filter.connect(hp); nodes.push(hp); last = hp;
    } else if(ambientKind === 'ocean'){
      filter.type = 'lowpass'; filter.frequency.value = 380; filter.Q.value = .9;
      const lfo = ctx.createOscillator(), lg = ctx.createGain();                   // waves: a slow cutoff swell
      lfo.frequency.value = .07; lg.gain.value = 230; lfo.connect(lg); lg.connect(filter.frequency); lfo.start(); nodes.push(lfo, lg);
    } else {
      filter.type = 'lowpass'; filter.frequency.value = 200; filter.Q.value = .7;
    }
    const target = ambientGainValue() * (ambientKind === 'rain' ? 1.5 : ambientKind === 'ocean' ? 1.8 : 1);
    gain.gain.setValueAtTime(.0001, ctx.currentTime); gain.gain.linearRampToValueAtTime(target, ctx.currentTime + 1.8);
    source.connect(filter); last.connect(gain); gain.connect(out());
    ambient = {nodes, gain, timer:null};
    if(ambientKind === 'rain'){                                                     // occasional drops on the glass
      const drop = () => { if(!ambient) return; if(Math.random() < .7) noise({dur:.05, freq:2200+Math.random()*2600, q:6, gain:.012, wet:1}); ambient.timer = setTimeout(drop, 400 + Math.random()*1800); };
      ambient.timer = setTimeout(drop, 900);
    }
    if(ctx.state === 'suspended') ctx.resume().catch(()=>{});
  }
  function stopAmbient(){
    if(!ambient) return; const a = ambient; ambient = null; clearTimeout(a.timer);
    const t = ctx.currentTime;
    a.gain.gain.cancelScheduledValues(t); a.gain.gain.setValueAtTime(a.gain.gain.value, t); a.gain.gain.linearRampToValueAtTime(.0001, t+.8);
    setTimeout(() => { try { a.nodes.forEach(n => { n.disconnect?.(); n.stop?.(); }); a.gain.disconnect(); } catch(e){} }, 1000);
  }
  function duck(){
    if(!ambient || !ambientOn) return; const g = ambient.gain.gain, t = ctx.currentTime;
    const target = g.value; g.cancelScheduledValues(t); g.setValueAtTime(target*DUCK_RATIO, t); g.linearRampToValueAtTime(ambientGainValue()*1.4, t + DUCK_RECOVER);
  }

  /* ---- public state ---- */
  function notify(){ listeners.forEach(fn => { try { fn(state()); } catch(e){} }); }
  function state(){ return {soundEnabled: soundOn, ambientEnabled: ambientOn, ambientKind, ambientVolume: ambientVol, ready: !!ctx}; }
  function setSound(v){ soundOn = !!v; writeFlag(LS_SOUND, soundOn); if(soundOn){ ensureCtx(); play('click'); } notify(); }
  function setAmbient(v){ ambientOn = !!v; writeFlag(LS_AMBIENT, ambientOn); if(ambientOn && ambientKind !== 'off'){ ensureCtx(); startAmbient(); } else stopAmbient(); notify(); }
  function setAmbientKind(k){
    ambientKind = k; writeStr(LS_KIND, k); stopAmbient();
    if(k === 'off'){ ambientOn = false; writeFlag(LS_AMBIENT, false); }
    else { ambientOn = true; writeFlag(LS_AMBIENT, true); ensureCtx(); setTimeout(startAmbient, 120); }
    notify();
  }
  function setAmbientVolume(v){
    ambientVol = clamp(+v || 0, 0, 1); writeStr(LS_VOL, ambientVol);
    if(ambient){ const g = ambient.gain.gain, t = ctx.currentTime; g.cancelScheduledValues(t); g.linearRampToValueAtTime(Math.max(.0001, ambientGainValue()*1.4), t+.3); }
    notify();
  }
  return { play, state, setSound, setAmbient, setAmbientKind, setAmbientVolume,
    toggleSound: () => setSound(!soundOn), toggleAmbient: () => setAmbient(!ambientOn),
    subscribe(fn){ listeners.add(fn); return () => listeners.delete(fn); },
    get context(){ return ctx; } };
})();
function useSoundManager(){ return SoundManager; }
const SOUND_ALIASES = {save:'click', page:'nav', chime:'success', leaf:'leaf', click:'click', nav:'nav', success:'success', error:'error', open:'open'};
function sound(kind){ SoundManager.play(SOUND_ALIASES[kind] || kind); }
function syncSoundButtons(){
  const {soundEnabled, ambientEnabled, ambientKind} = SoundManager.state();
  const b = $('#btnSound'); if(b){ b.textContent = soundEnabled ? '🔔' : '🔕'; b.title = soundEnabled ? 'Interaction sounds on' : 'Interaction sounds off'; b.classList.toggle('on', soundEnabled); }
  const a = $('#btnAmbient'); if(a){ a.textContent = '🌊'; a.title = ambientEnabled ? `Atmosphere: ${(AMBIENT_KINDS.find(k=>k.id===ambientKind)||{}).name}` : 'Atmosphere off'; a.classList.toggle('on', ambientEnabled); a.style.opacity = ambientEnabled ? '1' : '.45'; }
}
SoundManager.subscribe(syncSoundButtons);
/* the atmosphere picker, from the top bar or from Settings */
function ambientMenuHTML(){
  const {ambientKind, ambientVolume, ambientEnabled} = SoundManager.state();
  const cur = ambientEnabled ? ambientKind : 'off';
  return `<div class="amb-list">${AMBIENT_KINDS.map(k => `<button class="amb-opt ${cur===k.id?'on':''}" data-amb="${k.id}"><span class="amb-name">${esc(k.name)}</span><span class="amb-desc">${esc(k.desc)}</span></button>`).join('')}</div>
    <div class="field" style="margin-top:12px"><label>Volume</label><input type="range" class="slider" min="0" max="1" step="0.05" value="${ambientVolume}" id="ambVol"></div>`;
}
function bindAmbientMenu(root){
  root.querySelectorAll('[data-amb]').forEach(b => b.onclick = () => {
    SoundManager.setAmbientKind(b.dataset.amb);
    root.querySelectorAll('[data-amb]').forEach(x => x.classList.toggle('on', x === b));
  });
  const v = root.querySelector('#ambVol'); if(v) v.oninput = () => SoundManager.setAmbientVolume(v.value);
}
function openAmbientMenu(){
  const m = openModal(`<h2>Atmosphere</h2><p class="muted" style="font-size:.86rem">A bed of sound under the room. All of it is made in the browser — nothing is downloaded, and the piano never plays the same phrase twice.</p>${ambientMenuHTML()}`, 'narrow');
  bindAmbientMenu(m);
}
