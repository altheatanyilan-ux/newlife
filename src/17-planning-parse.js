/* ============================================================
   QUICK ADD — a sentence, read as a task.

   "Prepare contract review tomorrow at 2pm #work !high ^Work ~2h"

   Everything is done with regexes and a word list. No model, no
   network: it has to work on a plane, and it has to be the same
   answer every time. The tokens it removes are removed from the
   title, so what is left reads as a title and nothing else.
   ============================================================ */

const NLP_DOW = {sunday:0, sun:0, monday:1, mon:1, tuesday:2, tue:2, tues:2, wednesday:3, wed:3,
  thursday:4, thu:4, thur:4, thurs:4, friday:5, fri:5, saturday:6, sat:6};
const NLP_MONTHS = {jan:0, january:0, feb:1, february:1, mar:2, march:2, apr:3, april:3, may:4,
  jun:5, june:5, jul:6, july:6, aug:7, august:7, sep:8, sept:8, september:8, oct:9, october:9,
  nov:10, november:10, dec:11, december:11};
const NLP_TIME_WORDS = {morning:'09:00', noon:'12:00', midday:'12:00', afternoon:'14:00',
  evening:'18:00', night:'21:00', midnight:'23:59'};

/* the next date on or after tomorrow whose weekday is `dow` */
function nlpNextDow(dow, fromToday = false){
  let d = addDays(today(), fromToday ? 0 : 1);
  for(let i = 0; i < 8; i++){ if(parseDay(d).getDay() === dow) return d; d = addDays(d, 1); }
  return d;
}
const nlpPad = n => String(n).padStart(2, '0');

