/* ============================================================
   HABITS — energy rituals, not willpower

   Two kinds, and they are not the same thing wearing different words.

   Building is planting: a behaviour you are making automatic. Loehr and
   Schwartz are the ground here — a ritual is a precise behaviour at a precise
   time, fuelled by something you actually care about, and after thirty to
   sixty days it stops costing anything to do. The point is not discipline.
   Discipline is what you spend when the ritual has not formed yet.

   Breaking is outgrowing. Maltz: habits are garments worn by the
   personality — you do not tear one off, you become someone it no longer fits.
   So a breaking habit is not tracked as an absence. It is tracked as a
   replacement, a map of what sets it off, and a record of the times the urge
   came and did not win. "Trying not to do something rapidly depletes our
   limited stores of will"; the field that matters most on a breaking habit is
   what you do instead.

   Everything here is written into S.habits and S.habitLog, the same two the
   rings on Today already read, so a habit kept in one place is kept in both.
   ============================================================ */

const HAB_CATS = ['health','mind','craft','relationships','finance','spiritual','creative','career'];
const HAB_MILESTONES = [
  {days:7,   label:'First week'},
  {days:21,  label:'Maltz threshold'},
  {days:30,  label:'One month'},
  {days:60,  label:'Loehr acquisition'},
  {days:90,  label:'Quarter'},
  {days:365, label:'One year'},
];
const HAB_TRIGGER_KINDS = ['emotional','situational','social','temporal','environmental'];
const HAB_SESSION_STATUS = {
  completed:['✓','Completed'], partial:['◐','Partial'], skipped:['·','Skipped'],
  clean:['○','Clean day'], resisted:['◇','Resisted'], slipped:['↯','Slipped'],
};

/* ---------- the marks ----------
   They were emoji — a cartoon flame for a streak, a seedling, a padlock, a
   shield — and a practice you are asking yourself to take seriously deserves
   better than clip art. Fine ink lines instead, drawn to the weight of the
   rest of the house and inked in the habit's own colour:

     ember    a run kept: a slender flame, the inner stroke its heat
     enso     days clean: the circle drawn in one breath, open where the
              brush lifted — nothing added, which is the point
     sprout   building: a stem and two leaves
     loosed   breaking: a chain parted in the middle
     guard    an urge resisted: a fine shield
*/
const HAB_MARK_PATHS = {
  ember: '<path d="M12 21.3c-3.9 0-6.4-2.6-6.4-6.1 0-3.6 2.7-5.5 3.8-8.9.9 1.5 1.1 3 .9 4.3 1.9-1.4 3-4.3 2.6-7.7 3.4 2.3 5.5 6.5 5.5 11 0 4.4-2.6 7.4-6.4 7.4z"/><path d="M12 21.3c-1.6 0-2.7-1.1-2.7-2.7 0-1.9 1.6-2.8 2.1-4.5 1.6 1.2 3.3 2.7 3.3 4.6 0 1.5-1.1 2.6-2.7 2.6z"/>',
  enso: '<path d="M18.9 7.6A8.4 8.4 0 1 0 20.3 13.4"/><path d="M18.9 7.6c.5.8.8 1.5 1 2.3" opacity=".5"/>',
  sprout: '<path d="M12 21v-8.6"/><path d="M12 12.4c0-3.6 2.4-6.1 6.4-6.1 0 3.7-2.5 6.1-6.4 6.1z"/><path d="M12 15c0-2.8-1.9-4.8-5-4.8 0 2.9 1.9 4.8 5 4.8z"/>',
  loosed: '<path d="M10 14.6l-2.3 2.3a3.4 3.4 0 0 1-4.8-4.8l3-3a3.4 3.4 0 0 1 4.6-.2"/><path d="M14 9.4l2.3-2.3a3.4 3.4 0 0 1 4.8 4.8l-3 3a3.4 3.4 0 0 1-4.6.2"/><path d="M8.6 3.4v2.1M3.4 8.6h2.1M15.4 20.6v-2.1M20.6 15.4h-2.1" opacity=".6"/>',
  guard: '<path d="M12 3.2l7 2.6v5.4c0 4.6-3 8.1-7 9.6-4-1.5-7-5-7-9.6V5.8z"/>',
};
function habMark(kind, label){
  return `<svg class="hb-mark hb-mark-${kind}" viewBox="0 0 24 24"${label
    ? ` role="img" aria-label="${esc(label)}"` : ' aria-hidden="true"'}>${HAB_MARK_PATHS[kind] || ''}</svg>`;
}
/* the mark a habit shows when it has no icon of its own, and its run */
const habKindMark = (br, label) => habMark(br ? 'loosed' : 'sprout', label === undefined ? (br ? 'breaking' : 'building') : label);
const habRunMark = br => habMark(br ? 'enso' : 'ember', br ? 'days clean' : 'days kept');
/* A habit's own icon when it was given one. The emoji the house used to hand
   out as the default (the starter habits still carry them) count as none, so
   they get the mark instead; an icon somebody chose is left alone. */
