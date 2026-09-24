/* ============================================================
   WHAT SHOULD I PRACTISE TODAY?

   It is the only question a self-learner has, and a catalogue of ninety-one
   exercises is the worst possible answer to it. A university course answers
   it by having already decided: Siskind's units are about thirty hours each,
   two hours a day for a fortnight, and every unit's assignment page says how
   those minutes are split — so much on fundamentals, so much on the drills,
   so much on tunes, so much listening. Nobody has to choose. That is most of
   what a course is for.

   So this room answers it the same way. A stage has a benchmark in hours and
   days; a day has a plan in minutes; a session is logged against it; and the
   thing you actually want to know — am I where I should be — is a sentence
   at the top rather than a sum you do in your head.

   THREE THINGS THIS DELIBERATELY IS NOT.

   It is not a lock. Every criterion here is a suggestion: the readiness
   indicator says four of five, and the button to finish the stage is live
   anyway. The ladder was unlocked on purpose earlier and this does not
   quietly put the doors back.

   It is not a second clock. The house already has one, and the minutes a
   session logs are real minutes from it wherever the clock was running. What
   this adds is what the minutes were SPENT ON, which no stopwatch knows.

   And it is not a second practice log. The exercise pages already keep
   sittings. A session writes one record and hands each activity to the
   sitting log it belongs to, marked with the session it came from, so the
   totals below can add both without counting anything twice.
   ============================================================ */

/* ---------- the four parts of a practice session ----------
   Siskind's structure, in his order, because the order is the argument:
   fundamentals before drills, drills before tunes, and listening every day
   whether or not you sat at the piano. */
const JAZZ_PARTS = [
  ['fundamentals',   'Fundamentals',      '\u{1f3b9}'],
  ['rote',           'Rote exercises',    '\u{1f504}'],
  ['tunes',          'Working on tunes',  '\u{1f3b5}'],
  ['listening',      'Listening',         '\u{1f3a7}']
];
const jazzPartName = k => (JAZZ_PARTS.find(p => p[0] === k) || [k, k, ''])[1];
const jazzPartIcon = k => (JAZZ_PARTS.find(p => p[0] === k) || [k, k, '○'])[2];

/* ---------- the pace ----------
   The hours do not change. What changes is how many days you give them, and
   therefore how long a day is. Somebody with a job is not a worse student
   than somebody without one, and a benchmark that says otherwise is a
   benchmark people quietly stop opening. */
const JAZZ_PACES = {
  relaxed:   {name:'Relaxed',   of: 0.5, stretch: 2,
    who:'A busy schedule, and still moving forward.'},
  standard:  {name:'Standard',  of: 1,   stretch: 1,
    who:'The Siskind benchmark — a serious student’s pace.'},
  intensive: {name:'Intensive', of: 1.5, stretch: 0.67,
    who:'The time to move fast, and the wish to.'}
};
const JAZZ_PACE_IDS = ['relaxed', 'standard', 'intensive'];
const jazzPace = id => JAZZ_PACES[id] || JAZZ_PACES.standard;
/* A pace is a fraction of the STAGE'S OWN day rather than a fixed number of
   minutes, because the stages are not the same size. Two hours is the
   Siskind day for a unit of the book; the intervals stage is a warm-up and
   its day is half an hour. Setting every stage to 120 minutes would have
   turned a five-minute singing drill into a twenty-minute one. */
const jazzPaceMinutes = (id, sid) => Math.round(
  ((jazzPlanTemplate(sid) || {}).daily || 120) * jazzPace(id).of);

/* ---------- the templates ----------
   Kept as data rather than written into the generator, so a stage can be
   re-weighted without touching a line of code. The minute allocations are
   Siskind's own, out of the assignment section at the end of each unit;
   where a stage covers more than one unit the hours are multiplied and the
   day count with them.

   TWO NUMBERS THAT ARE NOT THE SAME NUMBER. The minutes on each activity
   are what the book's assignment section asks for, and they sum to ninety or
   a hundred — those are stated minimums, not a full session. `daily` is what
   the benchmark actually requires: thirty hours over a fortnight is a
   hundred and twenty-eight minutes a day, so a hundred and twenty is the
   day. The generator keeps the book's PROPORTIONS and scales them to fill
   the day the pace asks for, which is why a relaxed hour and an intensive
   three both divide the same way.

   `keys` says how many keys an activity should cover in a sitting, and
   `pick` how many exercises to draw from the stage for it. A `tune` activity
   is about repertoire rather than about a catalogue exercise, so it names no
   keys: you play it in the key the tune is in. */
/* ---- Curriculum v3 ----
   The templates are keyed by the v3 stages now. The document gives each
   stage a length (Section 3: "~2 weeks" to "~12 weeks", "~78 weeks (~1.5
   years at 2 hours/day practice)") and that is what `days` is: weeks times
   seven, at the two-hour day it assumes. Stage 0 keeps the half-hour day
   it always had — it is a warm-up rather than a unit of a book, and the
   activity list under it adds up to thirty minutes.

   Where a v3 stage absorbed several old rungs, its activities are theirs
   combined and re-weighted, with the Siskind minute proportions kept. */
