/* ============================================================
   THE RETREAT SYSTEM (#/retreat)

   A review reads a period back. A retreat changes the instrument. The weekly
   review is fifteen minutes and is correctly timed; what it is not is long
   enough to edit the sheet, refine a value, release something, or clear a
   desk. Five retreats — weekly, monthly, seasonal, annual, nature — each a
   guided flow, each writing a record of which steps were done, each handing
   off to the review of the same period instead of repeating it.

   A retreat is never overdue. It is raised only when its period had substance
   (the review flows' own test), nothing calls it behind, a partial retreat is
   the normal case, and every step can be left and resumed.
   ============================================================ */

NAV_ICONS.retreat = '<svg viewBox="0 0 24 24"><path d="M3 20l6.5-11 4 6.2 2.3-3.2L21 20z"/><circle cx="17.5" cy="6.5" r="2"/></svg>';
NAV_PAGES.retreat = {label: 'Retreat', short: 'Retreat', ico: NAV_ICONS.retreat, route: '#/retreat'};
if(NAV_DEFAULT.identity && !NAV_DEFAULT.identity.includes('retreat')) NAV_DEFAULT.identity.splice(Math.min(2, NAV_DEFAULT.identity.length), 0, 'retreat');

const retreatsAll = () => lifeArray('retreats');

/* ---------- periods ---------- */
const RT_KINDS = {
  weekly: {name: 'Weekly retreat', cadence: 'Sunday', minutes: '45–60 minutes', pairs: 'the weekly review', flow: 'flowWeekly',
    lede: 'Process the zone, refine one thing, clear some space, release one thing. Then the weekly review keeps its own fifteen minutes.'},
  monthly: {name: 'Monthly retreat', cadence: 'month end', minutes: '30–45 minutes', pairs: 'the monthly review', flow: 'flowMonthly',
    lede: 'Reread the sheet, revise the value draft, consult the convergence report, read the bets, and ask what the month cost.'},
  seasonal: {name: 'Seasonal retreat', cadence: 'quarterly', minutes: 'half a day', pairs: 'the quarterly review', flow: 'flowSeasonal',
    lede: 'Refresh the values, restart the thirty days, release, retake the strengths reading, revisit the fears.'},
  annual: {name: 'Annual retreat', cadence: 'year end, long', minutes: 'a day, and a plan for ten', pairs: 'the annual rite', flow: 'flowAnnual',
    lede: 'Rewrite the statement from scratch and keep both; a new goal list from scratch; the book you reread; the authenticity question; a plan for solitude.'},
  nature: {name: 'Nature retreat', cadence: 'fortnightly', minutes: 'as long as you like', pairs: null, flow: null,
    lede: 'No steps during. One line before, one question after: what arrived out there.'},
};
function retreatPeriod(kind, T = today()){
  const d = parseDay(T), y = d.getFullYear();
  if(kind === 'weekly'){ const dow = (d.getDay() + 6) % 7, from = addDays(T, -dow); return {key: isoWeek(T), from, to: addDays(from, 6)}; }
  if(kind === 'monthly'){ const m = pad(d.getMonth() + 1); return {key: y + '-' + m, from: y + '-' + m + '-01', to: addDays(new Date(y, d.getMonth() + 1, 1).toISOString().slice(0, 10), -1)}; }
  if(kind === 'seasonal'){ const q = Math.floor(d.getMonth() / 3), sm = pad(q * 3 + 1); return {key: y + '-Q' + (q + 1), from: y + '-' + sm + '-01', to: addDays(new Date(y, q * 3 + 3, 1).toISOString().slice(0, 10), -1)}; }
  if(kind === 'annual') return {key: String(y), from: y + '-01-01', to: y + '-12-31'};
  const dow = (d.getDay() + 6) % 7, from = addDays(T, -dow - (parseInt(isoWeek(T).slice(-2), 10) % 2 ? 0 : 7)); return {key: 'F' + isoWeek(from), from, to: addDays(from, 13)};
}
function retreatRec(kind, T = today(), create = false){
  const per = retreatPeriod(kind, T);
  let r = retreatsAll().find(x => x.kind === kind && x.periodKey === per.key);
  if(!r && create){ r = {id: uid(), kind, periodKey: per.key, startedAt: new Date().toISOString(), finishedAt: null, steps: {}, decluttered: '', releaseValueId: '', nextWeekReleases: '', at: new Date().toISOString()}; retreatsAll().push(r); }
  return r || null;
}
const retreatStepGet = (kind, stepId, T) => { const r = retreatRec(kind, T); return r && r.steps[stepId] ? r.steps[stepId] : null; };
function retreatStepSet(kind, stepId, data, T){
  const r = retreatRec(kind, T, true);
  r.steps[stepId] = Object.assign({doneAt: new Date().toISOString(), answer: '', entryId: null}, r.steps[stepId] || {}, data);
  saveNow(); return r;
}
const retreatDoneCount = (kind, r) => r ? Object.keys(r.steps).filter(k => r.steps[k].doneAt).length : 0;

