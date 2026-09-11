/* ============================================================
   PEOPLE — a relationship garden, not a CRM.
   The point is not to manage anyone. It is to remember what
   they told you, notice when you have drifted, and be
   deliberate about the handful of people a life is made of.
   ============================================================ */
/* the ones every list needs; anything else you name yourself and it stays named */
const RELATIONSHIPS_BUILT_IN = ['partner','family','close friend','friend','colleague','mentor','mentee','acquaintance','other'];
function relationships(){
  const own = Array.isArray(S.settings?.relationships) ? S.settings.relationships : [];
  const used = (S.people || []).map(p => p.relationship).filter(Boolean);
  return [...new Set([...RELATIONSHIPS_BUILT_IN, ...own, ...used])];
}
function addRelationship(name){
  const v = String(name || '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 40);
  if(!v) return null;
  if(!relationships().includes(v)){ S.settings.relationships = [...(S.settings.relationships || []), v]; saveNow(); }
  return v;
}
/* a <select> of relationships with a way out of the list at the bottom */
function relSelect(id, current, extra=''){
  const list = relationships();
  return `<select class="sel" id="${id}" ${extra}>${list.map(r=>`<option ${current===r?'selected':''}>${esc(r)}</option>`).join('')}<option value="__new" style="font-style:italic">＋ name another…</option></select>`;
}
/* wire one up: picking "name another" asks, adds it, and selects it */
function bindRelSelect(sel, onPick){
  if(!sel) return;
  let last = sel.value;
  sel.onchange = () => {
    if(sel.value === '__new'){
      const v = addRelationship(prompt('What do you call this relationship?', ''));
      if(!v){ sel.value = last; return; }
      sel.insertBefore(el(`<option selected>${esc(v)}</option>`), sel.querySelector('[value="__new"]'));
      sel.value = v;
    }
    last = sel.value; onPick && onPick(sel.value);
  };
}
/* five rings, innermost to outermost — placement itself is a reflective act */
const CIRCLES = {
  core:  ['◉','Core',   'the 3–5 people most central to your life right now', 5,  '#c25b5b'],
  close: ['○','Close',  'you see or talk to regularly — they know the real you', 15, '#d4a44c'],
  warm:  ['◐','Warm',   'friendships with long gaps that pick up instantly',    30, '#7f916a'],
  orbit: ['·','Orbit',  'acquaintances, colleagues, distant family — present, not intimate', 80, '#6b7f8e'],
  aspirational: ['◌','Aspirational', "not yet met — mentors, partners, the people your visions require", null, '#8a7f9e'],
};
const PERSON_STATUS = {
  active:    ['●','Active',     '#7f916a'],
  dormant:   ['◐','Dormant',    '#8a8d8f'],
  lost:      ['○','Lost',       '#6b7f8e'],
  estranged: ['✕','Estranged',  '#a0727e'],
  deceased:  ['✝','Deceased',   '#8a7f9e'],
  notyetmet: ['◌','Not yet met','#d4a44c'],
};
const QUALITY_TAGS = ['Deep conversation','Fun / play','Support given','Support received','Conflict','Routine','Milestone','Repair'];
const ENERGY_READINGS = {energized:['⚡','Energized','#7f916a'], neutral:['·','Neutral','#8a8d8f'], drained:['◔','Drained','#a0727e']};
const FREQUENCIES = {weekly:7, biweekly:14, monthly:30, quarterly:91, yearly:365};
const INTERACTION_TYPES = {
  met_in_person:['◍','Met in person'], call:['☎','Call'], video_call:['▣','Video call'],
  text:['✎','Message'], email:['✉','Email'], social_media:['◎','Social'], other:['·','Other'],
};
function newPerson(name = ''){
  return {id:uid(), name, nickname:'', photo:null, relationship:'friend', circle:'orbit', status:'active', tags:[], birthday:null,
    stagesPresent:[], threadsLinked:[], valuesEmbodied:[], energyStanding:'',
    installed:'', becomeAround:'', gift:[], wound:[], ringHistory:[],
    contactInfo:{phone:'', email:'', social:[]},
    details:{interests:[], importantDates:[], notes:'', lifeUpdates:''},
    giftIdeas:[], giftsLog:[],
    lastInteraction:null, desiredFrequency:null, createdAt:new Date().toISOString()};
}
const CIRCLE_RENAME = {inner:'core', middle:'close', outer:'orbit'};
function migratePeople(){
  if(!Array.isArray(S.people)) S.people = [];
  S.interactions = Array.isArray(S.interactions) ? S.interactions : [];
  /* Normalise IN PLACE. This runs on every render of the People room, so
     replacing the array (or the person objects in it) would invalidate every
     reference held elsewhere — including the closure a pending Undo uses to
     put a deleted person back, which would then splice into a dead array. */
  S.people.forEach((orig, idx) => {
    let p = orig;
    if(typeof p === 'string' || !p || !p.id) p = Object.assign(newPerson(typeof p === 'string' ? p : (p?.name || '')), {});
    const out = Object.assign(newPerson(p.name || ''), p);
    // the earlier tier model becomes a circle; "past" people go to the outer ring with no cadence
    if(p.tier) out.circle = {inner:'core', close:'close', orbit:'orbit', past:'orbit'}[p.tier] || 'orbit';
    if(CIRCLE_RENAME[out.circle]) out.circle = CIRCLE_RENAME[out.circle];
    if(!CIRCLES[out.circle]) out.circle = 'orbit';
    if(p.tier === 'past' && !out.desiredFrequency) out.desiredFrequency = null;
    if(!out.status || !PERSON_STATUS[out.status]) out.status = out.circle === 'aspirational' ? 'notyetmet' : 'active';
    if(!out.relationship) out.relationship = p.relation || 'friend';
    out.details = Object.assign({interests:[], importantDates:[], notes:'', lifeUpdates:''}, out.details || {});
    if(p.met && !out.details.notes) out.details.notes = `How we met. ${p.met}`;
    if(p.gave) out.details.lifeUpdates = [out.details.lifeUpdates, `What they gave me. ${p.gave}`].filter(Boolean).join('\n\n');
    if(p.owe) out.details.notes = [out.details.notes, `What I owe them. ${p.owe}`].filter(Boolean).join('\n\n');
    if(p.notes) out.details.notes = [out.details.notes, p.notes].filter(Boolean).join('\n\n');

    out.contactInfo = Object.assign({phone:'', email:'', social:[]}, out.contactInfo || {});
    out.tags = normTags((out.tags && out.tags.length) ? out.tags : (p.aka || []));
    out.stagesPresent = Array.isArray(out.stagesPresent) ? out.stagesPresent : [];
    out.threadsLinked = Array.isArray(out.threadsLinked) ? out.threadsLinked : [];
    out.valuesEmbodied = Array.isArray(out.valuesEmbodied) ? out.valuesEmbodied : [];
    out.gift = Array.isArray(out.gift) ? out.gift : [];
    out.wound = Array.isArray(out.wound) ? out.wound : [];
    out.giftIdeas = Array.isArray(out.giftIdeas) ? out.giftIdeas : [];
    out.giftsLog = Array.isArray(out.giftsLog) ? out.giftsLog : [];
    out.ringHistory = Array.isArray(out.ringHistory) ? out.ringHistory : [];
    if(out.installed === undefined) out.installed = '';
    if(out.becomeAround === undefined) out.becomeAround = '';
    if(out.energyStanding === undefined) out.energyStanding = '';
    delete out.tier; delete out.relation; delete out.met; delete out.gave; delete out.owe; delete out.notes; delete out.aka;
    if(p === orig && orig && typeof orig === 'object'){
      Object.assign(orig, out);
      ['tier','relation','met','gave','owe','notes','aka'].forEach(k => { delete orig[k]; });
    } else S.people[idx] = out;
  });
  for(let i = S.people.length - 1; i >= 0; i--) if(!S.people[i].name && !S.people[i].id) S.people.splice(i, 1);
  // entries that mention a person count as a light interaction
  S.entries.forEach(e => {
    e.links = e.links || {}; e.links.people = Array.isArray(e.links.people) ? e.links.people : [];
    (e.people || []).forEach(n => {
      const nm = String(n).trim(); if(!nm) return;
      let p = S.people.find(x => x.name.toLowerCase() === nm.toLowerCase());
      if(!p){ p = newPerson(nm); S.people.push(p); }
      if(!e.links.people.includes(p.id)) e.links.people.push(p.id);
    });
    (e.links.people || []).forEach(pid => {
      const when = (e.occurredAt || e.createdAt || '').slice(0,10);
      if(!when) return;
      if(S.interactions.some(i => i.entryId === e.id && i.personId === pid)) return;
      S.interactions.push({id:uid(), personId:pid, date:when, type:'other', description:e.title || (e.body||'').slice(0,120),
        mood:null, energy:'', quality:'', followUp:null, followUpDone:false, entryId:e.id});
    });
  });
  S.interactions.forEach(i => { if(i.energy === undefined) i.energy = ''; if(i.quality === undefined) i.quality = ''; });
  S.people.forEach(p => p.lastInteraction = lastInteractionDate(p.id));
}
function personInteractions(id){ return S.interactions.filter(i => i.personId === id).sort((a,b) => b.date.localeCompare(a.date)); }
function lastInteractionDate(id){ const l = personInteractions(id); return l.length ? l[0].date : null; }
function personOverdue(p){
  const f = p.desiredFrequency ? FREQUENCIES[p.desiredFrequency] : null; if(!f) return null;
  const last = p.lastInteraction || lastInteractionDate(p.id);
  const d = last ? daysSince(last) : Infinity;
  return d > f ? {days:d, want:p.desiredFrequency, limit:f} : null;
}
function peopleNeedingAttention(){ return S.people.map(p => { const o = personOverdue(p); return o ? {p, days:o.days, want:o.want} : null; }).filter(Boolean).sort((a,b) => b.days - a.days); }
function birthdaysSoon(within = 30){
  const T = today(); const yr = parseDay(T).getFullYear();
  return S.people.filter(p => p.birthday).map(p => {
    const md = (p.birthday.match(/(\d{2})-(\d{2})$/) || []).slice(1); if(md.length < 2) return null;
    let next = `${yr}-${md[0]}-${md[1]}`; if(next < T) next = `${yr+1}-${md[0]}-${md[1]}`;
    const days = daysBetween(T, next); return days <= within ? {p, next, days} : null;
  }).filter(Boolean).sort((a,b) => a.days - b.days);
}
function importantDatesSoon(within = 30){
  const T = today(); const yr = parseDay(T).getFullYear(); const out = [];
  S.people.forEach(p => (p.details?.importantDates||[]).forEach(d => { if(!d.date) return;
    const md = (d.date.match(/(\d{2})-(\d{2})$/) || []).slice(1); if(md.length < 2) return;
    let next = `${yr}-${md[0]}-${md[1]}`; if(next < T) next = `${yr+1}-${md[0]}-${md[1]}`;
    const days = daysBetween(T, next); if(days <= within) out.push({p, label:d.label||'important date', next, days}); }));
  return out.sort((a,b)=>a.days-b.days);
}
function openFollowUps(){ return S.interactions.filter(i => i.followUp && !i.followUpDone).map(i => ({i, p:byId(S.people, i.personId)})).filter(x => x.p); }
function personInitials(p){ return (p.name||'?').trim().split(/\s+/).slice(0,2).map(w => w[0]).join('').toUpperCase(); }
function personChip(id){ const p = byId(S.people, id); if(!p) return ''; const c = CIRCLES[p.circle];
  return `<a class="chip on click" style="--c:${c[4]};text-decoration:none" href="#/people/${p.id}">${c[0]} ${esc(p.name)}</a>`; }
function personEntryCount(id){ return S.entries.filter(e=>(e.links?.people||[]).includes(id)).length + personInteractions(id).length; }
function personNodeColor(p){
  if((p.stagesPresent||[]).length){ const s = byId(S.stages, p.stagesPresent[0]); if(s) return s.hue; }
  if((p.threadsLinked||[]).length){ const t = byId(S.threads, p.threadsLinked[0]); if(t) return t.color; }
  return CIRCLES[p.circle][4];
}
function recentInteractions(id, days=90){ return personInteractions(id).filter(i => daysSince(i.date) <= days); }
function energyBalanceScore(id, days=90){ const ints = recentInteractions(id, days).filter(i=>i.energy); if(!ints.length) return null;
  const s = ints.map(i => ({energized:1, neutral:0, drained:-1}[i.energy] ?? 0)); return avg(s); }

routes.people = function(root, params){
  migratePeople();
  registerPageEntry({pageName:'People', addLabel:'Add someone', defaultEntryType:'person', prefilledFields:{}, options:[
    {icon:'☺', label:'Add someone', desc:'Someone your attention keeps going to.', run:()=>openPersonModal()},
    {icon:'◍', label:'Log an interaction', desc:'You saw them, called them, wrote to them.', run:()=>openInteractionModal()}]});
  if(params[0]) return renderPersonPage(root, params[0]);
  const view = S._pplView || 'circles';
  const overdue = peopleNeedingAttention(); const bdays = birthdaysSoon(30); const follow = openFollowUps();
  root.innerHTML = `<div class="page">
    <div class="page-head row between"><div><h1>People</h1></div>
      <div class="view-toggle">${[['circles','◎ Circles'],['list','▤ List'],['log','◷ Log'],['eras','▬ Life stages'],['audit','◈ Audit']].map(([k,l])=>`<button class="${view===k?'on':''}" data-pplview="${k}">${l}</button>`).join('')}</div></div>

    ${overdue.length || bdays.length || follow.length ? `<div class="grid c3 rv" style="margin-bottom:20px;align-items:start">
      ${overdue.length ? `<div class="card"><span class="sc">Needs attention</span><div class="stack" style="gap:5px;margin-top:8px">${overdue.slice(0,5).map(({p,days,want})=>`<a class="quiet-row" href="#/people/${p.id}"><span>${CIRCLES[p.circle][0]} ${esc(p.name)}</span><span class="mono">${days===Infinity?'never':days+'d'} · wanted ${esc(want)}</span></a>`).join('')}</div>${overdue.length>5?`<button class="btn sm ghost" id="pplAll" style="margin-top:8px">see all ${overdue.length}</button>`:''}</div>` : ''}
      ${bdays.length ? `<div class="card"><span class="sc">Birthdays</span><div class="stack" style="gap:5px;margin-top:8px">${bdays.slice(0,5).map(({p,next,days})=>`<a class="quiet-row" href="#/people/${p.id}"><span>${esc(p.name)}</span><span class="mono">${days===0?'today':`in ${days}d · ${fmtDate(next,'short')}`}</span></a>`).join('')}</div></div>` : ''}
      ${follow.length ? `<div class="card"><span class="sc">Follow-ups</span><div class="stack" style="gap:5px;margin-top:8px">${follow.slice(0,5).map(({i,p})=>`<div class="quiet-row"><span><b>${esc(p.name)}</b> — ${esc(i.followUp)}</span><button class="btn sm ghost" data-fudone="${i.id}">done</button></div>`).join('')}</div></div>` : ''}
    </div>` : ''}

    <div class="row rv" style="gap:8px;margin-bottom:14px"><button class="btn sm ghost" id="rtReachout">☺ reach out to someone</button><button class="btn sm ghost" id="rtGratitude">♡ gratitude for someone</button><button class="btn sm ghost" id="rtRing">◎ ring review</button></div>

    <div id="pplBody"></div>
  </div>`;
  const body = $('#pplBody');
  ({circles:pplCircles, list:pplList, log:pplTimeline, eras:pplEras, audit:pplAudit}[view])(body);
  $$('[data-pplview]',root).forEach(b => b.onclick = () => { S._pplView = b.dataset.pplview; rerender(); });
  $$('[data-fudone]',root).forEach(b => b.onclick = () => { byId(S.interactions, b.dataset.fudone).followUpDone = true; saveNow(); sound('success'); rerender(); });
  if($('#pplAll')) $('#pplAll').onclick = () => { S._pplView = 'list'; S._pplNeeds = true; rerender(); };
  $('#rtReachout').onclick = () => reachOutRitual();
  $('#rtGratitude').onclick = () => gratitudeRitual();
  $('#rtRing').onclick = () => { S._pplView = 'circles'; rerender(); toast('Has anyone moved? Should anyone move? Who are you neglecting? Drag a face to answer.', 6000); };
  reveal(body);
};

/* ---------- relationship rituals — reachable from People, and from a habit flagged relational ---------- */
function reachOutRitual(afterDone){
  if(!S.people.length){ toast('Add someone first.'); return; }
  const m = openModal(`<h2>Who did you reach out to?</h2><div class="stack">
    <select class="sel" id="roPerson">${S.people.filter(p=>p.status!=='deceased').map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>
    <input class="inp" id="roDesc" placeholder="one line — what did you say, or plan to?">
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="roSave">Log it</button></div></div>`,'narrow');
  m.querySelector('#roSave').onclick = () => { const personId = m.querySelector('#roPerson').value;
    const i = {id:uid(), personId, date:today(), type:'text', description:m.querySelector('#roDesc').value.trim()||'Reached out.', mood:null, energy:'', quality:'Routine', followUp:null, followUpDone:false};
    S.interactions.push(i); const p = byId(S.people, personId); p.lastInteraction = lastInteractionDate(p.id);
    saveNow(); m.remove(); sound('success'); toast(`Logged — you reached out to ${esc(p.name)}.`); afterDone ? afterDone() : rerender(); };
}
function gratitudeRitual(afterDone){
  if(!S.people.length){ toast('Add someone first.'); return; }
  const m = openModal(`<h2>Gratitude for someone</h2><div class="stack">
    <select class="sel" id="grPerson">${S.people.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>
    <textarea class="ta" id="grText" placeholder="One line — what are you grateful to them for?"></textarea>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="grSave">Save</button></div></div>`,'narrow');
  m.querySelector('#grSave').onclick = () => { const personId = m.querySelector('#grPerson').value; const text = m.querySelector('#grText').value.trim(); if(!text) return;
    const p = byId(S.people, personId);
    S.entries.push({id:uid(), type:'gratitude', title:`Grateful for ${p.name}`, body:text, occurredAt:today(), createdAt:new Date().toISOString(), media:[], links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[personId]}, people:[p.name], places:[], emotions:[], tags:[], confidence:'', extra:{}});
    saveNow(); m.remove(); sound('success'); toast(`Saved — tagged to ${esc(p.name)}.`); afterDone ? afterDone() : rerender(); };
}

