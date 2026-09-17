/* ============================================================
   THE JAPANESE STUDIO — the room, and everything you can press in it.
   ============================================================ */
routes.japanese = function(root){
  const j = jaState();
  registerPageEntry({pageName:'Japanese Studio', addLabel:'Log a session', defaultEntryType:'session', prefilledFields:{}, options:[
    {icon:'🎙', label:'A 4/3/2 session', desc:'One talk, three times, a shrinking clock.', run:()=>openJa432()},
    {icon:'🏝', label:'An island', desc:'A monologue worth having by heart.', run:()=>openJaIsland()},
    {icon:'✏️', label:'An error', desc:'What you meant, and what it should have been.', run:()=>openJaError()}]});
  /* One room, no tabs. Everything on this page is the Speaking Lab, so there
     is nothing to choose between before you can start. */
  root.innerHTML = `<div class="page ja-page">
    <h1 class="serif">Japanese Studio</h1>
    <p class="muted ja-lede">Knowing more Japanese and being able to say the Japanese you already know are different skills, and only the second one is what anybody means by fluent. This room trains the second: repetition against a clock, monologues you can stand on while you think, and a log that turns the things you got wrong into the things you drill.</p>
    <div class="ja-body">${ja432HTML() + jaIslandsHTML() + jaScenariosHTML()
      + jaShadowingHTML() + jaErrorsHTML() + jaStrandsHTML()}</div>
  </div>`;
  bindJapanese(root);
};

function bindJapanese(root){
  const j = jaState();
  const redraw = () => { saveNow(); rerender(); };
  const on = (sel, fn) => { const n = root.querySelector(sel); if(n) n.onclick = fn; };
  const each = (attr, fn) => $$(`[data-${attr}]`, root).forEach(b => b.onclick = () => fn(b.dataset[attr], b));

  on('#ja432New', () => openJa432());
  each('jaerr', id => openJaError(id));
  each('jasessdel', id => { spliceOut(j.sessions, s => s.id === id); sound('click'); redraw(); });
  on('#jaIslandNew', () => openJaIsland());
  each('jaislandedit', id => openJaIsland(id));
  each('jaislandpx', id => { const i = byId(j.islands, id); if(i){ i.lastPracticed = today();
    /* practising an island is what moves it along, so the status follows the
       practice rather than waiting to be set by hand */
    if(i.status === 'corrected') i.status = 'memorizing';
    sound('success'); redraw(); } });
  each('jaislandcard', id => { const i = byId(j.islands, id);
    if(!i || typeof suggestStudyCard !== 'function') return;
    suggestStudyCard({type:'production', sourceType:'island', sourceId:i.id,
      front:`Deliver your island: ${i.topic}`, back:i.japaneseText,
      sourceLabel:`Island — ${i.topic}`, tags:['island']});
    sound('success'); toast('In the Study Deck inbox.'); rerender(); });
  each('jaislanddel', id => { spliceOut(j.islands, i => i.id === id); sound('click'); redraw(); });
  on('#jaScenNew', () => openJaScenario());
  each('jascenedit', id => openJaScenario(id));
  each('jascenrun', id => { const s = byId(j.scenarios, id); if(s){ s.times = (+s.times || 0) + 1;
    s.lastDone = today(); sound('success'); redraw(); } });
  on('#jaShadowNew', () => openJaShadow());
  each('jashadowdel', id => { spliceOut(j.shadowing, s => s.id === id); sound('click'); redraw(); });
  on('#jaErrNew', () => openJaError());
  each('jaerrcard', id => { const e = byId(j.errors, id);
    if(!e || typeof suggestStudyCard !== 'function') return;
    suggestStudyCard({type:'production', sourceType:'error_log', sourceId:e.id,
      front:`Say this in Japanese:\n\n${e.intendedMeaning}`, back:e.correctedNatural,
      sourceLabel:`Speaking Lab, ${fmtDate(e.date, 'med')}`, tags:[String(e.errorType || '').replace(/\s+/g, '-')]});
    e.sentToStudyDeck = true; sound('success'); redraw(); });
  each('jaerrdel', id => { spliceOut(j.errors, e => e.id === id); sound('click'); redraw(); });
  on('#jaStrandNew', () => openJaStrands());
}

