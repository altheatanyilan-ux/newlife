/* ============================================================
   FINANCE — not a ledger. You have a phone app for tracking what
   you actually spend; this page has two jobs: building the ways
   you make money, and working out how much would actually be
   enough for the life you want to fund.
   ============================================================ */
const CURRENCIES = ['SGD','USD','EUR','GBP','JPY','AUD','CNY','HKD','MYR','INR'];
const CURRENCY_SIGN = {SGD:'S$',USD:'$',EUR:'€',GBP:'£',JPY:'¥',AUD:'A$',CNY:'¥',HKD:'HK$',MYR:'RM',INR:'₹'};
const FIN_DEFAULT = {currency:'SGD', principles:[], note:''};
const SUGGESTED_SPEND = ['Courses & learning','Flights','Skincare & grooming','Housing','Health & wellness','Travel (non-flight)','Hobbies & gear','Gifts','Clothing','Emergency buffer'];
function migrateFinance(){
  S.finance = Object.assign({}, FIN_DEFAULT, S.finance || {});
  if(!CURRENCIES.includes(S.finance.currency)) S.finance.currency = 'SGD';
  S.finance.principles = Array.isArray(S.finance.principles) ? S.finance.principles : [];
  S.incomeStreams = Array.isArray(S.incomeStreams) ? S.incomeStreams : [];
  S.incomeStreams.forEach(s => { s.model = s.model||''; s.current = +s.current||0; s.target = +s.target||0; s.milestones = Array.isArray(s.milestones) ? s.milestones : []; });
  S.projects.forEach(p => { p.income = p.income || {model:'',current:0,target:0,milestones:[]}; p.income.current = +p.income.current||0; p.income.target = +p.income.target||0; p.income.milestones = Array.isArray(p.income.milestones) ? p.income.milestones : []; });
  S.spendCategories = Array.isArray(S.spendCategories) ? S.spendCategories : [];
  S.spendCategories.forEach(c => { c.annualAmount = +c.annualAmount||0; c.notes = c.notes||''; });
}
const cur = () => CURRENCY_SIGN[S.finance?.currency] || '$';
const money = n => { const v = Math.round((+n || 0) * 100) / 100; return `${v < 0 ? '−' : ''}${cur()}${Math.abs(v).toLocaleString(undefined,{maximumFractionDigits:0})}`; };
hooks.snum = (sid) => { const s = byId(S.incomeStreams, sid); if(s){ s.current = parseFloat(String(s.current).replace(/[^\d.]/g,''))||0; s.target = parseFloat(String(s.target).replace(/[^\d.]/g,''))||0; saveNow(); } };
hooks.spendnum = (cid) => { const c = byId(S.spendCategories, cid); if(c) { c.annualAmount = parseFloat(String(c.annualAmount).replace(/[^\d.]/g,''))||0; saveNow(); } };

/* every way money comes in, or could — a project's own income section, or a
   standalone stream that isn't tied to any Creative Project */
