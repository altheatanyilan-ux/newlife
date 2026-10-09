/* ============================================================
   ONE QUEUE OF PROMPTS, THAT SAYS WHY

   Three things used to ask for attention on Today, each its own way: the
   duties (a pending list that pulsed), the nudges (one banner at a time) and
   the reminders (a floating list). They are one ranked queue now. Every item
   says the rule that raised it — in words, as the reason it is there — and
   every item has the same three ways out: later (thirty minutes), not today,
   and off. The queue shows five at most; the rest are a count.

   It reads; it does not decide. Dismissals last the period the item belongs
   to (the day, or the week for the weekly ones) and no longer, so a flag you
   waved away on Monday is there on Tuesday if it is still true.

   Kept in S.promptState: what was snoozed or skipped, what is turned off, and
   the habit reminders already sent. The older stores (nudgeDismiss,
   dutyDismiss) are still written for the items that came from them, so
   nothing that reads them is left behind.
   ============================================================ */

const PQ_MAX = 5;
const PQ_RANK = {block: 10, remind: 20, overdue: 30, due: 40, nudge: 50, flag: 60, review: 70, mile: 80};

function pqState(){
  const s = S.promptState = S.promptState && typeof S.promptState === 'object' ? S.promptState : {};
  ['off', 'snooze', 'skip', 'sent'].forEach(k => { s[k] = s[k] && typeof s[k] === 'object' ? s[k] : {}; });
  return s;
}
const pqPeriodKey = it => it.period === 'week' ? 'w' + weekStart(today()) : today();
function pqSuppressed(it){
  const st = pqState();
  if(st.off[it.id] || Object.keys(st.off).some(k => String(it.id).startsWith(k + ':'))) return true;
  if(it.source === 'nudge' && (S.settings.nudgeDisabled || {})[it.id]) return true;
  if(st.skip[it.id] === pqPeriodKey(it)) return true;
  const sn = st.snooze[it.id]; if(sn && new Date(sn) > new Date()) return true;
  return false;
}
/* the three ways out, the same for everything. The items that came from the
   older systems are written to those too. */
function pqLater(it){
  if(it.source === 'duty') dutySnooze(it.dutyId, today());
  else if(it.source === 'nudge') nudgeSnooze(it.id);
  pqState().snooze[it.id] = new Date(Date.now() + 30 * 60 * 1000).toISOString(); saveNow();
}
function pqNotToday(it){
  if(it.source === 'duty') dutyDismissToday(it.dutyId, today());
  else if(it.source === 'nudge') nudgeNotToday(it.id);
  pqState().skip[it.id] = pqPeriodKey(it); saveNow();
}
function pqOff(it){
  if(it.source === 'duty') dutyDismissPermanent(it.dutyId);
  else if(it.source === 'nudge'){ (S.settings.nudgeDisabled = S.settings.nudgeDisabled || {})[it.id] = true; }
  pqState().off[it.id] = true; saveNow();
}
function pqOn(id){ delete pqState().off[id]; if(S.settings.nudgeDisabled) delete S.settings.nudgeDisabled[id]; saveNow(); }

/* ---------- where they come from ---------- */
const pqItem = o => Object.assign({period: 'day', category: 'flag', rank: PQ_RANK.flag}, o);

