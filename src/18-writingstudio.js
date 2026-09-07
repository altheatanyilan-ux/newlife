/* ============================================================
   THE WRITING STUDIO — the Scrivener layer

   The desk used to hold one piece of text per project. That works
   for a note and breaks for anything long: you cannot restructure
   what you cannot see the shape of, and you cannot see the shape of
   a single scrolling field.

   So a project now holds a BINDER — a tree of folders and documents,
   each with its own text, synopsis, notes, status and snapshots. The
   same tree is read four ways: as an editor for one document, as a
   corkboard of synopsis cards you can rearrange, as an outliner with
   the metadata in columns, and as a manuscript that stitches every
   descendant into one continuous draft you can still edit in place.

   The old single body becomes the first document in the binder, so
   nothing written before this is lost or moved.
   ============================================================ */

const WS_NODE_KINDS = {folder:['📁','Folder'], doc:['📄','Document'], research:['🔖','Research']};
const WS_DOC_STATUS = ['to do','first draft','revised','polished','final'];
const WS_LABELS = [
  ['none',     'No label',  'var(--muted)'],
  ['chapter',  'Chapter',   'var(--page-accent)'],
  ['scene',    'Scene',     'var(--sage)'],
  ['notes',    'Notes',     'var(--gold)'],
  ['research', 'Research',  'var(--ment)'],
  ['idea',     'Idea',      'var(--terra)'],
];
const wsLabel = k => WS_LABELS.find(l => l[0] === k) || WS_LABELS[0];

/* ---------- the document model ---------- */
function wsNewNode(type = 'doc', name = ''){
  return {id:uid(), type, name, children: type === 'folder' ? [] : undefined,
    body:'', synopsis:'', notes:'', status:'to do', label:'none', target:0,
    snapshots:[], bookmarks:[], links: emptyLinks(), custom:{},
    createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()};
}
/* Every project gets a binder; a project that predates one keeps its text as
   the first document rather than losing it. */
function wsBinder(proj){
  const x = proj.extra = proj.extra || {};
  if(!Array.isArray(x.binder) || !x.binder.length){
    const draft = wsNewNode('folder', 'Draft');
    const first = wsNewNode('doc', proj.title || 'Untitled');
    first.body = proj.body || '';
    first.synopsis = x.premise || '';
    draft.children = [first];
    const research = wsNewNode('folder', 'Research');
    x.binder = [draft, research];
    x.openDoc = first.id;
    x.migratedBody = true;
  }
  x.viewMode = ['editor','corkboard','outliner','manuscript'].includes(x.viewMode) ? x.viewMode : 'editor';
  x.collections = Array.isArray(x.collections) ? x.collections : [];
  x.trash = Array.isArray(x.trash) ? x.trash : [];
  wsWalk(x.binder, n => {
    if(n.type === 'folder' && !Array.isArray(n.children)) n.children = [];
    if(!Array.isArray(n.snapshots)) n.snapshots = [];
    if(!Array.isArray(n.bookmarks)) n.bookmarks = [];
    n.links = normLinks(n.links); n.custom = n.custom || {};
    if(typeof n.synopsis !== 'string') n.synopsis = '';
    if(typeof n.notes !== 'string') n.notes = '';
    if(!WS_DOC_STATUS.includes(n.status)) n.status = 'to do';
  });
  if(!wsFind(x.binder, x.openDoc)) x.openDoc = (wsFlatDocs(x.binder)[0] || {}).id || null;
  return x.binder;
}
function wsWalk(nodes, fn, parent = null){
  (nodes || []).forEach(n => { fn(n, parent); if(n.children) wsWalk(n.children, fn, n); });
}
function wsFind(nodes, id){ let hit = null; wsWalk(nodes, n => { if(n.id === id) hit = n; }); return hit; }
function wsParentOf(nodes, id){ let p = null; wsWalk(nodes, (n, par) => { if(n.id === id) p = par; }); return p; }
function wsSiblings(x, id){ const p = wsParentOf(x.binder, id); return p ? p.children : x.binder; }
function wsFlatDocs(nodes){ const out = []; wsWalk(nodes, n => { if(n.type !== 'folder') out.push(n); }); return out; }
function wsDescendantDocs(node){ if(node.type !== 'folder') return [node]; const out = []; wsWalk(node.children || [], n => { if(n.type !== 'folder') out.push(n); }); return out; }
function wsWords(node){ return wsDescendantDocs(node).reduce((a, d) => a + wordCount(d.body), 0); }
function wsProjectWords(proj){ return wsFlatDocs(wsBinder(proj)).reduce((a, d) => a + wordCount(d.body), 0); }
function wsTouch(node){ node.updatedAt = new Date().toISOString(); }

/* removing a node keeps it in the project's trash until the trash is emptied */
function wsRemove(x, id){
  const arr = wsSiblings(x, id); const i = arr.findIndex(n => n.id === id);
  if(i < 0) return null;
  const [gone] = arr.splice(i, 1);
  x.trash.unshift(gone);
  return gone;
}
function wsInsert(x, node, parentId = null, index = null){
  const arr = parentId ? (wsFind(x.binder, parentId)?.children || x.binder) : x.binder;
  if(index == null || index > arr.length) arr.push(node); else arr.splice(index, 0, node);
  return node;
}
/* a node may not be dropped inside itself, or inside its own descendants */
function wsIsAncestor(node, maybeChildId){
  let hit = false; wsWalk(node.children || [], n => { if(n.id === maybeChildId) hit = true; });
  return hit;
}