function parseQuickTask(raw){
  let s = ' ' + String(raw || '') + ' ';
  const out = {text:'', day:'', dueTime:'', priority:0, tags:[], listId:null, listName:null,
    duration:null, recurrence:null, desc:'', matched:[]};
  const eat = (re, fn) => { s = s.replace(re, (...m) => { const keep = fn(...m); out.matched.push(m[0].trim()); return keep === undefined ? ' ' : keep; }); };

  /* description after a slash — taken first, so nothing inside it is parsed */
  const slash = s.indexOf(' / ');
  if(slash > -1){ out.desc = s.slice(slash + 3).trim(); s = s.slice(0, slash) + ' '; }

  /* !priority */
  eat(/\s!(high|h|med|medium|m|low|l|none|0|1|2|3)\b/i, (_, w) => {
    const k = w.toLowerCase();
    out.priority = /^(high|h|3)$/.test(k) ? 3 : /^(med|medium|m|2)$/.test(k) ? 2 : /^(low|l|1)$/.test(k) ? 1 : 0;
  });
  /* ^list — quoted for names with a space */
  eat(/\s\^"([^"]+)"/, (_, n) => { out.listName = n.trim(); });
  eat(/\s\^([\w-]+)/, (_, n) => { out.listName = n.trim(); });
  /* #tag */
  eat(/\s#([\w-]+)/g, (_, n) => { out.tags.push(n); });
  /* ~duration */
  eat(/\s~(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)?\b/i, (_, n, u) => {
    const v = parseFloat(n); const hours = /^h/i.test(u || 'm');
    out.duration = Math.round(hours ? v * 60 : v);
  });
  /* *recurrence */
  eat(/\s\*every\s+(\d+)\s*(day|days|week|weeks|month|months|year|years)\b/i, (_, n, u) => {
    out.recurrence = {pattern: u.replace(/s$/, '') + 'ly', interval:+n, daysOfWeek:[], endDate:null, endAfter:null};
    if(out.recurrence.pattern === 'dayly') out.recurrence.pattern = 'daily';
  });
  eat(/\s\*(daily|weekly|monthly|yearly|weekdays)\b/i, (_, w) => {
    const k = w.toLowerCase();
    out.recurrence = k === 'weekdays'
      ? {pattern:'weekly', interval:1, daysOfWeek:[1,2,3,4,5], endDate:null, endAfter:null}
      : {pattern:k, interval:1, daysOfWeek:[], endDate:null, endAfter:null};
  });

  /* --- time, before dates, so "at 3" is not eaten as a day number --- */
  eat(/\s(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i, (_, h, m, ap) => {
    let hh = +h % 12; if(/pm/i.test(ap)) hh += 12;
    out.dueTime = `${nlpPad(hh)}:${m || '00'}`;
  });
  if(!out.dueTime) eat(/\sat\s+(\d{1,2}):(\d{2})\b/, (_, h, m) => { out.dueTime = `${nlpPad(+h)}:${m}`; });
  if(!out.dueTime) eat(new RegExp(`\\s(${Object.keys(NLP_TIME_WORDS).join('|')})\\b`, 'i'),
    (_, w) => { out.dueTime = NLP_TIME_WORDS[w.toLowerCase()]; });

  /* --- dates --- */
  const setDay = d => { if(!out.day) out.day = d; };
  eat(/\s(today|tonight)\b/i,      () => setDay(today()));
  eat(/\s(tomorrow|tmr|tmw)\b/i,   () => setDay(addDays(today(), 1)));
  eat(/\sday\s+after\s+tomorrow\b/i, () => setDay(addDays(today(), 2)));
  eat(/\snext\s+week\b/i,          () => setDay(addDays(today(), 7)));
  eat(/\snext\s+month\b/i,         () => { const d = parseDay(today()); d.setMonth(d.getMonth() + 1); setDay(isoDay(d)); });
  eat(/\sin\s+(\d+)\s*(day|days|week|weeks|month|months)\b/i, (_, n, u) => {
    const k = +n; if(/^d/i.test(u)) setDay(addDays(today(), k));
    else if(/^w/i.test(u)) setDay(addDays(today(), k * 7));
    else { const d = parseDay(today()); d.setMonth(d.getMonth() + k); setDay(isoDay(d)); }
  });
  eat(new RegExp(`\\s(?:on\\s+)?(next\\s+|this\\s+)?(${Object.keys(NLP_DOW).join('|')})\\b`, 'i'),
    (_, mod, w) => setDay(nlpNextDow(NLP_DOW[w.toLowerCase()], /this/i.test(mod || ''))));
  /* an explicit date: 2026-01-15, 15/1, Jan 15, 15 Jan */
  eat(/\s(\d{4})-(\d{2})-(\d{2})\b/, (_, y, m, d) => setDay(`${y}-${m}-${d}`));
  eat(new RegExp(`\\s(${Object.keys(NLP_MONTHS).join('|')})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i'),
    (_, mo, d) => setDay(nlpYmd(NLP_MONTHS[mo.toLowerCase()], +d)));
  eat(new RegExp(`\\s(\\d{1,2})(?:st|nd|rd|th)?\\s+(${Object.keys(NLP_MONTHS).join('|')})\\.?\\b`, 'i'),
    (_, d, mo) => setDay(nlpYmd(NLP_MONTHS[mo.toLowerCase()], +d)));

  out.text = s.replace(/\s+/g, ' ').trim();
  /* a sentence that was nothing but tokens still needs a name */
  if(!out.text && out.matched.length) out.text = 'Untitled task';
  if(out.dueTime && !out.day) out.day = today();   // a time without a day means today
  return out;
}
/* a bare month and day means the next time that date comes round */
function nlpYmd(monthIdx, dayNum){
  const now = parseDay(today());
  let y = now.getFullYear();
  let d = new Date(y, monthIdx, dayNum);
  if(isoDay(d) < today()) d = new Date(y + 1, monthIdx, dayNum);
  return isoDay(d);
}

/* what the parser understood, shown back before it is committed */
function quickParsePreviewHTML(p){
  if(!p || (!p.text && !p.matched.length)) return '';
  const bits = [];
  bits.push(`<span class="qp-title">${esc(p.text || 'Untitled task')}</span>`);
  if(p.day) bits.push(`<span class="qp-chip" style="--c:var(--terra)">${esc(fmtDate(p.day,'med'))}${p.dueTime ? ' · ' + esc(p.dueTime) : ''}</span>`);
  if(p.priority) bits.push(`<span class="qp-chip" style="--c:${planPriority(p.priority).color}">${planPriority(p.priority).name.toLowerCase()}</span>`);
  if(p.listName) bits.push(`<span class="qp-chip" style="--c:var(--sage)">${esc(p.listName)}</span>`);
  p.tags.forEach(t => bits.push(`<span class="qp-chip" style="--c:${planTagColor(t)}">#${esc(t)}</span>`));
  if(p.duration) bits.push(`<span class="qp-chip mono">${p.duration >= 60 ? (p.duration/60).toFixed(p.duration%60?1:0)+'h' : p.duration+'m'}</span>`);
  if(p.recurrence) bits.push(`<span class="qp-chip" style="--c:var(--ment)">repeats ${esc(p.recurrence.pattern)}</span>`);
  if(p.desc) bits.push(`<span class="qp-chip faint">+ note</span>`);
  return `<div class="qp-preview">${bits.join('')}</div>`;
}

/* turn a parsed sentence into a real task in the right place */
function commitQuickTask(raw, ctx = {}){
  const p = parseQuickTask(raw);
  if(!p.text) return null;
  let listId = ctx.listId || 'inbox';
  if(p.listName){
    const hit = planLists().find(l => l.name.toLowerCase() === p.listName.toLowerCase())
             || planLists().find(l => l.name.toLowerCase().startsWith(p.listName.toLowerCase()));
    listId = hit ? hit.id : planNewList(p.listName).id;
  }
  p.tags.forEach(planEnsureTag);
  const t = newPlanTask(p.text, p.day || ctx.day || '', {
    listId, sectionId: ctx.sectionId || null, priority:p.priority, dueTime:p.dueTime,
    duration:p.duration, desc:p.desc, tags:p.tags, recurrence:p.recurrence,
    quadrant: ctx.quadrant || null, kanbanColumn: ctx.kanbanColumn || 'todo',
  });
  S.tasks.push(t); planSyncReminders(t); saveNow();
  return t;
}
