/* ============================================================
   REVIEWING THE WAY YOU WORK

   Three small things, all of them reading what is already recorded.

   THE SYSTEM REVIEW comes round every two to three weeks, and appears in the
   queue on Today when it is due. It asks three questions of the last three
   weeks: what changed (the signals, against the three weeks before), which
   experiments are running and what became of them, and which techniques are
   still in use — each counted from what was actually done, so "I still use
   the card before a sitting" is a number, not a feeling. Each review is
   written once and kept.

   THE WEEKLY STEP, small gains: the week's small improvements that the rules
   can see, offered ticked-off-able; nothing is written for you.

   A RISK WORKSHEET on a decision: what could go wrong, how likely, how bad,
   the early sign, what you would do, the worst you could live with — optional,
   and written before you know.
   ============================================================ */

const SYS_DUE_DAYS = 14, SYS_LATE_DAYS = 21;
function sysState(){
  const s = S.sysReview = S.sysReview && typeof S.sysReview === 'object' ? S.sysReview : {};
  s.last = s.last || ''; s.experiments = Array.isArray(s.experiments) ? s.experiments : []; s.log = Array.isArray(s.log) ? s.log : [];
  s.techniques = s.techniques && typeof s.techniques === 'object' ? s.techniques : {};
  return s;
}
/* due once the last was two weeks ago; a first one waits until there are two weeks of sittings to read */
function sysReviewDue(T = today()){
  const s = sysState();
  if(s.last) { const d = daysBetween(s.last, T); return d >= SYS_DUE_DAYS ? {days: d, late: d >= SYS_LATE_DAYS, first: false} : null; }
  const first = (planState().focusSessions || []).map(r => (r.startedAt || '').slice(0, 10)).filter(Boolean).sort()[0];
  return first && daysBetween(first, T) >= SYS_DUE_DAYS ? {days: daysBetween(first, T), late: false, first: true} : null;
}

/* what was used, counted from the record */
const SYS_TECHNIQUES = [
  {id: 'preflight', name: 'the card before a sitting', used: (from, to) => { const r = timeSittingsIn(from, to); return r.length ? [r.filter(x => x.preflight && (x.preflight.mvg || x.preflight.done)).length, r.length, 'sittings'] : null; }},
  {id: 'margin', name: 'a margin on estimates', used: (from, to) => { const r = timeSittingsIn(from, to).filter(x => x.planned); return r.length ? [r.filter(x => x.margin).length, r.length, 'timed sittings'] : null; }},
  {id: 'breakchips', name: 'naming breaks', used: (from, to) => { const b = timeSittingsIn(from, to).flatMap(x => x.breaks || []).filter(x => x.origin !== 'overrun-split'); return b.length ? [b.filter(x => x.chipId || x.label).length, b.length, 'breaks'] : null; }},
  {id: 'verdicts', name: 'reading a stretch (meant it, partly, drifted)', used: (from, to) => { const e = timeBetween(from, to).filter(x => x.focusSit && x.endTime); return e.length ? [e.filter(x => x.verdict).length, e.length, 'stretches'] : null; }},
  {id: 'blocks', name: 'putting work on the board', used: (from, to) => { const d = timeDaysIn(from, to); return [d.filter(x => (S.timeBlocks || []).some(b => b.date === x)).length, d.length, 'days']; }},
  {id: 'topTwo', name: 'choosing a top two', used: (from, to) => { const d = timeDaysIn(from, to); return [d.filter(x => (S.plans || {})[x] && pbdTopTwoTasks(S.plans[x]).length).length, d.length, 'days']; }},
  {id: 'intentions', name: 'time intentions', used: () => [timeIntentionsActive().length, TIME_INTENT_MAX, 'on']},
  {id: 'closeout', name: 'the note when a sitting closes', used: (from, to) => { const r = timeSittingsIn(from, to); return r.length ? [r.filter(x => x.closeout && (x.closeout.pickUpHere || x.closeout.focusQuality)).length, r.length, 'sittings'] : null; }}];

