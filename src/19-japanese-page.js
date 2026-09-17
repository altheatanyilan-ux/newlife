/* ============================================================
   THE JAPANESE STUDIO — the room, and everything you can press in it.
   ============================================================ */
const jaTab = () => { const t = S._jaTab || 'speaking';
  return JA_TABS.some(x => x[0] === t) ? t : 'speaking'; };

routes.japanese = function(root){
  const j = jaState();
  registerPageEntry({pageName:'Japanese Studio', addLabel:'Log a session', defaultEntryType:'session', prefilledFields:{}, options:[
    {icon:'🎙', label:'A 4/3/2 session', desc:'One talk, three times, a shrinking clock.', run:()=>openJa432()},
    {icon:'🏝', label:'An island', desc:'A monologue worth having by heart.', run:()=>openJaIsland()},
    {icon:'✏️', label:'An error', desc:'What you meant, and what it should have been.', run:()=>openJaError()}]});
  const tab = jaTab();
  root.innerHTML = `<div class="page ja-page">
    <h1 class="serif">Japanese Studio</h1>
    <p class="muted ja-lede">Knowing more Japanese and being able to say the Japanese you already know are different skills, and only the second one is what anybody means by fluent. This room trains the second: repetition against a clock, monologues you can stand on while you think, and a log that turns the things you got wrong into the things you drill.</p>
    <div class="ja-tabs" role="tablist">${JA_TABS.map(([id, name, hint]) =>
      `<button class="ja-tab${tab === id ? ' on' : ''}" data-jatab="${id}" role="tab" aria-selected="${tab === id}">
        <span>${esc(name)}</span><em>${esc(hint)}</em></button>`).join('')}</div>
    <div class="ja-body">${
      tab === 'grammar' ? jaLadderHTML() + jaGrammarHTML() + jaTranslationsHTML()
      : tab === 'vocab' ? jaVocabHTML()
      : tab === 'writing' ? jaWritingHTML()
      : tab === 'progress' ? jaProgressHTML()
      : ja432HTML() + jaIslandsHTML() + jaScenariosHTML() + jaShadowingHTML() + jaErrorsHTML() + jaStrandsHTML()}</div>
  </div>`;
  bindJapanese(root);
};

