/* ============================================================
   THE VALUES SOLAR SYSTEM

   A ranked list tells you the order you put your values in. It does not tell
   you which of them you have actually been tending, which are drifting, which
   have any weight of lived evidence behind them, or which you have named as
   important and then built nothing toward.

   So: you are the sun, and each value is a planet, and every property of that
   planet is a fact rather than a decoration.

     how far out       the priority you gave it
     how fast it goes  how recently there is evidence for it
     how bright        congruence, the last reading
     how big           how much evidence there is, of either kind
     how saturated     how much of that evidence is embodied and not betrayed
     its trail         which way the congruence is moving
     dashed orbit      nothing in the Vision Tree serves it — a blind spot

   The rule the whole thing is built on: if a property cannot be read back to
   something the person actually did, it does not go in.
   ============================================================ */

/* ---------- what the system is made of ---------- */

/* every entry tagged to this value, with which way it was tagged */
function valueEvidence(id){
  return (S.entries || []).filter(e => (e.links?.values || []).some(x => x.id === id))
    .map(e => ({e, pol: (e.links.values.find(x => x.id === id) || {}).pol || '+',
      day: (e.occurredAt || e.createdAt || '').slice(0, 10)}))
    .filter(x => x.day);
}
/* How recently it has been tended, as one number. An exponential decay with a
   thirty-day half-life rather than a count in a window: a value touched once
   yesterday and a value touched once two months ago are not the same, and a
   cutoff at thirty days would say they were. */
function valueRecency(id, ev){
  const T = today();
  return (ev || valueEvidence(id)).reduce((n, x) =>
    n + Math.exp(-Math.max(0, daysBetween(x.day, T)) / 30), 0);
}
/* Which way congruence is going: the last reading against the mean of the
   readings from the month before it. Two readings is enough to have a
   direction; one is not. */
function valueTrend(id, snaps){
  const s = (snaps || allSnapshotsWithRetro()).filter(x => x.ratings[id] != null);
  if(s.length < 2) return 0;
  const last = s[s.length - 1], cutoff = addDays(last.date, -30);
  const before = s.slice(0, -1).filter(x => x.date >= cutoff);
  const base = before.length ? avg(before.map(x => x.ratings[id])) : s[s.length - 2].ratings[id];
  const d = last.ratings[id] - base;
  return d > 4 ? 1 : d < -4 ? -1 : 0;
}
/* Is anything actually being built toward this? A vision that names the value,
   or an entry that links the two together, counts. Nothing does not. */
