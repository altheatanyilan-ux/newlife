/* ============================================================
   THE LIBRARY (formerly the Commonplace Book) — media as a
   theory base for lived experience. Not a rating site: every
   work is asked what it did to you, not whether it was "good".
   Stored as entries of type `media`, so search, hashtags, and
   the cross-tagging system all just work.
   ============================================================ */
const MEDIA_KINDS = {
  book:       ['📗','Book',        '#7f916a'],
  film:       ['🎞','Film',        '#a0727e'],
  documentary:['🎥','Doc',         '#5c7c8a'],
  podcast:    ['🎙','Podcast',     '#c9975c'],
  article:    ['📄','Article',     '#8a8d8f'],
  series:     ['📺','Series',      '#6b7f8e'],
  album:      ['🎵','Album',       '#b08968'],
  lecture:    ['🎤','Lecture',     '#c47832'],
  exhibition: ['🖼','Exhibition',  '#9a8fb8'],
  game:       ['🎮','Game',        '#6fa39a'],
};
const MEDIA_STATUS = ['want','progress','finished','abandoned','reexperiencing'];
const MEDIA_STATUS_LABEL = {want:'Want', progress:'In Progress', finished:'Finished', abandoned:'Abandoned', reexperiencing:'Re-experiencing'};
/* the resonance scale — not "was it good?" but "what did it do to me?" */
const RESONANCE_LEVELS = [
  ['passed', 'Passed through me', '#8a8d8f'],
  ['stayed', 'Stayed with me',    '#6b7f8e'],
  ['changed','Changed me',        '#c47832'],
  ['lives',  'Lives in me',       '#d4a44c'],
];
const resonanceMeta = k => RESONANCE_LEVELS.find(r=>r[0]===k) || null;
function mediaEntries(){ return S.entries.filter(e => e.type === 'media'); }
function mediaX(e){ e.extra = e.extra || {}; return e.extra; }
function migrateMedia(){
  mediaEntries().forEach(e => {
    const x = mediaX(e);
    if(x.kind === 'talk') x.kind = 'lecture';
    x.kind = MEDIA_KINDS[x.kind] ? x.kind : 'book';
    const STATUS_MAP = {wishlist:'want', reading:'progress'};
    x.status = MEDIA_STATUS.includes(x.status) ? x.status : (STATUS_MAP[x.status] || 'finished');
    if(x.resonanceLevel === undefined){ const map = {1:'passed',2:'passed',3:'stayed',4:'changed',5:'lives'}; x.resonanceLevel = map[+x.rating] || null; }
    if(!Array.isArray(x.quotes)) x.quotes = (Array.isArray(x.passages)?x.passages:[]).map(p => ({id:uid(), text:p.text||'', where:p.where||'', why:p.note||''}));
    if(x.oneLineCapture === undefined) x.oneLineCapture = x.oneLine || '';
    if(x.installed === undefined) x.installed = '';
    if(x.recommend === undefined) x.recommend = '';
    if(x.recommendWho === undefined) x.recommendWho = '';
    if(!x._convoMigrated){
      const parts = [];
      if(x.resonance) parts.push(x.resonance);
      if(x.argued) parts.push(`**Where I argued with it.** ${x.argued}`);
      if(x.steal) parts.push(`**What I am stealing.** ${x.steal}`);
      if(x.changed) parts.push(`**What it changed.** ${x.changed}`);
      if(parts.length && !e.body) e.body = parts.join('\n\n');
      x._convoMigrated = true;
    }
    delete x.passages; delete x.rating;
    e.links = e.links || {}; ['stages','substages','threads','values','visions','skills','projects'].forEach(k => { if(!Array.isArray(e.links[k])) e.links[k] = []; });
  });
}

/* ---------- life stage auto-tag, derived from date consumed ---------- */
function stageYearRange(s){ const m = (s.years||'').match(/(\d{4})\s*[–-]\s*(\d{4})?/); if(!m) return null; return [+m[1], m[2] ? +m[2] : new Date().getFullYear()]; }
function stageForDate(dateStr){ const y = +String(dateStr||'').slice(0,4); if(!y) return null; return (S.stages||[]).find(s => { const r = stageYearRange(s); return r && y>=r[0] && y<=r[1]; }) || null; }
function mediaDateConsumed(e){ const x = mediaX(e); return x.finishedAt || e.occurredAt || ''; }
function mediaLifeStage(e){ const linked = (e.links?.stages||[])[0]; if(linked){ const s = byId(S.stages, linked); if(s) return s; } return stageForDate(mediaDateConsumed(e)); }

/* ---------- quotes & marginalia: auto-feed into the Quotes journal ---------- */
function syncMediaQuotes(e){
  const x = mediaX(e);
  (x.quotes||[]).forEach(q => {
    if(!q.text || !q.text.trim()){ if(q.quoteEntryId){ const old = byId(S.entries, q.quoteEntryId); if(old) S.entries.splice(S.entries.indexOf(old),1); q.quoteEntryId = null; } return; }
    let qe = q.quoteEntryId ? byId(S.entries, q.quoteEntryId) : null;
    if(!qe){ qe = {id:uid(), type:'quote', title:e.title, body:q.text, occurredAt:e.occurredAt, createdAt:new Date().toISOString(), media:[], links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[]}, people:[], places:[], emotions:[], tags:[], confidence:'', extra:{author:mediaX(e).creator||'', source:e.title, link:'', page:q.where||'', why:q.why||'', fromMedia:e.id}}; S.entries.push(qe); q.quoteEntryId = qe.id; }
    else { qe.body = q.text; qe.extra.page = q.where||''; qe.extra.why = q.why||''; qe.extra.author = mediaX(e).creator||''; qe.extra.source = e.title; }
  });
  const keep = new Set((x.quotes||[]).map(q=>q.quoteEntryId).filter(Boolean));
  /* splice rather than reassign: S.entries is held by reference in every
     pending-Undo closure, and swapping the array would strand them */
  for(let i = S.entries.length - 1; i >= 0; i--){ const en = S.entries[i];
    if(en.type==='quote' && en.extra?.fromMedia===e.id && !keep.has(en.id)) S.entries.splice(i, 1); }
  saveNow();
}
hooks.syncquote = (mediaId) => { const e = byId(S.entries, mediaId); if(e) syncMediaQuotes(e); };

