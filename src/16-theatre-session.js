/* ============================================================
   MORNING THEATRE — the guided session.

   The theatre was nine panels in an accordion and a question you had to
   answer before anything could start: which of these nine do I want to do
   this morning? That is a question about the practices, and you are not there
   to think about the practices. You are there because of how you feel about
   what you want, and the practices are the means.

   So the theatre asks the question you can actually answer — how are you
   feeling about your visions right now — and assembles the session itself:
   a mood chooses an ordered recipe of two to four of the same nine practices,
   the length you have decides how many of them fit, and the rotation queue
   decides which of your visions they are about, so that all of them get a
   morning over a week or two rather than only the favourite.

   Nothing underneath has changed. Each practice renders exactly as it does in
   the accordion — it is literally theatrePanelHTML() drawn one to a screen,
   with the summary hidden and the details forced open — so a scene built in a
   session is the same scene, saved the same way, and manual mode is still one
   click away for anybody who already knows what they came to do.
   ============================================================ */

const TH_MOODS = [
  {id:'on_fire',   emoji:'🔥', name:'On fire',   desc:'Energised, excited, ready to go',
   line:'Channel it into something vivid while it is here.'},
  {id:'foggy',     emoji:'🌫', name:'Foggy',     desc:'Unclear, scattered, unfocused',
   line:'Find out what you want and where you actually are.'},
  {id:'resistant', emoji:'😤', name:'Resistant', desc:'Doubtful, blocked, frustrated',
   line:'Do not push. Find the nearest thing that feels better.'},
  {id:'grateful',  emoji:'🙏', name:'Grateful',  desc:'Calm, aligned, feeling good',
   line:'Amplify what is already flowing.'},
  {id:'inspired',  emoji:'✨', name:'Inspired',  desc:'Creative, visionary, expansive',
   line:'Write it down boldly before the inspiration goes.'},
];
const TH_DURATIONS = [5, 15, 30];
/* Mood → an ordered sequence of practices, one list per length. The keys are
   the same ones theatrePanelHTML draws, plus 'wheel' for the focus wheel,
   which is a ceremony of its own rather than a panel.

   The spec's own table gives the five-minute sessions a single practice and no
   chief aim, and then says two paragraphs later that the chief aim always
   appears. The prose wins — reading it aloud is the thing the books are most
   insistent about and it costs under a minute — so thRecipe adds it to any
   sequence that does not already have it.

   "At the end", though, the spec contradicts itself on: two of its own
   thirty-minute recipes put a two-minute vision-board browse after the chief
   aim, and its time budget for thirty minutes says the same. That is a
   deliberate fade-out after the loud part, so where a recipe has already
   placed the aim, it is left where it was placed. The rule that holds
   everywhere is one chief aim, never none and never two. */
const TH_RECIPES = {
  on_fire:   {5:['scene'],      15:['scene','scripting'],   30:['scene','scripting','tension','aim','board']},
  foggy:     {5:['tension'],    15:['tension','script'],    30:['tension','script','winning']},
  resistant: {5:['wheel'],      15:['wheel','thanks'],      30:['wheel','thanks','winning']},
  grateful:  {5:['thanks'],     15:['thanks','scene'],      30:['thanks','scene','scripting']},
  inspired:  {5:['scripting'],  15:['scripting','scene'],   30:['scripting','scene','board']},
};
const TH_STEP_NAME = {
  script:'Self-image script', winning:'The winning feeling', aim:'Definite chief aim',
  board:'Vision board', scene:'A scene, entered', scripting:'Scripting',
  tension:'Structural tension', thanks:'Thanks, in advance', wheel:'The focus wheel',
};
/* how long each step is meant to take, so the timer can say "about four
   minutes" rather than counting down at you */
const TH_BUDGETS = {5:[4, 1], 15:[7, 5, 3], 30:[12, 8, 5, 3, 2]};

const thMood = id => TH_MOODS.find(m => m.id === id) || TH_MOODS[0];
function thRecipe(mood, minutes){
  const byLen = TH_RECIPES[mood] || TH_RECIPES.on_fire;
  const seq = (byLen[minutes] || byLen[15] || []).slice();
  if(!seq.includes('aim')) seq.push('aim');
  return seq;
}

