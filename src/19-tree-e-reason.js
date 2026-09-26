/* ============================================================
   THE KNOWLEDGE TREE — reasoning.

   A graft joins two pages with a kind and a reason: this supports that,
   contradicts it, extends it, echoes it from elsewhere, or raises a
   question of it. The reason is required; without one it is only a link.

   Tensions: every "contradicts" still open, with a way to say how it was
   settled. Gaps: red links, points with nothing under them from the other
   rooms (citation needed), branches that hold no position, positions with no
   question that would change them, and branches where every graft agrees.
   ============================================================ */

function treeGraftsHTML(n){
  const list = treeIndex().grafts.get(n.id) || [];
  const byType = {};
  list.forEach(g => (byType[g.type] = byType[g.type] || []).push(g));
  return `<section class="tr-sec tr-grafts"><div class="tr-sechead"><h2>Grafts</h2><span class="faint">${list.length ? list.length + ' — the reasoning, page to page' : 'how this bears on other pages, and why'}</span><span class="tr-grow"></span><button class="tbtn" id="trGraft">＋ Graft</button></div>
    ${Object.keys(TREE_GRAFTS).filter(t => byType[t]).map(t => `<div class="tr-gtype ${t}"><h3>${t}</h3>${byType[t].map(g => {
      const out = g.fromId === n.id, other = treeNode(out ? g.toId : g.fromId);
      return `<div class="tr-graft${g.resolvedAt ? ' resolved' : ''}"><div class="tr-gline">${out ? `this <i>${t}</i> <a href="${other ? treeUrl(other) : '#'}">${esc(other ? other.title : '(gone)')}</a>` : `<a href="${other ? treeUrl(other) : '#'}">${esc(other ? other.title : '(gone)')}</a> <i>${t}</i> this`}
        <button class="tbtn sm" data-trgdel="${g.id}" aria-label="Remove graft">×</button></div><p class="tr-why">${esc(g.why)}</p>${g.resolvedAt ? `<p class="faint">Resolved ${esc(fmtDate(g.resolvedAt.slice(0, 10), 'med'))}: ${esc(g.resolution)}</p>` : ''}</div>`; }).join('')}</div>`).join('')}
  </section>`;
}
function treeBindGrafts(root, n){
  const b = root.querySelector('#trGraft'); if(b) b.onclick = () => treeGraftDialog(n, () => treePageRoute(root, treeNode(n.id)));
  root.querySelectorAll('[data-trgdel]').forEach(x => x.onclick = () => confirmDlg('Remove this graft? Its reason goes with it.', () => { treeRemoveGraft(x.dataset.trgdel); treePageRoute(root, treeNode(n.id)); }));
}
function treeGraftDialog(n, after){
  let target = null;
  const m = openModal(`<h2 class="serif">Graft</h2><p class="faint">From <b>${esc(n.title)}</b> to another page, with the reason.</p>
    <div class="tr-frow"><label class="tr-f"><span>This page…</span><select class="sel" id="tgT">${Object.keys(TREE_GRAFTS).map(t => `<option value="${t}">${t} — ${TREE_GRAFT_BLURB[t]}</option>`).join('')}</select></label></div>
    <label class="tr-f"><span>…that page</span><input class="inp" id="tgQ" placeholder="search pages" autocomplete="off"></label><div class="tr-picklist short" id="tgL"></div>
    <label class="tr-f"><span>Why <small>required</small></span><textarea class="inp" id="tgW" rows="3" placeholder="what in one bears on the other"></textarea></label>
    <p class="tr-err" id="tgErr"></p>
    <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" id="tgNo">Cancel</button><button class="btn primary" id="tgOk">Graft</button></div>`, 'narrow');
  const $m = id => m.querySelector(id);
  const paint = () => { const s = $m('#tgQ').value.trim(); const list = (s ? treeSuggestTitles(s, 8).map(x => x.node) : []).filter(x => x.id !== n.id);
    $m('#tgL').innerHTML = list.map(x => `<button type="button" class="${target === x.id ? 'on' : ''}" data-g="${x.id}">${treeKindMark(x)}<b>${esc(x.title)}</b></button>`).join('');
    $m('#tgL').querySelectorAll('[data-g]').forEach(b => b.onclick = () => { target = b.dataset.g; $m('#tgQ').value = treeNode(target).title; paint(); }); };
  $m('#tgQ').oninput = () => { target = null; paint(); };
  $m('#tgNo').onclick = () => m.remove();
  $m('#tgOk').onclick = () => { if(!target){ const r = treeResolve($m('#tgQ').value); if(r) target = r.id; }
    if(!target){ $m('#tgErr').textContent = 'Choose the page it is grafted to.'; return; }
    const r = treeAddGraft(n.id, target, $m('#tgT').value, $m('#tgW').value);
    if(r.error){ $m('#tgErr').textContent = r.error; return; } m.remove(); after && after(); };
  setTimeout(() => $m('#tgQ').focus(), 30);
}

