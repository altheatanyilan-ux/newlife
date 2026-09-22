/* ============================================================
   LISTENING LIBRARY — 36 guided tracks, 35 comping masters.

   Siskind's rule: listen at least twenty times before moving on.
   Not once to check the box. Twenty times to let it become normal.

   Listen counts are shared with the plan's existing tracking so
   that a session logged here and a session logged from the daily
   plan both count toward the twenty.
   ============================================================ */

const LISTENING_LIBRARY = {

  guidedListening: [

    /* BOOK 1 */
    {id:'GL-B1-01', trackTitle:'Freddie Freeloader', artist:'Miles Davis',
     album:'Kind of Blue', year:1959, source:'Siskind Book 1',
     sourceUnit:'Unit 1', sourcePages:'pp.19-21', stageAlignment:'Stage 1',
     style:['blues','modal'], concepts:['sandwich-form','blues-form','counting-measures'], difficulty:'beginner',
     personnel:[
       {name:'Miles Davis', instrument:'trumpet'},{name:'John Coltrane', instrument:'tenor saxophone'},
       {name:'Cannonball Adderley', instrument:'alto saxophone'},{name:'Wynton Kelly', instrument:'piano'},
       {name:'Paul Chambers', instrument:'bass'},{name:'Jimmy Cobb', instrument:'drums'}],
     formMap:[
       {section:'Head In', timestamp:'0:00–0:44', measures:'24 measures (first + second ending)'},
       {section:'Piano Solo — Wynton Kelly', timestamp:'0:44–2:14', measures:'4 choruses'},
       {section:'Trumpet Solo — Miles Davis', timestamp:'2:14–4:30', measures:'6 choruses'},
       {section:'Tenor Sax — Coltrane', timestamp:'4:30–6:21', measures:'5 choruses'},
       {section:'Alto Sax — Adderley', timestamp:'6:21–8:13', measures:'5 choruses'},
       {section:'Bass Solo — Paul Chambers', timestamp:'8:13–8:55', measures:'2 choruses'},
       {section:'Head Out', timestamp:'8:55–end', measures:'24 measures'}],
     artistBackground:'Miles Davis (1926–1991) is arguably the most influential musician in jazz history. Kind of Blue (1959) remains the best-selling jazz album of all time. Wynton Kelly is the pianist on this track only; Bill Evans plays on all others.',
     trackContext:'A 12-bar blues in Bb. Wynton Kelly plays piano here instead of Evans, giving the track a more blues-inflected, swinging feel compared to the rest of the album.',
     whatToListenFor:[
       'Use your finger to count beats — tap four times for each measure\'s quarter notes',
       'Listen to Paul Chambers\' bass: he plays quarter notes for essentially the entire track',
       'Play your voicings softly along with the recording; soloists take only the first ending',
       'Sing the melody during the solos — keeping the theme in mind helps you track the form',
       'Notice the sandwich format: Head → Solos → Head Out'],
     pianistFocus:'Wynton Kelly mixes the blues scale with arpeggios and phrases across bar lines — a model for blues vocabulary.',
     connectToExercises:['Stage 1: Chord Construction','Stage 5: Blues Form'],
     minimumListens:20},

    {id:'GL-B1-02', trackTitle:'Joy Spring', artist:'Clifford Brown & Max Roach',
     album:'Clifford Brown & Max Roach', year:1954, source:'Siskind Book 1',
     sourceUnit:'Unit 2', sourcePages:'p.23', stageAlignment:'Stage 2',
     style:['bebop'], concepts:['comping','charleston','trading-fours','press-roll'], difficulty:'beginner',
     personnel:[
       {name:'Clifford Brown', instrument:'trumpet'},{name:'Max Roach', instrument:'drums'},
       {name:'Richie Powell', instrument:'piano'},{name:'Harold Land', instrument:'tenor saxophone'},
       {name:'George Morrow', instrument:'bass'}],
     formMap:[],
     artistBackground:'Clifford Brown (1930–1956) died at 25, leaving one of the most admired bebop trumpet voices in history. Richie Powell (younger brother of Bud Powell) was the pianist in this quintet until the same car accident.',
     trackContext:'Joy Spring is a 32-bar AABA tune by Clifford Brown. The focus for this assignment is Richie Powell\'s comping and the group\'s trading-fours section.',
     whatToListenFor:[
       'Focus on Richie Powell\'s left hand — notice the Charleston and Reverse Charleston rhythmic patterns',
       'Listen for the trading-fours section: soloists trade 4-bar phrases with Max Roach',
       'Notice Max Roach\'s press roll as a setup device before solos begin',
       'Count the 32-bar AABA form through the solos'],
     pianistFocus:'Richie Powell demonstrates how Charleston rhythms can support a soloist rhythmically without cluttering the harmonic space.',
     connectToExercises:['Stage 2: Voicings in Position'],
     minimumListens:20},

    {id:'GL-B1-03', trackTitle:'Bluesette', artist:'Toots Thielemans',
     album:'Bluesette', year:1962, source:'Siskind Book 1',
     sourceUnit:'Unit 3', sourcePages:'pp.35-36', stageAlignment:'Stage 3',
     style:['jazz-waltz'], concepts:['3-4-time','ii-V-I','multiple-keys'], difficulty:'beginner',
     personnel:[{name:'Toots Thielemans', instrument:'harmonica/guitar'}],
     formMap:[],
     artistBackground:'Toots Thielemans (1922–2016) was a Belgian jazz musician who became the definitive jazz harmonica voice. Bluesette is his signature tune.',
     trackContext:'Bluesette is a jazz waltz — 3/4 time — with a chord progression that moves through several ii-V-I progressions in different keys. This assignment introduces triple meter.',
     whatToListenFor:[
       'Feel the 3/4 metre — count "one two three, one two three" with a slight emphasis on beat one',
       'Listen for the ii-V-I progressions resolving to different major key centers',
       'Notice how the melody breathes differently in waltz time versus 4/4'],
     pianistFocus:null,
     connectToExercises:['Stage 3: ii-V-I in Multiple Keys'],
     minimumListens:20},

    {id:'GL-B1-04', trackTitle:'So What', artist:'Miles Davis',
     album:'Kind of Blue', year:1959, source:'Siskind Book 1',
     sourceUnit:'Unit 4', sourcePages:'p.45', stageAlignment:'Stage 4',
     style:['modal'], concepts:['AABA-form','modal-jazz','call-and-response'], difficulty:'beginner',
     personnel:[
       {name:'Miles Davis', instrument:'trumpet'},{name:'John Coltrane', instrument:'tenor saxophone'},
       {name:'Cannonball Adderley', instrument:'alto saxophone'},{name:'Bill Evans', instrument:'piano'},
       {name:'Paul Chambers', instrument:'bass'},{name:'Jimmy Cobb', instrument:'drums'}],
     formMap:[
       {section:'Intro', timestamp:'0:00–0:33', measures:'Piano/bass dialogue'},
       {section:'Head', timestamp:'0:33–1:39', measures:'32 bars AABA'},
       {section:'Miles Davis Solo', timestamp:'1:39–4:14', measures:'3 choruses'},
       {section:'Coltrane Solo', timestamp:'4:14–7:20', measures:'4 choruses'},
       {section:'Cannonball Solo', timestamp:'7:20–9:21', measures:'3 choruses'},
       {section:'Bill Evans Solo', timestamp:'9:21–11:19', measures:'2 choruses'},
       {section:'Head Out', timestamp:'11:19–end', measures:'32 bars'}],
     artistBackground:'Kind of Blue (1959) launched the modal era of jazz. So What uses only two scales: D Dorian (A sections) and Eb Dorian (B section) — a radical simplification from bebop\'s dense harmonic movement.',
     trackContext:'The call-and-response melody (bass asks, brass answers) and the three very different soloist personalities make this a model for listening to the band as an organism.',
     whatToListenFor:[
       'Listen to the three soloist personalities: Miles\'s space and lyricism, Coltrane\'s intensity, Cannonball\'s bebop fluency',
       'Notice the AABA structure — the B section is one half-step higher, and you can hear it',
       'Watch how Bill Evans\' comping changes texture depending on who is soloing',
       'Listen to Paul Chambers\' walking bass as the foundation that never stops'],
     pianistFocus:'Bill Evans invented new modal comping vocabulary on this record. His voicings float — root-less, using fourths and seconds rather than the traditional thirds.',
     connectToExercises:['Stage 4: Swing Rhythms'],
     minimumListens:20},

    {id:'GL-B1-05', trackTitle:'Evening in Lyon', artist:'Kenny Barron',
     album:'People Time', year:1992, source:'Siskind Book 1',
     sourceUnit:'Unit 5', sourcePages:'pp.62-63', stageAlignment:'Stage 5',
     style:['swing'], concepts:['grace-notes','octaves','double-time'], difficulty:'beginner',
     personnel:[
       {name:'Kenny Barron', instrument:'piano'},{name:'Stan Getz', instrument:'tenor saxophone'}],
     formMap:[
       {section:'Head', timestamp:'0:00–2:50', measures:'32 bars'},
       {section:'Getz Solo', timestamp:'2:50–6:00', measures:'4 choruses'},
       {section:'Barron Solo', timestamp:'6:00–9:00', measures:'3 choruses'},
       {section:'Double-time section', timestamp:'~9:00–10:00', measures:'notice the shift at this point'},
       {section:'Head Out', timestamp:'10:00–end', measures:'32 bars'}],
     artistBackground:'Kenny Barron (b.1943) is one of the leading pianists of the post-bop era. People Time is a live duo album recorded shortly before Stan Getz\'s death in 1991.',
     trackContext:'Evening in Lyon (titled "People Time" on the original release — Siskind uses the alternate title) demonstrates grace notes, turns, and octave playing in the context of a real duo performance.',
     whatToListenFor:[
       'Listen for grace note slides in the melody — short glissandos that simulate a horn\'s pitch bend',
       'Notice turns (decorations that circle around the target note)',
       'Listen for octave playing in Barron\'s left and right hands',
       'Around 9:00, Barron shifts into double-time feel — the notes double in speed while the beat stays the same',
       'Listen to how Barron comps under Getz: supporting but never crowding'],
     pianistFocus:'Barron\'s technique of phrasing endings with a "doo-DIT" (accented short note at phrase end) is a hallmark of his style.',
     connectToExercises:['Stage 5: ii-V-I Improvisation'],
     minimumListens:20},

    {id:'GL-B1-06', trackTitle:'Think of One', artist:'Thelonious Monk',
     album:'Criss-Cross', year:1963, source:'Siskind Book 1',
     sourceUnit:'Unit 6', sourcePages:'p.75', stageAlignment:'Stage 6',
     style:['bebop'], concepts:['monk-style','angular-melody','unusual-intervals'], difficulty:'intermediate',
     personnel:[
       {name:'Thelonious Monk', instrument:'piano'},{name:'Charlie Rouse', instrument:'tenor saxophone'},
       {name:'John Ore', instrument:'bass'},{name:'Frankie Dunlop', instrument:'drums'}],
     formMap:[],
     artistBackground:'Thelonious Monk (1917–1982) created one of jazz\'s most distinctive voices — angular melodies, flat-fingered technique, unusual voicings, and a rhythmic sensibility that sounds like no one else.',
     trackContext:'Think of One demonstrates Monk\'s unique approach: he never plays what you expect, favors unusual intervals, and leaves more silence than most pianists dare. A study in personality over correctness.',
     whatToListenFor:[
       'Notice Monk\'s unusual intervals — he jumps to notes that seem "wrong" but land perfectly',
       'Listen for his rhythmic displacement: phrases start and end in unexpected places',
       'Observe Charlie Rouse\'s phrasing: how does he adapt to Monk\'s unexpected accompaniment?',
       'Count the bars — Monk sometimes extends or contracts a phrase by a beat, and Rouse follows without flinching'],
     pianistFocus:'Monk\'s comping under Rouse is sparse but perfectly placed — a model for how to leave space.',
     connectToExercises:['Stage 6: Rhythmic Vocabulary'],
     minimumListens:20},

    {id:'GL-B1-07', trackTitle:'Pie Eye\'s Blues', artist:'Duke Ellington',
     album:'Blues in Orbit', year:1959, source:'Siskind Book 1',
     sourceUnit:'Unit 7', sourcePages:'pp.93-94', stageAlignment:'Stage 7',
     style:['big-band','blues'], concepts:['backgrounds','strolling','shout-chorus'], difficulty:'intermediate',
     personnel:[{name:'Duke Ellington', instrument:'piano/leader'},{name:'Full Orchestra', instrument:'big band'}],
     formMap:[],
     artistBackground:'Duke Ellington (1899–1974) was one of the great American composers and bandleaders. His approach to the blues was orchestral — every section of the band functions as a voice.',
     trackContext:'Pie Eye\'s Blues demonstrates big-band blues: backgrounds (accompanying figures behind soloists), strolling (the piano plays alone while the rhythm section drops out), and the shout chorus.',
     whatToListenFor:[
       'Listen for strolling sections where the piano plays alone — notice how the texture thins and swells',
       'Identify the trombone backgrounds behind the trumpet soloist',
       'Listen for the shout chorus — the band plays its most intense section together near the end',
       'Notice how mutes change the sound of the brass'],
     pianistFocus:'Ellington\'s piano is orchestral in approach — he plays the piano like a full band, not a solo instrument.',
     connectToExercises:['Stage 7: Blues Scale Improvisation'],
     minimumListens:20},

    {id:'GL-B1-08', trackTitle:'D. & E.', artist:'Oscar Peterson',
     album:'We Get Requests', year:1964, source:'Siskind Book 1',
     sourceUnit:'Unit 8', sourcePages:'pp.113-114', stageAlignment:'Stage 8',
     style:['swing','blues'], concepts:['bass-in-two','shout-chorus','blues-scale'], difficulty:'intermediate',
     personnel:[
       {name:'Oscar Peterson', instrument:'piano'},{name:'Ray Brown', instrument:'bass'},
       {name:'Ed Thigpen', instrument:'drums'}],
     formMap:[],
     artistBackground:'Oscar Peterson (1925–2007) was a Canadian pianist of extraordinary technical facility and swing. Ray Brown was considered by many the greatest jazz bassist of all time.',
     trackContext:'D. & E. is a blues that puts Ray Brown\'s bass-in-two walking pattern in the foreground. Brown plays half notes rather than quarter notes, creating a looser, more relaxed feel.',
     whatToListenFor:[
       'Listen to Ray Brown\'s bass — he walks in two (half notes) rather than four (quarter notes)',
       'Notice the shout chorus: the whole band plays together with maximum intensity',
       'Listen for Peterson\'s mixing of the blues scale with arpeggios in his right hand',
       'Notice how Ed Thigpen\'s drumming changes feel to support the different sections'],
     pianistFocus:'Peterson mixes bebop fluency with blues vocabulary — his phrases alternate between running arpeggios and blues-scale fragments.',
     connectToExercises:['Stage 8: Call-and-Response Phrasing'],
     minimumListens:20},

    {id:'GL-B1-09', trackTitle:'Now\'s the Time', artist:'Charlie Parker',
     album:'The Essential Charlie Parker', year:1952, source:'Siskind Book 1',
     sourceUnit:'Unit 9', sourcePages:'pp.130-131', stageAlignment:'Stage 9',
     style:['bebop','blues'], concepts:['bebop-vs-blues','melody-variation','dropping-bombs'], difficulty:'intermediate',
     personnel:[
       {name:'Charlie Parker', instrument:'alto saxophone'},{name:'Max Roach', instrument:'drums'},
       {name:'Al Haig', instrument:'piano'}],
     formMap:[],
     artistBackground:'Charlie Parker (1920–1955), known as Bird, created bebop language. Now\'s the Time (1952) is a 12-bar blues — paradoxically one of the most bebop of all his compositions.',
     trackContext:'This recording demonstrates how bebop musicians use the blues scale as raw material but vary it, recombine it with chord arpeggios, and ornament it beyond recognition.',
     whatToListenFor:[
       'Listen to how Parker alternates blues-scale phrases with fast arpeggio runs',
       'Notice Max Roach "dropping bombs" — unexpected bass drum accents that punctuate the soloist\'s lines',
       'Listen for melody variation: Parker rarely plays the head the same way twice',
       'Count the 12-bar blues form through the entire recording'],
     pianistFocus:'Al Haig comps in a clean, uncluttered bebop style — listen to how little he plays and how perfectly placed each chord is.',
     connectToExercises:['Stage 9: Play One Rest One'],
     minimumListens:20},

    {id:'GL-B1-10', trackTitle:'Corcovado', artist:'Stan Getz & João Gilberto',
     album:'Getz/Gilberto', year:1964, source:'Siskind Book 1',
     sourceUnit:'Unit 10', sourcePages:'pp.151-152', stageAlignment:'Stage 10',
     style:['bossa-nova'], concepts:['straight-eighth','bossa-rhythm','jobim-accents'], difficulty:'intermediate',
     personnel:[
       {name:'Stan Getz', instrument:'tenor saxophone'},{name:'João Gilberto', instrument:'guitar/vocal'},
       {name:'Astrud Gilberto', instrument:'vocals'},{name:'Antônio Carlos Jobim', instrument:'piano'},
       {name:'Tommy Williams', instrument:'bass'},{name:'Milton Banana', instrument:'drums'}],
     formMap:[],
     artistBackground:'Antônio Carlos Jobim (1927–1994) was the composer of bossa nova\'s most enduring standards. Getz/Gilberto (1964) brought Brazilian music to American audiences and won the Grammy for Album of the Year.',
     trackContext:'Corcovado (Quiet Nights of Quiet Stars) is a bossa nova — straight eighth notes instead of swing, a specific rhythmic pattern in the guitar, and Jobim\'s characteristic harmonic accents.',
     whatToListenFor:[
       'Feel the straight-eighth feel — bossa nova does not swing; the eighth notes are equal in length',
       'Listen to João Gilberto\'s guitar: the bossa nova rhythm pattern with its characteristic syncopated figure',
       'Notice Jobim\'s piano voicings: often using extensions and non-diatonic notes',
       'Listen to Getz\'s tone — how does he adjust his articulation for the Brazilian feel?'],
     pianistFocus:'Jobim\'s piano is understated and harmonically sophisticated — listen for his use of #11 and #9 sounds within a tonal framework.',
     connectToExercises:['Stage 10: Play What You Sing'],
     minimumListens:20},

    {id:'GL-B1-11', trackTitle:'Remember', artist:'Hank Mobley',
     album:'Soul Station', year:1960, source:'Siskind Book 1',
     sourceUnit:'Unit 11', sourcePages:'pp.164-165', stageAlignment:'Stage 11',
     style:['hard-bop'], concepts:['singable-melody','piano-fit','press-rolls'], difficulty:'intermediate',
     personnel:[
       {name:'Hank Mobley', instrument:'tenor saxophone'},{name:'Wynton Kelly', instrument:'piano'},
       {name:'Paul Chambers', instrument:'bass'},{name:'Art Blakey', instrument:'drums'}],
     formMap:[],
     artistBackground:'Hank Mobley (1930–1986) was known for singable, lyrical melodies. Soul Station is his most acclaimed album. Wynton Kelly\'s comping is a study in how a pianist completes a soloist\'s phrases.',
     trackContext:'Remember demonstrates how Wynton Kelly\'s comping fits the spaces in Mobley\'s melody like puzzle pieces — responding, completing, commenting, without ever getting in the way.',
     whatToListenFor:[
       'Listen to how Kelly fills the spaces in Mobley\'s melody — he plays where Mobley rests, rests where Mobley plays',
       'Notice Art Blakey\'s press rolls as transitions between sections',
       'Listen to how Mobley\'s melody is constructed to be singable — mostly stepwise motion with clear phrase shapes',
       'Notice Paul Chambers\' interaction with Kelly\'s left hand'],
     pianistFocus:'Kelly\'s comping is a model of responsiveness — he never plays at the same time as the soloist, and his voicings perfectly support the melody\'s register.',
     connectToExercises:['Stage 11: Neighbor Tones'],
     minimumListens:20},

    {id:'GL-B1-12', trackTitle:'Cheek to Cheek', artist:'Ahmad Jamal',
     album:'Ahmad Jamal at the Pershing: But Not for Me', year:1958, source:'Siskind Book 1',
     sourceUnit:'Unit 12', sourcePages:'pp.183-184', stageAlignment:'Stage 12',
     style:['swing'], concepts:['space','I-vi-ii-V','upper-register','trio-playfulness'], difficulty:'intermediate',
     personnel:[
       {name:'Ahmad Jamal', instrument:'piano'},{name:'Israel Crosby', instrument:'bass'},
       {name:'Vernel Fournier', instrument:'drums'}],
     formMap:[],
     artistBackground:'Ahmad Jamal (b.1930) is one of the most harmonically adventurous post-bop pianists. His use of space influenced Miles Davis profoundly — Davis reportedly told his bands to listen to Jamal.',
     trackContext:'Cheek to Cheek demonstrates Jamal\'s use of space (silence as a musical element), his predilection for high-register repetition, and his playful trio interaction.',
     whatToListenFor:[
       'Listen to Jamal\'s use of space — he lets notes ring and silence build before responding',
       'Notice the I-vi-ii-V turnarounds and how Jamal reharmonizes them',
       'Listen to Israel Crosby\'s bass: locked in rhythmically and supportive harmonically',
       'Notice Vernel Fournier\'s light touch — more brush than stick, more suggestion than assertion',
       'Listen for Jamal\'s upper-register repetition: a figure played high on the keyboard, repeated for effect'],
     pianistFocus:'Jamal\'s dynamics are as important as his notes — he uses extreme soft and loud within a single phrase. Listen to how the trio breathes together.',
     connectToExercises:['Stage 12: Altered Dominant Scales'],
     minimumListens:20},

    /* BOOK 2 */
    {id:'GL-B2-01', trackTitle:'Bye Bye Blackbird', artist:'Miles Davis',
     album:'\'Round About Midnight', year:1956, source:'Siskind Book 2',
     sourceUnit:'Unit 1', sourcePages:'pp.8-9', stageAlignment:'B2-Stage 1',
     style:['swing'], concepts:['block-chords','locked-hands','red-garland'], difficulty:'intermediate',
     personnel:[
       {name:'Miles Davis', instrument:'trumpet'},{name:'John Coltrane', instrument:'tenor saxophone'},
       {name:'Red Garland', instrument:'piano'},{name:'Paul Chambers', instrument:'bass'},
       {name:'Philly Joe Jones', instrument:'drums'}],
     formMap:[],
     artistBackground:'Miles Davis\'s First Great Quintet (1955–1961) featured a rhythm section — particularly Red Garland and Philly Joe Jones — that defined the sound of hard bop comping.',
     trackContext:'Red Garland\'s left-hand comping on this recording is a masterclass in locked-hands block chord style. Compare with the Keith Jarrett version (GL-B2-02) to hear how different pianists approach the same tune.',
     whatToListenFor:[
       'Focus entirely on Red Garland\'s left hand — notice the locked-hands block chord patterns',
       'Listen to how Garland comps under Miles\'s long-note melody: sparse, rhythmically placed',
       'Notice Philly Joe Jones\'s ride cymbal pattern and how it interacts with Garland\'s comping',
       'Compare Garland\'s approach with the Bill Evans tracks — completely different philosophies'],
     pianistFocus:'Red Garland is the definitive locked-hands block chord comper. His left-hand patterns are the template for this style.',
     connectToExercises:['B2 Stage 1: Targeting Downbeats'],
     minimumListens:20},

    {id:'GL-B2-02', trackTitle:'Bye Bye Blackbird', artist:'Keith Jarrett',
     album:'Bye Bye Blackbird', year:1991, source:'Siskind Book 2',
     sourceUnit:'Unit 2', sourcePages:'pp.35-37', stageAlignment:'B2-Stage 2',
     style:['swing'], concepts:['COREA-process','pianistic-personality','bass-solo'], difficulty:'intermediate',
     personnel:[
       {name:'Keith Jarrett', instrument:'piano'},{name:'Gary Peacock', instrument:'bass'},
       {name:'Jack DeJohnette', instrument:'drums'}],
     formMap:[],
     artistBackground:'Keith Jarrett (b.1945) is one of the great solo and trio pianists of the post-bop era. This recording was made at a concert in Tokyo the night after Miles Davis died.',
     trackContext:'The COREA process (Concept, Over, Relentlessly, Elegantly, Ask) is first introduced here. Jarrett\'s approach to Bye Bye Blackbird is entirely different from Garland\'s — this is the same song as GL-B2-01, which is the point.',
     whatToListenFor:[
       'Compare Jarrett\'s approach with Red Garland (GL-B2-01) — same tune, completely different personality',
       'Listen to the bass solo section: how does Jarrett comp for Gary Peacock?',
       'Notice Jarrett\'s extended outro — he takes the tune far beyond the normal form',
       'Listen for the rhythmic concept Siskind asks you to extract for the COREA process: eighth note on beats 2 and 4 followed by a dotted quarter note'],
     pianistFocus:'Jarrett demonstrates how to make a standard tune entirely your own — his comping is more orchestral than accompaniment.',
     connectToExercises:['B2 Stage 2: COREA Process — Rhythmic Concepts'],
     minimumListens:20},

    {id:'GL-B2-03', trackTitle:'Beautiful Love', artist:'Bill Evans',
     album:'Explorations', year:1961, source:'Siskind Book 2',
     sourceUnit:'Unit 3', sourcePages:'p.41', stageAlignment:'B2-Stage 3',
     style:['swing'], concepts:['drop-two','reverse-swing','locked-hands-comparison'], difficulty:'intermediate',
     personnel:[
       {name:'Bill Evans', instrument:'piano'},{name:'Scott LaFaro', instrument:'bass'},
       {name:'Paul Motian', instrument:'drums'}],
     formMap:[],
     artistBackground:'The Bill Evans Trio with Scott LaFaro and Paul Motian (1959–1961) revolutionized jazz trio interplay. LaFaro died in a car accident at 25, just ten days after this album was recorded.',
     trackContext:'Beautiful Love demonstrates Evans\'s use of triplet subdivisions, drop-two voicings, and reverse swing (a rhythmic displacement that feels slightly "behind"). Take 2 is on Explorations.',
     whatToListenFor:[
       'Listen for Evans\'s triplet subdivisions — groups of three notes in a context of four',
       'Notice the drop-two voicing texture in Evans\'s comping: a rich, close voicing style',
       'Listen to LaFaro\'s bass: he plays countermelodies against Evans, not just the chord roots',
       'Notice Motian\'s brush work — more conversation than timekeeping'],
     pianistFocus:'Evans\'s reverse swing — playing slightly behind the beat — creates a floating, suspended feel that is the opposite of Garland\'s forward momentum.',
     connectToExercises:['B2 Stage 3: Scale Game 1'],
     minimumListens:20},

    {id:'GL-B2-04', trackTitle:'If I Should Lose You', artist:'Hank Mobley',
     album:'Soul Station', year:1960, source:'Siskind Book 2',
     sourceUnit:'Unit 4', sourcePages:'pp.78-80', stageAlignment:'B2-Stage 4',
     style:['hard-bop'], concepts:['motivic-development','bebop-quotes','recapitulation'], difficulty:'intermediate',
     personnel:[
       {name:'Hank Mobley', instrument:'tenor saxophone'},{name:'Wynton Kelly', instrument:'piano'},
       {name:'Paul Chambers', instrument:'bass'},{name:'Art Blakey', instrument:'drums'}],
     formMap:[],
     artistBackground:'Soul Station is Hank Mobley\'s most celebrated album and includes two of his most studied improvisations on the two recordings.',
     trackContext:'If I Should Lose You demonstrates motivic development: how a jazz improviser takes a short musical idea and develops it across a solo. Mobley quotes "Carmen" and "Bebop" within this solo.',
     whatToListenFor:[
       'Listen for Mobley\'s initial motive (a short melodic figure) and track how he develops it',
       'Listen for the Carmen quote and the Bebop quote — they occur as Mobley plays on the changes',
       'Notice how the solo builds to its climax and then comes back down (recapitulation)',
       'Listen to Kelly\'s comping: he follows Mobley\'s motivic development with complementary figures'],
     pianistFocus:'Wynton Kelly supports Mobley\'s motivic development by echoing and completing figures — listen to the conversation between them.',
     connectToExercises:['B2 Stage 4: Scale Game 2'],
     minimumListens:20},

    {id:'GL-B2-05', trackTitle:'Say It (Over and Over Again)', artist:'John Coltrane',
     album:'Ballads', year:1963, source:'Siskind Book 2',
     sourceUnit:'Unit 5', sourcePages:'pp.78-80', stageAlignment:'B2-Stage 5',
     style:['ballad'], concepts:['ballad-style','upper-structures','gestural-improv'], difficulty:'intermediate',
     personnel:[
       {name:'John Coltrane', instrument:'tenor saxophone'},{name:'McCoy Tyner', instrument:'piano'},
       {name:'Jimmy Garrison', instrument:'bass'},{name:'Elvin Jones', instrument:'drums'}],
     formMap:[],
     artistBackground:'Coltrane\'s Ballads album (1963) was a conscious counterpoint to the intensity of his avant-garde work. McCoy Tyner\'s piano is a study in upper structure voicings behind a ballad melody.',
     trackContext:'Say It demonstrates McCoy Tyner\'s quartal/upper-structure approach in a ballad context — how to create harmonic richness without density.',
     whatToListenFor:[
       'Focus on McCoy Tyner\'s piano: notice his quartal (fourths-based) voicings',
       'Listen for upper structure triads: Tyner plays triads that sit above the chord root',
       'Notice how sparse and gestural Coltrane\'s improvisation is compared to his other recordings',
       'Listen to Jimmy Garrison\'s bass: long, held notes rather than a walking line'],
     pianistFocus:'Tyner demonstrates that quartal voicings work in any context — their ambiguity lets them fit tunes of any style.',
     connectToExercises:['B2 Stage 5: Targeting Guidetone Lines'],
     minimumListens:20},

    {id:'GL-B2-06', trackTitle:'Softly, As in a Morning Sunrise', artist:'Sonny Rollins',
     album:'A Night at the Village Vanguard', year:1957, source:'Siskind Book 2',
     sourceUnit:'Unit 6', sourcePages:'pp.94-95', stageAlignment:'B2-Stage 6',
     style:['swing'], concepts:['pianoless-trio','student-comps-along','double-time','chromatic-descent'], difficulty:'intermediate',
     personnel:[
       {name:'Sonny Rollins', instrument:'tenor saxophone'},{name:'Wilbur Ware', instrument:'bass'},
       {name:'Elvin Jones', instrument:'drums'}],
     formMap:[],
     artistBackground:'Sonny Rollins (b.1930) recorded this famous pianoless trio at the Village Vanguard in 1957 — one of the landmark live recordings in jazz history.',
     trackContext:'There is no piano on this recording, which makes it perfect for playing along. You comp the entire performance yourself. This is also where Siskind introduces the COREA process for bebop concepts.',
     whatToListenFor:[
       'Play your voicings along with the recording — you are the only pianist',
       'Listen for double-time sections where Rollins doubles his phrase density',
       'Notice the chromatic descending guidetone lines Rollins implies in certain passages',
       'Listen to Elvin Jones: he plays more aggressively and freely than most classic swing drummers'],
     pianistFocus:'Your job on this track is to comp as if you are there. Focus on placing chords where Rollins leaves space.',
     connectToExercises:['B2 Stage 6: COREA Process — Bebop'],
     minimumListens:20},

    {id:'GL-B2-07', trackTitle:'Night Train', artist:'Oscar Peterson',
     album:'Night Train', year:1963, source:'Siskind Book 2',
     sourceUnit:'Unit 7', sourcePages:'pp.151-152', stageAlignment:'B2-Stage 7',
     style:['blues','swing'], concepts:['big-band-imitation','shout-chorus-voicings','boogie-woogie'], difficulty:'intermediate',
     personnel:[
       {name:'Oscar Peterson', instrument:'piano'},{name:'Ray Brown', instrument:'bass'},
       {name:'Ed Thigpen', instrument:'drums'}],
     formMap:[],
     artistBackground:'Night Train is Oscar Peterson at his most blues-inflected — imitating big band textures with a trio.',
     trackContext:'Peterson demonstrates how a pianist can imitate an entire big band: the left hand plays brass section voicings, the right hand plays sax-section melodies, and the boogie-woogie bass pattern drives the blues.',
     whatToListenFor:[
       'Listen to how Peterson\'s left hand plays shout-chorus voicings that sound like a brass section',
       'Notice the boogie-woogie bass pattern in the left hand — an eighth-note rhythmic figure',
       'Listen for the big band "call-and-response" between Peterson\'s hands',
       'Notice the blues form variants: standard 12-bar, then variations with extra bars'],
     pianistFocus:'Peterson demonstrates how pianistic arranging — imitating orchestral textures — can elevate a trio performance.',
     connectToExercises:['B2 Stage 7: Motive Development'],
     minimumListens:20},

    {id:'GL-B2-08', trackTitle:'Moose the Mooche', artist:'George Shearing',
     album:'(various)', year:null, source:'Siskind Book 2',
     sourceUnit:'Unit 8', sourcePages:'p.172', stageAlignment:'B2-Stage 8',
     style:['bebop'], concepts:['rhythm-changes','closed-position','locked-hands'], difficulty:'intermediate',
     personnel:[{name:'George Shearing', instrument:'piano'}],
     formMap:[],
     artistBackground:'George Shearing (1919–2011) developed the "Shearing sound" — parallel block chords with the melody doubled by the vibraphone and guitar at the octave.',
     trackContext:'Moose the Mooche is built on Rhythm Changes — the chord progression of I Got Rhythm. Shearing\'s closed-position voicings are the focus.',
     whatToListenFor:[
       'Listen to Shearing\'s closed-position block chords — notes tightly packed rather than spread out',
       'Notice the Rhythm Changes form: AABA, with the bridge cycling through dominant chords',
       'Listen to how soloist strategies change on the bridge versus the A sections'],
     pianistFocus:'Shearing\'s block chord technique is distinctive — parallel motion in all voices, creating a warm, dense texture.',
     connectToExercises:['B2 Stage 8: Developing Beginnings and Endings'],
     minimumListens:20},

    {id:'GL-B2-09', trackTitle:'Oleo', artist:'Miles Davis',
     album:'Bags\' Groove', year:1954, source:'Siskind Book 2',
     sourceUnit:'Unit 9', sourcePages:'pp.195-196', stageAlignment:'B2-Stage 9',
     style:['bebop'], concepts:['rhythm-changes','horace-silver-comping','stop-start'], difficulty:'intermediate',
     personnel:[
       {name:'Miles Davis', instrument:'trumpet'},{name:'Horace Silver', instrument:'piano'},
       {name:'Percy Heath', instrument:'bass'},{name:'Kenny Clarke', instrument:'drums'},
       {name:'Sonny Rollins', instrument:'tenor saxophone'}],
     formMap:[],
     artistBackground:'Horace Silver (1928–2014) was a founding father of hard bop. His comping on Bags\' Groove is earthy, funky, and bluesy — a counterpoint to Bill Evans\'s more impressionistic approach.',
     trackContext:'Oleo demonstrates stop-start rhythm section behavior and Horace Silver\'s comping, with an open bridge for piano improvisation (the band drops out on the bridge, giving the pianist space).',
     whatToListenFor:[
       'Listen for stop-start moments: the rhythm section drops out suddenly, then re-enters',
       'Notice Horace Silver\'s comping — earthier and more percussive than Evans or Garland',
       'Listen to the bridge: the band drops out and the piano improvises alone',
       'Notice Rollins\'s extremely modern bebop vocabulary over the Rhythm Changes form'],
     pianistFocus:'Horace Silver demonstrates blues-inflected comping — funky, syncopated, and rhythmically driven.',
     connectToExercises:['B2 Stage 9: Leaps & Compound Melodies'],
     minimumListens:20},

    {id:'GL-B2-10', trackTitle:'Infant Eyes', artist:'Wayne Shorter',
     album:'Speak No Evil', year:1966, source:'Siskind Book 2',
     sourceUnit:'Unit 10', sourcePages:'pp.219-220', stageAlignment:'B2-Stage 10',
     style:['modal','ballad'], concepts:['second-great-quintet','pentatonic','ballad-comping'], difficulty:'advanced',
     personnel:[
       {name:'Wayne Shorter', instrument:'tenor saxophone'},{name:'Herbie Hancock', instrument:'piano'},
       {name:'Ron Carter', instrument:'bass'},{name:'Elvin Jones', instrument:'drums'},
       {name:'Freddie Hubbard', instrument:'trumpet'}],
     formMap:[],
     artistBackground:'Wayne Shorter (1933–2023) was one of jazz\'s most influential composers. Speak No Evil introduces Shorter\'s modal ballad writing, and Herbie Hancock\'s comping is a model of restraint and color.',
     trackContext:'Infant Eyes demonstrates the modal ballad approach: fewer chord changes, more melodic freedom, and Hancock\'s intro establishes the harmonic language before the head enters.',
     whatToListenFor:[
       'Listen to Hancock\'s intro: he establishes the sound world before the head begins',
       'Notice Hancock\'s sparse ballad comping — he plays far less than you might expect',
       'Listen for pentatonic scale fragments in the improvisation',
       'Notice how the rhythm section adjusts tempo perception — elastic rather than strict'],
     pianistFocus:'Hancock\'s comping is coloristic: he uses voicings to establish mood rather than to mark chord changes.',
     connectToExercises:['B2 Stage 10: Bebop Scales & Arpeggios'],
     minimumListens:20},

    {id:'GL-B2-11', trackTitle:'Hallucinations', artist:'Bud Powell',
     album:'The Genius of Bud Powell', year:1951, source:'Siskind Book 2',
     sourceUnit:'Unit 11', sourcePages:'pp.253-256', stageAlignment:'B2-Stage 11',
     style:['bebop'], concepts:['shell-voicings','left-hand-as-bass','right-hand-melody'], difficulty:'advanced',
     personnel:[
       {name:'Bud Powell', instrument:'piano'},{name:'Ray Brown', instrument:'bass'},
       {name:'Buddy Rich', instrument:'drums'}],
     formMap:[],
     artistBackground:'Bud Powell (1924–1966) created the blueprint for bebop piano. His right-hand lines were as fast and complex as Bird or Dizzy; his left hand played shell voicings as sparse as a bass drum.',
     trackContext:'Hallucinations demonstrates the bebop piano approach: right hand plays melodic lines derived from the chord-scale material, left hand plays sparse shell voicings on beats 2 and 4.',
     whatToListenFor:[
       'Listen to Powell\'s left hand: sparse two-note shell voicings, not full chords',
       'Notice his right hand lines: running eighth notes derived from chord arpeggios and bebop scale patterns',
       'Listen to the contrapuntal relationship between his two hands — they play independently',
       'Notice the extreme precision of his bebop vocabulary — every note has a reason'],
     pianistFocus:'Powell invented the two-handed independence that all bebop pianists use — sparse left, melodic right.',
     connectToExercises:['B2 Stage 11: Rhythmic Circuits'],
     minimumListens:20},

    {id:'GL-B2-12', trackTitle:'The Very Thought of You', artist:'Hank Jones',
     album:'At Maybeck', year:1989, source:'Siskind Book 2',
     sourceUnit:'Unit 12', sourcePages:'pp.273-277', stageAlignment:'B2-Stage 12',
     style:['swing'], concepts:['solo-piano','stride','shell-voicings','key-modulation'], difficulty:'advanced',
     personnel:[{name:'Hank Jones', instrument:'piano (solo)'}],
     formMap:[],
     artistBackground:'Hank Jones (1918–2010) was one of the most distinguished pianists of the swing and bebop eras. The Maybeck series captured solo pianists at Maybeck Recital Hall in Berkeley.',
     trackContext:'Solo piano performance demonstrates the full range of left-hand techniques: stride piano (alternating bass notes and chords), shell voicings, and the Peace Piece-style ostinato patterns.',
     whatToListenFor:[
       'Listen for stride piano sections: left hand alternates between a bass note and a chord',
       'Notice shell voicing passages: just two notes in the left hand, minimal but complete',
       'Listen for key modulations — Jones reharmonizes and moves through different key centers',
       'Notice the Peace Piece-influenced left-hand ostinato pattern in certain sections'],
     pianistFocus:'Jones demonstrates that a solo pianist must be their own rhythm section, harmony section, and melody all at once.',
     connectToExercises:['B2 Stage 12: Self-Transcription Analysis'],
     minimumListens:20},

    /* BOOK 3 */
    {id:'GL-B3-01', trackTitle:'Little Sunflower', artist:'Freddie Hubbard',
     album:'Backlash', year:1967, source:'Siskind Book 3',
     sourceUnit:'Unit 1', sourcePages:'pp.9-10', stageAlignment:'B3-Stage 1',
     style:['modal','afro-cuban'], concepts:['modal-comping','tension-release','hemiola'], difficulty:'advanced',
     personnel:[
       {name:'Freddie Hubbard', instrument:'trumpet'},{name:'Albert Dailey', instrument:'piano'},
       {name:'Reggie Workman', instrument:'bass'},{name:'Louis Hayes', instrument:'drums'}],
     formMap:[],
     artistBackground:'Freddie Hubbard (1938–2008) was a hard bop and post-bop trumpet player of extraordinary facility. Backlash is one of his finest recordings.',
     trackContext:'Little Sunflower demonstrates how to build tension and release in modal music without changing chords, and Albert Dailey\'s hemiola use (3-against-2 rhythmic patterns).',
     whatToListenFor:[
       'Notice how Dailey creates tension and release through rhythm rather than harmonic movement',
       'Listen for hemiola: three notes phrased across two beats, creating rhythmic ambiguity',
       'Notice the Afro-Cuban rhythmic element in the groove',
       'Listen to how Hubbard\'s solo builds and releases — a modal vocabulary without bebop patterns'],
     pianistFocus:'Albert Dailey uses modal comping to create forward motion without chord changes — a key skill in post-bop piano.',
     connectToExercises:['B3 Stage 1: Modal Drone Improvisation'],
     minimumListens:20},

    {id:'GL-B3-02', trackTitle:'Milestones', artist:'Wes Montgomery & Jimmy Smith',
     album:'Further Adventures', year:1966, source:'Siskind Book 3',
     sourceUnit:'Unit 2', sourcePages:'p.32', stageAlignment:'B3-Stage 2',
     style:['modal'], concepts:['shape-and-rhythm','guitar-organ-duo','arrangement'], difficulty:'advanced',
     personnel:[
       {name:'Wes Montgomery', instrument:'guitar'},{name:'Jimmy Smith', instrument:'organ'},
       {name:'Oliver Nelson', instrument:'arranger'}],
     formMap:[],
     artistBackground:'Wes Montgomery (1923–1968) and Jimmy Smith (1925–2005) were both at the peak of their careers on this collaboration. Oliver Nelson\'s arrangement adds orchestral depth.',
     trackContext:'Milestones demonstrates using shape and rhythm for continuity in improvisation — how Montgomery develops lines by rhythmic variation while keeping a consistent gestural shape.',
     whatToListenFor:[
       'Listen to Montgomery\'s lines: how does he use rhythm to create momentum through a phrase?',
       'Notice the shape of his phrases — ascending/descending arcs that give his lines a vocal quality',
       'Listen to how Jimmy Smith comps for Montgomery without a piano — organ fills the harmonic role',
       'Notice Oliver Nelson\'s ensemble arrangement and how it frames the solos'],
     pianistFocus:'Jimmy Smith demonstrates how to comp without getting in the way of a soloist who has as much harmonic knowledge as you do.',
     connectToExercises:['B3 Stage 2: Practicing Melodic Gestures'],
     minimumListens:20},

    {id:'GL-B3-03', trackTitle:'Witch Hunt', artist:'Wayne Shorter',
     album:'Speak No Evil', year:1966, source:'Siskind Book 3',
     sourceUnit:'Unit 3', sourcePages:'pp.47-48', stageAlignment:'B3-Stage 3',
     style:['hard-bop','modal'], concepts:['pentatonic-use','planing','tension-release'], difficulty:'advanced',
     personnel:[
       {name:'Wayne Shorter', instrument:'tenor saxophone'},{name:'Herbie Hancock', instrument:'piano'},
       {name:'Ron Carter', instrument:'bass'},{name:'Elvin Jones', instrument:'drums'},
       {name:'Freddie Hubbard', instrument:'trumpet'}],
     formMap:[],
     artistBackground:'Speak No Evil is one of the great Blue Note albums, featuring Shorter at his peak as a composer-improviser.',
     trackContext:'Witch Hunt demonstrates Shorter\'s use of pentatonic scales as an improvisational vocabulary, and Hancock\'s "planing" (moving a voicing in parallel motion to create harmonic color).',
     whatToListenFor:[
       'Listen for pentatonic scale use in the solos — five-note fragments rather than chromatic runs',
       'Notice Hancock\'s planing: the same voicing shape moved up or down in parallel motion',
       'Listen to tension-release devices: how do the players create and resolve tension in a modal context?',
       'Notice Elvin Jones\'s polyrhythmic drumming — multiple rhythms layered simultaneously'],
     pianistFocus:'Hancock\'s planing technique creates harmonic color through voice-leading rather than chord changes.',
     connectToExercises:['B3 Stage 3: Memory Games'],
     minimumListens:20},

    {id:'GL-B3-04', trackTitle:'Passion Dance', artist:'McCoy Tyner',
     album:'The Real McCoy', year:1967, source:'Siskind Book 3',
     sourceUnit:'Unit 4', sourcePages:'p.68', stageAlignment:'B3-Stage 4',
     style:['modal'], concepts:['quartal-voicings','upper-structures','metric-modulation'], difficulty:'advanced',
     personnel:[
       {name:'McCoy Tyner', instrument:'piano'},{name:'Joe Henderson', instrument:'tenor saxophone'},
       {name:'Ron Carter', instrument:'bass'},{name:'Elvin Jones', instrument:'drums'}],
     formMap:[],
     artistBackground:'McCoy Tyner (1938–2020) developed the most powerful left-hand comping in post-bop piano. His quartal voicings and upper structures created a new harmonic language.',
     trackContext:'Passion Dance is a study in quartal voicings (built in fourths rather than thirds), upper structure triads, and Tyner\'s metric modulation — shifting the listener\'s sense of where "one" is.',
     whatToListenFor:[
       'Listen to Tyner\'s left-hand voicings: stacked fourths creating a powerful, ambiguous sound',
       'Notice upper structure triads in his comping: he plays a triad that sits above the chord root',
       'Listen for metric modulation — where does your sense of the beat temporarily shift?',
       'Notice Elvin Jones\'s collective improvisation: he plays with Tyner as an equal partner, not just keeping time'],
     pianistFocus:'Tyner demonstrates that power in piano playing comes from voicing weight and rhythmic conviction, not speed.',
     connectToExercises:['B3 Stage 4: Shifting Upper Structures'],
     minimumListens:20},

    {id:'GL-B3-05', trackTitle:'Afro Blue', artist:'McCoy Tyner',
     album:'Live at Newport', year:1963, source:'Siskind Book 3',
     sourceUnit:'Unit 5', sourcePages:'pp.83-84', stageAlignment:'B3-Stage 5',
     style:['modal','afro-cuban'], concepts:['pentatonic-voicings','3-4-groove'], difficulty:'advanced',
     personnel:[
       {name:'McCoy Tyner', instrument:'piano'},{name:'John Coltrane', instrument:'tenor saxophone'}],
     formMap:[],
     artistBackground:'Afro Blue was originally a composition by Mongo Santamaría; Coltrane and Tyner transformed it into a modal jazz vehicle on the Live at Birdland album.',
     trackContext:'Afro Blue in 3/4 time demonstrates pentatonic voicings in a groove context and how a pianist maintains forward motion through a modal vamp.',
     whatToListenFor:[
       'Feel the 3/4 groove — different from the waltz of Bluesette, this is more of an Afro-Cuban triplet feel',
       'Listen to Tyner\'s pentatonic voicing vocabulary — five-note scale fragments voiced as chords',
       'Notice how Coltrane uses the scale freely — modal improvisation at its most intense',
       'Listen to how the rhythm section creates forward momentum without traditional harmonic movement'],
     pianistFocus:'Tyner\'s pentatonic voicings are stacked to create maximum resonance on an acoustic piano.',
     connectToExercises:['B3 Stage 5: Shifting Mindset'],
     minimumListens:20},

    {id:'GL-B3-06', trackTitle:'Inner Urge', artist:'Joe Henderson',
     album:'Inner Urge', year:1965, source:'Siskind Book 3',
     sourceUnit:'Unit 6', sourcePages:'p.128', stageAlignment:'B3-Stage 6',
     style:['post-bop'], concepts:['constant-structure','modal-interchange','non-functional'], difficulty:'advanced',
     personnel:[
       {name:'Joe Henderson', instrument:'tenor saxophone'},{name:'McCoy Tyner', instrument:'piano'},
       {name:'Bob Cranshaw', instrument:'bass'},{name:'Elvin Jones', instrument:'drums'}],
     formMap:[],
     artistBackground:'Joe Henderson (1937–2001) was one of the most sophisticated tenors of his generation. Inner Urge uses "constant structure" — chords that keep the same shape while moving by half steps or other intervals.',
     trackContext:'Inner Urge demonstrates modal interchange (borrowing chords from parallel modes) and how to handle non-functional harmony — chords that don\'t resolve in the traditional V→I way.',
     whatToListenFor:[
       'Listen to the constant structure chord movement — the same voicing type moving chromatically',
       'Notice how Henderson navigates non-functional harmony: he uses motivic development rather than scale-based lines',
       'Listen to Tyner\'s comping: he adjusts his vocabulary to match the post-bop harmonic language',
       'Notice the absence of traditional V-I resolution — the harmonic tension is never fully resolved'],
     pianistFocus:'Tyner demonstrates how quartal voicings adapt to non-functional harmony better than tertian voicings.',
     connectToExercises:['B3 Stage 6: Tonicization Practice'],
     minimumListens:20},

    {id:'GL-B3-07', trackTitle:'Windows', artist:'Chick Corea',
     album:'Now He Sings, Now He Sobs', year:1968, source:'Siskind Book 3',
     sourceUnit:'Unit 7', sourcePages:'pp.129-130', stageAlignment:'B3-Stage 7',
     style:['modal'], concepts:['corea-influences','melodic-minor','modal-blend'], difficulty:'advanced',
     personnel:[
       {name:'Chick Corea', instrument:'piano'},{name:'Miroslav Vitous', instrument:'bass'},
       {name:'Roy Haynes', instrument:'drums'}],
     formMap:[],
     artistBackground:'Chick Corea (1941–2021) developed an approach that blended classical technique, jazz improvisation, Spanish influences, and folk music. Now He Sings is one of the definitive piano trio albums.',
     trackContext:'Windows demonstrates how to blend melodic minor with major modes, and Corea\'s amalgam of influences: classical clarity of touch, Spanish rhythmic energy, jazz harmonic knowledge.',
     whatToListenFor:[
       'Listen for melodic minor scale fragments: the raised sixth and seventh give a distinctive color',
       'Notice Corea\'s touch: clear articulation, classical-influenced technique',
       'Listen to Roy Haynes\'s free drumming — one of jazz\'s most adventurous drum vocabularies',
       'Notice how Corea\'s Spanish influences emerge in rhythmic patterns'],
     pianistFocus:'Corea demonstrates how to move between different modal worlds within a single improvisation.',
     connectToExercises:['B3 Stage 7: Related Major & Melodic Minor Modes'],
     minimumListens:20},

    {id:'GL-B3-08', trackTitle:'One\'s Own Room', artist:'Mulgrew Miller',
     album:'Wingspan', year:1987, source:'Siskind Book 3',
     sourceUnit:'Unit 8', sourcePages:'pp.157-158', stageAlignment:'B3-Stage 8',
     style:['modal'], concepts:['modal-interchange','planing','octatonic','memphis-piano'], difficulty:'advanced',
     personnel:[
       {name:'Mulgrew Miller', instrument:'piano'},{name:'Charnett Moffett', instrument:'bass'},
       {name:'Tony Reedus', instrument:'drums'}],
     formMap:[],
     artistBackground:'Mulgrew Miller (1955–2013) represented the Memphis piano school — a warm, bluesy approach to post-bop. Wingspan is one of his finest recordings.',
     trackContext:'One\'s Own Room demonstrates modal interchange over an F pedal point, planing technique, and the half-whole octatonic scale.',
     whatToListenFor:[
       'Notice the F pedal point: the bass note stays on F while the harmony changes above it',
       'Listen for planing: voicings moving in parallel motion, creating a static but shifting texture',
       'Listen for the half-whole octatonic scale: alternating half and whole steps giving a distinctive tension',
       'Notice Miller\'s bluesy approach even in a modal context — the Memphis tradition'],
     pianistFocus:'Miller demonstrates how modal interchange (borrowing from parallel modes) can create richness over a pedal point.',
     connectToExercises:['B3 Stage 8: Practicing Sidestepping'],
     minimumListens:20},

    {id:'GL-B3-09', trackTitle:'Autumn Leaves', artist:'Miles Davis',
     album:'Miles in Berlin', year:1964, source:'Siskind Book 3',
     sourceUnit:'Unit 9', sourcePages:'pp.181-182', stageAlignment:'B3-Stage 9',
     style:['swing','modal'], concepts:['hancock-modal-interchange','planing','exciting-rhythm'], difficulty:'advanced',
     personnel:[
       {name:'Miles Davis', instrument:'trumpet'},{name:'Wayne Shorter', instrument:'tenor saxophone'},
       {name:'Herbie Hancock', instrument:'piano'},{name:'Ron Carter', instrument:'bass'},
       {name:'Tony Williams', instrument:'drums'}],
     formMap:[],
     artistBackground:'Miles Davis\'s Second Great Quintet (1964–1968) is widely considered the greatest jazz band in history. Tony Williams was 18 years old on this recording.',
     trackContext:'Autumn Leaves demonstrates the Second Great Quintet\'s approach to a standard: Hancock plays modal interchange and planing over a well-known tune, and Tony Williams plays more freely than any drummer in this style before him.',
     whatToListenFor:[
       'Listen to Hancock\'s comping: he uses modal interchange (chords from parallel modes) behind Miles',
       'Notice Hancock\'s planing: the same voicing type moving up or down',
       'Listen to Tony Williams\'s drumming — he plays freely and conversationally, not just time',
       'Notice how the band transforms a familiar standard into something entirely contemporary'],
     pianistFocus:'Hancock demonstrates how to use advanced harmonic vocabulary (modal interchange, planing) in a standard chord progression context.',
     connectToExercises:['B3 Stage 9: Practicing Modal Interchange'],
     minimumListens:20},

    {id:'GL-B3-10', trackTitle:'Modal Blues', artist:'(Various)',
     album:'(Various)', year:null, source:'Siskind Book 3',
     sourceUnit:'Unit 10', sourcePages:null, stageAlignment:'B3-Stage 10',
     style:['modal','blues'], concepts:['modal-blues','non-chord-tones','mixolydian'], difficulty:'advanced',
     personnel:[],
     formMap:[],
     artistBackground:'The modal blues approach combines the blues form with modal improvisation — using Mixolydian, Dorian, and blues scale fragments over a static blues structure.',
     trackContext:'Find recordings of modal blues by any of the artists you have studied — McCoy Tyner, Herbie Hancock, or Miles Davis. The focus is on non-chord tone patterns and Mixolydian blues vocabulary.',
     whatToListenFor:[
       'Listen for Mixolydian scale use: the flattened seventh is the key note that creates the blues-modal fusion',
       'Notice non-chord tone patterns: notes that don\'t belong to the scale but create tension before resolving',
       'Listen to how the improviser uses the entire 12-bar form as a canvas for modal development'],
     pianistFocus:'Modal blues demonstrates that the blues and modal jazz are not separate vocabularies — they blend naturally at the point of the flat seven.',
     connectToExercises:['B3 Stage 10: Bebop Shapes in Modal Context'],
     minimumListens:20},

    {id:'GL-B3-11', trackTitle:'I Didn\'t Know What Time It Was', artist:'Brad Mehldau',
     album:'The Art of the Trio, Vol. 1', year:1996, source:'Siskind Book 3',
     sourceUnit:'Unit 11', sourcePages:'pp.253-256', stageAlignment:'B3-Stage 11',
     style:['swing','odd-meter'], concepts:['5-4-time','rhythmic-tension','modal-interchange'], difficulty:'advanced',
     personnel:[
       {name:'Brad Mehldau', instrument:'piano'},{name:'Larry Grenadier', instrument:'bass'},
       {name:'Jorge Rossy', instrument:'drums'}],
     formMap:[],
     artistBackground:'Brad Mehldau (b.1970) revived the piano trio format for a new generation. His Art of the Trio series documents his development in the late 1990s.',
     trackContext:'This performance (on the album) includes a section in 5/4 time — five beats per measure — creating rhythmic tension against the listener\'s expectation. A transcription project is paired with this recording.',
     whatToListenFor:[
       'Listen to the 5/4 section: count "one two three four five" and feel how the phrase length differs',
       'Notice Mehldau\'s modal interchange: borrowing chords from parallel modes within a standard',
       'Listen to the trio\'s conversation: Grenadier and Rossy respond to Mehldau in real time',
       'Notice Mehldau\'s left-hand independence: contrapuntal bass lines against right-hand melodies'],
     pianistFocus:'Mehldau\'s approach to left-hand independence — playing countermelodies rather than chords — is the defining feature of his style.',
     connectToExercises:['B3 Stage 11: Coltrane Changes'],
     minimumListens:20},

    {id:'GL-B3-12', trackTitle:'Fiasco', artist:'Charlie Haden / Paul Motian ft. Geri Allen',
     album:'Etudes', year:1987, source:'Siskind Book 3',
     sourceUnit:'Unit 12', sourcePages:'pp.273-277', stageAlignment:'B3-Stage 12',
     style:['free'], concepts:['free-interaction','motivic-development','fourths-and-half-steps'], difficulty:'advanced',
     personnel:[
       {name:'Geri Allen', instrument:'piano'},{name:'Charlie Haden', instrument:'bass'},
       {name:'Paul Motian', instrument:'drums'}],
     formMap:[],
     artistBackground:'Charlie Haden (1937–2014) and Paul Motian (1931–2011) were two of the most important bassists and drummers in the development of free jazz. Geri Allen (1957–2017) was one of the finest pianists of her generation.',
     trackContext:'Fiasco demonstrates free improvisation: form created through repetition and motivic development rather than a predetermined chord progression. Fourths and half-steps are the primary intervallic motives.',
     whatToListenFor:[
       'Listen for the motivic material: fourths and half-steps appear throughout the performance',
       'Notice how form is created through repetition and development rather than a chord chart',
       'Listen to Geri Allen\'s "siren" sounds — extreme high-register effects',
       'Notice the collective improvisation: no one leads, everyone responds simultaneously',
       'Listen for how silence is used — it is as important as the notes'],
     pianistFocus:'Allen demonstrates free improvisation at its most musical: spontaneous, motivated by the other musicians, and developed over the duration of the performance.',
     connectToExercises:['B3 Stage 12: Complex Rhythms & Free Improvisation'],
     minimumListens:20}
  ],

  compingMasters: [
    {id:'CM-01', pianist:'Richie Beirach', album:'"Forgotten Fantasies" (A&M)', sidemen:'David Liebman', whyListen:'Modern post-bop comping approach'},
    {id:'CM-02', pianist:'Paul Bley', album:'"Sonny Meets Hawk" (RCA)', sidemen:'Sonny Rollins, Coleman Hawkins', whyListen:'Minimalist, space-conscious comping'},
    {id:'CM-03', pianist:'Joanne Brackeen', album:'"Prism" (Choice)', sidemen:'Eddie Gomez', whyListen:'Powerful, inventive duo comping'},
    {id:'CM-04', pianist:'Jaki Byard', album:'"Outward Bound" (Prestige)', sidemen:'Eric Dolphy, Freddie Hubbard', whyListen:'Eclectic, versatile comping across styles'},
    {id:'CM-05', pianist:'George Cables', album:'"Cable\'s Vision" (Contemporary)', sidemen:'Ernie Watts, Freddie Hubbard, Bobby Hutcherson', whyListen:'Clean, sophisticated voicings in ensemble'},
    {id:'CM-06', pianist:'Chick Corea', album:'"Friends" (Polydor)', sidemen:'Joe Farrell, Eddie Gomez, Steve Gadd', whyListen:'Modern quartal voicings, rhythmic creativity'},
    {id:'CM-07', pianist:'Kenny Drew', album:'"Jackie\'s Bag" (Blue Note)', sidemen:'Jackie McLean, Blue Mitchell', whyListen:'Hard bop comping fundamentals'},
    {id:'CM-08', pianist:'Bill Evans', album:'"Kind of Blue" (Columbia)', sidemen:'Miles Davis, Coltrane, Adderley', whyListen:'Definitive modal comping, voicing innovation'},
    {id:'CM-09', pianist:'Tommy Flanagan', album:'"Kenny Burrell with John Coltrane" (Prestige)', sidemen:'Kenny Burrell, John Coltrane', whyListen:'Elegant, supportive comping'},
    {id:'CM-10', pianist:'Hal Galper', album:'"Speak With A Single Voice" (Century)', sidemen:'Michael Brecker, Randy Brecker', whyListen:'Contemporary comping with energy'},
    {id:'CM-11', pianist:'Red Garland', album:'"Relaxin\'" (Prestige)', sidemen:'Miles Davis, Coltrane', whyListen:'Block chord comping, locked-hands style'},
    {id:'CM-12', pianist:'Herbie Hancock', album:'"Maiden Voyage" (Blue Note)', sidemen:'George Coleman, Freddie Hubbard', whyListen:'Modal comping innovation, orchestral approach'},
    {id:'CM-13', pianist:'Roland Hanna', album:'"Dear John C." (Impulse)', sidemen:'Elvin Jones, Richard Davis', whyListen:'Sophisticated harmonic language'},
    {id:'CM-14', pianist:'Barry Harris', album:'"Tune-Up!" (Cobblestone)', sidemen:'Sonny Stitt', whyListen:'Bebop comping mastery'},
    {id:'CM-15', pianist:'Hampton Hawes', album:'"The Seance" (Contemporary)', sidemen:'Red Mitchell', whyListen:'West coast swing comping'},
    {id:'CM-16', pianist:'John Hicks', album:'"Now It\'s My Turn" (Roulette)', sidemen:'Betty Carter', whyListen:'Vocal accompaniment comping'},
    {id:'CM-17', pianist:'Ahmad Jamal', album:'"Ahmad Jamal\'s Alhambra" (Argo)', sidemen:'Israel Crosby, Vernell Fournier', whyListen:'Space, dynamics, trio orchestration'},
    {id:'CM-18', pianist:'Keith Jarrett', album:'"The Survivor\'s Suite" (ECM)', sidemen:'Dewey Redman, Charlie Haden, Paul Motian', whyListen:'Extended form, textural comping'},
    {id:'CM-19', pianist:'Hank Jones', album:'"New Wine In Old Bottles" (Inner City)', sidemen:'Jackie McLean, Ron Carter, Tony Williams', whyListen:'Tasteful, classic comping'},
    {id:'CM-20', pianist:'Wynton Kelly', album:'"Miles Davis In Person… At The Blackhawk" (Columbia)', sidemen:'Miles Davis, Hank Mobley', whyListen:'Swinging comping, perfect time feel'},
    {id:'CM-21', pianist:'Kenny Kirkland', album:'"Think Of One" (Columbia)', sidemen:'Wynton Marsalis, Branford Marsalis', whyListen:'Modern hard bop comping energy'},
    {id:'CM-22', pianist:'John Lewis', album:'"Blues At Carnegie Hall" (Atlantic) — Modern Jazz Quartet', sidemen:'MJQ', whyListen:'Chamber jazz comping'},
    {id:'CM-23', pianist:'Lyle Mays', album:'"Pat Metheny Group" (ECM)', sidemen:'Pat Metheny', whyListen:'Contemporary jazz/fusion comping'},
    {id:'CM-24', pianist:'Jim McNeely', album:'"The Plot Thickens" (Gatemouth)', sidemen:'John Scofield', whyListen:'Creative big-band pianist approach'},
    {id:'CM-25', pianist:'Thelonious Monk', album:'"At The Five Spot" (Milestone)', sidemen:'Johnny Griffin', whyListen:'Unique angular comping, sparse but powerful'},
    {id:'CM-26', pianist:'Oscar Peterson', album:'"Ella & Louis" (Verve)', sidemen:'Ella Fitzgerald, Louis Armstrong', whyListen:'Versatile accompaniment, block chords'},
    {id:'CM-27', pianist:'Bud Powell', album:'"Charlie Parker\'s All-Stars 1950" (Alamac)', sidemen:'Charlie Parker, Fats Navarro', whyListen:'Bebop comping foundation'},
    {id:'CM-28', pianist:'Horace Silver', album:'"Blowin\' The Blues Away" (Blue Note)', sidemen:'Blue Mitchell, Junior Cook', whyListen:'Funky, blues-inflected comping'},
    {id:'CM-29', pianist:'Lennie Tristano', album:'"Subconscious-Lee" (Prestige)', sidemen:'Lee Konitz', whyListen:'Cool jazz, contrapuntal comping'},
    {id:'CM-30', pianist:'McCoy Tyner', album:'"Coltrane Live At Birdland" (MCA/Impulse)', sidemen:'John Coltrane', whyListen:'Quartal voicings, power comping'},
    {id:'CM-31', pianist:'Cedar Walton', album:'"Eastern Rebellion 2" (Timeless)', sidemen:'Bob Berg', whyListen:'Hard bop comping elegance'},
    {id:'CM-32', pianist:'James Williams', album:'"Everything I Love" (Concord)', sidemen:'Bill Pierce, Dennis Irwin, Billy Hart', whyListen:'Memphis piano school comping'},
    {id:'CM-33', pianist:'Joe Zawinul', album:'"Mercy, Mercy, Mercy" (Capitol)', sidemen:'Cannonball Adderley', whyListen:'Soul-jazz, funk-inflected comping'},
    {id:'CM-34', pianist:'Denny Zeitlin', album:'"Tidal Wave" (Columbia)', sidemen:null, whyListen:'Adventurous, modern comping'},
    {id:'CM-35', pianist:'(reserved)', album:null, sidemen:null, whyListen:'Future additions'}
  ],

  listeningMethodology: {
    sevenLevels:[
      {n:1, name:'Background', description:'Listening as background music while doing another task'},
      {n:2, name:'Intent', description:'Listening intently, perhaps with eyes closed or in a dark space'},
      {n:3, name:'Focused', description:'Listening repeatedly with a specific goal — focus on the left hand, the pedal, the articulation'},
      {n:4, name:'Interactive', description:'Listening at your instrument, stopping and starting to experiment at the piano'},
      {n:5, name:'Singing', description:'Learning to sing a solo'},
      {n:6, name:'Transcribing', description:'Writing down the notes from the recording'},
      {n:7, name:'Performing', description:'Playing along with the transcription at least 30 times'}],
    siskindRule:'Listen at least twenty times.',
    levineAdvice:'The answers to all your questions are in your living room.',
    source:'Siskind Book 2, Postlude "An Effective Jazz Practice Session", p.259'
  }
};

