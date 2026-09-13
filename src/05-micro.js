/* ============================================================
   THE POINTER LAYER — cursor, magnetism, tilt, flashlight
   ------------------------------------------------------------
   Small responses to where the pointer is, so the page reads as something
   aware of you rather than a sheet of paper. The rule for all of it: the
   content responds to you; nothing decorates itself at you. If a thing here
   is ever noticed as an effect rather than felt as a texture, it is too
   strong and should come down, not up.

   Three things shape how this is built rather than how the spec wrote it.

   The spec binds a listener per element — applyMagnetic(el), applyTilt(el).
   This app rebuilds #main wholesale on every rerender(), and rerender() runs
   on nearly every edit, so per-element bindings would have to be re-hung
   hundreds of times a page and would leak the ones on nodes already thrown
   away. Instead there is one pointermove on the document, coalesced into a
   single frame, that reads the element under the pointer and applies whatever
   effects match it. One listener, nothing to rebind, nothing to leak.

   Everything here is off entirely under prefers-reduced-motion and on touch:
   a finger has no hover, and a cursor it cannot see is worse than none.

   And the native cursor is hidden only while ours is actually running, so a
   browser that never starts it — or a person who asked for less motion — is
   left with the pointer they had.
   ============================================================ */
const MicroFX = (() => {
  const isTouch = () => matchMedia('(hover:none)').matches || 'ontouchstart' in window;
  const off = () => reduced() || isTouch();

  /* ---------- what gets what ----------
     Kept as selectors in one place so the answer to "why is this card
     tilting" is one grep, not a hunt through five call sites. */
  const CLICKABLE = 'a[href],button,[role="button"],summary,.chip,.tbtn,.card[data-taskrow],[data-jump],[data-topen],label';
  const EDITABLE  = 'input:not([type="range"]):not([type="checkbox"]),textarea,[contenteditable="true"],.ed';
  const CANVASY   = 'canvas,.tree-wrap,.solar-wrap,.constellation,.sky';
  /* the grips that resize things keep their own cursor: the double arrow is
     the only thing that says a column edge can be dragged at all */
  const GRIP      = '.panel-grip,.ws-grip,.tu-grip,.pc-grip,.pe-grip,.pl-gbaredge';

  const MAGNETS = [
    {sel:'.btn.primary,#fab,.speed-item', strength:.3,  threshold:60},
    {sel:'.nav a,.nav button',            strength:.2,  threshold:40},
    {sel:'.ring,.habit-ring,.hb-ring',    strength:.25, threshold:50},
    {sel:'.card',                         strength:.1,  threshold:30}];
  const TILTS = [
    {sel:'.tarot-card,.card-face,.div-card', max:8},
    {sel:'.nav a',                           max:2},
    {sel:'.card,.tile,.panel-card',          max:4}];
  const FLASHLIGHT = '.nav,.page,.flashlight-panel';

  let dot = null, ring = null, ringX = 0, ringY = 0, px = 0, py = 0, raf = 0;
  let hovered = null, effects = null, started = false;

  /* ---------- the cursor ---------- */
  function startCursor(){
    dot = el('<div class="mfx-dot" aria-hidden="true"></div>');
    ring = el('<div class="mfx-ring" aria-hidden="true"></div>');
    document.body.append(dot, ring);
    document.documentElement.classList.add('mfx-cursor');
    /* Lerp at 0.15 a frame: the ring chases and lags, which is what gives the
       pointer weight. The loop stops the moment it has caught up — a frame
       loop that runs forever to move something zero pixels is a frame loop
       the rest of the page could have had. onMove restarts it. */
    const spin = () => {
      ringX += (px - ringX) * .15; ringY += (py - ringY) * .15;
      /* `translate`, not `transform`. The dashed spin while you are carrying
         something is a CSS animation on `rotate`, and an animation beats an
         inline style — written as one `transform` the two fought, the spin
         won, and the ring lost its position entirely and sat in the corner
         turning. As separate properties they compose and neither can clobber
         the other. */
      ring.style.translate = `${ringX - 16}px ${ringY - 16}px`;
      if(Math.abs(px - ringX) < .12 && Math.abs(py - ringY) < .12){ raf = 0; return; }
      raf = requestAnimationFrame(spin);
    };
    startCursor.spin = spin;
    document.addEventListener('mousedown', () => ring.classList.add('press'));
    document.addEventListener('mouseup', () => { ring.classList.remove('press'); ring.classList.remove('drag'); });
    document.addEventListener('dragstart', () => ring.classList.add('drag'));
    /* Three ways out of a drag, because one is not enough: dragend is the
       ordinary one, drop covers a handler that swallows it, and mouseup
       covers a drag the browser abandons without firing either. Getting
       stuck in the drag state used to need a page reload to escape. */
    document.addEventListener('dragend', () => ring.classList.remove('drag'));
    document.addEventListener('drop', () => ring.classList.remove('drag'), true);
    /* the cursor has nothing to point at once the pointer leaves the window */
    document.addEventListener('mouseleave', () => { dot.classList.add('gone'); ring.classList.add('gone'); });
    document.addEventListener('mouseenter', () => { dot.classList.remove('gone'); ring.classList.remove('gone'); });
  }

  function cursorState(t){
    if(!dot) return;
    const editable = !!t.closest(EDITABLE);
    dot.classList.toggle('text', editable);
    ring.classList.toggle('text', editable);
    ring.classList.toggle('click', !editable && !!t.closest(CLICKABLE));
    const canvasy = !!t.closest(CANVASY);
    dot.classList.toggle('warm', canvasy);
    ring.classList.toggle('warm', canvasy);
  }

  /* ---------- one pass, one frame ----------
     Everything the pointer does is worked out here: which element it is over,
     what that element wants, and the transforms that follow. */
  function readTarget(t){
    const out = {magnet:null, tilt:null, flash:null};
    for(const m of MAGNETS){ const n = t.closest(m.sel); if(n){ out.magnet = {node:n, ...m}; break; } }
    for(const k of TILTS){ const n = t.closest(k.sel); if(n){ out.tilt = {node:n, max:k.max}; break; } }
    out.flash = t.closest(FLASHLIGHT);
    return out;
  }
  function release(e){
    if(!e) return;
    if(e.magnet) settle(e.magnet.node, 'translate(0,0)', 400);
    if(e.tilt) settle(e.tilt.node, 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)', 500);
    if(e.tilt) e.tilt.node.classList.remove('mfx-tilt');
    if(e.flash) e.flash.classList.remove('mfx-lit');
  }
  function settle(node, to, ms){
    node.style.transition = `transform ${ms}ms cubic-bezier(.4,0,.2,1)`;
    node.style.transform = to;
    setTimeout(() => { if(node.style.transition.startsWith('transform')) node.style.transition = ''; }, ms);
  }

  function onMove(ev){
    px = ev.clientX; py = ev.clientY;
    if(dot) dot.style.translate = `${px - 3}px ${py - 3}px`;
    if(!raf && startCursor.spin) raf = requestAnimationFrame(startCursor.spin);
    const t = ev.target;
    if(t !== hovered){ hovered = t; cursorState(t); }
    const next = readTarget(t);
    /* something the pointer has left goes back where it was */
    if(effects){
      if(effects.magnet && effects.magnet.node !== next.magnet?.node) settle(effects.magnet.node, 'translate(0,0)', 400);
      if(effects.tilt && effects.tilt.node !== next.tilt?.node){
        settle(effects.tilt.node, 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)', 500);
        effects.tilt.node.classList.remove('mfx-tilt');
      }
      if(effects.flash && effects.flash !== next.flash) effects.flash.classList.remove('mfx-lit');
    }
    effects = next;

    if(next.flash){
      const r = next.flash.getBoundingClientRect();
      next.flash.classList.add('mfx-lit');
      next.flash.style.setProperty('--mx', (px - r.left) + 'px');
      next.flash.style.setProperty('--my', (py - r.top) + 'px');
    }
    /* A magnet and a tilt only fight when they land on the SAME node, since
       both write transform. Usually they do not: the tilt is the card and the
       magnet is a button inside it, and both should happen. Letting the tilt
       win on any overlap at all meant no button inside a card was magnetic —
       which is nearly all of them. */
    const sameNode = !!(next.tilt && next.magnet && next.tilt.node === next.magnet.node);
    if(next.tilt){
      const n = next.tilt.node, r = n.getBoundingClientRect();
      const x = (px - r.left) / r.width, y = (py - r.top) / r.height;
      n.classList.add('mfx-tilt');
      n.style.setProperty('--mouse-x', (x * 100) + '%');
      n.style.setProperty('--mouse-y', (y * 100) + '%');
      n.style.transition = '';
      n.style.transform = `perspective(800px) rotateX(${(.5 - y) * next.tilt.max * 2}deg) `
        + `rotateY(${(x - .5) * next.tilt.max * 2}deg) scale3d(1.02,1.02,1.02)`;
    }
    if(next.magnet && !sameNode){
      const n = next.magnet.node, r = n.getBoundingClientRect();
      const dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy);
      if(d < next.magnet.threshold){
        const pull = (1 - d / next.magnet.threshold) * next.magnet.strength;
        n.style.transition = '';
        n.style.transform = `translate(${dx * pull}px, ${dy * pull}px)`;
      } else settle(n, 'translate(0,0)', 400);
    }
  }

  let pending = null;
  function queue(ev){
    pending = ev;
    if(queue.armed) return;
    queue.armed = true;
    requestAnimationFrame(() => { queue.armed = false; if(pending) onMove(pending); });
  }

  function start(){
    if(started || off()) return;
    started = true;
    startCursor();
    document.addEventListener('mousemove', queue, {passive:true});
    /* mousemove stops during a drag; dragover is the only thing still saying
       where the pointer is, so the ring keeps up instead of being left behind */
    document.addEventListener('dragover', queue, {passive:true});
    /* a page swap leaves transforms on nodes that are already gone; the ones
       still here are let go so nothing is stuck mid-lean */
    window.addEventListener('hashchange', () => { release(effects); effects = null; hovered = null; });
  }
  function stop(){
    if(!started) return;
    started = false;
    /* zeroed, not just cancelled: a stale id left here reads as "the loop is
       running", so a restart would never take a frame again and the ring
       would sit where it was */
    cancelAnimationFrame(raf); raf = 0;
    document.removeEventListener('mousemove', queue);
    document.removeEventListener('dragover', queue);
    document.documentElement.classList.remove('mfx-cursor');
    dot?.remove(); ring?.remove(); dot = ring = null;
    release(effects); effects = null;
  }
  return {start, stop, get running(){ return started; },
    /* true once the ring has caught up and the loop has let go of the frame */
    get idle(){ return started && !raf; }, GRIP};
})();

