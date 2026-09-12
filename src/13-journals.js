/* ============================================================
   6. COMMONPLACE BOOK — journals
   ============================================================ */
/* Journals is now two ways of looking at the same entries. What was the
   Timeline is the second: the stages an entry belongs to, and the threads
   that run between them. It is not a separate room because it was never
   separate material — the memories on the spine are journal entries filed
   to a stage. */
const JOURNAL_VIEWS = [['entries','✍','Journals'], ['timeline','◷','Timeline']];
/* Five of the fourteen journals were doors into rooms that already exist, or
   into nothing at all. Memories and life events are the Timeline's own
   material, filed to a stage. Media is the Library. The practice log is
   written from the Skill Tree. Uncategorized is a lost-property box that a
   journal list should not open with.

   They are hidden rather than deleted: an install with entries of these kinds
   keeps every one of them, they still appear on the Timeline, in the Library,
   on a skill, and in search, and a journal emptied by "delete this journal"
   still has somewhere to put its orphans. */
const JOURNAL_HIDDEN = ['uncategorized', 'progress', 'lifeevent', 'memory', 'media'];
function journalsShown(){ return S.journals.filter(j => !JOURNAL_HIDDEN.includes(j.type)); }
function journalDefault(){ return (journalsShown()[0] || S.journals[0] || {type:'reflection'}).type; }
/* <!--tools--> is where the Timeline view drops its two toggles, so the page
   keeps one banner instead of growing a second empty one beneath it. */
