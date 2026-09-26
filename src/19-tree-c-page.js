/* ============================================================
   THE KNOWLEDGE TREE — the room.

   #/tree                 home: today's tend card, the week, the outline
   #/tree/p/<slug>        a page
   #/tree/outline         the whole tree as a table of contents
   #/tree/inbox           captures waiting for a home
   #/tree/search          every room, filtered
   #/tree/tensions        unresolved contradictions
   #/tree/gaps            what the tree is missing
   #/tree/proof           experiments, predictions and calibration

   A page: its place (the path from its root), its status, its position now
   with the confidence it is held at (the earlier ones folded underneath, and
   a line of how sure you have been over time), the text, the question that
   would change your mind, its children, its leaves, its grafts, and what
   links to it.
   ============================================================ */

routes.tree = function(root, params){
  treeEnsure();
  const [v, a] = params || [];
  registerPageEntry && registerPageEntry({pageName: 'Knowledge Tree', addLabel: 'New page', defaultEntryType: 'tree', prefilledFields: {},
    options: [{label: 'New page', run: () => treeNewPageDialog({})}, {label: 'Quick capture (Alt+K)', run: () => treeQuickCapture()}]});
  if(v === 'p' && a){ const n = treeResolve(decodeURIComponent(a)); if(n && n.slug !== decodeURIComponent(a)){ navigate(treeUrl(n)); return; } return treePageRoute(root, n, decodeURIComponent(a)); }
  if(v === 'outline') return treeOutlineRoute(root);
  if(v === 'inbox') return treeInboxRoute(root);
  if(v === 'search') return treeSearchRoute(root);
  if(v === 'tensions') return treeTensionsRoute(root);
  if(v === 'gaps') return treeGapsRoute(root);
  if(v === 'proof') return treeProofRoute(root);
  return treeHomeRoute(root);
};
function treeNav(on){
  const inbox = S.treeInbox.length;
  const l = [['', 'Home'], ['outline', 'Outline'], ['inbox', 'Inbox' + (inbox ? ` <i>${inbox}</i>` : '')], ['search', 'Search'], ['tensions', 'Tensions'], ['gaps', 'Gaps'], ['proof', 'Proof']];
  return `<nav class="tr-nav" aria-label="Knowledge Tree">${l.map(([k, n]) => `<a href="#/tree${k ? '/' + k : ''}" class="${on === k ? 'on' : ''}">${n}</a>`).join('')}
    <button class="tbtn tr-newbtn" id="trNew">＋ New page</button></nav>`;
}
function treeBindNav(root){ const b = root.querySelector('#trNew'); if(b) b.onclick = () => treeNewPageDialog({}); treeBindLinks(root); }
function treeBadge(n){ return `<span class="tr-badge ${n.status}">${TREE_STATUS[n.status] || n.status}</span>`; }
function treeKindMark(n){ return `<span class="tr-kind ${n.kind}" title="${TREE_KINDS[n.kind]}">${n.kind === 'root' ? '◉' : n.kind === 'branch' ? '◆' : '•'}</span>`; }