/* the substance test is the review flows' own, verbatim */
function retreatHasSubstance(kind, T = today()){
  const p = retreatPeriod(kind, T);
  return typeof periodHasSubstance === 'function' ? periodHasSubstance(p.from, p.to < T ? p.to : T) : true;
}
/* when each is raised: the review's own timing, and never for an empty period */
function retreatRaised(kind, T = today()){
  const dow = parseDay(T).getDay(), d = parseDay(T);
  const timely = kind === 'weekly' ? dow === 0
    : kind === 'monthly' ? daysBetween(T, addDays(new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().slice(0, 10), -1)) <= 3
    : kind === 'seasonal' ? (() => { const end = retreatPeriod('seasonal', T).to; return daysBetween(T, end) <= 7; })()
    : kind === 'annual' ? daysBetween(T, d.getFullYear() + '-12-31') <= 13 : false;
  if(!timely) return false;
  const r = retreatRec(kind, T);
  if(r && r.finishedAt) return false;
  return retreatHasSubstance(kind, T);
}
['weekly', 'monthly', 'seasonal', 'annual'].forEach(kind => {
  if(typeof registerDuty !== 'function') return;
  const k = RT_KINDS[kind];
  registerDuty({id: 'retreat_' + kind, label: k.name, anchor: '[data-duty-id="retreat_' + kind + '"]', route: '#/retreat',
    windowDef: {type: 'anytime'}, recurrence: {type: 'event-driven', check: T => retreatRaised(kind, T)},
    skipDone: true, notify: false, defaultOn: true, doneCheck: T => { const r = retreatRec(kind, T); return !!(r && r.finishedAt); },
    rule: `${k.cadence}, and only if the period had anything in it`});
});

/* ---------- small pieces the steps share ---------- */
const rtWords = (id, label, ph, rows = 4) => `<textarea class="ta" id="${id}" rows="${rows}" placeholder="${esc(ph || '')}"></textarea>`;
/* write the words as an entry, once, and remember it on the step */
function rtEntry(kind, stepId, title, text, tag){
  text = String(text || '').trim(); if(!text) return null;
  const prev = retreatStepGet(kind, stepId);
  if(prev && prev.entryId && byId(S.entries, prev.entryId)){ const e = byId(S.entries, prev.entryId); e.body = text; return e.id; }
  return lifeEntryNew({type: 'reflection', title, body: text, tags: ['retreat', tag || kind], extra: {source: 'retreat', retreat: kind + ':' + stepId}}).id;
}
function rtGoButton(label, hash){ return `<button class="btn sm" data-rtgo="${esc(hash)}">${esc(label)}</button>`; }
function releaseValueSuggestion(){
  const g = typeof valueGaps === 'function' && (S.valueOrder || []).length && latestSnapshot() ? valueGaps().filter(x => x.gap > 0)[0] : null;
  return g || null;
}