function pqBlocks(T){
  if(typeof pbdLiveItems !== 'function') return [];
  const it = pbdLiveItems(T), out = [];
  const nextN = it.long ? pbdBlocksOn(T).filter(b => b !== it.long && pbdMin(b.start) >= pbdMin(it.long.start) + it.long.durationMin - 1 && !PBD_KINDS_ANCHOR.includes(b.kind)).length : 0;
  if(it.long) out.push(pqItem({id: 'block-long:' + it.long.id, source: 'block', category: 'now', rank: PQ_RANK.block, msg: `${pbdBlockLabel(it.long)} has run past its time.`,
    rule: `its block ended at ${pbdHM(pbdMin(it.long.start) + it.long.durationMin)} and a sitting on it is still running`,
    acts: (nextN ? [['push the rest 15m', () => pbdLiveAct('push', it.long.id)], ['drop one', () => pbdLiveAct('drop', it.long.id)]] : []).concat([['15m more', () => pbdLiveAct('extend', it.long.id)]])}));
  if(it.start) out.push(pqItem({id: 'block-start:' + it.start.id, source: 'block', category: 'now', rank: PQ_RANK.block, msg: `Start: ${pbdBlockLabel(it.start)} (${pbdSay(it.start.durationMin - (it.start.marginMin || 0))})`,
    rule: `its block begins at ${it.start.start} and nothing is running on it`, go: ['Start', () => pbdLiveAct('start', it.start.id)], live: true}));
  if(it.ask) out.push(pqItem({id: 'block-ask:' + it.ask.id, source: 'block', category: 'now', rank: PQ_RANK.block + 1, msg: `${pbdBlockLabel(it.ask)} \u2014 did this happen?`,
    rule: `its block ended at ${pbdHM(pbdMin(it.ask.start) + it.ask.durationMin)} and has not been answered`,
    acts: TIME_VERDICTS.map(v => [TIME_VERDICT_WORDS[v], () => pbdLiveAct(v, it.ask.id)]).concat([['it did not', () => pbdLiveAct('missed', it.ask.id)]]), live: true}));
  return out;
}
function pqDuties(T){
  if(typeof dutiesForDate !== 'function') return [];
  const out = [];
  dutiesForDate(T).forEach(d => {
    const st = dutyState(d.id, T); if(st !== 'due' && st !== 'overdue') return;
    const win = typeof dutyWindowFor === 'function' ? dutyWindowFor(d.id, T) : null;
    const over = st === 'overdue' && win ? Math.max(0, _hmToMins(_nowHM()) - _hmToMins(win.end)) : 0;
    out.push(pqItem({id: 'duty:' + d.id, dutyId: d.id, source: 'duty', category: 'duty', rank: st === 'overdue' ? PQ_RANK.overdue : PQ_RANK.due,
      msg: d.label, rule: win ? (st === 'overdue' ? `its window ${win.start}\u2013${win.end} closed ${over >= 60 ? Math.floor(over / 60) + 'h ' + (over % 60) + 'm' : over + 'm'} ago` : `its window is ${win.start}\u2013${win.end}, and it is open now`) : 'it is due today',
      go: ['\u2192', () => todayDutyGo(document, d.id, d.route, d.anchor)], dutyAnchor: d.anchor, dutyRoute: d.route}));
  });
  return out;
}
function pqNudges(T){
  if(typeof nudgeQueue !== 'function') return [];
  return nudgeQueue(T).map(n => pqItem({id: n.id, source: 'nudge', category: 'nudge', rank: PQ_RANK.nudge, msg: n.msg, rule: n.why || 'it is that time',
    go: n.action ? [n.actionLabel || 'Go', n.action] : null}));
}
function pqReminders(T){
  if(typeof remindsActive !== 'function') return [];
  return remindsActive().filter(t => ['now', 'late'].includes(remindState(t))).slice(0, 4).map(t => pqItem({id: 'remind:' + t.id, source: 'remind', category: 'remind', rank: PQ_RANK.remind,
    msg: t.text || t.title || 'a reminder', rule: `you asked to be reminded ${remindWhen(t)}`,
    go: ['done', () => { try { remindTick(t); } catch(e){} }]}));
}
function pqReviews(T){
  if(typeof reviewsDue !== 'function') return [];
  return reviewsDue(T).filter(x => !(x.c.key === 'daily' && x.end === T)).map(({c, end, late}) => pqItem({id: 'review:' + c.key + ':' + end, source: 'review', category: 'review', rank: PQ_RANK.review + late,
    msg: `${c.name} review`, rule: late ? `the period ended ${late} day${late === 1 ? '' : 's'} ago and the review was not made` : `the period ends today and the review is not made`,
    period: c.key === 'weekly' || c.key === 'monthly' ? 'week' : 'day', go: ['open', () => openCycleReview(c.key, end)]}));
}

