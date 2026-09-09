/* ============================================================
   THE KEYBOARD — one grammar, written down where it can be read.

   What was here before was three grammars at once. The Planning and
   Content rooms used bare letters; the Writing Studio used ⌘ chords;
   and most of the Studio's chords were ones the browser keeps for
   itself — ⌘N opens a window, ⌘T a tab, ⌘1 switches to the first tab —
   so they had never once reached the page. Nothing was written down
   anywhere, so none of it could be found without reading the source.

   The grammar is now one sentence long:

     Press the key. In the Writing Studio, hold ⌥ as well.

   Digits choose a view wherever a room has views. N makes the thing
   the room makes. ? shows this list. The Studio needs the ⌥ because
   you are always inside the text there, and a bare N would be an N.
   ============================================================ */

const SHORTCUT_GROUPS = [
  {scope:'*', name:'Anywhere', rows:[
    ['?',      'Show this list'],
    ['/  ·  ⌘K', 'Search everything'],
    ['N',      'Make something new'],
    ['Esc',    'Close what is open'],
    ['← →',    'Step through the Timeline stages'],
  ]},
  {scope:'content', name:'Content', line:[['1–4','switch view'],['N','catch an idea'],['W','open it in the Writing Studio']], rows:[
    ['1 2 3 4', 'Pipeline · Calendar · Shelf · Numbers'],
    ['N',       'Catch an idea'],
    ['W',       'Open the piece in the Writing Studio'],
  ]},
  {scope:'planning', name:'Planning', line:[['1–5','switch view'],['N','add a task'],['F','focus timer'],['T','today']], rows:[
    ['1 … 5', 'List · Calendar · Board · Matrix · Timeline'],
    ['N',     'Add a task'],
    ['F',     'Start the focus timer'],
    ['T',     'Jump to today'],
    ['H',     'Habits'],
    ['S',     'Statistics'],
    ['E',     'Open the first task'],
  ]},
  {scope:'writing', name:'The Writing Studio', line:[['⌥1–4','switch view'],['⌥N','new document'],['⌥R','readability'],['⌥⇧1','mark a passage']], note:'You are always inside the text here, so every key takes ⌥.', rows:[
    ['⌥1 … ⌥4', 'Editor · Corkboard · Outliner · Manuscript'],
    ['⌥N',      'New document'],
    ['⌥⇧N',     'New folder'],
    ['⌥D  ⌥B',  'Fold the drawer · fold the board'],
    ['⌥T',      'Typewriter scrolling'],
    ['⌥R',      'Readability — where a reader slows down'],
    ['⌥S',      'Take a snapshot'],
    ['⌥E',      'Compile and export'],
  ]},
  {scope:'writing', name:'Marking a draft', note:'Select a passage first. Holding ⇧ as well goes deeper.', rows:[
    ['⌥⇧1', 'Worth keeping'],
    ['⌥⇧2', 'The core of it'],
    ['⌥⇧3', "The line I'd quote"],
    ['⌥⇧0', 'Take the marks off'],
  ]},
];

/* the rooms whose own keys are worth naming on the page itself */
function shortcutsFor(scope){ return SHORTCUT_GROUPS.filter(g => g.scope === scope); }

/* ---------- the card ---------- */
function shortcutsHTML(here){
  const groups = SHORTCUT_GROUPS.filter(g => g.scope === '*' || g.scope === here)
    .concat(SHORTCUT_GROUPS.filter(g => g.scope !== '*' && g.scope !== here));
  const row = ([k, what]) => `<div class="kb-row"><span class="kb-keys">${k.split(/\s+/)
      .map(x => x === '·' ? '<i>·</i>' : x === '…' ? '<i>…</i>' : `<kbd>${esc(x)}</kbd>`).join(' ')}</span>
    <span class="kb-what">${esc(what)}</span></div>`;
  return `<h2>The keyboard</h2>
    <p class="muted" style="font-size:.86rem;margin-top:-6px">Press the key. In the Writing Studio, hold ⌥ as well.
      Nothing fires while you are typing into something.</p>
    <div class="kb-grid">${groups.map(g => `<section class="kb-group${g.scope === here ? ' here' : ''}">
      <div class="kb-head"><span class="sc">${esc(g.name)}</span>${g.scope === here ? '<span class="mono">this room</span>' : ''}</div>
      ${g.note ? `<div class="kb-note lora">${esc(g.note)}</div>` : ''}
      ${g.rows.map(row).join('')}</section>`).join('')}</div>
    <p class="faint" style="font-size:.76rem;margin-top:14px">A few chords belong to the browser and never reach a page —
      ⌘N opens a window, ⌘T a tab, ⌘1 switches to the first one. That is why the Studio uses ⌥ rather than ⌘.</p>`;
}
function openShortcuts(){ openModal(shortcutsHTML(parseHash().name), 'wide keyboard-card'); }

/* A one-line reminder for the top of a room that has its own keys. It is
   written out per group rather than derived from the rows: a derived line
   turned "1 2 3 4 — Pipeline · Calendar · Shelf · Numbers" into "1 pipeline",
   which says something false about what the other three digits do. */
function shortcutHintHTML(scope){
  const g = shortcutsFor(scope).find(x => x.line);
  if(!g) return '';
  return `<button class="kb-hint mono" data-kbhint title="every shortcut — or press ?">${
    g.line.map(([k, what]) => `<span><kbd>${esc(k)}</kbd>${esc(what)}</span>`).join('')
    }<span class="kb-more"><kbd>?</kbd>all of them</span></button>`;
}

/* ---------- the key ---------- */
document.addEventListener('keydown', ev => {
  if(ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if(typeof isTyping === 'function' ? isTyping() : /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return;
  if(ev.key !== '?') return;
  if(document.querySelector('.keyboard-card')) return closeModals();
  ev.preventDefault(); openShortcuts();
});
document.addEventListener('click', ev => {
  if(ev.target.closest('[data-kbhint]')){ ev.preventDefault(); openShortcuts(); }
});
