/* ============================================================
   ZONE-OF-GENIUS HOURS AND HAPPINESS MINUTES

   The course's closing instruction is about time: track how much time you
   actually spend within your zone of genius, starting with one hour, and set
   that as a priority. It is the single move that makes you already on your
   purpose rather than preparing for it.

   Alongside it, a diagnostic from the flow literature: classify the minutes
   of the day as frustrated, neutral or happy and tally them — most people
   find the happy tally tiny, and since the largest chunk of a life is the
   career, the happiness has to accumulate there. Done at the grain the house
   already has (the sitting), it is nearly free.

   Everything here is read from the clock record. Nothing is ticked, nothing
   is imputed, and a sitting that was not classified is unclassified — not
   neutral.
   ============================================================ */

/* ---------- which sittings are zone-of-genius work ---------- */
function zogTargetState(){
  const t = S.zogTarget = S.zogTarget && typeof S.zogTarget === 'object' ? S.zogTarget : {};
  if(!(t.minutes >= 0)) t.minutes = 60;
  if(t.setAt === undefined) t.setAt = '';
  return t;
}
/* by hand on the sitting wins; otherwise its category or the skill it is linked
   to; and the interface can say which */
function timeEntryZog(e){
  if(e.zogManual === true) return {zog: true, source: 'manual', said: 'yes — set by hand'};
  if(e.zogManual === false) return {zog: false, source: 'manual', said: 'no — set by hand'};
  const cat = e.categoryId && typeof timeCategory === 'function' ? timeCategory(e.categoryId) : null;
  if(cat && cat.zog) return {zog: true, source: 'category', said: `yes — its category, ${cat.name}, is zone-of-genius work`};
  if(e.linkedType === 'skill' && e.linkedId){ const sk = byId(S.skills, e.linkedId); if(sk && sk.zog) return {zog: true, source: 'skill', said: `yes — the skill, ${sk.name}, is zone-of-genius work`}; }
  return {zog: false, source: 'none', said: 'as its category says (not zone-of-genius)'};
}
const zogAnyDesignated = () => (typeof timeAllCategories === 'function' ? timeAllCategories() : []).some(c => c.zog) || (S.skills || []).some(s => s.zog);
function zogMinutesOn(d){
  return sum((typeof timeOnDay === 'function' ? timeOnDay(d) : []).filter(e => timeEntryZog(e).zog).map(e => timeMinutes(e)));
}
/* The streak is forgiving, like the twenty-one-day tracker and unlike the
   ninety-day imprint: a day you have not yet worked is a day still going,
   not a break, and a day can be set by hand either way. */
function zogDayMet(d){
  const o = (S.zogStreak && S.zogStreak.set) || {};
  if(o[d] === true) return true; if(o[d] === false) return false;
  return zogMinutesOn(d) >= zogTargetState().minutes && zogTargetState().minutes > 0;
}
function zogStreak(){
  const T = today(); let d = T, run = 0;
  if(!zogDayMet(d)) d = addDays(d, -1);
  while(zogDayMet(d)){ run++; d = addDays(d, -1); if(run > 4000) break; }
  let best = 0, cur = 0;
  for(let i = 365; i >= 0; i--){ if(zogDayMet(addDays(T, -i))){ cur++; best = Math.max(best, cur); } else cur = 0; }
  return {run, best};
}
/* one line under the intention; not drawn at all on a day with no recorded time */
function zogTodayHTML(){
  const T = today(), mins = Math.round(zogMinutesOn(T));
  if(!mins) return '';
  const target = zogTargetState().minutes, st = zogStreak();
  const pct = target ? Math.min(100, Math.round(mins / target * 100)) : 0;
  return `<div class="zog-line"><span class="mono">zone of genius today, ${mins} of ${target} minutes</span>
    <span class="zog-bar" aria-hidden="true"><i style="width:${pct}%"></i></span>
    ${st.run >= 2 && !(typeof journeyState === 'function' && journeyState() === 'searching') ? `<span class="mono faint">${st.run} days running — forgiving: a day not yet worked is a day still going</span>` : ''}</div>`;
}
if(typeof registerDuty === 'function') registerDuty({
  id: 'zog_hour', label: 'The zone-of-genius hour', anchor: '[data-duty-id="clock_sitting"]', route: '#/today/time',
  windowDef: {type: 'anytime'}, recurrence: {type: 'daily-conditional', check: () => zogAnyDesignated() && !(typeof journeyState === 'function' && journeyState() === 'searching')},
  skipDone: true, notify: false, defaultOn: true, doneCheck: T => zogDayMet(T),
});

