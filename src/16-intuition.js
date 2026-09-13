/* ============================================================
   THE INTUITION LOG — a hunch, and then the check on it

   Hill says the sixth sense comes slowly, through application. Maltz says the
   capacity is real and trainable. Neither says how you would know whether
   yours is working. This does: log the impression before the conscious mind
   has time to tidy it, say what would confirm or deny it, and come back later
   to mark what actually happened.

   Over enough entries that produces something no book can give you — your own
   hit rate, broken down by the kind of impression and the state you were in
   when it arrived. Which channel of yours is accurate, and which is not.
   ============================================================ */
const INTUIT_KINDS = [
  ['hunch',        'A hunch, in the gut'],
  ['flash',        'A flash of insight'],
  ['dream',        'Something a dream said'],
  ['physical',     'A physical sensation'],
  ['knowing',      'Simply knowing'],
  ['synchronicity','A coincidence that meant something'],
  ['creative',     'Something arriving whole'],
  ['warning',      'Unease, a warning'],
];
const INTUIT_STATES = [
  ['relaxed',      'Relaxed, quiet'],
  ['active',       'Working, busy'],
  ['drowsy',       'Half asleep'],
  ['emotional',    'Stirred up'],
  ['walking',      'Walking, moving'],
  ['conversation', 'Mid-conversation'],
];
const INTUIT_OUTCOMES = [
  ['confirmed',     '✓ It happened',            true],
  ['partial',       '≈ Partly',                 true],
  ['not_confirmed', '✗ It did not',             false],
  ['cant_verify',   '⋯ Cannot tell yet',        null],
  ['irrelevant',    '— Overtaken by events',    null],
];
const INTUIT_WAITS = [['7','in a week'], ['14','in a fortnight'], ['30','in a month'], ['90','in three months'], ['', 'no reminder']];

const intuitions = () => (S.entries || []).filter(e => e.type === 'intuition');
const intuitionOf = e => e?.extra?.intuition || null;
/* the ones whose check-back date has come, and that have not been marked yet */
function intuitionsDue(){
  const T = today();
  return intuitions().filter(e => { const x = intuitionOf(e);
    return x && x.verifiable && !x.outcome && x.checkOn && x.checkOn <= T; });
}
function logIntuition(rec){
  const e = {id:uid(), type:'intuition',
    title: (rec.impression || '').split('\n')[0].slice(0, 80) || 'An impression',
    body: rec.impression || '', occurredAt:today(), createdAt:new Date().toISOString(), media:[],
    links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:rec.projectId?[rec.projectId]:[],people:[]},
    people:[], places:[], emotions:[], tags:['intuition'], confidence:'',
    extra:{intuition:{kind:rec.kind || 'hunch', strength:+rec.strength || 3, state:rec.state || 'active',
      context:rec.context || '', verifiable: !!rec.verifiable, criteria:rec.criteria || '',
      checkOn:rec.checkOn || '', outcome:null, notes:'', verifiedOn:'', learned:'',
      source:rec.source || 'spontaneous', sessionId:rec.sessionId || null, readingId:rec.readingId || null}}};
  S.entries.push(e); saveNow();
  return e;
}
/* Speed is the point: what was sensed, what kind, how strong. Everything else
   can be filled in afterwards, and usually is. */
