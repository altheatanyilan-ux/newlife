/* ============================================================
   THE ENRICHMENT LAYER — what a teacher says and a textbook leaves out.

   The catalogue beside this one is complete about WHAT to play. It is silent
   about everything a professor supplies in the room: the record this came
   off, the mistake everyone makes in week two, how to tell whether you
   actually have it, and what to do with it once you do. That silence is the
   whole difference between working through a book alone and being taught.

   So nine fields, at two levels.

   ON A STAGE: where this music came from, how hard it is, and how long it
   honestly takes. The last one matters more than it looks. A student four
   weeks into Type A/B voicings who thinks it should have taken one is about
   to conclude they have no talent, and the true answer — "three to five
   weeks, and most people hit a wall in the first" — is the single most
   useful thing anybody can tell them.

   ON AN EXERCISE: what to listen to, what goes wrong, how to know you have
   it, when you would ever use it, what it connects to, how to practise it,
   and one open-ended thing to make with it.

   WHAT IS WRITTEN AND WHAT IS DERIVED, because the difference should not
   have to be guessed at. Every stage here is written. Every exercise has its
   own whenToUse, connections, practiceStrategy and creativeChallenge,
   written for that exercise. The listening is written per stage and per
   exercise where a specific track belongs to it — a stage's records are the
   fallback rather than a repetition. And a mastery checklist is written
   where the source has one and DERIVED otherwise, by the escalation the
   brief asks for: slowly → at tempo → in all twelve → from memory → inside a
   tune. A derived checklist says so, so that a checkpoint nobody wrote is
   never mistaken for one somebody did.

   STAGES 6A, 13, 15, V1–V4 are now in this catalogue. Stage-level enrichment
   (historicalContext, expectedDifficulty, typicalTimeToMaster) covers all of
   them. Exercise-level enrichment is present for the key entry-point exercises
   in each new stage (6A.1, 13.1.1, V1.3); other exercises fall back to their
   stage-level data via jazzMergeEnrichment. Stages P0–12 continue to carry
   full per-exercise data as before.
   ============================================================ */

/* The five the brief names, in order, so a badge can be drawn from them. */
const JAZZ_DIFFICULTY = ['beginner', 'moderate', 'challenging', 'advanced', 'professional'];

/* ---------- the stages ---------- */
const JAZZ_STAGE_RICH = {
  'P0': {
    expectedDifficulty: 'beginner',
    typicalTimeToMaster: '1–2 weeks for the common distances — fourth, fifth, major third. Three to four weeks before the hard ones — tritone, minor seventh, major seventh — feel instant from any root. The full hundred and forty-four cells of the matrix usually take six to eight weeks of five minutes a day.',
    historicalContext: 'Interval recognition has been the foundation of Western musical training since Guido d’Arezzo invented solfège in the eleventh century. In jazz it became urgent in the bebop era of the 1940s, when Parker and Gillespie pushed tempo and harmonic density past the point where anybody could calculate consciously and keep up. Ear-training at Berklee and every other jazz school still begins here, before a single chord or scale.',
    commonMistakes: ['Drilling only from the comfortable roots. The whole point is to make G flat and B feel like C.',
      'Counting semitones on your fingers. If you are still counting, you are recognising rather than hearing — slow down.'],
    listeningAssignments: [
      {artist:'John Coltrane', track:'Giant Steps', album:'Giant Steps', year:1959, label:'Atlantic', timestamp:'0:00–0:15',
       listenFor:'Fifteen seconds. Coltrane moves through key centres a major third apart at a tempo that makes conscious calculation impossible. This is what the matrix is for.'}]},
  1: {
    expectedDifficulty: 'beginner',
    typicalTimeToMaster: 'Two to three weeks. Anybody with piano behind them gets these in a few keys quickly, but twelve roots by five chord types is sixty shapes, and the goal is instant recall rather than slow construction.',
    historicalContext: 'The three basic seventh chords — major, minor, dominant — are the harmonic vocabulary that has defined jazz since the swing era of the 1930s. Ellington’s arrangers used exactly these qualities, and every lead sheet in the Real Book is built out of them. The half-diminished came forward in bebop as the ii chord of the minor two-five-one.',
    commonMistakes: ['Playing them too low. Siskind: lowest note above the F below the staff, highest below the G above it. Low voicings are mud.',
      'Memorising four separate notes instead of the formula. A formula transposes; a handful of note names does not.'],
    listeningAssignments: [
      {artist:'Miles Davis', track:'Freddie Freeloader', album:'Kind of Blue', year:1959, label:'Columbia', timestamp:null,
       listenFor:'Siskind’s first guided listening. Follow Wynton Kelly’s piano — his chords are what defines the harmony. The major seventh has a bright, slightly nostalgic quality you will hear on every I chord.'},
      {artist:'Bill Evans', track:'Peace Piece', album:'Everybody Digs Bill Evans', year:1958, label:'Riverside', timestamp:null,
       listenFor:'A hypnotic major vamp. Listen to the shimmer of the major seventh interval itself, held for minutes at a time.'}]},
  2: {
    expectedDifficulty: 'beginner',
    typicalTimeToMaster: 'Three to four weeks for root position in all twelve. Shell voicings add another two. Most players come back to this stage for the rest of their lives — nobody finishes two-five-one practice.',
    historicalContext: 'The two-five-one is the DNA of jazz harmony, in virtually every standard written between 1920 and 1960. Porter, Gershwin and Rodgers all built songs on it, and the bebop players wrote hundreds of contrafacts — new melodies over the changes of existing tunes. Siskind: it "makes up a high percentage of the harmonic landscape of jazz standards."',
    commonMistakes: ['Only practising Siskind’s Set A (C→B♭→A♭→G♭→E→D) and never Set B (D♭→B→A→G→F→E♭). Half the keys never come round.',
      'Missing the transformation between keys: the I chord’s third and seventh drop to become the next ii. That is voice leading, not transposition.'],
    listeningAssignments: [
      {artist:'Miles Davis', track:'Tune Up', album:'Cookin’', year:1956, label:'Prestige', timestamp:null,
       listenFor:'The whole tune is two-five-ones in three keys descending by whole steps. This is the exercise you are practising, as a piece of music.'},
      {artist:'Miles Davis', track:'So What', album:'Kind of Blue', year:1959, label:'Columbia', timestamp:'0:33–1:31',
       listenFor:'At 0:33 the piano answers. Eight bars of D dorian, eight of E flat — even modal jazz leans on the sound of the ii chord.'}]},
  3: {
    expectedDifficulty: 'moderate',
    typicalTimeToMaster: 'Three to five weeks. This is where most people hit their first real wall: letting go of the root is a genuine mental shift, and feeling lost for the first week is normal rather than a sign of anything.',
    historicalContext: 'Type A and B voicings — rootless voicings, to some teachers — became standard jazz piano vocabulary in the 1950s through Red Garland, Wynton Kelly and Bill Evans. They exist because the bass player is already playing the root, and doubling it wastes the pianist’s hands. Siskind: they "place the chord’s essential tones, the thirds and sevenths, in the left hand."',
    commonMistakes: ['Forgetting the typewriter rule. Below the C under middle C, go back up — do not keep descending.',
      'Alternating A→B mechanically. Siskind’s FAQ: alternate when the bass moves in fifths; stay on the same type when it moves by step or holds.'],
    listeningAssignments: [
      {artist:'Red Garland', track:'Billy Boy', album:'Milestones', year:1958, label:'Columbia', timestamp:null,
       listenFor:'Garland’s left hand is exactly these voicings. Listen to how little the hand moves between chords.'},
      {artist:'Bill Evans', track:'Waltz for Debby', album:'Waltz for Debby', year:1961, label:'Riverside', timestamp:null,
       listenFor:'Evans made rootless voicings an art. The left hand is so smooth you barely notice the changes — that is what good voice leading buys you.'}]},
  4: {
    expectedDifficulty: 'moderate',
    typicalTimeToMaster: 'Two to three weeks for the three-note shells, then two to four more before the bass in two runs underneath without collapsing the voicing. Hand independence is a slower thing than it looks on paper.',
    historicalContext: 'Playing a bass line and a voicing at once is the solo and duo tradition — Art Tatum, Erroll Garner, Dave McKenna — and the survival skill of any pianist who accompanies a singer without a rhythm section. Stripping the left hand to three notes to free the right is the compromise that makes it possible at tempo.',
    commonMistakes: ['Letting the bass line stiffen the voicing. If the chord hand starts arriving late, the bass is being played with the wrong part of your attention.',
      'Leaving out the fifth AND the ninth. Three notes means third, seventh and one of them, not third and seventh alone.'],
    listeningAssignments: [
      {artist:'Erroll Garner', track:'Misty', album:'Contrasts', year:1954, label:'Mercury', timestamp:null,
       listenFor:'Left hand keeping time entirely on its own while the right does something else. This is the texture the exercise is building toward.'}]},
  5: {
    expectedDifficulty: 'moderate',
    typicalTimeToMaster: 'Two to three weeks for the form in four keys. Four to six before you can improvise over it confidently with voicings and a bass line going at the same time.',
    historicalContext: 'The twelve-bar blues predates jazz, in the work songs and spirituals of the nineteenth century, and became jazz’s foundation when the New Orleans players formalised the I-IV-V. The jazz version adds chromatic sophistication — two-five turnarounds, tritone subs — while keeping the twelve bars. Siskind: about a quarter of jazz standards are blues or a variation of one.',
    commonMistakes: ['Siskind’s FAQ: "The biggest problems I hear from students at this stage all have to do with rhythm and articulation." Right notes, wrong swing.',
      'Playing the blues scale over every chord. It is a safety net, not a description of the harmony.',
      'Forgetting the quick four in bar two. Jazz blues goes to IV7 in the second bar; rock blues does not.'],
    listeningAssignments: [
      {artist:'Miles Davis', track:'Freddie Freeloader', album:'Kind of Blue', year:1959, label:'Columbia', timestamp:null,
       listenFor:'The definitive jazz blues. Follow the twelve bars all the way round and hear Wynton Kelly build over each chorus.'},
      {artist:'Thelonious Monk', track:'Blue Monk', album:'Monk’s Dream', year:1962, label:'Columbia', timestamp:null,
       listenFor:'Angular melody, and comping that uses silence as a compositional tool.'},
      {artist:'Charlie Parker', track:'Billie’s Bounce', album:'The Bird on Savoy', year:1945, label:'Savoy', timestamp:null,
       listenFor:'Bebop blues. Parker implies the changes rather than spelling them out.'}]},
  6: {
    expectedDifficulty: 'challenging',
    typicalTimeToMaster: 'About a week per lick to have it in all twelve keys, so two to three months for the full ten. Using one spontaneously inside a tune is a separate skill that never really finishes.',
    historicalContext: 'Licks are the vocabulary words of the jazz language. Parker, Gillespie and the bebop pioneers built a shared melodic dictionary in the 1940s that is still in use. Siskind: "Learning to rattle off set phrases without thinking is very useful. These set phrases are a chance to internalize grammar." Knowing how to say hello does not make you a writer — but nobody speaks a language without it.',
    commonMistakes: ['Skipping steps two and four of Siskind’s four. Almost everybody learns the notes and transposes, and almost nobody practises it against comping or inside a tune.',
      'Playing a lick with flat, even dynamics. Without the doo-VAH articulation it is a scale exercise, not a phrase.'],
    listeningAssignments: [
      {artist:'Miles Davis', track:'So What', album:'Kind of Blue', year:1959, label:'Columbia', timestamp:'1:31–3:24',
       listenFor:'Short phrases, enormous space. Great improvising is not the most notes — it is the right ones with good time.'}]},
  7: {
    expectedDifficulty: 'challenging',
    typicalTimeToMaster: 'Four to six weeks for the flat-nine and sharp-five voicings, two to three for tritone substitution, three to four for the altered scale. This is the stage where the playing starts to sound like a record.',
    historicalContext: 'Altered dominants are the signature sound of bebop and everything after it; Parker’s solos are full of flat nines and sharp nines over dominant chords. The altered scale — the seventh mode of melodic minor — was later codified as the go-to sound for them. Siskind: "Musicians are permitted and expected to alter dominant chords themselves without any indication" on the page.',
    commonMistakes: ['Altering everything. Tension is only tension against something plain; a chorus of nothing but altered dominants is a wash.',
      'Learning the alterations as new chords instead of as one finger moved on a chord you already have.'],
    listeningAssignments: [
      {artist:'John Coltrane', track:'Blue Train', album:'Blue Train', year:1957, label:'Blue Note', timestamp:null,
       listenFor:'Kenny Drew’s voicings use tritone subs and alterations throughout. Follow the chromatic bass motion under them.'}]},
  8: {
    expectedDifficulty: 'challenging',
    typicalTimeToMaster: 'Four to eight weeks for the voicings and basic comping. The improvising is a lifetime: one chord for eight bars is deceptively hard, because there are no changes to hide behind.',
    historicalContext: 'Modal jazz arrived around 1959 with Kind of Blue, as musicians looked for a way out of the chord-a-beat density of bebop and into the colour of a single scale held for a long time. Davis, Coltrane, Evans, Tyner, Hancock. Siskind: "Modal jazz features slow harmonic rhythm, ambiguous tonal centers, and root movements outside the circle of fifths." The chord-scale theory that grew alongside it was systematised by George Russell in 1953 and codified at Berklee; Levine’s claim is that almost every chord symbol can be played with four scales — major, melodic minor, diminished and whole tone.',
    commonMistakes: ['Siskind’s FAQ: "Most students incorrectly define modal jazz as jazz that uses modes." It is a style — slow harmonic rhythm, root motion outside the circle of fifths, one colour explored at length.',
      'Levine’s warning: thinking of a mode as its parent scale started somewhere else. D dorian is not C major from D. It is D as home, with a minor third, a natural sixth and a minor seventh.'],
    listeningAssignments: [
      {artist:'Miles Davis', track:'So What', album:'Kind of Blue', year:1959, label:'Columbia', timestamp:'0:33',
       listenFor:'The piano entrance at 0:33 is the So What voicing itself — the single most iconic sound in modal jazz.'},
      {artist:'Herbie Hancock', track:'Maiden Voyage', album:'Maiden Voyage', year:1965, label:'Blue Note', timestamp:null,
       listenFor:'Hancock creates movement over static harmony by shifting voicings up and down the mode. Quartal and cluster colours everywhere.'},
      {artist:'McCoy Tyner', track:'Passion Dance', album:'The Real McCoy', year:1967, label:'Blue Note', timestamp:null,
       listenFor:'The quintessential quartal left hand, with tremendous power. This is what stacked fourths sound like when somebody means them.'}]},
  9: {
    expectedDifficulty: 'advanced',
    typicalTimeToMaster: 'Secondary dominants and the backdoor: three to four weeks. Diminished walk-ups: two to three. Coltrane changes: one to three months, and plateauing there is completely normal — professionals keep refining reharmonisation for their whole careers.',
    historicalContext: 'Reharmonisation has been a core jazz skill since Art Tatum’s solo reworkings of standards in the 1930s. Coltrane took it to its limit: Giant Steps (1960) moved through key centres a major third apart, a symmetrical division of the octave nobody had used systematically before, and the jazz world has been catching up since.',
    commonMistakes: ['Reharmonising before the plain version is solid. If you cannot hear what you are replacing, you cannot hear what the replacement does.',
      'Treating a substitution as a rule rather than a colour. Every V chord does not want a tritone sub.'],
    listeningAssignments: [
      {artist:'John Coltrane', track:'Countdown', album:'Giant Steps', year:1959, label:'Atlantic', timestamp:null,
       listenFor:'The changes of Tune Up with the major-third cycle substituted into every two-five-one. Play the original beside it to hear the transformation.'}]},
  10: {
    expectedDifficulty: 'advanced',
    typicalTimeToMaster: 'Three to five weeks to get outside and back in without the time falling apart. Doing it so that a listener hears it as intention rather than error is longer, and is mostly about rhythm rather than notes.',
    historicalContext: 'Playing outside as a deliberate device belongs to the 1960s — Coltrane’s quartet, Wayne Shorter, Herbie Hancock’s Blue Note records — and became a mainstream vocabulary through Chick Corea and the fusion players after them. Siskind: "Modal interchange is choosing modes other than those that match the chords."',
    commonMistakes: ['Going outside without an inside. Outside only means anything against a centre somebody can still hear.',
      'Losing the time. Everything is forgiven if the time holds, and nothing is if it does not.'],
    listeningAssignments: [
      {artist:'Herbie Hancock', track:'Dolphin Dance', album:'Maiden Voyage', year:1965, label:'Blue Note', timestamp:null,
       listenFor:'Harmony that keeps stepping sideways and landing somewhere it had no obligation to land. Follow the bass to hear where the centre actually is.'}]},
  11: {
    expectedDifficulty: 'advanced',
    typicalTimeToMaster: 'Two to four weeks each, and much faster than that if the plain blues is genuinely cold. A modal blues is a variation, and a variation on something you do not have is just notes.',
    historicalContext: 'The modal blues is what happened when the modal players turned back to the oldest form in the music. Footprints (Wayne Shorter), Equinox (Coltrane), Eighty-One (Ron Carter and Miles Davis), Matrix (Chick Corea) — the twelve bars kept, the harmony rebuilt out of sus chords, minor sevenths and fourths. Siskind: "By using modal harmonies, musicians can create alternate versions of the blues."',
    commonMistakes: ['Learning the modal versions before the plain one is automatic. The whole effect depends on the listener — and the player — knowing what is being departed from.',
      'Playing the same scale over the whole form because the chords are all one quality. Sameness of chord quality is not sameness of function.'],
    listeningAssignments: [
      {artist:'Wayne Shorter', track:'Footprints', album:'Adam’s Apple', year:1966, label:'Blue Note', timestamp:null,
       listenFor:'A minor blues in 6/8 that refuses to sit still. Hear how much of the blues survives when almost everything about the harmony has changed.'},
      {artist:'John Coltrane', track:'Equinox', album:'Coltrane’s Sound', year:1960, label:'Atlantic', timestamp:null,
       listenFor:'A minor blues at a slow tempo, with McCoy Tyner’s quartal voicings doing the harmonic work.'}]},
  12: {
    expectedDifficulty: 'professional',
    typicalTimeToMaster: 'Three to six weeks before five and seven stop feeling like counting. The composition exercises are not mastered at all — they are finished, which is a different and more useful thing.',
    historicalContext: 'Odd meters entered jazz through Dave Brubeck’s Time Out in 1959 — Take Five in 5/4, Blue Rondo à la Turk in 9/8 — and became ordinary through Don Ellis, the Mahavishnu Orchestra and the fusion generation. Siskind: "When tunes originally in 4/4 are adapted to 5/4, every other measure loses one beat. In 7/4, every other measure gains one."',
    commonMistakes: ['Counting rather than feeling. Five is not one-two-three-four-five; it is a three and a two, or a two and a three, and which one changes everything.',
      'Never finishing the composition. An unfinished piece teaches you less than a bad finished one.'],
    listeningAssignments: [
      {artist:'Dave Brubeck', track:'Take Five', album:'Time Out', year:1959, label:'Columbia', timestamp:null,
       listenFor:'The vamp is a three plus a two, every bar, for five minutes. Count it once and then stop counting and feel it.'},
      {artist:'Don Ellis', track:'Bulgarian Bulge', album:'Electric Bath', year:1967, label:'Columbia', timestamp:null,
       listenFor:'Asymmetric meter played as though it were the most natural pulse in the world.'}]},
  '6A': {
    expectedDifficulty: 'challenging',
    typicalTimeToMaster: 'Major scale modes: 3–4 weeks. Melodic minor modes: another 4–6 weeks. Diminished and whole-tone: 2 weeks. Total fluency with the chord-scale system takes 3–6 months of daily practice. This is a major milestone — many university programmes spend an entire semester on it.',
    historicalContext: 'Chord-scale theory was systematised in the 1950s by George Russell (The Lydian Chromatic Concept, 1953) and later codified at Berklee College of Music. Before it, jazz musicians learned scales by ear from recordings. Levine’s claim is that almost every chord symbol in the music can be addressed with four scale families: the major scale, the melodic minor scale, the diminished scale, and the whole-tone scale. That is one of the most elegant simplifications in jazz education.',
    commonMistakes: ['Levine’s warning: thinking of a mode as its parent scale started on a different note. D Dorian is not C major from D. It is D as home, with a minor third, a natural sixth and a minor seventh. Play it over a Dm7 drone and listen to its character.',
      'Confusing which mode belongs to which chord. The rule is short: Dorian for minor seventh, Mixolydian for dominant, Ionian for major seventh. Those three cover most of the music.',
      'Not learning the avoid notes. Levine: the fourth over a Maj7 and over a Dom7 is an avoid note in voicings, though not in melodies.'],
    listeningAssignments: [
      {artist:'Miles Davis', track:'So What', album:'Kind of Blue', year:1959, label:'Columbia', timestamp:'1:31–2:30',
       listenFor:'The whole A section is D Dorian. Miles is not thinking “C major starting on D.” He is thinking “D is home, and these are the sounds available.” That is the Dorian sound.'},
      {artist:'Herbie Hancock', track:'Maiden Voyage', album:'Maiden Voyage', year:1965, label:'Blue Note', timestamp:null,
       listenFor:'Hancock uses Dorian voicings throughout. The opening vamp is a masterclass in Dorian colour.'}]},
  13: {
    expectedDifficulty: 'advanced',
    typicalTimeToMaster: 'Generic voicings: 2–3 weeks. Miracle voicings: 3–4 weeks. Polychord fractions: 4–6 weeks. The full Berklee voicing toolkit: 2–3 months. Professional-level fluency with all voicing systems: 6–12 months.',
    historicalContext: 'Frank Mantooth (1947–2004) was a jazz pianist, arranger and educator at the University of North Texas. His Voicings for Jazz Keyboard introduced a systematic approach to contemporary voicings that deliberately avoided stacked thirds. Mantooth: “Traditional tertian voicings should be largely abandoned in favour of more sophisticated, contemporary techniques.” The Berklee system — guide tones, polychords, hybrids, quartal — represents the institutional codification of practices developed by Bill Evans, McCoy Tyner, Herbie Hancock and Chick Corea.',
    commonMistakes: ['Forgetting the Rule of Thumb: keep the right-hand thumb between middle C and the C above it. Below middle C the voicing sounds muddy; above high C it sounds thin.',
      'Not understanding that Generic Major from the tonic and from the fifth produce different voicings for the same chord. Context — what comes before and after — decides which to use.',
      'Using Generic voicings on diminished and half-diminished chords. Mantooth: the quartal construction is impossible for diminished chords, which require special treatment.'],
    listeningAssignments: [
      {artist:'Herbie Hancock', track:'Maiden Voyage', album:'Maiden Voyage', year:1965, label:'Blue Note', timestamp:null,
       listenFor:'Mantooth lists this in his recommended listening. The voicings on the title track are quartal and generic — they avoid stacked thirds and create the open, modern sound Mantooth’s system produces.'},
      {artist:'McCoy Tyner', track:'Passion Dance', album:'The Real McCoy', year:1967, label:'Blue Note', timestamp:null,
       listenFor:'The quintessential quartal left hand. This is the sound Generic voicings are designed to produce.'}]},
  15: {
    expectedDifficulty: 'advanced',
    typicalTimeToMaster: 'Two to three weeks to get through the basic constant-structure patterns. Using them inside a tune without losing the form takes another month. Creating original constant-structure passages as a compositional tool is an ongoing skill.',
    historicalContext: 'Constant structures — moving a single chord quality in parallel through a non-functional interval series — appear in Debussy and Ravel decades before jazz adapted them. In jazz they became a signature device of the post-bop era: Coltrane’s “Central Park West,” Shorter’s modal ballads, Hancock’s Blue Note records. The Berklee Book of Jazz Harmony systematises them as a complement to functional progressions, where the interest is colour and motion rather than tension and release.',
    commonMistakes: ['Treating every interval as equally usable. Parallel major triads moving by semitone is simply parallel fifths. Constant structures work best when the interval of transposition is irregular enough to destroy any functional expectation.',
      'Playing them without rhythmic interest. A voicing moving by a fixed interval every beat is a drill; the same voicing with syncopation and space is music.'],
    listeningAssignments: [
      {artist:'John Coltrane', track:'Central Park West', album:'Coltrane’s Sound', year:1960, label:'Atlantic', timestamp:null,
       listenFor:'Coltrane uses parallel chromatic motion through major seventh chords. Every chord has the same quality; none of them function in the traditional sense.'},
      {artist:'Herbie Hancock', track:'Dolphin Dance', album:'Maiden Voyage', year:1965, label:'Blue Note', timestamp:null,
       listenFor:'Listen for the passages where the harmony steps sideways with no obligation to land anywhere functional. That is the constant-structure device in a song.'}]},
  'V1': {
    expectedDifficulty: 'beginner',
    typicalTimeToMaster: 'Two to three weeks for the basic syllable shapes. Four to six before the syllable-rhythm combinations feel natural at tempo. The scat vocabulary of stage V2 is what turns these syllables into improvising.',
    historicalContext: 'Scat singing was invented by Louis Armstrong (some say accidentally, on Heebie Jeebies in 1926) and codified as a vocal jazz discipline by Ella Fitzgerald and Dizzy Gillespie’s bop collaborators in the 1940s. The syllables are not arbitrary — each one has a physical relationship to articulation, breath and pitch placement. Stoloff’s method systematises what the masters did intuitively: the vowel shapes control resonance, and the consonants control attack.',
    commonMistakes: ['Using one syllable for everything. Stoloff: the most common vowels are ah, ee and oo. Force yourself to match syllable to articulation: dah for accented, dit for staccato, dwee for legato.',
      'Ignoring the rhythm before adding the syllables. The time is not a container for the syllables — the syllables live inside the time, and the time has to exist first.',
      'Practising only at one tempo. Stoloff: start at ♩=96 and increase a little each day until you can articulate all four rhythm studies at 160 with clarity.'],
    listeningAssignments: [
      {artist:'Ella Fitzgerald', track:'How High the Moon', album:'Ella in Berlin: Mack the Knife', year:1960, label:'Verve', timestamp:null,
       listenFor:'The definitive scat performance. Notice Ella’s syllable variety — she never uses ‘doo’ for everything. Listen for ba-doo-dee-yah, shoo-bee-doo-bee-doo, and her rhythmic precision.'},
      {artist:'Bobby McFerrin', track:'Blackbird', album:'The Voice', year:1984, label:'Elektra', timestamp:null,
       listenFor:'McFerrin’s solo technique demonstrates the ultimate extension of scat: simultaneously singing melody, bass and percussion. Watch how his syllable choices match the articulation.'}]},
  'V2': {
    expectedDifficulty: 'moderate',
    typicalTimeToMaster: 'Three to four weeks for the diatonic patterns in a few keys. Two to three months before the chord-scale patterns feel natural over a moving ii-V. The material from Stoloff Chapter 2 is the bridge between syllable drills and real jazz improvisation.',
    historicalContext: 'The vocabulary of jazz vocal improvisation is built from the same melodic material as instrumental jazz — diatonic patterns, arpeggios, chord scales — but delivered through a medium that cannot play multiple notes at once and must therefore imply harmony through melody. This is why Stoloff’s method is essentially Mark Levine’s chord-scale theory applied to the voice: the same material, learned through the ear rather than through the hands.',
    commonMistakes: ['Singing patterns without connecting them to the harmony. A diatonic pattern over Dm7 and the same pattern over G7 should feel different — one is home, the other is motion.',
      'Skipping the triplet patterns. Swing feel is built from the relationship between duple and triple subdivisions, and a vocalist who has never drilled triplet scat has a metrical gap that shows.']},
  'V3': {
    expectedDifficulty: 'challenging',
    typicalTimeToMaster: 'Three to four weeks to sing a walking line cleanly on pitches. Six to eight before both the bass line and the melody feel independent. Hand independence on the piano is one thing; independence between two simultaneous melodic ideas from one throat is quite another.',
    historicalContext: 'Bass-line singing is the survival skill of the jazz vocalist without a rhythm section. Bobby McFerrin codified it as a performance technique; Stoloff teaches it as a hearing exercise. Singing the bass while improvising melody forces you to hear the harmonic motion independently from the melodic motion — which is exactly what comping pianists have to do in the other direction.',
    commonMistakes: ['Letting the bass line flatten out rhythmically. A walking bass that is technically on pitch but rhythmically inert does not walk. The swing of the bass notes is the whole point.',
      'Learning the melody and the bass separately and then expecting them to fit together. They do not. The coordination has to be practised as one thing from the beginning.']},
  'V4': {
    expectedDifficulty: 'advanced',
    typicalTimeToMaster: 'Two to three weeks per bebop line to have it transposable and in time. Using one spontaneously inside an improvisation takes several months. The goal of this stage is the same as stage 6 on the piano: a vocabulary you can reach into without thinking about it.',
    historicalContext: 'Bebop was primarily an instrumental music, and its lines were designed for brass and reeds at high speed. That vocalists absorbed and sang these lines anyway — Ella Fitzgerald, Anita O’Day, Jon Hendricks — shows the power of the melodic vocabulary. Weir’s Fearless Vocal Improvisation takes the most useful bebop phrases and systematises their application for singers: how to start a line on the and-of-two, how to resolve a chromatic enclosure, how to hear a chord tone approaching and land on it.',
    commonMistakes: ['Rushing the enclosures. A bebop lick depends on the landing note, not on the surrounding notes. If the resolution is late, the line sounds like a mistake even if every note was correct.',
      'Learning the lines without learning what they are outlining. Every bebop phrase has a chord tone at its heart; knowing which one lets you vary the approach rather than repeating the exact phrase.'],
    listeningAssignments: [
      {artist:'Ella Fitzgerald', track:'How High the Moon', album:'Ella in Berlin: Mack the Knife', year:1960, label:'Verve', timestamp:null,
       listenFor:'Ella’s bebop lines over the bridge are as accurate and as fast as any instrumentalist’s. Listen to how she implies every chord change while the rhythm section comp is minimal.'},
      {artist:'Anita O’Day', track:'Sweet Georgia Brown', album:'Anita O’Day at Mister Kelly’s', year:1958, label:'Verve', timestamp:null,
       listenFor:'A slower demonstration of the same technique: hear how the phrase-starts anticipate the bar, and how each landing note is always a chord tone.'}]},

};

