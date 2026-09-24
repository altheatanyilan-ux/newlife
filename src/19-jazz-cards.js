/* ============================================================
   THE FLASHCARDS — the only honest way to find out.

   A twelve-key grid you tick yourself is a grid that fills up. You practise
   an exercise for twenty minutes, all twelve keys feel fine while you are
   sitting there with the last one still in your hands, and you tick them
   off. Three days later you cannot play it in E.

   So the cards ask cold, in a random key, with no score in front of you:
   play a two-five-one in E flat. You play it, then you turn the card over
   and the answer is engraved in that key, written out at the moment you
   asked for it. Then you say whether you had it.

   The grid is not ticked by hand from here. Three clean answers on the same
   exercise-and-key marks the key off; a miss takes one back. That is the
   difference between a record of what you can play and a record of what you
   felt able to play on a good afternoon.
   ============================================================ */

function jazzFlashHTML(){
  const st = jazzState().settings;
  const ui = jazzUi();
  if(ui.flash && ui.flash.cards && ui.flash.cards.length) return jazzCardHTML();
  /* everything the roadmap has opened is offerable; a locked stage is not */
  const offer = [];
  jazzStages().forEach(s => { if(!jazzStageOpen(s)) return;
    s.subs.forEach(id => { const ex = jazzExercise(id);
      /* an exercise with nothing to draw cannot be a flashcard: the whole
         point of the card is the answer on the other side of it */
      if(ex && jazzHasScore(ex)) offer.push({stage: s, ex}); }); });
  const chosen = new Set(st.syllabus.filter(id => offer.some(o => o.ex.id === id)));
  return `<div class="row between" style="align-items:baseline">
      <h1 class="serif" style="margin:0">Flashcards</h1>
      <button class="btn sm ghost" id="jzFback">← the roadmap</button></div>
    ${typeof jazzCardTabsHTML === 'function' ? jazzCardTabsHTML('keys') : ''}
    <p class="page-blurb">Cold, in a key you did not choose. It is the only way to find out
      which of the twelve you actually have.</p>
    <div class="jz-setup">
      <div class="sc">What is in the deck</div>
      <div class="jz-pick">${offer.map(o => `<label class="pick-row sm ${chosen.has(o.ex.id) ? 'on' : ''}">
        <input type="checkbox" data-jzsyl="${esc(o.ex.id)}" ${chosen.has(o.ex.id) ? 'checked' : ''}>
        <span><b>${esc(o.ex.id)} ${esc(o.ex.name)}</b>
          <span class="d">${esc(o.stage.name)} · ${jazzKeysGot(o.ex.id)}/12</span></span></label>`).join('')}</div>
      ${offer.length ? '' : '<div class="empty">Nothing is open yet. Start at stage one.</div>'}
      <div class="sc" style="margin-top:14px">Which keys</div>
      <div class="row" style="gap:8px;flex-wrap:wrap">
        ${[['unmastered','the ones you have not got'], ['all','all twelve'], ['custom','only these']].map(([v, l]) =>
          `<button class="btn sm ${st.keyMode === v ? 'primary' : 'ghost'}" data-jzmode="${v}">${l}</button>`).join('')}
      </div>
      ${st.keyMode === 'custom' ? `<div class="jz-keypick" style="margin-top:8px">${JAZZ_KEY_NAMES.map(k =>
        `<button class="jz-k${st.customKeys.includes(k) ? ' on' : ''}" data-jzck="${esc(k)}">${esc(jazzPretty(k))}</button>`).join('')}</div>` : ''}
      <div class="sc" style="margin-top:14px">What the cards ask</div>
      <label class="jz-gate mono"><input type="checkbox" id="jzChecks" ${st.checks ? 'checked' : ''}>
        the checkpoints too — at tempo, from memory, eyes shut</label>
      <div class="sc" style="margin-top:14px">How many cards</div>
      <div class="row" style="gap:8px;flex-wrap:wrap">${[5, 10, 15, 25, 40].map(n =>
        `<button class="btn sm ${st.cards === n ? 'primary' : 'ghost'}" data-jzn="${n}">${n}</button>`).join('')}</div>
      <div class="row" style="margin-top:16px"><button class="btn primary" id="jzBegin"
        ${chosen.size ? '' : 'disabled'}>Deal ${st.cards} cards</button></div>
    </div>`;
}
function bindJazzFlash(root){
  const st = jazzState().settings;
  const ui = jazzUi();
  if(ui.flash && ui.flash.cards && ui.flash.cards.length){ bindJazzCard(root); return; }
  const back = root.querySelector('#jzFback');
  if(back) back.onclick = () => navigate('#/jazz');
  $$('[data-jzgo]', root).forEach(b => b.onclick = () => navigate(b.dataset.jzgo));
  $$('[data-jzsyl]', root).forEach(c => c.onchange = () => {
    const id = c.dataset.jzsyl, at = st.syllabus.indexOf(id);
    c.checked ? (at < 0 && st.syllabus.push(id)) : (at >= 0 && st.syllabus.splice(at, 1));
    c.closest('.pick-row').classList.toggle('on', c.checked);
    saveNow();
    const go = root.querySelector('#jzBegin');
    if(go) go.disabled = !st.syllabus.length;
  });
  $$('[data-jzmode]', root).forEach(b => b.onclick = () => {
    st.keyMode = b.dataset.jzmode; saveNow(); rerender(); });
  $$('[data-jzck]', root).forEach(b => b.onclick = () => {
    const k = b.dataset.jzck, at = st.customKeys.indexOf(k);
    at < 0 ? st.customKeys.push(k) : st.customKeys.splice(at, 1);
    b.classList.toggle('on', at < 0); saveNow(); });
  $$('[data-jzn]', root).forEach(b => b.onclick = () => {
    st.cards = +b.dataset.jzn; saveNow(); rerender(); });
  const chk = root.querySelector('#jzChecks');
  if(chk) chk.onchange = () => { st.checks = chk.checked; saveNow(); sound('click'); };
  const go = root.querySelector('#jzBegin');
  if(go) go.onclick = () => {
    const cards = jazzDeal(st.syllabus, st.cards, st.keyMode, st.customKeys);
    if(!cards.length){ toast('Nothing to deal — choose an exercise first.'); return; }
    ui.flash = {cards, at: 0, shown: false, from: Date.now(), got: {nailed:0, struggled:0, couldnt:0}};
    /* a cold session is practice too, and the clock should be running for it */
    try { if(typeof timeAutoStart === 'function')
      timeAutoStart({categoryId:'piano', feature:'jazz', what:'jazz flashcards',
        linkedType:'skill', linkedId:null, linkedLabel:'Jazz piano'}); } catch(e){}
    sound('success'); rerender();
  };
}

