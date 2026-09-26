/* ============================================================
   BRAND STRATEGY — judgment.

   A decision record: the question, the options weighed (each with its
   pros and cons), the choice, why, what would change your mind, a date to
   look again, and — later — what happened. Decisions past that date wait in
   "Due for review" until an outcome is written.

   Hypothesis → plan → slots → review: each can be reached from the others,
   and the review is where a hypothesis is set confirmed, revised or
   abandoned. Reviews have fixed prompts for a week, 30 days and 90 days.
   Metric notes are numbers you type in, with a date.
   ============================================================ */

const BRAND_REVIEW_PROMPTS = {
  week: [['out', 'What went out this week?'], ['landed', 'What landed, and what did not?'], ['learned', 'What did I learn about the audience?'], ['next', 'What will I do differently next week?']],
  '30': [['objective', 'Did the objective happen? What is the evidence?'], ['mix', 'Target against actual pillar mix — why the gap?'], ['hypothesis', 'What did the hypothesis turn out to show?'],
    ['keep', 'Keep, stop, start: one of each.'], ['energy', 'Which posts cost the most, and were they worth it?']],
  '90': [['charter', 'Is the charter still true? What would I change in it?'], ['pillars', 'Which pillar earned its place, and which did not?'], ['surprise', 'What surprised me?'],
    ['voice', 'Did the voice hold, or drift?'], ['next90', 'What are the next ninety days for?']],
};
const BRAND_HYP_STATUS = {open: 'Open', confirmed: 'Confirmed', revised: 'Revised', abandoned: 'Abandoned'};

/* ---------- decisions ---------- */
function brandDecisionsDue(accountId){ const t = today(); return brandOfKind('decision', accountId).filter(d => brandOf(d).reviewOn && brandOf(d).reviewOn <= t && !String(brandOf(d).outcome || '').trim()); }
function brandDecisionDialog(dec, pre, again){
  const st = brandState(), b = dec ? brandOf(dec) : Object.assign({question: '', options: [{text: '', pros: '', cons: ''}, {text: '', pros: '', cons: ''}], choice: '', rationale: '', changeMyMind: '', reviewOn: brandAddDays(today(), 30), outcome: '', scope: [st.prefs.account || 'studio'], anchor: null}, pre || {});
  const opts = b.options.map(o => Object.assign({}, o));
  const m = openModal(`<h2 class="serif">${dec ? 'Decision' : 'A decision'}</h2>
    <label class="brand-f"><span>The question</span><input class="inp" id="bdQ" value="${esc(b.question || '')}"></label>
    <div class="brand-f"><span>Options considered</span><div id="bdOpts"></div><button class="tbtn sm" id="bdAddOpt">＋ Option</button></div>
    <div class="brand-grid2"><label class="brand-f"><span>The choice</span><select class="sel" id="bdChoice"></select></label><label class="brand-f"><span>Look at it again on</span><input class="inp" type="date" id="bdRev" value="${esc(b.reviewOn || '')}"></label></div>
    <label class="brand-f"><span>Why</span><textarea class="inp" rows="2" id="bdWhy">${esc(b.rationale || '')}</textarea></label>
    <label class="brand-f"><span>What would change my mind</span><textarea class="inp" rows="2" id="bdCmm">${esc(b.changeMyMind || '')}</textarea></label>
    ${brandFilingFieldsHTML('decision', b)}
    ${dec ? `<label class="brand-f"><span>Outcome <small>filled in later</small></span><textarea class="inp" rows="2" id="bdOut">${esc(b.outcome || '')}</textarea></label>` : ''}
    <p class="brand-err" id="bdErr"></p>
    <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" id="bdNo">Cancel</button><button class="btn primary" id="bdOk">Keep it</button></div>`);
  const $m = id => m.querySelector(id);
  const paint = () => { $m('#bdOpts').innerHTML = opts.map((o, i) => `<div class="brand-opt" data-bo="${i}"><input class="inp" data-bof="text" value="${esc(o.text)}" placeholder="Option ${i + 1}">
      <div class="brand-grid2 tight"><textarea class="inp" rows="2" data-bof="pros" placeholder="for">${esc(o.pros)}</textarea><textarea class="inp" rows="2" data-bof="cons" placeholder="against">${esc(o.cons)}</textarea></div>
      ${opts.length > 1 ? `<button class="tbtn sm" data-bodel="${i}" aria-label="Remove option">×</button>` : ''}</div>`).join('');
    $m('#bdOpts').querySelectorAll('[data-bof]').forEach(i => i.oninput = () => { opts[+i.closest('[data-bo]').dataset.bo][i.dataset.bof] = i.value; if(i.dataset.bof === 'text') fillChoice(); });
    $m('#bdOpts').querySelectorAll('[data-bodel]').forEach(x => x.onclick = () => { opts.splice(+x.dataset.bodel, 1); paint(); });
    fillChoice(); };
  const fillChoice = () => { const cur = $m('#bdChoice').value || b.choice; $m('#bdChoice').innerHTML = '<option value="">(not decided yet)</option>' + opts.filter(o => o.text.trim()).map(o => `<option${o.text === cur ? ' selected' : ''}>${esc(o.text)}</option>`).join(''); };
  paint(); brandBindFilingFields(m, 'decision', b);
  $m('#bdAddOpt').onclick = () => { opts.push({text: '', pros: '', cons: ''}); paint(); };
  $m('#bdNo').onclick = () => m.remove();
  $m('#bdOk').onclick = () => {
    const q = $m('#bdQ').value.trim(); if(!q){ $m('#bdErr').textContent = 'A decision starts with its question.'; return; }
    const f = {question: q, title: q, options: opts.filter(o => o.text.trim()), choice: $m('#bdChoice').value, rationale: $m('#bdWhy').value.trim(), changeMyMind: $m('#bdCmm').value.trim(), reviewOn: $m('#bdRev').value};
    if(dec) f.outcome = $m('#bdOut').value.trim();
    const filing = brandReadFilingFields(m);
    if(dec){ brandSetFields(dec, f); Object.assign(brandOf(dec), filing); save(); } else brandNew('decision', f, filing);
    m.remove(); again && again();
  };
}