/* ---------- the exercises ----------
   Keyed by the id the book gives. Anything left out of an entry falls back
   to its stage; a masteryChecklist left out is derived rather than absent,
   and says so. */
/* ---------- the stages the old ladder had no record for ----------
   The old rungs 7A–7D (now v3 Stages 6–9) were added after the stage
   records were written, and Curriculum v3 brought four stages with no old
   rung behind them at all (Stage 5, the DT track, V5 and V6). Their records
   are written here to the same standard as the rest: the history is the
   history, the records are real records, and a timestamp is only given
   where it is known. */
const JAZZ_STAGE_RICH_LATE = {
  '7A': {
    expectedDifficulty: 'challenging',
    typicalTimeToMaster: 'Six weeks for the first eight-bar transcription and the comping rhythms. The ear it builds keeps growing for as long as you keep transcribing — every solo after the first goes faster.',
    historicalContext: 'Jazz was learned from records before it was ever taught from books. Bix Beiderbecke learned from the Original Dixieland Jazz Band’s discs; Charlie Parker took Count Basie records into the Ozarks in the summer of 1937 and came back having learned Lester Young’s solos note for note. Siskind’s COREA process formalises what they did: choose a short idea, play it over a static progression, then relentlessly and elegantly through tunes until it is yours.',
    commonMistakes: ['Writing before singing. If you cannot sing the phrase with the record, you have not heard it yet — pencil comes last.',
      'Starting with a solo that is too long or too fast. Eight bars of Chet Baker teach more than a chorus of Coltrane you never finish.',
      'Comping the same rhythm in every bar. Advanced comping is mostly rhythm: vary where the chord lands, and leave space.'],
    listeningAssignments: [
      {artist:'Chet Baker', track:'But Not for Me', album:'Chet Baker Sings', year:1954, label:'Pacific Jazz', timestamp:null,
       listenFor:'The document’s milestone is a Chet Baker solo. His trumpet chorus here is melodic, mid-register and unhurried — the right first transcription.'},
      {artist:'Miles Davis', track:'Bye Bye Blackbird', album:'’Round About Midnight', year:1956, label:'Columbia', timestamp:null,
       listenFor:'Red Garland’s comping: short, syncopated, never on every beat, always answering the soloist. This is the comping the stage is building.'}]},
  '7B': {
    expectedDifficulty: 'challenging',
    typicalTimeToMaster: 'Six weeks. The minor ii-V-i voicings come in two or three; the guidetone lines and scale patterns take the rest, and hearing where a minor tune is going takes longer than playing it.',
    historicalContext: 'Minor-key standards are a large part of the repertoire — “Beautiful Love” (Victor Young, 1931), “Autumn Leaves”, “Blue Bossa” — and the minor ii-V-i is harder than the major one because the half-diminished ii and the altered V have no simple diatonic scale in common. The line cliché, one voice descending chromatically over a held minor chord, is the sound of “My Funny Valentine” and a great deal of film music since.',
    commonMistakes: ['Playing the major ii-V-I’s natural ninth on the minor ii. The ii is half-diminished: its fifth is flat, and so is the ninth of the V it leads to.',
      'Guidetone lines that leap. The point of a guidetone line is that the third and seventh move by step or hold — if it jumps, you have picked the wrong tone.',
      'Treating the minor i as Dorian every time. Many minor tunes want the melodic minor’s major seventh on the tonic.'],
    listeningAssignments: [
      {artist:'Bill Evans Trio', track:'Beautiful Love', album:'Explorations', year:1961, label:'Riverside', timestamp:null,
       listenFor:'The document’s milestone tune. Hear the half-diminished ii, the altered V, and how Evans voices the minor i with its major seventh.'},
      {artist:'Joe Henderson', track:'Blue Bossa', album:'Page One', year:1963, label:'Blue Note', timestamp:null,
       listenFor:'Kenny Dorham’s tune: a minor ii-V-i in C minor and one in D♭ major. Two kinds of cadence side by side.'},
      {artist:'Miles Davis', track:'My Funny Valentine', album:'Cookin’', year:1956, label:'Prestige', timestamp:null,
       listenFor:'The opening line cliché — C minor with its seventh sliding down a semitone at a time underneath the melody.'}]},
  '7C': {
    expectedDifficulty: 'advanced',
    typicalTimeToMaster: 'Six weeks for rhythm changes at a medium tempo, with an intro and an ending you can call. Fast rhythm changes and Barry Harris’s sixth-diminished system keep going for years.',
    historicalContext: 'Gershwin’s “I Got Rhythm” (1930) gave jazz its second form. The bebop players wrote dozens of new tunes over its chords — Ellington’s “Cotton Tail” (1940), Parker and Gillespie’s “Anthropology”, Sonny Rollins’s “Oleo” — and a jam session still calls rhythm changes more than anything but the blues. Barry Harris (1929–2021), the Detroit pianist, taught his sixth-diminished approach in New York workshops for decades; it is the bebop pianist’s way of moving through exactly this harmony.',
    commonMistakes: ['Playing the bridge as four bars of one scale each. D7–G7–C7–F7 is a chain of dominants: aim the line at the third of the next chord.',
      'Losing the A section’s I–vi–ii–V at tempo. Simplify to the tonic and the turnaround’s last chord before adding every change back.',
      'An intro in the wrong key or of the wrong length. The band has to know where bar one of the head is.'],
    listeningAssignments: [
      {artist:'Miles Davis', track:'Oleo', album:'Bags’ Groove', year:1954, label:'Prestige', timestamp:null,
       listenFor:'Sonny Rollins’s rhythm-changes head, with the piano laying out on the A sections — listen to how clearly the bass and horns still state the form.'},
      {artist:'Duke Ellington and His Orchestra', track:'Cotton Tail', album:'Never No Lament: The Blanton–Webster Band', year:1940, label:'Victor', timestamp:null,
       listenFor:'Rhythm changes from the swing era, with Ben Webster’s tenor solo. The form was a jam-session standard before bebop took it over.'}]},
  '7D': {
    expectedDifficulty: 'advanced',
    typicalTimeToMaster: 'Eight weeks, the longest of the middle stages, because solo piano asks for bass, comping and melody at once. A thirty-minute set of ballads is a real milestone, not a formality.',
    historicalContext: 'Solo jazz piano runs from the Harlem stride players — James P. Johnson, Fats Waller — through Art Tatum, whose 1933 “Tea for Two” set a standard nobody has passed, to Bill Evans’s solo albums and the lounge pianists who kept the repertoire alive in every hotel bar. Ballad playing is its own discipline: rubato over a pulse you can still feel, and phrasing behind the beat the way Billie Holiday and Frank Sinatra sang.',
    commonMistakes: ['A left hand that is too low and too busy. Walking tenths and shells are enough; the bass register muddies fast without a bassist.',
      'Rubato with no pulse under it. Stretch the time and give it back — the listener should still know where the bar is.',
      'Playing a ballad too fast. If it feels slow enough, it is probably still too fast.'],
    listeningAssignments: [
      {artist:'Bill Evans', track:'Here’s That Rainy Day', album:'Alone', year:1968, label:'Verve', timestamp:null,
       listenFor:'Solo ballad piano: the left hand carrying bass and harmony, the right singing the melody, the time elastic but never lost.'},
      {artist:'Art Tatum', track:'Tea for Two', album:'Tea for Two (78 rpm)', year:1933, label:'Brunswick', timestamp:null,
       listenFor:'Stride and runs at once. Not a model to copy — a picture of what one pair of hands can hold.'}]},
};
const JAZZ_V3_STAGE_RICH = {
  '5': {
    expectedDifficulty: 'challenging',
    typicalTimeToMaster: 'About four weeks in the v3 plan. Slash chords and diminished passing chords come quickly once seen; hearing an extended dominant chain as one long arc takes longer.',
    historicalContext: 'The devices of this stage are how the great standards move underneath their melodies. Coleman Hawkins’s 1939 “Body and Soul” made its passing diminished chords and chromatic motion famous; Victor Young’s “Stella by Starlight” is almost entirely deceptive resolutions; and “Sweet Georgia Brown” opens with a chain of dominants, each resolving to the next. Slash chords came into jazz from gospel and from the modal records of the 1960s.',
    commonMistakes: ['Reading a slash chord as its upper triad and forgetting the bass. The bass note is the point of the symbol.',
      'Voicing a passing diminished chord as a static colour. It exists to move a half step, and should be voiced so one voice does.',
      'Resolving every dominant in a chain. The chain works because each resolution is also the next dominant.'],
    listeningAssignments: [
      {artist:'Coleman Hawkins', track:'Body and Soul', album:'Body and Soul (78 rpm)', year:1939, label:'Bluebird', timestamp:null,
       listenFor:'The document’s milestone tune. Hear the passing diminished chords and the chromatic moves under Hawkins’s line.'},
      {artist:'Miles Davis', track:'Stella by Starlight', album:'1958 Miles', year:1958, label:'Columbia', timestamp:null,
       listenFor:'Chord after chord that does not go where the ear expects — the deceptive resolution as a whole song.'},
      {artist:'Thelonious Monk', track:'Bright Mississippi', album:'Monk’s Dream', year:1963, label:'Columbia', timestamp:null,
       listenFor:'Written on the changes of “Sweet Georgia Brown”: a chain of dominants, each four bars long, each resolving to the next.'}]},
  'DT': {
    expectedDifficulty: 'advanced',
    typicalTimeToMaster: 'It runs beside the piano Stages 9 to 12 and has no separate time of its own in the document. Expect the first song to take weeks; the split attention gets easier with every one.',
    historicalContext: 'Singing at the piano is its own tradition: Nat King Cole, whose trio records of the 1940s were as much about the piano as the voice; Shirley Horn, who could hold a ballad slower than anyone and accompany herself perfectly; Blossom Dearie; Diana Krall. The skill is dual-tasking — the hands on autopilot so the voice can phrase freely.',
    commonMistakes: ['Comping on the same beats the voice sings on. The piano fills between the phrases, not under them.',
      'Block chords on every beat because the voice needs support. The voice needs space; a bass note and a shell will do.',
      'Letting the time sag at the end of a sung phrase. The hands keep time even when the voice stops.'],
    listeningAssignments: [
      {artist:'Shirley Horn', track:'Here’s to Life', album:'Here’s to Life', year:1992, label:'Verve', timestamp:null,
       listenFor:'The document names Shirley Horn. Hear how little the piano does while the voice sings, and how much it says in between.'},
      {artist:'Nat King Cole Trio', track:'(Get Your Kicks on) Route 66', album:'Route 66 (78 rpm)', year:1946, label:'Capitol', timestamp:null,
       listenFor:'Voice and piano from the same person, each leaving the other room. The piano solo is the same hands without the voice.'},
      {artist:'Diana Krall', track:'Peel Me a Grape', album:'Love Scenes', year:1997, label:'Impulse!', timestamp:null,
       listenFor:'The document’s other model: sparse left hand, the voice right on the beat, the piano answering each line.'}]},
  'V5': {
    expectedDifficulty: 'advanced',
    typicalTimeToMaster: 'It runs beside the later piano stages; the document gives no separate time. Blend and tuning in a small group take weeks of singing together, not practice alone.',
    historicalContext: 'Jazz vocal groups grew out of vocalese — Eddie Jefferson and King Pleasure putting words to recorded solos in the early 1950s — and reached their height with Lambert, Hendricks & Ross, whose Sing a Song of Basie (1957) sang an entire big band’s arrangements. The Manhattan Transfer and Take 6 carried it forward. Extended techniques — overtone singing, vocal percussion, the one-voice band of Bobby McFerrin — widened what a voice can do in the music.',
    commonMistakes: ['Tuning thirds to the piano. Close harmony sings its thirds slightly lower and its fifths pure; listen to the chord, not the keyboard.',
      'Mismatched vowels. Blend is mostly vowels — everyone on the same “ah” before anyone worries about pitch.',
      'Listening only to your own part. Sing your line while hearing the chord it belongs to.'],
    listeningAssignments: [
      {artist:'Lambert, Hendricks & Ross', track:'Cloudburst', album:'The Hottest New Group in Jazz', year:1959, label:'Columbia', timestamp:null,
       listenFor:'Vocalese at full speed: three voices singing lines written for horns, and Jon Hendricks’s scat chorus.'},
      {artist:'Take 6', track:'Spread Love', album:'Take 6', year:1988, label:'Reprise', timestamp:null,
       listenFor:'Six-part close harmony a cappella, with one voice taking the bass line — the whole band in voices.'}]},
  'V6': {
    expectedDifficulty: 'professional',
    typicalTimeToMaster: 'It runs beside the last piano stages; the document gives no separate time. The first arrangement for four voices takes weeks; writing fluently for voices is a career.',
    historicalContext: 'Vocal arranging in jazz is Gene Puerling’s art above anyone’s — the Hi-Lo’s in the 1950s, the Singers Unlimited from 1971 — with harmonies as dense as any big band’s. The Manhattan Transfer’s “Birdland” (1979), Weather Report’s tune with Jon Hendricks’s words, won a Grammy for its vocal arrangement. Dobbins’s Jazz Arranging and Composing gives the same voicing principles to arrangers of every kind.',
    commonMistakes: ['Writing piano voicings for voices. Four singers cannot hold a cluster a pianist grabs without thinking; spread it and give each line a melody.',
      'Every part moving at once. Voice leading for singers means common tones held and one voice moving.',
      'Writing out of range. Keep each part where it can be sung softly as well as loudly.'],
    listeningAssignments: [
      {artist:'The Manhattan Transfer', track:'Birdland', album:'Extensions', year:1979, label:'Atlantic', timestamp:null,
       listenFor:'A band tune arranged for four voices: which lines stay in unison, and where the harmony opens up.'},
      {artist:'Take 6', track:'Spread Love', album:'Take 6', year:1988, label:'Reprise', timestamp:null,
       listenFor:'Listen to the inner voices: common tones held, one voice moving at a time — voice leading you can hear.'}]},
};

