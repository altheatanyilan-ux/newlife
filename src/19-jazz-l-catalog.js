/* ============================================================
   SISKIND CURRICULUM CATALOG — the thirteen data models.

   The units say what to do on a given day. This says what those
   things ARE: every named comping pattern with the beats it falls
   on, every coordination exercise with its two hands written out
   separately, every scale pattern, every worksheet, every
   transcription project with its five COREA steps and the record
   it is taken from.

   This file is data only — thirteen models, seeded from Books 1-3.
   The views that draw it live in 19-jazz-o-views.js, the stage
   gating in 19-jazz-m-stagemap.js, the practice plan in
   19-jazz-n-planengine.js.

   Field names follow the specification's interfaces rather than
   this file's convenience, so the two can be read side by side.

   A note on musicXmlNotation: every model that the specification
   gives a notation field has one, and every one of them is empty.
   The engraver in this app builds its notation from a generator
   rather than from stored files, so these are the hooks that
   generator will fill. They are declared rather than skipped so
   that nothing has to be added to the shape later.
   ============================================================ */

/* Notation is generated, not stored — see the header. */
const JZ_XML_TODO = '';

/* ── MODEL 1: CoordinationExercise ─────────────────────────────
   Right hand plays a scale or melodic pattern; left hand comps a
   rhythm. Six in Book 1, six in Book 2. */

const COORD_EXERCISES = [
  {id:'C1', name:'Coordination Exercise 1', shortCode:'B1-Coord-1', book:1, unit:1,
   stageId:'1', difficulty:'beginner', minutesRecommended:20,
   description:'Swing eighths in the right hand over left-hand quarter notes. Repeat every other note of a major scale to create a triplet subdivision, emphasising the third partial of the beat. Then remove the repeated note but continue hearing it internally.',
   rhDescription:'Major scale with repeated notes creating a triplet feel. On beats 1 and 2, repeat every other scale note so three notes fit in the space of two — then drop the repeat but keep hearing it.',
   lhDescription:'Quarter notes on every beat. One chord per bar, whole-note voicings to start.',
   compingPattern:'quarter notes on every beat', scaleType:'Major scale',
   keysToPractice:['all twelve'], sourcePageRef:'Book 1 p.12',
   prerequisites:[], musicXmlNotation:JZ_XML_TODO,
   crossRefs:['S1','S2','S3','S4']},

  {id:'C2', name:'Coordination Exercise 2', shortCode:'B1-Coord-2', book:1, unit:2,
   stageId:'1-2', difficulty:'beginner', minutesRecommended:20,
   description:'Major scales in the right hand over Charleston and Reverse Charleston comping in the left. Line A uses the Charleston pattern, Line B the Reverse Charleston, and Lines C and D mix both. Swing articulation in the right hand with short staccato chords in the left.',
   rhDescription:'Major scales with correct swing articulation — long-short emphasis, short on the onbeat, accent on the offbeat.',
   lhDescription:'Line A: Charleston (beat 1 and "and of 2"). Line B: Reverse Charleston ("and of 1" and beat 3). Lines C-D: mix both patterns.',
   compingPattern:'Charleston / Reverse Charleston', scaleType:'Major scale',
   keysToPractice:['all twelve'], sourcePageRef:'Book 1 p.24',
   prerequisites:['C1'], musicXmlNotation:JZ_XML_TODO,
   crossRefs:['P-charleston','P-revcharleston']},

  {id:'C3', name:'Coordination Exercise 3', shortCode:'B1-Coord-3', book:1, unit:3,
   stageId:'3', difficulty:'beginner', minutesRecommended:20,
   description:'Swung eighth notes in the right hand with a ii-V-I progression in the left using the Charleston rhythm. Play the major scale of the I chord for the entire ii-V-I. This introduces harmonic context to the coordination work.',
   rhDescription:'Major scale of the I chord played throughout the entire ii-V-I — sustain the one tonic scale over all three chords. This is deliberate: the ear must begin to hear the progression happening underneath a static scale.',
   lhDescription:'Charleston comping rhythm with ii-V-I shell voicings (the 7th and 3rd of each chord).',
   compingPattern:'Charleston', scaleType:'Major scale of the I chord',
   keysToPractice:['all twelve'], sourcePageRef:'Book 1 p.38',
   prerequisites:['C2'], musicXmlNotation:JZ_XML_TODO,
   crossRefs:['P-charleston','W-b1u3']},

  {id:'C4', name:'Coordination Exercise 4', shortCode:'B1-Coord-4', book:1, unit:4,
   stageId:'3-4', difficulty:'intermediate', minutesRecommended:20,
   description:'Modes (dorian, mixolydian, ionian) over Reverse Charleston comping. Students may mix Reverse Charleston and Charleston as they become comfortable. Links modal knowledge directly to coordination practice.',
   rhDescription:'Dorian for the ii chord, Mixolydian for the V, Ionian for the I — the correct mode for each chord rather than one scale across all three.',
   lhDescription:'Reverse Charleston comping, optionally mixed with the standard Charleston as facility grows.',
   compingPattern:'Reverse Charleston (optionally mixed)', scaleType:'Dorian, Mixolydian, Ionian',
   keysToPractice:['all twelve'], sourcePageRef:'Book 1 p.52',
   prerequisites:['C3'], musicXmlNotation:JZ_XML_TODO,
   crossRefs:['P-revcharleston','W-b1u4']},

  {id:'C5', name:'Coordination Exercise 5', shortCode:'B1-Coord-5', book:1, unit:9,
   stageId:'5-6', difficulty:'intermediate', minutesRecommended:20,
   description:'Scales with one-handed Type A and Type B voicings in all keys, with Charleston and Reverse Charleston comping. A good opportunity to practise adding lead-ins to the comping patterns.',
   rhDescription:'Scales, straight through, with swing articulation maintained under the added left-hand load.',
   lhDescription:'One-handed Type A and Type B voicings played in the Charleston or Reverse Charleston rhythm. Add lead-ins on "and of 3" or beat 4 once the pattern is steady.',
   compingPattern:'Charleston / Reverse Charleston with lead-ins', scaleType:'Major scales',
   keysToPractice:['all twelve'], sourcePageRef:'Book 1 p.126',
   prerequisites:['C4'], musicXmlNotation:JZ_XML_TODO,
   crossRefs:['P-leadin','P-charleston','P-revcharleston']},

  {id:'C6', name:'Coordination Exercise 6', shortCode:'B1-Coord-6', book:1, unit:10,
   stageId:'5-6', difficulty:'intermediate', minutesRecommended:20,
   description:'Melody over a constant bassline. Practise playing a variety of melodies over a steady bass pattern. Particularly important for duo accompanying, where the pianist must provide the bass function.',
   rhDescription:'A variety of melodies — tune heads, improvised lines, scale fragments — kept musical rather than mechanical.',
   lhDescription:'A constant bassline pattern that does not stop or simplify when the right hand gets busy.',
   compingPattern:'Constant bassline', scaleType:'Melodies (various)',
   keysToPractice:['all twelve'], sourcePageRef:'Book 1 p.142',
   prerequisites:['C5'], musicXmlNotation:JZ_XML_TODO,
   crossRefs:['BN2','BN1']},

  {id:'C7', name:'Book 2 Coordination Exercise 1', shortCode:'B2-Coord-1', book:2, unit:1,
   stageId:'9-10', difficulty:'intermediate', minutesRecommended:15,
   description:'Scale patterns in thirds (intervallic patterns) over the Red Garland rhythm in the left hand. Practise with one-handed four-note Type A and Type B voicings. Bridges Book 1 coordination and Book 2 pattern work.',
   rhDescription:'Scale patterns in thirds rather than stepwise scales — the first of the intervallic patterns.',
   lhDescription:'Red Garland rhythm ("and of 4" and "and of 2") played with four-note voicings.',
   compingPattern:'Red Garland Rhythm', scaleType:'Intervallic patterns in thirds',
   keysToPractice:['all twelve'], sourcePageRef:'Book 2 p.14',
   prerequisites:['C6'], musicXmlNotation:JZ_XML_TODO,
   crossRefs:['SP1','P-redgarland']},

  {id:'C8', name:'Book 2 Coordination Exercise 2', shortCode:'B2-Coord-2', book:2, unit:2,
   stageId:'9-10', difficulty:'intermediate', minutesRecommended:15,
   description:'Three-note scale patterns in the right hand while adding sidestep push-offs with the left. Practise sidesteps from above and below, with eighth-note triplets and eighth notes. Combines melodic pattern work with advanced comping devices.',
   rhDescription:'Three-note scale patterns — triad shapes moving through the scale.',
   lhDescription:'Sidestep push-offs from above and below, in eighth-note triplets and in straight eighths.',
   compingPattern:'Sidestep push-offs', scaleType:'Three-note scale patterns',
   keysToPractice:['all twelve'], sourcePageRef:'Book 2 p.42',
   prerequisites:['C7'], musicXmlNotation:JZ_XML_TODO,
   crossRefs:['P-sidestep','P-pushoff-adv','SP2']},

  {id:'C9', name:'Book 2 Coordination Exercise 3', shortCode:'B2-Coord-3', book:2, unit:3,
   stageId:'11', difficulty:'intermediate-advanced', minutesRecommended:15,
   description:'Scale Game 1 in the right hand while comping the Count Basie Rhythm in the left. The Scale Game requires continuous eighth notes without simply running scales up and down, demanding real-time melodic decision-making.',
   rhDescription:'Scale Game 1 — continuous eighth notes, no up-and-down patterns. You must decide where the line goes as you play it.',
   lhDescription:'Count Basie Rhythm — beat 3 in the first measure, Charleston in the second.',
   compingPattern:'Count Basie Rhythm', scaleType:'Scale Game 1',
   keysToPractice:['all twelve'], sourcePageRef:'Book 2 p.70',
   prerequisites:['C8'], musicXmlNotation:JZ_XML_TODO,
   crossRefs:['SP3','P-countbasie']},

  {id:'C10', name:'Book 2 Coordination Exercise 4', shortCode:'B2-Coord-4', book:2, unit:4,
   stageId:'11-12', difficulty:'advanced', minutesRecommended:20,
   description:'Combined Reverse Charleston and Beat Three Charleston comping with four-note voicings in the left hand while switching between harmonic minor and melodic minor scales in the right. Six voicing strategies are practised: three formulas multiplied by two voicing types.',
   rhDescription:'Harmonic minor and melodic minor scales, switching between them without breaking the line.',
   lhDescription:'Reverse Charleston combined with Beat Three Charleston, played with four-note voicings. Six combinations: the LN, HN and R formulas x Type A and Type B.',
   compingPattern:'Reverse Charleston + Beat Three Charleston', scaleType:'Harmonic minor and melodic minor',
   keysToPractice:['all twelve'], sourcePageRef:'Book 2 p.98',
   prerequisites:['C9'], musicXmlNotation:JZ_XML_TODO,
   voicingStrategies:'3 formulas (LN, HN, R) x 2 voicing types (A, B) = 6 combinations',
   crossRefs:['P-revcharbeat3','W-b2u3']},

  {id:'C11', name:'Book 2 Coordination Exercise 5', shortCode:'B2-Coord-5', book:2, unit:5,
   stageId:'11-12', difficulty:'advanced', minutesRecommended:20,
   description:'Charleston starting on beat three in the left hand while playing the locrian natural two mode and the altered scale in the right. Targets the most advanced scale-rhythm combinations needed for minor ii-V progressions.',
   rhDescription:'Locrian natural two (for the iiø chord) and the altered scale (for the V7alt) — the two scales a minor ii-V actually asks for.',
   lhDescription:'Charleston displaced to start on beat three.',
   compingPattern:'Beat Three Charleston', scaleType:'Locrian ♮2 and altered scale',
   keysToPractice:['all twelve'], sourcePageRef:'Book 2 p.126',
   prerequisites:['C10'], musicXmlNotation:JZ_XML_TODO,
   crossRefs:['SP5','P-beatthreecharleston']},

  {id:'C12', name:'Book 2 Coordination Exercise 6', shortCode:'B2-Coord-6', book:2, unit:10,
   stageId:'13-14', difficulty:'advanced', minutesRecommended:20,
   description:'Walking basslines for ii-V-I and ii-V progressions. Exercises A through D cover chords changing twice per measure and once per measure, with both walk-up and walk-down patterns. Essential for solo piano and duo performance.',
   rhDescription:'The ii-V-I or ii-V changes, comped or soloed over, while the left hand keeps walking.',
   lhDescription:'A walking bassline in four. A: chords changing twice per measure, walking up. B: twice per measure, walking down. C: once per measure, walking up. D: once per measure, walking down.',
   compingPattern:'Walking bass in four', scaleType:'ii-V-I and ii-V progressions',
   keysToPractice:['all twelve'], sourcePageRef:'Book 2 p.238',
   prerequisites:['C11'], musicXmlNotation:JZ_XML_TODO,
   exerciseParts:['A — chords change twice per measure, walk up',
     'B — chords change twice per measure, walk down',
     'C — chords change once per measure, walk up',
     'D — chords change once per measure, walk down'],
   crossRefs:['W-b2u10']}
];

/* ── MODEL 4: SwingArticulationExercise ────────────────────────
   The foundational swing-feel work of Book 1, Units 1 and 2. */

