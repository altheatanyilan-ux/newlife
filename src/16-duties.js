/* ============================================================
   DUTIES — central registry for every recurring action the
   user is meant to tend to each day or cycle.

   Public surface:
     dutiesForDate(T)         → array of active duty defs for date T
     dutyDone(id, T)          → bool — completion from existing records
     dutyState(id, T)         → 'upcoming'|'due'|'overdue'|'done'|'skipped'
     dutyWindowFor(id, T)     → {start:'HH:MM', end:'HH:MM', whyLabel} | null
     registerDuty(def)        → rooms / settings can add custom duties
     migrateDD()              → called from migrate(); lazy-inits stores

   Stores:
     S.dutySettings  META — per-duty overrides {[id]: {on, window, notify}}
     S.dutyDismiss   META — snooze/not-today/permanent per duty per day
                              {[id:day]: {until?, permanent?}}
     S.dutyLog       ARRAY — add-only records {id, dutyId, date, outcome,
                              doneAt, onTime}
   ============================================================ */

/* ---------- helpers ---------- */

function _hmToMins(hm){ const [h,m]=(hm||'').split(':').map(Number); return (h||0)*60+(m||0); }
function _minsToHM(n){ n=((n%1440)+1440)%1440; return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0'); }
function _nowHM(){ const d=new Date(); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }

/* Rolling median of a field (in minutes) from the last `days` checkins */
function _medianMins(field, days){
  const from = addDays(today(), -(days-1));
  const vals = [];
  for(const [d, c] of Object.entries(S.checkins||{})){
    if(d < from || !c[field]) continue;
    const iso = c[field];
    const dt = new Date(iso);
    let mins = dt.getHours()*60+dt.getMinutes();
    if(field === 'sleepAt' && mins < 180) mins += 1440; // past midnight
    vals.push(mins);
  }
  if(!vals.length) return null;
  vals.sort((a,b)=>a-b);
  const mid = Math.floor(vals.length/2);
  return vals.length%2 ? vals[mid] : Math.round((vals[mid-1]+vals[mid])/2);
}
function dutyMedianWake(days=14){
  return _medianMins('wakeAt', days);
}
function dutyMedianSleep(days=14){
  return _medianMins('sleepAt', days);
}

/* Compute a {start, end} window from a window definition */
function dutyWindowFor(id, T){
  const d = _allDuties().find(x=>x.id===id); if(!d) return null;
  const wd = d.windowDef; if(!wd) return null;
  if(wd.type === 'event-driven') return null;
  if(wd.type === 'anytime'){
    const wake = S.settings?.wakeTime || '07:00';
    const sleep = S.settings?.sleepPromptAt || '22:30';
    return {start: wake, end: sleep, whyLabel: 'any time during the day'};
  }
  if(wd.type === 'after-wake'){
    const median = dutyMedianWake();
    const base = median != null ? median : _hmToMins(S.settings?.wakeTime || '07:00');
    const start = _minsToHM(base + (wd.startOffset||0));
    const end   = _minsToHM(base + (wd.endOffset||120));
    const approx = _minsToHM(base);
    return {start, end, whyLabel: `usually wake around ${approx}`};
  }
  if(wd.type === 'before-sleep'){
    const median = dutyMedianSleep();
    const base = median != null ? median : _hmToMins(S.settings?.sleepPromptAt || '22:30');
    const start = _minsToHM(base + (wd.startOffset||-90));
    const end   = _minsToHM(base + (wd.endOffset||60));
    const approx = _minsToHM(base);
    return {start, end, whyLabel: `usually sleep around ${approx}`};
  }
  if(wd.type === 'fixed'){
    return {start: wd.start, end: wd.end, whyLabel: `window ${wd.start}–${wd.end}`};
  }
  return null;
}

/* ---------- completion rules ---------- */

function _reviewLog(){ return S.reviews || {}; }

function _dutyDoneCheck(id, T){
  try {
    const c = typeof checkin === 'function' ? checkin(T) : (S.checkins?.[T]||{});
    switch(id){
      case 'wake_log':
        return !!c.wakeAt;
      case 'dream_log':
        return typeof dreamStateOn === 'function'
          ? dreamStateOn(T) !== 'unasked'
          : !!(c.noDream || (S.entries||[]).some(e => e.type==='dream' && (e.occurredAt||e.createdAt||'').slice(0,10)===T));
      case 'morning_card':
        return S.settings?.morningCardOn === T || !!S.settings?.morningCardOff;
      case 'morning_practice':
        return (_reviewLog().lastMorning||'') >= T;
      case 'plan_tomorrow': {
        const tom = addDays(T,1);
        const p = typeof dayPlan === 'function' ? dayPlan(tom) : (S.plans?.[tom]||{});
        return (p.intentions||[]).filter(Boolean).length > 0;
      }
      case 'evening_review':
        return !!c.eveningFlowAt || (_reviewLog().lastEvening||'') >= T;
      case 'habit_rings': {
        if(typeof habDueOn !== 'function') return false;
        const due = habDueOn(T);
        return due.length > 0 && due.every(h => typeof habKept === 'function' && habKept(h, T));
      }
      case 'theatre_21':
        return typeof theatreDoneToday === 'function' ? theatreDoneToday() : !!(S.rehearsal?.days||[]).includes(T);
      case 'stillness_practice':
        return typeof stillMinutesOn === 'function' ? stillMinutesOn(T) > 0 : false;
      case 'study_deck':
        return typeof sdDueCount === 'function' ? sdDueCount() === 0 : false;
      case 'knowledge_tree_tend':
        return typeof treeTendItem === 'function' ? treeTendItem() === null : true;
      case 'ls_recall': {
        const cutoff = addDays(T, -3);
        return (S.lsRecalls||[]).some(r => (r.createdAt||'').slice(0,10) >= cutoff);
      }
      case 'clock_sitting': {
        const running = typeof FocusTimer !== 'undefined' && FocusTimer.state().running;
        if(running) return true;
        const nudgeMins = S.settings?.trackingNudgeMinutes != null ? +S.settings.trackingNudgeMinutes : 45;
        if(nudgeMins <= 0) return true;
        const sessions = typeof focusSessions === 'function' ? focusSessions() : [];
        const lastEnd = sessions.filter(s=>s.endedAt).map(s=>s.endedAt).sort().pop();
        if(!lastEnd) return false;
        return Math.round((Date.now()-new Date(lastEnd).getTime())/60000) < nudgeMins;
      }
      case 'weekly_review':
        return (_reviewLog().lastWeekly||'') >= weekStart(T);
      case 'plan_week':
        return (_reviewLog().lastWeekly||'') >= weekStart(T);
      case 'values_snapshot': {
        const snaps = (S.valueSnapshots||[]).map(s=>s.date).sort().reverse();
        return snaps.length > 0 && daysBetween(snaps[0], T) <= 7;
      }
      case 'people_attention':
        return typeof peopleNeedingAttention === 'function'
          ? peopleNeedingAttention().length === 0
          : true;
      case 'monthly_review':
        return (_reviewLog().lastMonthly||'').slice(0,7) === T.slice(0,7);
      case 'finance_log':
        return (S.txns||[]).some(t => (t.date||'').slice(0,7) === T.slice(0,7))
          || (S.incomeStreams||[]).some(is => (is.lastLoggedAt||'').slice(0,7) === T.slice(0,7));
      case 'seasonal_review': {
        const last = _reviewLog().lastSeasonal||'';
        if(!last) return false;
        return daysBetween(last, T) <= 92;
      }
      case 'half_review': {
        const last = _reviewLog().lastHalf||'';
        if(!last) return false;
        return daysBetween(last, T) <= 182;
      }
      case 'annual_review': {
        const last = _reviewLog().lastAnnual||'';
        if(!last) return false;
        return daysBetween(last, T) <= 365;
      }
      case 'sealed_letters':
        return typeof lettersOpeningNow === 'function' ? lettersOpeningNow().length === 0 : true;
      case 'decisions_due':
        return typeof decisionsDue === 'function' ? decisionsDue().length === 0 : true;
      case 'jazz_daily_plan':
        return false; // presence reminder only — user dismisses "not today"
      default:
        return false;
    }
  } catch(e){ return false; }
}

/* ---------- recurrence check ---------- */

function _dutyActiveOn(d, T){
  const r = d.recurrence;
  if(!r) return true;
  switch(r.type){
    case 'daily': return true;
    case 'daily-conditional': return r.check ? r.check(T) : true;
    case 'weekly-day': return new Date(T+'T12:00:00').getDay() === r.day;
    case 'month-end': {
      const next = new Date(T.slice(0,4), +T.slice(5,7), 1).toISOString().slice(0,10);
      return daysBetween(T, next) <= (r.within||3);
    }
    case 'quarterly': {
      const qEnds = ['03-31','06-30','09-30','12-31'];
      const mm = T.slice(5,10);
      return qEnds.some(e => { const end = T.slice(0,4)+'-'+e; return daysBetween(T, end)>=0 && daysBetween(T,end)<=7; });
    }
    case 'half': {
      const last = _reviewLog().lastHalf||''; if(!last) return true;
      return daysBetween(last, T) >= 175;
    }
    case 'annual': {
      const last = _reviewLog().lastAnnual||''; if(!last) return true;
      return daysBetween(last, T) >= 350;
    }
    case 'event-driven': return r.check ? r.check(T) : false;
    default: return true;
  }
}

/* ---------- the duty registry ---------- */

const DUTIES = [
  {
    id: 'wake_log',
    label: 'I woke up at',
    anchor: '#wokeAt',
    route: '#/today',
    windowDef: {type:'after-wake', startOffset:-30, endOffset:120},
    recurrence: {type:'daily'},
    skipDone: true,
    notify: false,
    defaultOn: true,
  },
  {
    id: 'dream_log',
    label: 'Record a dream',
    anchor: '[data-duty-id="dream_log"]',
    route: '#/today',
    windowDef: {type:'after-wake', startOffset:-30, endOffset:150},
    recurrence: {type:'daily'},
    skipDone: true,
    notify: false,
    defaultOn: true,
  },
  {
    id: 'morning_card',
    label: 'Morning card',
    anchor: '[data-duty-id="morning_card"]',
    route: '#/today',
    windowDef: {type:'after-wake', startOffset:-30, endOffset:120},
    recurrence: {type:'daily'},
    skipDone: true,
    notify: false,
    defaultOn: true,
  },
  {
    id: 'morning_practice',
    label: 'Morning practice',
    anchor: '#t-checkin',
    route: '#/today',
    windowDef: {type:'after-wake', startOffset:0, endOffset:150},
    recurrence: {type:'daily'},
    skipDone: true,
    notify: false,
    defaultOn: true,
  },
  {
    id: 'theatre_21',
    label: 'Morning Theatre',
    anchor: '#t-theatre',
    route: '#/today',
    windowDef: {type:'after-wake', startOffset:0, endOffset:150},
    recurrence: {type:'daily'},
    skipDone: false,
    notify: false,
    defaultOn: true,
  },
  {
    id: 'habit_rings',
    label: 'Habits',
    anchor: '#t-habits',
    route: '#/today',
    windowDef: {type:'anytime'},
    recurrence: {type:'daily'},
    skipDone: true,
    notify: false,
    defaultOn: true,
  },
  {
    id: 'stillness_practice',
    label: 'Stillness',
    anchor: '[data-duty-id="stillness_practice"]',
    route: '#/stillness',
    windowDef: {type:'anytime'},
    recurrence: {type:'daily'},
    skipDone: true,
    notify: false,
    defaultOn: true,
  },
  {
    id: 'jazz_daily_plan',
    label: 'Jazz practice',
    anchor: '[data-duty-id="jazz_daily_plan"]',
    route: '#/jazz',
    windowDef: {type:'anytime'},
    recurrence: {type:'daily'},
    skipDone: true,
    notify: false,
    defaultOn: false,
  },
  {
    id: 'study_deck',
    label: 'Study Deck cards',
    anchor: '[data-duty-id="study_deck"]',
    route: '#/studydeck',
    windowDef: {type:'anytime'},
    recurrence: {type:'daily-conditional', check: () => typeof sdDueCount === 'function' && sdDueCount() > 0},
    skipDone: true,
    notify: false,
    defaultOn: true,
  },
  {
    id: 'knowledge_tree_tend',
    label: 'Tend the Knowledge Tree',
    anchor: '[data-duty-id="knowledge_tree_tend"]',
    route: '#/tree',
    windowDef: {type:'anytime'},
    recurrence: {type:'daily-conditional', check: () => typeof treeTendItem === 'function' && treeTendItem() !== null},
    skipDone: true,
    notify: false,
    defaultOn: true,
  },
  {
    id: 'ls_recall',
    label: 'Learning Studio recall',
    anchor: '[data-duty-id="ls_recall"]',
    route: '#/learningStudio',
    windowDef: {type:'anytime'},
    recurrence: {type:'event-driven', check: T => {
      const cutoff = addDays(T,-3);
      return !(S.lsRecalls||[]).some(r => (r.createdAt||'').slice(0,10) >= cutoff);
    }},
    skipDone: true,
    notify: false,
    defaultOn: true,
  },
  {
    id: 'clock_sitting',
    label: 'Nothing being tracked',
    anchor: '[data-duty-id="clock_sitting"]',
    route: '#/today/time',
    windowDef: {type:'anytime'},
    recurrence: {type:'daily'},
    skipDone: true,
    notify: false,
    defaultOn: true,
  },
  {
    id: 'values_snapshot',
    label: 'Values snapshot',
    anchor: '[data-duty-id="values_snapshot"]',
    route: '#/values',
    windowDef: {type:'weekly-day', day: 0, start:'18:00', end:'23:00'},
    recurrence: {type:'weekly-day', day: 0},
    skipDone: true,
    notify: false,
    defaultOn: true,
  },
  {
    id: 'people_attention',
    label: 'People needing attention',
    anchor: '[data-duty-id="people_attention"]',
    route: '#/people',
    windowDef: {type:'anytime'},
    recurrence: {type:'event-driven', check: () => typeof peopleNeedingAttention === 'function' && peopleNeedingAttention().length > 0},
    skipDone: true,
    notify: false,
    defaultOn: true,
  },
  {
    id: 'weekly_review',
    label: 'Weekly review',
    anchor: '[data-duty-id="weekly_review"]',
    route: '#/today',
    windowDef: {type:'fixed', start:'17:00', end:'23:30'},
    recurrence: {type:'weekly-day', day: 0},
    skipDone: true,
    notify: false,
    defaultOn: true,
  },
  {
    id: 'plan_week',
    label: 'Plan the week',
    anchor: '#planNextWeek',
    route: '#/today',
    windowDef: {type:'fixed', start:'17:00', end:'23:30'},
    recurrence: {type:'weekly-day', day: 0},
    skipDone: true,
    notify: false,
    defaultOn: true,
  },
  {
    id: 'plan_tomorrow',
    label: 'Plan tomorrow',
    anchor: '#planTomorrow',
    route: '#/today',
    windowDef: {type:'before-sleep', startOffset:-90, endOffset:30},
    recurrence: {type:'daily'},
    skipDone: true,
    notify: false,
    defaultOn: true,
  },
  {
    id: 'evening_review',
    label: 'Evening review',
    anchor: '#eveningReview',
    route: '#/today',
    windowDef: {type:'before-sleep', startOffset:-90, endOffset:30},
    recurrence: {type:'daily'},
    skipDone: true,
    notify: false,
    defaultOn: true,
  },
  {
    id: 'monthly_review',
    label: 'Monthly review',
    anchor: '[data-duty-id="monthly_review"]',
    route: '#/today',
    windowDef: {type:'fixed', start:'17:00', end:'23:30'},
    recurrence: {type:'month-end', within: 4},
    skipDone: true,
    notify: false,
    defaultOn: true,
  },
  {
    id: 'finance_log',
    label: 'Finance log',
    anchor: '[data-duty-id="finance_log"]',
    route: '#/finance',
    windowDef: {type:'fixed', start:'17:00', end:'23:30'},
    recurrence: {type:'month-end', within: 4},
    skipDone: true,
    notify: false,
    defaultOn: false,
  },
  {
    id: 'seasonal_review',
    label: 'Seasonal review',
    anchor: '[data-duty-id="seasonal_review"]',
    route: '#/today',
    windowDef: {type:'fixed', start:'17:00', end:'23:30'},
    recurrence: {type:'quarterly'},
    skipDone: true,
    notify: false,
    defaultOn: true,
  },
  {
    id: 'half_review',
    label: 'Half-year review',
    anchor: '[data-duty-id="half_review"]',
    route: '#/today',
    windowDef: {type:'fixed', start:'17:00', end:'23:30'},
    recurrence: {type:'half'},
    skipDone: true,
    notify: false,
    defaultOn: true,
  },
  {
    id: 'annual_review',
    label: 'Annual review',
    anchor: '[data-duty-id="annual_review"]',
    route: '#/today',
    windowDef: {type:'fixed', start:'17:00', end:'23:30'},
    recurrence: {type:'annual'},
    skipDone: true,
    notify: false,
    defaultOn: true,
  },
  {
    id: 'sealed_letters',
    label: 'A letter from you',
    anchor: '[data-duty-id="sealed_letters"]',
    route: '#/today',
    windowDef: {type:'event-driven'},
    recurrence: {type:'event-driven', check: () => typeof lettersOpeningNow === 'function' && lettersOpeningNow().length > 0},
    skipDone: true,
    notify: true,
    defaultOn: true,
  },
  {
    id: 'decisions_due',
    label: 'Decision review due',
    anchor: '[data-duty-id="decisions_due"]',
    route: '#/today',
    windowDef: {type:'event-driven'},
    recurrence: {type:'event-driven', check: () => typeof decisionsDue === 'function' && decisionsDue().length > 0},
    skipDone: true,
    notify: false,
    defaultOn: true,
  },
];

const _extraDuties = [];
function registerDuty(def){ _extraDuties.push(def); }
function _allDuties(){ return [...DUTIES, ..._extraDuties]; }

/* ---------- public API ---------- */

function dutyDone(id, T){
  T = T || today();
  const ds = S.dutySettings?.[id] || {};
  if(ds.on === false) return true; // turned off = treated as done
  return _dutyDoneCheck(id, T);
}

function dutyDismissed(id, T){
  T = T || today();
  const dm = S.dutyDismiss || {};
  const k = id+':'+T;
  const entry = dm[k]; if(!entry) return false;
  if(entry.permanent) return true;
  if(entry.until && new Date(entry.until) > new Date()) return true;
  return false;
}

function dutySnooze(id, T){
  T = T || today();
  S.dutyDismiss = S.dutyDismiss || {};
  const until = new Date(Date.now() + 30*60*1000).toISOString();
  S.dutyDismiss[id+':'+T] = {until};
  saveNow();
}

function dutyDismissToday(id, T){
  T = T || today();
  S.dutyDismiss = S.dutyDismiss || {};
  const midnight = addDays(T,1)+'T04:00:00';
  S.dutyDismiss[id+':'+T] = {until: new Date(midnight).toISOString()};
  saveNow();
}

function dutyDismissPermanent(id){
  const T = today();
  S.dutyDismiss = S.dutyDismiss || {};
  S.dutyDismiss[id+':'+T] = {permanent: true};
  const ds = S.dutySettings = S.dutySettings || {};
  ds[id] = ds[id] || {};
  ds[id].on = false;
  saveNow();
}

function dutyState(id, T){
  T = T || today();
  const d = _allDuties().find(x=>x.id===id);
  if(!d) return 'upcoming';
  const ds = S.dutySettings?.[id] || {};
  if(ds.on === false) return 'done';
  if(dutyDone(id, T)) return 'done';
  if(dutyDismissed(id, T)) return 'skipped';
  const win = dutyWindowFor(id, T);
  if(!win) return d.recurrence?.type === 'event-driven' ? 'due' : 'upcoming';
  const now = _nowHM();
  if(now >= win.start && now <= win.end) return 'due';
  if(now > win.end) return 'overdue';
  return 'upcoming';
}

function dutiesForDate(T){
  T = T || today();
  const all = _allDuties();
  return all.filter(d => {
    const ds = S.dutySettings?.[d.id] || {};
    const on = ds.on !== undefined ? ds.on : d.defaultOn;
    if(!on) return false;
    return _dutyActiveOn(d, T);
  });
}

/* Count of duties in 'due' or 'overdue' state (not done, not skipped) */
function dutyPendingCount(T){
  T = T || today();
  return dutiesForDate(T).filter(d => {
    const st = dutyState(d.id, T);
    return st === 'due' || st === 'overdue';
  }).length;
}

/* ---------- migration ---------- */

function migrateDD(){
  S.dutySettings = S.dutySettings || {};
  S.dutyDismiss  = S.dutyDismiss  || {};
  if(!Array.isArray(S.dutyLog)) S.dutyLog = [];
}

/* ============================================================
   DUTIES UI — reads duty state and applies CSS classes to
   every [data-duty-id] element currently in the DOM.
   Called after every rerender and on a 60-second tick.
   Writes no data.
   ============================================================ */

function dutyUpdateUI(T){
  if(typeof dutyState !== 'function') return;
  T = T || today();
  const intensity = (S.settings && S.settings.dutyIntensity) || 'normal';

  /* clear all previous state */
  document.querySelectorAll('[data-duty-id]').forEach(el => {
    el.classList.remove('duty-due','duty-overdue','duty-done','duty-skipped','duty-primary');
    const lbl = el.querySelector('.duty-overdue-label');
    if(lbl) lbl.remove();
  });

  /* intensity → CSS variable that scales animation spread */
  const iVal = intensity === 'subtle' ? 0.45 : intensity === 'insistent' ? 1.8 : 1;
  document.documentElement.style.setProperty('--duty-i', iVal);

  if(intensity === 'off') return;

  /* walk every duty element; track single most-urgent for the primary pulse */
  let primaryEl = null, primaryScore = -1;

  document.querySelectorAll('[data-duty-id]').forEach(el => {
    const id = el.dataset.dutyId;
    if(!id) return;
    const state = dutyState(id, T);

    if(state === 'done')   { el.classList.add('duty-done');    return; }
    if(state === 'skipped'){ el.classList.add('duty-skipped'); return; }

    if(state === 'due'){
      el.classList.add('duty-due');
      /* earlier window-end = more urgent among due duties */
      const win = dutyWindowFor(id, T);
      const score = win ? (1440 - _hmToMins(win.end)) : 0;
      if(score > primaryScore){ primaryScore = score; primaryEl = el; }
      return;
    }

    if(state === 'overdue'){
      el.classList.add('duty-overdue');
      const win = dutyWindowFor(id, T);
      const overdueMin = win ? Math.max(0, _hmToMins(_nowHM()) - _hmToMins(win.end)) : 0;
      /* overdue always outranks due; longer overdue = more urgent */
      const score = 10000 + overdueMin;
      if(score > primaryScore){ primaryScore = score; primaryEl = el; }
      /* inject overdue label */
      const lbl = document.createElement('span');
      lbl.className = 'duty-overdue-label';
      lbl.setAttribute('aria-hidden','true');
      lbl.textContent = overdueMin >= 60
        ? `${Math.floor(overdueMin/60)}h${overdueMin%60 ? ' '+overdueMin%60+'m' : ''} overdue`
        : `${overdueMin || '<1'}m overdue`;
      el.appendChild(lbl);
      return;
    }
    /* 'upcoming': no class applied */
  });

  if(primaryEl) primaryEl.classList.add('duty-primary');
}

/* ---------- Today queue panel ---------- */
function dutyQueueHTML(T){
  if(typeof dutiesForDate !== 'function') return '';
  T = T || today();
  const active = dutiesForDate(T);
  const pending = active.filter(d => {
    const st = typeof dutyState === 'function' ? dutyState(d.id, T) : 'upcoming';
    return st === 'due' || st === 'overdue';
  });
  if(!pending.length) return '';

  const rows = pending.map(d => {
    const st = dutyState(d.id, T);
    const win = typeof dutyWindowFor === 'function' ? dutyWindowFor(d.id, T) : null;
    let timeHint = '';
    if(st === 'overdue' && win){
      const overdueMin = Math.max(0, _hmToMins(_nowHM()) - _hmToMins(win.end));
      timeHint = overdueMin >= 60
        ? `${Math.floor(overdueMin/60)}h${overdueMin%60?' '+overdueMin%60+'m':''} over`
        : `${overdueMin||'<1'}m over`;
    } else if(win){
      timeHint = `until ${win.end}`;
    }
    const goParts = [
      `data-duty-go="${esc(d.id)}"`,
      d.anchor ? `data-duty-anchor="${esc(d.anchor)}"` : '',
      (d.route && d.route !== '#/today') ? `data-duty-route="${esc(d.route)}"` : ''
    ].filter(Boolean).join(' ');
    return `<div class="dd-item dd-${st}">` +
      `<span class="dd-state">${st}</span>` +
      `<span class="dd-lbl">${esc(d.label)}</span>` +
      (timeHint ? `<span class="dd-time">${esc(timeHint)}</span>` : '') +
      `<span class="dd-actions">` +
        `<button class="btn sm ghost dd-btn" ${goParts}>→</button>` +
        `<button class="btn sm ghost dd-btn" data-duty-snooze="${esc(d.id)}" title="snooze 30 min">+30m</button>` +
        `<button class="btn sm ghost dd-btn" data-duty-skip="${esc(d.id)}" title="skip today">×</button>` +
      `</span>` +
      `</div>`;
  }).join('');

  return `<div class="dd-panel" id="ddPanel">` +
    `<details open>` +
      `<summary class="dd-summary"><span class="sc">Pending</span><span class="mono dd-count">${pending.length}</span></summary>` +
      `<div class="dd-body">${rows}</div>` +
    `</details>` +
    `</div>`;
}

/* ---------- boot: wrap rerender + minute tick ---------- */
(function _dutyUIBoot(){
  /* wrap global rerender so duty state refreshes after every route paint */
  if(typeof rerender === 'function'){
    const _origRerender = rerender;
    window.rerender = function(){
      _origRerender.apply(this, arguments);
      requestAnimationFrame(function(){ typeof dutyUpdateUI === 'function' && dutyUpdateUI(); });
    };
  }
  /* 60-second tick for state changes that happen between rerenders */
  setInterval(function(){ typeof dutyUpdateUI === 'function' && dutyUpdateUI(); }, 60000);
})();
