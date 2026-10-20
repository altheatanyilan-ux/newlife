/* ============================================================
   THE OVERWHELM RESCUE SPACE — the data and the doors out of it

   When the day is a tangle — long-term and short-term, a deadline, something
   that wants a little thought every day, a body that is tired, people who are
   waiting — every room of the house asks you to say what a thing IS before you
   know what you think. This is the room that asks nothing first: a blank page,
   click anywhere and write. What it is can be decided afterwards, by selecting
   it, and sent to wherever it belongs: a task, a thread of the week, a journal,
   a decision, a person, a reminder, a parking place — or let go.

   A page is kept for good, by the day it was made, and is listed in the Review.
   Nothing here is scored: no streak, no overdue, nothing that goes red.

   Stored in S.rescueSheets (one row a page). The boxes on a page are never
   removed by letting one go — it fades, and stays in the record.
   ============================================================ */

/* ---------- the faces a box can be written in: chosen at random, kept per box ---------- */
const RESCUE_FONTS = [
  {id: 'garamond',  css: "'EB Garamond',Georgia,serif",            size: 1.22, style: 'italic'},
  {id: 'cormorant', css: "'Cormorant Garamond','EB Garamond',serif", size: 1.34, style: 'italic'},
  {id: 'playfair',  css: "'Playfair Display',Georgia,serif",       size: 1.08, style: 'italic'},
  {id: 'lora',      css: "'Lora',Georgia,serif",                   size: 1.1,  style: 'italic'},
  {id: 'caveat',    css: "'Caveat','Kalam',cursive",               size: 1.5,  style: 'normal'},
  {id: 'kalam',     css: "'Kalam','Caveat',cursive",               size: 1.12, style: 'normal'},
  {id: 'patrick',   css: "'Patrick Hand','Kalam',cursive",         size: 1.2,  style: 'normal'},
  {id: 'dancing',   css: "'Dancing Script','Caveat',cursive",      size: 1.42, style: 'normal'},
  {id: 'nunito',    css: "'Nunito Sans',system-ui,sans-serif",     size: 1.02, style: 'normal'},
  {id: 'plex',      css: "'IBM Plex Mono',ui-monospace,monospace", size: .92,  style: 'normal'},
];
/* soft inks, mixed into the page's own text colour so they sit in light and dark alike */
const RESCUE_INKS = ['var(--text)', 'var(--terra)', 'var(--sage)', 'var(--rose)', 'var(--gold)', 'var(--page-accent)'];
const rescueFontOf = id => RESCUE_FONTS.find(f => f.id === id) || RESCUE_FONTS[0];
const rescuePick = list => list[Math.floor(Math.random() * list.length)];

/* ---------- the horizons a thought can sit on ---------- */
const RESCUE_HORIZONS = [
  {id: 'now',     name: 'right now',     hint: 'the next hour'},
  {id: 'tonight', name: 'tonight',       hint: 'before you sleep'},
  {id: 'week',    name: 'this week',     hint: 'a few days'},
  {id: 'later',   name: 'later',         hint: 'weeks, months'},
  {id: 'always',  name: 'a way of being', hint: 'not a task: a stance'},
];

