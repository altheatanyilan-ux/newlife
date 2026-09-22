/* ============================================================
   SISKIND CURRICULUM CATALOG — the twelve reference categories.

   The units say what to do. This says what those things are: every
   named comping pattern, every coordination exercise with its hands
   broken out, every scale pattern, every transcription project with
   its COREA steps, the 11-step tune mastery workflow, the four memory
   types, the 17-question self-transcription diagnostic, and the rest.

   This is reference material, not a todo list. You open it when you
   need to remember what "Red Garland Rhythm" means, or what the five
   COREA steps are for the Miles Davis "Bye Bye Blackbird" project, or
   what questions to ask yourself after recording a take.
   ============================================================ */

/* ── CATEGORY 1: COORDINATION EXERCISES ────────────────────── */

const COORD_EXERCISES = [
  {id:'C1', code:'B1-Coord-1', name:'Swing Eighths over Quarter Notes',
   book:1, unit:1, stage:1, difficulty:'Beginner',
   rh:'Major scale with repeated notes creating a triplet subdivision. On beats 1 and 2, repeat every other scale note so three notes fit in the space of two — then remove the repeated note but keep hearing it internally.',
   lh:'Quarter notes on every beat. One chord per bar, whole-note voicings to start.',
   keys:'All 12 keys', source:'Book 1 p.12',
   desc:'The foundational coordination drill. Right hand learns to feel the triplet subdivision that gives swing its character; left hand holds down the harmonic pulse while right hand does all the rhythmic work.',
   crossRefs:['S1','S2','S3','S4']},

  {id:'C2', code:'B1-Coord-2', name:'Major Scales over Charleston / Reverse Charleston',
   book:1, unit:2, stage:1, difficulty:'Beginner',
   rh:'Major scales with correct swing articulation — long–short emphasis, short on the onbeat, accent on the offbeat.',
   lh:'Line A: Charleston (beats 1 and "and of 2"). Line B: Reverse Charleston ("and of 1" and beat 3). Lines C–D: mix both patterns.',
   keys:'All 12 keys', source:'Book 1 p.24',
   desc:'Introduces the two foundational comping rhythms. Swing articulation in the right hand must remain consistent even as the left hand changes its rhythmic pattern.',
   crossRefs:['P-charleston','P-revcharleston']},

  {id:'C3', code:'B1-Coord-3', name:'Swing Eighths over ii-V-I with Charleston',
   book:1, unit:3, stage:3, difficulty:'Beginner-Intermediate',
   rh:'Major scale of the I chord played throughout the entire ii-V-I progression — sustain the tonic scale over all three chords.',
   lh:'Charleston comping rhythm with ii-V-I shell voicings (7th and 3rd of each chord).',
   keys:'All 12 keys', source:'Book 1 p.38',
   desc:'Introduces harmonic context. Right hand plays a single scale across all three chords — this is intentional: the ear must begin to hear the progression happening underneath a static scale.',
   crossRefs:['P-charleston','W-b1u3']},

  {id:'C4', code:'B1-Coord-4', name:'Modes over Reverse Charleston',
   book:1, unit:4, stage:4, difficulty:'Intermediate',
   rh:'Dorian (for the ii chord), Mixolydian (for the V chord), and Ionian (for the I chord) played in the correct mode for each chord in the progression.',
   lh:'Reverse Charleston comping, optionally mixed with the standard Charleston as facility grows.',
   keys:'All 12 keys', source:'Book 1 p.52',
   desc:'Connects modal knowledge to coordination. Now the right hand changes its scale to match each chord — a more demanding task than the single-scale approach of Coord 3.',
   crossRefs:['P-revcharleston','W-b1u4']},

  {id:'C5', code:'B1-Coord-5', name:'Scales with One-Handed Voicings',
   book:1, unit:9, stage:6, difficulty:'Intermediate',
   rh:'Major and modal scales — a good opportunity to practise adding lead-ins (chromatic notes approaching the scale).',
   lh:'Type A and Type B one-handed voicings (3rd and 7th) with Charleston and Reverse Charleston rhythm.',
   keys:'All 12 keys', source:'Book 1 p.118',
   desc:'The left hand now plays the most harmonically dense material introduced so far. Right hand must stay rhythmically independent while the left hand manages voicing shape and comping rhythm simultaneously.',
   crossRefs:['P-leadin','P-charleston','P-revcharleston']},

  {id:'C6', code:'B1-Coord-6', name:'Melody over Constant Bassline',
   book:1, unit:10, stage:6, difficulty:'Intermediate',
   rh:'Any jazz standard melody — phrased with swing articulation and basic personalization.',
   lh:'Constant bassline pattern (bossa nova or walking feel) that provides the rhythmic and harmonic foundation.',
   keys:'All 12 keys', source:'Book 1 p.132',
   desc:'Essential for duo and solo piano situations. The pianist must simultaneously play melody and provide the bass function — separating the two hands both rhythmically and texturally.',
   crossRefs:['BN-1','BN-2','BN-3']},

  {id:'C7', code:'B2-Coord-1', name:'Intervallic Patterns over Red Garland Rhythm',
   book:2, unit:1, stage:9, difficulty:'Intermediate',
   rh:'Scale patterns in thirds, fourths, fifths, sixths, and sevenths — the intervallic patterns of Book 2, Unit 1.',
   lh:'Red Garland Rhythm ("and of 4" and "and of 2") with one-handed four-note Type A and Type B voicings.',
   keys:'All 12 keys', source:'Book 2 p.12',
   desc:'Bridges Book 1 coordination work with Book 2 pattern vocabulary. The Red Garland Rhythm has a more relaxed, spacious feel than the Charleston patterns.',
   crossRefs:['P-redgarland','SP1']},

  {id:'C8', code:'B2-Coord-2', name:'Three-Note Patterns with Sidestep Push-Offs',
   book:2, unit:2, stage:10, difficulty:'Intermediate',
   rh:'Three-note scale patterns — triadic shapes ascending and descending through the scale.',
   lh:'Sidestep push-offs from above and below the target chord. Half-step displacement resolving back to the chord.',
   keys:'All 12 keys', source:'Book 2 p.28',
   desc:'Combines melodic pattern work with the advanced comping device of sidestepping. Left hand must resolve the half-step tension while right hand continues its pattern.',
   crossRefs:['P-sidestep','P-pushoff']},

  {id:'C9', code:'B2-Coord-3', name:'Scale Game 1 with Count Basie Rhythm',
   book:2, unit:3, stage:11, difficulty:'Intermediate-Advanced',
   rh:'Scale Game 1 — continuous eighth notes for an extended time without simply running up and down. Real-time melodic decisions required.',
   lh:'Count Basie Rhythm: beat 3 in the first measure, then Charleston in the second measure. Two-measure pattern.',
   keys:'All 12 keys', source:'Book 2 p.44',
   desc:'Scale Game demands continuous melodic invention rather than pre-learned patterns. The two-measure Count Basie comping creates a spacious, bouncing accompaniment feel.',
   crossRefs:['P-countbasie','SP3']},

  {id:'C10', code:'B2-Coord-4', name:'Combined Comping with Minor Scales',
   book:2, unit:4, stage:11, difficulty:'Advanced',
   rh:'Harmonic minor and melodic minor scales, switching between them for ii-V-i progressions.',
   lh:'Reverse Charleston + Beat Three Charleston with four-note voicings. Six combinations: three formulas (LN, HN, R) × two voicing types (A and B).',
   keys:'All 12 keys', source:'Book 2 p.60',
   desc:'The most harmonically and rhythmically demanding coordination exercise in Book 2. All six minor ii-V-i voicing strategies must work under active comping.',
   crossRefs:['P-revcharleston','P-beatthreecharleston']},

  {id:'C11', code:'B2-Coord-5', name:'Beat Three Charleston with Locrian ♮2 and Altered Scale',
   book:2, unit:5, stage:12, difficulty:'Advanced',
   rh:'Locrian natural 2 mode (for the half-diminished chord) and altered scale (for the dominant chord) in minor ii-V progressions.',
   lh:'Charleston starting on beat three — a more advanced placement than the standard Charleston starting on beat 1.',
   keys:'All 12 keys', source:'Book 2 p.76',
   desc:'Targets the most advanced scale-rhythm combinations for minor ii-V progressions. Beat Three Charleston shifts the rhythmic weight later in the bar, creating a different feel.',
   crossRefs:['P-beatthreecharleston','SP5']},

  {id:'C12', code:'B2-Coord-6', name:'Walking Basslines for ii-V-I and ii-V',
   book:2, unit:10, stage:13, difficulty:'Advanced',
   rh:'Free improvisation or melody — whatever is being worked on at this stage.',
   lh:'Walking basslines. Exercise A: chords changing twice per measure, walk up. Exercise B: same, walk down. Exercise C: chords changing once per measure, walk up. Exercise D: same, walk down.',
   keys:'All 12 keys', source:'Book 2 p.148',
   desc:'Essential for solo piano and duo performance. Walking bass creates the illusion of a separate bass player while the right hand handles melody and improvisation.',
   crossRefs:['W-b2u10']}
];

/* ── CATEGORY 2: SWING FEEL & ARTICULATION ──────────────────── */

