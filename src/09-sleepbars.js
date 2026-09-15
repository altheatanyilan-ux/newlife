/* ============================================================
   THE WEEK AS BARS

   The sleep and wake chart was two dots a day joined by a line, and the line
   was the trouble. Its length was the night, but a line drawn between "went
   to bed" and "got up" reads, to anybody who has not been told otherwise, as
   the part of the day you were in — so the chart said the opposite of what it
   meant. And a bedtime in the small hours crossed midnight, which left the
   awake figure looking like arithmetic you had to take on trust.

   So: one bar a day, midnight to midnight, dark where you were asleep. The
   waking day is the gap between the two dark ends, which needs no line and no
   legend, and the hours in it are printed at the end of the row.

   WHERE A NIGHT GOES. A night of sleep belongs to two calendar days, and
   which two depends on the clock:

     went to bed 23:30 on Monday   →  Monday  dark 23:30–24:00
                                      Tuesday dark 00:00–(Tuesday's wake)
     went to bed 01:30 on Monday   →  Monday  dark 01:30–(Monday's wake)
       (which the house files under Monday, because Monday is the day you
        were still living at half past one)

   The test for which of those it is, is the boundary hour — the same four in
   the morning the rest of the house uses to decide which day you are in. It
   is not a second rule invented for this chart; if somebody moves their day
   boundary to six, this moves with it.

   WHAT THE BARS ARE FILLED WITH. The waking gap is not empty. The house has
   kept time blocks on the day strip for a long time — a start, an end and a
   label — and they belong here too, so the day reads as sleep, the things
   that happen every day whether you like them or not, and what is left. That
   last figure is the one worth having, and it is the one nobody could see.

   This does not invent a second store for them. The specification asks for a
   new array under a new key; the blocks already exist, on the day they belong
   to, with the shape it describes. What is new is a category on them, so a
   commute can be told from a meal at a glance.
   ============================================================ */

/* The recurring things a day is made of. Emoji so a block is legible at a
   glance without reading, colour so a week of them is legible without looking
   at any one. A block with no category keeps the neutral fill it always had. */
const TIME_CATS = [
  {id:'commute',  icon:'🚌', name:'Commute',  c:'#6b7f8e'},
  {id:'meal',     icon:'🍽', name:'Meal',     c:'#8a7560'},
  {id:'grooming', icon:'🚿', name:'Shower',   c:'#7a9aaa'},
  {id:'exercise', icon:'💪', name:'Exercise', c:'#7f916a'},
  {id:'chores',   icon:'🏠', name:'Chores',   c:'#a09080'},
];
const timeCatOf = id => TIME_CATS.find(c => c.id === id) || null;
/* anything somebody made up, kept beside the five so it can be chosen again */
function timeCatsAll(){
  const extra = (S.settings && S.settings.timeCats) || [];
  return TIME_CATS.concat(extra.filter(c => c && c.id && !timeCatOf(c.id)));
}
const timeCatAny = id => timeCatsAll().find(c => c.id === id) || null;

/* ---------- where a night falls on a calendar day ----------
   Returns the stretches of THIS date you were asleep for, in minutes from
   midnight. Everything the chart claims about a day comes through here. */
function daySleepSpans(d){
  const B = (typeof dayBoundaryHour === 'function' ? dayBoundaryHour() : 4) * 60;
  const wake = hm2min(rhythmDay(d).wakeTime);
  const spans = [];
  /* last night, ending this morning. Where it started on today's clock is the
     whole question: a bedtime before the boundary happened after midnight, so
     it began today; anything later was yesterday evening and you were already
     asleep when the day turned over. */
  const lastNight = rhythmSleep(addDays(d, -1));
  const last = hm2min(lastNight.hm);
  if(wake != null){
    const used = (last != null && last < B);
    const from = used ? last : 0;
    /* A bedtime nobody typed is the last time the house saw you that evening.
       It is a reasonable reading and it is still a guess, so the bar says so
       rather than drawing it as solidly as a time you actually gave. */
    if(wake > from) spans.push({a: from, b: wake, end: 'morning', guess: used && !!lastNight.inferred});
  }
  /* tonight, if you turned in before midnight. If you did not, it lands on
     tomorrow's bar as the clause above, and must not be drawn twice. */
  const told = rhythmSleep(d);
  const tonight = hm2min(told.hm);
  if(tonight != null && tonight >= B) spans.push({a: tonight, b: 1440, end: 'evening', guess: !!told.inferred});
  return spans;
}
function dayAwakeMinutes(d){
  return Math.max(0, 1440 - daySleepSpans(d).reduce((n, s) => n + (s.b - s.a), 0));
}
/* The blocks of a day, clipped to the part of it you were awake for. Named
   barBlocksOn and not dayBlocks because dayBlocks was taken — the rhythm page
   has one — and that file sorts later, so its declaration wins and this one
   silently never runs. Second time in a day; build.js now refuses to build
   when two files declare the same name, so it cannot be a third.

   Clipped, because a block
   that overlaps sleep is a block logged wrong, and drawing it over the night
   would quietly make the free figure too small */
