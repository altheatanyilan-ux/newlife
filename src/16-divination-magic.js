/* ============================================================
   THE AIR IN THE ROOM

   Two small machines that run only while a reading is being dealt: a few
   dozen specks of warm light on a canvas over the ceremony, and a handful
   of tones synthesised on the spot. Neither is decoration for its own
   sake. A ceremony is a way of marking that the next few minutes are
   different from the ones before, and that mark is made out of exactly
   this — a change in the light and a change in the sound.

   The rule for both is the same: never loud, never fast, never anywhere
   but in the ceremony. Nothing here starts on its own and nothing here
   plays on any other page. Either can be switched off; the light is also
   off outright for anyone who has asked for less motion, which the sound
   is not, because asking for less movement is not asking for silence.

   No audio files: every sound is an oscillator and an envelope, which is
   how a single file affords a singing bowl.
   ============================================================ */

/* ---------- preferences ----------
   Kept with the app's other settings rather than in the divination state,
   because they are about how the room behaves, not about any reading. */
function divPrefs(){
  S.settings = S.settings || {};
  const d = S.settings.divination || (S.settings.divination = {});
  if(typeof d.reversals  !== 'boolean') d.reversals = true;
  if(typeof d.sound      !== 'boolean') d.sound = true;
  if(typeof d.particles  !== 'boolean') d.particles = true;
  if(typeof d.volume     !== 'number')  d.volume = .3;
  if(typeof d.spread     !== 'string')  d.spread = 'ppf';
  if(typeof d.castSize   !== 'string')  d.castSize = 'standard';
  if(typeof d.quickWith  !== 'string')  d.quickWith = 'tarot';
  if(!Array.isArray(d.customSpreads))   d.customSpreads = [];
  if(!Array.isArray(d.customCharms))    d.customCharms = [];
  return d;
}
const divPrefSet = (k, v) => { divPrefs()[k] = v; saveNow(); };

/* ============================================================
   THE DUST

   Three behaviours, on one canvas, over the ceremony and nothing else.

     ambient   a few motes drifting, the way dust moves in candlelight
     burst     a card has turned: a ring of sparks off its centre
     shimmer   all of them are up: a slow sweep of light left to right

   The loop runs only while there is something to draw and only while the
   ceremony is on screen. `stop()` cancels the frame and clears the canvas;
   there is no idling loop in the background of this app.
   ============================================================ */
const DV_GOLD = '#d4a44c', DV_PALE = '#fffdf5';