function incomeStreamList(){
  const projectStreams = S.projects.filter(p => p.income && (p.income.model || p.income.current || p.income.target)).map(p => ({id:'proj:'+p.id, name:p.name, kind:'project', project:p, income:p.income}));
  const standalone = S.incomeStreams.map(s => ({id:'stream:'+s.id, name:s.name, kind:'standalone', stream:s, income:s}));
  return [...projectStreams, ...standalone];
}
function streamCardHTML(s){
  const path = s.kind === 'project' ? `projects.#${s.project.id}.income` : `incomeStreams.#${s.stream.id}`;
  const hook = s.kind === 'project' ? 'pnum:'+s.project.id : 'snum:'+s.stream.id;
  const pct = (s.income.target||0) ? clamp((s.income.current||0)/s.income.target*100, 0, 100) : 0;
  return `<div class="card stream-card">
    <div class="row between"><b class="serif" style="font-size:1.05rem">${esc(s.name)}</b>${s.kind==='project'?`<a class="chip on click" style="--c:var(--terra);text-decoration:none" href="#/projects/${s.project.id}">🎨 project</a>`:`<button class="del-x inline" data-streamdel="${s.stream.id}" title="delete this stream">×</button>`}</div>
    <div style="margin-top:8px">${ed(`${path}.model`,{ph:'revenue model — freelance / product / subscriptions / patronage'})}</div>
    <div class="grid c2" style="gap:10px;margin-top:8px">
      <div><div class="k">current / month</div>${ed(`${path}.current`,{ph:'0',cls:'mono',hook})}</div>
      <div><div class="k">target / month</div>${ed(`${path}.target`,{ph:'0',cls:'mono',hook})}</div>
    </div>
    <div class="bar" style="--c:var(--gold);margin:8px 0"><i style="width:${pct}%"></i></div>
    <div class="row between" style="margin-top:6px"><span class="k mono">milestones</span><button class="tbtn" data-streamms="${path}">+ milestone</button></div>
    ${(s.income.milestones||[]).length ? s.income.milestones.map((ms,i)=>`<div class="evidence-item"><span class="mono">${ed(`${path}.milestones.${i}.date`,{ph:'date',cls:'mono'})}</span><span style="flex:1">${ed(`${path}.milestones.${i}.text`,{ph:'first user, first dollar, first referral…'})}</span><button class="tbtn" data-streammsdel="${path}:${i}">×</button></div>`).join('') : '<div class="faint" style="font-size:.78rem">None yet.</div>'}
  </div>`;
}
function openStreamModal(){
  const m = openModal(`<h2>An income stream</h2><p class="muted" style="font-size:.86rem">A way you make money, or are building toward making money.</p><div class="stack">
    <select class="sel" id="stProj"><option value="">standalone — not tied to a project</option>${S.projects.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>
    <input class="inp serif-lg" id="stName" placeholder="Name — only needed if standalone" autofocus>
    <input class="inp" id="stModel" placeholder="revenue model — freelance / product / subscriptions / patronage">
    <div class="grid c2" style="gap:10px"><input class="inp mono" id="stCurrent" placeholder="current / month" inputmode="decimal"><input class="inp mono" id="stTarget" placeholder="target / month" inputmode="decimal"></div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="stSave">Add</button></div>
  </div>`, 'narrow');
  const num = v => parseFloat(String(v).replace(/[^\d.]/g,'')) || 0;
  m.querySelector('#stSave').onclick = () => {
    const projId = m.querySelector('#stProj').value;
    if(projId){ const p = byId(S.projects, projId); p.income = p.income || {model:'',current:0,target:0,milestones:[]};
      const model = m.querySelector('#stModel').value.trim(), c0 = num(m.querySelector('#stCurrent').value), t0 = num(m.querySelector('#stTarget').value);
      if(model) p.income.model = model; if(c0) p.income.current = c0; if(t0) p.income.target = t0;
      saveNow(); m.remove(); sound('success'); rerender(); return; }
    const name = m.querySelector('#stName').value.trim(); if(!name){ toast('Name it, or link it to a project.'); return; }
    S.incomeStreams.push({id:uid(), name, model:m.querySelector('#stModel').value.trim(), current:num(m.querySelector('#stCurrent').value), target:num(m.querySelector('#stTarget').value), milestones:[]});
    saveNow(); m.remove(); sound('success'); rerender();
  };
}