const SWING_EXERCISES = [
  {id:'S1', name:'Subdividing the Beat into Three Parts',
   source:'B1-U1', stage:1, difficulty:'Beginner',
   desc:'The foundational concept: divide each beat into three equal parts (a triplet), not two. The middle partial is the key — swing lives there.',
   syllables:[],
   howTo:'Clap or tap eighths, then think of them as the 1st and 3rd partials of a triplet: ONE–skip–TWO–skip. The skipped middle note is still felt.'},

  {id:'S2', name:'"doo-VAH" Articulation',
   source:'B1-U1', stage:1, difficulty:'Beginner',
   desc:'The fundamental jazz articulation: accent the offbeat (VAH) and de-emphasise the onbeat (doo). This alone separates jazz phrasing from classical.',
   syllables:['doo (onbeat, light)', 'VAH (offbeat, accent)'],
   howTo:'Sing a melody using only doo and VAH. The VAH should be noticeably louder and longer than the doo. Then transfer exactly that weight distribution to the keyboard.'},

  {id:'S3', name:'Four Scat Syllables: doo, VAH, DIT, daht',
   source:'B1-U1', stage:1, difficulty:'Beginner',
   desc:'The full scat syllable vocabulary for swing articulation. Each syllable describes a combination of rhythmic placement and dynamic level.',
   syllables:['doo — onbeat, light, slightly long', 'VAH — offbeat, accent, held', 'DIT — short staccato note anywhere', 'daht — accented short note (often a ghost)'],
   howTo:'Speak rhythms using only these four syllables before playing them. The mouth is the most honest instrument: if you cannot say it correctly, you cannot play it correctly.'},

  {id:'S4', name:'Correct vs. Incorrect Articulation',
   source:'B1-U1', stage:1, difficulty:'Beginner',
   desc:'Side-by-side comparison of correct and incorrect swing feel. Common mistakes: equal accents on all eighths; too long on the onbeat; rushing the offbeat.',
   syllables:[],
   howTo:'Record yourself on a familiar melody. Play it back: are the downbeats shorter than the offbeats? Is every note the same volume? Correct articulation sounds uneven — intentionally so.'},

  {id:'S5', name:'Written Swing Exercises with Tenuto Markings',
   source:'B1-U2', stage:1, difficulty:'Beginner',
   desc:'Notated exercises where tenuto markings (—) show which notes receive full length. Students read and interpret swing notation conventions as written by Siskind.',
   syllables:[],
   howTo:'Look for the tenuto marks — those notes get the full VAH length. Unmarked eighth notes on the beat get the short doo treatment. Trust the notation; the correct feel is written in.'},

  {id:'S6', name:'Practice Passages with Marked Swing Articulation',
   source:'B1-U2', stage:1, difficulty:'Beginner',
   desc:'Extended passages (including the "Satin Doll" melody) notated with full doo-VAH markings. Students apply swing feel to real musical material.',
   syllables:[],
   howTo:'Learn the melody without articulation first. Then add the scat syllables. Finally play it at the piano, transferring exactly the articulation the syllables prescribed. Compare the result with a recording of the original.'}
];

/* ── CATEGORY 3: COMPING PATTERN LIBRARY ─────────────────────── */

const COMPING_PATTERNS = [
  {id:'P-charleston', name:'Charleston', book:1, unitIntroduced:2, stage:1,
   type:'One-measure rhythm',
   rhythm:'Beat 1 and "and of 2" — two notes per measure, the second on the upbeat of beat 2.',
   desc:'The most important comping pattern and the first one learned. Named after the James P. Johnson piece and dance. Provides forward momentum without cluttering the texture.',
   notes:'Keep both chords short (staccato on the "and of 2"). Works in any style, any tempo.',
   relatedPatterns:['P-revcharleston','P-leadin']},

  {id:'P-revcharleston', name:'Reverse Charleston', book:1, unitIntroduced:2, stage:1,
   type:'One-measure rhythm',
   rhythm:'"And of 1" and beat 3 — two notes per measure, both displaced from the stronger beats.',
   desc:'Rhythmically complementary to the standard Charleston. Works best when a bassist plays a two-feel (half notes), since the Reverse Charleston avoids beats 1 and 3 where the bass lands.',
   notes:'Do not confuse with the Charleston — the "and of 1" is BEFORE beat 1\'s echo, not after.',
   relatedPatterns:['P-charleston','P-beatthreecharleston']},

  {id:'P-leadin', name:'Lead-In', book:1, unitIntroduced:7, stage:7,
   type:'Rhythmic device',
   rhythm:'Placed on "and of 3" or beat 4. A single chord that propels the music forward into the next downbeat.',
   desc:'A single chord placed on the last upbeat of the measure, pushing the music into the next bar. Creates forward momentum and rhythmic interest.',
   notes:'Can be added before any Charleston or Reverse Charleston. Use sparingly — one or two per phrase is more effective than constant use.',
   relatedPatterns:['P-charleston','P-pushoff']},

  {id:'P-pushoff', name:'Push-Off', book:1, unitIntroduced:7, stage:7,
   type:'Rhythmic device',
   rhythm:'Two consecutive eighth notes placed anywhere in the measure.',
   desc:'Two chords played as a pair of eighth notes, creating a brief burst of rhythmic energy. Can be placed on any beat or upbeat.',
   notes:'Combine with lead-ins for more complex patterns. Advanced variations include single, double, and triple push-offs (Book 2).',
   relatedPatterns:['P-leadin']},

  {id:'P-longshort', name:'Long–Short Articulation', book:1, unitIntroduced:7, stage:7,
   type:'Articulation strategy',
   rhythm:'Varies the length (sustained vs. staccato) of individual comping chords.',
   desc:'A dynamic tool rather than a rhythmic one. Long chords (sustained) create warmth and harmonic weight. Short chords (staccato) create rhythmic crispness. Mixing both within a phrase adds variety.',
   notes:'This is the most underused device by beginners, who tend to play everything equally short.',
   relatedPatterns:[]},

  {id:'P-redgarland', name:'Red Garland Rhythm', book:2, unitIntroduced:1, stage:9,
   type:'One-measure rhythm',
   rhythm:'"And of 4" and "and of 2" — two upbeats per measure, both in the second half of their respective beats.',
   desc:'Named after Red Garland, the pianist in the Miles Davis Quintet of the 1950s. Has a more relaxed, floating feel than the Charleston because both notes land on upbeats without any downbeat anchor.',
   notes:'A push-off is often added on beat 4, creating three notes total. Works best at medium tempos.',
   relatedPatterns:['P-charleston']},

  {id:'P-locked', name:'Locked Hands', book:2, unitIntroduced:1, stage:9,
   type:'Voicing strategy',
   rhythm:'Both hands move together in rhythmic unison, following the melody.',
   desc:'Both hands play the same rhythm simultaneously — typically the melody in the right hand with a four-note chord shape below it, and the left hand doubling the bottom note. Creates a full, orchestral texture.',
   notes:'Use only when you have the melody or are improvising. Too dense for comping behind a soloist.',
   relatedPatterns:['P-semilocked']},

  {id:'P-semilocked', name:'Semi-Locked Hands', book:2, unitIntroduced:1, stage:9,
   type:'Voicing strategy',
   rhythm:'Both hands lock together only on important melody notes, freeing up the other moments.',
   desc:'A lighter version of locked hands. The pianist locks both hands on melodic peaks or cadence points but uses single-note or lighter voicings at other times.',
   notes:'More nuanced than full locked hands. Allows melodic phrasing to breathe.',
   relatedPatterns:['P-locked']},

  {id:'P-sidestep', name:'Sidestep', book:2, unitIntroduced:2, stage:10,
   type:'Harmonic device',
   rhythm:'A voicing displaced by one half step (up or down), then resolved to the target chord.',
   desc:'The sidestep creates momentary harmonic tension by displacing a chord by a half step before resolving. Can be applied from above or below the target. Adds chromatic color without changing the underlying harmony.',
   notes:'From above sounds more tense and chromatic. From below sounds more like a grace-note slide.',
   relatedPatterns:['P-tonicization']},

  {id:'P-tonicization', name:'Tonicization', book:2, unitIntroduced:2, stage:10,
   type:'Harmonic device',
   rhythm:'Insert a dominant seventh chord whose root is a fifth above the target chord.',
   desc:'Creates a momentary V–I resolution before the target chord. The ear hears a brief key change that resolves immediately. Named "tonicization" because it temporarily makes the next chord feel like a tonic.',
   notes:'A D7 before a G chord is a tonicization of G. The D7 does not need to be in the original progression.',
   relatedPatterns:['P-sidestep']},

  {id:'P-leaveout', name:'Leave Out a Comp', book:2, unitIntroduced:2, stage:10,
   type:'Strategy',
   rhythm:'Simply omit one of the planned comping chords.',
   desc:'Deliberate silence where a chord was expected. This is one of the most powerful comping devices and one of the hardest to commit to — the temptation is always to fill the space.',
   notes:'Count Basie was the master of this. Leave-outs work best after you have established the pattern and the listener expects the chord.',
   relatedPatterns:[]},

  {id:'P-beatthreecharleston', name:'Beat Three Charleston', book:2, unitIntroduced:3, stage:11,
   type:'Two-measure rhythm',
   rhythm:'Beat 3 and "and of 4" in the first measure; rest in the second measure.',
   desc:'A two-measure pattern that gives the music more space than the one-measure Charleston patterns. The two-measure cycle creates a long-short feel across two bars.',
   notes:'Because the pattern is two measures long, it creates a sense of forward motion toward the next repetition.',
   relatedPatterns:['P-countbasie','P-revcharleston']},

  {id:'P-countbasie', name:'Count Basie Rhythm', book:2, unitIntroduced:3, stage:11,
   type:'Two-measure rhythm',
   rhythm:'Beat 3 in the first measure; Charleston (beat 1 and "and of 2") in the second measure.',
   desc:'Named after Count Basie\'s legendary economical comping style. Two measures of rhythmically varied, widely spaced comping that creates maximum forward momentum with minimum density.',
   notes:'Works beautifully at any tempo. The contrast between the single chord in bar 1 and the two chords in bar 2 creates a call-and-response feel.',
   relatedPatterns:['P-beatthreecharleston','P-charleston']},

  {id:'P-revcharbeat3', name:'Reverse Charleston + Beat Three Charleston', book:2, unitIntroduced:4, stage:11,
   type:'Two-measure rhythm',
   rhythm:'"And of 1", beat 3, and "and of 4" followed by a rest — a combined six-event two-measure figure.',
   desc:'Combines two Book 2 patterns into one two-measure phrase. Creates a short hemiola effect — the three evenly spaced chords across two bars briefly suggest a 3/2 meter against the 4/4.',
   notes:'The hemiola effect is subtle but adds sophisticated rhythmic tension when used sparingly.',
   relatedPatterns:['P-revcharleston','P-beatthreecharleston']},

  {id:'P-freddie', name:'Freddie Green Style', book:2, unitIntroduced:7, stage:13,
   type:'Style-specific rhythm',
   rhythm:'Quarter note on every beat — four comps per measure.',
   desc:'Named after the Count Basie Orchestra guitarist who played four-to-the-bar throughout his career. Translated to piano, this creates maximum harmonic density and a very steady, driving pulse.',
   notes:'Use predominantly at medium-up and up tempos. Sustain each chord slightly for best effect.',
   relatedPatterns:[]},

  {id:'P-freecomp', name:'Free Comping', book:2, unitIntroduced:6, stage:12,
   type:'Strategy',
   rhythm:'No fixed pattern — respond to the music organically.',
   desc:'The synthesis of all learned patterns: playing without pre-determining which pattern to use, responding to the melody, the bass, and the harmony in the moment. This is the goal of all earlier pattern work.',
   notes:'Free comping cannot be practised directly. It emerges from deep internalisation of the patterns. The best preparation is playing all patterns on many tunes until they feel automatic.',
   relatedPatterns:[]},

  {id:'P-modalvoice', name:'Modal Voicing Comping', book:3, unitIntroduced:2, stage:'B3',
   type:'Modal voicing strategy',
   rhythm:'Two-handed voicing comping with four tools for moving between voicings.',
   desc:'Comping in a modal context using voicings with no doubling and no third-stacking. Four movement tools: (1) maintain same pitch classes while redistributing between hands; (2) move the top or bottom note by step; (3) use complementary voicings; (4) transpose in parallel.',
   notes:'The "no doubling, no third-stacking" rule produces the open, ambiguous sound characteristic of modal jazz piano.',
   relatedPatterns:['P-planing']},

  {id:'P-planing', name:'Planing', book:3, unitIntroduced:7, stage:'B3',
   type:'Harmonic device (modal)',
   rhythm:'Transpose voicings in parallel motion regardless of the underlying harmony.',
   desc:'Moving voicings in strict parallel motion, as if dragging the entire chord structure up or down without regard for harmonic function. Creates a floating, non-functional effect characteristic of modern jazz.',
   notes:'Planing works because the overall sonority remains similar across movement — the intervallic relationships within the voicing stay constant.',
   relatedPatterns:['P-modalvoice']}
];

