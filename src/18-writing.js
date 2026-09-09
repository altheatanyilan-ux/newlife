/* ============================================================
   THE WRITING STUDIO (formerly Writing) — a desk, a research
   drawer that reaches into every other room, and a place for
   the fragments that don't have a home yet.
   Pieces are entries of type `writing`; fragments live in
   S.compost, independent of any project until assigned.
   ============================================================ */
const WRITING_KINDS = ['Essay','Article','Short Story','Poetry','Newsletter','Script','Speech','Book Chapter','Journal Piece','Pitch','Other'];
const WRITING_STATUSES = ['Outlining','Drafting','Polished','Published'];
const PUB_STATUSES = ['drafted','submitted','accepted','rejected','published','withdrawn'];
function writings(){ return S.entries.filter(e => e.type === 'writing'); }
function wordCount(s){ const t = (s||'').trim(); return t ? t.split(/\s+/).length : 0; }
function migrateWriting(){
  /* four columns came out; a piece sitting in one of them is folded into the
     nearest column that is still standing rather than losing its place. */
  const STATUS_MAP = {drafting:'Drafting', resting:'Outlining', revising:'Drafting', finished:'Polished',
                      Seed:'Outlining', Gathering:'Outlining', Revising:'Drafting', Shelved:'Outlining'};
  writings().forEach(e => {
    const x = e.extra = e.extra || {};
    if(!WRITING_KINDS.includes(x.kind)) x.kind = 'Essay';
    if(!WRITING_STATUSES.includes(x.status)) x.status = STATUS_MAP[x.status] || 'Outlining';
    if(x.premise === undefined) x.premise = x.intention || '';
    x.target = x.target || {}; if(x.target.dest === undefined) x.target.dest = ''; if(x.target.wordTarget === undefined) x.target.wordTarget = x.wordTarget||0; if(x.target.deadline === undefined) x.target.deadline = '';
    x.pinned = Array.isArray(x.pinned) ? x.pinned : [];
    x.outline = Array.isArray(x.outline) ? x.outline : [];
    x.beats = Array.isArray(x.beats) ? x.beats : [];
    x.comments = Array.isArray(x.comments) ? x.comments : [];
    x.versions = Array.isArray(x.versions) ? x.versions : [];
    x.scratchpad = x.scratchpad || '';
    x.publication = x.publication || {status:'drafted', where:'', when:'', notes:''};
    if(x.sourceTags && x.sourceTags.length) e.tags = normTags([...(e.tags||[]), ...x.sourceTags]);
    e.links = e.links || {}; ['stages','substages','threads','values','visions','skills','projects'].forEach(k => { if(!Array.isArray(e.links[k])) e.links[k] = []; });
  });
  S.compost = Array.isArray(S.compost) ? S.compost : [];
  S.compost.forEach(f => { f.tags = f.tags||[]; if(f.projectId === undefined) f.projectId = null; });
}
function newWriting(){
  const e = {id:uid(), type:'writing', title:'', body:'', occurredAt:today(), createdAt:new Date().toISOString(), media:[],
    links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[]}, people:[], places:[], emotions:[], tags:[], confidence:'',
    extra:{kind:'Essay', status:'Outlining', premise:'', target:{dest:'',wordTarget:0,deadline:''}, pinned:[], outline:[], beats:[], comments:[], versions:[], scratchpad:'', publication:{status:'drafted',where:'',when:'',notes:''}}};
  S.entries.push(e); saveNow(); return e;
}

/* ---------- the Compost Heap — a frictionless parking lot for raw material ---------- */
function addCompost(text, tags=[]){ if(!text.trim()) return; S.compost.unshift({id:uid(), text:text.trim(), date:today(), tags:normTags(tags), projectId:null}); saveNow(); }
function renderCompostPage(root){
  registerPageEntry({pageName:'The Writing Studio', addLabel:'Catch a fragment', defaultEntryType:'compost', prefilledFields:{}, options:[{icon:'🌱', label:'Catch a fragment', desc:'A sentence, an image, an overheard line.', run:()=>{ const t = prompt('What just occurred to you?'); if(t) addCompost(t); rerender(); }}]});
  const q = (S._compQ||'').toLowerCase();
  const list = S.compost.filter(f => !q || f.text.toLowerCase().includes(q) || (f.tags||[]).some(t=>t.includes(q)));
  root.innerHTML = `<div class="page">
    <div class="row between rv" style="margin-bottom:16px"><a class="btn sm ghost" href="#/writing">‹ the desk</a><h1 style="margin:0">The Compost Heap</h1><span></span></div>
    
    <div class="row rv" style="gap:8px;margin-bottom:16px"><input class="inp" id="compIn" placeholder="Catch it before it's gone…" style="flex:1"><button class="btn primary" id="compAdd">Catch it</button></div>
    <input class="inp rv" id="compQ" placeholder="search fragments" value="${esc(S._compQ||'')}" style="max-width:320px;margin-bottom:16px">
    <div class="compost-grid rv">${list.length ? list.map(f => `<div class="compost-frag" data-cid="${f.id}"><div>${esc(f.text)}</div><div class="row between" style="margin-top:8px"><span class="mono faint">${fmtDate(f.date,'short')}${f.projectId?` · ${esc(byId(S.entries,f.projectId)?.title||'assigned')}`:''}</span><span class="row" style="gap:4px"><select class="sel" style="width:auto;padding:2px 6px;font-size:.68rem" data-cassign="${f.id}"><option value="">unassigned</option>${writings().map(p=>`<option value="${p.id}" ${f.projectId===p.id?'selected':''}>${esc(p.title||'Untitled')}</option>`).join('')}</select><button class="del-x inline" data-cdel="${f.id}">×</button></span></div></div>`).join('') : '<div class="empty">Nothing composting yet.</div>'}</div>
  </div>`;
  $('#compAdd').onclick = () => { addCompost($('#compIn').value); rerender(); };
  $('#compIn').onkeydown = e => { if(e.key==='Enter'){ addCompost($('#compIn').value); rerender(); } };
  $('#compQ').oninput = debounce(e => { S._compQ = e.target.value; rerender(); }, 300);
  root.querySelectorAll('[data-cassign]').forEach(s => s.onchange = () => { byId(S.compost,s.dataset.cassign).projectId = s.value||null; saveNow(); });
  root.querySelectorAll('[data-cdel]').forEach(b => b.onclick = () => { const f = byId(S.compost,b.dataset.cdel); requestDelete({label:'Fragment', node:b.closest('.compost-frag'), remove:()=>spliceOut(S.compost,x=>x.id===f.id)}); });
}

