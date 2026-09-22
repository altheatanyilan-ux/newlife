/* ============================================================
   THE GOLDEN TIPS — what is true of every exercise in the room.

   A catalogue of ninety-one exercises tells you WHAT to practise and says
   almost nothing about HOW. The how is in the same books, spread across
   forewords, principle lists, postludes and the odd aside in a chapter about
   something else: practise with a metronome, on two and four; slow down when
   it is not improving; everything in every key; sing what you play; listen
   twenty times; make a mess before you make music. None of it belongs to a
   particular exercise, which is exactly why a student can practise for a
   year without ever meeting it.

   So it is attached to all of them. Every exercise page carries a handful,
   chosen for what that exercise is, and they change from day to day, because
   a panel that says the same four things forever is a panel you stop seeing.

   EVERY ONE IS SOMEBODY'S, AND SAYS WHOSE. The tip, the book, the chapter
   and the page are all here, for the same reason the exercises carry a
   citation: this room's claim on your time is that it is relaying teaching
   rather than inventing advice, and a claim you cannot check is not a claim.

   WHAT IS SHIPPED AND WHAT IS YOURS. The forty-eight are shipped, and are
   not editable, the way the curriculum is not: they will be corrected in a
   later version and a copy in everybody's database would mean the correction
   never arrives. What lives in the state is only which ones you starred.
   ============================================================ */

/* the thirteen headings the tips arrive under, in the order the research
   put them — which is roughly the order they matter to somebody starting */
const JAZZ_TIP_CATEGORIES = [
  ['tempo',          'Tempo & accuracy'],
  ['metronome',      'Metronome & time'],
  ['tactile',        'Tactile & visual mastery'],
  ['keys',           'Practising in all keys'],
  ['internalization','Internalisation & the ear'],
  ['musicality',     'Making music, not exercises'],
  ['listening',      'Listening & transcription'],
  ['physical',       'Physical & mental'],
  ['phrasing',       'Phrasing & rhythm'],
  ['voiceleading',   'Voice leading & motion'],
  ['social',         'Playing with people'],
  ['structure',      'The shape of a session'],
  ['vocal',          'For singers'],
];
const jazzTipCategory = c => (JAZZ_TIP_CATEGORIES.find(x => x[0] === c) || [c, c])[1];

/* ---------- which tips are about which kind of work ----------
   The research tagged each tip with the kinds of exercise it helps most —
   voicings, licks, scales, improvisation, comping, rhythm — and the
   catalogue tags each exercise with the generator that writes it out. This
   is the join between the two vocabularies, and it is a judgement rather
   than a fact: an interval drill is filed under `scales` because it is the
   same kind of work, single notes drilled systematically, even though
   nobody would call it a scale.

   `vocal` is in the tip vocabulary and in nothing here, because this room
   is a piano room. Those two tips are reachable in the full list and never
   come up on an exercise, which is right — they are true and they are not
   about anything you are doing here. */
const JAZZ_TIP_TAGS = {
  chord:             ['voicings'],
  voicing:           ['voicings', 'comping'],
  progression:       ['voicings', 'comping'],
  melody:            ['licks', 'improvisation'],
  scale:             ['scales', 'improvisation'],
  interval:          ['scales'],
  interval_flashcard:['scales'],
  form:              ['comping', 'improvisation', 'rhythm'],
  bass_line:         ['comping'],
  non_mxl:           ['rhythm'],
};
const jazzTipTags = ex => (ex && JAZZ_TIP_TAGS[ex.kind]) || [];