const SWING_EXERCISES = [
  {id:'S1', name:'Subdividing the Beat into Three Parts', book:1, unit:1,
   difficulty:'beginner', sourcePageRef:'Book 1 p.8', musicXmlNotation:JZ_XML_TODO,
   description:'The foundational concept of dividing each beat into three equal parts rather than two. Students internalise the triplet subdivision that gives swing its characteristic feel.',
   syllables:['1-and-a','2-and-a','3-and-a','4-and-a'],
   howTo:'Set a metronome at 60. Count triplets aloud on every beat. Then play only the first and third partial of each triplet — that is a swung eighth-note pair. The middle partial stays silent but must still be felt.'},

  {id:'S2', name:'"doo-VAH" Articulation', book:1, unit:1,
   difficulty:'beginner', sourcePageRef:'Book 1 p.9', musicXmlNotation:JZ_XML_TODO,
   description:'Accent the offbeats ("VAH") and de-emphasise the onbeats ("doo"). This is the fundamental articulation pattern that distinguishes jazz phrasing from classical phrasing.',
   syllables:['doo','VAH'],
   howTo:'Play any scale in swung eighths. Say "doo-VAH doo-VAH" out loud as you play. The capital letters are not a metaphor — the offbeat is genuinely louder than the onbeat. Most classically trained players do the opposite without noticing.'},

  {id:'S3', name:'Scat Syllables: doo, VAH, DIT, daht', book:1, unit:1,
   difficulty:'beginner', sourcePageRef:'Book 1 p.10', musicXmlNotation:JZ_XML_TODO,
   description:'Four core scat syllables used to vocalise and internalise swing articulation. Each syllable corresponds to a specific rhythmic placement and dynamic level.',
   syllables:['doo','VAH','DIT','daht'],
   howTo:'"doo" is an unaccented onbeat. "VAH" is an accented offbeat. "DIT" is a short accented note ending a phrase on an offbeat. "daht" is a short note ending a phrase on an onbeat. Sing a line before you play it; the syllables tell your hands what to do.'},

  {id:'S4', name:'Correct vs. Incorrect Articulation Examples', book:1, unit:1,
   difficulty:'beginner', sourcePageRef:'Book 1 p.11', musicXmlNotation:JZ_XML_TODO,
   description:'Side-by-side comparisons of correct and incorrect swing articulation, helping students identify and correct common mistakes in their playing.',
   syllables:['doo','VAH'],
   howTo:'The common faults: accenting the downbeat instead of the upbeat; playing eighths evenly (straight) rather than long-short; and clipping the offbeat short so the line loses its forward pull. Record yourself and listen for which one you do.'},

  {id:'S5', name:'Written Swing Exercises with Tenuto Markings', book:1, unit:2,
   difficulty:'beginner', sourcePageRef:'Book 1 p.20', musicXmlNotation:JZ_XML_TODO,
   description:'Notated exercises using tenuto markings to indicate which notes receive the characteristic swing length. Students learn to read and interpret swing notation conventions.',
   syllables:['doo','VAH'],
   howTo:'A tenuto line over a note means hold it for its full value and lean on it slightly. In swing notation the tenuto usually lands on the offbeat. Read the markings literally at first; they stop being necessary once the feel is in the hands.'},

  {id:'S6', name:'Practice Passages with Marked Swing Articulation', book:1, unit:2,
   difficulty:'beginner', sourcePageRef:'Book 1 p.22', musicXmlNotation:JZ_XML_TODO,
   description:'Extended practice passages with doo-VAH markings applied to recognisable melodies, such as the "Satin Doll" melody with full articulation notation. Students apply swing feel to real musical material.',
   syllables:['doo','VAH','DIT','daht'],
   howTo:'Take the head of a standard you already know. Write the syllables under every eighth note. Play it exactly as marked, then take the markings away and see whether the feel survives without them.',
   tunesToApply:['Satin Doll']}
];

/* ── MODEL 2: CompingPattern ───────────────────────────────────
   The full left-hand vocabulary, all three books. Thirty patterns:
   five from Book 1, eighteen from Book 2, seven from Book 3. */

const COMPING_PATTERNS = [
  /* -------- Book 1 (5) -------- */
  {id:'P-charleston', name:'Charleston', type:'one-measure', book:1, unitIntroduced:2,
   stageId:'1-2', musicXmlNotation:JZ_XML_TODO,
   rhythm:'Beat 1 and "and of 2" — two notes per measure, the second on the upbeat of beat 2.',
   description:'The most important comping pattern and the first one learned. Named after the James P. Johnson piece and the dance. Provides forward momentum without cluttering the texture, and remains one of the most versatile patterns in the whole curriculum.',
   notes:'Keep both chords short — staccato on the "and of 2". Works in any style, at any tempo.',
   relatedPatterns:['P-revcharleston','P-leadin','P-countbasie'],
   tunesToPractice:['Satin Doll','Autumn Leaves','All of Me']},

  {id:'P-revcharleston', name:'Reverse Charleston', type:'one-measure', book:1, unitIntroduced:2,
   stageId:'1-2', musicXmlNotation:JZ_XML_TODO,
   rhythm:'"And of 1" and beat 3 — two notes per measure, both displaced from the stronger beats.',
   description:'Rhythmically complementary to the standard Charleston. Works best when a bassist plays a two-feel (half notes), since the Reverse Charleston avoids beats 1 and 3 where the bass lands.',
   notes:'Do not confuse it with the Charleston — the "and of 1" comes immediately after beat 1, not before it.',
   relatedPatterns:['P-charleston','P-beatthreecharleston','P-revcharbeat3'],
   tunesToPractice:['Satin Doll','Blue Bossa','There Will Never Be Another You']},

  {id:'P-leadin', name:'Lead-Ins', type:'variation', book:1, unitIntroduced:7,
   stageId:'7', musicXmlNotation:JZ_XML_TODO,
   rhythm:'Played on "and of 3" or beat 4 — a single chord propelling the music into the next downbeat.',
   description:'A single chord placed on the last upbeat of the measure, pushing the music into the next bar. Lead-ins propel the music forward and add rhythmic momentum to comping.',
   notes:'Can be added before any Charleston or Reverse Charleston. Use sparingly — one or two per phrase is far more effective than constant use.',
   relatedPatterns:['P-charleston','P-pushoff','P-leadin-adv'],
   tunesToPractice:['Blue Train','Bye Bye Blackbird']},

  {id:'P-pushoff', name:'Push-Offs', type:'variation', book:1, unitIntroduced:7,
   stageId:'7', musicXmlNotation:JZ_XML_TODO,
   rhythm:'Two consecutive eighth notes, placed anywhere in the measure.',
   description:'Two chords played as a pair of eighth notes, creating a brief burst of rhythmic energy. Push-offs can be placed at various points in the measure.',
   notes:'Combine with lead-ins for more complex patterns. Book 2 extends this into single, double and triple push-offs.',
   relatedPatterns:['P-leadin','P-pushoff-adv'],
   tunesToPractice:['Blue Monk','Billie’s Bounce']},

  {id:'P-longshort', name:'Long–Short Articulation', type:'strategy', book:1, unitIntroduced:7,
   stageId:'7', musicXmlNotation:JZ_XML_TODO,
   rhythm:'Varies the length of individual comping chords between long (sustained) and short (staccato).',
   description:'A dynamic tool rather than a rhythmic one. Long chords create warmth and harmonic weight; short chords create rhythmic crispness. Mixing both within a phrase creates dynamic variety in accompaniment.',
   notes:'The most underused device among beginners, who tend to play everything equally short.',
   relatedPatterns:['P-longcomps'],
   tunesToPractice:['Body and Soul','Blue Train']},

  /* -------- Book 2 (18) -------- */
  {id:'P-redgarland', name:'Red Garland Rhythm', type:'one-measure', book:2, unitIntroduced:1,
   stageId:'9', musicXmlNotation:JZ_XML_TODO,
   rhythm:'"And of 4" and "and of 2" — two upbeats per measure, neither anchored to a downbeat.',
   description:'Named after the pianist in the Miles Davis Quintet of the 1950s. Has a more relaxed, floating feel than the Charleston because both notes land on upbeats with no downbeat anchor. A push-off is often added on beat 4.',
   notes:'Works best at medium tempos. Add the beat-4 push-off once the two-note version is steady.',
   relatedPatterns:['P-charleston','P-pushoff-adv'],
   tunesToPractice:['Bye Bye Blackbird','If I Were a Bell','Green Dolphin Street']},

  {id:'P-locked', name:'Locked-Hands', type:'strategy', book:2, unitIntroduced:1,
   stageId:'9', musicXmlNotation:JZ_XML_TODO,
   rhythm:'Right and left hands play together in rhythmic unison.',
   description:'Both hands play the same rhythm simultaneously — typically the melody on top with a four-note chord shape below it and the left hand doubling the bottom note an octave down. Creates a full, orchestral texture.',
   notes:'Used only when the pianist has the melody or is improvising. Far too dense for comping behind another soloist.',
   relatedPatterns:['P-semilocked','P-shoutchorus'],
   tunesToPractice:['Moonlight in Vermont','Polka Dots and Moonbeams']},

  {id:'P-semilocked', name:'Semi-Locked Hands', type:'strategy', book:2, unitIntroduced:1,
   stageId:'9', musicXmlNotation:JZ_XML_TODO,
   rhythm:'Hands lock together only on important melody notes, and separate elsewhere.',
   description:'A lighter version of locked-hands. Both hands play together only on important melody notes, allowing more nuanced melodic phrasing between those points.',
   notes:'Less dense than full locked-hands, and much easier to play at tempo. Lock on melodic peaks and cadence points.',
   relatedPatterns:['P-locked'],
   tunesToPractice:['Moonlight in Vermont','Stella by Starlight']},

  {id:'P-pushoff-adv', name:'Push-Off (Advanced)', type:'variation', book:2, unitIntroduced:2,
   stageId:'9-10', musicXmlNotation:JZ_XML_TODO,
   rhythm:'Single, double and triple push-off variations, placed anywhere in the measure.',
   description:'Extends the basic Book 1 push-off with more rhythmic complexity and placement options. A single push-off is two eighths; a double is two pairs; a triple is three pairs, which begins to feel like a rhythmic phrase in its own right.',
   notes:'Triple push-offs push against the meter. Use them at phrase ends where the harmony is stable enough to take the rhythmic weight.',
   relatedPatterns:['P-pushoff','P-redgarland','P-leadin-adv'],
   tunesToPractice:['Oleo','Four']},

  {id:'P-leadin-adv', name:'Lead-In (Advanced)', type:'variation', book:2, unitIntroduced:2,
   stageId:'9-10', musicXmlNotation:JZ_XML_TODO,
   rhythm:'Accented "and of 3" or beat 4, often paired with a sidestep.',
   description:'Extends the basic Book 1 lead-in by adding harmonic colour from the sidestep device: the lead-in chord is displaced by a half step and resolves onto the downbeat.',
   notes:'The sidestep makes the lead-in pull harder, because now both rhythm and harmony are leaning into the next bar.',
   relatedPatterns:['P-leadin','P-sidestep'],
   tunesToPractice:['Four','Solar']},

  {id:'P-leaveout', name:'Leave Out a Comp', type:'strategy', book:2, unitIntroduced:2,
   stageId:'10', musicXmlNotation:JZ_XML_TODO,
   rhythm:'Omit the on-beat comp entirely to create space and rhythmic surprise.',
   description:'Deliberate silence where a chord was expected. A subtractive approach to comping that develops awareness of silence as a musical tool, and one of the hardest devices to commit to — the temptation is always to fill the space.',
   notes:'Count Basie was the master of this. Leave-outs work best once the pattern is established and the listener expects the chord.',
   relatedPatterns:['P-freecomp'],
   tunesToPractice:['Li’l Darlin’','Blue and Sentimental']},

  {id:'P-sidestep', name:'Sidestep', type:'harmonic-device', book:2, unitIntroduced:2,
   stageId:'10', musicXmlNotation:JZ_XML_TODO,
   rhythm:'A voicing displaced by a half step (above or below), then resolved to the target chord.',
   description:'Creates momentary harmonic tension by displacing a chord by a half step before resolving it. Adds chromatic colour and harmonic tension to comping without changing the underlying harmony.',
   notes:'From above sounds more tense and chromatic. From below sounds more like a grace-note slide into the chord.',
   relatedPatterns:['P-tonicization','P-leadin-adv','P-sidestep-modal'],
   tunesToPractice:['Autumn Leaves','Solar']},

  {id:'P-tonicization', name:'Tonicization', type:'harmonic-device', book:2, unitIntroduced:2,
   stageId:'10', musicXmlNotation:JZ_XML_TODO,
   rhythm:'Insert a dominant seventh chord whose root is a fifth above the target chord.',
   description:'Creates a momentary V-I resolution that strengthens harmonic motion. The ear hears a brief key change that resolves immediately, because the inserted chord temporarily makes the next chord feel like a tonic.',
   notes:'A D7 before a G chord is a tonicization of G. The D7 need not appear anywhere in the original progression.',
   relatedPatterns:['P-sidestep','P-tonicization-modal'],
   tunesToPractice:['All the Things You Are','Have You Met Miss Jones']},

  {id:'P-longcomps', name:'Long Comps', type:'strategy', book:2, unitIntroduced:2,
   stageId:'10', musicXmlNotation:JZ_XML_TODO,
   rhythm:'Play comps long (sustained) instead of short (staccato).',
   description:'Changes the character of the accompaniment from percussive to sustained. The chord is held through to the next comp rather than released immediately, filling the harmonic space underneath the soloist.',
   notes:'Long comps suit ballads and open modal sections. They muddy fast tempos, where the release is what keeps the texture clear.',
   relatedPatterns:['P-longshort'],
   tunesToPractice:['Body and Soul','In a Sentimental Mood']},

  {id:'P-beatthreecharleston', name:'Beat Three Charleston', type:'two-measure', book:2, unitIntroduced:3,
   stageId:'11', musicXmlNotation:JZ_XML_TODO,
   rhythm:'Beat 3 and "and of 4", every other measure.',
   description:'A two-measure pattern that creates a spacious rhythmic cycle, giving the soloist far more room than the one-measure Charleston patterns. The long gap across the second measure is the point of it.',
   notes:'Because the cycle is two bars long, it builds a sense of forward motion toward each repetition.',
   relatedPatterns:['P-countbasie','P-revcharleston','P-revcharbeat3'],
   tunesToPractice:['Beautiful Love','Softly As In A Morning Sunrise']},

  {id:'P-countbasie', name:'Count Basie Rhythm', type:'two-measure', book:2, unitIntroduced:3,
   stageId:'11', musicXmlNotation:JZ_XML_TODO,
   rhythm:'Beat 3 in the first measure, then the Charleston in the second measure.',
   description:'Named after Count Basie’s economical and rhythmically precise comping style. Two measures of widely spaced comping that create maximum forward momentum with minimum density.',
   notes:'Works beautifully at any tempo. The contrast between one chord in bar 1 and two in bar 2 creates a call-and-response feel.',
   relatedPatterns:['P-beatthreecharleston','P-charleston'],
   tunesToPractice:['Shiny Stockings','Corner Pocket','Beautiful Love']},

  {id:'P-revcharbeat3', name:'Reverse Charleston + Beat Three Charleston', type:'two-measure', book:2, unitIntroduced:4,
   stageId:'11', musicXmlNotation:JZ_XML_TODO,
   rhythm:'"And of 1", beat 3, and "and of 4", followed by a rest.',
   description:'Combines two fundamental patterns into a more complex two-measure figure. The three evenly spaced chords across two bars create a short hemiola effect, briefly suggesting a 3/2 meter against the 4/4.',
   notes:'The hemiola is subtle but adds real rhythmic sophistication when used sparingly.',
   relatedPatterns:['P-revcharleston','P-beatthreecharleston'],
   tunesToPractice:['Softly As In A Morning Sunrise','Alone Together']},

  {id:'P-freecomp', name:'Free Comping', type:'strategy', book:2, unitIntroduced:6,
   stageId:'12', musicXmlNotation:JZ_XML_TODO,
   rhythm:'No fixed pattern — respond organically to the music.',
   description:'Responding to the music without fixed patterns. Represents the synthesis of all learned patterns into spontaneous, musical comping, and is the goal toward which all the earlier pattern work has been pointing.',
   notes:'Free comping cannot be practised directly. It emerges from deep internalisation of the patterns; the best preparation is playing every pattern on many tunes until they stop requiring thought.',
   relatedPatterns:['P-leaveout','P-freecomp-modal'],
   tunesToPractice:['Hardly, in the Moonlight','Stella by Starlight']},

  {id:'P-freddie', name:'Freddie Green Style', type:'one-measure', book:2, unitIntroduced:7,
   stageId:'13', musicXmlNotation:JZ_XML_TODO,
   rhythm:'Quarter-note comps on every beat — four to the bar.',
   description:'Named after the Count Basie Orchestra guitarist known for his steady rhythmic pulse, translated here to the piano. Creates maximum harmonic density and a very steady, driving feel.',
   notes:'Best at medium-up and up tempos. Sustain each chord very slightly rather than clipping it.',
   relatedPatterns:['P-shoutchorus'],
   tunesToPractice:['Shiny Stockings','Jumpin’ at the Woodside']},

  {id:'P-shoutchorus', name:'Shout-Chorus Voicings / Block Chords', type:'strategy', book:2, unitIntroduced:7,
   stageId:'13', musicXmlNotation:JZ_XML_TODO,
   rhythm:'Dense block chords played in rhythmic unison between the hands.',
   description:'Dense block chord voicings played in rhythmic unison, inspired by big band shout chorus arrangements. Used for climactic moments in performance, where the piano stands in for a whole horn section.',
   notes:'Save it for the last chorus. Used early, there is nowhere left to build to.',
   relatedPatterns:['P-locked','P-freddie'],
   tunesToPractice:['Cute','Splanky']},

  {id:'P-secondhalf', name:'Second Half of Measure', type:'variation', book:2, unitIntroduced:11,
   stageId:'14', musicXmlNotation:JZ_XML_TODO,
   rhythm:'Charleston and Reverse Charleston shifted to start on beat 3 or "and of 3".',
   description:'Shifts the rhythmic weight of the familiar patterns into the second half of the measure. The same shapes, displaced — which changes their character completely because they now arrive late rather than early.',
   notes:'A good way to get more from patterns you already own, rather than learning new ones.',
   relatedPatterns:['P-charleston','P-revcharleston','P-beatthreecharleston'],
   tunesToPractice:['Alice in Wonderland','A Child is Born']},

  {id:'P-threefour', name:'Three-Four Comping', type:'variation', book:2, unitIntroduced:11,
   stageId:'14', musicXmlNotation:JZ_XML_TODO,
   rhythm:'Charleston and Reverse Charleston adapted to 3/4 time.',
   description:'Applies the fundamental comping vocabulary to waltz and jazz waltz contexts. With only three beats to work with, the patterns compress and the offbeats fall in different places relative to the bar.',
   notes:'The Charleston in 3/4 becomes beat 1 and "and of 2", which lands very differently because there is no beat 4 to resolve into.',
   relatedPatterns:['P-charleston','P-revcharleston','P-oddmeter'],
   tunesToPractice:['Alice in Wonderland','A Child is Born','Someday My Prince Will Come']},

  {id:'P-shuttle', name:'Left-Hand Shuttle', type:'strategy', book:2, unitIntroduced:11,
   stageId:'14', musicXmlNotation:JZ_XML_TODO,
   rhythm:'The left hand jumps between low bass notes and mid-range voicings.',
   description:'Creates the illusion of two separate instruments — a bass and a comping piano — from one hand. The hand shuttles down for the root and back up for the chord, alternating registers.',
   notes:'Essential for solo piano. Practise the jump slowly: the accuracy of the leap is the whole technique.',
   relatedPatterns:['P-longcomps'],
   tunesToPractice:['Body and Soul','My Romance']},

  /* -------- Book 3 (7) -------- */
  {id:'P-modalvoice', name:'Modal Voicing Comping', type:'strategy', book:3, unitIntroduced:2,
   stageId:'15+', musicXmlNotation:JZ_XML_TODO,
   rhythm:'Two-handed voicing comping with no doubling and no third-stacking.',
   description:'Comping in a modal context using voicings that avoid doubled notes and stacked thirds. Four tools move between voicings: (1) maintain the same pitch classes while redistributing them between the hands, (2) move the top or bottom note by step, (3) use complementary voicings, (4) transpose in parallel.',
   notes:'The no-doubling, no-third-stacking rule is what produces the open, harmonically ambiguous sound of modal jazz piano.',
   relatedPatterns:['P-planing','P-pentavoice','P-sidestep-modal'],
   tunesToPractice:['So What','Impressions','Milestones']},

  {id:'P-pentavoice', name:'Pentatonic Voicing Comping', type:'strategy', book:3, unitIntroduced:5,
   stageId:'15+', musicXmlNotation:JZ_XML_TODO,
   rhythm:'Comping with voicings built from pentatonic scales rather than from chord tones.',
   description:'Comping using voicings derived from the melodic minor, dominant and flat sixth pentatonic scales. Provides a distinctive colour palette for modal contexts, because the voicings imply a scale rather than a chord.',
   notes:'Because these voicings are scale-derived, several different chords will accept the same shape — which is exactly the ambiguity modal playing wants.',
   relatedPatterns:['P-modalvoice','P-planing'],
   tunesToPractice:['Contemplation','Afro Blue','Passion Dance']},

  {id:'P-tonicization-modal', name:'Tonicization in Modal Context', type:'harmonic-device', book:3, unitIntroduced:6,
   stageId:'15+', musicXmlNotation:JZ_XML_TODO,
   rhythm:'A dominant chord a half step above the target, or a tritone substitution, inserted before it.',
   description:'Using a dominant chord a half-step above, or a tritone substitution, to create momentary tonicization within a modal harmonic framework. The functional pull of Book 2’s tonicization, imported into music that otherwise has no functional harmony.',
   notes:'Works because the ear still hears dominant resolution even when nothing around it is functional.',
   relatedPatterns:['P-tonicization','P-sidestep-modal'],
   tunesToPractice:['Inner Urge','Windows']},

  {id:'P-sidestep-modal', name:'Sidestepping (Modal)', type:'harmonic-device', book:3, unitIntroduced:7,
   stageId:'15+', musicXmlNotation:JZ_XML_TODO,
   rhythm:'Displace voicings by a half step outside the mode, then resolve back into it.',
   description:'Similar to the Book 2 sidestep but applied within a modal harmonic context. Because there are no chord changes to resolve to, the sidestep’s tension comes entirely from stepping outside the mode and back.',
   notes:'Hold the outside voicing longer than feels comfortable. In modal playing the tension has to last to register at all.',
   relatedPatterns:['P-sidestep','P-planing','P-modalvoice'],
   tunesToPractice:['So What','Witch Hunt']},

  {id:'P-planing', name:'Planing', type:'harmonic-device', book:3, unitIntroduced:7,
   stageId:'15+', musicXmlNotation:JZ_XML_TODO,
   rhythm:'Transpose voicings in parallel motion, independently of the underlying harmony.',
   description:'Moving voicings in strict parallel motion, dragging the whole chord structure up or down without regard for harmonic function. Creates a floating, non-functional harmonic effect characteristic of modern jazz.',
   notes:'Planing works because the intervallic relationships inside the voicing stay constant, so the sonority stays recognisable even as the pitches leave the mode.',
   relatedPatterns:['P-modalvoice','P-sidestep-modal'],
   tunesToPractice:['Witch Hunt','So What','Forest Flower']},

  {id:'P-oddmeter', name:'Odd Meter Comping', type:'variation', book:3, unitIntroduced:11,
   stageId:'15+', musicXmlNotation:JZ_XML_TODO,
   rhythm:'Comping patterns adapted for 5/4 and 7/4 time signatures.',
   description:'Redistributing the rhythmic vocabulary across asymmetric meters. A 5/4 bar is usually felt as 3+2 or 2+3, and the comping pattern has to agree with whichever grouping the rest of the band is playing.',
   notes:'Learn the clave for the meter first. The comping pattern is a response to the clave, not an independent thing.',
   relatedPatterns:['P-threefour','P-freecomp-modal'],
   tunesToPractice:['Take Five','I Didn’t Know What Time It Was','Living Time']},

  {id:'P-freecomp-modal', name:'Free Comping (Modal)', type:'strategy', book:3, unitIntroduced:12,
   stageId:'15+', musicXmlNotation:JZ_XML_TODO,
   rhythm:'No fixed patterns — respond to the music in a modal context.',
   description:'The culmination of the Book 3 comping curriculum, integrating all the modal voicing tools into spontaneous accompaniment. Where Book 2’s free comping still had changes to respond to, this has only texture, register and density.',
   notes:'With no harmony to react to, the material becomes rhythm and space. This is the point at which comping and composing stop being different activities.',
   relatedPatterns:['P-freecomp','P-modalvoice','P-planing'],
   tunesToPractice:['Fiasco','Free improvisation']}
];

