/* ============================================================
   THE SPREADS

   A spread is a set of questions with the cards left out. The card that
   lands in "what crosses you" is answering a different question from the
   same card in "what you hope for", and choosing the shape of the layout
   before you deal is most of the work of asking well.

   There were five. There are twenty, in five groups by how much of an
   afternoon they want: a card before breakfast, a three-card frame, a
   deeper look, the long classical layouts, and the ones for a particular
   occasion. Each carries the name AND the sense of every position, because
   "Crown" tells a person nothing and "what could be — the best of it, if
   you let it" tells them what to look for.

   Each position also names which of the six kinds of position it is, so
   the card's own line for that kind can be pulled out (see positionGuidance
   in 16-divination-cards.js). That used to be a table keyed by spread id,
   which does not survive going from five spreads to twenty.
   ============================================================ */

/* ---------- the groups ---------- */
const SPREAD_CATEGORIES = [
  {id:'quick',  name:'Quick draws',   hint:'One or two cards. A morning, a question with a yes in it.'},
  {id:'three',  name:'Foundation',    hint:'Three cards. The frame that fits most questions.'},
  {id:'depth',  name:'Depth',         hint:'Five to seven. When the short answer was not enough.'},
  {id:'major',  name:'Major',         hint:'Ten and up. An afternoon, and something that deserves one.'},
  {id:'special',name:'Special purpose',hint:'For an occasion: a shadow, a new moon, a year.'},
];

/* ---------- the twenty ----------
   `pos` is derived below from `positions`, because everything that reads a
   spread wants the names as a plain list and nothing should have to keep
   the two in step by hand. */
