/* ============================================================
   THE PIANO STUDIO — what you play, and what you have internalised.

   Two systems that share a bench. The Repertoire is the music stand: the
   pieces you can play, the ones you are learning, the ones going quietly
   rusty because you have not touched them since August. The Jazz Lab is
   the other kind of practice entirely — not pieces but vocabulary, tracked
   across twelve keys, because a voicing you can only play in C is a voicing
   you cannot play.

   They are kept apart because they answer different questions. "What could
   I play if somebody asked me right now" is a repertoire question. "Can I
   hear a ii-V-I in Ab and put my hands on it without thinking" is not.
   ============================================================ */

const PIANO_GENRES = [
  ['classical','Classical'], ['jazz_standard','Jazz standard'], ['pop','Pop'],
  ['film_score','Film score'], ['original','Original'], ['musical_theatre','Musical theatre'],
  ['other','Other']];
/* The lifecycle of a piece, in the order it is usually travelled. "Rusty" is
   the one nobody chooses — it is arrived at by not practising, and the studio
   works it out for itself. */
const PIANO_STATUSES = [
  ['want_to_learn','Want to learn',    '○', 'on the list, not yet opened'],
  ['learning','Learning',              '◐', 'under the hands now'],
  ['performance_ready','Performance ready','●', 'you could play it if asked'],
  ['polished','Polished',              '◉', 'it is yours'],
  ['rusty','Rusty',                    '◌', 'it was yours, and it is slipping'],
  ['archived','Archived',              '·', 'put away on purpose']];
const PIANO_DIFFICULTIES = [
  ['comfortable','Comfortable','inside what your hands already do'],
  ['stretching','Stretching','just past it, which is where you grow'],
  ['aspirational','Aspirational','a year of work, and worth it']];
/* five steps from untouched to performable, for a named passage */
const PIANO_READINESS = [
  ['not_started','Not started', 0],
  ['rough','Rough', 1],
  ['working','Working', 2],
  ['solid','Solid', 3],
  ['polished','Polished', 4]];
const PIANO_QUALITIES = [
  ['rough','Rough'], ['okay','Okay'], ['good','Good'], ['flowing','Flowing'], ['transcendent','Transcendent']];
/* the twelve, in the order of the circle of fifths, because that is the order
   they are learned in and the order the wheel draws them */
const PIANO_KEYS = ['C','G','D','A','E','B','Gb','Db','Ab','Eb','Bb','F'];
/* Six degrees of having something in your hands. The gap that matters is
   between "comfortable" and "fluent": comfortable is you thinking about it
   and getting it right; fluent is you not thinking about it. */
const PIANO_FLUENCY = [
  ['cant_do',"Can't do",        0, '#b8b0a6'],
  ['aware','Aware',             1, '#c98b7a'],
  ['practicing','Practising',   2, '#d8a45f'],
  ['comfortable','Comfortable', 3, '#c9bd63'],
  ['fluent','Fluent',           4, '#8fa86a'],
  ['second_nature','Second nature', 5, '#7fa2a8']];
const PIANO_CONCEPT_TYPES = [
  ['keyboard_drill','Keyboard drill','twelve keys, a tempo, and how it feels'],
  ['voicing_type','Voicing','twelve keys against each chord quality'],
  ['transcription','Transcription','what you took off a record, by ear'],
  ['listening','Listening','what you studied, and what stayed'],
  ['vocal_technique','Vocal technique','syllables, phrasing, swing'],
  ['composition','Composition','what you wrote'],
  ['live_performance','Live','what you played in a room with other people']];
const PIANO_CHORD_QUALITIES = ['maj7','min7','dom7','half-dim'];

const pianoFluency = id => PIANO_FLUENCY.find(f => f[0] === id) || PIANO_FLUENCY[0];
const pianoStatus = id => PIANO_STATUSES.find(s => s[0] === id) || PIANO_STATUSES[0];
const pianoReadiness = id => PIANO_READINESS.find(r => r[0] === id) || PIANO_READINESS[0];
const pianoGenreName = id => (PIANO_GENRES.find(g => g[0] === id) || ['other','Other'])[1];

/* ---------- storage ----------
   Built lazily, the way the planner's is: a room nobody has opened yet costs
   nothing, and a save from an older version cannot be missing a field. */
