/* ============================================================
   THE KNOWLEDGE TREE × iCanStudy — reflecting and measuring (N-08, N-09).

   The week made visible: what was retrieved and by how many methods, what
   held at about a week by the level it tested, the mistakes still open, the
   gaps that moved — and a Kolb form (experience, reflection, abstraction,
   experiment) whose saved entry goes to the Journal and is kept, not edited.
   Then the measurements that say whether any of this is working: every
   figure derived at read time from the retrievals, and none stored, so
   correcting the log corrects them. Thin data is not allowed to speak.
   ============================================================ */

/* ============================================================
   N-08  Weekly review and the Kolb cycle
   ============================================================ */
const ICS_KOLB_FIELDS = [
  {key: 'experience', label: 'Experience', prompt: 'What did you actually do this week?'},
  {key: 'reflection', label: 'Reflection', prompt: 'What did you notice? Where did it feel hardest, and where did it feel suspiciously easy?'},
  {key: 'abstraction', label: 'Abstraction', prompt: 'What do you now think is true about how you learn this subject?'},
  {key: 'experiment', label: 'Experiment', prompt: 'What one thing will you change next week?'}];
const ICS_SYSTEM_REVIEW_DAYS = 17;
const ICS_SYSTEM_REVIEW_PROMPTS = ['What has changed in how you study since the last review?', 'What are you currently experimenting on?', 'Which old techniques are you still using, and are they still earning their place?'];
/* the Monday of an ISO week key, as a date */
function icsStartOfWeek(weekKey){
  const m = /^(\d{4})-W(\d{2})$/.exec(weekKey); if(!m) return treeToday();
  const jan4 = new Date(Date.UTC(+m[1], 0, 4)), dow = (jan4.getUTCDay() + 6) % 7;
  return new Date(jan4.getTime() + ((+m[2] - 1) * 7 - dow) * 864e5).toISOString().slice(0, 10);
}
function icsWeekRange(weekKey){
  const a = icsStartOfWeek(weekKey), b = treeAddDays(a, 6), A = new Date(a + 'T12:00:00'), B = new Date(b + 'T12:00:00');
  const mon = d => d.toLocaleString('en-GB', {month: 'long'});
  return A.getMonth() === B.getMonth() ? `${A.getDate()}–${B.getDate()} ${mon(B)} ${B.getFullYear()}` : `${A.getDate()} ${mon(A)} – ${B.getDate()} ${mon(B)} ${B.getFullYear()}`;
}
function icsWeekSnapshot(weekKey){
  weekKey = weekKey || icsIsoWeekKey();
  const since = icsStartOfWeek(weekKey), until = treeAddDays(since, 6);
  const rs = (S.treeRetrievals || []).filter(r => r.date >= since && r.date <= until), byMethod = {};
  rs.forEach(r => byMethod[r.method] = (byMethod[r.method] || 0) + 1);
  const qs = (S.treeQuestions || []).filter(q => q.createdAt.slice(0, 10) >= since && q.createdAt.slice(0, 10) <= until);
  return {weekKey, since, until, stored: icsRecentSummaries(1)[0] || null,
    retrievals: {total: rs.length, byMethod, distinctMethods: Object.keys(byMethod).length, meanScore: rs.length ? rs.reduce((a, r) => a + r.score, 0) / rs.length : null},
    retentionByLevel: icsRetention(7), mastery: {distribution: icsMasteryDistribution(), shareAtAim: icsShareAtAim()},
    questions: {created: qs.length, turnedGreen: qs.filter(q => q.status === 'green').length},
    mistakes: {open: icsOpenMistakes().length, patterns: icsRepeatedPatterns()}, gaps: icsGapCountsByType(icsCollectGaps())};
}
/* the honest headline is breadth, not volume: the notes rank good interleaving above accurate spacing */
function icsInterleavingVerdict(snap){
  const n = snap.retrievals.distinctMethods;
  if(!snap.retrievals.total) return 'Nothing retrieved this week.';
  if(n <= 1) return 'One method all week. Vary how you generate, not just what you review.';
  if(n === 2) return 'Two methods. Try a third next week.';
  return n + ' methods. That is interleaving.';
}
function icsWriteJournalEntry(o){
  if(!Array.isArray(S.entries)) return null;
  const e = {id: uid(), type: 'reflection', title: o.title || '', body: o.body || '', occurredAt: o.date || treeToday(), createdAt: treeNow(), media: [],
    links: {stages: [], substages: [], threads: [], values: [], visions: [], skills: [], projects: [], people: []}, people: [], places: [], emotions: [], tags: ['learning'], confidence: '',
    extra: {linkedType: 'treeKolb'}};
  S.entries.push(e); return e.id;
}
/* kept, not edited: a reflection you can revise is a reflection you will revise */
function icsSaveKolb(entry){
  const filled = ICS_KOLB_FIELDS.filter(f => String(entry[f.key] || '').trim());
  if(!filled.length) throw new Error('write something in at least one of the four');
  const rec = {id: uid(), date: treeToday(), weekOf: entry.weekOf || icsIsoWeekKey(), scope: entry.scope === 'system' ? 'system' : 'week', journalRef: null};
  ICS_KOLB_FIELDS.forEach(f => rec[f.key] = String(entry[f.key] || '').trim());
  if(entry.boardId) rec.boardId = entry.boardId;
  rec.journalRef = icsWriteJournalEntry({date: rec.date, title: (rec.scope === 'system' ? 'The learning system, ' : 'Weekly review ') + rec.weekOf, body: ICS_KOLB_FIELDS.map(f => '## ' + f.label + '\n' + (rec[f.key] || '_nothing written_')).join('\n\n')});
  if(!Array.isArray(S.treeKolb)) S.treeKolb = [];
  S.treeKolb.push(Object.freeze(rec)); save();
  return rec;
}
function icsSystemReviewDue(on){
  on = on || treeToday();
  const last = (S.treeKolb || []).filter(k => k.scope === 'system').sort((a, b) => a.date < b.date ? 1 : -1)[0];
  if(!last) return {due: true, lastDate: null};
  const n = icsDaysBetween(last.date, on); return {due: n >= ICS_SYSTEM_REVIEW_DAYS, lastDate: last.date, days: n};
}
function icsWeekRoute(root){
  const snap = icsWeekSnapshot(), due = icsSystemReviewDue(), R = snap.retentionByLevel, lv = Object.keys(R).sort();
  const gapBits = Object.entries(snap.gaps).map(([k, v]) => `${k.replace(/-/g, ' ')} ${v}`).join(', ');
  const kolbs = (S.treeKolb || []).slice().sort((a, b) => a.date < b.date ? 1 : -1);
  const form = (scope, fields) => `<form class="tr-kolb" data-scope="${scope}" onsubmit="return false">${fields.map(f => `<label class="tr-f"><span>${f.label} <small>${esc(f.prompt)}</small></span><textarea class="inp" name="${f.key}" rows="3"></textarea></label>`).join('')}
    <button type="button" class="btn primary" data-act="kolb-save">Save — also written to the Journal</button><p class="faint tr-note">Saved reflections are kept, not edited.</p><p class="tr-err" data-err></p></form>`;
  root.innerHTML = `<div class="page tr-page tr-week-page">${treeNav('week')}
    <header class="tr-head"><h1 class="serif">Week of ${esc(icsWeekRange(snap.weekKey))}</h1><p class="faint">${esc(snap.weekKey)} · <a href="#/tree/metrics">How the learning is going</a></p></header>
    <div class="tr-week-grid">
      <article class="tr-sec"><h3>Retrieval</h3><p class="big">${snap.retrievals.total}</p><p>${snap.retrievals.meanScore == null ? 'no recalls yet' : `mean ${snap.retrievals.meanScore.toFixed(2)} · ${snap.retrievals.distinctMethods} method${snap.retrievals.distinctMethods === 1 ? '' : 's'}`}</p><p class="tr-verdict">${esc(icsInterleavingVerdict(snap))}</p></article>
      <article class="tr-sec"><h3>Recall this week, by the level tested</h3>${lv.length ? `<table>${lv.map(k => `<tr><th>L${k}</th><td>${R[k].n}</td><td>${Math.round(R[k].mean * 100)}%</td></tr>`).join('')}</table><p class="faint tr-hint">Lower at higher levels is normal and expected.</p>` : '<p class="faint">Nothing to show.</p>'}</article>
      <article class="tr-sec"><h3>Mastery</h3><p class="big">${Math.round(snap.mastery.shareAtAim * 100)}%</p><p>of live pages at L4 or above</p></article>
      <article class="tr-sec"><h3>Questions</h3><p>${snap.questions.created} asked · ${snap.questions.turnedGreen} turned green</p></article>
      <article class="tr-sec"><h3>Mistakes</h3><p>${snap.mistakes.open} open</p>${snap.mistakes.patterns.map(p => `<p class="tr-warn">${esc(p.note)} <a href="${treeNode(p.pageId) ? treeUrl(treeNode(p.pageId)) : '#'}">${esc(treeNode(p.pageId) ? treeNode(p.pageId).title : '')}</a></p>`).join('')}</article>
      <article class="tr-sec"><h3>Gaps</h3><p>${Object.values(snap.gaps).reduce((a, b) => a + b, 0)}${gapBits ? ' — ' + esc(gapBits) : ''}</p></article></div>
    ${typeof lsWeekReviewHTML === 'function' ? lsWeekReviewHTML(snap.since, snap.until) : ''}
    <h2>Reflection — Kolb</h2>${form('week', ICS_KOLB_FIELDS)}
    ${due.due ? `<aside class="tr-system-review" data-due="true"><h3>Time to look at the system itself</h3><p>${due.lastDate ? `${due.days} days since the last one.` : 'You have not done this yet.'}</p>
      <ul>${ICS_SYSTEM_REVIEW_PROMPTS.map(x => `<li>${esc(x)}</li>`).join('')}</ul><button type="button" class="btn" data-act="kolb-system">Review the system</button></aside>` : ''}
    ${icsWeeksHistoryHTML()}
    ${kolbs.length ? `<details class="tr-earlier"><summary>Earlier reflections (${kolbs.length})</summary>${kolbs.map(k => `<article class="tr-kolbrec"><b>${esc(k.weekOf)}${k.scope === 'system' ? ' · the system' : ''}</b> <span class="faint">${esc(k.date)}</span>${ICS_KOLB_FIELDS.filter(f => k[f.key]).map(f => `<p><i>${f.label}.</i> ${esc(k[f.key])}</p>`).join('')}</article>`).join('')}</details>` : ''}</div>`;
  treeBindNav(root);
  const save1 = f => { const o = {scope: f.dataset.scope}; ICS_KOLB_FIELDS.forEach(x => o[x.key] = f.elements[x.key].value); try { icsSaveKolb(o); toast('Kept, and written to the Journal.'); icsWeekRoute(root); } catch(e){ f.querySelector('[data-err]').textContent = e.message; } };
  root.querySelectorAll('.tr-kolb [data-act="kolb-save"]').forEach(b => b.onclick = () => save1(b.closest('form')));
  const sys = root.querySelector('[data-act="kolb-system"]');
  if(sys) sys.onclick = () => {
    const m = openModal(`<h2 class="serif">The learning system itself</h2><ul class="faint">${ICS_SYSTEM_REVIEW_PROMPTS.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <form class="tr-kolb" data-scope="system" onsubmit="return false">${ICS_KOLB_FIELDS.map(f => `<label class="tr-f"><span>${f.label}</span><textarea class="inp" name="${f.key}" rows="2"></textarea></label>`).join('')}<p class="tr-err" data-err></p>
      <div class="row" style="justify-content:flex-end;gap:8px"><button type="button" class="btn ghost" data-act="no">Cancel</button><button type="button" class="btn primary" data-act="ok">Save</button></div></form>`);
    const f = m.querySelector('form'); m.querySelector('[data-act="no"]').onclick = () => m.remove();
    m.querySelector('[data-act="ok"]').onclick = () => { const o = {scope: 'system'}; ICS_KOLB_FIELDS.forEach(x => o[x.key] = f.elements[x.key].value); try { icsSaveKolb(o); m.remove(); toast('Kept.'); icsWeekRoute(root); } catch(e){ f.querySelector('[data-err]').textContent = e.message; } };
  };
}
ICS_ROUTES.week = root => icsWeekRoute(root);

