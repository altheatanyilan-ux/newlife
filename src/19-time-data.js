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
/* The five categories a room starts a clock on by itself. Renaming or
   recolouring one is nobody's business but yours; taking one away means those
   sittings arrive untagged, so the editor says which these are rather than
   refusing. */
const TIME_FED_BY_ROOM = {
  piano:      'Repertoire, when you practise a section',
  japanese:   'the Japanese studio, during a 4/3/2 sitting',
  meditation: 'the stillness timer',
  study:      'the study deck, during a review',
  tasks:      'the focus clock on a task'};
const TIME_ROUNDING = [1, 5, 15];
/* A timer left running overnight is not fourteen hours of piano. Past this,
   the entry is closed where it stopped being believable and says so. */
const TIME_RUNAWAY = 6 * 60;

function timeState(){
  if(!Array.isArray(S.timeEntries)) S.timeEntries = [];
  S.timeEntries.forEach(timeEntryDefaults);
  const t = S.time = S.time || {};
  /* ---------- the list is yours, not the app's ----------
     It used to be a fixed list with a place to append your own underneath,
     which meant the sixteen names the app happened to ship with were
     permanent and the ones you added were second-class. They are one list
     now, seeded from the shipped one the first time and afterwards entirely
     yours: rename, recolour, reorder, put away, throw out, start again.

     Putting one away is not the same as throwing it out. Months of entries
     point at these ids, and an id nothing can name any more turns a year of
     Tuesdays into "Untagged" — so a category that is off keeps naming its own
     past and only stops being offered for anything new. */
  if(!Array.isArray(t.cats)){
    t.cats = TIME_CATEGORIES.map(c => Object.assign({}, c));
    (Array.isArray(t.custom) ? t.custom : []).forEach(c => t.cats.push(Object.assign({}, c)));
  }
  t.custom = [];
  /* Pruned in place, and only when there is something to prune. Rebuilding
     the list with `filter` on every call looked harmless and was not: this
     runs on every read, so anything holding the list from one call was
     holding an array the next call had already replaced — and a splice into
     it vanished the moment anything else asked for the categories. */
  if(t.cats.some(c => !c || typeof c !== 'object'))
    t.cats = t.cats.filter(c => c && typeof c === 'object');
  t.cats.forEach(c => { c.id = c.id || uid();
    c.name = String(c.name || 'Something').trim().slice(0, 40) || 'Something';
    c.emoji = String(c.emoji || '\u25cb').trim().slice(0, 8) || '\u25cb';
    c.color = /^#[0-9a-fA-F]{3,8}$/.test(c.color || '') ? c.color : '#8a8d8f';
    c.off = !!c.off; });
  /* FILLED IN, NOT REPLACED. This used to be
        t.settings = Object.assign({…defaults}, t.settings || {});
     which builds a NEW object every time it is called — and it is called by
     timeSettings(), which every reader and every writer goes through. So
        timeSettings().widget = !timeSettings().widget
     evaluated the left side first, held that object, then called
     timeSettings() again for the right side, which replaced the settings
     with a fresh copy. The assignment landed on the copy that had just been
     thrown away, and the toggle silently did nothing. Keeping one object and
     filling in only the missing keys means a write goes where it is read. */
  t.settings = t.settings && typeof t.settings === 'object' ? t.settings : {};
  const timeDefaults = {
    defaultCategory: null,
    widget: true,               /* the pill, on every page */
    round: 1,                   /* say the minutes as they are */
    autoNods: true,             /* a sitting on a project is a nod on it */
    autoInteractions: true,     /* an hour with somebody is an hour with them */
    /* Whether walking into a room starts the clock by itself. On, because
       that is the point of it. Off for the days you are in the practice
       rooms to work on them rather than to practise — an afternoon of
       building the thing should not come back as an afternoon of playing,
       and deleting those entries one at a time afterwards is worse than
       not recording them. Starting the clock by hand still works. */
    autoTrack: true,
  };
  for(const k in timeDefaults)
    if(t.settings[k] === undefined) t.settings[k] = timeDefaults[k];
  t.settings.round = TIME_ROUNDING.includes(+t.settings.round) ? +t.settings.round : 1;
  return S.timeEntries;
}
const timeEntries = () => timeState();
/* what to offer for something new */
const timeCategories = () => timeState() && S.time.cats.filter(c => !c.off);
/* and what exists at all, which is what naming an old entry needs */
const timeAllCategories = () => timeState() && S.time.cats;
const timeCategory = id => timeAllCategories().find(c => c.id === id)
  || {id:null, name:'Untagged', emoji:'\u25cb', color:'#8a8d8f'};
