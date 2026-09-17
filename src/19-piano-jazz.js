/* ============================================================
   THE JAZZ LAB — vocabulary, not pieces.

   The roadmap is drawn as a timeline you climb rather than a checklist you
   tick, because none of this finishes: a stage is "done" in the sense that
   you have stopped working on it daily, not in the sense that it is over.
   The progress bars are averages of twelve-key fluency, which means they
   move slowly and honestly — you cannot finish a stage by declaring it
   finished.
   ============================================================ */
function pianoJazzHTML(){
  const openId = S._pianoStage || null;
  const r = pianoPlayRatio();
  return `<div class="pn-jazz">
    ${pianoRatioHTML(r)}
    <div class="stack" style="gap:18px">${pianoPhases().map(ph => {
      const pct = Math.round(pianoPhaseProgress(ph) * 100);
      return `<section class="pn-phase">
        <div class="pn-ph-head">
          <span class="serif pn-ph-n">Phase ${ph.number}</span>
          <span class="serif pn-ph-name">${esc(ph.name)}</span>
          <span class="mono pn-ph-m">${esc(ph.months)}</span>
        </div>
        <div class="pn-ph-blurb">${esc(ph.blurb || '')}</div>
        <div class="pn-bar" role="img" aria-label="${pct} per cent"><i style="width:${pct}%"></i><span class="mono">${pct}%</span></div>
        <div class="stack" style="gap:6px;margin-top:10px">${(ph.stages || []).map(st => {
          const on = openId === st.id;
          const sp = Math.round(pianoStageProgress(st) * 100);
          return `<div class="pn-stage${on ? ' open' : ''}">
            <button class="pn-st-head" data-pnstage="${esc(st.id)}" aria-expanded="${on}">
              <span class="pn-st-mark ${esc(st.status)}">${st.status === 'completed' ? '✓' : st.status === 'in_progress' ? '◐' : '○'}</span>
              <span class="pn-st-n mono">${st.number}</span>
              <span class="pn-st-name">${esc(st.name)}</span>
              <span class="pn-st-w mono faint">${esc(st.weeks || '')}</span>
              <span class="pn-st-p mono">${sp}%</span>
            </button>
            ${on ? pianoStageBodyHTML(st) : ''}
          </div>`; }).join('')}</div>
      </section>`; }).join('')}</div>
  </div>`;
}
/* Werner's line, and the number it is about. It is shown on the roadmap
   rather than buried in a setting, because the whole point of the
   distinction is that it is the thing you forget. */
