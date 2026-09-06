/* ============================================================
   CHRONICLE — the story layer, as a periodic summary.
   Journal keeps your days; Timeline keeps the rooms of a whole
   life. This used to keep a second, hand-maintained copy of
   both (chapters that duplicated stages, a thread list that
   duplicated Timeline's threads, turning points as their own
   object). It now does the opposite: pick a stretch of time —
   a week, a month, a year, or a chapter you name by hand — and
   everything already dated inside it assembles itself. Write
   the hindsight narrative once you've seen the shape of it.
   ============================================================ */
const TURN_TYPES = {
  decision:    ['⚖','Decision',    'you chose, and the choosing mattered',      '#c25b5b'],
  event:       ['◆','Event',       'something happened to you',                 '#6b7f8e'],
  realisation: ['✦','Realisation', 'you saw something you could not unsee',     '#d4a44c'],
  loss:        ['◌','Loss',        'something ended',                           '#8e5f6b'],
  achievement: ['▲','Achievement', 'you got there',                             '#7f916a'],
  encounter:   ['☺','Encounter',   'someone walked in and the trajectory bent', '#a0727e'],
};
const CHAPTER_KINDS = {week:'week', month:'month', year:'year', custom:'custom'};
/* one-time migration: fold the old chapters/turns/threadsN into entries + the real thread list */
function migrateChronicle(){
  S.chapters = Array.isArray(S.chapters) ? S.chapters : [];
  S.turns = Array.isArray(S.turns) ? S.turns : [];
  S.threadsN = Array.isArray(S.threadsN) ? S.threadsN : [];
  if(S.settings.chronicleV2){ S.chapters.forEach(c => { c.kind = CHAPTER_KINDS[c.kind] ? c.kind : 'custom'; c.narrative = c.narrative || ''; c.color = c.color || '#b08968'; }); return; }
  const threadMap = {};
  S.threadsN.forEach(tn => { let t = S.threads.find(x => x.name.toLowerCase() === (tn.name||'').toLowerCase());
    if(!t){ t = {id:uid(), name:tn.name||'Untitled thread', desc:tn.description||'', color:tn.color||'#7f916a', status:'active'}; S.threads.push(t); }
    threadMap[tn.id] = t.id; });
  S.turns.forEach(t => {
    let entry = (t.linkedMemoryIds||[])[0] ? byId(S.entries, t.linkedMemoryIds[0]) : (t.linkedJournalIds||[])[0] ? byId(S.entries, t.linkedJournalIds[0]) : null;
    if(!entry){
      entry = {id:uid(), type: t.type==='decision' ? 'decision' : 'lifeevent', title:t.title||'', occurredAt:t.date||today(), createdAt:new Date().toISOString(), media:[],
        body:[t.description, t.impact?`\n\nHow it changed things: ${t.impact}`:'', t.lesson?`\n\nWhat it taught me: ${t.lesson}`:''].filter(Boolean).join(''),
        links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[]}, people:[], places:[], emotions:[], tags:[], confidence:'', extra:{}};
      S.entries.push(entry);
    }
    entry.extra = entry.extra || {}; entry.extra.turningPoint = true; entry.extra.tpType = TURN_TYPES[t.type] ? t.type : 'event';
    if(t.impact && !entry.extra.tpImpact) entry.extra.tpImpact = t.impact;
    if(t.lesson && !entry.extra.tpLesson) entry.extra.tpLesson = t.lesson;
    entry.links = entry.links || {}; entry.links.threads = entry.links.threads || [];
    (t.threadIds||[]).forEach(tnid => { const rid = threadMap[tnid]; if(rid && !entry.links.threads.includes(rid)) entry.links.threads.push(rid); });
    entry.links.people = entry.links.people || []; entry.people = entry.people || [];
    (t.linkedPeopleIds||[]).forEach(pid => { if(!entry.links.people.includes(pid)) entry.links.people.push(pid); const nm = byId(S.people,pid)?.name; if(nm && !entry.people.includes(nm)) entry.people.push(nm); });
  });
  S.chapters.forEach(c => { c.kind = 'custom'; c.narrative = c.narrative || ''; c.color = c.color || '#b08968'; });
  S.turns = []; S.threadsN = [];
  S.settings.chronicleV2 = true;
}
function turningPointEntries(){ return sortEntries(S.entries.filter(e => e.extra?.turningPoint)); }
function promoteToTurningPoint(entryId){
  const e = byId(S.entries, entryId); if(!e) return;
  e.extra = e.extra || {};
  if(e.extra.turningPoint){ toast('Already marked.'); return; }
  e.extra.turningPoint = true; e.extra.tpType = e.type === 'decision' ? 'decision' : e.type === 'lifeevent' ? 'event' : 'realisation';
  saveNow(); sound('success'); rerender();
  toast('Marked as a turning point.', 5000, {label:'open Chronicle', fn:()=>navigate('#/chronicle')});
}