/* ---------- reviews ---------- */
function brandReviewDialog(rev, plan, again){
  const pb = plan ? brandOf(plan) : null, b = rev ? brandOf(rev) : {answers: {}};
  const level = b.level || (pb && pb.level === 'week' ? 'week' : pb && (pb.level === '90' || pb.level === 'season') ? '90' : '30');
  const hyps = pb ? pb.hypothesisIds.map(id => byId(S.entries, id)).filter(Boolean) : [];
  const m = openModal(`<h2 class="serif">${BRAND_LEVELS[level]} review</h2>${plan ? `<p class="faint">${esc(brandLabel(plan))}</p>` : ''}
    ${plan ? brandMixHTML(plan) : ''}
    ${BRAND_REVIEW_PROMPTS[level].map(([k, q]) => `<label class="brand-f"><span>${q}</span><textarea class="inp" rows="3" data-bra="${k}">${esc(b.answers[k] || '')}</textarea></label>`).join('')}
    ${hyps.length ? `<div class="brand-f"><span>The hypotheses this plan tested</span>${hyps.map(h => `<div class="brand-hypset"><span>${esc(brandLabel(h))}</span><select class="sel" data-brh="${h.id}">${Object.entries(BRAND_HYP_STATUS).map(([k, v]) => `<option value="${k}"${brandOf(h).status === k ? ' selected' : ''}>${v}</option>`).join('')}</select></div>`).join('')}</div>` : ''}
    <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" id="brNo">Cancel</button><button class="btn primary" id="brOk">Keep the review</button></div>`);
  m.querySelector('#brNo').onclick = () => m.remove();
  m.querySelector('#brOk').onclick = () => {
    const answers = {}; m.querySelectorAll('[data-bra]').forEach(t => answers[t.dataset.bra] = t.value.trim());
    m.querySelectorAll('[data-brh]').forEach(s => { const h = byId(S.entries, s.dataset.brh); if(h){ const hb = brandOf(h); if(hb.status !== s.value){ hb.status = s.value; hb.statusAt = today(); hb.reviewId = rev ? rev.id : null; } } });
    const title = `${BRAND_LEVELS[level]} review${plan ? ' — ' + brandLabel(plan) : ''}`;
    if(rev){ brandSetFields(rev, {answers, title}); save(); }
    else { const r = brandNew('review', {answers, title}, {level, planId: plan ? plan.id : null, scope: pb ? pb.scope.slice() : [brandState().prefs.account || 'studio'], anchor: plan ? {kind: 'plan', id: plan.id} : null});
      if(pb){ pb.reviewId = r.id; m.querySelectorAll('[data-brh]').forEach(s => { const h = byId(S.entries, s.dataset.brh); if(h) brandOf(h).reviewId = r.id; }); } save(); }
    m.remove(); again && again();
  };
}