const UNIVERSAL_PRACTICE_TIPS = [
  {id:'UPT-01', icon:'🎯',
   title:'Speed Comes from Accuracy',
   tip:'If you\'re practicing something fast and it\'s not getting better, slow down. Speed comes from accuracy and relaxation. If you play something accurately, you can then play it a little faster.',
   source:'Levine', sourceDetail:'Chapter 12 "Practice, Practice, Practice", p.248',
   category:'tempo', appliesTo:['all']},
  {id:'UPT-02', icon:'✂️',
   title:'Shorten, Slow Down, Simplify',
   tip:'The three ways to modify an overwhelming exercise: (a) Shorten — work on a smaller amount of music at a time, (b) Slow Down — find the tempo at which you can play it successfully, then raise gradually, (c) Simplify — play one hand at a time, reduce keys, disregard articulation until you master the notes.',
   source:'Siskind Book 1', sourceDetail:'Principles for Learning Jazz, p.7',
   category:'tempo', appliesTo:['all']},
  {id:'UPT-03', icon:'⏫',
   title:'Start Slow, Increment by 5 BPM',
   tip:'Start at a slow tempo, around 80 BPM, and strive to play with no errors or breaks for one minute. Increase the tempo by five beats per minute after three successful minutes in a row.',
   source:'Siskind Book 2', sourceDetail:'Scale Game 1, p.41',
   category:'tempo', appliesTo:['scales', 'licks', 'voicings']},
  {id:'UPT-04', icon:'🎵',
   title:'Metronome is Your Net',
   tip:'Practicing without a metronome is like playing tennis without a net. Without a metronome, you don\'t have any metric to measure whether you are succeeding. Unless specifically prompted to practice out of time, always practice with a metronome.',
   source:'Siskind Book 1', sourceDetail:'Principle 7, p.8',
   category:'metronome', appliesTo:['all']},
  {id:'UPT-05', icon:'🥁',
   title:'Metronome on 2 and 4',
   tip:'Practice with the metronome on beats two and four. This simulates the hi-hat and helps you lay back on the time feel, sounding more relaxed. Aligning with the weak beats rather than the strong beats is how jazz musicians practice.',
   source:'Siskind Book 1', sourceDetail:'Swing Feel Basics 2, p.24',
   category:'metronome', appliesTo:['all']},
  {id:'UPT-06', icon:'🦶',
   title:'Tap Your Foot',
   tip:'Tap your foot when you play. Pianist Jaki Byard taught tapping with the heel, which solidifies time feeling and gives a sense of forward motion. Thelonious Monk tapped his toe, heel, and whole foot depending on what he was playing. Whatever feels natural is OK.',
   source:'Levine', sourceDetail:'Chapter 12, p.254',
   category:'metronome', appliesTo:['all']},
  {id:'UPT-07', icon:'👁️',
   title:'Close Your Eyes — Know the Feel',
   tip:'Be aware of what your eyes see and what your hands feel when you play. Great players know how everything feels and looks on their instruments. Your \'memory\' of music consists of four parts: Aural (how it sounds), Theoretical (how you think about it), Tactile (how it feels), and Visual (how it looks).',
   source:'Levine', sourceDetail:'Chapter 12 "The Tactile and Visual Aspect", p.248',
   category:'tactile', appliesTo:['all']},
  {id:'UPT-08', icon:'🎨',
   title:'The Piano is Color-Coded',
   tip:'The piano is a color-coded instrument — notes are black or white, and each key has a visual \'color.\' Think of D melodic minor chords visually as six white notes plus C#. When McCoy Tyner is playing, he\'s not thinking \'II-V, 7th comes down a half step\' — he did that years ago. He knows how everything looks and feels.',
   source:'Levine', sourceDetail:'Chapter 12, pp.248-249',
   category:'tactile', appliesTo:['voicings', 'scales']},
  {id:'UPT-09', icon:'🧠',
   title:'Four Types of Memory',
   tip:'There are four aspects of memorizing music: (1) Intellectual Memory — can you write it down without touching your instrument? (2) Muscle Memory — can you play it while your mind wanders? (3) Aural Memory — can you sing it? (4) Emotional Memory — can you describe it without musical terminology? Different musicians prioritize one type over another.',
   source:'Siskind Book 2', sourceDetail:'Memorizing and Transposing Tunes, p.119',
   category:'tactile', appliesTo:['all']},
  {id:'UPT-10', icon:'🤖',
   title:'Put One Hand on Autopilot',
   tip:'No pianist can truly split their brain in two, but some get so good at hand interdependence that listeners perceive the hands as acting totally independently. One key factor: the ability to put one hand on \'autopilot.\' Some teachers have students play repetitive patterns while reading novels or watching television to practice playing without thinking.',
   source:'Siskind Book 3', sourceDetail:'Odd Time Signatures FAQ, p.269',
   category:'tactile', appliesTo:['voicings', 'comping']},
  {id:'UPT-11', icon:'🔑',
   title:'Everything in Every Key',
   tip:'Practice everything in every key. Everything: voicings, licks, patterns, and tunes. The real quantum leap comes not when you can play all the licks, but when you can play them on any tune, in any key.',
   source:'Levine', sourceDetail:'Chapter 12, p.246',
   category:'keys', appliesTo:['all']},
  {id:'UPT-12', icon:'🩹',
   title:'Practice to Your Weaknesses',
   tip:'When practicing, concentrate on things you don\'t play well. Which keys give you the most trouble? Can you play a lick on F#7alt as fast as on C7alt? After a rehearsal or gig, think back on what felt shakiest and start your next session there.',
   source:'Levine', sourceDetail:'Chapter 12, p.247',
   category:'keys', appliesTo:['all']},
  {id:'UPT-13', icon:'🎲',
   title:'Random Key Sequences',
   tip:'Practice ii-V-I progressions in random key sequences (e.g. C, E, Ab, B, D, F#, Bb, G...) not just the cycle of fifths. This ensures the theoretical principles are memorized and your hands are not reliant on mechanical motor memory.',
   source:'Mantooth', sourceDetail:'Chapter 7, p.27',
   category:'keys', appliesTo:['voicings'],
   goes:'#/jazz/cards', goesSaid:'the flashcards deal a random key', goesNeeds:'cards'},
  {id:'UPT-14', icon:'🔀',
   title:'Transpose to Reveal Weaknesses',
   tip:'After you\'ve learned a tune, practice it in a different key. This will highlight all your weaknesses, telling you immediately what you have to practice. Transposition engages intellectual, aural, and emotional memory — the only memory it doesn\'t touch is muscle memory.',
   source:'Levine', sourceDetail:'Chapter 12, p.246; Siskind Book 2, p.119',
   category:'keys', appliesTo:['all']},
  {id:'UPT-15', icon:'🌊',
   title:'Learn the Changes, Then Forget Them',
   tip:'Charlie Parker once said \'learn the changes and then forget them.\' Your goal is to internalize information until you no longer have to think about it. Experienced musicians have internalized this to the point that they just hear it and play it.',
   source:'Levine', sourceDetail:'Introduction, p.vii; also p.188',
   category:'internalization', appliesTo:['all']},
  {id:'UPT-16', icon:'🚫',
   title:'Don\'t Write It Out — Internalize It',
   tip:'Should you write out scale patterns in every key? No. You\'ll just end up reading them. Your goal is to internalize them. You need to train your ear and your fingers, not just your eyes. Jazz is almost entirely ear music. Jazz musicians play best when they don\'t have to read.',
   source:'Levine', sourceDetail:'Chapter 4 "How to Practice Scales", p.100',
   category:'internalization', appliesTo:['scales', 'voicings']},
  {id:'UPT-17', icon:'🎤',
   title:'Sing What You Play',
   tip:'Practice singing and playing over a progression. Sing a phrase, then play a similar phrase. You don\'t need perfect pitch — the important thing is matching the shape and rhythm and training yourself to listen to your inner ear. Activating your inner ear requires habit-forming practice.',
   source:'Siskind Book 1', sourceDetail:'Improvisation Exercise 10, p.152',
   category:'internalization', appliesTo:['improvisation', 'licks']},
  {id:'UPT-18', icon:'💿',
   title:'Sing Along with Records',
   tip:'Practice singing along with your favorite records — heads, melodies, solos, and bass lines. As you do so, try to identify specific intervals between notes. This is all part of ear training. Creating a good solo consists largely of playing on your instrument what you \'hear in your head.\'',
   source:'Levine', sourceDetail:'Chapter 1, p.12',
   category:'internalization', appliesTo:['all']},
  {id:'UPT-19', icon:'⚡',
   title:'Get Reaction Time Down',
   tip:'It might take you ten seconds at first to think \'Bø is the sixth mode of D melodic minor.\' Get your reaction time down to three seconds, one second, a half-second, a tenth of a second, until it becomes automatic. You don\'t even need your instrument — practice in the shower or driving.',
   source:'Levine', sourceDetail:'Chapter 6 "Continuous Scale Exercise", p.122',
   category:'internalization', appliesTo:['scales', 'voicings']},
  {id:'UPT-20', icon:'🎶',
   title:'Make Music When Practicing',
   tip:'Even when practicing scales and exercises, make music, not just scales and exercises. Play with feeling and intensity. Practice heads and melodies as beautifully and personally as possible.',
   source:'Levine', sourceDetail:'Chapter 12, p.246',
   category:'musicality', appliesTo:['all']},
  {id:'UPT-21', icon:'🏁',
   title:'Force Yourself to Complete the Solo',
   tip:'Force yourself to complete a thirty-two-measure improvisation even if what you are doing seems \'bad\' or \'boring.\' Finishing a complete chorus builds the habit of committing and creates flow, even imperfect flow.',
   source:'Siskind Book 1', sourceDetail:'Evening in Lyon, p.72',
   category:'musicality', appliesTo:['improvisation']},
  {id:'UPT-22', icon:'👂',
   title:'If It Sounds Good, It Is Good',
   tip:'Trust your ears. While you should trust your teacher and the rules presented in texts, you also have to trust your ears. Not only will it help you sort through \'what if\' questions, but it will also help you develop a unique sound as an artist.',
   source:'Siskind Book 1', sourceDetail:'Principle 4, p.7',
   category:'musicality', appliesTo:['all']},
  {id:'UPT-23', icon:'🔎',
   title:'Focused Practice, Not Mindless Repetition',
   tip:'Always have a goal or focus for your practice. If you are not focused, the time you spend will merely reinforce your previous habits — the antithesis of growth. Drone improvisations, for instance, should use a timer and have a specific point of focus.',
   source:'Siskind Book 1', sourceDetail:'Improvisation Exercise 1, p.9',
   category:'musicality', appliesTo:['all']},
  {id:'UPT-24', icon:'✅',
   title:'Practice Succeeding',
   tip:'If practicing is the process of building habits, practicing poor execution will build the habit of poor execution. Modify overwhelming activities until you can execute them successfully, building a habit of success.',
   source:'Siskind Book 1', sourceDetail:'Principle 5, p.7',
   category:'musicality', appliesTo:['all']},
  {id:'UPT-25', icon:'🔁',
   title:'Listen At Least Twenty Times',
   tip:'Listen to each guided listening assignment at least twenty times. The recorded history of the music is the only true teacher. No jazz musician attains mastery without engaging deeply with recordings.',
   source:'Siskind Books 1-3', sourceDetail:'every unit assignment',
   category:'listening', appliesTo:['all'],
   goes:'#/jazz/plan', goesSaid:'the plan counts your listening to twenty', goesNeeds:'plan'},
  {id:'UPT-26', icon:'🪜',
   title:'Seven Levels of Listening',
   tip:'Seven ways to engage with recordings, from less to more intense: (a) background music, (b) listening intently with eyes closed, (c) listening repeatedly with a specific focus like the left hand, (d) stopping and starting at your instrument, (e) learning to sing a solo, (f) transcribing, (g) performing along with the transcription.',
   source:'Siskind Book 2', sourceDetail:'Postlude, p.259',
   category:'listening', appliesTo:['all']},
  {id:'UPT-27', icon:'🎧',
   title:'Play Along with Real Records',
   tip:'Play along with real records, not just play-along tracks. Playing along with the record immerses you much more deeply in the music than just writing notes down. You will learn not just the notes, but the breathing, phrasing, and emotional content.',
   source:'Levine', sourceDetail:'Chapter 12, p.254',
   category:'listening', appliesTo:['all']},
  {id:'UPT-28', icon:'📼',
   title:'Transcribe — The Answers Are in Your Living Room',
   tip:'Your CD collection contains the history, theory, and practice of jazz. Almost all the great jazz musicians learned most of their \'licks\' and gained most of their theoretical knowledge from listening, transcribing, and analyzing solos from records. Start learning to transcribe now.',
   source:'Levine', sourceDetail:'Introduction, p.viii',
   category:'listening', appliesTo:['all']},
  {id:'UPT-29', icon:'😌',
   title:'Relax',
   tip:'Be aware of any unnecessary muscle tension as you play. Breathe normally and deeply. If you\'re not a horn player, smiling while you play can help you relax. Drummer Billy Higgins always smiles when he plays. Does he know something we all should know?',
   source:'Levine', sourceDetail:'Chapter 12, p.254',
   category:'physical', appliesTo:['all']},
  {id:'UPT-30', icon:'🔥',
   title:'Warm Up Before You Play',
   tip:'You wouldn\'t run a couple of miles before warming up and stretching. Vocal warm-ups increase blood flow to muscles and gradually release tension. The same applies to any instrument — a few minutes of easy exercises prepares your body for more demanding work.',
   source:'Peckham', sourceDetail:'Chapter 7 "Practicing", p.75',
   category:'physical', appliesTo:['all', 'vocal']},
  {id:'UPT-31', icon:'❄️',
   title:'Cool Down After Practice',
   tip:'It is as important to cool down after practice as it is to cool down after a physical workout. The purpose is to bring your instrument and body back to a less active state. Lighter stretches combined with easy playing help ease the transition.',
   source:'Peckham', sourceDetail:'Chapter 7, p.88',
   category:'physical', appliesTo:['all', 'vocal']},
  {id:'UPT-32', icon:'💭',
   title:'Mental Practice is Real Practice',
   tip:'Mental practicing is rehearsing without using your instrument. When we mentally practice, we actually produce muscle contractions similar to the ones we produce when we perform. Imagine yourself performing flawlessly, phrase by phrase. If negative thoughts creep in, rewind and proceed in slow motion.',
   source:'Peckham', sourceDetail:'Chapter 7, p.88-89',
   category:'physical', appliesTo:['all']},
  {id:'UPT-33', icon:'📓',
   title:'Keep a Notebook',
   tip:'Keep a notebook of ideas you come across while practicing or listening. Write down tunes you want to learn, things to remember to practice. This helps you focus, and brings order to the ever-lengthening list of stuff you want to woodshed.',
   source:'Levine', sourceDetail:'Chapter 12, p.254',
   category:'physical', appliesTo:['all']},
  {id:'UPT-34', icon:'🌬️',
   title:'Play in Phrases, Not Endless Streams',
   tip:'Good melodies happen in phrases, not in endless streams. Focus on creating clear beginnings and endings. Practice taking your hand all the way off the piano between phrases. How long can you wait between phrases? Space is music too.',
   source:'Siskind Book 1', sourceDetail:'Drone Improvisation, p.9',
   category:'phrasing', appliesTo:['improvisation']},
  {id:'UPT-35', icon:'🎷',
   title:'Start and End on Offbeats',
   tip:'In jazz, most phrases start and end on offbeats rather than on the beat. If your playing feels too \'square,\' place more phrase beginnings and endings on offbeats. Practice building your rhythmic vocabulary with specific rhythm patterns.',
   source:'Siskind Book 1', sourceDetail:'Building Your Rhythmic Vocabulary, p.51; FAQ p.128',
   category:'phrasing', appliesTo:['improvisation', 'licks']},
  {id:'UPT-36', icon:'🗣️',
   title:'Check Your Swing Articulation',
   tip:'The biggest problems at every stage have to do with rhythm and articulation. Are you heavy on the downbeats? Are you doing a good job accenting your \'doo-VAHs\'? Make sure to really listen instead of going by feel — even very smart students think they\'re getting the accents right when they aren\'t.',
   source:'Siskind Book 1', sourceDetail:'FAQ Blues chapter, p.128',
   category:'phrasing', appliesTo:['all']},
  {id:'UPT-37', icon:'🪶',
   title:'Minimal Motion Between Chords',
   tip:'Move as little as possible between adjacent harmonies. The key to good voicings is smooth contextual voice leading: consider where you\'re coming from and where you\'re going to. Observe the \'Rule of Thumb\' — keep your right hand thumb between middle C and C5.',
   source:'Mantooth', sourceDetail:'Foreword + Chapter 2, pp.5-8',
   category:'voiceleading', appliesTo:['voicings', 'comping']},
  {id:'UPT-38', icon:'🧭',
   title:'Don\'t Always Start on the Root',
   tip:'The traditional method of practicing scales — always starting on the root — won\'t do much to improve your skills as an improviser. By going up one mode, down the next, you\'re starting on each note, reversing on each note, equalizing the importance of every note. Deprogram yourself from root-bias conditioning.',
   source:'Levine', sourceDetail:'Chapter 4, pp.95-97',
   category:'voiceleading', appliesTo:['scales', 'improvisation']},
  {id:'UPT-39', icon:'🤝',
   title:'Play with Others',
   tip:'Play with others as soon as possible. Jazz is social music. Your bandmates will give you new ideas for listening, practicing, and growth. Playing in an ensemble reinforces your ability to stay in time and follow the form. It\'s important to have conversations, not always study alone.',
   source:'Siskind Book 1', sourceDetail:'Principle 8, p.8',
   category:'social', appliesTo:['all']},
  {id:'UPT-40', icon:'🌪️',
   title:'Make a Mess, Then Clean It Up',
   tip:'Your playing is probably not going to sound amazing very often during these first months. Don\'t let that stop you! Go make a great big mess at the piano. If you wait until everything comes out perfectly, you will never get started.',
   source:'Siskind Book 1', sourceDetail:'Principle 2, p.7',
   category:'social', appliesTo:['all']},
  {id:'UPT-41', icon:'❓',
   title:'Ask \'What If\' Questions',
   tip:'Every time you learn something new, ask yourself as many \'what if\' questions as you can. Does a phrase sound good on dominant chords? What if you tried it on a major chord? What if you tried it with triplets or sixteenth notes? Great students never stop at the information being presented.',
   source:'Siskind Book 1', sourceDetail:'Principle 3, p.7',
   category:'social', appliesTo:['all']},
  {id:'UPT-42', icon:'🌱',
   title:'Don\'t Give Up',
   tip:'Learning jazz is a long process. Simply sticking with it even when practicing feels hard is one of the most crucial keys to success. If you keep practicing and trust the process, progress will come.',
   source:'Siskind Book 1', sourceDetail:'Principle 9, p.8',
   category:'social', appliesTo:['all']},
  {id:'UPT-43', icon:'☝️',
   title:'One Thing at a Time',
   tip:'One key to a successful jazz practice session is to avoid getting overwhelmed and trying to achieve too much too quickly. Take one solo, one voicing type, one lick at a time and work towards mastery. As you do the deep work, you will find yourself making connections and improving exponentially.',
   source:'Siskind Book 2', sourceDetail:'Postlude, p.260',
   category:'social', appliesTo:['all']},
  {id:'UPT-44', icon:'🏙️',
   title:'Cultivate Your Environment',
   tip:'Listen to as much live jazz as possible. Recordings are not enough. You need to see, hear, and feel the emotion, heat, and sweat of jazz as it happens. Find the best musician on your instrument in your area and ask if you can study with them.',
   source:'Levine', sourceDetail:'Chapter 12, p.255',
   category:'social', appliesTo:['all']},
  {id:'UPT-45', icon:'🧩',
   title:'Siskind\'s Four-Part Practice Structure',
   tip:'A good jazz practice session has four parts: (1) Fundamentals — technique, ear training, rhythm, sight-reading; (2) Rote/Controlled Jazz Exercises — voicings, coordination exercises, licks in every key; (3) Working on Tunes — voicings, improvisation, and concepts applied to real tunes; (4) Engaging with the Recorded History — listening, transcribing, playing along. All material for parts 1-3 should be inspired by part 4.',
   source:'Siskind Book 2', sourceDetail:'Postlude "An Effective Jazz Practice Session", pp.258-260',
   category:'structure', appliesTo:['all'],
   goes:'#/jazz/plan', goesSaid:'today\'s plan is these four parts', goesNeeds:'plan'},
  {id:'UPT-46', icon:'🔬',
   title:'The COREA Process',
   tip:'Assimilate musical ideas from transcriptions using COREA: (C) Choose a rhythm/concept from the solo, (O) play it Over a static progression for 10-15 minutes, (R) play it Relentlessly over a full tune, (E) use it Elegantly — only once every 8-16 measures, camouflaged, (A) Apply to multiple tunes.',
   source:'Siskind Book 2', sourceDetail:'Unit 2, pp.35-37',
   category:'structure', appliesTo:['licks', 'improvisation']},
  {id:'UPT-47', icon:'⏳',
   title:'Practice 30-60 Minutes, 4-6 Days',
   tip:'Practice sessions should be no more than one hour. Vocal cords tire more easily than other instruments. Practice four to six days a week, thirty to sixty minutes at a time. Practicing at random, infrequent long intervals reinforces bad habits.',
   source:'Peckham', sourceDetail:'Chapter 7, p.73',
   category:'vocal', appliesTo:['vocal']},
  {id:'UPT-48', icon:'🔼',
   title:'Vocalize a Step Higher Than You\'ll Perform',
   tip:'Vocalize at least one whole step higher than you plan to sing in public. Psychologically, it produces empowerment. Physically, high notes need overtones. And remember: high notes — use them or lose them. Voices settle lower if not exercised through the full range.',
   source:'Peckham', sourceDetail:'Chapter 5, p.53',
   category:'vocal', appliesTo:['vocal']},
];
const jazzTip = id => UNIVERSAL_PRACTICE_TIPS.find(t => t.id === id) || null;
const jazzTipsByCategory = () => JAZZ_TIP_CATEGORIES
  .map(([c, label]) => ({cat: c, label, tips: UNIVERSAL_PRACTICE_TIPS.filter(t => t.category === c)}))
  .filter(g => g.tips.length);

