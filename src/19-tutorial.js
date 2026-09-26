/* ============================================================
   WORKED EXAMPLES — a tutorial by example, in every room.

   An empty room teaches nothing about what it is for. These are examples
   written to show each room in use: a reflection that links to a person, a
   decision that comes back for review in a month, a letter sealed for a
   year, a list with a milestone and a task that carries both dates, a
   Knowledge Tree page with a position held at a stated confidence and a
   sealed prediction, a deck with a cloze card, a score with its sections and
   its bar notes, a song half written, a Japanese topic with its chunks.

   They are written by the assistant that built the house, as examples, and
   say so: every one is titled "Example ·", tagged #example, and stamped
   seeded:'tutorial'. Settings → Worked examples takes every one of them out
   in one action and touches nothing you wrote — including the records that
   are otherwise add-only (a Knowledge Tree position, a sealed prediction):
   an example's rows are the one exception the guards make, because they
   were never yours. Nothing is added to the Writing Studio, and no habit is
   logged: a logged day is not something to invent for somebody.
   ============================================================ */
const TUTORIAL_TAG = 'tutorial';
const TUT = 'Example · ';

function tutorialCount(){
  const n = a => (a || []).filter(x => x && x.seeded === TUTORIAL_TAG).length;
  const pl = S.planning || {};
  let c = n(S.entries) + n(S.tasks) + n(S.people) + n(S.interactions) + n(S.timeEntries) + n(pl.lists) + n(S.treeNodes) + n(S.treeInbox)
    + n(S.scores) + n((S.brand || {}).accounts) + n((S.songwriting || {}).songs) + n((S.songwriting || {}).seeds)
    + n((S.japanese || {}).islands) + n((S.japanese || {}).errors) + n(S.ideas) + n(S.visions);
  Object.values(((S.jazz || {}).progress) || {}).forEach(r => c += n(r.logs));
  c += (S.settings && S.settings.tutorialDeckNotes || []).length;
  return c;
}
function tutD(days){ return addDays(today(), days); }
function tutIso(days, hh, mm){ const d = new Date(tutD(days) + 'T00:00:00'); d.setHours(hh || 9, mm || 0, 0, 0); return d.toISOString(); }
function tutEntry(type, title, body, extra, opts){
  const o = opts || {};
  return {id: uid(), seeded: TUTORIAL_TAG, seedKey: o.key || ('t-' + type + '-' + title.slice(0, 12)), type, title: TUT + title, body: body || '',
    occurredAt: o.occurredAt || tutD(o.day || 0), createdAt: tutIso(o.day || 0, 21), media: [],
    links: Object.assign({stages: [], substages: [], threads: [], values: [], visions: [], skills: [], projects: [], people: []}, o.links || {}),
    people: [], places: o.places || [], emotions: o.emotions || [], tags: ['example'].concat(o.tags || []), confidence: '', extra: extra || {}};
}
/* a small score, written out here so the example needs no file: a tune over I–vi–ii–V in C, two hands */
function tutScoreXml(){
  const mel = [['E5', 'D5', 'C5', 'G4'], ['A4', 'C5', 'E5', 'D5'], ['F4', 'A4', 'D5', 'C5'], ['B4', 'D5', 'G4', 'B4'],
    ['C5', 'E5', 'G5', 'E5'], ['A4', 'C5', 'A4', 'E4'], ['D4', 'F4', 'A4', 'C5'], ['B4', 'G4', 'D5', 'B4'],
    ['E5', 'G5', 'E5', 'C5'], ['C5', 'A4', 'E5', 'C5'], ['F5', 'D5', 'A4', 'F4'], ['G4', 'B4', 'D5', 'F5'],
    ['E5', 'D5', 'C5', 'B4'], ['A4', 'C5', 'E5', 'A5'], ['D5', 'F5', 'B4', 'D5'], ['C5']];
  const bass = [['C3', 'G3'], ['A2', 'E3'], ['D3', 'A3'], ['G2', 'D3'], ['C3', 'G3'], ['A2', 'E3'], ['D3', 'A3'], ['G2', 'F3'],
    ['C3', 'E3'], ['A2', 'C3'], ['D3', 'F3'], ['G2', 'B2'], ['C3', 'G3'], ['A2', 'E3'], ['G2', 'F3'], ['C3']];
  const harm = [['C', 'major'], ['A', 'minor-seventh'], ['D', 'minor-seventh'], ['G', 'dominant']];
  const note = (p, dur, type, staff, voice) => { const m = /^([A-G])(\d)$/.exec(p);
    return `<note><pitch><step>${m[1]}</step><octave>${m[2]}</octave></pitch><duration>${dur}</duration><voice>${voice}</voice><type>${type}</type><staff>${staff}</staff></note>`; };
  let body = '';
  mel.forEach((bar, i) => {
    const last = i === mel.length - 1;
    const [root, kind] = harm[i % 4];
    body += `<measure number="${i + 1}">` + (i === 0 ? '<attributes><divisions>1</divisions><key><fifths>0</fifths><mode>major</mode></key><time><beats>4</beats><beat-type>4</beat-type></time><staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes><direction placement="above"><direction-type><words>Moderately</words></direction-type><sound tempo="88"/></direction>' : '')
      + `<harmony><root><root-step>${last ? 'C' : root}</root-step></root><kind>${last ? 'major' : kind}</kind></harmony>`
      + (last ? note(bar[0], 4, 'whole', 1, 1) : bar.map(p => note(p, 1, 'quarter', 1, 1)).join(''))
      + '<backup><duration>4</duration></backup>'
      + (last ? note(bass[i][0], 4, 'whole', 2, 5) : bass[i].map(p => note(p, 2, 'half', 2, 5)).join(''))
      + (last ? '<barline location="right"><bar-style>light-heavy</bar-style></barline>' : '') + '</measure>';
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1"><work><work-title>Example · Etude on I–vi–ii–V</work-title></work><identification><creator type="composer">Worked example</creator></identification>
<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${body}</part></score-partwise>`;
}

/* ---------- putting them in ---------- */
async function applyTutorial(){
  const has = (arr, key) => (arr || []).some(x => x && x.seedKey === key);
  const T = today();
  const out = {rooms: []};
  const room = (name, fn) => { try { fn(); out.rooms.push(name); } catch(e){ console.warn('tutorial: ' + name, e); } };

  /* the people first, so the entries can name them */
  const ppl = {};
  room('People', () => {
    if(!Array.isArray(S.people)) S.people = [];
    if(!Array.isArray(S.interactions)) S.interactions = [];
    [{key: 'p-mika', name: TUT + 'Mika', relationship: 'teacher', circle: 'close', tags: ['japanese'], birthday: '1990-04-12', desiredFrequency: 7,
      installed: 'That a mistake said out loud is worth ten sentences rehearsed in my head.', becomeAround: 'Braver in a second language.',
      notes: 'Tuesday conversation tutor. Former hotel concierge in Kyoto; laughs at my keigo, kindly.', interests: ['tea ceremony', 'Showa-era jazz kissa'],
      gift: ['Patience with my particles'], giftIdeas: ['A record from the kissa in the Library'],
      talks: [[-6, 'call', 'Talked through my "why Japan" monologue. Corrected は/が twice, and taught me 〜てみる.'], [-13, 'call', 'First lesson. She asked what I would order at a bar in Tokyo; I could not say it.']]},
     {key: 'p-dan', name: TUT + 'Dan', relationship: 'friend', circle: 'core', tags: ['piano', 'bar'], desiredFrequency: 14,
      installed: 'Play the melody before you play anything clever over it.', becomeAround: 'Looser. Less precious about getting it right.',
      notes: 'Plays bass at the Thursday jam. Has stood behind a bar for ten years; the person to ask about the twelve-seat idea.', interests: ['upright bass', 'mezcal'],
      gift: ['Honest feedback'], giftIdeas: ['Tickets to the next trio at the Blue Note'],
      talks: [[-3, 'met_in_person', 'Sat in on "Autumn Leaves" at the jam. He said my comping rushes into bar 5.'], [-18, 'text', 'Sent him the drink list draft. He cut it from twenty to twelve.']]},
     {key: 'p-rose', name: TUT + 'Grandma Rose', relationship: 'family', circle: 'core', tags: ['family'], birthday: '1941-11-02', desiredFrequency: 10,
      installed: 'Write things down. Memory is a liar with good manners.', becomeAround: 'Slower, in the good way.',
      notes: 'Taught me my first scale on her upright. Calls on Sundays.', interests: ['crosswords', 'Ella Fitzgerald'], gift: ['The first piano'], giftIdeas: ['A framed page of the first piece I learn from memory'],
      talks: [[-7, 'call', 'Sunday call. She played "Misty" down the phone and asked me to learn it for her birthday.']]}]
    .forEach(p => { if(has(S.people, p.key)) { ppl[p.key] = S.people.find(x => x.seedKey === p.key).id; return; }
      const rec = Object.assign(newPerson(p.name), {seeded: TUTORIAL_TAG, seedKey: p.key, relationship: p.relationship, circle: p.circle, tags: p.tags, birthday: p.birthday || null,
        installed: [{date: tutD(-30), text: p.installed}], becomeAround: p.becomeAround, gift: [{date: tutD(-30), text: p.gift[0]}], giftIdeas: p.giftIdeas.slice(), desiredFrequency: p.desiredFrequency});
      rec.details.notes = p.notes; rec.details.interests = p.interests;
      S.people.push(rec); ppl[p.key] = rec.id;
      p.talks.forEach(([d, type, description]) => S.interactions.push({id: uid(), seeded: TUTORIAL_TAG, personId: rec.id, date: tutD(d), type, description, createdAt: tutIso(d, 20)}));
      rec.lastInteraction = tutD(Math.max(...p.talks.map(t => t[0])));
    });
  });

  /* the Lived Record: one of nearly every kind, each saying what it shows */
  room('Lived Record', () => {
    const add = (e) => { if(has(S.entries, e.seedKey)) return; S.entries.push(e); };
    add(tutEntry('reflection', 'What the first fortnight of practice taught me',
      'Two weeks of thirty minutes a day at the piano. What changed was not my hands but my patience: on day three I wanted to skip the slow shells in all twelve keys, and on day twelve they were the part I looked forward to.\n\nWhat I keep noticing: I practise the keys I already like (C, F, B♭) and avoid the ones that feel like wading (B, E, F♯). The Jazz Studio\'s key picker shows it plainly — three keys marked, nine not.\n\nNext fortnight: start every sitting in the worst key.\n\n— This is an example reflection. A reflection can link to people, skills and projects (the chips above), and it turns up again in the Timeline and the Review.',
      {}, {key: 't-refl', day: -2, tags: ['practice'], links: {people: [ppl['p-dan']].filter(Boolean)}, emotions: ['determined']}));
    add(tutEntry('gratitude', 'Three small things',
      '1. Mika laughing at my keigo instead of correcting it straight away.\n2. The rain stopping exactly as I left the jam.\n3. Grandma playing "Misty" down the phone, slightly out of tune, perfectly in time.\n\n— An example gratitude entry. Three specific things beat ten vague ones; the Gratitude journal keeps a running count by week.',
      {}, {key: 't-grat', day: -1, links: {people: [ppl['p-mika'], ppl['p-rose']].filter(Boolean)}}));
    add(tutEntry('dream', 'The piano with no black keys',
      'I was at a jam in a bar that was also a train carriage. When it was my turn the piano had no black keys, only white ones, going on for ever to the right. Dan said "just play it in C then", and I woke up before I could.\n\nFeeling on waking: amused, a little anxious.\n\n— An example dream. Symbols you name (below) are tracked across dreams, so a recurring train or a recurring piano shows up in the Dreams journal as a pattern.',
      {symbols: ['train', 'piano', 'endless keyboard'], lucid: false}, {key: 't-dream', day: -3, emotions: ['anxious', 'amused']}));
    add(tutEntry('synchronicity', 'The same record, three times in a day',
      'Morning: "Kind of Blue" playing in the café. Afternoon: Mika mentions a kissa in Kyoto that plays only Miles. Evening: the jam opens with "So What".\n\nNo claim that it means anything. Written down because it happened, and because the pattern, if there is one, only shows when the instances are kept.\n\n— An example synchronicity. The house counts them and shows the clusters on the Timeline.',
      {}, {key: 't-sync', day: -5, tags: ['music']}));
    add(tutEntry('manifestation', 'A twelve-seat room with a piano in the corner',
      'The picture: a narrow room, dark wood, twelve stools, a small upright against the back wall. Records on a shelf behind the bar. A handwritten list of twelve drinks.\n\nWhat would make it more real this month: one conversation with someone who has opened a bar (Dan), and the numbers for rent in two neighbourhoods.\n\n— An example manifestation. Its status moves from seed to emerging to arrived as the picture comes true, and you can look back at how specific it was when you first wrote it.',
      {status: 'emerging'}, {key: 't-manif', day: -10, tags: ['bar']}));
    add(tutEntry('decision', 'Practise in the morning, not the evening',
      'Options I weighed:\n• Evenings, after work — more time, but tired, and anything social cancels it.\n• Mornings, before work — thirty minutes only, but nothing competes with it.\n\nChose mornings. Reasoning: consistency beats length at this stage, and evenings keep getting eaten.\n\nWhat would tell me I was wrong: if after a month the morning sitting is still under twenty minutes on most days.\n\n— An example decision. It comes back to you on its review date (in a month) and asks how it turned out, so you can see how good your decisions were rather than how they felt.',
      {reviewOn: tutD(30), reviewedAt: '', confidence: '70', reasoning: 'Consistency beats length.'}, {key: 't-dec', day: -14}));
    add(tutEntry('letter', 'To me, a year from now',
      'Dear you,\n\nBy the time this opens you will either have played at the jam without your hands shaking, or you will not have. Either way: did you keep going in the keys you hated?\n\n— An example sealed letter. It cannot be opened until its date; on that day it appears on Today, and you can write back.',
      {sealedUntil: tutD(365), openedAt: '', reply: ''}, {key: 't-letter', day: -9}));
    add(tutEntry('quote', 'On practice',
      '"Practice is the thing, not the preparation for the thing."',
      {author: 'George Leonard', source: 'Mastery'}, {key: 't-quote', day: -8, tags: ['practice']}));
    add(tutEntry('question', 'What would the bar be for, if it made no money?',
      'Not rhetorical. If the answer is "nothing", it is a business plan; if it is "a room where people listen", it is something else, and the numbers have to serve that.\n\n— An example open question. Questions stay open on purpose; add notes to them over months, and the Knowledge Tree can take one up as a page.',
      {}, {key: 't-q', day: -4, tags: ['bar']}));
    add(tutEntry('intuition', 'Say yes to the Thursday jam',
      'A pull, not a reason: go this week, even unprepared. Rating the hunch now so I can check it later — 7 out of 10 that it goes fine.\n\n— An example intuition. Rate how strong it felt; later mark whether it was right, and the Review shows how often your hunches are.',
      {strength: 7}, {key: 't-intu', day: -4}));
    add(tutEntry('memory', 'The first scale on Grandma\'s upright',
      'Summer I was seven. The piano had a sticking F and smelled of polish. She put my thumb on middle C and said "all the way up, and don\'t look at your hands". I looked at my hands.\n\n— An example memory. Give it the date it happened (not today) and it takes its place on the Timeline, in the life stage it belongs to.',
      {}, {key: 't-mem', occurredAt: String(new Date().getFullYear() - 25) + '-07-15', day: -20, links: {people: [ppl['p-rose']].filter(Boolean)}}));
    add(tutEntry('progress', 'Shells in all twelve keys, slowly',
      'Rootless shells (3rd and 7th) for ii–V–I, all twelve keys at ♩ = 60, no stops. Took eleven minutes. Last week it did not happen at all.\n\n— An example progress note. Progress entries feed the Skill Tree: link one to a skill and its blossom counts it.',
      {}, {key: 't-prog', day: -1, tags: ['piano']}));
    add(tutEntry('visualization', 'The first night of the jam, from the stool',
      'The count-off. Dan nods. My left hand finds the shell for Cm7 without looking. Two choruses, and nobody is waiting for me to finish.\n\n— An example visualization, for the Morning Theatre: rehearse it in detail, in the present tense, and it will be offered back to you on mornings you choose.',
      {}, {key: 't-vis', day: -6}));
    /* the Library: a finished book with a passage, and a film to get to */
    add(tutEntry('media', 'Mastery — George Leonard',
      'Finished. The plateau chapter is the whole book: most of practice is flat, and the people who get good are the ones who learn to like the flat part.',
      {kind: 'book', creator: 'George Leonard', year: '1991', status: 'finished', rating: 4, resonanceLevel: 4, passages: [{id: uid(), text: 'The master is the one who stays on the path day after day, year after year.', page: '', note: 'For the shells in B.'}], quotes: [], urls: []},
      {key: 't-book', day: -12, tags: ['practice']}));
    add(tutEntry('media', 'Jiro Dreams of Sushi',
      'On the list because a twelve-seat room run by one person for decades is exactly the question the bar is asking.',
      {kind: 'film', creator: 'David Gelb', year: '2011', status: 'want', rating: 0, resonanceLevel: null, passages: [], quotes: [], urls: []},
      {key: 't-film', day: -2, tags: ['bar']}));
  });

  /* Planning: a list with a milestone, tasks with both dates, subtasks, a reminder, a thing to buy */
  room('Planning', () => {
    if(typeof planState !== 'function') return;
    const p = planState();
    let list = p.lists.find(l => l.seedKey === 't-list');
    if(!list){ list = planNewList(TUT + 'Tokyo, properly'); list.seeded = TUTORIAL_TAG; list.seedKey = 't-list'; }
    const ms = list.milestones && list.milestones.find(m => m.seedKey === 't-ms') || planAddMilestone(list.id, {name: 'Visa application in', date: tutD(45)});
    if(ms){ ms.seedKey = 't-ms'; ms.note = 'Everything on this list is on its way to this date.'; }
    const mk = (key, text, extra) => { if(has(S.tasks, key)) return;
      const t = newPlanTask(text, extra.day || '', Object.assign({listId: list.id}, extra));
      t.seeded = TUTORIAL_TAG; t.seedKey = key; S.tasks.push(t); };
    mk('t-t1', TUT + 'Find out which visa I actually qualify for', {day: tutD(10), doDay: tutD(1), priority: 3, quadrant: 1, milestoneId: ms && ms.id, tags: ['japan'], timeCategory: 'study',
      desc: 'Due in ten days (the deadline); planned for tomorrow (the do date). The two dates answer different questions — when it is owed, and when you will sit down with it.',
      subtasks: [['Read the embassy page, all of it', true], ['List the documents each visa needs', false], ['Email Mika the two questions she offered to answer', false]].map(([title, done], i) => ({id: uid(), title, isCompleted: done, completedAt: done ? new Date().toISOString() : null, sortOrder: i}))});
    mk('t-t2', TUT + 'What does a month in Tokyo really cost', {day: tutD(20), priority: 2, quadrant: 2, milestoneId: ms && ms.id, tags: ['japan', 'money'],
      desc: 'Important, not urgent — the matrix puts it top right. Those are the tasks that get lost if nothing protects them.'});
    mk('t-t3', TUT + 'Book the Tuesday lesson with Mika', {day: tutD(2), priority: 1, quadrant: 3, remind: true, remindLead: 1, dueTime: '18:00', tags: ['japanese'],
      desc: 'A reminder: it rings on the day before, and shows on Today until it is ticked.'});
    mk('t-t4', TUT + 'Scan the passport', {doDay: T, priority: 1, tags: ['japan'], duration: 10, desc: 'Ten minutes, today. A task can carry an estimate; the focus timer counts down from it.'});
    mk('t-t5', TUT + 'Kana: both sets, cold, three days running', {day: tutD(-3), done: true, doneAt: tutIso(-3, 20), priority: 2, tags: ['japanese'], desc: 'Done — finished tasks drop out of the way unless "show done" is on.'});
    mk('t-shop', TUT + 'Manuscript paper', {shop: true, desc: 'Something to buy: it lives on the shopping list, not in the matrix.'});
    mk('t-inbox', TUT + 'Ask Dan what the twelve-seat bar in Shinjuku was called', {listId: 'inbox', doDay: tutD(1),
      desc: 'Anything added quickly lands in the Inbox, to be placed later.'});
  });

  /* the clock: sittings over the last few days, in categories, some linked to what they were for */
  room('Time', () => {
    if(typeof timeEntryDefaults !== 'function') return;
    if(!Array.isArray(S.timeEntries)) S.timeEntries = [];
    [['t-tm1', -1, 7, 0, 35, 'piano', 'Shells, all twelve keys, then "Autumn Leaves" head'],
     ['t-tm2', -1, 13, 10, 25, 'japanese', 'Island: why Japan — three deliveries (4/3/2)'],
     ['t-tm3', -2, 7, 5, 30, 'piano', 'Charleston comping, ♩ = 100'],
     ['t-tm4', -2, 21, 30, 40, 'reading', 'Mastery, chapters 8–10'],
     ['t-tm5', -3, 19, 0, 90, 'social', 'The Thursday jam'],
     ['t-tm6', 0, 7, 0, 30, 'piano', 'Etude on I–vi–ii–V, bars 5–8 hands together']]
    .forEach(([key, d, hh, mm, mins, cat, what]) => { if(has(S.timeEntries, key)) return;
      const start = tutIso(d, hh, mm);
      S.timeEntries.push(timeEntryDefaults({id: uid(), seeded: TUTORIAL_TAG, seedKey: key, what: TUT + what, startTime: start, endTime: new Date(Date.parse(start) + mins * 60000).toISOString(),
        categoryId: cat, source: 'manual', tags: ['example'], notes: []})); });
  });

  /* Repertoire: a score, its sections with tempos, notes on bars, and sittings */
  room('Repertoire', () => {
    if(typeof addScore !== 'function') return;
    if(!Array.isArray(S.scores)) S.scores = [];
    if(has(S.scores, 't-score')) return;
    const x = addScore({title: TUT + 'Etude on I–vi–ii–V', composer: 'Worked example', musicXml: tutScoreXml(), familiar: 'learning'});
    x.seeded = TUTORIAL_TAG; x.seedKey = 't-score'; x.totalMeasures = 16;
    const secs = [
      {name: 'A — the question', startMeasure: 1, endMeasure: 4, status: 'solid', targetTempo: 96, comfortTempo: 88, notes: 'Melody sings; left hand stays under it. Sections carry two tempos — where you want to be and where you are — and the gap closing is the proof the slow practice works.'},
      {name: 'A′ — the answer', startMeasure: 5, endMeasure: 8, status: 'working', targetTempo: 96, comfortTempo: 72, notes: 'Bar 7: the leap to C5 is late every time. Practise it as a pair with bar 8.'},
      {name: 'B — the climb', startMeasure: 9, endMeasure: 12, status: 'not_started', targetTempo: 96, notes: 'Not started. Press "focus" on a section to practise only it, with the metronome and the loop.'},
      {name: 'Coda', startMeasure: 13, endMeasure: 16, status: 'not_started', targetTempo: 88, notes: 'Slow the last two bars by feel; the final C held a full bar.'}];
    const colors = typeof SCORE_COLORS !== 'undefined' ? SCORE_COLORS.map(c => c[0]) : [];
    secs.forEach((s, i) => { const r = addScoreSection(x.id, Object.assign({}, s, {color: colors[i % Math.max(1, colors.length)]})); if(r){ r.practiceCount = [6, 3, 0, 0][i]; r.lastPracticedDate = i < 2 ? tutD(-1) : null; } });
    x.pins = [{measure: 7, text: 'The leap: look at the C before you play the A.'}, {measure: 12, text: 'G7 — let the F in the melody lean into the E of bar 13.'}].map(p => scorePinDefaults(Object.assign({id: uid()}, p)));
    x.practice = [[-3, 20, 'Hands separately, bars 1–8', 72, 'Left hand is the problem, not the right.'], [-1, 25, 'Bars 5–8 hands together', 76, 'Bar 7 is a fingering problem: 1 on the A, not 2.'], [0, 30, 'Whole A section at 80', 80, 'Two clean runs. Bar 7 still the risk.']]
      .map(([d, minutes, focus, tempo, discoveries]) => scorePracticeDefaults({id: uid(), date: tutD(d), minutes, focus, tempo, discoveries, quality: 'improving', sections: []}));
  });

  /* Knowledge Tree: a root, a branch, two points, positions, a graft, an inbox capture, an experiment */
  const treeIds = {};
  room('Knowledge Tree', () => {
    if(typeof treeSavePage !== 'function') return;
    treeEnsure();
    const page = (key, draft) => { const old = S.treeNodes.find(n => n.seedKey === key); if(old){ treeIds[key] = old.id; return old; }
      const r = treeSavePage(Object.assign({}, draft, {title: TUT + draft.title})); if(r.error) throw new Error(r.error);
      r.node.seeded = TUTORIAL_TAG; r.node.seedKey = key; treeIds[key] = r.node.id; return r.node; };
    const root = page('k-root', {kind: 'root', title: 'How does a skill actually grow?', body: 'A root is one of the great questions you keep coming back to. Everything under it is a branch or a point, and every point has one home.\n\nThis example root holds what I think about practice.', openQuestion: 'Is talent mostly the ability to practise well?'});
    const br = page('k-branch', {kind: 'branch', parentId: root.id, title: 'Practice', body: 'What makes an hour at the instrument count. See [[Example · Spacing beats cramming]] and [[Example · Feedback makes practice deliberate]]; a link to a page that does not exist yet, like [[Example · The plateau]], shows red and starts it when clicked.'});
    const p1 = page('k-p1', {kind: 'point', parentId: br.id, title: 'Spacing beats cramming', body: 'Thirty minutes on six days beats three hours on one. The forgetting between sittings is part of the learning, not a leak in it.\n\nFeeds: the morning decision in the Lived Record, and the Study Deck, which is built on this idea.', openQuestion: 'Does it hold for motor skills as strongly as for facts?'});
    const p2 = page('k-p2', {kind: 'point', parentId: br.id, title: 'Feedback makes practice deliberate', body: 'Playing through a piece is not practice; finding the bar that fails and fixing it is. Without something telling you what went wrong — a teacher, a recording, the Play-it strip — repetition only grooves the mistake.', openQuestion: 'Can recording myself replace a teacher, or only point at where one is needed?'});
    const pos = (nodeId, statement, confidence, day) => { if(S.treePositions.some(x => x.nodeId === nodeId && x.seeded === TUTORIAL_TAG && x.statement === statement)) return;
      S.treePositions.push(Object.freeze({id: uid(), nodeId, date: tutIso(day, 21), statement, confidence, seeded: TUTORIAL_TAG})); };
    pos(p1.id, 'Spaced practice beats massed practice for keeping what I learn, and roughly as well for learning it.', 70, -20);
    pos(p1.id, 'Spaced practice beats massed practice, and the effect is larger than I thought — two weeks of short sittings moved more than the long weekend did.', 85, -2);
    pos(p2.id, 'Feedback within seconds matters more than the amount of practice.', 60, -5);
    if(!S.treeGrafts.some(g => g.seeded === TUTORIAL_TAG)){ const g = treeAddGraft(p2.id, p1.id, 'extends', 'Spacing decides when to practise; feedback decides what to do in the sitting. Together they are most of what "deliberate" means.'); if(g.graft) g.graft.seeded = TUTORIAL_TAG; }
    if(!S.treeInbox.some(x => x.seeded === TUTORIAL_TAG)){ const c = treeCapture(TUT + 'Is the plateau a real thing, or just what slow progress feels like from inside? (captured with Alt+K from anywhere; it waits here to be given a page)'); if(c) c.seeded = TUTORIAL_TAG; }
    if(!S.treeExperiments.some(x => x.seeded === TUTORIAL_TAG) && typeof treeAddExperiment === 'function'){ const r = treeAddExperiment(p2.id, {trials: 20, hits: 13, chanceRate: 0.5, date: tutD(-4), method: 'Recorded twenty takes of bar 7; before listening, guessed whether each was clean. Checked against the recording.', notes: 'An example experiment: hits against chance, with an exact binomial p-value.'}); if(r.experiment) r.experiment.seeded = TUTORIAL_TAG; }
    treeDirty && treeDirty();
  });

  /* Brand Strategy: an account with its charter, voice and pillars, and a handful of notes */
  room('Brand Strategy', () => {
    if(typeof brandState !== 'function') return;
    const b = brandState();
    let a = b.accounts.find(x => x.seedKey === 't-acct');
    if(!a){
      a = brandNewAccount(TUT + 'The Listening Room');
      Object.assign(a, {seeded: TUTORIAL_TAG, seedKey: 't-acct', handle: '@listeningroom', platforms: ['Newsletter', 'Instagram']});
      a.charter = {purpose: 'To make one small room the place people come to hear music properly.', audience: 'People who used to go to gigs and miss it; musicians looking for a room to play in.',
        promise: 'Every post is about a record, a drink or a night worth leaving the house for.', positioning: 'Not a cocktail bar with music; a listening room that happens to pour.', never: ['Discount codes', 'Ranking lists', 'Anything shouted']};
      a.voice.tone = {formalCasual: 4, seriousPlayful: 2, reservedBold: 2};
      a.voice.lexiconUse = ['listen', 'room', 'set', 'pour']; a.voice.lexiconAvoid = ['vibe', 'epic', 'curated'];
      a.voice.signatureMoves = ['Open with the record that is playing', 'End with one drink, not a menu'];
      a.pillars = [{id: uid(), name: 'The record of the week', targetPct: 40}, {id: uid(), name: 'Behind the bar', targetPct: 35}, {id: uid(), name: 'The people who play here', targetPct: 25}];
      brandAccountDefaults(a);
    }
    const note = (key, kind, fields, meta) => { if(has(S.entries, key)) return; const e = brandNew(kind, fields, Object.assign({scope: [a.id]}, meta || {}));
      e.seeded = TUTORIAL_TAG; e.seedKey = key; e.tags = ['example'].concat(e.tags || []); if(!e.title.startsWith(TUT)) e.title = TUT + e.title; };
    note('t-b1', 'quote', {text: 'People don\'t go to bars for the drinks. They go for the room.', author: 'Overheard, a bartender in Ginza'}, {pillarId: a.pillars[1].id});
    note('t-b2', 'observation', {text: 'The posts people save are the ones that tell them what to listen to tonight, not the ones about us.'}, {pillarId: a.pillars[0].id});
    note('t-b3', 'idea', {text: 'A monthly "one record, start to finish" night: lights down, no talking during side A.'}, {pillarId: a.pillars[0].id});
    note('t-b4', 'hypothesis', {statement: 'If each post opens with the record playing, then saves go up, because it answers "what should I listen to" in the first line.'});
    note('t-b5', 'voiceRule', {text: 'Say what the record sounds like before saying who made it.'});
    note('t-b6', 'question', {text: 'Is the Instagram account for the regulars, or for people who have never been in?'});
  });

  /* the Songwriting Studio: a song half written, and a few seeds */
  room('Songwriting', () => {
    if(typeof sngState !== 'function') return;
    const st = sngState();
    if(!has(st.songs, 't-song')) st.songs.unshift(sngSongDefaults({id: uid(), seeded: TUTORIAL_TAG, seedKey: 't-song', title: TUT + 'Last Train to Shibuya', status: 'draft',
      brief: 'Leaving a city you love on the last train, and not being sure you will come back. An example song: sections with lines, a plot in three steps, and the three boxes.',
      pov: 'first person', tense: 'present',
      plot: {type: 1, steps: ['The platform: deciding to go', 'The train: the city sliding past', 'Arrival: already missing it']},
      boxes: ['The platform lights, the last announcement', 'Reflections in the window, the river under the bridge', 'A new station, the same song in my head'],
      sections: [{type: 'verse', feel: 'stable', lines: ['The board says 0:12, the last one out tonight', 'I bought a can of coffee just to have something to hold', 'The man beside me sleeping with his briefcase on his knees', 'I count the stops I know and then the ones I don\'t']},
        {type: 'chorus', feel: 'unstable', lines: ['Last train to Shibuya', 'Lights go by like they\'re saying goodbye', 'I could get off at the next one', 'But I won\'t, and I don\'t know why']},
        {type: 'verse', feel: 'stable', lines: ['(second verse not written yet — the empty lines are where the next idea goes)']}]}));
    [['t-seed1', 'line', 'The city folds itself away like a paper lantern'], ['t-seed2', 'title', 'Kissa at 2 a.m.'], ['t-seed3', 'image', 'Neon on wet asphalt, a vending machine humming']].forEach(([key, type, content]) => {
      if(has(st.seeds, key)) return; st.seeds.unshift({id: uid(), seeded: TUTORIAL_TAG, seedKey: key, type, content: TUT + content, tags: ['example'], source: 'worked example', createdAt: new Date().toISOString()}); });
  });

  /* the Japanese Studio: a topic island with its chunks, and two errors in the notebook */
  room('Japanese Studio', () => {
    if(typeof jaState2 !== 'function') return;
    const j = jaState2();
    if(!has(j.islands, 't-island')) j.islands.unshift(jaIslandDefaults({id: uid(), seeded: TUTORIAL_TAG, seedKey: 't-island', topic: TUT + 'Why I am learning Japanese', topicJapanese: 'なぜ日本語を勉強しているか',
      englishDraft: 'I am learning Japanese because I want to live in Tokyo for a year. I love jazz, and Japan has the best jazz bars in the world. Someday I want to open a small bar of my own.',
      japaneseTeineigo: '東京に一年住みたいので、日本語を勉強しています。ジャズが大好きで、日本には世界一のジャズバーがあります。いつか自分の小さなバーを開きたいです。',
      japaneseTameguchi: '東京に一年住みたいから、日本語を勉強してる。ジャズが大好きで、日本には世界一のジャズバーがあるんだ。いつか自分の小さなバーを開きたい。',
      status: 'memorizing',
      chunks: [{japanese: '〜に住みたい', reading: '〜にすみたい', meaning: 'want to live in ~', type: 'sentence frame', example: '東京に住みたいです。', ready: true},
        {japanese: '世界一の', reading: 'せかいいちの', meaning: 'the best in the world', type: 'collocation', example: '世界一のジャズバー', ready: false},
        {japanese: 'いつか', reading: 'いつか', meaning: 'someday', type: 'single word', example: 'いつかバーを開きたい。', ready: true},
        {japanese: '店を開く', reading: 'みせをひらく', meaning: 'to open a shop', type: 'collocation', example: '小さな店を開きたいです。', ready: false}]}));
    [['t-err1', '東京が住みたいです', '東京に住みたいです', 'I want to live in Tokyo', 'particle', 'に marks where you live; が was a guess.'],
     ['t-err2', 'ジャズを好きです', 'ジャズが好きです', 'I like jazz', 'particle', '好き takes が for what is liked.']].forEach(([key, tried, corrected, meaning, errorType, note]) => {
      if(has(j.errors, key)) return; j.errors.unshift(jaErrorDefaults({id: uid(), seeded: TUTORIAL_TAG, seedKey: key, date: tutD(-6), tried, corrected, meaning, errorType, patternTag: 'が vs に', note: note + ' (an example error)', source: 'manual'})); });
  });

  /* the Jazz Studio: a sitting logged on the first exercise of the first stage */
  room('Jazz Studio', () => {
    if(typeof jazzLogPractice !== 'function' || typeof jazzStages !== 'function') return;
    const st = jazzStages().find(s => String(s.id) === '1') || jazzStages()[0];
    const id = st && st.subs && st.subs[0]; if(!id) return;
    const r = jazzRecord(id, true);
    if((r.logs || []).some(l => l.seeded === TUTORIAL_TAG)) return;
    const log = jazzLogPractice(id, {minutes: 20, quality: 'improving', keys: ['C', 'F', 'Bb'], note: TUT + 'C, F and B♭ at ♩ = 60 without stopping. B and E still slow. A sitting records the keys, the minutes and how it felt; the twelve-key grid and the practice plan read it.', day: tutD(-1)});
    log.seeded = TUTORIAL_TAG;
  });

  /* an idea and a vision, for the rooms that hold them */
  room('Ideas', () => {
    if(!Array.isArray(S.ideas)) S.ideas = [];
    if(!has(S.ideas, 't-idea')) S.ideas.unshift({id: uid(), seeded: TUTORIAL_TAG, seedKey: 't-idea', text: TUT + 'A "record of the week" card on the bar, handwritten #bar', kind: 'spark', note: 'Sparks are one line; they wait in Projects → Ideation until one becomes a project.', createdAt: new Date().toISOString(), tags: ['bar']});
  });

  /* the Study Deck: two small decks, with a basic card, a reversed card and a cloze */
  try {
    if(typeof sdLoad === 'function'){
      await sdLoad();
      S.settings.tutorialDeckNotes = S.settings.tutorialDeckNotes || [];
      if(!S.settings.tutorialDeckNotes.length){
        const basic = sdNoteTypeByName('Basic'), rev = sdNoteTypeByName('Basic (and reversed card)') || basic, cloze = sdNoteTypeByName('Cloze');
        const dJa = sdEnsureDeck('Examples::Japanese survival'), dJz = sdEnsureDeck('Examples::Jazz harmony');
        const add = (nt, fields, deck) => { if(!nt) return; const n = sdNewNote(nt.id, fields, ['example', 'tutorial']); sdAddNote(n, deck.id); S.settings.tutorialDeckNotes.push(n.id); };
        add(rev, ['いらっしゃいませ', 'Welcome (what the shop says as you walk in) — you do not reply to it'], dJa);
        add(rev, ['お会計お願いします', 'The bill, please'], dJa);
        add(basic, ['How do you order "one more of the same"?', 'もう一杯、同じのをお願いします'], dJa);
        if(cloze) add(cloze, ['A ii–V–I in C is {{c1::Dm7}} – {{c2::G7}} – {{c3::Cmaj7}}.', 'One note makes three cards: each hides one chord.'], dJz);
        if(cloze) add(cloze, ['The guide tones of G7 are {{c1::B}} (the 3rd) and {{c1::F}} (the 7th).', 'Both are hidden together: they are learned as a pair.'], dJz);
        add(basic, ['What is a rootless voicing?', 'A voicing without the root, left to the bass: for Dm7, F–A–C–E (3–5–7–9).'], dJz);
        out.rooms.push('Study Deck');
      }
    }
  } catch(e){ console.warn('tutorial: Study Deck', e); }

  /* the starter set covers the Identity rooms (skills, values, finance), projects, habits and the vision; it comes in too if it is not already here */
  try { if(typeof applyStarter === 'function' && !starterCount()){ applyStarter(); out.starter = true; } } catch(e){ console.warn('tutorial: starter', e); }

  S.settings.tutorialApplied = new Date().toISOString();
  saveNow();
  return out;
}

/* ---------- taking them out ---------- */
async function removeTutorial(){
  const strip = arr => Array.isArray(arr) ? arr.filter(x => !(x && x.seeded === TUTORIAL_TAG)) : arr;
  ['entries', 'tasks', 'people', 'interactions', 'timeEntries', 'scores', 'ideas', 'visions'].forEach(k => { if(Array.isArray(S[k])) S[k] = strip(S[k]); });
  if(S.planning){ S.planning.lists = strip(S.planning.lists || []); }
  if(S.brand) S.brand.accounts = strip(S.brand.accounts || []);
  if(S.songwriting){ S.songwriting.songs = strip(S.songwriting.songs || []); S.songwriting.seeds = strip(S.songwriting.seeds || []); }
  if(S.japanese){ S.japanese.islands = strip(S.japanese.islands || []); S.japanese.errors = strip(S.japanese.errors || []); }
  if(S.jazz && S.jazz.progress) Object.values(S.jazz.progress).forEach(r => { if(Array.isArray(r.logs)) r.logs = strip(r.logs); });
  /* the Tree: the example pages, and everything that hangs off them */
  if(Array.isArray(S.treeNodes)){
    const ids = new Set(S.treeNodes.filter(n => n.seeded === TUTORIAL_TAG).map(n => n.id));
    ['treeNodes', 'treeInbox', 'treeGrafts', 'treeExperiments', 'treePositions', 'treePredictions'].forEach(k => { if(Array.isArray(S[k])) S[k] = strip(S[k]); });
    ['treePositions', 'treeLinks', 'treeReviews', 'treeLeaves', 'treeAliases', 'treeExperiments', 'treePredictions'].forEach(k => { if(Array.isArray(S[k])) S[k] = S[k].filter(r => !ids.has(r.nodeId) && !ids.has(r.fromId)); });
    if(Array.isArray(S.treeGrafts)) S.treeGrafts = S.treeGrafts.filter(g => !ids.has(g.fromId) && !ids.has(g.toId));
    if(typeof treeDirty === 'function') treeDirty();
  }
  /* the deck notes, and the example decks if nothing else is in them */
  try {
    const ids = S.settings.tutorialDeckNotes || [];
    if(ids.length && typeof sdLoad === 'function'){ await sdLoad(); sdDeleteNotes(ids);
      const used = new Set([...SD.cards.values()].map(c => c.odid || c.deckId));
      ['Examples::Japanese survival', 'Examples::Jazz harmony', 'Examples'].forEach(nm => { const d = sdDeckByName(nm); if(!d) return;
        const under = [].concat(sdDeckAndBelow(d.id)).map(x => x && x.id != null ? x.id : x);
        if(!under.some(x => used.has(x))) try { sdDeleteDeck(d.id); } catch(e){} }); }
  } catch(e){ console.warn('tutorial: deck', e); }
  S.settings.tutorialDeckNotes = [];
  S.settings.tutorialApplied = null;
  saveNow();
}