/* the Studio's end-of-session reflection lands here: sessions are recorded, so it has somewhere to go */
function lsBridgeEndDialog(boardId){
  const board = lsBoardById(boardId); if(!board) return;
  const s = lsBridgeSession(boardId), out = s ? lsBridgeOutcomes(boardId, s.startedAt) : {chips: 0, groups: 0, questions: 0, grafts: 0, recallResults: 0};
  const m = openModal(`<h2 class="serif">Session summary</h2><p class="faint">${out.chips} chips · ${out.groups} groups · ${out.questions} questions · ${out.grafts} arrows · ${out.recallResults} recalls</p>
    <form class="tr-kolb" onsubmit="return false">${ICS_KOLB_FIELDS.map(f => `<label class="tr-f"><span>${f.label} <small>${esc(f.prompt)}</small></span><textarea class="inp" name="${f.key}" rows="2"></textarea></label>`).join('')}<p class="tr-err" data-err></p>
    <div class="row" style="justify-content:flex-end;gap:8px"><button type="button" class="btn ghost" data-act="no">Close</button><button type="button" class="btn primary" data-act="ok">Save to the Tree’s reflections</button></div></form>`);
  const f = m.querySelector('form'); m.querySelector('[data-act="no"]').onclick = () => m.remove();
  m.querySelector('[data-act="ok"]').onclick = () => { const o = {scope: 'week', boardId}; ICS_KOLB_FIELDS.forEach(x => o[x.key] = f.elements[x.key].value);
    try { const rec = icsSaveKolb(o); if(s){ s.kolbNote = ICS_KOLB_FIELDS.map(x => rec[x.key]).filter(Boolean).join(' / '); save(); } m.remove(); toast('Kept, and written to the Journal.'); } catch(e){ f.querySelector('[data-err]').textContent = e.message; } };
}