/* how many entries would be left unnamed by throwing this one out */
const timeCategoryUsed = id => timeEntries().filter(e => e.categoryId === id).length;
function timeAddCategory(at){
  const c = {id: uid(), name:'Something', emoji:'\u25cb', color:'#8a8d8f', off:false};
  const list = timeAllCategories();
  if(at == null || at < 0 || at > list.length) list.push(c); else list.splice(at, 0, c);
  return c;
}
/* Moving one. The order is the order everything is drawn in — the picker, the
   day's bars, the week's report — so it is worth being able to put the four
   you actually use at the top. */
function timeMoveCategory(id, by){
  const list = timeAllCategories();
  const i = list.findIndex(c => c.id === id);
  const to = i + by;
  if(i < 0 || to < 0 || to >= list.length) return false;
  list.splice(to, 0, list.splice(i, 1)[0]);
  return true;
}
/* Throwing one out, and saying where its past goes. Entries are re-pointed
   rather than orphaned: null is untagged, an id moves them. */
function timeRemoveCategory(id, moveTo){
  const list = timeAllCategories();
  const i = list.findIndex(c => c.id === id);
  if(i < 0) return 0;
  const moved = timeEntries().filter(e => e.categoryId === id);
  moved.forEach(e => { e.categoryId = moveTo || null; });
  list.splice(i, 1);
  const st = timeSettings();
  if(st.defaultCategory === id) st.defaultCategory = moveTo || null;
  return moved.length;
}
/* Back to the list the app ships with, keeping anything of yours that is not
   one of them, and keeping every entry pointed where it was. */
function timeResetCategories(){
  const list = timeAllCategories();
  const mine = list.filter(c => !TIME_CATEGORIES.some(v => v.id === c.id));
  S.time.cats = TIME_CATEGORIES.map(c => Object.assign({}, c)).concat(mine);
  return S.time.cats.length;
}
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
/* Under a minute is not a sitting.

   A clock that can be started by pressing a pill, and that four rooms start
   by themselves when you open them, collects a great many entries of a few
   seconds: opened the wrong room, pressed the wrong thing, changed your
   mind. None of them is practice, and the day's totals never round down —
   anything that happened is shown as at least one step — so a five-second
   mistake arrives on the page looking exactly like a minute of work.

   So they are not kept. The entry is thrown away rather than written, and
   the one that was thrown away says so once on its way out, because a stop
   button that appears to do nothing is worse than a wrong record. */