const JAZZ_PLAN_TEMPLATES = {
  'P0': {hours: 7, days: 14, daily: 30, source: 'Curriculum v3, Stage 0 — about two weeks. A warm-up stage, not a unit of a book',
    parts: [
      ['fundamentals', 10, [['Interval micro-drill',
        'One interval, from all twelve roots, round the circle of fourths. One interval a day, not twelve.', 10, 12, 1]]],
      ['rote', 5, [['Flashcards',
        'Random root, random interval, answered out loud before you touch the keys.', 5, 4, 1]]],
      ['fundamentals', 5, [['Sing it first',
        'Sing the interval, then play it to check. An interval you cannot sing is one your hands are guessing at.', 5, 4, 1]]],
      ['listening', 10, [['Interval recognition',
        'Ear training away from the instrument. Name what you hear before you look.', 10, 0, 0]]]]},

  '1': {hours: 56, days: 28, daily: 120, source: 'Curriculum v3, Stage 1 — about four weeks. Siskind Book 1, Units 1–2',
    parts: [
      ['fundamentals', 10, [['Drone improvisation, then play what you sing',
        'Five minutes over a drone with a timer running; then sing a two- to four-note phrase and find it.', 10, 2, 0]]],
      ['rote', 30, [['Coordination exercise, all twelve keys',
        'The coordination exercise round the twelve, slowly enough that both hands stay honest.', 15, 3, 1],
        ['Chord flashcards and the vamp piece',
        'Chord recall against the clock, then the vamp piece to put the chords somewhere musical.', 15, 3, 2]]],
      ['tunes', 30, [['Swing articulation',
        'The swing exercises and the Charleston, watching the articulation rather than the notes.', 10, 2, 0],
        ['Read a lead sheet, and find its form',
        'Take a standard, name its form (AABA, ABAC…) and every chord in it by type before playing any of them.', 20, 0, 0]]],
      ['listening', 30, [['Guided listening',
        'The stage’s track, following the form all the way through. Twenty times over the month, not twenty times today.', 30, 0, 0]]]]},

  '2': {hours: 84, days: 42, daily: 120, source: 'Curriculum v3, Stage 2 — about six weeks. Siskind Book 1, Units 3–6',
    parts: [
      ['fundamentals', 10, [['Drone improvisation in F and B♭',
        'Grace notes and sequences over a drone, in the two keys the unit asks for.', 10, 2, 0]]],
      ['rote', 40, [['Two-five-one descending by whole steps',
        'One of the two descent sets, joined, without stopping between keys. Shells first, then Type A and B.', 15, 6, 2],
        ['The voicing formulas',
        'Type A and Type B for major, dominant and minor sevenths, until the shape arrives before the thought.', 15, 3, 2],
        ['One hand, and a bass in two',
        'Three notes in one hand, both types, with root and fifth under them in the other.', 10, 3, 1]]],
      ['tunes', 50, [['Two Real Book tunes',
        'Circle every two-five-one, then comp through the form with A/B voicings under a Charleston.', 30, 0, 0],
        ['A standard, solo',
        'Voicing in one hand, bass in the other, melody sung. If somebody can follow the tune, it works.', 20, 0, 0]]],
      ['listening', 20, [['Guided listening',
        'The stage’s tracks, twenty times each, listening to the left hand.', 20, 0, 0]]]]},

  '3': {hours: 84, days: 42, daily: 120, source: 'Curriculum v3, Stage 3 — about six weeks. Siskind Book 1, Units 7–9',
    parts: [
      ['fundamentals', 10, [['Play one, rest one',
        'The phrasing model, and the blues scale in every key. Silence is half the exercise.', 10, 4, 0]]],
      ['rote', 35, [['Chord tones, then approach notes',
        'Only the chord tones over the blues, then each approached by half step. The changes first, decoration second.', 15, 4, 2],
        ['One lick, twelve keys',
        'A single lick round the circle, then the same lick against a Charleston in the left hand.', 20, 4, 1]]],
      ['tunes', 40, [['A blues, every way round',
        'Melody, comping, bass in two, and improvising — the same twelve bars four different ways. Record the solo.', 40, 4, 0]]],
      ['listening', 20, [['Guided listening',
        '“Now’s the Time” by Charlie Parker, “Billie’s Bounce”, “Bag’s Groove” — twenty times each, over the six weeks.', 20, 0, 0]]]]},

  '4': {hours: 84, days: 42, daily: 120, source: 'Curriculum v3, Stage 4 — about six weeks. Siskind Book 1, Units 10–12, with Levine and Berklee',
    parts: [
      ['fundamentals', 15, [['Name the chord, then the mode',
        'Before a scale is played, name the chord it belongs to and hear it resolve. A mode heard in context is a colour.', 15, 3, 1]]],
      ['rote', 40, [['Flat nine and flat thirteen, all keys',
        'One alteration at a time, and know which note it replaced.', 15, 4, 2],
        ['Tritone substitution, all keys',
        'Plain and substituted back to back, in the same key, so the difference is audible.', 15, 4, 1],
        ['Melodic minor, the altered scale, the symmetric scales',
        'The altered scale as melodic minor a semitone up. One fact instead of twelve scales.', 10, 3, 1]]],
      ['tunes', 30, [['Altered voicings on a standard',
        'Every V chord altered for one chorus, then only where your ear wants one.', 30, 0, 0]]],
      ['listening', 20, [['Guided listening',
        '“Blue in Green”, “Nardis”, “Cheek to Cheek” — twenty times each, hearing the colour of each chord.', 20, 0, 0]]]]},

  '5': {hours: 56, days: 28, daily: 120, source: 'Curriculum v3, Stage 5 — about four weeks. Levine Ch. 5, Berklee Ch. 2/7',
    parts: [
      ['fundamentals', 10, [['The plain progression, then the device',
        'Play the bars without the slash chord or the passing diminished first, every time, so you can hear what it adds.', 10, 3, 0]]],
      ['rote', 40, [['Slash chords and passing diminished chords',
        'C/E, F/G, D♭/C, A♭/B♭; then a diminished chord between two diatonic chords a step apart.', 20, 4, 2],
        ['A dominant chain to the tonic',
        'A7–D7–G7–C, each chord the V of the next, in several keys.', 20, 4, 1]]],
      ['tunes', 50, [['Find every device in a standard',
        '“Body and Soul” or “Stella by Starlight”: mark every slash chord, passing diminished, dominant chain and deceptive resolution.', 30, 0, 0],
        ['Play the ones you found',
        'Only the bars with a device in them, slowly, until each one sounds like what it is.', 20, 0, 0]]],
      ['listening', 20, [['Guided listening',
        'Coleman Hawkins, “Body and Soul”, twenty times, hearing the diminished passing chords.', 20, 0, 0]]]]},

  '6': {hours: 84, days: 42, daily: 120, source: 'Curriculum v3, Stage 6 — about six weeks. Siskind Book 2, Units 1–2, Levine Ch. 18–19, Mantooth Ch. 11',
    parts: [
      ['fundamentals', 15, [['Improvise with stepwise connections',
        'Over a two-five-one, connect to the thirds by step. Then the same with pickups.', 15, 3, 0]]],
      ['rote', 35, [['Comping rhythms, one a chorus',
        'Red Garland, locked hands, Freddie Green, the Count Basie rhythm — one pattern for a whole chorus before you change.', 20, 4, 2],
        ['The soprano line',
        'Voice a ii-V-I-vi so the top note moves by step; then comp in 3/4.', 15, 4, 1]]],
      ['tunes', 30, [['Memorise a tune, four steps',
        'Melody, bass notes, inner voices, then other keys — and the eleven steps for the tune you mean to keep.', 30, 0, 0]]],
      ['listening', 40, [['Transcribe, and play along',
        'The COREA process on the stage’s recording — a few bars at a time, exactly, rests included. Play along thirty times or more.', 40, 0, 0]]]]},

  '7': {hours: 84, days: 42, daily: 120, source: 'Curriculum v3, Stage 7 — about six weeks. Siskind Book 2, Units 3–6, Levine Ch. 4/6, Berklee Ch. 4',
    parts: [
      ['fundamentals', 15, [['Guidetone lines, then chromatic lead-ins',
        'The thirds and sevenths alone first. Then approach each one by half step from below, from above, and with an enclosure.', 15, 3, 0]]],
      ['rote', 35, [['The scale patterns',
        'One scale pattern a week in all twelve keys, starting around 80 and adding five when it is clean.', 15, 4, 1],
        ['Minor two-five-one voicings, all three formulas',
        'Low Note, High Note and Root, in every key, and the line cliché under a minor chord.', 20, 4, 2]]],
      ['tunes', 50, [['A minor-key standard',
        '“Beautiful Love” or “Softly As in a Morning Sunrise”: the minor ii-V-is found, voiced, and improvised over with guidetones.', 50, 0, 0]]],
      ['listening', 20, [['Guided listening',
        'The stage’s tracks, twenty times each, listening for how the minor two-five is voiced.', 20, 0, 0]]]]},

  '8': {hours: 84, days: 42, daily: 120, source: 'Curriculum v3, Stage 8 — about six weeks. Siskind Book 2, Units 7–9, and the Barry Harris method',
    parts: [
      ['fundamentals', 15, [['The 6th diminished scale',
        'C6 and its diminished chord, up and down, then harmonised note by note. Then B♭6 over the A section.', 15, 3, 0]]],
      ['rote', 35, [['Arpeggios for rhythm changes',
        '3-5-7-9 through the I-vi-ii-V, connected by half step. The bridge is a cycle of dominants — practise it separately.', 20, 4, 2],
        ['Introductions and endings, in all twelve keys',
        'Three ways in and three ways out. Practise them before you need one.', 15, 4, 1]]],
      ['tunes', 50, [['A blues and a rhythm changes, complete',
        'Introduction, head, a solo built from one motif, ending. A whole performance rather than a chorus that stops.', 50, 0, 0]]],
      ['listening', 20, [['Guided listening',
        '“Oleo” and “Anthropology”, twenty times each, listening to how the pianist starts and stops.', 20, 0, 0]]]]},

  '9': {hours: 112, days: 56, daily: 120, source: 'Curriculum v3, Stage 9 — about eight weeks. Siskind Book 2, Units 10–12, Levine Ch. 18',
    parts: [
      ['fundamentals', 15, [['Walking bass, then drop-two over it',
        'The bass line alone until it is comfortable, then drop-two shapes on top.', 15, 3, 0]]],
      ['rote', 35, [['The ballad devices',
        'Back-phrasing, bell tones, interlocking fifths and sixths, the left-hand shuttle. One per session.', 20, 4, 1],
        ['Solo piano textures',
        'Stride, the shuttle, shells with the melody on top — one texture for a whole chorus.', 15, 4, 1]]],
      ['tunes', 50, [['A ballad, slowly, alone',
        'Rubato introduction, the melody back-phrased, the accompaniment moving underneath. A ballad played nervously fast is the commonest fault here.', 50, 0, 0]]],
      ['listening', 20, [['Guided listening',
        '“Peace Piece”, “My Funny Valentine”, “Waltz for Debby” — twenty times each.', 20, 0, 0]]]]},

  'DT': {hours: 28, days: 28, daily: 60, source: 'Curriculum v3, Section 4E — the dual-tasking track, after Stage 9',
    parts: [
      ['fundamentals', 15, [['The level you are on',
        'Level 1 root over shells; Level 2 melody over basic voicings; Level 3 scat over full voicings; Level 4 lyrics over a real accompaniment.', 15, 2, 1]]],
      ['tunes', 20, [['A tune, singing and playing',
        'The whole form, without stopping. If singing makes the comping fall apart, go back one level.', 20, 0, 0]]],
      ['rote', 10, [['Hands alone, voice alone',
        'The accompaniment on its own until it runs without attention, then the melody sung on its own over a recording of it.', 10, 2, 1]]],
      ['listening', 15, [['Shirley Horn or Diana Krall',
        'One track, listening only to where the piano plays while the voice sings, and where it waits.', 15, 0, 0]]]]},

  '10': {hours: 112, days: 56, daily: 120, source: 'Curriculum v3, Stage 10 — about eight weeks. Siskind Book 3, Units 1–10, Levine Ch. 8',
    parts: [
      ['fundamentals', 15, [['Modal patterns',
        'One modal pattern draped beneath the mode, up and down, as smoothly as the hand allows.', 15, 3, 1]]],
      ['rote', 35, [['Comping practice',
        'So What voicings, quartal, pentatonic — and switching between them mid-chorus.', 20, 3, 2],
        ['Two minutes over a drone',
        'Without stopping. Everything after the first thirty seconds is invention.', 15, 2, 0]]],
      ['tunes', 50, [['A modal tune, and a modal blues',
        '“So What”, “Impressions”, “Maiden Voyage” — then “All Blues”. One departure outside per chorus, resolved.', 50, 0, 0]]],
      ['listening', 20, [['Guided listening',
        '“Maiden Voyage” and “Impressions”, twenty times each. Transcription every other day.', 20, 0, 0]]]]},

  '11': {hours: 84, days: 42, daily: 120, source: 'Curriculum v3, Stage 11 — about six weeks. Levine Ch. 13–14, Berklee Ch. 8/10',
    parts: [
      ['fundamentals', 15, [['Guide-tone lines through the plain changes',
        'The thirds and sevenths through a set of changes, on their own, before anything is added to them.', 15, 3, 1]]],
      ['rote', 35, [['One substitution at a time',
        'Secondary dominants, the backdoor, the walk-up, tritone subs, constant structures — one at a time on a plain progression.', 35, 4, 3]]],
      ['tunes', 50, [['Reharmonise a standard three ways',
        'Take “Here’s That Rainy Day” or your own song, write three different sets of changes, and play from what you wrote.', 50, 0, 0]]],
      ['listening', 20, [['Guided listening',
        '“Here’s That Rainy Day” and “’Round Midnight”, twenty times each, following the bass to hear what was replaced.', 20, 0, 0]]]]},

  '12': {hours: 168, days: 84, daily: 120, source: 'Curriculum v3, Stage 12 — about twelve weeks. Siskind Book 3, Units 11–12, Mantooth, Dobbins',
    parts: [
      ['fundamentals', 15, [['Count it, then stop counting',
        'Five as three plus two, out loud, then as two plus three. They are different pieces of music.', 15, 3, 1]]],
      ['rote', 35, [['Advanced voicings, one system a week',
        'Generic, miracle, polychord, four-way close, drop-two, clusters — one shape in all twelve keys before it gets a name.', 20, 3, 2],
        ['A progression in five and in seven',
        'The bass line alone until it is comfortable, then the chords.', 15, 3, 2]]],
      ['tunes', 50, [['Write something',
        'An original tune, arranged for a combo. Four bars played before writing any more; the rest follows.', 50, 0, 0]]],
      ['listening', 20, [['Guided listening',
        '“The Peacocks” and “Isfahan”, twenty times each.', 20, 0, 0]]]]},

  /* The voice track. The document gives these levels no times of their own
     (they run beside the piano stages), so each is a half-hour or
     forty-five-minute day for as many weeks as its material needs: V1's
     syllables in four, the chapters of patterns and bass lines in six, the
     bebop lines, the ensemble work and the arranging in eight. */
  'V1': {hours: 14, days: 28, daily: 30, source: 'Stoloff, Scat!, Chapter 1 — the syllables and the warm-up',
    parts: [
      ['fundamentals', 10, [['The vocal warm-up', 'Breath, lip trills, then the syllable warm-up at ♩=96, a little faster each day.', 10, 0, 1]]],
      ['rote', 10, [['Syllables to rhythm', 'The four rhythm studies on dah, dit, doo and dwee, straight then swung.', 5, 0, 1],
        ['One syllable pattern in three keys', 'Sung against a drone, so the pitch is somewhere to land.', 5, 3, 1]]],
      ['listening', 10, [['Ella, and whose syllables are whose', 'One scat chorus: write down the syllables you hear, not the notes.', 10, 0, 0]]]]},
  'V2': {hours: 21, days: 42, daily: 30, source: 'Stoloff, Scat!, Chapter 2 — diatonic and chord-scale patterns',
    parts: [
      ['fundamentals', 10, [['A pattern in the day’s keys', 'One diatonic pattern, up the scale and down, in three keys.', 10, 3, 1]]],
      ['rote', 10, [['Over a ii-V', 'The pattern over Dm7–G7, landing on the third of the next chord.', 5, 3, 1],
        ['Triplet patterns', 'The same pattern in triplets — the swing lives between the two.', 5, 3, 1]]],
      ['listening', 10, [['Scat, transcribed by ear', 'Four bars of a scat chorus sung back until it matches.', 10, 0, 0]]]]},
  'V3': {hours: 21, days: 42, daily: 30, source: 'Stoloff, Scat!, the bass-line chapter',
    parts: [
      ['fundamentals', 10, [['The walking line alone', 'Roots on one, chord tones between, on a blues in one key.', 10, 2, 1]]],
      ['rote', 10, [['Bass, then melody, then both', 'Four bars of bass line, four of melody, then alternate bar by bar.', 5, 2, 1],
        ['In another key', 'The same line moved to a second key without writing it out.', 5, 2, 1]]],
      ['listening', 10, [['One voice, two lines', 'Follow only the low notes, then only the tune.', 10, 0, 0]]]]},
  'V4': {hours: 28, days: 56, daily: 30, source: 'Weir, Fearless Vocal Improvisation — the bebop phrases',
    parts: [
      ['fundamentals', 10, [['A bebop line, in time', 'One line from the book, sung to the landing note, slowly.', 10, 3, 1]]],
      ['rote', 10, [['Through the keys', 'The same line in three more keys, transposed by ear.', 5, 3, 1],
        ['Inside a tune', 'Use the line once in a chorus of a standard, then vary its approach.', 5, 0, 1]]],
      ['listening', 10, [['Bebop singers', 'Ella, Anita O’Day, Jon Hendricks — one line sung back.', 10, 0, 0]]]]},
  'V5': {hours: 32, days: 42, daily: 45, source: 'Curriculum v3, Voice Track V5 — ensemble singing and extended techniques',
    parts: [
      ['fundamentals', 10, [['Tuning a chord', 'Sing the third of a held chord and tune it low, then the fifth pure.', 10, 0, 1]]],
      ['rote', 20, [['Your part in the chord', 'One part of a close-harmony arrangement, against the others recorded.', 10, 0, 1],
        ['An extended technique', 'Vocal percussion or overtone singing, five minutes, recorded.', 10, 0, 1]]],
      ['listening', 15, [['Vocal groups', 'Lambert, Hendricks & Ross or Take 6: one track, following one voice.', 15, 0, 0]]]]},
  'V6': {hours: 42, days: 56, daily: 45, source: 'Curriculum v3, Voice Track V6 — vocal arranging; Dobbins',
    parts: [
      ['fundamentals', 10, [['Voicing for voices', 'Spread a piano voicing into four singable parts, each with its own melody.', 10, 0, 1]]],
      ['rote', 20, [['Eight bars arranged', 'Eight bars of a standard for four voices, voice-led by step.', 15, 0, 1],
        ['Check the ranges', 'Sing every part yourself, softly; rewrite anything that strains.', 5, 0, 1]]],
      ['listening', 15, [['Arrangers for voices', 'The Manhattan Transfer or Take 6: where the harmony opens and where it goes to unison.', 15, 0, 0]]]]}
};
const jazzPlanTemplate = sid => JAZZ_PLAN_TEMPLATES[sid] || JAZZ_PLAN_TEMPLATES[String(sid)] || null;