/* ── CATEGORY 4: SCALE PATTERN EXERCISES ─────────────────────── */

const SCALE_PATTERNS = [
  {id:'SP1', name:'Intervallic Patterns', book:2, unit:1, stage:9, difficulty:'Intermediate',
   desc:'Scales played in intervals of 3rds, 4ths, 5ths, 6ths, and 7ths rather than stepwise. Start slow (~120 bpm) and increase as patterns become automatic.',
   keys:'All 12 keys', intervals:'3rds, 4ths, 5ths, 6ths, 7ths', source:'Book 2 p.14'},

  {id:'SP2', name:'Triadic / Seventh-Chord Patterns', book:2, unit:2, stage:9, difficulty:'Intermediate',
   desc:'Three-note (triad) and four-note (seventh chord) patterns ascending and descending through scales. Eighth-note versions create hemiolas against the underlying 4/4 meter.',
   keys:'All 12 keys', intervals:'Triad groups (3-note), seventh chord groups (4-note)', source:'Book 2 p.30'},

  {id:'SP3', name:'Scale Game 1', book:2, unit:3, stage:11, difficulty:'Intermediate-Advanced',
   desc:'Continuous eighth notes for an extended time without running scales simply up and down. Melodic decisions must be made in real time. Pay attention to hand positions before increasing tempo.',
   keys:'All 12 keys', intervals:'Free melodic choice, eighth notes', source:'Book 2 p.46'},

  {id:'SP4', name:'Scale Game 2', book:2, unit:4, stage:11, difficulty:'Intermediate-Advanced',
   desc:'Same as Scale Game 1 but switch scales every 2 measures, ascending by half steps. Builds rapid key-change navigation while maintaining melodic flow.',
   keys:'All 12 keys, modulating by half step', intervals:'Free melodic choice, modulating', source:'Book 2 p.62'},

  {id:'SP5', name:'Chromatic Lead-In Patterns', book:2, unit:5, stage:12, difficulty:'Advanced',
   desc:'Approach guidetone lines from below by half step, above by half step, and via chromatic enclosures. Target important chord tones with chromatic ornaments.',
   keys:'All 12 keys', intervals:'Chromatic approach notes', source:'Book 2 p.78'},

  {id:'SP6', name:'Octatonic Scale Patterns', book:2, unit:6, stage:12, difficulty:'Advanced',
   desc:'Two-note, three-note, and four-note patterns using the diminished (octatonic) scale. The same three pitch collections serve multiple different starting notes — the scale\'s symmetrical property.',
   keys:'3 unique octatonic scales (each covers 4 keys)', intervals:'2-note, 3-note, 4-note groups', source:'Book 2 p.96'},

  {id:'SP7', name:'Non-Chord-Tone Patterns 1: Lower Neighbors & Enclosures', book:2, unit:7, stage:13, difficulty:'Advanced',
   desc:'Lower neighbor tones and chromatic enclosures targeting scale notes. Adds bebop-style ornamental embellishment to melodic lines.',
   keys:'All 12 keys', intervals:'Ornamental', source:'Book 2 p.112'},

  {id:'SP8', name:'Non-Chord-Tone Patterns 2: Double Neighbors, Joy Spring, Yodel Lick', book:2, unit:8, stage:13, difficulty:'Advanced',
   desc:'Double neighbors, the "Joy Spring" pattern (from the Clifford Brown tune), and the "Yodel Lick." Named patterns reference iconic jazz solos where these devices appear prominently.',
   keys:'All 12 keys', intervals:'Named bebop patterns', source:'Book 2 p.126'},

  {id:'SP9', name:'Arpeggio Patterns for Rhythm Changes', book:2, unit:9, stage:14, difficulty:'Advanced',
   desc:'3-5-7-9 arpeggio patterns for I-vi-ii-V progressions with half-step connections between chord tones. Essential vocabulary for navigating the rhythm changes form.',
   keys:'All 12 keys', intervals:'Arpeggiated', source:'Book 2 p.142'},

  {id:'SP10', name:'Bebop Scale Patterns', book:2, unit:10, stage:14, difficulty:'Advanced',
   desc:'Major and melodic minor bebop scales played melodically in different shapes. The bebop scale adds a chromatic passing tone so that chord tones land on downbeats.',
   keys:'All 12 keys', intervals:'Bebop scale shapes', source:'Book 2 p.158'},

  {id:'SP11', name:'Hemiola Patterns', book:2, unit:11, stage:14, difficulty:'Advanced',
   desc:'Mixing rhythmic units: a quarter note plus an eighth note equals 1.5 beats, producing three-beat patterns against 4/4. Includes descending seventh chords with bluesy double-note turns.',
   keys:'All 12 keys', intervals:'Hemiola groupings', source:'Book 2 p.170'},

  {id:'SP12', name:'Non-Chord-Tone Technical Challenges', book:2, unit:12, stage:14, difficulty:'Advanced',
   desc:'Special technical challenges that push non-chord-tone patterns to their physical and musical limits. The capstone of Book 2\'s pattern work.',
   keys:'All 12 keys', intervals:'Extended', source:'Book 2 p.186'},

  {id:'MP1', name:'Mode Practice with Fingering', book:3, unit:1, stage:'B3', difficulty:'Intermediate-Advanced',
   desc:'Each major scale starting on different scale degrees to produce all seven modes. Correct fingering for each mode is emphasised — physical fluency across all modal starting points.',
   keys:'All 12 major keys, all 7 modes each', intervals:'Modal scales', source:'Book 3 p.14'},

  {id:'MP2', name:'Second-Plus-Fourth Shapes', book:3, unit:2, stage:'B3', difficulty:'Intermediate-Advanced',
   desc:'Second-plus-fourth intervallic shapes ascending and descending beneath each mode. These interval shapes form the basis of modal voicing construction (So What voicings are third-plus-fourth).',
   keys:'All 12 keys, all modes', intervals:'2nd + 4th', source:'Book 3 p.28'},

  {id:'MP3', name:'Third-Plus-Fourth Shapes (Inverted Triads)', book:3, unit:3, stage:'B3', difficulty:'Intermediate-Advanced',
   desc:'Third-plus-fourth shapes — inverted triads — beneath major scales. Produces the So What voicing shapes that define modal jazz harmony from Miles Davis onward.',
   keys:'All 12 keys', intervals:'3rd + 4th (inverted triads)', source:'Book 3 p.44'},

  {id:'MP4', name:'Special Triad Inversions', book:3, unit:4, stage:'B3', difficulty:'Advanced',
   desc:'Alternating between two "special" triad inversions in all keys with variations. Produces quartal and cluster voicing shapes central to McCoy Tyner\'s approach.',
   keys:'All 12 keys', intervals:'Special inversions', source:'Book 3 p.60'},

  {id:'MP5', name:'Pentatonic Intervallic Patterns', book:3, unit:5, stage:'B3', difficulty:'Advanced',
   desc:'Intervallic scale patterns using the pentatonic scale in all 12 keys. Extends the intervallic approach of Book 2 into the pentatonic framework.',
   keys:'All 12 keys', intervals:'Pentatonic intervals', source:'Book 3 p.74'},

  {id:'MP6', name:'Pentatonic Patterns with Enclosures', book:3, unit:6, stage:'B3', difficulty:'Advanced',
   desc:'Pentatonic patterns with chromatic enclosures and neighbor tones, moving through the circle of fifths. Combines pentatonic and chromatic vocabularies.',
   keys:'All 12 keys via circle of fifths', intervals:'Pentatonic + chromatic', source:'Book 3 p.88'},

  {id:'MP7', name:'Descending Seventh Chord Patterns in Melodic Minor', book:3, unit:7, stage:'B3', difficulty:'Advanced',
   desc:'Descending seventh chord patterns within the melodic minor scale with "flipped" notes. Note-flipping creates unexpected melodic contours by inverting selected intervals within the cell.',
   keys:'All 12 keys', intervals:'7th chord cells, note-flipping', source:'Book 3 p.102'},

  {id:'MP8', name:'Three-Note Pentatonic Patterns', book:3, unit:8, stage:'B3', difficulty:'Advanced',
   desc:'Three-note patterns from melodic minor, dominant, and flat-sixth pentatonic scales. Flipping notes within cells creates additional variations.',
   keys:'All 12 keys', intervals:'3-note pentatonic cells', source:'Book 3 p.116'},

  {id:'MP9', name:'Mulgrew Miller-Inspired Planing with Hemiolas', book:3, unit:9, stage:'B3', difficulty:'Advanced',
   desc:'Planing exercises inspired by Mulgrew Miller. Hemiolas with different rhythmic subdivisions create metric tension — three-beat patterns against the four-beat bar.',
   keys:'All 12 keys', intervals:'Planing + hemiola', source:'Book 3 p.130'},

  {id:'MP10', name:'Pentatonic Patterns over Major ii-V-I', book:3, unit:10, stage:'B3', difficulty:'Advanced',
   desc:'Pentatonic patterns applied over major ii-V-I progressions, incorporating bebop shapes within a modal context. Bridges Book 2 functional harmony with Book 3 modal approaches.',
   keys:'All 12 keys', intervals:'Pentatonic over functional harmony', source:'Book 3 p.144'},

  {id:'MP11', name:'Symmetric Scale Planing', book:3, unit:11, stage:'B3', difficulty:'Advanced',
   desc:'Planing melodic cells from wholetone, octatonic, and augmented scales both symmetrically and chromatically. Exploits the symmetrical properties of these scales.',
   keys:'All applicable symmetric scale transpositions', intervals:'Symmetric scale cells', source:'Book 3 p.158'},

  {id:'MP12', name:'Augmented Scale Patterns with Odd Meter Hemiolas', book:3, unit:12, stage:'B3', difficulty:'Advanced',
   desc:'Augmented scale patterns with hemiolas against 5/4 and 7/4 claves. The capstone of Book 3\'s modal pattern work: advanced scales, metric tension, and odd meters combined.',
   keys:'All applicable augmented scale transpositions', intervals:'Augmented scale, 5/4 and 7/4', source:'Book 3 p.172'}
];

