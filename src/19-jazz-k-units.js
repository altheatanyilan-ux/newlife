/* ============================================================
   SISKIND UNIT ASSIGNMENTS — the connective tissue.

   The stages say what skills exist. The exercises show what the
   patterns sound like. This is the part Siskind actually wrote
   on the assignment pages: what to do each day, for how long,
   in what order. Thirty-six units, twelve per book, five to
   eight items each. Not a second curriculum — the one that is
   already there, with the instructions that arrive with it.

   Each unit has an id (B1-U1 … B3-U12), a stage alignment so
   the plan page can surface the right unit, and a list of
   assignment items. Items carry a four-part classification so
   the plan engine can weight them correctly: fundamentals, rote,
   tunes, listening. A completed flag per item lives in state so
   the user can tick things off as they go.
   ============================================================ */

/* ---------- the catalog ---------- */
const SISKIND_UNITS = [

  /* ── BOOK 1 ──────────────────────────────────────────────── */

  {id:'B1-U1', book:1, unit:1, name:'Getting Oriented',
   stageId:1, stageLabel:'Stage 1',
   assignments:[
    {part:'fundamentals', minutes:15, category:'improvisation',
     text:'Improvisation Exercise 1 — Drone Improvisation 1: listen to phrases and rhythms over a held bass note. Timer on, five minutes minimum.'},
    {part:'rote', minutes:20, category:'coordination',
     text:'Practice Coordination Exercise 1 in all twelve keys — swing eighths in RH over LH quarter notes. Repeat every other note of the major scale to create a triplet subdivision, then remove it but keep hearing it.'},
    {part:'rote', minutes:10, category:'swing',
     text:'Play through the swing exercises with correct articulation. Use the scat syllables: doo, VAH, DIT, daht. Accent the offbeat (VAH) and de-emphasise the onbeat (doo).'},
    {part:'tunes', minutes:15, category:'tune-app',
     text:'Practice finding major, minor and dominant seventh chords by type — flashcards, or vamp through a Real Book tune naming every chord before you play it.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: "Freddie Freeloader" by Miles Davis — listen 20 times or more, following the 12-bar form all the way through each chorus.'}
  ]},

  {id:'B1-U2', book:1, unit:2, name:'Comping Basics',
   stageId:1, stageLabel:'Stage 1',
   assignments:[
    {part:'fundamentals', minutes:10, category:'improvisation',
     text:'Drone Improvisation 2 — hand positions and call-and-response. Take a phrase, then answer it with a different one. Two minutes minimum.'},
    {part:'rote', minutes:10, category:'written',
     text:'Fill out the Written Practice worksheet for Unit 2 (modes and scale writing).'},
    {part:'rote', minutes:20, category:'coordination',
     text:'Practice Coordination Exercise 2 in all twelve keys — major scales in RH over Charleston and Reverse Charleston comping in LH. Line A uses Charleston, Line B Reverse Charleston, Lines C-D mix both.'},
    {part:'tunes', minutes:20, category:'comping',
     text:'Take three jazz standards and comp through each one four ways: (1) melody only, (2) melody + Charleston comping, (3) melody + Reverse Charleston, (4) alternating.'},
    {part:'tunes', minutes:15, category:'melody',
     text:'Personalize the melody of one standard — apply syncopation, repeated notes, and grace-note slides to at least eight bars.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: "Joy Spring" by Clifford Brown and Max Roach — 20 times. Focus on Richie Powell\'s left hand and the group\'s trading-fours section.'}
  ]},

  {id:'B1-U3', book:1, unit:3, name:'Introducing ii-V-I',
   stageId:2, stageLabel:'Stage 2',
   assignments:[
    {part:'fundamentals', minutes:10, category:'improvisation',
     text:'Drone Improvisation in F and B♭ — use grace notes and sequences over a held bass note. Aim for musical phrases, not scales.'},
    {part:'rote', minutes:20, category:'voicing',
     text:'ii-V-I Practice: write out voicings in the specified keys, practice the descending-by-whole-steps pattern, and find ii-V-Is in two Real Book tunes.'},
    {part:'rote', minutes:15, category:'coordination',
     text:'Coordination Exercise 3 in all twelve keys — swung eighth notes in RH with ii-V-I progression in LH using the Charleston rhythm. Play the major scale of the I chord for the entire progression.'},
    {part:'tunes', minutes:20, category:'tune-app',
     text:'ii-V-I Lick 1: practice with correct articulation, then with LH comping, then transpose to all twelve keys, then apply inside a Real Book tune.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: "I Want More" by Dexter Gordon — 20+ times.'}
  ]},

  {id:'B1-U4', book:1, unit:4, name:'Going Deeper with ii-V-I',
   stageId:2, stageLabel:'Stage 2',
   assignments:[
    {part:'fundamentals', minutes:10, category:'improvisation',
     text:'Building Rhythmic Vocabulary 1 — practice rhythmic phrases starting on different beats of the bar. Avoid always landing on beat one.'},
    {part:'rote', minutes:15, category:'written',
     text:'Written Practice: write out the dorian, mixolydian and ionian modes in the specified keys.'},
    {part:'rote', minutes:15, category:'coordination',
     text:'Coordination Exercise 4 in all twelve keys — modes (dorian, mixolydian, ionian) over Reverse Charleston comping. May mix Reverse Charleston and Charleston as comfortable.'},
    {part:'rote', minutes:15, category:'tune-app',
     text:'ii-V-I Lick 2 in all twelve keys — articulation first, then with left-hand comping.'},
    {part:'tunes', minutes:20, category:'tune-app',
     text:'Choose two new Real Book tunes. Circle every ii-V-I. Practice comping through them with the Charleston rhythm.'},
    {part:'tunes', minutes:10, category:'voicing',
     text:'ii-V-I exercises: practice the voicing formulas through all the specified key areas.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: "So What" by Miles Davis — 20+ times. Note the modal harmony and the time Miles leaves between phrases.'}
  ]},

  {id:'B1-U5', book:1, unit:5, name:'Evening in Lyon',
   stageId:3, stageLabel:'Stage 3',
   assignments:[
    {part:'fundamentals', minutes:10, category:'improvisation',
     text:'ii-V-I Improvisation in C, B♭, A♭ and B major — stay in one key for two minutes before moving.'},
    {part:'rote', minutes:15, category:'tune-app',
     text:'ii-V-I Lick 3 in all twelve keys.'},
    {part:'tunes', minutes:40, category:'tune-app',
     text:'Evening in Lyon — Head: learn the melody with roots, find the chords, add coordination. Personalise the melody with ghost notes, turns and double notes.'},
    {part:'tunes', minutes:20, category:'tune-app',
     text:'Evening in Lyon — Improvisation: scale exercises over the changes, with focus prompts. Work toward a dream solo.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: "An Afternoon in Paris" — 20+ times.'}
  ]},

  {id:'B1-U6', book:1, unit:6, name:'Type A/B Voicings',
   stageId:3, stageLabel:'Stage 3',
   assignments:[
    {part:'fundamentals', minutes:10, category:'improvisation',
     text:'Building Rhythmic Vocabulary 2 — mix quarter notes and eighth notes in phrases over a drone. Avoid running the scale.'},
    {part:'rote', minutes:15, category:'voicing',
     text:'3-5-7-9 arpeggios exercise — through all twelve keys, both ascending and descending.'},
    {part:'rote', minutes:20, category:'voicing',
     text:'Two-handed Type A/B voicings: written practice, ii-V-I exercise, then comping on Real Book tunes. Keep the lowest note between C below middle C and middle C.'},
    {part:'rote', minutes:15, category:'voicing',
     text:'Practice one-handed Type A/B voicings — three notes in one hand, both types, in all twelve keys.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: "Satin Doll" — 20+ times. Follow the melody and listen to how the pianist voices each chord.'}
  ]},

  {id:'B1-U7', book:1, unit:7, name:'The Blues Form',
   stageId:4, stageLabel:'Stage 4',
   assignments:[
    {part:'fundamentals', minutes:15, category:'tune-app',
     text:'Blues form memorization in C, F, G and B♭ — play the form with one finger first, then with both hands. Say the chord name before you play each one.'},
    {part:'rote', minutes:20, category:'voicing',
     text:'Write out and practice two-handed A/B voicings for the blues progression in the specified keys.'},
    {part:'tunes', minutes:30, category:'tune-app',
     text:'Learn "Blue Train" and "Blue Monk" — melody, then comping, then one chorus of improvisation on each.'},
    {part:'tunes', minutes:20, category:'comping',
     text:'Practice comping variations: lead-ins (on "and of 3" or beat 4), push-offs (two consecutive eighth notes), and long-short articulation.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: the unit\'s recommended recording — 20+ times.'}
  ]},

  {id:'B1-U8', book:1, unit:8, name:'Playing Bass in Two',
   stageId:4, stageLabel:'Stage 4',
   assignments:[
    {part:'fundamentals', minutes:10, category:'coordination',
     text:'Play One, Rest One / Play Two, Rest Two exercises over ii-V-Is in E♭, A♭ and D — bass in two with voice leading. Silence is half the exercise.'},
    {part:'rote', minutes:15, category:'tune-app',
     text:'ii-V-I Lick 6 in all twelve keys — articulation before speed.'},
    {part:'tunes', minutes:20, category:'tune-app',
     text:'Bassline in two for three or more Real Book tunes — root on one, fifth or third on three. Melody sung over the top.'},
    {part:'rote', minutes:20, category:'voicing',
     text:'One-handed Type A/B voicings: written practice, ii-V-I exercise, then comping on a blues. The move between A and B should feel like a shift, not a jump.'},
    {part:'tunes', minutes:15, category:'improvisation',
     text:'Improvising over the blues: AAB phrasing with blues scale, arpeggios, and mixing both. Play one phrase, leave two bars of silence.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: "D. and E." by Oscar Peterson — 20+ times. Follow the left hand.'}
  ]},

  {id:'B1-U9', book:1, unit:9, name:'Blues for Sammie',
   stageId:5, stageLabel:'Stage 5',
   assignments:[
    {part:'fundamentals', minutes:10, category:'improvisation',
     text:'Play One/Rest One and Play Two/Rest Two variations in G, A and B♭ — mix the two approaches within a single chorus.'},
    {part:'rote', minutes:15, category:'tune-app',
     text:'ii-V-I Lick 7 in all twelve keys.'},
    {part:'rote', minutes:20, category:'coordination',
     text:'Coordination Exercise 5 in all twelve keys — scales with one-handed Type A and Type B voicings. Practice adding lead-ins to the comping patterns.'},
    {part:'tunes', minutes:40, category:'tune-app',
     text:'Learn "Blues for Sammie" in seven ways: (1) melody + roots, (2) personalise melody, (3) melody + bass in two, (4) two-handed voicings, (5) one-handed voicings, (6) one-handed + bassline, (7) one-handed + melody on top.'},
    {part:'tunes', minutes:15, category:'improvisation',
     text:'Improvise over blues in F — AAB phrasing, arpeggios, and mixing. Record yourself and listen back before the session ends.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: "Brownie Speaks" by Clifford Brown — 20+ times.'}
  ]},

  {id:'B1-U10', book:1, unit:10, name:'Altered Dominants',
   stageId:5, stageLabel:'Stage 5',
   assignments:[
    {part:'fundamentals', minutes:10, category:'improvisation',
     text:'Play What You Sing — over a drone, then over a ii-V-I. Sing a phrase before you play it, then play exactly what you sang.'},
    {part:'rote', minutes:15, category:'tune-app',
     text:'ii-V-I Lick 8 in all twelve keys — includes altered dominant vocabulary.'},
    {part:'rote', minutes:15, category:'coordination',
     text:'Coordination Exercise 6 — melody over a constant bassline in all twelve keys. Practice a variety of melodies over the constant bassline pattern.'},
    {part:'rote', minutes:15, category:'voicing',
     text:'Altered Dominants Practice: written worksheet, choose two Real Book tunes with altered dominants, ii-V-I exercise with ♭9, ♭13 and tritone sub.'},
    {part:'tunes', minutes:30, category:'bossa',
     text:'Learn "Girl from Ipanema" and "Desafinado" with three bossa nova styles: (1) two-handed voicings, (2) RH comping with LH bassline, (3) partido alto pattern. Eighth notes are straight, not swung.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: "Corcovado" — 20+ times. Note the bossa nova feel and how it differs from swing.'}
  ]},

  {id:'B1-U11', book:1, unit:11, name:'More Altered Dominants',
   stageId:6, stageLabel:'Stage 6',
   assignments:[
    {part:'rote', minutes:15, category:'scale-pattern',
     text:'Neighbor tones and chromatic enclosure practice — lower neighbors, then chromatic enclosures targeting chord tones. All twelve keys.'},
    {part:'rote', minutes:15, category:'tune-app',
     text:'ii-V-I Lick 9 in all twelve keys — altered dominant vocabulary with chromatic approach notes.'},
    {part:'rote', minutes:20, category:'voicing',
     text:'ii-V-I exercises for Altered Dominants 2: tritone substitution and resolving altered tones. Practice in all twelve keys.'},
    {part:'tunes', minutes:20, category:'comping',
     text:'Comping in the second half of the measure, leaving out comps, and sidestepping — applied to Real Book tunes. Practice each technique separately before combining.'},
    {part:'tunes', minutes:20, category:'tune-app',
     text:'"Alice in Wonderland" and "A Child is Born" — comping in 3/4. Apply the Charleston pattern adapted for waltz time.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: "Remember" by Hank Mobley — 20+ times.'}
  ]},

  {id:'B1-U12', book:1, unit:12, name:'Capstone',
   stageId:6, stageLabel:'Stage 6',
   assignments:[
    {part:'rote', minutes:20, category:'scale-pattern',
     text:'Altered scale improvisation — practice the altered scale as melodic minor a semitone up from the root. Apply to V chords in ii-V-I progressions.'},
    {part:'tunes', minutes:30, category:'tune-app',
     text:'Review and consolidate all Book 1 material — go back to any stage where the twelve-key grid is not complete and fill it in.'},
    {part:'tunes', minutes:30, category:'tune-app',
     text:'Capstone performance: combine all techniques (melody personalisation, comping variations, altered dominants, bass in two) on selected tunes. Record yourself.'},
    {part:'fundamentals', minutes:20, category:'self-transcription',
     text:'Self-assessment and planning for Book 2 — listen to your recording, identify your strongest moments and the three areas that need the most work.'}
  ]},

  /* ── BOOK 2 ──────────────────────────────────────────────── */

  {id:'B2-U1', book:2, unit:1, name:'Including Transcriptions',
   stageId:'7A', stageLabel:'Stage 7A',
   assignments:[
    {part:'rote', minutes:15, category:'scale-pattern',
     text:'Scale patterns in thirds, fourths, fifths, sixths and sevenths — start at about 120 BPM and increase gradually. About 15 minutes per day.'},
    {part:'fundamentals', minutes:15, category:'improvisation',
     text:'Improvise over ii-V-I with stepwise connections to thirds — keep the lines melodic and target the guidetones. About 15 minutes per day.'},
    {part:'rote', minutes:15, category:'coordination',
     text:'B2 Coordination Exercise 1: scale patterns in thirds over the Red Garland rhythm (LH), OR four-note one-handed voicings. About 15 minutes per day.'},
    {part:'tunes', minutes:30, category:'comping',
     text:'Comp on Real Book tunes with the Red Garland rhythm or locked-hands style. Work through at least two tunes. About 30 minutes per day.'},
    {part:'listening', minutes:30, category:'transcription',
     text:'Transcribe Miles Davis "Bye Bye Blackbird" — play along with the recording a minimum of 30 times. Focus on phrasing, space and time feel.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: "Bye Bye Blackbird" — 20+ times, following the form.'}
  ]},

  {id:'B2-U2', book:2, unit:2, name:'The COREA Process',
   stageId:'7A', stageLabel:'Stage 7A',
   assignments:[
    {part:'rote', minutes:15, category:'scale-pattern',
     text:'Three-note and four-note scale patterns (triadic and seventh-chord) — practice with triplets and with eighth notes. About 15 minutes per day.'},
    {part:'fundamentals', minutes:15, category:'improvisation',
     text:'Improvise using pickups (Type A, B and C pickups) over ii-V-I progressions. About 15 minutes per day.'},
    {part:'rote', minutes:15, category:'coordination',
     text:'B2 Coordination Exercise 2: three-note scale patterns in RH while adding sidestep push-offs with LH. About 15 minutes per day.'},
    {part:'tunes', minutes:30, category:'comping',
     text:'Comp with Red Garland rhythm plus push-offs on Real Book tunes. Practice single, double and triple push-off variations. About 30 minutes per day.'},
    {part:'listening', minutes:30, category:'transcription',
     text:'COREA process with Miles Davis rhythmic concepts — Copy, Observe, Repeat, Extract, Apply. Full COREA cycle, 20+ listens, 30+ play-alongs.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: Keith Jarrett playing "Bye Bye Blackbird" — 20+ times. Compare phrasing against Miles\'s version.'}
  ]},

  {id:'B2-U3', book:2, unit:3, name:'Minor ii-V-i',
   stageId:'7B', stageLabel:'Stage 7B',
   assignments:[
    {part:'rote', minutes:10, category:'scale-pattern',
     text:'Scale Game 1 — continuous eighth notes without simply running scales up and down. Melodic decisions in real time. About 10 minutes per day.'},
    {part:'fundamentals', minutes:15, category:'improvisation',
     text:'Improvise using guidetone lines (lines starting on the third and on the seventh). About 15 minutes per day.'},
    {part:'rote', minutes:30, category:'voicing',
     text:'Minor ii-V-i voicings in all keys using LN (Low Note), HN (High Note) and R (Root) formulas. Written worksheet first. About 30 minutes per day.'},
    {part:'rote', minutes:20, category:'coordination',
     text:'B2 Coordination Exercise 3: Scale Game 1 in RH while comping with the Count Basie Rhythm (LH). Beat 3 in the first measure, Charleston in the second.'},
    {part:'tunes', minutes:30, category:'comping',
     text:'Comp with two-measure patterns (Beat Three Charleston, Count Basie Rhythm) on Real Book tunes. About 30 minutes per day.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: Bill Evans "Beautiful Love" — 20+ times. Follow the minor harmony throughout.'}
  ]},

  {id:'B2-U4', book:2, unit:4, name:'Improvising Over Minor ii-V-i',
   stageId:'7B', stageLabel:'Stage 7B',
   assignments:[
    {part:'rote', minutes:15, category:'scale-pattern',
     text:'Scale Game 2 — switch scales every 2 measures, ascending by half steps. Start slowly. About 10–20 minutes per day.'},
    {part:'fundamentals', minutes:15, category:'improvisation',
     text:'Guidetone lines with chromatic lead-ins — approach the third and seventh by half step from below, above, and with chromatic enclosures. About 15 minutes per day.'},
    {part:'rote', minutes:20, category:'voicing',
     text:'Voicing exercises for leading into minor key centers — practice the transition from major ii-V-I to minor ii-V-i in the same exercise. About 20 minutes per day.'},
    {part:'rote', minutes:20, category:'coordination',
     text:'B2 Coordination Exercise 4: combined Reverse Charleston + Beat Three Charleston comping with four-note voicings in LH while switching between harmonic minor and melodic minor scales in RH. Six voicing combinations.'},
    {part:'tunes', minutes:30, category:'comping',
     text:'Comp on Real Book tunes with ii-V progressions resolving to minor keys. About 30 minutes per day.'},
    {part:'listening', minutes:30, category:'transcription',
     text:'COREA process with Hank Mobley "If I Should Lose You" — focus on harmonic concepts and chord navigation. 20+ listens, 30+ play-alongs.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: John Coltrane "Say It" — 20+ times.'}
  ]},

  {id:'B2-U5', book:2, unit:5, name:'Going Deeper with Minor ii-V-i',
   stageId:'7B', stageLabel:'Stage 7B',
   assignments:[
    {part:'rote', minutes:15, category:'scale-pattern',
     text:'Chromatic lead-in patterns — approaching guidetone lines from below by half step, above by half step, and chromatic enclosures. All twelve keys, about 15 minutes per day.'},
    {part:'fundamentals', minutes:15, category:'improvisation',
     text:'Improvise over minor ii-V-i progressions with chromatic enclosures around chord tones. Keep lines swinging.'},
    {part:'rote', minutes:20, category:'voicing',
     text:'B2 Coordination Exercise 5: Charleston starting on beat 3 in LH while playing locrian natural two mode and altered scale in RH. Advanced scale-rhythm combination.'},
    {part:'tunes', minutes:30, category:'comping',
     text:'Comp on Real Book tunes with extended minor sections. Focus on two-measure rhythmic patterns.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: listen to the recommended recordings for this unit — 20+ times.'}
  ]},

  {id:'B2-U6', book:2, unit:6, name:'Playing a Tune with Minor ii-V-i',
   stageId:'7B', stageLabel:'Stage 7B',
   assignments:[
    {part:'rote', minutes:20, category:'scale-pattern',
     text:'Octatonic scale patterns — two-note, three-note, and four-note patterns from the diminished scale. About 20 minutes per day.'},
    {part:'fundamentals', minutes:15, category:'improvisation',
     text:'Chromatic Descent and James Bond guidetone lines — practice both shapes over ii-V-i progressions. About 15 minutes per day.'},
    {part:'tunes', minutes:40, category:'tune-app',
     text:'"Hardly, in the Moonlight" — work through the complete 11-step tune mastery process. Step 1: melody by ear. Step 2: memorise. Step 3: personalise. Step 4: chord progression. Step 5: voicings. Step 6: melody + voicings. Step 7: comping patterns. Step 8: improvise. Step 9: coordination. Step 10: introduction + ending. Step 11: dream solo.'},
    {part:'tunes', minutes:15, category:'comping',
     text:'Free comping practice on any tune — respond to the music without fixed patterns. Vary rhythm, density and register spontaneously.'},
    {part:'tunes', minutes:20, category:'memorization',
     text:'Memorise "Hardly" and one other piece using all four memory types: intellectual (Roman numerals), muscle (repetition), aural (sing the bass line), emotional (connect to lyrics and mood).'},
    {part:'tunes', minutes:15, category:'memorization',
     text:'Transpose "Hardly" to six different keys using Roman numeral analysis. Target at least six keys before moving on.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: Sonny Rollins "Softly As In A Morning Sunrise" — 20+ times.'}
  ]},

  {id:'B2-U7', book:2, unit:7, name:'Revisiting the Blues Form',
   stageId:'7C', stageLabel:'Stage 7C',
   assignments:[
    {part:'rote', minutes:15, category:'scale-pattern',
     text:'Non-chord-tone scale patterns 1 — lower neighbors and chromatic enclosures targeting scale notes. All twelve keys, about 15 minutes per day.'},
    {part:'tunes', minutes:15, category:'tune-app',
     text:'Blues form variations practice — play the blues with the quick four, without it, and with the turnaround. In all twelve keys over the fortnight.'},
    {part:'tunes', minutes:20, category:'intro-ending',
     text:'Introductions (three styles): Last Four Measures, Vamp Introduction, and Rubato Introduction. Also endings (three stock fills): scalar run, arpeggiated fill, and Count Basie ending. All twelve keys.'},
    {part:'tunes', minutes:20, category:'comping',
     text:'Shout-chorus voicings and Freddie Green comping style (quarter notes on every beat) — applied to blues tunes.'},
    {part:'listening', minutes:30, category:'transcription',
     text:'COREA process with Illinois Jacquet "Las Vegas Blues" — focus on gestures and melodic shapes. 20+ listens, 30+ play-alongs.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: Thelonious Monk — 20+ times. Notice the space and the unexpected rhythmic placements.'}
  ]},

  {id:'B2-U8', book:2, unit:8, name:'Introducing Closed-Position Voicings',
   stageId:'7C', stageLabel:'Stage 7C',
   assignments:[
    {part:'rote', minutes:15, category:'scale-pattern',
     text:'Non-chord-tone patterns 2 — double neighbors, the "Joy Spring" pattern, and the "Yodel Lick." Named after iconic jazz solos where these devices appear.'},
    {part:'rote', minutes:20, category:'voicing',
     text:'Closed-position voicings for major and dominant chords — notes tightly packed in root position and inversions. Compare against the spread voicings from previous stages.'},
    {part:'tunes', minutes:20, category:'tune-app',
     text:'Rhythm changes A section practice — comp through the A section with closed-position voicings, then improvise over it with the scale patterns.'},
    {part:'tunes', minutes:25, category:'comping',
     text:'Comp on rhythm changes tunes using closed-position voicings and locked-hands technique.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: the recommended recordings for this unit — 20+ times. Follow the rhythm changes form.'}
  ]},

  {id:'B2-U9', book:2, unit:9, name:'Rhythm Changes and Endings',
   stageId:'7C', stageLabel:'Stage 7C',
   assignments:[
    {part:'rote', minutes:20, category:'scale-pattern',
     text:'Arpeggio patterns for rhythm changes — 3-5-7-9 arpeggios for I-vi-ii-V progressions with half-step connections between chord tones.'},
    {part:'tunes', minutes:25, category:'tune-app',
     text:'Rhythm changes A section variations — play the A section with at least three different harmonic approaches: plain, with substitutions, and with tritone subs.'},
    {part:'tunes', minutes:20, category:'intro-ending',
     text:'Three-time tag endings with three stock ending fills — practice each combination in all twelve keys. The Count Basie ending is the one to know first.'},
    {part:'tunes', minutes:10, category:'intro-ending',
     text:'Practice endings in all twelve keys — scalar run, arpeggiated fill, Count Basie. One key per day over twelve days.'},
    {part:'listening', minutes:30, category:'transcription',
     text:'Transcribe Horace Silver "Oleo" — 30+ play-alongs. Focus on bebop vocabulary over rhythm changes and the open bridge.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: Miles Davis "Oleo" — 20+ times. Compare Davis\'s approach against Silver\'s.'}
  ]},

  {id:'B2-U10', book:2, unit:10, name:'Drop-Two Voicings and Bass in Four',
   stageId:'7D', stageLabel:'Stage 7D',
   assignments:[
    {part:'rote', minutes:15, category:'scale-pattern',
     text:'Bebop scale patterns — major and melodic minor bebop scales in multiple melodic shapes. The chromatic passing tone lands chord tones on downbeats.'},
    {part:'rote', minutes:20, category:'voicing',
     text:'Drop-two voicings practice in all keys — take a closed-position voicing and drop the second voice from the top by an octave. Written practice first.'},
    {part:'rote', minutes:20, category:'coordination',
     text:'B2 Coordination Exercise 6: walking basslines for ii-V-I and ii-V progressions. Exercises A-D cover chords changing twice per measure and once per measure, with walk-up and walk-down patterns.'},
    {part:'tunes', minutes:30, category:'tune-app',
     text:'Ballad basics — slow-tempo comping and melody playing. Use the widest dynamic range you can. One ballad, from head to out, complete.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: Miles Davis Second Great Quintet — 20+ times. Listen to Herbie Hancock\'s voicing choices and rhythmic placement.'}
  ]},

  {id:'B2-U11', book:2, unit:11, name:'Adding Color to Ballads',
   stageId:'7D', stageLabel:'Stage 7D',
   assignments:[
    {part:'rote', minutes:15, category:'scale-pattern',
     text:'Hemiola patterns — mixing quarter note plus eighth note groupings (1.5-beat patterns) against 4/4 time. Includes descending seventh chords with double-note turns.'},
    {part:'fundamentals', minutes:15, category:'improvisation',
     text:'Changing rhythmic units improvisation — start with all eighth notes, then switch to all triplets, then to all quarters. One chorus per rhythmic unit.'},
    {part:'rote', minutes:15, category:'voicing',
     text:'Shell voicings (major and minor ii-V-I patterns) — just the third and seventh, nothing else. Play them against recordings and notice how much harmony two notes carry.'},
    {part:'tunes', minutes:20, category:'comping',
     text:'Left-hand shuttle technique — jump between low bass notes and mid-range voicings to create the illusion of two instruments at once.'},
    {part:'tunes', minutes:25, category:'melody',
     text:'Ballad techniques: back-phrasing, bell tones (octaves in the upper register), interlocking fifths and sixths between melody phrases, and upper structures. Apply all four to one ballad.'},
    {part:'listening', minutes:30, category:'transcription',
     text:'Transcribe Bud Powell "Ornithology" — play along 30+ times. Focus on bebop-level technical fluency and rhythmic drive.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: Bud Powell "Hallucinations" — 20+ times.'}
  ]},

  {id:'B2-U12', book:2, unit:12, name:'Learning a Tune by Ear',
   stageId:'7D', stageLabel:'Stage 7D',
   assignments:[
    {part:'rote', minutes:20, category:'scale-pattern',
     text:'Non-chord-tone technical challenges — the capstone of Book 2\'s pattern work. Push your pattern vocabulary to its physical and musical limits.'},
    {part:'tunes', minutes:40, category:'tune-app',
     text:'Learn "Unit 7" (or another assigned tune) completely by ear — determine the form, the melody, the key, the harmony and the voicings without a lead sheet.'},
    {part:'tunes', minutes:30, category:'self-transcription',
     text:'Self-transcription analysis: record yourself performing a tune, transcribe your own performance, and answer the 17-question diagnostic questionnaire. Identify your strongest moments and top three areas for improvement.'},
    {part:'fundamentals', minutes:20, category:'tune-app',
     text:'Four-part practice session planning: map out a full two-hour session split between rote exercises, improvisation, tunes and listening. Carry this structure into Book 3.'}
  ]},

  /* ── BOOK 3 ──────────────────────────────────────────────── */

  {id:'B3-U1', book:3, unit:1, name:'Modal Jazz Basics',
   stageId:8, stageLabel:'Stage 8',
   assignments:[
    {part:'fundamentals', minutes:15, category:'improvisation',
     text:'Drone improvisations over static bass notes — two full minutes over one drone without stopping. Then move the bass note while keeping the same scale.'},
    {part:'rote', minutes:20, category:'scale-pattern',
     text:'Modal Pattern 1 — each major scale starting on different scale degrees to produce all seven modes. Emphasise correct fingering for each mode.'},
    {part:'rote', minutes:15, category:'voicing',
     text:'Finding modes in all keys with flashcards — one mode per day, in all twelve keys.'},
    {part:'tunes', minutes:30, category:'voicing',
     text:'Modal voicings up and down beneath major scales (with metronome) — no doubling, no third-stacking. Keep the lowest voicing note above G below middle C.'},
    {part:'listening', minutes:30, category:'transcription',
     text:'Transcribe Miles Davis "So What" from Kind of Blue — play along 30+ times. Study Miles\'s use of space within the modal framework.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: Albert Dailey "A-1" — 20+ times.'}
  ]},

  {id:'B3-U2', book:3, unit:2, name:'Improvising Within a Single Mode',
   stageId:8, stageLabel:'Stage 8',
   assignments:[
    {part:'fundamentals', minutes:15, category:'improvisation',
     text:'Play gestures from Miles Davis\'s "So What" solo without using the original notes — borrow the contour and the rhythm, but change every pitch.'},
    {part:'rote', minutes:20, category:'scale-pattern',
     text:'Modal Pattern 2 — second-plus-fourth intervallic shapes ascending and descending beneath each mode. These shapes form the basis of modal voicing construction.'},
    {part:'rote', minutes:20, category:'voicing',
     text:'Two-handed modal voicings beneath all twelve major scales — practice the four voicing-movement tools: (1) same pitch classes redistributed, (2) stepwise top or bottom movement, (3) complementary voicings, (4) parallel transposition.'},
    {part:'tunes', minutes:20, category:'comping',
     text:'Comping within a mode — harmonise a melody beneath each mode, then improvise within the single mode for one full minute of continuous eighth notes.'},
    {part:'tunes', minutes:15, category:'improvisation',
     text:'Improvising within a single mode: sing-play approach, continuous eighth notes for one minute, AAB phrasing, and hemiola groupings.'},
    {part:'tunes', minutes:20, category:'tune-app',
     text:'Play "So What" and "Impressions" — comping and improvising. Apply the modal voicings from this unit.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: Wes Montgomery and Jimmy Smith "Milestones" — 20+ times. Focus on modal comping interaction.'}
  ]},

  {id:'B3-U3', book:3, unit:3, name:'Modal Cross-Sections',
   stageId:8, stageLabel:'Stage 8',
   assignments:[
    {part:'fundamentals', minutes:15, category:'improvisation',
     text:'Memory Games — repeat a thematic idea at the beginning of every 8-bar, 16-bar or 32-bar section. Creates architecture in the improvisation.'},
    {part:'rote', minutes:20, category:'scale-pattern',
     text:'Modal Pattern 3 — third-plus-fourth shapes (inverted triads) beneath major scales. These inversions produce the So What voicing shapes.'},
    {part:'tunes', minutes:25, category:'voicing',
     text:'So What Voicings beneath major scales — harmonise melodies using the So What shapes. Transpose the shapes without changing the hand position first, then add the key change.'},
    {part:'tunes', minutes:25, category:'tune-app',
     text:'"Witch Hunt" practice with So What voicings and modal voicings — head, then comping, then improvisation. Use the modal patterns from this unit.'},
    {part:'listening', minutes:30, category:'transcription',
     text:'Transcribe Wayne Shorter "Witch Hunt" — play along 30+ times. Study the contrasting modal improvisation approaches.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: Herbie Hancock planing on "Witch Hunt" — 20+ times. Identify each instance of parallel voicing motion.'}
  ]},

  {id:'B3-U4', book:3, unit:4, name:'Pentatonic Scale Theory',
   stageId:8, stageLabel:'Stage 8',
   assignments:[
    {part:'fundamentals', minutes:15, category:'improvisation',
     text:'Shifting upper structures every 2 beats, connecting them by step. Keep the line flowing across the structural changes.'},
    {part:'rote', minutes:20, category:'scale-pattern',
     text:'Modal Pattern 4 — special triad inversions with variations in all keys. Alternating between the two inversions produces quartal and cluster voicing shapes.'},
    {part:'rote', minutes:20, category:'voicing',
     text:'Quartal and cluster voicings beneath major scales — no third-stacking anywhere. Practice the two voicing types side by side to hear the difference.'},
    {part:'tunes', minutes:20, category:'voicing',
     text:'Two new modal voicing exercises: (1) a new voicing shape on every beat, no repeats or doubling, (2) move the voicing by the smallest possible interval each time.'},
    {part:'tunes', minutes:20, category:'improvisation',
     text:'Improvise alternating between two pentatonic scales — switch every four bars. Keep the line connected across the switch.'},
    {part:'tunes', minutes:20, category:'tune-app',
     text:'Practice "Passion Dance" and "Freedom Jazz Dance" — comping and improvising with quartal voicings and pentatonic patterns.'},
    {part:'listening', minutes:30, category:'transcription',
     text:'Transcribe McCoy Tyner — play along 30+ times. Focus on quartal voicings and rhythmic intensity.'}
  ]},

  {id:'B3-U5', book:3, unit:5, name:'Pentatonic Voicings',
   stageId:9, stageLabel:'Stage 9',
   assignments:[
    {part:'fundamentals', minutes:15, category:'improvisation',
     text:'Changing mindset every 8 measures — alternate between upper structures, quadratonics, pentatonics, and triad pairs within a single improvisation.'},
    {part:'rote', minutes:20, category:'scale-pattern',
     text:'Modal Pattern 5 — intervallic patterns using the pentatonic scale in all twelve keys. Extends the intervallic approach of Book 2 into the pentatonic framework.'},
    {part:'rote', minutes:20, category:'voicing',
     text:'Scales using pentatonic voicings — drape pentatonic voicing shapes beneath each mode. Practice the melodic minor, dominant and flat sixth pentatonic voicing types.'},
    {part:'tunes', minutes:20, category:'improvisation',
     text:'Improvise with tonal devices within modal contexts: neighbor tones, passing tones, chromatic enclosures, blue notes and tonicization. One device per chorus.'},
    {part:'tunes', minutes:20, category:'tune-app',
     text:'Comp with pentatonic voicings on "Contemplation" and "Afro Blue" — head, then comping, then improvisation.'},
    {part:'listening', minutes:30, category:'transcription',
     text:'Transcribe Kenny Kirkland "Doctone" — play along 30+ times.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: Kenny Kirkland — 20+ times.'}
  ]},

  {id:'B3-U6', book:3, unit:6, name:'Modes of the Melodic Minor',
   stageId:10, stageLabel:'Stage 10',
   assignments:[
    {part:'fundamentals', minutes:10, category:'improvisation',
     text:'Tonicization every four measures — add a dominant chord a fifth above (or half step above / tritone away) to each target chord. Play it in time.'},
    {part:'rote', minutes:20, category:'scale-pattern',
     text:'Modal Pattern 6 — pentatonic scales in the circle of fifths with chromatic enclosures. All twelve keys, moving through the cycle.'},
    {part:'rote', minutes:20, category:'voicing',
     text:'Moving voicings through chord changes using all four tools: same pitch classes, stepwise top/bottom movement, complementary voicings, and parallel transposition.'},
    {part:'tunes', minutes:15, category:'scale-pattern',
     text:'Memorise the modes of the melodic minor with flashcards — Dorian ♭2, Lydian augmented, Lydian dominant, Mixolydian ♭6, Locrian natural 2, Altered (Super-Locrian).'},
    {part:'tunes', minutes:25, category:'voicing',
     text:'Drape modal voicing shapes beneath melodic minor scales — So What voicings, quartal voicings, and sus voicings all applied to each mode.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: Joe Henderson "Inner Urge" — 20+ times.'}
  ]},

  {id:'B3-U7', book:3, unit:7, name:'Comping Outside of the Mode',
   stageId:10, stageLabel:'Stage 10',
   assignments:[
    {part:'fundamentals', minutes:15, category:'improvisation',
     text:'Alternating between major and melodic minor modes — switch every two bars at first, then every four, then freely. Keep the line connected.'},
    {part:'rote', minutes:20, category:'scale-pattern',
     text:'Modal Pattern 7 — descending seventh chord patterns within the melodic minor scale with flipped notes. The note-flipping technique creates unexpected melodic contours.'},
    {part:'tunes', minutes:25, category:'comping',
     text:'Tonicization, sidestepping, and planing with modal voicings — apply each technique separately to a modal tune, then combine freely.'},
    {part:'tunes', minutes:15, category:'voicing',
     text:'Transposing modal voicings: by half steps, whole steps, minor thirds, and major thirds. Each interval of transposition has a different harmonic effect.'},
    {part:'tunes', minutes:15, category:'voicing',
     text:'Create voicings using melodic minor, dominant, and flat sixth pentatonic scales — build from the pentatonic intervals upward.'},
    {part:'tunes', minutes:20, category:'tune-app',
     text:'Improvise on "Windows" with the three new pentatonic scales — melodic minor, dominant, flat sixth. One scale per chorus, then mix freely.'},
    {part:'listening', minutes:30, category:'transcription',
     text:'Transcribe Chick Corea "Windows" — play along 30+ times.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: Chick Corea "Windows" — 20+ times.'}
  ]},

  {id:'B3-U8', book:3, unit:8, name:'Modal Interchange',
   stageId:10, stageLabel:'Stage 10',
   assignments:[
    {part:'fundamentals', minutes:10, category:'improvisation',
     text:'Sidestepping to create tension and release over ascending chord sequences — step outside by a half step, hold for two bars, then resolve in.'},
    {part:'rote', minutes:20, category:'scale-pattern',
     text:'Modal Pattern 8 — three-note pentatonic patterns using melodic minor, dominant, and flat sixth pentatonic scales. Note-flipping within cells creates additional melodic variations.'},
    {part:'tunes', minutes:20, category:'voicing',
     text:'Modal interchange exercises — change modes over tonal progressions. Use Dorian on minor chords, Lydian on major chords, and Mixolydian on dominant chords.'},
    {part:'tunes', minutes:20, category:'tune-app',
     text:'Improvise and comp on "So What" and "Windows" with modal interchange — apply the technique freely, then critically review which applications worked.'},
    {part:'tunes', minutes:15, category:'comping',
     text:'Planing melodic cells by half steps, whole steps, minor thirds and major thirds — apply to improvised lines over a static harmony.'},
    {part:'tunes', minutes:15, category:'improvisation',
     text:'Two chords with the same sonority — create seamless melodies that connect them. The seam should be inaudible.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: Mulgrew Miller "One\'s Own Room" — 20+ times.'}
  ]},

  {id:'B3-U9', book:3, unit:9, name:'Modal Voicings for Tonal Progressions',
   stageId:9, stageLabel:'Stage 9',
   assignments:[
    {part:'fundamentals', minutes:15, category:'improvisation',
     text:'Modal interchange circuits — cycle through major, minor, and dominant modal options for a single chord type. Play each option back to back so the ear hears the difference.'},
    {part:'rote', minutes:20, category:'scale-pattern',
     text:'Modal Pattern 9 — Mulgrew Miller-inspired planing with hemiolas. Use multiple rhythmic subdivisions to create metric tension against the underlying pulse.'},
    {part:'tunes', minutes:30, category:'tune-app',
     text:'"Tune Up," "Lady Bird" and "Recorda-Me" with modal voicings — play each tune twice: once with the original voicings, once with the modal approach.'},
    {part:'tunes', minutes:20, category:'voicing',
     text:'Guidetone lines for "Forest Flower" parallel major chords — find the smoothest voice-leading path through the parallel motion.'},
    {part:'tunes', minutes:20, category:'improvisation',
     text:'Improvise over changing modes — nursery rhyme approach, sequences, and the continuous scale game. One approach per chorus.'},
    {part:'listening', minutes:30, category:'transcription',
     text:'Transcribe Herbie Hancock "Autumn Leaves" from Miles in Berlin — play along 30+ times. Focus on harmonic superimposition and motivic development.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: Miles Davis "Autumn Leaves" — 20+ times.'}
  ]},

  {id:'B3-U10', book:3, unit:10, name:'Modal Blues',
   stageId:11, stageLabel:'Stage 11',
   assignments:[
    {part:'fundamentals', minutes:15, category:'improvisation',
     text:'Bebop shapes over a single mode — use the shape (contour and rhythm) of a familiar bebop melody but apply it to modal material.'},
    {part:'rote', minutes:20, category:'scale-pattern',
     text:'Modal Pattern 10 — pentatonic patterns applied over major ii-V-I progressions, incorporating bebop shapes within a modal context.'},
    {part:'tunes', minutes:25, category:'tune-app',
     text:'"Beautiful Love," "Autumn Leaves," and "Yesterdays" with modal voicings — practice each tune with the full modal voicing toolkit: So What, quartal, pentatonic.'},
    {part:'tunes', minutes:20, category:'tune-app',
     text:'Blues progressions with Mixolydian, Dorian, and Phrygian modalities — play the twelve-bar form three times, once per mode. Note which chord changes require modal adjustments.'},
    {part:'tunes', minutes:15, category:'comping',
     text:'Comp over "Autumn Leaves" thinking about long harmony — choose one chord per bar and sustain the modal color through the motion.'},
    {part:'tunes', minutes:15, category:'voicing',
     text:'Memorise Coltrane Changes version of ii-V-I in all twelve keys — the minor-third cycle transposition method.'},
    {part:'listening', minutes:30, category:'transcription',
     text:'Transcribe Keith Jarrett "Billie\'s Bounce" — play along 30+ times.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: Keith Jarrett — 20+ times.'}
  ]},

  {id:'B3-U11', book:3, unit:11, name:'Odd Time Signatures',
   stageId:12, stageLabel:'Stage 12',
   assignments:[
    {part:'fundamentals', minutes:15, category:'improvisation',
     text:'Improvise over Coltrane Changes using arpeggios, guidetones, continuous scales, and bebop shapes — treat the Coltrane Changes as a familiar landscape now.'},
    {part:'rote', minutes:20, category:'scale-pattern',
     text:'Modal Pattern 11 — planing melodic cells from wholetone, octatonic, and augmented scales both symmetrically and chromatically.'},
    {part:'rote', minutes:20, category:'scale-pattern',
     text:'Scales with and against claves for 5/4 and 7/4 time — count the meter out loud first, then add the scale. Five as 3+2, then as 2+3. Seven as 4+3 and 3+4.'},
    {part:'tunes', minutes:25, category:'tune-app',
     text:'Four standard tunes: melody and comping in 5/4 and 7/4. Apply the modal voicings from earlier units in these meters. Add one beat per bar and find where the natural landing places shift.'},
    {part:'tunes', minutes:20, category:'improvisation',
     text:'Improvise with two-handed devices: parallel octaves, drumming on the keyboard, arpeggiating voicings, LH melody, and split melody between hands.'},
    {part:'listening', minutes:30, category:'transcription',
     text:'Transcribe Brad Mehldau "I Didn\'t Know What Time It Was" — play along 30+ times. Focus on odd-meter phrasing and modern harmonic language.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: Brad Mehldau — 20+ times.'}
  ]},

  {id:'B3-U12', book:3, unit:12, name:'Playing Free',
   stageId:12, stageLabel:'Stage 12',
   assignments:[
    {part:'fundamentals', minutes:20, category:'improvisation',
     text:'Layering Rhythms — combine rhythmic subdivision, rhythmic grouping, melody and shape simultaneously. Start with one dimension and add the next when the first is internalized.'},
    {part:'rote', minutes:20, category:'scale-pattern',
     text:'Modal Pattern 12 — augmented scale patterns with hemiolas against 5/4 and 7/4 claves. The capstone of Book 3\'s modal pattern work.'},
    {part:'tunes', minutes:30, category:'improvisation',
     text:'Improvise in free style with various techniques: no chord changes, textural exploration, extended techniques, rhythmic freedom. Record everything and listen back.'},
    {part:'tunes', minutes:20, category:'voicing',
     text:'Create chord voicings that do not imply a particular harmony — open, ambiguous voicings that let the melody define the color. Avoid all root-position triads.'},
    {part:'listening', minutes:20, category:'guided-listening',
     text:'Guided Listening: Paul Motian, Charlie Haden and Geri Allen "Fiasco" — 20+ times. Notice how harmony and rhythm become completely optional frameworks.'}
  ]}
];