/* ---------- what you have done, per stage ---------- */
function jazzPlanState(){
  const j = jazzState();
  j.stages = j.stages && typeof j.stages === 'object' ? j.stages : {};
  j.sessions = Array.isArray(j.sessions) ? j.sessions : [];
  j.listens = j.listens && typeof j.listens === 'object' ? j.listens : {};
  return j;
}
/** The record for one stage, made only when something happens to it. */
function jazzStageRecord(sid, make){
  const j = jazzPlanState();
  const id = String(sid);
  if(!j.stages[id]){
    if(!make) return {status:'not_started', startDate:null, completedDate:null,
      pace:'standard', targetHours:0, targetDays:0};
    const t = jazzPlanTemplate(id) || {hours: 30, days: 14};
    j.stages[id] = {status:'not_started', startDate:null, completedDate:null,
      pace:'standard', targetHours: t.hours, targetDays: t.days};
  }
  const r = j.stages[id];
  r.pace = JAZZ_PACES[r.pace] ? r.pace : 'standard';
  return r;
}
const jazzStageStatus = sid => jazzStageRecord(sid).status;

function jazzStartStage(sid, pace){
  const r = jazzStageRecord(sid, true);
  const t = jazzPlanTemplate(sid) || {hours: 30, days: 14};
  r.pace = JAZZ_PACES[pace] ? pace : 'standard';
  r.status = 'active';
  r.startDate = r.startDate || today();
  r.completedDate = null;
  r.targetHours = t.hours;
  /* the hours do not change with the pace; the days do */
  r.targetDays = Math.max(1, Math.round(t.days * jazzPace(r.pace).stretch));
  saveNow();
  return r;
}
function jazzCompleteStage(sid){
  const r = jazzStageRecord(sid, true);
  r.status = 'completed';
  r.completedDate = today();
  saveNow();
  return r;
}
function jazzReopenStage(sid){
  const r = jazzStageRecord(sid, true);
  r.status = 'active';
  r.completedDate = null;
  saveNow();
  return r;
}
/** The stage you are on, which is the one you started rather than the one
    the key count guesses at. */