const SPREAD_LIBRARY = [
  /* — quick draws — */
  {id:'daily', name:'Daily card', cat:'quick', layout:'single',
   desc:'One card to set the tone. Pull it before the day starts and let it be a question you carry rather than an answer you got.',
   when:'A morning check-in.',
   positions:[
     {name:'Theme of the day', slot:'present', desc:'The energy or the lesson of today.'}]},

  /* The only spread whose answer IS the orientation, so it deals reversed
     cards whether or not the rest of the room does — with reversals off it
     would answer yes to everything, which is not an oracle, it is a wall. */
  {id:'yesno', name:'Yes or no', cat:'quick', layout:'single', forceRev:true,
   desc:'One card, read for its lean: upright inclines toward yes, reversed toward no, and the card itself says what kind of yes or no it is. The nuance is the point — a reversed Star is not the same no as a reversed Tower. This one deals reversals even if you have them switched off, because without them it has nothing to say.',
   when:'A question that really is binary.',
   positions:[
     {name:'The lean', slot:'outcome', desc:'Upright leans yes, reversed leans no — and the card says what sort.'}]},

  {id:'two_paths', name:'Two paths', cat:'quick', layout:'row',
   desc:'One card for each option, side by side, read against each other rather than on their own.',
   when:'Choosing between two things.',
   positions:[
     {name:'Path A', slot:'future', desc:'Where the first choice goes.'},
     {name:'Path B', slot:'future', desc:'Where the second one goes.'}]},

  /* — foundation — */
  {id:'ppf', name:'Past, present, future', cat:'three', layout:'row', alias:'three',
   desc:'The oldest three-card frame there is: what has brought you here, where you stand, and where the line runs next.',
   when:'A general reading when you are not sure what to ask.',
   positions:[
     {name:'What is behind', slot:'past',    desc:'What has brought you to this point.'},
     {name:'Where you are',  slot:'present', desc:'The shape of the present moment.'},
     {name:'What is coming', slot:'future',  desc:'Where the line runs from here.'}]},

  {id:'sao', name:'Situation, action, outcome', cat:'three', layout:'row', alias:'act',
   desc:'What is actually happening, what to do about it, and where doing that leads.',
   when:'A decision you have been going round in circles on.',
   positions:[
     {name:'The situation', slot:'present', desc:'What is actually happening, under what you have been telling yourself.'},
     {name:'What to do',    slot:'advice',  desc:'The action the situation is asking for.'},
     {name:'Where it goes',  slot:'outcome', desc:'Where taking that action lands you.'}]},

  {id:'mbs', name:'Mind, body, spirit', cat:'three', layout:'row',
   desc:'A check of the three floors of the house, when something is off and you cannot name which one.',
   when:'A holistic self-check.',
   positions:[
     {name:'Mind',   slot:'present', desc:'What your thinking is doing right now.'},
     {name:'Body',   slot:'present', desc:'What the body has been saying and you have been ignoring.'},
     {name:'Spirit', slot:'present', desc:'What the part of you that is not mind or body needs.'}]},

  {id:'kre', name:'Keep, release, embrace', cat:'three', layout:'row',
   desc:'For a threshold: what comes with you, what is put down at the door, and what is waiting on the other side.',
   when:'A transition, an ending, a letting go.',
   positions:[
     {name:'Keep',    slot:'present', desc:'What is worth carrying forward.'},
     {name:'Release', slot:'obstacle',desc:'What you are holding that is holding you.'},
     {name:'Embrace', slot:'future',  desc:'What is asking to be taken up.'}]},

  {id:'you_other', name:'You, the other, the connection', cat:'three', layout:'row',
   desc:'Three cards for two people: what each brings, and the third thing that exists only between them.',
   when:'Any relationship you want a quick read on.',
   positions:[
     {name:'You',              slot:'present', desc:'What you are bringing to this.'},
     {name:'Them',             slot:'present', desc:'What they are bringing, as far as the cards can say.'},
     {name:'The space between',slot:'present', desc:'The third thing — what exists because you are both in it.'}]},

  /* — depth — */
  {id:'cross5', name:'The cross', cat:'depth', layout:'cross',
   desc:'One issue, held still and looked at from five sides: its centre, what it came out of, where it is going, what you know about it, and what you have not admitted.',
   when:'A single knotted question.',
   positions:[
     {name:'The core',        slot:'present', desc:'The issue itself, stripped of the story around it.'},
     {name:'What it came from',slot:'past',   desc:'The history the issue is standing on.'},
     {name:'Where it goes',   slot:'future',  desc:'Where it runs if nothing changes.'},
     {name:'What you know',   slot:'present', desc:'The conscious part — what you would say if asked.'},
     {name:'What you have not said', slot:'obstacle', desc:'The part underneath: what you know and have not admitted.'}]},

  {id:'horseshoe', name:'Horseshoe', cat:'depth', layout:'horseshoe',
   desc:'Seven cards in an arc, covering a situation from every angle: where it came from, what is hidden in it, who else is in it, and what to do.',
   when:'A whole situation rather than a single question.',
   positions:[
     {name:'The past',      slot:'past',    desc:'What the situation grew out of.'},
     {name:'The present',   slot:'present', desc:'Where it stands now.'},
     {name:'Hidden influences', slot:'obstacle', desc:'What is at work in this that you cannot see.'},
     {name:'Obstacles',     slot:'obstacle',desc:'What stands in the way.'},
     {name:'Other people',  slot:'present', desc:'The influence of everyone else involved.'},
     {name:'What to do',    slot:'advice',  desc:'The counsel, plainly.'},
     {name:'Where it lands',slot:'outcome', desc:'The likeliest resolution.'}]},

  {id:'relationship', name:'A relationship', cat:'depth', layout:'cross', alias:'rel',
   desc:'Five cards on a bond: each person, the thing between them, the difficulty, and what it could become.',
   when:'A relationship worth an hour.',
   positions:[
     {name:'You',           slot:'present', desc:'What you are bringing to it.'},
     {name:'Them',          slot:'present', desc:'What they are bringing to it.'},
     {name:'Between you',   slot:'present', desc:'The connection itself, as its own thing.'},
     {name:'The difficulty',slot:'obstacle',desc:'What keeps going wrong, under the arguments.'},
     {name:'The counsel',   slot:'advice',  desc:'What the reading asks of you specifically.'}]},

  {id:'week', name:'The week ahead', cat:'depth', layout:'grid',
   desc:'One card per day, Monday to Sunday. Not a forecast — a set of seven questions to hold each morning.',
   when:'Sunday night, or the start of a week that matters.',
   positions:[
     {name:'Monday',    slot:'future', desc:'What Monday is asking.'},
     {name:'Tuesday',   slot:'future', desc:'What Tuesday is asking.'},
     {name:'Wednesday', slot:'future', desc:'What Wednesday is asking.'},
     {name:'Thursday',  slot:'future', desc:'What Thursday is asking.'},
     {name:'Friday',    slot:'future', desc:'What Friday is asking.'},
     {name:'Saturday',  slot:'future', desc:'What Saturday is asking.'},
     {name:'Sunday',    slot:'future', desc:'What Sunday is asking.'}]},

  /* The doc lays the chakras out in a circle with the twelve houses. They
     are drawn as a column here instead: these seven positions are places on
     a body, root at the base and crown at the head, and a ring throws that
     away for no gain. Everything else about the spread is as specified. */
  {id:'chakra', name:'The seven centres', cat:'depth', layout:'column',
   desc:'Root to crown, bottom to top: where the energy is moving freely and where it is stuck.',
   when:'An energy check, or a vague and locatable unwellness.',
   positions:[
     {name:'Root · security',      slot:'present', desc:'Safety, ground, money, the body’s base.'},
     {name:'Sacral · feeling',     slot:'present', desc:'Pleasure, appetite, creativity, what moves you.'},
     {name:'Solar plexus · will',  slot:'present', desc:'Power, agency, the sense of being able to act.'},
     {name:'Heart · love',         slot:'present', desc:'What you can give and what you can take in.'},
     {name:'Throat · voice',       slot:'present', desc:'What is being said and what is being swallowed.'},
     {name:'Third eye · sight',    slot:'present', desc:'Insight, intuition, what you already know.'},
     {name:'Crown · meaning',      slot:'present', desc:'The connection to whatever is larger than you.'}]},

  /* — major — */
  {id:'celtic_cross', name:'The Celtic cross', cat:'major', layout:'celtic_cross', alias:'cross',
   desc:'The classic. A cross of six around the heart of the matter, and a staff of four beside it for you, the room, the hope and the end.',
   when:'A complicated situation that deserves the long look.',
   positions:[
     {name:'The heart of it',   slot:'present', desc:'Where you are right now, at the centre of it.'},
     {name:'What crosses it',   slot:'obstacle',desc:'The immediate difficulty, lying across the first card.'},
     {name:'The root',          slot:'past',    desc:'The basis of the situation — what it is standing on.'},
     {name:'The past',          slot:'past',    desc:'What is passing away.'},
     {name:'What could be',     slot:'future',  desc:'The best of it, if you let it happen.'},
     {name:'What comes next',   slot:'future',  desc:'What is already approaching.'},
     {name:'You in it',         slot:'present', desc:'How you see yourself here.'},
     {name:'What surrounds you',slot:'present', desc:'The room: other people, conditions, weather.'},
     {name:'Hopes and fears',   slot:'future',  desc:'The thing you most want and most dread — usually one card.'},
     {name:'Where it lands',    slot:'outcome', desc:'The likeliest resolution of all of it.'}]},

  {id:'astro', name:'The twelve houses', cat:'major', layout:'circle',
   desc:'A card for each house of the chart, laid in a ring: a full survey of a year or a life, one department at a time.',
   when:'A birthday, a new year, a general audit.',
   positions:[
     {name:'I · self',        slot:'present', desc:'You, your body, how you arrive in a room.'},
     {name:'II · resources',  slot:'present', desc:'Money, possessions, what you value.'},
     {name:'III · voice',     slot:'present', desc:'Talk, siblings, short journeys, learning.'},
     {name:'IV · home',       slot:'past',    desc:'Family, roots, the place you come from.'},
     {name:'V · play',        slot:'present', desc:'Creation, romance, children, delight.'},
     {name:'VI · work',       slot:'present', desc:'Daily labour, health, routine, service.'},
     {name:'VII · the other', slot:'present', desc:'Partnership, marriage, open enemies.'},
     {name:'VIII · the depths',slot:'obstacle',desc:'Death, sex, debt, what is shared and what is buried.'},
     {name:'IX · the far',    slot:'future',  desc:'Travel, belief, philosophy, the long view.'},
     {name:'X · the summit',  slot:'outcome', desc:'Career, reputation, what you are known for.'},
     {name:'XI · the many',   slot:'future',  desc:'Friends, groups, hopes for the future.'},
     {name:'XII · the unseen',slot:'obstacle',desc:'The unconscious, the hidden, what undoes you quietly.'}]},

  {id:'tree', name:'The Tree of Life', cat:'major', layout:'tree',
   desc:'The ten sephiroth of the Kabbalistic tree, from crown to kingdom: a reading that runs from the most abstract thing in the question down to where it touches the ground.',
   when:'A spiritual question, or a practical one you suspect is a spiritual one.',
   positions:[
     {name:'Kether · crown',    slot:'outcome', desc:'The highest purpose in this — the thing above the question.'},
     {name:'Chokmah · wisdom',  slot:'advice',  desc:'The creative impulse; raw force before it has form.'},
     {name:'Binah · understanding',slot:'present',desc:'The form the impulse takes; the shaping, limiting side.'},
     {name:'Chesed · mercy',    slot:'present', desc:'Where you are generous, expansive, giving.'},
     {name:'Geburah · severity',slot:'obstacle',desc:'Where you must cut, judge, refuse.'},
     {name:'Tiphareth · beauty',slot:'present', desc:'The centre; the balancing heart of the matter.'},
     {name:'Netzach · victory', slot:'present', desc:'Feeling, desire, endurance — what you love.'},
     {name:'Hod · splendour',   slot:'present', desc:'Intellect, analysis, the words for it.'},
     {name:'Yesod · foundation',slot:'past',    desc:'The unconscious ground; dreams, habit, the machinery.'},
     {name:'Malkuth · kingdom', slot:'outcome', desc:'Where it arrives in the actual world.'}]},

  /* — special purpose — */
  {id:'shadow', name:'Shadow work', cat:'special', layout:'pyramid',
   desc:'Five cards on the part of yourself you do not show: what you present, what you hide, why, what the hidden thing is actually for, and how to carry both.',
   when:'Something you keep reacting to out of proportion.',
   positions:[
     {name:'The mask',    slot:'present', desc:'What you show; the self you have agreed to be.'},
     {name:'The shadow',  slot:'obstacle',desc:'What is behind it — the part you disown.'},
     {name:'The root',    slot:'past',    desc:'Where the split started.'},
     {name:'The gift',    slot:'advice',  desc:'What the shadow is protecting, or good for.'},
     {name:'Integration', slot:'outcome', desc:'How the two are carried as one thing.'}]},

  {id:'new_moon', name:'New moon intention', cat:'special', layout:'pyramid',
   desc:'Six cards for planting something: the intention itself, the conditions it needs, what feeds it, what it grows toward, and what it yields.',
   when:'A new moon, or any beginning you want to do deliberately.',
   positions:[
     {name:'The seed',   slot:'present', desc:'The intention itself, named plainly.'},
     {name:'The soil',   slot:'present', desc:'The conditions you are planting into.'},
     {name:'The water',  slot:'advice',  desc:'What must be given to it, regularly.'},
     {name:'The light',  slot:'advice',  desc:'What it needs to be turned toward.'},
     {name:'The growth', slot:'future',  desc:'How it will change while it grows.'},
     {name:'The harvest',slot:'outcome', desc:'What is actually gathered at the end.'}]},

  {id:'year_ahead', name:'The year ahead', cat:'special', layout:'grid',
   desc:'A card for the year and one for each of its months. Thirteen cards is an afternoon; the point is to write down what each one made you think, and read it back in December.',
   when:'A new year, or a birthday.',
   positions:[
     {name:'The theme of the year', slot:'outcome', desc:'What the whole year is about.'},
     {name:'January',  slot:'future', desc:'What January asks.'},
     {name:'February', slot:'future', desc:'What February asks.'},
     {name:'March',    slot:'future', desc:'What March asks.'},
     {name:'April',    slot:'future', desc:'What April asks.'},
     {name:'May',      slot:'future', desc:'What May asks.'},
     {name:'June',     slot:'future', desc:'What June asks.'},
     {name:'July',     slot:'future', desc:'What July asks.'},
     {name:'August',   slot:'future', desc:'What August asks.'},
     {name:'September',slot:'future', desc:'What September asks.'},
     {name:'October',  slot:'future', desc:'What October asks.'},
     {name:'November', slot:'future', desc:'What November asks.'},
     {name:'December', slot:'future', desc:'What December asks.'}]},

  {id:'custom', name:'Your own', cat:'special', layout:'row', custom:true,
   desc:'Name the positions yourself, one per line, up to twelve. Kept, so a layout you invent once can be dealt again.',
   when:'A question no published spread fits.',
   positions:[{name:'The card', slot:'present', desc:'Whatever you decide it is.'}]},
];