/* ---------- stage-to-units map ---------- */
/* Which units belong to which rung. Book 1 sits on stages 1-7 and Book 3 on
   8-12; Book 2 had nowhere to go at all until 7A-7D were added to the ladder,
   so its twelve units were mapped to nothing and never surfaced. */
const UNIT_STAGE_MAP = {
  'P0': [],
  1:    ['B1-U1','B1-U2'],
  2:    ['B1-U3','B1-U4'],
  3:    ['B1-U5','B1-U6'],
  4:    ['B1-U7','B1-U8'],
  5:    ['B1-U9','B1-U10'],
  6:    ['B1-U11','B1-U12'],
  7:    ['B1-U10','B1-U11','B1-U12'],
  '7A': ['B2-U1','B2-U2'],
  '7B': ['B2-U3','B2-U4','B2-U5','B2-U6'],
  '7C': ['B2-U7','B2-U8','B2-U9'],
  '7D': ['B2-U10','B2-U11','B2-U12'],
  8:    ['B3-U1','B3-U2','B3-U3','B3-U4'],
  9:    ['B3-U5','B3-U9'],
  10:   ['B3-U6','B3-U7','B3-U8'],
  11:   ['B3-U10'],
  12:   ['B3-U11','B3-U12'],
  V1:   [], V2:[], V3:[], V4:[]
};