/* ── MODEL 3: ScalePatternExercise ─────────────────────────────
   Twelve functional patterns from Book 2, twelve modal from Book 3. */

const SCALE_PATTERNS = [
  /* -------- Book 2: twelve functional patterns -------- */
  {id:'SP1', name:'Intervallic Patterns', book:2, unit:1, patternType:'intervallic',
   stageId:'9', difficulty:'intermediate', minutesRecommended:15,
   tempoRange:{min:120, max:200}, keysToPractice:['all twelve'],
   relatedScales:['Major scale'], musicXmlExamples:[JZ_XML_TODO],
   description:'Scales played in intervals of 3rds, 4ths, 5ths, 6ths and 7ths rather than stepwise. Start slow at approximately 120 bpm and gradually increase tempo as the patterns become automatic.',
   intervals:'3rds, 4ths, 5ths, 6ths, 7ths', crossRefs:['C7']},

  {id:'SP2', name:'Triadic / Seventh-Chord Patterns', book:2, unit:2, patternType:'triadic',
   stageId:'9-10', difficulty:'intermediate', minutesRecommended:15,
   tempoRange:{min:100, max:200}, keysToPractice:['all twelve'],
   relatedScales:['Major scale'], musicXmlExamples:[JZ_XML_TODO],
   description:'Three-note (triad) and four-note (seventh chord) patterns ascending and descending through scales. Practise with triplets and with eighth notes. The eighth-note versions create hemiolas when grouped against the underlying meter.',
   intervals:'Triadic (3-note) and seventh-chord (4-note) cells; triplet and eighth-note groupings',
   crossRefs:['C8','SP11']},

  {id:'SP3', name:'Scale Game 1', book:2, unit:3, patternType:'scale-game',
   stageId:'11', difficulty:'intermediate-advanced', minutesRecommended:10,
   tempoRange:{min:80, max:180}, keysToPractice:['all twelve'],
   relatedScales:['Major scale','Modes'], musicXmlExamples:[JZ_XML_TODO],
   description:'Continuous eighth notes for an extended time without running scales simply up and down. You must make melodic decisions in real time. Pay attention to hand positions first, then increase the tempo.',
   intervals:'Goal: continuous eighth notes with genuine melodic variety', crossRefs:['C9']},

  {id:'SP4', name:'Scale Game 2', book:2, unit:4, patternType:'scale-game',
   stageId:'11', difficulty:'intermediate-advanced', minutesRecommended:15,
   tempoRange:{min:70, max:160}, keysToPractice:['all twelve, ascending by half steps'],
   relatedScales:['Major scale','Modes'], musicXmlExamples:[JZ_XML_TODO],
   description:'Switch scales every two measures, ascending by half steps. Practise slowly first, then raise the tempo. Builds the ability to navigate rapid key changes while keeping the melodic line flowing.',
   intervals:'Modulation every 2 measures, ascending chromatically', crossRefs:['SP3']},

  {id:'SP5', name:'Chromatic Lead-In Patterns', book:2, unit:5, patternType:'chromatic-lead-in',
   stageId:'11-12', difficulty:'advanced', minutesRecommended:15,
   tempoRange:{min:80, max:180}, keysToPractice:['all twelve'],
   relatedScales:['Major scale','Altered scale','Locrian ♮2'], musicXmlExamples:[JZ_XML_TODO],
   description:'Approaching guidetone lines from below by half step, from above by half step, and with chromatic enclosures. These patterns add chromatic sophistication to melodic lines and target the important chord tones.',
   intervals:'From below, from above, and chromatic enclosure', crossRefs:['C11']},

  {id:'SP6', name:'Octatonic Scale Patterns', book:2, unit:6, patternType:'octatonic',
   stageId:'12', difficulty:'advanced', minutesRecommended:20,
   tempoRange:{min:80, max:180}, keysToPractice:['3 unique octatonic scales, each covering 4 keys'],
   relatedScales:['Octatonic (diminished) scale'], musicXmlExamples:[JZ_XML_TODO],
   description:'Two-note, three-note and four-note patterns using the octatonic (diminished) scale. The same pitches serve as different starting notes for different harmonies, demonstrating the scale’s symmetrical properties.',
   intervals:'2-note, 3-note and 4-note cells', crossRefs:['W-b2u6']},

  {id:'SP7', name:'Non-Chord-Tone Patterns 1', book:2, unit:7, patternType:'non-chord-tone',
   stageId:'13', difficulty:'advanced', minutesRecommended:15,
   tempoRange:{min:80, max:200}, keysToPractice:['all twelve'],
   relatedScales:['Major scale','Bebop scale'], musicXmlExamples:[JZ_XML_TODO],
   description:'Lower neighbours and chromatic enclosures targeting scale notes. These ornamental patterns add bebop-style embellishment to melodic lines.',
   intervals:'Lower neighbours, chromatic enclosures', crossRefs:['SP8']},

  {id:'SP8', name:'Non-Chord-Tone Patterns 2', book:2, unit:8, patternType:'non-chord-tone',
   stageId:'13', difficulty:'advanced', minutesRecommended:15,
   tempoRange:{min:80, max:200}, keysToPractice:['all twelve'],
   relatedScales:['Major scale','Bebop scale'], musicXmlExamples:[JZ_XML_TODO],
   description:'Double neighbours, the "Joy Spring" pattern and the "Yodel Lick". The named patterns reference iconic jazz solos in which these devices appear prominently.',
   intervals:'Double neighbours, "Joy Spring" pattern, "Yodel Lick"', crossRefs:['SP7']},

  {id:'SP9', name:'Arpeggio Patterns for Rhythm Changes', book:2, unit:9, patternType:'arpeggio',
   stageId:'13-14', difficulty:'advanced', minutesRecommended:15,
   tempoRange:{min:100, max:240}, keysToPractice:['all twelve'],
   relatedScales:['Major scale','Bebop scale'], musicXmlExamples:[JZ_XML_TODO],
   description:'3-5-7-9 arpeggio patterns for I-vi-ii-V progressions with half-step connections between chord tones. Essential vocabulary for navigating the rhythm changes form.',
   intervals:'3-5-7-9 arpeggios over I-vi-ii-V, connected by half step', crossRefs:['W-b2u9','T5']},

  {id:'SP10', name:'Bebop Scale Patterns', book:2, unit:10, patternType:'bebop',
   stageId:'13-14', difficulty:'advanced', minutesRecommended:15,
   tempoRange:{min:100, max:240}, keysToPractice:['all twelve'],
   relatedScales:['Major bebop scale','Melodic minor bebop scale'], musicXmlExamples:[JZ_XML_TODO],
   description:'Major and melodic minor bebop scales played melodically in different shapes. Bebop scales add a chromatic passing tone so that chord tones land on the downbeats.',
   intervals:'Major bebop and melodic minor bebop, in multiple melodic shapes', crossRefs:['SP9']},

  {id:'SP11', name:'Hemiola Patterns', book:2, unit:11, patternType:'hemiola',
   stageId:'14', difficulty:'advanced', minutesRecommended:15,
   tempoRange:{min:80, max:200}, keysToPractice:['all twelve'],
   relatedScales:['Major scale','Seventh chords'], musicXmlExamples:[JZ_XML_TODO],
   description:'Mixing rhythmic units to create hemiola effects: a quarter note plus an eighth note equals 1.5 beats, producing three-beat patterns against 4/4 time. Includes descending seventh chords with bluesy double-note turns.',
   intervals:'3-beat patterns over 4/4; descending sevenths with double-note turns', crossRefs:['SP2','MP9']},

  {id:'SP12', name:'Non-Chord-Tone Technical Challenges', book:2, unit:12, patternType:'non-chord-tone',
   stageId:'14', difficulty:'advanced', minutesRecommended:15,
   tempoRange:{min:60, max:200}, keysToPractice:['all twelve'],
   relatedScales:['Major scale','Bebop scale','Chromatic scale'], musicXmlExamples:[JZ_XML_TODO],
   description:'Special technical challenges at the piano that push the non-chord-tone patterns to their physical and musical limits. The capstone of Book 2’s pattern work.',
   intervals:'Extended enclosures and neighbour figures at the limit of the hand', crossRefs:['SP7','SP8']},

  /* -------- Book 3: twelve modal patterns -------- */
  {id:'MP1', name:'Mode Practice with Fingering', book:3, unit:1, patternType:'modal',
   stageId:'15', difficulty:'intermediate-advanced', minutesRecommended:15,
   tempoRange:{min:60, max:180}, keysToPractice:['all 12 major keys, all 7 modes each'],
   relatedScales:['All seven modes of the major scale'], musicXmlExamples:[JZ_XML_TODO],
   description:'Each major scale started on different scale degrees to produce all seven modes. Emphasises correct fingering for each mode, building physical fluency across all modal starting points.',
   intervals:'Seven modes per key; focus on fingering and physical fluency', crossRefs:['MP2']},

  {id:'MP2', name:'Second-Plus-Fourth Shapes', book:3, unit:2, patternType:'modal',
   stageId:'15', difficulty:'intermediate-advanced', minutesRecommended:15,
   tempoRange:{min:60, max:160}, keysToPractice:['all twelve, all modes'],
   relatedScales:['Modes of the major scale'], musicXmlExamples:[JZ_XML_TODO],
   description:'Second-plus-fourth intervallic shapes ascending and descending beneath each mode. These shapes form the basis of modal voicing construction.',
   intervals:'Second + fourth interval combination', crossRefs:['W-b3u2','P-modalvoice']},

  {id:'MP3', name:'Third-Plus-Fourth Shapes (Inverted Triads)', book:3, unit:3, patternType:'modal',
   stageId:'15', difficulty:'intermediate-advanced', minutesRecommended:15,
   tempoRange:{min:60, max:160}, keysToPractice:['all twelve'],
   relatedScales:['Modes of the major scale'], musicXmlExamples:[JZ_XML_TODO],
   description:'Third-plus-fourth shapes (inverted triads) beneath major scales. These inversions produce the So What voicing shapes used throughout modal jazz.',
   intervals:'Third + fourth combination — inverted triads', crossRefs:['W-b3u3']},

  {id:'MP4', name:'Special Triad Inversions', book:3, unit:4, patternType:'modal',
   stageId:'15', difficulty:'advanced', minutesRecommended:15,
   tempoRange:{min:60, max:160}, keysToPractice:['all twelve'],
   relatedScales:['Modes of the major scale'], musicXmlExamples:[JZ_XML_TODO],
   description:'Alternating between two "special" triad inversions in all keys, with variations. Produces the quartal and cluster voicing shapes used in modern jazz piano.',
   intervals:'Alternating special triad inversions with variations', crossRefs:['W-b3u4','T10']},

  {id:'MP5', name:'Pentatonic Intervallic Patterns', book:3, unit:5, patternType:'pentatonic',
   stageId:'15+', difficulty:'advanced', minutesRecommended:15,
   tempoRange:{min:80, max:200}, keysToPractice:['all twelve'],
   relatedScales:['Pentatonic scale'], musicXmlExamples:[JZ_XML_TODO],
   description:'Intervallic scale patterns using the pentatonic scale in all twelve keys. Extends the intervallic approach of Book 2 into the pentatonic framework.',
   intervals:'Intervallic cells within the pentatonic scale', crossRefs:['P-pentavoice','SP1']},

  {id:'MP6', name:'Pentatonic Patterns with Enclosures', book:3, unit:6, patternType:'pentatonic',
   stageId:'15+', difficulty:'advanced', minutesRecommended:15,
   tempoRange:{min:80, max:200}, keysToPractice:['all twelve, via the circle of fifths'],
   relatedScales:['Pentatonic scale','Chromatic scale'], musicXmlExamples:[JZ_XML_TODO],
   description:'Pentatonic patterns with enclosures and chromatic neighbours, moving through the circle of fifths. Combines the pentatonic and chromatic vocabularies.',
   intervals:'Enclosures and chromatic neighbours around pentatonic targets', crossRefs:['W-b3u6']},

  {id:'MP7', name:'Descending Seventh Chord Patterns in Melodic Minor', book:3, unit:7,
   patternType:'modal', stageId:'15+', difficulty:'advanced', minutesRecommended:15,
   tempoRange:{min:70, max:180}, keysToPractice:['all twelve'],
   relatedScales:['Melodic minor'], musicXmlExamples:[JZ_XML_TODO],
   description:'Descending seventh chord patterns within the melodic minor scale, with flipped notes. The note-flipping technique creates unexpected melodic contours out of otherwise predictable arpeggio cells.',
   intervals:'Descending seventh cells with notes flipped inside each cell', crossRefs:['MP8']},

  {id:'MP8', name:'Three-Note Pentatonic Patterns', book:3, unit:8, patternType:'pentatonic',
   stageId:'15+', difficulty:'advanced', minutesRecommended:15,
   tempoRange:{min:80, max:200}, keysToPractice:['all twelve'],
   relatedScales:['Melodic minor pentatonic','Dominant pentatonic','Flat sixth pentatonic'],
   musicXmlExamples:[JZ_XML_TODO],
   description:'Three-note patterns derived from the melodic minor, dominant and flat sixth pentatonic scales. Flipping notes within the cells creates additional melodic variations.',
   intervals:'3-note cells with internal note flipping', crossRefs:['W-b3u8','P-pentavoice']},

  {id:'MP9', name:'Mulgrew Miller-Inspired Planing with Hemiolas', book:3, unit:9,
   patternType:'planing', stageId:'15+', difficulty:'advanced', minutesRecommended:15,
   tempoRange:{min:80, max:200}, keysToPractice:['all twelve'],
   relatedScales:['Modes','Pentatonic scale'], musicXmlExamples:[JZ_XML_TODO],
   description:'Planing exercises inspired by Mulgrew Miller’s improvisational approach. Uses hemiolas with different rhythmic subdivisions to create metric tension against the underlying pulse.',
   intervals:'Planing + hemiola + varied rhythmic subdivision', crossRefs:['P-planing','W-b3u9','SP11']},

  {id:'MP10', name:'Pentatonic Patterns over Major ii-V-I', book:3, unit:10,
   patternType:'pentatonic', stageId:'15+', difficulty:'advanced', minutesRecommended:15,
   tempoRange:{min:80, max:220}, keysToPractice:['all twelve'],
   relatedScales:['Pentatonic scale','Bebop scale'], musicXmlExamples:[JZ_XML_TODO],
   description:'Pentatonic patterns applied over major ii-V-I progressions, incorporating bebop shapes within a modal context. Bridges Book 2 functional harmony with the Book 3 modal approaches.',
   intervals:'Bebop shapes reframed pentatonically over ii-V-I', crossRefs:['SP10','MP5']},

  {id:'MP11', name:'Symmetric Scale Planing', book:3, unit:11, patternType:'planing',
   stageId:'15+', difficulty:'advanced', minutesRecommended:15,
   tempoRange:{min:70, max:180}, keysToPractice:['all applicable symmetric scale transpositions'],
   relatedScales:['Wholetone','Octatonic','Augmented'], musicXmlExamples:[JZ_XML_TODO],
   description:'Planing melodic cells from the wholetone, octatonic and augmented scales, both symmetrically and chromatically. Exploits the symmetrical properties of these scales for parallel melodic motion.',
   intervals:'Symmetric and chromatic planing of melodic cells', crossRefs:['P-planing','MP12']},

  {id:'MP12', name:'Augmented Scale Patterns with Odd Meter Hemiolas', book:3, unit:12,
   patternType:'augmented', stageId:'15+', difficulty:'advanced', minutesRecommended:15,
   tempoRange:{min:60, max:160}, keysToPractice:['all applicable augmented scale transpositions'],
   relatedScales:['Augmented scale'], musicXmlExamples:[JZ_XML_TODO],
   description:'Augmented scale patterns with hemiolas against five-four and seven-four claves. The capstone of Book 3’s modal pattern work, combining advanced scales, metric tension and odd meters.',
   intervals:'Augmented cells in hemiola against 5/4 and 7/4 clave', crossRefs:['P-oddmeter','MP11']}
];

