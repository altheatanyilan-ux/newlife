/* ============================================================
   THE CARDS THEMSELVES — four kinds, because four kinds of knowing.

   A fact you can state, a phrase you have to produce, a sentence with a hole
   in it, and a thing you do with your hands. They are different cards because
   answering them is a different act: you cannot check whether you can play a
   ii-V-I in Eb by reading the answer.
   ============================================================ */

/* The front of a card, whatever kind it is. `shown` is whether the answer has
   been asked for yet — an action card has no back to flip to, so its front
   carries its own two buttons and the reference only appears after. */
function studyFaceHTML(c, shown){
  const t = c.type;
  if(t === 'cloze') return studyClozeHTML(c, shown);
  if(t === 'action') return `<div class="sd-face sd-action">
    <div class="sd-kind mono">do this</div>
    <div class="sd-front">${md(c.front)}</div>
    ${shown && c.reference ? `<div class="sd-ref">${md(c.reference)}</div>` : ''}
  </div>`;
  if(t === 'production') return `<div class="sd-face sd-production">
    <div class="sd-kind mono">say it</div>
    <div class="sd-front">${md(c.front)}</div>
    ${shown ? `<div class="sd-back">${md(c.back)}</div>` : ''}
  </div>`;
  if(t === 'image_recall') return `<div class="sd-face">
    ${c.imageData ? `<img class="sd-img" src="${esc(c.imageData)}" alt="">` : ''}
    <div class="sd-front">${md(c.front)}</div>
    ${shown ? `<div class="sd-back">${md(c.back)}</div>` : ''}
  </div>`;
  return `<div class="sd-face">
    <div class="sd-front">${md(c.front)}</div>
    ${shown ? `<div class="sd-back">${md(c.back)}</div>` : ''}
  </div>`;
}
/* The hole in a cloze is written as {{…}} in the front text. Typing the answer
   is the honest version and multiple choice is the fast one; which you get is
   a setting, because on a day when you have twenty of these the difference
   between honest and finished is the difference between doing it and not. */
const CLOZE_RE = /\{\{([^}]*)\}\}/;
function clozeParts(c){
  const m = CLOZE_RE.exec(c.front || '');
  if(!m) return {before: c.front || '', answer: c.clozeAnswer || '', after: ''};
  return {before: (c.front || '').slice(0, m.index), answer: c.clozeAnswer || m[1], after: (c.front || '').slice(m.index + m[0].length)};
}
function studyClozeHTML(c, shown){
  const {before, answer, after} = clozeParts(c);
  const opts = (c.clozeOptions || []).length ? c.clozeOptions : null;
  const mode = studyState().settings.clozeInput;
  return `<div class="sd-face sd-cloze">
    <div class="sd-kind mono">fill the gap</div>
    <div class="sd-front">${esc(before)}<span class="sd-gap${shown ? ' shown' : ''}">${
      shown ? esc(answer) : '&nbsp;&nbsp;&nbsp;&nbsp;'}</span>${esc(after)}</div>
    ${shown ? '' : opts && mode === 'multiple_choice'
      ? `<div class="sd-opts">${opts.map(o => `<button class="sd-opt" data-sdopt="${esc(o)}">${esc(o)}</button>`).join('')}</div>`
      : `<input class="inp sd-type" id="sdType" placeholder="type it" autocomplete="off" spellcheck="false">`}
    ${shown && c.back ? `<div class="sd-back">${md(c.back)}</div>` : ''}
  </div>`;
}
/* Whether what was typed is the answer. Deliberately forgiving about the
   things that are not the point: surrounding space, and the full-width space
   a Japanese keyboard produces. It is not forgiving about the characters
   themselves, because those are the point. */
function clozeMatches(c, typed){
  const norm = s => String(s ?? '').replace(/[\s　]+/g, '').trim();
  return !!norm(typed) && norm(typed) === norm(clozeParts(c).answer);
}

/* ---------- the session ---------- */
function studySession(){
  return S._study = S._study || {queue:[], at:0, shown:false, deckId:null, done:null, typed:''};
}
function startStudySession(deckId){
  const q = studyQueue(deckId || null);
  if(!q.length){ toast(deckId ? 'Nothing due in that deck.' : 'Nothing due. Come back tomorrow.'); return false; }
  S._study = {queue:q.map(c => c.id), at:0, shown:false, deckId: deckId || null,
    started: Date.now(), tally:{again:0, hard:0, good:0, easy:0}, done:null, typed:''};
  navigate('#/study/session');
  return true;
}
const studyCurrent = () => { const s = studySession(); return studyCard(s.queue[s.at]) || null; };