/* ---------- document templates ---------- */
const WS_DOC_TEMPLATES = {
  blank:     ['Blank', ''],
  scene:     ['Scene', '## What happens\n\n\n## What changes\n\n'],
  argument:  ['Argument', '## Thesis\n\n\n## Supporting points\n\n\n## Counterarguments\n\n\n## Resolution\n\n'],
  chapter:   ['Chapter', '> epigraph\n\n\n'],
};
const WS_PROJECT_TEMPLATES = {
  blank:  ['Blank', () => [wsNewNode('folder','Draft')]],
  essay:  ['Essay', () => { const d = wsNewNode('folder','Draft');
    d.children = [wsNewNode('doc','Opening'), wsNewNode('doc','Body'), wsNewNode('doc','Close')];
    return [wsNewNode('folder','Notes'), d, wsNewNode('folder','Research')]; }],
  memoir: ['Memoir chapter', () => { const d = wsNewNode('folder','Draft');
    d.children = [wsNewNode('doc','Before'), wsNewNode('doc','The turn'), wsNewNode('doc','After')];
    return [wsNewNode('folder','Memories'), d, wsNewNode('folder','People')]; }],
  article:['Article', () => { const d = wsNewNode('folder','Draft');
    d.children = [wsNewNode('doc','Lede'), wsNewNode('doc','Middle'), wsNewNode('doc','Kicker')];
    return [wsNewNode('folder','Research'), wsNewNode('doc','Outline'), d, wsNewNode('doc','Sources')]; }],
};

/* ---------- the Binder ---------- */
function wsBinderHTML(proj){
  const x = proj.extra; const binder = wsBinder(proj);
  const row = (n, depth) => {
    const [ico] = WS_NODE_KINDS[n.type] || WS_NODE_KINDS.doc;
    const lab = wsLabel(n.label);
    const open = x._openFolders?.[n.id] !== false;
    const words = wsWords(n);
    return `<div class="ws-bnode ${n.id === x.openDoc ? 'on' : ''}" data-wsnode="${n.id}" data-wstype="${n.type}"
        draggable="true" style="--d:${depth};--lc:${lab[2]}">
      ${n.type === 'folder' ? `<button class="ws-disc ${open ? 'open' : ''}" data-wsfold="${n.id}" aria-label="expand">▸</button>` : '<span class="ws-disc-sp"></span>'}
      <span class="ws-bico">${ico}</span>
      <span class="ws-bname">${esc(n.name || 'Untitled')}</span>
      ${n.label !== 'none' ? `<i class="ws-blabel" title="${esc(lab[1])}"></i>` : ''}
      <span class="ws-bcount mono">${words || ''}</span>
    </div>
    ${n.type === 'folder' && open && n.children?.length ? n.children.map(c => row(c, depth + 1)).join('') : ''}`;
  };
  const tot = wsProjectWords(proj); const tgt = +x.target?.wordTarget || 0;
  return `<div class="ws-binder" id="wsBinder">
    <div class="ws-bhead">
      <span class="sc" style="margin:0">Binder</span>
      <span class="row" style="gap:2px">
        <button class="tbtn" id="wsNewDoc" title="new document (⌘N)">＋</button>
        <button class="tbtn" id="wsNewFolder" title="new folder">📁</button>
      </span>
    </div>
    <div class="ws-btarget">
      <div class="row between"><span class="mono">${tot.toLocaleString()} word${tot===1?'':'s'}</span>${tgt ? `<span class="mono faint">of ${tgt.toLocaleString()}</span>` : ''}</div>
      ${tgt ? `<div class="bar" style="--c:var(--page-accent);margin-top:4px"><i style="width:${clamp(Math.round(tot/tgt*100),0,100)}%"></i></div>` : ''}
    </div>
    <div class="ws-btree" id="wsTree">${binder.map(n => row(n, 0)).join('') || '<div class="empty" style="font-size:.78rem">Empty binder.</div>'}</div>
    ${x.trash.length ? `<details class="ws-btrash"><summary class="mono">🗑 trash (${x.trash.length})</summary><div class="body">
      ${x.trash.map(t => `<div class="ws-bnode quiet" data-wstrash="${t.id}"><span class="ws-bico">${(WS_NODE_KINDS[t.type]||WS_NODE_KINDS.doc)[0]}</span><span class="ws-bname">${esc(t.name||'Untitled')}</span><button class="tbtn" data-wsrestore="${t.id}">restore</button></div>`).join('')}
      <button class="btn sm ghost" id="wsEmptyTrash" style="margin-top:6px">empty trash</button>
    </div></details>` : ''}
  </div>`;
}

