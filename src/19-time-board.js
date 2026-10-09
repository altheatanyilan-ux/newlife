/* ============================================================
   THE TIME VIEW, AS A BOARD

   The day laid out the way the planning board lays it out: the hours down the
   side, and for each day two columns beside each other — what was planned, and
   what was tracked. Every block says what it was and from when to when, so a
   stretch of the day reads at a glance instead of as a pile of cards. A week is
   seven of them, side by side, on the same hours. Under a day, each planned block
   is set against the time that was actually spent on the same work.

   Nothing here is stored. The plan is the day's blocks (16-planboard-data.js),
   the rest is the time entries, and the rule for "the time spent on the same
   work" is the one the evening review uses: sittings on that task or habit that
   started within half an hour before the block to an hour and a half after it.
   ============================================================ */

const TMB_PX = 0.9;                              /* pixels per minute — the planning board's scale */
const TMB_HEAD = 46;                             /* the height of a day's heading, which the hours column leaves room for */

/* the day's plan as drawn: what is fixed, and the work that was given an hour */
function tmbPlanned(d){
  const out = [];
  const seen = new Set();
  pbdAnchors(d).forEach(a => {
    if(a.block) seen.add(a.block.id);
    out.push({from: a.from, to: a.to, label: a.label, cls: a.kind === 'habit' ? 'habit' : a.kind === 'clock' ? 'clock' : 'fixed', kind: a.kind});
  });
  pbdBlocksOn(d).forEach(b => {
    if(seen.has(b.id)) return;
    const a = pbdMin(b.start); if(a == null) return;
    out.push({from: a, to: a + b.durationMin, label: pbdBlockLabel(b), cls: 'work', kind: b.kind, block: b});
  });
  return out.filter(x => x.to > x.from).sort((a, b) => a.from - b.from);
}
/* the day's tracked time as drawn */
function tmbTracked(d, narrow){
  return timeOnCalendarDay(d).filter(e => timeNarrowMatch(e, narrow)).map(e => {
    const s = new Date(e.startTime), from = s.getHours() * 60 + s.getMinutes(), len = timeMinutes(e);
    return {from, to: from + Math.max(1, len), e, len};
  }).filter(x => x.to > x.from).sort((a, b) => a.from - b.from);
}
/* items that overlap in time share a column width instead of covering each other */
function tmbLanes(items){
  const out = []; let cluster = [], end = -1;
  const flush = () => { const n = Math.max(1, ...cluster.map(c => c.lane + 1)); cluster.forEach(c => c.of = n); cluster = []; };
  items.forEach(x => {
    if(cluster.length && x.from >= end){ flush(); end = -1; }
    const used = new Set(cluster.filter(c => c.x.to > x.from).map(c => c.lane));
    let l = 0; while(used.has(l)) l++;
    const o = {x, lane: l, of: 1}; cluster.push(o); out.push(o); end = Math.max(end, x.to);
  });
  flush();
  return out;
}
const tmbSay = m => (typeof pbdSay === 'function' ? pbdSay(m) : Math.round(m) + 'm');

function tmbBlockHTML(o, lo, kind){
  const x = o.x, top = (x.from - lo) * TMB_PX, ht = Math.max(14, (x.to - x.from) * TMB_PX);
  const left = o.lane / o.of * 100, width = 100 / o.of;
  const span = `${pbdHM(x.from)}–${pbdHM(Math.min(1439, x.to))}`;
  const tiny = ht < 30;
  if(kind === 'plan'){
    return `<div class="tmb-b plan ${esc(x.cls)}" style="top:${top.toFixed(1)}px;height:${ht.toFixed(1)}px;left:${left.toFixed(1)}%;width:${width.toFixed(1)}%" title="planned: ${esc(x.label)} · ${span} · ${tmbSay(x.to - x.from)}">
      <span class="tmb-l">${esc(x.label)}</span>${tiny ? '' : `<span class="tmb-t mono">${span}</span>`}</div>`;
  }
  const e = x.e, c = timeCategory(e.categoryId), running = !e.endTime;
  const what = e.what || c.name;
  const kindTag = e.kind && e.kind !== 'work' ? ` · ${TIME_KIND_NAMES[e.kind] || e.kind}` : '';
  return `<div class="tmb-b did${e.kind === 'break' ? ' brk' : ''}${e.verdict ? ' v-' + esc(e.verdict) : ''}${running ? ' run' : ''}" data-tmgo="${esc(e.id)}" style="top:${top.toFixed(1)}px;height:${ht.toFixed(1)}px;left:${left.toFixed(1)}%;width:${width.toFixed(1)}%;--c:${esc(c.color)}"
      title="${esc(c.emoji + ' ' + what)}${esc(kindTag)} · ${span}${running ? ' (running)' : ''} · ${esc(timeSaid(x.len))}${e.verdict ? ' · ' + esc(TIME_VERDICT_WORDS[e.verdict]) : ''}">
    <span class="tmb-l">${esc(what)}</span>${tiny ? '' : `<span class="tmb-t mono">${span}${running ? ' · now' : ''}</span>`}</div>`;
}
/* the minutes the day set aside for work and habits, and the minutes tracked that were not rest */
function tmbTotals(d, narrow){
  const plan = narrow ? 0 : tmbPlanned(d).filter(x => x.cls === 'work' || (x.cls === 'habit')).reduce((n, x) => n + (x.to - x.from), 0);
  const did = tmbTracked(d, narrow).filter(x => x.e.kind !== 'break').reduce((n, x) => n + x.len, 0);
  const blocks = narrow ? [] : pbdBlocksOn(d).filter(b => b.ref);
  const honoured = blocks.filter(b => { const a = pbdMin(b.start); return pbdTrackedOn(b.ref, a, a + b.durationMin, d).some(e => e.endTime); }).length;
  return {plan, did, blocks: blocks.length, honoured};
}

