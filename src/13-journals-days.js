/* ============================================================
   THE DAYS

   Today is a page you write on and then never see again. Everything it asks
   for — what you meant to give the day to, how it was going, where you were
   on the scale, what you kept, what you sat for — is filed by date and then
   only ever consulted in aggregate, as a line on a chart or a number in a
   dashboard. The charts are true and they are not the thing: a chart can say
   your set-point averaged eleven in August and cannot say that on the ninth
   you wrote one sentence you would want to read again.

   So the Review tab of the Lived Record gets the days themselves. It belongs
   there rather than anywhere else because that tab is already the two halves
   of looking back — the numbers, and the reviews written about the periods
   the numbers cover. The days are what both of those are ABOUT, and they were
   the one thing you could not get to.

   Two decisions worth stating.

   A day is listed only if something was actually put into it. The rhythm
   record is created by anything that so much as glances at a date — a chart
   walking back seven days leaves seven empty records behind it — so presence
   in the store proves nothing and every day is tested on its contents.

   And the words can be edited where the readings cannot. A sentence you wrote
   about a Tuesday is yours and a typo in it is worth fixing; the mood you
   chose and the numbers you gave are readings taken at a time, and a record
   you can quietly improve after the fact is not a record. The same reasoning
   the garden runs on.
   ============================================================ */

/* One global scope, one bundle. Every name in this file is checked against
   every other file before it is used: `dayRecord` was taken — the rhythm page
   has one, with a different shape — and because that file sorts later its
   declaration quietly won, so this archive spent an afternoon reading a
   record it had not built. Nothing warns you. The prefix is the warning. */
/* everything one day holds, gathered from wherever it actually lives */
function archiveDayOf(d){
  const c = (S.checkins || {})[d] || {};
  const r = (S.dailyRhythm || {})[d] || {};
  const tasks = typeof tasksForDay === 'function' ? tasksForDay(d) : [];
  const focus = typeof focusMinutesOn === 'function' ? (focusMinutesOn(d) || 0) : 0;
  const still = typeof stillMinutesOn === 'function' ? (stillMinutesOn(d) || 0) : 0;
  const habits = (S.habits || []).filter(h => typeof habitDue === 'function' && habitDue(h, d));
  const kept = habits.filter(h => typeof habitDone === 'function' && habitDone(h, d));
  const entries = (S.entries || []).filter(e => (e.createdAt || '').slice(0, 10) === d);
  const energy = c.energy && Object.keys(c.energy).some(k => c.energy[k]) ? c.energy : null;
  const rec = {d, c, r, tasks, focus, still, habits, kept, entries, energy,
    done: tasks.filter(t => t.done).length};
  /* A record is a day somebody put something into. Anything that reads a date
     leaves a rhythm record behind it, so the store having a key for a day is
     not evidence that the day happened. */
  rec.any = !!(c.intention || c.sentence || c.mood || c.setpoint || energy
    || r.wakeTime || r.sleepTime || (r.blocks || []).length
    || tasks.length || focus || still || kept.length || entries.length);
  return rec;
}
/* Days that had something PUT into them, gathered by walking what was
   written rather than by asking every date in the store whether it counts.

   Reading the keys is the obvious way and it is wrong twice over. It is
   wrong because anything that so much as glances at a date leaves a rhythm
   record behind it — the charts walk back a week every time they draw, so a
   fresh house already has seven days of nothing in it, and a month of those
   appears here as a month with days in it that turns out empty when opened.
   And it is wrong because deciding it per-day means calling tasksForDay once
   per candidate, which rebuilds every task reference in the house each time.

   One pass over each collection instead, keeping only what carries content. */
