/* ============================================================
   THE RECORD KEEPER — a house that holds you to using it

   A house you do not write in is a house you are not using. This asks for the
   few things that make the rest of it true — when you woke, what today is for,
   when you went to sleep, that yesterday was closed, one line about today —
   and when they are not on the record the rooms that are for making things
   close until they are. Two ways of holding it:

     gentle  a strip at the top of every page says what is owed, and the
             night questions come; nothing is shut
     strict  the rooms you chose close while anything is owed, and after
             midnight they close whatever else is true

   Nothing here traps you. Today, the Lived Record, Settings, the export and
   the rescue stay open at all times, and a closed room can be borrowed for
   twenty minutes by writing down — in your own words, where it is kept — why
   you cannot wait. You get a few borrows a week. The cost is meant to be the
   moment of having to say it.

   The night watch is the other half. After the hour you said the day ends
   (Settings → sleep time, 23:00 if never set) the house asks what you are
   doing; whether it absolutely has to be done tonight, and what happens if it
   waits; and then, each time you are still here, a harder question. In the
   morning the night comes back as a record to write: what it was, whether it
   needed doing, what would stop it happening again.

   Stored in S.accountability:
     {mode, since, rooms[], cutoff, wakeBy, planBy, traceBy, borrows, questions,
      nights{date → {first, last, asked, need[], answers[], sleeping, debrief}},
      borrowLog[], pass, offered, traces{}}
   ============================================================ */
const RK_ROOMS = [['content', 'Content & Writing'], ['score', 'Score'], ['jazz', 'Jazz'], ['songwriting', 'Songwriting'],
  ['japanese', 'Japanese'], ['identityRoom', 'Identity — people, values, skills'], ['tree', 'Tree'], ['studio', 'Studio'], ['study', 'Study']];
const RK_ROOM_OF = {people: 'identityRoom', values: 'identityRoom', value: 'identityRoom', skills: 'identityRoom', finance: 'identityRoom',
  identity: 'identityRoom', writing: 'content'};
const RK_QUESTIONS = [
  'Why are you still on the laptop?',
  'What are you avoiding by staying up?',
  'If a stranger watched you right now, what would they say you are doing with your life?',
  'What would you tell a friend who was doing exactly this?',
  'Is this the best use of the last hour of your day — or only the easiest?',
  'Who do you become tomorrow if you stay up? And if you stop now?',
  'What feeling are you putting off by staying here?',
  'Whose approval, or which fear, is behind this hour?',
  'If this were the last night you had this laptop, would this be how you spent it?',
  'What will tomorrow-you wish tonight-you had done?',
];
const RK_SNOOZE = [0, 40, 30, 20, 15, 10];
const rkHuman = () => !!window.__rkForce || !navigator.webdriver;

function rkState(){
  if(!S.accountability || typeof S.accountability !== 'object') S.accountability = {};
  const a = S.accountability;
  if(!['off', 'gentle', 'strict'].includes(a.mode)) a.mode = 'off';
  if(!a.since) a.since = '';
  if(!Array.isArray(a.rooms)) a.rooms = RK_ROOMS.map(r => r[0]);
  if(typeof a.cutoff !== 'string') a.cutoff = '';
  if(!a.wakeBy) a.wakeBy = '10:00';
  if(!a.planBy) a.planBy = '12:00';
  if(!a.traceBy) a.traceBy = '20:00';
  if(a.borrows == null) a.borrows = 3;
  if(a.questions == null) a.questions = true;
  if(!a.nights || typeof a.nights !== 'object') a.nights = {};
  if(!Array.isArray(a.borrowLog)) a.borrowLog = [];
  if(!a.traces || typeof a.traces !== 'object') a.traces = {};
  if(!a.presence || typeof a.presence !== 'object') a.presence = {};
  if(a.pass === undefined) a.pass = 0;
  if(a.offered === undefined) a.offered = '';
  return a;
}
const rkOn = () => rkState().mode !== 'off';
const rkStrict = () => rkState().mode === 'strict';

/* ---------- the clock ---------- */
const rkMin = (d = new Date()) => d.getHours() * 60 + d.getMinutes();
function rkCutoff(){
  const a = rkState(), m = hm2min(a.cutoff || (S.settings && S.settings.sleepTime) || '23:00');
  return m == null || m < 1200 ? 1380 : m;
}
const rkCutoffHM = () => min2hm(rkCutoff());
/* the date a night belongs to is the evening it began: 01:30 on the 15th is
   still the night of the 14th. Null in the daytime. */
function rkNightDay(at = new Date()){
  if(at.getHours() < 6) return addDays(isoDay(at), -1);
  return rkMin(at) >= rkCutoff() ? isoDay(at) : null;
}
/* minutes past the cutoff, counting through midnight */
function rkOver(hm, cutoff = rkCutoff()){
  let m = hm2min(hm); if(m == null) return 0;
  if(m < 720) m += 1440;
  return Math.max(0, m - cutoff);
}
function rkNight(d, make){
  const a = rkState();
  if(!a.nights[d]){ if(!make) return null; a.nights[d] = {first: '', last: '', asked: 0, need: [], answers: [], relapses: [], sleeping: false, snooze: 0, debrief: null}; }
  return a.nights[d];
}