/* ---------- periods: week / month / year are computed; a chapter record is
   created (or found) only once you look at one, so its narrative has somewhere
   to live. A custom chapter is the same record, just hand-dated. ---------- */
function periodRange(kind, anchor){
  const a = parseDay(anchor);
  if(kind === 'week'){ const start = weekStart(anchor); return {start, end:addDays(start,6), title:`Week of ${fmtDate(start,'med')}`}; }
  if(kind === 'month'){ const y=a.getFullYear(), m=a.getMonth(); return {start:`${y}-${pad(m+1)}-01`, end:isoDay(new Date(y,m+1,0)), title:`${MONTHS[m]} ${y}`}; }
  return {start:`${a.getFullYear()}-01-01`, end:`${a.getFullYear()}-12-31`, title:String(a.getFullYear())};
}
function findOrCreatePeriodChapter(kind, anchor){
  const r = periodRange(kind, anchor); const id = `auto-${kind}-${r.start}`;
  let c = byId(S.chapters, id);
  if(!c){ c = {id, title:r.title, subtitle:'', startDate:r.start, endDate:r.end, kind, color:'#b08968', narrative:'', linkedEraId:null}; S.chapters.push(c); saveNow(); }
  return c;
}
function shiftAnchor(kind, anchor, n){
  if(kind === 'week') return addDays(anchor, n*7);
  const a = parseDay(anchor);
  if(kind === 'month') return isoDay(new Date(a.getFullYear(), a.getMonth()+n, 1));
  return isoDay(new Date(a.getFullYear()+n, 0, 1));
}
function entriesInRange(start, end){ return sortEntries(S.entries.filter(e => { const d = (e.occurredAt||'').slice(0,10); return /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= start && d <= (end||today()); })); }
function periodDigest(start, end){
  const es = entriesInRange(start, end); const endD = end || today();
  const tps = es.filter(e => e.extra?.turningPoint);
  const media = es.filter(e => e.type === 'media' && typeof mediaX==='function' && mediaX(e).status === 'finished');
  const snaps = (S.valueSnapshots||[]).filter(s => s.date >= start && s.date <= endD);
  const days = []; { let d = start; let guard = 0; while(d <= endD && guard++ < 380){ days.push(d); d = addDays(d,1); } }
  const states = days.map(d => dayState(d)).filter(v => v != null);
  const threadTally = {}; es.forEach(e => (e.links.threads||[]).forEach(id => threadTally[id] = (threadTally[id]||0)+1));
  const topThreads = Object.entries(threadTally).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([id,n]) => ({t:byId(S.threads,id), n})).filter(x=>x.t);
  return {es, tps, media, snaps, avgState: states.length ? Math.round(avg(states)) : null, dayCount: days.length, topThreads};
}
function openChapterModal(){
  const m = openModal(`<h2>A custom chapter</h2><p class="muted" style="font-size:.86rem">For a stretch of time that doesn't line up with a calendar month — “the Singapore years”, “after the diagnosis”.</p><div class="stack">
    <input class="inp serif-lg" id="chTitle" placeholder="The Singapore years" autofocus>
    <div class="grid c2" style="gap:10px"><div class="field"><label>From</label><input class="inp" type="date" id="chFrom" value="${today()}"></div><div class="field"><label>To</label><input class="inp" type="date" id="chTo"></div></div>
    <div class="field"><label>Colour</label><input type="color" id="chColor" value="#b08968" style="width:100%;height:34px;border:none;background:none;padding:0;cursor:pointer"></div>
  </div><div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn primary" id="chSave">Add the chapter</button></div>`,'narrow');
  m.querySelector('#chSave').onclick = () => {
    const title = m.querySelector('#chTitle').value.trim(); if(!title){ toast('Name it, even roughly.'); return; }
    const c = {id:uid(), title, subtitle:'', startDate:m.querySelector('#chFrom').value||today(), endDate:m.querySelector('#chTo').value||null, kind:'custom', color:m.querySelector('#chColor').value, narrative:'', linkedEraId:null};
    S.chapters.push(c); saveNow(); m.remove(); sound('success');
    S._chKind = 'custom'; S._chCustomId = c.id; navigate('#/chronicle');
  };
}

