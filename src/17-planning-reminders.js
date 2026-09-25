/* ============================================================
   PLANNING — the reminders.

   Things to be reminded of, each at a day and (if it matters) a time, behind
   their own 🔔 button on Planning's top line, beside the shopping list and
   for the same reason: "the dentist rings at three" is not work to be sorted
   into a list, so it is not one of the lists.

   A reminder is a task with `remind` set, which buys it everything a task
   already has — the panel to edit it in, the day and the time, a repeat, the
   browser's own notification at the time when that has been allowed. Written
   here, it is only ever a reminder and stays out of the Inbox and the dated
   views. Any task can be one as well, from its panel: it stays in its list.

   What makes it a reminder is where it shows. From so many days before its
   day — "show it from", one day by default — it is at the top of Today and it
   floats over every other page, so it is seen without going to look for it.
   At its time it rings once, and it stays until it is ticked.
   ============================================================ */

const REMIND_LEADS = [[0, 'on the day'], [1, '1 day before'], [2, '2 days before'], [3, '3 days before'], [7, 'a week before']];

const planRemindAll = () => planOwnTasks().filter(t => t.remind);
/* the open ones, soonest first */
function planRemindItems(){
  return planRemindAll().filter(t => !t.done)
    .sort((a, b) => remindMoment(a) - remindMoment(b) || (a.order || 0) - (b.order || 0));
}
const planRemindDone = () => planRemindAll().filter(t => t.done)
  .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));

/* the moment it is for: its day at its time, or the start of its day */
function remindMoment(t){
  const d = new Date(`${t.day || today()}T${t.dueTime || '00:00'}:00`);
  return isNaN(d) ? new Date() : d;
}
const remindShowFrom = t => addDays(t.day || today(), -(+t.remindLead || 0));
/* on Today and floating: from the day it shows from until it is ticked */
const remindActive = t => !!t && t.remind && !t.done && remindShowFrom(t) <= today();
function remindsActive(){ return planRemindItems().filter(remindActive); }
/* late: a day gone by · now: its time has come today · today: later today ·
   soon: a day still to come */
