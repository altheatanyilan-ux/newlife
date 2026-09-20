/* ============================================================
   GRAMMAR, IN THREE DRILLS.

   The reason grammar study so often produces nothing you can say is that it
   stops after the first drill. You read the rule, you do the exercises, you
   can conjugate it on paper, and then in conversation it is not there —
   because knowing the rule and having the rule available under time pressure
   are different things that are acquired separately.

   So: three drills, and the third one is the point.

   A IS THE RULE CHART, and it is yours. Not a textbook page — your own
   formation notes, your own examples, and the paragraph about what confuses
   you, which is the part you will actually come back and read.

   B IS MECHANICAL, and fast. Prompt, answer, next: the point is to make the
   transformation automatic, not to think about it. The exercises are ones you
   wrote, because writing them is itself the study, and because nobody else's
   drill set is about your life.

   C IS THE BRIDGE, and it is the one everything else exists for. Use the
   pattern to say something true about yourself. That answer is not a
   throwaway: it goes to the island portfolio, or straight into a 4/3/2
   sitting, which is what stops grammar practice dead-ending in a notebook.
   ============================================================ */

function jaGrammarHTML(){
  const j = jaState2();
  const list = j.grammar.slice().sort((a, b) =>
    JA_GRAMMAR_STATUS.findIndex(v => v[0] === a.status) - JA_GRAMMAR_STATUS.findIndex(v => v[0] === b.status));
  return `<div class="ja-sec">
    <div class="row between" style="align-items:baseline">
      <span class="sc" style="margin:0">Grammar</span>
      <button class="btn sm primary" id="jaGramNew">＋ a point</button></div>
    <p class="muted ja-note">Read it, drill it until the transformation is mechanical, then use it to say something true about your own life. The third step is the one that turns a rule into speech, and it is the one every grammar book leaves out.</p>
    ${list.length ? `<div class="ja-grams">${list.map(g => {
      const errs = j.errors.filter(e => e.grammarPointId === g.id).length;
      return `<div class="ja-gram ja-gs-${esc(g.status)}" data-jagrampoint="${esc(g.id)}">
        <div class="row between" style="align-items:baseline">
          <span class="serif">${esc(g.name)}</span>
          <span class="mono faint">${g.jlpt ? `${esc(g.jlpt)} · ` : ''}${
            esc((JA_GRAMMAR_STATUS.find(v => v[0] === g.status) || [,''])[1])}</span></div>
        <div class="mono faint sm">${(g.drills || []).length} drill${(g.drills || []).length === 1 ? '' : 's'}${
          g.score ? ` · last run ${g.score.right}/${g.score.total}` : ''}${
          errs ? ` · ${errs} in the notebook` : ''}</div>
        <div class="ja-tools">
          <button class="tbtn" data-jagramopen="${esc(g.id)}">the chart</button>
          <button class="tbtn" data-jagramdrill="${esc(g.id)}" ${(g.drills || []).length ? '' : 'disabled'}>drill it</button>
          <button class="tbtn" data-jagramapply="${esc(g.id)}">use it</button>
          <button class="tbtn" data-jagramdeck="${esc(g.id)}" ${(g.drills || []).length ? '' : 'disabled'}>to the deck</button>
          <button class="del-x inline" data-jagramdel="${esc(g.id)}">×</button></div>
      </div>`; }).join('')}</div>`
      : '<div class="empty">Nothing here yet. Add the point you keep getting wrong — the notebook will tell you which one that is.</div>'}
  </div>`;
}

