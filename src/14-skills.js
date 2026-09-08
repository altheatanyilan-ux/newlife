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
/* ---------- skill horizon & priority: catch every idea, focus on a few ---------- */
const SKILL_HORIZONS = {
  focus:   ['◉','In focus',  'the handful you are actually practising now', '#7f916a'],
  active:  ['○','Active',    'held and kept warm, but not the priority',    '#6b7f8e'],
  next:    ['↗','Up next',   'starting soon — weeks or a few months away',  '#d4a44c'],
  someday: ['◌','Someday',   'written down so it stops taking up room in your head', '#8a8d8f'],
  paused:  ['⏸','Resting',   'deliberately set down, not neglected',        '#a89f94'],
};
const SKILL_PRIOS = {P1:['P1','#c25b5b'],P2:['P2','#d4a44c'],P3:['P3','#7f916a'],P4:['P4','#8a8d8f']};
function migrateSkillFocus(){
  (S.skills||[]).forEach(s => {
    if(!SKILL_HORIZONS[s.horizon]) s.horizon = s.planned ? 'someday' : 'active';
    if(!SKILL_PRIOS[s.priority]) s.priority = 'P3';
    if(s.why === undefined) s.why = '';
    if(s.startBy === undefined) s.startBy = '';
    if(!Array.isArray(s.tags)) s.tags = [];
  });
}
const skillHorizon = s => SKILL_HORIZONS[s.horizon] ? s.horizon : 'active';
function focusSkills(){ return S.skills.filter(s => skillHorizon(s) === 'focus'); }
/* Atrophy is a skill going cold, not a skill that has not started. Something you
   have never once practised has nothing to lose yet — it reads as "never", not
   as withering. */
function skillIsAtrophying(s){ const h = skillHorizon(s); if(h === 'someday' || h === 'paused' || s.planned) return false;
  const last = skillLastPracticed(s); if(!last) return false;
  return daysSince(last) > 90; }
