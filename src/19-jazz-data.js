/* ============================================================
   THE JAZZ STUDIO — a roadmap, not a shelf.

   The score room is for pieces: a thing with a beginning and an end that you
   learn once. This room is for the opposite kind of work. Nobody "learns"
   the two-five-one; you play it until your hands go there without being
   asked, in every key, and the difference between a jazz musician and
   somebody who knows some jazz chords is entirely that.

   Which means the unit here is not the piece, it is the pattern-in-a-key.
   Twelve of everything. So the roadmap counts in twelves, the flashcards
   deal a random key rather than a random exercise, and an exercise is marked
   off one key at a time.

   WHERE THE CURRICULUM COMES FROM. The stages, the exercises and the page of
   Siskind each one cites live in the three files beside this one, exactly as
   they were written. This file does not hold a curriculum; it reads one. It
   adds the only thing those files do not carry — the mindset passage that
   belongs to each stage, which is the half of practising nobody writes an
   exercise for — and it turns the flat catalogue into the ladder the room
   draws.

   WHAT IS SHIPPED AND WHAT IS YOURS. The curriculum is shipped, the way the
   stepping stones are: it is somebody's teaching, it will be corrected in
   later versions, and a copy of it in everybody's database would mean those
   corrections never arrive. What lives in the state is only what you did —
   which keys you have, what you logged, how the flashcards went. A record
   whose exercise has since left the book is kept rather than swept, because
   it is a record of your practice and not of the catalogue's.
   ============================================================ */

/* The ladder, and what each rung is for. The exercises under each of these
   come out of the catalogue; what is here is the part a list of exercises
   cannot say — why the stage exists, and how to be while you are in it. */