/* ---------- what a tangle is made of: used to find a question, and to say what a page is about ---------- */
const RESCUE_SCENARIOS = [
  {id: 'too-much',   name: 'too many inputs',            words: ['too much', 'overwhelm', 'everything', 'so many', 'cant keep', "can't keep", 'swamped', 'tangle', 'scattered', 'all at once', 'drowning']},
  {id: 'deadline',   name: 'a pressing deadline',        words: ['deadline', 'due', 'submit', 'by friday', 'by monday', 'tomorrow', 'application', 'exam', 'hand in', 'cutoff']},
  {id: 'decide',     name: 'stuck on a decision',        words: ['should i', 'or should', 'whether', 'decide', 'decision', 'torn', 'indecis', 'choose', 'either', 'not sure if']},
  {id: 'tired-sleep', name: 'tired — sleep or push on',  words: ['tired', 'sleepy', 'sleep', 'stay up', 'late', 'exhaust', 'bed', 'awake', 'nap', 'knackered']},
  {id: 'broken-promise', name: 'a promise to myself',    words: ['i said i would', 'promised', 'however late', 'i planned', 'supposed to', 'told myself', 'i will do tonight']},
  {id: 'people',     name: 'a person, a relationship',   words: ['reply', 'text back', 'call', 'mum', 'mom', 'dad', 'friend', 'partner', 'colleague', 'boss', 'argument', 'awkward', 'miss', 'owe']},
  {id: 'long-term',  name: 'the long term, drifting',    words: ['career', 'future', 'years', 'direction', 'purpose', 'life', 'where am i', 'long term', 'long-term', 'goal', 'someday', 'dream']},
  {id: 'daily-thread', name: 'something to think on daily', words: ['every day', 'daily', 'keep thinking', 'need to think about', 'mull', 'sit with', 'ponder']},
  {id: 'feeling',    name: 'a feeling I cannot place',   words: ['anxious', 'anxiety', 'sad', 'angry', 'numb', 'flat', 'restless', 'dread', 'guilty', 'guilt', 'shame', 'afraid', 'scared', 'irritable']},
  {id: 'stuck',      name: 'stuck, avoiding',            words: ['avoid', 'procrastinat', "can't start", 'cant start', 'stuck', 'putting off', 'dont want to', "don't want to", 'resist']},
  {id: 'perfection', name: 'perfectionism, standards',   words: ['perfect', 'not good enough', 'redo', 'again', 'proper', 'should be better', 'behind', 'falling behind']},
  {id: 'money-admin', name: 'money, admin, logistics',   words: ['rent', 'bill', 'pay', 'visa', 'tax', 'forms', 'paperwork', 'budget', 'appointment', 'booking']},
  {id: 'body',       name: 'body, health, energy',       words: ['headache', 'sick', 'ill', 'pain', 'hungry', 'skipped meal', 'energy', 'sore', 'unwell', 'eyes']},
  {id: 'priorities', name: 'what matters most',          words: ['priorit', 'first', 'important', 'urgent', 'which one', 'what matters', 'trade-off', 'tradeoff', 'balance']},
  {id: 'liminal',    name: 'stuck in the in-between',    words: ['limbo', 'liminal', "don't know what to do", 'dont know what to do', 'unfocused', 'wasting time', 'drifting', 'zoning']},
];

/* ---------- gentle lines, offered one at a time at the edge of the page ----------
   Never a command and never twice running. `tags` are the scenarios they lean toward. */
const RESCUE_WHISPERS = [
  {t: 'This page does not have to be solved by the end of it.', tags: ['too-much', 'liminal']},
  {t: 'A rough next step is still a step.', tags: ['stuck', 'too-much', 'perfection']},
  {t: 'Tired is information, not a verdict.', tags: ['tired-sleep', 'body']},
  {t: 'The plan was made by a rested you. Ask the one who is here.', tags: ['tired-sleep', 'broken-promise']},
  {t: 'What would make tonight enough?', tags: ['tired-sleep', 'deadline', 'too-much']},
  {t: 'Some of this is not yours to carry tonight.', tags: ['too-much', 'people', 'feeling']},
  {t: 'The smallest honest version still counts.', tags: ['perfection', 'stuck', 'deadline']},
  {t: 'One thread at a time. The others will keep.', tags: ['too-much', 'daily-thread', 'liminal']},
  {t: 'Changing a promise to yourself is not breaking it, if you say so out loud.', tags: ['broken-promise', 'tired-sleep']},
  {t: 'You are allowed to be unfinished on this.', tags: ['perfection', 'deadline', 'long-term']},
  {t: 'The feeling is allowed to arrive before the answer.', tags: ['feeling', 'decide']},
  {t: 'Waiting to feel ready is also a decision. Is it the one you want?', tags: ['decide', 'stuck']},
  {t: 'Not everything that is important is urgent, and not everything urgent is yours.', tags: ['priorities', 'deadline']},
  {t: 'A short message sent is lighter than a long one planned.', tags: ['people']},
  {t: 'You can move on from this page without having finished it.', tags: ['liminal', 'too-much']},
  {t: 'What would you say to a friend who wrote this page?', tags: ['feeling', 'perfection', 'broken-promise', 'tired-sleep']},
];

