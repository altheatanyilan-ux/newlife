/* ============================================================
   THE UNIT ASSIGNMENT MATERIAL, ON THE LADDER.

   Section 3 of the specification is a stage integration map, and
   this is it. Every item in the twelve categories — each
   coordination drill, each named comping pattern, each scale
   pattern, worksheet, transcription project — becomes a substage
   of the stage its book and unit belong to, and appears in the
   roadmap beside the exercises that were already there.

   It is deliberately NOT a second room. A student at stage 5 who
   opens stage 5 should find the bossa nova styles and the melody
   personalisation techniques sitting with the blues voicings,
   because that is the week they belong to. Material kept in a
   library of its own is material nobody opens.

   Since Curriculum v3 the stage each one sits on is the v3
   layout's decision (19-jazz-o-v3.js): Book 1 across stages 1-4,
   Book 2 across 6-9, Book 3 on 10 and 12. The ids were minted
   under the old rungs (1-6, 7A-7D, 8-12) and keep those names.
   ============================================================ */

/* ---------- Section 3: the master integration table ----------
   Which book and unit a rung was minted under. Since Curriculum v3
   this is ONLY the namespace a material's id is drawn from — "7A.903"
   is still 7A.903, because everything practised is kept under that id
   — and where the rung actually sits is decided by the v3 layout in
   19-jazz-o-v3.js. */
const SISKIND_UNIT_STAGE = {
  1: {1:'1', 2:'1', 3:'2', 4:'2', 5:'3', 6:'3', 7:'4', 8:'4', 9:'5', 10:'5', 11:'6', 12:'6'},
  2: {1:'7A', 2:'7A', 3:'7B', 4:'7B', 5:'7B', 6:'7B', 7:'7C', 8:'7C', 9:'7C',
      10:'7D', 11:'7D', 12:'7D'},
  3: {1:'8', 2:'8', 3:'8', 4:'8', 5:'9', 6:'10', 7:'10', 8:'10', 9:'9',
      10:'11', 11:'12', 12:'12'}
};
function siskindStageFor(book, unit){
  const b = SISKIND_UNIT_STAGE[book];
  return (b && b[unit]) || String(unit || '1');
}

/* The stage-by-stage description the specification gives: what
   unlocks, what it assumes you already have, what it sits beside,
   and why it arrives where it does. Shown on the stage itself. */
