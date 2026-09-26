/* ============================================================
   BRAND STRATEGY — horizons, slots and briefs.

   Plans nest: season → 90 days → 30 days → week, and slots hang on them.
   A 30-day plan has a theme, an objective, the hypotheses it tests, a target
   pillar mix, its slots on a calendar, and a review when it ends; its
   actual mix is counted from the slots marked Published.

   A slot is a planned post: a date, an account, a platform, a pillar, and a
   status of its own — Planned → Linked → Published → Reviewed — which is
   Brand's and never the Writing Studio's. A brief is the intent for a piece
   (angle, purpose, audience, the hypothesis it tests, notes that bear on
   it) and has no body. A slot links to a Writing Studio piece by id, reads
   its title and status, and opens it at its own address.

   Before a slot can be marked Published, the account's voice rules and
   "never" list are shown as a checklist, each ticked by hand.
   ============================================================ */

function brandPlans(accountId){ return brandOfKind('horizon', accountId).sort((a, b) => String(brandOf(a).start || '').localeCompare(String(brandOf(b).start || ''))); }
function brandPlanChildren(id){ return brandEntries().filter(e => { const b = brandOf(e); return b.kind === 'horizon' && b.parentId === id && !b.retired; }); }
function brandSlotsOf(planId){ return brandEntries().filter(e => { const b = brandOf(e); return b.kind === 'slot' && !b.retired && b.planId === planId; }).sort((a, b) => String(brandOf(a).date).localeCompare(String(brandOf(b).date))); }
/* a plan's slots, and those of the plans under it */
function brandSlotsUnder(planId){ let out = brandSlotsOf(planId); brandPlanChildren(planId).forEach(c => out = out.concat(brandSlotsUnder(c.id))); return out; }
function brandCurrentPlan(accountId, level){
  const t = today();
  return brandPlans(accountId).filter(e => brandOf(e).level === (level || '30') && brandOf(e).start <= t && (!brandOf(e).end || brandOf(e).end >= t) && brandScopedTo(e, accountId))[0] || null;
}
function brandAddDays(iso, n){ const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
const BRAND_LEVEL_DAYS = {season: 91, '90': 90, '30': 30, week: 7};
function brandNewPlan(accountId, level, parentId){
  const parent = parentId ? byId(S.entries, parentId) : null;
  const start = parent ? brandOf(parent).start || today() : today();
  const anchor = parent ? {kind: 'plan', id: parent.id} : {kind: 'charter', id: accountId};
  return brandNew('horizon', {theme: '', objective: ''}, {level, parentId: parentId || null, start, end: brandAddDays(start, BRAND_LEVEL_DAYS[level] - 1), scope: [accountId], anchor, accountId});
}
/* target and actual pillar mix, counted from slots marked Published (or Reviewed) */
function brandMix(plan){
  const a = brandAccount(brandOf(plan).accountId || brandOf(plan).scope[0]); if(!a) return [];
  const slots = brandSlotsUnder(plan.id), pub = slots.filter(s => ['published', 'reviewed'].includes(brandOf(s).status));
  return a.pillars.map(p => ({pillar: p, target: +(brandOf(plan).targetMix[p.id] ?? p.targetPct) || 0,
    planned: slots.filter(s => brandOf(s).pillarId === p.id).length, published: pub.filter(s => brandOf(s).pillarId === p.id).length,
    actual: pub.length ? Math.round(pub.filter(s => brandOf(s).pillarId === p.id).length / pub.length * 100) : 0, total: pub.length}));
}
function brandMixHTML(plan){
  const mix = brandMix(plan); if(!mix.length) return '<p class="faint">The account has no pillars yet.</p>';
  const total = mix[0].total;
  return `<div class="brand-mix"><div class="brand-mixhead"><span>Pillar mix</span><span class="faint">target against actual, from ${total} published slot${total === 1 ? '' : 's'}</span></div>
    ${mix.map(m => `<div class="brand-mixrow"><span class="brand-mixname"><i style="background:${m.pillar.color}"></i>${esc(m.pillar.name)}</span>
      <span class="brand-bars"><span class="t" style="width:${m.target}%" title="target ${m.target}%"></span><span class="a" style="width:${m.actual}%;background:${m.pillar.color}" title="actual ${m.actual}%"></span></span>
      <span class="brand-mixnum">${m.actual}% <span class="faint">/ ${m.target}%</span></span><span class="faint">${m.published} of ${m.planned}</span></div>`).join('')}
    <table class="brand-mixtable sr"><caption>Pillar mix</caption><tr><th>Pillar</th><th>Target</th><th>Actual</th><th>Published</th><th>Planned</th></tr>${mix.map(m => `<tr><td>${esc(m.pillar.name)}</td><td>${m.target}%</td><td>${m.actual}%</td><td>${m.published}</td><td>${m.planned}</td></tr>`).join('')}</table></div>`;
}

/* ---------- the plans page ---------- */
function brandPlansHTML(accountId){
  const roots = brandPlans(accountId).filter(e => !brandOf(e).parentId || !byId(S.entries, brandOf(e).parentId));
  const node = e => { const b = brandOf(e), kids = brandPlanChildren(e.id).sort((x, y) => String(brandOf(x).start).localeCompare(String(brandOf(y).start))), slots = brandSlotsOf(e.id);
    const next = BRAND_LEVEL_ORDER[BRAND_LEVEL_ORDER.indexOf(b.level) + 1];
    return `<li><div class="brand-planrow"><span class="brand-level">${BRAND_LEVELS[b.level]}</span><a href="#/content/brand/plan/${e.id}">${esc(brandLabel(e) || 'Untitled plan')}</a>
      <span class="faint">${esc(b.start || '')} – ${esc(b.end || '')}</span>${slots.length ? `<span class="faint">${slots.length} slot${slots.length === 1 ? '' : 's'}</span>` : ''}
      ${next ? `<button class="tbtn sm" data-bnewplan="${next}" data-bparent="${e.id}">＋ ${BRAND_LEVELS[next]}</button>` : ''}</div>
      ${kids.length ? `<ul>${kids.map(node).join('')}</ul>` : ''}</li>`; };
  return `<div class="brand-plans"><div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:10px">${BRAND_LEVEL_ORDER.map(l => `<button class="tbtn" data-bnewplan="${l}">＋ ${BRAND_LEVELS[l]} plan</button>`).join('')}</div>
    ${roots.length ? `<ul class="brand-plantree">${roots.map(node).join('')}</ul>` : '<p class="faint">No plans yet. A season holds 90-day plans, which hold 30-day plans, which hold weeks and their slots.</p>'}</div>`;
}
function brandBindPlans(root, accountId){
  root.querySelectorAll('[data-bnewplan]').forEach(b => b.onclick = () => { if(!accountId){ toast('Choose an account first.'); return; }
    const p = brandNewPlan(accountId, b.dataset.bnewplan, b.dataset.bparent || null); navigate('#/content/brand/plan/' + p.id); });
}
function brandPlanPageHTML(plan){
  const b = brandOf(plan), a = brandAccount(b.accountId || b.scope[0]);
  const hyps = brandOfKind('hypothesis', a && a.id), slots = brandSlotsOf(plan.id), parent = b.parentId ? byId(S.entries, b.parentId) : null;
  const review = b.reviewId ? byId(S.entries, b.reviewId) : null;
  return `<div class="brand-plan" data-bplan="${plan.id}">
    <div class="brand-crumbs">${parent ? `<a href="#/content/brand/plan/${parent.id}">${esc(brandLabel(parent))}</a> ›` : ''} <span>${BRAND_LEVELS[b.level]} plan</span></div>
    <div class="brand-grid2">
      <label class="brand-f"><span>Theme</span><input class="inp" data-bpf="theme" value="${esc(b.theme || '')}"></label>
      <div class="brand-grid2 tight"><label class="brand-f"><span>Starts</span><input class="inp" type="date" data-bpf="start" value="${esc(b.start || '')}"></label><label class="brand-f"><span>Ends</span><input class="inp" type="date" data-bpf="end" value="${esc(b.end || '')}"></label></div>
    </div>
    <label class="brand-f"><span>Objective</span><textarea class="inp" rows="2" data-bpf="objective">${esc(b.objective || '')}</textarea></label>
    <div class="brand-f"><span>Hypotheses it tests</span><div class="brand-chips">${hyps.map(h => `<label class="brand-chip${b.hypothesisIds.includes(h.id) ? ' on' : ''}"><input type="checkbox" data-bhyp="${h.id}"${b.hypothesisIds.includes(h.id) ? ' checked' : ''}>${esc(brandLabel(h))} <span class="faint">${brandOf(h).status}</span></label>`).join('') || '<span class="faint">No hypotheses for this account yet.</span>'}
      <button class="tbtn sm" id="bNewHyp">＋ Hypothesis</button></div></div>
    ${a ? `<div class="brand-f"><span>Target pillar mix <small>blank uses the pillar's own target</small></span><div class="brand-targets">${a.pillars.map(p => `<label><i style="background:${p.color}"></i>${esc(p.name)} <input class="inp brand-pct" type="number" min="0" max="100" data-btm="${p.id}" value="${b.targetMix[p.id] ?? ''}" placeholder="${p.targetPct}">%</label>`).join('')}</div></div>` : ''}
    ${brandMixHTML(plan)}
    <section class="brand-sec"><div class="brand-sechead"><h3>Slots</h3><span class="faint">${slots.length}</span><span class="brand-grow"></span><button class="tbtn" id="bAddSlot">＋ Slot</button></div>
      ${brandSlotCalendarHTML(slots, b.start, b.end)}
      <ul class="brand-slots">${slots.map(brandSlotRowHTML).join('')}</ul></section>
    <section class="brand-sec"><div class="brand-sechead"><h3>Review</h3><span class="brand-grow"></span>${review ? `<button class="tbtn" data-bopen="${review.id}">Open the review</button>` : `<button class="tbtn" id="bReview">Write the ${['30', '90', 'week'].includes(b.level) ? BRAND_LEVELS[b.level].toLowerCase() : ''} review</button>`}</div>
      ${review ? `<p class="faint">${esc(review.title || '')} — written ${esc(fmtDate(String(review.createdAt).slice(0, 10), 'med'))}</p>` : `<p class="faint">${b.end && b.end < today() ? 'This plan has ended; it is waiting for its review.' : 'At the end of the plan.'}</p>`}</section>
    <div class="row" style="gap:8px;margin-top:14px"><button class="tbtn" id="bRetirePlan">${b.retired ? 'Bring back' : 'Retire this plan'}</button></div>
  </div>`;
}
function brandBindPlanPage(root, plan, again){
  const b = brandOf(plan), box = root.querySelector('[data-bplan]');
  box.querySelectorAll('[data-bpf]').forEach(i => i.onchange = () => { b[i.dataset.bpf] = i.value; if(i.dataset.bpf === 'theme') plan.title = i.value; plan.updatedAt = new Date().toISOString(); save(); });
  box.querySelectorAll('[data-bhyp]').forEach(i => i.onchange = () => { const id = i.dataset.bhyp; b.hypothesisIds = i.checked ? [...new Set([...b.hypothesisIds, id])] : b.hypothesisIds.filter(x => x !== id);
    const h = byId(S.entries, id); if(h){ const hb = brandOf(h); hb.planIds = hb.planIds || []; if(i.checked && !hb.planIds.includes(plan.id)) hb.planIds.push(plan.id); if(!i.checked) hb.planIds = hb.planIds.filter(x => x !== plan.id); } save(); again(); });
  box.querySelectorAll('[data-btm]').forEach(i => i.onchange = () => { if(i.value === '') delete b.targetMix[i.dataset.btm]; else b.targetMix[i.dataset.btm] = +i.value; save(); again(); });
  const nh = box.querySelector('#bNewHyp'); if(nh) nh.onclick = () => brandNoteDialog({kind: 'hypothesis', scope: b.scope.slice(), anchor: {kind: 'plan', id: plan.id}}, h => { b.hypothesisIds.push(h.id); brandOf(h).planIds = [plan.id]; save(); again(); });
  box.querySelector('#bAddSlot').onclick = () => brandSlotDialog(null, {planId: plan.id, accountId: b.accountId || b.scope[0], date: b.start && b.start > today() ? b.start : today()}, again);
  const rv = box.querySelector('#bReview'); if(rv) rv.onclick = () => brandReviewDialog(null, plan, again);
  box.querySelector('#bRetirePlan').onclick = () => { brandRetire(plan, !b.retired); again(); };
  brandBindSlotRows(box, again);
}

/* ---------- slots ---------- */
function brandSlotRowHTML(s){
  const b = brandOf(s), p = brandPillar(b.pillarId), piece = brandPiece(b.pieceId), a = brandAccount(b.accountId);
  const brief = brandBriefFor(s.id);
  return `<li class="brand-slot ${b.status}" data-bslot="${s.id}"><span class="brand-sdate">${esc(fmtDate(b.date, 'short'))}</span>
    <span class="brand-pdot" style="background:${p ? p.color : 'var(--line)'}" title="${esc(p ? p.name : 'no pillar')}"></span>
    <span class="brand-stitle">${esc(brief ? brandOf(brief).angle || brandLabel(brief) : (s.title || 'a slot'))}<span class="faint"> · ${esc(a ? a.name : '')}${b.platform ? ' · ' + esc(b.platform) : ''}</span></span>
    <span class="brand-sstatus ${b.status}">${BRAND_SLOT_STATUS[b.status]}</span>
    ${b.pieceId ? (piece ? `<a class="brand-piece" href="#/writing/${piece.id}" title="Open in the Writing Studio">✍ ${esc(piece.title || 'Untitled')} <span class="faint">${esc(brandPieceStatus(piece))}</span></a>` : `<span class="brand-missing">piece missing</span>`) : ''}
    <button class="tbtn sm" data-bslotopen="${s.id}">Open</button></li>`;
}
function brandBindSlotRows(scope, again){ scope.querySelectorAll('[data-bslotopen]').forEach(b => b.onclick = () => brandSlotDialog(byId(S.entries, b.dataset.bslotopen), null, again)); scope.querySelectorAll('[data-bopen]').forEach(b => b.onclick = () => brandEditDialog(byId(S.entries, b.dataset.bopen), again)); }
function brandBriefFor(slotId){ return brandEntries().find(e => brandOf(e).kind === 'brief' && brandOf(e).forId === slotId && !brandOf(e).retired) || null; }
function brandSlotCalendarHTML(slots, from, to){
  if(!from) return '';
  const start = new Date(from + 'T12:00:00'), end = new Date((to || brandAddDays(from, 30)) + 'T12:00:00');
  const days = Math.min(98, Math.round((end - start) / 864e5) + 1); if(days < 1) return '';
  const lead = (start.getDay() + 6) % 7, byDay = {};
  slots.forEach(s => (byDay[brandOf(s).date] = byDay[brandOf(s).date] || []).push(s));
  const cells = []; for(let i = 0; i < lead; i++) cells.push('<div class="brand-cal0"></div>');
  for(let i = 0; i < days; i++){ const d = brandAddDays(from, i), list = byDay[d] || [];
    cells.push(`<div class="brand-calday${d === today() ? ' today' : ''}"><span>${+d.slice(8)}</span>${list.map(s => { const p = brandPillar(brandOf(s).pillarId); return `<button class="brand-calslot ${brandOf(s).status}" style="--pc:${p ? p.color : 'var(--muted)'}" data-bslotopen="${s.id}" title="${esc(brandLabel(s))} — ${BRAND_SLOT_STATUS[brandOf(s).status]}"></button>`; }).join('')}</div>`); }
  return `<div class="brand-cal"><div class="brand-calhead">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(x => `<span>${x}</span>`).join('')}</div><div class="brand-calgrid">${cells.join('')}</div></div>`;
}
/* the month view across one account or all of them */
function brandCalendarHTML(accountId){
  const st = brandState(); const m = st.prefs.calMonth || today().slice(0, 7);
  const first = m + '-01', last = brandAddDays(brandAddDays(first, 32).slice(0, 7) + '-01', -1);
  const slots = brandEntries().filter(e => { const b = brandOf(e); return b.kind === 'slot' && !b.retired && b.date >= first && b.date <= last && (!accountId || b.accountId === accountId); });
  const prev = brandAddDays(first, -1).slice(0, 7), next = brandAddDays(last, 1).slice(0, 7);
  return `<div class="brand-monthhead"><button class="tbtn" data-bcal="${prev}" aria-label="Previous month">‹</button><b>${new Date(first + 'T12:00:00').toLocaleDateString(undefined, {month: 'long', year: 'numeric'})}</b><button class="tbtn" data-bcal="${next}" aria-label="Next month">›</button>
    <span class="brand-grow"></span><button class="tbtn" id="bCalSlot">＋ Slot</button></div>
    ${brandSlotCalendarHTML(slots, first, last)}
    <div class="brand-legend">${Object.entries(BRAND_SLOT_STATUS).map(([k, v]) => `<span><i class="brand-calslot ${k}" style="--pc:var(--muted)"></i>${v}</span>`).join('')}</div>
    <ul class="brand-slots">${slots.sort((a, b) => brandOf(a).date.localeCompare(brandOf(b).date)).map(brandSlotRowHTML).join('') || '<li class="faint">No slots this month.</li>'}</ul>`;
}

/* the slot itself: its fields, its brief, its piece, and the way to Published */
function brandSlotDialog(slot, pre, again){
  const isNew = !slot, st = brandState();
  const b = slot ? brandOf(slot) : Object.assign({status: 'planned', date: today(), accountId: st.prefs.account || (st.accounts[0] || {}).id, platform: '', pillarId: '', planId: null}, pre || {});
  const a = () => brandAccount(m.querySelector('#bsAcc').value);
  const brief = slot ? brandBriefFor(slot.id) : null, piece = brandPiece(b.pieceId);
  const plansFor = accId => brandPlans(accId).filter(p => !brandOf(p).retired);
  const m = openModal(`<h2 class="serif">${isNew ? 'A new slot' : 'Slot'}</h2>
    <div class="brand-grid2">
      <label class="brand-f"><span>Date</span><input class="inp" type="date" id="bsDate" value="${esc(b.date || '')}"></label>
      <label class="brand-f"><span>Account</span><select class="sel" id="bsAcc">${st.accounts.map(x => `<option value="${x.id}"${x.id === b.accountId ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
      <label class="brand-f"><span>Platform</span><input class="inp" id="bsPlat" value="${esc(b.platform || '')}" list="bsPlats"><datalist id="bsPlats"></datalist></label>
      <label class="brand-f"><span>Pillar</span><select class="sel" id="bsPillar"></select></label>
      <label class="brand-f"><span>Plan</span><select class="sel" id="bsPlan"></select></label>
      <label class="brand-f"><span>Status</span><select class="sel" id="bsStatus" disabled>${Object.entries(BRAND_SLOT_STATUS).map(([k, v]) => `<option value="${k}"${b.status === k ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
    </div>
    ${isNew ? '' : `<section class="brand-sec"><div class="brand-sechead"><h3>Brief</h3><span class="brand-grow"></span><button class="tbtn sm" id="bsBrief">${brief ? 'Edit the brief' : '＋ Brief'}</button></div>
      ${brief ? `<p><b>${esc(brandOf(brief).angle || '')}</b></p><p class="faint">${esc(brandOf(brief).purpose || '')}${brandOf(brief).audience ? ' · for ' + esc(brandOf(brief).audience) : ''}</p>` : '<p class="faint">The intent for the piece — angle, purpose, audience, the hypothesis it tests. No body text: that is written in the Writing Studio.</p>'}</section>
    <section class="brand-sec"><div class="brand-sechead"><h3>The piece</h3></div>
      ${b.pieceId ? (piece ? `<p><a href="#/writing/${piece.id}" class="brand-piece">✍ ${esc(piece.title || 'Untitled')}</a> <span class="faint">Writing Studio status: ${esc(brandPieceStatus(piece) || '—')}</span></p>` : '<p class="brand-missing">The linked piece is missing — it may have been deleted in the Writing Studio.</p>') + '<button class="tbtn sm" id="bsUnlink">Unlink</button>'
        : `<div class="row" style="gap:6px;flex-wrap:wrap"><button class="tbtn" id="bsLink">Link a piece…</button>${typeof newWriting === 'function' ? '<button class="tbtn" id="bsStart">Start in Writing Studio</button>' : ''}</div>`}</section>
    <section class="brand-sec" id="bsPubSec"></section>`}
    <p class="brand-err" id="bsErr"></p>
    <div class="row" style="justify-content:space-between;gap:8px"><span>${isNew ? '' : `<button class="tbtn" id="bsRetire">${b.retired ? 'Bring back' : 'Retire'}</button>`}</span><span class="row" style="gap:8px"><button class="btn ghost" id="bsNo">Close</button><button class="btn primary" id="bsOk">${isNew ? 'Add slot' : 'Save'}</button></span></div>`);
  const $m = id => m.querySelector(id);
  const fill = () => { const acc = a(); if(!acc) return;
    $m('#bsPillar').innerHTML = '<option value="">(no pillar)</option>' + acc.pillars.map(p => `<option value="${p.id}"${p.id === b.pillarId ? ' selected' : ''}>${esc(p.name)}</option>`).join('');
    $m('#bsPlan').innerHTML = '<option value="">(no plan)</option>' + plansFor(acc.id).map(p => `<option value="${p.id}"${p.id === b.planId ? ' selected' : ''}>${BRAND_LEVELS[brandOf(p).level]}: ${esc(brandLabel(p))}</option>`).join('');
    $m('#bsPlats').innerHTML = acc.platforms.map(x => `<option value="${esc(x)}">`).join(''); if(!$m('#bsPlat').value && acc.platforms.length === 1) $m('#bsPlat').value = acc.platforms[0]; };
  fill(); $m('#bsAcc').onchange = fill;
  const collect = () => ({date: $m('#bsDate').value, accountId: $m('#bsAcc').value, platform: $m('#bsPlat').value.trim(), pillarId: $m('#bsPillar').value, planId: $m('#bsPlan').value || null});
  const persist = () => { const f = collect(); if(!f.date){ $m('#bsErr').textContent = 'A slot needs a date.'; return null; }
    const anchor = f.planId ? {kind: 'plan', id: f.planId} : f.pillarId ? {kind: 'pillar', id: f.pillarId} : {kind: 'charter', id: f.accountId};
    if(isNew){ slot = brandNew('slot', {title: ''}, Object.assign(f, {status: 'planned', scope: [f.accountId], anchor})); }
    else { Object.assign(b, f); b.scope = [f.accountId]; b.anchor = anchor; slot.updatedAt = new Date().toISOString(); save(); }
    slot.title = slot.title || `${f.platform || 'Post'} · ${f.date}`; return slot; };
  $m('#bsNo').onclick = () => { m.remove(); again && again(); };
  $m('#bsOk').onclick = () => { if(persist()){ m.remove(); again && again(); } };
  if(isNew) return;
  $m('#bsRetire').onclick = () => { brandRetire(slot, !b.retired); m.remove(); again && again(); };
  $m('#bsBrief').onclick = () => { persist(); m.remove(); brandBriefDialog(brief, slot, again); };
  const reopen = () => { m.remove(); brandSlotDialog(slot, null, again); };
  if($m('#bsUnlink')) $m('#bsUnlink').onclick = () => { b.pieceId = null; if(b.status === 'linked') b.status = 'planned'; save(); reopen(); };
  if($m('#bsLink')) $m('#bsLink').onclick = () => brandPickPiece(id => { persist(); b.pieceId = id; if(b.status === 'planned') b.status = 'linked'; save(); reopen(); });
  if($m('#bsStart')) $m('#bsStart').onclick = () => { persist();
    /* the Writing Studio's own creation function; only the title is set here */
    const piece2 = newWriting(); piece2.title = (brief && brandOf(brief).angle) || slot.title || 'Untitled'; saveNow();
    b.pieceId = piece2.id; if(b.status === 'planned') b.status = 'linked'; save(); m.remove(); navigate('#/writing/' + piece2.id); };
  brandPublishSection($m('#bsPubSec'), slot, reopen);
}
function brandPickPiece(done){
  const list = brandPieces();
  const m = openModal(`<h2 class="serif">Link a piece</h2><p class="faint">A piece in the Writing Studio. Only its id is kept here; nothing in it changes.</p>
    <input class="inp" id="bpQ" placeholder="search titles"><div class="brand-picklist" id="bpL"></div>`, 'narrow');
  const paint = () => { const q = m.querySelector('#bpQ').value.trim().toLowerCase();
    m.querySelector('#bpL').innerHTML = list.filter(p => !q || (p.title || '').toLowerCase().includes(q)).slice(0, 50).map(p => `<button type="button" data-p="${p.id}"><b>${esc(p.title || 'Untitled')}</b><span class="faint">${esc(brandPieceStatus(p))} · ${esc(String(p.createdAt).slice(0, 10))}</span></button>`).join('') || '<p class="faint">No pieces.</p>';
    m.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { m.remove(); done(b.dataset.p); }); };
  m.querySelector('#bpQ').oninput = paint; paint();
}
/* the checklist before Published, from the account's voice rules and its never list */
function brandChecklist(slot){
  const b = brandOf(slot), a = brandAccount(b.accountId); if(!a) return [];
  const rules = brandOfKind('voiceRule', a.id).map(r => ({id: 'r:' + r.id, text: r.body || r.title, kind: 'Voice rule'}));
  const never = a.charter.never.map((t, i) => ({id: 'n:' + i + ':' + t.slice(0, 24), text: 'Never: ' + t, kind: 'Never'}));
  return rules.concat(never);
}
function brandPublishSection(box, slot, reopen){
  const b = brandOf(slot), list = brandChecklist(slot);
  if(b.status === 'published' || b.status === 'reviewed'){
    const metrics = b.metricIds.map(id => byId(S.entries, id)).filter(Boolean);
    box.innerHTML = `<div class="brand-sechead"><h3>Published</h3><span class="faint">${esc(b.publishedOn || '')}${b.publishedPlatform ? ' · ' + esc(b.publishedPlatform) : ''}</span><span class="brand-grow"></span><button class="tbtn sm" id="bsMetric">＋ Metric note</button>${b.status === 'published' ? '<button class="tbtn sm" id="bsReviewed">Mark reviewed</button>' : ''}</div>
      ${metrics.map(x => `<div class="brand-metric"><span class="faint">${esc(brandOf(x).date || '')}</span> ${brandOf(x).numbers.map(n => `<b>${esc(n.value)}</b> ${esc(n.label)}`).join(' · ')}</div>`).join('')}`;
    box.querySelector('#bsMetric').onclick = () => brandMetricDialog(null, slot, reopen);
    const rv = box.querySelector('#bsReviewed'); if(rv) rv.onclick = () => { b.status = 'reviewed'; save(); reopen(); };
    return;
  }
  box.innerHTML = `<div class="brand-sechead"><h3>Before it goes out</h3><span class="faint">${list.length ? 'tick each by hand' : 'the account has no voice rules or never list yet'}</span></div>
    <div class="brand-checks">${list.map(it => `<label class="brand-check"><input type="checkbox" data-bck="${esc(it.id)}"${b.checklist[it.id] ? ' checked' : ''}><span><small>${it.kind}</small> ${esc(it.text)}</span></label>`).join('')}</div>
    <div class="brand-grid2 tight"><label class="brand-f"><span>Published on</span><input class="inp" type="date" id="bsPubOn" value="${today()}"></label><label class="brand-f"><span>Platform</span><input class="inp" id="bsPubPlat" value="${esc(b.platform || '')}"></label></div>
    <button class="btn sm primary" id="bsPublish">Mark published</button><span class="brand-err" id="bsPubErr"></span>`;
  box.querySelectorAll('[data-bck]').forEach(i => i.onchange = () => { b.checklist[i.dataset.bck] = i.checked; save(); });
  box.querySelector('#bsPublish').onclick = () => {
    const open = list.filter(it => !b.checklist[it.id]);
    if(open.length){ box.querySelector('#bsPubErr').textContent = `${open.length} item${open.length === 1 ? '' : 's'} on the checklist not ticked yet.`; return; }
    b.status = 'published'; b.publishedOn = box.querySelector('#bsPubOn').value || today(); b.publishedPlatform = box.querySelector('#bsPubPlat').value.trim(); save(); reopen();
  };
}
function brandBriefDialog(brief, slot, again){
  const sb = brandOf(slot), a = brandAccount(sb.accountId), b = brief ? brandOf(brief) : {};
  const hyps = brandOfKind('hypothesis', a && a.id);
  const notes = brandEntries().filter(e => { const x = brandOf(e); return BRAND_KINDS[x.kind] && BRAND_KINDS[x.kind].capture && !x.retired && brandScopedTo(e, a && a.id); });
  const m = openModal(`<h2 class="serif">Brief</h2><p class="faint">The intent for the piece. No body text — the piece is written in the Writing Studio.</p>
    <label class="brand-f"><span>Angle</span><input class="inp" id="bbAngle" value="${esc(b.angle || '')}"></label>
    <label class="brand-f"><span>Purpose</span><textarea class="inp" rows="2" id="bbPurpose">${esc(b.purpose || '')}</textarea></label>
    <div class="brand-grid2"><label class="brand-f"><span>Target audience</span><input class="inp" id="bbAud" value="${esc(b.audience || '')}"></label>
      <label class="brand-f"><span>Pillar</span><select class="sel" id="bbPillar"><option value="">(the slot's)</option>${a ? a.pillars.map(p => `<option value="${p.id}"${p.id === (b.pillarId || sb.pillarId) ? ' selected' : ''}>${esc(p.name)}</option>`).join('') : ''}</select></label>
      <label class="brand-f"><span>Hypothesis it tests</span><select class="sel" id="bbHyp"><option value="">(none)</option>${hyps.map(h => `<option value="${h.id}"${h.id === b.hypothesisId ? ' selected' : ''}>${esc(brandLabel(h))}</option>`).join('')}</select></label></div>
    <div class="brand-f"><span>Notes that bear on it</span><div class="brand-picklist short">${notes.map(n => `<label class="brand-check"><input type="checkbox" data-bref="${n.id}"${(b.refs || []).includes(n.id) ? ' checked' : ''}><span><small>${esc(brandKindName(n))}</small> ${esc(brandLabel(n))}</span></label>`).join('') || '<p class="faint">No captures for this account yet.</p>'}</div></div>
    <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" id="bbNo">Cancel</button><button class="btn primary" id="bbOk">Keep the brief</button></div>`);
  const $m = id => m.querySelector(id);
  $m('#bbNo').onclick = () => { m.remove(); brandSlotDialog(slot, null, again); };
  $m('#bbOk').onclick = () => {
    const f = {angle: $m('#bbAngle').value.trim(), purpose: $m('#bbPurpose').value.trim(), audience: $m('#bbAud').value.trim(), pillarId: $m('#bbPillar').value || sb.pillarId || '',
      hypothesisId: $m('#bbHyp').value || null, refs: [...m.querySelectorAll('[data-bref]:checked')].map(x => x.dataset.bref), title: $m('#bbAngle').value.trim()};
    if(brief){ brandSetFields(brief, f); save(); } else brandNew('brief', f, {forId: slot.id, scope: sb.scope.slice(), anchor: sb.planId ? {kind: 'plan', id: sb.planId} : {kind: 'charter', id: sb.accountId}});
    m.remove(); brandSlotDialog(slot, null, again);
  };
}