function pianoState(){
  if(!S.piano) S.piano = {};
  const p = S.piano;
  p.pieces        = Array.isArray(p.pieces) ? p.pieces : [];
  p.practiceLogs  = Array.isArray(p.practiceLogs) ? p.practiceLogs : [];
  p.setlists      = Array.isArray(p.setlists) ? p.setlists : [];
  p.jazz          = p.jazz && typeof p.jazz === 'object' ? p.jazz : {};
  p.jazz.phases   = Array.isArray(p.jazz.phases) && p.jazz.phases.length
    ? p.jazz.phases : pianoDefaultRoadmap();
  p.jazz.audiation = Array.isArray(p.jazz.audiation) && p.jazz.audiation.length
    ? p.jazz.audiation : pianoDefaultAudiation();
  p.jazz.resources = Array.isArray(p.jazz.resources) && p.jazz.resources.length
    ? p.jazz.resources : pianoDefaultResources();
  p.jazz.logs     = Array.isArray(p.jazz.logs) ? p.jazz.logs : [];
  p.jazz.jams     = Array.isArray(p.jazz.jams) ? p.jazz.jams : [];
  p.settings = Object.assign({rustThresholdDays:30, defaultPracticeMinutes:30, tab:'repertoire',
    practiceCount:0, playCount:0}, p.settings || {});
  p.pieces.forEach(pianoPieceDefaults);
  return p;
}
function pianoPieceDefaults(x){
  x.id = x.id || uid();
  x.title = x.title || '';
  x.composer = x.composer || '';
  x.arranger = x.arranger || '';
  x.genre = PIANO_GENRES.some(g => g[0] === x.genre) ? x.genre : 'other';
  x.status = PIANO_STATUSES.some(s => s[0] === x.status) ? x.status : 'want_to_learn';
  x.difficulty = ['comfortable','stretching','aspirational'].includes(x.difficulty) ? x.difficulty : 'stretching';
  x.key = x.key || '';
  x.tempo = x.tempo || '';
  x.targetBpm = x.targetBpm == null ? null : +x.targetBpm;
  x.timeSignature = x.timeSignature || '';
  x.duration = x.duration == null ? null : +x.duration;
  x.dateAdded = x.dateAdded || new Date().toISOString();
  x.startedAt = x.startedAt || null;
  x.readyAt = x.readyAt || null;
  x.sheetUrl = x.sheetUrl || '';
  x.notes = x.notes || '';
  x.sections = Array.isArray(x.sections) ? x.sections : [];
  x.sections.forEach(s => { s.id = s.id || uid(); s.name = s.name || '';
    s.readiness = PIANO_READINESS.some(r => r[0] === s.readiness) ? s.readiness : 'not_started';
    s.notes = s.notes || ''; });
  x.emotionalTag = x.emotionalTag || '';
  x.tags = Array.isArray(x.tags) ? x.tags : [];
  x.peopleIds = Array.isArray(x.peopleIds) ? x.peopleIds : [];
  x.projectId = x.projectId || null;
  if(x.sortOrder == null) x.sortOrder = Date.now();
  return x;
}
function newPiece(title = ''){
  return pianoPieceDefaults({id:uid(), title, dateAdded:new Date().toISOString()});
}
const pianoPieces = () => pianoState().pieces;
const pianoPiece = id => byId(pianoState().pieces, id);
const pianoLogs = () => pianoState().practiceLogs;
const pianoLogsFor = id => pianoLogs().filter(l => l.pieceId === id)
  .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

/* ---------- when a piece was last touched, and whether it is going ----------
   Rust is not a status somebody sets; it is a fact about a date. So it is
   computed rather than stored, and `status` keeps whatever the player last
   said about the piece — which is what you want back when you practise it
   again and it stops being rusty. */
function pianoLastPracticed(id){
  const ls = pianoLogsFor(id);
  return ls.length ? ls[0].date : null;
}
function pianoDaysSince(id){
  const d = pianoLastPracticed(id);
  return d ? Math.max(0, daysBetween(d, today())) : null;
}
function pianoIsRusty(x){
  if(!x || x.status === 'archived' || x.status === 'want_to_learn' || x.status === 'learning') return false;
  const n = pianoDaysSince(x.id);
  return n != null && n > (pianoState().settings.rustThresholdDays || 30);
}
/* what the piece is called in a list: its own status, unless the calendar
   has overruled it */
