/* ============================================================
   THE MATERIAL, DRAWN ON THE EXERCISE IT BELONGS TO.

   Section 4 of the specification asks for ten views. They are
   here, but as blocks inside the exercise page rather than as ten
   separate rooms: a coordination exercise draws its two hands and
   its twelve keys, a transcription project draws its COREA steps
   and its two counters, the self-transcription analysis draws its
   seventeen questions and the beat chart.

   The reason they are not separate pages is that a student
   practising stage 7A should not have to know that the Red
   Garland rhythm lives in a different room from the exercise that
   asks for it. It is one page: the thing, and everything known
   about the thing.
   ============================================================ */

/* ---------- Section 3, said on the stage it describes ----------
   What unlocks here, what it assumes, what it sits beside, and why
   it arrives at this point rather than earlier. Inside the stage's
   own "why this stage" panel, because that is the question it
   answers. */
function jazzStageBandHTML(stageId){
  const b = typeof siskindBandFor === 'function' ? siskindBandFor(stageId) : null;
  if(!b) return '';
  return `<div class="jz-note jzm-band">
    <span class="sc">Where this sits — ${esc(b.name)}</span>
    <p class="mono jzm-band-books">${esc(b.books)}</p>
    <div class="jzm-band-grid">
      <div><b>Unlocks</b><ul class="jzm-list">${
        b.unlocks.map(u => `<li>${esc(u)}</li>`).join('')}</ul></div>
      <div><b>Assumes</b><p>${esc(b.prerequisites)}</p></div>
    </div>
    <p><b>Beside what is already here.</b> ${esc(b.complement)}</p>
    <p><b>Why here.</b> ${esc(b.progression)}</p>
  </div>`;
}

/* The twelve-key grid, for anything the book asks in all twelve. */
function jazzMatKeysHTML(id){
  const got = jazzCatalogKeyCount(id);
  return `<div class="jzm-keys">
    <div class="jzm-keys-head">
      <span class="sc">Keys</span>
      <span class="mono jzm-keys-n">${got} of 12</span></div>
    <div class="jzm-keygrid">${JAZZ_KEY_NAMES.map(k =>
      `<button class="jzm-key${jazzCatalogKeyDone(id, k) ? ' on' : ''}"
        data-jzmkey="${esc(k)}" data-jzmid="${esc(id)}"
        title="${jazzCatalogKeyDone(id, k) ? 'done' : 'not yet'}">${esc(jazzPretty(k))}</button>`).join('')}</div>
  </div>`;
}
const jazzMatFact = (label, value) => !value ? '' :
  `<div class="jzm-fact"><b>${esc(label)}</b><span>${esc(String(value))}</span></div>`;

/* A cross-reference becomes a link if the thing it names ended up
   on the ladder, and plain text if it did not. */
function jazzMatRefsHTML(list, label){
  if(!list || !list.length) return '';
  const bits = list.map(mid => {
    const lid = typeof siskindLadderIdFor === 'function' ? siskindLadderIdFor(mid) : null;
    const ex = lid ? jazzExercise(lid) : null;
    return ex ? `<button class="jzm-xref" data-jzmgo="${esc(lid)}">${esc(ex.name)}</button>`
      : `<span class="jzm-xref flat">${esc(mid)}</span>`;
  });
  return `<div class="jzm-block"><span class="sc">${esc(label)}</span>
    <div class="jzm-xrefs">${bits.join('')}</div></div>`;
}

