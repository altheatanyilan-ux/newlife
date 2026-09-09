/* ============================================================
   PLANNING — reminders.
   A reminder is stored as an absolute moment, recomputed whenever the
   task's due date moves, so nothing has to be recalculated at ring time.
   Delivery is a browser notification where permission was given, and
   always a banner on the page — the banner is the one that cannot fail.
   ============================================================ */
const PLAN_REM_MS = {at_time:0, '5min':5, '15min':15, '30min':30, '1hr':60, '1day':1440, '2days':2880, '1week':10080};

function planSyncReminders(t){
  const p = planState();
  p.reminders = p.reminders.filter(r => r.taskId !== t.id);
  if(!t.day || t.done) return;
  const base = new Date(`${t.day}T${t.dueTime || '09:00'}:00`);
  if(isNaN(base)) return;
  t.reminders.forEach(r => {
    const mins = PLAN_REM_MS[r.type]; if(mins == null) return;
    const at = new Date(base.getTime() - mins * 60000);
    p.reminders.push({id:uid(), taskId:t.id, triggerAt:at.toISOString(), dismissed:false, type:r.type});
  });
}
function planDueReminders(){
  const now = new Date().toISOString();
  return planState().reminders.filter(r => !r.dismissed && r.triggerAt <= now)
    .map(r => ({r, t: planTaskById(r.taskId)})).filter(x => x.t && !x.t.done);
}
function planReminderBannerHTML(){
  const due = planDueReminders(); if(!due.length) return '';
  return `<div class="pl-remind" id="plRemind">
    <span class="mono">${due.length === 1 ? 'a reminder' : due.length + ' reminders'}</span>
    <div class="pl-remlist">${due.slice(0, 4).map(({r, t}) => `<button class="pl-rem" data-plremgo="${t.id}" data-plremid="${r.id}">
      <b>${esc(t.text || 'Task')}</b><span class="mono">${t.day ? esc(fmtDate(t.day, 'short')) : ''}${t.dueTime ? ' ' + esc(t.dueTime) : ''}</span></button>`).join('')}</div>
    <button class="pl-mini" id="plRemClear" title="dismiss">×</button></div>`;
}
function bindPlanReminderBanner(root){
  $$('[data-plremgo]', root).forEach(b => b.onclick = () => {
    const r = planState().reminders.find(x => x.id === b.dataset.plremid);
    if(r) r.dismissed = true; saveNow(); openPlanTask(b.dataset.plremgo); });
  const c = $('#plRemClear'); if(c) c.onclick = () => {
    planDueReminders().forEach(({r}) => r.dismissed = true); saveNow(); rerender(); };
}
function planAskNotifyPermission(){
  if(!('Notification' in window) || Notification.permission !== 'default') return;
  try { Notification.requestPermission(); } catch(e){}
}
/* checked on load and once a minute after; the badge is on the nav whether or
   not the browser ever agreed to show anything */
let _planRemSeen = new Set();
function planCheckReminders(){
  if(!S.planning) return;
  const due = planDueReminders();
  const badge = document.querySelector('[data-page="planning"] .nav-badge');
  if(badge){ badge.textContent = due.length || ''; badge.hidden = !due.length; }
  due.forEach(({r, t}) => {
    if(_planRemSeen.has(r.id)) return; _planRemSeen.add(r.id);
    if('Notification' in window && Notification.permission === 'granted'){
      try { const n = new Notification(t.text || 'Task due', {body: t.day ? fmtDate(t.day, 'med') + (t.dueTime ? ' · ' + t.dueTime : '') : '', tag:r.id});
        n.onclick = () => { window.focus(); navigate('#/planning'); setTimeout(() => openPlanTask(t.id), 400); };
      } catch(e){}
    }
    if(parseHash().name === 'planning') rerender();
  });
}
addEventListener('load', () => { setTimeout(planCheckReminders, 1500); setInterval(planCheckReminders, 60000); });

/* completing a task can be a small door into the journal, if there is
   something worth saying. It asks once, quietly, and never insists. */
function planOfferReflection(t){
  if(!t || !(t.desc || '').trim() && !t.subtasks.length && t.priority < 3) return;
  toast(`Finished “${t.text}”. Anything worth writing down?`, 7000, {label:'write it', fn: () => {
    openEntryModal({type:'reflection', title:t.text,
      links:{projects:(t.links.projects || []).slice(), skills:(t.links.skills || []).slice(),
        stages:[], substages:[], threads:[], values:[], people:[]}});
  }});
}