/* ── CATEGORY 5: MELODY PERSONALIZATION TECHNIQUES ──────────── */

const MELODY_TECHNIQUES = [
  {id:'MT1', name:'Syncopation', book:1, unitIntroduced:2, stage:2, difficulty:'Beginner',
   desc:'Shifting melody rhythms to create syncopated versions of written melodies. The simplest form of personalization: take the written rhythm and move notes earlier or later.',
   howTo:'Play the melody as written, then move one note per phrase to land on an offbeat. Record both versions and compare.'},

  {id:'MT2', name:'Repeated Notes', book:1, unitIntroduced:2, stage:2, difficulty:'Beginner',
   desc:'Repeating selected melody notes for rhythmic emphasis or to create a more conversational phrasing style. Creates a stutter-like effect that sounds idiomatic in jazz.',
   howTo:'Find a sustained note in the melody and repeat it two or three times before moving on.'},

  {id:'MT3', name:'Grace Note Slides', book:1, unitIntroduced:2, stage:2, difficulty:'Beginner',
   desc:'Approaching melody notes from a half-step below using grace notes. Creates the characteristic "slide" effect common in jazz piano performance.',
   howTo:'Before any melody note that feels stable, approach it from the half-step below as a quick grace note — one swift scoop upward.'},

  {id:'MT4', name:'Ghost Notes', book:1, unitIntroduced:5, stage:5, difficulty:'Intermediate',
   desc:'Barely audible notes played with the thumb. Ghost notes add rhythmic texture and fill space between primary melody notes without drawing attention.',
   howTo:'With the thumb of the right hand, touch keys so lightly that the hammer barely reaches the string. The note is more felt than heard.'},

  {id:'MT5', name:'Turns', book:1, unitIntroduced:5, stage:5, difficulty:'Intermediate',
   desc:'Ascending and descending ornaments that briefly circle a target note before landing on it. Turns add melodic decoration and can be applied to virtually any sustained note.',
   howTo:'On a held note, play the note above, the note itself, the note below, and back to the note. Four notes replacing one held note.'},

  {id:'MT6', name:'Double Notes', book:1, unitIntroduced:5, stage:5, difficulty:'Intermediate',
   desc:'Harmonizing the melody with a note below — typically a third or sixth. Creates a richer melodic texture while maintaining the original melody in the top voice.',
   howTo:'While playing the melody in the top note, add a third or sixth below with the ring or middle finger. Both notes move together.'},

  {id:'MT7', name:'Vibrato Imitation', book:1, unitIntroduced:10, stage:6, difficulty:'Intermediate',
   desc:'Imitating the vibrato effect of wind instruments and singers. Achieved through rapid alternation between the target note and an adjacent pitch, or through physical key oscillation on sustained notes.',
   howTo:'On a long note, alternate rapidly between the note and its half-step neighbor, or use the key-oscillation technique to create subtle pitch variation.'},

  {id:'MT8', name:'Back-Phrasing', book:2, unitIntroduced:6, stage:12, difficulty:'Advanced',
   desc:'Starting the melody after the beat — landing slightly late, creating a relaxed, behind-the-beat feel. One of the most characteristic devices in jazz vocal and instrumental phrasing.',
   howTo:'Play the first note of each phrase one to two eighth notes later than written. The harmonic changes underneath proceed normally; only the melody lags.'},

  {id:'MT9', name:'Bell Tones', book:2, unitIntroduced:11, stage:14, difficulty:'Advanced',
   desc:'Octaves played in the upper register as fills between melody phrases. Bell tones add brilliance and punctuate the melodic line with a ringing quality.',
   howTo:'In the space between phrases, play a relevant chord tone in octaves in the upper register (above the treble staff). Brief, percussive, bright.'},

  {id:'MT10', name:'Interlocking Fifths and Sixths', book:2, unitIntroduced:11, stage:14, difficulty:'Advanced',
   desc:'Playing interlocking fifths and sixths in the upper register between melody phrases. Creates a shimmering harmonic texture as a fill device.',
   howTo:'Between phrases, play two voices a fifth or sixth apart that move in contrary or parallel motion. Three to four notes is enough.'}
];

/* ── CATEGORY 7: TRANSCRIPTION PROJECTS ──────────────────────── */