function valueServed(id){
  if((S.visions || []).some(v => (v.links?.values || []).some(x => x.id === id) ||
    (v.valueIds || []).includes(id))) return true;
  return (S.entries || []).some(e => (e.links?.values || []).some(x => x.id === id)
    && (e.links?.visions || []).length);
}
/* a value's hue, taken from the colour it already carries on the compass */
function valueHue(hex){
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if(!m) return 40;
  const r = parseInt(m[1], 16) / 255, g = parseInt(m[2], 16) / 255, b = parseInt(m[3], 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if(!d) return 40;
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = Math.round(h * 60); return h < 0 ? h + 360 : h;
}

/* One number per value, spread as far from its neighbours as it can be.
   FNV-1a with a finalising mix: a plain rolling multiply — which is what this
   used to be — puts ids that differ in one character next to each other, and
   ids here end in three characters of a timestamp, so a set of values made in
   one sitting came out bunched on the same arc of the system and wearing the
   same face. The avalanche step is the whole difference. */
function valueHash(id){
  let h = 2166136261 >>> 0;
  for(let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0;
  h = (h ^ (h >>> 15)) >>> 0;
  h = Math.imul(h, 2246822507) >>> 0;
  return (h ^ (h >>> 13)) >>> 0;              /* unsigned, or every mod goes negative */
}

/* everything the canvas needs, worked out once per render rather than per frame */
function valuePlanets(){
  const snaps = allSnapshotsWithRetro();
  const order = S.valueOrder.filter(id => byId(S.values, id));
  const raw = order.map((id, i) => {
    const v = byId(S.values, id);
    const ev = valueEvidence(id);
    const emb = ev.filter(x => x.pol === '+').length;
    const cong = valueCurrent(id);
    const last = ev.length ? ev.map(x => x.day).sort().slice(-1)[0] : null;
    return {
      id, name: v.name, colour: v.color, hue: valueHue(v.color),
      rank: i + 1,
      congruence: cong,
      evidence: ev.length, embodied: emb, betrayed: ev.length - emb,
      lastTended: last,
      recency: valueRecency(id, ev),
      trend: valueTrend(id, snaps),
      served: valueServed(id),
      /* evidence gives the planet its mass, capped so that one value with two
         hundred entries does not fill the system */
      radius: 12 + Math.min(ev.length, 50) * 0.48,
      /* no evidence either way is not the same as evidence that goes both
         ways: an untested value sits at neutral rather than at grey */
      saturation: ev.length ? 30 + (emb / ev.length) * 70 : 50,
      aura: .05 + (cong / 100) * .35,
      /* the same value starts at the same place on its orbit every time the
         page is drawn, rather than jumping to a new one on every render */
      hash: valueHash(id),
      seed: (valueHash(id) % 3600) / 3600 * Math.PI * 2,
      tagline: v.tagline || (v.fields?.embody || []).slice(-1)[0]?.text || '',
    };
  });
  /* How fast it goes. The old floor was half a degree a second — twelve
     minutes for one circuit — so a system with no evidence in it yet had every
     planet effectively nailed down, which is the state a new house is in and
     the worst possible first impression. The floor is now a circuit in about a
     minute; the ceiling, for the value you have tended most, is a quarter of
     that. Both are slow enough to read and fast enough to be obviously alive.

     The inner orbits are shorter, so a fixed angular speed makes the outer
     planets look becalmed next to them. Kepler's rule — the further out, the
     slower round — is both true of real systems and the thing that makes a
     drawing of one read as motion rather than as a spinning plate.

     Then what the planet is made of. Six surfaces, a ring or no ring, a storm
     or none, a moon or none: enough combinations that no two planets in a
     realistic house are the same object, and every one of them is drawn in the
     value's own hue at the value's own saturation, so the data still reads.
     All of it comes off one hash of the id, which means a value keeps its face
     for as long as it exists — you learn to find Craft by looking for the
     banded one, the way you find Jupiter. */
  const FACES = ['banded', 'cratered', 'marbled', 'swirled', 'capped', 'smooth'];
  const maxR = Math.max(...raw.map(p => p.recency), 1);
  raw.forEach((p, i) => {
    const tended = p.recency / maxR;                    /* 0 … 1 */
    const far = 1 / Math.sqrt(1 + i * .55);             /* the outer ones, slower */
    p.speed = (6 + tended * 22) * far;                  /* degrees a second */
    const hash = p.hash;
    p.face   = FACES[hash % FACES.length];
    p.ringed = (hash >>> 4) % 3 === 0;
    p.storm  = (p.face === 'banded' || p.face === 'swirled') && (hash >>> 9) % 2 === 0;
    p.tilt   = (((hash >>> 2) % 31) - 15) * Math.PI / 180;
    p.moon = p.evidence >= 6 ? {r: Math.max(2.4, p.radius * .22), d: p.radius * 2.1 + 6,
      w: .9 + (i % 3) * .35, ph: p.seed * 1.7} : null;
  });
  return raw;
}

/* ---------- the canvas ---------- */
/* Orbits are circles seen at an angle. Flatter than it used to be: the night
   is an ellipse inscribed in the canvas, and a steeply squashed system needs a
   very tall canvas before there is any room left above and below it for the
   darkness to fade in. A shallower angle reads more like an orbital plane
   anyway. */
const SOLAR_YSQUASH = 0.46;
/* The fraction of the night that is solid. Everything from here out to the
   edge is the fade, so this is the single number that decides how gradual it
   looks — and resize() keeps every planet and every label inside it, which is
   what stops a lit thing from ever being drawn on half-lit ground. */
const SOLAR_NIGHT_CORE = 0.60;

function ValuesSolar(canvas, planets, opts){
  this.cv = canvas; this.ctx = canvas.getContext('2d');
  this.planets = planets;
  this.opts = opts || {};
  this.hover = null; this.drag = null; this.raf = 0; this.t0 = performance.now();
  /* Still, for anyone who has asked their system for less motion. The orbits
     are how the data is laid out, not the point of it — a frozen system says
     everything a moving one says except the speeds, and the speeds are also
     written in the tooltip. */
  this.soft = (typeof reduced === 'function' && reduced());
  this.resize();
  this.bind();
  this.start();
}
ValuesSolar.prototype.resize = function(){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = this.cv.parentElement.clientWidth || 640;
  const h = this.opts.height || 500;
  this.w = w; this.h = h; this.dpr = dpr;
  this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr);
  this.cv.style.width = w + 'px'; this.cv.style.height = h + 'px';
  this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  this.cx = w / 2; this.cy = h / 2;
  this.ysq = w < 700 ? .4 : SOLAR_YSQUASH;
  /* The innermost orbit has to clear the sun, which is drawn to clear the
     largest planet, so both of those go into the floor; the outermost has to
     leave room for a label under the planet. Everything about the sun's size
     lives in sunCore so the two cannot drift apart.

     And the whole system has to sit inside the solid part of the night. The
     orbits used to fill the canvas to its edges, which was fine while the
     ground was the page; now the ground is drawn, and a planet out in the
     gradient is a bright thing on half-lit ground with an unreadable label
     under it. So the outermost orbit, plus its planet, plus the label beneath
     it, all fit within SOLAR_NIGHT_CORE of the canvas — the same constant the
     gradient is built from, so the two cannot be tuned apart. */
  const big = this.planets.reduce((n, p) => Math.max(n, p.radius), 0);
  const minR = Math.max(84, this.sunCore() + big + 20);
  const LABEL = 20;
  const core = SOLAR_NIGHT_CORE * Math.min(w / 2, (h / 2) / this.ysq);
  const maxR = Math.max(minR + 20, Math.min(w / 2 - 56 - big, core - big - LABEL));
  const n = this.planets.length;
  const step = n > 1 ? (maxR - minR) / (n - 1) : 0;
  this.planets.forEach((p, i) => { p.orbit = minR + i * step; });
};
ValuesSolar.prototype.sunCore = function(){
  return Math.max(26, this.planets.reduce((n, p) => Math.max(n, p.radius), 0) * 1.3);
};
ValuesSolar.prototype.pos = function(p, ang){
  return {x: this.cx + p.orbit * Math.cos(ang), y: this.cy + p.orbit * Math.sin(ang) * this.ysq};
};
ValuesSolar.prototype.angleAt = function(p, ms){
  let a = p.seed + (p.off || 0) + (ms / 1000) * p.speed * Math.PI / 180;
  /* a planet under the pointer stops, so it can be read */
  if(p === this.hover || p === this.drag){ if(p.held == null) p.held = a; return p.held; }
  /* and starts again from where it stopped rather than from where it would
     have got to. Carrying the lost arc in an offset is the whole fix: without
     it every planet the pointer crosses snaps forward when the pointer
     leaves, which is the one thing in the picture that reads as broken. */
  if(p.held != null){ p.off = (p.off || 0) + (p.held - a); a = p.held; p.held = null; }
  return a;
};
/* ---------- the system is always at night ----------
   A solar system drawn on white paper is a diagram. The whole point of this
   one is that it is a sky you are looking up into, and a sky has to be dark
   before a small pale planet means anything: the aura, the corona, the comet
   tail and the rim light are all light against dark, and every one of them
   disappears on a cream ground. So the canvas keeps the night palette whether
   or not the rest of the house is in it.

   The night is drawn rather than set as a background, because a rectangle of
   black dropped into a daylit page is a hole in the page. See night(). */
ValuesSolar.prototype.ink = function(){
  return {label: '#e8e0d4', path: .42, trail: 1, corona: .6, light: false};
};

/* ---------- what colour the night is ----------
   Always dark is not the same as always black, and on a light page the
   difference is the whole thing. A near-black disc on a cream ground is a
   hole punched in the page however softly it fades; the dark is not wrong,
   the pitch is.

   So the ground under the planets is a dusk rather than an absence, and it is
   built the way the sky over the house is built: two colours, warm close in
   and cool further out, so it reads as air with a light in it rather than as
   a flat wash. It has to stay dark enough for a pale planet and a cream label
   to hold against it — that was the original reason for the night and it has
   not gone away — but dark enough and pitch are different things.

   In dark mode it stays as deep as it ever was. Somebody who has put the
   whole house in the dark is not asking for a dusk. */
const SOLAR_DUSK = {core: [98, 79, 92], edge: [56, 66, 100], a: .84};
const SOLAR_NIGHT = {core: [24, 20, 18], edge: [18, 16, 14], a: .95};
ValuesSolar.prototype.sky = function(){
  return document.documentElement.dataset.theme === 'light' ? SOLAR_DUSK : SOLAR_NIGHT;
};

/* An eclipse rather than a box: one ellipse of darkness centred on the sun,
   opaque across the middle so a pale planet reads against it, and gone by the
   time it reaches an edge.

   The ellipse is inscribed in the canvas rather than fitted around the
   planets. That guarantees it reaches exactly zero exactly at the edge — no
   clamp, no clipped side, the corners always the page showing through — and,
   more usefully, it means the LENGTH of the fade is decided here rather than
   by how big the system happens to be that day. The layout's only job is then
   to keep every planet inside SOLAR_NIGHT_CORE; everything beyond that is
   fade, and there is a great deal of it. */
ValuesSolar.prototype.night = function(){
  const c = this.ctx;
  const rx = this.w / 2, ry = this.h / 2;
  if(rx <= 0 || ry <= 0) return;
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  /* A smoothstep sampled at twenty points, not a handful of straight segments.
     Linear interpolation between five stops leaves a kink at every one of
     them, and a kink in a gradient this large is precisely what the eye reads
     as artificial — it sees the edge of a shape where there is meant to be
     none. This is flat where it meets the core, flat again where it meets
     nothing, and has no straight run anywhere in between. */
  const sky = this.sky();
  const A = sky.a, t0 = SOLAR_NIGHT_CORE, N = 20;
  for(let i = 0; i <= N; i++){
    const t = i / N;
    const u = t <= t0 ? 0 : Math.min(1, (t - t0) / (1 - t0));
    const smooth = u * u * (3 - 2 * u);
    /* the colour walks the whole radius while the alpha only starts moving at
       the core, so the warm-to-cool turn happens across the lit part rather
       than out in the fade where nobody could see it */
    const mix = (a, b) => Math.round(a + (b - a) * t);
    const r = mix(sky.core[0], sky.edge[0]);
    const gr = mix(sky.core[1], sky.edge[1]);
    const bl = mix(sky.core[2], sky.edge[2]);
    g.addColorStop(t, `rgba(${r},${gr},${bl},${(A * (1 - smooth)).toFixed(4)})`);
  }
  c.save();
  c.translate(this.cx, this.cy);
  c.scale(1, ry / rx);
  c.fillStyle = g;
  c.beginPath(); c.arc(0, 0, rx, 0, Math.PI * 2); c.fill();
  c.restore();
};

ValuesSolar.prototype.frame = function(now){
  const c = this.ctx, ms = now - this.t0, ink = this.ink();
  c.clearRect(0, 0, this.w, this.h);
  this.night();
  const ps = this.planets;
  ps.forEach(p => { if(p !== this.drag) p.ang = this.angleAt(p, ms); });

  /* the paths first, under everything */
  ps.forEach(p => {
    if(p === this.drag) return;
    c.save();
    c.strokeStyle = `hsla(${p.hue},${p.saturation | 0}%,58%,${(p === this.hover ? .85 : ink.path) * (this.hover && p !== this.hover ? .45 : 1)})`;
    c.lineWidth = p === this.hover ? 1.8 : 1;
    /* a value nothing is being built toward is drawn as a broken line — the
       blind spot is meant to be visible without reading anything */
    if(!p.served) c.setLineDash([4, 8]);
    c.beginPath();
    c.ellipse(this.cx, this.cy, p.orbit, p.orbit * this.ysq, 0, 0, Math.PI * 2);
    c.stroke(); c.restore();
  });

  /* back to front, so a planet at the far side of its orbit passes behind */
  const order = [...ps].sort((a, b) => Math.sin(a.ang) - Math.sin(b.ang));
  order.forEach(p => {
    const dim = this.hover && p !== this.hover ? .4 : 1;
    if(p === this.drag){ this.planet(p, this.drag.x, this.drag.y, 1.25, 1, now); return; }
    const {x, y} = this.pos(p, p.ang);
    this.trail(p, p.ang, dim, ink);
    this.planet(p, x, y, p === this.hover ? 1.4 : 1, dim, now);
    if(this.opts.labels !== false){
      c.save();
      c.fillStyle = ink.label; c.globalAlpha = .72 * dim;
      c.font = '11px ' + (getComputedStyle(document.body).fontFamily || 'sans-serif');
      c.textAlign = 'center';
      c.fillText(p.name, x, y + p.radius * (p === this.hover ? 1.4 : 1) + 14);
      c.restore();
    }
  });
  this.sun(ms, ink);
  if(this.drag) this.ghosts(ink);
};
/* the comet tail: where it has just been, and — through its length — which
   way its congruence is going */
ValuesSolar.prototype.trail = function(p, ang, dim, ink){
  const c = this.ctx, arc = p.trend > 0 ? .52 : p.trend < 0 ? .17 : .35, n = 18;
  for(let i = 1; i < n; i++){
    const t = i / n, a = ang - arc * t, {x, y} = this.pos(p, a);
    c.beginPath();
    c.arc(x, y, p.radius * (1 - t * .55), 0, Math.PI * 2);
    c.fillStyle = `hsla(${p.hue},${p.saturation | 0}%,60%,${((1 - t) * .16 * (p.aura + .2) * dim * ink.trail).toFixed(4)})`;
    c.fill();
  }
};
/* A ball with a highlight on it is a ball. These are planets. Six surfaces —
   banded, cratered, veined, swirled, ice-capped, and the plain sphere the
   others are variations on — crossed with a ring or no ring and a storm or
   none, all of it taken from the id so a value keeps its face for as long as
   it exists.

   The order matters and is the order light arrives in: the aura, the far half
   of the ring, the body, the surface clipped to the body, the storm, the
   terminator falling across all of it, the rim light on the lit limb, then the
   near half of the ring and the moon. The rim light is the cheapest line here
   and does the most work — a lit edge is what separates a sphere from a disc.

   All of it is drawn in the planet's own colour at its own saturation, so the
   data still reads: a value with no evidence is still pale, a betrayed one is
   still grey, and the ornament does not lie about either. */
ValuesSolar.prototype.planet = function(p, x, y, scale, dim, now){
  const c = this.ctx, r = p.radius * scale;
  const sat = p.saturation | 0, h = p.hue;
  const aura = p.aura * (p === this.hover ? 1.5 : 1) * dim;
  if(aura > .02){
    const g = c.createRadialGradient(x, y, r, x, y, r * 2.6);
    g.addColorStop(0, `hsla(${h},${sat}%,62%,${aura.toFixed(3)})`);
    g.addColorStop(1, `hsla(${h},${sat}%,62%,0)`);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 2.6, 0, Math.PI * 2); c.fill();
  }
  /* the far half of the ring passes behind the planet */
  if(p.ringed) this.ring(p, x, y, r, dim, true);

  const g = c.createRadialGradient(x - r * .34, y - r * .34, 0, x, y, r);
  g.addColorStop(0, `hsla(${h},${sat}%,74%,${dim})`);
  g.addColorStop(.55, `hsla(${h},${sat}%,56%,${dim})`);
  g.addColorStop(1, `hsla(${h},${sat}%,34%,${dim})`);
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();

  /* the surface, clipped to the sphere */
  if(r > 6){
    c.save();
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.clip();
    c.translate(x, y); c.rotate(p.tilt);
    if(p.face === 'banded'){
      for(let i = -2; i <= 2; i++){
        const yy = i * r * .34, hh = r * (i % 2 ? .13 : .2);
        c.fillStyle = `hsla(${h},${sat}%,${i % 2 ? 66 : 44}%,${(.32 * dim).toFixed(3)})`;
        c.beginPath(); c.ellipse(0, yy, r, hh, 0, 0, Math.PI * 2); c.fill();
      }
    } else if(p.face === 'cratered'){
      for(let i = 0; i < 5; i++){
        const a = p.seed * (i + 2), d = r * (.18 + (i % 3) * .26);
        const cr = r * (.11 + (i % 2) * .09);
        c.fillStyle = `hsla(${h},${sat}%,38%,${(.4 * dim).toFixed(3)})`;
        c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a * 1.7) * d * .8, cr, 0, Math.PI * 2); c.fill();
        c.fillStyle = `hsla(${h},${sat}%,72%,${(.22 * dim).toFixed(3)})`;
        c.beginPath(); c.arc(Math.cos(a) * d - cr * .25, Math.sin(a * 1.7) * d * .8 - cr * .25, cr * .7, 0, Math.PI * 2); c.fill();
      }
    } else if(p.face === 'marbled'){
      c.strokeStyle = `hsla(${h},${sat}%,72%,${(.3 * dim).toFixed(3)})`;
      c.lineWidth = Math.max(1, r * .1);
      for(let i = 0; i < 3; i++){
        const o = (i - 1) * r * .5;
        c.beginPath();
        c.moveTo(-r, o - r * .3);
        c.bezierCurveTo(-r * .3, o + r * .4, r * .3, o - r * .5, r, o + r * .2);
        c.stroke();
      }
    } else if(p.face === 'swirled'){
      /* a gas giant's turbulence: shallow arcs that do not line up, so the
         eye reads weather rather than stripes */
      c.lineWidth = Math.max(1, r * .16);
      c.lineCap = 'round';
      for(let i = 0; i < 5; i++){
        const o = (i - 2) * r * .38, bend = ((i % 2) ? 1 : -1) * r * .3;
        c.strokeStyle = `hsla(${h},${sat}%,${i % 2 ? 70 : 42}%,${(.3 * dim).toFixed(3)})`;
        c.beginPath();
        c.moveTo(-r * 1.1, o);
        c.bezierCurveTo(-r * .35, o + bend, r * .35, o - bend, r * 1.1, o + bend * .3);
        c.stroke();
      }
    } else if(p.face === 'capped'){
      /* ice at both poles and a darker belt between them */
      c.fillStyle = `hsla(${h},${Math.max(6, sat - 30)}%,88%,${(.5 * dim).toFixed(3)})`;
      c.beginPath(); c.ellipse(0, -r * .82, r * .78, r * .34, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(0,  r * .86, r * .66, r * .3,  0, 0, Math.PI * 2); c.fill();
      c.fillStyle = `hsla(${h},${sat}%,40%,${(.24 * dim).toFixed(3)})`;
      c.beginPath(); c.ellipse(0, r * .06, r, r * .24, 0, 0, Math.PI * 2); c.fill();
    }
    /* the one eye in the weather */
    if(p.storm){
      const sx = -r * .3, sy = r * .28;
      c.fillStyle = `hsla(${(h + 22) % 360},${Math.min(96, sat + 22)}%,58%,${(.5 * dim).toFixed(3)})`;
      c.beginPath(); c.ellipse(sx, sy, r * .34, r * .2, .3, 0, Math.PI * 2); c.fill();
      c.strokeStyle = `hsla(${(h + 22) % 360},${Math.min(96, sat + 22)}%,80%,${(.34 * dim).toFixed(3)})`;
      c.lineWidth = Math.max(.8, r * .05);
      c.beginPath(); c.ellipse(sx, sy, r * .34, r * .2, .3, 0, Math.PI * 2); c.stroke();
    }
    /* everything gets a terminator: the far side falls into shadow */
    const sh = c.createLinearGradient(-r, -r, r, r);
    sh.addColorStop(0, 'rgba(0,0,0,0)');
    sh.addColorStop(.55, 'rgba(0,0,0,0)');
    sh.addColorStop(1, `rgba(0,0,0,${(.34 * dim).toFixed(3)})`);
    c.fillStyle = sh; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.restore();
    /* the lit limb: one thin bright arc on the side the sun is on. This is the
       line that makes the whole thing read as lit rather than coloured. */
    c.save();
    c.strokeStyle = `hsla(${h},${Math.max(8, sat - 16)}%,92%,${(.42 * dim).toFixed(3)})`;
    c.lineWidth = Math.max(.7, r * .09);
    c.beginPath(); c.arc(x, y, r * .94, Math.PI * 1.02, Math.PI * 1.72); c.stroke();
    c.restore();
  }
  if(p.ringed) this.ring(p, x, y, r, dim, false);
  /* a value with a good deal of evidence behind it has something of its own
     going round it */
  if(p.moon && now != null && r > 7){
    const a = (now / 1000) * p.moon.w + p.moon.ph;
    const mx = x + Math.cos(a) * p.moon.d, my = y + Math.sin(a) * p.moon.d * .42;
    c.fillStyle = `hsla(${h},${Math.max(10, sat - 24)}%,${Math.sin(a) > 0 ? 74 : 52}%,${(.85 * dim).toFixed(2)})`;
    c.beginPath(); c.arc(mx, my, p.moon.r, 0, Math.PI * 2); c.fill();
  }
};
/* the ring, in two halves so the planet sits inside it */
ValuesSolar.prototype.ring = function(p, x, y, r, dim, behind){
  const c = this.ctx;
  c.save();
  c.translate(x, y); c.rotate(p.tilt - .34);
  c.beginPath();
  c.ellipse(0, 0, r * 1.95, r * .52, 0, behind ? Math.PI : 0, behind ? Math.PI * 2 : Math.PI);
  c.strokeStyle = `hsla(${p.hue},${p.saturation | 0}%,${behind ? 52 : 70}%,${((behind ? .3 : .5) * dim).toFixed(3)})`;
  c.lineWidth = Math.max(1.4, r * .2);
  c.stroke();
  c.restore();
};
/* The sun has to be the biggest thing in the picture. A value with fifty
   pieces of evidence behind it draws at thirty-six pixels, and a sun of
   twenty-four next to it reads as a small planet in the middle rather than as
   the thing everything else goes round — which would be exactly backwards
   about whose system it is. So the core clears the largest planet, and the
   corona clears the core. */