/* ---------- the after-sitting reading: felt, and challenge against skill ---------- */
const FELT_WORDS = ['frustrated', 'neutral', 'happy'];
const CHALLENGE_WORDS = [['below', 'below your skill'], ['at', 'at your skill'], ['above', 'above your skill']];
/* the clock rows written by one focus sitting */
function zogSittingEntries(sessionId){
  const rec = (planState().focusSessions || []).find(r => r.id === sessionId);
  return rec ? (S.timeEntries || []).filter(e => e.focusSit === rec.startedAt && e.endTime) : [];
}
function closeoutExtraHTML(info){
  const es = zogSittingEntries(info.sessionId);
  const zog = es.some(e => timeEntryZog(e).zog);
  return `<div class="fz-f"><span class="k mono">how was that? (optional)</span>
      <span class="fz-yn">${FELT_WORDS.map(w => `<button type="button" class="chip tf-chip" data-pcfelt="${w}">${w}</button>`).join('')}</span></div>
    ${zog ? `<div class="fz-f"><span class="k mono">against your skill? (optional)</span>
      <span class="fz-yn">${CHALLENGE_WORDS.map(([k, n]) => `<button type="button" class="chip tf-chip" data-pcchal="${k}">${n}</button>`).join('')}</span></div>` : ''}`;
}
function closeoutExtraBind(box, info, st){
  box.querySelectorAll('[data-pcfelt]').forEach(b => b.onclick = () => { st.felt = st.felt === b.dataset.pcfelt ? null : b.dataset.pcfelt;
    box.querySelectorAll('[data-pcfelt]').forEach(x => x.classList.toggle('on', x.dataset.pcfelt === st.felt)); });
  box.querySelectorAll('[data-pcchal]').forEach(b => b.onclick = () => { st.challenge = st.challenge === b.dataset.pcchal ? null : b.dataset.pcchal;
    box.querySelectorAll('[data-pcchal]').forEach(x => x.classList.toggle('on', x.dataset.pcchal === st.challenge)); });
}
/* a skipped reading is not recorded as neutral: it is simply not there */
function closeoutExtraSave(info, st){
  if(!st.felt && !st.challenge) return;
  zogSittingEntries(info.sessionId).forEach(e => { if(st.felt) e.felt = st.felt; if(st.challenge && timeEntryZog(e).zog) e.challenge = st.challenge; });
}

/* ---------- the happiness panel ---------- */
function happinessRead(from, to){
  const es = (typeof timeBetween === 'function' ? timeBetween(from, to) : []).filter(e => e.endTime);
  const total = sum(es.map(e => timeMinutes(e)));
  const by = {frustrated: 0, neutral: 0, happy: 0}; let classified = 0, sittings = 0;
  const cell = {happyIn: 0, happyOut: 0, notIn: 0, notOut: 0};
  es.forEach(e => { if(!e.felt) return; const m = timeMinutes(e); by[e.felt] += m; classified += m; sittings++;
    const z = timeEntryZog(e).zog; if(e.felt === 'happy') cell[z ? 'happyIn' : 'happyOut'] += m; else cell[z ? 'notIn' : 'notOut'] += m; });
  return {total, by, classified, sittings, cell};
}
function happinessPanelHTML(from, to, label){
  const h = happinessRead(from, to);
  const need = 5;
  if(h.sittings < need){
    return h.total ? `<section class="section rv hp-panel"><span class="sc">Happy minutes</span>
      <p class="faint">This reading needs at least ${need} sittings you have said how they felt — ${h.sittings} so far ${label || 'in this stretch'}. Closing a sitting offers it in three taps, and skipping it leaves the sitting unclassified rather than neutral.</p></section>` : '';
  }
  const share = h.total ? Math.round(h.classified / h.total * 100) : 0;
  const c = h.cell, enough = Object.values(c).every(x => x >= 30);
  const missing = Object.entries({'happy inside the zone': c.happyIn, 'happy outside it': c.happyOut, 'not-happy inside it': c.notIn, 'not-happy outside it': c.notOut}).filter(([, v]) => v < 30).map(([k, v]) => `${k} (${Math.round(v)} min)`);
  return `<section class="section rv hp-panel"><span class="sc">Happy minutes</span>
    <p class="faint">The largest single chunk of a life is the career, so that is where happiness minutes have to accumulate.</p>
    <div class="hp-bars">${FELT_WORDS.map(w => `<div class="hp-row"><span>${w}</span><span class="hp-bar"><i class="${w}" style="width:${h.classified ? Math.round(h.by[w] / h.classified * 100) : 0}%"></i></span><span class="mono">${Math.round(h.by[w])} min</span></div>`).join('')}</div>
    <p class="mono faint">${Math.round(h.classified)} of ${Math.round(h.total)} tracked minutes are classified — ${share}% of the week this reading covers.</p>
    ${zogAnyDesignated() ? (enough
      ? `<p>Happy inside the zone: <b>${Math.round(c.happyIn)}</b> min · happy outside it: <b>${Math.round(c.happyOut)}</b> min · not happy inside: ${Math.round(c.notIn)} · not happy outside: ${Math.round(c.notOut)}.
         <span class="faint">If the named zone of genius is yours, the two should diverge; if they do not, that is worth knowing.</span></p>`
      : `<p class="faint">The comparison between inside and outside the zone draws when each of four cells has at least thirty minutes. Missing: ${missing.join(', ')}.</p>`) : ''}
  </section>`;
}
/* the month's distribution of challenge against skill, in words with the count */
function challengeMonthLine(){
  const es = (typeof timeBetween === 'function' ? timeBetween(addDays(today(), -29), today()) : []).filter(e => e.endTime && e.challenge && timeEntryZog(e).zog);
  if(es.length < 3) return '';
  const n = {below: 0, at: 0, above: 0}; es.forEach(e => n[e.challenge]++);
  const top = Object.entries(n).sort((a, b) => b[1] - a[1])[0];
  return `<p class="mono faint">zone-of-genius sittings this month: mostly ${top[0] === 'at' ? 'at your level' : top[0]} (${top[1]} of ${es.length}).</p>`;
}
function happinessWeekStep(from, to){
  const h = happinessRead(from, to); if(h.sittings < 5) return [];
  return [{title: 'Happy minutes.', hint: 'The week’s minutes split by how the sittings felt.', body: () => happinessPanelHTML(from, to, 'this week') + challengeMonthLine()}];
}