/* ── MODEL 5: MelodyPersonalizationTechnique ───────────────────
   Ten techniques for making a written melody your own. */

const MELODY_TECHNIQUES = [
  {id:'M1', name:'Syncopation', book:1, unitIntroduced:2, stageId:'1-2', difficulty:'beginner',
   musicXmlExample:JZ_XML_TODO, tunesToApply:['Satin Doll','Autumn Leaves'],
   description:'Shifting melody rhythms to create syncopated versions of written melodies. The simplest form of melody personalisation, requiring only rhythmic displacement.',
   howToPerform:'Take a melody note that falls on a downbeat and move it to the upbeat just before or after. Do not change the pitch. Start with one note per phrase, then two. If everything is syncopated, nothing is.'},

  {id:'M2', name:'Repeated Notes', book:1, unitIntroduced:2, stageId:'1-2', difficulty:'beginner',
   musicXmlExample:JZ_XML_TODO, tunesToApply:['Satin Doll','All of Me'],
   description:'Repeating selected melody notes for rhythmic emphasis, or to create a more conversational phrasing style.',
   howToPerform:'Find a long note in the melody. Instead of holding it, repeat it two or three times in a rhythm you like. The pitch never changes — only the rhythm underneath it.'},

  {id:'M3', name:'Grace Note Slides', book:1, unitIntroduced:2, stageId:'1-2', difficulty:'beginner',
   musicXmlExample:JZ_XML_TODO, tunesToApply:['Satin Doll','Blue Monk'],
   description:'Approaching melody notes from a half step below using grace notes. Creates the characteristic "slide" effect common in jazz piano performance.',
   howToPerform:'Play the note a half step below the melody note and slip off it onto the target, almost simultaneously. The grace note is crushed, not measured. Works best on the blue notes and on phrase beginnings.'},

  {id:'M4', name:'Ghost Notes', book:1, unitIntroduced:5, stageId:'5', difficulty:'intermediate',
   musicXmlExample:JZ_XML_TODO, tunesToApply:['Evening in Lyon','Bye Bye Blackbird'],
   description:'Barely audible notes played with the thumb. Ghost notes add rhythmic texture without melodic weight, filling the space between primary melody notes.',
   howToPerform:'Let the thumb brush a note rather than strike it — enough to be felt but not heard as a pitch. Fill the gaps between melody notes with ghosted scale steps. If a listener can name the pitch, it is too loud.'},

  {id:'M5', name:'Turns', book:1, unitIntroduced:5, stageId:'5', difficulty:'intermediate',
   musicXmlExample:JZ_XML_TODO, tunesToApply:['Evening in Lyon','Body and Soul'],
   description:'Ascending and descending ornaments around a target note. Turns add melodic decoration and can be applied to virtually any sustained melody note.',
   howToPerform:'On a long melody note, play the note above, the note itself, the note below, then the note again — four notes in the time of one. Keep them inside the scale unless you want chromatic colour.'},

  {id:'M6', name:'Double Notes', book:1, unitIntroduced:5, stageId:'5', difficulty:'intermediate',
   musicXmlExample:JZ_XML_TODO, tunesToApply:['Evening in Lyon','Moonlight in Vermont'],
   description:'Harmonising the melody with a note below, typically a third or a sixth. Creates a richer melodic texture while keeping the original melody in the top voice.',
   howToPerform:'Add a diatonic third below each melody note. Where the third sounds wrong against the chord, use a sixth instead. The melody must stay on top — if the added note is louder, the tune disappears.'},

  {id:'M7', name:'Vibrato Imitation', book:1, unitIntroduced:10, stageId:'5-6', difficulty:'intermediate',
   musicXmlExample:JZ_XML_TODO, tunesToApply:['Corcovado','Girl from Ipanema'],
   description:'Imitating the vibrato of wind instruments and singers at the piano. Achieved through several techniques including finger oscillation and repeated notes.',
   howToPerform:'The piano cannot bend pitch, so vibrato is faked: repeat the note softly at an irregular rate as it decays, or oscillate between the note and a neighbour a half step away so quickly that the ear hears warmth rather than two pitches.'},

  {id:'M8', name:'Back-Phrasing', book:2, unitIntroduced:6, stageId:'12', difficulty:'advanced',
   musicXmlExample:JZ_XML_TODO, tunesToApply:['Hardly, in the Moonlight','Body and Soul'],
   description:'Starting the melody after the beat, creating a relaxed, behind-the-beat feel. One of the most characteristic devices in jazz vocal and instrumental phrasing.',
   howToPerform:'Delay the whole phrase — not one note — by an eighth or even a quarter, then catch up by the end of it. The accompaniment must not move with you; back-phrasing only exists as a tension against a steady pulse.'},

  {id:'M9', name:'Bell Tones', book:2, unitIntroduced:11, stageId:'14', difficulty:'advanced',
   musicXmlExample:JZ_XML_TODO, tunesToApply:['Body and Soul','My Romance'],
   description:'Octaves played in the upper register as fills between melody phrases. Bell tones add brilliance and punctuate the melodic line.',
   howToPerform:'At the end of a phrase, while the melody rests, play a single chord tone as an octave high in the register and let it ring. One note, placed well, in the silence the melody has left.'},

  {id:'M10', name:'Interlocking Fifths and Sixths', book:2, unitIntroduced:11, stageId:'14',
   difficulty:'advanced', musicXmlExample:JZ_XML_TODO, tunesToApply:['My Romance','In a Sentimental Mood'],
   description:'Playing interlocking fifths and sixths in the upper register between melody phrases. Creates a shimmering harmonic texture as a melodic fill device.',
   howToPerform:'Between phrases, alternate a fifth and a sixth built on adjacent scale degrees high in the register, hands interlocking. The effect is textural rather than melodic — it fills the space with colour rather than with a line.'}
];

