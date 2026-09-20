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

   WHAT IS SHIPPED AND WHAT IS YOURS. The stages, the exercises, the theory
   and the Werner passages are shipped as a constant, the way the stepping
   stones are: they are somebody's curriculum, they will be corrected and
   added to in later versions, and a copy of them sitting in everybody's
   database would mean those corrections never arrive. What lives in the
   state is only what you did — which keys you have, what you logged, how the
   flashcards went. If an exercise is ever removed from the catalogue, its
   record is kept rather than swept, because it is a record of your practice
   and not of the catalogue's.
   ============================================================ */

/* the ladder. Each stage names why it exists before it names what to do,
   because an exercise you cannot see the point of is an exercise you will
   drop in a fortnight. */
const JAZZ_STAGES = [
  {id:'s1', n:1, name:'Chord construction',
   blurb:'The four shapes everything else is made of.',
   theory:'Jazz runs on four chord types: major seventh, dominant seventh, minor seventh and half-diminished. The aim is not to work them out — it is to see "Cmaj7" and have the hand already there. Until that is true, everything built on top of it is being worked out too.',
   werner:'Many musicians are so fixated on the complicated that they never spend enough time on the basics. Fear of not becoming great is what keeps people from becoming great.',
   mindset:'Slowly and perfectly, one key at a time. Take your hands off the keys between keys and let it settle.',
   subs:[
     {id:'1.1', name:'Major sevenths', ex:'e-maj7'},
     {id:'1.2', name:'Dominant sevenths', ex:'e-dom7'},
     {id:'1.3', name:'Minor sevenths', ex:'e-min7'},
     {id:'1.4', name:'Half-diminished', ex:'e-min7b5'}]},
  {id:'s2', n:2, name:'Voice leading and shells', needs:'s1',
   blurb:'Two notes that say everything, and the smallest possible move between them.',
   theory:'Put the full chords down. The left hand plays two notes — the third and the seventh — and that is the whole harmony. Watch what happens through a two-five-one: the seventh of the ii falls a half step and becomes the third of the V. That single movement is why jazz sounds smooth, and it is the thing to feel rather than the notes to find.',
   werner:'Neglecting the two-five-one can doom you to struggle with everything that comes after it.',
   mindset:'Name the chord before you play it. If you cannot name it, you are reading shapes, not hearing harmony.',
   subs:[
     {id:'2.1', name:'Shell voicings, third and seventh', ex:'e-shell'},
     {id:'2.2', name:'Two-five-one in root position', ex:'e-251-root'}]},
  {id:'s3', n:3, name:'Two-handed A and B voicings', needs:'s2',
   blurb:'The first voicing that sounds like a record rather than a lesson.',
   theory:'Type A puts the third on the bottom, Type B the seventh. Alternating them through a two-five-one is what makes one pair of notes hold while the other steps down — the hands barely move and the harmony changes completely. Keep the lowest note between the C below middle C and middle C; lower than that and it turns to mud.',
   werner:'Mastery is two things: staying out of the way and letting the music play itself, and being able to play the material perfectly every time without thinking about it.',
   mindset:'Sacrifice speed for perfection. A passage played perfectly once, slowly, is worth an hour of it played nearly right.',
   subs:[
     {id:'3.1', name:'Two-five-one, A then B', ex:'e-251-ab'},
     {id:'3.2', name:'Two-five-one, B then A', ex:'e-251-ba'}]},
  {id:'s4', n:4, name:'One hand, and a bass in two', needs:'s3',
   blurb:'Three notes in the right hand, so the left is free.',
   theory:'Three notes are enough: third, seventh, ninth for a Type A; seventh, third, fifth for a Type B. With the voicing in one hand, the other can walk — root on one, fifth on three — and that is the whole texture you need to accompany a singer on your own.',
   werner:'The objective is nothing less than complete perfection. When the passage plays itself from that place, mastery has happened.',
   mindset:'The move between A and B should feel like a shift, not a jump. If it feels like a jump, the voicing is in the wrong octave.',
   subs:[
     {id:'4.1', name:'One-handed shells, A start', ex:'e-251-oneA'},
     {id:'4.2', name:'One-handed shells, B start', ex:'e-251-oneB'}]},
  {id:'s5', n:5, name:'The blues', needs:'s4',
   blurb:'The form that gets called at every session there has ever been.',
   theory:'Twelve bars: I7 for four, IV7 for two, I7 for two, then ii, V, I and a turnaround. Learn the form before the voicings — the form is what you are asked for, the voicings are what you bring to it. C, F, B flat and G first; those are the keys horn players call.',
   werner:'Perfection is something you surrender to. It overcomes you.',
   mindset:'Play the form through once with one finger before you play it with both hands. If the shape is not in your head, your hands are guessing.',
   subs:[
     {id:'5.1', name:'The jazz blues', ex:'e-blues'},
     {id:'5.2', name:'The blues scale', ex:'e-bluescale'}]},
  {id:'s6', n:6, name:'Beginning to improvise', needs:'s5',
   blurb:'Notes to reach for, before there are ideas to play.',
   theory:'Over a whole two-five-one you can use one scale — the major scale of the I chord — and it will not be wrong anywhere. That is the safety net. The arpeggio of the third, fifth, seventh and ninth is the other one: it is the chord, played one note at a time, and it always sounds like the harmony because it is the harmony.',
   werner:'There are no wrong notes. Every note I play is the most beautiful sound I have ever heard.',
   mindset:'Play four notes and stop. The silence is where you find out whether you meant them.',
   subs:[
     {id:'6.1', name:'Three-five-seven-nine over a two-five-one', ex:'e-3579'},
     {id:'6.2', name:'The major scale of the one chord', ex:'e-majscale'}]},
  {id:'s7', n:7, name:'Altered dominants and tritone subs', needs:'s6',
   blurb:'Tension, on purpose.',
   theory:'An altered dominant swaps the plain ninth and fifth for a flat ninth, a sharp ninth, a flat five or a sharp five. The tritone substitution goes further: replace the V with a dominant chord a half step above the I, and the bass walks down chromatically — D, D flat, C. That descending line is the sound of everything that is not a beginner playing.',
   werner:'Fear and anxiety break focused practice. Stay with one thing until it is properly yours.',
   mindset:'Start from the voicing you already have and move one note. Every altered chord is a chord you know with a finger shifted.',
   subs:[
     {id:'7.1', name:'Dominant with a flat ninth', ex:'e-b9'},
     {id:'7.2', name:'Tritone substitution', ex:'e-tritone'}]},
  {id:'s8', n:8, name:'Modal and pentatonic', needs:'s7',
   blurb:'When the harmony stops moving and the question changes.',
   theory:'Modal writing holds one chord for eight bars and the interest has to come from somewhere else: the mode, the register, the space. Quartal voicings — fourths stacked instead of thirds — are the sound of it, because a stack of fourths does not declare a key the way a stack of thirds does.',
   werner:'Playing from the space, not from the mind. The material has to be so far inside you that there is nothing left to think about.',
   mindset:'Hold a note longer than is comfortable. Modal playing is mostly about what you do not do.',
   subs:[
     {id:'8.1', name:'Dorian', ex:'e-dorian'},
     {id:'8.2', name:'Quartal voicings', ex:'e-quartal'}]},
];

