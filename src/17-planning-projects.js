/* ============================================================
   LISTS AS PROJECTS.

   A project is a Planning list with the same id, in the Projects folder:
   its phases are the list's sections, and its tasks are ordinary Planning
   tasks (S.tasks, listId = the project, sectionId = the phase). So a
   project's work gets everything a task has — the matrix, do dates,
   reminders, time categories, the stopwatch, Today — and there is one
   task, not a copy in each room.

   The project record itself (status, priority, dates, resources, income,
   skills, notes, nods) stays in S.projects under the same id, and the
   Projects page stays as the slimmer view of it. Every reference in the
   house — links.projects on entries, nods, rehearsals, finance streams,
   time entries, the Writing Studio's links — keeps resolving, because no
   id changes and no file outside this one has to learn a new shape.

   THE MOVE is non-destructive and idempotent. The first time, a copy of
   S.projects and S.tasks is kept in S.projectsPremigration. Each phase's
   tasks are copied into S.tasks (a clashing id gets a new one, and the
   mapping is recorded on the task); the phase is then marked moved. Its
   original task array is left where it was, untouched, and simply no longer
   read. Nothing is deleted.
   ============================================================ */

const PROJECT_FOLDER_ID = 'projects';
function projectPhaseTasks(p, ph){
  if(!ph) return [];
  if(!ph.movedAt) return ph.tasks || [];
  return (S.tasks || []).filter(t => t.listId === p.id && t.sectionId === ph.id).sort((a, b) => (a.order || 0) - (b.order || 0));
}
/* tasks in the project's list with no phase (a phase that was deleted, or a task added in Planning) */
function projectLooseTasks(p){ return p.movedTo ? (S.tasks || []).filter(t => t.listId === p.id && !(p.phases || []).some(ph => ph.id === t.sectionId)) : []; }
function projectIsList(listId){ const l = typeof planList === 'function' ? planList(listId) : null; return !!(l && l.projectId); }

function projectListsSync(){
  if(!Array.isArray(S.projects) || typeof planState !== 'function') return 0;
  const P = planState(); S.tasks = Array.isArray(S.tasks) ? S.tasks : [];
  /* a copy of each project as it was, before its tasks move (and of the tasks, the first time) */
  const unmoved = S.projects.filter(p => !p.movedTo);
  if(unmoved.length){
    const snap = S.projectsPremigration = S.projectsPremigration || {at: new Date().toISOString(), projects: [], tasks: JSON.parse(JSON.stringify(S.tasks))};
    unmoved.forEach(p => { if(!snap.projects.some(x => x.id === p.id)) snap.projects.push(JSON.parse(JSON.stringify(p))); });
  }
  if(S.projects.length && !P.folders.some(f => f.id === PROJECT_FOLDER_ID)) P.folders.push({id: PROJECT_FOLDER_ID, name: 'Projects', sortOrder: -1, isCollapsed: false});
  const taskIds = new Set(S.tasks.map(t => t.id));
  let moved = 0;
  S.projects.forEach((p, pi) => {
    let l = P.lists.find(x => x.id === p.id);
    if(!l){
      l = {id: p.id, name: p.name || 'A project', color: (typeof PSTATUS === 'object' && PSTATUS[p.status] ? PSTATUS[p.status][2] : '#b08968'), folderId: PROJECT_FOLDER_ID,
        sortOrder: P.lists.length + pi, defaultView: typeof PLAN_VIEW_DEFAULT !== 'undefined' ? PLAN_VIEW_DEFAULT : 'list', kanbanColumns: typeof DEFAULT_KANBAN === 'function' ? DEFAULT_KANBAN() : [], sections: [], milestones: [], isDefault: false, createdAt: new Date().toISOString()};
      P.lists.push(l);
    }
    l.projectId = p.id;
    /* the name, both ways: whichever side changed since the last look wins */
    if(l.name !== p.name){ if(l._projName === p.name) p.name = l.name; else l.name = p.name; }
    l._projName = p.name;
    /* phases are the sections, in the same order and under the same ids */
    (p.phases || []).forEach((ph, i) => {
      let s = l.sections.find(x => x.id === ph.id);
      if(!s){ s = {id: ph.id, name: ph.name || `Phase ${i + 1}`, sortOrder: i, isCollapsed: false}; l.sections.push(s); }
      if(s.name !== ph.name){ if(s._phName === ph.name) ph.name = s.name; else s.name = ph.name; }
      s._phName = ph.name; s.phase = true; s.startDate = ph.startDate || ''; s.endDate = ph.endDate || ''; s.sortOrder = i;
      if(!ph.movedAt){
        (ph.tasks || []).forEach(t => {
          const already = S.tasks.find(x => x.fromProject && x.fromProject.projectId === p.id && x.fromProject.taskId === t.id);
          if(already) return;
          let id = t.id || uid(); if(taskIds.has(id)) id = uid();
          const task = Object.assign(newTask(t.text || '', (t.dueDate || t.day || '').slice(0, 10)), {id, done: !!t.done, doneAt: t.doneAt || (t.done ? (t.doneOn || null) : null),
            doDay: t.doDay || '', notes: t.notes || '', listId: p.id, sectionId: ph.id, order: Date.now() + moved,
            links: {projects: [p.id], skills: []}, fromProject: {projectId: p.id, phaseId: ph.id, taskId: t.id}});
          if(typeof planTaskDefaults === 'function') planTaskDefaults(task);
          S.tasks.push(task); taskIds.add(id); moved++;
        });
        ph.movedAt = new Date().toISOString(); ph.movedCount = (ph.tasks || []).length;
      }
    });
    /* a section whose phase is gone leaves; its tasks stay in the project, without a phase */
    const phaseIds = new Set((p.phases || []).map(ph => ph.id));
    l.sections.filter(s => s.phase && !phaseIds.has(s.id)).forEach(s => S.tasks.forEach(t => { if(t.listId === p.id && t.sectionId === s.id) t.sectionId = null; }));
    l.sections = l.sections.filter(s => !s.phase || phaseIds.has(s.id));
    /* and a section added in Planning becomes a phase */
    l.sections.filter(s => !s.phase).forEach(s => { p.phases.push({id: s.id, name: s.name, startDate: '', endDate: '', tasks: [], movedAt: new Date().toISOString()}); s.phase = true; s._phName = s.name; });
    if(!p.movedTo){ p.movedTo = p.id; p.movedAt = new Date().toISOString(); }
  });
  return moved;
}
/* an ordinary list becomes a project: a project record with the list's own id */
function planListMakeProject(listId){
  const l = planList(listId); if(!l || l.id === 'inbox' || l.projectId) return null;
  const now = new Date().toISOString();
  const p = {id: l.id, name: l.name, description: '', tags: [], status: 'active', priority: 'P3', startDate: today(), targetDate: '', phases: l.sections.map(s => ({id: s.id, name: s.name, startDate: '', endDate: '', tasks: [], movedAt: now})),
    resources: [], linkedSkills: [], linkedVisionEra: null, notes: '', link: '', income: {model: '', current: 0, target: 0, milestones: []}, createdAt: today(), movedTo: l.id, movedAt: now};
  S.projects.push(p); l.projectId = p.id; l._projName = p.name; l.folderId = PROJECT_FOLDER_ID;
  l.sections.forEach(s => { s.phase = true; s._phName = s.name; });
  projectListsSync(); saveNow();
  return p;
}