const SISKIND_STAGE_BANDS = [
  {stages:['1','2'], name:'Fundamentals', books:'Book 1, Units 1-4',
   unlocks:['Coordination Exercises 1-4','Swing feel and articulation','Charleston and Reverse Charleston','Written practice: ii-V-I voicings and modes'],
   prerequisites:'None. These assume you can read both clefs and recognise a chord symbol, and nothing else.',
   complement:'The stage already teaches chord construction and the two-five-one. The coordination exercises give the left hand a rhythmic job from the first week, and the swing articulation work fixes the feel before the melodic material gets complicated enough to hide it.',
   progression:'Coordination 1 comes before Coordination 2 so that whole-note voicings are secure before the Charleston adds a rhythm to them. The swing exercises run in parallel throughout rather than being finished and put away.'},

  {stages:['2','3'], name:'Tune mastery and the blues', books:'Book 1, Units 5-8',
   unlocks:['Melody personalisation: ghost notes, turns, double notes','Comping variations: lead-ins, push-offs, long-short','Blues form written practice'],
   prerequisites:'Coordination Exercises 1-4, the ii-V-I written practice, and familiarity with Type A voicings.',
   complement:'Type A/B voicings and the blues form are already here. The melody personalisation techniques are what turn a correctly played melody into a performance, and the comping variations stop the left hand repeating one rhythm for a whole chorus.',
   progression:'Personalisation arrives now because there is finally enough harmonic and rhythmic vocabulary for an interpretive choice to mean something. Earlier it would just be decoration.'},

  {stages:['3','4'], name:'Voicings, bossa nova and the first tunes', books:'Book 1, Units 9-12',
   unlocks:['Coordination Exercises 5-6','Bossa nova comping, three styles','Vibrato imitation','One-handed voicings with comping rhythms'],
   prerequisites:'Coordination Exercises 1-4, the swing feel exercises, and the melody personalisation techniques.',
   complement:'Altered dominants and one-handed voicings are already at this stage. Bossa nova adds a contrasting rhythmic feel and broadens the stylistic range; the constant-bassline coordination work is what makes solo and duo playing possible.',
   progression:'Bossa nova sits here because the left hand is now independent enough for syncopated Latin patterns. Its eighth notes are straight, not swung, which is the whole difficulty.'},

  {stages:['6'], name:'Advanced comping and transcription', books:'Book 2, Units 1-2',
   unlocks:['Book 2 Coordination Exercises 1-2','Red Garland rhythm','Locked and semi-locked hands','Scale Patterns 1-2','Transcription Projects 1-2 (COREA)','Sidestep, tonicization, leave-out'],
   prerequisites:'All six Book 1 coordination exercises, all the Book 1 comping patterns, the melody personalisation techniques, and Type A/B voicings.',
   complement:'This is where the listening library stops being passive. The COREA process turns a record into a method, and the scale patterns give the right hand structured material for the first time.',
   progression:'A pivotal transition: from pre-defined coordination drills to open-ended pattern work, and from listening to transcribing. The first two transcription projects use deliberately simpler recordings to build confidence with the method.'},

  {stages:['7'], name:'Minor keys and the eleven steps', books:'Book 2, Units 3-6',
   unlocks:['Book 2 Coordination Exercises 3-5','Scale Patterns 3-6','The full 11-step tune mastery workflow','Free comping','The four types of musical memory, and transposition'],
   prerequisites:'The stage 6 material (Book 2, Units 1-2), Scale Patterns 1-2, and at least one completed transcription project.',
   complement:'Minor ii-V-i voicings and guidetone lines belong here. The new scale patterns give the right hand melodic material specific to minor keys, and the memorisation tools help retain a repertoire that is now growing faster than repetition alone can hold.',
   progression:'The eleven-step workflow activates fully here because there is finally enough vocabulary for all eleven steps to mean something. Free comping marks the move from pattern-based playing to intuitive playing.'},

  {stages:['8'], name:'Rhythm changes, introductions and endings', books:'Book 2, Units 7-9',
   unlocks:['Scale Patterns 7-9','Three introductions, three stock endings, three tags','Freddie Green comping and shout-chorus voicings','Transcription Projects 3-5'],
   prerequisites:'The stage 7 material (Book 2, Units 3-6), the 11-step workflow, and proficiency in free comping.',
   complement:'Closed-position voicings and rhythm changes are the harmonic content here. The introductions and endings give you the ability to perform a complete, finished rendition rather than a chorus that starts and stops arbitrarily.',
   progression:'Endings are practised in all twelve keys before they are needed, because the bandstand is the wrong place to work out how to stop.'},

  {stages:['9'], name:'Drop-two, ballads and self-assessment', books:'Book 2, Units 10-12',
   unlocks:['Book 2 Coordination Exercise 6 (walking bass)','Scale Patterns 10-12','Back-phrasing, bell tones, interlocking fifths and sixths','Left-hand shuttle','Self-Transcription Analysis, the 17-question diagnostic'],
   prerequisites:'The stage 8 material (Book 2, Units 7-9), at least two completed transcription projects, and the introductions and endings.',
   complement:'Drop-two voicings and walking bass are the technical content. The self-transcription analysis is the feedback loop: it feeds directly back into what the practice plan suggests next.',
   progression:'The diagnostic is placed last because it requires enough experience to evaluate your own playing meaningfully. Its seventeen questions assume awareness of rhythmic variety, chord-tone usage and phrase construction, all of which were built earlier.'},

  {stages:['10','11','12'], name:'Modal jazz', books:'Book 3, Units 1-12',
   unlocks:['All 12 Modal Patterns','Modal voicing comping, quartal and So What voicings','Pentatonic voicings','Planing and sidestepping in a modal context','Modal interchange','Odd meter comping','Free playing','Transcription Projects 7-12'],
   prerequisites:'All of the Book 2 material, including the six coordination exercises, the scale patterns, the transcription projects and the self-transcription workflow.',
   complement:'Modal scales and advanced improvisation already form the core of these stages. The new material provides the structured practice vehicles: twelve methodical modal patterns, the voicing exercises that teach modal harmonic language, and planing.',
   progression:'Book 3 departs from functional harmony. Instead of ii-V-I patterns, the work is pentatonic scales, quartal voicings and open structures. Free playing is the last thing because it requires everything before it.'}
];
function siskindBandFor(stageId){
  return SISKIND_STAGE_BANDS.find(b => b.stages.includes(String(stageId))) || null;
}
/* A v3 stage can take in two of the Siskind bands (stage 2 is Book 1
   Units 3-6, which straddles the first two), so the stage shows each. */
