/* ============================================================
   THE JAPANESE STUDIO — one room around one question.

   Not "do I know more Japanese" but "can I say it, now, without the sentence
   assembling itself in my head first". Everything here is built on the
   research the specification cites, and the parts that matter most are the
   ones that are least like a textbook: the shrinking clock, the memorised
   islands you can stand on while you think, and the one diagnostic that
   actually predicts fluency — where your pauses fall.

   It used to have five tabs — a grammar ladder, a chunk bank, a writing desk
   and a dashboard over the top of them. They are gone. Four of the five were
   about knowing more Japanese, which is the thing this room is explicitly
   not for, and a studio you have to choose a tab in before you can do
   anything is a studio you open less often. What is left is the mouth.
   ============================================================ */

const JA_QUALITY = [['rough','Rough'], ['okay','Okay'], ['good','Good'], ['flowing','Flowing']];
/* The single most telling thing about a spoken minute. A native pauses
   between clauses, to plan the next one; a learner pauses inside a clause,
   because the grammar is still being assembled. Watching that move is
   watching the grammar become automatic. */
const JA_PAUSE = [
  ['mostly_mid_clause', 'Mostly mid-clause', 'the sentence is still being built as you speak'],
  ['mixed',             'Mixed',             'some of each'],
  ['mostly_boundary',   'Mostly at boundaries', 'you pause to plan, not to assemble — this is the destination']];
const JA_ISLAND_STATUS = [
  ['drafting','Drafting','written in English, not yet Japanese'],
  ['corrected','Corrected','a native has been over it'],
  ['memorizing','Memorising','learning it by heart'],
  ['automatic','Automatic','it comes out without you deciding to']];
const JA_ERROR_TYPES = ['particle','conjugation','word order','vocabulary','register','pitch accent','expression','other'];
const JA_PARTNERS = [['solo','Solo','recorded, alone'], ['ai','AI','a machine'], ['human','Human','a person']];
/* Kadota's loop, as four questions you can honestly answer about a shadowing
   take. They are separate because they fail separately: you can hear every
   word and still not get your mouth round it. */
const JA_IPOM = [
  ['input','Input','Could I parse the words?'],
  ['practice','Practice','Could I hold the phrase long enough to say it?'],
  ['output','Output','Could my mouth keep up?'],
  ['monitoring','Monitoring','Could I hear my own errors as they happened?']];
/* Nation's four. The rule is the interesting part: nothing above a quarter,
   nothing below about a sixth, and the strand people starve is always the
   fourth one. */
const JA_STRANDS = [
  ['input','Meaning-focused input','listening and reading for the message'],
  ['output','Meaning-focused output','speaking and writing to be understood'],
  ['study','Language-focused learning','deliberate study of the items themselves'],
  ['fluency','Fluency development','known material only, pushed for speed']];
const JA_SCENARIOS_DEFAULT = [
  ['Self-introduction','daily_life','beginner'], ['Convenience store','daily_life','beginner'],
  ['Restaurant','daily_life','beginner'], ['Asking directions','daily_life','beginner'],
  ['At the doctor','daily_life','intermediate'], ['A phone call','social','intermediate'],
  ['At work','professional','intermediate'], ['Holding an opinion','abstract','advanced']];
/* Shekhtman's seven, which are not grammar at all — they are what to do when
   the grammar runs out mid-sentence. */
const JA_TOOLS = [
  ['Show your stuff','Steer the conversation to what you can already say well.'],
  ['Build islands','Have the monologue ready before you need it.'],
  ['Shift gears','Turn away from the word you do not know, towards one you do.'],
  ['Simplify','Break the English thought down before translating it.'],
  ['Break away','Leave a dead end politely rather than drowning in it.'],
  ['Embellish','Fillers, intensifiers, feeling — a simple sentence said like a person.'],
  ['Say what?','Ask for the repeat properly, so the conversation survives it.']];

function jaState(){
  if(!S.japanese) S.japanese = {};
  const j = S.japanese;
  j.sessions   = Array.isArray(j.sessions) ? j.sessions : [];
  j.islands    = Array.isArray(j.islands) ? j.islands : [];
  j.scenarios  = Array.isArray(j.scenarios) && j.scenarios.length ? j.scenarios
    : JA_SCENARIOS_DEFAULT.map(([name, category, difficulty], i) =>
        ({id:uid(), name, category, difficulty, order:i, script:'', myLines:'',
          corrected:false, times:0, lastDone:null, errorIds:[]}));
  j.shadowing  = Array.isArray(j.shadowing) ? j.shadowing : [];
  j.errors     = Array.isArray(j.errors) ? j.errors : [];
  j.strands    = Array.isArray(j.strands) ? j.strands : [];
  /* The grammar points, chunks, written pieces and translations of the four
     retired rooms are deliberately not touched. Nothing reads them any more,
     but a save is somebody's writing and closing a room is no reason to
     delete it out from under them. */
  j.settings   = Object.assign({aiWarnAt:0.8, playTarget:0.4, hoursGoal:5}, j.settings || {});
  return j;
}