/* ============================================================
   THE SCROLL LAYER — counters, fills, waves, a little depth
   ------------------------------------------------------------
   Things that happen once, the first time you reach them. All of it hangs
   off one IntersectionObserver rather than one per effect: the page can hold
   a few hundred candidates and three observers over the same nodes is three
   times the work for no more information.
   ============================================================ */
const ScrollFX = (() => {
  let obs = null;

  function arrive(node){
    waiting.delete(node);
    if(obs) obs.unobserve(node);
    if(node.dataset.sfxDone) return;
    node.dataset.sfxDone = '1';
    /* a number counts up to itself */
    if(node.matches('[data-tween]')){
      tween(node, parseFloat(node.dataset.tween), {dec:+(node.dataset.dec||0), suffix:node.dataset.suffix||''});
      return;
    }
    /* a bar or a ring fills from empty. The real width is already in the
       markup, so it is read, zeroed, and put back on the next frame — the
       page keeps working with JS off, and nothing here has to know the
       number the bar is about to show. */
    if(node.matches('.bar > i, .split-bar > i')){
      const to = node.style.width;
      if(!to || reduced()) return;
      node.style.transition = 'none'; node.style.width = '0%';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        node.style.transition = 'width .8s cubic-bezier(.2,.7,.3,1)';
        node.style.width = to;
        setTimeout(() => { node.style.transition = ''; }, 900);
      }));
      return;
    }
    if(node.matches('circle[data-ringlen]')){
      const to = node.style.strokeDashoffset;
      if(reduced()) return;
      node.style.transition = 'none'; node.style.strokeDashoffset = node.dataset.ringlen;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        node.style.transition = 'stroke-dashoffset .8s cubic-bezier(.2,.7,.3,1)';
        node.style.strokeDashoffset = to;
      }));
    }
  }

  /* Everything still waiting for its first look. IntersectionObserver handles
     the ordinary case — you scroll down and a number comes into view — but it
     only fires when the ratio crosses a threshold, and a jump straight to the
     foot of the page (the index, End, a deep link) takes an element from
     below the fold to above it without ever intersecting. Those never fired
     and sat at zero for good. So the set is also swept on scroll, and
     anything now at or past the fold is counted as arrived. The sweep only
     runs while something is still waiting, and unhooks itself when the set
     empties. */
  const waiting = new Set();
  let sweeping = false;
  function observer(){
    if(obs) return obs;
    obs = new IntersectionObserver(es => es.forEach(e => {
      if(e.isIntersecting) arrive(e.target);
    }), {threshold:.15});
    return obs;
  }
  function sweep(){
    if(!waiting.size){ sweeping = false; return; }
    [...waiting].forEach(n => {
      const r = n.getBoundingClientRect();
      if(r.top < innerHeight) arrive(n);
    });
    if(!waiting.size) sweeping = false;
  }
  function armSweep(){
    if(sweeping || !waiting.size) return;
    sweeping = true;
    let queued = false;
    const on = () => {
      if(queued) return; queued = true;
      requestAnimationFrame(() => { queued = false; sweep(); if(!sweeping) removeEventListener('scroll', on); });
    };
    addEventListener('scroll', on, {passive:true});
  }

  /* Cards in a grid come in on a diagonal, top-left first, so a grid arrives
     as a wave rather than as twelve things appearing at once. The delay is
     read off the position on screen, capped so the last card is never more
     than a beat behind the first. */
  function wave(root){
    root.querySelectorAll('.grid, .fin-cards, .inv-grid, .lib-grid').forEach(g => {
      const kids = [...g.children].filter(n => n.classList.contains('rv'));
      if(kids.length < 3) return;
      const box = g.getBoundingClientRect();
      kids.forEach(n => {
        const r = n.getBoundingClientRect();
        const d = ((r.left - box.left) + (r.top - box.top)) * .12;
        n.style.transitionDelay = Math.min(Math.round(d), 400) + 'ms';
      });
    });
  }

  function scan(root = document){
    if(!root.querySelectorAll) return;
    const o = observer();
    root.querySelectorAll('[data-tween],.bar > i,.split-bar > i,circle[data-ringlen]')
      .forEach(n => { if(n.dataset.sfxDone) return; waiting.add(n); o.observe(n); });
    wave(root);
    armSweep();
  }

  /* 1.6d — three depth planes. The ink layer behind already drifts at half
     speed; the page's own title moves at 0.95×, which is not enough to read
     as movement and is enough to stop the page feeling like one flat sheet.
     Only the title: a heading that lags inside a column of text is a
     readability problem, not depth. */
  function parallax(){
    if(reduced()) return;
    let armed = false;
    addEventListener('scroll', () => {
      if(armed) return; armed = true;
      requestAnimationFrame(() => {
        armed = false;
        const h = document.querySelector('#main .page-head');
        if(h) h.style.transform = `translateY(${Math.min(scrollY * .05, 40)}px)`;
      });
    }, {passive:true});
  }

  return {scan, parallax, arrive};
})();