function studySessionHTML(){
  const s = studySession();
  if(s.done) return studySummaryHTML(s);
  const c = studyCurrent();
  if(!c) return `<div class="empty">This session is over. <a href="#/study">Back to the decks</a>.</div>`;
  const d = studyDeck(c.deckId);
  const left = s.queue.length - s.at;
  const prev = studyPreview(c);
  const showPrev = studyState().settings.showPreview;
  return `<div class="sd-session">
    <div class="sd-top">
      <a class="btn sm ghost" href="#/study">← the decks</a>
      <span class="sd-where">${d ? `${d.emoji} ${esc(d.name)}` : ''}</span>
      <span class="mono sd-left">${left} of ${s.queue.length} left</span>
    </div>
    <div class="sd-rule"><i style="width:${Math.round(s.at / s.queue.length * 100)}%"></i></div>
    <div class="sd-card${s.shown ? ' shown' : ''}" data-sdcard="${esc(c.id)}">${studyFaceHTML(c, s.shown)}</div>
    ${s.shown
      ? `<div class="sd-grade">${STUDY_BUTTONS.map(([k, name, hint]) => `
          <button class="sd-btn sd-${k}" data-sdgrade="${k}" title="${esc(hint)}">
            <span class="sd-btn-n">${esc(name)}</span>
            ${showPrev ? `<span class="sd-btn-i mono">${esc(studySaid(prev[k]))}</span>` : ''}
          </button>`).join('')}</div>`
      : `<div class="sd-go">
          <button class="btn primary" id="sdShow">${c.type === 'action' ? 'I did it — show the answer' : 'Show the answer'}</button>
          <button class="btn sm ghost" id="sdSkip">skip</button>
        </div>`}
    ${c.sourceLabel ? `<div class="sd-source mono">📌 ${esc(c.sourceLabel)}${
      c.sourceGo ? ` <a href="${esc(c.sourceGo)}">→ go to it</a>` : ''}</div>` : ''}
  </div>`;
}
function studySummaryHTML(s){
  const mins = Math.max(1, Math.round((Date.now() - (s.started || Date.now())) / 60000));
  const n = s.queue.length;
  const [line, who] = STUDY_PARTINGS[Math.floor(Math.random() * STUDY_PARTINGS.length)];
  const tomorrow = studyCards().filter(c => c.status === 'active' && c.due === addDays(today(), 1)).length;
  return `<div class="sd-summary">
    <div class="sd-done">✓</div>
    <h2 class="serif">Session complete</h2>
    <div class="sd-sum-n mono">${n} card${n === 1 ? '' : 's'} in ${mins} minute${mins === 1 ? '' : 's'}</div>
    <div class="sd-tally">${STUDY_BUTTONS.map(([k, name]) =>
      `<span class="sd-tal sd-${k}"><b>${s.tally[k] || 0}</b> ${esc(name.toLowerCase())}</span>`).join('')}</div>
    <div class="sd-next mono">${tomorrow ? `${tomorrow} due tomorrow` : 'nothing due tomorrow'}</div>
    <div class="sd-streak">🔥 ${studyStreak()}-day streak</div>
    <blockquote class="sd-parting">${esc(line)}<cite>— ${esc(who)}</cite></blockquote>
    <div class="row" style="gap:8px;justify-content:center">
      <a class="btn ghost" href="#/study">Close</a>
      ${studyDue(null).length ? `<button class="btn primary" id="sdMore">Study the rest (${studyDue(null).length})</button>` : ''}
    </div>
  </div>`;
}
function bindStudySession(root){
  const s = studySession();
  const c = studyCurrent();
  const show = root.querySelector('#sdShow');
  if(show) show.onclick = () => { s.shown = true; sound('click'); rerender(); };
  const skip = root.querySelector('#sdSkip');
  /* Skipping moves the card to the back rather than dropping it: you skipped
     because you were not ready this second, not because it is not due. */
  if(skip) skip.onclick = () => { const id = s.queue.splice(s.at, 1)[0];
    s.queue.push(id); s.shown = false; sound('click'); rerender(); };
  const typed = root.querySelector('#sdType');
  if(typed){ typed.focus();
    typed.onkeydown = ev => { if(ev.key !== 'Enter') return;
      s.typed = typed.value; s.shown = true;
      /* the typed answer grades itself: right is Good, wrong is Again, and
         either can be overruled by pressing a different button */
      s.suggest = clozeMatches(c, typed.value) ? 'good' : 'again';
      sound(s.suggest === 'good' ? 'success' : 'click'); rerender(); }; }
  $$('[data-sdopt]', root).forEach(b => b.onclick = () => {
    s.typed = b.dataset.sdopt; s.shown = true;
    s.suggest = clozeMatches(c, b.dataset.sdopt) ? 'good' : 'again';
    sound(s.suggest === 'good' ? 'success' : 'click'); rerender(); });
  $$('[data-sdgrade]', root).forEach(b => b.onclick = () => {
    const k = b.dataset.sdgrade;
    studyAnswer(s.queue[s.at], k);
    s.tally[k] = (s.tally[k] || 0) + 1;
    s.at += 1; s.shown = false; s.typed = ''; s.suggest = null;
    if(s.at >= s.queue.length){ s.done = true; sound('success'); try { RewardFX.check(); } catch(e){} }
    else sound('click');
    rerender();
  });
  const more = root.querySelector('#sdMore');
  if(more) more.onclick = () => startStudySession(null);
  /* the four grades on the keys under your fingers, and space to turn a card */
  if(!root._sdKeys){
    root._sdKeys = true;
    root.addEventListener('keydown', ev => {
      if(ev.target.matches('input, textarea')) return;
      if(ev.key === ' ' && !s.shown){ ev.preventDefault(); s.shown = true; rerender(); return; }
      const n = ['1','2','3','4'].indexOf(ev.key);
      if(n > -1 && s.shown){ ev.preventDefault(); root.querySelector(`[data-sdgrade="${STUDY_BUTTONS[n][0]}"]`)?.click(); }
    });
  }
}
