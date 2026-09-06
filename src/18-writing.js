/* ============================================================
   WRITING — a room for the long thought.
   Set an intention, choose the hashtags it draws on, and the
   entries carrying those tags line up beside the page as source
   material. Pieces are entries of type `writing`.
   ============================================================ */
function writings(){ return S.entries.filter(e => e.type === 'writing').sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||'')); }
function wordCount(s){ const t = (s||'').trim(); return t ? t.split(/\s+/).length : 0; }
function newWriting(){
  const e = {id:uid(), type:'writing', title:'', body:'', occurredAt:today(), createdAt:new Date().toISOString(), media:[],
    links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[]}, people:[], places:[], emotions:[], tags:[], confidence:'',
    extra:{intention:'', sourceTags:[], wordTarget:0, status:'drafting'}};
  S.entries.push(e); saveNow(); return e;
}
routes.writing = function(root, params){
  registerPageEntry({pageName:'Writing', addLabel:'New piece', defaultEntryType:'writing', prefilledFields:{}, options:[
    {icon:'✒', label:'New piece', desc:'Set an intention, then write.', run:()=>{ const e = newWriting(); location.hash = '#/writing/'+e.id; }}]});
  if(params[0]) return renderWritingDesk(root, params[0]);
  const ws = writings();
  root.innerHTML = `<div class="page">
    <div class="page-head"><h1>Writing</h1><div class="sub">Thinking that takes longer than a journal entry. Name the intention first; the room gathers what you have already written on the subject.</div></div>
    ${ws.length ? `<div class="grid c2">${ws.map(e => { const x = e.extra||{}; const n = wordCount(e.body); return `<div class="card rv writing-card" data-wopen="${e.id}" style="cursor:pointer">
        <div class="row between"><h3 style="margin:0">${esc(e.title || 'Untitled piece')}</h3><span class="status-pill">${esc(x.status||'drafting')}</span></div>
        ${x.intention?`<div class="quote" style="font-size:.92rem;margin-top:6px">${esc(x.intention)}</div>`:''}
        <div class="row between" style="margin-top:10px"><span class="mono">${n} word${n===1?'':'s'}${x.wordTarget?` of ${x.wordTarget}`:''}</span><span class="mono">${fmtDate((e.createdAt||'').slice(0,10),'med')}</span></div>
        ${x.wordTarget?`<div class="bar" style="margin-top:6px"><i style="width:${clamp(n/x.wordTarget*100,0,100)}%"></i></div>`:''}
        ${(x.sourceTags||[]).length?`<div class="tagrow">${x.sourceTags.map(t=>`<span class="tag">#${esc(t)}</span>`).join('')}</div>`:''}
      </div>`; }).join('')}</div>`
    : `<div class="empty rv">Nothing written here yet. A piece starts with one sentence about why you are writing it.</div>`}
    <section class="section rv"><span class="sc">Threads you could pull on</span>
      <p class="muted" style="font-size:.85rem">Your most-used hashtags. Each one is a pile of material already waiting.</p>
      <div class="tag-cloud" style="margin-top:10px">${allTags().slice(0,26).map(([t,n])=>`<a class="tag" href="#/tag/${encodeURIComponent(t)}" style="--n:${Math.min(n,5)}">#${esc(t)}<span class="n">${n}</span></a>`).join('') || '<span class="faint">Tag some entries and they will collect here.</span>'}</div></section>
  </div>`;
  $$('[data-wopen]',root).forEach(c => c.onclick = () => { location.hash = '#/writing/'+c.dataset.wopen; });
};
function renderWritingDesk(root, id){
  const e = byId(S.entries, id); if(!e){ navigate('#/writing'); return; }
  const x = e.extra = e.extra || {}; x.sourceTags = normTags(x.sourceTags||[]);
  const sources = x.sourceTags.length
    ? sortEntries(S.entries.filter(y => y.id !== e.id && entryTags(y).some(t => x.sourceTags.includes(t))))
    : [];
  const n = wordCount(e.body); const focus = !!S._writeFocus;
  root.innerHTML = `<div class="page ${focus?'write-focus':''}">
    <div class="row between rv" style="margin-bottom:16px"><a class="btn sm ghost" href="#/writing">‹ all pieces</a>
      <div class="row"><span class="mono">${n} word${n===1?'':'s'}${x.wordTarget?` · ${clamp(Math.round(n/x.wordTarget*100),0,999)}% of ${x.wordTarget}`:''}</span>
        <select class="sel" style="width:auto" id="wStatus">${['drafting','resting','revising','finished'].map(s=>`<option ${x.status===s?'selected':''}>${s}</option>`).join('')}</select>
        <button class="btn sm ${focus?'primary':'ghost'}" id="wFocus" title="hide everything but the page">${focus?'✓ focus':'focus'}</button></div></div>

    <div class="writing-head rv">
      <h1 class="write-title">${ed(`entries.#${e.id}.title`,{ph:'Title it later if you like'})}</h1>
      <div class="field"><label>Intention — what am I trying to work out?</label>${ed(`entries.#${e.id}.extra.intention`,{multi:true,cls:'quote',ph:'One or two sentences. Not the topic — the question underneath it.'})}</div>
      <div class="row" style="gap:10px;flex-wrap:wrap;align-items:flex-end">
        <div class="field" style="flex:1;min-width:240px"><label>Draw on these hashtags</label>
          <input class="inp mono" id="wTags" value="${esc(x.sourceTags.map(t=>'#'+t).join(' '))}" placeholder="#kyoto #jazz" list="wTagList"><datalist id="wTagList">${allTags().map(([t,c])=>`<option value="#${esc(t)}">${c}</option>`).join('')}</datalist></div>
        <div class="field"><label>Word target</label><input class="inp mono" id="wTarget" type="number" min="0" step="100" value="${x.wordTarget||''}" placeholder="0" style="width:8em"></div>
      </div>
      ${allTags().length?`<div class="tag-cloud" style="margin-top:8px">${allTags().slice(0,18).map(([t,c])=>`<button class="tag ${x.sourceTags.includes(t)?'on':''}" data-wtag="${esc(t)}">#${esc(t)}<span class="n">${c}</span></button>`).join('')}</div>`:''}
    </div>

    <div class="write-layout">
      <div class="write-page rv"><textarea class="ta write-area" id="wBody" placeholder="Begin anywhere. You can fix the beginning last.">${esc(e.body)}</textarea></div>
      <aside class="write-rail rv">
        <div class="sc">Source material</div>
        <p class="faint" style="font-size:.76rem">${x.sourceTags.length ? `${sources.length} entr${sources.length===1?'y':'ies'} carrying ${x.sourceTags.map(t=>'#'+t).join(', ')}.` : 'Choose a hashtag above and everything you have written on it appears here.'}</p>
        <div class="rail-list">${sources.slice(0,40).map(s=>`<div class="rail-item" data-railq="${s.id}">
          <div class="mono">${typeIcon(s.type)} ${esc(fmtDate(s.occurredAt,'med'))}</div>
          ${s.title?`<div class="rail-title">${esc(s.title)}</div>`:''}
          <div class="rail-body">${esc((s.body||'').slice(0,260))}${(s.body||'').length>260?'…':''}</div>
          <button class="tbtn" data-quote="${s.id}" title="quote this into the page">quote →</button>
        </div>`).join('') || (x.sourceTags.length?'<div class="empty">Nothing carries those tags yet.</div>':'')}</div>
      </aside>
    </div>
    ${moreSection(`<div class="danger-zone"><span>This deletes the piece and its text.</span><button class="btn sm ghost danger" id="wDel">Delete this piece</button></div>`)}
  </div>`;
  const ta = $('#wBody');
  const grow = () => { ta.style.height = 'auto'; ta.style.height = Math.max(420, ta.scrollHeight) + 'px'; }; grow();
  const save = debounce(() => { e.body = ta.value; e.updatedAt = new Date().toISOString(); saveNow(); const w = $('.row.between .mono'); if(w) w.textContent = `${wordCount(ta.value)} words${x.wordTarget?` · ${clamp(Math.round(wordCount(ta.value)/x.wordTarget*100),0,999)}% of ${x.wordTarget}`:''}`; }, 600);
  ta.addEventListener('input', () => { grow(); save(); });
  $('#wFocus').onclick = () => { S._writeFocus = !S._writeFocus; rerender(); setTimeout(()=>$('#wBody')?.focus(),60); };
  $('#wStatus').onchange = ev => { x.status = ev.target.value; saveNow(); };
  $('#wTarget').onchange = ev => { x.wordTarget = +ev.target.value || 0; saveNow(); rerender(); };
  const tagI = $('#wTags'); tagI.onchange = () => { x.sourceTags = normTags(tagI.value.split(/[\s,]+/)); saveNow(); rerender(); };
  $$('[data-wtag]',root).forEach(b => b.onclick = () => { const t = b.dataset.wtag; x.sourceTags = x.sourceTags.includes(t) ? x.sourceTags.filter(y=>y!==t) : [...x.sourceTags, t]; saveNow(); rerender(); });
  $$('[data-quote]',root).forEach(b => b.onclick = ev => { ev.stopPropagation(); const s = byId(S.entries, b.dataset.quote); if(!s) return;
    const block = `\n\n> ${(s.body||s.title||'').trim().replace(/\n/g,'\n> ')}\n> — ${s.title || typeName(s.type)}, ${fmtDate(s.occurredAt,'med')}\n\n`;
    ta.value = ta.value + block; e.body = ta.value; saveNow(); grow(); sound('click'); toast('Quoted into the page.'); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); });
  $('#wDel').onclick = () => requestDelete({label:e.title||'this piece', remove:()=>spliceOut(S.entries, y=>y.id===e.id), after:()=>navigate('#/writing')});
}
