/* ============================================================
   BRAND STRATEGY — the views.

   #/content/brand                   the dashboard for the account in hand
   #/content/brand/notebook          every note, filtered and searched
   #/content/brand/inbox             the unfiled, and a fast way to file them
   #/content/brand/plans             the horizons
   #/content/brand/plan/<id>         one plan
   #/content/brand/calendar          the slots by month
   #/content/brand/decisions         decisions, hypotheses, reviews
   #/content/brand/account/<id>      the account's profile
   #/content/brand/matrix            every active account side by side
   #/content/brand/studio            across all accounts
   ============================================================ */

function brandRoute(root, params){
  migrateBrand();
  const st = brandState(), [v, id] = params || [];
  if(v === 'account' && id && brandAccount(id)) st.prefs.account = id;
  if(st.prefs.account && !brandAccount(st.prefs.account)) st.prefs.account = null;
  if(!st.prefs.account && st.accounts.length && v !== 'studio') st.prefs.account = brandActiveAccounts()[0] ? brandActiveAccounts()[0].id : st.accounts[0].id;
  const acc = brandAccount(st.prefs.account);
  registerPageEntry && registerPageEntry({pageName: 'Brand Strategy', addLabel: 'Capture', defaultEntryType: 'brand', prefilledFields: {},
    options: [{label: 'Capture a note', run: () => brandCaptureDialog()}, {label: 'A slot', run: () => brandSlotDialog(null, null, rerender)}, {label: 'A decision', run: () => brandDecisionDialog(null, null, rerender)}]});
  const again = () => brandRoute(root, params);
  const view = v || 'dash';
  let body = '';
  if(!st.accounts.length && !['studio', 'notebook', 'inbox'].includes(view)) body = brandEmptyHTML();
  else if(view === 'notebook') body = brandNotebookHTML(acc);
  else if(view === 'inbox') body = brandTriageHTML();
  else if(view === 'plans') body = brandPlansHTML(acc && acc.id);
  else if(view === 'plan'){ const p = byId(S.entries, id); body = p && brandOf(p) ? brandPlanPageHTML(p) : '<p class="faint">That plan is not here.</p>'; }
  else if(view === 'calendar') body = brandCalendarHTML(acc && acc.id);
  else if(view === 'decisions') body = brandJudgmentHTML(acc && acc.id);
  else if(view === 'account') body = acc ? brandProfileHTML(acc) : brandEmptyHTML();
  else if(view === 'matrix') body = brandMatrixHTML();
  else if(view === 'studio') body = brandStudioHTML();
  else body = acc ? brandDashboardHTML(acc) : brandEmptyHTML();
  const inbox = brandInbox().length;
  const tabs = [['', 'Dashboard'], ['notebook', 'Notebook'], ['inbox', `Inbox${inbox ? ` <i>${inbox}</i>` : ''}`], ['plans', 'Plans'], ['calendar', 'Calendar'], ['decisions', 'Judgment'], [acc ? 'account/' + acc.id : 'account', 'Profile'], ['matrix', 'Side by side'], ['studio', 'Studio-wide']];
  const on = view === 'dash' ? '' : view === 'account' ? (acc ? 'account/' + acc.id : 'account') : view === 'plan' ? 'plans' : view;
  root.innerHTML = `<div class="page ct-page brand-page">
    <div class="ct-head"><div class="ct-views"><a class="ct-brandback" href="#/content">‹ Content</a></div>
      <h1 class="serif brand-h1">Brand Strategy</h1>
      <div class="row brand-switch" style="gap:8px;margin-left:auto">
        <select class="sel" id="bAcc" aria-label="Account">${st.accounts.map(a => `<option value="${a.id}"${acc && a.id === acc.id ? ' selected' : ''}>${esc(a.name)}${a.status !== 'active' ? ` (${a.status})` : ''}</option>`).join('')}${st.accounts.length ? '' : '<option value="">no accounts yet</option>'}</select>
        <button class="btn sm ghost" id="bNewAcc">＋ Account</button><button class="btn sm" id="bCap">＋ Capture</button></div></div>
    ${inbox ? `<a class="brand-unfiled" href="#/content/brand/inbox">${inbox} unfiled — every note needs a scope, a kind and an anchor</a>` : ''}
    <nav class="brand-tabs" aria-label="Brand Strategy">${tabs.map(([k, n]) => `<a href="#/content/brand${k ? '/' + k : ''}" class="${on === k ? 'on' : ''}">${n}</a>`).join('')}</nav>
    <div class="brand-body" id="bBody">${body}</div>
    <div class="brand-foot"><button class="tbtn" id="bExport">Export Brand Strategy</button><label class="tbtn" style="cursor:pointer">Import<input type="file" accept=".json,application/json" id="bImport" hidden></label>
      <span class="faint">Piece links travel as ids; no Writing Studio text is ever exported from here.</span></div>
  </div>`;
  root.querySelector('#bAcc').onchange = e => { st.prefs.account = e.target.value || null; save(); navigate('#/content/brand' + (v && v !== 'account' && v !== 'plan' ? '/' + v : v === 'account' ? '/account/' + e.target.value : '')); again(); };
  root.querySelector('#bNewAcc').onclick = async () => { const n = await brandAsk('The account’s name', ''); if(!n) return; const a = brandNewAccount(n); navigate('#/content/brand/account/' + a.id); };
  root.querySelector('#bCap').onclick = () => brandCaptureDialog(again);
  root.querySelector('#bExport').onclick = () => { brandExport(); toast('Brand Strategy exported.'); };
  root.querySelector('#bImport').onchange = async e => { const f = e.target.files[0]; if(!f) return;
    try { const r = brandImport(JSON.parse(await f.text())); toast(r.error || `Imported ${r.accounts} accounts and ${r.entries} notes; ${r.kept} already here were left as they are.`, 6000); } catch(err){ toast('That file could not be read.'); } again(); };
  const first = root.querySelector('#bFirst'); if(first) first.onclick = async () => { const n = await brandAsk('The account’s name', ''); if(n){ const a = brandNewAccount(n); navigate('#/content/brand/account/' + a.id); } };
  if(view === 'account' && acc) brandBindProfile(root, acc, again);
  if(view === 'plans' || view === 'dash') brandBindPlans(root, acc && acc.id);
  if(view === 'plan'){ const p = byId(S.entries, id); if(p && brandOf(p)) brandBindPlanPage(root, p, again); }
  if(view === 'calendar'){ root.querySelectorAll('[data-bcal]').forEach(b => b.onclick = () => { st.prefs.calMonth = b.dataset.bcal; save(); again(); });
    root.querySelector('#bCalSlot').onclick = () => brandSlotDialog(null, {accountId: acc && acc.id}, again); }
  if(view === 'notebook') brandBindNotebook(root, acc, again);
  if(view === 'inbox') brandBindTriage(root, again);
  if(view === 'decisions') brandBindJudgment(root, acc, again);
  brandBindSlotRows(root, again);
  root.querySelectorAll('[data-bnote]').forEach(el => el.onclick = () => brandEditDialog(byId(S.entries, el.dataset.bnote), again));
  root.querySelectorAll('[data-bnewdec]').forEach(el => el.onclick = () => brandDecisionDialog(null, null, again));
}
function brandEmptyHTML(){ return `<div class="brand-empty"><p>No accounts yet.</p><p class="faint">An account is one presence you run — a handle on one or more platforms — with its own charter, voice and pillars.</p><button class="btn primary" id="bFirst">Add the first account</button></div>`; }
function brandAsk(title, value){
  return new Promise(res => { const m = openModal(`<h2 class="serif">${esc(title)}</h2><input class="inp" id="baQ" value="${esc(value || '')}"><div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn ghost" id="baNo">Cancel</button><button class="btn primary" id="baOk">OK</button></div>`, 'narrow');
    const i = m.querySelector('#baQ'); setTimeout(() => i.focus(), 30); const done = v => { m.remove(); res(v); };
    m.querySelector('#baOk').onclick = () => done(i.value.trim()); m.querySelector('#baNo').onclick = () => done(null); i.onkeydown = e => { if(e.key === 'Enter') done(i.value.trim()); }; });
}

