/* ============================================================
   THE COACH, FOR YOURSELF — questions you ask you

   In the rescue space you are your own coach: a question appears on the page as
   a box, and you answer it by writing. Which question is chosen by rule, and the
   rule is shown ("you wrote 'tired' · it is late"): the scenario you name (or
   the ones the page's own words point to), the words a question is waiting for,
   the hour, how far into the sitting you are, and what you have already been
   asked. Nothing is generated while you wait.

   The questions come from a bank. A starter bank ships here. A far stronger AI can
   write a much larger one AHEAD of time: "Write the questions…" builds a prompt
   from what this site is and offers now (its rooms, its doors, its scenarios, what
   the bank already covers), and what comes back is pasted in and checked. At use
   time a very specific question is simply looked up for the very specific moment.
   ============================================================ */

const RS_STAGES = ['open', 'explore', 'decide', 'close'];
const RS_KINDS = ['open', 'choose', 'scale', 'body', 'reframe', 'action', 'name-it'];
const RS_TONES = ['plain', 'warm', 'playful', 'firm'];
const RS_BANK_FORMAT = 'overwhelm-rescue-questions';

/* the starter bank: [id, text, scenarios, {triggers, stage, depth, kind, exit, time, followups, use}] */
const _Q = (id, text, scenarios, o = {}) => Object.assign({id, text, scenarios, triggers: [], stage: 'explore', depth: 1, kind: 'open', horizon: 'any', tone: 'plain', followups: [], use_when: '', suggest_exit: 'none', time_of_day: ['any'], source: 'builtin'}, o);
const RESCUE_STARTER = [
  _Q('b-tm-1', 'If only three of these were allowed to be real tonight, which three?', ['too-much'], {stage: 'open', kind: 'choose', followups: ['b-tm-3'], use_when: 'the page has a lot on it'}),
  _Q('b-tm-2', 'Which of these are facts about the world, and which are things your mind keeps replaying?', ['too-much', 'feeling'], {kind: 'name-it', use_when: 'a lot of it may be noise'}),
  _Q('b-tm-3', 'Which one of these, if handled, would make two others easier or unnecessary?', ['too-much', 'priorities'], {depth: 2, kind: 'choose', followups: ['b-tm-5'], use_when: 'looking for the knot'}),
  _Q('b-tm-4', 'Which of these have a real date on them, and which only feel urgent?', ['too-much', 'deadline'], {triggers: ['urgent', 'asap', 'everything'], kind: 'name-it'}),
  _Q('b-tm-5', 'What is the smallest slice of all this you could finish in the next twenty-five minutes?', ['too-much', 'stuck'], {stage: 'decide', kind: 'action', suggest_exit: 'task', use_when: 'time to choose a first move'}),
  _Q('b-tm-6', 'What are you willing to leave exactly as it is until tomorrow?', ['too-much', 'tired-sleep'], {stage: 'close', kind: 'choose', suggest_exit: 'letgo', time_of_day: ['evening', 'night']}),
  _Q('b-tm-7', 'Which of these belong to someone else to decide, or to carry?', ['too-much', 'people'], {depth: 2, kind: 'name-it', suggest_exit: 'letgo'}),
  _Q('b-li-1', 'What were you about to do before this in-between feeling started?', ['liminal'], {stage: 'open', triggers: ['limbo', 'wasting'], use_when: 'the limbo itself is the problem'}),
  _Q('b-li-2', 'What is the gentlest thing you could start in the next two minutes, just to be out of the in-between?', ['liminal', 'stuck'], {stage: 'decide', kind: 'action', suggest_exit: 'task'}),
  _Q('b-li-3', 'What is this limbo protecting you from having to begin?', ['liminal', 'stuck'], {depth: 2, tone: 'warm'}),
  _Q('b-li-4', 'How long are you willing to stay in the in-between — and what happens when that time is up?', ['liminal'], {stage: 'close', kind: 'choose', suggest_exit: 'remind'}),
  _Q('b-dl-1', 'What exactly is due, to whom, and what would "good enough to hand in" look like?', ['deadline'], {stage: 'open', triggers: ['deadline', 'due', 'submit'], use_when: 'a deadline is pressing'}),
  _Q('b-dl-2', 'What part of this can only be done by you, and what part is only habit that it is you?', ['deadline', 'too-much'], {depth: 2, kind: 'name-it'}),
  _Q('b-dl-3', 'If the deadline were an hour earlier, what would you cut?', ['deadline', 'perfection'], {depth: 2, tone: 'firm', kind: 'choose'}),
  _Q('b-dl-4', 'Working backwards from the due time: what has to be true by tonight, and what can wait for tomorrow morning?', ['deadline', 'tired-sleep'], {stage: 'decide', horizon: 'tonight', kind: 'choose', suggest_exit: 'task'}),
  _Q('b-dl-5', 'If it were late, what would that actually cost you, in plain terms — and how likely is it?', ['deadline', 'feeling'], {kind: 'scale', tone: 'plain', use_when: 'the stakes may be inflated'}),
  _Q('b-dl-6', 'What is the very first physical action — which file open, which sentence typed?', ['deadline', 'stuck'], {stage: 'close', kind: 'action', suggest_exit: 'task'}),
  _Q('b-ts-1', 'If a friend told you they were this tired and wanted to push on, what would you say to them?', ['tired-sleep', 'broken-promise'], {stage: 'open', triggers: ['tired', 'stay up', 'sleepy'], tone: 'warm', time_of_day: ['evening', 'night'], use_when: 'you are tired and weighing staying up'}),
  _Q('b-ts-2', 'What does finishing it tonight buy you that tomorrow morning could not, in concrete terms?', ['tired-sleep', 'deadline'], {triggers: ['tonight', 'stay up', 'finish'], kind: 'name-it'}),
  _Q('b-ts-3', 'How would you expect the work to go at this level of tiredness — and what would you have to redo?', ['tired-sleep', 'perfection'], {depth: 2, kind: 'scale', time_of_day: ['evening', 'night']}),
  _Q('b-ts-4', 'Is there a version of tonight that honours both: say, thirty minutes on the first step, then bed?', ['tired-sleep', 'broken-promise'], {stage: 'decide', kind: 'choose', suggest_exit: 'decision', time_of_day: ['evening', 'night']}),
  _Q('b-ts-5', 'What did the last late night like this cost you the next day?', ['tired-sleep', 'body'], {depth: 2, kind: 'reframe', use_when: 'your own records can answer it'}),
  _Q('b-ts-6', 'What would you need to set up now so that going to bed feels like a plan and not a failure?', ['tired-sleep', 'broken-promise'], {stage: 'close', kind: 'action', suggest_exit: 'remind', time_of_day: ['evening', 'night']}),
  _Q('b-ts-7', 'The sleep schedule you are building: what is it worth to you, set beside this one task?', ['tired-sleep', 'long-term'], {depth: 2, kind: 'reframe', tone: 'firm'}),
  _Q('b-bp-1', 'When you said "however late", who were you speaking to — and is that the person sitting here now?', ['broken-promise', 'tired-sleep'], {stage: 'open', triggers: ['however late', 'i said i would', 'promised', 'i will do tonight'], tone: 'warm'}),
  _Q('b-bp-2', 'What did you want the promise to protect — the task, or your sense of being someone who follows through?', ['broken-promise', 'perfection'], {depth: 2, kind: 'name-it'}),
  _Q('b-bp-3', 'How could you change the promise out loud, in a way you would respect, rather than just breaking it?', ['broken-promise'], {stage: 'decide', kind: 'action', suggest_exit: 'journal', use_when: 'a promise to yourself is in the way'}),
  _Q('b-bp-4', 'If you kept this promise tonight at the cost of tomorrow, would you be keeping faith with yourself, or with the plan?', ['broken-promise', 'tired-sleep'], {depth: 2, kind: 'reframe'}),
  _Q('b-pe-1', 'Who is waiting on you, and what is the one sentence they actually need from you?', ['people'], {stage: 'open', triggers: ['reply', 'text back', 'owe'], kind: 'name-it', suggest_exit: 'person'}),
  _Q('b-pe-2', 'What are you imagining they will think if you answer late — and what do you actually know?', ['people', 'feeling'], {kind: 'name-it', tone: 'warm'}),
  _Q('b-pe-3', 'What is the shortest message that would be honest and kind?', ['people'], {stage: 'decide', kind: 'action', suggest_exit: 'person'}),
  _Q('b-pe-4', 'Is there a conversation you are avoiding that is making everything else heavier?', ['people', 'stuck'], {depth: 2, tone: 'warm'}),
  _Q('b-pe-5', 'Which relationship on this page needs a decision, and which just needs a little time?', ['people', 'decide'], {depth: 2, kind: 'choose'}),
  _Q('b-lt-1', 'If nothing changed for a year, what would you most regret not having started?', ['long-term'], {stage: 'open', depth: 2, tone: 'warm', horizon: 'later'}),
  _Q('b-lt-2', 'Which of these long-term things is a direction, and which is a to-do in disguise?', ['long-term', 'priorities'], {kind: 'name-it'}),
  _Q('b-lt-3', 'What is the smallest thing you could do this week that points the right way?', ['long-term'], {stage: 'decide', kind: 'action', suggest_exit: 'goal'}),
  _Q('b-lt-4', 'What would you do with this part of your life if no one were watching?', ['long-term', 'feeling'], {depth: 3, tone: 'warm'}),
  _Q('b-lt-5', 'Which long-term thing do you want to think about on a schedule — for how long a day, and when?', ['long-term', 'daily-thread'], {stage: 'close', kind: 'choose', suggest_exit: 'thread'}),
  _Q('b-dt-1', 'What is the question you keep returning to every day, in its simplest form?', ['daily-thread'], {stage: 'open', triggers: ['every day', 'keep thinking'], suggest_exit: 'question'}),
  _Q('b-dt-2', 'What would "a little thought a day" look like: ten minutes, at what time, with what in front of you?', ['daily-thread'], {stage: 'decide', kind: 'action', suggest_exit: 'thread'}),
  _Q('b-dt-3', 'What has changed in how you see it since the last time you gave it real thought?', ['daily-thread', 'long-term'], {depth: 2}),
  _Q('b-dt-4', 'What is today’s one sentence of progress on it?', ['daily-thread'], {stage: 'close', kind: 'action', suggest_exit: 'journal'}),
  _Q('b-fe-1', 'If this feeling had a shape, or a kind of weather, what would it be?', ['feeling'], {stage: 'open', kind: 'name-it', tone: 'warm'}),
  _Q('b-fe-2', 'Where do you feel it in your body, right now?', ['feeling', 'body'], {kind: 'body', tone: 'warm'}),
  _Q('b-fe-3', 'What might the feeling be protecting you from, or warning you about?', ['feeling'], {depth: 2, tone: 'warm'}),
  _Q('b-fe-4', 'Is this feeling about now, or an old pattern wearing a new date?', ['feeling'], {depth: 3, kind: 'reframe'}),
  _Q('b-fe-5', 'Given that you feel this way, what would be kind to do for the next hour?', ['feeling', 'body'], {stage: 'close', kind: 'action', tone: 'warm'}),
  _Q('b-st-1', 'What is it about starting this that you are avoiding — the work, or what it might say about you?', ['stuck'], {stage: 'open', depth: 2, triggers: ['avoid', 'putting off', 'procrastinat']}),
  _Q('b-st-2', 'What is the tiniest version that still counts — and could you do it badly, on purpose?', ['stuck', 'perfection'], {stage: 'decide', kind: 'action', suggest_exit: 'task'}),
  _Q('b-st-3', 'If you had to start in the next two minutes, with a timer, what would you open first?', ['stuck'], {stage: 'close', kind: 'action', suggest_exit: 'task'}),
  _Q('b-st-4', 'What would make starting easier: a different place, a different hour, someone beside you?', ['stuck'], {kind: 'choose'}),
  _Q('b-pf-1', 'Whose standard is this — and would they set it that high for a friend?', ['perfection'], {stage: 'open', triggers: ['perfect', 'not good enough'], kind: 'reframe'}),
  _Q('b-pf-2', 'What does done look like at eighty per cent — and what would the missing twenty cost?', ['perfection', 'deadline'], {kind: 'scale'}),
  _Q('b-pf-3', 'What is one thing you could deliberately leave imperfect today?', ['perfection'], {stage: 'decide', kind: 'action', suggest_exit: 'letgo'}),
  _Q('b-ma-1', 'Which one admin item, if done, would lift the most weight — and how long would it truly take?', ['money-admin'], {stage: 'open', kind: 'choose', suggest_exit: 'task'}),
  _Q('b-ma-2', 'Which of these could be batched into a single forty-minute sitting?', ['money-admin', 'too-much'], {stage: 'decide', kind: 'choose', suggest_exit: 'task'}),
  _Q('b-ma-3', 'What are you afraid you might find out when you open it?', ['money-admin', 'stuck', 'feeling'], {depth: 2, tone: 'warm'}),
  _Q('b-bo-1', 'Before the work: have you eaten, had water, moved, and had a real break today?', ['body'], {stage: 'open', kind: 'body', tone: 'warm', triggers: ['tired', 'headache', 'hungry']}),
  _Q('b-bo-2', 'What does your body need that today’s plan has not made room for?', ['body', 'tired-sleep'], {kind: 'body', depth: 2}),
  _Q('b-bo-3', 'What is the least you could do for your body in the next ten minutes?', ['body', 'feeling'], {stage: 'close', kind: 'action', suggest_exit: 'task'}),
  _Q('b-pr-1', 'If you could keep only one thing from this week, what would it be?', ['priorities'], {stage: 'open', kind: 'choose'}),
  _Q('b-pr-2', 'What would you be proud to have done by Friday — and is today’s plan heading there?', ['priorities', 'long-term'], {depth: 2, horizon: 'week'}),
  _Q('b-pr-3', 'What are you saying yes to, by saying no to this?', ['priorities', 'decide'], {stage: 'decide', kind: 'reframe'}),
  _Q('b-pr-4', 'What is urgent only because someone else decided it was?', ['priorities', 'people'], {depth: 2, kind: 'name-it', suggest_exit: 'letgo'}),
  _Q('b-de-1', 'What are the real options, including the one you rejected fastest?', ['decide'], {stage: 'open', triggers: ['should i', 'or should', 'whether'], suggest_exit: 'decision'}),
  _Q('b-de-2', 'What do you know, and what are you assuming?', ['decide'], {kind: 'name-it'}),
  _Q('b-de-3', 'Can this be undone? If you chose wrong, what would it cost, and how soon would you find out?', ['decide'], {kind: 'scale', depth: 2}),
  _Q('b-de-4', 'What would you choose if you were not afraid of what people would think?', ['decide', 'feeling'], {depth: 3, tone: 'warm'}),
  _Q('b-de-5', 'What does not deciding cost you by tomorrow?', ['decide', 'tired-sleep'], {stage: 'decide', kind: 'scale'}),
  _Q('b-de-6', 'What do you need to know before deciding — and who or what could tell you, by when?', ['decide'], {stage: 'close', kind: 'action', suggest_exit: 'decision'}),
];
RESCUE_STARTER.forEach(q => { q.scenarios.forEach(sc => { /* a typo here would be a question nothing can reach */ if(!RESCUE_SCENARIOS.some(x => x.id === sc)) console.warn('starter question', q.id, 'names an unknown scenario', sc); }); });

