/* ============================================================
   REMEMBER THIS — one press, from anywhere.

   The difference between this and a flashcard app is that you never leave
   what you were reading. The button knows where it is, fills the card in
   from its surroundings, files it in the deck that room feeds, and writes
   down the way back — so six months later, when the card comes round and the
   answer means nothing without its context, the context is one press away.
   ============================================================ */

/* Which deck a room's cards go to, and what to call the source. Everything
   the button knows about where it is, in one table rather than scattered
   through twelve call sites. */
const STUDY_SOURCES = {
  journal:      {deck:'mindsets',       say:'Journal entry',      go: id => `#/journals`},
  library:      {deck:'mindsets',       say:'Library',            go: () => '#/journals/library'},
  quote:        {deck:'mindsets',       say:'Quote',              go: () => '#/journals/library'},
  theatre:      {deck:'mindsets',       say:'Morning Theatre',    go: () => '#/today'},
  value:        {deck:'mindsets',       say:'A value',            go: () => '#/values'},
  grammar:      {deck:'ja_grammar',     say:'Grammar Journey',    go: () => '#/japanese'},
  vocab:        {deck:'ja_vocab',       say:'Vocabulary Lab',     go: () => '#/japanese'},
  error_log:    {deck:'ja_corrections', say:'Speaking Lab',       go: () => '#/japanese'},
  island:       {deck:'ja_vocab',       say:'An island',          go: () => '#/japanese'},
  jazz_concept: {deck:'jazz',           say:'Jazz Lab',           go: () => '#/piano'},
  piece:        {deck:'repertoire',     say:'Repertoire',         go: id => `#/piano/piece/${id}`},
  tarot:        {deck:'divination',     say:'Tarot',              go: () => '#/today'},
  iching:       {deck:'divination',     say:'I Ching',            go: () => '#/today'},
  charm:        {deck:'divination',     say:'Charms',             go: () => '#/today'},
  manual:       {deck:'mindsets',       say:'Written by hand',    go: () => '#/study'},
};
const studySourceDeck = t => (STUDY_SOURCES[t] || STUDY_SOURCES.manual).deck;

/* The button. It is small and it is everywhere, which only works because it
   says nothing until you look at it. */
function rememberBtnHTML(sourceType, sourceId, label = '') {
  return `<button class="sd-pin" data-sdpin="${esc(sourceType)}|${esc(sourceId || '')}"
    title="${esc(label || 'remember this')}" aria-label="make a card of this">📌</button>`;
}
/* Every one of these on every page, bound once and for all. Delegated rather
   than wired per render, because the button appears in a dozen rooms and half
   of them redraw on their own — a binder you have to remember to call is a
   button that is dead in whichever room somebody forgot.

   What it needs to fill the card in comes off the element: data-sdfront,
   data-sdback, and data-sdsay for what to call the source. */
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-sdpin]'); if(!b) return;
  ev.preventDefault(); ev.stopPropagation();
  const [type, id] = b.dataset.sdpin.split('|');
  /* what is selected beats what the button guessed: you selected it on
     purpose, and the button's guess is only a guess */
  const picked = studySelection();
  openRememberModal({sourceType: type, sourceId: id || null,
    front: picked || b.dataset.sdfront || '', back: picked ? '' : (b.dataset.sdback || ''),
    sourceLabel: b.dataset.sdsay || ''});
}, true);
/* What the browser thinks is selected, if anything, and only when it is on
   the page rather than inside a field somebody is typing in. */
function studySelection(){
  try {
    const sel = window.getSelection();
    if(!sel || sel.isCollapsed) return '';
    const n = sel.anchorNode;
    if(n && n.parentElement && n.parentElement.closest('input, textarea, .ed.editing')) return '';
    return String(sel).trim();
  } catch(e){ return ''; }
}
/* Anywhere, on any page: select some words and press the keys. The deck is
   guessed from the room you are standing in. */
const STUDY_PAGE_SOURCE = {journals:'journal', commonplace:'library', values:'value',
  piano:'jazz_concept', japanese:'vocab', today:'theatre'};