/* ---------- one card, one position ---------- */
/* `pos` is the plain list of names, which is what the reading, the saved
   entry and the fan prompt all want. Derived, never written twice. */
SPREAD_LIBRARY.forEach(s => { s.pos = s.positions.map(p => p.name); s.cardCount = s.positions.length; });

/* the five ids the app shipped with, still resolving after the library
   replaced them — old journal entries name them */
const SPREAD_ALIAS = {};
SPREAD_LIBRARY.forEach(s => { if(s.alias) SPREAD_ALIAS[s.alias] = s.id; });
SPREAD_ALIAS.one = 'daily';

function spreadById(id){
  if(!id) return spreadById('ppf');
  const custom = (divPrefs().customSpreads || []).find(s => s.id === id);
  if(custom) return customSpread(custom);
  return SPREAD_LIBRARY.find(s => s.id === id)
      || SPREAD_LIBRARY.find(s => s.id === SPREAD_ALIAS[id])
      || SPREAD_LIBRARY.find(s => s.id === 'ppf');
}
/* a saved custom layout, dressed as a spread so everything else can treat
   it like one */
function customSpread(rec){
  const base = SPREAD_LIBRARY.find(s => s.id === 'custom');
  const positions = (rec.positions || []).map(p => ({name:p.name, slot:p.slot || 'present', desc:p.description || ''}));
  return Object.assign({}, base, {id:rec.id, name:rec.name || 'Your own', custom:true,
    desc:rec.description || base.desc, positions, pos:positions.map(p => p.name), cardCount:positions.length});
}
const spreadsInCategory = cat => SPREAD_LIBRARY.filter(s => s.cat === cat)
  .concat(cat === 'special' ? (divPrefs().customSpreads || []).map(customSpread) : []);

