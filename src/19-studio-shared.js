/* ============================================================
   THE STUDIOS, TOGETHER — what the Jazz Studio and the Songwriting Studio
   share, and nothing else.

   They stay two rooms: #/jazz and #/songwriting keep their own pages,
   headers, routes and state (S.jazz, S.songwriting). This file holds only
   the traffic between them — links, hand-offs, small shared components —
   so that it is written once, the way the Chord-Scale Map is (it lives in
   19-sng-c-theory.js and both rooms read it).

   THE RULES THIS FILE KEEPS
   - Rule-based, local, no model. Every suggestion says what it measured.
   - Suggestions, not locks. Nothing here gates, advances or blocks; every
     card is advisory and dismissible.
   - Additive. S.studio is one small meta row; a missing row means defaults.
     It holds preferences and dismissals, never content.
   - By reference. A hand-off carries an id (a song, a seed, a tune, an
     exercise) and the target room resolves it; nothing is saved until the
     person presses Save or Keep in the room they arrived in.
   - Names are studio* / STUDIO_*. Rooms call in; this file reaches back
     only at run time, never while it loads.
   ============================================================ */

/* ---------- the little state ---------- */
const STUDIO_VERSION = 1;
const STUDIO_ROOMS = {
  jazz:        {name: 'Jazz',        route: '#/jazz'},
  songwriting: {name: 'Songwriting', route: '#/songwriting'}};
function studioState(){
  if(!S.studio || typeof S.studio !== 'object') S.studio = {};
  const st = S.studio;
  st.v = Math.max(+st.v || 0, STUDIO_VERSION);
  st.bar = Object.assign({collapsed: false}, st.bar && typeof st.bar === 'object' ? st.bar : {});
  if(!st.bridgesDismissed || typeof st.bridgesDismissed !== 'object') st.bridgesDismissed = {};
  if(typeof st.practiceToWriting !== 'boolean') st.practiceToWriting = false;
  if(typeof st.vocalRangeNoticeSeen !== 'boolean') st.vocalRangeNoticeSeen = false;
  return st;
}
const studioOther = room => room === 'jazz' ? 'songwriting' : 'jazz';

/* ---------- hand-offs: a link, and what the other end reads ----------
   studioLink('#/jazz/playalong', 'lab')  →  #/jazz/playalong?from=songwriting&ref=lab
   The reference is one of:
     lab                         the Chord Lab's last progression
     song:<songId>               a song on the Song Desk
     seed:<seedId>               a seed in the Seedbank
     tune:<tuneId>[:<a>-<b>]     a Real Book tune, optionally bars a to b
     exercise:<exerciseId>[:<key>]   a Jazz exercise, in a key */