/* ---------- the rotation queue ----------
   Which visions have gone longest without a morning, weighted by how thin
   they still are and how far up the ladder they have been committed to. */
function thVisionsEligible(){
  return (S.visions || []).filter(v => v && !v.archived
    && v.confidence !== 'lived' && v.status !== 'completed');
}
function thVisionScore(v, T){
  const seen = (v.lastMorningTheatreDate || '').slice(0, 10);
  /* never practised counts as a long time, not as no time */
  const days = seen ? Math.max(0, daysBetween(seen, T)) : 45;
  const thin = 100 - (typeof structuralTension === 'function' ? structuralTension(v) : 0);
  const rung = CONF.indexOf(v.confidence);
  const boost = rung >= CONF.indexOf('committed') ? 1.5 : 1;
  return days * 2 + thin + boost * 10;
}
function thRotation(){
  const T = today();
  return thVisionsEligible()
    .map(v => ({v, score: thVisionScore(v, T)}))
    .sort((a, b) => b.score - a.score)
    .map(x => x.v);
}
function thPickVisions(minutes){
  return thRotation().slice(0, minutes === 5 ? 1 : 2);
}
function thVisionName(v){ return v?.title || v?.name || v?.text || 'A vision'; }
function thLastPractised(v){
  const seen = (v.lastMorningTheatreDate || '').slice(0, 10);
  if(!seen) return 'never practised here';
  const d = daysBetween(seen, today());
  return d <= 0 ? 'practised today' : d === 1 ? 'yesterday' : `${d} days ago`;
}

/* ---------- the opening ---------- */
function theatreOpenHTML(){
  const r = theatre(), T = today();
  const sess = (r.sessions || []).filter(x => x.date === T);
  const mood = r.prefs.lastMood || '';
  const mins = TH_DURATIONS.includes(r.prefs.lastMinutes) ? r.prefs.lastMinutes : 15;
  return `<div class="ths-open">
    <h3 class="ths-ask">How are you feeling about your visions right now?</h3>
    <div class="ths-moods" role="radiogroup" aria-label="how you are feeling">
      ${TH_MOODS.map(m => `<button class="ths-mood${mood === m.id ? ' on' : ''}" data-thmood="${m.id}"
        role="radio" aria-checked="${mood === m.id}" title="${esc(m.desc)}">
        <span class="ths-emo">${m.emoji}</span><span class="ths-name">${esc(m.name)}</span>
        <span class="ths-desc mono">${esc(m.desc)}</span></button>`).join('')}
    </div>
    <div class="ths-when">
      <span class="mono faint">How long do you have?</span>
      <div class="ths-mins" role="radiogroup" aria-label="how long">
        ${TH_DURATIONS.map(n => `<button class="ths-min${mins === n ? ' on' : ''}" data-thmin="${n}"
          role="radio" aria-checked="${mins === n}">${n} min</button>`).join('')}
      </div>
    </div>
    <div class="ths-go">
      <button class="btn primary" id="thBegin"${mood ? '' : ' disabled'}>Begin session</button>
      ${mood ? `<span class="mono faint">${esc(thMood(mood).line)}</span>` : '<span class="mono faint">Pick how you are feeling, and it will assemble the rest.</span>'}
    </div>
    ${sess.length ? `<div class="ths-done mono">${sess.length} session${sess.length === 1 ? '' : 's'} today · ${
      sess.map(x => `${x.minutes} min, ${esc(thMood(x.mood).name.toLowerCase())}`).join(' · ')}</div>` : ''}
    <button class="ths-manual" id="thManual">⚙ Manual mode — choose practices individually</button>
    <!-- The pinned things stay on this screen rather than retreating into
         manual mode with the other eight panels. They were put in the theatre
         to be reread every day, and a door you have to know about is not every
         day. They also belong here: they are what you are about to sit with. -->
    ${typeof pinsPanelHTML === 'function' ? `<div class="ths-pins">${pinsPanelHTML()}</div>` : ''}
  </div>`;
}

