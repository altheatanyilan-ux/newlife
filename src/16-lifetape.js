/* ============================================================
   THE LIFE TAPE — what you actually lived
   Your calendar holds what you meant to do. This holds what
   happened: every entry, nod, interaction, habit and leaf that
   carries a date, assembled onto that date without anyone
   logging anything twice. Six zooms — a day you can read, a week
   you can see the shape of, and a month, a quarter, a half and a
   year you can see whole, each with the summary that turns a zoom
   level into a review.
   ============================================================ */
/* kind → [section, colour, icon] */
const TAPE_KINDS = {
  reflection:   ['Journals',  'var(--rose)',  '✎'],
  gratitude:    ['Journals',  '#c98a8a',      '♡'],
  dream:        ['Journals',  '#8a7fb8',      '☾'],
  synchronicity:['Journals',  'var(--gold)',  '∞'],
  manifestation:['Journals',  '#b98aa6',      '✦'],
  question:     ['Journals',  '#8fa9c4',      '?'],
  uncategorized:['Journals',  'var(--muted)', '▫'],
  quote:        ['Library',   'var(--gold)',  '"'],
  media:        ['Library',   '#c9a05a',      '▤'],
  memory:       ['Timeline',  '#cba85a',      '◌'],
  lifeevent:    ['Timeline',  '#cba85a',      '◆'],
  artifact:     ['Timeline',  '#a3978a',      '▣'],
  letter:       ['Letters',   '#b8a68c',      '✉'],
  decision:     ['Decisions', '#c25b5b',      '⚖'],
  progress:     ['Skills',    '#3fae7a',      '↗'],
  visualization:['Morning',   '#7b7de3',      '◉'],
  nod:          ['Projects',  'var(--sage)',  '·'],
  habit:        ['Habits',    'var(--terra)', '◍'],
  interaction:  ['People',    '#6b7f8e',      '☺'],
  evidence:     ['Vision',    '#7b7de3',      '❦'],
};
const tapeKind = k => TAPE_KINDS[k] || ['Journals', 'var(--muted)', '▫'];
const TAPE_SECTIONS = [...new Set(Object.values(TAPE_KINDS).map(v => v[0]))];

function tapeState(){
  const t = S._lt = S._lt || {};
  t.view = ['day','week','month','quarter','half','year'].includes(t.view) ? t.view : 'week';
  t.day = /^\d{4}-\d{2}-\d{2}$/.test(t.day) ? t.day : today();
  t.mode = 'total';
  t.types = Array.isArray(t.types) ? t.types : [];
  t.sections = Array.isArray(t.sections) ? t.sections : [];
  t.q = t.q || ''; t.tag = t.tag || ''; t.from = t.from || ''; t.to = t.to || '';
  return t;
}
const dayOf = e => String(e.occurredAt || e.createdAt || '').slice(0,10);

/* ---------- everything that carries a date, normalised ---------- */
function tapeItems(from, to){
  const inRange = d => /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= from && d <= to;
  const out = [];
  S.entries.forEach(e => {
    const d = dayOf(e); if(!inRange(d)) return;
    if(typeof letterIsSealed === 'function' && letterIsSealed(e)) return;
    const kind = e.type === 'media' || e.extra?.kind ? (e.type === 'media' ? 'media' : e.type) : e.type;
    out.push({date:d, kind, title:e.title || '', body:e.body || '', entry:e, id:e.id});
  });
  (S.nods || []).forEach(n => { const d = String(n.date||'').slice(0,10); if(!inRange(d)) return;
    out.push({date:d, kind:'nod', title:byId(S.projects, n.projectId)?.name || 'A nod', body:n.text || '', go:'#/projects/'+n.projectId, id:n.id}); });
  (S.interactions || []).forEach(i => { const d = String(i.date||'').slice(0,10); if(!inRange(d)) return;
    out.push({date:d, kind:'interaction', title:byId(S.people, i.personId)?.name || 'Someone', body:i.description || '', go:'#/people/'+i.personId, id:i.id}); });
  Object.entries(S.habitLog || {}).forEach(([d, log]) => { if(!inRange(d)) return;
    Object.entries(log || {}).forEach(([hid, v]) => { const h = byId(S.habits, hid); if(!h) return;
      out.push({date:d, kind:'habit', title:`${h.icon||''} ${h.name}`.trim(), body:v?.note || (v?.level === 'min' ? 'the minimum version' : ''), habit:h, level:v?.level, id:hid+':'+d}); }); });
  (S.visions || []).forEach(v => (v.evidence || []).forEach((ev, i) => { const d = String(ev.date||'').slice(0,10); if(!inRange(d)) return;
    out.push({date:d, kind:'evidence', title:v.name, body:ev.text || '', go:'#/vision/'+v.id, id:v.id+':ev'+i}); }));
  return out.sort((a,b) => a.date.localeCompare(b.date));
}
/* the filter bar, applied */
function tapeFilter(items){
  const t = tapeState(); const q = t.q.trim().toLowerCase();
  return items.filter(it => {
    if(t.types.length && !t.types.includes(it.kind)) return false;
    if(t.sections.length && !t.sections.includes(tapeKind(it.kind)[0])) return false;
    if(t.from && it.date < t.from) return false;
    if(t.to && it.date > t.to) return false;
    if(q && !`${it.title} ${it.body}`.toLowerCase().includes(q)) return false;
    if(t.tag && !(it.entry && JSON.stringify(it.entry.links || {}).includes(t.tag))) return false;
    return true;
  });
}
const tapeFiltered = (from, to) => tapeFilter(tapeItems(from, to));
function tapeActive(){ const t = tapeState(); return !!(t.types.length || t.sections.length || t.q || t.tag || t.from || t.to); }

/* ---------- a small card for the things that are not journal entries ---------- */
function tapeItemHTML(it){
  if(it.entry) return entryCard(it.entry);
  const [section, color, icon] = tapeKind(it.kind);
  return `<div class="tape-item" style="--c:${color}" ${it.go?`data-tapego="${esc(it.go)}"`:''}>
    <span class="ti-ico">${icon}</span>
    <span class="ti-body"><b>${esc(it.title)}</b>${it.body?`<div class="ti-text">${esc(it.body)}</div>`:''}</span>
    <span class="chip on" style="--c:${color}">${esc(section)}</span></div>`;
}

