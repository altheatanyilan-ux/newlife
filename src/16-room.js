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

/* ---------- what used to be here ----------
   sacredRoomHTML drew the room, and bindSacredRoom hung its doors. Both are
   gone, and the reason is that they had quietly become a second copy of
   something the house already does better: the room grew into the sanctuary
   floor when the house was built, and the two drawings have been the same
   room in two places ever since — one on Today, one in the house.

   The house is the sacred space on Today now, so the duplicate is not just
   redundant, it was actively wrong. Both binders looked for [data-room]
   inside .room-wrap, which is exactly the markup the sanctuary uses, so every
   door in the house was hung twice: two sounds, two walk animations played
   over each other, and the cushion opening two rings stacked on top of one
   another.

   What the room knew is kept and still used by the house above: the candle
   that burns to how recently you sat, the decks consulted today, whether you
   have ever sat at all, the hand-drawn wobble every long edge in the house is
   bent by, and the ring of four ways to be still that the cushion opens. */


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
    setTimeout(() => document.querySelector('#t-sacred .still-pane')
      ?.scrollIntoView({block: 'center', behavior: reduced() ? 'auto' : 'smooth'}), 120);
  });
  return m;
}
