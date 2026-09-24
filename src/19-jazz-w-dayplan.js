/* ============================================================
   THE DAY'S PLAN — four to six things, not the whole stage.

   A stage has twenty to forty exercises and a day has two hours. Showing
   all of them is showing none: the student picks the ones they like. So
   the day is chosen here, by rules a teacher would use:

     rotation     nothing two days running; a core exercise comes round
                  every two or three days; the less comfortable it is, the
                  sooner it comes back.
     keys         three or four keys a session, round the cycle of fourths
                  (C F B♭ E♭ A♭ D♭ G♭ B E A D G), the ones not yet marked
                  first, so all twelve come round in three or four days.
     balance      one harmony or voicing exercise, one coordination or
                  rhythm exercise, one improvising — and, on the full
                  curriculum, one thing from the enrichment (a record to
                  hear, a worksheet, a page to read). A warm-up and a
                  cool-down tune either side.
     time         within the minutes you have: three or four exercises in
                  an hour, five or six in two, never more than seven.
     readiness    when every core exercise is in all twelve keys and
                  comfortable (4 of 5), it asks whether you are ready for
                  the next stage. It never moves you on by itself.
     two weeks    Siskind writes each unit for about fourteen days, so the
                  stage runs in fourteen-day cycles: on day ten, if the core
                  is not near done, it says to give the stage another cycle;
                  on day fourteen, it says what is yours and what is not.

   generateDailyPlan is pure — the same state and date give the same plan —
   so it can be tested with made-up students. The room stores the plan it
   made today, so a swap stays swapped and a re-render does not reshuffle.
   ============================================================ */

const JAZZ_CIRCLE = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'B', 'E', 'A', 'D', 'G'];
/* the five levels of comfort are the five levels a sitting was always rated
   on; only the words changed, so every old rating keeps its meaning */
const JAZZ_COMFORT = {rough: 1, shaky: 2, improving: 3, solid: 4, automatic: 5};
const JAZZ_COMFORT_SAID = ['', 'Can’t play it yet', 'Slow and hesitant', 'Moderate tempo, some mistakes',
  'Comfortable at practice tempo', 'Performance-ready'];
const JAZZ_PLAN_WARMUP = 5, JAZZ_PLAN_COOLDOWN = 7;

/* the latest rating on an exercise, as 1–5 */
function jazzComfortOf(id){
  const r = jazzRecord(id);
  const q = ((r.logs || []).find(l => l && l.quality) || {}).quality;
  return q ? JAZZ_COMFORT[q] || null : null;
}

/* ---------- the student, as the brief describes them ---------- */
function jazzStudentState(date){
  const d = date || today();
  const stage = jazzActiveStage();
  const sid = stage ? String(stage.id) : 'P0';
  const rec = jazzStageRecord(sid);
  /* the day's length: the one you chose, or the stage's pace — a longer
     day when behind, the option of a shorter one when ahead */
  const budget = JAZZ_BUDGETS.find(b => b.id === jazzSessionBudget()) || JAZZ_BUDGETS[2];
  const pace = typeof jazzPaceOf === 'function' && rec.startDate ? jazzPaceOf(sid) : null;
  const paceDay = Math.round(jazzPaceMinutes(rec.pace, sid)
    * (pace && pace.status === 'behind' ? 1.25 : pace && pace.status === 'ahead' ? 0.75 : 1));
  /* the last seven days: what was practised, and for how long */
  const since = addDays(d, -7);
  const days = {};
  const add = (day, id, mins) => { if(!day || day < since || day > d) return;
    const x = days[day] = days[day] || {date: day, exerciseIds: [], minutesPracticed: 0};
    if(id && !x.exerciseIds.includes(id)) x.exerciseIds.push(id);
    x.minutesPracticed += +mins || 0; };
  const sessions = jazzSessions().concat(jazzSessionOpen() ? [jazzSessionOpen()] : []);
  sessions.forEach(s => { (s.activities || []).forEach(a => add(s.day, a.exerciseId, a.minutes));
    if(!(s.activities || []).length) add(s.day, null, s.minutes); });
  const times = {};
  const progress = {};
  (stage ? stage.subs : []).forEach(id => {
    const r = jazzRecord(id);
    (r.logs || []).forEach(l => { add(l.day, id, l.fromSession ? 0 : l.minutes); });
    const practisedDays = new Set((r.logs || []).map(l => l.day));
    sessions.forEach(s => (s.activities || []).forEach(a => { if(a.exerciseId === id) practisedDays.add(s.day); }));
    times[id] = practisedDays.size;
    const lastSess = sessions.filter(s => (s.activities || []).some(a => a.exerciseId === id)).map(s => s.day).sort().pop();
    const last = [r.lastAt, lastSess].filter(Boolean).sort().pop() || null;
    progress[id] = {completedKeys: jazzExGot(id), totalKeys: jazzExUnits(id), lastPracticed: last,
      comfortLevel: jazzComfortOf(id), keys: JAZZ_KEY_NAMES.filter(k => r.keys[k]), timesPractised: times[id]};
  });
  const track = typeof jazzTodaysTrack === 'function' && stage ? jazzTodaysTrack(stage) : null;
  return {currentStageId: sid === 'P0' ? 0 : /^\d+$/.test(sid) ? +sid : sid,
    trackMode: jazzTrack(),
    exerciseProgress: progress,
    stageStartDate: rec.startDate || null,
    dailyMinutesTarget: jazzBudgetChosen() ? budget.minutes : paceDay,
    practiceHistory: Object.values(days).sort((a, b) => b.date.localeCompare(a.date)),
    listening: track ? {track, plays: jazzListens(track), target: JAZZ_LISTEN_TARGET} : null};
}

