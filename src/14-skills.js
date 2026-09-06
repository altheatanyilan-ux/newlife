/* ============================================================
   7. SKILL TREE — the architecture of becoming
   ============================================================ */
const SKILL_CATS = ['Languages','Technical','Creative','Physical','Social','Craft'];
const catColor = c => ({Languages:'#6b7f8e',Technical:'#8a8d8f',Creative:'#b08968',Physical:'#c47832',Social:'#a0727e',Craft:'#7f916a'}[c]||'#a89f94');
function skillLayout(W,H){
  const cats = [...new Set([...SKILL_CATS, ...S.skills.map(s=>s.cat)])].filter(c => S.skills.some(s=>s.cat===c));
  const cx = W/2, cy = H/2+10, R = Math.min(W,H)*.33; const pos = {}; const centers = {};
  cats.forEach((c,i) => { const a = -Math.PI/2 + i*2*Math.PI/cats.length; const ccx = cx + Math.cos(a)*R, ccy = cy + Math.sin(a)*R; centers[c] = [ccx,ccy]; const sk = S.skills.filter(s=>s.cat===c); sk.forEach((s,j) => { const r = sk.length===1 ? 0 : 50 + (j%2)*32; const b = a + (j/sk.length)*2*Math.PI + Math.PI/sk.length; pos[s.id] = [ccx + Math.cos(b)*r, ccy + Math.sin(b)*r]; }); });
  return {pos, centers, cats};
}
function skillSVG(W,H){
  const {pos, centers, cats} = skillLayout(W,H); let g = '';
  cats.forEach(c => { const [x,y] = centers[c]; g += `<circle cx="${x}" cy="${y}" r="90" fill="${catColor(c)}" opacity=".06"/><text class="cat-lbl" x="${x}" y="${y-100}" text-anchor="middle">${esc(c)}</text>`; });
  S.skills.forEach(s => s.prereqs.forEach(p => { if(!pos[p]||!pos[s.id]) return; const [x1,y1] = pos[p], [x2,y2] = pos[s.id]; const mx = (x1+x2)/2, my = (y1+y2)/2 - 20; g += `<path class="edge" data-from="${p}" data-to="${s.id}" d="M${x1},${y1} Q${mx},${my} ${x2},${y2}" marker-end="url(#arr)"/>`; }));
  g = `<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--line-2)"/></marker></defs>` + g;
  S.skills.forEach(s => { const [x,y] = pos[s.id]; const last = skillLastPracticed(s); const since = daysSince(last); const atrophy = !s.planned && since > 90 ? clamp((since-90)/180,0,.6) : 0; const r = (10 + s.level*3.2) * (1-atrophy*.35); const locked = s.prereqs.some(p => { const ps = byId(S.skills,p); return ps && ps.level < 2; }) && s.level===0; const col = catColor(s.cat);
    g += `<g class="node ${locked?'locked':''}" data-skill="${s.id}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})" style="opacity:${locked?.5:1-atrophy*.5}"><circle class="c" r="${r.toFixed(1)}" fill="${s.planned?'none':col}" fill-opacity="${s.planned?0:.75-atrophy*.3}" stroke="${col}" stroke-width="${s.planned?1.5:1}" ${s.planned?'stroke-dasharray="4 3"':''} style="filter:saturate(${(1-atrophy).toFixed(2)})"/>${locked?`<text y="4" text-anchor="middle" style="font-size:11px">🔒</text>`:''}<text y="${(r+13).toFixed(1)}" text-anchor="middle">${esc(s.name)}</text><text class="sub" y="${(r+24).toFixed(1)}" text-anchor="middle">${s.planned?'planned':`lvl ${s.level}${s.target>s.level?' → '+s.target:''}`}${atrophy?' · atrophy':''}</text><title>${esc(s.name)} — last practiced ${relDays(since)}</title></g>`; });
  return `<svg viewBox="0 0 ${W} ${H}">${g}</svg>`;
}
routes.skills = function(root, params){
  registerPageEntry({pageName:'Skill Tree', addLabel:'Add to the skill tree', defaultEntryType:'progress', prefilledFields:{}, options:[
    {icon:'◉', label:'New skill node', desc:'A skill you hold, or a bud you intend to open.', run:()=>EntryActions.newSkill()},
    {icon:'↗', label:'Add a level to a skill', desc:'Log practice on an existing skill; set the level from its rubric.', run:()=>EntryActions.skillProgress()}]});
  root.innerHTML = `<div class="page">
    <div class="page-head row between"><div><h1>Skill Tree</h1><div class="sub">Career capital, built on the plateau. Size is proficiency; dashed nodes are buds; faded nodes are atrophying.</div></div></div>
    <div class="skill-wrap" id="skillWrap"></div>
    <div class="grid c3 section">${S.skills.map(s=>{ const st = skillStreak(s); const last = skillLastPracticed(s); return `<div class="card rv" data-sopen="${s.id}" style="cursor:pointer;border-left:3px solid ${catColor(s.cat)}"><button class="del-x" data-sdel="${s.id}" title="delete skill">×</button><div class="row between"><h3 style="margin:0">${esc(s.name)}</h3><span class="mono">${esc(s.cat)}</span></div><div class="muted" style="font-size:.82rem;margin-top:6px">${s.planned?'planned — a bud not yet opened':`level ${s.level} of 5 · ${(s.rubric[s.level-1]||'').slice(0,60)}`}</div><div class="mono" style="margin-top:8px">last ${relDays(daysSince(last))} · streak ${st.cur}d (best ${st.best}) · ${skillHours(s).toFixed(1)}h</div></div>`; }).join('')}</div>
  </div>`;
  const wrap = $('#skillWrap'); const draw = () => { const W = Math.max(wrap.clientWidth,600), H = wrap.clientHeight; wrap.innerHTML = skillSVG(W,H); const svg = wrap.querySelector('svg');
    svg.querySelectorAll('.node').forEach(n => { n.onclick = () => openSkillPanel(n.dataset.skill); n.onmouseenter = () => { const chain = new Set(); const walk = id => { const s = byId(S.skills,id); s?.prereqs.forEach(p=>{ chain.add(p); walk(p); }); }; walk(n.dataset.skill); svg.querySelectorAll('.edge').forEach(e => e.classList.toggle('hot', e.dataset.to===n.dataset.skill || chain.has(e.dataset.to))); svg.querySelectorAll('.node').forEach(x => x.classList.toggle('hot', chain.has(x.dataset.skill))); }; n.onmouseleave = () => { svg.querySelectorAll('.hot').forEach(x=>x.classList.remove('hot')); }; });
    // magnetic pull
    if(!reduced()){ const pt = svg.createSVGPoint(); svg.addEventListener('mousemove', e => { pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); svg.querySelectorAll('.node').forEach(n => { const m = n.getAttribute('transform').match(/translate\(([-\d.]+),([-\d.]+)\)/); const x=+m[1], y=+m[2]; const dx = p.x-x, dy = p.y-y; const d = Math.hypot(dx,dy); const c = n.querySelector('circle.c'); if(d<60){ const k = (1-d/60)*4; c.style.transform = `translate(${(dx/d*k).toFixed(1)}px,${(dy/d*k).toFixed(1)}px)`; } else c.style.transform=''; }); }); } };
  draw(); window.addEventListener('resize', debounce(()=>{ if(currentRoute==='skills') draw(); },250), {once:true});
  $$('[data-sopen]',root).forEach(c => c.onclick = e => { if(e.target.closest('.del-x')) return; openSkillPanel(c.dataset.sopen); });
  $$('[data-sdel]',root).forEach(b => b.onclick = e => { e.stopPropagation(); deleteSkill(byId(S.skills, b.dataset.sdel), b.closest('.card')); });
  if(params[0]) openSkillPanel(params[0]);
};
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
    <div class="row" style="margin-top:30px;justify-content:flex-end"><button class="btn sm ghost danger" id="skDel">remove skill</button></div>`);
  $$('#panel .rv').forEach(n=>n.classList.add('in'));
  p.querySelector('#skCatSel').onchange = e => { s.cat = e.target.value; saveNow(); rerender(); openSkillPanel(id); };
  p.querySelector('#skPl').onclick = () => { s.planned = !s.planned; if(!s.planned && s.level===0) s.level=1; saveNow(); rerender(); openSkillPanel(id); };
  p.querySelectorAll('.rubric li').forEach(li => li.addEventListener('click', e => { if(e.target.closest('.ed')) return; s.level = +li.dataset.lv; s.planned=false; saveNow(); rerender(); openSkillPanel(id); }));
  p.querySelector('#skTarget').onchange = e => { s.target = +e.target.value; saveNow(); openSkillPanel(id); };
  p.querySelectorAll('[data-pre]').forEach(c => c.onclick = () => { const x = c.dataset.pre; s.prereqs = s.prereqs.includes(x) ? s.prereqs.filter(y=>y!==x) : [...s.prereqs,x]; saveNow(); c.classList.toggle('on'); rerender(); });
  p.querySelector('#skLog').onclick = () => openEntryModal({type:'progress', links:{skills:[s.id]}, after:()=>{ rerender(); openSkillPanel(id); }});
  p.querySelector('#skDel').onclick = () => deleteSkill(s, null, () => { closePanel(); rerender(); });
}