/* ---------- what the numbers say ---------- */
const jaSessions = () => jaState().sessions;
const jaIn = (list, from, to) => list.filter(x => (x.date || '') >= from && (x.date || '') <= to);
/* A 4/3/2 session is three deliveries of one talk. What it is for is the
   difference between the first and the last: the content is fixed, so
   anything that improves is the machinery, not the material. */
function jaSessionGain(s){
  const d = (s.deliveries || []).filter(x => +x.wpm > 0);
  if(d.length < 2) return null;
  const first = +d[0].wpm, last = +d[d.length - 1].wpm;
  return {first, last, pct: first ? Math.round((last - first) / first * 100) : 0};
}
function jaWpmSeries(){
  return jaSessions().filter(s => (s.deliveries || []).some(d => +d.wpm > 0))
    .map(s => { const d = (s.deliveries || []).filter(x => +x.wpm > 0);
      return {date:s.date, wpm: Math.round(sum(d.map(x => +x.wpm)) / d.length)}; })
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
}
function jaPauseSeries(){
  return jaSessions().filter(s => s.pauseLocation)
    .map(s => ({date:s.date, mid: s.pauseLocation === 'mostly_mid_clause' ? 1
      : s.pauseLocation === 'mixed' ? 0.5 : 0}))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
}
/* The holy-grail metric, as a share over a window: how much of your pausing
   is still happening inside clauses. Down is the direction. */
function jaMidClauseShare(from, to){
  const rows = jaIn(jaSessions().filter(s => s.pauseLocation), from, to);
  if(!rows.length) return null;
  return sum(rows.map(s => s.pauseLocation === 'mostly_mid_clause' ? 1
    : s.pauseLocation === 'mixed' ? 0.5 : 0)) / rows.length;
}
/* Accuracy is error rate per session, which is the only honest way to read an
   error log: logging more errors because you spoke more is not getting worse. */
function jaErrorRate(from, to){
  const ses = jaIn(jaSessions(), from, to).length;
  const errs = jaIn(jaState().errors, from, to).length;
  return ses ? errs / ses : null;
}
function jaTopPatterns(from, to, n = 3){
  const tally = {};
  jaIn(jaState().errors, from, to).forEach(e => {
    const k = (e.patternTag || e.errorType || 'other').trim().toLowerCase();
    if(k) tally[k] = (tally[k] || 0) + 1; });
  return Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, n);
}
/* Sustained practice against a machine produces a register that machines like
   and people do not: rigid, over-explicit, one intent per sentence. In a
   language that runs on omitted subjects and aizuchi, that is a real cost. */
function jaPartnerMix(weeks = 4){
  const from = addDays(today(), -7 * weeks);
  const rows = jaIn(jaSessions(), from, today());
  const by = {solo:0, ai:0, human:0};
  rows.forEach(s => { by[s.partnerType || 'solo'] = (by[s.partnerType || 'solo'] || 0) + 1; });
  const withPartner = by.ai + by.human;
  return {...by, total: rows.length, aiShare: withPartner ? by.ai / withPartner : 0, weeks};
}
const jaAiWarning = () => { const m = jaPartnerMix(4);
  return (m.ai + m.human) >= 4 && m.aiShare > jaState().settings.aiWarnAt ? m : null; };
function jaPlayMix(from, to){
  const rows = jaIn(jaSessions(), from, to);
  const play = rows.filter(s => s.sessionType === 'play').length;
  return {practice: rows.length - play, play, total: rows.length};
}
const jaStrandsLatest = () => jaState().strands.slice().sort((a, b) => (b.weekOf || '').localeCompare(a.weekOf || ''))[0] || null;
/* Nation's own limits, read back as a complaint rather than a score */
function jaStrandTrouble(a){
  if(!a) return [];
  const out = [];
  JA_STRANDS.forEach(([k, name]) => {
    const v = +a[k] || 0;
    if(k === 'study' && v > 30) out.push(`${name} is ${v}% — Nation's ceiling is about a quarter.`);
    if(k === 'fluency' && v < 20) out.push(`${name} is ${v}%. This is the strand nearly everybody starves, and it is the one that makes you sound fluent.`);
    else if(v > 40) out.push(`${name} is ${v}%, which is most of your time.`);
  });
  return out;
}
const jaIslands = () => jaState().islands;
const jaAutomatic = () => jaIslands().filter(i => i.status === 'automatic').length;
/* every hour at it, whatever it was */
function jaHours(from, to){
  const j = jaState();
  const mins = jaIn(j.sessions, from, to).length * 9        // a 4/3/2 is nine minutes of talking
    + sum(jaIn(j.shadowing, from, to).map(() => 15));
  return Math.round(mins / 6) / 10;
}
