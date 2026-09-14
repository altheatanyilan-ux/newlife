/* ============================================================
   THE CONSTELLATION

   The People page was a directory: rings drawn at fixed radii, faces placed
   round them at even angles, nothing moving. It was accurate and it was inert,
   and a page about the people you love should not be the coldest room in the
   house.

   So the rings become a physics simulation. You are at the centre; everyone
   else is a node on a thread; and every property of a node is read off what
   you have actually done rather than chosen to look well:

     how far out      which ring you put them in
     how big          how much of your writing they are in
     how bright       how recently you saw them
     how warm         whether time with them leaves you fuller or emptier
     the thread       the same recency, and it frays when it goes cold
     a dashed ring    somebody you have not met yet

   The forces are the four that matter, reimplemented rather than imported: a
   spring holding each node at its ring's distance, a repulsion keeping faces
   off each other, a slow drift so the whole thing breathes, and damping so it
   settles instead of oscillating. Nothing here is random from render to
   render — a person starts at the same angle every time, seeded from their
   id, so the sky you learn is the sky you come back to.
   ============================================================ */

/* ---------- what a person is, as a node ---------- */

/* Distances are fractions of the outermost ring, so the same sky fits a
   phone and a wide window without a second set of numbers. */
const SKY_RINGS = {core: .22, close: .43, warm: .63, orbit: .82, aspirational: 1};

/* How recently you saw them, as one number between nothing and one. The
   thresholds are the doc's: three days is bright, a fortnight is fading, two
   months is nearly out. */
function skyGlow(days){
  if(days == null || !isFinite(days)) return .02;
  if(days < 3) return .25;
  if(days < 7) return .18;
  if(days < 14) return .12;
  if(days < 30) return .08;
  if(days < 60) return .04;
  return .02;
}
/* the same angle every time, from the id rather than from Math.random */
function skySeed(id){
  return [...String(id)].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 3600, 7) / 3600 * Math.PI * 2;
}
function skyNodes(){
  return (S.people || []).filter(p => p && p.id && p.name).map(p => {
    const ints = personInteractions(p.id);
    const last = p.lastInteraction || (ints.length ? ints[0].date : null);
    const days = last ? daysSince(last) : null;
    const bal = energyBalanceScore(p.id, 180);            /* −1 … +1, or null */
    const written = typeof personEntryCount === 'function' ? personEntryCount(p.id) : 0;
    const hue = bal == null ? 32 : bal > .34 ? 40 : bal > -.34 ? 30 : bal > -.7 ? 210 : 0;
    const sat = bal == null ? 34 : bal > .34 ? 66 : bal > -.34 ? 40 : bal > -.7 ? 20 : 10;
    return {
      id: p.id, person: p,
      name: p.nickname || p.name.split(' ')[0], full: p.name,
      ring: SKY_RINGS[p.circle] != null ? p.circle : 'orbit',
      /* the two kinds of weight a person has in a life: what you have written
         about them, and how often you have seen them */
      radius: Math.min(8 + (ints.length + written * 2) * .55, 26),
      hue, sat, lum: bal == null ? 52 : bal > -.34 ? 58 : 50,
      glow: skyGlow(days), days, last,
      interactions: ints.length, written,
      energy: bal,
      overdue: personOverdue(p),
      /* somebody you have not met is drawn as an outline and hangs on no
         thread — there is nothing yet between you */
      unmet: p.circle === 'aspirational' || p.status === 'notyetmet',
      faded: ['lost', 'estranged', 'deceased'].includes(p.status),
      seed: skySeed(p.id),
      x: 0, y: 0, vx: 0, vy: 0, ang: 0,
    };
  });
}