/* ---------- what is owed ---------- */
function rkHere(d){   /* was the house used that day, i.e. was there a day to account for */
  const r = (S.dailyRhythm || {})[d];
  return !!(r && (r.lastSeenAt || r.wakeTime || r.sleepTime || (r.blocks || []).length)) || !!(S.checkins || {})[d];
}
function rkPlanned(d){
  const p = (S.plans || {})[d];
  return !!(p && (p.planned || (p.intentions || []).some(x => String(x || '').trim())));
}
const rkTraced = d => !!((S.entries || []).some(e => e.occurredAt === d) || ((S.reviewLog || {})[d] || {}).note || (rkState().traces[d]));
function rkLateDebts(){   /* nights, within the last two days, that ran well past the cutoff and were never accounted for */
  const a = rkState(), c = rkCutoff(), now = new Date();
  if(rkNightDay(now)) return [];
  return Object.keys(a.nights).filter(d => { const n = a.nights[d];
    return d >= addDays(isoDay(now), -2) && d < isoDay(now) && !n.debrief && n.last && (rkOver(n.last, c) >= 30 || (n.need || []).length); }).sort();
}
function rkRules(){
  const a = rkState(), now = new Date(), T = today(), y = addDays(T, -1), m = rkMin(now), night = !!rkNightDay(now);
  const since = a.since || '0000-00-00', afterMorning = now.getHours() >= 6 && !night;
  const out = [];
  out.push({id: 'wake', label: 'When you woke up', day: T, due: a.wakeBy, hint: 'Write the time you actually got up, not the time you meant to.',
    open: afterMorning && m >= hm2min(a.wakeBy) && !dayWakeHM(T)});
  out.push({id: 'bed', label: 'When you went to sleep last night', day: y, due: '06:00', hint: 'The honest time. The house tells you the last minute it saw you.',
    open: afterMorning && y >= since && rkHere(y) && !dayBedHM(y) && (S.settings || {}).firstOpen !== T});
  out.push({id: 'plan', label: 'What today is for', day: T, due: a.planBy, hint: 'Three things that would make today good, and how it starts.',
    open: afterMorning && m >= hm2min(a.planBy) && !rkPlanned(T)});
  out.push({id: 'close', label: 'How yesterday ended', day: y, due: a.planBy, hint: 'One honest line, so the day is closed rather than left open.',
    open: afterMorning && m >= hm2min(a.planBy) && y >= since && rkHere(y) && !((S.reviewLog || {})[y] || {}).closedAt});
  out.push({id: 'trace', label: 'One line about today', day: T, due: a.traceBy, hint: 'What have you done or noticed so far? Two lines is plenty.',
    open: !night && m >= hm2min(a.traceBy) && now.getHours() >= 6 && !rkTraced(T)});
  const late = rkLateDebts();
  late.forEach(d => out.push({id: 'late', label: 'Last night', day: d, due: '06:00', hint: 'You were on past ' + rkCutoffHM() + '. Say what it was.', open: true}));
  return out;
}
const rkOwed = () => rkOn() ? rkRules().filter(r => r.open) : [];

/* ---------- the pass, the borrows ---------- */
const rkPassActive = () => Date.now() < (+rkState().pass || 0);
function rkBorrowsLeft(){
  const a = rkState(), wk = weekStart(today());
  return Math.max(0, (+a.borrows || 0) - a.borrowLog.filter(b => b.week === wk && b.mins > 0).length);
}
function rkBorrow(reason, mins = 20){
  const a = rkState();
  a.borrowLog.push({at: new Date().toISOString(), week: weekStart(today()), reason: reason.trim(), mins, owed: rkOwed().map(r => r.id)});
  a.pass = Date.now() + mins * 60000; saveNow();
}

/* ---------- the gate ---------- */
const rkRoomKey = name => RK_ROOM_OF[name] || name;
function rkLockReasons(name){
  if(!rkStrict() || rkPassActive()) return null;
  const key = rkRoomKey(name);
  if(!rkState().rooms.includes(key)) return null;
  const owed = rkOwed(), nd = rkNightDay(), n = nd ? rkNight(nd) : null;
  const night = !!(nd && (new Date().getHours() < 6 || (n && n.sleeping)));
  if(!owed.length && !night) return null;
  return {key, owed, night, nd};
}
function rkGate(name){
  const g = rkLockReasons(name); if(!g) return null;
  return root => rkGatePage(root, name, g);
}
function rkGatePage(root, name, g){
  const room = (RK_ROOMS.find(r => r[0] === g.key) || [0, name])[1], left = rkBorrowsLeft();
  root.innerHTML = `<div class="rk-lock">
    <span class="mono faint">${esc(room)} · closed</span>
    <h1 class="serif">${g.night && !g.owed.length ? 'It’s ' + nowHM() + '. This room is shut until morning.' : 'This room is closed until what you owe is on the record.'}</h1>
    <p class="muted" style="max-width:60ch">You asked the house to hold you to this.${g.owed.length ? ` ${g.owed.length === 1 ? 'One thing is' : g.owed.length + ' things are'} not written down — write ${g.owed.length === 1 ? 'it' : 'them'} here and the room opens.` : ''}${g.night ? ' After midnight these rooms close whatever else is true — what you are doing at this hour is not a thing for a room built for making things.' : ''}</p>
    ${g.night && !g.owed.length ? `<div class="row" style="gap:8px;margin:6px 0 14px"><button class="btn primary" id="rkToBed">Go to sleep — close the day</button><a class="btn ghost" href="#/today">Today</a></div>` : ''}
    <div id="rkForms"></div>
    <details class="rk-borrow"><summary class="mono">I need in anyway · ${left} borrow${left === 1 ? '' : 's'} left this week</summary>
      ${left ? `<p class="muted" style="font-size:.86rem;margin:8px 0">Twenty minutes. It is written down, with what you say here, and it shows in the ledger and the weekly review. Say what cannot wait — in a sentence someone else would believe.</p>
        <textarea class="inp" id="rkWhy" rows="3" placeholder="Why this cannot wait twenty minutes — or until the record is written"></textarea>
        <div class="row" style="justify-content:space-between;margin-top:8px"><span class="mono faint" id="rkWhyN">0 / 20</span><button class="btn" id="rkLend" disabled>Borrow 20 minutes</button></div>`
        : '<p class="muted" style="font-size:.86rem;margin:8px 0">No borrows left this week. Write the record — it takes a minute — or leave it for the morning.</p>'}
    </details>
    <p class="faint" style="font-size:.8rem;margin-top:18px">Always open: <a href="#/today">Today</a> · <a href="#/journals">the Lived Record</a> · <a href="#/rescue">Overwhelm rescue</a> · <a href="#/settings">Settings</a> · <a href="#/accountability">the ledger</a></p></div>`;
  const forms = root.querySelector('#rkForms');
  g.owed.forEach(r => { const box = document.createElement('div'); box.className = 'card rk-q'; forms.appendChild(box); rkQuick(r, box, () => { sound('success'); rerender(); }); });
  const bed = root.querySelector('#rkToBed'); if(bed) bed.onclick = () => rkSleepSequence(g.nd);
  const why = root.querySelector('#rkWhy'), lend = root.querySelector('#rkLend');
  if(why && lend){
    let wait = rkHuman() && !window.__rkNoWait ? 8 : 0; const sync = () => { if(!root.contains(why)) return; const n = why.value.trim().length;
      root.querySelector('#rkWhyN').textContent = n + ' / 20'; lend.disabled = n < 20 || wait > 0;
      lend.textContent = wait > 0 ? `Borrow 20 minutes (in ${wait})` : 'Borrow 20 minutes'; };
    why.oninput = sync; sync();
    if(wait){ const t = setInterval(() => { wait--; sync(); if(wait <= 0 || !root.contains(why)) clearInterval(t); }, 1000); }
    lend.onclick = () => { if(lend.disabled) return; rkBorrow(why.value, 20); toast('Twenty minutes. It is on the record.', 4500); rerender(); };
  }
}

