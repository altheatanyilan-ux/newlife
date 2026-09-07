/* ============================================================
   FINANCE — not a ledger. You have a phone app for tracking what
   you actually spend; this page has three jobs: building the ways
   you make money, working out how much would actually be enough
   for the life you want to fund, and naming the gap between them
   as a structural tension worth acting on.
   ============================================================ */
const CURRENCIES = ['SGD','USD','EUR','GBP','JPY','AUD','CNY','HKD','MYR','INR'];
const CURRENCY_SIGN = {SGD:'S$',USD:'$',EUR:'€',GBP:'£',JPY:'¥',AUD:'A$',CNY:'¥',HKD:'HK$',MYR:'RM',INR:'₹'};
const FIN_DEFAULT = {currency:'SGD', principles:[], note:'', rates:{}, savings:0, hoursLimit:50};
const SUGGESTED_SPEND = ['Courses & learning','Flights','Skincare & grooming','Housing','Health & wellness','Travel (non-flight)','Hobbies & gear','Gifts','Clothing','Emergency buffer'];
const STREAM_STATUS = {idea:['💭','Idea'], exploring:['🔍','Exploring'], earning:['🟢','Earning'], paused:['⏸','Paused'], retired:['📦','Retired']};
const STREAM_STATUS_COLOR = {idea:'var(--muted)', exploring:'var(--page-accent)', earning:'var(--sage)', paused:'var(--gold)', retired:'var(--faint)'};
const MILESTONE_KINDS = ['first dollar','first client','first repeat customer','first referral','first $1k month'];
const SPEND_CATEGORY_TEMPLATE = [
  'Housing','Food','Transport','Health','Learning','Creative','Relationships','Experiences','Savings & Investment','Giving','Miscellaneous'
];
function newSpendScenario(name, currency){
  return {id:uid(), name, currency: currency || S.finance.currency, active:false, links: emptyLinks(),
    categories: SPEND_CATEGORY_TEMPLATE.map(name_ => ({id:uid(), name:name_, items:[]}))};
}
function migrateIncomeShape(obj){
  obj.model = obj.model || ''; obj.current = +obj.current || 0; obj.target = +obj.target || 0;
  obj.milestones = Array.isArray(obj.milestones) ? obj.milestones : []; obj.milestones.forEach(m => { m.kind = m.kind || ''; });
  obj.status = STREAM_STATUS[obj.status] ? obj.status : (obj.current > 0 ? 'earning' : 'idea');
  obj.currency = CURRENCIES.includes(obj.currency) ? obj.currency : S.finance.currency;
  obj.hoursPerWeek = +obj.hoursPerWeek || 0;
  obj.visionId = obj.visionId || null;
  obj.peopleIds = Array.isArray(obj.peopleIds) ? obj.peopleIds : [];
  obj.revenueLog = Array.isArray(obj.revenueLog) ? obj.revenueLog : [];
  obj.links = normLinks(obj.links);
  /* the older single-vision and people fields fold into the general links,
     so a stream tagged before this change keeps what it had */
  if(obj.visionId && !obj.links.visions.includes(obj.visionId)) obj.links.visions.push(obj.visionId);
  obj.peopleIds.forEach(pid => { if(!obj.links.people.includes(pid)) obj.links.people.push(pid); });
}
function migrateFinance(){
  S.finance = Object.assign({}, FIN_DEFAULT, S.finance || {});
  if(!CURRENCIES.includes(S.finance.currency)) S.finance.currency = 'SGD';
  S.finance.principles = Array.isArray(S.finance.principles) ? S.finance.principles : [];
  S.finance.rates = S.finance.rates && typeof S.finance.rates === 'object' ? S.finance.rates : {};
  S.finance.savings = +S.finance.savings || 0;
  S.finance.hoursLimit = +S.finance.hoursLimit || 50;
  S.incomeStreams = Array.isArray(S.incomeStreams) ? S.incomeStreams : [];
  S.incomeStreams.forEach(migrateIncomeShape);
  S.projects.forEach(p => { p.income = p.income || {model:'',current:0,target:0,milestones:[]}; migrateIncomeShape(p.income); });
  /* the old flat annual spend list becomes a "Current life" scenario, once */
  if(!Array.isArray(S.finance.scenarios)){
    const legacy = Array.isArray(S.spendCategories) ? S.spendCategories : [];
    const cur_ = newSpendScenario('Current life', S.finance.currency); cur_.active = true;
    if(legacy.length){
      const misc = cur_.categories.find(c => c.name === 'Miscellaneous');
      legacy.forEach(c => misc.items.push({id:c.id||uid(), name:c.name, amount:+c.annualAmount||0, currency:S.finance.currency, notes:c.notes||''}));
    }
    S.finance.scenarios = [cur_];
  }
  S.finance.scenarios.forEach(sc => {
    sc.currency = CURRENCIES.includes(sc.currency) ? sc.currency : S.finance.currency;
    sc.links = normLinks(sc.links);
    sc.categories = Array.isArray(sc.categories) ? sc.categories : [];
    sc.categories.forEach(c => { c.items = Array.isArray(c.items) ? c.items : []; c.items.forEach(i => { i.amount = +i.amount || 0; i.currency = CURRENCIES.includes(i.currency) ? i.currency : sc.currency; i.notes = i.notes || ''; }); });
  });
  if(!S.finance.scenarios.some(sc => sc.active)) S.finance.scenarios[0].active = true;
}
const cur = (c) => CURRENCY_SIGN[c || S.finance.currency] || '$';
const money = (n, c) => { const v = Math.round((+n || 0) * 100) / 100; return `${v < 0 ? '−' : ''}${cur(c)}${Math.abs(v).toLocaleString(undefined,{maximumFractionDigits:0})}`; };
function fxRate(fromCur){ if(!fromCur || fromCur === S.finance.currency) return 1; return +S.finance.rates[fromCur] || 1; }
function toBase(amount, fromCur){ return (+amount || 0) * fxRate(fromCur); }
function currenciesInUse(){
  const set = new Set();
  incomeStreamList().forEach(s => set.add(s.income.currency));
  S.finance.scenarios.forEach(sc => { set.add(sc.currency); sc.categories.forEach(c => c.items.forEach(i => set.add(i.currency))); });
  set.delete(S.finance.currency);
  return [...set];
}
/* Every money figure on this page is derived — eff. rate, portfolio totals,
   the gap, the runway. They are drawn as static text, so after an edit they
   have to be redrawn or they sit stale until a refresh. A rerender mid-edit
   would tear out the field the cursor just moved into, so this waits until
   nothing is being edited, then redraws once. */