/* ---------- a spread of your own ----------
   The library is fixed, which is right — these twenty are the ones that
   have been used for a century and they are not improved by editing. But a
   layout a person invents for a question only they have is a real thing,
   so: name it, name its positions one per line, and it is kept in the
   Special group with the rest. */
function openCustomSpread(existing, then){
  const rec = existing || null;
  const m = openModal(`<h2>${rec ? 'That spread of yours' : 'A spread of your own'}</h2>
    <div class="stack">
      <div class="field"><label>What do you call it?</label>
        <input class="inp serif-lg" id="csName" value="${esc(rec ? rec.name : '')}" placeholder="The one for Sunday nights"></div>
      <div class="field"><label>The positions, one to a line</label>
        <textarea class="inp" id="csPos" rows="7" placeholder="What I am avoiding
What it is costing
What to do about it tomorrow">${
          esc(rec ? (rec.positions || []).map(q => q.name).join('\n') : '')}</textarea>
        <div class="mono faint" style="margin-top:5px">Between one and twelve. A card is dealt for each.</div></div>
      <div class="row between">
        ${rec ? '<button class="btn danger" id="csDel">forget it</button>' : '<span></span>'}
        <button class="btn primary" id="csSave">${rec ? 'save it' : 'make it'}</button></div>
    </div>`, 'narrow');
  m.querySelector('#csSave').onclick = () => {
    const name = m.querySelector('#csName').value.trim();
    const lines = m.querySelector('#csPos').value.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 12);
    if(!name) return toast('It needs a name.');
    if(!lines.length) return toast('It needs at least one position.');
    const p = divPrefs();
    const out = {id: rec ? rec.id : 'own-' + uid(), name,
      positions: lines.map((n, i) => ({index: i, name: n, description: '', slot: 'present'})),
      createdAt: rec ? rec.createdAt : new Date().toISOString()};
    if(rec) p.customSpreads = p.customSpreads.map(x => x.id === rec.id ? out : x);
    else p.customSpreads.push(out);
    saveNow(); sound('success'); m.remove(); if(then) then(out.id);
  };
  if(rec) m.querySelector('#csDel').onclick = () => {
    const p = divPrefs();
    p.customSpreads = p.customSpreads.filter(x => x.id !== rec.id);
    saveNow(); m.remove(); if(then) then(null);
  };
}