/* ---------- Day View — the daily newspaper of your life ---------- */
function tapeDayHTML(d){
  const T = today(); const c = S.checkins?.[d]; const items = tapeFiltered(d, d);
  const entries = items.filter(x => x.entry), others = items.filter(x => !x.entry);
  const letters = (S.entries || []).filter(e => e.type === 'letter' && e.extra?.openedAt && String(e.extra.openedAt).slice(0,10) === d);
  const energyRow = c?.energy && Object.keys(c.energy).length
    ? `<div class="energy-row">${DIMS.map(x => `<div class="energy-dim" style="--c:${x.c}"><div class="lbl"><span>${x.name}</span><span class="mono">${c.energy[x.id]||'–'}/5</span></div><div class="dots">${[1,2,3,4,5].map(n=>`<i class="${(c.energy[x.id]||0)>=n?'on':''}"></i>`).join('')}</div></div>`).join('')}</div>` : '';
  return `
    <div class="row between rv" style="align-items:baseline;flex-wrap:wrap;gap:10px">
      <h2 style="margin:0">${esc(fmtDate(d))}</h2>
      <span class="row" style="gap:6px"><button class="btn sm ghost" data-tapeday="${addDays(d,-1)}">‹ ${esc(fmtDate(addDays(d,-1),'short'))}</button>
        ${d!==T?`<button class="btn sm ghost" data-tapeday="${T}">today</button>`:''}
        <button class="btn sm ghost" data-tapeday="${addDays(d,1)}">${esc(fmtDate(addDays(d,1),'short'))} ›</button></span>
    </div>
    ${c && (c.intention || c.setpoint || energyRow || c.mood) ? `<section class="section rv"><span class="sc">The morning</span>
      ${c.intention?`<div class="intention-card" style="font-size:1.1rem;margin-bottom:10px">${esc(c.intention)}</div>`:''}
      ${energyRow}
      ${c.setpoint?`<div class="mono" style="margin-top:8px">set-point ${c.setpoint}/22 · ${esc(hicksName(c.setpoint))}</div>`:''}
    </section>` : ''}
    ${typeof habitRingRow === 'function' ? `<section class="section rv"><span class="sc">The habits</span>${habitRingRow(d)}</section>` : ''}
    ${others.length ? `<section class="section rv"><span class="sc">Logged elsewhere</span><div class="stack" style="gap:6px">${others.map(tapeItemHTML).join('')}</div></section>` : ''}
    <section class="section rv"><span class="sc">Written${entries.length?` · ${entries.length}`:''}</span>
      ${entries.length ? entries.map(x => entryCard(x.entry, {clamp:false})).join('') : '<div class="empty">Nothing written on this day.</div>'}</section>
    ${letters.length ? `<section class="section rv"><span class="sc">Letters opened</span>${letters.map(e=>entryCard(e,{clamp:false})).join('')}</section>` : ''}
    ${c?.sentence ? `<section class="section rv"><span class="sc">The evening</span><blockquote class="rehearsal-epigraph" style="font-size:1rem">${esc(c.sentence)}<cite>how the day was, in one line</cite></blockquote></section>` : ''}
    ${d === T && typeof onThisDayHTML === 'function' ? `<section class="section rv"><span class="sc">On this day, in other years</span>${onThisDayHTML()}</section>` : ''}`;
}

/* ---------- Week View — the shape of seven days ---------- */
function tapeWeekHTML(anchor){
  const days = planDaysFrom(anchor); const T = today();
  const counts = days.map(d => tapeFiltered(d, d));
  const max = Math.max(4, ...counts.map(c => c.length));
  return `
    <div class="row between rv" style="margin-bottom:12px;flex-wrap:wrap;gap:8px">
      <b class="serif" style="font-size:1.15rem">Week of ${esc(fmtDate(days[0],'med'))}</b>
      <span class="row" style="gap:6px"><button class="btn sm ghost" data-tapeweek="${addDays(anchor,-7)}">‹</button><button class="btn sm ghost" data-tapeweek="${T}">this week</button><button class="btn sm ghost" data-tapeweek="${addDays(anchor,7)}">›</button></span>
    </div>
    <div class="tape-week rv">${days.map((d, i) => { const its = counts[i]; const st = dayState(d);
      const due = (S.habits||[]).filter(h => !h.archived && !h.negative && habitDue(h,d));
      const doneN = due.filter(h => habitDone(h,d)).length;
      return `<div class="tw-col ${d===T?'today':''}" data-tapeday="${d}">
        <div class="tw-head"><span class="dn">${DOW[parseDay(d).getDay()].slice(0,3)}</span><span class="dd">${parseDay(d).getDate()}</span></div>
        ${due.length ? `<div class="tw-rings">${ringSVG(doneN/due.length, {size:26, stroke:3, color:'var(--terra)'})}<span class="mono">${doneN}/${due.length}</span></div>` : '<div class="tw-rings"></div>'}
        <div class="tw-stack">${its.slice(0,26).map(x => `<i style="background:${tapeKind(x.kind)[1]}" title="${esc(tapeKind(x.kind)[0])} · ${esc(x.title||x.body.slice(0,50))}"></i>`).join('') || '<span class="tw-quiet"></span>'}</div>
        <div class="tw-foot"><span class="mono">${its.length||''}</span>${st!==null?`<i class="tw-dot" style="background:${stateColor(st)}" title="state ${st}/100"></i>`:''}</div>
      </div>`; }).join('')}</div>
    <div class="cal-legend rv" style="margin-top:12px">${TAPE_SECTIONS.map(s => { const k = Object.entries(TAPE_KINDS).find(([,v]) => v[0] === s);
      return `<span><i style="background:${k[1][1]}"></i>${esc(s)}</span>`; }).join('')}<span class="faint">bar height is the day's weight · click a day to read it</span></div>
    ${dayShapeHTML(days[0], days[6])}`;
}