/* The exercises. Each is a pattern — degrees and voicings, no pitches — and
   the engraver writes it out in whichever key is asked for. */
const JAZZ_EXERCISES = {
  'e-maj7': {name:'Major seventh', ask:'Play a major seventh chord in',
    why:'The major seventh is home. It is the I chord in most standards, and it is the sound you are resolving to every time you play a two-five-one.',
    tip:'Root, major third, fifth, major seventh. The seventh is a half step under the root — that rub is the whole colour of the chord.',
    pattern:{title:'Major seventh', bars:[{on:'I', chord:'maj7'}], octave:4}},
  'e-dom7': {name:'Dominant seventh', ask:'Play a dominant seventh chord in',
    why:'The dominant is the engine. It is unstable on purpose, and everything it does is lean towards somewhere else.',
    tip:'A major seventh with the seventh dropped a half step. That one note is what makes it want to move.',
    pattern:{title:'Dominant seventh', bars:[{on:'I', chord:'dom7'}], octave:4}},
  'e-min7': {name:'Minor seventh', ask:'Play a minor seventh chord in',
    why:'The minor seventh is the ii — where nearly every phrase in jazz starts.',
    tip:'Flatten the third and the seventh of a major seventh. Darker, and much less certain about where it is going.',
    pattern:{title:'Minor seventh', bars:[{on:'I', chord:'min7'}], octave:4}},
  'e-min7b5': {name:'Half-diminished', ask:'Play a half-diminished chord in',
    why:'It is the ii of a minor two-five-one, which is most of the ballads worth knowing.',
    tip:'A minor seventh with the fifth flattened too. Three notes lowered from a major seventh, and it sounds like every one of them.',
    pattern:{title:'Half-diminished', bars:[{on:'I', chord:'min7b5'}], octave:4}},
  'e-shell': {name:'Shell voicings', ask:'Play the shell voicing of the ii, the V and the I in',
    why:'Every voicing you will ever learn is built on knowing where the third and the seventh are. Two notes carry the whole of the harmony; the rest is decoration.',
    tip:'The third says major or minor. The seventh says stable or moving. Nothing else is load-bearing.',
    pattern:{title:'Shell voicings', voicing:'shell', octave:3,
      bars:[{on:'ii', chord:'min7'}, {on:'V', chord:'dom7'}, {on:'I', chord:'maj7'}]}},
  'e-251-root': {name:'Two-five-one, root position', ask:'Play a two-five-one in root position in',
    why:'The most common progression in the music. You will meet dozens of them in a single standard, and every one you have to work out is a bar you are not listening in.',
    tip:'Go round in whole steps: C, B flat, A flat, G flat, E, D — then the other six. Name each chord out loud before you play it.',
    pattern:{title:'Two-five-one', octave:3,
      bars:[{on:'ii', chord:'min7'}, {on:'V', chord:'dom7'}, {on:'I', chord:'maj7', up:1}]}},
  'e-251-ab': {name:'Two-five-one, A then B', ask:'Play a two-five-one with A and B voicings, starting on A, in',
    why:'This is how it is actually voiced on a bandstand. Root position sounds like somebody learning; alternating A and B sounds like the record.',
    tip:'Type A from the bottom: third, seventh, ninth, fifth. Type B: seventh, third, fifth, ninth. One pair holds, the other steps down.',
    pattern:{title:'Two-five-one, A–B–A', hands:2, octave:3,
      bars:[{on:'ii', chord:'min7', voicing:'typeA'}, {on:'V', chord:'dom7', voicing:'typeB'},
            {on:'I', chord:'maj7', voicing:'typeA'}]}},
  'e-251-ba': {name:'Two-five-one, B then A', ask:'Play a two-five-one with A and B voicings, starting on B, in',
    why:'Which one you start on is decided by where the last chord left your hand, so both have to be there.',
    tip:'Same two shapes, other order. The voice leading is exactly as smooth going this way, which is the point worth noticing.',
    pattern:{title:'Two-five-one, B–A–B', hands:2, octave:3,
      bars:[{on:'ii', chord:'min7', voicing:'typeB'}, {on:'V', chord:'dom7', voicing:'typeA'},
            {on:'I', chord:'maj7', voicing:'typeB'}]}},
  'e-251-oneA': {name:'One-handed shells, A start', ask:'Play a two-five-one with one-handed shells, A start, in',
    why:'Three notes in one hand leaves the other one free, and a free left hand is the difference between playing chords and accompanying somebody.',
    tip:'Type A is third, seventh, ninth. Type B is seventh, third, fifth. Keep the bottom note between the C below middle C and middle C.',
    pattern:{title:'One-handed shells, A start', octave:3,
      bars:[{on:'ii', chord:'min7', voicing:'oneA'}, {on:'V', chord:'dom7', voicing:'oneB'},
            {on:'I', chord:'maj7', voicing:'oneA'}]}},
  'e-251-oneB': {name:'One-handed shells, B start', ask:'Play a two-five-one with one-handed shells, B start, in',
    why:'The other half of the same skill. Either hand position has to be able to start the phrase.',
    tip:'If the move feels like a jump rather than a shift, you are in the wrong octave for one of the two.',
    pattern:{title:'One-handed shells, B start', octave:3,
      bars:[{on:'ii', chord:'min7', voicing:'oneB'}, {on:'V', chord:'dom7', voicing:'oneA'},
            {on:'I', chord:'maj7', voicing:'oneB'}]}},
  'e-blues': {name:'The jazz blues', ask:'Play the twelve-bar jazz blues in',
    why:'It is the most-called form there is. If you cannot play a blues you cannot sit in, and that is the whole of it.',
    tip:'Learn the shape before the voicings: four of the I, two of the IV, two of the I, then ii, V, I, and a turnaround.',
    pattern:{title:'Jazz blues', voicing:'shell', octave:3, bars:[
      {on:'I', chord:'dom7'}, {on:'IV', chord:'dom7'}, {on:'I', chord:'dom7'}, {on:'I', chord:'dom7'},
      {on:'IV', chord:'dom7'}, {on:'IV', chord:'dom7'}, {on:'I', chord:'dom7'}, {on:'I', chord:'dom7'},
      {on:'ii', chord:'min7'}, {on:'V', chord:'dom7'}, {on:'I', chord:'dom7'}, {on:'V', chord:'dom7'}]}},
  'e-bluescale': {name:'The blues scale', ask:'Play the blues scale in',
    why:'The net under everything. When you have run out of ideas it is still there and it still sounds like the music.',
    tip:'One, flat three, four, sharp four, five, flat seven. Six notes. The sharp four is the one that does the work.',
    pattern:{title:'Blues scale', octave:4, symbols:false,
      line:[[0,0],[2,3],[3,5],[3,6],[4,7],[6,10],[7,12]]}},
  'e-3579': {name:'Three-five-seven-nine', ask:'Play the three-five-seven-nine arpeggios over a two-five-one in',
    why:'It is the chord played one note at a time, so it cannot be wrong, and it teaches your hand where the colour notes are.',
    tip:'Start on the third, not the root. Starting on the root is what makes an arpeggio sound like an exercise.',
    pattern:{title:'Three-five-seven-nine', octave:4, voicing:'typeA',
      bars:[{on:'ii', chord:'min7'}, {on:'V', chord:'dom7'}, {on:'I', chord:'maj7'}]}},
  'e-majscale': {name:'The major scale of the one', ask:'Play the major scale you can use over a whole two-five-one in',
    why:'One scale over three chords. It is the first thing that lets you play a line through a progression instead of a shape per chord.',
    tip:'It works because all three chords come out of the same key. Hear that, and you stop thinking chord by chord.',
    pattern:{title:'Major scale', octave:4, symbols:false,
      line:[[0,0],[1,2],[2,4],[3,5],[4,7],[5,9],[6,11],[7,12]]}},
  'e-b9': {name:'Dominant with a flat ninth', ask:'Play a dominant seventh with a flat ninth in',
    why:'The most tension a dominant can carry, and therefore the strongest pull home.',
    tip:'Take the Type A voicing you already know and drop the ninth a half step. That is the whole alteration.',
    pattern:{title:'Dominant flat nine', hands:2, octave:3,
      bars:[{on:'I', chord:'dom7b9', voicing:'root'}]}},
  'e-tritone': {name:'Tritone substitution', ask:'Play the tritone substitution two-five-one in',
    why:'It turns the bass into a chromatic descent — D, D flat, C — which is the sound of harmony that has been thought about.',
    tip:'The substitute is always a half step above the I. In C: D minor seven, D flat seven, C major seven.',
    pattern:{title:'Tritone substitution', octave:3, voicing:'shell',
      bars:[{on:'ii', chord:'min7'}, {on:'bII', chord:'dom7'}, {on:'I', chord:'maj7'}]}},
  'e-dorian': {name:'Dorian', ask:'Play the Dorian mode in',
    why:'The mode most modal jazz sits in. A minor scale with a raised sixth, and that one note is the whole flavour.',
    tip:'It is the major scale of the key a whole step below, started on the second degree. Hearing it that way makes all twelve easy.',
    pattern:{title:'Dorian', octave:4, symbols:false,
      line:[[0,0],[1,2],[2,3],[3,5],[4,7],[5,9],[6,10],[7,12]]}},
  'e-quartal': {name:'Quartal voicings', ask:'Play a quartal voicing in',
    why:'Fourths stacked instead of thirds. It refuses to say which key it is in, which is exactly what modal writing wants.',
    tip:'Three fourths on top of each other. Move the whole shape up and down the mode without changing its spacing.',
    pattern:{title:'Quartal voicing', octave:3,
      bars:[{on:'I', chord:'min7', voicing:'quartal'}], symbols:false}},
};
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
const jazzExercise = id => JAZZ_EXERCISES[id] || null;
const jazzStage = id => JAZZ_STAGES.find(s => s.id === id) || null;
const jazzSubOf = exId => { for(const s of JAZZ_STAGES) for(const b of s.subs)
  if(b.ex === exId) return {stage: s, sub: b}; return null; };
