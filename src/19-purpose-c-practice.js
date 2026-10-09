/* ============================================================
   THE EYES-CLOSED PRACTICES — affirmation, finitude (and, in time, the
   contemplation and the purpose visualisation)

   The Morning Theatre's nine practices are writing practices. These are the
   other half: you close your eyes, and the screen gets out of the way. One
   timing primitive serves them all — the stillness room's full-screen dark
   arrival, the circle that swells on a ten-second cosine, the same reduced-
   motion behaviour — and the one thing that differs is what is on the page.

   The affirmation screen shows no count of any kind, deliberately: a visible
   count turns a declaration into a task. The five minutes are the point.
   ============================================================ */

/* A sitting: arrival veil, then the dark screen with the circle, the main
   text, a silent elapsed line (no digits), and a way out. Leaving early keeps
   what was done and records the minutes actually sat, capped at the plan. */
function ppSitting(o){
  const go = () => {
    try { if(typeof timeAutoStart === 'function') timeAutoStart({categoryId: 'meditation', feature: o.feature, what: o.what || o.feature}); } catch(e){}
    const total = o.minutes * 60, t0 = Date.now();
    const m = openModal(`<div class="still-run pp-sit" id="ppSit">
      <div class="still-circle" id="ppCircle"><i></i></div>
      <div class="pp-sit-main">${o.main || ''}</div>
      <div class="pp-elapsed" aria-hidden="true"><i id="ppEl"></i></div>
      ${o.extra || ''}
      <button class="btn sm ghost still-end" id="ppEnd">${o.endLabel || 'end the sitting'}</button></div>`, 'wide plain');
    let done = false;
    const calm = typeof reduced === 'function' && reduced();
    const finish = complete => {
      if(done) return; done = true; clearInterval(iv);
      const actual = Math.min(o.minutes, Math.max(0, Math.round((Date.now() - t0) / 60000 * 10) / 10));
      if(complete && typeof sound === 'function') sound('chime');
      const kept = o.onFinish ? o.onFinish(m) : {};
      m.remove();
      try { if(typeof timeAutoStop === 'function') timeAutoStop(o.feature); } catch(e){}
      o.onEnd(Object.assign({actual, complete, planned: o.minutes}, kept || {}));
    };
    const circle = m.querySelector('#ppCircle'), el = m.querySelector('#ppEl');
    const tick = () => {
      const s = (Date.now() - t0) / 1000;
      const p = calm ? .5 : (1 - Math.cos((s % 10) / 10 * Math.PI * 2)) / 2;
      circle.style.setProperty('--p', p.toFixed(3));
      el.style.width = Math.min(100, s / total * 100).toFixed(1) + '%';
      if(s >= total) finish(true);
    };
    const iv = setInterval(tick, 100); tick();
    m.querySelector('#ppEnd').onclick = () => finish(false);
    if(o.onReady) o.onReady(m);
    new MutationObserver(() => { if(!m.isConnected) clearInterval(iv); }).observe(document.body, {childList: true, subtree: true});
  };
  if(o.arrive && typeof ceremonyVeil === 'function') ceremonyVeil(o.arrive, go, {label: o.label || 'a moment before the sitting'}); else go();
}
const ppAfterRedraw = () => { if(S._thSession && typeof thSessionDraw === 'function' && document.querySelector('#thSessionOv')) thSessionDraw(); else rerender(); };

