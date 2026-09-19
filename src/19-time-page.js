/* ============================================================
   WHERE THE TIME WENT — the room.

   Three views of the same rows. The day is a bar from midnight to midnight
   with the tracked stretches coloured in, because the thing you want to see
   first is not a total but a shape: where the gaps are, how late the evening
   started, how much of the afternoon is simply missing. The week is seven of
   those bars stacked, which turns "I keep meaning to practise" into a picture
   of the four days you did not. The reports are for the question the other
   two cannot answer — how much of this month went on one particular thing.

   The untracked hours are drawn rather than hidden. A dashboard that shows
   only what you logged always says you had a productive day; the empty parts
   of the bar are the honest half of the picture.
   ============================================================ */
function timeUi(){
  return S._time = S._time || {view:'day', day:null, span:30, cat:null, tag:null, link:null};
}
const timeDay = () => { const u = timeUi(); return u.day || today(); };

routes.time = function(root, params){
  timeState();
  const u = timeUi();
  const want = params && params[0];
  if(['day','week','reports'].includes(want)) u.view = want;
  registerPageEntry({pageName:'Time', addLabel:'Log a sitting', defaultEntryType:'time',
    prefilledFields:{}, options:[
      {icon:'⏱', label:'Start the clock', desc:'Now, for whatever you are about to do.',
        run:()=>openTimeStartModal()},
      {icon:'✎', label:'A sitting, after the fact', desc:'Two hours of reading you forgot to time.',
        run:()=>openTimeEntryModal(null, timeDay())}]});
  root.innerHTML = `<div class="page tm-page">
    <div class="tm-head">
      <h1 class="serif">Time</h1>
      <span class="grow"></span>
      <span class="tabs sm">${[['day','Day'],['week','Week'],['reports','Reports']].map(([k, n]) =>
        `<button class="tab${u.view === k ? ' on' : ''}" data-tmview="${k}">${n}</button>`).join('')}</span>
    </div>
    ${u.view === 'week' ? timeWeekHTML() : u.view === 'reports' ? timeReportsHTML() : timeDayHTML()}
  </div>`;
  bindTimePage(root);
};

/* ---------- the day ---------- */
function timeDayHTML(){
  const day = timeDay();
  const rows = timeOnDay(day).slice().sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
  const mins = sum(rows.map(e => timeMinutes(e)));
  const by = timeByCategory(rows);
  return `<div class="tm-bar-h">
      <button class="tbtn" data-tmday="-1">‹ day before</button>
      <span class="mono">${esc(fmtDate(day, 'med'))}</span>
      <button class="tbtn" data-tmday="1" ${day >= today() ? 'disabled' : ''}>day after ›</button>
      <span class="grow"></span>
      <span class="mono">${timeSaid(mins)} tracked</span>
      <button class="btn sm primary" id="tmAdd">+ a sitting</button>
    </div>
    ${timeStripHTML(rows, day)}
    ${rows.length ? `<div class="tm-list">${rows.map(timeRowHTML).join('')}</div>`
      : `<div class="empty">Nothing tracked on this day. Start the clock in the corner, or write
        down a sitting you did not time.</div>`}
    ${by.length ? `<div class="tm-sum">${timeSumHTML(by, 1440)}</div>` : ''}`;
}
/* Midnight to midnight, in proportion. A sitting that runs past midnight is
   clipped to the day it is being drawn for rather than allowed to run off the
   end, because the hours after midnight belong to the next bar. */
