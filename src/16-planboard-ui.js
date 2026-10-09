/* ============================================================
   THE PLANNING BOARD — what you do on it

   Left: the day from waking to bed, a strip of hours. What is fixed is drawn
   first (timed habits, meals, commutes, protected time, things with a clock
   time on them), the day's energy is a band behind it, and your blocks sit on
   top. Under it the tray of what the day holds but has no hour yet (pencil), and
   the work that would best fall on it (ghosts, each with its reason).
   Right: the work, sorted six ways, the top two first.

   Everything is a drag. A task onto an hour gives it that day and that hour;
   onto the tray gives it the day only; back to the right-hand side takes both
   away. A block is as long as the estimate and its margin, with a buffer after.
   Nothing here ever changes a due date, and nothing ever refuses: past the cap
   the board says so, with the rule, and lets you carry on.
   ============================================================ */

const PBD_PX = 0.9;                         /* pixels per minute on the strip */
let PB = null;                              /* the board that is open, if any */
const PBD_TABS = [['list', 'By list'], ['milestone', 'By milestone'], ['due', 'By due date'], ['quad', 'By quadrant'], ['goals', 'Week goals'], ['unest', 'Unestimated']];
const PBD_QUAD = {1: 'Urgent and important', 2: 'Important, not urgent', 3: 'Urgent, less important', 4: 'Neither'};

function pbdOpen(day, opts = {}){
  pbdMigrate();
  PB = {day: day || today(), mode: opts.mode || 'day', scale: opts.scale || 'hours', tab: opts.tab || 'list', extra: (opts.extra || []).slice(),
    onClose: opts.onClose || null, drag: null, q: ''};
  document.getElementById('pbd')?.remove();
  const root = el('<div class="pbd-overlay" id="pbd" role="dialog" aria-label="the planning board"></div>');
  document.body.appendChild(root);
  document.body.classList.add('pbd-open');
  pbdBindRoot(root);
  pbdRender();
  return root;
}
function pbdClose(){
  const root = document.getElementById('pbd'); if(!root) return;
  const cb = PB && PB.onClose; root.remove(); document.body.classList.remove('pbd-open'); PB = null;
  saveNow(); if(typeof cb === 'function') cb(); else if(typeof rerender === 'function') rerender();
}
const pbdWeekDays = d => { const s = weekStart(d); return Array.from({length: 7}, (_, i) => addDays(s, i)); };
const pbdDayName = d => `${DOW[parseDay(d).getDay()]} ${parseDay(d).getDate()} ${MONTHS ? MONTHS[parseDay(d).getMonth()] : ''}`.trim();