/* the two voice stages whose records had no recordings to hear */
JAZZ_STAGE_RICH.V2.listeningAssignments = [
  {artist:'Ella Fitzgerald', track:'Lady Be Good', album:'Lady Be Good (78 rpm)', year:1947, label:'Decca', timestamp:null,
   listenFor:'Scat built from the same material as these patterns: scale runs, arpeggios and repeated rhythmic cells, every one landing on the harmony.'}];
JAZZ_STAGE_RICH.V3.listeningAssignments = [
  {artist:'Bobby McFerrin', track:'Blackbird', album:'The Voice', year:1984, label:'Elektra', timestamp:null,
   listenFor:'One voice carrying the bass line and the melody at once. Follow only the low notes first, then only the tune, then both.'}];

/* ---------- what a teacher would add, when no source does ----------
   The authored layer covers the exercises the room began with. The Siskind
   unit material and the v3 document's entries arrived without it, so for
   those the four practice fields are derived from what the exercise really
   is — its type, its place on the ladder, its stage's goal and the stage's
   records — and every derived field is listed in ex.enrichDerived, which
   the page prints beside it. A field nobody wrote says so, exactly as a
   checklist nobody wrote does. */
const JAZZ_DERIVED_PRACTICE = {
  NOTATION: 'Slowly, hands separately first, then together, with the metronome on 2 and 4. Three or four keys a day round the cycle of fourths, so all twelve come round in a few days; a key is done when it is clean at a slow tempo from memory.',
  DRILL: 'Five to ten minutes a day, not an hour once a week. Slow enough to be right every time, then five beats per minute faster after three clean minutes in a row.',
  IMPROV: 'Set a timer for five minutes and play without stopping. Record it, listen back once, and choose one thing to keep for tomorrow — not ten to fix.',
  LISTEN: 'Once through for the form, once for the one instrument that matters here, then sing along with it before you try it at the piano.',
  WORKSHEET: 'Write it out by hand, then play what you wrote and check it by ear. A worksheet that never reaches the keyboard has only been half done.',
  THEORY: 'Read it, find it at the piano in one key, then find it in a tune from this stage. Understanding is done when you can hear it, not when you can say it.'};
const JAZZ_DERIVED_CHALLENGE = {
  NOTATION: n => `Take ${n} into a tune: pick one from this stage's list, find the bars where this sound belongs, and play them with it — then record a chorus.`,
  DRILL: n => `Turn ${n} into a two-bar idea you could play at a jam session, and play it in four keys without stopping.`,
  IMPROV: n => `Record three one-minute takes of ${n}, each with one rule (only three notes; only off-beats; only the top of the range), and keep the best.`,
  LISTEN: n => `After ${n}, sing the phrase you remember best, find it at the piano, and use it once in your next improvisation.`,
  WORKSHEET: n => `Write one more example for ${n} of your own, in a key the worksheet did not use, and play it.`,
  THEORY: n => `Find ${n} in a Real Book tune from this stage, mark the bars, and play them with the idea in mind.`};
const jazzLcFirst = t => String(t || '').replace(/^Can /, 'can ').replace(/^Is /, 'are ');
function jazzDerivedEnrichment(ex, order){
  const type = ex.type || 'NOTATION';
  const meta = typeof JAZZ_V3_STAGE_META === 'object' ? JAZZ_V3_STAGE_META[ex.stage] : null;
  const n = meta ? String(meta.n) : String(ex.stage);
  const row = typeof JAZZ_V3_DOC === 'object' ? (JAZZ_V3_DOC.outcomes || []).find(r => r[0] === n) : null;
  const title = row ? row[1] : ((typeof JAZZ_V3_DOC === 'object' && JAZZ_V3_DOC.overview[n]) || {}).title || '';
  const out = {};
  out.whenToUse = row
    ? `In Stage ${n === 'P0' ? 0 : n}, ${title}: by its end you ${jazzLcFirst(row[2])}. This is one of the steps there, and it is for the moment a tune on the stage's list asks for it — the milestone is to ${row[3].charAt(0).toLowerCase() + row[3].slice(1)}.`
    : `On the ${title || 'this'} track, alongside the piano stages it runs beside. Use it whenever the music you are singing or playing on those stages asks for it.`;
  const ids = (order && order[ex.stage]) || [];
  const at = ids.indexOf(ex.id);
  const name = id => { const e = jazzBookRaw && jazzBookRaw[id]; return e ? `${e.name} (${id})` : id; };
  const conns = [];
  if(at > 0) conns.push(`It follows ${name(ids[at - 1])} on the ladder, and assumes it.`);
  if(at >= 0 && at < ids.length - 1) conns.push(`It leads into ${name(ids[at + 1])}.`);
  const lad = typeof JAZZ_V3_DOC === 'object' ? (JAZZ_V3_DOC.ladder || []).filter(r => r[0] === n) : [];
  if(lad.length) conns.push(`It is heard on the stage's repertoire ladder: ${String(lad[0][1]).replace(/^Transcribe:\s*/i, '')} — ${lad[0][2]}, ${lad[0][3]}.`);
  out.connections = conns.length ? conns : [`It belongs with the rest of Stage ${n}${title ? ', ' + title : ''}.`];
  out.practiceStrategy = JAZZ_DERIVED_PRACTICE[type] || JAZZ_DERIVED_PRACTICE.NOTATION;
  out.creativeChallenge = (JAZZ_DERIVED_CHALLENGE[type] || JAZZ_DERIVED_CHALLENGE.NOTATION)(ex.name);
  return out;
}
let jazzBookRaw = null;

