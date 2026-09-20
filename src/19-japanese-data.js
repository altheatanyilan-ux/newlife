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
const JA_SCENARIOS_DEFAULT = [
  ['Self-introduction','daily_life','beginner'], ['Convenience store','daily_life','beginner'],
  ['Restaurant','daily_life','beginner'], ['Asking directions','daily_life','beginner'],
  ['At the doctor','daily_life','intermediate'], ['A phone call','social','intermediate'],
  ['At work','professional','intermediate'], ['Holding an opinion','abstract','advanced']];

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
  /* The strand audit and the machine-versus-human ratio came out with the
     dashboards that read them: both asked you to grade your week before you
     had done anything in it. The saved rows are left where they are. */
  /* Two of the four retired rooms have come back in a different shape, and
     their saves come back with them: the grammar points and the double
     translations are read by the new editors rather than replaced. The
     vocabulary bank and the written pieces are still here and still unread —
     a chunk in a global list has no topic to belong to, and inventing one
     would be putting words in somebody's mouth. */
  /* the three settings that steered the retired dashboards are gone with
     them; what is left is read by jaState2 */
  j.settings   = j.settings || {};
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
function jaTopPatterns(from, to, n = 3){
  const tally = {};
  jaIn(jaState().errors, from, to).forEach(e => {
    const k = (e.patternTag || e.errorType || 'other').trim().toLowerCase();
    if(k) tally[k] = (tally[k] || 0) + 1; });
  return Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, n);
}
const jaIslands = () => jaState().islands;
const jaAutomatic = () => jaIslands().filter(i => i.status === 'automatic').length;
/* Every hour at it, whatever it was. A sitting that was actually timed
   contributes what it actually took; one logged before the room had a clock
   in it contributes the nine minutes a full 4/3/2 comes to, which is a guess
   and is marked as one here rather than dressed up as a measurement. */
function jaHours(from, to){
  const j = jaState();
  const mins = sum(jaIn(j.sessions, from, to).map(s => {
    const real = sum((s.deliveries || []).map(d => (+d.seconds || 0) / 60));
    return real > 0 ? real : 9;
  })) + sum(jaIn(j.shadowing, from, to).map(() => 15));
  return Math.round(mins / 6) / 10;
}

/* ============================================================
   THE STUDIO, SECOND DRAFT.

   The first version of this room was built from the research: a grammar
   ladder with processability stages, a four-strands pie chart, a ratio of
   machine to human practice. The second is built from what actually happens
   in a practice hour — you record yourself talking, you listen back and
   write down what you said, you keep monologues in two registers because you
   need different ones for different people, you rebuild a Japanese text from
   your own English translation a day later, and everything you got wrong
   goes in one book that feeds the flashcards.

   Four rooms and a notebook, in a pipeline: a grammar point is drilled until
   it is mechanical, then used to say something true about your own life; that
   becomes an island; the island is pushed to speed against a shrinking clock;
   and translation, separately, keeps the structural knowledge honest.
   Everything that goes wrong anywhere lands in the notebook, and the notebook
   feeds back into the grammar drills and the Study Deck.

   NO MACHINE JUDGEMENT ANYWHERE. Every correction in this room comes from
   you, a tutor, or a native text. The room supplies structure, a clock, a
   recorder and a memory — not an opinion about your Japanese. The one piece
   of machinery that looks like an exception is the speech recogniser, and it
   is not one: what it produces is not a correction, it is a second opinion
   about what your mouth actually did, and the gap between what you meant and
   what it heard is itself the diagnostic.
   ============================================================ */

/* Where an error came from. The notebook is shared, and knowing which room
   produced an error is how the patterns become legible — five particle
   errors from translation and none from speaking is a different problem from
   the other way round. */
const JA_SOURCES = [
  ['432', 'the 4/3/2 drill'], ['island', 'an island'], ['translation', 'a translation'],
  ['grammar', 'a grammar drill'], ['manual', 'written down by hand']];
/* What a reconstruction can differ from the original in. Not a severity
   scale: a register mistake and a particle mistake are different kinds of
   wrong, and lumping them together loses the pattern. */
const JA_DIVERGENCE = ['vocabulary','grammar','particle','word order','register','expression'];
/* The shelves of the formulaic vault. These are not vocabulary — they are
   what to say while the sentence you want is still assembling itself, and
   having them by heart is the difference between a pause and a silence. */
