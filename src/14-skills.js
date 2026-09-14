/* ============================================================
   7. SKILL TREE — the architecture of becoming
   ============================================================ */
/* The seven the tree is sorted into. Colours are drawn from the house palette
   so a branch never arrives as a stranger. */
const SKILL_CATS = ['Musical','Artistic','Income','Language','Intellectual','Social','Spirituality'];
const CAT_COLORS = {Musical:'#8a7f9e', Artistic:'#b08968', Income:'#d4a44c', Language:'#6b7f8e',
  Intellectual:'#5f7f86', Social:'#a0727e', Spirituality:'#7f916a'};
const catColor = c => CAT_COLORS[c] || '#a89f94';
/* An install made before this set existed has skills filed under the old six.
   Five of them have an obvious home; "Physical" has none in the new set, so it
   is left alone rather than quietly mis-filed, and the pickers below carry any
   category actually in use so it stays visible and can be moved deliberately. */
const CAT_RENAMES = {Languages:'Language', Creative:'Artistic', Technical:'Intellectual', Craft:'Artistic'};
function migrateSkillCats(){
  (S.skills || []).forEach(s => { const to = CAT_RENAMES[s.cat]; if(to) s.cat = to; });
}
/* every category offered: the standard seven, plus whatever is genuinely in
   use, so a skill is never shown a dropdown that disagrees with its own data */
function skillCatOptions(current){
  const inUse = (S.skills || []).map(x => x.cat).filter(Boolean);
  return [...new Set([...SKILL_CATS, ...inUse, ...(current ? [current] : [])])];
}
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
  someday: ['◌','Future',    'written down so it stops taking up room in your head', '#8a8d8f'],
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
  migrateSkillFocus(); migrateSkillCats();
  const f = skillFilterState(); const foc = focusSkills(); const T = today();
  const win = S._skWindow || 90; const due = milestonesWithin(win);
  /* The inventory used to offer only the categories something was already
     filed under, so a category with nothing in it yet — Musical, until you
     write down your first instrument — could not be chosen here at all, even
     though the panel and the add form both offer it. One vocabulary for the
     whole page: the standard seven, plus anything genuinely in use. */
  const list = filteredSkills(); const cats = skillCatOptions(f.cat !== 'all' ? f.cat : null);
  const counts = {}; Object.keys(SKILL_HORIZONS).forEach(k => counts[k] = S.skills.filter(s => skillHorizon(s) === k).length);
  root.innerHTML = `<div class="page">

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
    <div class="skill-wrap" id="skillWrap"><div class="minimap" id="minimap" hidden></div><div class="sk-hint mono">a cherry in flower · the blossom opens as the skill grows · a pair of cherries is mastery · click a twig to open it</div></div>

    <!-- 4. the inventory, with the add button right above it -->
    <section class="section rv"><div class="row between"><span class="sc" style="margin:0">Inventory</span><span class="mono">${list.length} of ${S.skills.length} shown</span></div>
      <p class="muted" style="font-size:.85rem">Everything you have written down, including the skills for a life you have not started yet.</p>
      <div class="row" style="gap:8px;margin:12px 0"><button class="btn primary" id="skNew">＋ Developing skill</button><button class="btn ghost" id="skSomeday">＋ Future skill</button></div>
      <div class="filter-bar">
        <input class="inp" id="skq" placeholder="search name, category, reason, tag" value="${esc(f.q)}">
        <select class="sel" id="skHorizon"><option value="all">every horizon</option>${Object.entries(SKILL_HORIZONS).map(([k,v])=>`<option value="${k}" ${f.horizon===k?'selected':''}>${v[0]} ${v[1]} (${counts[k]})</option>`).join('')}</select>
        <select class="sel" id="skCat"><option value="all">every category</option>${cats.map(c=>{ const n = S.skills.filter(x=>x.cat===c).length; return `<option value="${esc(c)}" ${f.cat===c?'selected':''}>${esc(c)}${n?` (${n})`:' — none yet'}</option>`; }).join('')}</select>
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
  /* the id is consumed, not kept: a re-render must not reopen the panel */
  if(params[0]){ const _id = params[0]; consumeHashParam('#/skills'); setTimeout(() => openSkillPanel(_id), 0); }
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

/* ---------- the living tree ----------
   Layout runs in its own space: the trunk's foot at the origin, y going up.
   Nothing here decides where a branch should be — it says where the light
   is (one point per skill, in `sgAttractors`) and lets the growth in
   14-skillgrow.js find its own way there. What comes back is a set of
   strands of wood; organicSVG below turns them into a cherry tree. */
function organicLayout(){
  const skills = S.skills;
  /* Seeded off the skills themselves, so the tree is the same on every
     load. A new skill adds a point of light and the crown grows toward it;
     it does not redeal the whole hand. */
  const rnd = mulberry32(hashSeed('tree:' + skills.map(s => s.id).slice().sort().join('|')));
  /* A cherry is not a pine: the trunk is short and the crown starts low.
     A tall bare pole with a wreath on top is the other way a drawn tree
     gives itself away. */
  const trunkTop = clamp(56 + Math.sqrt(skills.length) * 30, 56, 200);
  const env = sgEnvelope(skills.length, trunkTop);
  const fillers = clamp(Math.round(26 + skills.length * 3.2), 26, 96);
  const {attractors, cats} = sgAttractors(rnd, env, fillers);
  /* A trunk is never a straight line. A lean with a countercurve in it is
     the posture of something that has been standing in weather. */
  const lean = (rnd() - .5) * trunkTop * .11;
  const trunk = [[0, 0], [lean * .8 + (rnd() - .5) * 5, trunkTop * .30],
    [lean * .12, trunkTop * .65], [lean, trunkTop]];
  /* A short step and a modest influence radius are what make a tree fork
     early and often. With a wide radius every shoot is pulled by every
     skill at once, the averages cancel, and the trunk carries on upward as
     one bare pole before anything happens — which is the shape the old
     tree had, arrived at by a different route. */
  const seg = clamp(env.rx * .038, 7, 13);
  /* The influence radius is set off how far the furthest skill actually is,
     not off a constant: too small and no shoot can feel anything, so the
     tree grows as one unbranched cane toward the nearest light; too large
     and every shoot feels everything, the pulls cancel, and it grows as one
     unbranched cane straight up. Something over half the reach leaves each
     tip aware of its own quarter of the sky and nothing else. */
  const reach = Math.max(...attractors.map(a => Math.hypot(a.x - lean, a.y - trunkTop)), 120);
  const grown = sgGrow(attractors, {startX: lean, startY: trunkTop, rnd, seg,
    kill: seg * 1.5, infl: clamp(reach * .42, 85, 250),
    up: .20, jitter: .46, maxIter: Math.round(reach / seg * 3) + 40});
  const owned = sgOwn(grown, attractors, 2);
  const strands = sgStrands(owned);
  /* Thickness follows what a limb carries, not how deep it is — which is
     why a branch with six skills on it is stouter than one with one, and
     why the trunk thickens as the tree fills out. */
  const rootSize = owned.meta.get(owned.root).size || 1;
  const topW = clamp(3 + Math.sqrt(skills.length) * 4.2, 3, 26);
  const unit = topW / Math.pow(rootSize, 1 / 2.45);
  return {strands, attractors, cats, trunkTop, env, trunk, owned, unit, topW, rnd, seg};
}
/* ============================================================
   THE SAKURA — the pieces the tree is drawn from
   ------------------------------------------------------------
   A cherry in flower, not a diagram with dots on it. Three things carry that:
   the petal has a cleft at its tip (which is what makes a cherry petal a
   cherry petal rather than a rounded blob), the centre is a spray of stamens
   with yellow anthers on the ends, and the bark is smooth and dark with
   horizontal lenticels — the marks you would know a cherry by in winter.
   ============================================================ */
const SAK = {
  petal:  ['#ffeef4', '#fbd4e2', '#f4b3ca'],   /* heart, face, edge */
  petal2: ['#fff6f9', '#fde3ec', '#f6c6d8'],   /* the paler ones, for variety */
  anther: '#e6b455', filament: '#f7dce7',
  leaf:   ['#7ba85f', '#5f8d49', '#96b96f'],
  young:  ['#b58a63', '#9a6e4c'],              /* new leaves come out bronze */
  bark:   ['#4e3d33', '#6b5648', '#8a7263'],
  grass:  ['#5f9a49', '#74b358', '#4d8340', '#8cc46a'],
  orchid: ['#e8d9f0', '#c9a8dd', '#8f5fb0', '#f2e3a8'],
};
/* one cherry petal, base at the origin, pointing up the -y axis */
function sakPetal(L, W, fill, op){
  return `<path d="M0,0
    C${(-W*.56).toFixed(2)},${(-L*.28).toFixed(2)} ${(-W*.66).toFixed(2)},${(-L*.70).toFixed(2)} ${(-W*.31).toFixed(2)},${(-L*.90).toFixed(2)}
    C${(-W*.17).toFixed(2)},${(-L*1.00).toFixed(2)} ${(-W*.11).toFixed(2)},${(-L*.87).toFixed(2)} 0,${(-L*.90).toFixed(2)}
    C${(W*.11).toFixed(2)},${(-L*.87).toFixed(2)} ${(W*.17).toFixed(2)},${(-L*1.00).toFixed(2)} ${(W*.31).toFixed(2)},${(-L*.90).toFixed(2)}
    C${(W*.66).toFixed(2)},${(-L*.70).toFixed(2)} ${(W*.56).toFixed(2)},${(-L*.28).toFixed(2)} 0,0 Z"
    fill="${fill}"${op ? ` opacity="${op}"` : ''}/>`;
}
/* the stamens: a spray of filaments, each with an anther on the end */
function sakStamens(R, n){
  let out = '';
  for(let i = 0; i < n; i++){
    const a = (i / n) * 360 + (i % 3) * 4;
    const len = R * (.30 + ((i * 7) % 5) / 14);
    const bend = ((i % 2) ? 1 : -1) * R * .07;
    out += `<g transform="rotate(${a.toFixed(1)})">
      <path d="M0,0 Q${bend.toFixed(2)},${(-len * .6).toFixed(2)} 0,${(-len).toFixed(2)}"
        stroke="${SAK.filament}" stroke-width="${Math.max(.5, R * .035).toFixed(2)}" fill="none" stroke-linecap="round"/>
      <ellipse cy="${(-len).toFixed(2)}" rx="${(R * .062).toFixed(2)}" ry="${(R * .045).toFixed(2)}" fill="${SAK.anther}"/></g>`;
  }
  return out;
}
/* A whole flower at radius R. `tier` runs 1–5 and says how far open it is:
   a closed bud, a bud splitting, three petals parting, five open, and at the
   last a full bloom with a second rank of petals behind — a yae-zakura. */
function sakFlower(R, tier, pale){
  const c = pale ? SAK.petal2 : SAK.petal;
  const id = 'sakP' + (pale ? '2' : '');
  const calyx = `<g class="sak-calyx">${[0, 72, 144, 216, 288].slice(0, 5).map(a =>
    `<path d="M0,0 Q${(R * .12).toFixed(2)},${(R * .16).toFixed(2)} 0,${(R * .30).toFixed(2)} Q${(-R * .12).toFixed(2)},${(R * .16).toFixed(2)} 0,0Z"
      transform="rotate(${a + 36})" fill="#9c6b56" opacity=".75"/>`).join('')}</g>`;
  if(tier <= 1){
    /* a bud: the petals still wound round each other, calyx gripping the base */
    return `${calyx}
      <ellipse rx="${(R * .40).toFixed(2)}" ry="${(R * .70).toFixed(2)}" cy="${(-R * .34).toFixed(2)}" fill="url(#${id})"/>
      <path d="M${(-R * .16).toFixed(2)},${(-R * .12).toFixed(2)} Q${(-R * .30).toFixed(2)},${(-R * .62).toFixed(2)} 0,${(-R * .98).toFixed(2)}"
        stroke="${c[2]}" stroke-width="${(R * .07).toFixed(2)}" fill="none" opacity=".7" stroke-linecap="round"/>
      <path d="M${(R * .14).toFixed(2)},${(-R * .14).toFixed(2)} Q${(R * .28).toFixed(2)},${(-R * .60).toFixed(2)} ${(R * .02).toFixed(2)},${(-R * .96).toFixed(2)}"
        stroke="${c[0]}" stroke-width="${(R * .06).toFixed(2)}" fill="none" opacity=".8" stroke-linecap="round"/>`;
  }
  const petals = tier === 2 ? 3 : 5;
  const spread = tier === 2 ? .62 : 1;      /* half-open petals sit closer in */
  const step = 360 / petals;
  const ring = (rr, ww, off, fill, op) => Array.from({length: petals}, (_, i) =>
    `<g transform="rotate(${(i * step + off).toFixed(1)})">${sakPetal(rr, ww, fill, op)}</g>`).join('');
  let g = calyx;
  /* the second rank, only on a full bloom, set between the front petals */
  if(tier >= 5) g += `<g opacity=".85">${ring(R * .94, R * .82, step / 2, `url(#${id}b)`, '')}</g>`;
  g += ring(R * (tier === 2 ? .78 : 1) * spread + R * (1 - spread) * .3, R * .78, tier === 2 ? -14 : 0, `url(#${id})`, '');
  if(tier >= 3) g += sakStamens(R, tier >= 5 ? 22 : tier >= 4 ? 16 : 11);
  g += `<circle r="${(R * .085).toFixed(2)}" fill="#f0c98a"/>`;
  return g;
}
/* the gradients the petals are painted with — one set for the whole drawing */
function sakDefs(){
  const grad = (id, c) => `<radialGradient id="${id}" cx=".5" cy="1" r="1.05">
      <stop offset="0" stop-color="${c[0]}"/><stop offset=".45" stop-color="${c[1]}"/>
      <stop offset="1" stop-color="${c[2]}"/></radialGradient>`;
  return grad('sakP', SAK.petal) + grad('sakP2', SAK.petal2)
    + grad('sakPb', [SAK.petal[1], '#f4aec9', '#e888ae'])
    + grad('sakP2b', [SAK.petal2[1], '#f4bcd3', '#eb9dbe'])
    + `<linearGradient id="sakBark" x1="0" y1="1" x2=".7" y2="0">
        <stop offset="0" stop-color="${SAK.bark[0]}"/><stop offset=".55" stop-color="${SAK.bark[1]}"/>
        <stop offset="1" stop-color="${SAK.bark[2]}"/></linearGradient>`;
}
/* A cherry leaf: ovate, drawn to a point, with a toothed edge and its veins
   showing. `young` gives it the bronze of a leaf just out. */
