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
  return mel + strip;
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
    const chords = p.romans.map(r => sngParseRoman(r) || {roman: r, root: 0, quality: 'maj'});
    const s = sngSeed({type: 'progression', content: `${p.romans.join('–')} in ${studioKeyName(p.keyPc)} — from ${t.title}${l ? `, bars ${l[0]}–${l[1]}` : ''}`,
      source: {room: 'jazz', kind: 'tune', id: t.id, bars: [p.from, p.to]}, tags: [p.colour, 'from jazz'],
      data: {chords, keyPc: p.keyPc, colour: p.colour, styleId: 'jazz-swing', bpm: 120}});
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
