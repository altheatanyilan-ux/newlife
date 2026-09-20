/* ============================================================
   WHAT THE CLOCK FEEDS.

   A time tracker that only fills its own dashboard is a second set of books.
   The point of one clock is that an hour is logged once and shows up wherever
   that hour matters: on the skill, on the project, in the record of who you
   saw. So an entry, once it has an end on it, is pushed outward.

   The hard part is not the pushing, it is the pushing again. An entry can be
   edited — a wrong end time, a category changed, a link added a week later —
   and every edit runs this again. If it creates a new nod each time, a month
   of tidying up leaves a project with forty nods for four sittings. So every
   derived row is remembered by the entry that made it, and the second pass
   updates that row rather than adding another. The same goes for the skill
   hours: what is credited is the difference between what this entry has
   already put on the skill and what it is worth now, so correcting an entry
   from two hours to one takes an hour back off rather than adding one more.
   ============================================================ */
function timeAfterSave(e){
  if(!e || !e.endTime) return e;      /* nothing is derived from a clock still running */
  try { timeCreditSkill(e); } catch(err){ console.warn('skill credit skipped', err); }
  try { timeMakeNod(e); } catch(err){ console.warn('nod skipped', err); }
  try { timeMakeInteraction(e); } catch(err){ console.warn('interaction skipped', err); }
  return e;
}
/* The hours on a skill, kept as a difference. `e.creditedHours` is what this
   entry has already added; anything else double-counts every correction. */
function timeCreditSkill(e){
  if(e.linkedType !== 'skill' || !e.linkedId) return null;
  const sk = byId(S.skills || [], e.linkedId);
  if(!sk) return null;
  const want = +(timeMinutes(e) / 60).toFixed(2);
  const had = +e.creditedHours || 0;
  if(Math.abs(want - had) < 0.005) return sk;
  sk.hours = Math.max(0, +(((+sk.hours || 0) + want - had).toFixed(2)));
  sk.lastPracticed = timeDayOf(e.startTime) || today();
  e.creditedHours = want;
  return sk;
}
/* A sitting on a project is a nod on it — the atomic unit of creative work
   this house already counts. Written once and thereafter corrected. */
function timeMakeNod(e){
  if(e.linkedType !== 'project' || !e.linkedId || !timeSettings().autoNods) return null;
  if(!Array.isArray(S.nods)) S.nods = [];
  let nod = e.nodId ? byId(S.nods, e.nodId) : null;
  const fields = {projectId: e.linkedId, text: e.what || 'a sitting',
    duration: Math.round(timeMinutes(e)), date: timeDayOf(e.startTime) || today(),
    fromTime: e.id};
  if(nod){ Object.assign(nod, fields); return nod; }
  nod = Object.assign({id:uid(), link:'', image:null, energy:null}, fields);
  S.nods.push(nod);
  e.nodId = nod.id;
  return nod;
}
/* And an hour with somebody is an hour with them. */
function timeMakeInteraction(e){
  if(e.linkedType !== 'person' || !e.linkedId || !timeSettings().autoInteractions) return null;
  if(!Array.isArray(S.interactions)) S.interactions = [];
  let it = e.interactionId ? byId(S.interactions, e.interactionId) : null;
  const fields = {personId: e.linkedId, date: timeDayOf(e.startTime) || today(),
    description: e.what || '', duration: Math.round(timeMinutes(e)), fromTime: e.id};
  if(it){ Object.assign(it, fields); return it; }
  it = Object.assign({id:uid(), type:'met_in_person', mood:null, energy:'', quality:'',
    followUp:null, followUpDone:false}, fields);
  S.interactions.push(it);
  const p = byId(S.people || [], e.linkedId);
  if(p) p.lastInteraction = fields.date;
  e.interactionId = it.id;
  return it;
}

/* ---------- hanging an entry on something ----------
   The label is stored beside the id so a day can be drawn without going and
   looking up five other stores, and so deleting a project leaves a readable
   entry behind instead of a blank. */
const TIME_LINK_SOURCES = {
  score:   () => (S.scores || []).map(x => [x.id, x.title]),
  project: () => (S.projects || []).filter(p => p.status !== 'archived').map(p => [p.id, p.name]),
  person:  () => (S.people || []).map(p => [p.id, p.name]),
  skill:   () => (S.skills || []).filter(s => !s.archived).map(s => [s.id, s.name]),
  vision:  () => (S.visions || []).map(v => [v.id, v.title || v.name || 'a vision']),
  task:    () => (S.tasks || []).filter(t => !t.done).slice(0, 200).map(t => [t.id, t.title]),
  deck:    () => (S.study && S.study.decks || []).map(d => [d.id, d.name]),
  journal: () => [],
};
const timeLinkName = k => ({score:'a score', project:'a project', person:'a person',
  skill:'a skill', vision:'a vision', task:'a task', deck:'a deck', journal:'the record'})[k] || k;