function openIntuitionQuick(){
  const m = openModal(`<h2>⚡ Before it goes</h2>
    <p class="th-quote">Hill: through the sixth sense you will be warned of impending dangers in time to avoid them, and notified of opportunities in time to embrace them.</p>
    <div class="stack">
      <div class="field"><label>What did you sense?</label>
        <textarea class="inp serif-lg" id="inText" rows="3" autofocus placeholder="Write it before you start editing it."></textarea></div>
      <div class="field"><label>What kind</label>
        <div class="row" style="gap:5px;flex-wrap:wrap" id="inKinds">${INTUIT_KINDS.map(([k, n], i) =>
          `<button type="button" class="chip ${i === 0 ? 'on' : ''}" data-ik="${k}">${esc(n)}</button>`).join('')}</div></div>
      <div class="field"><label>How strong</label>
        <div class="row" style="gap:8px;align-items:center"><div class="sc-rate" id="inStr">${[1,2,3,4,5].map(n =>
          `<button type="button" class="${n <= 3 ? 'on' : ''}" data-n="${n}">●</button>`).join('')}</div>
          <span class="mono faint">vague → unmistakable</span></div></div>
      <div class="row between" style="margin-top:12px">
        <button class="btn sm ghost" id="inMore">the rest of it</button>
        <button class="btn primary" id="inSave">Save</button></div>
    </div>`, 'narrow');
  let kind = INTUIT_KINDS[0][0], strength = 3;
  m.querySelectorAll('[data-ik]').forEach(b => b.onclick = () => { kind = b.dataset.ik;
    m.querySelectorAll('[data-ik]').forEach(x => x.classList.toggle('on', x === b)); });
  m.querySelectorAll('#inStr button').forEach(b => b.onclick = () => { strength = +b.dataset.n;
    m.querySelectorAll('#inStr button').forEach(x => x.classList.toggle('on', +x.dataset.n <= strength)); });
  const grab = () => ({impression:m.querySelector('#inText').value.trim(), kind, strength});
  m.querySelector('#inSave').onclick = () => {
    const d = grab(); if(!d.impression){ toast('Write the impression first.'); return; }
    logIntuition(d); sound('success'); toast('Logged. Come back and mark what happened.'); m.remove(); rerender();
  };
  m.querySelector('#inMore').onclick = () => { const d = grab(); m.remove(); openIntuitionFull(d); };
}
function openIntuitionFull(pre = {}){
  const projects = typeof thProjects === 'function' ? thProjects() : [];
  const m = openModal(`<h2>⚡ An impression</h2>
    <div class="stack">
      <div class="field"><label>What did you sense, feel, or simply know?</label>
        <textarea class="inp serif-lg" id="inText" rows="3">${esc(pre.impression || '')}</textarea></div>
      <div class="field"><label>What kind</label>
        <div class="row" style="gap:5px;flex-wrap:wrap">${INTUIT_KINDS.map(([k, n]) =>
          `<button type="button" class="chip ${(pre.kind || 'hunch') === k ? 'on' : ''}" data-ik="${k}">${esc(n)}</button>`).join('')}</div></div>
      <div class="field"><label>How strong</label>
        <div class="row" style="gap:8px;align-items:center"><div class="sc-rate" id="inStr">${[1,2,3,4,5].map(n =>
          `<button type="button" class="${n <= (pre.strength || 3) ? 'on' : ''}" data-n="${n}">●</button>`).join('')}</div>
          <span class="mono faint">vague → unmistakable</span></div></div>
      <div class="field"><label>What state were you in?</label>
        <div class="row" style="gap:5px;flex-wrap:wrap">${INTUIT_STATES.map(([k, n], i) =>
          `<button type="button" class="chip ${i === 1 ? 'on' : ''}" data-is="${k}">${esc(n)}</button>`).join('')}</div></div>
      <div class="field"><label>What were you doing? What set it off?</label>
        <input class="inp" id="inCtx" value="${esc(pre.context || '')}"></div>
      <div class="field"><label class="row" style="gap:6px;align-items:center">
        <input type="checkbox" id="inVer"> <span style="text-transform:none;letter-spacing:0">This one can be checked later</span></label>
        <div id="inVerBox" hidden style="margin-top:8px">
          <input class="inp" id="inCrit" placeholder="What would confirm or deny it?">
          <select class="inp sm" id="inWhen" style="margin-top:6px">${INTUIT_WAITS.map(([v, n]) =>
            `<option value="${v}" ${v === '7' ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div></div>
      ${projects.length ? `<div class="field"><label>About which</label>
        <select class="inp" id="inProj"><option value="">nothing in particular</option>
          ${projects.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div>` : ''}
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary" id="inSave">Save</button></div>
    </div>`);
  let kind = pre.kind || 'hunch', state = 'active', strength = pre.strength || 3;
  m.querySelectorAll('[data-ik]').forEach(b => b.onclick = () => { kind = b.dataset.ik;
    m.querySelectorAll('[data-ik]').forEach(x => x.classList.toggle('on', x === b)); });
  m.querySelectorAll('[data-is]').forEach(b => b.onclick = () => { state = b.dataset.is;
    m.querySelectorAll('[data-is]').forEach(x => x.classList.toggle('on', x === b)); });
  m.querySelectorAll('#inStr button').forEach(b => b.onclick = () => { strength = +b.dataset.n;
    m.querySelectorAll('#inStr button').forEach(x => x.classList.toggle('on', +x.dataset.n <= strength)); });
  m.querySelector('#inVer').onchange = e => { m.querySelector('#inVerBox').hidden = !e.target.checked; };
  m.querySelector('#inSave').onclick = () => {
    const impression = m.querySelector('#inText').value.trim();
    if(!impression){ toast('Write the impression first.'); return; }
    const ver = m.querySelector('#inVer').checked;
    const wait = m.querySelector('#inWhen').value;
    logIntuition({impression, kind, strength, state, context:m.querySelector('#inCtx').value.trim(),
      verifiable:ver, criteria: ver ? m.querySelector('#inCrit').value.trim() : '',
      checkOn: ver && wait ? addDays(today(), +wait) : '',
      projectId:m.querySelector('#inProj')?.value || null});
    sound('success'); m.remove(); rerender();
  };
}
/* What actually happened. This is the half that makes the log worth keeping. */
function openIntuitionVerify(entryId){
  const e = byId(S.entries, entryId); const x = intuitionOf(e); if(!x) return;
  const m = openModal(`<h2>⚡ What happened?</h2>
    <div class="mono faint" style="margin-bottom:6px">logged ${esc(fmtDate(e.occurredAt, 'med'))}</div>
    <blockquote class="quote">${esc(e.body)}</blockquote>
    ${x.criteria ? `<p class="mono faint">to check: ${esc(x.criteria)}</p>` : ''}
    <div class="stack" style="margin-top:12px">
      <div class="field"><label>The outcome</label>
        <div class="stack" style="gap:5px">${INTUIT_OUTCOMES.map(([k, n]) =>
          `<button type="button" class="chip wide ${x.outcome === k ? 'on' : ''}" data-io="${k}">${esc(n)}</button>`).join('')}</div></div>
      <div class="field"><label>What actually happened</label>
        <textarea class="inp" id="ivNotes" rows="2">${esc(x.notes || '')}</textarea></div>
      <div class="field"><label>What did you learn about how yours works?</label>
        <textarea class="inp" id="ivLearn" rows="2">${esc(x.learned || '')}</textarea></div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary" id="ivSave">Save</button></div>
    </div>`);
  let outcome = x.outcome;
  m.querySelectorAll('[data-io]').forEach(b => b.onclick = () => { outcome = b.dataset.io;
    m.querySelectorAll('[data-io]').forEach(y => y.classList.toggle('on', y === b)); });
  m.querySelector('#ivSave').onclick = () => {
    if(!outcome){ toast('Say what happened first.'); return; }
    x.outcome = outcome; x.notes = m.querySelector('#ivNotes').value.trim();
    x.learned = m.querySelector('#ivLearn').value.trim();
    /* "cannot tell yet" is not an answer, it is a postponement */
    if(outcome === 'cant_verify'){ x.outcome = null; x.checkOn = addDays(today(), 14); }
    else x.verifiedOn = today();
    saveNow(); sound('success'); m.remove(); rerender();
  };
}
/* ---------- the numbers ----------
   A hit is confirmed or partly confirmed. Anything that could not be checked
   or was overtaken is left out of the rate entirely rather than counted as a
   miss, because it is not one. */
function intuitionStats(from, to){
  const all = intuitions().filter(e => e.occurredAt >= from && e.occurredAt <= to);
  const judged = all.filter(e => { const o = intuitionOf(e)?.outcome;
    return o === 'confirmed' || o === 'partial' || o === 'not_confirmed'; });
  const hits = judged.filter(e => ['confirmed','partial'].includes(intuitionOf(e).outcome));
  const bucket = (key, list) => {
    const out = {};
    list.forEach(e => { const x = intuitionOf(e); const k = x[key];
      out[k] = out[k] || {total:0, hits:0};
      out[k].total++; if(['confirmed','partial'].includes(x.outcome)) out[k].hits++; });
    return out;
  };
  const best = obj => { let bestK = null, bestR = -1;
    Object.entries(obj).forEach(([k, v]) => { if(v.total < 2) return;
      const r = v.hits / v.total; if(r > bestR){ bestR = r; bestK = k; } });
    return bestK; };
  const byKind = bucket('kind', judged), byState = bucket('state', judged);
  const avg = xs => xs.length ? +(sum(xs) / xs.length).toFixed(1) : null;
  /* is it getting better? compare the first half of the judged run to the last */
  let trend = 'not enough yet';
  if(judged.length >= 6){
    const half = Math.floor(judged.length / 2);
    const older = judged.slice(0, half), newer = judged.slice(half);
    const rate = g => g.filter(e => ['confirmed','partial'].includes(intuitionOf(e).outcome)).length / g.length;
    const d = rate(newer) - rate(older);
    trend = d > .12 ? 'improving' : d < -.12 ? 'slipping' : 'steady';
  }
  return {
    total: all.length, judged: judged.length, hits: hits.length,
    rate: judged.length ? Math.round(hits.length / judged.length * 100) : null,
    waiting: all.filter(e => { const x = intuitionOf(e); return x.verifiable && !x.outcome; }).length,
    byKind, byState,
    strength: avg(all.map(e => intuitionOf(e).strength)),
    strengthOfHits: avg(hits.map(e => intuitionOf(e).strength)),
    bestChannel: best(byKind), bestState: best(byState), trend,
  };
}
function intuitionStatsHTML(from, to){
  const s = intuitionStats(from, to);
  if(!s.total) return '';
  const nameK = k => (INTUIT_KINDS.find(x => x[0] === k) || [,k])[1];
  const nameS = k => (INTUIT_STATES.find(x => x[0] === k) || [,k])[1];
  return `<div class="int-stats">
    <div class="int-nums">
      <span><b>${s.total}</b> logged</span>
      <span><b>${s.judged}</b> checked</span>
      ${s.rate != null ? `<span><b>${s.rate}%</b> right</span>` : ''}
      ${s.waiting ? `<span><b>${s.waiting}</b> still waiting</span>` : ''}
      <span class="mono faint">${esc(s.trend)}</span>
    </div>
    ${s.bestChannel ? `<p class="mono faint">strongest channel: ${esc(nameK(s.bestChannel).toLowerCase())}${
      s.bestState ? ` · best when ${esc(nameS(s.bestState).toLowerCase())}` : ''}</p>` : ''}
    ${s.strengthOfHits != null && s.strength != null ? `<p class="mono faint">the ones that came true felt ${
      s.strengthOfHits > s.strength ? 'stronger' : s.strengthOfHits < s.strength ? 'weaker' : 'the same'
      } at the time (${s.strengthOfHits} against ${s.strength} on average)</p>` : ''}
  </div>`;
}