/* ---------- the ones you starred ----------
   Kept as a list of ids rather than a copy of the tips, so a corrected tip
   arrives corrected and a retired one simply stops being starred. */
function jazzTipState(){
  const j = jazzState();
  j.tips = j.tips && typeof j.tips === 'object' ? j.tips : {};
  j.tips.favs = (Array.isArray(j.tips.favs) ? j.tips.favs : []).filter(id => jazzTip(id));
  j.tips.open = !!j.tips.open;
  return j.tips;
}
const jazzTipFavs = () => jazzTipState().favs;
const jazzTipStarred = id => jazzTipFavs().includes(id);
function jazzTipStar(id){
  if(!jazzTip(id)) return false;
  const f = jazzTipState().favs, i = f.indexOf(id);
  if(i < 0) f.push(id); else f.splice(i, 1);
  saveNow();
  return i < 0;
}

/* ---------- which ones today ----------
   Three things have to be true at once. The tips have to suit the exercise;
   they have to change from one day to the next, or the section becomes
   furniture; and they have to be the same for the whole of one day, or every
   re-render deals a new hand and nothing can be read.

   So the shuffle is seeded by the day and the exercise rather than random:
   the same exercise on the same day is always the same four tips, and
   tomorrow is a different four. No state is written — the day is the seed.

   A starred tip is weighted rather than pinned. Pinning would mean starring
   five tips freezes the panel forever, which is the opposite of what
   starring is for. */