function jazzActiveStage(){
  const started = jazzStages().filter(s => jazzStageStatus(s.id) === 'active');
  if(started.length) return started[0];
  return jazzNowStage();
}

/* ---------- how many minutes, and where they came from ----------
   Two places keep them and neither is wrong: a session logged against the
   plan, and a sitting logged from an exercise page. A sitting that a session
   wrote carries the session's id, so adding both counts nothing twice. */
const jazzSessions = () => jazzPlanState().sessions;
const jazzStageSessions = sid => jazzSessions().filter(s => String(s.stageId) === String(sid));
function jazzStageMinutes(sid){
  const stage = jazzStage(sid);
  const ids = (stage && stage.subs) || [];
  const fromSessions = sum(jazzStageSessions(sid).map(s => +s.minutes || 0));
  const loose = jazzAllLogs().filter(l => !l.fromSession && ids.includes(l.exerciseId));
  return Math.round(fromSessions + sum(loose.map(l => +l.minutes || 0)));
}
/** Every day this stage was touched, newest first. */
function jazzStageDays(sid){
  const stage = jazzStage(sid);
  const ids = (stage && stage.subs) || [];
  const days = {};
  jazzStageSessions(sid).forEach(s => { days[s.day] = (days[s.day] || 0) + (+s.minutes || 0); });
  jazzAllLogs().forEach(l => { if(l.fromSession || !ids.includes(l.exerciseId)) return;
    days[l.day] = (days[l.day] || 0) + (+l.minutes || 0); });
  return Object.keys(days).sort().reverse().map(d => ({day: d, minutes: Math.round(days[d])}));
}
/** Consecutive days up to today, across the whole studio. */
function jazzStreak(){
  const days = {};
  jazzSessions().forEach(s => days[s.day] = true);
  jazzAllLogs().forEach(l => days[l.day] = true);
  const has = d => !!days[d];
  let n = 0;
  const d = parseDay(today());
  /* today not being practised yet does not break a streak until tomorrow */
  if(!has(today())) d.setDate(d.getDate() - 1);
  for(;;){
    const key = timeDayOf(d.toISOString());
    if(!has(key)) break;
    n++;
    d.setDate(d.getDate() - 1);
    if(n > 3650) break;
  }
  let best = 0, run = 0, last = null;
  Object.keys(days).sort().forEach(k => {
    if(last){ const gap = daysBetweenDays(last, k); run = gap === 1 ? run + 1 : 1; }
    else run = 1;
    best = Math.max(best, run);
    last = k;
  });
  return {now: n, best: Math.max(best, n)};
}
const daysBetweenDays = (a, b) =>
  Math.round((parseDay(b) - parseDay(a)) / 86400000);

