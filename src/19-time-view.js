/* ============================================================
   THE TIME VIEW — one page for a period.

   From the top: a switch for the period (day, week, month, quarter, year) with
   arrows; a glance — what was tracked, what was not, how much was focused, how
   much of what was read was meant, how much went to investing — each against
   the person's own recent periods; the sentence that says what stands out; what
   needs attention; where it went, through whichever lens (category, list,
   skill, person, habit, value, tag) — and pressing a bar narrows the whole
   page to it; twelve periods of the same; how the focus itself went; and
   under all of it the ledger, the days as they were written, editable.

   The pieces that other pages show too (the glance, the breakdown, the focus
   panel) are functions of a period alone, so the Review and the weekly review
   carry the same numbers rather than their own.
   ============================================================ */

function timeViewState(){
  const u = timeUi(), st = timeSettings();
  if(!u.unit) u.unit = TIME_UNITS.some(x => x[0] === st.viewUnit) ? st.viewUnit : 'week';
  if(!u.lens) u.lens = TIME_LENSES.some(x => x[0] === st.viewLens) ? st.viewLens : 'category';
  if(u.second === undefined) u.second = st.viewSecond || '';
  if(u.rollup === undefined) u.rollup = true;
  return u;
}
const timeViewRange = () => { const u = timeViewState(); return timeRange(u.unit, u.day || today()); };
const timeColorOf = (o, i) => o.color || (o.none ? '#8a8d8f' : TIME_PALETTE[i % TIME_PALETTE.length]);

/* ---------- the glance ---------- */
function timeGlanceHTML(r, narrow, opts = {}){
  const g = timeGlance(r, narrow);
  const rings = !opts.noRings && typeof timeIntentionRingsHTML === 'function' ? timeIntentionRingsHTML(r) : '';
  return `<div class="tmv-glance">
    ${g.tiles.map(t => `<div class="tmv-tile" title="${esc(t.hint)}"><div class="k mono">${esc(t.label)}</div>
      <div class="tmv-n serif">${esc(timeTileText(t))}</div>
      <div class="sub">${t.delta != null ? esc(timeDeltaWords(t)) : (t.value == null ? '' : '<span class="faint">no usual yet</span>')}</div></div>`).join('')}
    ${rings}</div>
    ${g.so.partial ? `<p class="faint mono tmv-note">${esc(timeRangeLabel(r))} is not over; it is read as far as today, against the same stretch of your earlier periods.</p>` : ''}`;
}