function archiveDays(){
  const set = new Set();
  const add = d => { if(typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) set.add(d); };
  Object.entries(S.checkins || {}).forEach(([d, c]) => {
    if(c && (c.intention || c.sentence || c.mood || c.setpoint
      || (c.energy && Object.values(c.energy).some(Boolean)))) add(d); });
  Object.entries(S.dailyRhythm || {}).forEach(([d, r]) => {
    if(r && (r.wakeTime || r.sleepTime || (r.blocks || []).length)) add(d); });
  Object.entries(S.habitLog || {}).forEach(([d, kept]) => {
    if(kept && Object.values(kept).some(Boolean)) add(d); });
  (S.tasks || []).forEach(t => { add(t.day); add(t.doDay); });
  (S.entries || []).forEach(e => add((e.createdAt || '').slice(0, 10)));
  try { (typeof focusSessions === 'function' ? focusSessions() : [])
    .forEach(f => add((f.startedAt || '').slice(0, 10))); } catch(e){}
  try { ((typeof stillness === 'function' ? stillness().sessions : []) || [])
    .forEach(x => add(x.date)); } catch(e){}
  /* Not tomorrow. A task scheduled for October puts October in this set, and
     a record of days that have not happened yet is a plan — which is a room
     the house already has. The archive stops at today. */
  const T = today();
  return [...set].filter(d => d <= T).sort().reverse();
}

/* ---------- the list ----------
   Months are shut and empty until they are opened. A year of days is three
   hundred rows of markup to build and lay out, and the overwhelming majority
   of them are months nobody is going to look at on this visit — so a month
   costs one line until somebody asks for it, and then it costs what it costs.
   That is the same bargain the rest of this house makes everywhere: the page
   is built for the person who opened it, not for every person who might. */