ValuesSolar.prototype.sun = function(ms, ink){
  const c = this.ctx, cx = this.cx, cy = this.cy;
  const core = this.sunCore();
  const pulse = (core * 2.3) + (this.soft ? 0 : Math.sin(ms / 1000 * 1.26) * 5);
  const g = c.createRadialGradient(cx, cy, core * .8, cx, cy, pulse);
  g.addColorStop(0, `rgba(212,164,76,${ink.corona})`);
  g.addColorStop(.5, `rgba(212,164,76,${(ink.corona * .25).toFixed(3)})`);
  g.addColorStop(1, 'rgba(212,164,76,0)');
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, pulse, 0, Math.PI * 2); c.fill();
  const face = c.createRadialGradient(cx - core * .2, cy - core * .2, 0, cx, cy, core);
  face.addColorStop(0, ink.light ? '#fdf3df' : '#fbeccb');
  face.addColorStop(.55, ink.light ? '#d8ab63' : '#e2b45a');
  face.addColorStop(1, ink.light ? '#8a6d4a' : '#b08968');
  c.fillStyle = face; c.beginPath(); c.arc(cx, cy, core, 0, Math.PI * 2); c.fill();
  /* it is worth saying out loud whose system this is */
  if(this.opts.labels !== false){
    c.save();
    c.fillStyle = ink.label; c.globalAlpha = .72;
    c.font = '10px ' + (getComputedStyle(document.body).fontFamily || 'sans-serif');
    c.textAlign = 'center'; c.letterSpacing && (c.letterSpacing = '1.5px');
    c.fillText('you', cx, cy + core + 26);
    c.restore();
  }
};
/* while a planet is being dragged, every rank it could land in is shown */
ValuesSolar.prototype.ghosts = function(ink){
  const c = this.ctx;
  this.planets.forEach((p, i) => {
    c.save();
    c.strokeStyle = `rgba(212,164,76,${p === this.dragOver ? .5 : .16})`;
    c.lineWidth = p === this.dragOver ? 1.4 : .6;
    c.setLineDash([2, 6]);
    c.beginPath(); c.ellipse(this.cx, this.cy, p.orbit, p.orbit * this.ysq, 0, 0, Math.PI * 2);
    c.stroke(); c.restore();
    c.save(); c.fillStyle = ink.label; c.globalAlpha = .5; c.font = '10px monospace';
    c.textAlign = 'center'; c.fillText('#' + (i + 1), this.cx, this.cy - p.orbit * this.ysq - 5);
    c.restore();
  });
};

