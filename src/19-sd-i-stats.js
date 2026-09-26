/* ============================================================
   THE STUDY DECK — statistics, and the tools that shape the workload.

   Stats read the review log and the cards; nothing here writes to the log.
   Every graph has a table beneath it (open the "Numbers" line) and a
   tooltip on hover, so nothing is carried by colour alone.

   The tools move due dates, never history. Each one shows the next month's
   workload before and after, and asks before it touches anything; once
   applied it can be undone, and a line is added to the schedule log.

   The optimiser fits the FSRS weights to your own history by gradient
   descent on the log loss — the same objective Anki's optimiser uses,
   computed here with a small forward pass of the FSRS formulas. It needs a
   few hundred reviews to say anything worth trusting, and it says so.
   ============================================================ */

/* ---------- small things shared by the graphs ---------- */
function sdStatsState(){ const s = sdUi(); s.stats = s.stats || {deck: null, range: 'month'}; return s.stats; }
const SD_RANGES = {month: 30, quarter: 91, year: 365, all: 36500};
function sdScopeIds(deckId){ return deckId ? new Set(sdDeckAndBelow(deckId)) : null; }
function sdInScope(ids, c){ return !ids || (c && ids.has(c.odid || c.deckId)); }
/* the top of an axis: four even, whole-number steps */
function sdNice(max){ const raw = Math.max(1, max) / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
  const c = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(k => k >= m - 1e-9 && Number.isInteger(k * p)) || 10; return Math.max(4, c * p * 4); }
function sdFmt(n){ return n >= 10000 ? Math.round(n / 1000) + 'k' : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(Math.round(n * 10) / 10); }
function sdPct(a, b){ return b ? (a / b * 100).toFixed(1) + '%' : '—'; }

/* A bar chart, stacked when there is more than one series. series: [{name, cls, values}]; labels: one per bar. */
function sdBarChart(opts){
  const {labels, series, title, height = 150, xTick = null, unit = 'cards', cumulative = false} = opts;
  const n = labels.length; if(!n) return `<p class="faint">Nothing to show yet.</p>`;
  const totals = labels.map((_, i) => series.reduce((a, s) => a + (s.values[i] || 0), 0));
  const max = sdNice(Math.max(1, ...totals));
  const W = 600, H = height, L = 34, B = 20, T = 6, pw = W - L - 4, ph = H - B - T;
  const bw = pw / n, gap = n > 60 ? 0.5 : n > 30 ? 1 : 2;
  let bars = '';
  labels.forEach((lab, i) => {
    let y = T + ph, parts = [];
    series.forEach(s => { const v = s.values[i] || 0; if(!v) return; const h = v / max * ph; y -= h;
      parts.push(`<rect class="sx-b ${s.cls}" x="${(L + i * bw + gap / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(0.5, bw - gap).toFixed(1)}" height="${Math.max(0.5, h - (parts.length ? 1 : 0)).toFixed(1)}" rx="${bw > 8 ? 2 : 0}"/>`); });
    const tip = `${lab}: ` + (series.length > 1 ? series.map(s => `${s.name} ${sdFmt(s.values[i] || 0)}`).join(' · ') + ` — ${sdFmt(totals[i])} ${unit}` : `${sdFmt(totals[i])} ${unit}`);
    bars += `<g class="sx-hit" data-tip="${esc(tip)}"><rect x="${L + i * bw}" y="${T}" width="${bw}" height="${ph}" fill="transparent"/>${parts.join('')}</g>`;
  });
  let grid = '';
  for(let k = 0; k <= 4; k++){ const v = max * k / 4, y = T + ph - ph * k / 4;
    grid += `<line class="sx-grid" x1="${L}" x2="${W - 4}" y1="${y}" y2="${y}"/><text class="sx-ax" x="${L - 5}" y="${y + 3}" text-anchor="end">${sdFmt(v)}</text>`; }
  let ticks = '';
  const every = Math.max(1, Math.ceil(n / 8));
  labels.forEach((lab, i) => { if(i % every === 0 || i === n - 1 && n < 16) ticks += `<text class="sx-ax" x="${L + i * bw + bw / 2}" y="${H - 5}" text-anchor="middle">${esc(xTick ? xTick(i, lab) : lab)}</text>`; });
  let line = '';
  if(cumulative){ let run = 0; const sum = totals.reduce((a, b) => a + b, 0) || 1;
    const pts = totals.map((v, i) => { run += v; return `${(L + i * bw + bw / 2).toFixed(1)},${(T + ph - run / sum * ph).toFixed(1)}`; });
    line = `<polyline class="sx-cum" points="${pts.join(' ')}"/>`; }
  const legend = series.length > 1 ? `<div class="sx-legend">${series.map(s => `<span><i class="${s.cls}"></i>${esc(s.name)}</span>`).join('')}</div>` : '';
  const table = `<details class="sx-numbers"><summary>Numbers</summary><div class="sx-tablewrap"><table><thead><tr><th></th>${series.length > 1 ? series.map(s => `<th>${esc(s.name)}</th>`).join('') : ''}<th>Total</th></tr></thead><tbody>
    ${labels.map((lab, i) => totals[i] ? `<tr><td>${esc(lab)}</td>${series.length > 1 ? series.map(s => `<td>${sdFmt(s.values[i] || 0)}</td>`).join('') : ''}<td>${sdFmt(totals[i])}</td></tr>` : '').join('')}</tbody></table></div></details>`;
  return `${legend}<svg class="sx-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title || '')}">${grid}${bars}${line}<line class="sx-base" x1="${L}" x2="${W - 4}" y1="${T + ph}" y2="${T + ph}"/>${ticks}</svg>${table}`;
}
/* a histogram of values into buckets */
function sdHist(vals, edges, fmt){
  const counts = new Array(edges.length - 1).fill(0);
  vals.forEach(v => { for(let i = 0; i < edges.length - 1; i++){ if(v >= edges[i] && (v < edges[i + 1] || i === edges.length - 2)){ counts[i]++; break; } } });
  return {labels: counts.map((_, i) => fmt(edges[i], edges[i + 1])), counts};
}
function sdChartTip(root){
  let tip = root.querySelector('.sx-tip');
  if(!tip){ tip = document.createElement('div'); tip.className = 'sx-tip'; tip.setAttribute('role', 'tooltip'); root.appendChild(tip); }
  root.querySelectorAll('.sx-hit').forEach(g => {
    g.addEventListener('pointerenter', () => { tip.textContent = g.dataset.tip; tip.hidden = false; g.classList.add('on'); });
    g.addEventListener('pointermove', e => { const r = root.getBoundingClientRect(); tip.style.left = Math.min(r.width - tip.offsetWidth - 8, Math.max(8, e.clientX - r.left + 12)) + 'px'; tip.style.top = (e.clientY - r.top - tip.offsetHeight - 10) + 'px'; });
    g.addEventListener('pointerleave', () => { tip.hidden = true; g.classList.remove('on'); });
  });
  tip.hidden = true;
}
function sdCardClass(c){ /* the kinds Anki counts */
  if(c.queue === -1) return 'suspended';
  if(c.queue === -2 || c.queue === -3) return 'buried';
  if(c.type === 0) return 'new';
  if(c.type === 1) return 'learning';
  if(c.type === 3) return 'relearning';
  return c.ivl >= 21 ? 'mature' : 'young';
}