const JAZZ_EX_RICH = {

  /* ===== P0 — intervals ===== */
  'P0.1': {
    whenToUse: 'The first thirty seconds of any interval practice. Look at it, hear it, then close the page and do P0.11 from memory.',
    connections: ['Every chord in stage 1 is two or three of these stacked', 'The tritone here is the engine of every dominant chord in stage 7'],
    practiceStrategy: 'Play it, sing it, then play it again and check the singing was right. An interval you cannot sing is one your hands are guessing at. Two minutes, one distance, then stop.',
    creativeChallenge: 'Find this interval in a song you already know by heart. Nearly every one has an anchor somewhere in the first bar — the perfect fourth opens Here Comes the Bride, the minor seventh opens Somewhere. Once it has a song attached it stops being arithmetic.',
    masteryChecklist: ['Can play this interval from this root without hesitating',
      'Can sing it before playing it, and be right',
      'Can play it from all 12 roots',
      'Can name it by ear when somebody else plays it']},
  'P0.2': {
    whenToUse: 'Whenever a distance is solid going up and mysterious coming down — which is most of them, for most people, for longer than expected.',
    connections: ['Descending intervals are what melodic lines are made of, which is stage 6', 'A descending tritone is the V–I resolution heard backwards'],
    practiceStrategy: 'Up, then down, then up again without the pause. When the descending version stops feeling like a translation of the ascending one, move on.',
    creativeChallenge: 'Improvise a four-bar melody that only ever moves by this interval, alternating up and down. Does it sound like an idea or like an exercise? That answer is worth having.'},
  'P0.3': {
    whenToUse: 'Once a week as a calibration, rather than daily. It is the ruler, not the work.',
    connections: ['The full spectrum from unison to octave is what a chord voicing is choosing between', 'Stacked intervals are how stage 1 builds every chord type'],
    practiceStrategy: 'Slowly, and listen to the change of colour between each one and the next rather than to the notes. The step from major third to perfect fourth is where the consonance turns.',
    creativeChallenge: 'Play the staircase and stop on the one that is most uncomfortable to you. Hold it. Play something over it. Most of what makes a player sound like themselves is which dissonance they are at home in.'},
  'P0.4': {
    whenToUse: 'Melodic drilling before any improvising session — the ear that improvises is the melodic one, not the harmonic one.',
    connections: ['Stage 6’s licks are melodic intervals in a rhythm', 'The arpeggios in 6.11 are a selection from this staircase'],
    practiceStrategy: 'Root, then the note, then silence. The silence is where the ear does its work. Do not run them together until each one lands on its own.',
    creativeChallenge: 'Sing the whole staircase without the piano, then check yourself. Where you drift is exactly where your ear is weakest, and that is worth more than a week of even practice.'},
  'P0.5': {
    listeningAssignments: [
      {artist:'John Coltrane', track:'Giant Steps', album:'Giant Steps', year:1959, label:'Atlantic', timestamp:'0:00–0:15',
       listenFor:'Listen to the first fifteen seconds. Coltrane navigates major-third key centres — B, G, E flat — at breakneck tempo. Being able to calculate an interval from any root instantly, at that speed, is what the matrix enables.'}],
    commonMistakes: ['Starting too fast. Set the metronome to ♩=60 and play one interval per beat. Speed comes from accuracy, not from rushing.',
      'Only practising from the comfortable keys — C, F, G. The whole point is to make G flat and B feel as natural as C.',
      'Counting half-steps on your fingers. If you are still counting, slow down and use the song anchors until the sound is internalised.'],
    masteryChecklist: ['Can play this interval from all 12 roots in cycle-of-4ths order without pausing',
      'Can play it at ♩=100, one interval per beat',
      'Can SING the interval before playing it, from any random root',
      'Can identify the interval by ear when somebody else plays it'],
    whenToUse: 'A daily warm-up — the jazz equivalent of stretching. Two or three minutes at the start of every session, rotating which distance you drill.',
    connections: ['These same intervals become the building blocks of the chords in stage 1: a Maj7 is root + M3 + P5 + M7',
      'The circle-of-fourths order used here is the same order you will use for two-five-one practice from stage 2 onward',
      'The tritone drilled here is the engine of the dominant chords in stage 7 and of tritone substitution in 7.2'],
    practiceStrategy: 'Start with the distance you find hardest — usually the tritone, the minor sixth or the major seventh. Play it from C, then F, B flat, E flat, round the circle. When it is thoughtless at ♩=80, switch to random keys in the flashcards. Once random keys feel solid, take a new interval. Rotate daily.',
    creativeChallenge: 'Pick your favourite interval. Improvise a short melody using only that interval and its inversion over a drone. Record it. Does it sound like a musical idea or like a drill? The best jazz melodies are built from a handful of intervals used expressively.'},
  'P0.6': {
    whenToUse: 'When the circle of fourths has become a pattern in the fingers rather than a calculation. Chromatic order breaks the pattern and exposes what was being remembered instead of heard.',
    connections: ['Chromatic root motion is what the diminished walk-up in 9.3 is built on', 'Planing in 10.4 moves a whole voicing this way'],
    practiceStrategy: 'Slower than the circle version, because the physical shapes change every semitone. Where you stumble is a real weak spot rather than a slip — write those roots down and drill them alone.',
    creativeChallenge: 'Play the sprint chromatically while a metronome clicks on two and four only. Keeping the placement honest while the hand is busy is the actual skill.'},
  'P0.7': {
    whenToUse: 'Before any quartal work. The stacked fourths of stage 8 are these intervals used as a harmony rather than as a measurement.',
    connections: ['Stacked perfect fourths are the So What voicing in 8.3a and the quartal voicings in 8.3b and 8.3c',
      'The perfect fifth is the root motion of the entire circle, and so of every two-five-one'],
    practiceStrategy: 'Harmonically — both notes together — and listen for the hollowness. Perfect intervals have no third in them and therefore no mood, which is precisely why modal jazz reaches for them.',
    creativeChallenge: 'Play a melody you know over a drone of open fifths instead of chords. The tune will sound older and stranger. That is what a harmony with no third does.'},
  'P0.8': {
    whenToUse: 'Alongside stage 1’s major seventh chord, which is these four intervals with the second and sixth taken out.',
    connections: ['The major third is the soul of every major chord in stage 1', 'The major seventh is the shimmer on every I chord in a two-five-one'],
    practiceStrategy: 'All four in a row from one root, then from the next. The point is the family resemblance — what makes a major interval major — not the four facts.',
    creativeChallenge: 'Write a four-note melody using only major intervals from one root. It will sound relentlessly bright. Now add one minor interval and hear how much work a single dark note does.'},
  'P0.9': {
    whenToUse: 'Alongside stage 1’s minor and dominant sevenths — the minor third and minor seventh between them account for most of the jazz vocabulary.',
    connections: ['The minor seventh is the gravity in every dominant chord, and so in every V of stage 2',
      'The minor second is the rub that altered dominants in stage 7 are made of'],
    practiceStrategy: 'Harmonically, and hold each one longer than is comfortable. The minor second is unbearable at first and becomes a colour you reach for; that change is the practice working.',
    creativeChallenge: 'Play the same four-note melody twice — once with major intervals, once with minor. Same rhythm, same contour. The difference is the entire emotional range of the tonal system in one comparison.'},
  'P0.10': {
    listeningAssignments: [
      {artist:'Duke Ellington', track:'Ko-Ko', album:'Never No Lament: The Blanton-Webster Band', year:1940, label:'RCA Victor', timestamp:null,
       listenFor:'Written twenty years before anybody called it modal or altered. Listen to how much tension the band builds out of the tritone inside each dominant chord.'}],
    whenToUse: 'Daily, forever. There is no interval in jazz worth more time than this one.',
    connections: ['Every dominant seventh contains one, between its third and its seventh, which is why V wants to move',
      'Tritone substitution in 7.2 works only because two dominants a tritone apart share the same pair',
      'Coltrane changes in 9.6 divide the octave by major thirds, the same symmetry taken one step further'],
    practiceStrategy: 'Root, tritone, then both together, round the circle. Then find the two dominant chords that share it — G7 and D♭7 — and play them back to back. The moment that pair stops being a fact and becomes a sound is the moment stage 7 becomes easy.',
    creativeChallenge: 'Play a V–I in C. Then play the same resolution with D♭7 instead of G7. Same two notes doing the work, completely different bass. If you can hear why, you have already understood tritone substitution before reaching it.'},
  'P0.11': {
    whenToUse: 'After a week of P0.5. Recognition is not recall, and this is the only exercise here that tests recall.',
    connections: ['This is the flashcard principle the whole room is built on, at its smallest scale',
      'Pulling an interval out of the air instantly is what stage 6’s licks require at tempo'],
    practiceStrategy: 'Randomise both the root and the distance. Answer out loud before touching the keys, then play to check. Getting it wrong and hearing the correction is worth more than three right answers.',
    creativeChallenge: 'Have somebody else call out a root and an interval while you are away from the instrument, and sing the answer. If it survives without the keyboard, it is genuinely yours.',
    masteryChecklist: ['Can answer a random root and interval within two seconds',
      'Can sing the answer before playing it',
      'Can do it away from the keyboard entirely',
      'Can do it for all 12 intervals, not only the comfortable ones']},
  'P0.12': {
    whenToUse: 'As the test at the end of stage P0 rather than as daily practice. Twelve rows is the whole matrix.',
    connections: ['All 144 cells of the matrix are twelve of these', 'Running eighths across the full spectrum is the physical basis of the scalar licks in 6.2'],
    practiceStrategy: 'One row a day at ♩=60, and stop the moment it becomes counting instead of hearing. Twelve days is a full pass.',
    creativeChallenge: 'Record yourself playing one row. Listen back and mark where the tempo wobbles. Those are the distances that are not yet yours, regardless of what the fingers managed.'},

  /* ===== 1 — chord construction ===== */
  '1.1': {
    listeningAssignments: [
      {artist:'Miles Davis', track:'Freddie Freeloader', album:'Kind of Blue', year:1959, label:'Columbia', timestamp:null,
       listenFor:'Siskind’s first guided listening. Listen to Wynton Kelly’s piano — notice how his chords define the harmony. The Maj7 has a bright but nostalgic quality you will hear on the I chord.'},
      {artist:'Bill Evans', track:'Peace Piece', album:'Everybody Digs Bill Evans', year:1958, label:'Riverside', timestamp:null,
       listenFor:'Evans plays a hypnotic major vamp. Listen to the shimmering quality of the major seventh interval itself.'}],
    commonMistakes: ['Playing chords too low on the keyboard. Siskind: keep the lowest note above the F below the staff and the highest below the G above it. Low voicings sound muddy.',
      'Forgetting that the quality of a chord is decided entirely by its third and seventh. The root and fifth are the same in all three basic types.',
      'Memorising each chord as four separate notes instead of learning the formula — root, M3, P5, M7. The formula transposes; individual notes do not.'],
    masteryChecklist: ['Can build a Maj7 from any of the 12 roots within two seconds',
      'Can name the 3rd and 7th of any Maj7 instantly',
      'Can tell Maj7 from Dom7 by ear — bright and resolved against tense and wanting to move',
      'Can play all 12 Maj7 chords ascending chromatically without stopping'],
    whenToUse: 'The home base of jazz harmony — the I chord of most standards. When a lead sheet says CMaj7, F Maj7, B♭Maj7, this is what you play, until stage 3 gives you something better to play instead.',
    connections: ['These root-position chords are the raw material for the Type A and B voicings of stage 3 — the same notes, rearranged',
      'The intervals inside each type are the ones drilled in stage P0',
      'In stage 8 you learn that each chord type has a scale attached to it; the Maj7 belongs to the Ionian mode'],
    practiceStrategy: 'Siskind gives three ways to find each chord: play the scale and pick out 1-3-5-7; play the triad and add the seventh; or stack M3 + m3 + M3. Practise all three. The aim is for any of them to arrive at the same chord instantly.',
    creativeChallenge: 'Go through the Real Book and find ten tunes that start on a Maj7. Play only the first chord of each. Notice how different keys give the same formula a different colour.'},
  '1.2': {
    whenToUse: 'Every V chord in every two-five-one, and every chord in a blues. This is the most-played chord in the music.',
    connections: ['The tritone between its third and seventh is the interval drilled in P0.10 and the reason the chord resolves',
      'Every alteration in stage 7 is this chord with one note moved',
      'The Mixolydian mode in 8.1 is the scale that belongs to it'],
    practiceStrategy: 'Build it from the major seventh you already have by dropping the seventh a semitone. One finger, one chord type. Do that in all twelve before ever building one from scratch.',
    creativeChallenge: 'Play a Maj7 and a Dom7 on the same root, back to back, in all twelve keys. One note apart, and completely different intentions. Say out loud what each one wants to do next.'},
  '1.3': {
    whenToUse: 'Every ii chord in every two-five-one, and the home chord of half the modal tunes in the book.',
    connections: ['The ii of stage 2 is this chord', 'Dorian in 8.1 is the scale that belongs to it', 'Drop the fifth and you have the shell voicing of 2.2'],
    practiceStrategy: 'Build it from the dominant seventh by dropping the third a semitone. Three chord types, two moved fingers, twelve keys — that is the whole of stage 1 in one sentence.',
    creativeChallenge: 'Play Cmaj7, C7, Cmin7 in a row and hold each for four beats. Three moods on one root. Then do it in the four keys you find hardest.'},
  '1.4': {
    whenToUse: 'The ii chord of every minor two-five-one, which is most of the minor standards you will ever be asked for.',
    connections: ['2.3’s minor two-five-one opens with this chord', 'Locrian in 8.1 is its mode', 'It is also a min7 with a flattened fifth, so it is one finger from 1.3'],
    practiceStrategy: 'Build it from the minor seventh by lowering the fifth. Then hear it beside the minor seventh in the same key: the flattened fifth is what makes it unstable enough to need resolving.',
    creativeChallenge: 'Play a minor two-five-one in A minor and stop on the half-diminished chord. Sit there for a while. Everything the rest of the progression does is a response to this chord’s unease.'},
  '1.5': {
    whenToUse: 'Passing chords and chromatic walk-ups, rather than as a place to rest. It is a chord that is always going somewhere.',
    connections: ['The walk-up in 9.3 is built entirely from these', '3.3 gives it Type A and B voicings', 'It divides the octave into equal minor thirds, the same symmetry as the tritone in P0.10'],
    practiceStrategy: 'Play it from four roots and notice you have played the same four notes each time. There are only three diminished sevenths in all of music — that is the shortcut, and it is a large one.',
    creativeChallenge: 'Find a tune with a diminished chord in it and play the passage without it, then with. It almost always exists to get the bass from one diatonic note to the next. Say which two.'},

  /* ===== 2 — the inversions, the descents, the minor formulas =====
     Added with the accuracy corrections: the p.37 exercise is three
     exercises, not one, and the minor two-five-one is three formulas. */
  '2.1b': {
    whenToUse: 'Whenever the root-position version makes your hand leap. Second inversion puts the fifth on the bottom and keeps the chord where you already are.',
    connections: ['It is 2.1 with the same four notes in a different order', 'Alternating the two is 2.1c, which is the exercise both of them exist for', 'The same inversion thinking is what stage 3 does with colour tones instead of chord tones'],
    practiceStrategy: 'Learn it in C, F and B flat first, which are the three the book prints, then take it round the circle. Say the bottom note out loud as you play: it is the fifth, every time.',
    creativeChallenge: 'Play a tune using only second-inversion chords. It will sound oddly rootless and slightly suspended — which is the beginning of understanding why rootless voicings work at all.'},
  '2.1c': {
    listeningAssignments: [
      {artist:'Red Garland', track:'Billy Boy', album:'Milestones', year:1958, label:'Columbia', timestamp:null,
       listenFor:'Before the voicings, the principle: listen to how little Garland\u2019s left hand travels between chords. That economy starts here, with inversions.'}],
    commonMistakes: ['Playing it as six separate chords instead of as two journeys of three. The holds only exist if you are looking for them.',
      'Watching your hands instead of the page. The whole exercise is about the notes that DO NOT move, and you find those by ear and by feel rather than by looking.'],
    masteryChecklist: ['Can play all six bars in this key without stopping',
      'Can name, in each join, which two notes held',
      'Can play it in all 12 keys',
      'Can play it at \u2669=120, one chord per beat',
      'Can do it eyes-closed and still feel the holds'],
    whenToUse: 'Every day for a fortnight, and then whenever a new key feels clumsy. It is the exercise that teaches the hand to stop jumping.',
    connections: ['This is where voice leading starts, and everything from stage 3 onward is the same idea with better chords',
      'The descents in 2.4 take this journey through six keys without stopping',
      'The typewriter rule of stage 3 exists because of what this exercise teaches about staying put'],
    practiceStrategy: 'Slowly, and watch one voice at a time: play it through following only the bottom note, then again following only the top. When you can predict which pair will hold before you play the chord, it is yours.',
    creativeChallenge: 'Take any standard and comp it using only root position and second inversion, choosing whichever one keeps your hand still. You will find you have invented half of stage 3 by yourself.'},
  '2.4a': {
    whenToUse: 'As the twelve-key drill, rather than practising twelve separate keys. Six in one breath is a different skill from six one at a time.',
    connections: ['It is 2.1c repeated, with the join between keys added', 'The same two sets carry every later stage round the twelve keys', 'The transformation at each join is the voice leading of stage 3 in miniature'],
    practiceStrategy: 'Say the next key out loud a bar before you get there. The join is where it falls apart, and it falls apart because you were still thinking about the key you were in.',
    creativeChallenge: 'Play the whole set as one continuous piece, in time, with a metronome on two and four. Eighteen bars. Record it and listen for the bar where you hesitated — that is the key to drill on its own tomorrow.'},
  '2.4b': {
    whenToUse: 'After Set A is comfortable, and then alternating with it daily. Almost everybody practises Set A and never touches Set B.',
    connections: ['It is 2.4a in the other six keys', 'Between them the two sets are the whole circle', 'D flat, B and E flat are where most players are weakest, and all three are here'],
    practiceStrategy: 'Start with Set B rather than Set A for a week. The keys you avoid are the keys you avoid because you always start somewhere else.',
    creativeChallenge: 'Play Set A and Set B back to back without stopping. Thirty-six bars, all twelve keys, one continuous line of voice leading. That is the whole of stage 2 in about a minute.'},
  '2.3b': {
    listeningAssignments: [
      {artist:'Miles Davis', track:'Autumn Leaves', album:'Somethin\u2019 Else', year:1958, label:'Blue Note', timestamp:null,
       listenFor:'Hank Jones behind Cannonball. The tune keeps stepping between a major key and its relative minor, so you get both kinds of two-five-one in the same chorus.'}],
    whenToUse: 'The default minor two-five-one, and the one to learn first. The flat thirteen on the V and the minor sixth tonic are the sound of the minor repertoire.',
    connections: ['Its ii is the half-diminished chord of 1.4', 'Its V is the altered dominant of 7.1a', 'The quartal version of the same progression is 8.8a'],
    practiceStrategy: 'Learn the tonic chord first — a minor sixth, not a minor seventh — because that is the note most people get wrong and it is the one that makes the progression sound finished.',
    creativeChallenge: 'Play Autumn Leaves and use this formula on every minor two-five-one in it. Then play it again with the plain version from 2.3. The difference is a decade of jazz history.'},
  '2.3c': {
    whenToUse: 'When the higher-ninth version sounds too lush for the tune. The minor-major seventh tonic is colder and more classical, and some ballads want exactly that.',
    connections: ['It is 2.3b with the ninth low, the fifth natural and a different tonic', 'The minor-major seventh is the first chord of the melodic minor family that stage 7 draws on'],
    practiceStrategy: 'Play LN and HN back to back in the same key until you can hear which is which without looking. That comparison is the whole reason there are three formulas.',
    creativeChallenge: 'Find a minor ballad and play the last cadence three ways — LN, HN, and the plain 2.3. Choose one and be able to say what it is doing that the others are not.'},
  '2.3d': {
    whenToUse: 'Solo playing, where nobody else is supplying the root. Putting the root back into the voicing is what makes a rootless system work without a bass player.',
    connections: ['It is 2.3b with the root in the ninth\u2019s place', 'The same trade-off appears in the Kenny Barron voicing and in every solo-piano arrangement'],
    practiceStrategy: 'Play it with and without a bass note in the other hand. With a bass player the root here is a doubling; alone it is the foundation. Knowing which situation you are in is the skill.',
    creativeChallenge: 'Play a minor tune entirely solo using Formula R, then with a backing track using Formula HN. The same progression wants a different voicing depending on who else is in the room.'},

  /* ===== 2 — the two-five-one ===== */
  '2.1': {
    listeningAssignments: [
      {artist:'Miles Davis', track:'Tune Up', album:'Cookin’', year:1956, label:'Prestige', timestamp:null,
       listenFor:'The whole tune is built from two-five-ones in three keys descending by whole steps. This is the exact exercise you are practising, as a real song.'},
      {artist:'Miles Davis', track:'So What', album:'Kind of Blue', year:1959, label:'Columbia', timestamp:'0:33–1:31',
       listenFor:'At 0:33 the piano enters with the famous answer. Eight bars of D dorian, then eight of E flat — even modal jazz uses the sound of the ii chord.'}],
    commonMistakes: ['Not practising both whole-step descents. Siskind specifies Set A — C, B♭, A♭, G♭, E, D — and Set B — D♭, B, A, G, F, E♭. Most students only ever do Set A.',
      'Forgetting the transformation between keys: the I chord’s third and seventh drop to turn it into the next ii. That is voice leading, not transposition.',
      'Playing it fast before the voice leading is internalised. The beauty of the progression is the smooth movement between chords, not the speed.'],
    masteryChecklist: ['Can play ii-V-I in all 12 keys without pausing, in root position',
      'Can alternate root position and second inversion in all 12 keys',
      'Can play it eyes-closed in at least 6 keys',
      'Can play it at ♩=120, one chord per beat',
      'Can SING the roots of ii-V-I in any key before playing',
      'Can identify a ii-V-I by ear on a recording'],
    whenToUse: 'Everywhere. Dm7–G7–Cmaj7 is two-five-one in C; Fm7–B♭7–E♭Maj7 is two-five-one in E flat. Circle them in any tune in the Real Book and you will have circled forty to sixty per cent of the chords.',
    connections: ['The root-position version is the skeleton that stage 3 dresses in professional voice leading',
      'The modes for it — Dorian, Mixolydian, Ionian — are in stage 8, and all three share one parent scale',
      'Stage 7 adds alterations to the V and makes the whole thing sound like a record',
      'The minor version, 2.3, becomes a major focus of Siskind’s second book'],
    practiceStrategy: 'Siskind’s four steps apply here too: work out the voice leading and watch which notes hold and which move; practise it under a Charleston comping rhythm; transpose through all twelve using both whole-step descent sets; then apply it to tunes by circling every two-five-one in a standard and playing only those bars.',
    creativeChallenge: 'Take Autumn Leaves. Circle every two-five-one. Comp the whole form using nothing but root-position two-five-ones and record it. Then do it again with second inversions. The improvement is audible, and hearing it is the point.'},
  '2.2': {
    whenToUse: 'Under a singer or a horn, where four notes would be too much and two are exactly enough. Also the fastest way to learn a new tune: shells first, colour later.',
    connections: ['These two notes are the essential tones that stage 3’s voicings add colour above', 'The one-handed shells of 4.1a and 4.1b are this plus one more note'],
    practiceStrategy: 'Left hand only, third and seventh, through a whole tune. When you can hear the changes from just those two notes, you have understood what a chord actually is.',
    creativeChallenge: 'Comp a whole standard using only shells while you sing the melody. It will sound sparse and completely convincing. That is the proof that the other notes are decoration.'},
  '2.3': {
    whenToUse: 'Every minor standard — Autumn Leaves, Blue Bossa, Softly as in a Morning Sunrise, Alone Together. It is as common in the minor repertoire as the major version is in the major.',
    connections: ['Its ii is the half-diminished chord from 1.4 and its V is the flat-nine dominant of 7.1a',
      'The minor blues of 11.4 puts this progression into the twelve-bar form'],
    practiceStrategy: 'Learn it beside the major version in the same key rather than on its own. Three notes differ, and knowing exactly which three is what lets you play a minor tune the first time you see it.',
    creativeChallenge: 'Play Autumn Leaves, which alternates between a major key and its relative minor. Mark where each two-five-one is major and where it is minor. The tune is a lesson in the difference.'},

  /* ===== 3 — Type A and B ===== */
  '3.1': {
    listeningAssignments: [
      {artist:'Red Garland', track:'Billy Boy', album:'Milestones', year:1958, label:'Columbia', timestamp:null,
       listenFor:'Listen to Red’s left hand — those are exactly the Type A and B voicings you are learning. Notice how smooth the transitions between chords are.'},
      {artist:'Wynton Kelly', track:'Freddie Freeloader', album:'Kind of Blue', year:1959, label:'Columbia', timestamp:'1:31–3:24',
       listenFor:'Kelly’s solo and comping use these voicings throughout. The left hand stays in a compact range around middle C while the right hand improvises freely above it.'},
      {artist:'Bill Evans', track:'Waltz for Debby', album:'Waltz for Debby', year:1961, label:'Riverside', timestamp:null,
       listenFor:'Evans refined rootless voicings into an art form. His left hand is so smooth you barely notice the chord changes — that is the power of good voice leading.'}],
    commonMistakes: ['Forgetting the typewriter rule: when the voicings get too low, below the C under middle C, jump back up. Siskind’s FAQ: like a typewriter, go back to the middle or the top of the range.',
      'Not alternating A→B→A through the progression. Alternating is what creates the smooth voice leading — one pair of notes holds while the other steps down.',
      'Starting both types from the third. Type A is 3-7-9-5, third on the bottom; Type B is 7-3-5-9, seventh on the bottom.',
      'Always alternating A→B mechanically. Siskind’s FAQ is clear: alternate when the bass moves in fifths; stay on the same type when the bass moves by step or holds.'],
    masteryChecklist: ['Can play ii-V-I Type A start in all 12 keys without pausing',
      'Can play ii-V-I Type B start in all 12 keys',
      'Can switch between A-start and B-start on command',
      'Can play it at ♩=100 with smooth voice leading and no jumping',
      'Can comp Type A/B through a 32-bar standard such as Autumn Leaves',
      'Lowest note never drops below the C under middle C'],
    whenToUse: 'Your bread-and-butter comping voicings in a band with a bass player. Siskind: designed for playing in an ensemble, specifically when a bassist is playing a bass line and somebody else has the melody. Use them behind soloists.',
    connections: ['They use the same thirds and sevenths as the shell voicings of 2.2 — Type A and B just add the ninth and fifth above them',
      'Stage 4 strips them back to three notes so the other hand can play a bass line',
      'The quartal voicings of 8.3b serve the same purpose by the opposite means: both refuse to stack thirds'],
    practiceStrategy: 'Siskind’s order: learn the formulas for Maj7, Dom7 and min7 in both types; practise two-five-one in one key, alternating A→B→A, until it is smooth; then the two whole-step descent sets; then tunes. Start a little higher in the register than feels natural, so there is room to come down.',
    creativeChallenge: 'Comp all of Lady Bird using nothing but Type A and B under a Charleston rhythm. Then Misty. Then something with harder changes, like Stella by Starlight. The aim is choosing the voicing without thinking about choosing it.'},
  '3.2': {
    whenToUse: 'Whenever the A-start puts your hand too high or the previous chord ended in the wrong place. The two types exist so that there is always one that fits where your hand already is.',
    connections: ['It is 3.1 turned over — the same four notes in a different order', 'Its one-handed reduction is 4.1b'],
    practiceStrategy: 'Practise the same twelve keys again from the B start, and then practise switching: play two-five-one starting A, then immediately starting B, and hear which one moved less.',
    creativeChallenge: 'Take a tune and comp it twice, once starting every phrase on A and once on B. Where the B version sounds better, work out why — it will almost always be because the hand had less distance to travel.'},
  '3.3': {
    whenToUse: 'Passing chords between diatonic chords, and the walk-up of 9.3. A diminished voicing is almost never a destination.',
    connections: ['The chord itself is 1.5', 'The walk-up in 9.3 uses these voicings in sequence', 'Its symmetry means one shape serves four roots'],
    practiceStrategy: 'Because the chord is symmetrical, the voicing repeats every minor third. Learn three and you have twelve — but play all twelve anyway, so that the hand knows where it is rather than deducing it.',
    creativeChallenge: 'Insert a diminished passing chord between the I and the ii of a tune you know. Play it both ways for somebody else and ask which sounds more like a record.'},

  /* ===== 4 — one hand, and a bass ===== */
  '4.1a': {
    whenToUse: 'Solo playing, duo playing, and any moment when the right hand is busy with a melody and the left still has to say what the harmony is.',
    connections: ['It is 3.1 with one note taken out', 'It pairs with the bass line of 4.2 to make the whole solo-piano texture', 'The note kept — ninth or fifth — is the same choice stage 8’s voicings keep making'],
    practiceStrategy: 'Left hand alone, through all twelve, until the shape is automatic. Only then add anything in the right hand. A three-note voicing that needs attention is not yet three notes.',
    creativeChallenge: 'Play a standard with these in the left hand and the written melody in the right. That is a complete performance with no band. Record it and listen for where the left hand gets late.'},
  '4.1b': {
    whenToUse: 'The same as 4.1a, chosen by where your hand is rather than by preference.',
    connections: ['It is 3.2 reduced', 'Alternating it with 4.1a is what keeps a solo left hand from climbing off the keyboard'],
    practiceStrategy: 'Drill the switch rather than the shapes: two-five-one starting A, then starting B, then alternating mid-progression. The decision has to be faster than the chord.',
    creativeChallenge: 'Comp a blues with the left hand only, choosing A or B purely by which one your hand can reach without moving. If you never move more than a third, you have understood the system.'},
  '4.2': {
    whenToUse: 'Ballads and medium tempos where a walking line in four would be too busy. Two notes a bar is enough to imply a bass player.',
    connections: ['It sits under the one-handed voicings of 4.1a and 4.1b', 'A walking line in four is this exercise with the passing notes filled in', 'The root and fifth are the perfect intervals of P0.7'],
    practiceStrategy: 'Bass alone first, with the metronome on two and four, until it is boring. Then add the voicing in the same hand. The hardest part is not the notes, it is keeping the bass steady when the chord hand arrives.',
    creativeChallenge: 'Play a whole chorus with the bass in two, then a chorus with it in four. The tune changes character completely, and choosing between them is an arranging decision you now get to make.'},

  '4.1c': {
    listeningAssignments: [
      {artist:'Erroll Garner', track:'Misty', album:'Contrasts', year:1954, label:'Mercury', timestamp:null,
       listenFor:'Two hands doing two different jobs at once, with no band. That is the texture this exercise builds toward, and it is why the shell is only three notes.'}],
    commonMistakes: ['Practising the voicing and the bass separately and then expecting them to fit together. They do not; the coordination is a third thing and it has to be practised as one.',
      'Letting the bass go late whenever the chord changes. If beat three starts drifting, simplify the right hand to one chord a bar and rebuild.'],
    whenToUse: 'Solo playing, duo playing, and accompanying a singer. The moment there is no bass player in the room, this is the texture.',
    connections: ['The voicing is 4.1a or 4.1b', 'The bass is 4.2', 'Put them over the blues form and you have 5.1b'],
    practiceStrategy: 'Left hand alone until it is boring. Then add the voicing on beat one only. Then the full bar. Do not speed up until the bass stops flinching when the chord moves.',
    creativeChallenge: 'Play a standard this way from beginning to end with the melody sung rather than played. If somebody can follow the tune from your two hands alone, it works.'},

  /* ===== 5 — the blues ===== */
  '5.1': {
    listeningAssignments: [
      {artist:'Miles Davis', track:'Freddie Freeloader', album:'Kind of Blue', year:1959, label:'Columbia', timestamp:null,
       listenFor:'The definitive jazz blues. Follow the twelve-bar form: I7-IV7-I7-I7, IV7-IV7-I7-I7, ii-V-I-turnaround. Hear Wynton Kelly build intensity over each chorus.'},
      {artist:'Thelonious Monk', track:'Blue Monk', album:'Monk’s Dream', year:1962, label:'Columbia', timestamp:null,
       listenFor:'An angular melody over the same twelve bars. Listen to the comping — sparse, rhythmically unpredictable, using space as a compositional tool.'},
      {artist:'Charlie Parker', track:'Billie’s Bounce', album:'The Bird on Savoy', year:1945, label:'Savoy', timestamp:null,
       listenFor:'Bebop blues at its finest. Parker’s melody implies the changes without spelling them out literally.'}],
    commonMistakes: ['Siskind’s FAQ: "The biggest problems I hear from students at this stage all have to do with rhythm and articulation." Right notes, wrong swing — check the doo-VAH accents.',
      'Playing the blues scale over every chord. It works as a safety net but it does not outline the changes. Mix arpeggios with it.',
      'Forgetting the quick IV in bar two. The jazz blues hits IV7 in the second bar and returns to I7 — this is not the rock blues.'],
    masteryChecklist: ['Can play the 12-bar jazz blues from memory in C, F, G and B♭',
      'Can play it in all 12 keys',
      'Can comp it with Type A/B voicings',
      'Can play the blues scale in at least 4 keys',
      'Can improvise a two-chorus solo using arpeggios, blues scale and one lick'],
    whenToUse: 'The most-called form at any jam session. If you cannot play a blues you cannot sit in. It is also where jazz phrasing and swing feel are actually learnt.',
    connections: ['The turnaround in bars nine to twelve is the two-five-one of stage 2 in context',
      'The blues scale reappears in stage 11 reharmonised into modal versions',
      'The sweet scale of 5.3 is a Mixolydian fragment, which connects it to stage 8'],
    practiceStrategy: 'Memorise the form before the voicings — I-IV-I-I, IV-IV-I-I, ii-V-I-turnaround. Then two-handed A/B voicings in four keys. Then the blues scale in C, F, G and B♭. Then the AAB phrasing model: play a phrase, repeat it, answer it. Then play-one-rest-one, so the solo has sentences rather than one long run.',
    creativeChallenge: 'Learn the head of Blue Monk. Play it, then improvise two choruses on the blues scale alone, then two more mixing arpeggios and blues scale. Record both and compare. The second will sound like the changes; the first will sound like a scale.'},
  '5.2': {
    whenToUse: 'Anywhere in a blues, and sparingly everywhere else. It is the most recognisable sound in American music, which is both its power and its trap.',
    connections: ['Its flattened fifth is the tritone of P0.10', 'Stage 11 reharmonises the form underneath it', 'The sweet scale of 5.3 is its bright counterpart'],
    practiceStrategy: 'Four keys properly before twelve keys badly: C, F, G, B♭. Then phrases rather than runs — three notes and a rest, over and over, until the scale stops sounding like a scale.',
    creativeChallenge: 'Improvise a chorus using only three notes of the blues scale. Restriction is what turns a scale into a voice.'},
  '5.3': {
    whenToUse: 'Against the major-key brightness of a blues, and especially over the I and IV chords where the plain blues scale can sound relentlessly dark.',
    connections: ['It is a Mixolydian fragment, so it belongs with 8.1', 'Mixing it with 5.2 is the whole of a blues melodic vocabulary', 'Lick 6 in 6.6 is built out of it'],
    practiceStrategy: 'Alternate: one chorus sweet, one chorus blue, one chorus mixing them. The mixing is the actual skill and it is the one nobody practises.',
    creativeChallenge: 'Play a twelve-bar chorus where the first six bars are sweet and the last six are blue. That one switch is most of what makes a blues solo sound like it is going somewhere.'},

  '5.1b': {
    whenToUse: 'Every practice session once the form is memorised. The blues is where solo-piano coordination gets built, because the form repeats often enough to stop thinking about it.',
    connections: ['The form is 5.1', 'The hands are 4.1c', 'The bass formulas are 4.2', 'Everything stage 11 does to the blues is done to this'],
    practiceStrategy: 'Twelve bars, slowly, with the metronome on two and four. Keep the bass legato and low. When you can get round the form three times without the bass stumbling, add a right-hand melody on top.',
    creativeChallenge: 'Play three choruses: the first with the bass on the fifth, the second on the third, the third with chromatic neighbours. The third will sound like a bass player. Work out why.'},

  /* ===== 6 — licks ===== */
  '6.1': {
    listeningAssignments: [
      {artist:'Miles Davis', track:'So What', album:'Kind of Blue', year:1959, label:'Columbia', timestamp:'1:31–3:24',
       listenFor:'Listen to the trumpet solo. Short, simple phrases with a great deal of space. Great improvisation is not the most notes — it is the right ones with good time.'}],
    commonMistakes: ['Not following Siskind’s four steps: articulation, coordination with comping, transposition to twelve keys, application to tunes. Most students skip the second and the fourth.',
      'Playing it with flat, even dynamics. A jazz lick needs swing articulation — practise it on the scat syllables first.',
      'Only ever using it at the start of a chorus. Practise putting it in bars one, five and nine so it has somewhere else to live.'],
    masteryChecklist: ['Can play Lick 1 in all 12 keys from memory',
      'Can play it with correct swing articulation, the doo-VAH pattern',
      'Can coordinate it with Charleston comping in the left hand',
      'Can drop it naturally into a two-chorus improvisation over a standard'],
    whenToUse: 'Short-form two-five-one licks fit wherever the ii and V each last two beats and the I gets a bar. Long-form ones fit where ii and V each get a full measure.',
    connections: ['The 3-5-7-9 arpeggio shape inside it becomes the core improvising tool of 6.11',
      'The altered variants in licks 8 to 10 apply the material of stage 7',
      'The chromatic enclosures in licks 9 and 10 are a bebop technique Siskind takes much further in his second book'],
    practiceStrategy: 'Siskind’s four steps: learn the articulation on the scat syllables; practise it against Charleston and reverse-Charleston comping in the left hand; transpose using the whole-step descent sets and then random keys; then find two-five-ones in real tunes and put it in. Practise improvising INTO the lick and OUT of it — the joins are the hard part.',
    creativeChallenge: 'Modify it: change the rhythm to triplets, replace one chord tone with a neighbour, add a pickup. Make three variations that still feel like the original. That is how personal vocabulary starts.'},
  '6.2': {
    whenToUse: 'Where the ii and the V each get a whole bar — the long-form two-five-one, which is what most ballads and medium tempos give you.',
    connections: ['It is scalar where 6.1 is arpeggiated, and having both is what stops a solo sounding like one idea',
      'The parent scale it runs is the Ionian of 8.1'],
    practiceStrategy: 'Slowly enough that every note is even, because a scalar lick is where uneven fingers show. Then at tempo with the left hand comping.',
    creativeChallenge: 'Play 6.1 and 6.2 back to back over two choruses, alternating. The contrast between a leap and a run is the beginning of shape.'},
  '6.3': {
    whenToUse: 'When a line has gone stepwise for too long and needs to break. The leap on the and-of-three is what makes it memorable.',
    connections: ['The leap is an interval from P0 used expressively rather than as a measurement', 'It pairs well after 6.2, which sets it up by running'],
    practiceStrategy: 'Practise the leap alone — just those two notes, in twelve keys — before the whole phrase. The lick fails at the leap or not at all.',
    creativeChallenge: 'Take the leap out and play the lick stepwise. Notice how ordinary it becomes. Then put it back somewhere else in the phrase.'},
  '6.4': {
    whenToUse: 'Medium tempos where there is room for an arpeggio to speak. The turn at the end is what keeps it from sounding like an exercise.',
    connections: ['The 3-5-7-9 shape is exactly what 6.11 drills on its own', 'The turn is a bebop ornament that reappears in licks 9 and 10'],
    practiceStrategy: 'Arpeggio first, turn second, joined third. Most people can play both halves and stumble on the join.',
    creativeChallenge: 'Play the arpeggio with three different endings — the written turn, a straight descent, and a held note. Decide which you would actually use.'},
  '6.5': {
    whenToUse: 'Blues and minor-key playing. The double notes are pianistic rather than horn-like, and they sound like a piano player rather than a transcription.',
    connections: ['It belongs with the blues scale of 5.2', 'The minor colour connects it to the minor two-five-one of 2.3'],
    practiceStrategy: 'The double notes want a rotation of the wrist, not two fingers pressed harder. If it sounds thumpy, the hand is stiff.',
    creativeChallenge: 'Play it over a slow blues, then over a medium swing. It belongs to one of those and not to the other; find out which and say why.'},
  '6.6': {
    whenToUse: 'On the V chord in a long-form two-five-one, in a blues context, where the sweet scale is doing the work.',
    connections: ['The sweet scale of 5.3 is its raw material', 'It sets up a resolution the way the V chord of stage 2 does'],
    practiceStrategy: 'Play it against a held V chord in the left hand before ever putting it in a progression. Hear which note is the tension and land on it deliberately.',
    creativeChallenge: 'Use it as the last four bars of a blues chorus, twice in a row. Hearing a phrase come back is how a listener knows a solo has a shape.'},
  '6.7': {
    whenToUse: 'Anywhere the plain 3-5-7-9 arpeggio has started to sound like a pattern. Substituting the thirteenth for the fifth is the smallest possible sophistication.',
    connections: ['It is 6.11 with one note changed', 'The thirteenth is the natural tension of the Mixolydian mode in 8.1'],
    practiceStrategy: 'Play the plain arpeggio and the substituted one back to back in the same key until you can hear which is which without looking.',
    creativeChallenge: 'Do the same substitution on a lick of your own. One note is usually the entire difference between sounding like a student and sounding like a player.'},
  '6.8': {
    whenToUse: 'Over any V chord you want to make hungrier. This is the first lick that sounds unmistakably like modern jazz.',
    connections: ['The alterations are from stage 7', 'It resolves into the same I chord as 6.1, so they can be swapped'],
    practiceStrategy: 'Learn it over a plain dominant first, then over an altered voicing. The lick and the voicing have to agree about which alterations are in play.',
    creativeChallenge: 'Play 6.1 and 6.8 in the same chorus, in the same key, one after the other. The distance between them is the distance between stage 6 and stage 7.'},
  '6.9': {
    whenToUse: 'Where you want tension that is coloured rather than merely loud. The flat nine and sharp eleven together are a very specific flavour.',
    connections: ['Both alterations come from the altered scale of 7.3', 'The arpeggio shape is 6.11’s, with altered tones substituted'],
    practiceStrategy: 'Name the two altered notes out loud as you play them, for a week. A lick whose tensions you cannot name is a lick you cannot vary.',
    creativeChallenge: 'Replace the sharp eleven with a natural fifth and play both. One sounds like 1945 and the other like 1965. Decide which tune wants which.'},
  '6.10': {
    whenToUse: 'The full altered sound, for a V chord that is going to resolve hard. Use it once in a chorus, not four times.',
    connections: ['It is the altered scale of 7.3 as a melody', 'It goes with the combined voicings of 7.4 underneath'],
    practiceStrategy: 'Learn the scale first, then the lick. A lick built from a scale you do not have is four bars of memorised fingering.',
    creativeChallenge: 'Play the lick, then improvise four bars from the same scale. The lick is the sentence; the scale is the language. Practise moving from one to the other.'},
  '6.11': {
    whenToUse: 'Daily, as the melodic equivalent of P0.5. Arpeggio fluency is what lets a line follow the changes instead of floating over them.',
    connections: ['Almost every lick in stage 6 contains this shape', 'The chord tones are the chords of stage 1 laid out in time', 'Stage 7 alters the ninth and the fifth of the V and this shape carries the alteration'],
    practiceStrategy: 'Through the two-five-one, ascending on the ii, descending on the V, ascending on the I — then reverse it. Then randomise the direction. Direction is what stops an arpeggio exercise from becoming a physical habit.',
    creativeChallenge: 'Improvise a chorus using only chord tones — no passing notes at all. It will sound stiff and completely correct. Then add one passing note per bar and hear it come alive.'},
  '6.12': {
    whenToUse: 'Before any solo-piano playing, and whenever the left hand starts to disappear during a solo. Coordination is a separate skill from either hand.',
    connections: ['The comping rhythms are the Charleston patterns from 6.1’s practice steps',
      'The voicings are stage 3’s and the lines are stage 6’s, which is the whole point'],
    practiceStrategy: 'One hand at a time first, then together at half tempo. When they fall apart, do not slow the tempo — simplify the left hand to one chord a bar and rebuild.',
    creativeChallenge: 'Play a chorus where the left hand comps on the and-of-two only. Sparse is harder than busy, because there is nowhere for the time to hide.'},

  /* ===== 7 — altered dominants ===== */
  '7.1a': {
    whenToUse: 'On any V chord that is about to resolve, and especially on the V of a minor two-five-one, where the flat nine is practically obligatory.',
    connections: ['It is the Type A voicing of 3.1 with the ninth lowered', 'The minor two-five-one of 2.3 wants this chord', 'The full altered scale of 7.3 contains it'],
    practiceStrategy: 'Play the plain Type A and the flat-nine version back to back in the same key. One finger, and a completely different level of tension. Then all twelve.',
    creativeChallenge: 'Take a tune and play every V chord plain for one chorus and with a flat nine for the next. Ask somebody else which chorus sounded more like jazz.'},
  '7.1b': {
    whenToUse: 'The same as 7.1a, chosen by where the hand is. Having both is what lets the alteration happen without a jump.',
    connections: ['It is 3.2 with the ninth lowered', 'Alternating with 7.1a keeps the voice leading smooth through an altered two-five-one'],
    practiceStrategy: 'Drill the switch, not the shape: altered two-five-one starting A, then starting B, then choosing by which hand position you are already in.',
    creativeChallenge: 'Comp a minor blues using only altered dominants, alternating A and B. Notice how little your hand moves if you choose correctly.'},
  '7.2': {
    listeningAssignments: [
      {artist:'Miles Davis', track:'Tune Up', album:'Cookin’', year:1956, label:'Prestige', timestamp:null,
       listenFor:'Listen for moments where the bass plays a chromatic descent — D, D♭, C. That is a tritone substitution: D♭7 replacing G7 before it resolves to C.'},
      {artist:'John Coltrane', track:'Blue Train', album:'Blue Train', year:1957, label:'Blue Note', timestamp:null,
       listenFor:'Kenny Drew’s voicings use tritone subs throughout. Follow the chromatic bass motion under them.'}],
    commonMistakes: ['Substituting mechanically. A tritone sub works because the guide tones are shared — G7 has B and F; D♭7 has F and C♭, which is B. If you cannot hear why it works, voice-lead just the thirds and sevenths until you can.',
      'Siskind: use the SAME voicing type throughout rather than alternating A and B. The chromatic bass descent is the point, and switching type obscures it.',
      'Overusing it. Not every V wants substituting. It is a colour, not a default.'],
    masteryChecklist: ['Can play the tritone-sub ii-V-I — ii, ♭II7, I — in all 12 keys',
      'Can identify a tritone sub by ear, by the chromatic descending bass',
      'Can explain why it works, in terms of shared guide tones',
      'Can alternate between plain and substituted ii-V-I on the same tune'],
    whenToUse: 'When you want a chromatic descending bass line — D, D♭, C in the key of C — or a more sophisticated colour on the V. Especially effective in ballads and medium tempos where the listener can hear the bass move.',
    connections: ['This is why the altered scale works over dominants: the altered scale is the melodic minor built on the tritone sub’s root. G altered is A♭ melodic minor.',
      'The shared tritone is exactly the interval drilled in P0.10',
      'Coltrane changes in 9.6 take symmetrical key movement to its logical extreme'],
    practiceStrategy: 'Side by side: play the two-five-one plain, then immediately with the substitution, in the same key. Hear the difference before doing anything else. Then alternate chorus by chorus over a blues — plain V in one, substituted V in the next.',
    creativeChallenge: 'Take Autumn Leaves and comp it normally. Then again with a tritone sub on every V chord. Better? Worse? Different? Now a third time, using them only where your ear actually wants one.'},
  '7.3': {
    whenToUse: 'Over a dominant that is going to resolve, when you want every available tension at once. It contains all four alterations, which is its point and its danger.',
    connections: ['It is the seventh mode of melodic minor, which is the family stage 8 formalises',
      'It is the melodic minor a semitone above the chord root, which is the same scale as the tritone sub of 7.2',
      'Licks 9 and 10 in stage 6 are built out of it'],
    practiceStrategy: 'Learn it as melodic minor from a semitone up rather than as seven new notes. G altered is A♭ melodic minor. That is one fact instead of twelve scales.',
    creativeChallenge: 'Play a two-five-one and improvise four bars over the V using only this scale, resolving on the I. The resolution is what makes the tension worth it — practise landing, not just leaving.'},
  '7.4': {
    whenToUse: 'The last V chord before a final resolution, or anywhere a soloist has already built the tension and the comping needs to match it.',
    connections: ['It combines the alterations of 7.1a and 7.1b', 'Lick 10 in 6.10 is its melodic equivalent', 'The altered scale of 7.3 is where all the notes come from'],
    practiceStrategy: 'One alteration at a time, then two, then all four. A chord with four alterations learnt as a shape is a chord you cannot adjust; learnt as four decisions, it is.',
    creativeChallenge: 'Play the same V chord five ways — plain, flat nine, sharp nine, flat thirteen, fully altered — and resolve each to the same I. Rank them by how much they make you want the resolution.'},

  '7.1c': {
    whenToUse: 'A V chord that wants tension without the bite of a flat nine. The flat thirteen is the darker, broader alteration and sits well under a melody.',
    connections: ['It is the Type A or B voicing with the fifth moved up a semitone', 'Combined with the flat nine it becomes 7.4', 'The altered scale of 7.3 contains it'],
    practiceStrategy: 'Find the fifth in each voicing before you alter anything. In Type A it is the top note; in Type B it is second from the bottom. Knowing where it lives is the exercise.',
    creativeChallenge: 'Play a two-five-one three times: plain V, flat nine, flat thirteen. Name the mood of each one in a single word. Those three words are how you will choose between them at speed.'},
  '7.5': {
    whenToUse: 'The last cadence of a tune, where the tension has to land rather than merely happen.',
    connections: ['The altered chord is 7.4', 'The stepwise resolution is the voice leading of stage 3 applied to alterations', 'The thirteenth on the tonic is the same colour the quartal voicings of 8.7 lean on'],
    practiceStrategy: 'Play the altered chord and then move every finger by a step, with no leaps at all. If a finger has to jump, the altered voicing was in the wrong octave.',
    creativeChallenge: 'End three different tunes with this. Then end one of them with a plain V–I instead and see whether anybody notices the difference. They will.'},

  /* ===== 8 — modal ===== */
  '8.1': {
    listeningAssignments: [
      {artist:'Miles Davis', track:'So What', album:'Kind of Blue', year:1959, label:'Columbia', timestamp:'1:31–2:30',
       listenFor:'The whole A section is D dorian. Miles is not thinking "C major starting on D." He is thinking "D is home, and these are the sounds available." That is what a mode is.'},
      {artist:'Herbie Hancock', track:'Maiden Voyage', album:'Maiden Voyage', year:1965, label:'Blue Note', timestamp:null,
       listenFor:'The opening vamp is a masterclass in Dorian colour. Hancock uses the mode as a place rather than as a scale to run.'}],
    commonMistakes: ['Levine’s first warning: thinking of a mode as its parent scale started on a different note. D dorian is not C major from D. It is D as home, with a minor third, a natural sixth and a minor seventh. Play it over a Dm7 drone and listen to its character.',
      'Confusing which mode belongs to which chord. The rule is short: Dorian for minor seventh, Mixolydian for dominant, Ionian for major seventh. Those three cover most of the music.',
      'Not learning the avoid notes. Levine: the fourth over a Maj7 and over a Dom7 is an avoid note in voicings, though not in melodies. Phrygian avoids its flat second and flat sixth.'],
    masteryChecklist: ['Can play each of the 7 modes from memory, ascending and descending',
      'Can play any named mode starting on all 12 roots',
      'Can improvise 8 bars using only Dorian over a Dm7 drone',
      'Can name the chord type that belongs to each of the 7 modes',
      'Can tell Dorian from Aeolian by ear, by the brighter natural sixth'],
    whenToUse: 'Dorian on any minor seventh acting as a ii, and on the home chord of a modal tune. Mixolydian on any dominant. Ionian on any major seventh. Levine: on a D-7 chord, play the D Dorian mode.',
    connections: ['Dorian, Mixolydian and Ionian are the three modes of a two-five-one, and they share one parent scale',
      'The natural sixth is the single note that separates Dorian from Aeolian, and it changes the whole mood',
      'The altered scale of 7.3 belongs to the melodic minor family, which is the next set of modes after these'],
    practiceStrategy: 'Levine’s method: hold the chord in the left hand and play the mode over it, ascending and descending, starting on notes other than the root. Then connect them: D dorian into G mixolydian into C ionian through a two-five-one. Eventually you think "the key of C" and the three modes appear by themselves.',
    creativeChallenge: 'Compose a four-bar melody using only D dorian over a Dm7 drone. Then play the same RHYTHM in G mixolydian over G7, then C ionian over Cmaj7. Identical rhythms, three different emotional colours. That comparison is the whole lesson.'},
  '8.2': {
    whenToUse: 'Ear training, daily, five minutes. A mode over a drone is the only way to hear a mode as a colour rather than as a fingering.',
    connections: ['It is 8.1 with the harmony held still so the ear can work', 'It is the listening half of the modal improvising in stage 11'],
    practiceStrategy: 'Hold the drone with the left hand or a sustain pedal and play very slowly, one note at a time, listening to each degree against the root. The characteristic note — the sixth in Dorian, the second in Phrygian — is the one to sit on.',
    creativeChallenge: 'Improvise for two full minutes over one drone, without stopping and without leaving the mode. Boredom is the test: everything you play after the first thirty seconds is invention rather than recall.'},
  '8.3a': {
    listeningAssignments: [
      {artist:'Miles Davis', track:'So What', album:'Kind of Blue', year:1959, label:'Columbia', timestamp:'0:33',
       listenFor:'At 0:33 the piano entrance IS this voicing. Bill Evans plays the famous answering phrase in stacked So What voicings — the single most iconic voicing in modal jazz.'},
      {artist:'Herbie Hancock', track:'Maiden Voyage', album:'Maiden Voyage', year:1965, label:'Blue Note', timestamp:null,
       listenFor:'Hancock starts from this voicing and expands it with clusters and quartals. Notice how he creates movement over a static chord by shifting the shape up and down the mode.'},
      {artist:'Freddie Hubbard', track:'Little Sunflower', album:'Backlash', year:1966, label:'Atlantic', timestamp:null,
       listenFor:'Siskind’s guided listening for this unit. The A section sits on Dm7 throughout. Albert Dailey departs into E♭ dorian in his solo — modal interchange, heard in the wild.'}],
    commonMistakes: ['Siskind’s FAQ: "Most students incorrectly define modal jazz as jazz that uses modes." It is a style — slow harmonic rhythm, root motion outside the circle of fifths, one colour explored at length.',
      'Treating every degree of the mode as equally stable. Siskind warns that the voicings on the third and sixth of Dorian contain minor ninths: pass through them rather than resting on them.',
      'Using only this voicing for a whole tune. Siskind: nobody will mind, and perhaps nobody will notice, if a pianist switches between voicing types while comping. Mix it with quartal, cluster and pentatonic.'],
    masteryChecklist: ['Can play So What voicings beneath every note of D dorian, smoothly',
      'Can transpose them to all 12 dorian modes',
      'Can comp through So What using them, with a rhythmic melody in the top voice',
      'Can tell a stable one from an unstable one — three perfect fourths and a major third is stable; anything with a tritone or a minor ninth is a passing sound'],
    whenToUse: 'Modal tunes with slow-moving harmony — So What, Impressions, Maiden Voyage, Little Sunflower. They make an open, moody, shifting sound. They are not for fast two-five-ones, where Type A and B give clearer voice leading.',
    connections: ['It is built from the same perfect fourths drilled in P0.7',
      'The quartal voicings of 8.3b are the pure-fourths version; this adds a third on top to give it identity',
      'The pentatonic voicings of 8.6 are related — every other note of a pentatonic produces both fourths and thirds'],
    practiceStrategy: 'Siskind’s order: learn it in D dorian on the white keys; move it up and down the mode as smoothly as possible, using 3-4-5 in the right hand; add a rhythmic melody in the top voice; transpose to other dorian modes; then comp through So What from beginning to end.',
    creativeChallenge: 'Comp So What using these voicings for the A sections and something else — quartal or cluster — for the B section in E flat. Record it. Can a listener hear the contrast between the sections?'},
  '8.3b': {
    whenToUse: 'Anywhere you want harmony with no opinion about major or minor. Stacked fourths do not declare a key, which is exactly why modal playing reaches for them.',
    connections: ['It is P0.7’s perfect fourths used as harmony', 'The So What voicing of 8.3a is this with a third added on top',
      'Mantooth’s generic voicings are the same construction under another name, and they exist for the same reason: to stop stacking thirds'],
    practiceStrategy: 'Three notes, up and down the mode, both hands separately. Then in parallel with the left hand a fourth below. The shape never changes; only where it sits does.',
    creativeChallenge: 'Comp a whole modal tune using nothing but three-note quartals. It will sound modern and slightly austere. Then add one third somewhere and hear how much warmth a single interval brings back.'},
  '8.3c': {
    whenToUse: 'When three notes are not enough — the full McCoy Tyner sound, for a band that needs the piano to fill the room.',
    connections: ['It is 8.3b extended', 'Its power comes from the same perfect fourths as P0.7', 'It belongs with the drone work of 8.2, because five notes over static harmony is what modal comping is'],
    practiceStrategy: 'Two hands from the start, because five notes will not fit in one. Balance matters more than accuracy here: if the top note does not sing, the voicing is mud.',
    creativeChallenge: 'Play the same modal vamp with three-note and five-note quartals alternating every two bars. That contrast alone is enough to make a static chord sound like an arrangement.'},
  '8.3d': {
    whenToUse: 'For density and dissonance, in small amounts. A cluster is a texture rather than a harmony, and it stops working if it is the only thing you do.',
    connections: ['Its stacked seconds are the minor and major seconds of P0.8 and P0.9 used deliberately',
      'It sits beside the quartals of 8.3b as the other way to avoid stacking thirds'],
    practiceStrategy: 'Softly. A cluster played hard is noise; played quietly it is a colour. Practise the dynamic before the shape.',
    creativeChallenge: 'Put one cluster in an otherwise conventional chorus, at the highest point. One dissonance in the right place does more than twenty in the wrong one.'},
  '8.4': {
    whenToUse: 'When a modal comp needs to move without the harmony changing. A triad moving through the mode is motion over stillness.',
    connections: ['The triads are the chords of stage 1 with the sevenths removed', 'It is the simplest version of the planing in 10.4',
      'Upper structures over an altered dominant are the stage 7 sound written a different way'],
    practiceStrategy: 'Play each diatonic triad of the mode in order, slowly, over a held root. Some will sound like the chord and some like a departure — learn which is which before using them.',
    creativeChallenge: 'Improvise a comping part that only ever plays triads, over one chord, for a whole chorus. The harmony never moves and the music does.'},
  '8.5': {
    whenToUse: 'The fastest way into modal improvising. A pentatonic has no avoid notes, so it cannot be wrong, which frees the ear to think about rhythm.',
    connections: ['The primary and secondary pentatonics are subsets of the mode in 8.1',
      'The voicings of 8.6 are made from these notes',
      'It is the modal equivalent of the blues scale in 5.2 — a safety net that becomes a language'],
    practiceStrategy: 'Learn the primary one first and play nothing else for a week. Then the secondary, and then alternate. Hearing the difference between them is worth more than knowing both.',
    creativeChallenge: 'Improvise a chorus on the primary pentatonic and a second chorus on the secondary. Record it. The change of colour is entirely harmonic, because nothing else changed.'},
  '8.6': {
    whenToUse: 'Open, spread comping under a horn, where a close voicing would crowd them.',
    connections: ['It is 8.5 selected rather than run', 'The fourths it produces link it to 8.3b', 'Spread voicings are how 8.3c gets its width'],
    practiceStrategy: 'Every other note of the pentatonic, both hands, moving up the scale. Listen for where a fourth turns into a third — that inconsistency is what gives the sound its character.',
    creativeChallenge: 'Comp a modal tune using only pentatonic voicings, then only quartals, then mixing. The third version will be the one that sounds like a record.'},

  '8.7a': {
    listeningAssignments: [
      {artist:'McCoy Tyner', track:'Passion Dance', album:'The Real McCoy', year:1967, label:'Blue Note', timestamp:null,
       listenFor:'Quartal voicings used with force and with function, not only as modal colour. Follow the left hand through the changes.'}],
    whenToUse: 'A ii-V-I that should sound modern rather than pretty. Fourths refuse to spell the chord out, which leaves the harmony open in a way stacked thirds cannot.',
    connections: ['It is the fourths of P0.7 used on a functioning progression', 'The So What voicing of 8.3a is the modal version of the same idea', 'It replaces the Type A/B voicings of stage 3 rather than extending them'],
    practiceStrategy: 'Learn it in B flat first, because that is the key the book prints, and notice that the V and the I are the same three notes. Then move it round the circle one key at a time.',
    creativeChallenge: 'Comp a whole standard in quartal voicings only. It will sound like 1965. Then put one Type A voicing in at the final cadence and hear how much a third can do.'},
  '8.7b': {
    whenToUse: 'The same progression when your hand is lower on the keyboard. Two formulas exist so that there is always one you can reach.',
    connections: ['It is 8.7a in a different position', 'Choosing between them is the same decision as choosing between Type A and Type B in stage 3'],
    practiceStrategy: 'Practise switching: Formula 1, then Formula 2, in the same key, then choose by where your hand already is. The choice has to be faster than the chord.',
    creativeChallenge: 'Comp a tune alternating the two formulas from phrase to phrase. Keep the motion small. If your hand moves more than a third between chords, you chose wrong.'},
  '8.8a': {
    whenToUse: 'Minor tunes and minor blues, where quartal voicings do the harmonic work without ever spelling out the chord.',
    connections: ['It is the minor two-five-one of 2.3b in fourths', 'The modal blues of stage 11 is built on voicings like these', 'The flat ninth on the V comes from the harmonic minor'],
    practiceStrategy: 'Play it beside 2.3b in the same key. Same progression, entirely different sound, and the difference is the absence of thirds.',
    creativeChallenge: 'Play a minor blues using nothing but these. Then add one So What voicing. Then take it away again. Deciding which version you prefer is the exercise.'},
  '8.8b': {
    whenToUse: 'When the harmonic-minor version sounds too dark. The book calls this the more consonant of the two, and one chord is the whole difference.',
    connections: ['Only the V differs from 8.8a', 'The major-mode colouring is the modal interchange of stage 10 arriving early'],
    practiceStrategy: 'Alternate the two V chords over a held bass and listen. This is one of the shortest, clearest ear-training exercises in the whole room.',
    creativeChallenge: 'Play the same minor tune twice, once with each V. Ask somebody which one sounded sadder. Their answer is usually not the one theory predicts.'},

  /* ===== 9 — reharmonisation ===== */
  '9.1': {
    whenToUse: 'Anywhere a chord could use more approach than it has. A secondary dominant is the cheapest way to make a static bar move.',
    connections: ['It is the V of stage 2 aimed somewhere other than the tonic', 'The tonicisation chain of 10.2 is this repeated',
      'Every secondary dominant can be altered using stage 7'],
    practiceStrategy: 'Take a tune and put a V in front of one chord. Play it both ways. Then in front of a different chord. One insertion at a time is how the ear learns which ones it likes.',
    creativeChallenge: 'Reharmonise the first eight bars of a standard using only secondary dominants. Write the new changes down. If you cannot play from them, they were not really changes.'},
  '9.2': {
    whenToUse: 'As an alternative arrival at the tonic, particularly at the end of a bridge or in the last four bars, where the front-door two-five is predictable.',
    connections: ['It is the two-five-one of stage 2 coming from the flat seventh instead of the fifth',
      'Its sound is Mixolydian from the flat seventh, which connects it to 8.1',
      'It appears in the reharmonised blues of 11.5'],
    practiceStrategy: 'Play the plain two-five-one and the backdoor version in the same key, back to back, all twelve. The comparison is the exercise; either one alone is just a progression.',
    creativeChallenge: 'Find a standard whose last four bars use it — there are many — and play those bars with the ordinary two-five instead. Then decide which the tune actually wants.'},
  '9.3': {
    whenToUse: 'Filling a bar where the harmony would otherwise sit still, particularly between I and ii. The bass climbs chromatically and the listener feels motion that is not really there.',
    connections: ['Its chords are the diminished sevenths of 1.5 voiced as in 3.3', 'The chromatic bass links it to the tritone sub of 7.2', 'It appears inside the reharmonised blues of 11.5'],
    practiceStrategy: 'Play the bass line alone first — I, sharp I, ii, sharp ii, I over the third. If the line is not smooth by itself, the chords above it will not save it.',
    creativeChallenge: 'Insert it into the first two bars of a tune that sits on the tonic. Play the tune with and without. This is the single most useful piece of reharmonisation for making a slow tune move.'},
  '9.4': {
    whenToUse: 'The last two bars of almost any standard, and the last four of a blues. If you can play one turnaround in twelve keys, you can end any tune.',
    connections: ['Its ii and V are stage 2’s', 'Its voicings are stage 3’s', 'The longer version, 9.5, starts a step earlier'],
    practiceStrategy: 'Loop it. Eight times round without stopping, in one key, then move a whole step down. A turnaround is a thing you practise in circles because that is how it is used.',
    creativeChallenge: 'Play the last two bars of a tune with four different turnarounds — plain V, I-vi-ii-V, iii-vi-ii-V, and one with a tritone sub. Choose one and be able to say why.'},
  '9.5': {
    whenToUse: 'Where a two-bar turnaround needs more motion, or where the melody sits still long enough to let four chords through.',
    connections: ['It is 9.4 extended backwards', 'The chain of falling fifths is the circle drilled in P0.5', 'Each chord can take a secondary dominant from 9.1'],
    practiceStrategy: 'Both turnarounds in the same key, back to back, so the extra chord is a choice rather than a different exercise.',
    creativeChallenge: 'Alternate turnarounds chorus by chorus through a blues. By the fourth chorus you will be choosing them by ear, which is the point.'},
  '9.6': {
    listeningAssignments: [
      {artist:'John Coltrane', track:'Giant Steps', album:'Giant Steps', year:1959, label:'Atlantic', timestamp:null,
       listenFor:'The most famous example of the major-third cycle. The tempo is extreme and the key centre changes every two beats. Listen to Tommy Flanagan’s piano solo struggle with the changes, then to Coltrane glide through them. That contrast is what preparation sounds like.'},
      {artist:'John Coltrane', track:'Countdown', album:'Giant Steps', year:1959, label:'Atlantic', timestamp:null,
       listenFor:'The same substitution applied to the changes of Tune Up. Play Tune Up beside it to hear exactly what was done.'}],
    commonMistakes: ['Attempting it before two-five-one is fluent in all twelve keys. The pattern moves through three key centres in quick succession; if any key is slow, it collapses.',
      'Thinking about it harmonically rather than geometrically. It divides the octave into three equal parts. Three two-five-ones whose tonics are a major third apart.',
      'Only voicing the chords. You have to be able to improvise through the key centres, not merely accompany them.'],
    masteryChecklist: ['Can play the major-3rd cycle descending in all 12 keys',
      'Can voice-lead through the pattern without jumping',
      'Can hear the resolution to each temporary tonic',
      'Can comp the A section of Giant Steps at ♩=100',
      'Can improvise through it with arpeggios for two choruses'],
    whenToUse: 'The tunes built on it — Giant Steps, Countdown, 26-2 — and as a substitution on any standard where you want to replace a two-five-one with something far more demanding.',
    connections: ['The major-third root motion divides the octave symmetrically, the same way the diminished chord of 1.5 divides it by minor thirds and the tritone of P0.10 divides it in half',
      'The planing of 10.4 formalises moving one chord quality by a fixed interval',
      'Each temporary key centre implies its own melodic minor family, which is stage 7 and stage 8 material'],
    practiceStrategy: 'Start at ♩=60. Roots first, and sing them. Then voicings. Then 3-5-7-9 arpeggios ascending through the first key centre, descending through the second, ascending through the third. Speed is the last thing, not the first.',
    creativeChallenge: 'Take the first eight bars of Tune Up — three two-five-ones descending by whole steps. Apply the substitution to each one, turning three key centres into nine. Write out the changes. Can you comp them? Can you improvise over them? That is precisely what Coltrane did to make Countdown.'},

  /* ===== 10 — interchange and outside ===== */
  '10.1': {
    whenToUse: 'When a major tune needs a shadow. A single borrowed chord from the parallel minor does more than a bar of alterations.',
    connections: ['The borrowed chords come from the modes of 8.1', 'The backdoor two-five of 9.2 is itself a borrowing', 'The minor two-five-one of 2.3 is where most borrowings end up going'],
    practiceStrategy: 'Play the diatonic chord and the borrowed one in the same bar, alternating, until the borrowing is a colour you can reach for rather than a theory you can explain.',
    creativeChallenge: 'Take a cheerful standard and borrow one chord from the parallel minor in each A section. Play it for somebody without telling them what you changed.'},
  '10.2': {
    whenToUse: 'Where a progression needs more forward motion than its own chords provide, and where the melody leaves room for an extra chord.',
    connections: ['It is 9.1 chained', 'Every dominant in the chain can be altered with stage 7', 'The falling fifths are the circle from P0.5'],
    practiceStrategy: 'Build it one link at a time. Add the V of the V, play it. Then the V of that. Stop when the melody stops fitting — which it will, and knowing where is the skill.',
    creativeChallenge: 'Tonicize every chord in a four-bar phrase, then take away the ones that fought the melody. What is left is a reharmonisation you made rather than copied.'},
  '10.3': {
    whenToUse: 'When you want to go outside and come back within two bars. Approaching from a semitone above is the most controlled way out there is.',
    connections: ['It is the two-five-one of stage 2 aimed a semitone wrong on purpose', 'The chromatic relationship is the same one that makes the tritone sub of 7.2 work',
      'It is the smallest version of the planing in 10.4'],
    practiceStrategy: 'Play the target two-five-one, then the sidestep version, then both joined. The join has to be in time; a sidestep that arrives late sounds like a mistake rather than a device.',
    creativeChallenge: 'Sidestep one phrase in a chorus and play everything else inside. One departure that resolves is worth more than a chorus of vagueness.'},
  '10.4': {
    whenToUse: 'Impressionistic passages, modal vamps, and anywhere you want the harmony to move without functioning. Parallel motion is the sound of harmony as colour rather than as grammar.',
    connections: ['It moves a fixed shape by a fixed interval, which is what Coltrane changes in 9.6 do to key centres',
      'The shapes it moves are usually the quartals of 8.3b',
      'Chromatic planing is the chromatic order drilled in P0.6'],
    practiceStrategy: 'One shape, four motions: chromatic, whole tone, minor third, major third. The same voicing each time. The interval of motion is the only variable and the whole effect.',
    creativeChallenge: 'Plane one voicing through a whole chorus over a static bass. Somewhere in the middle it will pass through the right chord by accident. Notice where, and start aiming for it.'},
  '10.5': {
    whenToUse: 'On a vamp, or any tune that holds one root long enough for the quality above it to become the event.',
    connections: ['It is 8.1’s modes, applied over one bass note instead of over changes', 'It is the drone work of 8.2 with the harmony moving instead of the melody'],
    practiceStrategy: 'Hold the root with the pedal and change only the quality above it — major, minor, dominant, suspended, altered. Slowly. This is ear training disguised as comping.',
    creativeChallenge: 'Improvise over one held root for three minutes, changing the implied mode every eight bars, without ever changing the bass. That is what a modal vamp actually asks of a pianist.'},

  /* ===== 11 — modal blues ===== */
  '11.1': {
    whenToUse: 'Where a blues should sound open rather than bluesy. Suspended chords remove the third, and with it the argument about major and minor.',
    connections: ['The sus chords are built from the perfect fourths of P0.7', 'Mixolydian from 8.1 is its scale', 'It is 5.1 with the thirds taken out'],
    practiceStrategy: 'Play the plain blues and the Mixolydian version back to back in the same key. What changed is one note per chord and the whole character.',
    creativeChallenge: 'Improvise over it without ever playing the third of any chord. The restriction is what produces the sound; the chords alone will not do it.'},
  '11.2': {
    whenToUse: 'Minor blues at medium tempo, where the darkness should be steady rather than mournful. The natural sixth is what keeps it from sagging.',
    connections: ['Dorian from 8.1 is its scale', 'Its chords are the minor sevenths of 1.3', 'Footprints and Equinox live here'],
    practiceStrategy: 'All minor sevenths means no functional pull, so the time has to do the work the harmony used to. Practise it with the metronome on two and four only.',
    creativeChallenge: 'Play Footprints over this form. Notice that the head almost writes the harmony by itself — that is what a strong modal melody does.'},
  '11.3': {
    whenToUse: 'Where a minor blues should sound older and heavier. The flat sixth and flat seventh are the natural minor rather than the Dorian brightness.',
    connections: ['Aeolian from 8.1 is its scale', 'Its flat-sixth chord is a borrowing of the kind 10.1 formalises', 'It is 11.2 with one note darkened'],
    practiceStrategy: 'Beside 11.2 in the same key, so the one changed note is audible. A flat sixth against a natural sixth is the entire difference between two kinds of sadness.',
    creativeChallenge: 'Play the same solo over the Dorian blues and the Aeolian blues. The notes that stop working are exactly the ones that make each form what it is.'},
  '11.4': {
    whenToUse: 'Bars nine to eleven of a minor blues, where the plain two-five would sound too bright for what came before it.',
    connections: ['It is 2.3 put into the twelve-bar form', 'Its V wants the flat nine of 7.1a', 'It is the minor answer to the turnaround of 9.4'],
    practiceStrategy: 'Loop bars nine to twelve alone until the join back into bar one is smooth. The turnaround is where a blues chorus either continues or stops.',
    creativeChallenge: 'Play a minor blues chorus that ends on the plain minor and one that ends with the minor two-five-one. Which one made you want another chorus?'},
  '11.5': {
    whenToUse: 'When a blues has been played four times already and needs somewhere else to go. This is everything from stages 9 and 10 applied to the form everybody knows.',
    connections: ['It uses the tonicisation of 10.2, the sidestep of 10.3 and the backdoor of 9.2 at once',
      'It is 5.1 after the whole of stages 7 to 10',
      'The chromatic motion is the walk-up of 9.3'],
    practiceStrategy: 'One substitution at a time, added to the plain form, played through. Adding all of them at once produces changes nobody can hear, including you.',
    creativeChallenge: 'Write out your own reharmonised blues, twelve bars, and play it for somebody who knows the tune. If they can still hear the blues underneath, you got the balance right.'},

  /* ===== 12 — odd time, and making something ===== */
  '12.1': {
    whenToUse: 'Take Five and everything descended from it, and as an exercise in feeling a bar as unequal groups rather than counting to five.',
    connections: ['The progression is stage 2’s, with the meter changed underneath it',
      'The hemiola of 12.3 is the same asymmetry inside a regular bar'],
    practiceStrategy: 'Count it as three plus two, out loud, then as two plus three. They are different pieces of music. Choose one and stay with it until it stops being counting.',
    creativeChallenge: 'Take a standard you know in four and play its first eight bars in five. What you have to leave out is the lesson.'},
  '12.2': {
    whenToUse: 'Fusion and contemporary writing, and as the harder sibling of 12.1. Seven is four plus three, or three plus four, and the difference is everything.',
    connections: ['It is 12.1 with a beat added', 'Metric modulation in 12.5 moves between meters like these',
      'The uneven groupings are the same principle as the hemiola of 12.3'],
    practiceStrategy: 'Play the bass line alone in seven until it is comfortable, then add the chords. Adding harmony to an unsteady meter is how both fall apart.',
    creativeChallenge: 'Play the same eight bars in four, then five, then seven. Record all three. The tune survives one of them better than the others; work out why.'},
  '12.3': {
    whenToUse: 'Across a regular bar line, to make the time feel elastic without changing the meter. One of the oldest devices in music and still one of the strongest.',
    connections: ['It is asymmetry inside four rather than instead of it, which is what 12.1 and 12.2 do',
      'The displaced accents are the articulation problem of stage 6 in rhythmic form'],
    practiceStrategy: 'Left hand in four, right hand in three, hands separately until each is automatic, then together at half tempo. When they collide, slow down rather than simplify.',
    creativeChallenge: 'Play a chorus where the right hand goes into three-against-four for exactly four bars and then resolves. Resolution is what makes it a device rather than a mistake.'},
  '12.4': {
    whenToUse: 'Once, properly, at the end of the ladder. This is not an exercise to repeat — it is a thing to finish.',
    connections: ['It needs the meters of 12.1 and 12.2 to be internal rather than counted',
      'The harmony is whatever from stages 2 to 11 you actually own',
      'It is the first exercise in the room with no right answer'],
    practiceStrategy: 'Write four bars and play them before writing any more. A sixteen-bar melody written away from the instrument in an odd meter is almost always unplayable.',
    creativeChallenge: 'Finish it. Sixteen bars, a head you can play, in five or seven. An unfinished piece teaches you less than a bad finished one.'},
  '12.5': {
    whenToUse: 'Between sections of an arrangement, where the pulse itself should change rather than the tempo. Modern jazz and fusion live on this.',
    connections: ['It requires the meters of 12.1 and 12.2 and the hemiola of 12.3', 'It is what the whole stage has been building toward'],
    practiceStrategy: 'Find the common unit — the note value that stays the same across the change — and count it through the join. Without a common unit there is no modulation, only a stumble.',
    creativeChallenge: 'Modulate from four into three in the middle of a chorus and back again by the top of the next. If a listener can tap through it, you did it properly.'},
  /* ===== 6A — chord-scale theory ===== */
  '6A.1': {
    listeningAssignments: [
      {artist:'Miles Davis', track:'So What', album:'Kind of Blue', year:1959, timestamp:'1:31-2:30', label:'Columbia',
       listenFor:'The entire A section is D Dorian. Listen to how Miles improvises — he thinks "D is home, and these are the sounds available." That\'s the Dorian sound.'},
      {artist:'Herbie Hancock', track:'Maiden Voyage', album:'Maiden Voyage', year:1965, timestamp:null, label:'Blue Note',
       listenFor:'Hancock uses Dorian voicings extensively. The opening vamp is a masterclass in Dorian color.'}
    ],
    commonMistakes: [
      'Levine\'s #1 warning: thinking of modes as "parent scale starting on a different note." D Dorian is NOT "C major starting on D." It\'s the sound of D as home with a minor 3rd, natural 6th, and minor 7th. Play D Dorian over a Dm7 drone and listen to its character.',
      'Confusing which mode goes with which chord. The rule: Dorian = minor 7th, Mixolydian = dominant 7th, Ionian = major 7th.',
      'Not learning the avoid notes. Levine: the 4th on a Maj7 and the 4th on a Dom7 are avoid notes in voicings (not in melodies). Phrygian has b2 and b6 as avoids.'
    ],
    masteryChecklist: [
      'Can play D Dorian from memory ascending and descending',
      'Can play Dorian mode starting on all 12 roots',
      'Can improvise 8 bars using only Dorian mode over a Dm7 drone',
      'Can name the chord type associated with each of the 7 modes',
      'Can identify Dorian vs Aeolian by ear (Dorian has the brighter natural 6th)'
    ],
    whenToUse: 'Play the Dorian mode on any minor 7th chord that functions as a ii chord (the most common situation). Also works on minor 7th chords functioning as i in modal tunes. Levine: "On a D-7 chord, play the D Dorian mode."',
    connections: [
      'Dorian-Mixolydian-Ionian are the three modes for ii-V-I (Stage 2) — they all share the same parent scale',
      'The natural 6th in Dorian distinguishes it from Aeolian (which has b6) — this single note creates a completely different mood',
      'Stage 8 (Modal Jazz) explores extended Dorian improvisation in modal tunes like "So What"'
    ],
    practiceStrategy: 'Levine recommends: play D Dorian ascending and descending over a Dm7 chord held in LH. Start on different notes of the mode (not just the root). Then practice connecting modes: D Dorian → G Mixolydian → C Ionian through a ii-V-I. Eventually, you should think "key of C" and the modes for ii-V-I appear automatically.',
    creativeChallenge: 'Compose a 4-bar melody using ONLY D Dorian over a Dm7 drone. Then play the same rhythm using Mixolydian over G7. Then Ionian over Cmaj7. Compare the emotional color of each mode with identical rhythms.'},

  /* ===== 13 — advanced voicings ===== */
  '13.1.1': {
    listeningAssignments: [
      {artist:'Herbie Hancock', track:'Maiden Voyage', album:'Maiden Voyage', year:1965, timestamp:null, label:'Blue Note',
       listenFor:'Mantooth specifically lists this as recommended listening. Hancock\'s voicings avoid stacked thirds and create the open, modern sound that Mantooth\'s Generic system produces.'},
      {artist:'McCoy Tyner', track:'Passion Dance', album:'The Real McCoy', year:1967, timestamp:null, label:'Blue Note',
       listenFor:'McCoy\'s left-hand voicings are the quintessential quartal sound — stacked 4ths with tremendous power. This is the sound Generic voicings produce.'},
      {artist:'Red Garland', track:"Relaxin'", album:"Relaxin' with the Miles Davis Quintet", year:1956, timestamp:null, label:'Prestige',
       listenFor:'Mantooth lists this album in his recommended listening. Listen to Red Garland\'s comping — smooth, contextual voice-leading with minimal motion between chords.'}
    ],
    commonMistakes: [
      'Forgetting the Rule of Thumb: keep the RH thumb between middle C and C above middle C (C4–C5). Below middle C = muddy. Above C5 = too thin.',
      'Not understanding that Generic Major from the tonic and from the 5th produce DIFFERENT voicings for the same chord. Context determines which to use.',
      'Using Generic voicings on diminished and half-diminished chords. Mantooth says the quartal construction "is obviously impossible" for diminished family chords — these require special treatment (Chapter 9).'
    ],
    masteryChecklist: [
      'Can build Generic Major voicing (from tonic) in all 12 keys instantly',
      'Can build Generic Major (from 5th) in all 12 keys',
      'Can build Generic Minor in all 12 keys',
      'Can build Generic Dominant (from tonic AND from 5th) in all 12 keys',
      'Can play a ii-V-I using Generic voicings with minimal motion and Rule of Thumb observed'
    ],
    whenToUse: 'Mantooth: these voicings are for comping behind a soloist in a band setting. They avoid doubling the bass player\'s roots and create a modern, non-tertial sound. Use them when you want a fuller alternative to Type A/B voicings.',
    connections: [
      'Generic voicings are built from the same perfect 4ths you drilled in Stage P0',
      'The tritone indicators (3rd and 7th) in Generic Dominant voicings are the same guide tones from Stage 2 shell voicings — Mantooth adds quartal color above them',
      'Miracle Voicings (Stage 13.2) are Generic voicings that serve 5 different harmonic functions — same construction, more flexibility'
    ],
    practiceStrategy: 'Mantooth\'s weekly syllabus: (1) Learn the formula for each family (Major, Minor, Dominant). (2) Practice each type in all 12 keys. (3) Practice the ii-V-I workout — Cmi to F7 to BbMaj using generics. (4) Maintain the Rule of Thumb across all keys. (5) Practice with a bass player or iRealPro backing track.',
    creativeChallenge: 'Voice the chord progression to Tadd Dameron\'s "Lady Bird" using ONLY Generic and Miracle voicings. Then compare your version to the Mantooth example in Chapter 8.'},

  /* ===== V1 — scat foundations ===== */
  'V1.3': {
    listeningAssignments: [
      {artist:'Ella Fitzgerald', track:'How High the Moon', album:'Ella in Berlin: Mack the Knife', year:1960, timestamp:null, label:'Verve',
       listenFor:'The definitive scat performance. Notice Ella\'s syllable variety — she never uses "doo" for everything. Listen for "ba-doo-dee-yah," "shoo-bee-doo-bee-doo," and her incredible rhythmic precision.'},
      {artist:'Bobby McFerrin', track:'Blackbird', album:'The Voice', year:1984, timestamp:null, label:'Elektra',
       listenFor:'McFerrin\'s solo vocal technique demonstrates the ultimate extension of scat — simultaneously singing melody, bass, and percussion. Listen to his syllable choices and how they match the articulation.'}
    ],
    commonMistakes: [
      'Stoloff: "The most frequently used vowels in traditional scat singing are ah, ee and oo." Beginners tend to use "doo" for everything. Force yourself to match syllable to articulation — "dah" for accented, "dit" for staccato, "dwee" for legato.',
      'Stoloff: "Syllable combinations with 2 vowels (du-be, da-be) may sound trite after several repetitions." Combine 2-syllable rhythms with triplets (du-ee-a) to avoid monotony.',
      'Not practicing at different tempos. Stoloff: "Start at 96 and increase your speed a little each day until you are able to articulate all 4 rhythm etudes at 160 with clarity and precision."'
    ],
    masteryChecklist: [
      'Can articulate each line of the warm-up at tempo 96 with straight 8th feel',
      'Can articulate at 144 with clarity',
      'Can sing each vowel (ah, ee, oo) clearly with consonants b, d, l, n',
      'Can properly produce the "dn" syllable (tongue to roof of mouth, nasal attack — NOT "din")'
    ],
    whenToUse: 'Use as a daily vocal warm-up before any scat practice. Like a pianist\'s Hanon exercises, this warm-up trains the mouth muscles and breath coordination needed for everything else.',
    connections: [
      'The rhythmic patterns here (duple and triple combinations) are the same rhythmic vocabulary used in piano improvisation (Stage 6)',
      'The vowel placement principles (ee for high notes, ah/oo for low) apply to all vocal jazz performance',
      'These syllables will be applied to melodic patterns in V2 (diatonic patterns) and V3 (scat performance)'
    ],
    practiceStrategy: "Stoloff's approach: (1) Listen to CD tracks 1 and 4 to hear correct articulation. (2) Practice with straight 8th feel first. (3) Then swing 8th feel. (4) Use a metronome — start at 96, increase gradually. (5) Practice the challenging syllables (especially 'dn') in isolation before applying to phrases.",
    creativeChallenge: 'Record yourself scatting a simple 4-bar phrase using ONLY the syllables from this warm-up. Then listen to 30 seconds of Ella Fitzgerald scatting and transcribe her syllable choices. How do they compare?'},

};