/* ---------- am I where I should be ---------- */
function jazzPaceOf(sid){
  const r = jazzStageRecord(sid);
  const t = jazzPlanTemplate(sid) || {hours: 30, days: 14};
  const hours = jazzStageMinutes(sid) / 60;
  /* the fast track is the essential exercises only, in about half the time */
  const fastF = typeof jazzTrack === 'function' && jazzTrack() === 'fast-track' ? 0.5 : 1;
  const targetHours = Math.round((r.targetHours || t.hours) * fastF * 10) / 10;
  const targetDays = Math.max(1, Math.round((r.targetDays || t.days) * fastF));
  const started = r.startDate || null;
  const day = started ? Math.max(1, daysBetweenDays(started, today()) + 1) : 0;
  /* Two different numbers, and conflating them is how a tracker tells
     somebody they are behind before they have had a chance to practise.
     `expected` is where the line is by the END of today, which is what the
     plan aims at. `owed` is what should ALREADY be done — the days that have
     closed — and that is what behind-or-ahead is judged against. On the
     first morning of a stage, nothing is owed and nobody is behind. */
  const expected = started ? Math.min(targetHours, targetHours * (day / targetDays)) : 0;
  const owed = started ? Math.min(targetHours, targetHours * Math.max(0, day - 1) / targetDays) : 0;
  const status = !started ? 'not_started'
    : owed <= 0 ? (hours > 0 ? 'ahead' : 'on_track')
    : hours >= owed * 1.1 ? 'ahead'
    : hours >= owed * 0.9 ? 'on_track' : 'behind';
  /* At the rate you have actually been going — but not until there is a
     rate. One good evening on day one projects a finish date forty-eight
     days out, which is arithmetic rather than information, and a number that
     silly is a number people stop believing. Three days is the floor. */
  const perDay = day > 0 ? hours / day : 0;
  const left = Math.max(0, targetHours - hours);
  const daysLeft = (day >= 3 && perDay > 0.01) ? Math.ceil(left / perDay) : null;
  const finish = daysLeft == null ? null
    : (() => { const d = parseDay(today()); d.setDate(d.getDate() + daysLeft);
        return timeDayOf(d.toISOString()); })();
  return {hours: Math.round(hours * 10) / 10, targetHours, targetDays, day,
    expected: Math.round(expected * 10) / 10, owed: Math.round(owed * 10) / 10,
    status, left: Math.round(left * 10) / 10,
    daysLeft, finish, pace: r.pace,
    pct: targetHours ? Math.min(100, Math.round(hours / targetHours * 100)) : 0};
}
/** The sentence at the top, which is the whole point of the arithmetic. */
function jazzPaceSaid(sid){
  const p = jazzPaceOf(sid);
  if(p.status === 'not_started') return 'Not started yet.';
  const off = Math.round(Math.abs(p.hours - p.owed) * 10) / 10;
  if(p.status === 'ahead')
    return `${off ? off + ' hour' + (off === 1 ? '' : 's') : 'Some hours'} ahead of the line.`
      + (p.daysLeft == null
        ? ' A few more days and this will say when you are likely to finish.'
        : ` At this rate you finish this stage in ${p.daysLeft} more day${p.daysLeft === 1 ? '' : 's'}.`);
  if(p.status === 'behind'){
    /* what it would take to be back on the line, said as minutes a day
       rather than as a number of hours nobody can act on */
    const daysLeft = Math.max(1, p.targetDays - p.day + 1);
    const extra = Math.ceil(off * 60 / daysLeft);
    return `${off} hour${off === 1 ? '' : 's'} behind. Another ${extra} minutes a day `
      + `for the rest of the stage puts you back on the line.`;
  }
  if(p.day === 1 && !p.hours) return 'Day one. Nothing is owed yet \u2014 the plan below is today\u2019s.';
  return 'On track.';
}

/* ---------- which keys today ----------
   Siskind's two descent sets are the order, alternating day by day, because
   they are the order the book practises everything in and because between
   them they cover the twelve. What moves within that is which of them you
   still need: a key the flashcards have marked off is dealt last, a key you
   have not touched comes first. */
const JAZZ_EASY_KEYS = ['C', 'F', 'Bb', 'Eb', 'G', 'D'];
function jazzDescentForDay(day){
  const G = typeof JazzExerciseGenerator !== 'undefined' ? JazzExerciseGenerator : null;
  const a = (G && G.DESCENT_SET_A) || ['C','Bb','Ab','Gb','E','D'];
  const b = (G && G.DESCENT_SET_B) || ['Db','B','A','G','F','Eb'];
  return (day % 2 === 1) ? {name: 'A', keys: a} : {name: 'B', keys: b};
}
/**
 * @param {string[]} ids   – the exercises this activity draws on
 * @param {number} want    – how many keys to name
 * @param {number} day     – day number of the stage, which picks the set
 */