const JAZZ_STAGE_NOTES = {
  'P0': {n:0, name:'Intervals, and the twelve by twelve',
    blurb:'Before chords, before scales: the twelve distances.',
    theory:'There are twelve notes, and from any one of them twelve distances to any other. Every chord, every scale, every voicing and every line you will ever play is made of them. A major chord is not an object — it is a root, a major third and a fifth. If you cannot hear and play every interval from any starting note, everything above this is built on sand.',
    werner:'Many musicians are so fixated on the complicated that they never spend enough time on the basics. Fear of not becoming great is what keeps people from becoming great.',
    mindset:'Slowly and perfectly, one distance at a time. Sing it before you play it — an interval you cannot sing is one your hands are guessing at.'},
  1: {n:1, name:'Chord construction', needs:'P0',
    blurb:'The four shapes everything else is made of.',
    theory:'"For the vast majority of this book, you will be dealing with three crucial chord types." Major seventh, dominant seventh, minor seventh — and the half-diminished waiting behind them for the minor two-five-one. The aim is not to work them out. It is to see Cmaj7 and have the hand already there.',
    werner:'Fear of not becoming great has kept you from becoming great.',
    mindset:'Play them stacked in root position and do not fuss about inversions yet. Lowest note above F below the staff, highest below the G above it. Take your hands off the keys between keys and let it settle.'},
  2: {n:2, name:'The two-five-one', needs:1,
    blurb:'The progression that is most of the music.',
    theory:'"The ii-V-I progression and its components makes up a high percentage of the harmonic landscape of jazz standards." A minor seventh on the second degree, a dominant on the fifth, a major seventh on the root. Alternate root position and second inversion and watch what happens: either the bottom two notes move and the top two hold, or the other way about. That is voice leading, and it is the thing to feel rather than the notes to find.',
    werner:'Neglecting the two-five-one can doom you to struggle with everything that comes after it.',
    mindset:'Name the chord before you play it. If you cannot name it you are reading shapes, not hearing harmony.'},
  3: {n:3, name:'Two-handed A and B voicings', needs:2,
    blurb:'The first voicing that sounds like a record rather than a lesson.',
    theory:'"The third and seventh are called essential tones because they are absolutely necessary to hear the harmony." Type A puts the third under the seventh in the left hand and the ninth under the fifth in the right; Type B swaps them. Alternating A to B to A through a two-five-one is what makes one pair hold while the other steps down. Keep the lowest note between the C below middle C and middle C.',
    werner:'Mastery is two things: staying out of the way and letting the music play itself, and being able to play the material perfectly every time without thinking about it.',
    mindset:'Start high in the register rather than low, so you have room to come down. When you hit the bottom, jump back up like a typewriter.'},
  4: {n:4, name:'One hand, and a bass in two', needs:3,
    blurb:'Three notes in one hand, so the other is free.',
    theory:'"Instead of four notes, you will only play three: the third and seventh plus either the ninth or the fifth." With the voicing in one hand the other can walk — root on one, fifth on three — and that is the whole texture you need to accompany a singer on your own.',
    werner:'The objective is nothing less than complete perfection. When the passage plays itself from that place, mastery has happened.',
    mindset:'The move between A and B should feel like a shift, not a jump. If it feels like a jump you are in the wrong octave for one of them.'},
  5: {n:5, name:'The blues', needs:4,
    blurb:'A quarter of the standards, and every session there has ever been.',
    theory:'"About a quarter of jazz standards are blues tunes or some variation of the blues." The jazz blues adds a quick four in the second bar and finishes on a two-five turnaround rather than a plain cadence. Learn the form before the voicings: the form is what you are asked for, the voicings are what you bring to it. C, F, G and B flat first.',
    werner:'Perfection is something you surrender to. It overcomes you.',
    mindset:'Play the form through with one finger before you play it with two hands. If the shape is not in your head, your hands are guessing.'},
  6: {n:6, name:'Licks, and beginning to improvise', needs:5,
    blurb:'Phrases to have in the hands before there are ideas in the head.',
    theory:'"Learning to rattle off set phrases without thinking is very useful. These set phrases are a chance to internalize grammar, practice details of correct pronunciation, and solidify elements of the language deep in your subconscious." Ten licks out of the book, each one practised four ways: articulation, then with the left hand comping, then through all twelve keys, then inside a tune.',
    werner:'There are no wrong notes. Every note I play is the most beautiful sound I have ever heard.',
    mindset:'Play four notes and stop. The silence is where you find out whether you meant them.'},
  7: {n:7, name:'Altered dominants and tritone subs', needs:6,
    blurb:'Tension, on purpose.',
    theory:'"Altered dominant chords are created by raising or lowering the color tones of a dominant seventh chord by a half step. Musicians are permitted and expected to alter dominant chords themselves without any indication." Four alterations, and any of them can be combined. The tritone substitution goes further: two dominants a tritone apart are interchangeable, and swapping them turns the bass into a chromatic descent.',
    werner:'Fear and anxiety break focused practice. Stay with one thing until it is properly yours.',
    mindset:'Start from the voicing you already have and move one note. Every altered chord is a chord you know with a finger shifted.'},
  8: {n:8, name:'Modal jazz and pentatonics', needs:7,
    blurb:'When the harmony stops moving and the question changes.',
    theory:'"Modal jazz features slow harmonic rhythm, ambiguous tonal centers, and root movements outside the circle of fifths." Modal voicings obey two rules: no doubling, and no stacks of thirds. Fourths instead — a stack of fourths does not declare a key the way a stack of thirds does.',
    werner:'Playing from the space, not from the mind. The material has to be so far inside you that there is nothing left to think about.',
    mindset:'Hold a note longer than is comfortable. Modal playing is mostly about what you do not do.'},
  9: {n:9, name:'Reharmonisation', needs:8,
    blurb:'The same tune, and somewhere else to take it.',
    theory:'Secondary dominants, the backdoor two-five, diminished walk-ups, the turnaround, and Coltrane’s minor-third cycle laid over circle-of-fifths motion. Each one is a way of arriving at the same chord from a direction nobody expected.',
    werner:'Do not practise to become better than somebody. Practise until the material is not in the way.',
    mindset:'Play the plain version first, every time, so you can hear what the reharmonisation is doing to it.'},
  10: {n:10, name:'Modal interchange, and playing outside', needs:9,
    blurb:'Choosing a mode the chord did not ask for.',
    theory:'"Modal interchange is choosing modes other than those that match the chords." Three ways out and back: tonicisation, where you precede a chord with its own five; sidestepping, where you aim at it from a half step away; and planing, where a shape moves in parallel and the key goes with it.',
    werner:'The experience of playing is coloured by what you believe about music and what you believe about yourself.',
    mindset:'Outside only means anything against an inside somebody can still hear. Keep the time.'},
  11: {n:11, name:'Modal blues', needs:10,
    blurb:'The oldest form, taken somewhere else.',
    theory:'"By using modal harmonies, musicians can create alternate versions of the blues." Footprints, Eighty-One, Equinox, Matrix — the blues with sus chords, or minor sevenths, or quartal voicings over a minor two-five-one.',
    werner:'Nothing has to be proved. The music is already there.',
    mindset:'Know the plain blues cold first. A modal blues is a variation, and a variation on something you do not have is just notes.'},
  12: {n:12, name:'Odd time, and making something', needs:11,
    blurb:'Where the studying stops and the work starts.',
    theory:'"When tunes originally in 4/4 are adapted to 5/4, every other measure loses one beat. In 7/4, every other measure gains one." And then: write a contrafact over a standard’s changes, reharmonise something that is not a jazz tune, and find out what you actually have.',
    werner:'The goal was never the exercises. It was to be able to say something.',
    mindset:'Finish something. An unfinished piece teaches you less than a bad finished one.'},
};
/* the rungs, in order, with P0 before everything */
const JAZZ_STAGE_IDS = ['P0', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/* ---------- the catalogue, read rather than written ----------
   Both shipped catalogues are merged into one flat table keyed by the id the
   book gives each exercise. It is built once, on first use: the files it
   reads are concatenated after this one, so anything that looked at them
   while this file was being read would be looking at nothing. */
let _jazzBook = null;
function jazzBook(){
  if(_jazzBook) return _jazzBook;
  const out = {};
  const take = cat => { if(!cat) return;
    Object.keys(cat).forEach(id => {
      if(id.charAt(0) === '_') return;
      const e = cat[id];
      if(!e || typeof e !== 'object') return;
      /* a cross-reference is a signpost, not an exercise */
      if(e.generatorType === 'reference') return;
      out[id] = {id, stage: e.stage, name: e.name || id,
        gen: e.generator || null, args: e.generatorArgs || ['key'],
        kind: e.generatorType || '', why: e.whyItMatters || '',
        tip: e.memorizationTips || '', source: e.source || '',
        theory: e.theoryNotes || '',
        ask: e.flashcardPrompt || `Play ${e.name || id}`,
        /* some licks are transcribed by ear rather than derived, and the
           book says so about itself; it is worth passing on */
        doubt: e.noteAccuracy || ''};
    }); };
  try { take(typeof STAGE_P0_CATALOG !== 'undefined' ? STAGE_P0_CATALOG : null); } catch(e){}
  try { take(typeof STAGES_0_12_CATALOG !== 'undefined' ? STAGES_0_12_CATALOG : null); } catch(e){}
  _jazzBook = out;
  return out;
}
const jazzExercise = id => jazzBook()[id] || null;
/* what P0's own file says about the stage it is, which none of the others carry */
const jazzP0Info = () => { try { return STAGE_P0_CATALOG._stageInfo || {}; } catch(e){ return {}; } };

/* the ladder, built from the two of them */
let _jazzLadder = null;
function jazzStages(){
  if(_jazzLadder) return _jazzLadder;
  const book = jazzBook();
  const byStage = {};
  Object.keys(book).forEach(id => {
    const s = book[id].stage;
    (byStage[s] = byStage[s] || []).push(id);
  });
  const ord = id => { const m = /^(?:P0|\d+)\.(\d+)([a-z]?)$/.exec(id);
    return m ? +m[1] * 10 + (m[2] ? m[2].charCodeAt(0) - 96 : 0) : 0; };
  _jazzLadder = JAZZ_STAGE_IDS.map(sid => {
    const note = JAZZ_STAGE_NOTES[sid] || {};
    const subs = (byStage[sid] || []).sort((a, b) => ord(a) - ord(b));
    return Object.assign({id: String(sid), key: sid, subs}, note);
  }).filter(s => s.subs.length);
  return _jazzLadder;
}
const jazzStage = id => jazzStages().find(s => s.id === String(id)) || null;
const jazzSubOf = exId => { for(const s of jazzStages()) if(s.subs.includes(exId))
  return {stage: s, sub: jazzExercise(exId)}; return null; };

/* ---------- writing one out ----------
   The catalogue names its generator and lists the arguments it wants. "key"
   means the key you have chosen; "intervalName" means the distance you have
   chosen; anything else is a literal the book wrote down. */
const JAZZ_INTERVALS = ['minor2nd','major2nd','minor3rd','major3rd','perfect4th','tritone',
  'perfect5th','minor6th','major6th','minor7th','major7th','octave'];
function jazzScoreXml(ex, key, opts){
  if(!ex || !ex.gen) return null;
  const G = typeof JazzExerciseGenerator !== 'undefined' ? JazzExerciseGenerator : null;
  if(!G || typeof G[ex.gen] !== 'function') return null;
  const o = opts || {};
  const args = (ex.args || ['key']).map(a =>
    a === 'key' ? key
    : a === 'intervalName' ? (o.interval || 'major3rd')
    : a);
  return G[ex.gen].apply(G, args);
}
/* whether an exercise wants a distance chosen as well as a key */
const jazzWantsInterval = ex => !!(ex && (ex.args || []).includes('intervalName'));
/* and whether it has any notation at all — some of the work is a project */
const jazzHasScore = ex => !!(ex && ex.gen);

/* ---------- what is yours ---------- */
const JAZZ_QUALITY = [['rough','Rough'], ['shaky','Shaky'], ['improving','Improving'],
  ['solid','Solid'], ['automatic','Automatic']];
function jazzState(){
  S.jazz = S.jazz && typeof S.jazz === 'object' ? S.jazz : {};
  const j = S.jazz;
  j.progress = j.progress && typeof j.progress === 'object' ? j.progress : {};
  j.flashes = Array.isArray(j.flashes) ? j.flashes : [];
  j.settings = j.settings && typeof j.settings === 'object' ? j.settings : {};
  const st = j.settings;
  st.cards = clamp(+st.cards || 15, 3, 60);
  st.keyMode = ['all','unmastered','custom'].includes(st.keyMode) ? st.keyMode : 'unmastered';
  st.customKeys = Array.isArray(st.customKeys) ? st.customKeys : ['C','F','Bb','Eb'];
  st.syllabus = Array.isArray(st.syllabus) ? st.syllabus : [];
  st.gate = !!st.gate;              /* one stage at a time, if you want it */
  st.openId = st.openId || null;
  return j;
}
/* One exercise's record, made on demand. A record is only written when
   something actually happened to it, so an untouched catalogue costs nothing
   in the database. */
function jazzRecord(id, make){
  const j = jazzState();
  if(!j.progress[id]){
    if(!make) return {keys:{}, logs:[], nailed:{}, lastAt:null};
    j.progress[id] = {keys:{}, logs:[], nailed:{}, lastAt:null};
  }
  const r = j.progress[id];
  r.keys = r.keys && typeof r.keys === 'object' ? r.keys : {};
  r.nailed = r.nailed && typeof r.nailed === 'object' ? r.nailed : {};
  r.logs = Array.isArray(r.logs) ? r.logs : [];
  return r;
}
/* how many of the twelve are yours, for one exercise and for a whole stage */
const jazzKeysGot = id => JAZZ_KEY_NAMES.filter(k => jazzRecord(id).keys[k]).length;
function jazzStageGot(stage){
  const ids = (stage && stage.subs) || [];
  return {done: sum(ids.map(jazzKeysGot)), of: ids.length * 12};
}
/* Whether you have earned a stage: the one before it is finished in all
   twelve keys. A roadmap is worth having because it says what not to do
   yet, and this is the part that knows.

   It does not shut the door. Locking stages was the first design and it was
   wrong for the room this is: a shelf you cannot look at is a shelf you
   cannot decide about, and the whole of stage twelve being greyed out for a
   year tells you nothing except that it is there. So everything opens, the
   stage you are actually on is marked, and a stage you have run ahead to
   says so quietly rather than refusing.

   The gate is still here, behind a switch, for anybody who wants the
   discipline of it. Off unless asked for. */
const jazzGated = () => !!(jazzState().settings || {}).gate;
function jazzStageReached(stage){
  if(!stage || stage.needs === undefined) return true;
  const before = jazzStage(stage.needs);
  if(!before) return true;
  const got = jazzStageGot(before);
  return got.of > 0 && got.done >= got.of;
}
const jazzStageOpen = stage => !jazzGated() || jazzStageReached(stage);
/* where you actually are: the first stage you have earned and not finished */
const jazzNowStage = () => jazzStages().find(s => jazzStageReached(s) && jazzStageGot(s).done < jazzStageGot(s).of)
  || jazzStages()[jazzStages().length - 1];

function jazzSetKey(id, key, got){
  const r = jazzRecord(id, true);
  got ? r.keys[key] = true : delete r.keys[key];
  saveNow();
  return jazzKeysGot(id);
}
function jazzLogPractice(id, fields){
  const r = jazzRecord(id, true);
  const log = Object.assign({id: uid(), at: new Date().toISOString(), day: today(),
    keys: [], minutes: 0, quality: 'improving', note: '', from: null, to: null}, fields || {});
  r.logs.unshift(log);
  r.lastAt = log.day;
  if(log.markKeys) log.keys.forEach(k => r.keys[k] = true);
  saveNow();
  return log;
}
/* every sitting across the whole studio, newest first, for the history */
function jazzAllLogs(){
  const j = jazzState();
  const out = [];
  Object.keys(j.progress).forEach(id => (j.progress[id].logs || []).forEach(l =>
    out.push(Object.assign({exerciseId: id}, l))));
  return out.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}
const jazzMinutesOn = day => sum(jazzAllLogs().filter(l => l.day === day).map(l => +l.minutes || 0));

/* ---------- the flashcards ----------
   A card is an exercise and a key, because that pair is the thing that is
   either in your hands or not. Three clean answers on the same pair marks
   the key off, which is the only way the twelve-key grid ever fills in
   without somebody ticking boxes about themselves. */
const JAZZ_NAILED_FOR = 3;
function jazzGrade(exerciseId, key, result, seconds){
  const j = jazzState();
  const r = jazzRecord(exerciseId, true);
  j.flashes.unshift({id: uid(), exerciseId, key, at: new Date().toISOString(),
    day: today(), result, seconds: seconds == null ? null : Math.round(seconds)});
  if(j.flashes.length > 2000) j.flashes.length = 2000;
  if(result === 'nailed'){
    r.nailed[key] = (+r.nailed[key] || 0) + 1;
    if(r.nailed[key] >= JAZZ_NAILED_FOR) r.keys[key] = true;
  } else {
    /* a miss is not a reset to zero — it is a step back, because one bad
       morning should not wipe out a fortnight of getting it right */
    r.nailed[key] = Math.max(0, (+r.nailed[key] || 0) - 1);
    if(result === 'couldnt') delete r.keys[key];
  }
  r.lastAt = today();
  saveNow();
  return r.nailed[key] || 0;
}
/* which keys a session should deal from, and how the pool is weighted. A key
   you could not play comes round sooner; one you have is only dealt when
   there is nothing left to work on. */
function jazzKeyPool(exerciseId, mode, custom){
  const r = jazzRecord(exerciseId);
  if(mode === 'custom') return (custom || []).filter(k => JAZZ_KEY_NAMES.includes(k));
  if(mode === 'unmastered'){
    const left = JAZZ_KEY_NAMES.filter(k => !r.keys[k]);
    return left.length ? left : JAZZ_KEY_NAMES.slice();
  }
  return JAZZ_KEY_NAMES.slice();
}
/* Some exercises are about a distance rather than a chord, and for those a
   key on its own is not a question. "Play the specified interval for the
   given root" with no interval specified is a card that cannot be answered
   and cannot be marked — which is what it was doing. So a card for one of
   those carries a distance as well, drawn at random the same way the key is,
   and the challenge says both. */
const jazzDealInterval = () => JAZZ_INTERVALS[Math.floor(Math.random() * JAZZ_INTERVALS.length)];
function jazzDeal(ids, n, mode, custom){
  const pool = [];
  (ids || []).forEach(id => jazzKeyPool(id, mode, custom).forEach(key => {
    const r = jazzRecord(id);
    /* three tickets for one you have missed, two for a struggle, one for a
       key that is already yours */
    const last = (jazzState().flashes.find(f => f.exerciseId === id && f.key === key) || {}).result;
    const weight = last === 'couldnt' ? 3 : last === 'struggled' ? 2 : r.keys[key] ? 1 : 2;
    const wants = jazzWantsInterval(jazzExercise(id));
    for(let i = 0; i < weight; i++)
      pool.push(wants ? {exerciseId: id, key, interval: jazzDealInterval()}
                      : {exerciseId: id, key});
  }));
  if(!pool.length) return [];
  const out = [];
  const want = clamp(+n || 15, 1, 60);
  /* drawn without putting the same pair back, until the pool runs out and it
     is allowed to come round again */
  let bag = pool.slice();
  while(out.length < want){
    if(!bag.length) bag = pool.slice();
    const at = Math.floor(Math.random() * bag.length);
    const card = bag.splice(at, 1)[0];
    if(out.some(c => c.exerciseId === card.exerciseId && c.key === card.key) && bag.length) continue;
    out.push(card);
  }
  return out;
}
const jazzFlashesOn = day => jazzState().flashes.filter(f => f.day === day);