/* what changed: the last three weeks against the three before, in words */
function sysChanges(T = today()){
  const a = {from: addDays(T, -20), to: T}, b = {from: addDays(T, -41), to: addDays(T, -21)}, out = [];
  const qa = timeFocusQuality(a.from, a.to), qb = timeFocusQuality(b.from, b.to);
  const cmp = (name, x, y, fmt, lowerBetter, min) => { if(!x || !y) return; const d = x.value - y.value; if(Math.abs(d) < min) return;
    out.push(`${name}: ${fmt(x.value)} now, ${fmt(y.value)} in the three weeks before — ${(d < 0) === lowerBetter ? 'better' : 'worse'}.`); };
  cmp('Time to begin', qa.delay, qb.delay, v => Math.round(v) + 'm', true, 2);
  cmp('Breaks over their length', qa.overrun, qb.overrun, v => Math.round(v * 100) + '%', true, 0.1);
  cmp('Distractions an hour', qa.distract, qb.distract, v => v.toFixed(1), true, 0.3);
  if(qa.estimate && qb.estimate && Math.abs(qa.estimate.within - qb.estimate.within) >= 0.1) out.push(`Estimates that held: ${Math.round(qa.estimate.within * 100)}% now, ${Math.round(qb.estimate.within * 100)}% before — ${qa.estimate.within > qb.estimate.within ? 'better' : 'worse'}.`);
  const ma = timeMetrics(a.from, a.to), mb = timeMetrics(b.from, b.to);
  if(ma.investShare != null && mb.investShare != null && Math.abs(ma.investShare - mb.investShare) >= 0.05) out.push(`The share of time in what you build: ${Math.round(ma.investShare * 100)}% now, ${Math.round(mb.investShare * 100)}% before.`);
  if(ma.awake && mb.awake){ const ua = ma.untracked / ma.awake, ub = mb.untracked / mb.awake; if(Math.abs(ua - ub) >= 0.07) out.push(`The waking hours not tracked: ${Math.round(ua * 100)}% now, ${Math.round(ub * 100)}% before.`); }
  const wins = (S.wins || []).filter(w => w.kind === 'process' && w.date >= a.from && w.date <= a.to).length;
  if(wins) out.push(`${wins} win${wins === 1 ? '' : 's'} about how you work ${wins === 1 ? 'was' : 'were'} written in this time.`);
  return out;
}

