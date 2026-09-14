/* ============================================================
   THE DRINK NAMING CEREMONY

   The bar in the main room is the only object in the house that makes
   something you can hold. You draw one card, and the card's own keywords
   decide what goes in the glass: the reading becomes a recipe, the recipe
   gets a name, and the name goes on a list that grows.

   It is the lightest thing in the instrument and that is deliberate. Every
   other practice here asks you to be honest about something; this one asks
   you to make a drink and write down what it tasted like. A house with no
   room in it for play is a clinic.

   The recipe is genuinely derived rather than picked from a list. Every card
   in the house already carries keywords — the tarot has five each, the oracle
   decks carry a line apiece — and those keywords are matched against a table
   of flavours. So the Star gives you something floral and the Ten of Swords
   gives you something bitter, every time, for a reason you can read back.
   ============================================================ */

/* what a word tastes like. Two dozen entries, each one an ingredient a person
   could actually find, with the note that says why it is there. Anything
   unmatched falls through to the base's own character rather than to nothing. */
const DRINK_FLAVOURS = [
  [/hope|renew|revival|dawn|spring|begin/i,        'chamomile',            'floral, forgiving'],
  [/passion|desire|fire|heat|courage|strength/i,   'chilli',               'a slow heat at the back'],
  [/change|transform|death|rebirth|turning/i,      'butterfly pea flower', 'goes from blue to violet'],
  [/wisdom|hermit|study|learn|know|teacher/i,      'ginseng',              'earthy, steadying'],
  [/love|lovers|union|heart|kind|tender/i,         'rose water',           'sweet, opening'],
  [/clarity|truth|sword|clear|honest|judge/i,      'peppermint',           'bright, clearing'],
  [/intuit|moon|dream|mystery|priestess|hidden/i,  'lavender',             'dreamy, receptive'],
  [/focus|work|craft|discipline|practice/i,        'matcha',               'bold and level'],
  [/rest|pause|sleep|still|quiet|patience/i,       'valerian',             'heavy-lidded'],
  [/grief|loss|sorrow|ruin|exhaust|defeat/i,       'bitter orange',        'the good kind of bitter'],
  [/abundance|empress|harvest|plenty|wealth/i,     'honey',                'thick, generous'],
  [/travel|journey|road|chariot|move|world/i,      'cardamom',             'smells like somewhere else'],
  [/fortune|luck|wheel|chance|risk/i,              'ginger',               'sharp, unpredictable'],
  [/home|family|four of wands|belong|root/i,       'cinnamon',             'the smell of a kitchen'],
  [/shadow|devil|fear|temptation|dark/i,           'black cardamom',       'smoke, and something under it'],
  [/star|wish|faith|guide|light/i,                 'elderflower',          'faint and far off'],
  [/sun|joy|play|delight|child/i,                  'blood orange',         'unembarrassed'],
  [/justice|balance|weigh|temperance|measure/i,    'green tea',            'nothing in excess'],
  [/tower|break|shock|sudden|collapse/i,           'mezcal smoke',         'the roof coming off'],
  [/patience|hang|wait|suspend|surrender/i,        'cold brew',            'made slowly on purpose'],
  [/magic|magician|will|make|create/i,             'yuzu',                 'sharper than it looks'],
  [/friend|company|three of cups|together/i,       'mint',                 'meant to be shared'],
  [/solitude|alone|retreat|withdraw/i,             'smoked salt',          'a rim for one'],
  [/money|coin|pentacle|earn|build/i,              'oat milk',             'plain and sustaining'],
];
const DRINK_BASES = [
  ['tea',     '\u{1F375}', 'Tea',          'hot water, and time'],
  ['coffee',  '☕',    'Coffee',       'the one that gets you upright'],
  ['cocktail','\u{1F378}', 'Cocktail',     'for an evening with an edge'],
  ['herbal',  '\u{1F33F}', 'Herbal brew',  'the one that is half medicine'],
];
const drinkBase = k => DRINK_BASES.find(b => b[0] === k) || DRINK_BASES[0];

/* the card, whichever system it came from, reduced to the two things a recipe
   needs: something to call it and some words to taste */
function drinkCardOf(system, deckId){
  if(system === 'tarot'){
    const c = TAROT[Math.floor(Math.random() * TAROT.length)];
    return {system:'tarot', id:c.n, name:c.n, words:(c.k || []).join(' '), line:(c.u || '').split('.')[0]};
  }
  const deck = ORACLE_DECKS.find(d => d.id === deckId) || ORACLE_DECKS[0];
  const i = oracleDraw(deck.id, 1)[0] || 0;
  const [name, line] = deck.cards[i];
  return {system:'oracle', deck:deck.id, id:String(i), name, words:name + ' ' + line, line};
}
/* Two or three ingredients, never the same one twice, in the order the card
   named them. A card whose words match nothing gets the base's own character
   rather than an empty glass — there is no such thing as a failed draw. */
