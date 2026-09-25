/* ============================================================
   PLANNING — one task, opened.
   Everything here writes on change. There is no save button, the
   way there is none anywhere else in the house.
   ============================================================ */

const PLAN_REMINDER_OFFSETS = [
  ['at_time', 'at the time'], ['5min','5 min before'], ['15min','15 min before'], ['30min','30 min before'],
  ['1hr','1 hour before'], ['1day','1 day before'], ['2days','2 days before'], ['1week','1 week before'],
];
const PLAN_DURATIONS = [[15,'15m'],[30,'30m'],[45,'45m'],[60,'1h'],[120,'2h'],[240,'4h'],[480,'a day']];

function openPlanTask(id){
  const t = id ? planTaskById(id) : null;
  if(id && !t) return;
  if(!t){                                          // a brand new one, made where you are
    const sel = planSel();
    const fresh = newPlanTask('', sel.kind === 'smart' && sel.id === 'today' ? today() : '',
      {listId: sel.kind === 'list' ? sel.id : 'inbox', tags: sel.kind === 'tag' ? [sel.id] : []});
    S.tasks.push(fresh); saveNow();
    return openPlanTask(fresh.id);
  }
  const p = openPanel(planDetailHTML(t), 'plan-detail');
  bindPlanDetail(p, t);
  setTimeout(() => { const ti = p.querySelector('#pdTitle'); if(ti && !t.text) ti.focus(); }, 120);
  return p;
}

