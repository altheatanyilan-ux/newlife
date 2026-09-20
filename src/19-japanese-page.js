/* ============================================================
   THE JAPANESE STUDIO — five rooms and a notebook.

   The pipeline, in the order it runs: a grammar point is drilled until the
   transformation is mechanical, then used to say something true about your
   own life; that becomes an island, in both registers, with the vocabulary it
   needs beside it; the island is pushed to speed against a shrinking clock;
   and translation, separately, keeps the structural knowledge honest by
   making you rebuild real Japanese from your own English a day later.
   Everything that goes wrong anywhere lands in one notebook, and the notebook
   feeds back into the grammar drills and the Study Deck.

   Five tabs rather than one long page, because these are five different
   sittings: the drill needs a microphone and twelve minutes, the notebook
   needs five, and putting them on one scroll meant the two at the bottom were
   never opened.

   What came out: the four-strands audit, the processability ladder and the
   machine-versus-human ratio. All three were built from the research rather
   than from a practice hour, and all three asked you to grade your week
   before you had done anything in it.
   ============================================================ */
function jaUi(){
  return S._ja = S._ja || {tab:'drill', errType:null, errSource:null, errFind:''};
}
const JA_TABS = [
  ['drill',      '\ud83c\udf99 4/3/2'],
  ['islands',    '\ud83c\udfdd Islands'],
  ['translate',  '\ud83d\udcd6 Translation'],
  ['grammar',    '\ud83d\udcd0 Grammar'],
  ['errors',     '\ud83d\udcd5 Notebook']];

routes.japanese = function(root, params){
  const j = jaState2();
  const u = jaUi();
  const want = params && params[0];
  if(JA_TABS.some(t => t[0] === want)) u.tab = want;
  registerPageEntry({pageName:'Japanese Studio', addLabel:'Practise', defaultEntryType:'session', prefilledFields:{}, options:[
    {icon:'\ud83c\udf99', label:'A 4/3/2 sitting', desc:'One talk, three times, a shrinking clock.', run:()=>openJa432Setup()},
    {icon:'\ud83c\udfdd', label:'An island', desc:'A monologue worth having by heart, in both registers.', run:()=>openJaIsland()},
    {icon:'\ud83d\udcd6', label:'A text to translate', desc:'Japanese in, English out, and back again a day later.', run:()=>openJaTr1()},
    {icon:'\ud83d\udcd0', label:'A grammar point', desc:'The one you keep getting wrong.', run:()=>openJaGrammar()},
    {icon:'\ud83d\udcd5', label:'An error', desc:'What you tried, and what it should have been.', run:()=>openJaError()}]});
  root.innerHTML = `<div class="page ja-page">
    <h1 class="serif">Japanese Studio</h1>
    <p class="muted ja-lede">Knowing more Japanese and being able to say the Japanese you already know are different skills, and only the second is what anybody means by fluent. Five rooms in a line: drill a pattern, use it about your own life, learn the result by heart, push it to speed, and keep every mistake in one book.</p>
    <div class="tabs ja-tabs">${JA_TABS.map(([k, name]) =>
      `<button class="tab${u.tab === k ? ' on' : ''}" data-jatab="${k}">${name}</button>`).join('')}</div>
    <div class="ja-body">${jaTabHTML(u.tab)}</div>
  </div>`;
  bindJapanese(root);
};
function jaTabHTML(tab){
  if(tab === 'islands') return jaIslandsHTML();
  if(tab === 'translate') return jaTranslateHTML();
  if(tab === 'grammar') return jaGrammarHTML();
  if(tab === 'errors') return jaErrorsHTML();
  /* the drill, and the two other kinds of recorded practice that belong with
     it: a scenario and a shadowing take are both "open your mouth" work */
  return ja432HTML() + jaScenariosHTML() + jaShadowingHTML();
}