function ParticleField(canvas){
  this.cv = canvas;
  this.ctx = canvas.getContext('2d');
  this.ps = [];
  this.mode = 'idle';
  this.raf = 0;
  this.dpr = Math.min(window.devicePixelRatio || 1, 2);
  this.resize();
}
ParticleField.prototype.resize = function(){
  const r = this.cv.getBoundingClientRect();
  this.w = Math.max(r.width, 1); this.h = Math.max(r.height, 1);
  this.cv.width = Math.round(this.w * this.dpr);
  this.cv.height = Math.round(this.h * this.dpr);
  this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
};
ParticleField.prototype.make = function(x, y, o){
  o = o || {};
  const life = o.life || 60 + Math.random() * 120;
  return {x, y,
    vx: o.vx !== undefined ? o.vx : (Math.random() - .5) * .3,
    vy: o.vy !== undefined ? o.vy : (Math.random() - .5) * .3,
    rad: o.rad || 1 + Math.random() * 1.5,
    op:  o.op  || .3 + Math.random() * .3,
    life, maxLife: life,
    col: o.col || DV_GOLD,
    /* a mote that only travels in a straight line reads as a bug; a small
       angular velocity is the whole difference between dust and pixels */
    spin: o.spin ? (Math.random() - .5) * .03 : 0,
    ang: Math.random() * Math.PI * 2,
    wob: o.wob === undefined ? .4 : o.wob,
    fade: o.fade !== false};
};
/* motes wandering in from the edges — the air being alive, not an effect */
ParticleField.prototype.ambient = function(n){
  this.mode = 'ambient';
  this.want = n || 20;
  this.run();
};
ParticleField.prototype.seed = function(){
  const edge = Math.floor(Math.random() * 4);
  const x = edge === 0 ? -4 : edge === 1 ? this.w + 4 : Math.random() * this.w;
  const y = edge === 2 ? -4 : edge === 3 ? this.h + 4 : Math.random() * this.h;
  this.ps.push(this.make(x, y, {rad: .7 + Math.random() * 1.3, op: .3 + Math.random() * .2,
    life: 420 + Math.random() * 400, fade: false}));
};
/* a card has turned */
ParticleField.prototype.burst = function(x, y, n){
  n = n || 26;
  for(let i = 0; i < n; i++){
    const a = (Math.PI * 2 * i) / n + (Math.random() - .5) * .5;
    const sp = 1.5 + Math.random() * 2.5;
    this.ps.push(this.make(x, y, {vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      rad: 1 + Math.random() * 1.6, op: .6 + Math.random() * .3,
      life: 40 + Math.random() * 40, spin: true, wob: .12,
      col: Math.random() > .3 ? DV_GOLD : DV_PALE}));
  }
  /* one or two heavier ones, which live longer and leave the trail */
  for(let i = 0; i < 2; i++){
    const a = Math.random() * Math.PI * 2, sp = 1 + Math.random();
    this.ps.push(this.make(x, y, {vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      rad: 2.6 + Math.random() * 1.6, op: .5, life: 80 + Math.random() * 40, spin: true, wob: .1}));
  }
  this.run();
};
/* everything is up: a wind of light across the whole ceremony */
ParticleField.prototype.shimmer = function(){
  this.mode = 'shimmer';
  for(let i = 0; i < 52; i++){
    this.ps.push(this.make(-Math.random() * this.w * .5, Math.random() * this.h,
      {vx: 3 + Math.random() * 2.4, vy: (Math.random() - .5) * .25,
       rad: .8 + Math.random() * .5, op: .2 + Math.random() * .1,
       life: 70 + Math.random() * 40, wob: .05}));
  }
  this.run();
};
ParticleField.prototype.step = function(){
  const ps = this.ps;
  for(let i = 0; i < ps.length; i++){
    const p = ps[i];
    p.ang += p.spin;
    /* the wobble is a sine on the drift rather than a second velocity, so a
       mote floats instead of jittering */
    p.x += p.vx + Math.sin(p.ang) * p.wob;
    p.y += p.vy + Math.cos(p.ang * .7) * p.wob * .6;
    p.vx *= .985; p.vy *= .985;
    p.life--;
    if(p.fade) p.op = Math.max(0, (p.life / p.maxLife) * p.op * 1.02);
  }
  this.ps = ps.filter(p => p.life > 0 && p.x > -30 && p.x < this.w + 30 && p.y > -30 && p.y < this.h + 30);
  if(this.mode === 'ambient') while(this.ps.length < this.want) this.seed();
};
ParticleField.prototype.draw = function(){
  const c = this.ctx;
  c.clearRect(0, 0, this.w, this.h);
  for(const p of this.ps){
    c.beginPath();
    c.arc(p.x, p.y, p.rad, 0, Math.PI * 2);
    c.fillStyle = p.col;
    c.globalAlpha = Math.max(0, Math.min(1, p.op));
    c.fill();
  }
  c.globalAlpha = 1;
};
ParticleField.prototype.run = function(){
  if(this.raf) return;
  const tick = () => {
    /* The surest sign that a ceremony is over is that its canvas is no
       longer in the document — the modal was closed, or routed away from,
       or swept. Checking that each frame means no close path can leave a
       loop running behind a page nobody is looking at. */
    if(!this.cv.isConnected){ this.stop(); return; }
    this.step(); this.draw();
    /* nothing left to draw and nothing asking for more: stop the loop
       rather than spin a blank canvas at sixty frames a second */
    if(!this.ps.length && this.mode !== 'ambient'){ this.raf = 0; return; }
    this.raf = requestAnimationFrame(tick);
  };
  this.raf = requestAnimationFrame(tick);
};
ParticleField.prototype.stop = function(){
  if(this.raf) cancelAnimationFrame(this.raf);
  this.raf = 0; this.ps = []; this.mode = 'idle';
  this.ctx.clearRect(0, 0, this.w, this.h);
};

/* The field for the ceremony currently on screen, or a stub that does
   nothing — so every call site can say `dvField().burst(x, y)` without
   asking first whether there is a canvas, whether the person wants
   particles, or whether they have asked for less motion. */
const DV_NOFIELD = {ambient(){}, burst(){}, shimmer(){}, stop(){}, resize(){}};
let _dvField = null;
function dvFieldStart(canvas){
  dvFieldStop();
  if(!canvas || !divPrefs().particles || (typeof reduced === 'function' && reduced())) return DV_NOFIELD;
  _dvField = new ParticleField(canvas);
  return _dvField;
}
const dvField = () => _dvField || DV_NOFIELD;
function dvFieldStop(){ if(_dvField){ _dvField.stop(); _dvField = null; } }

