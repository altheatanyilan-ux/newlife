/* ============================================================
   PRESENCE — when the house was open, and when you were actually in it

   The analysis export needs facts the rest of the house never wrote down: what
   time you first opened it each day, how long it stayed open, how much of that
   you were at the keyboard, and how much of it was after the hour you said the
   day ends. So a beat is taken every minute while the page is visible. A run of
   beats is one sitting; a gap of twenty minutes starts another. A beat counts
   as "active" only if there was a key, a click or a scroll in the three minutes
   before it.

   Kept in S.accountability.presence[calendarDate] = [{s, e, act}] with s and e
   as local "YYYY-MM-DDTHH:MM" and act as active minutes. A sitting is cut at
   midnight (a new day starts a new list). This is on whether or not the record
   keeper is — it is data, not a rule — and it started on the date in
   S.accountability.presenceSince: days before that have no presence at all,
   which the export says rather than showing as zero.
   ============================================================ */
const prStamp = (d = new Date()) => `${isoDay(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
let _prInput = Date.now();
['keydown', 'pointerdown', 'wheel', 'touchstart'].forEach(ev => window.addEventListener(ev, () => { _prInput = Date.now(); }, {passive: true, capture: true}));
function presenceBeat(){
  if(document.hidden || typeof S === 'undefined' || !S || !S.settings) return;
  const a = rkState(), now = new Date(), day = isoDay(now), st = prStamp(now);
  if(!a.presenceSince) a.presenceSince = day;
  const list = a.presence[day] = a.presence[day] || [];
  let cur = list[list.length - 1];
  const gap = cur ? (now - new Date(cur.e)) / 60000 : 99;
  if(!cur || gap > 20){ cur = {s: st, e: st, act: 0}; list.push(cur); }
  cur.e = st; if(Date.now() - _prInput < 180000) cur.act++;
  const keys = Object.keys(a.presence);
  if(keys.length > 800) keys.sort().slice(0, keys.length - 800).forEach(k => delete a.presence[k]);
  save();
}
/* minutes of a sitting that fall inside [lo, hi) of its own day */
const prOverlap = (s, e, lo, hi) => Math.max(0, Math.min(e, hi) - Math.max(s, lo));
function presenceDay(d){
  const a = rkState(), list = a.presence[d] || [];
  if(!a.presenceSince || d < a.presenceSince) return null;
  const c = rkCutoff(); let open = 0, act = 0, late = 0, lastLate = '';
  list.forEach(x => { const s = hm2min(x.s.slice(11)), e = hm2min(x.e.slice(11)); if(s == null || e == null) return;
    open += Math.max(1, e - s); act += x.act || 0;
    const l = prOverlap(s, e, 0, 360) + prOverlap(s, e, c, 1440); late += l; if(l) lastLate = x.e.slice(11); });
  return {first: list.length ? list[0].s.slice(11) : '', last: list.length ? list[list.length - 1].e.slice(11) : '', sittings: list.length, openMin: open, activeMin: act, lateMin: late, lastLate};
}
setInterval(presenceBeat, 60000);
document.addEventListener('visibilitychange', () => { if(!document.hidden) setTimeout(presenceBeat, 800); });
setTimeout(presenceBeat, 2500);
