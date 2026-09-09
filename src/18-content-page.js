/* ============================================================
   CONTENT — the page: a pipeline, a calendar, a shelf, and the
   numbers underneath them.
   ============================================================ */

function contentView(){ return S._ctView || contentState().prefs.view || 'pipeline'; }
function contentSetView(v){ S._ctView = v; contentState().prefs.view = v; saveNow(); rerender(); }

function contentCardHTML(e){
  const c = e.extra.content, st = contentStage(c.stage);
  const w = pieceWords(e), t = pieceTarget(e);
  const seed = c.stage === 'idea' || c.stage === 'seed';
  return `<div class="ct-card${c.pinned ? ' pinned' : ''}${pieceStale(e) ? ' stale' : ''}${pieceSoon(e) ? ' soon' : ''}${seed ? ' seed' : ''}"
      data-ctcard="${e.id}" draggable="true" style="--c:${st.color}">
    <div class="ct-ctop">
      ${c.pinned ? '<span class="ct-pin" title="pinned">◆</span>' : ''}
      <span class="ct-title">${esc(e.title || (c.raw ? c.raw.slice(0, 60) : 'Untitled'))}</span></div>
    ${c.raw && seed ? `<div class="ct-raw">${esc(c.raw.slice(0, 140))}</div>` : ''}
    ${t ? `<div class="ct-bar" title="${w} of ${t} words"><i style="width:${Math.min(100, Math.round(w / t * 100))}%"></i></div>` : ''}
    <div class="ct-cmeta">
      <span class="ct-chip">${esc(contentTypeName(c.type))}</span>
      <span class="mono">${t ? `${w}/${t}` : (w ? `${w} words` : '—')}</span>
      <span class="mono ct-dest">${esc(contentDestName(c.dest))}</span>
    </div>
    ${c.themes.length ? `<div class="ct-themes">${c.themes.slice(0, 2).map(id =>
      `<span class="ct-theme" style="--c:${contentThemeColor(id)}">${esc(contentThemeName(id))}</span>`).join('')}
      ${c.themes.length > 2 ? `<span class="ct-theme more">+${c.themes.length - 2}</span>` : ''}</div>` : ''}
    <div class="ct-cfoot mono">
      <span>${esc(relDays(daysSince((pieceEditedAt(e) || '').slice(0, 10))))}</span>
      ${c.scheduled ? `<span class="ct-sched${pieceOverdue(e) ? ' late' : ''}">◷ ${esc(fmtDate(c.scheduled, 'short'))}</span>` : ''}
    </div></div>`;
}

/* ---------- pipeline ---------- */
function contentPipelineHTML(){
  return `<div class="ct-board">${CONTENT_STAGES.map(st => {
    const list = contentByStage(st.id).sort((a, b) =>
      (b.extra.content.pinned ? 1 : 0) - (a.extra.content.pinned ? 1 : 0)
      || (a.extra.content.order || 0) - (b.extra.content.order || 0));
    return `<div class="ct-col" data-ctcol="${st.id}" style="--c:${st.color};--tint:${st.tint}">
      <div class="ct-colh"><span class="ct-cico">${st.icon}</span><span class="ct-cname">${esc(st.name)}</span>
        <span class="mono">${list.length || ''}</span>
        <button class="pl-mini" data-ctadd="${st.id}" title="start one here">＋</button></div>
      <div class="ct-cards">${list.map(contentCardHTML).join('')
        || `<div class="ct-empty">${esc(st.hint)}</div>`}</div>
    </div>`; }).join('')}</div>`;
}

/* ---------- the page ---------- */
routes.content = function(root, params){
  migrateContent();
  if(params[0] === 'stats') S._ctView = 'stats';
  const v = contentView();
  registerPageEntry({pageName:'Content', addLabel:'Catch an idea', defaultEntryType:'content',
    hint:'or press I anywhere on this page', prefilledFields:{},
    options:[{label:'Catch an idea', run:() => openContentCapture()},
             {label:'Start a piece',  run:() => openPieceDetail(contentNewPiece({stage:'seed'}).id)}]});

  const body = v === 'calendar' ? contentCalendarHTML()
    : v === 'library' ? contentLibraryHTML()
    : v === 'stats' ? contentStatsHTML()
    : contentPipelineHTML();

  root.innerHTML = `<div class="page ct-page">
    <div class="page-head"><h1>Content</h1></div>
    <div class="ct-head">
      <div class="ct-views">
        ${[['pipeline','Pipeline','▥'],['calendar','Calendar','▦'],['library','Shelf','▤'],['stats','Numbers','◫']].map(([k, n, i]) =>
          `<button class="${v === k ? 'on' : ''}" data-ctview="${k}" title="${n}">${i} <span>${n}</span></button>`).join('')}
      </div>
      <div class="row" style="gap:8px;margin-left:auto">
        <input class="inp mono ct-search" id="ctSearch" placeholder="search pieces…" value="${esc(S._ctQ || '')}">
        <button class="btn sm" id="ctCatch">＋ catch an idea</button>
      </div>
    </div>
    ${v === 'pipeline' || v === 'library' ? contentNextStripHTML() : ''}
    <div class="ct-body" id="ctBody">${body}</div>
  </div>`;
  bindContent(root);
};
ROUTE_ALIASES.contents = 'content';