/* which of the six kinds of position slot i is — read off the spread now,
   rather than from a table that had to be kept in step with one */
function tarotSlot(spreadId, i){
  const s = spreadById(spreadId);
  return (s.positions[i] && s.positions[i].slot) || 'present';
}

/* ============================================================
   WHERE THE CARDS GO

   A layout is a list of cells: column and row, counted in card widths and
   card heights, with an optional rotation. Fractions are allowed and
   normalised afterwards, so a layout can be written the way it looks
   rather than the way it indexes. `vs` tightens the vertical step where a
   layout is tall (the Tree of Life is seven rows deep).
   ============================================================ */
const SPREAD_LAYOUTS = {
  single: () => [{c:0, r:0}],
  row: n => Array.from({length:n}, (_, i) => ({c:i, r:0})),
  column: n => Array.from({length:n}, (_, i) => ({c:0, r:n - 1 - i})),   /* first named is lowest: root to crown */

  /* centre, then out of it: what it came from, where it goes, what is
     known, what is under it */
  cross: n => n <= 5
    ? [{c:1, r:1}, {c:0, r:1}, {c:2, r:1}, {c:1, r:0}, {c:1, r:2}].slice(0, n)
    : SPREAD_LAYOUTS.row(n),

  /* An arc rising left to right, the way the cards sit on a table. The
     radius is solved the same way the ring's is — at the two ends of the
     arc the cards are stacked vertically, so the chord has to clear a card
     height, not a card width. */
  horseshoe: n => {
    const step = Math.PI / Math.max(n - 1, 1);
    const R = Math.max(2, 1.14 * CARD_RATIO / (2 * Math.sin(step / 2)));
    return Array.from({length:n}, (_, i) => {
      const a = Math.PI - i * step;
      return {c: R * Math.cos(a), r: -(R / CARD_RATIO) * .74 * Math.sin(a)};
    });
  },

  /* the cross of six with the staff of four beside it. The second card lies
     across the first, which is the one place in any spread where a card is
     deliberately the wrong way round. */
  /* The left and right arms stand off a little further than a plain grid
     would put them: the crossing card is a card lying on its side, so it
     is a card HEIGHT wide, and the cards either side of it have to clear
     that rather than clear the card underneath it. */
  celtic_cross: () => [
    {c:1.15, r:1.5}, {c:1.15, r:1.5, rot:90}, {c:1.15, r:2.5}, {c:0, r:1.5},
    {c:1.15, r:.5}, {c:2.3, r:1.5}, {c:3.6, r:3}, {c:3.6, r:2},
    {c:3.6, r:1}, {c:3.6, r:0},
  ],

  /* A ring, first card at the left and going round the way a chart does.
     The radius is not chosen, it is solved for: the tightest gap on a ring
     is between the two cards at nine o'clock, where neighbours are a card
     HEIGHT apart rather than a card width, so the radius is whatever makes
     that chord clear. Guessing a radius here is how you get a wheel whose
     cards overlap at the sides and float apart at the top. */
  circle: n => {
    const R = Math.max(1.7, 1.14 * CARD_RATIO / (2 * Math.sin(Math.PI / Math.max(n, 3))));
    return Array.from({length:n}, (_, i) => {
      const a = Math.PI - (2 * Math.PI * i) / n;
      return {c: R * Math.cos(a), r: -(R / CARD_RATIO) * Math.sin(a)};
    });
  },

  /* three pillars: severity on the left, mercy on the right, the middle
     pillar between them */
  tree: () => [
    {c:1, r:0}, {c:2, r:1}, {c:0, r:1}, {c:2, r:2}, {c:0, r:2},
    {c:1, r:3}, {c:2, r:4}, {c:0, r:4}, {c:1, r:5}, {c:1, r:6},
  ],

  /* rows of four. Thirteen puts the year's own card alone on top. */
  grid: n => {
    const head = n === 13 ? 1 : 0, per = 4;
    const out = head ? [{c:1.5, r:0}] : [];
    for(let i = 0; i < n - head; i++){
      const row = Math.floor(i / per), inRow = Math.min(per, n - head - row * per);
      out.push({c: (i % per) + (per - inRow) / 2, r: row + head});
    }
    return out;
  },

  /* one, then two, then three, until they are all placed; the last row
     centred under the one above */
  pyramid: n => {
    const rows = []; let left = n, w = 1;
    while(left > 0){ const k = Math.min(w, left); rows.push(k); left -= k; w++; }
    const wide = Math.max(...rows), out = [];
    rows.forEach((k, r) => { for(let i = 0; i < k; i++) out.push({c: i + (wide - k) / 2, r}); });
    return out;
  },
};
/* How far apart the rows sit, as a multiple of one card plus its caption.
   Never below 1: a row step shorter than a card is two cards on top of each
   other, which is what the first version of this did to the Celtic cross's
   staff. Above 1 is breathing room for the layouts that want it. */
