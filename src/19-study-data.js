/* ============================================================
   THE STUDY DECK — the memory layer of the whole instrument.

   Not a flashcard app that happens to live here. Anything encountered
   anywhere in the house — an insight in a journal entry, a quote off a
   shelf, a grammar point, a voicing, a tarot meaning — can become a card
   with one press, and the card remembers where it came from so you can go
   back and read the thing in its own context.

   The scheduling is SM-2, which is the algorithm Anki was originally built
   on. It is about forty lines and it has been right for thirty years: show
   a card, ask how it went, and let how it went decide when you see it next.
   ============================================================ */

/* Six degrees of how a recall went, in SM-2's own numbering. The four the
   player is offered map onto these; the two in between exist because the
   algorithm's ease calculation reads the whole scale. */
const SM2_GRADES = {again:1, hard:3, good:4, easy:5};
const STUDY_BUTTONS = [
  ['again', 'Again', 'no — start it over',        '#a05050'],
  ['hard',  'Hard',  'yes, but it hurt',          '#b08840'],
  ['good',  'Good',  'yes, with a little thought', '#6a8a5a'],
  ['easy',  'Easy',  'immediately',               '#4a8a7a']];
const STUDY_TYPES = [
  ['text_recall', 'Text → recall', 'a prompt on the front, the answer on the back'],
  ['production',  'Production',    'a meaning on the front; you produce the language'],
  ['cloze',       'Cloze',         'a sentence with a hole in it'],
  ['action',      'Action',        'an instruction; you do the thing and mark yourself'],
  ['image_recall','Image → recall','a picture on the front']];
const STUDY_STATUSES = ['inbox', 'active', 'suspended', 'graduated'];
/* Three depths of involvement, after Laufer and Hulstijn: retrieving a thing,
   deploying it somewhere new, and weighing it against its neighbour. The third
   is the expensive one and the one that sticks. */
const STUDY_ROLES = [
  ['recall',      'Recall',      'do you have it', 1],
  ['application', 'Application', 'use it somewhere new', 3],
  ['compare',     'Compare',     'tell it from its neighbour', 5]];

const STUDY_DECKS_DEFAULT = () => [
  {id:'mindsets', name:'Mindsets & Principles', emoji:'🧠', color:'#8a6a5e', isDefault:true, parentId:null,
   about:'Insights, mental models and paradigm shifts worth having by heart.',
   autoSources:['journal','library','theatre']},
  {id:'japanese', name:'Japanese', emoji:'🇯🇵', color:'#c4484e', isDefault:true, parentId:null,
   about:'The language, in three parts.', autoSources:[]},
  {id:'ja_grammar', name:'Grammar', emoji:'⛩', color:'#c4484e', isDefault:true, parentId:'japanese',
   about:'Grammar points, particles, conjugations.', autoSources:['grammar']},
  {id:'ja_vocab', name:'Vocabulary', emoji:'📝', color:'#c4484e', isDefault:true, parentId:'japanese',
   about:'Words, chunks and the collocations they live in.', autoSources:['vocab']},
  {id:'ja_corrections', name:'Corrections', emoji:'🎙', color:'#c4484e', isDefault:true, parentId:'japanese',
   about:'What you meant, and what a native would have said.', autoSources:['error_log']},
  {id:'jazz', name:'Jazz Piano', emoji:'🎹', color:'#6b7f8e', isDefault:true, parentId:null,
   about:'Voicings, progressions, theory.', autoSources:['jazz_concept']},
  {id:'repertoire', name:'Repertoire Memory', emoji:'🎵', color:'#6b7f8e', isDefault:true, parentId:null,
   about:'Pieces: keys, openings, structure.', autoSources:['piece']},
  {id:'divination', name:'Divination Study', emoji:'🔮', color:'#7f6a8e', isDefault:true, parentId:null,
   about:'Tarot meanings, hexagrams, charm symbols.', autoSources:['tarot','iching','charm']}];

/* What the session says on its way out. They rotate, and they are all from
   the books the rest of the house is built on — the point being that a study
   session is not a separate activity from the rest of it. */
const STUDY_PARTINGS = [
  ['The nervous system cannot tell the difference between a real experience and one vividly imagined.', 'Maltz'],
  ['Structural tension seeks resolution. Do not resolve it by lowering the vision.', 'Fritz'],
  ['No more than a quarter of the time on the direct study of items; no less than a quarter on fluency.', 'Nation'],
  ['In play time, analytical thought is strictly forbidden.', 'Werner'],
  ['You do not rise to the level of your goals. You fall to the level of your systems.', 'Clear'],
  ['What is retained is what you had to work to understand.', 'Laufer & Hulstijn']];

/* ---------- storage ----------
   Built on first use, like the planner's and the studio's: a room nobody has
   opened costs nothing, and a save from an older version cannot be missing a
   field. */
