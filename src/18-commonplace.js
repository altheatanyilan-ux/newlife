/* ============================================================
   COMMONPLACE BOOK — what you read, watched, heard, and what it
   changed. Not a rating site: the prompts ask what a work did to
   you, what you argued with, and what you intend to steal.
   Stored as entries of type `media`, so search and hashtags work.
   ============================================================ */
const MEDIA_KINDS = {
  book:      ['📗','Book',       '#7f916a'],
  film:      ['🎞','Film',       '#a0727e'],
  series:    ['📺','Series',     '#6b7f8e'],
  album:     ['🎵','Album',      '#b08968'],
  article:   ['📄','Article',    '#8a8d8f'],
  talk:      ['🎤','Talk',       '#c47832'],
  exhibition:['🖼','Exhibition', '#9a8fb8'],
  game:      ['🎮','Game',       '#6fa39a'],
};
const MEDIA_STATUS = ['wishlist','reading','finished','abandoned'];
const MEDIA_PROMPTS = [
  ['oneLine',   'In one sentence, to a friend',   'What is it, and is it worth their evening?'],
  ['resonance', 'Why it caught me',                'What in my own life was it answering? Be specific — a season, a question, a person.'],
  ['argued',    'Where I argued with it',          'The part that felt false, thin, or too easy. Disagreement is where reading becomes thinking.'],
  ['steal',     'What I am stealing',              'A technique, a sentence rhythm, a way of framing. Name the thing you will actually use.'],
  ['changed',   'What it changed',                 'One thing you will do differently. If nothing, say that honestly.'],
];
function mediaEntries(){ return S.entries.filter(e => e.type === 'media'); }
function mediaX(e){ e.extra = e.extra || {}; return e.extra; }
function migrateMedia(){ mediaEntries().forEach(e => { const x = mediaX(e); x.kind = x.kind || 'book'; x.status = MEDIA_STATUS.includes(x.status) ? x.status : 'finished'; x.rating = +x.rating || 0; x.passages = Array.isArray(x.passages) ? x.passages : []; }); }
function mediaStars(n, {click=false, id=''}={}){ return `<span class="stars ${click?'click':''}" ${click?`data-stars="${id}"`:''}>${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}" data-star="${i}">★</i>`).join('')}</span>`; }
routes.commonplace = function(root, params){
  registerPageEntry({pageName:'Commonplace Book', addLabel:'Log a work', defaultEntryType:'media', prefilledFields:{}, options:[
    {icon:'📗', label:'Book', desc:'Something you are reading or have read.', run:()=>openMediaModal({kind:'book'})},
    {icon:'🎞', label:'Film or series', desc:'Something you watched.', run:()=>openMediaModal({kind:'film'})},
    {icon:'🎵', label:'Album or talk', desc:'Something you listened to.', run:()=>openMediaModal({kind:'album'})}]});
  const all = mediaEntries();
  const kind = S._mKind || 'all', status = S._mStatus || 'all', q = (S._mq||'').toLowerCase();
  const list = all.filter(e => { const x = mediaX(e);
      return (kind==='all' || x.kind===kind) && (status==='all' || x.status===status)
        && (!q || `${e.title} ${x.creator||''} ${e.body||''} ${entryTags(e).join(' ')}`.toLowerCase().includes(q)); })
    .sort((a,b) => (mediaX(b).finishedAt||b.occurredAt||'').localeCompare(mediaX(a).finishedAt||a.occurredAt||''));
  const finished = all.filter(e => mediaX(e).status === 'finished');
  const thisYear = finished.filter(e => (mediaX(e).finishedAt||e.occurredAt||'').slice(0,4) === String(new Date().getFullYear()));
  const counts = {}; all.forEach(e => { const k = mediaX(e).kind; counts[k] = (counts[k]||0)+1; });
  root.innerHTML = `<div class="page">
    <div class="page-head"><h1>Commonplace Book</h1><div class="sub">Everything that went in, and what it did once it was there. A rating is the least interesting thing on this page.</div></div>

    <div class="card rv" style="margin-bottom:20px"><div class="income-strip">
      <div><div class="k">finished this year</div><div class="num" data-tween="${thisYear.length}">0</div><div class="mono">${finished.length} in all</div></div>
      <div><div class="k">in progress</div><div class="num" data-tween="${all.filter(e=>mediaX(e).status==='reading').length}">0</div></div>
      <div><div class="k">waiting</div><div class="num" data-tween="${all.filter(e=>mediaX(e).status==='wishlist').length}">0</div></div>
      <div><div class="k">average rating</div><div class="num">${finished.filter(e=>mediaX(e).rating).length ? avg(finished.filter(e=>mediaX(e).rating).map(e=>mediaX(e).rating)).toFixed(1) : '—'}</div><div class="mono">of the rated ones</div></div>
    </div></div>

    <div class="row rv" style="gap:8px;flex-wrap:wrap;margin-bottom:14px">
      <input class="inp" id="mq" placeholder="search title, maker, notes, tags" value="${esc(S._mq||'')}" style="flex:1;min-width:200px">
      <select class="sel" id="mKind" style="width:auto"><option value="all">every kind</option>${Object.entries(MEDIA_KINDS).map(([k,v])=>`<option value="${k}" ${kind===k?'selected':''}>${v[0]} ${v[1]}${counts[k]?` (${counts[k]})`:''}</option>`).join('')}</select>
      <select class="sel" id="mStatus" style="width:auto"><option value="all">any status</option>${MEDIA_STATUS.map(s=>`<option value="${s}" ${status===s?'selected':''}>${s}</option>`).join('')}</select>
    </div>

    <div class="shelf-grid rv">${list.length ? list.map(e => { const x = mediaX(e); const k = MEDIA_KINDS[x.kind] || MEDIA_KINDS.book;
      return `<div class="work" data-mopen="${e.id}" style="--c:${k[2]}">
        <div class="work-spine">${k[0]}</div>
        <div class="work-body">
          <div class="work-title">${esc(e.title||'Untitled')}</div>
          <div class="mono work-maker">${esc(x.creator||'')}${x.year?` · ${esc(x.year)}`:''}</div>
          <div class="row between" style="margin-top:6px"><span class="status-pill">${esc(x.status)}</span>${x.rating?mediaStars(x.rating):'<span class="faint mono">unrated</span>'}</div>
          ${x.oneLine?`<div class="work-line">${esc(x.oneLine)}</div>`:''}
          ${entryTags(e).length?tagChips(e):''}
        </div></div>`; }).join('')
      : `<div class="empty">Nothing logged yet. The first one can be whatever you happen to be in the middle of.</div>`}</div>

    ${all.length ? `<section class="section rv"><span class="sc">What you keep coming back to</span>
      <div class="tag-cloud" style="margin-top:10px">${allTags().filter(([t]) => mediaEntries().some(e=>entryTags(e).includes(t))).slice(0,24).map(([t,n])=>`<a class="tag" href="#/tag/${encodeURIComponent(t)}" style="--n:${Math.min(n,5)}">#${esc(t)}<span class="n">${n}</span></a>`).join('') || '<span class="faint">Tag a few works and the pattern shows up here.</span>'}</div></section>` : ''}
  </div>`;
  $('#mq').oninput = debounce(e => { S._mq = e.target.value; rerender(); const i = $('#mq'); if(i){ i.focus(); i.setSelectionRange(i.value.length,i.value.length); } }, 350);
  $('#mKind').onchange = e => { S._mKind = e.target.value; rerender(); };
  $('#mStatus').onchange = e => { S._mStatus = e.target.value; rerender(); };
  $$('[data-mopen]',root).forEach(c => c.onclick = () => openMediaPanel(c.dataset.mopen));
  if(params[0]) openMediaPanel(params[0]);
};
function openMediaModal(pre={}){
  const kinds = Object.entries(MEDIA_KINDS);
  const m = openModal(`<h2>Log a work</h2>
    <div class="typerow" id="mkRow">${kinds.map(([k,v])=>`<button class="${(pre.kind||'book')===k?'on':''}" data-mk="${k}">${v[0]} ${v[1]}</button>`).join('')}</div>
    <div class="stack">
      <input class="inp serif-lg" id="mTitle" placeholder="Title" autofocus>
      <div class="grid c3" style="gap:8px">
        <input class="inp" id="mCreator" placeholder="Who made it">
        <input class="inp" id="mYear" placeholder="Year">
        <select class="sel" id="mStat">${MEDIA_STATUS.map(s=>`<option value="${s}" ${s==='reading'?'selected':''}>${s}</option>`).join('')}</select>
      </div>
      <div class="row" style="justify-content:flex-end"><button class="btn primary" id="mSave">Add to the shelf</button></div>
    </div>`, 'narrow');
  let kind = pre.kind || 'book';
  m.querySelectorAll('[data-mk]').forEach(b => b.onclick = () => { kind = b.dataset.mk; m.querySelectorAll('[data-mk]').forEach(x=>x.classList.toggle('on', x===b)); });
  m.querySelector('#mSave').onclick = () => {
    const title = m.querySelector('#mTitle').value.trim(); if(!title){ toast('It needs a title, at least.'); return; }
    const st = m.querySelector('#mStat').value;
    const e = {id:uid(), type:'media', title, body:'', occurredAt:today(), createdAt:new Date().toISOString(), media:[], links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[]}, people:[], places:[], emotions:[], tags:[], confidence:'',
      extra:{kind, creator:m.querySelector('#mCreator').value.trim(), year:m.querySelector('#mYear').value.trim(), status:st, rating:0, passages:[], startedAt: st==='reading'?today():'', finishedAt: st==='finished'?today():'', oneLine:'', resonance:'', argued:'', steal:'', changed:''}};
    S.entries.push(e); saveNow(); m.remove(); sound('success'); rerender(); openMediaPanel(e.id);
  };
}
function openMediaPanel(id){
  const e = byId(S.entries, id); if(!e || e.type !== 'media') return;
  const x = mediaX(e); const k = MEDIA_KINDS[x.kind] || MEDIA_KINDS.book;
  const p = openPanel(`<div class="mono">${k[0]} ${k[1].toLowerCase()} · ${esc(x.status)}</div>
    <h2>${ed(`entries.#${e.id}.title`,{ph:'Title'})}</h2>
    <div class="row" style="gap:14px;margin:6px 0 18px;flex-wrap:wrap">
      <span class="mono">by</span><span style="flex:1;min-width:8em">${ed(`entries.#${e.id}.extra.creator`,{ph:'who made it'})}</span>
      <span class="mono">year</span>${ed(`entries.#${e.id}.extra.year`,{ph:'—',cls:'mono'})}
    </div>
    <div class="row" style="gap:10px;flex-wrap:wrap;margin-bottom:18px">
      <select class="sel" style="width:auto" id="mpStatus">${MEDIA_STATUS.map(s=>`<option value="${s}" ${x.status===s?'selected':''}>${s}</option>`).join('')}</select>
      <select class="sel" style="width:auto" id="mpKind">${Object.entries(MEDIA_KINDS).map(([kk,v])=>`<option value="${kk}" ${x.kind===kk?'selected':''}>${v[0]} ${v[1]}</option>`).join('')}</select>
      ${mediaStars(x.rating,{click:true,id:e.id})}
    </div>
    <div class="spec-grid" style="margin-bottom:18px">
      <div><div class="k">started</div>${ed(`entries.#${e.id}.extra.startedAt`,{ph:'YYYY-MM-DD',cls:'mono'})}</div>
      <div><div class="k">finished</div>${ed(`entries.#${e.id}.extra.finishedAt`,{ph:'YYYY-MM-DD',cls:'mono'})}</div>
    </div>

    ${MEDIA_PROMPTS.map(([key,label,hint]) => `<div class="vp-sec"><span class="sc">${label}</span><div class="faint" style="font-size:.78rem;margin:2px 0 6px">${hint}</div>${ed(`entries.#${e.id}.extra.${key}`,{multi:true,mdr:true,cls:'prose',ph:'…'})}</div>`).join('')}

    <div class="vp-sec"><div class="row between"><span class="sc">Passages</span><button class="btn sm ghost" id="mpAddP">＋ passage</button></div>
      <p class="faint" style="font-size:.78rem">The lines worth carrying out. Add where it came from so you can find it again.</p>
      ${(x.passages||[]).map((_,i)=>`<div class="passage"><div class="passage-q">${ed(`entries.#${e.id}.extra.passages.${i}.text`,{multi:true,cls:'quote',ph:'the line itself'})}</div><div class="row between"><span class="mono">${ed(`entries.#${e.id}.extra.passages.${i}.where`,{ph:'page / chapter / timestamp',cls:'mono'})}</span><button class="del-x inline" data-pdel="${i}" title="delete passage">×</button></div><div class="passage-note">${ed(`entries.#${e.id}.extra.passages.${i}.note`,{multi:true,ph:'and what you make of it'})}</div></div>`).join('') || '<div class="empty">No passages yet.</div>'}</div>

    <div class="vp-sec"><span class="sc">Hashtags</span><div class="faint" style="font-size:.78rem;margin-bottom:6px">The thread this work belongs to. The Writing room can pull every entry that shares a tag.</div>
      <input class="inp mono" id="mpTags" value="${esc((e.tags||[]).map(t=>'#'+t).join(' '))}" placeholder="#kyoto #jazz #craft" list="tagList2"><datalist id="tagList2">${allTags().map(([t])=>`<option value="#${esc(t)}">`).join('')}</datalist></div>

    <div class="vp-sec"><span class="sc">Loose notes</span>${ed(`entries.#${e.id}.body`,{multi:true,mdr:true,cls:'prose',ph:'Anything that does not fit the prompts above.'})}</div>

    ${moreSection(`<div class="danger-zone"><span>This removes the work and everything you wrote about it.</span><button class="btn sm ghost danger" id="mpDel">Delete this entry</button></div>`)}`, 'media-panel');
  const reopen = () => { rerender(); openMediaPanel(id); };
  p.querySelector('#mpStatus').onchange = ev => { x.status = ev.target.value; if(x.status==='finished' && !x.finishedAt) x.finishedAt = today(); if(x.status==='reading' && !x.startedAt) x.startedAt = today(); saveNow(); reopen(); };
  p.querySelector('#mpKind').onchange = ev => { x.kind = ev.target.value; saveNow(); reopen(); };
  p.querySelectorAll('[data-stars] i').forEach(st => st.onclick = () => { x.rating = (+st.dataset.star === x.rating) ? 0 : +st.dataset.star; saveNow(); sound('click'); reopen(); });
  p.querySelector('#mpAddP').onclick = () => { x.passages.push({text:'', where:'', note:''}); saveNow(); reopen(); setTimeout(()=>{ const n = document.querySelectorAll('#panel .passage-q .ed'); n.length && beginEdit(n[n.length-1]); },60); };
  p.querySelectorAll('[data-pdel]').forEach(b => b.onclick = () => { const i = +b.dataset.pdel; requestDelete({label:'Passage', node:b.closest('.passage'), remove:()=>{ const gone = x.passages.splice(i,1)[0]; return () => x.passages.splice(i,0,gone); }, after:reopen}); });
  const tagI = p.querySelector('#mpTags'); tagI.onchange = () => { e.tags = normTags(tagI.value.split(/[\s,]+/)); saveNow(); reopen(); };
  p.querySelector('#mpDel').onclick = () => requestDelete({label:e.title||'this entry', remove:()=>spliceOut(S.entries, y=>y.id===e.id), after:()=>{ closePanel(); rerender(); }});
}