/* ---------- a page ---------- */
function treePageRoute(root, n, wanted){
  if(!n){
    root.innerHTML = `<div class="page tr-page">${treeNav('')}<div class="tr-missing"><h1 class="serif">No page called “${esc(wanted)}”</h1>
      <p class="faint">It is a red link somewhere, perhaps. Start it now and it takes its place in the tree.</p><button class="btn primary" id="trStart">Start “${esc(wanted)}”</button></div></div>`;
    treeBindNav(root); root.querySelector('#trStart').onclick = () => treeNewPageDialog({title: wanted.replace(/-/g, ' ')}); return;
  }
  const ui = S._tree = S._tree || {}; const editing = ui.editing === n.id;
  const path = treeAncestors(n), kids = treeChildren(n.id), pos = treePositionsOf(n.id), cur = pos[pos.length - 1];
  const points = kids.filter(k => k.kind === 'point').length;
  const leaves = treeLeavesOf(n.id), back = treeBacklinks(n);
  const aliases = S.treeAliases.filter(a => a.nodeId === n.id);
  root.innerHTML = `<div class="page tr-page" data-trfrom="${n.id}">
    ${treeNav('')}
    <div class="tr-crumbs">${path.map(p => `<a href="${treeUrl(p)}">${esc(p.title)}</a>`).join('<span>›</span>')}</div>
    ${editing ? treeEditFormHTML(n) : `
    <header class="tr-head">
      <h1 class="serif">${treeKindMark(n)}${esc(n.title)}</h1>
      <div class="tr-headrow">${treeBadge(n)}<span class="faint">${TREE_KINDS[n.kind]}${aliases.length ? ` · also known as ${aliases.map(a => esc(a.title || a.alias)).join(', ')}` : ''}</span>
        <span class="tr-grow"></span>
        <button class="tbtn" id="trEdit">Edit</button><button class="tbtn" id="trMore" aria-label="More">⋯</button></div>
    </header>
    <section class="tr-position">
      ${cur ? `<div class="tr-pos-now"><div class="tr-conf" style="--c:${cur.confidence}"><b>${cur.confidence}</b><span>%</span></div>
        <div><p class="tr-stmt">${esc(cur.statement)}</p><p class="faint">held since ${esc(fmtDate(cur.date.slice(0, 10), 'med'))}${pos.length > 1 ? ` · position ${pos.length}` : ''}</p></div></div>
        ${treeConfidenceChartHTML(pos)}
        ${treeYearAgoHTML(n)}
        ${pos.length > 1 ? `<details class="tr-earlier"><summary>Earlier positions (${pos.length - 1})</summary>${pos.slice(0, -1).reverse().map(p => `<div class="tr-old"><span class="tr-oconf">${p.confidence}%</span><span>${esc(p.statement)}</span><span class="faint">${esc(fmtDate(p.date.slice(0, 10), 'med'))}</span></div>`).join('')}</details>` : ''}`
        : `<p class="faint">No position yet. What do you currently hold about this, and how sure are you?</p>`}
      <button class="btn sm" id="trRevise">${cur ? 'Revise position' : 'State a position'}</button>
    </section>
    <article class="tr-body prose">${(n.body || '').trim() ? treeRender(n.body) : '<p class="faint">Nothing written here yet.</p>'}</article>
    <section class="tr-question"><span class="tr-lbl">What would change my mind?</span>${(n.openQuestion || '').trim() ? `<div>${treeRender(n.openQuestion)}</div>` : '<p class="faint">Not yet asked.</p>'}</section>`}
    <section class="tr-sec"><div class="tr-sechead"><h2>Beneath it</h2><span class="faint">${kids.length || 'nothing yet'}</span><span class="tr-grow"></span><button class="tbtn" id="trChild">＋ ${n.kind === 'root' ? 'Branch' : 'Point'} here</button></div>
      ${points > 15 ? `<p class="tr-warn">${points} points under one page. Some may belong on a branch of their own.</p>` : ''}
      ${kids.length ? `<ul class="tr-kids">${kids.map(k => { const c = treeCurrentPosition(k.id); return `<li>${treeKindMark(k)}<a href="${treeUrl(k)}">${esc(k.title)}</a>${treeBadge(k)}${c ? `<span class="faint">${c.confidence}%</span>` : ''}</li>`; }).join('')}</ul>` : ''}</section>
    <section class="tr-sec"><div class="tr-sechead"><h2>Leaves</h2><span class="faint">what this rests on, from the other rooms</span><span class="tr-grow"></span><button class="tbtn" id="trLeaf">＋ Attach</button></div>
      ${leaves.length ? `<ul class="tr-leaves">${leaves.map(l => { const e = byId(S.entries, l.entryId);
        return `<li class="tr-leaf ${l.room}"><span class="tr-room">${{library: 'Library', journal: 'Journal', writing: 'Writing'}[l.room]}</span>${e ? treeEntryLinkHTML(e) : '<span class="faint">(the entry is gone from its room)</span>'}${l.note ? `<span class="faint"> — ${esc(l.note)}</span>` : ''}<button class="tbtn sm" data-trunleaf="${l.id}" aria-label="Detach">×</button></li>`; }).join('')}</ul>`
        : (n.kind === 'point' ? '<p class="tr-warn soft">Citation needed: nothing in the Library, Journal or Writing is attached yet.</p>' : '')}</section>
    ${treeGraftsHTML(n)}
    ${treeProofOnPageHTML(n)}
    <section class="tr-sec"><div class="tr-sechead"><h2>What links here</h2><span class="faint">${back.length || 'nothing yet'}</span></div>
      ${back.length ? `<ul class="tr-back">${back.map(b => `<li>${treeKindMark(b)}<a href="${treeUrl(b)}">${esc(b.title)}</a></li>`).join('')}</ul>` : ''}</section>
  </div>`;
  treeBindNav(root);
  if(editing) return treeBindEditForm(root, n);
  root.querySelector('#trEdit').onclick = () => { ui.editing = n.id; treePageRoute(root, n); };
  root.querySelector('#trRevise').onclick = () => treeReviseDialog(n, () => treePageRoute(root, treeNode(n.id)));
  root.querySelector('#trChild').onclick = () => treeNewPageDialog({parentId: n.id, kind: n.kind === 'root' ? 'branch' : 'point'});
  root.querySelector('#trLeaf').onclick = () => treeLeafDialog(n, () => treePageRoute(root, n));
  root.querySelectorAll('[data-trunleaf]').forEach(b => b.onclick = () => { treeDetachLeaf(b.dataset.trunleaf); treePageRoute(root, n); });
  root.querySelector('#trMore').onclick = ev => treeMenu(ev.currentTarget, [
    ['Add an alias', async () => { const a = await treeAsk('Another name for this page', ''); if(a){ const e = treeAddAlias(n.id, a); if(e) toast(e); treePageRoute(root, n); } }],
    ['Graft to another page', () => treeGraftDialog(n, () => treePageRoute(root, n))],
    ['Seal a prediction', () => treePredictDialog(n, () => treePageRoute(root, n))],
    ['Record an experiment', () => treeExperimentDialog(n, () => treePageRoute(root, n))],
    ['Review it now', () => treeReviewDialog(n, () => treePageRoute(root, n))],
    ...Object.keys(TREE_STATUS).filter(s => s !== n.status).map(s => [`Mark ${TREE_STATUS[s].toLowerCase()}`, () => { treeSetStatus(n.id, s); treePageRoute(root, n); }])
  ]);
  treeBindGrafts(root, n);
  treeBindProof(root, n);
  treeTouchView(n);
}
function treeTouchView(n){ /* opening a page is not tending it; only an action is */ S._tree.lastOpened = n.id; }
function treeEntryLinkHTML(e){
  const room = treeRoomOf(e), t = esc(e.title || String(e.body || '').slice(0, 60) || 'untitled');
  if(room === 'library') return `<a href="#/journals/library" data-trmedia="${e.id}">${t}</a>`;
  if(room === 'writing') return `<a href="#/writing/${e.id}">${t}</a>`;
  return `<a href="#" data-trjournal="${esc(String(e.occurredAt || e.createdAt || '').slice(0, 10))}">${t}</a> <span class="faint">${esc(String(e.occurredAt || e.createdAt || '').slice(0, 10))}</span>`;
}