const TRANSCRIPTION_PROJECTS = [
  {id:'TR1', artist:'Miles Davis', tune:'Bye Bye Blackbird', album:'Round About Midnight',
   book:2, unit:1, stage:9,
   focus:'Phrasing, space, time feel — how Miles places notes in the measure and how much silence he uses.',
   listenCount:20, playAlongCount:30,
   corea:{
     copy:'Learn the solo note-for-note. Write it out if possible. Work slowly, using a slow-down tool.',
     observe:'Identify where phrases start and end. Count how many notes per phrase vs. how many rests. Note which chord tones he targets on downbeats.',
     repeat:'Play along with the recording 30 times. Focus on matching Miles\'s time feel exactly, not just the notes.',
     extract:'Isolate two or three phrases that feel natural under your hands. Memorise them and practise them in all 12 keys.',
     apply:'Use extracted phrases as starting points in your own improvisation over "Bye Bye Blackbird" and similar ballads.'
   }},

  {id:'TR2', artist:'Miles Davis', tune:'Rhythmic Concepts', album:'(various)',
   book:2, unit:2, stage:10,
   focus:'Rhythmic placement, space, how Miles starts phrases after the beat and ends them before it.',
   listenCount:20, playAlongCount:30,
   corea:{
     copy:'Focus on the rhythm of the solo rather than individual notes. Clap or sing the rhythm of phrases before playing them.',
     observe:'Note exactly where in the beat Miles starts each phrase. Is it on a downbeat? An upbeat? After a beat? Measure the silence between phrases.',
     repeat:'Play along rhythmically — even if you cannot play the correct notes, match the rhythm exactly.',
     extract:'Find two rhythmic patterns that recur. Practise those rhythms on a single note or a simple chord.',
     apply:'Use the extracted rhythms to generate new phrases over ii-V-I progressions.'
   }},

  {id:'TR3', artist:'Hank Mobley', tune:'If I Should Lose You', album:'Workout',
   book:2, unit:4, stage:11,
   focus:'Harmonic concepts — how Mobley navigates chord changes, which chord tones he targets.',
   listenCount:20, playAlongCount:30,
   corea:{
     copy:'Transcribe the opening chorus. Focus on accuracy of pitches.',
     observe:'Analyse which notes Mobley plays on the downbeats of each chord change. Are they chord tones? Approach notes? Extensions?',
     repeat:'Play along until the harmonic logic of the solo feels internalized.',
     extract:'Find his approach to the ii-V-I resolution. How does he navigate from the ii chord through the V to the I?',
     apply:'Apply extracted harmonic ideas to your own solos on tunes with similar chord progressions.'
   }},

  {id:'TR4', artist:'Illinois Jacquet', tune:'Las Vegas Blues', album:'The Blues; That\'s Me',
   book:2, unit:7, stage:13,
   focus:'Gestures and melodic shapes — large-scale melodic contours and blues vocabulary.',
   listenCount:20, playAlongCount:30,
   corea:{
     copy:'Learn the broad melodic shapes first, then fill in the detail.',
     observe:'Identify repeating gestures — short melodic ideas that recur with variation. Note the peak notes of each phrase.',
     repeat:'Play along with attention to the rise-and-fall shape of each phrase.',
     extract:'Isolate the two or three "signature gestures" — the ones that feel most characteristic.',
     apply:'Use extracted gestures in your own blues improvisation.'
   }},

  {id:'TR5', artist:'Horace Silver', tune:'Oleo', album:'Blowin\' the Blues Away',
   book:2, unit:9, stage:14,
   focus:'Rhythm changes navigation — bebop vocabulary and arpeggio patterns over I-vi-ii-V.',
   listenCount:20, playAlongCount:30,
   corea:{
     copy:'Transcribe the A section of the first chorus. Focus on how Silver outlines the chords.',
     observe:'Note which arpeggio shapes he uses. Compare to the 3-5-7-9 patterns in Scale Pattern SP9.',
     repeat:'Play along with the A section 30 times until the changes feel automatic.',
     extract:'Find his approach to the bridge. Rhythm changes bridges move quickly (a new key every two bars) — how does Silver handle this?',
     apply:'Apply Silver\'s vocabulary to your own rhythm changes solos.'
   }},

  {id:'TR6', artist:'Bud Powell', tune:'Ornithology', album:'The Amazing Bud Powell Vol. 1',
   book:2, unit:11, stage:14,
   focus:'Bebop technical fluency and rhythmic drive.',
   listenCount:20, playAlongCount:30,
   corea:{
     copy:'Play along with Powell 30 times before attempting to transcribe. Let the feel enter the body first.',
     observe:'Note the relentlessness of Powell\'s right hand — continuous eighth notes, minimal space. Compare to the space in Miles Davis\'s solos.',
     repeat:'Continue playing along, focusing on matching Powell\'s articulation and rhythmic drive.',
     extract:'Find one phrase that is physically comfortable and practise it slowly in all 12 keys.',
     apply:'Bring Powell\'s drive into your own bebop solos without losing clarity.'
   }},

  {id:'TR7', artist:'Miles Davis', tune:'So What', album:'Kind of Blue',
   book:3, unit:1, stage:'B3',
   focus:'Modal improvisation — how Miles uses space and the D dorian scale over a static modal vamp.',
   listenCount:20, playAlongCount:30,
   corea:{
     copy:'Transcribe Miles\'s opening chorus on "So What."',
     observe:'Note how rarely Miles plays a full scale run. Count the rests. The improvisation is largely space with short melodic gestures.',
     repeat:'Play along until you can hear the modal framework without needing to think about it.',
     extract:'Find two or three short gestures (2–4 notes) that feel like the essence of his solo.',
     apply:'Use these gestures as starting points for your own modal improvisation on "So What" and "Impressions."'
   }},

  {id:'TR8', artist:'Wes Montgomery & Jimmy Smith', tune:'Milestones', album:'The Dynamic Duo',
   book:3, unit:2, stage:'B3',
   focus:'Modal comping interaction and voicing choices — how two instruments interact in a modal context.',
   listenCount:20, playAlongCount:0,
   corea:{
     copy:'This is a guided listening project rather than a note-for-note transcription. Focus on the interaction between Montgomery and Smith.',
     observe:'When does Smith leave space for Montgomery? When do they play at the same time? Which voicings does Smith choose under Montgomery\'s lines?',
     repeat:'Listen 20+ times with specific focus each time: listen 1 for form, listen 2 for voicings, listen 3 for interaction.',
     extract:'Identify two or three comping voicings you can hear clearly. Reconstruct them on the piano.',
     apply:'Bring the comping voicings and interaction concepts into your own modal playing.'
   }},

  {id:'TR9', artist:'Wayne Shorter / Kenny Kirkland', tune:'Witch Hunt / Doctone', album:'Adam\'s Apple / Kenny Kirkland',
   book:3, unit:3, stage:'B3',
   focus:'Contrasting approaches to modal improvisation.',
   listenCount:20, playAlongCount:30,
   corea:{
     copy:'Transcribe a single chorus from each recording.',
     observe:'Compare: how does Shorter\'s approach differ from Kirkland\'s? One is more motivic, the other more scalar.',
     repeat:'Play along with both recordings, absorbing both approaches.',
     extract:'Identify one characteristic device from each player.',
     apply:'Consciously alternate between the two approaches in your own modal solos.'
   }},

  {id:'TR10', artist:'McCoy Tyner', tune:'Passion Dance', album:'The Real McCoy',
   book:3, unit:4, stage:'B3',
   focus:'Quartal voicings, rhythmic intensity, pentatonic patterns.',
   listenCount:20, playAlongCount:30,
   corea:{
     copy:'Learn the head (melody) first. Then transcribe 8 bars of Tyner\'s solo.',
     observe:'Note Tyner\'s left-hand comping: mostly quartal chords, heavy rhythmic emphasis. The right hand uses pentatonic cells almost exclusively.',
     repeat:'Play along 30 times. Try to match Tyner\'s physical intensity.',
     extract:'Find a quartal left-hand voicing that Tyner uses repeatedly. Practise it in all 12 keys.',
     apply:'Bring quartal comping and pentatonic right-hand lines into your own modal improvisation.'
   }},

  {id:'TR11', artist:'Herbie Hancock', tune:'Autumn Leaves', album:'Miles Davis: Miles in Berlin',
   book:3, unit:9, stage:'B3',
   focus:'Harmonic superimposition and motivic development over a standard.',
   listenCount:20, playAlongCount:30,
   corea:{
     copy:'Transcribe the opening 32 bars of Hancock\'s solo.',
     observe:'Note where Hancock implies different harmonies than the written chord changes. Where does he superimpose? What does he superimpose?',
     repeat:'Play along 30 times, focusing on the tension-and-release created by the superimpositions.',
     extract:'Find one instance of harmonic superimposition that you understand and can reproduce.',
     apply:'Apply the concept of harmonic superimposition to one passage in your own solo on "Autumn Leaves."'
   }},

  {id:'TR12', artist:'Brad Mehldau', tune:'I Didn\'t Know What Time It Was', album:'Art of the Trio Vol. 3',
   book:3, unit:11, stage:'B3',
   focus:'Contemporary jazz piano, odd-meter phrasing, and cross-genre influences.',
   listenCount:20, playAlongCount:30,
   corea:{
     copy:'Focus on the first chorus. Mehldau\'s lines are long — work phrase by phrase.',
     observe:'Notice Mehldau\'s use of polyrhythm and metric displacement. Where does the beat feel like it shifts?',
     repeat:'Play along 30 times. Accept that some of it will remain mysterious at first.',
     extract:'Find the rhythmic idea that generates metric displacement. Practise that idea in isolation.',
     apply:'Bring metric displacement into one phrase in your own solo on a familiar standard.'
   }}
];

/* ── CATEGORY 8: TUNE APPLICATION WORKFLOW (11 steps) ────────── */

const TUNE_APP_STEPS = [
  {n:1, name:'Learn the Melody', type:'melody',
   desc:'Learn the melody by ear or from a lead sheet. Play it in the original key with correct phrasing and articulation. Do not skip this step even if the tune is familiar — learn it well enough to hum it away from the piano.'},
  {n:2, name:'Memorize the Melody', type:'melody',
   desc:'Memorize the melody completely so it can be played without reference to written music. Only when the melody is memorized can you begin to personalize it.'},
  {n:3, name:'Personalize the Melody', type:'melody',
   desc:'Apply melody personalization techniques: syncopation, ghost notes, grace note slides, turns, double notes, back-phrasing. The melody should sound like your own statement, not a reading.'},
  {n:4, name:'Learn the Chord Progression', type:'written',
   desc:'Learn the harmony, write it out, and memorize the chord symbols and Roman numeral analysis. Know the form cold — where each chord falls, where the bridge is, what the turnarounds do.'},
  {n:5, name:'Play Voicings', type:'voicing',
   desc:'Play the chord progression using appropriate voicing types (shell voicings, Type A/B one-handed, two-handed, drop-two, etc.). All twelve keys are the eventual goal — start in the original key.'},
  {n:6, name:'Melody with Voicings', type:'coordination',
   desc:'Combine the melody in the right hand with voicings in the left hand. The coordination required here is the reason Steps 1–5 exist — both hands must be automatic.'},
  {n:7, name:'Comping Patterns', type:'coordination',
   desc:'Apply learned comping patterns to the tune\'s chord progression — Charleston, Reverse Charleston, Red Garland Rhythm, and others. Each pattern gives the tune a different rhythmic character.'},
  {n:8, name:'Improvise with Scale Patterns', type:'improv',
   desc:'Improvise over the chord changes using learned scale patterns, targeting guidetones and chord tones. Use the Scale Games and Coordination Exercises as starting material.'},
  {n:9, name:'Coordination: Improvise + Comp', type:'coordination',
   desc:'Improvise in the right hand while comping in the left hand simultaneously. This is the culminating coordination exercise applied to a real tune.'},
  {n:10, name:'Introduction and Ending', type:'melody',
   desc:'Add an introduction and ending to the tune for a complete, polished performance. Use the Introductions & Endings catalog for options.'},
  {n:11, name:'Dream Solo', type:'dream-solo',
   desc:'Record yourself performing the tune. Analyze the recording using the 17-question Self-Transcription diagnostic. Refine toward your ideal version. Repeat.'}
];

/* ── CATEGORY 9: BOSSA NOVA COMPING ──────────────────────────── */

const BOSSA_STYLES = [
  {id:'BN-1', name:'Two-Handed Voicings', source:'B1-U10', stage:6, difficulty:'Intermediate',
   desc:'Both hands play voicings together in the characteristic bossa nova rhythm. The syncopated pattern emphasises offbeats and creates the distinctive bossa groove.',
   rhythm:'Syncopated pattern emphasising offbeats — not swung, but even straight eighths with syncopation.',
   tunes:['Girl from Ipanema', 'Desafinado'],
   notes:'The key difference from swing: eighth notes are straight, not swung. The syncopation is written in; the swing feel is replaced by a Brazilian rhythmic feel.'},

  {id:'BN-2', name:'RH Comping with LH Bassline', source:'B1-U10', stage:6, difficulty:'Intermediate',
   desc:'Right hand plays comping voicings while the left hand provides a bossa nova bassline pattern. Develops the same kind of hand independence as swing coordination exercises, but in a Latin context.',
   rhythm:'RH: syncopated chord stabs. LH: bass notes on strong beats with fills.',
   tunes:['Girl from Ipanema', 'Desafinado'],
   notes:'The LH bassline is the key challenge. It must be steady and prominent while the RH comps over it.'},

  {id:'BN-3', name:'Partido Alto Rhythm Pattern', source:'B1-U10', stage:6, difficulty:'Intermediate',
   desc:'The partido alto is a specific Brazilian rhythmic pattern with a distinct syncopation profile — more complex than the basic bossa nova rhythm and more closely associated with samba.',
   rhythm:'Specific Brazilian syncopation: beat 1, "and of 2", beat 3, "and of 3", beat 4 (approximate — the exact placement varies).',
   tunes:['Girl from Ipanema', 'Desafinado'],
   notes:'More rhythmically complex than the basic bossa patterns. Master BN-1 and BN-2 first.'}
];

/* ── CATEGORY 10: INTRODUCTIONS & ENDINGS ─────────────────────── */