const TIME_TOO_SHORT = 1;                              /* minutes */
function stopTimer(at){
  const e = timeRunning();
  if(!e) return null;
  e.endTime = at || new Date().toISOString();
  /* a timer stopped before it started is a clock somebody wound backwards */
  if(Date.parse(e.endTime) < Date.parse(e.startTime)) e.endTime = e.startTime;
  if(timeMinutes(e) < TIME_TOO_SHORT){
    removeTimeEntry(e.id);
    /* handed back so the room can say what happened, but no longer a record
       of anything: it is not in the store and nothing has been credited */
    return Object.assign({}, e, {dropped: true});
  }
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
  /* the same rule as the stop button: a sitting shorter than a minute is a
     mistake being written down, whether a clock or a hand wrote it */
  if(timeMinutes(e) < TIME_TOO_SHORT) return null;
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

/* ---------- the hours you were asleep ----------
   Sleep is not timed with a stopwatch; it is the wake and bed times you
   already write on Today. They were only ever drawn there, which left the
   Time page claiming a day was sixteen hours untracked when eight of them
   were accounted for perfectly well one page over.

   So they are read, not copied. A derived block cannot drift out of step with
   the record it comes from, and there is exactly one place to correct a wrong
   bedtime — the place you typed it. Nothing here writes a time entry. */
const TIME_SLEEP_CAT = {id:'__sleep', name:'Sleep', emoji:'☾', color:'#5a6a7a', derived:true};
/* ---------- a night, and a calendar day ----------
   These are two different things and conflating them is how the sleep figure
   came out wrong. A night runs from a bedtime to a waking and crosses
   midnight; a calendar day runs midnight to midnight and contains the tail
   of one night and the head of the next. Adding those two fragments together
   was giving a number that belonged to no night at all — and when the bed
   time was before midnight, the midnight-to-waking fragment silently assumed
   you had gone to sleep at twelve.

   The other thing worth writing down: a bedtime past midnight is recorded
   against the day whose evening it belongs to, not the calendar day it falls
   on. Going to bed at 01:40 on Tuesday morning is Monday's bedtime, because
   it is Monday you were still up. So a record's sleepTime is past midnight
   exactly when it is EARLIER than that same record's wakeTime, and that one
   test is what tells the two apart everywhere below. */
const timeRhythmOn = day => (S.dailyRhythm || {})[day] || null;
/* the bedtime on a record, and whether it fell after midnight */
function timeBedOn(day){
  const r = timeRhythmOn(day);
  if(!r) return null;
  const bed = hm2min(r.sleepTime), wake = hm2min(r.wakeTime);
  if(bed == null) return null;
  return {at: bed, past: wake != null && bed < wake};
}
const timeDayBefore = day => { const d = parseDay(day); d.setDate(d.getDate() - 1);
  return timeDayOf(d.toISOString()); };

/* How long you actually slept last night, where "last night" is the one that
   ended on this day's waking. Both times are yours; nothing is assumed. */
function timeSleepNight(day){
  const r = timeRhythmOn(day);
  const wake = r ? hm2min(r.wakeTime) : null;
  if(wake == null) return null;
  const bed = timeBedOn(timeDayBefore(day));
  if(!bed) return null;
  /* a bedtime past midnight is already on this calendar day; one before
     midnight is on the day before, so the night runs through midnight */
  const minutes = bed.past ? wake - bed.at : (1440 - bed.at) + wake;
  if(minutes <= 0 || minutes > 20 * 60) return null;   /* not a night */
  return {minutes, from: bed.at, to: wake, crossed: !bed.past};
}
/* And the parts of THIS calendar day you were asleep, which is a different
   question and the one the day strip is drawing. Two stretches at most: the
   tail of the night that ended this morning, and the head of the one that
   starts tonight. */
function timeSleepBlocks(day){
  const r = timeRhythmOn(day);
  if(!r) return [];
  const wake = hm2min(r.wakeTime);
  const out = [];
  if(wake != null){
    /* where the night that ended this morning began, as far as this day is
       concerned: midnight if the bedtime was before it, and the bedtime
       itself if it was after */
    const bed = timeBedOn(timeDayBefore(day));
    const from = bed && bed.past ? bed.at : 0;
    if(wake > from) out.push({from, to: wake, night: true});
  }
  /* and tonight, if it began before midnight. If it began after, it falls on
     tomorrow and is tomorrow's to draw. */
  const tonight = timeBedOn(day);
  if(tonight && !tonight.past && tonight.at < 1440) out.push({from: tonight.at, to: 1440, night: false});
  return out;
}
/* what was asleep inside this calendar day, which is what the untracked line
   has to subtract to mean the waking hours nobody accounted for */
const timeSleepInDay = day => sum(timeSleepBlocks(day).map(b => b.to - b.from));
/* kept under its old name, now meaning the night rather than the fragments */
const timeSleepMinutes = day => { const n = timeSleepNight(day); return n ? n.minutes : 0; };
/* whether there is anything to read at all, which decides whether the page
   says "you have not written a wake time down" or says nothing */
const timeSleepKnown = day => { const r = timeRhythmOn(day);
  return !!(r && (hm2min(r.wakeTime) != null || hm2min(r.sleepTime) != null)); };
const timeSleepSaidOn = day => { const r = (S.dailyRhythm || {})[day] || {};
  const bits = [];
  if(r.wakeTime) bits.push(`up at ${r.wakeTime}`);
  if(r.sleepTime) bits.push(`to bed at ${r.sleepTime}`);
  return bits.join(' · ');
};
