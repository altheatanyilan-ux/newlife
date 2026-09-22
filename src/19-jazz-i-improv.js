/* ============================================================
   IMPROVISATION EXERCISES — 36 Siskind + 12 vocal + reference cards.

   Separate from (but cross-linked with) the main exercise curriculum.
   Progress is tracked in the plan state rather than separately, since
   a session is a session whether logged here or from the daily plan.
   ============================================================ */

const IMPROVISATION_LIBRARY = {

  guidedImprovisation: [

    /* BOOK 1 */
    {id:'IMP-B1-01', title:'Drone Improvisation 1', subtitle:'Listening, Phrasing, Rhythm',
     source:'Siskind Book 1', sourceUnit:'Unit 1', sourcePages:'pp.9-10', stageAlignment:'Stage 1',
     exerciseType:'drone', difficulty:'beginner', instrumentFocus:'piano',
     setup:{leftHand:'Low fifth (C-G), repeat as sound fades', keys:['C'],
       backingTrack:null, tempo:'Out of time (meditative, not a performance)', timerMinutes:5},
     pointsOfFocus:[
       {id:'p1', title:'Are you really listening?',
        description:'Listen to each note. Is it tense? Resolved? Beautiful? Ugly? Leading somewhere? Stable? Examine your melodies like a fascinated scientist watching an exciting experiment.',
        practicePrompt:'Before you play the next note, listen to the one that is sounding.'},
       {id:'p2', title:'Clear beginnings and endings',
        description:'Practice taking your hand ALL the way off the piano between phrases. Try giving each phrase a dynamic shape — crescendo to the middle, decrescendo to the end.',
        practicePrompt:'Can I hear where this phrase starts and stops?'},
       {id:'p3', title:'Rhythmic variety',
        description:'Observe your rhythmic habits (don\'t try to control). Then add whatever is missing — triplets? Long notes? Syncopation?',
        practicePrompt:'What rhythms am I NOT using? Use one.'}],
     faq:[{question:'This seems easy. Can I skip it?',
       answer:'Drone improvisation isn\'t meant to be easy or hard. It\'s meant to be HABIT-FORMING. If your mind wanders, you are not doing it correctly — focus up!'}],
     prerequisiteExercises:[], connectsToStages:['Stage 1'],
     connectsToListening:['GL-B1-01'], concepts:['listening','phrasing','rhythm']},

    {id:'IMP-B1-02', title:'Drone Improvisation 2', subtitle:'Hand Positions, Call-and-Response',
     source:'Siskind Book 1', sourceUnit:'Unit 2', sourcePages:'p.23', stageAlignment:'Stage 2',
     exerciseType:'drone', difficulty:'beginner', instrumentFocus:'piano',
     setup:{leftHand:'Low fifth (C-G), repeat as sound fades', keys:['C'],
       backingTrack:null, tempo:'Out of time', timerMinutes:5},
     pointsOfFocus:[
       {id:'p1', title:'Variety of hand positions',
        description:'Cross your right hand over your left. Cross it back under. Spread across two octaves. Hold an arpeggio position. The C major scale uses all five fingers — use the whole keyboard.',
        practicePrompt:'Am I using the whole keyboard?'},
       {id:'p2', title:'Call-and-response format',
        description:'Play a short phrase (the call). Then answer it with a contrasting phrase (the response). The response does not have to rhyme — it just has to respond.',
        practicePrompt:'Does my next phrase answer the one I just played?'}],
     faq:[{question:'How long should each phrase be?',
       answer:'Siskind suggests 1-2 bars. Short enough that you can hear its shape; long enough that it says something.'}],
     prerequisiteExercises:['IMP-B1-01'], connectsToStages:['Stage 2'],
     connectsToListening:['GL-B1-02'], concepts:['phrasing','call-and-response','hand-positions']},

    {id:'IMP-B1-03', title:'Drone Improvisation in F and Bb', subtitle:'Grace Notes, Sequences',
     source:'Siskind Book 1', sourceUnit:'Unit 3', sourcePages:'pp.35-36', stageAlignment:'Stage 3',
     exerciseType:'drone', difficulty:'beginner', instrumentFocus:'piano',
     setup:{leftHand:'Low fifth (F-C) for F, then (Bb-F) for Bb', keys:['F','Bb'],
       backingTrack:null, tempo:'Out of time', timerMinutes:5},
     pointsOfFocus:[
       {id:'p1', title:'Grace note slides',
        description:'A grace note is a short slide into a target note from a half step below. It simulates a horn\'s pitch bend. Practice sliding into important scale degrees.',
        practicePrompt:'Did I use any grace notes?'},
       {id:'p2', title:'Repetition and sequences',
        description:'A sequence is a pattern repeated at different pitch levels. Play a short gesture, then repeat it starting one step higher or lower. Sequences give your phrases direction.',
        practicePrompt:'Can I take this phrase and move it up one step?'}],
     faq:[{question:'Why F and Bb?',
       answer:'The cycle of fourths (C → F → Bb → Eb → ...) is the most important transposition route in jazz. Most ii-V-I progressions move by descending fifths, which is the same thing going the other way.'}],
     prerequisiteExercises:['IMP-B1-02'], connectsToStages:['Stage 3'],
     connectsToListening:['GL-B1-03'], concepts:['grace-notes','sequences','transposition']},

    {id:'IMP-B1-04', title:'Building Rhythmic Vocabulary 1', subtitle:null,
     source:'Siskind Book 1', sourceUnit:'Unit 4', sourcePages:'pp.49-50', stageAlignment:'Stage 4',
     exerciseType:'rhythm', difficulty:'beginner', instrumentFocus:'piano',
     setup:{leftHand:'Shell voicings or low fifth', keys:['C','F','Eb','G'],
       backingTrack:'Slow to medium swing backing track', tempo:'Slow swing to begin', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Practicing Rhythm 1 on every beat',
        description:'Siskind\'s Rhythm 1 is the quarter-note triplet pattern. Practice starting it on beat 1, then beat 2, beat 3, beat 4, and the "and" of each beat.',
        practicePrompt:'Can I start this rhythm on the "and of 2"?'},
       {id:'p2', title:'Swinging drone improvisations',
        description:'Apply Rhythm 1 to your drone improvisation. Are you swinging? The "short-long" interpretation of eighth notes is what makes jazz feel like jazz.',
        practicePrompt:'Are my eighth notes short-long?'}],
     faq:[{question:'What makes something "swing"?',
       answer:'Swing is a rhythmic interpretation where pairs of eighth notes are played "long-short" rather than equal. The amount of swing varies by style and tempo. Listen to GL-B1-04 to hear what it sounds like.'}],
     prerequisiteExercises:['IMP-B1-03'], connectsToStages:['Stage 4'],
     connectsToListening:['GL-B1-04'], concepts:['swing','rhythm','eighth-notes']},

    {id:'IMP-B1-05', title:'ii-V-I Improvisation', subtitle:'Three Stages of Practice',
     source:'Siskind Book 1', sourceUnit:'Unit 5', sourcePages:'pp.62-63', stageAlignment:'Stage 5',
     exerciseType:'ii-V-I', difficulty:'beginner', instrumentFocus:'piano',
     setup:{leftHand:'ii-V-I voicings in left hand', keys:['C','Bb','Ab','B'],
       backingTrack:'Slow swing', tempo:'Slow enough to think', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Stage 1: Exploratory (out of time)',
        description:'Play any notes from the C major scale over the ii-V-I. Out of time — no rhythm pressure. Just listen to which notes sound good against each chord.',
        practicePrompt:'Which notes sound most tense? Which are most resolved?'},
       {id:'p2', title:'Stage 2: In time',
        description:'Now add rhythm. Keep your phrasing and listening from Stage 1, but lock to a steady beat. Use Rhythms 1 and 2 from Unit 4.',
        practicePrompt:'Am I playing rhythmically without losing the melodic thinking?'},
       {id:'p3', title:'Stage 3: Over the full form',
        description:'Improvise over a complete tune (32 bars AABA or 12-bar blues). Apply all the improvisation prompts from Units 1-4 simultaneously.',
        practicePrompt:'Am I tracking the form while improvising?'}],
     faq:[{question:'I keep getting lost in the form. What do I do?',
       answer:'Stop and restart. Getting lost is normal. Say "I\'m on bar 17" to yourself and keep going. Monk said "make a mess, then clean it up."'}],
     prerequisiteExercises:['IMP-B1-04'], connectsToStages:['Stage 5'],
     connectsToListening:['GL-B1-05'], concepts:['ii-V-I','improvisation','form']},

    {id:'IMP-B1-06A', title:'Building Rhythmic Vocabulary 2', subtitle:null,
     source:'Siskind Book 1', sourceUnit:'Unit 6', sourcePages:'pp.81-82', stageAlignment:'Stage 6',
     exerciseType:'rhythm', difficulty:'beginner', instrumentFocus:'piano',
     setup:{leftHand:'Shell voicings or low fifth', keys:['F','Eb','G'],
       backingTrack:'Medium swing', tempo:'Medium swing', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Rhythm 2: quarter + eighth mix',
        description:'Siskind\'s Rhythm 2 mixes quarter notes and eighth notes. Practice starting it on different beats until it feels natural starting anywhere in the bar.',
        practicePrompt:'Can I start Rhythm 2 on beat 3?'},
       {id:'p2', title:'Alternating Rhythms 1 and 2',
        description:'Play 2 bars of Rhythm 1, then 2 bars of Rhythm 2. Then try alternating every bar. Then combine them freely.',
        practicePrompt:'Am I alternating intentionally or accidentally?'}],
     faq:[],
     prerequisiteExercises:['IMP-B1-05'], connectsToStages:['Stage 6'],
     connectsToListening:['GL-B1-06'], concepts:['rhythm','vocabulary','swing']},

    {id:'IMP-B1-06B', title:'Arpeggios (3-5-7-9)', subtitle:null,
     source:'Siskind Book 1', sourceUnit:'Unit 6', sourcePages:'pp.82-83', stageAlignment:'Stage 6',
     exerciseType:'ii-V-I', difficulty:'beginner', instrumentFocus:'piano',
     setup:{leftHand:'ii-V-I voicings', keys:['F','Eb','G'],
       backingTrack:'Slow swing', tempo:'Slow swing', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'3-5-7-9 arpeggios over ii-V-I',
        description:'Play arpeggios starting from the third, fifth, seventh, and ninth of each chord. Land on the next chord\'s third at the downbeat.',
        practicePrompt:'Where does my arpeggio land at the bar line?'},
       {id:'p2', title:'Replace arpeggios gradually with scalar improvisation',
        description:'Start with pure arpeggios. Then add scale notes between the chord tones. Eventually the arpeggios are just the framework and the scale fills the space.',
        practicePrompt:'Can I fill in the gap between the fifth and the seventh with a scale run?'}],
     faq:[{question:'Why 3-5-7-9 and not 1-3-5-7?',
       answer:'The root is always the bass player\'s note. Starting on the third gives your right hand a more interesting entry point and implies the chord more clearly than starting on the root.'}],
     prerequisiteExercises:['IMP-B1-05'], connectsToStages:['Stage 6'],
     connectsToListening:['GL-B1-06'], concepts:['arpeggios','chord-tones','voice-leading']},

    {id:'IMP-B1-07', title:'Blues Scale Improvisation', subtitle:null,
     source:'Siskind Book 1', sourceUnit:'Unit 7', sourcePages:'p.113', stageAlignment:'Stage 7',
     exerciseType:'blues', difficulty:'beginner', instrumentFocus:'piano',
     setup:{leftHand:'Blues form voicings, bass in two', keys:['C','F','Bb'],
       backingTrack:'Slow blues', tempo:'Slow blues', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Blues scale over the entire blues form',
        description:'The blues scale works over all three chords of the blues (I, IV, V) in the tonic key. You do not need to change scales for each chord.',
        practicePrompt:'Am I staying in the C blues scale through the IV chord?'},
       {id:'p2', title:'AAB blues structure in your phrasing',
        description:'Blues lyrics follow an AAB phrase structure: say something, repeat it, then resolve it. Try applying this to your melodic phrases.',
        practicePrompt:'Can I phrase like a blues singer: A phrase, same A phrase, B resolution?'},
       {id:'p3', title:'Mixing arpeggios and blues scale',
        description:'The blues scale and chord arpeggios are not separate — they overlap. Mix them freely. The arpeggios give you direction; the blues scale gives you character.',
        practicePrompt:'Am I using any arpeggio notes mixed in with the blues scale?'}],
     faq:[{question:'When should I use the blues scale vs. the major scale?',
       answer:'The blues scale is more idiomatic for the blues. The major scale gives you more variety and a less predictable sound. Professionals mix them constantly.'}],
     prerequisiteExercises:['IMP-B1-06A','IMP-B1-06B'], connectsToStages:['Stage 7'],
     connectsToListening:['GL-B1-07'], concepts:['blues-scale','blues-form','phrasing']},

    {id:'IMP-B1-08', title:'Call-and-Response Phrasing', subtitle:null,
     source:'Siskind Book 1', sourceUnit:'Unit 8', sourcePages:'p.113', stageAlignment:'Stage 8',
     exerciseType:'phrasing', difficulty:'intermediate', instrumentFocus:'piano',
     setup:{leftHand:'Shell voicings or blues voicings', keys:['varies'],
       backingTrack:'Slow to medium swing', tempo:'Medium swing', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Play One Rest One',
        description:'Play one bar of improvisation, rest for one bar. The rest is as important as the note — it is what separates a phrase from a stream of sound.',
        practicePrompt:'Am I actually resting — hand off the piano — for the full bar?'},
       {id:'p2', title:'Play Two Rest Two',
        description:'Play two bars, rest two bars. Longer phrases with longer space. Notice how the space changes the feeling.',
        practicePrompt:'Does the response phrase answer the call?'}],
     faq:[{question:'What should I do during the rest?',
       answer:'Listen! Listen to the bass and drums. Think about what you might say next. Siskind says rests are where you plan your next phrase.'}],
     prerequisiteExercises:['IMP-B1-07'], connectsToStages:['Stage 8'],
     connectsToListening:['GL-B1-08'], concepts:['call-and-response','phrasing','space']},

    {id:'IMP-B1-09', title:'Play One Rest One / Play Two Rest Two', subtitle:'Extended Phrasing Variations',
     source:'Siskind Book 1', sourceUnit:'Unit 9', sourcePages:'p.150', stageAlignment:'Stage 9',
     exerciseType:'phrasing', difficulty:'intermediate', instrumentFocus:'piano',
     setup:{leftHand:'Shell voicings', keys:['G','A','Bb'],
       backingTrack:'Medium swing', tempo:'Medium swing', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Creating AAB blues through phrasing',
        description:'Apply Play One Rest One to a 12-bar blues: bar 1-4 is the A phrase, bars 5-8 are the repeat (same phrase on IV chord), bars 9-12 are the B phrase (resolution).',
        practicePrompt:'Does my B phrase resolve the tension of the A phrase?'},
       {id:'p2', title:'Mixing scales and arpeggios',
        description:'Apply all previous technique — blues scale, chord arpeggios, grace notes, sequences — within the Play One Rest One format.',
        practicePrompt:'Am I using at least three different techniques in this chorus?'}],
     faq:[],
     prerequisiteExercises:['IMP-B1-08'], connectsToStages:['Stage 9'],
     connectsToListening:['GL-B1-09'], concepts:['phrasing','form','blues']},

    {id:'IMP-B1-10', title:'Play What You Sing', subtitle:'Inner Ear Connection',
     source:'Siskind Book 1', sourceUnit:'Unit 10', sourcePages:'pp.151-152', stageAlignment:'Stage 10',
     exerciseType:'ear', difficulty:'intermediate', instrumentFocus:'piano',
     setup:{leftHand:'ii-V-I voicings', keys:['C','F','Eb'],
       backingTrack:null, tempo:'Slow, out of time to start', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Sing a phrase, then play it',
        description:'Sing or hum a short phrase. Then find it on the piano. Don\'t think about what scale it uses — just find the sounds you just made.',
        practicePrompt:'Can I find the first three notes I just sang?'},
       {id:'p2', title:'Build the connection gradually',
        description:'Start with two-note phrases. Graduate to three notes, four notes, five notes. The goal is for your inner ear and your hands to trust each other.',
        practicePrompt:'Did I play what I intended to sing, or did my hands decide?'}],
     faq:[{question:'What if I can\'t sing?',
       answer:'This is not a singing exercise. Even a tuneless hum counts — the goal is to have a sound in your mind before you play it. Siskind says: "If you can think it, you can sing it. If you can sing it, you can play it."'}],
     prerequisiteExercises:['IMP-B1-09'], connectsToStages:['Stage 10'],
     connectsToListening:['GL-B1-10'], concepts:['inner-ear','audiation','connection']},

    {id:'IMP-B1-11', title:'Neighbor Tones', subtitle:'Chromatic Enclosures',
     source:'Siskind Book 1', sourceUnit:'Unit 11', sourcePages:'p.165', stageAlignment:'Stage 11',
     exerciseType:'ii-V-I', difficulty:'intermediate', instrumentFocus:'piano',
     setup:{leftHand:'ii-V-I voicings', keys:['varies'],
       backingTrack:'Medium swing', tempo:'Medium swing', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Lower chromatic neighbor tones',
        description:'Approach a chord tone from a half step below. The note below is the neighbor; the chord tone is the target. This creates a brief tension that resolves on the chord tone.',
        practicePrompt:'Am I resolving to the chord tone on the beat, or is the neighbor tone landing on the beat?'},
       {id:'p2', title:'Chromatic enclosures',
        description:'Enclose a chord tone by approaching from above AND below. Play: one step above the target → one step below the target → the target. A two-note approach from both sides.',
        practicePrompt:'Can I enclose the third of the chord with a chromatic enclosure?'}],
     faq:[{question:'Aren\'t these "wrong" notes?',
       answer:'They are non-chord tones, which means they create tension. That tension is what makes resolution satisfying. All strong melodies use non-chord tones to create forward motion.'}],
     prerequisiteExercises:['IMP-B1-10'], connectsToStages:['Stage 11'],
     connectsToListening:['GL-B1-11'], concepts:['non-chord-tones','chromatic','approach-notes']},

    {id:'IMP-B1-12', title:'Improvising with Altered Dominants', subtitle:'Four-Step Practice Process',
     source:'Siskind Book 1', sourceUnit:'Unit 12', sourcePages:'pp.183-184', stageAlignment:'Stage 12',
     exerciseType:'ii-V-I', difficulty:'intermediate', instrumentFocus:'piano',
     setup:{leftHand:'Altered dominant voicings', keys:['varies'],
       backingTrack:'Medium swing', tempo:'Medium swing', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Step 1: Explore the scale out of time',
        description:'Play each new scale (octatonic, whole-tone, altered, lydian dominant) slowly, out of time. Listen to its sound. What does it want to resolve to?',
        practicePrompt:'What does this scale sound like? What does it want to do?'},
       {id:'p2', title:'Step 2: Apply to one chord type at a time',
        description:'Practice each scale over only the dominant chord in a ii-V-I. Don\'t mix scales yet — master one before adding another.',
        practicePrompt:'Am I staying in this one scale for the whole dominant chord?'},
       {id:'p3', title:'Steps 3-4: Mix and improvise freely',
        description:'Try mixing the altered dominant vocabulary with the regular chord-scale material. Step 4 is free improvisation over a complete tune using all available vocabulary.',
        practicePrompt:'Am I choosing scales deliberately or randomly?'}],
     faq:[{question:'Which altered scale should I start with?',
       answer:'Siskind recommends the octatonic (diminished) scale first. It has a strong symmetrical sound and the alternating half-whole pattern is easy to remember.'}],
     prerequisiteExercises:['IMP-B1-11'], connectsToStages:['Stage 12'],
     connectsToListening:['GL-B1-12'], concepts:['altered-dominants','scale-choice','advanced-improv']},

    /* BOOK 2 */
    {id:'IMP-B2-01', title:'Targeting Downbeats', subtitle:null,
     source:'Siskind Book 2', sourceUnit:'Unit 1', sourcePages:'pp.8-9', stageAlignment:'B2-Stage 1',
     exerciseType:'ii-V-I', difficulty:'intermediate', instrumentFocus:'piano',
     setup:{leftHand:'ii-V-I voicings', keys:['C','F','Bb','Eb','Ab','Db','Gb','B','E','A','D','G'],
       backingTrack:'Medium swing', tempo:'Medium swing', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Half-step lead-ins to the 3rd on downbeats',
        description:'Target the third of each chord on the downbeat of the measure. Approach it from a half step below. This creates a sense of arrival that professional improvisers use constantly.',
        practicePrompt:'Is my target note the third? Is it landing on beat 1?'},
       {id:'p2', title:'Fill in with improvisation',
        description:'Once you can reliably target the third, fill in the space between downbeats with improvised material. The target is the landmark; everything else connects to it.',
        practicePrompt:'Does my improvised line connect to the target note?'}],
     faq:[{question:'Why target the third?',
       answer:'The third defines the chord quality (major vs minor). A line that lands on the third is always "in" — it communicates the harmony even without a left-hand chord.'}],
     prerequisiteExercises:['IMP-B1-12'], connectsToStages:['B2-Stage 1'],
     connectsToListening:['GL-B2-01'], concepts:['targeting','downbeats','guide-tones']},

    {id:'IMP-B2-02', title:'COREA Process — Rhythmic Concepts', subtitle:null,
     source:'Siskind Book 2', sourceUnit:'Unit 2', sourcePages:'pp.35-37', stageAlignment:'B2-Stage 2',
     exerciseType:'COREA', difficulty:'intermediate', instrumentFocus:'piano',
     setup:{leftHand:'Comp as needed', keys:['all twelve keys'],
       backingTrack:'Standard tune of your choice', tempo:'As notated', timerMinutes:15},
     pointsOfFocus:[
       {id:'p1', title:'C — Extract a Concept from a transcribed solo',
        description:'Choose a rhythm from Keith Jarrett\'s "Bye Bye Blackbird" (GL-B2-02): eighth note on beats 2 and 4, followed by a dotted quarter. This is your concept.',
        practicePrompt:'What is the exact rhythmic figure I am extracting?'},
       {id:'p2', title:'O — Practice the concept Over a static progression',
        description:'Apply the rhythm over a drone, a ii-V-I vamp, or a I-vi-ii-V. Repeat it relentlessly until it is automatic.',
        practicePrompt:'Am I using this rhythm every 1-2 bars?'},
       {id:'p3', title:'R/E/A — Relentlessly, Elegantly, Ask "what if"',
        description:'R: Use the concept on every phrase of a complete standard for 10-15 minutes. E: Scale back — use it only every 8-16 measures. A: Ask "what if I used it in a different key?" or "what if I inverted the rhythm?"',
        practicePrompt:'Have I used this concept elegantly — with moderation?'}],
     faq:[{question:'Do I always start with Keith Jarrett\'s rhythm?',
       answer:'No — Jarrett is Siskind\'s first worked example. The COREA process applies to any transcribed concept: rhythmic, harmonic, gestural, or developmental.'}],
     prerequisiteExercises:['IMP-B2-01'], connectsToStages:['B2-Stage 2'],
     connectsToListening:['GL-B2-02'], concepts:['COREA','transcription','concept-extraction']},

    {id:'IMP-B2-03', title:'Scale Game 1', subtitle:'Continuous Eighth Notes',
     source:'Siskind Book 2', sourceUnit:'Unit 3', sourcePages:'p.41', stageAlignment:'B2-Stage 3',
     exerciseType:'scale-game', difficulty:'intermediate', instrumentFocus:'piano',
     setup:{leftHand:'Shell voicings', keys:['one mode at a time'],
       backingTrack:null, tempo:'Steady quarter note pulse', timerMinutes:2},
     pointsOfFocus:[
       {id:'p1', title:'Consistent eighth notes for 1 minute',
        description:'Play continuous eighth notes in a single mode for one minute without stopping. No scales-up-and-down — vary your hand position constantly. The rule: never repeat a note.',
        practicePrompt:'Did I go more than 4 notes in the same direction?'},
       {id:'p2', title:'Vary hand position',
        description:'Start in thumb position, then cross over, then spread out, then come back. The goal is fluency in the entire range of the mode, not just one position.',
        practicePrompt:'How many different register areas did I visit in this 1-minute exercise?'}],
     faq:[{question:'Why no scales up and down?',
       answer:'A scale played up and down is a drill, not music. The Scale Game teaches you to navigate a mode the way you navigate a room — moving freely, not just back and forth.'}],
     prerequisiteExercises:['IMP-B2-02'], connectsToStages:['B2-Stage 3'],
     connectsToListening:['GL-B2-03'], concepts:['scales','eighth-notes','fluency']},

    {id:'IMP-B2-04', title:'Scale Game 2', subtitle:'With Scale Patterns',
     source:'Siskind Book 2', sourceUnit:'Unit 4', sourcePages:'p.75', stageAlignment:'B2-Stage 4',
     exerciseType:'scale-game', difficulty:'intermediate', instrumentFocus:'piano',
     setup:{leftHand:'Shell voicings', keys:['random — choose daily'],
       backingTrack:null, tempo:'Steady pulse', timerMinutes:2},
     pointsOfFocus:[
       {id:'p1', title:'Scale Game 1 with patterns',
        description:'Same rules as Scale Game 1 but now incorporate scale patterns (1-2-3-1, 1-2-3-4-5-1, etc.). The patterns should feel like natural language, not mechanical exercises.',
        practicePrompt:'Does the pattern feel musical or mechanical?'},
       {id:'p2', title:'Start on random notes and random scales',
        description:'Choose your starting note by putting your finger on a random key. Choose your scale by picking a number and counting modes. This prevents you from having a "comfortable" scale.',
        practicePrompt:'Am I choosing randomly, or is the same scale coming up too often?'}],
     faq:[],
     prerequisiteExercises:['IMP-B2-03'], connectsToStages:['B2-Stage 4'],
     connectsToListening:['GL-B2-04'], concepts:['scales','patterns','randomization']},

    {id:'IMP-B2-05', title:'Targeting Guidetone Lines', subtitle:null,
     source:'Siskind Book 2', sourceUnit:'Unit 5', sourcePages:'pp.78-80', stageAlignment:'B2-Stage 5',
     exerciseType:'ii-V-I', difficulty:'intermediate', instrumentFocus:'piano',
     setup:{leftHand:'ii-V-I voicings', keys:['all twelve keys'],
       backingTrack:'Medium swing', tempo:'Medium swing', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Targeting guidetones 5 and 9 on downbeats',
        description:'Target the fifth and ninth of each chord on beat 1, using chromatic half-step lead-ins. The fifth and ninth are extensions that give phrases a more sophisticated sound than the third.',
        practicePrompt:'Is my target note the fifth or ninth?'},
       {id:'p2', title:'Top and bottom note placement',
        description:'Notice where your phrase\'s highest and lowest notes fall. The top and bottom of a phrase are the most prominent — place them intentionally.',
        practicePrompt:'What is the highest note in this phrase, and is it where I want it?'}],
     faq:[{question:'Should I mix targeting the 3rd (Unit 1) with targeting the 5th and 9th?',
       answer:'Yes. Siskind wants you to be able to target any chord tone. Mix them as you practice — the variety is the point.'}],
     prerequisiteExercises:['IMP-B2-04'], connectsToStages:['B2-Stage 5'],
     connectsToListening:['GL-B2-05'], concepts:['guide-tones','targeting','extensions']},

    {id:'IMP-B2-06', title:'COREA Process — Bebop Scale Concept', subtitle:null,
     source:'Siskind Book 2', sourceUnit:'Unit 6', sourcePages:'pp.94-95', stageAlignment:'B2-Stage 6',
     exerciseType:'COREA', difficulty:'intermediate', instrumentFocus:'piano',
     setup:{leftHand:'ii-V-I voicings', keys:['C to start, then all twelve'],
       backingTrack:'Medium swing', tempo:'Medium swing', timerMinutes:15},
     pointsOfFocus:[
       {id:'p1', title:'The major bebop scale',
        description:'The major bebop scale adds a passing tone between the fifth and sixth scale degrees (5-#5-6). This extra note puts the chord tones on the downbeats when playing continuous eighth notes.',
        practicePrompt:'Does adding the passing tone put the root on the downbeat?'},
       {id:'p2', title:'Practice out of time, then in time, then over tunes',
        description:'Step 1: play the bebop scale up and down, slowly. Step 2: improvise with it over a ii-V-I, out of time. Step 3: use it in a tune at tempo.',
        practicePrompt:'Am I landing on chord tones on the beat?'}],
     faq:[],
     prerequisiteExercises:['IMP-B2-05'], connectsToStages:['B2-Stage 6'],
     connectsToListening:['GL-B2-06'], concepts:['bebop-scale','COREA','eighth-notes']},

    {id:'IMP-B2-07', title:'Motive Development', subtitle:'The Wynton Kelly Principle',
     source:'Siskind Book 2', sourceUnit:'Unit 7', sourcePages:'p.151', stageAlignment:'B2-Stage 7',
     exerciseType:'phrasing', difficulty:'intermediate', instrumentFocus:'piano',
     setup:{leftHand:'Comp as needed', keys:['all twelve keys'],
       backingTrack:'Medium swing', tempo:'Medium swing', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Ascending/descending phrase endings (Kelly Principle)',
        description:'Wynton Kelly ends ascending phrases with a downward turn, and descending phrases with an upward turn. This prevents melodic monotony and creates natural phrase shapes.',
        practicePrompt:'Does my phrase end in the opposite direction from where it started?'},
       {id:'p2', title:'Telephone game',
        description:'The last note of one phrase becomes the first note of the next. This chains your phrases together — instead of starting each phrase from scratch, you continue from where you left off.',
        practicePrompt:'Does my next phrase start on the note where the last one ended?'}],
     faq:[{question:'What are "tails"?',
       answer:'A tail is a short figure appended to the end of a phrase — like a brief ornament or afterthought. Siskind teaches adding tails to existing phrases to create development and variety.'}],
     prerequisiteExercises:['IMP-B2-06'], connectsToStages:['B2-Stage 7'],
     connectsToListening:['GL-B2-07'], concepts:['motivic-development','phrasing','continuity']},

    {id:'IMP-B2-08', title:'Developing Beginnings and Endings', subtitle:null,
     source:'Siskind Book 2', sourceUnit:'Unit 8', sourcePages:'pp.27-28', stageAlignment:'B2-Stage 8',
     exerciseType:'phrasing', difficulty:'intermediate', instrumentFocus:'piano',
     setup:{leftHand:'Comp as needed', keys:['varies'],
       backingTrack:'Medium swing', tempo:'Medium swing', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Three types of pickup notes',
        description:'Three common pickup starting points: (1) "and of 4" — one eighth note before bar 1; (2) "and of 3" — two eighth notes before bar 1; (3) "and of 2" — three eighth notes before bar 1. Practice starting phrases at each of these points.',
        practicePrompt:'Am I starting my phrase before the bar line?'},
       {id:'p2', title:'Counteracting reactive improvisation',
        description:'Reactive improvisation means waiting to hear what you play before deciding what\'s next. Practice planning your pickup note before you start — this makes your improvisation proactive.',
        practicePrompt:'Did I know where my phrase was starting before I started it?'}],
     faq:[],
     prerequisiteExercises:['IMP-B2-07'], connectsToStages:['B2-Stage 8'],
     connectsToListening:['GL-B2-08'], concepts:['pickups','phrase-beginnings','proactive-improv']},

    {id:'IMP-B2-09', title:'Leaps and Compound Melodies', subtitle:null,
     source:'Siskind Book 2', sourceUnit:'Unit 9', sourcePages:'p.172', stageAlignment:'B2-Stage 9',
     exerciseType:'phrasing', difficulty:'intermediate', instrumentFocus:'piano',
     setup:{leftHand:'Comp as needed', keys:['varies'],
       backingTrack:'Medium swing', tempo:'Medium swing', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Two types of leaps',
        description:'Type 1: a leap to a new scale area — you jump to a new register and continue from there. Type 2: a compound melody — you leap back and forth between two independent melodic lines implied by one line.',
        practicePrompt:'Is this leap taking me to a new area, or am I implying two voices?'},
       {id:'p2', title:'Five gesture types',
        description:'Siskind identifies five gesture shapes: ascending run, descending run, arch (up then down), valley (down then up), and plateau (horizontal). Practice creating each shape intentionally.',
        practicePrompt:'What gesture type am I using right now?'}],
     faq:[],
     prerequisiteExercises:['IMP-B2-08'], connectsToStages:['B2-Stage 9'],
     connectsToListening:['GL-B2-09'], concepts:['leaps','compound-melody','gesture']},

    {id:'IMP-B2-10', title:'Bebop Scales and Closed-Position Arpeggios', subtitle:null,
     source:'Siskind Book 2', sourceUnit:'Unit 10', sourcePages:'pp.195-196', stageAlignment:'B2-Stage 10',
     exerciseType:'ii-V-I', difficulty:'advanced', instrumentFocus:'piano',
     setup:{leftHand:'Shell voicings', keys:['all twelve keys'],
       backingTrack:'Medium to up swing', tempo:'Begin slowly, work up', timerMinutes:15},
     pointsOfFocus:[
       {id:'p1', title:'Barry Harris bebop scale exercise',
        description:'Barry Harris\'s approach: practice bebop scales with their associated diminished-chord arpeggios, treating each as a connected system. The arpeggio "catches" the off-beats.',
        practicePrompt:'Am I using the diminished arpeggio on the off-beats?'},
       {id:'p2', title:'Improvise out of time, then slowly add tempo',
        description:'Step 1: Use bebop scale phrases out of time. Step 2: add a very slow click. Step 3: increase tempo. Never practice at a tempo where you are guessing.',
        practicePrompt:'Is the tempo slow enough that every note is intentional?'}],
     faq:[],
     prerequisiteExercises:['IMP-B2-09'], connectsToStages:['B2-Stage 10'],
     connectsToListening:['GL-B2-10'], concepts:['bebop-scale','arpeggios','barry-harris']},

    {id:'IMP-B2-11', title:'Rhythmic Circuits — Double Time', subtitle:null,
     source:'Siskind Book 2', sourceUnit:'Unit 11', sourcePages:'pp.219-220', stageAlignment:'B2-Stage 11',
     exerciseType:'rhythm', difficulty:'advanced', instrumentFocus:'piano',
     setup:{leftHand:'Comp as needed', keys:['varies'],
       backingTrack:'Medium swing', tempo:'Medium swing', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Shifting between rhythmic note values',
        description:'Practice circuits: 4 bars of eighth notes → 4 bars of eighth-note triplets → 4 bars of sixteenth notes → back to eighth notes. The beat does not change; the note density does.',
        practicePrompt:'Did the tempo stay constant when I shifted note values?'},
       {id:'p2', title:'Create custom rhythmic circuits',
        description:'Design your own circuit: e.g., 2 bars eighth notes → 2 bars quarter notes → 1 bar silence → 2 bars sixteenth notes. Practice until the shifts are smooth.',
        practicePrompt:'Do the transitions between note values feel musical?'}],
     faq:[{question:'What is double time?',
       answer:'Double time means playing melodic lines in sixteenth notes (double the speed of eighth notes) while the rhythm section remains at the original tempo. The feel doubles; the pulse does not.'}],
     prerequisiteExercises:['IMP-B2-10'], connectsToStages:['B2-Stage 11'],
     connectsToListening:['GL-B2-11'], concepts:['double-time','rhythmic-circuits','note-values']},

    {id:'IMP-B2-12', title:'Self-Transcription Analysis', subtitle:'The 17-Question Questionnaire',
     source:'Siskind Book 2', sourceUnit:'Unit 12', sourcePages:'pp.253-256', stageAlignment:'B2-Stage 12',
     exerciseType:'ear', difficulty:'advanced', instrumentFocus:'piano',
     setup:{leftHand:'N/A — recording exercise', keys:['any key'],
       backingTrack:'Backing track of your choice', tempo:'Any tempo', timerMinutes:20},
     pointsOfFocus:[
       {id:'p1', title:'Record, transcribe, analyze',
        description:'Step 1: Record yourself improvising for 2-4 choruses. Step 2: Transcribe it. Step 3: Apply the 17-question questionnaire. Step 4: Diagnose your strengths and weaknesses.',
        practicePrompt:'What is the one thing I do most? What is the one thing I never do?'},
       {id:'p2', title:'The questionnaire reveals your habits',
        description:'The questions make visible what was invisible. Most students are shocked by their self-transcription. That shock is information — it tells you exactly what to practice.',
        practicePrompt:'Based on the questionnaire, what should I add to tomorrow\'s practice?'}],
     faq:[{question:'Do I have to transcribe note-for-note?',
       answer:'Yes. Approximation defeats the purpose. The act of writing each note makes you confront your habits in a way that listening alone does not.'}],
     prerequisiteExercises:['IMP-B2-11'], connectsToStages:['B2-Stage 12'],
     connectsToListening:['GL-B2-12'], concepts:['transcription','self-analysis','diagnosis']},

    /* BOOK 3 */
    {id:'IMP-B3-01', title:'Modal Drone Improvisation', subtitle:null,
     source:'Siskind Book 3', sourceUnit:'Unit 1', sourcePages:'pp.9-10', stageAlignment:'B3-Stage 1',
     exerciseType:'drone', difficulty:'advanced', instrumentFocus:'piano',
     setup:{leftHand:'Drone — root and fifth in low register', keys:['all seven modes of C major, then other keys'],
       backingTrack:null, tempo:'Out of time', timerMinutes:5},
     pointsOfFocus:[
       {id:'p1', title:'Drone over each mode of the major scale',
        description:'Start with Dorian (D-A low fifth). Improvise freely. Then move to Phrygian (E-B). Then Lydian (F-C). Notice how each mode has a different character.',
        practicePrompt:'What is the most characteristic pitch of this mode?'},
       {id:'p2', title:'Listen to the character of each pitch against the bass',
        description:'Every note of the mode sounds different against the drone. Some are stable (1, 5), some are active (7, 2, 4), some are ambiguous (3, 6). Name the feeling of each before moving.',
        practicePrompt:'Which notes want to move? Which are stable?'}],
     faq:[{question:'How is this different from Book 1 drone improvisation?',
       answer:'Book 1 used only C major. Book 3 uses all seven modes, which means the character of "home" changes. You are learning to hear the modal flavor, not just the notes.'}],
     prerequisiteExercises:['IMP-B2-12'], connectsToStages:['B3-Stage 1'],
     connectsToListening:['GL-B3-01'], concepts:['modes','modal-character','listening']},

    {id:'IMP-B3-02', title:'Practicing Melodic Gestures', subtitle:null,
     source:'Siskind Book 3', sourceUnit:'Unit 2', sourcePages:'p.32', stageAlignment:'B3-Stage 2',
     exerciseType:'modal', difficulty:'advanced', instrumentFocus:'piano',
     setup:{leftHand:'Modal drone or static chord', keys:['D Dorian to start'],
       backingTrack:null, tempo:'Out of time', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Miles Davis "So What" gestures with different notes',
        description:'Take the rhythmic shape and direction of a Miles Davis phrase from "So What." Now play it with completely different notes. Keep the rhythm and the contour; change every note.',
        practicePrompt:'Am I keeping the rhythm and direction while changing the pitches?'},
       {id:'p2', title:'Shape and rhythm, not specific pitches',
        description:'A melodic gesture is its rhythm + its contour. The notes fill it in. Practice creating gestures that are identifiable by shape alone.',
        practicePrompt:'If I hummed this phrase, would someone recognize it from the rhythm and shape alone?'}],
     faq:[],
     prerequisiteExercises:['IMP-B3-01'], connectsToStages:['B3-Stage 2'],
     connectsToListening:['GL-B3-02'], concepts:['gesture','shape','rhythm']},

    {id:'IMP-B3-03', title:'Memory Games', subtitle:null,
     source:'Siskind Book 3', sourceUnit:'Unit 3', sourcePages:'pp.47-48', stageAlignment:'B3-Stage 3',
     exerciseType:'modal', difficulty:'advanced', instrumentFocus:'piano',
     setup:{leftHand:'Modal drone or comp', keys:['any modal context'],
       backingTrack:'Medium tempo', tempo:'Medium', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Remember your first idea and return to it',
        description:'Play an opening phrase. Improvise freely for 8 or 16 bars. Then return to the exact opening phrase — as close to note-for-note as you can. Create a frame.',
        practicePrompt:'Can I return to the opening phrase at bar 33?'},
       {id:'p2', title:'Alternate between two themes',
        description:'Create Theme A. Create Theme B. Alternate between them every 8 or 16 bars. The contrast between the themes is what makes the solo a narrative.',
        practicePrompt:'Is Theme B clearly contrasting with Theme A?'}],
     faq:[],
     prerequisiteExercises:['IMP-B3-02'], connectsToStages:['B3-Stage 3'],
     connectsToListening:['GL-B3-03'], concepts:['memory','thematic-development','form']},

    {id:'IMP-B3-04', title:'Shifting Upper Structures', subtitle:null,
     source:'Siskind Book 3', sourceUnit:'Unit 4', sourcePages:'p.68', stageAlignment:'B3-Stage 4',
     exerciseType:'modal', difficulty:'advanced', instrumentFocus:'piano',
     setup:{leftHand:'Static modal chord', keys:['C Dorian to start'],
       backingTrack:null, tempo:'Medium', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Arpeggiate different upper structures every 2 beats',
        description:'Choose an upper structure triad (a triad built on a non-root note of the mode). Arpeggiate it for 2 beats. Then connect by step to the next upper structure triad. Stay within the mode.',
        practicePrompt:'Am I connecting by step between upper structures?'},
       {id:'p2', title:'Omit notes for rests',
        description:'An upper structure exercise does not have to be continuous. Omit any notes to create rests, which turn the exercise into a phrase.',
        practicePrompt:'Did I add any rests?'}],
     faq:[],
     prerequisiteExercises:['IMP-B3-03'], connectsToStages:['B3-Stage 4'],
     connectsToListening:['GL-B3-04'], concepts:['upper-structures','triads','modal']},

    {id:'IMP-B3-05', title:'Shifting Mindset', subtitle:'3→4→5→6 Note Groups',
     source:'Siskind Book 3', sourceUnit:'Unit 5', sourcePages:'pp.83-84', stageAlignment:'B3-Stage 5',
     exerciseType:'modal', difficulty:'advanced', instrumentFocus:'piano',
     setup:{leftHand:'Static modal chord', keys:['D Dorian'],
       backingTrack:null, tempo:'Medium', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'32-measure cycle through four vocabularies',
        description:'Bars 1-8: upper structures. Bars 9-16: quadratonics (four-note groups). Bars 17-24: pentatonics. Bars 25-32: triad pairs. The shift in vocabulary shifts your mindset about the same harmony.',
        practicePrompt:'Am I shifting at bar 9? Bar 17? Bar 25?'},
       {id:'p2', title:'Each vocabulary is a different lens',
        description:'Upper structures, quadratonics, pentatonics, and triad pairs are not just different notes — they are different ways of thinking about the same mode. Shifting between them teaches flexibility.',
        practicePrompt:'Did I change my vocabulary at the correct bar?'}],
     faq:[],
     prerequisiteExercises:['IMP-B3-04'], connectsToStages:['B3-Stage 5'],
     connectsToListening:['GL-B3-05'], concepts:['mindset','pentatonics','triad-pairs','quadratonics']},

    {id:'IMP-B3-06', title:'Tonicization Practice', subtitle:null,
     source:'Siskind Book 3', sourceUnit:'Unit 6', sourcePages:'p.128', stageAlignment:'B3-Stage 6',
     exerciseType:'modal', difficulty:'advanced', instrumentFocus:'piano',
     setup:{leftHand:'Ascending half-step chord progression', keys:['varies'],
       backingTrack:null, tempo:'Slow', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Use tonicization every 4 measures',
        description:'Every 4 bars, play a figure that reaffirms the current chord center or targets the next chord as though it were a new tonic. A ii-V-I leading into a new chord is one approach.',
        practicePrompt:'Does my tonicization feel like it is arriving somewhere?'},
       {id:'p2', title:'Practice over ascending half-step progression',
        description:'Siskind uses a progression that ascends by half steps (CΔ7 → DbΔ7 → DΔ7…) as the practice vehicle. Each new chord requires a new tonicization strategy.',
        practicePrompt:'Am I adjusting my vocabulary for each new tonal center?'}],
     faq:[],
     prerequisiteExercises:['IMP-B3-05'], connectsToStages:['B3-Stage 6'],
     connectsToListening:['GL-B3-06'], concepts:['tonicization','tension-release','tonal-targets']},

    {id:'IMP-B3-07', title:'Related Major and Melodic Minor Modes', subtitle:null,
     source:'Siskind Book 3', sourceUnit:'Unit 7', sourcePages:'pp.129-130', stageAlignment:'B3-Stage 7',
     exerciseType:'modal', difficulty:'advanced', instrumentFocus:'piano',
     setup:{leftHand:'Modal chord', keys:['pairs: D Dorian / D Melodic Minor, etc.'],
       backingTrack:null, tempo:'Medium', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'2 measures in major mode, 2 in parallel melodic minor',
        description:'Play 2 bars over D Dorian. Then play 2 bars over D Melodic Minor (same root, but raised sixth and seventh). The shift changes the color of the mode without changing the root.',
        practicePrompt:'Did I raise the sixth and seventh when switching to melodic minor?'},
       {id:'p2', title:'Dorian/Melodic Minor and Lydian/Lydian Augmented pairs',
        description:'Dorian pairs with Melodic Minor. Lydian pairs with Lydian Augmented (#5 instead of 5). Each pair shares a root but has a different characteristic note.',
        practicePrompt:'What is the characteristic note that distinguishes this pair?'}],
     faq:[],
     prerequisiteExercises:['IMP-B3-06'], connectsToStages:['B3-Stage 7'],
     connectsToListening:['GL-B3-07'], concepts:['melodic-minor','modal-pairs','color-change']},

    {id:'IMP-B3-08', title:'Practicing Sidestepping', subtitle:null,
     source:'Siskind Book 3', sourceUnit:'Unit 8', sourcePages:'p.157', stageAlignment:'B3-Stage 8',
     exerciseType:'modal', difficulty:'advanced', instrumentFocus:'piano',
     setup:{leftHand:'Ascending maj7(#11) chords', keys:['varies'],
       backingTrack:null, tempo:'Slow', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Sidestep from a half step above every 4 measures',
        description:'Every 4 bars, shift your entire modal vocabulary up a half step. Play 4 bars "in," then 4 bars a half step above (outside), then return. The outside bars create tension that resolves when you return.',
        practicePrompt:'Did I shift exactly one half step? Did I return cleanly?'},
       {id:'p2', title:'Practice over ascending maj7(#11) progression',
        description:'Siskind uses ascending major seventh sharp eleven chords as the practice vehicle. Each chord is already harmonically ambiguous, making the sidestep easier to incorporate.',
        practicePrompt:'Does my return to "in" feel like a resolution?'}],
     faq:[{question:'Won\'t sidestepping sound wrong?',
       answer:'It sounds wrong and then resolves. The tension is intentional. Sidestepping is not playing wrong notes — it is deliberately creating harmonic tension that you then resolve.'}],
     prerequisiteExercises:['IMP-B3-07'], connectsToStages:['B3-Stage 8'],
     connectsToListening:['GL-B3-08'], concepts:['sidestepping','outside-playing','tension-resolution']},

    {id:'IMP-B3-09', title:'Practicing Modal Interchange', subtitle:null,
     source:'Siskind Book 3', sourceUnit:'Unit 9', sourcePages:'pp.181-182', stageAlignment:'B3-Stage 9',
     exerciseType:'modal', difficulty:'advanced', instrumentFocus:'piano',
     setup:{leftHand:'Static root drone', keys:['C as root, all modes'],
       backingTrack:null, tempo:'Medium, with 3-minute timer', timerMinutes:3},
     pointsOfFocus:[
       {id:'p1', title:'3-minute timer: cycle through modes changing one note at a time',
        description:'Start with C Ionian. After 8 bars, move to C Lydian (raise the 4th). After 8 more bars, move to C Lydian Augmented (raise the 5th as well). Continue cycling, changing one note per shift.',
        practicePrompt:'Which note changed when I shifted to this mode?'},
       {id:'p2', title:'Ionian → Lydian → Lydian Augmented → and so on',
        description:'The modal interchange sequence: Ionian → Lydian → Lydian Augmented → Augmented (whole-tone) → Altered → Locrian #2 → Superlocrian. Each step adds more tension.',
        practicePrompt:'Am I noticing the increasing tension as I move through the sequence?'}],
     faq:[],
     prerequisiteExercises:['IMP-B3-08'], connectsToStages:['B3-Stage 9'],
     connectsToListening:['GL-B3-09'], concepts:['modal-interchange','modes','progressive-tension']},

    {id:'IMP-B3-10', title:'Bebop Shapes in Modal Context', subtitle:null,
     source:'Siskind Book 3', sourceUnit:'Unit 10', sourcePages:'p.207', stageAlignment:'B3-Stage 10',
     exerciseType:'modal', difficulty:'advanced', instrumentFocus:'piano',
     setup:{leftHand:'Static modal chord', keys:['any mode'],
       backingTrack:null, tempo:'Medium', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Choose a bebop tune melody; play its shape over a mode',
        description:'Take the rhythmic shape and melodic contour of a bebop melody (e.g., the first 4 bars of "Joy Spring"). Now play that shape using only the notes of a Dorian mode.',
        practicePrompt:'Am I keeping the rhythm and direction while using only modal notes?'},
       {id:'p2', title:'Add matching non-chord tones if needed',
        description:'If the bebop melody uses chromatic neighbor tones or passing tones, you can add the equivalent in the modal context — just make sure they resolve within the mode.',
        practicePrompt:'Are my non-chord tones resolving within the mode?'}],
     faq:[],
     prerequisiteExercises:['IMP-B3-09'], connectsToStages:['B3-Stage 10'],
     connectsToListening:['GL-B3-10'], concepts:['bebop-in-modal','shape-transfer','vocabulary-blend']},

    {id:'IMP-B3-11', title:'Coltrane Changes', subtitle:null,
     source:'Siskind Book 3', sourceUnit:'Unit 11', sourcePages:'p.237', stageAlignment:'B3-Stage 11',
     exerciseType:'ii-V-I', difficulty:'advanced', instrumentFocus:'piano',
     setup:{leftHand:'Coltrane changes voicings', keys:['C → E → Ab → C and all transpositions'],
       backingTrack:'Backing track with Coltrane changes', tempo:'Medium', timerMinutes:15},
     pointsOfFocus:[
       {id:'p1', title:'Arpeggios (1-2-3-5 and 3-5-7-9) over Coltrane changes',
        description:'Coltrane changes divide the octave into three equal parts (major thirds). Practice arpeggios that target each key center: C major → E major → Ab major → C major.',
        practicePrompt:'Am I landing on a chord tone at each tonal center?'},
       {id:'p2', title:'Guidetone lines and continuous scales',
        description:'Apply the guidetone targeting and continuous scale vocabulary from Book 2 to Coltrane changes. The changes move fast, so lines must be smooth.',
        practicePrompt:'Does my line connect smoothly from one tonal center to the next?'}],
     faq:[{question:'Where do Coltrane changes appear?',
       answer:'"Giant Steps," "Countdown," and the bridge of "Body and Soul" (as reharmonized by Coltrane). They also appear as substitutions in standards.'}],
     prerequisiteExercises:['IMP-B3-10'], connectsToStages:['B3-Stage 11'],
     connectsToListening:['GL-B3-11'], concepts:['coltrane-changes','equal-division','advanced-harmony']},

    {id:'IMP-B3-12', title:'Complex Rhythms and Free Improvisation', subtitle:null,
     source:'Siskind Book 3', sourceUnit:'Unit 12', sourcePages:'pp.273-277', stageAlignment:'B3-Stage 12',
     exerciseType:'free', difficulty:'advanced', instrumentFocus:'piano',
     setup:{leftHand:'None — free', keys:['none specified'],
       backingTrack:'Alone or with bandmates', tempo:'Free', timerMinutes:5},
     pointsOfFocus:[
       {id:'p1', title:'Mix rhythmic units and groupings',
        description:'Use a rhythmic circuit that includes: quarter notes, eighth notes, eighth-note triplets, sixteenth notes, and long notes. Mix them freely — don\'t plan which comes next.',
        practicePrompt:'Am I using rhythmic units that are grouped in unexpected ways?'},
       {id:'p2', title:'Free improvisation for 5 minutes daily',
        description:'No chord, no key, no form. Just sound, gesture, and response. Remove all obligations — no "should," no "wrong." Seek legitimate spontaneity.',
        practicePrompt:'Am I responding to what I just heard, or planning what I will play next?'},
       {id:'p3', title:'Non-musical inspiration',
        description:'Tell a story, paint a picture, imitate a dancer, capture a film mood. Seek non-musical starting points for your improvisation — they unlock vocabulary you wouldn\'t find by thinking harmonically.',
        practicePrompt:'What non-musical idea am I using as my starting point?'}],
     faq:[{question:'What if free improvisation sounds bad?',
       answer:'Siskind says: "You have to make a mess first in order to clean it up." The goal is not to sound good immediately — it is to develop a habit of spontaneous response.'}],
     prerequisiteExercises:['IMP-B3-11'], connectsToStages:['B3-Stage 12'],
     connectsToListening:['GL-B3-12'], concepts:['free-improv','spontaneity','rhythm','non-musical-inspiration']},

    /* VOCAL */
    {id:'IMP-V-01', title:'Rhythmic Etude 1 — Swing', subtitle:null,
     source:'Stoloff, Scat!', sourceUnit:'pp.16-17', sourcePages:'pp.16-17', stageAlignment:'Vocal Stage 1',
     exerciseType:'scat', difficulty:'beginner', instrumentFocus:'vocal',
     setup:{leftHand:'N/A', keys:['C'], backingTrack:'Slow swing', tempo:'Slow swing', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Duple/triple syllable combinations',
        description:'Practice the etude with the written syllables: ah, ee, oo. Each syllable has a different placement in the mouth that affects the sound.',
        practicePrompt:'Am I using different vowels for different phrase shapes?'},
       {id:'p2', title:'Swing feel articulation',
        description:'Swing articulation: some notes are accented, some are "swallowed." The written etude shows which syllables to emphasize.',
        practicePrompt:'Is my delivery swinging or mechanical?'}],
     faq:[], prerequisiteExercises:[], connectsToStages:['Vocal Stage 1'],
     connectsToListening:[], concepts:['scat','rhythm','vocal-articulation']},

    {id:'IMP-V-02', title:'Rhythmic Etude 2 — Latin', subtitle:null,
     source:'Stoloff, Scat!', sourceUnit:'pp.18-19', sourcePages:'pp.18-19', stageAlignment:'Vocal Stage 2',
     exerciseType:'scat', difficulty:'beginner', instrumentFocus:'vocal',
     setup:{leftHand:'N/A', keys:['C'], backingTrack:'Latin feel', tempo:'Medium', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Latin feel scat articulation',
        description:'Latin feel uses straight eighth notes — the syllables are even, not swung. The articulation changes: more percussive consonants (d, t) rather than the smoother swing syllables.',
        practicePrompt:'Are my eighth notes even — not swung?'}],
     faq:[], prerequisiteExercises:['IMP-V-01'], connectsToStages:['Vocal Stage 2'],
     connectsToListening:['GL-B1-10'], concepts:['scat','latin','straight-eighth']},

    {id:'IMP-V-03', title:'Rhythmic Etude 3 — Mixed', subtitle:null,
     source:'Stoloff, Scat!', sourceUnit:'pp.20-21', sourcePages:'pp.20-21', stageAlignment:'Vocal Stage 3',
     exerciseType:'scat', difficulty:'beginner', instrumentFocus:'vocal',
     setup:{leftHand:'N/A', keys:['C'], backingTrack:'Swing', tempo:'Medium', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Mixed duple and triple rhythmic figures',
        description:'This etude mixes pairs and triplets of syllables — "doo-dah" and "doo-dah-dah." Practice each passage slowly before combining them.',
        practicePrompt:'Am I feeling the triplets as three notes in the space of two?'}],
     faq:[], prerequisiteExercises:['IMP-V-02'], connectsToStages:['Vocal Stage 3'],
     connectsToListening:[], concepts:['scat','mixed-rhythm','triplets']},

    {id:'IMP-V-04', title:'Rhythmic Etude 4 — Advanced', subtitle:null,
     source:'Stoloff, Scat!', sourceUnit:'pp.22-24', sourcePages:'pp.22-24', stageAlignment:'Vocal Stage 4',
     exerciseType:'scat', difficulty:'intermediate', instrumentFocus:'vocal',
     setup:{leftHand:'N/A', keys:['C'], backingTrack:'Swing', tempo:'Medium-up', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Complex rhythmic combinations',
        description:'This etude combines sixteenth-note triplets, ties across bar lines, and rests. Use a metronome and slow the tempo significantly before attempting.',
        practicePrompt:'Am I counting the subdivisions or guessing?'}],
     faq:[], prerequisiteExercises:['IMP-V-03'], connectsToStages:['Vocal Stage 4'],
     connectsToListening:[], concepts:['scat','advanced-rhythm','sixteenth-triplets']},

    {id:'IMP-V-05', title:'Scat Syllable Warm-Up', subtitle:null,
     source:'Stoloff, Scat!', sourceUnit:'p.26', sourcePages:'p.26', stageAlignment:'Vocal Stage 1',
     exerciseType:'vocal', difficulty:'beginner', instrumentFocus:'vocal',
     setup:{leftHand:'N/A', keys:['C'], backingTrack:null, tempo:'Any', timerMinutes:5},
     pointsOfFocus:[
       {id:'p1', title:'Three common vowels with consonants b, d, l, n',
        description:'Practice "bah-dee-dah," "doo-bee-dah," "la-dee-dah," "nah-dee-dah" on a simple scale or arpeggio. Each consonant creates a different attack.',
        practicePrompt:'Which consonant gives me the clearest jazz attack?'}],
     faq:[], prerequisiteExercises:[], connectsToStages:['Vocal Stage 1'],
     connectsToListening:[], concepts:['scat-syllables','warm-up','vocal']},

    {id:'IMP-V-06', title:'Traditional Diatonic Patterns', subtitle:null,
     source:'Stoloff, Scat!', sourceUnit:'pp.28-36', sourcePages:'pp.28-36', stageAlignment:'Vocal Stage 2',
     exerciseType:'vocal', difficulty:'beginner', instrumentFocus:'vocal',
     setup:{leftHand:'N/A', keys:['C, F, Bb, Eb'], backingTrack:null, tempo:'Slow', timerMinutes:15},
     pointsOfFocus:[
       {id:'p1', title:'Scalar and intervallic patterns with scat syllables',
        description:'Practice major scale patterns (1-2-3, 2-3-4, etc.) with scat syllables. Include 8th, triplet, and 16th note variations of each pattern.',
        practicePrompt:'Am I using the written syllables or reverting to la-la-la?'}],
     faq:[], prerequisiteExercises:['IMP-V-05'], connectsToStages:['Vocal Stage 2'],
     connectsToListening:[], concepts:['scat','diatonic','patterns']},

    {id:'IMP-V-07', title:'II-V Modal Jazz Patterns', subtitle:null,
     source:'Stoloff, Scat!', sourceUnit:'pp.37-41', sourcePages:'pp.37-41', stageAlignment:'Vocal Stage 3',
     exerciseType:'vocal', difficulty:'intermediate', instrumentFocus:'vocal',
     setup:{leftHand:'N/A', keys:['C Dorian / G Mixolydian'], backingTrack:'ii-V backing', tempo:'Slow to medium', timerMinutes:15},
     pointsOfFocus:[
       {id:'p1', title:'Dorian-Mixolydian patterns over ii-V',
        description:'Sing Dorian scale patterns over the ii chord and Mixolydian patterns over the V chord. The same syllable shapes can be used for both — just the notes change.',
        practicePrompt:'Am I adjusting the raised 6th and 7th when moving from Dorian to Mixolydian?'},
       {id:'p2', title:'One-measure and two-measure ii-V phrases',
        description:'Practice phrases that span one measure (quick ii-V) and phrases that span two measures (slow ii-V). The resolution on the I chord should feel inevitable.',
        practicePrompt:'Does my phrase resolve convincingly on the I chord?'}],
     faq:[], prerequisiteExercises:['IMP-V-06'], connectsToStages:['Vocal Stage 3'],
     connectsToListening:[], concepts:['scat','ii-V','modal-vocal']},

    {id:'IMP-V-08', title:'Melodic Embellishment', subtitle:null,
     source:'Stoloff, Scat!', sourceUnit:'pp.42-45', sourcePages:'pp.42-45', stageAlignment:'Vocal Stage 4',
     exerciseType:'vocal', difficulty:'intermediate', instrumentFocus:'vocal',
     setup:{leftHand:'N/A', keys:['C'], backingTrack:null, tempo:'Slow', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Triplet embellishments on beats 1 and 2',
        description:'Add triplet ornaments before landing on a note: approach from a half step above, then half step below, then the note — sung as a triplet. This is the vocal equivalent of a chromatic enclosure.',
        practicePrompt:'Is my embellishment landing on the beat, or floating over it?'},
       {id:'p2', title:'Mordant, turn, grace note, glissando for scat',
        description:'Learn each ornament separately before incorporating them in free scat. Each has a different rhythmic placement and syllabic feel.',
        practicePrompt:'Can I use a glissando from a half step below on a sustained note?'}],
     faq:[], prerequisiteExercises:['IMP-V-07'], connectsToStages:['Vocal Stage 4'],
     connectsToListening:[], concepts:['embellishment','ornaments','vocal-technique']},

    {id:'IMP-V-09', title:'4-Step Chord-Scale Approach', subtitle:null,
     source:'Stoloff, Scat!', sourceUnit:'p.56', sourcePages:'p.56', stageAlignment:'Vocal Stage 5',
     exerciseType:'vocal', difficulty:'intermediate', instrumentFocus:'vocal',
     setup:{leftHand:'N/A', keys:['C, F, Bb, Eb, Ab'], backingTrack:null, tempo:'Any', timerMinutes:15},
     pointsOfFocus:[
       {id:'p1', title:'Four steps: scale, arpeggio, patterns, free',
        description:'Step 1: sing the scale from root. Step 2: sing the arpeggio (3-5-7). Step 3: sing patterns from the scale with scat syllables. Step 4: improvise freely using those materials.',
        practicePrompt:'Can I get from Step 1 to Step 4 within 2 minutes?'}],
     faq:[], prerequisiteExercises:['IMP-V-08'], connectsToStages:['Vocal Stage 5'],
     connectsToListening:[], concepts:['scat','chord-scale','4-step']},

    {id:'IMP-V-10', title:'Solo A Cappella Technique', subtitle:null,
     source:'Stoloff, Scat!', sourceUnit:'pp.112-117', sourcePages:'pp.112-117', stageAlignment:'Vocal Stage 6',
     exerciseType:'vocal', difficulty:'advanced', instrumentFocus:'vocal',
     setup:{leftHand:'N/A', keys:['any'], backingTrack:'None', tempo:'Free', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Simulate multiple instruments with a single voice',
        description:'Use different timbres, registers, and syllables to suggest bass notes, chord comping, and melody simultaneously — all in a single vocal line.',
        practicePrompt:'Can a listener hear at least two implied voices in my a cappella performance?'}],
     faq:[], prerequisiteExercises:['IMP-V-09'], connectsToStages:['Vocal Stage 6'],
     connectsToListening:[], concepts:['a-cappella','multi-voice','vocal-texture']},

    {id:'IMP-V-11', title:'Weir: Rhythm and Syllable Drills', subtitle:null,
     source:'Weir, Fearless Vocal Improvisation', sourceUnit:'p.1', sourcePages:'p.1', stageAlignment:'Vocal Stage 1',
     exerciseType:'vocal', difficulty:'beginner', instrumentFocus:'vocal',
     setup:{leftHand:'N/A', keys:['any'], backingTrack:'Any', tempo:'Several tempos — swing and straight', timerMinutes:10},
     pointsOfFocus:[
       {id:'p1', title:'Written rhythm/syllable exercises drilled repeatedly',
        description:'Drill each exercise until the syllables become second nature — automatic enough that you can focus on the musical result rather than the notation.',
        practicePrompt:'Is this automatic yet, or am I still reading?'},
       {id:'p2', title:'Different tempos and alternating swing/straight',
        description:'Perform each exercise at a slow tempo, then medium, then fast. Then alternate between swing and straight eighth feels. The same syllables sound completely different.',
        practicePrompt:'Does the rhythm change character when I change from swing to straight?'}],
     faq:[], prerequisiteExercises:[], connectsToStages:['Vocal Stage 1'],
     connectsToListening:[], concepts:['scat','rhythm','syllables','vocal']},

    {id:'IMP-V-12', title:'Weir: Hearing the Changes', subtitle:null,
     source:'Weir, Fearless Vocal Improvisation', sourceUnit:'pp.1-2', sourcePages:'pp.1-2', stageAlignment:'Vocal Stage 2',
     exerciseType:'vocal', difficulty:'beginner', instrumentFocus:'vocal',
     setup:{leftHand:'N/A', keys:['any'], backingTrack:'Simple tune backing', tempo:'Slow', timerMinutes:15},
     pointsOfFocus:[
       {id:'p1', title:'Singing chord progressions',
        description:'Sing the root of each chord in a simple progression (I-vi-ii-V, blues) on a neutral syllable. Hear the chord quality change as you move from one root to the next.',
        practicePrompt:'Can I hear that the chord has changed before I see it in the notation?'},
       {id:'p2', title:'Process for hearing shifting key centers',
        description:'Sing the tonic of each new key center. Listen for the "arrival" feeling when a progression resolves. Build a library of "arrival feelings" for different chord types.',
        practicePrompt:'Does the arrival on the I chord feel stable?'}],
     faq:[], prerequisiteExercises:['IMP-V-11'], connectsToStages:['Vocal Stage 2'],
     connectsToListening:[], concepts:['hearing-changes','tonal-centers','vocal-ear']}
  ],

  coreaProcess:{
    title:'The COREA Process',
    source:'Siskind Book 2, Unit 2, pp.35-37',
    steps:[
      {letter:'C', word:'Concept', description:'Extract a concept from a transcribed solo — rhythmic, harmonic, gestural, or developmental.'},
      {letter:'O', word:'Over', description:'Practice improvising using that concept Over a static progression (drone, ii-V-I, I-vi-ii-V).'},
      {letter:'R', word:'Relentlessly', description:'Repeat the concept Relentlessly on a standard tune — every 2 measures, for 10-15 minutes.'},
      {letter:'E', word:'Elegantly', description:'Scale back and employ the concept Elegantly, with moderation — every 8-16 measures.'},
      {letter:'A', word:'Ask', description:'Ask yourself "what if" questions: different key? different chord type? different rhythm?'}],
    workedExample:'Miles Davis rhythm from "Bye Bye Blackbird" (GL-B2-02): eighth note on beats 2 and 4, followed by a dotted quarter note.'
  },

  selfTranscriptionQuestionnaire:{
    title:'Self-Transcription Questionnaire',
    source:'Siskind Book 2, Unit 12, pp.253-256',
    questions:[
      'Put a box around arpeggios (3+ notes with leaps). How many?',
      'Circle scales (3+ notes with steps). How many?',
      'Put a triangle around non-chord tones. How many?',
      'Are there non-chord tones that don\'t resolve? How many?',
      'How many times do you use the blues scale?',
      'How many times do you use an altered dominant scale?',
      'Do you use scale patterns from Units 1-12?',
      'Do you use leaps larger than a fifth? How many?',
      'Do you repeat yourself or use motivic development? How many times?',
      'Do you use expressive devices (grace notes, turns, octaves, double notes)?',
      'On which beat does each phrase START? (chart)',
      'On which beat does each phrase END? (chart)',
      'How many measures long is each phrase? (chart)',
      'How many measures of REST between phrases? (chart)',
      'How many bars does each phrase span? (chart)',
      'What is the span (range) of each phrase? (chart)',
      'Which rhythmic units do you use? (long notes, quarter, offbeat quarter, triplet, eighth, eighth-triplet, sixteenth)']
  },

  levineMethod:{
    title:'Practice Philosophy',
    source:'Levine, The Jazz Theory Book, Chapter 12, pp.245-256',
    principles:[
      {title:'Make Music When Practicing', description:'Even scales and exercises should be played with feeling and intensity.'},
      {title:'Practice Everything in Every Key', description:'Voicings, licks, patterns, AND tunes. The quantum leap comes when you can play all licks on any tune in any key.'},
      {title:'Practice to Your Weaknesses', description:'After a gig, think back on the shakiest parts and start your next session there.'},
      {title:'Speed Comes from Accuracy', description:'If it\'s not getting better fast, slow down. Speed comes from accuracy and relaxation.'},
      {title:'The Tactile and Visual Aspect', description:'Four parts of musical memory: Aural, Theoretical, Tactile, Visual. Piano is color-coded!'},
      {title:'Licks and Patterns', description:'Practice to get fingers, brain, and eyes in sync. They become an inner library — but don\'t use them exclusively.'},
      {title:'Transcribing', description:'"The answers to all your questions are in your living room." Learn by playing along with the record — don\'t just write it down.'},
      {title:'Play-Along Recordings', description:'Jamey Aebersold series for practicing without a band.'},
      {title:'Play Along with Real Records', description:'Get your instrument in tune with the CD and play along.'},
      {title:'Keep a Notebook', description:'Write down ideas, tunes to learn, things to practice. Brings order to the ever-lengthening list.'},
      {title:'Relax', description:'Be aware of unnecessary muscle tension. Breathe normally and deeply. Smile while you play — Billy Higgins always does!'},
      {title:'Tap that Foot', description:'Toe, heel, whole foot — whatever feels natural. Check out Monk on "Straight No Chaser."'},
      {title:'Cultivate Your Environment', description:'Listen to as much live jazz as possible. Recordings are not enough. Watch the interaction between musicians.'},
      {title:'Form', description:'Be aware of how your solo functions within the band\'s entire performance.'}]
  },

  freeImprovGuide:{
    title:'Free Improvisation Guide',
    source:'Siskind Book 3, Unit 12, pp.273-277',
    principles:[
      {title:'Avoid "shoulds"', description:'Live in the present, respond spontaneously. Remove ego, obligations, and loyalty to traditions. Strive for legitimate spontaneity.'},
      {title:'Focus on non-note elements', description:'Engage with sound, gesture, and texture. Think like a classical pianist — experiment with Debussy-esque soundscapes or Bach-like contrapuntal textures.'},
      {title:'Develop motives', description:'Use inversion, retrograde, augmentation, diminution. Create narrative and purpose through motivic development.'},
      {title:'Seek non-musical inspiration', description:'Tell a story through music, paint a picture, imitate a dancer, capture the mood of a film.'}],
    practiceExercises:[
      'Improvise for 5 minutes every day with no prompt, alone or with bandmates.',
      'Improvise with a non-musical goal (story, painting, film mood).',
      'Open classical music to a random page; play the pianistic texture with spontaneous notes.',
      'Spend 10 minutes creating voicings that don\'t imply any harmony or key center.'],
    recommended:'Free Play: Improvisation in Life and Art by Stephen Nachmanovitch'
  }
};

