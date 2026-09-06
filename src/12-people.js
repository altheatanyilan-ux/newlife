/* ============================================================
   PEOPLE — the ones a life is actually made of.
   Not a contact list and not a CRM. A person here is somewhere
   your attention goes: how you met, what they gave you, when you
   last thought about them on paper, and a board of their face.
   Tagging an entry with a person is the whole engine — everything
   else is read back out of what you have already written.
   ============================================================ */
const PERSON_TIERS = {
  inner:   ['◉','Inner ring',  'the few you would call at three in the morning', 30,  '#c25b5b'],
  close:   ['○','Close',       'people you want in the year, often',             60,  '#d4a44c'],
  orbit:   ['·','In orbit',    'good to keep warm, no obligation',               180, '#7f916a'],
  past:    ['◌','Past',        'mattered once; kept because it did',             0,   '#8a8d8f'],
};
function migratePeople(){
  // people used to be a list of bare names on entries and in settings
  if(!Array.isArray(S.people)) S.people = [];
  // any bare name left by an older version becomes a real record, keeping its id stable by name
  S.people = S.people.map(p => (typeof p === 'string' || !p || !p.id) ? newPerson(typeof p === 'string' ? p : (p?.name || '')) : p)
                     .filter(p => p.name || p.id);
  const seen = new Set();
  S.people = S.people.filter(p => { const k = p.name.toLowerCase(); if(!k) return true; if(seen.has(k)) return false; seen.add(k); return true; });
  S.people.forEach(p => { p.tier = PERSON_TIERS[p.tier] ? p.tier : 'orbit'; p.aka = p.aka || []; p.relation = p.relation || ''; p.met = p.met || ''; p.gave = p.gave || ''; p.owe = p.owe || ''; p.notes = p.notes || ''; p.birthday = p.birthday || ''; });
  // fold free-text names on entries into real records, keeping the text
  S.entries.forEach(e => {
    e.links = e.links || {}; e.links.people = Array.isArray(e.links.people) ? e.links.people : [];
    (e.people || []).forEach(n => {
      const nm = String(n).trim(); if(!nm) return;
      let p = S.people.find(x => x.name.toLowerCase() === nm.toLowerCase() || (x.aka||[]).some(a => a.toLowerCase() === nm.toLowerCase()));
      if(!p){ p = newPerson(nm); S.people.push(p); }
      if(!e.links.people.includes(p.id)) e.links.people.push(p.id);
    });
  });
}
function newPerson(name = ''){ return {id:uid(), name, aka:[], relation:'', tier:'orbit', birthday:'', met:'', gave:'', owe:'', notes:'', createdAt:new Date().toISOString()}; }
function personEntries(id){ return sortEntries(S.entries.filter(e => (e.links?.people||[]).includes(id))); }
function personLastSeen(id){ const es = personEntries(id); return es.length ? (es[0].occurredAt || es[0].createdAt || '').slice(0,10) : null; }
function personGoneQuiet(p){
  const cadence = PERSON_TIERS[p.tier][3]; if(!cadence) return null;
  const last = personLastSeen(p.id); const d = last ? daysSince(last) : Infinity;
  return d > cadence ? {days:d, cadence} : null;
}
function personChip(id, {click = true} = {}){
  const p = byId(S.people, id); if(!p) return '';
  const t = PERSON_TIERS[p.tier];
  return `<a class="chip on${click?' click':''}" style="--c:${t[4]};text-decoration:none" href="#/people/${p.id}">${t[0]} ${esc(p.name)}</a>`;
}
routes.people = function(root, params){
  migratePeople();
  registerPageEntry({pageName:'People', addLabel:'Add a person', defaultEntryType:'person', prefilledFields:{}, options:[
    {icon:'☺', label:'Add a person', desc:'Someone your attention keeps going to.', run:()=>openPersonModal()},
    {icon:'✎', label:'Note about someone', desc:'A memory or reflection, tagged to them.', run:()=>openEntryModal({type:'reflection', allowedTypes:['reflection','memory','gratitude'], heading:'About someone', openLinks:true})}]});
  if(params[0]) return renderPersonPage(root, params[0]);
  const q = (S._pplq || '').toLowerCase();
  const list = S.people.filter(p => !q || `${p.name} ${p.relation} ${(p.aka||[]).join(' ')}`.toLowerCase().includes(q));
  const quiet = S.people.map(p => ({p, q: personGoneQuiet(p)})).filter(x => x.q).sort((a,b) => b.q.days - a.q.days);
  const byTier = t => list.filter(p => p.tier === t);
  const T = today();
  const soon = S.people.filter(p => p.birthday).map(p => {
    const [_, mm, dd] = (p.birthday.match(/(\d{2})-(\d{2})$/) || []); if(!mm) return null;
    const yr = parseDay(T).getFullYear(); let next = `${yr}-${mm}-${dd}`; if(next < T) next = `${yr+1}-${mm}-${dd}`;
    return {p, next, days: daysBetween(T, next)};
  }).filter(x => x && x.days <= 45).sort((a,b) => a.days - b.days);
  root.innerHTML = `<div class="page">
    <div class="page-head"><h1>People</h1><div class="sub">A life is mostly other people. Tag them in what you write and this room fills itself: who you have been thinking about, and who has gone quiet without you deciding it.</div></div>

    ${quiet.length || soon.length ? `<div class="grid c2 rv" style="margin-bottom:22px;align-items:start">
      ${quiet.length ? `<div class="card"><span class="sc">Gone quiet</span><p class="muted" style="font-size:.84rem">Not a reprimand — just what the record says. You set the rhythm for each ring yourself.</p>
        <div class="stack" style="gap:6px;margin-top:10px">${quiet.slice(0,6).map(({p,q}) => `<a class="row between quiet-row" href="#/people/${p.id}"><span>${PERSON_TIERS[p.tier][0]} ${esc(p.name)}</span><span class="mono">${q.days === Infinity ? 'never written about' : `${q.days}d — you meant every ${q.cadence}`}</span></a>`).join('')}</div></div>` : ''}
      ${soon.length ? `<div class="card"><span class="sc">Coming up</span><div class="stack" style="gap:6px;margin-top:10px">${soon.map(({p,next,days}) => `<a class="row between quiet-row" href="#/people/${p.id}"><span>${esc(p.name)}</span><span class="mono">${days === 0 ? 'today' : `in ${days}d · ${fmtDate(next,'med')}`}</span></a>`).join('')}</div></div>` : ''}
    </div>` : ''}

    <div class="row rv" style="gap:8px;margin-bottom:14px"><input class="inp" id="pplq" placeholder="search names and relations" value="${esc(S._pplq||'')}" style="flex:1;max-width:340px"><button class="btn sm primary" id="pplNew">＋ Add a person</button></div>

    ${Object.entries(PERSON_TIERS).map(([k,t]) => { const ps = byTier(k); if(!ps.length) return '';
      return `<section class="section rv"><div class="row between"><span class="sc" style="margin:0;color:${t[4]}">${t[0]} ${t[1]}</span><span class="mono">${esc(t[2])}</span></div>
        <div class="people-grid">${ps.map(p => { const last = personLastSeen(p.id); const n = personEntries(p.id).length; const bk = boardId('person', p.id);
          return `<a class="person-card" href="#/people/${p.id}" style="--c:${t[4]}">
            <div class="person-face">${boardCount(bk) ? `<img src="${esc(getBoard(bk).items.find(i=>i.kind!=='word')?.src || '')}" alt="">` : `<span>${esc((p.name||'?').trim()[0] || '?')}</span>`}</div>
            <div class="person-body"><b>${esc(p.name)}</b>${p.relation ? `<span class="mono">${esc(p.relation)}</span>` : ''}
              <span class="mono faint">${n ? `${n} entr${n===1?'y':'ies'} · ${last ? relDays(daysSince(last)) : ''}` : 'not written about yet'}</span></div>
          </a>`; }).join('')}</div></section>`; }).join('')}

    ${!S.people.length ? `<div class="empty rv">No one here yet. Add the handful of people your life actually turns on — then tag them when you write, and the rest of this page fills itself in.</div>` : ''}
  </div>`;
  $('#pplNew').onclick = () => openPersonModal();
  const q2 = $('#pplq'); q2.addEventListener('input', debounce(() => { S._pplq = q2.value; rerender(); const i = $('#pplq'); if(i){ i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 300));
};
function openPersonModal(existing){
  const p = existing || newPerson();
  const m = openModal(`<h2>${existing ? 'Edit person' : 'Someone who matters'}</h2><div class="stack">
    <div class="field"><label>Name</label><input class="inp serif-lg" id="pName" value="${esc(p.name)}" autofocus></div>
    <div class="grid c2" style="gap:10px">
      <div class="field"><label>Who they are to you</label><input class="inp" id="pRel" value="${esc(p.relation)}" placeholder="grandmother · the chef in Lisbon · oldest friend"></div>
      <div class="field"><label>Ring</label><select class="sel" id="pTier">${Object.entries(PERSON_TIERS).map(([k,t])=>`<option value="${k}" ${p.tier===k?'selected':''}>${t[0]} ${t[1]} — ${t[2]}</option>`).join('')}</select></div>
    </div>
    <div class="field"><label>Birthday (optional)</label><input class="inp" type="date" id="pBday" value="${esc(p.birthday)}"></div>
  </div><div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn primary" id="pSave">${existing ? 'Save' : 'Add'}</button></div>`, 'narrow');
  m.querySelector('#pSave').onclick = () => {
    const name = m.querySelector('#pName').value.trim(); if(!name){ toast('A name, at least.'); return; }
    Object.assign(p, {name, relation:m.querySelector('#pRel').value.trim(), tier:m.querySelector('#pTier').value, birthday:m.querySelector('#pBday').value});
    if(!existing) S.people.push(p);
    saveNow(); m.remove(); sound('success');
    if(currentRoute === 'people') rerender(); else navigate('#/people/' + p.id);
  };
}
function renderPersonPage(root, id){
  const p = byId(S.people, id); if(!p){ navigate('#/people'); return; }
  const t = PERSON_TIERS[p.tier]; const es = personEntries(id); const last = personLastSeen(id);
  const quiet = personGoneQuiet(p); const bk = boardId('person', p.id);
  const byYear = {}; es.forEach(e => { const y = (e.occurredAt||e.createdAt||'').slice(0,4); (byYear[y] = byYear[y] || []).push(e); });
  root.innerHTML = `<div class="page narrow" style="--c:${t[4]}">
    <div class="page-head"><div class="mono">${t[0]} ${esc(t[1].toLowerCase())}${p.relation ? ` · ${esc(p.relation)}` : ''}</div><h1>${ed(`people.#${p.id}.name`)}</h1>
      <div class="sub">${es.length ? `${es.length} entr${es.length===1?'y':'ies'} mention them${last ? `, most recently ${relDays(daysSince(last))}` : ''}.` : 'Nothing written about them yet.'}</div></div>

    ${quiet ? `<div class="card rv late-card" style="margin-bottom:18px"><b class="serif">It has been ${quiet.days === Infinity ? 'a while' : `${quiet.days} days`}.</b><div class="muted" style="font-size:.88rem;margin-top:4px">You put them in the ${esc(t[1].toLowerCase())} ring, which you set at about every ${quiet.cadence} days. No obligation — just the record noticing.</div></div>` : ''}

    <div class="grid c2 rv" style="align-items:start;margin-bottom:20px">
      <div class="card"><span class="sc">How we met</span>${ed(`people.#${p.id}.met`, {multi:true, ph:'Where, when, and what the first hour was like.'})}</div>
      <div class="card"><span class="sc">What they gave me</span>${ed(`people.#${p.id}.gave`, {multi:true, ph:'A habit, a sentence, a door opened. Be specific.'})}</div>
    </div>
    <div class="grid c2 rv" style="align-items:start;margin-bottom:20px">
      <div class="card"><span class="sc">What I owe them</span>${ed(`people.#${p.id}.owe`, {multi:true, ph:'A call, a thank-you, a debt you have not named.'})}</div>
      <div class="card"><span class="sc">Ring &amp; details</span>
        <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap"><select class="sel" style="width:auto" id="ppTier">${Object.entries(PERSON_TIERS).map(([k,x])=>`<option value="${k}" ${p.tier===k?'selected':''}>${x[0]} ${x[1]}</option>`).join('')}</select>
          <span class="mono">birthday</span>${ed(`people.#${p.id}.birthday`, {ph:'YYYY-MM-DD', cls:'mono'})}</div>
        <div class="field" style="margin-top:10px"><label>Also known as</label>${ed(`people.#${p.id}._aka`, {ph:'comma separated', cls:'mono', hook:'paka:'+p.id})}</div>
        <div class="field" style="margin-top:10px"><label>Relation</label>${ed(`people.#${p.id}.relation`, {ph:'who they are to you'})}</div></div>
    </div>

    <section class="section rv">${boardHTML(bk, {title:'Their board', hint:'A face, a place, their handwriting.', compact:true})}</section>

    <section class="section rv"><span class="sc">Notes</span><div class="card">${ed(`people.#${p.id}.notes`, {multi:true, mdr:true, cls:'prose', ph:'Anything that does not belong under the headings above.'})}</div></section>

    <section class="section rv"><div class="row between"><span class="sc" style="margin:0">Where they appear</span><button class="btn sm ghost" id="ppWrite">write about them</button></div>
      ${es.length ? Object.keys(byYear).sort().reverse().map(y => `<div class="year-block"><div class="year-label mono">${esc(y)}</div>${byYear[y].map(e => entryCard(e)).join('')}</div>`).join('')
        : '<div class="empty">Tag them in an entry — in the entry form, under Connect this entry — and everything you have written about them collects here.</div>'}</section>

    ${moreSection(`<div class="danger-zone"><span>This removes the person and untags them from your entries. What you wrote stays.</span><button class="btn sm ghost danger" id="ppDel">Remove this person</button></div>`)}
  </div>`;
  p._aka = (p.aka || []).join(', ');
  $('#ppTier').onchange = e => { p.tier = e.target.value; saveNow(); rerender(); };
  $('#ppWrite').onclick = () => openEntryModal({type:'reflection', allowedTypes:['reflection','memory','gratitude','letter'], heading:`About ${p.name}`, links:{people:[p.id]}, openLinks:true});
  $('#ppDel').onclick = () => requestDelete({label:p.name, remove: () => {
    const touched = S.entries.filter(e => (e.links?.people||[]).includes(p.id));
    touched.forEach(e => e.links.people = e.links.people.filter(x => x !== p.id));
    const back = spliceOut(S.people, x => x.id === p.id);
    return () => { back(); touched.forEach(e => e.links.people.push(p.id)); };
  }, after: () => navigate('#/people')});
  bindBoard(root);
}
hooks.paka = (id, oldV, v) => { const p = byId(S.people, id); if(p){ p.aka = v.split(',').map(x=>x.trim()).filter(Boolean); saveNow(); } };