function remindState(t){
  const T = today(), d = t.day || T;
  if(d < T) return 'late';
  if(d > T) return 'soon';
  if(!t.dueTime) return 'now';
  return Date.now() >= remindMoment(t).getTime() ? 'now' : 'today';
}
const _remClock = hm => { if(!hm) return ''; let [h, m] = hm.split(':').map(Number);
  const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')}${ap}`; };
/* how it reads beside the reminder: when, in the words you would use */
function remindWhen(t){
  const T = today(), d = t.day || T, at = t.dueTime ? _remClock(t.dueTime) : '';
  const st = remindState(t);
  if(st === 'late') return `since ${fmtDate(d, 'short')}${at ? ' · ' + at : ''}`;
  if(st === 'now') return at ? `now · ${at}` : 'today';
  if(st === 'today') return `today · ${at}`;
  const n = daysBetween(T, d);
  const day = n === 1 ? 'tomorrow' : n < 7 ? `${fmtDate(d, 'short')} · in ${n} days` : fmtDate(d, 'short');
  return at ? `${day} · ${at}` : day;
}

/* ---------- making, changing, ticking ---------- */
function planAddReminder({text, day, time, lead} = {}){
  let words = String(text || '').trim(); if(!words) return null;
  day = day || today(); time = time || '';
  /* "call the dentist friday 3pm" says its own day and time */
  if(typeof parseQuickTask === 'function'){
    const q = parseQuickTask(words);
    if(q.day || q.dueTime){ words = q.text || words; if(q.day) day = q.day; if(q.dueTime) time = q.dueTime; }
  }
  const t = newPlanTask(words, '', {listId: 'inbox', remind: true});
  t.day = day; t.dueTime = time; t.remindLead = [0, 1, 2, 3, 7].includes(+lead) ? +lead : 1;
  t.order = Date.now();
  /* the browser's notification at the time, where it has been allowed */
  t.reminders = [{type: 'at_time'}];
  S.tasks = S.tasks || []; S.tasks.push(t);
  if(typeof planSyncReminders === 'function') planSyncReminders(t);
  saveNow();
  return t;
}
/* a task from a real list, put on the reminders from its panel */
function planSetRemind(t, on){
  t.remind = !!on;
  if(on){
    if(!t.day) t.day = today();
    t.reminders = Array.isArray(t.reminders) ? t.reminders : [];
    if(!t.reminders.some(r => r.type === 'at_time')) t.reminders.push({type: 'at_time'});
  }
  t.remindRang = null; t.updatedAt = new Date().toISOString();
  if(typeof planSyncReminders === 'function') planSyncReminders(t);
  saveNow();
  return t.remind;
}
/* "in an hour": an hour from now, or from its time if that is still ahead */
function remindSnooze(t, mins = 60){
  const at = new Date(Math.max(Date.now(), remindMoment(t).getTime()) + mins * 60000);
  t.day = isoDay(at);
  t.dueTime = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
  t.remindRang = null; t.updatedAt = new Date().toISOString();
  if(typeof planSyncReminders === 'function') planSyncReminders(t);
  saveNow();
}
function remindTick(t){
  const was = t.done;
  planSetDone(t, !was);
  return !was;
}
/* × on a reminder: written here, it goes; a task from a real list only comes
   off the reminders */
function remindRemove(t){
  if(t.listId !== 'inbox'){ planSetRemind(t, false); return 'off'; }
  S.tasks = S.tasks.filter(x => x.id !== t.id);
  if(typeof planSyncReminders === 'function') planSyncReminders(Object.assign({}, t, {day: ''}));
  saveNow();
  return 'gone';
}
function openReminders(){
  S._planRoom = 'tasks';
  if(typeof planSetSel === 'function') planSetSel('remind', 'list'); else S._planSel = {kind: 'remind', id: 'list'};
  if(planningOnScreen()) rerender(); else navigate('#/today/tasks');
}

/* ---------- on Planning: the Reminders view ---------- */
function planRemindRowHTML(t){
  const st = t.done ? 'done' : remindState(t), on = !t.done && remindActive(t);
  return `<div class="prem-row st-${st}${t.done ? ' done' : ''}" data-premrow="${esc(t.id)}">
    <button class="pt-box${t.done ? ' on' : ''}" data-premdone="${esc(t.id)}" role="checkbox" aria-checked="${!!t.done}"
      aria-label="${t.done ? 'not done after all' : 'done'}: ${esc(t.text)}"><svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="8.2" class="pt-ring"/><path d="M5.6 10.3 L8.7 13.3 L14.4 6.9" class="pt-tick"/></svg></button>
    <button class="prem-t" data-premopen="${esc(t.id)}" title="open it — change the words, the day, the time">${esc(t.text)}</button>
    ${t.listId !== 'inbox' ? `<span class="pt-list" style="--c:${planListColor(t.listId)}" title="also in this list">${esc(planListName(t.listId))}</span>` : ''}
    <span class="prem-when mono">${esc(t.done ? fmtDate(t.day || today(), 'short') : remindWhen(t))}</span>
    ${!t.done && !on ? `<span class="prem-from mono faint" title="it shows on Today and over every page from then">shows ${
      esc(remindShowFrom(t) === addDays(today(), 1) ? 'tomorrow' : fmtDate(remindShowFrom(t), 'short'))}</span>` : ''}
    ${!t.done && (st === 'now' || st === 'late') ? `<button class="tbtn" data-premsnooze="${esc(t.id)}" title="remind me again in an hour">in an hour</button>` : ''}
    <button class="del-x inline" data-premdel="${esc(t.id)}" aria-label="take ${esc(t.text)} off the reminders">×</button>
  </div>`;
}
function planRemindHTML(items){
  const T = today();
  const showing = items.filter(remindActive), later = items.filter(t => !remindActive(t));
  const done = planRemindDone().slice(0, 12);
  const lead = S._premLead != null ? S._premLead : 1;
  return `<div class="prem">
    <div class="prem-add">
      <input class="inp" id="premIn" autocomplete="off" aria-label="what to be reminded of"
        placeholder="what to remember — “call the dentist friday 3pm” sets the day and time too">
      <div class="prem-opts">
        <label class="prem-f"><span class="k mono">day</span><input class="inp" type="date" id="premDay" value="${T}"></label>
        <label class="prem-f"><span class="k mono">time</span><input class="inp" type="time" id="premTime"></label>
        <label class="prem-f"><span class="k mono">show it from</span><select class="sel" id="premLead">${REMIND_LEADS.map(([v, n]) =>
          `<option value="${v}" ${+lead === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <button class="btn sm primary" id="premAdd">Add</button>
      </div>
    </div>
    ${showing.length ? `<div class="prem-group prem-now"><div class="prem-gh"><span class="sc">Showing now</span>
      <span class="mono faint">on Today, and over every other page</span></div>${showing.map(planRemindRowHTML).join('')}</div>` : ''}
    ${later.length ? `<div class="prem-group"><div class="prem-gh"><span class="sc">Coming up</span>
      <span class="mono faint">${later.length}</span></div>${later.map(planRemindRowHTML).join('')}</div>` : ''}
    ${!items.length ? `<div class="empty sm prem-empty">Nothing to be reminded of. Write it here with its day and time, and it will find you.</div>` : ''}
    ${done.length ? `<div class="prem-group prem-done"><div class="prem-gh"><span class="sc">Done</span>
      <span class="mono faint">${done.length}</span><span class="grow"></span>
      <button class="tbtn" id="premClear" title="throw the ticked reminders away">clear</button></div>${done.map(planRemindRowHTML).join('')}</div>` : ''}
    <p class="faint sm prem-hint">From the day you choose, a reminder is at the top of Today and floats over every other page until you tick it.
      Any task can be one too: open it and tick “remind me”.
      ${'Notification' in window && Notification.permission === 'default'
        ? '<button class="tbtn" id="premNotify">let the browser notify me at the time as well</button>' : ''}</p>
  </div>`;
}
function bindPlanRemind(root){
  const box = root.querySelector('.prem'); if(!box) return;
  const input = box.querySelector('#premIn');
  const add = () => {
    const lead = +box.querySelector('#premLead').value;
    const t = planAddReminder({text: input.value, day: box.querySelector('#premDay').value,
      time: box.querySelector('#premTime').value, lead});
    if(!t){ input.focus(); return; }
    S._premLead = lead; S._premFocus = true;
    sound('click');
    toast(`Reminder set — ${esc(remindWhen(t))}${remindActive(t) ? '' : `, showing from ${esc(fmtDate(remindShowFrom(t), 'short'))}`}.`);
    rerender(); paintRemindFloat();
  };
  box.querySelector('#premAdd').onclick = add;
  input.onkeydown = ev => { if(ev.key === 'Enter' && !ev.shiftKey){ ev.preventDefault(); add(); } };
  if(S._premFocus){ S._premFocus = false; setTimeout(() => input.focus(), 0); }
  bindRemindRows(box, () => { rerender(); paintRemindFloat(); });
  const clear = box.querySelector('#premClear');
  if(clear) clear.onclick = () => {
    const gone = planRemindDone();
    gone.filter(t => t.listId !== 'inbox').forEach(t => { t.remind = false; });
    const ids = new Set(gone.filter(t => t.listId === 'inbox').map(t => t.id));
    S.tasks = S.tasks.filter(t => !ids.has(t.id));
    saveNow(); sound('click'); rerender(); };
  const ask = box.querySelector('#premNotify');
  if(ask) ask.onclick = () => { try { Notification.requestPermission().then(() => rerender()); } catch(e){} };
}
/* the same four things wherever a reminder is drawn: tick, open, later, × */
function bindRemindRows(box, redraw){
  $$('[data-premdone]', box).forEach(b => b.onclick = ev => { ev.stopPropagation();
    const t = planTaskById(b.dataset.premdone); if(!t) return;
    sound(remindTick(t) ? 'success' : 'click'); redraw(); });
  $$('[data-premopen]', box).forEach(b => b.onclick = () => openPlanTask(b.dataset.premopen));
  $$('[data-premsnooze]', box).forEach(b => b.onclick = ev => { ev.stopPropagation();
    const t = planTaskById(b.dataset.premsnooze); if(!t) return;
    remindSnooze(t); sound('click'); toast(`Again at ${esc(_remClock(t.dueTime))}.`); redraw(); });
  $$('[data-premdel]', box).forEach(b => b.onclick = ev => { ev.stopPropagation();
    const t = planTaskById(b.dataset.premdel); if(!t) return;
    remindRemove(t); sound('click'); redraw(); });
}

/* ---------- on Today: at the top, where it cannot be missed ---------- */
function remindTodayHTML(){
  const list = remindsActive();
  if(!list.length) return '';
  const now = list.filter(t => ['now', 'late'].includes(remindState(t))).length;
  return `<section class="t-remind rv${now ? ' ringing' : ''}" id="t-remind" aria-label="reminders">
    <div class="t-remind-h"><span class="sc" style="margin:0">🔔 Remember</span>
      <span class="mono faint">${now ? `${now} now` : ''}${now && list.length > now ? ' · ' : ''}${list.length > now ? `${list.length - now} coming` : ''}</span>
      <span class="grow"></span><button class="tbtn" data-remall>all reminders →</button></div>
    <div class="t-remind-list">${list.map(t => `<div class="t-rem st-${remindState(t)}" data-remrow="${esc(t.id)}">
      <button class="task-check" data-premdone="${esc(t.id)}" role="checkbox" aria-checked="false" title="done — it stops reminding you"></button>
      <button class="t-rem-t" data-premopen="${esc(t.id)}">${esc(t.text)}</button>
      <span class="t-rem-when mono">${esc(remindWhen(t))}</span>
      ${['now', 'late'].includes(remindState(t)) ? `<button class="tbtn" data-premsnooze="${esc(t.id)}">in an hour</button>` : ''}
    </div>`).join('')}</div>
  </section>`;
}
function bindRemindToday(root){
  const box = root.querySelector('#t-remind'); if(!box) return;
  bindRemindRows(box, () => { rerender(); paintRemindFloat(); });
  const all = box.querySelector('[data-remall]'); if(all) all.onclick = openReminders;
}

/* ---------- over every other page ----------
   Hung once at boot, outside #main, so a redraw cannot take it away. It is
   not over Today, which has the same reminders at its top already. In focus
   mode it keeps to the ones whose day has come, and folded away it is a bell
   with a number — until one of them rings, which opens it again. */
function remindFloatList(){
  let list = remindsActive();
  const focus = document.documentElement.classList.contains('page-focus')
    || document.documentElement.classList.contains('sc-reading');
  if(focus) list = list.filter(t => (t.day || today()) <= today());
  return list;
}
/* Three sizes: one line — the most pressing reminder, and how many more —
   which is what it is unless asked otherwise; the whole list, opened from that
   line; and a bell with a number, folded away. A reminder ringing brings a
   folded one back to its line. */
function paintRemindFloat(){
  const box = document.getElementById('remFloat'); if(!box) return;
  if(!S || !S.planning){ box.hidden = true; return; }
  const list = remindFloatList();
  /* Today has them at its top, and the Reminders view is them */
  const here = !!document.querySelector('#main .today-page, #main .prem');
  if(!list.length || here){ box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  const mode = ['min', 'open'].includes(S._remFloatMode) ? S._remFloatMode : 'strip';
  const ringing = list.some(t => ['now', 'late'].includes(remindState(t)));
  box.classList.toggle('ringing', ringing);
  box.dataset.mode = mode;
  const first = list[0], more = list.length - 1;
  const row = t => `<div class="rf-row st-${remindState(t)}">
      <button class="rf-check" data-premdone="${esc(t.id)}" title="done — it stops reminding you" aria-label="done: ${esc(t.text)}">✓</button>
      <button class="rf-t" data-premopen="${esc(t.id)}" title="open it">${esc(t.text)}</button>
      <span class="rf-when mono">${esc(remindWhen(t))}</span></div>`;
  box.innerHTML = mode === 'min'
    ? `<button class="rf-pill" id="rfOpen" title="${list.length} reminder${list.length === 1 ? '' : 's'}" aria-label="show the reminders">🔔 <b>${list.length}</b></button>`
    : mode === 'strip'
    ? `<div class="rf-strip" role="region" aria-label="reminders"><span class="rf-bell" aria-hidden="true">🔔</span>
        ${row(first)}
        ${more ? `<button class="rf-n mono" id="rfExpand" title="all ${list.length} of them">+${more}</button>` : ''}
        <button class="rf-x" id="rfMin" title="fold it away" aria-label="fold the reminders away">–</button></div>`
    : `<div class="rf-card" role="region" aria-label="reminders">
        <div class="rf-h"><button class="rf-hb mono" id="rfFold" title="back to one line">🔔 remember · ${list.length}</button><span class="grow"></span>
          <button class="rf-x" id="rfMin" title="fold it away" aria-label="fold the reminders away">–</button></div>
        ${list.slice(0, 6).map(row).join('')}
        ${list.length > 6 ? `<button class="rf-more" id="rfAll">${list.length - 6} more →</button>`
          : `<button class="rf-more" id="rfAll">all reminders →</button>`}
      </div>`;
  const redraw = () => { paintRemindFloat(); if(planningOnScreen() || document.getElementById('t-remind')) rerender(); };
  bindRemindRows(box, redraw);
  const set = m => () => { S._remFloatMode = m; paintRemindFloat(); };
  [['#rfOpen', 'strip'], ['#rfMin', 'min'], ['#rfExpand', 'open'], ['#rfFold', 'strip']].forEach(([q, m]) => {
    const b = box.querySelector(q); if(b) b.onclick = set(m); });
  const all = box.querySelector('#rfAll'); if(all) all.onclick = openReminders;
}
/* At its time a reminder rings, once: a chime, a word at the foot of the
   screen, and the floating card opened again if it had been folded away. */
function remindCheckRing(){
  if(!S || !S.planning) return;
  let rang = null;
  remindsActive().forEach(t => {
    if(remindState(t) !== 'now' || !t.dueTime || t.remindRang) return;
    t.remindRang = new Date().toISOString(); rang = t;
  });
  if(rang){
    saveNow(); sound('chime'); if(S._remFloatMode === 'min') S._remFloatMode = 'strip';
    toast(`🔔 ${esc(rang.text)}`, 9000);
    const a = document.activeElement;
    const typing = a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
    if(!typing && (document.getElementById('t-remind') || parseHash().name === 'today')) rerender();
  }
  paintRemindFloat();
}
function mountRemindFloat(){
  if(document.getElementById('remFloat')) return;
  const box = el('<div id="remFloat" class="rem-float" hidden aria-live="polite"></div>');
  document.body.appendChild(box);
  paintRemindFloat();
  setInterval(remindCheckRing, 20000);
  setTimeout(remindCheckRing, 1500);
}