/* ---------- the sky ---------- */
function PeopleSky(canvas, nodes, opts){
  this.cv = canvas; this.ctx = canvas.getContext('2d');
  this.nodes = nodes; this.opts = opts || {};
  this.hover = null; this.drag = null; this.pressed = null;
  this.t0 = performance.now(); this.lit = new Map();
  /* Still, for anyone who has asked for less motion and for anyone running
     plain: the simulation is settled in one go and drawn once. The layout is
     the information; the drifting is not. */
  this.soft = (typeof reduced === 'function' && reduced())
    || (typeof plainMode === 'function' && plainMode());
  this.resize();
  this.place();
  this.bind();
  this.start();
}
PeopleSky.prototype.resize = function(){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = this.cv.parentElement.clientWidth || 640;
  const h = this.opts.height || 520;
  this.w = w; this.h = h;
  this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr);
  this.cv.style.width = w + 'px'; this.cv.style.height = h + 'px';
  this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  this.cx = w / 2; this.cy = h / 2;
  /* the outermost ring has to leave room for a name under a face */
  this.maxR = Math.max(120, Math.min(w / 2 - 54, h / 2 - 40));
  this.nodes.forEach(n => { n.target = SKY_RINGS[n.ring] * this.maxR; });
};
/* Everyone starts on their own ring at their own angle, so the first frame is
   already a readable sky rather than a heap in the middle that sorts itself
   out while you watch. */
PeopleSky.prototype.place = function(){
  this.nodes.forEach(n => {
    n.x = this.cx + Math.cos(n.seed) * n.target;
    n.y = this.cy + Math.sin(n.seed) * n.target;
    n.vx = n.vy = 0;
  });
  if(this.soft) for(let i = 0; i < 120; i++) this.step(1);
};

