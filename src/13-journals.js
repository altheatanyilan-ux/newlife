/* ============================================================
   6. COMMONPLACE BOOK — journals
   ============================================================ */
routes.journals = function(root, params){
  const type = params[0] || S._journal || 'reflection'; S._journal = type;
  const j = S.journals.find(x=>x.type===type) || S.journals[0];
  if(type === 'quote') registerPageEntry({pageName:'Library', addLabel:'New quote or saved link', defaultEntryType:'quote', prefilledFields:{journalType:'quote'}, options:[{label:'New quote', run:()=>EntryActions.libraryQuote()}]});
  else registerPageEntry({pageName:'Journal', addLabel:`New ${typeName(type).toLowerCase()}`, defaultEntryType:type, prefilledFields:{journalType:type}, options:[{label:'New entry', run:(pre)=>openEntryModal({type:pre.journalType, allowedTypes:[pre.journalType], heading:`New ${typeName(pre.journalType).toLowerCase()}`})}]});
  const all = sortEntries(S.entries.filter(e=>e.type===type));
  const q = (S._jq||'').toLowerCase(); const from = S._jfrom||'', to = S._jto||''; const tag = S._jtag||'';
  const filtered = all.filter(e => (!q || (e.title+' '+e.body).toLowerCase().includes(q)) && (!from || (e.occurredAt||'') >= from) && (!to || (e.occurredAt||'').slice(0,10) <= to) && (!tag || JSON.stringify(e.links).includes(tag)));
  const otd = onThisDay().filter(e=>e.type===type);
  const dimOpts = [...S.stages.map(s=>[s.id,s.char+' '+s.name]),...S.threads.map(t=>[t.id,'thread · '+t.name]),...S.values.map(v=>[v.id,'value · '+v.name]),...S.visions.map(v=>[v.id,'vision · '+v.name]),...S.skills.map(s=>[s.id,'skill · '+s.name]),...S.projects.map(p=>[p.id,'project · '+p.name])];
  root.innerHTML = `<div class="page">
    <div class="page-head"><h1>Commonplace Book</h1><div class="sub">Append-only. Every entry can live in many rooms at once — link it, and the house connects.</div></div>
    <div class="journal-layout">
      <div class="jnav">${S.journals.map(x=>`<button class="${x.type===type?'active':''}" data-go="#/journals/${x.type}"><span>${typeIcon(x.type)} ${esc(x.name)}</span><span class="n">${S.entries.filter(e=>e.type===x.type).length}</span></button>`).join('')}<button id="jNew" style="color:var(--faint)">+ new journal type</button></div>
      <div>
        ${otd.length?`<div class="otd rv"><div class="sc">On this day</div>${otd.slice(0,2).map(e=>`<div class="serif" style="font-size:1.05rem;margin-top:6px">${esc(fmtDate(e.occurredAt,'med'))} — ${esc(e.title||e.body.slice(0,120))}</div>`).join('')}</div>`:`<div class="otd rv"><div class="sc">On this day</div><div class="quote">No ${esc(j.name.toLowerCase())} from this day in earlier years. You're making them now.</div></div>`}
        <div class="jtools rv"><input class="inp" id="jq" placeholder="search title & body" value="${esc(S._jq||'')}"><input class="inp" type="date" id="jfrom" value="${from}" style="max-width:150px"><input class="inp" type="date" id="jto" value="${to}" style="max-width:150px"><select class="sel" id="jtag" style="max-width:200px"><option value="">any link</option>${dimOpts.map(([id,n])=>`<option value="${id}" ${tag===id?'selected':''}>${esc(n)}</option>`).join('')}</select><button class="btn sm ghost" id="jRandom" title="random entry">🎲</button><span class="mono">${filtered.length} of ${all.length}</span></div>
        ${type==='question'?'<p class="quote">Questions you are living with. They don\'t get archived; they sit open until an answer accumulates.</p>':''}
        ${type==='synchronicity'?'<p class="quote">Entries flagged “revisit later” resurface in the Today page prompts. Synchronicities often only make sense in retrospect.</p>':''}
        ${type==='manifestation'?'<p class="quote">Ask → It Is Given → Allow. When an intention arrives, offer it to the Vision Tree as fruit.</p>':''}
        <div id="jList">${filtered.map(e=>entryCard(e)+(type==='manifestation'&&e.extra?.status==='arrived'&&e.links.visions.length?`<div class="row" style="margin:-8px 0 12px"><button class="btn sm ghost" data-fruit="${e.id}">offer as fruit to ${esc(byId(S.visions,e.links.visions[0])?.name||'its vision')} →</button></div>`:'')).join('')||'<div class="empty">Nothing here matches. Loosen the filters, or write something.</div>'}</div>
      </div>
    </div></div>`;
  const refilter = debounce(()=>{ S._jq = $('#jq').value; S._jfrom = $('#jfrom').value; S._jto = $('#jto').value; S._jtag = $('#jtag').value; rerender(); $('#jq')?.focus(); }, 300);
  $('#jq').oninput = refilter; $('#jfrom').onchange = refilter; $('#jto').onchange = refilter; $('#jtag').onchange = refilter;
  $('#jRandom').onclick = () => { if(!all.length) return; const e = all[Math.floor(Math.random()*all.length)]; openPanel(`<div class="mono">a random ${esc(typeName(type).toLowerCase())}</div>${entryCard(e,{clamp:false})}`); $$('#panel .rv').forEach(n=>n.classList.add('in')); };
  $('#jNew').onclick = () => { const m = openModal(`<h2>A new journal</h2><div class="field"><label>Name</label><input class="inp" id="jnName" placeholder="e.g. Field Notes"></div><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="jnSave">Create</button></div>`,'narrow'); m.querySelector('#jnSave').onclick = () => { const n = m.querySelector('#jnName').value.trim(); if(!n) return; const t = n.toLowerCase().replace(/[^a-z0-9]+/g,'-'); if(!S.journals.find(x=>x.type===t)){ S.journals.push({type:t,name:n}); ENTRY_TYPES.push([t,n,'▫']); saveNow(); } m.remove(); navigate('#/journals/'+t); }; };
  root.querySelectorAll('[data-fruit]').forEach(b => b.onclick = () => { const e = byId(S.entries,b.dataset.fruit); const v = byId(S.visions,e.links.visions[0]); if(!v) return; v.evidence.push({date:today(),text:`Manifestation arrived: ${e.title}`}); saveNow(); toast(`Logged as evidence on <b>${esc(v.name)}</b>.`); navigate('#/vision/'+v.id); });
};