/* ---------- the breakdown ---------- */
function timeLensUsual(r, narrow, lens){
  const per = timeLikeRanges(r, 4).map(p => { const rows = timeRowsIn(p.from, p.to, narrow); return rows.length ? timeLensTotals(rows, lens) : null; }).filter(Boolean);
  if(per.length < 2) return null;
  const keys = new Map(); per.forEach(list => list.forEach(o => keys.set(o.key, 1)));
  const avg = {}; keys.forEach((_, k) => { avg[k] = sum(per.map(list => (list.find(o => o.key === k) || {minutes: 0}).minutes)) / per.length; });
  return avg;
}
function timeDonutHTML(list, total){
  const R = 42, C = 2 * Math.PI * R; let acc = 0;
  const top = list.filter(o => !o.none).slice(0, 8);
  return `<svg class="tmv-donut" viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="share of tracked time by category">
    <circle cx="60" cy="60" r="${R}" fill="none" stroke="var(--line)" stroke-width="14"/>
    ${top.map((o, i) => { const len = C * o.minutes / total, seg = `<circle cx="60" cy="60" r="${R}" fill="none" stroke="${esc(timeColorOf(o, i))}" stroke-width="14"
      stroke-dasharray="${Math.max(0, len - 1.5).toFixed(2)} ${(C - Math.max(0, len - 1.5)).toFixed(2)}" stroke-dashoffset="${(-acc).toFixed(2)}" transform="rotate(-90 60 60)"
      data-tmnarrow="category|${esc(o.key)}" style="cursor:pointer"><title>${esc(o.label)} — ${esc(timeSaid(o.minutes))}, ${Math.round(o.share * 100)}%</title></circle>`; acc += len; return seg; }).join('')}
    <text x="60" y="58" text-anchor="middle" class="tmv-dtxt serif" font-size="15">${esc(timeSaid(total))}</text>
    <text x="60" y="73" text-anchor="middle" font-size="8" fill="var(--muted)">tracked</text></svg>`;
}
function timeBreakdownHTML(r, narrow, opts = {}){
  const u = timeViewState(), lens = opts.lens || u.lens, second = opts.second !== undefined ? opts.second : u.second;
  const so = timeRangeSoFar(r), rows = timeRowsIn(so.from, so.to, narrow);
  const tracked = sum(rows.map(timeMinutes));
  if(!tracked) return `<div class="empty">Nothing tracked ${esc(timeRangeWord(r))}${narrow ? ' that matches' : ''}.</div>`;
  const list = timeLensTotals(rows, lens, second), usual = timeLensUsual(r, narrow, lens), top = Math.max(1, ...list.map(o => o.minutes));
  const total = sum(list.map(o => o.minutes));
  const segOpacity = i => Math.max(0.28, 1 - i * 0.22);
  const bars = list.slice(0, opts.max || 12).map((o, i) => {
    const d = usual ? o.minutes - (usual[o.key] || 0) : null;
    const dTxt = d == null ? '' : Math.abs(d) < 5 ? '±0' : (d > 0 ? '+' : '−') + timeSaid(Math.abs(d));
    const tip = `${o.label} — ${timeSaid(o.minutes)}, ${Math.round(o.share * 100)}% of ${timeSaid(total)}${d != null ? `; ${dTxt === '±0' ? 'about' : dTxt + (d > 0 ? ' above' : ' below')} your usual` : ''}${
      o.split ? '. Time on a project, skill or habit is split evenly across the values it serves.' : ''}${lens === 'value' ? '' : ''}`;
    const inner = second && o.sub.length ? o.sub.slice(0, 4).map((s, j) => `<b style="width:${(100 * s.minutes / o.minutes).toFixed(1)}%;opacity:${segOpacity(j)}" title="${esc(s.label)} — ${esc(timeSaid(s.minutes))}"></b>`).join('') : '';
    const col = timeColorOf(o, i);
    return `<${o.none ? 'div' : 'button'} class="tmv-bar${o.none ? ' none' : ''}" ${o.none ? '' : `data-tmnarrow="${esc(lens)}|${esc(o.key)}"`} title="${esc(tip)}" style="--c:${esc(col)}">
      <span class="tmv-bn">${esc(o.label)}${o.split ? ' <em class="faint" title="split evenly across the values it serves">½</em>' : ''}</span>
      <span class="tmv-track"><i style="width:${(100 * o.minutes / top).toFixed(1)}%">${inner}</i></span>
      <span class="mono tmv-bv">${esc(timeSaid(o.minutes))}</span><span class="mono faint tmv-bp">${Math.round(o.share * 100)}%</span><span class="mono tmv-bd${d != null && d > 0 ? ' up' : ''}">${esc(dTxt)}</span></${o.none ? 'div' : 'button'}>`;
  }).join('');
  const legend = second && list.some(o => o.sub.length) ? `<p class="faint mono tmv-note">Within each bar, by ${esc((TIME_LENSES.find(x => x[0] === second) || [0, second])[1].toLowerCase())}: darkest is the most. Hover a segment.</p>` : '';
  return `<div class="tmv-bkwrap">
    ${lens === 'category' ? `<div class="tmv-donutbox">${timeDonutHTML(list, total)}</div>` : ''}
    <div class="tmv-bars">${bars}${list.length > (opts.max || 12) ? `<div class="faint mono tmv-note">${list.length - (opts.max || 12)} smaller ones not shown</div>` : ''}${legend}</div></div>`;
}