/* ---------- the pages ---------- */
const rescueSheets = () => lifeArray('rescueSheets');
const RESCUE_FRESH_HOURS = 4;     /* a page last touched inside this is carried on rather than started over */
function rescueNewSheet(){
  const now = new Date();
  const s = {id: uid(), createdAt: now.toISOString(), updatedAt: now.toISOString(), day: today(), title: '', boxes: [],
    startedAt: now.toISOString(), endedAt: null, landing: null, scenario: '', coach: {asked: [], skipped: []}, seen: {}};
  rescueSheets().push(s); saveNow();
  return s;
}
/* the page in hand: the latest one that was not landed and is still fresh, or a new one if asked */
function rescueCurrent(create){
  const all = rescueSheets().filter(s => !s.landing).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  const s = all[0];
  if(s && (Date.now() - Date.parse(s.updatedAt)) / 36e5 < RESCUE_FRESH_HOURS) return s;
  return create ? rescueNewSheet() : null;
}
const rescueSheetById = id => rescueSheets().find(s => s.id === id) || null;
function rescueTouch(s){ s.updatedAt = new Date().toISOString(); save(); }
const rescueLive = s => (s.boxes || []).filter(b => b.fate !== 'letgo');
function rescueTitle(s){
  if(s.title) return s.title;
  const b = (s.boxes || []).find(x => (x.text || '').trim());
  const t = b ? b.text.trim().split('\n')[0] : '';
  return t ? (t.length > 46 ? t.slice(0, 44) + '…' : t) : 'A page, ' + fmtDate(s.day, 'short');
}
/* boxes with words on them that nothing has been done with yet */
const rescueUnhandled = s => (s.boxes || []).filter(b => b.kind !== 'question' && (b.text || '').trim() && !b.fate && !(b.exits || []).length);
const rescueText = s => (s.boxes || []).map(b => (b.text || '') + ' ' + (b.q ? b.q.text || '' : '')).join(' \n ');
function rescueBoxNew(s, x, y, text = ''){
  const f = rescuePick(RESCUE_FONTS);
  const b = {id: uid(), x: Math.max(8, Math.round(x)), y: Math.max(8, Math.round(y)), text, font: f.id, ink: rescuePick(RESCUE_INKS),
    horizon: '', fate: '', exits: [], refs: [], kind: 'text', at: new Date().toISOString()};
  s.boxes.push(b); rescueTouch(s);
  return b;
}
/* what a page is about, from its own words: the scenarios whose words it uses, most first */
function rescueScenarios(s){
  const t = rescueText(s).toLowerCase(); if(!t.trim()) return [];
  return RESCUE_SCENARIOS.map(sc => ({sc, n: sc.words.filter(w => t.includes(w)).length})).filter(x => x.n).sort((a, b) => b.n - a.n).map(x => x.sc);
}

/* ---------- the pages by day, for the Review ---------- */
function rescueByDay(){
  const out = {};
  rescueSheets().slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).forEach(s => { (out[s.day] = out[s.day] || []).push(s); });
  return out;
}
function rescueMinutes(s){
  const a = Date.parse(s.startedAt || s.createdAt), z = Date.parse(s.endedAt || s.updatedAt);
  return isFinite(a) && isFinite(z) ? Math.max(1, Math.round((z - a) / 60000)) : 0;
}

