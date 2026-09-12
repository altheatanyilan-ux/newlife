/* ============================================================
   PLANNING — the execution room.

   Today is where the day is set down and reflected on. Planning is
   where the work of it is actually moved. They are neighbours in the
   sidebar because a person moves between them all day.

   On sharing rather than duplicating
   ----------------------------------
   The house already had tasks (S.tasks, plus the tasks that live inside
   a project phase) and habits (S.habits, S.habitLog). None of that is
   replaced here. A task grows the fields this room needs and keeps the
   three it already had — text, day, done — so every existing reader
   (Today, Projects, People, Import) keeps working untouched. Habits are
   read and written where they already live, so ticking one here ticks
   the ring on Today, and the reverse.

   Everything new lives in S.planning rather than a localStorage key of
   its own, because S is what the export and the import carry: a key
   outside it would quietly not be in anybody's backup.
   ============================================================ */

const PLAN_PRIORITY = [
  {n:0, key:'none',   name:'None',   color:'',              short:''},
  {n:1, key:'low',    name:'Low',    color:'var(--sage)',   short:'low'},
  {n:2, key:'medium', name:'Medium', color:'var(--gold)',   short:'med'},
  {n:3, key:'high',   name:'High',   color:'var(--terra)',  short:'high'},
];
const planPriority = n => PLAN_PRIORITY[clamp(+n || 0, 0, 3)];

/* twelve warm colours that sit inside the house's own range */
const PLAN_COLORS = ['#b08968','#a0727e','#7f916a','#d4a44c','#6b7f8e','#8a7f9e',
                     '#c2452d','#4f9e70','#9a63ab','#d1743a','#4a8fa8','#a89f94'];

/* Today, tomorrow and the next seven days are one question asked over three
   spans, not three places to go — so they are one row with the span chosen on
   it. Inbox is gone from the sidebar: a list nobody filed anything into is not
   worth a permanent line, and the Inbox list itself is still in Lists below.
   Completed sits at the bottom because finished work is what you look at last. */
const PLAN_SMART_VIEWS = [
  {id:'inbox',    icon:'▫', name:'Inbox',       hint:'anything not yet filed'},
  {id:'today',    icon:'◉', name:'Today',       hint:'due today, and anything late'},
  {id:'tomorrow', icon:'◐', name:'Tomorrow',    hint:'what the next day already holds'},
  {id:'next7',    icon:'◇', name:'Next 7 days', hint:'the week in front of you'},
  {id:'all',      icon:'≡', name:'All',         hint:'every task, every list'},
  {id:'done',     icon:'✓', name:'Completed',   hint:'the last thirty days of finished work'},
];
/* the three spans the one dated row can be set to */
const PLAN_SPANS = ['today', 'tomorrow', 'next7'];
function planSpan(){
  const v = S._planSpan || planState().prefs.span;
  return PLAN_SPANS.includes(v) ? v : 'today';
}
function planSetSpan(id){
  if(!PLAN_SPANS.includes(id)) return;
  S._planSpan = id; planState().prefs.span = id;
  planSetSel('smart', id);
}
/* The matrix leads, and the page opens on it. A list answers "what is there";
   the matrix answers "what should I touch first", which is the question the
   page is for — and the number keys follow this order, so 1 is the matrix. */
const PLAN_VIEWS = [
  {id:'eisenhower', icon:'⊞', name:'Matrix'},
  {id:'list',       icon:'☰', name:'List'},
  {id:'calendar',   icon:'▦', name:'Calendar'},
  {id:'kanban',     icon:'▥', name:'Board'},
  {id:'timeline',   icon:'▬', name:'Timeline'},
];
const PLAN_VIEW_DEFAULT = 'eisenhower';
const PLAN_QUADRANTS = [
  {n:1, name:'Urgent & important', act:'Do first',  color:'var(--terra)'},
  {n:2, name:'Important',          act:'Schedule',  color:'var(--sage)'},
  {n:3, name:'Urgent',             act:'Delegate',  color:'var(--gold)'},
  {n:4, name:'Neither',            act:'Let go',    color:'var(--faint)'},
];
const DEFAULT_KANBAN = () => [
  {id:'todo',        name:'To do',       color:'#a89f94', wipLimit:null, sortOrder:0},
  {id:'in_progress', name:'In progress', color:'#d4a44c', wipLimit:5,    sortOrder:1},
  {id:'done',        name:'Done',        color:'#7f916a', wipLimit:null, sortOrder:2},
];

