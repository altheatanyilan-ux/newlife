/* ============================================================
   THE KNOWLEDGE TREE — the other rooms, and getting things in.

   Quick capture: Alt+K from any room (read from the key's code, so it works
   on a Mac where Alt changes the character; ignored inside a text field).
   The capture waits in the inbox until it is given a home or becomes a page.

   Finishing a work in the Library asks what point you took from it and where
   it belongs — or you skip. Saving a journal entry looks for page titles and
   aliases in what you wrote and offers them; nothing is attached unless you
   accept it, and a dismissed suggestion is not offered again.

   Search reaches every room, filtered by room, branch, status and date.
   ============================================================ */

/* ---------- the home ---------- */
function treeHomeRoute(root){
  const s = treeWeekSummary();
  const age = treeExportAgeDays();
  const due = treeDueReviews().length, tens = S.treeGrafts.filter(g => g.type === 'contradicts' && !g.resolvedAt).length;
  root.innerHTML = `<div class="page tr-page tr-home">
    ${treeNav('')}
    <header class="tr-head"><h1 class="serif">Knowledge Tree</h1>
      <p class="tr-lede">How the world really works — worked out slowly, one page at a time, in your own words. The software chooses what to put in front of you; you decide what to conclude.</p></header>
    ${S.treeNodes.length && (age === null || age > 30) ? `<div class="tr-backup"><span>${age === null ? 'The tree has never been exported.' : `The last export was ${age} days ago.`} A copy somewhere safe costs a click.</span><button class="btn sm" id="trExport">Export the tree</button></div>` : ''}
    <section class="tr-tend" id="trTend">${treeTendCardHTML()}</section>
    ${s ? `<section class="tr-sec tr-week"><div class="tr-sechead"><h2>This week</h2><span class="faint">${esc(s.range)}</span></div>
      <div class="tr-weekgrid">${[['new pages', s.newPages], ['red links turned blue', s.blued], ['positions revised', s.revised], ['branches pruned', s.pruned], ['open tensions', s.tensions]].map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join('')}</div></section>` : ''}
    <div class="tr-homegrid">
      <section class="tr-sec"><div class="tr-sechead"><h2>The tree</h2><span class="faint">${S.treeNodes.length} pages</span><span class="tr-grow"></span><a class="tbtn" href="#/tree/outline">Outline</a></div>
        ${treeRoots().length ? treeOutlineHTML(treeRoots(), 0) : `<div class="tr-empty"><p>Nothing has taken root yet.</p><p class="faint">Start with a root — one of the great questions — and let branches and points grow under it.</p><button class="btn primary" id="trFirst">Plant the first root</button></div>`}</section>
      <aside class="tr-side">
        <a class="tr-tile" href="#/tree/inbox"><b>${S.treeInbox.length}</b><span>in the inbox</span></a>
        <a class="tr-tile" href="#/tree/tensions"><b>${tens}</b><span>open tensions</span></a>
        <a class="tr-tile" href="#/tree/gaps"><b>${treeGaps().total}</b><span>gaps</span></a>
        <a class="tr-tile" href="#/tree/proof"><b>${S.treePredictions.filter(p => !p.resolvedAt).length}</b><span>sealed predictions</span></a>
        <div class="tr-tile quiet"><b>${due}</b><span>due to resurface</span></div>
        <div class="tr-keys faint"><kbd>Alt</kbd>+<kbd>K</kbd> quick capture, from any room</div>
        <div class="row" style="gap:6px;flex-wrap:wrap"><button class="tbtn" id="trExp2">Export</button><label class="tbtn" style="cursor:pointer">Import<input type="file" accept=".json,application/json" id="trImp" hidden></label></div>
      </aside>
    </div>
  </div>`;
  treeBindNav(root);
  treeBindTend(root);
  root.querySelectorAll('[data-trtw]').forEach(b => b.onclick = () => { const id = b.dataset.trtw; S.treePrefs.outlineOpen[id] = S.treePrefs.outlineOpen[id] === false; save(); treeHomeRoute(root); });
  const first = root.querySelector('#trFirst'); if(first) first.onclick = () => treeNewPageDialog({kind: 'root'});
  [root.querySelector('#trExport'), root.querySelector('#trExp2')].forEach(b => b && (b.onclick = () => { treeExport(); toast('The tree was exported.'); treeHomeRoute(root); }));
  root.querySelector('#trImp').onchange = async e => { const f = e.target.files[0]; if(!f) return;
    try { const r = treeImport(JSON.parse(await f.text())); if(r.error) toast(r.error); else toast(`Imported: ${Object.values(r.added).reduce((a, b) => a + b, 0)} records added, ${r.kept} already here and left as they are.`, 6000); } catch(err){ toast('That file could not be read.'); }
    treeHomeRoute(root); };
}