function finLiveRecalc(){
  clearTimeout(finLiveRecalc._t);
  finLiveRecalc._t = setTimeout(() => {
    if(document.querySelector('.ed.editing')){ finLiveRecalc(); return; }
    if(document.querySelector('.stream-card, .scenario-card, .gap-panel')) rerender();
  }, 220);
}
hooks.snum = (sid) => { const s = byId(S.incomeStreams, sid); if(s){ ['current','target','hoursPerWeek'].forEach(k => { s[k] = parseFloat(String(s[k]).replace(/[^\d.]/g,''))||0; }); saveNow(); finLiveRecalc(); } };
hooks.spendnum = (path) => { const i = getPath(path); if(i) i.amount = parseFloat(String(i.amount).replace(/[^\d.]/g,''))||0; saveNow(); finLiveRecalc(); };
hooks.savingsnum = () => { S.finance.savings = parseFloat(String(S.finance.savings).replace(/[^\d.]/g,''))||0; saveNow(); finLiveRecalc(); };
hooks.hourslimit = () => { S.finance.hoursLimit = parseFloat(String(S.finance.hoursLimit).replace(/[^\d.]/g,''))||50; saveNow(); finLiveRecalc(); };

/* every way money comes in, or could — a project's own income section, or a
   standalone stream that isn't tied to any Creative Project */
function incomeStreamList(){
  const projectStreams = S.projects.filter(p => p.income && (p.income.model || p.income.current || p.income.target)).map(p => ({id:'proj:'+p.id, name:p.name, kind:'project', project:p, income:p.income}));
  const standalone = S.incomeStreams.map(s => ({id:'stream:'+s.id, name:s.name, kind:'standalone', stream:s, income:s}));
  return [...projectStreams, ...standalone];
}
/* An hourly rate needs both halves. With hours but no income it is not
   "0/hr", it is not yet answerable — say so rather than print a zero. */
function effHourlyRate(income){ const h = +income.hoursPerWeek || 0; const c = +income.current || 0; if(!h || !c) return null; return c / (h * 4.33); }
function portfolioTotals(){
  const streams = incomeStreamList().filter(s => s.income.status !== 'retired');
  const totalCurrentBase = sum(streams.map(s => toBase(s.income.current, s.income.currency)));
  const totalTargetBase = sum(streams.map(s => toBase(s.income.target, s.income.currency)));
  const totalHours = sum(streams.map(s => +s.income.hoursPerWeek || 0));
  const diversified = totalCurrentBase ? streams.filter(s => toBase(s.income.current, s.income.currency)/totalCurrentBase > .1).length : 0;
  return {streams, totalCurrentBase, totalTargetBase, totalHours, diversified};
}
function activeScenario(){ return S.finance.scenarios.find(sc => sc.active) || S.finance.scenarios[0]; }
function scenarioAnnualTotal(sc){ return sum(sc.categories.flatMap(c => c.items.map(i => toBase(i.amount, i.currency)))); }
function monthlyBurn(){ const sc = activeScenario(); const monthlyCostBase = scenarioAnnualTotal(sc)/12; const {totalCurrentBase} = portfolioTotals(); return monthlyCostBase - totalCurrentBase; }
function runway(){ const burn = monthlyBurn(); if(burn <= 0) return {sustainable:true, surplus:-burn};
  const savingsBase = +S.finance.savings || 0; return {sustainable:false, months: burn>0 ? savingsBase/burn : Infinity}; }

