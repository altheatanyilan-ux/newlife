/* ============================================================
   CONTENT — what the page does when it is touched.
   ============================================================ */

function rerenderContentBody(){
  if(parseHash().name !== 'content') return;
  const body = $('#ctBody'); if(!body) return;
  const keep = $('#panel'); const y = window.scrollY;
  const v = contentView();
  body.innerHTML = v === 'calendar' ? contentCalendarHTML() : v === 'library' ? contentLibraryHTML()
    : v === 'stats' ? contentStatsHTML() : contentPipelineHTML();
  const strip = document.querySelector('.ct-next');
  if(strip) strip.outerHTML = contentNextStripHTML() || '<span class="ct-next-gone" hidden></span>';
  bindContent($('#main'));
  if(keep && !$('#panel')) document.body.appendChild(keep);
  window.scrollTo({top:y});
}

function bindContent(root){
  $$('[data-ctview]', root).forEach(b => b.onclick = () => contentSetView(b.dataset.ctview));
  const q = $('#ctSearch');
  if(q) q.oninput = debounce(() => { S._ctQ = q.value.trim(); rerender();
    requestAnimationFrame(() => { const n = $('#ctSearch'); if(n){ n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }); }, 280);
  const catch_ = $('#ctCatch'); if(catch_) catch_.onclick = () => openContentCapture();
  const th = $('#ctThemes'); if(th) th.onclick = () => openThemeManager();
  $$('[data-ctopen]', root).forEach(b => b.onclick = () => openPieceDetail(b.dataset.ctopen));
  $$('[data-ctadd]', root).forEach(b => b.onclick = () => {
    const stage = b.dataset.ctadd;
    if(stage === 'idea') return openContentCapture();
    openPieceDetail(contentNewPiece({stage}).id); });

  /* cards: click opens the panel, double-click goes straight to the desk */
  $$('[data-ctcard]', root).forEach(card => {
    const id = card.dataset.ctcard;
    let clickT = null;
    card.addEventListener('click', ev => {
      if(ev.target.closest('button, a')) return;
      clearTimeout(clickT); clickT = setTimeout(() => openPieceDetail(id), 190);
    });
    card.addEventListener('dblclick', ev => {
      if(ev.target.closest('button, a')) return;
      clearTimeout(clickT); navigate('#/writing/' + id);
    });
    card.addEventListener('contextmenu', ev => { ev.preventDefault(); openPieceMenu(id); });
    card.addEventListener('dragstart', ev => { window._ctDrag = id; card.classList.add('dragging');
      ev.dataTransfer.effectAllowed = 'move'; try { ev.dataTransfer.setData('text/plain', id); } catch(err){} });
    card.addEventListener('dragend', () => { card.classList.remove('dragging'); window._ctDrag = null; });
  });
  /* a column takes a dropped card, and where it lands inside the column
     becomes its order — dropping is both "what stage" and "how urgent" */
  $$('[data-ctcol]', root).forEach(col => {
    col.addEventListener('dragover', ev => { if(window._ctDrag){ ev.preventDefault(); col.classList.add('over'); } });
    col.addEventListener('dragleave', () => col.classList.remove('over'));
    col.addEventListener('drop', ev => { ev.preventDefault(); col.classList.remove('over');
      const e = contentPiece(window._ctDrag); window._ctDrag = null; if(!e) return;
      const before = ev.target.closest('[data-ctcard]');
      pieceSetStage(e, col.dataset.ctcol);
      if(before && before.dataset.ctcard !== e.id){
        const other = contentPiece(before.dataset.ctcard);
        if(other) e.extra.content.order = (other.extra.content.order || 0) - 1;
      } else e.extra.content.order = Date.now();
      saveNow(); sound('click'); rerenderContentBody(); });
  });

  if(typeof bindContentCalendar === 'function') bindContentCalendar(root);
  if(typeof bindContentLibrary === 'function') bindContentLibrary(root);
}

function openPieceMenu(id){
  const e = contentPiece(id); if(!e) return;
  const m = openModal(`<h2>${esc(e.title || 'Untitled')}</h2><div class="stack" style="gap:6px">
    <button class="choice" data-pm="detail"><span class="ico">▤</span><span><b>Open its details</b></span></button>
    <button class="choice" data-pm="write"><span class="ico">✎</span><span><b>Open in the Writing Studio</b></span></button>
    <button class="choice" data-pm="stage"><span class="ico">◇</span><span><b>Move it to…</b></span></button>
    <button class="choice" data-pm="pin"><span class="ico">◆</span><span><b>${e.extra.content.pinned ? 'Unpin' : 'Pin to the top'}</b></span></button>
    <button class="choice" data-pm="dup"><span class="ico">⧉</span><span><b>Duplicate</b></span></button>
    <button class="choice" data-pm="arch"><span class="ico">▢</span><span><b>Archive</b></span></button>
    <button class="choice" data-pm="del"><span class="ico">×</span><span><b>Delete</b></span></button></div>`, 'narrow');
  m.querySelectorAll('[data-pm]').forEach(b => b.onclick = () => { const k = b.dataset.pm; m.remove();
    if(k === 'detail') return openPieceDetail(id);
    if(k === 'write')  return navigate('#/writing/' + id);
    if(k === 'stage')  return planChoose('Move it to', CONTENT_STAGES.map(s => [s.id, `${s.icon}  ${s.name}`]),
      v => { pieceSetStage(e, v); sound('click'); rerender(); });
    if(k === 'pin'){ e.extra.content.pinned = !e.extra.content.pinned; }
    if(k === 'arch') pieceSetStage(e, 'archived');
    if(k === 'dup'){ const c = e.extra.content;
      contentNewPiece({title:(e.title || 'Untitled') + ' (again)', stage:c.stage, type:c.type, dest:c.dest, themes:c.themes, raw:c.raw}); }
    if(k === 'del') return requestDelete({label:e.title || 'this piece', after:() => rerender(),
      remove: () => spliceOut(S.entries, x => x.id === e.id)});
    saveNow(); sound('click'); rerender(); });
}

/* ---------- keyboard ---------- */
const CONTENT_KEYS = {i:'catch', w:'write', 1:'pipeline', 2:'calendar', 3:'library', 4:'stats'};
document.addEventListener('keydown', ev => {
  if(parseHash().name !== 'content') return;
  if(ev.metaKey || ev.ctrlKey || ev.altKey){
    if((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k' && !planTypingInto(ev.target)){
      ev.preventDefault(); $('#ctSearch')?.focus(); }
    return;
  }
  if(planTypingInto(ev.target)) return;
  if($('#panel') && ev.key !== 'Escape') return;
  const act = CONTENT_KEYS[ev.key.toLowerCase()]; if(!act) return;
  ev.preventDefault();
  if(act === 'catch') return openContentCapture();
  if(act === 'write'){
    const first = document.querySelector('[data-ctcard]');
    const id = contentState().prefs.lastPiece || first?.dataset.ctcard;
    if(id && contentPiece(id)) navigate('#/writing/' + id);
    return;
  }
  contentSetView(act);
}, true);
