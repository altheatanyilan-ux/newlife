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
  const n = S._studioNote && S._studioNote.stamp === location.hash && S._studioNote.text ? ' ' + esc(S._studioNote.text) : '';
  return `<div class="studio-hand" role="status"><span>From ${what}${room ? ` — <a href="${room.route}" data-studio-back>back to ${room.name}</a>` : ''}.${n}</span></div>`;
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
  root.querySelectorAll('.studio-bar, .studio-note, .studio-hand:not(.studio-play-hand)').forEach(n => n.remove());
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
      try { studioMountBridges(root, room, params); } catch(e){ console.warn('the bridges did not mount', e); }
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

/* ============================================================
   PROGRESSIONS ACROSS THE DOOR

   The Chord Lab speaks in Roman numerals (a key and a colour), the Jazz
   Studio in chord symbols (a chart). These two converters carry a
   progression either way, on the theory both rooms already have
   (sngParseRoman here, jazzParseChord there). They never throw: a token
   that cannot be read comes back as the text it was.
   ============================================================ */
const STUDIO_SNG_TO_JAZZ_Q = {maj: '', min: 'm', dim: 'dim', aug: 'aug', '7': '7', maj7: 'maj7', m7: 'm7', mMaj7: 'm(maj7)', m7b5: 'm7b5', dim7: 'dim7',
  sus4: 'sus4', '7sus4': '7sus4', '6': '6', m6: 'm6', '9': '9', m9: 'm9', '13': '13', add2: 'add2', madd2: 'm(add2)'};