/* ---------- today's focus, before anything begins ---------- */
function thFocusHTML(pick, all, minutes){
  const max = minutes === 5 ? 1 : 2;
  return `<div class="ths-focus">
    <h3 class="ths-ask">Today's focus</h3>
    ${pick.length ? `<div class="ths-vis">${pick.map(v => `<div class="ths-v">
      <b class="serif">${esc(thVisionName(v))}</b>
      <span class="mono faint">${esc(thLastPractised(v))}</span></div>`).join('')}</div>`
      : `<div class="empty">There are no visions on the tree yet, so this session is about the practices alone. That works — the practices are the point and a vision only gives them somewhere to point.</div>`}
    ${S._thPicking ? `<div class="ths-pick">
      <div class="mono faint">Choose up to ${max}:</div>
      <div class="ths-chips">${all.map(v => `<button class="chip ${pick.some(x => x.id === v.id) ? 'on' : ''}"
        data-thvis="${v.id}">${esc(thVisionName(v))}</button>`).join('') || '<span class="mono faint">nothing to choose from</span>'}</div>
    </div>` : ''}
    <div class="ths-go">
      <button class="btn primary" id="thFocusGo">These feel right → Start</button>
      ${all.length > pick.length || S._thPicking
        ? `<button class="btn sm ghost" id="thFocusPick">${S._thPicking ? 'done choosing' : 'Pick different ones'}</button>` : ''}
      <button class="btn sm ghost" id="thFocusBack">← back</button>
    </div>
  </div>`;
}

