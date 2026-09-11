/* ============================================================
   THE DATE PICKER — one calendar, everywhere a date is asked.

   Every date field in the house is still a real <input type="date">,
   so every existing read of .value and every change handler keeps
   working exactly as it did. What changes is what opens when you
   touch one: the browser's own picker is suppressed and this
   calendar opens in its place, so a date looks and behaves the same
   whether you are setting a birthday, a deadline or a snapshot.

   The year is both typeable and steppable, because a life has dates
   in it that are forty years from the month you happen to be on.

   Two fields are not real date inputs and still want the calendar:

   - A field that also takes a fuzzy date. "Occurred at" accepts
     "Summer 2019" and "age 15" as well as a Tuesday, so it has to
     stay a text field you can type prose into. It carries data-dp
     and a calendar button beside it; the button opens the same
     calendar, and typing is untouched.
   - An inline field opened by ed(path, {date:true}). Those are spans
     until you click them, so the calendar opens with the field.

   Times get their own popup for the same reason dates got one: the
   browser's clock is a different object on every platform, and on
   some of them touching the field opens nothing at all.
   ============================================================ */

const DP_DOW = ['Mo','Tu','We','Th','Fr','Sa','Su'];
let dpOpen = null;            // {pop, input, cursor} while a calendar is up

const dpValid = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
/* the month a freshly opened calendar should land on */
function dpCursorFor(input){
  const v = input.value;
  if(dpValid(v)) return parseDay(v);
  const min = input.min, max = input.max;
  if(dpValid(min) && today() < min) return parseDay(min);
  if(dpValid(max) && today() > max) return parseDay(max);
  return new Date();
}

function dpGridHTML(cursor, selected, input){
  const y = cursor.getFullYear(), m = cursor.getMonth();
  const first = new Date(y, m, 1);
  const lead = (first.getDay() + 6) % 7;                    // weeks start on Monday
  const days = new Date(y, m + 1, 0).getDate();
  const min = dpValid(input.min) ? input.min : null, max = dpValid(input.max) ? input.max : null;
  const cells = [];
  for(let i = 0; i < lead; i++) cells.push('<span class="dp-cell blank"></span>');
  for(let d = 1; d <= days; d++){
    const iso = `${y}-${pad(m + 1)}-${pad(d)}`;
    const off = (min && iso < min) || (max && iso > max);
    const cls = [iso === selected ? 'on' : '', iso === today() ? 'now' : '', off ? 'off' : ''].filter(Boolean).join(' ');
    cells.push(`<button type="button" class="dp-cell ${cls}" data-dpd="${iso}" ${off ? 'disabled' : ''}>${d}</button>`);
  }
  return cells.join('');
}

function dpRender(){
  if(!dpOpen) return;
  const {pop, input, cursor} = dpOpen;
  const sel = dpValid(input.value) ? input.value : null;
  pop.querySelector('.dp-grid').innerHTML = dpGridHTML(cursor, sel, input);
  pop.querySelector('[data-dpmonth]').value = cursor.getMonth();
  const yr = pop.querySelector('[data-dpyear]');
  if(document.activeElement !== yr) yr.value = cursor.getFullYear();
  dpBindCells();
}

function dpBindCells(){
  const {pop, input} = dpOpen;
  $$('[data-dpd]', pop).forEach(b => b.onclick = () => dpCommit(input, b.dataset.dpd));
}

/* write the value the way a user typing into the field would, so every
   existing oninput / onchange handler in the house fires unchanged */
function dpCommit(input, iso){
  input.value = iso;
  input.dispatchEvent(new Event('input', {bubbles: true}));
  input.dispatchEvent(new Event('change', {bubbles: true}));
  if(typeof sound === 'function') sound('click');
  dpClose();
}

function dpClose(){
  if(!dpOpen) return;
  const {pop, input} = dpOpen;
  dpOpen = null;
  pop.remove();
  input.classList.remove('dp-active');
  /* An inline ed() field is a live <input> only while it has focus: its blur
     handler writes the value and puts the span back. Clicking a day in the
     calendar took the focus away, so hand it back rather than let the field
     collapse with the click half-made. */
  if(input.isConnected && input.closest('.ed.editing')) input.focus({preventScroll:true});
}

function dpPlace(pop, input){
  const r = input.getBoundingClientRect();
  const w = pop.offsetWidth, h = pop.offsetHeight;
  let left = r.left, top = r.bottom + 6;
  if(left + w > innerWidth - 10) left = Math.max(10, innerWidth - w - 10);
  if(top + h > innerHeight - 10) top = Math.max(10, r.top - h - 6);   // flip above
  pop.style.left = Math.round(left) + 'px';
  pop.style.top = Math.round(top) + 'px';
}

