/* ============================================================
   CONTENT × THE WRITING STUDIO

   The two rooms are already one record — a piece IS a project — so
   nothing here has to synchronise anything. What is left is only the
   traffic between them: a bar at the top of the desk saying where in
   the pipeline this draft sits, two more shelves in the research
   drawer, and a way for a fragment on the compost heap to become a
   seed without being retyped.
   ============================================================ */

/* ---------- the context bar ---------- */
function wsPieceBarHTML(proj){
  if(typeof pieceContent !== 'function') return '';
  const c = pieceContent(proj), st = contentStage(c.stage);
  const w = pieceWords(proj), t = pieceTarget(proj);
  return `<div class="ws-piecebar mono" style="--c:${st.color}">
    <span class="wpb-ico">✍</span>
    <b>${esc(proj.title || 'Untitled')}</b>
    <span class="wpb-sep">·</span><span>${esc(contentTypeName(c.type))}</span>
    <span class="wpb-sep">·</span>
    <button class="wpb-stage" id="wpbStage" title="move it along the pipeline without leaving the desk">${st.icon} ${esc(st.name)} ▾</button>
    <span class="wpb-sep">·</span>
    <span class="wpb-words">${w.toLocaleString()}${t ? ` / ${t.toLocaleString()}` : ''} words
      ${t ? `<i class="wpb-bar"><i style="width:${Math.min(100, Math.round(w / t * 100))}%"></i></i>` : ''}</span>
    <span class="wpb-sep">·</span><span>${esc(contentDestName(c.dest))}</span>
    ${c.scheduled ? `<span class="wpb-sep">·</span><span class="${pieceOverdue(proj) ? 'late' : ''}">◷ ${esc(fmtDate(c.scheduled, 'short'))}</span>` : ''}
    <a class="wpb-back" href="#/content" id="wpbBack">Back to Content →</a>
  </div>`;
}
function bindWsPieceBar(root, proj){
  const stage = root.querySelector('#wpbStage');
  if(stage) stage.onclick = () => planChoose('Where is it?',
    CONTENT_STAGES.map(s => [s.id, `${s.icon}  ${s.name} — ${s.hint}`]),
    v => { pieceSetStage(proj, v); sound('click'); rerender(); });
  const back = root.querySelector('#wpbBack');
  if(back) back.onclick = ev => { ev.preventDefault(); navigate('#/content');
    setTimeout(() => openPieceDetail(proj.id), 320); };
}

/* ---------- two more shelves in the research drawer ----------
   The existing drawer already gathers by tag and dimension. These two
   gather by theme instead, which is the vocabulary a piece thinks in. */
function wsThemeMatches(proj){
  if(typeof pieceVaultTerms !== 'function') return [];
  return pieceVaultTerms(proj);
}
function wsVaultSectionHTML(proj){
  if(typeof vaultRanked !== 'function') return '';
  const c = pieceContent(proj);
  const pinned = new Set((c.quotes || []).map(q => q.text));
  const rows = vaultRanked(proj).filter(r => r.score > 0).slice(0, 12);
  if(!rows.length && !c.themes.length) return '';
  return `<details style="margin-top:10px"><summary><span class="mono">from the vault (${rows.length})</span></summary><div class="body">
    ${rows.length ? rows.map(({x}) => `<div class="drawer-item vault-item${pinned.has(x.text) ? ' pinned' : ''}">
      <div class="meta">${esc(x.bookTitle)}${x.author ? ' · ' + esc(x.author) : ''}${x.pageOrChapter ? ' · ' + esc(x.pageOrChapter) : ''}</div>
      <div class="${x.paraphrase ? 'vault-para' : 'vault-quote'}">${x.paraphrase ? esc(x.text) : '“' + esc(x.text) + '”'}</div>
      ${x.paraphrase ? '<div class="vault-flag mono">the idea, in summary — not a quotation</div>' : ''}
      <div class="row"><button class="tbtn" data-vpull="${x.id}">pull into the draft →</button>
        <button class="tbtn" data-vpin="${x.id}">${pinned.has(x.text) ? 'pinned' : 'pin to the piece'}</button></div>
    </div>`).join('')
      : '<div class="faint" style="font-size:.78rem;padding:4px 0">No passage in the vault matches this piece’s themes yet.</div>'}
  </div></details>`;
}
/* A passage pulled into a draft carries its citation. A paraphrase says
   what it is inside the draft too, so a summary can never be pasted in
   and later mistaken for something the author wrote. */