/* ---------- what to publish next ---------- */
function contentNextStripHTML(){
  const list = contentWhatsNext(3);
  if(!list.length) return '';
  return `<div class="ct-next"><span class="mono">closest to done</span>
    ${list.map(e => { const c = e.extra.content, st = contentStage(c.stage), w = pieceWords(e), t = pieceTarget(e);
      return `<button class="ct-nx" data-ctopen="${e.id}" style="--c:${st.color}">
        <b>${esc(e.title || 'Untitled')}</b><span class="mono">${esc(st.name)}${t ? ` · ${Math.round(w / t * 100)}%` : ''}</span></button>`; }).join('')}</div>`;
}

/* ---------- quick capture ---------- */
function openContentCapture(prefill = {}){
  const m = openModal(`<h2>Catch it</h2>
    <p class="muted" style="font-size:.86rem">Before it goes. A title is optional — the thought is the point.</p>
    <div class="stack">
      <textarea class="ta" id="ccRaw" style="min-height:96px" placeholder="What just occurred to you?">${esc(prefill.raw || '')}</textarea>
      <input class="inp" id="ccTitle" placeholder="a working title, if one has arrived" value="${esc(prefill.title || '')}">
      <div class="field"><label>What sparked it</label>
        <input class="inp" id="ccSpark" placeholder="reading, a conversation, nothing in particular" value="${esc(prefill.spark || '')}"></div>
      <div class="field"><label>Themes</label><div class="chip-row" id="ccThemes">
        ${contentState().themes.map(t => `<button type="button" class="chip click" data-cct="${t.id}" style="--c:${t.color}">${esc(t.name)}</button>`).join('')}</div></div>
      <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn primary" id="ccSave">Keep it</button></div>
    </div>`, 'narrow');
  const themes = [];
  m.querySelectorAll('[data-cct]').forEach(b => b.onclick = () => {
    const i = themes.indexOf(b.dataset.cct); i < 0 ? themes.push(b.dataset.cct) : themes.splice(i, 1);
    b.classList.toggle('on'); });
  setTimeout(() => m.querySelector('#ccRaw').focus(), 80);
  const save = () => {
    const raw = m.querySelector('#ccRaw').value.trim(), title = m.querySelector('#ccTitle').value.trim();
    if(!raw && !title) return;
    const spark = m.querySelector('#ccSpark').value.trim();
    const e = contentNewPiece({title, stage:'idea', raw, themes,
      trail: spark ? {type: prefill.trailType || 'shower_thought', description: spark} : null});
    if(prefill.linked) pieceLink(e, prefill.linked.sourceType, prefill.linked.sourceId, prefill.linked.title);
    if(prefill.trail) pieceAddTrail(e, prefill.trail.type, prefill.trail.description, prefill.trail.sourceId);
    /* the board is redrawn before the flourishes: a thought that has been
       caught should appear even if the sound or the toast cannot */
    saveNow(); m.remove();
    if(parseHash().name === 'content') rerender();
    sound('success'); toast('Caught.', 3000);
  };
  m.querySelector('#ccSave').onclick = save;
  m.querySelector('#ccRaw').onkeydown = ev => { if(ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)){ ev.preventDefault(); save(); } };
}

/* promoting a caught thought into something with a shape */
function openPromoteSeed(id){
  const e = contentPiece(id); if(!e) return;
  const c = e.extra.content;
  const m = openModal(`<h2>Give it a shape</h2>
    <p class="muted" style="font-size:.86rem">${esc(c.raw ? c.raw.slice(0, 200) : 'What is this going to be?')}</p>
    <div class="stack">
      <div class="field"><label>Title</label><input class="inp" id="psTitle" value="${esc(e.title)}" placeholder="what it is called, for now"></div>
      <div class="grid c2" style="gap:10px">
        <div class="field"><label>What kind</label><select class="sel" id="psType">
          ${CONTENT_TYPES.map(([k, n]) => `<option value="${k}" ${c.type === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
        <div class="field"><label>Where it goes</label><select class="sel" id="psDest">
          ${CONTENT_DESTS.map(([k, n]) => `<option value="${k}" ${c.dest === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label>Themes</label><div class="chip-row" id="psThemes">
        ${contentState().themes.map(t => `<button type="button" class="chip click${c.themes.includes(t.id) ? ' on' : ''}" data-pst="${t.id}" style="--c:${t.color}">${esc(t.name)}</button>`).join('')}</div></div>
      <div class="faint" style="font-size:.76rem">The raw thought stays, as the piece's notes. What sparked it comes with it.</div>
      <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn primary" id="psGo">Plant it</button></div>
    </div>`, 'narrow');
  m.querySelectorAll('[data-pst]').forEach(b => b.onclick = () => {
    const i = c.themes.indexOf(b.dataset.pst); i < 0 ? c.themes.push(b.dataset.pst) : c.themes.splice(i, 1);
    b.classList.toggle('on'); });
  m.querySelector('#psGo').onclick = () => {
    e.title = m.querySelector('#psTitle').value.trim() || e.title || 'Untitled';
    c.type = m.querySelector('#psType').value; c.dest = m.querySelector('#psDest').value;
    if(c.raw && !e.extra.scratchpad) e.extra.scratchpad = c.raw;
    pieceSetStage(e, 'seed');
    saveNow(); m.remove(); sound('success'); rerender();
    setTimeout(() => openPieceDetail(e.id), 120);
  };
}