/* ---------- accessors ---------- */
const jazzGlTrack = id => LISTENING_LIBRARY.guidedListening.find(t => t.id === id);
const jazzGlBooks = () => [
  {key:'B1', label:'Book 1: Foundations', ids:LISTENING_LIBRARY.guidedListening.filter(t=>t.id.startsWith('GL-B1')).map(t=>t.id)},
  {key:'B2', label:'Book 2: Intermediate', ids:LISTENING_LIBRARY.guidedListening.filter(t=>t.id.startsWith('GL-B2')).map(t=>t.id)},
  {key:'B3', label:'Book 3: Advanced/Modal', ids:LISTENING_LIBRARY.guidedListening.filter(t=>t.id.startsWith('GL-B3')).map(t=>t.id)}
];

/* Convert a GL track to the format jazzListenRecord / jazzListens / jazzMarkListened expect */
const jazzGlToListenA = t => ({artist: t.artist, track: t.trackTitle, album: t.album || ''});

/* ---------- the page ---------- */
function jazzListenState(){
  return S._jlisten = S._jlisten || {detailId: null};
}

function jazzListenHTML(){
  const ls = jazzListenState();
  if(ls.detailId) return jazzListenDetailHTML(ls.detailId);
  return jazzListenListHTML();
}

function jazzListenListHTML(){
  const books = jazzGlBooks();
  const stageNow = jazzNowStage && jazzNowStage();
  const stageId = stageNow ? stageNow.id : 1;

  const trackRow = t => {
    const count = jazzListens(jazzGlToListenA(t));
    const done = count >= t.minimumListens;
    const pct = Math.min(100, Math.round(count / t.minimumListens * 100));
    return `<button class="jl-row${done ? ' jl-done' : ''}" data-jlid="${esc(t.id)}">
      <span class="jl-num mono faint">${t.id}</span>
      <span class="jl-ti">
        <b>“${esc(t.trackTitle)}”</b>
        <span class="faint"> — ${esc(t.artist)}</span>
        <span class="jl-album faint">${esc(t.album)}${t.year ? ` · ${t.year}` : ''}</span>
      </span>
      <span class="jl-bar">
        <span class="jl-bfill" style="width:${pct}%"></span>
      </span>
      <span class="jl-count mono">${count}/${t.minimumListens}</span>
    </button>`;
  };

  const bookSection = b => `<div class="jl-book">
    <h3 class="jl-bookname">${esc(b.label)}</h3>
    <div class="jl-rows">${b.ids.map(id => {
      const t = jazzGlTrack(id);
      return t ? trackRow(t) : '';
    }).join('')}</div>
  </div>`;

  const cm = LISTENING_LIBRARY.compingMasters.filter(c => c.album);
  const compingSection = `<div class="jl-book">
    <h3 class="jl-bookname">Comping Masters — Mantooth’s 35</h3>
    <p class="jl-sub">From Mantooth Chapter 14. Each recording exemplifies a pianist’s comping style.</p>
    <div class="jl-comping">${cm.map(c => `<div class="jl-cm">
      <b>${esc(c.pianist)}</b>
      <span class="faint"> — ${esc(c.album)}</span>
      ${c.sidemen ? `<span class="jl-cm-with faint"> w/ ${esc(c.sidemen)}</span>` : ''}
      <p class="jl-cm-why">${esc(c.whyListen)}</p>
    </div>`).join('')}</div>
  </div>`;

  const lvlSection = `<div class="jl-book jl-meth">
    <h3 class="jl-bookname">Seven Levels of Listening Engagement</h3>
    <p class="jl-sub">Source: ${esc(LISTENING_LIBRARY.listeningMethodology.source)}</p>
    <div class="jl-levels">${LISTENING_LIBRARY.listeningMethodology.sevenLevels.map(l =>
      `<div class="jl-level"><span class="jl-ln mono">${l.n}</span>
       <span><b>${esc(l.name)}</b><span class="faint"> — ${esc(l.description)}</span></span></div>`
    ).join('')}</div>
  </div>`;

  return `<div class="row between" style="align-items:baseline;flex-wrap:wrap;gap:8px">
    <div>
      <h1 class="serif">Listening Library</h1>
      <p class="page-blurb">“${esc(LISTENING_LIBRARY.listeningMethodology.siskindRule)}” — Siskind</p>
    </div>
    <button class="btn sm ghost" id="jlBack">← Jazz Studio</button>
  </div>
  <div class="jl-quote">
    <p>“The recorded history of the music is the only true teacher.” — Siskind</p>
    <p>“The answers to all your questions are in your living room.” — Levine</p>
  </div>
  ${books.map(bookSection).join('')}
  ${compingSection}
  ${lvlSection}`;
}