/* ============================================================
   THE AMBIENT LAYER — breath, dust, the hour of the day
   ------------------------------------------------------------
   Always on, never asked for, and none of it should ever be the thing you
   are looking at.
   ============================================================ */
const AmbientFX = (() => {
  /* 1.7c — the site warms towards night. The spec puts a sepia filter on
     <body>, which cannot be done here: a filter on an element makes it the
     containing block for every position:fixed descendant, and the Back pill,
     the top bar, the speed dial, the side panel and the cursor itself are all
     fixed children of body. They would all reposition against the body box
     and the page would come apart. The same warmth is laid over the top
     instead, as a pointer-transparent sheet in soft-light, which tints
     everything under it and moves nothing. */
  function warmth(){
    const h = new Date().getHours();
    return h >= 5 && h < 10 ? 0 : h >= 10 && h < 16 ? -0.012 : h >= 16 && h < 20 ? 0.03 : 0.05;
  }
  function applyWarmth(){
    let n = document.getElementById('warmth');
    if(!n){ n = el('<div id="warmth" aria-hidden="true"></div>'); document.body.appendChild(n); }
    const w = warmth();
    /* a negative value is the midday cool: the same sheet, a cool cast */
    n.style.background = w >= 0 ? `rgba(212,164,76,${w})` : `rgba(150,180,210,${-w})`;
    /* Measured before this line existed: a full-viewport mix-blend-mode sheet
       cost a quarter of the frame rate, because every dust mote invalidated
       the blend over the whole page. A flat tint at the same alpha looks the
       same at five per cent and costs one frame in twenty. */
  }

  /* 1.7b — dust, everywhere rather than on two pages. Sparse (14 motes), slow,
     and skipped entirely on a page that runs a canvas of its own so the two
     are never drawing at once. Thirty frames a second: at this speed nobody
     can tell, and it halves the cost. */
  const OWN_CANVAS = ['skills', 'values'];
  function dust(){
    const c = document.getElementById('dust');
    if(!c || reduced()) return;
    const ctx = c.getContext('2d');
    let ps = [];
    const seed = () => { ps = []; for(let i = 0; i < 14; i++) ps.push({
      x:Math.random()*innerWidth, y:Math.random()*innerHeight, r:.5+Math.random()*1.5,
      vx:(Math.random()-.5)*.12, vy:-.05-Math.random()*.1,
      a:Math.random()*Math.PI*2, w:.06+Math.random()*.06}); };
    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize(); seed(); addEventListener('resize', resize);
    let last = 0, gold = 0, cleared = false;
    const tick = t => {
      requestAnimationFrame(tick);
      if(document.hidden) return;            // nobody is looking
      if(t - last < 33) return;              // 30fps, not 60
      last = t;
      if(OWN_CANVAS.includes(currentRoute)){ // that page draws its own
        if(!cleared){ ctx.clearRect(0, 0, c.width, c.height); cleared = true; }
        return;
      }
      cleared = false;
      ctx.clearRect(0, 0, c.width, c.height);
      const dark = S.settings.theme === 'dark';
      const golden = gold > performance.now();
      ctx.fillStyle = golden ? 'rgba(212,164,76,.5)'
        : dark ? 'rgba(232,224,212,.05)' : 'rgba(44,37,32,.035)';
      ps.forEach(p => {
        p.a += p.w * .06;
        p.x += p.vx + Math.sin(p.a) * .06;
        p.y += p.vy;
        if(p.y < -5){ p.y = innerHeight + 5; p.x = Math.random() * innerWidth; }
        if(p.x < -5) p.x = innerWidth + 5;
        if(p.x > innerWidth + 5) p.x = -5;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });
    };
    requestAnimationFrame(tick);
    /* the Konami code borrows the dust for five seconds */
    dust.goGold = (ms = 5000) => {
      gold = performance.now() + ms;
      const extra = [];
      for(let i = 0; i < 36; i++) extra.push({x:Math.random()*innerWidth, y:Math.random()*innerHeight,
        r:.6+Math.random()*1.8, vx:(Math.random()-.5)*.2, vy:-.08-Math.random()*.16,
        a:Math.random()*Math.PI*2, w:.06+Math.random()*.08});
      ps = ps.concat(extra);
      setTimeout(() => { ps = ps.slice(0, 14); }, ms);
    };
  }

  function start(){ applyWarmth(); setInterval(applyWarmth, 30 * 60 * 1000); dust(); }
  return {start, warmth, get goGold(){ return dust.goGold; }};
})();