routes.chronicle = function(root, params){
  migrateChronicle();
  const view = ['chapters','patterns','print'].includes(params[0]) ? params[0] : 'summary';
  registerPageEntry({pageName:'Chronicle', addLabel:'Name a custom chapter', defaultEntryType:'chapter', prefilledFields:{}, options:[
    {icon:'▤', label:'Custom chapter', desc:'A stretch of time worth naming by hand.', run:()=>openChapterModal()},
    {icon:'◆', label:'Mark a turning point', desc:'Pick an entry you\'ve already written and flag it.', run:()=>openTurningPointPicker()}]});
  root.innerHTML = `<div class="page">
    <div class="page-head"><h1>Chronicle</h1><div class="sub">Not a second Timeline — a periodic summary. Pick a stretch of time; everything already dated inside it assembles itself. Write the hindsight narrative once you've seen the shape of it.</div></div>
    <div class="tabs">${[['summary','Summary'],['chapters','Chapters'],['patterns','Patterns'],['print','Print the book']].map(([k,l])=>`<button class="${view===k?'active':''}" data-chv="${k}">${l}</button>`).join('')}</div>
    <div id="chBody"></div></div>`;
  ({summary:chronSummary, chapters:chronChapters, patterns:chronAnalysis, print:chronPrint}[view])($('#chBody'));
  $$('[data-chv]',root).forEach(b => b.onclick = () => navigate('#/chronicle' + (b.dataset.chv === 'summary' ? '' : '/' + b.dataset.chv)));
  reveal(root);
};
function openTurningPointPicker(){
  const pool = sortEntries(S.entries.filter(e => !e.extra?.turningPoint && ['memory','lifeevent','reflection','decision'].includes(e.type))).slice(0,200);
  const m = openModal(`<h2>Which moment bent the trajectory?</h2><input class="inp" id="tpQ" placeholder="search"><div class="stack" id="tpList" style="gap:5px;margin-top:10px;max-height:50vh;overflow:auto"></div>`,'narrow');
  const draw = q => { const list = pool.filter(e => !q || `${e.title} ${e.body}`.toLowerCase().includes(q.toLowerCase())).slice(0,60);
    m.querySelector('#tpList').innerHTML = list.map(e => `<button class="choice" data-tp="${e.id}"><span class="ico">${typeIcon(e.type)}</span><span><b>${esc(e.title||(e.body||'').slice(0,60))}</b><div class="d">${esc(fmtDate(e.occurredAt,'med'))}</div></span></button>`).join('') || '<div class="empty">Nothing matches.</div>';
    m.querySelectorAll('[data-tp]').forEach(b => b.onclick = () => { m.remove(); promoteToTurningPoint(b.dataset.tp); }); };
  draw(''); m.querySelector('#tpQ').oninput = e => draw(e.target.value);
}