/* ---------- the three filing fields, shared by every form ---------- */
function brandFilingFieldsHTML(kind, b){
  const st = brandState(), scope = b.scope || [];
  return `<div class="brand-filing">
    <div class="brand-f"><span>Scope</span><div class="brand-chips" data-bscope>${[['studio', 'Studio-wide'], ...st.accounts.map(a => [a.id, a.name])].map(([id, n]) => `<label class="brand-chip${scope.includes(id) ? ' on' : ''}"><input type="checkbox" value="${id}"${scope.includes(id) ? ' checked' : ''}>${esc(n)}</label>`).join('')}</div></div>
    <label class="brand-f"><span>Anchor <small>what it serves</small></span><select class="sel" data-banchor></select></label></div>`;
}
function brandBindFilingFields(box, kind, b){
  const sel = box.querySelector('[data-banchor]'), chips = box.querySelector('[data-bscope]');
  const fill = () => { const scope = [...chips.querySelectorAll('input:checked')].map(i => i.value), cur = sel.value || brandAnchorKey(b.anchor);
    const k = typeof kind === 'function' ? kind() : kind;
    sel.innerHTML = '<option value="">(none yet — it will wait in the inbox)</option>' + brandAnchorOptions(k, scope).map(([v, n]) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(n)}</option>`).join(''); };
  chips.querySelectorAll('input').forEach(i => i.onchange = () => { i.closest('.brand-chip').classList.toggle('on', i.checked); fill(); });
  fill(); return fill;
}
function brandReadFilingFields(box){ return {scope: [...box.querySelectorAll('[data-bscope] input:checked')].map(i => i.value), anchor: brandParseAnchor(box.querySelector('[data-banchor]').value)}; }

/* ---------- capture, and the generic note form ---------- */
function brandCaptureDialog(again){ const st = brandState(); brandNoteDialog({kind: 'observation', scope: st.prefs.account ? [st.prefs.account] : [], anchor: st.prefs.account ? {kind: 'account', id: st.prefs.account} : null}, () => again && again()); }
function brandNoteDialog(pre, done, entry){
  const b = entry ? brandOf(entry) : Object.assign({kind: 'observation', scope: [], anchor: null}, pre || {});
  let kind = b.kind || 'observation';
  const m = openModal(`<h2 class="serif">${entry ? esc(BRAND_KINDS[kind] ? BRAND_KINDS[kind].n : 'Note') : 'Capture'}</h2>
    <label class="brand-f"><span>Kind</span><select class="sel" id="bnKind">${BRAND_GROUPS.map(g => `<optgroup label="${g}">${Object.entries(BRAND_KINDS).filter(([, v]) => v.g === g).filter(([k]) => !['slot', 'decision', 'review', 'metric', 'horizon', 'brief'].includes(k)).map(([k, v]) => `<option value="${k}"${k === kind ? ' selected' : ''}>${v.n}</option>`).join('')}</optgroup>`).join('')}</select></label>
    <div id="bnFields"></div>
    <label class="brand-f"><span>Tags</span><input class="inp" id="bnTags" value="${esc(entry ? (entry.tags || []).join(' ') : '')}" placeholder="space separated"></label>
    ${brandFilingFieldsHTML(kind, b)}
    <div id="bnExtra"></div>
    <div class="row" style="justify-content:space-between;gap:8px"><span>${entry ? `<button class="tbtn" id="bnRetire">${b.retired ? 'Bring back' : 'Retire'}</button>` : ''}</span><span class="row" style="gap:8px"><button class="btn ghost" id="bnNo">Cancel</button><button class="btn primary" id="bnOk">Keep it</button></span></div>`);
  const $m = id => m.querySelector(id);
  if(entry && entry.type === 'quote') $m('#bnKind').disabled = true;
  const fieldsFor = k => (BRAND_KINDS[k] || {f: []}).f;
  const paint = () => {
    $m('#bnFields').innerHTML = fieldsFor(kind).map(([k, label, t]) => `<label class="brand-f"><span>${label}</span>${t === 'area' ? `<textarea class="inp" rows="3" data-bnf="${k}">${esc(entry ? brandGet(entry, k) || '' : (pre && pre[k]) || '')}</textarea>` : `<input class="inp" data-bnf="${k}" value="${esc(entry ? brandGet(entry, k) || '' : (pre && pre[k]) || '')}">`}</label>`).join('');
    $m('#bnExtra').innerHTML = kind === 'hypothesis' ? `<label class="brand-f"><span>Status</span><select class="sel" id="bnHyp">${Object.entries(BRAND_HYP_STATUS).map(([k2, v]) => `<option value="${k2}"${(b.status || 'open') === k2 ? ' selected' : ''}>${v}</option>`).join('')}</select></label>${entry ? brandHypothesisHTML(entry) : ''}`
      : kind === 'pillarNote' ? '' : '';
  };
  paint();
  const refill = brandBindFilingFields(m, () => kind, b);
  $m('#bnKind').onchange = () => { kind = $m('#bnKind').value; paint(); refill(); };
  $m('#bnNo').onclick = () => m.remove();
  if($m('#bnRetire')) $m('#bnRetire').onclick = () => { brandRetire(entry, !b.retired); m.remove(); done && done(entry); };
  $m('#bnOk').onclick = () => {
    const f = {}; m.querySelectorAll('[data-bnf]').forEach(i => f[i.dataset.bnf] = i.value.trim());
    f.tags = $m('#bnTags').value.split(/[\s,]+/).filter(Boolean);
    const filing = brandReadFilingFields(m);
    let e = entry;
    if(!e){
      if(kind === 'quote' || !Object.values(f).some(v => Array.isArray(v) ? v.length : v)){ if(!f.text && kind !== 'quote'){ toast('Write something first.'); return; } }
      e = brandNew(kind, f, Object.assign(filing, kind === 'hypothesis' ? {status: $m('#bnHyp').value} : {}));
    } else {
      f.title = ''; brandSetFields(e, f);
      if(e.type !== 'quote') brandOf(e).kind = kind;
      Object.assign(brandOf(e), filing); if(kind === 'hypothesis') brandOf(e).status = $m('#bnHyp').value; save();
    }
    m.remove();
    if(!brandFiled(e)) toast(`Kept — it waits in the inbox until it has ${brandMissing(e).join(', ')}.`, 4500);
    done && done(e);
  };
}
/* every note opens in the form that fits its kind */
function brandEditDialog(e, again){
  if(!e) return; const k = brandOf(e).kind;
  if(k === 'slot') return brandSlotDialog(e, null, again);
  if(k === 'decision') return brandDecisionDialog(e, null, again);
  if(k === 'review'){ const p = brandOf(e).planId ? byId(S.entries, brandOf(e).planId) : null; return brandReviewDialog(e, p, again); }
  if(k === 'metric') return brandMetricDialog(e, null, again);
  if(k === 'horizon') return navigate('#/content/brand/plan/' + e.id);
  if(k === 'brief'){ const s = byId(S.entries, brandOf(e).forId); if(s) return brandBriefDialog(e, s, again); }
  return brandNoteDialog(null, () => again && again(), e);
}

/* ---------- the dashboard ---------- */
function brandDashboardHTML(a){
  const plan = brandCurrentPlan(a.id, '30');
  const slots = brandEntries().filter(e => brandOf(e).kind === 'slot' && !brandOf(e).retired && brandOf(e).accountId === a.id);
  const by = {}; Object.keys(BRAND_SLOT_STATUS).forEach(k => by[k] = slots.filter(s => brandOf(s).status === k).length);
  const due = brandDecisionsDue(a.id), unfiled = brandInbox().filter(e => brandOf(e).scope.includes(a.id) || !brandOf(e).scope.length).length;
  const soon = slots.filter(s => brandOf(s).date >= today() && ['planned', 'linked'].includes(brandOf(s).status)).sort((x, y) => brandOf(x).date.localeCompare(brandOf(y).date)).slice(0, 6);
  const t = brandPillarTotal(a);
  return `<div class="brand-dash">
    <header class="brand-acchead"><div><h2 class="serif">${esc(a.name)}</h2><span class="faint">${esc(a.handle || '')}${a.platforms.length ? ' · ' + esc(a.platforms.join(', ')) : ''} · ${a.status}</span></div>
      ${a.charter.promise ? `<p class="brand-promise">“${esc(a.charter.promise)}”</p>` : `<a class="tbtn" href="#/content/brand/account/${a.id}">Write the charter</a>`}</header>
    <div class="brand-tiles">
      <a class="brand-tile${unfiled ? ' warn' : ''}" href="#/content/brand/inbox"><b>${unfiled}</b><span>unfiled</span></a>
      ${Object.entries(BRAND_SLOT_STATUS).map(([k, v]) => `<div class="brand-tile"><b>${by[k]}</b><span>${v.toLowerCase()}</span></div>`).join('')}
      <a class="brand-tile${due.length ? ' warn' : ''}" href="#/content/brand/decisions"><b>${due.length}</b><span>decisions due</span></a>
    </div>
    ${a.pillars.length < 3 || Math.round(t) !== 100 ? `<p class="brand-warnline">The pillars are not set yet (${a.pillars.length} pillar${a.pillars.length === 1 ? '' : 's'}, ${t}%). <a href="#/content/brand/account/${a.id}">Set them</a>.</p>` : ''}
    <div class="brand-dashgrid">
      <section class="brand-card"><div class="brand-sechead"><h3>This 30 days</h3><span class="brand-grow"></span>${plan ? `<a class="tbtn" href="#/content/brand/plan/${plan.id}">Open</a>` : `<button class="tbtn" data-bnewplan="30">＋ 30-day plan</button>`}</div>
        ${plan ? `<p><b>${esc(brandOf(plan).theme || 'Untitled')}</b> <span class="faint">${esc(brandOf(plan).start)} – ${esc(brandOf(plan).end)}</span></p><p class="faint">${esc(brandOf(plan).objective || '')}</p>${brandMixHTML(plan)}` : '<p class="faint">No 30-day plan covers today.</p>'}</section>
      <section class="brand-card"><div class="brand-sechead"><h3>Coming up</h3><span class="brand-grow"></span><a class="tbtn" href="#/content/brand/calendar">Calendar</a></div>
        <ul class="brand-slots">${soon.map(brandSlotRowHTML).join('') || '<li class="faint">Nothing planned ahead.</li>'}</ul></section>
      <section class="brand-card"><div class="brand-sechead"><h3>Due for review</h3></div>
        ${due.length ? due.map(d => `<button class="brand-rowbtn" data-bnote="${d.id}">⚖ ${esc(brandOf(d).question || brandLabel(d))} <span class="faint">since ${esc(brandOf(d).reviewOn)}</span></button>`).join('') : '<p class="faint">No decisions waiting.</p>'}</section>
      <section class="brand-card"><div class="brand-sechead"><h3>Lately in the notebook</h3><span class="brand-grow"></span><a class="tbtn" href="#/content/brand/notebook">All</a></div>
        ${brandEntries().filter(e => brandScopedTo(e, a.id) && !brandOf(e).retired && BRAND_KINDS[brandOf(e).kind] && BRAND_KINDS[brandOf(e).kind].capture).sort((x, y) => String(y.createdAt).localeCompare(String(x.createdAt))).slice(0, 5).map(brandNoteRowHTML).join('') || '<p class="faint">Nothing captured yet.</p>'}</section>
    </div></div>`;
}
function brandNoteRowHTML(e){
  const b = brandOf(e), k = BRAND_KINDS[b.kind];
  return `<button class="brand-note${b.retired ? ' retired' : ''}${brandFiled(e) ? '' : ' unfiled'}" data-bnote="${e.id}"><span class="brand-kind">${k ? k.ic + ' ' + k.n : 'Unfiled'}</span><span class="brand-ntext">${esc(brandLabel(e))}</span>
    <span class="faint brand-nmeta">${esc(brandScopeName(b.scope))} · ${esc(brandAnchorName(b.anchor))}${(e.tags || []).length ? ' · #' + e.tags.map(esc).join(' #') : ''}</span></button>`;
}

/* ---------- the notebook ---------- */
function brandNotebookFilter(){ return brandState().prefs.notebook; }
function brandNotebookList(f){
  const q = String(f.q || '').toLowerCase().split(/\s+/).filter(Boolean);
  return brandEntries().filter(e => { const b = brandOf(e);
    if(!f.retired && b.retired) return false;
    if(f.kind && b.kind !== f.kind) return false;
    if(f.scope && !b.scope.includes(f.scope)) return false;
    if(f.pillar && !(b.pillarId === f.pillar || (b.anchor && b.anchor.kind === 'pillar' && b.anchor.id === f.pillar))) return false;
    if(f.tag && !(e.tags || []).includes(f.tag)) return false;
    if(q.length){ const hay = [e.title, e.body, JSON.stringify(b), (e.extra || {}).author, (e.extra || {}).source].join(' ').toLowerCase(); if(!q.every(w => hay.includes(w))) return false; }
    return true; }).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}
function brandNotebookHTML(acc){
  const f = brandNotebookFilter(), st = brandState();
  const pillars = st.accounts.flatMap(a => a.pillars.map(p => [p.id, `${a.name}: ${p.name}`]));
  const tags = [...new Set(brandEntries().flatMap(e => e.tags || []))].sort();
  const list = brandNotebookList(f);
  return `<div class="brand-filters">
    <input class="inp grow" id="bnQ" value="${esc(f.q)}" placeholder="search every note" aria-label="Search">
    <select class="sel" id="bnS"><option value="">every scope</option><option value="studio"${f.scope === 'studio' ? ' selected' : ''}>Studio-wide</option>${st.accounts.map(a => `<option value="${a.id}"${f.scope === a.id ? ' selected' : ''}>${esc(a.name)}</option>`).join('')}</select>
    <select class="sel" id="bnK"><option value="">every kind</option>${BRAND_GROUPS.map(g => `<optgroup label="${g}">${Object.entries(BRAND_KINDS).filter(([, v]) => v.g === g).map(([k, v]) => `<option value="${k}"${f.kind === k ? ' selected' : ''}>${v.n}</option>`).join('')}</optgroup>`).join('')}</select>
    <select class="sel" id="bnP"><option value="">every pillar</option>${pillars.map(([id, n]) => `<option value="${id}"${f.pillar === id ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>
    <select class="sel" id="bnT"><option value="">every tag</option>${tags.map(t => `<option${f.tag === t ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>
    <label class="brand-chk"><input type="checkbox" id="bnR"${f.retired ? ' checked' : ''}> retired too</label>
  </div>
  <p class="faint">${list.length} note${list.length === 1 ? '' : 's'}</p>
  <div class="brand-notes">${list.slice(0, 400).map(brandNoteRowHTML).join('')}</div>`;
}
function brandBindNotebook(root, acc, again){
  const f = brandNotebookFilter();
  const set = (k, v) => { f[k] = v; save(); const box = root.querySelector('#bBody'); const q = root.querySelector('#bnQ'), pos = q.selectionStart; box.innerHTML = brandNotebookHTML(acc); brandBindNotebook(root, acc, again);
    root.querySelectorAll('[data-bnote]').forEach(el => el.onclick = () => brandEditDialog(byId(S.entries, el.dataset.bnote), again)); if(k === 'q'){ const q2 = root.querySelector('#bnQ'); q2.focus(); q2.setSelectionRange(pos, pos); } };
  root.querySelector('#bnQ').oninput = e => set('q', e.target.value);
  [['#bnS', 'scope'], ['#bnK', 'kind'], ['#bnP', 'pillar'], ['#bnT', 'tag']].forEach(([id, k]) => root.querySelector(id).onchange = e => set(k, e.target.value));
  root.querySelector('#bnR').onchange = e => set('retired', e.target.checked);
}

/* ---------- the inbox, and triage ---------- */
function brandTriageHTML(){
  const list = brandInbox(), st = brandState();
  if(!list.length) return '<div class="brand-empty"><p>Nothing unfiled.</p><p class="faint">Every note has a scope, a kind and an anchor.</p></div>';
  return `<p class="faint">Each needs a scope, a kind and an anchor. Set what is missing and file it.</p><div class="brand-triage">${list.map(e => { const b = brandOf(e), miss = brandMissing(e);
    return `<div class="brand-tri" data-btri="${e.id}"><div class="brand-tritext"><span class="brand-kind">${BRAND_KINDS[b.kind] ? BRAND_KINDS[b.kind].n : 'no kind'}</span> ${esc(brandLabel(e))}<span class="brand-miss">missing: ${miss.join(', ')}</span></div>
      <div class="brand-tripick">
        <select class="sel" data-btk${e.type === 'quote' ? ' disabled' : ''}>${Object.entries(BRAND_KINDS).map(([k, v]) => `<option value="${k}"${k === b.kind ? ' selected' : ''}>${v.n}</option>`).join('')}</select>
        <select class="sel" data-bts><option value="">scope…</option><option value="studio"${b.scope.includes('studio') ? ' selected' : ''}>Studio-wide</option>${st.accounts.map(a => `<option value="${a.id}"${b.scope[0] === a.id ? ' selected' : ''}>${esc(a.name)}</option>`).join('')}</select>
        <select class="sel" data-bta></select>
        <button class="btn sm primary" data-btf>File</button></div></div>`; }).join('')}</div>`;
}
function brandBindTriage(root, again){
  root.querySelectorAll('[data-btri]').forEach(row => {
    const e = byId(S.entries, row.dataset.btri), b = brandOf(e);
    const k = row.querySelector('[data-btk]'), s = row.querySelector('[data-bts]'), a = row.querySelector('[data-bta]');
    const fill = () => { const scope = s.value ? [s.value] : []; const cur = brandAnchorKey(b.anchor);
      a.innerHTML = '<option value="">anchor…</option>' + brandAnchorOptions(k.value, scope).map(([v, n]) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(n)}</option>`).join(''); };
    fill(); k.onchange = fill; s.onchange = fill;
    row.querySelector('[data-btf]').onclick = () => {
      if(e.type !== 'quote') b.kind = k.value;
      if(s.value && !b.scope.includes(s.value)) b.scope = s.value === 'studio' ? ['studio'] : [...b.scope.filter(x => x !== 'studio'), s.value];
      b.anchor = brandParseAnchor(a.value); save();
      const miss = brandMissing(e); if(miss.length){ toast('Still missing: ' + miss.join(', ') + '.'); return; }
      again();
    };
  });
}