/* ============================================================
   N-09  Learning metrics
   ============================================================ */
const ICS_DAY = 864e5, ICS_RETENTION_WINDOW = {min: 5, max: 10}, ICS_MIN_N_FOR_A_CLAIM = 8;
const ICS_EXAMPLE_PROFILE = {1: 0.50, 2: 0.45, 3: 0.30, 4: 0.10};
function icsIsoMs(ms){ return new Date(ms).toISOString().slice(0, 10); }
function icsGapsBetween(level){
  const byPage = new Map();
  (S.treeRetrievals || []).filter(r => r.levelTested === level).sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : (a.at || '') < (b.at || '') ? -1 : 1).forEach(r => (byPage.get(r.pageId) || byPage.set(r.pageId, []).get(r.pageId)).push(r));
  const pts = []; byPage.forEach(rs => { for(let i = 1; i < rs.length; i++) pts.push([icsDaysBetween(rs[i - 1].date, rs[i].date), rs[i].score]); });
  return pts;
}
/* about a week after the previous retrieval of that page: a next-day recall says nothing about a week of decay */
function icsRetentionAtInterval(level, win){
  win = win || ICS_RETENTION_WINDOW;
  const sc = icsGapsBetween(level).filter(p => p[0] >= win.min && p[0] <= win.max).map(p => p[1]);
  return sc.length ? {n: sc.length, mean: sc.reduce((a, b) => a + b, 0) / sc.length} : {n: 0, mean: null};
}
function icsRetentionProfile(){ const o = {}; for(let l = 1; l <= 5; l++) o[l] = icsRetentionAtInterval(l); return o; }
function icsIsReportable(cell){ return !!cell && cell.n >= ICS_MIN_N_FOR_A_CLAIM; }
function icsWeeklySeries(weeks){
  weeks = weeks || 12; const out = [];
  for(let w = weeks - 1; w >= 0; w--){
    const end = Date.now() - w * 7 * ICS_DAY, start = end - 7 * ICS_DAY, rs = (S.treeRetrievals || []).filter(r => r.date > icsIsoMs(start) && r.date <= icsIsoMs(end));
    out.push({weekEnding: icsIsoMs(end), retrievals: rs.length, methods: new Set(rs.map(r => r.method)).size, meanScore: rs.length ? rs.reduce((a, r) => a + r.score, 0) / rs.length : null, atL3Plus: rs.filter(r => r.levelTested >= 3).length});
  }
  return out;
}
/* crude but honest: the slope of score against the gap length; the sample size always travels with it */
function icsDecaySlope(level){
  const pts = icsGapsBetween(level); if(pts.length < 5) return {n: pts.length, slope: null};
  const n = pts.length, sx = pts.reduce((a, p) => a + p[0], 0), sy = pts.reduce((a, p) => a + p[1], 0), sxy = pts.reduce((a, p) => a + p[0] * p[1], 0), sxx = pts.reduce((a, p) => a + p[0] * p[0], 0), den = n * sxx - sx * sx;
  return {n, slope: den === 0 ? null : (n * sxy - sx * sy) / den};
}
function icsTrends(){
  const series = icsWeeklySeries(12), recent = series.slice(-4), earlier = series.slice(0, 4);
  const mean = (arr, k) => { const v = arr.map(x => x[k]).filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const share = arr => { const t = arr.reduce((a, x) => a + x.retrievals, 0), h = arr.reduce((a, x) => a + x.atL3Plus, 0); return t ? h / t : null; };
  const vE = mean(earlier, 'retrievals'), vR = mean(recent, 'retrievals'), sE = mean(earlier, 'meanScore'), sR = mean(recent, 'meanScore');
  const bucket = [vE, vR, sE, sR].some(x => x == null) ? 'not enough data yet' : (vR <= vE && sR >= sE) ? 'encoding is carrying more of the load' : (vR > vE && sR < sE) ? 'more retrieval, worse results — that is the leaky bucket' : 'mixed';
  return {higherOrderRetention: {earlier: sE, recent: sR, shareEarlier: share(earlier), shareRecent: share(recent)}, bucket, volume: {earlier: vE, recent: vR}, interleaving: {earlier: mean(earlier, 'methods'), recent: mean(recent, 'methods')}};
}
function icsSpark(vals, w, h, label){
  const v = vals.map(x => x == null ? null : x), nums = v.filter(x => x != null);
  if(nums.length < 2) return `<svg class="tr-spark2" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}: no data"></svg>`;
  const lo = Math.min(...nums), hi = Math.max(...nums), span = hi - lo || 1, step = w / (v.length - 1);
  const pts = v.map((x, i) => x == null ? null : [i * step, h - 4 - (x - lo) / span * (h - 8)]).filter(Boolean);
  return `<svg class="tr-spark2" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}"><polyline fill="none" stroke="currentColor" stroke-width="1.6" points="${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}"/></svg>`;
}
function icsMetricsRoute(root){
  const prof = icsRetentionProfile(), series = icsWeeklySeries(12), tr = icsTrends();
  const pct = x => x == null ? '—' : Math.round(x * 100) + '%', f2 = x => x == null ? '—' : x.toFixed(2);
  root.innerHTML = `<div class="page tr-page tr-metrics">${treeNav('')}<header class="tr-head"><h1 class="serif">How the learning is going</h1><p class="faint">Every figure is computed from your own retrieval log. Nothing is stored separately, so correcting the log corrects these.</p></header>
    <section class="tr-sec"><div class="tr-sechead"><h2>Retention at about a week, by the level tested</h2></div>
      <table class="tr-wtable"><thead><tr><th>Level</th><th>What it tests</th><th>n</th><th>Retention</th><th>Reference</th></tr></thead><tbody>
      ${ICS_MASTERY.map(x => { const c = prof[x.level], rep = icsIsReportable(c);
        return `<tr><th>L${x.level}</th><td>${esc(x.name)}</td><td>${c.n}</td><td>${rep ? pct(c.mean) : c.n ? '<span class="faint">too few to say</span>' : '<span class="faint">—</span>'}</td><td>${ICS_EXAMPLE_PROFILE[x.level] != null ? pct(ICS_EXAMPLE_PROFILE[x.level]) : '—'}</td></tr>`; }).join('')}</tbody></table>
      <p class="faint tr-hint">The reference column is the figure from your own notes. It is one person’s numbers, not a target. A cell needs ${ICS_MIN_N_FOR_A_CLAIM} observations before it is shown as a figure.</p></section>
    <section class="tr-sec"><div class="tr-sechead"><h2>Twelve weeks</h2></div>
      <div class="tr-sparks"><div><b>Retrievals</b>${icsSpark(series.map(w => w.retrievals), 240, 44, 'Retrievals per week')}</div><div><b>Mean score</b>${icsSpark(series.map(w => w.meanScore), 240, 44, 'Mean score per week')}</div><div><b>Methods used</b>${icsSpark(series.map(w => w.methods), 240, 44, 'Distinct methods per week')}</div></div></section>
    <section class="tr-sec"><div class="tr-sechead"><h2>Is encoding carrying more of the load?</h2></div>
      <p class="big">${esc(tr.bucket.charAt(0).toUpperCase() + tr.bucket.slice(1))}.</p><p>Retrievals per week ${f2(tr.volume.earlier)} → ${f2(tr.volume.recent)}; mean score ${f2(tr.higherOrderRetention.earlier)} → ${f2(tr.higherOrderRetention.recent)}.</p>
      <p class="faint tr-hint">Lots of retrieval without proper encoding is like filling a leaky bucket faster.</p></section>
    <section class="tr-sec"><div class="tr-sechead"><h2>Decay</h2></div><table class="tr-wtable">${[1, 2, 3, 4, 5].map(l => { const d = icsDecaySlope(l); return `<tr><th>L${l}</th><td>n=${d.n}</td><td>${d.slope == null ? '<span class="faint">too few to say</span>' : (d.slope >= 0 ? '+' : '−') + Math.abs(d.slope).toFixed(3) + ' per day'}</td></tr>`; }).join('')}</table></section></div>`;
  treeBindNav(root);
}
ICS_ROUTES.metrics = root => icsMetricsRoute(root);