/* ── MODEL 6: WrittenPractice ──────────────────────────────────
   Seventeen worksheets, away from the keyboard. Two in Book 1,
   eight in Book 2, seven in Book 3. */

const WRITTEN_PRACTICE = [
  {id:'W-b1u3', title:'Write ii-V-I Voicings in Specified Keys', book:1, unit:3,
   type:'voicing-worksheet', stageId:'3', answersAvailable:true, answersUrl:undefined,
   keysRequired:['C','F','B♭','E♭','G','D'],
   instructions:'Write out ii-V-I voicings using the shell voicing formulas learned in Unit 3 — the 7th and 3rd of each chord. Reinforces voice leading principles and key awareness. Check that the seventh of each chord falls by a half step to the third of the next.',
   crossRefs:['C3']},

  {id:'W-b1u4', title:'Write Modes in Specified Keys', book:1, unit:4,
   type:'scale-writing', stageId:'3-4', answersAvailable:true, answersUrl:undefined,
   keysRequired:['C','F','B♭','E♭','G','D','A'],
   instructions:'Write out the dorian, mixolydian and ionian modes in the specified keys. Reinforces modal construction and key signature awareness. Write the key signature first, then the mode — do not spell it note by note from intervals.',
   crossRefs:['C4']},

  {id:'W-b2u1', title:'Write One-Handed Four-Note Type A/B Voicings', book:2, unit:1,
   type:'voicing-worksheet', stageId:'9', answersAvailable:true, answersUrl:undefined,
   keysRequired:['all twelve'],
   instructions:'Construct and notate one-handed four-note voicings in both Type A and Type B configurations across multiple keys. Watch the register rule: a voicing that sits too low turns to mud, and the book gives the cutoff.',
   crossRefs:['C7','P-locked']},

  {id:'W-b2u2', title:'Write Sidesteps and Tonicizations', book:2, unit:2,
   type:'chord-writing', stageId:'9-10', answersAvailable:true, answersUrl:undefined,
   keysRequired:['all twelve'],
   instructions:'Notate sidestep and tonicization applications for the given chord progressions. Reinforces understanding of these harmonic devices. For each one, mark whether the sidestep comes from above or below, and name the chord the tonicization implies.',
   crossRefs:['P-sidestep','P-tonicization','C8']},

  {id:'W-b2u3', title:'Write Minor ii-V-i Voicings (LN, HN, R Formulas)', book:2, unit:3,
   type:'voicing-worksheet', stageId:'11', answersAvailable:true, answersUrl:undefined,
   keysRequired:['all twelve'],
   instructions:'Write minor ii-V-i voicings using the Low Note (LN), High Note (HN) and Root (R) formulas in the specified keys. Each formula puts a different chord tone at a fixed point in the voicing; write all three for the same progression so the difference is visible.',
   crossRefs:['C10']},

  {id:'W-b2u6', title:'Write Octatonic Scale Patterns', book:2, unit:6,
   type:'scale-writing', stageId:'12', answersAvailable:true, answersUrl:undefined,
   keysRequired:['the 3 unique octatonic scales'],
   instructions:'Write out octatonic scale patterns showing how the same pitch collection serves different harmonic functions. Because there are only three distinct octatonic scales, write each one once and then list the four chords each can serve.',
   crossRefs:['SP6']},

  {id:'W-b2u7', title:'Write Blues Forms in Different Keys', book:2, unit:7,
   type:'blues-form', stageId:'13', answersAvailable:true, answersUrl:undefined,
   keysRequired:['C','F','B♭','E♭','G'],
   instructions:'Notate complete blues form chord progressions in multiple keys, including substitutions and variations. Write the basic form first, then a second pass adding the quick-change, the vi in bar 8, and a turnaround.',
   crossRefs:['T4']},

  {id:'W-b2u9', title:'Write Rhythm Changes Progressions and Endings', book:2, unit:9,
   type:'chord-writing', stageId:'13-14', answersAvailable:true, answersUrl:undefined,
   keysRequired:['B♭','F','E♭'],
   instructions:'Write out rhythm changes progressions including the bridge, common substitutions and standard endings. The A section first without substitutions, then with; the bridge is a cycle of dominants and should be written as such.',
   crossRefs:['SP9','T5','IE-end3']},

  {id:'W-b2u10', title:'Write Drop-Two Voicings and Walking Basslines', book:2, unit:10,
   type:'voicing-worksheet', stageId:'13-14', answersAvailable:true, answersUrl:undefined,
   keysRequired:['all twelve'],
   instructions:'Construct drop-two voicings from closed-position chords, and write walking basslines for common progressions. For the drop-two, write the closed position first and then drop the second voice from the top down an octave, so the derivation stays visible.',
   crossRefs:['C12']},

  {id:'W-b2u12', title:'Write Closed-Position and Drop-Two Voicings for Learning by Ear', book:2, unit:12,
   type:'voicing-worksheet', stageId:'14', answersAvailable:false, answersUrl:undefined,
   keysRequired:['the key of the tune you learned by ear'],
   instructions:'Write the voicings you worked out by ear as part of the self-transcription analysis workflow. There is no answer key — the recording is the answer key. Supports the ear-training and self-assessment process.',
   crossRefs:['SELFANA']},

  {id:'W-b3u2', title:'Write Modal Voicing Shapes Beneath Modes', book:3, unit:2,
   type:'modal-voicing', stageId:'15', answersAvailable:true, answersUrl:undefined,
   keysRequired:['all twelve'],
   instructions:'Construct and notate second-plus-fourth modal voicing shapes beneath each mode of the major scale. Drape the shape under every scale degree in turn; where it produces a doubled note or a stacked third, mark it and move on.',
   crossRefs:['MP2','P-modalvoice']},

  {id:'W-b3u3', title:'Write So What Voicings Beneath Scales', book:3, unit:3,
   type:'modal-voicing', stageId:'15', answersAvailable:true, answersUrl:undefined,
   keysRequired:['all twelve'],
   instructions:'Notate So What voicing shapes (third-plus-fourth inversions) beneath all modes, building fluency with the quintessential modal jazz voicing. Three fourths and a third on top — write the shape on every degree of the scale.',
   crossRefs:['MP3']},

  {id:'W-b3u4', title:'Write Quartal/Cluster Voicings Beneath Modes', book:3, unit:4,
   type:'modal-voicing', stageId:'15', answersAvailable:true, answersUrl:undefined,
   keysRequired:['all twelve'],
   instructions:'Construct quartal and cluster voicings beneath each mode. These voicings avoid traditional third-stacking and produce the open, modern sound of modal jazz. Mark which of your voicings are stable and which are ambiguous enough to serve several chords.',
   crossRefs:['MP4','T10']},

  {id:'W-b3u6', title:'Write Voicing Movements Between Chords', book:3, unit:6,
   type:'modal-voicing', stageId:'15+', answersAvailable:true, answersUrl:undefined,
   keysRequired:['all twelve'],
   instructions:'Notate smooth voice-leading movements between modal chords using the four tools: same pitch classes redistributed, stepwise top or bottom movement, complementary voicings, and parallel transposition. Label which tool each movement uses.',
   crossRefs:['P-modalvoice','MP6']},

  {id:'W-b3u7', title:'Write Planing Exercises', book:3, unit:7,
   type:'modal-voicing', stageId:'15+', answersAvailable:true, answersUrl:undefined,
   keysRequired:['all twelve'],
   instructions:'Write out planing exercises including sidestep targets, tonicization targets and parallel transposition paths. For each planed passage, mark where the voicing leaves the mode and where it returns.',
   crossRefs:['P-planing','P-sidestep-modal']},

  {id:'W-b3u8', title:'Write Connections Between Chords', book:3, unit:8,
   type:'modal-voicing', stageId:'15+', answersAvailable:true, answersUrl:undefined,
   keysRequired:['all twelve'],
   instructions:'Notate chord connections using common tones and contrasting tones between adjacent modal harmonies. Circle the common tones; the notes left uncircled are what actually moves, and those are what the ear follows.',
   crossRefs:['MP8']},

  {id:'W-b3u9', title:'Write Quartal Voicings for ii-V-I Formulas', book:3, unit:9,
   type:'modal-voicing', stageId:'15+', answersAvailable:true, answersUrl:undefined,
   keysRequired:['all twelve'],
   instructions:'Construct quartal voicings specifically for ii-V-I progressions, combining modal voicing techniques with functional harmony. The quartal shape must still resolve — write the voice leading between each chord, not just the three shapes.',
   crossRefs:['MP9']}
];

/* ── MODEL 7: TranscriptionProject ─────────────────────────────
   Twelve guided transcriptions on the COREA method. Six from
   Book 2, six from Book 3. */

const COREA_STEPS = [
  {key:'copy', label:'Copy',
   gist:'Learn the solo or passage note-for-note from the recording.'},
  {key:'observe', label:'Observe',
   gist:'Analyse what the artist is doing harmonically, rhythmically and melodically.'},
  {key:'repeat', label:'Repeat',
   gist:'Play along with the recording until the passage is internalised.'},
  {key:'extract', label:'Extract',
   gist:'Isolate specific devices, patterns or ideas from the transcription.'},
  {key:'apply', label:'Apply',
   gist:'Use the extracted material in your own improvisation over different tunes.'}
];

