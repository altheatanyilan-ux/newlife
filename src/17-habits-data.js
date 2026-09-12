/* ============================================================
   HABITS — energy rituals, not willpower

   Two kinds, and they are not the same thing wearing different words.

   Building 🌱 is planting: a behaviour you are making automatic. Loehr and
   Schwartz are the ground here — a ritual is a precise behaviour at a precise
   time, fuelled by something you actually care about, and after thirty to
   sixty days it stops costing anything to do. The point is not discipline.
   Discipline is what you spend when the ritual has not formed yet.

   Breaking 🔓 is outgrowing. Maltz: habits are garments worn by the
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
  clean:['○','Clean day'], resisted:['🛡','Resisted'], slipped:['↯','Slipped'],
};
/* the quotes are not decoration: each one is the reason the field beside it
   exists, and seeing it at the moment of writing is the whole point */
const HAB_QUOTES = {
  identity:   ['Maltz', 'The self-image is the key to human personality and behavior. Change the self-image and you change the behavior.'],
  energy:     ['Loehr & Schwartz', 'We build emotional, mental and spiritual capacity in precisely the same way that we build physical capacity.'],
  replace:    ['Knight Dunlap, in Psycho-Cybernetics', 'The best way to break a habit is to form a clear mental image of the desired end result, and to practice without effort toward reaching that goal.'],
  ritual:     ['Loehr & Schwartz', 'Positive energy rituals are the key to full engagement and sustained high performance.'],
  oscillate:  ['Loehr & Schwartz', 'We must balance energy expenditure with intermittent renewal in all dimensions.'],
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
  h.kind       = h.kind === 'recovery' ? 'recovery' : 'expenditure';
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

/* ---------- the four dimensions, spent and renewed ----------
   Loehr's whole argument in one number per dimension: a dimension that is all
   expenditure and no recovery is being overtrained, and the system should say
   so rather than congratulate you on the streak. */
function habEnergyBalance(day = today()){
  const out = {};
  DIMS.forEach(x => out[x.id] = {exp:0, rec:0, expDone:0, recDone:0, name:x.name, c:x.c});
  habList().forEach(h => {
    const slot = out[h.dimension]; if(!slot) return;
    const k = h.kind === 'recovery' ? 'rec' : 'exp';
    if(!habDue(h, day)) return;
    slot[k]++; if(habKept(h, day)) slot[k + 'Done']++;
  });
  return out;
}
function habOvertrained(day = today()){
  return Object.entries(habEnergyBalance(day))
    .filter(([, v]) => v.exp >= 2 && v.rec === 0)
    .map(([id, v]) => v.name);
}

/* ---------- reading the list ---------- */
function habList({archived = false} = {}){
  return (S.habits || []).filter(h => !!h.archived === archived).map(habDefaults)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}
function habBuilding(){ return habList().filter(h => !habIsBreaking(h)); }
function habBreaking(){ return habList().filter(habIsBreaking); }
function habDueOn(d = today()){ return habList().filter(h => habDue(h, d)); }