const LAYOUT_VS = {tree:1, celtic_cross:1.04, circle:1.02, horseshoe:1.06, grid:1.06};

/* The geometry of one spread, normalised so the top-left cell is at 0 and
   the caller knows how many card-widths and card-heights it needs. */
function spreadGeometry(sp){
  const fn = SPREAD_LAYOUTS[sp.layout] || SPREAD_LAYOUTS.row;
  const cells = fn(sp.cardCount).slice(0, sp.cardCount);
  while(cells.length < sp.cardCount) cells.push({c: cells.length, r: 0});
  const minC = Math.min(...cells.map(p => p.c)), minR = Math.min(...cells.map(p => p.r));
  const out = cells.map(p => ({c: p.c - minC, r: p.r - minR, rot: p.rot || 0}));
  return {cells: out, vs: Math.max(1, LAYOUT_VS[sp.layout] || 1.04),
    cols: Math.max(...out.map(p => p.c)) + 1, rows: Math.max(...out.map(p => p.r)) + 1};
}

/* the little diagram on a spread's tile in the chooser: the same geometry,
   at dot scale, so the shape of the layout is visible before it is chosen */
function spreadDotsHTML(sp){
  const g = spreadGeometry(sp);
  const W = g.cols * 10 + 6, H = g.rows * 10 * g.vs + 6;
  return `<svg class="sp-dots" viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}" aria-hidden="true">${
    g.cells.map(p => `<rect x="${(p.c * 10 + 3.4).toFixed(1)}" y="${(p.r * 10 * g.vs + 2.4).toFixed(1)}"
      width="4.2" height="6.2" rx="1"${p.rot ? ` transform="rotate(90 ${(p.c*10+5.5).toFixed(1)} ${(p.r*10*g.vs+5.5).toFixed(1)})"` : ''}/>`).join('')}</svg>`;
}