/* ---------- the steps ---------- */
function retreatSteps(kind, rec, st){
  const A = st.act;           // mark that something was actually done in this step
  const mk = (id, title, hint, body, o = {}) => ({id, title, hint, body, bind: o.bind, next: o.next});
  const wordsStep = (id, title, hint, ph, entryTitle, rows) => mk(id, title, hint,
    () => { const prev = retreatStepGet(kind, id); return rtWords('rtW_' + id, '', ph, rows).replace('></textarea>', '>' + esc(prev ? prev.answer : '') + '</textarea>'); },
    {next: b => { const t = (b.querySelector('#rtW_' + id) || {value: ''}).value.trim(); if(t){ const eid = rtEntry(kind, id, entryTitle, t); retreatStepSet(kind, id, {answer: t, entryId: eid}); } }});
  const dedupNote = id => { const k = retreatStepGet(kind, id); return k && k.doneAt ? `<p class="faint mono">done ${esc(fmtDate(k.doneAt.slice(0, 10), 'short'))}</p>` : ''; };
  const goBind = (id) => (b) => b.querySelectorAll('[data-rtgo]').forEach(x => x.onclick = () => { retreatStepSet(kind, id, {answer: 'opened'}); document.querySelectorAll('.modal-back,.modal').forEach(n => n.remove()); navigate(x.dataset.rtgo); });

  if(kind === 'weekly'){
    const releaseStep = mk('release', 'One release.', 'The value is suggested by the widest gap between how high it is ranked and how it is being lived — you choose.',
      () => { const sug = releaseValueSuggestion(), vals = (S.valueOrder || []).map(id => byId(S.values, id)).filter(Boolean), negs = typeof negValues === 'function' ? negValues() : [];
        return `${sug ? `<p class="faint">Suggested: <b>${esc(sug.name)}</b> — ranked #${sug.rank} but lived at ${sug.congruence}%, a gap of ${Math.round(sug.gap)} points. The rule: the widest positive gap between stated priority and lived congruence.</p>` : '<p class="faint">There is no values snapshot yet to suggest from; choose any.</p>'}
          <div class="field"><label>The value</label><select class="sel" id="rtVal"><option value="">—</option>${vals.map(v => `<option value="${v.id}"${(rec.releaseValueId || (sug && sug.id)) === v.id ? ' selected' : ''}>${esc(v.name)}</option>`).join('')}</select></div>
          <div class="field"><label>What is working against it</label><input class="inp" id="rtNeg" list="rtNegL" placeholder="a negative value — what you do that does not serve it"><datalist id="rtNegL">${negs.map(n => `<option value="${esc(n.name)}">`).join('')}</datalist></div>
          <div class="row"><button class="btn primary" id="rtRel">Begin the release</button></div>`; },
      {bind: b => { b.querySelector('#rtRel').onclick = () => {
          const name = b.querySelector('#rtNeg').value.trim(); if(!name){ toast('Name what is working against it first.'); return; }
          rec.releaseValueId = b.querySelector('#rtVal').value; let n = negValues().find(x => x.name.toLowerCase() === name.toLowerCase()) || negValueNew(name);
          const before = (n.releases || []).length; negValueRelease(n.id); A('release'); st.watch = () => (n.releases || []).length > before; }; }});
    return [
      mk('zone', 'Process the contemplation zone.', 'The thinking that was set aside this week, one item at a time: promote, keep, or let go. Nothing is deleted.',
        () => { const n = zoneItems().length; return n ? `<p>${n} item${n === 1 ? '' : 's'} waiting, oldest first.</p><div class="row"><button class="btn primary" id="rtZone">Process them</button></div>` : '<p class="faint">The zone is empty. That is a fine thing to find.</p>'; },
        {bind: b => { const z = b.querySelector('#rtZone'); if(z) z.onclick = () => { zoneProcess({onDone: () => A('zone')}); }; }, next: b => { if(!zoneItems().length) A('zone'); }}),
      mk('refine', 'Refine one thing.', 'The sheet, a value definition, a strength gloss, or a vision. The versioning remembers what it said.',
        () => `<div class="row" style="gap:8px;flex-wrap:wrap">${rtGoButton('the sheet', '#/purpose')}${rtGoButton('a value', '#/values')}${rtGoButton('a strength', '#/purpose/strengths')}${rtGoButton('a vision', '#/purpose/vision')}</div><p class="faint" style="font-size:.8rem">Opening one leaves this retreat where it is; come back through #/retreat to resume.</p>`,
        {bind: goBind('refine')}),
      wordsStep('declutter', 'Make some space.', 'One field for what you removed — physical, digital, or a commitment. The point is space.', 'What went, or was let go…', 'Space made', 3),
      releaseStep,
      mk('next', 'What is next week for releasing?', 'Name it, and the week can be spent remaking that part of life.', () => rtWords('rtW_next', '', 'Next week is for releasing…', 3).replace('></textarea>', '>' + esc(rec.nextWeekReleases || '') + '</textarea>'),
        {next: b => { const t = b.querySelector('#rtW_next').value.trim(); if(t){ rec.nextWeekReleases = t; const eid = rtEntry(kind, 'next', 'Next week is for releasing', t); retreatStepSet(kind, 'next', {answer: t, entryId: eid}); } }}),
    ];
  }
  if(kind === 'monthly'){
    return [
      mk('sheet', 'Reread the sheet aloud.', 'Out loud, slowly.', () => `<div class="pp-sheet">${PURPOSE_KEYS.map(k => purposeHas(k) ? `<p class="serif"><span class="mono faint">${esc(PURPOSE_FIELDS[k].label)}</span><br>${esc(purposeText(k))}</p>` : '').join('') || '<p class="faint">The sheet is empty.</p>'}</div>
        <div class="row"><button class="btn primary" id="rtRead">I read it aloud</button></div>`,
        {bind: b => { const r = b.querySelector('#rtRead'); if(r) r.onclick = () => { purposeContact('purposereview'); A('sheet'); r.disabled = true; r.textContent = 'read'; }; }}),
      wordsStep('values', 'The value draft.', 'Anything new about yourself, any refinement to the congruence figures. The top ten, as they stand.', 'What has shifted…', 'Value draft, revised', 4),
      mk('converge', 'The convergence report — consulted, not acted on.', 'What keeps coming up.',
        () => { const o = typeof convergeRetreatOffer === 'function' ? convergeRetreatOffer() : null; return o ? `<p>${esc(o.note)}</p>${(o.top || []).map(p => `<p class="serif">“${esc(p)}”</p>`).join('')}<div class="row">${rtGoButton('open the report', o.go)}</div>` : '<p class="faint">The report needs about thirty qualifying entries; there are not enough yet.</p>'; },
        {bind: goBind('converge')}),
      mk('bets', 'The small bets and their reads.', 'What you made, how it felt, your read. Skipping is fine.',
        () => (typeof betWeekStep === 'function' && betWeekStep().length ? betWeekStep()[0].body() : '<p class="faint">No bets are open.</p>'),
        {bind: b => { if(typeof betWeekStep === 'function' && betWeekStep().length && betWeekStep()[0].bind) betWeekStep()[0].bind(b); }, next: () => A('bets')}),
      wordsStep('cost', 'What did this month cost you that you did not notice?', 'One question.', '…', 'What the month cost', 4),
      mk('lens', 'The lenses.', 'The needs, the alignment readings and the Spiral — consulted, not chased. Nothing here is added up.', () => `<div class="row">${rtGoButton('open the Review', '#/journals/review')}</div>`, {bind: goBind('lens')}),
    ];
  }
  if(kind === 'seasonal'){
    const relStep = retreatSteps('weekly', rec, st).find(s => s.id === 'release');
    return [
      mk('values', 'Refresh the value list.', 'Through the construction passes; it may reorder or replace. The old order is kept.',
        () => `<div class="row"><button class="btn primary" id="rtBuild">Open the construction passes</button></div>${dedupNote('values')}`,
        {bind: b => { b.querySelector('#rtBuild').onclick = () => { valuesBuilder(); A('values'); retreatStepSet(kind, 'values', {answer: 'refreshed'}); }; }}),
      mk('imprint', 'Restart the thirty days.', 'A season is a new thirty-day imprint, by design — recorded as a seasonal reset, not a miss.',
        () => `<p class="faint">${esc(imprintLine('values'))}</p><div class="row"><button class="btn primary" id="rtImp">Begin the thirty days again</button></div>`,
        {bind: b => { b.querySelector('#rtImp').onclick = () => { valuesImprintSeasonal(); A('imprint'); b.querySelector('#rtImp').disabled = true; toast('A new thirty days, as a seasonal reset.'); }; }}),
      Object.assign({}, relStep, {id: 'release', title: 'Redo the release on one value.'}),
      mk('strengths', 'Retake the strengths reading, and run one shadow worksheet.', 'How much of your life and work expresses each, this season.',
        () => `<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn primary" id="rtStr"${strengthsAll().length ? '' : ' disabled'}>Retake the reading</button>
          <button class="btn" id="rtShadow"${typeof shadowWorksheet === 'function' && strengthsAll().length ? '' : ' disabled'}>A shadow worksheet</button></div>${strengthsAll().length ? '' : '<p class="faint">No strengths are listed yet.</p>'}`,
        {bind: b => { const a = b.querySelector('#rtStr'), c = b.querySelector('#rtShadow'); if(a) a.onclick = () => strengthsReading(() => A('strengths')); if(c) c.onclick = () => { shadowWorksheet(); A('strengths'); }; }}),
      mk('fears', 'Revisit the fears.', 'Reclassify if any have changed: a fear about safety, or a compass bearing.',
        () => { const fs = beliefsAll('fear'); return fs.length ? fs.map(f => `<div class="row between" style="gap:8px;padding:4px 0"><span class="serif">${esc(f.text)}</span>
          <select class="sel" data-rtfear="${f.id}" style="max-width:11em"><option value="">not sorted</option><option value="safety"${f.fearType === 'safety' ? ' selected' : ''}>about safety</option><option value="grand"${f.fearType === 'grand' ? ' selected' : ''}>a compass bearing</option></select></div>`).join('') : '<p class="faint">No fears are written down.</p>'; },
        {bind: b => b.querySelectorAll('[data-rtfear]').forEach(s => s.onchange = () => { const f = byId(S.beliefs, s.dataset.rtfear); if(f){ f.fearType = s.value || null; saveNow(); A('fears'); } }), next: () => { if(!beliefsAll('fear').length) A('fears'); }}),
      mk('grasp', 'The intentions you set from need.', 'Are these still the ones, and are you still holding them that way?',
        () => (typeof graspingListHTML === 'function' ? graspingListHTML() : '<p class="faint">Nothing is held that way.</p>'), {next: () => A('grasp')}),
      mk('away', 'Three days away, if the cadence is due.', 'The course’s cadence is a three-day break every ninety days. This only says whether it is due.',
        () => { const due = typeof breakDue === 'function' && breakDue('three-day'), last = typeof breakLast === 'function' ? breakLast('three-day') : null;
          return `<p>${due ? (last ? `The last was ${esc(fmtDate(last.startAt, 'med'))}.` : 'None has been recorded.') : `Not due — the last was ${last ? esc(fmtDate(last.startAt, 'med')) : 'recently'}.`}</p>${due ? '<div class="row"><button class="btn" id="rtAway">Record one (past or planned)</button></div>' : ''}`; },
        {bind: b => { const a = b.querySelector('#rtAway'); if(a) a.onclick = () => { museBreakDialog('three-day'); A('away'); }; }, next: () => { if(typeof breakDue === 'function' && !breakDue('three-day')) A('away'); }}),
      mk('converge', 'The convergence report.', 'Consulted, not acted on.', () => { const o = typeof convergeRetreatOffer === 'function' ? convergeRetreatOffer() : null; return o ? `<p>${esc(o.note)}</p><div class="row">${rtGoButton('open the report', o.go)}</div>` : '<p class="faint">There is not yet enough written for it to read.</p>'; }, {bind: goBind('converge')}),
      mk('lens', 'The lenses.', 'The needs, the alignment readings and the Spiral.', () => `<div class="row">${rtGoButton('open the Review', '#/journals/review')}</div>`, {bind: goBind('lens')}),
    ];
  }
  if(kind === 'annual'){
    return [
      mk('purpose', 'Rewrite the statement from scratch.', 'Without looking at the old one. Both are kept; the old one is shown after.',
        () => { const cur = purposeText('statement'); return `<textarea class="ta serif-lg" id="rtP" rows="3" placeholder="Under fifteen words. What is the work of your life?"></textarea>${cur ? `<details style="margin-top:8px"><summary class="mono faint">the current wording (open after you have written)</summary><p class="serif">${esc(cur)}</p></details>` : ''}`; },
        {next: b => { const t = b.querySelector('#rtP').value.trim(); if(t){ purposeSave('statement', t, {force: true}); retreatStepSet(kind, 'purpose', {answer: t}); A('purpose'); } }}),
      mk('goals', 'A goal list, from scratch.', 'Written fresh each year, not carried over. One per line.',
        () => rtWords('rtG', '', 'One goal per line…', 8), {next: b => { const t = b.querySelector('#rtG').value.trim(); if(t){ const f = funnelState(); f.year = new Date().getFullYear() + 1; f.stage = 'brainstorm';
          t.split(/\n+/).map(x => x.trim()).filter(Boolean).forEach(x => f.items.push({id: uid(), text: x})); const eid = rtEntry(kind, 'goals', 'The goal list, written fresh', t); retreatStepSet(kind, 'goals', {answer: t, entryId: eid}); A('goals'); } }}),
      mk('strengths', 'Retake the strengths assessment.', 'The survey, afresh; then the expression reading.',
        () => `<div class="row" style="gap:8px"><button class="btn" id="rtStr">The expression reading</button>${rtGoButton('the strengths list', '#/purpose/strengths')}</div>`,
        {bind: b => { goBind('strengths')(b); const s = b.querySelector('#rtStr'); if(s) s.onclick = () => strengthsReading(() => A('strengths')); }}),
      mk('reread', 'Reread the one book you reread.', 'Yours to name — it is a field, not a title.',
        () => { const p = purposeState(); return `<div class="field"><label>The book</label><input class="inp" id="rtBook" value="${esc(p.rereadBook || '')}" placeholder="the one you return to"></div><label class="row" style="gap:6px;align-items:center"><input type="checkbox" id="rtReread"> <span>I reread it, or have set the time</span></label>`; },
        {next: b => { const p = purposeState(); p.rereadBook = b.querySelector('#rtBook').value.trim(); if(b.querySelector('#rtReread').checked){ retreatStepSet(kind, 'reread', {answer: p.rereadBook}); A('reread'); } saveNow(); }}),
      mk('authenticity', 'The authenticity question.', null, () => (typeof authenticityBodyHTML === 'function' ? authenticityBodyHTML(kind) : '<p class="faint">…</p>'),
        {next: b => { if(typeof authenticitySave === 'function' && authenticitySave(b)) A('authenticity'); }}),
      mk('solitude', 'The solitude plan.', 'The system cannot take the retreat for you. Where, and when.',
        () => { const prev = retreatStepGet(kind, 'solitude') || {}; return `<div class="field"><label>The plan</label><textarea class="ta" id="rtSolP" rows="3" placeholder="where, how long, what for, what you are leaving behind">${esc(prev.plan || '')}</textarea></div>
          <div class="field"><label>The date it begins</label><input type="date" class="inp" id="rtSolD" value="${esc(prev.date || '')}"></div>`; },
        {next: b => { const plan = b.querySelector('#rtSolP').value.trim(), date = b.querySelector('#rtSolD').value; if(plan || date){ retreatStepSet(kind, 'solitude', {answer: plan, plan, date}); A('solitude'); } }}),
      mk('converge', 'The convergence report.', 'Consulted, not acted on.', () => { const o = typeof convergeRetreatOffer === 'function' ? convergeRetreatOffer() : null; return o ? `<p>${esc(o.note)}</p><div class="row">${rtGoButton('open the report', o.go)}</div>` : '<p class="faint">There is not yet enough written for it to read.</p>'; }, {bind: goBind('converge')}),
    ];
  }
  return [];
}