/* ---------- quick capture ---------- */
function treeQuickCapture(){
  treeEnsure();
  const m = openModal(`<h2 class="serif">Into the tree</h2><p class="faint">A thought, a question, a claim to check. It waits in the Knowledge Tree's inbox until it has a home.</p>
    <textarea class="inp" id="tqT" rows="4" placeholder="…"></textarea>
    <div class="row" style="justify-content:space-between;gap:8px;margin-top:10px"><span class="faint">Ctrl/⌘+Enter to keep it</span><span class="row" style="gap:8px"><button class="btn ghost" id="tqNo">Cancel</button><button class="btn primary" id="tqOk">Keep it</button></span></div>`, 'narrow');
  const t = m.querySelector('#tqT'); setTimeout(() => t.focus(), 30);
  const ok = () => { if(treeCapture(t.value)){ toast('In the inbox.'); m.remove(); if(location.hash.startsWith('#/tree')) rerender(); } };
  m.querySelector('#tqOk').onclick = ok; m.querySelector('#tqNo').onclick = () => m.remove();
  t.onkeydown = e => { if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)){ e.preventDefault(); ok(); } };
}
document.addEventListener('keydown', ev => {
  if(!ev.altKey || ev.ctrlKey || ev.metaKey || ev.code !== 'KeyK') return;
  const t = ev.target; if(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  if(typeof S === 'undefined' || !S) return;
  ev.preventDefault(); treeQuickCapture();
});

/* ---------- the inbox ---------- */
function treeInboxRoute(root){
  const items = S.treeInbox.slice().sort((a, b) => a.createdAt < b.createdAt ? -1 : 1);
  root.innerHTML = `<div class="page tr-page">${treeNav('inbox')}
    <header class="tr-head"><h1 class="serif">Inbox</h1><div class="tr-headrow"><span class="faint">${items.length ? `${items.length} waiting for a home` : 'Empty.'}</span><span class="tr-grow"></span><button class="tbtn" id="trCap">＋ Capture</button></div></header>
    <ul class="tr-inbox">${items.map(x => `<li data-trin="${x.id}"><p>${esc(x.text)}</p><span class="faint">${esc(fmtDate(x.createdAt.slice(0, 10), 'med'))}</span>
      <div class="row"><button class="tbtn" data-tra="page">Make it a page</button><button class="tbtn" data-tra="attach">Add to a page</button><button class="tbtn" data-tra="drop">Let it go</button></div></li>`).join('')}</ul>
  </div>`;
  treeBindNav(root);
  root.querySelector('#trCap').onclick = () => treeQuickCapture();
  root.querySelectorAll('[data-trin]').forEach(li => { const x = S.treeInbox.find(i => i.id === li.dataset.trin);
    li.querySelectorAll('[data-tra]').forEach(b => b.onclick = async () => {
      const a = b.dataset.tra;
      if(a === 'drop'){ treeInboxDone(x.id); treeInboxRoute(root); return; }
      if(a === 'page'){ treeNewPageDialog({title: x.text.length <= 80 ? x.text : '', kind: 'point', after: n => { if(x.text.length > 80) treeSavePage({id: n.id, body: x.text}); treeInboxDone(x.id); navigate(treeUrl(n)); }}); return; }
      /* add to an existing page: the text goes to the end of its body */
      const pick = await treePickPage('Which page does this belong to?');
      if(!pick) return;
      const n = treeNode(pick); treeSavePage({id: n.id, body: (n.body || '').trimEnd() + '\n\n' + x.text, lastTendedAt: treeNow()}); treeInboxDone(x.id); toast(`Added to ${n.title}.`); treeInboxRoute(root);
    }); });
}
function treePickPage(title){
  return new Promise(res => {
    const m = openModal(`<h2 class="serif">${esc(title)}</h2><input class="inp" id="tpkQ" placeholder="search pages" autocomplete="off"><div class="tr-picklist" id="tpkL"></div>`, 'narrow');
    const q = m.querySelector('#tpkQ'), L = m.querySelector('#tpkL');
    const paint = () => { const s = q.value.trim(); const list = s ? treeSuggestTitles(s, 12).map(x => x.node) : S.treeNodes.slice().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, 12);
      L.innerHTML = list.map(n => `<button type="button" data-p="${n.id}">${treeKindMark(n)}<b>${esc(n.title)}</b><span class="faint">${esc(treeAncestors(n).map(a => a.title).join(' › '))}</span></button>`).join('') || '<p class="faint">No pages match.</p>';
      L.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { m.remove(); res(b.dataset.p); }); };
    q.oninput = paint; paint(); setTimeout(() => q.focus(), 30);
    m.querySelector('.close').addEventListener('click', () => res(null));
  });
}