function planDetailHTML(t){
  const pr = planPriority(t.priority), sub = planSubProgress(t);
  const sessions = planState().focusSessions.filter(s => s.taskId === t.id && s.type === 'focus');
  return `<div class="pd">
    <div class="pd-head">
      <button class="pt-box lg${t.done ? ' on' : ''}" id="pdDone" role="checkbox" aria-checked="${t.done}"
        style="${pr.color ? `--pc:${pr.color}` : ''}"><svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8.2" class="pt-ring"/><path d="M5.6 10.3 L8.7 13.3 L14.4 6.9" class="pt-tick"/></svg></button>
      <!-- A one-line input cannot show a long task name at any width, and the
           name is the one thing the panel exists to show. A textarea that grows
           to its content wraps instead of hiding the end of the sentence. -->
      <textarea class="inp pd-title${t.done ? ' struck' : ''}" id="pdTitle" rows="1"
        placeholder="What needs doing?">${esc(t.text)}</textarea>
    </div>
    <div class="pd-prios">${PLAN_PRIORITY.map(x => `<button class="pd-prio${t.priority === x.n ? ' on' : ''}"
      data-pdprio="${x.n}" title="${esc(x.name)} priority" style="${x.color ? `--c:${x.color}` : '--c:var(--line-2)'}"></button>`).join('')}
      <span class="mono faint">${esc(pr.name.toLowerCase())}</span></div>

    <div class="pd-quick">
      <label class="pd-q"><span class="k">due</span><input type="date" class="inp" id="pdDay" value="${esc(t.day || '')}"></label>
      <label class="pd-q"><span class="k">at</span><input type="time" class="inp" id="pdTime" value="${esc(t.dueTime || '')}"></label>
      <!-- The day it is owed and the day you will sit down with it are
           different questions, and only the second one is a plan. A task due
           on Friday sat in Friday until Friday, which is how a week ends in a
           wall; this is where you say "Tuesday" and mean it. -->
      <label class="pd-q"><span class="k">do on</span><input type="date" class="inp" id="pdDoDay" value="${esc(t.doDay || '')}"></label>
      <label class="pd-q"><span class="k">starts</span><input type="date" class="inp" id="pdStart" value="${esc(t.startDate || '')}"></label>
      <label class="pd-q"><span class="k">list</span><select class="sel" id="pdList">
        ${planLists().map(l => `<option value="${l.id}" ${t.listId === l.id ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</select></label>
      <!-- something to buy: it goes on the shopping list (the 🛒 button on the
           top line), and stays in its own list as well -->
      <label class="pd-q pd-shop"><span class="k">to buy</span>
        <span class="pd-shopchk"><input type="checkbox" id="pdShop" ${t.shop ? 'checked' : ''}> 🛒 on the shopping list</span></label>
      <!-- to be reminded of: on the reminders (the 🔔 button), and from so many
           days before its day at the top of Today and over every page -->
      <label class="pd-q pd-shop"><span class="k">remind me</span>
        <span class="pd-shopchk"><input type="checkbox" id="pdRemind" ${t.remind ? 'checked' : ''}> 🔔 show it from
          <select class="sel pd-remlead" id="pdRemLead" ${t.remind ? '' : 'disabled'}>${(typeof REMIND_LEADS !== 'undefined' ? REMIND_LEADS : [[1, '1 day before']]).map(([v, n]) =>
            `<option value="${v}" ${+t.remindLead === v ? 'selected' : ''}>${n}</option>`).join('')}</select></span></label>
      <!-- Which part of a life this is, in the time tracker's own words. An
           hour sat with this task is filed under whatever is chosen here, so
           the week's report says "the bar's accounts" rather than "Tasks" —
           three hours of tasks is not a fact about anybody's week. -->
      <label class="pd-q"><span class="k">counts as</span><select class="sel" id="pdTimeCat">
        <option value="">— just tasks —</option>
        ${(typeof timeCategories === 'function' ? timeCategories() : []).map(c =>
          `<option value="${esc(c.id)}" ${t.timeCategory === c.id ? 'selected' : ''}>${esc(c.emoji)} ${esc(c.name)}</option>`).join('')}</select></label>
      <!-- The date this task is for. A due date says when it must be done; a
           milestone says what it is being done towards, which is the thing
           you actually want back when you ask what is left before shipping.
           The choice is the milestones of the task's own list, because that
           is where the run it belongs to lives. -->
      <label class="pd-q"><span class="k">towards</span><select class="sel" id="pdMilestone">
        <option value="">— no milestone —</option>
        ${(() => { const own = planListMilestones(planList(t.listId)).slice()
            .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
          /* a task keeps a milestone from another list if it already has one:
             moving the task between lists must not silently break the link */
          const cur = t.milestoneId && !own.some(m => m.id === t.milestoneId) ? planFindMilestone(t.milestoneId) : null;
          return [...own.map(m => ({m, from:''})), ...(cur ? [{m:cur.m, from:cur.list.name}] : [])]
            .map(({m, from}) => `<option value="${esc(m.id)}" ${t.milestoneId === m.id ? 'selected' : ''}>${
              esc(m.name)}${m.date ? ' · ' + esc(fmtDate(m.date, 'short')) : ''}${from ? ' (' + esc(from) + ')' : ''}</option>`).join(''); })()}
      </select></label>
    </div>

    <div class="pd-sec"><div class="k mono">how long</div><div class="chip-row">
      ${PLAN_DURATIONS.map(([v, n]) => `<button class="chip click${t.duration === v ? ' on' : ''}" data-pddur="${v}">${n}</button>`).join('')}
      ${t.duration ? `<button class="chip click" data-pddur="0">clear</button>` : ''}</div></div>

    <div class="pd-sec"><div class="k mono">tags</div><div class="chip-row" id="pdTags">
      ${planState().tags.map(x => `<button class="chip click${t.tags.includes(x.name) ? ' on' : ''}" data-pdtag="${esc(x.name)}" style="--c:${x.color}">${esc(x.name)}</button>`).join('')}
      <button class="chip click" id="pdNewTag" style="--c:var(--page-accent)">＋ tag</button></div></div>

    <div class="pd-sec"><div class="k mono">notes</div>
      <textarea class="ta" id="pdDesc" placeholder="Anything the title does not carry. Markdown welcome.">${esc(t.desc)}</textarea></div>

    <div class="pd-sec"><div class="row between"><span class="k mono">subtasks</span>
      <span class="mono faint">${sub ? `${sub.done}/${sub.total}` : ''}</span></div>
      ${sub ? `<div class="pd-bar"><i style="width:${Math.round(sub.done / sub.total * 100)}%"></i></div>` : ''}
      <div class="pd-subs" id="pdSubs">${t.subtasks.map((s, i) => `<div class="pd-sub${s.isCompleted ? ' done' : ''}" data-pdsub="${s.id}" draggable="true">
        <button class="pt-box sm" data-pdsubdone="${s.id}" role="checkbox" aria-checked="${s.isCompleted}"><svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="8.2" class="pt-ring"/><path d="M5.6 10.3 L8.7 13.3 L14.4 6.9" class="pt-tick"/></svg></button>
        <input class="inp" data-pdsubtext="${s.id}" value="${esc(s.title)}" placeholder="a step">
        <button class="del-x inline" data-pdsubdel="${s.id}">×</button></div>`).join('')}</div>
      <input class="inp pd-subadd" id="pdSubAdd" placeholder="＋ add a step, Enter for another"></div>

    <div class="pd-sec"><div class="k mono">repeats</div>
      <div class="chip-row">${[['','never'],['daily','daily'],['weekly','weekly'],['monthly','monthly'],['yearly','yearly'],['after_completion','after it is done']]
        .map(([v, n]) => `<button class="chip click${(t.recurrence?.pattern || '') === v ? ' on' : ''}" data-pdrec="${v}">${n}</button>`).join('')}</div>
      ${t.recurrence ? `<div class="row" style="gap:8px;margin-top:8px;align-items:center">
        <span class="mono faint">every</span><input class="inp mono" id="pdRecN" style="width:64px" value="${t.recurrence.interval || 1}">
        <span class="mono faint">${t.recurrence.pattern === 'after_completion' ? 'days after it is done' : t.recurrence.pattern.replace(/ly$/, '') + 's'}</span>
        <span class="mono faint" style="margin-left:auto">next: ${planNextDue(t) ? esc(fmtDate(planNextDue(t), 'med')) : '—'}</span></div>` : ''}</div>

    <div class="pd-sec"><div class="k mono">reminders</div>
      <div class="chip-row">${PLAN_REMINDER_OFFSETS.map(([v, n]) =>
        `<button class="chip click${t.reminders.some(r => r.type === v) ? ' on' : ''}" data-pdrem="${v}">${n}</button>`).join('')}</div>
      ${!t.day ? '<div class="faint" style="font-size:.74rem;margin-top:5px">A reminder needs a due date to count from.</div>' : ''}</div>

    <div class="pd-sec"><div class="row between"><span class="k mono">focus</span>
      <span class="mono">${t.focusTime ? `${Math.floor(t.focusTime / 60)}h ${t.focusTime % 60}m logged` : 'nothing logged'}</span></div>
      <button class="btn sm" id="pdFocus">◔ time this on Today</button>
      ${sessions.length ? `<div class="fl-list pd-fsess">${sessions.slice(-6).reverse().map(s =>
        typeof focusSessionHTML === 'function' ? focusSessionHTML(s, {withDate:true})
          : `<div class="mono"><span>${esc(fmtDate(s.startedAt.slice(0, 10), 'short'))}</span><span>${s.duration}m</span></div>`).join('')}</div>` : ''}</div>

    <div class="pd-sec"><div class="k mono">connects to</div>
      <div class="chip-row">${(S.projects || []).map(x => `<button class="chip click${t.links.projects.includes(x.id) ? ' on' : ''}" data-pdlk="projects:${x.id}" style="--c:var(--terra)">${esc(x.name)}</button>`).join('')}</div>
      <div class="chip-row" style="margin-top:6px">${(S.skills || []).filter(s => !s.planned).map(x => `<button class="chip click${t.links.skills.includes(x.id) ? ' on' : ''}" data-pdlk="skills:${x.id}" style="--c:var(--ment)">${esc(x.name)}</button>`).join('')}</div>
      ${typeof incomeStreamList === 'function' && incomeStreamList().length ? `<div class="chip-row" style="margin-top:6px">${incomeStreamList().map(s =>
        `<button class="chip click${t.streamId === s.id ? ' on' : ''}" data-pdstream="${esc(s.id)}" style="--c:var(--gold)">${esc(s.name)}</button>`).join('')}</div>` : ''}</div>

    <div class="pd-meta mono">
      <div>added ${esc(fmtDate((t.createdAt || '').slice(0, 10), 'med'))}</div>
      ${t.doneAt ? `<div>finished ${esc(fmtDate(t.doneAt, 'med'))}</div>` : ''}
      <div>in ${esc(planListName(t.listId))}</div></div>
    <div class="row" style="gap:8px;margin-top:14px">
      <button class="btn sm ghost" id="pdDup">duplicate</button>
      <button class="btn sm ghost danger" id="pdDel">delete</button></div>
  </div>`;
}

function bindPlanDetail(p, t){
  const touch = () => { t.updatedAt = new Date().toISOString(); saveNow(); };
  const redraw = () => { const np = openPanel(planDetailHTML(planTaskById(t.id)), 'plan-detail');
    bindPlanDetail(np, planTaskById(t.id)); rerenderPlanBody(); };

  /* It always saved as you typed, but said nothing and ignored Return, which
     reads exactly like a field that has not saved. Now it answers: a pulse
     when the text settles, and Return means "done" rather than nothing. */
  const pdT = p.querySelector('#pdTitle');
  /* grow to fit, now and after every change, so the whole name is always on
     screen — including at the widest the panel goes */
  const fitTitle = () => { pdT.style.height = 'auto'; pdT.style.height = pdT.scrollHeight + 'px'; };
  fitTitle(); pdT.addEventListener('input', fitTitle);
  addEventListener('resize', fitTitle);
  const pulse = () => { if(!pdT.isConnected) return;
    const s = el('<span class="saved-pulse">saved</span>');
    pdT.parentNode.appendChild(s); setTimeout(() => s.remove(), 1200); };
  /* TYPING IS NOT A STRUCTURAL CHANGE, and it used to be treated as one.
     Every three hundred and fifty milliseconds of typing rebuilt the page
     underneath the panel — on Planning that was the task body, and anywhere
     else, Today included, it was the entire page. The whole of Today flashed
     under the panel every few letters, which reads as the app falling over.

     What actually changes on the page behind while a name is being typed is
     one string: that task's own label, wherever it is drawn. So write that
     string, and leave everything else alone. The page is marked as owing a
     redraw, and pays it once when the panel closes — which is when the
     things a name really can move, a search filter or a sort by name, get to
     take effect. */
  const echo = v => planEchoTaskText(t.id, v);
  pdT.oninput = debounce(function(){ t.text = this.value; touch(); pulse(); echo(this.value); }, 350);
  pdT.onkeydown = ev => { if(ev.key === 'Enter'){ ev.preventDefault(); t.text = pdT.value;
    touch(); pulse(); echo(pdT.value); pdT.blur(); } };
  p.querySelector('#pdDone').onclick = () => { planSetDone(t, !t.done); sound(t.done ? 'success' : 'click'); redraw(); };
  p.querySelectorAll('[data-pdprio]').forEach(b => b.onclick = () => { t.priority = +b.dataset.pdprio; touch(); redraw(); });
  p.querySelector('#pdDay').onchange = function(){ t.day = this.value; planSyncReminders(t); touch(); rerenderPlanBody(); };
  p.querySelector('#pdTime').onchange = function(){ t.dueTime = this.value; planSyncReminders(t); touch(); rerenderPlanBody(); };
  p.querySelector('#pdDoDay').onchange = function(){ t.doDay = this.value; touch(); rerenderPlanBody(); };
  p.querySelector('#pdStart').onchange = function(){ t.startDate = this.value; touch(); };
  p.querySelector('#pdList').onchange = function(){ t.listId = this.value; t.sectionId = null; touch(); rerenderPlanBody(); };
  const rem = p.querySelector('#pdRemind'), remLead = p.querySelector('#pdRemLead');
  if(rem) rem.onchange = function(){ planSetRemind(t, this.checked); if(remLead) remLead.disabled = !this.checked;
    const dayIn = p.querySelector('#pdDay'); if(dayIn && t.day && !dayIn.value) dayIn.value = t.day;
    rerenderPlanBody();
    if(typeof toast === 'function') toast(this.checked
      ? `On the reminders — ${esc(remindWhen(t))}.` : 'Off the reminders.'); };
  if(remLead) remLead.onchange = function(){ t.remindLead = +this.value; touch(); rerenderPlanBody(); };
  const shop = p.querySelector('#pdShop');
  if(shop) shop.onchange = function(){ t.shop = this.checked; touch(); rerenderPlanBody();
    if(typeof toast === 'function') toast(this.checked ? 'On the shopping list.' : 'Off the shopping list.'); };
  const tcat = p.querySelector('#pdTimeCat');
  if(tcat) tcat.onchange = function(){ t.timeCategory = this.value || null; touch(); };
  p.querySelector('#pdMilestone').onchange = function(){
    t.milestoneId = this.value || null; touch(); rerenderPlanBody(); };
  p.querySelectorAll('[data-pddur]').forEach(b => b.onclick = () => { const v = +b.dataset.pddur;
    t.duration = v || null; touch(); redraw(); });
  p.querySelectorAll('[data-pdtag]').forEach(b => b.onclick = () => { const n = b.dataset.pdtag;
    const i = t.tags.indexOf(n); i < 0 ? t.tags.push(n) : t.tags.splice(i, 1);
    b.classList.toggle('on'); touch(); rerenderPlanBody(); });
  p.querySelector('#pdNewTag').onclick = () => { const n = prompt('Tag name'); if(!n || !n.trim()) return;
    const tag = planEnsureTag(n); if(tag && !t.tags.includes(tag.name)) t.tags.push(tag.name); touch(); redraw(); };
  p.querySelector('#pdDesc').oninput = debounce(function(){ t.desc = this.value; touch(); }, 400);

  /* subtasks */
  p.querySelectorAll('[data-pdsubdone]').forEach(b => b.onclick = () => {
    const s = t.subtasks.find(x => x.id === b.dataset.pdsubdone); if(!s) return;
    /* through the shared setter so the clock hears it here too */
    const timed = typeof setSubDone === 'function'
      ? setSubDone(t.id, s.id, !s.isCompleted)
      : (s.isCompleted = !s.isCompleted, s.completedAt = s.isCompleted ? today() : null, false);
    if(!timed) sound(s.isCompleted ? 'click' : 'nav');
    touch(); redraw(); });
  p.querySelectorAll('[data-pdsubtext]').forEach(i => i.oninput = debounce(function(){
    const s = t.subtasks.find(x => x.id === i.dataset.pdsubtext); if(s){ s.title = this.value; touch(); } }, 350));
  p.querySelectorAll('[data-pdsubdel]').forEach(b => b.onclick = () => {
    spliceOut(t.subtasks, x => x.id === b.dataset.pdsubdel); touch(); redraw(); });
  const sa = p.querySelector('#pdSubAdd');
  sa.onkeydown = ev => { if(ev.key !== 'Enter') return; ev.preventDefault();
    const v = sa.value.trim(); if(!v) return;
    t.subtasks.push({id:uid(), title:v, isCompleted:false, completedAt:null, sortOrder:t.subtasks.length});
    touch(); sound('click'); sa.value = '';
    const np = openPanel(planDetailHTML(t), 'plan-detail'); bindPlanDetail(np, t); rerenderPlanBody();
    setTimeout(() => np.querySelector('#pdSubAdd')?.focus(), 60); };

  /* recurrence */
  p.querySelectorAll('[data-pdrec]').forEach(b => b.onclick = () => {
    const v = b.dataset.pdrec;
    t.recurrence = v ? Object.assign({pattern:v, interval:1, daysOfWeek:[], dayOfMonth:null,
      monthOfYear:null, endDate:null, endAfter:null}, t.recurrence?.pattern === v ? t.recurrence : {}) : null;
    if(t.recurrence) t.recurrence.pattern = v;
    touch(); redraw(); });
  const rn = p.querySelector('#pdRecN');
  if(rn) rn.oninput = debounce(function(){ if(t.recurrence) t.recurrence.interval = Math.max(1, parseInt(this.value, 10) || 1); touch(); }, 400);

  /* reminders */
  p.querySelectorAll('[data-pdrem]').forEach(b => b.onclick = () => {
    const v = b.dataset.pdrem, i = t.reminders.findIndex(r => r.type === v);
    i < 0 ? t.reminders.push({type:v}) : t.reminders.splice(i, 1);
    planSyncReminders(t); touch(); b.classList.toggle('on');
    if(i < 0 && typeof planAskNotifyPermission === 'function') planAskNotifyPermission(); });

  /* links */
  p.querySelectorAll('[data-pdlk]').forEach(b => b.onclick = () => {
    const [k, id] = b.dataset.pdlk.split(':'); const arr = t.links[k];
    const i = arr.indexOf(id); i < 0 ? arr.push(id) : arr.splice(i, 1);
    b.classList.toggle('on'); touch(); });
  p.querySelectorAll('[data-pdstream]').forEach(b => b.onclick = () => {
    t.streamId = t.streamId === b.dataset.pdstream ? null : b.dataset.pdstream;
    p.querySelectorAll('[data-pdstream]').forEach(x => x.classList.toggle('on', x.dataset.pdstream === t.streamId));
    touch(); });

  /* hand the task to the panel on Today rather than opening a timer here:
     one timer, in the room where the day is */
  p.querySelector('#pdFocus').onclick = () => { FocusTimer.setTask(t.id); closePanelTo('#/today'); };
  p.querySelector('#pdDup').onclick = () => {
    const c = newPlanTask(t.text + ' (copy)', t.day, JSON.parse(JSON.stringify({listId:t.listId, sectionId:t.sectionId,
      priority:t.priority, dueTime:t.dueTime, doDay:t.doDay, duration:t.duration, desc:t.desc, tags:t.tags,
      subtasks:t.subtasks, quadrant:t.quadrant, kanbanColumn:t.kanbanColumn, links:t.links})));
    c.subtasks.forEach(s => { s.id = uid(); s.isCompleted = false; s.completedAt = null; });
    S.tasks.push(c); saveNow(); closePanel(); sound('success'); rerender(); };
  p.querySelector('#pdDel').onclick = () => { closePanel();
    requestDelete({label:t.text || 'Task', after:planRedraw, remove: () => spliceOut(S.tasks, x => x.id === t.id)}); };
}

/* Repainting the whole page would close this panel. Only the workspace needs
   to change while a task is being edited, so only the workspace is redrawn. */
/* One task's name, written straight onto the rows that show it. It is the
   cheapest possible redraw and the only one typing needs: no layout is
   rebuilt, nothing loses focus, and the row reads right immediately. */
function planEchoTaskText(id, text){
  const said = String(text || '').trim() || 'Untitled task';
  let n = 0;
  try {
    document.querySelectorAll(`.task-text[data-topen="${CSS.escape(id)}"]`).forEach(el => {
      el.textContent = said; n++; });
    /* the planner's list row and the matrix card draw the same task their
       own way, and under their own class names */
    document.querySelectorAll(`[data-ptrow="${CSS.escape(id)}"] .pt-text,
      [data-ptcard="${CSS.escape(id)}"] .pk-text`).forEach(el => { el.textContent = said; n++; });
  } catch(e){}
  /* whatever the name could move — a search filter, a sort by name — is
     settled the next time the page is drawn rather than mid-word */
  planOweRedraw();
  return n;
}
/* A redraw the page is owed but is not going to be given while somebody is
   typing into the panel over it. Paid when the panel closes. */
let _planOwed = false;
function planOweRedraw(){ _planOwed = true; }
function planPayRedraw(){
  if(!_planOwed) return false;
  _planOwed = false;
  if(typeof rerender === 'function') rerender();
  return true;
}
function rerenderPlanBody(){
  /* a real redraw settles anything typing left owing */
  _planOwed = false;
  const main = $('#main'); if(!main) return;
  const keep = $('#panel');
  const y = window.scrollY;
  /* A task's detail panel is opened from Today as well as from Planning, and
     from the Content studio's own rows. This used to give up unless Planning
     was the page underneath, so an edit made from anywhere else wrote to
     state and changed nothing on screen until the page was reloaded by hand.
     Anywhere but Planning, redraw the page — keeping the open panel and where
     the page was scrolled to, which is the only reason this is not just
     rerender() everywhere. */
  if(parseHash().name !== 'planning' || (typeof focusDeskOn === 'function' && focusDeskOn())){
    rerender();
    if(keep && !$('#panel')) document.body.appendChild(keep);
    window.scrollTo({top:y});
    return;
  }
  /* the habits room is the whole page rather than a body inside a shell, so
     there is nothing partial to redraw there — redraw the page instead of
     returning and leaving a tick that changed nothing on screen */
  const body = $('#plBody');
  if(!body){ if(typeof planRoom === 'function' && planRoom() === 'habits'){ rerender(); scrollTo(0, y); } return; }
  const sel = planSel();
  let tasks = planSelectionTasks(sel);
  const p = planState();
  tasks = planSortTasks(tasks, p.prefs.sort, p.prefs.sortDir);
  const v = planView();
  const special = sel.kind === 'smart' && sel.id === 'stats';
  const shop = sel.kind === 'shop', remind = sel.kind === 'remind';
  body.innerHTML = special ? planStatsHTML()
    : shop ? planShopHTML(tasks)
    : remind ? planRemindHTML(tasks)
    : v === 'calendar' ? planCalendarHTML(tasks)
    : v === 'eisenhower' ? planMatrixHTML(tasks, sel)
    : planListViewHTML(sel, tasks);
  bindPlanning(main, sel, tasks);
  if(shop) bindPlanShop(main);
  if(remind) bindPlanRemind(main);
  if(typeof paintRemindFloat === 'function') paintRemindFloat();
  /* the top line's 🛒 count follows whatever the panel just changed */
  if(typeof planShopBadge === 'function') planShopBadge();
  if(keep && !$('#panel')) document.body.appendChild(keep);
  window.scrollTo({top:y});
}
