/* ============================================================
   THE SACRED ROOM

   Stillness was a row of tabs — Meditation, Breathwork, Body scan,
   Sanctuary — and divination was a row of buttons. Both were correct and
   both asked you to pick a noun off a form before you had arrived anywhere.
   A practice is a place you go, and the going is half of it.

   So it is a room, seen from the doorway. The cushion is on the floor, the
   table is against the right wall with the four systems laid out on it, the
   quiet room is through the door at the back, and two candles are burning.
   You do not press "Tarot"; you reach for the deck.

   The room is one SVG and nothing else — no canvas, no images, no loop. Every
   zone is a group with a hover and a click; everything that moves is a CSS
   animation on two flames and a handful of small objects, so the whole scene
   costs one paint and then nothing per frame. Anyone who has asked their
   system for less motion gets the room with the flames standing still, which
   is a room you can still use.

   It is not a replacement for the row of tabs underneath it. The room is how
   you arrive; the tabs are how you change your mind once you are already
   sitting, and taking those away would make switching practice a journey.

   And it remembers. The candles burn to the height of how recently you sat;
   the cushion keeps the mark of having been sat on; an object you consulted
   today keeps its glow until tomorrow; and a streak of three days puts out a
   vine beside the cushion with a leaf for every day.
   ============================================================ */

/* how brightly the candles burn: the last time you sat, as one number */
function roomCandle(){
  const xs = (typeof stillness === 'function' ? stillness().sessions : []) || [];
  if(!xs.length) return .3;
  const last = xs.map(x => x.date).sort().slice(-1)[0];
  const d = daysSince(last);
  return d === 0 ? 1 : d === 1 ? .85 : d <= 3 ? .65 : d <= 7 ? .45 : .3;
}
/* which systems you have already consulted today, so the table can show it */
function roomConsultedToday(){
  const T = today();
  const out = {};
  (S.entries || []).forEach(e => {
    if(e.type !== 'divination') return;
    if((e.occurredAt || e.createdAt || '').slice(0, 10) !== T) return;
    /* the system lives under extra, where every reading this house has ever
       saved has put it — reading it off the entry itself finds nothing, and
       finding nothing looks exactly like not having consulted anything */
    const k = (e.extra && e.extra.divination && e.extra.divination.system) || '';
    if(k) out[k] = true;
  });
  return out;
}
function roomSatEver(){ return ((typeof stillness === 'function' ? stillness().sessions : []) || []).length > 0; }

/* A hand does not draw a straight line. Every long edge in the room is bent
   by a pixel or so, seeded from its own name so the room is the same room
   every time it is drawn rather than twitching on each render. */
function roomWobble(seed){
  let n = [...String(seed)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);
  return () => { n = (n * 1103515245 + 12345) % 2147483648; return (n / 2147483648 - .5) * 2.4; };
}
function roomEdge(x1, y1, x2, y2, seed){
  const w = roomWobble(seed);
  const mx = (x1 + x2) / 2 + w(), my = (y1 + y2) / 2 + w();
  return `M${x1.toFixed(1)},${(y1 + w()).toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${(y2 + w()).toFixed(1)}`;
}