/* ---------- the trend ---------- */
function timeTrendSVG(r, narrow){
  const pts = timeTrend(r, narrow, 12);
  const W = 640, H = 140, padL = 8, padR = 8, padT = 10, padB = 22, bw = (W - padL - padR) / pts.length;
  const top = Math.max(60, ...pts.map(p => Math.max(p.minutes, p.rolling)));
  const y = v => padT + (H - padT - padB) * (1 - v / top);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${(padL + bw * (i + 0.5)).toFixed(1)} ${y(p.rolling).toFixed(1)}`).join(' ');
  return `<svg class="tmv-trend" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="tracked time over twelve periods">
    ${pts.map((p, i) => { const cur = i === pts.length - 1; return `<rect x="${(padL + bw * i + 3).toFixed(1)}" y="${y(p.minutes).toFixed(1)}" width="${(bw - 6).toFixed(1)}" height="${Math.max(1, H - padB - y(p.minutes)).toFixed(1)}"
      rx="3" class="tmv-tb${cur ? ' cur' : ''}${p.partial ? ' partial' : ''}" data-tmgoto="${esc(p.range.from)}"><title>${esc(p.label)} — ${esc(timeSaid(p.minutes))}${p.partial ? ' so far' : ''}</title></rect>`; }).join('')}
    <path d="${line}" fill="none" stroke="var(--terra)" stroke-width="2" stroke-linejoin="round"/>
    <text x="${padL}" y="${H - 6}" font-size="9" fill="var(--muted)">${esc(pts[0].label)}</text>
    <text x="${W - padR}" y="${H - 6}" font-size="9" text-anchor="end" fill="var(--muted)">${esc(pts[pts.length - 1].label)}</text></svg>
    <p class="faint mono tmv-note">Bars are each period's tracked time; the line is the average of the three periods up to it. Tallest ${esc(timeSaid(Math.max(...pts.map(p => p.minutes))))}.</p>`;
}

/* ---------- how the focus went ---------- */
function timeFocusQualityHTML(r, narrow){
  const so = timeRangeSoFar(r), q = timeFocusQuality(so.from, so.to, narrow);
  const cell = (label, val, sub, miss, tip) => `<div class="tmv-fq" title="${esc(tip)}"><div class="k mono">${esc(label)}</div>
    ${val == null ? `<div class="tmv-n serif faint">—</div><div class="sub">${esc(miss)}</div>` : `<div class="tmv-n serif">${esc(val)}</div><div class="sub">${esc(sub)}</div>`}</div>`;
  if(!q.sittings) return `<div class="empty">No sittings ${esc(timeRangeWord(r))}${narrow ? ' that match' : ''}.</div>`;
  const e = q.estimate;
  return `<div class="tmv-fqs">
    ${cell('start delay', q.delay ? Math.round(q.delay.value) + 'm' : null, `on average, over ${q.delay && q.delay.n} block${q.delay && q.delay.n === 1 ? '' : 's'} begun`, 'needs a block with a sitting begun on it',
      'from a block’s start to the sitting that began on it; starting early counts as none')}
    ${cell('break overruns', q.overrun ? Math.round(q.overrun.value * 100) + '%' : null, `of ${q.overrun && q.overrun.n} planned breaks ran over`, 'needs three planned breaks', 'a break that ran past its length is split in two; this is how many were')}
    ${cell('restful breaks', q.restful ? Math.round(q.restful.value * 100) + '%' : null, `of ${q.restful && q.restful.n} breaks read as chosen and restful`, 'needs three breaks you answered for', 'the share of breaks you answered “meant it”')}
    ${cell('distractions an hour', q.distract ? q.distract.value.toFixed(1) : null, `${q.distract && q.distract.n} noted over ${q.distract && q.distract.hours.toFixed(1)}h of sitting`, 'needs two hours of sitting', 'distractions put on the sheet while a sitting ran, per hour of sitting')}
    ${cell('estimates', e ? Math.round(e.within * 100) + '%' : null, e ? `of ${e.n} finished tasks took within a quarter of the estimate; typically ${Math.round(e.median * 100)}%` : '', 'needs three finished tasks with an estimate and time logged', 'actual time against estimate on tasks finished in the period')}
  </div>`;
}

