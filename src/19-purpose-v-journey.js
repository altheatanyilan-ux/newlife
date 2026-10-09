/* ============================================================
   WHERE THE JOURNEY SEEMS TO BE, AND THE DAILY DUTIES OF THE PRACTICE

   The journey across a decade has four recognisable seasons — searching,
   testing, committing, mastering — and the interface should know which one
   you are in so that it does not ask a user without a purpose statement to
   count zone-of-genius hours, nor a user with one to redo the Big Leap
   worksheet every quarter.

   It is a description, not a level: derived, never displayed as a rank or a
   stage achieved, used only to decide which optional prompts and panels are
   worth drawing, with its rule stated, and always overridable with a note like
   every other reading in the house.
   ============================================================ */

const JOURNEY = {
  searching: {name: 'searching', rule: 'there is no purpose statement, or it is under six months old and no bet has been closed as yours',
    line: 'This looks like a season of searching: the workbench, the convergence report, small bets and the flow-clue list are the road. The hour-counting and mastery framing are left out of the way.'},
  testing: {name: 'testing', rule: 'there is a statement and bets have been run, but no niche candidate has been confirmed',
    line: 'This looks like a season of testing: small bets, the medium explored at its confidence rung. Long-horizon visualisation and deep skill ladders can wait.'},
  committing: {name: 'committing', rule: 'a niche candidate is confirmed, but a domain is not yet named, or fewer than three skills in play serve it',
    line: 'This looks like a season of committing: zone-of-genius hours, the practice ledger, purpose habits one at a time, a commitment letter. Further discovery worksheets can rest.'},
  mastering: {name: 'mastering', rule: 'a domain is named, at least three skills in play serve it, and two or more years of practice are recorded in it',
    line: 'This looks like a season of mastering: the plateau, muse and detachment. Discovery and screening prompts have done their work.'},
};
function journeyYearsOfPractice(){
  const ids = (S.skills || []).filter(s => s.servesDomain).map(s => s.id);
  if(!ids.length) return 0;
  const first = (S.entries || []).filter(e => e.type === 'progress' && (e.links.skills || []).some(id => ids.includes(id))).map(e => (e.occurredAt || e.createdAt || '').slice(0, 10)).filter(Boolean).sort()[0];
  return first ? daysBetween(first, today()) / 365 : 0;
}
function journeyDerived(){
  const p = purposeState(), last = p.statement && p.statement.length ? p.statement[p.statement.length - 1] : null;
  const mineBet = (typeof betsAll === 'function' ? betsAll() : []).some(b => (b.verdicts || []).some(v => v.call === 'mine'));
  if(!last || (daysBetween(last.at.slice(0, 10), today()) < 180 && !mineBet)) return 'searching';
  if(!p.niche || !p.niche.length) return 'testing';
  const domain = purposeHas('domain') && typeof domainSkillCount === 'function' && domainSkillCount() >= 3 && journeyYearsOfPractice() < 2;
  return domain ? 'committing' : 'mastering';
}
function journeyEffective(){
  const o = S.journeyOverride && JOURNEY[S.journeyOverride.state] ? S.journeyOverride : null;
  return {state: o ? o.state : journeyDerived(), derived: journeyDerived(), overridden: !!o, note: o ? o.note || '' : ''};
}
const journeyState = () => journeyEffective().state;