function sacredRoomHTML(){
  const lit = roomCandle();
  const done = roomConsultedToday();
  const sat = roomSatEver();
  const streak = typeof stillStreak === 'function' ? stillStreak() : 0;
  const leaves = streak >= 3 ? Math.min(streak, 9) : 0;
  const aura = k => done[k] ? ' consulted' : '';

  /* the planks and the brush strokes: a few faint lines, not a texture */
  const floor = Array.from({length: 7}, (_, i) =>
    `<path class="rm-plank" d="${roomEdge(0, 392 + i * 26, 1200, 386 + i * 26, 'plank' + i)}"/>`).join('');
  const wall = Array.from({length: 11}, (_, i) =>
    `<path class="rm-brush" d="${roomEdge(60 + i * 108, 20, 66 + i * 108, 382, 'brush' + i)}"/>`).join('');

  return `<div class="room-wrap rv" data-lit="${lit >= .85 ? 'high' : lit >= .45 ? 'mid' : 'low'}">
    <svg class="sacred-room" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid meet"
      role="group" aria-label="The room: a cushion, a table, a door and a shelf">

      <defs>
        <radialGradient id="rmGlow"><stop offset="0" stop-color="var(--rm-light)" stop-opacity=".55"/>
          <stop offset="1" stop-color="var(--rm-light)" stop-opacity="0"/></radialGradient>
        <radialGradient id="rmDoorLight"><stop offset="0" stop-color="#f5deb3" stop-opacity=".8"/>
          <stop offset="1" stop-color="#f5deb3" stop-opacity="0"/></radialGradient>
      </defs>

      <g class="rm-bg">
        <rect x="0" y="0" width="1200" height="392" class="rm-wall"/>
        <rect x="0" y="392" width="1200" height="208" class="rm-floor"/>
        <g class="rm-tex">${wall}${floor}</g>
        <path class="rm-line" d="${roomEdge(0, 392, 1200, 392, 'skirt')}"/>
      </g>

      <!-- the candles: not clickable, only alive. Their height is the last
           time you sat down, which is the room's one honest opinion of you. -->
      <g class="rm-candles" style="--lit:${lit.toFixed(2)}">
        ${[[210, 'l'], [990, 'r']].map(([x, s]) => `<g class="rm-sconce" transform="translate(${x},96)">
          <circle class="rm-halo" cx="0" cy="-6" r="${(54 + lit * 46).toFixed(0)}" fill="url(#rmGlow)"/>
          <path class="rm-sconce-arm" d="${roomEdge(-16, 26, 16, 26, 'sconce' + s)}"/>
          <rect class="rm-wax" x="-7" y="-4" width="14" height="30" rx="3"/>
          <g class="rm-flame" style="--fl:${(.6 + lit * .6).toFixed(2)}">
            <path class="rm-flame-out" d="M0,-30 C9,-19 8,-8 0,-4 C-8,-8 -9,-19 0,-30Z"/>
            <path class="rm-flame-in" d="M0,-22 C4.5,-15 4,-8 0,-6 C-4,-8 -4.5,-15 0,-22Z"/>
          </g></g>`).join('')}
      </g>

      <!-- the door at the back: your quiet room, ajar -->
      <g class="zone zone-door" data-room="sanctuary" tabindex="0" role="button" aria-label="Your quiet room">
        <ellipse class="rm-spill" cx="470" cy="300" rx="120" ry="150" fill="url(#rmDoorLight)"/>
        <rect class="rm-doorframe" x="392" y="128" width="156" height="264" rx="3"/>
        <rect class="rm-doorgap" x="400" y="136" width="140" height="256"/>
        <g class="rm-door-leaf">
          <rect class="rm-door" x="400" y="136" width="112" height="256" rx="2"/>
          <rect class="rm-door-panel" x="414" y="152" width="84" height="104" rx="2"/>
          <rect class="rm-door-panel" x="414" y="272" width="84" height="104" rx="2"/>
          <circle class="rm-knob" cx="498" cy="268" r="4.5"/>
        </g>
        <text class="rm-say" x="470" y="424" text-anchor="middle">Your quiet room</text>
      </g>

      <!-- the shelf: atmosphere, and a way to what you have been reading -->
      <g class="zone zone-shelf" data-room="shelf" tabindex="0" role="button" aria-label="Your wisdom shelf">
        <rect class="rm-shelf-box" x="60" y="176" width="168" height="182" rx="3"/>
        <path class="rm-line" d="${roomEdge(64, 244, 224, 244, 'shelfA')}"/>
        <path class="rm-line" d="${roomEdge(64, 304, 224, 304, 'shelfB')}"/>
        ${[[74, 186, 14, 54], [92, 190, 12, 50], [108, 184, 16, 56], [128, 192, 11, 48],
           [74, 250, 13, 50], [90, 246, 15, 54], [110, 252, 12, 48], [126, 248, 14, 52],
           [74, 310, 16, 44], [94, 314, 12, 40]].map(([x, y, w, h], i) =>
          `<rect class="rm-book${i === 2 ? ' rm-book-lit' : ''}" x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5"/>`).join('')}
        <text class="rm-say" x="144" y="384" text-anchor="middle">Your wisdom shelf</text>
      </g>

      <!-- the cushion: you do not press "meditate", you sit down -->
      <g class="zone zone-cushion" data-room="cushion" tabindex="0" role="button" aria-label="Sit. Breathe. Be still.">
        <ellipse class="rm-cush-ring" cx="600" cy="506" rx="150" ry="44"/>
        <ellipse class="rm-mat" cx="600" cy="508" rx="122" ry="34"/>
        <ellipse class="rm-cush-shadow" cx="600" cy="498" rx="78" ry="22"/>
        <ellipse class="rm-cush-base" cx="600" cy="486" rx="76" ry="26"/>
        <ellipse class="rm-cush-top" cx="600" cy="474" rx="70" ry="23"/>
        ${Array.from({length: 9}, (_, i) => `<path class="rm-cush-seam" d="${
          roomEdge(600 + Math.cos(i / 9 * Math.PI * 2) * 22, 470 + Math.sin(i / 9 * Math.PI * 2) * 8,
                   600 + Math.cos(i / 9 * Math.PI * 2) * 68, 474 + Math.sin(i / 9 * Math.PI * 2) * 22,
                   'seam' + i)}"/>`).join('')}
        ${sat ? '<ellipse class="rm-impression" cx="600" cy="472" rx="34" ry="11"/>' : ''}
        ${leaves ? `<g class="rm-vine">
          <path class="rm-vine-stem" d="M700,512 C716,486 706,452 722,${(432 - leaves * 6).toFixed(0)}"/>
          ${Array.from({length: leaves}, (_, i) => { const t = (i + 1) / (leaves + 1);
            const x = 700 + t * 22 + Math.sin(t * 6) * 5, y = 512 - t * (80 + leaves * 6);
            const s = i % 2 ? 1 : -1;
            return `<path class="rm-leaf" style="--i:${i}" d="M${x.toFixed(1)},${y.toFixed(1)}
              q${(s * 13)},-6 ${(s * 19)},2 q${(-s * 8)},7 ${(-s * 19)},-2Z"/>`; }).join('')}
        </g>` : ''}
        <text class="rm-say" x="600" y="556" text-anchor="middle">Sit. Breathe. Be still.</text>
      </g>

      <!-- the table: four systems, laid out, each its own thing to reach for -->
      <!-- the table is not itself a door: the four things on it are, and each
           of them carries its own focus and its own label -->
      <g class="zone zone-table" aria-label="The oracle awaits your question">
        <ellipse class="rm-table-glow" cx="930" cy="386" rx="190" ry="86"/>
        <path class="rm-table-top" d="M772,382 H1088 L1104,414 H756 Z"/>
        <path class="rm-cloth" d="M756,414 H1104 C1096,472 1080,506 1062,530
          C1040,518 1012,524 992,536 C968,522 938,528 914,540
          C890,524 860,530 838,540 C818,516 792,472 776,442 Z"/>
        ${Array.from({length: 5}, (_, i) => `<path class="rm-cloth-fold" d="${
          roomEdge(792 + i * 66, 420, 800 + i * 66, 520, 'fold' + i)}"/>`).join('')}
        <path class="rm-table-leg" d="M800,530 L806,590"/>
        <path class="rm-table-leg" d="M1060,530 L1054,590"/>

        <g class="obj obj-tarot${aura('tarot')}" data-room="tarot" tabindex="0" role="button" aria-label="Tarot">
          <ellipse class="obj-aura" cx="812" cy="374" rx="40" ry="22"/>
          ${[6, 3, 0].map(o => `<rect class="rm-card" x="${790 + o}" y="${348 - o}" width="44" height="62" rx="4"/>`).join('')}
          <rect class="rm-card-face" x="790" y="348" width="44" height="62" rx="4"/>
          <circle class="rm-card-mark" cx="812" cy="379" r="11"/>
          <circle class="rm-card-mark" cx="812" cy="379" r="5"/>
          <text class="obj-say" x="812" y="336" text-anchor="middle">Tarot</text>
        </g>

        <g class="obj obj-coins${aura('iching')}" data-room="iching" tabindex="0" role="button" aria-label="I Ching">
          <ellipse class="obj-aura" cx="888" cy="386" rx="34" ry="19"/>
          ${[[872, 392], [900, 396], [886, 374]].map(([x, y], i) =>
            `<g class="rm-coin" style="--i:${i}"><circle cx="${x}" cy="${y}" r="12"/>
              <rect class="rm-coin-hole" x="${x - 4}" y="${y - 4}" width="8" height="8" rx="1"/></g>`).join('')}
          <text class="obj-say" x="888" y="346" text-anchor="middle">I Ching</text>
        </g>

        <g class="obj obj-oracle${aura('oracle')}" data-room="oracle" tabindex="0" role="button" aria-label="Oracle cards">
          <ellipse class="obj-aura" cx="968" cy="372" rx="32" ry="26"/>
          <g transform="rotate(-5 968 372)">
            <rect class="rm-oracle" x="950" y="342" width="36" height="58" rx="4"/>
            <path class="rm-oracle-star" d="M968,356 L972,368 L984,372 L972,376 L968,388 L964,376 L952,372 L964,368Z"/>
          </g>
          <text class="obj-say" x="968" y="332" text-anchor="middle">Oracle</text>
        </g>

        <g class="obj obj-charms${aura('charms')}" data-room="charms" tabindex="0" role="button" aria-label="Charm casting">
          <ellipse class="obj-aura" cx="1042" cy="392" rx="36" ry="20"/>
          ${[[1024, 390, 5], [1038, 397, 4], [1052, 388, 5.5], [1046, 380, 3.5],
             [1060, 398, 4], [1030, 381, 4.5], [1068, 386, 3]].map(([x, y, r], i) =>
            `<circle class="rm-charm" style="--i:${i}" cx="${x}" cy="${y}" r="${r}"/>`).join('')}
          <text class="obj-say" x="1042" y="352" text-anchor="middle">Charms</text>
        </g>
        <text class="rm-say" x="930" y="576" text-anchor="middle">The oracle awaits your question</text>
      </g>
    </svg>
  </div>`;
}

/* ---------- what the room does when you reach into it ---------- */
function bindSacredRoom(root, redraw){
  const go = redraw || rerender;
  const wrap = (root || document).querySelector('.room-wrap'); if(!wrap) return;

  const enter = (el, then) => {
    /* the room stands back for a moment and then the practice is there. Not a
       five-stage dissolve: the ceremonies have their own openings, and two
       cinematics in a row is one too many. */
    wrap.classList.add('entering');
    el && el.classList.add('taken');
    setTimeout(() => { wrap.classList.remove('entering'); el && el.classList.remove('taken'); then(); },
      (typeof reduced === 'function' && reduced()) ? 0 : 260);
  };

  wrap.querySelectorAll('[data-room]').forEach(z => {
    const act = () => {
      const k = z.dataset.room;
      sound('open');
      if(k === 'cushion'){
        /* sitting down is not choosing a practice: the four ways to be still
           are offered once you are on the cushion, in a ring round it */
        enter(z, () => openStillnessRing());
        return;
      }
      if(k === 'sanctuary'){
        enter(z, () => {
          const s = stillness(); s.prefs.kind = 'sanctuary'; saveNow(); go();
          setTimeout(() => document.querySelector('#stBegin')?.click(), 80);
        });
        return;
      }
      if(k === 'shelf'){ enter(z, () => navigate('#/journals/library')); return; }
      const open = {tarot: () => openTarot(), iching: () => openIChing(),
        oracle: () => openOracle(), charms: () => openCharmCast()}[k];
      if(open) enter(z, open);
    };
    z.addEventListener('click', ev => { ev.stopPropagation(); act(); });
    z.addEventListener('keydown', ev => {
      if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); act(); }
    });
  });
}

/* The four ways to be still, offered round the cushion rather than as a row
   of tabs above a form. Same four, same preferences, same session — this is
   only where you are standing when you choose. */
function openStillnessRing(){
  const s = stillness();
  const m = openModal(`<div class="sit-ring">
    <div class="sit-cushion" aria-hidden="true"></div>
    <h2 class="entry-h sit-h">How still, and for how long?</h2>
    <div class="sit-opts">${STILL_KINDS.map(([k, n, ic]) =>
      `<button class="sit-opt${s.prefs.kind === k ? ' on' : ''}" data-sitkind="${k}">
        <span class="sit-ic">${ic}</span><b>${esc(n)}</b></button>`).join('')}</div>
    <p class="muted sit-why">Whichever you pick, the length and the rest of it are on the page behind this.</p>
  </div>`, 'narrow');
  m.querySelectorAll('[data-sitkind]').forEach(b => b.onclick = () => {
    s.prefs.kind = b.dataset.sitkind; saveNow(); sound('click'); m.remove();
    rerender();
    /* the pane for that practice is what you wanted to be looking at */
    setTimeout(() => document.querySelector('#t-still .still-pane')
      ?.scrollIntoView({block: 'center', behavior: reduced() ? 'auto' : 'smooth'}), 120);
  });
  return m;
}