const HAB_OLD_DEFAULT_ICONS = ['🔓', '🌱', '🛡', '🔥', '🛡️'];
const habFaceHTML = (h, br) => h.icon && !HAB_OLD_DEFAULT_ICONS.includes(h.icon) ? esc(h.icon) : habKindMark(br);
/* the quotes are not decoration: each one is the reason the field beside it
   exists, and seeing it at the moment of writing is the whole point */
const HAB_QUOTES = {
  identity:   ['Maltz', 'The self-image is the key to human personality and behavior. Change the self-image and you change the behavior.'],
  energy:     ['Loehr & Schwartz', 'We build emotional, mental and spiritual capacity in precisely the same way that we build physical capacity.'],
  replace:    ['Knight Dunlap, in Psycho-Cybernetics', 'The best way to break a habit is to form a clear mental image of the desired end result, and to practice without effort toward reaching that goal.'],
  ritual:     ['Loehr & Schwartz', 'Positive energy rituals are the key to full engagement and sustained high performance.'],
  slip:       ['Maltz, adapted', 'Negative feedback is not failure — it is information. The servo-mechanism corrects course.'],
  m21:        ['Maltz', 'It usually requires a minimum of about 21 days to effect any perceptible change in a mental image.'],
  m60:        ['Loehr & Schwartz', 'The thirty-to-sixty-day acquisition period requires precision and specificity.'],
  plateau:    ['Leonard', 'You must love the plateau.'],
};

const habIsBreaking = h => !!h.negative;
const habType = h => habIsBreaking(h) ? 'breaking' : 'building';

/* Every field the two kinds share, plus the ones only one of them uses. Filled
   in on read rather than on write, so a habit written by an older version of
   the app is simply complete the next time it is looked at. */
function habDefaults(h){
  if(!h) return h;
  h.category   = HAB_CATS.includes(h.category) ? h.category : 'health';
  h.identity   = h.identity   || '';   /* "I am someone who…" */
  h.why        = h.why        || '';
  h.vision     = h.vision     || '';
  h.inaction   = h.inaction   || '';   /* what is lost by not doing it */
  h.rehearsal  = h.rehearsal  || '';   /* seeing yourself do it, in detail */
  h.cue        = h.cue        || '';
  h.environment= h.environment|| '';
  h.specificTime = h.specificTime || '';
  h.durationTarget = +h.durationTarget || 0;
  h.reward     = h.reward     || '';
  h.accountability = ['self','partner','public'].includes(h.accountability) ? h.accountability : 'self';
  h.difficulty = clamp(+h.difficulty || 3, 1, 5);
  /* Habits used to carry a second axis — expenditure (stress, and therefore
     growth) against recovery (renewal) — and the page reasoned from it. It is
     gone, and so is the stored value: a habit written by an older version is
     cleaned the next time it is looked at rather than carrying a field nothing
     reads. */
  delete h.kind;
  h.milestones = Array.isArray(h.milestones) && h.milestones.length
    ? h.milestones : HAB_MILESTONES.map(m => ({...m, reached:false, reachedAt:null}));
  h.milestones.forEach((m, i) => { const d = HAB_MILESTONES[i];
    if(d){ m.days = d.days; m.label = d.label; } m.reached = !!m.reached; m.reachedAt = m.reachedAt || null; });

  if(habIsBreaking(h)){
    h.replacement   = h.replacement   || h.instead || '';
    h.replacementHabitId = h.replacementHabitId || null;
    h.harm          = h.harm          || h.cost || '';
    h.reframe       = h.reframe       || '';   /* "I am no longer someone who…" */
    h.protocol      = h.protocol      || '';   /* what to do the moment it hits */
    h.triggers      = Array.isArray(h.triggers) ? h.triggers : [];
    /* the older single trigger line becomes the first mapped trigger */
    if(!h.triggers.length && h.trigger) h.triggers.push({id:uid(), type:'situational',
      description:h.trigger, intensity:3, strategy:h.instead || ''});
    h.triggers.forEach(t => { t.id = t.id || uid(); t.type = HAB_TRIGGER_KINDS.includes(t.type) ? t.type : 'situational';
      t.description = t.description || ''; t.intensity = clamp(+t.intensity || 3, 1, 5); t.strategy = t.strategy || ''; });
    h.urgeLog = Array.isArray(h.urgeLog) ? h.urgeLog : [];
  } else {
    h.min   = h.min   || '';   /* the two-minute version */
    h.ideal = h.ideal || '';
    h.preRitual  = h.preRitual  || '';
    h.postRitual = h.postRitual || '';
    h.progression = Array.isArray(h.progression) ? h.progression : [];
    h.progression.forEach(p => { p.week = +p.week || 1; p.target = p.target || ''; });
    h.personalBest = h.personalBest && typeof h.personalBest === 'object'
      ? h.personalBest : {value:null, unit:'minutes', date:null};
  }
  h.links = h.links && typeof h.links === 'object' ? h.links : {};
  ['values','skills','projects'].forEach(k => { h.links[k] = Array.isArray(h.links[k]) ? h.links[k] : []; });
  return h;
}
function migrateHabits(){
  (S.habits || []).forEach(habDefaults);
  S.habitLog = S.habitLog && typeof S.habitLog === 'object' ? S.habitLog : {};
}