/* ---------- running one ---------- */
function retreatRun(kind, T = today()){
  if(kind === 'nature'){ natureGo(); return; }
  const rec = retreatRec(kind, T, true), k = RT_KINDS[kind];
  const st = {act: id => { const cur = rec.steps[id] || {}; rec.steps[id] = Object.assign({doneAt: new Date().toISOString(), answer: '', entryId: null}, cur, {doneAt: cur.doneAt || new Date().toISOString()}); saveNow(); }};
  const steps = retreatSteps(kind, rec, st);
  const firstUndone = Math.max(0, steps.findIndex(s => !(rec.steps[s.id] && rec.steps[s.id].doneAt)));
  /* a step that watches for a long action finishing (a release) is checked when the person moves on */
  const wrapped = steps.map(s => Object.assign({}, s, {next: b => { if(st.watch && st.watch()){ st.act(s.id); st.watch = null; } return s.next ? s.next(b) : undefined; }, bind: (b, m) => {
    if(s.bind) s.bind(b, m);
    if(!b.querySelector('.rt-skip') && rec.steps[s.id] && rec.steps[s.id].doneAt) b.insertAdjacentHTML('afterbegin', `<p class="mono faint rt-skip">done ${esc(fmtDate(rec.steps[s.id].doneAt.slice(0, 10), 'short'))}</p>`);
  }}));
  const m = ppFlow(k.name, wrapped, () => {
    rec.finishedAt = new Date().toISOString(); saveNow(); sound('success');
    const pair = k.flow && typeof window[k.flow] === 'function' ? window[k.flow] : null;
    toast(`Retreat kept — ${retreatDoneCount(kind, rec)} of ${steps.length} steps.`, 7000, pair ? {label: 'open ' + k.pairs, fn: () => pair()} : null);
    if(location.hash.startsWith('#/retreat')) rerender();
  }, {finish: 'Close the retreat', startAt: firstUndone});
  /* leaving at any step is normal: the record says which were done, and nothing calls it abandoned */
  new MutationObserver((_, obs) => { if(!m.isConnected){ obs.disconnect(); saveNow(); if(location.hash.startsWith('#/retreat')) rerender(); } }).observe(document.body, {childList: true, subtree: true});
}

