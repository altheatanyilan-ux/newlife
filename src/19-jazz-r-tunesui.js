/* ============================================================
   THE TUNE DATABASE'S FIVE MODULES, DRAWN.

   Module 1, the Tune Library: all 917 entries, searchable and
   filterable. Module 2, the Repertoire Tracker. Module 3, the Harmonic
   Analysis Tool: search by feature, compare, and the statistics.
   Module 4, the Lead Sheet Renderer: the chart as a grid, in any key,
   with the patterns coloured. Module 5, Recommended Tunes, on every
   exercise page. And Section 7D's enrichment pathway: analysing a tune
   the database does not have yet.
   ============================================================ */

const jazzTunesUi = () => S._jtunes = S._jtunes || {q: '', difficulty: '', category: '', form: '',
  volume: '', stage: '', features: [], analyzedOnly: false, show: 60};
const jazzTuneUi = () => S._jtune = S._jtune || {key: '', overlay: true};
const JAZZ_TUNE_FEATURES = [
  ['hasIiVI', 'ii-V-I'], ['hasMinorIiVi', 'minor ii-V-i'], ['hasBluesForm', 'blues form'],
  ['hasRhythmChanges', 'rhythm changes'], ['isModal', 'modal'], ['hasTonicization', 'tonicisation'],
  ['hasDimWalkup', 'diminished walk-up'], ['hasTritoneSubstitution', 'tritone substitution'],
  ['dominantAlteredCount', 'altered dominants'], ['keyChangeCount', 'key changes'],
  ['hasColtraneChanges', 'Coltrane changes'], ['hasBackdoorIiV', 'backdoor ii-V'],
  ['hasChromaticMovement', 'chromatic movement'],
  ['foundTritoneSub', 'tritone sub (found)'], ['foundDimPassing', 'diminished passing (found)'],
  ['foundIiVI', 'ii-V-I (found)'], ['foundMinorIiVi', 'minor ii-V-i (found)'], ['foundTonicization', 'tonicisation (found)']];
const jazzTuneFeatureName = k => (JAZZ_TUNE_FEATURES.find(f => f[0] === k) || [k, k])[1];
const jazzTuneWhere = r => r.toc.map(x => `Vol ${x.volume} p.${x.page}`).join(' · ');
const jazzStageChip = (a, link) => `<span class="jt-stage${a.role === 'primary' ? ' pri' : ''}" title="v3 Stage ${a.stage}, ${a.role}">${a.stage}</span>`;

