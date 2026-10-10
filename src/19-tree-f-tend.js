/* ============================================================
   THE KNOWLEDGE TREE — tending it.

   One card a day, one small thing: a page due to resurface ("do you still
   hold this?"), else the oldest capture in the inbox, else the branch left
   untended longest. Doing the thing marks it tended.

   Resurfacing is recall first (19-tree-j-ics-retrieve.js): write what you can
   remember, then see the page, grade it, then "do you still hold this?". The
   ladder is set in Tree Home (0, 1, 3, 7, 16, 50, 120, 365 days by default).

   Now and then, beside what you hold now: what you held a year ago. And on
   every page, how sure you have been over time, drawn as a line.
   ============================================================ */

/* The card, its rules and its binding now live in 19-tree-j-ics-retrieve.js (A-12): a registry of
   prioritised rules, still one card at a time. */

/* ---------- resurfacing, asked for on a page ---------- */
function treeReviewDialog(n, after){
  /* the same four steps as the card: prime, recall with the page out of sight, reveal and grade, then the belief question */
  return icsReviewDialog(n, after);
}

/* ---------- a year ago ---------- */
function treeDayHash(s){ let h = 0; for(const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); }
/* shown on about one day in four for a page, and only when there is a position from a year or more ago that differs from today's */
function treeYearAgoHTML(n){
  const pos = treePositionsOf(n.id); if(pos.length < 2) return '';
  const cur = pos[pos.length - 1], cut = Date.now() - 330 * 864e5;
  const old = pos.filter(p => Date.parse(p.date) <= cut).pop();
  if(!old || old.id === cur.id || (old.statement === cur.statement && old.confidence === cur.confidence)) return '';
  if(treeDayHash(treeToday() + n.id) % 4 !== 0 && !S.treePrefs.alwaysYearAgo) return '';
  const ago = Math.round((Date.now() - Date.parse(old.date)) / (365.25 * 864e5) * 10) / 10;
  return `<div class="tr-yearago"><span class="tr-lbl">${ago >= 1.5 ? `${Math.round(ago)} years` : 'A year'} ago you believed</span><p>${esc(old.statement)} <span class="faint">(${old.confidence}%)</span></p>
    <span class="faint">Now: ${cur.confidence}%${cur.confidence !== old.confidence ? ` (${cur.confidence > old.confidence ? '+' : ''}${cur.confidence - old.confidence})` : ''}</span></div>`;
}

/* ---------- the confidence timeline: no library, one polyline ---------- */
function treeConfidenceChartHTML(pos){
  if(pos.length < 2) return '';
  const W = 480, H = 64, L = 26, R = 8, T = 6, B = 16;
  const t0 = Date.parse(pos[0].date), t1 = Math.max(t0 + 864e5, Date.parse(pos[pos.length - 1].date), Date.now());
  const x = d => L + (Date.parse(d) - t0) / (t1 - t0) * (W - L - R), y = c => T + (1 - c / 100) * (H - T - B);
  const pts = pos.map(p => [x(p.date), y(p.confidence)]);
  /* a step, not a slope: a position is held flat until the next one replaces it */
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for(let i = 1; i < pts.length; i++) d += ` H${pts[i][0].toFixed(1)} V${pts[i][1].toFixed(1)}`;
  d += ` H${(W - R).toFixed(1)}`;
  const fmt = s => fmtDate(s.slice(0, 10), 'short');
  return `<svg class="tr-conftl" viewBox="0 0 ${W} ${H}" role="img" aria-label="Confidence over time: ${pos.map(p => p.confidence + '%').join(', ')}">
    ${[0, 50, 100].map(c => `<line x1="${L}" x2="${W - R}" y1="${y(c)}" y2="${y(c)}" class="g"/><text x="${L - 4}" y="${y(c) + 3}" text-anchor="end">${c}</text>`).join('')}
    <path d="${d}" class="ln"/>${pts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4" class="pt"><title>${esc(fmt(pos[i].date))}: ${pos[i].confidence}% — ${esc(pos[i].statement.slice(0, 80))}</title></circle>`).join('')}
    <text x="${L}" y="${H - 3}">${esc(fmt(pos[0].date))}</text><text x="${W - R}" y="${H - 3}" text-anchor="end">now</text></svg>`;
}

/* ---------- the week, worked out when the site is opened ---------- */
function treeRedSlugs(){ const out = new Set(); S.treeLinks.forEach(l => { if(l.toRoom === 'tree' && !treeResolve(l.toSlug)) out.add(l.toSlug); }); return out; }
function treeWeekSummary(){
  if(!S.treeNodes.length) return null;
  const P = S.treePrefs, now = Date.now(), weekMs = 7 * 864e5;
  /* the red links as they stood at the start of the week, kept so "turned blue" can be counted */
  if(!P.redSnapshot || now - Date.parse(P.redSnapshot.at) > weekMs){
    if(P.redSnapshot){ const s = treeWeekNumbers(Date.parse(P.redSnapshot.at), new Set(P.redSnapshot.reds));
      (P.summaries = P.summaries || []).push(Object.assign({week: P.redSnapshot.at.slice(0, 10), weekKey: typeof icsIsoWeekKey === 'function' ? icsIsoWeekKey(new Date(P.redSnapshot.at)) : undefined}, s)); if(P.summaries.length > 104) P.summaries.shift(); }
    P.redSnapshot = {at: new Date(now).toISOString(), reds: [...treeRedSlugs()]}; save();
  }
  const since = Math.min(Date.parse(P.redSnapshot.at), now - weekMs);
  const s = treeWeekNumbers(since, new Set(P.redSnapshot.reds));
  s.range = `${fmtDate(new Date(since).toISOString().slice(0, 10), 'short')} – today`;
  return s;
}
function treeWeekNumbers(since, reds){
  const after = d => d && Date.parse(d) >= since;
  const newPages = S.treeNodes.filter(n => after(n.createdAt)).length;
  const blued = [...reds].filter(s => treeResolve(s)).length;
  const revised = S.treePositions.filter(p => after(p.date) && S.treePositions.some(q => q.nodeId === p.nodeId && q.date < p.date)).length;
  const pruned = S.treeNodes.filter(n => n.status === 'pruned' && after(n.prunedAt)).length;
  const tensions = S.treeGrafts.filter(g => g.type === 'contradicts' && !g.resolvedAt).length;
  const positionsSet = S.treePositions.filter(p => after(p.date)).length;
  const pagesTended = S.treeNodes.filter(n => after(n.lastTendedAt)).length;
  return {newPages, blued, revised, pruned, tensions, positionsSet, pagesTended, gapsOpen: treeGaps().total};
}