/* ---------- the Snippet Collector — ambient capture from anywhere in the site ----------
   Called from the ✂ button that entryCard() and the Library's media panel expose on
   every entry and quote. Pins a reference into a project's research drawer, or parks
   it in the Compost Heap unassigned. */
function saveSnippetModal(kind, sourceId, opts={}){
  const projects = writings();
  const m = openModal(`<h2>Save to Writing</h2><div class="stack">
    <select class="sel" id="ssProj"><option value="">Unassigned — the Compost Heap</option>${projects.map(p=>`<option value="${p.id}">${esc(p.title||'Untitled piece')}</option>`).join('')}<option value="__new">＋ new project</option></select>
    <input class="inp" id="ssNote" placeholder="optional note — e.g. “use as the opening anecdote”">
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="ssSave">Save</button></div></div>`,'narrow');
  m.querySelector('#ssSave').onclick = () => {
    const note = m.querySelector('#ssNote').value.trim(); let projId = m.querySelector('#ssProj').value;
    if(projId === '__new'){ const p = newWriting(); projId = p.id; }
    if(projId){ const p = byId(S.entries, projId); p.extra.pinned = p.extra.pinned||[]; if(!p.extra.pinned.some(pn=>pn.kind===kind && pn.sourceId===sourceId)) p.extra.pinned.push({id:uid(), kind, sourceId, note, addedAt:today()}); saveNow(); m.remove(); sound('success'); toast('Pinned to the research drawer.', 4000, {label:'open', fn:()=>navigate('#/writing/'+projId)}); }
    else { const src = kind==='entry' ? byId(S.entries, sourceId) : null; S.compost.unshift({id:uid(), text: (src ? (src.title||src.body||'') : opts.text||'').slice(0,400), date:today(), tags:[], projectId:null, sourceKind:kind, sourceId}); saveNow(); m.remove(); sound('success'); toast('Saved to the Compost Heap.'); }
  };
}
document.addEventListener('click', e => { const b = e.target.closest('[data-snip]'); if(b){ e.stopPropagation(); saveSnippetModal('entry', b.dataset.snip); } });

