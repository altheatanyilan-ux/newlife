/* ============================================================
   DETACHMENT — the counterweight to wanting

   The course pairs total commitment with its opposite. This file holds the
   three small instruments that are not the finitude sitting (that is in the
   sacred space):

     the grasping reading   one question on a manifestation: how would it be
                            if this did not arrive? It is never scored,
                            trended, totalled or shown on Today, and it
                            appears in exactly two places: on the entry, and
                            in the quarterly retreat. The restraint is the
                            feature; a grasping score on Today would be the
                            cruellest number in the system.

     the commitment         a hundred per cent is a declaration with a date,
                            not a slider: a sealed letter with a type.

     the authenticity test  grounding in emptiness is supposed to embolden a
                            purpose that is yours and dissolve one that is
                            not. The answer is words, with no scale.
   ============================================================ */

/* ---------- 12b. the grasping reading ---------- */
const GRASP_ANSWERS = [
  [1, 'Fine. I want it and I am not holding my breath.'],
  [2, 'Disappointing, and I would carry on.'],
  [3, 'Hard. A lot is resting on this.'],
  [4, 'I need this. I cannot picture carrying on well without it.'],
];
function graspFieldHTML(x){
  const cur = +x.grasp || 0;
  return `<div class="field"><label>How would it be if this did not arrive? <span class="faint" style="text-transform:none;letter-spacing:0">— optional; skipping is not an answer</span></label>
    <div class="chip-row" style="flex-direction:column;align-items:flex-start;gap:5px">${GRASP_ANSWERS.map(([n, t]) => `<button type="button" class="chip click${cur === n ? ' on' : ''}" data-xset="grasp" data-xval="${n}">${esc(t)}</button>`).join('')}</div></div>`;
}
/* at save: keep the answer as a number internally, stamp when it was given, and
   offer the line once if it is a third or fourth */
function graspSaveHook(e, existing){
  const x = e.extra; if(e.type !== 'manifestation') return;
  const n = +x.grasp;
  if(!(n >= 1 && n <= 4)){ delete x.grasp; delete x.graspAt; return; }
  x.grasp = n;
  const was = existing && existing.extra ? +existing.extra.grasp : 0;
  x.graspAt = was === n && existing.extra.graspAt ? existing.extra.graspAt : new Date().toISOString();
  if(n >= 3 && !x.graspOffered){
    x.graspOffered = true;
    setTimeout(() => toast('The course’s own principle: needing a specific thing too badly means something has already gone wrong.', 9000, {label: 'a grounding sitting', fn: () => { if(typeof ppFinitude === 'function') ppFinitude(5, 'grounding'); }}), 600);
  }
}
/* on the entry itself — a third or fourth answer offers one line and one button */
function graspCardLine(e){
  const g = +(e.extra && e.extra.grasp);
  if(!(g >= 3)) return '';
  return `<div class="grasp-line faint">Needing a specific thing too badly means something has already gone wrong. <button class="btn sm ghost" data-graspwheel="${e.id}">a focus wheel</button> <button class="btn sm ghost" data-graspsit="${e.id}">a grounding sitting</button></div>`;
}
document.addEventListener('click', ev => {
  const w = ev.target.closest && ev.target.closest('[data-graspwheel]'), s = ev.target.closest && ev.target.closest('[data-graspsit]');
  if(w){ ev.preventDefault(); if(typeof openFocusWheel === 'function') openFocusWheel(); }
  if(s){ ev.preventDefault(); if(typeof ppFinitude === 'function') ppFinitude(5, 'grounding'); }
}, true);
/* the quarterly list: held intentions set from need, with the set-point they were set from */
function graspingListHTML(T = today()){
  const q = retreatPeriod('seasonal', T);
  const xs = S.entries.filter(e => e.type === 'manifestation' && e.extra && +e.extra.grasp >= 3 && (e.extra.status || 'held') === 'held' && (e.occurredAt || '').slice(0, 10) >= q.from && (e.occurredAt || '').slice(0, 10) <= q.to);
  if(!xs.length) return '<p class="faint">Nothing is held that way this quarter.</p>';
  return `<p class="faint">Intentions set from need, still held. Are these still the ones — and are you still holding them that way?</p>
    ${xs.map(e => `<div class="rev-summary"><b class="serif">${esc(e.title || e.body.slice(0, 60))}</b> <span class="mono faint">${esc(fmtDate((e.occurredAt || '').slice(0, 10), 'short'))}${e.extra.setpointAt ? ` · set from ${esc(hicksName(+e.extra.setpointAt).split(' / ')[0])}` : ''}</span></div>`).join('')}`;
}