/* ---------- the session ---------- */
function thSessionStart(mood, minutes){
  const r = theatre();
  r.prefs.lastMood = mood; r.prefs.lastMinutes = minutes; saveNow();
  S._thSession = {mood, minutes, steps: thRecipe(mood, minutes),
    visions: (S._thFocus || thPickVisions(minutes)).map(v => v.id),
    i: -1, startedAt: new Date().toISOString(), stepAt: Date.now(), done: []};
  thSessionDraw();
}
function thStepVision(n){
  const s = S._thSession; if(!s || !s.visions.length) return null;
  return byId(S.visions, s.visions[n % s.visions.length]);
}
function thStepBudget(){
  const s = S._thSession; if(!s) return 0;
  const b = TH_BUDGETS[s.minutes] || TH_BUDGETS[15];
  return b[Math.min(s.i, b.length - 1)] || 0;
}
function thSessionBodyHTML(){
  const s = S._thSession, r = theatre();
  if(s.i < 0){
    const vs = s.visions.map(id => byId(S.visions, id)).filter(Boolean);
    return `<div class="ths-step ths-opening">
      <p class="ths-centre">Sit down. Put both feet on the floor. Take one breath all the way out.</p>
      ${vs.length ? `<div class="ths-vis">${vs.map(v => `<div class="ths-v"><b class="serif">${esc(thVisionName(v))}</b></div>`).join('')}</div>` : ''}
      <p class="th-quote">${esc(thMood(s.mood).line)}</p>
    </div>`;
  }
  if(s.i >= s.steps.length) return thClosingHTML();
  const key = s.steps[s.i];
  if(key === 'wheel') return `<div class="ths-step">
    <p class="th-quote">Hicks: reach for the next thought that feels a little better than the one before it, twelve times, until the subject stops hurting to think about.</p>
    <div class="row"><button class="btn primary" id="thStepWheel">Open the focus wheel</button></div>
    <div class="mono faint" style="margin-top:8px">It opens on top of this. Close it when you are done and come back to press next.</div>
  </div>`;
  return `<div class="ths-step">${typeof theatrePanelHTML === 'function' ? theatrePanelHTML(key) : ''}</div>`;
}
function thClosingHTML(){
  const s = S._thSession, r = theatre();
  const T = today();
  const cycleStart = r.cycleStart || T;
  const day = clamp(daysBetween(cycleStart, T) + 1, 1, 21);
  const kept = r.days.filter(d => d >= cycleStart).length;
  return `<div class="ths-step ths-closing">
    <div class="ths-tick">✓ Session complete · ${s.minutes} minutes</div>
    <div class="mono faint">You practised:</div>
    <ul class="ths-list">
      ${s.steps.map((k, n) => { const v = k === 'aim' ? null : thStepVision(n);
        return `<li>${esc(TH_STEP_NAME[k] || k)}${v ? ` → ${esc(thVisionName(v))}` : ''}</li>`; }).join('')}
    </ul>
    <div class="ths-streak">🌱 Day ${day} of your 21-day cycle · ${kept} practised</div>
    <p class="th-quote">Maltz: your nervous system cannot tell the difference between a real experience and one vividly imagined.</p>
  </div>`;
}
function thSessionHTML(){
  const s = S._thSession;
  const n = s.steps.length;
  const closing = s.i >= n;
  const v = s.i >= 0 && !closing ? thStepVision(s.i) : null;
  const budget = thStepBudget();
  return `<div class="ths">
    <div class="ths-head">
      <span class="mono">${closing ? 'done' : s.i < 0 ? 'before you start'
        : `Step ${s.i + 1} of ${n}`}${v ? ' · ' + esc(thVisionName(v)) : ''}</span>
      ${!closing && s.i >= 0 && budget ? `<span class="mono faint ths-clock" id="thClock">about ${budget} min</span>` : ''}
    </div>
    ${!closing ? `<div class="ths-rail" aria-hidden="true">${
      Array.from({length:n}, (_, k) => `<i class="${k < s.i ? 'done' : k === s.i ? 'on' : ''}"></i>`).join('')}</div>` : ''}
    ${!closing && s.i >= 0 ? `<h3 class="ths-title">${esc(TH_STEP_NAME[s.steps[s.i]] || '')}</h3>` : ''}
    <div class="ths-body" id="thBody">${thSessionBodyHTML()}</div>
    <div class="ths-nav">
      ${closing ? `<button class="btn primary" id="thClose">Close</button>`
        : `<button class="btn sm ghost" id="thPrev"${s.i < 0 ? ' disabled' : ''}>← Back</button>
           <button class="ths-leave" id="thLeave">leave — what you wrote is kept</button>
           <button class="btn primary" id="thNext">${s.i + 1 >= n ? 'Finish' : 'Next →'}</button>`}
    </div>
  </div>`;
}
function thSessionDraw(){
  let host = document.querySelector('#thSessionOv');
  if(!host){
    /* No backdrop-to-close here, and no browser confirm() either: a stray click
       beside a half-finished session should not end it, and the house does not
       use native dialogs. Leaving is a button that says what leaving costs. */
    host = el(`<div class="overlay ths-ov" id="thSessionOv" data-keep="1"><div class="modal rite ths-modal"></div></div>`);
    $('#modals').appendChild(host);
  }
  const box = host.querySelector('.ths-modal');
  box.innerHTML = thSessionHTML();
  thSessionBind(box);
  box.scrollTop = 0;
}
function thSessionEnd(){
  document.querySelector('#thSessionOv')?.remove();
  S._thSession = null; S._thFocus = null; S._thPicking = false;
  rerender();
}
function thSessionBind(box){
  const s = S._thSession;
  const q = x => box.querySelector(x);
  if(q('#thPrev')) q('#thPrev').onclick = () => { if(s.i > -1){ s.i--; s.stepAt = Date.now(); thSessionDraw(); } };
  if(q('#thNext')) q('#thNext').onclick = () => {
    if(s.i >= 0 && s.i < s.steps.length) s.done.push(s.steps[s.i]);
    s.i++; s.stepAt = Date.now();
    if(s.i >= s.steps.length) thSessionLog();
    thSessionDraw();
  };
  if(q('#thClose')) q('#thClose').onclick = () => thSessionEnd();
  /* leaving early keeps whatever the practices wrote — they each save
     themselves as you go — but does not log a session or tick the tracker */
  if(q('#thLeave')) q('#thLeave').onclick = () => { toast('Kept what you wrote. The session was not logged.'); thSessionEnd(); };
  if(q('#thStepWheel')) q('#thStepWheel').onclick = () => openFocusWheel();
  /* The practice inside the step is the panel it always was — which means it
     is a <details>, and in the accordion only the first one is open. Here the
     step IS the practice, so it is opened: hiding the summary in CSS without
     this gave a step with a title, a timer, a next button and nothing at all
     in between. */
  box.querySelectorAll('.ths-step .th-sec').forEach(d => { d.open = true; });
  /* and then bound the way the accordion binds it */
  if(typeof bindTheatre === 'function' && box.querySelector('.th-sec')) bindTheatre(box);
}
/* ---------- what the session leaves behind ---------- */
function thSessionLog(){
  const s = S._thSession; if(!s || s.logged) return;
  s.logged = true;
  const r = theatre(), T = today();
  if(!Array.isArray(r.sessions)) r.sessions = [];
  r.sessions.unshift({id:uid(), date:T, mood:s.mood, minutes:s.minutes,
    practices:s.steps.slice(), visions:s.visions.slice(),
    startedAt:s.startedAt, finishedAt:new Date().toISOString()});
  /* the tracker counts a session, not a single practice */
  if(!r.days.includes(T)) r.days.push(T);
  if(!r.cycleStart) r.cycleStart = T;
  /* so that the rotation moves on */
  s.visions.forEach(id => { const v = byId(S.visions, id); if(!v) return;
    v.lastMorningTheatreDate = new Date().toISOString();
    v.morningTheatreCount = (+v.morningTheatreCount || 0) + 1; });
  saveNow();
  sound('success');
}