function drinkRecipe(card, base){
  const out = [];
  DRINK_FLAVOURS.forEach(([re, name, note]) => {
    if(out.length >= 3) return;
    if(re.test(card.words) && !out.some(x => x.name === name)) out.push({name, note});
  });
  if(!out.length) out.push({name: drinkBase(base)[3], note: 'and nothing else in the way'});
  return {
    base,
    ingredients: out,
    name: `The ${String(card.name).replace(/^The\s+/i, '')}`,
    inspiredBy: {system: card.system, deck: card.deck || '', cardId: card.id, cardName: card.name},
    because: card.line || '',
  };
}

function drinkEntries(){
  return (S.entries || []).filter(e => e.type === 'drink')
    .sort((a, b) => (b.occurredAt || '') < (a.occurredAt || '') ? -1 : 1);
}

/* ---------- the ceremony ---------- */
function openDrinkCeremony(){
  let base = 'tea', card = null, rec = null;
  const m = openModal(`<div class="drink-rite">
    <h2 class="entry-h">What does your spirit need tonight?</h2>
    <p class="muted" style="font-size:.86rem;margin:0 0 14px">One card decides what goes in it.
      You decide what it is called.</p>
    <div class="field"><label>Start with</label>
      <div class="drink-bases">${DRINK_BASES.map(([k, ic, n, why]) =>
        `<button type="button" class="drink-base${k === base ? ' on' : ''}" data-dbase="${k}">
          <span class="db-ic">${ic}</span><b>${esc(n)}</b><span class="mono">${esc(why)}</span></button>`).join('')}</div></div>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:6px">
      <button class="btn primary" id="dkDraw">Draw a card</button>
      <button class="btn ghost" id="dkTarot">…from the tarot instead</button>
      <a class="btn sm ghost" href="#/journals/drink" id="dkArch">the menu →</a>
    </div>
    <div id="dkOut"></div>
  </div>`, 'narrow');

  m.querySelectorAll('[data-dbase]').forEach(b => b.onclick = () => {
    base = b.dataset.dbase;
    m.querySelectorAll('[data-dbase]').forEach(x => x.classList.toggle('on', x === b));
    if(card) draw(card.system);
  });
  m.querySelector('#dkArch').onclick = () => m.remove();

  const draw = system => {
    card = drinkCardOf(system);
    rec = drinkRecipe(card, base);
    sound('click');
    m.querySelector('#dkOut').innerHTML = `<div class="drink-card rv in">
      <div class="dk-from mono">${esc(card.system === 'tarot' ? 'Tarot' : 'Oracle')} · ${esc(card.name)}</div>
      ${rec.because ? `<p class="dk-because">${esc(rec.because)}</p>` : ''}
      <div class="field"><label>Call it</label>
        <input class="inp dk-name" id="dkName" value="${esc(rec.name)}"></div>
      <div class="dk-recipe">
        <div class="dk-base mono">${esc(drinkBase(base)[2])}</div>
        ${rec.ingredients.map(x => `<div class="dk-ing">
          <b>${esc(x.name)}</b><span class="mono">${esc(x.note)}</span></div>`).join('')}
      </div>
      <div class="field"><label>And when you drink it (optional)</label>
        <textarea class="ta" id="dkNote" style="min-height:56px"
          placeholder="Made this the night before the interview. It tasted like nerve."></textarea></div>
      <div class="row" style="justify-content:flex-end;gap:8px;margin-top:10px">
        <button class="btn sm ghost" id="dkAgain">draw again</button>
        <button class="btn primary" id="dkKeep">Add it to the menu</button></div>
    </div>`;
    m.querySelector('#dkAgain').onclick = () => draw(system);
    m.querySelector('#dkKeep').onclick = () => {
      const name = m.querySelector('#dkName').value.trim() || rec.name;
      S.entries.unshift({
        id: uid(), type:'drink', title: name,
        body: m.querySelector('#dkNote').value.trim(),
        occurredAt: today(), createdAt: new Date().toISOString(), media:[],
        links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[]},
        people:[], places:[], emotions:[], tags:['drink', base],
        extra:{drink:{base, ingredients: rec.ingredients, inspiredBy: rec.inspiredBy}},
      });
      saveNow(); sound('success');
      toast(`“${name}” is on the menu.`, 3600);
      m.remove(); rerender();
    };
  };
  m.querySelector('#dkDraw').onclick = () => draw('oracle');
  m.querySelector('#dkTarot').onclick = () => draw('tarot');
  return m;
}
