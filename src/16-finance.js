/* ============================================================
   FINANCE — a manual cockpit, not a bank aggregator.
   Nothing syncs, because nothing leaves this machine. The value
   is in entering it: a number you typed is a number you have
   looked at. Four tabs — the dashboard, the ledger, the
   envelopes, and the targets — plus what they add up to.
   ============================================================ */
const ACCOUNT_TYPES = {
  checking:   ['◫','Checking',    '#6b7f8e'],
  savings:    ['◈','Savings',     '#7f916a'],
  credit_card:['▤','Credit card', '#a0727e'],
  investment: ['↗','Investment',  '#b08968'],
  cash:       ['◉','Cash',        '#c47832'],
  loan:       ['◐','Loan',        '#8e5f6b'],
  other:      ['·','Other',       '#8a8d8f'],
};
const LIABILITY_TYPES = ['credit_card','loan'];
const CURRENCIES = ['SGD','USD','EUR','GBP','JPY','AUD','CNY','HKD','MYR','INR'];
const CURRENCY_SIGN = {SGD:'S$',USD:'$',EUR:'€',GBP:'£',JPY:'¥',AUD:'A$',CNY:'¥',HKD:'HK$',MYR:'RM',INR:'₹'};
const DEFAULT_CATEGORIES = [
  {id:'food',      name:'Food & Dining', color:'#c47832'},
  {id:'transport', name:'Transport',     color:'#6b7f8e'},
  {id:'housing',   name:'Housing',       color:'#b08968'},
  {id:'utilities', name:'Utilities',     color:'#8a8d8f'},
  {id:'fun',       name:'Entertainment', color:'#a0727e'},
  {id:'shopping',  name:'Shopping',      color:'#9a8fb8'},
  {id:'health',    name:'Health',        color:'#7f916a'},
  {id:'learning',  name:'Education',     color:'#6fa39a'},
  {id:'saving',    name:'Savings',       color:'#5f8f6a'},
  {id:'income',    name:'Income',        color:'#d4a44c'},
  {id:'other',     name:'Other',         color:'#a89f94'},
];
const FIN_DEFAULT = {currency:'SGD', categories:[], netWorthLog:[], principles:[], note:'', assigned:{}};
function migrateFinance(){
  S.accounts = Array.isArray(S.accounts) ? S.accounts : [];
  S.txns = Array.isArray(S.txns) ? S.txns : [];
  S.budgets = Array.isArray(S.budgets) ? S.budgets : [];
  S.finGoals = Array.isArray(S.finGoals) ? S.finGoals : [];
  S.finance = Object.assign({}, FIN_DEFAULT, S.finance || {});
  if(!Array.isArray(S.finance.categories) || !S.finance.categories.length) S.finance.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  S.finance.netWorthLog = Array.isArray(S.finance.netWorthLog) ? S.finance.netWorthLog : [];
  S.finance.principles = Array.isArray(S.finance.principles) ? S.finance.principles : [];
  if(!CURRENCIES.includes(S.finance.currency)) S.finance.currency = 'SGD';
  // the earlier income-stream model becomes accounts of type "other" plus goals
  if(Array.isArray(S.streams) && S.streams.length){
    S.streams.forEach(st => {
      if(S.txns.some(t => t.fromStream === st.id)) return;
      const acc = S.accounts.find(a => a.name === 'Main account') || (() => { const a = newAccount('Main account','checking'); S.accounts.push(a); return a; })();
      if(st.monthly > 0 && st.status === 'active') S.txns.push(Object.assign(newTxn(), {amount:+st.monthly, description:`${st.name} (imported stream)`, category:'income', accountId:acc.id, isRecurring:true, recurringRule:{frequency:'monthly', dayOfMonth:1}, fromStream:st.id}));
    });
    if(S.finance.target > 0 && !S.finGoals.length) S.finGoals.push(Object.assign(newFinGoal(), {name:'Enough, per month', targetAmount:+S.finance.target, currentAmount:0, targetDate:S.finance.targetBy||null}));
    delete S.streams;
  }
  S.accounts.forEach(a => { a.balance = +a.balance || 0; a.type = ACCOUNT_TYPES[a.type] ? a.type : 'other'; a.isActive = a.isActive !== false; a.currency = a.currency || S.finance.currency; });
  S.txns.forEach(t => { t.amount = +t.amount || 0; t.tags = t.tags || []; t.notes = t.notes || ''; t.category = t.category || 'other'; });
  S.budgets.forEach(b => { b.monthlyLimit = +b.monthlyLimit || 0; b.rollover = !!b.rollover; });
  S.finGoals.forEach(g => { g.targetAmount = +g.targetAmount || 0; g.currentAmount = +g.currentAmount || 0; g.priority = ['high','medium','low'].includes(g.priority) ? g.priority : 'medium'; g.contributions = g.contributions || []; g.linkedVision = g.linkedVision || null; });
}
function newAccount(name = '', type = 'checking'){ return {id:uid(), name, type, balance:0, currency:S.finance?.currency || 'SGD', institution:'', color:ACCOUNT_TYPES[type][2], isActive:true, lastUpdated:today()}; }
function newTxn(){ return {id:uid(), date:today(), amount:0, description:'', category:'other', accountId:'', isRecurring:false, recurringRule:null, tags:[], notes:''}; }
function newFinGoal(){ return {id:uid(), name:'', targetAmount:0, currentAmount:0, targetDate:null, linkedAccountId:null, linkedVision:null, icon:'◈', priority:'medium', contributions:[]}; }
const cur = () => CURRENCY_SIGN[S.finance?.currency] || '$';
const money = n => { const v = Math.round((+n || 0) * 100) / 100; return `${v < 0 ? '−' : ''}${cur()}${Math.abs(v).toLocaleString(undefined,{maximumFractionDigits:0})}`; };
const txnCatName  = id => (S.finance.categories.find(c => c.id === id) || {}).name || 'Other';
const txnCatColor = id => (S.finance.categories.find(c => c.id === id) || {}).color || 'var(--muted)';
const netWorth = () => sum(S.accounts.filter(a => a.isActive).map(a => LIABILITY_TYPES.includes(a.type) ? -Math.abs(a.balance) : a.balance));
const txnMonth = m => S.txns.filter(t => (t.date||'').slice(0,7) === m);
const monthIncome = m => sum(txnMonth(m).filter(t => t.amount > 0).map(t => t.amount));
const monthSpend  = m => Math.abs(sum(txnMonth(m).filter(t => t.amount < 0).map(t => t.amount)));
const spentIn = (catId, m) => Math.abs(sum(txnMonth(m).filter(t => t.amount < 0 && t.category === catId).map(t => t.amount)));
function snapshotNetWorth(){
  const m = today().slice(0,7); const nw = netWorth();
  const log = S.finance.netWorthLog; const i = log.findIndex(x => x.month === m);
  if(i >= 0) log[i].value = nw; else log.push({month:m, value:nw});
  log.sort((a,b) => a.month.localeCompare(b.month));
}
function upcomingRecurring(n = 5){
  const T = today(); const out = [];
  S.txns.filter(t => t.isRecurring && t.recurringRule).forEach(t => {
    const day = clamp(+t.recurringRule.dayOfMonth || 1, 1, 28);
    let d = `${T.slice(0,7)}-${String(day).padStart(2,'0')}`;
    if(d < T){ const nx = new Date(parseDay(T).getFullYear(), parseDay(T).getMonth()+1, day); d = isoDay(nx); }
    out.push({t, date:d, days:daysBetween(T, d)});
  });
  return out.sort((a,b) => a.date.localeCompare(b.date)).slice(0, n);
}
function financeReading(){
  const out = []; const m = today().slice(0,7);
  if(!S.accounts.length && !S.txns.length) return ['Nothing here yet. Add one account and the balance you can see from your phone; the rest of this page grows from there.'];
  const nw = netWorth(), inc = monthIncome(m), sp = monthSpend(m);
  out.push(`Net worth is **${money(nw)}** across ${S.accounts.filter(a=>a.isActive).length} account${S.accounts.filter(a=>a.isActive).length===1?'':'s'}.`);
  if(inc || sp){
    const net = inc - sp; const rate = inc ? Math.round(net / inc * 100) : 0;
    out.push(net >= 0
      ? `This month: **${money(inc)}** in, ${money(sp)} out — you kept **${rate}%** of what came in.`
      : `This month you spent **${money(Math.abs(net))} more than you earned**. One month is noise; three is a pattern.`);
  }
  const over = S.budgets.filter(b => spentIn(b.category, m) > b.monthlyLimit && b.monthlyLimit > 0);
  if(over.length) out.push(`${over.length === 1 ? 'One envelope is' : `${over.length} envelopes are`} over: ${over.map(b => `**${esc(txnCatName(b.category))}** (${money(spentIn(b.category,m))} of ${money(b.monthlyLimit)})`).join(', ')}.`);
  else if(S.budgets.length) out.push('Every envelope is still inside its limit this month.');
  const g = [...S.finGoals].sort((a,b) => (b.currentAmount/Math.max(b.targetAmount,1)) - (a.currentAmount/Math.max(a.targetAmount,1)))[0];
  if(g && g.targetAmount) out.push(`**${esc(g.name)}** is ${Math.round(g.currentAmount/g.targetAmount*100)}% funded — ${money(g.targetAmount - g.currentAmount)} to go${g.targetDate ? `, ${daysBetween(today(), g.targetDate) > 0 ? `${Math.round(daysBetween(today(), g.targetDate)/30)} months out` : 'and the date has passed'}` : ''}.`);
  const log = S.finance.netWorthLog;
  if(log.length > 1){ const d = log[log.length-1].value - log[0].value;
    out.push(`Since ${fmtMonthName(log[0].month)}, net worth has ${d >= 0 ? 'risen' : 'fallen'} by **${money(Math.abs(d))}**.`); }
  return out;
}
function fmtMonthName(k){ const [y,m] = String(k||'').split('-'); return m ? `${MONTHS[+m-1].slice(0,3)} ${y}` : k; }