/* ---------- the task, grown ----------
   `text`, `day` and `done` are the old names and stay the canonical ones:
   renaming them would break four other rooms for no gain a reader could see. */
function planTaskDefaults(t){
  t.links   = t.links || {}; t.links.projects = t.links.projects || []; t.links.skills = t.links.skills || [];
  t.listId  = t.listId || 'inbox';
  t.sectionId = t.sectionId === undefined ? null : t.sectionId;
  t.priority  = clamp(+t.priority || 0, 0, 3);
  t.dueTime   = t.dueTime || '';
  t.startDate = t.startDate || '';
  t.duration  = t.duration == null ? null : +t.duration;
  t.desc      = t.desc || '';
  t.notes     = t.notes || '';
  t.tags      = Array.isArray(t.tags) ? t.tags : [];
  t.subtasks  = Array.isArray(t.subtasks) ? t.subtasks : [];
  t.reminders = Array.isArray(t.reminders) ? t.reminders : [];
  t.recurrence = t.recurrence || null;
  t.kanbanColumn = t.kanbanColumn || (t.done ? 'done' : 'todo');
  t.quadrant  = t.quadrant == null ? null : clamp(+t.quadrant, 1, 4);
  t.focusTime = +t.focusTime || 0;
  t.streamId  = t.streamId || null;
  t.updatedAt = t.updatedAt || t.createdAt || new Date().toISOString();
  if(t.order == null) t.order = Date.now();
  return t;
}
function newPlanTask(text = '', day = '', extra = {}){
  return planTaskDefaults(Object.assign(newTask(text, day), extra));
}

function planState(){
  if(!S.planning) S.planning = {};
  const p = S.planning;
  p.lists      = Array.isArray(p.lists) ? p.lists : [];
  p.folders    = Array.isArray(p.folders) ? p.folders : [];
  p.tags       = Array.isArray(p.tags) ? p.tags : [];
  p.smartLists = Array.isArray(p.smartLists) ? p.smartLists : [];
  p.focusSessions = Array.isArray(p.focusSessions) ? p.focusSessions : [];
  p.reminders  = Array.isArray(p.reminders) ? p.reminders : [];
  p.timer = Object.assign({focusDuration:25, shortBreak:5, longBreak:15, longBreakAfter:4,
    autoStartBreaks:true, autoStartFocus:false}, p.timer || {});
  p.prefs = Object.assign({view:PLAN_VIEW_DEFAULT, span:'today', sort:'dueDate', sortDir:'asc', showCompleted:false,
    group:'auto', sidebarCollapsed:false, lastView:'today', calMode:'month', tlScale:'week'}, p.prefs || {});
  if(!p.lists.some(l => l.id === 'inbox'))
    p.lists.unshift({id:'inbox', name:'Inbox', color:'#a89f94', folderId:null, sortOrder:-1,
      defaultView:PLAN_VIEW_DEFAULT, kanbanColumns:DEFAULT_KANBAN(), sections:[], isDefault:true, createdAt:new Date().toISOString()});
  p.lists.forEach((l, i) => {
    l.kanbanColumns = Array.isArray(l.kanbanColumns) && l.kanbanColumns.length ? l.kanbanColumns : DEFAULT_KANBAN();
    l.sections = Array.isArray(l.sections) ? l.sections : [];
    /* a list has dates of its own that are not tasks: the shipping date, the
       hearing, the day the deposit is due */
    l.milestones = Array.isArray(l.milestones) ? l.milestones : [];
    l.defaultView = l.defaultView || PLAN_VIEW_DEFAULT;
    if(l.sortOrder == null) l.sortOrder = i;
  });
  return p;
}
function migratePlanning(){
  migrateTasks();
  const p = planState();
  (S.tasks || []).forEach(planTaskDefaults);
  /* The matrix became the view this page opens on, but prefs.view was written
     the last time a view was picked — so without this the change never reaches
     anyone who already has the app. Once, and only over the old default: a
     view deliberately chosen since is left alone. */
  if(!p.prefs.matrixFirst){
    p.prefs.matrixFirst = true;
    if(p.prefs.view === 'list') p.prefs.view = PLAN_VIEW_DEFAULT;
  }
  /* a task pointing at a list that has since been deleted belongs in the Inbox,
     not in a list nobody can navigate to */
  const ids = new Set(p.lists.map(l => l.id));
  (S.tasks || []).forEach(t => { if(!ids.has(t.listId)) t.listId = 'inbox'; });
  /* habits gained a face and a colour for the Planning view; the ones already
     written down get one assigned rather than rendering blank */
  (S.habits || []).forEach((h, i) => {
    if(!h.icon)  h.icon  = ['◉','◐','◇','○','◈','◍','●','◎'][i % 8];
    if(!h.color) h.color = PLAN_COLORS[i % PLAN_COLORS.length];
  });
}