function jazzListenDetailHTML(id){
  const t = jazzGlTrack(id);
  if(!t) return `<p>Track not found.</p>`;
  const la = jazzGlToListenA(t);
  const count = jazzListens(la);
  const done = count >= t.minimumListens;
  const pct = Math.min(100, Math.round(count / t.minimumListens * 100));

  const personnel = t.personnel.length
    ? `<div class="jl-section"><span class="jl-sh">Personnel</span>
       <div class="jl-pers">${t.personnel.map(p =>
         `<div class="jl-person"><b>${esc(p.name)}</b> <span class="faint">${esc(p.instrument)}</span></div>`
       ).join('')}</div></div>` : '';

  const formMap = t.formMap.length
    ? `<div class="jl-section"><span class="jl-sh">Form Map</span>
       <table class="jl-fm"><tbody>${t.formMap.map(f =>
         `<tr><td class="jl-fts mono">${esc(f.timestamp||'')}</td>
              <td class="jl-fsect">${esc(f.section)}</td>
              <td class="jl-fm faint">${esc(f.measures||'')}</td></tr>`
       ).join('')}</tbody></table></div>` : '';

  const spotifyQ = encodeURIComponent(`${t.trackTitle} ${t.artist}`);
  const ytQ = encodeURIComponent(`${t.trackTitle} ${t.artist} jazz`);
  const amQ = encodeURIComponent(`${t.trackTitle} ${t.artist}`);

  return `<div class="row between" style="align-items:baseline;flex-wrap:wrap;gap:8px">
    <button class="btn sm ghost" id="jlBack">← Listening Library</button>
    <span class="mono faint">${esc(t.id)}</span>
  </div>
  <div class="jl-detail">
    <h1 class="serif">“${esc(t.trackTitle)}”</h1>
    <p class="jl-meta">${esc(t.artist)} — <i>${esc(t.album)}</i>${t.year ? ` (${t.year})` : ''}</p>
    <p class="jl-src mono faint">${esc(t.source)}, ${esc(t.sourceUnit)}${t.sourcePages ? `, ${esc(t.sourcePages)}` : ''} · ${esc(t.stageAlignment)}</p>
    <div class="jl-counter${done ? ' jl-done' : ''}">
      <div class="jl-cbar"><span class="jl-cbfill" style="width:${pct}%"></span></div>
      <div class="jl-crow">
        <span class="jl-cnum">${count}<span class="jl-cof">/${t.minimumListens}</span></span>
        <button class="btn primary" id="jlPlus">+1 listen</button>
        ${count > 0 ? `<button class="btn sm ghost" id="jlMinus">undo</button>` : ''}
        ${done ? `<span class="jl-check">✓ twenty done</span>` : ''}
      </div>
    </div>
    ${personnel}
    ${formMap}
    <div class="jl-section"><span class="jl-sh">About the artist</span>
      <p class="jl-body">${esc(t.artistBackground)}</p></div>
    <div class="jl-section"><span class="jl-sh">About the track</span>
      <p class="jl-body">${esc(t.trackContext)}</p></div>
    <div class="jl-section"><span class="jl-sh">What to listen for</span>
      <ul class="jl-wtlf">${t.whatToListenFor.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>
    ${t.pianistFocus ? `<div class="jl-section jl-pf"><span class="jl-sh">Pianist focus</span>
      <p class="jl-body">${esc(t.pianistFocus)}</p></div>` : ''}
    <div class="jl-section"><span class="jl-sh">Connects to your exercises</span>
      <ul class="jl-conns-list">${t.connectToExercises.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>
    <div class="jl-section jl-stream">
      <span class="jl-sh">Stream or search</span>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px">
        <a class="btn sm ghost" href="https://open.spotify.com/search/${spotifyQ}" target="_blank" rel="noopener">Spotify</a>
        <a class="btn sm ghost" href="https://music.apple.com/search?term=${amQ}" target="_blank" rel="noopener">Apple Music</a>
        <a class="btn sm ghost" href="https://www.youtube.com/results?search_query=${ytQ}" target="_blank" rel="noopener">YouTube</a>
      </div>
    </div>
  </div>`;
}

function bindJazzListen(root){
  const back = root.querySelector('#jlBack');
  if(back){
    back.onclick = () => {
      const ls = jazzListenState();
      if(ls.detailId){ ls.detailId = null; navigate('#/jazz/listen'); }
      else navigate('#/jazz');
    };
  }
  root.querySelectorAll('[data-jlid]').forEach(b => {
    b.onclick = () => {
      jazzListenState().detailId = b.dataset.jlid;
      navigate('#/jazz/listen/' + b.dataset.jlid);
    };
  });
  const plus = root.querySelector('#jlPlus');
  if(plus){
    plus.onclick = () => {
      const id = jazzListenState().detailId;
      const t = jazzGlTrack(id);
      if(t){ jazzMarkListened(jazzGlToListenA(t), ''); sound('click'); rerender(); }
    };
  }
  const minus = root.querySelector('#jlMinus');
  if(minus){
    minus.onclick = () => {
      const id = jazzListenState().detailId;
      const t = jazzGlTrack(id);
      if(t){ jazzUnmarkListened(jazzGlToListenA(t)); sound('click'); rerender(); }
    };
  }
}
