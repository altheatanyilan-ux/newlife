/* ============================================================
   THE SELECT MENU — one dropdown, everywhere a choice is asked.

   A native <select> popup is drawn by the browser, not by the page:
   it takes its colours from the option's own background, and where
   that is not a solid colour the browser falls back to its own —
   which, against this house's palette, arrived as a near-black
   rectangle you could barely read. It cannot be styled reliably
   and it cannot be checked, so it is replaced here, exactly as the
   date picker replaced the browser's calendar.

   The <select> element itself stays in the DOM and keeps its value,
   so every existing read of .value and every change handler works
   unchanged. Only what opens on top of it is ours.
   ============================================================ */

let smOpen = null;            // {pop, sel, items, idx, shown, q} while a menu is up

/* SEARCHING, AND ADDING. A <select data-search> opens with a box at the top
   that narrows the list as you type — for the long lists, where scrolling to
   the thing is the slow part. A <select data-add> also offers what you typed
   as a new choice when nothing matches it exactly: the option is added to the
   <select> and picked, and an 'sm-add' event (detail: the text) says so, for
   a caller that keeps the list somewhere. Matching ignores case and accents,
   and a query of several words matches when every word is in the label. */
const smFold = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const smSearchable = sel => sel.hasAttribute('data-search') || sel.hasAttribute('data-add');

const smUsable = sel => sel && sel.tagName === 'SELECT' && !sel.multiple && !sel.disabled
  && (!sel.size || sel.size <= 1);

/* the options, flattened, keeping the group each one came from */
function smItems(sel){
  const out = [];
  Array.from(sel.children).forEach(node => {
    if(node.tagName === 'OPTGROUP'){
      Array.from(node.children).forEach(o => { if(o.tagName === 'OPTION') out.push({o, group: node.label}); });
    } else if(node.tagName === 'OPTION') out.push({o: node, group: null});
  });
  return out;
}

function smRender(){
  const {pop, sel, items} = smOpen;
  const q = smFold(smOpen.q);
  const words = q.split(/\s+/).filter(Boolean);
  const shown = items.map((x, i) => i).filter(i => {
    if(!words.length) return true;
    const it = items[i];
    const hay = smFold(`${it.o.label || it.o.textContent} ${it.group || ''}`);
    return words.every(w => hay.includes(w));
  });
  smOpen.shown = shown;
  let last = null;
  const exact = q && items.some(it => smFold(it.o.label || it.o.textContent) === q || smFold(it.o.value) === q);
  const canAdd = sel.hasAttribute('data-add') && q && !exact;
  const list = shown.map(i => {
    const {o, group} = items[i];
    const head = group && group !== last ? `<div class="sm-group mono">${esc(group)}</div>` : '';
    last = group;
    const label = o.label || o.textContent;
    return `${head}<button type="button" class="sm-opt${o.selected ? ' on' : ''}${o.disabled ? ' off' : ''}"
      data-smi="${i}" ${o.disabled ? 'disabled' : ''} role="option" aria-selected="${o.selected}">
      <span class="sm-tick">${o.selected ? '✓' : ''}</span><span class="sm-lbl">${esc(label)}</span></button>`;
  }).join('');
  pop.querySelector('.sm-list').innerHTML = list
    + (canAdd ? `<button type="button" class="sm-opt sm-addopt" data-smadd role="option">
      <span class="sm-tick">＋</span><span class="sm-lbl">Add “${esc(smOpen.q.trim())}”</span></button>` : '')
    || `<div class="sm-empty">${q ? 'Nothing matches that.' : 'Nothing to choose from.'}</div>`;
  pop.querySelectorAll('[data-smi]').forEach(b => b.onclick = () => smPick(+b.dataset.smi));
  const add = pop.querySelector('[data-smadd]');
  if(add) add.onclick = () => smAdd();
  /* the highlight follows the narrowing: the first match, or the new one */
  if(!shown.includes(smOpen.idx)) smOpen.idx = shown.find(i => !items[i].o.disabled) ?? (canAdd ? -2 : -1);
  if(smOpen.idx === -1 && canAdd) smOpen.idx = -2;
  smCursor();
}
function smCursor(){
  const {pop, idx} = smOpen;
  pop.querySelectorAll('.sm-opt').forEach(b => b.classList.toggle('cursor',
    idx === -2 ? b.hasAttribute('data-smadd') : +b.dataset.smi === idx));
}
/* what was typed becomes a choice of its own */
function smAdd(){
  if(!smOpen) return;
  const {sel} = smOpen; const text = String(smOpen.q || '').trim(); if(!text) return;
  const o = document.createElement('option'); o.value = text; o.textContent = text;
  sel.appendChild(o);
  smClose();
  sel.value = text;
  sel.dispatchEvent(new CustomEvent('sm-add', {bubbles: true, detail: text}));
  sel.dispatchEvent(new Event('input', {bubbles: true}));
  sel.dispatchEvent(new Event('change', {bubbles: true}));
  if(typeof sound === 'function') sound('click');
}

/* set the value the way a person choosing it would, so every existing
   onchange in the house fires exactly as before */