function dpShiftMonth(n){
  if(!dpOpen) return;
  const c = dpOpen.cursor;
  dpOpen.cursor = new Date(c.getFullYear(), c.getMonth() + n, 1);
  dpRender();
}

function openDatePicker(input){
  if(dpOpen && dpOpen.input === input){ dpClose(); return; }
  dpClose();
  const cursor = dpCursorFor(input);
  cursor.setDate(1);
  const pop = el(`<div class="dp-pop" role="dialog" aria-label="Choose a date">
    <div class="dp-head">
      <button type="button" class="dp-nav" data-dpprev aria-label="Previous month">‹</button>
      <select class="dp-month" data-dpmonth aria-label="Month">${MONTHS.map((n, i) => `<option value="${i}">${n}</option>`).join('')}</select>
      <span class="dp-yearwrap">
        <button type="button" class="dp-nav sm" data-dpyprev aria-label="Previous year">‹</button>
        <input type="number" class="dp-year" data-dpyear inputmode="numeric" step="1" aria-label="Year">
        <button type="button" class="dp-nav sm" data-dpynext aria-label="Next year">›</button>
      </span>
      <button type="button" class="dp-nav" data-dpnext aria-label="Next month">›</button>
    </div>
    <div class="dp-dow">${DP_DOW.map(d => `<span>${d}</span>`).join('')}</div>
    <div class="dp-grid"></div>
    <div class="dp-foot">
      <button type="button" class="dp-lnk" data-dptoday>today</button>
      <button type="button" class="dp-lnk" data-dpclear>clear</button>
    </div>
  </div>`);
  document.body.appendChild(pop);
  input.classList.add('dp-active');
  dpOpen = {pop, input, cursor};
  dpRender();
  dpPlace(pop, input);

  pop.querySelector('[data-dpprev]').onclick = () => dpShiftMonth(-1);
  pop.querySelector('[data-dpnext]').onclick = () => dpShiftMonth(1);
  pop.querySelector('[data-dpyprev]').onclick = () => dpShiftMonth(-12);
  pop.querySelector('[data-dpynext]').onclick = () => dpShiftMonth(12);
  pop.querySelector('[data-dpmonth]').onchange = ev => {
    dpOpen.cursor = new Date(dpOpen.cursor.getFullYear(), +ev.target.value, 1); dpRender(); };
  /* the year is typed, not only stepped — four digits and the calendar moves */
  const yr = pop.querySelector('[data-dpyear]');
  yr.oninput = () => { const y = parseInt(yr.value, 10);
    if(y >= 1000 && y <= 9999){ dpOpen.cursor = new Date(y, dpOpen.cursor.getMonth(), 1); dpRender(); } };
  yr.onkeydown = ev => { if(ev.key === 'Enter'){ ev.preventDefault(); yr.blur(); } };
  pop.querySelector('[data-dptoday]').onclick = () => dpCommit(input, today());
  pop.querySelector('[data-dpclear]').onclick = () => dpCommit(input, '');
  pop.addEventListener('mousedown', ev => ev.stopPropagation());
}

/* ---------- wiring ----------
   The native picker is suppressed on mousedown (before it can open) and on
   the keyboard shortcut browsers give it, so there is exactly one calendar. */
document.addEventListener('mousedown', ev => {
  if(!ev.target.closest) return;
  /* the calendar button beside a fuzzy-date text field */
  const btn = ev.target.closest('[data-dpfor]');
  if(btn){
    ev.preventDefault();            // keep the focus where it is
    const f = document.getElementById(btn.dataset.dpfor);
    if(f) openDatePicker(f);
    return;
  }
  const input = ev.target.closest('input[type="date"]');
  if(input){
    if(input.readOnly || input.disabled) return;
    ev.preventDefault();            // stops the browser's own picker
    input.focus({preventScroll: true});
    openDatePicker(input);
    return;
  }
  if(dpOpen && !ev.target.closest('.dp-pop') && !ev.target.closest('.sm-pop')) dpClose();
}, true);