/* ---------- accessors ---------- */
const jazzImprovEx = id => IMPROVISATION_LIBRARY.guidedImprovisation.find(e => e.id === id);
const jazzImprovBooks = () => [
  {key:'B1', label:'Book 1: Foundations', icon:'\u{1f4d8}',
   ids:IMPROVISATION_LIBRARY.guidedImprovisation.filter(e=>e.id.startsWith('IMP-B1')).map(e=>e.id)},
  {key:'B2', label:'Book 2: Intermediate', icon:'\u{1f4d7}',
   ids:IMPROVISATION_LIBRARY.guidedImprovisation.filter(e=>e.id.startsWith('IMP-B2')).map(e=>e.id)},
  {key:'B3', label:'Book 3: Advanced/Modal', icon:'\u{1f4d5}',
   ids:IMPROVISATION_LIBRARY.guidedImprovisation.filter(e=>e.id.startsWith('IMP-B3')).map(e=>e.id)},
  {key:'V', label:'Vocal Improvisation', icon:'\u{1f3a4}',
   ids:IMPROVISATION_LIBRARY.guidedImprovisation.filter(e=>e.id.startsWith('IMP-V')).map(e=>e.id)}
];

/* ---------- state ---------- */
function jazzImprovState(){
  return S._jimprov = S._jimprov || {detailId: null, refCard: null};
}

