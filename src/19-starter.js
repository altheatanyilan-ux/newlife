/* ============================================================
   STARTER SET — a first draft of the house, not a biography.
   Everything here is built from things you have actually said:
   the vision board (Japan, jazz piano, opening a bar), the fact
   that you are building this instrument, and the taste the rest
   of your choices show. Nothing here invents your past — where
   I would have had to make something up (life stages, people,
   memories, money) it leaves a named, empty room instead.
   Every record is stamped seeded:'starter', so the whole thing
   comes back out in one click and takes nothing of yours with it.
   ============================================================ */
const STARTER_TAG = 'starter';
const STARTER_NOTE = 'Added as part of the starter set. Overwrite it — that is what it is for.';

const STARTER = {

  /* ---- the skills those goals actually require ---- */
  skills: [
    {key:'sk-piano', name:'Jazz piano', cat:'Musical', horizon:'focus', priority:'P1',
     why:'Because sitting in at a jam is the only item on the board I can start today, alone, for free.',
     levels:['Reading and voicings','Comping through a standard','Soloing over changes','Playing with people','Sitting in anywhere'], current:1},
    {key:'sk-jp', name:'Japanese', cat:'Language', horizon:'focus', priority:'P1',
     why:'A year there is a holiday without it and a life with it.',
     levels:['Kana and survival phrases','Simple conversation','Reading a menu and a sign','Holding a real conversation','Being a person, not a guest'], current:1},
    {key:'sk-bar', name:'Bartending and mixology', cat:'Income', horizon:'next', priority:'P2',
     why:'You cannot own a room you cannot work.', startBy:'',
     levels:['The classics, made correctly','Speed and consistency','Building a drink from scratch','Running a service alone','Designing a list'], current:0},
    {key:'sk-build', name:'Building things on the web', cat:'Intellectual', horizon:'active', priority:'P2',
     why:'This instrument exists because of it, and the next thing will too.',
     levels:['Making it work','Making it readable','Making it fast','Making it something other people can use'], current:2},
    {key:'sk-write', name:'Writing', cat:'Artistic', horizon:'active', priority:'P3',
     why:'Everything here — the journals, the Timeline, the Writing room — is downstream of being able to say what I mean.',
     levels:['Getting it down','Getting it clear','Getting it good','Getting it read'], current:2},
    {key:'sk-hosp', name:'Running a room', cat:'Social', horizon:'someday', priority:'P3',
     why:'The bar is not a drinks problem. It is a hospitality problem.',
     levels:['Reading a room','Regulars','Staff','Ownership'], current:0},
    {key:'sk-ink', name:'Ink and brush', cat:'Artistic', horizon:'someday', priority:'P4',
     why:'Written down so it stops taking up room in my head.',
     levels:['Holding the brush','A bamboo leaf','A rock','A mountain'], current:0},
  ],

  /* ---- the work, as it actually stands ---- */
  projects: [
    {key:'pr-instrument', name:'Life Instrument', status:'active', priority:'P1',
     description:'This. A single-file personal instrument for keeping a life legible to the person living it.',
     tags:['craft'], skills:['sk-build','sk-write'],
     phases:[
       {name:'Build the rooms', tasks:[['Rhythm, Finance, People', true], ['Three-zone navigation', true], ['Backgrounds and sound', true]]},
       {name:'Live in it for a week', tasks:[['Open it every morning without a reminder', false], ['Write one journal entry a day', false], ['Log every practice session', false], ['Note every place it gets in the way', false]]},
       {name:'Then, and only then, change it', tasks:[['Fix the three worst frictions from the week', false]]},
     ]},
    {key:'pr-bar', name:'The bar', status:'idea', priority:'P2',
     description:'Twelve seats and one idea. Currently a concept, and worth keeping honest about that.',
     tags:['bar'], skills:['sk-bar','sk-hosp'],
     phases:[
       {name:'The concept', tasks:[['Write the one paragraph that says what it is for', false], ['Name the twenty drinks', false], ['Decide: records or a playlist, and why', false], ['Visit five bars and write down what each one gets right', false]]},
       {name:'The numbers', tasks:[['Rent, licence, fit-out, stock — a real range, not a guess', false], ['What it has to take per night to survive', false], ['How many months of runway before it has to work', false]]},
       {name:'The room', tasks:[['Neighbourhoods, in order', false], ['What size room the concept actually needs', false]]},
     ]},
    {key:'pr-japan', name:'Japan, properly', status:'active', priority:'P2',
     description:'Turning a picture on a vision board into a date, a visa and an address.',
     tags:['japan'], skills:['sk-jp'],
     phases:[
       {name:'Find out what is true', tasks:[['Which visas am I actually eligible for', false], ['What does a month there really cost', false], ['Talk to two people who have done it', false]]},
       {name:'The language', tasks:[['Kana, both sets, cold', false], ['Thirty minutes a day for sixty days', false], ['One conversation with a real person', false]]},
       {name:'A date', tasks:[['Pick the month. Everything else follows a date.', false]]},
     ]},
    {key:'pr-rep', name:'The repertoire', status:'active', priority:'P1',
     description:'Standards I can play from memory. The list is short on purpose — it is meant to be true.',
     tags:['piano'], skills:['sk-piano'],
     phases:[
       {name:'Learning now', tasks:[['Autumn Leaves — melody, changes, one chorus', false], ['Blue Bossa — same', false]]},
       {name:'Next', tasks:[['All The Things You Are', false], ['There Will Never Be Another You', false]]},
       {name:'From memory, anywhere', tasks:[]},
     ]},
  ],

  /* ---- a compass drawn from what your choices show, not from what you told me ---- */
  values: [
    {key:'val-craft', name:'Craft', color:'#b08968',
     embody:'Doing one thing until it is actually good, rather than four things until they are passable.'},
    {key:'val-beauty', name:'Beauty', color:'#9a8fb8',
     embody:'It matters to me how a thing looks and sounds, even when nobody else will see it. That is not decoration; it is the point.'},
    {key:'val-freedom', name:'Freedom', color:'#6b7f8e',
     embody:'Arranging life so that the shape of the day is mine to set.'},
    {key:'val-presence', name:'Presence', color:'#7f916a',
     embody:'Being in the room I am in.'},
    {key:'val-depth', name:'Depth', color:'#a0727e',
     embody:'Fewer things, further in.'},
  ],

  /* ---- the questions, which are honest in a way that invented memories are not ---- */
  questions: [
    'Do I want the bar, or do I want the idea of the bar? What would tell me the difference?',
    'What would a year in Japan let me do that I cannot do from here? Name three things or drop it.',
    'Am I building this instrument because it helps, or because building it is easier than using it?',
    'Which of the three — Japan, the piano, the bar — would I be most sorry to have never tried?',
    'What am I practising that I am already comfortable with?',
  ],

  /* ---- sparks worth keeping ---- */
  ideas: [
    ['question', 'What is the one paragraph that says what the bar is for? #bar'],
    ['spark',    'A bar where the whole list is six drinks and they change every month. #bar'],
    ['spark',    'Records only. The constraint is the concept. #bar'],
    ['question', 'Which is the real bottleneck on Japan — money, language, or nerve? #japan'],
    ['experiment','Thirty minutes of piano before anything else, for two weeks, and see what it costs. #piano'],
    ['inspiration','The bars worth copying are all small, all specific, and none of them are trying to be liked by everyone. #bar'],
  ],

  /* ---- a shelf of things to get to, marked as wanted rather than read ---- */
  media: [
    {key:'md-drink', kind:'book',  title:'The Bar Book',            creator:'Jeffrey Morgenthaler', status:'wishlist', tags:['bar']},
    {key:'md-craft', kind:'book',  title:'Shokunin — books on Japanese craft and repetition', creator:'', status:'wishlist', tags:['japan','craft']},
    {key:'md-blue',  kind:'album', title:'Kind of Blue',            creator:'Miles Davis',          status:'wishlist', tags:['piano']},
    {key:'md-bill',  kind:'album', title:'Sunday at the Village Vanguard', creator:'Bill Evans Trio', status:'wishlist', tags:['piano']},
    {key:'md-totoro',kind:'film',  title:'My Neighbour Totoro',     creator:'Hayao Miyazaki',       status:'wishlist', tags:['japan']},
    {key:'md-spirit',kind:'film',  title:'Spirited Away',           creator:'Hayao Miyazaki',       status:'wishlist', tags:['japan']},
  ],

  /* ---- threads: the themes, which I can see from the outside ---- */
  threads: [
    {key:'th-room',  name:'A room of my own',  color:'#b08968', description:'The bar, the instrument, the desk. The recurring want is not any one of them — it is a space arranged entirely to my own taste.'},
    {key:'th-craft', name:'The craft thread',  color:'#7f916a', description:'Piano, language, ink, code. All of them are the same wager: that patient repetition beats talent.'},
    {key:'th-else',  name:'Somewhere else',    color:'#6b7f8e', description:'Japan is the current shape of it. It has probably had other shapes.'},
  ],

  /* ---- rooms left deliberately empty: I do not know your history and will not invent it ---- */
  stages: [
    {key:'st-before', char:'前', name:'Before this', hue:'#a0855a', years:'',
     tagline:'the years that made the rest make sense', narrative:''},
    {key:'st-now',    char:'今', name:'Now',         hue:'#7f916a', years:'',
     tagline:'the chapter I am actually in',           narrative:''},
  ],

  /* ---- money: a named, empty room for the one thing that already pays the
     bills, plus the two ventures already on the board — no current figures
     invented, since that would be a claim about your actual life, not a
     placeholder ---- */
  incomeStreams: [
    {key:'is-current', name:'Current work', status:'earning', currency:'',
     model:'Whatever already pays the bills — worth naming here, even before the numbers are filled in.'},
    {key:'is-write', name:'Freelance writing', status:'exploring', currency:'', target:500,
     model:'Building a portfolio from whatever comes out of the Writing Studio.'},
  ],

  /* ---- a life not yet lived can be priced without lying about the one you're in ---- */
  financeScenarios: [
    {key:'fs-tokyo', name:'Tokyo life', currency:'JPY',
     items:{
       'Housing':      [['Rent — a small one-room apartment', 90000]],
       'Food':         [['Groceries and the odd meal out', 45000]],
       'Transport':    [['Trains, mostly', 8000]],
       'Learning':     [['Language school', 60000]],
       'Experiences':  [['Somewhere new most weekends, modestly', 15000]],
     }},
  ],

};

