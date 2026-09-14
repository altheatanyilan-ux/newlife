/* ============================================================
   THE HOUSE, IN THREE DIMENSIONS

   The zones were flat SVG scenes: a wall rectangle, a floor rectangle, and
   everything standing on the line between them. This puts them in a room —
   a real floor plane you look down onto, real walls behind and beside it, and
   every object standing up off the floor at its own depth with its own
   shadow. CSS 3D only: no WebGL, no library, nothing fetched.

   The trick that makes it cheap is that the art does not change. Each zone is
   still drawn exactly as before; this reads the bounding box of every object
   group off the browser, lifts it out of the flat scene into its own upright
   billboard, and puts it down on the floor at a depth taken from where it
   already sat in the flat composition. Things drawn higher up were always
   meant to be further back, so the mapping is free and no coordinate is
   guessed or hand-measured.

   Two departures from the specification, both deliberate.

   The camera is a look down into the room rather than a true isometric turn.
   rotateZ(-45deg) is the classic diorama angle and it turns a 1200-wide room
   into a diamond twice as wide as the page; at a few degrees the composition
   survives and the depth is still entirely real.

   And the pointer tilts the SCENE, never the objects. Counter-rotating
   thirty billboards on every pointer frame is thirty transform writes and a
   re-composite of every layer — which is the same mistake, in a new costume,
   as the custom property on the root element that made this house lag in the
   first place. The billboards carry a fixed counter-rotation and lean by the
   three degrees the camera leans. Nobody can see the difference and it is one
   write a frame instead of thirty.
   ============================================================ */

