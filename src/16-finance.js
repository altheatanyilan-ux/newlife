/* ============================================================
   FINANCE — enough, and how far away it is.
   Not an accounting app. Four questions: what comes in, how
   fragile it is, how long you could last without it, and what
   number means you can stop doing work you have outgrown.
   ============================================================ */
const STREAM_KINDS = {
  salary:    ['💼','Salary',        'one employer, low variance, high dependence', '#8a8d8f'],
  freelance: ['✍','Freelance',     'you trade hours; it stops when you do',        '#c47832'],
  product:   ['▣','Product',       'made once, sold many times',                   '#7f916a'],
  audience:  ['◎','Audience',      'subscriptions, patronage, a list that trusts you', '#a0727e'],
  service:   ['☕','Service',       'a place or a practice with customers',         '#b08968'],
  yield:     ['↗','Yield',         'interest, dividends, rent — money that works',  '#6b7f8e'],
  other:     ['·','Other',         '',                                             '#a89f94'],
};
const FIN_DEFAULT = {currency:'¥', essentials:0, savings:0, target:0, targetBy:'', principles:[], milestones:[], months:[], note:''};
function migrateFinance(){
  S.streams = Array.isArray(S.streams) ? S.streams : [];
  S.streams.forEach(s => { s.monthly = +s.monthly || 0; s.kind = STREAM_KINDS[s.kind] ? s.kind : 'other'; s.status = s.status || 'active'; s.reliability = s.reliability || 'steady'; s.note = s.note || ''; s.projectId = s.projectId || ''; });
  S.finance = Object.assign({}, FIN_DEFAULT, S.finance || {});
  S.finance.principles = Array.isArray(S.finance.principles) ? S.finance.principles : [];
  S.finance.milestones = Array.isArray(S.finance.milestones) ? S.finance.milestones : [];
  S.finance.months = Array.isArray(S.finance.months) ? S.finance.months : [];
}
const money = n => `${S.finance?.currency || '¥'}${Math.round(+n || 0).toLocaleString()}`;
const activeStreams = () => S.streams.filter(s => s.status === 'active');
const monthlyIn = () => sum(activeStreams().map(s => +s.monthly || 0));
/* concentration: 0 is perfectly spread, 100 is one stream carrying everything */
function concentration(){
  const tot = monthlyIn(); if(!tot) return null;
  return Math.round(sum(activeStreams().map(s => Math.pow((s.monthly||0)/tot, 2))) * 100);
}
function runwayMonths(){ const e = +S.finance.essentials || 0; return e ? (+S.finance.savings || 0) / e : null; }
function freedomProgress(){ const t = +S.finance.target || 0; return t ? clamp(monthlyIn() / t * 100, 0, 100) : null; }
function monthKey(d = today()){ return d.slice(0,7); }
function financeReading(){
  const out = []; const tot = monthlyIn(); const f = S.finance;
  if(!S.streams.length) return ['Nothing here yet. List what comes in each month — even the salary you want to leave — and this page starts telling you how far away the door is.'];
  out.push(`**${money(tot)}** a month across ${activeStreams().length} active stream${activeStreams().length===1?'':'s'}.`);
  const c = concentration();
  if(c !== null){
    const top = [...activeStreams()].sort((a,b)=>b.monthly-a.monthly)[0];
    const share = tot ? Math.round(top.monthly/tot*100) : 0;
    out.push(share >= 70
      ? `**${esc(top.name)}** carries ${share}% of it. That is not income, it is one relationship. The work is not earning more — it is earning it from somewhere else too.`
      : share >= 45 ? `**${esc(top.name)}** is ${share}% of the total. Comfortable, not yet independent.`
      : `No single stream is more than ${share}% of the total. That is what resilience actually looks like.`);
  }
  const r = runwayMonths();
  if(r !== null) out.push(r >= 12 ? `Your savings cover **${r.toFixed(1)} months** of essentials. That is a year of saying no.`
    : r >= 6 ? `Your savings cover **${r.toFixed(1)} months** of essentials — the usual advice is six, so you are at it.`
    : r >= 3 ? `Your savings cover **${r.toFixed(1)} months**. Enough to absorb a bad quarter, not enough to make a leap.`
    : `Your savings cover **${r.toFixed(1)} months** of essentials. Before anything ambitious, this is the number to move.`);
  const p = freedomProgress();
  if(p !== null){
    const gap = Math.max(0, (+f.target||0) - tot);
    out.push(p >= 100 ? `You are **at** the number you called enough. The question is no longer financial.`
      : `You are **${Math.round(p)}%** of the way to ${money(f.target)} a month${f.targetBy ? ` by ${fmtDate(f.targetBy,'med')}` : ''} — ${money(gap)} short${f.targetBy && daysBetween(today(), f.targetBy) > 0 ? `, with ${Math.round(daysBetween(today(), f.targetBy)/30)} months to find it` : ''}.`);
  } else out.push('You have not named the number that would mean enough. Until you do, "building income" stays a feeling rather than a distance.');
  const dormant = S.streams.filter(s => s.status === 'building');
  if(dormant.length) out.push(`${dormant.length} stream${dormant.length===1?' is':'s are'} still being built: ${dormant.map(s=>esc(s.name)).join(', ')}. These are the ones that decide what next year looks like.`);
  return out;
}
routes.finance = function(root){
  migrateFinance();
  registerPageEntry({pageName:'Finance', addLabel:'Add an income stream', defaultEntryType:'stream', prefilledFields:{}, options:[
    {icon:'▤', label:'Income stream', desc:'Anything that puts money in each month.', run:()=>openStreamModal()},
    {icon:'◷', label:'Log this month', desc:'What actually came in and went out.', run:()=>openMonthModal()},
    {icon:'◆', label:'Financial milestone', desc:'A number, and the date you want it by.', run:()=>addFinMilestone()}]});
  const f = S.finance; const tot = monthlyIn(); const c = concentration(); const r = runwayMonths(); const prog = freedomProgress();
  const months = [...f.months].sort((a,b)=>a.month.localeCompare(b.month));
  const rd = financeReading();
  const surplus = tot - (+f.essentials || 0);
  root.innerHTML = `<div class="page">
    <div class="page-head"><h1>Finance</h1><div class="sub">Enough is a number, not a feeling. This page holds what comes in, how fragile it is, how long you could last without it, and how far away the door is.</div></div>

    <section class="reading-card rv"><div class="sc">Where you actually stand</div>
      <div class="reading-body">${rd.map(l=>`<p>${mdInline(l)}</p>`).join('')}</div></section>

    <div class="card rv" style="margin:22px 0"><div class="income-strip">
      <div><div class="k">monthly, in</div><div class="num">${money(tot)}</div><div class="mono">${activeStreams().length} active stream${activeStreams().length===1?'':'s'}</div></div>
      <div><div class="k">monthly essentials</div><div class="num">${money(f.essentials)}</div><div class="mono" style="color:${surplus>=0?'var(--sage)':'#c25b5b'}">${surplus>=0?'+':''}${money(surplus)} surplus</div></div>
      <div><div class="k">runway</div><div class="num">${r===null?'—':r.toFixed(1)}</div><div class="mono">${r===null?'set essentials & savings':'months of essentials saved'}</div></div>
      <div><div class="k">concentration</div><div class="num" style="color:${c===null?'var(--muted)':c>50?'#c25b5b':c>30?'var(--gold)':'var(--sage)'}">${c===null?'—':c}</div><div class="mono">${c===null?'':c>50?'one stream carries it':c>30?'somewhat concentrated':'well spread'}</div></div>
    </div></div>

    ${prog !== null ? `<section class="section rv"><div class="row between"><span class="sc" style="margin:0">The number that means enough</span><span class="mono">${money(tot)} of ${money(f.target)}${f.targetBy?` · by ${fmtDate(f.targetBy,'med')}`:''}</span></div>
      <div class="freedom-bar"><i style="width:${prog}%"></i><span class="fb-label">${Math.round(prog)}%</span></div>
      ${f.milestones.length ? `<div class="fin-milestones">${[...f.milestones].sort((a,b)=>(a.by||'').localeCompare(b.by||'')).map(m => { const hit = tot >= (+m.amount||0); const days = m.by ? daysBetween(today(), m.by) : null;
        return `<div class="fin-ms ${hit?'hit':''}"><span class="fm-dot"></span><span class="fm-amt">${money(m.amount)}</span><span class="fm-label">${ed(`finance.milestones.${f.milestones.indexOf(m)}.label`,{ph:'what this unlocks'})}</span><span class="mono">${m.by?`${fmtDate(m.by,'med')}${days!==null?` · ${days<0?`${-days}d past`:`${Math.round(days/30)}mo`}`:''}`:'no date'}</span><button class="del-x inline" data-fmdel="${m.id}">×</button></div>`; }).join('')}</div>` : ''}
      <div class="row" style="margin-top:10px"><button class="btn sm ghost" id="finMs">＋ milestone</button></div></section>` : ''}

    <section class="section rv"><div class="row between"><span class="sc" style="margin:0">Income streams</span><button class="btn sm primary" id="finNew">＋ Add a stream</button></div>
      ${S.streams.length ? `<div class="stream-list">${S.streams.map(s => { const k = STREAM_KINDS[s.kind]; const share = tot ? Math.round((s.monthly||0)/tot*100) : 0; const pr = s.projectId ? byId(S.projects, s.projectId) : null;
        return `<div class="stream" data-sopen2="${s.id}" style="--c:${k[3]}">
          <span class="st-ico" title="${esc(k[2])}">${k[0]}</span>
          <span class="st-name"><b>${esc(s.name)}</b><span class="mono">${esc(k[1])}${pr?` · ${esc(pr.name)}`:''}${s.note?` · ${esc(s.note)}`:''}</span></span>
          <span class="st-amt">${money(s.monthly)}<span class="mono">/mo</span></span>
          <span class="st-share"><span class="bar" style="--c:${k[3]}"><i style="width:${share}%"></i></span><span class="mono">${s.status==='active'?`${share}%`:esc(s.status)}</span></span>
          <span class="status-pill ${s.reliability}">${esc(s.reliability)}</span>
          <button class="del-x inline" data-stdel="${s.id}" title="remove stream">×</button>
        </div>`; }).join('')}</div>`
        : `<div class="empty">No streams listed. Start with the one you have — the salary counts, and seeing it beside the small new ones is the whole point.</div>`}
      ${S.projects.some(p => p.income?.current > 0 && !S.streams.some(s => s.projectId === p.id)) ? `<div class="row" style="margin-top:10px"><button class="btn sm ghost" id="finImport">import ${S.projects.filter(p=>p.income?.current>0 && !S.streams.some(s=>s.projectId===p.id)).length} from projects</button></div>` : ''}
    </section>

    <div class="grid c2 section rv" style="align-items:start">
      <div class="card"><span class="sc">The shape of it</span>
        <div class="spec-grid" style="margin-top:12px">
          <div><div class="k">currency</div>${ed('finance.currency',{ph:'¥',cls:'mono'})}</div>
          <div><div class="k">monthly essentials</div>${ed('finance.essentials',{ph:'0',cls:'mono',hook:'finnum:essentials'})}</div>
          <div><div class="k">savings</div>${ed('finance.savings',{ph:'0',cls:'mono',hook:'finnum:savings'})}</div>
          <div><div class="k">enough, per month</div>${ed('finance.target',{ph:'0',cls:'mono',hook:'finnum:target'})}</div>
          <div><div class="k">by when</div>${ed('finance.targetBy',{ph:'YYYY-MM-DD',cls:'mono'})}</div>
        </div>
        <div class="faint" style="font-size:.76rem;margin-top:10px">Essentials means the number you could actually live on for a while — rent, food, transport, insurance — not your current spending.</div>
      </div>
      <div class="card"><div class="row between"><span class="sc">Principles</span><button class="btn sm ghost" id="finPrin">＋ principle</button></div>
        <p class="muted" style="font-size:.84rem">Your own rules, written once, so a decision at eleven at night is not a fresh argument.</p>
        ${f.principles.length ? `<ul class="principles">${f.principles.map((p,i)=>`<li><span>${ed(`finance.principles.${i}`,{ph:'a rule you want to keep'})}</span><button class="del-x inline" data-fpdel="${i}">×</button></li>`).join('')}</ul>`
          : `<div class="empty">None yet. Common ones worth stealing: keep six months of essentials before any leap; raise your rate every year without asking permission; every new stream must survive one client leaving; pay the future first, on the day you are paid.</div>`}
      </div>
    </div>

    <section class="section rv"><div class="row between"><span class="sc" style="margin:0">Month by month</span><button class="btn sm ghost" id="finMonth">log ${fmtMonthName(monthKey())}</button></div>
      <p class="muted" style="font-size:.85rem">One row a month is enough to make the line real. Projections lie; this does not.</p>
      ${months.length ? `<div class="card">${sparkline(months.map(m=>+m.income||0),{h:70,color:'var(--page-accent)',dots:true,labels:months.map(m=>`${fmtMonthName(m.month)}: in ${money(m.income)}${m.expenses?` · out ${money(m.expenses)}`:''}${m.note?' · '+m.note:''}`)})}
        <div class="month-list">${[...months].reverse().slice(0,14).map((m,i)=>`<div class="month-row"><span class="mono">${fmtMonthName(m.month)}</span><span class="m-in">${money(m.income)}</span><span class="m-out">${m.expenses?money(m.expenses):'—'}</span><span class="m-net ${(+m.income||0)-(+m.expenses||0)>=0?'pos':'neg'}">${money((+m.income||0)-(+m.expenses||0))}</span><span class="mono m-note">${esc(m.note||'')}</span><button class="del-x inline" data-fmodel="${esc(m.month)}">×</button></div>`).join('')}</div></div>`
        : `<div class="empty">Nothing logged. At the end of this month, put in two numbers.</div>`}
    </section>

    <section class="section rv"><span class="sc">Notes on money</span><div class="card">${ed('finance.note',{multi:true,mdr:true,cls:'prose',ph:'What you are working out about money: fears, plans, the thing you have never said out loud about it.'})}</div></section>
  </div>`;
  $('#finNew').onclick = () => openStreamModal();
  if($('#finImport')) $('#finImport').onclick = () => {
    S.projects.filter(p => p.income?.current > 0 && !S.streams.some(s => s.projectId === p.id))
      .forEach(p => S.streams.push({id:uid(), name:p.name, kind:'product', monthly:p.income.current, status:'active', reliability:'variable', note:'', projectId:p.id, startedAt:today()}));
    saveNow(); sound('success'); rerender();
  };
  if($('#finMs')) $('#finMs').onclick = () => addFinMilestone();
  $('#finPrin').onclick = () => { S.finance.principles.push(''); saveNow(); rerender(); setTimeout(()=>{ const n = document.querySelectorAll('.principles .ed'); n.length && beginEdit(n[n.length-1]); },60); };
  $('#finMonth').onclick = () => openMonthModal();
  $$('[data-sopen2]',root).forEach(x => x.addEventListener('click', e => { if(e.target.closest('.del-x,.ed')) return; openStreamModal(byId(S.streams, x.dataset.sopen2)); }));
  $$('[data-stdel]',root).forEach(b => b.onclick = e => { e.stopPropagation(); const s = byId(S.streams, b.dataset.stdel); requestDelete({label:s.name, node:b.closest('.stream'), remove:()=>spliceOut(S.streams, x=>x.id===s.id)}); });
  $$('[data-fpdel]',root).forEach(b => b.onclick = () => { const i = +b.dataset.fpdel; requestDelete({label:S.finance.principles[i]||'this principle', node:b.closest('li'), remove:()=>{ const g = S.finance.principles.splice(i,1)[0]; return () => S.finance.principles.splice(i,0,g); }}); });
  $$('[data-fmdel]',root).forEach(b => b.onclick = () => { const m = byId(S.finance.milestones, b.dataset.fmdel); requestDelete({label:money(m.amount), node:b.closest('.fin-ms'), remove:()=>spliceOut(S.finance.milestones, x=>x.id===m.id)}); });
  $$('[data-fmodel]',root).forEach(b => b.onclick = () => { const k = b.dataset.fmodel; requestDelete({label:fmtMonthName(k), node:b.closest('.month-row'), remove:()=>spliceOut(S.finance.months, x=>x.month===k)}); });
};
function fmtMonthName(k){ const [y,m] = String(k||'').split('-'); return m ? `${MONTHS[+m-1].slice(0,3)} ${y}` : k; }
hooks.finnum = (key, oldV, v) => { S.finance[key] = +String(v).replace(/[^\d.-]/g,'') || 0; saveNow(); rerender(); };
function addFinMilestone(){
  migrateFinance();
  S.finance.milestones.push({id:uid(), amount: Math.round((monthlyIn() || 100000) * 1.5), label:'', by: addDays(today(), 365)});
  saveNow(); if(currentRoute !== 'finance') navigate('#/finance'); else rerender();
}
function openStreamModal(existing){
  const s = existing || {id:uid(), name:'', kind:'freelance', monthly:0, status:'active', reliability:'variable', note:'', projectId:'', startedAt:today()};
  const m = openModal(`<h2>${existing ? 'Income stream' : 'A stream of income'}</h2><div class="stack">
    <div class="field"><label>Name</label><input class="inp serif-lg" id="stName" value="${esc(s.name)}" placeholder="Freelance writing · the bar · the day job" autofocus></div>
    <div class="grid c2" style="gap:10px">
      <div class="field"><label>Kind</label><select class="sel" id="stKind">${Object.entries(STREAM_KINDS).map(([k,v])=>`<option value="${k}" ${s.kind===k?'selected':''}>${v[0]} ${v[1]}</option>`).join('')}</select></div>
      <div class="field"><label>Roughly, per month</label><input class="inp mono" id="stAmt" value="${s.monthly||''}" placeholder="0" inputmode="numeric"></div>
    </div>
    <div class="grid c2" style="gap:10px">
      <div class="field"><label>Status</label><select class="sel" id="stStatus">${['active','building','paused','ended'].map(x=>`<option ${s.status===x?'selected':''}>${x}</option>`).join('')}</select></div>
      <div class="field"><label>How reliable</label><select class="sel" id="stRel">${['steady','variable','fragile'].map(x=>`<option ${s.reliability===x?'selected':''}>${x}</option>`).join('')}</select></div>
    </div>
    <div class="field"><label>From a project?</label><select class="sel" id="stProj"><option value="">—</option>${S.projects.map(p=>`<option value="${p.id}" ${s.projectId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div>
    <div class="field"><label>Note</label><input class="inp" id="stNote" value="${esc(s.note)}" placeholder="three clients, one of them most of it"></div>
  </div><div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn primary" id="stSave">${existing?'Save':'Add'}</button></div>`, 'narrow');
  m.querySelector('#stSave').onclick = () => {
    const name = m.querySelector('#stName').value.trim(); if(!name){ toast('Give it a name.'); return; }
    Object.assign(s, {name, kind:m.querySelector('#stKind').value, monthly:+String(m.querySelector('#stAmt').value).replace(/[^\d.-]/g,'')||0,
      status:m.querySelector('#stStatus').value, reliability:m.querySelector('#stRel').value, projectId:m.querySelector('#stProj').value, note:m.querySelector('#stNote').value.trim()});
    if(!existing) S.streams.push(s);
    saveNow(); m.remove(); sound('success'); if(currentRoute !== 'finance') navigate('#/finance'); else rerender();
  };
}
function openMonthModal(){
  migrateFinance();
  const k = monthKey(); const ex = S.finance.months.find(x => x.month === k) || {month:k, income:monthlyIn(), expenses:S.finance.essentials, saved:0, note:''};
  const m = openModal(`<h2>${fmtMonthName(k)}</h2><p class="muted" style="font-size:.86rem">Round numbers are fine. The point is the line, not the ledger.</p><div class="stack">
    <div class="grid c2" style="gap:10px">
      <div class="field"><label>Came in</label><input class="inp mono" id="moIn" value="${ex.income||''}" inputmode="numeric"></div>
      <div class="field"><label>Went out</label><input class="inp mono" id="moOut" value="${ex.expenses||''}" inputmode="numeric"></div>
    </div>
    <div class="field"><label>A note about the month</label><input class="inp" id="moNote" value="${esc(ex.note||'')}" placeholder="a slow month; one client paid late"></div>
  </div><div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn primary" id="moSave">Save the month</button></div>`, 'narrow');
  m.querySelector('#moSave').onclick = () => {
    const num = id => +String(m.querySelector(id).value).replace(/[^\d.-]/g,'') || 0;
    const row = {month:k, income:num('#moIn'), expenses:num('#moOut'), saved:0, note:m.querySelector('#moNote').value.trim()};
    const i = S.finance.months.findIndex(x => x.month === k);
    if(i >= 0) S.finance.months[i] = row; else S.finance.months.push(row);
    saveNow(); m.remove(); sound('success'); if(currentRoute !== 'finance') navigate('#/finance'); else rerender();
  };
}