document.addEventListener('keydown', ev => {
  /* Escape belongs to the calendar while one is up. stopPropagation alone is
     not enough: the modal's own Escape handler sits on document too, and only
     stopImmediatePropagation keeps a dismissed calendar from also dismissing
     the modal it was opened from. */
  if(ev.key === 'Escape' && dpOpen){ ev.stopImmediatePropagation(); ev.preventDefault(); dpClose(); return; }
  const input = ev.target.closest && ev.target.closest('input[type="date"]');
  if(input && (ev.key === 'Enter' || ev.key === ' ') && !dpOpen){ ev.preventDefault(); openDatePicker(input); }
  /* a text field that also takes prose opens its calendar on the shortcut the
     browser gives a date field, never on a plain keystroke */
  const soft = ev.target.closest && ev.target.closest('input[data-dp]');
  if(soft && !dpOpen && (ev.altKey || ev.metaKey) && (ev.key === 'ArrowDown' || ev.key === 'Enter')){
    ev.preventDefault(); openDatePicker(soft); return; }
  /* the button is opened on mousedown, which never fires for someone on the
     keyboard: reaching it by Tab has to open the calendar too */
  const kbtn = ev.target.closest && ev.target.closest('[data-dpfor]');
  if(kbtn && (ev.key === 'Enter' || ev.key === ' ')){
    ev.preventDefault();
    const f = document.getElementById(kbtn.dataset.dpfor);
    if(f) openDatePicker(f);
  }
}, true);

const DP_ICON = `<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">
  <rect x="1.6" y="3.1" width="12.8" height="11.3" rx="2.2"></rect><path d="M1.6 6.6h12.8M5 1.6v2.6M11 1.6v2.6"></path>
  <circle cx="5.2" cy="9.6" r=".75" fill="currentColor" stroke="none"></circle><circle cx="8" cy="9.6" r=".75" fill="currentColor" stroke="none"></circle>
  <circle cx="10.8" cy="9.6" r=".75" fill="currentColor" stroke="none"></circle><circle cx="5.2" cy="12" r=".75" fill="currentColor" stroke="none"></circle>
  <circle cx="8" cy="12" r=".75" fill="currentColor" stroke="none"></circle></svg>`;
/* the button that sits beside a fuzzy-date text field */
function dpButtonHTML(forId, label = 'Pick a date'){
  return `<button type="button" class="dp-btn" data-dpfor="${esc(forId)}" title="${esc(label)}" aria-label="${esc(label)}">${DP_ICON}</button>`;
}

/* a scroll or resize under an open calendar would leave it stranded */
addEventListener('scroll', () => { if(dpOpen) dpPlace(dpOpen.pop, dpOpen.input); }, true);
addEventListener('resize', () => { if(dpOpen) dpClose(); });


/* ============================================================
   THE TIME PICKER — the same idea, for the hour.

   Wherever the house asks what time something happened, the field
   is a real <input type="time">, so every existing read of .value
   keeps working. What opens on top of it is ours: two columns,
   hours down one side and five-minute marks down the other, with
   the field still typeable for the minutes in between.
   ============================================================ */

let tpOpen = null;                       // {pop, input} while a clock is up
const tpValid = s => /^\d{2}:\d{2}/.test(s || '');
const tpNowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const tpParts = v => tpValid(v) ? {h: +v.slice(0, 2), m: +v.slice(3, 5)} : null;
/* a 24-hour clock is what the fields store; the label reads the way people speak */
function tpLabel(v){
  const p = tpParts(v); if(!p) return '—';
  const h12 = p.h % 12 === 0 ? 12 : p.h % 12;
  return `${h12}:${pad(p.m)} ${p.h < 12 ? 'am' : 'pm'}`;
}

function tpColsHTML(v){
  const p = tpParts(v);
  const hrs = [], mins = [];
  for(let h = 0; h < 24; h++)
    hrs.push(`<button type="button" class="tp-cell${p && p.h === h ? ' on' : ''}" data-tph="${h}">${pad(h)}</button>`);
  for(let m = 0; m < 60; m += 5)
    mins.push(`<button type="button" class="tp-cell${p && p.m === m ? ' on' : ''}" data-tpm="${m}">${pad(m)}</button>`);
  /* a minute that is not a five keeps its own place in the column rather than
     vanishing, so 07:23 survives being looked at */
  if(p && p.m % 5) mins.splice(Math.floor(p.m / 5) + 1, 0,
    `<button type="button" class="tp-cell on odd" data-tpm="${p.m}">${pad(p.m)}</button>`);
  return `<div class="tp-col" data-tpcol="h" role="listbox" aria-label="Hour">${hrs.join('')}</div>
    <div class="tp-col" data-tpcol="m" role="listbox" aria-label="Minute">${mins.join('')}</div>`;
}

