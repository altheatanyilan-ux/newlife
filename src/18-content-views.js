/* ============================================================
   CONTENT — the other three views: a calendar of what is going out,
   a shelf of everything, and the numbers underneath both.

   The calendar borrows the Planning page's .pc-* shell rather than
   growing a second one. That grid already had its widths fought over
   (minmax(0,1fr) with a floor, inside a .pc-scroll) and inheriting
   that fight is better than repeating it.
   ============================================================ */

/* ---------- calendar ---------- */
function ctCalCursor(){ return S._ctCal || (S._ctCal = today()); }
/* a piece sits on the day it is meant to go out, or the day it went */
function pieceDay(e){ const c = e.extra.content; return c.stage === 'published' ? (c.publishedOn || c.scheduled || '') : (c.scheduled || ''); }

function contentCalendarHTML(){
  const mode = S._ctCalMode || 'month';
  const cur = ctCalCursor();
  const dated = contentPieces().filter(e => pieceDay(e));
  return `<div class="ct-cal-wrap">
    <div class="pc-wrap">
      <div class="pc-head">
        <button class="pl-mini" data-ctcnav="-1">‹</button>
        <span class="pc-label serif">${esc(mode === 'month' ? planMonthLabel(cur) : `week of ${fmtDate(planWeekStart(cur), 'med')}`)}</span>
        <button class="pl-mini" data-ctcnav="1">›</button>
        <button class="pf-chip" data-ctcnav="0">today</button>
        <span style="margin-left:auto"></span>
        ${[['month','Month'],['week','Week']].map(([k, n]) =>
          `<button class="pf-chip${mode === k ? ' on' : ''}" data-ctcmode="${k}">${n}</button>`).join('')}
      </div>
      <div class="pc-scroll">${mode === 'month' ? ctCalMonthHTML(cur, dated) : ctCalWeekHTML(cur, dated)}</div>
    </div>
    ${ctNextPanelHTML()}
  </div>`;
}
function ctPillHTML(e){
  const c = e.extra.content, st = contentStage(c.stage);
  return `<button class="pc-pill ct-pill${pieceOverdue(e) ? ' late' : ''}" data-ctcard="${e.id}" draggable="true"
    title="${esc(e.title || 'Untitled')} · ${esc(st.name)}" style="--c:${st.color}">${esc(e.title || 'Untitled')}</button>`;
}
function ctCalMonthHTML(cur, dated){
  const c = parseDay(cur), y = c.getFullYear(), m = c.getMonth();
  const lead = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
  const byDay = new Map();
  dated.forEach(e => { const d = pieceDay(e); if(!byDay.has(d)) byDay.set(d, []); byDay.get(d).push(e); });
  const cells = [];
  for(let i = 0; i < lead; i++) cells.push('<div class="pc-cell blank"></div>');
  for(let d = 1; d <= days; d++){
    const iso = `${y}-${pad(m + 1)}-${pad(d)}`, list = byDay.get(iso) || [];
    cells.push(`<div class="pc-cell${iso === today() ? ' now' : ''}${list.some(pieceOverdue) ? ' late' : ''}" data-ctday="${iso}">
      <div class="pc-n"><span>${d}</span><button class="pc-add" data-ctdayadd="${iso}" title="plan something for this day">＋</button></div>
      ${list.slice(0, 3).map(ctPillHTML).join('')}
      ${list.length > 3 ? `<button class="pc-more" data-ctdayopen="${iso}">+${list.length - 3} more</button>` : ''}</div>`);
  }
  return `<div class="pc-dow">${['Mo','Tu','We','Th','Fr','Sa','Su'].map(x => `<span>${x}</span>`).join('')}</div>
    <div class="pc-grid">${cells.join('')}</div>`;
}
function ctCalWeekHTML(cur, dated){
  const start = planWeekStart(cur);
  return `<div class="pc-week">${Array.from({length:7}, (_, i) => addDays(start, i)).map(d => {
    const list = dated.filter(e => pieceDay(e) === d);
    return `<div class="pc-col${d === today() ? ' now' : ''}" data-ctday="${d}">
      <div class="pc-colh"><span class="mono">${['Mo','Tu','We','Th','Fr','Sa','Su'][(parseDay(d).getDay() + 6) % 7]}</span>
        <span class="serif">${parseDay(d).getDate()}</span>
        <button class="pc-add" data-ctdayadd="${d}">＋</button></div>
      <div class="pc-allday">${list.map(ctPillHTML).join('')}</div></div>`; }).join('')}</div>`;
}
/* the standing answer to "what should I publish next?" */
function ctNextPanelHTML(){
  const list = contentWhatsNext(5);
  return `<aside class="ct-nextpanel">
    <div class="k mono">what to send out next</div>
    ${list.length ? list.map(e => { const c = e.extra.content, st = contentStage(c.stage), w = pieceWords(e), t = pieceTarget(e);
      return `<button class="ct-nrow" data-ctopen="${e.id}" style="--c:${st.color}">
        <b>${esc(e.title || 'Untitled')}</b>
        <span class="ct-nmeta mono">${esc(st.name)} · ${t ? `${w}/${t}` : `${w} words`}</span>
        <span class="ct-nmeta mono">${esc(contentDestName(c.dest))}${c.scheduled ? ` · ${esc(fmtDate(c.scheduled, 'short'))}` : ''}</span>
      </button>`; }).join('')
      : `<div class="pk-empty lora">Nothing is close to done. That is allowed.</div>`}
  </aside>`;
}