/* ---------- state ---------- */
function jazzUnitsState(){
  const j = jazzState();
  j.unitProgress = j.unitProgress && typeof j.unitProgress === 'object' ? j.unitProgress : {};
  return j.unitProgress;
}
function jazzUnitDone(unitId, idx){
  const up = jazzUnitsState();
  return !!(up[unitId] && up[unitId][idx]);
}
function jazzSetUnitDone(unitId, idx, val){
  const up = jazzUnitsState();
  if(!up[unitId]) up[unitId] = {};
  up[unitId][idx] = !!val;
  saveNow();
}
function jazzUnitProgress(unitId){
  const u = SISKIND_UNITS.find(x => x.id === unitId);
  if(!u) return {done:0, of:0};
  const of = u.assignments.length;
  let done = 0;
  for(let i = 0; i < of; i++) if(jazzUnitDone(unitId, i)) done++;
  return {done, of};
}

/* ---------- lookups ---------- */
function jazzUnit(id){ return SISKIND_UNITS.find(u => u.id === id) || null; }
function jazzUnitsForStage(sid){
  const ids = UNIT_STAGE_MAP[String(sid)] || [];
  return ids.map(id => SISKIND_UNITS.find(u => u.id === id)).filter(Boolean);
}
function jazzCurrentUnits(){
  const s = jazzActiveStage();
  if(!s) return [];
  return jazzUnitsForStage(s.id);
}

