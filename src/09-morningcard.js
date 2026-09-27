/* ============================================================
   THE MORNING CARD

   The first thing, on the first open of the day: one tarot card to begin
   it. Before the bedtime and the waking hour are asked for — the day is
   met with a question before it is met with a form.

   The question is yours. There are a few to choose from for the mornings
   when nothing comes, and a line to write your own; whichever it is is
   held in front of you while the cards are shuffled, under the same veil
   the full readings use, so the intention is set before the card is.

   Then the card, turned; what it says in one line; the long reading folded
   under it; and a box for what it says to you. Keeping it files it with
   every other reading (a divination entry, spread "the morning card"), so
   it is in the Lived Record and on the card's own history. Not keeping it
   is fine too — it was drawn either way.

   Once a day, on the first open. A first-ever visit is not a morning — that
   day is marked as asked, so a new house does not open on two dialogs. And
   "stop asking each morning" is one press, and undone in the same place.
   ============================================================ */

const MORNING_QUESTIONS = [
  'What do I most need to know today?',
  'What energy should I bring to today?',
  'Where should my attention go today?',
  'What is asking to be let go of today?',
  'What will help me most today?',
  'What is today trying to teach me?',
];

function shouldDrawMorningCard(){
  const st = S.settings = S.settings || {};
  const T = today();
  if(st.morningCardOff) return false;
  if(st.morningCardOn === T) return false;
  /* the first visit ever is not a return to the house: mark the day and let
     it be (asked before anything else, because the first-run question marks
     itself answered the moment it opens) */
  if(!+st.lastSeenAt){ st.morningCardOn = T; return false; }
  if(typeof prefsAnswered === 'function' && !prefsAnswered()) return false;
  if(typeof isLateNight === 'function' && isLateNight()) return false;
  /* never on top of another question: it waits for the next visit to Today */
  if(document.querySelector('#modals .overlay, .dv-veil')) return false;
  if(typeof tarotDraw !== 'function' || typeof TAROT === 'undefined') return false;
  return true;
}

function openMorningCard(then){
  const T = today();
  S.settings.morningCardOn = T; saveNow();
  const next = () => { if(typeof then === 'function') setTimeout(then, 260); };
  const m = openModal(`<div class="mc" id="mcAsk">
      <h2 class="serif">☀︎ Good morning</h2>
      <p class="muted mc-lede">One card to begin the day. Choose the question, or ask your own — it is what you will hold while the cards are shuffled.</p>
      <div class="mc-qs" role="radiogroup" aria-label="a question for the card">${MORNING_QUESTIONS.map((q, i) =>
        `<button type="button" class="mc-q${i === 0 ? ' on' : ''}" role="radio" aria-checked="${i === 0}" data-mcq="${i}">${esc(q)}</button>`).join('')}</div>
      <div class="field" style="margin-top:10px"><label>Or in your own words</label>
        <input class="inp serif-lg" id="mcOwn" placeholder="What am I not seeing about …?"></div>
      <div class="row between" style="margin-top:14px;gap:8px;flex-wrap:wrap">
        <button class="btn sm ghost" id="mcSkip">not today</button>
        <button class="btn primary" id="mcDraw">Set the intention, and draw</button></div>
      <button class="dp-lnk mc-off" id="mcOff">stop asking each morning</button>
    </div>
    <div class="mc" id="mcOut" hidden></div>`, 'narrow');
  let chosen = MORNING_QUESTIONS[0];
  const own = m.querySelector('#mcOwn');
  m.querySelectorAll('[data-mcq]').forEach(b => b.onclick = () => {
    chosen = MORNING_QUESTIONS[+b.dataset.mcq]; own.value = '';
    m.querySelectorAll('[data-mcq]').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); });
    if(typeof sound === 'function') sound('click'); });
  own.oninput = () => m.querySelectorAll('[data-mcq]').forEach(x => { x.classList.toggle('on', !own.value.trim() && x.dataset.mcq === String(MORNING_QUESTIONS.indexOf(chosen))); });
  const close = () => { m.remove(); next(); };
  m.querySelector('#mcSkip').onclick = close;
  m.querySelector('.close').onclick = close;
  m.querySelector('#mcOff').onclick = () => { S.settings.morningCardOff = true; saveNow();
    toast('No card in the mornings. Settings › Atmosphere turns it back on.', 4500); close(); };
  own.onkeydown = ev => { if(ev.key === 'Enter'){ ev.preventDefault(); m.querySelector('#mcDraw').click(); } };
  m.querySelector('#mcDraw').onclick = () => {
    const question = own.value.trim() || chosen;
    const [pick] = tarotDraw(1);
    m.querySelector('#mcAsk').hidden = true;
    const go = () => showCard(question, pick);
    if(typeof ceremonyVeil === 'function')
      ceremonyVeil(['Take a breath.', 'Let the night settle.', 'Hold your question in your mind.'], go,
        {label: 'a moment before the morning card', question});
    else go();
  };
  function showCard(question, pick){
    const card = tarotCard(pick.card) || {};
    const side = pick.rev ? (card.reversed || {}) : (card.upright || {});
    const out = m.querySelector('#mcOut');
    out.hidden = false;
    out.innerHTML = `<p class="mono faint mc-asked">“${esc(question)}”</p>
      <div class="mc-card">${tarotCardHTML(pick, 0, false)}</div>
      <h3 class="serif mc-name">${esc(card.name || TAROT[pick.card].n)}${pick.rev ? ' <span class="mono faint">reversed</span>' : ''}</h3>
      ${side.summary ? `<p class="mc-sum">${esc(side.summary)}</p>` : ''}
      ${side.themes && side.themes.length ? `<div class="mono faint mc-themes">${esc(side.themes.slice(0, 4).join('  ·  '))}</div>` : ''}
      <details class="mc-more"><summary>the card at length</summary>${tarotCardReadHTML(pick, 'for today', 'present')}</details>
      <div class="field" style="margin-top:12px"><label>What it says to you, this morning</label>
        <textarea class="ta" id="mcText" rows="3" placeholder="Not what it means in general. What it means for today."></textarea></div>
      <label class="row" style="gap:6px;font-size:.8rem;align-items:center"><input type="checkbox" id="mcPin"> <span>📌 keep it on Today</span></label>
      <div class="row between" style="margin-top:12px;gap:8px;flex-wrap:wrap">
        <button class="btn sm ghost" id="mcLeave">begin the day without keeping it</button>
        <button class="btn primary" id="mcKeep">Keep it, and begin the day</button></div>`;
    const tc = out.querySelector('.tc');
    const soft = typeof reduced === 'function' && reduced();
    setTimeout(() => { if(tc) tc.classList.add('up'); if(typeof sound === 'function') sound('click'); }, soft ? 0 : 420);
    out.querySelector('#mcLeave').onclick = close;
    out.querySelector('#mcKeep').onclick = () => {
      divinationSave({system: 'tarot', question, spread: 'morning',
        title: `The morning card — ${TAROT[pick.card].n}${pick.rev ? ' (reversed)' : ''}`,
        cards: [{card: pick.card, rev: pick.rev, pos: 'for today'}],
        reading: out.querySelector('#mcText').value.trim(), source: 'digital',
        pin: out.querySelector('#mcPin').checked});
      if(typeof sound === 'function') sound('success');
      toast('Kept with your readings.');
      close();
    };
  }
  return m;
}