/* ---------- the shelf ---------- */
function ctFilters(){
  const f = S._ctF || (S._ctF = {stage:[], type:[], dest:[], theme:[], words:'', linked:''});
  return f;
}
function ctToggleFilter(key, val){
  const f = ctFilters(), i = f[key].indexOf(val);
  i < 0 ? f[key].push(val) : f[key].splice(i, 1);
}
const CT_WORD_BANDS = [['s','< 500', 0, 499], ['m','500–1500', 500, 1500], ['l','1500–3000', 1501, 3000], ['xl','3000+', 3001, Infinity]];
const CT_SORTS = [['edited','Last edited'], ['stage','Stage'], ['type','Kind'], ['words','Word count'], ['sched','Planned date'], ['title','Title']];

function contentFiltered(){
  const f = ctFilters(), q = (S._ctQ || '').toLowerCase();
  return contentPieces().filter(e => {
    const c = e.extra.content;
    if(f.stage.length && !f.stage.includes(c.stage)) return false;
    if(f.type.length  && !f.type.includes(c.type)) return false;
    if(f.dest.length  && !f.dest.includes(c.dest)) return false;
    if(f.theme.length && !c.themes.some(t => f.theme.includes(t))) return false;
    if(f.linked === 'yes' && !c.linked.length) return false;
    if(f.linked === 'no'  &&  c.linked.length) return false;
    if(f.words){ const b = CT_WORD_BANDS.find(x => x[0] === f.words), w = pieceWords(e);
      if(b && (w < b[2] || w > b[3])) return false; }
    if(q){ const hay = `${e.title} ${c.subtitle} ${c.raw} ${(e.tags || []).join(' ')} ${c.themes.map(contentThemeName).join(' ')} ${pieceBody(e).slice(0, 4000)}`.toLowerCase();
      if(!hay.includes(q)) return false; }
    return true;
  });
}
function contentSorted(list){
  const s = S._ctSort || 'edited';
  const by = {
    edited: (a, b) => (pieceEditedAt(b) || '').localeCompare(pieceEditedAt(a) || ''),
    stage:  (a, b) => CONTENT_STAGE_IDS.indexOf(a.extra.content.stage) - CONTENT_STAGE_IDS.indexOf(b.extra.content.stage),
    type:   (a, b) => a.extra.content.type.localeCompare(b.extra.content.type),
    words:  (a, b) => pieceWords(b) - pieceWords(a),
    sched:  (a, b) => (a.extra.content.scheduled || '9999').localeCompare(b.extra.content.scheduled || '9999'),
    title:  (a, b) => (a.title || '').localeCompare(b.title || ''),
  };
  return list.slice().sort(by[s] || by.edited);
}