function openSystemReview(){
  const s = sysState(), T = today(), a = addDays(T, -20);
  const changes = sysChanges(T), keep = {}, draft = {note: '', next: ''};
  const techRows = SYS_TECHNIQUES.map(t => { let u = null; try { u = t.used(a, T); } catch(e){} return {t, u, was: s.techniques[t.id]}; });
  guidedFlow('System review', [
    {title: 'What changed.', hint: 'The last three weeks against the three before, on the signals that can be read.',
     body: () => changes.length ? `<div class="stack" style="gap:6px">${changes.map(l => `<div class="rev-summary">${esc(l)}</div>`).join('')}</div>`
       : '<div class="rev-summary">Nothing moved far enough to say, or there is not yet enough behind it. That is also a finding.</div>'},
    {title: 'The experiments you are running.', hint: 'Each is something tried on purpose. Say what became of it, or let it run.',
     body: () => { const run = s.experiments.filter(x => !x.ended);
       return `<div class="stack" style="gap:8px" id="sysEx">${run.map(x => `<div class="card" style="padding:8px 12px"><div class="row between"><span>${esc(x.text)} <span class="mono faint">since ${esc(fmtDate(x.startedAt, 'short'))}</span></span>
         <select class="sel sm" data-sx="${esc(x.id)}"><option value="">still running</option><option value="kept">keep it</option><option value="dropped">drop it</option><option value="didnt">did not work</option></select></div></div>`).join('') || '<div class="faint">None running.</div>'}
         <div class="field"><label>One to begin</label><input class="inp" id="sysNew" placeholder="Phone in the other room for the first sitting of the day"></div></div>`; },
     next: b => { b.querySelectorAll('[data-sx]').forEach(sel => { const x = s.experiments.find(e => e.id === sel.dataset.sx); if(x && sel.value){ x.ended = T; x.result = sel.value; } });
       const t = (b.querySelector('#sysNew').value || '').trim(); if(t) s.experiments.push({id: uid(), text: t, startedAt: T, ended: null, result: ''}); saveNow(); }},
    {title: 'The techniques still in use.', hint: 'Counted from the last three weeks. Untick what you have let go of; it is not asked about again until you turn it back on.',
     body: () => `<div class="stack" style="gap:6px">${techRows.map(r => `<label class="row" style="gap:8px;align-items:baseline"><input type="checkbox" data-sxt="${esc(r.t.id)}" ${r.was === false ? '' : 'checked'}>
       <span>${esc(r.t.name)} <span class="mono faint">${r.u ? `${r.u[0]} of ${r.u[1]} ${esc(r.u[2])}` : 'nothing to count yet'}</span></span></label>`).join('')}</div>`,
     next: b => { b.querySelectorAll('[data-sxt]').forEach(c => { s.techniques[c.dataset.sxt] = c.checked; }); saveNow(); }},
    {title: 'What you make of it.', hint: 'One line, kept with the review.',
     body: () => `<textarea class="ta" id="sysNote" placeholder="What to keep, what to change, what to try"></textarea>`,
     next: b => { draft.note = (b.querySelector('#sysNote').value || '').trim(); }},
  ], () => {
    s.last = T;
    s.log.push({id: uid(), date: T, changed: changes, experiments: s.experiments.map(x => ({text: x.text, startedAt: x.startedAt, ended: x.ended, result: x.result})),
      techniques: techRows.map(r => ({id: r.t.id, used: r.u ? `${r.u[0]} of ${r.u[1]} ${r.u[2]}` : '', kept: s.techniques[r.t.id] !== false})), note: draft.note});
    saveNow(); toast('System reviewed.'); if(typeof pqRepaint === 'function') pqRepaint();
  }, {flow: 'system'});
}

