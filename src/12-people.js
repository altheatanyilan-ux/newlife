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
const CIRCLES = {
  inner:  ['◉','Inner',  'the few you would call at three in the morning', 5,  '#c25b5b'],
  middle: ['○','Middle', 'the people you want in your year, often',        15, '#d4a44c'],
  outer:  ['·','Outer',  'the wider network — good to keep warm',          50, '#7f916a'],
};
const FREQUENCIES = {weekly:7, biweekly:14, monthly:30, quarterly:91, yearly:365};
const INTERACTION_TYPES = {
  met_in_person:['◍','Met in person'], call:['☎','Call'], video_call:['▣','Video call'],
  text:['✎','Message'], email:['✉','Email'], social_media:['◎','Social'], other:['·','Other'],
};
function newPerson(name = ''){
  return {id:uid(), name, nickname:'', photo:null, relationship:'friend', circle:'outer', tags:[], birthday:null,
    contactInfo:{phone:'', email:'', social:[]},
    details:{interests:[], importantDates:[], notes:'', lifeUpdates:''},
    lastInteraction:null, desiredFrequency:null, createdAt:new Date().toISOString()};
}
function migratePeople(){
  if(!Array.isArray(S.people)) S.people = [];
  S.interactions = Array.isArray(S.interactions) ? S.interactions : [];
  S.people = S.people.map(p => {
    if(typeof p === 'string' || !p || !p.id) p = Object.assign(newPerson(typeof p === 'string' ? p : (p?.name || '')), {});
    const out = Object.assign(newPerson(p.name || ''), p);
    // the earlier tier model becomes a circle; "past" people go to the outer ring with no cadence
    if(p.tier) out.circle = {inner:'inner', close:'middle', orbit:'outer', past:'outer'}[p.tier] || 'outer';
    if(!CIRCLES[out.circle]) out.circle = 'outer';
    if(p.tier === 'past' && !out.desiredFrequency) out.desiredFrequency = null;
    if(!out.relationship) out.relationship = p.relation || 'friend';
    out.details = Object.assign({interests:[], importantDates:[], notes:'', lifeUpdates:''}, out.details || {});
    if(p.met && !out.details.notes) out.details.notes = `How we met. ${p.met}`;
    if(p.gave) out.details.lifeUpdates = [out.details.lifeUpdates, `What they gave me. ${p.gave}`].filter(Boolean).join('\n\n');
    if(p.owe) out.details.notes = [out.details.notes, `What I owe them. ${p.owe}`].filter(Boolean).join('\n\n');
    if(p.notes) out.details.notes = [out.details.notes, p.notes].filter(Boolean).join('\n\n');

    out.contactInfo = Object.assign({phone:'', email:'', social:[]}, out.contactInfo || {});
    out.tags = normTags((out.tags && out.tags.length) ? out.tags : (p.aka || []));
    delete out.tier; delete out.relation; delete out.met; delete out.gave; delete out.owe; delete out.notes; delete out.aka;
    return out;
  }).filter(p => p.name || p.id);
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
        mood:null, followUp:null, followUpDone:false, entryId:e.id});
    });
  });
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
function openFollowUps(){ return S.interactions.filter(i => i.followUp && !i.followUpDone).map(i => ({i, p:byId(S.people, i.personId)})).filter(x => x.p); }
function personInitials(p){ return (p.name||'?').trim().split(/\s+/).slice(0,2).map(w => w[0]).join('').toUpperCase(); }
function personChip(id){ const p = byId(S.people, id); if(!p) return ''; const c = CIRCLES[p.circle];
  return `<a class="chip on click" style="--c:${c[4]};text-decoration:none" href="#/people/${p.id}">${c[0]} ${esc(p.name)}</a>`; }

