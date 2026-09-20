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
/* ---------- the drill, and what it has come to ----------
   The room that used to be a form you filled in afterwards is now the sitting
   itself: a clock, a microphone and a dark screen. What is left here is the
   history, because the only reason to keep three deliveries of one talk is to
   watch the third one get faster than the first over a month. */
function ja432HTML(){
  const rows = jaSessions().slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const wpm = jaWpmSeries();
  const mins = sum(rows.flatMap(s => (s.deliveries || []).map(d => (+d.seconds || 0) / 60)));
  return `<div class="ja-sec">
    <div class="row between" style="align-items:baseline">
      <span class="sc" style="margin:0">4 / 3 / 2</span>
      <button class="btn sm primary" id="ja432New">\u25b6 begin a sitting</button></div>
    <p class="muted ja-note">One talk you already have, delivered three times against a shrinking clock. The content is held constant on purpose: anything that gets faster between the first delivery and the third is the machinery, not the material \u2014 which is why the gains carry over to topics you have never rehearsed.</p>
    ${rows.length ? `<div class="mono faint ja-432-top">${rows.length} sitting${rows.length === 1 ? '' : 's'}
      \u00b7 ${Math.round(mins)} minutes of talking${wpm.length > 1
        ? ` \u00b7 ${wpm[0].wpm} \u2192 ${wpm[wpm.length - 1].wpm} words a minute` : ''}</div>
      ${jaWpmChartHTML(wpm)}
      ${jaPauseShiftHTML()}
      <div class="stack" style="gap:8px;margin-top:10px">${rows.slice(0, 12).map(s => {
      const g = jaSessionGain(s);
      const pause = JA_PAUSE.find(p => p[0] === s.pauseLocation);
      return `<div class="ja-session" data-jasess="${esc(s.id)}">
        <div class="row between" style="align-items:baseline">
          <span class="serif ja-topic">${esc(s.topic || 'untitled')}</span>
          <span class="mono faint">${esc(fmtDate(s.date, 'med'))}</span></div>
        <div class="ja-takes">${(s.deliveries || []).map((d, i) => `
          <div class="ja-take">
            <span class="ja-take-n mono">${d.target || [4,3,2][i]} min</span>
            <span class="ja-take-w">${d.wpm ? `${d.wpm} <em>wpm</em>` : (d.seconds ? jaMMSS(d.seconds) : '\u2014')}</span>
            <span class="ja-take-p mono">${d.audioId ? '\u266a kept' : ''}</span>
          </div>`).join('')}</div>
        ${g ? `<div class="ja-gain mono">${g.first} \u2192 ${g.last} wpm${g.pct > 0 ? ` \u00b7 ${g.pct}% faster by the third` : ''}</div>` : ''}
        ${pause ? `<div class="ja-pause ja-p-${esc(s.pauseLocation)}" title="${esc(pause[2])}">${esc(pause[1])}</div>` : ''}
        ${s.transcript ? `<div class="ja-snotes">${esc(s.transcript.slice(0, 160))}${s.transcript.length > 160 ? '\u2026' : ''}</div>` : ''}
        <div class="ja-tools">
          <button class="tbtn" data-jaaudit="${esc(s.id)}">the audit</button>
          <button class="tbtn" data-jaerr="${esc(s.id)}">log an error from this</button>
          <button class="del-x inline" data-jasessdel="${esc(s.id)}">\u00d7</button></div>
      </div>`; }).join('')}</div>`
      : '<div class="empty">No sittings yet. Pick a topic you could already talk about for four minutes \u2014 that is the whole entry requirement.</div>'}
  </div>`;
}
/* Words a minute over time, drawn only once there are two of them: one dot is
   not a trend and a chart of it claims something it cannot know. */
function jaWpmChartHTML(series){
  if(series.length < 2) return '';
  const W = 520, H = 92, pad = 6;
  const lo = Math.min(...series.map(s => s.wpm)) - 8, hi = Math.max(...series.map(s => s.wpm)) + 8;
  const span = Math.max(1, hi - lo);
  const pts = series.map((s, i) => [pad + (W - pad * 2) * (i / (series.length - 1)),
    H - pad - (H - pad * 2) * ((s.wpm - lo) / span)]);
  return `<div class="ja-chart"><svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" aria-hidden="true">
    <path d="${pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ')}"
      fill="none" stroke="#5c7c8a" stroke-width="2" stroke-linejoin="round"/>
    ${pts.map(q => `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="2.6" fill="#5c7c8a"/>`).join('')}
  </svg><div class="mono faint sm">words a minute, third delivery</div></div>`;
}
/* And the one that matters more. A native pauses between clauses to plan the
   next one; a learner pauses inside a clause because the grammar is still
   being assembled. The move from the second to the first is the whole
   business, and it is the only thing in this room nobody can measure for you. */
function jaPauseShiftHTML(){
  const rows = jaPauseSeries();
  if(rows.length < 3) return '';
  const half = Math.ceil(rows.length / 2);
  const share = list => Math.round(100 * sum(list.map(r => r.mid)) / list.length);
  const early = share(rows.slice(0, half)), late = share(rows.slice(half));
  return `<div class="ja-shift mono">
    pausing mid-clause: ${early}% early on \u2192 ${late}% lately${
      late < early ? ' \u2014 the grammar is proceduralising' : ''}</div>`;
}

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
