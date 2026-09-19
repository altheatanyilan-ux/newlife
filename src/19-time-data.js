/* ============================================================
   WHERE THE TIME WENT.

   The house was full of clocks that did not talk to each other: the stillness
   timer, the writing session, the practice log at the score, the pomodoro on
   the planning page. Each one knew about its own quarter of an hour and
   nothing else, so the question nobody could answer was the only one worth
   asking — where did today actually go?

   So: one clock, which any room can start and which anybody can start for
   anything at all, including the two hours on a bus that belong to no room.

   Three decisions are worth writing down, because the obvious version of each
   is wrong in a way that only shows up after a month of use.

   A RUNNING TIMER IS A ROW WITH NO END ON IT. The obvious model keeps the
   running timer beside the entries — an id and a started-at, pointing at the
   row. Two places holding one fact drift: close the tab mid-sitting, or let
   the save fail halfway, and the pointer and the row disagree about whether
   anything is running. One row whose endTime is null is the timer, and
   finding it is a scan of one field.

   THE LENGTH IS THE TWO TIMES, NOT A THIRD NUMBER. A stored duration beside a
   start and an end is a fact that can contradict the other two, and it does
   the first time anybody corrects a start time. It is derived, always. A
   manual entry given as "two hours" gets an end time computed from it, so
   even then the two times are what is kept.

   AND ROUNDING IS A WAY OF SAYING, NOT A WAY OF STORING. Rounding to the
   quarter hour on the way in destroys the real times and cannot be undone.
   It happens where the number is shown.
   ============================================================ */

/* The categories time comes in. Emoji rather than icons because this list is
   read at a glance in a bar chart, and colour off the house's own palette so
   a day's timeline looks like the rest of the place rather than like a
   spreadsheet. */
const TIME_CATEGORIES = [
  {id:'piano',      name:'Piano',            emoji:'🎹', color:'#6b7f8e'},
  {id:'japanese',   name:'Japanese',         emoji:'日',        color:'#c4484e'},
  {id:'meditation', name:'Meditation',       emoji:'🧘', color:'#7f916a'},
  {id:'writing',    name:'Writing',          emoji:'✍️',  color:'#a0727e'},
  {id:'reading',    name:'Reading',          emoji:'📖', color:'#8a7560'},
  {id:'exercise',   name:'Exercise',         emoji:'💪', color:'#7f916a'},
  {id:'work',       name:'Work',             emoji:'💼', color:'#6b7f8e'},
  {id:'social',     name:'Social',           emoji:'👥', color:'#a0727e'},
  {id:'spiritual',  name:'Spiritual',        emoji:'🔮', color:'#8060a0'},
  {id:'study',      name:'Study',            emoji:'📚', color:'#b08968'},
  {id:'creative',   name:'Creative',         emoji:'🎨', color:'#c47832'},
  {id:'errands',    name:'Errands',          emoji:'📋', color:'#8a8d8f'},
  {id:'commute',    name:'Commute',          emoji:'🚌', color:'#6b7f8e'},
  {id:'meal',       name:'Meal',             emoji:'🍽', color:'#8a7560'},
  {id:'rest',       name:'Rest',             emoji:'😴', color:'#5a6a5a'},
  {id:'tasks',      name:'Tasks',            emoji:'✓',       color:'#8a8d8f'},
];
/* The kinds of thing an entry can be hung on. A label is kept beside the id
   so a day can be drawn without going and looking up five other stores — and
   so a deleted project leaves a readable entry behind rather than a blank. */
const TIME_LINKS = ['score','vision','project','person','skill','task','deck','journal'];
const TIME_ROUNDING = [1, 5, 15];
/* A timer left running overnight is not fourteen hours of piano. Past this,
   the entry is closed where it stopped being believable and says so. */
const TIME_RUNAWAY = 6 * 60;

function timeState(){
  if(!Array.isArray(S.timeEntries)) S.timeEntries = [];
  S.timeEntries.forEach(timeEntryDefaults);
  const t = S.time = S.time || {};
  t.custom = Array.isArray(t.custom) ? t.custom : [];
  t.custom.forEach(c => { c.id = c.id || uid(); c.name = c.name || 'Something';
    c.emoji = c.emoji || '⚙️'; c.color = c.color || '#8a8d8f'; });
  t.settings = Object.assign({
    defaultCategory: null,
    widget: true,               /* the pill, on every page */
    round: 1,                   /* say the minutes as they are */
    autoNods: true,             /* a sitting on a project is a nod on it */
    autoInteractions: true,     /* an hour with somebody is an hour with them */
  }, t.settings || {});
  t.settings.round = TIME_ROUNDING.includes(+t.settings.round) ? +t.settings.round : 1;
  return S.timeEntries;
}
const timeEntries = () => timeState();
const timeCategories = () => timeState() && TIME_CATEGORIES.concat(S.time.custom);
const timeCategory = id => timeCategories().find(c => c.id === id)
  || {id:null, name:'Untagged', emoji:'○', color:'#8a8d8f'};
const timeSettings = () => timeState() && S.time.settings;

function timeEntryDefaults(e){
  e.id = e.id || uid();
  e.what = e.what || '';
  e.startTime = e.startTime || new Date().toISOString();
  e.endTime = e.endTime || null;
  e.categoryId = e.categoryId || null;
  e.tags = Array.isArray(e.tags) ? e.tags.filter(Boolean) : [];
  e.linkedType = TIME_LINKS.includes(e.linkedType) ? e.linkedType : null;
  e.linkedId = e.linkedId || null;
  e.linkedLabel = e.linkedLabel || '';
  e.source = ['timer','manual','auto'].includes(e.source) ? e.source : 'timer';
  e.feature = e.feature || null;
  e.notes = Array.isArray(e.notes) ? e.notes : [];
  e.createdAt = e.createdAt || e.startTime;
  return e;
}

