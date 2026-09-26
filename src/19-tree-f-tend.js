/* ============================================================
   THE KNOWLEDGE TREE — tending it.

   One card a day, one small thing: a page due to resurface ("do you still
   hold this?"), else the oldest capture in the inbox, else the branch left
   untended longest. Doing the thing marks it tended.

   Resurfacing: 3 days, 2 weeks, 2 months, 6 months, a year. "Still hold"
   moves a page out along that ladder; "doubt" brings it back to the start;
   "revise" opens a new position and keeps its place.

   Now and then, beside what you hold now: what you held a year ago. And on
   every page, how sure you have been over time, drawn as a line.
   ============================================================ */

function treeTendItem(){
  const due = treeDueReviews()[0];
  if(due){ const n = treeNode(due.nodeId); if(n) return {kind: 'review', node: n, review: due}; }
  const inbox = S.treeInbox.slice().sort((a, b) => a.createdAt < b.createdAt ? -1 : 1)[0];
  if(inbox) return {kind: 'inbox', item: inbox};
  const branches = S.treeNodes.filter(n => n.kind !== 'point' && n.status !== 'pruned' && n.status !== 'dormant')
    .sort((a, b) => String(a.lastTendedAt || '').localeCompare(String(b.lastTendedAt || '')) || String(a.createdAt).localeCompare(String(b.createdAt)));
  if(branches[0]) return {kind: 'branch', node: branches[0]};
  return null;
}
function treeTendCardHTML(){
  const t = treeTendItem();
  if(!t) return `<div class="tr-tendcard quiet"><span class="tr-lbl">Today's tending</span><p>${S.treeNodes.length ? 'Nothing is asking for you today. The tree can rest.' : 'Plant a root, and the tree will start asking for a little each day.'}</p></div>`;
  if(t.kind === 'review'){ const p = treeCurrentPosition(t.node.id);
    return `<div class="tr-tendcard" data-trtend="review" data-n="${t.node.id}"><span class="tr-lbl">Resurfacing · ${esc(TREE_KINDS[t.node.kind])}</span>
      <h2 class="serif"><a href="${treeUrl(t.node)}">${esc(t.node.title)}</a></h2>
      ${p ? `<p class="tr-stmt">${esc(p.statement)} <span class="faint">(${p.confidence}%)</span></p><p>Do you still hold this?</p>` : `<p>You have not stated a position here yet. Do you hold one now?</p>`}
      <div class="row tr-tendbtns">${p ? `<button class="btn sm primary" data-tv="hold">Still hold</button>` : ''}<button class="btn sm" data-tv="revise">${p ? 'Revise' : 'State one'}</button><button class="btn sm ghost" data-tv="doubt">Doubt</button></div></div>`; }
  if(t.kind === 'inbox') return `<div class="tr-tendcard" data-trtend="inbox" data-i="${t.item.id}"><span class="tr-lbl">From the inbox</span>
      <p class="tr-stmt">${esc(t.item.text)}</p><p>Give it a home.</p>
      <div class="row tr-tendbtns"><button class="btn sm primary" data-tv="page">Make it a page</button><button class="btn sm" data-tv="attach">Add to a page</button><button class="btn sm ghost" data-tv="drop">Let it go</button></div></div>`;
  const n = t.node, days = n.lastTendedAt ? Math.floor((Date.now() - Date.parse(n.lastTendedAt)) / 864e5) : null;
  return `<div class="tr-tendcard" data-trtend="branch" data-n="${n.id}"><span class="tr-lbl">Left longest · ${days == null ? 'never tended' : `${days} days`}</span>
    <h2 class="serif"><a href="${treeUrl(n)}">${esc(n.title)}</a></h2><p>One small thing for it: a line, a leaf, or where you stand.</p>
    <div class="row tr-tendbtns"><button class="btn sm primary" data-tv="line">Write a line</button><button class="btn sm" data-tv="leaf">Attach a leaf</button><button class="btn sm" data-tv="position">${treeCurrentPosition(n.id) ? 'Revise position' : 'State a position'}</button></div></div>`;
}
function treeBindTend(root){
  const card = root.querySelector('[data-trtend]'); if(!card) return;
  const kind = card.dataset.trtend, again = () => { const box = root.querySelector('#trTend'); if(box){ box.innerHTML = treeTendCardHTML(); treeBindTend(root); } else rerender(); };
  const done = msg => { toast(msg || 'Tended.'); again(); };
  card.querySelectorAll('[data-tv]').forEach(b => b.onclick = async () => {
    const v = b.dataset.tv;
    if(kind === 'review'){ const n = treeNode(card.dataset.n);
      if(v === 'revise') return treeReviseDialog(n, () => { treeReviewAnswer(n.id, 'revise'); done('A new position, on the record.'); });
      treeReviewAnswer(n.id, v); return done(v === 'hold' ? `Still held. It will come back in ${TREE_REVIEW_DAYS[S.treeReviews.find(r => r.nodeId === n.id).step]} days.` : 'Doubt noted; it will come back soon.'); }
    if(kind === 'inbox'){ const x = S.treeInbox.find(i => i.id === card.dataset.i); if(!x) return again();
      if(v === 'drop'){ treeInboxDone(x.id); return done('Let go.'); }
      if(v === 'page') return treeNewPageDialog({title: x.text.length <= 80 ? x.text : '', kind: 'point', after: n => { if(x.text.length > 80) treeSavePage({id: n.id, body: x.text}); treeInboxDone(x.id); treeTouch(n.id); done('A new page.'); }});
      const id = await treePickPage('Which page does this belong to?'); if(!id) return;
      const n = treeNode(id); treeSavePage({id, body: (n.body || '').trimEnd() + '\n\n' + x.text, lastTendedAt: treeNow()}); treeInboxDone(x.id); return done(`Added to ${n.title}.`); }
    const n = treeNode(card.dataset.n);
    if(v === 'line'){ const t = await treeAsk(`A line for ${n.title}`, ''); if(!t) return; treeSavePage({id: n.id, body: (n.body || '').trimEnd() + '\n\n' + t, lastTendedAt: treeNow()}); return done(); }
    if(v === 'leaf') return treeLeafDialog(n, () => { treeTouch(n.id); done(); });
    return treeReviseDialog(n, () => done());
  });
}
/* the compact card for Today */
function treeTodayHTML(){
  if(!Array.isArray(S.treeNodes) || !S.treeNodes.length) return '';
  const t = treeTendItem(); if(!t) return '';
  const what = t.kind === 'review' ? `resurfacing: <b>${esc(t.node.title)}</b>` : t.kind === 'inbox' ? `from the inbox: ${esc(t.item.text.slice(0, 70))}${t.item.text.length > 70 ? '…' : ''}` : `left longest: <b>${esc(t.node.title)}</b>`;
  return `<div class="tr-today"><span class="tr-lbl">Knowledge Tree</span><span class="tr-todayw">${what}</span><a class="btn sm ghost" href="#/tree">tend it</a></div>`;
}

/* ---------- resurfacing, asked for on a page ---------- */
function treeReviewDialog(n, after){
  const p = treeCurrentPosition(n.id);
  const m = openModal(`<h2 class="serif">${esc(n.title)}</h2>${p ? `<blockquote class="tr-was">${esc(p.statement)} <span class="faint">(${p.confidence}%)</span></blockquote><p>Do you still hold this?</p>` : '<p>No position yet.</p>'}
    <div class="row" style="gap:8px;justify-content:flex-end">${p ? '<button class="btn primary" data-v="hold">Still hold</button>' : ''}<button class="btn" data-v="revise">Revise</button><button class="btn ghost" data-v="doubt">Doubt</button></div>`, 'narrow');
  m.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { m.remove();
    if(b.dataset.v === 'revise') return treeReviseDialog(n, () => { treeReviewAnswer(n.id, 'revise'); after && after(); });
    treeReviewAnswer(n.id, b.dataset.v); after && after(); });
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
      (P.summaries = P.summaries || []).push(Object.assign({week: P.redSnapshot.at.slice(0, 10)}, s)); if(P.summaries.length > 104) P.summaries.shift(); }
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
  return {newPages, blued, revised, pruned, tensions};
}