/* ---------- the page ---------- */
function jazzImprovHTML(){
  const is = jazzImprovState();
  if(is.detailId) return jazzImprovDetailHTML(is.detailId);
  return jazzImprovListHTML();
}

function jazzImprovListHTML(){
  const books = jazzImprovBooks();
  const exRow = e => `<button class="ji-row" data-jiid="${esc(e.id)}">
    <span class="ji-eid mono faint">${esc(e.id)}</span>
    <span class="ji-ti">
      <b>${esc(e.title)}</b>
      ${e.subtitle ? `<span class="faint"> — ${esc(e.subtitle)}</span>` : ''}
      <span class="ji-meta faint">${esc(e.source)} · ${esc(e.stageAlignment)}</span>
    </span>
    <span class="ji-type mono">${esc(e.exerciseType)}</span>
  </button>`;

  const bookSection = b => `<div class="ji-book">
    <h3 class="ji-bookname">${b.icon} ${esc(b.label)}</h3>
    <div class="ji-rows">${b.ids.map(id => {
      const e = jazzImprovEx(id);
      return e ? exRow(e) : '';
    }).join('')}</div>
  </div>`;

  const refCards = [
    {key:'corea', label:'COREA Process', desc:'Extract concepts from transcriptions'},
    {key:'questionnaire', label:'Self-Transcription Questionnaire', desc:'17 diagnostic questions'},
    {key:'levine', label:'Levine Practice Philosophy', desc:'14 principles for effective practice'},
    {key:'freeimprov', label:'Free Improvisation Guide', desc:'4 principles + practice exercises'}
  ];

  const refSection = `<div class="ji-book ji-refs">
    <h3 class="ji-bookname">\u{1f4d6} Reference Cards</h3>
    <div class="ji-rows">${refCards.map(r => `<button class="ji-row ji-refrow" data-jiref="${esc(r.key)}">
      <span class="ji-ti"><b>${esc(r.label)}</b><span class="faint"> — ${esc(r.desc)}</span></span>
    </button>`).join('')}</div>
  </div>`;

  return `<div class="row between" style="align-items:baseline;flex-wrap:wrap;gap:8px">
    <div>
      <h1 class="serif">Improvisation Exercises</h1>
      <p class="page-blurb">“Make a mess, then clean it up.” — Siskind</p>
    </div>
    <button class="btn sm ghost" id="jiBack">← Jazz Studio</button>
  </div>
  <div class="jl-quote">
    <p>“If it sounds good, it is good.” — Siskind</p>
    <p>“The goal is to internalize scales as an available pool of notes.” — Levine</p>
  </div>
  ${books.map(bookSection).join('')}
  ${refSection}`;
}

