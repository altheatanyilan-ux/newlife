/* ============================================================
   4. VISION TREE — the greenhouse of the future
   ============================================================ */
const qpt = (p0,c,p1,t) => [ (1-t)*(1-t)*p0[0] + 2*(1-t)*t*c[0] + t*t*p1[0], (1-t)*(1-t)*p0[1] + 2*(1-t)*t*c[1] + t*t*p1[1] ];
const qtan = (p0,c,p1,t) => { const dx = 2*(1-t)*(c[0]-p0[0]) + 2*t*(p1[0]-c[0]), dy = 2*(1-t)*(c[1]-p0[1]) + 2*t*(p1[1]-c[1]); return Math.atan2(dy,dx); };
function lerpColor(a,b,t){ const pa = a.match(/\w\w/g).map(x=>parseInt(x,16)), pb = b.match(/\w\w/g).map(x=>parseInt(x,16)); return '#' + pa.map((x,i)=>Math.round(x+(pb[i]-x)*t).toString(16).padStart(2,'0')).join(''); }
function layoutTree(W, H){
  const trunkX = W*.5, top = 70, bottom = H-30; const segH = (bottom-top)/S.eras.length;
  const seg = {}; S.eras.forEach((e,i) => seg[e.id] = {y1: bottom - i*segH, y0: bottom - (i+1)*segH});
  const nodes = {}; const info = {}; S.visions.forEach(v => info[v.id] = vividness(v));
  const roots = S.visions.filter(v => !v.parentId || !byId(S.visions, v.parentId));
  const byEra = {}; roots.forEach(v => (byEra[v.era] = byEra[v.era]||[]).push(v));
  let gi = 0;
  Object.entries(byEra).forEach(([era, vs]) => { const sg = seg[era] || seg[S.eras[0].id]; vs.forEach((v,i) => { const t = (i+1)/(vs.length+1); const y = sg.y1 - t*(sg.y1-sg.y0); const side = gi++ % 2 ? 1 : -1; place(v, [trunkX, y], side, side>0 ? -Math.PI*.22 : -Math.PI*.78, 0); }); });
  function place(v, start, side, angle, depth){
    const sc = info[v.id].score; const len = (95 + sc*1.5) * Math.pow(.82, depth) * Math.min(1, W/900);
    const end = [start[0] + Math.cos(angle)*len, start[1] + Math.sin(angle)*len];
    const mid = [(start[0]+end[0])/2, (start[1]+end[1])/2]; const perp = angle - Math.PI/2; const bend = len*.22;
    const c = [mid[0] + Math.cos(perp)*bend*side*-1, mid[1] + Math.sin(perp)*bend*side*-1];
    nodes[v.id] = {v, start, end, c, angle, side, depth, len, ...info[v.id]};
    const kids = S.visions.filter(k => k.parentId === v.id);
    kids.forEach((k,i) => { const t = .55 + i*.15; const p = qpt(start,c,end,Math.min(t,.85)); const ks = i%2 ? -side : side; const a = angle + (ks===side ? -.55 : .5)*side*-1; place(k, p, ks, a, depth+1); });
  }
  return {nodes, trunkX, top, bottom, seg};
}
function treeSVG(W, H){
  const {nodes, trunkX, top, bottom, seg} = layoutTree(W,H);
  const month = new Date().getMonth(); const season = [-6,-5,-2,2,4,6,7,6,3,0,-3,-6][month];
  let g = `<defs><filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><linearGradient id="trunk" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#3a2c22"/><stop offset="1" stop-color="#5a4634"/></linearGradient></defs>`;
  // roots + trunk
  g += `<path d="M${trunkX-40},${H} Q${trunkX-10},${bottom+10} ${trunkX},${bottom} Q${trunkX+10},${bottom+10} ${trunkX+40},${H}" fill="url(#trunk)" opacity=".8"/>`;
  g += `<path d="M${trunkX},${bottom} C${trunkX-8},${(bottom+top)/2} ${trunkX+8},${(bottom+top)/2} ${trunkX},${top}" stroke="url(#trunk)" stroke-width="22" stroke-linecap="round" fill="none"/>`;
  S.eras.forEach(e => { const s = seg[e.id]; g += `<line x1="${trunkX-16}" x2="${trunkX+16}" y1="${s.y0}" y2="${s.y0}" stroke="var(--bg)" stroke-width="1.5" opacity=".5"/><text class="era-lbl" x="${trunkX+22}" y="${(s.y0+s.y1)/2}" dominant-baseline="middle"><tspan>${esc(e.label)}</tspan></text><text x="${trunkX+22}" y="${(s.y0+s.y1)/2+14}" style="font-family:var(--quote);font-style:italic;font-size:10px;fill:var(--faint)">${esc(e.desc)}</text>`; });
  g += `<path class="trace" id="trace" d=""/>`;
  const order = Object.values(nodes).sort((a,b)=>a.depth-b.depth);
  order.forEach(n => {
    const {v, start, end, c, score, lastTended, leaves} = n; const state = visionState(score); const lived = v.confidence==='lived';
    const wither = !lived && lastTended > 60 ? clamp((lastTended-60)/90, 0, .8) : 0;
    const limbW = 1.5 + score/11 * Math.pow(.85, n.depth) * (1-wither*.4);
    const limbCol = lerpColor(lerpColor('#6e6a64','#5a4634', clamp(score/40,0,1)), '#7a5a3c', clamp((score-40)/60,0,1));
    const leafBase = lerpColor('#9aa886','#5f7a4a', clamp(score/100,0,1)); const leafCol = lerpColor(leafBase, '#8a6a3a', wither);
    const opacity = state==='bare' ? .45 : 1;
    let leafCount = state==='bare' ? 0 : state==='budding' ? 3 : Math.min(4 + leaves.length + Math.round(score/8), 18);
    let inner = `<path class="limb" d="M${start[0].toFixed(1)},${start[1].toFixed(1)} Q${c[0].toFixed(1)},${c[1].toFixed(1)} ${end[0].toFixed(1)},${end[1].toFixed(1)}" stroke="${limbCol}" stroke-width="${limbW.toFixed(1)}" opacity="${opacity}"/>`;
    for(let i=0;i<leafCount;i++){
      const t = .3 + (i/Math.max(leafCount-1,1))*.68; const p = qpt(start,c,end,t); const tan = qtan(start,c,end,t) * 180/Math.PI; const sd = i%2?1:-1;
      const size = (state==='budding' ? 3 : 5 + score/22) * (1 - wither*.3) * (.8 + ((i*7)%5)/10);
      const rot = tan + sd*(38 + ((i*13)%20)) ; const curl = wither ? ` Q${(size*.6).toFixed(1)},${(size*.35*sd).toFixed(1)} ${(size*.8).toFixed(1)},${(size*.5).toFixed(1)}` : '';
      inner += `<g transform="translate(${p[0].toFixed(1)},${p[1].toFixed(1)}) rotate(${rot.toFixed(1)})"><g class="leaf" data-phase="${(i*1.7)%6.28}" data-period="${3+ (i*.37)%2}"><path d="M0,0 Q${size},${-size*.7} ${size*2},0 Q${size},${size*.7} 0,0${curl}" fill="${leafCol}" opacity="${.85 - wither*.3}"/></g></g>`;
    }
    if(state==='flowering' || state==='fruiting' || lived){ for(let i=0;i<(lived?5:4);i++){ const t = .55 + i*.11; const p = qpt(start,c,end,Math.min(t,1)); const sd = i%2?1:-1; if(state==='fruiting'||lived) inner += `<circle cx="${(p[0]+sd*8).toFixed(1)}" cy="${(p[1]-6).toFixed(1)}" r="${lived?6:4.5}" fill="${lived?'#d4a44c':'#c9a46a'}" stroke="#7a5a3c" stroke-width=".8" data-fruit="${v.id}"/>`; else inner += `<circle cx="${(p[0]+sd*7).toFixed(1)}" cy="${(p[1]-5).toFixed(1)}" r="2.6" fill="#c99aa4" opacity=".9"/>`; } }
    const lx = end[0] + (n.side>0 ? 8 : -8), anchor = n.side>0 ? 'start' : 'end';
    inner += `<text class="lbl" x="${lx.toFixed(1)}" y="${(end[1]-4).toFixed(1)}" text-anchor="${anchor}" ${lived?'style="fill:var(--gold)"':''}>${esc(v.name)}</text><text class="sc" x="${lx.toFixed(1)}" y="${(end[1]+9).toFixed(1)}" text-anchor="${anchor}">${lived?'lived':`${score} · ${v.confidence}`}${wither?' · withering':''}</text>`;
    g += `<g class="branch" data-vision="${v.id}" data-start="${start[0].toFixed(1)},${start[1].toFixed(1)}" data-trunk="${trunkX},${bottom}">${inner}</g>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax meet" style="filter:hue-rotate(${season}deg)">${g}</svg>`;
}
let swayRAF = null;
function startSway(root){ cancelAnimationFrame(swayRAF); if(reduced()) return; const leaves = $$('.leaf', root); const t0 = performance.now(); const tick = t => { if(!document.contains(root)){ cancelAnimationFrame(swayRAF); return; } const s = (t-t0)/1000; leaves.forEach(l => { const ph = +l.dataset.phase, per = +l.dataset.period; l.style.transform = `rotate(${(Math.sin(s*2*Math.PI/per + ph)*3).toFixed(2)}deg)`; }); swayRAF = requestAnimationFrame(tick); }; swayRAF = requestAnimationFrame(tick); }
routes.vision = function(root, params){
  const activeEra = S._activeEra || S.eras[0].id;
  registerPageEntry({pageName:'Vision Tree', addLabel:'Add to the tree', defaultEntryType:'progress', prefilledFields:{era:activeEra}, options:[
    {icon:'🌿', label:'New goal', desc:`A new branch, in the ${activeEra} era by default.`, run:(pre)=>EntryActions.newVision(pre)},
    {icon:'◌', label:'New life event', desc:'A leaf on an existing vision — progress, a visualization, a manifestation.', run:(pre)=>EntryActions.lifeEvent(pre)}]});
  root.innerHTML = `<div class="page">
    <div class="page-head row between"><div><h1>Vision Tree</h1><div class="sub">Every entry tagged to a vision grows a leaf. Vividness is the sap. Untended branches wither — honestly, reversibly.</div></div><div class="row"><select class="sel" style="width:auto" id="activeEra" title="active era for new goals">${S.eras.map(e=>`<option value="${e.id}" ${activeEra===e.id?'selected':''}>${esc(e.label)}</option>`).join('')}</select><button class="btn ghost" id="editEras">eras</button></div></div>
    <div class="tree-wrap" id="treeWrap"><div class="tree-tools"></div><div class="tree-legend"><span>bare twig 0–15</span><span>budding 16–30</span><span>leafing 31–50</span><span>canopy 51–70</span><span>flowering 71–85</span><span>fruiting 86–100</span><span>· hover a branch to trace its lineage</span></div></div>
    <div class="grid c3 section">${S.visions.map(v => { const {score, lastTended} = vividness(v); return `<div class="card rv" data-vopen="${v.id}" style="cursor:pointer"><div class="row between"><h3 style="margin:0">${esc(v.name)}</h3><span class="mono">${v.era}</span></div><div class="row" style="margin:8px 0"><div class="bar" style="flex:1;--c:${v.confidence==='lived'?'var(--gold)':'var(--sage)'}"><i style="width:${score}%"></i></div><span class="mono" data-tween="${score}">0</span></div><div class="muted" style="font-size:.8rem">${esc(v.confidence)} · tended ${relDays(lastTended)}${v.nextAction?`<br><span style="color:var(--gold)">→</span> ${esc(v.nextAction)}`:''}</div></div>`; }).join('')}</div>
  </div>`;
  drawTree();
  function drawTree(){ const wrap = $('#treeWrap'); const W = Math.max(wrap.clientWidth, 600), H = wrap.clientHeight; wrap.querySelector('svg')?.remove(); wrap.insertAdjacentHTML('afterbegin', treeSVG(W,H)); const svg = wrap.querySelector('svg');
    svg.querySelectorAll('.branch').forEach(b => { b.onclick = () => openVisionPanel(b.dataset.vision); b.onmouseenter = () => { const [sx,sy] = b.dataset.start.split(',').map(Number); const [tx,ty] = b.dataset.trunk.split(',').map(Number); const tr = $('#trace'); tr.setAttribute('d', `M${sx},${sy} L${tx},${sy} L${tx},${ty}`); tr.style.opacity = '.6'; sound('leaf'); }; b.onmouseleave = () => { $('#trace').style.opacity = '0'; }; });
    startSway(svg); }
  window.addEventListener('resize', debounce(()=>{ if(currentRoute==='vision') drawTree(); }, 250), {once:true});
  $$('[data-vopen]',root).forEach(c => c.onclick = () => openVisionPanel(c.dataset.vopen));
  $('#activeEra').onchange = e => { S._activeEra = e.target.value; rerender(); };
  $('#editEras').onclick = () => { const m = openModal(`<h2>Trunk segments</h2><p class="muted">Life decades or eras. Edit the labels and descriptions.</p><div class="stack">${S.eras.map((e,i)=>`<div class="card" style="padding:14px 16px"><b class="serif">${ed(`eras.${i}.label`)}</b><div class="muted">${ed(`eras.${i}.desc`,{ph:'what this decade is for'})}</div>${S.eras.length>1?`<button class="del-x" data-eradel="${e.id}" title="delete era">×</button>`:''}</div>`).join('')}</div><div class="row" style="margin-top:12px"><button class="btn sm ghost" id="addEra">+ era</button></div>`,'narrow');
    m.querySelector('#addEra').onclick = () => { S.eras.push({id:'era-'+uid(), label:'New era', desc:''}); saveNow(); m.remove(); rerender(); $('#editEras').click(); };
    m.querySelectorAll('[data-eradel]').forEach(b => b.onclick = () => { const era = byId(S.eras, b.dataset.eradel); m.remove(); requestDelete({label: `Era ${era.label}`, remove: () => { const back = spliceOut(S.eras, x => x.id === era.id); const moved = S.visions.filter(v => v.era === era.id); const to = S.eras[0]?.id; moved.forEach(v => v.era = to); return () => { back(); moved.forEach(v => v.era = era.id); }; }}); }); };
  if(params[0]) openVisionPanel(params[0]);
};
function deleteVision(v, node, after){
  requestDelete({label: v.name, node, after, remove: () => {
    const kids = S.visions.filter(x => x.parentId === v.id); kids.forEach(x => x.parentId = null);
    const touched = S.entries.filter(e => (e.links?.visions||[]).includes(v.id)); const rl = snapshotLinks(touched); touched.forEach(e => e.links.visions = e.links.visions.filter(x => x !== v.id));
    const habits = S.habits.filter(h => (h.links?.visions||[]).includes(v.id)); habits.forEach(h => h.links.visions = h.links.visions.filter(x => x !== v.id));
    const back = spliceOut(S.visions, x => x.id === v.id);
    return () => { back(); kids.forEach(x => x.parentId = v.id); rl(); habits.forEach(h => h.links.visions.push(v.id)); };
  }});
}
hooks.futureMemory = (vid, o, n) => { const v = byId(S.visions,vid); if(v && o.trim() && o!==n){ v.futureMemoryHistory.push({date:today(),text:o}); saveNow(); } };
hooks.currentReality = (vid, o, n) => { const v = byId(S.visions,vid); if(v && o.trim() && o!==n){ v.currentRealityHistory.push({date:today(),text:o}); saveNow(); } };
function openVisionPanel(id){
  const v = byId(S.visions,id); if(!v) return; const {score, parts, leaves, lastTended} = vividness(v); const lived = v.confidence==='lived';
  const kids = S.visions.filter(k=>k.parentId===v.id); const parent = byId(S.visions, v.parentId);
  const p = openPanel(`<div class="vision-panel">
    <div class="mono">vision · <select class="sel" id="vEra" style="width:auto;padding:1px 6px;font-size:.7rem;display:inline-block">${S.eras.map(e=>`<option value="${e.id}" ${v.era===e.id?'selected':''}>${esc(e.label)}</option>`).join('')}</select> · planted ${fmtDate(v.createdAt,'med')} · tended ${relDays(lastTended)}</div>
    <h2>${ed(`visions.#${v.id}.name`)}</h2>
    <div class="score"><div class="bar" style="flex:1;--c:${lived?'var(--gold)':'var(--sage)'}"><i style="width:${score}%"></i></div><span class="num" data-tween="${score}">0</span><span class="mono">vividness</span></div>
    <details><summary><span class="mono">how the score is made</span></summary><div class="body mono" style="line-height:1.9">${Object.entries(parts).map(([k,x])=>`${k} ${x.toFixed(1)}`).join(' · ')}<br>volume 20 · recency 20 (half-life 30d) · specificity 15 · sensory 15 · evidence 10 · resonance 10 · structural tension 10</div></details>
    <div class="vp-sec"><span class="sc">Confidence ladder</span><div class="ladder">${CONF.map(c=>`<button class="${v.confidence===c?'on':''}" data-conf="${c}">${c}</button>`).join('')}</div></div>
    <div class="next-action"><div class="k">The nearest next action</div>${ed(`visions.#${v.id}.nextAction`,{ph:'One concrete thing. Small enough to do this week.'})}</div>
    <div class="vp-sec"><span class="sc">Specificity</span><div class="spec-grid"><div><div class="k">target date</div>${ed(`visions.#${v.id}.targetDate`,{ph:'YYYY-MM-DD'})}</div><div><div class="k">location</div>${ed(`visions.#${v.id}.location`,{ph:'where?'})}</div><div><div class="k">money</div>${ed(`visions.#${v.id}.money`,{ph:'a figure'})}</div><div><div class="k">feeling when I contemplate it</div><div class="feeling">${[1,2,3,4,5].map(n=>`<button class="${v.feeling===n?'on':''}" data-feel="${n}" title="${['resistance','anxious','neutral','warm','alignment'][n-1]}">${n}</button>`).join('')}<span class="mono">${v.feeling?['resistance','anxious','neutral','warm','alignment'][v.feeling-1]:'resistance ← → alignment'}</span></div></div></div></div>
    <div class="vp-sec sensory"><span class="sc">Sensory field</span><p class="faint" style="font-size:.8rem;margin:0 0 6px">Details of the imagined environment are all-important. This is the vividness engine.</p>
      ${[['see','What do I see?'],['hear','What do I hear?'],['smell','What do I smell?'],['firstHour','What does the first hour of that day feel like?'],['who','Who is there?'],['noLonger','What am I no longer doing?']].map(([k,q])=>`<div class="q"><div class="k">${q}</div>${ed(`visions.#${v.id}.sensory.${k}`,{multi:true,ph:'…'})}</div>`).join('')}</div>
    <div class="vp-sec"><span class="sc">Future memory</span><p class="faint" style="font-size:.8rem;margin:0 0 6px">Write it in the past tense, as if remembering.</p>${ed(`visions.#${v.id}.futureMemory`,{multi:true,mdr:true,cls:'prose serif-lg',ph:'I remember the morning it happened…',hook:'futureMemory:'+v.id})}
      ${v.futureMemoryHistory.length?`<details><summary><span class="mono">${v.futureMemoryHistory.length} earlier versions</span></summary><div class="body versions">${[...v.futureMemoryHistory].reverse().map(h=>`<div class="v"><div class="mono">${fmtDate(h.date,'med')}</div>${md(h.text)}</div>`).join('')}</div></details>`:''}</div>
    <div class="vp-sec"><span class="sc">Current reality assessment (Fritz)</span><p class="faint" style="font-size:.8rem;margin:0 0 6px">Where am I right now in relation to this vision? Be factual. No interpretation — just the facts. The discrepancy between this and the vision is the engine.</p>${ed(`visions.#${v.id}.currentReality`,{multi:true,cls:'prose',ph:'The facts, as of today.',hook:'currentReality:'+v.id})}
      ${v.currentRealityHistory.length?`<details><summary><span class="mono">${v.currentRealityHistory.length} earlier assessments — watch reality move</span></summary><div class="body versions">${[...v.currentRealityHistory].reverse().map(h=>`<div class="v"><div class="mono">${fmtDate(h.date,'med')}</div>${esc(h.text)}</div>`).join('')}</div></details>`:''}
      <div class="mono" style="margin-top:6px">structural tension energy: ${structuralTension(v)}</div></div>
    <div class="vp-sec"><span class="sc">Costs &amp; trade-offs</span><p class="faint" style="font-size:.8rem;margin:0 0 6px">What does this vision ask me to give up?</p>${ed(`visions.#${v.id}.costs`,{multi:true,ph:'Be honest. Visions compete.'})}</div>
    <div class="vp-sec"><div class="row between"><span class="sc">Resistance inventory (Hicks)</span><button class="btn sm ghost" id="addRes">+ resistance</button></div><p class="faint" style="font-size:.8rem;margin:0 0 6px">Beliefs, fears, habits that make this feel like an impossible leap rather than the next logical step. Tag each to a Thread.</p>
      ${v.resistance.map((r,i)=>`<div class="evidence-item"><span style="flex:1">${ed(`visions.#${v.id}.resistance.${i}.text`,{multi:true,ph:'name the resistance'})}</span><select class="sel" style="width:auto;padding:2px 6px;font-size:.66rem;align-self:flex-start" data-resthread="${i}"><option value="">thread…</option>${S.threads.map(t=>`<option value="${t.id}" ${r.threadId===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select><button class="tbtn" data-resdel="${i}">×</button></div>`).join('')||'<div class="empty">Nothing named yet.</div>'}</div>
    <div class="vp-sec"><span class="sc">Preconditions &amp; dependencies</span>
      <div class="deps">${parent?`<span class="chip on click" style="--c:var(--sage)" data-vlink="${parent.id}">forks from · ${esc(parent.name)}</span>`:'<span class="chip">grows from the trunk</span>'}${kids.map(k=>`<span class="chip on click" style="--c:var(--sage)" data-vlink="${k.id}">→ ${esc(k.name)}</span>`).join('')}</div>
      <div class="k mono" style="margin:10px 0 4px">skills required</div><div class="deps">${S.skills.map(s=>`<span class="chip click ${v.preSkills.includes(s.id)?'on':''}" style="--c:var(--ment)" data-preskill="${s.id}">${esc(s.name)}</span>`).join('')}</div>
      <div class="k mono" style="margin:10px 0 4px">forks from</div><select class="sel" id="vParent" style="font-size:.8rem"><option value="">the trunk</option>${S.visions.filter(x=>x.id!==v.id).map(x=>`<option value="${x.id}" ${v.parentId===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>
    <div class="vp-sec"><span class="sc">Self-image required (Maltz)</span><p class="faint" style="font-size:.8rem;margin:0 0 6px">What kind of person would I need to be for this to feel natural?</p>${ed(`visions.#${v.id}.selfImage`,{multi:true,ph:'Someone who…'})}</div>
    <div class="vp-sec"><span class="sc">Linked values</span><div class="deps">${S.valueOrder.map(id=>{ const val = byId(S.values,id); return `<span class="chip click ${v.values.includes(id)?'on':''}" style="--c:${val.color}" data-vval="${id}">${esc(val.name)}</span>`; }).join('')}</div></div>
    <div class="vp-sec"><span class="sc">The 80-year-old check</span><p class="faint" style="font-size:.8rem;margin:0 0 6px">Why does this matter when I look back from the end?</p>${ed(`visions.#${v.id}.obituary`,{multi:true,ph:'If the answer is thin, the vision may be vanity.'})}</div>
    <div class="vp-sec"><div class="row between"><span class="sc">Manifestation evidence log</span><button class="btn sm ghost" id="addEv">+ evidence</button></div><p class="faint" style="font-size:.8rem;margin:0 0 6px">Coincidences, doors, people who appeared. Evidence of alignment arrives before full manifestation.</p>${v.evidence.map((e,i)=>`<div class="evidence-item"><span class="mono">${ed(`visions.#${v.id}.evidence.${i}.date`,{ph:'date',cls:'mono'})}</span><span style="flex:1">${ed(`visions.#${v.id}.evidence.${i}.text`,{multi:true})}</span><button class="tbtn" data-evdel="${i}">×</button></div>`).join('')||'<div class="empty">Nothing logged yet. Watch for it.</div>'}</div>
    <div class="vp-sec"><div class="row between"><span class="sc">Leaves — progress entries (${leaves.length})</span><button class="btn sm" id="addLeaf">+ water this vision</button></div>${sortEntries(leaves).map(e=>entryCard(e)).join('')||'<div class="empty">No leaves yet. Every tagged entry grows one.</div>'}</div>
    <div class="row" style="margin-top:30px"><button class="btn sm ghost" data-back>← back</button></div>
    ${moreSection(`<div class="danger-zone"><span>Visions are meant to be tended, not pruned casually. Its entries stay in the journals.</span><button class="btn sm ghost danger" id="delVision">Delete this vision</button></div>`)}
  </div>`,'vision-panel');
  $$('#panel .rv').forEach(n=>n.classList.add('in'));
  p.querySelectorAll('[data-conf]').forEach(b => b.onclick = () => { const was = v.confidence; v.confidence = b.dataset.conf; saveNow(); if(v.confidence==='lived' && was!=='lived') fruitCeremony(v); else { rerender(); openVisionPanel(v.id); } });
  p.querySelectorAll('[data-feel]').forEach(b => b.onclick = () => { v.feeling = +b.dataset.feel; saveNow(); rerender(); openVisionPanel(v.id); });
  p.querySelector('#addRes').onclick = () => { v.resistance.push({text:'',threadId:null}); saveNow(); openVisionPanel(v.id); };
  p.querySelectorAll('[data-resthread]').forEach(s => s.onchange = () => { v.resistance[+s.dataset.resthread].threadId = s.value||null; saveNow(); });
  p.querySelectorAll('[data-resdel]').forEach(b => b.onclick = () => { const r = v.resistance[+b.dataset.resdel]; requestDelete({label: r.text || 'Resistance', node: b.closest('.evidence-item'), remove: () => spliceOut(v.resistance, x => x === r), after: () => openVisionPanel(v.id)}); });
  p.querySelectorAll('[data-vlink]').forEach(c => c.onclick = () => openVisionPanel(c.dataset.vlink));
  p.querySelectorAll('[data-preskill]').forEach(c => c.onclick = () => { const id = c.dataset.preskill; v.preSkills = v.preSkills.includes(id) ? v.preSkills.filter(x=>x!==id) : [...v.preSkills,id]; saveNow(); c.classList.toggle('on'); });
  p.querySelector('#vParent').onchange = e => { v.parentId = e.target.value||null; saveNow(); rerender(); openVisionPanel(v.id); };
  p.querySelectorAll('[data-vval]').forEach(c => c.onclick = () => { const id = c.dataset.vval; v.values = v.values.includes(id) ? v.values.filter(x=>x!==id) : [...v.values,id]; saveNow(); c.classList.toggle('on'); });
  p.querySelector('#addEv').onclick = () => { v.evidence.push({date:today(),text:''}); saveNow(); openVisionPanel(v.id); setTimeout(()=>{ const last = $$('#panel .evidence-item .ed').slice(-1)[0]; last && beginEdit(last); },50); };
  p.querySelectorAll('[data-evdel]').forEach(b => b.onclick = () => { const ev = v.evidence[+b.dataset.evdel]; requestDelete({label: ev.text || 'Evidence', node: b.closest('.evidence-item'), remove: () => spliceOut(v.evidence, x => x === ev), after: () => openVisionPanel(v.id)}); });
  p.querySelector('#addLeaf').onclick = () => openEntryModal({type:'progress', links:{visions:[v.id]}, after:()=>{ rerender(); openVisionPanel(v.id); }});
  p.querySelector('#vEra').onchange = e => { v.era = e.target.value; saveNow(); rerender(); openVisionPanel(v.id); };
  p.querySelector('#delVision').onclick = () => deleteVision(v, null, () => { closePanel(); rerender(); });
}
function fruitCeremony(v){
  closePanel(); rerender();
  const wrap = $('#treeWrap'); const br = wrap?.querySelector(`[data-vision="${v.id}"] .lbl`); const rect = br?.getBoundingClientRect(); const cx = rect ? rect.left : innerWidth/2, cy = rect ? rect.top : innerHeight/2;
  if(!reduced()){ const c = el('<div class="fruit-ceremony"></div>'); for(let i=0;i<28;i++){ const a = Math.random()*Math.PI*2, d = 40+Math.random()*120; c.insertAdjacentHTML('beforeend', `<i style="left:${cx}px;top:${cy}px;--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d+60}px;animation-delay:${Math.random()*.2}s;background:${['#d4a44c','#7f916a','#b08968'][i%3]}"></i>`); } document.body.appendChild(c); setTimeout(()=>c.remove(),1800); }
  sound('chime');
  const s8 = S.stages.find(s=>s.num===8) || S.stages.slice(-1)[0];
  s8.substages = s8.substages.filter(ss => ss.name!=='not yet' || ss.desc);
  s8.substages.push({id:uid(), name:v.name, desc:`Lived. Planted from the Vision Tree on ${fmtDate(today(),'med')}.\n\n${v.futureMemory||''}`, photos:[], fromVision:v.id});
  S.entries.push({id:uid(),type:'reflection',title:`${v.name} — lived`,body:v.futureMemory||'A vision became a memory.',occurredAt:today(),createdAt:new Date().toISOString(),media:[],links:{stages:[s8.id],substages:[s8.substages.slice(-1)[0].id],threads:[],values:v.values.map(id=>({id,pol:'+'})),visions:[v.id],skills:[],projects:[]},people:[],places:[],emotions:[],confidence:'lived',extra:{}});
  saveNow();
  toast(`🍂 <b>${esc(v.name)}</b> has fruited. It has been planted into the Timeline as a new chapter of 未 Not Yet.`, 6000);
}