function contentLibraryHTML(){
  const f = ctFilters(), mode = contentState().prefs.libraryMode || 'grid';
  const list = contentSorted(contentFiltered());
  const chips = (key, opts) => opts.map(([k, n, col]) =>
    `<button class="pf-chip${f[key].includes(k) ? ' on' : ''}" data-ctf="${key}:${k}"${col ? ` style="--c:${col}"` : ''}>${esc(n)}</button>`).join('');
  return `<div class="ct-shelf">
    <div class="ct-filters">
      <div class="ct-frow"><span class="k mono">stage</span>${chips('stage', CONTENT_STAGES.map(s => [s.id, s.name, s.color]))}</div>
      <div class="ct-frow"><span class="k mono">kind</span>${chips('type', CONTENT_TYPES)}</div>
      <div class="ct-frow"><span class="k mono">where</span>${chips('dest', CONTENT_DESTS)}</div>
      ${contentState().themes.length ? `<div class="ct-frow"><span class="k mono">theme</span>${chips('theme', contentState().themes.map(t => [t.id, t.name, t.color]))}</div>` : ''}
      <div class="ct-frow"><span class="k mono">length</span>
        ${CT_WORD_BANDS.map(([k, n]) => `<button class="pf-chip${f.words === k ? ' on' : ''}" data-ctfw="${k}">${n}</button>`).join('')}
        <span class="k mono" style="margin-left:12px">drawn from life</span>
        ${[['yes','yes'],['no','no']].map(([k, n]) => `<button class="pf-chip${f.linked === k ? ' on' : ''}" data-ctfl="${k}">${n}</button>`).join('')}
        <span style="margin-left:auto"></span>
        <select class="sel sm" id="ctSort" style="width:auto;padding-right:22px">${CT_SORTS.map(([k, n]) =>
          `<option value="${k}" ${(S._ctSort || 'edited') === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
        ${[['grid','▦'],['list','▤']].map(([k, i]) => `<button class="pf-chip${mode === k ? ' on' : ''}" data-ctmode="${k}" title="${k}">${i}</button>`).join('')}
        ${(f.stage.length || f.type.length || f.dest.length || f.theme.length || f.words || f.linked)
          ? '<button class="pf-chip" id="ctClearF">clear</button>' : ''}
      </div>
    </div>
    <div class="mono faint" style="margin:2px 0 8px">${list.length} of ${contentPieces().length}</div>
    ${!list.length ? `<div class="ct-none lora">${contentPieces().length
        ? 'Nothing matches that.'
        : 'No pieces yet. Every essay starts as a thought you refused to let go.'}</div>`
      : mode === 'list' ? ctListHTML(list) : ctGridHTML(list)}
  </div>`;
}
function ctGridHTML(list){
  return `<div class="ct-grid">${list.map(e => {
    const c = e.extra.content, st = contentStage(c.stage), w = pieceWords(e), t = pieceTarget(e);
    const prev = (c.raw || pieceBody(e)).replace(/[#*_>`]/g, '').trim().slice(0, 150);
    return `<div class="ct-gcard" data-ctcard="${e.id}" draggable="true" style="--c:${st.color}">
      <div class="ct-gtop"><span class="ct-cico">${st.icon}</span><span class="mono">${esc(st.name)}</span>
        ${c.pinned ? '<span class="ct-pin">◆</span>' : ''}</div>
      <h3 class="serif">${esc(e.title || 'Untitled')}</h3>
      ${c.subtitle ? `<div class="ct-gsub">${esc(c.subtitle)}</div>` : ''}
      ${prev ? `<p class="ct-gprev">${esc(prev)}${prev.length >= 150 ? '…' : ''}</p>` : ''}
      ${t ? `<div class="ct-bar"><i style="width:${Math.min(100, Math.round(w / t * 100))}%"></i></div>` : ''}
      <div class="ct-cmeta"><span class="ct-chip">${esc(contentTypeName(c.type))}</span>
        <span class="mono">${t ? `${w}/${t}` : `${w} words`}</span>
        <span class="mono ct-dest">${esc(contentDestName(c.dest))}</span></div>
      ${c.themes.length ? `<div class="ct-themes">${c.themes.map(id =>
        `<span class="ct-theme" style="--c:${contentThemeColor(id)}">${esc(contentThemeName(id))}</span>`).join('')}</div>` : ''}
      <div class="ct-cfoot mono"><span>${esc(relDays(daysSince((pieceEditedAt(e) || '').slice(0, 10))))}</span>
        ${c.scheduled ? `<span class="ct-sched${pieceOverdue(e) ? ' late' : ''}">◷ ${esc(fmtDate(c.scheduled, 'short'))}</span>` : ''}</div>
    </div>`; }).join('')}</div>`;
}
function ctListHTML(list){
  return `<div class="ct-rows"><div class="ct-row head mono">
      <span>stage</span><span>title</span><span>kind</span><span>where</span><span>words</span><span>themes</span><span>edited</span><span>planned</span></div>
    ${list.map(e => { const c = e.extra.content, st = contentStage(c.stage), w = pieceWords(e), t = pieceTarget(e);
      return `<div class="ct-row" data-ctcard="${e.id}" draggable="true" style="--c:${st.color}">
        <span class="ct-rst"><i></i>${esc(st.name)}</span>
        <span class="ct-rtitle">${esc(e.title || 'Untitled')}</span>
        <span class="mono">${esc(contentTypeName(c.type))}</span>
        <span class="mono">${esc(contentDestName(c.dest))}</span>
        <span class="mono">${t ? `${w}/${t}` : w}</span>
        <span class="ct-rth">${c.themes.slice(0, 2).map(id => `<span class="ct-theme" style="--c:${contentThemeColor(id)}">${esc(contentThemeName(id))}</span>`).join('')}</span>
        <span class="mono">${esc(relDays(daysSince((pieceEditedAt(e) || '').slice(0, 10))))}</span>
        <span class="mono${pieceOverdue(e) ? ' late' : ''}">${c.scheduled ? esc(fmtDate(c.scheduled, 'short')) : '—'}</span>
      </div>`; }).join('')}</div>`;
}

/* ---------- the numbers ---------- */
/* a row of figures, each with its label beneath it rather than beside it */
function ctFigHTML(pairs){
  return `<div class="ct-fig">${pairs.map(([v]) => `<b>${v}</b>`).join('')}${
    pairs.map(([, l]) => `<span class="mono">${esc(l)}</span>`).join('')}</div>`;
}
/* how long the pieces that left a stage spent sitting in it. Only the
   pieces that moved on can say; a piece still in Draft has not finished
   telling us how long Draft takes. */
function ctStageDwell(){
  const out = {};
  CONTENT_STAGES.forEach(s => out[s.id] = []);
  contentPieces().forEach(e => {
    const c = e.extra.content, i = CONTENT_STAGE_IDS.indexOf(c.stage);
    if(i < 0) return;
    const d = daysSince((c.stageAt || '').slice(0, 10));
    if(d !== Infinity) out[c.stage].push(d);
  });
  return out;
}
function ctWritingDays(){
  const days = new Set();
  contentPieces().forEach(e => { const d = (pieceEditedAt(e) || '').slice(0, 10); if(d) days.add(d);
    if(e.extra?.binder && typeof wsFlatDocs === 'function')
      wsFlatDocs(e.extra.binder).forEach(n => { if(n.updatedAt) days.add(n.updatedAt.slice(0, 10)); }); });
  return days;
}
function ctStreak(days){
  let cur = 0, d = today();
  if(!days.has(d)) d = addDays(d, -1);
  while(days.has(d)){ cur++; d = addDays(d, -1); }
  let best = 0, run = 0;
  const sorted = Array.from(days).sort();
  sorted.forEach((x, i) => { run = (i && daysBetween(sorted[i - 1], x) === 1) ? run + 1 : 1; best = Math.max(best, run); });
  return {cur, best};
}
function contentStatsHTML(){
  const all = contentPieces();
  if(!all.length) return `<div class="ct-none lora">Nothing to count yet.</div>`;
  const published = all.filter(e => e.extra.content.stage === 'published');
  const dwell = ctStageDwell();
  const counts = CONTENT_STAGES.map(s => ({s, n: contentByStage(s.id).length}));
  const peak = Math.max(1, ...counts.map(x => x.n));
  const stale = all.filter(pieceStale).sort((a, b) => (pieceEditedAt(a) || '').localeCompare(pieceEditedAt(b) || ''));

  /* throughput: pieces published in each of the last 26 weeks */
  const weeks = Array.from({length:26}, (_, i) => planWeekStart(addDays(today(), -(25 - i) * 7)));
  const thru = weeks.map(w => published.filter(e => { const d = e.extra.content.publishedOn || ''; return d >= w && d < addDays(w, 7); }).length);

  const words = published.reduce((a, e) => a + pieceWords(e), 0);
  const byKey = (getKey, names) => { const m = new Map();
    all.forEach(e => { const k = getKey(e); if(!k) return; m.set(k, (m.get(k) || 0) + 1); });
    const rows = Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
    const top = Math.max(1, ...rows.map(r => r[1]));
    return rows.length ? rows.map(([k, n]) =>
      `<div class="ct-brow"><span>${esc(names(k))}</span><span class="ct-btrack"><i style="width:${n / top * 100}%"></i></span><span class="mono">${n}</span></div>`).join('')
      : '<div class="pk-empty">—</div>'; };

  const days = ctWritingDays(), streak = ctStreak(days);
  const thisMonth = published.filter(e => (e.extra.content.publishedOn || '').slice(0, 7) === today().slice(0, 7)).length;
  const thisYear  = published.filter(e => (e.extra.content.publishedOn || '').slice(0, 4) === today().slice(0, 4)).length;

  /* the themes with nothing in them are the point of this list */
  const themeCount = new Map(contentState().themes.map(t => [t.id, 0]));
  all.forEach(e => e.extra.content.themes.forEach(id => themeCount.has(id) && themeCount.set(id, themeCount.get(id) + 1)));
  const themeRows = Array.from(themeCount.entries()).sort((a, b) => b[1] - a[1]);
  const themeTop = Math.max(1, ...themeRows.map(r => r[1]));

  return `<div class="ct-stats">
    <div class="ct-scard"><div class="k mono">where everything is sitting</div>
      ${counts.map(({s, n}) => `<div class="ct-brow"><span>${s.icon} ${esc(s.name)}</span>
        <span class="ct-btrack"><i style="width:${n / peak * 100}%;background:${s.color}"></i></span>
        <span class="mono">${n || ''}</span></div>`).join('')}
      <div class="faint lora" style="font-size:.8rem;margin-top:8px">${esc(ctBottleneck(counts))}</div></div>

    <div class="ct-scard"><div class="k mono">how long a piece waits, by stage</div>
      ${CONTENT_ACTIVE_STAGES.concat('seed','ready').map(id => { const st = contentStage(id), v = dwell[id] || [];
        return `<div class="ct-brow"><span>${esc(st.name)}</span>
          <span class="ct-btrack"><i style="width:${Math.min(100, (v.length ? avg(v) : 0) / 60 * 100)}%;background:${st.color}"></i></span>
          <span class="mono">${v.length ? Math.round(avg(v)) + 'd' : '—'}</span></div>`; }).join('')}
      <div class="faint" style="font-size:.76rem;margin-top:6px">counted from when each piece last changed stage</div></div>

    <div class="ct-scard"><div class="k mono">published, by week</div>
      ${sparkline(thru, {h:56, color:'var(--sage)'})}
      ${ctFigHTML([[published.length,'altogether'],[thisMonth,'this month'],[thisYear,'this year']])}</div>

    <div class="ct-scard"><div class="k mono">words that made it out</div>
      ${ctFigHTML([[words.toLocaleString(),'published words'],
        [published.length ? Math.round(words / published.length).toLocaleString() : 0,'the average piece'],
        [all.reduce((a, e) => a + pieceWords(e), 0).toLocaleString(),'written in total']])}</div>

    <div class="ct-scard"><div class="k mono">what you make</div>${byKey(e => e.extra.content.type, contentTypeName)}</div>
    <div class="ct-scard"><div class="k mono">where it goes</div>${byKey(e => e.extra.content.dest, contentDestName)}</div>

    <div class="ct-scard"><div class="k mono">what you write about</div>
      ${themeRows.length ? themeRows.map(([id, n]) => `<div class="ct-brow"><span>${esc(contentThemeName(id))}</span>
        <span class="ct-btrack"><i style="width:${n / themeTop * 100}%;background:${contentThemeColor(id)}"></i></span>
        <span class="mono">${n || ''}</span></div>`).join('') : '<div class="pk-empty">—</div>'}
      ${themeRows.some(r => !r[1]) ? `<div class="faint lora" style="font-size:.8rem;margin-top:8px">Untouched: ${
        esc(themeRows.filter(r => !r[1]).map(r => contentThemeName(r[0])).join(', '))}.</div>` : ''}</div>

    <div class="ct-scard"><div class="k mono">days you touched something</div>
      ${ctFigHTML([[streak.cur,'day streak'],[streak.best,'your best']])}
      ${heatGrid(lastDays(182), 26, d => days.has(d) ? 'l3' : 'l0', 'heat ct-heat')}</div>

    <div class="ct-scard wide"><div class="k mono">left alone too long</div>
      ${stale.length ? stale.map(e => { const st = contentStage(e.extra.content.stage);
        return `<button class="ct-nrow" data-ctopen="${e.id}" style="--c:${st.color}">
          <b>${esc(e.title || 'Untitled')}</b>
          <span class="ct-nmeta mono">${esc(st.name)} · untouched ${daysSince((pieceEditedAt(e) || '').slice(0, 10))} days</span></button>`; }).join('')
        : '<div class="pk-empty lora">Nothing has been abandoned. Good.</div>'}</div>
  </div>`;
}
/* the honest reading of the column heights */
function ctBottleneck(counts){
  const n = id => (counts.find(c => c.s.id === id) || {n:0}).n;
  const ideas = n('idea') + n('seed'), drafts = n('draft') + n('refining'), out = n('published');
  if(!ideas && !drafts && !out) return 'Nothing in the pipeline yet.';
  if(ideas >= 6 && drafts <= 1) return `${ideas} ideas and ${drafts} being written. The gap is between catching and starting.`;
  if(drafts >= 4 && n('ready') + out === 0) return `${drafts} pieces underway and none finished. The gap is between writing and letting go.`;
  if(n('ready') >= 3) return `${n('ready')} pieces are finished and waiting. They are only waiting on you.`;
  return `${ideas} caught, ${drafts} underway, ${out} out in the world.`;
}

/* ---------- binding ---------- */
function bindContentCalendar(root){
  $$('[data-ctcnav]', root).forEach(b => b.onclick = () => {
    const d = +b.dataset.ctcnav, mode = S._ctCalMode || 'month';
    if(!d) S._ctCal = today();
    else if(mode === 'week') S._ctCal = addDays(ctCalCursor(), 7 * d);
    else { const c = parseDay(ctCalCursor()); S._ctCal = isoDay(new Date(c.getFullYear(), c.getMonth() + d, 1)); }
    sound('click'); rerenderContentBody(); });
  $$('[data-ctcmode]', root).forEach(b => b.onclick = () => { S._ctCalMode = b.dataset.ctcmode; sound('click'); rerenderContentBody(); });
  $$('[data-ctdayadd]', root).forEach(b => b.onclick = ev => { ev.stopPropagation();
    const e = contentNewPiece({stage:'seed'});
    e.extra.content.scheduled = b.dataset.ctdayadd; saveNow(); rerenderContentBody(); openPieceDetail(e.id); });
  $$('[data-ctdayopen]', root).forEach(b => b.onclick = ev => { ev.stopPropagation(); openContentDay(b.dataset.ctdayopen); });
  /* dropping a piece on a day is how it gets rescheduled */
  $$('[data-ctday]', root).forEach(cell => {
    cell.addEventListener('dragover', ev => { if(window._ctDrag){ ev.preventDefault(); cell.classList.add('over'); } });
    cell.addEventListener('dragleave', () => cell.classList.remove('over'));
    cell.addEventListener('drop', ev => { ev.preventDefault(); cell.classList.remove('over');
      const e = contentPiece(window._ctDrag); window._ctDrag = null; if(!e) return;
      const c = e.extra.content;
      if(c.stage === 'published') c.publishedOn = cell.dataset.ctday; else c.scheduled = cell.dataset.ctday;
      saveNow(); sound('click'); toast(`Planned for ${fmtDate(cell.dataset.ctday, 'med')}.`); rerenderContentBody(); });
  });
}
function openContentDay(iso){
  const list = contentPieces().filter(e => pieceDay(e) === iso);
  const m = openModal(`<h2>${esc(fmtDate(iso, 'long'))}</h2><div class="stack" style="gap:6px">
    ${list.map(e => { const st = contentStage(e.extra.content.stage);
      return `<button class="choice" data-ctd="${e.id}"><span class="ico" style="color:${st.color}">${st.icon}</span>
        <span><b>${esc(e.title || 'Untitled')}</b><i class="mono">${esc(st.name)} · ${esc(contentDestName(e.extra.content.dest))}</i></span></button>`; }).join('')}
    </div>`, 'narrow');
  m.querySelectorAll('[data-ctd]').forEach(b => b.onclick = () => { m.remove(); openPieceDetail(b.dataset.ctd); });
}
function bindContentLibrary(root){
  $$('[data-ctf]', root).forEach(b => b.onclick = () => { const [k, v] = b.dataset.ctf.split(':');
    ctToggleFilter(k, v); sound('click'); rerenderContentBody(); });
  $$('[data-ctfw]', root).forEach(b => b.onclick = () => { const f = ctFilters();
    f.words = f.words === b.dataset.ctfw ? '' : b.dataset.ctfw; sound('click'); rerenderContentBody(); });
  $$('[data-ctfl]', root).forEach(b => b.onclick = () => { const f = ctFilters();
    f.linked = f.linked === b.dataset.ctfl ? '' : b.dataset.ctfl; sound('click'); rerenderContentBody(); });
  $$('[data-ctmode]', root).forEach(b => b.onclick = () => { contentState().prefs.libraryMode = b.dataset.ctmode;
    saveNow(); sound('click'); rerenderContentBody(); });
  const s = $('#ctSort'); if(s) s.onchange = () => { S._ctSort = s.value; rerenderContentBody(); };
  const c = $('#ctClearF'); if(c) c.onclick = () => { S._ctF = null; ctFilters(); sound('click'); rerenderContentBody(); };
}