/* ---------- what the pointer does ---------- */
ValuesSolar.prototype.at = function(mx, my){
  /* nearest planet within its own radius plus a margin, front ones first */
  let best = null, bestD = Infinity;
  for(const p of this.planets){
    const {x, y} = this.pos(p, p.ang == null ? p.seed : p.ang);
    const d = Math.hypot(mx - x, my - y);
    if(d < p.radius + 18 && d < bestD){ best = p; bestD = d; }
  }
  return best;
};
ValuesSolar.prototype.bind = function(){
  const cv = this.cv;
  const local = e => { const r = cv.getBoundingClientRect(); return {x: e.clientX - r.left, y: e.clientY - r.top}; };
  this.onMove = e => {
    const {x, y} = local(e);
    if(this.drag){ this.drag.x = x; this.drag.y = y;
      /* the rank it would land in is the orbit whose radius is nearest */
      const d = Math.hypot(x - this.cx, (y - this.cy) / this.ysq);
      this.dragOver = this.planets.reduce((a, b) => Math.abs(b.orbit - d) < Math.abs(a.orbit - d) ? b : a);
      if(this.soft) this.frame(performance.now());
      return; }
    const p = this.at(x, y);
    if(p !== this.hover){ this.hover = p; this.opts.onHover && this.opts.onHover(p, x, y); }
    else if(p && this.opts.onHover) this.opts.onHover(p, x, y);
    cv.style.cursor = p ? 'pointer' : 'default';
    if(this.soft) this.frame(performance.now());
  };
  this.onDown = e => {
    const {x, y} = local(e);
    const p = this.at(x, y); if(!p) return;
    this.pressed = p; this.pressAt = {x, y};
    /* a hold detaches the planet; a click opens it. Three hundred
       milliseconds is the difference. */
    this.holdT = setTimeout(() => {
      if(!this.pressed) return;
      this.drag = this.pressed; this.drag.x = x; this.drag.y = y;
      cv.style.cursor = 'grabbing';
      this.opts.onHover && this.opts.onHover(null);
      if(this.soft) this.frame(performance.now());
    }, 300);
    cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
  };
  this.onUp = e => {
    clearTimeout(this.holdT);
    const was = this.drag, pressed = this.pressed;
    this.pressed = null;
    if(was){
      this.drag = null; cv.style.cursor = 'default';
      const to = this.dragOver; this.dragOver = null;
      if(to && to !== was && this.opts.onRank) this.opts.onRank(was.id, this.planets.indexOf(to));
      else this.resize();
      return;
    }
    if(pressed && this.opts.onOpen){
      const {x, y} = local(e);
      if(Math.hypot(x - this.pressAt.x, y - this.pressAt.y) < 8) this.opts.onOpen(pressed);
    }
  };
  this.onLeave = () => { if(this.drag) return; this.hover = null; this.opts.onHover && this.opts.onHover(null); };
  cv.addEventListener('pointermove', this.onMove);
  cv.addEventListener('pointerdown', this.onDown);
  cv.addEventListener('pointerup', this.onUp);
  cv.addEventListener('pointerleave', this.onLeave);
  this.onResize = debounce(() => { this.resize(); if(this.soft) this.frame(performance.now()); }, 200);
  window.addEventListener('resize', this.onResize);
};
ValuesSolar.prototype.start = function(){
  /* One frame and stop, for anyone who has asked for less motion: the system
     is a picture of the data either way, and the orbits are not the point. */
  if(this.soft){ this.planets.forEach(p => { p.ang = p.seed; }); this.frame(performance.now()); return; }
  /* This is what the room is drawing, so it is a foreground layer: while it
     runs, the dust and the wind stand down. The hidden tab, the scrolled-off
     canvas and the frame budget are the loop's business. */
  Animator.register('solar', now => {
    if(!this.cv.isConnected){ this.stop(); return; }
    this.frame(now);
  }, {priority: Animator.PAGE});
  Animator.watch('solar', this.cv);
  Animator.activate('solar');
  this.raf = 'animator';
};
ValuesSolar.prototype.stop = function(){
  Animator.forget('solar'); this.raf = 0;
  window.removeEventListener('resize', this.onResize);
};