/* ---------- Month, Quarter and Half-year — the same grid at three zooms ----------
   One month block, drawn compactly or full size, is all three views need. The
   summary above it is what turns a zoom level into a review. */
function shiftMonths(day, n){ const a = parseDay(day); return isoDay(new Date(a.getFullYear(), a.getMonth()+n, 1)); }
function monthRange(y, m){ return {from:`${y}-${pad(m+1)}-01`, to:isoDay(new Date(y, m+1, 0))}; }
const cellStyle = lv => lv ? `background:color-mix(in srgb, ${lv.color} ${Math.round(lv.op*100)}%, transparent)` : '';

function tapeMonthBlock(y, m, byDay, mode, compact){
  const T = today(); const cells = monthDays(y, m);
  return `<div class="tape-month ${compact?'compact':''}">
    <button class="tm-title mono" data-tapemonth="${y}-${pad(m+1)}-01">${MONTHS[m]}${compact?'':` ${y}`}</button>
    <div class="tm-grid">
      ${['M','T','W','T','F','S','S'].map(d => `<span class="tm-dow">${d}</span>`).join('')}
      ${cells.map(c => { if(c.out) return `<i class="tm-day out"></i>`;
        const lv = tapeCellLevel(c.d, mode, byDay); const n = (byDay[c.d]||[]).length;
        return `<i class="tm-day ${c.d===T?'today':''} ${c.d>T?'ahead':''}" data-tapeday="${c.d}" style="${cellStyle(lv)}" title="${esc(fmtDate(c.d,'med'))} · ${n} logged">${compact?'':`<span>${parseDay(c.d).getDate()}</span>`}</i>`; }).join('')}
    </div></div>`;
}
/* what a stretch of time added up to — the reason to zoom out at all */
function tapePeriodSummaryHTML(from, to, items){
  const T = today(); const upto = to > T ? T : to;
  const days = []; { let d = from; let guard = 0; while(d <= upto && guard++ < 800){ days.push(d); d = addDays(d,1); } }
  const byDay = {}; items.forEach(x => (byDay[x.date] = byDay[x.date] || []).push(x));
  const live = days.filter(d => (byDay[d]||[]).length).length;
  const sps = days.map(d => S.checkins?.[d]?.setpoint).filter(Boolean);
  const habits = S.habits.filter(h => !h.archived && !h.negative);
  const due = sum(days.map(d => habits.filter(h => habitDue(h,d)).length));
  const held = sum(days.map(d => habits.filter(h => habitDue(h,d) && habitDone(h,d)).length));
  const busiest = Object.entries(byDay).sort((a,b)=>b[1].length-a[1].length)[0];

  /* section tally (Journals, Skills…) */
  const secTally = {}; items.forEach(x => { const s = tapeKind(x.kind)[0]; secTally[s] = (secTally[s]||0)+1; });
  const topSecs = Object.entries(secTally).sort((a,b)=>b[1]-a[1]).slice(0,4);

  /* individual type tally (reflection, gratitude, dream…) */
  const kindTally = {}; items.forEach(x => { kindTally[x.kind] = (kindTally[x.kind]||0)+1; });
  const topKinds = Object.entries(kindTally).sort((a,b)=>b[1]-a[1]).slice(0,8);

  /* most-linked values */
  const valCount = {};
  items.forEach(x => { if(x.entry) (x.entry.links?.values||[]).forEach(vid => { valCount[vid] = (valCount[vid]||0)+1; }); });
  const topVals = Object.entries(valCount).sort((a,b)=>b[1]-a[1]).slice(0,5)
    .map(([id,n]) => { const v = byId(S.values, id); return v ? {v, n} : null; }).filter(Boolean);

  /* most-linked visions */
  const visCount = {};
  items.forEach(x => { if(x.entry) (x.entry.links?.visions||[]).forEach(vid => { visCount[vid] = (visCount[vid]||0)+1; }); });
  const topVis = Object.entries(visCount).sort((a,b)=>b[1]-a[1]).slice(0,5)
    .map(([id,n]) => { const v = byId(S.visions, id); return v ? {v, n} : null; }).filter(Boolean);

  /* set-point distribution bands */
  const spBands = [{lo:19,hi:22,label:'Thriving',c:'var(--gold)'},{lo:14,hi:18,label:'Positive',c:'var(--sage)'},{lo:8,hi:13,label:'Neutral',c:'var(--muted)'},{lo:1,hi:7,label:'Struggling',c:'var(--rose)'}];
  const spDist = spBands.map(b => ({...b, n: sps.filter(v => v >= b.lo && v <= b.hi).length})).filter(b => b.n);

  return `<div class="card rv" style="margin-bottom:14px">
    <div class="income-strip">
      <div><div class="k">logged</div><div class="num" data-tween="${items.length}">0</div></div>
      <div><div class="k">active days</div><div class="num">${live}<span class="mono"> / ${days.length}</span></div></div>
      <div><div class="k">habits held</div><div class="num">${due?Math.round(held/due*100):0}<span class="mono">%</span></div></div>
      <div><div class="k">avg set-point</div><div class="num">${sps.length?avg(sps).toFixed(1):'—'}<span class="mono"> / 22</span></div></div>
    </div>
    ${topSecs.length ? `<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:12px">
      ${topSecs.map(([sec,n]) => { const k = Object.entries(TAPE_KINDS).find(([,v]) => v[0] === sec);
        return `<span class="chip on" style="--c:${k?k[1][1]:'var(--muted)'}">${esc(sec)} · ${n}</span>`; }).join('')}
      ${busiest ? `<span class="mono" style="margin-left:auto">fullest day <button class="tbtn" data-tapeday="${busiest[0]}">${esc(fmtDate(busiest[0],'med'))} · ${busiest[1].length}</button></span>` : ''}
    </div>` : ''}
    ${topKinds.length ? `<div class="row" style="gap:5px;flex-wrap:wrap;margin-top:8px">
      <span class="sc" style="align-self:center;width:100%;margin-bottom:2px">By type</span>
      ${topKinds.map(([k,n]) => { const [,color,icon] = tapeKind(k);
        return `<span class="chip" style="border:1px solid color-mix(in srgb,${color} 40%,var(--line));color:${color}">${icon} ${esc(k)} <span class="mono" style="color:var(--muted);margin-left:3px">${n}</span></span>`; }).join('')}
    </div>` : ''}
    ${spDist.length ? `<div class="tape-sp-dist rv" style="margin-top:10px">
      <span class="sc" style="display:block;margin-bottom:6px">Set-point distribution</span>
      <div class="row" style="gap:4px;flex-wrap:wrap;align-items:center">
        ${spDist.map(b => `<span class="chip" style="border:1px solid color-mix(in srgb,${b.c} 40%,var(--line));color:${b.c}">${esc(b.label)} <span class="mono" style="color:var(--muted)">${b.n}d</span></span>`).join('')}
      </div>
    </div>` : ''}
    ${topVals.length || topVis.length ? `<div class="tape-links-summary rv" style="margin-top:10px">
      ${topVals.length ? `<div style="margin-bottom:6px">
        <span class="sc" style="display:block;margin-bottom:4px">Top linked values</span>
        <div class="row" style="gap:5px;flex-wrap:wrap">
          ${topVals.map(({v,n}) => `<span class="chip on" style="--c:${v.color||'var(--muted)'}">${esc(v.name)} <span class="mono">×${n}</span></span>`).join('')}
        </div>
      </div>` : ''}
      ${topVis.length ? `<div>
        <span class="sc" style="display:block;margin-bottom:4px">Top linked visions</span>
        <div class="row" style="gap:5px;flex-wrap:wrap">
          ${topVis.map(({v,n}) => `<span class="chip on" style="--c:var(--ment)">${esc(v.name)} <span class="mono">×${n}</span></span>`).join('')}
        </div>
      </div>` : ''}
    </div>` : ''}
  </div>`;
}
function tapeMonthStripHTML(monthKeys, all){
  const cols = monthKeys.length >= 12 ? 4 : monthKeys.length >= 6 ? 3 : monthKeys.length;
  return `<div class="tape-months rv" style="grid-template-columns:repeat(${cols},1fr)">${monthKeys.map(({y,m}) => {
    const pre = `${y}-${pad(m+1)}`;
    const its = all.filter(x => x.date.startsWith(pre));
    const sps = Object.entries(S.checkins||{}).filter(([d,c]) => d.startsWith(pre) && c.setpoint).map(([,c]) => c.setpoint);
    /* top individual type for this month */
    const kt = {}; its.forEach(x => { kt[x.kind] = (kt[x.kind]||0)+1; });
    const topKind = Object.entries(kt).sort((a,b)=>b[1]-a[1])[0];
    const [,topColor,topIcon] = topKind ? tapeKind(topKind[0]) : [];
    /* set-point micro-indicator */
    const spAvgN = sps.length ? Math.round(avg(sps)) : null;
    const spColor = spAvgN ? (spAvgN >= 19 ? 'var(--gold)' : spAvgN >= 14 ? 'var(--sage)' : spAvgN >= 8 ? 'var(--muted)' : 'var(--rose)') : null;
    return `<button class="tm-cell ${its.length?'':'quiet'}" data-tapemonth="${y}-${pad(m+1)}-01">
      <div class="mono">${MONTHS[m].slice(0,3)}${monthKeys.length>12?` '${String(y).slice(2)}`:''}</div>
      <div class="serif" style="font-size:1.1rem">${its.length||'—'}</div>
      ${spAvgN?`<div class="mono" style="color:${spColor}">${spAvgN}/22</div>`:''}
      ${topKind?`<div class="mono" style="color:${topColor}">${topIcon} ${esc(topKind[0])}</div>`:''}</button>`; }).join('')}</div>`;
}
/* ---------- The shape of the day ----------
   Four things at once, on one clock axis: what time you woke, what time you
   closed the day, and how the hours between them split into used and wasted.
   The bar is the waking window; the fill inside it is the split, with what
   was neither claimed nor confessed left hollow. Over a long span the days
   are averaged into weeks or months so the bars stay readable. */
