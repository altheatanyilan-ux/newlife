/* ============================================================
   2. TIMELINE — the museum of the past (with Threads woven in)
   ============================================================ */
function stageEntries(s){ return S.entries.filter(e => (e.links?.stages||[]).includes(s.id) || (e.links?.substages||[]).some(id => (s.substages||[]).some(ss=>ss.id===id))); }
function threadStageCounts(t){ return S.stages.map(s => stageEntries(s).filter(e => (e.links?.threads||[]).includes(t.id)).length); }
function photoTile(p, path){ return `<div class="photo" data-lb="${p.id}"><img src="${p.src}" alt="${esc(p.caption)}"><div class="pctl"><button data-pmeta="${path}" title="caption, date, people">✎</button><button data-pdel="${path}" title="remove photo">×</button></div>${p.caption||p.date?`<div class="pcap">${esc(p.caption)}${p.date?` · ${esc(p.date)}`:''}</div>`:''}</div>`; }
function photoList(path){ return getPath(path); }
document.addEventListener('click', e => {
  const del = e.target.closest('[data-pdel]'); if(del){ e.stopPropagation(); const arr = photoList(del.dataset.pdel.replace(/\.\d+$/,'')); const i = +del.dataset.pdel.split('.').pop(); const p = arr[i]; requestDelete({label: p?.caption || 'Photo', node: del.closest('.photo'), remove: () => spliceOut(arr, x => x === p)}); return; }
  const meta = e.target.closest('[data-pmeta]'); if(meta){ e.stopPropagation(); const path = meta.dataset.pmeta; const p = getPath(path); const m = openModal(`<h2>This photo</h2><img src="${p.src}" style="width:100%;max-height:260px;object-fit:contain;border-radius:8px;margin-bottom:14px"><div class="stack"><div class="field"><label>Caption</label><input class="inp" id="pmCap" value="${esc(p.caption||'')}"></div><div class="field"><label>Date</label><input class="inp" id="pmDate" value="${esc(p.date||'')}" placeholder="2013-10 · or “that summer”"></div><div class="field"><label>People</label><input class="inp" id="pmPpl" value="${esc((p.people||[]).join(', '))}" placeholder="comma-separated"></div><div class="row between"><button class="btn sm ghost danger" id="pmDel">remove photo</button><button class="btn primary" id="pmSave">Save</button></div></div>`,'narrow');
    m.querySelector('#pmSave').onclick = () => { p.caption = m.querySelector('#pmCap').value.trim(); p.date = m.querySelector('#pmDate').value.trim(); p.people = m.querySelector('#pmPpl').value.split(',').map(s=>s.trim()).filter(Boolean); S.people = [...new Set([...(S.people||[]), ...p.people])]; saveNow(); m.remove(); rerender(); sound('save'); };
    m.querySelector('#pmDel').onclick = () => { m.remove(); const arr = photoList(path.replace(/\.\d+$/,'')); requestDelete({label: p.caption || 'Photo', remove: () => spliceOut(arr, x => x === p)}); };
  }
}, true);
function mosaicHTML(s, n=9, hero=false){ const ph = s.photos||[]; let out=''; for(let i=0;i<n;i++){ const p = ph[i % Math.max(ph.length,1)]; const big = i===0 || (hero && i===7); out += ph.length ? `<img src="${p.src}" class="${big?'big':''}" alt="">` : `<div class="tex ${big?'big':''}"></div>`; } return out; }
function catmull(pts, closed=false){ if(pts.length<2) return ''; let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`; for(let i=0;i<pts.length-1;i++){ const p0=pts[i-1]||pts[i], p1=pts[i], p2=pts[i+1], p3=pts[i+2]||p2; const c1=[p1[0]+(p2[0]-p0[0])/6, p1[1]+(p2[1]-p0[1])/6], c2=[p2[0]-(p3[0]-p1[0])/6, p2[1]-(p3[1]-p1[1])/6]; d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`; } return d; }
function ribbonsSVG(width){
  const threads = S.threads; const n = S.stages.length; const H = 200;
  if(!n || !threads.length) return '';
  const counts = S.stages.map(s=>stageEntries(s).length); const total = sum(counts)||1;
  const felt = S.settings.feltTime;
  // x-centres mirror tile layout
  const weights = S.stages.map((s,i)=> felt ? .6 + (counts[i]/Math.max(...counts,1))*1.4 : 1); const W = sum(weights); let acc=0; const xs = weights.map(w => { const x = (acc + w/2)/W*width; acc += w; return x; });
  let out=''; const gapY = H/(threads.length+1);
  threads.forEach((t,ti) => {
    const cs = threadStageCounts(t); const maxc = Math.max(...cs,1); const y0 = gapY*(ti+1);
    const top = xs.map((x,i)=>[x, y0 - (2 + cs[i]/maxc*12)]); const bot = xs.map((x,i)=>[x, y0 + (2 + cs[i]/maxc*12)]).reverse();
    const d = catmull(top) + ' L' + bot[0][0].toFixed(1)+','+bot[0][1].toFixed(1) + catmull(bot).replace(/^M[^ ]+/,'') + ' Z';
    out += `<path d="${d}" fill="${t.color}" opacity=".55" data-thread="${t.id}"><title>${esc(t.name)}</title></path>`;
    const last = xs[n-1];
    if(t.status==='active') out += `<path d="M${last.toFixed(1)},${y0} L${width+40},${y0}" stroke="${t.color}" stroke-width="2" stroke-dasharray="4 6" fill="none" opacity=".6" data-thread="${t.id}"/>`;
    else out += `<circle cx="${last.toFixed(1)}" cy="${y0}" r="5" fill="none" stroke="${t.color}" stroke-width="2" opacity=".8" data-thread="${t.id}"/>` + (t.status==='transmuted' ? `<path d="M${(last-4).toFixed(1)},${y0-4} l8,8 m0,-8 l-8,8" stroke="${t.color}" stroke-width="1.5" opacity=".8"/>`:'');
    out += `<text x="8" y="${(y0-14).toFixed(1)}" style="fill:${t.color};font-family:var(--serif);font-size:11px;letter-spacing:.08em">${esc(t.name.toUpperCase())}</text>`;
  });
  return `<svg viewBox="0 0 ${width} ${H}" preserveAspectRatio="none">${out}</svg>`;
}
function deleteStage(st, node, after){
  requestDelete({label: `${st.char} ${st.name}`, node, after, remove: () => {
    const subIds = new Set((st.substages||[]).map(x=>x.id));
    const touched = S.entries.filter(e => (e.links?.stages||[]).includes(st.id) || (e.links?.substages||[]).some(id => subIds.has(id)));
    const restoreLinks = snapshotLinks(touched);
    touched.forEach(e => { e.links.stages = e.links.stages.filter(x => x !== st.id); e.links.substages = e.links.substages.filter(x => !subIds.has(x)); });
    const back = spliceOut(S.stages, x => x.id === st.id); if(S._lastStage === st.id) S._lastStage = null;
    return () => { back(); restoreLinks(); };
  }});
}
routes.timeline = function(root, params){
  registerPageEntry({pageName:'Timeline', addLabel:'New memory', defaultEntryType:'memory', prefilledFields:{}, hint:'Open a stage to file it there directly.', options:[{label:'New memory', run:()=>EntryActions.memory()}]});
  const tab = params[0]==='threads' ? 'threads' : 'stages';
  /* Threads & Tensions is its own room. The stage spine, the ribbons beneath it
     and the two toggles that govern them all belong to the stage view, so on
     the other tab they are not merely inert — they are not drawn at all. */
  const stageView = tab === 'stages';
  const counts = S.stages.map(s=>stageEntries(s).length); const maxc = Math.max(...counts,1);
  root.innerHTML = `<div class="page">
    <div class="page-head tl-head"><div><h1>Timeline</h1></div>
      ${stageView ? `<div class="row">
        <label class="toggle ${S.settings.feltTime?'on':''}" id="feltToggle"><span>clock time</span><span class="sw"></span><span>felt time</span></label>
        <label class="toggle ${S.settings.ribbons?'on':''}" id="ribToggle"><span class="sw"></span><span>threads</span></label>
      </div>` : ''}</div>
    <div class="tabs"><button class="${tab==='stages'?'active':''}" data-go="#/timeline">Stages</button><button class="${tab==='threads'?'active':''}" data-go="#/timeline/threads">Threads &amp; Tensions</button></div>
    ${stageView ? `<div class="spine-wrap"><div class="spine" id="spine">
      <svg class="curve" viewBox="0 0 1000 120" preserveAspectRatio="none"><path d="M0,60 C250,20 750,100 1000,60" fill="none" stroke="var(--line-2)" stroke-width="1.5"/></svg>
      ${S.stages.map((s,i)=>`<div class="tile ${s.notyet?'notyet':''}" data-stage="${s.id}" style="--c:${s.hue};${S.settings.feltTime?`flex:${(.6 + counts[i]/maxc*1.4).toFixed(2)} 1 0`:''}" tabindex="0">
        <div class="glow"></div><div class="bg">${mosaicHTML(s,9)}</div><div class="veil"></div>
        <div class="fg"><div class="han">${s.char}</div><div class="nm">${esc(s.name)}</div><div class="tg">${esc(s.tagline)}</div><div class="yr">${esc(s.years)} · ${counts[i]} entries</div></div>
      </div>`).join('')}
      <div class="tile add-stage" id="addStage" tabindex="0" title="Add a life stage"><div class="fg"><div class="han">＋</div><div class="nm">add a stage</div><div class="tg">a chapter that spans years</div></div></div>
    </div></div>
    <div class="ribbons" id="ribbons" ${S.settings.ribbons?'':'hidden'}></div><div class="ribbon-tip" id="ribTip"></div>` : ''}
    <div id="tlBody"></div>
  </div>`;
  if(stageView){
  $('#addStage').onclick = () => createStage(); $('#addStage').onkeydown = e => { if(e.key==='Enter') createStage(); };
  const spine = $('#spine');
  spine.addEventListener('mouseover', e => { if(e.target.closest('.tile')) spine.classList.add('hovering'); });
  spine.addEventListener('mouseleave', () => spine.classList.remove('hovering'));
  $$('.tile[data-stage]', root).forEach(t => { const go = () => { t.querySelector('.han').style.viewTransitionName = 'stage-char'; t.querySelector('.bg').style.viewTransitionName = 'stage-mosaic'; S._lastStage = t.dataset.stage; navigate('#/stage/'+t.dataset.stage); }; t.onclick = go; t.onkeydown = e => { if(e.key==='Enter') go(); }; });
  if(S._lastStage){ const t = root.querySelector(`.tile[data-stage="${S._lastStage}"]`); if(t){ t.querySelector('.han').style.viewTransitionName='stage-char'; t.querySelector('.bg').style.viewTransitionName='stage-mosaic'; } }
  const wrap = $('.spine-wrap', root); wrap.addEventListener('wheel', e => { if(Math.abs(e.deltaY) > Math.abs(e.deltaX) && wrap.scrollWidth > wrap.clientWidth){ wrap.scrollLeft += e.deltaY; e.preventDefault(); } }, {passive:false});
  $('#feltToggle').onclick = () => { S.settings.feltTime = !S.settings.feltTime; saveNow(); $('#feltToggle').classList.toggle('on', S.settings.feltTime); $$('.tile[data-stage]',root).forEach((t,i)=> t.style.flex = S.settings.feltTime ? `${(.6 + counts[i]/maxc*1.4).toFixed(2)} 1 0` : ''); drawRibbons(); };
  $('#ribToggle').onclick = () => { S.settings.ribbons = !S.settings.ribbons; saveNow(); $('#ribToggle').classList.toggle('on', S.settings.ribbons); $('#ribbons').hidden = !S.settings.ribbons; drawRibbons(); };
  function drawRibbons(){ const r = $('#ribbons'); if(!r || r.hidden) return; const w = r.clientWidth || 1000; r.innerHTML = ribbonsSVG(w); r.querySelectorAll('[data-thread]').forEach(p => { p.onmouseenter = e => { r.classList.add('hov'); r.querySelectorAll(`[data-thread="${p.dataset.thread}"]`).forEach(x=>x.classList.add('hot')); const t = byId(S.threads,p.dataset.thread); const cs = threadStageCounts(t); $('#ribTip').style.display='block'; $('#ribTip').innerHTML = `<b style="color:${t.color}">${esc(t.name)}</b> · ${t.status}<br><span class="mono">${S.stages.map((s,i)=>`${s.char}${cs[i]}`).join(' ')}</span>`; }; p.onmousemove = e => { const tip = $('#ribTip'); const rect = r.getBoundingClientRect(); tip.style.left = (e.clientX-rect.left+14)+'px'; tip.style.top = (e.clientY-rect.top-10)+'px'; }; p.onmouseleave = () => { r.classList.remove('hov'); r.querySelectorAll('.hot').forEach(x=>x.classList.remove('hot')); $('#ribTip').style.display='none'; }; p.onclick = () => openThreadNarrative(p.dataset.thread); }); }
  drawRibbons(); window.addEventListener('resize', debounce(drawRibbons, 200), {once:true});
  }
  const body = $('#tlBody');
  if(tab==='threads') renderThreadsTab(body); else body.innerHTML = `<div class="section rv" style="max-width:var(--content)"><span class="sc">How to read this room</span><p class="muted">Hover a stage to feel it come forward. Click to walk in. The coloured ribbons beneath are your Threads — recurring motifs that run through many stages, thickening where they had many entries and thinning where they went quiet. Active threads continue, dashed, toward the Vision Tree. Toggle <em>felt time</em> to let dense stages stretch and thin ones compress.</p></div>`;
  reveal(body);
};