/* ---------- Research Drawer: pull material from anywhere, by tag/dimension or search ---------- */
function researchPool(proj){
  const tags = entryTags(proj); const dims = proj.links;
  const overlaps = (e) => { if(e.id === proj.id) return false;
    if(tags.length && entryTags(e).some(t=>tags.includes(t))) return true;
    for(const k of ['values','threads','visions','skills','projects']){ const a = (dims[k]||[]).map(v=>typeof v==='string'?v:v.id); if(!a.length) continue; const b = (e.links?.[k]||[]).map(v=>typeof v==='string'?v:v.id); if(a.some(id=>b.includes(id))) return true; }
    return false; };
  const matched = sortEntries(S.entries.filter(overlaps));
  /* The Library is where reflection about what you read and watch already
     lives, so it belongs in the drawer as its own shelf — and the quotes kept
     inside a media entry are the part you actually pull into an essay. */
  const media = matched.filter(e => e.type === 'media');
  const entries = matched.filter(e => e.type !== 'media');
  const quotes = [];
  media.forEach(m => (m.extra?.quotes || []).forEach(q => { if(q.text) quotes.push({mediaId:m.id, media:m, q}); }));
  const compost = S.compost.filter(f => (f.tags||[]).some(t=>tags.includes(t)) || f.projectId === proj.id);
  return {entries, media, quotes, compost};
}
function researchSearch(q){
  const s = q.trim().toLowerCase(); if(!s) return {entries:[], compost:[], quotes:[]};
  const entries = sortEntries(S.entries.filter(e => `${e.title} ${e.body} ${e.extra?.oneLineCapture||''} ${e.extra?.creator||''}`.toLowerCase().includes(s) || entryTags(e).some(t=>t.includes(s)))).slice(0,40);
  const compost = S.compost.filter(f => f.text.toLowerCase().includes(s)).slice(0,20);
  const quotes = [];
  S.entries.filter(e => e.type === 'media').forEach(m => (m.extra?.quotes||[]).forEach(qq => {
    if(qq.text && `${qq.text} ${qq.why||''}`.toLowerCase().includes(s)) quotes.push({mediaId:m.id, q:qq}); }));
  return {entries, compost, quotes: quotes.slice(0,20)};
}
function pinnedMeta(pn){
  if(pn.kind === 'raw') return {title:'Raw snippet', body:pn.text||'', dateLabel:fmtDate(pn.addedAt,'short'), go:null};
  if(pn.kind === 'compost'){ const f = byId(S.compost, pn.sourceId); return f ? {title:'Compost fragment', body:f.text, dateLabel:fmtDate(f.date,'short'), go:null} : null; }
  if(pn.kind === 'quote'){
    const [mid, qid] = String(pn.sourceId).split(':');
    const m = byId(S.entries, mid); if(!m) return null;
    const q = (m.extra?.quotes || []).find(x => x.id === qid); if(!q) return null;
    const who = m.extra?.creator ? ` — ${m.extra.creator}` : '';
    return {title: m.title, body: `“${q.text}”`, dateLabel: q.where || fmtDate(m.occurredAt,'short'),
      typeLabel: `${esc(m.title)}${who}`, go: '#/commonplace/' + m.id};
  }
  const e = byId(S.entries, pn.sourceId); if(!e) return null;
  if(e.type === 'media'){
    const x = e.extra || {};
    const body = [x.oneLineCapture, x.installed].filter(Boolean).join(' · ') || e.body || '';
    const kindLabel = (typeof MEDIA_KINDS !== 'undefined' && MEDIA_KINDS[x.kind]) ? MEDIA_KINDS[x.kind][1] : 'Media';
    return {title: e.title, body, dateLabel: fmtDate(e.occurredAt,'short'),
      typeLabel: `${kindLabel}${x.creator ? ' · ' + x.creator : ''}`, go: '#/commonplace/' + e.id};
  }
  return {title: e.title || typeName(e.type), body: e.body||'', dateLabel: fmtDate(e.occurredAt,'short'), typeLabel: typeName(e.type), go: e.type==='writing' ? '#/writing/'+e.id : null};
}
function attribution(pn){
  const m = pinnedMeta(pn); if(!m) return '';
  return `[From: ${m.typeLabel||m.title}, ${m.dateLabel}]`;
}
function drawerItemHTML(kind, sourceId, {pinnedId=null, note=''}={}){
  const meta = pinnedMeta({kind, sourceId});
  if(!meta) return '';
  return `<div class="drawer-item" draggable="true" data-dkind="${kind}" data-dsrc="${sourceId}" ${pinnedId?`data-pinned="${pinnedId}"`:''}>
    <div class="meta">${esc(meta.typeLabel||'fragment')} · ${esc(meta.dateLabel)}</div>
    <div class="snippet">${esc((meta.body||meta.title||'').slice(0,140))}${(meta.body||'').length>140?'…':''}</div>
    ${note?`<div class="faint" style="font-size:.72rem;margin-top:3px">note: ${esc(note)}</div>`:''}
    <div class="row">${pinnedId ? `<button class="tbtn" data-insert="${pinnedId}">insert →</button><button class="tbtn" data-unpin="${pinnedId}">unpin</button>` : `<button class="tbtn" data-pin="${kind}:${sourceId}">pin</button>`}</div>
  </div>`;
}
function researchDrawerHTML(proj){
  const {entries, media, quotes, compost} = researchPool(proj);
  const pinnedIds = new Set(proj.extra.pinned.map(p=>p.kind+':'+p.sourceId));
  const pulled = entries.filter(e => !pinnedIds.has('entry:'+e.id)).slice(0,20);
  const pulledCompost = compost.filter(f => !pinnedIds.has('compost:'+f.id));
  const pinnedTags = new Set(); proj.extra.pinned.forEach(pn => { const e = pn.kind==='entry'?byId(S.entries,pn.sourceId):null; if(e) entryTags(e).forEach(t=>pinnedTags.add(t)); });
  const suggestions = pinnedTags.size ? sortEntries(S.entries.filter(e => e.id!==proj.id && !pinnedIds.has('entry:'+e.id) && entryTags(e).some(t=>pinnedTags.has(t)))).slice(0,5) : [];
  return `<div class="drawer" id="drawer">
    <div class="sc">Research Drawer</div>
    <input class="inp drawer-search" id="drawerSearch" placeholder="search everything — keyword, #tag, type">
    <div id="drawerSearchResults"></div>
    <details open><summary><span class="mono">pinned to this project (${proj.extra.pinned.length})</span></summary><div class="body" id="drawerPinned">${proj.extra.pinned.length ? proj.extra.pinned.map(pn => drawerItemHTML(pn.kind, pn.sourceId, {pinnedId:pn.id, note:pn.note})).join('') : '<div class="faint" style="font-size:.78rem;padding:4px 0">Nothing pinned yet. Pull from your tags below, or search above.</div>'}</div></details>
    <details open style="margin-top:10px"><summary><span class="mono">from your tags &amp; dimensions (${pulled.length+pulledCompost.length})</span></summary><div class="body">${pulled.map(e=>drawerItemHTML('entry',e.id)).join('') + pulledCompost.map(f=>drawerItemHTML('compost',f.id)).join('') || '<div class="faint" style="font-size:.78rem;padding:4px 0">Link this piece to a value, thread, vision, skill or project, and everything tagged to it shows up here.</div>'}</div></details>
    ${(media.length || quotes.length) ? `<details open style="margin-top:10px"><summary><span class="mono">from the Library (${media.length} · ${quotes.length} quote${quotes.length===1?'':'s'})</span></summary><div class="body">
      ${media.filter(m=>!pinnedIds.has('entry:'+m.id)).map(m=>drawerItemHTML('entry',m.id)).join('')}
      ${quotes.filter(({mediaId,q})=>!pinnedIds.has('quote:'+mediaId+':'+q.id)).slice(0,24).map(({mediaId,q})=>drawerItemHTML('quote', mediaId+':'+q.id)).join('')}
      ${!media.length && !quotes.length ? '<div class="faint" style="font-size:.78rem;padding:4px 0">Nothing from the Library shares a tag or dimension with this piece yet.</div>' : ''}
    </div></details>` : ''}
    ${suggestions.length ? `<details style="margin-top:10px"><summary><span class="mono">you might not have considered (${suggestions.length})</span></summary><div class="body">${suggestions.map(e=>drawerItemHTML('entry',e.id)).join('')}</div></details>` : ''}
  </div>`;
}
function bindResearchDrawer(root, proj, redraw){
  const drawer = root.querySelector('#drawer'); if(!drawer) return;
  const ta = root.querySelector('#wBody');
  const insertText = (text) => { if(!ta) return; const pos = ta.selectionStart ?? ta.value.length; ta.setRangeText(text, pos, ta.selectionEnd ?? pos, 'end'); ta.dispatchEvent(new Event('input')); ta.focus(); };
  drawer.querySelector('#drawerSearch').oninput = debounce(e => {
    const {entries, compost, quotes} = researchSearch(e.target.value);
    const box = drawer.querySelector('#drawerSearchResults');
    box.innerHTML = (entries.length||compost.length||quotes.length) ? `<div class="faint mono" style="font-size:.68rem;margin:8px 0 4px">search results</div>${entries.map(x=>drawerItemHTML('entry',x.id)).join('')}${quotes.map(({mediaId,q})=>drawerItemHTML('quote', mediaId+':'+q.id)).join('')}${compost.map(x=>drawerItemHTML('compost',x.id)).join('')}` : (e.target.value.trim() ? '<div class="faint" style="font-size:.78rem;padding:4px 0">Nothing matches.</div>' : '');
    bind(box);
  }, 300);
  const bind = (scope) => {
    scope.querySelectorAll('[data-pin]').forEach(b => b.onclick = () => { const raw = b.dataset.pin, c = raw.indexOf(':');
      proj.extra.pinned.push({id:uid(), kind:raw.slice(0,c), sourceId:raw.slice(c+1), note:'', addedAt:today()}); saveNow(); preserveScroll(['#drawer'], redraw); });
    scope.querySelectorAll('[data-unpin]').forEach(b => b.onclick = () => { proj.extra.pinned = proj.extra.pinned.filter(p=>p.id!==b.dataset.unpin); saveNow(); preserveScroll(['#drawer'], redraw); });
    scope.querySelectorAll('[data-insert]').forEach(b => b.onclick = () => { const pn = byId(proj.extra.pinned, b.dataset.insert); insertText(`\n\n> ${(pinnedMeta(pn)?.body||'').trim().replace(/\n/g,'\n> ')}\n> ${attribution(pn)}\n\n`); });
    scope.querySelectorAll('[data-dkind]').forEach(it => { it.addEventListener('dragstart', ev => { ev.dataTransfer.setData('text/plain', pinnedMeta({kind:it.dataset.dkind, sourceId:it.dataset.dsrc})?.body || ''); }); });
  };
  bind(drawer);
  if(ta) ta.addEventListener('drop', ev => { ev.preventDefault(); const text = ev.dataTransfer.getData('text/plain'); if(!text) return; const pos = ta.selectionStart; ta.setRangeText(`\n\n> ${text}\n\n`, pos, pos, 'end'); ta.dispatchEvent(new Event('input')); });
}