/* ---------- HTML helpers ---------- */
const UNIT_PART_ICON = {fundamentals:'🎹', rote:'🔄', tunes:'🎵', listening:'🎧'};
const UNIT_CAT_LABEL = {
  coordination:'Coordination', swing:'Swing feel', comping:'Comping',
  'scale-pattern':'Scale pattern', melody:'Melody', written:'Written practice',
  transcription:'Transcription', 'tune-app':'Tune application',
  bossa:'Bossa nova', 'intro-ending':'Intros & endings',
  memorization:'Memorization', 'self-transcription':'Self-analysis',
  improvisation:'Improvisation', 'guided-listening':'Guided listening',
  voicing:'Voicing'
};

function jazzUnitDetailHTML(unitId){
  const u = jazzUnit(unitId);
  if(!u) return '<div class="empty">Unit not found.</div>';
  const prog = jazzUnitProgress(unitId);
  const pct = prog.of ? Math.round(prog.done / prog.of * 100) : 0;
  const stageUnits = jazzUnitsForStage(jazzActiveStage() && jazzActiveStage().id);
  const isCurrent = stageUnits.some(x => x.id === unitId);
  return `<div class="row between" style="align-items:baseline;gap:10px;flex-wrap:wrap">
    <button class="btn sm ghost" id="jzUnitsBack">← All units</button>
    <span class="mono faint">Book ${u.book} · Unit ${u.unit} · ${u.stageLabel}</span>
  </div>
  <h1 class="serif" style="margin-top:8px">${esc(u.name)}</h1>
  ${isCurrent ? '<p class="jz-unit-current-badge">Current stage</p>' : ''}
  <div class="jz-unit-prog-bar"><i style="width:${pct}%"></i></div>
  <div class="mono faint" style="margin-bottom:16px">${prog.done} of ${prog.of} assignments ticked off</div>
  <div class="jz-unit-assignments">
    ${u.assignments.map((a, i) => {
      const done = jazzUnitDone(unitId, i);
      return `<label class="jz-ua${done ? ' done' : ''}" data-jzunit="${esc(unitId)}" data-jzidx="${i}">
        <input type="checkbox" class="jz-ua-check" ${done ? 'checked' : ''}>
        <div class="jz-ua-body">
          <div class="jz-ua-meta">
            <span class="jz-ua-part">${UNIT_PART_ICON[a.part] || '○'} ${esc(a.part)}</span>
            <span class="jz-ua-cat">${esc(UNIT_CAT_LABEL[a.category] || a.category)}</span>
            ${a.minutes ? `<span class="mono jz-ua-min">${a.minutes} min</span>` : ''}
          </div>
          <p class="jz-ua-text">${esc(a.text)}</p>
        </div>
      </label>`;
    }).join('')}
  </div>
  <div class="row" style="gap:8px;margin-top:16px">
    <button class="btn sm ghost" id="jzUnitsBack2">← All units</button>
    ${prog.done < prog.of
      ? `<button class="btn sm ghost" id="jzUnitCheckAll">Mark all complete</button>`
      : `<button class="btn sm ghost" id="jzUnitUncheckAll">Clear all</button>`}
  </div>`;
}