/* ---------- 12c. the commitment record: a sealed letter with a type ---------- */
function openCommitmentModal(){
  const opts = [[30, 'thirty days'], [90, 'three months'], [180, 'six months'], [365, 'a year']];
  const m = openModal(`<h2>A commitment</h2>
    <p class="muted" style="font-size:.88rem">A hundred per cent is a declaration with a date, not a slider. It is sealed like a letter, and when it opens it asks what the person who wrote it got right, and what they did not know yet.</p>
    <div class="stack">
      <div class="field"><label>What I am committing to, totally</label><textarea class="ta" id="cmTo" rows="3"></textarea></div>
      <div class="field"><label>What I am giving up to do it</label><textarea class="ta" id="cmGive" rows="2"></textarea></div>
      <div class="field"><label>What would count as breaking it</label><textarea class="ta" id="cmBreak" rows="2"></textarea></div>
      <div class="field"><label>Open it</label><div class="row" style="gap:6px;flex-wrap:wrap">${opts.map(([d, l]) => `<button type="button" class="btn sm ghost" data-cmwhen="${d}">${l}</button>`).join('')}</div>
        <input class="inp" type="date" id="cmDate" value="${addDays(today(), 90)}" style="margin-top:8px;max-width:14em"></div>
      <div class="row" style="justify-content:flex-end"><button class="btn primary" id="cmSave">Seal it</button></div>
    </div>`, 'wide');
  const dateI = m.querySelector('#cmDate');
  m.querySelectorAll('[data-cmwhen]').forEach(b => b.onclick = () => { dateI.value = addDays(today(), +b.dataset.cmwhen); });
  attachDictationIn(m);
  m.querySelector('#cmSave').onclick = () => {
    const to = m.querySelector('#cmTo').value.trim(), give = m.querySelector('#cmGive').value.trim(), brk = m.querySelector('#cmBreak').value.trim();
    if(!to){ toast('Say what you are committing to.'); return; }
    const body = `I commit totally to: ${to}\n\nI am giving up: ${give || '—'}\n\nIt would be broken if: ${brk || '—'}`;
    const e = lifeEntryNew({type: 'letter', title: 'A commitment', body, extra: {sealedUntil: dateI.value || addDays(today(), 90), openedAt: '', reply: '', type: 'commitment',
      commitment: {toWhat: to, givingUp: give, whatWouldBreakIt: brk}}});
    saveNow(); m.remove(); sound('success'); toast(`Sealed until ${fmtDate(e.extra.sealedUntil, 'med')}.`); rerender();
  };
}

/* ---------- 12d. the authenticity test, in the annual rite ---------- */
const AUTH_CLAIM = 'The course’s claim: grounding in emptiness emboldens a purpose that is yours, and dissolves one that is not.';
function authenticityBodyHTML(kind = 'annual'){
  const got = retreatStepGet('annual', 'authenticity');
  if(got && got.doneAt && got.answer) return `<p class="faint">Already answered this year, ${esc(fmtDate(got.doneAt.slice(0, 10), 'short'))}.</p><blockquote class="serif">${esc(got.answer)}</blockquote>`;
  const cur = purposeText('statement');
  return `<p class="serif">${esc(AUTH_CLAIM)}</p>
    ${cur ? `<p class="mono faint">your statement now</p><p class="serif" style="font-size:1.1rem">${esc(cur)}</p>` : ''}
    <p>After this year of sittings, does the statement feel more yours, or less?</p>
    <textarea class="ta" id="authT" rows="5" placeholder="In words. There is no scale for this one."></textarea>`;
}
/* returns true when something was written */
function authenticitySave(b){
  const t = b.querySelector('#authT'); if(!t) return false;
  const text = t.value.trim(); if(!text) return false;
  const e = lifeEntryNew({type: 'reflection', title: 'Does the statement feel more mine, or less?', body: text, tags: ['authenticity'], extra: {source: 'authenticity'}});
  retreatStepSet('annual', 'authenticity', {answer: text, entryId: e.id});
  return true;
}
