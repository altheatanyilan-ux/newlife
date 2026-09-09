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

let smOpen = null;            // {pop, sel, items, idx} while a menu is up

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
  let last = null;
  pop.querySelector('.sm-list').innerHTML = items.map(({o, group}, i) => {
    const head = group && group !== last ? `<div class="sm-group mono">${esc(group)}</div>` : '';
    last = group;
    const label = o.label || o.textContent;
    return `${head}<button type="button" class="sm-opt${o.selected ? ' on' : ''}${o.disabled ? ' off' : ''}"
      data-smi="${i}" ${o.disabled ? 'disabled' : ''} role="option" aria-selected="${o.selected}">
      <span class="sm-tick">${o.selected ? '✓' : ''}</span><span class="sm-lbl">${esc(label)}</span></button>`;
  }).join('') || '<div class="sm-empty">Nothing to choose from.</div>';
  pop.querySelectorAll('[data-smi]').forEach(b => b.onclick = () => smPick(+b.dataset.smi));
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
  pop.remove();
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
  const usable = items.map((x, i) => x.o.disabled ? -1 : i).filter(i => i >= 0);
  if(!usable.length) return;
  const here = usable.indexOf(smOpen.idx);
  const next = usable[clamp((here < 0 ? 0 : here) + step, 0, usable.length - 1)];
  smOpen.idx = next;
  pop.querySelectorAll('.sm-opt').forEach(b => b.classList.toggle('cursor', +b.dataset.smi === next));
  pop.querySelector(`.sm-opt[data-smi="${next}"]`)?.scrollIntoView({block: 'nearest'});
}

function openSelectMenu(sel){
  if(smOpen && smOpen.sel === sel){ smClose(); return; }
  smClose();
  const items = smItems(sel);
  const pop = el(`<div class="sm-pop" role="listbox"><div class="sm-list"></div></div>`);
  document.body.appendChild(pop);
  sel.classList.add('sm-active');
  sel.setAttribute('aria-expanded', 'true');
  smOpen = {pop, sel, items, idx: Math.max(0, items.findIndex(x => x.o.selected))};
  smRender();
  smPlace();
  pop.querySelector(`.sm-opt[data-smi="${smOpen.idx}"]`)?.classList.add('cursor');
  pop.querySelector('.sm-opt.on')?.scrollIntoView({block: 'nearest'});
  pop.addEventListener('mousedown', ev => ev.stopPropagation());
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
    if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); smPick(smOpen.idx); return; }
    if(ev.key === 'Tab'){ smClose(); return; }
  }
  const sel = ev.target.closest && ev.target.closest('select');
  if(sel && smUsable(sel) && (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'ArrowDown')){
    ev.preventDefault(); openSelectMenu(sel);
  }
}, true);

addEventListener('scroll', () => { if(smOpen) smPlace(); }, true);
addEventListener('resize', () => { if(smOpen) smClose(); });