const INTROS_ENDINGS = [
  {id:'IE-1', name:'Last Four Measures Introduction', type:'introduction', source:'B2-U7', stage:13,
   desc:'Play the last four measures of the tune as the introduction. The most common jazz introduction — it establishes the key, tempo, and harmonic context before the head begins.',
   usage:'Works with virtually any standard. Sets the tempo and feel definitively.'},
  {id:'IE-2', name:'Vamp Introduction', type:'introduction', source:'B2-U7', stage:13,
   desc:'A repeated one- or two-measure harmonic vamp that establishes the groove before the head.',
   usage:'Modal tunes, groove-based tunes. The vamp length is flexible — two, four, or eight measures depending on the context.'},
  {id:'IE-3', name:'Rubato Introduction', type:'introduction', source:'B2-U7', stage:13,
   desc:'A free-tempo introduction that sets the mood before establishing time. Expressive, searching quality.',
   usage:'Ballads and expressive performances. Typically built from the final cadence or a melodic fragment.'},
  {id:'IE-4', name:'Scalar Run to Final Chord', type:'ending', source:'B2-U9', stage:13,
   desc:'A scalar run (ascending or descending) leading directly into the final chord. Can be diatonic or chromatic.',
   usage:'All styles. More momentum = ascending run. More finality = descending run.'},
  {id:'IE-5', name:'Arpeggiated Fill Ending', type:'ending', source:'B2-U9', stage:13,
   desc:'An arpeggiated figure through the final chord tones, often ending with a dramatic upper-register flourish.',
   usage:'Medium and up tempos. The upper-register note provides a bright, decisive ending.'},
  {id:'IE-6', name:'Count Basie Ending', type:'ending', source:'B2-U9', stage:13,
   desc:'A chromatic approach from below to the final chord, played in the Basie style with short, punctuated chords.',
   usage:'Any standard. One of the most recognisable ending devices in jazz — use sparingly for maximum effect.'},
  {id:'IE-7', name:'Simple Repeat Tag', type:'tag', source:'B2-U9', stage:13,
   desc:'Repeat the last two or four measures three times with a ritardando on the final repetition.',
   usage:'Most common tag ending. The ritardando on the last time signals the end clearly.'},
  {id:'IE-8', name:'Reharmonized Tag', type:'tag', source:'B2-U9', stage:13,
   desc:'Repeat the final phrase three times with altered harmonizations each time through.',
   usage:'Sophisticated performances where harmonic interest matters. Each repetition sounds fresh.'},
  {id:'IE-9', name:'Ritardando Tag with Final Cadence', type:'tag', source:'B2-U9', stage:13,
   desc:'A gradual ritardando over three repetitions culminating in a definitive final cadence.',
   usage:'Formal performances, end of a set. The most "composed" of the tag endings.'}
];

/* ── CATEGORY 11: MEMORIZATION TYPES ─────────────────────────── */

const MEMORY_TYPES = [
  {id:'MM1', name:'Intellectual Memory', order:1,
   desc:'Understanding the theoretical structure of the music: chord progressions, form, key relationships, and harmonic function. The foundation that supports all other memory types.',
   method:'Analyse the tune\'s harmony using Roman numerals. Know the form cold — measure count, phrase length, turnaround types.',
   exercises:['Write out the chord progression from memory', 'Identify the form sections and their lengths', 'Analyse the chord functions using Roman numerals', 'Identify any surprising or non-functional chord movements']},

  {id:'MM2', name:'Muscle Memory', order:2,
   desc:'Physical, kinesthetic memory of hand shapes, finger patterns, and physical movements at the keyboard. Developed exclusively through repetition — no amount of thinking can substitute.',
   method:'Repetitive practice of voicings, scales, and patterns until the hands move without instruction.',
   exercises:['Play tunes slowly in multiple keys, focusing on hand shapes', 'Practise voicings in all 12 keys until they feel automatic', 'Play through chord changes with eyes closed', 'Deliberately practise in unfamiliar keys']},

  {id:'MM3', name:'Aural Memory', order:3,
   desc:'The ability to hear the music internally before playing it — the most important memory type for improvisation and expressive performance. Without this, you are executing moves, not making music.',
   method:'Sing melodies and bass lines. Audiate chord progressions in your head before and while playing.',
   exercises:['Sing the melody away from the piano', 'Sing the bass line while playing the voicings', 'Hear the next chord in your head before your hands play it', 'Practise playing entirely from memory with no sheet music']},

  {id:'MM4', name:'Emotional Memory', order:4,
   desc:'The emotional connection to the music that enables expressive, meaningful performance. Often the last memory type to develop but the most powerful in performance.',
   method:'Connect with the lyrics, story, and mood of each tune. Understand what the song is about before playing it.',
   exercises:['Study the lyrics of the tune', 'Listen to vocal versions', 'Research the history of the tune', 'Perform the tune with a specific emotional intention in mind']}
];

/* ── CATEGORY 12: SELF-TRANSCRIPTION DIAGNOSTIC ──────────────── */

const SELF_TRANSCRIPTION_QS = [
  {n:1, q:'How many choruses did you play?', type:'count', example:''},
  {n:2, q:'How many different comping patterns did you use?', type:'count', example:'e.g. Charleston, Reverse Charleston, Red Garland'},
  {n:3, q:'Which comping patterns did you use?', type:'text', example:'e.g. "Charleston and Red Garland Rhythm only"'},
  {n:4, q:'Did you use lead-ins?', type:'boolean', example:'A lead-in is placed on "and of 3" or beat 4'},
  {n:5, q:'Did you use push-offs?', type:'boolean', example:'A push-off is two consecutive eighth notes in the comping'},
  {n:6, q:'Did you vary between long and short comps?', type:'boolean', example:'Did any chords sustain while others were staccato?'},
  {n:7, q:'How many different scale patterns did you use in your improvisation?', type:'count', example:''},
  {n:8, q:'Did your improvisation target guidetones (3rds and 7ths) on the downbeats?', type:'boolean', example:''},
  {n:9, q:'Describe the contour of your solo. Did it have shape and direction?', type:'text', example:'e.g. "Started low, built to a peak at chorus 2, tapered off — good shape overall"'},
  {n:10, q:'Did you leave space in your solo?', type:'boolean', example:'At least two beats of rest between some phrases'},
  {n:11, q:'Did you use any melody personalization techniques? Which ones?', type:'text', example:'e.g. "ghost notes and back-phrasing"'},
  {n:12, q:'Was your swing feel consistent throughout?', type:'boolean', example:''},
  {n:13, q:'Did your comping and improvisation coordinate well?', type:'boolean', example:'Did the LH comping feel natural while improvising?'},
  {n:14, q:'Did you use an introduction? What style?', type:'text', example:'e.g. "Last Four Measures" or "None"'},
  {n:15, q:'Did you use an ending? What style?', type:'text', example:'e.g. "Count Basie Ending" or "just stopped"'},
  {n:16, q:'What were the strongest moments in your performance?', type:'text', example:''},
  {n:17, q:'What are your top three areas for improvement?', type:'text', example:''}
];

/* ── CATALOG REGISTRY ─────────────────────────────────────────── */

const JAZZ_CATALOG_CATS = [
  {id:'coord',     name:'Coordination Exercises',      icon:'🤝', count:12, data:()=>COORD_EXERCISES,
   desc:'12 two-hand coordination drills across Books 1 and 2, each with full RH and LH breakdowns.'},
  {id:'swing',     name:'Swing Feel & Articulation',   icon:'🎵', count:6,  data:()=>SWING_EXERCISES,
   desc:'The foundational swing articulation exercises from Book 1, Units 1–2 — scat syllables and doo-VAH articulation.'},
  {id:'comping',   name:'Comping Pattern Library',     icon:'🎹', count:COMPING_PATTERNS.length, data:()=>COMPING_PATTERNS,
   desc:'Every named left-hand comping pattern across all three books, with rhythmic description and usage notes.'},
  {id:'scale',     name:'Scale Pattern Exercises',     icon:'🎼', count:24, data:()=>SCALE_PATTERNS,
   desc:'12 Book 2 functional-harmony patterns and 12 Book 3 modal patterns, from intervallic to augmented scale.'},
  {id:'melody',    name:'Melody Personalization',      icon:'🎤', count:10, data:()=>MELODY_TECHNIQUES,
   desc:'10 techniques for transforming a written melody into a personal jazz statement.'},
  {id:'trans',     name:'Transcription Projects',      icon:'📀', count:12, data:()=>TRANSCRIPTION_PROJECTS,
   desc:'12 guided COREA transcription projects (Books 2–3), each with Copy, Observe, Repeat, Extract, Apply instructions.'},
  {id:'tune',      name:'Tune Mastery Workflow',       icon:'📖', count:11, data:()=>TUNE_APP_STEPS,
   desc:'The 11-step process for deeply learning any jazz standard — from first hearing to dream solo.'},
  {id:'bossa',     name:'Bossa Nova Comping',          icon:'🌴', count:3,  data:()=>BOSSA_STYLES,
   desc:'Three bossa nova comping styles introduced in Book 1, Unit 10, applied to "Girl from Ipanema" and "Desafinado."'},
  {id:'endings',   name:'Introductions & Endings',     icon:'🎭', count:9,  data:()=>INTROS_ENDINGS,
   desc:'Three introduction types, three stock endings, and three tag endings for complete jazz performance.'},
  {id:'memory',    name:'Memorization Types',          icon:'🧠', count:4,  data:()=>MEMORY_TYPES,
   desc:'The four types of musical memory (Intellectual, Muscle, Aural, Emotional) with targeted exercises.'},
  {id:'selfana',   name:'Self-Transcription Analysis', icon:'🔍', count:17, data:()=>SELF_TRANSCRIPTION_QS,
   desc:'The 17-question diagnostic questionnaire: record yourself, fill this out, and discover what to work on next.'}
];

/* ── STATE ─────────────────────────────────────────────────────── */

function jazzCatalogUi(){
  return S._jzcat = S._jzcat || {cat:null, entryId:null};
}

function jazzSelfAnalysisState(){
  const j = jazzState();
  j.selfAnalyses = j.selfAnalyses || [];
  return j.selfAnalyses;
}

function jazzSelfAnalysisCurrent(){
  const j = jazzState();
  j.selfAnalysisDraft = j.selfAnalysisDraft || {tuneName:'', date:today(), answers:{}};
  return j.selfAnalysisDraft;
}

function jazzTranscriptionCounts(){
  const j = jazzState();
  j.transcriptionCounts = j.transcriptionCounts || {};
  return j.transcriptionCounts;
}

/* ── HTML: MAIN CATALOG PAGE ────────────────────────────────────── */