/* ---------- the nudges there were not ---------- */
function pqMissing(T){
  const out = [], hour = new Date().getHours();
  /* a habit near a milestone */
  (S.habits || []).filter(h => !h.archived && !habIsBreaking(h)).forEach(h => {
    const st = habStreak(h), next = (h.milestones || []).find(m => m.days > st.cur);
    if(next && st.cur >= 1 && next.days - st.cur >= 1 && next.days - st.cur <= 2)
      out.push(pqItem({id: 'hab-mile:' + h.id + ':' + next.days, source: 'new', category: 'nudge', rank: PQ_RANK.mile, msg: `${next.days - st.cur} day${next.days - st.cur === 1 ? '' : 's'} to ${h.name}\u2019s ${next.days}-day mark.`,
        rule: `the run is at ${st.cur} of ${next.days} days`, go: ['open', () => openHabitPanel(h.id)]}));
  });
  /* tomorrow is not planned */
  if(hour >= 18){
    const pl = dayPlan(addDays(T, 1));
    if(!pl.planned && !(pl.intentions || []).some(x => (x || '').trim()))
      out.push(pqItem({id: 'tomorrow-unplanned', source: 'new', category: 'nudge', rank: PQ_RANK.nudge + 5, msg: 'Tomorrow has no plan yet.', rule: `it is past 18:00 and nothing is written for ${fmtDate(addDays(T, 1), 'short')}`,
        go: ['Plan tomorrow', () => planMyDay(addDays(T, 1))]}));
  }
  /* a milestone overdue, or slipping */
  try { planLists().filter(l => planListActive(l) && !l.archivedAt).forEach(l => (l.milestones || []).forEach(m => {
    if(m.done || m.status === 'prepared' || m.status === 'on-track') return;
    const late = m.date && m.date < T, slip = m.status === 'slipping';
    if(late || slip) out.push(pqItem({id: 'ms:' + m.id, source: 'new', category: 'flag', rank: PQ_RANK.flag - 2, period: 'week',
      msg: `${m.name} (${l.name}) ${late ? 'is overdue' : 'is slipping'}.`, rule: late ? `its date was ${fmtDate(m.date, 'short')} and it is not marked on track or prepared` : 'its remaining estimates do not fit the time left, at the pace you set',
      go: ['open', () => { S._planSel = {kind: 'list', id: l.id}; navigate('#/planning'); }]}));
  })); } catch(e){}
  /* a person named in a time label, with no interaction logged */
  try {
    const since = Date.now() - 36 * 3600 * 1000;
    (S.timeEntries || []).filter(e => e.endTime && Date.parse(e.startTime) > since && !(e.linkedType === 'person') && (e.what || e.linkedLabel)).forEach(e => {
      const txt = ((e.what || '') + ' ' + (e.linkedLabel || '')).toLowerCase();
      const p = (S.people || []).find(x => x.name && x.name.length > 2 && new RegExp('\\b' + x.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + '\\b').test(txt.replace(/[^a-z0-9 ]/g, '')));
      if(!p) return;
      const day = timeLivingDay(e.startTime);
      if((S.interactions || []).some(i => i.personId === p.id && i.date >= day)) return;
      out.push(pqItem({id: 'person:' + e.id, source: 'new', category: 'nudge', rank: PQ_RANK.nudge + 8, msg: `Log an interaction with ${p.name}?`,
        rule: `\u201c${(e.what || e.linkedLabel).slice(0, 40)}\u201d was tracked at ${timeClockOf(e.startTime)} and nothing is logged with ${p.name.split(' ')[0]} since`,
        go: ['log it', () => { navigate('#/people/' + p.id); }]}));
    });
  } catch(e){}
  return out.slice(0, 6);
}