/* ---------- the Personal Queue — a single ordered "up next" list ---------- */
function openQueueItemModal(existing){
  const it = existing || {id:uid(), title:'', medium:'book', why:'', valueId:'', createdAt:today()};
  const m = openModal(`<h2>${existing?'Edit queue item':'Add to the queue'}</h2><div class="stack">
    <input class="inp serif-lg" id="qiTitle" placeholder="Title" value="${esc(it.title)}" autofocus>
    <div class="grid c2" style="gap:8px"><select class="sel" id="qiMedium">${Object.entries(MEDIA_KINDS).map(([k,v])=>`<option value="${k}" ${it.medium===k?'selected':''}>${v[0]} ${v[1]}</option>`).join('')}</select></div>
    <input class="inp" id="qiWhy" placeholder="Why it's here — one line" value="${esc(it.why)}">
    <select class="sel" id="qiValue"><option value="">no value</option>${S.valueOrder.map(id=>{ const v=byId(S.values,id); return `<option value="${id}" ${it.valueId===id?'selected':''}>${esc(v.name)}</option>`; }).join('')}</select>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="qiSave">${existing?'Save':'Add to queue'}</button></div></div>`,'narrow');
  m.querySelector('#qiSave').onclick = () => {
    const title = m.querySelector('#qiTitle').value.trim(); if(!title){ toast('Give it a title.'); return; }
    Object.assign(it, {title, medium:m.querySelector('#qiMedium').value, why:m.querySelector('#qiWhy').value.trim(), visionId:m.querySelector('#qiVision').value||'', valueId:m.querySelector('#qiValue').value||''});
    if(!existing) S.mediaQueue.push(it); saveNow(); m.remove(); sound('success'); rerender();
  };
}
function startQueueItem(id){
  const it = byId(S.mediaQueue, id); if(!it) return;
  openMediaModal({kind:it.medium, title:it.title, status:'progress'});
  S.mediaQueue = S.mediaQueue.filter(x=>x.id!==id); saveNow();
}

/* ---------- Curated Lists ---------- */
const SUGGESTED_LISTS = [
  ['Books that built my self-image', 'Retrospective — the works that shaped how you see yourself.'],
  ['Films for when the world is too loud', 'Mood-based — reach for these on the hard days.'],
  ['The Tokyo reading list', 'Vision-specific — everything feeding a life not yet lived.'],
  ['If I could only recommend 10 books', 'The distilled canon.'],
  ['What to read in your 20s', 'Life-stage-specific advice to a younger self.'],
];
function newCuratedList(title='', description=''){ const l = {id:uid(), title, description, forWhom:'myself', personName:'', private:true, entries:[]}; S.mediaLists.push(l); saveNow(); return l; }
function openListEditModal(l){
  const m = openModal(`<h2>${l.title?'Edit list':'A new list'}</h2><div class="stack">
    <input class="inp serif-lg" id="mlTitle" placeholder="Title" value="${esc(l.title)}">
    <textarea class="ta" id="mlDesc" placeholder="What is this collection for?">${esc(l.description)}</textarea>
    <div class="grid c2" style="gap:8px"><select class="sel" id="mlFor"><option value="myself" ${l.forWhom==='myself'?'selected':''}>for myself</option><option value="person" ${l.forWhom==='person'?'selected':''}>for a specific person</option><option value="anyone" ${l.forWhom==='anyone'?'selected':''}>for anyone on a similar path</option></select>
    <input class="inp" id="mlPerson" placeholder="who? (if for a person)" value="${esc(l.personName||'')}"></div>
    <label class="toggle ${l.private?'on':''}" id="mlPriv"><span class="sw"></span><span>private</span></label>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="mlSave">Save</button></div></div>`,'narrow');
  m.querySelector('#mlSave').onclick = () => {
    const title = m.querySelector('#mlTitle').value.trim(); if(!title){ toast('Name the list.'); return; }
    Object.assign(l, {title, description:m.querySelector('#mlDesc').value.trim(), forWhom:m.querySelector('#mlFor').value, personName:m.querySelector('#mlPerson').value.trim(), private:m.querySelector('#mlPriv').classList.contains('on')});
    saveNow(); m.remove(); rerender();
  };
}
function exportListAsPage(l){
  const rows = (l.entries||[]).map(id=>byId(S.entries,id)).filter(Boolean);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(l.title)}</title><style>body{font-family:Georgia,serif;max-width:640px;margin:60px auto;line-height:1.7;color:#2a241d}h1{font-size:1.8rem}p.d{color:#665e52;font-style:italic}ol{padding-left:1.3em}li{margin-bottom:14px}b{display:block}</style></head><body>
    <h1>${esc(l.title)}</h1>${l.description?`<p class="d">${esc(l.description)}</p>`:''}
    <ol>${rows.map(e=>{ const x=mediaX(e); return `<li><b>${esc(e.title)}</b>${x.creator?` — ${esc(x.creator)}`:''}${x.oneLineCapture?`<br>${esc(x.oneLineCapture)}`:''}</li>`; }).join('')}</ol></body></html>`;
  const blob = new Blob([html], {type:'text/html'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${l.title.replace(/[^\w-]+/g,'-')||'list'}.html`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),2000);
}

/* ---------- Received Recommendations ---------- */
function openRecModal(existing){
  const r = existing || {id:uid(), title:'', from:'', why:'', status:'queued', addedAt:today()};
  const m = openModal(`<h2>${existing?'Edit recommendation':'Someone recommended something'}</h2><div class="stack">
    <input class="inp serif-lg" id="rcTitle" placeholder="Title" value="${esc(r.title)}" autofocus>
    <input class="inp" id="rcFrom" placeholder="Who recommended it?" value="${esc(r.from)}">
    <textarea class="ta" id="rcWhy" placeholder="Why they said to consume it">${esc(r.why)}</textarea>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="rcSave">${existing?'Save':'Add to inbox'}</button></div></div>`,'narrow');
  m.querySelector('#rcSave').onclick = () => { const title = m.querySelector('#rcTitle').value.trim(); if(!title){ toast('Give it a title.'); return; }
    Object.assign(r, {title, from:m.querySelector('#rcFrom').value.trim(), why:m.querySelector('#rcWhy').value.trim()});
    if(!existing) S.mediaRecs.push(r); saveNow(); m.remove(); rerender(); };
}