routes.finance = function(root, params){
  migrateFinance(); snapshotNetWorth();
  const tab = ['dashboard','ledger','budgets','goals','insights'].includes(params[0]) ? params[0] : (S._finTab || 'dashboard');
  S._finTab = tab;
  registerPageEntry({pageName:'Finance', addLabel:'Add a transaction', defaultEntryType:'txn', prefilledFields:{}, options:[
    {icon:'＋', label:'Transaction', desc:'Something you spent or earned.', run:()=>{ S._finTab='ledger'; navigate('#/finance/ledger'); setTimeout(()=>document.querySelector('#txAmount')?.focus(), 300); }},
    {icon:'◫', label:'Account', desc:'Somewhere money sits.', run:()=>openAccountModal()},
    {icon:'◈', label:'Goal', desc:'A number you are saving toward.', run:()=>openFinGoalModal()}]});
  root.innerHTML = `<div class="page">
    <div class="page-head"><h1>Finance</h1><div class="sub">Nothing syncs here, because nothing leaves this machine. The value is in typing it: a number you entered is a number you have actually looked at.</div></div>
    <div class="tabs">${[['dashboard','Dashboard'],['ledger','Transactions'],['budgets','Budgets'],['goals','Goals'],['insights','Insights']].map(([k,l])=>`<button class="${tab===k?'active':''}" data-fintab="${k}">${l}</button>`).join('')}</div>
    <div id="finBody"></div></div>`;
  const body = $('#finBody');
  ({dashboard:finDashboard, ledger:finLedger, budgets:finBudgets, goals:finGoals, insights:finInsights}[tab])(body);
  $$('[data-fintab]',root).forEach(b => b.onclick = () => { S._finTab = b.dataset.fintab; navigate('#/finance/' + b.dataset.fintab); if(location.hash === '#/finance/' + b.dataset.fintab) rerender(); });
  reveal(body);
};