const DS_LO = 4, DS_HI = 26;   /* 4am to 2am — the window a day can occupy */
const dsHour = iso => { if(!iso) return null; const d = new Date(iso); return d.getHours() + d.getMinutes()/60; };
function dsDayRecord(d){
  const c = S.checkins?.[d]; if(!c) return null;
  let wake = dsHour(c.wakeAt), close = dsHour(c.closeAt);
  if(wake == null && close == null && c.hoursUsed == null && c.hoursWasted == null) return null;
  /* a close after midnight belongs to the same waking day, so it sits past 24 */
  if(wake != null && close != null && close < wake) close += 24;
  return {d, wake, close, used:+c.hoursUsed || 0, wasted:+c.hoursWasted || 0};
}
function dsBucket(days, label){
  const recs = days.map(dsDayRecord).filter(Boolean);
  if(!recs.length) return {label, empty:true, days:days.length};
  const m = k => { const v = recs.map(r => r[k]).filter(x => x != null); return v.length ? avg(v) : null; };
  return {label, empty:false, n:recs.length, days:days.length,
    wake:m('wake'), close:m('close'), used:m('used'), wasted:m('wasted')};
}
function dayShapeHTML(from, to, {title='The shape of the day'} = {}){
  const days = []; { let d = from; let g = 0; const stop = to > today() ? today() : to;
    while(d <= stop && g++ < 800){ days.push(d); d = addDays(d,1); } }
  if(!days.length) return '';
  /* keep the bars legible: past ~40 days group into weeks, past ~200 into months */
  let buckets;
  if(days.length <= 40) buckets = days.map(d => dsBucket([d], fmtDate(d,'short')));
  else if(days.length <= 200){
    const w = []; for(let i=0;i<days.length;i+=7) w.push(days.slice(i,i+7));
    buckets = w.map(g => dsBucket(g, fmtDate(g[0],'short')));
  } else {
    const byM = {}; days.forEach(d => (byM[d.slice(0,7)] = byM[d.slice(0,7)] || []).push(d));
    buckets = Object.entries(byM).map(([k,g]) => dsBucket(g, MONTHS[+k.slice(5,7)-1].slice(0,3)));
  }
  const filled = buckets.filter(b => !b.empty);
  if(!filled.length) return `<section class="section rv day-shape"><span class="sc">${esc(title)}</span>
    <div class="empty" style="margin-top:8px">No waking or closing times logged yet. They are recorded on the Today page — the wake time when you open it, the closing time when you finish the day.</div></section>`;

  const H = 190, W = Math.max(320, buckets.length * (buckets.length > 60 ? 9 : buckets.length > 24 ? 16 : 30));
  const barW = Math.max(3, (W / buckets.length) * 0.6);
  const y = h => H - ((h - DS_LO) / (DS_HI - DS_LO)) * H;
  const xs = i => (i + 0.5) * (W / buckets.length);
  const ticks = [6, 9, 12, 15, 18, 21, 24];

  const bars = buckets.map((b, i) => {
    if(b.empty) return '';
    const x = xs(i) - barW/2;
    const w0 = b.wake, c0 = b.close;
    if(w0 == null && c0 == null){
      /* only a split was logged — draw it as a free-floating column */
      const tot = b.used + b.wasted; if(!tot) return '';
      const top = y(DS_LO + tot);
      return `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${barW.toFixed(1)}" height="${(H-top).toFixed(1)}" rx="2" fill="var(--sage)" opacity=".28"/>`;
    }
    const hi = y(c0 ?? (w0 + 16)), lo = y(w0 ?? ((c0 ?? 22) - 16));
    const barH = Math.max(2, lo - hi);
    const awake = (c0 != null && w0 != null) ? (c0 - w0) : null;
    const acc = b.used + b.wasted;
    /* the split fills upward from the wake end, in proportion to the window */
    const scale = awake && acc ? Math.min(1, acc / awake) : 0;
    const usedH = awake ? barH * (b.used / awake) : 0;
    const wastedH = awake ? barH * (b.wasted / awake) : 0;
    return `<g class="ds-bar" data-dslabel="${esc(b.label)}">
      <rect x="${x.toFixed(1)}" y="${hi.toFixed(1)}" width="${barW.toFixed(1)}" height="${barH.toFixed(1)}" rx="2" fill="var(--page-accent)" opacity=".14"/>
      ${usedH > .5 ? `<rect x="${x.toFixed(1)}" y="${(lo-usedH).toFixed(1)}" width="${barW.toFixed(1)}" height="${usedH.toFixed(1)}" rx="2" fill="var(--sage)" opacity=".85"/>` : ''}
      ${wastedH > .5 ? `<rect x="${x.toFixed(1)}" y="${(lo-usedH-wastedH).toFixed(1)}" width="${barW.toFixed(1)}" height="${wastedH.toFixed(1)}" rx="2" fill="var(--rose)" opacity=".7"/>` : ''}
      <title>${esc(b.label)}${w0!=null?` · woke ${fmtClock(w0)}`:''}${c0!=null?` · closed ${fmtClock(c0)}`:''}${acc?` · ${b.used.toFixed(1)}h used, ${b.wasted.toFixed(1)}h wasted`:''}${b.n>1?` · ${b.n} day${b.n>1?'s':''} averaged`:''}</title>
    </g>`;
  }).join('');

  const line = (key, color) => { const pts = buckets.map((b,i) => b.empty || b[key]==null ? null : `${xs(i).toFixed(1)},${y(b[key]).toFixed(1)}`).filter(Boolean);
    return pts.length > 1 ? `<polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round" opacity=".8"/>` : ''; };

  const avgOf = k => { const v = filled.map(b => b[k]).filter(x => x != null); return v.length ? avg(v) : null; };
  const aw = avgOf('wake'), ac = avgOf('close'), au = avgOf('used'), awa = avgOf('wasted');

  return `<section class="section rv day-shape">
    <div class="row between" style="align-items:baseline;flex-wrap:wrap;gap:8px">
      <span class="sc" style="margin:0">${esc(title)}</span>
      <span class="mono faint">${filled.length} of ${buckets.length} ${days.length<=40?'days':days.length<=200?'weeks':'months'} logged</span>
    </div>
    <div class="ds-legend row" style="gap:12px;flex-wrap:wrap;margin:8px 0 4px">
      <span class="ds-key"><i style="background:var(--gold)"></i>woke${aw!=null?` · avg ${fmtClock(aw)}`:''}</span>
      <span class="ds-key"><i style="background:var(--ment)"></i>closed${ac!=null?` · avg ${fmtClock(ac)}`:''}</span>
      <span class="ds-key"><i style="background:var(--sage)"></i>used well${au!=null?` · avg ${au.toFixed(1)}h`:''}</span>
      <span class="ds-key"><i style="background:var(--rose)"></i>wasted${awa!=null?` · avg ${awa.toFixed(1)}h`:''}</span>
    </div>
    <div class="ds-scroll"><svg class="ds-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="none">
      ${ticks.map(h => `<g><line x1="0" y1="${y(h).toFixed(1)}" x2="${W}" y2="${y(h).toFixed(1)}" stroke="var(--line)" stroke-width="1" opacity=".5"/>
        <text x="2" y="${(y(h)-3).toFixed(1)}" class="ds-tick">${fmtClock(h)}</text></g>`).join('')}
      ${bars}
      ${line('wake','var(--gold)')}
      ${line('close','var(--ment)')}
    </svg></div>
  </section>`;
}
const fmtClock = h => { const hh = Math.floor(h) % 24, mm = Math.round((h % 1) * 60); const ap = hh >= 12 ? 'pm' : 'am'; const h12 = hh % 12 || 12; return mm ? `${h12}:${String(mm).padStart(2,'0')}${ap}` : `${h12}${ap}`; };

