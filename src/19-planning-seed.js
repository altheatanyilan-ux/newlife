/* ============================================================
   PLANNING — the room, already furnished.

   A planning app opened on nothing teaches nobody anything: you cannot
   see what a board is for until there are cards on it. So the room
   arrives with lists, folders, tags and a fortnight of plausible work
   in it — all of it ordinary and all of it deletable, like the rest of
   the starter set.
   ============================================================ */
const PLAN_SEEDED = 'starter';

function planSeedIfEmpty(){
  const p = planState();
  if(p.seeded) return;
  if((S.tasks || []).length > 3) { p.seeded = PLAN_SEEDED; return; }   // never on top of real work
  const T = today(), inD = n => addDays(T, n);

  [['Life', 0], ['Work & learning', 1]].forEach(([n, o]) => {
    const f = planNewFolder(n); f.sortOrder = o; });
  const [fLife, fWork] = p.folders;
  const mk = (name, color, folder, sections = []) => {
    const l = planNewList(name, {folderId: folder ? folder.id : null, color});
    sections.forEach((sn, i) => l.sections.push({id:uid(), name:sn, sortOrder:i, isCollapsed:false}));
    return l;
  };
  const work  = mk('Work',        '#6b7f8e', fWork, ['Active matters', 'Admin', 'Follow-ups']);
  const learn = mk('Learning',    '#4f9e70', fWork, ['Japanese', 'Reading']);
  const home  = mk('Personal',    '#b08968', fLife);
  const body  = mk('Health',      '#a0727e', fLife);
  const japan = mk('Japan',       '#9a63ab', fLife);

  [['urgent','#c2452d'], ['idea','#d4a44c'], ['waiting','#a89f94'], ['goal','#7f916a'], ['call','#6b7f8e']]
    .forEach(([n, c]) => { const t = planEnsureTag(n); if(t) t.color = c; });

  const add = (text, o = {}) => { const t = newPlanTask(text, o.day || '', o); S.tasks.push(t); return t; };
  const sec = (l, name) => (l.sections.find(s => s.name === name) || {}).id || null;

  add('Sort the old notes into this house', {listId:'inbox', priority:2});
  add('Find the JET Programme deadlines', {listId:'inbox', day:inD(12), priority:3, tags:['goal']});

  add('Review the Smith amendments', {listId:work.id, sectionId:sec(work,'Active matters'), day:inD(1), priority:3, duration:120});
  add('Reply to opposing counsel', {listId:work.id, sectionId:sec(work,'Follow-ups'), day:T, priority:2, duration:20, tags:['waiting']});
  add('File the quarterly compliance report', {listId:work.id, sectionId:sec(work,'Admin'), day:inD(6), priority:1, duration:45});
  const brief = add('Brief for Monday’s hearing', {listId:work.id, sectionId:sec(work,'Active matters'), day:inD(3), priority:3, duration:240, quadrant:1});
  ['Read the precedents', 'Outline the argument', 'Take it to the supervisor', 'File the final'].forEach((s, i) =>
    brief.subtasks.push({id:uid(), title:s, isCompleted:i === 0, completedAt:i === 0 ? new Date().toISOString() : null, sortOrder:i}));

  add('Genki chapter 12', {listId:learn.id, sectionId:sec(learn,'Japanese'), day:T, priority:2, duration:45,
    recurrence:{pattern:'daily', interval:1, daysOfWeek:[], endDate:null, endAfter:null}, quadrant:2});
  add('Thirty pages', {listId:learn.id, sectionId:sec(learn,'Reading'), day:T, priority:1, duration:30,
    recurrence:{pattern:'daily', interval:1, daysOfWeek:[], endDate:null, endAfter:null}});
  add('One drama episode, no subtitles', {listId:learn.id, sectionId:sec(learn,'Japanese'), day:inD(4), priority:1, duration:45,
    recurrence:{pattern:'weekly', interval:1, daysOfWeek:[6], endDate:null, endAfter:null}});

  add('Call home', {listId:home.id, day:inD((7 - parseDay(T).getDay()) % 7 || 7), priority:2, duration:30, tags:['call'],
    recurrence:{pattern:'weekly', interval:1, daysOfWeek:[0], endDate:null, endAfter:null}, quadrant:2});
  add('Cook for the week', {listId:home.id, day:inD((6 - parseDay(T).getDay() + 7) % 7 || 7), priority:1, duration:90});
  add('Clear the desk, and the desktop', {listId:home.id, priority:1, quadrant:4});

  add('Run — five kilometres', {listId:body.id, day:T, priority:2, duration:35,
    recurrence:{pattern:'weekly', interval:1, daysOfWeek:[1,2,3,4,5], endDate:null, endAfter:null}, quadrant:2});
  add('Book the dentist', {listId:body.id, day:inD(24), priority:1, tags:['call'], quadrant:3});

  add('Price a Tokyo flat, by neighbourhood', {listId:japan.id, priority:2, tags:['goal'], quadrant:2});
  add('Gather the N2 materials', {listId:japan.id, day:inD(30), priority:3, tags:['goal'], duration:60});
  const stmt = add('Outline the JET statement', {listId:japan.id, day:inD(14), priority:3, tags:['goal'], quadrant:2, duration:120});
  ['Find the through-line', 'A first draft, badly', 'Show it to someone', 'Rewrite it properly'].forEach((s, i) =>
    stmt.subtasks.push({id:uid(), title:s, isCompleted:false, completedAt:null, sortOrder:i}));

  /* one finished yesterday, so the statistics have something to stand on */
  const done = add('Set this house up', {listId:'inbox', day:addDays(T, -1), priority:3, focusTime:75});
  done.done = true; done.doneAt = addDays(T, -1); done.kanbanColumn = 'done';
  [25, 25, 25].forEach((d, i) => p.focusSessions.push({id:uid(), taskId:done.id,
    startedAt:new Date(Date.parse(addDays(T, -1) + 'T09:00:00') + i * 1800000).toISOString(),
    endedAt:new Date(Date.parse(addDays(T, -1) + 'T09:25:00') + i * 1800000).toISOString(),
    duration:d, type:'focus', completed:true}));

  (S.tasks || []).forEach(planSyncReminders);
  p.seeded = PLAN_SEEDED;
  saveNow();
}