/* ---------- the forces ---------- */
PeopleSky.prototype.step = function(scale){
  const k = scale == null ? 1 : scale;
  const ns = this.nodes;
  for(const n of ns){
    if(n === this.drag) continue;
    /* the spring that holds a person at their ring's distance */
    const dx = n.x - this.cx, dy = n.y - this.cy;
    const d = Math.max(1, Math.hypot(dx, dy));
    const pull = (d - n.target) * .004 * k;
    n.vx -= (dx / d) * pull; n.vy -= (dy / d) * pull;
    /* the drift that keeps it breathing — deterministic, so a still frame in
       plain mode is the same still frame every time */
    if(!this.soft){
      const t = (performance.now() - this.t0) / 1000;
      n.vx += Math.sin(t * .27 + n.seed * 3.1) * .016 * k;
      n.vy += Math.cos(t * .23 + n.seed * 2.3) * .016 * k;
    }
  }
  /* faces do not sit on top of each other */
  for(let i = 0; i < ns.length; i++){
    for(let j = i + 1; j < ns.length; j++){
      const a = ns[i], b = ns[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      const min = a.radius + b.radius + 22;
      if(d >= min) continue;
      const f = (min - d) * .06 * k;
      if(a !== this.drag){ a.vx -= (dx / d) * f; a.vy -= (dy / d) * f; }
      if(b !== this.drag){ b.vx += (dx / d) * f; b.vy += (dy / d) * f; }
    }
  }
  for(const n of ns){
    if(n === this.drag) continue;
    n.vx *= .93; n.vy *= .93;
    n.x += n.vx; n.y += n.vy;
  }
};

/* ---------- the ink ---------- */
PeopleSky.prototype.ink = function(){
  return document.documentElement.dataset.theme === 'light'
    ? {label: '#2c2520', ring: 'rgba(120,90,60,.10)', thread: .8, light: true}
    : {label: '#e8e0d4', ring: 'rgba(212,164,76,.07)', thread: 1, light: false};
};
PeopleSky.prototype.frame = function(now){
  const c = this.ctx, ink = this.ink();
  if(!this.soft) this.step();
  c.clearRect(0, 0, this.w, this.h);

  /* the rings, faint, for orientation only */
  c.save();
  c.setLineDash([4, 8]); c.strokeStyle = ink.ring; c.lineWidth = 1;
  Object.entries(SKY_RINGS).forEach(([k, f]) => {
    c.beginPath(); c.arc(this.cx, this.cy, f * this.maxR, 0, Math.PI * 2); c.stroke();
  });
  c.restore();
  c.save();
  c.fillStyle = ink.label; c.globalAlpha = .2;
  c.font = '9px ' + (getComputedStyle(document.body).fontFamily || 'sans-serif');
  c.textAlign = 'center';
  Object.entries(SKY_RINGS).forEach(([k, f]) => {
    c.fillText(CIRCLES[k][1].toUpperCase(), this.cx, this.cy - f * this.maxR - 5);
  });
  c.restore();

  this.nodes.forEach(n => this.thread(n, now, ink));
  /* far ones first, so a near face passes in front of a far one */
  [...this.nodes]
    .sort((a, b) => Math.hypot(a.x - this.cx, a.y - this.cy) - Math.hypot(b.x - this.cx, b.y - this.cy))
    .reverse()
    .forEach(n => this.node(n, now, ink));
  this.self(now, ink);
};

/* The thread is the whole story: bright and whole when it is warm, and when it
   has gone cold it frays — drawn as two thin lines slightly apart instead of
   one, which is what a loosening connection looks like. A thread you have
   tended lately carries a point of light out along it, once every few
   seconds, from you towards them. */
PeopleSky.prototype.thread = function(n, now, ink){
  if(n.unmet) return;                       /* nothing between you yet */
  const c = this.ctx;
  const dim = this.hover && n !== this.hover ? .3 : 1;
  const op = (n === this.hover ? .6 : n.glow * 1.5) * dim * ink.thread * (n.faded ? .5 : 1);
  const cold = n.days == null || n.days >= 30;
  const mx = (this.cx + n.x) / 2 + Math.cos(n.seed) * 14;
  const my = (this.cy + n.y) / 2 + Math.sin(n.seed) * 14;
  c.save();
  c.strokeStyle = `hsla(${n.hue},${n.sat}%,${n.lum + 6}%,${op.toFixed(3)})`;
  c.lineWidth = (n === this.hover ? 2 : 1) + n.radius * .05;
  const runs = cold ? [-1.6, 1.6] : [0];
  runs.forEach(o => {
    c.beginPath();
    c.moveTo(this.cx + o, this.cy);
    c.quadraticCurveTo(mx + o, my + o, n.x + o, n.y);
    c.stroke();
  });
  c.restore();
  /* the pulse, on threads you have tended within the week */
  if(!this.soft && n.days != null && n.days < 7){
    const t = ((now - this.t0) / 5000 + n.seed / 6.283) % 1;
    if(t < .34){
      const u = t / .34;
      const x = (1 - u) * (1 - u) * this.cx + 2 * (1 - u) * u * mx + u * u * n.x;
      const y = (1 - u) * (1 - u) * this.cy + 2 * (1 - u) * u * my + u * u * n.y;
      c.save();
      c.fillStyle = `hsla(${n.hue},${n.sat}%,72%,${(.5 * (1 - u) * dim).toFixed(3)})`;
      c.beginPath(); c.arc(x, y, 2.2, 0, Math.PI * 2); c.fill();
      c.restore();
    }
  }
};
PeopleSky.prototype.node = function(n, now, ink){
  const c = this.ctx;
  const dim = this.hover && n !== this.hover ? .3 : 1;
  const hot = this.lit.get(n.id);                    /* a just-logged bloom */
  const bloom = hot ? Math.max(0, 1 - (now - hot) / 1400) : 0;
  const scale = (n === this.hover ? 1.3 : 1) * (1 + bloom * .15);
  const r = n.radius * scale;
  const x = n === this.drag ? this.drag.px : n.x, y = n === this.drag ? this.drag.py : n.y;
  const glow = Math.min(.4, n.glow * (n === this.hover ? 2 : 1) + bloom * .25) * dim * (n.faded ? .4 : 1);

  if(glow > .025){
    const g = c.createRadialGradient(x, y, r, x, y, r * 3);
    g.addColorStop(0, `hsla(${n.hue},${n.sat}%,${n.lum + 8}%,${glow.toFixed(3)})`);
    g.addColorStop(1, `hsla(${n.hue},${n.sat}%,${n.lum + 8}%,0)`);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 3, 0, Math.PI * 2); c.fill();
  }
  if(n.unmet){
    /* an outline, not a face: there is nobody there yet */
    c.save();
    c.setLineDash([3, 4]); c.lineWidth = 1.2;
    c.strokeStyle = `hsla(42,60%,58%,${(.45 * dim).toFixed(3)})`;
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
    c.fillStyle = `hsla(42,60%,64%,${(.5 * dim).toFixed(3)})`;
    c.font = `${Math.max(9, r)}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('✦', x, y + 1);
    c.restore();
  } else {
    const g = c.createRadialGradient(x - r * .3, y - r * .3, 0, x, y, r);
    g.addColorStop(0, `hsla(${n.hue},${n.sat}%,${n.lum + 16}%,${dim})`);
    g.addColorStop(1, `hsla(${n.hue},${n.sat}%,${n.lum - 12}%,${dim})`);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    /* the face, if there is one, clipped into the node */
    const img = n.img;
    if(img && img.complete && img.naturalWidth){
      c.save(); c.globalAlpha = dim;
      c.beginPath(); c.arc(x, y, r - 1, 0, Math.PI * 2); c.clip();
      c.drawImage(img, x - r + 1, y - r + 1, (r - 1) * 2, (r - 1) * 2);
      c.restore();
    } else if(r >= 9){
      c.save();
      c.fillStyle = `rgba(255,253,245,${(.92 * dim).toFixed(2)})`;
      c.font = `${Math.max(9, r * .78)}px ${getComputedStyle(document.body).fontFamily || 'sans-serif'}`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(personInitials(n.person), x, y + .5);
      c.restore();
    }
  }
  /* somebody you meant to see and have not */
  if(n.overdue && !n.unmet){
    c.save();
    c.strokeStyle = `hsla(4,50%,58%,${(.5 * dim).toFixed(2)})`; c.lineWidth = 1.4;
    c.beginPath(); c.arc(x, y, r + 4, -.5, 1.1); c.stroke();
    c.restore();
  }
  if(this.opts.labels !== false){
    c.save();
    c.fillStyle = ink.label; c.globalAlpha = (n === this.hover ? .95 : .66) * dim;
    c.font = '10px ' + (getComputedStyle(document.body).fontFamily || 'sans-serif');
    c.textAlign = 'center';
    c.fillText(n.name, x, y + r + 12);
    c.restore();
  }
};
PeopleSky.prototype.self = function(now, ink){
  const c = this.ctx, cx = this.cx, cy = this.cy;
  const pulse = this.soft ? 52 : 52 + Math.sin((now - this.t0) / 1000 * 1.1) * 4;
  const g = c.createRadialGradient(cx, cy, 18, cx, cy, pulse);
  g.addColorStop(0, `rgba(212,164,76,${ink.light ? .26 : .5})`);
  g.addColorStop(.5, `rgba(212,164,76,${ink.light ? .08 : .14})`);
  g.addColorStop(1, 'rgba(212,164,76,0)');
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, pulse, 0, Math.PI * 2); c.fill();
  const core = c.createRadialGradient(cx - 5, cy - 5, 0, cx, cy, 22);
  core.addColorStop(0, ink.light ? '#f6e3bd' : '#f5deb3');
  core.addColorStop(.6, ink.light ? '#c49552' : '#d4a44c');
  core.addColorStop(1, ink.light ? '#8a6d4a' : '#b08968');
  c.fillStyle = core; c.beginPath(); c.arc(cx, cy, 22, 0, Math.PI * 2); c.fill();
  c.save();
  c.fillStyle = ink.label; c.globalAlpha = .5;
  c.font = '10px ' + (getComputedStyle(document.body).fontFamily || 'sans-serif');
  c.textAlign = 'center'; c.fillText('you', cx, cy + 40);
  c.restore();
};

/* ---------- the pointer ---------- */
PeopleSky.prototype.at = function(mx, my){
  let best = null, bd = Infinity;
  for(const n of this.nodes){
    const d = Math.hypot(mx - n.x, my - n.y);
    if(d < n.radius + 14 && d < bd){ best = n; bd = d; }
  }
  return best;
};
/* which ring a dropped face has landed in */
PeopleSky.prototype.ringAt = function(x, y){
  const d = Math.hypot(x - this.cx, y - this.cy) / this.maxR;
  let best = 'orbit', bd = Infinity;
  Object.entries(SKY_RINGS).forEach(([k, f]) => {
    const diff = Math.abs(f - d); if(diff < bd){ bd = diff; best = k; }
  });
  return best;
};
PeopleSky.prototype.bind = function(){
  const cv = this.cv;
  const local = e => { const r = cv.getBoundingClientRect(); return {x: e.clientX - r.left, y: e.clientY - r.top}; };
  this.onMove = e => {
    const {x, y} = local(e);
    if(this.drag){
      this.drag.px = x; this.drag.py = y; this.drag.x = x; this.drag.y = y;
      this.dropRing = this.ringAt(x, y);
      this.opts.onDragOver && this.opts.onDragOver(this.drag, this.dropRing);
      if(this.soft) this.frame(performance.now());
      return;
    }
    const n = this.at(x, y);
    if(n !== this.hover){ this.hover = n; this.opts.onHover && this.opts.onHover(n, x, y); }
    else if(n && this.opts.onHover) this.opts.onHover(n, x, y);
    cv.style.cursor = n ? 'pointer' : 'default';
    if(this.soft) this.frame(performance.now());
  };
  this.onDown = e => {
    const {x, y} = local(e);
    const n = this.at(x, y); if(!n) return;
    this.pressed = n; this.pressAt = {x, y};
    /* a hold picks a face up to move it between rings; a click opens them */
    this.holdT = setTimeout(() => {
      if(!this.pressed) return;
      this.drag = this.pressed; this.drag.px = x; this.drag.py = y;
      cv.style.cursor = 'grabbing';
      this.opts.onHover && this.opts.onHover(null);
      if(this.soft) this.frame(performance.now());
    }, 280);
    cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
  };
  this.onUp = e => {
    clearTimeout(this.holdT);
    const was = this.drag, pressed = this.pressed;
    this.pressed = null;
    if(was){
      this.drag = null; cv.style.cursor = 'default';
      const to = this.dropRing; this.dropRing = null;
      this.opts.onDragOver && this.opts.onDragOver(null);
      if(to && to !== was.ring && this.opts.onRing) this.opts.onRing(was, to);
      else { was.target = SKY_RINGS[was.ring] * this.maxR; }
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
  this.onResize = debounce(() => { this.resize(); if(this.soft){ this.place(); this.frame(performance.now()); } }, 200);
  window.addEventListener('resize', this.onResize);
};
/* a face that has just been given an interaction blooms for a moment */
PeopleSky.prototype.light = function(id){
  this.lit.set(id, performance.now());
  const n = this.nodes.find(x => x.id === id);
  if(n){ n.days = 0; n.glow = skyGlow(0); n.interactions++; }
  if(this.soft) this.frame(performance.now());
};
PeopleSky.prototype.start = function(){
  if(this.soft){ this.frame(performance.now()); return; }
  Animator.register('sky', now => {
    if(!this.cv.isConnected){ this.stop(); return; }
    this.frame(now);
  }, {priority: Animator.PAGE});
  Animator.watch('sky', this.cv);
  Animator.activate('sky');
};
PeopleSky.prototype.stop = function(){
  Animator.forget('sky');
  window.removeEventListener('resize', this.onResize);
};

/* ---------- the room round it ---------- */
function skyHTML(){
  return `<div class="sky-wrap rv">
    <div class="sky" id="skyBox"><canvas id="skyCv"></canvas>
      <div class="sky-card" id="skyCard" hidden></div>
      <div class="sky-ring-say mono" id="skyRing" hidden></div>
    </div>
    <div class="row between sky-foot"><span class="mono faint">hold a face to move it between rings · click to open them</span>
      <span class="mono faint">size = how present they are in what you have written · brightness = how recently you saw them</span></div>
  </div>`;
}
/* the card beside a face: everything the node is, in words, and the two
   things you are most likely to want to do about it */
function skyCardHTML(n){
  const when = n.days == null ? 'no contact logged'
    : n.days === 0 ? 'seen today' : `${relDays(n.days)}`;
  const en = n.energy == null ? null : n.energy > .34 ? ['⚡', 'leaves you fuller', 'var(--sage)']
    : n.energy > -.34 ? ['·', 'about even', 'var(--muted)'] : ['◔', 'leaves you emptier', 'var(--rose)'];
  const line = (n.person.becomeAround || '').trim();
  return `<b>${esc(n.full)}</b>
    <div class="mono">${esc(CIRCLES[n.ring][1])}${n.person.relationshipType ? ' · ' + esc(n.person.relationshipType) : ''}</div>
    <div class="sk-row"><span>last seen</span><b>${esc(when)}</b></div>
    ${en ? `<div class="sk-row"><span>energy</span><b style="color:${en[2]}">${en[0]} ${en[1]}</b></div>` : ''}
    <div class="sk-row"><span>interactions</span><b>${n.interactions}${n.written ? ` · in ${n.written} ${n.written === 1 ? 'entry' : 'entries'}` : ''}</b></div>
    ${line ? `<p class="sk-line">${esc(line.slice(0, 130))}${line.length > 130 ? '…' : ''}</p>
      <div class="sk-attrib mono">what you become around them</div>` : ''}
    ${n.overdue ? `<p class="sk-warn">You wanted ${esc(n.overdue.want)}. It has been ${
      n.overdue.days === Infinity ? 'the whole time' : relDays(n.overdue.days)}.</p>` : ''}
    <div class="sk-do">
      <button class="btn sm" data-skthought="${esc(n.id)}" title="thinking of somebody is a kind of keeping in touch">♡ thought of them</button>
      <button class="btn sm ghost" data-skopen="${esc(n.id)}">open</button>
    </div>`;
}

let _sky = null;
function mountSky(root){
  const cv = (root || document).querySelector('#skyCv'); if(!cv) return;
  const box = cv.parentElement;
  const card = box.querySelector('#skyCard'), ringSay = box.querySelector('#skyRing');
  if(_sky) _sky.stop();
  const nodes = skyNodes(); if(!nodes.length){ _sky = null; return; }
  /* photographs are loaded once and kept, rather than decoded per frame */
  nodes.forEach(n => { if(n.person.photo){ const im = new Image(); im.src = n.person.photo; n.img = im; } });

  /* The card has two buttons on it, and reaching for either of them takes the
     pointer off the face that opened it. So it does not close the instant the
     face is left: it waits a moment, and the pointer arriving on the card
     cancels the wait. Without this the card is a thing you can read and never
     press, which is worse than not having the buttons. */
  let hideT = 0;
  const holdCard = () => clearTimeout(hideT);
  const dropCard = () => { clearTimeout(hideT); hideT = setTimeout(() => { card.hidden = true; }, 260); };
  card.addEventListener('pointerenter', holdCard);
  card.addEventListener('pointerleave', dropCard);

  _sky = new PeopleSky(cv, nodes, {
    height: innerWidth < 760 ? 380 : 520,
    labels: innerWidth >= 520,
    onHover(n, x, y){
      if(!n){ dropCard(); return; }
      clearTimeout(hideT);
      card.innerHTML = skyCardHTML(n);
      card.hidden = false;
      card.style.borderColor = `hsla(${n.hue},${n.sat}%,58%,.5)`;
      const w = card.offsetWidth, h = card.offsetHeight;
      card.style.left = Math.max(6, Math.min(box.clientWidth - w - 6, x + 20)) + 'px';
      card.style.top  = Math.max(6, Math.min(box.clientHeight - h - 6, y - h / 2)) + 'px';
      card.querySelector('[data-skopen]').onclick = () => navigate('#/people/' + n.id);
      card.querySelector('[data-skthought]').onclick = () => thoughtOfThem(n.id);
    },
    onDragOver(n, ring){
      if(!n){ ringSay.hidden = true; return; }
      ringSay.hidden = false;
      ringSay.textContent = `${CIRCLES[ring][0]} ${CIRCLES[ring][1]}`;
      ringSay.style.color = CIRCLES[ring][4];
    },
    onOpen(n){ navigate('#/people/' + n.id); },
    onRing(n, to){
      const p = byId(S.people, n.id); if(!p) return;
      p.ringHistory = p.ringHistory || [];
      p.ringHistory.push({date: today(), from: p.circle, to});
      p.circle = to;
      if(to === 'aspirational' && p.status === 'active') p.status = 'notyetmet';
      if(to !== 'aspirational' && p.status === 'notyetmet') p.status = 'active';
      saveNow(); sound('success');
      toast(`${p.nickname || p.name.split(' ')[0]} is in ${CIRCLES[to][1]} now.`);
      rerender();
    },
  });
}

/* ---------- the gentlest interaction ----------
   Many relationships are kept alive in thought long before they are kept alive
   in a phone call, and the thought is not nothing. One button, no dialog: it
   is written down as an interaction like any other, the face brightens, and
   the thread refreshes. Whether it prompts an actual message is between you
   and the constellation. */
function thoughtOfThem(id){
  const p = byId(S.people, id); if(!p) return;
  S.interactions.push({id: uid(), personId: id, date: today(), type: 'thought',
    description: 'Thought of them.', mood: null, energy: '', quality: '',
    followUp: null, followUpDone: false});
  p.lastInteraction = today();
  saveNow(); sound('success');
  if(_sky) _sky.light(id);
  skyBurstAt(id);
  toast(`Thought of ${esc(p.nickname || p.name.split(' ')[0])}. That counts.`);
}
/* A dozen motes off the face, in the face's own colour, and gone in under a
   second. The finishing fireworks are for finishing a piece of work; this is
   for a small kindness and it should be the size of one. */
function skyBurstAt(id){
  if(typeof reduced === 'function' && reduced()) return;
  if(typeof plainMode === 'function' && plainMode()) return;
  if(!_sky) return;
  const n = _sky.nodes.find(x => x.id === id); if(!n) return;
  const r = _sky.cv.getBoundingClientRect();
  const c = el('<div class="fw-burst sky-burst" aria-hidden="true"></div>');
  for(let i = 0; i < 11; i++){
    const a = (i / 11) * Math.PI * 2 + Math.random() * .4, d = 22 + Math.random() * 34;
    c.insertAdjacentHTML('beforeend', `<i style="left:${(r.left + n.x).toFixed(0)}px;top:${(r.top + n.y).toFixed(0)}px;
      --dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d).toFixed(0)}px;
      animation-delay:${(Math.random() * .08).toFixed(2)}s;
      background:hsl(${n.hue},${n.sat}%,${n.lum + 14}%)"></i>`);
  }
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 1100);
}