/* ---------- Summary: the periodic digest ---------- */
function chronSummary(box){
  let kind = S._chKind || 'month';
  let chapter;
  if(kind === 'custom' && S._chCustomId) chapter = byId(S.chapters, S._chCustomId);
  if(!chapter){ kind = ['week','month','year'].includes(kind) ? kind : 'month'; chapter = findOrCreatePeriodChapter(kind, S._chAnchor || today()); }
  const d = periodDigest(chapter.startDate, chapter.endDate);
  box.innerHTML = `
    <div class="row rv" style="gap:10px;margin:14px 0;flex-wrap:wrap;align-items:center">
      <div class="lib-tabs">${[['week','Week'],['month','Month'],['year','Year']].map(([k,l])=>`<button class="${kind===k?'active':''}" data-chkind="${k}">${l}</button>`).join('')}${kind==='custom'?`<button class="active">${esc(chapter.title)}</button>`:''}</div>
      ${kind!=='custom'?`<button class="btn sm ghost" id="chPrev">‹</button>`:''}<b class="serif" style="font-size:1.15rem">${esc(chapter.title)}</b>${kind!=='custom'?`<button class="btn sm ghost" id="chNext">›</button>`:''}
      <span class="mono faint">${esc(chapter.startDate)}${chapter.endDate?` – ${esc(chapter.endDate)}`:' – now'}</span>
    </div>
    <div class="card rv" style="margin-bottom:18px"><div class="income-strip">
      <div><div class="k">entries</div><div class="num" data-tween="${d.es.length}">0</div></div>
      <div><div class="k">turning points</div><div class="num" data-tween="${d.tps.length}">0</div></div>
      <div><div class="k">average state</div><div class="num">${d.avgState===null?'—':d.avgState}</div><div class="mono">of 100, across ${d.dayCount} day${d.dayCount===1?'':'s'}</div></div>
      <div><div class="k">media finished</div><div class="num" data-tween="${d.media.length}">0</div></div>
    </div></div>
    ${d.topThreads.length ? `<div class="row rv" style="gap:6px;flex-wrap:wrap;margin-bottom:16px">${d.topThreads.map(({t,n})=>`<span class="chip on" style="--c:${t.color}">${esc(t.name)} · ${n}</span>`).join('')}</div>` : ''}
    <section class="section rv"><span class="sc">The narrative</span><p class="faint" style="font-size:.78rem">Write it once you've seen the shape below — hindsight is the point, not a running log.</p>${ed(`chapters.#${chapter.id}.narrative`,{multi:true,mdr:true,cls:'prose serif-lg',ph:'It began when…'})}</section>
    ${d.tps.length ? `<section class="section rv"><span class="sc">Turning points</span>${d.tps.map(e=>entryCard(e)).join('')}</section>` : ''}
    <section class="section rv"><span class="sc">Everything, in order</span>${d.es.length ? d.es.map(e=>entryCard(e)).join('') : '<div class="empty">Nothing dated in this stretch yet.</div>'}</section>
  `;
  box.querySelectorAll('[data-chkind]').forEach(b => b.onclick = () => { S._chKind = b.dataset.chkind; S._chCustomId = null; S._chAnchor = today(); rerender(); });
  box.querySelector('#chPrev')?.addEventListener('click', () => { S._chAnchor = shiftAnchor(kind, S._chAnchor||today(), -1); rerender(); });
  box.querySelector('#chNext')?.addEventListener('click', () => { S._chAnchor = shiftAnchor(kind, S._chAnchor||today(), 1); rerender(); });
}

/* ---------- Chapters: every period you've ever looked at or named, browsable ---------- */
function chronChapters(box){
  const chs = [...S.chapters].sort((a,b) => (b.startDate||'').localeCompare(a.startDate||''));
  box.innerHTML = `<div class="row rv" style="margin:14px 0"><button class="btn sm ghost" id="chNewCustom">＋ name a custom chapter</button></div>
    <div class="stack rv" style="gap:8px">${chs.length ? chs.map(c => { const d = periodDigest(c.startDate, c.endDate);
      return `<div class="card click" data-chopen="${c.id}" style="border-left:3px solid ${c.color}"><div class="row between"><b class="serif">${esc(c.title)}</b><span class="mono">${esc(c.startDate)}${c.endDate?` – ${esc(c.endDate)}`:' – now'}</span></div>
        ${c.narrative?`<div class="quote" style="font-size:.85rem;margin-top:4px">${esc(c.narrative.slice(0,160))}${c.narrative.length>160?'…':''}</div>`:''}
        <div class="mono" style="margin-top:6px">${d.es.length} entries · ${d.tps.length} turning point${d.tps.length===1?'':'s'}</div></div>`; }).join('')
      : '<div class="empty">Nothing yet — open a week, month or year from Summary and it appears here, or name a custom chapter by hand.</div>'}</div>`;
  box.querySelectorAll('[data-chopen]').forEach(c => c.onclick = () => { const ch = byId(S.chapters, c.dataset.chopen); if(ch.kind==='custom'){ S._chKind='custom'; S._chCustomId=ch.id; } else { S._chKind=ch.kind; S._chAnchor=ch.startDate; S._chCustomId=null; } navigate('#/chronicle'); });
  $('#chNewCustom').onclick = () => openChapterModal();
}

/* ---------- Patterns ---------- */
function chronAnalysis(box){
  const tps = turningPointEntries();
  const counts = {}; tps.forEach(e => { const k = TURN_TYPES[e.extra.tpType] ? e.extra.tpType : 'event'; counts[k] = (counts[k]||0)+1; });
  const total = tps.length;
  let a0 = -Math.PI/2; const C = 100, R = 78, r0 = 46;
  const arcs = Object.entries(counts).map(([k,v]) => { const frac = v/Math.max(total,1); const a1 = a0 + frac*Math.PI*2;
    const p = (ang, rad) => `${(C+Math.cos(ang)*rad).toFixed(2)},${(C+Math.sin(ang)*rad).toFixed(2)}`;
    const big = frac > .5 ? 1 : 0;
    const dd = `M${p(a0,R)} A${R},${R} 0 ${big} 1 ${p(a1,R)} L${p(a1,r0)} A${r0},${r0} 0 ${big} 0 ${p(a0,r0)} Z`;
    a0 = a1; return `<path d="${dd}" fill="${TURN_TYPES[k][3]}" opacity=".85"><title>${esc(TURN_TYPES[k][1])}: ${v}</title></path>`; }).join('');
  const dominant = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  const thTally = {}; tps.forEach(e => (e.links.threads||[]).forEach(id => thTally[id] = (thTally[id]||0)+1));
  const maxTh = Math.max(1,...Object.values(thTally),0);
  box.innerHTML = `
    ${total ? `<section class="reading-card rv" style="margin-bottom:20px"><div class="sc">What the shape says</div>
      <div class="reading-body"><p>You have marked <b>${total}</b> turning point${total===1?'':'s'}.</p>
      ${dominant && dominant[1] > 1 && Object.values(counts).filter(v=>v===dominant[1]).length===1 ? `<p>Most of them are <b>${esc(TURN_TYPES[dominant[0]][1].toLowerCase())}s</b> (${dominant[1]} of ${total}).${dominant[0]==='decision'?' You read your own life as something you shaped rather than something that happened to you.':dominant[0]==='event'?' Your story is told mostly as things that happened to you — worth asking where the decisions were.':''}</p>` : ''}
      ${S.threads.length ? '' : '<p>No threads named yet on Timeline. A thread is what turns a list of moments into a story — name one there and it will show up here.</p>'}</div></section>` : ''}
    <div class="grid c2 rv" style="align-items:start">
      <div class="card"><span class="sc">Kinds of moment</span>
        ${total ? `<div class="row" style="gap:18px;margin-top:12px;align-items:center;flex-wrap:wrap">
          <svg viewBox="0 0 200 200" width="170" height="170" style="flex:none">${arcs}<text x="100" y="104" text-anchor="middle" style="fill:var(--text);font-family:var(--serif);font-size:22px">${total}</text></svg>
          <div class="stack" style="gap:5px;flex:1;min-width:150px">${Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="row between"><span class="row" style="gap:7px"><i style="width:9px;height:9px;border-radius:2px;background:${TURN_TYPES[k][3]};display:inline-block"></i>${esc(TURN_TYPES[k][1])}</span><span class="mono">${v} · ${Math.round(v/total*100)}%</span></div>`).join('')}</div></div>`
          : '<div class="empty">No turning points marked yet — flag one from any entry\'s card, or from the Chronicle\'s add button.</div>'}</div>
      <div class="card"><span class="sc">Threads through your turning points</span>
        ${Object.keys(thTally).length ? Object.entries(thTally).sort((a,b)=>b[1]-a[1]).map(([id,n]) => { const t = byId(S.threads,id); return t ? `<div class="influence-bar"><span style="width:120px;flex:none">${esc(t.name)}</span><span class="track"><i style="width:${Math.round(n/maxTh*100)}%;--c:${t.color}"></i></span><span class="mono" style="width:20px;text-align:right">${n}</span></div>` : ''; }).join('') : '<div class="empty">Tag a turning point\'s entry with a thread and it shows up here.</div>'}</div>
    </div>`;
}