/* ---------- writing the records ---------- */
function rkQuick(r, box, after){
  const a = rkState(), T = today(), done = () => { saveNow(); after(); };
  const head = `<div class="row between" style="align-items:baseline"><b>${esc(r.label)}</b><span class="mono faint">${r.id === 'late' ? esc(fmtDate(r.day, 'short')) : 'due ' + esc(r.due)}</span></div><p class="muted" style="font-size:.84rem;margin:2px 0 8px">${esc(r.hint)}</p>`;
  if(r.id === 'wake' || r.id === 'bed'){
    const rr = (S.dailyRhythm || {})[r.day] || {};
    const seen = r.id === 'bed' ? (rr.lastSeenAt && rkOver(rr.lastSeenAt) >= 0 && hm2min(rr.lastSeenAt) >= 1200 ? rr.lastSeenAt : '') : '';
    const lateN = r.id === 'bed' && a.nights[r.day] && a.nights[r.day].last ? a.nights[r.day].last : '';
    const def = r.id === 'wake' ? ((S.settings || {}).wakeTime || '') : (lateN || seen || (S.settings || {}).sleepTime || '');
    box.innerHTML = head + `<div class="row" style="gap:8px"><input class="inp mono" type="time" data-rk="t" value="${esc(def)}" style="width:8.5rem"><button class="btn primary" data-rk="ok">Write it</button></div>${lateN ? `<p class="faint" style="font-size:.78rem;margin:6px 0 0">The house last saw you at ${esc(lateN)}. Change it if that’s not when you slept.</p>` : ''}`;
    box.querySelector('[data-rk=ok]').onclick = () => { const v = box.querySelector('[data-rk=t]').value; if(!/^\d{2}:\d{2}$/.test(v)){ toast('Give it a time.'); return; }
      if(r.id === 'wake') daySetWake(r.day, v); else rhythmDay(r.day).sleepTime = v;
      rhythmCompute(rhythmDay(r.day)); done(); };
  } else if(r.id === 'plan'){
    const p = (S.plans || {})[r.day] || {}, ints = p.intentions || ['', '', ''];
    box.innerHTML = head + [0, 1, 2].map(i => `<input class="inp" data-rk="i${i}" placeholder="${['The one that matters most', 'Second', 'Third (optional)'][i]}" value="${esc(ints[i] || '')}" style="margin-bottom:6px">`).join('')
      + `<input class="inp" data-rk="fm" placeholder="How does it start — the very first move" value="${esc(p.firstMove || '')}"><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn primary" data-rk="ok">Write it</button></div>`;
    box.querySelector('[data-rk=ok]').onclick = () => { const v = [0, 1, 2].map(i => box.querySelector(`[data-rk=i${i}]`).value.trim());
      if(!v[0] || v[0].length < 3){ toast('Say at least the one that matters most.'); return; }
      const pl = dayPlan(r.day); pl.intentions = v; pl.firstMove = box.querySelector('[data-rk=fm]').value.trim(); pl.planned = true;
      if(typeof checkin === 'function' && !checkin(r.day).intention) checkin(r.day).intention = v[0];
      done(); };
  } else if(r.id === 'close'){
    box.innerHTML = head + `<input class="inp" data-rk="t" placeholder="How yesterday actually went, in a line"><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn primary" data-rk="ok">Close it</button></div>`;
    box.querySelector('[data-rk=ok]').onclick = () => { const v = box.querySelector('[data-rk=t]').value.trim();
      if(v.length < 6){ toast('A line — a few words at least.'); return; }
      const rv = dayReview(r.day); rv.note = rv.note ? rv.note + ' · ' + v : v; rv.closedAt = rv.closedAt || nowHM(); rv.closedLate = true; done(); };
  } else if(r.id === 'trace'){
    const moods = typeof MOOD_TAGS !== 'undefined' ? MOOD_TAGS : [];
    box.innerHTML = head + `<textarea class="inp" rows="3" data-rk="t" placeholder="What I did, how it went, what I felt — in my own words"></textarea>
      <div class="rk-radio" style="margin:8px 0"><span class="muted">How diligent was I?</span>${[1, 2, 3, 4, 5].map(n => `<label><input type="radio" name="rkDil" value="${n}"> ${n}</label>`).join('')}<span class="faint" style="font-size:.76rem">1 drifted · 5 did what I said</span></div>
      <div class="row" style="gap:8px;flex-wrap:wrap"><select class="sel" data-rk="mood" style="width:auto"><option value="">mostly feeling…</option>${moods.map(m => `<option>${esc(m)}</option>`).join('')}</select>
        <input class="inp" data-rk="avoid" placeholder="what I put off or avoided (optional)" style="flex:1;min-width:12rem"></div>
      <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn primary" data-rk="ok">Write it</button></div>`;
    box.querySelector('[data-rk=ok]').onclick = () => { const v = box.querySelector('[data-rk=t]').value.trim();
      if(v.length < 8){ toast('A sentence or two.'); return; }
      const dil = +((box.querySelector('input[name=rkDil]:checked') || {}).value || 0), mood = box.querySelector('[data-rk=mood]').value, avoid = box.querySelector('[data-rk=avoid]').value.trim();
      S.entries.push({id: uid(), type: 'reflection', title: 'Day so far', body: v, occurredAt: r.day, createdAt: new Date().toISOString(), media: [], links: {stages: [], substages: [], threads: [], values: [], visions: [], skills: [], projects: [], people: []}, people: [], places: [], emotions: mood ? [mood] : [], tags: ['record-keeper', 'daily-statement'], confidence: '', extra: {diligence: dil || null, avoided: avoid, statement: true}});
      a.traces[r.day] = true; done(); };
  } else if(r.id === 'late'){
    const n = rkNight(r.day) || {}, over = rkOver(n.last || '', rkCutoff()), said = (n.need || []).map(x => x.what).join('; ');
    box.innerHTML = head + `<p style="margin:0 0 8px">You were on until <b class="mono">${esc(n.last || '?')}</b> — ${over >= 60 ? Math.floor(over / 60) + 'h ' : ''}${over % 60}m past ${esc(rkCutoffHM())}${n.asked ? `, asked ${n.asked} time${n.asked === 1 ? '' : 's'}` : ''}.</p>
      <textarea class="inp" rows="2" data-rk="what" placeholder="What were you actually doing?">${esc(said)}</textarea>
      <div class="rk-radio" style="margin:8px 0"><span class="muted">Did it absolutely need to be done that night?</span>
        ${[['yes', 'Yes'], ['part', 'Part of it'], ['no', 'No']].map(([v, t]) => `<label><input type="radio" name="rkNeed" value="${v}"> ${t}</label>`).join('')}</div>
      <textarea class="inp" rows="2" data-rk="fix" placeholder="What will you do tonight so this doesn’t happen again?"></textarea>
      <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn primary" data-rk="ok">Write it</button></div>`;
    box.querySelector('[data-rk=ok]').onclick = () => { const what = box.querySelector('[data-rk=what]').value.trim(), fix = box.querySelector('[data-rk=fix]').value.trim(),
        need = (box.querySelector('input[name=rkNeed]:checked') || {}).value;
      if(what.length < 5 || fix.length < 5 || !need){ toast('All three — what, whether it had to be, and what changes.'); return; }
      const nn = rkNight(r.day, true); nn.debrief = {at: new Date().toISOString(), what, need, fix}; done(); };
  }
}
/* the day's line, any time — the same form the record asks for, without waiting to be owed */
function rkSayToday(after){
  const m = openModal('<h2>Say something about today</h2><div id="rkSay"></div>', 'narrow');
  rkQuick({id: 'trace', label: 'Today, in my own words', day: today(), due: rkState().traceBy, hint: 'What you did, how diligent you were, what you felt, what you avoided. It is kept as a Reflection, and goes in the analysis export.'}, m.querySelector('#rkSay'), () => { m.remove(); sound('success'); toast('Written.'); if(after) after(); });
}
function rkOwedModal(){
  const owed = rkOwed(); if(!owed.length){ toast('Nothing owed. The record is up to date.'); return; }
  const m = openModal(`<h2>On the record</h2><p class="muted" style="margin:0 0 10px">${owed.length} thing${owed.length === 1 ? '' : 's'} not written down yet.</p><div id="rkMods"></div>`, 'narrow');
  const refill = () => { const o = rkOwed(), box = m.querySelector('#rkMods'); box.innerHTML = '';
    if(!o.length){ m.remove(); toast('The record is up to date.'); rerender(); return; }
    o.forEach(r => { const c = document.createElement('div'); c.className = 'card rk-q'; box.appendChild(c); rkQuick(r, c, () => { sound('success'); refill(); }); }); };
  refill();
}