function barBlocksOn(d){
  const sleep = daySleepSpans(d);
  const asleep = m => sleep.some(s => m >= s.a && m < s.b);
  return ((rhythmDay(d).blocks) || []).map(b => {
    const a = hm2min(b.startTime); let z = rhythmBlockEnd(b);
    if(a == null) return null;
    z = Math.min(1440, z);
    return {id: b.id, a, b: z, kind: b.kind || '', tag: b.tag || '',
      cat: timeCatAny(b.kind), over: asleep(a)};
  }).filter(Boolean).filter(x => x.b > x.a);
}
function dayAccount(d){
  const sleep = daySleepSpans(d).reduce((n, s) => n + (s.b - s.a), 0);
  const blocks = barBlocksOn(d);
  const by = {};
  blocks.forEach(b => { const k = b.kind || 'other'; by[k] = (by[k] || 0) + (b.b - b.a); });
  const spent = Object.values(by).reduce((a, b) => a + b, 0);
  return {d, sleep, awake: 1440 - sleep, by, spent, free: Math.max(0, 1440 - sleep - spent)};
}

/* ---------- the chart ---------- */
function sleepBarsHTML(anchor = today()){
  const days = weekShapeDays(anchor);
  const T = today();
  const pc = m => (m / 1440 * 100).toFixed(3) + '%';
  const any = days.some(d => daySleepSpans(d).length || barBlocksOn(d).length);
  const axis = [0, 4, 8, 12, 16, 20, 24];
  const rows = days.map(d => {
    const sp = daySleepSpans(d), bl = barBlocksOn(d), acc = dayAccount(d);
    const told = rhythmSleep(d);
    return `<div class="wk-row${d === T ? ' is-today' : ''}" data-day="${esc(d)}">
      <span class="wk-day mono">${esc(fmtDate(d, 'short'))}</span>
      <div class="wk-bar" role="img"
        aria-label="${esc(fmtDate(d, 'med'))}: awake ${fmtDur(acc.awake)}">
        ${sp.map(s => `<i class="wk-sleep wk-${s.end}${s.guess ? ' is-guess' : ''}" style="left:${pc(s.a)};width:${pc(s.b - s.a)}"
            title="asleep ${min2hm(s.a)}–${s.b >= 1440 ? '24:00' : min2hm(s.b)}${s.guess ? ' · assumed from the last time you were here' : ''}"></i>`).join('')}
        ${bl.map(b => { const w = b.b - b.a; const wide = (w / 1440) * 100 > 2.6;
          const c = b.cat;
          return `<i class="wk-act${b.over ? ' is-over' : ''}" data-blk="${esc(b.id)}"
            style="left:${pc(b.a)};width:${pc(w)}${c ? `;--c:${c.c}` : ''}"
            title="${esc((c ? c.name : (b.tag || 'logged')) )} · ${esc(b.startTime || min2hm(b.a))}–${esc(min2hm(b.b))} · ${fmtDur(w)}${b.over ? ' · logged over sleep' : ''}"
            >${wide && c ? `<span class="wk-ic">${c.icon}</span>` : ''}</i>`; }).join('')}
      </div>
      <span class="wk-awake mono">${told.hm || rhythmDay(d).wakeTime ? fmtDur(acc.awake) + ' awake' : '—'}</span>
    </div>`;
  }).join('');
  const week = days.map(dayAccount);
  const wsum = k => week.reduce((n, a) => n + (k === 'sleep' ? a.sleep : k === 'free' ? a.free : (a.by[k] || 0)), 0);
  const kinds = [...new Set(week.flatMap(a => Object.keys(a.by)))];
  return `<section class="section rv wk-bars">
    <div class="row between" style="align-items:baseline">
      <h2 class="sc" style="margin:0">Sleep, and the shape of the waking day</h2>
      <span class="mono faint" style="font-size:.7rem">midnight to midnight</span>
    </div>
    <p class="muted" style="font-size:.86rem;margin:6px 0 2px">Dark is asleep. The gap between
      the two dark ends is the day you had; what is coloured inside it is what you logged,
      and what is left is what was yours.
      <span class="wk-legend">A hatched end is assumed from the last time you were here that
      day, rather than a time you gave.</span></p>
    ${!any ? `<div class="empty" style="margin-top:12px">Nothing logged this week yet.
        The two ends of each day are set on Today — “I woke up at” and “I went to sleep at”.</div>`
    : `<div class="wk-axis mono" aria-hidden="true">
        ${axis.map(h => `<span style="left:${pc(h * 60)}">${h}:00</span>`).join('')}
      </div>
      <div class="wk-rows">${rows}</div>
      <!-- One line, seven prepared sentences. The specification asks for a
           summary under every day; seven of them under a seven-row chart is
           more reading than the chart, and the chart is the point. The line
           belongs to whichever row you are on, and rests on today. -->
      <div class="wk-readout mono" id="wkAccount">
        ${days.map(d => { const a = dayAccount(d);
          return `<span class="wk-acct${d === T ? ' rest' : ''}" data-acct="${esc(d)}"${d === T ? '' : ' hidden'}>
            <b>${esc(fmtDate(d, 'med'))}</b>
            <span>slept ${fmtDur(a.sleep)}${daySleepSpans(d).some(x => x.guess) ? ' <i class="wk-guessed">assumed</i>' : ''}</span><span>awake ${fmtDur(a.awake)}</span>
            ${Object.keys(a.by).map(k => { const c = timeCatAny(k);
              return `<span>${c ? c.icon + ' ' : ''}${esc(c ? c.name.toLowerCase() : 'other')} ${fmtDur(a.by[k])}</span>`; }).join('')}
            <span class="wk-free">free ${fmtDur(a.free)}</span></span>`; }).join('')}
      </div>
      ${quickBlockHTML(anchor)}
      <div class="wk-week mono">
        <b>This week</b>
        <span>sleep ${fmtDur(Math.round(wsum('sleep') / week.length))} a night</span>
        ${kinds.map(k => { const c = timeCatAny(k);
          return `<span>${c ? c.icon + ' ' + esc(c.name.toLowerCase()) : 'other'} ${fmtDur(wsum(k))}</span>`; }).join('')}
        <span>free ${fmtDur(Math.round(wsum('free') / week.length))} a day</span>
      </div>`}
  </section>`;
}