const TRANSCRIPTION_PROJECTS = [
  {id:'T1', artist:'Miles Davis', tuneName:'Bye Bye Blackbird', album:'’Round About Midnight',
   book:2, unit:1, stageId:'9', listenCount:20, playAlongCount:30,
   focusAreas:['Phrasing','Space','Time feel'], timestamps:['Head in','First chorus','Final eight'],
   coreaSteps:{
     copy:'Learn the written transcription of the solo note for note. Do not read ahead — take four bars at a time and get them exactly, including the rests.',
     observe:'Miles plays very few notes. Count them. Mark every rest longer than a beat, and notice that the phrases almost never begin on beat 1.',
     repeat:'Play along with the recording a minimum of 30 times. Not 30 practice sessions — 30 play-alongs, until your time locks to his without effort.',
     extract:'Pull out three things: one rhythmic placement you would never have chosen, one interval leap, and one way he ends a phrase.',
     apply:'Take those three devices into a blues in F. Use only those, nothing else, for a full chorus.'}},

  {id:'T2', artist:'Miles Davis', tuneName:'Rhythmic Concepts Study', album:'Various (Prestige sessions)',
   book:2, unit:2, stageId:'9-10', listenCount:20, playAlongCount:30,
   focusAreas:['Rhythmic concepts','Space','Placement'], timestamps:['Solo entry','Second chorus'],
   coreaSteps:{
     copy:'Copy the rhythm alone before the pitches. Write the rhythm of each phrase on a single line, then add the notes.',
     observe:'Where does each phrase start relative to the beat? Miles uses tension and release through placement rather than through note choice.',
     repeat:'Play along until you can predict the entry of each phrase before it happens.',
     extract:'Isolate the rhythmic placements — the delayed entries, the phrases that end on an upbeat and leave a hole.',
     apply:'Improvise over a tune you know, using only Miles’s rhythmic placements with your own pitches.'}},

  {id:'T3', artist:'Hank Mobley', tuneName:'If I Should Lose You', album:'Soul Station / Roll Call era',
   book:2, unit:4, stageId:'11-12', listenCount:20, playAlongCount:30,
   focusAreas:['Harmonic concepts','Chord navigation'], timestamps:['First chorus','Bridge'],
   coreaSteps:{
     copy:'Copy the solo note for note, then write the chord symbols above it so the two line up.',
     observe:'Mark every note that is not a chord tone and label what it is doing — approach, enclosure, passing tone. Mobley’s harmonic logic is visible once these are marked.',
     repeat:'Play along until the chord changes feel inevitable rather than remembered.',
     extract:'Extract two ways he gets from one chord to the next, especially across the ii-V.',
     apply:'Use those two connections over a different tune with the same changes.'}},

  {id:'T4', artist:'Illinois Jacquet', tuneName:'Las Vegas Blues', album:'Illinois Jacquet',
   book:2, unit:7, stageId:'13', listenCount:20, playAlongCount:30,
   focusAreas:['Gestures','Melodic shapes','Blues vocabulary'], timestamps:['First chorus','Shout chorus'],
   coreaSteps:{
     copy:'Copy the gestures rather than the notes first — draw the shape of each phrase as a line before writing any pitches.',
     observe:'Jacquet thinks in large melodic contours. Notice how a single gesture is repeated at different pitch levels rather than developed melodically.',
     repeat:'Play along 30 times, exaggerating the shapes.',
     extract:'Take three gestures and write them as shapes, not as notes, so they can be transposed anywhere.',
     apply:'Play those three shapes over a blues in a different key, letting the shape decide the notes.'}},

  {id:'T5', artist:'Horace Silver', tuneName:'Oleo', album:'Horace Silver (rhythm changes)',
   book:2, unit:9, stageId:'13-14', listenCount:20, playAlongCount:30,
   focusAreas:['Rhythm changes navigation','Bebop vocabulary'], timestamps:['A sections','Bridge'],
   coreaSteps:{
     copy:'Copy the solo, marking the form above the staff so you always know which A section you are in.',
     observe:'Rhythm changes moves fast. Notice which chords Silver actually acknowledges and which he plays straight through.',
     repeat:'Play along until you can hold the form without counting.',
     extract:'Extract the bridge vocabulary specifically — the cycle of dominants is where rhythm changes solos are won or lost.',
     apply:'Play your own bridge using Silver’s approach, then the A sections with your own material.'}},

  {id:'T6', artist:'Bud Powell', tuneName:'Ornithology', album:'The Amazing Bud Powell',
   book:2, unit:11, stageId:'14', listenCount:20, playAlongCount:30,
   focusAreas:['Bebop technical fluency','Rhythmic drive'], timestamps:['Head','First chorus'],
   coreaSteps:{
     copy:'Copy at half speed. Powell’s lines are continuous eighth notes and there is nowhere to hide an approximation.',
     observe:'Notice the left hand: sparse, rootless, entirely out of the way of the right. Observe where he breathes.',
     repeat:'Play along a minimum of 30 times. Start under tempo and raise it only when the line is clean.',
     extract:'Extract the enclosures and the chromatic approaches — the bebop grammar that makes the line sound like the era.',
     apply:'Apply the vocabulary to a different bebop head at a tempo you can actually hold.'}},

  {id:'T7', artist:'Miles Davis', tuneName:'So What', album:'Kind of Blue',
   book:3, unit:1, stageId:'15', listenCount:20, playAlongCount:30,
   focusAreas:['Modal improvisation','Use of space'], timestamps:['Head','Miles solo','Coltrane entry'],
   coreaSteps:{
     copy:'Copy Miles’s solo note for note. It is short and it is famous and it is still harder than it looks.',
     observe:'There are only two chords in the whole tune. Observe what Miles does with that: the material is motivic, not harmonic.',
     repeat:'Play along 30 times. The tempo is slow enough that there is no excuse for imprecision.',
     extract:'Extract the motifs and how each one is answered. This is a lesson in development, not in scales.',
     apply:'Improvise over the same two chords using only motifs and their answers — no running of the dorian scale.'}},

  {id:'T8', artist:'Wes Montgomery & Jimmy Smith', tuneName:'Milestones', album:'Jimmy & Wes: The Dynamic Duo',
   book:3, unit:2, stageId:'15', listenCount:20, playAlongCount:0,
   focusAreas:['Modal comping','Interaction','Voicing choices'], timestamps:['Head','Organ comping behind guitar'],
   format:'Guided listening',
   coreaSteps:{
     copy:'This one is guided listening rather than a full transcription — copy the comping, not the solos.',
     observe:'Observe how Smith voices behind Montgomery: which notes he leaves out, and how rarely he moves.',
     repeat:'Listen 20 times or more. Listen once for the organ alone, once for the guitar alone, then together.',
     extract:'Extract three comping voicings and the rhythm each one is played with.',
     apply:'Comp behind a recording of a modal tune using only those three voicings.'}},

  {id:'T9', artist:'Wayne Shorter / Kenny Kirkland', tuneName:'Witch Hunt / Doctone',
   album:'Speak No Evil / Kenny Kirkland', book:3, unit:3, stageId:'15',
   listenCount:20, playAlongCount:30,
   focusAreas:['Contrasting modal improvisation approaches'], timestamps:['Witch Hunt head','Doctone solo'],
   coreaSteps:{
     copy:'Copy a chorus from each. They span two units and two decades and are meant to be compared, not merged.',
     observe:'Shorter is spare and motivic; Kirkland is dense and pentatonic. Observe how each one handles the same modal problem.',
     repeat:'Play along with both, 30 times each.',
     extract:'Extract one device from each — one from Shorter, one from Kirkland — and write them side by side.',
     apply:'Play a chorus of a modal tune in Shorter’s manner, then a chorus in Kirkland’s.'}},

  {id:'T10', artist:'McCoy Tyner', tuneName:'Passion Dance', album:'The Real McCoy',
   book:3, unit:4, stageId:'15', listenCount:20, playAlongCount:30,
   focusAreas:['Quartal voicings','Rhythmic intensity','Pentatonic patterns'],
   timestamps:['Head','Left-hand quartal stabs','Solo climax'],
   coreaSteps:{
     copy:'Copy the left hand first — the quartal voicings and where they land. Then the right-hand line.',
     observe:'Observe the rhythmic intensity: Tyner’s left hand is percussion as much as harmony.',
     repeat:'Play along 30 times. The endurance is part of the lesson.',
     extract:'Extract the quartal voicing shapes and the pentatonic cells in the right hand.',
     apply:'Comp and solo on a modal tune using only quartal voicings and pentatonic material.'}},

  {id:'T11', artist:'Herbie Hancock', tuneName:'Autumn Leaves', album:'Miles in Berlin',
   book:3, unit:9, stageId:'15+', listenCount:20, playAlongCount:30,
   focusAreas:['Harmonic superimposition','Motivic development'],
   timestamps:['Piano solo entry','Superimposition passage'],
   coreaSteps:{
     copy:'Copy the piano solo. Where the harmony does not match the tune, write what Hancock is implying above the actual chord.',
     observe:'Observe the superimposition: he plays a different harmony over the written one and lets the friction resolve.',
     repeat:'Play along 30 times, first with the record, then against a backing track of the plain changes.',
     extract:'Extract two superimpositions and name the relationship — a tritone away, a whole step up, and so on.',
     apply:'Apply one superimposition per chorus on a standard you know well. One is enough to hear.'}},

  {id:'T12', artist:'Brad Mehldau', tuneName:'I Didn’t Know What Time It Was', album:'Art of the Trio',
   book:3, unit:11, stageId:'15+', listenCount:20, playAlongCount:30,
   focusAreas:['Contemporary jazz piano','Odd-meter phrasing','Modern harmony'],
   timestamps:['Head in odd meter','Solo development'],
   coreaSteps:{
     copy:'Copy a chorus. Count the meter before you write anything — getting the bar lines wrong makes the rest meaningless.',
     observe:'Observe how the phrases cross the bar line. Mehldau phrases against the meter almost continuously.',
     repeat:'Play along 30 times with the clave for the meter going in your head.',
     extract:'Extract the way a phrase is displaced and then resolved back onto the downbeat.',
     apply:'Take a standard you know in 4/4 and play it in 5/4 using that displacement.'}}
];

/* ── MODEL 8: TuneApplicationTask ──────────────────────────────
   The eleven-step tune mastery process, introduced in Book 2
   Unit 6 on "Hardly, in the Moonlight". */

const TUNE_APP_STEPS = [
  {stepNumber:1, name:'Learn the Melody', type:'melody', prerequisites:[],
   description:'Learn the melody by ear or from a lead sheet. Play it in the original key with correct phrasing and articulation.'},
  {stepNumber:2, name:'Memorize the Melody', type:'melody', prerequisites:['1'],
   description:'Memorise the melody completely, so it can be played without reference to written music.'},
  {stepNumber:3, name:'Personalize the Melody', type:'melody', prerequisites:['2'],
   description:'Apply melody personalisation techniques: syncopation, ghost notes, grace note slides, turns, double notes, back-phrasing.'},
  {stepNumber:4, name:'Learn the Chord Progression', type:'written', prerequisites:['2'],
   description:'Learn the harmony, write it out, and memorise the chord symbols along with the Roman numeral analysis.'},
  {stepNumber:5, name:'Play Voicings', type:'voicing', prerequisites:['4'],
   description:'Play the chord progression using appropriate voicing types — shell voicings, Type A/B, drop-two, and so on.'},
  {stepNumber:6, name:'Melody with Voicings', type:'voicing', prerequisites:['3','5'],
   description:'Combine the melody in the right hand with voicings in the left. Coordinate both hands.'},
  {stepNumber:7, name:'Comping Patterns', type:'coordination', prerequisites:['5'],
   description:'Apply the learned comping patterns — Charleston, Reverse Charleston and the rest — to the tune’s chord progression.'},
  {stepNumber:8, name:'Improvise with Scale Patterns', type:'improv', prerequisites:['4'],
   description:'Improvise over the changes using the learned scale patterns, targeting guidetones and chord tones.'},
  {stepNumber:9, name:'Coordination', type:'coordination', prerequisites:['7','8'],
   description:'Improvise in the right hand while comping in the left. Apply the coordination exercises to the tune.'},
  {stepNumber:10, name:'Introduction and Ending', type:'voicing', prerequisites:['6'],
   description:'Add an introduction and an ending to the tune, for a complete performance.'},
  {stepNumber:11, name:'Dream Solo', type:'dream-solo', prerequisites:['9','10'],
   description:'Record yourself, analyse it, and refine. Work toward your ideal solo on this tune.'}
];

/* Which tunes each band of units suggests the workflow be applied to. */
const TUNE_APP_SUGGESTIONS = [
  {book:1, units:'1-4', stageId:'1-4',
   gist:'Simple standards with ii-V-I progressions',
   suggestedTunes:['Satin Doll','Autumn Leaves','All of Me']},
  {book:1, units:'5-8', stageId:'5-8',
   gist:'Standards with more complex forms',
   suggestedTunes:['Evening in Lyon','Blue Train','Blue Monk']},
  {book:1, units:'9-12', stageId:'5-8',
   gist:'Standards requiring voicing variety and comping flexibility',
   suggestedTunes:['Blues for Sammie','Girl from Ipanema','Desafinado','Alice in Wonderland']},
  {book:2, units:'1-4', stageId:'9-12',
   gist:'Standards with minor ii-V-i progressions and modal sections',
   suggestedTunes:['Bye Bye Blackbird','If I Should Lose You','Beautiful Love']},
  {book:2, units:'5-8', stageId:'11-14',
   gist:'Blues forms and rhythm changes tunes',
   suggestedTunes:['Hardly, in the Moonlight','Las Vegas Blues','Oleo']},
  {book:2, units:'9-12', stageId:'13-14',
   gist:'Advanced standards requiring the full vocabulary',
   suggestedTunes:['Ornithology','Unit 7','Body and Soul']},
  {book:3, units:'1-4', stageId:'15+',
   gist:'Modal tunes',
   suggestedTunes:['So What','Milestones','Impressions','Passion Dance']},
  {book:3, units:'5-8', stageId:'15+',
   gist:'Tunes with mixed modal and functional harmony',
   suggestedTunes:['Contemplation','Afro Blue','Windows','Inner Urge']},
  {book:3, units:'9-12', stageId:'15+',
   gist:'Contemporary jazz repertoire with odd meters and complex forms',
   suggestedTunes:['Autumn Leaves','Forest Flower','I Didn’t Know What Time It Was','Fiasco']}
];