function streamCardHTML(s){
  const path = s.kind === 'project' ? `projects.#${s.project.id}.income` : `incomeStreams.#${s.stream.id}`;
  const hook = s.kind === 'project' ? 'pnum:'+s.project.id : 'snum:'+s.stream.id;
  const inc = s.income; const pct = (inc.target||0) ? clamp((inc.current||0)/inc.target*100, 0, 100) : 0;
  const rate = effHourlyRate(inc); const st = STREAM_STATUS[inc.status] || STREAM_STATUS.idea;
  const spark = (inc.revenueLog||[]).slice(-12).map(r => r.amount);
  return `<div class="card stream-card">
    <div class="row between">
      <b class="serif" style="font-size:1.05rem">${esc(s.name)}</b>
      <span class="row" style="gap:6px">
        <select class="sel" style="width:auto;padding:2px 6px;font-size:.74rem;--c:${STREAM_STATUS_COLOR[inc.status]};color:${STREAM_STATUS_COLOR[inc.status]}" data-streamstatus="${path}">${Object.entries(STREAM_STATUS).map(([k,[ic,l]])=>`<option value="${k}" ${inc.status===k?'selected':''}>${ic} ${l}</option>`).join('')}</select>
        ${s.kind==='project'?`<a class="chip on click" style="--c:var(--terra);text-decoration:none" href="#/projects/${s.project.id}">🎨 project</a>`:`<button class="del-x inline" data-streamdel="${s.stream.id}" title="delete this stream">×</button>`}
      </span>
    </div>
    <div style="margin-top:8px">${ed(`${path}.model`,{ph:'revenue model — freelance / product / subscriptions / patronage'})}</div>
    <div class="grid c2" style="gap:10px;margin-top:8px">
      <div><div class="k">current / month</div>${ed(`${path}.current`,{ph:'0',cls:'mono',hook})}</div>
      <div><div class="k">target / month</div>${ed(`${path}.target`,{ph:'0',cls:'mono',hook})}</div>
    </div>
    <div class="bar" style="--c:var(--gold);margin:8px 0"><i style="width:${pct}%"></i></div>
    <div class="grid c3" style="gap:8px;margin:8px 0;align-items:end">
      <div><div class="k">hrs / week</div>${ed(`${path}.hoursPerWeek`,{ph:'0',cls:'mono',hook})}</div>
      <div><div class="k">eff. rate</div><div class="mono" style="padding:6px 0;font-size:.86rem">${rate!=null?`${cur(inc.currency)}${rate.toFixed(rate<10?1:0)}/hr`:'—'}</div></div>
      <div><div class="k">currency</div><select class="sel" style="padding:5px 6px;font-size:.8rem" data-streamcur="${path}">${CURRENCIES.map(c=>`<option ${inc.currency===c?'selected':''}>${c}</option>`).join('')}</select></div>
    </div>
    ${spark.length>1 ? `<div style="margin:8px 0 4px">${sparkline(spark,{h:26,color:'var(--gold)'})}</div>` : ''}
    <div class="row" style="gap:6px;flex-wrap:wrap;margin:6px 0">
      <button class="btn sm ghost" data-streamlog="${path}">📈 log this month</button>
    </div>
    ${linkedChipsHTML(inc.links) ? `<div class="row" style="gap:4px;flex-wrap:wrap;margin-bottom:6px">${linkedChipsHTML(inc.links)}</div>` : ''}
    <details class="fin-links"><summary class="mono">what this stream is for</summary>
      <div class="body" data-finlinks="${path}">${linksEditorHTML(inc.links, {legend:false})}</div>
    </details>
    <div class="row between" style="margin-top:6px;align-items:center">
      <span class="k mono">milestones</span>
      <select class="sel" style="width:auto;font-size:.76rem" data-streammspreset="${path}"><option value="">＋ milestone…</option>${MILESTONE_KINDS.map(k=>`<option>${esc(k)}</option>`).join('')}<option value="__custom">other…</option></select>
    </div>
    ${(inc.milestones||[]).length ? inc.milestones.map((ms,i)=>`<div class="evidence-item"><span class="mono">${ed(`${path}.milestones.${i}.date`,{ph:'date',cls:'mono'})}</span><span style="flex:1">${ed(`${path}.milestones.${i}.text`,{ph:'first user, first dollar, first referral…'})}</span><button class="tbtn" data-streammsdel="${path}:${i}">×</button></div>`).join('') : '<div class="faint" style="font-size:.78rem">None yet.</div>'}
  </div>`;
}
function openStreamModal(){
  const m = openModal(`<h2>An income stream</h2><p class="muted" style="font-size:.86rem">A way you make money, or are building toward making money.</p><div class="stack">
    <select class="sel" id="stProj"><option value="">standalone — not tied to a project</option>${S.projects.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>
    <input class="inp serif-lg" id="stName" placeholder="Name — only needed if standalone" autofocus>
    <input class="inp" id="stModel" placeholder="revenue model — freelance / product / subscriptions / patronage">
    <div class="grid c3" style="gap:10px"><input class="inp mono" id="stCurrent" placeholder="current / month" inputmode="decimal"><input class="inp mono" id="stTarget" placeholder="target / month" inputmode="decimal"><select class="sel" id="stCur">${CURRENCIES.map(c=>`<option ${S.finance.currency===c?'selected':''}>${c}</option>`).join('')}</select></div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="stSave">Add</button></div>
  </div>`, 'narrow');
  const num = v => parseFloat(String(v).replace(/[^\d.]/g,'')) || 0;
  m.querySelector('#stSave').onclick = () => {
    const projId = m.querySelector('#stProj').value;
    const c0 = num(m.querySelector('#stCurrent').value), t0 = num(m.querySelector('#stTarget').value), curr = m.querySelector('#stCur').value;
    if(projId){ const p = byId(S.projects, projId); p.income = p.income || {model:'',current:0,target:0,milestones:[]}; migrateIncomeShape(p.income);
      const model = m.querySelector('#stModel').value.trim();
      if(model) p.income.model = model; if(c0) p.income.current = c0; if(t0) p.income.target = t0; p.income.currency = curr;
      saveNow(); m.remove(); sound('success'); rerender(); return; }
    const name = m.querySelector('#stName').value.trim(); if(!name){ toast('Name it, or link it to a project.'); return; }
    const income = {model:m.querySelector('#stModel').value.trim(), current:c0, target:t0}; migrateIncomeShape(income); income.currency = curr;
    S.incomeStreams.push(Object.assign({id:uid(), name}, income));
    saveNow(); m.remove(); sound('success'); rerender();
  };
}
function openRevenueLogModal(path){
  const inc = getPath(path);
  const period = today().slice(0,7);
  const existing = (inc.revenueLog||[]).find(r => r.period === period);
  const m = openModal(`<h2>Revenue for ${period}</h2><input class="inp mono serif-lg" id="rlAmt" placeholder="0" inputmode="decimal" value="${existing?existing.amount:''}" autofocus><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="rlSave">Log it</button></div>`, 'narrow');
  m.querySelector('#rlSave').onclick = () => {
    const amt = parseFloat(String(m.querySelector('#rlAmt').value).replace(/[^\d.]/g,'')) || 0;
    inc.revenueLog = inc.revenueLog || [];
    if(existing) existing.amount = amt; else inc.revenueLog.push({period, amount:amt});
    inc.revenueLog.sort((a,b) => a.period.localeCompare(b.period));
    saveNow(); m.remove(); sound('success'); rerender();
  };
}