function bindJapanese(root){
  const j = jaState();
  const redraw = () => { saveNow(); rerender(); };
  const on = (sel, fn) => { const n = root.querySelector(sel); if(n) n.onclick = fn; };
  const each = (attr, fn) => $$(`[data-${attr}]`, root).forEach(b => b.onclick = () => fn(b.dataset[attr], b));

  $$('[data-jatab]', root).forEach(b => b.onclick = () => { S._jaTab = b.dataset.jatab; sound('click'); rerender(); });

  /* speaking */
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

  /* grammar */
  on('#jaPtSet', () => openJaPt());
  on('#jaGramNew', () => openJaGrammar());
  each('jagramedit', id => openJaGrammar(id));
  each('jagramcard', id => jaGrammarCard(id));
  each('jagramdel', id => { spliceOut(j.grammar, g => g.id === id); sound('click'); redraw(); });
  on('#jaTransNew', () => openJaTranslation());
  each('jatransback', id => openJaTranslation(id, 'back'));
  each('jatranssee', id => openJaTranslation(id, 'see'));
  each('jatransdel', id => { spliceOut(j.translations, t => t.id === id); sound('click'); redraw(); });

  /* vocabulary */
  on('#jaChunkNew', () => openJaChunk());
  each('jatopic', id => { S._jaTopic = S._jaTopic === id ? null : id; sound('click'); rerender(); });
  each('jachunkready', id => { const c = byId(j.chunks, id); if(c){ c.productionReady = !c.productionReady;
    c.lastDrilled = today(); sound('click'); redraw(); } });
  each('jachunkcard', id => jaChunkCards(id));
  each('jachunkdel', id => { spliceOut(j.chunks, c => c.id === id); sound('click'); redraw(); });

  /* writing */
  on('#jaWriteNew', () => openJaWriting());
  each('jawriteedit', id => openJaWriting(id));
  each('jawritedel', id => { spliceOut(j.writing, w => w.id === id); sound('click'); redraw(); });
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

function openJaChunk(){
  const j = jaState();
  const m = openModal(`<h2>A chunk</h2>
    <p class="muted ja-note">Not a word. 決める is a dictionary entry; 予定を決める is something you can say.</p>
    <label class="pd-q"><span class="k">the Japanese</span>
      <input class="inp serif-lg ja-jp-input" id="chJa" autofocus placeholder="予定を決める"></label>
    <div class="grid c2" style="gap:10px;margin-top:10px">
      <label class="pd-q"><span class="k">how it reads</span><input class="inp ja-jp-input" id="chRead" placeholder="よていをきめる"></label>
      <label class="pd-q"><span class="k">pitch</span><input class="inp mono" id="chPitch" placeholder="optional"></label>
    </div>
    <label class="pd-q" style="margin-top:10px"><span class="k">what it means</span>
      <input class="inp" id="chMean" placeholder="to decide on a plan"></label>
    <div class="grid c2" style="gap:10px;margin-top:10px">
      <label class="pd-q"><span class="k">topic</span><select class="sel" id="chTopic">${j.topics.map(t =>
        `<option value="${esc(t.id)}" ${S._jaTopic === t.id ? 'selected' : ''}>${esc(t.emoji)} ${esc(t.name)}</option>`).join('')}</select></label>
      <label class="pd-q"><span class="k">what kind</span><select class="sel" id="chType">${JA_CHUNK_TYPES.map(([v, n, eg]) =>
        `<option value="${v}" title="${esc(eg)}">${esc(n)}</option>`).join('')}</select></label>
    </div>
    <label class="pd-q" style="margin-top:10px"><span class="k">in a sentence</span>
      <input class="inp ja-jp-input" id="chEg" placeholder="明日の予定を決めましょう。"></label>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="chSave">Save</button></div>`, 'narrow ja-modal');
  m.querySelector('#chSave').onclick = () => {
    const japanese = m.querySelector('#chJa').value.trim();
    if(!japanese){ m.querySelector('#chJa').focus(); return; }
    const topicId = m.querySelector('#chTopic').value;
    j.chunks.push({id:uid(), japanese, reading:m.querySelector('#chRead').value.trim(),
      meaning:m.querySelector('#chMean').value.trim(), topicId,
      type:m.querySelector('#chType').value, pitchAccent:m.querySelector('#chPitch').value.trim() || null,
      exampleSentence:m.querySelector('#chEg').value.trim() || null, productionReady:false,
      lastDrilled:null, linkedIslandIds:[], sentToStudyDeck:false, createdAt:new Date().toISOString()});
    S._jaTopic = topicId;
    saveNow(); m.remove(); sound('success'); rerender();
  };
  return m;
}

/* The delay is enforced rather than suggested: without it you are copying
   from memory rather than reconstructing, and the whole exercise collapses
   into a transcription test. */
function openJaTranslation(id, step){
  const j = jaState();
  const t = id ? byId(j.translations, id) : null;
  if(step === 'see' && t) return openModal(`<h2>${esc(t.originalSource || 'Side by side')}</h2>
    <div class="ja-compare">
      <div><span class="k mono">what was written</span><p class="ja-jp">${esc(t.originalJapanese)}</p></div>
      <div><span class="k mono">what you put back</span><p class="ja-jp">${esc(t.backTranslation || '')}</p></div>
    </div>
    <label class="pd-q" style="margin-top:12px"><span class="k">your English, in between</span>
      <p class="ja-en">${esc(t.userEnglish || '')}</p></label>
    ${(t.divergences || []).length ? `<div class="ja-divs"><span class="k mono">the gaps</span>
      ${t.divergences.map(d => `<div class="ja-dv"><span class="ja-jp-inline">${esc(d.original)}</span>
        <span class="ja-dv-v">vs</span><span class="ja-jp-inline">${esc(d.mine)}</span>
        ${d.note ? `<em>${esc(d.note)}</em>` : ''}</div>`).join('')}</div>` : ''}`, 'ja-modal');
  if(step === 'back' && t){
    const m = openModal(`<h2>Put it back into Japanese</h2>
      <p class="muted ja-note">Without looking at the original. Every place yours differs is a gap you could not have found by reading.</p>
      <div class="ja-en-box">${esc(t.userEnglish)}</div>
      <label class="pd-q" style="margin-top:10px"><span class="k">your Japanese</span>
        <textarea class="inp ja-jp-input" rows="6" id="tbJa" autofocus>${esc(t.backTranslation || '')}</textarea></label>
      <label class="pd-q" style="margin-top:10px"><span class="k">what you noticed, comparing</span>
        <textarea class="inp" rows="3" id="tbNotes" placeholder="one line per gap"></textarea></label>
      <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="tbSave">Done — compare</button></div>`, 'narrow ja-modal');
    m.querySelector('#tbSave').onclick = () => {
      t.backTranslation = m.querySelector('#tbJa').value;
      t.step2Date = today(); t.status = 'completed';
      const notes = m.querySelector('#tbNotes').value.split('\n').map(x => x.trim()).filter(Boolean);
      t.divergences = notes.map(n => ({original:'', mine:'', note:n}));
      saveNow(); m.remove(); sound('success'); rerender();
      openJaTranslation(t.id, 'see');
    };
    return m;
  }
  const m = openModal(`<h2>A text to work through</h2>
    <label class="pd-q"><span class="k">where it is from</span>
      <input class="inp" id="tnSrc" autofocus placeholder="an article, a novel, a lyric"></label>
    <label class="pd-q" style="margin-top:10px"><span class="k">the Japanese</span>
      <textarea class="inp ja-jp-input" rows="5" id="tnJa" placeholder="paste it here"></textarea></label>
    <label class="pd-q" style="margin-top:10px"><span class="k">your English, in full</span>
      <textarea class="inp" rows="5" id="tnEn" placeholder="comprehensively — this is the step that breaks the structure open"></textarea></label>
    <p class="muted ja-note">It then rests until tomorrow. You cannot reconstruct a sentence you can still remember.</p>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="tnSave">Put it away</button></div>`, 'narrow ja-modal');
  m.querySelector('#tnSave').onclick = () => {
    const jp = m.querySelector('#tnJa').value.trim();
    if(!jp){ m.querySelector('#tnJa').focus(); return; }
    j.translations.push({id:uid(), originalJapanese:jp, userEnglish:m.querySelector('#tnEn').value,
      backTranslation:'', originalSource:m.querySelector('#tnSrc').value.trim(),
      step1Date:today(), step2Date:null, divergences:[], status:'awaiting_back_translation',
      createdAt:new Date().toISOString()});
    jaCredit(20);
    saveNow(); m.remove(); sound('success');
    toast('Resting. It will be ready tomorrow — that is the point of it.');
    rerender();
  };
  return m;
}

function openJaWriting(id){
  const j = jaState();
  const w = id ? byId(j.writing, id) : {id:uid(), date:today(), topic:'', plan:'', japaneseText:'',
    correctedText:null, selfAssessment:{complexity:3, accuracy:3, fluency:3}, wordCount:0,
    errorsFound:null, linkedGrammarPoints:[], createdAt:new Date().toISOString()};
  const m = openModal(`<h2>${id ? 'The piece' : 'Something to write'}</h2>
    <label class="pd-q"><span class="k">about what</span>
      <input class="inp" id="wrTopic" value="${esc(w.topic)}" autofocus placeholder="my weekend · why I moved here"></label>
    <!-- English, deliberately. Thinking and encoding at the same time is what
         makes the sentences short and the ideas smaller than they are. -->
    <label class="pd-q" style="margin-top:10px"><span class="k">plan it — in English</span>
      <textarea class="inp" rows="3" id="wrPlan" placeholder="what you want to say, and which structures you mean to use">${esc(w.plan)}</textarea></label>
    <label class="pd-q" style="margin-top:10px"><span class="k">now write it</span>
      <textarea class="inp ja-jp-input" rows="7" id="wrJa">${esc(w.japaneseText)}</textarea></label>
    <div style="margin-top:12px"><span class="k mono">mark yourself, one to five</span>
      <div class="ja-ipom-set">${[['complexity','Complexity','Did I use a subordinate clause? Anything from the rung I am reaching for?'],
        ['accuracy','Accuracy','Can I find my own particle and conjugation errors?'],
        ['fluency','Fluency','Does it flow, or is it a row of short disconnected sentences?']].map(([k, n, q]) => `
        <label class="ja-ipom-row"><span><b>${esc(n)}</b><em>${esc(q)}</em></span>
          <input type="range" min="1" max="5" value="${+w.selfAssessment[k] || 3}" id="wr_${k}"></label>`).join('')}</div>
      <p class="muted ja-note">They trade against each other. Push the complexity and the accuracy dips — that is stretching, not sliding.</p></div>
    <label class="pd-q" style="margin-top:10px"><span class="k">corrected version, once you have one</span>
      <textarea class="inp ja-jp-input" rows="5" id="wrFix" placeholder="paste the rewrite here and the two sit side by side">${esc(w.correctedText || '')}</textarea></label>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="wrSave">Save</button></div>`, 'narrow ja-modal');
  m.querySelector('#wrSave').onclick = () => {
    const text = m.querySelector('#wrJa').value;
    Object.assign(w, {topic:m.querySelector('#wrTopic').value.trim(), plan:m.querySelector('#wrPlan').value,
      japaneseText:text, correctedText:m.querySelector('#wrFix').value.trim() || null,
      wordCount:[...text.replace(/\s+/g, '')].length,
      selfAssessment:{complexity:+m.querySelector('#wr_complexity').value,
        accuracy:+m.querySelector('#wr_accuracy').value, fluency:+m.querySelector('#wr_fluency').value}});
    if(!id){ j.writing.push(w); jaCredit(30); }
    saveNow(); m.remove(); sound('success'); rerender();
  };
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
  const chunks = jaIn(j.chunks.map(c => ({date:(c.createdAt || '').slice(0, 10)})), from, to).length;
  if(chunks) out.push(`${chunks} new ${chunks === 1 ? 'chunk' : 'chunks'}.`);
  const top = jaTopPatterns(from, to, 3);
  if(top.length) out.push(`Errors: ${top.map(([k, n]) => `${k} (${n})`).join(', ')}.`);
  const w = jaAiWarning();
  if(w) out.push(`${Math.round(w.aiShare * 100)}% of your partnered practice was with a machine. Book a person.`);
  const st = jaStrandTrouble(jaStrandsLatest());
  if(st.length) out.push(st[0]);
  return out;
}