function pianoRatioHTML(r){
  const pct = Math.round(r.share * 100);
  const thin = r.total >= 6 && r.share < 0.25;
  return `<div class="card no-tilt pn-ratio${thin ? ' thin' : ''}">
    <div class="row between" style="align-items:baseline">
      <span class="k">Practice against play</span>
      <span class="mono">${r.practice} practised · ${r.play} played${r.total ? ` · ${pct}% play` : ''}</span></div>
    <div class="pn-ratiobar"><i class="prac" style="flex:${r.practice || 0}"></i><i class="play" style="flex:${r.play || 0}"></i></div>
    <div class="pn-ratio-say">${thin
      ? 'Werner: “Separate practice time from play time. In play time, analytical thought is strictly forbidden.” It has been nearly all practice lately.'
      : r.total ? 'Practice is analytical, slow and repetitive. Play is fearless and unedited. Both are the work.'
        : 'Log a sitting and mark it practice or play. The difference is the point.'}</div>
  </div>`;
}
function pianoStageBodyHTML(st){
  return `<div class="pn-st-body">
    <div class="pn-st-focus">${esc(st.focus || '')}</div>
    ${st.resource ? `<div class="pn-st-res mono">${esc(st.resource)}</div>` : ''}
    ${st.drill ? `<div class="pn-st-drill"><span class="k mono">the daily drill</span> ${esc(st.drill)}</div>` : ''}
    <div class="stack" style="gap:14px;margin-top:12px">${(st.concepts || []).map(pianoConceptHTML).join('')}</div>
    <div class="row" style="margin-top:12px;gap:8px">
      <select class="sel sm" data-pnststatus="${esc(st.id)}">
        ${[['not_started','not started'],['in_progress','in progress'],['completed','completed']].map(([v, n]) =>
          `<option value="${v}" ${st.status === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
      <button class="btn sm primary" data-pnstlog="${esc(st.id)}">＋ log practice</button>
    </div>
  </div>`;
}

/* ---------- a concept, tracked the way its kind needs ---------- */
function pianoConceptHTML(c){
  const t = PIANO_CONCEPT_TYPES.find(x => x[0] === c.type) || PIANO_CONCEPT_TYPES[0];
  return `<div class="pn-concept" data-pnconcept="${esc(c.id)}">
    <div class="row between" style="align-items:baseline">
      <span class="pn-c-name">${esc(c.name)}</span>
      <span class="mono faint">${esc(t[1].toLowerCase())}${c.lastPracticed ? ` · ${esc(fmtDate(c.lastPracticed, 'short'))}` : ''}</span></div>
    ${pianoIsKeyed(c) ? pianoWheelHTML(c) : pianoLedgerHTML(c)}
  </div>`;
}
/* The signature object: the circle of fifths, each segment filled by how
   fluent the key is. It fills over months, which is the point — it is meant
   to be something you want to complete, and the only way to complete it is
   to actually be able to play the thing in B. */
function pianoWheelHTML(c){
  const keys = pianoKeyMastery(c);
  const counts = pianoKeyCounts(c);
  const R = 92, r0 = 46, cx = 104, cy = 104;
  const seg = (i) => {
    const a0 = (i * 30 - 105) * Math.PI / 180, a1 = ((i + 1) * 30 - 105) * Math.PI / 180;
    const P = (a, rad) => `${(cx + Math.cos(a) * rad).toFixed(2)},${(cy + Math.sin(a) * rad).toFixed(2)}`;
    return `M${P(a0, r0)} L${P(a0, R)} A${R},${R} 0 0 1 ${P(a1, R)} L${P(a1, r0)} A${r0},${r0} 0 0 0 ${P(a0, r0)}Z`;
  };
  const mid = i => { const a = ((i + 0.5) * 30 - 105) * Math.PI / 180;
    return {x: cx + Math.cos(a) * (R + r0) / 2, y: cy + Math.sin(a) * (R + r0) / 2}; };
  return `<div class="pn-wheelwrap">
    <svg class="pn-wheel" viewBox="0 0 208 208" role="img"
      aria-label="the twelve keys, coloured by how fluent each one is">
      ${PIANO_KEYS.map((k, i) => { const f = pianoFluency(keys[k]); const m = mid(i);
        return `<g class="pn-seg" data-pnkey="${esc(k)}" tabindex="0" role="button"
          aria-label="${esc(k)} — ${esc(f[1])}">
          <path d="${seg(i)}" fill="${f[3]}" fill-opacity="${0.18 + f[2] * 0.16}" stroke="var(--line)"/>
          <text x="${m.x.toFixed(1)}" y="${(m.y + 4).toFixed(1)}" text-anchor="middle">${esc(k)}</text>
        </g>`; }).join('')}
      <circle cx="${cx}" cy="${cy}" r="${r0 - 4}" class="pn-wheelhub"/>
      <text x="${cx}" y="${cy - 2}" text-anchor="middle" class="pn-wheelbig">${counts.fluent + counts.second_nature}</text>
      <text x="${cx}" y="${cy + 14}" text-anchor="middle" class="pn-wheelsm">of 12 fluent</text>
    </svg>
    <div class="pn-wheelside">
      <div class="pn-legend">${PIANO_FLUENCY.map(f => counts[f[0]]
        ? `<span class="pn-lg"><i style="background:${f[3]}"></i>${esc(f[1])} ${counts[f[0]]}</span>` : '').join('')}</div>
      <div class="row" style="gap:6px;margin-top:8px">
        <button class="btn sm ghost" data-pnweak="${esc(c.id)}">practise the weakest</button>
        <button class="btn sm ghost" data-pnclog="${esc(c.id)}">log practice</button>
      </div>
      ${c.notes ? `<div class="pn-c-note">${esc(c.notes)}</div>` : ''}
    </div>
  </div>`;
}
/* Everything that is not twelve keys is a log: things transcribed, records
   studied, gigs played. One fluency dial and a list of what happened. */
function pianoLedgerHTML(c){
  const rows = (c.entries || []).slice().reverse();
  return `<div class="pn-ledger">
    <div class="pn-fluency" role="group" aria-label="how fluent this is">${PIANO_FLUENCY.map(f =>
      `<button class="pn-fl${c.fluency === f[0] ? ' on' : ''}" data-pnfluency="${esc(c.id)}|${f[0]}"
        style="--c:${f[3]}" title="${esc(f[1])}">${esc(f[1])}</button>`).join('')}</div>
    ${rows.length ? `<ul class="pn-entries">${rows.slice(0, 8).map((e, i) => `<li>
      <span class="mono">${esc(e.date || '')}</span> ${esc(e.text || '')}
      <button class="del-x inline" data-pnentdel="${esc(c.id)}|${esc(e.id)}">×</button></li>`).join('')}</ul>` : ''}
    <div class="row" style="gap:6px;margin-top:8px">
      <input class="inp sm" data-pnentry="${esc(c.id)}" placeholder="${esc(pianoEntryPrompt(c.type))}">
      <button class="btn sm ghost" data-pnentadd="${esc(c.id)}">add</button>
    </div>
  </div>`;
}
const pianoEntryPrompt = type => ({
  transcription: 'what you took off the record, and whose',
  listening: 'the album or the solo, and what stayed',
  vocal_technique: 'the pattern, and how it felt',
  composition: 'what you wrote',
  live_performance: 'where, what you called, how it went'
}[type] || 'what happened');

/* ---------- logging a jazz sitting ---------- */
function openJazzLog(stageId, conceptId){
  const stages = pianoAllStages();
  const cs = [];
  stages.forEach(({stage, phase}) => (stage.concepts || []).forEach(c =>
    cs.push({c, label:`${stage.number}. ${stage.name} — ${c.name}`})));
  const picked = conceptId || (stageId ? (pianoStage(stageId)?.concepts || [])[0]?.id : null) || cs[0]?.c.id;
  const m = openModal(`<h2>Log jazz practice</h2>
    <div class="grid c2" style="gap:10px">
      <label class="pd-q"><span class="k">date</span><input type="date" class="inp" id="jlDate" value="${today()}"></label>
      <label class="pd-q"><span class="k">minutes</span><input type="number" class="inp mono" id="jlMin" value="${pianoState().settings.defaultPracticeMinutes}"></label>
    </div>
    <label class="pd-q" style="margin-top:10px"><span class="k">what you worked on</span>
      <select class="sel" id="jlConcept">${cs.map(({c, label}) =>
        `<option value="${esc(c.id)}" ${c.id === picked ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select></label>
    <div style="margin-top:12px"><span class="k mono">which keys</span>
      <div class="pn-keypick" id="jlKeys">${PIANO_KEYS.map(k =>
        `<button class="pn-kp" data-jlkey="${esc(k)}" aria-pressed="false">${esc(k)}</button>`).join('')}</div></div>
    <div class="grid c2" style="gap:10px;margin-top:12px">
      <label class="pd-q"><span class="k">quality</span><select class="sel" id="jlQ">${PIANO_QUALITIES.map(([v, n]) =>
        `<option value="${v}" ${v === 'good' ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
      <label class="pd-q"><span class="k">♩=</span><input type="number" class="inp mono" id="jlBpm" placeholder="100"></label>
    </div>
    <!-- Werner's distinction, made at the moment it is true rather than
         reconstructed later: this is the field the whole ratio rests on. -->
    <div style="margin-top:12px"><span class="k mono">what kind of sitting</span>
      <div class="pn-modepick">
        <button class="pn-mp on" data-jlmode="practice">Practice <em>analytical, slow, repetitive</em></button>
        <button class="pn-mp" data-jlmode="play">Play <em>fearless, unedited, no consequences</em></button>
      </div></div>
    <label class="pd-q" style="margin-top:12px"><span class="k">notes</span>
      <textarea class="inp" rows="3" id="jlNotes" placeholder="Eb and Ab still feel clunky. F and G are smooth now."></textarea></label>
    <div class="row" style="justify-content:flex-end;margin-top:14px;gap:8px">
      <button class="btn primary" id="jlSave">Save</button></div>`, 'narrow');
  let mode = 'practice';
  m.querySelectorAll('[data-jlmode]').forEach(b => b.onclick = () => {
    mode = b.dataset.jlmode;
    m.querySelectorAll('[data-jlmode]').forEach(x => x.classList.toggle('on', x === b)); });
  m.querySelectorAll('[data-jlkey]').forEach(b => b.onclick = () => {
    const on = b.getAttribute('aria-pressed') === 'true';
    b.setAttribute('aria-pressed', String(!on)); b.classList.toggle('on', !on); });
  m.querySelector('#jlSave').onclick = () => {
    const keys = [...m.querySelectorAll('[data-jlkey][aria-pressed="true"]')].map(b => b.dataset.jlkey);
    pianoLogJazz({date: m.querySelector('#jlDate').value || today(),
      durationMinutes: +m.querySelector('#jlMin').value || 0,
      conceptId: m.querySelector('#jlConcept').value || null,
      keys, quality: m.querySelector('#jlQ').value,
      bpm: +m.querySelector('#jlBpm').value || null,
      notes: m.querySelector('#jlNotes').value, mode});
    m.remove(); sound('success');
    toast(keys.length ? `Logged. ${keys.length} ${keys.length === 1 ? 'key' : 'keys'} moved up a rung.` : 'Logged.');
    rerender();
  };
  return m;
}
/* One key's own little panel: where "second nature" is claimed, because a
   log cannot give you that — only you can say you have stopped thinking. */
function openKeyPanel(c, key){
  const keys = pianoKeyMastery(c);
  c.keyNotes = c.keyNotes || {};
  const m = openModal(`<h2>${esc(c.name)} — ${esc(key)}</h2>
    <div class="pn-fluency big">${PIANO_FLUENCY.map(f =>
      `<button class="pn-fl${keys[key] === f[0] ? ' on' : ''}" data-kpf="${f[0]}" style="--c:${f[3]}">${esc(f[1])}</button>`).join('')}</div>
    <label class="pd-q" style="margin-top:12px"><span class="k">how it feels in this key</span>
      <textarea class="inp" rows="3" id="kpNote">${esc(c.keyNotes[key] || '')}</textarea></label>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="kpSave">Save</button></div>`, 'narrow');
  let lvl = keys[key];
  m.querySelectorAll('[data-kpf]').forEach(b => b.onclick = () => { lvl = b.dataset.kpf;
    m.querySelectorAll('[data-kpf]').forEach(x => x.classList.toggle('on', x === b)); });
  m.querySelector('#kpSave').onclick = () => {
    keys[key] = lvl; c.keyNotes[key] = m.querySelector('#kpNote').value;
    saveNow(); m.remove(); sound('click'); rerender();
  };
  return m;
}

/* ---------- the ladder, the shelf, the jams ---------- */
function pianoAudiationHTML(){
  const LV = [['developing','developing'],['competent','competent'],['strong','strong']];
  return `<div class="card no-tilt">
    <div class="k">Audiation</div>
    <p class="muted" style="font-size:.85rem">Gordon's six stages: hearing it before you play it. This moves on the scale of seasons, not days — it is asked about in the weekly review rather than logged.</p>
    <div class="pn-ladder">${pianoState().jazz.audiation.map(a => `
      <div class="pn-rung pn-${esc(a.level)}">
        <span class="mono pn-rung-n">${a.stage}</span>
        <span class="pn-rung-b">
          <span class="pn-rung-h serif">${esc(a.name)}</span>
          <span class="pn-rung-w">${esc(a.what)}</span>
          <span class="pn-rung-j">${esc(a.jazz)}</span></span>
        <span class="pn-rung-lv">${LV.map(([v, n]) =>
          `<button class="pn-lv${a.level === v ? ' on' : ''}" data-pnaud="${a.stage}|${v}">${esc(n)}</button>`).join('')}</span>
      </div>`).join('')}</div>
  </div>`;
}
function pianoShelfHTML(){
  const TYPE = {book:'book', video_course:'course', youtube:'YouTube', app:'app', website:'online'};
  return `<div class="card no-tilt">
    <div class="row between"><span class="k">The shelf</span>
      <button class="pl-mini" id="pnResAdd">＋ resource</button></div>
    <div class="pn-shelf">${pianoState().jazz.resources.map(r => `
      <div class="pn-res" data-pnres="${esc(r.id)}">
        <!-- the title is the way to it when there is somewhere to go -->
        ${r.url ? `<a class="pn-res-t serif autolink" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title || r.url)}</a>`
          : `<input class="pn-res-t serif" data-pnresf="${esc(r.id)}|title" value="${esc(r.title)}" placeholder="title">`}
        <span class="pn-res-a"><input data-pnresf="${esc(r.id)}|author" value="${esc(r.author || '')}" placeholder="who wrote it">
          <select data-pnresf="${esc(r.id)}|type">${Object.entries(TYPE).map(([v, n]) =>
            `<option value="${v}" ${r.type === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></span>
        <input class="pn-res-f" data-pnresf="${esc(r.id)}|focus" value="${esc(r.focus || '')}" placeholder="what it is">
        <span class="pn-res-b"><b>best for</b>
          <input data-pnresf="${esc(r.id)}|bestFor" value="${esc(r.bestFor || '')}" placeholder="when to reach for it"></span>
        <span class="pn-res-u">${linkBoxHTML(
          `<input data-pnresf="${esc(r.id)}|url" value="${esc(r.url || '')}" placeholder="where to find it">`, r.url)}
          ${r.url ? `<input class="pn-res-rt" data-pnresf="${esc(r.id)}|title" value="${esc(r.title)}" placeholder="title">` : ''}</span>
        <button class="del-x inline" data-pnresdel="${esc(r.id)}">×</button>
      </div>`).join('')}</div>
  </div>`;
}
function pianoJamsHTML(){
  const jams = pianoState().jazz.jams.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return `<div class="card no-tilt">
    <div class="row between"><span class="k">Jam nights</span>
      <button class="pl-mini" id="pnJamAdd">＋ a night out</button></div>
    <p class="muted" style="font-size:.85rem">The part that cannot be practised alone. What you called, what went well, and who was there.</p>
    ${jams.length ? `<div class="stack" style="gap:8px;margin-top:8px">${jams.map(j => `
      <div class="pn-jam">
        <div class="row between"><span class="serif">${esc(j.venue || 'somewhere')}</span>
          <span class="mono faint">${esc(fmtDate(j.date, 'med'))} · ${'●'.repeat(+j.confidence || 0)}${'○'.repeat(5 - (+j.confidence || 0))}</span></div>
        ${(j.tunes || []).length ? `<div class="pn-jam-t">${(j.tunes || []).map(t => `<span class="pn-tune">${esc(t)}</span>`).join('')}</div>` : ''}
        ${j.well ? `<div class="pn-jam-w"><b>went well</b> ${esc(j.well)}</div>` : ''}
        ${j.improve ? `<div class="pn-jam-i"><b>next time</b> ${esc(j.improve)}</div>` : ''}
        ${(j.peopleIds || []).length ? `<div class="pn-jam-t">${(j.peopleIds || []).map(id => {
          const pp = byId(S.people || [], id); return pp ? `<a class="pn-tune" href="#/people">${esc(pp.name)}</a>` : ''; }).join('')}</div>` : ''}
        <button class="del-x inline" data-pnjamdel="${esc(j.id)}">×</button>
      </div>`).join('')}</div>`
      : '<div class="empty sm">Nothing logged. The first one is the hard one.</div>'}
  </div>`;
}
function openJamLog(){
  const m = openModal(`<h2>A night out</h2>
    <div class="grid c2" style="gap:10px">
      <label class="pd-q"><span class="k">date</span><input type="date" class="inp" id="jmDate" value="${today()}"></label>
      <label class="pd-q"><span class="k">where</span><input class="inp" id="jmVenue" placeholder="Blu Jaz · Maduro · The Jazz Loft"></label>
    </div>
    <label class="pd-q" style="margin-top:10px"><span class="k">tunes called</span>
      <input class="inp" id="jmTunes" placeholder="Autumn Leaves, Blue Bossa, All The Things You Are"></label>
    <label class="pd-q" style="margin-top:10px"><span class="k">what went well</span>
      <textarea class="inp" rows="2" id="jmWell"></textarea></label>
    <label class="pd-q" style="margin-top:10px"><span class="k">what to work on</span>
      <textarea class="inp" rows="2" id="jmImp"></textarea></label>
    <label class="pd-q" style="margin-top:10px"><span class="k">how you felt, 1–5</span>
      <input type="number" class="inp mono" id="jmConf" min="1" max="5" value="3"></label>
    <!-- the musicians you meet at these are the point of going to these -->
    ${(S.people || []).length ? `<div style="margin-top:10px"><span class="k mono">who was there</span>
      <div class="pn-keypick" id="jmPeople">${(S.people || []).map(pp =>
        `<button class="pn-kp" data-jmp="${esc(pp.id)}" aria-pressed="false">${esc(pp.name)}</button>`).join('')}</div></div>` : ''}
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="jmSave">Save</button></div>`, 'narrow');
  m.querySelectorAll('[data-jmp]').forEach(b => b.onclick = () => {
    const on = b.getAttribute('aria-pressed') === 'true';
    b.setAttribute('aria-pressed', String(!on)); b.classList.toggle('on', !on); });
  m.querySelector('#jmSave').onclick = () => {
    pianoState().jazz.jams.push({id:uid(), date:m.querySelector('#jmDate').value || today(),
      venue:m.querySelector('#jmVenue').value,
      tunes:m.querySelector('#jmTunes').value.split(',').map(s => s.trim()).filter(Boolean),
      well:m.querySelector('#jmWell').value, improve:m.querySelector('#jmImp').value,
      confidence:clamp(+m.querySelector('#jmConf').value || 3, 1, 5),
      peopleIds:[...m.querySelectorAll('[data-jmp][aria-pressed="true"]')].map(b => b.dataset.jmp)});
    saveNow(); m.remove(); sound('success'); rerender();
  };
  return m;
}