/* ---------- Print the book ---------- */
const CHRONICLE_SECTIONS = [
  ['cover',    'Title page',        'Your name, the date, one line.'],
  ['chapters', 'The chapters, as I tell them','Named periods with their narratives and turning points.'],
  ['stages',   'The stages lived',  'Each life stage from the Timeline, with its narrative.'],
  ['memories', 'Memories',          'Formative events and the entries you marked as memories.'],
  ['threads',  'Threads',           'The motifs that run through more than one period.'],
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
  const namedChapters = [...S.chapters].filter(ch => ch.kind === 'custom' || ch.narrative).sort((a,b)=>(a.startDate||'').localeCompare(b.startDate||''));
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

      ${on('chapters') && namedChapters.length ? `<section class="ch-section ch-break"><h2 class="ch-h">The chapters, as I tell them</h2>
        ${namedChapters.map(ch => { const tps = entriesInRange(ch.startDate, ch.endDate).filter(e=>e.extra?.turningPoint);
          return `<div class="ch-stage">
          <div class="ch-stage-head"><span class="ch-han" style="color:${esc(ch.color)}">§</span><div><h3>${esc(ch.title)}</h3><div class="mono">${esc(ch.startDate||'')}${ch.endDate?` – ${esc(ch.endDate)}`:' – now'}</div></div></div>
          ${ch.narrative ? `<div class="ch-prose">${md(ch.narrative)}</div>` : '<div class="ch-empty">Narrative not written.</div>'}
          ${tps.length ? `<div class="ch-sub-list">${tps.map(t=>`<div class="ch-substage"><b>${esc(fmtDate(t.occurredAt,'med'))} — ${esc(t.title||typeName(t.type))}</b>${t.body?`<div class="ch-prose">${md(t.body)}</div>`:''}</div>`).join('')}</div>` : ''}
        </div>`; }).join('')}</section>` : ''}

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

      ${on('threads') && S.threads.length ? `<section class="ch-section ch-break"><h2 class="ch-h">Threads</h2>
        ${S.threads.map(t => { const tt = turningPointEntries().filter(e=>(e.links.threads||[]).includes(t.id));
          return `<div class="ch-thread"><h3 style="color:${esc(t.color||'inherit')}">${esc(t.name)}</h3>${t.desc?`<div class="ch-prose">${md(t.desc)}</div>`:''}
          ${tt.length?`<ul class="ch-goals">${tt.map(x=>`<li><span class="mono">${esc(fmtDate(x.occurredAt,'med'))}</span> — ${esc(x.title||typeName(x.type))}</li>`).join('')}</ul>`:''}</div>`; }).join('')}</section>` : ''}

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