/* ---------- the page furniture round it ---------- */
function solarHTML(){
  return `<section class="section rv solar-wrap">
    <div class="row between"><span class="sc" style="margin:0">The system</span>
      <span class="mono">hold a planet to re-rank it · click to open it</span></div>
    <p class="muted" style="font-size:.85rem;margin:2px 0 8px">You are the sun. Every property of a
      planet is something you did, not something chosen to look well.</p>
    <dl class="solar-key">
      <div><dt>how far out</dt><dd>the priority you gave it</dd></div>
      <div><dt>how fast</dt><dd>how recently there is evidence</dd></div>
      <div><dt>how bright</dt><dd>the last congruence reading</dd></div>
      <div><dt>how big</dt><dd>how much evidence there is at all</dd></div>
      <div><dt>how saturated</dt><dd>how much of it was embodied, not betrayed</dd></div>
      <div><dt>the tail</dt><dd>which way congruence is moving</dd></div>
      <div><dt>a broken orbit</dt><dd>nothing in the Vision Tree serves it</dd></div>
    </dl>
    <div class="solar" id="solarBox"><canvas id="solarCv"></canvas>
      <div class="solar-tip" id="solarTip" hidden></div></div>
  </section>`;
}
/* the card that follows the pointer: everything the planet is, in words */
function solarTipHTML(p){
  const arrow = p.trend > 0 ? '↑ rising' : p.trend < 0 ? '↓ slipping' : '→ steady';
  const tended = p.lastTended ? relDays(daysSince(p.lastTended)) : 'never';
  return `<b style="color:${p.colour}">${esc(p.name)}</b>
    <div class="mono">priority #${p.rank} of ${S.valueOrder.length}</div>
    <div class="st-row"><span>congruence</span><b>${p.congruence}% <span class="mono">${arrow}</span></b></div>
    <div class="st-row"><span>evidence</span><b>${p.evidence} <span class="mono">${p.embodied}+ · ${p.betrayed}−</span></b></div>
    <div class="st-row"><span>last tended</span><b>${esc(tended)}</b></div>
    ${p.tagline ? `<p class="st-line">${esc(p.tagline.slice(0, 120))}${p.tagline.length > 120 ? '…' : ''}</p>` : ''}
    ${p.served ? '' : '<p class="st-warn">Nothing is being built toward this one.</p>'}`;
}
/* built, wired and left running until the page is drawn again */
let _solar = null;
function mountSolar(root){
  const cv = (root || document).querySelector('#solarCv'); if(!cv) return;
  const box = cv.parentElement, tip = box.querySelector('#solarTip');
  if(_solar) _solar.stop();
  const planets = valuePlanets(); if(!planets.length) return;
  _solar = new ValuesSolar(cv, planets, {
    height: innerWidth < 760 ? 360 : 560,
    labels: innerWidth >= 560,
    onHover(p, x, y){
      if(!p){ tip.hidden = true; return; }
      tip.innerHTML = solarTipHTML(p);
      tip.hidden = false;
      tip.style.borderColor = `color-mix(in srgb,${p.colour} 45%,transparent)`;
      /* kept inside the box, and on whichever side of the planet has room */
      const w = tip.offsetWidth, h = tip.offsetHeight;
      tip.style.left = Math.max(6, Math.min(box.clientWidth - w - 6, x + 18)) + 'px';
      tip.style.top  = Math.max(6, Math.min(box.clientHeight - h - 6, y - h / 2)) + 'px';
    },
    onOpen(p){ navigate('#/value/' + p.id); },
    onRank(id, to){
      const o = S.valueOrder.filter(x => x !== id);
      o.splice(to, 0, id);
      S.valueOrderHistory.push({date: today(), order: [...S.valueOrder]});
      S.valueOrder = o; saveNow(); rerender();
      toast('Priorities re-ranked. The previous order is kept.');
    },
  });
}