/* ---------- binding the opening ---------- */
function bindTheatreOpen(root){
  const r = theatre();
  const q = x => root.querySelector(x);
  root.querySelectorAll('[data-thmood]').forEach(b => b.onclick = () => {
    r.prefs.lastMood = b.dataset.thmood; saveNow(); rerender(); });
  root.querySelectorAll('[data-thmin]').forEach(b => b.onclick = () => {
    r.prefs.lastMinutes = +b.dataset.thmin; saveNow(); rerender(); });
  if(q('#thManual')) q('#thManual').onclick = () => { r.prefs.manual = true; saveNow(); rerender(); };
  if(q('#thGuided')) q('#thGuided').onclick = () => { r.prefs.manual = false; saveNow(); rerender(); };
  if(q('#thBegin')) q('#thBegin').onclick = () => {
    const mood = r.prefs.lastMood; if(!mood) return;
    const mins = TH_DURATIONS.includes(r.prefs.lastMinutes) ? r.prefs.lastMinutes : 15;
    S._thFocus = thPickVisions(mins); S._thPicking = false;
    thFocusDraw();
  };
}
function thFocusDraw(){
  const r = theatre();
  const mins = TH_DURATIONS.includes(r.prefs.lastMinutes) ? r.prefs.lastMinutes : 15;
  let host = document.querySelector('#thFocusOv');
  if(!host){
    host = el(`<div class="overlay ths-ov" id="thFocusOv" data-keep="1"><div class="modal rite ths-modal"></div></div>`);
    host.addEventListener('mousedown', e => { if(e.target === host) thFocusEnd(); });
    $('#modals').appendChild(host);
  }
  const box = host.querySelector('.ths-modal');
  box.innerHTML = thFocusHTML(S._thFocus || [], thRotation(), mins);
  const q = x => box.querySelector(x);
  box.querySelectorAll('[data-thvis]').forEach(b => b.onclick = () => {
    const max = mins === 5 ? 1 : 2;
    const id = b.dataset.thvis;
    let pick = (S._thFocus || []).slice();
    if(pick.some(v => v.id === id)) pick = pick.filter(v => v.id !== id);
    else { pick.push(byId(S.visions, id)); if(pick.length > max) pick = pick.slice(pick.length - max); }
    S._thFocus = pick.filter(Boolean); thFocusDraw();
  });
  if(q('#thFocusPick')) q('#thFocusPick').onclick = () => { S._thPicking = !S._thPicking; thFocusDraw(); };
  if(q('#thFocusBack')) q('#thFocusBack').onclick = () => thFocusEnd();
  if(q('#thFocusGo')) q('#thFocusGo').onclick = () => {
    document.querySelector('#thFocusOv')?.remove();
    thSessionStart(r.prefs.lastMood, mins);
  };
}
function thFocusEnd(){
  document.querySelector('#thFocusOv')?.remove();
  S._thFocus = null; S._thPicking = false;
}
