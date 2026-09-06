/* ============================================================
   CHRONICLE — the story layer.
   Journal keeps days. Timeline keeps moments. Vision keeps
   goals. None of them answer the question this room exists for:
   what is the shape of this life — its chapters, its turning
   points, and the themes that run through all of them.
   Narrative-identity research is fairly blunt about it: people
   who can tell a coherent story of their own life do better at
   deciding what to do next. This is meaning-making equipment,
   not documentation.
   ============================================================ */
const TURN_TYPES = {
  decision:    ['⚖','Decision',    'you chose, and the choosing mattered',      '#c25b5b'],
  event:       ['◆','Event',       'something happened to you',                 '#6b7f8e'],
  realisation: ['✦','Realisation', 'you saw something you could not unsee',     '#d4a44c'],
  loss:        ['◌','Loss',        'something ended',                           '#8e5f6b'],
  achievement: ['▲','Achievement', 'you got there',                             '#7f916a'],
  encounter:   ['☺','Encounter',   'someone walked in and the trajectory bent', '#a0727e'],
};
const CH_STATUS = {closed:['closed','#8a8d8f'], active:['live','#7f916a'], future:['ahead','#6b7f8e']};
function migrateChronicle(){
  S.chapters = Array.isArray(S.chapters) ? S.chapters : [];
  S.turns = Array.isArray(S.turns) ? S.turns : [];
  S.threadsN = Array.isArray(S.threadsN) ? S.threadsN : [];
  S.chapters.forEach(c => { c.status = CH_STATUS[c.status] ? c.status : (c.endDate ? 'closed' : 'active'); c.narrative = c.narrative || ''; c.theme = c.theme || ''; c.color = c.color || '#b08968'; });
  S.turns.forEach(t => { t.type = TURN_TYPES[t.type] ? t.type : 'event'; ['linkedMemoryIds','linkedPeopleIds','linkedJournalIds','threadIds'].forEach(k => t[k] = Array.isArray(t[k]) ? t[k] : []); t.impact = t.impact || ''; t.lesson = t.lesson || ''; t.emotion = t.emotion || ''; });
  S.threadsN.forEach(t => { t.color = t.color || '#7f916a'; t.description = t.description || ''; });
  S.chapters.sort((a,b) => (a.startDate||'').localeCompare(b.startDate||''));
}
const chapterTurns = id => S.turns.filter(t => t.chapterId === id).sort((a,b) => (a.date||'').localeCompare(b.date||''));
const threadTurns  = id => S.turns.filter(t => (t.threadIds||[]).includes(id)).sort((a,b) => (a.date||'').localeCompare(b.date||''));
function chapterFor(date){ return S.chapters.find(c => (!c.startDate || c.startDate <= date) && (!c.endDate || c.endDate >= date)) || null; }
function newChapter(){ const last = S.chapters[S.chapters.length-1];
  return {id:uid(), title:'', subtitle:'', startDate: last?.endDate || today(), endDate:null, status:'active', theme:'', color:'#b08968', linkedEraId:null, coverImage:null, narrative:''}; }
function newTurn(chapterId){ return {id:uid(), chapterId, title:'', date:today(), type:'decision', description:'', impact:'', lesson:'', emotion:'',
  linkedMemoryIds:[], linkedPeopleIds:[], linkedJournalIds:[], threadIds:[]}; }