/* ---------- a checklist nobody wrote ----------
   The brief asks for three to five binary checkpoints per exercise, climbing
   from "slowly" to "at tempo" to "in all twelve" to "from memory" to "inside
   a tune". Where the source has its own, that one is used. Where it has not,
   this ladder is built from the exercise's own name — and the exercise is
   marked as having a derived checklist, so that a checkpoint nobody wrote is
   never mistaken for one somebody did. */
function jazzDerivedChecklist(ex){
  const it = (ex && ex.name) || 'it';
  return [`Can play ${it} in this key slowly and cleanly, without stopping`,
    `Can play it in all 12 keys`,
    `Can play it at ♩=100 without the time slipping`,
    `Can play it from memory, without looking at anything`,
    `Can use it inside a tune without stopping to think`];
}

/* ---------- the merge ----------
   Called on the flat book rather than on the shipped catalogues, so the
   files those came in stay exactly as they were written. Anything an
   exercise does not carry falls back to its stage, and the fact that it fell
   back is recorded — a record's listening is worth reading differently when
   it belongs to the stage rather than to the exercise. */
function jazzMergeEnrichment(book){
  if(!book) return book;
  jazzBookRaw = book;
  let order = null;
  try { order = typeof jazzV3 === 'function' ? jazzV3(book).order : null; } catch(e){ order = null; }
  Object.keys(book).forEach(id => {
    const ex = book[id];
    if(!ex || typeof ex !== 'object') return;
    const own = JAZZ_EX_RICH[id] || {};
    /* the stage the exercise is on now — a v3 stage, whose record merges
       the old rungs it absorbed */
    const st = jazzStageRich(ex.stage);
    ex.listeningAssignments = (own.listeningAssignments || st.listeningAssignments || []).slice();
    ex.listeningFromStage = !own.listeningAssignments;
    ex.commonMistakes = (own.commonMistakes || st.commonMistakes || []).slice();
    ex.mistakesFromStage = !own.commonMistakes;
    ex.whenToUse = own.whenToUse || '';
    ex.connections = (own.connections || []).slice();
    ex.practiceStrategy = own.practiceStrategy || '';
    ex.creativeChallenge = own.creativeChallenge || null;
    ex.enrichDerived = [];
    if(!ex.whenToUse || !ex.connections.length || !ex.practiceStrategy || !ex.creativeChallenge){
      const d = jazzDerivedEnrichment(ex, order);
      ['whenToUse', 'connections', 'practiceStrategy', 'creativeChallenge'].forEach(k => {
        const has = Array.isArray(ex[k]) ? ex[k].length : ex[k];
        if(!has){ ex[k] = d[k]; ex.enrichDerived.push(k); } });
    }
    if(own.masteryChecklist && own.masteryChecklist.length){
      ex.masteryChecklist = own.masteryChecklist.slice();
      ex.checklistDerived = false;
    } else {
      ex.masteryChecklist = jazzDerivedChecklist(ex);
      ex.checklistDerived = true;
    }
  });
  return book;
}
/* what a stage carries, for the roadmap.

   A v3 stage is several old rungs at once (Stage 2 is the old 2, 3 and 4),
   so its record is theirs merged: the hardest of their difficulties, all
   of their mistakes and their records without repeats, their histories
   one after another — and the document's own time estimate first, with
   theirs kept beneath it as the detail. The document's Section 5
   repertoire ladder joins the listening, marked as the ladder's. */