/* one month, big enough to read the dates */
function tapeMonthHTML(anchor){
  const t = tapeState(); const a = parseDay(anchor); const y = a.getFullYear(), m = a.getMonth();
  const {from, to} = monthRange(y, m);
  const all = tapeFiltered(from, to);
  const byDay = {}; all.forEach(x => (byDay[x.date] = byDay[x.date] || []).push(x));
  return `
    <div class="row between rv" style="margin-bottom:10px;flex-wrap:wrap;gap:8px">
      <b class="serif" style="font-size:1.15rem">${MONTHS[m]} ${y}</b>
      <span class="row" style="gap:6px"><button class="btn sm ghost" data-tapemonth="${shiftMonths(anchor,-1)}">‹</button><button class="btn sm ghost" data-tapemonth="${today().slice(0,8)}01">this month</button><button class="btn sm ghost" data-tapemonth="${shiftMonths(anchor,1)}">›</button></span>
    </div>
    ${tapePeriodSummaryHTML(from, to, all)}
    ${dayShapeHTML(from, to)}
    <div class="rv">${tapeMonthBlock(y, m, byDay, t.mode, false)}</div>
    <details class="section rv" style="margin-top:14px"><summary><span class="sc">Everything in this month, in order</span><span class="mono"> ${all.length}</span></summary>
      <div class="stack" style="gap:6px;margin-top:10px">${all.length ? all.slice(-220).reverse().map(tapeItemHTML).join('') : '<div class="empty">Nothing logged this month.</div>'}
      ${all.length > 220 ? `<div class="faint" style="font-size:.78rem">Showing the most recent 220 of ${all.length}. Narrow it with the filters above.</div>` : ''}</div></details>`;
}
/* three months, or six — the same block, compact, side by side */
function tapeSpanHTML(anchor, monthCount, label){
  const t = tapeState(); const a = parseDay(anchor);
  const startM = monthCount === 3 ? Math.floor(a.getMonth()/3)*3 : a.getMonth() < 6 ? 0 : 6;
  const y = a.getFullYear();
  const months = Array.from({length:monthCount}, (_,i) => { const d = new Date(y, startM+i, 1); return {y:d.getFullYear(), m:d.getMonth()}; });
  const from = `${months[0].y}-${pad(months[0].m+1)}-01`;
  const last = months[months.length-1]; const to = isoDay(new Date(last.y, last.m+1, 0));
  const all = tapeFiltered(from, to);
  const byDay = {}; all.forEach(x => (byDay[x.date] = byDay[x.date] || []).push(x));
  const name = monthCount === 3 ? `Q${Math.floor(startM/3)+1} ${y}` : `${startM === 0 ? 'January–June' : 'July–December'} ${y}`;
  const prev = isoDay(new Date(y, startM - monthCount, 1)), next = isoDay(new Date(y, startM + monthCount, 1));
  return `
    <div class="row between rv" style="margin-bottom:10px;flex-wrap:wrap;gap:8px">
      <b class="serif" style="font-size:1.15rem">${esc(name)}</b>
      <span class="row" style="gap:6px"><button class="btn sm ghost" data-tapespan="${prev}">‹</button><button class="btn sm ghost" data-tapespan="${today()}">this ${esc(label)}</button><button class="btn sm ghost" data-tapespan="${next}">›</button></span>
    </div>
    ${tapePeriodSummaryHTML(from, to, all)}
    ${dayShapeHTML(from, to)}
    <div class="tape-span rv" style="grid-template-columns:repeat(3,1fr)">${months.map(({y:yy,m}) => tapeMonthBlock(yy, m, byDay, t.mode, true)).join('')}</div>
    ${tapeMonthStripHTML(months, all)}`;
}