/* ---------- Module 1: the library ---------- */
function jazzTunesHTML(){
  const I = jazzTuneIndex(), u = jazzTunesUi();
  const opts = (map, cur, label) => `<select class="sel" data-jtf="${label}"><option value="">${
    label === 'stage' ? 'any v3 stage' : 'any ' + label}</option>${[...map.keys()]
    .sort((a, b) => isNaN(a) ? a.localeCompare(b) : a - b)
    .map(k => `<option value="${esc(k)}" ${String(cur) === k ? 'selected' : ''}>${
      label === 'stage' ? 'Stage ' + esc(k) : label === 'volume' ? 'Volume ' + esc(k) : esc(k)} (${map.get(k).size})</option>`).join('')}</select>`;
  return `<div class="row between" style="align-items:baseline">
      <h1 class="serif" style="margin:0">Tune library</h1>
      <button class="btn sm ghost" data-jzgo="#/jazz">← the roadmap</button></div>
    <p class="page-blurb">The Real Book, Fifth Edition: ${I.total} entries across three volumes — ${I.rows.length}
      tunes, since some are in more than one — and ${I.analyzed} of them analysed in full.
      Every tune, from any stage.</p>
    <div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:10px">
      <button class="tbtn" data-jzgo="#/jazz/repertoire">🎵 your repertoire</button>
      <button class="tbtn" data-jzgo="#/jazz/analysis">🔎 harmonic analysis</button>
      <button class="tbtn" id="jtAnalyseNew">+ analyse a tune</button></div>
    <div class="jt-filters">
      <input class="inp" id="jtQ" placeholder="search titles, composers, keys, forms" value="${esc(u.q)}">
      ${opts(I.idx.difficulty, u.difficulty, 'difficulty')}
      ${opts(I.idx.category, u.category, 'category')}
      ${opts(I.idx.form, u.form, 'form')}
      ${opts(I.idx.volume, u.volume, 'volume')}
      ${opts(I.idx.stage, u.stage, 'stage')}
      <label class="jz-gate mono"><input type="checkbox" id="jtAnalyzed" ${u.analyzedOnly ? 'checked' : ''}> analysed only</label>
    </div>
    <div class="jt-feats">${JAZZ_TUNE_FEATURES.map(([k, l]) => `<button class="chip${u.features.includes(k) ? ' on' : ''}" data-jtfeat="${esc(k)}">${esc(l)}
      <span class="mono faint">${(I.idx.feature.get(k) || new Set()).size}</span></button>`).join('')}</div>
    <div id="jtResults">${jazzTunesResultsHTML()}</div>`;
}
function jazzTunesResultsHTML(){
  const u = jazzTunesUi();
  const rows = jazzTuneFilter(u);
  /* how many takes each tune has in the journal */
  const takes = {}; (typeof jazzTuneTakes === 'function' ? jazzTuneTakes() : []).forEach(x => { takes[x.tuneId] = (takes[x.tuneId] || 0) + 1; });
  return `<p class="mono faint jt-count">${rows.length} ${rows.length === 1 ? 'tune' : 'tunes'}</p>
    <div class="jt-list">${rows.slice(0, u.show).map(r => {
      const t = r.tune, st = jazzRepStatus(r.id);
      return `<div class="jt-row${r.analyzed ? ' an' : ''}">
        <a class="jt-title" href="#/jazz/tune/${esc(r.id)}">${esc(r.title)}${takes[r.id] ? ` <span class="jt-takes mono" title="${takes[r.id]} recorded take${takes[r.id] === 1 ? '' : 's'}">🎙 ${takes[r.id]}</span>` : ''}</a>
        <span class="mono faint jt-where">${esc(jazzTuneWhere(r))}</span>
        ${t ? `<span class="jt-meta">${esc(t.key)} · ${esc(t.form)} · ${esc(t.difficulty)} · ${esc(t.category)}</span>
          <span class="jt-stages">${(r.v3 || []).map(a => jazzStageChip(a)).join('')}</span>`
          : `<span class="jt-meta faint">table of contents only</span><span></span>`}
        <select class="sel sm" data-jtrep="${esc(r.id)}"><option value="">—</option>${JAZZ_REP_STATUS.map(([v, l]) =>
          `<option value="${v}" ${st === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>
      </div>`; }).join('')}</div>
    ${rows.length > u.show ? `<button class="btn sm ghost" id="jtMore">show ${Math.min(120, rows.length - u.show)} more</button>` : ''}`;
}
function bindJazzTunes(root){
  const u = jazzTunesUi();
  const redo = () => { const box = root.querySelector('#jtResults'); if(box){ box.innerHTML = jazzTunesResultsHTML(); bindRes(); } };
  const bindRes = () => {
    $$('[data-jtrep]', root).forEach(s => s.onchange = () => { jazzRepSet(s.dataset.jtrep, s.value || null); sound('click'); });
    const more = root.querySelector('#jtMore'); if(more) more.onclick = () => { u.show += 120; redo(); };
  };
  bindRes();
  $$('[data-jzgo]', root).forEach(b => b.onclick = () => navigate(b.dataset.jzgo));
  const q = root.querySelector('#jtQ');
  if(q) q.oninput = () => { u.q = q.value; u.show = 60; redo(); };
  $$('[data-jtf]', root).forEach(s => s.onchange = () => { u[s.dataset.jtf] = s.value; u.show = 60; redo(); });
  const an = root.querySelector('#jtAnalyzed');
  if(an) an.onchange = () => { u.analyzedOnly = an.checked; redo(); };
  $$('[data-jtfeat]', root).forEach(b => b.onclick = () => {
    const k = b.dataset.jtfeat; u.features = u.features.includes(k) ? u.features.filter(x => x !== k) : u.features.concat(k);
    b.classList.toggle('on'); u.show = 60; redo(); });
  const add = root.querySelector('#jtAnalyseNew');
  if(add) add.onclick = () => openJazzAnalyseTune(null);
}

/* ---------- Module 4: one tune, its chart ---------- */
function jazzChartHTML(t, key, overlay){
  const chart = jazzParseChart(t.chordProgression);
  if(chart.prose) return `<div class="jt-prose">${esc(chart.prose)}</div>`;
  const semis = jazzTuneShift(t, key);
  const marks = overlay ? jazzTuneBarMarks(t) : {};
  return `<div class="jt-chart">${chart.sections.map(sec => `<div class="jt-sec">
      ${sec.label ? `<span class="jt-seclab mono">${esc(sec.label)}</span>` : ''}
      <div class="jt-bars">${sec.bars.map(b => {
        const mk = marks[b.n] || [];
        return `<div class="jt-bar${b.repeat ? ' rep' : ''}" data-bar="${b.n}"${mk.length ? ` title="${esc(mk.map(k => JAZZ_TUNE_PATTERNS[k].said).join(', '))}"` : ''}>
          <span class="jt-bn mono">${b.n}</span>
          <div class="jt-chords">${b.repeat && b.chords.length ? `<span class="jt-sim" data-ci="0" data-sym="${esc(jazzTransposeChord(b.chords[0].text, semis, key))}" data-orig="${esc(b.chords[0].text)}">%</span>`
            : b.chords.map((c, ci) => `<span class="jt-ch${c.optional ? ' opt' : ''}" style="flex:${c.beats || 1}" data-ci="${ci}"
              data-sym="${esc(jazzTransposeChord(c.text, semis, key))}" data-orig="${esc(c.text)}">${c.optional ? '(' : ''}${
              esc(jazzPrettyChord(jazzTransposeChord(c.text, semis, key)))}${c.optional ? ')' : ''}</span>`).join('')}</div>
          ${b.notes.length ? `<span class="jt-note">${esc(b.notes.join(' '))}</span>` : ''}
          ${mk.length ? `<span class="jt-marks">${mk.map(k => `<i class="${JAZZ_TUNE_PATTERNS[k].dashed ? 'dash' : ''}" data-kind="${k}" title="${esc(JAZZ_TUNE_PATTERNS[k].said)} — tap to loop it" style="--c:${JAZZ_TUNE_PATTERNS[k].color}"></i>`).join('')}</span>` : ''}
        </div>`; }).join('')}</div></div>`).join('')}</div>`;
}
function jazzPatternLegendHTML(t){
  const a = jazzTuneAnalysis(t);
  return `<div class="jt-legend">${Object.keys(JAZZ_TUNE_PATTERNS).map(k => `<span class="jt-leg${a.counts[k] ? '' : ' none'}">
      <i class="${JAZZ_TUNE_PATTERNS[k].dashed ? 'dash' : ''}" style="--c:${JAZZ_TUNE_PATTERNS[k].color}"></i>${esc(JAZZ_TUNE_PATTERNS[k].said)}
      <b class="mono">${a.counts[k] || 0}</b></span>`).join('')}</div>`;
}
function jazzTuneHTML(id){
  const r = jazzTuneRow(id);
  if(!r) return `<div class="empty">No tune called ${esc(id)}. <a href="#/jazz/tunes">The library</a></div>`;
  const back = `<div class="row between" style="align-items:baseline;gap:8px;flex-wrap:wrap">
    <button class="btn sm ghost" data-jzgo="#/jazz/tunes">← the library</button>
    <span class="mono faint">${esc(jazzTuneWhere(r))}</span></div>`;
  if(!r.tune) return `${back}<h1 class="serif">${esc(r.title)}</h1>
    <p class="page-blurb">In the table of contents of the Real Book (${esc(jazzTuneWhere(r))}), and not yet analysed.
      Section 7D: "append new tune objects to REAL_BOOK_TUNE_DATABASE and flip the corresponding TOC entry's analyzed flag to true."</p>
    <button class="btn primary" data-jtanalyse="${esc(r.id)}">Analyse this tune</button>
    ${jazzRepControlsHTML(r.id)}`;
  const t = r.tune, u = jazzTuneUi();
  const key = JAZZ_KEY_NAMES.includes(u.key) ? u.key : '';
  const a = jazzTuneAnalysis(t);
  const units = jazzTuneUnitStages(t);
  const steps = typeof jazzTuneProgress === 'function' ? jazzTuneProgress(t.title) : null;
  return `${back}
    <h1 class="serif" style="margin-top:8px">${esc(t.title)}</h1>
    <p class="jt-by">${esc(t.composer)} · ${esc(t.key)} · ${esc(t.form)}, ${t.measures} bars · ${esc(t.timeSignature)} · ${esc(t.tempo)}
      · <b>${esc(t.difficulty)}</b> · ${esc(t.category)}${r.userAdded ? ' · <em>analysed by you</em>' : ''}</p>
    <div class="jz-cols">
      <div class="jz-main">
        <div class="jz-keyrow"><span class="mono faint">in the key of</span>
          <div class="jz-keypick"><button class="jz-k wide${key ? '' : ' on'}" data-jtkey="">as written</button>${JAZZ_KEY_NAMES.map(k =>
            `<button class="jz-k${k === key ? ' on' : ''}" data-jtkey="${esc(k)}">${esc(jazzPretty(k))}</button>`).join('')}</div></div>
        <div class="row" style="gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px">
          <label class="jz-gate mono"><input type="checkbox" id="jtOverlay" ${u.overlay ? 'checked' : ''}> show the patterns</label>
          ${u.overlay ? jazzPatternLegendHTML(t) : ''}</div>
        ${jazzPracticePanelHTML(t)}
        ${jazzChartHTML(t, key, u.overlay)}
        <p class="mono faint jt-help">Tap a chord for its scales and voicings. While it plays (or after “set a loop”), tap a start bar and an end bar to loop them;
          tap a pattern’s coloured bar to loop that pattern. A chord with (n) after it fills n bars; % repeats the bar before; chords in brackets are optional.</p>
        <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px">
          <button class="btn sm ghost" id="jtCopy">copy the changes</button></div>
        ${a.spans.length ? `<div class="jz-note" style="margin-top:14px"><span class="sc">What the analysis found</span>
          <ul class="jt-spans">${a.spans.map(s => `<li><i class="${JAZZ_TUNE_PATTERNS[s.kind].dashed ? 'dash' : ''}" style="--c:${JAZZ_TUNE_PATTERNS[s.kind].color}"></i>
            <span class="mono">bars ${s.from}${s.to !== s.from ? '–' + s.to : ''}</span> ${esc(s.label)}
            <button class="tbtn jt-loopbtn" data-jtloop="${s.from}-${s.to}" title="loop bars ${s.from}–${s.to}">⟳</button></li>`).join('')}</ul></div>` : ''}
      </div>
      <aside class="jz-side">
        ${jazzRepControlsHTML(t.id)}
        ${jazzJournalSideHTML(t.id)}
        <div class="jz-note"><span class="sc">v3 stages</span>
          <div class="jt-stagelist">${(r.v3 || []).map(x => { const st = jazzStage(String(x.stage));
            return `<div><span class="jt-stage${x.role === 'primary' ? ' pri' : ''}">${x.stage}</span> ${esc(st ? st.name : '')}
              <span class="mono faint">${x.role}</span></div>`; }).join('')}</div>
          <p class="faint" style="font-size:.74rem">The delivered alignment was ${esc((t.stageAlignment || []).map(s => `old ${s.stage} (${s.role})`).join(', ') || 'empty')};
            moved to v3 by Section 7A and extended by the 7B rules.</p></div>
        <div class="jz-note"><span class="sc">Harmony</span>
          <ul class="jt-tags">${Object.keys(t.harmonicTags || {}).map(k => `<li><b>${esc(jazzTuneFeatureName(k))}</b>
            <span class="mono">${esc(Array.isArray(t.harmonicTags[k]) ? t.harmonicTags[k].join(', ') : String(t.harmonicTags[k]))}</span></li>`).join('')}</ul></div>
        ${t.lists ? `<div class="jz-note"><span class="sc">Siskind</span>
          <p>${t.lists.siskindTuneBank ? 'On the Siskind Tune Bank.' : 'Not on the Siskind Tune Bank.'}</p>
          ${units.length ? `<p>Suggested for ${units.map(x => `${esc(x.unit)} → <b>Stage ${esc(x.stage || '?')}</b>`).join(', ')}</p>` : ''}
          ${t.lists.notes ? `<p class="faint">${esc(t.lists.notes)}</p>` : ''}</div>` : ''}
        ${(t.recordings || []).length ? `<div class="jz-note"><span class="sc">Recordings</span>
          <ul class="jt-recs">${t.recordings.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
        ${steps ? `<div class="jz-note"><span class="sc">The eleven steps</span>
          <p>${steps.done} of ${steps.of} for this tune.</p>
          <button class="tbtn" data-jzgo="#/jazz/7B.916">the tune mastery workflow →</button></div>` : ''}
      </aside>
    </div>`;
}
function jazzRepControlsHTML(id){
  const st = jazzRepStatus(id);
  return `<div class="jz-note jt-rep"><span class="sc">Your repertoire</span>
    <div class="row" style="gap:6px;flex-wrap:wrap">${JAZZ_REP_STATUS.map(([v, l]) =>
      `<button class="btn sm ${st === v ? 'primary' : 'ghost'}" data-jtset="${v}" data-jtid="${esc(id)}">${esc(l)}</button>`).join('')}
      ${st ? `<button class="tbtn" data-jtset="" data-jtid="${esc(id)}">remove</button>` : ''}</div></div>`;
}
function bindJazzTune(root, id){
  const u = jazzTuneUi();
  $$('[data-jzgo]', root).forEach(b => b.onclick = () => navigate(b.dataset.jzgo));
  $$('[data-jtkey]', root).forEach(b => b.onclick = () => { u.key = b.dataset.jtkey; sound('click');
    /* playing: the band takes the new key from its next repeat */
    const t = jazzTune(id);
    if(t && _jzBand && _jzBand.running && _jzBand._tune === id){ _jzBand.set('toKey', u.key); _jzBand.set('semis', jazzTuneShift(t, u.key)); }
    rerender(); });
  const t0 = jazzTune(id);
  if(t0){ bindJazzPracticePanel(root, t0);
    const side = root.querySelector('#jzjSide');
    if(side) bindJazzTakeRows(side, () => rerender()); }
  const ov = root.querySelector('#jtOverlay');
  if(ov) ov.onchange = () => { u.overlay = ov.checked; rerender(); };
  $$('[data-jtset]', root).forEach(b => b.onclick = () => { jazzRepSet(b.dataset.jtid, b.dataset.jtset || null); sound('success'); rerender(); });
  $$('[data-jtanalyse]', root).forEach(b => b.onclick = () => openJazzAnalyseTune(b.dataset.jtanalyse));
  const copy = root.querySelector('#jtCopy');
  if(copy) copy.onclick = async () => {
    const t = jazzTune(id); if(!t) return;
    const semis = jazzTuneShift(t, u.key);
    const txt = jazzParseChart(t.chordProgression).sections.map(s => (s.label ? s.label + ': ' : '')
      + s.bars.map(b => b.chords.map(c => jazzTransposeChord(c.text, semis, u.key)).join(' ') || '%').join(' | ')).join('\n');
    try { await navigator.clipboard.writeText(`${t.title}\n${txt}`); toast('Copied.'); } catch(e){ toast(txt, 9000); }
  };
}