/* ---------- drill A: the chart ---------- */
function openJaGrammar(id){
  const j = jaState2();
  const g = id ? byId(j.grammar, id) : jaGrammarDefaults({});
  const fresh = !id;
  const m = openModal(`<h2>📐 ${esc(g.name === 'A point' ? 'A grammar point' : g.name)}</h2>
    <div class="row" style="gap:10px">
      <label class="pd-q" style="flex:2"><span class="k">what it is</span>
        <input class="inp" id="gpName" autofocus value="${esc(g.name === 'A point' ? '' : g.name)}" placeholder="たら conditional"></label>
      <label class="pd-q" style="flex:1"><span class="k">level</span>
        <select class="sel" id="gpJlpt"><option value="">—</option>${['N5','N4','N3','N2','N1'].map(v =>
          `<option value="${v}" ${g.jlpt === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="pd-q" style="flex:1"><span class="k">where it stands</span>
        <select class="sel" id="gpStatus">${JA_GRAMMAR_STATUS.map(([v, n, hint]) =>
          `<option value="${v}" ${g.status === v ? 'selected' : ''}>${esc(n)} — ${esc(hint)}</option>`).join('')}</select></label>
    </div>
    <label class="pd-q" style="margin-top:10px"><span class="k">how it is formed</span>
      <textarea class="inp" rows="3" id="gpForm" placeholder="past tense + ら\n食べる → 食べたら">${esc(g.formation)}</textarea></label>
    <label class="pd-q" style="margin-top:8px"><span class="k">what it is for</span>
      <textarea class="inp" rows="3" id="gpUse" placeholder="conditional, and the temporal discovery use">${esc(g.usage)}</textarea></label>
    <!-- the part you will actually come back and read -->
    <label class="pd-q" style="margin-top:8px"><span class="k">what confuses you about it</span>
      <textarea class="inp" rows="3" id="gpNotes" placeholder="たら is concrete, ば is hypothetical. たら works for past discovery; ば does not.">${esc(g.myNotes)}</textarea></label>
    <div class="pd-q" style="margin-top:10px"><span class="k">the drills — write them yourself; writing them is the study</span>
      <div class="ja-drills" id="gpDrills">${jaDrillListHTML(g)}</div>
      <button class="tbtn" id="gpDrillAdd">＋ a drill</button></div>
    <div class="row" style="justify-content:flex-end;margin-top:14px;gap:8px">
      ${fresh ? '' : `<button class="btn sm ghost" id="gpApply">Use it about your own life</button><span class="grow"></span>`}
      <button class="btn primary" id="gpSave">Save</button></div>`, 'wide sc-modal');
  const rebuild = () => { m.querySelector('#gpDrills').innerHTML = jaDrillListHTML(g); bindDrills(); };
  const bindDrills = () => {
    $$('[data-jadrillf]', m).forEach(b => b.oninput = b.onchange = () => {
      const d = byId(g.drills, b.dataset.jadrillid); if(d) d[b.dataset.jadrillf] = b.value; });
    $$('[data-jadrilldel]', m).forEach(b => b.onclick = () => {
      spliceOut(g.drills, d => d.id === b.dataset.jadrilldel); rebuild(); });
  };
  bindDrills();
  m.querySelector('#gpDrillAdd').onclick = () => {
    g.drills.push({id:uid(), type:'conjugation', prompt:'', answer:'', hint:'', order:g.drills.length});
    rebuild();
    const last = [...m.querySelectorAll('[data-jadrillf="prompt"]')].pop();
    if(last) last.focus();
  };
  const apply = m.querySelector('#gpApply');
  if(apply) apply.onclick = () => { m.remove(); openJaGrammarApply(g.id); };
  m.querySelector('#gpSave').onclick = () => {
    Object.assign(g, {name: m.querySelector('#gpName').value.trim() || 'A point',
      jlpt: m.querySelector('#gpJlpt').value || null,
      status: m.querySelector('#gpStatus').value,
      formation: m.querySelector('#gpForm').value,
      usage: m.querySelector('#gpUse').value,
      myNotes: m.querySelector('#gpNotes').value});
    g.drills = g.drills.filter(d => d.prompt.trim() && d.answer.trim());
    if(fresh) j.grammar.push(jaGrammarDefaults(g));
    saveNow(); m.remove(); sound('success'); rerender();
  };
  return m;
}
function jaDrillListHTML(g){
  if(!(g.drills || []).length) return '<span class="faint sm">None yet. A prompt and an answer is a drill.</span>';
  return g.drills.map(d => `<div class="ja-drillrow">
    <select class="sel sm" data-jadrillid="${esc(d.id)}" data-jadrillf="type">${JA_DRILL_TYPES.map(([v, n]) =>
      `<option value="${v}" ${d.type === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
    <input class="inp sm ja-jp" data-jadrillid="${esc(d.id)}" data-jadrillf="prompt"
      value="${esc(d.prompt)}" placeholder="日本に【行く】">
    <span class="faint">→</span>
    <input class="inp sm ja-jp" data-jadrillid="${esc(d.id)}" data-jadrillf="answer"
      value="${esc(d.answer)}" placeholder="行ったら">
    <button class="del-x inline" data-jadrilldel="${esc(d.id)}">×</button>
  </div>`).join('');
}

/* ---------- drill B: the run ----------
   Fast and minimal on purpose. The answer is checked for what it is, which is
   a string: nothing here is trying to understand Japanese, it is comparing
   what you typed with what you said the answer was. Whitespace and the
   Japanese full stop are forgiven, because typing them is not the skill. */
let _jaDrill = null;
const jaDrillTidy = s => String(s || '').trim().replace(/[\s　]+/g, '').replace(/[。.]+$/, '');
function openJaGrammarDrill(id){
  const g = byId(jaState2().grammar, id);
  if(!g || !(g.drills || []).length){ toast('No drills written for that one yet.'); return null; }
  _jaDrill = {pointId:id, at:0, right:0, wrong:0, shown:false, started:Date.now(),
    order: g.drills.slice().sort((a, b) => (a.order || 0) - (b.order || 0))};
  const m = openModal('<div id="jaDrillBox"></div>', 'narrow sc-modal');
  const paint = () => {
    const box = m.querySelector('#jaDrillBox');
    const d = _jaDrill;
    if(d.at >= d.order.length){
      g.score = {right:d.right, total:d.order.length};
      g.lastDrilled = today();
      /* the drill decides where the point stands, rather than a field you
         have to remember to update: all right is solid, most is shaky */
      const pct = d.order.length ? d.right / d.order.length : 0;
      if(g.status === 'not_started' || g.status === 'studying')
        g.status = pct === 1 ? 'solid' : pct >= 0.6 ? 'shaky' : 'studying';
      saveNow();
      box.innerHTML = `<h2>${d.right} of ${d.order.length}</h2>
        <p class="muted">${pct === 1 ? 'Clean. Now go and say something with it.'
          : pct >= 0.6 ? 'Nearly. The ones you missed are the ones worth a card.'
          : 'Back to the chart, then run it again.'}</p>
        <div class="row" style="justify-content:flex-end;margin-top:14px;gap:8px">
          <button class="btn sm ghost" id="jdApply">Use it about your own life</button>
          <button class="btn primary" id="jdDone">Done</button></div>`;
      box.querySelector('#jdDone').onclick = () => { m.remove(); _jaDrill = null; rerender(); };
      box.querySelector('#jdApply').onclick = () => { m.remove(); _jaDrill = null; openJaGrammarApply(id); };
      return;
    }
    const q = d.order[d.at];
    box.innerHTML = `<div class="ja-drill">
      <div class="mono faint">${esc(g.name)} · ${d.at + 1} of ${d.order.length}</div>
      <div class="ja-drill-p serif ja-jp">${esc(q.prompt)}</div>
      <input class="inp ja-jp" id="jdAns" autofocus autocomplete="off" placeholder="…">
      <div class="ja-drill-s" id="jdSay"></div>
      <div class="row" style="gap:8px;margin-top:10px">
        <button class="btn primary" id="jdCheck">Check</button>
        <button class="tbtn" id="jdShow">show me</button>
        <button class="tbtn" id="jdSkip">skip</button>
        <span class="grow"></span>
        <span class="mono faint">${d.right} right</span></div>
      <div class="ja-drill-bar"><i style="width:${Math.round(100 * d.at / d.order.length)}%"></i></div>
    </div>`;
    const ans = box.querySelector('#jdAns');
    const next = () => { d.at++; d.shown = false; paint(); };
    const check = () => {
      const got = jaDrillTidy(ans.value);
      if(!got) return;
      const want = jaDrillTidy(q.answer);
      const right = got === want;
      if(right && !d.shown) d.right++;
      if(!right) d.wrong++;
      box.querySelector('#jdSay').innerHTML = right
        ? `<span class="ja-right">✓ ${esc(q.answer)}</span>`
        : `<span class="ja-wrong">✕ ${esc(q.answer)}</span>`;
      setTimeout(next, right ? 420 : 1100);
    };
    box.querySelector('#jdCheck').onclick = check;
    ans.onkeydown = ev => { if(ev.key === 'Enter'){ ev.preventDefault(); check(); } };
    box.querySelector('#jdShow').onclick = () => { d.shown = true;
      box.querySelector('#jdSay').innerHTML = `<span class="ja-wrong">${esc(q.answer)}</span>`; };
    box.querySelector('#jdSkip').onclick = next;
  };
  paint();
  return m;
}

/* ---------- drill C: about your own life ----------
   The bridge, and the reason the other two exist. An answer here is not a
   throwaway: it becomes an island, or a 4/3/2 topic, which is what stops
   grammar practice dead-ending in a notebook. */
function openJaGrammarApply(id){
  const j = jaState2();
  const g = byId(j.grammar, id);
  if(!g) return null;
  const m = openModal(`<h2>📐 ${esc(g.name)} — about your own life</h2>
    ${g.myNotes ? `<div class="ja-frozen sm">${esc(g.myNotes)}</div>` : ''}
    <label class="pd-q" style="margin-top:10px"><span class="k">a prompt — something you would actually be asked</span>
      <input class="inp" id="gaPrompt" autofocus placeholder="What would you do if you moved to Tokyo?"></label>
    <label class="pd-q" style="margin-top:10px"><span class="k">your answer, using it at least twice</span>
      <textarea class="inp ja-jp" rows="5" id="gaBody" placeholder="東京に引っ越したら、まず日本語学校に入りたいです。"></textarea></label>
    <p class="faint sm" id="gaCount"></p>
    <div class="row" style="justify-content:flex-end;margin-top:14px;gap:8px">
      <button class="btn sm ghost" id="gaIsland">Make it an island</button>
      <button class="btn sm ghost" id="gaDrill">Take it to a 4/3/2</button>
      <span class="grow"></span>
      <button class="btn primary" id="gaSave">Keep it</button></div>`, 'wide sc-modal');
  const body = m.querySelector('#gaBody');
  const keep = () => {
    const q = {id:uid(), prompt: m.querySelector('#gaPrompt').value.trim(),
      response: body.value, date: today()};
    if(!q.prompt && !q.response) return null;
    g.prompts.push(q);
    g.lastDrilled = today();
    saveNow();
    return q;
  };
  m.querySelector('#gaSave').onclick = () => { keep(); m.remove(); sound('success'); rerender(); };
  m.querySelector('#gaIsland').onclick = () => {
    const q = keep();
    const i = jaIslandDefaults({topic: (q && q.prompt) || g.name,
      japaneseTeineigo: body.value, status:'drafting'});
    j.islands.push(i);
    saveNow(); m.remove(); sound('success');
    toast('In the island portfolio, as a draft.');
    openJaIsland(i.id);
  };
  m.querySelector('#gaDrill').onclick = () => {
    const q = keep();
    m.remove();
    openJa432Setup();
    const t = document.querySelector('#jsTopic');
    if(t) t.value = (q && q.prompt) || g.name;
  };
  return m;
}

/* The drills, as cards. A drill is already a front and a back — a prompt and
   the transformation of it — so nothing has to be invented to make one a
   card, which is the test of whether a card is worth having. Production
   cards rather than cloze: a cloze wants a hole marked in a sentence, and a
   conjugation drill is not a sentence with a hole in it, it is a thing you
   have to do to a word. */
function jaGrammarToDeck(id){
  const g = byId(jaState2().grammar, id);
  if(!g || typeof suggestStudyCard !== 'function') return 0;
  let n = 0;
  (g.drills || []).forEach(d => {
    if(!d.prompt.trim() || !d.answer.trim()) return;
    suggestStudyCard({type:'production', sourceType:'grammar', sourceId: d.id,
      front:`${g.name}\n\n${d.prompt}`, back: d.answer,
      sourceLabel:`Grammar \u2014 ${g.name}`, tags:[String(d.type).replace(/_/g, '-')]});
    n++;
  });
  if(n) saveNow();
  return n;
}