/* what you want to be able to spend, per year — not what you spent */
function spendRowHTML(c){
  return `<div class="spend-row" data-spend="${c.id}">
    <div class="row between" style="align-items:center">
      <span style="flex:1">${ed(`spendCategories.#${c.id}.name`,{ph:'category'})}</span>
      <span class="row" style="gap:3px"><span class="mono">${cur()}</span>${ed(`spendCategories.#${c.id}.annualAmount`,{ph:'0',cls:'mono',hook:'spendnum:'+c.id})}<span class="mono faint">/yr</span></span>
      <button class="del-x inline" data-spenddel="${c.id}">×</button>
    </div>
    <div class="faint" style="font-size:.8rem;margin-top:2px">${ed(`spendCategories.#${c.id}.notes`,{ph:'what this covers, or why this much'})}</div>
  </div>`;
}
function openSpendCatModal(){
  const m = openModal(`<h2>A spending category</h2><input class="inp serif-lg" id="scName" placeholder="e.g. Courses" autofocus><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="scSave">Add</button></div>`, 'narrow');
  m.querySelector('#scSave').onclick = () => { const name = m.querySelector('#scName').value.trim(); if(!name) return; S.spendCategories.push({id:uid(), name, annualAmount:0, notes:''}); saveNow(); m.remove(); rerender(); };
  m.querySelector('#scName').onkeydown = e => { if(e.key==='Enter') m.querySelector('#scSave').click(); };
}

routes.finance = function(root){
  migrateFinance();
  registerPageEntry({pageName:'Finance', addLabel:'Add an income stream', defaultEntryType:'stream', prefilledFields:{}, options:[
    {icon:'💰', label:'Income stream', desc:'A way you make, or could make, money.', run:()=>openStreamModal()},
    {icon:'🎯', label:'Spending category', desc:'Something you want to be able to afford, every year.', run:()=>openSpendCatModal()}]});
  const streams = incomeStreamList();
  const totalCurrent = sum(streams.map(s=>s.income.current||0)), totalTarget = sum(streams.map(s=>s.income.target||0));
  const diversified = totalCurrent ? streams.filter(s => (s.income.current||0)/totalCurrent > .1).length : 0;
  const annualCurrent = totalCurrent*12, annualTarget = totalTarget*12;
  const annualWant = sum(S.spendCategories.map(c=>c.annualAmount||0));
  root.innerHTML = `<div class="page">
    <div class="page-head"><h1>Finance</h1><div class="sub">Not a ledger — that's what your phone app is for. This page has two jobs: building the ways you make money, and working out how much would actually be enough for the life you want to fund.</div></div>

    <section class="section rv"><div class="row between"><span class="sc" style="margin:0">Income streams</span><button class="btn sm primary" id="streamAdd">＋ stream</button></div>
      <p class="muted" style="font-size:.85rem">Every way you make money, or are building toward making money. Link one to a Creative Project and the numbers live there, in sync — edit them from either page.</p>
      <div class="card" style="margin:12px 0"><div class="income-strip">
        <div><div class="k">current, monthly</div><div class="num">${money(totalCurrent)}</div><div class="mono">${money(annualCurrent)} / year</div></div>
        <div><div class="k">target, monthly</div><div class="num">${money(totalTarget)}</div><div class="mono">${money(annualTarget)} / year</div></div>
        <div><div class="k">streams</div><div class="num">${streams.length}</div></div>
        <div><div class="k">diversification</div><div class="num">${diversified}</div><div class="mono">contribute &gt;10%</div></div>
      </div></div>
      ${streams.length ? `<div class="grid c2" style="align-items:start">${streams.map(streamCardHTML).join('')}</div>` : '<div class="empty">Nothing yet. What is the first way you could make money doing something you already do?</div>'}
    </section>

    <section class="section rv"><span class="sc">How much would be enough</span>
      <div class="card">
        <div class="row between"><span>What you want to be able to spend, per year</span><b class="serif" style="font-size:1.3rem">${money(annualWant)}</b></div>
        <div class="row between" style="margin-top:10px"><span class="mono">current streams cover</span><span class="mono">${annualWant ? Math.round(annualCurrent/annualWant*100) : 0}%</span></div>
        <div class="bar" style="--c:var(--sage);margin:4px 0 10px"><i style="width:${annualWant?clamp(annualCurrent/annualWant*100,0,100):0}%"></i></div>
        <div class="row between"><span class="mono">at target, they'd cover</span><span class="mono">${annualWant ? Math.round(annualTarget/annualWant*100) : 0}%</span></div>
        <div class="bar" style="--c:var(--page-accent)"><i style="width:${annualWant?clamp(annualTarget/annualWant*100,0,100):0}%"></i></div>
      </div>
    </section>

    <section class="section rv"><div class="row between"><span class="sc" style="margin:0">The life you want to fund — annual spend</span><button class="btn sm primary" id="spendAdd">＋ category</button></div>
      <p class="muted" style="font-size:.85rem">Not what you spent — what you want to be able to spend. Courses, flights, skincare: whatever the life you're building actually costs, so you have a real number for "enough".</p>
      ${!S.spendCategories.length ? `<div class="row rv" style="gap:6px;flex-wrap:wrap;margin-bottom:12px">${SUGGESTED_SPEND.map(n=>`<button class="btn sm ghost" data-suggestspend="${esc(n)}">＋ ${esc(n)}</button>`).join('')}</div>` : ''}
      <div class="spend-list">${S.spendCategories.length ? S.spendCategories.map(spendRowHTML).join('') : '<div class="empty">Nothing yet — add a category above, or pick a suggestion.</div>'}</div>
      ${S.spendCategories.length ? `<div class="row between" style="margin-top:10px;padding-top:10px;border-top:1px solid var(--line)"><b>Total, per year</b><b class="serif" style="font-size:1.2rem">${money(annualWant)}</b></div>` : ''}
    </section>

    <details class="section rv"><summary><span class="sc">Money, in your own words</span></summary><div class="body stack" style="gap:16px;padding-top:10px">
      <div><span class="k mono">principles</span><ul class="principles">${S.finance.principles.map((p,i)=>`<li><span>${ed(`finance.principles.${i}`,{ph:'a rule you want to keep'})}</span><button class="del-x inline" data-fpdel="${i}">×</button></li>`).join('')}</ul><button class="btn sm ghost" id="finPrin">＋ principle</button></div>
      <div><span class="k mono">notes</span>${ed('finance.note',{multi:true,mdr:true,cls:'prose',ph:'What you are working out about money — fears, plans, the thing you have never said out loud about it.'})}</div>
      <div class="field"><label>Currency</label><select class="sel" style="width:auto" id="finCur">${CURRENCIES.map(c=>`<option ${S.finance.currency===c?'selected':''}>${c}</option>`).join('')}</select></div>
    </div></details>
  </div>`;
  $('#streamAdd').onclick = () => openStreamModal();
  $('#spendAdd').onclick = () => openSpendCatModal();
  root.querySelectorAll('[data-suggestspend]').forEach(b => b.onclick = () => { S.spendCategories.push({id:uid(), name:b.dataset.suggestspend, annualAmount:0, notes:''}); saveNow(); rerender(); });
  root.querySelectorAll('[data-spenddel]').forEach(b => b.onclick = () => { const c = byId(S.spendCategories, b.dataset.spenddel); requestDelete({label:c.name||'category', node:b.closest('.spend-row'), remove:()=>spliceOut(S.spendCategories, x=>x.id===c.id)}); });
  root.querySelectorAll('[data-streamdel]').forEach(b => b.onclick = () => { const s = byId(S.incomeStreams, b.dataset.streamdel); requestDelete({label:s.name||'stream', node:b.closest('.stream-card'), remove:()=>spliceOut(S.incomeStreams, x=>x.id===s.id)}); });
  root.querySelectorAll('[data-streamms]').forEach(b => b.onclick = () => { const arr = getPath(b.dataset.streamms+'.milestones'); arr.push({date:today(), text:''}); saveNow(); rerender(); });
  root.querySelectorAll('[data-streammsdel]').forEach(b => b.onclick = () => { const [path, i] = b.dataset.streammsdel.split(':'); const arr = getPath(path+'.milestones'); requestDelete({label:arr[+i].text||'milestone', remove:()=>spliceOut(arr, x=>x===arr[+i])}); });
  $('#finPrin').onclick = () => { S.finance.principles.push(''); saveNow(); rerender(); setTimeout(()=>{ const n = document.querySelectorAll('.principles .ed'); n.length && beginEdit(n[n.length-1]); }, 60); };
  root.querySelectorAll('[data-fpdel]').forEach(b => b.onclick = () => { const i = +b.dataset.fpdel; requestDelete({label:S.finance.principles[i]||'this principle', node:b.closest('li'), remove:()=>{ const g = S.finance.principles.splice(i,1)[0]; return () => S.finance.principles.splice(i,0,g); }}); });
  $('#finCur').onchange = e => { S.finance.currency = e.target.value; saveNow(); rerender(); };
  reveal(root);
};