document.addEventListener('keydown', ev => {
  if(!(ev.key === 'R' || ev.key === 'r') || !ev.shiftKey || !(ev.metaKey || ev.ctrlKey)) return;
  if(typeof S === 'undefined' || !S) return;
  ev.preventDefault();
  const text = studySelection();
  const where = (typeof parseHash === 'function' ? parseHash().name : '') || '';
  openRememberModal({sourceType: STUDY_PAGE_SOURCE[where] || 'manual', front: text, back: ''});
});

/* ---------- the quick-create modal ----------
   Small, dismissible, and pre-filled. It is a capture, not a form: the whole
   value of it is that it costs nothing to use, so nothing in it is required
   except a front. */
function openRememberModal(pre = {}){
  const st = studyState();
  const src = STUDY_SOURCES[pre.sourceType] || STUDY_SOURCES.manual;
  const deckId = pre.deckId || studySourceDeck(pre.sourceType);
  const say = pre.sourceLabel || (pre.sourceType === 'manual' ? '' : `${src.say}, ${fmtDate(today(), 'med')}`);
  const m = openModal(`<h2>📌 Remember this</h2>
    <label class="pd-q"><span class="k">front</span>
      <textarea class="inp sd-ta" id="sdFront" rows="3" autofocus placeholder="the question, or the prompt">${esc(pre.front || '')}</textarea></label>
    <label class="pd-q" style="margin-top:8px"><span class="k">back</span>
      <textarea class="inp sd-ta" id="sdBack" rows="3" placeholder="the answer">${esc(pre.back || '')}</textarea></label>
    <div class="grid c2" style="gap:10px;margin-top:10px">
      <label class="pd-q"><span class="k">deck</span><select class="sel" id="sdDeck">${studyDecks().map(d =>
        `<option value="${esc(d.id)}" ${d.id === deckId ? 'selected' : ''}>${esc(d.emoji)} ${esc(d.name)}</option>`).join('')}</select></label>
      <label class="pd-q"><span class="k">kind</span><select class="sel" id="sdType">${STUDY_TYPES.filter(t => t[0] !== 'image_recall').map(([v, n]) =>
        `<option value="${v}" ${v === (pre.type || 'text_recall') ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
    </div>
    <label class="pd-q" style="margin-top:10px"><span class="k">tags</span>
      <input class="inp mono" id="sdTags" value="${esc((pre.tags || []).join(' '))}" placeholder="fritz structural-tension"></label>
    <!-- One card confirms you know a thing. Three carry it at three depths:
         retrieve it, use it somewhere new, and tell it from its neighbour.
         Off by default, because the point of this button is that it is cheap. -->
    <label class="sd-family"><input type="checkbox" id="sdFamily">
      <span>Make a family — recall, application and compare<em>three cards at three depths, which is what actually sticks</em></span></label>
    ${say ? `<div class="sd-src mono">from ${esc(say)}</div>` : ''}
    <div class="row" style="justify-content:flex-end;margin-top:14px;gap:8px">
      <button class="btn primary" id="sdSave">Save card</button></div>`, 'narrow sd-modal');
  const save = () => {
    const front = m.querySelector('#sdFront').value.trim();
    if(!front){ m.querySelector('#sdFront').focus(); toast('A card needs a front.'); return; }
    const base = {
      front, back: m.querySelector('#sdBack').value.trim(),
      deckId: m.querySelector('#sdDeck').value,
      type: m.querySelector('#sdType').value,
      tags: m.querySelector('#sdTags').value.split(/[\s,]+/).map(x => x.replace(/^#/, '')).filter(Boolean),
      sourceType: pre.sourceType || 'manual', sourceId: pre.sourceId || null,
      sourceLabel: say || null, sourceGo: pre.sourceGo || (src.go ? src.go(pre.sourceId) : null)};
    const made = m.querySelector('#sdFamily').checked
      ? studyMakeFamily(base) : [addStudyCard(base)];
    saveNow(); m.remove(); sound('success');
    toast(made.length > 1 ? `${made.length} cards made — the deeper two are yours to finish.` : 'Card made.', 4200,
      {label:'open the deck', fn: () => navigate('#/study')});
    if(parseHash().name === 'study') rerender();
  };
  m.querySelector('#sdSave').onclick = save;
  /* ⌘↵ saves from either field, because a capture you have to reach for the
     mouse to finish is a capture you stop making */
  m.querySelectorAll('textarea, input').forEach(n => n.onkeydown = ev => {
    if(ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)){ ev.preventDefault(); save(); } });
  return m;
}
function addStudyCard(fields){
  const c = newStudyCard(fields);
  studyState().cards.push(c);
  return c;
}

/* ---------- card families ----------
   Laufer and Hulstijn: what is retained is proportional to how hard you had
   to work with it. Retrieval is the shallow end. So a family is three cards:
   the one that asks whether you have it, the one that makes you use it
   somewhere it has never been, and the one that makes you tell it from the
   thing it is nearly the same as.

   The second two are written as prompts rather than guesses. The instrument
   does not know what your weekend plans are or which framework you would set
   this one against — and a card with an invented answer on the back is worse
   than no card, because you will believe it. */
function studyMakeFamily(base){
  const familyId = uid();
  const subject = (base.front || '').split('\n')[0].slice(0, 80);
  const made = [];
  made.push(addStudyCard(Object.assign({}, base, {familyId, familyRole:'recall', involvement:1})));
  made.push(addStudyCard(Object.assign({}, base, {
    familyId, familyRole:'application', involvement:3, type: base.type === 'action' ? 'action' : 'text_recall',
    front: `Use it somewhere new — ${subject}\n\nWhere in your own life does this apply right now? Be specific.`,
    back: base.back ? `For reference:\n\n${base.back}` : ''})));
  made.push(addStudyCard(Object.assign({}, base, {
    familyId, familyRole:'compare', involvement:5, type:'text_recall',
    front: `Tell it from its neighbour — ${subject}\n\nWhat is the nearest thing to this that it is NOT? Where is the line?`,
    back: base.back ? `For reference:\n\n${base.back}` : ''})));
  return made;
}
/* Grown later, from the browse view, for a card that turned out to matter */
function studyDeepen(id){
  const c = studyCard(id); if(!c) return null;
  if(c.familyId && studyCards().some(x => x.familyId === c.familyId && x.familyRole !== 'recall')){
    toast('This one already has its family.'); return null;
  }
  const familyId = c.familyId || uid();
  c.familyId = familyId; c.familyRole = 'recall'; c.involvement = 1;
  const rest = studyMakeFamily(Object.assign({}, c, {familyId})).filter(x => x.familyRole !== 'recall');
  /* studyMakeFamily makes its own recall card; this one already exists */
  const extra = studyCards().filter(x => x.familyId === familyId && x.familyRole === 'recall' && x.id !== c.id);
  extra.forEach(x => spliceOut(studyState().cards, y => y.id === x.id));
  rest.forEach(x => { x.familyId = familyId; });
  saveNow();
  return rest;
}
const studyFamily = id => { const c = studyCard(id);
  return c && c.familyId ? studyCards().filter(x => x.familyId === c.familyId) : (c ? [c] : []); };

/* ---------- the inbox ----------
   Cards the house made for you rather than cards you asked for. They wait:
   a system that silently adds work to tomorrow is a system you stop trusting,
   so nothing enters the rotation until it has been looked at. */
function suggestStudyCard(fields){
  const st = studyState();
  /* the same suggestion twice is one suggestion */
  const same = st.cards.find(c => c.status === 'inbox' && c.front === fields.front && c.deckId === (fields.deckId || studySourceDeck(fields.sourceType)));
  if(same) return same;
  const c = addStudyCard(Object.assign({status:'inbox', deckId: studySourceDeck(fields.sourceType)}, fields));
  saveNow();
  return c;
}
function acceptStudyCard(id){ const c = studyCard(id); if(!c) return;
  c.status = 'active'; c.due = today(); saveNow(); }
function dismissStudyCard(id){ spliceOut(studyState().cards, c => c.id === id); saveNow(); }