function vaultBlockquote(x){
  const cite = [x.bookTitle, x.author, x.pageOrChapter].filter(Boolean).join(', ');
  return x.paraphrase
    ? `\n\n> ${x.text}\n> — paraphrase of ${cite}\n\n`
    : `\n\n> ${x.text}\n> — ${cite}\n\n`;
}
function wsLibraryThemeHTML(proj){
  const c = pieceContent(proj);
  const terms = wsThemeMatches(proj);
  if(!terms.length) return '';
  const rank = {lives:0, changed:1, stayed:2, passed:3};
  const hits = (S.entries || []).filter(e => e.type === 'media').map(e => {
    const x = e.extra || {};
    const hay = `${e.title} ${x.creator || ''} ${(e.tags || []).join(' ')} ${x.installed || ''} ${x.oneLineCapture || ''}`.toLowerCase();
    return {e, x, score: terms.reduce((a, t) => a + (hay.includes(t) ? 1 : 0), 0)};
  }).filter(h => h.score > 0)
    .sort((a, b) => (rank[a.x.resonanceLevel] ?? 9) - (rank[b.x.resonanceLevel] ?? 9) || b.score - a.score)
    .slice(0, 8);
  if(!hits.length) return '';
  return `<details style="margin-top:10px"><summary><span class="mono">from your Library, by theme (${hits.length})</span></summary><div class="body">
    ${hits.map(({e, x}) => { const r = typeof resonanceMeta === 'function' ? resonanceMeta(x.resonanceLevel) : null;
      return `<div class="drawer-item">
      <div class="meta">${esc(e.title)}${x.creator ? ' · ' + esc(x.creator) : ''}${r ? ` · ${esc(r[1])}` : ''}</div>
      ${x.installed ? `<div class="snippet">${esc(x.installed.slice(0, 160))}</div>
        <div class="row"><button class="tbtn" data-lpull="${e.id}">quote what it installed →</button></div>` : ''}
      ${(x.quotes || []).filter(q => q.text).slice(0, 3).map(q => `<div class="lib-q">
        <div class="vault-quote">“${esc(q.text.slice(0, 180))}”</div>
        ${q.why ? `<div class="lib-why">${esc(q.why)}</div>` : ''}
        <div class="row"><button class="tbtn" data-lqpull="${e.id}:${q.id}">pull into the draft →</button>
          <button class="tbtn" data-lqpin="${e.id}:${q.id}">pin to the piece</button></div></div>`).join('')}
    </div>`; }).join('')}
  </div></details>`;
}
function bindWsContentDrawer(root, proj){
  const ta = root.querySelector('#wBody');
  const insert = text => { if(!ta) return toast('Open a document first.');
    const pos = ta.selectionStart ?? ta.value.length;
    ta.setRangeText(text, pos, ta.selectionEnd ?? pos, 'end');
    ta.dispatchEvent(new Event('input')); ta.focus(); sound('click'); };
  const vq = id => contentVault().quotes.find(q => q.id === id);
  $$('[data-vpull]', root).forEach(b => b.onclick = () => { const x = vq(b.dataset.vpull); if(x) insert(vaultBlockquote(x)); });
  $$('[data-vpin]', root).forEach(b => b.onclick = () => { const x = vq(b.dataset.vpin); if(!x) return;
    const c = pieceContent(proj);
    if(c.quotes.some(q => q.text === x.text)) return toast('Already pinned.');
    c.quotes.push({id:uid(), text:x.text, source:x.bookTitle, author:x.author, pageOrLocation:x.pageOrChapter,
      whyCaught:'', sourceType:'book_vault_quote', sourceId:x.id, paraphrase:!!x.paraphrase, addedAt:new Date().toISOString()});
    saveNow(); sound('success'); toast('Pinned to the piece.'); rerender(); });
  $$('[data-lpull]', root).forEach(b => b.onclick = () => { const e = byId(S.entries, b.dataset.lpull); if(!e) return;
    insert(`\n\n> ${e.extra.installed}\n> — what ${e.title} left behind\n\n`);
    pieceLink(proj, 'library_media', e.id, e.title); saveNow(); });
  const lq = key => { const [mid, qid] = key.split(':'); const e = byId(S.entries, mid);
    return e ? {e, q:(e.extra?.quotes || []).find(x => x.id === qid)} : null; };
  $$('[data-lqpull]', root).forEach(b => b.onclick = () => { const h = lq(b.dataset.lqpull); if(!h?.q) return;
    insert(`\n\n> ${h.q.text}\n> — ${[h.e.title, h.e.extra?.creator, h.q.where].filter(Boolean).join(', ')}\n\n`);
    pieceLink(proj, 'library_media', h.e.id, h.e.title); saveNow(); });
  $$('[data-lqpin]', root).forEach(b => b.onclick = () => { const h = lq(b.dataset.lqpin); if(!h?.q) return;
    const c = pieceContent(proj);
    if(c.quotes.some(q => q.text === h.q.text)) return toast('Already pinned.');
    c.quotes.push({id:uid(), text:h.q.text, source:h.e.title, author:h.e.extra?.creator || '',
      pageOrLocation:h.q.where || '', whyCaught:h.q.why || '', sourceType:'library_quote', sourceId:h.e.id,
      paraphrase:false, addedAt:new Date().toISOString()});
    pieceLink(proj, 'library_media', h.e.id, h.e.title);
    saveNow(); sound('success'); toast('Pinned to the piece.'); rerender(); });
}

/* ---------- the compost heap, both ways ----------
   A fragment on the heap and a seed in the Idea column are the same
   thought at two temperatures. Either can become the other. */
function compostPromoteHTML(f){
  return `<button class="tbtn" data-cpromote="${f.id}" title="make this a content seed">→ Content</button>`;
}
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-cpromote]'); if(!b) return;
  ev.preventDefault(); ev.stopPropagation();
  const f = byId(S.compost, b.dataset.cpromote); if(!f) return;
  openContentCapture({raw:f.text, spark:'Promoted from the compost heap', trailType:'compost'});
}, true);