/* ---------- flags: each with its rule ---------- */
function pqFlags(T){
  const out = [], push = o => out.push(pqItem(o));
  const sittings = (planState().focusSessions || []).filter(r => r.type === 'focus' && r.endedAt).sort((a, b) => a.startedAt < b.startedAt ? -1 : 1);
  /* unlabelled time: an entry with no words, or in the default category, older than a day */
  try {
    const cut = Date.now() - 24 * 3600 * 1000, dflt = timeSettings().defaultCategory || null;
    const bare = (S.timeEntries || []).filter(e => e.endTime && Date.parse(e.endTime) < cut && Date.parse(e.endTime) > cut - 6 * 86400000 && (!(e.what || '').trim() || (dflt && e.categoryId === dflt && !e.linkedType)) && e.kind !== 'break');
    if(bare.length) push({id: 'unlabelled', msg: `${bare.length} stretch${bare.length === 1 ? '' : 'es'} of time with no label.`, period: 'day',
      rule: `${bare.length === 1 ? 'an entry' : bare.length + ' entries'} from the last week ${bare.length === 1 ? 'has' : 'have'} no words${dflt ? ' or sit in the default category' : ''} and ${bare.length === 1 ? 'is' : 'are'} over a day old`,
      go: ['name it', () => openTimeEntryModal(bare[0].id)]});
  } catch(e){}
  /* a time intention at risk (Phase 9 supplies them) */
  if(typeof timeIntentionFlags === 'function') try { timeIntentionFlags(T).forEach(x => push(Object.assign({source: 'flag', period: 'week'}, x))); } catch(e){}
  /* a list commitment that is behind */
  try { planLists().filter(l => planListActive(l) && l.targetHoursPerWeek).forEach(l => {
    const d = planListCommitmentData(l);
    if(d && d.verdict === 'behind') push({id: 'commit:' + l.id, period: 'week', msg: `${l.name} is behind its pace.`,
      rule: `it needs about ${d.requiredHrsPerWk.toFixed ? d.requiredHrsPerWk.toFixed(1) : d.requiredHrsPerWk} h a week and is running at ${d.actualHrsPerWk.toFixed ? d.actualHrsPerWk.toFixed(1) : d.actualHrsPerWk}`,
      go: ['open', () => { S._planSel = {kind: 'list', id: l.id}; navigate('#/planning'); }]});
  }); } catch(e){}
  /* an in-focus skill with no hours in seven days */
  try { (typeof focusSkills === 'function' ? focusSkills() : []).forEach(sk => {
    const recent = (S.timeEntries || []).some(e => e.linkedType === 'skill' && e.linkedId === sk.id && daysBetween(timeLivingDay(e.startTime), T) <= 7);
    const last = sk.lastPracticed ? daysBetween(sk.lastPracticed, T) : 999;
    if(!recent && last > 7) push({id: 'skill-idle:' + sk.id, period: 'week', msg: `${sk.name} is in focus and has had no time this week.`,
      rule: `it is marked in focus, with no hours logged against it in seven days${sk.lastPracticed ? ` (last practised ${fmtDate(sk.lastPracticed, 'short')})` : ''}`, go: ['open', () => navigate('#/identity/skills')]});
  }); } catch(e){}
  /* an in-progress list or project with no time in fourteen days */
  try { planLists().filter(l => planListActive(l) && !l.archivedAt && l.id !== 'inbox').forEach(l => {
    const ids = new Set((S.tasks || []).filter(t => t.listId === l.id).map(t => t.id));
    const open = (S.tasks || []).filter(t => t.listId === l.id && !t.done).length;
    const everTimed = (S.timeEntries || []).some(e => e.linkedType === 'task' && ids.has(e.linkedId));
    const recent = (S.timeEntries || []).some(e => e.linkedType === 'task' && ids.has(e.linkedId) && daysBetween(timeLivingDay(e.startTime), T) <= 14);
    if(open && everTimed && !recent) push({id: 'list-idle:' + l.id, period: 'week', msg: `${l.name} has had no time for a fortnight.`,
      rule: `it has ${open} open task${open === 1 ? '' : 's'} and time was spent on it before, but none in the last fourteen days`, go: ['open', () => { S._planSel = {kind: 'list', id: l.id}; navigate('#/planning'); }]});
  }); } catch(e){}
  /* estimate drift above 150% */
  try {
    const done = (S.tasks || []).filter(t => t.done && t.doneAt && daysBetween(String(t.doneAt).slice(0, 10), T) <= 14 && pbdEstOf(t) > 0 && (t.focusTime || 0) > 0);
    const over = done.filter(t => t.focusTime > pbdEstOf(t) * 1.5);
    if(over.length >= 2) push({id: 'drift', period: 'week', msg: `${over.length} tasks finished well over their estimates.`,
      rule: `${over.length} of the ${done.length} tasks finished in the last fortnight took more than 150% of their estimate (e.g. \u201c${(over[0].title || over[0].text || '').slice(0, 30)}\u201d, ${pbdSay(over[0].focusTime)} against ${pbdSay(pbdEstOf(over[0]))})`,
      go: ['see them', () => navigate('#/today/time')]});
  } catch(e){}
  /* break overruns rising over three sittings */
  try {
    const last3 = sittings.filter(r => (r.breaks || []).length).slice(-3);
    if(last3.length === 3){
      const o = last3.map(r => (r.breaks || []).filter(b => b.overrun).reduce((a, b) => a + (Date.parse(b.to) - Date.parse(b.from)) / 60000, 0));
      if(o[0] < o[1] && o[1] < o[2] && o[2] >= 3) push({id: 'overruns', period: 'week', msg: 'Breaks are running over more each time.',
        rule: `the overrun in the last three sittings with breaks was ${o.map(x => Math.round(x) + 'm').join(' \u2192 ')}`, go: ['see time', () => navigate('#/today/time')]});
    }
  } catch(e){}
  /* the top two missed three days running */
  try {
    let run = 0;
    for(let i = 1; i <= 3; i++){
      const d = addDays(T, -i), pl = (S.plans || {})[d]; if(!pl) break;
      const ids = pbdTopTwoTasks(pl); if(!ids.length) break;
      const miss = ids.every(id => { const r = findTaskRef(id); return !r || !r.done || String(r.task.doneAt || '').slice(0, 10) > d; });
      if(!miss) break; run++;
    }
    if(run === 3) push({id: 'top-two-missed', period: 'day', msg: 'The day\u2019s top two have gone undone three days running.',
      rule: 'for each of the last three days the two chosen as top two were not finished that day', go: ['plan today', () => planMyDay(T)]});
  } catch(e){}
  /* a protected block used for something else */
  try {
    pbdBlocksOn(T).filter(b => b.kind === 'protect').forEach(b => {
      const a = pbdMin(b.start), z = a + b.durationMin, words = (b.label || '').toLowerCase().split(/\W+/).filter(w => w.length > 3);
      const other = (S.timeEntries || []).filter(e => e.endTime && timeLivingDay(e.startTime) === T).filter(e => {
        const s = new Date(e.startTime), x = s.getHours() * 60 + s.getMinutes(), y = x + timeMinutes(e);
        const ov = Math.min(y, z) - Math.max(x, a); if(ov < 10) return false;
        const txt = ((e.what || '') + ' ' + (e.linkedLabel || '')).toLowerCase();
        return !words.some(w => txt.includes(w)) && e.kind !== 'break';
      });
      if(other.length) push({id: 'protect-used:' + b.id, period: 'day', msg: `${b.label || 'Protected time'} had something else in it.`,
        rule: `${other.length} stretch${other.length === 1 ? '' : 'es'} (${other.map(e => e.what || timeCategory(e.categoryId).name).slice(0, 2).join(', ')}) ran inside ${b.start}\u2013${pbdHM(z)}, which you protected`, go: ['see time', () => navigate('#/today/time')]});
    });
  } catch(e){}
  /* a reflection or system review due */
  try { const k = typeof fzKolb === 'function' ? fzKolb() : {};
    Object.keys(k).filter(key => k[key] && k[key].skipped && !k[key].done).slice(0, 1).forEach(key => { const [type, id] = key.split(':'); const sub = {type, id};
      push({id: 'kolb:' + key, period: 'week', msg: `A reflection on ${fzSubjectName(sub) || 'a skill'} was put off.`, rule: 'three more sittings on it came round and the reflection was skipped when offered', go: ['reflect', () => fzKolbShow(sub, key, fzSittingsOn(sub))]}); });
  } catch(e){}
  return out.map(x => pqItem(Object.assign({source: 'flag', category: 'flag', rank: PQ_RANK.flag}, x)));
}

