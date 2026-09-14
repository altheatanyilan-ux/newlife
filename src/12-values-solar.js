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
      seed: [...id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 3600, 7) / 3600 * Math.PI * 2,
      tagline: v.tagline || (v.fields?.embody || []).slice(-1)[0]?.text || '',
    };
  });
  const maxR = Math.max(...raw.map(p => p.recency), 1);
  raw.forEach(p => { p.speed = 0.5 + (p.recency / maxR) * 5.5; });   /* degrees a second */
  return raw;
}

/* ---------- the canvas ---------- */
const SOLAR_YSQUASH = 0.6;        /* orbits are circles seen at an angle */

function ValuesSolar(canvas, planets, opts){
  this.cv = canvas; this.ctx = canvas.getContext('2d');
  this.planets = planets;
  this.opts = opts || {};
  this.hover = null; this.drag = null; this.raf = 0; this.t0 = performance.now();
  /* Still, for anyone who has asked for less motion and for anyone running
     plain. The orbits are how the data is laid out, not the point of it —
     a frozen system says everything a moving one says except the speeds, and
     the speeds are also written in the tooltip. */
  this.soft = (typeof reduced === 'function' && reduced())
    || (typeof plainMode === 'function' && plainMode());
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
  /* the innermost orbit has to clear the sun's corona, and the outermost has
     to leave room for a label under the planet */
  const minR = 84, maxR = Math.max(minR + 20, Math.min(w / 2 - 56, h / (2 * this.ysq) - 34));
  const n = this.planets.length;
  const step = n > 1 ? (maxR - minR) / (n - 1) : 0;
  this.planets.forEach((p, i) => { p.orbit = minR + i * step; });
};
ValuesSolar.prototype.pos = function(p, ang){
  return {x: this.cx + p.orbit * Math.cos(ang), y: this.cy + p.orbit * Math.sin(ang) * this.ysq};
};
ValuesSolar.prototype.angleAt = function(p, ms){
  /* a planet under the pointer stops, so it can be read */
  if(p === this.hover || p === this.drag) return p.ang != null ? p.ang : p.seed;
  return p.seed + (ms / 1000) * p.speed * Math.PI / 180;
};
ValuesSolar.prototype.ink = function(){
  return document.documentElement.dataset.theme === 'light'
    ? {label: '#2c2520', path: .3, trail: .55, corona: .3, light: true}
    : {label: '#e8e0d4', path: .42, trail: 1, corona: .6, light: false};
};

ValuesSolar.prototype.frame = function(now){
  const c = this.ctx, ms = now - this.t0, ink = this.ink();
  c.clearRect(0, 0, this.w, this.h);
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
    if(p === this.drag){ this.planet(p, this.drag.x, this.drag.y, 1.25, 1); return; }
    const {x, y} = this.pos(p, p.ang);
    this.trail(p, p.ang, dim, ink);
    this.planet(p, x, y, p === this.hover ? 1.4 : 1, dim);
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
ValuesSolar.prototype.planet = function(p, x, y, scale, dim){
  const c = this.ctx, r = p.radius * scale;
  const aura = p.aura * (p === this.hover ? 1.5 : 1) * dim;
  if(aura > .02){
    const g = c.createRadialGradient(x, y, r, x, y, r * 2.6);
    g.addColorStop(0, `hsla(${p.hue},${p.saturation | 0}%,62%,${aura.toFixed(3)})`);
    g.addColorStop(1, `hsla(${p.hue},${p.saturation | 0}%,62%,0)`);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 2.6, 0, Math.PI * 2); c.fill();
  }
  const g = c.createRadialGradient(x - r * .32, y - r * .32, 0, x, y, r);
  g.addColorStop(0, `hsla(${p.hue},${p.saturation | 0}%,72%,${dim})`);
  g.addColorStop(1, `hsla(${p.hue},${p.saturation | 0}%,38%,${dim})`);
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
};
ValuesSolar.prototype.sun = function(ms, ink){
  const c = this.ctx, cx = this.cx, cy = this.cy;
  const pulse = this.soft ? 52 : 52 + Math.sin(ms / 1000 * 1.26) * 5;
  const g = c.createRadialGradient(cx, cy, 20, cx, cy, pulse);
  g.addColorStop(0, `rgba(212,164,76,${ink.corona})`);
  g.addColorStop(.5, `rgba(212,164,76,${(ink.corona * .25).toFixed(3)})`);
  g.addColorStop(1, 'rgba(212,164,76,0)');
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, pulse, 0, Math.PI * 2); c.fill();
  const core = c.createRadialGradient(cx - 5, cy - 5, 0, cx, cy, 24);
  core.addColorStop(0, ink.light ? '#f6e3bd' : '#f5deb3');
  core.addColorStop(.6, ink.light ? '#c49552' : '#d4a44c');
  core.addColorStop(1, ink.light ? '#8a6d4a' : '#b08968');
  c.fillStyle = core; c.beginPath(); c.arc(cx, cy, 24, 0, Math.PI * 2); c.fill();
  /* it is worth saying out loud whose system this is */
  if(this.opts.labels !== false){
    c.save();
    c.fillStyle = ink.label; c.globalAlpha = .5;
    c.font = '10px ' + (getComputedStyle(document.body).fontFamily || 'sans-serif');
    c.textAlign = 'center'; c.letterSpacing && (c.letterSpacing = '1.5px');
    c.fillText('you', cx, cy + 44);
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
    height: innerWidth < 760 ? 320 : 500,
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