/* ---------- lists, folders, sections, tags ---------- */
function planLists(){ return planState().lists.slice().sort((a,b) => a.sortOrder - b.sortOrder); }
function planList(id){ return planState().lists.find(l => l.id === id) || null; }
function planListName(id){ return planList(id)?.name || 'Inbox'; }
function planListColor(id){ return planList(id)?.color || 'var(--faint)'; }
function planNewList(name, {folderId = null, color = null} = {}){
  const p = planState();
  const l = {id:uid(), name: name || 'New list', color: color || PLAN_COLORS[p.lists.length % PLAN_COLORS.length],
    folderId, sortOrder: p.lists.length, defaultView:PLAN_VIEW_DEFAULT, kanbanColumns:DEFAULT_KANBAN(), sections:[],
    isDefault:false, createdAt:new Date().toISOString()};
  l.milestones = [];
  p.lists.push(l); return l;
}
function planNewFolder(name){
  const p = planState();
  const f = {id:uid(), name: name || 'New folder', sortOrder:p.folders.length, isCollapsed:false};
  p.folders.push(f); return f;
}
function planTag(name){ return planState().tags.find(t => t.name.toLowerCase() === String(name).toLowerCase()) || null; }
function planTagColor(name){ return planTag(name)?.color || 'var(--faint)'; }
function planEnsureTag(name){
  const n = String(name || '').trim().replace(/^#/, ''); if(!n) return null;
  const found = planTag(n); if(found) return found;
  const p = planState();
  const t = {id:uid(), name:n, color:PLAN_COLORS[p.tags.length % PLAN_COLORS.length]};
  p.tags.push(t); return t;
}

/* ---------- reading the task list ----------
   Project-phase tasks are visible here too, read-only in the ways that would
   not survive a round trip: they keep their day and their done flag, which is
   all a phase task has. */
function planOwnTasks(){ return (S.tasks || []).map(planTaskDefaults); }
function planIsLate(t){ return t.day && !t.done && t.day < today(); }
function planDueWithin(t, from, to){ return t.day && t.day >= from && t.day <= to; }

function planSmartFilter(id){
  const T = today(), all = planOwnTasks();
  if(id === 'inbox')    return all.filter(t => !t.done && t.listId === 'inbox');
  if(id === 'today')    return all.filter(t => !t.done && t.day && t.day <= T);
  if(id === 'tomorrow') return all.filter(t => !t.done && t.day === addDays(T, 1));
  if(id === 'next7')    return all.filter(t => !t.done && planDueWithin(t, T, addDays(T, 7)));
  if(id === 'all')      return all.filter(t => !t.done);
  if(id === 'done')     return all.filter(t => t.done && (t.doneAt || '') >= addDays(T, -30));
  return all;
}
function planSmartCount(id){ return planSmartFilter(id).length; }
function planListCount(id){ return planOwnTasks().filter(t => !t.done && t.listId === id).length; }
function planFolderCount(id){
  const ids = new Set(planLists().filter(l => l.folderId === id).map(l => l.id));
  return planOwnTasks().filter(t => !t.done && ids.has(t.listId)).length;
}
/* Dropping one row on another rewrites the whole sequence rather than nudging
   two numbers — the same shape as reordering tasks in a day, for the same
   reason: it cannot drift. */
function planReorder(items, dragId, targetId, before){
  const from = items.findIndex(x => x.id === dragId);
  if(from < 0) return false;
  const moved = items.splice(from, 1)[0];
  let at = items.findIndex(x => x.id === targetId);
  if(at < 0) at = items.length; else if(!before) at += 1;
  items.splice(at, 0, moved);
  items.forEach((x, i) => { x.sortOrder = i; });
  saveNow();
  return true;
}
function planReorderFolders(dragId, targetId, before){
  const fs = planState().folders.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  if(!planReorder(fs, dragId, targetId, before)) return false;
  planState().folders = fs; saveNow(); return true;
}
function planReorderLists(dragId, targetId, before){
  const drag = planList(dragId), target = planList(targetId);
  if(!drag || !target) return false;
  /* dropping a list onto one in another folder moves it there too — the drop
     says where it belongs as well as where it sits */
  drag.folderId = target.folderId ?? null;
  const ls = planLists();
  if(!planReorder(ls, dragId, targetId, before)) return false;
  planState().lists = ls; saveNow(); return true;
}
/* ---------- dragging a task into place, in any view ----------
   Reordering by hand only means something if the view is willing to show a
   hand-made order, and Planning opens sorted by due date. So a drop says two
   things at once: this is where the task goes, and this arrangement is mine
   now. Rewriting `order` under a due-date sort would rearrange nothing on
   screen, and the drag would look broken — which is exactly the bug this is
   fixing on Today's side of the house.

   The sequence comes off the screen rather than being recomputed, because the
   screen is the thing being rearranged. Whatever the view groups by — a
   section, a board column, a quadrant, a day, a row of the timeline — the DOM
   already holds every task in the order it is being read in, so one function
   serves all five views and none of them has to describe its own shape.

   Everything on screen is renumbered, not just the group that was dropped
   into: numbers that only make sense within one column would collide the
   moment two columns were read as one list. */
function planReorderVisible(ids, dragId, targetId, before){
  const seq = ids.slice();
  const from = seq.indexOf(dragId);
  if(from < 0) return false;
  seq.splice(from, 1);
  let at = seq.indexOf(targetId);
  if(at < 0) at = seq.length; else if(!before) at += 1;
  seq.splice(at, 0, dragId);
  seq.forEach((id, i) => { const t = planTaskById(id); if(t) t.order = i; });
  const moved = planTaskById(dragId);
  if(moved) moved.updatedAt = new Date().toISOString();
  const p = planState();
  const wasSorted = p.prefs.sort !== 'custom';
  p.prefs.sort = 'custom'; p.prefs.sortDir = 'asc';
  saveNow();
  /* said once, when the sort actually changed under them, rather than on
     every drop */
  if(wasSorted) toast('Sorted by hand now — the sort menu says Manual.');
  return true;
}

function planTagCount(name){ return planOwnTasks().filter(t => !t.done && t.tags.includes(name)).length; }

/* one place decides what a selection means, so every view shows the same set */
function planSelectionTasks(sel){
  if(!sel) return [];
  if(sel.kind === 'smart') return planSmartFilter(sel.id);
  if(sel.kind === 'list')  return planOwnTasks().filter(t => t.listId === sel.id && (!t.done || planState().prefs.showCompleted));
  /* A folder holds lists, and its tasks are every task in any of them — the
     thing you actually want when a folder is a project or a client. */
  if(sel.kind === 'folder'){
    const ids = new Set(planLists().filter(l => l.folderId === sel.id).map(l => l.id));
    return planOwnTasks().filter(t => ids.has(t.listId) && (!t.done || planState().prefs.showCompleted));
  }
  if(sel.kind === 'tag')   return planOwnTasks().filter(t => t.tags.includes(sel.id) && !t.done);
  if(sel.kind === 'smartlist'){
    const sl = planState().smartLists.find(x => x.id === sel.id);
    return sl ? planApplySmartList(sl) : [];
  }
  return planSmartFilter('today');
}
/* the two rooms that are not a task list still need their name in the header */
const PLAN_EXTRA_TITLES = {habits:'Habits', stats:'Statistics'};
function planSelectionTitle(sel){
  if(!sel) return 'Today';
  if(sel.kind === 'smart') return (PLAN_SMART_VIEWS.find(v => v.id === sel.id) || {}).name
    || PLAN_EXTRA_TITLES[sel.id] || 'Tasks';
  if(sel.kind === 'list')  return planListName(sel.id);
  if(sel.kind === 'folder') return (planState().folders.find(f => f.id === sel.id) || {}).name || 'Folder';
  if(sel.kind === 'tag')   return '#' + sel.id;
  if(sel.kind === 'smartlist') return (planState().smartLists.find(x => x.id === sel.id) || {}).name || 'Filter';
  return 'Tasks';
}
function planApplySmartList(sl){
  const f = sl.filters || {}, T = today();
  return planOwnTasks().filter(t => {
    if(f.completion === 'active' && t.done) return false;
    if(f.completion === 'completed' && !t.done) return false;
    if(f.lists?.length && !f.lists.includes(t.listId)) return false;
    if(f.tags?.length && !f.tags.some(x => t.tags.includes(x))) return false;
    if(f.priorities?.length && !f.priorities.includes(t.priority)) return false;
    if(f.hasSubtasks === true && !t.subtasks.length) return false;
    if(f.hasSubtasks === false && t.subtasks.length) return false;
    if(f.search && !(t.text + ' ' + t.desc).toLowerCase().includes(f.search.toLowerCase())) return false;
    const d = f.dateRange;
    if(d === 'overdue'  && !planIsLate(t)) return false;
    if(d === 'today'    && t.day !== T) return false;
    if(d === 'tomorrow' && t.day !== addDays(T,1)) return false;
    if(d === 'next7days'&& !planDueWithin(t, T, addDays(T,7))) return false;
    if(d === 'noDate'   && t.day) return false;
    if(d && typeof d === 'object' && d.start && !planDueWithin(t, d.start, d.end || '9999-12-31')) return false;
    return true;
  });
}

/* ---------- milestones ----------
   A list runs towards dates that are not tasks: the day it ships, the hearing,
   the day the deposit is due. Those used to have to be written as tasks with
   no doing in them, which made the task list lie about how much work was left.

   They are kept on the list rather than on a task, because they outlive any
   particular task, and they are shown as a strip above whichever view is open
   — the shape of the run is the same question whether you are reading the
   matrix, the board or the calendar, so it should not be a view of its own. */
function planListMilestones(l){ return Array.isArray(l?.milestones) ? l.milestones : []; }
/* every milestone the current selection is about, each carrying its list, so
   a folder can show the dates of all the lists inside it at once */
function planMilestonesFor(sel){
  if(!sel) return [];
  let lists = [];
  if(sel.kind === 'list'){ const l = planList(sel.id); if(l) lists = [l]; }
  else if(sel.kind === 'folder') lists = planLists().filter(l => l.folderId === sel.id);
  return lists.flatMap(l => planListMilestones(l).map(m => ({m, list: l})))
    .sort((a, b) => (a.m.date || '9999-12-31').localeCompare(b.m.date || '9999-12-31'));
}
function planMilestoneList(sel){
  if(sel?.kind === 'list') return planList(sel.id);
  if(sel?.kind === 'folder'){ const ls = planLists().filter(l => l.folderId === sel.id); return ls[0] || null; }
  return null;
}
function planFindMilestone(id){
  for(const l of planState().lists){
    const m = planListMilestones(l).find(x => x.id === id);
    if(m) return {m, list: l};
  }
  return null;
}
function planAddMilestone(listId, {name = '', date = ''} = {}){
  const l = planList(listId); if(!l) return null;
  if(!Array.isArray(l.milestones)) l.milestones = [];
  const m = {id: uid(), name: name || 'A date that matters', date: date || addDays(today(), 14),
    done: false, note: '', createdAt: new Date().toISOString()};
  l.milestones.push(m); saveNow(); return m;
}
function planDeleteMilestone(id){
  const hit = planFindMilestone(id); if(!hit) return null;
  return spliceOut(hit.list.milestones, x => x.id === id);
}

/* ---------- sorting ---------- */
const PLAN_SORTS = [['dueDate','Due date'],['priority','Priority'],['title','Title'],['createdAt','Date added'],['custom','Manual']];
function planSortTasks(list, by, dir = 'asc'){
  const sign = dir === 'desc' ? -1 : 1;
  const far = '9999-12-31';                       // no date sorts last, whichever way
  const out = list.slice().sort((a, b) => {
    if(by === 'priority') return (b.priority - a.priority) * sign || (a.day || far).localeCompare(b.day || far);
    if(by === 'title')    return a.text.localeCompare(b.text) * sign;
    if(by === 'createdAt')return (a.createdAt || '').localeCompare(b.createdAt || '') * sign;
    if(by === 'custom')   return ((a.order || 0) - (b.order || 0)) * sign;
    const d = (a.day || far).localeCompare(b.day || far);
    return (d || (a.day && b.day ? (a.dueTime || '99:99').localeCompare(b.dueTime || '99:99') : 0)
             || b.priority - a.priority) * sign;
  });
  /* whatever the order, finished work sinks */
  return out.sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0));
}