const JA_STONE_SHELVES = [
  ['gear',   'Gear shifters',  '転換',        'turning the conversation somewhere you can go'],
  ['filler', 'Fillers',        '言葉の綾', 'time bought without the silence'],
  ['aizuchi','Aizuchi',        '相槌',        'the noises that prove you are listening'],
  ['simple', 'Simplifiers',    '要するに', 'saying the smaller version of the thought'],
  ['repair', 'Repair',         '直し',        'getting the conversation back when it breaks']];
/* Shipped with something on every shelf, because an empty vault teaches
   nothing and these are the twenty phrases every book starts with anyway. */
const JA_STONES_DEFAULT = [
  ['gear', 'ところで', 'by the way'],
  ['gear', '実は', 'actually'],
  ['gear', 'そういえば', 'come to think of it'],
  ['filler', 'なんというか', 'how should I put it'],
  ['filler', 'えーと', 'umm'],
  ['filler', 'そうですね', 'let me think'],
  ['filler', 'やっぱり', 'as expected'],
  ['aizuchi', 'そうですね', 'agreement'],
  ['aizuchi', 'へえ', 'surprise'],
  ['aizuchi', 'そうなんだ', 'empathy'],
  ['simple', '簡単に言うと', 'to put it simply'],
  ['simple', 'つまり', 'in other words'],
  ['repair', 'もう一度お願いします', 'once more, please'],
  ['repair', '日本語で何と言いますか', 'how do you say it in Japanese'],
];
/* How far a chunk has got. Two states rather than five, because the only
   question that matters about a phrase you need for a topic is whether it
   comes out or whether you have to reach for it. */
const JA_CHUNK_TYPES = ['single word','collocation','sentence frame','expression'];
/* A translation exercise, and where it is in its two passes. */
const JA_GRAMMAR_STATUS = [
  ['not_started','Not started','read, not drilled'],
  ['studying','Studying','working through it'],
  ['shaky','Shaky','right when I think about it'],
  ['solid','Solid','right without thinking about it'],
  ['automatic','Automatic','comes out on its own']];
const JA_DRILL_TYPES = [
  ['conjugation','Conjugation','a base form in, the conjugated form out'],
  ['gap_fill','Gap fill','a sentence with the point taken out of it'],
  ['transformation','Transformation','one structure in, another out'],
  ['particle','Particle','the missing particle']];

/* ---------- the shapes ---------- */
function jaIslandDefaults(i){
  i.id = i.id || uid();
  /* ---------- islands within islands ----------
     "My work" is not one monologue. It is the bar, the hours, why I left the
     last job, the regular who comes in on Thursdays — each of which is its
     own thing to be able to say, and each of which is useless as a heading
     under one enormous text. So an island can hold smaller islands, and a
     smaller island is an island: same shape, same registers, same chunks,
     same everything. It is one field rather than a second kind of record,
     which means a sub-island can be promoted to a full one by clearing it,
     and nothing else in the room has to learn a new noun. */
  i.parentId = i.parentId || null;
  /* the old shape had one topic and one Japanese text; both still read */
  i.topic = i.topic || i.topicEnglish || '';
  i.topicJapanese = i.topicJapanese || '';
  i.englishDraft = i.englishDraft || i.english || '';
  /* Two registers, because you need different ones for different people and
     keeping only the polite one means every casual conversation is delivered
     in a voice that sounds like a form letter. */
  i.japaneseTeineigo = i.japaneseTeineigo || i.japaneseText || '';
  i.japaneseTameguchi = i.japaneseTameguchi || '';
  i.status = JA_ISLAND_STATUS.some(v => v[0] === i.status) ? i.status : 'drafting';
  i.nativeVerified = !!i.nativeVerified;
  i.pitchMarked = !!i.pitchMarked;
  /* There used to be a box on the page asking what a tutor changed and why.
     It is gone. The field stays because anything written in it is somebody's
     writing and a version that quietly deletes it would be a version that
     eats work — it simply is not asked for any more. */
  i.correctionNotes = i.correctionNotes || '';
  /* The vocabulary this topic needs, kept with the topic rather than in one
     great list: a word you cannot produce matters here, in this monologue,
     and nowhere else. */
  i.chunks = Array.isArray(i.chunks) ? i.chunks : [];
  i.chunks.forEach(c => jaChunkDefaults(c, i.id));
  i.timesUsed = +i.timesUsed || 0;
  i.lastUsedDate = i.lastUsedDate || null;
  i.lastPracticed = i.lastPracticed || null;
  i.recordings = Array.isArray(i.recordings) ? i.recordings : [];
  /* Bumped every time the Japanese changes, so a recording made against an
     older wording is visibly a recording of something else. */
  i.version = +i.version || 1;
  i.createdAt = i.createdAt || new Date().toISOString();
  return i;
}
function jaChunkDefaults(c, islandId){
  c.id = c.id || uid();
  c.islandId = c.islandId || islandId || null;
  c.japanese = c.japanese || '';
  /* Worked out from the Japanese rather than typed. It is still a field
     because a reading you have corrected by hand must survive the next save,
     and because the table this room carries does not know every word. */
  c.reading = c.reading || '';
  c.meaning = c.meaning || '';
  c.type = JA_CHUNK_TYPES.includes(c.type) ? c.type : 'collocation';
  c.example = c.example || '';
  /* the only question worth asking about a phrase you need: does it come
     out, or do you have to reach for it */
  c.ready = !!c.ready;
  c.lastDrilled = c.lastDrilled || null;
  c.sentToDeck = !!c.sentToDeck;
  c.createdAt = c.createdAt || new Date().toISOString();
  return c;
}
/* The retired Grammar Journey kept its double translations under this same
   name and in nearly this same shape, so they are read rather than
   overwritten: a save is somebody's writing, and the exercise it describes is
   the same exercise. The old rows called the fields step1Date, step2Date,
   backTranslation and originalSource, and had no lock on them at all. */