function jazzKeysForToday(ids, want, day){
  if(!want) return [];
  const got = {};
  (ids || []).forEach(id => JAZZ_KEY_NAMES.forEach(k => {
    if(jazzRecord(id).keys[k]) got[k] = (got[k] || 0) + 1; }));
  const n = (ids || []).length || 1;
  const set = jazzDescentForDay(day);
  /* the day's set first, then whatever else is left, so the rotation moves
     round the circle rather than sitting on the front of the list */
  const order = set.keys.concat(JAZZ_KEY_NAMES.filter(k => !set.keys.includes(k)));
  /* Three things decide the order, and they have to be weighted rather than
     added flat. How much of it you already have comes first, because the
     point is the keys you do not have. Then whether it is in today's set,
     because the set IS the rotation — without this term a hard key from the
     other set outranked an easy key from this one and the sets stopped
     meaning anything. The easy-key nudge is last and is only a tiebreak. */
  const rank = k => (got[k] >= n ? 2 : got[k] ? 1 : 0) * 10
    + (set.keys.includes(k) ? 0 : 3)
    + (JAZZ_EASY_KEYS.includes(k) ? 0.25 : 0);
  const sorted = order.slice().sort((x, y) => rank(x) - rank(y));
  return sorted.slice(0, Math.min(want, sorted.length));
}
/** The exercises of a stage, weakest first: least practised, worst rated. */
function jazzWeakest(stage, n){
  const ids = (stage && stage.subs) || [];
  const worth = id => {
    const r = jazzRecord(id);
    const mins = sum((r.logs || []).map(l => +l.minutes || 0));
    /* scaled to twelve, so a theory page marked read weighs like a
       finished exercise rather than like a twelfth of one */
    const keys = jazzExGot(id) * 12 / jazzExUnits(id);
    const rating = (r.logs && r.logs[0] && r.logs[0].quality) || '';
    const bad = rating === 'rough' ? -2 : rating === 'shaky' ? -1
      : rating === 'automatic' ? 2 : rating === 'solid' ? 1 : 0;
    return keys * 10 + mins / 10 + bad * 5;
  };
  return ids.slice().sort((a, b) => worth(a) - worth(b)).slice(0, Math.max(0, n || 0));
}

/* ---------- listening, counted to twenty ----------
   "Listen at least twenty times" is in every unit of the book and is the
   instruction most likely to be nodded at and skipped, because nothing
   counts it. This counts it. */
const JAZZ_LISTEN_TARGET = 20;
const jazzTrackId = a => `${a.artist}|${a.track}`.toLowerCase().replace(/[^a-z0-9|]+/g, '-');
function jazzListenRecord(a, make){
  const j = jazzPlanState();
  const id = jazzTrackId(a);
  if(!j.listens[id]){
    if(!make) return {plays: 0, log: []};
    j.listens[id] = {artist: a.artist, track: a.track, album: a.album || '',
      plays: 0, log: []};
  }
  const r = j.listens[id];
  r.log = Array.isArray(r.log) ? r.log : [];
  r.plays = Math.max(0, +r.plays || 0);
  return r;
}
const jazzListens = a => jazzListenRecord(a).plays;
function jazzMarkListened(a, focus){
  const r = jazzListenRecord(a, true);
  r.plays++;
  r.log.unshift({at: new Date().toISOString(), day: today(), focus: focus || ''});
  if(r.log.length > 200) r.log.length = 200;
  saveNow();
  return r.plays;
}
function jazzUnmarkListened(a){
  const r = jazzListenRecord(a, true);
  if(r.plays > 0){ r.plays--; r.log.shift(); saveNow(); }
  return r.plays;
}
/** The tracks a stage asks you to live with, without repeating one that two
    of its exercises happen to share. */
function jazzStageListening(stage){
  const out = [], seen = {};
  ((stage && stage.subs) || []).forEach(id => {
    const ex = jazzExercise(id);
    (ex && ex.listeningAssignments || []).forEach(a => {
      const k = jazzTrackId(a);
      if(seen[k]) return;
      seen[k] = true;
      out.push(a);
    });
  });
  return out;
}
/** The one to put in front of you today: the least listened to. */
function jazzTodaysTrack(stage){
  const all = jazzStageListening(stage);
  if(!all.length) return null;
  return all.slice().sort((a, b) => jazzListens(a) - jazzListens(b))[0];
}

/* ---------- what to practise today ----------
   Built fresh every time it is asked for rather than stored, because a plan
   stored yesterday is a plan that does not know what you did last night.
   Nothing here is written down until you log a session against it. */