/* ---------- small gains, for the weekly review ---------- */
function marginalGains(from, to){
  const d = daysBetween(from, to) + 1, pf = addDays(from, -d), pt = addDays(from, -1), out = [];
  const a = timeFocusQuality(from, to), b = timeFocusQuality(pf, pt), ma = timeMetrics(from, to), mb = timeMetrics(pf, pt);
  const add = (id, text, rule) => out.push({id, text, rule});
  if(a.delay && b.delay && b.delay.value - a.delay.value >= 2) add('delay', `You began ${Math.round(b.delay.value - a.delay.value)} minutes sooner after a block’s time.`, `${Math.round(a.delay.value)}m this week, ${Math.round(b.delay.value)}m the week before`);
  if(a.overrun && b.overrun && b.overrun.value - a.overrun.value >= 0.1) add('overrun', 'Fewer breaks ran over.', `${Math.round(a.overrun.value * 100)}% of ${a.overrun.n} this week, ${Math.round(b.overrun.value * 100)}% the week before`);
  if(a.restful && b.restful && a.restful.value - b.restful.value >= 0.15) add('restful', 'More of your breaks were restful.', `${Math.round(a.restful.value * 100)}% against ${Math.round(b.restful.value * 100)}%`);
  if(a.distract && b.distract && b.distract.value > 0 && a.distract.value <= b.distract.value * 0.75) add('distract', 'Attention was pulled away less often.', `${a.distract.value.toFixed(1)} an hour against ${b.distract.value.toFixed(1)}`);
  if(a.estimate && b.estimate && a.estimate.within - b.estimate.within >= 0.1) add('estimate', 'More of your estimates held.', `${Math.round(a.estimate.within * 100)}% of ${a.estimate.n} tasks against ${Math.round(b.estimate.within * 100)}%`);
  if(ma.meantShare != null && mb.meantShare != null && ma.meantShare - mb.meantShare >= 0.1) add('meant', 'More of what you read was as you meant it.', `${Math.round(ma.meantShare * 100)}% against ${Math.round(mb.meantShare * 100)}%`);
  if(ma.awake && mb.awake && mb.untracked / mb.awake - ma.untracked / ma.awake >= 0.07) add('untracked', 'Less of the waking time went unaccounted for.', `${Math.round(ma.untracked / ma.awake * 100)}% against ${Math.round(mb.untracked / mb.awake * 100)}%`);
  if(ma.investShare != null && mb.investShare != null && ma.investShare - mb.investShare >= 0.05) add('invest', 'More of the time went to what you build.', `${Math.round(ma.investShare * 100)}% against ${Math.round(mb.investShare * 100)}%`);
  const t2a = perfSignal('topTwo', from, to), t2b = perfSignal('topTwo', pf, pt);
  if(t2a && t2b && t2a.value - t2b.value >= 15) add('topTwo', 'The top two got done more often.', `${Math.round(t2a.value)}% of days against ${Math.round(t2b.value)}%`);
  return out;
}
function marginalStepHTML(from, to){
  const key = weekStart(from), saved = ((S.reviews.marginal || {})[key]) || {noticed: [], note: ''}, gains = marginalGains(from, to);
  return `<div class="stack" style="gap:8px">${gains.length ? gains.map(g => `<label class="row" style="gap:8px;align-items:baseline"><input type="checkbox" data-mg="${esc(g.id)}" ${saved.noticed.includes(g.id) ? 'checked' : ''}>
      <span>${esc(g.text)} <span class="mono faint">${esc(g.rule)}</span></span></label>`).join('')
      : '<div class="rev-summary">No small gain stood out on the numbers this week. If you noticed one the numbers cannot see, write it below.</div>'}
    <div class="field"><label>One more you noticed</label><input class="inp" id="mgNote" value="${esc(saved.note || '')}" placeholder="Something small that went a little better"></div></div>`;
}
function marginalStepSave(b, from){
  S.reviews.marginal = S.reviews.marginal || {};
  S.reviews.marginal[weekStart(from)] = {noticed: [...b.querySelectorAll('[data-mg]:checked')].map(x => x.dataset.mg), note: (b.querySelector('#mgNote').value || '').trim()};
  saveNow();
}

/* ---------- a risk worksheet on a decision ---------- */
const DECISION_RISK_FIELDS = [['wrong', 'What could go wrong', ''], ['likely', 'How likely', 'select:unlikely,possible,likely'], ['bad', 'How bad it would be', 'select:a nuisance,a setback,serious,hard to undo'],
  ['sign', 'The early sign that it is going wrong', ''], ['then', 'What I would do then', ''], ['worst', 'The worst I could live with', '']];
function decisionRiskHTML(){
  return `<details class="dec-risk"><summary class="sc" style="cursor:pointer">A risk worksheet (optional)</summary>
    <div class="faint" style="font-size:.78rem;margin:4px 0 8px">Written now, before you know. It shows with the decision when you come back to it.</div>
    ${DECISION_RISK_FIELDS.map(([k, l, t]) => `<div class="field"><label>${l}</label>${t.startsWith('select:') ? `<select class="sel" data-dr="${k}"><option value=""></option>${t.slice(7).split(',').map(o => `<option>${o}</option>`).join('')}</select>` : `<textarea class="ta" data-dr="${k}" style="min-height:52px"></textarea>`}</div>`).join('')}</details>`;
}
function decisionRiskRead(m){
  const risk = {}; m.querySelectorAll('[data-dr]').forEach(t => { if(t.value.trim()) risk[t.dataset.dr] = t.value.trim(); });
  return Object.keys(risk).length ? risk : null;
}
function decisionRiskShow(x){
  if(!x || !x.risk) return '';
  return `<div class="dec-then"><div class="sc">The risks, as you saw them</div>${DECISION_RISK_FIELDS.filter(([k]) => x.risk[k]).map(([k, l]) => `<div class="dec-field"><div class="k">${l}</div><div class="prose">${esc(x.risk[k])}</div></div>`).join('')}</div>`;
}
