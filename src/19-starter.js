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
  /* ---- the three things on the vision board, written as goals ---- */
  visions: [
    {key:'v-japan', name:'A year in Japan', era:'ahead', confidence:'exploring',
     successCriteria:'Not a trip. An address, a routine, a regular place, and enough language to be a person there rather than a guest.',
     nextAction:'Work out which visa is actually open to me, and what it costs.',
     sensory:{see:'A narrow street in the early evening. Wet asphalt, a vending machine, the light from a place that seats eight.',
              hear:'Rain, a train two streets away, someone practising an instrument badly and happily.',
              smell:'Dashi and cigarette smoke and cold air.',
              firstHour:'Wake somewhere quiet, walk to a coffee I have already made a habit of, sit down and write for an hour before anyone needs me.',
              who:'A handful of regulars whose names I know. One person I can call.',
              noLonger:'The version of me that keeps this as a daydream because a daydream cannot be got wrong.'},
     costs:'A year of savings, and being far from people who will not wait forever.',
     currentReality:'It has been on the board for a while. Nothing has been booked, applied for or priced.'},
    {key:'v-piano', name:'Play jazz piano well enough to sit in', era:'ahead', confidence:'plan',
     successCriteria:'Walk into a jam, call a standard, comp behind someone else without apologising, take a chorus, and want to do it again next week.',
     nextAction:'Pick one standard and learn it properly, in all twelve keys eventually but in two by the end of the month.',
     sensory:{see:'A room with the lights low and nobody watching very hard.',
              hear:'My own left hand not rushing.',
              smell:'',
              firstHour:'Sitting down without the sheet music and finding the tune is still there.',
              who:'Whoever else showed up. That is the point of a jam.',
              noLonger:'Practising the same eight bars I am already comfortable with.'},
     costs:'The hours. There is no version of this that is not hours.',
     currentReality:'Somewhere between wanting it and doing it.'},
    {key:'v-bar', name:'Open the bar', era:'ahead', confidence:'hunch',
     successCriteria:'A small room I chose everything in, open on a schedule I set, that pays for itself inside two years.',
     nextAction:'Write down what it is actually for — twelve seats and one idea — before anything else.',
     sensory:{see:'Warm light, dark wood, a back bar that is edited rather than stocked. Twelve seats, maybe fourteen.',
              hear:'A record, not a playlist. Conversation at a level where you can hear the person next to you.',
              smell:'Citrus peel and ice.',
              firstHour:'Cutting fruit before anyone arrives, with the door still locked and the music already on.',
              who:'Regulars. That is the whole business model.',
              noLonger:'Talking about it as a thing I would do one day.'},
     costs:'Capital, a licence, and the years where it is the only thing you do.',
     currentReality:'An idea I keep coming back to, which is itself information.'},
    {key:'v-instrument', name:'Life Instrument, finished enough to live in', era:'now', confidence:'in motion',
     successCriteria:'I open it every morning without being reminded to, and it tells me something I did not already know.',
     nextAction:'Use it for a full week before adding anything else to it.',
     sensory:{see:'', hear:'', smell:'', firstHour:'', who:'', noLonger:'Building the tool instead of living the life it is for.'},
     costs:'Every hour spent on the instrument is an hour not spent on the three above.',
     currentReality:'Built and running. Barely used.'},
  ],

  /* ---- the skills those goals actually require ---- */
  skills: [
    {key:'sk-piano', name:'Jazz piano', cat:'Creative', horizon:'focus', priority:'P1',
     why:'Because sitting in at a jam is the only item on the board I can start today, alone, for free.',
     levels:['Reading and voicings','Comping through a standard','Soloing over changes','Playing with people','Sitting in anywhere'], current:1},
    {key:'sk-jp', name:'Japanese', cat:'Languages', horizon:'focus', priority:'P1',
     why:'A year there is a holiday without it and a life with it.',
     levels:['Kana and survival phrases','Simple conversation','Reading a menu and a sign','Holding a real conversation','Being a person, not a guest'], current:1},
    {key:'sk-bar', name:'Bartending and mixology', cat:'Craft', horizon:'next', priority:'P2',
     why:'You cannot own a room you cannot work.', startBy:'',
     levels:['The classics, made correctly','Speed and consistency','Building a drink from scratch','Running a service alone','Designing a list'], current:0},
    {key:'sk-build', name:'Building things on the web', cat:'Technical', horizon:'active', priority:'P2',
     why:'This instrument exists because of it, and the next thing will too.',
     levels:['Making it work','Making it readable','Making it fast','Making it something other people can use'], current:2},
    {key:'sk-write', name:'Writing', cat:'Creative', horizon:'active', priority:'P3',
     why:'Everything here — the journals, the chronicle, the Writing room — is downstream of being able to say what I mean.',
     levels:['Getting it down','Getting it clear','Getting it good','Getting it read'], current:2},
    {key:'sk-hosp', name:'Running a room', cat:'Social', horizon:'someday', priority:'P3',
     why:'The bar is not a drinks problem. It is a hospitality problem.',
     levels:['Reading a room','Regulars','Staff','Ownership'], current:0},
    {key:'sk-ink', name:'Ink and brush', cat:'Craft', horizon:'someday', priority:'P4',
     why:'Written down so it stops taking up room in my head.',
     levels:['Holding the brush','A bamboo leaf','A rock','A mountain'], current:0},
  ],

  /* ---- the work, as it actually stands ---- */
  projects: [
    {key:'pr-instrument', name:'Life Instrument', status:'active', priority:'P1',
     description:'This. A single-file personal instrument for keeping a life legible to the person living it.',
     tags:['craft'], skills:['sk-build','sk-write'],
     phases:[
       {name:'Build the rooms', tasks:[['Rhythm, Finance, People, Chronicle', true], ['Three-zone navigation', true], ['Backgrounds and sound', true]]},
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
};

/* ---------- applying it ---------- */
function starterCount(){
  const n = a => (a||[]).filter(x => x && x.seeded === STARTER_TAG).length;
  return n(S.visions) + n(S.skills) + n(S.projects) + n(S.values) + n(S.entries) + n(S.ideas) + n(S.threadsN) + n(S.stages);
}
function houseIsEmpty(){
  return !(S.visions||[]).length && !(S.skills||[]).length && !(S.projects||[]).length
      && !(S.values||[]).length && !(S.entries||[]).length && !(S.stages||[]).length;
}
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

  STARTER.visions.forEach(v => { if(has(S.visions, v.key)) return;
    S.visions.push({id:uid(), seeded:STARTER_TAG, seedKey:v.key, name:v.name, era:v.era, parentId:null,
      status:'pending', phase:'in-progress', progress:0, startedAt:T, completedAt:'',
      successCriteria:v.successCriteria||'', reflection:'', archived:false, confidence:v.confidence||'hunch',
      nextAction:v.nextAction||'', sensory:Object.assign({see:'',hear:'',smell:'',firstHour:'',who:'',noLonger:''}, v.sensory||{}),
      futureMemory:'', futureMemoryHistory:[], costs:v.costs||'', currentReality:v.currentReality||'',
      currentRealityHistory:[], resistance:[], preSkills:[], selfImage:'', values:[], obituary:'', evidence:[],
      feeling:0, targetDate:'', location:'', money:'', createdAt:T}); });

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

  STARTER.threads.forEach(th => { if(has(S.threadsN, th.key)) return;
    S.threadsN = S.threadsN || [];
    S.threadsN.push({id:uid(), seeded:STARTER_TAG, seedKey:th.key, name:th.name, description:th.description, color:th.color}); });

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

  S.settings.starterApplied = stamp;
  saveNow();
}
function removeStarter(){
  const strip = name => { const arr = S[name]; if(!Array.isArray(arr)) return; S[name] = arr.filter(x => !(x && x.seeded === STARTER_TAG)); };
  const goneValues = (S.values||[]).filter(v => v.seeded === STARTER_TAG).map(v => v.id);
  ['stages','values','visions','skills','projects','threadsN','entries','ideas'].forEach(strip);
  S.valueOrder = (S.valueOrder||[]).filter(id => !goneValues.includes(id));
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