/* ---------- applying it ---------- */
function starterCount(){
  const n = a => (a||[]).filter(x => x && x.seeded === STARTER_TAG).length;
  return n(S.visions) + n(S.skills) + n(S.projects) + n(S.values) + n(S.entries) + n(S.ideas) + n(S.threads) + n(S.stages)
    + n(S.incomeStreams) + n(S.finance?.scenarios);
}
function houseIsEmpty(){
  return !(S.visions||[]).length && !(S.skills||[]).length && !(S.projects||[]).length
      && !(S.values||[]).length && !(S.entries||[]).length && !(S.stages||[]).length;
}
/* Two to build and two to outgrow. The breaking pair carry the fields that
   make the difference between a rule and a replacement: what you do instead,
   what sets it off, and what to do the moment it hits. */
STARTER.habits = [
  {name:'Morning writing', icon:'✍', category:'creative', dimension:'mental', kind:'expenditure',
   timeOfDay:'morning', specificTime:'06:30', durationTarget:30,
   identity:'I am someone who writes before the world wakes up.',
   why:'Writing is how I digest a life. Without it, things pass through me undigested.',
   vision:'First light through the window, a draft taking shape that will become something I am proud of.',
   inaction:'Ideas stay formless. I stay a consumer rather than a maker.',
   rehearsal:'You sit down. The cursor blinks. You type one word, then another. Twenty minutes later there are five hundred.',
   cue:'After the coffee is poured', environment:'Desk, candle lit, phone in another room',
   min:'Open the document and write one sentence', ideal:'Thirty minutes without stopping',
   preRitual:'Pour the coffee, light the candle, close the door',
   postRitual:'One line about what came out',
   reward:'The first walk of the day', difficulty:3,
   progression:[{week:1,target:'10 minutes'},{week:2,target:'15 minutes'},{week:4,target:'20 minutes'},{week:8,target:'30 minutes'}],
   freq:{type:'daily',days:[],count:1}},
  {name:'Japanese study', icon:'あ', category:'mind', dimension:'mental', kind:'expenditure',
   timeOfDay:'afternoon', specificTime:'14:00', durationTarget:25,
   identity:'I am someone who is becoming fluent in Japanese.',
   why:'Japanese is the bridge to the life I am building.',
   vision:'Reading a newspaper on a Tokyo train without effort.',
   inaction:'The move stays a daydream instead of a plan.',
   cue:'After lunch', environment:'Anki open, timer set for one sitting',
   min:'Five cards', ideal:'Twenty-five minutes of review and new material',
   reward:'A proper coffee', difficulty:3,
   progression:[{week:1,target:'15 minutes of review'},{week:4,target:'25 minutes with new material'},{week:8,target:'30 minutes of immersion'}],
   freq:{type:'daily',days:[],count:1}},
  {name:'No doom-scrolling', icon:'🔓', negative:true, category:'mind', dimension:'mental', kind:'recovery',
   identity:'I am someone who chooses what enters my mind.',
   reframe:'I am no longer someone who numbs with infinite feeds. I am someone who sits with the quiet.',
   standard:'No feeds after ten at night',
   replacement:'Pick up the book on the desk, or write for five minutes',
   harm:'One to two hours a day. Fragments my attention. Leaves me drained rather than rested, and contradicts every value I claim about intention.',
   protocol:'1) Say it aloud: I notice the urge. 2) Phone face down. 3) Five slow breaths. 4) Pick up the book. 5) If it is still strong after two minutes, text someone.',
   triggers:[
     {id:'', type:'emotional', description:'After a stressful email or meeting', intensity:4, strategy:'Three breaths, then walk to the window'},
     {id:'', type:'temporal', description:'The ten o\'clock wind-down', intensity:3, strategy:'Phone charges in another room after half past nine'},
     {id:'', type:'situational', description:'Waiting for something — a bus, food, a person', intensity:2, strategy:'Always carry a book'}],
   freq:{type:'daily',days:[],count:1}},
  {name:'No late-night eating', icon:'🔓', negative:true, category:'health', dimension:'physical', kind:'recovery',
   identity:'I am someone who respects my body\'s rhythms.',
   reframe:'I no longer use food as padding for a feeling. I sit with what I feel.',
   standard:'Kitchen closed after nine',
   replacement:'Herbal tea, or five minutes of stretching',
   harm:'Wrecks the quality of my sleep, and teaches me that discomfort has to be soothed immediately.',
   protocol:'1) Brush your teeth — that is the signal eating is done. 2) Make chamomile. 3) If it persists, write for five minutes about what is underneath it.',
   triggers:[
     {id:'', type:'emotional', description:'Boredom or unease in the evening', intensity:3, strategy:'Name the feeling. Make the tea.'},
     {id:'', type:'temporal', description:'After nine', intensity:4, strategy:'Teeth brushed as the signal'}],
   freq:{type:'daily',days:[],count:1}},
];