/* ---------- Structure Board: Outline / Threads & Arguments / Connections ---------- */
function structureBoardHTML(proj){
  const tab = (S._wStructTab||{})[proj.id] || 'outline';
  return `<div class="structure-board" id="structBoard">
    <div class="sc">Structure Board</div>
    <div class="struct-tabs">${[['outline','Outline'],['threads','Threads & Arguments'],['connections','Connections']].map(([k,l])=>`<button class="${tab===k?'active':''}" data-stab="${k}">${l}</button>`).join('')}</div>
    <div id="structBody">${tab==='outline' ? outlineTabHTML(proj) : tab==='threads' ? threadsTabHTML(proj) : connectionsTabHTML(proj)}</div>
  </div>`;
}
function outlineTabHTML(proj){
  const nodes = proj.extra.outline;
  return `<div id="outlineList">${nodes.map((n,i)=>`<div class="outline-node" draggable="true" data-onode="${n.id}"><div class="row between"><b class="serif" style="font-size:.92rem">${esc(n.heading||'Untitled section')}</b><button class="del-x inline" data-odel="${n.id}">×</button></div>${n.desc?`<div class="faint" style="font-size:.76rem;margin-top:2px">${esc(n.desc)}</div>`:''}${(n.linked||[]).length?`<div class="mono faint" style="margin-top:4px">${n.linked.length} source${n.linked.length===1?'':'s'} pinned here</div>`:'<div class="gap">this section has no source material yet</div>'}<button class="tbtn" data-ojump="${n.id}" style="margin-top:4px">jump to draft →</button></div>`).join('') || '<div class="empty">No sections yet.</div>'}</div>
    <button class="btn sm ghost" id="outlineAdd" style="margin-top:6px">＋ section</button>`;
}
function threadsTabHTML(proj){
  const beats = proj.extra.beats;
  return `<p class="faint" style="font-size:.76rem">The logic of the piece, before the prose. A sequence of claims or beats.</p>
    <div id="beatList">${beats.map((b)=>`<div class="beat-row" draggable="true" data-beat="${b.id}"><div class="row between"><span style="flex:1;font-size:.86rem">${esc(b.text||'a claim, a turn, a beat')}</span><button class="del-x inline" data-bdel="${b.id}">×</button></div>${(b.evidence||[]).length?`<div class="mono faint" style="margin-top:4px">${b.evidence.length} piece${b.evidence.length===1?'':'s'} of evidence</div>`:''}<button class="tbtn" data-bedit="${b.id}" style="margin-top:3px">edit</button></div>`).join('') || '<div class="empty">No beats yet.</div>'}</div>
    <button class="btn sm ghost" id="beatAdd" style="margin-top:6px">＋ beat</button>`;
}
function connectionsTabHTML(proj){
  const kinds = {}; proj.extra.pinned.forEach(pn => kinds[pn.kind] = (kinds[pn.kind]||0)+1);
  const dims = proj.links; const dimCounts = ['stages','threads','values','visions','skills','projects'].map(k=>[k,(dims[k]||[]).length]).filter(x=>x[1]);
  const siblings = writings().filter(w => w.id!==proj.id && (entryTags(w).some(t=>entryTags(proj).includes(t)) || ['values','threads','visions','skills','projects'].some(k => (dims[k]||[]).some(id0=>{const id=typeof id0==='string'?id0:id0.id; return (w.links[k]||[]).some(v=>(typeof v==='string'?v:v.id)===id);}))));
  return `<p style="font-size:.85rem">This piece pulls from ${dimCounts.map(([k,n])=>`${n} ${k}`).join(', ') || 'nothing linked yet'}, and has ${proj.extra.pinned.length} pinned reference${proj.extra.pinned.length===1?'':'s'}${Object.keys(kinds).length?` (${Object.entries(kinds).map(([k,n])=>`${n} ${k}`).join(', ')})`:''}.</p>
    <div class="field"><label>Linked dimensions</label>${linksEditorHTML(proj.links, {legend:false})}</div>
    ${siblings.length ? `<div class="field"><label>Other pieces sharing tags or dimensions</label><div class="deps">${siblings.map(w=>`<span class="chip click" data-go="#/writing/${w.id}">${esc(w.title||'Untitled')}</span>`).join('')}</div></div>` : ''}`;
}
function bindStructureBoard(root, proj, redraw){
  const box = root.querySelector('#structBoard'); if(!box) return;
  box.querySelectorAll('[data-stab]').forEach(b => b.onclick = () => { S._wStructTab = S._wStructTab||{}; S._wStructTab[proj.id] = b.dataset.stab; preserveScroll(['#structBoard'], redraw); });
  const ta = root.querySelector('#wBody');
  box.querySelectorAll('[data-odel]').forEach(b => b.onclick = () => { requestDelete({label:'Section', node:b.closest('.outline-node'), remove:()=>spliceOut(proj.extra.outline, x=>x.id===b.dataset.odel), after:()=>preserveScroll(['#structBoard'],redraw)}); });
  box.querySelector('#outlineAdd')?.addEventListener('click', () => { proj.extra.outline.push({id:uid(), heading:'', desc:'', linked:[]}); saveNow(); preserveScroll(['#structBoard'], redraw); const m = openModal(`<h2>New section</h2><input class="inp serif-lg" id="onH" placeholder="Section heading" autofocus><textarea class="ta" id="onD" placeholder="what does this section do?"></textarea><div class="row" style="justify-content:flex-end"><button class="btn primary" id="onSave">Save</button></div>`,'narrow'); m.querySelector('#onSave').onclick = () => { const n = proj.extra.outline[proj.extra.outline.length-1]; n.heading = m.querySelector('#onH').value.trim(); n.desc = m.querySelector('#onD').value.trim(); saveNow(); m.remove(); preserveScroll(['#structBoard'],redraw); }; });
  box.querySelectorAll('[data-ojump]').forEach(b => b.onclick = () => { const n = byId(proj.extra.outline, b.dataset.ojump); if(!ta) return; const marker = `# ${n.heading}`; let idx = ta.value.indexOf(marker); if(idx < 0){ ta.value += (ta.value.trim()?'\n\n':'') + marker + '\n\n'; idx = ta.value.indexOf(marker); proj.body = ta.value; saveNow(); ta.dispatchEvent(new Event('input')); } ta.focus(); ta.setSelectionRange(idx, idx+marker.length); ta.scrollTop = ta.scrollHeight * (idx/ta.value.length); });
  box.querySelectorAll('[data-bdel]').forEach(b => b.onclick = () => { requestDelete({label:'Beat', node:b.closest('.beat-row'), remove:()=>spliceOut(proj.extra.beats, x=>x.id===b.dataset.bdel), after:()=>preserveScroll(['#structBoard'],redraw)}); });
  box.querySelector('#beatAdd')?.addEventListener('click', () => { proj.extra.beats.push({id:uid(), text:'', evidence:[]}); saveNow(); preserveScroll(['#structBoard'], redraw); });
  box.querySelectorAll('[data-bedit]').forEach(b => b.onclick = () => { const beat = byId(proj.extra.beats, b.dataset.bedit); const pool = proj.extra.pinned; const m = openModal(`<h2>A beat</h2><textarea class="ta" id="btText" placeholder="The medals were never for me — they were proof for adults.">${esc(beat.text)}</textarea><div class="field"><label>Evidence from the research drawer</label><div class="deps">${pool.map(pn=>{ const meta = pinnedMeta(pn); return meta?`<span class="chip click ${(beat.evidence||[]).includes(pn.id)?'on':''}" data-ev="${pn.id}">${esc((meta.title||'').slice(0,30))}</span>`:''; }).join('') || '<span class="faint">Pin something to the drawer first.</span>'}</div></div><div class="row" style="justify-content:flex-end"><button class="btn primary" id="btSave">Save</button></div>`,'narrow');
    m.querySelectorAll('[data-ev]').forEach(c=>c.onclick=()=>{ beat.evidence = beat.evidence||[]; const id0 = c.dataset.ev; beat.evidence = beat.evidence.includes(id0) ? beat.evidence.filter(x=>x!==id0) : [...beat.evidence,id0]; c.classList.toggle('on'); });
    m.querySelector('#btSave').onclick = () => { beat.text = m.querySelector('#btText').value.trim(); saveNow(); m.remove(); preserveScroll(['#structBoard'],redraw); }; });
  bindLinksEditor(box, proj.links, () => preserveScroll(['#structBoard'], redraw));
  box.querySelectorAll('[data-go]').forEach(c => c.onclick = () => navigate(c.dataset.go));
  // drag-reorder for outline & beats
  const dragList = (containerSel, arr, itemSel, idAttr) => { const cont = box.querySelector(containerSel); if(!cont) return; let dragId = null;
    cont.querySelectorAll(itemSel).forEach(row => { row.addEventListener('dragstart', ev => { if(ev.target.closest('button')){ ev.preventDefault(); return; } dragId = row.dataset[idAttr]; row.classList.add('dragging'); }); row.addEventListener('dragend', () => row.classList.remove('dragging')); row.addEventListener('dragover', ev => ev.preventDefault()); row.addEventListener('drop', ev => { ev.preventDefault(); const toId = row.dataset[idAttr]; if(!dragId || dragId===toId) return; const from = arr.findIndex(x=>x.id===dragId), to = arr.findIndex(x=>x.id===toId); const [m] = arr.splice(from,1); arr.splice(to,0,m); saveNow(); preserveScroll(['#structBoard'],redraw); }); }); };
  dragList('#outlineList', proj.extra.outline, '[data-onode]', 'onode');
  dragList('#beatList', proj.extra.beats, '[data-beat]', 'beat');
}