/* ============================================================
   THE FEEDBACK LAYER — a press, a save, a milestone
   ------------------------------------------------------------
   What the app says back when you do something. The rule for the loudest of
   it, the milestone: it should read as a candle flaring for a moment, not as
   winning a game. Three seconds, no dismiss button, and never twice for the
   same thing.
   ============================================================ */
const RewardFX = (() => {

  /* 1.8b — a ripple from wherever the save actually happened, and a word to
     say so. ripple() already existed for the expanding ring; this adds the
     ✓ beside it, because a ring alone does not say what it was for. */
  function saved(x, y, colour){
    if(typeof ripple === 'function') ripple(x, y, colour);
    if(reduced()) return;
    const n = el('<span class="fx-saved mono">✓ saved</span>');
    n.style.left = x + 'px'; n.style.top = y + 'px';
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 1400);
  }
  /* the common case: a field just committed, and the ripple belongs at it */
  function savedAt(node, colour){
    if(!node || !node.getBoundingClientRect) return;
    const r = node.getBoundingClientRect();
    if(!r.width && !r.height) return;
    saved(r.left + r.width / 2, r.top + r.height / 2, colour);
  }

  /* 1.8c — the milestones. Each fires once and is remembered, so a thing you
     have already been congratulated for stays congratulated. */
  const MILESTONES = {
    habitsAll:   () => 'Every habit kept today ✦',
    values70:    () => 'All values above seventy ✦',
    streak21:    n  => `Twenty-one days ✦`,
    skillLevel:  n  => `${n} — a level up ✦`,
    entries100:  () => 'A hundred entries ✦',
    yearOne:     () => 'One year of this ✦',
    visionTier:  n  => `${n} ✦`,
    arrived:     n  => `${n} — arrived ✦`,
  };

  function celebrate(text){
    if(!text) return;
    if(reduced()){ if(typeof toast === 'function') toast(text, 2600); return; }
    const wrap = el(`<div class="fx-mile" aria-live="polite"><i class="fx-mile-ring"></i>
      <span class="fx-mile-word">${esc(text)}</span></div>`);
    document.body.appendChild(wrap);
    /* motes rising, the same dust as everywhere else, briefly given a reason */
    for(let i = 0; i < 20; i++){
      const m = el('<i class="fx-mote"></i>');
      m.style.left = (5 + Math.random() * 90) + 'vw';
      m.style.animationDelay = (Math.random() * 900) + 'ms';
      m.style.animationDuration = (1600 + Math.random() * 900) + 'ms';
      wrap.appendChild(m);
    }
    try { SoundManager.play('chime'); } catch(e){}
    setTimeout(() => wrap.remove(), 3200);
  }

  /* fired once per thing, ever — the ledger lives with the rest of the state */
  function once(key, text){
    S.settings.milestones = S.settings.milestones || {};
    if(S.settings.milestones[key]) return false;
    S.settings.milestones[key] = today();
    save();
    celebrate(text);
    return true;
  }

  /* Checked after a save rather than on a timer, because every one of these
     becomes true as a consequence of something you just did. Wrapped whole:
     a milestone that cannot be worked out must never cost you the save. */
  function check(){
    try {
      const T = today();
      const due = S.habits.filter(h => !h.archived && !h.negative && habitDue(h, T));
      if(due.length >= 3 && due.every(h => habitDone(h, T))) once('habitsAll:' + T, MILESTONES.habitsAll());
      if(S.valueOrder.length >= 5){
        const all = S.valueOrder.map(id => valueCurrent(id));
        if(all.every(v => v >= 70)) once('values70:' + T, MILESTONES.values70());
      }
      S.habits.filter(h => !h.archived && !h.negative).forEach(h => {
        const st = habitStreak(h);
        if(st && st.cur >= 21) once('streak21:' + h.id + ':' + Math.floor(st.cur / 21), MILESTONES.streak21(h.name));
      });
      if(S.entries.length >= 100) once('entries100', MILESTONES.entries100());
      const first = S.settings.firstOpen;
      if(first && daysSince(first) >= 365) once('yearOne:' + Math.floor(daysSince(first) / 365), MILESTONES.yearOne());
    } catch(e){ console.warn('milestone check skipped', e); }
  }

  return {saved, savedAt, celebrate, check, MILESTONES};
})();