/* ---------- judgment page ---------- */
function brandJudgmentHTML(accountId){
  const decs = brandOfKind('decision', accountId).sort((a, b) => String(brandOf(a).reviewOn || '9').localeCompare(String(brandOf(b).reviewOn || '9')));
  const hyps = brandOfKind('hypothesis', accountId), revs = brandOfKind('review', accountId).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const qs = brandOfKind('question', accountId);
  return `<div class="brand-judg">
    <section class="brand-card"><div class="brand-sechead"><h3>Decisions</h3><span class="faint">${decs.length}</span><span class="brand-grow"></span><button class="tbtn" data-bnewdec>＋ Decision</button></div>
      ${decs.map(d => { const b = brandOf(d), due = b.reviewOn && b.reviewOn <= today() && !String(b.outcome || '').trim();
        return `<button class="brand-rowbtn${due ? ' due' : ''}" data-bnote="${d.id}"><b>${esc(b.question || brandLabel(d))}</b><span class="faint">${b.choice ? '→ ' + esc(b.choice) : 'undecided'}${b.reviewOn ? ' · look again ' + esc(b.reviewOn) : ''}${b.outcome ? ' · outcome written' : ''}</span></button>`; }).join('') || '<p class="faint">No decisions recorded.</p>'}</section>
    <section class="brand-card"><div class="brand-sechead"><h3>Hypotheses</h3><span class="brand-grow"></span><button class="tbtn" id="bNewHyp2">＋ Hypothesis</button></div>
      ${hyps.map(h => `<div class="brand-hyp"><button class="brand-rowbtn" data-bnote="${h.id}">${esc(brandLabel(h))}</button>${brandHypothesisHTML(h)}</div>`).join('') || '<p class="faint">None yet.</p>'}</section>
    <section class="brand-card"><div class="brand-sechead"><h3>Reviews</h3><span class="brand-grow"></span><button class="tbtn" id="bWeek">＋ Week review</button></div>
      ${revs.map(r => `<button class="brand-rowbtn" data-bnote="${r.id}">${esc(brandLabel(r))} <span class="faint">${esc(String(r.createdAt).slice(0, 10))}</span></button>`).join('') || '<p class="faint">None yet. A plan’s review is written from its page.</p>'}</section>
    <section class="brand-card"><div class="brand-sechead"><h3>Open questions</h3></div>${qs.map(brandNoteRowHTML).join('') || '<p class="faint">None.</p>'}</section>
  </div>`;
}
function brandBindJudgment(root, acc, again){
  const h = root.querySelector('#bNewHyp2'); if(h) h.onclick = () => brandNoteDialog({kind: 'hypothesis', scope: acc ? [acc.id] : ['studio'], anchor: acc ? {kind: 'charter', id: acc.id} : null}, again);
  const w = root.querySelector('#bWeek'); if(w) w.onclick = () => { const plan = acc && brandCurrentPlan(acc.id, 'week'); brandReviewDialog(null, plan || null, again); };
  root.querySelectorAll('[data-bopen]').forEach(b => b.onclick = () => brandEditDialog(byId(S.entries, b.dataset.bopen), again));
}