/* ---------- the Library: finishing a work asks one question ---------- */
function treeLibraryPrompt(entry){
  if(!entry || entry.type !== 'media') return;
  treeEnsure();
  const m = openModal(`<h2 class="serif">You finished ${esc(entry.title || 'it')}</h2>
    <p>What point did you take from this, and where does it belong?</p>
    <textarea class="inp" id="tlpT" rows="3" placeholder="the point, in a sentence"></textarea>
    <div class="tr-frow"><button class="btn sm ghost" id="tlpWhere">Choose a page…</button><span class="faint" id="tlpPage">no page yet — it will wait in the inbox</span></div>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn ghost" id="tlpSkip">Skip</button><button class="btn primary" id="tlpOk">Keep it</button></div>`, 'narrow');
  let page = null;
  m.querySelector('#tlpWhere').onclick = async () => { const id = await treePickPage('Where does it belong?'); if(id){ page = id; m.querySelector('#tlpPage').textContent = '→ ' + treeNode(id).title; } };
  m.querySelector('#tlpSkip').onclick = () => m.remove();
  m.querySelector('#tlpOk').onclick = () => {
    const t = m.querySelector('#tlpT').value.trim();
    if(page){ treeAttachLeaf(page, entry.id, t); if(t){ const n = treeNode(page); treeSavePage({id: n.id, body: (n.body || '').trimEnd() + `\n\n${t} — [[library:${entry.title}]]`}); } toast('Attached to ' + treeNode(page).title + '.'); }
    else if(t) { treeCapture(`${t} — from [[library:${entry.title}]]`); toast('In the Tree\'s inbox.'); }
    m.remove();
  };
}

