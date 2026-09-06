/* ============================================================
   8. CREATIVE PROJECTS — the gardens you tend
   ============================================================ */
const PSTATUS = {idea:['💭','idea','#8a8d8f'],active:['🌱','active','#7f916a'],paused:['⏸','paused','#d4a44c'],shipped:['🚀','shipped','#b08968'],archived:['📦','archived','#6f675f']};
const fmtYen = n => '¥' + Math.round(n||0).toLocaleString();
function nodHeat(p){ const days = lastDays(84); const counts = {}; S.nods.filter(n=>n.projectId===p.id).forEach(n => counts[n.date] = (counts[n.date]||0)+1); return heatGrid(days, 12, d => counts[d] ? (counts[d]>=3?'l3':counts[d]===2?'l2':'l1') : ''); }
routes.projects = function(root, params){
  registerPageEntry({pageName:'Projects', addLabel:'New project', defaultEntryType:'project', prefilledFields:{}, hint:'Nods have their own button — they must stay fast.', options:[{label:'New project', run:()=>EntryActions.newProject()}]});
  const sort = S._psort || 'activity';
  const ps = [...S.projects].sort((a,b) => sort==='name' ? a.name.localeCompare(b.name) : sort==='status' ? Object.keys(PSTATUS).indexOf(a.status)-Object.keys(PSTATUS).indexOf(b.status) : daysSince(projectNods(a)[0]?.date) - daysSince(projectNods(b)[0]?.date));
  const income = S.projects.filter(p=>p.income?.current>0); const total = sum(income.map(p=>p.income.current)); const diversified = income.filter(p=>p.income.current/total > .1).length;
  const W=520,H=300; const pts = S.projects.filter(p=>projectNods(p).length).map(p => { const ns = projectNods(p); return {p, x:avg(ns.map(n=>n.energy)), y:ns.length}; }); const maxY = Math.max(...pts.map(x=>x.y),1);
  root.innerHTML = `<div class="page">
    <button class="btn primary nod-fab" id="nodFab" title="quick nod">+ nod</button><div class="page-head row between"><div><h1>Creative Projects</h1><div class="sub">A nod is the atomic unit: “I showed up and did this.” Under five seconds, or the system dies.</div></div><div class="row"><select class="sel" style="width:auto" id="psort"><option value="activity" ${sort==='activity'?'selected':''}>by last activity</option><option value="status" ${sort==='status'?'selected':''}>by status</option><option value="name" ${sort==='name'?'selected':''}>by name</option></select><button class="btn primary" id="addNod">+ nod</button></div></div>
    <div class="card rv" style="margin-bottom:22px"><div class="income-strip"><div><div class="k">monthly income, all streams</div><div class="num">${fmtYen(total)}</div><div class="mono">per month</div></div><div><div class="k">active streams</div><div class="num">${income.length}</div></div><div><div class="k">diversification</div><div class="num">${diversified}</div><div class="mono">contribute &gt;10%</div></div><div><div class="k">target</div><div class="num">${fmtYen(sum(S.projects.map(p=>p.income?.target||0)))}</div></div></div></div>
    <div class="grid c3">${ps.map(p => { const ns = projectNods(p); const st = PSTATUS[p.status]||PSTATUS.idea; return `<div class="card pcard rv" data-popen="${p.id}" style="cursor:pointer;--c:${st[2]}"><div class="hd"><h3>${esc(p.name)}</h3><span class="pstatus">${st[0]} ${st[1]}</span></div><div class="muted" style="font-size:.85rem">${esc(p.desc)}</div><div class="row">${(p.tags||[]).map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</div>${nodHeat(p)}<div class="mono">${ns.length} nods · last ${relDays(daysSince(ns[0]?.date))}${p.income?.current?` · ${fmtYen(p.income.current)}/mo`:''}</div>${p.link&&p.status==='shipped'?`<a href="${esc(p.link)}" target="_blank" rel="noopener" class="mono" onclick="event.stopPropagation()">↗ ${esc(p.link)}</a>`:''}</div>`; }).join('')}</div>
    <section class="section rv"><span class="sc">Energy vs. output</span><p class="muted" style="font-size:.85rem">X: average energy reading across nods. Y: volume of effort. Which interests deserve to become income streams, and which are taxes you pay for a self you've outgrown?</p>
      <div class="card scatter"><svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;display:block;margin:0 auto;overflow:visible">
        <line x1="40" y1="${H-30}" x2="${W-10}" y2="${H-30}" stroke="var(--line-2)"/><line x1="40" y1="10" x2="40" y2="${H-30}" stroke="var(--line-2)"/><line x1="${40+(W-50)/2}" y1="10" x2="${40+(W-50)/2}" y2="${H-30}" stroke="var(--line)" stroke-dasharray="3 4"/><line x1="40" y1="${(H-20)/2}" x2="${W-10}" y2="${(H-20)/2}" stroke="var(--line)" stroke-dasharray="3 4"/>
        <text class="q" x="${W-14}" y="22" text-anchor="end">your calling — protect these</text><text class="q" x="${W-14}" y="${H-40}" text-anchor="end">hidden potential — give these time</text><text class="q" x="46" y="22">discipline — worth it?</text><text class="q" x="46" y="${H-40}">let go, or transform</text>
        <text x="${W/2}" y="${H-8}" text-anchor="middle">drained ← energy → energized</text><text x="14" y="${H/2}" text-anchor="middle" transform="rotate(-90 14 ${H/2})">nods</text>
        ${pts.map(({p,x,y}) => { const px = 40 + ((x-1)/4)*(W-50), py = (H-30) - (y/maxY)*(H-50); const st = PSTATUS[p.status]||PSTATUS.idea; return `<g data-popen="${p.id}" style="cursor:pointer"><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(6+Math.sqrt(y)).toFixed(1)}" fill="${st[2]}" fill-opacity=".7" stroke="${st[2]}"/><text x="${(px+12).toFixed(1)}" y="${(py+4).toFixed(1)}" style="fill:var(--text);font-family:var(--sans);font-size:11px">${esc(p.name)}</text></g>`; }).join('')}
      </svg></div></section>
    <section class="section rv" style="max-width:var(--content)"><span class="sc">Idea inbox</span><p class="muted" style="font-size:.85rem">A parking lot for sparks. Promote one to a project with a click.</p>
      <div class="row"><input class="inp" id="ideaInp" placeholder="a spark…"><button class="btn sm" id="ideaAdd">park it</button></div>
      <ul class="ideas">${S.ideas.map(i=>`<li><span>${esc(i.text)}</span><span class="row"><button class="btn sm ghost" data-promote="${i.id}">promote →</button><button class="tbtn" data-idel="${i.id}">×</button></span></li>`).join('')}</ul></section>
  </div>`;
  $('#psort').onchange = e => { S._psort = e.target.value; rerender(); };
  $('#addNod').onclick = () => openNodModal(); $('#nodFab').onclick = () => openNodModal();
  $$('[data-popen]',root).forEach(c => c.onclick = () => openProjectPanel(c.dataset.popen));
  const addIdea = () => { const t = $('#ideaInp').value.trim(); if(!t) return; S.ideas.unshift({id:uid(),text:t}); saveNow(); rerender(); $('#ideaInp')?.focus(); };
  $('#ideaAdd').onclick = addIdea; $('#ideaInp').onkeydown = e => { if(e.key==='Enter') addIdea(); };
  $$('[data-promote]',root).forEach(b => b.onclick = () => { const i = byId(S.ideas,b.dataset.promote); S.ideas = S.ideas.filter(x=>x.id!==i.id); createProject(i.text); });
  $$('[data-idel]',root).forEach(b => b.onclick = () => { S.ideas = S.ideas.filter(x=>x.id!==b.dataset.idel); saveNow(); rerender(); });
  if(params[0]) openProjectPanel(params[0]);
};
function createProject(name=''){ const p = {id:uid(),name:name||'New project',desc:'',tags:[],status:'idea',link:'',income:{model:'',current:0,target:0,milestones:[]},createdAt:today()}; S.projects.push(p); saveNow(); rerender(); openProjectPanel(p.id); }
function openProjectPanel(id){
  const p = byId(S.projects,id); if(!p) return; const ns = projectNods(p); const es = sortEntries(entriesLinked('projects',p.id)); const st = PSTATUS[p.status]||PSTATUS.idea;
  const pull = (kind) => { const m = {}; es.forEach(e => (e.links[kind]||[]).forEach(x => { const k = typeof x==='string'?x:x.id; m[k]=(m[k]||0)+1; })); return Object.keys(m); };
  const threads = pull('threads').map(i=>byId(S.threads,i)).filter(Boolean), skills = pull('skills').map(i=>byId(S.skills,i)).filter(Boolean), values = pull('values').map(i=>byId(S.values,i)).filter(Boolean), visions = pull('visions').map(i=>byId(S.visions,i)).filter(Boolean);
  const pn = openPanel(`<div class="mono">project · ${ns.length} nods · avg energy ${ns.length?avg(ns.map(n=>n.energy)).toFixed(1):'–'}</div><h2>${ed(`projects.#${p.id}.name`)}</h2><div class="muted">${ed(`projects.#${p.id}.desc`,{multi:true,ph:'one or two sentences'})}</div>
    <div class="row" style="margin:12px 0"><select class="sel" style="width:auto" id="pStatus">${Object.entries(PSTATUS).map(([k,v])=>`<option value="${k}" ${p.status===k?'selected':''}>${v[0]} ${v[1]}</option>`).join('')}</select><span class="mono">tags</span>${ed(`projects.#${p.id}._tags`,{ph:'writing, code, music',cls:'mono',hook:'ptags:'+p.id})}</div>
    <div class="row"><span class="mono">link</span>${ed(`projects.#${p.id}.link`,{ph:'https://…',cls:'mono'})}</div>
    <div class="vp-sec"><div class="row between"><span class="sc">Activity, twelve weeks</span><button class="btn sm primary" id="pNod">+ nod</button></div>${nodHeat(p)}</div>
    <div class="vp-sec"><span class="sc">Income stream</span><div class="spec-grid"><div><div class="k">revenue model</div>${ed(`projects.#${p.id}.income.model`,{ph:'freelance / product / subscriptions / patronage'})}</div><div><div class="k">current monthly (¥)</div>${ed(`projects.#${p.id}.income.current`,{ph:'0',cls:'mono',hook:'pnum:'+p.id})}</div><div><div class="k">target monthly (¥)</div>${ed(`projects.#${p.id}.income.target`,{ph:'0',cls:'mono',hook:'pnum:'+p.id})}</div></div>
      <div class="row between" style="margin-top:10px"><span class="k mono">milestones</span><button class="btn sm ghost" id="pMile">+ milestone</button></div>${(p.income.milestones||[]).map((m,i)=>`<div class="evidence-item"><span class="mono">${fmtDate(m.date,'med')}</span><span style="flex:1">${ed(`projects.#${p.id}.income.milestones.${i}.text`,{ph:'first user, first dollar, first referral…'})}</span><button class="tbtn" data-mdel="${i}">×</button></div>`).join('')||'<div class="empty">Small wins, recorded. None yet.</div>'}</div>
    <div class="vp-sec"><span class="sc">Cross-pollination</span><div class="stack" style="gap:6px;font-size:.88rem">
      <div>draws on threads: ${threads.map(t=>`<span class="chip on" style="--c:${t.color}">${esc(t.name)}</span>`).join(' ')||'<span class="faint">—</span>'}</div>
      <div>exercises skills: ${skills.map(s=>`<span class="chip on click" style="--c:var(--ment)" data-go="#/skills/${s.id}">${esc(s.name)}</span>`).join(' ')||'<span class="faint">—</span>'}</div>
      <div>serves values: ${values.map(v=>`<span class="chip on click" style="--c:${v.color}" data-go="#/value/${v.id}">${esc(v.name)}</span>`).join(' ')||'<span class="faint">—</span>'}</div>
      <div>advances visions: ${visions.map(v=>`<span class="chip on click" style="--c:var(--sage)" data-go="#/vision/${v.id}">${esc(v.name)}</span>`).join(' ')||'<span class="faint">—</span>'}</div>
      <div class="faint" style="font-size:.78rem">Derived from entries tagged to this project. The varied interests become facets of one body of work.</div></div></div>
    <div class="vp-sec"><span class="sc">Nods</span><div class="nodlist">${ns.slice(0,40).map(n=>`<div class="nod"><span class="mono">${fmtDate(n.date,'med')}</span><span>${esc(n.text)}${n.link?` <a href="${esc(n.link)}" target="_blank" rel="noopener" class="mono">↗</a>`:''}${n.image?`<div class="photo" style="width:60px;height:60px;margin-top:4px"><img src="${n.image}"></div>`:''}</span><span class="mono">${n.duration||''} · ${'●'.repeat(n.energy)}${'○'.repeat(5-n.energy)}</span></div>`).join('')||'<div class="empty">No nods yet. Show up once.</div>'}</div></div>
    ${es.length?`<div class="vp-sec"><span class="sc">Entries</span>${es.map(e=>entryCard(e)).join('')}</div>`:''}
    <div class="row" style="margin-top:30px;justify-content:flex-end"><button class="btn sm ghost danger" id="pDel">remove project</button></div>`);
  $$('#panel .rv').forEach(n=>n.classList.add('in'));
  p._tags = (p.tags||[]).join(', ');
  pn.querySelector('#pStatus').onchange = e => { p.status = e.target.value; saveNow(); rerender(); openProjectPanel(id); };
  pn.querySelector('#pNod').onclick = () => openNodModal(p.id, ()=>{ rerender(); openProjectPanel(id); });
  pn.querySelector('#pMile').onclick = () => { p.income.milestones.push({date:today(),text:''}); saveNow(); openProjectPanel(id); };
  pn.querySelectorAll('[data-mdel]').forEach(b => b.onclick = () => { p.income.milestones.splice(+b.dataset.mdel,1); saveNow(); openProjectPanel(id); });
  pn.querySelector('#pDel').onclick = () => confirmDlg('Remove this project and its nods?', ()=>{ S.projects = S.projects.filter(x=>x.id!==id); S.nods = S.nods.filter(n=>n.projectId!==id); saveNow(); closePanel(); rerender(); });
}
hooks.ptags = (pid, o, n) => { const p = byId(S.projects,pid); if(p){ p.tags = n.split(',').map(s=>s.trim()).filter(Boolean); saveNow(); } };
hooks.pnum = (pid) => { const p = byId(S.projects,pid); if(p){ p.income.current = parseFloat(String(p.income.current).replace(/[^\d.]/g,''))||0; p.income.target = parseFloat(String(p.income.target).replace(/[^\d.]/g,''))||0; saveNow(); } };
function openNodModal(projectId, after){
  const active = S.projects.filter(p=>p.status!=='archived');
  const m = openModal(`<h2>A nod</h2><p class="muted" style="margin-top:-8px">I showed up and did this.</p><div class="stack">
    <select class="sel" id="nodP">${active.map(p=>`<option value="${p.id}" ${p.id===projectId?'selected':''}>${esc(p.name)}</option>`).join('')}</select>
    <input class="inp serif-lg" id="nodText" placeholder="What I did — one line" autofocus>
    <div class="dur-pick">${['15min','30min','1hr','2hr','half-day','full-day'].map(d=>`<button data-dur="${d}">${d}</button>`).join('')}</div>
    <input class="inp" id="nodLink" placeholder="link (optional) — or drop an image below">
    <div class="dropzone" id="nodDrop">drop an image</div><input type="file" id="nodFile" accept="image/*" hidden>
    <div class="energy-pick">${['drained','low','neutral','good','energized'].map((l,i)=>`<button data-en="${i+1}" class="${i===2?'on':''}">${l}</button>`).join('')}</div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="nodSave">Nod ↵</button></div></div>`,'narrow');
  let dur='', energy=3, image='';
  m.querySelectorAll('[data-dur]').forEach(b => b.onclick = () => { dur = dur===b.dataset.dur ? '' : b.dataset.dur; m.querySelectorAll('[data-dur]').forEach(x=>x.classList.toggle('on', x.dataset.dur===dur)); });
  m.querySelectorAll('[data-en]').forEach(b => b.onclick = () => { energy = +b.dataset.en; m.querySelectorAll('[data-en]').forEach(x=>x.classList.toggle('on', +x.dataset.en===energy)); });
  const dz = m.querySelector('#nodDrop'); dz.onclick = () => m.querySelector('#nodFile').click(); m.querySelector('#nodFile').onchange = e => readImages(e.target.files, img => { image = img.src; dz.textContent = 'image attached'; }); dz.ondragover = e => { e.preventDefault(); dz.classList.add('over'); }; dz.ondragleave = () => dz.classList.remove('over'); dz.ondrop = e => { e.preventDefault(); dz.classList.remove('over'); readImages(e.dataTransfer.files, img => { image = img.src; dz.textContent='image attached'; }); };
  const saveNod = e => { const text = m.querySelector('#nodText').value.trim(); if(!text) return; S.nods.push({id:uid(),projectId:m.querySelector('#nodP').value,text,duration:dur,link:m.querySelector('#nodLink').value.trim(),image,energy,date:today()}); saveNow(); ripple(e.clientX||innerWidth/2, e.clientY||innerHeight/2, 'var(--terra)'); sound('success'); m.remove(); toast('Nod recorded.'); after ? after() : (currentRoute==='projects' && rerender()); };
  m.querySelector('#nodSave').onclick = saveNod; m.querySelector('#nodText').onkeydown = e => { if(e.key==='Enter') saveNod(e); }; setTimeout(()=>m.querySelector('#nodText').focus(),50);
}