/* ---------- the ledger ---------- */
function timeEntryListHTML(r, narrow, limit = 60){
  const rows = timeRowsIn(timeRangeSoFar(r).from, timeRangeSoFar(r).to, narrow).filter(e => e.endTime).sort((a, b) => String(b.startTime).localeCompare(String(a.startTime)));
  if(!rows.length) return '<div class="empty">Nothing written down here.</div>';
  const u = timeUi(), shown = u.more ? rows : rows.slice(0, limit);
  let last = '';
  return `<div class="tm-list">${shown.map(e => { const d = timeLivingDay(e.startTime), head = d !== last ? `<div class="sc tmv-dayhead">${esc(fmtDate(d, 'med'))} <span class="mono faint">${esc(timeSaid(sum(timeOnDay(d).filter(x => timeNarrowMatch(x, narrow)).map(timeMinutes))))}</span></div>` : ''; last = d; return head + timeRowHTML(e); }).join('')}</div>
    ${rows.length > limit && !u.more ? `<div class="row" style="justify-content:center;margin-top:8px"><button class="btn sm ghost" id="tmMore">show all ${rows.length}</button></div>` : ''}`;
}
function timeLedgerHTML(r, narrow){
  if(r.unit === 'day') return timeDayHTML({day: r.from, embedded: true, narrow});
  if(r.unit === 'week') return timeWeekHTML({days: timeDaysIn(r.from, r.to), embedded: true, narrow}) + timeEntryListHTML(r, narrow, 40);
  return timeEntryListHTML(r, narrow);
}