/* ---------- Year View — the whole year at once ---------- */
function tapeYearDays(year){
  const out = []; let d = `${year}-01-01`; const end = `${year}-12-31`;
  while(d <= end){ out.push(d); d = addDays(d, 1); }
  return out;
}
function tapeCellLevel(d, mode, byDay){
  if(mode === 'setpoint'){ const sp = S.checkins?.[d]?.setpoint; return sp ? {op:.18 + (sp/22)*.82, color: sp >= 16 ? 'var(--gold)' : sp >= 11 ? 'var(--sage)' : '#6b7f8e'} : null; }
  if(mode === 'streak'){ const due = (S.habits||[]).filter(h => !h.archived && !h.negative && habitDue(h,d));
    if(!due.length) return null; const all = due.every(h => habitDone(h,d));
    return all ? {op:1, color:'var(--terra)'} : {op:.22, color:'var(--muted)'}; }
  const n = (byDay[d] || []).length;
  if(!n) return null;
  if(mode === 'section'){ const top = {}; (byDay[d]||[]).forEach(x => { const s = tapeKind(x.kind)[0]; top[s] = (top[s]||0)+1; });
    const win = Object.entries(top).sort((a,b)=>b[1]-a[1])[0][0];
    const k = Object.entries(TAPE_KINDS).find(([,v]) => v[0] === win);
    return {op:Math.min(1, .3 + n/8), color:k ? k[1][1] : 'var(--page-accent)'}; }
  return {op:Math.min(1, .22 + n/9), color:'var(--page-accent)'};
}
function tapeGrid(days, mode, byDay){
  const lead = (parseDay(days[0]).getDay()+6)%7;
  return `<div class="tape-grid">${Array.from({length:lead}, ()=>'<i class="tg-pad"></i>').join('')}
    ${days.map(d => { const lv = tapeCellLevel(d, mode, byDay);
      return `<i class="tg-cell" data-tapeday="${d}" style="${lv?`background:${lv.color};opacity:${lv.op.toFixed(2)}`:''}" title="${esc(fmtDate(d,'med'))} · ${(byDay[d]||[]).length} logged"></i>`; }).join('')}</div>`;
}
function tapeYearHTML(year){
  const t = tapeState(); const days = tapeYearDays(year).filter(d => d <= today());
  const all = tapeFiltered(`${year}-01-01`, `${year}-12-31`);
  const byDay = {}; all.forEach(x => (byDay[x.date] = byDay[x.date] || []).push(x));
  const months = Array.from({length:12}, (_,m) => ({y:year, m}));
  return `
    <div class="row between rv" style="margin-bottom:10px;flex-wrap:wrap;gap:8px">
      <b class="serif" style="font-size:1.15rem">${year}</b>
      <span class="row" style="gap:6px"><button class="btn sm ghost" data-tapeyear="${year-1}">‹</button><button class="btn sm ghost" data-tapeyear="${new Date().getFullYear()}">this year</button><button class="btn sm ghost" data-tapeyear="${year+1}">›</button></span>
    </div>
    <div class="rv">${tapeGrid(days, t.mode, byDay)}</div>
    ${tapePeriodSummaryHTML(`${year}-01-01`, `${year}-12-31`, all)}
    ${dayShapeHTML(`${year}-01-01`, `${year}-12-31`)}
    ${tapeMonthStripHTML(months, all)}`;
}