function studioLink(route, ref, from){
  const r = String(route || '').replace(/^#?\/?/, '#/');
  const f = from || (typeof parseHash === 'function' ? parseHash().name : '');
  const q = [];
  if(f) q.push('from=' + encodeURIComponent(f));
  if(ref) q.push('ref=' + encodeURIComponent(ref));
  return r + (q.length ? '?' + q.join('&') : '');
}
/* the pieces of a reference; never throws, and a reference it cannot read comes back with ok:false */
function studioParseRef(ref){
  const s = String(ref == null ? '' : ref).trim();
  if(!s) return {ok: false, kind: '', raw: s};
  if(s === 'lab') return {ok: true, kind: 'lab', raw: s};
  const m = /^(song|seed|tune|exercise):([^:]+)(?::(.*))?$/.exec(s);
  if(!m) return {ok: false, kind: '', raw: s};
  const out = {ok: true, kind: m[1], id: m[2], raw: s};
  if(m[1] === 'tune'){
    if(m[3] != null){ const b = /^(\d+)-(\d+)$/.exec(m[3]); if(!b) return {ok: false, kind: m[1], raw: s};
      out.start = Math.min(+b[1], +b[2]); out.end = Math.max(+b[1], +b[2]); }
  } else if(m[1] === 'exercise'){ if(m[3]) out.key = m[3]; }
  else if(m[3] != null) return {ok: false, kind: m[1], raw: s};
  return out;
}
/* what the address of the page in front of us carries */
function studioReadHandoff(){
  const q = (typeof parseHash === 'function' ? parseHash().query : null) || {};
  if(!q.ref && !q.from) return null;
  const ref = studioParseRef(q.ref);
  return Object.assign({from: q.from || '', query: q}, ref);
}
/* resolve a reference against the data it names → {ok, what, data} */
function studioResolveRef(ref){
  const r = typeof ref === 'string' ? studioParseRef(ref) : ref;
  if(!r || !r.ok) return {ok: false, why: 'That link could not be read.'};
  if(r.kind === 'lab'){
    const L = typeof sngState === 'function' ? sngState().lab : null;
    return L && Array.isArray(L.prog) && L.prog.length ? {ok: true, kind: 'lab', data: L} : {ok: false, why: 'The Chord Lab has no progression yet.'};
  }
  if(r.kind === 'song'){
    const s = typeof sngState === 'function' ? sngState().songs.find(x => x.id === r.id) : null;
    return s ? {ok: true, kind: 'song', data: s} : {ok: false, why: 'That song is no longer on the Song Desk.'};
  }
  if(r.kind === 'seed'){
    const s = typeof sngState === 'function' ? sngState().seeds.find(x => x.id === r.id) : null;
    return s ? {ok: true, kind: 'seed', data: s} : {ok: false, why: 'That seed is no longer in the Seedbank.'};
  }
  if(r.kind === 'tune'){
    const t = typeof jazzTune === 'function' ? jazzTune(r.id) : null;
    return t ? {ok: true, kind: 'tune', data: t} : {ok: false, why: 'That tune is not in the library.'};
  }
  if(r.kind === 'exercise'){
    const e = typeof jazzExercise === 'function' ? jazzExercise(r.id) : null;
    return e ? {ok: true, kind: 'exercise', data: e} : {ok: false, why: 'That exercise is not in the curriculum.'};
  }
  return {ok: false, why: 'That link could not be read.'};
}
/* a line at the top of the target page: where this came from, a way back,
   or — when the reference no longer resolves — a calm word and the page as usual */
function studioHandoffHTML(h){
  h = h || studioReadHandoff();
  if(!h) return '';
  const room = STUDIO_ROOMS[h.from];
  const res = h.ok ? studioResolveRef(h) : {ok: false, why: 'That link could not be read.'};
  if(!res.ok) return `<div class="studio-hand miss" role="status"><span>${esc(res.why)} The page is open as usual.</span></div>`;
  const what = {lab: 'your Chord Lab progression', song: `the song “${esc((res.data || {}).title || '')}”`,
    seed: 'a seed from your Seedbank', tune: `the tune “${esc((res.data || {}).title || '')}”`,
    exercise: `the exercise ${esc((res.data || {}).name || (res.data || {}).title || h.id)}`}[res.kind];
  return `<div class="studio-hand" role="status"><span>From ${what}${room ? ` — <a href="${room.route}" data-studio-back>back to ${room.name}</a>` : ''}.</span></div>`;
}

/* ---------- minutes, from the one clock ----------
   Never computed any other way: a sitting counts for a room when the room
   started it (feature) or the person tagged it with the room's name. */
function studioRoomMinutes(room, from, to){
  if(typeof timeBetween !== 'function') return 0;
  let total = 0;
  try {
    timeBetween(from, to).forEach(e => {
      if(e.feature === room || (Array.isArray(e.tags) && e.tags.some(t => String(t).toLowerCase() === room))) total += timeMinutes(e);
    });
  } catch(err){}
  return Math.round(total);
}
function studioMinutesToday(room){ const d = today(); return studioRoomMinutes(room, d, d); }
function studioMinutesWeek(room){ const a = planWeekStart(today()); return studioRoomMinutes(room, a, addDays(a, 6)); }

/* ---------- one vocal range for the whole studio ----------
   Both rooms keep their own field (nothing is removed, old backups load):
   S.songwriting.profile.lowNote/highNote (names) and S.jazz.settings.vocalRange
   ({lowMidi, highMidi}). studioVocalRange() reads the songwriting profile when it
   has been set, else the jazz setting; studioSetVocalRange() writes both. */
function studioNoteToMidi(v){
  if(typeof v === 'number') return isFinite(v) && v > 0 ? Math.round(v) : null;
  const n = typeof sngMidiOf === 'function' ? sngMidiOf(v) : null;
  return n == null ? null : n;
}
const studioNoteName = m => typeof sngMidiName === 'function' ? sngMidiName(m) : String(m);
function studioVocalRanges(){
  let sng = null, jz = null;
  try {
    const p = sngState().profile, lo = studioNoteToMidi(p.lowNote), hi = studioNoteToMidi(p.highNote);
    if(p.onboarded && lo != null && hi != null && lo < hi) sng = {lowMidi: lo, highMidi: hi};
  } catch(e){}
  try {
    const r = jazzState().settings.vocalRange;
    if(r && r.lowMidi && r.highMidi && r.lowMidi < r.highMidi) jz = {lowMidi: +r.lowMidi, highMidi: +r.highMidi};
  } catch(e){}
  return {sng, jz};
}
function studioVocalRange(){
  const {sng, jz} = studioVocalRanges();
  const r = sng || jz; if(!r) return null;
  return {low: studioNoteName(r.lowMidi), high: studioNoteName(r.highMidi), lowMidi: r.lowMidi, highMidi: r.highMidi, source: sng ? 'songwriting' : 'jazz'};
}
function studioSetVocalRange(low, high){
  const lo = studioNoteToMidi(low), hi = studioNoteToMidi(high);
  if(lo == null || hi == null || lo >= hi) return false;
  const p = sngState().profile;
  p.lowNote = studioNoteName(lo); p.highNote = studioNoteName(hi);
  jazzState().settings.vocalRange = {lowMidi: lo, highMidi: hi};
  saveNow();
  return true;
}
/* old data can hold two different ranges: say so once, and let the person choose */
function studioRangeMismatch(){
  const {sng, jz} = studioVocalRanges();
  if(!sng || !jz) return null;
  return sng.lowMidi === jz.lowMidi && sng.highMidi === jz.highMidi ? null : {sng, jz};
}
function studioRangeNoticeHTML(){
  const st = studioState(); if(st.vocalRangeNoticeSeen) return '';
  const m = studioRangeMismatch(); if(!m) return '';
  const said = r => `${studioNoteName(r.lowMidi)}–${studioNoteName(r.highMidi)}`;
  return `<div class="studio-note" role="status" data-studio-rangenote>
    <span>Your two studios hold different vocal ranges. Which should both use?</span>
    <button class="tbtn" data-studio-range="songwriting">Use ${esc(said(m.sng))} (Songwriting)</button>
    <button class="tbtn" data-studio-range="jazz">Use ${esc(said(m.jz))} (Jazz)</button>
    <button class="tbtn" data-studio-range="keep" title="leave them as they are and stop asking">Keep both</button></div>`;
}

/* ---------- the studio bar ---------- */
function studioNextInSongwriting(){
  try {
    const st = sngState();
    if(!st.profile.onboarded) return {href: '#/songwriting', label: 'Open the Songwriting Studio'};
    if(!st.owDates.includes(today())) return {href: '#/songwriting/tool/object-writing', label: 'Today’s morning page'};
    const n = sngNextExercise();
    if(n) return {href: `#/songwriting/ex/${n.id}`, label: `Next on the Path: ${n.id} ${n.title}`};
    return {href: '#/songwriting/capstone', label: 'The Capstone'};
  } catch(e){ return {href: '#/songwriting', label: 'Songwriting Studio'}; }
}
/* today's plan, read without making one: counting what is done must not write anything */
function studioJazzPlanCount(){
  try {
    const j = jazzState(), plan = j.dayPlan && j.dayPlan.plan;
    if(!plan || !Array.isArray(plan.exercises) || !plan.exercises.length) return null;
    const d = today();
    const done = plan.exercises.filter(r => !r.synthetic && r.exerciseId && jazzRecord(r.exerciseId).lastAt === d).length;
    return {done, of: plan.exercises.length};
  } catch(e){ return null; }
}
function studioNextInJazz(){
  const c = studioJazzPlanCount();
  return {href: '#/jazz/plan', label: c ? `Today’s plan — ${c.done} of ${c.of} done` : 'Today’s plan'};
}
function studioBarHTML(room){
  const st = studioState(), other = studioOther(room);
  const next = room === 'jazz' ? studioNextInSongwriting() : studioNextInJazz();
  const m = r => studioMinutesToday(r), w = r => studioMinutesWeek(r);
  const tabs = Object.keys(STUDIO_ROOMS).map(k => k === room
    ? `<a class="sb-tab on" href="${STUDIO_ROOMS[k].route}" aria-current="page">${STUDIO_ROOMS[k].name}</a>`
    : `<a class="sb-tab" href="${STUDIO_ROOMS[k].route}">${STUDIO_ROOMS[k].name}</a>`).join('<i class="sb-dot" aria-hidden="true">·</i>');
  const tip = `This week: Jazz ${w('jazz')} min · Songwriting ${w('songwriting')} min. Minutes come from the Time-tracking clock.`;
  if(st.bar.collapsed) return `<div class="studio-bar collapsed" data-studio-bar="${room}">
    <button class="sb-fold" data-studio-fold aria-expanded="false" aria-label="Show the studio bar" title="Show the studio bar">Studios ▸</button></div>`;
  return `<div class="studio-bar" data-studio-bar="${room}" role="navigation" aria-label="Studios">
    <button class="sb-fold" data-studio-fold aria-expanded="true" aria-label="Fold the studio bar" title="Fold the studio bar">Studios ▾</button>
    <span class="sb-tabs">${tabs}</span>
    <span class="sb-min mono" tabindex="0" title="${esc(tip)}" aria-label="${esc(tip)}">Jazz ${m('jazz')} min · Songwriting ${m('songwriting')} min today</span>
    <a class="sb-next" href="${next.href}" title="Continue in ${STUDIO_ROOMS[other].name}">Continue in ${STUDIO_ROOMS[other].name}: ${esc(next.label)} →</a></div>`;
}
/* mounted above each room's own header; the header stays as it is */
function studioMountBar(root, room){
  if(!root || !root.querySelector) return;
  const page = root.querySelector('.page');
  root.querySelectorAll('.studio-bar, .studio-note, .studio-hand').forEach(n => n.remove());
  if(!page) return;
  const rangeNote = studioRangeNoticeHTML(), hand = studioHandoffHTML();
  page.insertAdjacentHTML('afterbegin', studioBarHTML(room) + rangeNote + hand);
  const fold = page.querySelector('[data-studio-fold]');
  if(fold) fold.onclick = () => { const st = studioState(); st.bar.collapsed = !st.bar.collapsed; saveNow();
    studioMountBar(root, room); const f = root.querySelector('[data-studio-fold]'); if(f) f.focus(); };
  page.querySelectorAll('[data-studio-range]').forEach(b => b.onclick = () => {
    const m = studioRangeMismatch(), pick = b.dataset.studioRange, st = studioState();
    if(m && pick !== 'keep'){ const r = pick === 'jazz' ? m.jz : m.sng; studioSetVocalRange(r.lowMidi, r.highMidi); }
    st.vocalRangeNoticeSeen = true; saveNow(); studioMountBar(root, room);
    if(pick !== 'keep' && typeof rerender === 'function') rerender(); });
}

/* The rooms are wrapped, not edited: each route runs as it always did and the
   bar is mounted over what it drew. A room that redraws itself through its
   route (rerender) gets the bar again. */
(function studioWrapRoutes(){
  ['jazz', 'songwriting'].forEach(room => {
    const f = routes[room];
    if(typeof f !== 'function' || f._studio) return;
    const g = function(root, params){
      const out = f.apply(this, arguments);
      try { studioMountBar(root, room); } catch(e){ console.warn('the studio bar did not mount', e); }
      try { if(room === 'songwriting') studioSongwritingClock(params); } catch(e){}
      return out;
    };
    g._studio = true; routes[room] = g;
  });
})();

/* The Songwriting Studio had no part in the clock; the bar's minutes come from
   the clock, so its work pages ask the clock the way the Jazz exercise pages do
   (and, like them, only when automatic tracking is on and nothing else is
   running). A page you only look at — Today, the Path, the Seedbank — starts nothing. */
function studioSongwritingClock(params){
  const a = (params || [])[0];
  if(!['ex', 'tool', 'song', 'capstone'].includes(a)) return;
  if(typeof timeAutoStart !== 'function') return;
  const what = a === 'tool' ? `songwriting: ${typeof sngToolName === 'function' ? sngToolName(params[1]) : params[1]}`
    : a === 'ex' ? `songwriting exercise ${params[1]}` : 'songwriting';
  timeAutoStart({categoryId: 'creative', feature: 'songwriting', what});
}
addEventListener('hashchange', () => {
  if(typeof parseHash !== 'function') return;
  if(parseHash().name === 'songwriting') return;
  try { if(typeof timeAutoStop === 'function') timeAutoStop('songwriting'); } catch(e){}
});