/* A calendar is wide and sits under its field. A clock is narrow, so it goes
   beside it where there is room: dropped underneath it lands on whatever the
   form's own buttons are, and the modal that asks the hour has its Set button
   directly below the field. */
function tpPlace(pop, input){
  const r = input.getBoundingClientRect();
  const w = pop.offsetWidth, h = pop.offsetHeight;
  const right = r.right + 8, left = r.left - w - 8;
  let x, y = Math.min(Math.max(10, r.top), innerHeight - h - 10);
  if(right + w <= innerWidth - 10) x = right;
  else if(left >= 10) x = left;
  else { dpPlace(pop, input); return; }
  pop.style.left = Math.round(x) + 'px';
  pop.style.top  = Math.round(y) + 'px';
}

function tpRender(){
  if(!tpOpen) return;
  const {pop, input} = tpOpen;
  pop.querySelector('.tp-cols').innerHTML = tpColsHTML(input.value);
  pop.querySelector('.tp-val').textContent = tpLabel(input.value);
  $$('[data-tph]', pop).forEach(b => b.onclick = () => tpSet(+b.dataset.tph, null));
  $$('[data-tpm]', pop).forEach(b => b.onclick = () => tpSet(null, +b.dataset.tpm));
  $$('.tp-col', pop).forEach(col => { const on = col.querySelector('.on');
    if(on) col.scrollTop = on.offsetTop - col.clientHeight / 2 + on.offsetHeight / 2; });
}

/* Either column can be touched first, so a half-set time needs a whole one to
   land on: an unset field starts from the hour you are in, at the top of it. */
function tpSet(h, m){
  const {input} = tpOpen;
  const cur = tpParts(input.value) || {h: new Date().getHours(), m: 0};
  tpCommit(input, `${pad(h === null ? cur.h : h)}:${pad(m === null ? cur.m : m)}`);
  tpRender();
}

function tpCommit(input, val){
  input.value = val;
  input.dispatchEvent(new Event('input', {bubbles: true}));
  input.dispatchEvent(new Event('change', {bubbles: true}));
  if(typeof sound === 'function') sound('click');
}

function tpClose(){
  if(!tpOpen) return;
  const {pop, input} = tpOpen;
  tpOpen = null; pop.remove();
  input.classList.remove('dp-active');
}

function openTimePicker(input){
  if(tpOpen && tpOpen.input === input){ tpClose(); return; }
  tpClose(); dpClose();
  const pop = el(`<div class="tp-pop" role="dialog" aria-label="Choose a time">
    <div class="tp-head"><span class="tp-val mono"></span></div>
    <div class="tp-dow"><span>hour</span><span>min</span></div>
    <div class="tp-cols"></div>
    <div class="dp-foot">
      <button type="button" class="dp-lnk" data-tpnow>now</button>
      <button type="button" class="dp-lnk" data-tpclear>clear</button>
    </div>
  </div>`);
  document.body.appendChild(pop);
  input.classList.add('dp-active');
  tpOpen = {pop, input};
  tpRender();
  tpPlace(pop, input);
  pop.querySelector('[data-tpnow]').onclick = () => { tpCommit(input, tpNowHM()); tpRender(); };
  pop.querySelector('[data-tpclear]').onclick = () => { tpCommit(input, ''); tpClose(); };
  pop.addEventListener('mousedown', ev => ev.stopPropagation());
}

document.addEventListener('mousedown', ev => {
  if(!ev.target.closest) return;
  const input = ev.target.closest('input[type="time"]');
  if(input){
    if(input.readOnly || input.disabled) return;
    ev.preventDefault();            // stops whatever the browser would have shown
    input.focus({preventScroll: true});
    openTimePicker(input);
    return;
  }
  if(tpOpen && !ev.target.closest('.tp-pop')) tpClose();
}, true);

document.addEventListener('keydown', ev => {
  if(ev.key === 'Escape' && tpOpen){ ev.stopImmediatePropagation(); ev.preventDefault(); tpClose(); return; }
  const input = ev.target.closest && ev.target.closest('input[type="time"]');
  if(input && (ev.key === 'Enter' || ev.key === ' ') && !tpOpen){ ev.preventDefault(); openTimePicker(input); }
  /* typing into the field is still the fastest way to an odd minute — keep the
     open clock showing what the field now says */
  if(tpOpen && input === tpOpen.input) setTimeout(tpRender, 0);
}, true);

addEventListener('scroll', () => { if(tpOpen) tpPlace(tpOpen.pop, tpOpen.input); }, true);
addEventListener('resize', () => { if(tpOpen) tpClose(); });