const House3D = (() => {
  const TILT = 46;                 /* how far we look down into the room */
  const TURN = -2;                 /* a couple of degrees off square, for character */
  const SWING = 3;                 /* how far the camera leans with the pointer */
  const DEPTH = 2.15;              /* flat pixels of floor to real pixels of depth */

  let scene = null, armed = false, pending = null;

  /* A finger has no pointer to lean with, a narrow screen has no room for a
     room, anybody who asked for less motion has asked for this too, and a
     machine that has already shown it cannot keep up is not asked twice. */
  let slow = false;
  const off = () => slow || (typeof reduced === 'function' && reduced())
    || matchMedia('(hover:none)').matches || innerWidth < 900;

  /* ---------- does this machine want to do this at all ----------
     Asked once, by counting frames rather than by guessing from the user
     agent. A room that stutters is worse than no room: the flat scene is
     complete, tested, and the same house. The verdict is remembered for the
     session so a slow machine is not measured again every time a door opens,
     and it is never written to storage — a laptop that was busy once should
     not be judged for it a week later. */
  let judged = false;
  function judge(){
    if(judged) return;
    judged = true;
    /* Not while it is still settling. The frame after a room is built is the
       most expensive one there is — the whole thing has just been laid out and
       composited — and measuring there condemned machines that were about to
       be perfectly fine. Wait for it to settle, then watch for two seconds.

       The bar is twenty rather than the thirty the browser would like. A room
       at twenty-four frames is worse than a room at sixty and better than no
       room at all, and the cost of being wrong in this direction is only that
       somebody sees a slightly rougher animation. The cost of being wrong in
       the other direction is taking the house away from them. */
    setTimeout(() => {
      if(!scene || document.hidden) return;
      let frames = 0;
      const t0 = performance.now();
      const tick = () => {
        if(!scene || document.hidden) return;
        frames++;
        const ms = performance.now() - t0;
        if(ms < 2000){ requestAnimationFrame(tick); return; }
        const fps = frames / (ms / 1000);
        if(fps >= 20) return;
        slow = true;
        console.warn(`the room fell back to flat: ${fps.toFixed(1)} frames a second`);
        if(typeof rerender === 'function' && document.querySelector('.h3-room')) rerender();
      };
      requestAnimationFrame(tick);
    }, 900);
  }

  /* where the wall meets the floor, per zone, in the flat drawing */
  const HORIZON = {main: 392, sanctuary: 380, garden: 300, roof: 470};

  function build(root){
    scene = null;
    clear();
    const stage = root.querySelector('.house-stage'); if(!stage) return;
    const wrap = stage.querySelector('.house-room'); if(!wrap) return;
    const svg = wrap.querySelector('svg'); if(!svg) return;
    if(off()){ stage.classList.add('h3-flat'); return; }

    const zone = stage.dataset.zone || 'main';
    const horizon = HORIZON[zone] != null ? HORIZON[zone] : 392;
    const deep = (600 - horizon) * DEPTH;
    /* A billboard faces the camera, which means it leans back from the floor
       by however far the camera looks down — so the taller a thing is, the
       further its top reaches into the room behind it. Stood on the back edge,
       a bookshelf's top ends up inside the wall, and a wall wins that
       argument: the shelf and the noticeboard were painted behind the wall
       they were hanging on.

       So the wall stands back from where the floor's objects begin, by enough
       for the tallest thing on it to clear. The floor grows by the same amount
       and the room is simply that much deeper. */
    const LEAN = Math.sin(TILT * Math.PI / 180);

    /* The flat ground and sky are replaced by real planes, so they come out.
       Everything else stays: the candles are not a zone and they are not
       decoration either — they are how recently you sat down. */
    svg.querySelectorAll('.rm-bg, .rm-tex, .hg-ground, .hr-deck').forEach(n => n.remove());
    svg.querySelectorAll(':scope > rect[fill^="url("]').forEach(n => n.remove());

    let zones = [...svg.querySelectorAll(':scope > g.zone')];
    if(!zones.length) return;

    /* The drawn labels come out before anything is measured. They sit well
       below the thing they name, so leaving them in stretched every bounding
       box down past the wall line — which turned the bookshelf and the
       noticeboard into floor objects and stood them in the middle of the
       room. They are going into screen space anyway, where they can be read
       square instead of sheared flat with the floor. */
    zones.forEach(g => {
      const say = g.querySelector(':scope > .rm-say');
      if(say){ g.dataset.say = say.textContent.trim(); say.remove(); }
      g.querySelectorAll('.obj-say').forEach(t => {
        const o = t.closest('[data-room]');
        if(o) o.dataset.say = t.textContent.trim();
        t.remove();
      });
    });


    /* Outdoors there is no wall, and what would be "on" it is in the SKY:
       the values orbiting overhead, the people as stars. Those go into the
       backdrop with the sun and the parapet, which is one plane standing where
       the horizon is — a place that already works. Stood up as objects of
       their own they spend their lives losing a depth argument with a sky the
       size of the window. They keep their doors and their labels; only where
       they are drawn changes. */
    const outdoors = zone === 'garden' || zone === 'roof';
    const footOf = g => { try { const b = g.getBBox(); return b.y + b.height; } catch(e){ return 1e9; } };
    const sky = outdoors ? zones.filter(g => footOf(g) <= horizon + 2) : [];
    zones = zones.filter(g => !sky.includes(g));

    /* Whatever is not an object standing on the floor — the candles, the sun,
       the moon, the stars, the orbiting values, the parapet — is PAINTED ON
       the wall, as a child of the wall's own element, rather than stood up in
       front of it as one more object.

       It was an object first, and it spent every iteration losing a depth
       argument with a plane the size of the window: coplanar in a preserve-3d
       context is a coin toss, and nudging it forward far enough to win is
       nudging it into the middle of the room. As a child of the plane there is
       no argument to have. It paints in document order on a surface that is
       already in the right place, which is also simply what a sconce on a wall
       and a star in the sky actually are. */
    const backdrop = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    backdrop.setAttribute('class', 'h3-backdrop');
    backdrop.setAttribute('viewBox', `0 0 1200 ${horizon}`);
    backdrop.setAttribute('preserveAspectRatio', 'none');
    [...svg.children].forEach(n => {
      if(n.tagName === 'defs'){ backdrop.appendChild(n.cloneNode(true)); return; }
      if(n.tagName === 'g' && n.classList.contains('zone') && !sky.includes(n)) return;
      backdrop.appendChild(n);
    });
    const groups = zones;

    /* how far the wall has to stand back for the tallest thing on it */
    const wallHigh = zones.reduce((n, g) => {
      let b; try { b = g.getBBox(); } catch(e){ return n; }
      return (b && b.y + b.height <= horizon + 2) ? Math.max(n, b.height + 12) : n;
    }, 0);
    const porch = Math.round(wallHigh * LEAN + 14);

    /* --wallY is where the wall stands and the floor begins; --wallH is how
       tall the wall is. They were one variable, which collapsed the wall to a
       strip the moment the porch pushed it back. */
    const room = el(`<div class="h3-room" style="--tilt:${TILT}deg;--turn:${TURN}deg;
      --deep:${(deep + porch).toFixed(0)}px;
      --wallY:${(horizon - porch).toFixed(0)}px;--wallH:${horizon}px"></div>`);
    const st = el('<div class="h3-scene"></div>');
    room.appendChild(st);

    st.appendChild(el(`<div class="h3-floor" data-floor="${zone}"></div>`));
    const back = outdoors
      ? el(`<div class="h3-horizon" data-sky="${wrap.dataset.sky || ''}"></div>`)
      : el('<div class="h3-wall h3-wall-back"></div>');
    back.appendChild(backdrop);
    st.appendChild(back);

    /* Depth is spread across the whole floor rather than scaled by a fixed
       factor. The flat scenes put everything within a hundred pixels of the
       wall line, because in a flat drawing that is where the floor is; taken
       literally it stands the whole room against the back wall and leaves two
       thirds of the floor bare. */
    const feet = zones.map(g => { try { const b = g.getBBox(); return b.y + b.height; }
      catch(e){ return horizon; } }).filter(f => f > horizon + 2);
    const near = feet.length ? Math.max(...feet) : 600;
    const backline = feet.length ? Math.min(...feet) : horizon;
    const span = Math.max(1, near - backline);

    groups.forEach(g => {
      let bb; try { bb = g.getBBox(); } catch(e){ return; }
      if(!bb || !bb.width || !bb.height) return;
      /* a little air, so a stroke on the edge is not clipped away */
      const pad = 6;
      const bx = bb.x - pad, by = bb.y - pad, bw = bb.width + pad * 2, bh = bb.height + pad * 2;
      const foot = by + bh;
      /* Something whose lowest point is above the wall line is ON the wall:
         it goes to the back of the floor and is lifted up the wall by exactly
         as far as it was drawn above the line. Everything else stands on the
         floor, further forward the lower it was drawn. */
      const onWall = foot <= horizon + 2;
      /* The scene IS the floor plane, so its y is depth: an object standing
         d deep has its foot at horizon + d, and there is no translateZ
         anywhere. Getting that wrong put everything on the wall three hundred
         pixels BEHIND the wall, where it could not be seen at all. */
      /* Things on the wall stand at the front of the porch, which is where
         the wall would have been; things on the floor spread out in front of
         that. Both are measured from the same line, so a shelf still reads as
         being against the wall. */
      /* Never quite at the front edge: the fire pit has the lowest foot in
         the garden and it was standing half off the bottom of the window. */
      const z = onWall ? porch
        : porch + (0.16 + 0.70 * ((foot - backline) / span)) * deep;
      const lift = onWall ? horizon - foot : 0;
      const top = (horizon - porch) + z - bh;
      /* how far back it is, for the haze and for the light falling off */
      const far = 1 - Math.min(1, Math.max(0, (z - porch) / Math.max(1, deep)));

      const slot = el(`<div class="h3-obj" style="
        left:${bx.toFixed(1)}px; top:${top.toFixed(1)}px;
        width:${bw.toFixed(1)}px; height:${bh.toFixed(1)}px;
        --lift:${lift.toFixed(1)}px; --far:${far.toFixed(3)}"
        ${onWall ? 'data-wall' : ''}></div>`);
      /* the shadow lies on the floor and does not stand up with the object,
         which is what makes the object look like it is standing on something */
      slot.appendChild(el(`<i class="h3-shadow" style="--w:${bw.toFixed(0)}px"></i>`));
      const bill = el(`<div class="h3-bill"></div>`);
      const cut = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      cut.setAttribute('viewBox', `${bx} ${by} ${bw} ${bh}`);
      cut.setAttribute('width', bw); cut.setAttribute('height', bh);
      cut.classList.add('h3-art');
      cut.appendChild(g);
      bill.appendChild(cut);
      slot.appendChild(bill);
      if(g.dataset.say) slot.dataset.say = g.dataset.say;
      st.appendChild(slot);
    });

    svg.remove();
    wrap.appendChild(room);
    scene = st;
    fit(room);
    lean(0, 0);
    labels(room);
    judge();
    return room;
  }

  /* ---------- the labels ----------
     Drawn into the art they lie flat on the floor and shear with it, which is
     the one thing in the room that has to be read rather than looked at. They
     are put on the glass instead, square, above whatever the pointer is over. */
  function labels(room){
    const tag = el('<div class="h3-say" aria-hidden="true"></div>');
    document.body.appendChild(tag);
    const show = (node, text) => {
      const r = node.getBoundingClientRect();
      tag.textContent = text;
      tag.style.left = Math.round(r.left + r.width / 2) + 'px';
      tag.style.top = Math.round(r.top - 8) + 'px';
      tag.classList.add('on');
    };
    room.querySelectorAll('[data-say]').forEach(n => {
      const text = n.dataset.say;
      const target = n.classList.contains('h3-obj') ? n : n;
      ['pointerenter', 'focusin'].forEach(ev => target.addEventListener(ev, () => show(target, text)));
      ['pointerleave', 'focusout'].forEach(ev => target.addEventListener(ev, () => tag.classList.remove('on')));
    });
    /* it belongs to this room; the next room hangs its own */
    room._say = tag;
  }
  function clear(){
    document.querySelectorAll('.h3-say').forEach(n => n.remove());
  }

  /* The room is drawn at its own size and then scaled to whatever the page
     will give it, so nothing inside has to know how wide the window is.

     How TALL the window has to be is a question about the projection, not
     about the plan: a wall standing up and a floor lying flat both land
     somewhere the arithmetic in a stylesheet cannot easily reach, and the
     stylesheet could not read these variables anyway — they live on the room,
     and the window is its parent. So it is measured once, after layout, and
     the window is sized to what is actually there. */
  function fit(room){
    const host = room.parentElement; if(!host) return;
    const w = host.clientWidth;
    /* Room at the sides: the turn and the perspective both widen the front of
       the scene past the twelve hundred it is drawn in, and the bar stands at
       the very edge of it. */
    if(w) room.style.setProperty('--fit', Math.min(1, w / 1360).toFixed(4));
    requestAnimationFrame(() => {
      const st = room.querySelector('.h3-scene'); if(!st || !room.isConnected) return;
      room.style.marginTop = '0px';
      /* The union of everything, not the scene's own box. A transformed
         element's rect does not include children standing out of it, and in
         this room every object stands out of it — measuring the plane alone
         cropped the tops off the furniture. */
      let top = Infinity, bottom = -Infinity;
      /* every descendant, not just the direct children: a shadow hangs below
         its object's box and the table's legs were being cropped off */
      [st, ...st.querySelectorAll('*')].forEach(n => {
        const r = n.getBoundingClientRect();
        if(!r.height) return;
        top = Math.min(top, r.top); bottom = Math.max(bottom, r.bottom);
      });
      if(!isFinite(top) || !isFinite(bottom)) return;
      const b = room.getBoundingClientRect();
      /* whatever reaches above the room's own box, give it back */
      room.style.marginTop = Math.ceil(Math.max(0, b.top - top)) + 'px';
      host.style.height = Math.ceil(bottom - top + 28) + 'px';
    });
  }

  /* ---------- the camera ----------
     One transform, on one element, once a frame. */
  function lean(dx, dy){
    if(!scene) return;
    scene.style.transform =
      `rotateX(${(TILT + dy * SWING).toFixed(2)}deg) rotateZ(${(TURN + dx * SWING).toFixed(2)}deg)`;
  }
  function onMove(e){
    if(!scene) return;
    const dx = (e.clientX / innerWidth) * 2 - 1;
    const dy = (e.clientY / innerHeight) * 2 - 1;
    lean(Math.max(-1, Math.min(1, dx)), Math.max(-1, Math.min(1, -dy)));
  }
  addEventListener('pointermove', ev => {
    if(!scene) return;
    pending = ev;
    if(armed) return;
    armed = true;
    requestAnimationFrame(() => { armed = false; if(pending) onMove(pending); });
  }, {passive: true});
  addEventListener('resize', () => {
    const room = document.querySelector('.h3-room'); if(room) fit(room);
  }, {passive: true});

  return {build, clear, get on(){ return !!scene; }, off,
    get slow(){ return slow; }, set slow(v){ slow = !!v; }};
})();