/* ============================================================
   THE SOUNDS

   Seven, each one an oscillator or a scrap of noise with an envelope on
   it. They are quiet by design: a third of full is the default and full
   is not loud. The context is built on the first sound of a ceremony,
   never at load, because a browser will not let it start before a person
   has touched something anyway — and because an app that opens an
   AudioContext for a page you are only reading is an app that is doing
   something behind your back.
   ============================================================ */
const CeremonySound = {
  ctx: null, master: null,
  /* motion and sound are different requests: someone who has asked for
     less movement has not asked for silence, so `reduced()` is not consulted
     here the way it is for the particles */
  on(){ return divPrefs().sound; },
  init(){
    if(this.ctx) { this.master.gain.value = divPrefs().volume; return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return false;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = divPrefs().volume;
      this.master.connect(this.ctx.destination);
    } catch(e){ this.ctx = null; return false; }
    return true;
  },
  ready(){
    if(!this.on()) return null;
    if(!this.init()) return null;
    /* a context made before the first gesture starts suspended */
    if(this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  },
  /* one voice: an oscillator, an envelope, done */
  tone(freq, {type = 'sine', at = 0, attack = .01, hold = .1, release = .3, peak = .12} = {}){
    const c = this.ready(); if(!c) return;
    const t = c.currentTime + at;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.setValueAtTime(peak, t + attack + hold);
    g.gain.exponentialRampToValueAtTime(.0001, t + attack + hold + release);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + attack + hold + release + .05);
  },
  /* a scrap of white noise through a filter: paper, or wind */
  noise(dur, {freq = 3000, q = 1, peak = .08, sweepTo = 0, at = 0} = {}){
    const c = this.ready(); if(!c) return;
    const t = c.currentTime + at;
    const n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for(let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    if(sweepTo) f.frequency.linearRampToValueAtTime(sweepTo, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + Math.min(.05, dur * .3));
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t); src.stop(t + dur + .02);
  },

  /* the moment to settle: a bowl struck once, and its fifth under it */
  bowl(){ this.tone(220, {attack: 1.8, hold: 1.6, release: 3, peak: .15});
          this.tone(330, {attack: 2, hold: 1.4, release: 3, peak: .045}); },
  /* the shuffle: paper on paper */
  slide(){ this.noise(.15, {freq: 3000, q: 1, peak: .08}); },
  /* choosing a card */
  chime(){ this.tone(800, {attack: .004, hold: .01, release: .2, peak: .09});
           this.tone(1600, {attack: .004, hold: .01, release: .18, peak: .018}); },
  /* the turn itself: weight */
  thrum(){ this.tone(110, {attack: .1, hold: .3, release: .4, peak: .13});
           this.tone(55,  {attack: .1, hold: .3, release: .45, peak: .05}); },
  /* the name resolving out of the noise */
  tinkle(){ [1800, 1650, 1480, 1320].forEach((f, i) =>
    this.tone(f, {at: i * .045, attack: .003, hold: .01, release: .1, peak: .045})); },
  /* all of them are up */
  chord(){ [261.6, 329.6, 392].forEach((f, i) =>
    this.tone(f, {attack: 1, hold: 1.6, release: 2, peak: i ? .05 : .07})); },
  /* and the wind that carries the reading in */
  wind(){ this.noise(1.5, {freq: 500, sweepTo: 2000, q: .7, peak: .05}); },

  /* --- the charms, which are objects rather than paper --- */
  /* shaken in cupped hands: short bursts rather than one long hiss */
  rattle(){ for(let i = 0; i < 7; i++)
    this.noise(.05, {freq: 1700 + Math.random() * 900, q: 2.2, peak: .05, at: i * .052}); },
  /* the throw */
  whoosh(){ this.noise(.3, {freq: 300, sweepTo: 3000, q: .8, peak: .06}); },
  /* one of them hitting the cloth — small, and slightly different each time,
     because thirty identical clicks is a machine, not a handful of objects */
  tink(){ this.tone(1050 + Math.random() * 500,
    {attack: .002, hold: .004, release: .055, peak: .035}); },
  /* the bowl again when everything has stopped moving, quieter */
  bowlQuiet(){ this.tone(220, {attack: .5, hold: .6, release: 1.4, peak: .05});
               this.tone(330, {attack: .55, hold: .5, release: 1.4, peak: .018}); },

  /* between readings: let the context go rather than hold the audio
     hardware open for a page nobody is listening to */
  close(){ if(this.ctx){ try { this.ctx.close(); } catch(e){} this.ctx = null; this.master = null; } },
};
/* one name for both halves, so a call site says what happened rather than
   which machine it wants */
function dvMoment(what, x, y){
  if(CeremonySound[what]) CeremonySound[what]();
  if(what === 'thrum' && x !== undefined) dvField().burst(x, y);
  if(what === 'wind') dvField().shimmer();
}