/* ---------- Module 5: the sidebar on every exercise ---------- */
function jazzRecommendedTunesHTML(ex){
  if(!ex || !/^\d+$/.test(String(ex.stage))) return '';
  const list = jazzRecommendedTunes(ex, 5);
  if(!list.length) return '';
  const feats = JAZZ_TUNE_STAGE_FEATURE[String(ex.stage)] || [];
  return `<div class="jz-note jt-rec"><span class="sc">Recommended tunes</span>
    ${list.map(x => { const t = x.row.tune; const a = jazzTuneAnalysis(t);
      const where = a.spans.filter(s => s.kind === 'iivi' || s.kind === 'minor' || s.kind === 'tonicization')
        .slice(0, 3).map(s => `${s.from}–${s.to}`);
      return `<div class="jt-recrow"><a href="#/jazz/tune/${esc(t.id)}">${esc(t.title)}</a>
        <span class="mono faint">${esc(t.key)} · ${esc(t.difficulty)}${x.named ? ' · named by v3' : ''}</span>
        ${where.length && ['2', '7'].includes(String(ex.stage)) ? `<span class="faint jt-recwhere">ii-V motion at bars ${esc(where.join(', '))}</span>` : ''}</div>`; }).join('')}
    <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px">
      ${feats.map(f => `<button class="tbtn" data-jzgo="#/jazz/analysis/${esc(f)}">${esc(jazzTuneFeatureName(f))} in the analysis tool →</button>`).join('')}
      <button class="tbtn" data-jzgo="#/jazz/tunes">the library →</button></div></div>`;
}