/* ---------- the queue ---------- */
function promptQueue(T = today()){
  let all = [];
  [pqBlocks, pqReminders, pqDuties, pqNudges, pqMissing, pqFlags, pqReviews].forEach(f => { try { all = all.concat(f(T)); } catch(e){ console.warn('a prompt source failed', f.name, e); } });
  all = all.filter(it => !pqSuppressed(it));
  const seen = new Set(); all = all.filter(it => seen.has(it.id) ? false : (seen.add(it.id), true));
  return all.sort((a, b) => a.rank - b.rank || String(a.id).localeCompare(String(b.id)));
}
const PQ_CAT = {now: 'now', remind: 'reminder', duty: 'to do', nudge: 'nudge', flag: 'noticed', review: 'review'};
function pqRowHTML(it, i){
  const acts = (it.acts || []).map(([l], j) => `<button class="chip sm" data-pqact="${i}:${j}">${esc(l)}</button>`).join('');
  const goParts = it.source === 'duty' ? ` data-duty-go="${esc(it.dutyId)}"${it.dutyAnchor ? ` data-duty-anchor="${esc(it.dutyAnchor)}"` : ''}${it.dutyRoute && it.dutyRoute !== '#/today' ? ` data-duty-route="${esc(it.dutyRoute)}"` : ''}` : '';
  return `<div class="pq-row cat-${esc(it.category)}${it.source === 'duty' ? ' dd-item' : ''}" data-pqi="${i}" data-pqid="${esc(it.id)}">
    <span class="pq-cat mono">${esc(PQ_CAT[it.category] || it.category)}</span>
    <span class="pq-body"><span class="pq-msg">${esc(it.msg)}</span><span class="pq-rule">${esc(it.rule || '')}</span></span>
    <span class="pq-acts">${acts}${it.go ? `<button class="btn sm primary pq-go"${goParts} data-pqgo="${i}">${esc(it.go[0])}</button>` : ''}
      <button class="chip sm" data-pqlater="${i}" title="hide for thirty minutes">later</button>
      <button class="chip sm" data-pqnot="${i}" title="hide until tomorrow (or next week, for the weekly ones)">not today</button>
      <button class="tbtn" data-pqoff="${i}" title="stop raising this one \u2014 it can be turned back on in Settings">\u00d7</button></span></div>`;
}
let _pqCur = [];
function pqHTML(T = today()){
  const q = promptQueue(T); _pqCur = q;
  if(!q.length) return '<div class="pq" id="pq" hidden></div>';
  const shown = q.slice(0, PQ_MAX), more = q.length - shown.length;
  return `<div class="pq" id="pq" aria-label="prompts"><div class="pq-h"><span class="sc" style="margin:0">Prompts</span><span class="mono pq-n">${q.length}</span>
    <span class="faint mono pq-sub">each says why it is here</span></div>
    ${shown.map((it, i) => pqRowHTML(it, i)).join('')}
    ${more > 0 ? `<div class="faint mono pq-more">${more} more, below these in rank</div>` : ''}</div>`;
}
function pqBind(box, T = today()){
  if(!box) return;
  const q = _pqCur;
  const done = () => { sound('click'); pqRepaint(); };
  box.querySelectorAll('[data-pqgo]').forEach(b => b.onclick = ev => { const it = q[+b.dataset.pqgo]; if(it && it.go){ ev.stopPropagation(); it.go[1](); if(it.source === 'block') setTimeout(pqRepaint, 50); } });
  box.querySelectorAll('[data-pqact]').forEach(b => b.onclick = () => { const [i, j] = b.dataset.pqact.split(':').map(Number); const it = q[i]; if(it && it.acts && it.acts[j]){ it.acts[j][1](); done(); } });
  box.querySelectorAll('[data-pqlater]').forEach(b => b.onclick = () => { const it = q[+b.dataset.pqlater]; if(it){ pqLater(it); done(); } });
  box.querySelectorAll('[data-pqnot]').forEach(b => b.onclick = () => { const it = q[+b.dataset.pqnot]; if(it){ pqNotToday(it); done(); } });
  box.querySelectorAll('[data-pqoff]').forEach(b => b.onclick = () => { const it = q[+b.dataset.pqoff]; if(it){ pqOff(it);
    toast(esc(`That one is off. It can be turned back on in Settings → Prompts.`), 5000, {label: 'undo', fn: () => { pqOn(it.id); pqRepaint(); }}); done(); } });
}
function pqRepaint(){
  const box = document.getElementById('pq') ? document.getElementById('pq').parentNode : document.getElementById('todayAutoPrompts');
  if(!box) return;
  box.innerHTML = pqHTML(today()); pqBind(box, today());
  if(typeof paintTodayStrip === 'function') paintTodayStrip();
}

