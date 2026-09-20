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
/* Which voice a phrase is in, because this is the shelf where it matters
   most. A stepping stone is said under pressure, without thinking, and one
   said in the wrong register is worse than a pause: it is a pause plus an
   apology. おっしゃる通りです to a friend is arch; ほんと? to a client is
   rude; and a great many of these phrases exist in both voices with
   different words, which is the thing worth learning.

   "Either" is not a hedge. Some of the commonest ones genuinely do not
   change — ところで, なるほど, つまり — and marking them as one or the other
   would be teaching something untrue. */
const JA_STONE_REGISTERS = [
  ['either', 'Either', '\u3069\u3061\u3089\u3067\u3082', 'said the same to anybody'],
  ['formal', 'Formal', '\u4e01\u5be7\u8a9e',    'a client, a teacher, somebody you have just met'],
  ['casual', 'Casual', '\u30bf\u30e1\u53e3',    'a friend, a colleague you drink with']];
/* Shipped with a good deal on every shelf, because an empty vault teaches
   nothing, and because these are not personal — they are the phrases that
   buy a second in anybody's Japanese. Kept as [shelf, register, text,
   reading, what it does]. */
const JA_STONES_DEFAULT = [
  /* ---------- turning the conversation somewhere you can go ---------- */
  ['gear', 'either', '\u3068\u3053\u308d\u3067', '\u3068\u3053\u308d\u3067', 'by the way'],
  ['gear', 'either', '\u5b9f\u306f', '\u3058\u3064\u306f', 'actually \u2014 the truth is'],
  ['gear', 'either', '\u305d\u3046\u3044\u3048\u3070', '\u305d\u3046\u3044\u3048\u3070', 'come to think of it'],
  ['gear', 'either', '\u3061\u306a\u307f\u306b', '\u3061\u306a\u307f\u306b', 'incidentally'],
  ['gear', 'either', '\u3068\u306b\u304b\u304f', '\u3068\u306b\u304b\u304f', 'anyway \u2014 in any case'],
  ['gear', 'either', '\u305d\u308c\u3067', '\u305d\u308c\u3067', 'and so \u2014 so then'],
  ['gear', 'either', '\u3068\u3044\u3046\u3053\u3068\u3067', '\u3068\u3044\u3046\u3053\u3068\u3067', 'and with that'],
  ['gear', 'either', '\u8a71\u3092\u623b\u3059\u3068', '\u306f\u306a\u3057\u3092\u3082\u3069\u3059\u3068', 'getting back to the point'],
  ['gear', 'formal', '\u8a71\u306f\u5909\u308f\u308a\u307e\u3059\u304c', '\u306f\u306a\u3057\u306f\u304b\u308f\u308a\u307e\u3059\u304c', 'to change the subject'],
  ['gear', 'formal', '\u672c\u984c\u306b\u5165\u308a\u307e\u3059\u3068', '\u307b\u3093\u3060\u3044\u306b\u306f\u3044\u308a\u307e\u3059\u3068', 'to get to the main point'],
  ['gear', 'formal', '\u305d\u308c\u306f\u3055\u3066\u304a\u304d', '\u305d\u308c\u306f\u3055\u3066\u304a\u304d', 'that aside'],
  ['gear', 'formal', '\u3044\u305a\u308c\u306b\u3057\u3066\u3082', '\u3044\u305a\u308c\u306b\u3057\u3066\u3082', 'either way'],
  ['gear', 'casual', '\u8a71\u5909\u308f\u308b\u3051\u3069', '\u306f\u306a\u3057\u304b\u308f\u308b\u3051\u3069', 'changing the subject'],
  ['gear', 'casual', '\u3066\u3044\u3046\u304b', '\u3066\u3044\u3046\u304b', 'or rather \u2014 I mean'],
  ['gear', 'casual', '\u3069\u3063\u3061\u306b\u3057\u3066\u3082', '\u3069\u3063\u3061\u306b\u3057\u3066\u3082', 'either way'],
  ['gear', 'casual', '\u305d\u308c\u3088\u308a', '\u305d\u308c\u3088\u308a', 'more to the point'],
  ['gear', 'casual', '\u3067', '\u3067', 'so \u2014 the one-syllable version'],

  /* ---------- time bought without the silence ---------- */
  ['filler', 'either', '\u3048\u30fc\u3068', '\u3048\u30fc\u3068', 'umm'],
  ['filler', 'either', '\u3042\u306e\u30fc', '\u3042\u306e\u30fc', 'er \u2014 also how you start a sentence at a stranger'],
  ['filler', 'either', '\u306a\u3093\u3068\u3044\u3046\u304b', '\u306a\u3093\u3068\u3044\u3046\u304b', 'how should I put it'],
  ['filler', 'either', '\u3061\u3087\u3063\u3068', '\u3061\u3087\u3063\u3068', 'a little \u2014 and a softener for anything awkward'],
  ['filler', 'either', '\u305d\u306e', '\u305d\u306e', 'uh \u2014 the one that buys the shortest second'],
  ['filler', 'either', '\u8a00\u8449\u304c\u51fa\u3066\u3053\u306a\u3044', '\u3053\u3068\u3070\u304c\u3067\u3066\u3053\u306a\u3044', 'the word will not come'],
  ['filler', 'formal', '\u305d\u3046\u3067\u3059\u306d', '\u305d\u3046\u3067\u3059\u306d', 'let me think'],
  ['filler', 'formal', '\u4f55\u3068\u8a00\u3044\u307e\u3059\u304b', '\u306a\u3093\u3068\u3044\u3044\u307e\u3059\u304b', 'how should I put it'],
  ['filler', 'formal', '\u3084\u306f\u308a', '\u3084\u306f\u308a', 'as expected'],
  ['filler', 'formal', '\u3048\u3048', '\u3048\u3048', 'yes \u2014 softer than \u306f\u3044'],
  ['filler', 'casual', '\u305d\u3046\u3060\u306d', '\u305d\u3046\u3060\u306d', 'let me think'],
  ['filler', 'casual', '\u3084\u3063\u3071\u308a', '\u3084\u3063\u3071\u308a', 'as I thought'],
  ['filler', 'casual', '\u306a\u3093\u304b', '\u306a\u3093\u304b', 'like \u2014 sort of'],
  ['filler', 'casual', '\u306a\u3093\u3066\u8a00\u3046\u304b', '\u306a\u3093\u3066\u3044\u3046\u304b', 'how do I say it'],
  ['filler', 'casual', '\u306a\u3093\u3066\u8a00\u3046\u3093\u3060\u308d\u3046', '\u306a\u3093\u3066\u3044\u3046\u3093\u3060\u308d\u3046', 'how would you say it \u2014 to yourself, out loud'],
  ['filler', 'casual', '\u3046\u30fc\u3093', '\u3046\u30fc\u3093', 'hmm'],
  ['filler', 'casual', '\u307b\u3089', '\u307b\u3089', 'you know \u2014 pointing at a shared memory'],

  /* ---------- the noises that prove you are listening ---------- */
  ['aizuchi', 'either', '\u306a\u308b\u307b\u3069', '\u306a\u308b\u307b\u3069', 'I see \u2014 that makes sense'],
  ['aizuchi', 'either', '\u305f\u3057\u304b\u306b', '\u305f\u3057\u304b\u306b', 'true \u2014 you have a point'],
  ['aizuchi', 'either', '\u3067\u3057\u3087\u3046\u306d', '\u3067\u3057\u3087\u3046\u306d', 'I bet \u2014 I can imagine'],
  ['aizuchi', 'formal', '\u305d\u3046\u3067\u3059\u306d', '\u305d\u3046\u3067\u3059\u306d', 'agreement'],
  ['aizuchi', 'formal', '\u305d\u3046\u306a\u3093\u3067\u3059\u306d', '\u305d\u3046\u306a\u3093\u3067\u3059\u306d', 'oh, I see'],
  ['aizuchi', 'formal', '\u306f\u3044', '\u306f\u3044', 'yes \u2014 said often, as a pulse, not as an answer'],
  ['aizuchi', 'formal', '\u308f\u304b\u308a\u307e\u3059', '\u308f\u304b\u308a\u307e\u3059', 'I understand'],
  ['aizuchi', 'formal', '\u3067\u3059\u3088\u306d', '\u3067\u3059\u3088\u306d', 'right?'],
  ['aizuchi', 'formal', '\u672c\u5f53\u3067\u3059\u304b', '\u307b\u3093\u3068\u3046\u3067\u3059\u304b', 'really?'],
  ['aizuchi', 'formal', '\u3059\u3054\u3044\u3067\u3059\u306d', '\u3059\u3054\u3044\u3067\u3059\u306d', 'that is impressive'],
  ['aizuchi', 'formal', '\u305d\u308c\u306f\u5927\u5909\u3067\u3057\u305f\u306d', '\u305d\u308c\u306f\u305f\u3044\u3078\u3093\u3067\u3057\u305f\u306d', 'that must have been hard'],
  ['aizuchi', 'formal', '\u304a\u3063\u3057\u3083\u308b\u901a\u308a\u3067\u3059', '\u304a\u3063\u3057\u3083\u308b\u3068\u304a\u308a\u3067\u3059', 'exactly as you say'],
  ['aizuchi', 'casual', '\u305d\u3046\u306a\u3093\u3060', '\u305d\u3046\u306a\u3093\u3060', 'oh really'],
  ['aizuchi', 'casual', '\u3078\u3048', '\u3078\u3048', 'huh \u2014 mild surprise'],
  ['aizuchi', 'casual', '\u3046\u3093', '\u3046\u3093', 'mm-hmm'],
  ['aizuchi', 'casual', '\u305d\u3046\u305d\u3046', '\u305d\u3046\u305d\u3046', 'yes, exactly \u2014 twice, always'],
  ['aizuchi', 'casual', '\u3060\u3088\u306d', '\u3060\u3088\u306d', 'right?'],
  ['aizuchi', 'casual', '\u308f\u304b\u308b', '\u308f\u304b\u308b', 'I get it'],
  ['aizuchi', 'casual', '\u307b\u3093\u3068', '\u307b\u3093\u3068', 'really?'],
  ['aizuchi', 'casual', '\u3059\u3054\u3044', '\u3059\u3054\u3044', 'wow'],
  ['aizuchi', 'casual', '\u5927\u5909\u3060\u3063\u305f\u306d', '\u305f\u3044\u3078\u3093\u3060\u3063\u305f\u306d', 'that must have been rough'],

  /* ---------- saying the smaller version of the thought ---------- */
  ['simple', 'either', '\u7c21\u5358\u306b\u8a00\u3046\u3068', '\u304b\u3093\u305f\u3093\u306b\u3044\u3046\u3068', 'to put it simply'],
  ['simple', 'either', '\u3064\u307e\u308a', '\u3064\u307e\u308a', 'in other words'],
  ['simple', 'either', '\u8981\u3059\u308b\u306b', '\u3088\u3046\u3059\u308b\u306b', 'in short'],
  ['simple', 'either', '\u4f8b\u3048\u3070', '\u305f\u3068\u3048\u3070', 'for example \u2014 the escape from an abstract sentence'],
  ['simple', 'either', '\u4e00\u8a00\u3067\u8a00\u3046\u3068', '\u3072\u3068\u3053\u3068\u3067\u3044\u3046\u3068', 'in a word'],
  ['simple', 'either', '\u307e\u3068\u3081\u308b\u3068', '\u307e\u3068\u3081\u308b\u3068', 'to sum up'],
  ['simple', 'formal', '\u5177\u4f53\u7684\u306b\u8a00\u3046\u3068', '\u3050\u305f\u3044\u3066\u304d\u306b\u3044\u3046\u3068', 'specifically'],
  ['simple', 'formal', '\u8a00\u3044\u63db\u3048\u308b\u3068', '\u3044\u3044\u304b\u3048\u308b\u3068', 'to put it another way'],
  ['simple', 'formal', '\u7aef\u7684\u306b\u8a00\u3046\u3068', '\u305f\u3093\u3066\u304d\u306b\u3044\u3046\u3068', 'to put it directly'],
  ['simple', 'casual', '\u3056\u3063\u304f\u308a\u8a00\u3046\u3068', '\u3056\u3063\u304f\u308a\u3044\u3046\u3068', 'roughly speaking'],
  ['simple', 'casual', '\u8981\u306f', '\u3088\u3046\u306f', 'the point is'],
  ['simple', 'casual', '\u5e73\u305f\u304f\u8a00\u3046\u3068', '\u3072\u3089\u305f\u304f\u3044\u3046\u3068', 'to put it plainly'],

  /* ---------- getting the conversation back when it breaks ---------- */
  ['repair', 'either', '\u8a00\u3044\u76f4\u3059\u3068', '\u3044\u3044\u306a\u304a\u3059\u3068', 'let me say that again'],
  ['repair', 'formal', '\u3082\u3046\u4e00\u5ea6\u304a\u9858\u3044\u3057\u307e\u3059', '\u3082\u3046\u3044\u3061\u3069\u304a\u306d\u304c\u3044\u3057\u307e\u3059', 'once more, please'],
  ['repair', 'formal', '\u3086\u3063\u304f\u308a\u304a\u9858\u3044\u3057\u307e\u3059', '\u3086\u3063\u304f\u308a\u304a\u306d\u304c\u3044\u3057\u307e\u3059', 'slowly, please'],
  ['repair', 'formal', '\u805e\u304d\u53d6\u308c\u307e\u305b\u3093\u3067\u3057\u305f', '\u304d\u304d\u3068\u308c\u307e\u305b\u3093\u3067\u3057\u305f', 'I did not catch that'],
  ['repair', 'formal', '\u65e5\u672c\u8a9e\u3067\u4f55\u3068\u8a00\u3044\u307e\u3059\u304b', '\u306b\u307b\u3093\u3054\u3067\u306a\u3093\u3068\u3044\u3044\u307e\u3059\u304b', 'how do you say it in Japanese'],
  ['repair', 'formal', '\u3069\u3046\u3044\u3046\u610f\u5473\u3067\u3059\u304b', '\u3069\u3046\u3044\u3046\u3044\u307f\u3067\u3059\u304b', 'what does that mean'],
  ['repair', 'formal', '\u5c11\u3005\u304a\u5f85\u3061\u304f\u3060\u3055\u3044', '\u3057\u3087\u3046\u3057\u3087\u3046\u304a\u307e\u3061\u304f\u3060\u3055\u3044', 'one moment, please'],
  ['repair', 'formal', '\u9593\u9055\u3048\u307e\u3057\u305f', '\u307e\u3061\u304c\u3048\u307e\u3057\u305f', 'I got that wrong'],
  ['repair', 'formal', '\u4eca\u306e\u306f\u9055\u3044\u307e\u3059', '\u3044\u307e\u306e\u306f\u3061\u304c\u3044\u307e\u3059', 'that is not what I meant'],
  ['repair', 'formal', '\u8a00\u3044\u76f4\u3057\u307e\u3059', '\u3044\u3044\u306a\u304a\u3057\u307e\u3059', 'let me rephrase'],
  ['repair', 'formal', '\u6b63\u3057\u3044\u3067\u3059\u304b', '\u305f\u3060\u3057\u3044\u3067\u3059\u304b', 'is that right?'],
  ['repair', 'formal', '\u6f22\u5b57\u3067\u3069\u3046\u66f8\u304d\u307e\u3059\u304b', '\u304b\u3093\u3058\u3067\u3069\u3046\u304b\u304d\u307e\u3059\u304b', 'how is it written in kanji'],
  ['repair', 'casual', '\u3082\u3046\u4e00\u56de\u8a00\u3063\u3066', '\u3082\u3046\u3044\u3063\u304b\u3044\u3044\u3063\u3066', 'say that again'],
  ['repair', 'casual', '\u3061\u3087\u3063\u3068\u5f85\u3063\u3066', '\u3061\u3087\u3063\u3068\u307e\u3063\u3066', 'hold on'],
  ['repair', 'casual', '\u805e\u3053\u3048\u306a\u304b\u3063\u305f', '\u304d\u3053\u3048\u306a\u304b\u3063\u305f', 'I did not hear that'],
  ['repair', 'casual', '\u65e5\u672c\u8a9e\u3067\u4f55\u3066\u8a00\u3046', '\u306b\u307b\u3093\u3054\u3067\u306a\u3093\u3066\u3044\u3046', 'how do you say it in Japanese'],
  ['repair', 'casual', '\u3069\u3046\u3044\u3046\u610f\u5473', '\u3069\u3046\u3044\u3046\u3044\u307f', 'what is that'],
  ['repair', 'casual', '\u9593\u9055\u3048\u305f', '\u307e\u3061\u304c\u3048\u305f', 'got it wrong'],
  ['repair', 'casual', '\u4eca\u306e\u306a\u3057', '\u3044\u307e\u306e\u306a\u3057', 'scratch that'],
  ['repair', 'casual', '\u5408\u3063\u3066\u308b', '\u3042\u3063\u3066\u308b', 'is that right?'],
];
const jaStonesShipped = () => JA_STONES_DEFAULT.map(([shelf, register, text, reading, note], i) =>
  ({id:uid(), shelf, register, text, reading, note, order:i}));