/* ---------- the filter bar ---------- */
function tapeFilterHTML(){
  const t = tapeState();
  const dims = [...S.stages.map(s=>[s.id,s.char+' '+s.name]), ...S.threads.map(x=>[x.id,'thread · '+x.name]), ...S.values.map(v=>[v.id,'value · '+v.name]),
                ...S.visions.map(v=>[v.id,'vision · '+v.name]), ...S.skills.map(s=>[s.id,'skill · '+s.name]), ...S.projects.map(p=>[p.id,'project · '+p.name]), ...(S.people||[]).map(p=>[p.id,'person · '+p.name])];
  return `<details class="tape-filters rv" ${tapeActive()?'open':''}><summary><span class="sc">Filter the tape</span>${tapeActive()?`<span class="mono">filtered</span>`:''}</summary><div class="body">
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px">
      <input class="inp" id="ltq" placeholder="search everything written" value="${esc(t.q)}" style="flex:1;min-width:180px">
      <select class="sel" id="lttag" style="width:auto;max-width:210px"><option value="">any link</option>${dims.map(([id,n])=>`<option value="${id}" ${t.tag===id?'selected':''}>${esc(n)}</option>`).join('')}</select>
      <input class="inp" type="date" id="ltfrom" value="${t.from}" style="width:auto"><input class="inp" type="date" id="ltto" value="${t.to}" style="width:auto">
    </div>
    <div class="row" style="gap:5px;flex-wrap:wrap;margin-bottom:6px">${TAPE_SECTIONS.map(s => `<span class="chip click ${t.sections.includes(s)?'on':''}" data-ltsection="${esc(s)}">${esc(s)}</span>`).join('')}</div>
    <div class="row" style="gap:5px;flex-wrap:wrap">${Object.keys(TAPE_KINDS).map(k => `<span class="chip click ${t.types.includes(k)?'on':''}" style="--c:${tapeKind(k)[1]}" data-lttype="${k}">${tapeKind(k)[2]} ${esc(typeof typeName==='function'&&TAPE_KINDS[k]?(k==='habit'?'Habit':k==='nod'?'Nod':k==='interaction'?'Interaction':k==='evidence'?'Leaf':typeName(k)):k)}</span>`).join('')}</div>
    <div class="row" style="gap:6px;margin-top:10px;flex-wrap:wrap">
      ${[['this week',()=>0],['this month',0],['last 90 days',0],['this year',0]].map(([l]) => `<button class="btn sm ghost" data-ltrange="${esc(l)}">${l}</button>`).join('')}
      ${tapeActive()?`<button class="btn sm ghost" id="ltClear">clear</button>`:''}
    </div>
  </div></details>`;
}
function bindTapeFilters(box){
  const t = tapeState();
  const upd = debounce(() => { t.q = box.querySelector('#ltq')?.value ?? t.q; refreshLtBody(); const n = document.querySelector('#ltq'); if(n){ n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 350);
  box.querySelector('#ltq')?.addEventListener('input', upd);
  box.querySelector('#lttag')?.addEventListener('change', e => { t.tag = e.target.value; refreshLtBody(); });
  box.querySelector('#ltfrom')?.addEventListener('change', e => { t.from = e.target.value; refreshLtBody(); });
  box.querySelector('#ltto')?.addEventListener('change', e => { t.to = e.target.value; refreshLtBody(); });
  box.querySelectorAll('[data-ltsection]').forEach(c => c.onclick = () => { const s = c.dataset.ltsection;
    t.sections = t.sections.includes(s) ? t.sections.filter(x=>x!==s) : [...t.sections, s]; refreshLtBody(); });
  box.querySelectorAll('[data-lttype]').forEach(c => c.onclick = () => { const k = c.dataset.lttype;
    t.types = t.types.includes(k) ? t.types.filter(x=>x!==k) : [...t.types, k]; refreshLtBody(); });
  box.querySelectorAll('[data-ltrange]').forEach(b => b.onclick = () => {
    const T = today(); const l = b.dataset.ltrange;
    if(l === 'this week'){ t.from = weekStart(T); t.to = addDays(weekStart(T), 6); }
    else if(l === 'this month'){ t.from = T.slice(0,8)+'01'; t.to = T; }
    else if(l === 'last 90 days'){ t.from = addDays(T, -89); t.to = T; }
    else { t.from = T.slice(0,4)+'-01-01'; t.to = T; }
    refreshLtBody();
  });
  box.querySelector('#ltClear')?.addEventListener('click', () => { Object.assign(t, {types:[], sections:[], q:'', tag:'', from:'', to:''}); refreshLtBody(); });
}

/* replace just #ltBody, keeping the tab bar and filter bar in place */
function refreshLtBody(){
  const t = tapeState();
  const body = document.getElementById('ltBody');
  if(!body){ rerender(); return; }
  body.innerHTML = t.view === 'day'     ? tapeDayHTML(t.day)
    : t.view === 'week'    ? tapeWeekHTML(t.day)
    : t.view === 'month'   ? tapeMonthHTML(t.day)
    : t.view === 'quarter' ? tapeSpanHTML(t.day, 3, 'quarter')
    : t.view === 'half'    ? tapeSpanHTML(t.day, 6, 'half')
    :                        tapeYearHTML(+t.day.slice(0,4));
  document.querySelectorAll('[data-ltview]').forEach(b => b.classList.toggle('active', b.dataset.ltview === t.view));
  _bindLtBody(body);
  reveal(body);
}

function _bindLtBody(body){
  const t = tapeState();
  body.querySelectorAll('[data-tapeday]').forEach(n => n.onclick = e => {
    if(e.target.closest('.entry,a,button:not([data-tapeday])')) return;
    t.day = n.dataset.tapeday; t.view = 'day'; refreshLtBody();
  });
  body.querySelectorAll('[data-tapeweek]').forEach(b => b.onclick = () => { t.day = b.dataset.tapeweek; t.view = 'week'; refreshLtBody(); });
  body.querySelectorAll('[data-tapeyear]').forEach(b => b.onclick = () => { t.day = b.dataset.tapeyear + t.day.slice(4); t.view = 'year'; refreshLtBody(); });
  body.querySelectorAll('[data-tapemonth]').forEach(b => b.onclick = e => { e.stopPropagation(); t.day = b.dataset.tapemonth; t.view = 'month'; refreshLtBody(); });
  body.querySelectorAll('[data-tapespan]').forEach(b => b.onclick = () => { t.day = b.dataset.tapespan; refreshLtBody(); });
  body.querySelectorAll('[data-tapego]').forEach(n => n.onclick = () => navigate(n.dataset.tapego));
  bindTapeFilters(body);
  if(typeof bindHabitRings === 'function') bindHabitRings(body);
}

/* ---------- persistent header strip ---------- */
function ltSparkSVG(vals, color, lo, hi){
  const W = 100, H = 28;
  const indexed = vals.map((v,i) => v != null ? {x: i / Math.max(vals.length - 1, 1) * W, y: H - ((v - lo) / (hi - lo || 1)) * H} : null);
  const pts = indexed.filter(Boolean);
  if(pts.length < 2) return `<svg class="lt-hs-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><text x="${W/2}" y="${H/2+4}" text-anchor="middle" font-size="8" fill="var(--muted)">—</text></svg>`;
  const line = 'M' + pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L');
  const area = line + ` L${pts[pts.length-1].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z`;
  const last = pts[pts.length-1];
  return `<svg class="lt-hs-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <defs><linearGradient id="ltg${color.replace(/[^a-z]/gi,'')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity=".3"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    <path d="${area}" fill="url(#ltg${color.replace(/[^a-z]/gi,'')})" />
    <path d="${line}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="2.5" fill="${color}"/>
  </svg>`;
}
function ltHeaderStripHTML(){
  const T = today();
  const days30 = [];
  for(let i = 29; i >= 0; i--) days30.push(addDays(T, -i));

  const spVals  = days30.map(d => S.checkins?.[d]?.setpoint ?? null);
  const spData  = spVals.filter(Boolean);
  const spAvg   = spData.length ? avg(spData) : null;
  const spNow   = spData.length ? spData[spData.length - 1] : null;
  const spTrend = spData.length >= 7
    ? (spData.slice(-7).reduce((a,b)=>a+b,0)/7) - (spData.slice(0,Math.min(7,spData.length)).reduce((a,b)=>a+b,0)/Math.min(7,spData.length))
    : 0;
  const tIco = spTrend > 0.5 ? '↗' : spTrend < -0.5 ? '↘' : '→';
  const spLabel = spNow ? hicksName(spNow).split(' / ')[0] : '—';

  const cells = DIMS.map(dim => {
    const vals = days30.map(d => S.checkins?.[d]?.energy?.[dim.id] ?? null);
    const data = vals.filter(Boolean);
    const av   = data.length ? avg(data) : null;
    const now  = data.length ? data[data.length - 1] : null;
    return {dim, vals, av, now};
  });

  return `<div class="lt-header-strip">
    <div class="lt-hs-cell lt-hs-cell-main">
      <div class="lt-hs-row"><span class="lt-hs-name mono">Set-point · 30d</span><span class="lt-hs-val">${spNow ? spNow : '—'}<span class="mono" style="font-weight:400">/22</span></span></div>
      ${ltSparkSVG(spVals, 'var(--gold)', 1, 22)}
      <div class="lt-hs-sub">${spAvg ? `avg ${spAvg.toFixed(1)} · ${spLabel} · ${tIco}` : 'no check-ins in 30 days'}</div>
    </div>
    ${cells.map(({dim, vals, av, now}) => `
    <div class="lt-hs-cell">
      <div class="lt-hs-row"><span class="lt-hs-name mono" style="color:${dim.c}">${dim.name.slice(0,4)}.</span><span class="lt-hs-val" style="color:${dim.c}">${now ?? '—'}<span class="mono" style="font-weight:400;color:var(--muted)">/5</span></span></div>
      ${ltSparkSVG(vals, dim.c, 0, 5)}
      <div class="lt-hs-sub">${av ? `avg ${av.toFixed(1)}/5` : '—'}</div>
    </div>`).join('')}
  </div>`;
}

/* ---------- the panel ---------- */
function renderLifeTape(box){
  const t = tapeState();
  box.innerHTML = `
    ${ltHeaderStripHTML()}
    <div class="row between" style="align-items:center;flex-wrap:wrap;gap:8px">
      <div class="lib-tabs">${[['day','Day'],['week','Week'],['month','Month'],['quarter','Quarter'],['half','Half-year'],['year','Year']].map(([k,l])=>`<button class="${t.view===k?'active':''}" data-ltview="${k}">${l}</button>`).join('')}</div>
      <span class="mono faint">what you actually lived</span>
    </div>
    ${tapeFilterHTML()}
    <div id="ltBody" style="margin-top:12px">${
        t.view === 'day'     ? tapeDayHTML(t.day)
      : t.view === 'week'    ? tapeWeekHTML(t.day)
      : t.view === 'month'   ? tapeMonthHTML(t.day)
      : t.view === 'quarter' ? tapeSpanHTML(t.day, 3, 'quarter')
      : t.view === 'half'    ? tapeSpanHTML(t.day, 6, 'half')
      :                        tapeYearHTML(+t.day.slice(0,4))}</div>`;
  box.querySelectorAll('[data-ltview]').forEach(b => b.onclick = () => { t.view = b.dataset.ltview; refreshLtBody(); });
  bindTapeFilters(box);
  _bindLtBody(box.querySelector('#ltBody') || box);
  reveal(box);
}