function openJaScenario(id){
  const j = jaState();
  const s = id ? byId(j.scenarios, id) : {id:uid(), name:'', category:'daily_life', difficulty:'beginner',
    order:j.scenarios.length, script:'', myLines:'', corrected:false, times:0, lastDone:null, errorIds:[]};
  const m = openModal(`<h2>${id ? s.name || 'The scenario' : 'A scenario'}</h2>
    <div class="grid c3" style="gap:10px">
      <label class="pd-q"><span class="k">what</span><input class="inp" id="scName" value="${esc(s.name)}" autofocus placeholder="At the post office"></label>
      <label class="pd-q"><span class="k">kind</span><select class="sel" id="scCat">${
        [['daily_life','daily life'],['social','social'],['professional','work'],['abstract','abstract']].map(([v, n]) =>
          `<option value="${v}" ${s.category === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
      <label class="pd-q"><span class="k">how hard</span><select class="sel" id="scDiff">${
        ['beginner','intermediate','advanced'].map(v => `<option value="${v}" ${s.difficulty === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    </div>
    <!-- both sides, because you cannot drill your half without knowing what
         it is answering -->
    <label class="pd-q" style="margin-top:10px"><span class="k">the whole dialogue</span>
      <textarea class="inp ja-jp-input" rows="6" id="scScript" placeholder="店員：いらっしゃいませ。&#10;私：…">${esc(s.script)}</textarea></label>
    <label class="pd-q" style="margin-top:10px"><span class="k">just your lines, for drilling</span>
      <textarea class="inp ja-jp-input" rows="4" id="scMine">${esc(s.myLines)}</textarea></label>
    <label class="ja-check" style="margin-top:10px"><input type="checkbox" id="scOk" ${s.corrected ? 'checked' : ''}> a native has been over it</label>
    <div class="row" style="justify-content:flex-end;margin-top:14px;gap:8px">
      ${id ? `<button class="btn sm ghost danger" id="scDel">Delete</button><span class="grow"></span>` : ''}
      <button class="btn primary" id="scSave">Save</button></div>`, 'narrow ja-modal');
  m.querySelector('#scSave').onclick = () => {
    const name = m.querySelector('#scName').value.trim();
    if(!name){ m.querySelector('#scName').focus(); return; }
    Object.assign(s, {name, category:m.querySelector('#scCat').value, difficulty:m.querySelector('#scDiff').value,
      script:m.querySelector('#scScript').value, myLines:m.querySelector('#scMine').value,
      corrected:m.querySelector('#scOk').checked});
    if(!id) j.scenarios.push(s);
    saveNow(); m.remove(); sound('success'); rerender();
  };
  const del = m.querySelector('#scDel');
  if(del) del.onclick = () => { spliceOut(j.scenarios, x => x.id === s.id); saveNow(); m.remove(); sound('click'); rerender(); };
  return m;
}

/* ---------- what the rest of the house gets out of it ---------- */
function jaSkill(){
  return (S.skills || []).find(s => /japanese|日本語|nihongo/i.test(s.name || '')) || null;
}
/* Minutes at it are hours on the skill, if there is a Japanese skill to put
   them on. Nothing is invented: a skill that appears because you practised is
   a skill you did not choose to track. */
function jaCredit(mins){
  const m = +mins || 0; if(m < 1) return;
  const sk = jaSkill();
  if(sk){ sk.hours = +(((+sk.hours || 0) + m / 60).toFixed(2)); sk.lastPracticed = today(); }
  const h = (S.habits || []).find(x => !x.archived && /japanese|日本語|language/i.test(x.name || ''));
  if(h){ const d = today(); S.habitLog = S.habitLog || {}; S.habitLog[d] = S.habitLog[d] || {};
    if(!S.habitLog[d][h.id]) S.habitLog[d][h.id] = {level:'full', note:'practised'}; }
}
function jaReviewLines(from, to){
  if(!S.japanese) return [];
  const j = jaState();
  const out = [];
  const ses = jaIn(j.sessions, from, to);
  if(ses.length) out.push(`${ses.length} speaking ${ses.length === 1 ? 'session' : 'sessions'}, ${jaHours(from, to)} hours in all.`);
  const gains = ses.map(jaSessionGain).filter(Boolean);
  if(gains.length){ const avg = Math.round(sum(gains.map(g => g.pct)) / gains.length);
    if(avg > 0) out.push(`The third delivery ran ${avg}% faster than the first, on average.`); }
  const mid = jaMidClauseShare(from, to);
  if(mid != null) out.push(mid > 0.6
    ? `Still pausing mid-clause most of the time — the grammar is being assembled as you speak.`
    : mid < 0.35 ? `Pausing at clause boundaries now, which is what proceduralised grammar sounds like.`
    : `Pauses are mixed — halfway between assembling and planning.`);
  const top = jaTopPatterns(from, to, 3);
  if(top.length) out.push(`Errors: ${top.map(([k, n]) => `${k} (${n})`).join(', ')}.`);
  const w = jaAiWarning();
  if(w) out.push(`${Math.round(w.aiShare * 100)}% of your partnered practice was with a machine. Book a person.`);
  const st = jaStrandTrouble(jaStrandsLatest());
  if(st.length) out.push(st[0]);
  return out;
}
