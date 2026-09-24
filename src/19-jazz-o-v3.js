/* ============================================================
   CURRICULUM v3 — WHERE EVERYTHING GOES.

   The Master Build Document restructures the ladder into thirteen
   stages, 0 to 12, each with a poetic title, a parallel Voice Track
   of six levels, and a dual-tasking track that sits after Stage 9.
   It re-homes the room's own exercises by their ids — Stage 2 is the
   old 2.x, 3.x and 4.x; Stage 3 is 5.x and 6.x; Stage 4 is 6A.x and
   7.x; Stage 10 is 8.x, 10.x and 11.x — and adds a great deal that
   the room did not have.

   THIS FILE DECIDES PLACEMENT AND NOTHING ELSE. The document's words
   are in 19-jazz-o-v3doc.js exactly as written; the room's exercises
   are in the catalogues exactly as they were. What is here is the
   join: for every stage, in the document's own order, which of the
   document's entries appear, and which of the room's exercises sit
   under each.

   THREE KINDS OF LINE.
     'id'                         one of the room's exercises, placed here
     {doc:key}                    a document entry that is new to the room
     {doc:key, onto:'id'}         a document entry that IS one of the
                                  room's exercises, so its words are
                                  merged onto that exercise rather than
                                  standing beside it as a duplicate

   EXERCISE IDS NEVER CHANGE. Everything anybody has practised is kept
   under the exercise's id, so an exercise moves between stages and
   keeps every key, log and checkpoint it has. A new entry takes the
   document's own number where that number is free ("5.4 Bird Blues"),
   and "v3-" in front of it where the room already uses that number for
   something else ("v3-2.4a", beside the room's 2.4a). An entry the
   document gives no number to is "v3-" and a slug of its name.

   WHERE THE DOCUMENT AND THE ROOM DISAGREE, BOTH ARE KEPT. That was the
   decision: the room's version was checked against the books, the
   document's is the new plan, and which is right is for the person
   practising to decide after reading both. Every such pair is listed in
   JAZZ_V3_CONFLICTS below, each side of it says so on its own page,
   and the About page puts the whole list in one table.
   ============================================================ */

/* ---------- the rungs, in order ----------
   DT sits after 9 because the document says so ("Placement: After
   Stage 9, as an advanced integration track"), and it is a track rather
   than a stage: 10 follows 9, not DT. The Voice Track has its own view. */