function jazzTodaysPlan(sid){
  const stage = jazzStage(sid);
  if(!stage) return null;
  const t = jazzPlanTemplate(stage.id);
  if(!t) return null;
  const p = jazzPaceOf(stage.id);
  const rec = jazzStageRecord(stage.id);
  const pace = jazzPace(rec.pace);
  const paceMinutes = jazzPaceMinutes(rec.pace, stage.id);
  const day = Math.max(1, p.day || 1);

  /* Behind: a longer day. Ahead: the option of a shorter one. The scale is
     applied to the whole session rather than to one part, so the balance the
     book struck between fundamentals, drills, tunes and listening survives. */
  const scale = p.status === 'behind' ? 1.25 : p.status === 'ahead' ? 0.75 : 1;
  const templateMinutes = sum(t.parts.map(x => x[1]));
  const want = Math.round(paceMinutes * scale);
  const factor = templateMinutes ? want / templateMinutes : 1;
  const mins = m => Math.max(5, Math.round(m * factor / 5) * 5);

  /* The exercises themselves come from the day's plan (19-jazz-w-dayplan.js):
     four to six, rotated, balanced, in the keys the rotation has reached.
     The template stays as the stage's benchmark — its hours and its days. */
  const day0 = typeof jazzDayPlan === 'function' && String(jazzActiveStage().id) === String(stage.id) ? jazzDayPlan() : null;
  const required = [];
  if(day0) day0.exercises.forEach(r => required.push({category: JAZZ_SLOT_PART[r.slot] || 'fundamentals',
    name: r.title, description: r.todayFocus, minutes: r.estimatedMinutes, keys: r.keys || [],
    exercises: r.synthetic ? [] : [r.exerciseId], why: r.reason, row: r}));
  else t.parts.forEach(part => {
    const [category, , activities] = part;
    activities.forEach(a => {
      const [name, description, minutes, keyCount, pickCount] = a;
      const picked = pickCount ? jazzWeakest(stage, pickCount) : [];
      required.push({category, name, description,
        minutes: mins(minutes),
        keys: jazzKeysForToday(picked.length ? picked : stage.subs, keyCount, day),
        exercises: picked,
        why: picked.length ? 'the least practised of this stage' : ''});
    });
  });

  /* Listening is a block of its own even when the template gives it none, so
     that the twenty is always in front of you. */
  const track = jazzTodaysTrack(stage);

  /* ---------- and what would put you ahead ----------
     Drawn from what the room already knows rather than invented: a key
     nobody has touched, a checkpoint not yet ticked, the creative challenge
     the enrichment layer wrote for one of this stage's exercises. */
  const bonus = [];
  const cold = JAZZ_KEY_NAMES.filter(k =>
    !stage.subs.some(id => jazzRecord(id).keys[k]));
  if(cold.length) bonus.push({name: 'The keys nobody has touched',
    description: `${cold.slice(0, 3).map(jazzPretty).join(', ')} — fifteen minutes on the ones you keep not choosing.`,
    minutes: 15, why: 'the twelve are the exercise; three of them are still at zero'});
  const openCheck = stage.subs.map(id => {
    const ex = jazzExercise(id);
    const item = (ex && ex.masteryChecklist || []).find(c => !jazzCheckGot(id, c));
    return item ? {id, ex, item} : null;
  }).filter(Boolean)[0];
  if(openCheck) bonus.push({name: 'A checkpoint you have not claimed',
    description: `${openCheck.ex.name} — “${openCheck.item}”`,
    minutes: 10, why: 'it is the next thing this exercise asks of you', exerciseId: openCheck.id});
  const challenge = stage.subs.map(id => {
    const ex = jazzExercise(id);
    return ex && ex.creativeChallenge ? {id, ex} : null; }).filter(Boolean);
  if(challenge.length){
    const pick = challenge[(day - 1) % challenge.length];
    bonus.push({name: 'Something to make with it',
      description: pick.ex.creativeChallenge, minutes: 15,
      why: 'the part of practising that is not drilling', exerciseId: pick.id});
  }
  if(track && jazzListens(track) < JAZZ_LISTEN_TARGET)
    bonus.push({name: 'Catch up on the listening',
      description: `${track.artist} — ${track.track}. ${jazzListens(track)} of ${JAZZ_LISTEN_TARGET} so far.`,
      minutes: 10, why: 'Siskind: "any study of jazz without gobs and gobs of listening is truly futile"'});

  /* ---------- how long you actually have ----------
     The four-part session assumes two hours. On a thirty-minute day the book
     does not want a quarter of each part — it wants one part, done properly,
     and the next part tomorrow. So the short sessions rotate rather than
     shrink, and only the two-hour and longer ones keep all four. */
  const budget = jazzSessionBudget();
  /* the day's plan already fits the budget; only the old template shape needs shaping */
  const shaped = day0 ? {blocks: required, name: (JAZZ_BUDGETS.find(b => b.id === budget) || {}).name || '',
      note: 'Four to six exercises, chosen for today — focus is worth more than volume.', dropped: []}
    : jazzShapePlan(required, budget, day);

  /* and what the last self-analysis said to work on, which is a better
     focus prompt than anything that could be invented here */
  const analysis = typeof jazzLatestAnalysis === 'function' ? jazzLatestAnalysis() : null;
  const focus = analysis && analysis.improvementGoals && analysis.improvementGoals.length
    ? analysis.improvementGoals[(day - 1) % analysis.improvementGoals.length] : null;

  return {stage, day, pace: p, paceName: pace.name, dayPlan: day0,
    totalMinutes: day0 ? day0.totalEstimatedMinutes : sum(shaped.blocks.map(r => r.minutes)),
    set: jazzDescentForDay(day).name,
    required: shaped.blocks, bonus, track,
    budget, budgetName: shaped.name, budgetNote: shaped.note,
    dropped: shaped.dropped, focus, analysisTune: analysis ? analysis.tuneName : null,
    material: jazzMaterialDue(stage, day),
    plays: track ? jazzListens(track) : 0, target: JAZZ_LISTEN_TARGET};
}

/* ---------- time scaling ----------
   Four budgets, and a different allocation strategy for each. */
const JAZZ_BUDGETS = [
  {id:'30', minutes:30, name:'Abbreviated',
   note:'One part today, the next tomorrow. Four days makes a whole session.'},
  {id:'60', minutes:60, name:'Condensed',
   note:'A short warm-up and the two parts you have gone longest without.'},
  {id:'120', minutes:120, name:'Full',
   note:'All four parts, at roughly half an hour each. This is the session the book assumes.'},
  {id:'180', minutes:180, name:'Extended',
   note:'All four, and room for a second tune or a second transcription.'}
];
const JAZZ_PART_ORDER = ['fundamentals','rote','tunes','listening'];
function jazzSessionBudget(){
  const st = jazzState().settings;
  return JAZZ_BUDGETS.find(b => b.id === st.budget) ? st.budget : '120';
}
/* whether a length was chosen for the day, or the stage's pace decides it */
const jazzBudgetChosen = () => !!JAZZ_BUDGETS.find(b => b.id === jazzState().settings.budget);
function jazzSetSessionBudget(id){
  const st = jazzState().settings;
  if(id === 'pace') delete st.budget;
  else st.budget = JAZZ_BUDGETS.find(b => b.id === id) ? id : '120';
  saveNow();
}
/* Which parts survive the budget, and at what length. The rotation is by
   day number, so a run of thirty-minute days still covers all four parts. */
function jazzShapePlan(blocks, budgetId, day){
  const b = JAZZ_BUDGETS.find(x => x.id === budgetId) || JAZZ_BUDGETS[2];
  const present = JAZZ_PART_ORDER.filter(p => blocks.some(x => x.category === p));
  if(!present.length) return {blocks, name:b.name, note:b.note, dropped:[]};

  if(b.id === '30'){
    const pick = present[(day - 1) % present.length];
    const kept = blocks.filter(x => x.category === pick);
    const each = Math.max(5, Math.round(30 / kept.length / 5) * 5);
    return {blocks: kept.map(x => Object.assign({}, x, {minutes: each})),
      name:b.name, note:b.note, dropped: present.filter(p => p !== pick)};
  }
  if(b.id === '60'){
    /* two parts, advancing by one each day, so a run of one-hour days still
       covers all four rather than repeating the same pair */
    const start = (day - 1) % present.length;
    const pick = [present[start], present[(start + 1) % present.length]];
    const kept = blocks.filter(x => pick.includes(x.category));
    const each = Math.max(5, Math.round(50 / kept.length / 5) * 5);
    return {blocks: kept.map(x => Object.assign({}, x, {minutes: each})),
      name:b.name, note:b.note, dropped: present.filter(p => !pick.includes(p))};
  }
  if(b.id === '180'){
    return {blocks: blocks.map(x => Object.assign({}, x,
      {minutes: Math.max(5, Math.round(x.minutes * 1.5 / 5) * 5)})),
      name:b.name, note:b.note, dropped: []};
  }
  return {blocks, name:b.name, note:b.note, dropped: []};
}

/* ---------- rotation through the stage's material ----------
   The unit assignment material on this stage, least-touched first, so the
   plan can name two or three specific things rather than a category. */
function jazzMaterialDue(stage, day){
  if(typeof siskindMaterialsForStage !== 'function') return [];
  const all = siskindMaterialsForStage(stage.id);
  if(!all.length) return [];
  const scored = all.map(m => {
    const r = jazzRecord(m.ladderId);
    const keys = Object.keys(r.keys || {}).length;
    const last = r.lastAt ? daysSince(r.lastAt) : 999;
    return {m, keys, last};
  }).sort((a, b) => (a.keys - b.keys) || (b.last - a.last));
  /* rotate the window so the same three are not named every day */
  const off = (day - 1) % Math.max(1, scored.length);
  const rot = scored.slice(off).concat(scored.slice(0, off));
  return rot.slice(0, 3).map(x => ({
    id: x.m.ladderId, name: x.m.name, kind: x.m.kind,
    keys: x.keys, last: x.last === 999 ? null : x.last}));
}

