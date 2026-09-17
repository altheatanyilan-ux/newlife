/* ============================================================
   THE JAZZ ROADMAP, as it arrives.

   Four phases and twenty micro-stages, taken from the training documents
   this was built from. It is a scaffold, not a rule: every field of it can
   be rewritten, and stages can be added, reordered or deleted. It is here
   at all because an empty roadmap is not a roadmap — the hardest part of a
   five-year plan is writing down the first year of it, and that part is
   already known.
   ============================================================ */
function pianoConceptSeed(name, type, extra = {}){
  return Object.assign({id:uid(), name, type, keys:{}, fluency:'cant_do',
    bpm:{comfortable:null, max:null}, notes:'', lastPracticed:null, practiceCount:0,
    entries:[]}, extra);
}
function pianoStageSeed(n, name, weeks, focus, resource, drill, concepts){
  return {id:uid(), number:n, name, weeks, focus, resource, drill,
    status:'not_started', notes:'', concepts};
}
function pianoDefaultRoadmap(){
  const C = pianoConceptSeed;
  return [
    {id:uid(), number:1, name:'Foundational Restructuring', months:'1–12', status:'not_started',
     blurb:'Dismantle visual dependency. Build a functional jazz harmonic vocabulary.',
     stages:[
      pianoStageSeed(1, 'Major Scales & Intervals', 'Weeks 1–4',
        'Twelve major scales as formulas rather than pictures; instant identification of the 3rd and the 7th.',
        'Jazz Piano Fundamentals, Book 1 — Jeremy Siskind',
        'Play a major scale in one hand, then put root, 3rd, 5th and 7th down together. Fifteen minutes.',
        [C('Major scale fluency', 'keyboard_drill'),
         C('Instant 3rd and 7th', 'keyboard_drill')]),
      pianoStageSeed(2, 'Core 7th Chords', 'Weeks 5–12',
        'Maj7, min7, dom7 and half-diminished, built from the formula and not from memory of a shape.',
        'Jazz Piano Fundamentals, Book 1 — Jeremy Siskind',
        'One chord quality, all twelve keys, no looking. Then the next.',
        [C('Maj7 in twelve keys', 'voicing_type', {quality:'maj7'}),
         C('Min7 in twelve keys', 'voicing_type', {quality:'min7'}),
         C('Dom7 in twelve keys', 'voicing_type', {quality:'dom7'}),
         C('Half-diminished in twelve keys', 'voicing_type', {quality:'half-dim'})]),
      pianoStageSeed(3, 'Shell Voicings', 'Weeks 13–18',
        'Left-hand guide tones — the 3rd and the 7th — and voice leading them through ii-V-I.',
        'Jazz Keyboard Harmony — Phil DeGreg, chapters 1–2',
        'ii-V-I around the cycle of fifths with shells only. Listen for the two notes moving.',
        [C('Shell voicing per key', 'keyboard_drill'),
         C('ii-V-I around the cycle', 'keyboard_drill')]),
      pianoStageSeed(4, 'Melody over Shells', 'Weeks 19–24',
        'Right-hand melody over left-hand shells, on real standards.',
        'Jazz Keyboard Harmony — Phil DeGreg, chapters 1–2',
        'One standard a week: melody in the right, shells in the left, in time.',
        [C('Standards played with shells', 'transcription', {type:'listening'})]),
      pianoStageSeed(5, 'Vocal Syllabification', 'Weeks 25–30',
        'Scat syllables mapped to articulation; the swing feel that comes with them.',
        'Scat! Vocal Improvisation Techniques — Bob Stoloff',
        'Doo, bah, bop, dit — one syllable family at a time, over a blues.',
        [C('Syllable families', 'vocal_technique'),
         C('Swing feel at tempo', 'vocal_technique')]),
      pianoStageSeed(6, 'Transcription', 'Weeks 31–36',
        'Aural imitation of simple solos. Ear first, paper second, and paper optional.',
        'Scat! Vocal Improvisation Techniques — Bob Stoloff',
        'Eight bars, sung back until it is right, then found on the keys.',
        [C('Solos transcribed', 'transcription')])]},

    {id:uid(), number:2, name:'Advanced Harmonic Architecture', months:'Years 2–3', status:'not_started',
     blurb:'The textures that make it sound like the record.',
     stages:[
      pianoStageSeed(7, 'Rootless A & B Voicings', 'Weeks 37–48',
        '3-5-7-9 without the root, in both inversions — the bass player has the root.',
        'DeGreg ch. 3–4; Siskind Book 2',
        'A-form through the cycle, then B-form, then alternating so the hand barely moves.',
        [C('Rootless A form', 'voicing_type', {quality:'dom7'}),
         C('Rootless B form', 'voicing_type', {quality:'dom7'})]),
      pianoStageSeed(8, 'Self-Accompaniment Basics', 'Weeks 49–56',
        'Singing while playing rootless voicings — two independent things at once.',
        '—',
        'One tune, sung and played, slowly, until the hands stop listening to the voice.',
        [C('Tunes sung while playing', 'live_performance')]),
      pianoStageSeed(9, 'Enclosures & Chromaticism', 'Weeks 57–68',
        'Approaching a chord tone from above and below before landing on it.',
        'The Barry Harris method',
        'One enclosure shape, twelve keys, over a ii-V.',
        [C('Enclosure patterns', 'keyboard_drill')]),
      pianoStageSeed(10, 'Drop 2 Voicings', '—',
        'Open four-note voicings — the Bill Evans texture.',
        'The Jazz Piano Book — Mark Levine (reference)',
        'Drop the second voice from the top, one quality at a time.',
        [C('Drop 2 — maj7', 'voicing_type', {quality:'maj7'}),
         C('Drop 2 — min7', 'voicing_type', {quality:'min7'}),
         C('Drop 2 — dom7', 'voicing_type', {quality:'dom7'})]),
      pianoStageSeed(11, 'Upper Structure Triads', '—',
        'A tritone shell underneath and a triad on top of it — the fastest route to colour.',
        'The Jazz Piano Book — Mark Levine (reference)',
        'One upper structure at a time over a dom7: II, bIII, #IV, bVI, VI.',
        [C('Upper structures over dom7', 'voicing_type', {quality:'dom7'})]),
      pianoStageSeed(12, 'Forward Motion & Swing Physics', '—',
        'The 2/2 macro-pulse, the backbeat, and where the notes sit against it.',
        'Forward Motion — Hal Galper',
        'Metronome on 2 and 4 only. Then on 4 only. Then on the "and" of 2.',
        [C('Metronome on 2 and 4', 'keyboard_drill'),
         C('Lines that resolve forward', 'keyboard_drill')]),
      pianoStageSeed(13, 'The 6th Diminished Scale', '—',
        'Barry Harris: the eight-note scale where a 6th chord and a dim7 interlock.',
        'The Barry Harris method',
        'Scale up, chords down, all twelve keys, hands together.',
        [C('6th-diminished scale', 'keyboard_drill')])]},

    {id:uid(), number:3, name:'Dual-Tasking — Self-Accompaniment', months:'Year 4', status:'not_started',
     blurb:'Two musicians, one person. The piano answers the voice.',
     stages:[
      pianoStageSeed(14, 'The Shirley Horn Method', '—',
        'Chords land in the gaps between vocal phrases: call and response with yourself.',
        'Study: Shirley Horn, Diana Krall, Nat King Cole',
        'Sing a phrase. Say nothing. Answer it with the left hand.',
        [C('Self-accompanied tunes', 'live_performance')]),
      pianoStageSeed(15, 'Contrary Motion & Inner Voices', '—',
        'A chromatic line hidden inside a held chord while the voice sustains.',
        '—',
        'Hold a chord, move one inner voice, keep singing.',
        [C('Inner-voice moves in use', 'keyboard_drill')]),
      pianoStageSeed(16, 'Intro & Outro Construction', '—',
        'Piano passages that set the emotional stage before a word is sung.',
        '—',
        'Write an intro for a standard you already play. Then a second, different one.',
        [C('Intros composed', 'composition')]),
      pianoStageSeed(17, 'Texture Variation', '—',
        'Sparse rubato verse, then a chorus with a walking bass underneath it.',
        '—',
        'One tune, three textures, in one pass.',
        [C('Arrangement approaches', 'composition')])]},

    {id:uid(), number:4, name:'Singer-Songwriter Synthesis', months:'Year 5', status:'not_started',
     blurb:'The vocabulary becomes yours: your harmony, your songs.',
     stages:[
      pianoStageSeed(18, 'Jazz-Pop Harmonic Analysis', '—',
        'Pull the jazz tropes out of Laufey, Bruno Major, Norah Jones.',
        'Lead sheets',
        'One song a week: write out what the harmony is actually doing.',
        [C('Songs analysed', 'listening')]),
      pianoStageSeed(19, 'Reharmonisation', '—',
        'Secondary dominants, tritone subs, modal interchange — on tunes you know.',
        '—',
        'Take one standard and reharmonise eight bars of it, twelve ways.',
        [C('Reharmonisation techniques', 'keyboard_drill')]),
      pianoStageSeed(20, 'Composition & Production', '—',
        'Original jazz-pop songwriting, and getting it out of the room.',
        'Ableton Live',
        'Finish something. Finished is the skill.',
        [C('Original compositions', 'composition')])]}];
}