/* ---------- the block itself ---------- */
function jazzMaterialHTML(id){
  const m = typeof siskindMaterial === 'function' ? siskindMaterial(id) : null;
  if(!m) return '';
  const e = m.row;
  switch(m.kind){

    /* 1. Coordination exercise view — the two hands, side by side. */
    case 'coord': return `<div class="jzm">
      <div class="jzm-hands">
        <div class="jzm-hand"><div class="jzm-hand-label">Right hand</div><p>${esc(e.rhDescription)}</p></div>
        <div class="jzm-hand"><div class="jzm-hand-label">Left hand</div><p>${esc(e.lhDescription)}</p></div>
      </div>
      <div class="jzm-facts">
        ${jazzMatFact('Comping pattern', e.compingPattern)}
        ${jazzMatFact('Scale', e.scaleType)}
        ${jazzMatFact('Minutes a day', e.minutesRecommended)}
        ${jazzMatFact('Difficulty', e.difficulty)}
      </div>
      ${(e.exerciseParts || []).length ? `<div class="jzm-block"><span class="sc">The four exercises</span>
        <ul class="jzm-list">${e.exerciseParts.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>` : ''}
      ${e.voicingStrategies ? `<div class="jzm-block"><span class="sc">Voicing strategies</span>
        <p>${esc(e.voicingStrategies)}</p></div>` : ''}
      ${jazzMatKeysHTML(e.id)}
      ${jazzMatRefsHTML(e.prerequisites, 'Do these first')}
      ${jazzMatRefsHTML(e.crossRefs, 'Goes with')}
    </div>`;

    /* 10. Swing feel module — the syllables, and what they mean. */
    case 'swing': return `<div class="jzm">
      ${(e.syllables || []).length ? `<div class="jzm-block"><span class="sc">Syllables</span>
        <div class="jzm-sylls">${e.syllables.map(s =>
          `<span class="jzm-syll${/[A-Z]{2}/.test(s) ? ' accent' : ''}">${esc(s)}</span>`).join('')}</div>
        <p class="jzm-hint">The ones in capitals are the accented ones. Say them out loud while you play.</p></div>` : ''}
      <div class="jzm-block"><span class="sc">How to practise it</span><p>${esc(e.howTo)}</p></div>
      ${(e.tunesToApply || []).length ? `<div class="jzm-block"><span class="sc">Apply it to</span>
        <p>${esc(e.tunesToApply.join(', '))}</p></div>` : ''}
    </div>`;

    /* 2. Comping pattern library — one pattern's entry. */
    case 'comping': return `<div class="jzm">
      <div class="jzm-rhythm"><span class="sc">Where it falls</span><p>${esc(e.rhythm)}</p></div>
      <div class="jzm-facts">
        ${jazzMatFact('Type', e.type)}
        ${jazzMatFact('Book', e.book)}
        ${jazzMatFact('Unit', e.unitIntroduced)}
      </div>
      ${(e.tunesToPractice || []).length ? `<div class="jzm-block"><span class="sc">Practise it on</span>
        <p>${esc(e.tunesToPractice.join(' · '))}</p></div>` : ''}
      ${jazzMatRefsHTML(e.relatedPatterns, 'Related patterns')}
    </div>`;

    /* 3. Scale pattern practice — tempo, intervals, keys. */
    case 'scale': return `<div class="jzm">
      <div class="jzm-block"><span class="sc">The pattern</span><p>${esc(e.intervals)}</p></div>
      <div class="jzm-facts">
        ${jazzMatFact('Type', e.patternType)}
        ${jazzMatFact('Tempo', `${e.tempoRange.min}–${e.tempoRange.max} bpm`)}
        ${jazzMatFact('Minutes a day', e.minutesRecommended)}
        ${jazzMatFact('Difficulty', e.difficulty)}
      </div>
      ${(e.relatedScales || []).length ? `<div class="jzm-block"><span class="sc">Scales used</span>
        <p>${esc(e.relatedScales.join(', '))}</p></div>` : ''}
      <div class="jzm-block"><span class="sc">Keys</span><p>${esc((e.keysToPractice || []).join(', '))}</p></div>
      ${jazzMatKeysHTML(e.id)}
      ${jazzMatRefsHTML(e.crossRefs, 'Goes with')}
    </div>`;

    case 'melody': return `<div class="jzm">
      <div class="jzm-block"><span class="sc">How to perform it</span><p>${esc(e.howToPerform)}</p></div>
      ${(e.tunesToApply || []).length ? `<div class="jzm-block"><span class="sc">Apply it to</span>
        <p>${esc(e.tunesToApply.join(' · '))}</p></div>` : ''}
    </div>`;

    /* 9. Written practice worksheets. */
    case 'written': return `<div class="jzm">
      <div class="jzm-block"><span class="sc">Instructions</span><p>${esc(e.instructions)}</p></div>
      <div class="jzm-facts">
        ${jazzMatFact('Worksheet type', e.type)}
        ${jazzMatFact('Answer key', e.answersAvailable ? 'yes' : 'none')}
      </div>
      <div class="jzm-block"><span class="sc">Keys required</span>
        <p>${esc((e.keysRequired || []).join(', '))}</p></div>
      ${jazzMatKeysHTML(e.id)}
      ${jazzMatRefsHTML(e.crossRefs, 'Goes with')}
    </div>`;

    /* 5. Transcription project tracker — COREA, and the counters. */
    case 'transcribe': {
      const c = jazzTranscriptionCount(e.id);
      const ring = (now, of, label, which) => `<div class="jzm-counter">
        <div class="jzm-counter-ring" style="--pct:${of ? Math.min(100, Math.round(now / of * 100)) : 0}%">
          <span class="jzm-counter-num">${now}</span></div>
        <div class="jzm-counter-label">${esc(label)}${of ? ` <span class="faint">/ ${of}</span>` : ''}</div>
        <div class="jzm-counter-btns">
          <button class="tbtn" data-jzmcount="${esc(which)}" data-jzmby="-1" data-jzmid="${esc(e.id)}">−</button>
          <button class="tbtn" data-jzmcount="${esc(which)}" data-jzmby="1" data-jzmid="${esc(e.id)}">+</button>
        </div></div>`;
      return `<div class="jzm">
        <div class="jzm-facts">
          ${jazzMatFact('Artist', e.artist)}
          ${jazzMatFact('Tune', e.tuneName)}
          ${jazzMatFact('Album', e.album)}
          ${jazzMatFact('Focus', (e.focusAreas || []).join(', '))}
        </div>
        <div class="jzm-counters">
          ${ring(c.listen || 0, e.listenCount, 'listens', 'listen')}
          ${e.playAlongCount ? ring(c.playAlong || 0, e.playAlongCount, 'play-alongs', 'playAlong') : ''}
        </div>
        <div class="jzm-block"><span class="sc">The COREA process</span>
          <div class="jzm-corea">${COREA_STEPS.map(s => {
            const on = !!(c.corea || {})[s.key];
            return `<button class="jzm-corea-step${on ? ' done' : ''}"
              data-jzmcorea="${esc(s.key)}" data-jzmid="${esc(e.id)}">
              <span class="jzm-corea-check">${on ? '✓' : '○'}</span>
              <span class="jzm-corea-body">
                <span class="jzm-corea-label">${esc(s.label)}</span>
                <span class="jzm-corea-text">${esc(e.coreaSteps[s.key])}</span>
              </span></button>`; }).join('')}</div></div>
        ${(e.timestamps || []).length ? `<div class="jzm-block"><span class="sc">Moments to study</span>
          <p>${esc(e.timestamps.join(' · '))}</p></div>` : ''}
      </div>`;
    }

    /* 4. Tune application workflow — the eleven steps, per tune. */
    case 'tuneapp': {
      const tm = jazzTuneMastery();
      const tune = tm.current || '';
      const p = jazzTuneProgress(tune);
      return `<div class="jzm">
        <div class="jzm-block"><span class="sc">The tune</span>
          <input class="jzm-input" id="jzmTune" placeholder="which tune are you taking through the eleven steps?"
            value="${esc(tune)}"></div>
        ${tune ? `<div class="jzm-bar"><i style="width:${p.pct}%"></i></div>
          <div class="mono jzm-hint">${p.done} of ${p.of} steps · ${p.pct}%</div>` : ''}
        <div class="jzm-steps">${TUNE_APP_STEPS.map(s => {
          const on = tune && jazzTuneStepDone(tune, s.stepNumber);
          return `<button class="jzm-step${on ? ' done' : ''}${tune ? '' : ' off'}"
            data-jzmstep="${s.stepNumber}"${tune ? '' : ' disabled'}>
            <span class="jzm-step-check">${on ? '✓' : '○'}</span>
            <span class="mono jzm-step-n">${s.stepNumber}</span>
            <span class="jzm-step-body">
              <span class="jzm-step-name">${esc(s.name)}</span>
              <span class="jzm-step-desc">${esc(s.description)}</span>
              <span class="jzm-step-type mono">${esc(s.type)}</span>
            </span></button>`; }).join('')}</div>
        <div class="jzm-block"><span class="sc">Tunes this stage suggests</span>
          <ul class="jzm-list">${TUNE_APP_SUGGESTIONS.map(s =>
            `<li><b>Book ${s.book}, units ${esc(s.units)}</b> — ${esc(s.gist)}:
              ${esc(s.suggestedTunes.join(', '))}</li>`).join('')}</ul></div>
      </div>`;
    }

    case 'bossa': return `<div class="jzm">
      <div class="jzm-rhythm"><span class="sc">The rhythm</span><p>${esc(e.rhythm)}</p></div>
      <div class="jzm-warn">The eighth notes are syncopated but <b>not swung</b> — even throughout.</div>
      <div class="jzm-block"><span class="sc">Practise it on</span>
        <p>${esc((e.tunesToPractice || []).join(' · '))}</p></div>
    </div>`;

    /* 6. Introduction / ending builder. */
    case 'intros': return `<div class="jzm">
      <div class="jzm-facts">
        ${jazzMatFact('Type', e.type)}
        ${jazzMatFact('When to use it', e.usage)}
      </div>
      <div class="jzm-block"><span class="sc">Step by step</span>
        <ol class="jzm-list num">${(e.steps || []).map(s => `<li>${esc(s)}</li>`).join('')}</ol></div>
      ${(e.tunesToApply || []).length ? `<div class="jzm-block"><span class="sc">Apply it to</span>
        <p>${esc(e.tunesToApply.join(' · '))}</p></div>` : ''}
      ${jazzMatKeysHTML(e.id)}
    </div>`;

    /* 7. Memorization dashboard — four types, rated, and six keys. */
    case 'memory': {
      const m2 = jazzMemoryState();
      const tune = m2.current || '';
      const t = jazzMemoryTune(tune);
      const keysDone = Object.keys(t.keys || {}).length;
      return `<div class="jzm">
        <div class="jzm-block"><span class="sc">The tune</span>
          <input class="jzm-input" id="jzmMemTune" placeholder="which tune are you memorising?"
            value="${esc(tune)}"></div>
        <div class="jzm-memtypes">${MEMORY_TYPES.map(ty => {
          const r = tune ? (+t.ratings[ty.id] || 0) : 0;
          return `<div class="jzm-memtype">
            <div class="jzm-memtype-head"><b>${esc(ty.name)}</b>
              <span class="jzm-stars">${[1,2,3,4,5].map(n =>
                `<button class="jzm-star${n <= r ? ' on' : ''}" data-jzmrate="${esc(ty.id)}"
                  data-jzmn="${n}"${tune ? '' : ' disabled'} title="${n} of 5">★</button>`).join('')}</span></div>
            <p>${esc(ty.description)}</p>
            <p class="jzm-hint"><b>Method:</b> ${esc(ty.method)}</p>
            <ul class="jzm-list">${ty.exercises.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
          </div>`; }).join('')}</div>
        <div class="jzm-block"><span class="sc">Transposition</span>
          <div class="jzm-methods">${TRANSPOSITION_METHODS.map(mm =>
            `<button class="jzm-method${t.method === mm.id ? ' on' : ''}" data-jzmmethod="${esc(mm.id)}"
              ${tune ? '' : ' disabled'}>
              <b>${esc(mm.name)}</b><span>${esc(mm.description)}</span>
              <i>${esc(mm.bestFor)}</i></button>`).join('')}</div>
          <p class="jzm-hint">${esc(TRANSPOSITION_NOTE)}</p></div>
        <div class="jzm-block"><span class="sc">Keys — six is the minimum</span>
          <div class="jzm-keygrid">${JAZZ_KEY_NAMES.map(k =>
            `<button class="jzm-key${t.keys[k] ? ' on' : ''}" data-jzmmemkey="${esc(k)}"
              ${tune ? '' : ' disabled'}>${esc(jazzPretty(k))}</button>`).join('')}</div>
          <div class="mono jzm-hint">${keysDone} of 12 · ${
            keysDone >= 6 ? 'the six-key minimum is met' : `${6 - keysDone} more to reach the minimum`}</div></div>
      </div>`;
    }

    /* 8. Self-transcription analysis — seventeen questions and the
       beat distribution chart. */
    case 'selfana': {
      const st = jazzSelfAnalysisState();
      const d = st.selfAnalysisDraft;
      const q = qq => {
        const v = d.answers[qq.questionNumber];
        if(qq.answerType === 'chart'){
          return `<div class="jzm-beatgrid">${BEAT_SUBDIVISIONS.map((b, i) =>
            `<button class="jzm-beat${d.beats[i] ? ' on' : ''}" data-jzmbeat="${i}">
              <span class="jzm-beat-n">${esc(b)}</span></button>`).join('')}</div>
            <p class="jzm-hint">Mark every subdivision one of your phrases began on.</p>`;
        }
        if(qq.answerType === 'boolean') return `<div class="jzm-bool">
          <label><input type="radio" name="q${qq.questionNumber}" data-jzmq="${qq.questionNumber}"
            data-jzmv="yes"${v === 'yes' ? ' checked' : ''}> yes</label>
          <label><input type="radio" name="q${qq.questionNumber}" data-jzmq="${qq.questionNumber}"
            data-jzmv="no"${v === 'no' ? ' checked' : ''}> no</label></div>`;
        if(qq.answerType === 'count') return `<input type="number" min="0" class="jzm-num"
          data-jzmq="${qq.questionNumber}" value="${v == null ? '' : esc(String(v))}">`;
        return `<textarea class="jzm-text" data-jzmq="${qq.questionNumber}"
          rows="2">${v == null ? '' : esc(String(v))}</textarea>`;
      };
      return `<div class="jzm">
        <div class="jzm-block"><span class="sc">The tune you recorded</span>
          <input class="jzm-input" id="jzmSaTune" placeholder="which tune?" value="${esc(d.tuneName || '')}"></div>
        <div class="jzm-qs">${SELF_TRANSCRIPTION_QS.map(qq => `<div class="jzm-q">
          <div class="mono jzm-qn">Q${qq.questionNumber} · ${esc(qq.answerType)}</div>
          <div class="jzm-q-text">${esc(qq.questionText)}</div>
          <div class="jzm-q-eg">${esc(qq.example)}</div>
          ${q(qq)}</div>`).join('')}</div>
        <div class="jzm-block"><span class="sc">Overall assessment</span>
          <textarea class="jzm-text" id="jzmSaNotes" rows="3">${esc(d.notes || '')}</textarea></div>
        <div class="jzm-block"><span class="sc">Goals — one per line</span>
          <textarea class="jzm-text" id="jzmSaGoals" rows="3">${esc(d.goals || '')}</textarea></div>
        <div class="row" style="gap:8px;margin-top:10px">
          <button class="btn sm primary" id="jzmSaSave">Save this analysis</button></div>
        ${st.selfAnalyses.length ? `<div class="jzm-block"><span class="sc">Earlier analyses</span>
          ${st.selfAnalyses.slice(0, 6).map(a => `<div class="jzm-saved">
            <b>${esc(a.tuneName)}</b>
            <span class="mono faint">${esc(fmtDate(a.recordingDate, 'short'))}</span>
            ${a.improvementGoals.length ? `<ul class="jzm-list">${
              a.improvementGoals.map(g => `<li>${esc(g)}</li>`).join('')}</ul>` : ''}
          </div>`).join('')}</div>` : ''}
      </div>`;
    }
  }
  return '';
}

/* ---------- what the block does when you press it ---------- */
function bindJazzMaterial(root, id){
  const m = typeof siskindMaterial === 'function' ? siskindMaterial(id) : null;
  if(!m) return;
  const again = () => { rerender(); };

  $$('[data-jzmkey]', root).forEach(b => b.onclick = () => {
    const k = b.dataset.jzmkey, mid = b.dataset.jzmid;
    jazzCatalogSetKey(mid, k, !jazzCatalogKeyDone(mid, k)); sound('click'); again(); });

  $$('[data-jzmgo]', root).forEach(b => b.onclick = () => {
    jazzUi().exId = b.dataset.jzmgo; navigate('#/jazz/' + b.dataset.jzmgo); });

  $$('[data-jzmcount]', root).forEach(b => b.onclick = () => {
    jazzTranscriptionBump(b.dataset.jzmid, b.dataset.jzmcount, +b.dataset.jzmby);
    sound('click'); again(); });

  $$('[data-jzmcorea]', root).forEach(b => b.onclick = () => {
    const mid = b.dataset.jzmid, step = b.dataset.jzmcorea;
    const on = !!(jazzTranscriptionCount(mid).corea || {})[step];
    jazzTranscriptionCorea(mid, step, !on); sound('click'); again(); });

  const tune = root.querySelector('#jzmTune');
  if(tune) tune.onchange = () => { jazzTuneMastery().current = tune.value.trim(); saveNow(); again(); };
  $$('[data-jzmstep]', root).forEach(b => b.onclick = () => {
    const t = jazzTuneMastery().current;
    if(!t) return;
    const n = +b.dataset.jzmstep;
    jazzTuneSetStep(t, n, !jazzTuneStepDone(t, n)); sound('click'); again(); });

  const memTune = root.querySelector('#jzmMemTune');
  if(memTune) memTune.onchange = () => { jazzMemoryState().current = memTune.value.trim(); saveNow(); again(); };
  $$('[data-jzmrate]', root).forEach(b => b.onclick = () => {
    const t = jazzMemoryState().current; if(!t) return;
    jazzMemoryTune(t).ratings[b.dataset.jzmrate] = +b.dataset.jzmn; saveNow(); sound('click'); again(); });
  $$('[data-jzmmethod]', root).forEach(b => b.onclick = () => {
    const t = jazzMemoryState().current; if(!t) return;
    jazzMemoryTune(t).method = b.dataset.jzmmethod; saveNow(); again(); });
  $$('[data-jzmmemkey]', root).forEach(b => b.onclick = () => {
    const t = jazzMemoryState().current; if(!t) return;
    const ks = jazzMemoryTune(t).keys, k = b.dataset.jzmmemkey;
    if(ks[k]) delete ks[k]; else ks[k] = true;
    saveNow(); sound('click'); again(); });

  const d = jazzSelfAnalysisDraft();
  const saTune = root.querySelector('#jzmSaTune');
  if(saTune) saTune.onchange = () => { d.tuneName = saTune.value; saveNow(); };
  $$('[data-jzmbeat]', root).forEach(b => b.onclick = () => {
    const i = b.dataset.jzmbeat;
    if(d.beats[i]) delete d.beats[i]; else d.beats[i] = true;
    saveNow(); sound('click'); again(); });
  $$('[data-jzmq]', root).forEach(el => {
    const n = el.dataset.jzmq;
    if(el.type === 'radio') el.onchange = () => { d.answers[n] = el.dataset.jzmv; saveNow(); };
    else el.onchange = () => { d.answers[n] = el.value; saveNow(); };
  });
  const notes = root.querySelector('#jzmSaNotes');
  if(notes) notes.onchange = () => { d.notes = notes.value; saveNow(); };
  const goals = root.querySelector('#jzmSaGoals');
  if(goals) goals.onchange = () => { d.goals = goals.value; saveNow(); };
  const save = root.querySelector('#jzmSaSave');
  if(save) save.onclick = () => { jazzSelfAnalysisSave(); toast('Analysis saved'); again(); };
}