/* ── MODEL 9: BossaNovaComping ─────────────────────────────────
   Three styles, Book 1 Unit 10. The eighth notes are syncopated
   but NOT swung — even, straight eighths throughout. */

const BOSSA_STYLES = [
  {id:'BN1', style:'Two-Handed Voicings', book:1, unit:10, stageId:'5-6',
   difficulty:'intermediate', musicXmlNotation:JZ_XML_TODO,
   tunesToPractice:['Girl from Ipanema','Desafinado'],
   rhythm:'Both hands play voicings together in the characteristic syncopated bossa pattern, emphasising the offbeats.',
   description:'Both hands play voicings together in the characteristic bossa nova rhythm. The syncopated pattern emphasises offbeats and creates the distinctive bossa groove.',
   notes:'Straight eighths, not swung. If it starts to swing, slow down until the eighths are even again.'},

  {id:'BN2', style:'RH Comping with LH Bassline', book:1, unit:10, stageId:'5-6',
   difficulty:'intermediate', musicXmlNotation:JZ_XML_TODO,
   tunesToPractice:['Girl from Ipanema','Desafinado'],
   rhythm:'Right hand plays comping voicings while the left hand keeps a bossa nova bassline — usually root and fifth.',
   description:'Right hand plays comping voicings while the left hand provides a bossa nova bassline. Develops independence similar to the swing coordination exercises but within the bossa nova idiom.',
   notes:'The bassline does not vary. Its steadiness is what lets the right hand syncopate freely.'},

  {id:'BN3', style:'Partido Alto Rhythm Pattern', book:1, unit:10, stageId:'5-6',
   difficulty:'intermediate', musicXmlNotation:JZ_XML_TODO,
   tunesToPractice:['Girl from Ipanema','Desafinado'],
   rhythm:'The partido alto pattern — a two-bar Brazilian figure with a distinct syncopation profile.',
   description:'The partido alto is a specific Brazilian rhythmic pattern with a distinct syncopation profile. More rhythmically complex than the basic bossa nova patterns.',
   notes:'Learn it by singing it before playing it. Written down it looks arbitrary; sung, it is obviously a groove.'}
];

/* ── MODEL 10: IntroductionEnding ──────────────────────────────
   Three introductions, three stock ending fills, three tags.
   All of them in all twelve keys. */

const INTROS_ENDINGS = [
  {id:'IE-int1', name:'Last Four Measures', type:'introduction', book:2, unit:7, stageId:'13',
   musicXmlNotation:JZ_XML_TODO, keysToPractice:['all twelve'],
   tunesToApply:['Autumn Leaves','All of Me','Satin Doll'],
   usage:'The most common introduction; works with virtually any standard.',
   description:'Play the last four measures of the tune as an introduction. It establishes the key, the tempo and the harmonic context before the melody begins.',
   steps:['Find the last four bars of the form.','Play them in tempo, comping rather than stating the melody.','Resolve onto the first chord of the head.','Bring the melody in on the downbeat.']},

  {id:'IE-int2', name:'Vamp Introduction', type:'introduction', book:2, unit:7, stageId:'13',
   musicXmlNotation:JZ_XML_TODO, keysToPractice:['all twelve'],
   tunesToApply:['So What','Impressions','Afro Blue'],
   usage:'Modal tunes and groove-based tunes.',
   description:'A repeated one- or two-measure harmonic vamp that establishes the groove before the head. Common in modal and funk-influenced jazz.',
   steps:['Choose a one- or two-bar harmonic cell, usually the first chord of the tune.','Repeat it until the groove settles — four, eight or sixteen bars.','Signal the band, or decide for yourself, where it ends.','Enter the head without breaking the groove.']},

  {id:'IE-int3', name:'Rubato Introduction', type:'introduction', book:2, unit:7, stageId:'13',
   musicXmlNotation:JZ_XML_TODO, keysToPractice:['all twelve'],
   tunesToApply:['Body and Soul','In a Sentimental Mood','My Romance'],
   usage:'Ballads and expressive settings.',
   description:'A free-tempo introduction that sets the mood before establishing time. Often used for ballads and expressive performances.',
   steps:['Play out of tempo — no pulse at all.','Use material from the tune, usually the last phrase or the bridge.','Arrive on the dominant of the tune’s key.','Establish tempo on the first bar of the head, not before.']},

  {id:'IE-end1', name:'Scalar Run to Final Chord', type:'ending', book:2, unit:9, stageId:'13-14',
   musicXmlNotation:JZ_XML_TODO, keysToPractice:['all twelve'],
   tunesToApply:['All of Me','Autumn Leaves'],
   usage:'Bright tempos; a decisive, unambiguous finish.',
   description:'A scalar run leading into the final chord. It can be ascending or descending, and may use chromatic or diatonic motion.',
   steps:['Start the run on the last chord before the tonic.','Ascend or descend through the scale of the destination key.','Time the run so its last note is the downbeat of the final chord.','Land on the tonic voicing and let it ring.']},

  {id:'IE-end2', name:'Arpeggiated Fill', type:'ending', book:2, unit:9, stageId:'13-14',
   musicXmlNotation:JZ_XML_TODO, keysToPractice:['all twelve'],
   tunesToApply:['Body and Soul','My Romance'],
   usage:'Ballads; an ending with a flourish rather than a punch.',
   description:'An arpeggiated figure through the final chord tones, often ending with a dramatic upper-register flourish.',
   steps:['Arpeggiate the final chord from the bottom of the keyboard upward.','Add the ninth and the sixth as you climb.','Finish in the top octave, softly.','Let the pedal hold the whole sonority.']},

  {id:'IE-end3', name:'Count Basie Ending', type:'ending', book:2, unit:9, stageId:'13-14',
   musicXmlNotation:JZ_XML_TODO, keysToPractice:['all twelve'],
   tunesToApply:['Shiny Stockings','Li’l Darlin’','April in Paris'],
   usage:'The most recognisable ending in jazz; works anywhere a wink is appropriate.',
   description:'The classic Count Basie-style ending with a chromatic approach to the final chord. One of the most recognisable ending devices in jazz.',
   steps:['Stop the band. Leave silence.','Play the three-note figure, high and sparse, approaching the tonic chromatically.','Leave more silence than feels comfortable between the notes.','Final chord, quietly.']},

  {id:'IE-tag1', name:'Simple Repeat Tag', type:'tag', book:2, unit:9, stageId:'13-14',
   musicXmlNotation:JZ_XML_TODO, keysToPractice:['all twelve'],
   tunesToApply:['Autumn Leaves','There Will Never Be Another You'],
   usage:'The default three-time tag; safe in any group.',
   description:'Repeat the last two or four measures three times, with a ritardando on the final repetition. The most straightforward tag ending.',
   steps:['Identify the last two or four bars of the form.','Play them once as written.','Play them a second time, identically.','Play them a third time with a ritardando, then the final chord.']},

  {id:'IE-tag2', name:'Reharmonized Tag', type:'tag', book:2, unit:9, stageId:'13-14',
   musicXmlNotation:JZ_XML_TODO, keysToPractice:['all twelve'],
   tunesToApply:['Body and Soul','All the Things You Are'],
   usage:'Where a plain repeat would sound like an accident rather than a choice.',
   description:'Repeat the final phrase with altered harmonisations each time through, building harmonic interest with each repetition.',
   steps:['Play the tag once with the written harmony.','Second time, substitute — tritone subs, or a backdoor ii-V.','Third time, go further: a chromatic descent or a deceptive cadence.','Resolve to the tonic on the fourth pass.']},

  {id:'IE-tag3', name:'Ritardando Tag with Final Cadence', type:'tag', book:2, unit:9, stageId:'13-14',
   musicXmlNotation:JZ_XML_TODO, keysToPractice:['all twelve'],
   tunesToApply:['In a Sentimental Mood','My Romance'],
   usage:'Ballads, and any performance that wants an unambiguous ending.',
   description:'A gradual ritardando over three repetitions culminating in a definitive final cadence. Provides a clear, satisfying conclusion to the performance.',
   steps:['First repetition in tempo.','Second repetition slightly slower.','Third repetition markedly slower, stretching each beat.','A full cadence — V to I — on the last two chords, with the final chord held.']}
];

/* ── MODEL 11: MemorizationTransposition ───────────────────────
   Four types of musical memory, plus the two transposition
   approaches. Minimum target: six keys per tune. */

const MEMORY_TYPES = [
  {id:'MEM-intellectual', memoryType:'intellectual', name:'Intellectual Memory', order:1,
   stageId:'12', keysRequired:['a minimum of six keys per tune'],
   transpositionMethod:'Roman numeral analysis',
   description:'Understanding the theoretical structure of the music: chord progressions, form, key relationships and harmonic function. The foundation that supports all the other memory types.',
   method:'Analyse the tune’s harmony using Roman numerals.',
   exercises:['Write out the chord progression from memory, away from the piano.',
     'Identify the form sections and where each one begins.',
     'Name the key of every modulation and the pivot chord that gets you there.']},

  {id:'MEM-muscle', memoryType:'muscle', name:'Muscle Memory', order:2,
   stageId:'12', keysRequired:['a minimum of six keys per tune'],
   transpositionMethod:'Repetition in each new key until the hand shape is automatic',
   description:'Physical, kinesthetic memory of hand shapes, finger patterns and physical movements. Developed through extensive repetition.',
   method:'Repetitive practice of voicings, scales and patterns.',
   exercises:['Play the tune slowly in multiple keys, attending to the hand shapes rather than the notes.',
     'Play with your eyes closed so the hand has only its own memory to go on.',
     'Play the voicings alone, without the melody, until the shapes arrive unprompted.']},

  {id:'MEM-aural', memoryType:'aural', name:'Aural Memory', order:3,
   stageId:'12', keysRequired:['a minimum of six keys per tune'],
   transpositionMethod:'Scale degree hearing — transfer the sung degrees to the new key',
   description:'The ability to hear the music internally before playing it. The most important memory type for improvisation and expressive performance.',
   method:'Sing melodies and bass lines; audiate chord progressions.',
   exercises:['Sing the melody, then play it.',
     'Sing the bass line while playing the voicings.',
     'Audiate a full chorus without touching the keyboard, then check yourself against the piano.']},

  {id:'MEM-emotional', memoryType:'emotional', name:'Emotional Memory', order:4,
   stageId:'12', keysRequired:['a minimum of six keys per tune'],
   transpositionMethod:'The emotional shape is key-independent; carry it across unchanged',
   description:'The emotional connection to the music that enables expressive, meaningful performance. Often the last memory type to develop, and the most powerful in performance.',
   method:'Connect with the lyrics, the story and the mood of each tune.',
   exercises:['Study the lyrics, even for a tune you will only play instrumentally.',
     'Listen to vocal versions and notice where the singer takes time.',
     'Perform with a specific emotional intention, decided before you begin.']}
];

const TRANSPOSITION_METHODS = [
  {id:'TR-roman', name:'Roman Numeral Approach',
   description:'Analyse the tune’s chord progression as Roman numerals (I, ii, V and so on) and apply those numerals to each new key. Emphasises harmonic function.',
   bestFor:'Tunes whose interest is harmonic — standards with many ii-Vs and modulations.'},
  {id:'TR-degree', name:'Scale Degree Approach',
   description:'Think of the melody notes and bass notes as scale degrees (1, 2, 3 and so on) and transfer them to each new key. Emphasises melodic relationships.',
   bestFor:'Tunes whose interest is melodic — a strong tune with simple changes.'}
];

const TRANSPOSITION_NOTE = 'Both approaches are valid and complementary. Experiment with both and use whichever feels more natural for a given tune. The goal is fluency in at least six keys for every tune in the repertoire.';

/* ── MODEL 12: SelfTranscriptionAnalysis ───────────────────────
   Record yourself, transcribe it, then answer these seventeen.
   Question 9 is a chart: eight eighth-note subdivisions, marked
   for where each phrase begins. */

const BEAT_SUBDIVISIONS = ['beat 1','and of 1','beat 2','and of 2',
  'beat 3','and of 3','beat 4','and of 4'];

const SELF_TRANSCRIPTION_QS = [
  {questionNumber:1, answerType:'count', questionText:'How many choruses did you play?',
   example:'Count from the first note of your solo to the last.'},
  {questionNumber:2, answerType:'count', questionText:'How many different comping patterns did you use?',
   example:'Charleston and Reverse Charleston counts as two.'},
  {questionNumber:3, answerType:'text', questionText:'Did you use Charleston, Reverse Charleston, or both?',
   example:'Name them, and say roughly where each one appeared.'},
  {questionNumber:4, answerType:'boolean', questionText:'Did you use lead-ins?',
   example:'A chord on "and of 3" or beat 4, pushing into the next bar.'},
  {questionNumber:5, answerType:'boolean', questionText:'Did you use push-offs?',
   example:'Two consecutive eighth notes in the comping.'},
  {questionNumber:6, answerType:'boolean', questionText:'Did you vary between long and short comps?',
   example:'Or was everything the same length throughout?'},
  {questionNumber:7, answerType:'count', questionText:'How many scale patterns did you use in your improvisation?',
   example:'Intervallic, triadic, bebop, enclosures — count the distinct types.'},
  {questionNumber:8, answerType:'boolean', questionText:'Did your improvisation target guidetones?',
   example:'The 3rds and 7ths, arrived at deliberately on the chord changes.'},
  {questionNumber:9, answerType:'chart',
   questionText:'Chart the contour of your solo. Which subdivision does each phrase start on?',
   example:'Mark every subdivision on which one of your phrases began. If they all start on beat 1, that is the finding.'},
  {questionNumber:10, answerType:'boolean', questionText:'Did you leave space in your solo?',
   example:'Rests of a bar or more, deliberately placed.'},
  {questionNumber:11, answerType:'text', questionText:'Did you use any melody personalization techniques? Which ones?',
   example:'Ghost notes, turns, double notes, back-phrasing, grace-note slides.'},
  {questionNumber:12, answerType:'boolean', questionText:'Was your swing feel consistent?',
   example:'Or did it straighten out when the passage got difficult?'},
  {questionNumber:13, answerType:'boolean', questionText:'Did your comping and improvisation coordinate well?',
   example:'Or did one hand stop when the other got busy?'},
  {questionNumber:14, answerType:'text', questionText:'Did you use an introduction? What style?',
   example:'Last four measures, vamp, or rubato.'},
  {questionNumber:15, answerType:'text', questionText:'Did you use an ending? What style?',
   example:'Scalar run, arpeggiated fill, Count Basie ending, or a three-time tag.'},
  {questionNumber:16, answerType:'text', questionText:'What were the strongest moments in your performance?',
   example:'Be specific — name the bar or the phrase, not just "the bridge".'},
  {questionNumber:17, answerType:'text', questionText:'What are your top three areas for improvement?',
   example:'Three, not one and not ten. These become the focus prompts in your practice plan.'}
];