function sakLeaf(L, young, tone){
  const w = L * .40, col = young ? SAK.young[tone % 2] : SAK.leaf[tone % 3];
  /* the widest point sits nearer the base than the tip, which is what makes an
     ovate leaf ovate; the teeth are the little bumps riding on that outline */
  const half = t => w * Math.sin(Math.PI * Math.pow(t, .78));
  const N = 6;
  let d = 'M0,0';
  for(let i = 0; i < N; i++){
    const t0 = i / N, t1 = (i + 1) / N, tm = (t0 + t1) / 2;
    d += ` Q${(L * tm).toFixed(2)},${(-(half(tm) + w * .17)).toFixed(2)} ${(L * t1).toFixed(2)},${(-half(t1)).toFixed(2)}`;
  }
  for(let i = N; i > 0; i--){
    const t0 = i / N, t1 = (i - 1) / N, tm = (t0 + t1) / 2;
    d += ` Q${(L * tm).toFixed(2)},${(half(tm) + w * .17).toFixed(2)} ${(L * t1).toFixed(2)},${half(t1).toFixed(2)}`;
  }
  d += ' Z';
  return `<path d="${d}" fill="${col}"/>
    <path d="M0,0 L${(L * .97).toFixed(2)},0" stroke="#3f5c30" stroke-opacity=".32"
      stroke-width="${Math.max(.4, L * .035).toFixed(2)}" fill="none" stroke-linecap="round"/>
    ${[.20, .38, .56, .72].map(t => `<path d="M${(L * t).toFixed(2)},0 q${(L * .10).toFixed(2)},${(-half(t) * .40).toFixed(2)} ${(L * .19).toFixed(2)},${(-half(t) * .66).toFixed(2)}
      M${(L * t).toFixed(2)},0 q${(L * .10).toFixed(2)},${(half(t) * .40).toFixed(2)} ${(L * .19).toFixed(2)},${(half(t) * .66).toFixed(2)}"
      stroke="#3f5c30" stroke-opacity=".2" stroke-width="${Math.max(.3, L * .022).toFixed(2)}" fill="none"/>`).join('')}`;
}
/* Grass and orchids at the foot of the tree. The grass is many blades of four
   greens, tall at the back and short at the front; the orchids are what grows
   between them — three flowers up a slender arching spike, each with the lip
   that tells an orchid from anything else. */