/* ---------- tab 1: dashboard ---------- */
function finDashboard(box){
  const m = today().slice(0,7); const inc = monthIncome(m), sp = monthSpend(m);
  const log = S.finance.netWorthLog.slice(-6);
  const rd = financeReading();
  box.innerHTML = `
    <section class="reading-card rv" style="margin-bottom:20px"><div class="sc">Where you stand</div>
      <div class="reading-body">${rd.map(l=>`<p>${mdInline(l)}</p>`).join('')}</div></section>

    <div class="card rv nw-card"><div class="row between"><span class="sc" style="margin:0">Net worth</span><span class="mono">${S.accounts.filter(a=>a.isActive).length} accounts · ${esc(S.finance.currency)}</span></div>
      <div class="row between" style="align-items:flex-end;margin-top:6px"><div class="nw-num">${money(netWorth())}</div>
        <div style="flex:1;max-width:340px">${log.length > 1 ? sparkline(log.map(x=>x.value),{h:46,color:'var(--page-accent)',dots:true,labels:log.map(x=>`${fmtMonthName(x.month)}: ${money(x.value)}`)}) : '<span class="mono faint">a line appears once there are two months</span>'}</div></div></div>

    <div class="acct-row rv">${S.accounts.filter(a=>a.isActive).map(a => { const t = ACCOUNT_TYPES[a.type];
      return `<button class="acct" data-acct="${a.id}" style="--c:${a.color||t[2]}">
        <span class="ac-top"><span class="ac-ico">${t[0]}</span><span class="mono">${esc(t[1])}</span></span>
        <span class="ac-name">${esc(a.name)}</span>
        <span class="ac-bal ${LIABILITY_TYPES.includes(a.type)?'neg':''}">${money(LIABILITY_TYPES.includes(a.type) ? -Math.abs(a.balance) : a.balance)}</span>
        <span class="mono ac-when">${a.institution?esc(a.institution)+' · ':''}${a.lastUpdated ? `updated ${relDays(daysSince(a.lastUpdated))}` : ''}</span></button>`; }).join('')}
      <button class="acct add" id="acctAdd"><span class="ac-plus">＋</span><span class="ac-name">Add an account</span></button></div>

    <div class="card rv" style="margin-top:20px"><div class="income-strip">
      <div><div class="k">in, this month</div><div class="num" style="color:var(--sage)">${money(inc)}</div></div>
      <div><div class="k">out, this month</div><div class="num" style="color:${sp?'#d08080':'var(--muted)'}">${money(sp)}</div></div>
      <div><div class="k">net</div><div class="num" style="color:${inc-sp>=0?'var(--sage)':'#d08080'}">${money(inc-sp)}</div><div class="mono">${inc?`${Math.round((inc-sp)/inc*100)}% kept`:''}</div></div>
      <div><div class="k">transactions</div><div class="num">${txnMonth(m).length}</div></div>
    </div></div>

    ${S.budgets.length ? `<section class="section rv"><div class="row between"><span class="sc" style="margin:0">Envelopes</span><button class="btn sm ghost" data-fingo="budgets">manage →</button></div>
      <div class="card" style="margin-top:10px">${S.budgets.map(b => { const s = spentIn(b.category, m); const pct = b.monthlyLimit ? s/b.monthlyLimit*100 : 0;
        return `<div class="bud-line"><span class="bl-name" style="color:${txnCatColor(b.category)}">${esc(txnCatName(b.category))}</span>
          <span class="bar ${pct>=100?'over':pct>=75?'warn':''}" style="--c:${txnCatColor(b.category)}"><i style="width:${clamp(pct,0,100)}%"></i></span>
          <span class="mono">${money(s)} / ${money(b.monthlyLimit)}</span></div>`; }).join('')}</div></section>` : ''}

    ${upcomingRecurring().length ? `<section class="section rv"><span class="sc">Coming up</span>
      <div class="card">${upcomingRecurring().map(({t,date,days}) => `<div class="row between" style="padding:6px 0;border-top:1px dashed var(--line)"><span>${esc(t.description)}</span><span class="row"><span class="mono">${fmtDate(date,'med')}${days<=7?` · ${days===0?'today':`${days}d`}`:''}</span><span class="mono" style="color:${t.amount>=0?'var(--sage)':'var(--muted)'};min-width:6em;text-align:right">${money(t.amount)}</span></span></div>`).join('')}</div></section>` : ''}`;
  $('#acctAdd').onclick = () => openAccountModal();
  $$('[data-acct]',box).forEach(b => b.onclick = () => openAccountModal(byId(S.accounts, b.dataset.acct)));
  $$('[data-fingo]',box).forEach(b => b.onclick = () => { S._finTab = b.dataset.fingo; navigate('#/finance/'+b.dataset.fingo); });
}
function openAccountModal(ex){
  const a = ex || newAccount();
  const m = openModal(`<h2>${ex?'Account':'A place money sits'}</h2><div class="stack">
    <div class="field"><label>Name</label><input class="inp serif-lg" id="acName" value="${esc(a.name)}" placeholder="Everyday account" autofocus></div>
    <div class="grid c2" style="gap:10px">
      <div class="field"><label>Type</label><select class="sel" id="acType">${Object.entries(ACCOUNT_TYPES).map(([k,v])=>`<option value="${k}" ${a.type===k?'selected':''}>${v[0]} ${v[1]}</option>`).join('')}</select></div>
      <div class="field"><label>Balance</label><input class="inp mono" id="acBal" value="${a.balance||''}" inputmode="decimal" placeholder="0"></div>
    </div>
    <div class="grid c2" style="gap:10px">
      <div class="field"><label>Institution</label><input class="inp" id="acInst" value="${esc(a.institution)}" placeholder="optional"></div>
      <div class="field"><label>Currency</label><select class="sel" id="acCur">${CURRENCIES.map(c=>`<option ${((a.currency)||S.finance.currency)===c?'selected':''}>${c}</option>`).join('')}</select></div>
    </div>
    <div class="faint" style="font-size:.76rem">For a credit card or loan, enter what you owe as a positive number — it is subtracted from net worth.</div>
  </div><div class="row between" style="margin-top:16px">${ex?'<button class="btn sm ghost danger" id="acDel">Delete</button>':'<span></span>'}<button class="btn primary" id="acSave">${ex?'Save':'Add'}</button></div>`, 'narrow');
  m.querySelector('#acSave').onclick = () => {
    const name = m.querySelector('#acName').value.trim(); if(!name){ toast('It needs a name.'); return; }
    const type = m.querySelector('#acType').value;
    Object.assign(a, {name, type, balance:+String(m.querySelector('#acBal').value).replace(/[^\d.-]/g,'')||0,
      institution:m.querySelector('#acInst').value.trim(), currency:m.querySelector('#acCur').value, color:ACCOUNT_TYPES[type][2], lastUpdated:today()});
    if(!ex) S.accounts.push(a);
    snapshotNetWorth(); saveNow(); m.remove(); sound('success'); rerender();
  };
  if(ex) m.querySelector('#acDel').onclick = () => { m.remove(); requestDelete({label:a.name, remove:()=>spliceOut(S.accounts, x=>x.id===a.id)}); };
}