function dayArchiveHTML(){
  const days = archiveDays();
  const months = [];
  days.forEach(d => {
    const key = d.slice(0, 7);
    if(!months.length || months[months.length - 1].key !== key) months.push({key, days: []});
    months[months.length - 1].days.push(d);
  });
  const name = k => { const [y, m] = k.split('-'); return `${MONTHS[+m - 1]} ${y}`; };
  return `<section class="section rv day-archive" id="rvDays">
    <h2 class="sc">The days</h2>
    <p class="muted" style="font-size:.88rem;margin:0 0 4px">Every day you put something into,
      as you left it. The charts above say what the months came to; this is what the days said.</p>
    ${!days.length ? `<div class="empty" style="margin-top:12px">Nothing written down yet.
        Today is where days are written; they arrive here on their own.</div>`
      : months.map((mo, i) => `<details class="day-month"${i === 0 ? ' open' : ''} data-month="${mo.key}">
          <summary><span class="serif">${esc(name(mo.key))}</span>
            <span class="mono faint">${mo.days.length} day${mo.days.length === 1 ? '' : 's'}</span></summary>
          <div class="day-month-body" data-fill="${mo.key}">${i === 0 ? archiveMonthHTML(mo.days) : ''}</div>
        </details>`).join('')}
  </section>`;
}
function archiveMonthHTML(days){
  const rows = days.map(d => archiveDayOf(d)).filter(r => r.any);
  if(!rows.length) return `<div class="empty">Nothing was written down in this month.</div>`;
  return rows.map(archiveRowHTML).join('');
}
function archiveRowHTML(r){
  const mood = typeof moodOf === 'function' ? moodOf(r.c.mood) : null;
  const marks = [];
  if(r.tasks.length) marks.push(`${r.done}/${r.tasks.length} done`);
  if(r.focus) marks.push(`${fmtDur(r.focus)} focused`);
  if(r.still) marks.push(`${r.still}m still`);
  if(r.habits.length) marks.push(`${r.kept.length}/${r.habits.length} kept`);
  if(r.entries.length) marks.push(`${r.entries.length} written`);
  const sl = typeof rhythmSleep === 'function' ? rhythmSleep(r.d) : {hm: r.r.sleepTime, inferred: false};
  return `<details class="day-row" data-day="${esc(r.d)}">
    <summary>
      <span class="day-when serif">${esc(fmtDate(r.d, 'long'))}</span>
      <!-- always drawn, even empty: four cells in a four-column row, or the
           day with no mood on it silently shifts every other column along -->
      <span class="day-mood"${mood ? ` title="${esc(mood.label)}"` : ''}>${mood ? mood.icon : ''}</span>
      <span class="day-gist">${esc(r.c.intention || r.c.sentence || '')}</span>
      <span class="mono faint day-marks">${esc(marks.join(' · '))}</span>
    </summary>
    <div class="day-body stack" style="gap:14px">
      <div class="field"><label>The intention</label>
        ${ed('checkins.' + r.d + '.intention', {ph:'nothing was set', cls:'serif-lg'})}</div>
      <div class="field"><label>How it was going</label>
        ${ed('checkins.' + r.d + '.sentence', {multi: true, ph:'nothing was written', cls:'serif-lg'})}</div>
      <!-- read, not written: a reading taken on a Tuesday is not improvable on
           a Friday, and a record you can tidy up afterwards is not a record -->
      <div class="day-readings mono">
        ${mood ? `<span>mood <b>${mood.icon} ${esc(mood.label)}</b></span>` : ''}
        ${r.c.setpoint ? `<span>set-point <b>${r.c.setpoint}</b> ${esc(typeof hicksName === 'function' ? hicksName(r.c.setpoint) : '')}</span>` : ''}
        ${r.energy ? DIMS.filter(dm => r.energy[dm.id]).map(dm =>
            `<span>${esc(dm.name.toLowerCase())} <b>${r.energy[dm.id]}/5</b></span>`).join('') : ''}
        ${r.r.wakeTime ? `<span>woke <b>${esc(r.r.wakeTime)}</b></span>` : ''}
        ${sl.hm ? `<span>slept <b>${esc(sl.hm)}</b>${sl.inferred ? ' <i class="faint">(assumed)</i>' : ''}</span>` : ''}
      </div>
      ${r.tasks.length ? `<div class="field"><label>What was on the day</label>
        <ul class="day-tasks">${r.tasks.map(t =>
          `<li class="${t.done ? 'is-done' : ''}">${esc(t.text || '')}</li>`).join('')}</ul></div>` : ''}
      ${r.entries.length ? `<div class="field"><label>Written that day</label>
        <ul class="day-tasks">${r.entries.slice(0, 12).map(e =>
          `<li><a href="#/journals">${esc((e.title || e.body || '').slice(0, 80) || 'an entry')}</a></li>`).join('')}</ul></div>` : ''}
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <button class="btn sm ghost" data-dayedges="${esc(r.d)}">set the two ends of this day</button>
      </div>
    </div>
  </details>`;
}
function bindDayArchive(root){
  const scope = root || document;
  /* a month builds itself the first time it is opened, and only then */
  scope.querySelectorAll('.day-month').forEach(mo => {
    mo.addEventListener('toggle', () => {
      if(!mo.open) return;
      const box = mo.querySelector('[data-fill]');
      if(!box || box.dataset.filled === '1' || box.innerHTML.trim()) { if(box) box.dataset.filled = '1'; return; }
      const days = archiveDays().filter(d => d.slice(0, 7) === mo.dataset.month);
      box.innerHTML = archiveMonthHTML(days);
      box.dataset.filled = '1';
      /* the editable fields need no wiring: one delegated click listener on
         the document owns every .ed in the house, however late it arrives */
      bindArchiveEdges(box);
    });
    const box = mo.querySelector('[data-fill]');
    if(mo.open && box) box.dataset.filled = '1';
  });
  bindArchiveEdges(scope);
}
function bindArchiveEdges(scope){
  scope.querySelectorAll('[data-dayedges]').forEach(b => b.onclick = () => {
    if(typeof openDayEdgesEditor === 'function') openDayEdgesEditor(b.dataset.dayedges, () => rerender());
  });
}