function bindJapanese(root){
  const j = jaState2();
  const u = jaUi();
  const redraw = () => { saveNow(); rerender(); };
  const on = (sel, fn) => { const n = root.querySelector(sel); if(n) n.onclick = fn; };
  const each = (attr, fn) => $$(`[data-${attr}]`, root).forEach(b => b.onclick = () => fn(b.dataset[attr], b));

  $$('[data-jatab]', root).forEach(b => b.onclick = () => navigate(`#/japanese/${b.dataset.jatab}`));

  /* the drill */
  on('#ja432New', () => openJa432Setup());
  each('jaaudit', id => openJa432Audit(id));
  each('jaerr', id => openJaError(null, {source:'432', sourceId:id}));
  each('jasessdel', id => { const s = byId(j.sessions, id);
    if(s) jaDropAudio((s.deliveries || []).map(d => d.audioId));
    spliceOut(j.sessions, v => v.id === id); sound('click'); redraw(); });

  /* the islands */
  on('#jaIslandNew', () => openJaIsland());
  each('jaislandedit', id => openJaIsland(id));
  each('jaisland432', id => openJa432Setup(id));
  each('jaislandcard', id => { const i = byId(j.islands, id);
    if(!i || typeof suggestStudyCard !== 'function') return;
    suggestStudyCard({type:'production', sourceType:'island', sourceId:i.id,
      front:`Deliver your island: ${i.topic}`, back: i.japaneseTeineigo || i.japaneseTameguchi,
      sourceLabel:`Island \u2014 ${i.topic}`, tags:['island']});
    sound('success'); toast('In the Study Deck inbox.'); rerender(); });
  each('jaislanddel', id => { spliceOut(j.islands, i => i.id === id); sound('click'); redraw(); });
  on('#jaChunksToDeck', () => { const n = jaChunksToDeck();
    toast(n ? `${n} chunk${n === 1 ? '' : 's'} in the Study Deck inbox.` : 'Nothing hesitant left to send.');
    if(n) sound('success'); rerender(); });
  on('#jaStoneNew', () => openJaStone('filler'));
  each('jastoneadd', shelf => openJaStone(shelf));
  each('jastone', id => openJaStone(null, id));
  /* the chip opens the phrase and the cross inside it throws the phrase away,
     so the cross has to stop the press there — otherwise it deletes the
     phrase and then opens an editor for a phrase that is no longer anywhere */
  $$('[data-jastonedel]', root).forEach(b => b.onclick = ev => { ev.stopPropagation();
    spliceOut(j.stones, v => v.id === b.dataset.jastonedel); sound('click'); redraw(); });

  /* the scenarios and the shadowing */
  on('#jaScenNew', () => openJaScenario());
  each('jascenedit', id => openJaScenario(id));
  each('jascenrun', id => { const s = byId(j.scenarios, id); if(s){ s.times = (+s.times || 0) + 1;
    s.lastDone = today(); sound('success'); redraw(); } });
  on('#jaShadowNew', () => openJaShadow());
  each('jashadowdel', id => { spliceOut(j.shadowing, s => s.id === id); sound('click'); redraw(); });

  /* the translations */
  on('#jaTrNew', () => openJaTr1());
  each('jatr1', id => openJaTr1(id));
  each('jatr2', id => openJaTr2(id));
  each('jatrcmp', id => openJaTrCompare(id));
  each('jatrdel', id => { spliceOut(j.translations, t => t.id === id); sound('click'); redraw(); });

  /* the grammar */
  on('#jaGramNew', () => openJaGrammar());
  each('jagramopen', id => openJaGrammar(id));
  each('jagramdrill', id => openJaGrammarDrill(id));
  each('jagramapply', id => openJaGrammarApply(id));
  each('jagramdeck', id => { const n = jaGrammarToDeck(id);
    toast(n ? `${n} card${n === 1 ? '' : 's'} in the Study Deck inbox.` : 'No drills to send.');
    if(n) sound('success'); });
  each('jagramdel', id => { spliceOut(j.grammar, g => g.id === id); sound('click'); redraw(); });

  /* the notebook */
  on('#jaErrNew', () => openJaError());
  each('jaerropen', id => openJaError(id));
  each('jaerrcard', id => { if(jaErrorToDeck(id)){ sound('success'); redraw(); } });
  each('jaerrgram', id => { u.tab = 'grammar'; saveNow(); navigate('#/japanese/grammar');
    setTimeout(() => openJaGrammar(id), 60); });
  each('jaerrdel', id => { spliceOut(j.errors, e => e.id === id); sound('click'); redraw(); });
  const pick = (sel, key) => { const n = root.querySelector(sel); if(!n) return;
    n.onchange = () => { u[key] = n.value || null; saveNow(); rerender(); }; };
  pick('#jaErrType', 'errType'); pick('#jaErrSource', 'errSource');
  const find = root.querySelector('#jaErrFind');
  if(find) find.onchange = () => { u.errFind = find.value.trim(); saveNow(); rerender(); };
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
  const tr = j.translations ? j.translations.filter(t => (t.pass2Date || '').slice(0, 10) >= from
    && (t.pass2Date || '').slice(0, 10) <= to) : [];
  if(tr.length) out.push(`${tr.length} text${tr.length === 1 ? '' : 's'} rebuilt from your own English.`);
  const open = (j.errors || []).filter(e => !String(e.corrected || '').trim()).length;
  if(open) out.push(`${open} entr${open === 1 ? 'y in the notebook has' : 'ies in the notebook have'} no correction written in yet.`);
  return out;
}