/* ---------- the strip, the marks on the doors ---------- */
function rkMount(main){
  document.querySelectorAll('.rk-strip').forEach(n => n.remove());
  document.querySelectorAll('[data-page].rk-shut').forEach(n => n.classList.remove('rk-shut'));
  if(!rkOn() || !main) return;
  if(rkStrict()) document.querySelectorAll('#sidebar a[data-page], #mobileNav a[data-page]').forEach(a => { if(rkLockReasons(a.dataset.page)) a.classList.add('rk-shut'); });
  if(main.querySelector('.rk-lock')) return;
  const owed = rkOwed(), nd = rkNightDay(), pass = rkPassActive();
  if(!owed.length && !pass) return;
  const el = document.createElement('div'); el.className = 'rk-strip'; el.setAttribute('role', 'status');
  el.innerHTML = pass && !owed.length ? `<span class="mono">borrowed · ends ${esc(min2hm(rkMin(new Date(+rkState().pass))))}</span>`
    : `<button class="rk-strip-b" data-rk="open"><span class="mono rk-k">on the record</span><b>${owed.length} owed</b><span class="rk-n">${esc(owed.slice(0, 3).map(r => r.label.toLowerCase()).join(' · '))}${owed.length > 3 ? ' …' : ''}</span>${rkStrict() ? '<span class="mono rk-k">rooms closed</span>' : ''}</button>${pass ? `<span class="mono rk-k">borrowed till ${esc(min2hm(rkMin(new Date(+rkState().pass))))}</span>` : ''}`;
  main.prepend(el); el.onclick = ev => { if(ev.target.closest('[data-rk=open]')) rkOwedModal(); };
}