const JAZZ_V3_ORDER = ['P0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'DT', '10', '11', '12',
  'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
const JAZZ_V3_VOICE = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
/* the rungs that run beside the main line rather than on it */
const jazzV3IsTrack = sid => String(sid) === 'DT' || JAZZ_V3_VOICE.includes(String(sid));

/* ---------- which old rung went where ----------
   For the state migration, and for carrying each old stage's teaching
   (its theory, its Werner, its listening) onto the stage that absorbed
   it. Old 7 held both the altered dominants and nothing of the minor
   two-five (that was 2.3), so all of it goes to 4. */
const JAZZ_V3_FROM_OLD = {'P0':'P0', '1':'1', '2':'2', '3':'2', '4':'2', '5':'3', '6':'3',
  '6A':'4', '7':'4', '7A':'6', '7B':'7', '7C':'8', '7D':'9', '8':'10', '9':'11', '10':'10',
  '11':'10', '12':'12', '13':'12', '15':'11', 'V1':'V1', 'V2':'V2', 'V3':'V3', 'V4':'V4'};

/* ---------- the Siskind units, translated (Section 7, Module 2) ----------
   "B1 Units 1-2 map to v3 Stage 1. B1 Units 3-6 map to v3 Stage 2. B1
   Units 7-9 map to v3 Stage 3. B1 Units 10-12 map to v3 Stage 4. B2 Units
   1-2 map to v3 Stage 6. B2 Units 3-6 map to v3 Stage 7. B2 Units 7-9 map
   to v3 Stage 8. B2 Units 10-12 map to v3 Stage 9. B3 Units 1-6 map to v3
   Stage 10. B3 Units 7-9 map to v3 Stage 10. B3 Units 10-12 map to v3
   Stages 10-12."
   The last sentence spans three stages for three units; the document's
   own Stage 12 cites Book 3 Unit 11 (modern piano devices) and Unit 12
   (free jazz), so 10 goes to 10 and 11 and 12 go to 12. */
const JAZZ_V3_UNIT_STAGE = {
  1: {1:'1', 2:'1', 3:'2', 4:'2', 5:'2', 6:'2', 7:'3', 8:'3', 9:'3', 10:'4', 11:'4', 12:'4'},
  2: {1:'6', 2:'6', 3:'7', 4:'7', 5:'7', 6:'7', 7:'8', 8:'8', 9:'8', 10:'9', 11:'9', 12:'9'},
  3: {1:'10', 2:'10', 3:'10', 4:'10', 5:'10', 6:'10', 7:'10', 8:'10', 9:'10', 10:'10', 11:'12', 12:'12'}
};
const jazzV3UnitStage = (book, unit) => ((JAZZ_V3_UNIT_STAGE[+book] || {})[+unit]) || null;
/* "B2-U7" → "8" */
function jazzV3StageOfUnitCode(code){
  const m = /B(\d)-U(\d+)/.exec(String(code || ''));
  return m ? jazzV3UnitStage(m[1], m[2]) : null;
}

/* ---------- the stages ----------
   title and subtitle are the document's; theory is its Section 1 prose
   for the stage; outcome is its Section 3 row; goldenTip is its Section
   4G sidebar where it gives one; audiation is where Section 4D puts the
   stage on Gordon's ladder. `from` names the old rungs a stage absorbed,
   whose own teaching is carried beneath the document's; `werner` and
   `mindset` come from the old rung the stage mostly is. */
const JAZZ_V3_STAGE_META = {
  'P0': {n:0, from:['P0'], lead:'P0',
    blurb:'Every interval from the half-step to the octave, from any root, before any chord.'},
  '1': {n:1, needs:'P0', from:['1'], lead:'1',
    blurb:'The five chord shapes, reading a lead sheet, song form, swing — and the first improvising.',
    goldenTip:'You will play wrong notes. This is not failure — it’s jazz.'},
  '2': {n:2, needs:'1', from:['2', '3', '4'], lead:'2',
    blurb:'The ii-V-I, voiced every way a pianist needs: shells, Type A and B, one hand.'},
  '3': {n:3, needs:'2', from:['5', '6'], lead:'5',
    blurb:'The blues in its forms, and the first real improvising over it.',
    goldenTip:'Your first solo will sound terrible. Record it anyway.'},
  '4': {n:4, needs:'3', from:['6A', '7'], lead:'6A',
    blurb:'The modes, melodic minor and the symmetric scales, and the altered dominant — at the keyboard.'},
  '5': {n:5, needs:'4', from:[], lead:null,
    blurb:'Slash chords, the diminished seventh as a device, dominant chains and the deceptive cadence.',
    werner:'Separate practice time — analytical, slow, repetitive — from play time, which is fearless, unedited and has no consequences.',
    mindset:'Play the plain progression first, every time, and then the device. You cannot hear what a passing diminished chord does until you have heard the bar without it.'},
  '6': {n:6, needs:'5', from:['7A'], lead:'7A',
    blurb:'The record as the teacher: transcription, memorising tunes, and comping that moves.',
    goldenTip:'Transcription is slow. Trust the process.'},
  '7': {n:7, needs:'6', from:['7B'], lead:'7B',
    blurb:'The minor two-five-one in full, guidetone lines, line clichés and the scale patterns.'},
  '8': {n:8, needs:'7', from:['7C'], lead:'7C',
    blurb:'Rhythm changes, motivic development, how to start and how to stop, and Barry Harris.'},
  '9': {n:9, needs:'8', from:['7D'], lead:'7D',
    blurb:'The bassist, the comper and the soloist at once: walking bass, drop-two, ballads, solo piano.',
    goldenTip:'Solo piano is lonely. Play for yourself first.'},
  'DT': {n:'DT', needs:'9', from:[], lead:null, track:'dt',
    title:'Singing While You Play', subtitle:'Dual-tasking and self-accompaniment',
    blurb:'Section 4E: singing over your own comping, four levels deep.',
    werner:'Fear of sounding bad is the primary obstacle.',
    mindset:'The hands have to be on autopilot before the voice can be free. If singing makes the comping fall apart, the comping is not automatic yet — go back one level, not forward.'},
  '10': {n:10, needs:'9', from:['8', '10', '11'], lead:'8',
    blurb:'When the chord holds still: modes, quartal voicings, pentatonics, playing outside, the modal blues.'},
  '11': {n:11, needs:'10', from:['9', '15'], lead:'9',
    blurb:'The same melody over new harmony: reharmonisation, modulation, constant structures.'},
  '12': {n:12, needs:'11', from:['12', '13'], lead:'12',
    blurb:'Advanced voicing systems, odd meters, modern devices, arranging, free playing and your own tunes.'},
  'V1': {n:'V1', needs:'1', from:['V1'], lead:'V1', track:'voice', beside:['1']},
  'V2': {n:'V2', needs:'V1', from:['V2'], lead:'V2', track:'voice', beside:['2', '4']},
  'V3': {n:'V3', needs:'V2', from:['V3'], lead:'V3', track:'voice', beside:['2', '3']},
  'V4': {n:'V4', needs:'V3', from:['V4'], lead:'V4', track:'voice', beside:['6', '8']},
  'V5': {n:'V5', needs:'V4', from:[], lead:null, track:'voice', beside:['9', '10'],
    title:'Singing with Others, and Past the Usual Sounds', subtitle:'Ensemble singing and extended vocal techniques',
    blurb:'Section 1: "advanced vocal jazz techniques including ensemble singing, extended vocal techniques".',
    werner:'Before each session, sit, breathe, and sing a single note with no agenda. Attend to the sensation, the tone and the resonance.',
    mindset:'In a section your job is the blend, not your line. Sing half as loud as you think you should and listen twice as hard.'},
  'V6': {n:'V6', needs:'V5', from:[], lead:null, track:'voice', beside:['11', '12'],
    title:'Writing for Voices', subtitle:'Vocal arranging',
    blurb:'Section 1: "…and vocal arranging (V5–V6)" — the voice track ends by writing for other singers.',
    werner:'Nothing has to be proved. The music is already there.',
    mindset:'Write for the singers you have, in the ranges they actually sing in. An arrangement nobody can sing in tune is a composition exercise.'}
};

/* Gordon's six stages of audiation, as Section 4D maps them onto the
   curriculum. A curriculum stage can sit in two of them, and does. */
const JAZZ_V3_AUDIATION = [
  {n:1, name:'Momentary Retention', stages:['P0', '1'], said:'Hear interval, hold it.'},
  {n:2, name:'Imitating & Audiating', stages:['1', '2'], said:'Feel tonal center and swing pulse without notation.'},
  {n:3, name:'Establishing Context', stages:['2', '3'], said:'Recognize ii–V–I vs minor ii–V–i by ear.'},
  {n:4, name:'Conscious Retention', stages:['4', '5', '6', '7'], said:'Internalize bebop patterns and syncopated comping.'},
  {n:5, name:'Conscious Recall', stages:['8', '9', '10'], said:'Recognize harmonic patterns across tunes.'},
  {n:6, name:'Conscious Prediction', stages:['11', '12'], said:'Predict resolutions during improvisation.'}
];
const jazzV3AudiationFor = sid => JAZZ_V3_AUDIATION.filter(a => a.stages.includes(String(sid)));

/* ---------- the layout ----------
   Every stage in the document's order. Where a document heading names a
   RANGE of the room's ids ("7C.902-7C.905 Rhythm Changes Form"), the
   heading's own content leads and the room's exercises in that range
   follow it. Where a range crosses sub-stages ("7A.903–7C.901 Advanced
   Comping Rhythms"), it is read as the items of that kind inside the
   span, and a more specific heading elsewhere wins. Anything the
   document never names goes where its Siskind unit puts it. */
const JAZZ_V3_LAYOUT = {
  'P0': [
    {doc:'0:P0.1', onto:'P0.1', tab:{gen:'harmonicInterval', title:'Harmonic, as v3 writes it'}},
    {doc:'0:P0.2', onto:'P0.2'}, {doc:'0:P0.3', onto:'P0.3'}, {doc:'0:P0.4', onto:'P0.4'},
    {doc:'0:P0.5', onto:'P0.5'}, {doc:'0:P0.6', onto:'P0.6'}, {doc:'0:P0.7', onto:'P0.7'},
    {doc:'0:P0.8', onto:'P0.8'}, {doc:'0:P0.9', onto:'P0.9'}, {doc:'0:P0.10', onto:'P0.10'},
    {doc:'0:P0.11', onto:'P0.11'}, {doc:'0:P0.12', onto:'P0.12'}],

  '1': [
    {doc:'1:1.1', onto:'1.1'}, {doc:'1:1.2', onto:'1.2'}, {doc:'1:1.3', onto:'1.3'},
    {doc:'1:1.4', onto:'1.4'}, {doc:'1:1.5', onto:'1.5'},
    {doc:'1:1.6', tool:'cardsA'}, {doc:'1:1.7'}, {doc:'1:1.8'}, {doc:'1:1.9', tool:'cardsC'},
    /* the document's 1.901 and 1.902 are the Charleston and its reverse,
       which the room has as 1.909 and 1.910 */
    {doc:'1:1.901', onto:'1.909'},
    {doc:'1:1.902', onto:'1.910', gen:'reverseCharleston'},
    {doc:'1:1.903–1.913', gen:'swingEighths'},
    '1.901', '1.902', '1.903', '1.904', '1.905', '1.906', '1.907', '1.908', '1.911', '1.912', '1.913',
    {doc:'1:1.10', onto:'IMP-B1-01', tool:'drone'}, 'IMP-B1-02',
    {doc:'1:1.11', onto:'IMP-B1-10', tool:'pwys'}],

  '2': [
    {doc:'2:2.1', onto:'2.1'},
    {doc:'2:2.1b', gen:'iiVIInversions'}, '2.1b',
    {doc:'2:2.1c', gen:'iiVIAllKeys'}, '2.1c',
    {doc:'2:2.2', onto:'2.2', tab:{xml:true, title:'The ii-V-I in shells, as v3 writes it'}},
    {doc:'2:2.4a', gen:'shells73'}, {doc:'2:2.4b', gen:'shellsWith5'}, '2.4a', '2.4b',
    {doc:'2:2.5'},
    {doc:'2:3.1–3.3'}, '3.1', '3.2', '3.3',
    {doc:'2:3.4', gen:'fiveNoteTwoHanded'},
    {doc:'2:4.1a–4.2', gen:'oneHandedFour'}, '4.1a', '4.1b', '4.1c', '4.2',
    /* Book 1 Units 3-6 improvising, which the document folds into this stage */
    'IMP-B1-03', 'IMP-B1-04', 'IMP-B1-05', 'IMP-B1-06A', 'IMP-B1-06B',
    {doc:'2:2.901–4.903', gen:'coordinationIIVI'}, '2.901', '2.902', '3.901', '3.902', '3.903',
    '4.901', '4.902', '4.903',
    {doc:'2:2.903–2.904', tool:'analysis', analysis:'hasIiVI'}, '2.903', '2.904',
    {doc:'2:2.10'}],

  '3': [
    {doc:'3:5.1'}, '5.1',
    {doc:'3:5.1b', gen:'bluesShells'}, '5.1b',
    {doc:'3:5.2–5.3', gen:'bluesVariations'}, '5.2', '5.3', 'IMP-B1-07',
    {doc:'3:5.4', gen:'birdBlues'}, {doc:'3:5.5', gen:'bluesBridge'},
    {doc:'3:6.1'}, '6.1',
    {doc:'3:6.2–6.12'}, '6.2', '6.3', '6.4', '6.5', '6.6', '6.7', '6.8', '6.9', '6.10', '6.11', '6.12',
    'IMP-B1-11',
    {doc:'3:6.13', onto:'IMP-B1-08'}, 'IMP-B1-09',
    {doc:'3:6.14'}, {doc:'3:6.15'},
    {doc:'3:5.904–5.906'}, '5.904', '5.905', '5.906',
    {doc:'3:5.901–5.903', gen:'bluesCoordination'}, '5.901', '5.902', '5.903'],

  '4': [
    {doc:'4:6A.1', onto:'6A.1'},
    {doc:'4:6A.2'}, '6A.2',
    {doc:'4:harmonic-rhythm-phrase-structure'},
    {doc:'4:6A.3', onto:'6A.3'},
    {doc:'4:6A.4–6A.8', onto:'6A.4'}, '6A.5', '6A.6', '6A.7', '6A.8',
    {doc:'4:interchangeability-of-melodic-minor-chords'},
    {doc:'4:bebop-scale'},
    {doc:'4:sus-b9-chord-phrygian-chord'}, {doc:'4:lydian-augmented-chord'},
    {doc:'4:7.1a–7.5'}, '7.1a', '7.1b', '7.1c', '7.2', '7.3', '7.4', '7.5', 'IMP-B1-12'],

  '5': [
    {doc:'5:slash-chords', gen:'slashChords'},
    {doc:'5:diminished-7th-as-harmonic-device'},
    {doc:'5:extended-dominants'},
    {doc:'5:deceptive-resolutions'}],

  '6': [
    {doc:'6:7A.916–7D.913', tool:'corea'}, '7A.916', '7A.917', '7B.915', '7D.913',
    {doc:'6:memorizing-a-tune'}, '7B.916', '7B.917',
    {doc:'6:7A.903–7C.901'}, '7A.903', '7A.904', '7A.905', '7A.906', '7A.907', '7A.908', '7A.911',
    '7B.904', '7B.905', '7B.906', '7B.907', '7C.901',
    {doc:'6:melodic-soprano-voice-leading', gen:'sopranoLine'},
    {doc:'6:jazz-waltz-comping'},
    /* Book 2 Units 1-2, unnamed by the document */
    '7A.901', '7A.902', '7A.909', '7A.910'],

  '7': [
    {doc:'7:2.3–2.3d'}, '2.3', '2.3b', '2.3c', '2.3d',
    {doc:'7:7B.901–7B.903', gen:'minorComping'}, '7B.901', '7B.902', '7B.903',
    {doc:'7:line-cliches-in-minor'},
    {doc:'7:SP1–SP6'}, '7A.912', '7A.913', '7B.908', '7B.909', '7B.910', '7B.911',
    {doc:'7:guidetone-lines'},
    {doc:'7:common-tone-improvisation'},
    {doc:'7:7A.914–7B.914'}, '7A.914', '7A.915', '7B.913', '7B.914'],

  '8': [
    {doc:'8:7C.902-7C.905', gen:'rhythmChanges'}, '7C.902', '7C.903', '7C.904', '7C.905',
    {doc:'8:motivic-development'}, {doc:'8:motivic-development-improvisation'},
    {doc:'8:7C.910-7C.912'}, '7C.910', '7C.911', '7C.912',
    {doc:'8:7C.913-7C.918'}, '7C.913', '7C.914', '7C.915', '7C.916', '7C.917', '7C.918',
    {doc:'8:minor-pentatonic-scale-ending'},
    {doc:'8:chromatic-descent-ending', gen:'chromaticDescentEnding'},
    {doc:'8:barry-harris-6th-diminished-scale'},
    {doc:'8:barry-harris-6th-diminished-scale-application', gen:'bhApplication'},
    /* Section 4H's four exercises */
    'BH.1', 'BH.2', 'BH.3', 'BH.4',
    {doc:'8:7C.906-7C.909'}, '7C.906', '7C.907', '7C.908', '7C.909'],

  '9': [
    {doc:'9:7D.901', onto:'7D.901'},
    {doc:'9:7D.910-7D.911'}, '7D.910', '7D.911',
    {doc:'9:corner-thumb-technique'},
    {doc:'9:octatonic-voicings', gen:'octatonicVoicing'}, {doc:'9:octatonic-voicings-theory'},
    {doc:'9:7D.902-7D.909'}, '7D.902', '7D.903', '7D.904', '7D.908', '7D.909',
    {doc:'9:ballad-devices-improvisation'},
    {doc:'9:back-phrasing', onto:'7B.912'},
    {doc:'9:ballad-types'}, {doc:'9:adding-motion-to-ballads'},
    {doc:'9:double-time-feel', gen:'doubleTime'},
    {doc:'9:reverse-swing'},
    {doc:'9:solo-piano-techniques'}, {doc:'9:solo-piano-techniques-theory'},
    {doc:'9:SP10-SP12'}, '7D.905', '7D.906', '7D.907',
    {doc:'9:7D.912'}, '7D.912',
    {doc:'9:kenny-barron-pattern', gen:'kennyBarron'},
    {doc:'9:oscar-peterson-pattern', gen:'oscarPeterson'}],

  'DT': ['DT.1', 'DT.2', 'DT.3', 'DT.4', 'DT.5', 'DT.6'],

  '10': [
    {doc:'10:8.1-8.2', gen:'modalBasics'}, '8.1', '8.2',
    {doc:'10:modal-jazz-basics-notation', gen:'dorianOverDm7'},
    {doc:'10:modal-drone-improvisation', tool:'drone'},
    {doc:'10:8.3a-8.4', onto:'8.3a'}, '8.3b', '8.3c', '8.3d', '8.4', '8.901',
    {doc:'10:complementary-voicings'}, {doc:'10:complementary-voicings-notation', gen:'complementary'},
    {doc:'10:8.5-8.6'}, '8.5', '8.6', '9.901',
    {doc:'10:melodic-minor-pentatonic', gen:'pentatonic', args:['melodicMinor']},
    {doc:'10:dominant-pentatonic', gen:'pentatonic', args:['dominant']},
    {doc:'10:flat-sixth-pentatonic', gen:'pentatonic', args:['flatSix']},
    {doc:'10:triad-pairs'},
    {doc:'10:8.7a-8.8b'}, '8.7a', '8.7b', '8.8a', '8.8b',
    {doc:'10:10.1-10.5'}, '10.1', '10.2', '10.3', '10.4', '10.5', '10.901', '10.902', '10.903',
    {doc:'10:modal-interchange-playing-outside-improvisation'},
    {doc:'10:playing-outside-non-modal'},
    {doc:'10:continuous-scale-game'},
    {doc:'10:11.1-11.5'}, '11.1', '11.2', '11.3', '11.4', '11.5',
    {doc:'10:MP1-MP10', gen:'dorianThirds'}, '8.902', '8.903', '8.904', '8.905', '9.902', '10.904',
    '10.905', '10.906', '9.903', '11.901',
    {doc:'10:stage-10-worksheets', tool:'analysis', analysis:'isModal'}, '8.906', '8.907', '8.908', '9.904',
    '10.907', '10.908', '10.909',
    /* Book 3's transcriptions, which the document places by unit */
    '8.909', '8.910', '8.911', '8.912', '9.905'],

  '11': [
    {doc:'11:9.1-9.6'}, '9.1', '9.2', '9.3', '9.4', '9.5', '9.6',
    {doc:'11:basic-reharmonization-applied', gen:'reharmApplied'},
    {doc:'11:comprehensive-reharmonization-techniques'},
    {doc:'11:modulation-types'},
    {doc:'11:15.1-15.5'}, '15.1', '15.2', '15.3', '15.4', '15.5',
    {doc:'11:constant-structure-uses'},
    {doc:'11:singer-songwriter-reharmonization-module', tool:'songwriter'},
    {doc:'11:singer-songwriter-reharmonization-notation', gen:'songwriterVoiced'},
    {doc:'11:9.901', gen:'reharmComping'}],

  '12': [
    {doc:'12:13.1.1-13.7.2'}, '13.1.1', '13.1.2', '13.1.3', '13.1.4', '13.1.5', '13.1.6',
    '13.2.1', '13.2.2', '13.2.3', '13.3.1', '13.3.2', '13.3.3', '13.3.4', '13.3.5',
    '13.4.1', '13.4.2', '13.4.3', '13.4.4', '13.5.1', '13.5.2', '13.6.1', '13.6.2', '13.7.1', '13.7.2',
    {doc:'12:rule-of-thumb'},
    {doc:'12:diminished-voicings-half-step-preparation', gen:'dimApproach'},
    {doc:'12:nonharmonic-tones-in-voicing'},
    {doc:'12:12.1-12.905'}, '12.1', '12.2', '12.3', '12.4', '12.5',
    '12.901', '12.902', '12.903', '12.904', '12.905',
    {doc:'12:modern-piano-devices', gen:'parallelTenths'}, {doc:'12:modern-piano-devices-theory'},
    {doc:'12:arranging-ensemble-writing'},
    {doc:'12:free-jazz-composition', tool:'record'}, {doc:'12:free-jazz-composition-theory'}],

  'V1': ['V1.3', 'V1.4'],
  'V2': ['V2.1a', 'V2.1b', 'V2.1c', 'V2.2a', 'V2.2b', 'V2.3', 'V2.4', 'V2.6a', 'V2.6b', 'V2.6c', 'V2.6d'],
  'V3': ['V3.5a', 'V3.5b', 'V3.5c', 'V3.5d'],
  'V4': ['V4.1a', 'V4.1b', 'V4.1c', 'V4.2a', 'V4.2b', 'V4.2c', 'V4.3a', 'V4.3b', 'V4.3c'],
  'V5': ['V5.1', 'V5.2', 'V5.3', 'V5.4'],
  'V6': ['V6.1', 'V6.2', 'V6.3', 'V6.4']
};

/* The key each of the document's MusicXML examples is written in, where
   it is not C. The key picker transposes FROM this. Single-chord modal
   examples are read the way the room's own modal exercises are: the
   chosen key is the chord's root. */
const JAZZ_V3_HOME = {
  '3:5.1':'F', '3:6.1':'F', '9:7D.901':'F',
  '8:7C.902-7C.905':'Bb', '8:7C.913-7C.918':'Bb', '8:minor-pentatonic-scale-ending':'Bb',
  '9:7D.902-7D.909':'Bb', '9:solo-piano-techniques':'Bb', '11:9.1-9.6':'Bb',
  '10:8.1-8.2':'D', '10:8.3a-8.4':'D', '10:8.7a-8.8b':'D', '12:12.1-12.905':'D',
  '9:SP10-SP12':'D', '6:jazz-waltz-comping':'D', '10:11.1-11.5':'G'
};

/* ---------- where the document and the room disagree ----------
   Each row: the document's entry, the room's exercise(s) it disagrees
   with, what the room has, and what the document says. Both are on the
   ladder; this is the list to read before deciding which to keep. */
const JAZZ_V3_CONFLICTS = [
  {doc:'0:P0.1', v3:'P0.1', app:['P0.1'],
   has:'The two notes of the interval one after the other, in two bars (melodic).',
   says:'"Two whole notes on treble clef forming a harmonic interval" — stacked. Both are shown on P0.1 as tabs.'},
  {doc:'1:1.901', v3:'1.909', app:['1.901'],
   has:'1.901 is Siskind’s Coordination Exercise 1 (major scale over quarter notes).',
   says:'1.901 is the Charleston rhythm. The document’s words and notation went onto the room’s Charleston, 1.909.'},
  {doc:'1:1.902', v3:'1.910', app:['1.902'],
   has:'1.902 is Coordination Exercise 2 (major scale over Charleston / Reverse Charleston).',
   says:'1.902 is the Reverse Charleston. Merged onto the room’s Reverse Charleston, 1.910.'},
  {doc:'2:2.1b', v3:'v3-2.1b', app:['2.1b'],
   has:'All three chords in second inversion: A-C-D-F, D-F-G-B, G-B-C-E.',
   says:'Dm7 in second inversion, G7 in root position, Cmaj7 in second inversion.'},
  {doc:'2:2.1c', v3:'v3-2.1c', app:['2.1c'],
   has:'Root position and second inversion alternated, in one key.',
   says:'A drill: the 2.1b voice leading through all twelve keys round the circle of fourths.'},
  {doc:'2:2.4a', v3:'v3-2.4a', app:['2.4a'],
   has:'Siskind’s ii-V-I descending by whole steps, Set A.',
   says:'Shell voicings, Variation A — the 7th under the 3rd (7-3).'},
  {doc:'2:2.4b', v3:'v3-2.4b', app:['2.4b'],
   has:'Siskind’s ii-V-I descending by whole steps, Set B.',
   says:'Shell voicings, Variation B — the 5th added (3-5-7).'},
  {doc:'2:3.1–3.3', v3:'v3-3.1', app:['3.1', '3.2', '3.3'],
   has:'Siskind’s Type A: third and seventh in the left hand, ninth and fifth in the right (Type B swaps the hands’ order). 3.3 is the diminished seventh.',
   says:'"Type A: LH plays root + 7th, RH plays 3rd + 5th. Type B: LH plays root + 3rd, RH plays 7th + 5th." That is a different voicing from the book’s Type A and B.'},
  {doc:'2:4.1a–4.2', v3:'v3-4.1a', app:['4.1a', '4.1b'],
   has:'One-handed shells of three notes — the third and seventh plus the ninth or the fifth.',
   says:'Four-note one-handed voicings: Dm7 as F-A-C-D, G7 as F-A-B-D, Cmaj7 as E-G-B-D.'},
  {doc:'2:2.903–2.904', v3:'v3-2.903', app:['2.903', '2.904'],
   has:'Writing out ii-V-I voicings, and writing out modes, in given keys.',
   says:'Finding and labelling the ii-V-Is in the charts of Autumn Leaves, All the Things You Are and Tune Up.'},
  {doc:'3:5.1', v3:'v3-5.1', app:['5.1'],
   has:'The twelve-bar jazz blues written out as voicings.',
   says:'The plain twelve-bar blues form in F — F7 for four bars, no quick four — as slashes under chord symbols.'},
  {doc:'3:5.1b', v3:'v3-5.1b', app:['5.1b'],
   has:'Three-note voicings over a bass in two.',
   says:'Shells — the third and seventh only — over whole-note roots.'},
  {doc:'3:5.2–5.3', v3:'v3-5.2', app:['5.2', '5.3'],
   has:'5.2 is the blues scale and 5.3 the sweet scale.',
   says:'5.2–5.3 are the jazz blues and quick-four blues changes.'},
  {doc:'3:6.1', v3:'v3-6.1', app:['6.1'],
   has:'Siskind’s Lick 1.',
   says:'Chord-tone targeting over the blues in F — chord tones only, no passing notes.'},
  {doc:'3:6.2–6.12', v3:'v3-6.2', app:['6.2', '6.3', '6.4', '6.5', '6.6', '6.7', '6.8', '6.9', '6.10', '6.11', '6.12'],
   has:'Licks 2 to 10, the 3-5-7-9 arpeggios and a coordination exercise.',
   says:'A progression of approach notes, enclosures and guide-tone lines: 6.2 chromatic approach, 6.3 diatonic approach, 6.4 enclosures, 6.5-6.8 guide-tone lines, 6.9-6.12 all combined.'},
  {doc:'3:5.901–5.903', v3:'v3-5.901', app:['5.901', '5.902', '5.903'],
   has:'Coordination Exercises 5 and 6 (scales over Charleston, melodies over a constant bassline) and vibrato imitation.',
   says:'5.901 roots in quarters under shells in Charleston; 5.902 walking bass under shell hits; 5.903 independent swing rhythms in each hand.'},
  {doc:'4:6A.2', v3:'v3-6A.2', app:['6A.2'],
   has:'All seven modes of one major key, one after another.',
   says:'The modes applied to a ii-V-I: D Dorian, G Mixolydian, C Ionian over their chords.'},
  {doc:'4:6A.4–6A.8', v3:'6A.4', app:['6A.5', '6A.6', '6A.7', '6A.8'],
   has:'6A.5-6A.8 are the two diminished scales, a diminished lick and the whole-tone scale.',
   says:'6A.4-6A.8 are the melodic minor modes studied one by one. The document’s words went onto 6A.4, the room’s melodic minor modes.'},
  {doc:'6:7A.916–7D.913', v3:'v3-7A.916', app:['7A.916', '7A.917', '7B.915', '7D.913'],
   has:'Siskind’s COREA: Copy, Observe, Repeat, Extract, Apply.',
   says:'COREA as "Copy, Omit, Reassemble, Extend, Abstract".'},
  {doc:'7:7B.901–7B.903', v3:'v3-7B.901', app:['7B.901', '7B.902', '7B.903'],
   has:'Book 2 Coordination Exercises 3-5: scale games and minor scales over comping rhythms.',
   says:'Comping patterns for minor keys over Cm(maj7) | Cm7 | Dm7b5 | G7alt.'},
  {doc:'7:SP1–SP6', v3:'v3-SP1', app:['7A.912', '7A.913', '7B.908', '7B.909', '7B.910', '7B.911'],
   has:'Siskind’s SP1-SP6: intervallic patterns, triadic and seventh-chord patterns, Scale Games 1 and 2, chromatic lead-ins, octatonic patterns.',
   says:'SP1 ascending 3rds, SP2 descending 3rds, SP3 ascending 4ths, SP4 triads, SP5 four-note groupings, SP6 enclosures.'},
  {doc:'7:7A.914–7B.914', v3:'v3-7A.914', app:['7A.914', '7A.915'],
   has:'7A.914 and 7A.915 are about writing Type A/B voicings and sidesteps.',
   says:'All four are minor-progression analysis worksheets.'},
  {doc:'8:7C.902-7C.905', v3:'v3-7C.902', app:['7C.902', '7C.903', '7C.904', '7C.905'],
   has:'Shout-chorus voicings and Scale Patterns 7-9.',
   says:'The rhythm changes form itself, 32 bars in B♭.'},
  {doc:'9:7D.902-7D.909', v3:'v3-7D.902', app:['7D.902', '7D.903', '7D.904'],
   has:'7D.902-7D.904 are comping variations (second half of the measure, three-four comping, the left-hand shuttle).',
   says:'7D.902-7D.909 are all ballad devices — rubato, pedalling, slow voicings.'},
  {doc:'9:SP10-SP12', v3:'v3-SP10', app:['7D.905', '7D.906', '7D.907'],
   has:'Siskind’s SP10-SP12: bebop scale patterns, hemiolas, non-chord-tone challenges.',
   says:'Digital patterns (1-2-3-5), pentatonic patterns through changes, and enclosures.'},
  {doc:'9:7D.912', v3:'v3-7D.912', app:['7D.912'],
   has:'Transcribing Bud Powell’s "Ornithology".',
   says:'Transcribing a ballad: Bill Evans "My Foolish Heart" or Herbie Hancock "Round Midnight".'},
  {doc:'11:9.901', v3:'v3-9.901', app:['9.901'],
   has:'Pentatonic voicing comping (now on Stage 10, beside the pentatonics).',
   says:'Comping with reharmonisation.'},
  {doc:'12:13.1.1-13.7.2', v3:'v3-13.1.1', app:['13.1.1'],
   has:'13.1-13.7 are Mantooth’s generic and miracle voicings, polychords, Berklee guide tones, 4-way close, hybrids and quartal stacks.',
   says:'"Mantooth’s 7 voicing categories: four-way close, drop-two, drop-three, drop-two-and-four, double lead, spread voicings, clusters."'}
];
const jazzV3ConflictsFor = id => JAZZ_V3_CONFLICTS.filter(c => c.v3 === id || (c.app || []).includes(id));

/* ---------- the room's own additions, where the document asks for them ----------
   Section 4E (the dual-tasking track), Section 4H (Barry Harris's four
   exercises), and the two Voice Track levels the room did not have. The
   document gives these as feature text rather than as numbered entries,
   so they are written here from that text, and say where it came from. */
const JAZZ_V3_EXTRA = {
  /* ---- 4E: Dual-Tasking / Self-Accompaniment ---- */
  'DT.1': {stage:'DT', type:'IMPROV', name:'Level 1 — Sing the root over shells',
    description:'Sing the root of each chord while playing shell voicings on a blues. The voice has one note per chord and the hands have two; the job is to keep both in time without either one waiting for the other.',
    theory:'Section 4E: "Level 1: Sing root while playing shell voicings on a blues." The root is the easiest note to hear and the hardest to sing in tune against a shell that does not contain it — the shell is the third and seventh, so the root you sing is the only root in the room.',
    source:'Section 4E', tool:'record'},
  'DT.2': {stage:'DT', type:'IMPROV', name:'Level 2 — Sing the melody, comp underneath',
    description:'Sing the melody of a simple standard while comping with basic voicings. Start with a tune whose melody moves slowly — half notes and whole notes — so the hands have long chords to hold under it.',
    theory:'Section 4E: "Level 2: Sing melody of a simple standard while comping with basic voicings."',
    source:'Section 4E', tool:'record'},
  'DT.3': {stage:'DT', type:'IMPROV', name:'Level 3 — Scat over your own comping',
    description:'Sing a scat solo while comping with full voicings. The comping has to be automatic enough that the solo can go somewhere the hands did not plan.',
    theory:'Section 4E: "Level 3: Sing scat solo while comping with full voicings." The Voice Track’s scat syllables (V1) and bebop lines (V4) are the vocabulary; this is where they meet the left hand.',
    source:'Section 4E', tool:'record'},
  'DT.4': {stage:'DT', type:'IMPROV', name:'Level 4 — Lyrics, phrasing, and a real accompaniment',
    description:'Sing lyrics with expressive phrasing while playing sophisticated accompaniment. This is the performance: back-phrasing in the voice (Stage 9), rich voicings and fills in the hands.',
    theory:'Section 4E: "Level 4: Sing lyrics with expressive phrasing while playing sophisticated accompaniment."',
    source:'Section 4E', tool:'record'},
  'DT.5': {stage:'DT', type:'LISTEN', name:'Shirley Horn and Diana Krall, as models',
    description:'Study how two singer-pianists divide the work. Shirley Horn separates the vocal and piano phrases in call-and-response: the voice sings, the piano answers in the space. Diana Krall uses a classical technique to support vocals placed behind the beat.',
    theory:'Section 4E: "Shirley Horn / Diana Krall modeling: Study specific performances. Horn’s technique of separating vocal and piano phrases in call-and-response. Krall’s classical technique supporting behind-the-beat vocals." Listen to a whole record of each with only the hands in your attention: where the piano plays while the voice sings, and where it waits.',
    source:'Section 4E', tool:'corea'},
  'DT.6': {stage:'DT', type:'THEORY', name:'The singer-pianist’s devices',
    description:'Four techniques for accompanying yourself: chord pops, contrary-motion inner voices, independent intros and outros, and varying the accompaniment texture from verse to chorus.',
    theory:'Section 4E: "Specific techniques: “Chord pops” (rhythmic stabs in gaps), contrary motion inner voice, independent intros/outros, varying accompaniment texture verse-to-chorus." Chord pops fill the holes the voice leaves. A contrary-motion inner voice moves against the melody so the two lines stay audible as two. An intro and an outro that belong to the piano alone frame the song. And changing the texture between verse and chorus — sparse, then full — gives the arrangement a shape the voice does not have to carry by itself.',
    source:'Section 4E'},

  /* ---- 4H: Barry Harris 6th Diminished Scale Method ---- */
  'BH.1': {stage:'8', type:'NOTATION', name:'Barry Harris — Exercise 1: the scale, up and down',
    description:'Play the C6 diminished scale ascending and descending: C–D–E–F–G–Ab–A–B, the notes of C6 (C–E–G–A) interlocked with the notes of the diminished chord on the passing tones (D–F–Ab–B).',
    theory:'Section 4H: "Exercise 1: Play the C6 diminished scale ascending and descending." Eight notes, so in continuous eighths the notes of C6 fall on the beats and the diminished notes between them.',
    source:'Section 4H', gen:'bhScale'},
  'BH.2': {stage:'8', type:'NOTATION', name:'Barry Harris — Exercise 2: harmonise each note',
    description:'Harmonise every note of the scale. A note from C6 gets a C6 voicing under it; a note from the diminished chord gets a Bdim7 voicing under it. Close position, the scale note on top.',
    theory:'Section 4H: "Exercise 2: Harmonize each note of the scale — notes from C6 get C6 voicing, notes from dim7 get Bdim7 voicing." The alternation, tonic then passing diminished, is the whole of the motion.',
    source:'Section 4H', gen:'bhHarmonised'},
  'BH.3': {stage:'8', type:'NOTATION', name:'Barry Harris — Exercise 3: apply it to a melody',
    description:'Take a simple melody and harmonise every note with the alternating 6th and diminished system. The example is a stepwise phrase; then do the same to the first phrase of a tune you know.',
    theory:'Section 4H: "Exercise 3: Apply to a melody — take a simple melody and harmonize every note using the alternating 6th/dim system."',
    source:'Section 4H', gen:'bhMelody'},
  'BH.4': {stage:'8', type:'NOTATION', name:'Barry Harris — Exercise 4: over Rhythm Changes',
    description:'Use the B♭6 diminished scale over the A section of Rhythm Changes. The scale’s tonic sixth sits on the B♭ chords and its diminished chord fills the passing harmony.',
    theory:'Section 4H: "Exercise 4: Apply to Rhythm Changes — use the Bb6 diminished scale over the A section of Rhythm Changes." Why it works: "Creates continuous forward motion. Every note is harmonized. Eliminates the ‘which scale over which chord’ decision paralysis. Directly connected to Charlie Parker and Bud Powell’s actual practice."',
    source:'Section 4H', gen:'bhRhythmChanges'},

  /* ---- V5 and V6: the levels the document names and does not fill ----
     Section 1 says only that V5-V6 are "advanced vocal jazz techniques
     including ensemble singing, extended vocal techniques, and vocal
     arranging". These are written from that sentence and cite the
     document, not a book, because no book was named for them. */
  'V5.1': {stage:'V5', type:'IMPROV', name:'Singing a part: blend and tuning',
    description:'Sing the third or the seventh of each chord of a ii-V-I while the piano plays the rest, then sing it against a recording of yourself singing the other guide tone. Match the vowel and the vibrato of the other part before you worry about volume.',
    theory:'Ensemble singing asks the opposite of solo singing: the part is not the song, the chord is. Guide tones are the natural first parts — they are what V4 taught you to hear — and singing one against the other is two-part harmony that moves by step.',
    source:'Section 1 (Voice Track V5)', tool:'pwys'},
  'V5.2': {stage:'V5', type:'IMPROV', name:'Trading and call-and-response in a group',
    description:'With another singer or a recording, trade two-bar phrases over a blues: your phrase answers the last one rather than starting a new idea.',
    theory:'The group version of Stage 3’s call-and-response. What you sing is decided by what you just heard, which is audiation working in real time.',
    source:'Section 1 (Voice Track V5)'},
  'V5.3': {stage:'V5', type:'IMPROV', name:'Extended vocal techniques',
    description:'Explore sounds beyond sung pitch — breath, fall-offs, growls, vocal percussion, sung-and-hummed chords — one at a time over a drone, recording each so you can hear what actually came out.',
    theory:'Section 1 names extended vocal techniques as part of V5 and gives no list. These are the ones common to jazz singing; take them slowly and stop at any strain.',
    source:'Section 1 (Voice Track V5)', tool:'drone'},
  'V5.4': {stage:'V5', type:'LISTEN', name:'Listening to vocal groups',
    description:'Listen to vocal jazz ensembles with one question: who has the melody, and what are the other voices doing under it?',
    theory:'The ensemble counterpart of the Stage 6 transcription work — the parts are easier to hear than they look.',
    source:'Section 1 (Voice Track V5)', tool:'corea'},
  'V6.1': {stage:'V6', type:'WORKSHEET', name:'Voicing a melody for voices',
    description:'Take the first eight bars of a standard and write the melody with the guide tones under it for two voices, then add the root for three. Sing each part through against the piano.',
    theory:'Vocal arranging starts where piano voicing starts — guide tones under the melody — with one extra rule: every part has to be singable as a line.',
    source:'Section 1 (Voice Track V6)'},
  'V6.2': {stage:'V6', type:'WORKSHEET', name:'Four-part close harmony',
    description:'Re-voice the same eight bars in four-part close position (Stage 12’s four-way close), then as drop-two, and sing or play each to hear the difference in weight.',
    theory:'The Stage 12 voicing systems, written for singers instead of fingers. Drop-two opens the texture exactly as it does at the keyboard.',
    source:'Section 1 (Voice Track V6)'},
  'V6.3': {stage:'V6', type:'WORKSHEET', name:'An arrangement with an intro and an ending',
    description:'Write a complete short arrangement: an introduction, the head for voices, a solo section, and an ending — using the introductions and tags from Stage 8.',
    theory:'A finished arrangement rather than a harmonised melody. The intro and ending are where an arranger’s choices are most audible.',
    source:'Section 1 (Voice Track V6)'},
  'V6.4': {stage:'V6', type:'IMPROV', name:'Record every part yourself',
    description:'Record each part of your arrangement one at a time over the same click, then play them back together and fix what does not tune.',
    theory:'Multi-tracking your own arrangement is the fastest honest test of it: every part a singer would struggle with, you will struggle with first.',
    source:'Section 1 (Voice Track V6)', tool:'record'}
};

/* ---------- resolving the layout ----------
   Built once, on first use, like the catalogue itself. */
let _jazzV3 = null;
const jazzV3DocItem = key => (JAZZ_V3_DOC.items || []).find(i => i.key === key) || null;
/* the first id a document label names: "7C.902-7C.905" → "7C.902" */
const jazzV3FirstId = label => String(label || '').split(/\s*[–-]\s*(?=[A-Z0-9])/)[0];
function jazzV3Slug(s){
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
/* the id a new document entry takes */
const jazzV3Ranged = label => /[\u2013-]/.test(String(label || ''));
function jazzV3NewId(item, taken){
  const label = item.label || '';
  if(!label) return 'v3-' + jazzV3Slug(item.name);
  const first = jazzV3FirstId(label);
  if(!jazzV3Ranged(label) && !taken(first)) return first;
  return 'v3-' + first;
}
/* Built from the flat catalogue jazzBook() is assembling, which is passed
   in because it is not in _jazzBook yet while this runs. */
function jazzV3(book){
  if(_jazzV3) return _jazzV3;
  const have = book || _jazzBook || {};
  const taken = id => !!have[id] || !!JAZZ_V3_EXTRA[id];
  const stageOf = {}, docOf = {}, lineOf = {}, order = {};
  JAZZ_V3_ORDER.forEach(sid => {
    order[sid] = [];
    (JAZZ_V3_LAYOUT[sid] || []).forEach(line => {
      if(typeof line === 'string'){ order[sid].push(line); stageOf[line] = sid; return; }
      const item = jazzV3DocItem(line.doc);
      if(!item){ console.warn('v3: no document entry', line.doc); return; }
      const id = line.onto || line.id || jazzV3NewId(item, taken);
      order[sid].push(id);
      stageOf[id] = sid;
      docOf[id] = item;
      lineOf[id] = Object.assign({}, line, {id, isNew: !line.onto});
    });
  });
  _jazzV3 = {stageOf, docOf, lineOf, order};
  return _jazzV3;
}
/* the stage an exercise sits on in v3, or null when the layout does not
   place it (which the smoke test treats as a fault) */
const jazzV3StageOf = id => jazzV3().stageOf[id] || null;

/* ---------- the stage records the ladder draws ---------- */
function jazzV3Stage(sid){
  const meta = JAZZ_V3_STAGE_META[sid] || {};
  const ov = (JAZZ_V3_DOC.overview || {})[String(meta.n)] || null;
  const old = meta.lead && typeof JAZZ_STAGE_NOTES === 'object' ? (JAZZ_STAGE_NOTES[meta.lead] || {}) : {};
  const paras = ov ? ov.paras.slice() : [];
  const src = paras.length && /^Sources:/.test(paras[paras.length - 1]) ? paras.pop() : '';
  const row = (JAZZ_V3_DOC.outcomes || []).find(r => r[0] === String(meta.n));
  const intro = (JAZZ_V3_DOC.stageIntro || {})[String(meta.n)] || '';
  const voiceOv = (JAZZ_V3_DOC.overview || {}).V;
  return {
    n: meta.n,
    name: meta.title || (ov && ov.title) || old.name || String(sid),
    subtitle: meta.subtitle || (ov && ov.subtitle) || (meta.track === 'voice'
      ? `Voice Track \u00b7 beside Stage ${(meta.beside || []).join('\u2013')}` : ''),
    needs: meta.needs,
    track: meta.track || null,
    blurb: meta.blurb || old.blurb || '',
    /* the document's prose, then the stage-opening paragraph Section 2
       gives some stages */
    theory: paras.join('\n\n') || (meta.track === 'voice' && voiceOv ? voiceOv.paras.join('\n\n') : '') || old.theory || '',
    intro,
    sources: src.replace(/^Sources:\s*/, ''),
    werner: meta.werner || old.werner || '',
    mindset: meta.mindset || old.mindset || '',
    goldenTip: meta.goldenTip || null,
    outcome: row ? {after: row[2], milestone: row[3], time: row[4]} : null,
    audiation: jazzV3AudiationFor(sid),
    beside: meta.beside || null,
    /* what the old rungs this stage absorbed had to say, kept rather than
       thrown away when the document's prose took their place */
    carried: (meta.from || []).map(o => {
      const x = typeof JAZZ_STAGE_NOTES === 'object' ? JAZZ_STAGE_NOTES[o] : null;
      return x ? {old: o, name: x.name, theory: x.theory} : null;
    }).filter(Boolean)
  };
}

/* ---------- the migration ----------
   Stage records were kept under the old rung ids. Several old rungs are
   one v3 stage now, so their records merge: an active one wins over a
   finished one, which wins over one never started; the earliest start is
   kept; the pace of whichever won is kept. Sessions are relabelled, and
   so are the collapsed/expanded flags. Runs once and says it ran. */
function jazzV3Migrate(j){
  if(!j || j.curriculum === 3) return false;
  const rank = {active: 3, completed: 2, not_started: 1};
  const map = k => JAZZ_V3_FROM_OLD[String(k)] || String(k);
  if(j.stages && typeof j.stages === 'object'){
    const out = {};
    Object.keys(j.stages).forEach(old => {
      const r = j.stages[old]; if(!r || typeof r !== 'object') return;
      const to = map(old);
      const cur = out[to];
      if(!cur){ out[to] = Object.assign({}, r, {migratedFrom: [old]}); return; }
      const win = (rank[r.status] || 0) > (rank[cur.status] || 0) ? r : cur;
      const merged = Object.assign({}, win);
      merged.startDate = [cur.startDate, r.startDate].filter(Boolean).sort()[0] || null;
      merged.completedDate = merged.status === 'completed'
        ? [cur.completedDate, r.completedDate].filter(Boolean).sort().pop() || null : null;
      merged.migratedFrom = (cur.migratedFrom || []).concat(old);
      out[to] = merged;
    });
    j.stages = out;
  }
  (Array.isArray(j.sessions) ? j.sessions : []).forEach(s => {
    if(s && s.stageId != null){ s.oldStageId = s.stageId; s.stageId = map(s.stageId); } });
  if(j.session && j.session.stageId != null) j.session.stageId = map(j.session.stageId);
  const st = j.settings || {};
  if(st.collapsed && typeof st.collapsed === 'object'){
    const c = {};
    Object.keys(st.collapsed).forEach(k => { if(st.collapsed[k]) c[map(k)] = true; });
    st.collapsed = c;
  }
  j.curriculum = 3;
  return true;
}

/* ---------- what kind of thing each exercise is ----------
   The document tags every entry: [NOTATION] needs a score, [THEORY] is
   text to read, [DRILL] is a flashcard or timed pattern, [IMPROV] is open
   improvising, [LISTEN] is listening or transcribing, [WORKSHEET] is
   written. The room's own exercises that the document does not describe
   get the tag their nature gives them. */
const JAZZ_V3_TYPES = {
  NOTATION: {icon:'\u{1f3bc}', said:'Requires sheet music / MusicXML score'},
  THEORY:   {icon:'\u{1f4d6}', said:'Explanation text displayed in the app'},
  DRILL:    {icon:'⏱️', said:'Flashcard or timed pattern exercise'},
  IMPROV:   {icon:'\u{1f3b9}', said:'Open improvisation exercise'},
  LISTEN:   {icon:'\u{1f3a7}', said:'Guided listening or transcription assignment'},
  WORKSHEET:{icon:'✏️', said:'Written analysis exercise'}
};
const JAZZ_V3_MATERIAL_TYPE = {coord:'DRILL', swing:'DRILL', comping:'DRILL', scale:'DRILL',
  melody:'DRILL', written:'WORKSHEET', transcribe:'LISTEN', tuneapp:'THEORY', bossa:'DRILL',
  intros:'DRILL', memory:'THEORY', selfana:'LISTEN'};
function jazzV3TypeOf(ex){
  if(!ex) return 'DRILL';
  if(ex.v3 && ex.v3.type) return ex.v3.type;
  const mat = typeof siskindMaterial === 'function' ? siskindMaterial(ex.id) : null;
  if(mat && JAZZ_V3_MATERIAL_TYPE[mat.kind]) return JAZZ_V3_MATERIAL_TYPE[mat.kind];
  if(/^IMP-/.test(ex.id) || ex.generatorType === 'improv') return 'IMPROV';
  if(ex.generatorType === 'rhythm') return 'DRILL';
  if(ex.gen && ex.generatorType !== 'instruction_only') return 'NOTATION';
  return 'DRILL';
}

/* ---------- where to look it up ----------
   The document names a source for many entries — "From Levine Ch. 3",
   "From Berklee Ch. 1", "From Siskind Book 3 Unit 6" — and for the rest
   the stage's own "Sources:" line applies. No page numbers are given, so
   none are invented. */
const JAZZ_V3_BOOKWORD = [
  [/Levine/, 'Levine'], [/Berklee/, 'Berklee Harmony'], [/Mantooth/, 'Mantooth'],
  [/Dobbins/, 'Dobbins'], [/Siskind Book (\d)/, m => 'Siskind Book ' + m[1]],
  [/Gemini/, 'Gemini Research'], [/Barry Harris/, 'Barry Harris']];
function jazzV3Ref(item, stage){
  const text = `${item.description || ''} ${item.theory || ''}`;
  const from = /From ((?:Levine|Berklee|Mantooth|Dobbins|Siskind Book \d|Gemini research)[^.;:]*?(?:Ch\.\s*[\d–/-]+(?:\s*[–-]\s*\d+)?|Unit \d+(?:\s*and Levine Ch\.\s*\d+)?|Appendix [A-Z](?:\/[A-Z])?|research)?)(?=[.;:,\s])/.exec(text);
  let book = 'Curriculum v3', chapter = `Stage ${stage === 'P0' ? '0' : stage}, Section 2`;
  let desc = 'The entry as the Master Build Document writes it; the document gives no page reference.';
  if(from){
    for(const [re, key] of JAZZ_V3_BOOKWORD){
      const m = re.exec(from[1]);
      if(m){ book = typeof key === 'function' ? key(m) : key; break; }
    }
    const ch = /(Ch\.\s*[\d–/-]+(?:\s*[–-]\s*\d+)?|Unit \d+|Appendix [A-Z](?:\/[A-Z])?)/.exec(from[1]);
    chapter = ch ? ch[1].replace(/\s+/g, ' ') : '—';
    desc = `The Curriculum v3 document cites this as "From ${from[1].trim()}". No page is given.`;
  }
  return {book, bookFull: (typeof JAZZ_BOOKS === 'object' && JAZZ_BOOKS[book]) || book,
    chapter, pageNumbers:'—', description: desc};
}

/* ---------- applying it to the catalogue ----------
   Called by jazzBook() on the flat table before the enrichment layer. */
function jazzV3Words(item, line){
  return {key: item.key, label: item.label || '', type: item.type, name: item.name,
    description: item.description || '', score: item.score || '', theory: item.theory || '',
    youtube: (item.youtube || []).slice(), hasXml: !!item.xml,
    merged: !!(line && line.onto), tool: (line && line.tool) || null,
    analysis: (line && line.analysis) || null};
}
function jazzV3NewExercise(id, item, line, sid){
  const type = item.type;
  const ex = {id, stage: sid, name: item.name, gen: null, args: ['key'], kind: 'v3',
    why: '', tip: '', theory: item.theory || '', doubt: '',
    source: `Curriculum v3 — Stage ${sid === 'P0' ? '0' : sid}${item.label ? ', ' + item.label : ''}`,
    ask: `Play ${item.name} \u2014 in`,
    acc: 'verified', multiExample: false, generatorType: 'v3', isV3: true,
    v3: jazzV3Words(item, line), type,
    ref: (typeof jazzReference === 'function' && jazzReference(id)) || jazzV3Ref(item, sid),
    /* a page to read or a record to hear is one thing to do, not twelve */
    single: type === 'THEORY' || type === 'LISTEN'};
  if(line.gen){ ex.v3gen = line.gen; ex.v3args = line.args || []; ex.acc = 'from_description'; }
  else if(item.xml){ ex.xml = item.xml; ex.home = JAZZ_V3_HOME[item.key] || 'C'; ex.acc = 'doc_example'; }
  if(line.gen && typeof JAZZ_V3_BUILD === 'object' && (JAZZ_V3_BUILD[line.gen] || {}).multi) ex.v3multi = true;
  if(line.gen && item.xml){
    /* a builder that completes a truncated example keeps the example too */
    ex.v3tab = {xml: true, title: 'The document’s own example'};
    ex.xmlSample = item.xml; ex.home = JAZZ_V3_HOME[item.key] || 'C';
    ex.v3multi = true;
  }
  if(line.tool) ex.tool = line.tool;
  if(line.analysis) ex.analysis = line.analysis;
  return ex;
}
function jazzV3ExtraExercise(id, x){
  const ex = {id, stage: x.stage, name: x.name, gen: null, args: ['key'], kind: 'v3',
    why: '', tip: '', theory: x.theory || '', doubt: '', source: `Curriculum v3 — ${x.source}`,
    ask: `Play ${x.name} \u2014 in`, acc: 'verified', multiExample: false, generatorType: 'v3',
    isV3: true, type: x.type,
    v3: {key: null, label: '', type: x.type, name: x.name, description: x.description || '',
      score: '', theory: x.theory || '', youtube: [], hasXml: false, merged: false,
      tool: x.tool || null, analysis: null, extra: true},
    ref: {book: 'Curriculum v3', bookFull: (typeof JAZZ_BOOKS === 'object' && JAZZ_BOOKS['Curriculum v3']) || 'Curriculum v3',
      chapter: x.source, pageNumbers: '—',
      description: 'Written from the document’s feature text, which gives no page reference.'},
    single: x.type === 'THEORY' || x.type === 'LISTEN'};
  if(x.gen){ ex.v3gen = x.gen; ex.v3args = x.args || []; ex.acc = 'from_description'; }
  if(x.tool) ex.tool = x.tool;
  return ex;
}
function jazzV3Apply(out){
  const v = jazzV3(out);
  Object.keys(v.stageOf).forEach(id => {
    const sid = v.stageOf[id], line = v.lineOf[id] || null, item = v.docOf[id] || null;
    if(out[id]){
      const ex = out[id];
      ex.oldStage = ex.stage;
      ex.stage = sid;
      if(item){
        ex.v3 = jazzV3Words(item, line);
        if(line.tool) ex.tool = line.tool;
        if(line.analysis) ex.analysis = line.analysis;
        const draws = ex.gen && ex.generatorType !== 'instruction_only';
        /* an exercise with nothing to draw takes the document's notation */
        if(!draws && line.gen){ ex.v3gen = line.gen; ex.v3args = line.args || []; ex.acc = 'from_description'; }
        else if(!draws && item.xml){ ex.xml = item.xml; ex.home = JAZZ_V3_HOME[item.key] || 'C'; ex.acc = 'doc_example'; }
        /* and one that draws gets the document's beside it, when asked */
        if(draws && line.tab) ex.v3tab = Object.assign({}, line.tab,
          line.tab.xml ? {home: JAZZ_V3_HOME[item.key] || 'C'} : {});
        if(draws && line.tab && line.tab.xml) ex.xmlSample = item.xml;
      }
      ex.type = jazzV3TypeOf(ex);
      return;
    }
    if(line && line.isNew && item) out[id] = jazzV3NewExercise(id, item, line, sid);
    else if(JAZZ_V3_EXTRA[id]) out[id] = jazzV3ExtraExercise(id, JAZZ_V3_EXTRA[id]);
  });
  /* anything the layout did not name keeps its old stage and is reported:
     every exercise the room has should be somewhere on the v3 ladder */
  const lost = Object.keys(out).filter(id => !v.stageOf[id]);
  if(lost.length) console.warn('v3: exercises the layout does not place', lost);
  Object.keys(out).forEach(id => { if(!out[id].type) out[id].type = jazzV3TypeOf(out[id]); });
  return out;
}