/* Gordon's six stages of audiation, self-assessed. The ladder is here because
   it is the thing underneath all of the above: hearing it before you play it.
   It is asked about periodically rather than tracked daily — it moves on the
   scale of seasons. */
function pianoDefaultAudiation(){
  return [
    [1,'Momentary Retention','Hold a short sequence of notes right after hearing it.',
       'Catching a complex phrase and still having it a second later.'],
    [2,'Imitation','Sing back what you heard, accurately.',
       'Singing a lick off the record before you go near the keys.'],
    [3,'Assimilation','Recognise the pattern behind what you imitated.',
       'Hearing that the lick is an enclosure, not just a shape.'],
    [4,'Retention','Hold longer material, and hold it over time.',
       'Carrying a whole chorus in your head on the way home.'],
    [5,'Generalisation','Recognise the same pattern somewhere new.',
       'Hearing that ii-V in a key you have never played it in.'],
    [6,'Creativity','Make new material out of the vocabulary, in real time.',
       'Improvising a line you have never played and meaning it.']
  ].map(([stage, name, what, jazz]) =>
    ({stage, name, what, jazz, level:'developing', assessedAt:null}));
}

/* The shelf. These are the books the roadmap is built on, so they arrive with
   it — the point of a reference shelf is that you do not have to remember
   which book the thing you are stuck on is in. */
