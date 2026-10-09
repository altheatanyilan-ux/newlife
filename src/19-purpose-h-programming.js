/* ============================================================
   THE SUBCONSCIOUS PROGRAMMING STUDIO — contemplation and purpose
   visualisation (the affirmation is in 19-purpose-c-practice.js)

   The course's mechanism for making a purpose real is three timed daily
   practices: a statement said over and over; five minutes of holding a
   framed question; ten minutes of the target in as much detail as possible,
   at a long horizon. They are eyes-closed practices, and the Theatre's
   existing nine are writing practices; that distinction is the course's own,
   so these are three more, not a merge.

   They share one timing primitive (ppSitting), one strict counter (the
   ninety-day imprint) and one rule: ending early records the minutes
   actually sat, capped at the plan.
   ============================================================ */

/* ---------- contemplation: frame the question, then hold it ---------- */
function ppContemplate(){
  const qs = S.entries.filter(e => e.type === 'question' && !(e.extra && (e.extra.answers || []).length)).sort((a, b) => (b.occurredAt || '').localeCompare(a.occurredAt || '')).slice(0, 8);
  const phrases = typeof convergeOffer === 'function' ? convergeOffer() : [];
  let chosen = {text: '', entryId: null}, mins = 5;
  const m = openModal(`<h2>Contemplation</h2>
    <p class="faint">Frame a question, then hold it with the eyes closed. If the mind wanders, bring it back — that is all. The course’s worked example: <i>what does it mean to make people wiser?</i> unfolds into what wisdom is, and who you want to give it to.</p>
    ${qs.length ? `<div class="field"><label>An open question of yours</label><div class="deps">${qs.map((q, i) => `<button class="chip" data-cq="${i}">${esc((q.title || q.body || '').slice(0, 60))}</button>`).join('')}</div></div>` : ''}
    ${phrases.length ? `<div class="field"><label>Something that keeps coming up</label><div class="deps">${phrases.slice(0, 6).map((p, i) => `<button class="chip" data-cp="${i}">${esc(p)}</button>`).join('')}</div></div>` : ''}
    <div class="field"><label>Or frame it yourself</label><input class="inp" id="ctQ" placeholder="what does it mean to…"></div>
    <div class="field"><label>How long</label><div class="row" style="gap:6px">${[5, 10].map(n => `<button class="chip ${n === mins ? 'on' : ''}" data-ctm="${n}">${n} min</button>`).join('')}</div></div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="ctGo">Begin</button></div>`);
  m.querySelectorAll('[data-cq]').forEach(b => b.onclick = () => { const q = qs[+b.dataset.cq]; chosen = {text: q.title || q.body, entryId: q.id}; m.querySelector('#ctQ').value = chosen.text; });
  m.querySelectorAll('[data-cp]').forEach(b => b.onclick = () => { chosen = {text: 'what is behind “' + phrases[+b.dataset.cp] + '”?', entryId: null}; m.querySelector('#ctQ').value = chosen.text; });
  m.querySelectorAll('[data-ctm]').forEach(b => b.onclick = () => { mins = +b.dataset.ctm; m.querySelectorAll('[data-ctm]').forEach(x => x.classList.toggle('on', x === b)); });
  m.querySelector('#ctGo').onclick = () => {
    const t = m.querySelector('#ctQ').value.trim(); if(!t){ toast('Frame a question first.'); return; }
    if(t !== chosen.text) chosen = {text: t, entryId: null};
    m.remove(); ppContemplateRun(chosen, mins);
  };
}
function ppContemplateRun(q, minutes){
  let returns = 0;
  ppSitting({minutes, feature: 'contemplation', what: 'contemplation', label: 'a contemplation',
    arrive: ['Close your eyes.', 'Think about the question. If the mind wanders, bring it back.', `${minutes} minutes.`],
    main: `<span class="still-mantra pp-aff-line">${esc(q.text)}</span>`,
    extra: '<button class="btn sm ghost" id="ctBack">came back</button>',
    onReady: m => { m.querySelector('#ctBack').onclick = () => { returns++; const b = m.querySelector('#ctBack'); b.classList.add('flash'); setTimeout(() => b.classList.remove('flash'), 300); }; },
    onFinish: () => ({returns}),
    onEnd: info => ppContemplateAfter(q, info)});
}
function ppContemplateAfter(q, info){
  if(info.actual < .1){ toast('Nothing was sat, so nothing was kept.'); ppAfterRedraw(); return; }
  const src = q.entryId ? byId(S.entries, q.entryId) : null;
  const m = openModal(`<h2>${info.complete ? 'Done' : 'Ended early'} — ${info.actual} minute${info.actual === 1 ? '' : 's'}</h2>
    <p class="faint">You came back ${info.returns || 0} time${info.returns === 1 ? '' : 's'}. Noticing is the practice.</p>
    <div class="field"><label>What arrived?</label><textarea class="ta" id="ctA" rows="4" placeholder="Leave it empty if nothing did."></textarea></div>
    <div class="field"><label>How far did it go?</label><div class="ladder" id="ctD">${[['1', 'sat with it'], ['2', 'something moved'], ['3', 'a breakthrough']].map(([n, t]) => `<button data-d="${n}">${t}</button>`).join('')}</div></div>
    <div class="row" style="justify-content:flex-end;gap:8px;flex-wrap:wrap">
      ${src ? '<button class="btn ghost" id="ctAns">add as a tentative answer to the question</button>' : ''}
      <button class="btn ghost" id="ctTree">send to the Knowledge Tree</button><button class="btn primary" id="ctKeep">Keep it</button></div>`);
  let depth = 0; m.querySelectorAll('#ctD button').forEach(b => b.onclick = () => { depth = +b.dataset.d; m.querySelectorAll('#ctD button').forEach(x => x.classList.toggle('on', x === b)); });
  const keep = (toAnswer, toTree) => {
    const arrived = m.querySelector('#ctA').value.trim();
    const e = lifeEntryNew({type: 'contemplation', title: q.text.slice(0, 80), body: arrived, tags: ['contemplation'], extra: {question: q.text, questionEntryId: q.entryId, minutes: info.actual, planned: info.planned, returns: info.returns || 0, depth, arrived}});
    if(toAnswer && src && arrived){ src.extra = src.extra || {}; (src.extra.answers = src.extra.answers || []).push({date: today(), text: arrived, conf: 'tentative'}); }
    if(toTree && typeof treeCapture === 'function') treeCapture(`${q.text}${arrived ? ' — ' + arrived : ''}`);
    purposeContact('contemplation', {minutes: info.actual, subjectRef: q.entryId || ''});
    m.remove(); sound('success'); if(toTree) toast('In the Knowledge Tree’s inbox — nothing attached.'); ppAfterRedraw();
  };
  m.querySelector('#ctKeep').onclick = () => keep(false, false);
  m.querySelector('#ctTree').onclick = () => keep(false, true);
  const a = m.querySelector('#ctAns'); if(a) a.onclick = () => { if(!m.querySelector('#ctA').value.trim()){ toast('Write what arrived first.'); return; } keep(true, false); };
}