const _jazzRichV3 = {};
function jazzV3LadderListening(sid){
  const n = typeof JAZZ_V3_STAGE_META === 'object' && JAZZ_V3_STAGE_META[sid]
    ? String(JAZZ_V3_STAGE_META[sid].n) : null;
  if(n == null || typeof JAZZ_V3_DOC !== 'object') return [];
  return (JAZZ_V3_DOC.ladder || []).filter(r => r[0] === n).map(r => {
    const title = String(r[1]);
    const transcribe = /^Transcribe:/i.test(title);
    const track = title.replace(/^Transcribe:\s*/i, '').replace(/[\u201c\u201d"]/g, '')
      .replace(/\s+(solo|intro)$/i, '').trim();
    const yr = /\((\d{4})\)/.exec(r[3] || '');
    return {artist: r[2], track, album: String(r[3] || '').replace(/\s*\(\d{4}\)/, ''),
      year: yr ? +yr[1] : null, listenFor: (transcribe ? 'Transcribe the solo. ' : '') + r[4],
      ladder: true, transcribe, ladderTitle: title};
  });
}
function jazzStageRich(sid){
  const key = String(sid);
  if(_jazzRichV3[key]) return _jazzRichV3[key];
  const meta = typeof JAZZ_V3_STAGE_META === 'object' ? JAZZ_V3_STAGE_META[key] : null;
  if(!meta) return JAZZ_STAGE_RICH[key] || {};
  const olds = [JAZZ_V3_STAGE_RICH[key]].concat((meta.from || []).map(o => JAZZ_STAGE_RICH[o] || JAZZ_STAGE_RICH_LATE[o]))
    .filter(Boolean);
  const out = {};
  const hardest = olds.map(o => o.expectedDifficulty).filter(Boolean)
    .sort((a, b) => jazzDifficultyRank(b) - jazzDifficultyRank(a))[0];
  if(hardest) out.expectedDifficulty = hardest;
  const hist = olds.map(o => o.historicalContext).filter(Boolean);
  if(hist.length) out.historicalContext = hist.join('\n\n');
  const row = typeof JAZZ_V3_DOC === 'object'
    ? (JAZZ_V3_DOC.outcomes || []).find(r => r[0] === String(meta.n)) : null;
  const times = olds.map(o => o.typicalTimeToMaster).filter(Boolean);
  if(row || times.length)
    out.typicalTimeToMaster = [row ? `${row[4].replace(/^~/, 'About ')} in the v3 plan, at two hours a day.` : '']
      .concat(times).filter(Boolean).join('\n\n');
  const mistakes = [];
  olds.forEach(o => (o.commonMistakes || []).forEach(m => { if(!mistakes.includes(m)) mistakes.push(m); }));
  if(mistakes.length) out.commonMistakes = mistakes;
  const listening = [], seen = {};
  const add = a => { const k = `${a.artist}|${a.track}`.toLowerCase();
    if(seen[k]) return; seen[k] = true; listening.push(a); };
  jazzV3LadderListening(key).forEach(add);
  olds.forEach(o => (o.listeningAssignments || []).forEach(add));
  if(listening.length) out.listeningAssignments = listening;
  _jazzRichV3[key] = out;
  return out;
}
const jazzDifficultyRank = d => { const at = JAZZ_DIFFICULTY.indexOf(String(d || ''));
  return at < 0 ? 0 : at + 1; };

/* ---------- a checkpoint as a thing you can tick ----------
   Keyed by a hash of its own words rather than by its position, because a
   position is a promise the catalogue cannot keep: insert one checkpoint and
   every tick below it would silently move to a different claim. A reworded
   checkpoint becoming a new one is the correct behaviour — it IS a different
   claim — and is cheaper than being wrong about the old one. */
function jazzCheckId(text){
  let h = 5381;
  const s = String(text || '');
  for(let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
const jazzCheckGot = (exId, item) => !!jazzRecord(exId).checks[jazzCheckId(item)];
function jazzSetCheck(exId, item, on){
  const r = jazzRecord(exId, true);
  const k = jazzCheckId(item);
  on ? r.checks[k] = true : delete r.checks[k];
  saveNow();
  return !!r.checks[k];
}
function jazzChecksGot(exId){
  const ex = jazzExercise(exId);
  const list = (ex && ex.masteryChecklist) || [];
  return {done: list.filter(t => jazzCheckGot(exId, t)).length, of: list.length};
}

/* ---------- a checkpoint as a flashcard ----------
   A checkpoint is written about the whole twelve keys — "can play it in all
   12 keys" — and a card is one of them. So the sentence is turned round: the
   "Can" comes off the front, and any claim about all twelve becomes a claim
   about the key on the card, which the card is about to name underneath.

   This is a rewriter rather than a second set of hand-written prompts,
   because two hand-written versions of the same claim drift apart the first
   time one of them is corrected. */
function jazzCheckAsk(item){
  let s = String(item || '').trim();
  s = s.replace(/^Can\s+/, '');
  /* the long form first, or the short rule eats half of it and leaves a
     sprint through the circle of fourths starting and ending on one root */
  s = s.replace(/\bfrom all (?:12|twelve) roots in cycle-of-4ths order\b/gi, 'from this root');
  s = s.replace(/\bin at least \d+ keys\b/gi, 'in this key');
  s = s.replace(/\bfrom all (?:12|twelve) roots\b/gi, 'from this root');
  s = s.replace(/\b(?:starting )?on all (?:12|twelve) roots\b/gi, 'on this root');
  s = s.replace(/\bfrom any of the (?:12|twelve) roots\b/gi, 'from this root');
  s = s.replace(/\bfrom any (?:random )?root\b/gi, 'from this root');
  s = s.replace(/\bin any key\b/gi, 'in this key');
  s = s.replace(/\bof any\b/gi, 'of the');
  /* and the general one last, which is what actually catches "in all 12
     keys" — a narrower rule for that phrase used to sit above and was pure
     dead weight: neutering it changed no output, because this line had
     already done the work. */
  s = s.replace(/\ball (?:12|twelve) (?:dorian modes|keys)\b/gi, 'this key');
  if(!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
/* A checkpoint about moving between keys needs two of them, which is the one
   shape of card the brief asks for that a single key cannot express. */
const jazzCheckTwoKeys = item => /voice[- ]lead|voice leading/i.test(String(item || ''));

/* ---------- and the ones that cannot be a card at all ----------
   Some checkpoints are irreducibly about the whole twelve: "play all twelve
   major sevenths ascending chromatically", "play it from memory in C, F, G
   and B flat". Dealing one of those against a single key produces a question
   that cannot be answered as asked, which is the exact fault this work was
   started to fix at the other end of the room — an interval card with no
   interval on it. So they stay on the checklist, where they belong, and stay
   out of the deck. */
function jazzCheckCardable(item){
  const said = jazzCheckAsk(item);
  if(!said) return false;
  /* still about all the keys after the rewrite. Narrow on purpose: two of
     these exercises are CALLED "All 12 Intervals from One Root", and a bare
     test for "all twelve" would throw out the exercise whose whole point is
     that it happens from one root at a time. */
  if(/\ball (?:12|twelve) (?:keys|roots|chords|modes)\b/i.test(said)) return false;
  /* an order that only exists across roots */
  if(/cycle-of-4ths|chromatically|round the circle/i.test(said)) return false;
  /* or a named list of keys, which is its own answer to "which key" */
  if(/\b[A-G](?:\u266d|\u266f|b|#)?\b\s*(?:,|and)\s*\b[A-G](?:\u266d|\u266f|b|#)?\b/.test(said)) return false;
  return true;
}