function jazzUnitsHTML(activeUnitId){
  if(activeUnitId) return jazzUnitDetailHTML(activeUnitId);
  const currentUnits = jazzCurrentUnits();
  const currentIds = new Set(currentUnits.map(u => u.id));
  const books = [1, 2, 3];
  return `<div class="row between" style="align-items:baseline">
    <h1 class="serif" style="margin:0">Unit Assignments</h1>
    <button class="btn sm ghost" id="jzUnitsPback">← the roadmap</button>
  </div>
  <p class="page-blurb">Every assignment page from Siskind's three books — ticked off as you go,
    grouped by book and unit. The current stage's units are highlighted.</p>
  ${books.map(b => {
    const units = SISKIND_UNITS.filter(u => u.book === b);
    return `<section class="jz-unbook">
      <h2 class="serif jz-unbook-head">Book ${b}</h2>
      <div class="jz-unlist">
        ${units.map(u => {
          const p = jazzUnitProgress(u.id);
          const pct = p.of ? Math.round(p.done / p.of * 100) : 0;
          const isCurr = currentIds.has(u.id);
          return `<button class="jz-uncard${isCurr ? ' current' : ''}" data-jzunit="${esc(u.id)}">
            <div class="jz-uncard-top">
              <span class="jz-uncard-id mono">${esc(u.id)}</span>
              <span class="jz-uncard-stage faint">${esc(u.stageLabel)}</span>
            </div>
            <div class="jz-uncard-name">${esc(u.name)}</div>
            <div class="jz-uncard-bar"><i style="width:${pct}%"></i></div>
            <div class="mono faint" style="font-size:.7rem">${p.done}/${p.of}</div>
          </button>`;
        }).join('')}
      </div>
    </section>`;
  }).join('')}`;
}