/* ---------- the record ----------
   One log entry per habit per day, in the same S.habitLog the rings read, so
   ticking a ring and filling in a check-in write to the same place and can
   never disagree. The older shape was {level:'full'|'min'}; that still reads. */
function habEntry(h, d){ return S.habitLog?.[d]?.[h.id] || null; }
function habStatus(h, d){
  const e = habEntry(h, d);
  if(!e) return null;
  if(e.status) return e.status;
  return e.level === 'min' ? 'partial' : 'completed';
}
function habKept(h, d){
  const st = habStatus(h, d);
  if(habIsBreaking(h)) return st === 'clean' || st === 'resisted';
  return st === 'completed' || st === 'partial';
}
function habSetEntry(h, d, patch){
  S.habitLog[d] = S.habitLog[d] || {};
  const cur = S.habitLog[d][h.id] || {};
  S.habitLog[d][h.id] = Object.assign({}, cur, patch, {at: patch.at || cur.at || new Date().toISOString()});
  /* the rings read `level`, so keep it true to the status */
  const st = S.habitLog[d][h.id].status;
  if(st) S.habitLog[d][h.id].level = st === 'partial' ? 'min' : 'full';
  habCheckMilestones(h);
  saveNow();
}
function habClearEntry(h, d){ if(S.habitLog?.[d]) delete S.habitLog[d][h.id]; saveNow(); }

/* ---------- is it due ----------
   A breaking habit is due every day it exists: not slipping is a thing you do
   daily whether or not anyone scheduled it. */
function habDue(h, d){ return habIsBreaking(h) ? true : habitDue(h, d); }

/* ---------- streaks ----------
   For a building habit the streak counts days kept. For a breaking one it
   counts days since the last slip, which is the number that means something —
   a day nobody recorded is not a slip, only an unrecorded day. */
