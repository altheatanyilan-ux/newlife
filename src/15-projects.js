/* ============================================================
   8. CREATIVE PROJECTS — the gardens you tend
   ============================================================ */
const PSTATUS = {idea:['○','not started','#8a8d8f'],active:['●','in progress','#7f916a'],paused:['◐','on hold','#d4a44c'],completed:['✓','completed','#b08968'],archived:['▣','archived','#6f675f'],abandoned:['×','abandoned','#8e5f6b']};
const KANBAN = [['idea','Not Started'],['active','In Progress'],['paused','On Hold'],['completed','Completed'],['archived','Archived']];
const PRIORITY = {P1:['P1','#c25b5b'],P2:['P2','#d4a44c'],P3:['P3','#7f916a'],P4:['P4','#8a8d8f']};
const prBadge = p => `<span class="pri ${p.priority||'P3'}" title="priority">${p.priority||'P3'}</span>`;
const stBadge = p => { const st = PSTATUS[p.status]||PSTATUS.idea; return `<span class="pstatus" style="--c:${st[2]}">${st[0]} ${st[1]}</span>`; };
const fmtYen = n => '¥' + Math.round(n||0).toLocaleString();
function nodHeat(p){ const days = lastDays(84); const counts = {}; S.nods.filter(n=>n.projectId===p.id).forEach(n => counts[n.date] = (counts[n.date]||0)+1); return heatGrid(days, 12, d => counts[d] ? (counts[d]>=3?'l3':counts[d]===2?'l2':'l1') : ''); }
function projectCardHTML(p){
  const ns = projectNods(p); const st = PSTATUS[p.status]||PSTATUS.idea; const r = projectTaskRatio(p); const pct = r.total ? Math.round(r.done/r.total*100) : 0; const due = p.targetDate ? daysBetween(today(), p.targetDate.slice(0,10)) : null;
  return `<div class="card pcard rv ${hasImages(p) ? 'plated' : ''}" data-popen="${p.id}" draggable="true" data-kdrag="${p.id}" style="cursor:pointer;--c:${st[2]}">${imageBackdropHTML(p)}<div class="hd"><h3>${esc(p.name)}</h3><span class="row" style="gap:6px">${prBadge(p)}${stBadge(p)}</span></div><div class="muted" style="font-size:.85rem">${esc(p.description||'')}</div><div class="row">${(p.tags||[]).map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</div>
    <div class="ptask"><div class="row between"><span class="mono">${(p.phases||[]).length} phase${(p.phases||[]).length===1?'':'s'} · ${r.done}/${r.total} tasks done</span><span class="mono ${due!==null&&due<0&&p.status!=='completed'?'due':''}">${p.targetDate?`🎯 ${fmtDate(p.targetDate,'med')}${due!==null&&p.status!=='completed'?(due<0?` · ${-due}d over`:` · ${due}d`):''}`:''}</span></div><div class="bar" style="--c:${st[2]}"><i style="width:${pct}%"></i></div></div>
    ${nodHeat(p)}<div class="mono">${ns.length} nods · last ${relDays(daysSince(ns[0]?.date))}${p.income?.current?` · ${fmtYen(p.income.current)}/mo`:''}</div>${p.link&&p.status==='completed'?`<a href="${esc(p.link)}" target="_blank" rel="noopener" class="mono" onclick="event.stopPropagation()">↗ ${esc(p.link)}</a>`:''}</div>`;
}
function kanbanHTML(ps){
  return `<div class="kanban">${KANBAN.map(([k,label]) => { const cards = ps.filter(p => p.status===k || (k==='archived' && p.status==='abandoned')); const st = PSTATUS[k]; return `<div class="kcol" data-kcol="${k}" style="--c:${st[2]}"><div class="kcol-h"><span>${label}</span><span class="mono">${cards.length}</span></div><div class="kcol-body">${cards.map(p => { const r = projectTaskRatio(p); return `<div class="kcard ${hasImages(p) ? 'plated' : ''}" draggable="true" data-kdrag="${p.id}" data-popen="${p.id}">${imageBackdropHTML(p)}<div class="row between"><b class="serif" style="font-size:1rem">${esc(p.name)}</b>${prBadge(p)}</div><div class="mono" style="margin-top:4px">${r.done}/${r.total} tasks${p.targetDate?` · 🎯 ${fmtDate(p.targetDate,'short')}`:''}${p.status==='abandoned'?' · abandoned':''}</div><div class="bar" style="--c:${(PSTATUS[p.status]||st)[2]};margin-top:6px"><i style="width:${r.total?Math.round(r.done/r.total*100):0}%"></i></div></div>`; }).join('')||'<div class="faint" style="font-size:.75rem;padding:8px">drop here</div>'}</div></div>`; }).join('')}</div>`;
}
function ganttHTML(ps){
  const T = today(); const rows = ps.filter(p => (p.phases||[]).some(ph => ph.startDate || ph.endDate) || p.startDate || p.targetDate);
  if(!rows.length) return '<div class="empty">Give a project phases with dates and they appear here as bars.</div>';
  const dates = []; rows.forEach(p => { [p.startDate, p.targetDate].forEach(d => d && dates.push(d)); (p.phases||[]).forEach(ph => [ph.startDate, ph.endDate].forEach(d => d && dates.push(d))); }); dates.push(T);
  const t0 = Math.min(...dates.map(d=>parseDay(d.slice(0,10)).getTime())) - DAY*7, t1 = Math.max(...dates.map(d=>parseDay(d.slice(0,10)).getTime())) + DAY*7; const span = t1 - t0;
  const monthsN = Math.max(1, Math.round(span/(DAY*30.4))); const NW = 170; const W = Math.min(2600, Math.max(900 - NW, 30 + monthsN*72)), L = 10, R = 20, rowH = 30, phH = 16, H = 40 + rows.length*(rowH+4);
  const X = d => L + ((parseDay(d.slice(0,10)).getTime()-t0)/span)*(W-L-R);
  let y = 30, g = '', names = '';
  const months = []; { const d = new Date(t0); d.setDate(1); while(d.getTime() < t1){ months.push(new Date(d)); d.setMonth(d.getMonth()+1); } }
  const pxPerMonth = (W-L-R)/Math.max(1,months.length), labelStep = Math.max(1, Math.ceil(56/pxPerMonth));
  let firstLabel = true; months.forEach((m,i) => { const x = X(isoDay(m)); if(x < L) return; const label = i % labelStep === 0; const showYear = label && (m.getMonth()===0 || firstLabel); if(label) firstLabel = false; g += `<line x1="${x.toFixed(1)}" y1="22" x2="${x.toFixed(1)}" y2="${H}" stroke="var(--line)" opacity="${label?1:.45}"/>${label?`<text x="${(x+3).toFixed(1)}" y="16">${MONTHS[m.getMonth()].slice(0,3)}${showYear?` ${String(m.getFullYear()).slice(2)}`:''}</text>`:''}`; });
  rows.forEach(p => { const st = PSTATUS[p.status]||PSTATUS.idea; const phases = (p.phases||[]).filter(ph => ph.startDate || ph.endDate);
    names += `<div class="g-name" style="top:${y}px" data-popen="${p.id}" title="${esc(p.name)}"><span>${esc(p.name)}</span><span class="mono" style="color:${st[2]}">${st[0]}</span></div>`;
    if(p.startDate || p.targetDate){ const a = p.startDate || p.targetDate, b = p.targetDate || p.startDate; g += `<rect class="g-proj" x="${X(a).toFixed(1)}" y="${y+4}" width="${Math.max(2, X(b)-X(a)).toFixed(1)}" height="${phH-8}" rx="3" fill="${st[2]}" opacity=".18" data-popen="${p.id}"/>`; }
    phases.forEach((ph,i) => { const a = ph.startDate || ph.endDate, b = ph.endDate || ph.startDate; const r = {done:(ph.tasks||[]).filter(t=>t.done).length, total:(ph.tasks||[]).length}; const w = Math.max(6, X(b)-X(a)); g += `<g class="g-bar" data-popen="${p.id}"><rect x="${X(a).toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${phH}" rx="4" fill="${st[2]}" opacity=".85"/><rect x="${X(a).toFixed(1)}" y="${y}" width="${(w*(r.total?r.done/r.total:0)).toFixed(1)}" height="${phH}" rx="4" fill="#fff" opacity=".22"/><clipPath id="gc-${p.id}-${i}"><rect x="${X(a).toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${phH}" rx="4"/></clipPath><text clip-path="url(#gc-${p.id}-${i})" x="${(X(a)+6).toFixed(1)}" y="${y+11.5}" style="fill:#1a1816;font-size:9px;font-family:var(--sans)">${esc(ph.name.length>28?ph.name.slice(0,27)+'…':ph.name)}${r.total?` · ${r.done}/${r.total}`:''}</text><title>${esc(ph.name)} · ${fmtDate(a,'med')} → ${fmtDate(b,'med')}</title></g>`; y += phH + 4; });
    if(!phases.length) y += phH + 4; y += 8; });
  const HH = y + 10; const xT = X(T);
  return `<div class="gantt"><div class="g-names" style="height:${HH}px;flex:0 0 ${NW}px">${names}</div><svg viewBox="0 0 ${W} ${HH}" width="${W}" height="${HH}" style="display:block;flex:0 0 ${W}px;overflow:visible">${g}<line class="g-today" x1="${xT.toFixed(1)}" y1="22" x2="${xT.toFixed(1)}" y2="${HH}" stroke="#e3a15a" stroke-width="1.5" stroke-dasharray="3 3"/><text x="${(xT+3).toFixed(1)}" y="${HH-2}" style="fill:#e3a15a">today</text></svg></div>`;
}
routes.projects = function(root, params){
  registerPageEntry({pageName:'Projects', addLabel:'New project', defaultEntryType:'project', prefilledFields:{}, hint:'Nods have their own button — they must stay fast.', options:[{label:'New project', run:()=>EntryActions.newProject()}]});
  const sort = S._psort || 'activity'; const view = S.settings.projectView || 'cards';
  const ps = [...S.projects].sort((a,b) => sort==='name' ? a.name.localeCompare(b.name) : sort==='status' ? Object.keys(PSTATUS).indexOf(a.status)-Object.keys(PSTATUS).indexOf(b.status) : sort==='priority' ? (a.priority||'P3').localeCompare(b.priority||'P3') : daysSince(projectNods(a)[0]?.date) - daysSince(projectNods(b)[0]?.date));
  const income = S.projects.filter(p=>p.income?.current>0); const total = sum(income.map(p=>p.income.current)); const diversified = income.filter(p=>p.income.current/total > .1).length;
  const mode = S.settings.projectMode || 'tracking';
  if(mode === 'ideation'){ renderIdeation(root); return; }
  root.innerHTML = `<div class="page">
    <button class="btn primary nod-fab" id="nodFab" title="quick nod">+ nod</button>
    <div class="mode-switch rv">${[['ideation','◌ Ideation','sparks and open questions'],['tracking','◉ Tracking','the work already under way']].map(([k,l,d])=>`<button class="${mode===k?'on':''}" data-pmode="${k}" title="${d}">${l}</button>`).join('')}</div>
    <div class="page-head row between"><div><h1>Projects</h1></div><div class="row"><div class="view-toggle">${[['cards','▦ Cards'],['kanban','▥ Board'],['timeline','▬ Timeline']].map(([k,l])=>`<button class="${view===k?'on':''}" data-pview="${k}">${l}</button>`).join('')}</div><select class="sel" style="width:auto" id="psort"><option value="activity" ${sort==='activity'?'selected':''}>by last activity</option><option value="priority" ${sort==='priority'?'selected':''}>by priority</option><option value="status" ${sort==='status'?'selected':''}>by status</option><option value="name" ${sort==='name'?'selected':''}>by name</option></select><button class="btn primary" id="addNod">+ nod</button></div></div>
    <div class="card rv" style="margin-bottom:22px"><div class="income-strip"><div><div class="k">monthly income, all streams</div><div class="num">${fmtYen(total)}</div><div class="mono">per month</div></div><div><div class="k">active streams</div><div class="num">${income.length}</div></div><div><div class="k">diversification</div><div class="num">${diversified}</div><div class="mono">contribute &gt;10%</div></div><div><div class="k">open tasks</div><div class="num">${sum(S.projects.filter(p=>!['completed','archived','abandoned'].includes(p.status)).map(p=>{ const r = projectTaskRatio(p); return r.total-r.done; }))}</div></div></div></div>
    ${view==='cards' ? `<div class="grid c3" id="pcards">${ps.map(projectCardHTML).join('')}</div>` : view==='kanban' ? kanbanHTML(ps) : `<div class="card rv"><div class="row between" style="margin-bottom:8px"><span class="sc" style="margin:0">Phases over time</span><span class="mono">bars are phases · lighter fill is tasks done · click a bar to open</span></div>${ganttHTML(ps)}</div>`}
    
  </div>`;
  $('#psort').onchange = e => { S._psort = e.target.value; rerender(); };
  $$('[data-pmode]',root).forEach(b => b.onclick = () => { S.settings.projectMode = b.dataset.pmode; saveNow(); rerender(); });
  $$('[data-pview]',root).forEach(b => b.onclick = () => { S.settings.projectView = b.dataset.pview; saveNow(); rerender(); });
  { const gt = root.querySelector('.gantt'); const tl = gt?.querySelector('.g-today'); if(gt && tl){ gt.scrollLeft = Math.max(0, +tl.getAttribute('x1') - (gt.clientWidth-170)*0.6); } }
  $('#addNod').onclick = () => openNodModal(); $('#nodFab').onclick = () => openNodModal();
  $$('[data-popen]',root).forEach(c => c.addEventListener('click', e => { if(e.target.closest('.del-x,.ed')) return; openProjectPanel(c.dataset.popen); }));
  // kanban drag between columns
  let kdrag = null;
  $$('[data-kdrag]',root).forEach(card => { card.addEventListener('dragstart', ev => { if(ev.target.closest('.ed')){ ev.preventDefault(); return; } kdrag = card.dataset.kdrag; card.classList.add('dragging'); ev.dataTransfer.effectAllowed='move'; try { ev.dataTransfer.setData('text/plain', kdrag); } catch(e){} }); card.addEventListener('dragend', () => { card.classList.remove('dragging'); $$('.kcol.over',root).forEach(c=>c.classList.remove('over')); }); });
  $$('.kcol',root).forEach(col => { col.addEventListener('dragover', ev => { ev.preventDefault(); col.classList.add('over'); }); col.addEventListener('dragleave', () => col.classList.remove('over')); col.addEventListener('drop', ev => { ev.preventDefault(); col.classList.remove('over'); const id = kdrag || ev.dataTransfer.getData('text/plain'); const p = byId(S.projects,id); if(!p) return; const to = col.dataset.kcol; if(p.status === to || (to==='archived' && p.status==='abandoned')) return; p.status = to; saveNow(); sound('success'); rerender(); }); });
  /* the id is consumed, not kept: a re-render must not reopen the panel */
  if(params[0]){ const _id = params[0]; consumeHashParam('#/projects'); setTimeout(() => openProjectPanel(_id), 0); }
};
function createProject(name=''){ const p = {id:uid(),name:name||'New project',description:'',tags:[],status:'idea',priority:'P3',startDate:today(),targetDate:'',phases:[],resources:[],linkedSkills:[],linkedVisionEra:null,notes:'',link:'',income:{model:'',current:0,target:0,milestones:[]},createdAt:today()}; S.projects.push(p); saveNow(); rerender(); openProjectPanel(p.id); }
function deleteProject(p, node, after){
  requestDelete({label: p.name, node, after, remove: () => {
    const nods = S.nods.filter(n => n.projectId === p.id).map(n => [S.nods.indexOf(n), n]); nods.forEach(([,n]) => S.nods.splice(S.nods.indexOf(n), 1));
    const touched = S.entries.filter(e => (e.links?.projects||[]).includes(p.id)); const rl = snapshotLinks(touched); touched.forEach(e => e.links.projects = e.links.projects.filter(y => y !== p.id));
    const back = spliceOut(S.projects, x => x.id === p.id);
    return () => { back(); nods.forEach(([i,n]) => S.nods.splice(Math.min(i, S.nods.length), 0, n)); rl(); };
  }});
}
function openProjectPanel(id){
  const p = byId(S.projects,id); if(!p) return; const ns = projectNods(p); const es = sortEntries(entriesLinked('projects',p.id)); const st = PSTATUS[p.status]||PSTATUS.idea;
  const pull = (kind) => { const m = {}; es.forEach(e => (e.links[kind]||[]).forEach(x => { const k = typeof x==='string'?x:x.id; m[k]=(m[k]||0)+1; })); return Object.keys(m); };
  const threads = pull('threads').map(i=>byId(S.threads,i)).filter(Boolean), skills = pull('skills').map(i=>byId(S.skills,i)).filter(Boolean), values = pull('values').map(i=>byId(S.values,i)).filter(Boolean);
  const r = projectTaskRatio(p); const openPh = S._openPhase?.[p.id];
  const pn = openPanel(`<div class="mono">project · ${ns.length} nods · avg energy ${ns.length?avg(ns.map(n=>n.energy)).toFixed(1):'–'} · ${r.done}/${r.total} tasks</div><h2>${ed(`projects.#${p.id}.name`)}</h2><div class="muted">${ed(`projects.#${p.id}.description`,{multi:true,ph:'one or two sentences'})}</div>
    <div class="row" style="margin:12px 0;gap:8px"><select class="sel" style="width:auto" id="pStatus">${Object.entries(PSTATUS).map(([k,v])=>`<option value="${k}" ${p.status===k?'selected':''}>${v[0]} ${v[1]}</option>`).join('')}</select><select class="sel" style="width:auto" id="pPri">${Object.keys(PRIORITY).map(k=>`<option ${p.priority===k?'selected':''}>${k}</option>`).join('')}</select><span class="mono">tags</span>${ed(`projects.#${p.id}._tags`,{ph:'writing, code, music',cls:'mono',hook:'ptags:'+p.id})}</div>
    <div class="spec-grid"><div><div class="k">start</div>${ed(`projects.#${p.id}.startDate`,{ph:'YYYY-MM-DD',cls:'mono'})}</div><div><div class="k">target</div>${ed(`projects.#${p.id}.targetDate`,{ph:'YYYY-MM-DD',cls:'mono'})}</div></div>
    <div class="row" style="margin-top:8px"><span class="mono">link</span>${ed(`projects.#${p.id}.link`,{ph:'https://…',cls:'mono'})}</div>
    <div class="vp-sec"><div class="row between"><span class="sc">Phases &amp; tasks</span><button class="btn sm ghost" id="phAdd">+ phase</button></div>
      <div class="bar" style="--c:${(PSTATUS[p.status]||PSTATUS.idea)[2]};margin:6px 0 10px"><i style="width:${r.total?Math.round(r.done/r.total*100):0}%"></i></div>
      <div class="phases">${(p.phases||[]).map((ph,i) => { const pr = {done:(ph.tasks||[]).filter(t=>t.done).length, total:(ph.tasks||[]).length}; const isOpen = openPh ? openPh===ph.id : i===0; return `<div class="phase ${isOpen?'open':''}" data-phase="${ph.id}">
        <div class="phase-h" data-phtoggle="${ph.id}"><span class="phase-chev">›</span><span class="phase-name">${ed(`projects.#${p.id}.phases.${i}.name`,{ph:'Phase name'})}</span><span class="mono">${pr.done}/${pr.total}</span><span class="mono phase-dates">${ed(`projects.#${p.id}.phases.${i}.startDate`,{ph:'start',cls:'mono'})} → ${ed(`projects.#${p.id}.phases.${i}.endDate`,{ph:'end',cls:'mono'})}</span><button class="del-x inline" data-phdel="${ph.id}" title="delete phase">×</button></div>
        <div class="phase-body"><div class="phase-inner">
          <input class="inp quick-task" data-quick="${ph.id}" placeholder="＋ add a task and press Enter">
          <div class="tasks">${(ph.tasks||[]).map((t,ti) => { const due = t.dueDate ? daysBetween(today(), t.dueDate.slice(0,10)) : null; return `<div class="task ${t.done?'done':''}" data-task="${t.id}"><label><input type="checkbox" data-tdone="${ph.id}:${t.id}" ${t.done?'checked':''}></label><span class="task-text">${ed(`projects.#${p.id}.phases.${i}.tasks.${ti}.text`,{ph:'task'})}</span><input type="date" class="inp task-due ${due!==null&&due<0&&!t.done?'over':''}" value="${t.dueDate?t.dueDate.slice(0,10):''}" data-tdue="${ph.id}:${t.id}" title="due date">${due!==null&&!t.done?`<span class="mono ${due<0?'due':''}">${due<0?`${-due}d over`:due===0?'today':`${due}d`}</span>`:''}<button class="del-x inline" data-tdel="${ph.id}:${t.id}" title="delete task">×</button></div>`; }).join('')||'<div class="faint" style="font-size:.78rem;padding:4px 0">no tasks yet</div>'}</div>
        </div></div></div>`; }).join('')||'<div class="faint" style="font-size:.8rem">No phases yet. Add one to break the project into steps.</div>'}</div></div>
    <div class="vp-sec"><div class="row between"><span class="sc">Resources</span><button class="btn sm ghost" id="resAdd">+ resource</button></div>
      <div class="lvl-res">${(p.resources||[]).map((rs,ri)=>`<div class="res-row"><span class="res-type">${{link:'🔗',file:'📎',note:'📝'}[rs.type]||'▫'}</span>${rs.url?`<a class="res-link" href="${esc(rs.url)}" target="_blank" rel="noopener">${esc(rs.title||rs.url)}</a>`:`<span>${esc(rs.title||'untitled')}</span>`}<span class="status-pill" style="font-size:.6rem">${esc(rs.type)}</span><span class="res-edit"><span class="ed-wrap">${ed(`projects.#${p.id}.resources.${ri}.title`,{ph:'title',cls:'mono'})}</span><span class="ed-wrap">${ed(`projects.#${p.id}.resources.${ri}.url`,{ph:'https://… (optional for notes)',cls:'mono'})}</span><select class="sel" data-prestype="${ri}" style="width:auto;padding:1px 6px;font-size:.66rem;padding-right:22px">${['link','file','note'].map(t=>`<option ${rs.type===t?'selected':''}>${t}</option>`).join('')}</select><button class="del-x inline" data-presdel="${ri}" title="remove">×</button></span></div>`).join('')||'<div class="faint" style="font-size:.8rem">Links, files, notes.</div>'}</div></div>
    <div class="vp-sec"><span class="sc">Develops skills</span><div class="deps">${S.skills.map(sk=>`<span class="chip click ${(p.linkedSkills||[]).includes(sk.id)?'on':''}" style="--c:${catColor(sk.cat)}" data-plink="${sk.id}">${esc(sk.name)}</span>`).join('')}</div></div>
    <div class="vp-sec"><span class="sc">Notes</span>${ed(`projects.#${p.id}.notes`,{multi:true,mdr:true,cls:'prose',ph:'Working notes. Markdown welcome.'})}</div>
    <div class="vp-sec"><div class="row between"><span class="sc">Activity, twelve weeks</span><button class="btn sm primary" id="pNod">+ nod</button></div>${nodHeat(p)}</div>
    <div class="vp-sec"><span class="sc">Income stream</span><div class="spec-grid"><div><div class="k">revenue model</div>${ed(`projects.#${p.id}.income.model`,{ph:'freelance / product / subscriptions / patronage'})}</div><div><div class="k">current monthly (¥)</div>${ed(`projects.#${p.id}.income.current`,{ph:'0',cls:'mono',hook:'pnum:'+p.id})}</div><div><div class="k">target monthly (¥)</div>${ed(`projects.#${p.id}.income.target`,{ph:'0',cls:'mono',hook:'pnum:'+p.id})}</div></div>
      <div class="row between" style="margin-top:10px"><span class="k mono">milestones</span><button class="btn sm ghost" id="pMile">+ milestone</button></div>${(p.income.milestones||[]).map((m,i)=>`<div class="evidence-item"><span class="mono">${ed(`projects.#${p.id}.income.milestones.${i}.date`,{ph:'date',cls:'mono'})}</span><span style="flex:1">${ed(`projects.#${p.id}.income.milestones.${i}.text`,{ph:'first user, first dollar, first referral…'})}</span><button class="tbtn" data-mdel="${i}">×</button></div>`).join('')||'<div class="empty">Small wins, recorded. None yet.</div>'}</div>
    <div class="vp-sec"><div class="row between" style="align-items:center"><span class="sc">What this looks like</span>${imageAddHTML('project', p.id)}</div>
      ${imageStripHTML('project', p.id) || '<p class="faint" style="font-size:.8rem;margin:6px 0 0">Add an image and this project\'s card is printed on it.</p>'}</div>
    <div class="vp-sec"><span class="sc">Cross-pollination</span><div class="stack" style="gap:6px;font-size:.88rem">
      <div>draws on threads: ${threads.map(t=>`<span class="chip on" style="--c:${t.color}">${esc(t.name)}</span>`).join(' ')||'<span class="faint">—</span>'}</div>
      <div>exercises skills: ${skills.map(s=>`<span class="chip on click" style="--c:var(--ment)" data-go="#/skills/${s.id}">${esc(s.name)}</span>`).join(' ')||'<span class="faint">—</span>'}</div>
      <div>serves values: ${values.map(v=>`<span class="chip on click" style="--c:${v.color}" data-go="#/value/${v.id}">${esc(v.name)}</span>`).join(' ')||'<span class="faint">—</span>'}</div>
      <div class="faint" style="font-size:.78rem">Derived from entries tagged to this project. The varied interests become facets of one body of work.</div></div></div>
    <div class="vp-sec"><span class="sc">Nods</span><div class="nodlist">${ns.slice(0,40).map(n=>`<div class="nod"><span class="mono">${fmtDate(n.date,'med')}</span><span>${esc(n.text)}${n.link?` <a href="${esc(n.link)}" target="_blank" rel="noopener" class="mono">↗</a>`:''}${n.image?`<div class="photo" style="width:60px;height:60px;margin-top:4px"><img src="${n.image}"></div>`:''}</span><span class="row" style="gap:6px"><span class="mono">${n.duration||''} · ${'●'.repeat(n.energy)}${'○'.repeat(5-n.energy)}</span><button class="tbtn" data-nodedit="${n.id}">edit</button><button class="del-x inline" data-noddel="${n.id}" title="delete nod">×</button></span></div>`).join('')||'<div class="empty">No nods yet. Show up once.</div>'}</div></div>
    ${es.length?`<div class="vp-sec"><span class="sc">Entries</span>${es.map(e=>entryCard(e)).join('')}</div>`:''}
    ${moreSection(`<div class="danger-zone"><span>Projects carry their nods with them. Archive it instead if it may return.</span><button class="btn sm ghost danger" id="pDel">Delete this project</button></div>`)}`);
  $$('#panel .rv').forEach(n=>n.classList.add('in'));
  p._tags = (p.tags||[]).join(', ');
  pn.querySelector('#pStatus').onchange = e => { p.status = e.target.value; saveNow(); reopenPanel(() => { rerender(); openProjectPanel(id); }); };
  pn.querySelector('#pPri').onchange = e => { p.priority = e.target.value; saveNow(); reopenPanel(() => { rerender(); openProjectPanel(id); }); };
  pn.querySelectorAll('[data-plink]').forEach(c => c.onclick = () => { const sid = c.dataset.plink; p.linkedSkills = (p.linkedSkills||[]).includes(sid) ? p.linkedSkills.filter(x=>x!==sid) : [...(p.linkedSkills||[]), sid]; saveNow(); c.classList.toggle('on'); });
  const reopen = () => { reopenPanel(() => { rerender(); openProjectPanel(id); }); };
  pn.querySelector('#phAdd').onclick = () => { const ph = {id:uid(), name:`Phase ${(p.phases||[]).length+1}`, startDate:'', endDate:'', tasks:[]}; p.phases.push(ph); S._openPhase = {...(S._openPhase||{}), [id]:ph.id}; saveNow(); reopen(); setTimeout(()=>{ const n = document.querySelector(`#panel .phase[data-phase="${ph.id}"] .phase-name .ed`); if(n){ beginEdit(n); n.querySelector('input')?.select(); } },60); };
  pn.querySelectorAll('[data-phtoggle]').forEach(h => h.addEventListener('click', e => { if(e.target.closest('.ed,button,input')) return; const row = h.closest('.phase'); const open = !row.classList.contains('open'); pn.querySelectorAll('.phase').forEach(x=>x.classList.remove('open')); if(open){ row.classList.add('open'); S._openPhase = {...(S._openPhase||{}), [id]:h.dataset.phtoggle}; } }));
  pn.querySelectorAll('[data-phdel]').forEach(b => b.onclick = e => { e.stopPropagation(); const ph = byId(p.phases, b.dataset.phdel); requestDelete({label:`${ph.name} (${(ph.tasks||[]).length} tasks)`, node:b.closest('.phase'), remove:()=>spliceOut(p.phases, x=>x.id===ph.id), after:reopen}); });
  pn.querySelectorAll('.quick-task').forEach(inp => inp.addEventListener('keydown', e => { if(e.key!=='Enter') return; const t = inp.value.trim(); if(!t) return; const ph = byId(p.phases, inp.dataset.quick); ph.tasks.push({id:uid(), text:t, done:false, dueDate:null}); S._openPhase = {...(S._openPhase||{}), [id]:ph.id}; saveNow(); sound('click'); reopen(); setTimeout(()=>document.querySelector(`#panel .quick-task[data-quick="${ph.id}"]`)?.focus(),60); }));
  pn.querySelectorAll('[data-tdone]').forEach(c => c.addEventListener('change', () => { const [phid,tid] = c.dataset.tdone.split(':'); const t = byId(byId(p.phases,phid).tasks, tid); t.done = c.checked; saveNow(); sound(c.checked?'success':'click'); reopen(); }));
  pn.querySelectorAll('[data-tdue]').forEach(i => i.addEventListener('change', () => { const [phid,tid] = i.dataset.tdue.split(':'); const t = byId(byId(p.phases,phid).tasks, tid); t.dueDate = i.value || null; saveNow(); reopen(); }));
  pn.querySelectorAll('[data-tdel]').forEach(b => b.onclick = () => { const [phid,tid] = b.dataset.tdel.split(':'); const ph = byId(p.phases,phid); const t = byId(ph.tasks,tid); requestDelete({label:t.text, node:b.closest('.task'), remove:()=>spliceOut(ph.tasks, x=>x.id===tid), after:reopen}); });
  pn.querySelector('#resAdd').onclick = () => { p.resources.push({title:'', url:'', type:'link'}); saveNow(); reopen(); setTimeout(()=>{ const last = $$('#panel .res-row').slice(-1)[0]; const e = last?.querySelector('.ed'); if(e){ last.querySelector('.res-edit').style.display='flex'; beginEdit(e); } },60); };
  pn.querySelectorAll('[data-prestype]').forEach(sel => sel.onchange = () => { p.resources[+sel.dataset.prestype].type = sel.value; saveNow(); reopen(); });
  pn.querySelectorAll('[data-presdel]').forEach(b => b.onclick = () => { const rs = p.resources[+b.dataset.presdel]; requestDelete({label:rs.title||'Resource', remove:()=>spliceOut(p.resources, x=>x===rs), after:reopen}); });
  bindRecImages(pn, () => openProjectPanel(p.id));
  pn.querySelector('#pNod').onclick = () => openNodModal(p.id, ()=>{ reopenPanel(() => { rerender(); openProjectPanel(id); }); });
  pn.querySelector('#pMile').onclick = () => { p.income.milestones.push({date:today(),text:''}); saveNow(); openProjectPanel(id); };
  pn.querySelectorAll('[data-mdel]').forEach(b => b.onclick = () => { const ms = p.income.milestones[+b.dataset.mdel]; requestDelete({label: ms.text || 'Milestone', node: b.closest('.evidence-item'), remove: () => spliceOut(p.income.milestones, x => x === ms), after: () => openProjectPanel(id)}); });
  pn.querySelectorAll('[data-nodedit]').forEach(b => b.onclick = () => openNodModal(p.id, () => { reopenPanel(() => { rerender(); openProjectPanel(id); }); }, byId(S.nods, b.dataset.nodedit)));
  pn.querySelectorAll('[data-noddel]').forEach(b => b.onclick = () => { const n = byId(S.nods, b.dataset.noddel); requestDelete({label: n.text, node: b.closest('.nod'), remove: () => spliceOut(S.nods, x => x.id === n.id), after: () => { reopenPanel(() => { rerender(); openProjectPanel(id); }); }}); });
  pn.querySelector('#pDel').onclick = () => deleteProject(p, null, () => { closePanel(); rerender(); });
}
hooks.ptags = (pid, o, n) => { const p = byId(S.projects,pid); if(p){ p.tags = n.split(',').map(s=>s.trim()).filter(Boolean); saveNow(); } };
hooks.pnum = (pid) => { const p = byId(S.projects,pid); if(p){ ['current','target','hoursPerWeek'].forEach(k => { p.income[k] = parseFloat(String(p.income[k]).replace(/[^\d.]/g,''))||0; }); saveNow(); if(typeof finLiveRecalc === 'function') finLiveRecalc(); } };
function openNodModal(projectId, after, existing=null){
  const active = S.projects.filter(p=>p.status!=='archived' || p.id===existing?.projectId);
  const m = openModal(`<h2>${existing?'Edit nod':'A nod'}</h2><p class="muted" style="margin-top:-8px">${existing?fmtDate(existing.date,'med'):'I showed up and did this.'}</p><div class="stack">
    <select class="sel" id="nodP">${active.map(p=>`<option value="${p.id}" ${p.id===(existing?.projectId||projectId)?'selected':''}>${esc(p.name)}</option>`).join('')}</select>
    <input class="inp serif-lg" id="nodText" placeholder="What I did — one line" value="${esc(existing?.text||'')}" autofocus>
    <div class="dur-pick">${['15min','30min','1hr','2hr','half-day','full-day'].map(d=>`<button data-dur="${d}">${d}</button>`).join('')}</div>
    <input class="inp" id="nodLink" placeholder="link (optional) — or drop an image below" value="${esc(existing?.link||'')}">${existing?`<div class="field"><label>Date</label><input class="inp" type="date" id="nodDate" value="${existing.date}"></div>`:''}
    <div class="dropzone" id="nodDrop">drop an image</div><input type="file" id="nodFile" accept="image/*" hidden>
    <div class="energy-pick">${['drained','low','neutral','good','energized'].map((l,i)=>`<button data-en="${i+1}" class="${(existing?existing.energy:3)===i+1?'on':''}">${l}</button>`).join('')}</div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="nodSave">${existing?'Save':'Nod ↵'}</button></div></div>`,'narrow');
  let dur=existing?.duration||'', energy=existing?.energy||3, image=existing?.image||'';
  if(dur) m.querySelectorAll('[data-dur]').forEach(x=>x.classList.toggle('on', x.dataset.dur===dur));
  m.querySelectorAll('[data-dur]').forEach(b => b.onclick = () => { dur = dur===b.dataset.dur ? '' : b.dataset.dur; m.querySelectorAll('[data-dur]').forEach(x=>x.classList.toggle('on', x.dataset.dur===dur)); });
  m.querySelectorAll('[data-en]').forEach(b => b.onclick = () => { energy = +b.dataset.en; m.querySelectorAll('[data-en]').forEach(x=>x.classList.toggle('on', +x.dataset.en===energy)); });
  const dz = m.querySelector('#nodDrop'); dz.onclick = () => m.querySelector('#nodFile').click(); m.querySelector('#nodFile').onchange = e => readImages(e.target.files, img => { image = img.src; dz.textContent = 'image attached'; }); dz.ondragover = e => { e.preventDefault(); dz.classList.add('over'); }; dz.ondragleave = () => dz.classList.remove('over'); dz.ondrop = e => { e.preventDefault(); dz.classList.remove('over'); readImages(e.dataTransfer.files, img => { image = img.src; dz.textContent='image attached'; }); };
  const saveNod = e => { const text = m.querySelector('#nodText').value.trim(); if(!text) return; if(existing){ Object.assign(existing, {projectId:m.querySelector('#nodP').value, text, duration:dur, link:m.querySelector('#nodLink').value.trim(), image, energy, date:m.querySelector('#nodDate').value||existing.date}); } else S.nods.push({id:uid(),projectId:m.querySelector('#nodP').value,text,duration:dur,link:m.querySelector('#nodLink').value.trim(),image,energy,date:today()}); saveNow(); ripple(e.clientX||innerWidth/2, e.clientY||innerHeight/2, 'var(--terra)'); sound('success'); m.remove(); toast('Nod recorded.'); after ? after() : (currentRoute==='projects' && rerender()); };
  m.querySelector('#nodSave').onclick = saveNod; m.querySelector('#nodText').onkeydown = e => { if(e.key==='Enter') saveNod(e); }; setTimeout(()=>m.querySelector('#nodText').focus(),50);
}

/* ---------- Ideation: before anything is a project ---------- */
/* Two kinds, not four. "Inspiration" and "experiment" were shades of the same
   two things — something that struck you, and something you do not know — and
   a picker with four options where two would do is a decision tax on the way
   into a thought. Anything filed under the old kinds becomes a spark. */
const SPARK_KINDS = {spark:['◌','spark','#d4a44c'], question:['?','question','#6b7f8e']};
const SPARK_FOLD = {inspiration:'spark', experiment:'spark'};
function addIdea(kind='spark', text=''){
  const t = (text||'').trim();
  if(t){ S.ideas.unshift({id:uid(), text:t, kind, note:'', createdAt:new Date().toISOString(), tags:parseTags(t)}); saveNow(); sound('success'); rerender(); return; }
  const k = SPARK_KINDS[kind] || SPARK_KINDS.spark;
  const m = openModal(`<h2>${k[0]} New ${esc(k[1])}</h2><input class="inp serif-lg" id="skText" placeholder="${kind==='question'?'What do you want to find out?':'What just occurred to you?'}" autofocus><div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn primary" id="skGo">Catch it</button></div>`, 'narrow');
  const go = () => { const v = m.querySelector('#skText').value.trim(); if(!v) return; m.remove(); S.settings.projectMode = 'ideation'; addIdea(kind, v); };
  m.querySelector('#skGo').onclick = go;
  m.querySelector('#skText').onkeydown = e => { if(e.key === 'Enter') go(); };
}
function migrateIdeas(){ (S.ideas||[]).forEach(i => {
  i.kind = SPARK_FOLD[i.kind] || i.kind || 'spark';
  if(!SPARK_KINDS[i.kind]) i.kind = 'spark';
  i.note = i.note || ''; i.createdAt = i.createdAt || new Date().toISOString(); i.tags = normTags(i.tags||[]); }); }
function renderIdeation(root){
  registerPageEntry({pageName:'Projects', addLabel:'New spark', defaultEntryType:'idea', prefilledFields:{}, options:[
    {icon:'◌', label:'Spark', desc:'A half-thought worth keeping.', run:()=>addIdea('spark')},
    {icon:'?', label:'Question', desc:'Something you want to find out.', run:()=>addIdea('question')},
    ]});
  const ideas = [...(S.ideas||[])];
  const byKind = k => ideas.filter(i => (i.kind||'spark') === k);
  root.innerHTML = `<div class="page">
    <div class="mode-switch rv">${[['ideation','◌ Ideation','sparks and open questions'],['tracking','◉ Tracking','the work already under way']].map(([k,l,d])=>`<button class="${k==='ideation'?'on':''}" data-pmode="${k}" title="${d}">${l}</button>`).join('')}</div>
    <div class="page-head"><h1>Projects</h1></div>
    <div class="card rv" style="margin-bottom:20px"><div class="row" style="gap:8px;flex-wrap:wrap">
      <input class="inp" id="ideaInp" placeholder="What just occurred to you?" style="flex:1;min-width:240px">
      <select class="sel" id="ideaKind" style="width:auto">${Object.entries(SPARK_KINDS).map(([k,v])=>`<option value="${k}">${v[0]} ${v[1]}</option>`).join('')}</select>
      <button class="btn primary" id="ideaAdd">Catch it</button></div>
      <div class="faint" style="font-size:.78rem;margin-top:8px">Hashtags work here too — #kyoto, #bar, #jazz.</div></div>
    <div class="spark-cols">${Object.entries(SPARK_KINDS).map(([k,[ico,label,col]]) => { const list = byKind(k); return `<section class="rv spark-col"><div class="row between"><span class="sc" style="margin:0;color:${col}">${ico} ${label}s</span><span class="mono">${list.length}</span></div>
      <div class="card" style="margin-top:8px;border-left:3px solid ${col}">${list.length ? list.map(i=>`<div class="spark" data-spark="${i.id}"><div class="row between"><span style="flex:1">${ed(`ideas.#${i.id}.text`,{ph:'a spark'})}</span><span class="row" style="gap:4px"><button class="tbtn" data-promote="${i.id}" title="make this a project">promote →</button><button class="del-x inline" data-idel="${i.id}" title="delete">×</button></span></div>
        <div class="spark-note">${ed(`ideas.#${i.id}.note`,{multi:true,ph:'why it caught you, or what it might become'})}</div>
        <div class="row between"><span class="mono">${i.createdAt?fmtDate(i.createdAt.slice(0,10),'med'):''}</span><select class="sel spark-kind" data-ikind="${i.id}">${Object.entries(SPARK_KINDS).map(([kk,vv])=>`<option value="${kk}" ${(i.kind||'spark')===kk?'selected':''}>${vv[0]} ${vv[1]}</option>`).join('')}</select></div></div>`).join('') : `<div class="empty">Nothing yet. ${label==='question'?'What do you not know?':'Catch the next one above.'}</div>`}</div></section>`; }).join('')}</div>
  </div>`;
  $$('[data-pmode]',root).forEach(b => b.onclick = () => { S.settings.projectMode = b.dataset.pmode; saveNow(); rerender(); });
  const add = () => { const t = $('#ideaInp').value.trim(); if(!t) return; S.ideas.unshift({id:uid(), text:t, kind:$('#ideaKind').value, note:'', createdAt:new Date().toISOString(), tags:parseTags(t)}); saveNow(); sound('success'); rerender(); setTimeout(()=>$('#ideaInp')?.focus(),50); };
  $('#ideaAdd').onclick = add; $('#ideaInp').onkeydown = e => { if(e.key==='Enter') add(); };
  $$('[data-ikind]',root).forEach(sel => sel.onchange = () => { byId(S.ideas, sel.dataset.ikind).kind = sel.value; saveNow(); rerender(); });
  $$('[data-promote]',root).forEach(b => b.onclick = () => { const i = byId(S.ideas,b.dataset.promote); S.ideas = S.ideas.filter(x=>x.id!==i.id); S.settings.projectMode = 'tracking'; createProject(i.text); });
  $$('[data-idel]',root).forEach(b => b.onclick = () => { const i = byId(S.ideas, b.dataset.idel); requestDelete({label: i.text, node: b.closest('.spark'), remove: () => spliceOut(S.ideas, x => x.id === i.id)}); });
}