function bindWsBinder(root, proj, redraw){
  const x = proj.extra; const tree = root.querySelector('#wsTree'); if(!tree) return;
  x._openFolders = x._openFolders || {};

  root.querySelectorAll('[data-wsfold]').forEach(b => b.onclick = ev => {
    ev.stopPropagation();
    const id = b.dataset.wsfold;
    x._openFolders[id] = x._openFolders[id] === false;
    saveNow(); preserveScroll(['#wsBinder'], redraw);
  });
  root.querySelectorAll('[data-wsnode]').forEach(n => {
    n.onclick = () => { const node = wsFind(x.binder, n.dataset.wsnode); if(!node) return;
      x.openDoc = node.id;
      /* clicking a folder is how you ask to see its children as a board */
      if(node.type === 'folder' && x.viewMode === 'editor') x.viewMode = 'corkboard';
      saveNow(); preserveScroll(['#wsBinder'], redraw); };
    n.ondblclick = ev => { ev.stopPropagation(); wsRenameNode(x, n.dataset.wsnode, redraw); };
    n.oncontextmenu = ev => { ev.preventDefault(); wsNodeMenu(ev, x, n.dataset.wsnode, redraw); };
  });

  /* drag to reorder and to nest */
  let dragId = null;
  root.querySelectorAll('[data-wsnode]').forEach(n => {
    n.addEventListener('dragstart', ev => { dragId = n.dataset.wsnode; n.classList.add('dragging'); ev.dataTransfer.effectAllowed = 'move'; });
    n.addEventListener('dragend', () => { dragId = null; n.classList.remove('dragging'); root.querySelectorAll('.ws-bnode').forEach(m => m.classList.remove('over','over-in')); });
    n.addEventListener('dragover', ev => {
      if(!dragId || dragId === n.dataset.wsnode) return;
      ev.preventDefault();
      const r = n.getBoundingClientRect(); const into = n.dataset.wstype === 'folder' && ev.clientY > r.top + r.height * .28 && ev.clientY < r.bottom - r.height * .28;
      n.classList.toggle('over-in', into); n.classList.toggle('over', !into);
    });
    n.addEventListener('dragleave', () => n.classList.remove('over','over-in'));
    n.addEventListener('drop', ev => {
      ev.preventDefault(); if(!dragId || dragId === n.dataset.wsnode) return;
      const moving = wsFind(x.binder, dragId); const targetId = n.dataset.wsnode;
      const target = wsFind(x.binder, targetId);
      if(!moving || !target || wsIsAncestor(moving, targetId)) { n.classList.remove('over','over-in'); return; }
      const into = n.classList.contains('over-in');
      wsRemove(x, dragId); x.trash.shift();          // a move is not a delete
      if(into && target.type === 'folder'){ target.children = target.children || []; target.children.push(moving); x._openFolders[target.id] = true; }
      else { const arr = wsSiblings(x, targetId); const i = arr.findIndex(m => m.id === targetId); arr.splice(i + 1, 0, moving); }
      saveNow(); sound('click'); preserveScroll(['#wsBinder'], redraw);
    });
  });

  root.querySelector('#wsNewDoc') && (root.querySelector('#wsNewDoc').onclick = () => wsAddNode(x, 'doc', redraw));
  root.querySelector('#wsNewFolder') && (root.querySelector('#wsNewFolder').onclick = () => wsAddNode(x, 'folder', redraw));
  root.querySelectorAll('[data-wsrestore]').forEach(b => b.onclick = () => {
    const i = x.trash.findIndex(t => t.id === b.dataset.wsrestore); if(i < 0) return;
    x.binder.push(x.trash.splice(i, 1)[0]); saveNow(); sound('success'); redraw();
  });
  root.querySelector('#wsEmptyTrash') && (root.querySelector('#wsEmptyTrash').onclick = () =>
    confirmDlg(`Permanently delete ${x.trash.length} item${x.trash.length===1?'':'s'}? This cannot be undone.`, () => { x.trash = []; saveNow(); redraw(); }));
}

function wsAddNode(x, type, redraw, parentId = null){
  const node = wsNewNode(type, type === 'folder' ? 'New folder' : 'Untitled');
  /* a new document lands beside whatever is selected, not at the far bottom */
  const sel = x.openDoc ? wsFind(x.binder, x.openDoc) : null;
  if(!parentId && sel){
    if(sel.type === 'folder'){ sel.children = sel.children || []; sel.children.push(node); x._openFolders = x._openFolders || {}; x._openFolders[sel.id] = true; }
    else { const arr = wsSiblings(x, sel.id); arr.splice(arr.findIndex(n => n.id === sel.id) + 1, 0, node); }
  } else wsInsert(x, node, parentId);
  if(type !== 'folder'){ x.openDoc = node.id; x.viewMode = 'editor'; }
  saveNow(); sound('success'); redraw();
  setTimeout(() => { const el2 = document.querySelector(`[data-wsnode="${node.id}"]`); el2 && el2.scrollIntoView({block:'nearest'}); }, 60);
  return node;
}
function wsRenameNode(x, id, redraw){
  const n = wsFind(x.binder, id); if(!n) return;
  const m = openModal(`<h2>Rename</h2><input class="inp serif-lg" id="wsRn" value="${esc(n.name)}" autofocus>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="wsRnOk">Rename</button></div>`, 'narrow');
  const ok = () => { const v = m.querySelector('#wsRn').value.trim(); if(v){ n.name = v; wsTouch(n); saveNow(); } m.remove(); redraw(); };
  m.querySelector('#wsRnOk').onclick = ok;
  m.querySelector('#wsRn').onkeydown = e => { if(e.key === 'Enter') ok(); };
}
function wsNodeMenu(ev, x, id, redraw){
  const n = wsFind(x.binder, id); if(!n) return;
  const items = [
    ['New document here', () => wsAddNode(x, 'doc', redraw, n.type === 'folder' ? n.id : null)],
    ['New folder here',   () => wsAddNode(x, 'folder', redraw, n.type === 'folder' ? n.id : null)],
    ['Rename',            () => wsRenameNode(x, id, redraw)],
    ['Duplicate',         () => { const copy = JSON.parse(JSON.stringify(n)); const reId = m => { m.id = uid(); (m.children||[]).forEach(reId); }; reId(copy);
                                  copy.name = n.name + ' copy'; const arr = wsSiblings(x, id); arr.splice(arr.findIndex(m => m.id === id) + 1, 0, copy); saveNow(); redraw(); }],
    [n.type === 'folder' ? 'Convert to document' : 'Convert to folder', () => {
      if(n.type === 'folder'){ n.type = 'doc'; n.body = n.body || ''; delete n.children; }
      else { n.type = 'folder'; n.children = []; }
      saveNow(); redraw(); }],
    ['Take snapshot',     () => { wsSnapshot(n); saveNow(); toast('Snapshot kept.'); redraw(); }],
    ['Delete',            () => { wsRemove(x, id); if(x.openDoc === id) x.openDoc = (wsFlatDocs(x.binder)[0]||{}).id || null; saveNow(); sound('click'); redraw(); }],
  ];
  const menu = el(`<div class="ws-ctx">${items.map(([l], i) => `<button data-wsi="${i}">${esc(l)}</button>`).join('')}</div>`);
  menu.style.left = Math.min(ev.clientX, innerWidth - 200) + 'px';
  menu.style.top = Math.min(ev.clientY, innerHeight - items.length * 30 - 12) + 'px';
  document.body.appendChild(menu);
  const kill = () => { menu.remove(); document.removeEventListener('click', kill); };
  menu.querySelectorAll('[data-wsi]').forEach(b => b.onclick = () => { kill(); items[+b.dataset.wsi][1](); });
  setTimeout(() => document.addEventListener('click', kill), 0);
}
function wsSnapshot(node, name = ''){
  node.snapshots = node.snapshots || [];
  node.snapshots.push({id:uid(), name, body:node.body || '', words:wordCount(node.body), at:new Date().toISOString()});
}