/* ---------- tab 2: the ledger ---------- */
function finLedger(box){
  const f = S._finF = S._finF || {q:'', cat:'all', acct:'all', dir:'all', from:'', to:''};
  const list = S.txns.filter(t => {
    if(f.cat !== 'all' && t.category !== f.cat) return false;
    if(f.acct !== 'all' && t.accountId !== f.acct) return false;
    if(f.dir === 'in' && t.amount <= 0) return false;
    if(f.dir === 'out' && t.amount >= 0) return false;
    if(f.from && t.date < f.from) return false;
    if(f.to && t.date > f.to) return false;
    if(f.q && !`${t.description} ${t.notes} ${txnCatName(t.category)}`.toLowerCase().includes(f.q.toLowerCase())) return false;
    return true;
  }).sort((a,b) => b.date.localeCompare(a.date) || (b.id > a.id ? 1 : -1));
  const shown = sum(list.map(t => t.amount));
  const recent = [...new Set(S.txns.slice(-40).map(t => t.category))];
  const cats = [...recent.map(id => S.finance.categories.find(c=>c.id===id)).filter(Boolean), ...S.finance.categories.filter(c => !recent.includes(c.id))];
  box.innerHTML = `
    <div class="card rv quick-txn"><div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-end">
      <div class="field" style="width:8.5em"><label>Date</label><input class="inp" type="date" id="txDate" value="${today()}"></div>
      <div class="field" style="width:8em"><label>Amount</label><input class="inp mono" id="txAmount" placeholder="-12.50" inputmode="decimal"></div>
      <div class="field" style="flex:1;min-width:170px"><label>What was it</label><input class="inp" id="txDesc" placeholder="lunch, salary, train fare"></div>
      <div class="field" style="width:11em"><label>Category</label><select class="sel" id="txCat">${cats.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
      <div class="field" style="width:11em"><label>Account</label><select class="sel" id="txAcct">${S.accounts.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('')||'<option value="">no accounts yet</option>'}</select></div>
      <button class="btn primary" id="txAdd">Add</button></div>
      <div class="faint" style="font-size:.76rem;margin-top:6px">Negative is money out, positive is money in. Press Enter in any field to save.</div></div>

    <div class="filter-bar rv" style="margin-top:16px">
      <input class="inp" id="txq" placeholder="search description, notes, category" value="${esc(f.q)}">
      <select class="sel" id="txfCat"><option value="all">every category</option>${S.finance.categories.map(c=>`<option value="${c.id}" ${f.cat===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select>
      <select class="sel" id="txfAcct"><option value="all">every account</option>${S.accounts.map(a=>`<option value="${a.id}" ${f.acct===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</select>
      <select class="sel" id="txfDir">${[['all','in and out'],['in','money in'],['out','money out']].map(([v,l])=>`<option value="${v}" ${f.dir===v?'selected':''}>${l}</option>`).join('')}</select>
      <input class="inp" type="date" id="txfFrom" value="${f.from}" style="width:9.5em"><input class="inp" type="date" id="txfTo" value="${f.to}" style="width:9.5em">
      <button class="btn sm ghost" id="txCats">⚙ categories</button>
    </div>

    <div class="row between rv" style="margin:10px 0"><span class="mono">${list.length} shown</span><span class="mono" style="color:${shown>=0?'var(--sage)':'#d08080'}">net ${money(shown)}</span></div>
    <div class="txn-list rv">${list.length ? list.slice(0,300).map(t => `<div class="txn" data-txn="${t.id}">
        <span class="tx-date mono">${fmtDate(t.date,'short')}</span>
        <span class="tx-cat" style="--c:${txnCatColor(t.category)}" title="${esc(txnCatName(t.category))}"></span>
        <span class="tx-desc">${esc(t.description||'—')}${t.isRecurring?'<span class="mono tx-rec">↻</span>':''}</span>
        <span class="tx-acct mono">${esc(byId(S.accounts,t.accountId)?.name||'')}</span>
        <span class="tx-amt ${t.amount>=0?'pos':'neg'}">${money(t.amount)}</span>
        <button class="del-x inline" data-txdel="${t.id}">×</button></div>`).join('')
      : '<div class="empty">No transactions match. The first one can be whatever you spent today.</div>'}</div>`;
  const num = v => +String(v).replace(/[^\d.-]/g,'') || 0;
  const add = () => {
    const amt = num($('#txAmount').value); const desc = $('#txDesc').value.trim();
    if(!amt){ toast('An amount, at least. Negative for money out.'); return; }
    const t = Object.assign(newTxn(), {date:$('#txDate').value || today(), amount:amt, description:desc, category:$('#txCat').value, accountId:$('#txAcct').value});
    S.txns.push(t);
    const a = byId(S.accounts, t.accountId);
    if(a){ a.balance = LIABILITY_TYPES.includes(a.type) ? a.balance - amt : a.balance + amt; a.lastUpdated = today(); }
    snapshotNetWorth(); saveNow(); sound('success'); rerender(); setTimeout(()=>$('#txAmount')?.focus(), 60);
  };
  $('#txAdd').onclick = add;
  ['#txAmount','#txDesc','#txDate'].forEach(id => $(id).onkeydown = e => { if(e.key === 'Enter') add(); });
  const bind = (id, key) => { const el_ = $(id); if(el_) el_.onchange = () => { f[key] = el_.value; rerender(); }; };
  bind('#txfCat','cat'); bind('#txfAcct','acct'); bind('#txfDir','dir'); bind('#txfFrom','from'); bind('#txfTo','to');
  $('#txq').addEventListener('input', debounce(() => { f.q = $('#txq').value; rerender(); const i = $('#txq'); if(i){ i.focus(); i.setSelectionRange(i.value.length,i.value.length); } }, 350));
  $('#txCats').onclick = () => openCategoryModal();
  $$('[data-txn]',box).forEach(r => r.addEventListener('click', e => { if(e.target.closest('.del-x')) return; openTxnModal(byId(S.txns, r.dataset.txn)); }));
  $$('[data-txdel]',box).forEach(b => b.onclick = e => { e.stopPropagation(); const t = byId(S.txns, b.dataset.txdel);
    requestDelete({label:t.description || money(t.amount), node:b.closest('.txn'), remove:()=>{ const a = byId(S.accounts,t.accountId); if(a) a.balance = LIABILITY_TYPES.includes(a.type) ? a.balance + t.amount : a.balance - t.amount; return spliceOut(S.txns, x=>x.id===t.id); }}); });
}
function openTxnModal(t){
  if(!t) return;
  const m = openModal(`<h2>Transaction</h2><div class="stack">
    <div class="grid c2" style="gap:10px">
      <div class="field"><label>Date</label><input class="inp" type="date" id="etDate" value="${t.date}"></div>
      <div class="field"><label>Amount</label><input class="inp mono" id="etAmt" value="${t.amount}"></div>
    </div>
    <div class="field"><label>Description</label><input class="inp" id="etDesc" value="${esc(t.description)}"></div>
    <div class="grid c2" style="gap:10px">
      <div class="field"><label>Category</label><select class="sel" id="etCat">${S.finance.categories.map(c=>`<option value="${c.id}" ${t.category===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div>
      <div class="field"><label>Account</label><select class="sel" id="etAcct">${S.accounts.map(a=>`<option value="${a.id}" ${t.accountId===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</select></div>
    </div>
    <label class="toggle ${t.isRecurring?'on':''}" id="etRec"><span class="sw"></span><span>repeats monthly</span></label>
    <div class="field" id="etDayF" ${t.isRecurring?'':'hidden'}><label>On day of month</label><input class="inp mono" id="etDay" value="${t.recurringRule?.dayOfMonth||1}" style="width:5em"></div>
    <div class="field"><label>Notes</label><textarea class="ta" id="etNotes">${esc(t.notes)}</textarea></div>
  </div><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="etSave">Save</button></div>`, 'narrow');
  let rec = t.isRecurring;
  m.querySelector('#etRec').onclick = function(){ rec = !rec; this.classList.toggle('on', rec); m.querySelector('#etDayF').hidden = !rec; };
  m.querySelector('#etSave').onclick = () => {
    const old = t.amount; const a0 = byId(S.accounts, t.accountId);
    if(a0) a0.balance = LIABILITY_TYPES.includes(a0.type) ? a0.balance + old : a0.balance - old;
    Object.assign(t, {date:m.querySelector('#etDate').value, amount:+String(m.querySelector('#etAmt').value).replace(/[^\d.-]/g,'')||0,
      description:m.querySelector('#etDesc').value.trim(), category:m.querySelector('#etCat').value, accountId:m.querySelector('#etAcct').value,
      isRecurring:rec, recurringRule: rec ? {frequency:'monthly', dayOfMonth:+m.querySelector('#etDay').value||1} : null, notes:m.querySelector('#etNotes').value});
    const a1 = byId(S.accounts, t.accountId);
    if(a1){ a1.balance = LIABILITY_TYPES.includes(a1.type) ? a1.balance - t.amount : a1.balance + t.amount; a1.lastUpdated = today(); }
    snapshotNetWorth(); saveNow(); m.remove(); sound('success'); rerender();
  };
}
function openCategoryModal(){
  const draw = () => S.finance.categories.map((c,i)=>`<div class="row" style="gap:8px;align-items:center"><input type="color" value="${c.color}" data-catc="${i}" style="width:30px;height:26px;border:none;background:none;padding:0;cursor:pointer"><input class="inp" value="${esc(c.name)}" data-catn="${i}" style="flex:1"><span class="mono">${S.txns.filter(t=>t.category===c.id).length}</span><button class="del-x inline" data-catd="${i}">×</button></div>`).join('');
  const m = openModal(`<h2>Categories</h2><p class="muted" style="font-size:.86rem">Deleting one moves its transactions to Other.</p><div class="stack" id="catList" style="gap:6px">${draw()}</div><div class="row between" style="margin-top:14px"><button class="btn sm ghost" id="catAdd">＋ category</button><button class="btn primary" id="catDone">Done</button></div>`, 'narrow');
  const rebind = () => {
    m.querySelectorAll('[data-catn]').forEach(i => i.onchange = () => { S.finance.categories[+i.dataset.catn].name = i.value; saveNow(); });
    m.querySelectorAll('[data-catc]').forEach(i => i.onchange = () => { S.finance.categories[+i.dataset.catc].color = i.value; saveNow(); });
    m.querySelectorAll('[data-catd]').forEach(b => b.onclick = () => { const c = S.finance.categories[+b.dataset.catd];
      S.txns.forEach(t => { if(t.category === c.id) t.category = 'other'; });
      S.budgets = S.budgets.filter(x => x.category !== c.id);
      S.finance.categories.splice(+b.dataset.catd,1); saveNow(); m.querySelector('#catList').innerHTML = draw(); rebind(); });
  };
  rebind();
  m.querySelector('#catAdd').onclick = () => { S.finance.categories.push({id:uid(), name:'New category', color:'#8a8d8f'}); saveNow(); m.querySelector('#catList').innerHTML = draw(); rebind(); };
  m.querySelector('#catDone').onclick = () => { m.remove(); rerender(); };
}

/* ---------- tab 3: envelopes ---------- */
function finBudgets(box){
  const m = S._budMonth || today().slice(0,7);
  const isNow = m === today().slice(0,7);
  const inc = monthIncome(m);
  const assigned = sum(S.budgets.map(b => +b.monthlyLimit || 0));
  const left = inc - assigned;
  const unbudgeted = S.finance.categories.filter(c => c.id !== 'income' && !S.budgets.some(b => b.category === c.id));
  const shift = n => { const d = new Date(+m.slice(0,4), +m.slice(5,7)-1+n, 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
  box.innerHTML = `
    <div class="row between rv" style="margin-bottom:14px"><div class="row"><button class="btn sm ghost" id="bmPrev">‹</button><span class="serif" style="min-width:8em;text-align:center;font-size:1.1rem">${fmtMonthName(m)}</span><button class="btn sm ghost" id="bmNext">›</button>${isNow?'':'<span class="status-pill">read only</span>'}</div>
      <button class="btn sm primary" id="budAdd">＋ Envelope</button></div>

    <div class="card rv assign-card"><div class="row between"><span class="sc" style="margin:0">Money to assign</span><span class="mono">${money(inc)} came in this month</span></div>
      <div class="assign-num ${left===0?'done':left<0?'over':''}">${left === 0 && inc > 0 ? 'Every dollar has a job ✓' : money(left)}</div>
      <div class="faint" style="font-size:.78rem">${left > 0 ? 'Still unassigned. Give it a envelope below, even if that envelope is Savings.' : left < 0 ? 'You have assigned more than came in. Pull a limit down somewhere.' : inc ? 'Nothing left over — the whole month is accounted for.' : 'Log some income and this number starts moving.'}</div></div>

    ${S.budgets.length ? `<div class="env-grid rv">${S.budgets.map((b,i) => { const s = spentIn(b.category, m); const lim = +b.monthlyLimit||0; const pct = lim ? s/lim*100 : 0; const rem = lim - s;
      return `<div class="env" style="--c:${txnCatColor(b.category)}">
        <div class="row between"><b>${esc(txnCatName(b.category))}</b><button class="del-x inline" data-buddel="${b.id}">×</button></div>
        <div class="env-num"><span class="${rem<0?'neg':''}">${money(rem)}</span><span class="mono">left of ${money(lim)}</span></div>
        <div class="bar ${pct>=100?'over':pct>=75?'warn':''}" style="--c:${txnCatColor(b.category)}"><i style="width:${clamp(pct,0,100)}%"></i></div>
        <div class="row between mono"><span>${money(s)} spent</span><span>${Math.round(pct)}%</span></div>
        ${isNow ? `<input type="range" class="slider env-slider" min="0" max="${Math.max(lim*2, 500)}" step="10" value="${lim}" data-budlim="${b.id}" style="--c:${txnCatColor(b.category)}">
        <label class="toggle sm ${b.rollover?'on':''}" data-budroll="${b.id}"><span class="sw"></span><span>roll unspent over</span></label>` : ''}
      </div>`; }).join('')}</div>`
      : '<div class="empty rv">No envelopes yet. Start with the three categories you actually overspend on — the rest can wait.</div>'}

    ${unbudgeted.length && isNow ? `<div class="row rv" style="gap:6px;flex-wrap:wrap;margin-top:14px"><span class="mono">no envelope yet:</span>${unbudgeted.map(c=>`<button class="chip click" style="--c:${c.color}" data-budnew="${c.id}">＋ ${esc(c.name)}</button>`).join('')}</div>` : ''}`;
  $('#bmPrev').onclick = () => { S._budMonth = shift(-1); rerender(); };
  $('#bmNext').onclick = () => { S._budMonth = shift(1); rerender(); };
  $('#budAdd').onclick = () => openBudgetModal();
  $$('[data-budnew]',box).forEach(b => b.onclick = () => { S.budgets.push({id:uid(), category:b.dataset.budnew, monthlyLimit:100, rollover:false}); saveNow(); rerender(); });
  $$('[data-buddel]',box).forEach(b => b.onclick = () => { const bd = byId(S.budgets, b.dataset.buddel); requestDelete({label:txnCatName(bd.category)+' envelope', node:b.closest('.env'), remove:()=>spliceOut(S.budgets, x=>x.id===bd.id)}); });
  $$('[data-budlim]',box).forEach(sl => { sl.oninput = () => { const b = byId(S.budgets, sl.dataset.budlim); b.monthlyLimit = +sl.value;
      const env = sl.closest('.env'); const s = spentIn(b.category, m); const pct = b.monthlyLimit ? s/b.monthlyLimit*100 : 0;
      env.querySelector('.env-num span').textContent = money(b.monthlyLimit - s);
      env.querySelector('.env-num .mono').textContent = `left of ${money(b.monthlyLimit)}`;
      const bar = env.querySelector('.bar'); bar.querySelector('i').style.width = clamp(pct,0,100)+'%';
      bar.classList.toggle('over', pct>=100); bar.classList.toggle('warn', pct>=75 && pct<100); };
    sl.onchange = () => { saveNow(); rerender(); }; });
  $$('[data-budroll]',box).forEach(t => t.onclick = () => { const b = byId(S.budgets, t.dataset.budroll); b.rollover = !b.rollover; saveNow(); t.classList.toggle('on', b.rollover); });
}
function openBudgetModal(){
  const free = S.finance.categories.filter(c => !S.budgets.some(b => b.category === c.id));
  if(!free.length){ toast('Every category already has an envelope.'); return; }
  const m = openModal(`<h2>New envelope</h2><div class="stack">
    <div class="field"><label>Category</label><select class="sel" id="bmCat">${free.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
    <div class="field"><label>Monthly limit</label><input class="inp mono" id="bmLim" placeholder="0" inputmode="decimal" autofocus></div>
  </div><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="bmSave">Add</button></div>`, 'narrow');
  m.querySelector('#bmSave').onclick = () => {
    S.budgets.push({id:uid(), category:m.querySelector('#bmCat').value, monthlyLimit:+String(m.querySelector('#bmLim').value).replace(/[^\d.-]/g,'')||0, rollover:false});
    saveNow(); m.remove(); sound('success'); rerender();
  };
}

/* ---------- tab 4: goals ---------- */
function finGoals(box){
  const list = [...S.finGoals].sort((a,b) => ({high:0,medium:1,low:2}[a.priority] - {high:0,medium:1,low:2}[b.priority]));
  box.innerHTML = `
    <div class="row between rv" style="margin-bottom:14px"><span class="mono">${list.length} goal${list.length===1?'':'s'} · drag to reprioritise</span><button class="btn sm primary" id="fgAdd">＋ Goal</button></div>
    ${list.length ? `<div class="goal-grid rv">${list.map(g => { const pct = g.targetAmount ? clamp(g.currentAmount/g.targetAmount*100,0,100) : 0;
      const days = g.targetDate ? daysBetween(today(), g.targetDate) : null;
      const perMonth = (days && days > 0 && g.targetAmount > g.currentAmount) ? (g.targetAmount - g.currentAmount) / Math.max(days/30, 1) : null;
      const vis = g.linkedVision ? byId(S.visions, g.linkedVision) : null;
      return `<div class="fgoal" draggable="true" data-fgdrag="${g.id}" style="--c:${pct>=100?'var(--sage)':'var(--page-accent)'}">
        <div class="row between"><b class="serif" style="font-size:1.08rem">${g.icon||'◈'} ${esc(g.name)}</b><span class="pri ${g.priority}">${esc(g.priority)}</span></div>
        <div class="fg-num">${money(g.currentAmount)}<span class="mono"> of ${money(g.targetAmount)}</span></div>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <div class="row between mono"><span>${Math.round(pct)}%</span><span>${days === null ? 'no date' : days < 0 ? `${-days}d past` : `${days}d left`}</span></div>
        ${perMonth ? `<div class="mono fg-rate">${money(perMonth)} a month to make it</div>` : ''}
        ${vis ? `<a class="chip on click" style="--c:var(--sage);text-decoration:none" href="#/vision/${vis.id}">🌿 ${esc(vis.name)}</a>` : ''}
        ${g.contributions.length ? `<div class="fg-hist">${sparkline(g.contributions.map((c,i)=>sum(g.contributions.slice(0,i+1).map(x=>x.amount))),{h:26,color:'var(--page-accent)'})}</div>` : ''}
        <div class="row" style="gap:6px;margin-top:8px"><button class="btn sm primary" data-fgfund="${g.id}">Fund it</button><button class="btn sm ghost" data-fgedit="${g.id}">edit</button><button class="del-x inline" data-fgdel="${g.id}">×</button></div>
      </div>`; }).join('')}</div>`
      : '<div class="empty rv">No goals yet. An emergency fund is the least exciting and most useful one to start with.</div>'}`;
  $('#fgAdd').onclick = () => openFinGoalModal();
  $$('[data-fgedit]',box).forEach(b => b.onclick = () => openFinGoalModal(byId(S.finGoals, b.dataset.fgedit)));
  $$('[data-fgdel]',box).forEach(b => b.onclick = () => { const g = byId(S.finGoals, b.dataset.fgdel); requestDelete({label:g.name, node:b.closest('.fgoal'), remove:()=>spliceOut(S.finGoals, x=>x.id===g.id)}); });
  $$('[data-fgfund]',box).forEach(b => b.onclick = () => openFundModal(byId(S.finGoals, b.dataset.fgfund)));
  let drag = null;
  $$('[data-fgdrag]',box).forEach(c => {
    c.addEventListener('dragstart', () => { drag = c.dataset.fgdrag; c.classList.add('dragging'); });
    c.addEventListener('dragend', () => { c.classList.remove('dragging'); drag = null; });
    c.addEventListener('dragover', e => e.preventDefault());
    c.addEventListener('drop', e => { e.preventDefault(); if(!drag || drag === c.dataset.fgdrag) return;
      const from = S.finGoals.findIndex(x=>x.id===drag), to = S.finGoals.findIndex(x=>x.id===c.dataset.fgdrag);
      S.finGoals.splice(to, 0, S.finGoals.splice(from,1)[0]);
      const order = ['high','medium','low']; S.finGoals.forEach((g,i) => g.priority = order[Math.min(2, Math.floor(i / Math.max(1, Math.ceil(S.finGoals.length/3))))]);
      saveNow(); rerender(); });
  });
}
function openFinGoalModal(ex){
  const g = ex || newFinGoal();
  const m = openModal(`<h2>${ex?'Goal':'Something to save toward'}</h2><div class="stack">
    <div class="row" style="gap:8px"><input class="inp" id="fgIcon" value="${esc(g.icon||'◈')}" style="width:3.5em;text-align:center"><input class="inp serif-lg" id="fgName" value="${esc(g.name)}" placeholder="Emergency fund" style="flex:1" autofocus></div>
    <div class="grid c2" style="gap:10px">
      <div class="field"><label>Target</label><input class="inp mono" id="fgTarget" value="${g.targetAmount||''}" inputmode="decimal"></div>
      <div class="field"><label>Already saved</label><input class="inp mono" id="fgCurrent" value="${g.currentAmount||''}" inputmode="decimal"></div>
    </div>
    <div class="grid c2" style="gap:10px">
      <div class="field"><label>By when</label><input class="inp" type="date" id="fgDate" value="${g.targetDate||''}"></div>
      <div class="field"><label>Priority</label><select class="sel" id="fgPri">${['high','medium','low'].map(p=>`<option ${g.priority===p?'selected':''}>${p}</option>`).join('')}</select></div>
    </div>
    <div class="field"><label>Part of which vision?</label><select class="sel" id="fgVis"><option value="">—</option>${S.visions.filter(v=>!v.archived).map(v=>`<option value="${v.id}" ${g.linkedVision===v.id?'selected':''}>${esc(v.name)}</option>`).join('')}</select></div>
  </div><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="fgSave">${ex?'Save':'Add'}</button></div>`, 'narrow');
  m.querySelector('#fgSave').onclick = () => {
    const name = m.querySelector('#fgName').value.trim(); if(!name){ toast('Name it.'); return; }
    const num = id => +String(m.querySelector(id).value).replace(/[^\d.-]/g,'') || 0;
    Object.assign(g, {name, icon:m.querySelector('#fgIcon').value.trim()||'◈', targetAmount:num('#fgTarget'), currentAmount:num('#fgCurrent'),
      targetDate:m.querySelector('#fgDate').value||null, priority:m.querySelector('#fgPri').value, linkedVision:m.querySelector('#fgVis').value||null});
    if(!ex) S.finGoals.push(g);
    saveNow(); m.remove(); sound('success'); rerender();
  };
}
function openFundModal(g){
  const m = openModal(`<h2>Fund ${esc(g.name)}</h2><p class="muted" style="font-size:.86rem">Logged as a contribution here and as a transaction in the ledger.</p><div class="stack">
    <div class="grid c2" style="gap:10px">
      <div class="field"><label>Amount</label><input class="inp mono" id="fdAmt" inputmode="decimal" autofocus></div>
      <div class="field"><label>Date</label><input class="inp" type="date" id="fdDate" value="${today()}"></div>
    </div>
    <div class="field"><label>From which account</label><select class="sel" id="fdAcct"><option value="">don't record a transaction</option>${S.accounts.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select></div>
    <div class="field"><label>Note</label><input class="inp" id="fdNote" placeholder="optional"></div>
  </div><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="fdSave">Add it</button></div>`, 'narrow');
  m.querySelector('#fdSave').onclick = () => {
    const amt = +String(m.querySelector('#fdAmt').value).replace(/[^\d.-]/g,'') || 0;
    if(!amt){ toast('How much?'); return; }
    const date = m.querySelector('#fdDate').value || today();
    g.contributions.push({date, amount:amt, note:m.querySelector('#fdNote').value.trim()});
    g.currentAmount += amt;
    const acct = m.querySelector('#fdAcct').value;
    if(acct){ S.txns.push(Object.assign(newTxn(), {date, amount:-Math.abs(amt), description:`→ ${g.name}`, category:'saving', accountId:acct}));
      const a = byId(S.accounts, acct); if(a){ a.balance -= Math.abs(amt); a.lastUpdated = today(); } }
    snapshotNetWorth(); saveNow(); m.remove(); sound('success');
    if(g.targetAmount && g.currentAmount >= g.targetAmount && typeof levelUpBurst === 'function' && !reduced()) levelUpBurst(innerWidth/2, innerHeight/3, 'var(--sage)');
    rerender();
  };
}

/* ---------- tab 5: insights ---------- */
function finInsights(box){
  const m = today().slice(0,7);
  const spend = {}; txnMonth(m).filter(t => t.amount < 0).forEach(t => spend[t.category] = (spend[t.category]||0) + Math.abs(t.amount));
  const ranked = Object.entries(spend).sort((a,b) => b[1]-a[1]);
  const totalSpend = sum(ranked.map(r => r[1]));
  const months = [...new Set(S.txns.map(t => (t.date||'').slice(0,7)))].filter(Boolean).sort().slice(-12);
  const inc = months.map(monthIncome), out = months.map(monthSpend);
  const rate = monthIncome(m) ? Math.round((monthIncome(m) - monthSpend(m)) / monthIncome(m) * 100) : null;
  // a donut, drawn by hand
  let a0 = -Math.PI/2; const R = 78, r0 = 48, C = 100;
  const arcs = ranked.map(([id, v]) => { const frac = v/Math.max(totalSpend,1); const a1 = a0 + frac*Math.PI*2;
    const p = (ang, rad) => `${(C+Math.cos(ang)*rad).toFixed(2)},${(C+Math.sin(ang)*rad).toFixed(2)}`;
    const big = frac > .5 ? 1 : 0;
    const d = `M${p(a0,R)} A${R},${R} 0 ${big} 1 ${p(a1,R)} L${p(a1,r0)} A${r0},${r0} 0 ${big} 0 ${p(a0,r0)} Z`;
    a0 = a1; return `<path d="${d}" fill="${txnCatColor(id)}" opacity=".85"><title>${esc(txnCatName(id))}: ${money(v)}</title></path>`; }).join('');
  box.innerHTML = `
    <div class="grid c2 rv" style="align-items:start">
      <div class="card"><span class="sc">Where it went, this month</span>
        ${ranked.length ? `<div class="row" style="gap:18px;margin-top:12px;align-items:center;flex-wrap:wrap">
          <svg viewBox="0 0 200 200" width="180" height="180" style="flex:none">${arcs}<text x="100" y="96" text-anchor="middle" style="fill:var(--text);font-family:var(--serif);font-size:17px">${money(totalSpend)}</text><text x="100" y="114" text-anchor="middle" style="fill:var(--faint);font-family:var(--mono);font-size:9px">spent</text></svg>
          <div class="stack" style="gap:5px;flex:1;min-width:160px">${ranked.map(([id,v])=>`<div class="row between"><span class="row" style="gap:7px"><i style="width:9px;height:9px;border-radius:2px;background:${txnCatColor(id)};display:inline-block"></i>${esc(txnCatName(id))}</span><span class="mono">${money(v)} · ${Math.round(v/totalSpend*100)}%</span></div>`).join('')}</div></div>`
          : '<div class="empty">Nothing spent this month yet.</div>'}</div>
      <div class="card"><span class="sc">Savings rate</span>
        <div class="nw-num" style="color:${rate===null?'var(--muted)':rate>=20?'var(--sage)':rate>=0?'var(--gold)':'#d08080'}">${rate===null?'—':rate+'%'}</div>
        <div class="faint" style="font-size:.8rem">${rate === null ? 'Log some income this month and this fills in.' : rate >= 20 ? 'Comfortably above the rule of thumb.' : rate >= 0 ? 'Positive, but thin. A single envelope pulled down usually finds a few points.' : 'You are spending more than you earn this month.'}</div>
        ${S.finance.principles.length ? `<div class="sc" style="margin-top:16px">Principles</div><ul class="principles">${S.finance.principles.map((p,i)=>`<li><span>${ed(`finance.principles.${i}`,{ph:'a rule you want to keep'})}</span><button class="del-x inline" data-fpdel="${i}">×</button></li>`).join('')}</ul>` : ''}
        <button class="btn sm ghost" id="finPrin" style="margin-top:10px">＋ principle</button></div>
    </div>

    ${months.length > 1 ? `<section class="section rv"><span class="sc">In and out, by month</span>
      <div class="card">${multiSpark([{vals:inc, color:'var(--sage)'},{vals:out, color:'#c07070'}],{h:70})}
        <div class="legend" style="margin-top:8px"><span style="--c:var(--sage)">in</span><span style="--c:#c07070">out</span></div>
        <div class="month-list" style="margin-top:12px">${months.slice().reverse().map(k=>`<div class="month-row"><span class="mono">${fmtMonthName(k)}</span><span class="m-in">${money(monthIncome(k))}</span><span class="m-out">${money(monthSpend(k))}</span><span class="m-net ${monthIncome(k)-monthSpend(k)>=0?'pos':'neg'}">${money(monthIncome(k)-monthSpend(k))}</span><span></span><span></span></div>`).join('')}</div></div></section>` : ''}

    <section class="section rv"><span class="sc">Notes on money</span><div class="card">${ed('finance.note',{multi:true,mdr:true,cls:'prose',ph:'What you are working out about money: fears, plans, the thing you have never said out loud about it.'})}</div></section>`;
  $('#finPrin').onclick = () => { S.finance.principles.push(''); saveNow(); rerender(); setTimeout(()=>{ const n = document.querySelectorAll('.principles .ed'); n.length && beginEdit(n[n.length-1]); }, 60); };
  $$('[data-fpdel]',box).forEach(b => b.onclick = () => { const i = +b.dataset.fpdel; requestDelete({label:S.finance.principles[i]||'this principle', node:b.closest('li'), remove:()=>{ const g = S.finance.principles.splice(i,1)[0]; return () => S.finance.principles.splice(i,0,g); }}); });
}