/* ---------- the Journal: suggestions, offered, never attached by themselves ---------- */
function treeSuggestFor(entry){
  if(!entry || treeRoomOf(entry) !== 'journal' || !S.treeNodes.length) return [];
  const text = ' ' + treeSlug((entry.title || '') + ' ' + (entry.body || '')).replace(/-/g, ' ') + ' ';
  const dismissed = new Set(S.treePrefs.dismissed || []), attached = new Set(S.treeLeaves.filter(l => l.entryId === entry.id).map(l => l.nodeId));
  const out = new Map();
  const test = (name, n) => { const k = treeSlug(name).replace(/-/g, ' '); if(k.length < 4) return;
    if(text.includes(' ' + k + ' ') && !attached.has(n.id) && !dismissed.has(entry.id + ':' + n.id) && n.status !== 'pruned') out.set(n.id, n); };
  S.treeNodes.forEach(n => test(n.title, n));
  S.treeAliases.forEach(a => { const n = treeNode(a.nodeId); if(n) test(a.title || a.alias, n); });
  return [...out.values()].slice(0, 5);
}
function treeAfterEntrySave(entry){
  const list = treeSuggestFor(entry); if(!list.length) return;
  document.querySelectorAll('.tr-suggest').forEach(x => x.remove());
  const box = document.createElement('div'); box.className = 'tr-suggest'; box.setAttribute('role', 'status');
  box.innerHTML = `<div class="tr-sgh"><b>Knowledge Tree</b><span class="faint">this entry mentions</span><button class="tbtn sm" data-x aria-label="Close">×</button></div>
    ${list.map(n => `<div class="tr-sgrow" data-n="${n.id}"><a href="${treeUrl(n)}">${esc(n.title)}</a><button class="tbtn sm" data-ok>Attach as a leaf</button><button class="tbtn sm" data-no>Not this</button></div>`).join('')}`;
  document.body.appendChild(box);
  box.querySelector('[data-x]').onclick = () => box.remove();
  box.querySelectorAll('.tr-sgrow').forEach(r => {
    r.querySelector('[data-ok]').onclick = () => { treeAttachLeaf(r.dataset.n, entry.id, ''); r.remove(); toast('Attached.'); if(!box.querySelector('.tr-sgrow')) box.remove(); };
    r.querySelector('[data-no]').onclick = () => { S.treePrefs.dismissed.push(entry.id + ':' + r.dataset.n); save(); r.remove(); if(!box.querySelector('.tr-sgrow')) box.remove(); };
  });
  setTimeout(() => box.remove(), 30000);
}