/* ---------- the right-hand side: the work ---------- */
function pbdCandidates(){
  const q = (PB.q || '').toLowerCase();
  return allTaskRefs().filter(r => !r.done && r.task && !taskIsAside(r.task)
    && (r.task.listId === 'inbox' || !r.task.listId || (typeof planListActive === 'function' && planListActive(planList(r.task.listId))) || r.kind === 'project')
    && (!q || (r.text || '').toLowerCase().includes(q)));
}
function pbdGroups(){
  const T = today(), refs = pbdCandidates(), plan = dayPlan(PB.day);
  const top = new Set(pbdTopTwoTasks(plan));
  const pinned = refs.filter(r => top.has(r.id));
  const rest = refs.filter(r => !top.has(r.id));
  const groups = [];
  const add = (label, rows, hint) => { if(rows.length) groups.push({label, hint: hint || '', rows}); };
  if(pinned.length) groups.push({label: 'Top two', hint: 'pinned from the day’s three', rows: pinned, pin: true});
  if(PB.tab === 'list'){
    const by = {};
    rest.forEach(r => { const k = r.kind === 'project' ? 'p:' + r.project.name : 'l:' + (r.task.listId || 'inbox'); (by[k] = by[k] || []).push(r); });
    Object.keys(by).sort().forEach(k => add(k.startsWith('p:') ? k.slice(2) : planListName(k.slice(2)), by[k]));
  } else if(PB.tab === 'milestone'){
    const by = new Map(); const none = [];
    rest.forEach(r => {
      const l = planList(r.task.listId);
      const m = l && (l.milestones || []).filter(x => !x.done && x.status !== 'prepared' && x.date).sort((a, b) => a.date.localeCompare(b.date))[0];
      if(m){ const k = m.id; if(!by.has(k)) by.set(k, {m, rows: []}); by.get(k).rows.push(r); } else none.push(r); });
    [...by.values()].sort((a, b) => a.m.date.localeCompare(b.m.date)).forEach(g => add(`${g.m.name} · ${fmtDate(g.m.date, 'short')}`, g.rows, `${daysBetween(T, g.m.date)} days`));
    add('No milestone', none);
  } else if(PB.tab === 'due'){
    const wkEnd = addDays(T, 7 - ((parseDay(T).getDay() + 6) % 7) - 1);
    add('Overdue', rest.filter(r => r.task.day && r.task.day < T));
    add('This week', rest.filter(r => r.task.day && r.task.day >= T && r.task.day <= wkEnd));
    add('Later', rest.filter(r => r.task.day && r.task.day > wkEnd));
    add('No due date', rest.filter(r => !r.task.day));
  } else if(PB.tab === 'quad'){
    [1, 2, 3, 4].forEach(n => add(PBD_QUAD[n], rest.filter(r => r.task.quadrant === n)));
    add('Not placed on the matrix', rest.filter(r => !r.task.quadrant));
  } else if(PB.tab === 'goals'){
    const wp = weekPlan(weekStart(PB.day));
    weekGoalsNamed(wp).forEach(o => add(o.text, (o.taskIds || []).map(id => rest.find(r => r.id === id)).filter(Boolean)));
    const inPeriods = weekPeriods(wp).map(x => ({x, rows: (x.taskIds || []).map(id => rest.find(r => r.id === id)).filter(Boolean)}));
    inPeriods.forEach(g => add(`${g.x.name || g.x.focus || 'A period'} · ${wpSpan(g.x)}`, g.rows));
    if(!groups.some(g => !g.pin)) groups.push({label: 'Nothing under this week’s goals yet', hint: 'Plan the week puts work under its goals.', rows: []});
  } else if(PB.tab === 'unest'){
    add('No estimate yet', rest.filter(r => !pbdEstOf(r.task)), 'drop one and pick how long it will take');
  }
  return groups;
}
function pbdRowHTML(r, d){
  const t = r.task, est = pbdEstOf(t), pl = pbdPlacement(t, r.id);
  const here = pl.state === 'ink' ? pl.blocks.some(b => b.date === d) : pl.state === 'pencil' && pl.from <= d && d <= pl.to;
  const cls = [here ? 'here' : '', est ? '' : 'unest'].filter(Boolean).join(' ');
  return `<div class="pbd-row ${cls}" data-pbdrag="task:${esc(r.id)}" data-pbtask="${esc(r.id)}" style="--c:${esc(r.color || 'var(--page-accent)')}">
    <span class="pbd-rt">${esc(r.text)}</span>
    <span class="pbd-rm mono">${est ? pbdSay(est) : '?'}${t.day ? ` · due ${esc(fmtDate(t.day, 'short'))}` : ''}${pl.state === 'ink' ? ' · ink' : pl.state === 'pencil' ? ' · pencil' : ''}</span>
    <button type="button" class="pbd-add" data-pbpencil="${esc(r.id)}" title="give it this day, no hour yet" aria-label="pencil it in on ${esc(d)}">＋</button></div>`;
}
function pbdPaneHTML(){
  const groups = pbdGroups();
  return `<div class="pbd-tabs" role="tablist">${PBD_TABS.map(([k, n]) => `<button role="tab" class="${PB.tab === k ? 'on' : ''}" data-pbtab="${k}">${n}</button>`).join('')}</div>
    <input class="inp pbd-q" data-pbq placeholder="find a task" value="${esc(PB.q || '')}" autocomplete="off">
    <div class="pbd-groups">${groups.map(g => `<div class="pbd-group${g.pin ? ' pin' : ''}"><div class="pbd-gh">${esc(g.label)}${g.hint ? ` <span class="faint">· ${esc(g.hint)}</span>` : ''}<span class="mono">${g.rows.length}</span></div>
      ${g.rows.map(r => pbdRowHTML(r, PB.day)).join('') || ''}</div>`).join('') || '<div class="empty">Nothing waiting.</div>'}</div>
    <div class="faint pbd-hint">Drag a task onto an hour to give it the day and the hour, onto the tray for the day only, and back here to take both away. The due date is never touched.</div>`;
}

