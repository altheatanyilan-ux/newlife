/* ============================================================
   CONTENT — one piece, opened. Management, not craft: the writing
   itself happens in the Writing Studio, and the button that goes
   there is the most prominent thing in the panel.
   ============================================================ */

function openPieceDetail(id){
  const e = contentPiece(id); if(!e) return;
  contentState().prefs.lastPiece = id; saveNow();
  const p = openPanel(pieceDetailHTML(e), 'plan-detail piece-detail');
  bindPieceDetail(p, e);
  return p;
}
function pieceRedraw(e){
  const p = openPanel(pieceDetailHTML(e), 'plan-detail piece-detail');
  bindPieceDetail(p, e);
  if(parseHash().name === 'content') rerenderContentBody();
}

function pieceDetailHTML(e){
  const c = e.extra.content, st = contentStage(c.stage);
  const w = pieceWords(e), t = pieceTarget(e);
  const body = pieceBody(e), outline = e.extra.outline, notes = e.extra.scratchpad || '';
  const tasks = (S.tasks || []).filter(x => (x.links?.content || []).includes(e.id));
  return `<div class="pd pcd">
    <div class="pcd-head">
      <input class="inp pd-title" id="pcTitle" value="${esc(e.title)}" placeholder="What is it called?">
      <input class="inp pcd-sub" id="pcSub" value="${esc(c.subtitle)}" placeholder="a subtitle, if it needs one">
      <div class="row" style="gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap">
        <button class="ct-stage" id="pcStage" style="--c:${st.color}">${st.icon} ${esc(st.name)} ▾</button>
        <button class="btn sm primary" id="pcOpen">Open in the Writing Studio →</button>
        <button class="pl-mini" id="pcPin" title="${c.pinned ? 'unpin' : 'pin to the top'}">${c.pinned ? '◆' : '◇'}</button>
      </div>
    </div>

    <div class="pd-quick">
      <label class="pd-q"><span class="k">kind</span><select class="sel" id="pcType">
        ${CONTENT_TYPES.map(([k, n]) => `<option value="${k}" ${c.type === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="pd-q"><span class="k">where it goes</span><select class="sel" id="pcDest">
        ${CONTENT_DESTS.map(([k, n]) => `<option value="${k}" ${c.dest === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="pd-q"><span class="k">planned for</span><input type="date" class="inp" id="pcSched" value="${esc(c.scheduled)}"></label>
      <label class="pd-q"><span class="k">words wanted</span><input class="inp mono" id="pcTarget" value="${t || ''}" placeholder="—"></label>
    </div>
    <div class="pcd-words mono">${w.toLocaleString()} written${t ? ` of ${t.toLocaleString()}` : ''}
      ${t ? `<span class="pd-bar" style="flex:1"><i style="width:${Math.min(100, Math.round(w / t * 100))}%"></i></span>` : ''}</div>

    <div class="pd-sec"><div class="k mono">themes</div><div class="chip-row" id="pcThemes">
      ${contentState().themes.map(x => `<button class="chip click${c.themes.includes(x.id) ? ' on' : ''}" data-pcth="${x.id}" style="--c:${x.color}">${esc(x.name)}</button>`).join('')}</div></div>

    <div class="pd-sec"><div class="k mono">tags</div>
      <input class="inp mono" id="pcTags" value="${esc((e.tags || []).map(x => '#' + x).join(' '))}" placeholder="#craft #japan"></div>

    <div class="pd-sec"><div class="row between"><span class="k mono">what sparked it</span>
      <button class="pl-mini" id="pcTrailAdd" title="add a step">＋</button></div>
      <div class="pcd-trail">${c.trail.length ? c.trail.map(x => { const k = CONTENT_TRAIL_KINDS[x.type] || CONTENT_TRAIL_KINDS.other;
        return `<div class="pcd-tstep"><span class="pcd-tico" title="${esc(k[1])}">${k[0]}</span>
          <span class="pcd-ttext">${esc(x.description || k[1])}</span>
          <span class="mono">${esc(fmtDate((x.addedAt || '').slice(0, 10), 'short'))}</span>
          <button class="del-x inline" data-pctdel="${x.id}">×</button></div>`; }).join('')
        : '<div class="pk-empty">Nothing recorded. Where did this come from?</div>'}</div></div>

    <div class="pd-sec"><div class="row between"><span class="k mono">drawn from your own life</span>
      <button class="pl-mini" id="pcLinkAdd" title="link something">＋</button></div>
      <div class="pcd-links">${c.linked.length ? c.linked.map(l =>
        `<div class="pcd-link"><span class="pcd-lico">${esc(CONTENT_SOURCE_ICON[l.sourceType] || '·')}</span>
          <a href="${esc(contentSourceHref(l))}" class="pcd-ltext">${esc(l.title || 'an entry')}</a>
          <button class="del-x inline" data-pcldel="${l.id}">×</button></div>`).join('')
        : '<div class="pk-empty">Nothing linked yet. Your journals, your Library, your Timeline.</div>'}</div></div>

    <div class="pd-sec"><div class="row between"><span class="k mono">quotes pinned to it</span>
      <button class="pl-mini" id="pcQuoteAdd" title="find a quote">＋</button></div>
      <div class="pcd-quotes">${c.quotes.length ? c.quotes.map(q => `<div class="pcd-quote">
        <div class="pcd-qtext">${esc(q.text)}</div>
        <div class="pcd-qattr mono">${esc(q.source)}${q.author ? ' · ' + esc(q.author) : ''}${q.pageOrLocation ? ' · ' + esc(q.pageOrLocation) : ''}</div>
        ${q.whyCaught ? `<div class="pcd-qwhy">${esc(q.whyCaught)}</div>` : ''}
        <button class="del-x inline" data-pcqdel="${q.id}">×</button></div>`).join('')
        : '<div class="pk-empty">No quotes pinned. The vault and your Library are both searchable.</div>'}</div></div>

    ${c.stage === 'ready' || c.stage === 'published' ? `<div class="pd-sec"><div class="k mono">before it goes out</div>
      <div class="pcd-checks">${CONTENT_CHECKS.map(([k, label]) =>
        `<label class="pcd-check${c.checks[k] ? ' on' : ''}"><button class="pt-box sm" data-pcchk="${k}" role="checkbox" aria-checked="${!!c.checks[k]}">
          <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.2" class="pt-ring"/><path d="M5.6 10.3 L8.7 13.3 L14.4 6.9" class="pt-tick"/></svg></button>
        <span>${esc(label)}</span></label>`).join('')}</div>
      <input class="inp mono" id="pcUrl" value="${esc(c.url)}" placeholder="https://… once it is up" style="margin-top:8px"></div>` : ''}

    <details class="pd-sec pcd-fold"><summary><span class="k mono">the draft so far</span>
      <span class="mono faint">${w ? w.toLocaleString() + ' words' : 'nothing yet'}</span></summary>
      <div class="pcd-preview">${body ? md(body.slice(0, 500)) + (body.length > 500 ? '<p class="faint">…</p>' : '') :
        '<div class="pk-empty">Nothing written yet.</div>'}
        <a class="mono" id="pcOpen2" href="#/writing/${e.id}">continue in the Writing Studio →</a></div></details>
    ${outline && outline.length ? `<details class="pd-sec pcd-fold"><summary><span class="k mono">outline</span><span class="mono faint">${outline.length} points</span></summary>
      <ul class="pcd-outline">${outline.slice(0, 12).map(o => `<li>${esc(typeof o === 'string' ? o : (o.text || ''))}</li>`).join('')}</ul></details>` : ''}
    ${notes ? `<details class="pd-sec pcd-fold"><summary><span class="k mono">notes</span></summary>
      <div class="pcd-preview">${md(notes.slice(0, 600))}</div></details>` : ''}

    <div class="pd-sec"><div class="row between"><span class="k mono">work booked for it${
      c.focusMinutes ? ` · ${Math.round(c.focusMinutes / 60 * 10) / 10}h focused` : ''}</span>
      <button class="pl-mini" id="pcTaskAdd" title="add a task">＋</button></div>
      ${tasks.length ? `<div class="pl-linked">${tasks.map(x => `<a class="pl-lrow" href="#/planning">
        <span class="pt-prio" style="background:${x.done ? 'var(--sage)' : planPriority(x.priority).color || 'var(--line-2)'}"></span>
        <span class="pl-ltext">${esc(x.text)}</span>${x.day ? `<span class="mono">${esc(fmtDate(x.day, 'short'))}</span>` : ''}</a>`).join('')}</div>`
        : '<div class="pk-empty">Nothing booked. A piece with no time set aside rarely gets written.</div>'}</div>

    <div class="pd-meta mono">
      <div>started ${esc(fmtDate((e.createdAt || '').slice(0, 10), 'med'))}</div>
      <div>last touched ${esc(fmtDate((pieceEditedAt(e) || '').slice(0, 10), 'med'))}</div>
      <div>moved to ${esc(st.name.toLowerCase())} ${esc(relDays(daysSince((c.stageAt || '').slice(0, 10))))}</div>
      ${c.url ? `<div><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.url)}</a></div>` : ''}</div>
    <div class="row" style="gap:8px;margin-top:14px;flex-wrap:wrap">
      ${c.stage === 'idea' ? '<button class="btn sm" id="pcPromote">give it a shape →</button>' : ''}
      <button class="btn sm ghost" id="pcCompost">send to the compost heap</button>
      <button class="btn sm ghost" id="pcDup">duplicate</button>
      <button class="btn sm ghost" id="pcArch">archive</button>
      <button class="btn sm ghost danger" id="pcDel">delete</button></div>
  </div>`;
}
/* the same source names the trail uses, so one vocabulary covers both */
const CONTENT_SOURCE_ICON = {journal_entry:'✍', timeline_event:'◷', library_media:'▤', library_quote:'❝',
  library_note:'▤', value_entry:'◈', skill_milestone:'⋔', project_update:'▲', book_vault_quote:'❞'};
const CONTENT_SOURCE_PAGE = {journal_entry:'#/journals', timeline_event:'#/timeline',
  library_media:'#/commonplace', library_quote:'#/commonplace', library_note:'#/commonplace',
  value_entry:'#/values', skill_milestone:'#/skills', project_update:'#/projects'};
function contentSourceHref(l){ return CONTENT_SOURCE_PAGE[l.sourceType] || '#/content'; }

function bindPieceDetail(p, e){
  const c = e.extra.content;
  const touch = () => { saveNow(); rerenderContentBody(); };
  p.querySelector('#pcTitle').oninput = debounce(function(){ e.title = this.value; touch(); }, 350);
  p.querySelector('#pcSub').oninput = debounce(function(){ c.subtitle = this.value; touch(); }, 350);
  p.querySelector('#pcStage').onclick = () => planChoose('Where is it?',
    CONTENT_STAGES.map(s => [s.id, `${s.icon}  ${s.name} — ${s.hint}`]),
    v => { pieceSetStage(e, v); sound('click'); pieceRedraw(e); });
  const go = () => closePanelTo('#/writing/' + e.id);
  p.querySelector('#pcOpen').onclick = go;
  p.querySelector('#pcOpen2')?.addEventListener('click', ev => { ev.preventDefault(); go(); });
  p.querySelector('#pcPin').onclick = () => { c.pinned = !c.pinned; touch(); pieceRedraw(e); };
  p.querySelector('#pcType').onchange = function(){ c.type = this.value; touch(); };
  p.querySelector('#pcDest').onchange = function(){ c.dest = this.value; touch(); };
  p.querySelector('#pcSched').onchange = function(){ c.scheduled = this.value; touch(); };
  p.querySelector('#pcTarget').oninput = debounce(function(){
    e.extra.target = e.extra.target || {}; e.extra.target.wordTarget = parseInt(this.value, 10) || 0; touch(); }, 400);
  p.querySelectorAll('[data-pcth]').forEach(b => b.onclick = () => {
    const i = c.themes.indexOf(b.dataset.pcth); i < 0 ? c.themes.push(b.dataset.pcth) : c.themes.splice(i, 1);
    b.classList.toggle('on'); touch(); });
  p.querySelector('#pcTags').oninput = debounce(function(){
    e.tags = normTags(this.value.split(/[\s,]+/).map(x => x.replace(/^#/, '')).filter(Boolean)); touch(); }, 400);

  p.querySelector('#pcTrailAdd').onclick = () => openTrailAdd(e);
  p.querySelectorAll('[data-pctdel]').forEach(b => b.onclick = () => {
    spliceOut(c.trail, x => x.id === b.dataset.pctdel); touch(); pieceRedraw(e); });
  p.querySelector('#pcLinkAdd').onclick = () => openLifeLinker(e);
  p.querySelectorAll('[data-pcldel]').forEach(b => b.onclick = () => {
    spliceOut(c.linked, x => x.id === b.dataset.pcldel); touch(); pieceRedraw(e); });
  p.querySelector('#pcQuoteAdd').onclick = () => openQuoteBrowser(e);
  p.querySelectorAll('[data-pcqdel]').forEach(b => b.onclick = () => {
    spliceOut(c.quotes, x => x.id === b.dataset.pcqdel); touch(); pieceRedraw(e); });

  p.querySelectorAll('[data-pcchk]').forEach(b => b.onclick = () => {
    const k = b.dataset.pcchk; c.checks[k] = !c.checks[k]; saveNow();
    /* every box ticked and an address written down means it is out */
    if(CONTENT_CHECKS.every(([x]) => c.checks[x]) && c.url && c.stage !== 'published'){
      pieceSetStage(e, 'published'); sound('success'); toast('Published. It is out of your hands now.', 5000);
    }
    pieceRedraw(e); });
  const url = p.querySelector('#pcUrl');
  if(url) url.oninput = debounce(function(){ c.url = this.value.trim(); c.checks.url = !!c.url; touch(); }, 400);

  p.querySelector('#pcTaskAdd').onclick = () => {
    if(typeof newPlanTask !== 'function') return;
    const t = newPlanTask(`Write: ${e.title || 'untitled piece'}`, c.scheduled || '', {listId:'inbox', priority:2});
    t.links.content = [e.id];
    S.tasks.push(t); saveNow(); sound('success'); toast('Booked in Planning.'); pieceRedraw(e); };

  p.querySelector('#pcPromote')?.addEventListener('click', () => { closePanel(); openPromoteSeed(e.id); });
  p.querySelector('#pcCompost').onclick = () => {
    const txt = c.raw || pieceBody(e).slice(0, 400) || e.title;
    if(!txt) return toast('Nothing to compost yet.');
    addCompost(txt, e.tags || []);
    toast('On the heap. It can rot down and come back.', 5000);
    sound('click'); };
  p.querySelector('#pcDup').onclick = () => {
    const copy = contentNewPiece({title:(e.title || 'Untitled') + ' (again)', stage:c.stage, type:c.type,
      dest:c.dest, themes:c.themes, raw:c.raw});
    copy.extra.content.trail = JSON.parse(JSON.stringify(c.trail));
    copy.extra.content.quotes = JSON.parse(JSON.stringify(c.quotes));
    saveNow(); closePanel(); sound('success'); rerender(); };
  p.querySelector('#pcArch').onclick = () => { pieceSetStage(e, 'archived'); closePanel(); sound('click'); rerender(); };
  p.querySelector('#pcDel').onclick = () => { closePanel();
    requestDelete({label:e.title || 'this piece', after:() => rerender(),
      remove: () => spliceOut(S.entries, x => x.id === e.id)}); };
}

function openTrailAdd(e){
  const m = openModal(`<h2>What sparked it</h2><div class="stack">
    <div class="field"><label>Kind</label><select class="sel" id="taKind">
      ${Object.entries(CONTENT_TRAIL_KINDS).map(([k, v]) => `<option value="${k}">${v[0]}  ${v[1]}</option>`).join('')}</select></div>
    <div class="field"><label>What happened</label><input class="inp" id="taWhat" placeholder="Reading Psycho-Cybernetics, chapter three"></div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="taSave">Add it</button></div></div>`, 'narrow');
  m.querySelector('#taSave').onclick = () => {
    const what = m.querySelector('#taWhat').value.trim(); if(!what) return;
    pieceAddTrail(e, m.querySelector('#taKind').value, what);
    saveNow(); m.remove(); sound('click'); pieceRedraw(e); };
}