/* ---------- tensions ---------- */
function treeTensionsRoute(root){
  const open = S.treeGrafts.filter(g => g.type === 'contradicts' && !g.resolvedAt);
  const done = S.treeGrafts.filter(g => g.type === 'contradicts' && g.resolvedAt).sort((a, b) => b.resolvedAt.localeCompare(a.resolvedAt));
  const row = g => { const a = treeNode(g.fromId), b = treeNode(g.toId);
    return `<li class="tr-tension" data-trt="${g.id}"><div class="tr-tpair"><a href="${a ? treeUrl(a) : '#'}">${esc(a ? a.title : '(gone)')}</a><span class="tr-vs">contradicts</span><a href="${b ? treeUrl(b) : '#'}">${esc(b ? b.title : '(gone)')}</a></div>
      <p class="tr-why">${esc(g.why)}</p>${g.resolvedAt ? `<p class="faint">Resolved ${esc(fmtDate(g.resolvedAt.slice(0, 10), 'med'))} — ${esc(g.resolution)}</p>` : `<button class="tbtn" data-trres>Mark resolved…</button>`}</li>`; };
  root.innerHTML = `<div class="page tr-page">${treeNav('tensions')}
    <header class="tr-head"><h1 class="serif">Tensions</h1><p class="tr-lede">Where two things you hold pull against each other. Not failures — the places where the thinking is still alive.</p></header>
    ${open.length ? `<ul class="tr-tensions">${open.map(row).join('')}</ul>` : '<p class="faint">No open tensions. Either everything agrees, or no contradiction has been grafted yet.</p>'}
    ${done.length ? `<details class="tr-earlier"><summary>Resolved (${done.length})</summary><ul class="tr-tensions">${done.map(row).join('')}</ul></details>` : ''}
  </div>`;
  treeBindNav(root);
  root.querySelectorAll('[data-trres]').forEach(b => b.onclick = async () => { const id = b.closest('[data-trt]').dataset.trt;
    const how = await treeAsk('How was it resolved?', ''); if(how == null) return; const err = treeResolveTension(id, how); if(err) toast(err); treeTensionsRoute(root); });
}

/* ---------- gaps ---------- */
function treeGaps(){
  const red = new Map();
  S.treeLinks.forEach(l => { if(l.toRoom === 'tree' && !treeResolve(l.toSlug)){ const e = red.get(l.toSlug) || {title: l.text, from: new Set()}; e.from.add(l.fromId); red.set(l.toSlug, e); } });
  const live = S.treeNodes.filter(n => n.status !== 'pruned');
  const noLeaf = live.filter(n => n.kind === 'point' && !S.treeLeaves.some(l => l.nodeId === n.id));
  const noPos = live.filter(n => n.kind === 'branch' && !treeCurrentPosition(n.id));
  const noQ = live.filter(n => treeCurrentPosition(n.id) && !String(n.openQuestion || '').trim());
  const oneSided = live.filter(n => n.kind === 'branch').filter(b => {
    const ids = new Set([b.id]); const stack = [b.id]; while(stack.length){ (treeIndex().kids.get(stack.pop()) || []).forEach(k => { ids.add(k.id); stack.push(k.id); }); }
    const gs = S.treeGrafts.filter(g => ids.has(g.fromId) || ids.has(g.toId));
    return gs.some(g => g.type === 'supports') && !gs.some(g => g.type === 'contradicts');
  });
  return {red: [...red.entries()].map(([slug, v]) => ({slug, title: v.title, from: [...v.from].map(treeNode).filter(Boolean)})), noLeaf, noPos, noQ, oneSided,
    total: red.size + noLeaf.length + noPos.length + noQ.length + oneSided.length};
}
function treeGapsRoute(root){
  const g = treeGaps();
  const list = (items, f) => items.length ? `<ul class="tr-gaplist">${items.map(f).join('')}</ul>` : '<p class="faint">None.</p>';
  const nl = n => `<li>${treeKindMark(n)}<a href="${treeUrl(n)}">${esc(n.title)}</a><span class="faint">${esc(treeAncestors(n).map(a => a.title).join(' › '))}</span></li>`;
  root.innerHTML = `<div class="page tr-page">${treeNav('gaps')}
    <header class="tr-head"><h1 class="serif">Gaps</h1><p class="tr-lede">What the tree is missing: ${g.total ? `${g.total} things worth an hour` : 'nothing, just now'}.</p></header>
    <section class="tr-sec"><div class="tr-sechead"><h2>Red links</h2><span class="faint">named, never written</span></div>${list(g.red, r => `<li><a class="tr-link red" href="#" data-trnew="${esc(r.title)}">${esc(r.title)}</a><span class="faint">from ${r.from.map(f => `<a href="${treeUrl(f)}">${esc(f.title)}</a>`).join(', ')}</span></li>`)}</section>
    <section class="tr-sec"><div class="tr-sechead"><h2>Citation needed</h2><span class="faint">points with no leaf from the Library, Journal or Writing</span></div>${list(g.noLeaf, nl)}</section>
    <section class="tr-sec"><div class="tr-sechead"><h2>Branches with no position</h2></div>${list(g.noPos, nl)}</section>
    <section class="tr-sec"><div class="tr-sechead"><h2>Positions with no open question</h2><span class="faint">held, with nothing named that would change them</span></div>${list(g.noQ, nl)}</section>
    <section class="tr-sec"><div class="tr-sechead"><h2>One-sided branches</h2><span class="faint">every graft supports; nothing contradicts</span></div>${list(g.oneSided, nl)}</section>
  </div>`;
  treeBindNav(root);
}