/* ---------- the Influence Map — patterns across media ---------- */
function influenceMapHTML(){
  const all = mediaEntries();
  if(!all.length) return '<div class="empty">Log a few works and the patterns will show up here.</div>';
  const valTally = {}, thTally = {};
  all.forEach(e => { (e.links.values||[]).forEach(x=>valTally[x.id]=(valTally[x.id]||0)+1); (e.links.threads||[]).forEach(id=>thTally[id]=(thTally[id]||0)+1); });
  const kindTally = {}; all.forEach(e => { const k = mediaX(e).kind; kindTally[k] = (kindTally[k]||0)+1; });
  const resTally = {}; RESONANCE_LEVELS.forEach(([k])=>resTally[k]=0); all.forEach(e => { const r = mediaX(e).resonanceLevel; if(r) resTally[r]++; });
  const reexp = all.filter(e => { const x = mediaX(e); return x.resonanceLevel==='lives' && x.finishedAt && daysSince(x.finishedAt) > 365; });
  const bar = (label,n,max,color) => `<div class="influence-bar"><span style="width:130px;flex:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(label)}</span><span class="track"><i style="width:${max?Math.round(n/max*100):0}%;--c:${color}"></i></span><span class="mono" style="width:22px;text-align:right">${n}</span></div>`;
  const maxVal = Math.max(1,...Object.values(valTally),0); const maxTh = Math.max(1,...Object.values(thTally),0); const maxKind = Math.max(1,...Object.values(kindTally),0); const maxRes = Math.max(1,...Object.values(resTally),0);
  const starved = S.valueOrder.filter(id=>!valTally[id]);
  return `<div class="grid c2" style="align-items:start;gap:24px">
      <div><span class="sc">Values your media touches</span>${Object.keys(valTally).length ? Object.entries(valTally).sort((a,b)=>b[1]-a[1]).map(([id,n])=>{ const v=byId(S.values,id); return v?bar(v.name,n,maxVal,v.color):''; }).join('') : '<div class="empty">Nothing tagged to a value yet.</div>'}
        ${starved.length?`<p class="faint" style="font-size:.78rem;margin-top:8px">Media-starved: ${starved.map(id=>esc(byId(S.values,id).name)).join(', ')}.</p>`:''}</div>
      <div><span class="sc">Threads that keep appearing</span>${Object.keys(thTally).length ? Object.entries(thTally).sort((a,b)=>b[1]-a[1]).map(([id,n])=>{ const t=byId(S.threads,id); return t?bar(t.name,n,maxTh,t.color):''; }).join('') : '<div class="empty">No threads tagged yet.</div>'}</div>
    </div>
    <div class="grid c2" style="align-items:start;gap:24px;margin-top:20px">
      <div><span class="sc">Medium balance</span>${Object.entries(kindTally).sort((a,b)=>b[1]-a[1]).map(([k,n])=>bar((MEDIA_KINDS[k]||MEDIA_KINDS.book)[1],n,maxKind,(MEDIA_KINDS[k]||MEDIA_KINDS.book)[2])).join('')}</div>
      <div><span class="sc">Resonance distribution</span>${RESONANCE_LEVELS.map(([k,label,color])=>bar(label,resTally[k],maxRes,color)).join('')}
        ${all.length && resTally.passed > all.length*.6 ? '<p class="faint" style="font-size:.78rem;margin-top:8px">Most of what you log only passes through you. Maybe that\'s fine — or maybe you are consuming faster than you absorb.</p>' : ''}</div>
    </div>
    ${reexp.length?`<div style="margin-top:20px"><span class="sc">Re-experience candidates</span><p class="faint" style="font-size:.78rem">Rated “lives in me”, untouched in over a year.</p><div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px">${reexp.map(e=>`<span class="chip click" data-mopen="${e.id}">${(MEDIA_KINDS[mediaX(e).kind]||MEDIA_KINDS.book)[0]} ${esc(e.title)}</span>`).join('')}</div></div>`:''}`;
}

/* ---------- Timeline view: media mapped onto the 8 life stages ---------- */
function renderLibraryTimeline(root){
  const stages = S.stages.filter(s=>!s.notyet); const all = mediaEntries();
  root.innerHTML = stages.length ? stages.map(s => {
    const works = all.filter(e => mediaLifeStage(e)?.id === s.id).sort((a,b)=>(mediaDateConsumed(a)).localeCompare(mediaDateConsumed(b)));
    return `<div class="lib-stage-col rv" style="--c:${s.hue}"><div class="row between"><b class="serif" style="font-size:1.1rem;color:${s.hue}">${s.char} ${esc(s.name)}</b><span class="mono">${esc(s.years||'')} · ${works.length}</span></div>
      ${works.length ? `<div class="works">${works.map(e => { const x = mediaX(e); const k = MEDIA_KINDS[x.kind]||MEDIA_KINDS.book; const r = resonanceMeta(x.resonanceLevel);
        return `<div class="lib-stage-work click" data-mopen="${e.id}" style="${r?`border-color:${r[2]}`:''}"><div>${k[0]} ${esc(e.title)}</div>${r?`<div class="faint" style="color:${r[2]}">${r[1]}</div>`:''}</div>`; }).join('')}</div>`
      : `<div class="empty">What were you reading during ${esc(s.name)}? What films do you remember? <button class="tbtn" data-retro-add="${s.id}">log one</button></div>`}
    </div>`; }).join('') : '<div class="empty">Add life stages on the Timeline page first, and media can be mapped onto them.</div>';
  root.querySelectorAll('[data-mopen]').forEach(c=>c.onclick=()=>openMediaPanel(c.dataset.mopen));
  root.querySelectorAll('[data-retro-add]').forEach(b=>b.onclick=()=>{ const s = byId(S.stages,b.dataset.retroAdd); const r = stageYearRange(s); openMediaModal({finishedAt: r ? `${r[0]}-06-15` : '', stageId: s.id}); });
}