function studyState(){
  if(!S.study) S.study = {};
  const st = S.study;
  st.cards = Array.isArray(st.cards) ? st.cards : [];
  st.decks = Array.isArray(st.decks) && st.decks.length ? st.decks : STUDY_DECKS_DEFAULT();
  /* a default deck the player deleted in an older version comes back, because
     its auto-sources point at it by name and cards would land nowhere */
  STUDY_DECKS_DEFAULT().forEach(d => { if(!st.decks.some(x => x.id === d.id)) st.decks.push(d); });
  st.settings = Object.assign({newPerDay:20, reviewsPerDay:100, graduateAt:180,
    clozeInput:'type', showPreview:true, order:'due_first'}, st.settings || {});
  st.stats = Object.assign({reviews:0, streak:0, longest:0, lastStudied:null, perDay:{}}, st.stats || {});
  st.cards.forEach(studyCardDefaults);
  return st;
}
function studyCardDefaults(c){
  c.id = c.id || uid();
  c.type = STUDY_TYPES.some(t => t[0] === c.type) ? c.type : 'text_recall';
  c.front = c.front || '';
  c.back = c.back || '';
  c.clozeAnswer = c.clozeAnswer == null ? null : String(c.clozeAnswer);
  c.clozeOptions = Array.isArray(c.clozeOptions) ? c.clozeOptions : null;
  c.imageData = c.imageData || null;
  c.reference = c.reference || null;
  c.deckId = c.deckId || 'mindsets';
  c.tags = Array.isArray(c.tags) ? c.tags : [];
  c.sourceType = c.sourceType || null;
  c.sourceId = c.sourceId || null;
  c.sourceLabel = c.sourceLabel || null;
  c.sourceGo = c.sourceGo || null;
  /* SM-2's three numbers. The ease factor starts at 2.5 and never goes below
     1.3 — below that a card you keep failing would be scheduled further and
     further out, which is exactly backwards. */
  c.interval = +c.interval || 0;
  c.reps = +c.reps || 0;
  c.ease = +c.ease || 2.5;
  c.due = c.due || today();
  c.lastReviewed = c.lastReviewed || null;
  c.createdAt = c.createdAt || new Date().toISOString();
  c.status = STUDY_STATUSES.includes(c.status) ? c.status : 'active';
  c.history = Array.isArray(c.history) ? c.history : [];
  c.familyId = c.familyId || null;
  c.familyRole = STUDY_ROLES.some(r => r[0] === c.familyRole) ? c.familyRole : null;
  c.involvement = c.involvement == null ? null : +c.involvement;
  return c;
}
function newStudyCard(extra = {}){
  return studyCardDefaults(Object.assign({id:uid(), createdAt:new Date().toISOString(),
    due:today(), status:'active'}, extra));
}
const studyCards = () => studyState().cards;
const studyCard = id => byId(studyState().cards, id);
const studyDecks = () => studyState().decks;
const studyDeck = id => byId(studyState().decks, id);
const studyDeckName = id => (studyDeck(id) || {name:'Unfiled'}).name;
/* a deck and everything filed under it */
function studyDeckIds(id){
  const kids = studyDecks().filter(d => d.parentId === id).map(d => d.id);
  return [id, ...kids];
}
const studyTopDecks = () => studyDecks().filter(d => !d.parentId);

/* ---------- SM-2 ----------
   Show a card, ask how it went, let the answer decide when you see it next.
   Two rules carry the whole thing: a right answer multiplies the interval by
   the card's own ease, and a wrong one sends the card back to tomorrow with
   its streak reset — because a thing you have just failed is not a thing you
   know in six days' time.

   The ease moves too, and more slowly. A card that is always easy drifts
   towards long intervals; one that is always hard sinks to the 1.3 floor and
   stays close. That floor matters: without it a card you keep failing gets
   scheduled further out each time, which is the opposite of what failing it
   means. */