/* ---------- view modes ---------- */
const WS_VIEWS = [['editor','✎','Editor'],['corkboard','▤','Corkboard'],['outliner','☰','Outliner'],['manuscript','▦','Manuscript']];

function wsViewBarHTML(proj){
  const x = proj.extra; const sel = wsFind(x.binder, x.openDoc);
  return `<div class="ws-viewbar">
    <span class="ws-crumb mono">${esc(wsCrumb(x, x.openDoc))}</span>
    <span class="ws-vtabs">${WS_VIEWS.map(([k,ic,l]) =>
      `<button class="${x.viewMode===k?'on':''}" data-wsview="${k}" title="${l}">${ic}<span>${l}</span></button>`).join('')}</span>
  </div>`;
}
function wsCrumb(x, id){
  const parts = []; let cur = wsFind(x.binder, id);
  while(cur){ parts.unshift(cur.name || 'Untitled'); cur = wsParentOf(x.binder, cur.id); }
  return parts.join('  ›  ') || '—';
}
/* which nodes a view is showing: a folder shows its children, a document its siblings */
function wsScope(x){
  const sel = wsFind(x.binder, x.openDoc);
  if(!sel) return {parent:null, list:x.binder};
  if(sel.type === 'folder') return {parent:sel, list:sel.children || []};
  const p = wsParentOf(x.binder, sel.id);
  return {parent:p, list:p ? p.children : x.binder};
}

function wsEditorHTML(proj){
  const x = proj.extra; const d = wsFind(x.binder, x.openDoc);
  if(!d) return '<div class="empty">Nothing selected. Pick something in the binder.</div>';
  if(d.type === 'folder') return wsCorkboardHTML(proj);
  const n = wordCount(d.body); const tgt = +d.target || 0;
  return `<div class="ws-editor">
    <input class="inp ws-doctitle" id="wsDocTitle" value="${esc(d.name)}" placeholder="Untitled">
    <div class="write-page"><textarea class="ta write-area" id="wBody" placeholder="Begin anywhere. You can fix the beginning last.">${esc(d.body)}</textarea></div>
    <div class="ws-foot row between">
      <span class="mono">${n.toLocaleString()} word${n===1?'':'s'}${tgt?` · ${clamp(Math.round(n/tgt*100),0,999)}% of ${tgt}`:''} · ${Math.max(1,Math.round(n/250))} min read</span>
      <span class="mono session-count">${Math.max(0, wsProjectWords(proj) - _wSession.base)} written this session</span>
    </div>
    ${tgt ? `<div class="bar" style="--c:var(--sage);margin-top:6px"><i style="width:${clamp(Math.round(n/tgt*100),0,100)}%"></i></div>` : ''}
  </div>`;
}

function wsCardHTML(n){
  const lab = wsLabel(n.label); const w = wsWords(n);
  return `<div class="ws-card" data-wscard="${n.id}" draggable="true" style="--lc:${lab[2]}">
    <div class="ws-card-title">${esc(n.name || 'Untitled')}</div>
    <div class="ws-card-syn" data-wssyn="${n.id}">${n.synopsis ? esc(n.synopsis) : '<span class="ph">What is this section for?</span>'}</div>
    <div class="ws-card-foot">
      <span class="ws-status" title="${esc(n.status)}">${esc(n.status)}</span>
      <span class="row" style="gap:4px">
        ${n.snapshots?.length ? `<i title="${n.snapshots.length} snapshot${n.snapshots.length===1?'':'s'}">📸</i>` : ''}
        <span class="mono">${w||''}</span>
      </span>
    </div>
  </div>`;
}
function wsCorkboardHTML(proj){
  const x = proj.extra; const {parent, list} = wsScope(x);
  return `<div class="ws-corkboard" id="wsCork">
    ${list.length ? list.map(wsCardHTML).join('') : '<div class="empty">This folder is empty.</div>'}
    <button class="ws-card ws-card-new" id="wsCardNew">＋ new card</button>
  </div>`;
}