routes.chronicle = function(root, params){
  migrateChronicle();
  const view = params[0] === 'analysis' ? 'analysis' : params[0] === 'print' ? 'print' : 'timeline';
  registerPageEntry({pageName:'Chronicle', addLabel:'Add to the story', defaultEntryType:'chapter', prefilledFields:{}, options:[
    {icon:'▤', label:'Chapter', desc:'A period of your life, named in hindsight.', run:()=>openChapterModal()},
    {icon:'◆', label:'Turning point', desc:'A moment that changed the trajectory.', run:()=>openTurnModal()},
    {icon:'〜', label:'Thread', desc:'A theme that runs across chapters.', run:()=>openThreadModal()}]});
  root.innerHTML = `<div class="page">
    <div class="page-head"><h1>Chronicle</h1><div class="sub">Journal keeps your days; Timeline keeps your moments. This keeps the shape — the chapters, the moments the trajectory bent, and the themes that run through all of it.</div></div>
    <div class="tabs">${[['timeline','Narrative timeline'],['analysis','Patterns'],['print','Print the book']].map(([k,l])=>`<button class="${view===k?'active':''}" data-chv="${k}">${l}</button>`).join('')}</div>
    <div id="chBody"></div></div>`;
  ({timeline:chronTimeline, analysis:chronAnalysis, print:chronPrint}[view])($('#chBody'));
  $$('[data-chv]',root).forEach(b => b.onclick = () => navigate('#/chronicle' + (b.dataset.chv === 'timeline' ? '' : '/' + b.dataset.chv)));
  reveal(root);
};
/* ---------- the narrative timeline ---------- */
function chronTimeline(box){
  const chs = S.chapters;
  if(!chs.length){
    box.innerHTML = `<div class="empty rv" style="padding:40px 24px">
      <p style="max-width:52ch;margin:0 auto 16px">No chapters yet. A chapter is a stretch of your life you can put a name to in hindsight — “the Singapore years”, “after the diagnosis”, “learning to stand alone”. Two or three is enough to start.</p>
      <button class="btn primary" id="chFirst">Name the first chapter</button></div>`;
    $('#chFirst').onclick = () => openChapterModal(); return;
  }
  const allDates = [...chs.map(c=>c.startDate), ...chs.map(c=>c.endDate||today()), ...S.turns.map(t=>t.date)].filter(Boolean).sort();
  const t0 = parseDay(allDates[0]).getTime(), t1 = parseDay(allDates[allDates.length-1]).getTime();
  const span = Math.max(t1 - t0, DAY*365);
  const W = Math.max(900, chs.length * 260), H = 40 + chs.length * 74 + 60;
  const X = d => 60 + ((parseDay(d).getTime() - t0) / span) * (W - 110);
  const rowY = i => 46 + i * 74;
  const threadPaths = S.threadsN.map(th => {
    const pts = threadTurns(th.id).map(t => { const i = chs.findIndex(c => c.id === t.chapterId); return i < 0 ? null : [X(t.date), rowY(i) + 22]; }).filter(Boolean);
    if(pts.length < 2) return '';
    const d = pts.map((p,i) => i === 0 ? `M${p[0].toFixed(1)},${p[1].toFixed(1)}` :
      `Q${((pts[i-1][0]+p[0])/2).toFixed(1)},${(Math.min(pts[i-1][1],p[1]) - 26).toFixed(1)} ${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    return `<path class="th-line" data-thline="${th.id}" d="${d}" stroke="${th.color}" fill="none" stroke-width="2" opacity=".5"><title>${esc(th.name)}</title></path>`;
  }).join('');
  box.innerHTML = `
    <div class="chron-scroll rv"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="chron-svg">
      ${chs.map((c,i) => { const x0 = X(c.startDate), x1 = X(c.endDate || today()); const st = CH_STATUS[c.status];
        return `<g class="ch-block ${c.status} ${S._chSel===c.id?'sel':''}" data-chopen="${c.id}">
          <rect x="${x0.toFixed(1)}" y="${rowY(i)}" width="${Math.max(90, x1-x0).toFixed(1)}" height="44" rx="8" fill="${c.color}" fill-opacity=".18" stroke="${c.color}" stroke-opacity=".65"/>
          <text x="${(x0+12).toFixed(1)}" y="${rowY(i)+19}" class="ch-blk-t">${esc(c.title || 'Untitled chapter')}</text>
          <text x="${(x0+12).toFixed(1)}" y="${rowY(i)+34}" class="ch-blk-s">${esc(c.theme || c.subtitle || '')}</text>
          <text x="${(x1-8).toFixed(1)}" y="${rowY(i)+19}" text-anchor="end" class="ch-blk-d">${esc(st[0])}</text>
        </g>`; }).join('')}
      ${threadPaths}
      ${chs.map((c,i) => chapterTurns(c.id).map(t => { const ty = TURN_TYPES[t.type];
        return `<g class="turn-node" data-turnopen="${t.id}" transform="translate(${X(t.date).toFixed(1)},${rowY(i)+22})">
          <circle r="9" fill="${ty[3]}" fill-opacity=".9" stroke="var(--surface)" stroke-width="2"/>
          <title>${esc(t.title)} · ${esc(ty[1])} · ${esc(fmtDate(t.date,'med'))}</title></g>`; }).join('')).join('')}
      <line x1="${X(today()).toFixed(1)}" y1="30" x2="${X(today()).toFixed(1)}" y2="${H-30}" stroke="var(--page-accent)" stroke-dasharray="3 4" opacity=".5"/>
      <text x="${(X(today())+5).toFixed(1)}" y="${H-18}" class="ch-blk-d" style="fill:var(--page-accent)">now</text>
    </svg></div>

    <div class="row rv" style="gap:8px;margin-top:12px;flex-wrap:wrap">
      <button class="btn sm primary" id="chAdd">＋ Chapter</button>
      <button class="btn sm ghost" id="chTurn">＋ Turning point</button>
      <button class="btn sm ghost" id="chThread">＋ Thread</button>
      ${S.threadsN.length ? `<span class="row" style="gap:6px;margin-left:auto;flex-wrap:wrap">${S.threadsN.map(t=>`<button class="chip click" style="--c:${t.color}" data-thopen="${t.id}">〜 ${esc(t.name)} <span class="mono">${threadTurns(t.id).length}</span></button>`).join('')}</span>` : ''}
    </div>
    <div id="chDetail"></div>`;
  $('#chAdd').onclick = () => openChapterModal();
  $('#chTurn').onclick = () => openTurnModal();
  $('#chThread').onclick = () => openThreadModal();
  $$('[data-chopen]',box).forEach(g => g.onclick = () => { S._chSel = g.dataset.chopen; rerender(); setTimeout(()=>document.querySelector('#chDetail')?.scrollIntoView({block:'start',behavior:'smooth'}), 120); });
  $$('[data-turnopen]',box).forEach(g => g.onclick = e => { e.stopPropagation(); openTurnPanel(g.dataset.turnopen); });
  $$('[data-thopen]',box).forEach(b => b.onclick = () => openThreadModal(byId(S.threadsN, b.dataset.thopen)));
  if(S._chSel && byId(S.chapters, S._chSel)) renderChapterDetail($('#chDetail'), S._chSel);
}
function renderChapterDetail(box, id){
  const c = byId(S.chapters, id); if(!c) return;
  const turns = chapterTurns(id); const eras = typeof erasList === 'function' ? erasList() : [];
  const threads = S.threadsN.filter(t => turns.some(x => (x.threadIds||[]).includes(t.id)));
  box.innerHTML = `<section class="chapter-detail rv" style="--c:${c.color}">
    <div class="row between"><div><div class="mono">${esc(CH_STATUS[c.status][0])} chapter · ${esc(c.startDate||'')}${c.endDate?` – ${esc(c.endDate)}`:' – now'}</div>
      <h2 style="margin:2px 0">${ed(`chapters.#${c.id}.title`,{ph:'Name this chapter'})}</h2>
      <div class="quote">${ed(`chapters.#${c.id}.subtitle`,{ph:'a subtitle, if it helps'})}</div></div>
      <div class="row"><button class="btn sm ghost" id="cdEdit">edit</button><button class="del-x inline" id="cdDel" title="delete chapter">×</button></div></div>

    <div class="field" style="margin-top:14px"><label>The theme, in one line</label>${ed(`chapters.#${c.id}.theme`,{ph:'Learning to stand alone.',cls:'serif-lg'})}</div>

    <div class="row" style="gap:12px;margin-top:12px;flex-wrap:wrap;align-items:center">
      <span class="mono">${turns.length} turning point${turns.length===1?'':'s'}</span>
      ${threads.length?`<span class="row" style="gap:5px">${threads.map(t=>`<span class="chip on" style="--c:${t.color}">〜 ${esc(t.name)}</span>`).join('')}</span>`:''}
      ${eras.length?`<span class="row" style="gap:6px"><span class="mono">vision chapter</span><select class="sel" style="width:auto" id="cdEra"><option value="">—</option>${eras.map(e=>`<option value="${e.id}" ${c.linkedEraId===e.id?'selected':''}>${esc(e.name)}</option>`).join('')}</select></span>`:''}
    </div>

    ${turns.length ? `<div class="turn-list">${turns.map(t => { const ty = TURN_TYPES[t.type];
      return `<button class="turn-row" data-turnopen="${t.id}" style="--c:${ty[3]}">
        <span class="tr-ico">${ty[0]}</span>
        <span class="tr-body"><span class="row between"><b>${esc(t.title||'Untitled')}</b><span class="mono">${esc(fmtDate(t.date,'med'))}</span></span>
        <span class="tr-desc">${esc((t.description||'').slice(0,180))}${(t.description||'').length>180?'…':''}</span></span></button>`; }).join('')}</div>`
      : '<div class="empty" style="margin-top:12px">No turning points in this chapter yet. Not every event is one — only the moments after which something was different.</div>'}
    <button class="btn sm ghost" id="cdTurn" style="margin-top:10px">＋ turning point in this chapter</button>

    <div class="field" style="margin-top:20px"><label>Write the narrative</label>
      <div class="faint" style="font-size:.8rem;margin-bottom:6px">The memoir, not the record: what this stretch of your life was about, as you see it now. Hindsight is allowed — it is the whole point.</div>
      ${ed(`chapters.#${c.id}.narrative`,{multi:true,mdr:true,cls:'prose serif-lg',ph:'It began when…'})}</div>
  </section>`;
  $('#cdEdit').onclick = () => openChapterModal(c);
  $('#cdDel').onclick = () => requestDelete({label:c.title||'this chapter', node:box.querySelector('.chapter-detail'), remove:()=>{
    const orphaned = S.turns.filter(t => t.chapterId === c.id); orphaned.forEach(t => t.chapterId = null);
    const back = spliceOut(S.chapters, x => x.id === c.id);
    return () => { back(); orphaned.forEach(t => t.chapterId = c.id); }; }, after:()=>{ S._chSel = null; rerender(); }});
  $('#cdTurn').onclick = () => openTurnModal(null, c.id);
  if($('#cdEra')) $('#cdEra').onchange = e => { c.linkedEraId = e.target.value || null; saveNow(); };
  $$('[data-turnopen]',box).forEach(b => b.onclick = () => openTurnPanel(b.dataset.turnopen));
  attachDictationIn(box);
}

/* ---------- the turning point, in full ---------- */
function openTurnPanel(id){
  const t = byId(S.turns, id); if(!t) return; const ty = TURN_TYPES[t.type];
  const ch = byId(S.chapters, t.chapterId);
  const mems = (t.linkedMemoryIds||[]).map(x => byId(S.entries, x)).filter(Boolean);
  const jrns = (t.linkedJournalIds||[]).map(x => byId(S.entries, x)).filter(Boolean);
  const p = openPanel(`<div class="mono">${ty[0]} ${esc(ty[1].toLowerCase())}${ch?` · ${esc(ch.title)}`:''} · ${esc(fmtDate(t.date,'med'))}</div>
    <h2>${ed(`turns.#${t.id}.title`,{ph:'What happened'})}</h2>
    <div class="row" style="gap:8px;margin:10px 0 18px;flex-wrap:wrap">
      <select class="sel" style="width:auto" id="tpType">${Object.entries(TURN_TYPES).map(([k,v])=>`<option value="${k}" ${t.type===k?'selected':''}>${v[0]} ${v[1]}</option>`).join('')}</select>
      <select class="sel" style="width:auto" id="tpCh"><option value="">no chapter</option>${S.chapters.map(c=>`<option value="${c.id}" ${t.chapterId===c.id?'selected':''}>${esc(c.title||'Untitled')}</option>`).join('')}</select>
      ${ed(`turns.#${t.id}.date`,{ph:'YYYY-MM-DD',cls:'mono'})}
    </div>
    <div class="faint" style="font-size:.78rem;margin-bottom:12px">${esc(ty[2])}</div>

    <div class="vp-sec"><span class="sc">What happened</span><div class="faint" style="font-size:.78rem;margin-bottom:4px">Write it long. This is the one place in the app that wants a page rather than a line.</div>
      ${ed(`turns.#${t.id}.description`,{multi:true,mdr:true,cls:'prose serif-lg',ph:'…'})}</div>
    <div class="vp-sec"><span class="sc">How it changed the trajectory</span>${ed(`turns.#${t.id}.impact`,{multi:true,mdr:true,cls:'prose',ph:'What would be different now if this had gone the other way?'})}</div>
    <div class="vp-sec"><span class="sc">What it taught you</span>${ed(`turns.#${t.id}.lesson`,{multi:true,ph:'One sentence you would carry forward.'})}</div>

    <div class="vp-sec"><span class="sc">Threads it belongs to</span>
      <div class="deps">${S.threadsN.map(th=>`<span class="chip click ${(t.threadIds||[]).includes(th.id)?'on':''}" style="--c:${th.color}" data-tpth="${th.id}">〜 ${esc(th.name)}</span>`).join('') || '<span class="faint" style="font-size:.8rem">No threads yet — a thread is a theme that shows up in more than one chapter.</span>'}
      <button type="button" class="chip click" id="tpNewTh" style="--c:var(--page-accent)">＋ new thread</button></div></div>

    <div class="vp-sec"><span class="sc">People involved</span>
      <div class="deps">${(S.people||[]).map(pp=>`<span class="chip click ${(t.linkedPeopleIds||[]).includes(pp.id)?'on':''}" style="--c:${CIRCLES[pp.circle][4]}" data-tpp="${pp.id}">${esc(pp.name)}</span>`).join('') || '<span class="faint" style="font-size:.8rem">Nobody in the People room yet.</span>'}</div></div>

    <div class="vp-sec"><div class="row between"><span class="sc">Linked entries</span><button class="btn sm ghost" id="tpLink">link an entry</button></div>
      ${[...mems, ...jrns].length ? [...mems, ...jrns].map(e => entryCard(e, {tools:false})).join('') : '<div class="faint" style="font-size:.8rem">Nothing linked. A memory or journal entry from around this time gives the moment its texture.</div>'}</div>

    ${moreSection(`<div class="danger-zone"><span>This deletes the turning point and everything written about it.</span><button class="btn sm ghost danger" id="tpDel">Delete this turning point</button></div>`)}`, 'turn-panel');
  const reopen = () => { rerender(); openTurnPanel(id); };
  p.querySelector('#tpType').onchange = e => { t.type = e.target.value; saveNow(); reopen(); };
  p.querySelector('#tpCh').onchange = e => { t.chapterId = e.target.value || null; saveNow(); reopen(); };
  p.querySelectorAll('[data-tpth]').forEach(c => c.onclick = () => { const id2 = c.dataset.tpth;
    t.threadIds = (t.threadIds||[]).includes(id2) ? t.threadIds.filter(x=>x!==id2) : [...(t.threadIds||[]), id2]; saveNow(); c.classList.toggle('on'); });
  p.querySelectorAll('[data-tpp]').forEach(c => c.onclick = () => { const id2 = c.dataset.tpp;
    t.linkedPeopleIds = (t.linkedPeopleIds||[]).includes(id2) ? t.linkedPeopleIds.filter(x=>x!==id2) : [...(t.linkedPeopleIds||[]), id2]; saveNow(); c.classList.toggle('on'); });
  p.querySelector('#tpNewTh').onclick = () => openThreadModal(null, t.id);
  p.querySelector('#tpLink').onclick = () => openLinkEntryModal(t, reopen);
  p.querySelector('#tpDel').onclick = () => requestDelete({label:t.title||'this turning point', remove:()=>spliceOut(S.turns, x=>x.id===t.id), after:()=>{ closePanel(); rerender(); }});
  attachDictationIn(p);
}
function openLinkEntryModal(t, after){
  const pool = sortEntries(S.entries.filter(e => !letterIsSealed(e) && !['writing'].includes(e.type))).slice(0,200);
  const m = openModal(`<h2>Link an entry</h2><input class="inp" id="leQ" placeholder="search what you have written" autofocus>
    <div class="stack" id="leList" style="gap:5px;margin-top:12px;max-height:50vh;overflow:auto"></div>`, 'narrow');
  const draw = q => {
    const list = pool.filter(e => !q || `${e.title} ${e.body}`.toLowerCase().includes(q.toLowerCase())).slice(0,60);
    m.querySelector('#leList').innerHTML = list.map(e => `<button class="choice" data-le="${e.id}"><span class="ico">${typeIcon(e.type)}</span><span><b>${esc(e.title || (e.body||'').slice(0,60))}</b><div class="d">${esc(typeName(e.type))} · ${esc(fmtDate(e.occurredAt,'med'))}</div></span></button>`).join('') || '<div class="empty">Nothing matches.</div>';
    m.querySelectorAll('[data-le]').forEach(b => b.onclick = () => {
      const e = byId(S.entries, b.dataset.le);
      const key = e.type === 'memory' || e.type === 'lifeevent' ? 'linkedMemoryIds' : 'linkedJournalIds';
      if(!t[key].includes(e.id)) t[key].push(e.id);
      saveNow(); m.remove(); sound('success'); after && after();
    });
  };
  draw('');
  m.querySelector('#leQ').oninput = e => draw(e.target.value.trim());
}
function openChapterModal(ex){
  const c = ex || newChapter();
  const eras = typeof erasList === 'function' ? erasList() : [];
  const m = openModal(`<h2>${ex?'Chapter':'A chapter of your life'}</h2>
    <p class="muted" style="font-size:.86rem">Named in hindsight, not in advance. A Vision chapter says what you want to become; this says what a stretch of your life turned out to be about.</p>
    <div class="stack">
      <div class="field"><label>Title</label><input class="inp serif-lg" id="chTitle" value="${esc(c.title)}" placeholder="The Singapore years" autofocus></div>
      <div class="field"><label>Subtitle</label><input class="inp" id="chSub" value="${esc(c.subtitle)}" placeholder="Finding independence"></div>
      <div class="grid c3" style="gap:10px">
        <div class="field"><label>From</label><input class="inp" type="date" id="chFrom" value="${c.startDate||''}"></div>
        <div class="field"><label>To</label><input class="inp" type="date" id="chTo" value="${c.endDate||''}"></div>
        <div class="field"><label>Status</label><select class="sel" id="chStat">${Object.entries(CH_STATUS).map(([k,v])=>`<option value="${k}" ${c.status===k?'selected':''}>${v[0]}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label>Theme, in one line</label><input class="inp" id="chTheme" value="${esc(c.theme)}" placeholder="Learning to stand alone."></div>
      <div class="grid c2" style="gap:10px">
        <div class="field"><label>Colour</label><input type="color" id="chColor" value="${c.color}" style="width:100%;height:34px;border:none;background:none;padding:0;cursor:pointer"></div>
        ${eras.length?`<div class="field"><label>Related vision chapter</label><select class="sel" id="chEra"><option value="">—</option>${eras.map(e=>`<option value="${e.id}" ${c.linkedEraId===e.id?'selected':''}>${esc(e.name)}</option>`).join('')}</select></div>`:''}
      </div>
    </div><div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn primary" id="chSave">${ex?'Save':'Add the chapter'}</button></div>`, 'narrow');
  m.querySelector('#chSave').onclick = () => {
    const title = m.querySelector('#chTitle').value.trim(); if(!title){ toast('Name it, even roughly.'); return; }
    Object.assign(c, {title, subtitle:m.querySelector('#chSub').value.trim(), startDate:m.querySelector('#chFrom').value || today(),
      endDate:m.querySelector('#chTo').value || null, status:m.querySelector('#chStat').value, theme:m.querySelector('#chTheme').value.trim(),
      color:m.querySelector('#chColor').value, linkedEraId:m.querySelector('#chEra')?.value || null});
    if(!ex) S.chapters.push(c);
    S._chSel = c.id; saveNow(); m.remove(); sound('success');
    if(currentRoute !== 'chronicle') navigate('#/chronicle'); else rerender();
  };
}
function openTurnModal(ex, chapterId){
  if(!S.chapters.length && !chapterId){ toast('Name a chapter first — a turning point lives inside one.'); openChapterModal(); return; }
  const t = ex || newTurn(chapterId || chapterFor(today())?.id || S.chapters[S.chapters.length-1]?.id || null);
  const m = openModal(`<h2>${ex?'Turning point':'A moment the trajectory bent'}</h2>
    <p class="muted" style="font-size:.86rem">Not every event. Only the ones after which something was different.</p>
    <div class="stack">
      <div class="field"><label>What happened</label><input class="inp serif-lg" id="tnTitle" value="${esc(t.title)}" placeholder="The day I decided to leave" autofocus></div>
      <div class="grid c3" style="gap:10px">
        <div class="field"><label>When</label><input class="inp" type="date" id="tnDate" value="${t.date}"></div>
        <div class="field"><label>What kind</label><select class="sel" id="tnType">${Object.entries(TURN_TYPES).map(([k,v])=>`<option value="${k}" ${t.type===k?'selected':''}>${v[0]} ${v[1]}</option>`).join('')}</select></div>
        <div class="field"><label>Chapter</label><select class="sel" id="tnCh"><option value="">none</option>${S.chapters.map(c=>`<option value="${c.id}" ${t.chapterId===c.id?'selected':''}>${esc(c.title||'Untitled')}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label>Tell it</label><textarea class="ta" id="tnDesc" style="min-height:130px" placeholder="Write it the way you would tell someone who was not there.">${esc(t.description)}</textarea></div>
      <div class="field"><label>How it changed things</label><textarea class="ta" id="tnImpact" style="min-height:70px" placeholder="What would be different now if it had gone the other way?">${esc(t.impact)}</textarea></div>
    </div><div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn primary" id="tnSave">${ex?'Save':'Add it'}</button></div>`, 'wide');
  attachDictationIn(m);
  // the chapter follows the date unless you say otherwise
  let chTouched = !!ex;
  m.querySelector('#tnCh').onchange = () => chTouched = true;
  m.querySelector('#tnDate').oninput = e => { if(chTouched) return;
    const c2 = chapterFor(e.target.value); if(c2) m.querySelector('#tnCh').value = c2.id; };
  m.querySelector('#tnSave').onclick = () => {
    const title = m.querySelector('#tnTitle').value.trim(); if(!title){ toast('Give it a title.'); return; }
    Object.assign(t, {title, date:m.querySelector('#tnDate').value || today(), type:m.querySelector('#tnType').value,
      chapterId:m.querySelector('#tnCh').value || null, description:m.querySelector('#tnDesc').value, impact:m.querySelector('#tnImpact').value});
    if(!ex) S.turns.push(t);
    if(t.chapterId) S._chSel = t.chapterId;
    saveNow(); m.remove(); sound('success');
    if(currentRoute !== 'chronicle') navigate('#/chronicle'); else rerender();
  };
}
function openThreadModal(ex, attachTurnId){
  const t = ex || {id:uid(), name:'', description:'', color:'#7f916a'};
  const m = openModal(`<h2>${ex?'Thread':'A theme that keeps returning'}</h2>
    <p class="muted" style="font-size:.86rem">Threads run across chapters: “learning to trust”, “the creative thread”, “finding my people”. They are what makes a set of events a story.</p>
    <div class="stack">
      <div class="field"><label>Name</label><input class="inp serif-lg" id="thName" value="${esc(t.name)}" placeholder="The independence thread" autofocus></div>
      <div class="field"><label>What it is</label><textarea class="ta" id="thDesc" style="min-height:70px" placeholder="My ongoing journey toward self-reliance.">${esc(t.description)}</textarea></div>
      <div class="field"><label>Colour</label><input type="color" id="thColor" value="${t.color}" style="width:100%;height:34px;border:none;background:none;padding:0;cursor:pointer"></div>
      ${ex ? `<div class="faint" style="font-size:.78rem">${threadTurns(t.id).length} turning point${threadTurns(t.id).length===1?'':'s'} carry this thread.</div>` : ''}
    </div><div class="row between" style="margin-top:16px">${ex?'<button class="btn sm ghost danger" id="thDel">Delete</button>':'<span></span>'}<button class="btn primary" id="thSave">${ex?'Save':'Add'}</button></div>`, 'narrow');
  m.querySelector('#thSave').onclick = () => {
    const name = m.querySelector('#thName').value.trim(); if(!name){ toast('Name the thread.'); return; }
    Object.assign(t, {name, description:m.querySelector('#thDesc').value.trim(), color:m.querySelector('#thColor').value});
    if(!ex) S.threadsN.push(t);
    if(attachTurnId){ const tn = byId(S.turns, attachTurnId); if(tn && !tn.threadIds.includes(t.id)) tn.threadIds.push(t.id); }
    saveNow(); m.remove(); sound('success'); rerender();
    if(attachTurnId) setTimeout(()=>openTurnPanel(attachTurnId), 120);
  };
  if(ex) m.querySelector('#thDel').onclick = () => { m.remove(); requestDelete({label:t.name, remove:()=>{
    const touched = S.turns.filter(x => (x.threadIds||[]).includes(t.id)); touched.forEach(x => x.threadIds = x.threadIds.filter(y => y !== t.id));
    const back = spliceOut(S.threadsN, x => x.id === t.id);
    return () => { back(); touched.forEach(x => x.threadIds.push(t.id)); }; }}); };
}
/* ---------- patterns ---------- */
function chronAnalysis(box){
  const counts = {}; S.turns.forEach(t => counts[t.type] = (counts[t.type]||0)+1);
  const total = S.turns.length;
  const chs = S.chapters;
  let a0 = -Math.PI/2; const C = 100, R = 78, r0 = 46;
  const arcs = Object.entries(counts).map(([k,v]) => { const frac = v/Math.max(total,1); const a1 = a0 + frac*Math.PI*2;
    const p = (ang, rad) => `${(C+Math.cos(ang)*rad).toFixed(2)},${(C+Math.sin(ang)*rad).toFixed(2)}`;
    const big = frac > .5 ? 1 : 0;
    const d = `M${p(a0,R)} A${R},${R} 0 ${big} 1 ${p(a1,R)} L${p(a1,r0)} A${r0},${r0} 0 ${big} 0 ${p(a0,r0)} Z`;
    a0 = a1; return `<path d="${d}" fill="${TURN_TYPES[k][3]}" opacity=".85"><title>${esc(TURN_TYPES[k][1])}: ${v}</title></path>`; }).join('');
  const dominant = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  box.innerHTML = `
    ${total ? `<section class="reading-card rv" style="margin-bottom:20px"><div class="sc">What the shape says</div>
      <div class="reading-body"><p>You have marked <b>${total}</b> turning point${total===1?'':'s'} across <b>${chs.length}</b> chapter${chs.length===1?'':'s'}.</p>
      ${dominant ? `<p>Most of them are <b>${esc(TURN_TYPES[dominant[0]][1].toLowerCase())}s</b> (${dominant[1]} of ${total}).${dominant[0]==='decision'?' You read your own life as something you shaped rather than something that happened to you — worth noticing, and worth checking against the record.':dominant[0]==='event'?' Your story is told mostly as things that happened to you. That may be accurate; it is also worth asking where the decisions were.':''}</p>` : ''}
      ${S.threadsN.length ? `<p>${S.threadsN.length} thread${S.threadsN.length===1?'':'s'} run through it${S.threadsN.length?`: ${S.threadsN.map(t=>`<b>${esc(t.name)}</b>`).join(', ')}`:''}.</p>` : '<p>No threads named yet. A thread is what turns a list of events into a story — the theme you notice showing up in three different chapters.</p>'}
      ${chs.filter(c=>!c.narrative).length ? `<p>${chs.filter(c=>!c.narrative).length} chapter${chs.filter(c=>!c.narrative).length===1?' has':'s have'} no narrative written yet. The timeline is the skeleton; the narrative is the part that changes how you see it.</p>` : ''}</div></section>` : ''}

    <div class="grid c2 rv" style="align-items:start">
      <div class="card"><span class="sc">Kinds of moment</span>
        ${total ? `<div class="row" style="gap:18px;margin-top:12px;align-items:center;flex-wrap:wrap">
          <svg viewBox="0 0 200 200" width="170" height="170" style="flex:none">${arcs}<text x="100" y="104" text-anchor="middle" style="fill:var(--text);font-family:var(--serif);font-size:22px">${total}</text></svg>
          <div class="stack" style="gap:5px;flex:1;min-width:150px">${Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="row between"><span class="row" style="gap:7px"><i style="width:9px;height:9px;border-radius:2px;background:${TURN_TYPES[k][3]};display:inline-block"></i>${esc(TURN_TYPES[k][1])}</span><span class="mono">${v} · ${Math.round(v/total*100)}%</span></div>`).join('')}</div></div>`
          : '<div class="empty">No turning points yet.</div>'}</div>
      <div class="card"><span class="sc">Threads over time</span>
        ${S.threadsN.length ? `<div class="thread-map">${S.threadsN.map(th => { const ts = threadTurns(th.id);
          const chIdx = ts.map(t => chs.findIndex(c => c.id === t.chapterId)).filter(i => i >= 0);
          return `<div class="tm-row"><span class="tm-name" style="color:${th.color}">〜 ${esc(th.name)}</span>
            <span class="tm-line">${chs.map((c,i)=>`<i class="${chIdx.includes(i)?'on':''}" style="--c:${th.color}" title="${esc(c.title)}"></i>`).join('')}</span>
            <span class="mono">${ts.length}</span></div>`; }).join('')}
          <div class="tm-row"><span class="tm-name mono">chapters</span><span class="tm-line">${chs.map(c=>`<i class="axis" title="${esc(c.title)}"></i>`).join('')}</span><span></span></div></div>`
          : '<div class="empty">Name a thread and this map shows which chapters it runs through — and where it went quiet.</div>'}</div>
    </div>

    ${chs.length > 1 ? `<section class="section rv"><span class="sc">Chapter by chapter</span>
      <div class="grid c2" style="margin-top:12px">${chs.map(c => { const ts = chapterTurns(c.id); const cc = {}; ts.forEach(t => cc[t.type] = (cc[t.type]||0)+1);
        return `<div class="card" style="border-left:3px solid ${c.color}"><div class="row between"><b class="serif">${esc(c.title||'Untitled')}</b><span class="mono">${esc(c.startDate||'')}${c.endDate?` – ${esc(c.endDate)}`:' –'}</span></div>
          ${c.theme?`<div class="quote" style="font-size:.9rem;margin-top:4px">${esc(c.theme)}</div>`:''}
          <div class="row" style="gap:5px;margin-top:8px;flex-wrap:wrap">${Object.entries(cc).map(([k,v])=>`<span class="chip" style="--c:${TURN_TYPES[k][3]}">${TURN_TYPES[k][0]} ${v}</span>`).join('')||'<span class="faint mono">no turning points</span>'}</div>
          <div class="mono" style="margin-top:6px">${c.narrative ? `${wordCount(c.narrative)} words written` : 'narrative not written'}</div></div>`; }).join('')}</div></section>` : ''}`;
}
const CHRONICLE_SECTIONS = [
  ['cover',    'Title page',        'Your name, the date, one line.'],
  ['chapters', 'The chapters, as I tell them','Chronicle chapters with their narratives and turning points.'],
  ['stages',   'The stages lived',  'Each life stage from the Timeline, with its narrative.'],
  ['memories', 'Memories',          'Formative events and the entries you marked as memories.'],
  ['threads',  'Threads',           'The motifs that run through more than one chapter.'],
  ['vision',   'What comes next',   'The chapters ahead and the goals inside them.'],
  ['values',   'The compass',       'Your values, their order, and where they stand.'],
  ['people',   'The people',        'Who is in the inner rings, and what they gave you.'],
  ['letters',  'Letters',           'Letters to yourself that have been opened.'],
  ['closing',  'A closing page',    'One page left blank for a hand-written line.'],
];
function chronicleConfig(){
  const c = S.settings.chronicle = Object.assign({sections:CHRONICLE_SECTIONS.map(s=>s[0]), images:true, title:'', subtitle:'', author:''}, S.settings.chronicle || {});
  return c;
}
function chronPrint(box){
  const c = chronicleConfig();
  const on = k => c.sections.includes(k);
  const stages = S.stages.filter(s => !s.notyet);
  const memories = sortEntries(S.entries.filter(e => ['memory','lifeevent','artifact'].includes(e.type) && !letterIsSealed(e)));
  const eras = typeof erasList === 'function' ? erasList() : [];
  const openedLetters = S.entries.filter(e => e.type === 'letter' && e.extra?.openedAt);
  box.innerHTML = `<div class="chronicle-page">
    <div class="card rv no-print" style="margin-bottom:24px">
      <div class="grid c2" style="gap:14px;align-items:start">
        <div><span class="sc">What to include</span>
          <div class="chron-picks">${CHRONICLE_SECTIONS.map(([k,label,desc])=>`<label class="chron-pick ${on(k)?'on':''}"><input type="checkbox" data-cs="${k}" ${on(k)?'checked':''}><span><b>${esc(label)}</b><span class="d">${esc(desc)}</span></span></label>`).join('')}</div>
          <label class="toggle ${c.images?'on':''}" id="chImages" style="margin-top:10px"><span class="sw"></span><span>include photographs</span></label>
        </div>
        <div><span class="sc">The title page</span>
          <div class="stack" style="gap:8px;margin-top:8px">
            <input class="inp serif-lg" id="bkTitle" value="${esc(c.title)}" placeholder="A Life, So Far">
            <input class="inp" id="bkSub" value="${esc(c.subtitle)}" placeholder="a subtitle, if you want one">
            <input class="inp" id="bkAuthor" value="${esc(c.author)}" placeholder="your name">
          </div>
          <div class="row" style="margin-top:14px;gap:8px"><button class="btn primary" id="chPrint">⎙ Print · Save as PDF</button></div>
          <div class="faint" style="font-size:.76rem;margin-top:8px">Everything below is what will print. In the dialogue, choose “Save as PDF” as the destination; turn on background graphics for the coloured pieces.</div>
        </div>
      </div>
    </div>

    <article class="chronicle" id="chronicle">
      ${on('cover') ? `<section class="ch-cover ch-break">
        <div class="ch-mark">生</div>
        <h1 class="ch-title">${esc(c.title || 'A Life, So Far')}</h1>
        ${c.subtitle ? `<div class="ch-sub">${esc(c.subtitle)}</div>` : ''}
        <div class="ch-rule"></div>
        <div class="ch-author">${esc(c.author || '')}</div>
        <div class="ch-date">${esc(fmtDate(today()))}</div>
        <div class="ch-counts mono">${stages.length} chapters · ${S.entries.length} entries · ${S.values.length} values · ${(S.people||[]).length} people</div>
      </section>` : ''}

      ${on('chapters') && S.chapters.length ? `<section class="ch-section ch-break"><h2 class="ch-h">The chapters, as I tell them</h2>
        ${S.chapters.map(ch => `<div class="ch-stage">
          <div class="ch-stage-head"><span class="ch-han" style="color:${esc(ch.color)}">§</span><div><h3>${esc(ch.title)}</h3><div class="mono">${esc(ch.startDate||'')}${ch.endDate?` – ${esc(ch.endDate)}`:' – now'}${ch.theme?` · ${esc(ch.theme)}`:''}</div></div></div>
          ${ch.narrative ? `<div class="ch-prose">${md(ch.narrative)}</div>` : '<div class="ch-empty">Narrative not written.</div>'}
          ${chapterTurns(ch.id).length ? `<div class="ch-sub-list">${chapterTurns(ch.id).map(t=>`<div class="ch-substage"><b>${esc(fmtDate(t.date,'med'))} — ${esc(t.title)}</b>${t.description?`<div class="ch-prose">${md(t.description)}</div>`:''}${t.impact?`<div class="ch-prose"><em>What it changed.</em> ${esc(t.impact)}</div>`:''}</div>`).join('')}</div>` : ''}
        </div>`).join('')}</section>` : ''}

      ${on('stages') && stages.length ? `<section class="ch-section ch-break"><h2 class="ch-h">The chapters lived</h2>
        ${stages.map(s => `<div class="ch-stage">
          <div class="ch-stage-head"><span class="ch-han">${esc(s.char||'')}</span><div><h3>${esc(s.name)}</h3><div class="mono">${esc(s.years||'')}${s.tagline?` · ${esc(s.tagline)}`:''}</div></div></div>
          ${s.narrative ? `<div class="ch-prose">${md(s.narrative)}</div>` : '<div class="ch-empty">Not yet written.</div>'}
          ${(s.substages||[]).filter(x=>x.desc).length ? `<div class="ch-sub-list">${s.substages.filter(x=>x.desc).map(x=>`<div class="ch-substage"><b>${esc(x.name)}</b> — ${esc(x.desc)}</div>`).join('')}</div>` : ''}
          ${c.images && (s.photos||[]).length ? `<div class="ch-photos">${s.photos.slice(0,6).map(p=>`<img src="${esc(p.src)}" alt="">`).join('')}</div>` : ''}
        </div>`).join('')}</section>` : ''}

      ${on('memories') && memories.length ? `<section class="ch-section ch-break"><h2 class="ch-h">Memories</h2>
        ${memories.slice(0,60).map(e => `<div class="ch-entry"><div class="ch-when mono">${esc(fmtDate(e.occurredAt,'med'))}</div>
          <div>${e.title?`<div class="ch-entry-title">${esc(e.title)}</div>`:''}<div class="ch-prose">${md(e.body||'')}</div>
          ${c.images && (e.media||[]).length ? `<div class="ch-photos">${e.media.slice(0,3).map(m=>`<img src="${esc(m.src)}" alt="">`).join('')}</div>` : ''}</div></div>`).join('')}</section>` : ''}

      ${on('threads') && (S.threadsN.length || S.threads.length) ? `<section class="ch-section ch-break"><h2 class="ch-h">Threads</h2>
        ${S.threadsN.map(t => { const tt = threadTurns(t.id);
          return `<div class="ch-thread"><h3 style="color:${esc(t.color||'inherit')}">${esc(t.name)}</h3>${t.description?`<div class="ch-prose">${md(t.description)}</div>`:''}
          ${tt.length?`<ul class="ch-goals">${tt.map(x=>`<li><span class="mono">${esc(fmtDate(x.date,'med'))}</span> — ${esc(x.title)}</li>`).join('')}</ul>`:''}</div>`; }).join('')}
        ${S.threads.map(t => `<div class="ch-thread"><h3 style="color:${esc(t.color||'inherit')}">${esc(t.name)}</h3>${t.note?`<div class="ch-prose">${md(t.note)}</div>`:''}</div>`).join('')}</section>` : ''}

      ${on('vision') && eras.length ? `<section class="ch-section ch-break"><h2 class="ch-h">What comes next</h2>
        ${eras.map(era => { const goals = S.visions.filter(v => v.era === era.id && !v.archived);
          return `<div class="ch-era"><h3>${esc(era.name)}${era.startYear||era.endYear?` <span class="mono">${esc(era.startYear||'')}–${esc(era.endYear||'')}</span>`:''}</h3>
          ${era.subtitle?`<div class="ch-era-sub">${esc(era.subtitle)}</div>`:''}
          ${goals.length ? `<ul class="ch-goals">${goals.map(v=>`<li><b>${esc(v.name)}</b>${v.successCriteria?` — ${esc(v.successCriteria)}`:''}</li>`).join('')}</ul>` : '<div class="ch-empty">Nothing written for this chapter yet.</div>'}</div>`; }).join('')}</section>` : ''}

      ${on('values') && S.valueOrder.length ? `<section class="ch-section ch-break"><h2 class="ch-h">The compass</h2>
        <ol class="ch-values">${S.valueOrder.map(id => { const v = byId(S.values,id); if(!v) return ''; const cur = valueCurrent(id);
          return `<li><b style="color:${esc(v.color)}">${esc(v.name)}</b> <span class="mono">${cur}/100</span>${(v.fields?.embody||[]).slice(-1)[0]?.text ? `<div class="ch-prose">${esc((v.fields.embody||[]).slice(-1)[0].text)}</div>` : ''}</li>`; }).join('')}</ol></section>` : ''}

      ${on('people') && (S.people||[]).length ? `<section class="ch-section ch-break"><h2 class="ch-h">The people</h2>
        ${(S.people||[]).filter(p => ['inner','middle'].includes(p.circle)).map(p => `<div class="ch-person"><h3>${esc(p.name)}${p.relationship?` <span class="mono">${esc(p.relationship)}</span>`:''}</h3>
          ${p.details?.notes?`<div class="ch-prose">${md(p.details.notes)}</div>`:''}
          ${p.details?.lifeUpdates?`<div class="ch-prose">${md(p.details.lifeUpdates)}</div>`:''}</div>`).join('') || '<div class="ch-empty">No one in the inner rings yet.</div>'}</section>` : ''}

      ${on('letters') && openedLetters.length ? `<section class="ch-section ch-break"><h2 class="ch-h">Letters</h2>
        ${openedLetters.map(e => `<div class="ch-letter"><div class="mono">written ${esc(fmtDate((e.createdAt||'').slice(0,10),'med'))} · opened ${esc(fmtDate(e.extra.openedAt,'med'))}</div>
          ${e.title?`<h3>${esc(e.title)}</h3>`:''}<div class="ch-prose">${md(e.body)}</div>
          ${e.extra.reply?`<div class="ch-reply"><em>Reading it back.</em> ${md(e.extra.reply)}</div>`:''}</div>`).join('')}</section>` : ''}

      ${on('closing') ? `<section class="ch-closing ch-break"><div class="ch-rule"></div><p class="ch-closing-line">The rest is not written yet.</p><div class="ch-blank"></div></section>` : ''}
    </article>
  </div>`;
  $('#chPrint') && ($('#chPrint').onclick = () => { sound('open'); setTimeout(() => window.print(), 120); });
  $$('[data-cs]',box).forEach(cb => cb.onchange = () => {
    const k = cb.dataset.cs;
    c.sections = cb.checked ? [...new Set([...c.sections, k])] : c.sections.filter(x => x !== k);
    saveNow(); rerender();
  });
  $('#chImages').onclick = () => { c.images = !c.images; saveNow(); rerender(); };
  ['bkTitle:title','bkSub:subtitle','bkAuthor:author'].forEach(pair => {
    const [id, key] = pair.split(':'); const el_ = $('#'+id);
    el_.addEventListener('input', debounce(() => { c[key] = el_.value; saveNow(); const t = document.querySelector('.ch-title'); if(key==='title' && t) t.textContent = c.title || 'A Life, So Far'; }, 400));
  });
};

/* a memory or a journal entry can be promoted into the story */
function promoteToTurningPoint(entryId){
  migrateChronicle();
  const e = byId(S.entries, entryId); if(!e) return;
  if(!S.chapters.length){ toast('Name a chapter first — a turning point lives inside one.'); openChapterModal(); return; }
  const when = (e.occurredAt || e.createdAt || today()).slice(0,10);
  const t = newTurn(chapterFor(when)?.id || S.chapters[S.chapters.length-1].id);
  Object.assign(t, {title:e.title || (e.body||'').slice(0,60), date:when, description:e.body || '',
    type: e.type === 'decision' ? 'decision' : e.type === 'lifeevent' ? 'event' : 'realisation',
    linkedMemoryIds: ['memory','lifeevent'].includes(e.type) ? [e.id] : [],
    linkedJournalIds: ['memory','lifeevent'].includes(e.type) ? [] : [e.id],
    linkedPeopleIds: [...(e.links?.people || [])]});
  S.turns.push(t); saveNow(); sound('success');
  toast('Promoted into the Chronicle.', 5000, {label:'open it', fn:()=>{ navigate('#/chronicle'); setTimeout(()=>openTurnPanel(t.id), 400); }});
}