/* ---------- the night watch ---------- */
function rkSleepSequence(nd){
  nd = nd || rkNightDay() || today();
  const n = rkNight(nd, true), T = addDays(nd, 1), m = openModal(`<h2>Good. Three things, then close the lid.</h2>
    <p class="muted" style="margin:0 0 10px">Going to bed at <b class="mono">${esc(nowHM())}</b> — that goes on the record now.</p>
    <label class="muted" style="font-size:.84rem">The very first move tomorrow, so you wake to something</label>
    <input class="inp" id="rkFirst" placeholder="e.g. open the score and play the first four bars" value="${esc(((S.plans || {})[T] || {}).firstMove || '')}">
    <label class="muted" style="font-size:.84rem;display:block;margin-top:10px">What is not getting done tonight, and is allowed not to?</label>
    <input class="inp" id="rkLetGo" placeholder="One thing that can wait">
    <div class="row" style="justify-content:space-between;margin-top:16px;gap:8px"><button class="btn ghost" id="rkClose">Close the day first</button><button class="btn primary" id="rkNight">Goodnight</button></div>`, 'narrow');
  const bank = () => { const r = rhythmDay(nd); r.sleepTime = nowHM(); rhythmCompute(r);
    const fm = m.querySelector('#rkFirst').value.trim(); if(fm) dayPlan(T).firstMove = fm;
    const lg = m.querySelector('#rkLetGo').value.trim(); if(lg) n.letGo = lg; saveNow(); };
  m.querySelector('#rkNight').onclick = () => { bank(); n.sleeping = true; saveNow(); m.remove(); rkSleepScreen(); };
  m.querySelector('#rkClose').onclick = () => { bank(); m.remove(); if(typeof flowEvening === 'function') flowEvening({}); };
}
function rkSleepScreen(){
  document.querySelectorAll('#rkSleep').forEach(n => n.remove());
  const nd = rkNightDay(); const n = nd && rkNight(nd); if(!n || !n.sleeping) return;
  const ov = document.createElement('div'); ov.id = 'rkSleep'; ov.setAttribute('data-nobubbles', '');
  ov.innerHTML = `<div class="rk-sleep-in"><div class="mono faint">${esc(nowHM())}</div><h1 class="serif">You said goodnight.</h1>
    <p class="muted">Whatever is open will be there at ${esc(dayWakeOrSetting(today()))}. Close the lid.</p>
    <button class="btn ghost sm" id="rkBack">I have to get back in</button></div>`;
  document.body.appendChild(ov);
  ov.querySelector('#rkBack').onclick = () => {
    const m = openModal(`<h2>Why now?</h2><p class="muted" style="margin:0 0 8px">You closed the day. Say what brings you back — it’s written down.</p>
      <textarea class="inp" id="rkBW" rows="3" placeholder="What I need to do, and why it can’t wait till morning"></textarea>
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" id="rkBO">Open it again</button></div>`, 'narrow');
    m.querySelector('#rkBO').onclick = () => { const v = m.querySelector('#rkBW').value.trim(); if(v.length < 12){ toast('A real sentence.'); return; }
      n.relapses.push({at: new Date().toISOString(), why: v}); n.sleeping = false; n.snooze = Date.now() + 20 * 60000; saveNow(); m.remove(); ov.remove(); };
  };
}
function rkAsk(){
  const nd = rkNightDay(); if(!nd) return;
  const n = rkNight(nd, true), now = nowHM(), k = n.asked;
  n.asked++; if(!n.first) n.first = now; n.last = now; saveNow();
  const over = rkOver(now), overTxt = (over >= 60 ? Math.floor(over / 60) + 'h ' : '') + (over % 60) + 'm';
  const snooze = mins => { n.snooze = Date.now() + mins * 60000; saveNow(); };
  if(k === 0){
    const m = openModal(`<div data-nobubbles></div><span class="mono faint">${esc(now)} · ${esc(overTxt)} past ${esc(rkCutoffHM())}</span>
      <h2 class="serif" style="margin:4px 0 6px">What are you doing?</h2>
      <p class="muted" style="margin:0 0 12px">You said the day ends at ${esc(rkCutoffHM())}. This is the part of it that you are choosing.</p>
      <div class="rk-opts"><button class="btn primary" id="rkA">Closing up — going to bed</button>
        <button class="btn" id="rkB">Something that has to be done tonight</button>
        <button class="btn ghost" id="rkC">Nothing in particular</button></div><div id="rkMore"></div>`, 'narrow');
    m.querySelector('#rkA').onclick = () => { m.remove(); rkSleepSequence(nd); };
    m.querySelector('#rkC').onclick = () => { m.remove(); rkQuestion(nd, n, 1, now, overTxt); };
    m.querySelector('#rkB').onclick = () => {
      m.querySelector('.rk-opts').style.display = 'none';
      m.querySelector('#rkMore').innerHTML = `<label class="muted" style="font-size:.84rem">What, exactly?</label><input class="inp" id="rkW">
        <label class="muted" style="font-size:.84rem;display:block;margin-top:8px">What goes wrong if it waits until morning?</label><input class="inp" id="rkX" placeholder="a real consequence, not “I’d feel behind”">
        <label class="muted" style="font-size:.84rem;display:block;margin-top:8px">How long, honestly?</label>
        <select class="sel" id="rkL" style="width:auto">${[[20, '20 minutes'], [40, '40 minutes'], [60, 'an hour']].map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select>
        <div class="row" style="justify-content:space-between;margin-top:14px"><button class="btn ghost" id="rkWait">…it can wait. Go to bed.</button><button class="btn primary" id="rkGo">Yes, it can’t. Time-boxed.</button></div>`;
      m.querySelector('#rkWait').onclick = () => { m.remove(); rkSleepSequence(nd); };
      m.querySelector('#rkGo').onclick = () => { const w = m.querySelector('#rkW').value.trim(), x = m.querySelector('#rkX').value.trim(), l = +m.querySelector('#rkL').value;
        if(w.length < 4 || x.length < 6){ toast('Say what it is, and what goes wrong if it waits.'); return; }
        n.need.push({at: now, what: w, cost: x, mins: l}); snooze(l + 5); m.remove();
        toast(`${l} minutes. I’ll come back at ${min2hm(rkMin() + l + 5)}.`, 5000); }; };
    return;
  }
  rkQuestion(nd, n, k, now, overTxt);
}
function rkQuestion(nd, n, k, now, overTxt){
  const snooze = mins => { n.snooze = Date.now() + mins * 60000; saveNow(); };
  const q = RK_QUESTIONS[(Math.floor(Date.now() / 86400000) * 3 + k * 7) % RK_QUESTIONS.length], wait = RK_SNOOZE[Math.min(k, RK_SNOOZE.length - 1)];
  const m = openModal(`<div data-nobubbles></div><span class="mono faint">${esc(now)} · ${esc(overTxt)} past ${esc(rkCutoffHM())} · asked ${k + 1} times tonight</span>
    <h2 class="serif rk-q-h" style="margin:6px 0 10px">${esc(q)}</h2>
    ${n.need.length ? `<p class="muted" style="font-size:.86rem;margin:0 0 8px">You said it had to be done: <i>${esc(n.need[n.need.length - 1].what)}</i>. Is it?</p>` : ''}
    <textarea class="inp" id="rkAns" rows="3" placeholder="Answer it. Not for me — for you."></textarea>
    <div class="row" style="justify-content:space-between;margin-top:12px;gap:8px"><button class="btn primary" id="rkStop">Fine. I’ll stop.</button><button class="btn ghost" id="rkStay" disabled>Still here — ${wait} more minutes</button></div>`, 'narrow');
  const ans = m.querySelector('#rkAns'), stay = m.querySelector('#rkStay');
  ans.oninput = () => { stay.disabled = ans.value.trim().length < 8; };
  m.querySelector('#rkStop').onclick = () => { const v = ans.value.trim(); if(v) n.answers.push({at: now, q, a: v}); m.remove(); rkSleepSequence(nd); };
  stay.onclick = () => { n.answers.push({at: now, q, a: ans.value.trim()}); snooze(wait); m.remove(); toast(`Written down. Back at ${min2hm(rkMin() + wait)}.`, 4500); };
}
function rkTick(){
  if(!rkOn() || !rkHuman()) return;
  const nd = rkNightDay(); if(!nd) { document.querySelectorAll('#rkSleep').forEach(n => n.remove()); return; }
  const n = rkNight(nd, true);
  if(!document.hidden){ const hm = nowHM(); if(n.last !== hm){ n.first = n.first || hm; n.last = hm; save(); } }
  if(document.hidden || !rkState().questions) return;
  if(n.sleeping){ if(!document.getElementById('rkSleep')) rkSleepScreen(); return; }
  if(Date.now() < (n.snooze || 0)) return;
  if(document.querySelector('#modals .overlay')) return;
  rkAsk();
}
setInterval(rkTick, 30000);
document.addEventListener('visibilitychange', () => { if(!document.hidden) setTimeout(rkTick, 900); });