/* ---------- the bank: the starter, and whatever has been imported ---------- */
const rescueBankRows = () => lifeArray('rescueBank');
function rescueBankAll(){
  const off = new Set(((S.settings || {}).rescueCoach || {}).off || []);
  const mine = rescueBankRows().filter(r => r.enabled !== false && !off.has(r.batch)).map(r => Object.assign({}, r, {id: r.id}));
  return RESCUE_STARTER.concat(mine);
}
function rescueCoachState(){
  const s = S.settings = S.settings || {};
  const c = s.rescueCoach = s.rescueCoach || {};
  c.skip = Array.isArray(c.skip) ? c.skip : []; c.recent = Array.isArray(c.recent) ? c.recent : []; c.off = Array.isArray(c.off) ? c.off : [];
  return c;
}
function rescueDayPeriod(){ const h = new Date().getHours(); return h >= 23 || h < 5 ? 'night' : h < 11 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; }

/* ---------- choosing: a rule, and the reason shown ---------- */
function rescuePickQuestion(s, o = {}){
  const bank = rescueBankAll(), c = rescueCoachState(), text = rescueText(s).toLowerCase();
  const asked = new Set(((s.coach || {}).asked || []).map(x => x.id)), skippedHere = new Set(((s.coach || {}).skipped || []));
  const inferred = rescueScenarios(s).slice(0, 3).map(x => x.id);
  const want = o.scenario ? [o.scenario] : inferred;
  const per = rescueDayPeriod(), n = asked.size;
  const stageNow = n < 2 ? 'open' : n < 4 ? 'explore' : n < 6 ? 'decide' : 'close';
  const wantStage = o.stage || stageNow;
  const lastId = o.after || null, last = lastId ? bank.find(q => q.id === lastId) : null;
  const hzs = new Set((s.boxes || []).map(b => b.horizon).filter(Boolean));
  const scored = bank.filter(q => !asked.has(q.id) && !skippedHere.has(q.id) && !c.skip.includes(q.id)).map(q => {
    let sc = 0; const why = [];
    const hit = (q.scenarios || []).filter(x => want.includes(x));
    if(hit.length){ sc += hit.length * 4; const nm = RESCUE_SCENARIOS.find(x => x.id === hit[0]); why.push(o.scenario ? `you said it is about ${nm ? nm.name : hit[0]}` : `the page reads as ${nm ? nm.name : hit[0]}`); }
    else if(want.length) sc -= 3;
    const tr = (q.triggers || []).filter(t => t && text.includes(String(t).toLowerCase()));
    if(tr.length){ sc += tr.length * 2.5; why.push(`you wrote “${tr[0]}”`); }
    if((q.time_of_day || ['any']).includes(per)){ sc += 2; why.push(per === 'night' ? 'it is late' : per === 'morning' ? 'it is morning' : per === 'evening' ? 'it is evening' : 'it is afternoon'); }
    else if(!(q.time_of_day || ['any']).includes('any')) sc -= 4;
    if(q.stage === wantStage){ sc += 1.6; } else if(o.stage) sc -= 2;
    const depthWant = o.deeper ? Math.min(3, (last ? last.depth : 1) + 1) : (n >= 3 ? 2 : 1);
    sc += q.depth === depthWant ? 1.2 : q.depth > depthWant + 1 ? -2 : 0;
    if(q.horizon && q.horizon !== 'any' && hzs.has(q.horizon)){ sc += 1.2; }
    if(last && (last.followups || []).includes(q.id)){ sc += 6; why.unshift('it follows the last one'); }
    if(c.recent.includes(q.id)) sc -= 3;
    sc += Math.random() * .8;
    return {q, sc, why};
  }).sort((a, b) => b.sc - a.sc);
  const top = scored[0]; if(!top) return null;
  return {q: top.q, why: top.why.slice(0, 3).join(' · ') || 'it fits where the page is'};
}