/* ---------- one card ---------- */
/* what the card asked for, said back over the answer */
function jazzCardSaid(ex, card){
  const key = jazzPretty(card.key);
  const where = card.toKey ? `${key} → ${jazzPretty(card.toKey)}` : key;
  if(card.check) return `${ex.name} — ${jazzCheckAsk(card.check)} — ${where}`;
  return card.interval ? `${ex.name} — ${jazzSayInterval(card.interval)} from ${key}`
    : `${ex.ask} ${where}`;
}
function jazzCardHTML(){
  const f = jazzUi().flash;
  const card = f.cards[f.at];
  const ex = jazzExercise(card.exerciseId);
  if(!ex) return '<div class="empty">That exercise is no longer in the book.</div>';
  return `<div class="jz-card">
    <div class="row between" style="align-items:baseline">
      <span class="mono faint">card ${f.at + 1} of ${f.cards.length}</span>
      <button class="tbtn" id="jzQuit">stop</button></div>
    <div class="jz-cbar"><i style="width:${Math.round(f.at / f.cards.length * 100)}%"></i></div>
    ${f.shown ? `
      <p class="jz-cask mono">${esc(jazzCardSaid(ex, card))}</p>
      <!-- grading yourself against notes that might be wrong is worse than
           not grading yourself at all, so the card says so before you say
           whether you had it -->
      ${jazzAccuracyHTML(ex)}
      <div class="jz-stage-box"><div class="jz-score" id="jzCardScore"></div></div>
      ${card.toKey ? `<div class="jz-stage-box"><div class="jz-score" id="jzCardScore2"></div></div>` : ''}
      <p class="jz-chow">Did you have it?</p>
      <div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap">
        <button class="btn ghost danger" data-jzg="couldnt">✗ Couldn’t</button>
        <button class="btn ghost" data-jzg="struggled">~ Struggled</button>
        <button class="btn primary" data-jzg="nailed">✓ Had it</button>
      </div>`
    : `
      <!-- A checkpoint card asks the other question about the same pattern:
           not "can you find it" but "can you do it at a hundred and twenty,
           with your eyes shut, naming the third and seventh". The exercise's
           own name stays above it, because the checkpoint on its own does
           not say what it is a checkpoint OF. -->
      ${card.check ? `<p class="jz-cwhat mono">${esc(ex.name)}</p>
        <p class="jz-cprompt serif">${esc(jazzCheckAsk(card.check))}</p>
        <p class="jz-ctag mono">a checkpoint</p>`
      : `<p class="jz-cprompt serif">${esc(ex.ask)}</p>`}
      ${card.interval ? `<p class="jz-cint serif">${esc(jazzSayInterval(card.interval))}</p>
        <p class="jz-cfrom mono">from</p>` : ''}
      <p class="jz-ckey serif">${esc(jazzPretty(card.key))}${
        card.toKey ? ` <span class="jz-cto">→ ${esc(jazzPretty(card.toKey))}</span>` : ''}</p>
      <div class="row" style="justify-content:center;margin-top:26px">
        <button class="btn primary lg" id="jzShow">Show me</button></div>
      <p class="jz-chint mono">play it first — the card is worth nothing if you look</p>`}
  </div>`;
}
function bindJazzCard(root){
  const ui = jazzUi(), f = ui.flash;
  const card = f.cards[f.at];
  const ex = card && jazzExercise(card.exerciseId);
  const quit = root.querySelector('#jzQuit');
  if(quit) quit.onclick = () => { jazzEndSession(); };
  const show = root.querySelector('#jzShow');
  if(show) show.onclick = () => { f.shown = true; f.at0 = f.at0 || Date.now();
    f.seconds = (Date.now() - (f.from || Date.now())) / 1000; sound('click'); rerender(); };
  /* the answer is written out for the distance the card asked for, not for
     whatever the exercise page happened to be left on */
  /* the answer shows YOUR notes: a correction you made and then graded
     yourself against the uncorrected version would be worse than useless */
  const drawn = (k) => { const x = jazzScoreXml(ex, k, {interval: card.interval});
    return x ? jazzApplyFixes(x, card.exerciseId, k) : x; };
  if(f.shown && ex){ const xml = drawn(card.key);
    if(xml) jazzEngrave(root.querySelector('#jzCardScore'), xml);
    /* a card about moving between two keys has to show both of them, or the
       answer is only half of what was asked */
    if(card.toKey){ const two = drawn(card.toKey);
      if(two) jazzEngrave(root.querySelector('#jzCardScore2'), two); } }
  $$('[data-jzg]', root).forEach(b => b.onclick = () => {
    const how = b.dataset.jzg;
    jazzGrade(card.exerciseId, card.key, how, f.seconds);
    f.got[how] = (f.got[how] || 0) + 1;
    sound(how === 'nailed' ? 'success' : 'click');
    f.at++; f.shown = false; f.from = Date.now(); f.seconds = null;
    if(f.at >= f.cards.length){ jazzEndSession(true); return; }
    rerender();
  });
}
function jazzEndSession(finished){
  const ui = jazzUi();
  const f = ui.flash;
  ui.flash = null;
  try { if(typeof timeAutoStop === 'function') timeAutoStop('jazz'); } catch(e){}
  saveNow();
  if(finished && f){
    const said = `${f.got.nailed} had, ${f.got.struggled} shaky, ${f.got.couldnt} not yet.`;
    sound('success'); toast(said, 6000);
  }
  navigate('#/jazz');
  rerender();
}