/* ---------- Lists & Queue view ---------- */
function renderLibraryLists(root){
  root.innerHTML = `
    <section class="section rv"><div class="row between"><span class="sc" style="margin:0">Personal queue — up next</span><button class="btn sm ghost" id="qAdd">＋ add to queue</button></div>
      <p class="muted" style="font-size:.85rem">What you want to encounter next. Drag to reorder; the top of the list is what you'll actually pick up.</p>
      <div class="queue-list" id="queueList">${S.mediaQueue.map((it,i) => { const k = MEDIA_KINDS[it.medium]||MEDIA_KINDS.book; const val = it.valueId?byId(S.values,it.valueId):null;
        return `<div class="queue-item" draggable="true" data-qid="${it.id}"><span class="grip">⠿</span><span class="body"><div class="row between"><b class="serif">${k[0]} ${esc(it.title)}</b><span class="row" style="gap:4px"><button class="tbtn" data-qstart="${it.id}">mark started →</button><button class="tbtn" data-qedit="${it.id}">edit</button><button class="del-x inline" data-qdel="${it.id}">×</button></span></div>${it.why?`<div class="quote" style="font-size:.85rem">${esc(it.why)}</div>`:''}${val?`<div class="row" style="gap:4px;margin-top:4px"><span class="chip on" style="--c:${val.color}">${esc(val.name)}</span></div>`:''}</span></div>`; }).join('') || '<div class="empty">Nothing queued. What do you want to encounter next?</div>'}</div></section>

    <section class="section rv"><div class="row between"><span class="sc" style="margin:0">Curated lists</span><button class="btn sm ghost" id="mlAdd">＋ new list</button></div>
      ${!S.mediaLists.length ? `<p class="muted" style="font-size:.85rem">Themed collections — what you'd give to someone you care about, or the distilled canon. A few to start with:</p><div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:14px">${SUGGESTED_LISTS.map(([t,d])=>`<button class="btn sm ghost" data-suggest="${esc(t)}" data-suggestd="${esc(d)}">＋ ${esc(t)}</button>`).join('')}</div>` : ''}
      <div class="grid c2" style="align-items:start">${S.mediaLists.map(l => { const rows = (l.entries||[]).map(id=>byId(S.entries,id)).filter(Boolean);
        return `<div class="curated-list-card"><div class="row between"><b class="serif" style="font-size:1.05rem">${esc(l.title)}</b><span class="row" style="gap:4px"><button class="tbtn" data-mledit="${l.id}">edit</button><button class="tbtn" data-mlexport="${l.id}">export</button><button class="del-x inline" data-mldel="${l.id}">×</button></span></div>
          ${l.description?`<div class="muted" style="font-size:.82rem;margin-top:4px">${esc(l.description)}</div>`:''}
          <div class="row" style="margin-top:6px"><span class="status-pill">${l.forWhom==='myself'?'for myself':l.forWhom==='person'?`for ${esc(l.personName||'someone')}`:'for anyone on a similar path'}</span>${l.private?'<span class="status-pill">private</span>':''}</div>
          <div class="entries">${rows.map(e=>`<div class="curated-entry"><span>${(MEDIA_KINDS[mediaX(e).kind]||MEDIA_KINDS.book)[0]} ${esc(e.title)}</span><button class="del-x inline" data-mlrm="${l.id}:${e.id}">×</button></div>`).join('') || '<div class="faint" style="font-size:.78rem">Empty so far.</div>'}</div>
          <button class="tbtn" data-mladdwork="${l.id}" style="margin-top:6px">+ add a work</button></div>`; }).join('') || ''}</div></section>

    <section class="section rv"><div class="row between"><span class="sc" style="margin:0">Received recommendations</span><button class="btn sm ghost" id="rcAdd">＋ someone told me to</button></div>
      <p class="muted" style="font-size:.85rem">So you stop forgetting who told you to read what.</p>
      ${S.mediaRecs.length ? S.mediaRecs.map(r=>`<div class="rec-row"><span><b class="serif">${esc(r.title)}</b><div class="mono">from ${esc(r.from||'someone')}</div>${r.why?`<div class="quote" style="font-size:.85rem">${esc(r.why)}</div>`:''}</span><span class="row" style="gap:6px"><select class="sel" style="width:auto" data-rcstatus="${r.id}">${['queued','consumed','declined'].map(s=>`<option value="${s}" ${r.status===s?'selected':''}>${s}</option>`).join('')}</select><button class="tbtn" data-rclog="${r.id}">log it →</button><button class="del-x inline" data-rcdel="${r.id}">×</button></span></div>`).join('') : '<div class="empty">Nobody\'s told you to read anything yet — or you\'ve forgotten already.</div>'}</section>`;

  $('#qAdd').onclick = () => openQueueItemModal();
  root.querySelectorAll('[data-qedit]').forEach(b=>b.onclick=()=>openQueueItemModal(byId(S.mediaQueue,b.dataset.qedit)));
  root.querySelectorAll('[data-qstart]').forEach(b=>b.onclick=()=>startQueueItem(b.dataset.qstart));
  root.querySelectorAll('[data-qdel]').forEach(b=>b.onclick=()=>{ const it = byId(S.mediaQueue,b.dataset.qdel); requestDelete({label:it.title, node:b.closest('.queue-item'), remove:()=>spliceOut(S.mediaQueue,x=>x.id===it.id)}); });
  { let dragId = null; root.querySelectorAll('.queue-item').forEach(li => { li.addEventListener('dragstart', ()=>{ dragId=li.dataset.qid; li.classList.add('dragging'); }); li.addEventListener('dragend', ()=>li.classList.remove('dragging')); li.addEventListener('dragover', e=>e.preventDefault()); li.addEventListener('drop', e=>{ e.preventDefault(); if(!dragId||dragId===li.dataset.qid) return; const o = S.mediaQueue.filter(x=>x.id!==dragId); const item = byId(S.mediaQueue,dragId); o.splice(o.findIndex(x=>x.id===li.dataset.qid),0,item); S.mediaQueue = o; saveNow(); rerender(); }); }); }
  $('#mlAdd').onclick = () => openListEditModal(newCuratedList());
  root.querySelectorAll('[data-suggest]').forEach(b=>b.onclick=()=>openListEditModal(newCuratedList(b.dataset.suggest, b.dataset.suggestd)));
  root.querySelectorAll('[data-mledit]').forEach(b=>b.onclick=()=>openListEditModal(byId(S.mediaLists,b.dataset.mledit)));
  root.querySelectorAll('[data-mlexport]').forEach(b=>b.onclick=()=>exportListAsPage(byId(S.mediaLists,b.dataset.mlexport)));
  root.querySelectorAll('[data-mldel]').forEach(b=>b.onclick=()=>{ const l = byId(S.mediaLists,b.dataset.mldel); requestDelete({label:l.title, remove:()=>spliceOut(S.mediaLists,x=>x.id===l.id)}); });
  root.querySelectorAll('[data-mlrm]').forEach(b=>b.onclick=()=>{ const [lid,eid] = b.dataset.mlrm.split(':'); const l = byId(S.mediaLists,lid); l.entries = l.entries.filter(x=>x!==eid); saveNow(); rerender(); });
  root.querySelectorAll('[data-mladdwork]').forEach(b=>b.onclick=()=>{ const l = byId(S.mediaLists,b.dataset.mladdwork); const pool = mediaEntries().filter(e=>!(l.entries||[]).includes(e.id));
    const m = openModal(`<h2>Add a work to “${esc(l.title)}”</h2><input class="inp" id="mlQ" placeholder="search the shelf" autofocus><div class="stack" id="mlPick" style="gap:4px;margin-top:10px;max-height:50vh;overflow:auto"></div>`,'narrow');
    const draw = q => { const list = pool.filter(e=>!q||e.title.toLowerCase().includes(q.toLowerCase())).slice(0,60); m.querySelector('#mlPick').innerHTML = list.map(e=>`<button class="choice" data-pick="${e.id}"><span class="ico">${(MEDIA_KINDS[mediaX(e).kind]||MEDIA_KINDS.book)[0]}</span><span><b>${esc(e.title)}</b></span></button>`).join('') || '<div class="empty">Nothing on the shelf matches — or it\'s already in this list.</div>'; m.querySelectorAll('[data-pick]').forEach(x=>x.onclick=()=>{ l.entries.push(x.dataset.pick); saveNow(); m.remove(); rerender(); }); };
    draw(''); m.querySelector('#mlQ').oninput = e => draw(e.target.value); });
  $('#rcAdd').onclick = () => openRecModal();
  root.querySelectorAll('[data-rcstatus]').forEach(s=>s.onchange=()=>{ byId(S.mediaRecs,s.dataset.rcstatus).status = s.value; saveNow(); });
  root.querySelectorAll('[data-rcdel]').forEach(b=>b.onclick=()=>{ const r = byId(S.mediaRecs,b.dataset.rcdel); requestDelete({label:r.title, node:b.closest('.rec-row'), remove:()=>spliceOut(S.mediaRecs,x=>x.id===r.id)}); });
  root.querySelectorAll('[data-rclog]').forEach(b=>b.onclick=()=>{ const r = byId(S.mediaRecs,b.dataset.rclog); r.status = 'consumed'; saveNow(); openMediaModal({title:r.title, status:'want'}); });
}

/* ---------- the Shelf & the Review ---------- */
routes.commonplace = function(root, params){
  registerPageEntry({pageName:'The Library', addLabel:'Log a work', defaultEntryType:'media', prefilledFields:{}, options:[{icon:'📗', label:'Log a work', desc:'Pick the kind on the next screen.', run:()=>openMediaModal({})}]});
  const tab = ['timeline','lists'].includes(params[0]) ? params[0] : 'shelf';
  const all = mediaEntries();
  const kind = S._mKind || 'all', status = S._mStatus || 'all', res = S._mRes || 'all', q = (S._mq||'').toLowerCase();
  const view = S._mView || 'shelf'; const sortBy = S._mSort || 'consumed';
  const list = all.filter(e => { const x = mediaX(e);
      return (kind==='all' || x.kind===kind) && (status==='all' || x.status===status) && (res==='all' || x.resonanceLevel===res)
        && (!q || `${e.title} ${x.creator||''} ${e.body||''} ${entryTags(e).join(' ')}`.toLowerCase().includes(q)); })
    .sort((a,b) => sortBy==='added' ? (b.createdAt||'').localeCompare(a.createdAt||'') : sortBy==='resonance' ? RESONANCE_LEVELS.findIndex(r=>r[0]===mediaX(b).resonanceLevel) - RESONANCE_LEVELS.findIndex(r=>r[0]===mediaX(a).resonanceLevel) : mediaDateConsumed(b).localeCompare(mediaDateConsumed(a)));
  const finished = all.filter(e => mediaX(e).status === 'finished');
  const thisYear = finished.filter(e => mediaDateConsumed(e).slice(0,4) === String(new Date().getFullYear()));
  const counts = {}; all.forEach(e => { const k = mediaX(e).kind; counts[k] = (counts[k]||0)+1; });

  root.innerHTML = `<div class="page">
    <div class="page-head"><h1>The Library</h1></div>

    <div class="media-kind-row rv">${Object.entries(MEDIA_KINDS).map(([k,v])=>`<button class="media-kind-btn ${kind===k?'on':''}" style="--c:${v[2]}" data-mkind="${k}"><span class="ico">${v[0]}</span><span class="lbl">${v[1]}</span><span class="n">${counts[k]||0}</span></button>`).join('')}</div>

    <div class="tabs rv">${[['shelf','The Shelf'],['timeline','Timeline'],['lists','Queue & Lists']].map(([k,l])=>`<button class="${tab===k?'active':''}" data-go="#/commonplace${k==='shelf'?'':'/'+k}">${l}</button>`).join('')}</div>

    ${tab==='shelf' ? `
    <div class="card rv" style="margin:16px 0"><div class="income-strip">
      <div><div class="k">finished this year</div><div class="num" data-tween="${thisYear.length}">0</div><div class="mono">${finished.length} in all</div></div>
      <div><div class="k">in progress</div><div class="num" data-tween="${all.filter(e=>mediaX(e).status==='progress').length}">0</div></div>
      <div><div class="k">wanted</div><div class="num" data-tween="${all.filter(e=>mediaX(e).status==='want').length}">0</div></div>
      <div><div class="k">lives in me</div><div class="num" data-tween="${all.filter(e=>mediaX(e).resonanceLevel==='lives').length}">0</div><div class="mono">of ${all.length} logged</div></div>
    </div></div>

    <div class="row rv" style="gap:8px;flex-wrap:wrap;margin-bottom:14px">
      <input class="inp" id="mq" placeholder="search title, maker, notes, tags" value="${esc(S._mq||'')}" style="flex:1;min-width:200px">
      <select class="sel" id="mStatus" style="width:auto"><option value="all">any status</option>${MEDIA_STATUS.map(s=>`<option value="${s}" ${status===s?'selected':''}>${MEDIA_STATUS_LABEL[s]}</option>`).join('')}</select>
      <select class="sel" id="mRes" style="width:auto"><option value="all">any resonance</option>${RESONANCE_LEVELS.map(([k,l])=>`<option value="${k}" ${res===k?'selected':''}>${l}</option>`).join('')}</select>
      <select class="sel" id="mSort" style="width:auto"><option value="consumed" ${sortBy==='consumed'?'selected':''}>by date consumed</option><option value="added" ${sortBy==='added'?'selected':''}>by date added</option><option value="resonance" ${sortBy==='resonance'?'selected':''}>by resonance</option></select>
      <div class="view-toggle">${[['shelf','▦'],['list','☰']].map(([k,l])=>`<button class="${view===k?'on':''}" data-mview="${k}" title="${k} view">${l}</button>`).join('')}</div>
    </div>

    ${kind!=='all'||status!=='all'||res!=='all' ? `<div class="row rv" style="margin-bottom:10px"><button class="btn sm ghost" id="mClearF">clear filters</button></div>` : ''}

    ${view==='shelf' ? `<div class="shelf-grid rv">${list.length ? list.map(e => { const x = mediaX(e); const k = MEDIA_KINDS[x.kind] || MEDIA_KINDS.book; const r = resonanceMeta(x.resonanceLevel); const stage = mediaLifeStage(e);
      return `<div class="work" data-mopen="${e.id}" style="--c:${k[2]}">
        <div class="work-spine">${k[0]}</div>
        <div class="work-body">
          <div class="work-title">${esc(e.title||'Untitled')}</div>
          <div class="mono work-maker">${esc(x.creator||'')}${x.year?` · ${esc(x.year)}`:''}</div>
          <div class="row between" style="margin-top:6px"><span class="status-pill">${MEDIA_STATUS_LABEL[x.status]}</span>${r?`<span class="resonance-pill" style="--c:${r[2]}">${r[1]}</span>`:'<span class="faint mono">no resonance yet</span>'}</div>
          ${x.oneLineCapture?`<div class="work-line">${esc(x.oneLineCapture)}</div>`:''}
          ${stage?`<div class="mono faint" style="margin-top:4px">${stage.char} ${esc(stage.name)}</div>`:''}
          ${entryTags(e).length?tagChips(e):''}
        </div></div>`; }).join('')
      : `<div class="empty">Nothing logged yet. The first one can be whatever you happen to be in the middle of.</div>`}</div>`
    : `<div class="stack" style="gap:6px">${list.length ? list.map(e => { const x = mediaX(e); const k = MEDIA_KINDS[x.kind]||MEDIA_KINDS.book; const r = resonanceMeta(x.resonanceLevel);
        return `<div class="row between click" data-mopen="${e.id}" style="padding:9px 12px;border:1px solid var(--line);border-radius:9px;cursor:pointer"><span class="row" style="gap:10px"><span>${k[0]}</span><b class="serif">${esc(e.title)}</b><span class="mono faint">${esc(x.creator||'')}</span></span><span class="row" style="gap:8px"><span class="status-pill">${MEDIA_STATUS_LABEL[x.status]}</span>${r?`<span class="resonance-pill" style="--c:${r[2]}">${r[1]}</span>`:''}</span></div>`; }).join('') : '<div class="empty">Nothing matches.</div>'}</div>`}

    ${all.length ? `<section class="section rv"><span class="sc">What you keep coming back to</span>
      <div class="tag-cloud" style="margin-top:10px">${allTags().filter(([t]) => mediaEntries().some(e=>entryTags(e).includes(t))).slice(0,24).map(([t,n])=>`<a class="tag" href="#/tag/${encodeURIComponent(t)}" style="--n:${Math.min(n,5)}">#${esc(t)}<span class="n">${n}</span></a>`).join('') || '<span class="faint">Tag a few works and the pattern shows up here.</span>'}</div></section>` : ''}

    <details class="section rv"><summary><span class="sc">The influence map</span></summary><div class="body" style="padding-top:10px">${influenceMapHTML()}</div></details>
    ` : tab==='timeline' ? `<div id="libTimeline" style="margin-top:16px"></div>`
    : `<div id="libLists" style="margin-top:16px"></div>`}
  </div>`;

  if(tab==='timeline') renderLibraryTimeline($('#libTimeline'));
  if(tab==='lists') renderLibraryLists($('#libLists'));
  if(tab!=='shelf') return bindGlobal();
  $('#mq').oninput = debounce(e => { S._mq = e.target.value; rerender(); const i = $('#mq'); if(i){ i.focus(); i.setSelectionRange(i.value.length,i.value.length); } }, 350);
  $('#mStatus').onchange = e => { S._mStatus = e.target.value; rerender(); };
  $('#mRes').onchange = e => { S._mRes = e.target.value; rerender(); };
  $('#mSort').onchange = e => { S._mSort = e.target.value; rerender(); };
  $$('[data-mview]',root).forEach(b => b.onclick = () => { S._mView = b.dataset.mview; rerender(); });
  $$('[data-mkind]',root).forEach(b => b.onclick = () => { S._mKind = (S._mKind===b.dataset.mkind) ? 'all' : b.dataset.mkind; rerender(); });
  if($('#mClearF')) $('#mClearF').onclick = () => { S._mKind='all'; S._mStatus='all'; S._mRes='all'; rerender(); };
  bindGlobal();
  function bindGlobal(){ $$('[data-mopen]',root).forEach(c => c.onclick = () => openMediaPanel(c.dataset.mopen)); }
  if(params[0] && !['timeline','lists'].includes(params[0])) openMediaPanel(params[0]);
};

function openMediaModal(pre={}){
  const kinds = Object.entries(MEDIA_KINDS);
  const m = openModal(`<h2>Log a work</h2>
    <div class="typerow" id="mkRow">${kinds.map(([k,v])=>`<button class="${(pre.kind||'book')===k?'on':''}" data-mk="${k}">${v[0]} ${v[1]}</button>`).join('')}</div>
    <div class="stack">
      <input class="inp serif-lg" id="mTitle" placeholder="Title" value="${esc(pre.title||'')}" autofocus>
      <div class="grid c3" style="gap:8px">
        <input class="inp" id="mCreator" placeholder="Author / director / maker">
        <input class="inp" id="mYear" placeholder="Year">
        <select class="sel" id="mStat">${MEDIA_STATUS.map(s=>`<option value="${s}" ${(pre.status||'progress')===s?'selected':''}>${MEDIA_STATUS_LABEL[s]}</option>`).join('')}</select>
      </div>
      <select class="sel" id="mStage"><option value="">life stage — leave to date consumed, or pick one now</option>${S.stages.filter(s=>!s.notyet).map(s=>`<option value="${s.id}" ${pre.stageId===s.id?'selected':''}>${s.char} ${esc(s.name)}${s.years?' · '+esc(s.years):''}</option>`).join('')}</select>
      <div class="row" style="justify-content:flex-end"><button class="btn primary" id="mSave">Add to the shelf</button></div>
    </div>`, 'narrow');
  let kind = pre.kind || 'book';
  m.querySelectorAll('[data-mk]').forEach(b => b.onclick = () => { kind = b.dataset.mk; m.querySelectorAll('[data-mk]').forEach(x=>x.classList.toggle('on', x===b)); });
  m.querySelector('#mSave').onclick = () => {
    const title = m.querySelector('#mTitle').value.trim(); if(!title){ toast('It needs a title, at least.'); return; }
    const st = m.querySelector('#mStat').value; const stageId = m.querySelector('#mStage').value || '';
    const e = {id:uid(), type:'media', title, body:'', occurredAt:today(), createdAt:new Date().toISOString(), media:[], links:{stages:stageId?[stageId]:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[]}, people:[], places:[], emotions:[], tags:[], confidence:'',
      extra:{kind, creator:m.querySelector('#mCreator').value.trim(), year:m.querySelector('#mYear').value.trim(), status:st, resonanceLevel:null, quotes:[], startedAt: st==='progress'?today():'', finishedAt: pre.finishedAt || (st==='finished'?today():''), oneLineCapture:'', installed:'', recommend:'', recommendWho:''}};
    S.entries.push(e); saveNow(); m.remove(); sound('success'); rerender(); openMediaPanel(e.id);
  };
}
function openMediaPanel(id){
  const e = byId(S.entries, id); if(!e || e.type !== 'media') return;
  const x = mediaX(e); const k = MEDIA_KINDS[x.kind] || MEDIA_KINDS.book; const stage = mediaLifeStage(e);
  const reopen = () => reopenPanel(() => { rerender(); openMediaPanel(id); });
  const p = openPanel(`${vmToggleHTML('media')}<div class="mono row between"><span>${k[0]} ${k[1].toLowerCase()} · ${MEDIA_STATUS_LABEL[x.status]}${stage?` · consumed during ${stage.char} ${esc(stage.name)}`:''}</span><span class="wv-badge"></span></div>
    <div class="row between" style="align-items:flex-start"><h2 style="flex:1">${ed(`entries.#${e.id}.title`,{ph:'Title'})}</h2><button class="snip-btn" data-snip="${e.id}" title="save this review to the Writing Studio">✂ save to writing</button></div>
    <div class="row" style="gap:14px;margin:6px 0 18px;flex-wrap:wrap">
      <span class="mono">by</span><span style="flex:1;min-width:8em">${ed(`entries.#${e.id}.extra.creator`,{ph:'who made it'})}</span>
      <span class="mono">year</span>${ed(`entries.#${e.id}.extra.year`,{ph:'—',cls:'mono'})}
    </div>
    <div class="row" style="gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <select class="sel" style="width:auto" id="mpStatus">${MEDIA_STATUS.map(s=>`<option value="${s}" ${x.status===s?'selected':''}>${MEDIA_STATUS_LABEL[s]}</option>`).join('')}</select>
      <select class="sel" style="width:auto" id="mpKind">${Object.entries(MEDIA_KINDS).map(([kk,v])=>`<option value="${kk}" ${x.kind===kk?'selected':''}>${v[0]} ${v[1]}</option>`).join('')}</select>
    </div>
    <div class="spec-grid" style="margin-bottom:14px">
      <div><div class="k">started</div>${ed(`entries.#${e.id}.extra.startedAt`,{ph:'YYYY-MM-DD',cls:'mono'})}</div>
      <div><div class="k">date consumed (finished)</div>${ed(`entries.#${e.id}.extra.finishedAt`,{ph:'YYYY-MM-DD',cls:'mono'})}</div>
    </div>

    <div class="vp-sec"><span class="sc">Resonance — not "was it good?", but "what did it do to me?"</span>
      <div class="resonance-scale" id="mpRes">${RESONANCE_LEVELS.map(([kk,label,color])=>`<button class="${x.resonanceLevel===kk?'on':''}" style="--c:${color}" data-res="${kk}">${label}</button>`).join('')}</div></div>

    <div class="vp-sec"><span class="sc">One-line capture</span><div class="faint" style="font-size:.78rem;margin-bottom:6px">In one sentence, what is this about at its deepest level?</div>${ed(`entries.#${e.id}.extra.oneLineCapture`,{cls:'quote',ph:'Force the distillation.'})}</div>

    <div class="vp-sec"><span class="sc">What it installed in me</span><div class="faint" style="font-size:.78rem;margin-bottom:6px">The belief, idea, fear, or capability this work left behind — the same field a formative event on the Timeline uses, so the two show up side by side when you trace a thread.</div>${ed(`entries.#${e.id}.extra.installed`,{multi:true,mdr:true,cls:'prose',ph:'…'})}</div>

    <div class="vp-sec"><div class="row between"><span class="sc">Quotes &amp; marginalia</span><button class="btn sm ghost" id="mpAddQ">＋ quote</button></div>
      <p class="faint" style="font-size:.78rem">The lines worth carrying out. These auto-feed into the Quotes &amp; Marginalia journal.</p>
      ${(x.quotes||[]).map((qq,i)=>`<div class="passage"><div class="passage-q">${ed(`entries.#${e.id}.extra.quotes.${i}.text`,{multi:true,cls:'quote',ph:'the line itself',hook:'syncquote:'+e.id})}</div><div class="row between"><span class="mono">${ed(`entries.#${e.id}.extra.quotes.${i}.where`,{ph:'page / timestamp',cls:'mono',hook:'syncquote:'+e.id})}</span><button class="del-x inline" data-qdel="${i}" title="delete quote">×</button></div><div class="passage-note"><span class="k mono" style="font-size:.62rem">why this caught me</span>${ed(`entries.#${e.id}.extra.quotes.${i}.why`,{multi:true,ph:'required — what it caught in you',hook:'syncquote:'+e.id})}</div></div>`).join('') || '<div class="empty">No quotes yet.</div>'}</div>

    <div class="vp-sec"><span class="sc">Linked dimensions</span><div class="faint" style="font-size:.78rem;margin-bottom:8px">Life stage (so the Timeline view can actually find this), values touched (±), threads activated, visions fed, skills informed.</div>${linksEditorHTML(e.links, {stages:true})}</div>

    <div class="vp-sec"><span class="sc">The conversation</span><div class="faint" style="font-size:.78rem;margin-bottom:6px">The full review, as long or short as you want. Markdown welcome.</div>${ed(`entries.#${e.id}.body`,{multi:true,mdr:true,cls:'prose serif-lg',ph:'Anything that does not fit the fields above.'})}</div>

    <div class="vp-sec"><span class="sc">Would I recommend this?</span>
      <div class="row" style="gap:6px" id="mpRec">${['yes','conditionally','no'].map(v=>`<button class="btn sm ${x.recommend===v?'primary':'ghost'}" data-rec="${v}">${v}</button>`).join('')}</div>
      ${x.recommend && x.recommend!=='no' ? `<div class="field" style="margin-top:8px"><label>Who should read/watch this, and when?</label>${ed(`entries.#${e.id}.extra.recommendWho`,{ph:'…'})}</div>` : ''}</div>

    <div class="vp-sec"><span class="sc">Hashtags</span><div class="faint" style="font-size:.78rem;margin-bottom:6px">The thread this work belongs to. The Writing Studio's research drawer can pull every entry that shares a tag.</div>
      <input class="inp mono" id="mpTags" value="${esc((e.tags||[]).map(t=>'#'+t).join(' '))}" placeholder="#kyoto #jazz #craft" list="tagList2"><datalist id="tagList2">${allTags().map(([t])=>`<option value="#${esc(t)}">`).join('')}</datalist></div>

    ${moreSection(`<div class="danger-zone"><span>This removes the work, its quotes, and everything you wrote about it.</span><button class="btn sm ghost danger" id="mpDel">Delete this entry</button></div>`)}`, 'media-panel');
  p.querySelector('#mpStatus').onchange = ev => { x.status = ev.target.value; if(x.status==='finished' && !x.finishedAt) x.finishedAt = today(); if(x.status==='progress' && !x.startedAt) x.startedAt = today(); saveNow(); reopen(); };
  p.querySelector('#mpKind').onchange = ev => { x.kind = ev.target.value; saveNow(); reopen(); };
  p.querySelectorAll('[data-res]').forEach(b => b.onclick = () => { x.resonanceLevel = (x.resonanceLevel===b.dataset.res) ? null : b.dataset.res; saveNow(); sound('click'); reopen(); });
  p.querySelector('#mpAddQ').onclick = () => { x.quotes.push({id:uid(), text:'', where:'', why:''}); saveNow(); reopen(); setTimeout(()=>{ const n = document.querySelectorAll('#panel .passage-q .ed'); n.length && beginEdit(n[n.length-1]); },60); };
  p.querySelectorAll('[data-qdel]').forEach(b => b.onclick = () => { const i = +b.dataset.qdel; requestDelete({label:'Quote', node:b.closest('.passage'), remove:()=>{ const gone = x.quotes.splice(i,1)[0]; if(gone.quoteEntryId){ const qe = byId(S.entries, gone.quoteEntryId); if(qe) S.entries.splice(S.entries.indexOf(qe),1); } return () => x.quotes.splice(i,0,gone); }, after:reopen}); });
  bindLinksEditor(p, e.links, reopen);
  p.querySelectorAll('[data-rec]').forEach(b => b.onclick = () => { x.recommend = (x.recommend===b.dataset.rec) ? '' : b.dataset.rec; saveNow(); reopen(); });
  const tagI = p.querySelector('#mpTags'); tagI.onchange = () => { e.tags = normTags(tagI.value.split(/[\s,]+/)); saveNow(); reopen(); };
  p.querySelector('#mpDel').onclick = () => requestDelete({label:e.title||'this entry', remove:()=>{ (x.quotes||[]).forEach(q=>{ if(q.quoteEntryId){ const qe = byId(S.entries,q.quoteEntryId); if(qe) S.entries.splice(S.entries.indexOf(qe),1); } }); return spliceOut(S.entries, y=>y.id===e.id); }, after:()=>{ closePanel(); rerender(); }});
  bindVmToggle(p, 'media');
}