function smPick(i){
  if(!smOpen) return;
  const {sel, items} = smOpen;
  const it = items[i]; if(!it || it.o.disabled) return;
  const changed = sel.value !== it.o.value;
  sel.value = it.o.value;
  smClose();
  if(changed){
    sel.dispatchEvent(new Event('input', {bubbles: true}));
    sel.dispatchEvent(new Event('change', {bubbles: true}));
  }
  if(typeof sound === 'function') sound('click');
}

function smClose(){
  if(!smOpen) return;
  const {pop, sel} = smOpen;
  smOpen = null;
  const hadFocus = pop.contains(document.activeElement);
  pop.remove();
  if(hadFocus) sel.focus({preventScroll: true});
  sel.classList.remove('sm-active');
  sel.setAttribute('aria-expanded', 'false');
}

function smPlace(){
  if(!smOpen) return;
  const {pop, sel} = smOpen;
  const r = sel.getBoundingClientRect();
  pop.style.minWidth = Math.round(r.width) + 'px';
  const w = pop.offsetWidth, h = pop.offsetHeight;
  let left = r.left, top = r.bottom + 4;
  if(left + w > innerWidth - 10) left = Math.max(10, innerWidth - w - 10);
  if(top + h > innerHeight - 10){
    const above = r.top - h - 4;
    top = above >= 10 ? above : Math.max(10, innerHeight - h - 10);
  }
  pop.style.left = Math.round(left) + 'px';
  pop.style.top = Math.round(top) + 'px';
}

/* move the highlight without committing, the way a native list behaves */
function smMove(step){
  if(!smOpen) return;
  const {pop, items} = smOpen;
  const shown = smOpen.shown || items.map((x, i) => i);
  const usable = shown.filter(i => !items[i].o.disabled);
  if(pop.querySelector('[data-smadd]')) usable.push(-2);
  if(!usable.length) return;
  const here = usable.indexOf(smOpen.idx);
  const next = usable[clamp((here < 0 ? (step > 0 ? -1 : usable.length) : here) + step, 0, usable.length - 1)];
  smOpen.idx = next;
  smCursor();
  (next === -2 ? pop.querySelector('[data-smadd]') : pop.querySelector(`.sm-opt[data-smi="${next}"]`))?.scrollIntoView({block: 'nearest'});
}

function openSelectMenu(sel){
  if(smOpen && smOpen.sel === sel){ smClose(); return; }
  smClose();
  const items = smItems(sel);
  const search = smSearchable(sel);
  const pop = el(`<div class="sm-pop${search ? ' sm-searching' : ''}" role="listbox">${search
    ? `<input class="sm-q" type="search" autocomplete="off" spellcheck="false" placeholder="${
      sel.hasAttribute('data-add') ? 'search, or type a new one' : 'search'}" aria-label="search the choices">` : ''}<div class="sm-list"></div></div>`);
  document.body.appendChild(pop);
  sel.classList.add('sm-active');
  sel.setAttribute('aria-expanded', 'true');
  smOpen = {pop, sel, items, idx: Math.max(0, items.findIndex(x => x.o.selected)), q: ''};
  smRender();
  smPlace();
  pop.querySelector('.sm-opt.on')?.scrollIntoView({block: 'nearest'});
  pop.addEventListener('mousedown', ev => ev.stopPropagation());
  const box = pop.querySelector('.sm-q');
  if(box){
    /* the list keeps the height it opened at, so narrowing it does not make
       the menu jump about under the pointer */
    const lst = pop.querySelector('.sm-list'); lst.style.height = lst.offsetHeight + 'px';
    box.oninput = () => { if(!smOpen) return; smOpen.q = box.value; smRender(); };
    setTimeout(() => box.focus({preventScroll: true}), 0);
  }
}

/* ---------- wiring ----------
   Suppressed on mousedown, before the browser's own popup can open. */
document.addEventListener('mousedown', ev => {
  const sel = ev.target.closest && ev.target.closest('select');
  if(sel && smUsable(sel)){
    ev.preventDefault();
    sel.focus({preventScroll: true});
    openSelectMenu(sel);
    return;
  }
  if(smOpen && !ev.target.closest('.sm-pop')) smClose();
}, true);

document.addEventListener('keydown', ev => {
  if(smOpen){
    if(ev.key === 'Escape'){ ev.stopImmediatePropagation(); ev.preventDefault(); smClose(); return; }
    if(ev.key === 'ArrowDown'){ ev.preventDefault(); smMove(1); return; }
    if(ev.key === 'ArrowUp'){ ev.preventDefault(); smMove(-1); return; }
    const typing = ev.target && ev.target.classList && ev.target.classList.contains('sm-q');
    if(ev.key === 'Enter' || (ev.key === ' ' && !typing)){ ev.preventDefault();
      if(smOpen.idx === -2) smAdd(); else if(smOpen.idx >= 0) smPick(smOpen.idx); return; }
    if(ev.key === 'Tab'){ const s2 = smOpen.sel; smClose(); if(typing){ ev.preventDefault(); s2.focus(); } return; }
  }
  const sel = ev.target.closest && ev.target.closest('select');
  if(sel && smUsable(sel) && (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'ArrowDown')){
    ev.preventDefault(); openSelectMenu(sel);
  }
}, true);

addEventListener('scroll', () => { if(smOpen) smPlace(); }, true);
addEventListener('resize', () => { if(smOpen) smClose(); });