function habStreak(h, upto = today()){
  let cur = 0, best = 0, run = 0, total = 0;
  const start = h.createdAt ? h.createdAt.slice(0,10) : addDays(upto, -400);
  const days = [];
  for(let d = upto; d >= start && days.length < 400; d = addDays(d, -1)) days.push(d);
  const ordered = days.slice().reverse();
  ordered.forEach(d => {
    if(habIsBreaking(h)){
      if(habStatus(h, d) === 'slipped'){ best = Math.max(best, run); run = 0; }
      else { run++; if(habKept(h, d)) total++; }
    } else {
      if(!habDue(h, d)) return;                 /* a day off does not break a run */
      if(habKept(h, d)){ run++; total++; }
      else { best = Math.max(best, run); run = 0; }
    }
  });
  best = Math.max(best, run); cur = run;
  return {cur, best, total};
}
function habRate(h, days = 30, upto = today()){
  let due = 0, kept = 0;
  for(let i = 0; i < days; i++){ const d = addDays(upto, -i);
    if(!habDue(h, d)) continue; due++; if(habKept(h, d)) kept++; }
  return due ? Math.round(kept / due * 100) : null;
}
/* improving, stable or slipping: the last fortnight against the one before */
function habTrend(h){
  const a = habRate(h, 14), b = habRate(h, 14, addDays(today(), -14));
  if(a == null || b == null) return {dir:'stable', delta:0};
  const delta = a - b;
  return {dir: delta > 8 ? 'up' : delta < -8 ? 'down' : 'stable', delta};
}
/* completion carries most of it, consistency and direction the rest */
function habHealth(h){
  const r = habRate(h, 30); if(r == null) return null;
  const st = habStreak(h), t = habTrend(h);
  const consistency = st.best ? Math.min(100, st.cur / st.best * 100) : 0;
  const dir = t.dir === 'up' ? 100 : t.dir === 'stable' ? 60 : 20;
  return Math.round(r * .6 + consistency * .2 + dir * .2);
}
function habCheckMilestones(h){
  const st = habStreak(h);
  h.milestones.forEach(m => { if(!m.reached && st.cur >= m.days){ m.reached = true; m.reachedAt = new Date().toISOString(); } });
}
function habMilestonesReached(){
  const out = [];
  (S.habits || []).forEach(h => (h.milestones || []).forEach(m => {
    if(m.reached && m.reachedAt) out.push({habit:h, m});
  }));
  return out.sort((a, b) => a.m.reachedAt < b.m.reachedAt ? 1 : -1);
}

/* ---------- the four dimensions, and how each one is going ----------
   Habits used to carry a second axis: every one of them was either
   expenditure (stress, and therefore growth) or recovery (renewal), and the
   page argued with you about the balance between them. It asked a question at
   the point of creating a habit that almost nobody could answer honestly —
   a run is expenditure on Tuesday and recovery on Sunday, and the same is
   true of most of the good ones — and then drew conclusions from the answer.
   So the axis is gone and what is left is the honest half: which dimension a
   habit belongs to, and how much of what was due there today was kept. */
function habEnergyBalance(day = today()){
  const out = {};
  DIMS.forEach(x => out[x.id] = {due:0, done:0, name:x.name, c:x.c});
  habList().forEach(h => {
    const slot = out[h.dimension]; if(!slot) return;
    if(!habDue(h, day)) return;
    slot.due++; if(habKept(h, day)) slot.done++;
  });
  return out;
}

/* ---------- reading the list ---------- */
function habList({archived = false} = {}){
  return (S.habits || []).filter(h => !!h.archived === archived).map(habDefaults)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}
function habBuilding(){ return habList().filter(h => !habIsBreaking(h)); }
function habBreaking(){ return habList().filter(habIsBreaking); }
function habDueOn(d = today()){ return habList().filter(h => habDue(h, d)); }

/* ============================================================
   ACCOUNTABILITY — the days you did not keep it

   A habit page that only records what you did is half a record. The days a
   habit was due and nothing happened are the ones with something to say, and
   they were silently blank: no tick, no note, nothing to come back to. A
   streak that broke on a Tuesday told you it broke and never what happened.

   So every habit is accountable on its own rhythm, and "accounted for" means
   there is an entry — kept, partial, skipped, whatever — with a reason or a
   line of writing attached to it. Nothing is compulsory and nothing nags; the
   page simply shows what is still unaccounted for and offers the quickest
   possible way to say it.

   The rhythm matters, and getting it wrong would make the whole thing a
   scold. A daily habit is answerable for a day. A "three times a week" habit
   is NOT answerable for the four days it was not done — that is the design —
   it is answerable for the week, once the week has closed and it came up
   short. habitDue() returns true every day for those, which is right for
   drawing a ring and wrong for asking a question, so the rhythm is read off
   the frequency here instead.
   ============================================================ */

/* 'day' — answerable each day it is due. 'week' / 'month' — answerable for
   the period, once the period is over. */