/* Bringing the shipped phrases in without trampling yours. Matched on the
   words themselves, so one you have already written down is left exactly as
   you wrote it — your note, your reading, your shelf — and only the ones
   that are not there at all are added. A phrase you deliberately threw away
   will come back, which is the price of being able to top the shelves up at
   all; it is one press to throw it away again. */
function jaAddShippedStones(){
  const j = jaState2();
  /* matched on the shelf as well as the words: the same phrase does two
     different jobs on two different shelves \u2014 \u305d\u3046\u3067\u3059\u306d is a filler while you
     think and an aizuchi while somebody else talks \u2014 and having it on one
     of them is not having it on the other */
  const key = v => `${v.shelf}|${String(v.text || '').trim()}`;
  const have = new Set(j.stones.map(key));
  let n = 0, at = j.stones.length;
  jaStonesShipped().forEach(v => {
    if(have.has(key(v))) return;
    j.stones.push(Object.assign(v, {order: at++}));
    n++;
  });
  if(n) saveNow();
  return n;
}
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
  j.stones = Array.isArray(j.stones) && j.stones.length ? j.stones : jaStonesShipped();
  j.stones.forEach((v, i) => { v.id = v.id || uid(); v.shelf = v.shelf || 'filler';
    v.text = v.text || ''; v.reading = v.reading || ''; v.note = v.note || '';
    /* anything written before the registers existed is 'either', which is
       true of a good many of them and is at least not a claim */
    v.register = JA_STONE_REGISTERS.some(r => r[0] === v.register) ? v.register : 'either';
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