const WS_COLS = [
  ['name',    'Title'],
  ['synopsis','Synopsis'],
  ['status',  'Status'],
  ['label',   'Label'],
  ['words',   'Words'],
  ['target',  'Target'],
];
function wsOutlinerHTML(proj){
  const x = proj.extra; const {list} = wsScope(x);
  const sort = x._outSort || {key:null, dir:1};
  const rows = [];
  const walk = (nodes, depth) => nodes.forEach(n => { rows.push({n, depth}); if(n.children?.length) walk(n.children, depth+1); });
  walk(list, 0);
  if(sort.key){
    const val = n => sort.key === 'words' ? wsWords(n) : String(n[sort.key] ?? '').toLowerCase();
    rows.sort((a,b) => { const A = val(a.n), B = val(b.n); return (A > B ? 1 : A < B ? -1 : 0) * sort.dir; });
  }
  return `<div class="ws-outliner"><table class="ws-table">
    <thead><tr>${WS_COLS.map(([k,l]) => `<th data-wssort="${k}" class="${sort.key===k?'sorted':''}">${esc(l)}${sort.key===k?(sort.dir>0?' ▲':' ▼'):''}</th>`).join('')}</tr></thead>
    <tbody>${rows.length ? rows.map(({n, depth}) => { const lab = wsLabel(n.label); const w = wsWords(n); const tgt = +n.target||0;
      return `<tr data-wsrow="${n.id}" class="${n.id===x.openDoc?'on':''}">
        <td style="padding-left:${8+depth*16}px"><span class="ws-bico">${(WS_NODE_KINDS[n.type]||WS_NODE_KINDS.doc)[0]}</span> ${esc(n.name||'Untitled')}</td>
        <td class="ws-osyn">${esc((n.synopsis||'').slice(0,90))}${(n.synopsis||'').length>90?'…':''}</td>
        <td><select class="sel ws-osel" data-wsstatus="${n.id}">${WS_DOC_STATUS.map(s=>`<option ${n.status===s?'selected':''}>${s}</option>`).join('')}</select></td>
        <td><select class="sel ws-osel" data-wslabel="${n.id}" style="color:${lab[2]}">${WS_LABELS.map(([k,l])=>`<option value="${k}" ${n.label===k?'selected':''}>${l}</option>`).join('')}</select></td>
        <td class="mono">${w||'—'}</td>
        <td><input class="inp mono ws-otgt" data-wstarget="${n.id}" value="${tgt||''}" placeholder="—"></td>
      </tr>${tgt?`<tr class="ws-obar"><td colspan="6"><div class="bar" style="--c:var(--sage)"><i style="width:${clamp(Math.round(w/tgt*100),0,100)}%"></i></div></td></tr>`:''}`; }).join('')
      : '<tr><td colspan="6"><div class="empty">Nothing here.</div></td></tr>'}</tbody>
  </table></div>`;
}

/* Manuscript: every descendant document stitched into one draft, still editable
   in place — the reason for splitting a long piece up in the first place. */
function wsManuscriptHTML(proj){
  const x = proj.extra; const sel = wsFind(x.binder, x.openDoc);
  const scope = sel && sel.type === 'folder' ? sel : (wsParentOf(x.binder, x.openDoc) || {children:x.binder});
  const docs = wsDescendantDocs(scope.children ? scope : {type:'folder', children:x.binder});
  if(!docs.length) return '<div class="empty">Nothing to stitch together yet.</div>';
  const total = docs.reduce((a,d) => a + wordCount(d.body), 0);
  return `<div class="ws-manuscript" id="wsManu">
    <div class="ws-mhead mono">${docs.length} document${docs.length===1?'':'s'} · ${total.toLocaleString()} words</div>
    ${docs.map(d => `<div class="ws-msec">
      <button class="ws-mlabel mono" data-wsgo="${d.id}">${esc(d.name || 'Untitled')}</button>
      <textarea class="ta ws-mbody" data-wsmbody="${d.id}" placeholder="…">${esc(d.body)}</textarea>
    </div>`).join('')}
  </div>`;
}

function wsBodyHTML(proj){
  const x = proj.extra;
  return x.viewMode === 'corkboard'  ? wsCorkboardHTML(proj)
       : x.viewMode === 'outliner'   ? wsOutlinerHTML(proj)
       : x.viewMode === 'manuscript' ? wsManuscriptHTML(proj)
       : wsEditorHTML(proj);
}