/* ---------- the page ---------- */
routes.retreat = function(root, params){
  if(params[0] === 'zone'){ navigate('#/purpose/zone'); return; }
  const T = today();
  const rows = ['weekly', 'monthly', 'seasonal', 'annual', 'nature'].map(kind => {
    const k = RT_KINDS[kind], per = retreatPeriod(kind, T), rec = retreatRec(kind, T);
    const n = rec ? retreatDoneCount(kind, rec) : 0, total = kind === 'nature' ? 1 : retreatSteps(kind, rec || {steps: {}}, {act: () => {}}).length;
    const raised = kind !== 'nature' && retreatRaised(kind, T);
    const status = rec && rec.finishedAt ? `kept ${esc(fmtDate(rec.finishedAt.slice(0, 10), 'short'))} · ${n} of ${total} steps` : n ? `${n} of ${total} steps done — resume whenever` : 'not begun';
    return `<article class="rt-card${raised ? ' raised' : ''}"><div class="rt-main"><b class="serif">${esc(k.name)}</b> <span class="mono faint">${esc(k.cadence)} · ${esc(k.minutes)}</span>
        <p class="faint">${esc(k.lede)}</p>
        <div class="mono faint">${esc(per.key)} · ${status}${k.pairs ? ` · then ${esc(k.pairs)}` : ''}</div></div>
      <div class="rt-act"><button class="btn${raised ? ' primary' : ''}" data-rtrun="${kind}">${kind === 'nature' ? 'I’m going' : n && !(rec && rec.finishedAt) ? 'Resume' : 'Begin'}</button>${kind === 'nature' ? '<button class="btn" data-rtback="1">I’m back</button>' : ''}</div></article>`;
  }).join('');
  const past = retreatsAll().slice().sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || '')).slice(0, 12);
  root.innerHTML = `<div class="page narrow rt-page"><header><h1 class="serif">Retreat</h1>
    <p class="faint">A review reads a period back; a retreat changes the instrument. These are long and optional, and none is ever owed: one is only raised when its period had something in it, and leaving partway is normal.</p></header>
    <div class="rt-list">${rows}</div>
    <p class="faint" style="font-size:.82rem">The <a href="#/purpose/zone">contemplation zone</a> (${zoneItems().length} waiting) is processed in the weekly retreat.</p>
    ${past.length ? `<section class="section"><span class="sc">What has been kept</span><div class="rt-past">${past.map(r => `<div class="row between mono faint"><span>${esc(RT_KINDS[r.kind] ? RT_KINDS[r.kind].name : r.kind)} · ${esc(r.periodKey)}</span><span>${retreatDoneCount(r.kind, r)} step${retreatDoneCount(r.kind, r) === 1 ? '' : 's'}${r.finishedAt ? '' : ' · partial'}</span></div>`).join('')}</div></section>` : ''}</div>`;
  root.querySelectorAll('[data-rtrun]').forEach(b => b.onclick = () => retreatRun(b.dataset.rtrun));
  root.querySelectorAll('[data-rtback]').forEach(b => b.onclick = () => natureBack());
  root.querySelectorAll('[data-rtgo]').forEach(b => b.onclick = () => navigate(b.dataset.rtgo));
};

