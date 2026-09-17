/* ============================================================
   THE SPEAKING LAB — where the mouth is trained rather than the head.

   The whole room rests on one distinction: knowing more Japanese and being
   able to say the Japanese you already know are different skills, and only
   the second one is what people mean by fluent. Everything here uses
   material you already have and pushes it for speed.
   ============================================================ */

/* ---------- the 4/3/2 ----------
   Maurice's drill, Nation's evidence, de Jong and Perfetti's proof that it
   transfers. Same talk three times, four minutes then three then two. Because
   the content is fixed, nothing that improves between the first delivery and
   the third is the material — it is the machinery underneath, which is the
   thing you were trying to train. */
function ja432HTML(){
  const rows = jaSessions().slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const warn = jaAiWarning();
  return `<div class="ja-sec">
    <div class="row between" style="align-items:baseline">
      <span class="sc" style="margin:0">4 / 3 / 2</span>
      <button class="btn sm primary" id="ja432New">＋ a session</button></div>
    <p class="muted ja-note">One talk you already have, delivered three times against a shrinking clock. The content is held constant on purpose: anything that gets faster between the first delivery and the third is the machinery, not the material — which is why the gains carry over to topics you have never rehearsed.</p>
    ${warn ? `<div class="ja-warn">Your practice is heavily AI-weighted — ${Math.round(warn.aiShare * 100)}% of the last ${warn.weeks} weeks. Book a human session this week. Aizuchi timing, keigo shifts and indirectness are not things a machine can teach you, and talking to one long enough teaches you a register that only machines like.</div>` : ''}
    ${rows.length ? `<div class="stack" style="gap:8px;margin-top:10px">${rows.slice(0, 12).map(s => {
      const g = jaSessionGain(s);
      const pause = JA_PAUSE.find(p => p[0] === s.pauseLocation);
      return `<div class="ja-session" data-jasess="${esc(s.id)}">
        <div class="row between" style="align-items:baseline">
          <span class="serif ja-topic">${esc(s.topic || 'untitled')}</span>
          <span class="mono faint">${esc(fmtDate(s.date, 'med'))} · ${esc(s.sessionType === 'play' ? 'play' : 'practice')} · ${esc(s.partnerType || 'solo')}</span></div>
        <div class="ja-takes">${(s.deliveries || []).map((d, i) => `
          <div class="ja-take">
            <span class="ja-take-n mono">${d.duration || [4,3,2][i]} min</span>
            <span class="ja-take-w">${d.wpm ? `${d.wpm} <em>wpm</em>` : '—'}</span>
            <span class="ja-take-p mono">${d.pauseCount != null ? `${d.pauseCount} pauses` : ''}</span>
            <span class="ja-take-q ja-q-${esc(d.quality || 'okay')}">${esc(d.quality || '')}</span>
          </div>`).join('')}</div>
        ${g ? `<div class="ja-gain mono">${g.first} → ${g.last} wpm${g.pct > 0 ? ` · ${g.pct}% faster by the third` : ''}</div>` : ''}
        ${pause ? `<div class="ja-pause ja-p-${esc(s.pauseLocation)}" title="${esc(pause[2])}">${esc(pause[1])}</div>` : ''}
        ${s.notes ? `<div class="ja-snotes">${linkify(s.notes)}</div>` : ''}
        <div class="ja-tools">
          <button class="tbtn" data-jaerr="${esc(s.id)}">log an error from this</button>
          <button class="del-x inline" data-jasessdel="${esc(s.id)}">×</button></div>
      </div>`; }).join('')}</div>`
      : '<div class="empty">No sessions yet. Pick a topic you could already talk about for four minutes — that is the whole entry requirement.</div>'}
  </div>`;
}
function openJa432(){
  const j = jaState();
  const m = openModal(`<h2>A 4 / 3 / 2 session</h2>
    <div class="grid c2" style="gap:10px">
      <label class="pd-q"><span class="k">date</span><input type="date" class="inp" id="jsDate" value="${today()}"></label>
      <label class="pd-q"><span class="k">topic</span><input class="inp" id="jsTopic" autofocus placeholder="something you could already talk about"></label>
    </div>
    ${j.islands.length ? `<label class="pd-q" style="margin-top:10px"><span class="k">an island, if it was one</span>
      <select class="sel" id="jsIsland"><option value="">— not one of them —</option>
      ${j.islands.map(i => `<option value="${esc(i.id)}">${esc(i.topic)}</option>`).join('')}</select></label>` : ''}
    <div class="grid c2" style="gap:10px;margin-top:10px">
      <div><span class="k mono">what kind of sitting</span>
        <div class="pn-modepick"><button class="pn-mp on" data-jstype="practice">Practice <em>analytical, slow, repetitive</em></button>
          <button class="pn-mp" data-jstype="play">Play <em>fearless, unedited</em></button></div></div>
      <div><span class="k mono">who with</span>
        <div class="pn-keypick">${JA_PARTNERS.map(([v, n, hint], i) =>
          `<button class="pn-kp${i === 0 ? ' on' : ''}" data-jspartner="${v}" title="${esc(hint)}">${esc(n)}</button>`).join('')}</div></div>
    </div>
    <table class="ja-grid"><thead><tr><th></th><th>4 min</th><th>3 min</th><th>2 min</th></tr></thead>
      <tbody>
        <tr><th>words a minute</th>${[0,1,2].map(i => `<td><input class="inp mono" type="number" id="jsW${i}" placeholder="—"></td>`).join('')}</tr>
        <tr><th>pauses</th>${[0,1,2].map(i => `<td><input class="inp mono" type="number" id="jsP${i}" placeholder="—"></td>`).join('')}</tr>
        <tr><th>how it felt</th>${[0,1,2].map(i => `<td><select class="sel" id="jsQ${i}">${JA_QUALITY.map(([v, n]) =>
          `<option value="${v}" ${v === 'okay' ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></td>`).join('')}</tr>
      </tbody></table>
    <!-- The one diagnostic worth the trouble of noticing. Where the silences
         fall says whether the grammar is being assembled as you speak. -->
    <div style="margin-top:12px"><span class="k mono">where the pauses fell</span>
      <div class="ja-pauses">${JA_PAUSE.map(([v, n, hint], i) =>
        `<button class="ja-pbtn${i === 1 ? ' on' : ''}" data-jspause="${v}" title="${esc(hint)}">
          <b>${esc(n)}</b><em>${esc(hint)}</em></button>`).join('')}</div></div>
    <label class="pd-q" style="margin-top:12px"><span class="k">notes</span>
      <textarea class="inp" rows="2" id="jsNotes" placeholder="what fell apart, what surprised you"></textarea></label>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="jsSave">Save</button></div>`, 'narrow ja-modal');
  let type = 'practice', partner = 'solo', pause = 'mixed';
  const group = (attr, set) => m.querySelectorAll(`[data-${attr}]`).forEach(b => b.onclick = () => {
    set(b.dataset[attr]); m.querySelectorAll(`[data-${attr}]`).forEach(x => x.classList.toggle('on', x === b)); });
  group('jstype', v => type = v); group('jspartner', v => partner = v); group('jspause', v => pause = v);
  m.querySelector('#jsSave').onclick = () => {
    const topic = m.querySelector('#jsTopic').value.trim();
    if(!topic){ m.querySelector('#jsTopic').focus(); return; }
    j.sessions.push({id:uid(), date:m.querySelector('#jsDate').value || today(), topic,
      linkedIslandId: m.querySelector('#jsIsland')?.value || null,
      sessionType:type, partnerType:partner, pauseLocation:pause,
      deliveries:[4,3,2].map((d, i) => ({duration:d,
        wpm: +m.querySelector('#jsW' + i).value || null,
        pauseCount: m.querySelector('#jsP' + i).value === '' ? null : +m.querySelector('#jsP' + i).value,
        quality: m.querySelector('#jsQ' + i).value})),
      notes: m.querySelector('#jsNotes').value, errorsLogged:0, createdAt:new Date().toISOString()});
    jaCredit(9);
    saveNow(); m.remove(); sound('success'); rerender();
  };
  return m;
}

/* ---------- islands ----------
   Shekhtman's central idea, and the most practical thing in the whole
   specification: a monologue you have by heart is somewhere to stand. While
   your mouth is delivering it your head is free to plan what comes after —
   which is exactly the working memory a learner never has. */
function jaIslandsHTML(){
  const list = jaIslands();
  const auto = jaAutomatic();
  return `<div class="ja-sec">
    <div class="row between" style="align-items:baseline">
      <span class="sc" style="margin:0">Islands</span>
      <span class="row" style="gap:8px"><span class="mono faint">${auto} of ${list.length} automatic${list.length < 15 ? ` · ${15 - list.length} short of fifteen` : ''}</span>
      <button class="btn sm primary" id="jaIslandNew">＋ an island</button></span></div>
    <p class="muted ja-note">Pre-built monologues on the things you are asked about anyway: your job, your family, why you are learning this. Somewhere to stand while you think. Build fifteen to thirty — and write each one in English first, because a sentence you translated is a sentence about your life, and a sentence from a phrasebook is not.</p>
    ${list.length ? `<div class="ja-islands">${list.map(i => {
      const st = JA_ISLAND_STATUS.find(x => x[0] === i.status) || JA_ISLAND_STATUS[0];
      return `<div class="ja-island ja-is-${esc(i.status)}" data-jaisland="${esc(i.id)}">
        <div class="row between" style="align-items:baseline">
          <span class="serif ja-island-t">🏝 ${esc(i.topic)}</span>
          <span class="ja-badge">${esc(st[1])}</span></div>
        ${i.japaneseText ? `<p class="ja-jp">${esc(i.japaneseText.slice(0, 160))}${i.japaneseText.length > 160 ? '…' : ''}</p>`
          : `<p class="ja-en faint">${esc((i.englishDraft || '').slice(0, 160)) || 'nothing written yet'}</p>`}
        <div class="ja-island-m mono">
          ${i.pitchMarked ? '✅ pitch-marked' : '○ not pitch-marked'} ·
          ${i.nativeVerified ? '✅ native-verified' : '○ AI only'}
          ${i.lastPracticed ? ` · ${esc(fmtDate(i.lastPracticed, 'short'))}` : ''}
          ${(i.linkedChunks || []).length ? ` · ${i.linkedChunks.length} chunks` : ''}</div>
        <div class="ja-tools">
          <button class="tbtn" data-jaislandedit="${esc(i.id)}">open</button>
          <button class="tbtn" data-jaislandpx="${esc(i.id)}">practised</button>
          ${i.japaneseText ? `<button class="tbtn" data-jaislandcard="${esc(i.id)}">make a card</button>` : ''}
          <button class="del-x inline" data-jaislanddel="${esc(i.id)}">×</button></div>
      </div>`; }).join('')}</div>`
      : '<div class="empty">No islands yet. The first one is your self-introduction, and you will use it more than anything else you ever learn.</div>'}
    <details class="ja-tools-ref"><summary><span class="sc">The seven tools</span></summary>
      <div class="body"><p class="muted ja-note">Shekhtman's, and none of them are grammar — they are what to do when the grammar runs out halfway through a sentence.</p>
      <ol class="ja-toollist">${JA_TOOLS.map(([n, w]) => `<li><b>${esc(n)}</b> ${esc(w)}</li>`).join('')}</ol></div></details>
  </div>`;
}
function openJaIsland(id){
  const j = jaState();
  const i = id ? byId(j.islands, id) : {id:uid(), topic:'', japaneseText:'', englishDraft:'',
    status:'drafting', lastPracticed:null, pitchMarked:false, linkedChunks:[], nativeVerified:false,
    version:1, createdAt:new Date().toISOString()};
  const m = openModal(`<h2>${id ? 'The island' : 'A new island'}</h2>
    <label class="pd-q"><span class="k">what it is about</span>
      <input class="inp serif-lg" id="isTopic" value="${esc(i.topic)}" autofocus placeholder="My job · Why I'm learning Japanese · My hometown"></label>
    <!-- English first, on purpose. A sentence you translated is a sentence
         about your actual life; one taken from a phrasebook is about nobody's. -->
    <label class="pd-q" style="margin-top:10px"><span class="k">first, in English</span>
      <textarea class="inp" rows="4" id="isEn" placeholder="Specific and true. Not what a textbook would have you say.">${esc(i.englishDraft)}</textarea></label>
    <label class="pd-q" style="margin-top:10px"><span class="k">then, in Japanese</span>
      <textarea class="inp ja-jp-input" rows="5" id="isJa" placeholder="私はソフトウェアエンジニアとして…">${esc(i.japaneseText)}</textarea></label>
    <div class="grid c2" style="gap:10px;margin-top:10px">
      <label class="pd-q"><span class="k">how far along</span><select class="sel" id="isStatus">${JA_ISLAND_STATUS.map(([v, n, h]) =>
        `<option value="${v}" ${i.status === v ? 'selected' : ''} title="${esc(h)}">${esc(n)}</option>`).join('')}</select></label>
      <div class="pd-q"><span class="k">checked</span>
        <label class="ja-check"><input type="checkbox" id="isPitch" ${i.pitchMarked ? 'checked' : ''}> pitch-marked</label>
        <label class="ja-check"><input type="checkbox" id="isNative" ${i.nativeVerified ? 'checked' : ''}> a human has read it</label></div>
    </div>
    <p class="muted ja-note">A machine cannot hear pitch accent and will invent idioms with great confidence. Use it for volume and a person for the verdict.</p>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="isSave">Save</button></div>`, 'narrow ja-modal');
  m.querySelector('#isSave').onclick = () => {
    const topic = m.querySelector('#isTopic').value.trim();
    if(!topic){ m.querySelector('#isTopic').focus(); return; }
    Object.assign(i, {topic, englishDraft:m.querySelector('#isEn').value,
      japaneseText:m.querySelector('#isJa').value, status:m.querySelector('#isStatus').value,
      pitchMarked:m.querySelector('#isPitch').checked, nativeVerified:m.querySelector('#isNative').checked});
    if(!id) j.islands.push(i); else i.version = (+i.version || 1) + 1;
    saveNow(); m.remove(); sound('success'); rerender();
  };
  return m;
}

/* ---------- scenarios ---------- */
function jaScenariosHTML(){
  const list = jaState().scenarios.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const done = list.filter(s => s.times > 0).length;
  return `<div class="ja-sec">
    <div class="row between" style="align-items:baseline">
      <span class="sc" style="margin:0">Scenarios</span>
      <span class="row" style="gap:8px"><span class="mono faint">${done} of ${list.length} run at least once</span>
      <button class="btn sm primary" id="jaScenNew">＋ a scenario</button></span></div>
    <p class="muted ja-note">Ordered by how often they actually happen, which is the only sensible order. Script both sides, get it corrected, drill your half, then run it with somebody swapping the variables on you.</p>
    <div class="ja-scen">${list.map(s => `<div class="ja-scenario ja-sc-${esc(s.category)}" data-jascen="${esc(s.id)}">
      <div class="row between" style="align-items:baseline">
        <span class="serif">${esc(s.name)}</span>
        <span class="mono faint">${esc(s.difficulty)}${s.times ? ` · run ${s.times}×` : ''}</span></div>
      <div class="ja-scen-m mono">${s.corrected ? '✅ corrected' : '○ not corrected'}${
        s.script ? ' · scripted' : ' · no script yet'}${(s.errorIds || []).length ? ` · ${s.errorIds.length} errors caught` : ''}</div>
      <div class="ja-tools">
        <button class="tbtn" data-jascenedit="${esc(s.id)}">open</button>
        <button class="tbtn" data-jascenrun="${esc(s.id)}">ran it</button></div>
    </div>`).join('')}</div>
  </div>`;
}

/* ---------- shadowing ---------- */
function jaShadowingHTML(){
  const rows = jaState().shadowing.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return `<div class="ja-sec">
    <div class="row between" style="align-items:baseline">
      <span class="sc" style="margin:0">Shadowing</span>
      <button class="btn sm primary" id="jaShadowNew">＋ a take</button></div>
    <p class="muted ja-note">Speaking along a beat behind, matching rhythm and intonation rather than just words. The four ratings are separate because they fail separately — you can hear every syllable and still not get your mouth round it.</p>
    ${rows.length ? `<div class="stack" style="gap:8px;margin-top:10px">${rows.slice(0, 10).map(s => `
      <div class="ja-shadow">
        <div class="row between" style="align-items:baseline">
          <span class="serif">${s.materialLink ? `<a class="autolink" href="${esc(s.materialLink)}" target="_blank" rel="noopener noreferrer">${esc(s.material)}</a>` : esc(s.material)}</span>
          <span class="mono faint">${esc(fmtDate(s.date, 'short'))} · ${esc(s.speed)} · ${esc(s.mode)}${s.pitchMarked ? ' · pitch-marked' : ''}</span></div>
        <div class="ja-ipom">${JA_IPOM.map(([k, n, q]) => `
          <span class="ja-ip" title="${esc(q)}"><em>${esc(n)}</em><b>${'●'.repeat(+s.ipom?.[k] || 0)}${'○'.repeat(5 - (+s.ipom?.[k] || 0))}</b></span>`).join('')}</div>
        ${s.notes ? `<div class="ja-snotes">${linkify(s.notes)}</div>` : ''}
        <div class="ja-tools"><button class="del-x inline" data-jashadowdel="${esc(s.id)}">×</button></div>
      </div>`).join('')}</div>`
      : '<div class="empty">Nothing shadowed yet. Start with a transcript in front of you; take it away when you stop needing it.</div>'}
  </div>`;
}
function openJaShadow(){
  const j = jaState();
  const m = openModal(`<h2>A shadowing take</h2>
    <div class="grid c2" style="gap:10px">
      <label class="pd-q"><span class="k">date</span><input type="date" class="inp" id="shDate" value="${today()}"></label>
      <label class="pd-q"><span class="k">what</span><input class="inp" id="shMat" autofocus placeholder="the podcast, the drama, the news clip"></label>
    </div>
    <label class="pd-q" style="margin-top:10px"><span class="k">where it is</span>
      ${linkBoxHTML(`<input class="inp mono" id="shLink" placeholder="https://…">`, '')}</label>
    <div class="grid c2" style="gap:10px;margin-top:10px">
      <label class="pd-q"><span class="k">speed</span><select class="sel" id="shSpeed">
        ${['0.8x','1.0x','1.2x'].map(v => `<option ${v === '1.0x' ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="pd-q"><span class="k">with the words in front of you?</span><select class="sel" id="shMode">
        <option value="scripted">scripted</option><option value="blind">blind</option></select></label>
    </div>
    <div style="margin-top:12px"><span class="k mono">how it went, one to five</span>
      <div class="ja-ipom-set">${JA_IPOM.map(([k, n, q]) => `
        <label class="ja-ipom-row"><span><b>${esc(n)}</b><em>${esc(q)}</em></span>
          <input type="range" min="1" max="5" value="3" id="sh_${k}"></label>`).join('')}</div></div>
    <label class="ja-check" style="margin-top:10px"><input type="checkbox" id="shPitch"> pitch-marked first</label>
    <label class="pd-q" style="margin-top:10px"><span class="k">notes</span>
      <textarea class="inp" rows="2" id="shNotes"></textarea></label>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="shSave">Save</button></div>`, 'narrow ja-modal');
  m.querySelector('#shSave').onclick = () => {
    const material = m.querySelector('#shMat').value.trim();
    if(!material){ m.querySelector('#shMat').focus(); return; }
    const ipom = {}; JA_IPOM.forEach(([k]) => ipom[k] = +m.querySelector('#sh_' + k).value);
    j.shadowing.push({id:uid(), date:m.querySelector('#shDate').value || today(), material,
      materialLink:m.querySelector('#shLink').value.trim() || null,
      speed:m.querySelector('#shSpeed').value, mode:m.querySelector('#shMode').value,
      pitchMarked:m.querySelector('#shPitch').checked, ipom,
      notes:m.querySelector('#shNotes').value, createdAt:new Date().toISOString()});
    jaCredit(15);
    saveNow(); m.remove(); sound('success'); rerender();
  };
  return m;
}

/* ---------- the error log ----------
   The feedback loop the whole room is built around. Not a list of mistakes —
   a list of reformulations: what you meant, what you said, and what a native
   would have said instead. The third column is the one that teaches, and it
   has to be a rewrite rather than a correction, because the gap between your
   sentence and their sentence is usually bigger than one particle. */
function jaErrorsHTML(){
  const rows = jaState().errors.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const top = jaTopPatterns(addDays(today(), -30), today());
  return `<div class="ja-sec">
    <div class="row between" style="align-items:baseline">
      <span class="sc" style="margin:0">Error log</span>
      <button class="btn sm primary" id="jaErrNew">＋ an error</button></div>
    <p class="muted ja-note">What you meant, what came out, and what a native would have said. The third column is a rewrite rather than a correction — the distance between your sentence and theirs is usually more than one particle, and noticing that distance is the thing that teaches.</p>
    ${top.length ? `<div class="ja-top">
      <span class="k mono">this month, again and again</span>
      ${top.map(([k, n]) => `<span class="ja-pat">${esc(k)} <b>${n}</b></span>`).join('')}
      <span class="ja-top-say">Three of anything in a month is a week's micro-drill, not a note in a margin.</span>
    </div>` : ''}
    ${rows.length ? `<div class="ja-errs">${rows.slice(0, 20).map(e => `
      <div class="ja-err" data-jaerrrow="${esc(e.id)}">
        <div class="ja-err-m mono">${esc(fmtDate(e.date, 'short'))} · ${esc(e.errorType || '')}${
          e.patternTag ? ` · ${esc(e.patternTag)}` : ''}${e.sentToStudyDeck ? ' · carded' : ''}</div>
        <div class="ja-err-i"><span class="k mono">meant</span> ${esc(e.intendedMeaning)}</div>
        <div class="ja-err-a"><span class="k mono">said</span> <span class="ja-jp-inline">${esc(e.actualJapanese)}</span></div>
        <div class="ja-err-c"><span class="k mono">natural</span> <span class="ja-jp-inline">${esc(e.correctedNatural)}</span></div>
        <div class="ja-tools">
          ${e.sentToStudyDeck ? '' : `<button class="tbtn" data-jaerrcard="${esc(e.id)}">make a card</button>`}
          <button class="del-x inline" data-jaerrdel="${esc(e.id)}">×</button></div>
      </div>`).join('')}</div>`
      : '<div class="empty">Nothing logged. An error you did not write down is an error you will make again on Thursday.</div>'}
  </div>`;
}
function openJaError(sessionId){
  const j = jaState();
  const m = openModal(`<h2>An error, and what it should have been</h2>
    <label class="pd-q"><span class="k">what you meant to say</span>
      <input class="inp" id="erMean" autofocus placeholder="in English — the meaning, not the words"></label>
    <label class="pd-q" style="margin-top:10px"><span class="k">what actually came out</span>
      <input class="inp ja-jp-input" id="erSaid" placeholder="your Japanese, errors and all"></label>
    <label class="pd-q" style="margin-top:10px"><span class="k">what a native would say</span>
      <input class="inp ja-jp-input" id="erNat" placeholder="the whole sentence rewritten, not just the bit that was wrong"></label>
    <div class="grid c2" style="gap:10px;margin-top:10px">
      <label class="pd-q"><span class="k">what kind</span><select class="sel" id="erType">${JA_ERROR_TYPES.map(t =>
        `<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select></label>
      <label class="pd-q"><span class="k">the pattern, if it has one</span>
        <input class="inp" id="erPat" placeholder="て-form · は vs が"></label>
    </div>
    <label class="ja-check" style="margin-top:10px"><input type="checkbox" id="erCard" checked>
      send it to the Study Deck — you will be asked to produce the corrected version aloud</label>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="erSave">Save</button></div>`, 'narrow ja-modal');
  m.querySelector('#erSave').onclick = () => {
    const intendedMeaning = m.querySelector('#erMean').value.trim();
    const correctedNatural = m.querySelector('#erNat').value.trim();
    if(!intendedMeaning){ m.querySelector('#erMean').focus(); return; }
    const e = {id:uid(), date:today(), intendedMeaning,
      actualJapanese:m.querySelector('#erSaid').value.trim(), correctedNatural,
      errorType:m.querySelector('#erType').value, patternTag:m.querySelector('#erPat').value.trim(),
      sourceType: sessionId ? 'session_432' : 'other', sourceId: sessionId || null,
      sentToStudyDeck:false, createdAt:new Date().toISOString()};
    j.errors.push(e);
    if(sessionId){ const s = byId(j.sessions, sessionId); if(s) s.errorsLogged = (+s.errorsLogged || 0) + 1; }
    if(m.querySelector('#erCard').checked && correctedNatural && typeof suggestStudyCard === 'function'){
      suggestStudyCard({type:'production', sourceType:'error_log', sourceId:e.id,
        front:`Say this in Japanese:\n\n${intendedMeaning}`, back:correctedNatural,
        sourceLabel:`Speaking Lab, ${fmtDate(today(), 'med')}`,
        tags:[e.errorType.replace(/\s+/g, '-'), e.patternTag].filter(Boolean)});
      e.sentToStudyDeck = true;
    }
    saveNow(); m.remove(); sound('success'); rerender();
  };
  return m;
}

/* ---------- the four strands ---------- */
function jaStrandsHTML(){
  const a = jaStrandsLatest();
  const trouble = jaStrandTrouble(a);
  return `<div class="ja-sec">
    <div class="row between" style="align-items:baseline">
      <span class="sc" style="margin:0">The four strands</span>
      <button class="btn sm primary" id="jaStrandNew">＋ this week</button></div>
    <p class="muted ja-note">Nation's rule: no more than about a quarter of the time on the direct study of items, and no less than about a quarter on fluency. The fourth strand is the one nearly every self-teacher starves, and it is the one that makes you sound fluent.</p>
    ${a ? `<div class="ja-strands">${JA_STRANDS.map(([k, name, what]) => { const v = +a[k] || 0;
      const bad = (k === 'study' && v > 30) || (k === 'fluency' && v < 20);
      return `<div class="ja-strand${bad ? ' off' : ''}">
        <span class="ja-strand-n">${esc(name)}<em>${esc(what)}</em></span>
        <span class="bar" style="--c:${bad ? '#c98b7a' : 'var(--sage)'}"><i style="width:${clamp(v, 0, 100)}%"></i></span>
        <span class="mono">${v}%</span></div>`; }).join('')}</div>
      ${trouble.length ? `<div class="ja-warn">${trouble.map(t => esc(t)).join('<br>')}</div>`
        : '<div class="ja-ok">Balanced, near enough.</div>'}
      <div class="mono faint" style="font-size:.72rem;margin-top:6px">assessed ${esc(fmtDate(a.weekOf || a.date, 'med'))}</div>`
      : '<div class="empty">Not assessed yet. It takes a minute and it is the only way to find out you have spent a month on grammar drills.</div>'}
  </div>`;
}
function openJaStrands(){
  const j = jaState();
  const m = openModal(`<h2>Where the week went</h2>
    <p class="muted ja-note">Four numbers that add to a hundred. Guessing is fine — the point is the shape, not the accounting.</p>
    <div class="ja-strand-set">${JA_STRANDS.map(([k, name, what]) => `
      <label class="ja-strand-row"><span><b>${esc(name)}</b><em>${esc(what)}</em></span>
        <input class="inp mono" type="number" min="0" max="100" id="st_${k}" value="25"></label>`).join('')}</div>
    <div class="mono ja-total" id="stTotal">100%</div>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="stSave">Save</button></div>`, 'narrow ja-modal');
  const total = () => sum(JA_STRANDS.map(([k]) => +m.querySelector('#st_' + k).value || 0));
  const paint = () => { const t = total();
    const el = m.querySelector('#stTotal');
    el.textContent = `${t}%`; el.classList.toggle('off', t !== 100); };
  JA_STRANDS.forEach(([k]) => m.querySelector('#st_' + k).oninput = paint);
  m.querySelector('#stSave').onclick = () => {
    const rec = {id:uid(), date:today(), weekOf:today()};
    JA_STRANDS.forEach(([k]) => rec[k] = +m.querySelector('#st_' + k).value || 0);
    j.strands.push(rec); saveNow(); m.remove(); sound('success'); rerender();
  };
  return m;
}