/* view 1: the concentric rings (the Constellation) */
function pplCircles(box){
  const ring = k => S.people.filter(p => p.circle === k);
  const R = {core:90, close:165, warm:240, orbit:315, aspirational:390};
  const SZbase = {core:30, close:24, warm:19, orbit:15, aspirational:15};
  box.innerHTML = `<div class="circle-map rv" style="--maxr:${R.aspirational+40}">
    <svg viewBox="0 0 860 860" class="cm-rings">${Object.entries(CIRCLES).map(([k,c])=>`<circle cx="430" cy="430" r="${R[k]}" fill="none" stroke="${c[4]}" stroke-opacity=".28" stroke-dasharray="${k==='aspirational'?'2 5':'3 7'}"/><text x="430" y="${430-R[k]+16}" text-anchor="middle" class="cm-lbl" style="fill:${c[4]}">${esc(c[1].toUpperCase())}</text>`).join('')}</svg>
    ${Object.entries(CIRCLES).map(([k,c]) => { const list = ring(k);
      return list.map((p,i) => { const a = -Math.PI/2 + i * 2*Math.PI / Math.max(list.length,1) + (k==='close'?.22:k==='warm'?.4:k==='orbit'?.6:k==='aspirational'?.8:0);
        const x = 430 + Math.cos(a)*R[k], y = 430 + Math.sin(a)*R[k]; const od = personOverdue(p);
        const n = personEntryCount(p.id); const sz = clamp(SZbase[k] + Math.sqrt(n)*3, SZbase[k], SZbase[k]+30);
        const recent = p.lastInteraction && daysSince(p.lastInteraction) <= 30;
        const hollow = p.status === 'notyetmet'; const faded = ['lost','estranged'].includes(p.status); const dashed = p.status === 'dormant';
        const nc = personNodeColor(p);
        return `<button class="cm-person ${od?'overdue':''} ${recent?'glow':''} ${hollow?'hollow':''} ${faded?'faded':''} ${dashed?'dashed':''}" draggable="true" data-cmp="${p.id}" style="left:${(x/860*100).toFixed(2)}%;top:${(y/860*100).toFixed(2)}%;--s:${(sz*2).toFixed(0)}px;--c:${nc}" title="${esc(p.name)}${od?` · ${od.days===Infinity?'never written about':od.days+' days'}`:''} · ${PERSON_STATUS[p.status][1]}">
          ${p.photo?`<img src="${esc(p.photo)}" alt="">`:`<span>${esc(personInitials(p))}</span>`}
          <span class="cm-name">${esc(p.nickname || p.name.split(' ')[0])}</span>${od?'<span class="cm-warn">!</span>':''}</button>`; }).join('');
    }).join('')}
    ${Object.keys(CIRCLES).map(k=>`<div class="cm-drop" data-cmring="${k}" style="--rp:${(R[k]/860*100).toFixed(2)}"></div>`).join('')}
    ${!S.people.length ? '<div class="empty cm-empty">No one here yet. Start with five names — the ones you would actually call.</div>' : ''}
  </div>
  <div class="row rv" style="gap:14px;justify-content:center;margin-top:6px;flex-wrap:wrap">${Object.entries(CIRCLES).map(([k,c])=>`<span class="mono" style="color:${c[4]}">${c[0]} ${esc(c[1])} · ${ring(k).length}${c[3]?` of about ${c[3]}`:''}</span>`).join('')}<span class="faint mono">drag a face between rings to reclassify · size = how present they are in what you've written · warm glow = contact within 30 days</span></div>`;
  $$('[data-cmp]',box).forEach(b => {
    b.onclick = () => navigate('#/people/' + b.dataset.cmp);
    b.addEventListener('dragstart', () => { window._cmDrag = b.dataset.cmp; b.classList.add('dragging'); });
    b.addEventListener('dragend', () => { b.classList.remove('dragging'); window._cmDrag = null; });
  });
  $$('[data-cmring]',box).forEach(r => {
    r.addEventListener('dragover', e => { e.preventDefault(); r.classList.add('over'); });
    r.addEventListener('dragleave', () => r.classList.remove('over'));
    r.addEventListener('drop', e => { e.preventDefault(); r.classList.remove('over');
      const p = byId(S.people, window._cmDrag); if(!p || p.circle === r.dataset.cmring) return;
      p.ringHistory.push({date:today(), from:p.circle, to:r.dataset.cmring}); p.circle = r.dataset.cmring;
      if(r.dataset.cmring === 'aspirational' && p.status === 'active') p.status = 'notyetmet';
      saveNow(); sound('click'); rerender(); });
  });
}
/* view 2: the directory */
function pplList(box){
  const f = S._pplF = S._pplF || {q:'', rel:'all', circle:'all', status:'all', tag:'all', sort:'last'};
  if(S._pplNeeds){ f.needs = true; S._pplNeeds = false; }
  const tags = [...new Set(S.people.flatMap(p => p.tags || []))].sort();
  let list = S.people.filter(p => {
    if(f.rel !== 'all' && p.relationship !== f.rel) return false;
    if(f.circle !== 'all' && p.circle !== f.circle) return false;
    if(f.status !== 'all' && p.status !== f.status) return false;
    if(f.tag !== 'all' && !(p.tags||[]).includes(f.tag)) return false;
    if(f.needs && !personOverdue(p)) return false;
    if(f.q && !`${p.name} ${p.nickname} ${p.relationship} ${(p.tags||[]).join(' ')}`.toLowerCase().includes(f.q.toLowerCase())) return false;
    return true;
  });
  const cmp = {name:(a,b)=>a.name.localeCompare(b.name),
    last:(a,b)=>(daysSince(b.lastInteraction)===Infinity?1e9:daysSince(b.lastInteraction)) - (daysSince(a.lastInteraction)===Infinity?1e9:daysSince(a.lastInteraction)),
    birthday:(a,b)=>{ const A = birthdaysSoon(400).find(x=>x.p.id===a.id), B = birthdaysSoon(400).find(x=>x.p.id===b.id); return (A?A.days:1e9)-(B?B.days:1e9); },
    circle:(a,b)=>Object.keys(CIRCLES).indexOf(a.circle)-Object.keys(CIRCLES).indexOf(b.circle) || a.name.localeCompare(b.name)}[f.sort];
  list = list.sort(cmp);
  box.innerHTML = `<div class="filter-bar rv">
      <input class="inp" id="plq" placeholder="search name, nickname, tag" value="${esc(f.q)}">
      <select class="sel" id="plRel"><option value="all">any relationship</option>${relationships().map(r=>`<option value="${esc(r)}" ${f.rel===r?'selected':''}>${esc(r)}</option>`).join('')}</select>
      <select class="sel" id="plCircle"><option value="all">any ring</option>${Object.entries(CIRCLES).map(([k,c])=>`<option value="${k}" ${f.circle===k?'selected':''}>${c[1]}</option>`).join('')}</select>
      <select class="sel" id="plStatus"><option value="all">any status</option>${Object.entries(PERSON_STATUS).map(([k,c])=>`<option value="${k}" ${f.status===k?'selected':''}>${c[1]}</option>`).join('')}</select>
      ${tags.length?`<select class="sel" id="plTag"><option value="all">any tag</option>${tags.map(t=>`<option value="${esc(t)}" ${f.tag===t?'selected':''}>#${esc(t)}</option>`).join('')}</select>`:''}
      <select class="sel" id="plSort">${[['last','losing touch first'],['name','by name'],['circle','by ring'],['birthday','next birthday']].map(([v,l])=>`<option value="${v}" ${f.sort===v?'selected':''}>${l}</option>`).join('')}</select>
      <button class="btn sm ${f.needs?'primary':'ghost'}" id="plNeeds">needs attention${f.needs?' ✓':''}</button>
      <button class="btn sm primary" id="plNew">＋ Person</button></div>
    <div class="ppl-list rv">${list.length ? list.map(p => { const c = CIRCLES[p.circle]; const st = PERSON_STATUS[p.status]; const od = personOverdue(p); const n = personInteractions(p.id).length;
      return `<a class="ppl-row ${od?'overdue':''}" href="#/people/${p.id}" style="--c:${c[4]}">
        <span class="ppl-face">${p.photo?`<img src="${esc(p.photo)}" alt="">`:esc(personInitials(p))}</span>
        <span class="ppl-name"><b>${esc(p.name)}</b>${p.nickname?`<span class="mono"> “${esc(p.nickname)}”</span>`:''}</span>
        <span class="mono ppl-rel">${esc(p.relationship)}</span>
        <span class="chip" style="--c:${c[4]}">${c[0]} ${esc(c[1])}</span>
        <span class="chip" style="--c:${st[2]}">${st[0]} ${esc(st[1])}</span>
        <span class="mono ppl-last ${od?'warn':''}">${p.lastInteraction ? relDays(daysSince(p.lastInteraction)) : 'never'}${od?' ⚠':''}</span>
        <span class="mono">${n} logged</span>
        <span class="tagrow">${(p.tags||[]).slice(0,3).map(t=>`<span class="tag">#${esc(t)}</span>`).join('')}</span></a>`; }).join('')
      : '<div class="empty">No one matches.</div>'}</div>`;
  const bind = (id,key) => { const el_ = $(id); if(el_) el_.onchange = () => { f[key] = el_.value; rerender(); }; };
  bind('#plRel','rel'); bind('#plCircle','circle'); bind('#plStatus','status'); bind('#plTag','tag'); bind('#plSort','sort');
  $('#plq').addEventListener('input', debounce(() => { f.q = $('#plq').value; rerender(); const i = $('#plq'); if(i){ i.focus(); i.setSelectionRange(i.value.length,i.value.length); } }, 320));
  $('#plNeeds').onclick = () => { f.needs = !f.needs; rerender(); };
  $('#plNew').onclick = () => openPersonModal();
}
/* view 3: the social journal — the interaction log across everyone */
function pplTimeline(box){
  const f = S._pplT = S._pplT || {person:'all', type:'all'};
  const list = S.interactions.filter(i => (f.person === 'all' || i.personId === f.person) && (f.type === 'all' || i.type === f.type))
    .sort((a,b) => b.date.localeCompare(a.date)).slice(0,300);
  const byYear = {}; list.forEach(i => { const y = i.date.slice(0,4); (byYear[y] = byYear[y] || []).push(i); });
  box.innerHTML = `<div class="filter-bar rv">
      <select class="sel" id="ptPerson"><option value="all">everyone</option>${S.people.map(p=>`<option value="${p.id}" ${f.person===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select>
      <select class="sel" id="ptType"><option value="all">every kind</option>${Object.entries(INTERACTION_TYPES).map(([k,v])=>`<option value="${k}" ${f.type===k?'selected':''}>${v[0]} ${v[1]}</option>`).join('')}</select>
      <button class="btn sm primary" id="ptNew">＋ Log an interaction</button></div>
    ${list.length ? Object.keys(byYear).sort().reverse().map(y => `<div class="year-block rv"><div class="year-label mono">${y}</div>
      ${byYear[y].map(i => { const p = byId(S.people, i.personId); if(!p) return ''; const c = CIRCLES[p.circle]; const t = INTERACTION_TYPES[i.type] || INTERACTION_TYPES.other; const en = ENERGY_READINGS[i.energy];
        return `<div class="int-row" data-intopen="${i.id}"><span class="ppl-face sm" style="--c:${c[4]}">${p.photo?`<img src="${esc(p.photo)}" alt="">`:esc(personInitials(p))}</span>
          <span class="int-body"><span class="row between"><b>${esc(p.name)}</b><span class="mono">${t[0]} ${esc(t[1])} · ${fmtDate(i.date,'med')}${en?` · ${en[0]} ${en[1]}`:''}</span></span>
          <span class="int-desc">${esc(i.description || '—')}${i.quality?` <span class="status-pill">${esc(i.quality)}</span>`:''}</span>
          ${i.followUp?`<span class="int-follow ${i.followUpDone?'done':''}">↪ ${esc(i.followUp)}</span>`:''}</span></div>`; }).join('')}</div>`).join('')
      : '<div class="empty rv">Nothing logged yet. Every entry you tag with someone shows up here too.</div>'}`;
  $('#ptPerson').onchange = e => { f.person = e.target.value; rerender(); };
  $('#ptType').onchange = e => { f.type = e.target.value; rerender(); };
  $('#ptNew').onclick = () => openInteractionModal();
  $$('[data-intopen]',box).forEach(r => r.onclick = () => openInteractionModal(byId(S.interactions, r.dataset.intopen)));
}
/* view 4: the Relationship Timeline — who was around during which era */
function pplEras(box){
  const stages = S.stages.filter(s=>!s.notyet);
  if(!stages.length){ box.innerHTML = '<div class="empty">Add life stages on the Timeline page first, and the people who were there can be mapped onto them.</div>'; return; }
  const tracked = S.people.filter(p => (p.stagesPresent||[]).length);
  box.innerHTML = `<p class="muted rv" style="font-size:.85rem;margin-bottom:14px">Each line spans the stages a person was present in — set from their profile. A dashed tail means the relationship has gone dormant; a line that stops shows when it concluded.</p>
    <div class="rel-timeline rv"><div class="rt-head">${stages.map(s=>`<div class="rt-col-h" style="--c:${s.hue}">${s.char}<span class="mono">${esc(s.name)}</span></div>`).join('')}</div>
    ${tracked.length ? tracked.map(p => { const idxs = p.stagesPresent.map(id=>stages.findIndex(s=>s.id===id)).filter(i=>i>=0).sort((a,b)=>a-b); if(!idxs.length) return '';
      const first = idxs[0], last = idxs[idxs.length-1]; const c = personNodeColor(p); const dashed = p.status==='dormant'; const ended = !['active','notyetmet'].includes(p.status) || last < stages.length-1;
      return `<div class="rt-row" data-rtopen="${p.id}"><span class="rt-name">${esc(p.name)}</span><span class="rt-track" style="grid-template-columns:repeat(${stages.length},1fr)"><span class="rt-bar ${dashed?'dashed':''} ${ended?'ended':''}" style="--c:${c};grid-column:${first+1} / ${last+2}"></span></span></div>`; }).join('')
      : '<div class="empty" style="grid-column:1/-1">No one has a life stage set yet. Open a profile and add the stages they were part of.</div>'}
    </div>`;
  box.querySelectorAll('[data-rtopen]').forEach(r => r.onclick = () => navigate('#/people/'+r.dataset.rtopen));
}
/* view 5: the Relational Audit — periodic health check */
function pplAudit(box){
  const withInts = S.people.filter(p => recentInteractions(p.id).length);
  const maxX = Math.max(1, ...withInts.map(p=>recentInteractions(p.id).length));
  const W=560, H=300;
  const pts = withInts.map(p => { const x = recentInteractions(p.id).length; const es = energyBalanceScore(p.id); const y = es===null?0:es; return {p,x,y}; });
  const scatter = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;display:block;margin:0 auto;overflow:visible">
    <line x1="40" y1="${H-30}" x2="${W-10}" y2="${H-30}" stroke="var(--line-2)"/><line x1="40" y1="10" x2="40" y2="${H-30}" stroke="var(--line-2)"/>
    <line x1="${40+(W-50)/2}" y1="10" x2="${40+(W-50)/2}" y2="${H-30}" stroke="var(--line)" stroke-dasharray="3 4"/><line x1="40" y1="${(H-20)/2}" x2="${W-10}" y2="${(H-20)/2}" stroke="var(--line)" stroke-dasharray="3 4"/>
    <text class="q" x="${W-14}" y="22" text-anchor="end">protect these</text><text class="q" x="${W-14}" y="${H-40}" text-anchor="end">taken for granted?</text>
    <text class="q" x="46" y="22">where resentment builds</text><text class="q" x="46" y="${H-40}">let drift</text>
    <text x="${W/2}" y="${H-8}" text-anchor="middle">less invested ← time / energy → more invested</text><text x="14" y="${H/2}" text-anchor="middle" transform="rotate(-90 14 ${H/2})">what it gives back</text>
    ${pts.map(({p,x,y}) => { const px = 40 + (x/maxX)*(W-50), py = (H-30) - ((y+1)/2)*(H-50); const c = CIRCLES[p.circle];
      return `<g data-audopen="${p.id}" style="cursor:pointer"><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="7" fill="${c[4]}" fill-opacity=".75" stroke="${c[4]}"/><text x="${(px+10).toFixed(1)}" y="${(py+4).toFixed(1)}" style="fill:var(--text);font-family:var(--sans);font-size:11px">${esc(p.name)}</text></g>`; }).join('')}
  </svg>`;

  const closest = [...S.people].map(p=>({p,n:recentInteractions(p.id).length})).filter(x=>x.n>0).sort((a,b)=>b.n-a.n).slice(0,5);
  const modeledBy = id => S.people.filter(p=>['core','close'].includes(p.circle) && (p.valuesEmbodied||[]).includes(id));
  const unmodeled = S.valueOrder.filter(id => !modeledBy(id).length);
  const threadless = S.threads.filter(t => !S.people.some(p=>(p.threadsLinked||[]).includes(t.id)));

  box.innerHTML = `
    <section class="section rv"><span class="sc">Investment vs. return</span><p class="muted" style="font-size:.85rem">Not transactional — a mirror. X is how many times you've logged this person in the last 90 days; Y is whether time with them tends to energize or drain you.</p>
      <div class="card">${withInts.length ? scatter : '<div class="empty">Log a few interactions with an energy reading and this fills in.</div>'}</div></section>

    <section class="section rv"><span class="sc">Values, modeled by someone</span><p class="muted" style="font-size:.85rem">Who in your Core and Close rings actually embodies each value? Set this from a person's profile.</p>
      <div class="stack" style="gap:8px">${S.valueOrder.map(id => { const v = byId(S.values,id); const who = modeledBy(id);
        return `<div class="row between"><span style="color:${v.color}">${esc(v.name)}</span><span class="row" style="gap:4px;flex-wrap:wrap">${who.length?who.map(p=>`<a class="chip on click" style="--c:${v.color}" href="#/people/${p.id}">${esc(p.name)}</a>`).join(''):'<span class="faint mono">no one models this yet</span>'}</span></div>`; }).join('')}</div></section>

    <section class="section rv"><span class="sc">Your five closest (Jim Rohn's mirror)</span><p class="muted" style="font-size:.85rem">Most logged, last 90 days. Are they the people you want to be becoming like?</p>
      ${closest.length ? `<div class="stack" style="gap:6px">${closest.map(({p,n})=>`<a class="quiet-row" href="#/people/${p.id}"><span>${CIRCLES[p.circle][0]} ${esc(p.name)}</span><span class="mono">${n} interaction${n===1?'':'s'}</span></a>`).join('')}</div>` : '<div class="empty">Log a few interactions and your actual five closest show up here — not who you\'d guess.</div>'}</section>

    <section class="section rv"><span class="sc">Relational blind spots</span>
      <div class="stack" style="gap:8px">
        ${unmodeled.length ? `<div class="quiet-row"><span>You value <b>${unmodeled.map(id=>esc(byId(S.values,id).name)).join(', ')}</b>, but no one in your Core ring models ${unmodeled.length===1?'it':'them'}.</span></div>` : ''}
        ${threadless.map(t=>`<div class="quiet-row"><span>Your <b>${esc(t.name)}</b> thread has no people tagged to it. Who was involved?</span></div>`).join('')}
        ${!unmodeled.length && !threadless.length ? '<div class="empty">Nothing obviously missing right now.</div>' : ''}
      </div></section>`;
  box.querySelectorAll('[data-audopen]').forEach(g => g.onclick = () => navigate('#/people/'+g.dataset.audopen));
}

/* ---------- the person, in detail ---------- */
function renderPersonPage(root, id){
  const p = byId(S.people, id); if(!p){ navigate('#/people'); return; }
  const c = CIRCLES[p.circle]; const st = PERSON_STATUS[p.status]; const ints = personInteractions(id); const od = personOverdue(p);
  const bday = birthdaysSoon(400).find(x => x.p.id === id);
  const streak = (() => { let n = 0; let cursor = today();
    for(let w = 0; w < 52; w++){ const from = addDays(cursor, -7), has = ints.some(i => i.date > from && i.date <= cursor); if(!has) break; n++; cursor = from; } return n; })();
  const entries = sortEntries(S.entries.filter(e => (e.links?.people||[]).includes(id)));
  const F = (key, q, hint) => { const hist = p[key]||[]; const latest = hist.slice(-1)[0]; return `<div class="value-field rv"><div class="q">${q}</div><div class="faint" style="font-size:.8rem;margin-bottom:8px">${hint}</div><div class="prose serif-lg">${latest?md(latest.text):'<span class="empty">Not yet written.</span>'}</div><div class="row" style="margin-top:8px"><button class="btn sm ghost" data-pf="${key}">${latest?'write a new version':'write'}</button>${hist.length>1?`<details style="border:none;flex:1"><summary><span class="mono">${hist.length-1} earlier versions</span></summary><div class="body versions">${hist.slice(0,-1).map(h=>`<div class="v"><div class="mono">${fmtDate(h.date,'med')}</div>${md(h.text)}</div>`).reverse().join('')}</div></details>`:latest?`<span class="mono">${fmtDate(latest.date,'med')}</span>`:''}</div></div>`; };
  root.innerHTML = `<div class="page narrow" style="--c:${c[4]}">
    <div class="person-hero rv">
      <div class="ppl-face lg">${p.photo?`<img src="${esc(p.photo)}" alt="">`:esc(personInitials(p))}<button class="photo-btn" id="ppPhoto" title="add a photograph">▣</button><input type="file" accept="image/*" id="ppFile" hidden></div>
      <div style="flex:1;min-width:0">
        <h1 style="margin:0">${ed(`people.#${p.id}.name`)}</h1>
        <div class="quote">${ed(`people.#${p.id}.relationship`,{ph:'how you\'d describe this relationship — not a category'})}</div>
        <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap">
          <select class="sel" style="width:auto" id="ppCircle">${Object.entries(CIRCLES).map(([k,x])=>`<option value="${k}" ${p.circle===k?'selected':''}>${x[0]} ${x[1]} ring</option>`).join('')}</select>
          <select class="sel" style="width:auto" id="ppStatus">${Object.entries(PERSON_STATUS).map(([k,x])=>`<option value="${k}" ${p.status===k?'selected':''}>${x[0]} ${x[1]}</option>`).join('')}</select>
          <select class="sel" style="width:auto" id="ppFreq" title="how often you would like to be in touch"><option value="">no rhythm set</option>${Object.keys(FREQUENCIES).map(k=>`<option value="${k}" ${p.desiredFrequency===k?'selected':''}>${k}</option>`).join('')}</select>
        </div></div>
    </div>

    <div class="card rv" style="margin:16px 0"><div class="income-strip">
      <div><div class="k">last interaction</div><div class="num" style="font-size:1.4rem">${p.lastInteraction?relDays(daysSince(p.lastInteraction)):'—'}</div><div class="mono">${p.lastInteraction?fmtDate(p.lastInteraction,'med'):'nothing logged'}</div></div>
      <div><div class="k">logged</div><div class="num">${ints.length}</div><div class="mono">interactions</div></div>
      <div><div class="k">streak</div><div class="num">${streak}</div><div class="mono">week${streak===1?'':'s'} in a row</div></div>
      <div><div class="k">birthday</div><div class="num" style="font-size:1.3rem">${bday?(bday.days===0?'today':`${bday.days}d`):'—'}</div><div class="mono">${p.birthday?fmtDate(p.birthday,'med'):'not set'}</div></div>
    </div></div>

    ${od ? `<div class="card rv late-card" style="margin-bottom:16px"><b class="serif">${od.days===Infinity?'Nothing logged yet.':`It has been ${od.days} days.`}</b><div class="muted" style="font-size:.88rem;margin-top:4px">You set a ${esc(od.want)} rhythm for this ring. No obligation — the record is just noticing.</div>
      <div class="row" style="margin-top:10px;gap:8px"><button class="btn sm primary" id="ppLogNow">Log an interaction</button><button class="btn sm ghost" id="ppRemind">Put it on the plan</button></div></div>` : ''}

    <div class="row rv" style="gap:8px;margin-bottom:16px"><button class="btn primary" id="ppLog">＋ Log an interaction</button><button class="btn ghost" id="ppWrite">Write about them</button></div>

    <section class="section rv"><span class="sc">Life stages present</span><p class="muted" style="font-size:.85rem">Which of your stages was this person part of? Feeds the Relationship Timeline.</p>
      <div class="deps" id="ppStages">${S.stages.filter(s=>!s.notyet).map(s=>`<span class="chip click ${(p.stagesPresent||[]).includes(s.id)?'on':''}" style="--c:${s.hue}" data-ppstage="${s.id}">${s.char} ${esc(s.name)}</span>`).join('')}</div></section>

    ${F('installed','What this person installed in me','The belief, pattern, fear, or capability this relationship left behind. Your self-image was built by how people like this one responded to you.')}
    <div class="value-field rv"><div class="q">What I become around this person</div><div class="faint" style="font-size:.8rem;margin-bottom:8px">Your self-image shifts depending on who you're with. Naming the shift makes it conscious.</div>${ed(`people.#${p.id}.becomeAround`,{multi:true,ph:'Around them, I am…'})}</div>
    ${F('gift','The gift','What this person gives, or gave, that no one else could.')}
    ${F('wound','The wound','Where this relationship has hurt or limited you. Neither this nor the gift negates the other.')}

    <section class="section rv"><span class="sc">Threads activated</span><div class="deps">${S.threads.map(t=>`<span class="chip click ${(p.threadsLinked||[]).includes(t.id)?'on':''}" style="--c:${t.color}" data-ppthread="${t.id}">${esc(t.name)}</span>`).join('')||'<span class="faint">No threads yet — name one on the Timeline page.</span>'}</div></section>
    <section class="section rv"><span class="sc">Values embodied</span><p class="muted" style="font-size:.85rem">Who shows you what this actually looks like in practice — different from which values you embody around them.</p><div class="deps">${S.valueOrder.map(vid=>{ const v=byId(S.values,vid); return `<span class="chip click ${(p.valuesEmbodied||[]).includes(vid)?'on':''}" style="--c:${v.color}" data-ppvalue="${vid}">${esc(v.name)}</span>`; }).join('')}</div></section>
    <section class="section rv"><span class="sc">Energy reading — standing assessment</span><div class="resonance-scale" id="ppEnergy">${Object.entries(ENERGY_READINGS).map(([k,x])=>`<button class="${p.energyStanding===k?'on':''}" style="--c:${x[2]}" data-ppenergy="${k}">${x[0]} ${x[1]}</button>`).join('')}</div></section>


    <section class="section rv"><span class="sc">Remember</span>
      <div class="grid c2" style="align-items:start;margin-top:10px">
        <div class="card"><div class="k mono">Interests</div>${ed(`people.#${p.id}._interests`,{ph:'climbing, Ozu films, bad puns',hook:'pint:'+p.id})}
          <div class="k mono" style="margin-top:12px">Life updates — what they told you</div>${ed(`people.#${p.id}.details.lifeUpdates`,{multi:true,ph:'just got promoted · moving in March · their mother is ill'})}</div>
        <div class="card"><div class="k mono">Notes</div>${ed(`people.#${p.id}.details.notes`,{multi:true,mdr:true,cls:'prose',ph:'How you met. What they gave you. What you owe them. Anything you would be embarrassed to forget.'})}</div>
      </div>
      <div class="grid c2" style="align-items:start;margin-top:12px">
        <div class="card"><div class="row between"><span class="k mono">Important dates</span><button class="btn sm ghost" id="ppDate">＋ date</button></div>
          ${(p.details.importantDates||[]).length ? `<div class="stack" style="gap:5px;margin-top:8px">${p.details.importantDates.map((d,i)=>`<div class="row between"><span>${ed(`people.#${p.id}.details.importantDates.${i}.label`,{ph:'what it is'})}</span><span class="row">${ed(`people.#${p.id}.details.importantDates.${i}.date`,{ph:'YYYY-MM-DD',cls:'mono',date:true})}<button class="del-x inline" data-dtdel="${i}">×</button></span></div>`).join('')}</div>` : '<div class="faint" style="font-size:.8rem;margin-top:6px">Anniversaries, the day you met, the day they helped.</div>'}
          <div class="k mono" style="margin-top:12px">Birthday</div>${ed(`people.#${p.id}.birthday`,{ph:'YYYY-MM-DD',cls:'mono',date:true})}</div>
        <div class="card"><div class="k mono">How to reach them</div>
          <div class="spec-grid" style="margin-top:6px"><div><div class="k">phone</div>${ed(`people.#${p.id}.contactInfo.phone`,{ph:'—',cls:'mono'})}</div><div><div class="k">email</div>${ed(`people.#${p.id}.contactInfo.email`,{ph:'—',cls:'mono'})}</div></div>
          <div class="k mono" style="margin-top:12px">Tags</div><input class="inp mono" id="ppTags" value="${esc((p.tags||[]).map(t=>'#'+t).join(' '))}" placeholder="#climbing #singapore"></div>
      </div></section>

    <section class="section rv"><div class="row between"><span class="sc" style="margin:0">Gift ideas</span><button class="btn sm ghost" id="ppGiftIdea">＋ idea</button></div>
      ${(p.giftIdeas||[]).length ? `<div class="stack" style="gap:5px;margin-top:8px">${p.giftIdeas.map((g,i)=>`<div class="row between"><span style="flex:1">${ed(`people.#${p.id}.giftIdeas.${i}`,{ph:'she\'d love this'})}</span><button class="del-x inline" data-gideldel="${i}">×</button></div>`).join('')}</div>` : '<div class="faint" style="font-size:.8rem;margin-top:6px">"She\'d love this" — log it the moment you think it, before you forget.</div>'}</section>
    <section class="section rv"><div class="row between"><span class="sc" style="margin:0">Gifts given &amp; received</span><button class="btn sm ghost" id="ppGiftLog">＋ gift</button></div>
      ${(p.giftsLog||[]).length ? `<div class="stack" style="gap:5px;margin-top:8px">${p.giftsLog.map((g,i)=>`<div class="row between"><span class="status-pill">${g.direction==='given'?'gave':'received'}</span><span style="flex:1">${ed(`people.#${p.id}.giftsLog.${i}.what`,{ph:'what'})}</span><span class="mono">${ed(`people.#${p.id}.giftsLog.${i}.date`,{ph:'date',cls:'mono',date:true})}</span><button class="del-x inline" data-glogdel="${i}">×</button></div>`).join('')}</div>` : '<div class="empty">Nothing logged.</div>'}</section>

    <section class="section rv"><div class="row between" style="align-items:center"><span class="sc" style="margin:0">Pictures of them</span>${imageAddHTML('person', p.id)}</div>
      <p class="muted" style="font-size:.85rem">A face, a place, their handwriting. The first becomes the ground their card is printed on.</p>
      ${imageStripHTML('person', p.id)}</section>

    <section class="section rv"><div class="row between"><span class="sc" style="margin:0">Interactions</span><span class="mono">${ints.length}</span></div>
      ${ints.length ? `<div class="stack" style="gap:2px;margin-top:10px">${ints.map(i => { const t = INTERACTION_TYPES[i.type] || INTERACTION_TYPES.other; const en = ENERGY_READINGS[i.energy];
        return `<div class="int-row" data-intopen="${i.id}"><span class="int-ico">${t[0]}</span><span class="int-body">
          <span class="row between"><span class="mono">${esc(t[1])} · ${fmtDate(i.date,'med')}</span><span class="row" style="gap:4px">${en?`<span class="resonance-pill" style="--c:${en[2]}">${en[0]} ${en[1]}</span>`:''}${i.mood?`<span class="status-pill">${esc(i.mood)}</span>`:''}</span></span>
          <span class="int-desc">${esc(i.description||'—')}${i.quality?` <span class="status-pill">${esc(i.quality)}</span>`:''}</span>
          ${i.followUp?`<span class="int-follow ${i.followUpDone?'done':''}">↪ ${esc(i.followUp)}</span>`:''}</span>
          ${i.entryId?'<span class="mono int-src">from an entry</span>':''}</div>`; }).join('')}</div>`
        : '<div class="empty">Nothing logged. Tag them in a journal entry and it appears here automatically.</div>'}</section>

    ${entries.length ? `<section class="section rv"><span class="sc">Where they appear in what you write</span>${entries.slice(0,20).map(e=>entryCard(e)).join('')}</section>` : ''}

    ${moreSection(`<div class="danger-zone"><span>This removes the person, their interactions and their board. What you wrote stays.</span><button class="btn sm ghost danger" id="ppDel">Remove this person</button></div>`)}
  </div>`;
  p._interests = (p.details.interests || []).join(', ');
  $('#ppCircle').onchange = e => { const to = e.target.value; if(to !== p.circle) p.ringHistory.push({date:today(), from:p.circle, to}); p.circle = to; saveNow(); rerender(); };
  $('#ppStatus').onchange = e => { p.status = e.target.value; saveNow(); rerender(); };
  $('#ppFreq').onchange = e => { p.desiredFrequency = e.target.value || null; saveNow(); rerender(); };
  $('#ppLog').onclick = () => openInteractionModal(null, p.id);
  if($('#ppLogNow')) $('#ppLogNow').onclick = () => openInteractionModal(null, p.id);
  if($('#ppRemind')) $('#ppRemind').onclick = () => { S.tasks.push(newTask(`Reach out to ${p.name}`, today())); saveNow(); sound('success'); toast('Added to today\'s plan.'); };
  $('#ppWrite').onclick = () => openEntryModal({type:'reflection', allowedTypes:['reflection','memory','gratitude','letter'], heading:`About ${p.name}`, links:{people:[p.id]}, openLinks:true});
  $('#ppPhoto').onclick = () => $('#ppFile').click();
  $('#ppFile').onchange = e => { const f = Array.from(e.target.files || []); e.target.value = ''; if(f.length) readImages(f, photo => { p.photo = photo.src; saveNow(); rerender(); }); };
  $('#ppDate').onclick = () => { p.details.importantDates = p.details.importantDates || []; p.details.importantDates.push({label:'', date:''}); saveNow(); rerender(); };
  $$('[data-dtdel]',root).forEach(b => b.onclick = () => { const i = +b.dataset.dtdel; requestDelete({label:p.details.importantDates[i].label||'this date', node:b.closest('.row'), remove:()=>{ const g = p.details.importantDates.splice(i,1)[0]; return () => p.details.importantDates.splice(i,0,g); }}); });
  const tg = $('#ppTags'); tg.onchange = () => { p.tags = normTags(tg.value.split(/[\s,]+/)); saveNow(); };
  $$('[data-intopen]',root).forEach(r => r.onclick = () => openInteractionModal(byId(S.interactions, r.dataset.intopen)));
  $$('[data-ppstage]',root).forEach(c => c.onclick = () => { const sid = c.dataset.ppstage; p.stagesPresent = (p.stagesPresent||[]).includes(sid) ? p.stagesPresent.filter(x=>x!==sid) : [...(p.stagesPresent||[]), sid]; saveNow(); c.classList.toggle('on'); });
  $$('[data-ppthread]',root).forEach(c => c.onclick = () => { const tid = c.dataset.ppthread; p.threadsLinked = (p.threadsLinked||[]).includes(tid) ? p.threadsLinked.filter(x=>x!==tid) : [...(p.threadsLinked||[]), tid]; saveNow(); c.classList.toggle('on'); });
  $$('[data-ppvalue]',root).forEach(c => c.onclick = () => { const vid = c.dataset.ppvalue; p.valuesEmbodied = (p.valuesEmbodied||[]).includes(vid) ? p.valuesEmbodied.filter(x=>x!==vid) : [...(p.valuesEmbodied||[]), vid]; saveNow(); c.classList.toggle('on'); });
  $$('[data-ppenergy]',root).forEach(b => b.onclick = () => { p.energyStanding = p.energyStanding === b.dataset.ppenergy ? '' : b.dataset.ppenergy; saveNow(); rerender(); });
  $$('[data-pf]',root).forEach(b => b.onclick = () => { const k = b.dataset.pf; const latest = (p[k]||[]).slice(-1)[0]; const m = openModal(`<h2>A new version</h2><textarea class="ta" id="pfText" style="min-height:160px">${esc(latest?.text||'')}</textarea><p class="faint" style="font-size:.78rem">The previous version is kept.</p><div class="row" style="justify-content:flex-end"><button class="btn primary" id="pfSave">Keep</button></div>`); m.querySelector('#pfSave').onclick = () => { const t = m.querySelector('#pfText').value.trim(); if(!t) return; p[k] = p[k]||[]; p[k].push({date:today(),text:t}); saveNow(); m.remove(); rerender(); sound('save'); }; });
  $('#ppGiftIdea').onclick = () => { p.giftIdeas.push(''); saveNow(); rerender(); setTimeout(()=>{ const n = document.querySelectorAll('.ed[data-path*="giftIdeas"]'); n.length && beginEdit(n[n.length-1]); },60); };
  $$('[data-gideldel]',root).forEach(b => b.onclick = () => { const i = +b.dataset.gideldel; requestDelete({label:'Gift idea', node:b.closest('.row'), remove:()=>{ const g = p.giftIdeas.splice(i,1)[0]; return () => p.giftIdeas.splice(i,0,g); }}); });
  $('#ppGiftLog').onclick = () => { const m = openModal(`<h2>A gift</h2><div class="stack"><select class="sel" id="glDir"><option value="given">I gave it</option><option value="received">I received it</option></select><input class="inp" id="glWhat" placeholder="what was it?" autofocus><input class="inp" type="date" id="glDate" value="${today()}"><div class="row" style="justify-content:flex-end"><button class="btn primary" id="glSave">Log it</button></div></div>`,'narrow'); m.querySelector('#glSave').onclick = () => { const what = m.querySelector('#glWhat').value.trim(); if(!what) return; p.giftsLog.push({direction:m.querySelector('#glDir').value, what, date:m.querySelector('#glDate').value||today()}); saveNow(); m.remove(); rerender(); }; };
  $$('[data-glogdel]',root).forEach(b => b.onclick = () => { const i = +b.dataset.glogdel; requestDelete({label:'Gift', node:b.closest('.row'), remove:()=>{ const g = p.giftsLog.splice(i,1)[0]; return () => p.giftsLog.splice(i,0,g); }}); });
  $('#ppDel').onclick = () => requestDelete({label:p.name, remove: () => {
    const touched = S.entries.filter(e => (e.links?.people||[]).includes(p.id));
    touched.forEach(e => e.links.people = e.links.people.filter(x => x !== p.id));
    const ints2 = S.interactions.filter(i => i.personId === p.id);
    S.interactions = S.interactions.filter(i => i.personId !== p.id);
    const back = spliceOut(S.people, x => x.id === p.id);
    return () => { back(); S.interactions.push(...ints2); touched.forEach(e => e.links.people.push(p.id)); };
  }, after: () => navigate('#/people')});
  bindRecImages(root);
}
hooks.pint = (id, oldV, v) => { const p = byId(S.people, id); if(p){ p.details.interests = v.split(',').map(x=>x.trim()).filter(Boolean); saveNow(); } };
function openPersonModal(ex){
  const p = ex || newPerson();
  const m = openModal(`<h2>${ex?'Edit':'Someone who matters'}</h2><div class="stack">
    <div class="grid c2" style="gap:10px">
      <div class="field"><label>Name</label><input class="inp serif-lg" id="pName" value="${esc(p.name)}" autofocus></div>
      <div class="field"><label>What you call them</label><input class="inp" id="pNick" value="${esc(p.nickname||'')}" placeholder="optional"></div>
    </div>
    <div class="field"><label>Relationship — in your own words</label><input class="inp" id="pRel" value="${esc(p.relationship==='friend'&&!ex?'':p.relationship)}" placeholder="mother · best friend since 独 Solitude · the person I want to become" list="pRelList"><datalist id="pRelList">${relationships().map(r=>`<option value="${esc(r)}">`).join('')}</datalist></div>
    <div class="grid c3" style="gap:10px">
      <div class="field"><label>Ring</label><select class="sel" id="pCircle">${Object.entries(CIRCLES).map(([k,c])=>`<option value="${k}" ${p.circle===k?'selected':''}>${c[0]} ${c[1]}</option>`).join('')}</select></div>
      <div class="field"><label>Status</label><select class="sel" id="pStatus">${Object.entries(PERSON_STATUS).map(([k,c])=>`<option value="${k}" ${p.status===k?'selected':''}>${c[0]} ${c[1]}</option>`).join('')}</select></div>
      <div class="field"><label>In touch how often</label><select class="sel" id="pFreq"><option value="">no rhythm</option>${Object.keys(FREQUENCIES).map(k=>`<option value="${k}" ${p.desiredFrequency===k?'selected':''}>${k}</option>`).join('')}</select></div>
    </div>
    <div class="grid c2" style="gap:10px">
      <div class="field"><label>Birthday</label><input class="inp" type="date" id="pBday" value="${p.birthday||''}"></div>
      <div class="field"><label>Tags</label><input class="inp mono" id="pTags" value="${esc((p.tags||[]).map(t=>'#'+t).join(' '))}" placeholder="#climbing #nus"></div>
    </div>
  </div><div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn primary" id="pSave">${ex?'Save':'Add'}</button></div>`, 'narrow');
  m.querySelector('#pCircle').onchange = () => { if(m.querySelector('#pCircle').value === 'aspirational') m.querySelector('#pStatus').value = 'notyetmet'; };
  m.querySelector('#pSave').onclick = () => {
    const name = m.querySelector('#pName').value.trim(); if(!name){ toast('A name, at least.'); return; }
    const rel = m.querySelector('#pRel').value.trim() || 'friend'; addRelationship(rel);
    Object.assign(p, {name, nickname:m.querySelector('#pNick').value.trim(), relationship:rel,
      circle:m.querySelector('#pCircle').value, status:m.querySelector('#pStatus').value, desiredFrequency:m.querySelector('#pFreq').value || null,
      birthday:m.querySelector('#pBday').value || null, tags:normTags(m.querySelector('#pTags').value.split(/[\s,]+/))});
    if(!ex) S.people.push(p);
    saveNow(); m.remove(); sound('success');
    if(currentRoute === 'people') rerender(); else navigate('#/people/' + p.id);
  };
}
function openInteractionModal(ex, personId){
  if(!S.people.length){ toast('Add someone first.'); return; }
  const i = ex || {id:uid(), personId: personId || S.people[0].id, date:today(), type:'met_in_person', description:'', mood:null, energy:'', quality:'', followUp:null, followUpDone:false};
  const m = openModal(`<h2>${ex?'Interaction':'What happened'}</h2><div class="stack">
    <div class="grid c3" style="gap:10px">
      <div class="field"><label>Who</label><select class="sel" id="inPerson">${S.people.map(p=>`<option value="${p.id}" ${i.personId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div>
      <div class="field"><label>When</label><input class="inp" type="date" id="inDate" value="${i.date}"></div>
      <div class="field"><label>How</label><select class="sel" id="inType">${Object.entries(INTERACTION_TYPES).map(([k,v])=>`<option value="${k}" ${i.type===k?'selected':''}>${v[0]} ${v[1]}</option>`).join('')}</select></div>
    </div>
    <div class="field"><label>What you talked about, or did</label><textarea class="ta" id="inDesc" placeholder="The bit worth remembering — what they said, not what you did." style="min-height:90px">${esc(i.description)}</textarea></div>
    <div class="field"><label>Quality</label><div class="chip-row">${QUALITY_TAGS.map(x=>`<button type="button" class="chip click ${i.quality===x?'on':''}" data-inquality="${x}">${x}</button>`).join('')}</div></div>
    <div class="field"><label>Energy — after this, did you feel</label><div class="resonance-scale" id="inEnergyRow">${Object.entries(ENERGY_READINGS).map(([k,x])=>`<button style="--c:${x[2]}" class="${i.energy===k?'on':''}" data-inenergy="${k}">${x[0]} ${x[1]}</button>`).join('')}</div></div>
    <div class="field"><label>Anything to follow up</label><input class="inp" id="inFollow" value="${esc(i.followUp||'')}" placeholder="send them that article · ask how the interview went"></div>
    <div class="row between" style="margin-top:6px">${ex?'<button class="btn sm ghost danger" id="inDel">Delete</button>':'<span></span>'}<button class="btn primary" id="inSave">${ex?'Save':'Log it'}</button></div>
  </div>`, 'narrow');
  attachDictationIn(m);
  let quality = i.quality, energy = i.energy;
  m.querySelectorAll('[data-inquality]').forEach(b => b.onclick = () => { quality = quality === b.dataset.inquality ? '' : b.dataset.inquality; m.querySelectorAll('[data-inquality]').forEach(x => x.classList.toggle('on', x.dataset.inquality === quality)); });
  m.querySelectorAll('[data-inenergy]').forEach(b => b.onclick = () => { energy = energy === b.dataset.inenergy ? '' : b.dataset.inenergy; m.querySelectorAll('[data-inenergy]').forEach(x => x.classList.toggle('on', x.dataset.inenergy === energy)); });
  m.querySelector('#inSave').onclick = () => {
    Object.assign(i, {personId:m.querySelector('#inPerson').value, date:m.querySelector('#inDate').value || today(),
      type:m.querySelector('#inType').value, description:m.querySelector('#inDesc').value.trim(), quality, energy,
      followUp:m.querySelector('#inFollow').value.trim() || null});
    if(!ex) S.interactions.push(i);
    const p = byId(S.people, i.personId); if(p) p.lastInteraction = lastInteractionDate(p.id);
    saveNow(); m.remove(); sound('success'); rerender();
  };
  if(ex) m.querySelector('#inDel').onclick = () => { m.remove(); requestDelete({label:i.description || 'this interaction', remove:()=>spliceOut(S.interactions, x=>x.id===i.id)}); };
}
