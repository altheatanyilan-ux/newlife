/* ============================================================
   PLANNING — the keyboard, and the three rooms this one feeds.
   ============================================================ */

/* Shortcuts only bite on the Planning page, and never while something is
   being typed into — a page that eats your "n" mid-sentence is worse than
   a page with no shortcuts at all. */
const PLAN_KEYS = {
  n:'add', f:'focus', t:'today', e:'edit', h:'habits', s:'stats',
  /* derived from PLAN_VIEWS so the number keys can never disagree with the
     order of the buttons they stand for */
  ...Object.fromEntries(PLAN_VIEWS.map((v, i) => [i + 1, v.id])),
};
function planTypingInto(el){
  if(!el) return false;
  if(el.isContentEditable) return true;
  return /^(input|textarea|select)$/i.test(el.tagName);
}
document.addEventListener('keydown', ev => {
  if(parseHash().name !== 'planning') return;
  /* ⌘K is the omni-search's, everywhere — see the note in the Content room:
     focusing a page's own field without stopping the event just means the
     palette opens over it. */
  if(ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if(planTypingInto(ev.target)) return;
  if($('#panel') && ev.key !== 'Escape') return;                 // the panel has its own keys
  const act = PLAN_KEYS[ev.key.toLowerCase()];
  if(!act) return;
  ev.preventDefault();
  if(act === 'add'){ const i = document.querySelector('.pq-input'); if(i){ i.focus(); } else openPlanTask(null); return; }
  if(act === 'focus')  return openFocusTimer(null);
  if(act === 'today')  return planSetSel('smart', 'today');
  if(act === 'habits') return planSetSel('smart', 'habits');
  if(act === 'stats')  return planSetSel('smart', 'stats');
  if(act === 'edit'){ const first = document.querySelector('.pt-row, .pk-card');
    if(first) openPlanTask(first.dataset.ptrow || first.dataset.ptcard); return; }
  planSetView(act);
}, true);

/* ---------- what the other rooms see ----------
   A task linked to a skill, a project or an income stream should be visible
   from there too, or the link is a one-way street and nobody trusts it. */
function planTasksFor(kind, id){
  return planOwnTasks().filter(t => kind === 'stream' ? t.streamId === id : (t.links?.[kind] || []).includes(id));
}
function planLinkedTasksHTML(kind, id, {heading = 'Tasks'} = {}){
  const ts = planSortTasks(planTasksFor(kind, id).filter(t => !t.done), 'dueDate');
  const done = planTasksFor(kind, id).filter(t => t.done).length;
  if(!ts.length && !done) return '';
  return `<section class="section rv"><div class="row between"><span class="sc" style="margin:0">${esc(heading)}</span>
      <a class="mono" href="#/planning" style="color:var(--muted)">open Planning →</a></div>
    <div class="pl-linked">${ts.map(t => `<a class="pl-lrow" href="#/planning">
      ${t.priority ? `<span class="pt-prio" style="background:${planPriority(t.priority).color}"></span>` : '<span class="pt-prio" style="background:var(--line-2)"></span>'}
      <span class="pl-ltext">${esc(t.text)}</span>
      ${t.day ? `<span class="mono${planIsLate(t) ? ' late' : ''}">${planIsLate(t) ? '⚠ ' : ''}${esc(fmtDate(t.day, 'short'))}</span>` : ''}
      ${t.focusTime ? `<span class="mono faint">${Math.round(t.focusTime / 60 * 10) / 10}h focused</span>` : ''}</a>`).join('')
      || '<div class="pk-empty">Nothing open.</div>'}</div>
    ${done ? `<div class="mono faint" style="margin-top:6px">${done} finished</div>` : ''}</section>`;
}
/* practice hours a skill earned from focus time logged on its tasks */
function planSkillFocusHours(skillId){
  const ids = new Set(planTasksFor('skills', skillId).map(t => t.id));
  return sum(planState().focusSessions.filter(s => s.type === 'focus' && ids.has(s.taskId)).map(s => s.duration)) / 60;
}