function applyStarter(){
  const T = today(), stamp = new Date().toISOString();
  const has = (arr, key) => (arr||[]).some(x => x && x.seedKey === key);
  const skillId = {};

  STARTER.stages.forEach((st, i) => { if(has(S.stages, st.key)) return;
    S.stages.push({id:uid(), seeded:STARTER_TAG, seedKey:st.key, num:0, char:st.char, name:st.name, tagline:st.tagline,
      hue:st.hue, years:st.years, narrative:st.narrative, narrativeHistory:[], substages:[], photos:[], soundtrack:[],
      artifacts:[], letters:{to:'',from:''}, retroValues:{}, notyet:false}); });
  if(typeof renumberStages === 'function') renumberStages();

  STARTER.values.forEach(v => { if(has(S.values, v.key)) return;
    const rec = {id:'v-'+uid(), seeded:STARTER_TAG, seedKey:v.key, name:v.name, color:v.color,
      fields:{embody:[{date:T, text:v.embody}], hundred:[], motivation:[], counterfeit:[]}};
    S.values.push(rec); S.valueOrder.push(rec.id); });


  STARTER.skills.forEach(sk => {
    const existing = (S.skills||[]).find(x => x.seedKey === sk.key);
    if(existing){ skillId[sk.key] = existing.id; return; }
    const id = uid(); skillId[sk.key] = id;
    S.skills.push({id, seeded:STARTER_TAG, seedKey:sk.key, name:sk.name, cat:sk.cat, horizon:sk.horizon,
      priority:sk.priority, why:sk.why||'', startBy:sk.startBy||'', tags:[],
      levels:sk.levels.map((label, i) => ({number:i+1, label, description:'', criteria:[], resources:[], estimatedTime:'', targetDate:null})),
      currentLevel:sk.current, milestones:[], prereqs:[], planned:sk.horizon === 'someday'});
  });

  STARTER.projects.forEach(pr => { if(has(S.projects, pr.key)) return;
    S.projects.push({id:uid(), seeded:STARTER_TAG, seedKey:pr.key, name:pr.name, description:pr.description||'',
      tags:pr.tags||[], status:pr.status, priority:pr.priority, startDate:T, targetDate:'',
      phases:(pr.phases||[]).map(ph => ({id:uid(), name:ph.name, startDate:'', endDate:'',
        tasks:(ph.tasks||[]).map(([text, done]) => ({id:uid(), text, done:!!done, dueDate:null}))})),
      resources:[], linkedSkills:(pr.skills||[]).map(k => skillId[k]).filter(Boolean), linkedVisionEra:null,
      notes:'', link:'', income:{model:'', current:0, target:0, milestones:[]}, createdAt:T}); });

  STARTER.threads.forEach(th => { if(has(S.threads, th.key)) return;
    S.threads = S.threads || [];
    S.threads.push({id:uid(), seeded:STARTER_TAG, seedKey:th.key, name:th.name, desc:th.description, color:th.color, status:'active'}); });

  /* money: a named, empty "current work" room plus the two ventures already
     on the board — never a fabricated current-earnings figure */
  if(typeof migrateFinance === 'function') migrateFinance();
  STARTER.incomeStreams.forEach(is => { if(has(S.incomeStreams, is.key)) return;
    const income = {model:is.model||'', current:0, target:+is.target||0, milestones:[]};
    if(typeof migrateIncomeShape === 'function') migrateIncomeShape(income);
    income.status = is.status || income.status;
    S.incomeStreams.push(Object.assign({id:uid(), seeded:STARTER_TAG, seedKey:is.key, name:is.name}, income)); });
  const barProject = (S.projects||[]).find(p => p.seedKey === 'pr-bar');
  if(barProject && !barProject.income.model){
    if(typeof migrateIncomeShape === 'function') migrateIncomeShape(barProject.income);
    barProject.income.model = 'Twelve seats, one idea — no revenue yet, just the shape of one.';
    barProject.income.status = 'idea'; barProject.income.target = 8000;
  }
  if(typeof newSpendScenario === 'function') STARTER.financeScenarios.forEach(fs => {
    if((S.finance.scenarios||[]).some(sc => sc.seedKey === fs.key)) return;
    const sc = newSpendScenario(fs.name, fs.currency); sc.seeded = STARTER_TAG; sc.seedKey = fs.key;
    Object.entries(fs.items).forEach(([catName, items]) => { const cat = sc.categories.find(c => c.name === catName); if(!cat) return;
      items.forEach(([name, amount]) => cat.items.push({id:uid(), name, amount, currency:fs.currency, notes:''})); });
    S.finance.scenarios.push(sc);
  });

  const blank = (type, title, body, extra, tags) => ({id:uid(), seeded:STARTER_TAG, type, title, body:body||'',
    occurredAt:T, createdAt:stamp, media:[],
    links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[]},
    people:[], places:[], emotions:[], tags:tags||[], confidence:'', extra:extra||{}});

  STARTER.questions.forEach((q, i) => { const key = 'q-' + i; if(has(S.entries, key)) return;
    const e = blank('question', q, ''); e.seedKey = key; S.entries.push(e); });

  STARTER.media.forEach(md => { if(has(S.entries, md.key)) return;
    const e = blank('media', md.title, '', {kind:md.kind, status:md.status, rating:0, creator:md.creator||'', passages:[]}, md.tags);
    e.seedKey = md.key; S.entries.push(e); });

  STARTER.ideas.forEach(([kind, text], i) => { const key = 'idea-' + i; if(has(S.ideas, key)) return;
    S.ideas.unshift({id:uid(), seeded:STARTER_TAG, seedKey:key, text, kind, note:'', createdAt:stamp,
      tags: typeof parseTags === 'function' ? parseTags(text) : []}); });

  /* Four habits, two of each kind, filled in far enough that the fields mean
     something the first time they are seen. An empty habit page teaches
     nothing about what a habit here is for. */
  STARTER.habits.forEach((h, i) => { const key = 'hab-' + i; if(has(S.habits, key)) return;
    const rec = Object.assign(habitDefaults(), h, {id:uid(), seeded:STARTER_TAG, seedKey:key,
      order:S.habits.length, createdAt:stamp});
    S.habits.push(rec);
    if(typeof habDefaults === 'function') habDefaults(rec); });

  S.settings.starterApplied = stamp;
  saveNow();
}
function removeStarter(){
  const strip = name => { const arr = S[name]; if(!Array.isArray(arr)) return; S[name] = arr.filter(x => !(x && x.seeded === STARTER_TAG)); };
  const goneValues = (S.values||[]).filter(v => v.seeded === STARTER_TAG).map(v => v.id);
  ['stages','values','visions','skills','projects','threads','entries','ideas','incomeStreams','chapters'].forEach(strip);
  S.valueOrder = (S.valueOrder||[]).filter(id => !goneValues.includes(id));
  if(S.finance && Array.isArray(S.finance.scenarios)){
    const hadActive = S.finance.scenarios.some(sc => sc.seeded === STARTER_TAG && sc.active);
    S.finance.scenarios = S.finance.scenarios.filter(sc => sc.seeded !== STARTER_TAG);
    if(hadActive && S.finance.scenarios.length && !S.finance.scenarios.some(sc => sc.active)) S.finance.scenarios[0].active = true;
  }
  if(typeof renumberStages === 'function') renumberStages();
  S.settings.starterApplied = null;
  saveNow();
}
/* Offered once, and only into a house that is still empty — never on top of
   anything you have written yourself. */
function maybeOfferStarter(){
  if(S.settings.starterApplied || S.settings.starterDeclined) return;
  if(!houseIsEmpty()) return;
  S.settings.starterApplied = 'auto';
  applyStarter(); rerender();
  toast('Added a starter set — goals, skills, projects, a compass and some open questions, built from the vision board you described. All of it is editable, and Settings has one button that takes every bit of it back out.', 12000,
    {label:'take it out', fn:()=>{ removeStarter(); S.settings.starterDeclined = true; saveNow(); rerender(); toast('Gone. Nothing of yours was touched.'); }});
}