/* ---------- what the site knows about the words on a page ----------
   A box that names a person, a list, a milestone, a task, a skill or a habit gets a
   thread to it. Matched by name, whole words, and said plainly — nothing here guesses
   beyond a name. */
const _rsEsc = w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const _rsHas = (text, name) => { const n = String(name || '').trim(); if(n.length < 3) return false;
  try { return new RegExp('(^|[^\\p{L}\\p{N}])' + _rsEsc(n) + '($|[^\\p{L}\\p{N}])', 'iu').test(text); } catch(e){ return false; } };
function rescueMentions(text){
  const t = String(text || ''); if(t.trim().length < 3) return [];
  const out = [], push = r => { if(!out.some(x => x.type === r.type && x.id === r.id)) out.push(r); };
  try { (S.people || []).forEach(p => {
    const first = String(p.name || '').split(/\s+/)[0];
    if(_rsHas(t, p.name) || _rsHas(t, p.nickname) || (first.length >= 3 && _rsHas(t, first))) push({type: 'person', id: p.id, label: p.nickname || first || p.name}); }); } catch(e){}
  try { planLists().filter(l => !l.archivedAt && l.id !== 'inbox').forEach(l => {
    if(_rsHas(t, l.name)) push({type: 'list', id: l.id, label: l.name});
    (l.milestones || []).forEach(m => { if(!m.done && m.name && _rsHas(t, m.name)) push({type: 'milestone', id: m.id, label: m.name}); }); }); } catch(e){}
  try { (S.habits || []).filter(h => !h.archived).forEach(h => { if(_rsHas(t, h.name)) push({type: 'habit', id: h.id, label: h.name}); }); } catch(e){}
  try { (S.skills || []).forEach(sk => { if(_rsHas(t, sk.name)) push({type: 'skill', id: sk.id, label: sk.name}); }); } catch(e){}
  try { if(typeof wantsMentions === 'function') wantsMentions(t).forEach(push); } catch(e){}
  try {
    const low = t.toLowerCase(), words = new Set(low.split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 3));
    allTaskRefs().filter(r => !r.done && (r.text || '').trim().length >= 6).forEach(r => {
      const tt = r.text.toLowerCase(); if(low.includes(tt)){ push({type: 'task', id: r.id, label: r.text}); return; }
      const ws = tt.split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 4);
      if(ws.length >= 2 && ws.every(w => words.has(w))) push({type: 'task', id: r.id, label: r.text}); });
  } catch(e){}
  const order = {letgo: -1, person: 0, milestone: 1, want: 1.5, list: 2, task: 3, skill: 4, habit: 5};
  return out.sort((a, b) => order[a.type] - order[b.type]).slice(0, 6);
}
/* one plain line on what the site holds for it, and where it lives */
function rescueKnows(ref){
  const T = today();
  try {
    if(ref.type === 'person'){
      const p = byId(S.people, ref.id); if(!p) return null;
      const last = typeof lastInteractionDate === 'function' ? lastInteractionDate(p.id) : null;
      const nm = typeof peopleNeedingAttention === 'function' ? peopleNeedingAttention() : [];
      return {line: last ? `last in touch ${daysBetween(last, T) === 0 ? 'today' : daysBetween(last, T) + ' days ago'}${nm.some(x => x.id === p.id) ? ' · due a word' : ''}` : 'no contact logged yet', go: () => navigate('#/people/' + p.id)};
    }
    if(ref.type === 'list'){
      const l = planList(ref.id); if(!l) return null;
      const open = (S.tasks || []).filter(t => t.listId === l.id && !t.done).length;
      const ms = (l.milestones || []).filter(m => !m.done && m.date).sort((a, b) => a.date.localeCompare(b.date))[0];
      return {line: `${open} open${ms ? ` · ${ms.name} ${planWhenAway(ms.date)}` : ''}`, go: () => pqOpenList(l.id)};
    }
    if(ref.type === 'milestone'){
      const hit = typeof planFindMilestone === 'function' ? planFindMilestone(ref.id) : null; if(!hit) return null;
      return {line: `${hit.list.name} · ${hit.m.date ? planWhenAway(hit.m.date) : 'no date'}`, go: () => openMilestoneInTasks(ref.id)};
    }
    if(ref.type === 'task'){
      const r = findTaskRef(ref.id); if(!r) return null;
      const est = typeof pbdEstOf === 'function' ? pbdEstOf(r.task) : 0;
      return {line: `${r.day ? 'due ' + fmtDate(r.day, 'short') : 'no day'}${est ? ' · ~' + (typeof pbdSay === 'function' ? pbdSay(est) : est + 'm') : ''}${r.day && r.day < T ? ' · late' : ''}`, go: () => (r.kind === 'own' && typeof openPlanTask === 'function') ? openPlanTask(r.id) : (r.go && navigate(r.go))};
    }
    if((ref.type === 'want' || ref.type === 'letgo') && typeof wantsKnows === 'function') return wantsKnows(ref);
    if(ref.type === 'skill') return {line: 'in your skills', go: () => { navigate('#/identity/skills'); setTimeout(() => { try { openSkillPanel(ref.id); } catch(e){} }, 120); }};
    if(ref.type === 'habit'){
      const h = byId(S.habits, ref.id); if(!h) return null; const st = typeof habStreak === 'function' ? habStreak(h) : null;
      return {line: st ? `a run of ${st.cur}` : 'a habit', go: () => openHabitPanel(ref.id)};
    }
  } catch(e){}
  return null;
}

