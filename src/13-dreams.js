/* ============================================================
   DREAMS — caught on waking, or honestly not caught at all

   A dream evaporates within minutes of opening your eyes, so the place to
   ask for one is the top of the day, beside the hour you woke, and not
   three pages into a journal. And "I don't remember dreaming" is a real
   answer about a night, not an absence of one: without somewhere to put it
   the record can never distinguish a night with no dream from a night you
   never asked about, and the calendar below depends on that difference.
   ============================================================ */

/* the nights this day's sleep belongs to: a dream is filed on the morning
   it was remembered, which is how a person talks about them */
function dreamsOn(day){ return (S.entries || []).filter(e => e.type === 'dream' && (e.occurredAt || '').slice(0,10) === day); }
function noDreamOn(day){ return !!S.checkins?.[day]?.noDream; }
function dreamStateOn(day){
  if(dreamsOn(day).length) return 'dreamt';
  if(noDreamOn(day)) return 'blank';
  return 'unasked';
}
function setNoDream(day, on){
  const c = checkin(day);
  if(on) c.noDream = true; else delete c.noDream;
  saveNow();
}

/* the button that sits beside "I woke up at" */
function dreamEdgeHTML(day = today()){
  const st = dreamStateOn(day), n = dreamsOn(day).length;
  return `<span class="dream-edge">${
    st === 'dreamt' ? `<button class="day-edge-t" id="dreamAdd" title="write another">☾ ${n} dream${n===1?'':'s'} written</button>`
    : st === 'blank' ? `<button class="day-edge-t muted-t" id="dreamNone" title="I did remember one after all">☾ no dream remembered</button>`
    : `<button class="day-edge-t" id="dreamAdd" title="write it before it goes">☾ record a dream</button>
       <button class="dream-none" id="dreamNone" title="nothing to write down for last night">none</button>`}</span>`;
}
function bindDreamEdge(root, day = today()){
  const add = $('#dreamAdd', root);
  if(add) add.onclick = () => openEntryModal({type:'dream', allowedTypes:['dream'],
    heading:'Last night', occurredAt: day, after: () => { setNoDream(day, false); rerender(); }});
  const none = $('#dreamNone', root);
  if(none) none.onclick = () => {
    const was = noDreamOn(day);
    setNoDream(day, !was);
    sound('click');
    toast(was ? 'Unmarked. Write it while it is still there.' : 'Noted — a night with nothing to write down is still a night on the record.');
    rerender();
  };
}

/* ---------- the calendar of nights ----------
   Three states, and the third is the point: a night dreamt, a night with
   nothing to write down, and a night nobody asked about. A calendar that
   only drew the first two would make an unbroken record out of a patchy
   one. */
const DREAM_CAL_MONTHS = 6;
/* month arithmetic on a YYYY-MM string: the day of the month is irrelevant
   here and rolling it through a Date would drag the 31st into March */
const dreamMonthShift = (ym, n) => { let y = +ym.slice(0,4), m = +ym.slice(5,7) - 1 + n;
  y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
  return `${y}-${pad(m + 1)}`; };
function dreamCalendarHTML(){
  const T = today();
  const back = S._dreamCalBack || 0;
  const anchor = dreamMonthShift(T.slice(0,7), -back);
  const months = [];
  for(let i = DREAM_CAL_MONTHS - 1; i >= 0; i--) months.push(dreamMonthShift(anchor, -i));
  const total = {dreamt:0, blank:0};
  const grid = months.map(m => {
    const y = +m.slice(0,4), mo = +m.slice(5,7);
    const first = `${y}-${pad(mo)}-01`;
    const days = new Date(y, mo, 0).getDate();
    /* Monday-first, like the rest of the house */
    const lead = (new Date(y, mo - 1, 1).getDay() + 6) % 7;
    const cells = [];
    for(let i = 0; i < lead; i++) cells.push('<i class="dc-pad"></i>');
    for(let d = 1; d <= days; d++){
      const day = `${y}-${pad(mo)}-${pad(d)}`;
      const st = dreamStateOn(day);
      if(st === 'dreamt') total.dreamt++; else if(st === 'blank') total.blank++;
      const ds = dreamsOn(day);
      const title = st === 'dreamt' ? `${fmtDate(day,'med')} — ${ds.map(e => e.title || (e.body||'').slice(0,60)).join(' · ')}`
        : st === 'blank' ? `${fmtDate(day,'med')} — no dream remembered`
        : `${fmtDate(day,'med')} — nothing recorded`;
      cells.push(`<button class="dc-day ${st}${day === T ? ' today' : ''}" data-dcday="${day}" title="${esc(title)}">${
        st === 'dreamt' && ds.length > 1 ? `<span class="dc-n">${ds.length}</span>` : ''}</button>`);
    }
    return `<div class="dc-month"><div class="dc-mname mono">${esc(fmtMonth(first))}</div>
      <div class="dc-grid">${'MTWTFSS'.split('').map(x => `<i class="dc-dow">${x}</i>`).join('')}${cells.join('')}</div></div>`;
  }).join('');
  const asked = total.dreamt + total.blank;
  return `<div class="otd rv dream-cal">
    <div class="row between" style="align-items:baseline">
      <div class="sc" style="margin:0">The nights</div>
      <span class="mono">${total.dreamt} dreamt · ${total.blank} blank${asked ? ` · ${Math.round(total.dreamt / asked * 100)}% recalled when asked` : ''}</span>
    </div>
    <div class="dc-legend mono"><i class="dc-key dreamt"></i>a dream<i class="dc-key blank"></i>none remembered<i class="dc-key unasked"></i>not asked</div>
    <div class="dc-months">${grid}</div>
    <div class="row" style="gap:8px;margin-top:8px;align-items:center">
      <button class="tbtn" id="dcBack">← earlier</button>
      ${back ? `<button class="tbtn" id="dcNow">back to now</button>` : ''}
      <span class="faint" style="font-size:.74rem;margin-left:auto">Click a night to read it, or to mark one you did not dream.</span>
    </div></div>`;
}
function bindDreamCalendar(root){
  const b = $('#dcBack', root); if(b) b.onclick = () => { S._dreamCalBack = (S._dreamCalBack || 0) + DREAM_CAL_MONTHS; rerender(); };
  const n = $('#dcNow', root); if(n) n.onclick = () => { S._dreamCalBack = 0; rerender(); };
  $$('[data-dcday]', root).forEach(el => el.onclick = () => {
    const day = el.dataset.dcday;
    const ds = dreamsOn(day);
    if(ds.length === 1) return openEntryModal({entryId: ds[0].id});
    if(ds.length > 1) return openPanel(`<div class="mono">${esc(fmtDate(day,'med'))}</div>${ds.map(e => entryCard(e, {clamp:false})).join('')}`)
      && $$('#panel .rv').forEach(x => x.classList.add('in'));
    /* an empty night: offer both answers rather than assuming one */
    planChoose(fmtDate(day, 'med'), [
      ['write', '☾  Write the dream'],
      ['none', noDreamOn(day) ? '✓  Remembered one after all' : '·  No dream remembered'],
    ], v => {
      if(v === 'write') openEntryModal({type:'dream', allowedTypes:['dream'], heading:'That night',
        occurredAt: day, after: () => { setNoDream(day, false); rerender(); }});
      else { setNoDream(day, !noDreamOn(day)); rerender(); }
    });
  });
}
