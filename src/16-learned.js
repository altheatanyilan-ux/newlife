/* ============================================================
   WHAT YOUR ESTIMATES TURN OUT TO BE

   An estimate of thirty minutes is a guess until there is a record of how the
   guesses went. Once there are ten sittings behind a list — or behind a
   category, when the list has too few — the margin on an estimate stops being
   a fixed quarter and becomes what your own finished tasks say: the middle
   ratio of time taken to time estimated, kept to what a margin can be (none
   to double). It is used by the sitting's countdown, by a block's length, by
   the day's capacity and by where a due task is suggested to go.

   Nothing here is hidden: the numbers are in Settings → The clock, with the
   count behind each one, and turning it off puts the fixed margin back.
   Reading is all it does; it changes no task and no estimate.
   ============================================================ */

const LEARN_MIN_SITTINGS = 10;
const LEARN_MIN_TASKS = 3;
let _lrnCache = null;
const learnedOn = () => { const p = planState().prefs || {}; return p.learnMargin !== false; };
function learnedReset(){ _lrnCache = null; }
const lrnMedian = a => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };

/* finished tasks with an estimate and time spent on them, with the number of
   sittings each one took — the evidence */
function learnedSamples(){
  const nBy = {};
  (planState().focusSessions || []).forEach(s => { if(s.type === 'focus' && s.taskId) nBy[s.taskId] = (nBy[s.taskId] || 0) + 1; });
  return (S.tasks || []).filter(t => t.done && nBy[t.id] && pbdEstOf(t) > 0 && (+t.focusTime || 0) > 0)
    .map(t => ({t, n: nBy[t.id], ratio: t.focusTime / pbdEstOf(t)}));
}
function learnedAll(){
  if(_lrnCache) return _lrnCache;
  const samples = learnedSamples(), byList = {}, byCat = {};
  samples.forEach(x => {
    const l = x.t.listId || 'inbox', c = x.t.timeCategory || '';
    (byList[l] = byList[l] || []).push(x);
    if(c) (byCat[c] = byCat[c] || []).push(x);
  });
  const fold = (groups, kind) => Object.keys(groups).map(k => { const g = groups[k], n = sum(g.map(x => x.n));
    return {kind, key: k, sittings: n, tasks: g.length, ratio: lrnMedian(g.map(x => x.ratio)), ready: n >= LEARN_MIN_SITTINGS && g.length >= LEARN_MIN_TASKS}; });
  _lrnCache = {lists: fold(byList, 'list'), cats: fold(byCat, 'category'), samples: samples.length};
  setTimeout(learnedReset, 0);
  return _lrnCache;
}
const lrnFrac = ratio => Math.min(1, Math.max(0, ratio - 1));
/* the margin for one task: its list's, else its category's, else nothing learned */
function learnedMargin(t){
  if(!t || !learnedOn()) return null;
  const all = learnedAll();
  const l = all.lists.find(x => x.key === (t.listId || 'inbox') && x.ready);
  if(l) return {frac: lrnFrac(l.ratio), ratio: l.ratio, n: l.sittings, from: 'list', key: l.key, label: `${Math.round(l.ratio * 100)}% of estimate over ${l.sittings} sittings on this list`};
  const c = t.timeCategory ? all.cats.find(x => x.key === t.timeCategory && x.ready) : null;
  if(c) return {frac: lrnFrac(c.ratio), ratio: c.ratio, n: c.sittings, from: 'category', key: c.key, label: `${Math.round(c.ratio * 100)}% of estimate over ${c.sittings} sittings in ${timeCategory(c.key).name}`};
  return null;
}
/* the margin, as a fraction, for a task (or the fixed one) — and where it came from */
const learnedFracFor = t => { const L = learnedMargin(t); return L ? L.frac : (typeof pbdMarginFrac === 'function' ? pbdMarginFrac() : 0.25); };

/* a line for the weekly review: how the week's estimates went */
function learnedAccuracyLine(from, to){
  const done = (S.tasks || []).filter(t => t.done && t.doneAt && String(t.doneAt).slice(0, 10) >= from && String(t.doneAt).slice(0, 10) <= to && pbdEstOf(t) > 0 && (+t.focusTime || 0) > 0);
  if(done.length < 3) return '';
  const r = done.map(t => t.focusTime / pbdEstOf(t)), within = r.filter(x => x >= 0.75 && x <= 1.25).length, med = lrnMedian(r);
  const tail = med > 1.1 ? `; the middle one ran ${Math.round((med - 1) * 100)}% over` : med < 0.9 ? `; the middle one came in ${Math.round((1 - med) * 100)}% under` : '';
  const prev = (() => { const d = daysBetween(from, to) + 1, pf = addDays(from, -d), pt = addDays(from, -1);
    const p = (S.tasks || []).filter(t => t.done && t.doneAt && String(t.doneAt).slice(0, 10) >= pf && String(t.doneAt).slice(0, 10) <= pt && pbdEstOf(t) > 0 && (+t.focusTime || 0) > 0);
    return p.length >= 3 ? p.filter(t => t.focusTime / pbdEstOf(t) >= 0.75 && t.focusTime / pbdEstOf(t) <= 1.25).length / p.length : null; })();
  const vs = prev == null ? '' : within / done.length > prev + 0.1 ? ', better than the week before' : within / done.length < prev - 0.1 ? ', less than the week before' : ', much as the week before';
  return `Planning accuracy: ${within} of ${done.length} finished tasks took within a quarter of their estimate${tail}${vs}.`;
}

/* ---------- Settings: what has been learned ---------- */
function learnedSettingsHTML(){
  const all = learnedAll(), rows = all.lists.concat(all.cats).sort((a, b) => b.sittings - a.sittings).slice(0, 12);
  const name = r => r.kind === 'list' ? ((typeof planList === 'function' && planList(r.key)) || {name: r.key === 'inbox' ? 'Inbox' : r.key}).name : timeCategory(r.key).name;
  return `<div class="opt" style="display:block"><div class="row between"><div><b>Margins your own sittings have set</b>
      <div class="d">Once ${LEARN_MIN_SITTINGS} sittings stand behind a list (or a category, with at least ${LEARN_MIN_TASKS} finished tasks), its margin is the middle ratio of time taken to time estimated, instead of the fixed ${fzMarginPct()}%. It is used for countdowns, for block lengths, for the day&rsquo;s capacity and for where a due task is suggested.</div></div>
      <label class="toggle ${learnedOn() ? 'on' : ''}" id="sLrnOn"><span class="sw"></span></label></div>
    ${rows.length ? `<div class="mono faint" style="font-size:.78rem;margin-top:8px">${rows.map(r => `${esc(r.kind)} “${esc(name(r))}”: ${Math.round(r.ratio * 100)}% of estimate, ${r.sittings} sitting${r.sittings === 1 ? '' : 's'} on ${r.tasks} task${r.tasks === 1 ? '' : 's'}${r.ready ? ` → margin ${Math.round(lrnFrac(r.ratio) * 100)}%` : ' — not enough yet'}`).join('<br>')}</div>`
      : '<div class="faint" style="margin-top:6px;font-size:.8rem">Nothing yet: finish tasks that carry an estimate and a sitting, and what they say will appear here.</div>'}</div>`;
}
function learnedSettingsBind(root){
  const t = (root || document).querySelector('#sLrnOn');
  if(t) t.onclick = () => { (planState().prefs = planState().prefs || {}).learnMargin = !learnedOn(); learnedReset(); saveNow(); t.classList.toggle('on', learnedOn()); };
}
