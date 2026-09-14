/* ============================================================
   THE HOUSE

   The rooms of this app are a list in a sidebar. A list is the right shape
   for finding something you can already name, and the wrong shape for the
   half of this that is a practice rather than a task — you do not decide to
   "open Stillness", you go and sit down.

   So there is a house, and walking through it is navigating. Four zones, each
   one illustrated scene: the main room, the sanctuary floor above it, the
   garden outside, and the roof. Every object in them is a door into the part
   of the instrument it is a picture of. You do not press "Tarot"; you reach
   for the deck.

   It is also the most honest vision board this app could have. The house
   starts nearly empty — bare shelves, a dark piano, one guttering candle —
   and fills as the record fills, because everything in it is drawn from data
   that is already there. Nothing in here is decoration pretending to be
   progress; a book on the shelf is a book you logged.

   The sidebar does not go anywhere. This is another way in, offered beside
   it, not instead of it: a list is still the fastest way to reach a room you
   can name, and the house would be a cruel joke on anybody in a hurry.

   Built as one SVG per zone, only the zone you are in ever in the document,
   every moving thing a CSS animation on a handful of elements. The sacred
   room that used to sit on Today is the seed of the sanctuary floor and its
   mechanics are kept whole: the candles still burn to how recently you sat,
   the cushion still keeps its impression, the vine still grows.
   ============================================================ */

const HOUSE_ZONES = [
  {id:'main',      name:'The main room', floor:'wood',
   exits:[['garden', 'left', 'Garden'], ['sanctuary', 'up', 'Upstairs']]},
  {id:'sanctuary', name:'The sanctuary', floor:'tatami',
   exits:[['main', 'down', 'Downstairs'], ['roof', 'up', 'Rooftop']]},
  {id:'garden',    name:'The garden', floor:'stone',
   exits:[['main', 'right', 'Inside']]},
  {id:'roof',      name:'The roof', floor:'sky',
   exits:[['sanctuary', 'down', 'Back inside']]},
];
const houseZoneOf = id => HOUSE_ZONES.find(z => z.id === id) || HOUSE_ZONES[0];
function houseZone(){
  return houseZoneOf(S._houseZone || (S.settings && S.settings.houseZone) || 'main').id;
}
/* Which zone you are in is the address, not a variable. It was a variable
   first, and the route read the zone back out of the hash on every draw — so
   walking through a door set the state, redrew, and the redraw put you back
   where you started. Where you are standing is the sort of thing that ought to
   survive a reload and be linkable anyway. */
let _houseGoing = null;
function setHouseZone(id, dir){
  const z = houseZoneOf(id).id;
  if(z === houseZone()) return;
  S.settings.houseZone = z; saveNow();
  const go = () => { _houseGoing = dir || 'up'; navigate('#/house/' + z); };
  const stage = document.querySelector('.house-stage');
  if(!stage || (typeof reduced === 'function' && reduced())){ go(); return; }
  stage.dataset.going = dir || 'up';
  stage.classList.add('walking');
  setTimeout(go, 240);
}

/* ---------- how the light falls ----------
   One band per part of the day, read once when the zone is drawn rather than
   watched. It is a data attribute and the stylesheet does the rest, so the
   whole of a time-of-day change is one class swap on one element. */
function houseHour(){
  const h = new Date().getHours();
  return h < 5 ? 'night' : h < 10 ? 'morning' : h < 16 ? 'midday' : h < 20 ? 'evening' : 'night';
}

/* ---------- the sanctuary floor ----------
   The sacred room, grown into the whole upstairs. Everything the room had is
   still here and means the same thing; what is new is that the practices that
   were behind one door each now have somewhere of their own to stand.

   Wall from the top to y=380, tatami below it. Objects are laid out left to
   right in the order you would meet them walking in, and nothing overlaps
   anything else — a scene where two things share a corner reads as a mistake
   rather than as a room. */