/* ---------- Life Cost Vision: the budget for the life you want, in scenarios ---------- */
function spendItemRowHTML(sc, cat, item){
  const path = `finance.scenarios.#${sc.id}.categories.#${cat.id}.items.#${item.id}`;
  return `<div class="spend-row" data-spend="${item.id}">
    <div class="row between" style="align-items:center">
      <span style="flex:1">${ed(`${path}.name`,{ph:'line item'})}</span>
      <span class="row" style="gap:3px"><span class="mono">${cur(item.currency)}</span>${ed(`${path}.amount`,{ph:'0',cls:'mono',hook:'spendnum:'+path})}<span class="mono faint">/yr</span></span>
      <button class="del-x inline" data-spenddel="${sc.id}:${cat.id}:${item.id}">×</button>
    </div>
    <div class="faint" style="font-size:.8rem;margin-top:2px">${ed(`${path}.notes`,{ph:'what this covers, or why this much'})}</div>
  </div>`;
}
function scenarioHTML(sc){
  const annual = scenarioAnnualTotal(sc);
  return `<div class="card scenario-card ${sc.active?'active':''}" data-scenario="${sc.id}">
    <div class="row between" style="align-items:center">
      <div class="row" style="gap:8px;align-items:center">
        <button class="btn sm ${sc.active?'primary':'ghost'}" data-scenariopick="${sc.id}">${sc.active?'★ active target':'set as target'}</button>
        <b class="serif" style="font-size:1.05rem">${ed(`finance.scenarios.#${sc.id}.name`)}</b>
      </div>
      <span class="row" style="gap:6px"><select class="sel" style="width:auto;font-size:.8rem" data-scenariocur="${sc.id}">${CURRENCIES.map(c=>`<option ${sc.currency===c?'selected':''}>${c}</option>`).join('')}</select>${S.finance.scenarios.length>1?`<button class="del-x inline" data-scenariodel="${sc.id}">×</button>`:''}</span>
    </div>
    <div class="row between" style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line)"><span class="mono">total, per year</span><b class="serif" style="font-size:1.15rem">${money(sum(sc.categories.flatMap(c=>c.items.map(i=>i.amount))), sc.currency)}</b></div>
    ${sc.categories.map((c, ci) => `<details class="spend-cat" data-cat="${c.id}" ${(c.items.length || S._finOpenCats?.[c.id]) ? 'open' : ''}><summary>
      <span class="sc cat-name" style="flex:1">${ed(`finance.scenarios.#${sc.id}.categories.#${c.id}.name`,{ph:'category'})}</span>
      <span class="mono">${money(sum(c.items.map(i=>i.amount)), sc.currency)}</span>
      <span class="cat-tools row" style="gap:2px">
        <button class="tbtn" data-catmove="${sc.id}:${c.id}:-1" title="move up" ${ci===0?'disabled':''}>↑</button>
        <button class="tbtn" data-catmove="${sc.id}:${c.id}:1" title="move down" ${ci===sc.categories.length-1?'disabled':''}>↓</button>
        <button class="del-x inline" data-catdel="${sc.id}:${c.id}" title="delete category">×</button>
      </span></summary><div class="body">
      <div class="spend-list">${c.items.length ? c.items.map(i=>spendItemRowHTML(sc,c,i)).join('') : '<div class="empty" style="font-size:.8rem">Nothing here yet.</div>'}</div>
      <button class="btn sm ghost" data-spendadd="${sc.id}:${c.id}" style="margin-top:6px">＋ line item</button>
    </div></details>`).join('')}
    <button class="btn sm ghost" data-catadd="${sc.id}" style="margin-top:8px">＋ category</button>
    ${linkedChipsHTML(sc.links) ? `<div class="row" style="gap:4px;flex-wrap:wrap;margin-top:10px">${linkedChipsHTML(sc.links)}</div>` : ''}
    <details class="fin-links"><summary class="mono">what this life is for</summary>
      <div class="body" data-finlinks="finance.scenarios.#${sc.id}">${linksEditorHTML(sc.links, {legend:false})}</div>
    </details>
  </div>`;
}
function openScenarioModal(){
  const m = openModal(`<h2>A life-cost scenario</h2><p class="muted" style="font-size:.86rem">A whole possible life, priced. "Current life", "Tokyo life", "Dream life" — as many as you want to hold up against each other.</p><div class="stack">
    <input class="inp serif-lg" id="scnName" placeholder="e.g. Tokyo life" autofocus>
    <select class="sel" id="scnCur">${CURRENCIES.map(c=>`<option ${S.finance.currency===c?'selected':''}>${c}</option>`).join('')}</select>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="scnSave">Add the scenario</button></div>
  </div>`, 'narrow');
  m.querySelector('#scnSave').onclick = () => { const name = m.querySelector('#scnName').value.trim(); if(!name) return;
    S.finance.scenarios.push(newSpendScenario(name, m.querySelector('#scnCur').value)); saveNow(); m.remove(); sound('success'); rerender(); };
}

/* ---------- Gap analysis: the structural tension, made visible ---------- */
function gapAnalysisHTML(){
  const {streams, totalCurrentBase, totalTargetBase, totalHours, diversified} = portfolioTotals();
  const sc = activeScenario(); const annualCostBase = scenarioAnnualTotal(sc); const monthlyCostBase = annualCostBase/12;
  const gap = monthlyCostBase - totalCurrentBase; const gapAtTarget = monthlyCostBase - totalTargetBase;
  const rw = runway();
  const hoursOver = totalHours > (S.finance.hoursLimit||50);
  const hoursForTarget = totalTargetBase > 0 && totalCurrentBase > 0 ? totalHours * (totalTargetBase/Math.max(totalCurrentBase,1)) : null;
  const contribs = streams.filter(s => s.income.current > 0).map(s => ({s, base: toBase(s.income.current, s.income.currency)})).sort((a,b)=>b.base-a.base);
  const maxContrib = Math.max(1, ...contribs.map(c=>c.base));
  return `
    <div class="card" style="margin-bottom:14px">
      <div class="row between" style="align-items:flex-start;flex-wrap:wrap;gap:12px">
        <div><div class="k">the gap — ${esc(sc.name)}, monthly, beyond current income</div><div class="num" style="font-size:2rem">${gap>0?money(gap):'covered'}</div>${gap>0?`<div class="mono faint">at target streams, the gap would be ${gapAtTarget>0?money(gapAtTarget):'covered'}</div>`:''}</div>
        <button class="btn sm ghost" id="finToDCA">→ update the Definite Chief Aim with this number</button>
      </div>
      <div class="row between" style="margin-top:14px"><span class="mono">current income covers</span><span class="mono">${monthlyCostBase?Math.round(totalCurrentBase/monthlyCostBase*100):0}%</span></div>
      <div class="bar" style="--c:var(--sage);margin:4px 0 10px"><i style="width:${monthlyCostBase?clamp(totalCurrentBase/monthlyCostBase*100,0,100):0}%"></i></div>
      <div class="row between"><span class="mono">at target, streams would cover</span><span class="mono">${monthlyCostBase?Math.round(totalTargetBase/monthlyCostBase*100):0}%</span></div>
      <div class="bar" style="--c:var(--page-accent)"><i style="width:${monthlyCostBase?clamp(totalTargetBase/monthlyCostBase*100,0,100):0}%"></i></div>
    </div>
    <div class="grid c2" style="gap:14px;align-items:start;margin-bottom:14px">
      <div class="card"><span class="sc">Per-stream contribution</span>
        ${contribs.length ? `<div class="stack" style="gap:5px;margin-top:10px">${contribs.map(({s,base})=>`<div class="row between"><span style="min-width:8em">${esc(s.name)}</span><span class="bar" style="flex:1;--c:var(--gold)"><i style="width:${Math.round(base/maxContrib*100)}%"></i></span><span class="mono">${Math.round(base/Math.max(totalCurrentBase,1)*100)}%</span></div>`).join('')}</div>` : '<div class="empty">No streams earning yet.</div>'}
      </div>
      <div class="card"><span class="sc">Hours reality check</span>
        <div class="row between" style="margin-top:10px"><span class="mono">hours / week, all streams</span><span class="mono" style="color:${hoursOver?'#c9a05a':'inherit'}">${totalHours.toFixed(1)}${hoursOver?' · over limit':''}</span></div>
        <div class="bar" style="--c:${hoursOver?'#c9a05a':'var(--sage)'};margin:4px 0"><i style="width:${clamp(totalHours/(S.finance.hoursLimit||50)*100,0,100)}%"></i></div>
        <div class="faint" style="font-size:.76rem">sustainable limit: ${ed('finance.hoursLimit',{ph:'50',cls:'mono',hook:'hourslimit'})} h/week</div>
        ${hoursForTarget!=null ? `<div class="mono faint" style="margin-top:8px">at target income, roughly ${hoursForTarget.toFixed(0)}h/week would be needed at today's rates${hoursForTarget > (S.finance.hoursLimit||50) ? ' — over the limit; the rate has to rise, not just the hours' : ''}</div>` : ''}
      </div>
    </div>
    <div class="card" style="margin-bottom:14px"><span class="sc">Runway</span>
      <div class="row between" style="margin-top:10px;align-items:center">
        <span class="row" style="gap:6px"><span class="mono">savings</span><span class="mono">${cur()}</span>${ed('finance.savings',{ph:'0',cls:'mono',hook:'savingsnum'})}</span>
        <b class="serif" style="font-size:1.2rem">${rw.sustainable ? `sustainable · +${money(rw.surplus)}/mo` : (rw.months===Infinity ? '—' : `${Math.round(rw.months)} months`)}</b>
      </div>
      <div class="faint" style="font-size:.76rem;margin-top:4px">${rw.sustainable ? 'Current income already covers the active scenario — the surplus is what compounds.' : "Savings ÷ monthly burn (the active scenario's cost minus current income)."}</div>
    </div>
    ${diversified===0 && streams.some(s=>s.income.current>0) ? `<div class="nudges"><a class="nudge" href="javascript:void(0)"><span class="nu-ico">◔</span><span>No single stream covers more than a tenth of your income — either that's healthy diversification, or nothing has really taken root yet.</span></a></div>` : ''}
  `;
}

/* what you want to be able to spend, per year — not what you spent */
function openSpendCatModal(scId){
  const sc = byId(S.finance.scenarios, scId);
  const m = openModal(`<h2>A spending category</h2><input class="inp serif-lg" id="scName" placeholder="e.g. Courses" autofocus><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="scSave">Add</button></div>`, 'narrow');
  m.querySelector('#scSave').onclick = () => { const name = m.querySelector('#scName').value.trim(); if(!name) return; sc.categories.push({id:uid(), name, items:[]}); saveNow(); m.remove(); rerender(); };
  m.querySelector('#scName').onkeydown = e => { if(e.key==='Enter') m.querySelector('#scSave').click(); };
}
function openDCAModal(){
  const {totalTargetBase, streams} = portfolioTotals(); const sc = activeScenario();
  const targetMonthly = scenarioAnnualTotal(sc)/12;
  const topStreams = [...streams].sort((a,b)=>(b.income.target||0)-(a.income.target||0)).slice(0,3).map(s=>s.name);
  const dateOut = addDays(today(), 365);
  const sentence = `I earn ${money(targetMonthly)} per month by ${fmtDate(dateOut,'med')} through ${topStreams.length?topStreams.join(', '):'the streams I am building'}.`;
  const m = openModal(`<h2>Update the Definite Chief Aim</h2><p class="muted" style="font-size:.86rem">The exact thing desired, stated in money and a date. Edit freely before saving — this replaces what's there now.</p>
    <textarea class="ta" id="dcaText" style="min-height:120px">${esc(sentence)}</textarea>
    <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary" id="dcaSave">Save to the Morning Theatre</button></div>`, 'narrow');
  m.querySelector('#dcaSave').onclick = () => { S.rehearsal.aim = m.querySelector('#dcaText').value.trim(); saveNow(); m.remove(); sound('success'); toast('Definite Chief Aim updated.', 5000, {label:'open Today', fn:()=>navigate('#/today')}); };
}

routes.finance = function(root){
  migrateFinance();
  registerPageEntry({pageName:'Finance', addLabel:'Add an income stream', defaultEntryType:'stream', prefilledFields:{}, options:[
    {icon:'💰', label:'Income stream', desc:'A way you make, or could make, money.', run:()=>openStreamModal()},
    {icon:'🎯', label:'Life-cost scenario', desc:'A whole possible life, priced.', run:()=>openScenarioModal()}]});
  const {streams, totalCurrentBase, totalTargetBase, totalHours, diversified} = portfolioTotals();
  const annualCurrent = totalCurrentBase*12, annualTarget = totalTargetBase*12;
  const blendedRate = totalHours ? totalCurrentBase/(totalHours*4.33) : null;
  root.innerHTML = `<div class="page">
    <div class="page-head"><h1>Finance</h1><div class="sub">Not a ledger — that's what your phone app is for. This page builds the ways you make money, prices the life you want to fund, and names the gap between them.</div></div>

    <section class="section rv"><div class="row between"><span class="sc" style="margin:0">Income streams</span><button class="btn sm primary" id="streamAdd">＋ stream</button></div>
      <p class="muted" style="font-size:.85rem">Every way you make money, or are building toward making money. Link one to a Creative Project and the numbers live there, in sync — edit them from either page.</p>
      <div class="card" style="margin:12px 0"><div class="income-strip">
        <div><div class="k">current, monthly (${S.finance.currency})</div><div class="num">${money(totalCurrentBase)}</div><div class="mono">${money(annualCurrent)} / year</div></div>
        <div><div class="k">target, monthly</div><div class="num">${money(totalTargetBase)}</div><div class="mono">${money(annualTarget)} / year</div></div>
        <div><div class="k">streams</div><div class="num">${streams.length}</div></div>
        <div><div class="k">diversification</div><div class="num">${diversified}</div><div class="mono">contribute &gt;10%</div></div>
        <div><div class="k">hours / week</div><div class="num">${totalHours.toFixed(0)}</div>${blendedRate!=null?`<div class="mono">${money(blendedRate)}/hr blended</div>`:''}</div>
      </div></div>
      ${streams.length ? `<div class="grid c2" style="align-items:start">${streams.map(streamCardHTML).join('')}</div>` : '<div class="empty">Nothing yet. What is the first way you could make money doing something you already do?</div>'}
    </section>

    <section class="section rv"><span class="sc">The gap — structural tension, made visible</span>
      ${gapAnalysisHTML()}
    </section>

    <section class="section rv"><div class="row between" style="align-items:center"><span class="sc" style="margin:0">The life you want to fund</span><button class="btn sm primary" id="scenarioAdd">＋ scenario</button></div>
      <p class="muted" style="font-size:.85rem">Not what you spent — what you want to be able to spend. Build as many possible lives as you want; pick one as the active target for the gap above.</p>
      <div class="stack" style="gap:14px;margin-top:12px">${S.finance.scenarios.map(scenarioHTML).join('')}</div>
    </section>

    <details class="section rv"><summary><span class="sc">Money, in your own words</span></summary><div class="body stack" style="gap:16px;padding-top:10px">
      <div><span class="k mono">principles</span><ul class="principles">${S.finance.principles.map((p,i)=>`<li><span>${ed(`finance.principles.${i}`,{ph:'a rule you want to keep'})}</span><button class="del-x inline" data-fpdel="${i}">×</button></li>`).join('')}</ul><button class="btn sm ghost" id="finPrin">＋ principle</button></div>
      <div><span class="k mono">notes</span>${ed('finance.note',{multi:true,mdr:true,cls:'prose',ph:'What you are working out about money — fears, plans, the thing you have never said out loud about it.'})}</div>
      <div class="field"><label>Base currency</label><select class="sel" style="width:auto" id="finCur">${CURRENCIES.map(c=>`<option ${S.finance.currency===c?'selected':''}>${c}</option>`).join('')}</select><div class="faint" style="font-size:.76rem;margin-top:4px">Portfolio totals and the gap convert every stream and scenario into this currency.</div></div>
      ${currenciesInUse().length ? `<div class="field"><label>Exchange rates — 1 unit of each, in ${S.finance.currency}</label><div class="grid c2" style="gap:8px">${currenciesInUse().map(c=>`<div class="row between"><span class="mono">${c}</span><input class="inp mono" style="width:100px" data-fxrate="${c}" value="${S.finance.rates[c]||''}" placeholder="1.00"></div>`).join('')}</div><div class="faint" style="font-size:.76rem;margin-top:4px">Entered by hand, not fetched live — update them when they drift.</div></div>` : ''}
    </div></details>
  </div>`;
  $('#streamAdd').onclick = () => openStreamModal();
  $('#scenarioAdd').onclick = () => openScenarioModal();
  $('#finToDCA').onclick = () => openDCAModal();
  root.querySelectorAll('.spend-cat').forEach(d => d.addEventListener('toggle', () => { S._finOpenCats = S._finOpenCats || {}; S._finOpenCats[d.dataset.cat] = d.open; }));
  root.querySelectorAll('[data-spendadd]').forEach(b => b.onclick = () => { const [scId, cId] = b.dataset.spendadd.split(':'); const c = byId(byId(S.finance.scenarios,scId).categories, cId); c.items.push({id:uid(), name:'', amount:0, currency:byId(S.finance.scenarios,scId).currency, notes:''}); S._finOpenCats = S._finOpenCats || {}; S._finOpenCats[cId] = true; saveNow(); rerender(); });
  root.querySelectorAll('[data-spenddel]').forEach(b => b.onclick = () => { const [scId,cId,iId] = b.dataset.spenddel.split(':'); const c = byId(byId(S.finance.scenarios,scId).categories, cId); const it = byId(c.items, iId); requestDelete({label:it.name||'line item', node:b.closest('.spend-row'), remove:()=>spliceOut(c.items, x=>x.id===iId)}); });
  root.querySelectorAll('[data-streamdel]').forEach(b => b.onclick = () => { const s = byId(S.incomeStreams, b.dataset.streamdel); requestDelete({label:s.name||'stream', node:b.closest('.stream-card'), remove:()=>spliceOut(S.incomeStreams, x=>x.id===s.id)}); });
  root.querySelectorAll('[data-streamms]').forEach(b => b.onclick = () => { const arr = getPath(b.dataset.streamms+'.milestones'); arr.push({date:today(), text:'', kind:''}); saveNow(); rerender(); });
  root.querySelectorAll('[data-streammspreset]').forEach(s => s.onchange = () => { if(!s.value) return; const arr = getPath(s.dataset.streammspreset+'.milestones');
    const text = s.value === '__custom' ? '' : s.value; arr.push({date:today(), text, kind:s.value==='__custom'?'':s.value}); saveNow(); rerender(); });
  root.querySelectorAll('[data-streammsdel]').forEach(b => b.onclick = () => { const [path, i] = b.dataset.streammsdel.split(':'); const arr = getPath(path+'.milestones'); requestDelete({label:arr[+i].text||'milestone', remove:()=>spliceOut(arr, x=>x===arr[+i])}); });
  root.querySelectorAll('[data-streamstatus]').forEach(s => s.onchange = () => { getPath(s.dataset.streamstatus).status = s.value; saveNow(); rerender(); });
  root.querySelectorAll('[data-streamcur]').forEach(s => s.onchange = () => { getPath(s.dataset.streamcur).currency = s.value; saveNow(); rerender(); });
  root.querySelectorAll('[data-streamlog]').forEach(b => b.onclick = () => openRevenueLogModal(b.dataset.streamlog));
  /* cross-tagging on both streams and scenarios — this is also how a project
     gets attached to a stream that was created standalone */
  root.querySelectorAll('[data-finlinks]').forEach(box => {
    const owner = getPath(box.dataset.finlinks); if(!owner) return;
    owner.links = normLinks(owner.links);
    bindLinksEditor(box, owner.links, () => finLiveRecalc());
  });
  /* editable categories: renaming happens in the summary, so a click on the
     name must not also toggle the section open or shut */
  root.querySelectorAll('.spend-cat > summary').forEach(sm => sm.addEventListener('click', e => { if(e.target.closest('.ed, .cat-tools')) e.preventDefault(); }));
  root.querySelectorAll('[data-catadd]').forEach(b => b.onclick = () => { const sc = byId(S.finance.scenarios, b.dataset.catadd); const c = {id:uid(), name:'', items:[]}; sc.categories.push(c); S._finOpenCats = S._finOpenCats||{}; S._finOpenCats[c.id] = true; saveNow(); sound('success'); rerender();
    setTimeout(()=>{ const n = document.querySelector(`.spend-cat[data-cat="${c.id}"] .ed`); n && beginEdit(n); }, 60); });
  root.querySelectorAll('[data-catmove]').forEach(b => b.onclick = () => { const [scId, cId, dir] = b.dataset.catmove.split(':'); const sc = byId(S.finance.scenarios, scId);
    const i = sc.categories.findIndex(c => c.id === cId); const j = i + (+dir); if(i<0 || j<0 || j>=sc.categories.length) return;
    [sc.categories[i], sc.categories[j]] = [sc.categories[j], sc.categories[i]]; saveNow(); sound('click'); rerender(); });
  root.querySelectorAll('[data-catdel]').forEach(b => b.onclick = () => { const [scId, cId] = b.dataset.catdel.split(':'); const sc = byId(S.finance.scenarios, scId); const c = byId(sc.categories, cId);
    requestDelete({label:`${c.name||'category'}${c.items.length?` and its ${c.items.length} line item${c.items.length>1?'s':''}`:''}`, node:b.closest('.spend-cat'), remove:()=>spliceOut(sc.categories, x=>x.id===cId)}); });
  root.querySelectorAll('[data-scenariopick]').forEach(b => b.onclick = () => { S.finance.scenarios.forEach(sc => sc.active = sc.id === b.dataset.scenariopick); saveNow(); sound('click'); rerender(); });
  root.querySelectorAll('[data-scenariocur]').forEach(s => s.onchange = () => { byId(S.finance.scenarios, s.dataset.scenariocur).currency = s.value; saveNow(); rerender(); });
  root.querySelectorAll('[data-scenariodel]').forEach(b => b.onclick = () => { const sc = byId(S.finance.scenarios, b.dataset.scenariodel); requestDelete({label:sc.name, node:b.closest('.scenario-card'), remove:()=>{ const wasActive = sc.active; const undo = spliceOut(S.finance.scenarios, x=>x.id===sc.id); if(wasActive && S.finance.scenarios.length) S.finance.scenarios[0].active = true; return undo; }}); });
  $('#finPrin').onclick = () => { S.finance.principles.push(''); saveNow(); rerender(); setTimeout(()=>{ const n = document.querySelectorAll('.principles .ed'); n.length && beginEdit(n[n.length-1]); }, 60); };
  root.querySelectorAll('[data-fpdel]').forEach(b => b.onclick = () => { const i = +b.dataset.fpdel; requestDelete({label:S.finance.principles[i]||'this principle', node:b.closest('li'), remove:()=>{ const g = S.finance.principles.splice(i,1)[0]; return () => S.finance.principles.splice(i,0,g); }}); });
  $('#finCur').onchange = e => { S.finance.currency = e.target.value; saveNow(); rerender(); };
  root.querySelectorAll('[data-fxrate]').forEach(i => i.onchange = () => { S.finance.rates[i.dataset.fxrate] = parseFloat(i.value) || 1; saveNow(); rerender(); });
  reveal(root);
};