const pianoShownStatus = x => pianoIsRusty(x) ? 'rusty' : x.status;
const pianoIsReady = x => ['performance_ready','polished'].includes(pianoShownStatus(x));
/* how far through its own sections a piece is, 0..1 */
function pianoSectionProgress(x){
  const ss = x.sections || [];
  if(!ss.length) return null;
  const got = sum(ss.map(s => pianoReadiness(s.readiness)[2]));
  return got / (ss.length * 4);
}
function pianoTotalMinutes(id){
  return sum(pianoLogsFor(id).map(l => +l.durationMinutes || 0));
}
/* every BPM anybody wrote down for a piece, oldest first, for the climb */
function pianoBpmSeries(id){
  return pianoLogsFor(id).filter(l => +l.currentBpm > 0)
    .map(l => ({date:l.date, bpm:+l.currentBpm}))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/* ---------- setlists ---------- */
const pianoSetlists = () => pianoState().setlists;
const pianoSetlist = id => byId(pianoState().setlists, id);
function newSetlist(name = ''){
  return {id:uid(), name, pieces:[], tags:[], createdAt:new Date().toISOString(), lastUsed:null};
}
function setlistMinutes(sl){
  return sum((sl.pieces || []).map(p => +(pianoPiece(p.pieceId)?.duration) || 0));
}
/* what is wrong with the set, in the order you would want to be told */
function setlistWarnings(sl){
  const out = [];
  const rows = (sl.pieces || []).map(p => pianoPiece(p.pieceId)).filter(Boolean);
  const rusty = rows.filter(pianoIsRusty).length;
  const learning = rows.filter(x => x.status === 'learning' || x.status === 'want_to_learn').length;
  if(rusty) out.push(`${rusty} ${rusty === 1 ? 'piece is' : 'pieces are'} rusty`);
  if(learning) out.push(`${learning} still learning`);
  return out;
}

/* ---------- what to practise ----------
   Three claims on the time, in this order: what you are about to lose, what
   you are in the middle of learning, and what stays good only because you keep
   playing it. The split is 30 / 40 / 30 of a planned portion that is smaller
   than the whole sitting — the free minutes at the end are deliberate, because
   a practice plan that accounts for every minute is a plan you stop keeping,
   and because the thing you actually want to play is worth some of the time.

   Minutes are rounded down as they are taken and the remainder is what is
   left, so the plan can never add up to more than you said you had. */
const PIANO_PLANNED_SHARE = 0.8;
function pianoSuggestPractice(minutes){
  const budget = Math.max(5, +minutes || pianoState().settings.defaultPracticeMinutes || 30);
  const planned = budget * PIANO_PLANNED_SHARE;
  const all = pianoPieces().filter(x => x.status !== 'archived');
  const out = [];
  const spend = (kind, x, mins, why) => { if(mins < 2) return; out.push({kind, piece:x, minutes:mins, why}); };

  const rusty = all.filter(pianoIsRusty)
    .sort((a, b) => (pianoDaysSince(b.id) || 0) - (pianoDaysSince(a.id) || 0));
  const learning = all.filter(x => x.status === 'learning')
    .sort((a, b) => pianoWeakCount(b) - pianoWeakCount(a));
  const keep = all.filter(x => pianoIsReady(x) && !pianoIsRusty(x))
    .sort((a, b) => (pianoDaysSince(b.id) ?? 9e9) - (pianoDaysSince(a.id) ?? 9e9));

  let left = budget;
  const take = n => { const got = Math.max(0, Math.min(left, Math.floor(n))); left -= got; return got; };
  rusty.slice(0, 2).forEach(x => { const n = pianoDaysSince(x.id);
    spend('maintenance', x, take(planned * 0.3 / Math.min(2, rusty.length)),
      `${n} days since you last played it — this is the one you are about to lose`); });
  learning.slice(0, 2).forEach(x => { const weak = pianoWeakest(x);
    spend('learning', x, take(planned * 0.4 / Math.min(2, learning.length)),
      weak ? `${weak.name} is the weakest of its ${x.sections.length} sections` : 'the whole of it, slowly'); });
  keep.slice(0, 2).forEach(x => { const n = pianoDaysSince(x.id);
    spend('runthrough', x, take(planned * 0.3 / Math.min(2, keep.length)),
      n == null ? 'never logged — play it once and write down how it went' : `last played ${n} days ago — one run keeps it`); });
  /* whatever the three claims did not take, including anything they were too
     small to spend, is yours */
  return {items: out, free: Math.max(0, budget - sum(out.map(i => i.minutes))), budget};
}
const pianoWeakCount = x => (x.sections || []).filter(s => s.readiness === 'rough' || s.readiness === 'not_started').length;
function pianoWeakest(x){
  const ss = (x.sections || []).slice().sort((a, b) => pianoReadiness(a.readiness)[2] - pianoReadiness(b.readiness)[2]);
  return ss[0] || null;
}

/* ---------- the jazz side ---------- */
const pianoPhases = () => pianoState().jazz.phases;
function pianoAllStages(){ return pianoPhases().flatMap(ph => (ph.stages || []).map(s => ({stage:s, phase:ph}))); }
function pianoStage(id){ return pianoAllStages().find(x => x.stage.id === id)?.stage || null; }
function pianoConcept(id){
  for(const {stage} of pianoAllStages()){ const c = byId(stage.concepts || [], id); if(c) return c; }
  return null;
}
function pianoConceptStage(id){
  for(const {stage, phase} of pianoAllStages()) if((stage.concepts || []).some(c => c.id === id)) return {stage, phase};
  return null;
}
/* A concept's twelve keys, always all twelve, whatever the record holds. */
function pianoKeyMastery(c){
  c.keys = c.keys && typeof c.keys === 'object' ? c.keys : {};
  PIANO_KEYS.forEach(k => { if(!PIANO_FLUENCY.some(f => f[0] === c.keys[k])) c.keys[k] = 'cant_do'; });
  return c.keys;
}
function pianoKeyCounts(c){
  const keys = pianoKeyMastery(c);
  const out = {};
  PIANO_FLUENCY.forEach(f => out[f[0]] = 0);
  PIANO_KEYS.forEach(k => out[keys[k]]++);
  return out;
}
/* One number for a concept: the average rung of its twelve keys, 0..1. A
   concept that is not about keys at all is scored on its own fluency instead,
   because "transcribed four solos" has no key. */
function pianoConceptProgress(c){
  if(!pianoIsKeyed(c)) return pianoFluency(c.fluency)[2] / 5;
  const keys = pianoKeyMastery(c);
  return sum(PIANO_KEYS.map(k => pianoFluency(keys[k])[2])) / (PIANO_KEYS.length * 5);
}
const pianoIsKeyed = c => c && (c.type === 'keyboard_drill' || c.type === 'voicing_type');
function pianoStageProgress(st){
  const cs = st.concepts || [];
  if(!cs.length) return st.status === 'completed' ? 1 : 0;
  return sum(cs.map(pianoConceptProgress)) / cs.length;
}
function pianoPhaseProgress(ph){
  const ss = ph.stages || [];
  return ss.length ? sum(ss.map(pianoStageProgress)) / ss.length : 0;
}
/* the keys a concept is worst at, for "practise the weakest" */
function pianoWeakKeys(c, n = 4){
  const keys = pianoKeyMastery(c);
  return PIANO_KEYS.slice().sort((a, b) => pianoFluency(keys[a])[2] - pianoFluency(keys[b])[2]).slice(0, n);
}
/* Logging a sitting raises every key it touched by one rung, at most to
   fluent. The last rung is not something a log can give you: "second nature"
   is a claim about not thinking, and only the player can say it, on the key's
   own little panel. */
function pianoRaiseKey(c, key){
  const keys = pianoKeyMastery(c);
  const i = pianoFluency(keys[key])[2];
  if(i < 4) keys[key] = PIANO_FLUENCY[i + 1][0];
  return keys[key];
}
function pianoLogJazz(rec){
  const p = pianoState();
  const log = Object.assign({id:uid(), date:today(), durationMinutes:30, conceptId:null,
    keys:[], quality:'good', bpm:null, notes:'', mode:'practice'}, rec || {});
  p.jazz.logs.push(log);
  const c = log.conceptId ? pianoConcept(log.conceptId) : null;
  if(c){
    (log.keys || []).forEach(k => pianoRaiseKey(c, k));
    c.lastPracticed = log.date;
    c.practiceCount = (+c.practiceCount || 0) + 1;
    if(log.bpm) c.bpm = Object.assign({}, c.bpm, {max: Math.max(+c.bpm?.max || 0, +log.bpm)});
    /* a concept being worked on drags its stage out of "not started" */
    const owner = pianoConceptStage(c.id);
    if(owner && owner.stage.status === 'not_started') owner.stage.status = 'in_progress';
    if(owner && owner.phase.status === 'not_started') owner.phase.status = 'in_progress';
  }
  if(log.mode === 'play') p.settings.playCount = (+p.settings.playCount || 0) + 1;
  else p.settings.practiceCount = (+p.settings.practiceCount || 0) + 1;
  saveNow();
  return log;
}
/* Werner: practice and play are different activities, and the second one is
   the one that gets skipped. The ratio is reported rather than enforced. */
function pianoPlayRatio(){
  const s = pianoState().settings;
  const pr = +s.practiceCount || 0, pl = +s.playCount || 0;
  return {practice:pr, play:pl, total:pr + pl, share: (pr + pl) ? pl / (pr + pl) : 0};
}
