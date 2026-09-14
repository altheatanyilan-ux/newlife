/* ============================================================
   ONE LOOP

   Every moving thing in the house used to ask the browser for its own frames:
   the dust in the air, the wind in the skill tree's canopy, the planets on
   Values, the particles in a divination. Each of them was careful on its own —
   they throttle themselves, they stop when the tab is hidden, they stop when
   their canvas leaves the document — and together they were still three or
   four callbacks a frame, each one waking the machine up separately sixty
   times a second to decide whether it had anything to do.

   So there is one loop now, and the moving things register with it. What this
   buys, in order of size:

     - One wake-up a frame instead of four. A rAF callback that decides to do
       nothing is cheap, but it is not free, and four of them are four.
     - A budget per layer. The dust does not need sixty frames a second to
       drift a quarter of a pixel; the canopy does not need sixty to lean a
       degree. Each layer says what it needs and the loop holds it to that.
     - Background gives way to foreground. While a page is drawing its own
       canvas — the solar system, a ceremony — the ambient layers stand down
       rather than competing with the thing you are actually looking at. They
       come back by themselves when it stops.
     - One place to switch it all off. A hidden tab, a person who asked for
       less motion, a machine that cannot take it: one check rather than four
       that can disagree.

   A loop registered here does not manage its own frames, its own throttle, or
   its own visibility. It says what it is and what it needs, and it is called
   when it should be.
   ============================================================ */
const Animator = (() => {
  /* what a layer is for, which decides what gives way to what */
  const BACKGROUND = 0;   /* ambient: the dust, the wind. First to stand down. */
  const UI = 1;           /* the pointer's own business. Never stands down. */
  const PAGE = 2;         /* what this room is actually drawing. */

  const loops = new Map();
  let raf = 0, hidden = false;

  function register(id, update, opts = {}){
    const prev = loops.get(id);
    loops.set(id, {
      id, update,
      priority: opts.priority == null ? BACKGROUND : opts.priority,
      /* a layer that says nothing gets every frame there is */
      interval: opts.fps ? 1000 / opts.fps : 0,
      active: prev ? prev.active : false,
      visible: true,
      last: 0, io: prev ? prev.io : null,
    });
    return id;
  }
  function forget(id){
    const l = loops.get(id);
    if(l && l.io){ l.io.disconnect(); l.io = null; }
    loops.delete(id);
    if(!anyActive()) stop();
  }
  const anyActive = () => [...loops.values()].some(l => l.active && l.visible);
  /* is something in the foreground drawing? then the ambient layers wait */
  const foreground = () => [...loops.values()].some(l => l.active && l.visible && l.priority >= PAGE);

  function activate(id){
    const l = loops.get(id); if(!l) return;
    l.active = true; l.last = 0;
    start();
  }
  function deactivate(id){
    const l = loops.get(id); if(!l) return;
    l.active = false;
    if(!anyActive()) stop();
  }
  /* Nothing is drawn for a canvas that has been scrolled off the screen. The
     element is watched rather than the page, so this keeps working when the
     thing moves or the page is redrawn under it. */
  function watch(id, el){
    const l = loops.get(id); if(!l || !el) return;
    if(l.io) l.io.disconnect();
    if(!('IntersectionObserver' in window)){ l.visible = true; return; }
    l.io = new IntersectionObserver(es => {
      /* An element that has left the document is not merely off the screen:
         its layer will never be called again, so it would sit registered and
         active for ever, and nothing would ever notice. A page swap is the
         ordinary way that happens. */
      if(!el.isConnected){ forget(id); return; }
      l.visible = es[0].isIntersecting;
      if(l.visible && l.active) start(); else if(!anyActive()) stop();
    }, {threshold: 0});
    l.io.observe(el);
  }

  function frame(now){
    raf = 0;
    if(hidden || !anyActive()) return;
    const fg = foreground();
    loops.forEach(l => {
      if(!l.active || !l.visible) return;
      /* the ambient layers give way to whatever the room is drawing */
      if(fg && l.priority === BACKGROUND) return;
      if(l.interval && now - l.last < l.interval) return;
      l.last = now;
      try { l.update(now); }
      catch(e){ console.warn('animation layer failed, dropping it', l.id, e); l.active = false; }
    });
    if(anyActive()) raf = requestAnimationFrame(frame);
  }
  function start(){ if(!raf && !hidden && anyActive()) raf = requestAnimationFrame(frame); }
  function stop(){ if(raf) cancelAnimationFrame(raf); raf = 0; }

  /* Nobody is looking: not one frame, for any layer. */
  document.addEventListener('visibilitychange', () => {
    hidden = document.hidden;
    if(hidden) stop();
    else { loops.forEach(l => { l.last = 0; }); start(); }
  });

  return {BACKGROUND, UI, PAGE, register, forget, activate, deactivate, watch, start, stop,
    /* what is running, for anyone asking — a person at a console, or a test */
    stats(){ return {frames: !!raf, hidden, foreground: foreground(),
      loops: [...loops.values()].map(l => ({id: l.id, priority: l.priority, active: l.active,
        visible: l.visible, fps: l.interval ? Math.round(1000 / l.interval) : 60}))}; }};
})();