/* ---------- on the page ---------- */
function rescueCoachOpen(root){
  if(!_rs) return;
  const found = rescueScenarios(_rs.sheet).slice(0, 3);
  const m = openModal(`<h2>Ask me something</h2>
    <p class="muted" style="font-size:.9rem">One question, on the page, for you to answer by writing. Say what this is mostly about, or let the page’s own words decide.</p>
    <div class="chip-row" id="rcSc">${RESCUE_SCENARIOS.map(sc => `<button class="chip click${found.some(f => f.id === sc.id) ? ' on' : ''}" data-sc="${sc.id}">${esc(sc.name)}</button>`).join('')}</div>
    <div class="row" style="gap:8px;margin-top:14px;justify-content:space-between;flex-wrap:wrap">
      <button class="tbtn" id="rcBank">The question bank…</button>
      <span class="row" style="gap:8px"><button class="btn ghost" id="rcAuto">Let the page decide</button></span></div>
    ${found.length ? `<p class="faint sm">The page reads as: ${found.map(f => esc(f.name)).join(' · ')}.</p>` : '<p class="faint sm">The page has too few words to read yet; pick one above.</p>'}`, 'narrow');
  const go = sc => { m.remove(); rescueAskOnPage(root, {scenario: sc || ''}); };
  m.querySelectorAll('[data-sc]').forEach(b => b.onclick = () => go(b.dataset.sc));
  m.querySelector('#rcAuto').onclick = () => go('');
  m.querySelector('#rcBank').onclick = () => { m.remove(); rescueBankDialog(); };
}
function rescueAskOnPage(root, o = {}, replaceBox = null){
  if(!_rs) return;
  if(_rs.sheet._virtual && _rs.sheetNow) _rs.sheetNow();
  const s = _rs.sheet;
  const pick = rescuePickQuestion(s, o);
  if(!pick){ toast('No more questions fit this page — import more, or start a fresh page.'); return; }
  const st = rescueQ('#rsStage', root), mx = Math.max(0, ...rescueLive(s).map(b => b.y + 70));
  let b = replaceBox;
  if(b){ b.q = {id: pick.q.id, text: pick.q.text, why: pick.why, exit: pick.q.suggest_exit}; }
  else {
    b = rescueBoxNew(s, 60 + Math.random() * 120, Math.max(st.scrollTop + 90, Math.min(mx + 30, st.scrollTop + st.clientHeight - 240)), '');
    b.kind = 'question'; b.font = 'garamond'; b.q = {id: pick.q.id, text: pick.q.text, why: pick.why, exit: pick.q.suggest_exit};
  }
  s.coach = s.coach || {asked: [], skipped: []};
  s.coach.asked.push({id: pick.q.id, at: new Date().toISOString(), boxId: b.id});
  const c = rescueCoachState(); c.recent = [pick.q.id].concat(c.recent).slice(0, 40);
  rescueTouch(s);
  rescuePaintAll(root);
  const el = root.querySelector(`[data-rsb="${b.id}"]`);
  if(el){ const w = el.querySelector('.rs-qwhy'); if(w) w.textContent = pick.why; el.scrollIntoView({block: 'nearest', behavior: 'smooth'}); el.querySelector('.rs-ta').focus(); }
  save();
}
function rescueCoachAct(root, b, act){
  if(!b || !_rs) return;
  const s = _rs.sheet, was = b.q && b.q.id;
  /* taking the box away: nothing replaces it. What was written in it goes with it, and comes back with the undo. */
  if(act === 'remove'){
    const i = s.boxes.indexOf(b); if(i < 0) return;
    s.boxes.splice(i, 1); rescueTouch(s); rescuePaintAll(root);
    const h = root.querySelector('.rs-hint'); if(h && !rescueLive(s).length) h.hidden = false;
    toast('Question removed.', 7000, {label: 'undo', fn: () => { s.boxes.splice(Math.min(i, s.boxes.length), 0, b); rescueTouch(s); if(_rs && _rs.sheet === s) rescuePaintAll(root); }});
    return;
  }
  s.coach = s.coach || {asked: [], skipped: []};
  if(act === 'skip'){ const c = rescueCoachState(); if(was) c.skip.push(was); }
  if(was && (act === 'another' || act === 'skip')) s.coach.skipped.push(was);
  rescueAskOnPage(root, {after: was, deeper: act === 'deeper', scenario: ''}, b);
  if(act === 'deeper' || act === 'another') { /* keep the answer written so far where it is: it is the user's */ }
}