const STUDIO_DEGREES = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'];
/* a key as a pitch class: 3, 'Eb', 'E♭', 'Cm', 'F#' */
function studioKeyPc(key){
  if(typeof key === 'number') return ((Math.round(key) % 12) + 12) % 12;
  const m = /^([A-Ga-g])\s*([b#♭♯]?)/.exec(String(key == null ? 'C' : key).trim());
  if(!m) return 0;
  const n = m[1].toUpperCase() + (m[2] === '♭' ? 'b' : m[2] === '♯' ? '#' : m[2]);
  return JAZZ_TUNE_PC[n] != null ? JAZZ_TUNE_PC[n] : 0;
}
const studioSharpKey = pc => { const p = ((pc % 12) + 12) % 12; return JAZZ_TUNE_SHARP_KEYS.includes(JAZZ_TUNE_FLAT[p]) || JAZZ_TUNE_SHARP_KEYS.includes(JAZZ_TUNE_SHARP[p]); };
const studioKeyName = pc => (studioSharpKey(pc) ? JAZZ_TUNE_SHARP : JAZZ_TUNE_FLAT)[((pc % 12) + 12) % 12];
/* Roman numerals in a key → chord symbols as the Jazz Studio reads them (ASCII flats and sharps;
   studioPretty() prints them with ♭ and ♯). The colour is accepted for symmetry with the Chord Lab;
   a numeral names a degree outright, so it does not change the answer. */
function studioRomanToSymbols(romans, key, colour){
  const kpc = studioKeyPc(key), names = studioSharpKey(kpc) ? JAZZ_TUNE_SHARP : JAZZ_TUNE_FLAT;
  void colour;
  return (romans || []).map(r => {
    let c = null; try { c = sngParseRoman(r); } catch(e){}
    if(!c) return String(r == null ? '' : r);
    const suffix = STUDIO_SNG_TO_JAZZ_Q[c.quality];
    return names[(kpc + c.root) % 12] + (suffix == null ? '' : suffix);
  });
}
const studioPretty = sym => typeof jazzPrettyChord === 'function' ? jazzPrettyChord(sym) : String(sym);
/* the Roman numeral for one parsed chord, and whether anything was lost saying it */
function studioRomanOf(c, kpc){
  const deg = ((c.pc - kpc) % 12 + 12) % 12;
  let numeral = STUDIO_DEGREES[deg], lossy = false;
  const q = c.q || '';
  let suffix = '';
  const lower = ['min', 'hd', 'dim'].includes(c.quality);
  if(c.quality === 'maj'){
    if(/^(maj13|M13|maj9|M9|69)/.test(q)){ suffix = /^69/.test(q) ? '6' : 'maj7'; lossy = true; }
    else if(/^(maj7|M7|Δ|\^)/.test(q)) suffix = 'maj7';
    else if(/^6/.test(q)) suffix = '6';
    else if(q === '' || /^(maj)$/.test(q)) suffix = '';
    else if(/^(add|2)/.test(q)){ suffix = ''; lossy = true; }
    else { suffix = ''; lossy = true; }
  } else if(c.quality === 'min'){
    if(/\(?(maj7|M7)\)?/.test(q)) suffix = 'maj7';
    else if(/^(m|mi|min|-)?6/.test(q)) suffix = '6';
    else if(/9/.test(q) && !/11/.test(q)) suffix = '9';
    else if(/7|11|13/.test(q)){ suffix = '7'; if(/11|13/.test(q)) lossy = true; }
    else suffix = '';
  } else if(c.quality === 'dom'){
    if(c.altered || /alt/.test(q)){ suffix = '7'; lossy = true; }
    else if(/(^|[^b#])13/.test(q)){ suffix = '13'; }
    else if(/^9/.test(q)) suffix = '9';
    else if(/11/.test(q)){ suffix = '7'; lossy = true; }
    else suffix = '7';
  } else if(c.quality === 'hd'){ numeral = numeral; suffix = 'ø7'; }
  else if(c.quality === 'dim'){ suffix = /7/.test(q) ? '°7' : '°'; }
  else if(c.quality === 'aug'){ suffix = '+'; if(/7/.test(q)) lossy = true; }
  else if(c.quality === 'sus'){ suffix = /7|9|13/.test(q) ? '7sus4' : 'sus4'; }
  else return null;
  if(lower) numeral = numeral.replace(/[IV]+/, m => m.toLowerCase());
  /* the Chord Lab's parser puts the quality mark straight after the numeral, then the extension */
  return {roman: numeral + suffix, lossy};
}
/* chord symbols in a key → Roman numerals, one for each; what cannot be said stays as it was written */
function studioSymbolsToRomanDetailed(symbols, key){
  const kpc = studioKeyPc(key);
  return (symbols || []).map(sym => {
    const text = String(sym == null ? '' : sym);
    let c = null; try { c = typeof jazzParseChord === 'function' ? jazzParseChord(text) : null; } catch(e){}
    if(!c || c.pc == null || c.bass) return {roman: text, symbol: text, text: true, lossy: false};
    const r = studioRomanOf(c, kpc);
    if(!r) return {roman: text, symbol: text, text: true, lossy: false};
    let ok = false; try { ok = !!sngParseRoman(r.roman); } catch(e){}
    return ok ? {roman: r.roman, symbol: text, text: false, lossy: r.lossy} : {roman: text, symbol: text, text: true, lossy: false};
  });
}
const studioSymbolsToRoman = (symbols, key) => studioSymbolsToRomanDetailed(symbols, key).map(x => x.roman);
/* a chart the Jazz Studio parses: one chord to a bar, or the bars as given ('Fm7 Bb7' shares a bar) */
const studioChartString = bars => (bars || []).map(b => Array.isArray(b) ? b.join(' ') : b).join('|');

/* ---------- a groove, in the nearest band settings ----------
   The songwriting grooves and the Jazz band are separate engines and stay so;
   only a name travels. The table is explicit and small: the Jazz-family styles
   map to the band's comping (Charleston / reverse Charleston), bass (two-feel /
   walking) and drums (swing / ballad / bossa). Anything else is read by its
   name the way the band's own defaults read an exercise's name (jzbDefaults):
   bossa/latin → bossa, ballad → ballad, otherwise swing. */
const STUDIO_GROOVE_TO_BAND = {
  'jazz-swing':        {comping: 'charleston',         bass: 'walking',  drums: 'swing'},
  'jazz-swing4':       {comping: 'charleston',         bass: 'walking',  drums: 'swing'},
  'jazz-charleston':   {comping: 'charleston',         bass: 'walking',  drums: 'swing'},
  'jazz-rev-charleston': {comping: 'reverse_charleston', bass: 'walking', drums: 'swing'},
  'jazz-anticipation': {comping: 'mixed',              bass: 'walking',  drums: 'swing'},
  'jazz-twofeel':      {comping: 'charleston',         bass: 'two_feel', drums: 'swing'},
  'jazz-stride':       {comping: 'charleston',         bass: 'two_feel', drums: 'swing'},
  'jazz-ballad':       {comping: 'charleston',         bass: 'two_feel', drums: 'ballad'},
  'jazz-waltz':        {comping: 'charleston',         bass: 'two_feel', drums: 'swing'},
  'jazz-bossa':        {comping: 'charleston',         bass: 'two_feel', drums: 'bossa'},
  'brazil-bossa':      {comping: 'charleston',         bass: 'two_feel', drums: 'bossa'}};
function studioGrooveToBand(styleId){
  const st = typeof SNG_STYLES !== 'undefined' ? SNG_STYLES.find(s => s.id === styleId) : null;
  const hit = STUDIO_GROOVE_TO_BAND[styleId];
  if(hit) return Object.assign({explicit: true}, hit);
  const name = `${(st && st.name) || ''} ${styleId || ''}`.toLowerCase();
  const drums = /bossa|latin|partido|samba/.test(name) ? 'bossa' : /ballad/.test(name) ? 'ballad' : 'swing';
  return {explicit: false, comping: 'charleston', bass: drums === 'swing' ? 'walking' : 'two_feel', drums};
}

/* ---------- a tune that is not in the library ----------
   The play-along reads a "tune" — a title, a key, a chord string. A progression
   from the Chord Lab, a song's sections or a seed is dressed as one, for the
   run of the page, and never stored in the tune library. */
function studioTuneFromProgression(o){
  const syms = o.symbols || studioRomanToSymbols(o.romans || [], o.keyPc, o.colour);
  const style = typeof SNG_STYLES !== 'undefined' ? SNG_STYLES.find(s => s.id === o.styleId) : null;
  const band = studioGrooveToBand(o.styleId);
  const per = style && style.timeSig && style.timeSig[0] === 3 ? '3/4' : '4/4';
  const minor = o.colour === 'minor' || o.colour === 'dorian';
  return {id: o.id, title: o.title, composer: '', key: studioKeyName(o.keyPc) + (minor ? 'm' : ''),
    chordProgression: o.chart || studioChartString(syms), category: band.drums === 'bossa' ? 'bossa' : 'standard',
    timeSignature: per, tempo: String(Math.round(o.bpm || 120)), form: '',
    studio: {kind: o.kind, ref: o.ref, bpm: Math.round(o.bpm || 120), band, styleId: o.styleId || null, romans: o.romans || [], keyPc: o.keyPc,
      colour: o.colour || 'major', back: o.back || null, note: o.note || ''}};
}
function studioLabTune(){
  const L = typeof sngLabState === 'function' ? sngLabState() : null;
  if(!L || !L.prog.length) return null;
  return studioTuneFromProgression({id: 'studio-lab', kind: 'lab', ref: 'lab', title: 'From your Chord Lab', romans: L.prog, keyPc: L.keyPc, colour: L.colour,
    styleId: L.styleId, bpm: L.bpm, back: {route: '#/songwriting/tool/chord-lab', said: 'back to Songwriting'}});
}
/* section labels the chart parser knows: Intro / Outro, and A–D for the four kinds of body */
const STUDIO_SECTION_LABEL = {verse: 'Verse', prechorus: 'Prechorus', chorus: 'Chorus', bridge: 'Bridge'};
function studioSongForm(song){
  const letters = {}, order = [];
  const out = [];
  (song.sections || []).forEach(sec => {
    if(!sec.prog || !sec.prog.length) return;
    let label;
    if(sec.type === 'intro') label = 'Intro'; else if(sec.type === 'outro') label = 'Outro';
    else { if(!(sec.type in letters)){ letters[sec.type] = 'ABCD'[order.length] || 'D'; order.push(sec.type); }
      label = `${letters[sec.type]}(${STUDIO_SECTION_LABEL[sec.type] || 'Section'})`; }
    out.push({label, sec});
  });
  return out;
}
function studioSongTune(songId){
  const st = typeof sngState === 'function' ? sngState() : null;
  const song = st && st.songs.find(s => s.id === songId);
  if(!song) return null;
  const form = studioSongForm(song);
  if(!form.length) return null;
  const first = form[0].sec, keyPc = first.keyPc || 0, colour = first.colour || 'major';
  const chart = form.map(f => `${f.label}: ${studioChartString(studioRomanToSymbols(f.sec.prog, keyPc, colour))}`).join(' ');
  const differs = form.some(f => (f.sec.keyPc || 0) !== keyPc);
  const t = studioTuneFromProgression({id: 'studio-song-' + song.id, kind: 'song', ref: 'song:' + song.id, title: song.title || 'Untitled', romans: [].concat(...form.map(f => f.sec.prog)),
    keyPc, colour, styleId: first.styleId, bpm: first.bpm || 100, chart, back: {route: '#/songwriting/song/' + song.id, said: 'back to the Song Desk'},
    note: differs ? 'The sections are set in different keys; the band plays them all in the first section’s key.' : ''});
  t.form = form.map(f => f.label.charAt(0)).join('');
  return t;
}
function studioSeedTune(seedId){
  const st = typeof sngState === 'function' ? sngState() : null;
  const seed = st && st.seeds.find(s => s.id === seedId);
  const d = seed && seed.data;
  if(!seed || seed.type !== 'progression' || !d) return null;
  const romans = (d.chords || []).map(c => c.roman).filter(Boolean);
  if(!romans.length) return null;
  return studioTuneFromProgression({id: 'studio-seed-' + seed.id, kind: 'seed', ref: 'seed:' + seed.id, title: (seed.content || 'A seed').slice(0, 60), romans,
    keyPc: d.keyPc || 0, colour: d.colour || 'major', styleId: d.styleId, bpm: d.bpm || 100, back: {route: '#/songwriting/seeds', said: 'back to the Seedbank'}});
}
function studioTuneById(id){
  id = String(id == null ? '' : id);
  if(!id.startsWith('studio-')) return null;
  let m;
  if(id === 'studio-lab') return studioLabTune();
  if((m = /^studio-song-(.+)$/.exec(id))) return studioSongTune(m[1]);
  if((m = /^studio-seed-(.+)$/.exec(id))) return studioSeedTune(m[1]);
  return null;
}
/* the tune a play-along address asks for, if it asks for one */
function studioHandoffTune(){
  const h = studioReadHandoff();
  if(!h || !h.ok) return null;
  if(h.kind === 'lab') return studioTuneById('studio-lab');
  if(h.kind === 'song') return studioTuneById('studio-song-' + h.id);
  if(h.kind === 'seed') return studioTuneById('studio-seed-' + h.id);
  return null;
}
/* the band's own settings for such a tune live in memory for the visit, not in the tune library:
   a hand-off writes nothing */
function studioApplyBand(t){
  if(!t || !t.studio || t.studio._applied) return;
  t.studio._applied = true;
  const key = t.id, memo = (S._studioPlay = S._studioPlay || {});
  if(memo[key]) return;
  const b = t.studio.band;
  memo[key] = {bpm: t.studio.bpm, bassStyle: b.bass, drumStyle: b.drums, comping: b.comping, choruses: 2, trading: false, melody: 0.3, showMelody: true,
    countIn: 1, swingRatio: 0.62, soloist: 'none', soloDensity: 'medium', soloOutside: 1, soloSeed: 1, soloVol: 1, startAt: 'head'};
  try { const P = jazzPracFor(key); if(P.bpm == null) P.bpm = t.studio.bpm; } catch(e){}
}

/* what the play-along shows under a handed-over progression: where it came from, the band's
   performance panel (set from the groove, in memory), and a way back */
function studioPlayAlongExtrasHTML(t){
  const s = t.studio, back = s.back;
  return `<div class="studio-hand studio-play-hand" role="status"><span>From ${s.kind === 'lab' ? 'your Chord Lab progression' : s.kind === 'song' ? `the song “${esc(t.title)}”` : 'a seed from your Seedbank'}
      — ${esc(s.romans.slice(0, 12).join(' '))}${s.romans.length > 12 ? ' …' : ''}${back ? ` — <a href="${back.route}" data-studio-back>${esc(back.said)}</a>` : ''}.
      ${s.band.explicit ? 'The band follows the groove you chose.' : 'The band plays its own defaults for this groove.'}${s.note ? ' ' + esc(s.note) : ''}</span></div>
    ${typeof jazzTunePlayHTML === 'function' ? jazzTunePlayHTML(t) : ''}`;
}
function bindStudioPlayAlongExtras(root, t){
  try { if(typeof bindJazzTunePlay === 'function') bindJazzTunePlay(root, t); } catch(e){ console.warn('the tune panel did not bind', e); }
}

/* ============================================================
   WHAT JAZZ WOULD CALL THIS — one pattern finder, one set of colours

   The pattern finder was written for the Real Book charts (ii-V-I spans,
   tonicisations, tritone substitutions, diminished walk-ups) and lived in
   jazzTuneAnalysis. It is here now, unchanged, so the Chord Lab and the Song
   Desk can ask the same question of a progression of their own — and the
   charts in the Jazz Studio, which call it from there, give the same answer
   they always did. The colours are here for the same reason: one vocabulary.
   ============================================================ */
const STUDIO_PATTERN_COLOURS = {
  iivi:         {color: 'var(--jzp-iivi)', said: 'ii-V-I'},
  minor:        {color: 'var(--jzp-iivi)', said: 'minor ii-V-i', dashed: true},
  tonicization: {color: 'var(--jzp-ton)', said: 'tonicisation'},
  tritone:      {color: 'var(--jzp-tri)', said: 'tritone substitution'},
  dim:          {color: 'var(--jzp-dim)', said: 'diminished walk-up / passing'}
};
/* the Jazz Studio's own name for it is filled from here */
Object.assign(JAZZ_TUNE_PATTERNS, STUDIO_PATTERN_COLOURS);
/* ev: [{bar, text, root, pc, quality, ...}] in order; tonic: {pc}. → spans [{kind, from, to, at, label, target}] */
function studioFindPatterns(ev, tonic){
  const spans = [];
  const up4 = (a, b) => a != null && b != null && ((b - a + 12) % 12) === 5;
  for(let i = 0; i < ev.length; i++){
    const a = ev[i], b = ev[i + 1], c = ev[i + 2];
    /* ii-V-I and ii-V-i */
    if(b && c && up4(a.pc, b.pc) && up4(b.pc, c.pc) && b.quality === 'dom'){
      if(a.quality === 'min' && (c.quality === 'maj' || c.quality === 'dom')){
        const home = c.pc === tonic.pc;
        spans.push({kind: home ? 'iivi' : 'tonicization', from: a.bar, to: c.bar, at: [i, i + 2],
          label: `ii-V-I to ${c.root}`, target: c.root});
      } else if((a.quality === 'hd' || a.quality === 'min') && c.quality === 'min'){
        spans.push({kind: 'minor', from: a.bar, to: c.bar, at: [i, i + 2], label: `minor ii-V-i to ${c.root}m`, target: c.root});
      }
    }
    /* a dominant a fifth above a chord that is not the tonic: a tonicisation, when no ii-V-I already said so */
    if(b && a.quality === 'dom' && up4(a.pc, b.pc) && b.pc !== tonic.pc && (b.quality === 'maj' || b.quality === 'min')
       && !spans.some(s => s.at[1] === i + 1 && s.at[0] === i - 1)){
      spans.push({kind: 'tonicization', from: a.bar, to: b.bar, at: [i, i + 1], label: `V7 of ${b.root}`, target: b.root});
    }
    /* a dominant resolving down a half step: a tritone substitution */
    if(b && a.quality === 'dom' && a.pc != null && b.pc != null && ((a.pc - b.pc + 12) % 12) === 1){
      spans.push({kind: 'tritone', from: a.bar, to: b.bar, at: [i, i + 1], label: `${a.root}7 for ${JAZZ_TUNE_FLAT[(a.pc + 6) % 12]}7, into ${b.root}`, target: b.root});
    }
    /* a diminished chord between two chords a half step either side: passing */
    if(b && a.quality === 'dim' && a.pc != null && b.pc != null && (((b.pc - a.pc + 12) % 12) === 1)){
      const before = ev[i - 1];
      spans.push({kind: 'dim', from: before && ((a.pc - before.pc + 12) % 12) === 1 ? before.bar : a.bar, to: b.bar,
        at: [i, i + 1], label: `${a.root}° walking up to ${b.root}`, target: b.root});
    }
  }
  return spans;
}
/* a progression of chord symbols (one to a bar) in a key → the same analysis a chart gets */
function studioAnalyseSymbols(symbols, key){
  const kpc = studioKeyPc(key), ev = [];
  (symbols || []).forEach((text, i) => { const c = typeof jazzParseChord === 'function' ? jazzParseChord(text) : null;
    if(c && c.pc != null) ev.push(Object.assign({bar: i + 1, text}, c)); });
  const spans = studioFindPatterns(ev, {pc: kpc});
  const counts = {}; spans.forEach(s => counts[s.kind] = (counts[s.kind] || 0) + 1);
  return {events: ev, spans, counts};
}
/* the jazz exercise that drills each pattern in all twelve keys, where one exists
   (verified against the catalogue by smoke-studio) */
const STUDIO_PATTERN_EXERCISE = {iivi: '2.1', minor: '2.3', tonicization: '2.1', tritone: '7.2'};

/* ---------- the strip: "what jazz would call this" ---------- */
function studioJazzStripHTML(romans, keyPc){
  romans = (romans || []).filter(Boolean);
  if(!romans.length || typeof jazzParseChord !== 'function') return '';
  const syms = studioRomanToSymbols(romans, keyPc), a = studioAnalyseSymbols(syms, keyPc);
  const marks = {};
  a.spans.forEach(s => { for(let b = s.from; b <= s.to; b++){ (marks[b] = marks[b] || []); if(!marks[b].includes(s.kind)) marks[b].push(s.kind); } });
  const chips = romans.map((r, i) => { const m = marks[i + 1] || [];
    const tip = m.length ? m.map(k => STUDIO_PATTERN_COLOURS[k].said).join(' + ') : 'no pattern found here';
    return `<span${m.length ? ` data-pat="${m[0]}" style="--c:${STUDIO_PATTERN_COLOURS[m[0]].color}"` : ''} title="${esc(tip)}">${esc(r)} <small class="faint">${esc(studioPretty(syms[i]))}</small></span>`; }).join('');
  const kinds = Object.keys(a.counts);
  const said = kinds.length ? kinds.map(k => `${a.counts[k]} ${STUDIO_PATTERN_COLOURS[k].said}`).join(', ') : 'no named pattern';
  const rows = a.spans.map(s => { const ex = STUDIO_PATTERN_EXERCISE[s.kind];
    return `<li><i class="jt-dot" style="background:${STUDIO_PATTERN_COLOURS[s.kind].color}"></i> <b>${esc(s.label)}</b>
      <span class="faint">— ${s.from === s.to ? `bar ${s.from}` : `bars ${s.from}–${s.to}`}: found because ${s.kind === 'tritone' ? 'a dominant resolves down a half step' : s.kind === 'dim' ? 'a diminished chord sits a half step below the next chord' : s.kind === 'minor' ? 'a minor (or half-diminished) chord, a dominant a fourth above it, and a minor chord a fourth above that follow one another' : s.kind === 'tonicization' ? 'a dominant leads a fourth up to a chord that is not home' : 'a minor chord, a dominant a fourth above it and a major chord a fourth above that follow one another'}.</span>
      ${ex && typeof jazzExercise === 'function' && jazzExercise(ex) ? `<a class="tbtn" href="#/jazz/${esc(ex)}">Practise this pattern in all twelve keys</a>` : ''}</li>`; }).join('');
  return `<details class="studio-card studio-jazz"><summary>What jazz would call this — ${esc(said)}</summary>
    <div class="studio-prog" aria-label="the progression, with the patterns found">${chips}</div>
    ${rows ? `<ul>${rows}</ul>` : '<p class="faint">Nothing here is one of the four patterns the Jazz Studio colours (ii–V–I, tonicisation, tritone substitution, diminished walk-up). That is not a fault.</p>'}
    <p class="faint">The same pattern finder the Real Book charts use; it measures chord roots and qualities only, and does not hear the music.</p></details>`;
}

/* ---------- a tune's bars, in the Chord Lab's terms ----------
   The Chord Lab holds up to eight bars, one chord to a bar. A longer selection is cut to its
   first eight (and says so); a bar with two chords gives its first (and says so). */
function studioTuneProgression(t, a, b){
  const chart = jazzParseChart(t.chordProgression || ''), tonic = jazzTuneTonic(t);
  const bars = chart.bars.filter(x => x.chords && x.chords.length);
  let sel = a != null ? bars.filter(x => x.n >= a && x.n <= b) : bars;
  const notes = [];
  if(sel.length > 8){ sel = sel.slice(0, 8); notes.push('The Chord Lab holds eight bars; these are the first eight of the selection.'); }
  let split = 0;
  const symbols = sel.map(bar => { if(bar.chords.filter(c => !c.optional).length > 1) split++;
    const c = bar.chords.find(x => !x.optional) || bar.chords[0]; return c.text; });
  if(split) notes.push(`${split} bar${split === 1 ? '' : 's'} had two chords; the first of each is taken.`);
  return {symbols, romans: studioSymbolsToRoman(symbols, tonic.pc), keyPc: tonic.pc, colour: tonic.minor ? 'minor' : 'major', notes,
    from: sel.length ? sel[0].n : null, to: sel.length ? sel[sel.length - 1].n : null};
}
/* a Jazz exercise that is a progression, in the key it is shown in; null for the rest (the button then hides) */
const STUDIO_PROGRESSIONS = {
  major: ['ii7', 'V7', 'Imaj7', 'Imaj7'], minor: ['iiø7', 'V7', 'i7', 'i7'],
  blues: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7'],
  rhythm: ['Imaj7', 'vi7', 'ii7', 'V7', 'Imaj7', 'vi7', 'ii7', 'V7']};
function studioExerciseProgression(exId, key){
  const ex = typeof jazzExercise === 'function' ? jazzExercise(exId) : null;
  if(!ex) return null;
  const name = String(ex.name || ex.title || '');
  let kind = null;
  if(/minor ii-?V-?i/i.test(name) && !/worksheet|quartal|blues/i.test(name)) kind = 'minor';
  else if(/(^|\s)ii-?V-?I\b/i.test(name) && !/worksheet|improvis|rhythmic|coordination|arpeggio|modes|quartal|tritone|minor/i.test(name)) kind = 'major';
  else if(/(12-bar|jazz blues|bird blues|blues form|blues variations)/i.test(name) && !/worksheet|scale|lick/i.test(name)) kind = 'blues';
  else if(/rhythm changes form/i.test(name)) kind = 'rhythm';
  if(!kind) return null;
  const note = kind === 'blues' ? 'The first eight bars of the blues; the Chord Lab holds eight.' : '';
  return {kind, romans: STUDIO_PROGRESSIONS[kind].slice(), keyPc: studioKeyPc(key || 'C'), colour: kind === 'minor' ? 'minor' : 'major', notes: note ? [note] : []};
}
/* the hand-off into the Chord Lab: applied once per address, and it fills the Lab's working
   progression only — no song, seed or melody is made until the person keeps one */
function studioLabApplyHandoff(){
  const h = studioReadHandoff();
  if(!h || !h.ok || h.from !== 'jazz' || (h.kind !== 'tune' && h.kind !== 'exercise')) return null;
  const stamp = location.hash;
  if(S._studioApplied === stamp) return null;
  const res = studioResolveRef(h);
  if(!res.ok) return null;
  const p = h.kind === 'tune' ? studioTuneProgression(res.data, h.start, h.end) : studioExerciseProgression(h.id, h.key);
  if(!p || !p.romans.length) return null;
  const L = sngLabState();
  L.prog = p.romans.slice(0, 8); L.keyPc = p.keyPc; L.colour = SNG_KEY_COLOURS[p.colour] ? p.colour : 'major';
  S._studioApplied = stamp; S._studioNote = {stamp, text: p.notes.join(' ')};
  return p;
}

/* ---------- on the Chord Lab ---------- */
function studioLabButtonsHTML(){
  return `<button class="tbtn" id="labJazz" title="Open this progression in the Jazz Studio's play-along, with the band set from the groove">Play with the Jazz band</button>`;
}
function studioBindLab(host){
  const b = host.querySelector('#labJazz'); if(!b) return;
  b.onclick = () => { if(!sngLabState().prog.length){ toast('Put a chord or two in the progression first.'); return; }
    saveNow(); navigate(studioLink('#/jazz/playalong', 'lab', 'songwriting')); };
}

/* ---------- on the Song Desk ---------- */
function studioSongHasChords(song){ return (song.sections || []).some(s => s.prog && s.prog.length); }
function studioSongButtonsHTML(song){
  if(!studioSongHasChords(song)) return '';
  return `<button class="tbtn" id="sdJazz" title="Open the song's sections as the form in the Jazz Studio's play-along">Rehearse with the Jazz band</button>`;
}
/* the song's melodies against the shared vocal range: said before it is sung */
function studioSongRangeCheck(song){
  const r = studioVocalRange(); if(!r) return null;
  const st = sngState(); let lo = 999, hi = -1, any = false;
  (song.sections || []).forEach(sec => { const m = sec.melodyId && st.melodies.find(x => x.id === sec.melodyId);
    if(m) (m.notes || []).forEach(n => { if(n.midi != null){ any = true; lo = Math.min(lo, n.midi); hi = Math.max(hi, n.midi); } }); });
  if(!any) return null;
  if(hi > r.highMidi) return `The melody goes up to ${studioNoteName(hi)}, above your range (${r.low}–${r.high}).`;
  if(lo < r.lowMidi) return `The melody goes down to ${studioNoteName(lo)}, below your range (${r.low}–${r.high}).`;
  return null;
}
function studioBindSong(host, song){
  const b = host.querySelector('#sdJazz');
  if(b) b.onclick = () => { saveNow(); navigate(studioLink('#/jazz/playalong', 'song:' + song.id, 'songwriting')); };
  /* a section's melody: the link the Song Desk's data model always had a place for */
  host.querySelectorAll('[data-sdmel]').forEach(sel => sel.onchange = () => {
    const sec = song.sections[+sel.dataset.sdmel]; if(!sec) return;
    if(sel.value) sec.melodyId = sel.value; else delete sec.melodyId;
    song.updatedAt = new Date().toISOString(); saveNow(); rerender(); });
}
function studioSectionExtrasHTML(sec, i){
  const st = sngState();
  const mel = st.melodies.length ? `<label class="mono faint">melody <select class="inp" data-sdmel="${i}"><option value="">none</option>${st.melodies.map(m =>
    `<option value="${esc(m.id)}"${sec.melodyId === m.id ? ' selected' : ''}>${esc(m.name)}</option>`).join('')}</select></label>` : '';
  const strip = sec.prog && sec.prog.length ? studioJazzStripHTML(sec.prog, sec.keyPc || 0) : '';
  const chosen = sec.melodyId ? st.melodies.find(m => m.id === sec.melodyId) : null;
  const btns = chosen && chosen.notes && chosen.notes.some(n => n.midi != null) ? studioMelodyButtonsHTML('mel:' + chosen.id) : '';
  return mel + btns + strip;
}

/* ---------- on the Jazz tune page and the exercise page ---------- */
function studioTuneButtonsHTML(t){
  const P = typeof jazzPracFor === 'function' ? jazzPracFor(t.id) : null;
  const loop = P && P.loop && P.loop.length === 2 ? P.loop : null;
  const part = loop ? ` (bars ${loop[0]}–${loop[1]})` : '';
  return `<button class="btn sm ghost" id="jtLab" title="The Chord Lab holds eight bars, one chord to a bar">Open in Chord Lab${part}</button>
    <button class="btn sm ghost" id="jtSeed">Keep progression in Seedbank${part}</button>
    <button class="btn sm ghost" id="jtListen" title="Open the Listening Room with this tune's sections, key, chords and analysis filled in">Analyse as a songwriter</button>`;
}
function studioBindTune(root, t){
  const P = typeof jazzPracFor === 'function' ? jazzPracFor(t.id) : null;
  const loop = () => P && P.loop && P.loop.length === 2 ? P.loop : null;
  const ref = () => { const l = loop(); return `tune:${t.id}${l ? `:${l[0]}-${l[1]}` : ''}`; };
  const lab = root.querySelector('#jtLab'); if(lab) lab.onclick = () => navigate(studioLink('#/songwriting/tool/chord-lab', ref(), 'jazz'));
  const seed = root.querySelector('#jtSeed');
  if(seed) seed.onclick = () => { const l = loop(), p = studioTuneProgression(t, l ? l[0] : null, l ? l[1] : null);
    if(!p.romans.length){ toast('There are no chords in that selection.'); return; }
    const s = sngSeed({type: 'progression', content: `${p.romans.join('–')} in ${studioKeyName(p.keyPc)} — from ${t.title}${l ? `, bars ${l[0]}–${l[1]}` : ''}`,
      source: {room: 'jazz', kind: 'tune', id: t.id, bars: [p.from, p.to]}, tags: [p.colour, 'from jazz'], data: studioProgressionSeedData(p)});
    if(s){ sound('success'); toast(p.notes.length ? 'In the Seedbank. ' + p.notes.join(' ') : 'In the Seedbank.'); } };
  const lis = root.querySelector('#jtListen'); if(lis) lis.onclick = () => navigate(studioLink('#/songwriting/listening', 'tune:' + t.id, 'jazz'));
}
/* "Write with this" on an exercise that is a progression */
function studioWriteWithHTML(exId, key){
  return studioExerciseProgression(exId, key) ? `<button class="btn sm ghost" id="jzWrite" title="Open this progression, in the key shown, in the Songwriting Studio's Chord Lab">Write with this</button>` : '';
}
function studioBindWriteWith(root, exId){
  const b = root.querySelector('#jzWrite'); if(!b) return;
  b.onclick = () => navigate(studioLink('#/songwriting/tool/chord-lab', `exercise:${exId}:${jazzUi().key || 'C'}`, 'jazz'));
}

/* ---------- the Seedbank's source: a name, or where it came from ----------
   A seed's `source` was always a string (the tool that made it). It may now also be an
   object {room, kind, id, ...}. Both are read here; neither is rewritten. */
function studioSeedSource(src){
  if(src && typeof src === 'object'){
    const room = src.room === 'jazz' ? 'jazz' : src.room === 'songwriting' ? 'songwriting' : '';
    let label = room === 'jazz' ? 'Jazz Studio' : 'Songwriting Studio', href = '';
    if(src.kind === 'tune'){ let t = null; try { t = jazzTune(src.id); } catch(e){}
      label = `Jazz Studio · ${t ? t.title : 'a tune'}${src.bars && src.bars[0] != null ? `, bars ${src.bars[0]}–${src.bars[1]}` : ''}`; href = `#/jazz/tune/${src.id}`; }
    else if(src.kind === 'exercise'){ label = `Jazz Studio · exercise ${src.id}`; href = `#/jazz/${src.id}`; }
    else if(src.kind === 'recording'){ label = 'Jazz Studio · a recorded take'; href = '#/jazz/record'; }
    else if(src.kind === 'compose'){ label = 'Jazz Studio · Play to compose'; href = '#/jazz/compose'; }
    return {label, room, kind: src.kind || '', id: src.id || '', href};
  }
  return {label: String(src == null ? '' : src), room: '', kind: '', id: '', href: ''};
}
function studioSeedSourceHTML(src){
  const s = studioSeedSource(src);
  if(!s.room) return esc(s.label);
  return `<span class="studio-room" title="from the ${s.room === 'jazz' ? 'Jazz' : 'Songwriting'} Studio">${s.room === 'jazz' ? '🎷' : '✎'}</span> ${esc(s.label)}${s.href ? ` <a href="${esc(s.href)}">Open where it came from</a>` : ''}`;
}

/* ---------- the Listening Room, from a Real Book tune ----------
   Sections, bar counts, key and the chords as Roman numerals come from the chart; the tune
   is kept by id, and what the Jazz Studio found is read live from it, never copied. The
   database has no lyrics and none are added. Nothing is kept until "Keep". */
function studioTuneSectionsText(t){
  const chart = jazzParseChart(t.chordProgression || '');
  if(!chart.sections.length) return '';
  return chart.sections.map(s => `${s.label || 'chorus'} (${s.bars.length})`).join(' | ');
}
function studioTuneChordsText(t){
  const chart = jazzParseChart(t.chordProgression || ''), tonic = jazzTuneTonic(t);
  if(!chart.sections.length) return '';
  const body = chart.sections.map(sec => {
    const syms = sec.bars.filter(b => b.chords.length).map(b => (b.chords.find(c => !c.optional) || b.chords[0]).text);
    return `${sec.label ? sec.label + ': ' : ''}${studioSymbolsToRoman(syms, tonic.pc).join(' ')}`; }).join('\n');
  return `${tonic.name} ${tonic.minor ? 'minor' : 'major'}\n${body}`;
}
function studioListeningDraftFromTune(tuneId){
  const row = jazzTuneRow(tuneId); if(!row) return null;
  const t = row.tune;
  return {tuneId, song: t ? `${t.title} — ${t.composer}` : row.title, fields: t ? {sections: studioTuneSectionsText(t), chords: studioTuneChordsText(t)} : {}, analysed: !!t};
}
function studioListeningApplyHandoff(){
  const h = studioReadHandoff();
  if(!h || !h.ok || h.kind !== 'tune') return;
  if(S._studioApplied === location.hash) return;
  const d = studioListeningDraftFromTune(h.id);
  S._studioApplied = location.hash;
  if(d) sngUi().lrDraft = d;
}
function studioListeningStartHTML(){
  const u = sngUi(), d = u.lrDraft;
  const q = (u.lrTuneQ || '').trim();
  let list = [];
  if(q.length > 1){ try { list = jazzTuneFilter({q}).slice(0, 12); } catch(e){} }
  return `<details class="studio-card studio-lr" open><summary>Start from a Real Book tune</summary>
    <input class="inp" id="lrTuneQ" placeholder="search the Real Book (917 entries)" value="${esc(q)}">
    ${list.length ? `<ul class="studio-lr-list">${list.map(r => `<li><button class="tbtn" data-lrtune="${esc(r.id)}">${esc(r.title)}</button>
      <span class="faint">${r.tune ? esc(r.tune.composer || '') : 'not analysed — the title only'}</span></li>`).join('')}</ul>` : (q.length > 1 ? '<p class="faint">Nothing by that name.</p>' : '')}
    ${d ? `<div class="card"><div class="sng-card-h"><b class="serif">${esc(d.song)}</b><span class="faint">a draft — nothing is kept until you keep it</span></div>
      ${d.analysed ? `<label class="sng-field"><span>Sections &amp; bar counts</span><textarea class="inp sng-ta" rows="2" id="lrDraftSections">${esc(d.fields.sections || '')}</textarea></label>
      <label class="sng-field"><span>Key &amp; progressions (Roman numerals)</span><textarea class="inp sng-ta" rows="4" id="lrDraftChords">${esc(d.fields.chords || '')}</textarea></label>`
        : '<p class="faint">This entry is in the table of contents but not yet analysed in the Jazz Studio, so only the title comes across.</p>'}
      <div class="sng-row"><button class="btn primary" id="lrDraftKeep">Keep as a listening note</button><button class="tbtn" id="lrDraftDrop">Leave it</button></div></div>` : ''}</details>`;
}
/* what the Jazz Studio found in the tune, read live from the id */
function studioListeningTuneHTML(cur){
  if(!cur || !cur.tuneId) return '';
  const t = jazzTune(cur.tuneId);
  if(!t) return `<p class="faint">This note came from a Real Book entry (${esc(cur.tuneId)}) the Jazz Studio has not analysed.</p>`;
  const a = jazzTuneAnalysis(t);
  return `<div class="studio-card"><b>From the Jazz Studio</b> — <a href="#/jazz/tune/${esc(cur.tuneId)}">${esc(t.title)}</a>
    <ul>${a.spans.length ? a.spans.map(s => `<li>${esc(s.label)} <span class="faint">(${esc(STUDIO_PATTERN_COLOURS[s.kind].said)}, ${s.from === s.to ? `bar ${s.from}` : `bars ${s.from}–${s.to}`})</span></li>`).join('') : '<li class="faint">No named pattern found.</li>'}</ul>
    <p class="faint">Read from the tune each time it is shown; nothing here is copied, and the database holds no lyrics.</p></div>`;
}
function studioBindListening(root){
  const u = sngUi(), st = sngState();
  const q = root.querySelector('#lrTuneQ');
  if(q) q.oninput = () => { u.lrTuneQ = q.value; const pos = q.selectionStart; rerender();
    requestAnimationFrame(() => { const n = document.querySelector('#lrTuneQ'); if(n){ n.focus(); n.setSelectionRange(pos, pos); } }); };
  root.querySelectorAll('[data-lrtune]').forEach(b => b.onclick = () => { u.lrDraft = studioListeningDraftFromTune(b.dataset.lrtune); rerender(); });
  const keep = root.querySelector('#lrDraftKeep');
  if(keep) keep.onclick = () => { const d = u.lrDraft; if(!d) return;
    const f = Object.assign({}, d.fields);
    const s = root.querySelector('#lrDraftSections'), c = root.querySelector('#lrDraftChords');
    if(s) f.sections = s.value; if(c) f.chords = c.value;
    const x = {id: uid(), song: d.song, fields: f, tuneId: d.tuneId, createdAt: new Date().toISOString()};
    st.listening.unshift(x); u.listenId = x.id; u.lrDraft = null; sngLogSession('listening'); saveNow(); sound('success'); rerender(); };
  const drop = root.querySelector('#lrDraftDrop'); if(drop) drop.onclick = () => { u.lrDraft = null; rerender(); };
}

/* ============================================================
   IN THE OTHER ROOM

   A small, editable list of where one room's lessons meet the other's.
   Advice only: it never touches readiness, the daily plan, stage lighting or
   a badge. Each entry names a place on each side (a stage, exercises, a
   tool, a tab or a page), and one sentence on why they belong together.
   `direction` says where the card appears: 'both' rooms, or only on the
   page of the room the arrow leaves ('jazz→sng' shows on the Jazz side).
   ============================================================ */
const STUDIO_BRIDGES = [
  {id: 'intervals-melody', jazz: {stage: 'P0', exerciseIds: ['P0.2', 'P0.4']}, songwriting: {stage: 6, exerciseIds: ['6.2', '6.4', '6.5']},
   why: 'The distances you hear and play in the Jazz Studio are the steps and leaps a melody is made of; Melody II shows what each one does inside a tune.', direction: 'both'},
  {id: 'chords-home-base', jazz: {stage: '1', exerciseIds: ['1.1', '1.2', '1.3']}, songwriting: {stage: 2, exerciseIds: ['2.3', '2.6']},
   why: 'The chord shapes you learn at the keyboard are the chord colours and functions that Home Base teaches you to hear.', direction: 'both'},
  {id: 'two-five-one-cadences', jazz: {stage: '2', exerciseIds: ['2.1', '2.5']}, songwriting: {stage: 2, exerciseIds: ['2.6']},
   why: 'A ii–V–I is a cadence: the same pull towards home that Chord Functions & Cadences names, played with jazz voicings.', direction: 'both'},
  {id: 'two-five-one-extension', jazz: {stage: '2', exerciseIds: ['2.1']}, songwriting: {stage: 8, exerciseIds: ['8.13']},
   why: 'Jazz Extension asks you to bring those ii–V–I chords into a song of your own.', direction: 'both'},
  {id: 'blues', jazz: {stage: '3', exerciseIds: ['5.1', '5.2']}, songwriting: {stage: 10, exerciseIds: ['10.2'], tool: 'chord-lab'},
   why: 'The same twelve bars, from the other side: the Chord Lab’s Blues colour lets you hear and write the form you are learning to improvise over.', direction: 'both'},
  {id: 'modes-colours', jazz: {stage: '4', exerciseIds: ['6A.1', '6A.2']}, songwriting: {stage: 10, exerciseIds: ['10.4', '10.5', '10.9'], tool: 'chord-scale'},
   why: 'Modes you play over a chord are the colours a melody can borrow; the Chord-Scale Map is “improvise, then write”.', direction: 'both'},
  {id: 'modal-pentatonics', jazz: {stage: '10', exerciseIds: ['8.1', 'v3-8.5']}, songwriting: {stage: 10, exerciseIds: ['10.1', '10.4', '10.5'], tool: 'chord-scale'},
   why: 'Modal jazz and pentatonics are the same scales Melody III writes with — one room plays them, the other makes a tune of them.', direction: 'both'},
  {id: 'records-listening', jazz: {stage: '6', exerciseIds: ['v3-7A.916']}, songwriting: {tab: 'listening'},
   why: 'Learning from records is the Listening Room’s habit too: take a song apart by ear, then keep what you found.', direction: 'both'},
  {id: 'form', jazz: {stage: '8', exerciseIds: ['v3-7C.902']}, songwriting: {stage: 7, exerciseIds: ['7.7', '7.8']},
   why: 'Rhythm changes is a form of sections that contrast and return; Structure & Motion is how a song’s sections do the same.', direction: 'both'},
  {id: 'ballads', jazz: {stage: '9', exerciseIds: ['v3-7D.902']}, songwriting: {tool: 'song-desk', exerciseIds: ['8.14']},
   why: 'A ballad is slow enough to hear every chord: try the Song Desk’s pop-ballad groove and its rehearsal, then Groove Swap.', direction: 'both'},
  {id: 'reharmonise', jazz: {stage: '11', exerciseIds: ['v3-9.1', '9.4']}, songwriting: {stage: 8, exerciseIds: ['8.9', '10.8'], tool: 'color-word'},
   why: 'Reharmonising and modulating are the same craft: new chords under a melody that stays. Colour a Word lets you hear it note by note.', direction: 'both'},
  {id: 'composition', jazz: {stage: '12'}, songwriting: {tool: 'song-desk', capstone: true},
   why: 'Writing your own tune is what the Song Desk and the Capstone are for.', direction: 'both'},
  {id: 'voice-melody', jazz: {stage: 'DT', exerciseIds: ['DT.2', 'DT.3']}, songwriting: {stage: 6, exerciseIds: ['6.16'], tool: 'melody-sketcher'},
   why: 'Singing while you play is easier on melodies that sit in your range; the melody tools warn you when one goes out of it.', direction: 'both'},
  {id: 'voice-writing', jazz: {stage: 'V6', exerciseIds: ['V6.1']}, songwriting: {tool: 'song-desk'},
   why: 'Writing for voices is writing: the Song Desk keeps the sections you are arranging.', direction: 'both'},
  {id: 'play-time', jazz: {page: 'mindset'}, songwriting: {exerciseIds: ['0.4'], tool: 'object-writing'},
   why: '“Play time” — fearless, unedited, no consequences — is what A Song in an Hour, Badly and the Object Writing Desk are made of.', direction: 'both'}];

/* every place a side of a bridge points at, with the words and the address for it */
function studioBridgeItems(entry, side){
  const o = entry[side] || {}, out = [];
  if(side === 'songwriting'){
    if(o.stage != null){ const s = typeof SNG_STAGES !== 'undefined' ? SNG_STAGES.find(x => x.id === o.stage) : null;
      out.push({label: `Stage ${o.stage}${s ? ` — ${s.name}` : ''}`, href: `#/songwriting/stage/${o.stage}`}); }
    (o.exerciseIds || []).forEach(id => { const e = typeof sngExercise === 'function' ? sngExercise(id) : null;
      out.push({label: `${id}${e ? ` ${e.title}` : ''}`, href: `#/songwriting/ex/${id}`, ok: !!e}); });
    if(o.tool) out.push({label: typeof sngToolName === 'function' ? sngToolName(o.tool) : o.tool, href: `#/songwriting/tool/${o.tool}`});
    if(o.tab) out.push({label: o.tab === 'listening' ? 'The Listening Room' : o.tab, href: `#/songwriting/${o.tab}`});
    if(o.capstone) out.push({label: 'The Capstone', href: '#/songwriting/capstone'});
  } else {
    if(o.stage != null){ const s = typeof jazzStage === 'function' ? jazzStage(o.stage) : null;
      out.push({label: `Stage ${o.stage}${s ? ` — ${s.name}` : ''}`, jzstage: String(o.stage)}); }
    (o.exerciseIds || []).forEach(id => { const e = typeof jazzExercise === 'function' ? jazzExercise(id) : null;
      out.push({label: e ? e.name : id, href: `#/jazz/${id}`, ok: !!e}); });
    if(o.page) out.push({label: o.page === 'mindset' ? 'The Jazz Mindset page' : o.page, href: `#/jazz/${o.page}`});
  }
  return out;
}
/* the entries that belong on a page: `ctx` is {stage, exId, page, tool, tab, capstone} for the room being looked at */
function studioBridgesFor(room, ctx){
  const other = room === 'jazz' ? 'songwriting' : 'jazz';
  const mine = STUDIO_BRIDGES.filter(b => b.direction === 'both' || b.direction === (room === 'jazz' ? 'jazz→sng' : 'sng→jazz'));
  const here = b => {
    const o = b[room] || {};
    if(ctx.exId && (o.exerciseIds || []).includes(ctx.exId)) return 2;
    if(ctx.stage != null && o.stage != null && String(o.stage) === String(ctx.stage)) return 1;
    if(ctx.page && o.page === ctx.page) return 1;
    if(ctx.tool && o.tool === ctx.tool) return 1;
    if(ctx.tab && o.tab === ctx.tab) return 1;
    if(ctx.capstone && o.capstone) return 1;
    return 0;
  };
  let hit = mine.map(b => [b, here(b)]).filter(x => x[1]);
  /* on an exercise page: the entries that name it, or else the stage's */
  if(ctx.exId && hit.some(x => x[1] === 2)) hit = hit.filter(x => x[1] === 2);
  return {other, entries: hit.map(x => x[0])};
}
function studioBridgeKey(room, ctx){
  return `${room}:${ctx.stage != null ? 'stage' + ctx.stage : ctx.page ? 'page' + ctx.page : ctx.tool ? 'tool' + ctx.tool : ctx.tab ? 'tab' + ctx.tab : ctx.capstone ? 'capstone' : 'x'}`;
}
function studioBridgeCardHTML(room, ctx){
  const {other, entries} = studioBridgesFor(room, ctx);
  if(!entries.length) return '';
  const key = studioBridgeKey(room, ctx), st = studioState();
  if(st.bridgesDismissed[key]) return `<div class="studio-bridge-off" data-studio-bridge-key="${esc(key)}"><button class="tbtn" data-studio-bridge-show>In the other room — show</button></div>`;
  const where = STUDIO_ROOMS[other].name;
  return `<details class="studio-card studio-bridge" open data-studio-bridge-key="${esc(key)}">
    <summary>In the other room <span class="faint">· ${esc(where)}</span></summary>
    ${entries.map(b => `<div class="studio-bridge-row"><p>${esc(b.why)}</p>
      <div class="studio-bridge-links">${studioBridgeItems(b, other).map(i => i.jzstage
        ? `<button class="tbtn" data-studio-jzstage="${esc(i.jzstage)}">${esc(i.label)}</button>`
        : `<a class="tbtn" href="${esc(i.href)}">${esc(i.label)}</a>`).join('')}</div></div>`).join('')}
    <p class="faint studio-bridge-foot">Advice, not a lock — it changes nothing about what is open, ready or planned.
      <button class="tbtn" data-studio-bridge-hide>Hide for this stage</button></p></details>`;
}
/* where the card goes: the Jazz roadmap's open stages and its exercise pages; the Songwriting stage, exercise, tool and listening pages */
function studioMountBridges(root, room, params){
  if(!root || !root.querySelector) return;
  root.querySelectorAll('.studio-bridge, .studio-bridge-off').forEach(n => n.remove());
  const a = (params || [])[0], b = (params || [])[1];
  const jobs = [];   /* [ctx, parent, how] */
  const page = root.querySelector('.page');
  if(room === 'jazz'){
    if(!a){ root.querySelectorAll('.jz-stage:not(.shut):not(.collapsed)[data-jzstage]').forEach(el => jobs.push([{stage: el.dataset.jzstage}, el, 'stage'])); }
    else if(a === 'mindset') jobs.push([{page: 'mindset'}, page, 'end']);
    else if(typeof jazzExercise === 'function' && jazzExercise(a)){
      const at = typeof jazzSubOf === 'function' ? jazzSubOf(a) : null;
      jobs.push([{stage: at ? at.stage.id : null, exId: a}, page, 'end']); }
  } else {
    if(a === 'stage' && b != null) jobs.push([{stage: +b}, page, 'end']);
    else if(a === 'ex' && b){ const e = typeof sngExercise === 'function' ? sngExercise(b) : null;
      jobs.push([{stage: e ? e.stage : null, exId: b}, page, 'end']); }
    else if(a === 'tool' && b) jobs.push([{tool: b}, page, 'end']);
    else if(a === 'listening') jobs.push([{tab: 'listening'}, page, 'end']);
    else if(a === 'capstone') jobs.push([{capstone: true}, page, 'end']);
  }
  jobs.forEach(([ctx, parent, how]) => {
    if(!parent) return;
    const html = studioBridgeCardHTML(room, ctx); if(!html) return;
    if(how === 'stage'){ const bar = parent.querySelector('.jz-sbar'); (bar || parent.firstElementChild).insertAdjacentHTML('afterend', html); }
    else parent.insertAdjacentHTML('beforeend', html);
  });
  const redo = () => studioMountBridges(root, room, params);
  root.querySelectorAll('[data-studio-bridge-hide]').forEach(btn => btn.onclick = e => { e.stopPropagation();
    const key = btn.closest('[data-studio-bridge-key]').dataset.studioBridgeKey; studioState().bridgesDismissed[key] = true; saveNow(); redo(); });
  root.querySelectorAll('[data-studio-bridge-show]').forEach(btn => btn.onclick = e => { e.stopPropagation();
    const key = btn.closest('[data-studio-bridge-key]').dataset.studioBridgeKey; delete studioState().bridgesDismissed[key]; saveNow(); redo(); });
  root.querySelectorAll('[data-studio-jzstage]').forEach(btn => btn.onclick = e => { e.stopPropagation();
    try { jazzUi().scrollTo = btn.dataset.studioJzstage; } catch(x){}
    if(location.hash === '#/jazz' && typeof rerender === 'function') rerender(); else location.hash = '#/jazz'; });
}

/* ============================================================
   THE SEEDBANK AS THE STUDIO'S SHARED SHELF

   A melody the Jazz Studio hears out (Play to compose), or one the Songwriting
   Studio sketches, is kept in the same shape — a seed whose data.melody is what
   the Melody Sketcher keeps: {notes: [{midi, t, d}], keyPc, colour, bpm, beats}
   (times in beats). From there it re-sounds, opens in the Melody Sketcher, is
   read back as notation, and can be checked on the piano. Nothing in this
   section writes until a button that says Keep/Send is pressed.
   ============================================================ */
const STUDIO_MELODY_TYPES = [[1, 'sixteenth', 1], [2, 'eighth', 2], [3, 'eighth', 3], [4, 'quarter', 4], [6, 'quarter', 6], [8, 'half', 8], [12, 'half', 12], [16, 'whole', 16]];
/* Play to compose → a melody: the top note at each onset, each as long as it sounds before the next begins */
function studioComposeToMelody(model, title){
  if(!model || !model.notes || !model.notes.length) return null;
  const div = typeof CP_DIV === 'number' ? CP_DIV : 12;
  const byStart = new Map();
  model.notes.forEach(n => { const c = byStart.get(n.start); if(!c || n.pitch > c.pitch) byStart.set(n.start, n); });
  const line = [...byStart.values()].sort((a, b) => a.start - b.start);
  const notes = line.map((n, i) => {
    const next = line[i + 1], end = next ? Math.min(n.start + n.dur, next.start) : n.start + n.dur;
    return {midi: n.pitch, t: +(n.start / div).toFixed(4), d: +Math.max(1 / 8, (end - n.start) / div).toFixed(4), deg: null, why: ['played in, cleaned up by Play to compose']};
  });
  const minor = model.key && model.key.mode === 'minor', tonic = model.key ? model.key.tonic : 0;
  const beats = model.ts ? model.ts[0] * (4 / (model.ts[1] || 4)) : 4;
  return {name: title || model.title || 'A played melody', notes, keyPc: tonic, colour: minor ? 'minor' : 'major', bpm: model.bpm || 90, beats, prog: []};
}
/* a melody as MusicXML: one treble staff, sixteenth-note grid, notes tied across bar lines */
function studioMelodyXml(m){
  const beats = Math.max(1, Math.round(m.beats || 4)), per = beats * 4;
  const minor = m.colour === 'minor' || m.colour === 'dorian';
  const keyName = studioKeyName(minor ? (m.keyPc + 3) % 12 : m.keyPc);
  const fifths = typeof jzeFifthsFor === 'function' ? jzeFifthsFor(keyName, 0) : 0;
  const units = n => Math.max(1, Math.round(n * 4));
  const evs = [];   /* {u: start unit, len, midi|null} */
  let at = 0;
  m.notes.slice().sort((a, b) => a.t - b.t).forEach(n => {
    const s = Math.round(n.t * 4);
    if(s > at) evs.push({u: at, len: s - at, midi: null});
    if(s < at) return;
    const len = units(n.d); evs.push({u: s, len, midi: n.midi == null ? null : n.midi}); at = s + len; });
  const bars = Math.max(1, Math.ceil(at / per));
  const pieces = [];   /* split at bar lines, then into plain note values */
  evs.forEach(e => {
    let u = e.u, left = e.len, first = true;
    while(left > 0){
      const room = per - (u % per), take = Math.min(left, room);
      let rest = take;
      while(rest > 0){
        const fit = STUDIO_MELODY_TYPES.filter(t => t[0] <= rest).pop() || STUDIO_MELODY_TYPES[0];
        const more = left - fit[0] > 0;
        pieces.push({u, len: fit[0], type: fit[1], dot: fit[2] === 3 || fit[2] === 6 || fit[2] === 12, midi: e.midi,
          tieStart: e.midi != null && (more || (rest - fit[0]) > 0), tieStop: e.midi != null && !first});
        u += fit[0]; left -= fit[0]; rest -= fit[0]; first = false; }
    }
  });
  const measure = k => {
    const mine = pieces.filter(p => Math.floor(p.u / per) === k);
    const attrs = k === 0 ? `<attributes><divisions>4</divisions><key><fifths>${fifths}</fifths></key><time><beats>${beats}</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>` : '';
    const body = mine.map(p => {
      let pitch = '';
      if(p.midi != null){ const sp = typeof jazzSpellMidi === 'function' ? jazzSpellMidi(p.midi, keyName) : {step: 'C', alter: 0, octave: 4};
        pitch = `<pitch><step>${sp.step}</step>${sp.alter ? `<alter>${sp.alter}</alter>` : ''}<octave>${sp.octave}</octave></pitch>`; }
      return `<note>${p.midi == null ? '<rest/>' : pitch}<duration>${p.len}</duration>${p.tieStop ? '<tie type="stop"/>' : ''}${p.tieStart ? '<tie type="start"/>' : ''}<type>${p.type}</type>${p.dot ? '<dot/>' : ''}${
        (p.tieStop || p.tieStart) ? `<notations>${p.tieStop ? '<tied type="stop"/>' : ''}${p.tieStart ? '<tied type="start"/>' : ''}</notations>` : ''}</note>`; }).join('');
    const used = mine.reduce((z, p) => z + p.len, 0);
    const pad = used < per ? `<note><rest/><duration>${per - used}</duration><type>${(STUDIO_MELODY_TYPES.filter(t => t[0] <= per - used).pop() || STUDIO_MELODY_TYPES[0])[1]}</type></note>` : '';
    return `<measure number="${k + 1}">${attrs}${body}${pad}</measure>`;
  };
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1"><part-list><score-part id="P1"><part-name>Melody</part-name></score-part></part-list>
<part id="P1">${[...Array(bars)].map((_, k) => measure(k)).join('')}</part></score-partwise>`;
}
/* the melody inside a seed, or a Song Desk melody, in the Sketcher's shape */
function studioSeedMelody(seed){
  const d = seed && seed.data && seed.data.melody;
  if(!d || !Array.isArray(d.notes) || !d.notes.length) return null;
  return Object.assign({name: (seed.content || 'A melody').split(':')[0], colour: 'major', keyPc: 0, bpm: 90, beats: 4, prog: []}, d);
}
function studioMelodySeed(m, source, tags){
  const names = m.notes.filter(n => n.midi != null).map(n => sngMidiName(n.midi));
  return sngSeed({type: 'melody', content: `${m.name}: ${names.slice(0, 24).join(' ')}${names.length > 24 ? ' …' : ''}`, source, tags: tags || [],
    data: {melody: {notes: m.notes.map(n => ({midi: n.midi, t: n.t, d: n.d, deg: n.deg == null ? null : n.deg})), keyPc: m.keyPc, colour: m.colour, bpm: m.bpm, beats: m.beats, prog: (m.prog || []).slice()}}});
}
/* a seed's melody becomes a Melody Sketcher melody only when you ask for it */
function studioOpenSeedMelodyInSketcher(seed){
  const d = studioSeedMelody(seed); if(!d) return;
  const st = sngState();
  const m = {id: uid(), name: d.name, keyPc: d.keyPc, colour: d.colour, prog: d.prog && d.prog.length ? d.prog : sngLabState().prog.slice(0, 4), bpm: d.bpm, beats: d.beats,
    notes: d.notes.map(n => Object.assign({why: ['from the Seedbank']}, n)), createdAt: new Date().toISOString()};
  st.melodies.unshift(m); sngUi().melodyId = m.id; saveNow();
  navigate('#/songwriting/tool/melody-sketcher');
}
/* read-only notation, and the Play-it feedback on the same melody, in a modal of its own */
function studioMelodyModal(m, regId, record, check){
  const xml = studioMelodyXml(m);
  const mod = openModal(`<h2 class="serif">${esc(m.name)}</h2>
    <p class="faint">${check ? 'Play it on the piano; each note is marked as you go.' : 'A read-only engraving of this melody.'} It is drawn from the melody’s notes each time; nothing here is saved.</p>
    <div class="jz-stage-box"><div class="jz-score" id="jzScore"><div class="faint">Drawing…</div></div></div>
    ${check && typeof lfPanelHTML === 'function' ? (() => { _lfEx[regId] = {ex: {id: regId, name: m.name, category: 'melody', description: 'your own'}, record}; return lfPanelHTML(regId); })() : ''}`, 'wide');
  const box = mod.querySelector('#jzScore');
  Promise.resolve(jazzEngrave(box, xml)).then(() => { if(check && typeof bindLfPanel === 'function') bindLfPanel(mod, regId); });
  return mod;
}
function studioMelodyButtonsHTML(id){
  return `<span class="studio-melbtns"><button class="tbtn" data-studio-notation="${esc(id)}" title="Draw this melody as written music (read-only)">Show as notation</button>
    <button class="tbtn" data-studio-check="${esc(id)}" title="Play it on the piano and see each note marked">Check me on the piano</button></span>`;
}
/* the Seedbank's melody seeds: notation, the piano check, re-sounding and "open in the Melody Sketcher" */
function studioSeedMelodyButtonsHTML(s){
  if(!studioSeedMelody(s)) return '';
  return `<button class="tbtn" data-studio-seedhear="${esc(s.id)}">▶ hear it</button>
    <button class="tbtn" data-studio-seedsketch="${esc(s.id)}">Open in the Melody Sketcher</button>${studioMelodyButtonsHTML('seed:' + s.id)}`;
}
function studioBindMelodyButtons(root){
  const st = sngState();
  const melodyOf = id => {
    const [kind, ref] = [id.slice(0, id.indexOf(':')), id.slice(id.indexOf(':') + 1)];
    if(kind === 'seed'){ const s = st.seeds.find(x => x.id === ref); return s ? {m: studioSeedMelody(s), holder: s} : null; }
    const m = st.melodies.find(x => x.id === ref); return m ? {m, holder: m} : null;
  };
  const open = (id, check) => { const r = melodyOf(id); if(!r || !r.m){ toast('That melody is no longer there.'); return; }
    studioMelodyModal(r.m, 'mel:' + id, () => { r.holder.keys = r.holder.keys || {}; r.holder.heard = r.holder.heard || []; return r.holder; }, check); };
  root.querySelectorAll('[data-studio-notation]').forEach(b => b.onclick = () => open(b.dataset.studioNotation, false));
  root.querySelectorAll('[data-studio-check]').forEach(b => b.onclick = () => open(b.dataset.studioCheck, true));
  root.querySelectorAll('[data-studio-seedhear]').forEach(b => b.onclick = () => { const s = st.seeds.find(x => x.id === b.dataset.studioSeedhear), m = s && studioSeedMelody(s); if(m) sngPlayMelodyOver(m); });
  root.querySelectorAll('[data-studio-seedsketch]').forEach(b => b.onclick = () => { const s = st.seeds.find(x => x.id === b.dataset.studioSeedsketch); if(s) studioOpenSeedMelodyInSketcher(s); });
}

/* ---------- a recorded take, kept as a voice-memo seed ----------
   The sound is not copied and never goes into the seed's JSON: the seed holds a reference
   to the Jazz Studio's recording (store jazzAudio, by id), and plays it from there. If the
   take is deleted, the memo says so rather than failing. Both stores stay on this device. */
const STUDIO_LOCAL_NOTE = 'Kept on this device only. Not in your backup — export notes, MIDI or MusicXML to take it elsewhere.';
function studioDeviceLocalNote(){ return `<p class="studio-local faint" role="note">${STUDIO_LOCAL_NOTE}</p>`; }
function studioMemoSeedFromTake(rec){
  const audioId = rec.audioId || rec.vocalId || rec.pianoId;
  if(!audioId) return null;
  const when = `${rec.day || ''} ${rec.at ? new Date(rec.at).toTimeString().slice(0, 5) : ''}`.trim();
  return sngSeed({type: 'memo', content: `${rec.title || 'A take'}${when ? ' — ' + when : ''}`, audioRef: {store: 'jazzAudio', id: audioId},
    source: {room: 'jazz', kind: 'recording', id: rec.id}, tags: ['from jazz', 'recorded']});
}
function studioSeedMemoRefHTML(s){
  if(!(s && s.type === 'memo' && s.audioRef)) return '';
  return `<button class="tbtn" data-studio-memoref="${esc(s.id)}">▶ play</button>${studioDeviceLocalNote()}`;
}
function studioBindMemoRefs(root){
  root.querySelectorAll('[data-studio-memoref]').forEach(b => b.onclick = async () => {
    const s = sngState().seeds.find(x => x.id === b.dataset.studioMemoref); if(!s || !s.audioRef) return;
    const blob = await jazzGetAudio(s.audioRef.id);
    if(!blob){ toast('That take is no longer on this device — it was deleted in the Jazz Studio, or this is another device.', 5000); return; }
    const a = new Audio(URL.createObjectURL(blob)); a.play().catch(() => toast('This browser would not play it.')); });
}
function studioTakeSeedButtonHTML(rec){
  return rec && (rec.audioId || rec.vocalId || rec.pianoId) ? `<button class="tbtn" data-studio-takeseed="${esc(rec.id)}" title="Keep a pointer to this take in the Songwriting Seedbank — the sound stays here">Keep as a voice-memo seed</button>` : '';
}
function studioBindTakeSeeds(root){
  root.querySelectorAll('[data-studio-takeseed]').forEach(b => b.onclick = () => {
    const rec = (typeof jazzRecordings === 'function' ? jazzRecordings() : []).find(r => r.id === b.dataset.studioTakeseed);
    const s = rec && studioMemoSeedFromTake(rec);
    if(s){ sound('success'); toast('A pointer to the take is in the Seedbank; the sound stays on this device.'); } else toast('That take has no sound to point to.'); });
}

/* ---------- "A seed (Songwriting Seedbank)" from any Jazz page ----------
   Prefilled from where you are: the tune (and the bars you are looping), the exercise in the
   key shown, or nothing. The seed carries a source that points home. Nothing is kept until "Keep it". */
function studioProgressionSeedData(p, styleId){
  const chords = p.romans.map(r => sngParseRoman(r) || {roman: r, root: 0, quality: 'maj'});
  return {chords, keyPc: p.keyPc, colour: p.colour, styleId: styleId || 'jazz-swing', bpm: 120};
}
function studioJazzSeedPrefill(){
  let h = null; try { h = parseHash(); } catch(e){}
  const a = h && h.name === 'jazz' ? (h.params || [])[0] : null, b = h && h.name === 'jazz' ? (h.params || [])[1] : null;
  const bare = {type: 'line', content: '', tags: ['from jazz'], source: {room: 'jazz', kind: 'page', id: a || ''}, data: null, from: 'the Jazz Studio'};
  try {
    if(a === 'tune' && b && typeof jazzTune === 'function'){
      const t = jazzTune(b); if(!t) return bare;
      const P = jazzPracFor(t.id), l = P && P.loop && P.loop.length === 2 ? P.loop : null;
      const p = studioTuneProgression(t, l ? l[0] : null, l ? l[1] : null);
      if(!p.romans.length) return Object.assign(bare, {content: t.title, source: {room: 'jazz', kind: 'tune', id: t.id}, from: t.title});
      return {type: 'progression', content: `${p.romans.join('–')} in ${studioKeyName(p.keyPc)} — from ${t.title}${l ? `, bars ${l[0]}–${l[1]}` : ''}`,
        tags: [p.colour, 'from jazz'], source: {room: 'jazz', kind: 'tune', id: t.id, bars: [p.from, p.to]}, data: studioProgressionSeedData(p), from: t.title};
    }
    if(a && typeof jazzExercise === 'function' && jazzExercise(a)){
      const ex = jazzExercise(a), key = (jazzUi().key) || 'C', p = studioExerciseProgression(a, key);
      if(p) return {type: 'progression', content: `${p.romans.join('–')} in ${studioKeyName(p.keyPc)} — from ${ex.name}`, tags: [p.colour, 'from jazz'],
        source: {room: 'jazz', kind: 'exercise', id: a}, data: studioProgressionSeedData(p), from: ex.name};
      return Object.assign(bare, {content: ex.name, source: {room: 'jazz', kind: 'exercise', id: a}, from: ex.name});
    }
  } catch(e){ console.warn('the seed form could not read where you are', e); }
  return bare;
}
function studioJazzSeedForm(){
  const pre = studioJazzSeedPrefill();
  const m = openModal(`<h2>🌱 A seed <span class="faint">for the Songwriting Seedbank</span></h2>
    <p class="faint">From ${esc(pre.from)}. It is kept with a way back here.</p>
    <label class="sng-field"><span>What</span><textarea class="inp sng-ta" rows="3" id="stSeedC">${esc(pre.content)}</textarea></label>
    <div class="sng-row"><select class="inp" id="stSeedT">${SNG_SEED_TYPES.filter(t => t[0] !== 'memo').map(([k, n]) => `<option value="${k}"${pre.type === k ? ' selected' : ''}>${n}</option>`).join('')}</select>
      <input class="inp" id="stSeedTags" placeholder="tags, comma separated" value="${esc(pre.tags.join(', '))}"></div>
    <button class="btn primary" id="stSeedOk">Keep it</button>`);
  m.querySelector('#stSeedC').focus();
  m.querySelector('#stSeedOk').onclick = () => {
    const type = m.querySelector('#stSeedT').value;
    const s = sngSeed({type, content: m.querySelector('#stSeedC').value, source: pre.source, data: type === pre.type ? pre.data : null,
      tags: m.querySelector('#stSeedTags').value.split(',').map(x => x.trim()).filter(Boolean)});
    m.remove(); if(s){ sound('success'); toast('In the Seedbank.'); } };
}
(function studioJazzQuickAdd(){
  const f = routes.jazz;
  if(typeof f !== 'function' || f._studioAdd) return;
  const g = function(root, params){
    const out = f.apply(this, arguments);
    try { registerPageEntry({pageName: 'Jazz Studio', addLabel: 'Add', defaultEntryType: 'session', prefilledFields: {}, options: [
      {icon: '🌱', label: 'A seed (Songwriting Seedbank)', desc: 'A line, a progression or an idea from here, kept with a way back.', run: () => studioJazzSeedForm()}]}); } catch(e){}
    return out;
  };
  g._studio = f._studio; g._studioAdd = true; routes.jazz = g;
})();