/* ---------- affirmation ---------- */
function ppAffirmChooser(){
  const set = affirmationsAll();
  const next = affirmationNext();
  let pick = next ? next.id : '';
  const offers = affirmationOffers().filter(o => !set.some(a => a.text === o.text));
  let mins = 5;
  const m = openModal(`<h2>An affirmation</h2>
    <p class="faint">A statement said into the mind, over and over, without stopping. It need not be true yet — the mind takes in what it is given, and does not mind how ambitious it is as long as it is drilled in.</p>
    <div class="pp-aff-set" id="affSet"></div>
    ${offers.length ? `<div class="mono faint" style="margin-top:8px">shapes to start from — not prefilled, not the house’s words:</div>
      <div class="pp-aff-offers">${offers.map((o, i) => `<button class="chip" data-affoffer="${i}">${esc(o.label)}</button>`).join('')}</div>` : ''}
    <div class="field" style="margin-top:8px"><label>Write one</label>
      <div class="row" style="gap:6px"><input class="inp" id="affNew" placeholder="in your own words"><button class="btn sm" id="affAdd">add</button></div></div>
    <div class="field"><label>How long</label><div class="row" style="gap:6px">${[5, 10].map(n => `<button class="chip ${n === mins ? 'on' : ''}" data-affmin="${n}">${n} min</button>`).join('')}</div></div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="affBegin">Begin</button></div>`);
  const draw = () => {
    m.querySelector('#affSet').innerHTML = affirmationsAll().length
      ? affirmationsAll().map(a => `<label class="pp-aff-row"><input type="radio" name="aff" value="${a.id}" ${a.id === pick ? 'checked' : ''}>
          <span>${esc(a.text)}</span><span class="mono faint">${a.id === (next && next.id) ? 'next in rotation' : a.lastUsedAt ? 'last ' + esc(fmtDate(a.lastUsedAt.slice(0, 10), 'short')) : 'unused'}</span>
          <button class="del-x inline" data-affdel="${a.id}" title="take this out">×</button></label>`).join('')
      : '<div class="empty">No affirmations yet — write one below.</div>';
    m.querySelectorAll('[name=aff]').forEach(r => r.onchange = () => { pick = r.value; });
    m.querySelectorAll('[data-affdel]').forEach(b => b.onclick = e => { e.preventDefault(); const back = spliceOut(S.affirmations, a => a.id === b.dataset.affdel); saveNow(); if(pick === b.dataset.affdel) pick = ''; draw();
      toast('Taken out.', 6000, {label: 'undo', fn: () => { back(); saveNow(); draw(); }}); });
  };
  draw();
  const add = text => { const a = text.text ? affirmationNew(text.text, text.source, text.sourceId) : affirmationNew(text); if(a){ pick = a.id; draw(); } };
  m.querySelector('#affAdd').onclick = () => { const i = m.querySelector('#affNew'); add(i.value); i.value = ''; };
  m.querySelector('#affNew').onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); m.querySelector('#affAdd').click(); } };
  m.querySelectorAll('[data-affoffer]').forEach(b => b.onclick = () => { add(offers[+b.dataset.affoffer]); b.remove(); });
  m.querySelectorAll('[data-affmin]').forEach(b => b.onclick = () => { mins = +b.dataset.affmin; m.querySelectorAll('[data-affmin]').forEach(x => x.classList.toggle('on', x === b)); });
  m.querySelector('#affBegin').onclick = () => {
    const a = byId(affirmationsAll(), pick) || next; if(!a){ toast('Write one first.'); return; }
    m.remove(); ppAffirmRun(a, mins);
  };
}
/* no counter, no progress ring, no number: a visible count turns a declaration into a task */
const ppAffirmMainHTML = a => `<span class="still-mantra breathing pp-aff-line">${esc(a.text)}</span><p class="mono faint pp-aff-note">Repetition is not counted here, and the screen will not count it for you.</p>`;
function ppAffirmRun(a, minutes){
  ppSitting({minutes, feature: 'affirmation', what: 'affirmation', label: 'an affirmation',
    arrive: ['Close your eyes.', 'Say it into your mind — over and over, without stopping.', `${minutes} minutes. The count is not the point; the minutes are.`],
    main: ppAffirmMainHTML(a),
    endLabel: 'end it here',
    onEnd: info => ppAffirmAfter(a, info)});
}
function ppAffirmAfter(a, info){
  if(info.actual < .1){ toast('Nothing was sat, so nothing was kept.'); ppAfterRedraw(); return; }
  const m = openModal(`<h2>${info.complete ? 'Done' : 'Ended early'} — ${info.actual} minute${info.actual === 1 ? '' : 's'}</h2>
    <div class="field"><label>Anything shift?</label><textarea class="ta" id="affShift" rows="3" placeholder="Leave it empty if nothing did."></textarea></div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="affKeep">Keep it</button></div>`);
  m.querySelector('#affKeep').onclick = () => {
    const shift = m.querySelector('#affShift').value.trim();
    a.lastUsedAt = new Date().toISOString(); a.uses = (a.uses || 0) + 1;
    const e = lifeEntryNew({type: 'affirmation', title: 'Affirmation', body: a.text + (shift ? '\n\n' + shift : ''), tags: ['affirmation'],
      extra: {affirmationId: a.id, minutes: info.actual, planned: info.planned, shift}});
    purposeContact('affirmation', {minutes: info.actual, subjectRef: a.id});
    m.remove(); sound('success'); ppAfterRedraw();
  };
}

/* ---------- finitude: the fifth stillness practice ----------
   The counterweight to a manifesting half made entirely of desire. Two forms,
   chosen at the start. Both file a Memento — kept out of the journals sidebar
   so the practice does not become a collection to browse. */