/* ---------- the bank, as a room of its own ---------- */
function rescueBankDialog(){
  const rows = rescueBankRows(), c = rescueCoachState();
  const batches = {}; rows.forEach(r => { (batches[r.batch] = batches[r.batch] || {id: r.batch, label: r.batchLabel || 'an import', at: r.at, n: 0}).n++; });
  const cover = RESCUE_SCENARIOS.map(sc => ({sc, n: rescueBankAll().filter(q => (q.scenarios || []).includes(sc.id)).length}));
  const m = openModal(`<h2>The question bank</h2>
    <p class="muted" style="font-size:.88rem"><b>${rescueBankAll().length}</b> questions in use: ${RESCUE_STARTER.length} that ship with the house, and ${rows.length} imported. The coach picks from all of them by rule and says why.</p>
    <div class="rs-cover">${cover.map(x => `<span class="chip sm${x.n < 5 ? ' warn' : ''}" title="${esc(x.sc.name)}">${esc(x.sc.name)} <b class="mono">${x.n}</b></span>`).join('')}</div>
    <h3 style="margin:14px 0 4px;font-size:.95rem">Imported batches</h3>
    ${Object.values(batches).length ? Object.values(batches).sort((a, b) => String(b.at).localeCompare(String(a.at))).map(b => `<div class="rs-bt"><span><b>${esc(b.label)}</b> <span class="faint">${b.n} questions · ${esc(fmtDate((b.at || '').slice(0, 10), 'med'))}</span></span>
      <span><label class="row" style="gap:4px"><input type="checkbox" data-on="${esc(b.id)}" ${c.off.includes(b.id) ? '' : 'checked'}><span class="faint sm">in use</span></label> <button class="tbtn danger" data-del="${esc(b.id)}">remove</button></span></div>`).join('') : '<p class="faint sm">None yet.</p>'}
    <div class="row" style="gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn primary" id="rbPrompt">Write the questions with my AI…</button><button class="btn" id="rbImport">Paste what it wrote…</button></div>`, 'wide');
  m.querySelectorAll('[data-on]').forEach(x => x.onchange = () => { const id = x.dataset.on; c.off = c.off.filter(y => y !== id); if(!x.checked) c.off.push(id); save(); });
  m.querySelectorAll('[data-del]').forEach(x => x.onclick = () => { const id = x.dataset.del, mine = rescueBankRows().filter(r => r.batch === id);
    const keep = S.rescueBank.filter(r => r.batch !== id), was = S.rescueBank.slice(); S.rescueBank = keep; const undo = () => { S.rescueBank = was; }; saveNow(); m.remove(); toast(`Removed ${mine.length} questions.`, 8000, {label: 'undo', fn: () => { undo(); saveNow(); }}); });
  m.querySelector('#rbPrompt').onclick = () => { m.remove(); rescuePromptDialog(); };
  m.querySelector('#rbImport').onclick = () => { m.remove(); rescueImportDialog(); };
}

