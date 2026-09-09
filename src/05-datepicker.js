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
  const input = ev.target.closest && ev.target.closest('input[type="date"]');
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
}, true);

/* a scroll or resize under an open calendar would leave it stranded */
addEventListener('scroll', () => { if(dpOpen) dpPlace(dpOpen.pop, dpOpen.input); }, true);
addEventListener('resize', () => { if(dpOpen) dpClose(); });