/* ---------- the Inspector ---------- */
const WS_INSP_TABS = [['syn','✎','Synopsis & notes'],['meta','◈','Metadata'],['book','🔖','Bookmarks'],['snap','📸','Snapshots'],['comm','💬','Comments']];
function wsInspectorHTML(proj){
  const x = proj.extra; const d = wsFind(x.binder, x.openDoc);
  const tab = x._inspTab || 'syn';
  if(!d) return `<div class="ws-inspector"><div class="empty" style="font-size:.8rem">Nothing selected.</div></div>`;
  const lab = wsLabel(d.label);
  const body = {
    syn: () => `<div class="field"><label>Synopsis</label>
        <textarea class="ta ws-i-ta" id="wsSyn" placeholder="What is this document about? What does it accomplish in the larger piece?">${esc(d.synopsis)}</textarea></div>
      <div class="field"><label>Document notes</label>
        <textarea class="ta ws-i-ta" id="wsNotes" placeholder="Private notes: what still needs work? What are you unsure about?">${esc(d.notes)}</textarea></div>`,
    meta: () => `<div class="field"><label>Status</label><select class="sel" id="wsStatus">${WS_DOC_STATUS.map(s=>`<option ${d.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="field"><label>Label</label><select class="sel" id="wsLabelSel" style="color:${lab[2]}">${WS_LABELS.map(([k,l])=>`<option value="${k}" ${d.label===k?'selected':''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label>Word target</label><input class="inp mono" id="wsTarget" value="${+d.target||''}" placeholder="none"></div>
      <div class="mono faint" style="font-size:.66rem;margin:6px 0 10px">${wordCount(d.body).toLocaleString()} words · edited ${relDays(daysSince(d.updatedAt))}</div>
      ${linkedChipsHTML(d.links) ? `<div class="row" style="gap:4px;flex-wrap:wrap;margin-bottom:8px">${linkedChipsHTML(d.links)}</div>` : ''}
      <details class="fin-links"><summary class="mono">what this draws on</summary><div class="body" id="wsDocLinks">${linksEditorHTML(d.links,{legend:false})}</div></details>`,
    book: () => `<button class="btn sm ghost" id="wsBmAdd">＋ bookmark a document</button>
      <div class="stack" style="gap:5px;margin-top:8px">${(d.bookmarks||[]).length ? d.bookmarks.map(b=>{
        const t = b.kind==='node' ? wsFind(x.binder,b.ref) : byId(S.entries,b.ref);
        return `<div class="rail-item row between"><button class="tbtn" data-wsbmgo="${b.kind}:${b.ref}">${esc(t?.name||t?.title||'missing')}</button><button class="del-x inline" data-wsbmdel="${b.id}">×</button></div>`;
      }).join('') : '<div class="faint" style="font-size:.78rem">Pin the documents you keep flicking back to.</div>'}</div>`,
    snap: () => `<button class="btn sm ghost" id="wsSnapNew">📸 take a snapshot</button>
      <div class="stack" style="gap:5px;margin-top:8px">${(d.snapshots||[]).length ? [...d.snapshots].reverse().map(s=>`
        <div class="rail-item"><div class="row between"><span class="mono">${esc(s.name || fmtDate(s.at.slice(0,10),'med'))} · ${s.words}w</span>
          <span class="row" style="gap:3px"><button class="tbtn" data-wsdiff="${s.id}">compare</button><button class="tbtn" data-wsroll="${s.id}">restore</button><button class="del-x inline" data-wssnapdel="${s.id}">×</button></span></div></div>`).join('')
        : '<div class="faint" style="font-size:.78rem">A snapshot freezes this document as it is now, so you can rewrite it without fear.</div>'}</div>`,
    comm: () => `<div class="faint" style="font-size:.78rem">Comments live with the whole piece.</div>
      <div class="stack" style="gap:6px;margin-top:8px">${(x.comments||[]).map(c=>`<div class="rail-item"><div class="quote" style="font-size:.8rem">“${esc(c.quote)}”</div><div style="margin-top:4px;font-size:.82rem">${esc(c.note)}</div></div>`).join('') || ''}</div>`,
  }[tab]();
  return `<div class="ws-inspector" id="wsInspector">
    <div class="ws-itabs">${WS_INSP_TABS.map(([k,ic,l]) => `<button class="${tab===k?'on':''}" data-wsitab="${k}" title="${esc(l)}">${ic}</button>`).join('')}</div>
    <div class="ws-ibody">${body}</div>
  </div>`;
}

/* a word-level diff, rendered inline — enough to see what a revision did */
function wsDiffHTML(oldT, newT){
  const a = String(oldT||'').split(/(\s+)/), b = String(newT||'').split(/(\s+)/);
  const m = a.length, n = b.length;
  /* LCS over words; drafts are short enough for the table to be fine */
  const L = Array.from({length:m+1}, () => new Uint32Array(n+1));
  for(let i=m-1;i>=0;i--) for(let j=n-1;j>=0;j--) L[i][j] = a[i]===b[j] ? L[i+1][j+1]+1 : Math.max(L[i+1][j], L[i][j+1]);
  const out = []; let i=0, j=0;
  while(i<m && j<n){
    if(a[i]===b[j]){ out.push(esc(a[i])); i++; j++; }
    else if(L[i+1][j] >= L[i][j+1]){ out.push(`<del>${esc(a[i])}</del>`); i++; }
    else { out.push(`<ins>${esc(b[j])}</ins>`); j++; }
  }
  while(i<m) out.push(`<del>${esc(a[i++])}</del>`);
  while(j<n) out.push(`<ins>${esc(b[j++])}</ins>`);
  return out.join('');
}
function wsOpenDiff(node, snapId){
  const s = (node.snapshots||[]).find(x => x.id === snapId); if(!s) return;
  const m = openModal(`<h2>${esc(s.name || 'Snapshot')} → now</h2>
    <p class="muted" style="font-size:.84rem">${fmtDate(s.at.slice(0,10),'med')} · ${s.words} words then, ${wordCount(node.body)} now.</p>
    <div class="ws-diff">${wsDiffHTML(s.body, node.body)}</div>`, 'wide');
  return m;
}

/* ---------- bindings ---------- */
function bindWsStudio(root, proj, redraw){
  const x = proj.extra;
  const save = () => { saveNow(); };
  const cur = () => wsFind(x.binder, x.openDoc);

  bindWsBinder(root, proj, redraw);

  root.querySelectorAll('[data-wsview]').forEach(b => b.onclick = () => { x.viewMode = b.dataset.wsview; save(); redraw(); });

  /* --- editor --- */
  const ta = root.querySelector('#wBody');
  if(ta){
    const d = cur();
    ta.addEventListener('input', debounce(() => { if(!d) return; d.body = ta.value; wsTouch(d); save();
      const foot = root.querySelector('.ws-foot .mono');
      if(foot){ const n = wordCount(d.body); const tgt = +d.target||0;
        foot.textContent = `${n.toLocaleString()} word${n===1?'':'s'}${tgt?` · ${clamp(Math.round(n/tgt*100),0,999)}% of ${tgt}`:''} · ${Math.max(1,Math.round(n/250))} min read`; }
      const bc = root.querySelector(`[data-wsnode="${d.id}"] .ws-bcount`);
      if(bc) bc.textContent = wordCount(d.body) || '';
    }, 400));
    const grow = () => { ta.style.height = 'auto'; ta.style.height = Math.max(420, ta.scrollHeight) + 'px'; };
    grow(); ta.addEventListener('input', grow);
    if(x._typewriter) wsTypewriter(ta);
  }
  const dt = root.querySelector('#wsDocTitle');
  if(dt) dt.onchange = () => { const d = cur(); if(!d) return; d.name = dt.value.trim() || 'Untitled'; wsTouch(d); save(); redraw(); };

  /* --- corkboard --- */
  root.querySelectorAll('[data-wscard]').forEach(c => {
    c.onclick = ev => { if(ev.target.closest('[data-wssyn]')) return;
      const n = wsFind(x.binder, c.dataset.wscard); if(!n) return;
      x.openDoc = n.id; x.viewMode = n.type === 'folder' ? 'corkboard' : 'editor'; save(); redraw(); };
  });
  root.querySelectorAll('[data-wssyn]').forEach(s => {
    s.onclick = ev => { ev.stopPropagation();
      if(s.querySelector('textarea')) return;
      const n = wsFind(x.binder, s.dataset.wssyn); if(!n) return;
      const t = document.createElement('textarea'); t.className = 'ta ws-syn-edit'; t.value = n.synopsis;
      s.innerHTML = ''; s.appendChild(t); t.focus();
      t.onblur = () => { n.synopsis = t.value.trim(); wsTouch(n); save(); redraw(); };
      t.onkeydown = e => { if(e.key === 'Escape') t.blur(); };
    };
  });
  let cdrag = null;
  root.querySelectorAll('[data-wscard]').forEach(c => {
    c.addEventListener('dragstart', () => { cdrag = c.dataset.wscard; c.classList.add('dragging'); });
    c.addEventListener('dragend', () => { cdrag = null; c.classList.remove('dragging'); root.querySelectorAll('.ws-card').forEach(o=>o.classList.remove('over')); });
    c.addEventListener('dragover', ev => { if(!cdrag || cdrag === c.dataset.wscard) return; ev.preventDefault(); c.classList.add('over'); });
    c.addEventListener('dragleave', () => c.classList.remove('over'));
    c.addEventListener('drop', ev => { ev.preventDefault(); c.classList.remove('over');
      if(!cdrag || cdrag === c.dataset.wscard) return;
      const arr = wsSiblings(x, cdrag); const from = arr.findIndex(n => n.id === cdrag);
      const to = arr.findIndex(n => n.id === c.dataset.wscard);
      if(from < 0 || to < 0) return;
      arr.splice(to, 0, arr.splice(from, 1)[0]); save(); sound('click'); redraw(); });
  });
  root.querySelector('#wsCardNew') && (root.querySelector('#wsCardNew').onclick = () => {
    const {parent} = wsScope(x); wsAddNode(x, 'doc', redraw, parent ? parent.id : null); });

  /* --- outliner --- */
  root.querySelectorAll('[data-wssort]').forEach(th => th.onclick = () => {
    const k = th.dataset.wssort; const s = x._outSort || {key:null, dir:1};
    x._outSort = s.key === k ? {key:k, dir:-s.dir} : {key:k, dir:1}; save(); redraw(); });
  root.querySelectorAll('[data-wsrow]').forEach(r => r.onclick = ev => {
    if(ev.target.closest('select, input')) return;
    const n = wsFind(x.binder, r.dataset.wsrow); if(!n) return;
    x.openDoc = n.id; x.viewMode = n.type === 'folder' ? 'corkboard' : 'editor'; save(); redraw(); });
  root.querySelectorAll('[data-wsstatus]').forEach(s => s.onchange = () => { const n = wsFind(x.binder, s.dataset.wsstatus); if(n){ n.status = s.value; wsTouch(n); save(); } });
  root.querySelectorAll('[data-wslabel]').forEach(s => s.onchange = () => { const n = wsFind(x.binder, s.dataset.wslabel); if(n){ n.label = s.value; wsTouch(n); save(); redraw(); } });
  root.querySelectorAll('[data-wstarget]').forEach(i => i.onchange = () => { const n = wsFind(x.binder, i.dataset.wstarget); if(n){ n.target = parseInt(String(i.value).replace(/\D/g,''),10) || 0; save(); redraw(); } });

  /* --- manuscript --- */
  root.querySelectorAll('[data-wsmbody]').forEach(t => {
    const n = wsFind(x.binder, t.dataset.wsmbody); if(!n) return;
    const fit = () => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; };
    fit();
    t.addEventListener('input', () => { fit(); clearTimeout(t._t); t._t = setTimeout(() => { n.body = t.value; wsTouch(n); save(); }, 400); });
  });
  root.querySelectorAll('[data-wsgo]').forEach(b => b.onclick = () => { x.openDoc = b.dataset.wsgo; x.viewMode = 'editor'; save(); redraw(); });

  /* --- inspector --- */
  root.querySelectorAll('[data-wsitab]').forEach(b => b.onclick = () => { x._inspTab = b.dataset.wsitab; save(); redraw(); });
  const bindI = (sel, fn) => { const n = root.querySelector(sel); if(n) n.onchange = () => { const d = cur(); if(d){ fn(d, n); wsTouch(d); save(); } }; };
  bindI('#wsSyn',      (d,n) => d.synopsis = n.value.trim());
  bindI('#wsNotes',    (d,n) => d.notes = n.value.trim());
  bindI('#wsStatus',   (d,n) => d.status = n.value);
  bindI('#wsLabelSel', (d,n) => { d.label = n.value; redraw(); });
  bindI('#wsTarget',   (d,n) => { d.target = parseInt(String(n.value).replace(/\D/g,''),10) || 0; redraw(); });
  const dl = root.querySelector('#wsDocLinks');
  if(dl){ const d = cur(); if(d){ d.links = normLinks(d.links); bindLinksEditor(dl, d.links, () => {}); } }

  root.querySelector('#wsSnapNew') && (root.querySelector('#wsSnapNew').onclick = () => {
    const d = cur(); if(!d) return;
    const m = openModal(`<h2>Name this snapshot</h2><input class="inp" id="wsSnapName" placeholder="Before restructuring · First complete draft" autofocus>
      <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="wsSnapOk">Keep it</button></div>`, 'narrow');
    const ok = () => { wsSnapshot(d, m.querySelector('#wsSnapName').value.trim()); save(); m.remove(); sound('success'); toast('Snapshot kept.'); redraw(); };
    m.querySelector('#wsSnapOk').onclick = ok;
    m.querySelector('#wsSnapName').onkeydown = e => { if(e.key==='Enter') ok(); };
  });
  root.querySelectorAll('[data-wsdiff]').forEach(b => b.onclick = () => { const d = cur(); if(d) wsOpenDiff(d, b.dataset.wsdiff); });
  root.querySelectorAll('[data-wsroll]').forEach(b => b.onclick = () => {
    const d = cur(); if(!d) return;
    const s = d.snapshots.find(y => y.id === b.dataset.wsroll); if(!s) return;
    confirmDlg('Restore this snapshot? The current text is snapshotted first, so nothing is lost.', () => {
      wsSnapshot(d, 'before restoring'); d.body = s.body; wsTouch(d); save(); sound('success'); redraw(); });
  });
  root.querySelectorAll('[data-wssnapdel]').forEach(b => b.onclick = () => {
    const d = cur(); if(!d) return;
    d.snapshots = d.snapshots.filter(y => y.id !== b.dataset.wssnapdel); save(); redraw(); });
  root.querySelectorAll('[data-wsbmdel]').forEach(b => b.onclick = () => {
    const d = cur(); if(!d) return; d.bookmarks = d.bookmarks.filter(y => y.id !== b.dataset.wsbmdel); save(); redraw(); });
  root.querySelectorAll('[data-wsbmgo]').forEach(b => b.onclick = () => {
    const [kind, ref] = b.dataset.wsbmgo.split(':');
    if(kind === 'node'){ x.openDoc = ref; x.viewMode = 'editor'; save(); redraw(); } });
  root.querySelector('#wsBmAdd') && (root.querySelector('#wsBmAdd').onclick = () => {
    const d = cur(); if(!d) return;
    const docs = wsFlatDocs(x.binder).filter(n => n.id !== d.id);
    if(!docs.length){ toast('Nothing else to bookmark yet.'); return; }
    const m = openModal(`<h2>Bookmark a document</h2><select class="sel" id="wsBmSel">${docs.map(n=>`<option value="${n.id}">${esc(n.name||'Untitled')}</option>`).join('')}</select>
      <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="wsBmOk">Pin it</button></div>`, 'narrow');
    m.querySelector('#wsBmOk').onclick = () => { d.bookmarks.push({id:uid(), kind:'node', ref:m.querySelector('#wsBmSel').value}); save(); m.remove(); redraw(); };
  });
}

/* keeps the line you are writing at eye level rather than at the bottom */
function wsTypewriter(ta){
  const centre = () => {
    const before = ta.value.slice(0, ta.selectionStart);
    const line = before.split('\n').length;
    const lh = parseFloat(getComputedStyle(ta).lineHeight) || 28;
    const want = line * lh - ta.clientHeight / 2;
    ta.scrollTop = Math.max(0, want);
  };
  ta.addEventListener('keyup', centre); ta.addEventListener('click', centre);
}

/* ---------- compile ---------- */
function wsCompile(proj, {ids = null, sep = '\n\n---\n\n', titles = true, synopses = false} = {}){
  const docs = wsFlatDocs(wsBinder(proj)).filter(d => !ids || ids.includes(d.id));
  return docs.map(d => [titles ? `# ${d.name || 'Untitled'}` : '', synopses && d.synopsis ? `*${d.synopsis}*` : '', d.body || '']
    .filter(Boolean).join('\n\n')).join(sep);
}
function wsOpenCompile(proj){
  const x = proj.extra; const docs = wsFlatDocs(wsBinder(proj));
  const chosen = new Set(docs.map(d => d.id));
  const m = openModal(`<h2>Compile</h2><p class="muted" style="font-size:.86rem">Assemble the documents you want into one piece of text.</p>
    <div class="stack" style="gap:4px;max-height:36vh;overflow:auto;margin-bottom:10px">
      ${docs.map(d => `<label class="pick-row on"><input type="checkbox" data-wscmp="${d.id}" checked><span><b>${esc(d.name||'Untitled')}</b><span class="d">${wordCount(d.body)}w</span></span></label>`).join('') || '<div class="empty">Nothing to compile.</div>'}
    </div>
    <div class="row" style="gap:12px;flex-wrap:wrap;margin-bottom:10px">
      <label class="row" style="gap:5px"><input type="checkbox" id="wscTitles" checked> titles</label>
      <label class="row" style="gap:5px"><input type="checkbox" id="wscSyn"> synopses</label>
      <select class="sel" id="wscSep" style="width:auto"><option value="rule">─ between</option><option value="blank">blank line</option><option value="none">nothing</option></select>
    </div>
    <div class="ws-cmp-preview mono" id="wscPrev"></div>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px">
      <button class="btn sm ghost" id="wscCopy">copy</button>
      <button class="btn primary" id="wscDl">download .md</button></div>`, 'wide');
  const opts = () => ({ids:[...chosen], titles:m.querySelector('#wscTitles').checked, synopses:m.querySelector('#wscSyn').checked,
    sep:{rule:'\n\n---\n\n', blank:'\n\n', none:'\n'}[m.querySelector('#wscSep').value]});
  const refresh = () => { m.querySelector('#wscPrev').textContent = wsCompile(proj, opts()).slice(0, 4000) || '—'; };
  m.querySelectorAll('[data-wscmp]').forEach(c => c.onchange = () => { c.checked ? chosen.add(c.dataset.wscmp) : chosen.delete(c.dataset.wscmp); c.closest('.pick-row').classList.toggle('on', c.checked); refresh(); });
  ['#wscTitles','#wscSyn','#wscSep'].forEach(s => m.querySelector(s).onchange = refresh);
  m.querySelector('#wscCopy').onclick = () => { navigator.clipboard?.writeText(wsCompile(proj, opts())); toast('Copied.'); };
  m.querySelector('#wscDl').onclick = () => {
    const blob = new Blob([wsCompile(proj, opts())], {type:'text/markdown'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = (proj.title || 'piece').replace(/[^\w\- ]/g,'').trim().replace(/\s+/g,'-') + '.md';
    a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 2000); toast('Downloaded.');
  };
  refresh();
}