function jaTranslationDefaults(t){
  t.id = t.id || uid();
  t.source = t.source || t.originalSource || '';
  t.originalJapanese = t.originalJapanese || '';
  t.title = t.title || (t.originalJapanese ? t.originalJapanese.slice(0, 18) : 'A text');
  t.userEnglish = t.userEnglish || '';
  t.userBackTranslation = t.userBackTranslation || t.backTranslation || '';
  t.pass1Date = t.pass1Date || t.step1Date || null;
  t.pass2Date = t.pass2Date || t.step2Date || null;
  /* an old row has no unlock time; it has been sitting there for weeks, so
     the wait it was supposed to have is long over */
  if(t.pass1Date && !t.unlocksAt) t.unlocksAt = new Date(Date.parse(t.pass1Date) + 864e5).toISOString();
  /* A real timestamp rather than a countdown: a countdown dies with the tab,
     and the whole point of the delay is that it outlasts the sitting. */
  t.unlocksAt = t.unlocksAt || null;
  t.divergences = Array.isArray(t.divergences) ? t.divergences : [];
  t.divergences.forEach(d => { d.id = d.id || uid();
    d.original = d.original || ''; d.mine = d.mine || '';
    d.kind = JA_DIVERGENCE.includes(d.kind) ? d.kind : 'vocabulary';
    d.note = d.note || ''; d.sentToNotebook = !!d.sentToNotebook; d.sentToDeck = !!d.sentToDeck; });
  t.createdAt = t.createdAt || new Date().toISOString();
  return t;
}
/* Same again for the grammar points: the retired room kept them under this
   name, with the level called jlptLevel and a processability stage beside it.
   The stage goes — that ladder is one of the three things this draft took
   out — and everything somebody actually wrote is kept. */