/* ---------- purpose visualisation: the target in detail, at a long horizon ---------- */
const PV_HORIZONS = {
  month: {name: 'next month', prompts: ['The one piece of work you will have made.', 'What it looks like finished.', 'The moment you show it to one person.', 'What you notice about how it felt to make.']},
  year: {name: 'next year', prompts: ['Where you are working.', 'What a Tuesday looks like.', 'The skill you now have that you do not have today.', 'The one thing that has shipped.', 'Who knows about it.']},
  ten: {name: 'ten years', prompts: ['The domain mastered — what you can do that you cannot do now.', 'The impact landed — one specific person it reached, and what changed for them.', 'The medium, as it actually turned out.', 'How the money works.', 'Where you live.', 'How you feel about your life.']},
  twenty: {name: 'twenty years', prompts: ['What exists in the world because of you.', 'Who carried it further.', 'What you would tell the person sitting where you are sitting now.', 'What you are still curious about.']},
};
function ppVisualise(){
  const visions = (S.visions || []).filter(v => !v.archived && v.status !== 'completed');
  const goals = typeof perfActive === 'function' ? perfActive() : [];
  const subjects = [];
  if(purposeText('statement')) subjects.push({kind: 'purpose', id: 'statement', label: 'my purpose', text: purposeText('statement')});
  visions.forEach(v => subjects.push({kind: 'vision', id: v.id, label: 'vision: ' + (v.name || ''), text: v.futureMemory || v.name}));
  goals.slice(0, 6).forEach(g => subjects.push({kind: 'goal', id: g.id, label: 'goal: ' + g.title, text: g.title}));
  if(!subjects.length){ toast('Write a purpose statement or a vision first — there is nothing to hold yet.'); return; }
  let hz = 'ten', si = 0;
  const m = openModal(`<h2>Purpose visualisation</h2>
    <p class="faint">Ten minutes, eyes closed, the target in as much detail as you can. Take a long horizon — twenty years out, or next year, or next month’s small bet.</p>
    <div class="field"><label>How far out</label><div class="row" style="gap:6px;flex-wrap:wrap">${Object.entries(PV_HORIZONS).map(([k, h]) => `<button class="chip ${k === hz ? 'on' : ''}" data-pvh="${k}">${h.name}</button>`).join('')}</div></div>
    <div class="field"><label>What to hold</label><select class="sel" id="pvS">${subjects.map((s, i) => `<option value="${i}">${esc(s.label)}</option>`).join('')}</select></div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="pvGo">Begin</button></div>`);
  m.querySelectorAll('[data-pvh]').forEach(b => b.onclick = () => { hz = b.dataset.pvh; m.querySelectorAll('[data-pvh]').forEach(x => x.classList.toggle('on', x === b)); });
  m.querySelector('#pvGo').onclick = () => { si = +m.querySelector('#pvS').value; m.remove(); ppVisualiseRun(subjects[si], hz, 10); };
}
function ppVisualiseRun(sub, hz, minutes){
  const prompts = PV_HORIZONS[hz].prompts; let at = 0, timer = null;
  ppSitting({minutes, feature: 'visualisation', what: 'purpose visualisation', label: 'a visualisation',
    arrive: ['Close your eyes.', sub.text.length > 200 ? sub.text.slice(0, 200) + '…' : sub.text, `${PV_HORIZONS[hz].name}. ${minutes} minutes.`],
    main: `<span class="pp-vis-sub serif">${esc(sub.text.slice(0, 160))}</span><p class="pp-vis-prompt serif" id="pvP">${esc(prompts[0])}</p><p class="mono faint pp-aff-note">Every ninety seconds, or tap.</p>`,
    onReady: m => { m.classList.add('pp-dim'); const adv = () => { at = (at + 1) % prompts.length; const p = m.querySelector('#pvP'); if(p) p.textContent = prompts[at]; };
      m.querySelector('.pp-sit-main').onclick = adv; timer = setInterval(() => { if(!m.isConnected) clearInterval(timer); else adv(); }, 90000); },
    onFinish: () => { clearInterval(timer); return {}; },
    onEnd: info => ppVisualiseAfter(sub, hz, info)});
}
function ppVisualiseAfter(sub, hz, info){
  if(info.actual < .1){ toast('Nothing was sat, so nothing was kept.'); ppAfterRedraw(); return; }
  const m = openModal(`<h2>${info.complete ? 'Done' : 'Ended early'} — ${info.actual} minute${info.actual === 1 ? '' : 's'}</h2>
    <div class="field"><label>How vivid was it?</label><div class="sc-rate" id="pvV">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-n="${n}">●</button>`).join('')}</div></div>
    <div class="field"><label>How strongly did you feel it?</label><div class="sc-rate" id="pvI">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-n="${n}">●</button>`).join('')}</div></div>
    <div class="field"><label>Did anything become clearer?</label><textarea class="ta" id="pvC" rows="3"></textarea></div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="pvKeep">Keep it</button></div>`);
  let v = 0, it = 0;
  const rate = (id, set) => m.querySelectorAll(`#${id} button`).forEach(b => b.onclick = () => { set(+b.dataset.n); m.querySelectorAll(`#${id} button`).forEach(x => x.classList.toggle('on', +x.dataset.n <= +b.dataset.n)); });
  rate('pvV', x => v = x); rate('pvI', x => it = x);
  m.querySelector('#pvKeep').onclick = () => {
    const clearer = m.querySelector('#pvC').value.trim();
    lifeEntryNew({type: 'visualization', title: 'Purpose visualisation — ' + PV_HORIZONS[hz].name, body: clearer, tags: ['purpose-visualisation'],
      extra: {horizon: hz, subjectKind: sub.kind, subjectId: sub.id, minutes: info.actual, planned: info.planned, vividness: v, intensity: it, clearer}});
    purposeContact('visualization', {minutes: info.actual, subjectRef: sub.kind + ':' + sub.id});
    m.remove(); sound('success'); ppAfterRedraw();
  };
}
/* the digest: visualisations are averaged on their own and labelled so, so a
   month of them is not read as a month of scenes */
function visualisationDigest(from, to){
  const xs = S.entries.filter(e => e.type === 'visualization' && e.extra && e.extra.subjectKind && (e.occurredAt || '').slice(0, 10) >= from && (e.occurredAt || '').slice(0, 10) <= to);
  const avg = k => { const v = xs.map(e => +e.extra[k]).filter(Boolean); return v.length ? +(sum(v) / v.length).toFixed(1) : null; };
  return {n: xs.length, vividness: avg('vividness'), intensity: avg('intensity')};
}