/* ---------- the pieces ---------- */
/* a small, stable wobble so equal scores do not always fall the same way */
function jzpHash(s){ let h = 2166136261; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
const jzpSlotOf = r => {
  const ex = jazzExercise(r.id);
  if(jazzIsCoordination(ex)) return 'coordination';
  if(jazzIsCreative(ex)) return 'creative';
  if(jazzIsPlayable(ex)) return 'harmonic';
  return 'enrichment';
};
const JAZZ_SLOT_PART = {harmonic: 'fundamentals', coordination: 'rote', creative: 'tunes', enrichment: 'listening'};
/* keys for one exercise today: round the circle from where its rotation has
   got to, the unmarked ones first */
function jazzPlanKeys(p, n){
  const got = (p && p.keys) || [];
  const offset = (((p && p.timesPractised) || 0) * n) % 12;
  const ring = JAZZ_CIRCLE.slice(offset).concat(JAZZ_CIRCLE.slice(0, offset));
  const open = ring.filter(k => !got.includes(k));
  const pickFrom = open.length >= n ? open : open.concat(ring.filter(k => got.includes(k)));
  return pickFrom.slice(0, n);
}
function jzpKeysSaid(keys, p){
  const names = keys.map(jazzPretty);
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
  const got = (p && p.keys) || [];
  const fresh = keys.filter(k => !got.includes(k)).length;
  const why = !got.length && ['C', 'F', 'Bb', 'Eb'].includes(keys[0]) ? 'beginner-friendly keys first'
    : fresh === keys.length ? `the ${keys.length === 3 ? 'three' : 'four'} you haven't marked yet`
    : fresh ? `${fresh} new, ${keys.length - fresh} to keep warm` : 'review — all twelve are marked';
  return `Keys of ${list} (${why})`;
}

/**
 * The day's plan, from the brief's studentState.
 * @param {object} state  see jazzStudentState
 * @param {{date?:string}} opts
 */
function generateDailyPlan(state, opts){
  const date = (opts && opts.date) || today();
  const sid = String(state.currentStageId) === '0' ? 'P0' : String(state.currentStageId);
  const stage = jazzStage(sid);
  if(!stage) return null;
  const fast = state.trackMode === 'fast-track';
  const target = Math.max(20, +state.dailyMinutesTarget || 120);
  const prog = state.exerciseProgress || {};
  const hist = state.practiceHistory || [];
  const yesterday = addDays(date, -1);
  const yIds = new Set((hist.find(h => h.date === yesterday) || {}).exerciseIds || []);
  const P = id => prog[id] || {completedKeys: 0, totalKeys: jazzExUnits(id), lastPracticed: null, comfortLevel: null, keys: [], timesPractised: 0};
  const since = id => { const l = P(id).lastPracticed; return l ? Math.max(0, daysBetweenDays(l, date)) : null; };
  const mastered = id => P(id).totalKeys && P(id).completedKeys >= P(id).totalKeys && (P(id).comfortLevel || 0) >= 4;
  const tierW = {'fast-track': 1.4, core: 1.2, enrichment: 0.8};

  /* the pool: the stage, on the chosen track */
  const all = stage.subs.map(jazzExerciseRecord).filter(Boolean);
  const pool = all.filter(r => fast ? r.tier === 'fast-track' : true);
  const due = r => {
    const ds = since(r.id);
    const c = P(r.id).comfortLevel || 2;
    const fresh = ds == null ? 3 : 0;
    const wait = ds == null ? 0 : Math.min(ds, 14);
    const rotation = ds != null && ds >= 2 ? 1.5 : 1;          /* a core exercise every two or three days */
    return ((wait + fresh + 1) * (6 - c) * (tierW[r.tier] || 1) * rotation * (mastered(r.id) ? 0.3 : 1))
      + jzpHash(r.id + date) * 0.5;
  };
  const ranked = pool.filter(r => !yIds.has(r.id)).sort((a, b) => due(b) - due(a));
  const rankedAll = pool.slice().sort((a, b) => due(b) - due(a));
  const chosen = [];
  const has = id => chosen.some(c => c.id === id);
  const first = (list, test) => list.find(r => test(r) && !has(r.id));

  /* ---- the slots ---- */
  const harm = first(ranked, r => jzpSlotOf(r) === 'harmonic') || first(rankedAll, r => jzpSlotOf(r) === 'harmonic');
  if(harm) chosen.push(Object.assign({slot: 'harmonic'}, harm));
  let coord = first(ranked, r => jzpSlotOf(r) === 'coordination');
  let coordFrom = null;
  if(!coord){
    /* none on this stage (or on this track): the nearest earlier stage's */
    const at = JAZZ_TIER_MAIN.indexOf(sid);
    for(let i = at - 1; i >= 0 && !coord; i--){
      const s = jazzStage(JAZZ_TIER_MAIN[i]); if(!s) continue;
      const c = s.subs.map(jazzExerciseRecord).filter(r => r && jzpSlotOf(r) === 'coordination' && !yIds.has(r.id))
        .sort((a, b) => (since(b.id) ?? 99) - (since(a.id) ?? 99))[0];
      if(c){ coord = c; coordFrom = s; }
    }
  }
  if(coord) chosen.push(Object.assign({slot: 'coordination', borrowedFrom: coordFrom ? coordFrom.id : null}, coord));
  else chosen.push({slot: 'coordination', synthetic: true, id: `rhythm-${sid}`, title: 'Swing eighths against the click',
    type: 'DRILL', tier: 'core', estimatedMinutes: 10, keysRequired: 0});
  const crea = first(ranked, r => jzpSlotOf(r) === 'creative') || first(rankedAll, r => jzpSlotOf(r) === 'creative');
  if(crea) chosen.push(Object.assign({slot: 'creative'}, crea));
  else chosen.push({slot: 'creative', synthetic: true, id: `improv-${sid}`, title: 'Free improvisation over today’s tune',
    type: 'CREATIVE', tier: 'core', estimatedMinutes: 10, keysRequired: 0});
  if(!fast){
    const lis = state.listening;
    if(lis && lis.track && lis.plays < lis.target)
      chosen.push({slot: 'enrichment', synthetic: true, listening: true, id: `listening-${sid}`,
        title: `Listening: ${lis.track.track} — ${lis.track.artist}`, type: 'LISTENING', tier: 'enrichment',
        estimatedMinutes: 8, keysRequired: 0, track: lis.track, plays: lis.plays, target: lis.target});
    else {
      const en = first(ranked, r => r.tier === 'enrichment' && ['LISTENING', 'WORKSHEET', 'THEORY'].includes(r.type));
      if(en) chosen.push(Object.assign({slot: 'enrichment'}, en));
    }
  }
  /* ---- how many, in the time there is ---- */
  const most = Math.min(7, target <= 45 ? 3 : target <= 60 ? 4 : target <= 90 ? 5 : target <= 150 ? 6 : 7);
  const least = target <= 60 ? 3 : target <= 90 ? 4 : 5;
  const room = target - JAZZ_PLAN_WARMUP - JAZZ_PLAN_COOLDOWN;
  const minsOf = r => r.estimatedMinutes || 10;
  while(chosen.length < most){
    const more = first(ranked, r => jzpSlotOf(r) === 'harmonic') || first(ranked, r => fast || r.tier !== 'enrichment');
    if(!more) break;
    if(sum(chosen.map(minsOf)) + minsOf(more) > room && chosen.length >= least) break;
    chosen.push(Object.assign({slot: jzpSlotOf(more)}, more));
  }
  /* too long for the time: the enrichment goes first, then the extra harmony */
  while(chosen.length > 3 && sum(chosen.map(minsOf)) > room){
    const at = chosen.map(c => c.slot).lastIndexOf('enrichment') >= 0 ? chosen.map(c => c.slot).lastIndexOf('enrichment')
      : chosen.length - 1;
    chosen.splice(at, 1);
  }
  /* the minutes: scaled to fill the time without passing it, in fives */
  const base = sum(chosen.map(minsOf));
  const cap = target >= 150 ? 40 : 30;
  const scale = base ? Math.min(2.5, Math.max(0.4, room / base)) : 1;
  let rows = chosen.map(c => Object.assign({}, c, {minutes: Math.max(5, Math.min(cap, Math.floor(minsOf(c) * scale / 5) * 5))}));
  while(sum(rows.map(r => r.minutes)) > room && rows.some(r => r.minutes > 5)){
    const big = rows.reduce((a, b) => b.minutes > a.minutes ? b : a); big.minutes -= 5; }
  /* what is left of the time goes, five minutes at a time, to the harmony
     first — so a three-hour day is three hours, not two and a bit */
  const order = rows.slice().sort((a, b) => (a.slot === 'harmonic' ? 0 : a.slot === 'creative' ? 1 : 2) - (b.slot === 'harmonic' ? 0 : b.slot === 'creative' ? 1 : 2));
  for(let guard = 0; guard < 80 && room - sum(rows.map(r => r.minutes)) >= 5; guard++){
    const r = order.find(x => x.minutes < cap && x.minutes <= Math.min(...order.filter(y => y.minutes < cap).map(y => y.minutes)));
    if(!r) break; r.minutes += 5; }

  /* ---- keys, focus and the reason ---- */
  const harmRow = rows.find(r => r.slot === 'harmonic');
  rows = rows.map(r => {
    const p = P(r.id);
    const n = r.minutes >= 18 ? 4 : 3;
    let keys = [];
    if(r.keysRequired) keys = r.slot === 'coordination' && harmRow && harmRow.keys ? harmRow.keys.slice() : jazzPlanKeys(p, n);
    r.keys = keys;
    if(r === harmRow) harmRow.keys = keys;
    const ds = since(r.id), left = (p.totalKeys || 12) - (p.completedKeys || 0), c = p.comfortLevel;
    let focus, reason;
    if(r.slot === 'coordination'){
      focus = keys.length ? `Same keys as today's ${harmRow ? harmRow.title : 'harmony'}: ${keys.map(jazzPretty).join(', ')}`
        : r.synthetic ? 'Five minutes: swing eighths on one note, the metronome on 2 and 4, then the same with the left hand on 1 and 3' : 'At a tempo you can keep';
      reason = r.synthetic ? `Stage ${sid === 'P0' ? 0 : sid} has no coordination exercise yet — a rhythm drill stands in`
        : r.borrowedFrom ? `No coordination exercise on this ${fast ? 'track' : 'stage'} — from Stage ${r.borrowedFrom}`
        : 'Coordination exercise paired with today’s harmonic work';
    } else if(r.slot === 'creative'){
      focus = r.synthetic ? '5 minutes free improvisation over the cool-down tune’s changes — record it' : '5 minutes free improvisation, then once more with one idea kept from the first';
      reason = 'Daily creative exercise — keeps improvisation muscles active';
    } else if(r.listening){
      focus = r.track.listenFor || 'Listen once for the form, once for the piano.';
      reason = `Ear training paired with current stage harmony (${r.plays} of ${r.target} listens)`;
    } else {
      focus = keys.length ? jzpKeysSaid(keys, p) : r.type === 'LISTENING' ? 'Listen through twice: once for the form, once for the piano'
        : r.type === 'WORKSHEET' ? 'Write it out, then play what you wrote' : 'Read it, then find it at the piano in one key';
      reason = ds == null ? 'Newly introduced — start with comfortable keys'
        : r.keysRequired && left > 0 && left <= 4 ? `${left} key${left === 1 ? '' : 's'} remaining — prioritizing completion`
        : c && c <= 2 ? `Low comfort (${c}/5) — here more often`
        : ds >= 3 ? `Not practised for ${ds} days`
        : r.slot === 'enrichment' ? 'Something beyond the core, for a full-curriculum day' : 'Due in the rotation';
    }
    return {exerciseId: r.id, title: r.title, type: r.type, tier: r.tier, estimatedMinutes: r.minutes,
      todayFocus: focus, reason, slot: r.slot, keys, synthetic: !!r.synthetic,
      borrowedFrom: r.borrowedFrom || null, listening: !!r.listening, track: r.track || null};
  });

  /* ---- either side ---- */
  const wk = (harmRow && harmRow.keys && harmRow.keys.length ? harmRow.keys : ['C', 'F', 'Bb']).map(jazzPretty);
  const dayInStage = state.stageStartDate ? Math.max(1, daysBetweenDays(state.stageStartDate, date) + 1) : 1;
  const tunes = typeof jazzTunesForStage === 'function' ? jazzTunesForStage(sid) : [];
  const rank = {beginner: 0, intermediate: 1, advanced: 2};
  const sorted = tunes.slice().sort((a, b) => ((a.role === 'primary' ? 0 : 1) - (b.role === 'primary' ? 0 : 1))
    || ((rank[(a.row.tune || {}).difficulty] ?? 1) - (rank[(b.row.tune || {}).difficulty] ?? 1)));
  const tune = sorted.length ? sorted[(dayInStage - 1) % Math.min(sorted.length, 5)] : null;
  const n = sid === 'P0' ? 0 : sid;
  const warmUp = {description: `${JAZZ_PLAN_WARMUP} minutes: Play major scales in today's practice keys (${wk.join(', ')}). Focus on even tone and relaxed hands.`,
    estimatedMinutes: JAZZ_PLAN_WARMUP};
  const coolDown = {description: tune
      ? `Play through one Real Book tune at sight-reading tempo. Today's suggestion: '${tune.row.title}' (Stage ${n} ${tune.role} tune, ${(tune.row.tune || {}).difficulty || 'unrated'} difficulty).`
      : 'Play through one tune you know at sight-reading tempo.',
    estimatedMinutes: JAZZ_PLAN_COOLDOWN, tuneId: tune ? tune.row.id : null};

  /* ---- ready, and the fourteen days ---- */
  const coreIds = all.filter(r => fast ? r.tier === 'fast-track' : jazzTierIsCore(r.tier)).map(r => r.id);
  const ready = coreIds.length > 0 && coreIds.every(mastered);
  const mainAt = JAZZ_TIER_MAIN.indexOf(sid);
  const next = mainAt >= 0 && mainAt < JAZZ_TIER_MAIN.length - 1 ? JAZZ_TIER_MAIN[mainAt + 1] : null;
  const completion = coreIds.length ? sum(coreIds.map(id => Math.min(1, (P(id).completedKeys || 0) / (P(id).totalKeys || 12)))) / coreIds.length : 0;
  const cycleDay = ((dayInStage - 1) % 14) + 1, cycleNo = Math.floor((dayInStage - 1) / 14) + 1;
  let cycle = {day: cycleDay, of: 14, number: cycleNo, dayInStage, completion: Math.round(completion * 100), note: null};
  if(cycleDay >= 10 && cycleDay < 14 && completion < 0.7)
    cycle.note = {kind: 'extend', said: `Day ${cycleDay} of this two-week cycle, and the core is ${cycle.completion}% there. Give the stage another cycle rather than moving on.`};
  if(cycleDay === 14)
    cycle.note = {kind: 'summary', said: `Two weeks in this cycle. Here is what is yours and what needs more work.`,
      mastered: coreIds.filter(mastered), needsWork: coreIds.filter(id => !mastered(id))};
  return {date, stageId: state.currentStageId, trackMode: fast ? 'fast-track' : 'full',
    totalEstimatedMinutes: sum(rows.map(r => r.estimatedMinutes)) + JAZZ_PLAN_WARMUP + JAZZ_PLAN_COOLDOWN,
    exercises: rows, warmUp, coolDown,
    readyForNext: ready && next ? {stageId: next, said: `Ready for Stage ${next}?`} : null,
    cycle};
}

/* ---------- today's plan, kept ---------- */
function jazzDayPlan(force){
  const j = jazzState();
  const st = jazzStudentState();
  const key = [today(), String(st.currentStageId), st.trackMode, st.dailyMinutesTarget].join('|');
  if(!force && j.dayPlan && j.dayPlan.key === key && j.dayPlan.plan) return j.dayPlan.plan;
  const plan = generateDailyPlan(st, {date: today()});
  j.dayPlan = {key, plan};
  saveNow();
  return plan;
}
/* another exercise of the same tier and the same kind, in place of this one */
function jazzSwapPlanRow(i){
  const j = jazzState();
  const plan = jazzDayPlan();
  const row = plan && plan.exercises[i];
  if(!row || row.synthetic) return false;
  const st = jazzStudentState();
  const stage = jazzStage(String(st.currentStageId) === '0' ? 'P0' : String(st.currentStageId));
  const inPlan = new Set(plan.exercises.map(r => r.exerciseId));
  const swaps = (j.dayPlan.swapped = j.dayPlan.swapped || []);
  const cand = stage.subs.map(jazzExerciseRecord).filter(r => r && !inPlan.has(r.id) && !swaps.includes(r.id)
    && r.tier === row.tier && jzpSlotOf(r) === row.slot && (st.trackMode !== 'fast-track' || r.tier === 'fast-track'));
  if(!cand.length) return false;
  const p = st.exerciseProgress;
  const lastOf = id => (p[id] && p[id].lastPracticed) || '0000';
  const pick = cand.sort((a, b) => lastOf(a.id).localeCompare(lastOf(b.id)))[0];
  swaps.push(row.exerciseId);
  const keys = pick.keysRequired ? jazzPlanKeys(p[pick.id], row.estimatedMinutes >= 18 ? 4 : 3) : [];
  plan.exercises[i] = Object.assign({}, row, {exerciseId: pick.id, title: pick.title, type: pick.type, keys,
    todayFocus: keys.length ? jzpKeysSaid(keys, p[pick.id]) : row.todayFocus, reason: 'Swapped in for today'});
  saveNow();
  return true;
}
/* where the plan's rows go when opened */
const jazzPlanRowHref = r => r.synthetic
  ? (r.listening ? '#/jazz/listen' : r.slot === 'creative' ? `#/jazz/playalong/${(jazzDayPlan().coolDown || {}).tuneId || ''}` : '#/jazz/playalong')
  : `#/jazz/${r.exerciseId}`;

/* ---------- Start Practice: the plan's rows, one after another ----------
   The session remembers the order, and every page on it carries a bar that
   says where you are and moves you on. */
function jazzStartPlanSequence(){
  const plan = jazzDayPlan();
  if(!plan) return;
  openJazzSpace(() => {
    const s = jazzStartSession(jazzActiveStage().id);
    s.sequence = plan.exercises.map(r => ({id: r.exerciseId, title: r.title, href: jazzPlanRowHref(r), synthetic: r.synthetic}));
    saveNow(); sound('success');
    navigate(s.sequence[0] ? s.sequence[0].href : '#/jazz/session');
  });
}
function jazzSequenceBarHTML(id){
  const s = typeof jazzSessionOpen === 'function' ? jazzSessionOpen() : null;
  const seq = s && s.sequence;
  if(!seq || !seq.length) return '';
  const at = seq.findIndex(x => x.id === id);
  if(at < 0) return '';
  const prev = seq[at - 1], next = seq[at + 1];
  return `<div class="jzd-seq">
    <span class="mono">Today’s plan · ${at + 1} of ${seq.length}</span>
    <span class="grow"></span>
    ${prev ? `<button class="tbtn" data-jzseq="${esc(prev.href)}">← ${esc(prev.title)}</button>` : ''}
    <button class="tbtn" data-jzseqdo="${at}">+ did this</button>
    ${next ? `<button class="btn sm primary" data-jzseq="${esc(next.href)}">next: ${esc(next.title)} →</button>`
      : '<button class="btn sm primary" data-jzseq="#/jazz/session">finish — the session →</button>'}</div>`;
}
function bindJazzSequence(root){
  $$('[data-jzseq]', root).forEach(b => b.onclick = () => navigate(b.dataset.jzseq));
  $$('[data-jzseqdo]', root).forEach(b => b.onclick = () => {
    const stage = jazzActiveStage();
    const plan = stage && jazzTodaysPlan(stage.id);
    const block = plan && plan.required[+b.dataset.jzseqdo];
    if(block) openJazzActivity(block);
  });
}

/* ---------- the plan card (Section 3C) and the summary under it (3D) ---------- */
function jazzTierBadgeFor(tier){
  const t = jazzTierInfo(tier);
  return `<span class="jz-tier jz-tier-${t.id}" title="${esc(t.said)}">${t.badge}<b>${esc(t.label)}</b></span>`;
}
function jazzDayPlanHTML(plan){
  const dp = plan.dayPlan;
  const stage = plan.stage;
  const n = stage.id === 'P0' ? 0 : stage.id;
  const open = jazzSessionOpen();
  const cyc = dp.cycle;
  return `<div class="jz-plan jzd">
    <div class="jzd-head">
      <div><span class="sc">Day ${cyc.dayInStage} of Stage ${esc(String(n))}</span>
        <h2 class="serif jzd-title">${esc(stage.name)}</h2></div>
      <div class="jzd-total"><b class="serif">${dp.totalEstimatedMinutes}</b><span class="mono">minutes today</span></div></div>
    ${jazzTrackToggleHTML()}
    <div class="jz-budget">
      <span class="sc">Time today</span>
      <div class="jz-budget-picks"><button class="jz-budget-pick${jazzBudgetChosen() ? '' : ' on'}" data-jzbudget="pace">your pace</button>${JAZZ_BUDGETS.map(b =>
        `<button class="jz-budget-pick${jazzBudgetChosen() && b.id === plan.budget ? ' on' : ''}" data-jzbudget="${esc(b.id)}">${b.minutes >= 180 ? '3 hr +'
          : b.minutes >= 120 ? '2 hr' : b.minutes >= 60 ? '1 hr' : '30 min'}</button>`).join('')}</div>
      <p class="jz-budget-note">${dp.exercises.length} exercises, chosen for today — focus is worth more than volume.${
        jazzBudgetChosen() ? '' : ` The length is your ${esc(plan.paceName.toLowerCase())} pace for this stage.`}</p></div>
    ${dp.readyForNext ? `<div class="jzd-ready"><b class="serif">${esc(dp.readyForNext.said)}</b>
      <p>Every ${dp.trackMode === 'fast-track' ? 'essential' : 'core'} exercise of this stage is in all twelve keys and comfortable. Nothing moves until you say so.</p>
      <button class="btn sm primary" data-jzfinish="${esc(String(stage.id))}">Finish this stage</button></div>` : ''}
    ${cyc.note ? `<div class="jzd-cycle ${esc(cyc.note.kind)}"><span class="sc">Cycle ${cyc.number} · day ${cyc.day} of 14</span>
      <p>${esc(cyc.note.said)}</p>
      ${cyc.note.kind === 'summary' ? `<div class="jzd-sum"><div><span class="mono">yours</span>${(cyc.note.mastered.length ? cyc.note.mastered : ['—']).map(id =>
        `<a href="#/jazz/${esc(id)}">${esc((jazzExercise(id) || {}).name || id)}</a>`).join('')}</div>
        <div><span class="mono">needs more work</span>${(cyc.note.needsWork.length ? cyc.note.needsWork : ['—']).map(id =>
        `<a href="#/jazz/${esc(id)}">${esc((jazzExercise(id) || {}).name || id)}</a>`).join('')}</div></div>` : ''}</div>` : ''}
    <div class="jzd-side"><span class="sc">Warm-up · ${dp.warmUp.estimatedMinutes} min</span><p>${esc(dp.warmUp.description)}</p></div>
    <ol class="jzd-rows">${dp.exercises.map((r, i) => `<li class="jzd-row" data-slot="${esc(r.slot)}">
      <div class="jzd-rmain">
        <div class="jzd-rtop"><a class="jzd-rtitle" href="${esc(jazzPlanRowHref(r))}">${esc(r.title)}</a>
          <span class="jzd-type mono">${esc(r.type)}</span>${jazzTierBadgeFor(r.tier)}</div>
        <p class="jzd-focus">${esc(r.todayFocus)}</p>
        <p class="jzd-why mono">${esc(r.reason)}</p>
        ${r.listening ? `<div class="row" style="gap:6px;margin-top:4px"><button class="tbtn" data-jzlisten="1">+ listened once</button></div>` : ''}
      </div>
      <div class="jzd-rside"><span class="mono jzd-min">${r.estimatedMinutes} min</span>
        ${r.synthetic ? '' : `<button class="tbtn" data-jzswap="${i}" title="another exercise of the same tier and kind">⇄ swap</button>`}
        <button class="tbtn jz-tick" data-jzdo="${i}">+ did this</button></div></li>`).join('')}</ol>
    <div class="jzd-side"><span class="sc">Cool-down · ${dp.coolDown.estimatedMinutes} min</span><p>${esc(dp.coolDown.description)}</p>
      ${dp.coolDown.tuneId ? `<a class="tbtn" href="#/jazz/tune/${esc(dp.coolDown.tuneId)}">open the chart</a>` : ''}</div>
    <div class="row" style="gap:8px;margin-top:14px;flex-wrap:wrap">
      ${open ? `<button class="btn primary" id="jzSessOpen">⏱ The session is running — open it</button>`
        : `<button class="btn primary" id="jzPlanStart">▶ Start Practice</button>`}
      <button class="btn sm ghost" id="jzProgGo">\u{1f4ca} Where I am</button></div>
    ${jazzDayProgressHTML(stage, dp)}
  </div>`;
}
/* 3D: where the stage has got to */
function jazzDayProgressHTML(stage, dp){
  const core = jazzCoreProgress(stage.id), fast = jazzFastProgress(stage.id);
  const pc = (a, b) => b ? Math.round(a / b * 100) : 0;
  /* a key is yours on this stage when every core twelve-key exercise you
     have started has it */
  const started = core.ids.filter(id => !jazzIsSingle(id) && (jazzKeysGot(id) > 0 || (jazzRecord(id).logs || []).length));
  const keys = started.length ? JAZZ_CIRCLE.filter(k => started.every(id => jazzRecord(id).keys[k])) : [];
  const weeks = stage.outcome ? +((/(\d+)/.exec(stage.outcome.time) || [])[1] || 0) : 0;
  const fastOn = jazzTrack() === 'fast-track';
  const stageDays = weeks ? Math.round(weeks * 7 * (fastOn ? 0.5 : 1)) : 0;
  return `<div class="jzd-prog mono">
    <div><span>Stage Progress</span><b>${pc(core.done, core.of)}%</b><em>of core exercises mastered (${core.done}/${core.of} across all keys)</em></div>
    <div><span>Fast-Track Progress</span><b>${pc(fast.done, fast.of)}%</b><em>(${fast.done}/${fast.of} essential exercises mastered)</em></div>
    <div><span>Days in Stage</span><b>${dp.cycle.dayInStage}</b><em>of ~14 in this cycle${stageDays ? ` · the stage is ~${stageDays} days${fastOn ? ' on the fast track' : ''}` : ''}</em></div>
    <div><span>Keys Mastered This Stage</span><b>${keys.length}/12</b><em>${keys.length ? esc(keys.map(jazzPretty).join(', ')) : 'none yet'}</em></div></div>`;
}