/* ============================================================
   THE TABLE

   The five spreads this replaced were all a row, so a flex row drew them.
   A Celtic cross is not a row, a Tree of Life is not a row, and the shape
   is half of what those spreads mean — the card lying across the first one
   is crossing it, and saying so in a caption is not the same.

   So: an absolutely positioned board, laid out from the geometry above,
   scaled down as one piece to whatever width there is. The cards get
   smaller as the spread gets bigger, which is what happens on a real
   table too; the reading underneath is where each card is actually read,
   and it is full size there.
   ============================================================ */
const spreadCardW = n => n <= 3 ? 200 : n <= 7 ? 170 : n <= 10 ? 145 : 125;
const CARD_RATIO = 351 / 200;

function tarotBoardHTML(sp, slotHTML){
  const g = spreadGeometry(sp);
  const cw = spreadCardW(sp.cardCount), ch = Math.round(cw * CARD_RATIO);
  const named = cw >= 165;                       /* below that a label is a smudge */
  /* the vertical step has to clear the card AND the name that arrives under
     it, or a spread deeper than one row stacks on itself */
  const under = named ? 46 : 30;
  const stepX = cw * 1.14, stepY = (ch + under) * g.vs;
  const W = Math.round((g.cols - 1) * stepX + cw), H = Math.round((g.rows - 1) * stepY + ch + under);
  return `<div class="tc-boardwrap" data-board style="--bw:${W}px;--bh:${H}px">
    <div class="tc-board" style="width:${W}px;height:${H}px;--cw:${cw}px;--ch:${ch}px">${
    g.cells.map((p, i) => `<div class="tc-slot${named ? '' : ' bare'}${p.rot ? ' cross' : ''}" data-slot="${i}"
      style="left:${(p.c * stepX).toFixed(1)}px;top:${(p.r * stepY).toFixed(1)}px"
      title="${esc(sp.positions[i].name + ' — ' + (sp.positions[i].desc || ''))}">
      ${named ? `<span class="tc-pos mono">${esc(sp.positions[i].name)}</span>`
              : `<span class="tc-no mono">${i + 1}</span>`}
      ${slotHTML ? slotHTML(i) : `<div class="tc-hole" data-hole="${i}"></div>`}
      <div class="tc-capslot" data-cap="${i}"></div></div>`).join('')}</div></div>`;
}

/* The board is one fixed-size piece of geometry scaled to fit the room it
   is in — scaling it beats reflowing it, because a Celtic cross that
   reflows is not a Celtic cross. It will not shrink past legibility; below
   that it scrolls sideways instead. */
function tarotBoardFit(root){
  (root || document).querySelectorAll('[data-board]').forEach(wrap => {
    const board = wrap.firstElementChild; if(!board) return;
    const W = parseFloat(wrap.style.getPropertyValue('--bw')) || board.offsetWidth;
    const H = parseFloat(wrap.style.getPropertyValue('--bh')) || board.offsetHeight;
    const avail = wrap.clientWidth || wrap.parentElement?.clientWidth || W;
    /* Fit the width; let the height scroll. A chakra column IS tall and a
       Tree of Life IS tall — squeezing either into one screenful makes the
       cards too small to see, and the modal scrolls anyway. The height cap
       only catches the extremes. */
    const k = Math.max(.5, Math.min(1, avail / W, 1250 / H));
    board.style.transform = `scale(${k.toFixed(3)})`;
    wrap.style.height = Math.ceil(H * k) + 'px';
    wrap.classList.toggle('tight', W * k > avail + 1);
  });
}