/* ---------- studio-wide ---------- */
function brandStudioHTML(){
  const st = brandState(), t = today();
  const up = brandEntries().filter(e => brandOf(e).kind === 'slot' && !brandOf(e).retired && brandOf(e).date >= t && brandOf(e).date <= brandAddDays(t, 14)).sort((a, b) => brandOf(a).date.localeCompare(brandOf(b).date));
  const due = brandDecisionsDue(null), studio = brandEntries().filter(e => brandOf(e).scope.includes('studio') && !brandOf(e).retired);
  return `<div class="brand-studio">
    <div class="brand-tablewrap"><table class="brand-matrix"><thead><tr><th>Account</th><th>Status</th><th>Unfiled</th><th>This month</th><th>Published</th><th>Decisions due</th><th>30-day plan</th></tr></thead><tbody>
      ${st.accounts.map(a => { const slots = brandEntries().filter(e => brandOf(e).kind === 'slot' && !brandOf(e).retired && brandOf(e).accountId === a.id);
        const month = slots.filter(s => brandOf(s).date.slice(0, 7) === t.slice(0, 7)), pub = month.filter(s => ['published', 'reviewed'].includes(brandOf(s).status)), plan = brandCurrentPlan(a.id, '30');
        return `<tr><td><a href="#/content/brand/account/${a.id}">${esc(a.name)}</a></td><td>${a.status}</td><td>${brandInbox().filter(e => brandOf(e).scope.includes(a.id)).length}</td><td>${month.length}</td><td>${pub.length}</td><td>${brandDecisionsDue(a.id).length}</td><td>${plan ? `<a href="#/content/brand/plan/${plan.id}">${esc(brandOf(plan).theme || 'untitled')}</a>` : '—'}</td></tr>`; }).join('') || '<tr><td colspan="7" class="faint">No accounts.</td></tr>'}
    </tbody></table></div>
    <div class="brand-dashgrid">
      <section class="brand-card"><div class="brand-sechead"><h3>The next two weeks, everywhere</h3></div><ul class="brand-slots">${up.map(brandSlotRowHTML).join('') || '<li class="faint">Nothing planned.</li>'}</ul></section>
      <section class="brand-card"><div class="brand-sechead"><h3>Decisions due</h3></div>${due.map(d => `<button class="brand-rowbtn" data-bnote="${d.id}">⚖ ${esc(brandOf(d).question || brandLabel(d))}</button>`).join('') || '<p class="faint">None.</p>'}</section>
      <section class="brand-card"><div class="brand-sechead"><h3>Studio-wide notes</h3><span class="faint">${studio.length}</span></div>${studio.slice(0, 8).map(brandNoteRowHTML).join('') || '<p class="faint">None.</p>'}</section>
    </div></div>`;
}