/* ---------- the session ----------
   One record per sitting, and each activity in it also handed to the
   exercise it belongs to so the sittings on an exercise page stay true.
   Those carry the session's id, and the stage totals skip anything that has
   one, so the same minutes are never added twice. */
function jazzSessionOpen(){
  const j = jazzPlanState();
  return j.session && j.session.start ? j.session : null;
}
function jazzStartSession(sid){
  const j = jazzPlanState();
  if(j.session && j.session.start) return j.session;
  j.session = {id: uid(), stageId: String(sid), day: today(),
    start: new Date().toISOString(), activities: []};
  /* the house's own clock, so the minutes are real rather than typed */
  try { if(typeof timeAutoStart === 'function')
    timeAutoStart({categoryId:'piano', feature:'jazz', what:'jazz practice session',
      linkedType:'skill', linkedId:null, linkedLabel:'Jazz piano'}); } catch(e){}
  saveNow();
  return j.session;
}
function jazzSessionAdd(fields){
  const s = jazzSessionOpen();
  if(!s) return null;
  const a = Object.assign({id: uid(), category:'rote', name:'', minutes:0,
    keys: [], exerciseId: null, rating: 'improving', note: ''}, fields || {});
  a.minutes = Math.max(0, Math.round(+a.minutes || 0));
  a.keys = (a.keys || []).filter(k => JAZZ_KEY_NAMES.includes(k));
  s.activities.push(a);
  saveNow();
  return a;
}
function jazzSessionDrop(id){
  const s = jazzSessionOpen();
  if(!s) return false;
  const at = s.activities.findIndex(a => a.id === id);
  if(at < 0) return false;
  s.activities.splice(at, 1);
  saveNow();
  return true;
}
/** Ends it, writes it down, and hands each activity to its exercise.
    Named `finish` rather than `end` because the flashcards already have a
    `jazzEndSession`, and this house is one scope: two functions with one
    name is the last one loaded silently winning. */
function jazzFinishSession(fields){
  const j = jazzPlanState();
  const s = jazzSessionOpen();
  if(!s) return null;
  const f = fields || {};
  s.end = new Date().toISOString();
  const byHand = +f.minutes || 0;
  const clocked = Math.round((Date.parse(s.end) - Date.parse(s.start)) / 60000);
  const ticked = sum(s.activities.map(a => +a.minutes || 0));
  /* what you said you did, then what you ticked off, then the clock */
  s.minutes = Math.max(0, byHand || ticked || clocked);
  s.feeling = ['frustrated','okay','good','great'].includes(f.feeling) ? f.feeling : null;
  s.notes = String(f.notes || '').trim();
  /* Section 4G: practice time and play time, told apart */
  s.mode = f.mode === 'play' ? 'play' : 'practice';
  const p = jazzPaceOf(s.stageId);
  s.paceStatus = p.status;
  j.sessions.unshift(s);
  if(j.sessions.length > 2000) j.sessions.length = 2000;
  /* each activity that names an exercise becomes a sitting on it too */
  s.activities.forEach(a => {
    if(!a.exerciseId || !jazzExercise(a.exerciseId)) return;
    try { jazzLogPractice(a.exerciseId, {minutes: a.minutes, keys: a.keys,
      quality: a.rating, note: a.note, markKeys: false, fromSession: s.id}); } catch(e){}
  });
  j.session = null;
  try { if(typeof timeAutoStop === 'function') timeAutoStop('jazz'); } catch(e){}
  saveNow();
  return s;
}
function jazzAbandonSession(){
  const j = jazzPlanState();
  j.session = null;
  try { if(typeof timeAutoStop === 'function') timeAutoStop('jazz'); } catch(e){}
  saveNow();
  return true;
}

/* ---------- are you ready to move on ----------
   Suggestions, and said as suggestions. The ladder was unlocked on purpose;
   this does not put the doors back on it. */
function jazzReadiness(sid){
  const stage = jazzStage(sid);
  if(!stage) return {rows: [], met: 0, of: 0};
  const p = jazzPaceOf(stage.id);
  const got = jazzStageGot(stage);
  const ids = stage.subs;
  const rated = ids.filter(id => {
    const l = (jazzRecord(id).logs || [])[0];
    return l && (l.quality === 'solid' || l.quality === 'automatic'); }).length;
  /* every track this stage asks for, not just the one in front of you today */
  const tracks = jazzStageListening(stage);
  const heard = tracks.filter(a => jazzListens(a) >= JAZZ_LISTEN_TARGET).length;
  const checks = ids.reduce((n, id) => n + jazzChecksGot(id).done, 0);
  const checksOf = ids.reduce((n, id) => n + jazzChecksGot(id).of, 0);
  const rows = [
    {said: `Logged ${p.hours} of ${p.targetHours} hours`, ok: p.hours >= p.targetHours * 0.9},
    {said: `Practised in all twelve keys (${got.done}/${got.of})`, ok: got.of > 0 && got.done >= got.of},
    {said: `Every exercise rated solid (${rated}/${ids.length})`, ok: ids.length > 0 && rated >= ids.length},
    {said: tracks.length
       ? `Listened ${JAZZ_LISTEN_TARGET} times to each of the ${tracks.length} tracks (${heard}/${tracks.length})`
       : 'Nothing to listen to at this stage',
     ok: !tracks.length || heard >= tracks.length},
    {said: `Checkpoints ticked (${checks}/${checksOf})`, ok: checksOf > 0 && checks >= checksOf}
  ];
  return {rows, met: rows.filter(r => r.ok).length, of: rows.length};
}

/* ---------- the weeks, for the chart ---------- */
function jazzWeeklyHours(n){
  const weeks = [];
  const d = parseDay(today());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));       /* back to Monday */
  for(let i = 0; i < (n || 6); i++){
    const from = timeDayOf(d.toISOString());
    const to = (() => { const e = parseDay(from); e.setDate(e.getDate() + 6);
      return timeDayOf(e.toISOString()); })();
    let mins = 0;
    jazzSessions().forEach(s => { if(s.day >= from && s.day <= to) mins += +s.minutes || 0; });
    jazzAllLogs().forEach(l => { if(l.fromSession) return;
      if(l.day >= from && l.day <= to) mins += +l.minutes || 0; });
    weeks.unshift({from, to, hours: Math.round(mins / 6) / 10, now: i === 0});
    d.setDate(d.getDate() - 7);
  }
  return weeks;
}
/** Everything, as a file somebody could keep or send on. */
function jazzExportLog(){
  return JSON.stringify({exported: new Date().toISOString(),
    stages: jazzPlanState().stages, sessions: jazzSessions(),
    listens: jazzPlanState().listens,
    progress: jazzState().progress}, null, 2);
}
