/* ============================================================
   THE LIFE TAPE — what you actually lived
   Your calendar holds what you meant to do. This holds what
   happened: every entry, nod, interaction, habit and leaf that
   carries a date, assembled onto that date without anyone
   logging anything twice. Three zooms — a day you can read, a
   week you can see the shape of, a year you can see at once.
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
  quote:        ['Library',   'var(--gold)',  '“'],
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
  t.view = ['day','week','year'].includes(t.view) ? t.view : 'week';
  t.day = /^\d{4}-\d{2}-\d{2}$/.test(t.day) ? t.day : today();
  t.mode = ['total','setpoint','energy','section','streak'].includes(t.mode) ? t.mode : 'total';
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
      return `<span><i style="background:${k[1][1]}"></i>${esc(s)}</span>`; }).join('')}<span class="faint">bar height is the day's weight · click a day to read it</span></div>`;
}

/* ---------- Year View — the whole year at once ---------- */
const TAPE_MODES = [['total','Activity'],['setpoint','Set-point'],['energy','Energy'],['section','By section'],['streak','Habit streaks']];
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
  const months = Array.from({length:12}, (_,m) => {
    const pre = `${year}-${String(m+1).padStart(2,'0')}`;
    const its = all.filter(x => x.date.startsWith(pre));
    const sps = Object.entries(S.checkins||{}).filter(([d,c]) => d.startsWith(pre) && c.setpoint).map(([,c]) => c.setpoint);
    const tally = {}; its.forEach(x => { const s = tapeKind(x.kind)[0]; tally[s] = (tally[s]||0)+1; });
    const top = Object.entries(tally).sort((a,b)=>b[1]-a[1])[0];
    return {m, n:its.length, sp: sps.length ? avg(sps) : null, top: top ? top[0] : null};
  });
  return `
    <div class="row between rv" style="margin-bottom:10px;flex-wrap:wrap;gap:8px">
      <b class="serif" style="font-size:1.15rem">${year}</b>
      <span class="row" style="gap:6px"><button class="btn sm ghost" data-tapeyear="${year-1}">‹</button><button class="btn sm ghost" data-tapeyear="${new Date().getFullYear()}">this year</button><button class="btn sm ghost" data-tapeyear="${year+1}">›</button></span>
    </div>
    <div class="row rv" style="gap:6px;flex-wrap:wrap;margin-bottom:12px">${TAPE_MODES.map(([k,l]) => `<button class="btn sm ${t.mode===k?'primary':'ghost'}" data-tapemode="${k}">${l}</button>`).join('')}</div>
    ${t.mode === 'energy'
      ? `<div class="stack rv" style="gap:14px">${DIMS.map(dim => { const bd = {};
            days.forEach(d => { const v = S.checkins?.[d]?.energy?.[dim.id]; if(v) bd[d] = Array.from({length:Math.max(1,Math.round(v*1.6))}); });
            return `<div><div class="sc" style="color:${dim.c}">${dim.name}</div>${tapeGrid(days, 'total', bd).replace(/var\(--page-accent\)/g, dim.c)}</div>`; }).join('')}</div>`
      : `<div class="rv">${tapeGrid(days, t.mode, byDay)}</div>`}
    <div class="tape-months rv">${months.map(mo => `<div class="tm-cell ${mo.n?'':'quiet'}">
      <div class="mono">${MONTHS[mo.m].slice(0,3)}</div>
      <div class="serif" style="font-size:1.1rem">${mo.n||'—'}</div>
      ${mo.sp!==null?`<div class="mono">set-pt ${mo.sp.toFixed(0)}</div>`:''}
      ${mo.top?`<div class="mono" style="color:var(--muted)">${esc(mo.top)}</div>`:''}
    </div>`).join('')}</div>`;
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
  const upd = debounce(() => { t.q = box.querySelector('#ltq').value; rerender(); const n = document.querySelector('#ltq'); if(n){ n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 350);
  box.querySelector('#ltq')?.addEventListener('input', upd);
  box.querySelector('#lttag')?.addEventListener('change', e => { t.tag = e.target.value; rerender(); });
  box.querySelector('#ltfrom')?.addEventListener('change', e => { t.from = e.target.value; rerender(); });
  box.querySelector('#ltto')?.addEventListener('change', e => { t.to = e.target.value; rerender(); });
  box.querySelectorAll('[data-ltsection]').forEach(c => c.onclick = () => { const s = c.dataset.ltsection;
    t.sections = t.sections.includes(s) ? t.sections.filter(x=>x!==s) : [...t.sections, s]; rerender(); });
  box.querySelectorAll('[data-lttype]').forEach(c => c.onclick = () => { const k = c.dataset.lttype;
    t.types = t.types.includes(k) ? t.types.filter(x=>x!==k) : [...t.types, k]; rerender(); });
  box.querySelectorAll('[data-ltrange]').forEach(b => b.onclick = () => {
    const T = today(); const l = b.dataset.ltrange;
    if(l === 'this week'){ t.from = weekStart(T); t.to = addDays(weekStart(T), 6); }
    else if(l === 'this month'){ t.from = T.slice(0,8)+'01'; t.to = T; }
    else if(l === 'last 90 days'){ t.from = addDays(T, -89); t.to = T; }
    else { t.from = T.slice(0,4)+'-01-01'; t.to = T; }
    rerender();
  });
  box.querySelector('#ltClear')?.addEventListener('click', () => { Object.assign(t, {types:[], sections:[], q:'', tag:'', from:'', to:''}); rerender(); });
}

/* ---------- the panel ---------- */
function renderLifeTape(box){
  const t = tapeState();
  box.innerHTML = `
    <div class="row between" style="align-items:center;flex-wrap:wrap;gap:8px">
      <div class="lib-tabs">${[['day','Day'],['week','Week'],['year','Year']].map(([k,l])=>`<button class="${t.view===k?'active':''}" data-ltview="${k}">${l}</button>`).join('')}</div>
      <span class="mono faint">what you actually lived</span>
    </div>
    ${tapeFilterHTML()}
    <div id="ltBody" style="margin-top:12px">${
      t.view === 'day' ? tapeDayHTML(t.day) : t.view === 'week' ? tapeWeekHTML(t.day) : tapeYearHTML(+t.day.slice(0,4))}</div>`;
  box.querySelectorAll('[data-ltview]').forEach(b => b.onclick = () => { t.view = b.dataset.ltview; rerender(); });
  box.querySelectorAll('[data-tapeday]').forEach(n => n.onclick = e => { if(e.target.closest('.entry,a,button:not([data-tapeday])')) return;
    t.day = n.dataset.tapeday; t.view = 'day'; rerender(); });
  box.querySelectorAll('[data-tapeweek]').forEach(b => b.onclick = () => { t.day = b.dataset.tapeweek; t.view = 'week'; rerender(); });
  box.querySelectorAll('[data-tapeyear]').forEach(b => b.onclick = () => { t.day = b.dataset.tapeyear + t.day.slice(4); t.view = 'year'; rerender(); });
  box.querySelectorAll('[data-tapemode]').forEach(b => b.onclick = () => { t.mode = b.dataset.tapemode; rerender(); });
  box.querySelectorAll('[data-tapego]').forEach(n => n.onclick = () => navigate(n.dataset.tapego));
  bindTapeFilters(box);
  if(typeof bindHabitRings === 'function') bindHabitRings(box);
  reveal(box);
}