/* ---------- what is on the plate: the live things a thought can be pinned to ---------- */
function rescuePlate(){
  const T = today(), out = {capacity: null, groups: []};
  const own = (typeof allTaskRefs === 'function' ? allTaskRefs() : []).filter(r => !r.done);
  try {
    const todays = own.filter(r => r.day === T || r.doDay === T);
    const mins = todays.reduce((n, r) => n + (typeof pbdEstOf === 'function' ? (pbdEstOf(r.task) || 0) : 0), 0);
    const hrs = +(S.settings || {}).availableHoursPerDay || 8;
    out.capacity = {tasks: todays.length, mins, hrs, over: mins > hrs * 60};
  } catch(e){}
  const item = (kind, id, label, detail) => ({kind, id, label, detail: detail || ''});
  const late = own.filter(r => r.day && r.day < T).sort((a, b) => a.day.localeCompare(b.day)).slice(0, 6);
  if(late.length) out.groups.push({name: 'gone by', items: late.map(r => item('task', r.id, r.text, 'due ' + fmtDate(r.day, 'short')))});
  const soon = own.filter(r => r.day && r.day >= T && r.day <= addDays(T, 6)).sort((a, b) => a.day.localeCompare(b.day)).slice(0, 6);
  if(soon.length) out.groups.push({name: 'this week', items: soon.map(r => item('task', r.id, r.text, r.day === T ? 'today' : fmtDate(r.day, 'short')))});
  try { const ms = planMilestonesAhead({within: 30, limit: 6});
    if(ms.length) out.groups.push({name: 'dates ahead', items: ms.map(({m, list}) => item('milestone', m.id, m.name, planWhenAway(m.date) + ' · ' + list.name))}); } catch(e){}
  try { const th = weekThreadsOn(weekPlanSeen(weekStart(T)), T);
    if(th.length) out.groups.push({name: 'threads on today', items: th.map(t => ({kind: 'thread', id: t.id, label: t.text, detail: WEEK_THREAD_KIND[t.kind] || ''}))}); } catch(e){}
  try { if(typeof wantsThings === 'function'){ const sh = wantsShares();
    if(sh.length) out.groups.push({name: 'my life right now', items: sh.map(s => item('want', s.t.id, s.t.name, s.pct + '%'))}); } } catch(e){}
  try { const pp = peopleNeedingAttention().slice(0, 5);
    if(pp.length) out.groups.push({name: 'people waiting', items: pp.map(p => item('person', p.id, p.nickname || p.name, 'due a word'))}); } catch(e){}
  return out;
}