/* ============================================================
   THE POLISH LAYER — the progress line, the code, the fallback
   ============================================================ */
const PolishFX = (() => {
  /* 1.9 — how far down a long page you are. Only on pages long enough for
     the question to arise; on a short page the line is noise. */
  function progressLine(){
    const bar = el('<div class="scroll-progress" id="scrollProgress" aria-hidden="true"></div>');
    document.body.appendChild(bar);
    let armed = false, fat = 0;
    const paint = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      if(h < innerHeight * 0.5){ bar.style.width = '0'; return; }   // short page: nothing to say
      bar.style.width = Math.min(100, (scrollY / h) * 100) + '%';
      bar.classList.add('active');
      clearTimeout(fat);
      fat = setTimeout(() => bar.classList.remove('active'), 400);
    };
    addEventListener('scroll', () => {
      if(armed) return; armed = true;
      requestAnimationFrame(() => { armed = false; paint(); });
    }, {passive:true});
    paint();
  }

  /* 1.12 — the code. Costs nothing, rewards the curious. */
  const CODE = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  function konami(){
    let at = 0;
    addEventListener('keydown', e => {
      if(typeof isTyping === 'function' && isTyping()) return;
      const want = CODE[at];
      const got = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      at = (got === want) ? at + 1 : (got === CODE[0] ? 1 : 0);
      if(at < CODE.length) return;
      at = 0;
      try { AmbientFX.goGold?.(5000); } catch(err){}
      document.querySelector('.brand')?.classList.add('konami');
      const t = document.querySelector('#main .page-head h1');
      if(t && !reduced()) scramble(t);
    });
  }
  /* the title comes apart and puts itself back — the same trick the divination
     card uses to say its name */
  function scramble(node){
    const real = node.textContent, pool = '✦✧·—+*';
    let f = 0;
    const id = setInterval(() => {
      f++;
      node.textContent = real.split('').map((ch, i) =>
        ch === ' ' ? ' ' : (i < f * 1.5 ? ch : pool[(Math.random() * pool.length) | 0])).join('');
      if(f * 1.5 > real.length){ clearInterval(id); node.textContent = real; }
    }, 45);
  }

  function start(){ progressLine(); konami(); }
  return {start, scramble};
})();

/* ---------- where the layers meet the app ----------
   Four hooks, all delegated at the document so nothing has to be rebound when
   a page redraws, and all of them guarded: a sound or a sparkle must never be
   the reason an edit fails. */
(function wireFX(){
  /* the pointer crossing the sidebar, and a panel taking a breath */
  document.addEventListener('pointerover', e => {
    try { if(e.target.closest?.('.nav a,.nav button')) SoundManager.play('uiHover'); } catch(err){}
  }, {passive:true, capture:true});

  /* anything finished gets the knock, wherever it happens */
  document.addEventListener('change', e => {
    try {
      const t = e.target;
      if(t.matches?.('input[type="checkbox"]') && t.checked) SoundManager.play('uiKnock');
    } catch(err){}
  }, true);
  document.addEventListener('click', e => {
    try {
      const t = e.target.closest?.('.task-check,.hb-check,[data-tcheck],[data-subcheck],[data-hdone]');
      if(t && !t.closest('.done')) SoundManager.play('uiKnock');
    } catch(err){}
  }, true);
})();