/* ---------- first time ---------- */
function rkOffer(){
  const a = rkState(); if(a.mode !== 'off' || !rkHuman()) return;
  if(a.offered && daysBetween(a.offered, today()) < 7) return;
  if(!(S.settings || {}).firstOpen && !(S.entries || []).length) return;
  if(document.querySelector('#modals .overlay')) return;
  a.offered = today(); saveNow();
  const m = openModal(`<span class="mono faint">the record keeper</span><h2 class="serif" style="margin:4px 0 6px">A house you don’t write in is a house you’re not using.</h2>
    <p class="muted" style="margin:0 0 10px">It asks for a few things each day — when you woke, what today is for, when you slept, one line about it. If they’re missing it tells you; in strict mode the making-rooms stay shut until you write them. After ${esc(rkCutoffHM())} it asks what you’re doing, and whether it absolutely has to be done tonight.</p>
    <div class="rk-opts"><button class="btn primary" data-m="strict">Strict — close the rooms</button><button class="btn" data-m="gentle">Gentle — remind me</button><button class="btn ghost" data-m="">Not yet</button></div>`, 'narrow');
  m.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { const v = b.dataset.m; m.remove(); if(v){ a.mode = v; a.since = today(); saveNow(); toast(v === 'strict' ? 'Strict. Settings has the dials.' : 'Gentle. Settings has the dials.', 4500); rerender(); } });
}
setTimeout(rkOffer, 5000);