function timeBoardHTML(r, narrow){
  const days = timeDaysIn(r.from, r.to);   /* a week shows its days still to come too: they may already have a plan */
  if(!days.length) return '';
  const cols = days.map(d => ({d, plan: narrow ? [] : tmbPlanned(d), did: tmbTracked(d, narrow)}));
  if(!cols.some(c => c.plan.length || c.did.length)) return `<div class="empty">Nothing was planned or tracked ${r.unit === 'day' ? 'on this day' : 'this week'}. Start the clock in the corner, or lay the day out on the planning board.</div>`;
  /* the hours shown: waking hours, widened to take in anything that fell outside them */
  let lo = 1440, hi = 0;
  cols.forEach(c => { const bd = pbdBounds(c.d); lo = Math.min(lo, bd.wake); hi = Math.max(hi, bd.bed);
    c.plan.forEach(x => { lo = Math.min(lo, x.from); hi = Math.max(hi, x.to); }); c.did.forEach(x => { lo = Math.min(lo, x.from); hi = Math.max(hi, x.to); }); });
  lo = Math.max(0, Math.floor(lo / 60) * 60); hi = Math.min(1440, Math.ceil(hi / 60) * 60);
  const H = (hi - lo) * TMB_PX;
  const ticks = []; for(let m = lo; m <= hi; m += 60) ticks.push(`<div class="tmb-tick" style="top:${((m - lo) * TMB_PX).toFixed(1)}px"><span class="mono">${String(Math.floor(m / 60) % 24).padStart(2, '0')}:00</span></div>`);
  const week = days.length > 1;
  const now = (() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); })();
  const dayHTML = c => {
    const t = tmbTotals(c.d, narrow), nm = parseDay(c.d);
    const sub = (kind, items) => `<div class="tmb-sub ${kind}"><span class="tmb-sh mono">${kind === 'plan' ? 'planned' : 'tracked'}</span>
        <div class="tmb-track" style="height:${H.toFixed(1)}px">${tmbLanes(items).map(o => tmbBlockHTML(o, lo, kind)).join('')}${c.d === today() && now >= lo && now <= hi ? `<i class="tmb-now" style="top:${((now - lo) * TMB_PX).toFixed(1)}px"></i>` : ''}</div></div>`;
    return `<div class="tmb-day${c.d === today() ? ' today' : ''}">
      <div class="tmb-dh" style="height:${TMB_HEAD}px"><b>${week ? `${DOW[nm.getDay()].slice(0, 3)} ${nm.getDate()}` : esc(fmtDate(c.d, 'med'))}</b>
        <span class="mono faint">${narrow ? '' : `plan ${tmbSay(t.plan)} · `}tracked ${tmbSay(t.did)}</span></div>
      <div class="tmb-pair${narrow ? ' one' : ''}">${narrow ? '' : sub('plan', c.plan)}${sub('did', c.did)}</div></div>`;
  };
  return `<div class="tmb${week ? ' week' : ''}" style="--tmb-h:${H.toFixed(1)}px">
    <div class="tmb-wrap"><div class="tmb-axis" style="padding-top:${TMB_HEAD + 16}px"><div class="tmb-ticks" style="height:${H.toFixed(1)}px">${ticks.join('')}</div></div>
    <div class="tmb-days">${cols.map(dayHTML).join('')}</div></div>
    ${narrow ? '<div class="faint mono tmb-note">Narrowed: only the tracked time that belongs to it is drawn; the plan is not split by it.</div>' : ''}
    ${!week && !narrow ? tmbCompareHTML(days[0]) : ''}
    <div class="tmb-key faint mono"><span><i class="k-plan"></i>planned work</span><span><i class="k-habit"></i>habit</span><span><i class="k-fixed"></i>fixed (meals, protected time)</span><span><i class="k-did"></i>tracked, in the colour of its category</span><span><i class="k-brk"></i>a break</span></div>
    ${!narrow ? '<div class="faint tmb-note">The plan is the planning board’s blocks for the day; tracked is the clock. Click a tracked block to change it.</div>' : ''}</div>`;
}