function jazzImprovDetailHTML(id){
  /* Reference card views */
  if(id === 'corea'){
    const cp = IMPROVISATION_LIBRARY.coreaProcess;
    return `<button class="btn sm ghost" id="jiBack">← Improvisation Exercises</button>
    <h1 class="serif">${esc(cp.title)}</h1>
    <p class="mono faint">${esc(cp.source)}</p>
    <div class="ji-corea">${cp.steps.map(s =>
      `<div class="ji-cstep"><span class="ji-cl">${esc(s.letter)}</span>
       <span><b>${esc(s.word)}</b><p>${esc(s.description)}</p></span></div>`
    ).join('')}</div>
    <div class="jl-section"><span class="jl-sh">Worked Example</span>
      <p class="jl-body">${esc(cp.workedExample)}</p></div>`;
  }
  if(id === 'questionnaire'){
    const q = IMPROVISATION_LIBRARY.selfTranscriptionQuestionnaire;
    return `<button class="btn sm ghost" id="jiBack">← Improvisation Exercises</button>
    <h1 class="serif">${esc(q.title)}</h1>
    <p class="mono faint">${esc(q.source)}</p>
    <ol class="ji-qlist">${q.questions.map(qq => `<li>${esc(qq)}</li>`).join('')}</ol>`;
  }
  if(id === 'levine'){
    const lv = IMPROVISATION_LIBRARY.levineMethod;
    return `<button class="btn sm ghost" id="jiBack">← Improvisation Exercises</button>
    <h1 class="serif">${esc(lv.title)}</h1>
    <p class="mono faint">${esc(lv.source)}</p>
    <div class="ji-levine">${lv.principles.map((p,i) =>
      `<div class="ji-lpr"><span class="ji-ln mono">${i+1}</span>
       <span><b>${esc(p.title)}</b><p>${esc(p.description)}</p></span></div>`
    ).join('')}</div>`;
  }
  if(id === 'freeimprov'){
    const fi = IMPROVISATION_LIBRARY.freeImprovGuide;
    return `<button class="btn sm ghost" id="jiBack">← Improvisation Exercises</button>
    <h1 class="serif">${esc(fi.title)}</h1>
    <p class="mono faint">${esc(fi.source)}</p>
    <div class="jl-section"><span class="jl-sh">Four Principles</span>
      <div class="ji-levine">${fi.principles.map(p =>
        `<div class="ji-lpr"><span><b>${esc(p.title)}</b><p>${esc(p.description)}</p></span></div>`
      ).join('')}</div></div>
    <div class="jl-section"><span class="jl-sh">Practice Exercises</span>
      <ul class="jl-wtlf">${fi.practiceExercises.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="jl-section"><span class="jl-sh">Recommended Reading</span>
      <p class="jl-body">${esc(fi.recommended)}</p></div>`;
  }

  /* Exercise detail */
  const e = jazzImprovEx(id);
  if(!e) return `<p>Exercise not found.</p>`;

  const setupKeys = e.setup.keys.join(', ');
  const pofHTML = e.pointsOfFocus.map((p,i) =>
    `<div class="ji-pof">
      <span class="ji-pn mono">${i+1}</span>
      <div>
        <b>${esc(p.title)}</b>
        <p>${esc(p.description)}</p>
        <p class="ji-prompt">→ ${esc(p.practicePrompt)}</p>
      </div>
    </div>`
  ).join('');

  const faqHTML = e.faq.length
    ? `<div class="jl-section"><span class="jl-sh">FAQ</span>
       ${e.faq.map(f => `<div class="ji-faq"><b>Q: ${esc(f.question)}</b><p>A: ${esc(f.answer)}</p></div>`).join('')}
       </div>` : '';

  const connHTML = [...(e.connectsToListening||[]).map(lid => {
    const t = jazzGlTrack(lid);
    return t ? `<li>\u{1f3a7} ${esc(t.trackTitle)} — ${esc(t.artist)} (${esc(lid)})</li>` : '';
  }), ...(e.connectsToStages||[]).map(s => `<li>${esc(s)}</li>`)].join('');

  return `<div class="row between" style="align-items:baseline;flex-wrap:wrap;gap:8px">
    <button class="btn sm ghost" id="jiBack">← Improvisation Exercises</button>
    <span class="mono faint">${esc(e.id)}</span>
  </div>
  <div class="ji-detail">
    <h1 class="serif">${esc(e.title)}</h1>
    ${e.subtitle ? `<p class="jl-meta">${esc(e.subtitle)}</p>` : ''}
    <p class="jl-src mono faint">${esc(e.source)}, ${esc(e.sourceUnit)}, ${esc(e.sourcePages)} · ${esc(e.stageAlignment)}</p>
    <div class="jl-section ji-setup">
      <span class="jl-sh">Setup</span>
      <div class="ji-setupgrid">
        <span class="faint">Left hand</span><span>${esc(e.setup.leftHand)}</span>
        <span class="faint">Keys</span><span>${esc(setupKeys)}</span>
        ${e.setup.tempo ? `<span class="faint">Tempo</span><span>${esc(e.setup.tempo)}</span>` : ''}
        ${e.setup.timerMinutes ? `<span class="faint">Timer</span><span>${e.setup.timerMinutes} min</span>` : ''}
        ${e.setup.backingTrack ? `<span class="faint">Backing</span><span>${esc(e.setup.backingTrack)}</span>` : ''}
      </div>
    </div>
    <div class="jl-section">
      <span class="jl-sh">Points of Focus</span>
      <div class="ji-pofs">${pofHTML}</div>
    </div>
    ${faqHTML}
    ${connHTML ? `<div class="jl-section"><span class="jl-sh">Connects to</span><ul class="jl-wtlf">${connHTML}</ul></div>` : ''}
  </div>`;
}

function bindJazzImprov(root){
  const back = root.querySelector('#jiBack');
  if(back){
    back.onclick = () => {
      const is = jazzImprovState();
      if(is.detailId){ is.detailId = null; navigate('#/jazz/improv'); }
      else navigate('#/jazz');
    };
  }
  root.querySelectorAll('[data-jiid]').forEach(b => {
    b.onclick = () => {
      jazzImprovState().detailId = b.dataset.jiid;
      navigate('#/jazz/improv/' + b.dataset.jiid);
    };
  });
  root.querySelectorAll('[data-jiref]').forEach(b => {
    b.onclick = () => {
      jazzImprovState().detailId = b.dataset.jiref;
      navigate('#/jazz/improv/' + b.dataset.jiref);
    };
  });
}