const siskindBandsFor = stageId => SISKIND_STAGE_BANDS.filter(b => b.stages.includes(String(stageId)));

/* The long threads: categories that run across many stages and
   change character as they go. */
const SISKIND_THREADS = [
  {name:'Coordination Exercises', span:'Stages 1 – 9',
   gist:'The longest-running thread. Simple scales over whole-note voicings at stage 1; modes and arpeggios with two-beat rhythms by stage 2; melodic embellishment and mixed comping at 3-5; Book 2 material with advanced scale patterns and complex comping rhythms from stage 6; rhythmic displacement and walking bass by stage 9.'},
  {name:'Comping Patterns', span:'Stages 1 – 12',
   gist:'At every stage. The Charleston at stage 1; variations and two-measure patterns through 2-4; the Red Garland rhythm, locked hands and free comping at stage 6; modal comping with quartal voicings at stage 10.'},
  {name:'Scale Patterns', span:'Stages 7 – 12',
   gist:'Begins with intervallic and triadic patterns at stage 7, expands to twelve distinct types by stage 9, then the twelve modal patterns of Book 3 bring pentatonic, planing and augmented-scale material.'},
  {name:'Transcription Projects', span:'Stages 6 – 12',
   gist:'Two introductory COREA projects at stage 6, more across stages 6-9 with increasingly complex recordings, then the modal projects at stage 10. The self-transcription analysis, at stage 6 beside the COREA process, is the feedback loop that informs all of it.'},
  {name:'Written Practice', span:'Stages 2 – 12',
   gist:'ii-V-I voicing worksheets at stage 2, minor-progression worksheets at stage 7, blues and rhythm-changes worksheets at stage 8, and modal voicing worksheets at stage 10. Away from the keyboard at every level.'},
  {name:'Tune Application Workflow', span:'Stages 6 – 12',
   gist:'Arrives with memorising tunes at stage 6, as the full eleven steps. From there it is the central organising structure for learning any new tune.'}
];

/* ---------- building the rungs ----------
   Each material becomes an exercise record in the shape the
   catalogue reader expects. The id follows the stage's own
   numbering so the roadmap sorts it after the core exercises of
   that stage rather than before them. */

/* The short key and the full title, matching the reference table's own
   convention — a citation is built from both, and the short one has its
   " Book N" stripped off, so it has to be there. */
const siskindSrc = b => 'Jeremy Siskind \u2014 ' + (SISKIND_BOOK_TITLE[b] || 'Jazz Piano Fundamentals');
const SISKIND_BOOK_KEY = {1:'Siskind Book 1', 2:'Siskind Book 2', 3:'Siskind Book 3'};
const SISKIND_BOOK_TITLE = {
  1:'Jazz Piano Fundamentals, Book 1',
  2:'Jazz Piano Fundamentals, Book 2',
  3:'Jazz Piano Fundamentals, Book 3'
};

let _siskindCatalog = null, _siskindIndex = null;

/* The rich record behind a rung, for the exercise page to draw. */
function siskindMaterial(ladderId){
  if(!_siskindIndex) siskindMaterialCatalog();
  return _siskindIndex[ladderId] || null;
}
/* Every rung this file contributes, for the plan engine. */
function siskindMaterialsForStage(stageId){
  if(!_siskindIndex) siskindMaterialCatalog();
  /* by the stage the rung sits on in the v3 layout; the stage it was minted
     under is only its id's namespace now */
  const on = id => (typeof jazzV3StageOf === 'function' && jazzV3StageOf(id)) || _siskindIndex[id].stageId;
  return Object.keys(_siskindIndex)
    .filter(id => String(on(id)) === String(stageId))
    .map(id => Object.assign({ladderId:id}, _siskindIndex[id]));
}
/* Find the rung a catalog row ended up on, so cross-references
   between materials can be turned into links. */
