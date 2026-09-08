/* ============================================================
   6. COMMONPLACE BOOK — journals
   ============================================================ */
routes.journals = function(root, params){
  const type = params[0] || S._journal || 'reflection'; S._journal = type;
  const j = S.journals.find(x=>x.type===type) || S.journals[0];
  if(type === 'letter') registerPageEntry({pageName:'Journals', addLabel:'Seal a letter', defaultEntryType:'letter', prefilledFields:{}, options:[{icon:'✉', label:'Seal a letter', desc:'To be opened on a date you choose.', run:()=>openLetterModal()}]});
  else if(type === 'decision') registerPageEntry({pageName:'Journals', addLabel:'Log a decision', defaultEntryType:'decision', prefilledFields:{}, options:[{icon:'⚖', label:'Log a decision', desc:'Your reasoning now, so you can grade it later.', run:()=>openDecisionModal()}]});
  else if(type === 'quote') registerPageEntry({pageName:'Journals', addLabel:'New quote or saved link', defaultEntryType:'quote', prefilledFields:{journalType:'quote'}, options:[{label:'New quote', run:()=>EntryActions.libraryQuote()}]});
  else registerPageEntry({pageName:'Journals', addLabel:`New ${typeName(type).toLowerCase()}`, defaultEntryType:type, prefilledFields:{journalType:type}, options:[{label:'New entry', run:(pre)=>openEntryModal({type:pre.journalType, allowedTypes:[pre.journalType], heading:`New ${typeName(pre.journalType).toLowerCase()}`})}]});
  const all = sortEntries(S.entries.filter(e=>e.type===type));
  const special = type === 'letter' ? 'letters' : type === 'decision' ? 'decisions' : null;
  const q = (S._jq||'').toLowerCase(); const from = S._jfrom||'', to = S._jto||''; const tag = S._jtag||'';
  const filtered = all.filter(e => (!q || (e.title+' '+e.body).toLowerCase().includes(q)) && (!from || (e.occurredAt||'') >= from) && (!to || (e.occurredAt||'').slice(0,10) <= to) && (!tag || JSON.stringify(e.links).includes(tag)));
  const otd = onThisDay().filter(e=>e.type===type);
  const dimOpts = [...S.stages.map(s=>[s.id,s.char+' '+s.name]),...S.threads.map(t=>[t.id,'thread · '+t.name]),...S.values.map(v=>[v.id,'value · '+v.name]),...S.visions.map(v=>[v.id,'vision · '+v.name]),...S.skills.map(s=>[s.id,'skill · '+s.name]),...S.projects.map(p=>[p.id,'project · '+p.name])];
  root.innerHTML = `<div class="page">
    <div class="page-head"><h1>Journals</h1></div>
    <div class="journal-layout">
      <div class="jnav">${S.journals.map(x=>`<button class="${x.type===type?'active':''}" data-go="#/journals/${x.type}"><span>${typeIcon(x.type)} ${esc(x.name)}</span><span class="n">${S.entries.filter(e=>e.type===x.type).length}</span></button>`).join('')}<button id="jNew" style="color:var(--faint)">+ new journal type</button><button id="jManage" style="color:var(--faint);font-size:.75rem">manage journals…</button></div>
      <div>
        ${otd.length?`<div class="otd rv"><div class="sc">On this day</div>${otd.slice(0,2).map(e=>`<div class="serif" style="font-size:1.05rem;margin-top:6px">${esc(fmtDate(e.occurredAt,'med'))} — ${esc(e.title||e.body.slice(0,120))}</div>`).join('')}</div>`:`<div class="otd rv"><div class="sc">On this day</div><div class="quote">No ${esc(j.name.toLowerCase())} from this day in earlier years. You're making them now.</div></div>`}
        <div class="jtools rv"><input class="inp" id="jq" placeholder="search title & body" value="${esc(S._jq||'')}"><input class="inp" type="date" id="jfrom" value="${from}" style="max-width:150px"><input class="inp" type="date" id="jto" value="${to}" style="max-width:150px"><select class="sel" id="jtag" style="max-width:200px"><option value="">any link</option>${dimOpts.map(([id,n])=>`<option value="${id}" ${tag===id?'selected':''}>${esc(n)}</option>`).join('')}</select><button class="btn sm ghost" id="jRandom" title="random entry">🎲</button><span class="mono">${filtered.length} of ${all.length}</span></div>
        ${type==='question'?'<p class="quote">Questions you are living with. They don\'t get archived; they sit open until an answer accumulates, or the framing turns out to have been wrong.</p>':''}
        ${type==='dream'?dreamDictionaryHTML():''}
        ${type==='synchronicity'?'<p class="quote">Entries flagged “revisit later” resurface in the Today page prompts. Synchronicities often only make sense in retrospect.</p>':''}
        ${type==='manifestation'?'<p class="quote">Ask → It Is Given → Allow. When an intention arrives, offer it to the Vision Tree as fruit.</p>':''}
        <div id="jSpecial">${special === 'letters' ? sealedLettersHTML() : special === 'decisions' ? decisionListHTML() : ''}</div>
        <div id="jList">${special ? '' : filtered.map(e=>entryCard(e)+(type==='manifestation'&&e.extra?.status==='arrived'&&e.links.visions.length?`<div class="row" style="margin:-8px 0 12px"><button class="btn sm ghost" data-fruit="${e.id}">offer as fruit to ${esc(byId(S.visions,e.links.visions[0])?.name||'its vision')} →</button></div>`:'')).join('')||'<div class="empty">Nothing here matches. Loosen the filters, or write something.</div>'}</div>
      </div>
    </div></div>`;
  const refilter = debounce(()=>{ S._jq = $('#jq').value; S._jfrom = $('#jfrom').value; S._jto = $('#jto').value; S._jtag = $('#jtag').value; rerender(); $('#jq')?.focus(); }, 300);

  if(special === 'letters') bindSealedLetters(root);
  if(special === 'decisions') bindDecisionList(root);
  $('#jq').oninput = refilter; $('#jfrom').onchange = refilter; $('#jto').onchange = refilter; $('#jtag').onchange = refilter;
  $('#jRandom').onclick = () => { if(!all.length) return; const e = all[Math.floor(Math.random()*all.length)]; openPanel(`<div class="mono">a random ${esc(typeName(type).toLowerCase())}</div>${entryCard(e,{clamp:false})}`); $$('#panel .rv').forEach(n=>n.classList.add('in')); };
  $('#jManage').onclick = () => manageJournalsModal();
  $('#jNew').onclick = () => { const m = openModal(`<h2>A new journal</h2><div class="field"><label>Name</label><input class="inp" id="jnName" placeholder="e.g. Field Notes"></div><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="jnSave">Create</button></div>`,'narrow'); m.querySelector('#jnSave').onclick = () => { const n = m.querySelector('#jnName').value.trim(); if(!n) return; const t = n.toLowerCase().replace(/[^a-z0-9]+/g,'-'); if(!S.journals.find(x=>x.type===t)){ S.journals.push({type:t,name:n}); ENTRY_TYPES.push([t,n,'▫']); saveNow(); } m.remove(); navigate('#/journals/'+t); }; };
  root.querySelectorAll('[data-dictsym]').forEach(b => b.onclick = () => { S._jq = b.dataset.dictsym; rerender(); });
};

function deleteJournalType(t){
  const j = S.journals.find(x => x.type === t); if(!j) return;
  const count = S.entries.filter(e => e.type === t).length;
  if(t === 'uncategorized' && count){ toast('Uncategorized holds entries moved from deleted types. Delete or re-type those first.'); return; }
  const m = openModal(`<h2>Delete “${esc(j.name)}”?</h2><p class="muted">${count ? `This journal type holds ${count} entr${count===1?'y':'ies'}. Move entries of this type to 'Uncategorized' or delete them too?` : 'This journal type has no entries.'}</p><div class="row" style="justify-content:flex-end;margin-top:18px;flex-wrap:wrap"><button class="btn" data-x="no">Cancel</button>${count?`<button class="btn" data-x="move">Move to Uncategorized</button>`:''}<button class="btn destructive" data-x="del">${count?'Delete them too':'Delete'}</button></div>`,'narrow');
  m.querySelector('[data-x=no]').onclick = () => m.remove();
  const go = (deleteEntries) => { m.remove(); requestDelete({label: `Journal “${j.name}”`, skipConfirm: true, after: () => navigate('#/journals/' + (S.journals[0]?.type || 'reflection')), remove: () => {
    const moved = S.entries.filter(e => e.type === t); let removedEntries = [];
    if(deleteEntries){ removedEntries = moved.map(e => [S.entries.indexOf(e), e]); moved.forEach(e => S.entries.splice(S.entries.indexOf(e), 1)); }
    else { if(!S.journals.find(x => x.type === 'uncategorized')) S.journals.push({type:'uncategorized', name:'Uncategorized'}); moved.forEach(e => e.type = 'uncategorized'); }
    const back = spliceOut(S.journals, x => x.type === t);
    return () => { back(); if(deleteEntries) removedEntries.forEach(([i,e]) => S.entries.splice(Math.min(i, S.entries.length), 0, e)); else moved.forEach(e => e.type = t); };
  }}); };
  m.querySelector('[data-x=move]')?.addEventListener('click', () => go(false));
  m.querySelector('[data-x=del]').onclick = () => go(true);
}

function manageJournalsModal(){
  const m = openModal(`<h2>Journals</h2><p class="muted">Rename a journal by clicking its name. Reorder with the arrows.</p><div class="stack" style="gap:6px">${S.journals.map((j,i)=>`<div class="row between" style="padding:8px 0;border-top:1px dashed var(--line)"><span class="row"><span class="mono">${typeIcon(j.type)}</span><b class="serif" style="font-size:1.05rem">${ed(`journals.${i}.name`,{ph:'journal name'})}</b><span class="mono">${S.entries.filter(e=>e.type===j.type).length}</span></span><span class="row" style="gap:2px"><button class="tbtn" data-jup="${i}">↑</button><button class="tbtn" data-jdown="${i}">↓</button><button class="tbtn" data-jdel="${j.type}" style="color:var(--faint)">delete…</button></span></div>`).join('')}}</div>`,'narrow');
  m.querySelectorAll('[data-jup]').forEach(b => b.onclick = () => { const i=+b.dataset.jup; if(i>0){ [S.journals[i-1],S.journals[i]]=[S.journals[i],S.journals[i-1]]; saveNow(); m.remove(); rerender(); manageJournalsModal(); } });
  m.querySelectorAll('[data-jdown]').forEach(b => b.onclick = () => { const i=+b.dataset.jdown; if(i<S.journals.length-1){ [S.journals[i+1],S.journals[i]]=[S.journals[i],S.journals[i+1]]; saveNow(); m.remove(); rerender(); manageJournalsModal(); } });
  m.querySelectorAll('[data-jdel]').forEach(b => b.onclick = () => { m.remove(); deleteJournalType(b.dataset.jdel); });
}

/* ---------- the dream dictionary ----------
   Every symbol you have written down, counted. A personal dictionary nobody
   else could write, assembled from the dreams themselves. */
function dreamDictionaryHTML(){
  const tally = {};
  S.entries.filter(e => e.type === 'dream').forEach(e => (e.extra?.symbols || []).forEach(sm => {
    const k = String(sm).trim().toLowerCase(); if(k) tally[k] = (tally[k] || 0) + 1; }));
  const list = Object.entries(tally).sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])).slice(0, 24);
  const recurring = S.entries.filter(e => e.type === 'dream' && e.extra?.recurring).length;
  if(!list.length) return `<div class="otd rv"><div class="sc">Your dream dictionary</div><div class="quote">Tag a few dreams with their symbols — water, flying, a particular room — and the dictionary writes itself.</div></div>`;
  const max = list[0][1];
  return `<div class="otd rv"><div class="row between"><div class="sc">Your dream dictionary</div><span class="mono">${list.length} symbol${list.length===1?'':'s'}${recurring?` · ${recurring} recurring`:''}</span></div>
    <div class="tag-cloud" style="margin-top:8px">${list.map(([sm,n]) => `<button class="tag" data-dictsym="${esc(sm)}" style="--n:${Math.min(5, Math.ceil(n/max*5))}">${esc(sm)}<span class="n">${n}</span></button>`).join('')}</div>
    <div class="faint" style="font-size:.76rem;margin-top:6px">Click a symbol to read every dream that carried it.</div></div>`;
}