function sanctuaryHTML(){
  const lit = roomCandle();
  const done = roomConsultedToday();
  const sat = roomSatEver();
  const streak = typeof stillStreak === 'function' ? stillStreak() : 0;
  const leaves = streak >= 3 ? Math.min(streak, 9) : 0;
  const aura = k => done[k] ? ' consulted' : '';
  const grat = (S.entries || []).filter(e => e.type === 'gratitude').length;
  const visions = (S.entries || []).filter(e => e.type === 'manifestation').length;

  const mat = Array.from({length: 6}, (_, i) =>
    `<path class="rm-plank" d="${roomEdge(0, 400 + i * 34, 1200, 394 + i * 34, 'tat' + i)}"/>`).join('');
  const wall = Array.from({length: 9}, (_, i) =>
    `<path class="rm-brush" d="${roomEdge(70 + i * 132, 16, 76 + i * 132, 372, 'swall' + i)}"/>`).join('');

  return `<div class="room-wrap house-room rv" data-lit="${lit >= .85 ? 'high' : lit >= .45 ? 'mid' : 'low'}">
    <svg class="sacred-room" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid meet"
      role="group" aria-label="The sanctuary floor: a mirror, bowls, a cushion and the oracle table">
      <defs>
        <radialGradient id="hsGlow"><stop offset="0" stop-color="var(--rm-light)" stop-opacity=".55"/>
          <stop offset="1" stop-color="var(--rm-light)" stop-opacity="0"/></radialGradient>
        <radialGradient id="hsDoor"><stop offset="0" stop-color="#f5deb3" stop-opacity=".8"/>
          <stop offset="1" stop-color="#f5deb3" stop-opacity="0"/></radialGradient>
      </defs>

      <g class="rm-bg">
        <rect x="0" y="0" width="1200" height="380" class="rm-wall"/>
        <rect x="0" y="380" width="1200" height="220" class="rm-floor"/>
        <g class="rm-tex">${wall}${mat}</g>
        <path class="rm-line" d="${roomEdge(0, 380, 1200, 380, 'sskirt')}"/>
      </g>

      <g class="rm-candles" style="--lit:${lit.toFixed(2)}">
        ${[[352, 'l'], [880, 'r']].map(([x, s]) => `<g class="rm-sconce" transform="translate(${x},92)">
          <circle class="rm-halo" cx="0" cy="-6" r="${(52 + lit * 44).toFixed(0)}" fill="url(#hsGlow)"/>
          <path class="rm-sconce-arm" d="${roomEdge(-16, 26, 16, 26, 'ssc' + s)}"/>
          <rect class="rm-wax" x="-7" y="-4" width="14" height="30" rx="3"/>
          <g class="rm-flame" style="--fl:${(.6 + lit * .6).toFixed(2)}">
            <path class="rm-flame-out" d="M0,-30 C9,-19 8,-8 0,-4 C-8,-8 -9,-19 0,-30Z"/>
            <path class="rm-flame-in" d="M0,-22 C4.5,-15 4,-8 0,-6 C-4,-8 -4.5,-15 0,-22Z"/>
          </g></g>`).join('')}
      </g>

      <!-- the mirror, kept covered. You uncover it to do the work. -->
      <g class="zone zone-mirror" data-room="mirror" tabindex="0" role="button"
         aria-label="Mirror work — the Morning Theatre">
        <rect class="rm-shelf-box hs-alcove" x="58" y="96" width="186" height="276" rx="4"/>
        <ellipse class="hs-mirror-glass" cx="151" cy="214" rx="62" ry="86"/>
        <ellipse class="hs-mirror-rim" cx="151" cy="214" rx="62" ry="86"/>
        <path class="hs-cloth" d="M89,150 C104,132 198,132 213,150 C206,186 198,200 186,214
          C170,206 132,206 116,214 C104,200 96,186 89,150Z"/>
        <g class="hs-candle sm" transform="translate(151,330)">
          <rect class="rm-wax" x="-5" y="-16" width="10" height="20" rx="2"/>
          <g class="rm-flame" style="--fl:.8">
            <path class="rm-flame-out" d="M0,-30 C6,-23 5,-18 0,-16 C-5,-18 -6,-23 0,-30Z"/></g>
        </g>
        <text class="rm-say" x="151" y="364" text-anchor="middle">Uncover the mirror</text>
      </g>

      <!-- blessing bowls: folded notes going in, folded notes coming out -->
      <g class="zone zone-blessing" data-room="blessing" tabindex="0" role="button"
         aria-label="Blessing bowls — the Gratitude journal">
        <path class="hs-lowtable" d="M70,470 H262 L272,486 H60 Z"/>
        <path class="rm-table-leg" d="M82,486 L86,540"/>
        <path class="rm-table-leg" d="M250,486 L246,540"/>
        ${[[104, 462, 20], [160, 458, 25], [218, 463, 18]].map(([x, y, r], i) =>
          `<g class="hs-bowl" style="--i:${i}">
            <path d="M${x - r},${y} a${r},${r * .9} 0 0 0 ${r * 2},0Z"/>
            <ellipse class="hs-bowl-lip" cx="${x}" cy="${y}" rx="${r}" ry="${r * .3}"/>
            ${grat > i * 3 ? `<path class="hs-note" d="M${x - 7},${y - 3} l14,0 l-3,-9 l-8,0Z"/>` : ''}
          </g>`).join('')}
        <text class="rm-say" x="160" y="562" text-anchor="middle">Leave a blessing</text>
      </g>

      <!-- the mannequins: the life being designed, standing up in the room -->
      <g class="zone zone-fashion" data-room="fashion" tabindex="0" role="button"
         aria-label="The display — the life you are designing">
        ${[[300, 1, 'a'], [366, .88, 'b']].map(([x, s, k], i) => `<g class="hs-form" style="--i:${i}"
            transform="translate(${x},372) scale(${s})">
          <path class="rm-table-leg hs-stand" d="M0,0 L0,-34"/>
          <ellipse class="hs-stand-foot" cx="0" cy="2" rx="17" ry="5"/>
          <path class="hs-garment" d="M0,-180 C16,-176 24,-168 26,-156
            L34,-96 L20,-92 L16,-40 L-16,-40 L-20,-92 L-34,-96 L-26,-156 C-24,-168 -16,-176 0,-180Z"/>
          <circle class="hs-form-head" cx="0" cy="-196" r="12"/>
          ${visions > i ? `<path class="hs-sash" d="M-24,-150 C-6,-128 8,-124 26,-132"/>` : ''}
        </g>`).join('')}
        <text class="rm-say" x="334" y="410" text-anchor="middle">Dress the life you are designing</text>
      </g>

      <!-- the sound bath: a gong, three bowls, a pair of forks -->
      <g class="zone zone-sound" data-room="soundbath" tabindex="0" role="button"
         aria-label="The sound bath — breathwork and stillness">
        <path class="hs-gong-post" d="M470,372 L470,150 M652,372 L652,150 M470,158 H652"/>
        <circle class="hs-gong" cx="561" cy="246" r="76"/>
        <circle class="hs-gong-in" cx="561" cy="246" r="50"/>
        <circle class="hs-gong-in" cx="561" cy="246" r="22"/>
        <path class="hs-gong-cord" d="M545,170 L561,170 M577,170 L561,170"/>
        ${[[478, 404, 30], [530, 410, 22], [572, 406, 26]].map(([x, y, r], i) =>
          `<g class="hs-bowl big" style="--i:${i}">
            <path d="M${x - r},${y} a${r},${r * .85} 0 0 0 ${r * 2},0Z"/>
            <ellipse class="hs-bowl-lip" cx="${x}" cy="${y}" rx="${r}" ry="${r * .28}"/></g>`).join('')}
        <path class="hs-fork" d="M638,406 L638,372 M630,372 L630,346 M646,372 L646,346"/>
        <path class="hs-fork" d="M668,406 L668,378 M661,378 L661,356 M675,378 L675,356"/>
        <text class="rm-say" x="561" y="452" text-anchor="middle">The sound knows where the tension is</text>
      </g>

      <!-- the door at the back: the room you built in your head -->
      <g class="zone zone-door" data-room="sanctuary" tabindex="0" role="button" aria-label="Your quiet room">
        <ellipse class="rm-spill" cx="762" cy="280" rx="96" ry="130" fill="url(#hsDoor)"/>
        <rect class="rm-doorframe" x="700" y="122" width="128" height="258" rx="3"/>
        <rect class="rm-doorgap" x="708" y="130" width="112" height="250"/>
        <g class="rm-door-leaf">
          <rect class="rm-door" x="708" y="130" width="90" height="250" rx="2"/>
          <rect class="rm-door-panel" x="720" y="146" width="66" height="96" rx="2"/>
          <rect class="rm-door-panel" x="720" y="260" width="66" height="96" rx="2"/>
          <circle class="rm-knob" cx="786" cy="256" r="4.5"/>
        </g>
        <text class="rm-say" x="764" y="410" text-anchor="middle">Your quiet room</text>
      </g>

      <!-- the cushion, where you sit before you choose anything -->
      <g class="zone zone-cushion" data-room="cushion" tabindex="0" role="button" aria-label="Sit. Breathe. Be still.">
        <ellipse class="rm-cush-ring" cx="560" cy="516" rx="136" ry="40"/>
        <ellipse class="rm-mat" cx="560" cy="518" rx="112" ry="31"/>
        <ellipse class="rm-cush-shadow" cx="560" cy="508" rx="70" ry="20"/>
        <ellipse class="rm-cush-base" cx="560" cy="498" rx="68" ry="23"/>
        <ellipse class="rm-cush-top" cx="560" cy="487" rx="62" ry="20"/>
        ${Array.from({length: 9}, (_, i) => `<path class="rm-cush-seam" d="${
          roomEdge(560 + Math.cos(i / 9 * Math.PI * 2) * 20, 484 + Math.sin(i / 9 * Math.PI * 2) * 7,
                   560 + Math.cos(i / 9 * Math.PI * 2) * 60, 487 + Math.sin(i / 9 * Math.PI * 2) * 19,
                   'hseam' + i)}"/>`).join('')}
        ${sat ? '<ellipse class="rm-impression" cx="560" cy="485" rx="30" ry="10"/>' : ''}
        ${leaves ? `<g class="rm-vine">
          <path class="rm-vine-stem" d="M652,522 C668,498 658,466 674,${(448 - leaves * 6).toFixed(0)}"/>
          ${Array.from({length: leaves}, (_, i) => { const t = (i + 1) / (leaves + 1);
            const x = 652 + t * 22 + Math.sin(t * 6) * 5, y = 522 - t * (74 + leaves * 6);
            const s = i % 2 ? 1 : -1;
            return `<path class="rm-leaf" style="--i:${i}" d="M${x.toFixed(1)},${y.toFixed(1)}
              q${(s * 12)},-6 ${(s * 18)},2 q${(-s * 7)},7 ${(-s * 18)},-2Z"/>`; }).join('')}
        </g>` : ''}
        <text class="rm-say" x="560" y="566" text-anchor="middle">Sit. Breathe. Be still.</text>
      </g>

      <!-- the table: the four systems, laid out -->
      <g class="zone zone-table" aria-label="The oracle awaits your question">
        <ellipse class="rm-table-glow" cx="1000" cy="392" rx="180" ry="82"/>
        <path class="rm-table-top" d="M862,388 H1148 L1162,418 H848 Z"/>
        <path class="rm-cloth" d="M848,418 H1162 C1154,472 1140,504 1124,526
          C1104,514 1078,520 1060,532 C1038,518 1010,524 988,536
          C966,520 938,526 918,536 C900,514 876,472 862,444 Z"/>
        ${Array.from({length: 5}, (_, i) => `<path class="rm-cloth-fold" d="${
          roomEdge(882 + i * 60, 424, 890 + i * 60, 518, 'hfold' + i)}"/>`).join('')}
        <path class="rm-table-leg" d="M890,528 L896,588"/>
        <path class="rm-table-leg" d="M1124,528 L1118,588"/>

        <g class="obj obj-tarot${aura('tarot')}" data-room="tarot" tabindex="0" role="button" aria-label="Tarot">
          <ellipse class="obj-aura" cx="900" cy="380" rx="40" ry="22"/>
          ${[6, 3, 0].map(o => `<rect class="rm-card" x="${878 + o}" y="${354 - o}" width="44" height="62" rx="4"/>`).join('')}
          <rect class="rm-card-face" x="878" y="354" width="44" height="62" rx="4"/>
          <circle class="rm-card-mark" cx="900" cy="385" r="11"/>
          <circle class="rm-card-mark" cx="900" cy="385" r="5"/>
          <text class="obj-say" x="900" y="342" text-anchor="middle">Tarot</text>
        </g>
        <g class="obj obj-coins${aura('iching')}" data-room="iching" tabindex="0" role="button" aria-label="I Ching">
          <ellipse class="obj-aura" cx="972" cy="392" rx="34" ry="19"/>
          ${[[956, 398], [984, 402], [970, 380]].map(([x, y], i) =>
            `<g class="rm-coin" style="--i:${i}"><circle cx="${x}" cy="${y}" r="12"/>
              <rect class="rm-coin-hole" x="${x - 4}" y="${y - 4}" width="8" height="8" rx="1"/></g>`).join('')}
          <text class="obj-say" x="972" y="352" text-anchor="middle">I Ching</text>
        </g>
        <g class="obj obj-oracle${aura('oracle')}" data-room="oracle" tabindex="0" role="button" aria-label="Oracle cards">
          <ellipse class="obj-aura" cx="1046" cy="378" rx="32" ry="26"/>
          <g transform="rotate(-5 1046 378)">
            <rect class="rm-oracle" x="1028" y="348" width="36" height="58" rx="4"/>
            <path class="rm-oracle-star" d="M1046,362 L1050,374 L1062,378 L1050,382 L1046,394 L1042,382 L1030,378 L1042,374Z"/>
          </g>
          <text class="obj-say" x="1046" y="338" text-anchor="middle">Oracle</text>
        </g>
        <g class="obj obj-charms${aura('charms')}" data-room="charms" tabindex="0" role="button" aria-label="Charm casting">
          <ellipse class="obj-aura" cx="1114" cy="398" rx="36" ry="20"/>
          ${[[1096, 396, 5], [1110, 403, 4], [1124, 394, 5.5], [1118, 386, 3.5],
             [1132, 404, 4], [1102, 387, 4.5], [1140, 392, 3]].map(([x, y, r], i) =>
            `<circle class="rm-charm" style="--i:${i}" cx="${x}" cy="${y}" r="${r}"/>`).join('')}
          <text class="obj-say" x="1114" y="358" text-anchor="middle">Charms</text>
        </g>
        <text class="rm-say" x="1004" y="580" text-anchor="middle">The oracle awaits your question</text>
      </g>
    </svg>
  </div>`;
}

/* ---------- the main room ----------
   The ground floor, and the room you arrive in. Everything in here is a thing
   you MAKE something with — an instrument, a desk, a shelf, a counter — which
   is the difference between this floor and the one above it, where everything
   is a thing you sit with.

   Laid out left to right the way you would meet it walking in: the bookshelf
   and the writing desk against the left wall, the piano and its band holding
   the middle, the bar along the right, and below them the two small places
   that are not about output at all — the nook you go to to feel something, and
   the wall where the coincidences are pinned up. */
function mainRoomHTML(){
  const books   = (S.entries || []).filter(e => e.type === 'media').length;
  const synch   = (S.entries || []).filter(e => e.type === 'synchronicity').length;
  const musical = (S.skills || []).filter(s => /music|piano|guitar|sing|jazz|instrument/i.test(
                    (s.name || '') + ' ' + (s.cat || ''))).length;
  const drinks  = (S.entries || []).filter(e => e.type === 'drink').length;

  const floor = Array.from({length: 7}, (_, i) =>
    `<path class="rm-plank" d="${roomEdge(0, 396 + i * 30, 1200, 390 + i * 30, 'mfl' + i)}"/>`).join('');
  const wall = Array.from({length: 10}, (_, i) =>
    `<path class="rm-brush" d="${roomEdge(64 + i * 120, 16, 70 + i * 120, 380, 'mwall' + i)}"/>`).join('');

  /* a book for every piece of media logged, up to a full shelf */
  const shelf = (y, n, seed) => Array.from({length: n}, (_, i) => {
    const x = 74 + i * 15, h = 38 + ((i * 7 + seed) % 5) * 5;
    return `<rect class="rm-book" x="${x}" y="${y - h}" width="${11 + (i % 3)}" height="${h}" rx="1.5"/>`;
  }).join('');
  const onShelf = Math.min(books, 24);

  return `<div class="room-wrap house-room rv">
    <svg class="sacred-room" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid meet"
      role="group" aria-label="The main room: a piano, a bookshelf, a desk, a bar and a wall of coincidences">
      <defs>
        <radialGradient id="hmGlow"><stop offset="0" stop-color="var(--rm-light)" stop-opacity=".5"/>
          <stop offset="1" stop-color="var(--rm-light)" stop-opacity="0"/></radialGradient>
      </defs>

      <g class="rm-bg">
        <rect x="0" y="0" width="1200" height="392" class="rm-wall"/>
        <rect x="0" y="392" width="1200" height="208" class="rm-floor"/>
        <g class="rm-tex">${wall}${floor}</g>
        <path class="rm-line" d="${roomEdge(0, 392, 1200, 392, 'mskirt')}"/>
        <!-- The shoji at the back, standing open. Two panels with a gap of warm
             light between them: drawn as one wide grid it read as a window,
             and a window is not a door to anywhere. -->
        <g class="hm-shoji">
          <rect class="hm-shoji-gap" x="572" y="72" width="56" height="290"/>
          ${[[440], [628]].map(([x]) => `<g class="hm-panel">
            <rect x="${x}" y="72" width="132" height="290" rx="2"/>
            ${[1,2].map(i => `<path d="M${x + 44 * i},72 V362"/>`).join('')}
            ${[1,2,3,4].map(i => `<path d="M${x},${72 + 58 * i} H${x + 132}"/>`).join('')}
          </g>`).join('')}
        </g>
      </g>

      <!-- the bookshelf: one book for every piece of media you logged -->
      <g class="zone zone-books" data-room="library" tabindex="0" role="button" aria-label="The shelf — your library">
        <rect class="rm-shelf-box" x="58" y="120" width="180" height="250" rx="3"/>
        <path class="rm-line" d="${roomEdge(62, 204, 234, 204, 'msha')}"/>
        <path class="rm-line" d="${roomEdge(62, 288, 234, 288, 'mshb')}"/>
        ${shelf(202, Math.min(onShelf, 10), 1)}
        ${shelf(286, Math.max(0, Math.min(onShelf - 10, 10)), 3)}
        ${shelf(368, Math.max(0, onShelf - 20), 5)}
        <g class="hs-candle sm" transform="translate(214,118)">
          <rect class="rm-wax" x="-5" y="-16" width="10" height="20" rx="2"/>
          <g class="rm-flame" style="--fl:.8"><path class="rm-flame-out" d="M0,-30 C6,-23 5,-18 0,-16 C-5,-18 -6,-23 0,-30Z"/></g>
        </g>
        <path class="hm-trail" d="M64,128 C48,164 58,206 44,244 C36,268 44,290 38,312"/>
        <text class="rm-say" x="148" y="392" text-anchor="middle">Every book is a door</text>
      </g>

      <!-- the desk: where the writing happens -->
      <g class="zone zone-desk" data-room="writing" tabindex="0" role="button" aria-label="The desk — the writing studio">
        <path class="hm-desk" d="M58,470 H266 L276,486 H48 Z"/>
        <path class="rm-table-leg" d="M70,486 L74,566"/>
        <path class="rm-table-leg" d="M254,486 L250,566"/>
        <rect class="hm-paper" x="112" y="446" width="66" height="26" rx="1" transform="rotate(-3 145 459)"/>
        <rect class="hm-paper" x="122" y="440" width="66" height="26" rx="1" transform="rotate(2 155 453)"/>
        <path class="hm-lamp" d="M228,468 V430 C228,416 244,412 250,424"/>
        <path class="hm-lampshade" d="M236,424 L266,424 L258,440 H244Z"/>
        <circle class="hm-lamplight" cx="251" cy="452" r="46" fill="url(#hmGlow)"/>
        <ellipse class="hm-ink" cx="90" cy="466" rx="9" ry="5"/>
        <text class="rm-say" x="160" y="588" text-anchor="middle">Sit down. The words are waiting.</text>
      </g>

      <!-- the piano, and the band around it -->
      <g class="zone zone-piano" data-room="piano" tabindex="0" role="button" aria-label="The piano — your skills">
        <ellipse class="rm-table-glow" cx="560" cy="470" rx="196" ry="66"/>
        <path class="hm-piano-lid" d="M404,398 C470,356 660,352 726,392 L700,404 C640,372 474,376 420,406Z"/>
        <path class="hm-piano-body" d="M404,404 H726 L716,470 C640,486 474,486 414,470Z"/>
        ${Array.from({length: 17}, (_, i) =>
          `<rect class="hm-key" x="${430 + i * 16}" y="472" width="13" height="26" rx="1.5"/>`).join('')}
        ${Array.from({length: 17}, (_, i) => (i % 7 === 2 || i % 7 === 6) ? '' :
          `<rect class="hm-key dark" x="${440 + i * 16}" y="472" width="7" height="16" rx="1"/>`).join('')}
        <path class="rm-table-leg" d="M430,498 L426,558 M700,498 L704,558"/>
        ${musical ? `<g class="hm-score"><rect x="524" y="352" width="72" height="46" rx="2"/>
          ${[0,1,2,3].map(i => `<path d="M532,${364 + i * 9} H588"/>`).join('')}</g>` : ''}
        <text class="rm-say" x="560" y="584" text-anchor="middle">Make something beautiful</text>
      </g>

      <!-- the rest of the band: a different kind of making, so a different door -->
      <g class="zone zone-band" data-room="band" tabindex="0" role="button" aria-label="The band — your projects">
        <ellipse class="hm-bass" cx="790" cy="452" rx="34" ry="52"/>
        <path class="hm-bass-neck" d="M790,400 V318"/>
        <path class="hm-bass-str" d="M782,404 V330 M790,404 V326 M798,404 V330"/>
        <circle class="hm-drum" cx="862" cy="486" r="34"/>
        <ellipse class="hm-cymbal" cx="880" cy="424" rx="30" ry="7"/>
        <path class="hm-cymbal-post" d="M880,428 V486"/>
        <path class="hm-sax" d="M918,404 C930,404 936,416 936,432 L936,470 C936,486 922,494 910,486"/>
        <text class="rm-say" x="862" y="556" text-anchor="middle">What are we building together?</text>
      </g>

      <!-- the bar: three doors on one counter -->
      <g class="zone zone-bar" aria-label="The bar">
        <rect class="hm-backbar" x="968" y="116" width="196" height="196" rx="3"/>
        <path class="rm-line" d="${roomEdge(972, 182, 1160, 182, 'mbara')}"/>
        <path class="rm-line" d="${roomEdge(972, 248, 1160, 248, 'mbarb')}"/>

        <g class="obj obj-medicine" data-room="medicine" tabindex="0" role="button" aria-label="The medicine cupboard">
          <ellipse class="obj-aura" cx="1066" cy="150" rx="94" ry="30"/>
          ${Array.from({length: 18}, (_, i) =>
            `<rect class="hm-drawer" x="${978 + (i % 6) * 31}" y="${124 + Math.floor(i / 6) * 19}"
               width="26" height="15" rx="2"/>`).join('')}
          <text class="obj-say" x="1066" y="114" text-anchor="middle">what the body needs</text>
        </g>
        <g class="obj obj-crystals" data-room="crystals" tabindex="0" role="button" aria-label="The crystals — charm casting">
          <ellipse class="obj-aura" cx="1066" cy="222" rx="90" ry="28"/>
          ${[[996, 8, 26], [1020, 11, 34], [1048, 7, 22], [1074, 12, 36],
             [1104, 9, 28], [1134, 7, 23]].map(([x, w, h], i) =>
            `<path class="hm-crystal" style="--i:${i}" d="M${x},244 L${x - w},${244 - h * .55}
               L${x},${244 - h} L${x + w},${244 - h * .55}Z"/>`).join('')}
          <text class="obj-say" x="1066" y="270" text-anchor="middle">Charms</text>
        </g>
        <path class="hm-counter" d="M940,404 H1190 L1200,430 H930 Z"/>
        <path class="hm-counter-front" d="M930,430 H1200 V560 H946 Z"/>
        <g class="obj obj-drinks" data-room="drinks" tabindex="0" role="button"
           aria-label="The bar — the drink naming ceremony">
          <ellipse class="obj-aura" cx="1060" cy="380" rx="96" ry="34"/>
          <!-- the coffee machine, and its steam -->
          <rect class="hm-machine" x="948" y="336" width="52" height="66" rx="4"/>
          <rect class="hm-machine-cup" x="962" y="386" width="24" height="16" rx="2"/>
          <path class="hm-steam" d="M974,330 C966,318 982,310 974,296"/>
          <path class="hm-steam" style="--i:1" d="M986,332 C978,322 992,314 984,302"/>
          ${Array.from({length: Math.min(6 + drinks, 14) }, (_, i) => {
            const x = 1014 + i * 13, h = 30 + ((i * 5) % 4) * 7;
            return `<g class="hm-bottle" style="--i:${i}">
              <rect x="${x}" y="${402 - h}" width="9" height="${h}" rx="2"/>
              <rect class="hm-bottle-neck" x="${x + 3}" y="${396 - h}" width="3" height="8"/></g>`; }).join('')}
          <text class="obj-say" x="1060" y="326" text-anchor="middle">What does your spirit need?</text>
        </g>
        <text class="rm-say" x="1060" y="584" text-anchor="middle">The bar</text>
      </g>

      <!-- the nook: the one place in the house that is not for producing anything -->
      <g class="zone zone-nook" data-room="nook" tabindex="0" role="button" aria-label="The nook — reflections">
        <circle class="hm-nook-glow" cx="330" cy="470" r="96" fill="url(#hmGlow)"/>
        <path class="hm-chair-back" d="M296,468 C296,418 312,404 336,404 C360,404 376,418 376,468Z"/>
        <path class="hm-chair-seat" d="M290,468 H382 L388,494 H284Z"/>
        <path class="rm-table-leg" d="M296,494 L292,538 M376,494 L380,538"/>
        <path class="hm-blanket" d="M292,438 C276,452 272,474 278,496 C288,492 296,480 298,466Z"/>
        <g class="hs-candle sm" transform="translate(404,492)">
          <rect class="rm-wax" x="-5" y="-16" width="10" height="20" rx="2"/>
          <g class="rm-flame" style="--fl:.9"><path class="rm-flame-out" d="M0,-30 C6,-23 5,-18 0,-16 C-5,-18 -6,-23 0,-30Z"/></g>
        </g>
        <text class="rm-say" x="334" y="562" text-anchor="middle">Feel everything. Write it down.</text>
      </g>

      <!-- the wall where the coincidences are pinned, and the map beside it -->
      <g class="zone zone-synch" data-room="synch" tabindex="0" role="button"
         aria-label="The synchronicity wall">
        <!-- the board the notes are pinned to. Without it they were squares
             hanging in mid-air, which reads as a rendering fault rather than
             as a wall. -->
        <rect class="hm-board" x="248" y="112" width="228" height="128" rx="3"/>
        ${Array.from({length: Math.min(Math.max(synch, 3), 14)}, (_, i) => {
          const x = 258 + (i % 7) * 30, y = 124 + Math.floor(i / 7) * 44;
          const r = ((i * 31) % 15) - 7;
          return `<rect class="hm-pin-note" x="${x}" y="${y}" width="24" height="24" rx="1"
                    transform="rotate(${r} ${x + 12} ${y + 12})"/>`; }).join('')}
        ${Array.from({length: 5}, (_, i) =>
          `<path class="hm-thread" style="--i:${i}" d="M${270 + i * 30},${138 + (i % 2) * 44}
             Q${298 + i * 26},${184} ${328 + i * 28},${148 + ((i + 1) % 2) * 44}"/>`).join('')}
        <text class="rm-say" x="362" y="266" text-anchor="middle">Everything is connected. Look.</text>
      </g>
    </svg>
  </div>`;
}

/* ---------- the frame every zone is drawn in ---------- */
function houseHTML(){
  const z = houseZoneOf(houseZone());
  const body = {sanctuary: sanctuaryHTML, main: mainRoomHTML}[z.id];
  return `<div class="page house-page">
    <div class="house-stage" data-zone="${z.id}" data-light="${houseHour()}">
      ${body ? body() : `<div class="room-wrap house-room"><div class="empty house-todo">
        ${esc(z.name)} is still being built. The stairs and the garden path work;
        what is behind them is on its way.</div></div>`}
    </div>
    <!-- The ways out and the plan of the house sit under the scene rather than
         on top of it. In the corner, which is where a mini-map belongs in a
         game, the plan landed squarely on the oracle table — and a control
         that covers the most important object in the room is not a control,
         it is an obstacle. -->
    <div class="house-nav">
      ${houseExitsHTML(z)}
      ${houseMapHTML(z)}
    </div>
  </div>`;
}
/* the ways out, at the edge they lead to */
function houseExitsHTML(z){
  return `<div class="house-exits">${z.exits.map(([id, dir, label]) =>
    `<button class="house-exit hx-${dir}" data-hgo="${id}" data-hdir="${dir}"
      title="${esc(label)}"><span class="hx-arrow" aria-hidden="true">${
        {left:'←', right:'→', up:'↑', down:'↓'}[dir]}</span>${esc(label)}</button>`).join('')}</div>`;
}
/* the plan of the house, with where you are standing lit */
function houseMapHTML(z){
  const cell = id => { const n = houseZoneOf(id);
    return `<button class="hm-cell${z.id === id ? ' on' : ''}" data-hgo="${id}"
      title="${esc(n.name)}" aria-current="${z.id === id}">${id[0].toUpperCase()}</button>`; };
  return `<div class="house-map" role="group" aria-label="the house">
    <div class="hm-row">${cell('roof')}</div>
    <div class="hm-row">${cell('sanctuary')}</div>
    <div class="hm-row">${cell('garden')}${cell('main')}</div>
  </div>`;
}

/* ---------- what the objects do ----------
   Every portal opens the thing it is a picture of. Where that thing lives on
   Today rather than at an address of its own, the section is opened and
   scrolled to rather than merely navigated near. */
function houseOpenToday(sectionId){
  navigate('#/today');
  setTimeout(() => {
    const d = document.getElementById(sectionId);
    if(!d) return;
    d.open = true;
    d.scrollIntoView({block:'start', behavior: reduced() ? 'auto' : 'smooth'});
  }, 220);
}
const HOUSE_PORTALS = {
  /* the sanctuary floor */
  mirror:    () => houseOpenToday('t-theatre'),
  blessing:  () => navigate('#/journals/gratitude'),
  fashion:   () => navigate('#/journals/manifestation'),
  soundbath: () => { const s = stillness(); s.prefs.kind = 'breath'; saveNow();
                     houseOpenToday('t-still'); },
  cushion:   () => openStillnessRing(),
  sanctuary: () => { const s = stillness(); s.prefs.kind = 'sanctuary'; saveNow();
                     houseOpenToday('t-still'); },
  shelf:     () => navigate('#/journals/library'),
  /* the main room */
  library:   () => navigate('#/journals/library'),
  writing:   () => navigate('#/content/shelf'),
  piano:     () => navigate('#/skills'),
  band:      () => navigate('#/projects'),
  medicine:  () => navigate('#/values'),
  crystals:  () => openCharmCast(),
  drinks:    () => openDrinkCeremony(),
  nook:      () => navigate('#/journals/reflection'),
  synch:     () => navigate('#/journals/synchronicity'),
  tarot:     () => openTarot(),
  iching:    () => openIChing(),
  oracle:    () => openOracle(),
  charms:    () => openCharmCast(),
};
function bindHouse(root){
  const scope = root || document;
  scope.querySelectorAll('[data-hgo]').forEach(b => b.onclick = () => {
    sound('click'); setHouseZone(b.dataset.hgo, b.dataset.hdir);
  });
  const wrap = scope.querySelector('.house-room'); if(!wrap) return;
  const enter = (el, then) => {
    wrap.classList.add('entering');
    el && el.classList.add('taken');
    setTimeout(() => { wrap.classList.remove('entering'); el && el.classList.remove('taken'); then(); },
      reduced() ? 0 : 260);
  };
  wrap.querySelectorAll('[data-room]').forEach(zn => {
    const act = () => {
      const open = HOUSE_PORTALS[zn.dataset.room];
      if(!open) return;
      sound('open');
      enter(zn, open);
    };
    zn.addEventListener('click', ev => { ev.stopPropagation(); act(); });
    zn.addEventListener('keydown', ev => {
      if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); act(); }
    });
  });
}

routes.house = function(root, params){
  /* the address decides; with no zone in it, you come back to where you were */
  const asked = params && params[0];
  S._houseZone = (asked && houseZoneOf(asked).id === asked) ? asked
    : ((S.settings && S.settings.houseZone) || 'main');
  root.innerHTML = houseHTML();
  bindHouse(root);
  /* the scene that just left slid out in the direction you walked; this one
     arrives behind it */
  const stage = root.querySelector('.house-stage');
  if(stage && _houseGoing){
    stage.dataset.arriving = _houseGoing; _houseGoing = null;
    requestAnimationFrame(() => stage.classList.add('arrived'));
  }
};