function siskindLadderIdFor(matId){
  if(!_siskindIndex) siskindMaterialCatalog();
  for(const id of Object.keys(_siskindIndex))
    if(_siskindIndex[id].row && String(_siskindIndex[id].row.id) === String(matId)) return id;
  return null;
}

function siskindMaterialCatalog(){
  if(_siskindCatalog) return _siskindCatalog;
  const cat = {}, index = {}, seq = {};
  /* the next free rung number for a stage */
  const nextId = stage => {
    seq[stage] = (seq[stage] || 900) + 1;
    return `${stage}.${seq[stage]}`;
  };
  const add = (stage, kind, row, rec) => {
    const id = nextId(stage);
    cat[id] = Object.assign({stage: String(stage), generatorType:'instruction_only',
      noteAccuracy:'verified'}, rec);
    index[id] = {kind, row, stageId:String(stage), name:rec.name};
    return id;
  };
  /* The page range is written the way the rest of the reference table writes
     it — "p.12", or "pp.39–40", or an em dash where the page is not known.
     A source line like "Book 1 p.12" carries the book twice and does not
     match that shape, so only the page part of it is kept. */
  const pageOnly = s => {
    const m = /(pp?\.\s*\d+(?:\s*[–-]\s*\d+)?)/.exec(String(s || ''));
    return m ? m[1].replace(/\s+/g, '').replace('-', '–') : '—';
  };
  const ref = (book, unit, pages, description) => ({
    book: SISKIND_BOOK_KEY[book] || 'Siskind Book 1',
    bookFull: SISKIND_BOOK_TITLE[book] || 'Jazz Piano Fundamentals',
    chapter: `Unit ${unit}`, pageNumbers: pageOnly(pages), description: description || ''
  });

  /* ---- 1. Coordination exercises ---- */
  for(const e of COORD_EXERCISES){
    add(siskindStageFor(e.book, e.unit), 'coord', e, {
      name: `${e.name} — ${e.scaleType} over ${e.compingPattern}`,
      whyItMatters:'Two hands doing different things is the whole technical problem of jazz piano. Everything else is vocabulary; this is the machinery that lets you use it.',
      memorizationTips:`Right hand: ${e.rhDescription}\n\nLeft hand: ${e.lhDescription}`,
      theoryNotes: e.description,
      source: e.sourcePageRef,
      flashcardPrompt: `Play ${e.name} in {key} — ${e.scaleType} in the right hand over ${e.compingPattern} in the left.`,
      sourceReference: ref(e.book, e.unit, e.sourcePageRef,
        'The exercise as printed, with both hands on the grand staff.')
    });
  }

  /* ---- 2. Swing feel and articulation ---- */
  for(const e of SWING_EXERCISES){
    add(siskindStageFor(e.book, e.unit), 'swing', e, {
      name: e.name,
      whyItMatters:'Swing is not a rhythm you apply afterwards. It is where the notes are and how long they last, and a line played without it is a different line.',
      memorizationTips: e.howTo,
      theoryNotes: e.description + (e.syllables && e.syllables.length
        ? `\n\nSyllables: ${e.syllables.join(', ')}` : ''),
      source: e.sourcePageRef,
      flashcardPrompt: `${e.name} — say the syllables out loud while you play it.`,
      sourceReference: ref(e.book, e.unit, e.sourcePageRef,
        'The articulation as the book marks it.')
    });
  }

  /* ---- 3. Comping patterns ---- */
  for(const e of COMPING_PATTERNS){
    add(siskindStageFor(e.book, e.unitIntroduced), 'comping', e, {
      name: `${e.name} — ${e.type}`,
      whyItMatters:'A named pattern is a rhythm you can call for. Without the names you have one comping rhythm and you play it until the tune ends.',
      memorizationTips: e.notes,
      theoryNotes: `${e.description}\n\nRhythm: ${e.rhythm}`,
      source: `${siskindSrc(e.book)}, Unit ${e.unitIntroduced}`,
      flashcardPrompt: `Comp ${e.name} through a chorus — ${e.rhythm}`,
      sourceReference: ref(e.book, e.unitIntroduced, '—',
        'The rhythm as notated, and the tunes the book suggests for it.')
    });
  }

  /* ---- 4. Scale patterns ---- */
  for(const e of SCALE_PATTERNS){
    add(siskindStageFor(e.book, e.unit), 'scale', e, {
      name: `${e.id} — ${e.name}`,
      whyItMatters:'These are the right hand’s vocabulary. An improviser without patterns plays scales up and down, and everybody can hear it.',
      memorizationTips:`${e.intervals}\n\nTempo: start around ${e.tempoRange.min} bpm and work toward ${e.tempoRange.max}. Raise it only when the pattern is clean at the tempo you are on.`,
      theoryNotes: e.description,
      source: `${siskindSrc(e.book)}, Unit ${e.unit}`,
      flashcardPrompt: `Play ${e.name} in {key}.`,
      sourceReference: ref(e.book, e.unit, '—',
        'The pattern written out, with the variations the book gives.')
    });
  }

  /* ---- 5. Melody personalisation ---- */
  for(const e of MELODY_TECHNIQUES){
    add(siskindStageFor(e.book, e.unitIntroduced), 'melody', e, {
      name: `${e.name} — melody personalisation`,
      whyItMatters:'A melody played exactly as written is a melody nobody asked you to play. These are the tools that make it yours without making it unrecognisable.',
      memorizationTips: e.howToPerform,
      theoryNotes: e.description,
      source: `${siskindSrc(e.book)}, Unit ${e.unitIntroduced}`,
      flashcardPrompt: `Apply ${e.name} to eight bars of a tune you know.`,
      sourceReference: ref(e.book, e.unitIntroduced, '—',
        'The technique demonstrated on a written melody.')
    });
  }

  /* ---- 6. Written practice ---- */
  for(const e of WRITTEN_PRACTICE){
    add(siskindStageFor(e.book, e.unit), 'written', e, {
      name: `${e.title} — worksheet`,
      whyItMatters:'Writing a voicing out is slower than playing it, which is the point. What the hand can fake at tempo, the pencil cannot.',
      memorizationTips: `Keys required: ${(e.keysRequired || []).join(', ')}.${
        e.answersAvailable ? ' An answer key exists — do not look at it until you have finished.'
        : ' There is no answer key for this one.'}`,
      theoryNotes: e.instructions,
      source: `${siskindSrc(e.book)}, Unit ${e.unit}`,
      flashcardPrompt: `Complete the worksheet: ${e.title}`,
      sourceReference: ref(e.book, e.unit, '—', 'The worksheet, and its answer key where there is one.')
    });
  }

  /* ---- 7. Transcription projects ---- */
  for(const e of TRANSCRIPTION_PROJECTS){
    add(siskindStageFor(e.book, e.unit), 'transcribe', e, {
      name: `${e.artist} — “${e.tuneName}”`,
      whyItMatters:'Every jazz musician before you learned this way. The COREA process is what stops a transcription being a party trick and makes it a method.',
      memorizationTips:`Listen ${e.listenCount}+ times${e.playAlongCount ? `, play along ${e.playAlongCount}+ times` : ''}. Focus: ${(e.focusAreas || []).join(', ')}.`,
      theoryNotes: COREA_STEPS.map(s => `${s.label}: ${e.coreaSteps[s.key]}`).join('\n\n'),
      source: `${siskindSrc(e.book)}, Unit ${e.unit}${e.album ? ' — ' + e.album : ''}`,
      flashcardPrompt: `Which COREA step are you on for “${e.tuneName}”, and what does it ask?`,
      sourceReference: ref(e.book, e.unit, '—',
        `The project as the book sets it, on ${e.album || 'the recording named'}.`)
    });
  }

  /* ---- 8. The eleven-step tune mastery workflow ---- */
  add(siskindStageFor(2, 6), 'tuneapp', {id:'TUNEAPP', steps:TUNE_APP_STEPS,
    suggestions:TUNE_APP_SUGGESTIONS}, {
    name:'The eleven-step tune mastery process',
    whyItMatters:'This is the single most important structure in the whole curriculum. From here on, every new tune goes through these eleven steps, and a tune that has not been through them is a tune you can play rather than a tune you know.',
    memorizationTips:'Take one tune through all eleven steps before you take a second tune through step one. The temptation is always to collect tunes; the value is in the depth.',
    theoryNotes: TUNE_APP_STEPS.map(s => `${s.stepNumber}. ${s.name} — ${s.description}`).join('\n'),
    source:`${siskindSrc(2)}, Unit 6 — applied to “Hardly, in the Moonlight”`,
    flashcardPrompt:'Name the eleven steps of the tune mastery process, in order.',
    sourceReference: ref(2, 6, '—', 'The eleven steps, worked through on the book’s own tune.')
  });

  /* ---- 9. Bossa nova comping ---- */
  for(const e of BOSSA_STYLES){
    add(siskindStageFor(e.book, e.unit), 'bossa', e, {
      name: `Bossa nova — ${e.style}`,
      whyItMatters:'The bossa is not swing played quietly. Its eighth notes are even, and getting that right is the difference between Brazilian music and a jazz musician’s idea of it.',
      memorizationTips: e.notes,
      theoryNotes: `${e.description}\n\nRhythm: ${e.rhythm}\n\nThe eighth notes are syncopated but NOT swung — straight throughout.`,
      source: `${siskindSrc(e.book)}, Unit ${e.unit}`,
      flashcardPrompt: `Play ${e.style} on “Girl from Ipanema” — straight eighths.`,
      sourceReference: ref(e.book, e.unit, '—', 'The three bossa styles as the book notates them.')
    });
  }

  /* ---- 10. Introductions and endings ---- */
  for(const e of INTROS_ENDINGS){
    add(siskindStageFor(e.book, e.unit), 'intros', e, {
      name: `${e.name} — ${e.type}`,
      whyItMatters:'Nobody remembers the middle of the solo. They remember how it started and how it ended, and those are the two things a practice room never teaches you.',
      memorizationTips: `${e.usage}\n\nPractise it in all twelve keys before you need it.`,
      theoryNotes: `${e.description}\n\n${(e.steps || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      source: `${siskindSrc(e.book)}, Unit ${e.unit}`,
      flashcardPrompt: `Play the ${e.name} in {key}.`,
      sourceReference: ref(e.book, e.unit, '—', 'The pattern notated, in the book’s own voicing.')
    });
  }

  /* ---- 11. Memorization and transposition ---- */
  add(siskindStageFor(2, 6), 'memory', {id:'MEMORY', types:MEMORY_TYPES,
    methods:TRANSPOSITION_METHODS, note:TRANSPOSITION_NOTE}, {
    name:'The four types of musical memory, and transposition',
    whyItMatters:'By this point the repertoire is larger than repetition alone can hold. Four kinds of memory hold it instead, and the weakest of the four is the one that fails on the stand.',
    memorizationTips:`${TRANSPOSITION_METHODS.map(m => `${m.name}: ${m.description}`).join('\n\n')}\n\n${TRANSPOSITION_NOTE}`,
    theoryNotes: MEMORY_TYPES.map(t => `${t.name} — ${t.description}\nMethod: ${t.method}`).join('\n\n'),
    source:`${siskindSrc(2)}, Unit 6`,
    flashcardPrompt:'Name the four types of musical memory, and which of yours is weakest on this tune.',
    sourceReference: ref(2, 6, '—', 'The four memory types and the six-key transposition target.')
  });

  /* ---- 12. Self-transcription analysis ---- */
  add(siskindStageFor(2, 12), 'selfana', {id:'SELFANA', questions:SELF_TRANSCRIPTION_QS,
    beats:BEAT_SUBDIVISIONS}, {
    name:'Self-transcription analysis — the seventeen questions',
    whyItMatters:'The recording does not care what you intended to play. This is the only exercise in the curriculum whose subject is you, and the three areas it identifies become the next month of practice.',
    memorizationTips:'Record a full take, transcribe it, then answer all seventeen honestly. Question 9 asks which subdivision each phrase begins on — if they all begin on beat 1, that is the finding, and it is a common one.',
    theoryNotes: SELF_TRANSCRIPTION_QS.map(q => `${q.questionNumber}. ${q.questionText} (${q.answerType})`).join('\n'),
    source:`${siskindSrc(2)}, Unit 12`,
    flashcardPrompt:'Record a chorus, then answer the seventeen questions on what you actually played.',
    sourceReference: ref(2, 12, '—', 'The diagnostic questionnaire in full.')
  });

  _siskindCatalog = cat; _siskindIndex = index;
  return cat;
}