function sakGrassHTML(trunkX, ground, W, rnd){
  let g = '';
  /* Two ranks: a darker one behind, standing taller, and a bright one in front
     — which is what makes grass read as a lawn rather than as a row of ticks.

     Five hundred and eighty blades, each its own <path>, was the heaviest
     thing in the house: a third of every element on the page, all of it under
     a tree nobody is looking at the foot of. They are all the same shape — a
     move and one curve — and they differ only in colour, thickness and how
     faint they are. So they are drawn as one path per combination of those
     three: the thickness rounded to the nearest half-pixel and the fading to
     the nearest tenth, neither of which is a distinction an eye can draw at
     this size. Same lawn, in under a hundred elements instead of six hundred.

     This is safe because a blade never moves: the wind in this tree is applied
     to `.leaf`, and grass was never in that list. */
  const bunches = new Map();
  const blade = (col, wd, op, d) => {
    const key = `${col}|${wd}|${op}`;
    const b = bunches.get(key);
    if(b) b.d += d; else bunches.set(key, {col, wd, op, d});
  };
  const step = (v, to) => (Math.round(v / to) * to).toFixed(2);
  [[240, ['#4a7d3c', '#3f6d34'], 1.35, .55], [340, SAK.grass, 1, .95]].forEach(([n, pal, tall, op]) => {
    for(let i = 0; i < n; i++){
      const x = trunkX + (rnd() - .5) * W * 1.02;
      const h = (16 + rnd() * 34) * tall * (1 - Math.abs(x - trunkX) / (W * .8) * .3);
      const lean = (rnd() - .5) * h * .6, wd = 1 + rnd() * 1.6;
      const col = pal[(i * 7) % pal.length];
      const dip = ground + 2 + rnd() * 14;
      blade(col, step(wd, .5), step(op * (.6 + rnd() * .4), .1),
        `M${x.toFixed(1)},${dip.toFixed(1)}q${(lean * .3).toFixed(1)},${(-h * .6).toFixed(1)} ${lean.toFixed(1)},${(-h).toFixed(1)}`);
    }
  });
  bunches.forEach(b => { g += `<path class="blade" d="${b.d}" stroke="${b.col}" stroke-width="${b.wd}"
    fill="none" stroke-linecap="round" opacity="${b.op}"/>`; });
  /* the orchids, in clumps either side of the trunk */
  const clumps = 5;
  for(let c = 0; c < clumps; c++){
    const side = c % 2 ? 1 : -1;
    const x = trunkX + side * (W * .09 + rnd() * W * .30);
    const base = ground + rnd() * 5;
    const hh = 44 + rnd() * 30, bend = side * (10 + rnd() * 16);
    g += `<path d="M${x.toFixed(1)},${base.toFixed(1)} q${(bend * .3).toFixed(1)},${(-hh * .6).toFixed(1)} ${bend.toFixed(1)},${(-hh).toFixed(1)}"
      stroke="#4d7f3c" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
    /* two strap leaves at the foot */
    [[-1, 13], [1, 10]].forEach(([sd, ln]) => g += `<path d="M${x.toFixed(1)},${base.toFixed(1)}
      q${(sd * ln * .8).toFixed(1)},${(-ln * .5).toFixed(1)} ${(sd * ln * 1.5).toFixed(1)},${(-ln * .2).toFixed(1)}
      q${(-sd * ln * .7).toFixed(1)},${(ln * .5).toFixed(1)} ${(-sd * ln * 1.5).toFixed(1)},${(ln * .2).toFixed(1)}z"
      fill="#4d7f3c" opacity=".7"/>`);
    const n = 2 + Math.round(rnd());
    for(let f = 0; f < n; f++){
      const t = .45 + f * .27;
      const fx = x + bend * t * t, fy = base - hh * t;
      const r = 11 + rnd() * 5;
      g += `<g class="orchid" data-phase="${(rnd() * 6.28).toFixed(2)}" transform="translate(${fx.toFixed(1)},${fy.toFixed(1)}) rotate(${(rnd() * 40 - 20).toFixed(0)})">
        ${/* three sepals behind, narrower, at the points of a triangle */''}
        ${[90, 210, 330].map(a => `<ellipse rx="${(r * .26).toFixed(1)}" ry="${(r * .60).toFixed(1)}"
          cy="${(-r * .54).toFixed(1)}" transform="rotate(${a})" fill="${SAK.orchid[0]}" opacity=".9"/>`).join('')}
        ${/* two broad petals across the top, which is the moth-orchid look */''}
        ${[-52, 52].map(a => `<ellipse rx="${(r * .40).toFixed(1)}" ry="${(r * .54).toFixed(1)}"
          cy="${(-r * .46).toFixed(1)}" transform="rotate(${a})" fill="${SAK.orchid[1]}" opacity=".95"/>`).join('')}
        ${/* the labellum: the lower lip, split into two lobes, is the whole tell */''}
        <path d="M0,${(-r * .04).toFixed(1)}
          C${(-r * .42).toFixed(1)},${(r * .22).toFixed(1)} ${(-r * .48).toFixed(1)},${(r * .70).toFixed(1)} ${(-r * .20).toFixed(1)},${(r * .86).toFixed(1)}
          C${(-r * .07).toFixed(1)},${(r * .92).toFixed(1)} ${(-r * .05).toFixed(1)},${(r * .70).toFixed(1)} 0,${(r * .70).toFixed(1)}
          C${(r * .05).toFixed(1)},${(r * .70).toFixed(1)} ${(r * .07).toFixed(1)},${(r * .92).toFixed(1)} ${(r * .20).toFixed(1)},${(r * .86).toFixed(1)}
          C${(r * .48).toFixed(1)},${(r * .70).toFixed(1)} ${(r * .42).toFixed(1)},${(r * .22).toFixed(1)} 0,${(-r * .04).toFixed(1)}z"
          fill="${SAK.orchid[2]}" opacity=".92"/>
        <path d="M${(-r * .16).toFixed(1)},${(r * .18).toFixed(1)} q${(r * .16).toFixed(1)},${(r * .12).toFixed(1)} ${(r * .32).toFixed(1)},0"
          stroke="${SAK.orchid[3]}" stroke-width="${(r * .1).toFixed(1)}" fill="none" stroke-linecap="round" opacity=".85"/>
        <circle r="${(r * .15).toFixed(1)}" cy="${(-r * .02).toFixed(1)}" fill="${SAK.orchid[3]}"/></g>`;
    }
  }
  return g;
}
/* Nothing planted yet. A bare trunk with no branches read as a broken tree —
   as if the app had lost the skills rather than never having been given any.
   A seed under the soil, with the first pale shoot just breaking it, says the
   right thing: this is the beginning, and it is waiting on you. */
function seedSVG(W, H){
  const cx = (W/2).toFixed(1), ground = Math.round(H*.58), hour = new Date().getHours(), daytime = hour >= 6 && hour < 19;
  const sun = daytime
    ? `<circle cx="${(W*.8).toFixed(0)}" cy="86" r="130" fill="url(#skSun)"/>`
    : `<circle cx="${(W*.8).toFixed(0)}" cy="86" r="100" fill="url(#skMoon)"/>`;
  return `<svg class="sk-organic sk-seedling" viewBox="0 0 ${W} ${H}">
    <defs><linearGradient id="skTrunk" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#4a3a2c"/><stop offset="1" stop-color="#6e5a44"/></linearGradient>
      <radialGradient id="skSun"><stop offset="0" stop-color="var(--page-accent)" stop-opacity=".22"/><stop offset="1" stop-color="var(--page-accent)" stop-opacity="0"/></radialGradient>
      <radialGradient id="skMoon"><stop offset="0" stop-color="#e8e0d4" stop-opacity=".16"/><stop offset="1" stop-color="#e8e0d4" stop-opacity="0"/></radialGradient>
      <radialGradient id="skGround"><stop offset="0" stop-color="#3a3128" stop-opacity=".55"/><stop offset="1" stop-color="#3a3128" stop-opacity="0"/></radialGradient></defs>
    ${sun}
    <ellipse cx="${cx}" cy="${ground + 6}" rx="${(W*.24).toFixed(0)}" ry="16" fill="url(#skGround)"/>
    <line x1="${(W/2 - W*.28).toFixed(0)}" x2="${(W/2 + W*.28).toFixed(0)}" y1="${ground}" y2="${ground}" stroke="var(--line-2)" stroke-width="1"/>
    <g class="sk-seed" transform="translate(${cx},${ground})">
      <ellipse cy="20" rx="13" ry="17" fill="#8a6a42" stroke="#5d452b" stroke-width="1.2"/>
      <path d="M-4,10 q6,10 3,24" fill="none" stroke="#5d452b" stroke-width="1" opacity=".5"/>
      <path class="sk-shoot" d="M0,6 C-2,-8 3,-18 0,-34" fill="none" stroke="#7fae63" stroke-width="2.6" stroke-linecap="round"/>
      <g class="leaf" data-phase="0.4" data-period="3.2" transform="translate(0,-24) rotate(-34)">
        <path d="M0,0 Q9,-6 18,0 Q9,6 0,0" fill="#7fae63"/></g>
      <g class="leaf" data-phase="2.9" data-period="3.8" transform="translate(0,-30) rotate(206)">
        <path d="M0,0 Q8,-5 15,0 Q8,5 0,0" fill="#6f9a58"/></g>
      <path class="sk-root" d="M0,26 q-8,10 -16,16" fill="none" stroke="#5d452b" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
      <path class="sk-root" d="M0,26 q9,9 15,18" fill="none" stroke="#5d452b" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>
    </g>
    <text class="sk-seedlbl" x="${cx}" y="${(ground + 62).toFixed(0)}" text-anchor="middle">Every master was once a beginner.</text>
    <text class="sk-seedsub" x="${cx}" y="${(ground + 82).toFixed(0)}" text-anchor="middle">Add your first skill to plant the seed.</text>
  </svg>`;
}
function organicSVG(W, H){
  if(!S.skills.length) return seedSVG(W, H);
  const L = organicLayout(), T = today();
  const {strands, attractors, cats, trunkTop, trunk, owned, unit, topW, rnd} = L;
  const meta = owned.meta;
  const parentOf = s => s.prereqs.find(id => byId(S.skills, id)) || null;

  /* ---------- framing ----------
     The viewport is fitted to what was actually drawn rather than to a
     guess, so a tree never sits as a speck in a field of nothing. It only
     ever shrinks a crown that is too big for the frame; a sapling is left
     at life size instead of being blown up into a fake maturity. */
  const xs = [], ys = [0];
  const note = (x, y) => { xs.push(x); ys.push(y); };
  trunk.forEach(p => note(p[0], p[1]));
  owned.live.forEach(n => note(n.x, n.y));
  attractors.forEach(a => note(a.x, a.y + 26));
  const padX = 54, ground = H - 44;
  const bx0 = Math.min(...xs) - padX, bx1 = Math.max(...xs) + padX, by1 = Math.max(...ys) + 34;
  const k = Math.min((W - 24) / Math.max(bx1 - bx0, 1), (ground - 24) / Math.max(by1, 1), 1.45);
  const ox = (W - (bx1 - bx0) * k) / 2 - bx0 * k;
  const X = x => ox + x * k, Y = y => ground - y * k;
  const NP = n => [X(n.x), Y(n.y)];
  const trunkX = X(trunk[3][0]);

  /* ---------- helpers ----------
     Every piece of wood is a filled tapered shape, and every piece of wood
     is revealed by a mask whose centreline draws itself outward from the
     fork it leaves. That is what makes the tree arrive by growing: the
     mask path carries the `limb` class, and 04-foliage.js animates its
     dash offset without needing to know what it is masking. */
  let maskN = 0; const masks = [], spurCentres = [];
  const wood = (pts, widths, cls, fill, extra = '') => {
    /* `data-w` is how thick this piece of wood is where it leaves its
       parent. A stroked line advertises that in stroke-width; a filled
       shape has nowhere to say it, and the tree's own proportions are
       worth being able to check from outside. */
    if(pts.length < 2) return '';
    const id = `skm${maskN++}`, mx = Math.max(...widths);
    masks.push(`<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">`
      + `<path class="limb" d="${sgPath(pts)}" stroke="#fff" stroke-width="${(mx + 3.5).toFixed(1)}"`
      + ` fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask>`);
    return `<path class="${cls}" data-w="${widths[0].toFixed(1)}" d="${sgRibbon(pts, widths)}" fill="${fill}" mask="url(#${id})"${extra}/>`;
  };
  /* a strand as it is drawn: screen points, and the width the wood has at
     each of them. The first point is the fork it grows out of, so the base
     is allowed a flare but not the whole thickness of its parent. */
  const strandPts = st => sgSmooth(st.nodes.map(NP), 3, .3);
  const strandW = st => {
    const w = st.nodes.map(n => Math.max(sgWidth(meta.get(n).size, unit) * k, .5));
    /* A branch leaving another one starts at a flare, not at its parent's
       full thickness. A run that simply carries on — the leader out of the
       trunk — keeps it, or the wood steps in where nothing happened. */
    if(w.length > 1 && meta.get(st.nodes[0]).kind !== st.kind) w[0] = Math.min(w[0], w[1] * 1.45);
    return w;
  };
  /* walk a polyline by arc length: where a leaf sits, and which way it lies */
  const along = (pts, t) => {
    const segs = []; let total = 0;
    for(let i = 1; i < pts.length; i++){ const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(d); total += d; }
    let want = clamp(t, 0, 1) * total;
    for(let i = 0; i < segs.length; i++){
      if(want <= segs[i] || i === segs.length - 1){
        const u = segs[i] ? clamp(want / segs[i], 0, 1) : 0, a = pts[i], b = pts[i + 1];
        return {p: [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u],
          ang: Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI, len: total};
      }
      want -= segs[i];
    }
    return {p: pts[pts.length - 1], ang: 0, len: total};
  };
  const P2 = p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

  const season = [-8,-6,0,6,10,12,10,6,2,-2,-6,-8][new Date().getMonth()];
  let g = '', labels = ''; const lblItems = [], labelsBySkill = {};
  const hour = new Date().getHours(), daytime = hour >= 6 && hour < 19;
  g += daytime
    ? `<circle class="sk-sun" cx="${(W*.84).toFixed(0)}" cy="70" r="120" fill="url(#skSun)"/>`
    : `<g class="sk-moon" transform="translate(${(W*.84).toFixed(0)},70)"><circle r="90" fill="url(#skMoon)"/><path d="M-8,-14 a15,15 0 1 0 12,24 a11,11 0 1 1 -12,-24 Z" fill="#e8e0d4" opacity=".55"/></g>`;

  /* the soft wash of colour behind each category's share of the crown */
  const skillPts = attractors.filter(a => a.skill);
  const catCloud = {};
  skillPts.forEach(a => { (catCloud[a.cat] || (catCloud[a.cat] = [])).push(a); });
  Object.keys(catCloud).forEach(c => {
    const pts = catCloud[c].map(a => [X(a.x), Y(a.y)]);
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const r = Math.max(52 * k, pts.reduce((m, p) => Math.max(m, Math.hypot(p[0] - cx, p[1] - cy)), 0) + 42 * k);
    g += `<circle class="sk-canopy" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${catColor(c)}" opacity=".07"/>`;
  });

  /* Leaves loose in the gaps between branches. They are attached to nothing
     and mean nothing: they are there so the crown has a silhouette instead
     of a set of separate twigs floating apart. */
  {
    const many = clamp(Math.round(S.skills.length * 3.4), 8, 60);
    for(let i = 0; i < many; i++){
      const a = attractors[Math.floor(rnd() * attractors.length)];
      const th = rnd() * Math.PI * 2, rr = (16 + rnd() * 66) * k;
      const cx = X(a.x) + Math.cos(th) * rr, cy = Y(a.y) + Math.sin(th) * rr * .66;
      const sz = (13 + rnd() * 9) * k, rot = rnd() * 360, petal = rnd() < .28;
      g += `<g class="leaf amb" data-phase="${(rnd()*6.28).toFixed(2)}" data-period="${(3 + rnd()*2.4).toFixed(2)}"
        transform="translate(${cx.toFixed(1)},${cy.toFixed(1)}) rotate(${rot.toFixed(0)})" opacity="${(.32 + rnd()*.26).toFixed(2)}">
        ${petal ? sakPetal(sz * .9, sz * .72, 'url(#sakP2)', '') : sakLeaf(sz, rnd() < .12, Math.floor(rnd()*3))}</g>`;
    }
  }

  /* ---------- the ground ---------- */
  g += `<ellipse cx="${trunkX.toFixed(1)}" cy="${ground+4}" rx="${(W*.3).toFixed(0)}" ry="14" fill="url(#skGround)"/>`;
  g += `<path d="M${(trunkX-W*.5).toFixed(0)},${(ground+4).toFixed(0)} Q${(trunkX-W*.22).toFixed(0)},${(ground-9).toFixed(0)} ${trunkX.toFixed(0)},${(ground-5).toFixed(0)} Q${(trunkX+W*.24).toFixed(0)},${(ground-11).toFixed(0)} ${(trunkX+W*.5).toFixed(0)},${(ground+4).toFixed(0)} L${(trunkX+W*.5).toFixed(0)},${(ground+44).toFixed(0)} L${(trunkX-W*.5).toFixed(0)},${(ground+44).toFixed(0)} Z" fill="#6fa353" opacity=".30"/>`;

  /* ---------- roots ----------
     The same tapered shape as a branch, grown the other way: a short fan
     that spreads and flattens as it goes into the soil, so the tree is
     standing in the ground rather than resting on it. */
  /* A sapling's foot barely flares; an old tree's spreads into its roots.
     Flaring both by the same factor gave one skill the butt of a veteran. */
  const baseW = topW * (1.52 + Math.min(S.skills.length, 24) * .018) * k;
  {
    const many = 3 + Math.floor(rnd() * 3);
    for(let i = 0; i < many; i++){
      const sd = i % 2 ? 1 : -1, f = .5 + rnd() * .9;
      const reach = baseW * (1.9 + f * 2.4), drop = 7 + rnd() * 11;
      const pts = [[trunkX + sd * baseW * .18, ground - baseW * .35],
        [trunkX + sd * reach * .45, ground + drop * .35],
        [trunkX + sd * reach * .82, ground + drop * .85],
        [trunkX + sd * reach, ground + drop]];
      g += wood(pts, [baseW * .42, baseW * .3, baseW * .16, .9], 'sk-root', 'url(#skTrunk)', ' opacity=".62"');
    }
  }

  /* ---------- the trunk ----------
     The trunk and the leader growing out of it are one piece of wood, so
     they are drawn as one ribbon. Two paths meeting at the same point still
     meet at an angle, and the join shows as a kink — which is exactly the
     joint a real trunk does not have. */
  const rootStrand = strands.find(st => st.nodes[0] === owned.root && st.nodes.length > 1);
  {
    const stem = trunk.slice(0, 3).map(p => [X(p[0]), Y(p[1])]);
    const stemW = [baseW, baseW * .84, baseW * .70];
    const pts = rootStrand ? stem.concat(strandPts(rootStrand)) : stem.concat([[X(trunk[3][0]), Y(trunk[3][1])]]);
    const w = rootStrand ? stemW.concat(strandW(rootStrand)) : stemW.concat([topW * k]);
    g += wood(pts, w, 'sk-trunk', 'url(#skTrunk)');
    /* Bark: a few thin lines running the length of the trunk, each following
       its curve at its own offset. Then the lenticels — the short horizontal
       dashes a cherry is known by, which are the one mark that says which
       tree this is from thirty feet away. */
    for(let i = 0; i < 5; i++){
      const off = (rnd() - .5) * baseW * .55;
      const line = pts.map((p, j) => [p[0] + off * (1 - j * .18) + (rnd() - .5) * 2.4, p[1]]);
      g += `<path class="sk-bark" d="${sgPath(line)}" stroke="#33281f" stroke-width="${(baseW*.05 + .5).toFixed(2)}" fill="none" opacity="${(.10 + rnd()*.12).toFixed(2)}"/>`;
    }
    const trunkAt = f => {                       /* where the trunk is, f of the way up */
      const yy = trunkTop * f;
      for(let i = 1; i < trunk.length; i++){
        if(yy <= trunk[i][1] || i === trunk.length - 1){
          const a = trunk[i-1], b = trunk[i], u = b[1] === a[1] ? 0 : clamp((yy - a[1]) / (b[1] - a[1]), 0, 1);
          return [X(a[0] + (b[0] - a[0]) * u), Y(yy)];
        }
      }
      return [trunkX, Y(yy)];
    };
    const rows = Math.max(7, Math.round(trunkTop / 15));
    for(let i = 0; i < rows; i++){
      const f = .05 + (i / rows) * .90, at = trunkAt(f);
      const wdth = baseW + (topW * k - baseW) * f;
      const per = 1 + Math.round(rnd() * 2);
      for(let j = 0; j < per; j++){
        const wid = wdth * (.08 + rnd() * .16), offx = (rnd() - .5) * wdth * .6;
        g += `<path class="sk-lentic" d="M${(at[0] + offx - wid/2).toFixed(1)},${(at[1] + j*1.7).toFixed(1)} h${wid.toFixed(1)}"
          stroke="#33281f" stroke-width="${(wdth*.05 + .4).toFixed(2)}" stroke-linecap="round" opacity="${(.16 + rnd()*.2).toFixed(2)}"/>`;
      }
    }
    /* a few tufts at the foot, so the tree is standing in something */
    [[-2.4,.9],[-1.3,.6],[1.8,1],[2.8,.7]].forEach(([sd, h]) => {
      const gx = trunkX + sd * baseW, gh = 12 * h * k;
      g += `<path class="sk-grass" d="M${gx.toFixed(1)},${ground} q${(2*h).toFixed(1)},${(-gh*.6).toFixed(1)} ${(5*h).toFixed(1)},${(-gh).toFixed(1)} M${gx.toFixed(1)},${ground} q${(-1.6*h).toFixed(1)},${(-gh*.55).toFixed(1)} ${(-3.4*h).toFixed(1)},${(-gh*.86).toFixed(1)}" stroke="#7f916a" stroke-width="1.2" fill="none" opacity=".28" stroke-linecap="round"/>`;
    });
  }

  /* ---------- the scaffold ----------
     The wood that belongs to no one skill: the limbs above the trunk that
     several categories still share, and the short spurs the growth threw
     out that never reached anything. Trees are full of those, and leaving
     them out is half of why a drawn tree looks bald. */
  {
    /* How many spurs a crown ends up with depends on how the growth fell
       out, and a run of good luck can leave hundreds of one-segment stubs.
       The longest of them are the ones that read as branches; the rest are
       specks, and drawing them costs more than they are worth. */
    const scaff = strands.filter(st => st !== rootStrand && st.kind === 'trunk');
    const spurs = strands.filter(st => st.kind === 'twiglet' && st.nodes.length >= 2)
      .sort((a, b) => b.nodes.length - a.nodes.length)
      .slice(0, clamp(20 + S.skills.length * 2, 20, 70));
    let body = '', bl = '';
    [...scaff, ...spurs].forEach(st => {
      const pts = strandPts(st), w = strandW(st), spur = st.kind === 'twiglet';
      body += `<path class="${spur ? 'sk-spur' : 'sk-scaffold'}" data-w="${w[0].toFixed(1)}"
        d="${sgRibbon(pts, w)}" fill="url(#skTrunk)"${spur ? ' opacity=".82"' : ''}/>`;
      spurCentres.push(`<path class="limb" d="${sgPath(pts)}" stroke="#fff" stroke-width="${(Math.max(...w) + 3.5).toFixed(1)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
      const n = spur ? 2 + Math.round(rnd() * 2) : clamp(Math.round(along(pts, 1).len / (30 * k)), 2, 9);
      for(let i = 0; i < n; i++){
        const at = along(pts, .34 + (i / Math.max(n - 1, 1)) * .58 + (rnd() - .5) * .08);
        const sz = (spur ? 18 : 20) * k * (.72 + rnd() * .5);
        bl += `<g transform="translate(${P2(at.p)}) rotate(${(at.ang + (i%2?54:-54) + (rnd()-.5)*18).toFixed(1)})"><g class="leaf"
          data-phase="${(rnd()*6.28).toFixed(2)}" data-period="${(2.9 + rnd()*1.8).toFixed(2)}" opacity=".82">${sakLeaf(sz, rnd()<.12, i)}</g></g>`;
      }
    });
    /* one reveal mask for all of the scaffolding rather than one apiece:
       each centreline still draws itself, and the crown does not arrive
       carrying a hundred mask elements */
    g += `<g mask="url(#skmScaff)">${body}</g><g class="sk-branchleaves">${bl}</g>`;
  }

  /* ---------- category limbs ----------
     A limb belongs to a category when everything past it is that category's
     — which is a fact about where the branches went, not a decision taken
     in advance. Its label hangs at the far end of the longest run. */
  const catTips = {};
  cats.forEach(c => {
    const mine = strands.filter(st => st.kind === 'cat:' + c);
    if(!mine.length) return;
    const col = catColor(c);
    let body = '';
    mine.forEach(st => {
      const pts = strandPts(st), w = strandW(st);
      body += wood(pts, w, 'limb-wood', 'url(#skTrunk)');
      body += wood(pts, w.map(v => v * .52), 'limb-tint', col, ' opacity=".26"');
      /* a spray of leaves along the outer half, so the limb joins up with
         the green at the ends of its twigs instead of being a bare stick */
      const m = clamp(Math.round(along(pts, 1).len / (26 * k)), 4, 12); let bl = '';
      for(let q = 0; q < m; q++){
        const at = along(pts, .40 + (q / Math.max(m - 1, 1)) * .55);
        const sd = q % 2 ? 1 : -1, sz = 22 * k * (.74 + ((q * 7) % 6) / 11);
        bl += `<g transform="translate(${P2(at.p)}) rotate(${(at.ang + sd * (48 + ((q*11)%18))).toFixed(1)})"><g class="leaf"
          data-phase="${((q*2.3)%6.28).toFixed(2)}" data-period="${(3.1 + (q*.41)%2).toFixed(2)}" opacity=".84">${sakLeaf(sz, false, q + 1)}</g></g>`;
      }
      body += `<g class="sk-branchleaves">${bl}</g>`;
      const tip = pts[pts.length - 1];
      if(!catTips[c] || tip[1] < catTips[c][1]) catTips[c] = tip;
    });
    g += `<g class="sk-branch" data-node="cat:${esc(c)}" style="--nc:${col}">${body}</g>`;
  });
  cats.forEach(c => {
    if(!catTips[c]){
      /* a category whose skills never shared a limb — one skill, usually.
         Label the cluster instead of a branch that does not exist. */
      const pts = (catCloud[c] || []).map(a => [X(a.x), Y(a.y)]);
      if(!pts.length) return;
      catTips[c] = [pts.reduce((s, p) => s + p[0], 0) / pts.length, Math.min(...pts.map(p => p[1])) - 26 * k];
    }
    const col = catColor(c), tip = catTips[c], out = tip[0] >= trunkX ? 1 : -1;
    const count = S.skills.filter(s => s.cat === c).length;
    const lx = tip[0] + out * 13, anchor = out > 0 ? 'start' : 'end';
    labels += `<text class="sk-catlbl" x="${lx.toFixed(1)}" y="${(tip[1]+4).toFixed(1)}" text-anchor="${anchor}" style="fill:${col}">${esc(c)}</text>`
      + `<text class="sk-catsub" x="${lx.toFixed(1)}" y="${(tip[1]+16).toFixed(1)}" text-anchor="${anchor}">${count} skill${count===1?'':'s'}</text>`;
    lblItems.push({id: 'cat:' + c, ex: tip[0], ey: tip[1] + 8, x: lx, y: tip[1] + 8, anchor,
      w: Math.max(c.length * 7.2, 62) + 10, h: 24, fixed: true});
  });

  /* ---------- the skills ----------
     One twig per skill: the run of wood that only it lies beyond. What
     hangs on it is what the skill is doing — leaves for being alive at all,
     blossom for how far it has come, cherries for mastery, bronze for a
     skill going cold. */
  const bySkill = {};
  strands.filter(st => st.kind.startsWith('skill:')).forEach(st => {
    const id = st.kind.slice(6); (bySkill[id] || (bySkill[id] = [])).push(st);
  });
  skillPts.slice().sort((a, b) => a.depth - b.depth).forEach(a => {
    const s = a.skill, col = catColor(s.cat), locked = skillIsLocked(s);
    const last = skillLastPracticed(s), since = daysSince(last);
    const active = !locked && !s.planned && since <= 7;
    const lc = skillLevelCount(s), lvl = s.currentLevel || 0, prog = skillProgress(s);
    const mastered = !s.planned && (skillAbilities(s).length ? prog >= 1 : lc >= 2 && lvl >= lc);
    const wither = last && !s.planned && !locked && since > 90 ? clamp((since - 90) / 180, 0, .8) : 0;
    const nm = nextMilestone(s), due = nm?.by ? daysBetween(T, nm.by) : null;
    const soon = due !== null && due >= 0 && due <= 45, overdue = due !== null && due < 0;

    const mine = bySkill[s.id] || [];
    /* the longest run is the twig proper; anything else it threw out is a
       side spur off the same skill */
    const pts0 = mine.length ? mine.map(strandPts) : [];
    let main = 0;
    pts0.forEach((p, i) => { if(along(p, 1).len > along(pts0[main], 1).len) main = i; });
    const twig = pts0.length ? pts0[main] : [[X(a.x), Y(a.y) + 30 * k], [X(a.x), Y(a.y)]];
    const tip = twig[twig.length - 1];

    const limbCol = locked ? '#5a554f' : lerpColor('#6b5642', '#5a4634', prog);
    let inner = '';
    mine.forEach((st, i) => {
      const pts = strandPts(st), w = strandW(st).map(v => v * (1 - wither * .22));
      inner += wood(pts, w, 'wood', limbCol, locked ? ' opacity=".55"' : '');
    });
    const pid = `tw-${s.id}`;
    inner += `<path class="sk-centre" id="${pid}" d="${sgPath(twig)}" fill="none"/>`;
    if(active && !reduced()) inner += `<circle class="sap" r="${(2.2*k).toFixed(1)}" fill="#fff6dc" opacity=".9"><animateMotion dur="${(2.6 + (s.id.length%3)*.5).toFixed(1)}s" repeatCount="indefinite"><mpath href="#${pid}"/></animateMotion></circle>`;

    /* ---- foliage ----
       A twig that is alive is fully leaved whatever level it is on: leaves
       are the fact that the thing exists at all, so they do not carry the
       score. Progress is carried by the blossom. */
    let lf = '', tLeaf = .5;
    const runs = pts0.length ? pts0 : [twig];
    runs.forEach((pts, ri) => {
      const len = along(pts, 1).len;
      /* Leaves grow on the new wood at the ends, not down the whole length
         of a limb. A skill whose run happens to be the leader out of the
         trunk would otherwise come out with leaves sprouting from its
         trunk, which no tree does. */
      const t0 = clamp(1 - (150 * k) / Math.max(len, 1), .14, .74);
      if(pts === twig) tLeaf = t0;
      const n = s.planned || locked ? 0 : clamp(Math.round(len * (1 - t0) / (10 * k)) + Math.round(prog * 4), ri ? 3 : 7, 20);
      for(let i = 0; i < n; i++){
        const at = along(pts, t0 + (i / Math.max(n - 1, 1)) * (.94 - t0)), sd = i % 2 ? 1 : -1;
        const size = 22 * k * (1 - wither * .28) * (.80 + ((i * 7) % 6) / 11);
        lf += `<g transform="translate(${P2(at.p)}) rotate(${(at.ang + sd * (42 + ((i*13)%20))).toFixed(1)})"><g class="leaf"
          data-phase="${((i*1.7)%6.28).toFixed(2)}" data-period="${(2.8 + (i*.37)%2).toFixed(2)}"
          opacity="${(.94 - wither*.4).toFixed(2)}">${sakLeaf(size, wither > .3, i)}</g></g>`;
      }
    });
    if(s.planned || locked) for(let i = 0; i < 3; i++){
      const at = along(twig, .55 + i * .2);
      lf += `<circle class="bud" cx="${at.p[0].toFixed(1)}" cy="${at.p[1].toFixed(1)}" r="${(2.4*k).toFixed(1)}" fill="${locked ? '#5a554f' : col}" opacity=".7"/>`;
    }

    /* ---- the blossom ----
       A cherry flower drawn as one: five petals each with the cleft at the
       tip that makes a sakura a sakura, a spray of stamens with yellow
       anthers in the middle, the calyx gripping it from behind. How far
       open it is carries the level — bud, splitting, three petals parting,
       five open, and at mastery a double bloom with a second rank behind.
       The first one sits at the point the branch grew to reach. */
    const flowers = (s.planned || locked) ? 0 : clamp(Math.round(1 + prog * 3.2), 1, 5);
    if(flowers && lvl > 0){
      const tier = clamp(Math.ceil(prog * 5), 1, 5), R = [0, 16, 22, 28, 35, 44][tier] * Math.min(k, 1.15);
      for(let i = 0; i < flowers; i++){
        let cx, cy;
        /* the first one sits where the branch stopped — which is as near as
           the wood got to the light it was growing toward */
        if(i === 0){ cx = tip[0]; cy = tip[1]; }
        else {
          const at = along(twig, Math.max(.5, tLeaf) + (i / Math.max(flowers - 1, 1)) * (.96 - Math.max(.5, tLeaf))), sd = i % 2 ? 1 : -1;
          cx = at.p[0] + sd * R * .66; cy = at.p[1] - R * .40;
        }
        const tilt = (i * 53) % 70 - 35;
        lf += `<g class="blossom t${tier} ${soon ? 'soon' : ''}" style="--d:${(i*.28).toFixed(2)}s"
          transform="translate(${cx.toFixed(1)},${cy.toFixed(1)}) rotate(${tilt.toFixed(0)})">
          ${tier >= 4 ? `<circle r="${(R*.95).toFixed(2)}" fill="#f8cfe0" opacity=".16"/>` : ''}
          ${sakFlower(R, tier, i % 2 === 1)}</g>`;
      }
    }
    /* Mastery hangs cherries — dark, glossy, in pairs on a shared stem,
       which is how they actually grow. */
    if(mastered) for(let i = 0; i < 3; i++){
      const at = along(twig, .58 + i * .15), sd = i % 2 ? 1 : -1;
      const cx = at.p[0] + sd * 9 * k, cy = at.p[1] + 4 * k, r = 6.4 * k;
      lf += `<g class="fruit" style="--d:${(i*.22).toFixed(2)}s" transform="translate(${cx.toFixed(1)},${cy.toFixed(1)})">
        <path d="M0,${(-r*1.9).toFixed(2)} q${(-r*.5).toFixed(2)},${(r*.9).toFixed(2)} ${(-r*.78).toFixed(2)},${(r*1.5).toFixed(2)}
                 M0,${(-r*1.9).toFixed(2)} q${(r*.55).toFixed(2)},${(r*.95).toFixed(2)} ${(r*.82).toFixed(2)},${(r*1.55).toFixed(2)}"
          fill="none" stroke="#6f8a4a" stroke-width="${(r*.16).toFixed(2)}" stroke-linecap="round"/>
        ${[[-.78, 1.5, .92], [.82, 1.55, 1]].map(([dx, dy, sc]) => `<g transform="translate(${(r*dx).toFixed(2)},${(r*dy).toFixed(2)}) scale(${sc})">
          <circle r="${r.toFixed(2)}" fill="#9e2436"/>
          <path d="M${(-r*.86).toFixed(2)},${(-r*.2).toFixed(2)} a${r.toFixed(2)},${r.toFixed(2)} 0 0 1 ${(r*.7).toFixed(2)},${(-r*.72).toFixed(2)}"
            stroke="#f0a8b4" stroke-width="${(r*.26).toFixed(2)}" fill="none" stroke-linecap="round" opacity=".55"/>
          <circle r="${r.toFixed(2)}" fill="none" stroke="#5e1220" stroke-width=".6" opacity=".5"/></g>`).join('')}
      </g>`;
    }
    if(wither > .3) for(let i = 0; i < 2; i++){
      const at = along(twig, .5 + i * .3);
      lf += `<g class="fall" style="animation-delay:${(i*2.1).toFixed(1)}s;animation-duration:${(6 + i*1.5).toFixed(1)}s" transform="translate(${P2(at.p)})"><path d="M0,0 Q4,-3 8,0 Q4,3 0,0" fill="${lerpColor(col, '#8a6a3a', 1)}" opacity=".8"/></g>`;
    }
    if(active) lf = `<circle class="halo" cx="${tip[0].toFixed(1)}" cy="${tip[1].toFixed(1)}" r="${(15*k).toFixed(1)}" fill="${col}" opacity=".16"/>` + lf;
    if(overdue) lf += `<circle cx="${tip[0].toFixed(1)}" cy="${tip[1].toFixed(1)}" r="${(3*k).toFixed(1)}" fill="#c25b5b"/>`;

    const outward = tip[0] >= trunkX ? 1 : -1;
    const sub = s.planned ? 'planned' : locked ? 'locked' : mastered ? 'mastered'
      : `lvl ${lvl}/${lc}${active ? ' · active' : wither ? ' · withering' : !last ? ' · not yet practised' : ''}`;
    const name = (locked ? '🔒 ' : '') + s.name, fs = a.depth === 0 ? 11.5 : 10.5;
    lblItems.push({id: s.id, ex: tip[0], ey: tip[1], x: tip[0] + outward * 34, y: tip[1],
      anchor: outward > 0 ? 'start' : 'end',
      w: Math.max(name.length * fs * .56, sub.length * 8.5 * .62) + 6, h: 24, name, sub, fs, col});
    const par = parentOf(s);
    g += `<g class="sk-twig ${locked?'locked':''} ${active?'active':''} ${mastered?'mastered':''} ${since <= 7 ? 'fresh' : ''}"
      data-skill="${s.id}" data-parent="${par && byId(S.skills, par) ? par : 'cat:' + s.cat}"
      data-x="${tip[0].toFixed(1)}" data-y="${tip[1].toFixed(1)}" style="--nc:${col}"><title>${esc(s.name)} · ${esc(sub)}${since < Infinity ? ` · last practised ${relDays(since)}` : ''}</title>${inner}<g class="sk-leaves">${lf}</g></g>`;
  });

  /* the grass grows in front of the trunk, so it is drawn after it */
  {
    let gs = 41 + S.skills.length * 13;
    const r2 = () => { gs = (gs * 1103515245 + 12345) & 0x7fffffff; return gs / 0x7fffffff; };
    g += `<g class="sk-turf">${sakGrassHTML(trunkX, ground, W, r2)}</g>`;
  }
  /* petals in the air, which is the whole of a cherry in April */
  {
    const many = clamp(6 + S.skills.length, 6, 22);
    for(let i = 0; i < many; i++){
      const px = trunkX + (rnd() - .5) * W * .8, py = 40 + rnd() * (ground - 90), sz = (7 + rnd() * 6) * k;
      g += `<g class="sk-fallpetal" style="--dur:${(9 + rnd()*9).toFixed(1)}s;--delay:${(-rnd()*14).toFixed(1)}s;--dx:${(18 + rnd()*40).toFixed(0)}px;--dy:${(ground - py).toFixed(0)}px"
        transform="translate(${px.toFixed(1)},${py.toFixed(1)}) rotate(${(rnd()*360).toFixed(0)})">
        ${sakPetal(sz, sz*.8, 'url(#sakP)', (.5 + rnd()*.4).toFixed(2))}</g>`;
    }
  }

  /* Labels are relaxed so no two sit on top of each other; a faint leader
     joins a label that had to move back to the twig it belongs to. Touching
     counts as a clash, because each is painted with a background-coloured
     halo that eats its neighbour's first letter. */
  const boxOf = l => ({left: l.anchor === 'start' ? l.x : l.x - l.w, right: l.anchor === 'start' ? l.x + l.w : l.x, top: l.y - 15, bottom: l.y + 15});
  for(let pass = 0; pass < 40; pass++){ let moved = false;
    for(let i = 0; i < lblItems.length; i++) for(let j = i + 1; j < lblItems.length; j++){
      const a = lblItems[i], b = lblItems[j], A = boxOf(a), B = boxOf(b);
      const oxx = Math.min(A.right, B.right) - Math.max(A.left, B.left), oy = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
      if(oxx > -6 && oy > 0){ const lower = a.y >= b.y ? a : b, upper = lower === a ? b : a;
        if(lower.fixed && upper.fixed) continue;
        if(lower.fixed) upper.y -= oy + 2; else if(upper.fixed) lower.y += oy + 2;
        else { lower.y += oy / 2 + 1; upper.y -= oy / 2 + 1; }
        moved = true; } }
    if(!moved) break; }
  lblItems.forEach(l => { if(l.fixed) return;
    l.y = clamp(l.y, 16, H - 52);
    const dy = Math.abs(l.y - l.ey);
    const leader = dy > 7 ? `<line class="sk-leader" x1="${l.ex.toFixed(1)}" y1="${l.ey.toFixed(1)}" x2="${(l.anchor === 'start' ? l.x - 2 : l.x + 2).toFixed(1)}" y2="${l.y.toFixed(1)}"/>` : '';
    labelsBySkill[l.id] = `${leader}<text class="sk-lbl" x="${l.x.toFixed(1)}" y="${(l.y-3).toFixed(1)}" text-anchor="${l.anchor}" style="font-size:${l.fs}px">${esc(l.name)}</text><text class="sk-sublbl" x="${l.x.toFixed(1)}" y="${(l.y+9).toFixed(1)}" text-anchor="${l.anchor}">${esc(l.sub)}</text>`;
  });
  const labelLayer = Object.keys(labelsBySkill).map(id =>
    `<g class="sk-lblfor" data-for="${id}">${labelsBySkill[id]}</g>`).join('');

  const defs = `<defs>${sakDefs()}<linearGradient id="skTrunk" gradientUnits="userSpaceOnUse" x1="0" y1="${ground}" x2="0" y2="${(ground*.12).toFixed(0)}"><stop offset="0" stop-color="#4a392f"/><stop offset=".55" stop-color="#66513f"/><stop offset="1" stop-color="#7f6957"/></linearGradient><radialGradient id="skSun"><stop offset="0" stop-color="var(--page-accent)" stop-opacity=".22"/><stop offset="1" stop-color="var(--page-accent)" stop-opacity="0"/></radialGradient><radialGradient id="skMoon"><stop offset="0" stop-color="#e8e0d4" stop-opacity=".16"/><stop offset="1" stop-color="#e8e0d4" stop-opacity="0"/></radialGradient><radialGradient id="skGround"><stop offset="0" stop-color="#3a3128" stop-opacity=".55"/><stop offset="1" stop-color="#3a3128" stop-opacity="0"/></radialGradient>${masks.join('')}<mask id="skmScaff" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">${spurCentres.join('')}</mask></defs>`;
  return `<svg class="sk-organic" viewBox="0 0 ${W} ${H}" style="filter:hue-rotate(${season}deg)">${defs}${g}${labels}<g class="sk-lbls">${labelLayer}</g></svg>`;
}
function drawOrganicTree(root){
  const wrap = $('#skillWrap'); if(!wrap) return; wrap.querySelector('svg')?.remove(); const mm = $('#minimap'); if(mm) mm.hidden = true; const hint = wrap.querySelector('.sk-hint'); if(hint) hint.textContent = 'a cherry in flower · the blossom opens as the skill grows, bud to full bloom · a pair of cherries is mastery · a flower breathing means a milestone is near · bronze leaves are withering';
  const W = Math.max(wrap.clientWidth, 600), H = wrap.clientHeight || 640; const svg = el(organicSVG(W, H)); wrap.insertBefore(svg, wrap.firstChild);
  /* with nothing planted, the one thing to do is right under the seed */
  wrap.querySelector('.sk-plant')?.remove();
  if(!S.skills.length){
    const btn = el(`<button class="btn primary sk-plant">+ Add skill</button>`);
    btn.onclick = () => EntryActions.newSkill(); wrap.appendChild(btn);
  }
  /* the tree arrives by growing, then keeps moving — see 04-foliage.js */
  growTree(svg); startSway(svg);
  if(!wrap.querySelector('.tree-motes')) wrap.insertAdjacentHTML('beforeend', motesHTML(11, 'skill-motes'));
  const chain = id => { const out = new Set(); let cur = svg.querySelector(`.sk-twig[data-skill="${id}"]`); while(cur){ out.add(cur.dataset.skill); const p = cur.dataset.parent; cur = p && !p.startsWith('cat:') ? svg.querySelector(`.sk-twig[data-skill="${p}"]`) : null; if(p && p.startsWith('cat:')) out.add(p); } return out; };
  svg.querySelectorAll('.sk-twig').forEach(t => {
    t.addEventListener('mouseenter', () => { const ids = chain(t.dataset.skill); svg.classList.add('hov'); svg.querySelectorAll('.sk-twig,.sk-branch,.sk-lblfor').forEach(x => x.classList.toggle('hot', ids.has(x.dataset.skill || x.dataset.node || x.dataset.for))); });
    t.addEventListener('mouseleave', () => { svg.classList.remove('hov'); svg.querySelectorAll('.hot').forEach(x => x.classList.remove('hot')); });
    t.addEventListener('click', () => { if(t.classList.contains('locked')){ toast('Locked — raise its prerequisite to level 2 first.'); return; } skillSelected = t.dataset.skill; openSkillPanel(t.dataset.skill); });
  });
  svg.querySelectorAll('.sk-branch').forEach(b => b.addEventListener('click', () => { const cat = b.dataset.node.slice(4); const first = S.skills.find(s => s.cat===cat); if(first) openSkillPanel(first.id); }));
  root._skView = { reset: () => drawOrganicTree(root), burst: (id) => { const t = svg.querySelector(`.sk-twig[data-skill="${id}"]`); if(!t) return; const pt = svg.createSVGPoint(); pt.x = +t.dataset.x; pt.y = +t.dataset.y; const sp = pt.matrixTransform(svg.getScreenCTM()); levelUpBurst(sp.x, sp.y, catColor(byId(S.skills,id)?.cat)); } };
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
    const touched = S.entries.filter(e => (e.links?.skills||[]).includes(sk.id)); const rl = snapshotLinks(touched); touched.forEach(e => e.links.skills = e.links.skills.filter(y => y !== sk.id));
    const habits = S.habits.filter(h => (h.links?.skills||[]).includes(sk.id)); habits.forEach(h => h.links.skills = h.links.skills.filter(y => y !== sk.id));
    const back = spliceOut(S.skills, x => x.id === sk.id);
    return () => { back(); pre.forEach(x => x.prereqs.push(sk.id)); rl(); habits.forEach(h => h.links.skills.push(sk.id)); };
  }});
}
function openSkillPanel(id){
  const s = byId(S.skills,id); if(!s) return; const es = sortEntries(entriesLinked('skills',s.id)); const st = skillStreak(s); const last = skillLastPracticed(s); const since = daysSince(last);
  const values = {}; es.forEach(e=>(e.links.values||[]).forEach(x=>values[x.id]=(values[x.id]||0)+1));
  const arche = s.planned ? 'A bud. Nothing to judge yet.' : since>90 ? 'The Dabbler? Enthusiasm, then a plateau, then silence. Or perhaps a deliberate surrender — some competencies are meant to be let go.' : st.best>=14 && st.cur===0 ? 'The Obsessive? A long hard streak, then a break. Watch for burnout; oscillation is the rhythm, not a failure.' : s.currentLevel>=3 && !skillTargetLevel(s) && s.currentLevel < skillLevelCount(s) ? 'The Hacker? Good enough, and stopped. Is this the level you chose, or the one you settled for?' : 'On the path. Loving the plateau. The master stays on the mat five minutes longer.';
  const p = openPanel(`${vmToggleHTML('skill')}<div class="mono row between"><span>${esc(s.cat)} · ${s.planned ? 'planned'
      : skillAbilities(s).length
        /* a bundle is read by its parts, so the header says the roll-up rather
           than a level the skill no longer really has on its own */
        ? `${skillAbilities(s).length} abilities · ${Math.round(skillProgress(s)*100)}%`
        : 'level '+s.currentLevel+' of '+skillLevelCount(s)}</span><span class="wv-badge"></span></div><h2>${ed(`skills.#${s.id}.name`)}</h2>
    <div class="row" style="margin:8px 0 10px;gap:8px;flex-wrap:wrap">
      <select class="sel" style="width:auto" id="skCatSel">${skillCatOptions(s.cat).map(c=>`<option ${s.cat===c?'selected':''}>${c}</option>`).join('')}</select>
      <select class="sel" style="width:auto" id="skHzSel" title="how near this skill is">${Object.entries(SKILL_HORIZONS).map(([k,v])=>`<option value="${k}" ${skillHorizon(s)===k?'selected':''}>${v[0]} ${v[1]}</option>`).join('')}</select>
      <select class="sel" style="width:auto" id="skPrioSel" title="priority">${Object.keys(SKILL_PRIOS).map(pp=>`<option ${(s.priority||'P3')===pp?'selected':''}>${pp}</option>`).join('')}</select>
    </div>
    <div class="faint" style="font-size:.78rem;margin-bottom:10px">${esc(SKILL_HORIZONS[skillHorizon(s)][2])}</div>
    <div class="field" style="margin-bottom:14px"><label>Why this one?</label>${ed(`skills.#${s.id}.why`,{ph:'One line, for the day you have forgotten.'})}</div>
    ${['someday','next'].includes(skillHorizon(s))?`<div class="field" style="margin-bottom:14px"><label>Start by</label>${ed(`skills.#${s.id}.startBy`,{ph:'YYYY-MM-DD',cls:'mono',date:true})}</div>`:''}
    <div class="grid c3" style="gap:10px"><div class="card" style="padding:12px 14px"><div class="mono">last practiced</div><div class="serif" style="font-size:1.2rem">${relDays(since)}</div></div><div class="card" style="padding:12px 14px"><div class="mono">streak</div><div class="serif" style="font-size:1.2rem">${st.cur}d <span class="faint" style="font-size:.8rem">best ${st.best}</span></div></div><div class="card" style="padding:12px 14px"><div class="mono">total hours</div><div class="serif" style="font-size:1.2rem" data-tween="${skillHours(s)}" data-dec="1">0</div></div></div>
    <div class="archetype">${arche}</div>
    ${levelTrackHTML(s)}
    ${abilitiesHTML(s)}
    ${milestoneTimelineHTML(s)}
    <div class="vp-sec"><div class="row between" style="align-items:center"><span class="sc">What this looks like</span>${imageAddHTML('skill', s.id)}</div>
      ${imageStripHTML('skill', s.id) || '<p class="faint" style="font-size:.8rem;margin:6px 0 0">Add an image and this skill\'s card is printed on it.</p>'}</div>
    <div class="vp-sec"><span class="sc">Prerequisites</span><div class="deps">${S.skills.filter(x=>x.id!==s.id).map(x=>`<span class="chip click ${s.prereqs.includes(x.id)?'on':''}" style="--c:${catColor(x.cat)}" data-pre="${x.id}">${esc(x.name)}</span>`).join('')}</div></div>
    <div class="vp-sec"><span class="sc">Cross-mappings</span>
      <div class="k mono" style="margin:10px 0 4px">linked projects — am I practising what I claim to build? click to link</div><div class="deps">${S.projects.map(pr=>`<span class="chip click ${(pr.linkedSkills||[]).includes(s.id)?'on':''}" style="--c:var(--terra)" data-skproj="${pr.id}">🎨 ${esc(pr.name)}</span>`).join('')||'<span class="faint">no projects yet</span>'}</div>
      <div class="k mono" style="margin:10px 0 4px">serves values</div><div class="deps">${Object.entries(values).map(([id,n])=>{ const v=byId(S.values,id); return v?`<span class="chip on click" style="--c:${v.color}" data-go="#/value/${id}">${esc(v.name)} · ${n}</span>`:''; }).join('')||'<span class="faint">tag values on progress entries</span>'}</div></div>
    <div class="vp-sec"><div class="row between"><span class="sc">Progress log</span><button class="btn sm" id="skLog">+ practice</button></div>${es.map(e=>entryCard(e)).join('')||'<div class="empty">No practice logged yet.</div>'}</div>
    ${typeof planLinkedTasksHTML === 'function' ? planLinkedTasksHTML('skills', s.id, {heading:'Tasks in Planning'}) : ''}
    ${moreSection(`<div class="danger-zone"><span>Skills accrue slowly. Consider marking it planned or lowering the level before deleting.</span><button class="btn sm ghost danger" id="skDel">Delete this skill</button></div>`)}`);
  $$('#panel .rv').forEach(n=>n.classList.add('in'));
  bindVmToggle(p, 'skill');
  p.querySelector('#skCatSel').onchange = e => { s.cat = e.target.value; saveNow(); reopenPanel(() => { rerender(); openSkillPanel(id); }); };
  bindRecImages(p, () => openSkillPanel(s.id));
  p.querySelector('#skHzSel').onchange = e => { s.horizon = e.target.value; s.planned = s.horizon === 'someday'; if(!s.planned && s.currentLevel===0) s.currentLevel = 1; saveNow(); reopenPanel(() => { rerender(); openSkillPanel(id); }); };
  p.querySelector('#skPrioSel').onchange = e => { s.priority = e.target.value; saveNow(); reopenPanel(() => { rerender(); openSkillPanel(id); }); };
  bindLevelTrack(p, s);
  bindAbilities(p, s, () => reopenPanel(() => { rerender(); openSkillPanel(id); }));
  bindMilestones(p, s);
  p.querySelectorAll('[data-pre]').forEach(c => c.onclick = () => { const x = c.dataset.pre; s.prereqs = s.prereqs.includes(x) ? s.prereqs.filter(y=>y!==x) : [...s.prereqs,x]; saveNow(); c.classList.toggle('on'); rerender(); });
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
          <div class="k mono" style="margin-top:10px">criteria — observable behaviours${(() => { const m = l.criteria.filter(c => c.done).length;
            return l.criteria.length ? ` <span class="crit-count">${m}/${l.criteria.length} met</span>` : ''; })()}</div><ul class="lvl-criteria">${l.criteria.map((c,ci)=>`<li class="${c.done?'met':''}">
            <button class="task-check sm" data-crittick="${i}:${c.id}" role="checkbox" aria-checked="${!!c.done}" title="${c.done?'not met yet':'mark this one met'}">${c.done?'✓':''}</button>
            ${ed(`skills.#${s.id}.levels.${i}.criteria.${ci}.text`,{ph:'something I can be seen doing'})}<button class="del-x inline" data-critdel="${i}:${c.id}" title="remove">×</button></li>`).join('')}</ul><button class="tbtn" data-critadd="${i}">+ criterion</button>
          <div class="k mono" style="margin-top:10px">resources</div><div class="lvl-res">${l.resources.map((r,ri)=>{ let host=''; try { host = new URL(r.url).hostname; } catch(e){} return `<div class="res-row"><span class="res-type" title="${esc(r.type)}">${RES_ICON[r.type]||'▫'}</span>${r.url?`<a class="res-link" href="${esc(r.url)}" target="_blank" rel="noopener">${host?`<img class="res-fav" src="https://www.google.com/s2/favicons?domain=${esc(host)}&sz=16" alt="" onerror="this.style.display='none'">`:''}${esc(r.title||r.url)}</a>`:`<span>${esc(r.title||'untitled resource')}</span>`}<span class="status-pill" style="font-size:.6rem">${esc(r.type)}</span><span class="res-edit"><span class="ed-wrap">${ed(`skills.#${s.id}.levels.${i}.resources.${ri}.title`,{ph:'title',cls:'mono'})}</span><span class="ed-wrap">${ed(`skills.#${s.id}.levels.${i}.resources.${ri}.url`,{ph:'https://…',cls:'mono'})}</span><select class="sel" data-restype="${i}:${ri}" style="width:auto;padding:1px 6px;font-size:.66rem;padding-right:22px">${RESOURCE_TYPES.map(t=>`<option ${r.type===t?'selected':''}>${t}</option>`).join('')}</select><button class="del-x inline" data-resdel="${i}:${ri}" title="remove">×</button></span></div>`; }).join('')}</div><button class="tbtn" data-resadd="${i}">+ resource</button>
          <div class="row" style="gap:16px;margin-top:10px;flex-wrap:wrap"><span><span class="k mono">estimated time</span> ${ed(`skills.#${s.id}.levels.${i}.estimatedTime`,{ph:'e.g. 3 months',cls:'mono'})}</span><span><span class="k mono">target date</span> ${ed(`skills.#${s.id}.levels.${i}.targetDate`,{ph:'YYYY-MM-DD',cls:'mono',date:true,hook:'lvldate:'+s.id+':'+i})}</span><button class="tbtn" data-lvldel="${i}" style="margin-left:auto;color:var(--faint)">remove level</button></div>
        </div></div>
      </div></div>`; }).join('')}
      <button class="btn sm ghost" id="lvlAdd" style="margin:8px 0 0 44px">＋ Add level</button>
    </div></div>`;
}
/* ============================================================
   ABILITIES — a skill is a bundle, and the parts move separately
   ------------------------------------------------------------
   One level for a whole skill has to average its parts together, and the
   average is the thing you least wanted to know: "Japanese, level 3" hides
   that the reading is level 5 and the speaking is level 1. So a skill can be
   broken into named abilities, each with a rubric of its own, and the skill's
   own reading becomes their mean — with the weakest one named out loud,
   because that is the one the next hour should go to.

   Nothing is created until the first ability is named. A skill left whole
   behaves exactly as it did.
   ============================================================ */
function abilitiesHTML(s){
  const abs = skillAbilities(s).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const color = catColor(s.cat);
  const openAb = S._openAbility?.[s.id];
  const weak = weakestAbility(s);
  return `<div class="vp-sec"><div class="row between" style="align-items:baseline">
      <span class="sc">Abilities${abs.length ? ` — ${abs.length}` : ''}</span>
      ${abs.length ? `<span class="mono">${Math.round(skillProgress(s) * 100)}% across them</span>` : ''}</div>
    ${abs.length
      ? `<p class="faint" style="font-size:.78rem;margin:4px 0 10px">The skill's own reading is the average of these.${
          weak ? ` The furthest behind is <b>${esc(weak.name)}</b> — which is where the next hour is worth most.` : ''}</p>`
      : `<p class="faint" style="font-size:.8rem;margin:4px 0 10px">A skill is often several abilities that do not move together — reading and speaking, technique and repertoire, drafting and editing. Name them and each gets a rubric of its own.</p>`}
    <div class="ab-list" id="abList" style="--c:${color}">${abs.map(a => {
      const n = abilityLevelCount(a), cur = a.currentLevel || 0, open = openAb === a.id;
      return `<div class="ab${open ? ' open' : ''}${weak && weak.id === a.id && abs.length > 1 ? ' weakest' : ''}" data-ab="${esc(a.id)}">
        <div class="ab-head" data-abexpand="${esc(a.id)}">
          <span class="ab-name">${ed(`skills.#${s.id}.abilities.#${a.id}.name`, {ph:'name this ability'})}</span>
          <span class="ab-dots" title="level ${cur} of ${n}">${Array.from({length:n}, (_, i) =>
            `<button class="ab-dot${i < cur ? ' on' : ''}" data-abset="${esc(a.id)}:${i + 1}"
              title="${esc(a.levels[i]?.label || 'level ' + (i + 1))}"></button>`).join('')}</span>
          <span class="mono ab-meta">${cur} / ${n}</span>
          <span class="lvl-chev">›</span>
        </div>
        <div class="ab-detail"><div class="ab-detail-inner">
          <div class="field"><label>What is this one, exactly?</label>
            ${ed(`skills.#${s.id}.abilities.#${a.id}.note`, {ph:'one line, so it stays the same thing next month'})}</div>
          ${a.levels.map((l, li) => `<div class="ab-lvl${li + 1 === cur ? ' current' : li + 1 < cur ? ' done' : ''}">
            <div class="ab-lvl-head">
              <button class="ab-lvl-node" data-abset="${esc(a.id)}:${li + 1}"
                title="${li + 1 === cur ? 'current level' : 'set as current level'}">${li + 1 < cur ? '✓' : li + 1}</button>
              ${ed(`skills.#${s.id}.abilities.#${a.id}.levels.${li}.label`, {ph:'level name'})}
            </div>
            <div class="ab-lvl-body">
              ${ed(`skills.#${s.id}.abilities.#${a.id}.levels.${li}.description`, {multi:true, ph:'what you can do here'})}
              <ul class="lvl-criteria">${(l.criteria || []).map((c, ci) => `<li class="${c.done ? 'met' : ''}">
                <button class="task-check sm" data-abcrit="${esc(a.id)}:${li}:${esc(c.id)}" role="checkbox"
                  aria-checked="${!!c.done}" title="${c.done ? 'not met yet' : 'mark this one met'}">${c.done ? '✓' : ''}</button>
                ${ed(`skills.#${s.id}.abilities.#${a.id}.levels.${li}.criteria.${ci}.text`, {ph:'something I can be seen doing'})}
                <button class="del-x inline" data-abcritdel="${esc(a.id)}:${li}:${esc(c.id)}" title="remove">×</button></li>`).join('')}</ul>
              <button class="tbtn" data-abcritadd="${esc(a.id)}:${li}">+ criterion</button>
            </div></div>`).join('')}
          <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap">
            <button class="tbtn" data-ablvladd="${esc(a.id)}">＋ level</button>
            <button class="tbtn" data-abdel="${esc(a.id)}" style="margin-left:auto;color:var(--faint)">remove this ability</button>
          </div>
        </div></div>
      </div>`; }).join('')}</div>
    <button class="btn sm ghost" id="abAdd" style="margin-top:8px">＋ Break it into an ability</button>
  </div>`;
}
function bindAbilities(p, s, reopen){
  const abById = id => skillAbilities(s).find(a => a.id === id) || null;
  const openIt = id => { S._openAbility = {...(S._openAbility || {}), [s.id]: id}; };
  p.querySelector('#abAdd').onclick = () => {
    const a = newAbility('', 3); a.order = skillAbilities(s).length;
    skillAbilities(s).push(a); openIt(a.id); saveNow(); reopen();
    setTimeout(() => { const n = $(`#panel .ab[data-ab="${a.id}"] .ab-name .ed`); n && beginEdit(n); }, 60);
  };
  p.querySelectorAll('[data-abexpand]').forEach(h => h.onclick = ev => {
    if(ev.target.closest('.ed, .ab-dot, button')) return;
    const id = h.dataset.abexpand;
    openIt(S._openAbility?.[s.id] === id ? null : id); sound('click'); reopen();
  });
  /* Pressing the dot you are already on steps back one, so a level can be
     given up as easily as it was claimed. */
  p.querySelectorAll('[data-abset]').forEach(b => b.onclick = ev => {
    ev.stopPropagation();
    const [id, n] = b.dataset.abset.split(':');
    const a = abById(id); if(!a) return;
    a.currentLevel = a.currentLevel === +n ? +n - 1 : +n;
    saveNow(); sound(a.currentLevel >= +n ? 'success' : 'click'); rerender(); reopen();
  });
  p.querySelectorAll('[data-abcritadd]').forEach(b => b.onclick = () => {
    const [id, li] = b.dataset.abcritadd.split(':');
    const a = abById(id); if(!a) return;
    a.levels[+li].criteria.push({id:uid(), text:'', done:false, metAt:null});
    openIt(id); saveNow(); reopen();
    setTimeout(() => { const last = $$(`#panel .ab[data-ab="${id}"] .ab-lvl`)[+li]?.querySelectorAll('.lvl-criteria .ed');
      last && last.length && beginEdit(last[last.length - 1]); }, 60);
  });
  p.querySelectorAll('[data-abcrit]').forEach(b => b.onclick = () => {
    const [id, li, cid] = b.dataset.abcrit.split(':');
    const a = abById(id); if(!a) return;
    const c = (a.levels[+li].criteria || []).find(x => x.id === cid); if(!c) return;
    c.done = !c.done; c.metAt = c.done ? today() : null;
    saveNow(); sound(c.done ? 'success' : 'click'); reopen();
  });
  p.querySelectorAll('[data-abcritdel]').forEach(b => b.onclick = () => {
    const [id, li, cid] = b.dataset.abcritdel.split(':');
    const a = abById(id); if(!a) return;
    const arr = a.levels[+li].criteria;
    const c = arr.find(x => x.id === cid); if(!c) return;
    requestDelete({label: c.text || 'this criterion', node: b.closest('li'),
      remove: () => spliceOut(arr, x => x.id === cid), after: reopen});
  });
  p.querySelectorAll('[data-ablvladd]').forEach(b => b.onclick = () => {
    const a = abById(b.dataset.ablvladd); if(!a) return;
    const n = a.levels.length + 1;
    a.levels.push({number:n, label:LEVEL_LABELS[n - 1] || `Level ${n}`, description:'', criteria:[]});
    openIt(a.id); saveNow(); reopen();
  });
  p.querySelectorAll('[data-abdel]').forEach(b => b.onclick = () => {
    const a = abById(b.dataset.abdel); if(!a) return;
    requestDelete({label: a.name || 'this ability',
      remove: () => spliceOut(skillAbilities(s), x => x.id === a.id),
      after: () => { rerender(); reopen(); }});
  });
}
hooks.lvldate = (arg) => { const [sid, i] = arg.split(':'); const s = byId(S.skills, sid); if(!s) return; const l = s.levels[+i]; if(l && l.targetDate === '') l.targetDate = null; saveNow(); };
function bindLevelTrack(p, s){
  const id = s.id; const reopen = () => { reopenPanel(() => { rerender(); openSkillPanel(id); }); };
  p.querySelectorAll('[data-setlevel]').forEach(b => b.onclick = e => { e.stopPropagation(); const n = +b.dataset.setlevel; const up = n > s.currentLevel; s.currentLevel = n; s.planned = false; saveNow(); reopen(); if(up) setTimeout(() => $('#main')?._skView?.burst(id), 60); });
  p.querySelectorAll('[data-expand]').forEach(h => h.addEventListener('click', e => { if(e.target.closest('.ed')) return; const n = +h.dataset.expand; S._openLevel = S._openLevel||{}; S._openLevel[id] = S._openLevel[id]===n ? null : n; const row = h.closest('.lvl'); const wasOpen = row.classList.contains('open'); p.querySelectorAll('.lvl').forEach(x => x.classList.remove('open')); if(!wasOpen) row.classList.add('open'); }));
  p.querySelector('#lvlAdd').onclick = () => { const n = s.levels.length+1; s.levels.push({number:n, label:LEVEL_LABELS[n-1]||`Level ${n}`, description:'', criteria:[], resources:[], estimatedTime:'', targetDate:null}); S._openLevel = {...(S._openLevel||{}), [id]:n}; saveNow(); reopen(); };
  p.querySelectorAll('[data-lvldel]').forEach(b => b.onclick = () => { if(s.levels.length <= 1){ toast('A skill needs at least one level.'); return; } const i = +b.dataset.lvldel; const lv = s.levels[i]; requestDelete({label:`Level ${i+1} · ${lv.label}`, remove: () => { const oldCur = s.currentLevel; const back = spliceOut(s.levels, x => x === lv); s.levels.forEach((l,k)=>l.number=k+1); if(s.currentLevel > s.levels.length) s.currentLevel = s.levels.length; (s.milestones||[]).forEach(m => { if(m.levelTarget > s.levels.length) m.levelTarget = s.levels.length; }); return () => { back(); s.levels.forEach((l,k)=>l.number=k+1); s.currentLevel = oldCur; }; }, after: reopen}); });
  p.querySelectorAll('[data-critadd]').forEach(b => b.onclick = () => { const i = +b.dataset.critadd; s.levels[i].criteria.push({id:uid(), text:'', done:false, metAt:null}); S._openLevel = {...(S._openLevel||{}), [id]:i+1}; saveNow(); reopen(); setTimeout(()=>{ const last = $$(`#panel .lvl[data-level="${i+1}"] .lvl-criteria .ed`).slice(-1)[0]; last && beginEdit(last); },60); });
  /* addressed by id rather than by index: an inline edit can redraw the list
     between the click being bound and the click arriving */
  p.querySelectorAll('[data-critdel]').forEach(b => b.onclick = () => { const [i, cid] = b.dataset.critdel.split(':'); const arr = s.levels[+i].criteria; const c = arr.find(x => x.id === cid); if(!c) return; requestDelete({label: c.text || 'this criterion', node: b.closest('li'), remove: () => spliceOut(arr, x => x.id === cid), after: reopen}); });
  p.querySelectorAll('[data-crittick]').forEach(b => b.onclick = () => { const [i, cid] = b.dataset.crittick.split(':'); const c = s.levels[+i].criteria.find(x => x.id === cid); if(!c) return;
    c.done = !c.done; c.metAt = c.done ? new Date().toISOString() : null; saveNow(); sound(c.done ? 'success' : 'click'); reopen(); });
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
    axis = `<div class="ms-axis" style="--c:${color}"><div class="ms-axis-rule"></div><div class="ms-now" style="left:${X(T).toFixed(1)}%" title="today"><i></i><span>now</span></div>${dated.map((m,i)=>{ const d = daysBetween(T, m.by.slice(0,10)); const reached = s.currentLevel >= m.levelTarget; return `<div class="ms-mark ${reached?'reached':d<0?'due':'ahead'}" style="left:${X(m.by).toFixed(1)}%" title="${esc(m.note||'')}"><i></i><span class="ms-lbl">L${m.levelTarget}${reached?' ✓':d<0?' ⚠':''}<br><span class="mono">${fmtDate(m.by,'short')} ${m.by.slice(0,4)}</span></span></div>`; }).join('')}</div>`; }
  return `<div class="vp-sec"><div class="row between"><span class="sc">Milestones — ${ms.length||'no'} target${ms.length===1?'':'s'}</span><button class="btn sm ghost" id="msAdd">+ milestone</button></div>
    ${axis || '<div class="faint" style="font-size:.8rem;padding:4px 0">Set a level and a date. They appear as markers here, as chips on the tree, and on Today when they are close.</div>'}
    <div class="ms-list">${ms.map(m => { const idx = (s.milestones||[]).indexOf(m); const d = m.by ? daysBetween(T, m.by.slice(0,10)) : null; const reached = s.currentLevel >= m.levelTarget; const badge = reached ? '<span class="status-pill" style="color:var(--sage)">reached</span>' : d===null ? '<span class="status-pill">no date</span>' : d<0 ? `<span class="status-pill due">⚠ ${-d}d overdue</span>` : `<span class="status-pill ahead">in ${d}d</span>`;
      return `<div class="ms-row"><select class="sel" data-mslevel="${idx}" style="width:auto;padding:2px 6px;font-size:.7rem;padding-right:22px">${s.levels.map((l,li)=>`<option value="${li+1}" ${m.levelTarget===li+1?'selected':''}>L${li+1} · ${esc(l.label)}</option>`).join('')}</select><input type="date" class="inp" value="${m.by?m.by.slice(0,10):''}" data-msdate="${idx}" style="width:auto;padding:2px 6px;font-size:.7rem"><span class="ms-note">${ed(`skills.#${s.id}.milestones.${idx}.note`,{ph:'why this date?'})}</span>${badge}<button class="del-x inline" data-msdel="${idx}" title="remove">×</button></div>`; }).join('')}</div></div>`;
}
function bindMilestones(p, s){
  const id = s.id; const reopen = () => { reopenPanel(() => { rerender(); openSkillPanel(id); }); };
  p.querySelector('#msAdd').onclick = () => { s.milestones = s.milestones||[]; s.milestones.push({levelTarget: Math.min(s.currentLevel+1, skillLevelCount(s)), by: addDays(today(), 90), note:''}); saveNow(); reopen(); };
  p.querySelectorAll('[data-mslevel]').forEach(sel => sel.onchange = () => { s.milestones[+sel.dataset.mslevel].levelTarget = +sel.value; saveNow(); reopen(); });
  p.querySelectorAll('[data-msdate]').forEach(inp => inp.onchange = () => { s.milestones[+inp.dataset.msdate].by = inp.value || null; saveNow(); reopen(); });
  p.querySelectorAll('[data-msdel]').forEach(b => b.onclick = () => { const m = s.milestones[+b.dataset.msdel]; requestDelete({label:`Milestone L${m.levelTarget}${m.by?' · '+fmtMonth(m.by):''}`, remove: () => spliceOut(s.milestones, x => x === m), after: reopen}); });
}
