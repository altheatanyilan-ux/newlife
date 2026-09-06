/* ============================================================
   7. SKILL TREE — the architecture of becoming
   ============================================================ */
const SKILL_CATS = ['Languages','Technical','Creative','Physical','Social','Craft'];
const catColor = c => ({Languages:'#6b7f8e',Technical:'#8a8d8f',Creative:'#b08968',Physical:'#c47832',Social:'#a0727e',Craft:'#7f916a'}[c]||'#a89f94');
/* ---------- hierarchy: virtual root → categories → skills (parent = first prerequisite) ---------- */
function skillIsLocked(s){ return s.prereqs.some(p => { const ps = byId(S.skills,p); return ps && ps.level < 2; }) && s.level === 0; }
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
  const sub = s ? (s.planned ? 'planned' : locked ? 'locked' : `lvl ${s.level}${s.target>s.level?' → '+s.target:''}${atro?' · atrophy':''}`) : (n.kind==='cat' ? `${n.kidCount} skill${n.kidCount===1?'':'s'}` : `${S.skills.length} skills`);
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
    <div class="grid c3 section">${S.skills.map(s=>{ const st = skillStreak(s); const last = skillLastPracticed(s); return `<div class="card rv" data-sopen="${s.id}" style="cursor:pointer;border-left:3px solid ${catColor(s.cat)}"><div class="row between"><h3 style="margin:0">${esc(s.name)}</h3><span class="mono">${esc(s.cat)}</span></div><div class="muted" style="font-size:.82rem;margin-top:6px">${s.planned?'planned — a bud not yet opened':`level ${s.level} of 5 · ${(s.rubric[s.level-1]||'').slice(0,60)}`}</div><div class="mono" style="margin-top:8px">last ${relDays(daysSince(last))} · streak ${st.cur}d (best ${st.best}) · ${skillHours(s).toFixed(1)}h</div></div>`; }).join('')}</div>
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
  const visions = S.visions.filter(v=>v.preSkills.includes(s.id)); const projects = S.projects.filter(p => es.some(e=>(e.links.projects||[]).includes(p.id))); const values = {}; es.forEach(e=>(e.links.values||[]).forEach(x=>values[x.id]=(values[x.id]||0)+1));
  const arche = s.planned ? 'A bud. Nothing to judge yet.' : since>90 ? 'The Dabbler? Enthusiasm, then a plateau, then silence. Or perhaps a deliberate surrender — some competencies are meant to be let go.' : st.best>=14 && st.cur===0 ? 'The Obsessive? A long hard streak, then a break. Watch for burnout; oscillation is the rhythm, not a failure.' : s.level>=3 && s.level===s.target ? 'The Hacker? Good enough, and stopped. Is this the level you chose, or the one you settled for?' : 'On the path. Loving the plateau. The master stays on the mat five minutes longer.';
  const p = openPanel(`<div class="mono">${esc(s.cat)} · ${s.planned?'planned':'level '+s.level}</div><h2>${ed(`skills.#${s.id}.name`)}</h2>
    <div class="row" style="margin:8px 0 18px"><select class="sel" style="width:auto" id="skCatSel">${SKILL_CATS.map(c=>`<option ${s.cat===c?'selected':''}>${c}</option>`).join('')}</select><label class="toggle ${s.planned?'on':''}" id="skPl"><span class="sw"></span><span>planned</span></label></div>
    <div class="grid c3" style="gap:10px"><div class="card" style="padding:12px 14px"><div class="mono">last practiced</div><div class="serif" style="font-size:1.2rem">${relDays(since)}</div></div><div class="card" style="padding:12px 14px"><div class="mono">streak</div><div class="serif" style="font-size:1.2rem">${st.cur}d <span class="faint" style="font-size:.8rem">best ${st.best}</span></div></div><div class="card" style="padding:12px 14px"><div class="mono">total hours</div><div class="serif" style="font-size:1.2rem" data-tween="${skillHours(s)}" data-dec="1">0</div></div></div>
    <div class="archetype">${arche}</div>
    <div class="vp-sec"><span class="sc">Your rubric — what each level means, for you</span><p class="faint" style="font-size:.8rem;margin:0 0 6px">Click a level to set it as current. Dashed outline is the target.</p>
      <ul class="rubric">${[1,2,3,4,5].map(l=>`<li class="${s.level===l?'cur':''} ${s.target===l?'target':''}" data-lv="${l}"><span class="lv">${l}</span><span>${ed(`skills.#${s.id}.rubric.${l-1}`,{ph:'what does level '+l+' mean for this skill?'})}</span></li>`).join('')}</ul>
      <div class="row" style="margin-top:10px"><span class="mono">target level</span><select class="sel" style="width:auto;padding:3px 8px" id="skTarget">${[1,2,3,4,5].map(l=>`<option ${s.target===l?'selected':''}>${l}</option>`).join('')}</select><span class="mono">by</span>${ed(`skills.#${s.id}.targetDate`,{ph:'YYYY-MM-DD',cls:'mono'})}</div></div>
    <div class="vp-sec"><span class="sc">Prerequisites</span><div class="deps">${S.skills.filter(x=>x.id!==s.id).map(x=>`<span class="chip click ${s.prereqs.includes(x.id)?'on':''}" style="--c:${catColor(x.cat)}" data-pre="${x.id}">${esc(x.name)}</span>`).join('')}</div></div>
    <div class="vp-sec"><span class="sc">Cross-mappings</span>
      <div class="k mono" style="margin:6px 0 4px">load-bearing for visions — what do I need to become to live that life?</div><div class="deps">${visions.map(v=>`<span class="chip on click" style="--c:var(--sage)" data-go="#/vision/${v.id}">🌿 ${esc(v.name)}</span>`).join('')||'<span class="faint">no vision depends on this yet</span>'}</div>
      <div class="k mono" style="margin:10px 0 4px">exercised by projects — am I practising what I claim to build?</div><div class="deps">${projects.map(pr=>`<span class="chip on click" style="--c:var(--terra)" data-go="#/projects/${pr.id}">🎨 ${esc(pr.name)}</span>`).join('')||'<span class="faint">no project entries yet</span>'}</div>
      <div class="k mono" style="margin:10px 0 4px">serves values</div><div class="deps">${Object.entries(values).map(([id,n])=>{ const v=byId(S.values,id); return v?`<span class="chip on click" style="--c:${v.color}" data-go="#/value/${id}">${esc(v.name)} · ${n}</span>`:''; }).join('')||'<span class="faint">tag values on progress entries</span>'}</div></div>
    <div class="vp-sec"><div class="row between"><span class="sc">Progress log</span><button class="btn sm" id="skLog">+ practice</button></div>${es.map(e=>entryCard(e)).join('')||'<div class="empty">No practice logged yet.</div>'}</div>
    ${moreSection(`<div class="danger-zone"><span>Skills accrue slowly. Consider marking it planned or lowering the level before deleting.</span><button class="btn sm ghost danger" id="skDel">Delete this skill</button></div>`)}`);
  $$('#panel .rv').forEach(n=>n.classList.add('in'));
  p.querySelector('#skCatSel').onchange = e => { s.cat = e.target.value; saveNow(); rerender(); openSkillPanel(id); };
  p.querySelector('#skPl').onclick = () => { s.planned = !s.planned; if(!s.planned && s.level===0) s.level=1; saveNow(); rerender(); openSkillPanel(id); };
  p.querySelectorAll('.rubric li').forEach(li => li.addEventListener('click', e => { if(e.target.closest('.ed')) return; const up = +li.dataset.lv > s.level; s.level = +li.dataset.lv; s.planned=false; saveNow(); rerender(); openSkillPanel(id); if(up) setTimeout(() => $('#main')?._skView?.burst(id), 60); }));
  p.querySelector('#skTarget').onchange = e => { s.target = +e.target.value; saveNow(); openSkillPanel(id); };
  p.querySelectorAll('[data-pre]').forEach(c => c.onclick = () => { const x = c.dataset.pre; s.prereqs = s.prereqs.includes(x) ? s.prereqs.filter(y=>y!==x) : [...s.prereqs,x]; saveNow(); c.classList.toggle('on'); rerender(); });
  p.querySelector('#skLog').onclick = () => openEntryModal({type:'progress', links:{skills:[s.id]}, after:()=>{ rerender(); openSkillPanel(id); }});
  p.querySelector('#skDel').onclick = () => deleteSkill(s, null, () => { closePanel(); rerender(); });
}