/* ---------- the prompt for a stronger AI ----------
   Built from what is true of this house now, so it never goes stale: the rooms,
   the doors out of the space, the scenarios, the schema, and what the bank already
   covers (so the AI fills the gaps rather than repeating). Personal names go in only
   if you ask. */
function rescuePromptText(o = {}){
  const rooms = Object.values(typeof NAV_PAGES !== 'undefined' ? NAV_PAGES : {}).map(p => p.label).filter(Boolean);
  const cover = RESCUE_SCENARIOS.map(sc => `- ${sc.id} — ${sc.name} (${rescueBankAll().filter(q => (q.scenarios || []).includes(sc.id)).length} questions so far)`).join('\n');
  const lists = [];
  if(o.names){
    try { const ls = planLists().filter(l => !l.archivedAt && l.id !== 'inbox').map(l => l.name); if(ls.length) lists.push('Task lists / projects: ' + ls.join('; ')); } catch(e){}
    try { const vs = (S.valueOrder || []).map(id => (byId(S.values, id) || {}).name).filter(Boolean); if(vs.length) lists.push('Values: ' + vs.join('; ')); } catch(e){}
    try { const hs = (S.habits || []).filter(h => !h.archived).map(h => h.name); if(hs.length) lists.push('Habits: ' + hs.join('; ')); } catch(e){}
    try { const sk = (S.skills || []).map(x => x.name); if(sk.length) lists.push('Skills: ' + sk.join('; ')); } catch(e){}
    try { const gs = (typeof perfGoals === 'function' ? perfGoals() : []).filter(g => g.status === 'active').map(g => g.text || g.title || g.name); if(gs.length) lists.push('Active goals: ' + gs.join('; ')); } catch(e){}
  }
  const sample = JSON.stringify({format: RS_BANK_FORMAT, version: 1, questions: [
    {id: 'tired-promise-1', text: 'When you said you would finish this however late, who were you speaking to — and is that the person sitting here now?', scenarios: ['broken-promise', 'tired-sleep'],
     triggers: ['however late', 'stay up', 'i said i would'], stage: 'open', depth: 2, kind: 'reframe', horizon: 'tonight', tone: 'warm', followups: ['tired-promise-2'],
     use_when: 'a promise made to yourself collides with being tired', avoid_when: 'a real external deadline is hours away', suggest_exit: 'decision', time_of_day: ['evening', 'night']},
    {id: 'tired-promise-2', text: 'What is the smallest version of the promise you could keep tonight and still be kind to tomorrow’s you?', scenarios: ['broken-promise', 'tired-sleep'],
     triggers: [], stage: 'decide', depth: 1, kind: 'action', horizon: 'tonight', tone: 'plain', followups: [], use_when: 'after the first question, when it is time to choose', avoid_when: '', suggest_exit: 'task', time_of_day: ['evening', 'night']}]}, null, 1);
  return `You are helping me build a bank of QUESTIONS for a feature of my personal life-management web app. I will paste your output into the app, which checks it and uses the questions later, one at a time, at the right moment. Please do the thinking now, once, as well as you can.

# What the app is
A private, single-user, offline-first "life instrument". Its rooms: ${rooms.join(', ') || 'Today, Planning, Journals, Habits, People, Time tracking, Study Deck, Knowledge Tree'}. I live in it daily: tasks and lists with estimates and dates, milestones, a weekly plan with goals and "threads" (things to do or contemplate on chosen days), habits, time tracking, a journal (reflections, decisions, open questions), people with contact rhythms, values, purpose, sleep and wake logs.

# The feature the questions are for: the Overwhelm Rescue Space
I use it when my head is a tangle: long-term worries, short-term tasks, a pressing deadline, something that needs a little thought every day, tiredness, a promise I made to myself, people I owe a reply. It is a blank page where I write loose keywords in boxes. I want to be MY OWN LIFE COACH there. When I ask, one question appears as a box on the page and I answer it by writing. Afterwards I can send any words to a task, a thread of the week, a journal entry, a decision, a person, a reminder, a parked thought, a line to keep, or let them go.

# What I need from you
Questions a very good coach would ask a thoughtful adult in that exact moment — specific, concrete and varied. NOT generic self-help, NOT advice, NOT cheerleading, NOT preachy, NOT therapy-speak, NOT diagnosing. Each question is for me to answer in writing, so it should be answerable in a few lines. Use the second person. Prefer concrete wording over abstract ("which file would you open?" beats "what is your next step?"). Mix: names-it, choose-between, reframe, scale 0–10, body check-in, one tiny action, and the occasional playful one. Use techniques from GROW, motivational interviewing, ACT, solution-focused and CBT questioning, the Eisenhower matrix, premortem, "what would you tell a friend", etc., but never name the technique. Chain them: a question can list follow-up ids that deepen it.

Write for these scenarios (use exactly these ids). Aim for at least ${o.perScenario || 10} questions per scenario, across all four stages and all three depths, plus questions that sit across two scenarios:
${cover}

Stages: open (first, loosening), explore (understanding), decide (choosing), close (landing a next step or putting something down).
Depth: 1 light · 2 more searching · 3 hard, only when asked to go deeper.
Kinds: ${RS_KINDS.join(' | ')}. Tones: ${RS_TONES.join(' | ')}. Horizons: now | tonight | week | later | always | any.
Doors the answer can go to (suggest_exit): task, goal, thread, journal, decision, question, person, remind, park, mindset, letgo, none.
time_of_day: any of morning, afternoon, evening, night, or "any".

# Output format (strict)
Return ONLY one JSON object, no commentary, no markdown fences:
{ "format": "${RS_BANK_FORMAT}", "version": 1, "questions": [ ... ] }
Each question has: id (short unique slug), text (one question, ≤ 220 characters), scenarios (1–3 ids from the list), triggers (0–6 lowercase words or phrases that, if they appear on my page, make this question fit better), stage, depth, kind, horizon, tone, followups (ids of other questions in this output, or []), use_when (one sentence the app shows as the reason it chose this), avoid_when (when NOT to use it; may be ""), suggest_exit, time_of_day (array).
If you cannot fit them all in one reply, give complete valid JSON with up to ${o.perMessage || 60} questions, then wait; I will say "next" and you continue with new questions (never repeat one).

Example of two linked questions (do not copy them):
${sample}
${o.context ? `\n# About me (use this to be specific, never to flatter)\n${o.context.trim()}\n` : ''}${lists.length ? `\n# What is on my plate in the app (names only)\n${lists.join('\n')}\n` : ''}
Total wanted this time: about ${o.total || 120} questions. Begin.`;
}
function rescuePromptDialog(){
  const m = openModal(`<h2>Write the questions with my AI</h2>
    <p class="muted" style="font-size:.88rem">This builds a prompt from what the house is and offers <em>now</em> — its rooms, the doors out of the space, the scenarios, and which scenarios the bank is thin on. Copy it into your strongest AI, then paste what it writes back.</p>
    <div class="grid c2" style="gap:10px"><label class="pd-q"><span class="k">how many in total</span><input class="inp" id="rpTotal" type="number" min="20" max="400" value="120"></label>
      <label class="pd-q"><span class="k">at least, per scenario</span><input class="inp" id="rpPer" type="number" min="3" max="30" value="10"></label></div>
    <label class="pd-q"><span class="k">about me, for the AI (optional — what is hard, what helps, how I think)</span><textarea class="ta" id="rpCtx" style="min-height:70px" placeholder="e.g. I overthink and then lose the evening; I respond to blunt, short questions; I'm a law student with an application due; I want to fix my sleep schedule…"></textarea></label>
    <label class="row" style="gap:8px;margin:8px 0"><input type="checkbox" id="rpNames"> <span class="faint sm">include the names of my lists, values, habits, skills and goals, so the questions can be about my real life</span></label>
    <textarea class="ta mono" id="rpOut" readonly style="min-height:240px;font-size:.78rem"></textarea>
    <div class="row" style="gap:8px;margin-top:10px;justify-content:space-between;flex-wrap:wrap"><span class="faint sm" id="rpMeta"></span>
      <span class="row" style="gap:8px"><button class="btn" id="rpDl">Save as a file</button><button class="btn primary" id="rpCopy">Copy the prompt</button><button class="btn" id="rpNext">I have the answer →</button></span></div>`, 'wide');
  const draw = () => { const t = rescuePromptText({total: +m.querySelector('#rpTotal').value || 120, perScenario: +m.querySelector('#rpPer').value || 10,
      context: m.querySelector('#rpCtx').value, names: m.querySelector('#rpNames').checked});
    m.querySelector('#rpOut').value = t; m.querySelector('#rpMeta').textContent = `${t.length.toLocaleString()} characters`; return t; };
  ['#rpTotal', '#rpPer', '#rpCtx', '#rpNames'].forEach(s => { m.querySelector(s).oninput = draw; m.querySelector(s).onchange = draw; });
  draw();
  m.querySelector('#rpCopy').onclick = async () => { const t = draw(); try { await navigator.clipboard.writeText(t); toast('Copied. Paste it into your AI.'); } catch(e){ m.querySelector('#rpOut').select(); toast('Select all and copy.'); } };
  m.querySelector('#rpDl').onclick = () => { const t = draw(), a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], {type: 'text/markdown'})); a.download = 'rescue-questions-prompt.md'; document.body.appendChild(a); a.click(); a.remove(); };
  m.querySelector('#rpNext').onclick = () => { m.remove(); rescueImportDialog(); };
}

/* ---------- reading what came back ---------- */
function rescueParseBank(raw){
  let t = String(raw || '').trim(); if(!t) return {error: 'Nothing was pasted.'};
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const a = t.indexOf('{'), z = t.lastIndexOf('}'), b0 = t.indexOf('['), b1 = t.lastIndexOf(']');
  let obj = null;
  try { obj = JSON.parse(t); } catch(e){
    try { obj = JSON.parse(a >= 0 && z > a && (b0 < 0 || a < b0) ? t.slice(a, z + 1) : t.slice(b0, b1 + 1)); } catch(e2){ return {error: 'That is not valid JSON. Ask the AI to return only the JSON object.'}; } }
  const list = Array.isArray(obj) ? obj : Array.isArray(obj && obj.questions) ? obj.questions : null;
  if(!list) return {error: 'No "questions" list was found.'};
  const known = new Set(RESCUE_SCENARIOS.map(x => x.id)), warn = [], ok = [];
  const existing = new Set(rescueBankAll().map(q => String(q.text).toLowerCase().replace(/\W+/g, ' ').trim()));
  const ids = new Set(); const seenText = new Set();
  list.forEach((q, i) => {
    const at = `#${i + 1}`;
    if(!q || typeof q !== 'object'){ warn.push(`${at}: not an object`); return; }
    const text = String(q.text || '').trim().replace(/\s+/g, ' ');
    if(text.length < 12){ warn.push(`${at}: no real question text`); return; }
    if(text.length > 400){ warn.push(`${at}: too long (${text.length} chars)`); return; }
    const norm = text.toLowerCase().replace(/\W+/g, ' ').trim();
    if(existing.has(norm) || seenText.has(norm)){ warn.push(`${at}: already in the bank`); return; }
    const sc = (Array.isArray(q.scenarios) ? q.scenarios : [q.scenarios]).map(x => String(x || '').trim()).filter(Boolean);
    const good = sc.filter(x => known.has(x)); if(sc.length !== good.length) warn.push(`${at}: unknown scenario ${sc.filter(x => !known.has(x)).join(', ')} dropped`);
    if(!good.length){ warn.push(`${at}: no known scenario`); return; }
    let id = String(q.id || '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || ('q' + (i + 1));
    while(ids.has(id)) id += '-x'; ids.add(id); seenText.add(norm);
    const pickOne = (v, list, d) => list.includes(v) ? v : d;
    ok.push({qid: id, text, scenarios: good.slice(0, 3), triggers: (Array.isArray(q.triggers) ? q.triggers : []).map(x => String(x).toLowerCase().trim()).filter(x => x && x.length <= 40).slice(0, 8),
      stage: pickOne(q.stage, RS_STAGES, 'explore'), depth: Math.min(3, Math.max(1, Math.round(+q.depth || 1))), kind: pickOne(q.kind, RS_KINDS, 'open'),
      horizon: pickOne(q.horizon, ['now', 'tonight', 'week', 'later', 'always', 'any'], 'any'), tone: pickOne(q.tone, RS_TONES, 'plain'),
      followups: (Array.isArray(q.followups) ? q.followups : []).map(x => String(x).toLowerCase().replace(/[^a-z0-9_-]+/g, '-')).slice(0, 4),
      use_when: String(q.use_when || '').slice(0, 160), avoid_when: String(q.avoid_when || '').slice(0, 160),
      suggest_exit: [...RESCUE_EXITS.map(x => x.id), 'none'].includes(q.suggest_exit) ? q.suggest_exit : 'none',
      time_of_day: (Array.isArray(q.time_of_day) && q.time_of_day.length ? q.time_of_day : ['any']).filter(x => ['any', 'morning', 'afternoon', 'evening', 'night'].includes(x)).concat([]).slice(0, 4)});
  });
  ok.forEach(q => { if(!q.time_of_day.length) q.time_of_day = ['any']; });
  return {ok, warn, total: list.length};
}
function rescueImportDialog(){
  const m = openModal(`<h2>Paste what the AI wrote</h2>
    <p class="muted" style="font-size:.88rem">The JSON it returned. It is checked before anything is added; duplicates and anything unreadable are left out and listed. Paste several replies one after another — each is its own batch.</p>
    <textarea class="ta mono" id="riIn" style="min-height:220px;font-size:.78rem" placeholder='{"format":"${RS_BANK_FORMAT}","version":1,"questions":[ … ]}'></textarea>
    <input class="inp" id="riLabel" placeholder="a name for this batch (optional)" style="margin-top:8px">
    <div id="riRep" class="faint sm" style="margin-top:8px"></div>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn ghost" id="riCheck">Check</button><button class="btn primary" id="riGo" disabled>Add them</button></div>`, 'wide');
  let parsed = null;
  const check = () => { parsed = rescueParseBank(m.querySelector('#riIn').value); const rep = m.querySelector('#riRep'), go = m.querySelector('#riGo');
    if(parsed.error){ rep.innerHTML = `<span style="color:var(--rose)">${esc(parsed.error)}</span>`; go.disabled = true; return; }
    const by = {}; parsed.ok.forEach(q => q.scenarios.forEach(s => { by[s] = (by[s] || 0) + 1; }));
    rep.innerHTML = `<b>${parsed.ok.length}</b> of ${parsed.total} are good to add. ${Object.entries(by).map(([k, n]) => `${esc((RESCUE_SCENARIOS.find(x => x.id === k) || {}).name || k)} ${n}`).join(' · ')}
      ${parsed.total - parsed.ok.length ? ` ${parsed.total - parsed.ok.length} left out.` : ''}
      ${parsed.warn.length ? `<details style="margin-top:6px"><summary>${parsed.warn.length} note${parsed.warn.length === 1 ? '' : 's'}</summary><div class="mono" style="font-size:.74rem">${parsed.warn.slice(0, 60).map(esc).join('<br>')}</div></details>` : ''}`;
    go.disabled = !parsed.ok.length; };
  m.querySelector('#riCheck').onclick = check; m.querySelector('#riIn').oninput = () => { m.querySelector('#riGo').disabled = true; };
  m.querySelector('#riGo').onclick = () => { if(!parsed || !parsed.ok) return; const r = rescueAddBatch(parsed.ok, m.querySelector('#riLabel').value.trim()); m.remove(); toast(`Added ${r.n} questions.`, 6000); rescueBankDialog(); };
}
function rescueAddBatch(list, label){
  const batch = uid(), at = new Date().toISOString(), lab = label || ('import ' + fmtDate(today(), 'short'));
  const rows = list.map(q => Object.assign({}, q, {id: batch + ':' + q.qid, batch, batchLabel: lab, at, source: 'import', enabled: true}));
  /* a question's follow-ups name other imported ids; they are re-pointed at this batch's rows */
  rows.forEach(r => { r.followups = (r.followups || []).map(f => batch + ':' + f); });
  rescueBankRows().push(...rows); saveNow();
  return {n: rows.length, batch};
}