/* every milestone across every skill, inside a window of days */
function milestonesWithin(days){
  const T = today(); const lim = addDays(T, days); const out = [];
  S.skills.forEach(s => (skillMilestones(s)||[]).forEach(m => {
    if(!m.by || m.levelTarget <= s.currentLevel) return;
    if(m.by > lim) return;
    out.push({skill:s, m, days: daysBetween(T, m.by)});
  }));
  return out.sort((a,b) => a.m.by.localeCompare(b.m.by));
}
function skillFilterState(){
  const f = S._skf = S._skf || {q:'', horizon:'all', cat:'all', level:'all', prio:'all', sort:'horizon'};
  return f;
}
function filteredSkills(){
  const f = skillFilterState(); const q = f.q.toLowerCase();
  let list = S.skills.filter(s => {
    if(f.horizon !== 'all' && skillHorizon(s) !== f.horizon) return false;
    if(f.cat !== 'all' && s.cat !== f.cat) return false;
    if(f.prio !== 'all' && (s.priority||'P3') !== f.prio) return false;
    if(f.level !== 'all'){
      const lv = s.currentLevel || 0;
      if(f.level === '0' && lv !== 0) return false;
      if(f.level === '1-2' && !(lv >= 1 && lv <= 2)) return false;
      if(f.level === '3-4' && !(lv >= 3 && lv <= 4)) return false;
      if(f.level === '5+' && lv < 5) return false;
      if(f.level === 'atrophy' && !skillIsAtrophying(s)) return false;
      if(f.level === 'due' && !nextMilestone(s)?.by) return false;
    }
    if(q && !`${s.name} ${s.cat} ${s.why||''} ${(s.tags||[]).join(' ')}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const ho = Object.keys(SKILL_HORIZONS);
  const cmp = {
    horizon: (a,b) => ho.indexOf(skillHorizon(a)) - ho.indexOf(skillHorizon(b)) || (a.priority||'P3').localeCompare(b.priority||'P3') || a.name.localeCompare(b.name),
    priority:(a,b) => (a.priority||'P3').localeCompare(b.priority||'P3') || a.name.localeCompare(b.name),
    level:   (a,b) => (b.currentLevel||0) - (a.currentLevel||0) || a.name.localeCompare(b.name),
    recent:  (a,b) => daysSince(skillLastPracticed(a)) - daysSince(skillLastPracticed(b)),
    name:    (a,b) => a.name.localeCompare(b.name),
    cat:     (a,b) => a.cat.localeCompare(b.cat) || a.name.localeCompare(b.name),
  }[f.sort] || ((a,b)=>0);
  return list.sort(cmp);
}
routes.skills = function(root, params){
  registerPageEntry({pageName:'Skill Tree', addLabel:'Log practice', defaultEntryType:'progress', prefilledFields:{}, options:[
    {icon:'↗', label:'Log practice', desc:'Time spent today on something you are already growing.', run:()=>EntryActions.skillProgress()},
    {icon:'✓', label:'Reached a level', desc:'Move a skill up its own ladder.', run:()=>openLevelUpPicker()},
    {icon:'📅', label:'Set a milestone', desc:'A level, and the date you want it by.', run:()=>openMilestonePicker()}]});
  migrateSkillFocus();
  const f = skillFilterState(); const foc = focusSkills(); const T = today();
  const win = S._skWindow || 90; const due = milestonesWithin(win);
  const list = filteredSkills(); const cats = [...new Set(S.skills.map(s=>s.cat))].sort();
  const counts = {}; Object.keys(SKILL_HORIZONS).forEach(k => counts[k] = S.skills.filter(s => skillHorizon(s) === k).length);
  root.innerHTML = `<div class="page">
    <div class="page-head"><h1>Skill Tree</h1></div>

    <!-- 1. what you are actually doing now -->
    <section class="section rv"><div class="row between"><span class="sc" style="margin:0">In focus now</span><span class="mono">${foc.length ? `${foc.length} skill${foc.length===1?'':'s'} · everything else is waiting patiently` : 'nothing in focus'}</span></div>
      ${foc.length ? `<div class="focus-row">${foc.map(s => { const lc = skillLevelCount(s); const lv = s.currentLevel||0; const since = daysSince(skillLastPracticed(s)); const nm = nextMilestone(s); const dd = nm?.by ? daysBetween(T, nm.by) : null; const col = catColor(s.cat); const warm = since <= 7;
        return `<div class="focus-card" data-sopen="${s.id}" style="--c:${col}">
          <div class="row between"><b class="serif" style="font-size:1.06rem">${esc(s.name)}</b><span class="pri ${s.priority||'P3'}" style="--c:${(SKILL_PRIOS[s.priority||'P3'])[1]}">${s.priority||'P3'}</span></div>
          <div class="mono" style="margin-top:4px">${esc(skillLevelLabel(s,lv))} · level ${lv} of ${lc}</div>
          <div class="lvl-dots">${Array.from({length:lc},(_,i)=>`<i class="${i<lv?'on':''}"></i>`).join('')}</div>
          <div class="row between" style="margin-top:8px"><span class="mono ${warm?'':'faint'}">${since===Infinity?'never practised':warm?`practised ${relDays(since)}`:`last ${relDays(since)}`}</span>${dd!==null?`<span class="status-pill ${dd<0?'due':'ahead'}">${dd<0?`${-dd}d over`:dd===0?'today':`L${nm.levelTarget} in ${dd}d`}</span>`:''}</div>
          <button class="btn sm" data-logskill="${s.id}">log practice</button>
        </div>`; }).join('')}</div>`
      : `<div class="empty">Nothing is in focus. Open a skill and set its horizon to <b>In focus</b> — four or five is a working number, more than that is a wish list.</div>`}
    </section>

    <!-- 2. milestones inside a window you choose -->
    <section class="section rv"><div class="row between"><span class="sc" style="margin:0">Milestones ahead</span>
      <div class="row">${[30,60,90,180,365].map(d=>`<button class="btn sm ${win===d?'primary':'ghost'}" data-skwin="${d}">${d===365?'a year':d+'d'}</button>`).join('')}</div></div>
      ${due.length ? `<div class="card" style="margin-top:10px">${due.map(({skill,m,days}) => `<a href="#/skills/${skill.id}" class="ms-line ${days<0?'over':''}">
        <span class="ms-when mono">${days<0?`${-days}d over`:days===0?'today':`in ${days}d`}</span>
        <span class="ms-what"><b class="serif">${esc(skill.name)}</b> <span class="muted">→ ${esc(skillLevelLabel(skill,m.levelTarget))} (L${m.levelTarget})</span>${m.note?`<span class="quote"> — ${esc(m.note)}</span>`:''}</span>
        <span class="mono ms-date">${fmtDate(m.by,'med')}</span></a>`).join('')}</div>`
      : `<div class="empty">No milestones in the next ${win === 365 ? 'year' : win + ' days'}. A date turns a skill from a hope into a plan — open one and set one.</div>`}
    </section>

    <!-- 3. the tree -->
    <div class="row between" style="margin:30px 0 8px"><span class="sc" style="margin:0">The tree</span><button class="btn sm ghost" id="skReset" title="redraw the tree">⟳ redraw</button></div>
    <div class="skill-wrap" id="skillWrap"><div class="minimap" id="minimap" hidden></div><div class="sk-hint mono">leaves grow with each level · gold fruit is mastery · click a twig to open it</div></div>

    <!-- 4. the inventory, with the add button right above it -->
    <section class="section rv"><div class="row between"><span class="sc" style="margin:0">Inventory</span><span class="mono">${list.length} of ${S.skills.length} shown</span></div>
      <p class="muted" style="font-size:.85rem">Everything you have written down, including the skills for a life you have not started yet.</p>
      <div class="row" style="gap:8px;margin:12px 0"><button class="btn primary" id="skNew">＋ New skill</button><button class="btn ghost" id="skSomeday">＋ Someday skill</button></div>
      <div class="filter-bar">
        <input class="inp" id="skq" placeholder="search name, category, reason, tag" value="${esc(f.q)}">
        <select class="sel" id="skHorizon"><option value="all">every horizon</option>${Object.entries(SKILL_HORIZONS).map(([k,v])=>`<option value="${k}" ${f.horizon===k?'selected':''}>${v[0]} ${v[1]} (${counts[k]})</option>`).join('')}</select>
        <select class="sel" id="skCat"><option value="all">every category</option>${cats.map(c=>`<option value="${esc(c)}" ${f.cat===c?'selected':''}>${esc(c)}</option>`).join('')}</select>
        <select class="sel" id="skLevel">${[['all','any level'],['0','not started'],['1-2','level 1–2'],['3-4','level 3–4'],['5+','level 5 and up'],['due','has a milestone'],['atrophy','atrophying']].map(([v,l])=>`<option value="${v}" ${f.level===v?'selected':''}>${l}</option>`).join('')}</select>
        <select class="sel" id="skPrio"><option value="all">any priority</option>${Object.keys(SKILL_PRIOS).map(p=>`<option value="${p}" ${f.prio===p?'selected':''}>${p}</option>`).join('')}</select>
        <select class="sel" id="skSort">${[['horizon','by horizon'],['priority','by priority'],['level','by level'],['recent','by last practised'],['cat','by category'],['name','by name']].map(([v,l])=>`<option value="${v}" ${f.sort===v?'selected':''}>${l}</option>`).join('')}</select>
        ${(f.q||f.horizon!=='all'||f.cat!=='all'||f.level!=='all'||f.prio!=='all')?`<button class="btn sm ghost" id="skClearF">clear</button>`:''}
      </div>
      <div class="chip-row" style="margin-bottom:12px">${Object.entries(SKILL_HORIZONS).map(([k,v])=>`<button class="chip click ${f.horizon===k?'on':''}" style="--c:${v[3]}" data-skh="${k}" title="${esc(v[2])}">${v[0]} ${v[1]} <span class="mono">${counts[k]}</span></button>`).join('')}</div>
      <div class="inv-list">${list.length ? list.map(s => { const h = SKILL_HORIZONS[skillHorizon(s)]; const lc = skillLevelCount(s); const lv = s.currentLevel||0; const since = daysSince(skillLastPracticed(s)); const nm = nextMilestone(s);
        return `<div class="inv-row" data-sopen="${s.id}" style="--c:${catColor(s.cat)}">
          <span class="inv-h" title="${esc(h[2])}" style="color:${h[3]}">${h[0]}</span>
          <span class="inv-name"><b>${esc(s.name)}</b>${s.why?`<span class="inv-why">${esc(s.why)}</span>`:''}</span>
          <span class="chip" style="--c:${catColor(s.cat)}">${esc(s.cat)}</span>
          <span class="pri ${s.priority||'P3'}" style="--c:${(SKILL_PRIOS[s.priority||'P3'])[1]}">${s.priority||'P3'}</span>
          <span class="inv-lv"><span class="lvl-dots">${Array.from({length:lc},(_,i)=>`<i class="${i<lv?'on':''}"></i>`).join('')}</span><span class="mono">${lv}/${lc}</span></span>
          <span class="mono inv-last ${skillIsAtrophying(s)?'atrophy':''}">${skillHorizon(s)==='someday'?(s.startBy?`start by ${fmtDate(s.startBy,'short')}`:'not started'):since===Infinity?'never':relDays(since)}</span>
          <span class="mono inv-ms">${nm?.by?`L${nm.levelTarget} · ${fmtDate(nm.by,'short')}`:''}</span>
          <select class="sel inv-set" data-sethz="${s.id}" title="move this skill's horizon">${Object.entries(SKILL_HORIZONS).map(([k,v])=>`<option value="${k}" ${skillHorizon(s)===k?'selected':''}>${v[0]} ${v[1]}</option>`).join('')}</select>
        </div>`; }).join('') : `<div class="empty">Nothing matches those filters.</div>`}</div>
    </section>
  </div>`;
  drawSkillTree(root);
  if($('#skReset')) $('#skReset').onclick = () => { root._skView?.reset(); };
  window.addEventListener('resize', debounce(() => { if(currentRoute==='skills') drawSkillTree(root); }, 250), {once:true});
  $$('[data-sopen]',root).forEach(c => c.addEventListener('click', e => { if(e.target.closest('.inv-set,[data-logskill]')) return; openSkillPanel(c.dataset.sopen); }));
  $$('[data-logskill]',root).forEach(b => b.onclick = e => { e.stopPropagation(); openEntryModal({type:'progress', allowedTypes:['progress'], heading:'Log practice', links:{skills:[b.dataset.logskill]}, openLinks:true}); });
  $$('[data-skwin]',root).forEach(b => b.onclick = () => { S._skWindow = +b.dataset.skwin; rerender(); });
  $$('[data-skh]',root).forEach(b => b.onclick = () => { f.horizon = f.horizon === b.dataset.skh ? 'all' : b.dataset.skh; rerender(); });
  $$('[data-sethz]',root).forEach(sel => sel.onchange = e => { e.stopPropagation(); const s = byId(S.skills, sel.dataset.sethz); s.horizon = sel.value; if(sel.value !== 'someday') s.planned = false; saveNow(); sound('click'); rerender(); });
  $('#skNew').onclick = () => EntryActions.newSkill();
  $('#skSomeday').onclick = () => newSkillDialog({horizon:'someday'});
  const bindF = (id, key, ev='change') => { const el_ = $('#'+id); if(el_) el_.addEventListener(ev, () => { f[key] = el_.value; rerender(); if(key==='q'){ const i = $('#skq'); if(i){ i.focus(); i.setSelectionRange(i.value.length,i.value.length); } } }); };
  const q = $('#skq'); if(q) q.addEventListener('input', debounce(() => { f.q = q.value; rerender(); const i = $('#skq'); if(i){ i.focus(); i.setSelectionRange(i.value.length,i.value.length); } }, 350));
  bindF('skHorizon','horizon'); bindF('skCat','cat'); bindF('skLevel','level'); bindF('skPrio','prio'); bindF('skSort','sort');
  if($('#skClearF')) $('#skClearF').onclick = () => { S._skf = {q:'', horizon:'all', cat:'all', level:'all', prio:'all', sort:'horizon'}; rerender(); };
  if(params[0]) openSkillPanel(params[0]);
};
/* pick a skill, then jump straight to the thing you meant to do */
function openLevelUpPicker(){
  if(!S.skills.length){ toast('Add a skill first.'); return; }
  const m = openModal(`<h2>Which skill moved?</h2><div class="stack" style="gap:6px;max-height:50vh;overflow:auto">${S.skills.map(s=>`<button class="choice" data-lu="${s.id}"><span class="ico">${SKILL_HORIZONS[skillHorizon(s)][0]}</span><span><b>${esc(s.name)}</b><div class="d">level ${s.currentLevel||0} of ${skillLevelCount(s)} · ${esc(s.cat)}</div></span></button>`).join('')}</div>`,'narrow');
  m.querySelectorAll('[data-lu]').forEach(b => b.onclick = () => { m.remove(); openSkillPanel(b.dataset.lu); setTimeout(()=>document.querySelector('#panel .lvl-track')?.scrollIntoView({block:'center',behavior:'smooth'}),200); });
}
function openMilestonePicker(){
  if(!S.skills.length){ toast('Add a skill first.'); return; }
  const m = openModal(`<h2>A milestone for which skill?</h2><div class="stack" style="gap:6px;max-height:50vh;overflow:auto">${S.skills.map(s=>`<button class="choice" data-ms="${s.id}"><span class="ico">📅</span><span><b>${esc(s.name)}</b><div class="d">${(s.milestones||[]).length} target${(s.milestones||[]).length===1?'':'s'} set</div></span></button>`).join('')}</div>`,'narrow');
  m.querySelectorAll('[data-ms]').forEach(b => b.onclick = () => { m.remove(); openSkillPanel(b.dataset.ms); setTimeout(()=>document.querySelector('#panel #msAdd')?.click(),260); });
}

/* ---------- the living tree: trunk, category branches, skill twigs, leaves for progress ---------- */
function organicLayout(){
  const cats = [...new Set([...SKILL_CATS, ...S.skills.map(s=>s.cat)])].filter(c => S.skills.some(s=>s.cat===c));
  const parentOf = s => s.prereqs.find(id => byId(S.skills,id)) || null;
  const items = []; const trunkTop = 300;
  const rad = d => d*Math.PI/180; const dir = a => [Math.cos(a), Math.sin(a)]; // y up in layout space
  const limb = (start, ang, len, droop) => { const d = dir(ang); const end = [start[0]+d[0]*len, start[1]+d[1]*len]; const cd = dir(ang - droop); const ctrl = [start[0]+cd[0]*len*.55, start[1]+cd[1]*len*.55]; return {end, ctrl}; };
  const qp = (a,c,b,t) => [ (1-t)*(1-t)*a[0] + 2*(1-t)*t*c[0] + t*t*b[0], (1-t)*(1-t)*a[1] + 2*(1-t)*t*c[1] + t*t*b[1] ];
  const qt = (a,c,b,t) => Math.atan2( 2*(1-t)*(c[1]-a[1]) + 2*t*(b[1]-c[1]), 2*(1-t)*(c[0]-a[0]) + 2*t*(b[0]-c[0]) );
  const twig = (sk, parentItem, t, sideSign, depth) => {
    const start = qp(parentItem.start, parentItem.ctrl, parentItem.end, t); const tan = qt(parentItem.start, parentItem.ctrl, parentItem.end, t);
    let ang = tan + sideSign*rad(depth===2 ? 38 : 44); if(Math.sin(ang) < .2) ang = (Math.cos(ang) >= 0 ? rad(24) : rad(156)); // always reach upward
    const kids = S.skills.filter(x => parentOf(x) === sk.id); const len = (depth===2 ? 88 : 60) + 13*(sk.currentLevel||0) + 8*kids.length;
    const {end, ctrl} = limb(start, ang, len, sideSign*rad(14)); const it = {id:sk.id, kind:'skill', skill:sk, cat:sk.cat, start, end, ctrl, ang, depth, parent:parentItem.id, side:sideSign}; items.push(it);
    kids.forEach((k,m) => twig(k, it, .45 + .5*(m+.5)/kids.length, m%2 ? -sideSign : sideSign, depth+1));
    return it;
  };
  cats.forEach((c,i) => {
    const side = i%2===0 ? -1 : 1; const frac = cats.length===1 ? .6 : .18 + .78*(i/(cats.length-1)); const y0 = 30 + frac*(trunkTop-60);
    const roots = S.skills.filter(s => s.cat===c && !parentOf(s)); const all = S.skills.filter(s => s.cat===c);
    const elev = rad(16 + 30*frac); const ang = side < 0 ? Math.PI - elev : elev; const len = 165 + 52*Math.sqrt(all.length);
    const start = [0, y0]; const {end, ctrl} = limb(start, ang, len, side*rad(-10));
    const it = {id:'cat:'+c, kind:'cat', cat:c, start, end, ctrl, ang, depth:1, parent:null, side, count:all.length}; items.push(it);
    roots.forEach((sk,j) => twig(sk, it, .42 + .58*(j+.5)/roots.length, j%2 ? -1 : 1, 2));
  });
  return {items, cats, trunkTop};
}
function organicSVG(W, H){
  const {items, cats, trunkTop} = organicLayout(); const T = today();
  // fit layout (y up, trunk base at origin) into the canvas
  const xs = [0], ys = [0, trunkTop]; items.forEach(it => { [it.start, it.end, it.ctrl].forEach(p => { xs.push(p[0]); ys.push(p[1]); }); if(it.kind==='skill'){ xs.push(it.end[0] + (it.end[0] >= 0 ? 90 : -90)); ys.push(it.end[1] + 18); } else { xs.push(it.end[0] + it.side*80); } });
  const bx0 = Math.min(...xs), bx1 = Math.max(...xs), by1 = Math.max(...ys) + 20; const padX = 30, ground = H - 44;
  const k = Math.min((W - padX*2)/(bx1 - bx0), (ground - 30)/by1); const ox = padX + (W - padX*2 - (bx1-bx0)*k)/2 - bx0*k;
  const X = x => ox + x*k, Y = y => ground - y*k; const P = p => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`;
  const qp = (a,c,b,t) => [ (1-t)*(1-t)*a[0] + 2*(1-t)*t*c[0] + t*t*b[0], (1-t)*(1-t)*a[1] + 2*(1-t)*t*c[1] + t*t*b[1] ];
  const qt = (a,c,b,t) => Math.atan2( 2*(1-t)*(c[1]-a[1]) + 2*t*(b[1]-c[1]), 2*(1-t)*(c[0]-a[0]) + 2*t*(b[0]-c[0]) );
  const season = [-8,-6,0,6,10,12,10,6,2,-2,-6,-8][new Date().getMonth()];
  const trunkX = X(0); let g = '', labels = ''; const lblItems = [], labelsBySkill = {};
  g += `<defs><linearGradient id="skTrunk" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#4a3a2c"/><stop offset="1" stop-color="#6e5a44"/></linearGradient><radialGradient id="skSun"><stop offset="0" stop-color="var(--page-accent)" stop-opacity=".22"/><stop offset="1" stop-color="var(--page-accent)" stop-opacity="0"/></radialGradient><radialGradient id="skMoon"><stop offset="0" stop-color="#e8e0d4" stop-opacity=".16"/><stop offset="1" stop-color="#e8e0d4" stop-opacity="0"/></radialGradient><radialGradient id="skGround"><stop offset="0" stop-color="#3a3128" stop-opacity=".55"/><stop offset="1" stop-color="#3a3128" stop-opacity="0"/></radialGradient></defs>`;
  const hour = new Date().getHours(); const daytime = hour >= 6 && hour < 19;
  g += daytime ? `<circle class="sk-sun" cx="${(W*.84).toFixed(0)}" cy="70" r="120" fill="url(#skSun)"/>` : `<g class="sk-moon" transform="translate(${(W*.84).toFixed(0)},70)"><circle r="90" fill="url(#skMoon)"/><path d="M-8,-14 a15,15 0 1 0 12,24 a11,11 0 1 1 -12,-24 Z" fill="#e8e0d4" opacity=".55"/></g>`;
  items.filter(i => i.kind==='cat').forEach(it => { const e = it.end; const r = (46 + 10*Math.sqrt(it.count))*k; g += `<circle class="sk-canopy" cx="${X(e[0]).toFixed(1)}" cy="${(Y(e[1])-10).toFixed(1)}" r="${r.toFixed(1)}" fill="${catColor(it.cat)}" opacity=".07"/>`; });
  g += `<ellipse cx="${trunkX.toFixed(1)}" cy="${ground+4}" rx="${(W*.3).toFixed(0)}" ry="14" fill="url(#skGround)"/><line x1="${(trunkX-W*.34).toFixed(0)}" x2="${(trunkX+W*.34).toFixed(0)}" y1="${ground}" y2="${ground}" stroke="var(--line-2)" stroke-width="1"/>`;
  // roots and trunk
  const tw = clamp(10 + S.skills.length*.9, 12, 26)*k;
  g += `<path d="M${(trunkX-tw*2.4).toFixed(1)},${ground+2} Q${(trunkX-tw*.8).toFixed(1)},${(ground-tw*.5).toFixed(1)} ${trunkX.toFixed(1)},${(ground-tw).toFixed(1)} Q${(trunkX+tw*.8).toFixed(1)},${(ground-tw*.5).toFixed(1)} ${(trunkX+tw*2.4).toFixed(1)},${ground+2} Z" fill="url(#skTrunk)" opacity=".85"/>`;
  [[-1,.6],[1,.5],[-1,.3],[1,.25]].forEach(([sd,f],i) => g += `<path class="sk-root" d="M${trunkX.toFixed(1)},${(ground-4).toFixed(1)} Q${(trunkX+sd*tw*(1.2+i*.4)).toFixed(1)},${(ground+6+i*3).toFixed(1)} ${(trunkX+sd*tw*(2.6+i*.8)).toFixed(1)},${(ground+16+i*4*f).toFixed(1)}" stroke="url(#skTrunk)" stroke-width="${(3.2-i*.5).toFixed(1)}" fill="none" opacity=".55"/>`);
  g += `<path class="sk-trunk" d="M${trunkX.toFixed(1)},${ground} C${(trunkX-6*k).toFixed(1)},${Y(trunkTop*.35).toFixed(1)} ${(trunkX+7*k).toFixed(1)},${Y(trunkTop*.7).toFixed(1)} ${trunkX.toFixed(1)},${Y(trunkTop).toFixed(1)}" stroke="url(#skTrunk)" stroke-width="${tw.toFixed(1)}" stroke-linecap="round" fill="none"/>`;
  g += `<path class="sk-trunk-light" d="M${(trunkX-tw*.22).toFixed(1)},${ground-10} C${(trunkX-6*k-tw*.2).toFixed(1)},${Y(trunkTop*.35).toFixed(1)} ${(trunkX+7*k-tw*.2).toFixed(1)},${Y(trunkTop*.7).toFixed(1)} ${(trunkX-tw*.15).toFixed(1)},${Y(trunkTop*.96).toFixed(1)}" stroke="#8b7357" stroke-width="${(tw*.18).toFixed(1)}" stroke-linecap="round" fill="none" opacity=".35"/>`;
  // crown bud at the top of the trunk: the skills still to be named
  g += `<circle cx="${trunkX.toFixed(1)}" cy="${Y(trunkTop).toFixed(1)}" r="${(tw*.42).toFixed(1)}" fill="#6e5a44"/>`;
  items.filter(i => i.kind==='cat').forEach(it => {
    const col = catColor(it.cat); const w = (4 + 1.6*Math.sqrt(it.count))*k;
    g += `<g class="sk-branch" data-node="${it.id}" style="--nc:${col}"><path class="limb" d="M${P(it.start)} Q${P(it.ctrl)} ${P(it.end)}" stroke="url(#skTrunk)" stroke-width="${w.toFixed(1)}" stroke-linecap="round" fill="none"/><path class="limb-tint" d="M${P(it.start)} Q${P(it.ctrl)} ${P(it.end)}" stroke="${col}" stroke-width="${(w*.5).toFixed(1)}" stroke-linecap="round" fill="none" opacity=".28"/></g>`;
    const e = it.end; const lx = X(e[0]) + it.side*12, anchor = it.side>0 ? 'start' : 'end';
    labels += `<text class="sk-catlbl" x="${lx.toFixed(1)}" y="${(Y(e[1])+4).toFixed(1)}" text-anchor="${anchor}" style="fill:${col}">${esc(it.cat)}</text><text class="sk-catsub" x="${lx.toFixed(1)}" y="${(Y(e[1])+16).toFixed(1)}" text-anchor="${anchor}">${it.count} skill${it.count===1?'':'s'}</text>`;
    lblItems.push({id:'cat:'+it.cat, ex:X(e[0]), ey:Y(e[1])+8, x:lx, y:Y(e[1])+8, anchor, w:it.cat.length*6.4+8, h:24, fixed:true});
  });
  items.filter(i => i.kind==='skill').sort((a,b)=>a.depth-b.depth).forEach(it => {
    const s = it.skill; const col = catColor(s.cat); const locked = skillIsLocked(s); const last = skillLastPracticed(s); const since = daysSince(last); const active = !locked && !s.planned && since <= 7;
    const lc = skillLevelCount(s); const lvl = s.currentLevel||0; const prog = lc ? lvl/lc : 0; const mastered = !s.planned && lc >= 2 && lvl >= lc;
    const wither = last && !s.planned && !locked && since > 90 ? clamp((since-90)/180, 0, .8) : 0;
    const nm = nextMilestone(s); const due = nm?.by ? daysBetween(T, nm.by) : null; const blossom = due !== null && due >= 0 && due <= 45; const overdue = due !== null && due < 0;
    const limbW = ((it.depth===2 ? 3.2 : 2.4) + lvl*.5) * k * (1 - wither*.3); const limbCol = locked ? '#5a554f' : lerpColor('#6b5642', '#5a4634', prog);
    const leafBase = lerpColor(col, '#6f9a58', .25 + .45*prog); const leafCol = lerpColor(leafBase, '#8a6a3a', wither);
    const pid = `tw-${s.id}`; let inner = `<path class="limb" id="${pid}" d="M${P(it.start)} Q${P(it.ctrl)} ${P(it.end)}" stroke="${limbCol}" stroke-width="${limbW.toFixed(1)}" stroke-linecap="round" fill="none" ${locked?'stroke-dasharray="4 4"':''}/>`;
    if(active && !reduced()) inner += `<circle class="sap" r="${(2.2*k).toFixed(1)}" fill="#fff6dc" opacity=".9"><animateMotion dur="${(2.6 + (s.id.length%3)*.5).toFixed(1)}s" repeatCount="indefinite"><mpath href="#${pid}"/></animateMotion></circle>`;
    const twigLen = Math.hypot(it.end[0]-it.start[0], it.end[1]-it.start[1]); const n = s.planned || locked ? 0 : Math.min(2 + lvl*2 + Math.round(prog*2), 13, Math.round(twigLen/7));
    let lf = '';
    for(let i=0;i<n;i++){
      const t = .3 + (i/Math.max(n-1,1))*.68; const p = qp(it.start, it.ctrl, it.end, t); const tan = -qt(it.start, it.ctrl, it.end, t)*180/Math.PI; const sd = i%2 ? 1 : -1;
      const size = (4.2 + lvl*1.1) * k * (1 - wither*.3) * (.8 + ((i*7)%5)/10); const rot = tan + sd*(40 + ((i*13)%20)); const curl = wither ? ` Q${(size*.6).toFixed(1)},${(size*.35*sd).toFixed(1)} ${(size*.8).toFixed(1)},${(size*.5).toFixed(1)}` : '';
      lf += `<g transform="translate(${P(p)}) rotate(${rot.toFixed(1)})"><g class="leaf" data-phase="${(i*1.7)%6.28}" data-period="${(2.8 + (i*.37)%2).toFixed(2)}"><path d="M0,0 Q${size},${-size*.7} ${size*2},0 Q${size},${size*.7} 0,0${curl}" fill="${leafCol}" opacity="${(.9 - wither*.35).toFixed(2)}"/><path d="M0,0 L${(size*1.7).toFixed(1)},0" stroke="#1a1816" stroke-opacity=".18" stroke-width=".6"/></g></g>`;
    }
    if(s.planned || locked){ for(let i=0;i<3;i++){ const p = qp(it.start, it.ctrl, it.end, .55 + i*.2); lf += `<circle class="bud" cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="${(2.4*k).toFixed(1)}" fill="${locked?'#5a554f':col}" opacity=".7"/>`; } }
    if(mastered){ for(let i=0;i<3;i++){ const p = qp(it.start, it.ctrl, it.end, .6 + i*.16); const sd = i%2?1:-1; lf += `<circle class="fruit" cx="${(X(p[0])+sd*7*k).toFixed(1)}" cy="${(Y(p[1])+5*k).toFixed(1)}" r="${(4.6*k).toFixed(1)}" fill="#d4a44c" stroke="#7a5a3c" stroke-width=".8"/>`; } }
    if(blossom){ for(let i=0;i<3;i++){ const p = qp(it.start, it.ctrl, it.end, .7 + i*.12); const sd = i%2?1:-1; lf += `<circle class="blossom" cx="${(X(p[0])+sd*6*k).toFixed(1)}" cy="${(Y(p[1])-5*k).toFixed(1)}" r="${(2.8*k).toFixed(1)}" fill="#e6b8c4" opacity=".95"/>`; } }
    if(wither > .3){ for(let i=0;i<2;i++){ const p = qp(it.start, it.ctrl, it.end, .5 + i*.3); lf += `<g class="fall" style="animation-delay:${(i*2.1).toFixed(1)}s;animation-duration:${(6 + i*1.5).toFixed(1)}s" transform="translate(${P(p)})"><path d="M0,0 Q4,-3 8,0 Q4,3 0,0" fill="${leafCol}" opacity=".8"/></g>`; } }
    if(active){ lf = `<circle class="halo" cx="${X(it.end[0]).toFixed(1)}" cy="${Y(it.end[1]).toFixed(1)}" r="${(15*k).toFixed(1)}" fill="${col}" opacity=".16"/>` + lf; }
    if(overdue){ lf += `<circle cx="${X(it.end[0]).toFixed(1)}" cy="${Y(it.end[1]).toFixed(1)}" r="${(3*k).toFixed(1)}" fill="#c25b5b"/>`; }
    const outward = it.end[0] >= 0 ? 1 : -1;
    const sub = s.planned ? 'planned' : locked ? 'locked' : mastered ? 'mastered' : `lvl ${lvl}/${lc}${active?' · active':wither?' · withering':!last?' · not yet practised':''}`;
    const name = (locked?'🔒 ':'') + s.name; const fs = it.depth===2 ? 11.5 : 10.5;
    lblItems.push({id:s.id, ex:X(it.end[0]), ey:Y(it.end[1]), x:X(it.end[0]) + outward*8, y:Y(it.end[1]), anchor:outward>0?'start':'end', w:Math.max(name.length*fs*.56, sub.length*8.5*.62) + 6, h:24, name, sub, fs, col});
    g += `<g class="sk-twig ${locked?'locked':''} ${active?'active':''} ${mastered?'mastered':''}" data-skill="${s.id}" data-parent="${it.parent}" data-x="${X(it.end[0]).toFixed(1)}" data-y="${Y(it.end[1]).toFixed(1)}" style="--nc:${col}"><title>${esc(s.name)} · ${esc(sub)}${since<Infinity?` · last practised ${relDays(since)}`:''}</title>${inner}<g class="sk-leaves">${lf}</g><g class="sk-lblslot" data-for="${s.id}"></g></g>`;
  });
  // relax labels so they never sit on top of each other; a faint leader joins a moved label to its twig
  const boxOf = l => ({left: l.anchor==='start' ? l.x : l.x - l.w, right: l.anchor==='start' ? l.x + l.w : l.x, top: l.y - 13, bottom: l.y + 13});
  for(let pass=0; pass<20; pass++){ let moved = false; for(let i=0;i<lblItems.length;i++) for(let j=i+1;j<lblItems.length;j++){ const a = lblItems[i], b = lblItems[j]; const A = boxOf(a), B = boxOf(b); const ox = Math.min(A.right,B.right) - Math.max(A.left,B.left), oy = Math.min(A.bottom,B.bottom) - Math.max(A.top,B.top); if(ox > 2 && oy > 0){ const lower = a.y >= b.y ? a : b, upper = lower===a ? b : a; if(lower.fixed && upper.fixed) continue; if(lower.fixed) upper.y -= oy + 2; else if(upper.fixed) lower.y += oy + 2; else { lower.y += oy/2 + 1; upper.y -= oy/2 + 1; } moved = true; } } if(!moved) break; }
  lblItems.forEach(l => { if(l.fixed) return; l.y = clamp(l.y, 16, H - 52); const dy = Math.abs(l.y - l.ey); const leader = dy > 7 ? `<line class="sk-leader" x1="${l.ex.toFixed(1)}" y1="${l.ey.toFixed(1)}" x2="${(l.anchor==='start' ? l.x - 2 : l.x + 2).toFixed(1)}" y2="${l.y.toFixed(1)}"/>` : ''; labelsBySkill[l.id] = `${leader}<text class="sk-lbl" x="${l.x.toFixed(1)}" y="${(l.y-3).toFixed(1)}" text-anchor="${l.anchor}" style="font-size:${l.fs}px">${esc(l.name)}</text><text class="sk-sublbl" x="${l.x.toFixed(1)}" y="${(l.y+9).toFixed(1)}" text-anchor="${l.anchor}">${esc(l.sub)}</text>`; });
  g = g.replace(/<g class="sk-lblslot" data-for="([^"]+)"><\/g>/g, (m, id) => `<g class="sk-lblslot">${labelsBySkill[id]||''}</g>`);
  return `<svg class="sk-organic" viewBox="0 0 ${W} ${H}" style="filter:hue-rotate(${season}deg)">${g}${labels}</svg>`;
}
function drawOrganicTree(root){
  const wrap = $('#skillWrap'); if(!wrap) return; wrap.querySelector('svg')?.remove(); const mm = $('#minimap'); if(mm) mm.hidden = true; const hint = wrap.querySelector('.sk-hint'); if(hint) hint.textContent = 'leaves grow with each level · gold fruit is mastery · blossoms mean a milestone is near · brown leaves are withering';
  const W = Math.max(wrap.clientWidth, 600), H = wrap.clientHeight || 640; const svg = el(organicSVG(W, H)); wrap.insertBefore(svg, wrap.firstChild);
  const chain = id => { const out = new Set(); let cur = svg.querySelector(`.sk-twig[data-skill="${id}"]`); while(cur){ out.add(cur.dataset.skill); const p = cur.dataset.parent; cur = p && !p.startsWith('cat:') ? svg.querySelector(`.sk-twig[data-skill="${p}"]`) : null; if(p && p.startsWith('cat:')) out.add(p); } return out; };
  svg.querySelectorAll('.sk-twig').forEach(t => {
    t.addEventListener('mouseenter', () => { const ids = chain(t.dataset.skill); svg.classList.add('hov'); svg.querySelectorAll('.sk-twig,.sk-branch').forEach(x => x.classList.toggle('hot', ids.has(x.dataset.skill || x.dataset.node))); });
    t.addEventListener('mouseleave', () => { svg.classList.remove('hov'); svg.querySelectorAll('.hot').forEach(x => x.classList.remove('hot')); });
    t.addEventListener('click', () => { if(t.classList.contains('locked')){ toast('Locked — raise its prerequisite to level 2 first.'); return; } skillSelected = t.dataset.skill; openSkillPanel(t.dataset.skill); });
  });
  svg.querySelectorAll('.sk-branch').forEach(b => b.addEventListener('click', () => { const cat = b.dataset.node.slice(4); const first = S.skills.find(s => s.cat===cat); if(first) openSkillPanel(first.id); }));
  root._skView = { reset: () => drawOrganicTree(root), burst: (id) => { const t = svg.querySelector(`.sk-twig[data-skill="${id}"]`); if(!t) return; const pt = svg.createSVGPoint(); pt.x = +t.dataset.x; pt.y = +t.dataset.y; const sp = pt.matrixTransform(svg.getScreenCTM()); levelUpBurst(sp.x, sp.y, catColor(byId(S.skills,id)?.cat)); } };
  if(typeof startSway === 'function') startSway(wrap);
}
let skillSelected = null;
function drawSkillTree(root){ drawOrganicTree(root); }
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
  const values = {}; es.forEach(e=>(e.links.values||[]).forEach(x=>values[x.id]=(values[x.id]||0)+1));
  const arche = s.planned ? 'A bud. Nothing to judge yet.' : since>90 ? 'The Dabbler? Enthusiasm, then a plateau, then silence. Or perhaps a deliberate surrender — some competencies are meant to be let go.' : st.best>=14 && st.cur===0 ? 'The Obsessive? A long hard streak, then a break. Watch for burnout; oscillation is the rhythm, not a failure.' : s.currentLevel>=3 && !skillTargetLevel(s) && s.currentLevel < skillLevelCount(s) ? 'The Hacker? Good enough, and stopped. Is this the level you chose, or the one you settled for?' : 'On the path. Loving the plateau. The master stays on the mat five minutes longer.';
  const p = openPanel(`${vmToggleHTML('skill')}<div class="mono row between"><span>${esc(s.cat)} · ${s.planned?'planned':'level '+s.currentLevel+' of '+skillLevelCount(s)}</span><span class="wv-badge"></span></div><h2>${ed(`skills.#${s.id}.name`)}</h2>
    <div class="row" style="margin:8px 0 10px;gap:8px;flex-wrap:wrap">
      <select class="sel" style="width:auto" id="skCatSel">${SKILL_CATS.map(c=>`<option ${s.cat===c?'selected':''}>${c}</option>`).join('')}</select>
      <select class="sel" style="width:auto" id="skHzSel" title="how near this skill is">${Object.entries(SKILL_HORIZONS).map(([k,v])=>`<option value="${k}" ${skillHorizon(s)===k?'selected':''}>${v[0]} ${v[1]}</option>`).join('')}</select>
      <select class="sel" style="width:auto" id="skPrioSel" title="priority">${Object.keys(SKILL_PRIOS).map(pp=>`<option ${(s.priority||'P3')===pp?'selected':''}>${pp}</option>`).join('')}</select>
    </div>
    <div class="faint" style="font-size:.78rem;margin-bottom:10px">${esc(SKILL_HORIZONS[skillHorizon(s)][2])}</div>
    <div class="field" style="margin-bottom:14px"><label>Why this one?</label>${ed(`skills.#${s.id}.why`,{ph:'One line, for the day you have forgotten.'})}</div>
    ${['someday','next'].includes(skillHorizon(s))?`<div class="field" style="margin-bottom:14px"><label>Start by</label>${ed(`skills.#${s.id}.startBy`,{ph:'YYYY-MM-DD',cls:'mono'})}</div>`:''}
    <div class="grid c3" style="gap:10px"><div class="card" style="padding:12px 14px"><div class="mono">last practiced</div><div class="serif" style="font-size:1.2rem">${relDays(since)}</div></div><div class="card" style="padding:12px 14px"><div class="mono">streak</div><div class="serif" style="font-size:1.2rem">${st.cur}d <span class="faint" style="font-size:.8rem">best ${st.best}</span></div></div><div class="card" style="padding:12px 14px"><div class="mono">total hours</div><div class="serif" style="font-size:1.2rem" data-tween="${skillHours(s)}" data-dec="1">0</div></div></div>
    <div class="archetype">${arche}</div>
    ${levelTrackHTML(s)}
    ${milestoneTimelineHTML(s)}
    ${boardStrip(boardId('skill', s.id), 'Board')}
    <div class="vp-sec"><span class="sc">Prerequisites</span><div class="deps">${S.skills.filter(x=>x.id!==s.id).map(x=>`<span class="chip click ${s.prereqs.includes(x.id)?'on':''}" style="--c:${catColor(x.cat)}" data-pre="${x.id}">${esc(x.name)}</span>`).join('')}</div></div>
    <div class="vp-sec"><span class="sc">Cross-mappings</span>
      <div class="k mono" style="margin:6px 0 4px">load-bearing for visions — what do I need to become to live that life? click to link</div><div class="deps">${S.visions.map(v=>`<span class="chip click ${v.preSkills.includes(s.id)?'on':''}" style="--c:var(--sage)" data-skvision="${v.id}">🌿 ${esc(v.name)}</span>`).join('')||'<span class="faint">no visions yet</span>'}</div>
      <div class="k mono" style="margin:10px 0 4px">linked projects — am I practising what I claim to build? click to link</div><div class="deps">${S.projects.map(pr=>`<span class="chip click ${(pr.linkedSkills||[]).includes(s.id)?'on':''}" style="--c:var(--terra)" data-skproj="${pr.id}">🎨 ${esc(pr.name)}</span>`).join('')||'<span class="faint">no projects yet</span>'}</div>
      <div class="k mono" style="margin:10px 0 4px">serves values</div><div class="deps">${Object.entries(values).map(([id,n])=>{ const v=byId(S.values,id); return v?`<span class="chip on click" style="--c:${v.color}" data-go="#/value/${id}">${esc(v.name)} · ${n}</span>`:''; }).join('')||'<span class="faint">tag values on progress entries</span>'}</div></div>
    <div class="vp-sec"><div class="row between"><span class="sc">Progress log</span><button class="btn sm" id="skLog">+ practice</button></div>${es.map(e=>entryCard(e)).join('')||'<div class="empty">No practice logged yet.</div>'}</div>
    ${moreSection(`<div class="danger-zone"><span>Skills accrue slowly. Consider marking it planned or lowering the level before deleting.</span><button class="btn sm ghost danger" id="skDel">Delete this skill</button></div>`)}`);
  $$('#panel .rv').forEach(n=>n.classList.add('in'));
  bindVmToggle(p, 'skill');
  p.querySelector('#skCatSel').onchange = e => { s.cat = e.target.value; saveNow(); reopenPanel(() => { rerender(); openSkillPanel(id); }); };
  bindBoardStrip(p, () => s.name);
  p.querySelector('#skHzSel').onchange = e => { s.horizon = e.target.value; s.planned = s.horizon === 'someday'; if(!s.planned && s.currentLevel===0) s.currentLevel = 1; saveNow(); reopenPanel(() => { rerender(); openSkillPanel(id); }); };
  p.querySelector('#skPrioSel').onchange = e => { s.priority = e.target.value; saveNow(); reopenPanel(() => { rerender(); openSkillPanel(id); }); };
  bindLevelTrack(p, s);
  bindMilestones(p, s);
  p.querySelectorAll('[data-pre]').forEach(c => c.onclick = () => { const x = c.dataset.pre; s.prereqs = s.prereqs.includes(x) ? s.prereqs.filter(y=>y!==x) : [...s.prereqs,x]; saveNow(); c.classList.toggle('on'); rerender(); });
  p.querySelectorAll('[data-skvision]').forEach(c => c.onclick = () => { const v = byId(S.visions, c.dataset.skvision); v.preSkills = v.preSkills.includes(s.id) ? v.preSkills.filter(x=>x!==s.id) : [...v.preSkills, s.id]; saveNow(); c.classList.toggle('on'); });
  p.querySelectorAll('[data-skproj]').forEach(c => c.onclick = () => { const pr = byId(S.projects, c.dataset.skproj); pr.linkedSkills = (pr.linkedSkills||[]).includes(s.id) ? pr.linkedSkills.filter(x=>x!==s.id) : [...(pr.linkedSkills||[]), s.id]; saveNow(); c.classList.toggle('on'); });
  p.querySelector('#skLog').onclick = () => openEntryModal({type:'progress', links:{skills:[s.id]}, after:()=>{ reopenPanel(() => { rerender(); openSkillPanel(id); }); }});
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
  const id = s.id; const reopen = () => { reopenPanel(() => { rerender(); openSkillPanel(id); }); };
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
  const id = s.id; const reopen = () => { reopenPanel(() => { rerender(); openSkillPanel(id); }); };
  p.querySelector('#msAdd').onclick = () => { s.milestones = s.milestones||[]; s.milestones.push({levelTarget: Math.min(s.currentLevel+1, skillLevelCount(s)), by: addDays(today(), 90), note:''}); saveNow(); reopen(); };
  p.querySelectorAll('[data-mslevel]').forEach(sel => sel.onchange = () => { s.milestones[+sel.dataset.mslevel].levelTarget = +sel.value; saveNow(); reopen(); });
  p.querySelectorAll('[data-msdate]').forEach(inp => inp.onchange = () => { s.milestones[+inp.dataset.msdate].by = inp.value || null; saveNow(); reopen(); });
  p.querySelectorAll('[data-msdel]').forEach(b => b.onclick = () => { const m = s.milestones[+b.dataset.msdel]; requestDelete({label:`Milestone L${m.levelTarget}${m.by?' · '+fmtMonth(m.by):''}`, remove: () => spliceOut(s.milestones, x => x === m), after: reopen}); });
}