/* ---------- logging one, in one line ---------- */
function quickBlockHTML(anchor){
  const days = weekShapeDays(anchor);
  const cats = timeCatsAll();
  return `<form class="wk-add row" data-wkadd>
    <select class="inp sm" name="day" aria-label="which day">
      ${days.slice().reverse().map(d => `<option value="${esc(d)}"${d === today() ? ' selected' : ''}>${esc(fmtDate(d, 'short'))}</option>`).join('')}
    </select>
    <select class="inp sm" name="kind" aria-label="what it was">
      ${cats.map(c => `<option value="${esc(c.id)}">${c.icon} ${esc(c.name)}</option>`).join('')}
      <option value="__new">✏️ something else…</option>
    </select>
    <input class="inp sm mono" type="time" name="from" value="08:30" aria-label="from">
    <input class="inp sm mono" type="time" name="to" value="09:15" aria-label="to">
    <button class="btn sm primary" type="submit">add</button>
  </form>`;
}
function bindSleepBars(root){
  const scope = root || document;
  scope.querySelectorAll('[data-wkadd]').forEach(f => {
    if(f.dataset.hung === '1') return; f.dataset.hung = '1';
    f.addEventListener('submit', ev => {
      ev.preventDefault();
      const d = f.day.value, from = f.from.value, to = f.to.value;
      let kind = f.kind.value;
      if(!d || !from || !to) return;
      if(kind === '__new'){
        const name = (prompt('What is it called?') || '').trim();
        if(!name) return;
        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) || 'other';
        S.settings.timeCats = S.settings.timeCats || [];
        if(!timeCatAny(id)) S.settings.timeCats.push({id, name, icon:'✏️', c:'#9a8f84'});
        kind = id;
      }
      const r = rhythmDay(d);
      r.blocks = r.blocks || [];
      const c = timeCatAny(kind);
      r.blocks.push({id: uid(), startTime: from, endTime: to, category: 'intentional',
        kind, tag: c ? c.name : ''});
      r.blocks.sort((a, b) => hm2min(a.startTime) - hm2min(b.startTime));
      rhythmCompute(r); saveNow(); sound('click');
      if(typeof rerender === 'function') rerender();
    });
  });
}