/* ---------- state accessor for the plan page ---------- */
function jazzCurrentUnitSummaryHTML(){
  const us = jazzCurrentUnits();
  if(!us.length) return '';
  return `<div class="jz-unit-summary">
    <div class="row between" style="align-items:baseline">
      <span class="sc">Current unit assignments</span>
      <button class="btn sm ghost" id="jzGoUnits">all units →</button>
    </div>
    ${us.map(u => {
      const p = jazzUnitProgress(u.id);
      const pct = p.of ? Math.round(p.done / p.of * 100) : 0;
      return `<div class="jz-unit-row" data-jzunit="${esc(u.id)}">
        <div class="row between" style="align-items:center">
          <span><b>${esc(u.id)}</b> ${esc(u.name)}</span>
          <span class="mono faint">${p.done}/${p.of}</span>
        </div>
        <div class="jz-unit-prog-bar sm"><i style="width:${pct}%"></i></div>
      </div>`;
    }).join('')}
  </div>`;
}

/* ---------- binding ---------- */
function bindJazzUnits(root){
  const ui = jazzUi();
  const back = root.querySelector('#jzUnitsPback');
  if(back) back.onclick = () => navigate('#/jazz');
  const back2 = root.querySelector('#jzUnitsBack');
  if(back2) back2.onclick = () => { ui._unitId = null; rerender(); };
  const back3 = root.querySelector('#jzUnitsBack2');
  if(back3) back3.onclick = () => { ui._unitId = null; rerender(); };

  /* unit card buttons (browse list) */
  $$('[data-jzunit]', root).forEach(el => {
    if(el.tagName === 'BUTTON' && el.classList.contains('jz-uncard')){
      el.onclick = () => { ui._unitId = el.dataset.jzunit; rerender(); };
    }
  });

  /* assignment checkboxes (detail view) */
  $$('.jz-ua-check', root).forEach(cb => {
    cb.onchange = () => {
      const label = cb.closest('[data-jzunit]');
      const unitId = label && label.dataset.jzunit;
      const idx = label && +label.dataset.jzidx;
      if(unitId == null || isNaN(idx)) return;
      jazzSetUnitDone(unitId, idx, cb.checked);
      label.classList.toggle('done', cb.checked);
      sound(cb.checked ? 'success' : 'click');
      /* update the progress bar and counter above */
      const p = jazzUnitProgress(unitId);
      const pct = p.of ? Math.round(p.done / p.of * 100) : 0;
      const bar = root.querySelector('.jz-unit-prog-bar i');
      if(bar) bar.style.width = pct + '%';
      const ctr = root.querySelector('.mono.faint');
      if(ctr && ctr.textContent.includes('of')) ctr.textContent = `${p.done} of ${p.of} assignments ticked off`;
    };
  });

  /* mark all / clear all */
  const checkAll = root.querySelector('#jzUnitCheckAll');
  if(checkAll) checkAll.onclick = () => {
    const unitId = ui._unitId;
    const u = jazzUnit(unitId);
    if(!u) return;
    u.assignments.forEach((_, i) => jazzSetUnitDone(unitId, i, true));
    sound('success'); toast(`All ${u.assignments.length} assignments marked complete.`);
    rerender();
  };
  const uncheckAll = root.querySelector('#jzUnitUncheckAll');
  if(uncheckAll) uncheckAll.onclick = () => {
    const unitId = ui._unitId;
    const u = jazzUnit(unitId);
    if(!u) return;
    u.assignments.forEach((_, i) => jazzSetUnitDone(unitId, i, false));
    sound('click'); toast('Cleared.');
    rerender();
  };

  /* "all units →" from plan page */
  const goUnits = root.querySelector('#jzGoUnits');
  if(goUnits) goUnits.onclick = () => navigate('#/jazz/units');
  /* unit rows on plan page */
  $$('[data-jzunit].jz-unit-row', root).forEach(row => {
    row.style.cursor = 'pointer';
    row.onclick = () => navigate('#/jazz/units/' + row.dataset.jzunit);
  });
}