/* ---------- reading the clock ---------- */
/* Minutes, from the two times. An entry still running is measured to now, so
   the number on the widget climbs without anything being written. */
function timeMinutes(e, now){
  if(!e || !e.startTime) return 0;
  const a = Date.parse(e.startTime);
  const b = e.endTime ? Date.parse(e.endTime) : (now || Date.now());
  if(!isFinite(a) || !isFinite(b)) return 0;
  return Math.max(0, (b - a) / 60000);
}
/* said the way the settings ask for it, and never rounded on the way in */
/* Up to the step, never down to nothing. Rounding to the nearest quarter
   turns seven minutes into "0m", which is not a rounder way of saying seven
   minutes — it is the room telling you that you did not practise. Anything
   that happened is at least one step. */
function timeSaid(mins, round){
  const r = round || timeSettings().round;
  const m = Math.max(0, mins);
  if(!m) return fmtHM(0);
  return fmtHM(r > 1 ? Math.ceil(m / r) * r : Math.round(m) || 1);
}
/* the clock on the widget, which wants seconds */
function timeClockSaid(e, now){
  const secs = Math.max(0, Math.floor(timeMinutes(e, now) * 60));
  const h = Math.floor(secs / 3600), m = Math.floor(secs / 60) % 60, s = secs % 60;
  const pad = n => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
/* Which local day an entry belongs to. Stored in UTC and bucketed in local
   time, because "yesterday" is a thing that happened where you were. */
function timeDayOf(iso){
  const d = new Date(iso);
  if(isNaN(d)) return null;
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
const timeRunning = () => timeEntries().find(e => !e.endTime) || null;
const timeOnDay = day => timeEntries().filter(e => timeDayOf(e.startTime) === day);
function timeBetween(from, to){
  return timeEntries().filter(e => { const d = timeDayOf(e.startTime);
    return d && d >= from && d <= to; });
}
const timeMinutesOn = day => sum(timeOnDay(day).map(e => timeMinutes(e)));

/* ---------- starting and stopping ---------- */
/* Starting while something is already running stops that first: two clocks
   running at once is two answers to "what am I doing", and the whole point of
   this is that there is one. */
function startTimer(fields){
  timeState();
  const was = timeRunning();
  if(was) stopTimer();
  const e = timeEntryDefaults(Object.assign({id:uid(), startTime:new Date().toISOString(),
    endTime:null, source:'timer'}, fields || {}));
  if(!e.categoryId) e.categoryId = timeSettings().defaultCategory || null;
  S.timeEntries.push(e);
  saveNow();
  return e;
}
function stopTimer(at){
  const e = timeRunning();
  if(!e) return null;
  e.endTime = at || new Date().toISOString();
  /* a timer stopped before it started is a clock somebody wound backwards */
  if(Date.parse(e.endTime) < Date.parse(e.startTime)) e.endTime = e.startTime;
  timeAfterSave(e);
  saveNow();
  return e;
}
/* A note put on the running entry while it runs — "moved to the coda at
   forty-five minutes" — which is the thing you would otherwise lose. */
function noteOnTimer(text){
  const e = timeRunning();
  if(!e || !String(text || '').trim()) return null;
  e.notes.push({at:new Date().toISOString(), text:String(text).trim()});
  saveNow();
  return e;
}
/* Logging something after the fact. Either two times or a length — whichever
   is given, what is stored is two times. */
function logTime(fields){
  timeState();
  const f = fields || {};
  let start = f.startTime, end = f.endTime;
  if(!start) start = new Date().toISOString();
  if(!end){
    const mins = Math.max(0, +f.minutes || 0);
    end = new Date(Date.parse(start) + mins * 60000).toISOString();
  }
  const e = timeEntryDefaults(Object.assign({}, f, {id:uid(), startTime:start, endTime:end,
    source: f.source || 'manual'}));
  delete e.minutes;
  S.timeEntries.push(e);
  timeAfterSave(e);
  saveNow();
  return e;
}
function removeTimeEntry(id){
  const gone = spliceOut(timeState(), e => e.id === id);
  saveNow();
  return gone;
}
/* Two ISO times out of a day and a clock face, which is what a form gives. */
function timeAtOn(day, hhmm){
  const [h, m] = String(hhmm || '').split(':').map(Number);
  const d = parseDay(day);
  d.setHours(isFinite(h) ? h : 0, isFinite(m) ? m : 0, 0, 0);
  return d.toISOString();
}
const timeClockOf = iso => { const d = new Date(iso);
  return isNaN(d) ? '' : `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };

/* ---------- a timer somebody forgot ----------
   Found on the next load rather than policed by a timer of its own: a clock
   that fires while the tab is shut is a clock that does not fire. */
function closeRunawayTimer(){
  const e = timeRunning();
  if(!e) return null;
  const mins = timeMinutes(e);
  if(mins <= TIME_RUNAWAY) return null;
  e.endTime = new Date(Date.parse(e.startTime) + TIME_RUNAWAY * 60000).toISOString();
  e.notes.push({at:new Date().toISOString(),
    text:`Left running — closed at ${fmtHM(TIME_RUNAWAY)}. Correct it if that is wrong.`});
  timeAfterSave(e);
  saveNow();
  return e;
}