function jaGrammarDefaults(g){
  g.id = g.id || uid();
  g.name = g.name || 'A point';
  g.nameJapanese = g.nameJapanese || '';
  if(!g.jlpt && g.jlptLevel) g.jlpt = g.jlptLevel;
  g.jlpt = ['N5','N4','N3','N2','N1'].includes(g.jlpt) ? g.jlpt : null;
  g.formation = g.formation || '';
  g.usage = g.usage || '';
  g.examples = Array.isArray(g.examples) ? g.examples : [];
  g.myNotes = g.myNotes || '';
  g.drills = Array.isArray(g.drills) ? g.drills : [];
  g.drills.forEach((d, i) => { d.id = d.id || uid();
    d.type = JA_DRILL_TYPES.some(v => v[0] === d.type) ? d.type : 'conjugation';
    d.prompt = d.prompt || ''; d.answer = d.answer || ''; d.hint = d.hint || '';
    d.order = d.order == null ? i : d.order; });
  g.prompts = Array.isArray(g.prompts) ? g.prompts : [];
  g.prompts.forEach(q => { q.id = q.id || uid(); q.prompt = q.prompt || '';
    q.response = q.response || ''; q.date = q.date || null; });
  g.status = JA_GRAMMAR_STATUS.some(v => v[0] === g.status) ? g.status : 'not_started';
  g.lastDrilled = g.lastDrilled || null;
  g.score = g.score && typeof g.score === 'object' ? g.score : null;
  g.createdAt = g.createdAt || new Date().toISOString();
  return g;
}
/* An error, from wherever. The old shape called the two halves
   `intendedMeaning` and `correctedNatural`; the new one calls them what you
   tried and what it should have been, which is what the book is for. Both
   read, because a notebook is somebody's writing. */
function jaErrorDefaults(e){
  e.id = e.id || uid();
  e.date = e.date || today();
  e.tried = e.tried || e.actualJapanese || '';
  e.corrected = e.corrected || e.correctedNatural || '';
  e.meaning = e.meaning || e.intendedMeaning || '';
  e.errorType = e.errorType || 'other';
  e.patternTag = e.patternTag || '';
  e.note = e.note || '';
  e.source = JA_SOURCES.some(v => v[0] === e.source) ? e.source
    : (e.sourceType === 'session_432' ? '432' : 'manual');
  e.sourceId = e.sourceId || null;
  e.grammarPointId = e.grammarPointId || null;
  e.sentToStudyDeck = !!e.sentToStudyDeck;
  e.createdAt = e.createdAt || new Date().toISOString();
  return e;
}
/* A 4/3/2 sitting: three deliveries of one talk, and everything the audit
   found in the third one. */
function jaSessionDefaults(s){
  s.id = s.id || uid();
  s.date = s.date || today();
  s.topic = s.topic || '';
  s.islandId = s.islandId || null;
  s.targetChunks = Array.isArray(s.targetChunks) ? s.targetChunks : [];
  s.targetGrammar = Array.isArray(s.targetGrammar) ? s.targetGrammar : [];
  s.deliveries = Array.isArray(s.deliveries) ? s.deliveries : [];
  s.deliveries.forEach((d, i) => { d.stage = d.stage || i + 1;
    d.target = d.target || [4, 3, 2][i] || 2;
    d.seconds = +d.seconds || 0;
    d.wpm = +d.wpm || null;
    d.audioId = d.audioId || null;
    d.heard = d.heard || '';        /* what the recogniser made of it */
  });
  /* what you actually said, typed by you, against what the machine heard */
  s.transcript = s.transcript || '';
  s.marks = Array.isArray(s.marks) ? s.marks : [];
  s.chunksUsed = s.chunksUsed && typeof s.chunksUsed === 'object' ? s.chunksUsed : {};
  s.grammarUsed = s.grammarUsed && typeof s.grammarUsed === 'object' ? s.grammarUsed : {};
  s.pauseLocation = JA_PAUSE.some(v => v[0] === s.pauseLocation) ? s.pauseLocation : null;
  s.quality = JA_QUALITY.some(v => v[0] === s.quality) ? s.quality : null;
  s.errorIds = Array.isArray(s.errorIds) ? s.errorIds : [];
  s.createdAt = s.createdAt || new Date().toISOString();
  return s;
}
/* ---------- counting the words ----------
   Words a minute used to be a number you worked out yourself, because what
   counts as a word in Japanese is a judgement and the room was in no position
   to make it. That was true and it was also the wrong call: a number you have
   to stop and count is a number you count twice and then stop counting, and
   the whole value of this measurement is the line it draws over two months.

   So the room counts, and the browser's own word breaker does the hard part.
   Intl.Segmenter carries ICU's dictionary-based segmentation for Japanese,
   which is the same machinery a Japanese text editor uses to decide where a
   double-click selects to; it gets 日本語を勉強しています to four words, which
   is what a person would say. Where it is missing, the fallback is a rule of
   thumb and is marked as one: Latin runs are words, and Japanese characters
   are counted at two to a word, which is about the average. */
