/* ============================================================
   7. SKILL TREE — the architecture of becoming
   ============================================================ */
const SKILL_CATS = ['Languages','Technical','Creative','Physical','Social','Craft'];
const catColor = c => ({Languages:'#6b7f8e',Technical:'#8a8d8f',Creative:'#b08968',Physical:'#c47832',Social:'#a0727e',Craft:'#7f916a'}[c]||'#a89f94');
/* ---------- hierarchy: virtual root → categories → skills (parent = first prerequisite) ---------- */
function skillIsLocked(s){ return s.prereqs.some(p => { const ps = byId(S.skills,p); return ps && ps.currentLevel < 2; }) && s.currentLevel === 0; }
function skillHierarchy(){
  const collapsed = S.settings.skillCollapsed || {};
  const cats = [...new Set([...SKILL_CATS, ...S.skills.map(s=>s.cat)])].filter(c => S.skills.some(s=>s.cat===c));
  const parentOf = s => { const p = s.prereqs.find(id => byId(S.skills,id)); return p || null; };
  const mk = (s, depth) => { const kids = S.skills.filter(x => parentOf(x) === s.id); const n = {id:s.id, label:s.name, kind:'skill', skill:s, color:catColor(s.cat), depth, collapsed:!!collapsed[s.id], kidCount:kids.length, children:[]}; if(!n.collapsed) n.children = kids.map(k => mk(k, depth+1)); return n; };
  const root = {id:'root', label:'Skills', kind:'root', color:'var(--terra)', depth:0, collapsed:false, kidCount:cats.length, children: cats.map(c => { const roots = S.skills.filter(s => s.cat===c && !parentOf(s)); const n = {id:'cat:'+c, label:c, kind:'cat', color:catColor(c), depth:1, collapsed:!!collapsed['cat:'+c], kidCount:roots.length, children:[]}; if(!n.collapsed) n.children = roots.map(s => mk(s, 2)); return n; }) };
  return root;
}
function nodeSize(n, mode){ const b = n.kind==='root' ? [190,50] : n.kind==='cat' ? [170,44] : n.depth<=2 ? [164,42] : n.depth===3 ? [150,38] : [136,34]; return mode==='radial' && n.kind==='skill' ? [Math.round(b[0]*.8), b[1]] : b; }
/* tidy layout: leaves take slots, parents centre over children */
function tidyLayout(root, mode){
  const gapX = 22, levelGap = 96; let cursor = 0; const nodes = [], links = [];
  const walk = (n, parent) => { const [w,h] = nodeSize(n, mode); n.w = w; n.h = h; if(!n.children.length){ n.x = cursor + w/2; cursor += w + gapX; } else { n.children.forEach(c => walk(c, n)); n.x = (n.children[0].x + n.children[n.children.length-1].x)/2; } n.y = n.depth * levelGap; nodes.push(n); if(parent) links.push([parent, n]); };
  walk(root, null);
  const total = cursor - gapX;
  if(mode === 'radial'){ const R = 215; nodes.forEach(n => { const a = (n.x / Math.max(total,1)) * 2*Math.PI - Math.PI/2; const r = n.depth * R; n.a = a; n.r = r; n.x = Math.cos(a)*r; n.y = Math.sin(a)*r; }); }
  else nodes.forEach(n => { n.x -= total/2; });
  return {nodes, links, total};
}
function linkPath(p, c, mode){
  if(mode === 'radial'){ const rm = (p.r + c.r)/2; const c1 = [Math.cos(p.a)*rm, Math.sin(p.a)*rm], c2 = [Math.cos(c.a)*rm, Math.sin(c.a)*rm]; return `M${p.x.toFixed(1)},${p.y.toFixed(1)} C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${c.x.toFixed(1)},${c.y.toFixed(1)}`; }
  const y1 = p.y + p.h/2, y2 = c.y - c.h/2, my = (y1+y2)/2; return `M${p.x.toFixed(1)},${y1.toFixed(1)} C${p.x.toFixed(1)},${my.toFixed(1)} ${c.x.toFixed(1)},${my.toFixed(1)} ${c.x.toFixed(1)},${y2.toFixed(1)}`;
}
function skillNodeSVG(n, mode, selected, revealFrom){
  const s = n.skill; const w = n.w, h = n.h; const locked = s ? skillIsLocked(s) : false; const since = s ? daysSince(skillLastPracticed(s)) : Infinity; const active = s && !locked && !s.planned && since <= 7; const atro = s && !s.planned && since > 90;
  const nm = s ? nextMilestone(s) : null; const sub = s ? (s.planned ? 'planned' : locked ? 'locked' : `lvl ${s.currentLevel}/${skillLevelCount(s)}${skillTargetLevel(s)?' → '+skillTargetLevel(s):''}${atro?' · atrophy':''}${nm?.by?` · 📅 ${fmtMonth(nm.by)}`:''}`) : (n.kind==='cat' ? `${n.kidCount} skill${n.kidCount===1?'':'s'}` : `${S.skills.length} skills`);
  const glow = (selected || active) && !locked;
  return `<g class="sk-node ${n.kind} ${locked?'locked':''} ${glow?'glow':''} ${selected?'selected':''} ${revealFrom===n.id?'':''}" data-node="${n.id}" ${s?`data-skill="${s.id}"`:''} transform="translate(${n.x.toFixed(1)},${n.y.toFixed(1)})" style="--nc:${n.color}">
    <rect class="sk-body" x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="9" ${s?.planned?'stroke-dasharray="5 4"':''}/>
    <rect class="sk-bar" x="${-w/2}" y="${-h/2}" width="4" height="${h}" rx="2"/>
    <text class="sk-title" x="${-w/2+12}" y="${h<38?3:-3}" style="font-size:${n.kind==='root'?14:n.kind==='cat'?12.5:n.depth<=2?12:11}px">${locked?'🔒 ':''}${esc(n.label)}</text>
    ${h>=38?`<text class="sk-sub" x="${-w/2+12}" y="${h/2-8}">${esc(sub)}</text>`:''}
    ${n.kidCount?`<g class="sk-toggle" data-toggle="${n.id}"><circle cx="${w/2-12}" cy="0" r="8"/><text x="${w/2-12}" y="3.5" text-anchor="middle">${n.collapsed?'+':'−'}</text></g>`:''}
  </g>`;
}
routes.skills = function(root, params){
  registerPageEntry({pageName:'Skill Tree', addLabel:'Add to the skill tree', defaultEntryType:'progress', prefilledFields:{}, options:[
    {icon:'◉', label:'New skill node', desc:'A skill you hold, or a bud you intend to open.', run:()=>EntryActions.newSkill()},
    {icon:'↗', label:'Add a level to a skill', desc:'Log practice on an existing skill; set the level from its rubric.', run:()=>EntryActions.skillProgress()}]});
  const mode = S.settings.skillLayout || 'vertical';
  root.innerHTML = `<div class="page">
    <div class="page-head row between"><div><h1>Skill Tree</h1><div class="sub">Career capital, built on the plateau. Categories branch into skills; a skill's first prerequisite is its parent. Drag a node onto another to re-parent it.</div></div>
      <div class="row"><button class="btn sm ${mode==='vertical'?'primary':''}" data-layout="vertical">⊤ vertical</button><button class="btn sm ${mode==='radial'?'primary':''}" data-layout="radial">◎ radial</button><button class="btn sm ghost" id="skExpandAll">expand all</button><button class="btn sm ghost" id="skCollapseAll">collapse all</button><button class="btn sm ghost" id="skReset" title="reset zoom, centre root">⟳</button></div></div>
    <div class="skill-wrap" id="skillWrap"><div class="minimap" id="minimap"></div><div class="sk-hint mono">scroll to zoom · drag the canvas to pan · ± to fold a branch</div></div>
    <div class="grid c3 section">${S.skills.map(s=>{ const st = skillStreak(s); const last = skillLastPracticed(s); return `<div class="card rv" data-sopen="${s.id}" style="cursor:pointer;border-left:3px solid ${catColor(s.cat)}"><div class="row between"><h3 style="margin:0">${esc(s.name)}</h3><span class="mono">${esc(s.cat)}</span></div><div class="muted" style="font-size:.82rem;margin-top:6px">${s.planned?'planned — a bud not yet opened':`${esc(skillLevelLabel(s,s.currentLevel))} · level ${s.currentLevel} of ${skillLevelCount(s)}`}${nextMilestone(s)?.by?` · <span class="mono" style="color:${daysBetween(today(),nextMilestone(s).by)<0?'#d08080':'var(--muted)'}">📅 L${nextMilestone(s).levelTarget} by ${fmtMonth(nextMilestone(s).by)}</span>`:''}</div><div class="mono" style="margin-top:8px">last ${relDays(daysSince(last))} · streak ${st.cur}d (best ${st.best}) · ${skillHours(s).toFixed(1)}h</div>${S.projects.some(p=>(p.linkedSkills||[]).includes(s.id))?`<div class="row" style="margin-top:6px;gap:4px">${S.projects.filter(p=>(p.linkedSkills||[]).includes(s.id)).map(p=>`<span class="chip on" style="--c:var(--terra);font-size:.62rem">🎨 ${esc(p.name)}</span>`).join('')}</div>`:''}</div>`; }).join('')}</div>
  </div>`;
  drawSkillTree(root);
  $$('[data-layout]',root).forEach(b => b.onclick = () => { S.settings.skillLayout = b.dataset.layout; saveNow(); rerender(); });
  $('#skExpandAll').onclick = () => { S.settings.skillCollapsed = {}; saveNow(); rerender(); };
  $('#skCollapseAll').onclick = () => { const c = {}; S.skills.forEach(s => { if(S.skills.some(x => x.prereqs[0]===s.id)) c[s.id] = true; }); [...new Set(S.skills.map(s=>s.cat))].forEach(cat => c['cat:'+cat] = true); S.settings.skillCollapsed = c; saveNow(); rerender(); };
  $('#skReset').onclick = () => { root._skView?.reset(); };
  $$('[data-sopen]',root).forEach(c => c.onclick = () => openSkillPanel(c.dataset.sopen));
  if(params[0]) openSkillPanel(params[0]);
};
let skillSelected = null, skillRevealFrom = null;
function drawSkillTree(root){
  const wrap = $('#skillWrap'); if(!wrap) return; wrap.querySelector('svg')?.remove();
  const mode = S.settings.skillLayout || 'vertical'; const tree = skillHierarchy(); const {nodes, links} = tidyLayout(tree, mode);
  const W = Math.max(wrap.clientWidth, 600), H = wrap.clientHeight || 620;
  const xs = nodes.map(n=>n.x), ys = nodes.map(n=>n.y); const bb = {x0:Math.min(...xs)-110, x1:Math.max(...xs)+110, y0:Math.min(...ys)-40, y1:Math.max(...ys)+40};
  const view = {k:1, tx:0, ty:0};
  const fit = () => { const bw = bb.x1-bb.x0, bh = bb.y1-bb.y0; const rootN = nodes.find(n=>n.kind==='root'); if(mode==='radial'){ view.k = clamp(Math.min((W-40)/bw, (H-40)/bh), .45, 1); view.tx = W/2 - (bb.x0+bb.x1)/2*view.k; view.ty = H/2 - (bb.y0+bb.y1)/2*view.k; } else { view.k = clamp(Math.min((W-40)/bw, (H-60)/bh), .7, 1); view.tx = W/2 - rootN.x*view.k; view.ty = 36 - bb.y0*view.k; } };
  fit();
  const svg = el(`<svg class="sk-svg" viewBox="0 0 ${W} ${H}"><defs><filter id="skglow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect class="sk-bg" width="${W}" height="${H}" fill="transparent"/><g id="skView"><g class="sk-links">${links.map(([p,c]) => `<path class="sk-link" data-from="${p.id}" data-to="${c.id}" d="${linkPath(p,c,mode)}"/>`).join('')}</g><g class="sk-nodes">${nodes.map(n => skillNodeSVG(n, mode, n.id===skillSelected, skillRevealFrom)).join('')}</g></g></svg>`);
  wrap.insertBefore(svg, wrap.firstChild);
  const vp = svg.querySelector('#skView'); const apply = () => { vp.setAttribute('transform', `translate(${view.tx.toFixed(1)},${view.ty.toFixed(1)}) scale(${view.k.toFixed(3)})`); drawMinimap(); }; apply();
  // reveal animation for a just-expanded branch
  if(skillRevealFrom && !reduced()){ const parent = nodes.find(n=>n.id===skillRevealFrom); if(parent){ const ids = new Set(); const collect = n => n.children.forEach(c => { ids.add(c.id); collect(c); }); collect(parent); svg.querySelectorAll('.sk-node').forEach(g => { if(ids.has(g.dataset.node)){ g.classList.add('reveal'); g.style.setProperty('--oy', mode==='radial' ? '0px' : `${(parent.y - +g.getAttribute('transform').match(/,([-\d.]+)\)/)[1]).toFixed(1)}px`); } }); svg.querySelectorAll('.sk-link').forEach(l => { if(ids.has(l.dataset.to)) l.classList.add('reveal'); }); } skillRevealFrom = null; }
  // zoom (wheel) & pan (drag on background)
  svg.addEventListener('wheel', e => { e.preventDefault(); const r = svg.getBoundingClientRect(); const mx = (e.clientX-r.left)*(W/r.width), my = (e.clientY-r.top)*(H/r.height); const f = Math.exp(-e.deltaY*.0015); const k = clamp(view.k*f, .2, 3); view.tx = mx - (mx-view.tx)*(k/view.k); view.ty = my - (my-view.ty)*(k/view.k); view.k = k; apply(); }, {passive:false});
  let pan = null, dragNode = null, ghost = null;
  const toSvg = e => { const r = svg.getBoundingClientRect(); return [(e.clientX-r.left)*(W/r.width), (e.clientY-r.top)*(H/r.height)]; };
  const capture = e => { try { svg.setPointerCapture(e.pointerId); } catch(err){} };
  svg.addEventListener('pointerdown', e => { const g = e.target.closest('.sk-node'); if(g && g.classList.contains('locked')) return; if(g && g.dataset.skill && !e.target.closest('.sk-toggle')){ dragNode = {id:g.dataset.skill, start:toSvg(e), moved:false, el:g}; capture(e); } else if(!g){ pan = {start:toSvg(e), tx:view.tx, ty:view.ty}; capture(e); svg.classList.add('panning'); } });
  svg.addEventListener('pointermove', e => { const p = toSvg(e); if(pan){ view.tx = pan.tx + (p[0]-pan.start[0]); view.ty = pan.ty + (p[1]-pan.start[1]); apply(); } else if(dragNode){ const d = Math.hypot(p[0]-dragNode.start[0], p[1]-dragNode.start[1]); if(d > 8 && !dragNode.moved){ dragNode.moved = true; ghost = el(`<div class="sk-ghost">${esc(byId(S.skills,dragNode.id).name)}</div>`); wrap.appendChild(ghost); dragNode.el.classList.add('dragging'); } if(ghost){ const r = svg.getBoundingClientRect(); ghost.style.left = (e.clientX - r.left + 12)+'px'; ghost.style.top = (e.clientY - r.top + 12)+'px'; svg.querySelectorAll('.sk-node.droptarget').forEach(x=>x.classList.remove('droptarget')); const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('.sk-node'); if(over && over.dataset.node !== dragNode.id && !over.classList.contains('root')) over.classList.add('droptarget'); } } });
  const endDrag = e => { if(pan){ pan = null; svg.classList.remove('panning'); } if(dragNode){ const dn = dragNode; dragNode = null; dn.el.classList.remove('dragging'); ghost?.remove(); ghost = null; const over = dn.moved ? document.elementFromPoint(e.clientX, e.clientY)?.closest('.sk-node') : null; svg.querySelectorAll('.sk-node.droptarget').forEach(x=>x.classList.remove('droptarget'));
    if(!dn.moved){ skillSelected = dn.id; openSkillPanel(dn.id); drawSkillTree(root); return; }
    if(over && over.dataset.node !== dn.id) reparentSkill(dn.id, over.dataset.node); } };
  svg.addEventListener('pointerup', endDrag); svg.addEventListener('pointercancel', endDrag);
  svg.querySelectorAll('.sk-toggle').forEach(t => t.addEventListener('click', e => { e.stopPropagation(); const id = t.dataset.toggle; const c = S.settings.skillCollapsed = S.settings.skillCollapsed || {}; if(c[id]) { delete c[id]; skillRevealFrom = id; } else c[id] = true; saveNow(); drawSkillTree(root); }));
  svg.querySelectorAll('.sk-node').forEach(g => { g.addEventListener('mouseenter', () => { svg.querySelectorAll(`.sk-link[data-from="${g.dataset.node}"]`).forEach(l => l.classList.add('hot')); }); g.addEventListener('mouseleave', () => svg.querySelectorAll('.sk-link.hot').forEach(l => l.classList.remove('hot'))); g.addEventListener('click', e => { if(g.classList.contains('locked') || e.target.closest('.sk-toggle')) return; }); });
  svg.querySelectorAll('.sk-node.cat').forEach(g => g.addEventListener('click', e => { if(e.target.closest('.sk-toggle')) return; const id = g.dataset.node; const c = S.settings.skillCollapsed = S.settings.skillCollapsed || {}; if(c[id]){ delete c[id]; skillRevealFrom = id; } else c[id] = true; saveNow(); drawSkillTree(root); }));
  // minimap
  function drawMinimap(){ const mm = $('#minimap'); if(!mm) return; const mw = 150, mh = 100; const bw = bb.x1-bb.x0, bh = bb.y1-bb.y0; const sc = Math.min(mw/bw, mh/bh); const ox = (mw - bw*sc)/2, oy = (mh - bh*sc)/2; const vx0 = (0 - view.tx)/view.k, vy0 = (0 - view.ty)/view.k, vx1 = (W - view.tx)/view.k, vy1 = (H - view.ty)/view.k;
    mm.innerHTML = `<svg viewBox="0 0 ${mw} ${mh}">${nodes.map(n => `<rect x="${(ox+(n.x-n.w/2-bb.x0)*sc).toFixed(1)}" y="${(oy+(n.y-n.h/2-bb.y0)*sc).toFixed(1)}" width="${Math.max(2,n.w*sc).toFixed(1)}" height="${Math.max(1.5,n.h*sc).toFixed(1)}" rx="1" fill="${n.color}" opacity=".8"/>`).join('')}<rect class="mm-view" x="${(ox+(vx0-bb.x0)*sc).toFixed(1)}" y="${(oy+(vy0-bb.y0)*sc).toFixed(1)}" width="${((vx1-vx0)*sc).toFixed(1)}" height="${((vy1-vy0)*sc).toFixed(1)}"/></svg>`;
    mm.onclick = e => { const r = mm.getBoundingClientRect(); const px = (e.clientX-r.left)/r.width*mw, py = (e.clientY-r.top)/r.height*mh; const wx = (px-ox)/sc + bb.x0, wy = (py-oy)/sc + bb.y0; view.tx = W/2 - wx*view.k; view.ty = H/2 - wy*view.k; apply(); }; }
  root._skView = { reset: () => { fit(); apply(); }, burst: (id) => { const g = svg.querySelector(`.sk-node[data-skill="${id}"]`); if(!g) return; const m = g.getAttribute('transform').match(/translate\(([-\d.]+),([-\d.]+)\)/); const pt = svg.createSVGPoint(); pt.x = +m[1]*view.k + view.tx; pt.y = +m[2]*view.k + view.ty; const sp = pt.matrixTransform(svg.getScreenCTM()); levelUpBurst(sp.x, sp.y, byId(S.skills,id) ? catColor(byId(S.skills,id).cat) : 'var(--gold)'); } };
  drawMinimap();
}
function reparentSkill(id, targetNodeId){
  const s = byId(S.skills, id); if(!s) return;
  if(targetNodeId.startsWith('cat:')){ const cat = targetNodeId.slice(4); s.prereqs = s.prereqs.filter(p => !byId(S.skills,p)); s.cat = cat; }
  else { const t = byId(S.skills, targetNodeId); if(!t || t.id === id) return; // refuse cycles
    const desc = new Set(); const walk = x => S.skills.filter(y => y.prereqs[0]===x).forEach(y => { desc.add(y.id); walk(y.id); }); walk(id); if(desc.has(t.id)){ toast('That would make a loop — a skill cannot depend on its own descendant.'); return; }
    s.prereqs = [t.id, ...s.prereqs.filter(p => p !== t.id)]; s.cat = t.cat; }
  saveNow(); toast(`${esc(s.name)} now grows from ${esc(targetNodeId.startsWith('cat:') ? targetNodeId.slice(4) : byId(S.skills,targetNodeId).name)}.`); rerender();
}
function levelUpBurst(x, y, color){
  if(reduced()) return; const c = el('<div class="fruit-ceremony"></div>'); for(let i=0;i<26;i++){ const a = Math.random()*Math.PI*2, d = 30+Math.random()*90; c.insertAdjacentHTML('beforeend', `<i style="left:${x}px;top:${y}px;--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d}px;animation-delay:${Math.random()*.15}s;background:${i%3?color:'#d4a44c'}"></i>`); } document.body.appendChild(c); setTimeout(()=>c.remove(),1600); sound('success');
}
function deleteSkill(sk, node, after){
  requestDelete({label: sk.name, node, after, remove: () => {
    const pre = S.skills.filter(x => x.prereqs.includes(sk.id)); pre.forEach(x => x.prereqs = x.prereqs.filter(y => y !== sk.id));
    const vis = S.visions.filter(v => v.preSkills.includes(sk.id)); vis.forEach(v => v.preSkills = v.preSkills.filter(y => y !== sk.id));
    const touched = S.entries.filter(e => (e.links?.skills||[]).includes(sk.id)); const rl = snapshotLinks(touched); touched.forEach(e => e.links.skills = e.links.skills.filter(y => y !== sk.id));
    const habits = S.habits.filter(h => (h.links?.skills||[]).includes(sk.id)); habits.forEach(h => h.links.skills = h.links.skills.filter(y => y !== sk.id));
    const back = spliceOut(S.skills, x => x.id === sk.id);
    return () => { back(); pre.forEach(x => x.prereqs.push(sk.id)); vis.forEach(v => v.preSkills.push(sk.id)); rl(); habits.forEach(h => h.links.skills.push(sk.id)); };
  }});
}
function openSkillPanel(id){
  const s = byId(S.skills,id); if(!s) return; const es = sortEntries(entriesLinked('skills',s.id)); const st = skillStreak(s); const last = skillLastPracticed(s); const since = daysSince(last);
  const visions = S.visions.filter(v=>v.preSkills.includes(s.id)); const projects = S.projects.filter(p => (p.linkedSkills||[]).includes(s.id) || es.some(e=>(e.links.projects||[]).includes(p.id))); const values = {}; es.forEach(e=>(e.links.values||[]).forEach(x=>values[x.id]=(values[x.id]||0)+1));
  const arche = s.planned ? 'A bud. Nothing to judge yet.' : since>90 ? 'The Dabbler? Enthusiasm, then a plateau, then silence. Or perhaps a deliberate surrender — some competencies are meant to be let go.' : st.best>=14 && st.cur===0 ? 'The Obsessive? A long hard streak, then a break. Watch for burnout; oscillation is the rhythm, not a failure.' : s.currentLevel>=3 && !skillTargetLevel(s) && s.currentLevel < skillLevelCount(s) ? 'The Hacker? Good enough, and stopped. Is this the level you chose, or the one you settled for?' : 'On the path. Loving the plateau. The master stays on the mat five minutes longer.';
  const p = openPanel(`<div class="mono">${esc(s.cat)} · ${s.planned?'planned':'level '+s.currentLevel+' of '+skillLevelCount(s)}</div><h2>${ed(`skills.#${s.id}.name`)}</h2>
    <div class="row" style="margin:8px 0 18px"><select class="sel" style="width:auto" id="skCatSel">${SKILL_CATS.map(c=>`<option ${s.cat===c?'selected':''}>${c}</option>`).join('')}</select><label class="toggle ${s.planned?'on':''}" id="skPl"><span class="sw"></span><span>planned</span></label></div>
    <div class="grid c3" style="gap:10px"><div class="card" style="padding:12px 14px"><div class="mono">last practiced</div><div class="serif" style="font-size:1.2rem">${relDays(since)}</div></div><div class="card" style="padding:12px 14px"><div class="mono">streak</div><div class="serif" style="font-size:1.2rem">${st.cur}d <span class="faint" style="font-size:.8rem">best ${st.best}</span></div></div><div class="card" style="padding:12px 14px"><div class="mono">total hours</div><div class="serif" style="font-size:1.2rem" data-tween="${skillHours(s)}" data-dec="1">0</div></div></div>
    <div class="archetype">${arche}</div>
    ${levelTrackHTML(s)}
    ${milestoneTimelineHTML(s)}
    <div class="vp-sec"><span class="sc">Prerequisites</span><div class="deps">${S.skills.filter(x=>x.id!==s.id).map(x=>`<span class="chip click ${s.prereqs.includes(x.id)?'on':''}" style="--c:${catColor(x.cat)}" data-pre="${x.id}">${esc(x.name)}</span>`).join('')}</div></div>
    <div class="vp-sec"><span class="sc">Cross-mappings</span>
      <div class="k mono" style="margin:6px 0 4px">load-bearing for visions — what do I need to become to live that life?</div><div class="deps">${visions.map(v=>`<span class="chip on click" style="--c:var(--sage)" data-go="#/vision/${v.id}">🌿 ${esc(v.name)}</span>`).join('')||'<span class="faint">no vision depends on this yet</span>'}</div>
      <div class="k mono" style="margin:10px 0 4px">linked projects — am I practising what I claim to build?</div><div class="deps">${projects.map(pr=>`<span class="chip on click" style="--c:var(--terra)" data-go="#/projects/${pr.id}">🎨 ${esc(pr.name)}${(pr.linkedSkills||[]).includes(s.id)?' · linked':''}</span>`).join('')||'<span class="faint">no linked projects yet — tag this skill from a project</span>'}</div>
      <div class="k mono" style="margin:10px 0 4px">serves values</div><div class="deps">${Object.entries(values).map(([id,n])=>{ const v=byId(S.values,id); return v?`<span class="chip on click" style="--c:${v.color}" data-go="#/value/${id}">${esc(v.name)} · ${n}</span>`:''; }).join('')||'<span class="faint">tag values on progress entries</span>'}</div></div>
    <div class="vp-sec"><div class="row between"><span class="sc">Progress log</span><button class="btn sm" id="skLog">+ practice</button></div>${es.map(e=>entryCard(e)).join('')||'<div class="empty">No practice logged yet.</div>'}</div>
    ${moreSection(`<div class="danger-zone"><span>Skills accrue slowly. Consider marking it planned or lowering the level before deleting.</span><button class="btn sm ghost danger" id="skDel">Delete this skill</button></div>`)}`);
  $$('#panel .rv').forEach(n=>n.classList.add('in'));
  p.querySelector('#skCatSel').onchange = e => { s.cat = e.target.value; saveNow(); rerender(); openSkillPanel(id); };
  p.querySelector('#skPl').onclick = () => { s.planned = !s.planned; if(!s.planned && s.currentLevel===0) s.currentLevel=1; saveNow(); rerender(); openSkillPanel(id); };
  bindLevelTrack(p, s);
  bindMilestones(p, s);
  p.querySelectorAll('[data-pre]').forEach(c => c.onclick = () => { const x = c.dataset.pre; s.prereqs = s.prereqs.includes(x) ? s.prereqs.filter(y=>y!==x) : [...s.prereqs,x]; saveNow(); c.classList.toggle('on'); rerender(); });
  p.querySelector('#skLog').onclick = () => openEntryModal({type:'progress', links:{skills:[s.id]}, after:()=>{ rerender(); openSkillPanel(id); }});
  p.querySelector('#skDel').onclick = () => deleteSkill(s, null, () => { closePanel(); rerender(); });
}

/* ============================================================
   LEVELS — customisable progression track, and MILESTONES
   ============================================================ */
const RES_ICON = {book:'📖', video:'▶', course:'🎓', article:'📄', tool:'🛠'};
function levelTrackHTML(s){
  const n = skillLevelCount(s), cur = s.currentLevel; const color = catColor(s.cat); const openLv = S._openLevel?.[s.id];
  return `<div class="vp-sec"><div class="row between"><span class="sc">The path — ${n} level${n===1?'':'s'}</span><span class="mono">Level ${cur} of ${n}</span></div>
    <div class="bar" style="--c:${color};margin:6px 0 14px"><i style="width:${(cur/n*100).toFixed(0)}%"></i></div>
    <div class="lvl-track" id="lvlTrack" style="--c:${color}">${s.levels.map((l,i) => { const num = i+1; const state = num < cur ? 'done' : num === cur ? 'current' : 'future'; const ms = (s.milestones||[]).filter(m => m.levelTarget === num); return `<div class="lvl ${state} ${openLv===num?'open':''}" data-level="${num}" draggable="true">
      <div class="lvl-rail"><span class="lvl-handle" title="drag to reorder">⠿</span><button class="lvl-node" data-setlevel="${num}" title="${state==='current'?'current level':'set as current level'}">${state==='done'?'✓':num}</button></div>
      <div class="lvl-body">
        <div class="lvl-head" data-expand="${num}"><span class="lvl-label">${ed(`skills.#${s.id}.levels.${i}.label`,{ph:'level name'})}</span><span class="mono lvl-meta">${l.estimatedTime?`⏱ ${esc(l.estimatedTime)}`:''}${ms.map(m=>` <span class="ms-chip ${m.by&&daysBetween(today(),m.by)<0?'due':''}">📅 ${m.by?fmtMonth(m.by):'no date'}</span>`).join('')}</span><span class="lvl-chev">›</span></div>
        <div class="lvl-detail"><div class="lvl-detail-inner">
          <div class="k mono">what I can do at this level</div><div class="prose" style="font-size:.9rem">${ed(`skills.#${s.id}.levels.${i}.description`,{multi:true,mdr:true,ph:'Describe the capability. Markdown welcome.'})}</div>
          <div class="k mono" style="margin-top:10px">criteria — observable behaviours</div><ul class="lvl-criteria">${l.criteria.map((c,ci)=>`<li><span class="mono">▸</span>${ed(`skills.#${s.id}.levels.${i}.criteria.${ci}`,{ph:'something I can be seen doing'})}<button class="del-x inline" data-critdel="${i}:${ci}" title="remove">×</button></li>`).join('')}</ul><button class="tbtn" data-critadd="${i}">+ criterion</button>
          <div class="k mono" style="margin-top:10px">resources</div><div class="lvl-res">${l.resources.map((r,ri)=>{ let host=''; try { host = new URL(r.url).hostname; } catch(e){} return `<div class="res-row"><span class="res-type" title="${esc(r.type)}">${RES_ICON[r.type]||'▫'}</span>${r.url?`<a class="res-link" href="${esc(r.url)}" target="_blank" rel="noopener">${host?`<img class="res-fav" src="https://www.google.com/s2/favicons?domain=${esc(host)}&sz=16" alt="" onerror="this.style.display='none'">`:''}${esc(r.title||r.url)}</a>`:`<span>${esc(r.title||'untitled resource')}</span>`}<span class="status-pill" style="font-size:.6rem">${esc(r.type)}</span><span class="res-edit"><span class="ed-wrap">${ed(`skills.#${s.id}.levels.${i}.resources.${ri}.title`,{ph:'title',cls:'mono'})}</span><span class="ed-wrap">${ed(`skills.#${s.id}.levels.${i}.resources.${ri}.url`,{ph:'https://…',cls:'mono'})}</span><select class="sel" data-restype="${i}:${ri}" style="width:auto;padding:1px 6px;font-size:.66rem">${RESOURCE_TYPES.map(t=>`<option ${r.type===t?'selected':''}>${t}</option>`).join('')}</select><button class="del-x inline" data-resdel="${i}:${ri}" title="remove">×</button></span></div>`; }).join('')}</div><button class="tbtn" data-resadd="${i}">+ resource</button>
          <div class="row" style="gap:16px;margin-top:10px;flex-wrap:wrap"><span><span class="k mono">estimated time</span> ${ed(`skills.#${s.id}.levels.${i}.estimatedTime`,{ph:'e.g. 3 months',cls:'mono'})}</span><span><span class="k mono">target date</span> ${ed(`skills.#${s.id}.levels.${i}.targetDate`,{ph:'YYYY-MM-DD',cls:'mono',hook:'lvldate:'+s.id+':'+i})}</span><button class="tbtn" data-lvldel="${i}" style="margin-left:auto;color:var(--faint)">remove level</button></div>
        </div></div>
      </div></div>`; }).join('')}
      <button class="btn sm ghost" id="lvlAdd" style="margin:8px 0 0 44px">＋ Add level</button>
    </div></div>`;
}
hooks.lvldate = (arg) => { const [sid, i] = arg.split(':'); const s = byId(S.skills, sid); if(!s) return; const l = s.levels[+i]; if(l && l.targetDate === '') l.targetDate = null; saveNow(); };
function bindLevelTrack(p, s){
  const id = s.id; const reopen = () => { rerender(); openSkillPanel(id); };
  p.querySelectorAll('[data-setlevel]').forEach(b => b.onclick = e => { e.stopPropagation(); const n = +b.dataset.setlevel; const up = n > s.currentLevel; s.currentLevel = n; s.planned = false; saveNow(); reopen(); if(up) setTimeout(() => $('#main')?._skView?.burst(id), 60); });
  p.querySelectorAll('[data-expand]').forEach(h => h.addEventListener('click', e => { if(e.target.closest('.ed')) return; const n = +h.dataset.expand; S._openLevel = S._openLevel||{}; S._openLevel[id] = S._openLevel[id]===n ? null : n; const row = h.closest('.lvl'); const wasOpen = row.classList.contains('open'); p.querySelectorAll('.lvl').forEach(x => x.classList.remove('open')); if(!wasOpen) row.classList.add('open'); }));
  p.querySelector('#lvlAdd').onclick = () => { const n = s.levels.length+1; s.levels.push({number:n, label:LEVEL_LABELS[n-1]||`Level ${n}`, description:'', criteria:[], resources:[], estimatedTime:'', targetDate:null}); S._openLevel = {...(S._openLevel||{}), [id]:n}; saveNow(); reopen(); };
  p.querySelectorAll('[data-lvldel]').forEach(b => b.onclick = () => { if(s.levels.length <= 1){ toast('A skill needs at least one level.'); return; } const i = +b.dataset.lvldel; const lv = s.levels[i]; requestDelete({label:`Level ${i+1} · ${lv.label}`, remove: () => { const oldCur = s.currentLevel; const back = spliceOut(s.levels, x => x === lv); s.levels.forEach((l,k)=>l.number=k+1); if(s.currentLevel > s.levels.length) s.currentLevel = s.levels.length; (s.milestones||[]).forEach(m => { if(m.levelTarget > s.levels.length) m.levelTarget = s.levels.length; }); return () => { back(); s.levels.forEach((l,k)=>l.number=k+1); s.currentLevel = oldCur; }; }, after: reopen}); });
  p.querySelectorAll('[data-critadd]').forEach(b => b.onclick = () => { const i = +b.dataset.critadd; s.levels[i].criteria.push(''); S._openLevel = {...(S._openLevel||{}), [id]:i+1}; saveNow(); reopen(); setTimeout(()=>{ const last = $$(`#panel .lvl[data-level="${i+1}"] .lvl-criteria .ed`).slice(-1)[0]; last && beginEdit(last); },60); });
  p.querySelectorAll('[data-critdel]').forEach(b => b.onclick = () => { const [i,ci] = b.dataset.critdel.split(':').map(Number); s.levels[i].criteria.splice(ci,1); saveNow(); reopen(); });
  p.querySelectorAll('[data-resadd]').forEach(b => b.onclick = () => { const i = +b.dataset.resadd; s.levels[i].resources.push({title:'', url:'', type:'article'}); S._openLevel = {...(S._openLevel||{}), [id]:i+1}; saveNow(); reopen(); setTimeout(()=>{ const last = $$(`#panel .lvl[data-level="${i+1}"] .res-row`).slice(-1)[0]; const ed_ = last?.querySelector('.ed'); if(ed_){ last.querySelector('.res-edit').style.display='flex'; beginEdit(ed_); } },60); });
  p.querySelectorAll('[data-resdel]').forEach(b => b.onclick = () => { const [i,ri] = b.dataset.resdel.split(':').map(Number); s.levels[i].resources.splice(ri,1); saveNow(); reopen(); });
  p.querySelectorAll('[data-restype]').forEach(sel => sel.onchange = () => { const [i,ri] = sel.dataset.restype.split(':').map(Number); s.levels[i].resources[ri].type = sel.value; saveNow(); reopen(); });
  let drag = null; const track = p.querySelector('#lvlTrack');
  track.querySelectorAll('.lvl').forEach(row => {
    row.addEventListener('dragstart', ev => { if(ev.target.closest('.ed,button,select,a,input')){ ev.preventDefault(); return; } drag = +row.dataset.level; row.classList.add('dragging'); ev.dataTransfer.effectAllowed='move'; try { ev.dataTransfer.setData('text/plain', String(drag)); } catch(e){} });
    row.addEventListener('dragend', () => { row.classList.remove('dragging'); track.querySelectorAll('.lvl').forEach(x=>x.classList.remove('over')); });
    row.addEventListener('dragover', ev => { ev.preventDefault(); row.classList.add('over'); });
    row.addEventListener('dragleave', () => row.classList.remove('over'));
    row.addEventListener('drop', ev => { ev.preventDefault(); const from = drag || +ev.dataTransfer.getData('text/plain'); const to = +row.dataset.level; if(!from || from === to) return; const curObj = s.levels[s.currentLevel-1]; const [moved] = s.levels.splice(from-1, 1); s.levels.splice(to-1, 0, moved); const map = {}; s.levels.forEach((l,k) => { map[l.number] = k+1; }); s.levels.forEach((l,k) => l.number = k+1); if(curObj) s.currentLevel = s.levels.indexOf(curObj)+1; (s.milestones||[]).forEach(m => { if(map[m.levelTarget]) m.levelTarget = map[m.levelTarget]; }); drag = null; saveNow(); reopen(); });
  });
}
function milestoneTimelineHTML(s){
  const ms = skillMilestones(s); const T = today(); const color = catColor(s.cat);
  const dated = ms.filter(m => m.by); let axis = '';
  if(dated.length){ const t0 = Math.min(parseDay(T).getTime(), ...dated.map(m=>parseDay(m.by.slice(0,10)).getTime())); const t1 = Math.max(parseDay(T).getTime()+DAY*30, ...dated.map(m=>parseDay(m.by.slice(0,10)).getTime())); const X = d => 4 + ((parseDay(d.slice(0,10)).getTime()-t0)/Math.max(t1-t0,1))*92;
    axis = `<div class="ms-axis" style="--c:${color}"><div class="ms-line"></div><div class="ms-now" style="left:${X(T).toFixed(1)}%" title="today"><i></i><span>now</span></div>${dated.map((m,i)=>{ const d = daysBetween(T, m.by.slice(0,10)); const reached = s.currentLevel >= m.levelTarget; return `<div class="ms-mark ${reached?'reached':d<0?'due':'ahead'}" style="left:${X(m.by).toFixed(1)}%" title="${esc(m.note||'')}"><i></i><span class="ms-lbl">L${m.levelTarget}${reached?' ✓':d<0?' ⚠':''}<br><span class="mono">${fmtDate(m.by,'short')} ${m.by.slice(0,4)}</span></span></div>`; }).join('')}</div>`; }
  return `<div class="vp-sec"><div class="row between"><span class="sc">Milestones — ${ms.length||'no'} target${ms.length===1?'':'s'}</span><button class="btn sm ghost" id="msAdd">+ milestone</button></div>
    ${axis || '<div class="faint" style="font-size:.8rem;padding:4px 0">Set a level and a date. They appear as markers here, as chips on the tree, and on Today when they are close.</div>'}
    <div class="ms-list">${ms.map(m => { const idx = (s.milestones||[]).indexOf(m); const d = m.by ? daysBetween(T, m.by.slice(0,10)) : null; const reached = s.currentLevel >= m.levelTarget; const badge = reached ? '<span class="status-pill" style="color:var(--sage)">reached</span>' : d===null ? '<span class="status-pill">no date</span>' : d<0 ? `<span class="status-pill due">⚠ ${-d}d overdue</span>` : `<span class="status-pill ahead">in ${d}d</span>`;
      return `<div class="ms-row"><select class="sel" data-mslevel="${idx}" style="width:auto;padding:2px 6px;font-size:.7rem">${s.levels.map((l,li)=>`<option value="${li+1}" ${m.levelTarget===li+1?'selected':''}>L${li+1} · ${esc(l.label)}</option>`).join('')}</select><input type="date" class="inp" value="${m.by?m.by.slice(0,10):''}" data-msdate="${idx}" style="width:auto;padding:2px 6px;font-size:.7rem"><span class="ms-note">${ed(`skills.#${s.id}.milestones.${idx}.note`,{ph:'why this date?'})}</span>${badge}<button class="del-x inline" data-msdel="${idx}" title="remove">×</button></div>`; }).join('')}</div></div>`;
}
function bindMilestones(p, s){
  const id = s.id; const reopen = () => { rerender(); openSkillPanel(id); };
  p.querySelector('#msAdd').onclick = () => { s.milestones = s.milestones||[]; s.milestones.push({levelTarget: Math.min(s.currentLevel+1, skillLevelCount(s)), by: addDays(today(), 90), note:''}); saveNow(); reopen(); };
  p.querySelectorAll('[data-mslevel]').forEach(sel => sel.onchange = () => { s.milestones[+sel.dataset.mslevel].levelTarget = +sel.value; saveNow(); reopen(); });
  p.querySelectorAll('[data-msdate]').forEach(inp => inp.onchange = () => { s.milestones[+inp.dataset.msdate].by = inp.value || null; saveNow(); reopen(); });
  p.querySelectorAll('[data-msdel]').forEach(b => b.onclick = () => { const m = s.milestones[+b.dataset.msdel]; requestDelete({label:`Milestone L${m.levelTarget}${m.by?' · '+fmtMonth(m.by):''}`, remove: () => spliceOut(s.milestones, x => x === m), after: reopen}); });
}