const FINITUDE_FORMS = {
  urgency: {name: 'Urgency', arrive: ['You will die.', 'Probably not today — and the window in which anything can be built is short.', 'Hold one question.'],
    question: 'What would you stop doing if you took that seriously?'},
  grounding: {name: 'Grounding', arrive: ['Whatever you build will be forgotten.', 'Everything ends in the same place.', 'The course’s claim is that this is a source of strength.'],
    question: ''},
};
function ppFinitude(minutes, form){
  const f = FINITUDE_FORMS[form] || FINITUDE_FORMS.urgency;
  ppSitting({minutes, feature: 'stillness', what: 'finitude', label: 'a sitting on finitude', arrive: f.arrive,
    main: f.question ? `<span class="still-mantra breathing pp-aff-line">${esc(f.question)}</span>` : '',
    onEnd: info => ppFinitudeAfter(form, info)});
}
function ppFinitudeAfter(form, info){
  if(info.actual < .1){ toast('Nothing was sat, so nothing was kept.'); rerender(); return; }
  const f = FINITUDE_FORMS[form] || FINITUDE_FORMS.urgency;
  const m = openModal(`<h2>${info.complete ? 'The sitting is done' : 'Ended early'} — ${info.actual} minute${info.actual === 1 ? '' : 's'}</h2>
    <div class="field"><label>${form === 'urgency' ? 'What would you stop doing?' : 'Anything you want to keep?'}</label>
      <textarea class="ta" id="finNote" rows="3" placeholder="${form === 'urgency' ? '' : 'Leave it empty if there is nothing to keep.'}"></textarea></div>
    <div class="row" style="justify-content:flex-end;gap:8px">${form === 'urgency' ? '<button class="btn ghost" id="finInt">make this today’s intention</button>' : ''}<button class="btn primary" id="finKeep">Keep it</button></div>`);
  const keep = intention => {
    const note = m.querySelector('#finNote').value.trim();
    if(intention){ if(!note){ toast('Write the line first.'); return; } checkin().intention = note; toast('That is today’s intention.'); }
    saveStillSession({kind: 'finitude', planned: info.planned, actual: info.actual, complete: !!info.complete, insight: note, form});
    lifeEntryNew({type: 'memento', title: f.name, body: note, tags: ['finitude'], extra: {form, minutes: info.actual, planned: info.planned, note, becameIntention: !!intention}});
    practiceLogAdd('finitude', {minutes: info.actual, subjectRef: form});
    saveNow(); m.remove(); sound('success'); rerender();
  };
  m.querySelector('#finKeep').onclick = () => keep(false);
  const bi = m.querySelector('#finInt'); if(bi) bi.onclick = () => keep(true);
}
const mementoOn = d => S.entries.some(e => e.type === 'memento' && (e.occurredAt || '').slice(0, 10) === d);
if(typeof registerDuty === 'function') registerDuty({
  id: 'finitude_sitting', label: 'Sit with finitude', anchor: '[data-duty-id="stillness_practice"]', route: '#/today',
  windowDef: {type: 'before-sleep', startOffset: -90, endOffset: 60}, recurrence: {type: 'daily'},
  skipDone: true, notify: false, defaultOn: true, doneCheck: T => mementoOn(T),
});

/* ---------- a guided flow with its own last button ----------
   The review flows end on "Close the review", which is wrong for a challenge
   or a wizard. Same shape and same look: steps of {title, hint, body, bind,
   next}, a step counter, back and next. `next(body)` may return false to hold
   the person on the step (and say why with a toast). */
function ppFlow(title, steps, onDone, {finish = 'Done', big = true, startAt = 0, onStep = null} = {}){
  let i = Math.max(0, Math.min(steps.length - 1, startAt | 0));
  const m = openModal('', big ? 'wide' : '');
  const draw = () => {
    const st = steps[i];
    if(onStep) onStep(i);
    m.querySelector('.modal').innerHTML = `<button class="close">×</button>
      <div class="mono">${esc(title)} · ${i + 1} of ${steps.length}</div>
      <h2 style="margin:4px 0 6px">${esc(st.title)}</h2>
      ${st.hint ? `<p class="muted" style="font-size:.88rem;margin:0 0 12px">${st.hint}</p>` : ''}
      <div class="flow-body" id="flowBody">${typeof st.body === 'function' ? (st.body() || '') : (st.body || '')}</div>
      <div class="flow-dots">${steps.map((_, k) => `<i class="${k === i ? 'on' : k < i ? 'past' : ''}"></i>`).join('')}</div>
      <div class="row between" style="margin-top:14px">
        <span>${i ? '<button class="btn sm ghost" id="fwBack">back</button>' : ''}</span>
        <button class="btn primary" id="fwNext">${i === steps.length - 1 ? esc(finish) : 'Next'}</button></div>`;
    m.querySelector('.close').onclick = () => m.remove();
    const body = m.querySelector('#flowBody');
    body.querySelectorAll('.rv').forEach(n => n.classList.add('in'));
    if(st.bind) st.bind(body, m);
    if(m.querySelector('#fwBack')) m.querySelector('#fwBack').onclick = () => { if(st.next) st.next(body, true); i--; draw(); };
    m.querySelector('#fwNext').onclick = () => {
      if(st.next && st.next(body) === false) return;
      if(i === steps.length - 1){ m.remove(); if(onDone) onDone(); return; }
      i++; draw();
    };
    if(typeof attachDictationIn === 'function') attachDictationIn(m);
  };
  draw();
  return m;
}