function jaWordCount(text){
  const t = String(text || '').trim();
  if(!t) return 0;
  try {
    if(typeof Intl !== 'undefined' && Intl.Segmenter){
      const seg = new Intl.Segmenter('ja', {granularity:'word'});
      let n = 0;
      for(const piece of seg.segment(t)) if(piece.isWordLike) n++;
      return n;
    }
  } catch(e){}
  const latin = (t.match(/[A-Za-z][A-Za-z'’-]*/g) || []).length;
  const jp = (t.match(/[぀-ヿ㐀-鿿ｦ-ﾟ]/g) || []).length;
  return latin + Math.round(jp / 2);
}
const jaHasSegmenter = () => { try { return !!(typeof Intl !== 'undefined' && Intl.Segmenter); } catch(e){ return false; } };
/* Words a minute for one delivery, from whatever text there is for it and the
   seconds it actually ran. Null rather than nought where there is no text:
   nought would say you said nothing, and what happened is that nobody heard. */
function jaDeliveryWpm(d, text){
  if(!d || !(+d.seconds > 0)) return null;
  const words = jaWordCount(text != null ? text : d.heard);
  if(!words) return null;
  return Math.round(words / (d.seconds / 60));
}

/* The kinds of thing you can mark in a transcript. Four, because these are
   the four that mean different things about what went wrong. */
const JA_MARKS = [
  ['pause',   'Mid-clause pause', '#b0705e'],
  ['english', 'English fallback', '#c9a96e'],
  ['grammar', 'Grammar error',    '#a0727e'],
  ['vocab',   'Vocabulary gap',   '#5c7c8a']];

/* ---------- the second state ----------
   Added beside the first rather than replacing it: the sessions, islands and
   errors already in the room are read by the new shapes, and the scenarios,
   shadowing takes and strand audits are left alone. */
function jaState2(){
  const j = jaState();
  j.sessions.forEach(jaSessionDefaults);
  j.islands.forEach(jaIslandDefaults);
  j.errors.forEach(jaErrorDefaults);
  j.stones = Array.isArray(j.stones) && j.stones.length ? j.stones
    : JA_STONES_DEFAULT.map(([shelf, text, note], i) => ({id:uid(), shelf, text, reading:'', note, order:i}));
  j.stones.forEach((v, i) => { v.id = v.id || uid(); v.shelf = v.shelf || 'filler';
    v.text = v.text || ''; v.reading = v.reading || ''; v.note = v.note || '';
    v.order = v.order == null ? i : v.order; });
  j.translations = Array.isArray(j.translations) ? j.translations : [];
  j.translations.forEach(jaTranslationDefaults);
  j.grammar = Array.isArray(j.grammar) ? j.grammar : [];
  j.grammar.forEach(jaGrammarDefaults);
  j.settings.lockHours = clamp(+j.settings.lockHours || 24, 1, 336);
  j.settings.keepAudio = j.settings.keepAudio !== false;
  j.settings.islandGoal = clamp(+j.settings.islandGoal || 30, 1, 200);
  return j;
}
const jaStones = shelf => jaState2().stones.filter(v => v.shelf === shelf)
  .sort((a, b) => (a.order || 0) - (b.order || 0));
/* What a topic's vocabulary adds up to: the share of it you can actually
   produce, which is the honest answer to "can I talk about this yet". */
function jaIslandReady(i){
  const n = (i.chunks || []).length;
  return {total:n, ready: (i.chunks || []).filter(c => c.ready).length,
    pct: n ? Math.round(100 * (i.chunks || []).filter(c => c.ready).length / n) : 0};
}
function jaTopicOverview(){
  return jaState2().islands.map(i => Object.assign({island:i}, jaIslandReady(i)))
    .sort((a, b) => a.pct - b.pct);
}
/* The state of a translation exercise, worked out from its dates rather than
   stored — a stored status and a stored timestamp can disagree, and the one
   that would be wrong is the one the lock depends on. */
function jaTranslationState(t, now){
  if(!t.pass1Date) return 'pass1';
  if(t.pass2Date) return 'done';
  const at = Date.parse(t.unlocksAt || '');
  return (isFinite(at) && (now || Date.now()) < at) ? 'locked' : 'ready';
}
const jaUnlockIn = (t, now) => Math.max(0,
  Date.parse(t.unlocksAt || '') - (now || Date.now()));