/* ---------- tonight: what the record can say about staying up or sleeping ----------
   Plain readings from the sleep and time records, with no verdict in them. */
function rescueSleepFacts(){
  const T = today(), nights = [];
  try {
    for(let i = 1; i <= 14; i++){
      const d = addDays(T, -i), n = typeof timeSleepNight === 'function' ? timeSleepNight(d) : null; if(!n) continue;
      const late = !n.crossed && n.from >= 30 && n.from < 8 * 60;
      const tracked = Math.round((typeof timeOnDay === 'function' ? timeOnDay(d) : []).filter(e => e.kind !== 'break').reduce((a, e) => a + timeMinutes(e), 0));
      const done = typeof tasksDoneBetween === 'function' ? tasksDoneBetween(d, d).length : 0;
      nights.push({day: d, hours: +(n.minutes / 60).toFixed(1), bed: n.from, late, tracked, done});
    }
  } catch(e){}
  const avg = (a, k) => a.length ? Math.round(a.reduce((n, x) => n + x[k], 0) / a.length) : null;
  const late = nights.filter(n => n.late), early = nights.filter(n => !n.late);
  return {nights, late: late.length, total: nights.length, bedGoal: (S.settings || {}).sleepTime || '',
    afterLate: late.length >= 2 ? {n: late.length, tracked: avg(late, 'tracked'), done: avg(late, 'done'), hours: +(late.reduce((n, x) => n + x.hours, 0) / late.length).toFixed(1)} : null,
    afterEarly: early.length >= 2 ? {n: early.length, tracked: avg(early, 'tracked'), done: avg(early, 'done'), hours: +(early.reduce((n, x) => n + x.hours, 0) / early.length).toFixed(1)} : null,
    tomorrow: (() => { try { const d = addDays(T, 1), ts = allTaskRefs().filter(r => !r.done && (r.day === d || r.doDay === d)); return {tasks: ts.length}; } catch(e){ return {tasks: 0}; } })()};
}

/* ---------- the doors out ----------
   Each makes the real thing in the real room and says where it went. `undo` puts it back. */
const RESCUE_EXITS = [
  {id: 'task',     glyph: '☐', name: 'a task',            hint: 'into the Inbox, in the planner’s shorthand'},
  {id: 'goal',     glyph: '◎', name: 'under a goal',      hint: 'work under one of this week’s goals'},
  {id: 'thread',   glyph: '⌁', name: 'a thread',          hint: 'something to do or turn over on chosen days'},
  {id: 'proof',    glyph: '✺', name: 'a win — keep as proof', hint: 'into Proof, the collection of what I have actually done'},
  {id: 'journal',  glyph: '✎', name: 'a journal entry',   hint: 'kept, in the Lived Record'},
  {id: 'decision', glyph: '⚖', name: 'a decision',        hint: 'open the decision form with this in it'},
  {id: 'question', glyph: '?', name: 'a question to live with', hint: 'an open question that waits for answers'},
  {id: 'person',   glyph: '☺', name: 'a person',          hint: 'log, reach out, or open their page'},
  {id: 'remind',   glyph: '⏰', name: 'a reminder',       hint: 'comes back on a day you choose'},
  {id: 'park',     glyph: '☁', name: 'park it',           hint: 'to the parking place, sorted later'},
  {id: 'mindset',  glyph: '❝', name: 'a line to keep',    hint: 'joins the lines that lean in gently'},
  {id: 'letgo',    glyph: '·', name: 'let it go',         hint: 'fades from the page, stays in the record'},
];
const rescueFirstLine = text => { const t = String(text || '').trim().split('\n')[0].trim(); return t.length > 80 ? t.slice(0, 78).replace(/\s+\S*$/, '') + '…' : t; };