/* the reading, drawn once on the Review beside the alignment readings */
function journeyCardHTML(){
  const j = journeyEffective(), m = JOURNEY[j.state];
  return `<section class="section al-journey"><span class="sc">Where this seems to be</span>
    <p class="serif">${esc(m.line)}</p>
    <p class="faint mono" style="font-size:.76rem">the rule: ${esc(JOURNEY[j.derived].rule)}. ${j.overridden ? 'You have said it differently — ' + esc(m.name) + (j.note ? ': ' + esc(j.note) : '') + '.' : ''} It decides only which optional prompts are worth drawing; it is a description, not a level.</p>
    <details><summary class="mono faint">say it differently</summary>
      <div class="row" style="gap:6px;flex-wrap:wrap;margin:6px 0">${Object.keys(JOURNEY).map(k => `<button class="chip${j.state === k ? ' on' : ''}" data-jset="${k}">${k}</button>`).join('')}${j.overridden ? '<button class="chip" data-jset="">use the rule’s</button>' : ''}</div>
      <textarea class="ta" id="jNote" rows="2" placeholder="Why does it feel different from the rule?">${esc(j.note)}</textarea></details></section>`;
}
function bindJourneyCard(sec, redraw){
  sec.querySelectorAll('[data-jset]').forEach(b => b.onclick = () => { const k = b.dataset.jset; S.journeyOverride = k ? {state: k, note: (sec.querySelector('#jNote') || {value: ''}).value.trim(), at: new Date().toISOString()} : null; saveNow(); redraw(); });
  const n = sec.querySelector('#jNote'); if(n) n.onchange = () => { if(S.journeyOverride){ S.journeyOverride.note = n.value.trim(); saveNow(); } };
}

/* ---------- the daily and annual duties of the practice layer ----------
   Each one's completion is read from the record it is about; none is ticked. */
const kindDoneToday = (kind, T) => lifeArray('practiceLog').some(r => r.date === T && r.kind === kind);
if(typeof registerDuty === 'function'){
  registerDuty({id: 'purpose_review', label: 'Two minutes with the sheet', anchor: '[data-duty-id="morning_practice"]', route: '#/purpose', windowDef: {type: 'after-wake', startOffset: -30, endOffset: 240},
    recurrence: {type: 'daily-conditional', check: () => purposeAny()}, skipDone: true, notify: false, defaultOn: true, doneCheck: T => kindDoneToday('purposereview', T),
    rule: 'a sheet exists; done when you have recalled it today'});
  registerDuty({id: 'affirmation_practice', label: 'Five minutes of affirmation', anchor: '[data-duty-id="morning_practice"]', route: '#/today', windowDef: {type: 'anytime'},
    recurrence: {type: 'daily-conditional', check: () => affirmationsAll().length > 0}, skipDone: true, notify: false, defaultOn: false, doneCheck: T => kindDoneToday('affirmation', T),
    rule: 'the affirmation set is not empty'});
  registerDuty({id: 'contemplation_practice', label: 'A contemplation', anchor: '[data-duty-id="morning_practice"]', route: '#/today', windowDef: {type: 'anytime'},
    recurrence: {type: 'daily-conditional', check: () => purposeAny()}, skipDone: true, notify: false, defaultOn: false, doneCheck: T => kindDoneToday('contemplation', T),
    rule: 'a sheet exists'});
  registerDuty({id: 'purpose_visualisation', label: 'A purpose visualisation', anchor: '[data-duty-id="morning_practice"]', route: '#/today', windowDef: {type: 'anytime'},
    recurrence: {type: 'daily-conditional', check: () => purposeAny()}, skipDone: true, notify: false, defaultOn: false, doneCheck: T => kindDoneToday('visualization', T),
    rule: 'a sheet exists'});
  registerDuty({id: 'values_imprint', label: 'Five minutes with the values', anchor: '[data-duty-id="morning_practice"]', route: '#/values', windowDef: {type: 'anytime'},
    recurrence: {type: 'daily-conditional', check: () => (S.valueOrder || []).length > 0 && imprintState('values').run > 0}, skipDone: true, notify: false, defaultOn: false,
    doneCheck: T => (imprintState('values').lastDay || '') >= T, rule: 'a thirty-day run is under way; done when you have reviewed the values today'});
  registerDuty({id: 'strengths_retake', label: 'Retake the strengths list', anchor: '[data-duty-id="annual_review"]', route: '#/purpose/strengths', windowDef: {type: 'anytime'},
    recurrence: {type: 'event-driven', check: () => strengthsRetakeDue()}, skipDone: true, notify: false, defaultOn: true, doneCheck: () => !strengthsRetakeDue(),
    rule: 'the newest ranking is a year old or more; gone once a new list is saved'});
}