function jazzTipSeed(salt){
  let h = 2166136261;
  const s = String(salt);
  for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
/* a small deterministic generator, so a seed always deals the same hand */
function jazzTipRng(seed){
  let x = seed || 1;
  return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
}
function jazzTipShuffle(list, rnd, favs){
  /* a starred tip's draw is halved, which roughly doubles how often it lands
     near the front — noticeably more frequent, never guaranteed */
  return list.map(t => [favs.includes(t.id) ? rnd() * 0.5 : rnd(), t])
    .sort((a, b) => a[0] - b[0]).map(p => p[1]);
}
const JAZZ_TIPS_MIN = 3, JAZZ_TIPS_MAX = 5;
function jazzTipsFor(ex, day){
  const d = day || today();
  const tags = jazzTipTags(ex);
  const favs = jazzTipFavs();
  const rnd = jazzTipRng(jazzTipSeed(d + '|' + ((ex && ex.id) || 'room')));
  const n = JAZZ_TIPS_MIN + Math.floor(rnd() * (JAZZ_TIPS_MAX - JAZZ_TIPS_MIN + 1));
  const matched = UNIVERSAL_PRACTICE_TIPS.filter(t => t.appliesTo.some(a => a !== 'all' && tags.includes(a)));
  const general = UNIVERSAL_PRACTICE_TIPS.filter(t => t.appliesTo.includes('all'));
  /* The matching tips go first, but not all of them: six of the forty-eight
     are about voicings, and letting them take every slot would mean a
     voicing exercise never once showed you "practise with a metronome" —
     which is in the general pile and is the single most repeated instruction
     in all three books. So at most half the hand is specific. */
  const room = Math.min(n, Math.ceil(n / 2));
  const pickM = jazzTipShuffle(matched, rnd, favs).slice(0, room);
  const out = pickM.slice();
  jazzTipShuffle(general, rnd, favs).forEach(t => { if(out.length < n && !out.includes(t)) out.push(t); });
  /* and if the general pile ran dry, the rest of the matching ones */
  jazzTipShuffle(matched, rnd, favs).forEach(t => { if(out.length < n && !out.includes(t)) out.push(t); });
  return out;
}
/* one for the top of the practice plan — the same one all day, for everybody
   who opens the plan, and a different one tomorrow */
function jazzTipOfDay(day){
  const d = day || today();
  const favs = jazzTipFavs();
  const rnd = jazzTipRng(jazzTipSeed('tipofday|' + d));
  const pool = UNIVERSAL_PRACTICE_TIPS.filter(t => !(t.appliesTo.length === 1 && t.appliesTo[0] === 'vocal'));
  return jazzTipShuffle(pool, rnd, favs)[0] || null;
}
/* Some tips point at something this room actually does. The link is only
   drawn when the thing is there to be reached: the plan exists once a stage
   has been started and not before, and sending somebody to an empty page is
   worse than not offering. */
function jazzTipGoes(t){
  if(!t || !t.goes) return null;
  if(t.goesNeeds === 'plan'){
    const s = typeof jazzActiveStage === 'function' ? jazzActiveStage() : null;
    if(!s || jazzStageStatus(s.id) !== 'active') return null;
  }
  return {href: t.goes, said: t.goesSaid || 'in this room'};
}

/* ---------- drawing them ----------
   The citation is the point of the thing, so it is on the card and not
   behind anything. The short form on an exercise page, where four of these
   sit under a score and the page is already long; the full title in the list
   of all of them, which is where somebody goes to find the book. */
const jazzTipCite = t => `${t.source}, ${t.sourceDetail}`;
/* the full form gives the book its title, the way an exercise's citation
   does — "Siskind Book 1 — Jazz Piano Fundamentals, Book 1" says the same
   thing twice */
const jazzTipCiteFull = t => {
  const title = (typeof JAZZ_BOOKS !== 'undefined' && JAZZ_BOOKS[t.source]) || '';
  return `${title || t.source} · ${t.sourceDetail}`;
};
function jazzTipHTML(t, full){
  const on = jazzTipStarred(t.id);
  const goes = jazzTipGoes(t);
  return `<div class="jz-tip${on ? ' starred' : ''}" data-jztip="${esc(t.id)}">
    <div class="jz-tiphead"><span class="jz-tipi">${t.icon}</span><b>${esc(t.title)}</b>
      <button class="jz-star${on ? ' on' : ''}" data-jzstar="${esc(t.id)}" aria-pressed="${on ? 'true' : 'false'}"
        title="${on ? 'starred — it comes round more often' : 'star it and it comes round more often'}">${on ? '★' : '☆'}</button></div>
    <p class="jz-tiptext">${esc(t.tip)}</p>
    <p class="jz-tipsrc mono">— ${esc(full ? jazzTipCiteFull(t) : jazzTipCite(t))}</p>
    ${goes ? `<button class="tbtn jz-tipgo" data-jzgo="${esc(goes.href)}">→ ${esc(goes.said)}</button>` : ''}
  </div>`;
}
/* the section on an exercise page — shut by default, and it remembers which
   way you left it, because somebody who wants these wants them every time */
function jazzTipsHTML(ex){
  const tips = jazzTipsFor(ex);
  if(!tips.length) return '';
  return `<details class="jz-tips" id="jzTips"${jazzTipState().open ? ' open' : ''}>
    <summary><span class="jz-tipt">🏆</span><b>Golden practice tips</b>
      <span class="mono faint">${tips.length} of ${UNIVERSAL_PRACTICE_TIPS.length}, today’s</span></summary>
    <div class="jz-tiplist">${tips.map(t => jazzTipHTML(t)).join('')}</div>
    <button class="tbtn" id="jzAllTips">all ${UNIVERSAL_PRACTICE_TIPS.length} of them →</button>
  </details>`;
}
/* one at the top of the day's plan */
function jazzTipOfDayHTML(){
  const t = jazzTipOfDay();
  if(!t) return '';
  const goes = jazzTipGoes(t);
  return `<div class="jz-today-tip" data-jztip="${esc(t.id)}">
    <div class="jz-tiphead"><span class="jz-tipi">${t.icon}</span>
      <span class="sc" style="margin:0">Today’s golden tip</span>
      <button class="jz-star${jazzTipStarred(t.id) ? ' on' : ''}" data-jzstar="${esc(t.id)}"
        aria-pressed="${jazzTipStarred(t.id) ? 'true' : 'false'}"
        title="star it and it comes round more often">${jazzTipStarred(t.id) ? '★' : '☆'}</button></div>
    <b class="serif">${esc(t.title)}</b>
    <p class="jz-tiptext">${esc(t.tip)}</p>
    <p class="jz-tipsrc mono">— ${esc(jazzTipCite(t))}</p>
    <div class="row" style="gap:8px;flex-wrap:wrap">
      ${goes ? `<button class="tbtn jz-tipgo" data-jzgo="${esc(goes.href)}">→ ${esc(goes.said)}</button>` : ''}
      <button class="tbtn" id="jzAllTips">🏆 all ${UNIVERSAL_PRACTICE_TIPS.length} tips</button></div>
  </div>`;
}
/* Starring must not redraw the page. On an exercise page a redraw means the
   engraver renders the score again, which is a visible flash and a hundred
   milliseconds, for a star. So the button edits itself and nothing else. */
function bindJazzTips(root){
  $$('[data-jzstar]', root).forEach(b => b.onclick = ev => {
    ev.preventDefault(); ev.stopPropagation();
    const on = jazzTipStar(b.dataset.jzstar);
    b.textContent = on ? '★' : '☆';
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.title = on ? 'starred — it comes round more often' : 'star it and it comes round more often';
    const card = b.closest('.jz-tip') || b.closest('.jz-today-tip');
    if(card) card.classList.toggle('starred', on);
    sound('click');
  });
  $$('[data-jzgo]', root).forEach(b => b.onclick = () => navigate(b.dataset.jzgo));
  const all = root.querySelector('#jzAllTips');
  if(all) all.onclick = () => openJazzTips();
  const det = root.querySelector('#jzTips');
  if(det) det.addEventListener('toggle', () => { jazzTipState().open = det.open; saveNow(); });
}

/* ---------- all forty-eight at once ----------
   Not a settings screen: a thing to read. Grouped the way the research
   grouped them, filterable down to the ones you starred, with the full book
   title on every one so it can be taken to a shelf. */
function openJazzTips(){
  jazzTipState();
  let cat = 'all', onlyFav = false;
  const p = openPanel('<div id="jzTipHost"></div>', 'jz-tip-panel');
  const draw = () => {
    const host = p.querySelector('#jzTipHost');
    const favs = jazzTipFavs();
    const groups = jazzTipsByCategory()
      .filter(g => cat === 'all' || g.cat === cat)
      .map(g => ({...g, tips: onlyFav ? g.tips.filter(t => favs.includes(t.id)) : g.tips}))
      .filter(g => g.tips.length);
    host.innerHTML = `<div class="mono">the golden tips</div>
      <h2>What is true of every exercise</h2>
      <p class="faint" style="font-size:.82rem">Forty-eight principles out of the same books the
        exercises come from. Star the ones that land and they come round more often on the
        exercise pages.</p>
      <div class="row" style="gap:6px;flex-wrap:wrap;margin:12px 0">
        <button class="chip${cat === 'all' ? ' on' : ''}" data-jzcat="all">everything</button>
        ${JAZZ_TIP_CATEGORIES.filter(([c]) => UNIVERSAL_PRACTICE_TIPS.some(t => t.category === c))
          .map(([c, label]) => `<button class="chip${cat === c ? ' on' : ''}" data-jzcat="${esc(c)}">${esc(label)}</button>`).join('')}
      </div>
      <label class="jz-gate mono"><input type="checkbox" id="jzFavOnly" ${onlyFav ? 'checked' : ''}>
        only the <span class="jz-favcount">${favs.length}</span> I starred</label>
      ${groups.length ? groups.map(g => `<div class="vp-sec"><span class="sc">${esc(g.label)}</span>
        <div class="jz-tiplist">${g.tips.map(t => jazzTipHTML(t, true)).join('')}</div></div>`).join('')
        : `<div class="empty">${onlyFav ? 'Nothing starred yet. The star is on every tip.' : 'Nothing here.'}</div>`}`;
    bindJazzTips(host);
    /* the star handler edits its own button and nothing else, which is right
       on an exercise page and leaves one thing stale here: the count in the
       filter. A card is deliberately NOT removed from a starred-only list
       under the cursor that just unstarred it — that is the kind of helpful
       that loses your place. */
    $$('[data-jzstar]', host).forEach(b => { const star = b.onclick;
      b.onclick = ev => { star(ev); const n = host.querySelector('.jz-favcount');
        if(n) n.textContent = jazzTipFavs().length; }; });
    $$('[data-jzcat]', host).forEach(b => b.onclick = () => { cat = b.dataset.jzcat; draw(); });
    const fav = host.querySelector('#jzFavOnly');
    if(fav) fav.onchange = () => { onlyFav = fav.checked; draw(); };
  };
  draw();
  return p;
}