/* ---------- step deduplication: the shared registry ----------
   A retreat step and a review step that ask the same question are one question.
   When the retreat of the same period has already answered it, the review shows
   the answer, read-only, with a link back. The registry is keyed by step id. */
const RT_REVIEW_MAP = [
  {id: 'seasonal.values', review: 'Quarterly review', title: 'Re-rank what matters.'},
  {id: 'annual.authenticity', review: 'Annual rite', title: 'The authenticity question.'},
];
const _guidedFlowOrig = guidedFlow;
guidedFlow = function(title, steps, onDone, opts){
  try {
    steps = (steps || []).map(st => {
      const hit = RT_REVIEW_MAP.find(r => r.review === title && r.title === st.title); if(!hit) return st;
      const [kind, stepId] = hit.id.split('.'), got = retreatStepGet(kind, stepId);
      if(!got || !got.doneAt) return st;
      return Object.assign({}, st, {body: () => `<p class="faint">Already answered in this period’s ${esc(RT_KINDS[kind].name.toLowerCase())}, ${esc(fmtDate(got.doneAt.slice(0, 10), 'short'))}${got.answer && got.answer !== 'refreshed' && got.answer !== 'opened' ? ':' : '.'}</p>
        ${got.answer && got.answer !== 'refreshed' && got.answer !== 'opened' ? `<blockquote class="serif">${esc(got.answer)}</blockquote>` : ''}<a class="btn sm ghost" href="#/retreat" data-flowgo="#/retreat">open the retreat</a>`, bind: null, next: null});
    });
  } catch(e){ console.warn('retreat dedup failed', e); }
  return _guidedFlowOrig(title, steps, onDone, opts);
};
