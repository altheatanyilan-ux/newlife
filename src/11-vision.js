/* ============================================================
   4. VISION TREE — the greenhouse of the future
   ============================================================ */
const qpt = (p0,c,p1,t) => [ (1-t)*(1-t)*p0[0] + 2*(1-t)*t*c[0] + t*t*p1[0], (1-t)*(1-t)*p0[1] + 2*(1-t)*t*c[1] + t*t*p1[1] ];
const qtan = (p0,c,p1,t) => { const dx = 2*(1-t)*(c[0]-p0[0]) + 2*t*(p1[0]-c[0]), dy = 2*(1-t)*(c[1]-p0[1]) + 2*t*(p1[1]-c[1]); return Math.atan2(dy,dx); };
function lerpColor(a,b,t){ const pa = a.match(/\w\w/g).map(x=>parseInt(x,16)), pb = b.match(/\w\w/g).map(x=>parseInt(x,16)); return '#' + pa.map((x,i)=>Math.round(x+(pb[i]-x)*t).toString(16).padStart(2,'0')).join(''); }
function layoutTree(W, H){
  const eras = erasList(); const trunkX = W*.5, top = 70, bottom = H-30; const segH = (bottom-top)/Math.max(eras.length,1);
  const seg = {}; eras.forEach((e,i) => seg[e.id] = {y1: bottom - i*segH, y0: bottom - (i+1)*segH});
  const nodes = {}; const info = {}; S.visions.forEach(v => info[v.id] = vividness(v));
  const roots = S.visions.filter(v => !v.parentId || !byId(S.visions, v.parentId));
  const byEra = {}; roots.forEach(v => (byEra[v.era] = byEra[v.era]||[]).push(v));
  let gi = 0;
  Object.entries(byEra).forEach(([era, vs]) => { const sg = seg[era] || seg[eras[0]?.id] || {y1:bottom, y0:top}; vs.forEach((v,i) => { const t = (i+1)/(vs.length+1); const y = sg.y1 - t*(sg.y1-sg.y0); const side = gi++ % 2 ? 1 : -1; place(v, [trunkX, y], side, side>0 ? -Math.PI*.22 : -Math.PI*.78, 0); }); });
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
  const segH = (bottom-top)/Math.max(erasList().length,1);
  erasList().forEach(e => { const s = seg[e.id]; if(!s) return; const yrs = (e.startYear||e.endYear) ? ` ${e.startYear||''}–${e.endYear||''}` : ''; g += `<line x1="${trunkX-16}" x2="${trunkX+16}" y1="${s.y0}" y2="${s.y0}" stroke="${e.color}" stroke-width="2" opacity=".7"/><text class="era-lbl" x="${trunkX+22}" y="${(s.y0+s.y1)/2}" dominant-baseline="middle" style="fill:${e.color}"><tspan>${esc(e.name)}</tspan><tspan style="letter-spacing:0;font-size:9px;opacity:.7">${esc(yrs)}</tspan></text>${segH>34?`<text x="${trunkX+22}" y="${(s.y0+s.y1)/2+14}" style="font-family:var(--quote);font-style:italic;font-size:10px;fill:var(--faint)">${esc(e.subtitle||'')}</text>`:''}`; });
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
  const eras = erasList(); const activeEra = eras.some(e=>e.id===S._activeEra) ? S._activeEra : (eras[0]?.id || null);
  registerPageEntry({pageName:'Vision Tree', addLabel:'Add to the tree', defaultEntryType:'progress', prefilledFields:{era:activeEra}, options:[
    {icon:'🌿', label:'New goal', desc:`A new branch, in the ${esc(byId(eras,activeEra)?.name||'first')} era by default.`, run:(pre)=>EntryActions.newVision(pre)},
    {icon:'◆', label:'New life event', desc:'Something that happened — a memory for the current chapter, not a task.', run:(pre)=>openLifeEventModal(byId(erasList().filter(e=>e.type!=='future'),activeEra)?activeEra:(erasList().find(e=>e.type==='present')?.id))}]});
  root.innerHTML = `<div class="page">
    <div class="page-head row between"><div><h1>Vision Tree</h1><div class="sub">Every entry tagged to a vision grows a leaf. Vividness is the sap. Untended branches wither — honestly, reversibly.</div></div><div class="row"><select class="sel" style="width:auto" id="activeEra" title="active era for new goals">${eras.map(e=>`<option value="${e.id}" ${activeEra===e.id?'selected':''}>${esc(e.name)}</option>`).join('')}</select></div></div>
    ${lifelineHTML()}
    <div class="row between" style="margin:34px 0 8px"><span class="sc" style="margin:0">The tree</span><span class="mono">the same goals as branches — vividness is the sap</span></div>
    <div class="tree-wrap" id="treeWrap" style="height:${Math.max(560, 150*eras.length + 120)}px;max-height:${eras.length>5?'none':'calc(100vh - 150px)'}"><div class="tree-tools"></div><div class="tree-legend"><span>bare twig 0–15</span><span>budding 16–30</span><span>leafing 31–50</span><span>canopy 51–70</span><span>flowering 71–85</span><span>fruiting 86–100</span><span>· hover a branch to trace its lineage</span></div></div>
  </div>`;
  drawTree();
  function drawTree(){ const wrap = $('#treeWrap'); const W = Math.max(wrap.clientWidth, 600), H = wrap.clientHeight; wrap.querySelector('svg')?.remove(); wrap.insertAdjacentHTML('afterbegin', treeSVG(W,H)); const svg = wrap.querySelector('svg');
    svg.querySelectorAll('.branch').forEach(b => { b.onclick = () => openVisionPanel(b.dataset.vision); b.onmouseenter = () => { const [sx,sy] = b.dataset.start.split(',').map(Number); const [tx,ty] = b.dataset.trunk.split(',').map(Number); const tr = $('#trace'); tr.setAttribute('d', `M${sx},${sy} L${tx},${sy} L${tx},${ty}`); tr.style.opacity = '.6'; sound('leaf'); }; b.onmouseleave = () => { $('#trace').style.opacity = '0'; }; });
    startSway(svg); }
  window.addEventListener('resize', debounce(()=>{ if(currentRoute==='vision') drawTree(); }, 250), {once:true});
  $('#activeEra').onchange = e => { S._activeEra = e.target.value; rerender(); };
  bindLifeline(root, drawTree);
  if(!S.settings.chapterNamed) setTimeout(promptChapterName, 400);
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
    <div class="mono">vision · <select class="sel" id="vEra" style="width:auto;padding:1px 6px;font-size:.7rem;display:inline-block">${erasList().map(e=>`<option value="${e.id}" ${v.era===e.id?'selected':''}>${esc(e.name)}</option>`).join('')}</select> · planted ${fmtDate(v.createdAt,'med')} · tended ${relDays(lastTended)}</div>
    <h2>${ed(`visions.#${v.id}.name`)}</h2>
    <div class="score"><div class="bar" style="flex:1;--c:${lived?'var(--gold)':'var(--sage)'}"><i style="width:${score}%"></i></div><span class="num" data-tween="${score}">0</span><span class="mono">vividness</span></div>
    <details><summary><span class="mono">how the score is made</span></summary><div class="body mono" style="line-height:1.9">${Object.entries(parts).map(([k,x])=>`${k} ${x.toFixed(1)}`).join(' · ')}<br>volume 20 · recency 20 (half-life 30d) · specificity 15 · sensory 15 · evidence 10 · resonance 10 · structural tension 10</div></details>
    <div class="vp-sec"><span class="sc">Confidence ladder</span><div class="ladder">${CONF.map(c=>`<button class="${v.confidence===c?'on':''}" data-conf="${c}">${c}</button>`).join('')}</div></div>
    <div class="vp-sec lifeline-sec"><span class="sc">On the lifeline</span>
      <div class="row" style="gap:14px;flex-wrap:wrap;margin-bottom:8px"><label class="toggle ${v.status==='completed'?'on':''}" id="vDone"><span class="sw"></span><span>${v.status==='completed'?'completed':'pending'}</span></label>
        ${byId(erasList(),v.era)?.type==='present'?`<select class="sel" style="width:auto;font-size:.8rem" id="vPhase">${['in-progress','just-completed','documenting'].map(p=>`<option ${v.phase===p?'selected':''}>${p}</option>`).join('')}</select>`:''}
        <label class="toggle ${v.archived?'on':''}" id="vArchived"><span class="sw"></span><span>archived</span></label></div>
      <div class="spec-grid"><div><div class="k">started</div>${ed(`visions.#${v.id}.startedAt`,{ph:'YYYY-MM-DD',cls:'mono'})}</div><div><div class="k">completed</div>${ed(`visions.#${v.id}.completedAt`,{ph:'YYYY-MM-DD',cls:'mono'})}</div></div>
      <div style="margin-top:10px"><div class="k mono" style="font-size:.62rem;text-transform:uppercase;letter-spacing:.1em;color:var(--faint)">progress ${v.progress||0}%</div><input type="range" class="slider" min="0" max="100" value="${v.progress||0}" id="vProgress" style="--c:${byId(erasList(),v.era)?.color||'var(--sage)'}"></div>
      <div style="margin-top:10px"><div class="k mono" style="font-size:.62rem;text-transform:uppercase;letter-spacing:.1em;color:var(--faint)">success criteria — how will I know it is done?</div>${ed(`visions.#${v.id}.successCriteria`,{multi:true,ph:'Observable. Specific. Dated if possible.'})}</div>
      <div style="margin-top:10px"><div class="k mono" style="font-size:.62rem;text-transform:uppercase;letter-spacing:.1em;color:var(--faint)">reflection — what it was actually like</div>${ed(`visions.#${v.id}.reflection`,{multi:true,ph:'Written afterwards, or along the way.'})}</div>
    </div>
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
  p.querySelectorAll('[data-conf]').forEach(b => b.onclick = () => { const was = v.confidence; v.confidence = b.dataset.conf; if(v.confidence==='lived'){ v.status='completed'; v.completedAt = v.completedAt || today(); v.progress = 100; } else if(was==='lived'){ v.status='pending'; } saveNow(); if(v.confidence==='lived' && was!=='lived') fruitCeremony(v); else { rerender(); openVisionPanel(v.id); } });
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
  p.querySelector('#vDone').onclick = () => { setGoalStatus(v, v.status==='completed' ? 'pending' : 'completed'); rerender(); openVisionPanel(v.id); };
  p.querySelector('#vArchived').onclick = () => { v.archived = !v.archived; saveNow(); rerender(); openVisionPanel(v.id); };
  p.querySelector('#vPhase')?.addEventListener('change', e => { v.phase = e.target.value; if(v.phase==='just-completed' && v.status!=='completed') setGoalStatus(v,'completed'); saveNow(); rerender(); openVisionPanel(v.id); });
  const pr = p.querySelector('#vProgress'); pr.oninput = () => { pr.previousElementSibling.textContent = `progress ${pr.value}%`; }; pr.onchange = () => { v.progress = +pr.value; saveNow(); rerender(); };
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


/* ============================================================
   THE LIFELINE — past (lived) → present (live) → future (envisioned)
   ============================================================ */
const PHASES = ['in-progress','just-completed','documenting'];
function setGoalStatus(v, status){ v.status = status; if(status==='completed'){ v.completedAt = v.completedAt || today(); v.progress = 100; if(v.confidence!=='lived') v.confidence = 'lived'; } else { v.completedAt = ''; if(v.confidence==='lived') v.confidence = 'in motion'; if(v.progress===100) v.progress = 80; } saveNow(); }
function presentEra(){ return erasList().find(e=>e.type==='present') || null; }
function eraGoals(e){ return S.visions.filter(v=>v.era===e.id && !v.archived); }
function eraEvents(e){ return S.entries.filter(x=>x.type==='lifeevent' && x.extra?.eraId===e.id).sort((a,b)=>occurredSort(b)-occurredSort(a)); }
hooks.erayear = (id) => { const e = byId(S.visionEras,id); if(!e) return; ['startYear','endYear'].forEach(k => { const v = parseInt(String(e[k]).replace(/\D/g,''),10); e[k] = isNaN(v) ? null : v; }); saveNow(); };
function goalCardHTML(v, e){
  const done = v.status==='completed'; const skills = (v.preSkills||[]).map(id=>byId(S.skills,id)).filter(Boolean); const projects = S.projects.filter(p => S.entries.some(en => (en.links.visions||[]).includes(v.id) && (en.links.projects||[]).includes(p.id)));
  const chips = [...skills.map(s=>`<span class="chip" style="font-size:.62rem">🛠 ${esc(s.name)}</span>`), ...projects.map(p=>`<span class="chip" style="font-size:.62rem">🎨 ${esc(p.name)}</span>`)].join('');
  let meta = '';
  if(e.type==='past' || done) meta = `<div class="goal-meta"><span class="mono">✓ ${done?ed(`visions.#${v.id}.completedAt`,{ph:'date completed',cls:'mono'}):''}</span></div>${v.reflection?`<div class="goal-refl">${esc(v.reflection)}</div>`:`<div class="goal-refl faint">${ed(`visions.#${v.id}.reflection`,{ph:'what was it actually like?'})}</div>`}`;
  else if(e.type==='present') meta = `<div class="goal-meta"><select class="sel goal-phase" data-phase="${v.id}" style="width:auto;padding:1px 6px;font-size:.66rem">${PHASES.map(p=>`<option ${v.phase===p?'selected':''}>${p}</option>`).join('')}</select><span class="mono">${v.startedAt?'since '+fmtDate(v.startedAt,'med'):''}</span></div>`;
  else meta = `<div class="goal-meta"><span class="mono">${v.targetDate?'target '+fmtDate(v.targetDate,'med'):'no target date'}</span></div>${v.successCriteria?`<div class="goal-refl">↳ ${esc(v.successCriteria)}</div>`:''}`;
  const ring = (e.type==='present' && !done) ? `<span class="goal-ring" title="progress ${v.progress||0}%">${ringSVG((v.progress||0)/100,{size:28,stroke:4,color:e.color})}</span>` : '';
  return `<div class="goal-card ${done?'done':''} ${e.type}" data-goal="${v.id}" style="--c:${e.color}"><label class="goal-check" title="${done?'mark pending':'mark completed'}"><input type="checkbox" data-toggle="${v.id}" ${done?'checked':''}></label><div class="goal-body"><div class="goal-title">${esc(v.name)}${done?' <span class="goal-badge">✓</span>':''}</div>${meta}${chips?`<div class="row" style="gap:4px;margin-top:4px">${chips}</div>`:''}</div>${ring}</div>`;
}
function lifeEventHTML(x, e){ return `<div class="life-event" style="--c:${e.color}" data-entry="${x.id}"><span class="mono">${ed(`entries.#${x.id}.occurredAt`,{ph:'date',cls:'mono'})}</span><em>${ed(`entries.#${x.id}.body`,{multi:true,ph:'what happened?'})}</em><button class="del-x" data-del="${x.id}" title="delete">×</button></div>`; }
function eraColumnHTML(e){
  const goals = eraGoals(e); const pending = goals.filter(v=>v.status!=='completed'); const done = goals.filter(v=>v.status==='completed').sort((a,b)=>(b.completedAt||'')<(a.completedAt||'')?-1:1); const events = eraEvents(e); const stage = e.stageRef ? byId(S.stages, e.stageRef) : null;
  const badge = e.type==='past' ? `<span class="era-badge closed">era closed</span>` : e.type==='present' ? `<span class="era-badge live"><i></i>LIVE</span>` : `<span class="era-badge ahead">ahead</span>`;
  return `<section class="era-col ${e.type}" draggable="true" data-era="${e.id}" style="--c:${e.color}">
    <header class="era-head">
      <div class="era-top"><span class="era-handle" title="drag to reorder">⠿</span><button class="era-swatch" data-eracolor="${e.id}" title="colour" style="background:${e.color}"></button><span class="era-name" data-eraname="${e.id}" title="double-click to rename">${esc(e.name)}</span>${badge}<button class="era-del" data-eradel="${e.id}" title="delete era">🗑️</button></div>
      <div class="era-sub">${ed(`visionEras.#${e.id}.subtitle`,{ph:'what this chapter is for'})}</div>
      <div class="era-years mono">${ed(`visionEras.#${e.id}.startYear`,{ph:'from',cls:'mono',hook:'erayear:'+e.id})} – ${ed(`visionEras.#${e.id}.endYear`,{ph:e.type==='present'?'now':'to',cls:'mono',hook:'erayear:'+e.id})}${done.length?` · <span class="done-badge">${done.length} completed</span>`:''}</div>
      <div class="era-stage">${stage?`<a href="#/stage/${stage.id}" class="chip on click" style="--c:${stage.hue};font-size:.62rem"><span class="han-sm">${stage.char}</span> ${esc(stage.name)}</a>`:''}<select class="sel stage-link" data-stageref="${e.id}" title="link to a chapter of the chronicle"><option value="">${stage?'change chapter…':'link a chronicle chapter…'}</option>${S.stages.map(s=>`<option value="${s.id}" ${e.stageRef===s.id?'selected':''}>${s.char} ${esc(s.name)}</option>`).join('')}<option value="-">— unlink —</option></select></div>
    </header>
    <div class="era-goals">${pending.length ? pending.map(v=>goalCardHTML(v,e)).join('') : `<div class="faint" style="font-size:.78rem;padding:6px 2px">${e.type==='past'?'no open goals':'nothing planned yet'}</div>`}</div>
    ${e.type!=='future' ? `<div class="era-events"><div class="era-divider">What happened <span class="mono">· life events</span></div>${events.map(x=>lifeEventHTML(x,e)).join('')||'<div class="faint" style="font-size:.76rem;padding:4px 2px;font-style:italic">nothing recorded yet</div>'}<button class="btn sm ghost" data-addevent="${e.id}">+ life event</button></div>` : ''}
    ${done.length ? `<div class="era-lived"><div class="era-divider">What happened ✓ <span class="mono">· ${done.length} goal${done.length===1?'':'s'}</span></div>${done.map(v=>goalCardHTML(v,e)).join('')}</div>` : ''}
    <footer class="era-foot"><button class="btn sm" data-addgoal="${e.id}">+ goal</button>${e.type==='present'?`<button class="btn sm ghost" data-closechapter="${e.id}">Close this chapter →</button>`:''}</footer>
  </section>`;
}
function lifelineHTML(){
  const eras = erasList(); const now = new Date(); const label = `NOW — ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  let out = ''; eras.forEach(e => { out += eraColumnHTML(e); if(e.type==='present') out += `<div class="now-marker" title="${esc(label)}"><div class="now-line"></div><div class="now-dot"></div><div class="now-label">${esc(label)}</div></div>`; });
  if(!eras.some(e=>e.type==='present')) out += `<div class="now-marker"><div class="now-line"></div><div class="now-dot"></div><div class="now-label">${esc(label)}</div></div>`;
  return `<div class="lifeline-wrap"><div class="row between" style="margin-bottom:8px"><span class="sc" style="margin:0">The lifeline</span><span class="mono">past → present → future · double-click a chapter to rename · drag ⠿ to reorder</span></div><div class="lifeline" id="lifeline">${out}<button class="era-add" id="addEra">＋ Add era</button></div></div>`;
}
function renameEraInline(nameEl, era, redraw){
  if(nameEl.querySelector('input')) return;
  const inp = el(`<input class="era-rename" value="${esc(era.name)}" aria-label="era name">`); nameEl.textContent = ''; nameEl.appendChild(inp); inp.focus(); inp.select();
  const commit = () => { const v = inp.value.trim(); era.name = v || era.name; saveNow(); nameEl.textContent = era.name; redraw(); };
  inp.addEventListener('blur', commit); inp.addEventListener('keydown', ev => { ev.stopPropagation(); if(ev.key==='Enter'){ inp.blur(); } if(ev.key==='Escape'){ inp.value = era.name; inp.blur(); } });
}
function openLifeEventModal(eraId, existing=null){
  const eras = erasList().filter(e=>e.type!=='future'); const m = openModal(`<h2>${existing?'Edit life event':'A life event'}</h2><p class="muted" style="margin-top:-8px">Something that happened. Not a task — a memory for this chapter.</p><div class="stack">
    <div class="field"><label>Chapter</label><select class="sel" id="leEra">${eras.map(e=>`<option value="${e.id}" ${(existing?.extra?.eraId||eraId)===e.id?'selected':''}>${esc(e.name)}</option>`).join('')}</select></div>
    <div class="field"><label>Date</label><input class="inp" type="date" id="leDate" value="${existing?.occurredAt?.slice(0,10)||today()}"></div>
    <div class="field"><label>What happened</label><textarea class="ta serif-lg" id="leText" placeholder="One moment, in your own words.">${esc(existing?.body||'')}</textarea></div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="leSave">${existing?'Save':'Keep it'}</button></div></div>`,'narrow');
  m.querySelector('#leSave').onclick = e => { const text = m.querySelector('#leText').value.trim(); if(!text) return; const era = m.querySelector('#leEra').value, date = m.querySelector('#leDate').value || today();
    if(existing){ existing.body = text; existing.occurredAt = date; existing.extra.eraId = era; }
    else S.entries.push({id:uid(),type:'lifeevent',title:'',body:text,occurredAt:date,createdAt:new Date().toISOString(),media:[],links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[]},people:[],places:[],emotions:[],confidence:'',extra:{eraId:era}});
    saveNow(); ripple(e.clientX,e.clientY,byId(S.visionEras,era)?.color); sound('success'); m.remove(); toast('Life event kept.'); rerender(); };
  setTimeout(()=>m.querySelector('#leText').focus(),50);
}
function promptChapterName(){
  const cur = presentEra(); if(!cur || S.settings.chapterNamed) return;
  const m = openModal(`<h2>What would you name your current chapter?</h2><p class="muted">The chapter you are living right now. Not a decade, not a placeholder — a name that means something to you.</p><input class="inp serif-lg" id="chName" value="${esc(cur.name)}"><div class="row" style="justify-content:space-between;margin-top:16px"><button class="btn ghost" id="chKeep">Keep “${esc(cur.name)}”</button><button class="btn primary" id="chSave">Name it</button></div>`,'narrow');
  const fin = (rename) => { if(rename){ const v = m.querySelector('#chName').value.trim(); if(v) cur.name = v; } S.settings.chapterNamed = true; saveNow(); m.remove(); rerender(); };
  m.querySelector('#chSave').onclick = () => fin(true); m.querySelector('#chKeep').onclick = () => fin(false); m.querySelector('#chName').onkeydown = e => { if(e.key==='Enter') fin(true); }; setTimeout(()=>{ m.querySelector('#chName').focus(); m.querySelector('#chName').select(); },50);
}
function closeChapterWizard(cur){
  const eras = erasList(); const next = eras.find(e => e.type==='future' && e.order > cur.order) || eras.find(e => e.type==='future'); const open = eraGoals(cur).filter(v=>v.status!=='completed'); const y = new Date().getFullYear();
  const m = openModal(`<h2>Close “${esc(cur.name)}”</h2><p class="muted">This chapter becomes part of the past. Decide what happens to each open goal, then name the chapter that begins now.</p>
    <div class="stack" style="gap:8px">${open.length ? open.map(v=>`<div class="wiz-row" data-wiz="${v.id}"><b class="serif">${esc(v.name)}</b><div class="row" style="gap:4px">${[['forward','move forward'],['archive','archive'],['complete','mark complete']].map(([k,l],i)=>`<button class="btn sm ${i===0?'primary':''}" data-choice="${k}">${l}</button>`).join('')}</div></div>`).join('') : '<div class="faint">No open goals. Clean close.</div>'}</div>
    <div class="field" style="margin-top:18px"><label>Name your next chapter</label><input class="inp serif-lg" id="nextName" value="${esc(next?next.name:'')}" placeholder="What is this next chapter called?"></div>
    ${next?`<p class="faint" style="font-size:.78rem">“${esc(next.name)}” is the next era on the lifeline; it becomes the live chapter under this name.</p>`:'<p class="faint" style="font-size:.78rem">A new era will be created and placed after this one.</p>'}
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-x="no">Cancel</button><button class="btn primary" id="wizGo">Close chapter</button></div>`);
  const choice = {}; open.forEach(v => choice[v.id] = 'forward');
  m.querySelectorAll('.wiz-row').forEach(r => r.querySelectorAll('[data-choice]').forEach(b => b.onclick = () => { choice[r.dataset.wiz] = b.dataset.choice; r.querySelectorAll('[data-choice]').forEach(x=>x.classList.toggle('primary', x===b)); }));
  m.querySelector('[data-x=no]').onclick = () => m.remove();
  m.querySelector('#wizGo').onclick = () => {
    const name = m.querySelector('#nextName').value.trim(); if(!name){ toast('Give the next chapter a name.'); return; }
    let target = next; if(!target){ target = {id:'era-'+uid(), name, subtitle:'', startYear:y, endYear:null, color:ERA_PALETTE[S.visionEras.length % ERA_PALETTE.length], order:cur.order + .5, type:'present', stageRef:null}; S.visionEras.push(target); erasList().forEach((e,i)=>e.order=i); }
    else { target.name = name; target.type = 'present'; target.startYear = y; }
    cur.type = 'past'; cur.endYear = y;
    open.forEach(v => { const c = choice[v.id]; if(c==='forward') v.era = target.id; else if(c==='archive') v.archived = true; else setGoalStatus(v,'completed'); });
    S.settings.chapterNamed = true; S._activeEra = target.id; saveNow(); m.remove(); sound('chime'); toast(`“${esc(cur.name)}” is closed. “${esc(target.name)}” is live.`, 6000); rerender();
  };
}
function bindLifeline(root, drawTree){
  const line = root.querySelector('#lifeline'); if(!line) return;
  const redraw = () => { drawTree(); };
  root.querySelector('#addEra').onclick = () => { const eras = erasList(); const order = eras.length ? Math.max(...eras.map(e=>e.order))+1 : 0; const e = {id:'era-'+uid(), name:'New era', subtitle:'', startYear:null, endYear:null, color:ERA_PALETTE[S.visionEras.length % ERA_PALETTE.length], order, type: eras.some(x=>x.type==='present') ? 'future' : 'present', stageRef:null}; S.visionEras.push(e); saveNow(); rerender(); setTimeout(() => { const card = document.querySelector(`.era-col[data-era="${e.id}"]`); card?.scrollIntoView({inline:'end', behavior:'smooth'}); const nm = card?.querySelector('.era-name'); if(nm) renameEraInline(nm, e, () => rerender()); }, 60); };
  line.querySelectorAll('.era-name').forEach(nm => nm.addEventListener('dblclick', () => renameEraInline(nm, byId(S.visionEras, nm.dataset.eraname), redraw)));
  line.querySelectorAll('[data-eracolor]').forEach(b => b.onclick = () => { const e = byId(S.visionEras, b.dataset.eracolor); document.querySelector('.era-palette')?.remove(); const pal = el(`<div class="era-palette">${ERA_PALETTE.map(c=>`<button data-c="${c}" style="background:${c}" class="${e.color===c?'on':''}" title="${c}"></button>`).join('')}</div>`); b.parentElement.appendChild(pal); pal.querySelectorAll('button').forEach(x => x.onclick = ev => { ev.stopPropagation(); e.color = x.dataset.c; saveNow(); pal.remove(); rerender(); }); setTimeout(() => document.addEventListener('click', () => pal.remove(), {once:true}), 0); });
  line.querySelectorAll('[data-stageref]').forEach(sel => sel.onchange = () => { const e = byId(S.visionEras, sel.dataset.stageref); e.stageRef = sel.value === '-' ? null : (sel.value || e.stageRef); saveNow(); rerender(); });
  line.querySelectorAll('[data-eradel]').forEach(b => b.onclick = () => { const e = byId(S.visionEras, b.dataset.eradel); const goals = S.visions.filter(v=>v.era===e.id); const m = openModal(`<h2>Delete this era and all its contents?</h2><p class="muted">This cannot be undone.<br><span class="mono">${esc(e.name)} · ${goals.length} goal${goals.length===1?'':'s'}, their life events and leaves</span></p><div class="row" style="justify-content:flex-end;margin-top:18px"><button class="btn" data-x="no">Cancel</button><button class="btn destructive" data-x="yes">Delete</button></div>`,'narrow'); m.querySelector('[data-x=no]').onclick = () => m.remove(); m.querySelector('[data-x=yes]').onclick = () => { m.remove(); requestDelete({label:`Era ${e.name}`, skipConfirm:true, node: b.closest('.era-col'), remove: () => {
    const ids = new Set(goals.map(v=>v.id)); const removedGoals = goals.map(v => [S.visions.indexOf(v), v]); goals.forEach(v => S.visions.splice(S.visions.indexOf(v),1)); S.visions.forEach(v => { if(ids.has(v.parentId)) v.parentId = null; });
    const events = S.entries.filter(en => (en.links?.visions||[]).some(id => ids.has(id)) || (en.type==='lifeevent' && en.extra?.eraId===e.id)); const removedEvents = events.map(en => [S.entries.indexOf(en), en]); events.forEach(en => S.entries.splice(S.entries.indexOf(en),1));
    const habits = S.habits.filter(h => (h.links?.visions||[]).some(id => ids.has(id))); const hl = habits.map(h => [h, [...h.links.visions]]); habits.forEach(h => h.links.visions = h.links.visions.filter(id => !ids.has(id)));
    const back = spliceOut(S.visionEras, x => x.id === e.id); if(S._activeEra === e.id) S._activeEra = null;
    return () => { back(); removedGoals.forEach(([i,v]) => S.visions.splice(Math.min(i,S.visions.length),0,v)); removedEvents.forEach(([i,en]) => S.entries.splice(Math.min(i,S.entries.length),0,en)); hl.forEach(([h,l]) => h.links.visions = l); };
  }}); }; });
  // goals
  line.querySelectorAll('[data-toggle]').forEach(c => c.addEventListener('change', () => { const v = byId(S.visions, c.dataset.toggle); setGoalStatus(v, c.checked ? 'completed' : 'pending'); sound(c.checked?'success':'click'); rerender(); }));
  line.querySelectorAll('[data-phase]').forEach(sel => { sel.onclick = e => e.stopPropagation(); sel.onchange = () => { const v = byId(S.visions, sel.dataset.phase); v.phase = sel.value; if(v.phase==='just-completed' && v.status!=='completed') setGoalStatus(v,'completed'); saveNow(); rerender(); }; });
  line.querySelectorAll('.goal-card').forEach(card => card.addEventListener('click', e => { if(e.target.closest('input,select,label,.ed,button,a')) return; openVisionPanel(card.dataset.goal); }));
  line.querySelectorAll('[data-addgoal]').forEach(b => b.onclick = () => newVisionDialog({era:b.dataset.addgoal}));
  line.querySelectorAll('[data-addevent]').forEach(b => b.onclick = () => openLifeEventModal(b.dataset.addevent));
  line.querySelectorAll('[data-closechapter]').forEach(b => b.onclick = () => closeChapterWizard(byId(S.visionEras, b.dataset.closechapter)));
  // drag to reorder columns
  let dragId = null;
  line.querySelectorAll('.era-col').forEach(col => {
    col.addEventListener('dragstart', ev => { if(ev.target.closest('.goal-card,.life-event,.ed')){ ev.preventDefault(); return; } dragId = col.dataset.era; col.classList.add('dragging'); ev.dataTransfer.effectAllowed = 'move'; try { ev.dataTransfer.setData('text/plain', dragId); } catch(e){} });
    col.addEventListener('dragend', () => { col.classList.remove('dragging'); line.querySelectorAll('.era-col').forEach(c => c.classList.remove('over')); });
    col.addEventListener('dragover', ev => { ev.preventDefault(); ev.dataTransfer.dropEffect = 'move'; col.classList.add('over'); });
    col.addEventListener('dragleave', () => col.classList.remove('over'));
    col.addEventListener('drop', ev => { ev.preventDefault(); col.classList.remove('over'); const from = dragId || ev.dataTransfer.getData('text/plain'); const to = col.dataset.era; if(!from || from === to) return; const list = erasList().map(e=>e.id); list.splice(list.indexOf(from),1); list.splice(list.indexOf(to),0,from); list.forEach((id,i) => byId(S.visionEras,id).order = i); const p = presentEra(); if(p) erasList().forEach(e => { if(e.type!=='present') e.type = e.order < p.order ? 'past' : 'future'; }); dragId = null; saveNow(); rerender(); });
  });
}