/* ---------- recurrence ----------
   "after_completion" counts from the day it was actually done, which is the
   whole point for a task like getting a haircut: the clock starts when you
   sat in the chair, not when you meant to. */
function planNextDue(t){
  const r = t.recurrence; if(!r || !r.pattern) return null;
  const base = r.pattern === 'after_completion' ? today() : (t.day || today());
  const n = Math.max(1, +r.interval || 1);
  let next;
  if(r.pattern === 'daily' || r.pattern === 'after_completion') next = addDays(base, n);
  else if(r.pattern === 'weekly'){
    if(r.daysOfWeek?.length){
      let d = addDays(base, 1);
      for(let i = 0; i < 14; i++){ if(r.daysOfWeek.includes(parseDay(d).getDay())) break; d = addDays(d, 1); }
      next = d;
    } else next = addDays(base, 7 * n);
  }
  else if(r.pattern === 'monthly'){ const d = parseDay(base); d.setMonth(d.getMonth() + n); next = isoDay(d); }
  else if(r.pattern === 'yearly'){ const d = parseDay(base); d.setFullYear(d.getFullYear() + n); next = isoDay(d); }
  else next = addDays(base, n);
  if(r.endDate && next > r.endDate) return null;
  return next;
}
/* completing a repeat does not end it: it books the next one */
function planRollRecurrence(t){
  const next = planNextDue(t); if(!next) return null;
  const r = t.recurrence;
  if(r.endAfter != null){ r.endAfter -= 1; if(r.endAfter <= 0) return null; }
  const copy = newPlanTask(t.text, next, {
    listId:t.listId, sectionId:t.sectionId, priority:t.priority, dueTime:t.dueTime,
    duration:t.duration, desc:t.desc, tags:t.tags.slice(),
    subtasks:t.subtasks.map(s => ({...s, id:uid(), isCompleted:false, completedAt:null})),
    reminders:t.reminders.map(x => ({...x})), recurrence:JSON.parse(JSON.stringify(r)),
    kanbanColumn:'todo', quadrant:t.quadrant, links:JSON.parse(JSON.stringify(t.links)), streamId:t.streamId,
  });
  t.recurrence = null;                             // the finished one is no longer the repeater
  S.tasks.push(copy);
  return copy;
}
function planSetDone(t, done){
  t.done = !!done; t.doneAt = done ? today() : null; t.updatedAt = new Date().toISOString();
  if(done) t.kanbanColumn = 'done';
  else if(t.kanbanColumn === 'done') t.kanbanColumn = 'todo';
  const rolled = done ? planRollRecurrence(t) : null;
  saveNow();
  return rolled;
}
function planSubProgress(t){
  const n = t.subtasks.length; if(!n) return null;
  return {done: t.subtasks.filter(s => s.isCompleted).length, total: n};
}