/* ---------- Publishing pipeline & exports ---------- */
function exportWriting(proj, format){
  const body = proj.body || '';
  let out = body, ext = 'md', mime = 'text/markdown';
  if(format === 'plain'){ out = body.replace(/^#+\s*/gm,'').replace(/\*\*(.+?)\*\*/g,'$1').replace(/\*(.+?)\*/g,'$1').replace(/^>\s*/gm,''); ext='txt'; mime='text/plain'; }
  if(format === 'html'){ out = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(proj.title)}</title><style>body{font-family:Georgia,serif;max-width:640px;margin:60px auto;line-height:1.8;color:#2a241d}blockquote{border-left:3px solid #ccc;padding-left:1em;color:#665e52}</style></head><body><h1>${esc(proj.title)}</h1>${md(body)}</body></html>`; ext='html'; mime='text/html'; }
  const blob = new Blob([out], {type:mime}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${(proj.title||'untitled').replace(/[^\w-]+/g,'-')}.${ext}`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url), 2000);
}

/* ---------- The Desk — project board ---------- */
routes.writing = function(root, params){
  migrateWriting();
  registerPageEntry({pageName:'The Writing Studio', addLabel:'New project', defaultEntryType:'writing', prefilledFields:{}, options:[{icon:'✒', label:'New project', desc:'Name the premise; the drawer gathers the rest.', run:()=>{ const e = newWriting(); location.hash = '#/writing/'+e.id; }}]});
  if(params[0] === 'compost') return renderCompostPage(root);
  if(params[0]) return renderWritingDesk(root, params[0]);
  const view = S._wView || 'board';
  const ws = writings();
  const published = ws.filter(e => e.extra.publication?.status === 'published');
  root.innerHTML = `<div class="page">
    <div class="page-head"><h1>The Writing Studio</h1></div>
    <div class="row rv" style="gap:8px;margin-bottom:16px"><a class="btn sm ghost" href="#/writing/compost">🌱 Compost Heap (${S.compost.length})</a><div class="view-toggle">${[['board','▥ Board'],['list','☰ List']].map(([k,l])=>`<button class="${view===k?'on':''}" data-wv="${k}">${l}</button>`).join('')}</div></div>
    ${ws.length ? (view==='board' ? `<div class="wkanban rv" id="wkanban">${WRITING_STATUSES.map((st, si) => { const inCol = ws.filter(e=>e.extra.status===st);
        const hue = ['var(--muted)','var(--sage)','var(--ment)','var(--page-accent)','var(--gold)','var(--terra)','#7f916a','var(--faint)'][si] || 'var(--page-accent)';
        return `<div class="wkcol ${inCol.length?'':'quiet'}" data-wcol="${esc(st)}" style="--c:${hue}"><div class="wkcol-h"><span>${esc(st)}</span><span class="n">${inCol.length}</span></div><div class="wkcol-body">${inCol.map(e=>{ const n = wordCount(e.body); const tgt = e.extra.target?.wordTarget||0;
          return `<div class="wkcard" draggable="true" data-wdrag="${e.id}" data-wopen="${e.id}"><b class="serif" style="font-size:.92rem">${esc(e.title||'Untitled piece')}</b>${e.extra.premise?`<div class="premise">${esc(e.extra.premise)}</div>`:''}<div class="mono faint" style="margin-top:4px">${esc(e.extra.kind)} · ${n}w${tgt?` / ${tgt}`:''}</div>${tgt?`<div class="wk-bar"><i style="width:${clamp(Math.round(n/tgt*100),0,100)}%"></i></div>`:''}</div>`; }).join('')}<div class="wkcol-drop"></div></div>`; }).join('')}</div>`
      : `<div class="stack" style="gap:8px">${ws.map(e=>`<div class="card rv wproject-card" data-wopen="${e.id}"><div class="row between"><b class="serif">${esc(e.title||'Untitled piece')}</b><span class="status-pill">${esc(e.extra.status)}</span></div>${e.extra.premise?`<div class="premise">${esc(e.extra.premise)}</div>`:''}<div class="row between" style="margin-top:8px"><span class="mono">${esc(e.extra.kind)} · ${wordCount(e.body)} words${e.extra.target?.wordTarget?` of ${e.extra.target.wordTarget}`:''}</span><span class="mono">${fmtDate((e.createdAt||'').slice(0,10),'med')}</span></div></div>`).join('')}</div>`)
    : `<div class="empty rv">Nothing here yet. A piece starts with one sentence about what it's really about.</div>`}

    ${published.length ? `<section class="section rv"><span class="sc">Published archive</span>${published.map(e=>`<div class="pub-row"><span><b>${esc(e.title)}</b> <span class="mono">${esc(e.extra.kind)}</span></span><span>${e.extra.publication.where?`<a href="${esc(e.extra.publication.where)}" target="_blank" rel="noopener">↗ where it lives</a>`:''}</span></div>`).join('')}</section>` : ''}

    ${typeof wsHistoryHTML === 'function' ? wsHistoryHTML() : ''}

    <section class="section rv"><details><summary><span class="sc">Cross-pollination</span></summary><div class="body" style="padding-top:10px">${crossPollinationHTML()}</div></details></section>
  </div>`;
  $$('[data-wv]',root).forEach(b=>b.onclick=()=>{ S._wView = b.dataset.wv; rerender(); });
  $$('[data-wopen]',root).forEach(c => c.onclick = () => { location.hash = '#/writing/'+c.dataset.wopen; });
  // drag between kanban status columns
  let wdrag = null;
  $$('[data-wdrag]',root).forEach(card => { card.addEventListener('dragstart', ev => { wdrag = card.dataset.wdrag; card.classList.add('dragging'); }); card.addEventListener('dragend', () => card.classList.remove('dragging')); });
  $$('.wkcol',root).forEach(col => { col.addEventListener('dragover', ev => { ev.preventDefault(); col.classList.add('over'); }); col.addEventListener('dragleave', () => col.classList.remove('over')); col.addEventListener('drop', ev => { ev.preventDefault(); col.classList.remove('over'); const e = byId(S.entries, wdrag); if(!e) return; e.extra.status = col.dataset.wcol; saveNow(); rerender(); }); });
};
function crossPollinationHTML(){
  const ws = writings(); if(!ws.length) return '<div class="empty">Write a few pieces and the patterns show up here.</div>';
  const thTally = {}, valTally = {}, visTally = {}, mediaTally = {};
  ws.forEach(e => { (e.links.threads||[]).forEach(id=>thTally[id]=(thTally[id]||0)+1); (e.links.values||[]).forEach(x=>valTally[x.id]=(valTally[x.id]||0)+1); (e.links.visions||[]).forEach(id=>visTally[id]=(visTally[id]||0)+1);
    e.extra.pinned.forEach(pn => { if(pn.kind==='entry'){ const s = byId(S.entries, pn.sourceId); if(s && s.type==='media') mediaTally[s.id] = (mediaTally[s.id]||0)+1; } }); });
  const top = (obj,resolver,max=5) => Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,max).map(([id,n])=>{ const r = resolver(id); return r ? `<span class="chip on">${esc(r)} · ${n}</span>` : ''; }).join('') || '<span class="faint">nothing yet</span>';
  return `<div class="stack" style="gap:14px">
    <div><span class="k mono">threads you write about most</span><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px">${top(thTally, id=>byId(S.threads,id)?.name)}</div></div>
    <div><span class="k mono">values most present in your writing</span><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px">${top(valTally, id=>byId(S.values,id)?.name)}</div></div>
    <div><span class="k mono">media that generated the most writing</span><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px">${top(mediaTally, id=>byId(S.entries,id)?.title)}</div></div>
  </div>`;
}

/* ---------- Inside a project: the three-panel workspace ---------- */
let _wSession = {id:null, base:0};
/* Panel widths and which panels are showing, kept per person rather than per
   piece — it is a preference about how you like to work, not about the draft. */
function wsPanes(){
  const w = S.settings.wstudio = S.settings.wstudio || {};
  w.lw = clamp(+w.lw || 280, 150, 560);
  w.rw = clamp(+w.rw || 300, 150, 560);
  if(typeof w.drawer !== 'boolean') w.drawer = true;
  if(typeof w.board !== 'boolean') w.board = true;
  return w;
}
/* Drag either inner edge to set how much room the draft gets. The width is
   written to a CSS variable while dragging so the grid tracks the pointer,
   and only saved on release. */
function bindWsResize(root, ws){
  const layout = root.querySelector('#wsLayout'); if(!layout) return;
  [['drawer','l','lw'], ['structure-board','r','rw']].forEach(([cls, side, key]) => {
    const pane = layout.querySelector('.' + cls); if(!pane) return;
    pane.classList.add('ws-grip', side);
    let drag = null;
    pane.addEventListener('pointerdown', ev => {
      const r = pane.getBoundingClientRect();
      const onEdge = side === 'l' ? ev.clientX > r.right - 14 : ev.clientX < r.left + 14;
      if(!onEdge) return;
      ev.preventDefault();
      drag = {x: ev.clientX, w: r.width};
      try { pane.setPointerCapture(ev.pointerId); } catch(err){}
      document.body.classList.add('ws-resizing'); layout.classList.add('ws-resizing');
    });
    pane.addEventListener('pointermove', ev => {
      if(!drag) return;
      const dx = ev.clientX - drag.x;
      const w = clamp(drag.w + (side === 'l' ? dx : -dx), 150, 560);
      layout.style.setProperty(side === 'l' ? '--ws-l' : '--ws-r', Math.round(w) + 'px');
    });
    const end = () => { if(!drag) return; drag = null;
      document.body.classList.remove('ws-resizing'); layout.classList.remove('ws-resizing');
      ws[key] = parseInt(getComputedStyle(layout).getPropertyValue(side === 'l' ? '--ws-l' : '--ws-r'), 10) || ws[key];
      saveNow(); };
    pane.addEventListener('pointerup', end); pane.addEventListener('pointercancel', end);
    pane.addEventListener('dblclick', ev => {
      const r = pane.getBoundingClientRect();
      const onEdge = side === 'l' ? ev.clientX > r.right - 14 : ev.clientX < r.left + 14;
      if(!onEdge) return;
      ws[key] = side === 'l' ? 280 : 300; saveNow(); rerender();
    });
  });
}
function renderWritingDesk(root, id){
  const e = byId(S.entries, id); if(!e || e.type !== 'writing'){ navigate('#/writing'); return; }
  const x = e.extra = e.extra || {}; migrateWriting();
  if(_wSession.id !== id){ _wSession = {id, base: wordCount(e.body)}; }
  const n = wordCount(e.body); const focus = !!S._writeFocus; const ws = wsPanes();
  const redraw = () => rerender();
  root.innerHTML = `<div class="page ${focus?'wstudio-focus':''}">
    <div class="row between rv" style="margin-bottom:16px"><a class="btn sm ghost" href="#/writing">‹ the desk</a>
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <select class="sel" style="width:auto" id="wKind">${WRITING_KINDS.map(k=>`<option ${x.kind===k?'selected':''}>${k}</option>`).join('')}</select>
        <select class="sel" style="width:auto" id="wStatus">${WRITING_STATUSES.map(s=>`<option ${x.status===s?'selected':''}>${s}</option>`).join('')}</select>
        <span class="ws-panes">
          <button class="btn sm ghost ws-pane-btn ${ws.drawer?'on':''}" id="wPaneL" title="show or hide the research drawer">${ws.drawer?'◧':'◫'} drawer</button>
          <button class="btn sm ghost ws-pane-btn ${ws.board?'on':''}" id="wPaneR" title="show or hide the structure board">${ws.board?'◨':'◫'} board</button>
        </span>
        <button class="btn sm ${focus?'primary':'ghost'}" id="wFocus" title="hide both panels and give the page to the draft">${focus?'✓ focus':'focus'}</button>
        <div class="row" style="gap:4px"><button class="btn sm ghost" id="wsCompileBtn">⇩ compile</button><button class="btn sm ghost" id="expMd">↓ .md</button><button class="btn sm ghost" id="expTxt">↓ .txt</button><button class="btn sm ghost" id="expHtml">↓ .html</button></div>
      </div></div>

    <div class="writing-head rv">
      <h1 class="write-title">${ed(`entries.#${e.id}.title`,{ph:'Working title'})}</h1>
      <div class="field"><label>One-line premise — what is this really about?</label>${ed(`entries.#${e.id}.extra.premise`,{cls:'quote',ph:'Forces clarity before writing begins.'})}</div>
      <div class="row" style="gap:10px;flex-wrap:wrap">
        <div class="field"><label>Target — where is this going?</label>${ed(`entries.#${e.id}.extra.target.dest`,{ph:'blog / publication / portfolio / private'})}</div>
        <div class="field"><label>Word target</label><input class="inp mono" id="wTarget" type="number" min="0" step="100" value="${x.target.wordTarget||''}" style="width:8em"></div>
        <div class="field"><label>Deadline</label><input class="inp mono" id="wDeadline" type="date" value="${x.target.deadline||''}"></div>
      </div>
    </div>

    <div class="wstudio-layout${ws.drawer?'':' no-l'}${ws.board?'':' no-r'}" id="wsLayout" style="--ws-l:${ws.lw}px;--ws-r:${ws.rw}px;${typeof wsTypeVars === 'function' ? wsTypeVars() : ''}">
      <div class="ws-left${ws.drawer?'':' folded'}">
        <button class="ws-rail" id="wsRailL" title="show the binder and research drawer"><span class="chev">›</span><span class="lbl">binder</span></button>
        ${wsBinderHTML(e)}${researchDrawerHTML(e)}</div>
      <div class="ws-mid">
        ${wsViewBarHTML(e)}
        <div class="ws-stage rv" id="wsStage">${wsBodyHTML(e)}</div>
        <details style="margin-top:14px"><summary><span class="sc">Scratchpad</span></summary><div class="body"><textarea class="ta" id="wScratch" placeholder="Rough notes, fragments, sentence attempts.">${esc(x.scratchpad)}</textarea></div></details>
        <details style="margin-top:10px"><summary><span class="sc">Comments — private revision notes (${x.comments.length})</span></summary><div class="body">
          <button class="btn sm ghost" id="cAdd">+ comment on selection</button>
          <div class="stack" style="gap:6px;margin-top:8px">${x.comments.map(c=>`<div class="rail-item"><div class="quote" style="font-size:.82rem">“${esc(c.quote)}”</div><div style="margin-top:4px">${esc(c.note)}</div><button class="del-x inline" data-cdeln="${c.id}">×</button></div>`).join('') || '<div class="faint" style="font-size:.78rem">Highlight text in the draft, then add a note — “come back to this”, “needs a better example”.</div>'}</div></div></details>
        <details style="margin-top:10px"><summary><span class="sc">Version history (${x.versions.length})</span></summary><div class="body">
          <button class="btn sm ghost" id="vKeep">keep this version</button>
          <div class="stack" style="gap:6px;margin-top:8px">${[...x.versions].reverse().map((v,ri)=>{ const i = x.versions.length-1-ri; return `<div class="rail-item"><div class="row between"><span class="mono">${fmtDate(v.date,'med')} · ${v.words}w</span><span class="row" style="gap:4px"><button class="tbtn" data-vrestore="${i}">restore</button><button class="del-x inline" data-vdel="${i}">×</button></span></div></div>`; }).join('') || '<div class="faint" style="font-size:.78rem">Every "keep this version" click creates a snapshot you can come back to.</div>'}</div></div></details>
        <details style="margin-top:10px"><summary><span class="sc">Publishing pipeline</span></summary><div class="body stack" style="gap:8px">
          <select class="sel" id="pubStatus" style="width:auto">${PUB_STATUSES.map(s=>`<option ${x.publication.status===s?'selected':''}>${s}</option>`).join('')}</select>
          <input class="inp" id="pubWhere" placeholder="submitted to / published at (a name or URL)" value="${esc(x.publication.where)}">
          <input class="inp" id="pubWhen" type="date" value="${x.publication.when||''}">
        </div></details>
        ${moreSection(`<div class="danger-zone"><span>This deletes the piece, its research pins, and its version history.</span><button class="btn sm ghost danger" id="wDel">Delete this piece</button></div>`)}
      </div>
      <div class="ws-right${ws.board?'':' folded'}">
        <button class="ws-rail" id="wsRailR" title="show the inspector and structure board"><span class="chev">‹</span><span class="lbl">inspector</span></button>
        ${wsInspectorHTML(e)}${structureBoardHTML(e)}</div>
    </div>
  </div>`;
  /* The draft now lives in the binder's documents, not on the project body —
     bindWsStudio owns #wBody. Binding it here too would write every keystroke
     to both places, and #wBody does not exist at all in the other three views. */
  $('#wFocus').onclick = () => { S._writeFocus = !S._writeFocus; redraw(); setTimeout(()=>$('#wBody')?.focus(),60); };
  /* the toolbar toggles, the fold button on each panel, and the rail that a
     folded panel leaves behind all drive the same two flags */
  const foldL = () => { ws.drawer = !ws.drawer; saveNow(); sound('click'); redraw(); };
  const foldR = () => { ws.board  = !ws.board;  saveNow(); sound('click'); redraw(); };
  ['#wPaneL','#wsRailL','#wsFoldL'].forEach(sel => { const n = $(sel); if(n) n.onclick = foldL; });
  ['#wPaneR','#wsRailR','#wsFoldR'].forEach(sel => { const n = $(sel); if(n) n.onclick = foldR; });
  bindWsResize(root, ws);
  bindWsStudio(root, e, redraw);
  $('#wsCompileBtn') && ($('#wsCompileBtn').onclick = () => wsOpenCompile(e));
  $('#wKind').onchange = ev => { x.kind = ev.target.value; saveNow(); };
  $('#wStatus').onchange = ev => { x.status = ev.target.value; saveNow(); };
  $('#wTarget').onchange = ev => { x.target.wordTarget = +ev.target.value||0; saveNow(); redraw(); };
  $('#wDeadline').onchange = ev => { x.target.deadline = ev.target.value; saveNow(); };
  $('#wScratch').addEventListener('input', debounce(ev => { x.scratchpad = ev.target.value; saveNow(); }, 500));
  $('#cAdd').onclick = () => { const quote = ta.value.slice(ta.selectionStart, ta.selectionEnd).trim(); if(!quote){ toast('Highlight some text in the draft first.'); return; } const note = prompt('Note on this passage:'); if(note===null) return; x.comments.push({id:uid(), quote, note, createdAt:today()}); saveNow(); redraw(); };
  root.querySelectorAll('[data-cdeln]').forEach(b => b.onclick = () => { x.comments = x.comments.filter(c=>c.id!==b.dataset.cdeln); saveNow(); redraw(); });
  $('#vKeep').onclick = () => { x.versions.push({date:today(), body:e.body, words:wordCount(e.body)}); saveNow(); toast('Version kept.'); redraw(); };
  root.querySelectorAll('[data-vrestore]').forEach(b => b.onclick = () => confirmDlg('Replace the current draft with this version? The current text is kept as a version first.', () => { x.versions.push({date:today(), body:e.body, words:wordCount(e.body)}); const v = x.versions[+b.dataset.vrestore]; e.body = v.body; saveNow(); redraw(); }));
  root.querySelectorAll('[data-vdel]').forEach(b => b.onclick = () => { x.versions.splice(+b.dataset.vdel,1); saveNow(); redraw(); });
  $('#pubStatus').onchange = ev => { x.publication.status = ev.target.value; saveNow(); redraw(); };
  $('#pubWhere').onchange = ev => { x.publication.where = ev.target.value.trim(); saveNow(); };
  $('#pubWhen').onchange = ev => { x.publication.when = ev.target.value; saveNow(); };
  $('#expMd').onclick = () => exportWriting(e,'md'); $('#expTxt').onclick = () => exportWriting(e,'plain'); $('#expHtml').onclick = () => exportWriting(e,'html');
  $('#wDel').onclick = () => requestDelete({label:e.title||'this piece', remove:()=>spliceOut(S.entries, y=>y.id===e.id), after:()=>navigate('#/writing')});
  bindResearchDrawer(root, e, redraw);
  bindStructureBoard(root, e, redraw);
}