function timeLinkPickHTML(e){
  const type = e && e.linkedType || '';
  const kinds = TIME_LINKS.filter(k => (TIME_LINK_SOURCES[k] ? TIME_LINK_SOURCES[k]() : []).length);
  if(!kinds.length) return '';
  return `<div class="row" style="gap:10px;margin-top:10px">
    <label class="pd-q" style="flex:1"><span class="k">hang it on</span>
      <select class="sel" id="tlType"><option value="">— nothing —</option>${kinds.map(k =>
        `<option value="${k}" ${type === k ? 'selected' : ''}>${esc(timeLinkName(k))}</option>`).join('')}</select></label>
    <label class="pd-q" style="flex:1"><span class="k">which</span>
      <select class="sel" id="tlId">${timeLinkOptionsHTML(type, e && e.linkedId)}</select></label>
  </div>`;
}
function timeLinkOptionsHTML(type, id){
  const list = (TIME_LINK_SOURCES[type] ? TIME_LINK_SOURCES[type]() : []);
  return `<option value="">—</option>${list.map(([k, label]) =>
    `<option value="${esc(k)}" ${k === id ? 'selected' : ''}>${esc(label || k)}</option>`).join('')}`;
}
function timeLinkValue(m){
  const t = m.querySelector('#tlType'), i = m.querySelector('#tlId');
  if(!t || !i || !t.value || !i.value) return {type:null, id:null, label:''};
  return {type: t.value, id: i.value,
    label: (i.selectedOptions[0] && i.selectedOptions[0].textContent || '').trim()};
}
/* the second list follows the first, which is the only reason this needs a
   binder of its own */
function bindTimeLinkPick(m){
  const t = m.querySelector('#tlType'), i = m.querySelector('#tlId');
  if(!t || !i) return;
  t.onchange = () => { i.innerHTML = timeLinkOptionsHTML(t.value, null); };
}

/* ---------- a room asking for the clock ----------
   Starting a session in a room starts the clock, tagged to what the room
   knows. But only when nothing is already running: if you started the clock
   by hand before walking into the room, that is the timing you meant, and a
   second timer would count the same hour twice. */
function timeAutoStart(fields){
  timeState();
  if(timeRunning()) return null;
  const f = Object.assign({source:'auto'}, fields || {});
  /* The category a room asks for is one you can rename, put away or throw
     out, and the room does not know that. If the one it named is gone, the
     sitting still gets counted — under whatever you chose as the default, or
     untagged — rather than being filed under an id nothing can name. */
  if(f.categoryId && !timeAllCategories().some(c => c.id === f.categoryId))
    f.categoryId = timeSettings().defaultCategory || null;
  const e = startTimer(f);
  paintTimeDock();
  return e;
}
/* And a room finishing stops the clock only if the clock is the one it
   started. A hand-started timer is nobody else's to stop. */
function timeAutoStop(feature){
  const e = timeRunning();
  if(!e || e.source !== 'auto' || (feature && e.feature !== feature)) return null;
  const done = stopTimer();
  paintTimeDock();
  return done;
}
/* A habit made of minutes. Answered rather than recorded: the day's tracked
   time in that category either reaches the number or it does not, so the
   habit follows the hours instead of needing to be ticked beside them — and
   a correction to an entry takes the day back, which a tick could not. */
function timeHabitMet(h, day){
  if(!h || !h.timeCat || !(+h.timeMins > 0)) return false;
  if(!Array.isArray(S.timeEntries) || !S.timeEntries.length) return false;
  const mins = sum(timeOnDay(day).filter(e => e.categoryId === h.timeCat).map(e => timeMinutes(e)));
  return mins >= +h.timeMins;
}
/* how far along it is, for a ring that fills rather than a box that ticks */
function timeHabitShare(h, day){
  if(!h || !h.timeCat || !(+h.timeMins > 0)) return null;
  const mins = sum(timeOnDay(day).filter(e => e.categoryId === h.timeCat).map(e => timeMinutes(e)));
  return Math.min(1, mins / +h.timeMins);
}

/* What the Today page says in one line, and what the weekly review says in
   three. Both silent for somebody who has never started the clock: a summary
   that invents a line about a room you have never been in is a summary you
   stop reading. */
function timeTodaySay(){
  const rows = timeOnDay(today());
  if(!rows.length) return '';
  const by = timeByCategory(rows).slice(0, 4);
  return `${by.map(b => `${b.cat.emoji} ${timeSaid(b.minutes)}`).join(' · ')}
    · ${timeSaid(sum(rows.map(timeMinutes)))} in all`;
}
function timeReviewLines(from, to){
  timeState();
  const rows = timeBetween(from, to);
  if(!rows.length) return [];
  const out = [];
  const mins = sum(rows.map(timeMinutes));
  const by = timeByCategory(rows);
  out.push(`${timeSaid(mins)} tracked${by[0] ? `, most of it on ${by[0].cat.name.toLowerCase()}` : ''}.`);
  /* the same span again, a week earlier — "more or less than last week" is the
     only comparison anybody actually makes */
  const span = daysBetween(from, to) + 1;
  const back = d => { const q = parseDay(d); q.setDate(q.getDate() - span); return timeDayOf(q.toISOString()); };
  const prev = timeBetween(back(from), back(to));
  if(prev.length){
    const was = sum(prev.map(timeMinutes));
    const diff = mins - was;
    if(Math.abs(diff) >= 30) out.push(`${timeSaid(Math.abs(diff))} ${diff > 0 ? 'more' : 'less'} than the week before.`);
  }
  /* where the time went against what you said matters, which is the one
     comparison this house is in a position to make */
  const top = (S.values || []).slice(0, 3).map(v => (v.name || '').toLowerCase());
  const thin = by.filter(b => b.minutes / mins < 0.05)
    .find(b => top.some(n => n && b.cat.name.toLowerCase().includes(n)));
  if(thin) out.push(`${thin.cat.name} is near the top of your values and under a twentieth of your tracked time.`);
  return out;
}