/* ── MODEL 13: UnitAssignment ──────────────────────────────────
   The master container. Built from the thirty-six units in
   19-jazz-k-units.js rather than duplicated here, so there is one
   source of truth for what a unit asks of you. This reshapes each
   assignment item into the specified record and derives the keys
   and tunes the assignment names from its own text. */

const JZ_KEY_WORD = /\b(?:in\s+)?all\s+twelve\s+keys\b/i;
const JZ_KEY_LIST = /\bin\s+((?:[A-G](?:♯|♭|#|b)?)(?:\s*,\s*(?:and\s+)?[A-G](?:♯|♭|#|b)?)+)\b/;

function jazzAssignmentKeys(text){
  if(JZ_KEY_WORD.test(text)) return ['all twelve'];
  const m = JZ_KEY_LIST.exec(text);
  if(!m) return [];
  return m[1].split(/\s*,\s*(?:and\s+)?/).map(s => s.trim()).filter(Boolean);
}
function jazzAssignmentTunes(text){
  const out = [];
  for(const m of text.matchAll(/[“"]([^”"]{2,60})[”"]/g)){
    const t = m[1].trim();
    if(t && !out.includes(t)) out.push(t);
  }
  return out;
}
/* Every assignment across all thirty-six units, in the specified
   shape. Built once and cached, because nothing in it changes. */
let JZ_UNIT_ASSIGNMENTS = null;
function jazzUnitAssignments(){
  if(JZ_UNIT_ASSIGNMENTS) return JZ_UNIT_ASSIGNMENTS;
  const out = [];
  for(const u of SISKIND_UNITS){
    (u.assignments || []).forEach((a, i) => {
      out.push({
        id: `${u.id}-A${i + 1}`,
        book: u.book, unit: u.unit, assignmentNumber: i + 1,
        category: a.category, description: a.text,
        subTasks: Array.isArray(a.subTasks) ? a.subTasks : [],
        minutesRecommended: a.minutes || 0,
        keysSpecified: jazzAssignmentKeys(a.text),
        tunesSpecified: jazzAssignmentTunes(a.text),
        exerciseRef: a.exerciseRef || undefined,
        guidedListeningRef: a.category === 'guided-listening'
          ? (jazzAssignmentTunes(a.text)[0] || undefined) : undefined,
        unitId: u.id, part: a.part, stageId: u.stageId
      });
    });
  }
  JZ_UNIT_ASSIGNMENTS = out;
  return out;
}

/* ── LOOKUPS ───────────────────────────────────────────────────── */

const JAZZ_CATALOG_CATS = [
  {id:'coord', n:1, icon:'\u{1f91d}', name:'Coordination Exercises',
   blurb:'Two hands doing different things, twelve keys at a time.',
   rows:() => COORD_EXERCISES, label:e => e.name, model:'CoordinationExercise'},
  {id:'swing', n:2, icon:'\u{1f3b7}', name:'Swing Feel & Articulation',
   blurb:'Where the swing actually comes from: the offbeat, and how long it is.',
   rows:() => SWING_EXERCISES, label:e => e.name, model:'SwingArticulationExercise'},
  {id:'comping', n:3, icon:'\u{1f3b9}', name:'Comping Pattern Library',
   blurb:'Thirty named left-hand patterns, and the beats each one falls on.',
   rows:() => COMPING_PATTERNS, label:e => e.name, model:'CompingPattern'},
  {id:'scales', n:4, icon:'\u{1f4c8}', name:'Scale Pattern Exercises',
   blurb:'Twelve functional patterns from Book 2, twelve modal from Book 3.',
   rows:() => SCALE_PATTERNS, label:e => e.name, model:'ScalePatternExercise'},
  {id:'melody', n:5, icon:'\u{1f3a8}', name:'Melody Personalization',
   blurb:'Ten ways to stop a written melody sounding written.',
   rows:() => MELODY_TECHNIQUES, label:e => e.name, model:'MelodyPersonalizationTechnique'},
  {id:'written', n:6, icon:'✏️', name:'Written Practice',
   blurb:'Seventeen worksheets for away from the keyboard.',
   rows:() => WRITTEN_PRACTICE, label:e => e.title, model:'WrittenPractice'},
  {id:'transcribe', n:7, icon:'\u{1f4bf}', name:'Transcription Projects',
   blurb:'Twelve records, each with its five COREA steps written out.',
   rows:() => TRANSCRIPTION_PROJECTS, label:e => `${e.artist} — ${e.tuneName}`,
   model:'TranscriptionProject'},
  {id:'tuneapp', n:8, icon:'\u{1f3bc}', name:'Tune Application Workflow',
   blurb:'The eleven steps, from learning the melody to the dream solo.',
   rows:() => TUNE_APP_STEPS, label:e => `${e.stepNumber}. ${e.name}`,
   model:'TuneApplicationTask', special:'tune'},
  {id:'bossa', n:9, icon:'\u{1f334}', name:'Bossa Nova Comping',
   blurb:'Three styles. Syncopated, but not swung.',
   rows:() => BOSSA_STYLES, label:e => e.style, model:'BossaNovaComping'},
  {id:'intros', n:10, icon:'\u{1f3ac}', name:'Introductions & Endings',
   blurb:'Three ways in, three ways out, and three tags.',
   rows:() => INTROS_ENDINGS, label:e => e.name, model:'IntroductionEnding'},
  {id:'memory', n:11, icon:'\u{1f9e0}', name:'Memorization & Transposition',
   blurb:'Four kinds of memory, and six keys minimum.',
   rows:() => MEMORY_TYPES, label:e => e.name, model:'MemorizationTransposition',
   special:'memory'},
  {id:'selfana', n:12, icon:'\u{1f50d}', name:'Self-Transcription Analysis',
   blurb:'Record yourself, then answer seventeen questions honestly.',
   rows:() => SELF_TRANSCRIPTION_QS, label:e => `Q${e.questionNumber}`,
   model:'SelfTranscriptionAnalysis', special:'selfana'}
];

function jazzCatalogCat(id){ return JAZZ_CATALOG_CATS.find(c => c.id === id) || null; }
function jazzCatalogEntry(catId, entryId){
  const c = jazzCatalogCat(catId);
  if(!c) return null;
  return c.rows().find(r => String(r.id) === String(entryId)
    || String(r.stepNumber) === String(entryId)
    || String(r.questionNumber) === String(entryId)) || null;
}
/* Every catalog row, flattened, for search across the whole thing. */
function jazzCatalogAll(){
  const out = [];
  for(const c of JAZZ_CATALOG_CATS)
    for(const r of c.rows())
      out.push({cat:c, row:r, id:r.id || r.stepNumber || r.questionNumber, label:c.label(r)});
  return out;
}

/* ── STATE ─────────────────────────────────────────────────────── */

/* Which category and entry are open. Scratch — the address says it. */
function jazzCatalogUi(){
  return S._jzcat = S._jzcat || {cat:null, entryId:null, q:'', filterBook:'', filterType:''};
}
/* Twelve-key progress for anything with keys: coordination
   exercises, scale patterns, intro/endings. Keyed by entry id. */
function jazzCatalogKeys(){
  const j = jazzState();
  j.catalogKeys = j.catalogKeys && typeof j.catalogKeys === 'object' ? j.catalogKeys : {};
  return j.catalogKeys;
}
function jazzCatalogKeyDone(id, key){ return !!(jazzCatalogKeys()[id] || {})[key]; }
function jazzCatalogSetKey(id, key, on){
  const all = jazzCatalogKeys();
  all[id] = all[id] || {};
  if(on) all[id][key] = true; else delete all[id][key];
  saveNow();
}
function jazzCatalogKeyCount(id){ return Object.keys(jazzCatalogKeys()[id] || {}).length; }

/* Listen and play-along counts per transcription project. */
function jazzTranscriptionCounts(){
  const j = jazzState();
  j.transcriptionCounts = j.transcriptionCounts && typeof j.transcriptionCounts === 'object'
    ? j.transcriptionCounts : {};
  return j.transcriptionCounts;
}
function jazzTranscriptionCount(id){
  const c = jazzTranscriptionCounts()[id];
  return c && typeof c === 'object' ? c : {listen:0, playAlong:0, corea:{}};
}
function jazzTranscriptionBump(id, which, by){
  const all = jazzTranscriptionCounts();
  const c = all[id] = all[id] || {listen:0, playAlong:0, corea:{}};
  c[which] = Math.max(0, (+c[which] || 0) + by);
  saveNow();
}
function jazzTranscriptionCorea(id, step, on){
  const all = jazzTranscriptionCounts();
  const c = all[id] = all[id] || {listen:0, playAlong:0, corea:{}};
  c.corea = c.corea && typeof c.corea === 'object' ? c.corea : {};
  if(on) c.corea[step] = true; else delete c.corea[step];
  saveNow();
}

/* The eleven-step workflow, per tune. */
function jazzTuneMastery(){
  const j = jazzState();
  j.tuneMastery = j.tuneMastery && typeof j.tuneMastery === 'object' ? j.tuneMastery : {};
  j.tuneMastery.current = typeof j.tuneMastery.current === 'string' ? j.tuneMastery.current : '';
  j.tuneMastery.tunes = j.tuneMastery.tunes && typeof j.tuneMastery.tunes === 'object'
    ? j.tuneMastery.tunes : {};
  return j.tuneMastery;
}
function jazzTuneSteps(tune){
  const tm = jazzTuneMastery();
  if(!tune) return {};
  tm.tunes[tune] = tm.tunes[tune] && typeof tm.tunes[tune] === 'object' ? tm.tunes[tune] : {};
  return tm.tunes[tune];
}
function jazzTuneStepDone(tune, n){ return !!jazzTuneSteps(tune)[n]; }
function jazzTuneSetStep(tune, n, on){
  const s = jazzTuneSteps(tune);
  if(on) s[n] = true; else delete s[n];
  saveNow();
}
function jazzTuneProgress(tune){
  const done = Object.keys(jazzTuneSteps(tune)).length;
  return {done, of:TUNE_APP_STEPS.length,
    pct: Math.round(done / TUNE_APP_STEPS.length * 100)};
}

/* The four memory types: a one-to-five rating per tune per type,
   and which keys the tune has been transposed into. */
function jazzMemoryState(){
  const j = jazzState();
  j.memory = j.memory && typeof j.memory === 'object' ? j.memory : {};
  j.memory.current = typeof j.memory.current === 'string' ? j.memory.current : '';
  j.memory.tunes = j.memory.tunes && typeof j.memory.tunes === 'object' ? j.memory.tunes : {};
  return j.memory;
}
function jazzMemoryTune(tune){
  const m = jazzMemoryState();
  if(!tune) return {ratings:{}, keys:{}, method:'TR-roman'};
  const t = m.tunes[tune] = m.tunes[tune] && typeof m.tunes[tune] === 'object'
    ? m.tunes[tune] : {ratings:{}, keys:{}, method:'TR-roman'};
  t.ratings = t.ratings && typeof t.ratings === 'object' ? t.ratings : {};
  t.keys = t.keys && typeof t.keys === 'object' ? t.keys : {};
  t.method = t.method || 'TR-roman';
  return t;
}

/* Self-transcription analyses: one draft in progress, and the
   saved ones kept for comparison over time. */
function jazzSelfAnalysisState(){
  const j = jazzState();
  j.selfAnalyses = Array.isArray(j.selfAnalyses) ? j.selfAnalyses : [];
  j.selfAnalysisDraft = j.selfAnalysisDraft && typeof j.selfAnalysisDraft === 'object'
    ? j.selfAnalysisDraft : {tuneName:'', answers:{}, beats:{}, notes:'', goals:''};
  const d = j.selfAnalysisDraft;
  d.answers = d.answers && typeof d.answers === 'object' ? d.answers : {};
  d.beats = d.beats && typeof d.beats === 'object' ? d.beats : {};
  return j;
}
function jazzSelfAnalysisDraft(){ return jazzSelfAnalysisState().selfAnalysisDraft; }
function jazzSelfAnalysisSave(){
  const j = jazzSelfAnalysisState();
  const d = j.selfAnalysisDraft;
  j.selfAnalyses.unshift({
    id: 'SA-' + Date.now(),
    recordingDate: new Date().toISOString(),
    tuneName: d.tuneName || 'Untitled',
    questions: SELF_TRANSCRIPTION_QS.map(q => ({
      questionNumber: q.questionNumber, questionText: q.questionText,
      answerType: q.answerType,
      answer: q.answerType === 'chart' ? {...d.beats} : (d.answers[q.questionNumber] ?? null)
    })),
    assessmentNotes: d.notes || '',
    improvementGoals: (d.goals || '').split('\n').map(s => s.trim()).filter(Boolean)
  });
  j.selfAnalysisDraft = {tuneName:'', answers:{}, beats:{}, notes:'', goals:''};
  saveNow();
}
/* The most recent analysis, which the plan engine reads to bias
   what it suggests. */
function jazzLatestAnalysis(){
  const list = jazzSelfAnalysisState().selfAnalyses;
  return list.length ? list[0] : null;
}