/* ---------- the ledger ---------- */
function rkDayClean(d){ return !!(dayWakeHM(d) && rkPlanned(d) && ((S.reviewLog || {})[d] || {}).closedAt && dayBedHM(d)); }
routes.accountability = function(root){
  const a = rkState(), T = today(), days = Array.from({length: 14}, (_, i) => addDays(T, -i)).reverse();
  let streak = 0; for(let i = 1; i < 60 && rkDayClean(addDays(T, -i)); i++) streak++;
  const nights = Object.keys(a.nights).sort().reverse().slice(0, 14), wk = weekStart(T), used = a.borrowLog.filter(b => b.week === wk);
  const rules = rkRules();
  root.innerHTML = `<div class="page-head"><div><span class="mono faint">the record keeper</span><h1 class="serif">The ledger</h1>
      <p class="muted" style="margin:0;max-width:62ch">Mode: <b>${esc(a.mode)}</b>${a.mode === 'off' ? '' : ` · the day ends at ${esc(rkCutoffHM())} · ${rkBorrowsLeft()} borrow${rkBorrowsLeft() === 1 ? '' : 's'} left this week`}. <a href="#/settings">Change it in Settings.</a></p></div></div>
    <div class="row" style="gap:8px;margin:0 0 12px;flex-wrap:wrap"><button class="btn primary" id="rkSay">Say something about today</button><button class="btn" id="rkAx">Download my record for an AI…</button></div>
    <div class="card rv"><h3>Today</h3>${rules.filter(r => r.id !== 'late').map(r => { const st = r.open ? 'owed' : (r.id === 'wake' ? dayWakeHM(r.day) : r.id === 'bed' ? dayBedHM(r.day) : r.id === 'plan' ? rkPlanned(r.day) : r.id === 'close' ? ((S.reviewLog || {})[r.day] || {}).closedAt : rkTraced(r.day)) ? 'done' : 'not due';
      return `<div class="rk-row ${st.replace(' ', '')}"><span>${esc(r.label)}</span><span class="mono">${st === 'done' ? '✓' : st === 'owed' ? 'owed' : 'by ' + esc(r.due)}</span></div>`; }).join('')}
      <div style="margin-top:10px"><button class="btn sm" id="rkWrite">${rkOwed().length ? 'Write what’s owed' : 'All on the record'}</button></div></div>
    <div class="card rv"><h3>Last 14 days <span class="mono faint" style="font-weight:400">· ${streak} clean day${streak === 1 ? '' : 's'} running</span></h3>
      <div class="rk-grid">${days.map(d => { const f = [['woke', dayWakeHM(d)], ['plan', rkPlanned(d)], ['closed', ((S.reviewLog || {})[d] || {}).closedAt], ['slept', dayBedHM(d)]];
        return `<div class="rk-day ${d === T ? 'now' : ''}" title="${esc(fmtDate(d, 'med'))}"><span class="mono faint">${esc(d.slice(8))}</span>${f.map(([k, v]) => `<i class="${v ? 'on' : ''}" title="${k}"></i>`).join('')}</div>`; }).join('')}</div>
      <p class="faint" style="font-size:.78rem;margin:8px 0 0">Four marks a day: woke · planned · closed · slept.</p></div>
    <div class="card rv"><h3>Nights</h3>${nights.length ? nights.map(d => { const n = a.nights[d], over = n.last ? rkOver(n.last) : 0;
      return `<div class="rk-night"><div class="row between"><b>${esc(fmtDate(d, 'short'))}</b><span class="mono ${over >= 30 ? 'rk-bad' : 'faint'}">${n.last ? 'on until ' + esc(n.last) + (over ? ' · ' + over + 'm over' : '') : '—'}${n.asked ? ' · asked ' + n.asked : ''}</span></div>
        ${(n.need || []).map(x => `<div class="muted" style="font-size:.84rem">“had to”: ${esc(x.what)} <span class="faint">— if it waited: ${esc(x.cost)}</span></div>`).join('')}
        ${(n.answers || []).slice(-2).map(x => `<div class="muted" style="font-size:.84rem"><i>${esc(x.q)}</i> — ${esc(x.a)}</div>`).join('')}
        ${n.debrief ? `<div style="font-size:.86rem;margin-top:3px"><span class="mono faint">next morning</span> ${esc(n.debrief.what)} · needed it: <b>${esc(n.debrief.need)}</b> · next time: ${esc(n.debrief.fix)}</div>` : over >= 30 ? '<div class="rk-bad mono" style="font-size:.76rem">not yet accounted for</div>' : ''}</div>`; }).join('')
      : '<p class="muted" style="margin:0">No nights on the record yet. The watch starts after ' + esc(rkCutoffHM()) + '.</p>'}</div>
    <div class="card rv"><h3>Borrowed time</h3>${a.borrowLog.length ? a.borrowLog.slice().reverse().slice(0, 12).map(b => `<div class="rk-night"><span class="mono faint">${esc(b.at.slice(0, 16).replace('T', ' '))} · ${b.mins}m</span><div style="font-size:.88rem">${esc(b.reason)}</div></div>`).join('') : '<p class="muted" style="margin:0">None. ' + (used.length ? '' : 'A clean ledger.') + '</p>'}</div>`;
  const w = root.querySelector('#rkWrite'); if(w) w.onclick = () => rkOwedModal();
  root.querySelector('#rkSay').onclick = () => rkSayToday(() => rerender());
  root.querySelector('#rkAx').onclick = () => analysisOpen();
};