/* ---------- Module 2: the repertoire ---------- */
function jazzRepertoireHTML(){
  const p = jazzRepertoireProgress(), I = jazzTuneIndex(), rep = jazzTunesState().repertoire;
  const group = st => I.rows.filter(r => (rep[r.id] || {}).status === st);
  const rowHTML = r => { const t = r.tune; const units = t ? jazzTuneUnitStages(t) : [];
    return `<div class="jt-row an"><a class="jt-title" href="#/jazz/tune/${esc(r.id)}">${esc(r.title)}</a>
      <span class="mono faint jt-where">${esc(jazzTuneWhere(r))}</span>
      <span class="jt-meta">${t ? `${esc(t.key)} · ${esc(t.difficulty)}${t.lists && t.lists.siskindTuneBank ? ' · Tune Bank' : ''}` : 'not analysed'}
        ${units.length ? `<span class="faint"> · ${units.map(x => `${esc(x.unit)}→${esc(x.stage || '?')}`).join(' ')}</span>` : ''}</span>
      <span class="jt-stages">${(r.v3 || []).map(a => jazzStageChip(a)).join('')}</span>
      <select class="sel sm" data-jtrep="${esc(r.id)}"><option value="">remove</option>${JAZZ_REP_STATUS.map(([v, l]) =>
        `<option value="${v}" ${(rep[r.id] || {}).status === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`; };
  const max = Math.max(1, ...Object.values(p.perStage).map(x => x.of));
  return `<div class="row between" style="align-items:baseline">
      <h1 class="serif" style="margin:0">Repertoire</h1>
      <button class="btn sm ghost" data-jzgo="#/jazz">← the roadmap</button></div>
    <p class="page-blurb">Which tunes you have learned, are learning, and want to learn — tied to the stages by the
      tunes' v3 alignment.</p>
    <div class="jt-tiles">
      <div class="jt-tile"><span class="sc">Learned</span><b class="serif">${p.learned}</b></div>
      <div class="jt-tile"><span class="sc">Learning</span><b class="serif">${p.learning}</b></div>
      <div class="jt-tile"><span class="sc">Want to learn</span><b class="serif">${p.want}</b></div>
      <div class="jt-tile"><span class="sc">Siskind Tune Bank</span><b class="serif">${p.bank.pct}%</b>
        <span class="mono faint">${p.bank.learned} of ${p.bank.of} learned</span></div></div>
    <div class="jz-note"><span class="sc">Tunes learned per stage</span>
      <p class="faint" style="font-size:.76rem">Out of the analysed tunes that are primary for each stage.</p>
      <div class="jt-bars-chart" role="table">${Object.keys(p.perStage).map(s => { const x = p.perStage[s];
        return `<div class="jt-hbar" role="row" title="Stage ${s}: ${x.learned} learned, ${x.learning} learning, of ${x.of}">
          <span class="mono jt-hlab" role="cell">Stage ${s}</span>
          <span class="jt-htrack" role="cell"><i style="width:${x.of / max * 100}%"></i><b style="width:${x.learned / max * 100}%"></b></span>
          <span class="mono jt-hval" role="cell">${x.learned}/${x.of}</span></div>`; }).join('')}</div></div>
    <div class="jz-note"><span class="sc">Harmonic concepts covered</span>
      <div class="jt-concepts">${Object.keys(p.concepts).map(k => `<span class="jt-concept"><b>${esc(jazzTuneFeatureName(k))}</b>
        <span class="mono">${p.concepts[k].learned}/${p.concepts[k].of}</span></span>`).join('')}</div></div>
    ${['learning', 'want', 'learned'].map(st => { const g = group(st);
      return `<div class="jt-group"><h2 class="serif">${esc(JAZZ_REP_STATUS.find(x => x[0] === st)[1])} <span class="mono faint">${g.length}</span></h2>
        ${g.length ? `<div class="jt-list">${g.map(rowHTML).join('')}</div>`
          : `<div class="empty">Nothing here yet — mark tunes from <a href="#/jazz/tunes">the library</a>.</div>`}</div>`; }).join('')}`;
}
function bindJazzRepertoire(root){
  $$('[data-jzgo]', root).forEach(b => b.onclick = () => navigate(b.dataset.jzgo));
  $$('[data-jtrep]', root).forEach(s => s.onchange = () => { jazzRepSet(s.dataset.jtrep, s.value || null); sound('click'); rerender(); });
}

/* ---------- Module 3: harmonic analysis ---------- */
const jazzAnalysisUi = () => S._janalysis = S._janalysis || {features: [], iiViKey: '', compare: []};
function jazzAnalysisHTML(feature){
  const u = jazzAnalysisUi();
  if(feature){ u.features = String(feature).split(',').filter(Boolean); }
  const I = jazzTuneIndex();
  const rows = jazzTuneFilter({features: u.features, iiViKey: u.iiViKey, analyzedOnly: true});
  const stats = typeof TUNE_DB_STATS !== 'undefined' ? TUNE_DB_STATS : {harmonicTagCounts: {}};
  const live = {};
  JAZZ_TUNE_FEATURES.forEach(([k]) => live[k] = (I.idx.feature.get(k) || new Set()).size);
  const max = Math.max(1, ...Object.values(live));
  const keys = [...new Set(I.rows.filter(r => r.tune).flatMap(r => jazzTuneAnalysis(r.tune).iiViKeys))].sort();
  const cmp = u.compare.map(jazzTune).filter(Boolean);
  return `<div class="row between" style="align-items:baseline">
      <h1 class="serif" style="margin:0">Harmonic analysis</h1>
      <button class="btn sm ghost" data-jzgo="#/jazz">← the roadmap</button></div>
    <p class="page-blurb">Search the ${I.analyzed} analysed tunes by what their harmony does. The delivered tags come
      with the database; the "(found)" ones are what the analysis of each chart finds, bar by bar.</p>
    <div class="jt-feats">${JAZZ_TUNE_FEATURES.map(([k, l]) => `<button class="chip${u.features.includes(k) ? ' on' : ''}" data-jafeat="${esc(k)}">${esc(l)}
      <span class="mono faint">${live[k]}</span></button>`).join('')}</div>
    <div class="row" style="gap:8px;align-items:center;margin:8px 0">
      <span class="mono faint">ii-V-I in the key of</span>
      <select class="sel" id="jaKey"><option value="">any</option>${keys.map(k => `<option ${u.iiViKey === k ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select>
    </div>
    <p class="mono faint">${rows.length} tunes${u.features.length ? ' with ' + esc(u.features.map(jazzTuneFeatureName).join(' + ')) : ''}${u.iiViKey ? ` and a ii-V-I into ${esc(u.iiViKey)}` : ''}</p>
    <div class="jzv3-table-wrap"><table class="jzv3-table"><thead><tr><th>compare</th><th>Tune</th><th>Key</th><th>Form</th>
      ${Object.keys(JAZZ_TUNE_PATTERNS).map(k => `<th title="${esc(JAZZ_TUNE_PATTERNS[k].said)}"><i class="jt-dot${JAZZ_TUNE_PATTERNS[k].dashed ? ' dash' : ''}" style="--c:${JAZZ_TUNE_PATTERNS[k].color}"></i>${esc(JAZZ_TUNE_PATTERNS[k].said)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => { const a = jazzTuneAnalysis(r.tune);
        return `<tr><td><input type="checkbox" data-jacmp="${esc(r.id)}" ${u.compare.includes(r.id) ? 'checked' : ''}></td>
          <td><a href="#/jazz/tune/${esc(r.id)}">${esc(r.title)}</a></td><td>${esc(r.tune.key)}</td><td>${esc(r.tune.form)}</td>
          ${Object.keys(JAZZ_TUNE_PATTERNS).map(k => `<td class="mono">${a.counts[k] || ''}</td>`).join('')}</tr>`; }).join('')}</tbody></table></div>
    ${cmp.length ? `<h2 class="serif" style="margin-top:18px">Side by side</h2>
      <div class="jzv3-table-wrap"><table class="jzv3-table"><thead><tr><th></th>${cmp.map(t => `<th>${esc(t.title)}</th>`).join('')}</tr></thead>
      <tbody>${['key', 'form', 'difficulty', 'category'].map(f => `<tr><td class="mono">${f}</td>${cmp.map(t => `<td>${esc(String(t[f]))}</td>`).join('')}</tr>`).join('')}
      ${JAZZ_TUNE_FEATURES.filter(([k]) => !/^found/.test(k)).map(([k, l]) => `<tr><td>${esc(l)}</td>${cmp.map(t => { const v = (t.harmonicTags || {})[k];
        return `<td class="mono">${v === undefined ? '' : esc(Array.isArray(v) ? v.join(', ') : String(v))}</td>`; }).join('')}</tr>`).join('')}
      ${Object.keys(JAZZ_TUNE_PATTERNS).map(k => `<tr><td>${esc(JAZZ_TUNE_PATTERNS[k].said)} (found)</td>${cmp.map(t => `<td class="mono">${jazzTuneAnalysis(t).counts[k] || 0}</td>`).join('')}</tr>`).join('')}
      </tbody></table></div>` : ''}
    <h2 class="serif" style="margin-top:22px">The database in numbers</h2>
    <div class="jt-bars-chart" role="table" aria-label="Tunes carrying each harmonic feature">${JAZZ_TUNE_FEATURES.map(([k, l]) => `<div class="jt-hbar" role="row"
        title="${esc(l)}: ${live[k]} tunes${stats.harmonicTagCounts[k] != null ? ` (the delivered statistics say ${stats.harmonicTagCounts[k]})` : ''}">
      <span class="jt-hlab" role="cell">${esc(l)}</span>
      <span class="jt-htrack" role="cell"><b style="width:${live[k] / max * 100}%"></b></span>
      <span class="mono jt-hval" role="cell">${live[k]}</span></div>`).join('')}</div>
    <p class="faint" style="font-size:.76rem">By difficulty: ${Object.entries(stats.byDifficulty || {}).map(([k, v]) => `${esc(k)} ${v}`).join(' · ')}.
      By category: ${Object.entries(stats.byCategory || {}).map(([k, v]) => `${esc(k)} ${v}`).join(' · ')}.</p>`;
}
function bindJazzAnalysis(root){
  const u = jazzAnalysisUi();
  const redraw = () => { location.hash = '#/jazz/analysis' + (u.features.length ? '/' + u.features.join(',') : ''); rerender(); };
  $$('[data-jzgo]', root).forEach(b => b.onclick = () => navigate(b.dataset.jzgo));
  $$('[data-jafeat]', root).forEach(b => b.onclick = () => { const k = b.dataset.jafeat;
    u.features = u.features.includes(k) ? u.features.filter(x => x !== k) : u.features.concat(k); redraw(); });
  const k = root.querySelector('#jaKey'); if(k) k.onchange = () => { u.iiViKey = k.value; rerender(); };
  $$('[data-jacmp]', root).forEach(c => c.onchange = () => { const id = c.dataset.jacmp;
    u.compare = c.checked ? u.compare.concat(id).slice(-3) : u.compare.filter(x => x !== id); rerender(); });
}

/* ---------- Section 7D: analysing a tune the database does not have ----------
   "append new tune objects to REAL_BOOK_TUNE_DATABASE and flip the
   corresponding TOC entry's analyzed flag to true. No schema changes
   needed." The shipped database is not written to — a tune you analyse
   is kept in your own state, with the same fields, and the index treats
   it as analysed. The harmonic tags are worked out from the changes. */
const JAZZ_TUNE_DIFFICULTY_GUIDE = [
  ['beginner', 'simple harmony (mostly I-IV-V or basic ii-V-I), common keys (C, F, Bb, Eb), blues forms, 32-bar AABA with few modulations'],
  ['intermediate', 'multiple key centers, minor ii-V-i, some chromatic harmony, moderate tempo'],
  ['advanced', 'rapid modulations, Coltrane changes, highly chromatic, unusual forms, very fast tempos, modal jazz']];
function jazzTunePriority(){
  /* "analyze tunes that appear on the Siskind Tune Bank first, then tunes
     referenced in the Repertoire Ladder, then tunes commonly called at jam
     sessions" — the Tune Bank flags live only on tunes already analysed,
     so the first list the room can offer is the ladder's */
  const I = jazzTuneIndex();
  const norm = s => String(s).toLowerCase().replace(/[“”"'’]/g, '').replace(/^transcribe:\s*/, '').replace(/\s+(solo|intro)$/, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const out = [];
  (JAZZ_V3_DOC.ladder || []).forEach(r => {
    const want = norm(r[1]);
    const hit = I.rows.find(x => norm(x.title) === want);
    if(hit && !hit.analyzed && !out.includes(hit)) out.push(hit);
  });
  return out;
}
function openJazzAnalyseTune(id){
  const I = jazzTuneIndex();
  const r = id ? jazzTuneRow(id) : null;
  const pri = jazzTunePriority();
  const m = openModal(`<h2>Analyse a tune</h2>
    <p class="faint" style="font-size:.8rem">Section 7D: the database grows one analysed tune at a time. Priority: the Siskind Tune Bank,
      then the Repertoire Ladder, then the tunes called at jam sessions.</p>
    ${!r ? `<label class="pd-q"><span class="k">which tune</span>
      <select class="sel" id="jaWhich">${pri.map(x => `<option value="${esc(x.id)}">${esc(x.title)} — on the repertoire ladder</option>`).join('')}
        ${I.rows.filter(x => !x.analyzed && !pri.includes(x)).map(x => `<option value="${esc(x.id)}">${esc(x.title)}</option>`).join('')}</select></label>`
      : `<p><b>${esc(r.title)}</b> <span class="mono faint">${esc(jazzTuneWhere(r))}</span></p>`}
    <div class="row" style="gap:10px;flex-wrap:wrap">
      <label class="pd-q" style="flex:1"><span class="k">composer</span><input class="inp" id="jaComposer"></label>
      <label class="pd-q" style="width:90px"><span class="k">key</span><input class="inp mono" id="jaKeyIn" placeholder="Bb"></label>
      <label class="pd-q" style="width:120px"><span class="k">form</span><input class="inp" id="jaForm" placeholder="AABA"></label>
      <label class="pd-q" style="width:80px"><span class="k">bars</span><input class="inp mono" id="jaBars" type="number" value="32"></label>
      <label class="pd-q" style="width:80px"><span class="k">time</span><input class="inp mono" id="jaTime" value="4/4"></label></div>
    <div class="row" style="gap:10px;flex-wrap:wrap;margin-top:8px">
      <label class="pd-q" style="flex:1"><span class="k">tempo</span><input class="inp" id="jaTempo" placeholder="Medium Swing"></label>
      <label class="pd-q" style="flex:1"><span class="k">category</span><select class="sel" id="jaCat">${
        ['standard', 'blues', 'bebop', 'modal', 'ballad', 'bossa', 'waltz', 'other'].map(c => `<option>${c}</option>`).join('')}</select></label>
      <label class="pd-q" style="flex:1"><span class="k">difficulty</span><select class="sel" id="jaDiff">${
        JAZZ_TUNE_DIFFICULTY_GUIDE.map(([d]) => `<option>${d}</option>`).join('')}</select></label></div>
    <ul class="jt-guide">${JAZZ_TUNE_DIFFICULTY_GUIDE.map(([d, g]) => `<li><b>${d}</b> — ${esc(g)}</li>`).join('')}</ul>
    <label class="pd-q"><span class="k">the changes</span>
      <textarea class="inp mono" rows="4" id="jaChanges" placeholder="A: Cm7|F7|BbM7|EbM7 B: Am7b5|D7|Gm|% — sections as A:, bars split by |, % repeats a bar, Dm7(8) is eight bars"></textarea></label>
    <div class="row" style="gap:12px;flex-wrap:wrap;margin-top:6px">
      <label class="jz-gate mono"><input type="checkbox" id="jaModal"> modal</label>
      <label class="jz-gate mono"><input type="checkbox" id="jaBlues"> blues form</label>
      <label class="jz-gate mono"><input type="checkbox" id="jaRhythm"> rhythm changes</label>
      <label class="pd-q" style="width:120px"><span class="k">key changes</span><input class="inp mono" id="jaKc" type="number" value="0" min="0"></label></div>
    <label class="pd-q" style="margin-top:8px"><span class="k">recordings, one a line</span>
      <textarea class="inp" rows="2" id="jaRecs"></textarea></label>
    <div id="jaPreview" class="jt-preview"></div>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px">
      <button class="btn sm ghost" id="jaTry">look at the analysis</button>
      <button class="btn primary" id="jaSave">Add to the database</button></div>`, 'wide');
  const read = () => {
    const tid = r ? r.id : m.querySelector('#jaWhich').value;
    const row = jazzTuneRow(tid);
    const v = s => (m.querySelector(s) || {}).value || '';
    const tune = {id: tid, title: row.title, composer: v('#jaComposer') || 'Unknown', key: v('#jaKeyIn') || 'C',
      form: v('#jaForm') || 'AABA', measures: +v('#jaBars') || 32, timeSignature: v('#jaTime') || '4/4',
      tempo: v('#jaTempo') || 'Medium Swing', difficulty: v('#jaDiff'), category: v('#jaCat'), analyzed: true,
      realBook: Object.assign({edition: 'Fifth'}, row.toc[0] || {volume: 1, page: 0}),
      harmonicTags: {}, chordProgression: v('#jaChanges').trim(),
      lists: {siskindTuneBank: false, siskindUnitSuggestion: ''}, stageAlignment: [],
      recordings: v('#jaRecs').split('\n').map(x => x.trim()).filter(Boolean), userAdded: true};
    const a = jazzTuneAnalysis(Object.assign({}, tune));
    const h = tune.harmonicTags;
    const iivi = (a.counts.iivi || 0) + a.spans.filter(s => s.kind === 'tonicization' && /ii-V-I/.test(s.label)).length;
    if(iivi){ h.hasIiVI = true; h.iiViCount = iivi; }
    if(a.counts.minor) h.hasMinorIiVi = true;
    if(a.counts.tonicization) h.hasTonicization = true;
    if(a.counts.dim) h.hasDimWalkup = true;
    if(a.counts.tritone) h.hasTritoneSubstitution = true;
    const alt = a.events.filter(e => e.altered).length; if(alt) h.dominantAlteredCount = alt;
    if(m.querySelector('#jaModal').checked) h.isModal = true;
    if(m.querySelector('#jaBlues').checked) h.hasBluesForm = true;
    if(m.querySelector('#jaRhythm').checked) h.hasRhythmChanges = true;
    if(+v('#jaKc')) h.keyChangeCount = +v('#jaKc');
    return tune;
  };
  const preview = () => { const t = read(); m.querySelector('#jaPreview').innerHTML = t.chordProgression
    ? `${jazzPatternLegendHTML(t)}${jazzChartHTML(t, '', true)}<p class="mono faint">tags: ${esc(JSON.stringify(t.harmonicTags))} · v3 stages: ${
      jazzTuneV3Alignment(t).map(a => a.stage + (a.role === 'primary' ? '' : '?')).join(', ')}</p>` : ''; };
  m.querySelector('#jaTry').onclick = preview;
  m.querySelector('#jaSave').onclick = () => {
    const t = read();
    if(!t.chordProgression){ toast('The changes are the one thing that cannot be left out.'); return; }
    const st = jazzTunesState();
    st.tunesAdded = st.tunesAdded.filter(x => x.id !== t.id).concat(t);
    saveNow(); jazzTuneIndexReset(); _jazzTunesByStage = null;
    m.remove(); sound('success'); toast(`${t.title} is analysed.`); navigate('#/jazz/tune/' + t.id);
  };
  return m;
}