function jazzCatalogHTML(){
  const ui = jazzCatalogUi();
  if(ui.entryId && ui.cat){
    const catDef = JAZZ_CATALOG_CATS.find(c => c.id === ui.cat);
    if(catDef){
      if(ui.cat === 'selfana') return jazzSelfAnalysisHTML();
      if(ui.cat === 'tune')    return jazzTuneMasteryHTML();
      return jazzCatalogEntryHTML(ui.cat, ui.entryId, catDef);
    }
  }
  if(ui.cat){
    const catDef = JAZZ_CATALOG_CATS.find(c => c.id === ui.cat);
    if(catDef) return jazzCatalogCatHTML(ui.cat, catDef);
  }
  return `<div class="row between" style="align-items:baseline;gap:10px;flex-wrap:wrap">
    <h1 class="serif" style="margin:0">Curriculum Catalog</h1>
    <button class="btn sm ghost" id="jzCatBack">← the roadmap</button></div>
  <p class="page-blurb">The twelve reference categories from Siskind's three-book curriculum.
    Each one is a dictionary of materials, techniques, or tools — open it when you need to
    know what something is, not just that it exists.</p>
  <div class="jzcat-grid">${JAZZ_CATALOG_CATS.map(cat =>
    `<button class="jzcat-card" data-jzcat="${esc(cat.id)}">
      <span class="jzcat-icon">${cat.icon}</span>
      <b class="jzcat-name">${esc(cat.name)}</b>
      <span class="jzcat-count mono">${cat.count} ${cat.count === 1 ? 'item' : 'items'}</span>
      <p class="jzcat-desc">${esc(cat.desc)}</p>
    </button>`).join('')}</div>`;
}

/* ── HTML: ONE CATEGORY ─────────────────────────────────────────── */

function jazzCatalogCatHTML(catId, catDef){
  const items = catDef.data();
  if(catId === 'tune') return jazzTuneMasteryHTML();
  if(catId === 'selfana') return jazzSelfAnalysisHTML();

  return `<div class="row" style="gap:8px;align-items:center;margin-bottom:4px">
    <button class="btn sm ghost" id="jzCatBack2">← catalog</button>
    <span class="mono faint" style="font-size:.7rem">${esc(catDef.icon)} ${esc(catDef.name)}</span>
  </div>
  <h1 class="serif" style="margin-top:4px">${esc(catDef.name)}</h1>
  <p class="page-blurb">${esc(catDef.desc)}</p>
  <div class="jzcat-list">${items.map((item, i) =>
    `<button class="jzcat-entry" data-jzcat="${esc(catId)}" data-jzentry="${esc(item.id || String(item.n || i))}">
      <span class="jzcat-entry-tag mono">${esc(item.code || item.id || (item.n ? 'Step '+item.n : '') || '')}</span>
      <span class="jzcat-entry-name">${esc(item.name || item.tune || item.q || '')}</span>
      ${item.stage ? `<span class="jzcat-entry-stage mono">Stage ${esc(String(item.stage))}</span>` : ''}
      ${item.book  ? `<span class="jzcat-entry-book mono faint">Book ${item.book}</span>` : ''}
    </button>`).join('')}</div>`;
}

/* ── HTML: ONE ENTRY ─────────────────────────────────────────────── */