function journalsHeadHTML(view){
  return `<div class="page-head jr-head"><h1>Journals</h1>
    <div class="jr-views">${JOURNAL_VIEWS.map(([k, ic, n]) =>
      `<button class="${view === k ? 'on' : ''}" data-jrview="${k}" title="${n}">${ic} <span>${n}</span></button>`).join('')}</div>
    <!--tools--></div>`;
}
/* 1 and 2 switch the view, the same grammar every other room uses. */
document.addEventListener('keydown', ev => {
  if(parseHash().name !== 'journals') return;
  if(ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if(typeof isTyping === 'function' && isTyping()) return;
  if(document.querySelector('#modals .overlay, #panel')) return;
  if(ev.code === 'Digit1'){ ev.preventDefault(); navigate('#/journals/' + (S._journal || journalDefault())); }
  else if(ev.code === 'Digit2'){ ev.preventDefault(); navigate('#/journals/timeline'); }
}, true);
function bindJournalViews(root){
  $$('[data-jrview]', root).forEach(b => b.onclick = () => {
    navigate(b.dataset.jrview === 'timeline' ? '#/journals/timeline' : '#/journals/' + (S._journal || journalDefault()));
  });
}
routes.journals = function(root, params){
  if(params[0] === 'timeline'){
    renderTimeline(root, params[1] === 'threads' ? 'threads' : 'stages',
      {heading: journalsHeadHTML('timeline'), base: '#/journals/timeline'});
    bindJournalViews(root);
    return;
  }
  let type = params[0] || S._journal || journalDefault();
  /* an address or a remembered choice naming a hidden journal lands on the
     first real one instead of a page nothing in the sidebar points at */
  if(JOURNAL_HIDDEN.includes(type)) type = journalDefault();
  S._journal = type;
  const j = S.journals.find(x=>x.type===type) || journalsShown()[0] || S.journals[0];
  if(type === 'letter') registerPageEntry({pageName:'Journals', addLabel:'Seal a letter', defaultEntryType:'letter', prefilledFields:{}, options:[{icon:'✉', label:'Seal a letter', desc:'To be opened on a date you choose.', run:()=>openLetterModal()}]});
  else if(type === 'decision') registerPageEntry({pageName:'Journals', addLabel:'Log a decision', defaultEntryType:'decision', prefilledFields:{}, options:[{icon:'⚖', label:'Log a decision', desc:'Your reasoning now, so you can grade it later.', run:()=>openDecisionModal()}]});
  else if(type === 'quote') registerPageEntry({pageName:'Journals', addLabel:'New quote or saved link', defaultEntryType:'quote', prefilledFields:{journalType:'quote'}, options:[{label:'New quote', run:()=>EntryActions.libraryQuote()}]});
  else registerPageEntry({pageName:'Journals', addLabel:`New ${typeName(type).toLowerCase()}`, defaultEntryType:type, prefilledFields:{journalType:type}, options:[{label:'New entry', run:(pre)=>openEntryModal({type:pre.journalType, allowedTypes:[pre.journalType], heading:`New ${typeName(pre.journalType).toLowerCase()}`})}]});
  const all = sortEntries(S.entries.filter(e=>e.type===type));
  const special = type === 'letter' ? 'letters' : type === 'decision' ? 'decisions' : null;
  const q = (S._jq||'').toLowerCase(); const from = S._jfrom||'', to = S._jto||''; const tag = S._jtag||'';
  const filtered = all.filter(e => (!q || (e.title+' '+e.body).toLowerCase().includes(q)) && (!from || (e.occurredAt||'') >= from) && (!to || (e.occurredAt||'').slice(0,10) <= to) && (!tag || JSON.stringify(e.links).includes(tag)));
  const otd = onThisDay().filter(e=>e.type===type);
  const dimOpts = [...S.stages.map(s=>[s.id,s.char+' '+s.name]),...S.threads.map(t=>[t.id,'thread · '+t.name]),...S.values.map(v=>[v.id,'value · '+v.name]),...S.skills.map(s=>[s.id,'skill · '+s.name]),...S.projects.map(p=>[p.id,'project · '+p.name])];
  root.innerHTML = `<div class="page">
    ${journalsHeadHTML('entries')}
    <div class="journal-layout">
      <div class="jnav">${journalsShown().map(x=>`<button class="${x.type===type?'active':''}" data-go="#/journals/${x.type}"><span>${typeIcon(x.type)} ${esc(x.name)}</span><span class="n">${S.entries.filter(e=>e.type===x.type).length}</span></button>`).join('')}<button id="jNew" style="color:var(--faint)">+ new journal type</button><button id="jManage" style="color:var(--faint);font-size:.75rem">manage journals…</button></div>
      <div>
        ${otd.length?`<div class="otd rv"><div class="sc">On this day</div>${otd.slice(0,2).map(e=>`<div class="serif" style="font-size:1.05rem;margin-top:6px">${esc(fmtDate(e.occurredAt,'med'))} — ${esc(e.title||e.body.slice(0,120))}</div>`).join('')}</div>`:`<div class="otd rv"><div class="sc">On this day</div><div class="quote">No ${esc(j.name.toLowerCase())} from this day in earlier years. You're making them now.</div></div>`}
        <div class="jtools rv"><input class="inp" id="jq" placeholder="search title & body" value="${esc(S._jq||'')}"><input class="inp" type="date" id="jfrom" value="${from}" style="max-width:126px"><input class="inp" type="date" id="jto" value="${to}" style="max-width:126px"><select class="sel" id="jtag" style="max-width:158px"><option value="">any link</option>${dimOpts.map(([id,n])=>`<option value="${id}" ${tag===id?'selected':''}>${esc(n)}</option>`).join('')}</select><button class="btn sm ghost" id="jRandom" title="random entry">🎲</button><span class="mono">${filtered.length} of ${all.length}</span><span class="jt-add" data-ctx-slot></span></div>
        ${type==='question'?'<p class="quote">Questions you are living with. They don\'t get archived; they sit open until an answer accumulates, or the framing turns out to have been wrong.</p>':''}
        ${type==='dream'?dreamDictionaryHTML():''}
        ${type==='synchronicity'?'<p class="quote">Entries flagged “revisit later” resurface in the Today page prompts. Synchronicities often only make sense in retrospect.</p>':''}
        ${type==='manifestation'?'<p class="quote">Ask → It Is Given → Allow. When an intention arrives, offer it to the Vision Tree as fruit.</p>':''}
        <div id="jSpecial">${special === 'letters' ? sealedLettersHTML() : special === 'decisions' ? decisionListHTML() : ''}</div>
        <div id="jList">${special ? '' : filtered.map(e=>entryCard(e)).join('')||'<div class="empty">Nothing here matches. Loosen the filters, or write something.</div>'}</div>
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
  bindJournalViews(root);
};

function deleteJournalType(t){
  const j = S.journals.find(x => x.type === t); if(!j) return;
  const count = S.entries.filter(e => e.type === t).length;
  if(t === 'uncategorized' && count){ toast('Uncategorized holds entries moved from deleted types. Delete or re-type those first.'); return; }
  const m = openModal(`<h2>Delete “${esc(j.name)}”?</h2><p class="muted">${count ? `This journal type holds ${count} entr${count===1?'y':'ies'}. Move entries of this type to 'Uncategorized' or delete them too?` : 'This journal type has no entries.'}</p><div class="row" style="justify-content:flex-end;margin-top:18px;flex-wrap:wrap"><button class="btn" data-x="no">Cancel</button>${count?`<button class="btn" data-x="move">Move to Uncategorized</button>`:''}<button class="btn destructive" data-x="del">${count?'Delete them too':'Delete'}</button></div>`,'narrow');
  m.querySelector('[data-x=no]').onclick = () => m.remove();
  const go = (deleteEntries) => { m.remove(); requestDelete({label: `Journal “${j.name}”`, skipConfirm: true, after: () => navigate('#/journals/' + journalDefault()), remove: () => {
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
  const m = openModal(`<h2>Journals</h2><p class="muted">Rename a journal by clicking its name. Reorder with the arrows. A few are kept out of the sidebar because their entries are read somewhere better — the Timeline, the Library, a skill — and they are listed here so nothing is hidden from you twice.</p><div class="stack" style="gap:6px">${S.journals.map((j,i)=>`<div class="row between" style="padding:8px 0;border-top:1px dashed var(--line)"><span class="row"><span class="mono">${typeIcon(j.type)}</span><b class="serif" style="font-size:1.05rem">${ed(`journals.${i}.name`,{ph:'journal name'})}</b><span class="mono">${S.entries.filter(e=>e.type===j.type).length}</span>${JOURNAL_HIDDEN.includes(j.type)?'<span class="mono faint" style="font-size:.66rem">not in the sidebar</span>':''}</span><span class="row" style="gap:2px"><button class="tbtn" data-jup="${i}">↑</button><button class="tbtn" data-jdown="${i}">↓</button><button class="tbtn" data-jdel="${j.type}" style="color:var(--faint)">delete…</button></span></div>`).join('')}}</div>`,'narrow');
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