/* ---------- editing a page ---------- */
function treeParentOptions(n, kind){
  const want = kind === 'point' ? ['branch', 'root', 'point'] : ['root', 'branch'];
  const bad = new Set(); if(n && n.id){ const stack = [n.id]; while(stack.length){ const id = stack.pop(); bad.add(id); (treeIndex().kids.get(id) || []).forEach(k => stack.push(k.id)); } }
  const list = S.treeNodes.filter(x => want.includes(x.kind) && !bad.has(x.id) && x.status !== 'pruned');
  const label = x => [...treeAncestors(x).map(a => a.title), x.title].join(' › ');
  return list.map(x => [x.id, label(x)]).sort((a, b) => a[1].localeCompare(b[1]));
}
function treeEditFormHTML(n){
  return `<form class="tr-edit" onsubmit="return false">
    <label class="tr-f"><span>Title</span><input class="inp" id="teTitle" value="${esc(n.title)}"></label>
    <div class="tr-frow"><label class="tr-f"><span>Kind</span><select class="sel" id="teKind">${Object.entries(TREE_KINDS).map(([k, v]) => `<option value="${k}"${n.kind === k ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="tr-f grow"><span>Home in the tree</span><select class="sel" id="teParent"><option value="">(none — a root)</option>${treeParentOptions(n, n.kind).map(([id, l]) => `<option value="${id}"${n.parentId === id ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
      <label class="tr-f"><span>Status</span><select class="sel" id="teStatus">${Object.entries(TREE_STATUS).map(([k, v]) => `<option value="${k}"${n.status === k ? ' selected' : ''}>${v}</option>`).join('')}</select></label></div>
    <label class="tr-f"><span>Text <small>markdown; [[Page]], [[Page|shown as]], [[library:Title]], [[journal:2025-03-01]], [[writing:Title]]</small></span><textarea class="inp tr-ta" id="teBody" rows="14">${esc(n.body || '')}</textarea></label>
    <label class="tr-f"><span>What would change my mind?</span><textarea class="inp" id="teQ" rows="3">${esc(n.openQuestion || '')}</textarea></label>
    <p class="tr-err" id="teErr" role="alert"></p>
    <div class="row" style="gap:8px"><button class="btn primary" id="teSave">Save</button><button class="btn ghost" id="teCancel">Cancel</button></div>
  </form>`;
}
function treeBindEditForm(root, n){
  const $e = id => root.querySelector(id);
  treeAutocomplete($e('#teBody')); treeAutocomplete($e('#teQ'));
  $e('#teKind').onchange = () => { const k = $e('#teKind').value, cur = $e('#teParent').value;
    $e('#teParent').innerHTML = `<option value="">(none — a root)</option>` + treeParentOptions(n, k).map(([id, l]) => `<option value="${id}"${cur === id ? ' selected' : ''}>${esc(l)}</option>`).join(''); };
  $e('#teCancel').onclick = () => { S._tree.editing = null; treePageRoute(root, n); };
  $e('#teSave').onclick = () => {
    const kind = $e('#teKind').value, parentId = $e('#teParent').value || null;
    const r = treeSavePage({id: n.id, title: $e('#teTitle').value, kind: parentId ? kind : (kind === 'root' ? 'root' : kind), parentId, status: $e('#teStatus').value, body: $e('#teBody').value, openQuestion: $e('#teQ').value, lastTendedAt: treeNow()});
    if(r.error){ $e('#teErr').textContent = r.error; return; }
    if(r.warn) toast(r.warn, 5000);
    S._tree.editing = null;
    if(r.node.slug !== n.slug) navigate(treeUrl(r.node)); else treePageRoute(root, r.node);
  };
}
/* a new page: title, kind and home; a point cannot be made without a parent */
function treeNewPageDialog(o){
  const pre = Object.assign({title: '', kind: 'point', parentId: null}, o);
  if(!S.treeNodes.length) pre.kind = 'root';
  const exists = pre.title ? treeResolve(pre.title) : null;
  if(exists){ navigate(treeUrl(exists)); return; }
  const m = openModal(`<h2 class="serif">A new page</h2>
    <label class="tr-f"><span>Title</span><input class="inp" id="tnTitle" value="${esc(pre.title)}" autocomplete="off"></label>
    <div class="tr-similar" id="tnSim"></div>
    <div class="tr-frow"><label class="tr-f"><span>Kind</span><select class="sel" id="tnKind">${Object.entries(TREE_KINDS).map(([k, v]) => `<option value="${k}"${pre.kind === k ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="tr-f grow"><span>Home in the tree</span><select class="sel" id="tnParent"></select></label></div>
    <label class="tr-f"><span>First lines <small>optional</small></span><textarea class="inp" id="tnBody" rows="4"></textarea></label>
    <p class="tr-err" id="tnErr" role="alert"></p>
    <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" id="tnNo">Cancel</button><button class="btn primary" id="tnOk">Create</button></div>`, 'narrow');
  const $m = id => m.querySelector(id);
  const fill = () => { const k = $m('#tnKind').value, cur = $m('#tnParent').value || pre.parentId;
    $m('#tnParent').innerHTML = (k === 'root' ? `<option value="">(none — a root)</option>` : `<option value="">choose…</option>`) + treeParentOptions(null, k).map(([id, l]) => `<option value="${id}"${cur === id ? ' selected' : ''}>${esc(l)}</option>`).join(''); };
  fill(); $m('#tnKind').onchange = fill;
  treeAutocomplete($m('#tnBody'));
  const sim = () => { const q = $m('#tnTitle').value.trim(); const s = q.length > 2 ? treeSuggestTitles(q, 4) : [];
    $m('#tnSim').innerHTML = s.length ? `Already in the tree: ${s.map(x => `<a href="${treeUrl(x.node)}">${esc(x.node.title)}</a>`).join(', ')}` : ''; };
  $m('#tnTitle').oninput = sim; sim(); setTimeout(() => $m('#tnTitle').focus(), 40);
  $m('#tnNo').onclick = () => m.remove();
  $m('#tnOk').onclick = () => {
    const kind = $m('#tnKind').value, parentId = $m('#tnParent').value || null;
    const r = treeSavePage({title: $m('#tnTitle').value, kind, parentId, body: $m('#tnBody').value, status: 'stub'});
    if(r.error){ $m('#tnErr').textContent = r.error; return; }
    if(r.warn) toast(r.warn, 5000);
    m.remove(); if(o.after) o.after(r.node); else navigate(treeUrl(r.node));
  };
}
/* revising a position adds one; nothing is edited */
function treeReviseDialog(n, after){
  const cur = treeCurrentPosition(n.id);
  const m = openModal(`<h2 class="serif">${cur ? 'Revise' : 'State'} your position</h2><p class="faint">${esc(n.title)}${cur ? ` — you held this at ${cur.confidence}%:` : ''}</p>
    ${cur ? `<blockquote class="tr-was">${esc(cur.statement)}</blockquote>` : ''}
    <label class="tr-f"><span>What you hold now</span><textarea class="inp" id="tpS" rows="3">${esc(cur ? cur.statement : '')}</textarea></label>
    <label class="tr-f"><span>How sure, 0–100 <b id="tpV">${cur ? cur.confidence : 50}</b></span><input type="range" min="0" max="100" id="tpC" value="${cur ? cur.confidence : 50}"></label>
    <p class="faint">Saved positions are never edited or removed; a change of mind is a new one, and the old stays on the record.</p>
    <p class="tr-err" id="tpErr"></p>
    <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" id="tpNo">Cancel</button><button class="btn primary" id="tpOk">Add position</button></div>`, 'narrow');
  const $m = id => m.querySelector(id);
  $m('#tpC').oninput = () => $m('#tpV').textContent = $m('#tpC').value;
  $m('#tpNo').onclick = () => m.remove();
  $m('#tpOk').onclick = () => { const r = treeAddPosition(n.id, $m('#tpS').value, $m('#tpC').value); if(r.error){ $m('#tpErr').textContent = r.error; return; } m.remove(); after && after(r.position); };
}
function treeLeafDialog(n, after){
  const pool = (S.entries || []).filter(e => treeRoomOf(e)).sort((a, b) => String(b.occurredAt || b.createdAt || '').localeCompare(String(a.occurredAt || a.createdAt || '')));
  const m = openModal(`<h2 class="serif">Attach a leaf</h2><p class="faint">An entry from the Library, the Journal or the Writing Studio. It stays where it is; the page only points at it.</p>
    <div class="tr-frow"><input class="inp grow" id="tlQ" placeholder="search titles and text"><select class="sel" id="tlRoom"><option value="">every room</option><option value="library">Library</option><option value="journal">Journal</option><option value="writing">Writing</option></select></div>
    <div class="tr-picklist" id="tlList"></div>
    <label class="tr-f"><span>Why it belongs <small>optional</small></span><input class="inp" id="tlNote"></label>`, 'narrow');
  const $m = id => m.querySelector(id);
  const paint = () => { const q = $m('#tlQ').value.trim().toLowerCase(), room = $m('#tlRoom').value;
    const list = pool.filter(e => (!room || treeRoomOf(e) === room) && (!q || ((e.title || '') + ' ' + (e.body || '')).toLowerCase().includes(q))).slice(0, 40);
    $m('#tlList').innerHTML = list.map(e => `<button type="button" data-tl="${e.id}"><span class="tr-room">${treeRoomOf(e)}</span><b>${esc(e.title || String(e.body || '').slice(0, 60) || 'untitled')}</b><span class="faint">${esc(String(e.occurredAt || e.createdAt || '').slice(0, 10))}</span></button>`).join('') || '<p class="faint">Nothing matches.</p>';
    $m('#tlList').querySelectorAll('[data-tl]').forEach(b => b.onclick = () => { const err = treeAttachLeaf(n.id, b.dataset.tl, $m('#tlNote').value); if(err) toast(err); m.remove(); after && after(); }); };
  $m('#tlQ').oninput = paint; $m('#tlRoom').onchange = paint; paint(); setTimeout(() => $m('#tlQ').focus(), 40);
}
function treeMenu(anchor, items){
  document.querySelectorAll('.tr-menu').forEach(x => x.remove());
  const m = document.createElement('div'); m.className = 'tr-menu'; m.setAttribute('role', 'menu');
  m.innerHTML = items.map(([n], i) => `<button role="menuitem" data-i="${i}">${esc(n)}</button>`).join('');
  document.body.appendChild(m);
  const r = anchor.getBoundingClientRect();
  m.style.top = Math.min(innerHeight - m.offsetHeight - 8, r.bottom + 4) + 'px'; m.style.left = Math.max(8, Math.min(innerWidth - m.offsetWidth - 8, r.right - m.offsetWidth)) + 'px';
  m.querySelectorAll('button').forEach(b => b.onclick = () => { m.remove(); items[+b.dataset.i][1](); });
  setTimeout(() => document.addEventListener('click', function off(e){ if(!m.contains(e.target)){ m.remove(); document.removeEventListener('click', off); } }), 0);
}
function treeAsk(title, value){
  return new Promise(res => {
    const m = openModal(`<h2 class="serif">${esc(title)}</h2><input class="inp" id="taQ" value="${esc(value || '')}"><div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn ghost" id="taNo">Cancel</button><button class="btn primary" id="taOk">OK</button></div>`, 'narrow');
    const i = m.querySelector('#taQ'); setTimeout(() => i.focus(), 30);
    const done = v => { m.remove(); res(v); };
    m.querySelector('#taOk').onclick = () => done(i.value.trim()); m.querySelector('#taNo').onclick = () => done(null);
    i.onkeydown = e => { if(e.key === 'Enter') done(i.value.trim()); if(e.key === 'Escape') done(null); };
  });
}

/* ---------- the outline ---------- */
function treeOutlineHTML(nodes, depth){
  const open = S.treePrefs.outlineOpen;
  return `<ul class="tr-ol${depth ? '' : ' top'}">${nodes.map(n => { const kids = treeChildren(n.id), isOpen = open[n.id] !== false, c = treeCurrentPosition(n.id);
    return `<li class="${n.kind} ${n.status}"><div class="tr-olrow">${kids.length ? `<button class="tr-tw" data-trtw="${n.id}" aria-expanded="${isOpen}">${isOpen ? '▾' : '▸'}</button>` : '<span class="tr-tw"></span>'}
      ${treeKindMark(n)}<a href="${treeUrl(n)}">${esc(n.title)}</a>${n.status !== 'active' ? treeBadge(n) : ''}${c ? `<span class="tr-olc" style="--c:${c.confidence}">${c.confidence}%</span>` : ''}${kids.length ? `<span class="faint">${kids.length}</span>` : ''}</div>
      ${kids.length && isOpen ? treeOutlineHTML(kids, depth + 1) : ''}</li>`; }).join('')}</ul>`;
}
function treeOutlineRoute(root){
  const roots = treeRoots();
  root.innerHTML = `<div class="page tr-page">${treeNav('outline')}
    <header class="tr-head"><h1 class="serif">Outline</h1><div class="tr-headrow"><span class="faint">${S.treeNodes.length} pages · ${roots.length} roots</span><span class="tr-grow"></span>
      <button class="tbtn" id="trAllOpen">Open all</button><button class="tbtn" id="trAllShut">Fold all</button>
      <label class="tr-chk"><input type="checkbox" id="trPruned"${S.treePrefs.showPruned ? ' checked' : ''}> show pruned</label></div></header>
    ${roots.length ? treeOutlineHTML(roots, 0) : '<p class="faint">The tree has no roots yet. A root is one of the great questions — how does the world really work? what is mind? — and everything else grows under one.</p>'}
  </div>`;
  treeBindNav(root);
  root.querySelectorAll('[data-trtw]').forEach(b => b.onclick = () => { const id = b.dataset.trtw; S.treePrefs.outlineOpen[id] = S.treePrefs.outlineOpen[id] === false; save(); treeOutlineRoute(root); });
  root.querySelector('#trAllOpen').onclick = () => { S.treePrefs.outlineOpen = {}; save(); treeOutlineRoute(root); };
  root.querySelector('#trAllShut').onclick = () => { S.treeNodes.forEach(n => S.treePrefs.outlineOpen[n.id] = false); save(); treeOutlineRoute(root); };
  root.querySelector('#trPruned').onchange = e => { S.treePrefs.showPruned = e.target.checked; save(); treeOutlineRoute(root); };
}