/* ---------- settings ---------- */
const rkSettingsHTML = () => { const a = rkState();
  return `<div class="card rv" id="rkCard"><h3>The record keeper — holding myself to it</h3>
    <p class="muted" style="font-size:.85rem;margin:0 0 6px">If the day’s few records aren’t written, the rooms for making things close (strict) or a strip says so (gentle). After the hour the day ends it asks what you’re doing, and whether it had to be done tonight. <a href="#/accountability">The ledger</a></p>
    <div class="opt"><div><b>Say something about today · download my record</b><div class="d">The day’s line (how diligent, what I felt, what I avoided), and one file — the days, sleep, when I was in the house, what I wrote, what I never touched — to give an AI.</div></div><span class="row" style="gap:6px"><button class="btn sm" id="sRkSay">Say it</button><button class="btn sm primary" id="sRkAx">Download…</button></span></div>
    <div class="opt"><div><b>How hard it holds</b><div class="d">Off · gentle: reminders and the night questions · strict: the chosen rooms close while anything is owed, and after midnight.</div></div>
      <select class="sel" style="width:auto" id="sRkMode">${[['off', 'off'], ['gentle', 'gentle'], ['strict', 'strict']].map(([v, t]) => `<option value="${v}" ${a.mode === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
    <div class="opt"><div><b>The day ends at</b><div class="d">The night watch begins here. Empty uses your sleep time (${esc((S.settings || {}).sleepTime || '23:00')}).</div></div><input class="inp" type="time" id="sRkCut" value="${esc(a.cutoff)}" style="width:110px"></div>
    <div class="opt"><div><b>Wake time is owed by</b></div><input class="inp" type="time" id="sRkWake" value="${esc(a.wakeBy)}" style="width:110px"></div>
    <div class="opt"><div><b>Today’s plan, and yesterday’s close, owed by</b></div><input class="inp" type="time" id="sRkPlan" value="${esc(a.planBy)}" style="width:110px"></div>
    <div class="opt"><div><b>One line about today owed by</b></div><input class="inp" type="time" id="sRkTrace" value="${esc(a.traceBy)}" style="width:110px"></div>
    <div class="opt"><div><b>Night questions</b><div class="d">What are you doing · does it absolutely have to be tonight · and then, each time you’re still here, a harder one.</div></div><label class="toggle ${a.questions ? 'on' : ''}" id="sRkQ"><span class="sw"></span></label></div>
    <div class="opt"><div><b>Borrows a week</b><div class="d">Twenty minutes into a closed room, by writing down why. Fewer is stricter.</div></div>
      <select class="sel" style="width:auto" id="sRkBor">${[0, 1, 2, 3, 5, 7].map(v => `<option value="${v}" ${+a.borrows === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
    <div class="opt" style="display:block"><div><b>Rooms that close (strict)</b><div class="d">Today, the Lived Record, Settings, the rescue and the export never close.</div></div>
      <div class="rk-rooms">${RK_ROOMS.map(([k, t]) => `<label><input type="checkbox" data-rkroom="${k}" ${a.rooms.includes(k) ? 'checked' : ''}> ${esc(t)}</label>`).join('')}</div></div></div>`; };
function bindRkSettings(root){
  const r = root || document, a = rkState();
  const mode = r.querySelector('#sRkMode');
  if(mode) mode.onchange = () => {
    const to = mode.value, rank = {off: 0, gentle: 1, strict: 2};
    const apply = () => { a.mode = to; if(to !== 'off' && !a.since) a.since = today(); saveNow(); rerender(); };
    if(rank[to] >= rank[a.mode] || !rkOwed().length){ apply(); return; }
    /* loosening the hold while something is owed is the one move that gets asked about */
    const m = openModal(`<h2>Easing off with ${rkOwed().length} owed?</h2><p class="muted" style="margin:0 0 8px">Say why. It goes in the ledger.</p>
      <textarea class="inp" id="rkEW" rows="3"></textarea><div class="row" style="justify-content:flex-end;margin-top:10px;gap:8px"><button class="btn ghost" id="rkEN">Keep it</button><button class="btn" id="rkEY">Ease off</button></div>`, 'narrow');
    m.querySelector('#rkEN').onclick = () => { mode.value = a.mode; m.remove(); };
    m.querySelector('#rkEY').onclick = () => { const v = m.querySelector('#rkEW').value.trim(); if(v.length < 15){ toast('A real reason — a sentence.'); return; }
      a.borrowLog.push({at: new Date().toISOString(), week: weekStart(today()), reason: `eased ${a.mode} → ${to}: ${v}`, mins: 0, owed: rkOwed().map(x => x.id)}); m.remove(); apply(); };
  };
  [['#sRkCut', 'cutoff'], ['#sRkWake', 'wakeBy'], ['#sRkPlan', 'planBy'], ['#sRkTrace', 'traceBy']].forEach(([sel, k]) => { const i = r.querySelector(sel); if(i) i.onchange = () => { a[k] = i.value || (k === 'cutoff' ? '' : a[k]); saveNow(); }; });
  const sy = r.querySelector('#sRkSay'); if(sy) sy.onclick = () => rkSayToday();
  const ax = r.querySelector('#sRkAx'); if(ax) ax.onclick = () => analysisOpen();
  const q = r.querySelector('#sRkQ'); if(q) q.onclick = () => { a.questions = !a.questions; q.classList.toggle('on', a.questions); saveNow(); };
  const b = r.querySelector('#sRkBor'); if(b) b.onchange = () => { a.borrows = +b.value; saveNow(); };
  r.querySelectorAll('[data-rkroom]').forEach(c => c.onchange = () => { const k = c.dataset.rkroom; a.rooms = a.rooms.filter(x => x !== k); if(c.checked) a.rooms.push(k); saveNow(); });
}