/* ---------- habit reminders, from habit blocks ----------
   A habit with a time of day is a block; when its time comes, a browser
   notification says so, if the browser has been allowed to — the same
   permission the reminders use. Once a day per habit. */
function pqHabitNotify(){
  try {
    if(typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const T = today(), now = new Date(), nm = now.getHours() * 60 + now.getMinutes(), st = pqState();
    (S.habits || []).forEach(h => {
      if(h.archived || habIsBreaking(h) || h.at == null || h.at === '' || !habDue(h, T) || habKept(h, T)) return;
      const at = Math.round(+h.at * 60), key = 'hab:' + h.id + ':' + T;
      if(nm >= at && nm < at + 10 && !st.sent[key]){
        st.sent[key] = 1; saveNow();
        try { new Notification(h.name, {body: h.min ? `The minimum: ${h.min}` : 'It is its time.', tag: key}); } catch(e){}
      }
    });
    /* the record of what was sent is trimmed so it does not grow for ever */
    Object.keys(st.sent).forEach(k => { const d = k.split(':').pop(); if(d < addDays(T, -3)) delete st.sent[k]; });
  } catch(e){}
}
setInterval(pqHabitNotify, 60000);

/* ---------- Settings: what can be turned off ---------- */
const PQ_KINDS = [['unlabelled', 'Unlabelled time'], ['commit', 'A list behind its pace'], ['skill-idle', 'An in-focus skill with no time'], ['list-idle', 'A list with no time for a fortnight'],
  ['drift', 'Estimates running well over'], ['overruns', 'Break overruns rising'], ['top-two-missed', 'The top two missed three days'], ['protect-used', 'Protected time used for something else'],
  ['ms', 'A milestone overdue or slipping'], ['hab-mile', 'A habit near a milestone'], ['tomorrow-unplanned', 'Tomorrow not planned'], ['person', 'A person named in a time label'], ['kolb', 'A reflection put off']];
function pqSettingsHTML(){
  const st = pqState();
  return `<div class="card rv"><h3>Prompts</h3>
    <p class="muted" style="font-size:.85rem">Everything that asks for attention on Today is one queue, ranked, five at a time, each with the rule that raised it. These are the kinds that can be turned off; the same three ways out (later, not today, off) are on every row.</p>
    ${PQ_KINDS.map(([id, label]) => { const off = Object.keys(st.off).some(k => k === id || k.startsWith(id + ':'));
      return `<div class="opt"><div><b>${esc(label)}</b></div><label class="toggle ${off ? '' : 'on'}" data-pqtog="${esc(id)}"><span class="sw"></span></label></div>`; }).join('')}
    ${Object.keys(st.off).length ? `<div class="opt"><div><b>Turned off from the queue</b><div class="d">${Object.keys(st.off).length} item${Object.keys(st.off).length === 1 ? '' : 's'}.</div></div><button class="btn sm ghost" id="pqAllOn">turn them all back on</button></div>` : ''}</div>`;
}
function pqSettingsBind(root){
  (root || document).querySelectorAll('[data-pqtog]').forEach(t => t.onclick = () => {
    const id = t.dataset.pqtog, st = pqState();
    const keys = Object.keys(st.off).filter(k => k === id || k.startsWith(id + ':'));
    if(keys.length){ keys.forEach(k => delete st.off[k]); t.classList.add('on'); } else { st.off[id] = true; t.classList.remove('on'); }
    saveNow(); });
  const all = (root || document).querySelector('#pqAllOn'); if(all) all.onclick = () => { pqState().off = {}; S.settings.nudgeDisabled = {}; saveNow(); rerender(); };
}