function sm2(card, grade){
  let {interval, reps, ease} = card;
  if(grade >= 3){
    /* Textbook SM-2 makes the interval depend only on whether you passed, so
       Hard, Good and Easy all produce the same date and only the ease factor
       moves. That is defensible on paper and useless in the hand: three
       buttons that do the same thing today are three buttons nobody can
       choose between, and the preview under them would read 8 days, 8 days,
       8 days forever.

       So the three passing grades are spread, the way every scheduler built
       on SM-2 has ended up doing it. Hard advances a little; Good is the
       textbook interval; Easy jumps. The ease formula underneath is
       untouched — that is the part SM-2 is actually right about. */
    interval = grade === 3
      ? (reps === 0 ? 1 : Math.max(interval + 1, Math.round(interval * 1.2)))
      : grade >= 5
        ? (reps === 0 ? 4 : reps === 1 ? 8 : Math.round(interval * ease * 1.3))
        : (reps === 0 ? 1 : reps === 1 ? 6 : Math.round(interval * ease));
    reps += 1;
  } else {
    /* A thing you have just failed is not a thing you know in six days */
    reps = 0;
    interval = 1;
  }
  ease = Math.max(1.3, ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));
  return {interval, reps, ease: Math.round(ease * 1000) / 1000, due: addDays(today(), interval)};
}
/* what pressing each button would do, so the choice can be calibrated */
function studyPreview(card){
  const out = {};
  STUDY_BUTTONS.forEach(([k]) => { out[k] = sm2(card, SM2_GRADES[k]).interval; });
  return out;
}
const studySaid = n => n < 1 ? 'today' : n === 1 ? '1 day' : n < 30 ? `${n} days`
  : n < 365 ? `${Math.round(n / 30)} months` : `${(n / 365).toFixed(1)} years`;

/* Answering a card is the one place any of this is written down. It moves the
   schedule, records what happened, graduates the card if it has gone far
   enough, and keeps the streak — all of it here so there is one story about
   what a review does. */
function studyAnswer(id, key){
  const c = studyCard(id); if(!c) return null;
  const grade = SM2_GRADES[key] ?? 4;
  const next = sm2(c, grade);
  Object.assign(c, next);
  c.lastReviewed = new Date().toISOString();
  c.history.push({date:new Date().toISOString(), grade});
  const st = studyState();
  /* Graduation is not mastery, it is "this is far enough out that a daily
     queue is the wrong place for it". It can be brought back. */
  if(c.interval >= st.settings.graduateAt && c.status === 'active') c.status = 'graduated';
  st.stats.reviews = (+st.stats.reviews || 0) + 1;
  const d = today();
  st.stats.perDay[d] = (+st.stats.perDay[d] || 0) + 1;
  studyTouchStreak(d);
  saveNow();
  return c;
}
/* A streak is consecutive days with at least one review. Studying twice in a
   day does not extend it, and the day you actually study is the only thing
   that moves it — so it is computed from the last day studied rather than
   incremented blindly. */
function studyTouchStreak(d){
  const st = studyState().stats;
  if(st.lastStudied === d) return;
  st.streak = st.lastStudied === addDays(d, -1) ? (+st.streak || 0) + 1 : 1;
  st.lastStudied = d;
  st.longest = Math.max(+st.longest || 0, st.streak);
}
/* the streak as it stands today, which is not what is stored the moment a day
   is missed — stored numbers do not decay by themselves */
function studyStreak(){
  const st = studyState().stats;
  if(!st.lastStudied) return 0;
  const gap = daysBetween(st.lastStudied, today());
  return gap <= 1 ? (+st.streak || 0) : 0;
}

/* ---------- the queue ---------- */
const studyIsDue = c => c.status === 'active' && c.due <= today();
function studyDue(deckId){
  const ids = deckId ? new Set(studyDeckIds(deckId)) : null;
  return studyCards().filter(c => studyIsDue(c) && (!ids || ids.has(c.deckId)));
}
function studyInbox(){ return studyCards().filter(c => c.status === 'inbox'); }
function studyDeckCount(deckId){
  const ids = new Set(studyDeckIds(deckId));
  const mine = studyCards().filter(c => ids.has(c.deckId) && c.status !== 'inbox');
  return {due: mine.filter(studyIsDue).length, total: mine.length,
    graduated: mine.filter(c => c.status === 'graduated').length};
}
/* The session queue, capped by the day's limits. A card never reviewed is a
   new card and gets its own smaller allowance, because twenty new things is a
   different afternoon from twenty reminders. */
function studyQueue(deckId){
  const st = studyState();
  const due = studyDue(deckId);
  const fresh = due.filter(c => !c.reps);
  const seen = due.filter(c => c.reps);
  const take = (list, n) => n > 0 ? list.slice(0, n) : list;
  const q = take(seen, st.settings.reviewsPerDay).concat(take(fresh, st.settings.newPerDay));
  if(st.settings.order === 'new_first') q.reverse();
  else if(st.settings.order === 'mixed') studyShuffle(q);
  else q.sort((a, b) => (a.due || '').localeCompare(b.due || ''));
  return q;
}
function studyShuffle(a){
  for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
/* how far along the life of a card is, for the distribution chart */
function studyMaturity(c){
  if(c.status === 'graduated') return 'graduated';
  if(!c.reps) return 'new';
  if(c.interval < 7) return 'learning';
  if(c.interval < 30) return 'young';
  return 'mature';
}
const STUDY_MATURITY = [['new','New','#b8b0a6'], ['learning','Learning','#c98b7a'],
  ['young','Young','#d8a45f'], ['mature','Mature','#8fa86a'], ['graduated','Graduated','#7fa2a8']];