/* ---------- the left-hand side: the day ---------- */
function pbdStripHTML(d, scale){
  const bd = pbdBounds(d), H = bd.awake * PBD_PX, plan = dayPlan(d);
  const ticks = []; for(let m = Math.ceil(bd.wake / 60) * 60; m <= bd.bed; m += 60)
    ticks.push(`<div class="pbd-tick" style="top:${((m - bd.wake) * PBD_PX).toFixed(1)}px"><span class="mono">${pbdHM(m).slice(0, 5)}</span></div>`);
  const eH = pbdMin(plan.energyHigh), eL = pbdMin(plan.energyLow);
  const band = (eH != null && eL != null && eL > eH) ? `<div class="pbd-energy" title="when the energy was expected to be high" style="top:${((Math.max(bd.wake, eH) - bd.wake) * PBD_PX).toFixed(1)}px;height:${((Math.min(bd.bed, eL) - Math.max(bd.wake, eH)) * PBD_PX).toFixed(1)}px"></div>` : '';
  const anchors = pbdAnchors(d).map(a => {
    const top = (Math.max(bd.wake, a.from) - bd.wake) * PBD_PX, ht = Math.max(14, (Math.min(bd.bed, a.to) - Math.max(bd.wake, a.from)) * PBD_PX);
    return `<div class="pbd-anchor k-${esc(a.kind)}" ${a.block ? `data-pbblk="${esc(a.block.id)}" data-pbdrag="block:${esc(a.block.id)}"` : ''} style="top:${top.toFixed(1)}px;height:${ht.toFixed(1)}px" title="${esc(a.kind === 'protect' ? 'protected — nothing is placed here for you' : a.kind)}">
      <span class="pbd-bl">${esc(a.label)}</span><span class="pbd-bt mono">${pbdHM(a.from)}</span>${a.block ? `<i class="pbd-rz" data-pbrz="${esc(a.block.id)}" title="resize"></i>` : ''}</div>`;
  }).join('');
  const blocks = pbdBlocksOn(d).filter(b => !PBD_KINDS_ANCHOR.includes(b.kind)).map(b => {
    const a = pbdMin(b.start) ?? bd.wake;
    const top = (a - bd.wake) * PBD_PX, ht = Math.max(18, b.durationMin * PBD_PX), bh = (b.bufferMin || 0) * PBD_PX;
    const done = b.ref && b.ref.type !== 'habit' && (() => { const r = findTaskRef(b.ref.id); return r && r.done; })();
    return `<div class="pbd-blk${done ? ' done' : ''}" data-pbblk="${esc(b.id)}" data-pbdrag="block:${esc(b.id)}" style="top:${top.toFixed(1)}px;height:${ht.toFixed(1)}px" title="${esc(pbdBlockLabel(b))}">
      <span class="pbd-bl">${esc(pbdBlockLabel(b))}</span><span class="pbd-bt mono">${esc(b.start)} · ${pbdSay(b.durationMin)}${b.marginMin ? ` (incl. ${b.marginMin}m margin)` : ''}</span><i class="pbd-rz" data-pbrz="${esc(b.id)}" title="drag to change its length"></i></div>
      ${bh ? `<div class="pbd-buf" style="top:${(top + ht).toFixed(1)}px;height:${bh.toFixed(1)}px" title="buffer after"></div>` : ''}`;
  }).join('');
  const sleepTop = `<div class="pbd-sleep top" style="height:0"></div>`;
  return `<div class="pbd-strip${scale === 'hours' ? '' : ' mini'}" data-pbstrip="${esc(d)}" style="height:${H.toFixed(1)}px">
    <div class="pbd-axis">${ticks.join('')}</div><div class="pbd-track" data-pbtrack="${esc(d)}" data-wake="${bd.wake}">${band}${anchors}${blocks}</div></div>`;
}
function pbdTrayHTML(d){
  const pencil = pbdPencilOn(d, PB.extra);
  const ghosts = d >= today() ? pbdCandidates().filter(r => !r.task.doDay && r.task.day && !pbdBlocksFor(r.id).length)
    .map(r => ({r, g: pbdGhost(r.task, r.id)})).filter(x => x.g && x.g.day === d) : [];
  return `<div class="pbd-tray" data-pbtray="${esc(d)}"><div class="pbd-trayh mono">to place · ${pencil.length}${ghosts.length ? ` · suggested ${ghosts.length}` : ''}</div>
    ${pencil.map(r => `<div class="pbd-chip pencil" data-pbdrag="task:${esc(r.id)}" data-pbtask="${esc(r.id)}" title="pencil — this day, no hour yet">${esc(r.text)}<span class="mono">${pbdEstOf(r.task) ? pbdSay(pbdEstOf(r.task)) : '?'}</span></div>`).join('')}
    ${ghosts.map(({r, g}) => `<div class="pbd-chip ghost" data-pbdrag="task:${esc(r.id)}" data-pbtask="${esc(r.id)}" data-pbghost="${esc(r.id)}" title="${esc(g.reason)}">◌ ${esc(r.text)}<span class="mono">due ${esc(fmtDate(r.task.day, 'short'))}</span><button type="button" class="pbd-add" data-pbpencil="${esc(r.id)}" title="${esc(g.reason)} — press to pencil it in">＋</button></div>`).join('')}
    ${!pencil.length && !ghosts.length ? '<div class="faint pbd-empty">Nothing waiting for an hour.</div>' : ''}</div>`;
}
function pbdGaugeHTML(d, solo = true){
  const c = pbdCapacity(d, PB.extra);
  return `<div class="pbd-gauge${c.over ? ' over' : ''}" title="${esc(c.rule)}"><i style="width:${Math.min(100, c.pct)}%"></i><span>${esc(c.text)}</span></div>
    ${solo ? `<div class="pbd-rule faint">${esc(c.rule)}</div>` : ''}${c.unestimated ? `<div class="faint pbd-un">${c.unestimated} without an estimate — not counted</div>` : ''}`;
}
function pbdPeriodHTML(d){
  const p = weekPeriodOn(weekPlan(weekStart(d)), d);
  return p ? `<div class="pbd-period" title="${esc(p.focus || '')}">${esc(p.name || p.focus || 'a stage of the week')}</div>` : '';
}
function pbdColHTML(d, scale, solo){
  const plan = dayPlan(d);
  const inkChips = scale === 'days' ? pbdBlocksOn(d).filter(b => !PBD_KINDS_ANCHOR.includes(b.kind)).map(b => `<div class="pbd-chip ink" data-pbdrag="block:${esc(b.id)}" data-pbblk="${esc(b.id)}">${esc(b.start)} ${esc(pbdBlockLabel(b))}<span class="mono">${pbdSay(b.durationMin)}</span></div>`).join('') : '';
  return `<div class="pbd-col${d === today() ? ' today' : ''}${solo ? ' solo' : ''}" data-pbday="${esc(d)}">
    <div class="pbd-colhead"><b>${esc(solo ? pbdDayName(d) : `${DOW[parseDay(d).getDay()].slice(0, 3)} ${parseDay(d).getDate()}`)}</b>${solo ? '' : `<button class="pbd-zoom" data-pbzoom="${esc(d)}" title="open this day">⤢</button>`}</div>
    ${pbdPeriodHTML(d)}${pbdGaugeHTML(d, solo)}
    ${pbdTrayHTML(d)}
    ${solo ? pbdAddRowHTML(d) : ''}
    ${scale === 'hours' ? pbdStripHTML(d, solo ? 'hours' : 'mini') : `<div class="pbd-daybody">${inkChips}${plan.protect ? `<div class="pbd-chip protect">▣ ${esc(plan.protect)}</div>` : ''}</div>`}</div>`;
}
function pbdAddRowHTML(d){
  return `<div class="pbd-addrow"><span class="mono faint">add</span>${['protect', 'meal', 'commute', 'break'].map(k => `<button class="chip sm" data-pbadd="${k}">${k === 'protect' ? 'protected time' : k}</button>`).join('')}</div>`;
}
function pbdRender(){
  const root = document.getElementById('pbd'); if(!root || !PB) return;
  const keep = {left: (root.querySelector('.pbd-left') || {}).scrollTop || 0, right: (root.querySelector('.pbd-groups') || {}).scrollTop || 0};
  const days = PB.mode === 'week' ? pbdWeekDays(PB.day) : [PB.day];
  const scale = PB.mode === 'week' ? PB.scale : 'hours';
  const T = today();
  root.innerHTML = `<div class="pbd-top">
      <div class="pbd-title serif">${PB.mode === 'week' ? `The week of <b>${esc(fmtDate(days[0], 'short'))}</b>` : `Plan <b>${esc(pbdDayName(PB.day))}</b>`}</div>
      <div class="pbd-nav"><button class="tbtn" data-pbnav="-1" aria-label="earlier">‹</button><button class="tbtn" data-pbnav="0">today</button><button class="tbtn" data-pbnav="1" aria-label="later">›</button></div>
      <div class="pbd-modes"><button class="${PB.mode === 'day' ? 'on' : ''}" data-pbmode="day">Day</button><button class="${PB.mode === 'week' ? 'on' : ''}" data-pbmode="week">Week</button></div>
      ${PB.mode === 'week' ? `<div class="pbd-modes"><button class="${PB.scale === 'hours' ? 'on' : ''}" data-pbscale="hours">hours</button><button class="${PB.scale === 'days' ? 'on' : ''}" data-pbscale="days">days</button></div>` : ''}
      <span class="pbd-grow"></span>
      ${PB.mode === 'day' ? `<button class="btn sm ghost" data-pb60 title="confirm what is pencilled, pick the top two, accept a layout">Plan in 60 seconds</button>
        ${PB.day === T ? '<button class="btn sm ghost" data-pbreplan title="keep the blocks still ahead, and fit the rest into the hours left">Re-plan from here</button>' : ''}` : ''}
      <button class="btn sm primary" data-pbclose>Done</button></div>
    <div class="pbd-body">
      <div class="pbd-left"><div class="pbd-cols${PB.mode === 'week' ? ' week' : ''}${scale === 'days' ? ' days' : ''}">${days.map(d => pbdColHTML(d, scale, PB.mode === 'day')).join('')}</div></div>
      <div class="pbd-right" data-pbpane>${pbdPaneHTML()}</div></div>`;
  const l = root.querySelector('.pbd-left'); if(l) l.scrollTop = keep.left;
  const g = root.querySelector('.pbd-groups'); if(g) g.scrollTop = keep.right;
  const q = root.querySelector('[data-pbq]'); if(q && PB._qfocus){ q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
}

/* ---------- doing things ---------- */
function pbdTask(id){ const r = findTaskRef(id); return r ? r.task : null; }
/* give a task a day (pencil). Never the due date. */
function pbdPencil(id, d){
  const t = pbdTask(id); if(!t) return false;
  if(!(t.doDay && t.doDay <= d && (t.doEnd || t.doDay) >= d)) taskSetDoRange(t, d, '');
  t.updatedAt = new Date().toISOString(); saveNow(); return true;
}
/* ask how long, once, for a task nobody has estimated */
function pbdAskEstimate(t, then){
  const m = openModal(`<h2>How long will this take?</h2><p class="muted">${esc(t.title || t.text || '')}</p>
    <div class="row" style="gap:8px;flex-wrap:wrap">${PBD_PICK.map(n => `<button class="btn" data-pbest="${n}">${pbdSay(n)}</button>`).join('')}</div>
    <div class="faint" style="margin-top:10px;font-size:.8rem">It is saved as the task’s estimate.</div>`, 'narrow');
  m.querySelectorAll('[data-pbest]').forEach(b => b.onclick = () => { t.duration = +b.dataset.pbest; t.updatedAt = new Date().toISOString(); saveNow(); m.remove(); then(+b.dataset.pbest); });
  return m;
}
function pbdAskSplit(t, est, then){
  const n = Math.ceil(est / 30);
  const m = openModal(`<h2>${pbdSay(est)} is a long sitting</h2><p class="muted">${esc(t.title || t.text || '')}</p>
    <div class="stack" style="gap:8px"><button class="btn primary" data-pbsplit="split">Split into ${n} blocks of 30m</button>
      <button class="btn" data-pbsplit="one">Keep it as one block</button></div>
    <div class="faint" style="margin-top:10px;font-size:.8rem">Or drag its steps one at a time.</div>`, 'narrow');
  m.querySelectorAll('[data-pbsplit]').forEach(b => b.onclick = () => { m.remove(); then(b.dataset.pbsplit); });
  return m;
}
function pbdPlaceTask(id, d, startMin, source = 'dragged'){
  const t = pbdTask(id); if(!t) return;
  const go = est => {
    pbdPencil(id, d);
    const bd = pbdBounds(d);
    const place = (len, at, over) => { const pad = pbdPadded(len, t);
      const b = pbdAddBlock(d, {ref: {type: 'task', id}, start: pbdHM(Math.min(bd.bed - 15, Math.max(bd.wake, at))), durationMin: over ? len : pad.durationMin,
        marginMin: over ? 0 : pad.marginMin, bufferMin: pad.bufferMin, source});
      return b; };
    const run = mode => {
      if(mode === 'split'){ let at = startMin; const n = Math.ceil(est / 30); for(let i = 0; i < n; i++){ const len = Math.min(30, est - i * 30); const b = place(len, at, true); at += b.durationMin + pbdPrefs().bufferMin; } }
      else place(est, startMin, false);
      saveNow(); pbdRender();
    };
    if(est > PBD_LONG) pbdAskSplit(t, est, run); else run('one');
  };
  const est = pbdEstOf(t);
  if(!est) pbdAskEstimate(t, go); else go(est);
}
function pbdMoveBlock(bid, d, startMin){
  const b = S.timeBlocks.find(x => x.id === bid); if(!b) return;
  const bd = pbdBounds(d);
  b.date = d; pbdSetBlockTimes(b, Math.min(bd.bed - 5, Math.max(bd.wake, startMin)));
  if(b.ref && b.ref.type !== 'habit') pbdPencil(b.ref.id, d);
  saveNow(); pbdRender();
}
function pbdResizeBlock(bid, durationMin){
  const b = S.timeBlocks.find(x => x.id === bid); if(!b) return;
  const was = b.durationMin;
  pbdSetBlockTimes(b, pbdMin(b.start) || 540, pbdRound(durationMin));
  b.marginMin = Math.max(0, Math.min(b.marginMin || 0, b.durationMin - 5));
  saveNow(); pbdRender();
  /* asked once per block whether the estimate should follow */
  if(b.ref && b.ref.type === 'task' && !b.estAsked && b.durationMin !== was){
    b.estAsked = true; saveNow();
    const t = pbdTask(b.ref.id), est = Math.max(5, b.durationMin - (b.marginMin || 0));
    if(t) toast(esc(`Make the estimate ${pbdSay(est)}?`), 9000, {label: 'update it', fn: () => { t.duration = est; t.updatedAt = new Date().toISOString(); saveNow(); pbdRender(); }});
  }
}
function pbdUnplace(kind, id, d){
  if(kind === 'block'){
    const b = S.timeBlocks.find(x => x.id === id); if(!b) return;
    const ref = b.ref && b.ref.type !== 'habit' ? b.ref.id : null;
    const t = ref ? pbdTask(ref) : null;
    const gone = spliceOut(S.timeBlocks, x => x.id === id);
    const was = t ? {doDay: t.doDay, doEnd: t.doEnd} : null;
    if(t && !pbdBlocksFor(ref).length) taskSetDoRange(t, '', '');
    saveNow(); pbdRender();
    toast(esc('Taken off the day.'), 5000, {label: 'undo', fn: () => { gone(); if(t && was) taskSetDoRange(t, was.doDay, was.doEnd); saveNow(); pbdRender(); }});
  } else {
    const t = pbdTask(id); if(!t) return;
    const was = {doDay: t.doDay, doEnd: t.doEnd}, blocks = pbdBlocksFor(id).filter(b => b.date === d || !t.doDay);
    const gone = blocks.map(b => spliceOut(S.timeBlocks, x => x.id === b.id));
    taskSetDoRange(t, '', ''); saveNow(); pbdRender();
    toast(esc('Taken off the day.'), 5000, {label: 'undo', fn: () => { gone.reverse().forEach(f => f()); taskSetDoRange(t, was.doDay, was.doEnd); saveNow(); pbdRender(); }});
  }
}

/* ---------- the pointer ---------- */
function pbdBindRoot(root){
  root.addEventListener('click', ev => {
    const q = s => ev.target.closest(s);
    if(q('[data-pbclose]')) return pbdClose();
    const tab = q('[data-pbtab]'); if(tab){ PB.tab = tab.dataset.pbtab; return pbdRender(); }
    const mode = q('[data-pbmode]'); if(mode){ PB.mode = mode.dataset.pbmode; return pbdRender(); }
    const sc = q('[data-pbscale]'); if(sc){ PB.scale = sc.dataset.pbscale; return pbdRender(); }
    const nav = q('[data-pbnav]'); if(nav){ const n = +nav.dataset.pbnav; PB.day = n === 0 ? today() : addDays(PB.day, n * (PB.mode === 'week' ? 7 : 1)); return pbdRender(); }
    const zoom = q('[data-pbzoom]'); if(zoom){ PB.day = zoom.dataset.pbzoom; PB.mode = 'day'; return pbdRender(); }
    const pen = q('[data-pbpencil]'); if(pen){ ev.stopPropagation(); if(pbdPencil(pen.dataset.pbpencil, PB.day)) { sound('click'); pbdRender(); } return; }
    const add = q('[data-pbadd]'); if(add){ pbdAddAnchor(add.dataset.pbadd); return; }
    if(q('[data-pb60]')) return pbdSixty();
    if(q('[data-pbreplan]')) return pbdReplan();
    if(q('[data-pbfast-go]')) return;
  });
  root.addEventListener('input', ev => { if(ev.target.matches('[data-pbq]')){ PB.q = ev.target.value; PB._qfocus = true; pbdRender(); PB._qfocus = false; } });
  root.addEventListener('keydown', ev => { if(ev.key === 'Escape' && !ev.target.matches('input,textarea')){ ev.stopPropagation(); pbdClose(); } });
  root.addEventListener('pointerdown', ev => {
    const rz = ev.target.closest('[data-pbrz]');
    const src = rz || ev.target.closest('[data-pbdrag]');
    if(!src || ev.button > 0 || ev.target.closest('[data-pbpencil]')) return;
    const spec = rz ? 'resize:' + rz.dataset.pbrz : src.dataset.pbdrag;
    const [kind, id] = spec.split(':');
    const blk = rz ? rz.closest('[data-pbblk]') : null;
    PB.drag = {kind, id, x0: ev.clientX, y0: ev.clientY, moved: false, ghost: null, pointer: ev.pointerId,
      h0: blk ? blk.getBoundingClientRect().height : 0, from: src};
    ev.preventDefault();
    try { root.setPointerCapture(ev.pointerId); } catch(e){}
  });
  root.addEventListener('pointermove', ev => {
    const d = PB && PB.drag; if(!d) return;
    if(!d.moved && Math.hypot(ev.clientX - d.x0, ev.clientY - d.y0) < 5) return;
    d.moved = true;
    if(d.kind === 'resize'){
      const blk = document.querySelector(`[data-pbblk="${d.id}"]`);
      if(blk) blk.style.height = Math.max(14, d.h0 + (ev.clientY - d.y0)) + 'px';
      return;
    }
    if(!d.ghost){
      d.ghost = el(`<div class="pbd-floating">${esc((d.from.querySelector('.pbd-rt,.pbd-bl') || d.from).textContent.slice(0, 48))}</div>`);
      document.body.appendChild(d.ghost);
    }
    d.ghost.style.left = (ev.clientX + 8) + 'px'; d.ghost.style.top = (ev.clientY + 8) + 'px';
    document.querySelectorAll('.pbd-over').forEach(n => n.classList.remove('pbd-over'));
    d.ghost.style.display = 'none';
    const under = document.elementFromPoint(ev.clientX, ev.clientY); d.ghost.style.display = '';
    const tgt = under && (under.closest('[data-pbtrack]') || under.closest('[data-pbtray]') || under.closest('[data-pbpane]') || under.closest('[data-pbday]'));
    if(tgt) tgt.classList.add('pbd-over');
  });
  const end = ev => {
    const d = PB && PB.drag; if(!d) return;
    PB.drag = null; try { root.releasePointerCapture(d.pointer); } catch(e){}
    document.querySelectorAll('.pbd-over').forEach(n => n.classList.remove('pbd-over'));
    if(d.ghost){ d.ghost.remove(); }
    if(!d.moved) return;
    if(ev.type === 'pointercancel') return pbdRender();
    if(d.kind === 'resize'){
      const blk = document.querySelector(`[data-pbblk="${d.id}"]`);
      const h = blk ? parseFloat(blk.style.height) || d.h0 : d.h0;
      return pbdResizeBlock(d.id, h / PBD_PX);
    }
    const under = document.elementFromPoint(ev.clientX, ev.clientY);
    if(!under) return pbdRender();
    const track = under.closest('[data-pbtrack]'), tray = under.closest('[data-pbtray]'), pane = under.closest('[data-pbpane]'), col = under.closest('[data-pbday]');
    if(track){
      const day = track.dataset.pbtrack, wake = +track.dataset.wake, rect = track.getBoundingClientRect();
      const startMin = pbdRound(wake + (ev.clientY - rect.top) / PBD_PX - (d.kind === 'block' ? 0 : 0), PBD_DEFAULTS.snap);
      if(d.kind === 'task') pbdPlaceTask(d.id, day, startMin);
      else if(d.kind === 'block') pbdMoveBlock(d.id, day, startMin);
    } else if(tray || (col && !pane)){
      const day = (tray || col).dataset.pbtray || (tray || col).dataset.pbday;
      if(d.kind === 'task'){ pbdPencil(d.id, day); sound('click'); pbdRender(); }
      else if(d.kind === 'block'){
        const b = S.timeBlocks.find(x => x.id === d.id);
        if(b && b.ref && b.ref.type !== 'habit'){ const ref = b.ref.id; spliceOut(S.timeBlocks, x => x.id === d.id); pbdPencil(ref, day); saveNow(); pbdRender(); }
        else pbdRender();
      }
    } else if(pane){
      pbdUnplace(d.kind, d.id, PB.day);
    } else pbdRender();
  };
  root.addEventListener('pointerup', end); root.addEventListener('pointercancel', end);
}

/* protected time, meals, commutes, breaks: added to the day, then dragged and resized like the rest */
function pbdAddAnchor(kind){
  const d = PB.day, bd = pbdBounds(d);
  let label = kind;
  if(kind === 'protect'){ label = (dayPlan(d).protect || '').trim() || (prompt('What is being protected?') || '').trim(); if(!label) return; dayPlan(d).protect = label; }
  const taken = pbdBlocksOn(d).concat([]).map(b => pbdMin(b.start) + b.durationMin);
  const at = Math.min(bd.bed - 30, Math.max(bd.wake + 60, taken.length ? Math.max(...taken) : bd.wake + 120));
  pbdAddBlock(d, {kind, label, start: pbdHM(at), durationMin: kind === 'protect' ? 90 : kind === 'meal' ? 45 : kind === 'commute' ? 30 : 15, source: 'dragged'});
  saveNow(); pbdRender();
}

/* ---------- the fast lanes ---------- */
/* Lay the day's pencilled work into the free gaps: the top two first and in the
   energy band if there is one, then the rest, never into an anchor, each with
   its margin and buffer. Returns the layout without writing it. */
function pbdLayout(d, ids, fromMin){
  const bd = pbdBounds(d), plan = dayPlan(d);
  const busy = pbdAnchors(d).map(a => [a.from, a.to]).concat(pbdBlocksOn(d).filter(b => !PBD_KINDS_ANCHOR.includes(b.kind)).map(b => [pbdMin(b.start), pbdMin(b.start) + b.durationMin + (b.bufferMin || 0)]));
  const top = new Set(pbdTopTwoTasks(plan));
  const eH = pbdMin(plan.energyHigh), eL = pbdMin(plan.energyLow);
  const order = ids.slice().sort((a, b) => (top.has(b) ? 1 : 0) - (top.has(a) ? 1 : 0));
  const out = [];
  const free = (len, from) => {
    for(let s = Math.ceil(from / 5) * 5; s + len <= bd.bed; s += 5)
      if(!busy.some(([a, z]) => s < z && s + len > a)) return s;
    return null;
  };
  order.forEach(id => {
    const t = pbdTask(id); if(!t) return;
    const est = pbdEstOf(t) || 30, pad = pbdPadded(est, t), len = pad.durationMin + pad.bufferMin;
    let start = null, why = '';
    if(top.has(id) && eH != null && eL != null && eL > eH){ start = free(len, Math.max(fromMin, eH)); if(start != null && start + len > eL) start = null; if(start != null) why = 'a top-two task, in the high-energy window'; }
    if(start == null){ start = free(len, fromMin); why = why || (top.has(id) ? 'a top-two task, first free hour' : 'next free hour'); }
    if(start == null) return;
    busy.push([start, start + len]);
    out.push({id, start, durationMin: pad.durationMin, marginMin: pad.marginMin, bufferMin: pad.bufferMin, why, text: t.title || t.text || ''});
  });
  return out.sort((a, b) => a.start - b.start);
}
function pbdSixty(){
  const d = PB.day, plan = dayPlan(d);
  const pencil = pbdPencilOn(d, PB.extra);
  if(!pencil.length){ toast(esc('Nothing is pencilled for this day yet — add some from the right, then plan in sixty seconds.'), 5000); return; }
  const top = new Set(pbdTopTwoTasks(plan)); const chosen = new Set(pencil.map(r => r.id)); let tops = new Set([...top].filter(id => chosen.has(id)));
  const m = openModal('', 'wide');
  const draw = () => {
    const lay = pbdLayout(d, [...chosen], d === today() ? Math.max(pbdBounds(d).wake, new Date().getHours() * 60 + new Date().getMinutes()) : pbdBounds(d).wake);
    const mod = m.querySelector('.modal');
    mod.innerHTML = `<button class="close">\u00d7</button><h2>Plan ${esc(pbdDayName(d))} in sixty seconds</h2>
      <p class="muted" style="font-size:.88rem">Tick what stays, mark the top two, and accept the layout. Nothing is written until you accept.</p>
      <div class="stack" style="gap:4px;max-height:34vh;overflow:auto">${pencil.map(r => `<div class="pick-row ${chosen.has(r.id) ? 'on' : ''}"><label><input type="checkbox" data-sx="${esc(r.id)}"${chosen.has(r.id) ? ' checked' : ''}><span><b>${esc(r.text)}</b><span class="d">${pbdEstOf(r.task) ? pbdSay(pbdEstOf(r.task)) : 'no estimate — 30m assumed'}</span></span></label>
        <button type="button" class="chip tf-chip${tops.has(r.id) ? ' on' : ''}" data-st="${esc(r.id)}" title="one of the day’s top two">top two</button></div>`).join('')}</div>
      <div class="pbd-lay">${lay.length ? lay.map(x => `<div class="pbd-layrow"><span class="mono">${pbdHM(x.start)}–${pbdHM(x.start + x.durationMin)}</span> <b>${esc(x.text)}</b> <span class="faint">${esc(x.why)}</span></div>`).join('') : '<div class="faint">Nothing fits in the hours left.</div>'}</div>
      <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn ghost" data-sc>Not now</button><button class="btn primary" data-sa>Accept this layout</button></div>`;
    mod.querySelector('.close').onclick = () => m.remove();
    m.querySelectorAll('[data-sx]').forEach(c => c.onchange = () => { c.checked ? chosen.add(c.dataset.sx) : (chosen.delete(c.dataset.sx), tops.delete(c.dataset.sx)); draw(); });
    m.querySelectorAll('[data-st]').forEach(b => b.onclick = () => { const id = b.dataset.st; if(tops.has(id)) tops.delete(id); else if(tops.size < 2){ tops.add(id); chosen.add(id); } draw(); });
    m.querySelector('[data-sc]').onclick = () => m.remove();
    m.querySelector('[data-sa]').onclick = () => {
      /* the two marked become the day's intentions, as references */
      const names = [...tops].map(id => pbdTask(id)).filter(Boolean);
      names.forEach((t, i) => { plan.intentions[i] = (plan.intentions[i] || '').trim() || (t.title || t.text || ''); pbdSetIntentionRef(plan, i, {type: 'task', id: [...tops][i]}); });
      if(names.length) plan.topTwo = [0, 1].slice(0, 2);
      lay.forEach(x => pbdAddBlock(d, {ref: {type: 'task', id: x.id}, start: pbdHM(x.start), durationMin: x.durationMin, marginMin: x.marginMin, bufferMin: x.bufferMin, source: 'dragged'}));
      plan.planned = true; saveNow(); m.remove(); sound('success'); pbdRender();
    };
  };
  draw();
}
/* Re-plan from here: the blocks still ahead are kept; what was meant for today
   and has not been given an hour, or whose hour has gone by, is fitted into what is left. */
function pbdReplan(){
  const d = PB.day; if(d !== today()) return;
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  const gone = pbdBlocksOn(d).filter(b => !PBD_KINDS_ANCHOR.includes(b.kind) && b.ref && b.ref.type !== 'habit' && (pbdMin(b.start) + b.durationMin) <= now
    && (() => { const r = findTaskRef(b.ref.id); return r && !r.done; })());
  const ids = [...new Set(gone.map(b => b.ref.id).concat(pbdPencilOn(d, PB.extra).map(r => r.id)))];
  if(!ids.length){ toast(esc('Nothing to re-plan — every block still ahead stays where it is.'), 4000); return; }
  const lay = pbdLayout(d, ids, now + 5);
  const removed = gone.map(b => spliceOut(S.timeBlocks, x => x.id === b.id));
  lay.forEach(x => pbdAddBlock(d, {ref: {type: 'task', id: x.id}, start: pbdHM(x.start), durationMin: x.durationMin, marginMin: x.marginMin, bufferMin: x.bufferMin, source: 'dragged'}));
  saveNow(); pbdRender();
  toast(esc(`${lay.length} block${lay.length === 1 ? '' : 's'} fitted into the hours left; ${ids.length - lay.length} did not fit.`), 7000,
    {label: 'undo', fn: () => { S.timeBlocks = S.timeBlocks.filter(b => !lay.some(x => b.ref && b.ref.id === x.id && b.start === pbdHM(x.start))); removed.reverse().forEach(f => f()); saveNow(); pbdRender(); }});
}