function timeStripHTML(rows, day){
  const seg = e => {
    const a = new Date(e.startTime);
    const from = Math.max(0, a.getHours() * 60 + a.getMinutes());
    const to = Math.min(1440, from + timeMinutes(e));
    return {from, to, e};
  };
  const parts = rows.map(seg).filter(s => s.to > s.from);
  const marks = [0, 6, 12, 18, 24];
  return `<div class="tm-strip" role="img" aria-label="the day, midnight to midnight">
    ${parts.map(({from, to, e}) => { const c = timeCategory(e.categoryId);
      return `<i class="tm-seg" data-tmgo="${esc(e.id)}" style="left:${(from / 14.4).toFixed(2)}%;width:${
        ((to - from) / 14.4).toFixed(2)}%;--c:${esc(c.color)}"
        title="${esc(c.emoji)} ${esc(e.what || c.name)} · ${esc(timeClockOf(e.startTime))}–${
        e.endTime ? esc(timeClockOf(e.endTime)) : 'now'}"></i>`; }).join('')}
  </div>
  <div class="tm-ticks mono">${marks.map(h =>
    `<span style="left:${(h / 24 * 100).toFixed(2)}%">${h === 24 ? '24' : String(h).padStart(2, '0')}</span>`).join('')}</div>`;
}
function timeRowHTML(e){
  const c = timeCategory(e.categoryId);
  return `<div class="tm-row" style="--c:${esc(c.color)}" data-tmrow="${esc(e.id)}">
    <span class="tm-emoji" aria-hidden="true">${esc(c.emoji)}</span>
    <div class="tm-body">
      <div class="tm-what">${esc(e.what || c.name)}${
        e.linkedLabel ? ` <span class="faint">· ${esc(e.linkedLabel)}</span>` : ''}</div>
      <div class="mono faint sm">${esc(timeClockOf(e.startTime))}–${
        e.endTime ? esc(timeClockOf(e.endTime)) : '…'}${
        e.tags.length ? ` · ${esc(e.tags.join(', '))}` : ''}${
        e.source === 'auto' ? ' · started by the room' : ''}</div>
      ${e.notes.length ? `<div class="tm-notes">${e.notes.map(n =>
        `<span class="mono sm">${esc(timeClockOf(n.at))}</span> ${esc(n.text)}`).join('<br>')}</div>` : ''}
    </div>
    <span class="mono tm-mins">${e.endTime ? timeSaid(timeMinutes(e)) : 'running'}</span>
    <button class="tbtn" data-tmedit="${esc(e.id)}" title="change it">✎</button>
  </div>`;
}
function timeByCategory(rows){
  const by = {};
  rows.forEach(e => { const k = e.categoryId || '';
    by[k] = (by[k] || 0) + timeMinutes(e); });
  return Object.keys(by).map(k => ({cat: timeCategory(k || null), minutes: by[k]}))
    .sort((a, b) => b.minutes - a.minutes);
}
/* The bars, and the hours nobody accounted for beside them. The untracked
   line is the point: without it every day looks full. */
function timeSumHTML(by, whole){
  const top = Math.max(1, ...by.map(b => b.minutes));
  const tracked = sum(by.map(b => b.minutes));
  return `${by.map(b => `<div class="tm-sumrow" style="--c:${esc(b.cat.color)}">
      <span class="tm-sumn">${esc(b.cat.emoji)} ${esc(b.cat.name)}</span>
      <span class="tm-sumbar"><i style="width:${(100 * b.minutes / top).toFixed(1)}%"></i></span>
      <span class="mono">${timeSaid(b.minutes)}</span>
    </div>`).join('')}
    ${whole ? `<div class="tm-sumrow faint">
      <span class="tm-sumn">untracked</span>
      <span class="tm-sumbar"></span>
      <span class="mono">~${timeSaid(Math.max(0, whole - tracked))}</span>
    </div>` : ''}`;
}

/* ---------- the week ---------- */
function timeWeekHTML(){
  const end = timeDay();
  const days = Array.from({length:7}, (_, i) => {
    const d = parseDay(end); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10) === '' ? end : timeDayOf(d.toISOString());
  });
  const rows = days.map(d => ({day: d, entries: timeOnDay(d)}));
  const all = rows.flatMap(r => r.entries);
  const mins = sum(all.map(e => timeMinutes(e)));
  const by = timeByCategory(all);
  return `<div class="tm-bar-h">
      <button class="tbtn" data-tmday="-7">‹ week before</button>
      <span class="mono">${esc(fmtDate(days[0], 'med'))} – ${esc(fmtDate(days[6], 'med'))}</span>
      <button class="tbtn" data-tmday="7" ${end >= today() ? 'disabled' : ''}>week after ›</button>
      <span class="grow"></span>
      <span class="mono">${timeSaid(mins)} in the week</span>
    </div>
    <div class="tm-week">${rows.map(r => `<div class="tm-wday">
      <button class="tbtn mono tm-wname" data-tmpick="${esc(r.day)}">${esc(fmtDate(r.day, 'short'))}</button>
      <div class="tm-wstrip">${timeStripHTML(r.entries, r.day)}</div>
      <span class="mono faint">${r.entries.length ? timeSaid(sum(r.entries.map(timeMinutes))) : '—'}</span>
    </div>`).join('')}</div>
    ${by.length ? `<div class="tm-sum">${timeSumHTML(by, 0)}
      <p class="faint sm">${timeSaid(mins / 7)} a day on average${
        by[0] ? `, most of it on ${esc(by[0].cat.name.toLowerCase())}` : ''}.</p></div>`
      : '<div class="empty">Nothing tracked this week.</div>'}`;
}

/* ---------- the reports ----------
   The one question the day and the week cannot answer: how much of the last
   month went on one particular thing — not one category, one thing. Filtering
   by what an entry is hung on is the whole reason entries carry a link. */
function timeReportsHTML(){
  const u = timeUi();
  const to = today();
  const d = parseDay(to); d.setDate(d.getDate() - (u.span - 1));
  const from = timeDayOf(d.toISOString());
  let rows = timeBetween(from, to);
  if(u.cat) rows = rows.filter(e => e.categoryId === u.cat);
  if(u.tag) rows = rows.filter(e => e.tags.includes(u.tag));
  if(u.link) rows = rows.filter(e => `${e.linkedType}:${e.linkedId}` === u.link);
  const by = timeByCategory(rows);
  const mins = sum(rows.map(e => timeMinutes(e)));
  const tags = [...new Set(timeBetween(from, to).flatMap(e => e.tags))].sort();
  const links = [...new Map(timeBetween(from, to).filter(e => e.linkedId)
    .map(e => [`${e.linkedType}:${e.linkedId}`, e.linkedLabel || e.linkedId])).entries()];
  return `<div class="tm-bar-h">
      <label class="pd-q"><span class="k">over</span>
        <select class="sel sm" id="tmSpan">${[7, 30, 90, 365].map(n =>
          `<option value="${n}" ${u.span === n ? 'selected' : ''}>${n} days</option>`).join('')}</select></label>
      <label class="pd-q"><span class="k">category</span>
        <select class="sel sm" id="tmCat"><option value="">all</option>${timeCategories().map(c =>
          `<option value="${esc(c.id)}" ${u.cat === c.id ? 'selected' : ''}>${esc(c.emoji)} ${esc(c.name)}</option>`).join('')}</select></label>
      <label class="pd-q"><span class="k">tag</span>
        <select class="sel sm" id="tmTag"><option value="">all</option>${tags.map(t =>
          `<option value="${esc(t)}" ${u.tag === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
      <label class="pd-q"><span class="k">on</span>
        <select class="sel sm" id="tmLink"><option value="">anything</option>${links.map(([k, label]) =>
          `<option value="${esc(k)}" ${u.link === k ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select></label>
      <span class="grow"></span>
      <span class="mono">${timeSaid(mins)}</span>
    </div>
    ${rows.length ? `${timeTrendHTML(rows, from, to)}
      <div class="tm-sum">${timeSumHTML(by, 0)}</div>`
      : '<div class="empty">Nothing matches that.</div>'}`;
}
/* A day-by-day line, so a habit that died three weeks ago is visible as the
   place the line goes flat rather than as a number that is merely smaller. */
function timeTrendHTML(rows, from, to){
  const days = [];
  const d = parseDay(from), end = parseDay(to);
  while(d <= end){ days.push(timeDayOf(d.toISOString())); d.setDate(d.getDate() + 1); }
  const per = days.map(day => sum(rows.filter(e => timeDayOf(e.startTime) === day).map(timeMinutes)));
  const top = Math.max(60, ...per);
  const W = 640, H = 110, pad = 6;
  const at = (v, i) => [pad + (W - pad * 2) * (days.length < 2 ? 0 : i / (days.length - 1)),
    H - pad - (H - pad * 2) * (v / top)];
  const line = per.map((v, i) => { const q = at(v, i); return `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`; }).join(' ');
  return `<div class="tm-trend"><svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" aria-hidden="true">
      <path d="${line}" fill="none" stroke="#5c7c8a" stroke-width="1.8" stroke-linejoin="round"/>
    </svg>
    <div class="mono faint sm">${esc(fmtDate(days[0], 'short'))} → ${esc(fmtDate(days[days.length - 1], 'short'))}
      · tallest day ${timeSaid(top)}</div></div>`;
}

function bindTimePage(root){
  const u = timeUi();
  $$('[data-tmview]', root).forEach(b => b.onclick = () => navigate(`#/time/${b.dataset.tmview}`));
  $$('[data-tmday]', root).forEach(b => b.onclick = () => {
    const d = parseDay(timeDay()); d.setDate(d.getDate() + (+b.dataset.tmday));
    const next = timeDayOf(d.toISOString());
    u.day = next > today() ? today() : next;
    saveNow(); rerender();
  });
  $$('[data-tmpick]', root).forEach(b => b.onclick = () => {
    u.day = b.dataset.tmpick; u.view = 'day'; saveNow(); navigate('#/time/day'); });
  $$('[data-tmedit]', root).forEach(b => b.onclick = ev => { ev.stopPropagation();
    openTimeEntryModal(b.dataset.tmedit); });
  $$('[data-tmgo]', root).forEach(b => b.onclick = () => openTimeEntryModal(b.dataset.tmgo));
  const add = root.querySelector('#tmAdd');
  if(add) add.onclick = () => openTimeEntryModal(null, timeDay());
  const pick = (sel, key, num) => { const n = root.querySelector(sel); if(!n) return;
    n.onchange = () => { u[key] = num ? (+n.value || 0) : (n.value || null); saveNow(); rerender(); }; };
  pick('#tmSpan', 'span', true); pick('#tmCat', 'cat'); pick('#tmTag', 'tag'); pick('#tmLink', 'link');
}