/* ---------- metric notes ---------- */
function brandMetricDialog(met, slot, again){
  const b = met ? brandOf(met) : {date: today(), numbers: [{label: 'views', value: ''}, {label: 'saves', value: ''}]};
  const rows = b.numbers.map(n => Object.assign({}, n));
  const m = openModal(`<h2 class="serif">Metric note</h2><p class="faint">Numbers you read off the platform and type in. Nothing is fetched.</p>
    <label class="brand-f"><span>Date</span><input class="inp" type="date" id="bmD" value="${esc(b.date)}"></label><div id="bmRows"></div><button class="tbtn sm" id="bmAdd">＋ Number</button>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:10px"><button class="btn ghost" id="bmNo">Cancel</button><button class="btn primary" id="bmOk">Keep</button></div>`, 'narrow');
  const paint = () => { m.querySelector('#bmRows').innerHTML = rows.map((r, i) => `<div class="brand-grid2 tight" data-bm="${i}"><input class="inp" data-bmf="label" value="${esc(r.label)}" placeholder="what"><input class="inp" data-bmf="value" value="${esc(r.value)}" placeholder="how many"></div>`).join('');
    m.querySelectorAll('[data-bmf]').forEach(i => i.oninput = () => rows[+i.closest('[data-bm]').dataset.bm][i.dataset.bmf] = i.value); };
  paint(); m.querySelector('#bmAdd').onclick = () => { rows.push({label: '', value: ''}); paint(); };
  m.querySelector('#bmNo').onclick = () => { m.remove(); };
  m.querySelector('#bmOk').onclick = () => {
    const numbers = rows.filter(r => r.label.trim() && String(r.value).trim()).map(r => ({label: r.label.trim(), value: String(r.value).trim()}));
    const date = m.querySelector('#bmD').value || today();
    if(met){ Object.assign(b, {numbers, date}); save(); }
    else { const sb = slot ? brandOf(slot) : null;
      const x = brandNew('metric', {title: `Metrics ${date}`}, {date, numbers, slotId: slot ? slot.id : null, scope: sb ? sb.scope.slice() : [brandState().prefs.account || 'studio'], anchor: sb && sb.planId ? {kind: 'plan', id: sb.planId} : sb ? {kind: 'charter', id: sb.accountId} : null});
      if(sb){ sb.metricIds.push(x.id); save(); } }
    m.remove(); again && again();
  };
}

/* ---------- the hypothesis loop, both ways ---------- */
function brandHypothesisHTML(h){
  const b = brandOf(h);
  const plans = brandEntries().filter(e => brandOf(e).kind === 'horizon' && (brandOf(e).hypothesisIds || []).includes(h.id));
  const briefs = brandEntries().filter(e => brandOf(e).kind === 'brief' && brandOf(e).hypothesisId === h.id);
  const slots = briefs.map(x => byId(S.entries, brandOf(x).forId)).filter(Boolean);
  const reviews = plans.map(p => brandOf(p).reviewId && byId(S.entries, brandOf(p).reviewId)).filter(Boolean);
  return `<div class="brand-loop"><span class="brand-hstatus ${b.status}">${BRAND_HYP_STATUS[b.status] || b.status}</span>
    <span>→ ${plans.map(p => `<a href="#/content/brand/plan/${p.id}">${esc(brandLabel(p))}</a>`).join(', ') || '<span class="faint">no plan tests it yet</span>'}</span>
    <span>→ ${slots.length} slot${slots.length === 1 ? '' : 's'}</span>
    <span>→ ${reviews.map(r => `<button class="tbtn sm" data-bopen="${r.id}">${esc(brandLabel(r))}</button>`).join(' ') || '<span class="faint">not reviewed yet</span>'}</span></div>`;
}