/* ---------- the statistics page ---------- */
function sdStatsRoute(root, params){
  const st = sdStatsState();
  if(params && params[0]) st.deck = params[0] === 'all' ? null : +params[0];
  const ids = sdScopeIds(st.deck), days = SD_RANGES[st.range] || 30, t = sdToday();
  const cards = [...SD.cards.values()].filter(c => sdInScope(ids, c));
  const logs = SD.revlog.filter(r => r.ease > 0 && sdInScope(ids, SD.cards.get(r.cardId)));
  const since = t - days + 1;
  const inRange = logs.filter(r => sdDayOfMs(r.id) >= since);

  /* today */
  const today = logs.filter(r => sdDayOfMs(r.id) === t);
  const tAgain = today.filter(r => r.ease === 1).length, tTime = today.reduce((a, r) => a + (r.time || 0), 0);
  const tMature = today.filter(r => r.type === 1 && r.lastIvl >= 21), tMatureOk = tMature.filter(r => r.ease > 1).length;
  const tBy = [0, 0, 0, 0]; today.forEach(r => tBy[Math.min(3, r.type || 0)]++);
  const todayHTML = today.length ? `Studied <b>${today.length}</b> cards in <b>${Math.max(1, Math.round(tTime / 60000))}</b> minutes today (${(tTime / 1000 / today.length).toFixed(1)}s a card).
    Again pressed ${tAgain} times (${sdPct(tAgain, today.length)}). ${tMature.length ? `Correct on mature cards: ${tMatureOk}/${tMature.length} (${sdPct(tMatureOk, tMature.length)}).` : ''}
    Learn ${tBy[0]} · review ${tBy[1]} · relearn ${tBy[2]} · filtered ${tBy[3]}.` : 'No cards studied today.';

  /* future due */
  const fdays = Math.min(days, 365), fut = {young: new Array(fdays).fill(0), mature: new Array(fdays).fill(0), learn: new Array(fdays).fill(0)};
  let overdue = 0;
  cards.forEach(c => {
    if(c.queue === 2 || c.queue === 3){ const k = c.due - t; if(k < 0) overdue++; const i = Math.max(0, k); if(i < fdays) (c.queue === 3 ? fut.learn : c.ivl >= 21 ? fut.mature : fut.young)[i]++; }
    else if(c.queue === 1 && sdDayOfMs(c.due * 1000) <= t) fut.learn[0]++;
  });
  const futLabels = Array.from({length: fdays}, (_, i) => i === 0 ? 'today' : i === 1 ? 'tomorrow' : `in ${i} days`);
  const futTotal = fut.young.reduce((a, b) => a + b, 0) + fut.mature.reduce((a, b) => a + b, 0) + fut.learn.reduce((a, b) => a + b, 0);

  /* reviews per day */
  const rdays = Math.min(days, Math.max(1, t - (logs.length ? sdDayOfMs(logs[0].id) : t) + 1));
  const rv = {learn: new Array(rdays).fill(0), young: new Array(rdays).fill(0), mature: new Array(rdays).fill(0), relearn: new Array(rdays).fill(0), filtered: new Array(rdays).fill(0)};
  const rt = new Array(rdays).fill(0);
  logs.forEach(r => { const i = sdDayOfMs(r.id) - (t - rdays + 1); if(i < 0 || i >= rdays) return;
    const k = r.type === 0 ? 'learn' : r.type === 2 ? 'relearn' : r.type === 3 ? 'filtered' : r.lastIvl >= 21 ? 'mature' : 'young'; rv[k][i]++; rt[i] += (r.time || 0) / 60000; });
  const rLabels = Array.from({length: rdays}, (_, i) => sdDayISO(t - rdays + 1 + i));
  const studiedDays = rt.filter(x => x > 0).length, totalRev = inRange.length;

  /* card counts */
  const kinds = {new: 0, learning: 0, relearning: 0, young: 0, mature: 0, suspended: 0, buried: 0};
  cards.forEach(c => kinds[sdCardClass(c)]++);

  /* intervals, ease / difficulty, stability, retrievability */
  const rev = cards.filter(c => c.type === 2 && c.queue !== -1);
  const ivls = rev.map(c => c.ivl);
  const ivlMax = Math.max(1, ...ivls, 1);
  const ivlEdges = ivlMax <= 31 ? Array.from({length: Math.min(32, ivlMax + 2)}, (_, i) => i) : [0, 1, 2, 3, 5, 7, 10, 14, 21, 30, 45, 60, 90, 120, 180, 270, 365, 540, 730, 1095, Math.max(1096, ivlMax + 1)];
  const ivlH = sdHist(ivls, ivlEdges, (a, b) => b - a === 1 ? `${a}d` : `${a}–${b - 1}d`);
  const withMem = rev.filter(c => c.memory);
  const diffH = sdHist(withMem.map(c => (c.memory.d - 1) / 9 * 100), [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100.01], (a, b) => `${a}–${Math.round(b)}%`);
  const easeH = sdHist(rev.filter(c => !c.memory).map(c => (c.factor || 2500) / 10), [130, 150, 170, 190, 210, 230, 250, 270, 290, 310, 400], (a, b) => `${a}–${b}%`);
  const stabH = sdHist(withMem.map(c => c.memory.s), [0, 1, 2, 4, 7, 14, 30, 60, 90, 180, 365, 730, 1e9], (a, b) => b > 1e8 ? `${a}d+` : `${a}–${b}d`);
  const rets = withMem.map(sdRetrievability).filter(x => x != null);
  const retH = sdHist(rets.map(x => x * 100), [0, 50, 60, 70, 75, 80, 85, 90, 95, 100.01], (a, b) => `${a}–${Math.round(b)}%`);
  const avgR = rets.length ? rets.reduce((a, b) => a + b, 0) / rets.length : null;

  /* hourly */
  const hours = new Array(24).fill(0), hoursOk = new Array(24).fill(0);
  inRange.forEach(r => { const h = new Date(r.id).getHours(); hours[h]++; if(r.ease > 1) hoursOk[h]++; });

  /* answer buttons */
  const btn = {learning: [0, 0, 0, 0], young: [0, 0, 0, 0], mature: [0, 0, 0, 0]};
  inRange.forEach(r => { const k = r.type === 0 || r.type === 2 ? 'learning' : r.lastIvl >= 21 ? 'mature' : 'young'; btn[k][r.ease - 1]++; });

  /* added */
  const added = new Array(Math.min(days, 365)).fill(0);
  cards.forEach(c => { const i = sdDayOfMs(c.id) - (t - added.length + 1); if(i >= 0 && i < added.length) added[i]++; });
  const addLabels = added.map((_, i) => sdDayISO(t - added.length + 1 + i));

  const deckOpts = `<option value="all">The whole collection</option>` + sdDecks().map(d => `<option value="${d.id}" ${st.deck === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('');
  const rangeOpts = [['month', '1 month'], ['quarter', '3 months'], ['year', '1 year'], ['all', 'All time']].map(([k, n]) => `<button class="${st.range === k ? 'on' : ''}" data-sxrange="${k}">${n}</button>`).join('');
  const sect = (title, body, note) => `<section class="sx-stat"><h2>${title}</h2>${note ? `<p class="faint">${note}</p>` : ''}${body}</section>`;
  const btnTable = `<table class="sx-btns"><thead><tr><th></th><th>Again</th><th>Hard</th><th>Good</th><th>Easy</th><th>Correct</th></tr></thead><tbody>${Object.entries(btn).map(([k, a]) => {
    const n = a.reduce((x, y) => x + y, 0); return `<tr><td>${k}</td>${a.map(v => `<td>${v}<span class="faint"> ${n ? Math.round(v / n * 100) + '%' : ''}</span></td>`).join('')}<td>${sdPct(n - a[0], n)}</td></tr>`; }).join('')}</tbody></table>`;

  root.innerHTML = `<div class="page sx-page sx-statspage">
    ${sdNav('stats')}
    <header class="sx-head"><h1 class="serif">Statistics</h1>
      <div class="sx-filters"><select id="sxStDeck" aria-label="Deck">${deckOpts}</select><div class="sx-seg" role="group" aria-label="Period">${rangeOpts}</div></div></header>
    ${sect('Today', `<p class="sx-today">${todayHTML}</p>`)}
    ${sect('Every day', sdHeatmapHTML(st.deck, st.range === 'month' ? 26 : 52))}
    ${sect('Future due', sdBarChart({labels: futLabels, series: [{name: 'Learning', cls: 'learn', values: fut.learn}, {name: 'Young', cls: 'young', values: fut.young}, {name: 'Mature', cls: 'mature', values: fut.mature}], title: 'Cards due in the days ahead', cumulative: true}),
      `${futTotal} due in the period · ${fut.young[1] + fut.mature[1] + fut.learn[1]} tomorrow · ${Math.round(futTotal / fdays)} a day on average${overdue ? ` · ${overdue} overdue` : ''}`)}
    ${sect('Reviews', sdBarChart({labels: rLabels, series: [{name: 'Learn', cls: 'learn', values: rv.learn}, {name: 'Young', cls: 'young', values: rv.young}, {name: 'Mature', cls: 'mature', values: rv.mature}, {name: 'Relearn', cls: 'relearn', values: rv.relearn}, {name: 'Filtered', cls: 'filtered', values: rv.filtered}], title: 'Reviews per day', unit: 'reviews'}),
      `Days studied: ${studiedDays} of ${rdays} (${sdPct(studiedDays, rdays)}) · ${totalRev} reviews · ${studiedDays ? Math.round(totalRev / studiedDays) : 0} on days studied · ${Math.round(rt.reduce((a, b) => a + b, 0))} minutes in all`)}
    ${sect('Card counts', `<div class="sx-counts">${Object.entries(kinds).map(([k, v]) => `<div class="sx-count ${k}"><b>${v.toLocaleString()}</b><span>${k}</span><span class="faint">${sdPct(v, cards.length)}</span></div>`).join('')}</div>`, `${cards.length.toLocaleString()} cards`)}
    ${sect('Intervals', sdBarChart({labels: ivlH.labels, series: [{name: 'Cards', cls: 'young', values: ivlH.counts}], title: 'Review intervals', cumulative: true}), ivls.length ? `Average interval ${Math.round(ivls.reduce((a, b) => a + b, 0) / ivls.length)} days · longest ${ivlMax} days` : '')}
    ${withMem.length ? sect('Difficulty', sdBarChart({labels: diffH.labels, series: [{name: 'Cards', cls: 'relearn', values: diffH.counts}], title: 'Card difficulty'}), `Average ${(withMem.reduce((a, c) => a + (c.memory.d - 1) / 9, 0) / withMem.length * 100).toFixed(0)}%`) : ''}
    ${easeH.counts.some(Boolean) ? sect('Ease', sdBarChart({labels: easeH.labels, series: [{name: 'Cards', cls: 'relearn', values: easeH.counts}], title: 'Card ease (SM-2)'})) : ''}
    ${withMem.length ? sect('Stability', sdBarChart({labels: stabH.labels, series: [{name: 'Cards', cls: 'mature', values: stabH.counts}], title: 'Card stability', cumulative: true}), 'How long each card should stay above 90% recall.') : ''}
    ${rets.length ? sect('Retrievability', sdBarChart({labels: retH.labels, series: [{name: 'Cards', cls: 'young', values: retH.counts}], title: 'Chance of recall now'}), `Average ${(avgR * 100).toFixed(1)}% · about ${Math.round(avgR * rets.length)} of ${rets.length} cards would be remembered today`) : ''}
    ${sect('True retention', sdTrueRetentionHTML(logs), 'Passed reviews over all reviews of cards that had graduated, by how long they had been known.')}
    ${sect('Hours', sdBarChart({labels: hours.map((_, h) => `${h}:00`), series: [{name: 'Correct', cls: 'young', values: hoursOk}, {name: 'Again', cls: 'relearn', values: hours.map((v, h) => v - hoursOk[h])}], title: 'Reviews by hour', unit: 'reviews'}),
      (() => { const best = hours.map((v, h) => [v >= 20 ? hoursOk[h] / v : -1, h]).sort((a, b) => b[0] - a[0])[0]; return best && best[0] > 0 ? `You answer best around ${best[1]}:00 (${(best[0] * 100).toFixed(0)}% correct).` : ''; })())}
    ${sect('Answer buttons', btnTable)}
    ${sect('Added', sdBarChart({labels: addLabels, series: [{name: 'Cards', cls: 'new', values: added}], title: 'Cards added per day', cumulative: true}), `${added.reduce((a, b) => a + b, 0)} added in the period`)}
  </div>`;
  root.querySelector('#sxStDeck').value = st.deck ? String(st.deck) : 'all';
  root.querySelector('#sxStDeck').onchange = e => { st.deck = e.target.value === 'all' ? null : +e.target.value; sdStatsRoute(root); };
  root.querySelectorAll('[data-sxrange]').forEach(b => b.onclick = () => { st.range = b.dataset.sxrange; sdStatsRoute(root); });
  sdBindHeat(root);
  sdChartTip(root.querySelector('.sx-statspage'));
}
function sdTrueRetentionHTML(logs){
  const t = sdToday();
  const periods = [['Today', 0], ['Yesterday', 1], ['Last week', 7], ['Last month', 30], ['Last year', 365], ['All time', 1e6]];
  const rows = periods.map(([name, back]) => {
    const from = back === 1 ? t - 1 : t - back, to = back === 1 ? t - 1 : t;
    let yP = 0, yF = 0, mP = 0, mF = 0;
    logs.forEach(r => { if(r.type !== 1) return; const d = sdDayOfMs(r.id); if(d < from || d > to) return;
      const ok = r.ease > 1; if(r.lastIvl >= 21){ ok ? mP++ : mF++; } else { ok ? yP++ : yF++; } });
    return `<tr><td>${name}</td><td>${yP}</td><td>${yF}</td><td>${sdPct(yP, yP + yF)}</td><td>${mP}</td><td>${mF}</td><td>${sdPct(mP, mP + mF)}</td><td><b>${sdPct(yP + mP, yP + yF + mP + mF)}</b></td></tr>`;
  });
  return `<div class="sx-tablewrap"><table class="sx-ret"><thead><tr><th></th><th colspan="3">Young</th><th colspan="3">Mature</th><th>All</th></tr>
    <tr><th></th><th>Pass</th><th>Fail</th><th>Retention</th><th>Pass</th><th>Fail</th><th>Retention</th><th>Retention</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

/* ============================================================
   FSRS, by hand — enough of the formulas to fit the weights.
   ============================================================ */
function sdFsrsMath(w){
  const decay = w.length > 20 ? -w[20] : -0.5, factor = Math.pow(0.9, 1 / decay) - 1;
  const clampD = d => Math.min(10, Math.max(1, d));
  const d0 = g => clampD(w[4] - Math.exp(w[5] * (g - 1)) + 1);
  return {
    decay, factor,
    R: (t, s) => Math.pow(1 + factor * t / s, decay),
    init: g => ({s: Math.max(0.01, w[g - 1]), d: d0(g)}),
    ivl: (s, r) => s / factor * (Math.pow(r, 1 / decay) - 1),
    step(m, g, t){
      const r = Math.pow(1 + factor * t / m.s, decay);
      let s;
      if(t < 1){ /* same day */
        const inc = Math.exp(w[17] * (g - 3 + w[18])) * Math.pow(m.s, -(w[19] || 0));
        s = m.s * (g >= 3 ? Math.max(1, inc) : inc);
      } else if(g === 1){
        const f = w[11] * Math.pow(m.d, -w[12]) * (Math.pow(m.s + 1, w[13]) - 1) * Math.exp(w[14] * (1 - r));
        s = Math.min(f, m.s / Math.exp(w[17] * w[18]));
      } else {
        s = m.s * (Math.exp(w[8]) * (11 - m.d) * Math.pow(m.s, -w[9]) * (Math.exp(w[10] * (1 - r)) - 1) * (g === 2 ? w[15] : 1) * (g === 4 ? w[16] : 1) + 1);
      }
      const dd = -w[6] * (g - 3), dp = m.d + dd * (10 - m.d) / 9;
      const d = clampD(w[7] * d0(4) + (1 - w[7]) * dp);
      return {s: Math.min(36500, Math.max(0.01, s)), d};
    }
  };
}
/* the histories the optimiser learns from: per card, the day and grade of each review */
function sdTrainingSet(presetId, hardAsAgain){
  const byCard = new Map();
  SD.revlog.forEach(r => { if(r.ease < 1 || r.type === 3 && !r.ivl) return;
    const c = SD.cards.get(r.cardId); if(!c) return;
    if(presetId != null && sdDeckPreset(c.odid || c.deckId).id !== presetId) return;
    (byCard.get(r.cardId) || byCard.set(r.cardId, []).get(r.cardId)).push(r); });
  const out = [];
  byCard.forEach(list => {
    list.sort((a, b) => a.id - b.id);
    if(list[0].type !== 0) return; /* the start of its life is missing */
    out.push(list.map(r => ({day: sdDayOfMs(r.id), g: hardAsAgain && r.ease === 2 ? 1 : r.ease})));
  });
  return out;
}
function sdFsrsLoss(w, set){
  const F = sdFsrsMath(w); let loss = 0, n = 0;
  for(const h of set){
    let m = F.init(h[0].g), last = h[0].day;
    for(let i = 1; i < h.length; i++){
      const t = h[i].day - last;
      if(t > 0){ const p = Math.min(0.9999, Math.max(0.0001, F.R(t, m.s))), y = h[i].g > 1 ? 1 : 0;
        loss -= y * Math.log(p) + (1 - y) * Math.log(1 - p); n++; }
      m = F.step(m, h[i].g, t); last = h[i].day;
    }
  }
  return n ? loss / n : 0;
}
const SD_W_BOUNDS = [[0.001, 100], [0.001, 100], [0.001, 100], [0.001, 100], [1, 10], [0.001, 4], [0.001, 4], [0.001, 0.75], [0, 4.5], [0, 0.8], [0.001, 3.5],
  [0.001, 5], [0.001, 0.25], [0.001, 0.9], [0, 4], [0, 1], [1, 6], [0, 2], [0, 2], [0, 0.8], [0.1, 0.8]];
async function sdOptimise(preset, say){
  say = say || (() => {});
  const L = sdFsrsLib(); if(!L) throw new Error('The scheduler library did not load.');
  const set = sdTrainingSet(preset ? preset.id : null, false);
  const reviews = set.reduce((a, h) => a + h.length - 1, 0);
  if(reviews < 400) throw new Error(`Only ${reviews} reviews with a known start — the optimiser needs about 400 before its answer means anything. The defaults are sensible until then.`);
  /* a sample keeps each step quick on big collections */
  const sample = set.length > 4000 ? set.filter((_, i) => i % Math.ceil(set.length / 4000) === 0) : set;
  let w = (Array.isArray(preset && preset.weights) && preset.weights.length >= 17 ? preset.weights : L.default_w).slice();
  const clamp = v => v.map((x, i) => SD_W_BOUNDS[i] ? Math.min(SD_W_BOUNDS[i][1], Math.max(SD_W_BOUNDS[i][0], x)) : x);
  w = clamp(w);
  const start = sdFsrsLoss(w, sample);
  const mA = new Array(w.length).fill(0), vA = new Array(w.length).fill(0), lr = 0.02, b1 = 0.9, b2 = 0.999;
  let best = w.slice(), bestLoss = start;
  const steps = 80;
  for(let it = 1; it <= steps; it++){
    const base = sdFsrsLoss(w, sample), g = new Array(w.length).fill(0);
    for(let i = 0; i < w.length; i++){
      const h = Math.max(1e-4, Math.abs(w[i]) * 1e-3), w2 = w.slice(); w2[i] += h;
      g[i] = (sdFsrsLoss(w2, sample) - base) / h;
    }
    for(let i = 0; i < w.length; i++){
      const scale = SD_W_BOUNDS[i] ? SD_W_BOUNDS[i][1] - SD_W_BOUNDS[i][0] : 1, gi = g[i] * Math.min(10, scale);
      mA[i] = b1 * mA[i] + (1 - b1) * gi; vA[i] = b2 * vA[i] + (1 - b2) * gi * gi;
      const mh = mA[i] / (1 - Math.pow(b1, it)), vh = vA[i] / (1 - Math.pow(b2, it));
      w[i] -= lr * Math.min(10, scale) * mh / (Math.sqrt(vh) + 1e-8) * 0.1;
    }
    w = clamp(w);
    const now = sdFsrsLoss(w, sample);
    if(now < bestLoss){ bestLoss = now; best = w.slice(); }
    if(it % 4 === 0){ say(`Fitting to ${reviews.toLocaleString()} reviews… ${Math.round(it / steps * 100)}% · log loss ${bestLoss.toFixed(4)} (was ${start.toFixed(4)})`); await new Promise(r => setTimeout(r, 0)); }
  }
  say(`Log loss ${start.toFixed(4)} → ${bestLoss.toFixed(4)} on ${reviews.toLocaleString()} reviews.`);
  return bestLoss < start ? best : null;
}
/* how well a set of weights predicts your own answers: log loss and RMSE by bins */
function sdEvaluate(w, set){
  const F = sdFsrsMath(w), bins = new Map(); let loss = 0, n = 0;
  for(const h of set){ let m = F.init(h[0].g), last = h[0].day;
    for(let i = 1; i < h.length; i++){ const t = h[i].day - last;
      if(t > 0){ const p = Math.min(0.9999, Math.max(0.0001, F.R(t, m.s))), y = h[i].g > 1 ? 1 : 0; loss -= y * Math.log(p) + (1 - y) * Math.log(1 - p); n++;
        const k = Math.round(p * 20); const b = bins.get(k) || {p: 0, y: 0, n: 0}; b.p += p; b.y += y; b.n++; bins.set(k, b); }
      m = F.step(m, h[i].g, t); last = h[i].day; } }
  let se = 0; bins.forEach(b => { se += b.n * Math.pow(b.p / b.n - b.y / b.n, 2); });
  return {logLoss: n ? loss / n : 0, rmse: n ? Math.sqrt(se / n) : 0, n};
}

/* ---------- rescheduling from the memory model ---------- */
async function sdRescheduleAll(presetId, opts){
  opts = opts || {};
  await sdRebuildMemory(null, presetId);
  const t = sdToday(), moved = [];
  SD.cards.forEach(c => {
    if(c.type !== 2 || !c.memory || c.queue === -1) return;
    const p = sdDeckPreset(c.odid || c.deckId); if(presetId != null && p.id !== presetId) return;
    if(p.algorithm !== 'fsrs') return;
    const F = sdFsrsMath(sdPresetWeights(p));
    const ivl = Math.min(p.maxIvl || 36500, Math.max(1, Math.round(F.ivl(c.memory.s, p.desiredRetention || 0.9))));
    const lastDay = c.lastReview ? sdDayOfMs(c.lastReview) : t - c.ivl;
    const due = Math.max(t, lastDay + ivl);
    if(due !== c.due || ivl !== c.ivl) moved.push([c, ivl, due]);
  });
  if(!moved.length) return 0;
  if(!opts.noUndo) sdPushUndo('reschedule', moved.map(m => m[0]));
  moved.forEach(([c, ivl, due]) => { if(c.odid) c.odue = due; else c.due = due; c.ivl = ivl; c.mod = Date.now(); sdTouch('cards', c); });
  sdScheduleLog('Rescheduled from memory', moved.length, {presetId});
  sdSummarise();
  return moved.length;
}
/* siblings due on the same day are spread apart, within a small share of their interval */
function sdDisperseSiblings(noteIds, quiet){
  const notes = noteIds ? noteIds : [...SD.byNote.keys()];
  const changed = [];
  const t = sdToday();
  notes.forEach(nid => {
    const sibs = sdCardsOf(nid).filter(c => c.queue === 2 && c.type === 2);
    if(sibs.length < 2) return;
    const taken = new Set();
    sibs.sort((a, b) => a.due - b.due).forEach(c => {
      if(!taken.has(c.due)){ taken.add(c.due); return; }
      const room = Math.max(1, Math.round(c.ivl * 0.1));
      for(let k = 1; k <= room; k++){
        for(const d of [c.due + k, c.due - k]){ if(d > t && !taken.has(d)){ changed.push([c, c.due, d]); taken.add(d); return; } }
      }
      taken.add(c.due);
    });
  });
  if(!changed.length){ if(!quiet) toast('No siblings needed spreading.'); return 0; }
  sdPushUndo('disperse siblings', changed.map(x => x[0]));
  changed.forEach(([c, , d]) => { c.due = d; c.mod = Date.now(); sdTouch('cards', c); });
  if(!quiet){ sdScheduleLog('Dispersed siblings', changed.length, {}); toast(`Spread ${changed.length} sibling card${changed.length === 1 ? '' : 's'} apart.`); }
  return changed.length;
}
function sdScheduleLog(tool, n, params){
  const l = sdMisc('scheduleLog', () => ({runs: []}));
  l.runs.push({at: Date.now(), tool, n, params: params || {}});   /* add-only */
  sdTouch('misc', l);
}

/* ============================================================
   THE WORKLOAD TOOLS. Each makes a plan (card → new due day) from the
   cards in scope; the page shows the plan's effect before anything moves.
   ============================================================ */
function sdToolCards(deckId){ const ids = sdScopeIds(deckId); return [...SD.cards.values()].filter(c => sdInScope(ids, c) && c.queue === 2 && c.type === 2); }
function sdOverdueness(c){ /* how far past its best day a card is, relative to its interval */ return (sdToday() - c.due) / Math.max(1, c.ivl); }
function sdLoadMap(cards, plan){ const m = new Map(); cards.forEach(c => { const d = plan && plan.has(c.id) ? plan.get(c.id) : c.due; m.set(d, (m.get(d) || 0) + 1); }); return m; }
const SD_TOOLS = {
  postpone: {name: 'Postpone', blurb: 'Too much due today? Move some of it later — the cards that can best afford to wait (long intervals, not yet overdue) go first.',
    form: () => `<label>Cards to postpone <input class="inp" type="number" name="n" value="50" min="1"></label><label>By up to <input class="inp" type="number" name="days" value="7" min="1"> days</label>`,
    plan(cards, f){ const t = sdToday(); const due = cards.filter(c => c.due <= t).sort((a, b) => sdOverdueness(a) - sdOverdueness(b) || b.ivl - a.ivl);
      const plan = new Map(); due.slice(0, +f.n || 0).forEach(c => plan.set(c.id, t + Math.max(1, Math.min(+f.days || 7, Math.round(c.ivl * 0.1) || 1)))); return plan; }},
  advance: {name: 'Advance', blurb: 'A light day ahead? Bring cards forward — the ones whose recall will barely change from seeing them early.',
    form: () => `<label>Cards to bring forward <input class="inp" type="number" name="n" value="30" min="1"></label><label>From the next <input class="inp" type="number" name="days" value="14" min="1"> days</label>`,
    plan(cards, f){ const t = sdToday(); const soon = cards.filter(c => c.due > t && c.due <= t + (+f.days || 14)).sort((a, b) => (b.ivl - (b.due - t)) / b.ivl - (a.ivl - (a.due - t)) / a.ivl || b.ivl - a.ivl);
      const plan = new Map(); soon.slice(0, +f.n || 0).forEach(c => plan.set(c.id, t)); return plan; }},
  flatten: {name: 'Flatten', blurb: 'Cap the reviews on any one day. The extra cards move to the next day with room, but never later than a tenth of their interval.',
    form: () => `<label>At most <input class="inp" type="number" name="cap" value="150" min="1"> reviews a day</label><label>Over the next <input class="inp" type="number" name="days" value="30" min="1"> days</label>`,
    plan(cards, f){ const t = sdToday(), cap = +f.cap || 150, span = +f.days || 30, plan = new Map(), load = new Map();
      const at = c => plan.has(c.id) ? plan.get(c.id) : Math.max(t, c.due);   /* overdue cards count as today's */
      cards.forEach(c => load.set(at(c), (load.get(at(c)) || 0) + 1));
      for(let d = t; d < t + span; d++){
        const extra = (load.get(d) || 0) - cap; if(extra <= 0) continue;
        /* the shortest intervals stay (a delay costs them most); the longest move, the least flexible of those first */
        const here = cards.filter(c => at(c) === d).sort((a, b) => a.ivl - b.ivl), movers = here.slice(here.length - extra);
        for(const c of movers){ const last = Math.max(t, c.due) + Math.max(1, Math.round(c.ivl * 0.1));
          for(let nd = d + 1; nd <= last; nd++){ if((load.get(nd) || 0) < cap){ plan.set(c.id, nd); load.set(nd, (load.get(nd) || 0) + 1); load.set(d, load.get(d) - 1); break; } } }
      } return plan; }},
  balance: {name: 'Load balance', blurb: 'Even out the next weeks: every card may move a little either way (about 5% of its interval) to a quieter day.',
    form: () => `<label>Over the next <input class="inp" type="number" name="days" value="30" min="1"> days</label>`,
    plan(cards, f){ const t = sdToday(), span = +f.days || 30, plan = new Map(), load = sdLoadMap(cards);
      cards.filter(c => c.due > t && c.due < t + span).sort((a, b) => a.ivl - b.ivl).forEach(c => {
        const r = Math.max(1, Math.round(c.ivl * 0.05)); let best = c.due, bl = load.get(c.due) || 0;
        for(let d = Math.max(t + 1, c.due - r); d <= c.due + r; d++){ const l = (load.get(d) || 0) + (d === c.due ? -1 : 0); if(l < bl - 0.5){ bl = l; best = d; } }
        if(best !== c.due){ plan.set(c.id, best); load.set(c.due, load.get(c.due) - 1); load.set(best, (load.get(best) || 0) + 1); } }); return plan; }},
  easydays: {name: 'Easy days', blurb: 'Lighter weekdays. Say how much of a normal load each day should carry; cards move off the light days to a neighbour within their fuzz.',
    form: p => { const w = (p && p.easyDays) || [1, 1, 1, 1, 1, 1, 1];
      return `<div class="sx-week">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((n, i) => `<label>${n}<select name="d${i}">${[[1, 'Normal'], [0.5, 'Reduced'], [0, 'Minimum']].map(([v, l]) => `<option value="${v}" ${w[i] === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`).join('')}</div>`; },
    plan(cards, f){ const t = sdToday(), plan = new Map(), wt = d => +f['d' + ((sdDayToDate(d).getDay() + 6) % 7)];
      const load = sdLoadMap(cards);
      const avg = Math.max(1, cards.filter(c => c.due >= t && c.due < t + 30).length / 30);
      cards.filter(c => c.due > t && c.due < t + 60).sort((a, b) => b.ivl - a.ivl).forEach(c => {
        const w = wt(c.due); if(w >= 1 || (load.get(c.due) || 0) <= avg * w) return;
        const r = Math.max(1, Math.round(c.ivl * 0.07)); let best = null, bs = Infinity;
        for(let d = Math.max(t + 1, c.due - r); d <= c.due + r; d++){ if(d === c.due) continue; const wd = wt(d); if(wd <= w) continue; const s = (load.get(d) || 0) / Math.max(0.01, wd); if(s < bs){ bs = s; best = d; } }
        if(best != null){ plan.set(c.id, best); load.set(c.due, load.get(c.due) - 1); load.set(best, (load.get(best) || 0) + 1); } }); return plan; },
    after(f, deckId){ /* the weekday weights are also saved to the deck's preset, so new answers respect them */
      const p = sdDeckPreset(deckId || sdSettings().lastDeck || 1); p.easyDays = [0, 1, 2, 3, 4, 5, 6].map(i => +f['d' + i]); p.mod = Date.now(); sdTouch('presets', p); }},
  holiday: {name: 'Schedule a break', blurb: 'Going away? Cards due during the break are seen before you leave if they are nearly due anyway, and spread over the days after you return otherwise.',
    form: () => { const t = sdToday(); return `<label>From <input class="inp" type="date" name="from" value="${sdDayISO(t + 7)}"></label><label>To <input class="inp" type="date" name="to" value="${sdDayISO(t + 13)}"></label>
      <label>Spread the return over <input class="inp" type="number" name="spread" value="5" min="1"> days</label>`; },
    plan(cards, f){ const t = sdToday(), day = iso => { const [y, m, d] = iso.split('-').map(Number); return sdDayOfMs(new Date(y, m - 1, d, 12).getTime()); };
      const a = day(f.from), b = day(f.to); if(!(b >= a)) return new Map();
      const plan = new Map(), spread = Math.max(1, +f.spread || 5), load = sdLoadMap(cards);
      cards.filter(c => c.due >= a && c.due <= b).sort((x, y) => x.due - y.due).forEach(c => {
        const early = c.due - Math.max(1, Math.round(c.ivl * 0.15));
        if(early < a && a - 1 >= t){ plan.set(c.id, Math.max(t, Math.min(a - 1, early > t ? a - 1 : t))); return; }
        let best = b + 1, bl = Infinity; for(let d = b + 1; d <= b + spread; d++){ const l = load.get(d) || 0; if(l < bl){ bl = l; best = d; } }
        plan.set(c.id, best); load.set(best, (load.get(best) || 0) + 1); }); return plan; }},
  siblings: {name: 'Disperse siblings', blurb: 'Cards from the same note that fall on the same day remind each other. Spread them apart, by at most a tenth of their interval.',
    form: () => `<label class="sx-check"><input type="checkbox" name="auto" ${sdSettings().autoDisperse ? 'checked' : ''}> Also do this after every answer</label>`,
    plan(cards){ const t = sdToday(), plan = new Map(), byNote = new Map();
      cards.forEach(c => (byNote.get(c.noteId) || byNote.set(c.noteId, []).get(c.noteId)).push(c));
      byNote.forEach(sibs => { if(sibs.length < 2) return; const taken = new Set();
        sibs.sort((a, b) => a.due - b.due).forEach(c => { if(!taken.has(c.due)){ taken.add(c.due); return; }
          const room = Math.max(1, Math.round(c.ivl * 0.1));
          for(let k = 1; k <= room; k++) for(const d of [c.due + k, c.due - k]) if(d > t && !taken.has(d)){ plan.set(c.id, d); taken.add(d); return; } }); });
      return plan; },
    after(f){ const s = sdSettings(); s.autoDisperse = !!f.auto; sdTouch('misc', s); }}
};
function sdToolForm(el){ const f = {}; el.querySelectorAll('input,select').forEach(i => { if(!i.name) return; f[i.name] = i.type === 'checkbox' ? i.checked : i.value; }); return f; }
function sdPlanChart(cards, plan, span){
  const t = sdToday(), before = new Array(span).fill(0), after = new Array(span).fill(0);
  cards.forEach(c => { const a = Math.max(0, c.due - t), b = Math.max(0, (plan.has(c.id) ? plan.get(c.id) : c.due) - t); if(a < span) before[a]++; if(b < span) after[b]++; });
  const W = 600, H = 130, L = 34, T = 6, B = 20, ph = H - T - B, pw = W - L - 4, max = sdNice(Math.max(1, ...before, ...after)), bw = pw / span;
  const pts = arr => arr.map((v, i) => `${(L + i * bw + bw / 2).toFixed(1)},${(T + ph - v / max * ph).toFixed(1)}`).join(' ');
  let grid = ''; for(let k = 0; k <= 4; k++){ const y = T + ph - ph * k / 4; grid += `<line class="sx-grid" x1="${L}" x2="${W - 4}" y1="${y}" y2="${y}"/><text class="sx-ax" x="${L - 5}" y="${y + 3}" text-anchor="end">${sdFmt(max * k / 4)}</text>`; }
  let hits = ''; for(let i = 0; i < span; i++) hits += `<g class="sx-hit" data-tip="${esc(`${sdDayISO(t + i)}: ${before[i]} now → ${after[i]} after`)}"><rect x="${L + i * bw}" y="${T}" width="${bw}" height="${ph}" fill="transparent"/></g>`;
  const ticks = [0, Math.floor(span / 4), Math.floor(span / 2), Math.floor(3 * span / 4), span - 1].map(i => `<text class="sx-ax" x="${L + i * bw + bw / 2}" y="${H - 5}" text-anchor="middle">${i === 0 ? 'today' : '+' + i + 'd'}</text>`).join('');
  const sd = a => { const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((x, y) => x + (y - m) * (y - m), 0) / a.length); };
  return `<div class="sx-legend"><span><i class="before"></i>Now</span><span><i class="after"></i>After</span></div>
    <svg class="sx-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Reviews per day before and after">${grid}<polyline class="sx-line before" points="${pts(before)}"/><polyline class="sx-line after" points="${pts(after)}"/>${hits}<line class="sx-base" x1="${L}" x2="${W - 4}" y1="${T + ph}" y2="${T + ph}"/>${ticks}</svg>
    <p class="faint">Busiest day ${Math.max(...before)} → ${Math.max(...after)} · today ${before[0]} → ${after[0]} · day-to-day spread ${sd(before).toFixed(1)} → ${sd(after).toFixed(1)}</p>`;
}

/* ---------- the tools page ---------- */
function sdToolsRoute(root){
  const ui = sdUi(); ui.tools = ui.tools || {deck: null};
  const deckOpts = `<option value="all">The whole collection</option>` + sdDecks().filter(d => !d.isFiltered).map(d => `<option value="${d.id}" ${ui.tools.deck === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('');
  const presets = [...SD.presets.values()];
  const log = sdMisc('scheduleLog', () => ({runs: []})).runs.slice(-8).reverse();
  const preset = ui.tools.deck ? sdDeckPreset(ui.tools.deck) : sdPreset(1);
  root.innerHTML = `<div class="page sx-page sx-toolspage">
    ${sdNav('tools')}
    <header class="sx-head"><h1 class="serif">Tools</h1><p class="sx-sub">Shape the days ahead. Nothing moves until you press Apply, and every change can be undone.</p>
      <div class="sx-filters"><select id="sxTlDeck" aria-label="Deck">${deckOpts}</select></div></header>
    <section class="sx-stat"><h2>The next month</h2>${sdPlanChart(sdToolCards(ui.tools.deck), new Map(), 30)}</section>
    <div class="sx-tools">${Object.entries(SD_TOOLS).map(([k, tool]) => `<details class="sx-tool" data-sxtool="${k}"><summary><b>${tool.name}</b><span class="faint">${tool.blurb}</span></summary>
      <form class="sx-toolform" onsubmit="return false">${tool.form(preset)}</form>
      <div class="row sx-toolbtns"><button class="btn ghost" data-sxpreview>Preview</button><button class="btn primary" data-sxapply disabled>Apply</button></div>
      <div class="sx-toolout"></div></details>`).join('')}
    <details class="sx-tool"><summary><b>Reschedule from history</b><span class="faint">Recompute every card's memory from its reviews with the current weights, and set each due date from the retention you asked for.</span></summary>
      <div class="row sx-toolbtns"><select id="sxRsPreset">${presets.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select><button class="btn primary" id="sxRsGo">Reschedule</button></div><div class="sx-toolout" id="sxRsOut"></div></details>
    <details class="sx-tool"><summary><b>Remedy Hard misuse</b><span class="faint">If you have been pressing Hard when you had in fact forgotten, the memory model is misled. This recomputes memory as if those Hard presses were Again. Your review log is not changed.</span></summary>
      <div class="row sx-toolbtns"><button class="btn ghost" id="sxHardCheck">Check my answers</button><button class="btn primary" id="sxHardGo" disabled>Recompute</button></div><div class="sx-toolout" id="sxHardOut"></div></details>
    <details class="sx-tool"><summary><b>Optimise the memory model</b><span class="faint">Fit the FSRS weights to your own reviews. Needs a few hundred reviews; takes a few seconds.</span></summary>
      <div class="row sx-toolbtns"><select id="sxOpPreset">${presets.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select><button class="btn ghost" id="sxOpEval">Evaluate</button><button class="btn primary" id="sxOpGo">Optimise</button></div>
      <div class="sx-toolout" id="sxOpOut"></div></details>
    <details class="sx-tool"><summary><b>Simulator</b><span class="faint">What would a different retention or pace mean? A simulation of the coming months, from your own cards.</span></summary>
      <form class="sx-toolform" id="sxSimForm" onsubmit="return false"><label>Desired retention <input class="inp" type="number" name="r" value="${preset.desiredRetention || 0.9}" min="0.7" max="0.99" step="0.01"></label>
        <label>New cards a day <input class="inp" type="number" name="newPer" value="${preset.newPerDay}" min="0"></label><label>Days <input class="inp" type="number" name="days" value="180" min="7" max="730"></label>
        <label>Seconds per review <input class="inp" type="number" name="secs" value="${Math.round(sdPaceSecs() || 8)}" min="1"></label></form>
      <div class="row sx-toolbtns"><button class="btn primary" id="sxSimGo">Simulate</button><button class="btn ghost" id="sxSimSweep">Compare retentions</button></div><div class="sx-toolout" id="sxSimOut"></div></details>
    <details class="sx-tool"><summary><b>Check the collection</b><span class="faint">Looks for cards without notes, notes without cards, cards in missing decks and impossible due dates, and mends what it safely can.</span></summary>
      <div class="row sx-toolbtns"><button class="btn primary" id="sxCheckGo">Check</button></div><div class="sx-toolout" id="sxCheckOut"></div></details>
    </div>
    ${log.length ? `<section class="sx-stat"><h2>Recent changes</h2><ul class="sx-log">${log.map(r => `<li><span>${esc(r.tool)}</span><span class="faint">${r.n} card${r.n === 1 ? '' : 's'} · ${new Date(r.at).toLocaleString()}</span></li>`).join('')}</ul></section>` : ''}
  </div>`;
  const page = root.querySelector('.sx-toolspage');
  sdChartTip(page);
  root.querySelector('#sxTlDeck').value = ui.tools.deck ? String(ui.tools.deck) : 'all';
  root.querySelector('#sxTlDeck').onchange = e => { ui.tools.deck = e.target.value === 'all' ? null : +e.target.value; sdToolsRoute(root); };
  root.querySelectorAll('[data-sxtool]').forEach(box => {
    const tool = SD_TOOLS[box.dataset.sxtool], out = box.querySelector('.sx-toolout'), apply = box.querySelector('[data-sxapply]');
    let plan = null, cards = null;
    box.querySelector('form').oninput = () => { apply.disabled = true; plan = null; };
    box.querySelector('[data-sxpreview]').onclick = () => {
      cards = sdToolCards(ui.tools.deck);
      plan = tool.plan(cards, sdToolForm(box));
      [...plan].forEach(([id, d]) => { const c = SD.cards.get(id); if(c && c.due === d) plan.delete(id); });
      out.innerHTML = `<p><b>${plan.size}</b> card${plan.size === 1 ? '' : 's'} would move.</p>${sdPlanChart(cards, plan, 30)}`;
      sdChartTip(out);
      apply.disabled = !plan.size && !tool.after;
    };
    apply.onclick = () => {
      if(!plan) return;
      const f = sdToolForm(box), moved = [...plan.keys()].map(id => SD.cards.get(id)).filter(Boolean);
      if(moved.length){
        sdPushUndo(tool.name, moved);
        const undoIndex = SD_UNDO.length - 1;
        moved.forEach(c => { c.due = plan.get(c.id); c.mod = Date.now(); sdTouch('cards', c); });
        sdScheduleLog(tool.name, moved.length, f);
        sdSummarise();
        sdUndoToast(`${tool.name}: moved ${moved.length} card${moved.length === 1 ? '' : 's'}`, async () => { if(SD_UNDO.length - 1 === undoIndex){ await sdUndo(); sdSummarise(); sdToolsRoute(root); } else toast('Something else has changed since; use Undo in the review instead.'); });
      }
      if(tool.after) tool.after(f, ui.tools.deck);
      sdToolsRoute(root);
    };
  });
  /* reschedule */
  root.querySelector('#sxRsGo').onclick = async () => {
    const out = root.querySelector('#sxRsOut'); out.textContent = 'Working…';
    const n = await sdRescheduleAll(+root.querySelector('#sxRsPreset').value);
    out.textContent = n ? `${n} cards rescheduled.` : 'Every card was already where its memory puts it.';
    if(n) sdUndoToast(`Rescheduled ${n} cards`, async () => { await sdUndo(); sdToolsRoute(root); });
  };
  /* hard misuse */
  root.querySelector('#sxHardCheck').onclick = () => {
    const out = root.querySelector('#sxHardOut');
    let hard = 0, hardThenAgain = 0, reviews = 0;
    const byCard = new Map(); SD.revlog.forEach(r => { if(r.ease > 0 && r.type === 1) (byCard.get(r.cardId) || byCard.set(r.cardId, []).get(r.cardId)).push(r); });
    byCard.forEach(l => l.forEach((r, i) => { reviews++; if(r.ease === 2){ hard++; if(l[i + 1] && l[i + 1].ease === 1) hardThenAgain++; } }));
    const share = reviews ? hard / reviews : 0;
    out.innerHTML = `<p>Hard on ${hard} of ${reviews} reviews (${(share * 100).toFixed(1)}%). ${hard ? `After a Hard, the next review was Again ${sdPct(hardThenAgain, hard)} of the time.` : ''}</p>
      <p class="faint">${share > 0.15 || hardThenAgain / Math.max(1, hard) > 0.3 ? 'That pattern suggests Hard has sometimes meant "forgot". Recomputing may help.' : 'Nothing here suggests misuse; recomputing is unlikely to change much.'}</p>`;
    root.querySelector('#sxHardGo').disabled = !hard;
  };
  root.querySelector('#sxHardGo').onclick = async () => {
    const out = root.querySelector('#sxHardOut'), L = sdFsrsLib(); if(!L) return;
    const cardsBefore = [...SD.cards.values()].filter(c => c.type === 2);
    sdPushUndo('Remedy Hard misuse', cardsBefore);
    let n = 0; const t = sdToday();
    const byCard = new Map(); SD.revlog.forEach(r => { if(r.ease > 0) (byCard.get(r.cardId) || byCard.set(r.cardId, []).get(r.cardId)).push(r); });
    byCard.forEach((list, cid) => { const c = SD.cards.get(cid); if(!c || c.type !== 2 || !list.some(r => r.ease === 2)) return;
      const p = sdDeckPreset(c.odid || c.deckId), F = sdFsrsMath(sdPresetWeights(p));
      list.sort((a, b) => a.id - b.id);
      let m = F.init(list[0].ease === 2 ? 1 : list[0].ease), last = sdDayOfMs(list[0].id);
      for(let i = 1; i < list.length; i++){ const d = sdDayOfMs(list[i].id); m = F.step(m, list[i].ease === 2 ? 1 : list[i].ease, d - last); last = d; }
      const ivl = Math.min(p.maxIvl || 36500, Math.max(1, Math.round(F.ivl(m.s, p.desiredRetention || 0.9))));
      c.memory = {s: +m.s.toFixed(4), d: +m.d.toFixed(4)}; c.ivl = ivl; c.due = Math.max(t, last + ivl); c.mod = Date.now(); sdTouch('cards', c); n++; });
    sdScheduleLog('Remedied Hard misuse', n, {});
    out.textContent = `${n} cards recomputed.`;
    sdUndoToast(`Recomputed ${n} cards`, async () => { await sdUndo(); sdToolsRoute(root); });
  };
  /* optimiser */
  root.querySelector('#sxOpEval').onclick = () => {
    const p = sdPreset(+root.querySelector('#sxOpPreset').value), out = root.querySelector('#sxOpOut');
    const set = sdTrainingSet(p.id, false), e = sdEvaluate(sdPresetWeights(p), set);
    out.innerHTML = e.n ? `<p>On ${e.n.toLocaleString()} reviews: log loss <b>${e.logLoss.toFixed(4)}</b>, RMSE (bins) <b>${(e.rmse * 100).toFixed(2)}%</b>. Lower is better.</p>` : '<p class="faint">No reviews with a known start in this preset yet.</p>';
  };
  root.querySelector('#sxOpGo').onclick = async () => {
    const p = sdPreset(+root.querySelector('#sxOpPreset').value), out = root.querySelector('#sxOpOut');
    out.innerHTML = '<p class="sx-say">Starting…</p>';
    try {
      const w = await sdOptimise(p, s => { const e = out.querySelector('.sx-say'); if(e) e.textContent = s; });
      if(!w){ out.insertAdjacentHTML('beforeend', '<p class="faint">Your current weights already fit best.</p>'); return; }
      out.insertAdjacentHTML('beforeend', `<p class="mono sx-w">${w.map(x => x.toFixed(4)).join(', ')}</p><div class="row"><button class="btn primary" id="sxOpSave">Use these for “${esc(p.name)}”</button></div>`);
      out.querySelector('#sxOpSave').onclick = async () => {
        const old = p.weights; p.weights = w.map(x => +x.toFixed(4)); p.mod = Date.now(); sdTouch('presets', p); _sdSched.clear();
        sdPushUndo('new weights', [], () => { p.weights = old; sdTouch('presets', p); _sdSched.clear(); });
        sdScheduleLog('Optimised weights', 0, {presetId: p.id});
        out.insertAdjacentHTML('beforeend', '<p>Saved. Reschedule from history to apply them to existing cards.</p>');
      };
    } catch(e){ out.innerHTML = `<p>${esc(e.message)}</p>`; }
  };
  /* simulator */
  root.querySelector('#sxSimGo').onclick = () => {
    const f = sdToolForm(root.querySelector('#sxSimForm')), out = root.querySelector('#sxSimOut');
    const r = sdSimulate(ui.tools.deck, {retention: +f.r, newPer: +f.newPer, days: +f.days, secs: +f.secs});
    out.innerHTML = `<p>Over ${f.days} days: about <b>${Math.round(r.totalMin / +f.days)}</b> minutes a day (${Math.round(r.reviews / +f.days)} reviews), and <b>${Math.round(r.memorised[r.memorised.length - 1]).toLocaleString()}</b> cards remembered at the end.</p>
      ${sdBarChart({labels: r.perDay.map((_, i) => `day ${i + 1}`), series: [{name: 'Minutes', cls: 'young', values: r.perDay}], title: 'Simulated minutes per day', unit: 'min'})}`;
    sdChartTip(out);
  };
  root.querySelector('#sxSimSweep').onclick = () => {
    const f = sdToolForm(root.querySelector('#sxSimForm')), out = root.querySelector('#sxSimOut');
    const rows = [0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 0.97].map(r => { const s = sdSimulate(ui.tools.deck, {retention: r, newPer: +f.newPer, days: +f.days, secs: +f.secs});
      return {r, min: s.totalMin / +f.days, mem: s.memorised[s.memorised.length - 1]}; });
    const best = rows.slice().sort((a, b) => b.mem / Math.max(1, b.min) - a.mem / Math.max(1, a.min))[0];
    out.innerHTML = `<div class="sx-tablewrap"><table class="sx-ret"><thead><tr><th>Retention</th><th>Minutes a day</th><th>Remembered at the end</th><th>Remembered per minute</th></tr></thead><tbody>
      ${rows.map(x => `<tr${x === best ? ' class="best"' : ''}><td>${Math.round(x.r * 100)}%</td><td>${x.min.toFixed(1)}</td><td>${Math.round(x.mem).toLocaleString()}</td><td>${(x.mem / Math.max(1, x.min)).toFixed(0)}</td></tr>`).join('')}</tbody></table></div>
      <p class="faint">The most knowledge for your time is around ${Math.round(best.r * 100)}% — a guide, not a rule.</p>`;
  };
  /* check */
  root.querySelector('#sxCheckGo').onclick = () => { root.querySelector('#sxCheckOut').innerHTML = sdCheckCollection().map(l => `<p>${esc(l)}</p>`).join(''); };
}

/* a simulation from today: each review card follows its memory; new cards arrive at the chosen pace */
function sdSimulate(deckId, o){
  const ids = sdScopeIds(deckId), t = sdToday();
  let seed = 12345; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const byPreset = new Map();
  const cards = [];
  SD.cards.forEach(c => { if(!sdInScope(ids, c) || c.queue < 0) return;
    const p = sdDeckPreset(c.odid || c.deckId); let F = byPreset.get(p.id); if(!F){ F = sdFsrsMath(sdPresetWeights(p)); byPreset.set(p.id, F); }
    if(c.type === 2 && c.memory) cards.push({F, s: c.memory.s, d: c.memory.d, last: c.lastReview ? sdDayOfMs(c.lastReview) : t - c.ivl, due: Math.max(t, c.due)});
    else if(c.type === 0) cards.push({F, s: 0, d: 0, last: null, due: null, isNew: true});
  });
  const perDay = [], memorised = []; let reviews = 0, totalMin = 0;
  const secsAgain = o.secs * 2.2;
  for(let day = 0; day < o.days; day++){
    const today = t + day; let secs = 0, introduced = 0;
    for(const c of cards){
      if(c.isNew){ if(introduced >= o.newPer) continue; introduced++;
        c.isNew = false; const g = rnd() < 0.3 ? 1 : rnd() < 0.15 ? 2 : rnd() < 0.9 ? 3 : 4; const m = c.F.init(g); c.s = m.s; c.d = m.d; c.last = today;
        secs += o.secs * 3; c.due = today + Math.max(1, Math.round(c.F.ivl(c.s, o.retention))); reviews++; continue; }
      if(c.due == null || c.due > today) continue;
      const el = today - c.last, p = c.F.R(el, c.s), ok = rnd() < p;
      const g = ok ? (rnd() < 0.1 ? 2 : rnd() < 0.9 ? 3 : 4) : 1;
      const m = c.F.step({s: c.s, d: c.d}, g, el); c.s = m.s; c.d = m.d; c.last = today;
      c.due = today + Math.max(1, Math.round(c.F.ivl(c.s, o.retention)));
      secs += ok ? o.secs : secsAgain; reviews++;
    }
    const mins = secs / 60; perDay.push(Math.round(mins * 10) / 10); totalMin += mins;
    let mem = 0; for(const c of cards) if(!c.isNew && c.last != null) mem += c.F.R(today - c.last, c.s);
    memorised.push(mem);
  }
  return {perDay, memorised, reviews, totalMin};
}

/* Check the collection: finds and, where safe, mends. Nothing is deleted. */
function sdCheckCollection(){
  const out = []; const t = sdToday();
  let orphanCards = 0, emptyNotes = 0, missingDeck = 0, badDue = 0, badType = 0, missingType = 0, dupIdx = 0;
  const def = sdEnsureDeck('Default');
  SD.cards.forEach(c => {
    if(!SD.notes.has(c.noteId)){ /* the note is gone: a placeholder keeps the card and its history */
      orphanCards++; sdEnsureBasics(); const bt = sdNoteTypeByName('Basic');
      const n = sdNewNote(bt.id, ['(this card\'s note was missing)', ''], ['recovered'], {id: c.noteId});
      SD.notes.set(n.id, n); sdTouch('notes', n); c.ord = 0; sdTouch('cards', c); }
    if(!SD.decks.has(c.deckId)){ missingDeck++; c.deckId = def.id; sdTouch('cards', c); }
    if(c.odid && !SD.decks.has(c.odid)){ c.odid = 0; c.odue = 0; sdTouch('cards', c); missingDeck++; }
    if(c.type === 2 && c.queue === 2 && (!Number.isFinite(c.due) || c.due > t + 100000 || c.due < -100000)){ badDue++; c.due = t; sdTouch('cards', c); }
    if(c.type === 0 && c.queue === 2){ badType++; c.queue = 0; sdTouch('cards', c); }
    if(c.type === 2 && (!c.ivl || c.ivl < 1)){ badType++; c.ivl = 1; sdTouch('cards', c); }
  });
  SD.notes.forEach(n => {
    if(!SD.noteTypes.has(n.noteTypeId)) missingType++;
    const list = SD.byNote.get(n.id) || [];
    if(!list.length){ emptyNotes++; sdGenerateCards(n, def.id); }
    if(new Set(list).size !== list.length){ dupIdx++; SD.byNote.set(n.id, [...new Set(list)]); }
  });
  if(orphanCards) out.push(`${orphanCards} card${orphanCards === 1 ? '' : 's'} had lost their note; each now has a placeholder note tagged “recovered”, so nothing of its history is lost.`);
  if(emptyNotes) out.push(`${emptyNotes} note${emptyNotes === 1 ? ' had' : 's had'} no cards; cards were made again (in Default).`);
  if(missingDeck) out.push(`${missingDeck} card${missingDeck === 1 ? ' was' : 's were'} in a missing deck and moved to Default.`);
  if(badDue) out.push(`${badDue} impossible due date${badDue === 1 ? '' : 's'} set to today.`);
  if(badType) out.push(`${badType} card${badType === 1 ? '' : 's'} with inconsistent fields mended.`);
  if(missingType) out.push(`${missingType} note${missingType === 1 ? ' uses' : 's use'} a missing note type — left alone; re-import its deck to restore it.`);
  if(dupIdx) out.push('Rebuilt a small index.');
  sdSummarise();
  if(!out.length) out.push('All well — nothing needed mending.');
  sdScheduleLog('Checked the collection', orphanCards + emptyNotes + missingDeck + badDue + badType, {});
  return out;
}