/* how many of the twelve are yours, for one exercise and for a whole stage */
const jazzKeysGot = id => JAZZ_KEY_NAMES.filter(k => jazzRecord(id).keys[k]).length;
function jazzStageGot(stage){
  const ids = stage.subs.map(b => b.ex);
  return {done: sum(ids.map(jazzKeysGot)), of: ids.length * 12};
}
/* a stage is shut until the one before it is finished, because the whole
   point of a roadmap is that it says what not to do yet */
function jazzStageOpen(stage){
  if(!stage.needs) return true;
  const before = jazzStage(stage.needs);
  if(!before) return true;
  const got = jazzStageGot(before);
  return got.of > 0 && got.done >= got.of;
}
const jazzNowStage = () => JAZZ_STAGES.find(s => jazzStageOpen(s) && jazzStageGot(s).done < jazzStageGot(s).of)
  || JAZZ_STAGES[JAZZ_STAGES.length - 1];

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
function jazzDeal(ids, n, mode, custom){
  const pool = [];
  (ids || []).forEach(id => jazzKeyPool(id, mode, custom).forEach(key => {
    const r = jazzRecord(id);
    /* three tickets for one you have missed, two for a struggle, one for a
       key that is already yours */
    const last = (jazzState().flashes.find(f => f.exerciseId === id && f.key === key) || {}).result;
    const weight = last === 'couldnt' ? 3 : last === 'struggled' ? 2 : r.keys[key] ? 1 : 2;
    for(let i = 0; i < weight; i++) pool.push({exerciseId: id, key});
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