/* ---------- search across every room ---------- */
function treeSearchState(){ const u = S._tree = S._tree || {}; return u.search = u.search || {q: '', room: '', branch: '', status: '', from: '', to: ''}; }
function treeUnder(n, branchId){ if(!branchId) return true; let x = n, g = 0; while(x && g++ < 60){ if(x.id === branchId) return true; x = x.parentId ? treeNode(x.parentId) : null; } return false; }
function treeSearch(f){
  const q = String(f.q || '').trim().toLowerCase(), words = q.split(/\s+/).filter(Boolean);
  const hit = s => words.every(w => s.includes(w));
  const inDate = d => (!f.from || d >= f.from) && (!f.to || d <= f.to + '￿');
  const out = [];
  if(!f.room || f.room === 'tree') S.treeNodes.forEach(n => {
    if(f.status && n.status !== f.status) return; if(!treeUnder(n, f.branch)) return; if(!inDate(String(n.updatedAt || n.createdAt || ''))) return;
    const pos = treeCurrentPosition(n.id);
    const text = (n.title + ' ' + (n.body || '') + ' ' + (n.openQuestion || '') + ' ' + (pos ? pos.statement : '') + ' ' + S.treeAliases.filter(a => a.nodeId === n.id).map(a => a.title).join(' ')).toLowerCase();
    if(!q || hit(text)) out.push({room: 'tree', title: n.title, date: String(n.updatedAt || '').slice(0, 10), href: treeUrl(n), snippet: treeSnippet(n.body || (pos && pos.statement) || '', words), node: n});
  });
  if(f.room !== 'tree') (S.entries || []).forEach(e => {
    const room = treeRoomOf(e); if(!room || (f.room && f.room !== room)) return;
    if(f.branch && !S.treeLeaves.some(l => l.entryId === e.id && treeUnder(treeNode(l.nodeId), f.branch))) return;
    if(f.status) return;
    const d = String(e.occurredAt || e.createdAt || '').slice(0, 10); if(!inDate(d)) return;
    const text = ((e.title || '') + ' ' + (e.body || '') + ' ' + JSON.stringify(e.extra && e.extra.oneLineCapture || '')).toLowerCase();
    if(q && !hit(text)) return;
    out.push({room, title: e.title || String(e.body || '').slice(0, 60) || 'untitled', date: d, entry: e, snippet: treeSnippet(e.body || '', words)});
  });
  return out.sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 300);
}
function treeSnippet(text, words){
  const s = String(text || '').replace(/\s+/g, ' ');
  const i = words.length ? s.toLowerCase().indexOf(words[0]) : 0;
  const cut = s.slice(Math.max(0, i - 60), Math.max(0, i - 60) + 180);
  let h = esc(cut); words.forEach(w => { if(w.length > 1) h = h.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), m => `<mark>${m}</mark>`); });
  return h;
}
function treeSearchRoute(root){
  const f = treeSearchState();
  const branches = S.treeNodes.filter(n => n.kind !== 'point').sort((a, b) => a.title.localeCompare(b.title));
  root.innerHTML = `<div class="page tr-page">${treeNav('search')}
    <header class="tr-head"><h1 class="serif">Search</h1></header>
    <div class="tr-filters">
      <input class="inp grow" id="tsQ" value="${esc(f.q)}" placeholder="words, in any order" aria-label="Search">
      <select class="sel" id="tsRoom"><option value="">every room</option>${[['tree', 'the Tree'], ['library', 'Library'], ['journal', 'Journal'], ['writing', 'Writing']].map(([k, v]) => `<option value="${k}"${f.room === k ? ' selected' : ''}>${v}</option>`).join('')}</select>
      <select class="sel" id="tsBranch"><option value="">any branch</option>${branches.map(b => `<option value="${b.id}"${f.branch === b.id ? ' selected' : ''}>${esc(b.title)}</option>`).join('')}</select>
      <select class="sel" id="tsStatus"><option value="">any status</option>${Object.entries(TREE_STATUS).map(([k, v]) => `<option value="${k}"${f.status === k ? ' selected' : ''}>${v}</option>`).join('')}</select>
      <label class="tr-date">from <input class="inp" type="date" id="tsFrom" value="${esc(f.from)}"></label><label class="tr-date">to <input class="inp" type="date" id="tsTo" value="${esc(f.to)}"></label>
    </div>
    <div id="tsOut"></div></div>`;
  treeBindNav(root);
  const paint = () => {
    const r = treeSearch(f), out = root.querySelector('#tsOut');
    out.innerHTML = `<p class="faint">${r.length} found${r.length === 300 ? ' (the first 300)' : ''}</p><ul class="tr-results">${r.map(x => `<li class="${x.room}"><span class="tr-room">${{tree: 'Tree', library: 'Library', journal: 'Journal', writing: 'Writing'}[x.room]}</span>
      ${x.href ? `<a href="${x.href}">${esc(x.title)}</a>` : treeEntryLinkHTML(x.entry)}${x.node ? treeBadge(x.node) : ''}<span class="faint">${esc(x.date || '')}</span>${x.snippet ? `<p>${x.snippet}</p>` : ''}</li>`).join('')}</ul>`;
    treeBindLinks(out);
  };
  const bind = (id, k, ev) => root.querySelector(id)[ev || 'onchange'] = e => { f[k] = e.target.value; paint(); };
  bind('#tsQ', 'q', 'oninput'); bind('#tsRoom', 'room'); bind('#tsBranch', 'branch'); bind('#tsStatus', 'status'); bind('#tsFrom', 'from'); bind('#tsTo', 'to');
  paint(); root.querySelector('#tsQ').focus();
}