/* ---------- the page ---------- */
function timeOverviewHTML(){
  const u = timeViewState(), r = timeViewRange(), n = u.narrow || null;
  const future = timeRangeFuture(r), nextFuture = timeRangeFuture(timeRangeShift(r, 1));
  const att = timeAttentionItems();
  return `<div class="tmv">
    <div class="tmv-head">
      <span class="tabs sm" role="tablist" aria-label="period">${TIME_UNITS.map(([k, name]) => `<button class="tab${u.unit === k ? ' on' : ''}" data-tmunit="${k}">${name}</button>`).join('')}</span>
      <span class="tmv-arrows"><button class="tbtn" data-tmshift="-1" title="the one before">‹</button>
        <span class="mono tmv-label">${esc(timeRangeLabel(r))}</span>
        <button class="tbtn" data-tmshift="1" ${nextFuture ? 'disabled' : ''} title="the one after">›</button></span>
      ${timeRangeIsCurrent(r) ? '' : `<button class="tbtn" data-tmthis>back to ${esc(timeRangeWord(timeRange(r.unit)).replace('this ', 'this '))}</button>`}
      <span class="grow"></span>${r.unit === 'week' ? '<button class="tbtn" data-tmprint title="the week on one sheet">print the week</button>' : ''}<button class="btn sm primary" id="tmAdd">+ a sitting</button></div>
    ${n ? `<div class="tmv-narrow"><span class="chip on">narrowed to ${esc(n.label)}</span> <button class="tbtn" data-tmclear>show everything</button>
      <span class="faint mono">every figure below is for this alone</span></div>` : ''}
    ${future ? '<div class="empty">That period has not begun.</div>' : `
    <section class="tmv-sec tmv-board"><span class="sc">${r.unit === 'day' ? 'The day, hour by hour' : r.unit === 'week' ? 'The week, hour by hour' : 'Planned and tracked, week by week'}${r.unit === 'day' && !n ? ` <button class="tbtn" data-tmboard="${esc(r.from)}" title="open this day on the planning board">plan board</button>` : ''}</span>
      ${r.unit === 'day' || r.unit === 'week' ? timeBoardHTML(r, n) : timePlanTrackedWeeksHTML(r, n)}</section>
    ${timeGlanceHTML(r, n)}
    <p class="tmv-say serif">${esc(timeNarrative(r, n))}</p>
    ${att.length ? `<div class="tmv-attn"><span class="sc">Needs attention</span>${att.slice(0, 3).map((it, i) => pqRowHTML(it, i)).join('')}${att.length > 3 ? `<div class="faint mono pq-more">${att.length - 3} more on Today</div>` : ''}</div>` : ''}
    <section class="tmv-sec"><div class="tmv-bh"><span class="sc" style="margin:0">Where it went</span>
      <label class="pd-q"><span class="k">by</span><select class="sel sm" id="tmLens">${TIME_LENSES.map(([k, name]) => `<option value="${k}" ${u.lens === k ? 'selected' : ''}>${name}</option>`).join('')}</select></label>
      <label class="pd-q"><span class="k">then</span><select class="sel sm" id="tmSecond"><option value="">—</option>${TIME_LENSES.filter(x => x[0] !== u.lens).map(([k, name]) => `<option value="${k}" ${u.second === k ? 'selected' : ''}>${name}</option>`).join('')}</select></label></div>
      ${timeBreakdownHTML(r, n)}</section>
    <section class="tmv-sec"><span class="sc">Twelve ${esc(r.unit)}s</span>${timeTrendSVG(r, n)}</section>
    <section class="tmv-sec"><span class="sc">How the focus went</span>${timeFocusQualityHTML(r, n)}</section>
    <section class="tmv-sec"><span class="sc">The ${esc(r.unit === 'day' ? 'day' : r.unit)}, as written</span>${timeLedgerHTML(r, n)}</section>`}
  </div>`;
}
function bindTimeOverview(root){
  const u = timeViewState(), st = timeSettings();
  const keep = () => { st.viewUnit = u.unit; st.viewLens = u.lens; st.viewSecond = u.second; saveNow(); };
  $$('[data-tmunit]', root).forEach(b => b.onclick = () => { u.unit = b.dataset.tmunit; u.more = false; keep(); rerender(); });
  $$('[data-tmshift]', root).forEach(b => b.onclick = () => { const r = timeRangeShift(timeViewRange(), +b.dataset.tmshift); u.day = r.from > today() ? today() : r.from; u.more = false; rerender(); });
  const th = root.querySelector('[data-tmthis]'); if(th) th.onclick = () => { u.day = null; rerender(); };
  const lens = root.querySelector('#tmLens'); if(lens) lens.onchange = () => { u.lens = lens.value; if(u.second === u.lens) u.second = ''; keep(); rerender(); };
  const sec = root.querySelector('#tmSecond'); if(sec) sec.onchange = () => { u.second = sec.value; keep(); rerender(); };
  $$('[data-tmnarrow]', root).forEach(b => b.onclick = () => {
    const [lensId, ...rest] = b.dataset.tmnarrow.split('|'), key = rest.join('|');
    const o = timeLensTotals(timeRowsIn(timeRangeSoFar(timeViewRange()).from, timeRangeSoFar(timeViewRange()).to), lensId).find(x => x.key === key);
    u.narrow = {lens: lensId, key, label: o ? o.label : key}; u.more = false; rerender(); });
  const cl = root.querySelector('[data-tmclear]'); if(cl) cl.onclick = () => { u.narrow = null; rerender(); };
  $$('[data-tmgoto]', root).forEach(b => b.onclick = () => { u.day = b.dataset.tmgoto > today() ? today() : b.dataset.tmgoto; rerender(); });
  const more = root.querySelector('#tmMore'); if(more) more.onclick = () => { u.more = true; rerender(); };
  $$('[data-tmboard]', root).forEach(b => b.onclick = () => pbdOpen(b.dataset.tmboard, {onClose: () => rerender()}));
  const pr = root.querySelector('[data-tmprint]'); if(pr) pr.onclick = () => printWeek(timeViewRange().from);
  $$('[data-tmgoals]', root).forEach(b => b.onclick = () => navigate('#/time/goals'));
  const att = root.querySelector('.tmv-attn'); if(att && typeof pqBind === 'function') pqBind(att, today(), timeAttentionItems().slice(0, 3));
}