function habRhythm(h){
  const t = (h.freq || {}).type;
  return t === 'perWeek' ? 'week' : t === 'perMonth' ? 'month' : 'day';
}
function habPeriodTarget(h){
  return habRhythm(h) === 'day' ? null : Math.max(1, +(h.freq || {}).count || 1);
}
/* the first day of the period a given day belongs to; that day is the key */
function habPeriodStart(h, d){
  const r = habRhythm(h);
  if(r === 'week') return weekStart(d);
  if(r === 'month') return d.slice(0, 8) + '01';
  return d;
}
function habPeriodEnd(h, start){
  if(habRhythm(h) === 'week') return addDays(start, 6);
  if(habRhythm(h) === 'month'){
    const x = parseDay(start); x.setMonth(x.getMonth() + 1);
    return addDays(isoDay(x), -1);
  }
  return start;
}
function habPeriodDays(h, start){
  const end = habPeriodEnd(h, start), out = [];
  for(let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}
function habPeriodKept(h, start){
  return habPeriodDays(h, start).filter(d => habKept(h, d)).length;
}
function habPeriodLabel(h, start){
  const r = habRhythm(h);
  if(r === 'month') return fmtDate(start, 'med').replace(/^\d+\s/, '');
  return `the week of ${fmtDate(start, 'short')}`;
}

/* ---------- what has been said about a period ----------
   A day's account lives on the day's entry, where the rest of that day lives.
   A period has no entry of its own, so it gets one here, keyed by the habit
   and the first day of the period. */
function habAccounts(){ return S.habitAccounts = S.habitAccounts || {}; }
function habAccountOf(h, start){ return habAccounts()[`${h.id}|${start}`] || null; }
function habSetAccount(h, start, patch){
  habAccounts()[`${h.id}|${start}`] = Object.assign({habitId:h.id, period:start},
    habAccountOf(h, start) || {}, patch, {at: new Date().toISOString()});
  saveNow();
}
function habClearAccount(h, start){ delete habAccounts()[`${h.id}|${start}`]; saveNow(); }

/* ---------- the reasons, for the days it did not happen ----------
   Offered as chips because a reason you can press is a reason you will
   actually record, and because a set of six makes the record countable later
   in a way free text never is. "Chose something else" is in the list on
   purpose: it is the commonest honest answer and the one a list of excuses
   would leave out. */
const HAB_MISS_REASONS = [
  ['time',    '⏱',  'Ran out of time'],
  ['tired',   '◑',  'Too tired'],
  ['forgot',  '…',  'Forgot'],
  ['chose',   '⇄',  'Chose something else'],
  ['away',    '✈',  'Not where I could'],
  ['unwell',  '⚕',  'Unwell'],
];
const habMissReason = k => (HAB_MISS_REASONS.find(r => r[0] === k) || [,, ''])[2];

/* ---------- what is still unanswered ----------
   Daily habits, for one day: due, and nothing written. A habit that was
   ticked is already accounted for — the tick is the account.

   Breaking habits are deliberately not here. Their resting state is the good
   one: a day nobody recorded is a day nothing happened, and "what got in the
   way of not doing it" is not a question. They are asked about when there is
   an urge to record, which is their own three-way check-in. */
function habUnaccountedOn(d = today()){
  return habList().filter(h => !habIsBreaking(h) && habRhythm(h) === 'day'
    && habDue(h, d) && !habEntry(h, d));
}
/* Weekly and monthly habits, for the periods that have closed. Only the ones
   that came up short, and only the ones nothing has been said about — a
   period that hit its target was kept and needs no account.

   At most ONE per habit, the most recent that qualifies. A habit nobody has
   touched in a month would otherwise put four rows in the block at once, and
   four rows of the same unanswered question is not accountability, it is a
   wall of guilt — which gets the block closed and never opened again. The
   look-back exists so that skipping one week does not lose the week before
   it, not so that the block can accumulate. */
function habPeriodsToAccount(upto = today(), back = 4){
  const out = [];
  habList().forEach(h => {
    const r = habRhythm(h); if(r === 'day' || habIsBreaking(h)) return;
    const target = habPeriodTarget(h);
    const born = (h.createdAt || '').slice(0, 10);
    let start = habPeriodStart(h, upto);
    for(let i = 0; i < back; i++){
      start = habPeriodStart(h, addDays(start, -1));
      /* a period that closed before the habit existed is not its business */
      if(born && habPeriodEnd(h, start) < born) break;
      if(habPeriodKept(h, start) >= target) continue;
      if(habAccountOf(h, start)) continue;
      out.push({h, start, kept: habPeriodKept(h, start), target,
        label: habPeriodLabel(h, start)});
      break;
    }
  });
  return out.sort((a, b) => a.start < b.start ? 1 : -1);
}