/* each planned block against the time that was spent on the same work */
function tmbCompareHTML(d){
  const blocks = pbdBlocksOn(d).filter(b => b.ref && !(PBD_KINDS_ANCHOR.includes(b.kind) && b.kind !== 'habit'));
  if(!blocks.length) return '';
  const T = today(), nowMin = (() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); })();
  const rows = blocks.map(b => {
    const a = pbdMin(b.start), z = a + b.durationMin;
    const got = pbdTrackedOn(b.ref, a, z, d).filter(e => e.endTime).sort((x, y) => String(x.startTime).localeCompare(String(y.startTime)));
    const mins = got.reduce((n, e) => n + timeMinutes(e), 0);
    const diff = Math.round(mins - b.durationMin);
    const future = d > T || (d === T && a > nowMin);
    const word = got.length ? (Math.abs(diff) < 5 ? 'on the nail' : diff > 0 ? `${tmbSay(diff)} over` : `${tmbSay(-diff)} short`) : future ? 'still to come' : 'no time on it';
    const cls = got.length ? (Math.abs(diff) < 5 ? 'even' : diff > 0 ? 'over' : 'short') : future ? 'later' : 'none';
    return `<div class="tmb-cr ${cls}"><span class="tmb-cn">${esc(pbdBlockLabel(b))}</span>
      <span class="mono">${esc(b.start)}–${pbdHM(z)} <i class="faint">${tmbSay(b.durationMin)}</i></span>
      <span class="mono">${got.length ? `${timeClockOf(got[0].startTime)}–${timeClockOf(got[got.length - 1].endTime)} <i class="faint">${tmbSay(mins)}</i>` : '—'}</span>
      <span class="tmb-cw">${esc(word)}</span></div>`;
  }).join('');
  return `<div class="tmb-cmp"><div class="tmb-cr head mono"><span>block</span><span>planned</span><span>tracked</span><span></span></div>${rows}
    <div class="faint tmb-note">Tracked is the time on the same task or habit that began from half an hour before the block to an hour and a half after it. “Short” and “over” are readings, not marks.</div></div>`;
}

/* a month, a quarter or a year has no hours to draw: each week's plan beside its tracked time */
function timePlanTrackedWeeksHTML(r, narrow){
  const to = r.to > today() ? today() : r.to;
  const days = timeDaysIn(r.from, to), weeks = [];
  days.forEach(d => { const w = weekStart(d); let g = weeks.find(x => x.w === w); if(!g){ g = {w, days: []}; weeks.push(g); } g.days.push(d); });
  const rows = weeks.map(g => {
    const plan = narrow ? 0 : g.days.reduce((n, d) => n + pbdBlocksOn(d).filter(b => b.ref).reduce((m, b) => m + b.durationMin, 0), 0);
    const did = g.days.reduce((n, d) => n + timeOnDay(d).filter(e => e.kind !== 'break' && timeNarrowMatch(e, narrow)).reduce((m, e) => m + timeMinutes(e), 0), 0);
    return {w: g.w, plan, did};
  });
  const top = Math.max(60, ...rows.map(x => Math.max(x.plan, x.did)));
  if(!rows.some(x => x.plan || x.did)) return '';
  return `<div class="tmb-weeks">${rows.map(x => `<div class="tmb-wr"><span class="mono faint">${esc(fmtDate(x.w, 'short'))}</span>
      <div class="tmb-wb">${narrow ? '' : `<i class="plan" style="width:${(x.plan / top * 100).toFixed(1)}%" title="planned ${tmbSay(x.plan)}"></i>`}<i class="did" style="width:${(x.did / top * 100).toFixed(1)}%" title="tracked ${tmbSay(x.did)}"></i></div>
      <span class="mono faint">${narrow ? '' : `plan ${tmbSay(x.plan)} · `}tracked ${tmbSay(x.did)}</span></div>`).join('')}
    <div class="faint tmb-note">Weeks beginning on the date shown. Planned is the time blocks gave to work and habits; tracked leaves out breaks.</div></div>`;
}