function rescueMakeTasks(text, {listId = 'inbox', outcome = null} = {}){
  const lines = String(text || '').split('\n').map(x => x.trim()).filter(Boolean).slice(0, 12);
  const made = lines.map(l => commitQuickTask(l, {listId})).filter(Boolean);
  if(outcome){ outcome.taskIds = outcome.taskIds || []; made.forEach(t => { if(!outcome.taskIds.includes(t.id)) outcome.taskIds.push(t.id); }); }
  saveNow();
  return {made, label: made.length === 1 ? 'a task' : made.length + ' tasks', undo: () => {
    made.forEach(t => { spliceOut(S.tasks, x => x.id === t.id); if(outcome) spliceOut(outcome.taskIds, id => id === t.id); }); saveNow(); }};
}
function rescueMakeThread(text, kind, days, weekOf){
  const p = weekPlan(weekOf || weekStart(today()));
  const t = {id: uid(), text: String(text).trim(), kind: kind === 'turn' ? 'turn' : 'do', days: days.slice(), done: {}};
  p.threads.push(t); saveNow();
  return {made: [t], label: 'a thread', undo: () => { spliceOut(p.threads, x => x.id === t.id); saveNow(); }};
}
function rescueMakeEntry(text, type = 'reflection'){
  const body = String(text).trim(), title = rescueFirstLine(body);
  const e = lifeEntryNew({type, title, body: body.length > title.length + 3 ? body : '', extra: type === 'question' ? {status: 'open', answers: []} : {}});
  saveNow();
  return {made: [e], label: type === 'question' ? 'a question' : 'a ' + typeName(type).toLowerCase() + ' entry', go: '#/journals/' + type, undo: () => { spliceOut(S.entries, x => x.id === e.id); saveNow(); }};
}
function rescueMakeReminder(text, day, time){
  const t = planAddReminder({text: String(text).trim().split('\n')[0], day, time}); if(!t) return null;
  return {made: [t], label: 'a reminder', undo: () => { spliceOut(S.tasks, x => x.id === t.id); saveNow(); }};
}
function rescuePark(text, kind){
  const x = parkThought(String(text).trim(), kind || 'todo'); if(!x) return null;
  return {made: [x], label: 'the parking place', undo: () => { parkDrop(x); }};
}
function rescueKeepLine(text){
  const a = affirmationNew(String(text).trim().split('\n')[0].slice(0, 160), 'rescue'); if(!a) return null;
  return {made: [a], label: 'the lines to keep', undo: () => { spliceOut(S.affirmations, x => x.id === a.id); saveNow(); }};
}
/* the days of the week from today on, or the whole of next week */
function rescueWeekDays(which){
  const wk = weekStart(today()), start = which === 'next' ? addDays(wk, 7) : today(), end = addDays(which === 'next' ? addDays(wk, 7) : wk, 6);
  const out = []; for(let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return {weekOf: which === 'next' ? addDays(wk, 7) : wk, days: out};
}
/* the lines of a bank of lines that lean: the owner's own first, then the starters that fit the page */
function rescueWhisperFor(s, avoid){
  const sc = new Set(rescueScenarios(s).map(x => x.id));
  const mine = (typeof affirmationsAll === 'function' ? affirmationsAll() : []).map(a => ({t: a.text, tags: [], own: true}));
  /* now and then, a piece of proof of what I have actually done leans in with the rest */
  const proof = (typeof proofAll === 'function' ? proofAll() : []).map(e => ({t: 'You did this: ' + proofLine(e), tags: ['stuck', 'doubt'], own: true}));
  const pool = RESCUE_WHISPERS.map(w => Object.assign({own: false}, w)).concat(mine, proof).filter(w => w.t && !(avoid || []).includes(w.t));
  if(!pool.length) return null;
  const score = w => (w.tags || []).filter(t => sc.has(t)).length * 3 + (w.own ? 1.2 : 0) + Math.random();
  return pool.sort((a, b) => score(b) - score(a))[0];
}