/* ---------- Settings ---------- */
function rescueSettingsHTML(){
  const on = (S.settings || {}).rescueWhispers !== false;
  return `<div class="card rv" id="rescueCard"><h3>Overwhelm rescue space</h3>
    <div class="opt"><div><b>A line that leans in</b><div class="d">Once in a while a short, gentle line fades in at the edge of the page \u2014 chosen by what the page is about, from the starters and from the lines you have kept. Never twice running, never a command, gone after a few seconds.</div></div>
      <label class="toggle ${on ? 'on' : ''}" id="sRescueW"><span class="sw"></span></label></div>
    <div class="opt"><div><b>The question bank</b><div class="d">${rescueBankAll().length} questions (${RESCUE_STARTER.length} that ship with the house). Have a stronger AI write many more ahead of time from a prompt built from this house, and paste them in.</div></div>
      <button class="btn sm" id="sRescueBank">Open the bank</button></div>
    ${typeof rescueCareSettingsHTML === 'function' ? rescueCareSettingsHTML() : ''}</div>`;
}
function bindRescueSettings(root){
  const w = (root || document).querySelector('#sRescueW'); if(w) w.onclick = () => { S.settings.rescueWhispers = !(S.settings.rescueWhispers !== false); w.classList.toggle('on', S.settings.rescueWhispers !== false); saveNow(); };
  const b = (root || document).querySelector('#sRescueBank'); if(b) b.onclick = () => rescueBankDialog();
  if(typeof bindRescueCareSettings === 'function') bindRescueCareSettings(root);
}