routes.people = function(root, params){
  migratePeople();
  registerPageEntry({pageName:'People', addLabel:'Add someone', defaultEntryType:'person', prefilledFields:{}, options:[
    {icon:'☺', label:'Add someone', desc:'Someone your attention keeps going to.', run:()=>openPersonModal()},
    {icon:'◍', label:'Log an interaction', desc:'You saw them, called them, wrote to them.', run:()=>openInteractionModal()}]});
  if(params[0]) return renderPersonPage(root, params[0]);
  const view = S._pplView || 'circles';
  const overdue = peopleNeedingAttention(); const bdays = birthdaysSoon(30); const follow = openFollowUps();
  root.innerHTML = `<div class="page">
    <div class="page-head row between"><div><h1>People</h1><div class="sub">Not a contact list. A record of who you are actually in touch with, what they told you, and where you have quietly drifted.</div></div>
      <div class="view-toggle">${[['circles','◎ Circles'],['list','▤ List'],['timeline','▬ Timeline']].map(([k,l])=>`<button class="${view===k?'on':''}" data-pplview="${k}">${l}</button>`).join('')}</div></div>

    ${overdue.length || bdays.length || follow.length ? `<div class="grid c3 rv" style="margin-bottom:20px;align-items:start">
      ${overdue.length ? `<div class="card"><span class="sc">Needs attention</span><div class="stack" style="gap:5px;margin-top:8px">${overdue.slice(0,5).map(({p,days,want})=>`<a class="quiet-row" href="#/people/${p.id}"><span>${CIRCLES[p.circle][0]} ${esc(p.name)}</span><span class="mono">${days===Infinity?'never':days+'d'} · wanted ${esc(want)}</span></a>`).join('')}</div>${overdue.length>5?`<button class="btn sm ghost" id="pplAll" style="margin-top:8px">see all ${overdue.length}</button>`:''}</div>` : ''}
      ${bdays.length ? `<div class="card"><span class="sc">Birthdays</span><div class="stack" style="gap:5px;margin-top:8px">${bdays.slice(0,5).map(({p,next,days})=>`<a class="quiet-row" href="#/people/${p.id}"><span>${esc(p.name)}</span><span class="mono">${days===0?'today':`in ${days}d · ${fmtDate(next,'short')}`}</span></a>`).join('')}</div></div>` : ''}
      ${follow.length ? `<div class="card"><span class="sc">Follow-ups</span><div class="stack" style="gap:5px;margin-top:8px">${follow.slice(0,5).map(({i,p})=>`<div class="quiet-row"><span><b>${esc(p.name)}</b> — ${esc(i.followUp)}</span><button class="btn sm ghost" data-fudone="${i.id}">done</button></div>`).join('')}</div></div>` : ''}
    </div>` : ''}

    <div id="pplBody"></div>
  </div>`;
  const body = $('#pplBody');
  ({circles:pplCircles, list:pplList, timeline:pplTimeline}[view])(body);
  $$('[data-pplview]',root).forEach(b => b.onclick = () => { S._pplView = b.dataset.pplview; rerender(); });
  $$('[data-fudone]',root).forEach(b => b.onclick = () => { byId(S.interactions, b.dataset.fudone).followUpDone = true; saveNow(); sound('success'); rerender(); });
  if($('#pplAll')) $('#pplAll').onclick = () => { S._pplView = 'list'; S._pplNeeds = true; rerender(); };
  reveal(body);
};
/* view 1: the concentric rings */
function pplCircles(box){
  const ring = k => S.people.filter(p => p.circle === k);
  const R = {inner:120, middle:225, outer:330};
  const SZ = {inner:56, middle:42, outer:32};
  box.innerHTML = `<div class="circle-map rv">
    <svg viewBox="0 0 760 760" class="cm-rings">${Object.entries(CIRCLES).map(([k,c])=>`<circle cx="380" cy="380" r="${R[k]}" fill="none" stroke="${c[4]}" stroke-opacity=".28" stroke-dasharray="3 7"/><text x="380" y="${380-R[k]+16}" text-anchor="middle" class="cm-lbl" style="fill:${c[4]}">${esc(c[1].toUpperCase())}</text>`).join('')}</svg>
    ${Object.entries(CIRCLES).map(([k,c]) => { const list = ring(k);
      return list.map((p,i) => { const a = -Math.PI/2 + i * 2*Math.PI / Math.max(list.length,1) + (k==='middle' ? .35 : k==='outer' ? .7 : 0);
        const x = 380 + Math.cos(a)*R[k], y = 380 + Math.sin(a)*R[k]; const od = personOverdue(p); const s = SZ[k];
        return `<button class="cm-person ${od?'overdue':''}" draggable="true" data-cmp="${p.id}" style="left:${(x/760*100).toFixed(2)}%;top:${(y/760*100).toFixed(2)}%;--s:${s}px;--c:${c[4]}" title="${esc(p.name)}${od?` · ${od.days===Infinity?'never written about':od.days+' days'}`:''}">
          ${p.photo?`<img src="${esc(p.photo)}" alt="">`:`<span>${esc(personInitials(p))}</span>`}
          <span class="cm-name">${esc(p.nickname || p.name.split(' ')[0])}</span>${od?'<span class="cm-warn">!</span>':''}</button>`; }).join('');
    }).join('')}
    ${Object.keys(CIRCLES).map(k=>`<div class="cm-drop" data-cmring="${k}" style="--rp:${(R[k]/760*100).toFixed(2)}"></div>`).join('')}
    ${!S.people.length ? '<div class="empty cm-empty">No one here yet. Start with five names — the ones you would actually call.</div>' : ''}
  </div>
  <div class="row rv" style="gap:14px;justify-content:center;margin-top:6px;flex-wrap:wrap">${Object.entries(CIRCLES).map(([k,c])=>`<span class="mono" style="color:${c[4]}">${c[0]} ${esc(c[1])} · ${ring(k).length}${c[3]?` of about ${c[3]}`:''}</span>`).join('')}<span class="faint mono">drag a face between rings to reclassify</span></div>`;
  $$('[data-cmp]',box).forEach(b => {
    b.onclick = () => navigate('#/people/' + b.dataset.cmp);
    b.addEventListener('dragstart', () => { window._cmDrag = b.dataset.cmp; b.classList.add('dragging'); });
    b.addEventListener('dragend', () => { b.classList.remove('dragging'); window._cmDrag = null; });
  });
  $$('[data-cmring]',box).forEach(r => {
    r.addEventListener('dragover', e => { e.preventDefault(); r.classList.add('over'); });
    r.addEventListener('dragleave', () => r.classList.remove('over'));
    r.addEventListener('drop', e => { e.preventDefault(); r.classList.remove('over');
      const p = byId(S.people, window._cmDrag); if(!p) return; p.circle = r.dataset.cmring; saveNow(); sound('click'); rerender(); });
  });
}
/* view 2: the directory */
function pplList(box){
  const f = S._pplF = S._pplF || {q:'', rel:'all', circle:'all', tag:'all', sort:'last'};
  if(S._pplNeeds){ f.needs = true; S._pplNeeds = false; }
  const tags = [...new Set(S.people.flatMap(p => p.tags || []))].sort();
  let list = S.people.filter(p => {
    if(f.rel !== 'all' && p.relationship !== f.rel) return false;
    if(f.circle !== 'all' && p.circle !== f.circle) return false;
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
      <select class="sel" id="plCircle"><option value="all">any circle</option>${Object.entries(CIRCLES).map(([k,c])=>`<option value="${k}" ${f.circle===k?'selected':''}>${c[1]}</option>`).join('')}</select>
      ${tags.length?`<select class="sel" id="plTag"><option value="all">any tag</option>${tags.map(t=>`<option value="${esc(t)}" ${f.tag===t?'selected':''}>#${esc(t)}</option>`).join('')}</select>`:''}
      <select class="sel" id="plSort">${[['last','losing touch first'],['name','by name'],['circle','by circle'],['birthday','next birthday']].map(([v,l])=>`<option value="${v}" ${f.sort===v?'selected':''}>${l}</option>`).join('')}</select>
      <button class="btn sm ${f.needs?'primary':'ghost'}" id="plNeeds">needs attention${f.needs?' ✓':''}</button>
      <button class="btn sm primary" id="plNew">＋ Person</button></div>
    <div class="ppl-list rv">${list.length ? list.map(p => { const c = CIRCLES[p.circle]; const od = personOverdue(p); const n = personInteractions(p.id).length;
      return `<a class="ppl-row ${od?'overdue':''}" href="#/people/${p.id}" style="--c:${c[4]}">
        <span class="ppl-face">${p.photo?`<img src="${esc(p.photo)}" alt="">`:esc(personInitials(p))}</span>
        <span class="ppl-name"><b>${esc(p.name)}</b>${p.nickname?`<span class="mono"> “${esc(p.nickname)}”</span>`:''}</span>
        <span class="mono ppl-rel">${esc(p.relationship)}</span>
        <span class="chip" style="--c:${c[4]}">${c[0]} ${esc(c[1])}</span>
        <span class="mono ppl-last ${od?'warn':''}">${p.lastInteraction ? relDays(daysSince(p.lastInteraction)) : 'never'}${od?' ⚠':''}</span>
        <span class="mono">${n} logged</span>
        <span class="tagrow">${(p.tags||[]).slice(0,3).map(t=>`<span class="tag">#${esc(t)}</span>`).join('')}</span></a>`; }).join('')
      : '<div class="empty">No one matches.</div>'}</div>`;
  const bind = (id,key) => { const el_ = $(id); if(el_) el_.onchange = () => { f[key] = el_.value; rerender(); }; };
  bind('#plRel','rel'); bind('#plCircle','circle'); bind('#plTag','tag'); bind('#plSort','sort');
  $('#plq').addEventListener('input', debounce(() => { f.q = $('#plq').value; rerender(); const i = $('#plq'); if(i){ i.focus(); i.setSelectionRange(i.value.length,i.value.length); } }, 320));
  $('#plNeeds').onclick = () => { f.needs = !f.needs; rerender(); };
  $('#plNew').onclick = () => openPersonModal();
}
/* view 3: the social journal */
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
      ${byYear[y].map(i => { const p = byId(S.people, i.personId); if(!p) return ''; const c = CIRCLES[p.circle]; const t = INTERACTION_TYPES[i.type] || INTERACTION_TYPES.other;
        return `<div class="int-row" data-intopen="${i.id}"><span class="ppl-face sm" style="--c:${c[4]}">${p.photo?`<img src="${esc(p.photo)}" alt="">`:esc(personInitials(p))}</span>
          <span class="int-body"><span class="row between"><b>${esc(p.name)}</b><span class="mono">${t[0]} ${esc(t[1])} · ${fmtDate(i.date,'med')}</span></span>
          <span class="int-desc">${esc(i.description || '—')}</span>
          ${i.followUp?`<span class="int-follow ${i.followUpDone?'done':''}">↪ ${esc(i.followUp)}</span>`:''}</span></div>`; }).join('')}</div>`).join('')
      : '<div class="empty rv">Nothing logged yet. Every entry you tag with someone shows up here too.</div>'}`;
  $('#ptPerson').onchange = e => { f.person = e.target.value; rerender(); };
  $('#ptType').onchange = e => { f.type = e.target.value; rerender(); };
  $('#ptNew').onclick = () => openInteractionModal();
  $$('[data-intopen]',box).forEach(r => r.onclick = () => openInteractionModal(byId(S.interactions, r.dataset.intopen)));
}

/* ---------- the person, in detail ---------- */
function renderPersonPage(root, id){
  const p = byId(S.people, id); if(!p){ navigate('#/people'); return; }
  const c = CIRCLES[p.circle]; const ints = personInteractions(id); const od = personOverdue(p);
  const bday = birthdaysSoon(400).find(x => x.p.id === id);
  const streak = (() => { let n = 0; let cursor = today();
    for(let w = 0; w < 52; w++){ const from = addDays(cursor, -7), has = ints.some(i => i.date > from && i.date <= cursor); if(!has) break; n++; cursor = from; } return n; })();
  const entries = sortEntries(S.entries.filter(e => (e.links?.people||[]).includes(id)));
  root.innerHTML = `<div class="page narrow" style="--c:${c[4]}">
    <div class="person-hero rv">
      <div class="ppl-face lg">${p.photo?`<img src="${esc(p.photo)}" alt="">`:esc(personInitials(p))}<button class="photo-btn" id="ppPhoto" title="add a photograph">▣</button><input type="file" accept="image/*" id="ppFile" hidden></div>
      <div style="flex:1;min-width:0">
        <h1 style="margin:0">${ed(`people.#${p.id}.name`)}</h1>
        ${p.nickname?`<div class="quote">“${esc(p.nickname)}”</div>`:''}
        <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap">
          ${relSelect('ppRel', p.relationship, 'style="width:auto"')}
          <select class="sel" style="width:auto" id="ppCircle">${Object.entries(CIRCLES).map(([k,x])=>`<option value="${k}" ${p.circle===k?'selected':''}>${x[0]} ${x[1]} ring</option>`).join('')}</select>
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

    <section class="section rv"><span class="sc">Remember</span>
      <div class="grid c2" style="align-items:start;margin-top:10px">
        <div class="card"><div class="k mono">Interests</div>${ed(`people.#${p.id}._interests`,{ph:'climbing, Ozu films, bad puns',hook:'pint:'+p.id})}
          <div class="k mono" style="margin-top:12px">Life updates — what they told you</div>${ed(`people.#${p.id}.details.lifeUpdates`,{multi:true,ph:'just got promoted · moving in March · their mother is ill'})}</div>
        <div class="card"><div class="k mono">Notes</div>${ed(`people.#${p.id}.details.notes`,{multi:true,mdr:true,cls:'prose',ph:'How you met. What they gave you. What you owe them. Anything you would be embarrassed to forget.'})}</div>
      </div>
      <div class="grid c2" style="align-items:start;margin-top:12px">
        <div class="card"><div class="row between"><span class="k mono">Important dates</span><button class="btn sm ghost" id="ppDate">＋ date</button></div>
          ${(p.details.importantDates||[]).length ? `<div class="stack" style="gap:5px;margin-top:8px">${p.details.importantDates.map((d,i)=>`<div class="row between"><span>${ed(`people.#${p.id}.details.importantDates.${i}.label`,{ph:'what it is'})}</span><span class="row">${ed(`people.#${p.id}.details.importantDates.${i}.date`,{ph:'YYYY-MM-DD',cls:'mono'})}<button class="del-x inline" data-dtdel="${i}">×</button></span></div>`).join('')}</div>` : '<div class="faint" style="font-size:.8rem;margin-top:6px">Anniversaries, the day you met, the day they helped.</div>'}
          <div class="k mono" style="margin-top:12px">Birthday</div>${ed(`people.#${p.id}.birthday`,{ph:'YYYY-MM-DD',cls:'mono'})}</div>
        <div class="card"><div class="k mono">How to reach them</div>
          <div class="spec-grid" style="margin-top:6px"><div><div class="k">phone</div>${ed(`people.#${p.id}.contactInfo.phone`,{ph:'—',cls:'mono'})}</div><div><div class="k">email</div>${ed(`people.#${p.id}.contactInfo.email`,{ph:'—',cls:'mono'})}</div></div>
          <div class="k mono" style="margin-top:12px">Tags</div><input class="inp mono" id="ppTags" value="${esc((p.tags||[]).map(t=>'#'+t).join(' '))}" placeholder="#climbing #singapore"></div>
      </div></section>

    <section class="section rv">${boardHTML(boardId('person', p.id), {title:'Their board', hint:'A face, a place, their handwriting.', compact:true})}</section>

    <section class="section rv"><div class="row between"><span class="sc" style="margin:0">Interactions</span><span class="mono">${ints.length}</span></div>
      ${ints.length ? `<div class="stack" style="gap:2px;margin-top:10px">${ints.map(i => { const t = INTERACTION_TYPES[i.type] || INTERACTION_TYPES.other;
        return `<div class="int-row" data-intopen="${i.id}"><span class="int-ico">${t[0]}</span><span class="int-body">
          <span class="row between"><span class="mono">${esc(t[1])} · ${fmtDate(i.date,'med')}</span>${i.mood?`<span class="status-pill">${esc(i.mood)}</span>`:''}</span>
          <span class="int-desc">${esc(i.description||'—')}</span>
          ${i.followUp?`<span class="int-follow ${i.followUpDone?'done':''}">↪ ${esc(i.followUp)}</span>`:''}</span>
          ${i.entryId?'<span class="mono int-src">from an entry</span>':''}</div>`; }).join('')}</div>`
        : '<div class="empty">Nothing logged. Tag them in a journal entry and it appears here automatically.</div>'}</section>

    ${entries.length ? `<section class="section rv"><span class="sc">Where they appear in what you write</span>${entries.slice(0,20).map(e=>entryCard(e)).join('')}</section>` : ''}

    ${moreSection(`<div class="danger-zone"><span>This removes the person, their interactions and their board. What you wrote stays.</span><button class="btn sm ghost danger" id="ppDel">Remove this person</button></div>`)}
  </div>`;
  p._interests = (p.details.interests || []).join(', ');
  bindRelSelect($('#ppRel'), v => { p.relationship = v; saveNow(); });
  $('#ppCircle').onchange = e => { p.circle = e.target.value; saveNow(); rerender(); };
  $('#ppFreq').onchange = e => { p.desiredFrequency = e.target.value || null; saveNow(); rerender(); };
  $('#ppLog').onclick = () => openInteractionModal(null, p.id);
  if($('#ppLogNow')) $('#ppLogNow').onclick = () => openInteractionModal(null, p.id);
  if($('#ppRemind')) $('#ppRemind').onclick = () => { S.tasks.push(newTask(`Reach out to ${p.name}`, today())); saveNow(); sound('success'); toast('Added to today\'s plan.'); };
  $('#ppWrite').onclick = () => openEntryModal({type:'reflection', allowedTypes:['reflection','memory','gratitude','letter'], heading:`About ${p.name}`, links:{people:[p.id]}, openLinks:true});
  $('#ppPhoto').onclick = () => $('#ppFile').click();
  $('#ppFile').onchange = e => { const f = e.target.files; e.target.value = ''; if(f?.length) readImages(f, src => { p.photo = src; saveNow(); rerender(); }); };
  $('#ppDate').onclick = () => { p.details.importantDates = p.details.importantDates || []; p.details.importantDates.push({label:'', date:''}); saveNow(); rerender(); };
  $$('[data-dtdel]',root).forEach(b => b.onclick = () => { const i = +b.dataset.dtdel; requestDelete({label:p.details.importantDates[i].label||'this date', node:b.closest('.row'), remove:()=>{ const g = p.details.importantDates.splice(i,1)[0]; return () => p.details.importantDates.splice(i,0,g); }}); });
  const tg = $('#ppTags'); tg.onchange = () => { p.tags = normTags(tg.value.split(/[\s,]+/)); saveNow(); };
  $$('[data-intopen]',root).forEach(r => r.onclick = () => openInteractionModal(byId(S.interactions, r.dataset.intopen)));
  $('#ppDel').onclick = () => requestDelete({label:p.name, remove: () => {
    const touched = S.entries.filter(e => (e.links?.people||[]).includes(p.id));
    touched.forEach(e => e.links.people = e.links.people.filter(x => x !== p.id));
    const ints2 = S.interactions.filter(i => i.personId === p.id);
    S.interactions = S.interactions.filter(i => i.personId !== p.id);
    const back = spliceOut(S.people, x => x.id === p.id);
    return () => { back(); S.interactions.push(...ints2); touched.forEach(e => e.links.people.push(p.id)); };
  }, after: () => navigate('#/people')});
  bindBoard(root);
}
hooks.pint = (id, oldV, v) => { const p = byId(S.people, id); if(p){ p.details.interests = v.split(',').map(x=>x.trim()).filter(Boolean); saveNow(); } };
function openPersonModal(ex){
  const p = ex || newPerson();
  const m = openModal(`<h2>${ex?'Edit':'Someone who matters'}</h2><div class="stack">
    <div class="grid c2" style="gap:10px">
      <div class="field"><label>Name</label><input class="inp serif-lg" id="pName" value="${esc(p.name)}" autofocus></div>
      <div class="field"><label>What you call them</label><input class="inp" id="pNick" value="${esc(p.nickname||'')}" placeholder="optional"></div>
    </div>
    <div class="grid c3" style="gap:10px">
      <div class="field"><label>Relationship</label>${relSelect('pRel', p.relationship)}</div>
      <div class="field"><label>Circle</label><select class="sel" id="pCircle">${Object.entries(CIRCLES).map(([k,c])=>`<option value="${k}" ${p.circle===k?'selected':''}>${c[0]} ${c[1]}</option>`).join('')}</select></div>
      <div class="field"><label>In touch how often</label><select class="sel" id="pFreq"><option value="">no rhythm</option>${Object.keys(FREQUENCIES).map(k=>`<option value="${k}" ${p.desiredFrequency===k?'selected':''}>${k}</option>`).join('')}</select></div>
    </div>
    <div class="grid c2" style="gap:10px">
      <div class="field"><label>Birthday</label><input class="inp" type="date" id="pBday" value="${p.birthday||''}"></div>
      <div class="field"><label>Tags</label><input class="inp mono" id="pTags" value="${esc((p.tags||[]).map(t=>'#'+t).join(' '))}" placeholder="#climbing #nus"></div>
    </div>
  </div><div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn primary" id="pSave">${ex?'Save':'Add'}</button></div>`, 'narrow');
  bindRelSelect(m.querySelector('#pRel'));
  m.querySelector('#pSave').onclick = () => {
    const name = m.querySelector('#pName').value.trim(); if(!name){ toast('A name, at least.'); return; }
    Object.assign(p, {name, nickname:m.querySelector('#pNick').value.trim(), relationship:m.querySelector('#pRel').value,
      circle:m.querySelector('#pCircle').value, desiredFrequency:m.querySelector('#pFreq').value || null,
      birthday:m.querySelector('#pBday').value || null, tags:normTags(m.querySelector('#pTags').value.split(/[\s,]+/))});
    if(!ex) S.people.push(p);
    saveNow(); m.remove(); sound('success');
    if(currentRoute === 'people') rerender(); else navigate('#/people/' + p.id);
  };
}
function openInteractionModal(ex, personId){
  if(!S.people.length){ toast('Add someone first.'); return; }
  const i = ex || {id:uid(), personId: personId || S.people[0].id, date:today(), type:'met_in_person', description:'', mood:null, followUp:null, followUpDone:false};
  const m = openModal(`<h2>${ex?'Interaction':'What happened'}</h2><div class="stack">
    <div class="grid c3" style="gap:10px">
      <div class="field"><label>Who</label><select class="sel" id="inPerson">${S.people.map(p=>`<option value="${p.id}" ${i.personId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div>
      <div class="field"><label>When</label><input class="inp" type="date" id="inDate" value="${i.date}"></div>
      <div class="field"><label>How</label><select class="sel" id="inType">${Object.entries(INTERACTION_TYPES).map(([k,v])=>`<option value="${k}" ${i.type===k?'selected':''}>${v[0]} ${v[1]}</option>`).join('')}</select></div>
    </div>
    <div class="field"><label>What you talked about, or did</label><textarea class="ta" id="inDesc" placeholder="The bit worth remembering — what they said, not what you did." style="min-height:90px">${esc(i.description)}</textarea></div>
    <div class="field"><label>How it felt</label><div class="chip-row">${['great','good','neutral','difficult'].map(x=>`<button type="button" class="chip click ${i.mood===x?'on':''}" data-inmood="${x}">${x}</button>`).join('')}</div></div>
    <div class="field"><label>Anything to follow up</label><input class="inp" id="inFollow" value="${esc(i.followUp||'')}" placeholder="send them that article · ask how the interview went"></div>
    <div class="row between" style="margin-top:6px">${ex?'<button class="btn sm ghost danger" id="inDel">Delete</button>':'<span></span>'}<button class="btn primary" id="inSave">${ex?'Save':'Log it'}</button></div>
  </div>`, 'narrow');
  attachDictationIn(m);
  let mood = i.mood;
  m.querySelectorAll('[data-inmood]').forEach(b => b.onclick = () => { mood = mood === b.dataset.inmood ? null : b.dataset.inmood; m.querySelectorAll('[data-inmood]').forEach(x => x.classList.toggle('on', x.dataset.inmood === mood)); });
  m.querySelector('#inSave').onclick = () => {
    Object.assign(i, {personId:m.querySelector('#inPerson').value, date:m.querySelector('#inDate').value || today(),
      type:m.querySelector('#inType').value, description:m.querySelector('#inDesc').value.trim(), mood,
      followUp:m.querySelector('#inFollow').value.trim() || null});
    if(!ex) S.interactions.push(i);
    const p = byId(S.people, i.personId); if(p) p.lastInteraction = lastInteractionDate(p.id);
    saveNow(); m.remove(); sound('success'); rerender();
  };
  if(ex) m.querySelector('#inDel').onclick = () => { m.remove(); requestDelete({label:i.description || 'this interaction', remove:()=>spliceOut(S.interactions, x=>x.id===i.id)}); };
}