function renderThreadsTab(body){
  body.innerHTML = `<div class="grid c2" style="margin-top:24px;align-items:start">
    <div class="card rv"><div class="row between"><h3>Threads</h3><button class="btn sm" id="addThread">+ thread</button></div><p class="muted" style="font-size:.85rem">Recurring motifs, not contained in one stage but threading through many. Name them, colour them, and watch where they thicken.</p>
      <div class="thread-list">${S.threads.map(t=>{ const cs = threadStageCounts(t); return `<div class="th"><span class="sw" style="background:${t.color}"></span><div style="flex:1">
        <div class="row between"><b class="serif" style="font-size:1.1rem">${ed(`threads.#${t.id}.name`,{ph:'thread name'})}</b><span class="row"><select class="sel" style="width:auto;padding:3px 8px;font-size:.72rem;padding-right:22px" data-tstatus="${t.id}">${['active','dormant','resolved','transmuted'].map(s=>`<option ${t.status===s?'selected':''}>${s}</option>`).join('')}</select><input type="color" value="${t.color}" data-tcolor="${t.id}" style="width:26px;height:26px;border:none;background:none;cursor:pointer;padding:0"><button class="tbtn" data-tdel="${t.id}" style="color:var(--faint)">remove…</button></span></div>
        <div class="muted" style="font-size:.85rem">${ed(`threads.#${t.id}.desc`,{multi:true,ph:'What is this pattern? When did you first notice it?'})}</div>
        <div class="row" style="margin-top:6px"><span class="mono">${sum(cs)} entries · ${S.stages.map((s,i)=>cs[i]?`<span style="color:${s.hue}">${s.char}${cs[i]}</span>`:'').join(' ')}</span><button class="btn sm ghost" data-tn="${t.id}">read the narrative →</button></div>
      </div></div>`; }).join('')}</div></div>
    <div class="card rv"><div class="row between"><h3>Tensions</h3><button class="btn sm" id="addTension">+ tension</button></div><p class="muted" style="font-size:.85rem">Dialectical pairs you live between. Log where you are; the history shows the oscillation.</p>
      ${S.tensions.map(tn => { const log = [...tn.log].sort((a,b)=>a.date<b.date?-1:1); const cur = log.slice(-1)[0]?.pos ?? 50; const th = byId(S.threads, tn.threadId); return `<div class="tension"><div class="poles"><span>${ed(`tensions.#${tn.id}.left`)}</span><span class="mono">${th?`↔ ${esc(th.name)}`:''}</span><span>${ed(`tensions.#${tn.id}.right`)}</span></div>
        <input type="range" class="slider" min="0" max="100" value="${cur}" data-tension="${tn.id}" style="--c:${th?.color||'var(--terra)'}">
        <div class="row between" style="margin-top:6px"><span class="mono">${log.length} readings · latest ${log.length?fmtDate(log.slice(-1)[0].date,'med'):'—'}</span><span class="row"><select class="sel" style="width:auto;padding:2px 6px;font-size:.68rem;padding-right:22px" data-tlink="${tn.id}"><option value="">no thread</option>${S.threads.map(t=>`<option value="${t.id}" ${tn.threadId===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select><button class="btn sm ghost" data-tlog="${tn.id}">log reading</button><button class="tbtn" data-tndel="${tn.id}" style="color:var(--faint)">remove…</button></span></div>
        <div style="margin-top:8px">${sparkline(log.map(l=>l.pos),{h:36,min:0,max:100,color:th?.color||'var(--terra)',dots:true,labels:log.map(l=>`${fmtDate(l.date,'med')}: ${l.pos} ${l.note?'— '+l.note:''}`)})}<div class="row between mono"><span>← ${esc(tn.left)}</span><span>${esc(tn.right)} →</span></div></div>
        ${log.length?`<details><summary><span class="mono">readings</span></summary><div class="body">${tn.log.map((l,i)=>`<div class="reading row between" style="padding:4px 0;font-size:.8rem"><span class="mono">${fmtDate(l.date,'med')} · ${l.pos}${l.note?' — '+esc(l.note):''}</span><button class="del-x inline" data-tn="${tn.id}" data-rdel="${i}" title="delete reading">×</button></div>`).join('')}</div></details>`:''}
      </div>`; }).join('')}
    </div>
  </div>`;
  $('#addThread').onclick = () => { S.threads.push({id:uid(),name:'New thread',desc:'',color:['#d4a44c','#6b7f8e','#a0727e','#7f916a','#c47832','#8a7f9e'][S.threads.length%6],status:'active'}); saveNow(); rerender(); };
  $('#addTension').onclick = () => { S.tensions.push({id:uid(),left:'Left pole',right:'Right pole',threadId:null,log:[{date:today(),pos:50,note:''}]}); saveNow(); rerender(); };
  $$('[data-tstatus]',body).forEach(s => s.onchange = () => { byId(S.threads,s.dataset.tstatus).status = s.value; saveNow(); rerender(); });
  $$('[data-tcolor]',body).forEach(s => s.onchange = () => { byId(S.threads,s.dataset.tcolor).color = s.value; saveNow(); rerender(); });
  $$('[data-tdel]',body).forEach(b => b.onclick = () => { const t = byId(S.threads, b.dataset.tdel); requestDelete({label: t.name, node: b.closest('.th'), remove: () => { const touched = S.entries.filter(e => (e.links?.threads||[]).includes(t.id)); const rl = snapshotLinks(touched); touched.forEach(e => e.links.threads = e.links.threads.filter(x => x !== t.id)); const tens = S.tensions.filter(x => x.threadId === t.id); tens.forEach(x => x.threadId = null); const back = spliceOut(S.threads, x => x.id === t.id); return () => { back(); rl(); tens.forEach(x => x.threadId = t.id); }; }}); });
  $$('[data-tndel]',body).forEach(b => b.onclick = () => { const tn = byId(S.tensions, b.dataset.tndel); requestDelete({label: `${tn.left} ↔ ${tn.right}`, node: b.closest('.tension'), remove: () => spliceOut(S.tensions, x => x.id === tn.id)}); });
  $$('[data-rdel]',body).forEach(b => b.onclick = () => { const tn = byId(S.tensions, b.dataset.tn); const r = tn.log[+b.dataset.rdel]; requestDelete({label: `Reading ${fmtDate(r.date,'med')}`, node: b.closest('.reading'), remove: () => spliceOut(tn.log, x => x === r)}); });
  $$('[data-tn]',body).forEach(b => b.onclick = () => openThreadNarrative(b.dataset.tn));
  $$('[data-tlink]',body).forEach(s => s.onchange = () => { byId(S.tensions,s.dataset.tlink).threadId = s.value||null; saveNow(); rerender(); });
  $$('[data-tlog]',body).forEach(b => b.onclick = () => { const tn = byId(S.tensions,b.dataset.tlog); const pos = +body.querySelector(`[data-tension="${tn.id}"]`).value; const m = openModal(`<h2>Log a reading</h2><p class="muted">${esc(tn.left)} ${pos} / ${100-pos} ${esc(tn.right)}</p><input class="inp" id="tnNote" placeholder="optional note — what's pulling you this way?"><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="tnSave">Log</button></div>`,'narrow'); m.querySelector('#tnSave').onclick = () => { tn.log.push({date:today(),pos,note:m.querySelector('#tnNote').value}); saveNow(); m.remove(); rerender(); sound('save'); }; });
}
function openThreadNarrative(tid){
  const t = byId(S.threads,tid); const es = sortEntries(S.entries.filter(e=>(e.links?.threads||[]).includes(tid))).reverse();
  const byStage = {}; es.forEach(e => { const sid = (e.links.stages||[])[0] || 'none'; (byStage[sid] = byStage[sid]||[]).push(e); });
  const order = [...S.stages.map(s=>s.id),'none'];
  const people = S.people.filter(p=>(p.threadsLinked||[]).includes(tid));
  openPanel(`<div class="mono" style="margin-bottom:6px">thread narrative · ${t.status}</div><h2 style="color:${t.color}">${esc(t.name)}</h2><p class="quote">${esc(t.desc)}</p>
    ${people.length ? `<div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:10px">${people.map(p=>personChip(p.id)).join('')}</div>` : ''}
    ${es.length ? order.filter(k=>byStage[k]).map(k => { const s = byId(S.stages,k); return `<div class="section" style="margin-top:28px"><span class="sc" style="color:${s?.hue||'var(--muted)'}">${s?`${s.char} ${s.name} · ${s.years}`:'untethered to a stage'}</span>${byStage[k].map(e=>entryCard(e,{clamp:false,tools:false})).join('')}</div>`; }).join('') : '<div class="empty">No entries carry this thread yet. Tag one from the Add Entry modal.</div>'}`);
  $$('#panel .rv').forEach(n=>n.classList.add('in'));
}

/* ---------- Stage detail ---------- */
hooks.stageNarrative = (sid, oldV, newV) => { const s = byId(S.stages,sid); if(!s || !oldV.trim() || oldV===newV) return; const a = new Set(oldV.toLowerCase().split(/\W+/)), b = new Set(newV.toLowerCase().split(/\W+/)); let shared=0; a.forEach(w=>{ if(b.has(w)) shared++; }); const sim = shared/Math.max(a.size,1); if(sim < .85 || Math.abs(oldV.length-newV.length) > oldV.length*.2){ s.narrativeHistory = s.narrativeHistory||[]; s.narrativeHistory.push({date:today(), text:oldV}); saveNow(); toast('The story you used to tell has been kept.'); } };
routes.stage = function(root, params){
  const s = byId(S.stages, params[0]); if(!s){ navigate('#/timeline'); return; }
  S._lastStage = s.id;
  registerPageEntry({pageName:'Timeline', addLabel:`New memory in ${s.name}`, defaultEntryType:'memory', prefilledFields:{links:{stages:[s.id]}}, options:[{label:'New memory', run:(pre)=>EntryActions.memory(pre)}]});
  const es = sortEntries(stageEntries(s)); const memories = es.filter(e=>e.type==='memory');
  const threadsHere = S.threads.filter(t => es.some(e=>(e.links?.threads||[]).includes(t.id)));
  const cur = latestSnapshot()?.ratings || {};
  const axes = S.valueOrder.map(id=>{ const v=byId(S.values,id); return {name:v.name, short:v.name.split(' ')[0], color:v.color}; });
  root.innerHTML = `<div class="page" style="--c:${s.hue}">
    <div class="stage-hero" style="margin-top:34px"><div class="mosaic" style="view-transition-name:stage-mosaic">${mosaicHTML(s,18,true)}</div><div class="veil"></div>
      <button class="btn sm addphoto" id="addPhotos">+ photos</button><input type="file" id="photoFile" accept="image/*" multiple hidden>
      <div class="inner"><div class="han-wrap"><div class="han" style="view-transition-name:stage-char">${ed(`stages.#${s.id}.char`,{cls:'han-ed',ph:'一'})}</div><button class="han-edit" id="charEdit" title="change this character">✎</button></div><div class="meta"><div class="mono" style="margin-bottom:6px">stage ${s.num} of ${S.stages.length}</div><h1>${ed(`stages.#${s.id}.name`)}</h1><div class="quote" style="margin-top:8px">${ed(`stages.#${s.id}.tagline`,{ph:'a tagline'})}</div><div class="mono" style="margin-top:8px">${ed(`stages.#${s.id}.years`,{ph:'years'})}</div></div></div>
    </div>
    ${s.photos?.length?`<div class="gallery rv" style="margin:-16px 0 30px">${s.photos.map((p,i)=>photoTile(p,`stages.#${s.id}.photos.${i}`)).join('')}</div>`:''}

    <section class="section rv"><span class="sc">The story I tell about this stage</span>
      ${ed(`stages.#${s.id}.narrative`,{multi:true,mdr:true,cls:'prose serif-lg',ph:'Your current interpretation of this era. It will change. That is the point.',hook:'stageNarrative:'+s.id})}
      <div class="row" style="margin-top:10px"><button class="btn sm ghost" id="saveVersion">keep this version</button></div>
      <details style="margin-top:14px"><summary><span class="sc">The story I used to tell</span><span class="mono">${(s.narrativeHistory||[]).length} versions</span></summary><div class="body versions">${(s.narrativeHistory||[]).length ? s.narrativeHistory.map((v,i)=>`<div class="v"><div class="mono" style="margin-bottom:6px">${fmtDate(v.date,'long')}</div>${md(v.text)}<button class="del-x" data-verdel="${i}" title="delete this version">×</button></div>`).reverse().join('') : '<div class="empty">No previous versions yet. Rewrite the story above and the old one will be kept here.</div>'}</div></details>
    </section>

    <section class="section rv"><div class="row between"><span class="sc" style="margin:0">Sub-stages</span><button class="btn sm" id="addSub">+ sub-stage</button></div>
      ${(s.substages||[]).map((ss,i)=>{ const fe = memories.filter(e=>(e.links?.substages||[]).includes(ss.id)); const ph = ss.photos||[]; return `<div class="substage ${ph.length?'plated':''}" data-ss="${ss.id}">
        ${ph.length ? `<div class="ss-plate" aria-hidden="true"><div class="ss-plate-img" style="background-image:url(&quot;${esc(ph[0].src)}&quot;)"></div><div class="ss-plate-wash"></div></div>` : ''}
        <div class="ss-body">
        <div class="hd"><h3>${ed(`stages.#${s.id}.substages.${i}.name`,{ph:'name this chapter'})}</h3><span class="row" style="margin-left:auto"><button class="tbtn" data-ssup="${i}">↑</button><button class="tbtn" data-ssdown="${i}">↓</button><button class="tbtn" data-ssdel="${i}">×</button></span></div>
        <div class="muted" style="max-width:var(--content)">${ed(`stages.#${s.id}.substages.${i}.desc`,{multi:true,mdr:true,ph:'What happened here? Markdown welcome.'})}</div>
        <div class="row" style="margin:8px 0"><button class="btn sm ghost" data-ssphoto="${i}">+ images</button><button class="btn sm ghost" data-ssmem="${ss.id}">+ formative event</button>${ph.length>1?`<button class="btn sm ghost" data-ssgal="${i}">${ph.length} images</button>`:''}</div>
        ${ph.length && S._ssGalOpen?.[ss.id] ? `<div class="gallery">${ph.map((p,j)=>photoTile(p,`stages.#${s.id}.substages.${i}.photos.${j}`)).join('')}</div>` : ''}
        ${fe.length?`<div class="sc" style="margin-top:8px">Formative events</div>`:''}
        ${fe.map(e=>`<div class="formative"><div class="row between"><b class="serif" style="font-size:1.1rem">${esc(e.title)}</b><span class="mono">${esc(fmtDate(e.occurredAt,'med'))} <button class="tbtn" data-edit="${e.id}">edit</button></span></div><button class="del-x" data-del="${e.id}" title="delete">×</button><div class="muted" style="margin-top:4px;line-height:1.7">${md(e.body)}</div>${e.media?.length?`<div class="thumbs">${e.media.map(m=>`<div class="photo" style="width:72px;height:72px" data-lb="${m.id}"><img src="${m.src}"></div>`).join('')}</div>`:''}<div class="installed"><div class="k">What this installed in me</div>${ed(`entries.#${e.id}.extra.installed`,{multi:true,ph:'The belief, fear, pattern, or capability this event left behind.'})}</div></div>`).join('')}
        </div>
      </div>`; }).join('')}
      ${memories.filter(e=>!(e.links?.substages||[]).length).length?`<div class="substage"><div class="hd"><h3 class="muted">Formative events not tied to a sub-stage</h3></div>${memories.filter(e=>!(e.links?.substages||[]).length).map(e=>`<div class="formative"><div class="row between"><b class="serif" style="font-size:1.1rem">${esc(e.title)}</b><span class="mono">${esc(fmtDate(e.occurredAt,'med'))} <button class="tbtn" data-edit="${e.id}">edit</button></span></div><button class="del-x" data-del="${e.id}" title="delete">×</button><div class="muted" style="margin-top:4px;line-height:1.7">${md(e.body)}</div><div class="installed"><div class="k">What this installed in me</div>${ed(`entries.#${e.id}.extra.installed`,{multi:true,ph:'The belief, fear, pattern, or capability this event left behind.'})}</div></div>`).join('')}</div>`:''}
    </section>

    <section class="section rv"><span class="sc">Threads present in this stage</span>
      <div class="row">${threadsHere.length ? threadsHere.map(t=>`<span class="chip on click" style="--c:${t.color}" data-thread-open="${t.id}"><span class="dot"></span>${esc(t.name)} · ${es.filter(e=>(e.links.threads||[]).includes(t.id)).length}</span>`).join('') : '<span class="empty">No threads tagged here yet.</span>'}</div>
    </section>

    <section class="section rv"><span class="sc">Retrospective values reading</span>
      <p class="muted" style="font-size:.85rem;max-width:var(--content)">As best you remember, how congruent were you with each value during this stage? These readings let the Values radar span your whole life, not just the day you started logging.</p>
      <div class="grid c2" style="align-items:start"><div class="retro-values" style="grid-template-columns:1fr">${S.valueOrder.map(id=>{ const v = byId(S.values,id); return `<div class="rv-row"><span style="color:${v.color}">${esc(v.name)}</span><input type="range" class="slider" min="0" max="100" value="${s.retroValues?.[id]??50}" data-retro="${id}" style="--c:${v.color}"><span class="mono" data-retro-lbl="${id}">${s.retroValues?.[id]??'–'}</span></div>`; }).join('')}</div>
      <div id="retroRadar">${radar(axes,[{vals:S.valueOrder.map(id=>cur[id]??0),color:'var(--faint)',dashed:true},{vals:S.valueOrder.map(id=>s.retroValues?.[id]??0),color:s.hue}],{size:320})}<div class="legend" style="justify-content:center"><span style="--c:${s.hue}">this stage</span><span style="--c:var(--faint)">today, ghosted</span></div></div></div>
    </section>

    <div class="grid c2 section">
      <section class="rv"><div class="row between"><span class="sc">Stage soundtrack</span><button class="btn sm ghost" id="addSong">+ song</button></div>
        <ul class="songs">${(s.soundtrack||[]).map((song,i)=>`<li class="row between">${ed(`stages.#${s.id}.soundtrack.${i}.t`,{ph:'song — artist'})}<button class="tbtn" data-songdel="${i}">×</button></li>`).join('')}</ul></section>
      <section class="rv"><span class="sc">Letters across time</span>
        <div class="stack"><div class="letter" style="--c:${s.hue}"><div class="who">To myself in ${esc(s.name)}, from now</div>${ed(`stages.#${s.id}.letters.to`,{multi:true,mdr:true,ph:'Dear you —'})}</div>
        <div class="letter" style="--c:${s.hue}"><div class="who">From that self, to now</div>${ed(`stages.#${s.id}.letters.from`,{multi:true,mdr:true,ph:'Written as the person you were then, to the person reading this.'})}</div></div></section>
    </div>

    <section class="section rv"><div class="row between"><span class="sc">Artifacts shelf</span><span class="row"><button class="btn sm ghost" id="addArtifact">+ artifact</button><input type="file" id="artFile" accept="image/*" hidden></span></div>
      <div class="shelf">${(s.artifacts||[]).length ? s.artifacts.map((a,i)=>`<div class="artifact" style="--rot:${((i*37)%9-4)}deg"><div class="paper" ${a.src?`data-lb="${a.id}"`:''}>${a.src?`<img src="${a.src}" alt="${esc(a.caption)}">`:esc(a.caption)}</div><div class="cap">${ed(`stages.#${s.id}.artifacts.${i}.caption`,{ph:'caption'})} <span class="mono">${ed(`stages.#${s.id}.artifacts.${i}.date`,{ph:'date'})}</span> <button class="tbtn" data-artdel="${i}">×</button></div></div>`).join('') : '<div class="empty">Tickets, letters, report cards, handwriting. Scan them and set them here.</div>'}</div>
    </section>

    <section class="section rv"><div class="row between"><span class="sc">Everything from this stage</span></div>
      ${es.filter(e=>e.type!=='memory').map(e=>entryCard(e)).join('') || '<div class="empty">Only memories so far. Add a reflection, a quote, a dream.</div>'}
    </section>
    ${moreSection(`<div class="row" style="gap:20px;flex-wrap:wrap"><div class="field"><label>Character</label>${ed(`stages.#${s.id}.char`,{cls:'serif',ph:'一'})}</div><div class="field"><label>Accent colour</label><input type="color" id="stageHue" value="${s.hue}" style="width:40px;height:28px;border:none;background:none;padding:0;cursor:pointer"></div><div class="field"><label>Order</label><span class="mono">stage ${s.num} of ${S.stages.length}</span> <button class="btn sm ghost" id="stageUp">↑</button><button class="btn sm ghost" id="stageDown">↓</button></div></div>
      <div class="danger-zone"><span>Stages are the load-bearing walls of the house. Deleting one keeps its entries but unlinks them.</span><button class="btn sm ghost danger" id="delStage">Delete this stage</button></div>`, 'More about this stage')}
  </div>`;
  $('#addPhotos').onclick = () => $('#photoFile').click();
  $('#photoFile').onchange = e => readImages(e.target.files, img => { s.photos = s.photos||[]; s.photos.push(img); saveNow(); rerender(); });
  $('#saveVersion').onclick = () => { s.narrativeHistory = s.narrativeHistory||[]; s.narrativeHistory.push({date:today(), text:s.narrative}); saveNow(); toast('Version kept.'); rerender(); };
  $('#addSub').onclick = () => { s.substages.push({id:uid(),name:'New chapter',desc:'',photos:[]}); saveNow(); rerender(); };
  $$('[data-ssdel]',root).forEach(b => b.onclick = () => { const ss = s.substages[+b.dataset.ssdel]; requestDelete({label: ss.name, node: b.closest('.substage'), remove: () => { const touched = S.entries.filter(e => (e.links?.substages||[]).includes(ss.id)); const rl = snapshotLinks(touched); touched.forEach(e => e.links.substages = e.links.substages.filter(x => x !== ss.id)); const back = spliceOut(s.substages, x => x === ss); return () => { back(); rl(); }; }}); });
  $$('[data-verdel]',root).forEach(b => b.onclick = () => { const v = s.narrativeHistory[+b.dataset.verdel]; requestDelete({label: `Version from ${fmtDate(v.date,'med')}`, node: b.closest('.v'), remove: () => spliceOut(s.narrativeHistory, x => x === v)}); });
  $('#charEdit') && ($('#charEdit').onclick = () => { const n = root.querySelector('.han .ed'); if(n) beginEdit(n); });
  $('#delStage').onclick = () => deleteStage(s, null, () => navigate('#/timeline'));
  $('#stageHue').onchange = e => { s.hue = e.target.value; saveNow(); rerender(); };
  const moveStage = d => { const i = S.stages.indexOf(s), j = i + d; if(j < 0 || j >= S.stages.length) return; [S.stages[i], S.stages[j]] = [S.stages[j], S.stages[i]]; S.stages.forEach((x,k) => x.num = k+1); saveNow(); rerender(); };
  $('#stageUp').onclick = () => moveStage(-1); $('#stageDown').onclick = () => moveStage(1);
  $$('[data-ssup]',root).forEach(b => b.onclick = () => { const i=+b.dataset.ssup; if(i>0){ [s.substages[i-1],s.substages[i]]=[s.substages[i],s.substages[i-1]]; saveNow(); rerender(); } });
  $$('[data-ssdown]',root).forEach(b => b.onclick = () => { const i=+b.dataset.ssdown; if(i<s.substages.length-1){ [s.substages[i+1],s.substages[i]]=[s.substages[i],s.substages[i+1]]; saveNow(); rerender(); } });
  $$('[data-ssphoto]',root).forEach(b => b.onclick = () => { const inp = el('<input type="file" accept="image/*" multiple hidden>'); document.body.appendChild(inp); inp.onchange = e => { readImages(e.target.files, img => { const ss = s.substages[+b.dataset.ssphoto]; ss.photos = ss.photos||[]; ss.photos.push(img); saveNow(); rerender(); }); inp.remove(); }; inp.click(); });
  $$('[data-ssmem]',root).forEach(b => b.onclick = () => openEntryModal({type:'memory', links:{stages:[s.id], substages:[b.dataset.ssmem]}}));
  /* the images are the ground the chapter is printed on; the grid of tiles is
     only for arranging them, so it stays folded until asked for */
  $$('[data-ssgal]',root).forEach(b => b.onclick = () => { const ss = s.substages[+b.dataset.ssgal];
    S._ssGalOpen = S._ssGalOpen || {}; S._ssGalOpen[ss.id] = !S._ssGalOpen[ss.id]; rerender(); });
  $$('[data-thread-open]',root).forEach(c => c.onclick = () => openThreadNarrative(c.dataset.threadOpen));
  $$('[data-retro]',root).forEach(r => { r.oninput = () => { root.querySelector(`[data-retro-lbl="${r.dataset.retro}"]`).textContent = r.value; }; r.onchange = () => { s.retroValues = s.retroValues||{}; s.retroValues[r.dataset.retro] = +r.value; saveNow(); $('#retroRadar').innerHTML = radar(axes,[{vals:S.valueOrder.map(id=>cur[id]??0),color:'var(--faint)',dashed:true},{vals:S.valueOrder.map(id=>s.retroValues?.[id]??0),color:s.hue}],{size:320}) + `<div class="legend" style="justify-content:center"><span style="--c:${s.hue}">this stage</span><span style="--c:var(--faint)">today, ghosted</span></div>`; }; });
  $('#addSong').onclick = () => { s.soundtrack = s.soundtrack||[]; s.soundtrack.push({t:''}); saveNow(); rerender(); };
  $$('[data-songdel]',root).forEach(b => b.onclick = () => { const song = s.soundtrack[+b.dataset.songdel]; requestDelete({label: song.t || 'Song', node: b.closest('li'), remove: () => spliceOut(s.soundtrack, x => x === song)}); });
  $('#addArtifact').onclick = () => $('#artFile').click();
  $('#artFile').onchange = e => { if(!e.target.files.length){ s.artifacts.push({id:uid(),caption:'New artifact',date:'',src:''}); saveNow(); rerender(); return; } readImages(e.target.files, img => { s.artifacts = s.artifacts||[]; s.artifacts.push({id:img.id,caption:'',date:'',src:img.src}); saveNow(); rerender(); }); };
  $$('[data-artdel]',root).forEach(b => b.onclick = () => { const a = s.artifacts[+b.dataset.artdel]; requestDelete({label: a.caption || 'Artifact', node: b.closest('.artifact'), remove: () => spliceOut(s.artifacts, x => x === a)}); });
  root.querySelectorAll('.artifact .paper[data-lb]').forEach(p => p.onclick = () => lightbox(p.querySelector('img').src, p.nextElementSibling?.textContent||''));
};

/* ---------- stages: create, renumber, keyboard stepping ---------- */
const STAGE_HUES = ['#d4a44c','#a0855a','#7f916a','#6b7f8e','#a0727e','#c47832','#8a8d8f','#b08968','#9a8fb8','#6fa39a'];
function renumberStages(){ S.stages.forEach((s,i) => s.num = i+1); }
function createStage(){
  const s = {id:uid(), num:0, char:'新', name:'New stage', tagline:'', hue:STAGE_HUES[S.stages.length % STAGE_HUES.length], years:'', narrative:'', narrativeHistory:[], substages:[], photos:[], soundtrack:[], artifacts:[], letters:{to:'',from:''}, retroValues:{}, notyet:false};
  const ny = S.stages.findIndex(x => x.notyet); if(ny >= 0) S.stages.splice(ny, 0, s); else S.stages.push(s);
  renumberStages(); saveNow(); sound('success'); navigate('#/stage/'+s.id);
  setTimeout(() => { const n = document.querySelector('.stage-hero h1 .ed'); if(n){ beginEdit(n); n.querySelector('input')?.select(); } toast('A new room in the house. Name it, give it years, and set its character under More.', 6000); }, 350);
}
function migrateStages(){ S.stages.forEach(s => { if(s.notyet === undefined) s.notyet = s.name === 'Not Yet'; s.narrativeHistory ||= []; s.substages ||= []; s.photos ||= []; s.soundtrack ||= []; s.artifacts ||= []; s.letters ||= {to:'',from:''}; s.retroValues ||= {}; }); renumberStages(); }
/* ← → : previous / next stage on a stage page; move focus along the spine on the Timeline */
function stepTimeline(dir){
  const {name, params} = parseHash();
  if(name === 'stage'){ const i = S.stages.findIndex(x => x.id === params[0]); const nx = S.stages[i + dir]; if(!nx) return false; navigate('#/stage/'+nx.id); return true; }
  if(name === 'timeline'){ const tiles = $$('#spine .tile[data-stage]'); if(!tiles.length) return false; const cur = tiles.findIndex(t => t === document.activeElement || t.classList.contains('kbd')); const ni = clamp((cur < 0 ? (dir > 0 ? -1 : tiles.length) : cur) + dir, 0, tiles.length-1); tiles.forEach(t => t.classList.remove('kbd')); tiles[ni].classList.add('kbd'); tiles[ni].focus({preventScroll:true}); tiles[ni].scrollIntoView({block:'nearest', inline:'center', behavior:reduced()?'instant':'smooth'}); return true; }
  return false;
}