function pianoDefaultResources(){
  return [
    ['Jazz Piano Fundamentals, Books 1 & 2','Jeremy Siskind','book',
     'Step-by-step adult pedagogy, practice plans, listening guides.',
     'The transition in. Lead sheets and basic 7th chords.'],
    ['Jazz Keyboard Harmony','Phil DeGreg','book',
     'Voicings built systematically, cycle by cycle.',
     'Shells, then rootless. The core of phases 1 and 2.'],
    ['The Jazz Piano Book','Mark Levine','book',
     'The encyclopedia. Not a course.',
     'Looking one thing up, thoroughly.'],
    ['Scat! Vocal Improvisation Techniques','Bob Stoloff','book',
     'Syllables, rhythm, and the ear.',
     'The vocal half, and transcription by ear.'],
    ['Forward Motion','Hal Galper','book',
     'Why lines that are correct still sound wrong.',
     'Rhythm and phrasing, once the notes are there.'],
    ['Effortless Mastery','Kenny Werner','book',
     'The psychology of it: practice time against play time.',
     'The weeks where it stops being fun.'],
    ['Barry Harris masterclasses','Barry Harris','youtube',
     'The 6th-diminished world, taught by the man himself.',
     'Phase 2, stages 9 and 13.'],
    ['Jazzedge / Open Studio','—','website',
     'Structured online lessons and play-alongs.',
     'When you want somebody to tell you what to do today.']
  ].map(([title, author, type, focus, bestFor]) =>
    ({id:uid(), title, author, type, focus, bestFor, url:'', notes:'', stageIds:[]}));
}