function jazzCatalogEntryHTML(catId, entryId, catDef){
  const items = catDef.data();
  const item = items.find(x => (x.id || String(x.n)) === entryId) || items[0];
  if(!item) return '<div class="empty">Entry not found.</div>';

  const backBtn = `<button class="btn sm ghost" id="jzCatBack3">← ${esc(catDef.name)}</button>`;

  if(catId === 'coord'){
    return `${backBtn}
    <h2 class="serif" style="margin-top:8px">${esc(item.name)}</h2>
    <div class="jzcat-meta mono">${esc(item.code)} · Book ${item.book}, Unit ${item.unit} · Stage ${item.stage} · ${esc(item.difficulty)}</div>
    <p class="jzcat-desc-long">${esc(item.desc)}</p>
    <div class="jzcat-hands">
      <div class="jzcat-hand rh"><span class="jzcat-hand-label">Right Hand</span><p>${esc(item.rh)}</p></div>
      <div class="jzcat-hand lh"><span class="jzcat-hand-label">Left Hand</span><p>${esc(item.lh)}</p></div>
    </div>
    <div class="jzcat-row-info">
      <span class="sc">Keys</span> <span>${esc(item.keys)}</span>
    </div>
    ${item.source ? `<div class="jzcat-row-info"><span class="sc">Source</span> <span class="mono">${esc(item.source)}</span></div>` : ''}`;
  }

  if(catId === 'comping'){
    return `${backBtn}
    <h2 class="serif" style="margin-top:8px">${esc(item.name)}</h2>
    <div class="jzcat-meta mono">Book ${item.book}, introduced Unit ${item.unitIntroduced} · Stage ${esc(String(item.stage))} · ${esc(item.type)}</div>
    <p class="jzcat-desc-long">${esc(item.desc)}</p>
    <div class="jzcat-factbox">
      <div class="jzcat-fact"><span class="sc">Rhythm</span><p>${esc(item.rhythm)}</p></div>
      ${item.notes ? `<div class="jzcat-fact"><span class="sc">Notes</span><p>${esc(item.notes)}</p></div>` : ''}
    </div>`;
  }

  if(catId === 'scale'){
    return `${backBtn}
    <h2 class="serif" style="margin-top:8px">${esc(item.name)}</h2>
    <div class="jzcat-meta mono">${esc(item.id)} · Book ${item.book}, Unit ${item.unit} · Stage ${esc(String(item.stage))} · ${esc(item.difficulty)}</div>
    <p class="jzcat-desc-long">${esc(item.desc)}</p>
    <div class="jzcat-factbox">
      <div class="jzcat-fact"><span class="sc">Keys</span><p>${esc(item.keys)}</p></div>
      <div class="jzcat-fact"><span class="sc">Intervals / Approach</span><p>${esc(item.intervals)}</p></div>
      ${item.source ? `<div class="jzcat-fact"><span class="sc">Source</span><p class="mono">${esc(item.source)}</p></div>` : ''}
    </div>`;
  }

  if(catId === 'swing'){
    return `${backBtn}
    <h2 class="serif" style="margin-top:8px">${esc(item.name)}</h2>
    <div class="jzcat-meta mono">Source: ${esc(item.source)} · Stage ${esc(String(item.stage))} · ${esc(item.difficulty)}</div>
    <p class="jzcat-desc-long">${esc(item.desc)}</p>
    ${item.syllables && item.syllables.length ? `<div class="jzcat-factbox">
      <div class="jzcat-fact"><span class="sc">Syllables</span><ul>${item.syllables.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
    </div>` : ''}
    ${item.howTo ? `<div class="jzcat-factbox"><div class="jzcat-fact"><span class="sc">How to practise</span><p>${esc(item.howTo)}</p></div></div>` : ''}`;
  }

  if(catId === 'melody'){
    return `${backBtn}
    <h2 class="serif" style="margin-top:8px">${esc(item.name)}</h2>
    <div class="jzcat-meta mono">Book ${item.book}, introduced Unit ${item.unitIntroduced} · Stage ${esc(String(item.stage))} · ${esc(item.difficulty)}</div>
    <p class="jzcat-desc-long">${esc(item.desc)}</p>
    ${item.howTo ? `<div class="jzcat-factbox"><div class="jzcat-fact"><span class="sc">How to perform it</span><p>${esc(item.howTo)}</p></div></div>` : ''}`;
  }

  if(catId === 'trans'){
    const tc = jazzTranscriptionCounts();
    const tkey = item.id;
    const lc = (tc[tkey] && tc[tkey].listens) || 0;
    const pc = (tc[tkey] && tc[tkey].playAlongs) || 0;
    const corea = item.corea || {};
    const steps = ['copy','observe','repeat','extract','apply'];
    const labels = ['Copy','Observe','Repeat','Extract','Apply'];
    return `${backBtn}
    <h2 class="serif" style="margin-top:8px">${esc(item.tune)}</h2>
    <div class="jzcat-meta mono">${esc(item.artist)} · ${item.album ? esc(item.album)+' · ' : ''}Book ${item.book}, Unit ${item.unit} · Stage ${esc(String(item.stage))}</div>
    <p class="jzcat-desc-long"><b>Focus:</b> ${esc(item.focus)}</p>
    <div class="jzcat-corea-counters">
      <div class="jzcat-counter" id="jzCatListen">
        <div class="jzcat-counter-ring" data-val="${lc}" data-target="${item.listenCount}">
          <span class="jzcat-counter-num">${lc}</span>
          <span class="jzcat-counter-of">/ ${item.listenCount}</span>
        </div>
        <span class="jzcat-counter-label">listens</span>
        <button class="tbtn" data-jzcount="${esc(item.id)}" data-jzfield="listens">+1 listen</button>
      </div>
      ${item.playAlongCount > 0 ? `<div class="jzcat-counter" id="jzCatPlay">
        <div class="jzcat-counter-ring" data-val="${pc}" data-target="${item.playAlongCount}">
          <span class="jzcat-counter-num">${pc}</span>
          <span class="jzcat-counter-of">/ ${item.playAlongCount}</span>
        </div>
        <span class="jzcat-counter-label">play-alongs</span>
        <button class="tbtn" data-jzcount="${esc(item.id)}" data-jzfield="playAlongs">+1 play-along</button>
      </div>` : ''}
    </div>
    <div class="jzcat-corea">
      <div class="sc" style="margin-bottom:8px">The COREA Process</div>
      ${steps.map((s,i) => corea[s] ? `<div class="jzcat-corea-step">
        <span class="jzcat-corea-label">${labels[i]}</span>
        <p>${esc(corea[s])}</p>
      </div>` : '').join('')}
    </div>`;
  }

  if(catId === 'bossa'){
    return `${backBtn}
    <h2 class="serif" style="margin-top:8px">${esc(item.name)}</h2>
    <div class="jzcat-meta mono">Source: ${esc(item.source)} · Stage ${esc(String(item.stage))} · ${esc(item.difficulty)}</div>
    <p class="jzcat-desc-long">${esc(item.desc)}</p>
    <div class="jzcat-factbox">
      <div class="jzcat-fact"><span class="sc">Rhythm</span><p>${esc(item.rhythm)}</p></div>
      <div class="jzcat-fact"><span class="sc">Suggested tunes</span><p>${item.tunes.join(', ')}</p></div>
      ${item.notes ? `<div class="jzcat-fact"><span class="sc">Notes</span><p>${esc(item.notes)}</p></div>` : ''}
    </div>`;
  }

  if(catId === 'endings'){
    const typeLabel = {introduction:'Introduction', ending:'Ending', tag:'Tag Ending'};
    return `${backBtn}
    <h2 class="serif" style="margin-top:8px">${esc(item.name)}</h2>
    <div class="jzcat-meta mono">${typeLabel[item.type] || ''} · Source: ${esc(item.source)} · Stage ${item.stage}</div>
    <p class="jzcat-desc-long">${esc(item.desc)}</p>
    <div class="jzcat-factbox"><div class="jzcat-fact"><span class="sc">Best for</span><p>${esc(item.usage)}</p></div></div>`;
  }

  if(catId === 'memory'){
    return `${backBtn}
    <h2 class="serif" style="margin-top:8px">${esc(item.name)}</h2>
    <p class="jzcat-desc-long">${esc(item.desc)}</p>
    <div class="jzcat-factbox">
      <div class="jzcat-fact"><span class="sc">Method</span><p>${esc(item.method)}</p></div>
      <div class="jzcat-fact"><span class="sc">Exercises</span>
        <ul>${item.exercises.map(e => `<li>${esc(e)}</li>`).join('')}</ul>
      </div>
    </div>`;
  }

  return `${backBtn}<p class="empty">Entry details coming soon.</p>`;
}

/* ── HTML: TUNE MASTERY WORKFLOW ────────────────────────────────── */

function jazzTuneMasteryHTML(){
  const j = jazzState();
  j.tuneMastery = j.tuneMastery || {tuneName:'', steps:{}};
  const tm = j.tuneMastery;
  const done = TUNE_APP_STEPS.filter(s => tm.steps[s.n]).length;

  return `<button class="btn sm ghost" id="jzCatBack4">← catalog</button>
  <h1 class="serif" style="margin-top:8px">Tune Mastery Workflow</h1>
  <p class="page-blurb">The 11-step process for deeply learning any jazz standard.
    Work through every step with one tune before moving to the next.</p>
  <div class="jzcat-tune-input">
    <label class="sc" style="display:block;margin-bottom:4px">Working on:</label>
    <input class="inp" id="jzTuneName" type="text" placeholder="name the tune" value="${esc(tm.tuneName || '')}" style="max-width:280px">
  </div>
  <div class="jzcat-progress-bar">
    <div class="jzcat-progress-fill" style="width:${Math.round(done/TUNE_APP_STEPS.length*100)}%"></div>
  </div>
  <div class="mono faint" style="font-size:.72rem;margin-bottom:12px">${done} of ${TUNE_APP_STEPS.length} steps</div>
  <div class="jzcat-steps">${TUNE_APP_STEPS.map(s =>
    `<div class="jzcat-step${tm.steps[s.n] ? ' done' : ''}" data-jzstep="${s.n}">
      <label class="jzcat-step-check">
        <input type="checkbox" ${tm.steps[s.n] ? 'checked' : ''} data-jzstepcheck="${s.n}">
        <span class="jzcat-step-n mono">${s.n}</span>
        <div class="jzcat-step-body">
          <b class="jzcat-step-name">${esc(s.name)}</b>
          <p class="jzcat-step-desc">${esc(s.desc)}</p>
        </div>
      </label>
    </div>`).join('')}
  </div>
  <div style="margin-top:14px;display:flex;gap:8px">
    <button class="btn sm ghost" id="jzTuneClear">Clear progress</button>
  </div>`;
}

/* ── HTML: SELF-TRANSCRIPTION DIAGNOSTIC ─────────────────────── */

function jazzSelfAnalysisHTML(){
  const draft = jazzSelfAnalysisCurrent();
  const saved = jazzSelfAnalysisState();

  return `<button class="btn sm ghost" id="jzCatBack5">← catalog</button>
  <h1 class="serif" style="margin-top:8px">Self-Transcription Analysis</h1>
  <p class="page-blurb">Record yourself playing a tune, then answer these 17 questions honestly.
    Save the analysis — the history of your answers over time will show you exactly how you are improving.</p>
  <div class="jzcat-selfana-head">
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <label class="sc" style="display:flex;flex-direction:column;gap:4px">
        Tune
        <input class="inp" id="jzAnaTune" type="text" placeholder="which tune?" value="${esc(draft.tuneName||'')}">
      </label>
      <label class="sc" style="display:flex;flex-direction:column;gap:4px">
        Date
        <input class="inp" id="jzAnaDate" type="date" value="${esc(draft.date||today())}">
      </label>
    </div>
  </div>
  <div class="jzcat-questions">
    ${SELF_TRANSCRIPTION_QS.map(q => {
      const val = draft.answers[q.n] || '';
      const isBool = q.type === 'boolean';
      const isCount = q.type === 'count';
      return `<div class="jzcat-q" data-jzqn="${q.n}">
        <span class="jzcat-qn mono">${q.n}</span>
        <div class="jzcat-q-body">
          <p class="jzcat-q-text">${esc(q.q)}</p>
          ${q.example ? `<p class="jzcat-q-eg faint">${esc(q.example)}</p>` : ''}
          ${isBool ? `<div class="jzcat-q-bool">
            <label><input type="radio" name="jzq${q.n}" value="yes" ${val==='yes'?'checked':''} data-jzqinput="${q.n}"> Yes</label>
            <label><input type="radio" name="jzq${q.n}" value="no"  ${val==='no'?'checked':''}  data-jzqinput="${q.n}"> No</label>
            <label><input type="radio" name="jzq${q.n}" value="partial" ${val==='partial'?'checked':''} data-jzqinput="${q.n}"> Partially</label>
          </div>` : isCount ? `<input class="inp jzcat-q-count" type="number" min="0" placeholder="0" value="${esc(String(val))}" data-jzqinput="${q.n}">` :
          `<textarea class="jzcat-q-text-in" rows="2" placeholder="your answer…" data-jzqinput="${q.n}">${esc(String(val))}</textarea>`}
        </div>
      </div>`;
    }).join('')}
  </div>
  <div class="row" style="gap:8px;margin-top:16px;flex-wrap:wrap">
    <button class="btn primary" id="jzAnaSave">Save this analysis</button>
    <button class="btn sm ghost" id="jzAnaClear">Start over</button>
  </div>
  ${saved.length > 0 ? `<div style="margin-top:20px">
    <div class="sc" style="margin-bottom:8px">Previous analyses</div>
    ${saved.slice().reverse().map(a => `<div class="jzcat-saved-ana">
      <span class="mono">${esc(a.date)}</span>
      <span>${esc(a.tuneName)}</span>
      <span class="mono faint">${Object.keys(a.answers).length} of 17 answered</span>
    </div>`).join('')}
  </div>` : ''}`;
}

/* ── EVENT BINDING ──────────────────────────────────────────────── */

function bindJazzCatalog(root){
  const back  = root.querySelector('#jzCatBack');
  const back2 = root.querySelector('#jzCatBack2');
  const back3 = root.querySelector('#jzCatBack3');
  const back4 = root.querySelector('#jzCatBack4');
  const back5 = root.querySelector('#jzCatBack5');
  const goBack = () => { jazzCatalogUi().cat = null; jazzCatalogUi().entryId = null; rerender(); };
  const goBackCat = () => { jazzCatalogUi().entryId = null; rerender(); };
  if(back)  back.onclick  = () => navigate('#/jazz');
  if(back2) back2.onclick = goBack;
  if(back3) back3.onclick = goBackCat;
  if(back4) back4.onclick = goBack;
  if(back5) back5.onclick = goBack;

  $$('[data-jzcat]', root).forEach(b => {
    b.onclick = () => {
      const ui = jazzCatalogUi();
      const catId   = b.dataset.jzcat;
      const entryId = b.dataset.jzentry;
      if(entryId){
        ui.cat = catId; ui.entryId = entryId;
      } else {
        ui.cat = catId; ui.entryId = null;
      }
      rerender();
    };
  });

  /* COREA listen/play-along counters */
  $$('[data-jzcount]', root).forEach(btn => {
    btn.onclick = () => {
      const id    = btn.dataset.jzcount;
      const field = btn.dataset.jzfield;
      const tc    = jazzTranscriptionCounts();
      if(!tc[id]) tc[id] = {};
      tc[id][field] = (tc[id][field] || 0) + 1;
      saveNow(); sound('click'); rerender();
    };
  });

  /* Tune mastery workflow */
  const tuneName = root.querySelector('#jzTuneName');
  if(tuneName) tuneName.oninput = () => {
    jazzState().tuneMastery = jazzState().tuneMastery || {tuneName:'', steps:{}};
    jazzState().tuneMastery.tuneName = tuneName.value;
    saveNow();
  };
  $$('[data-jzstepcheck]', root).forEach(cb => {
    cb.onchange = () => {
      const tm = jazzState().tuneMastery = jazzState().tuneMastery || {tuneName:'', steps:{}};
      tm.steps[Number(cb.dataset.jzstepcheck)] = cb.checked;
      saveNow(); sound('click'); rerender();
    };
  });
  const clearTune = root.querySelector('#jzTuneClear');
  if(clearTune) clearTune.onclick = () => {
    jazzState().tuneMastery = {tuneName:'', steps:{}};
    saveNow(); rerender();
  };

  /* Self-transcription diagnostic */
  const anaTune = root.querySelector('#jzAnaTune');
  const anaDate = root.querySelector('#jzAnaDate');
  if(anaTune) anaTune.oninput = () => { jazzSelfAnalysisCurrent().tuneName = anaTune.value; saveNow(); };
  if(anaDate) anaDate.oninput = () => { jazzSelfAnalysisCurrent().date = anaDate.value; saveNow(); };
  $$('[data-jzqinput]', root).forEach(el => {
    const ev = el.type === 'radio' ? 'change' : (el.tagName === 'TEXTAREA' || el.type === 'number') ? 'input' : 'change';
    el[`on${ev}`] = () => {
      const draft = jazzSelfAnalysisCurrent();
      const n = Number(el.dataset.jzqinput);
      draft.answers[n] = el.type === 'number' ? Number(el.value) : el.value;
      saveNow();
    };
  });
  const anaSave = root.querySelector('#jzAnaSave');
  if(anaSave) anaSave.onclick = () => {
    const draft = jazzSelfAnalysisCurrent();
    const saved = jazzSelfAnalysisState();
    saved.push({...draft, savedAt: Date.now()});
    jazzState().selfAnalysisDraft = null;
    saveNow(); sound('click'); rerender();
  };
  const anaClear = root.querySelector('#jzAnaClear');
  if(anaClear) anaClear.onclick = () => {
    jazzState().selfAnalysisDraft = null; saveNow(); rerender();
  };
}
