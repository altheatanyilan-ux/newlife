/* ============================================================
   THE KNOWLEDGE TREE × iCanStudy — seeing it, priming it, teaching it
   (A-13, N-01, N-06, N-07).

   The trunk before the leaves (an outline that shows only what carries the
   weight); a read-only map that draws one root's pages, chunks, grafts and
   links — nothing on it can be dragged; a wizard for laying down a branch
   broad and shallow; and a whole-part-whole teaching session.

   The map is a rendering of what is recorded, and so it is a diagnostic: if
   it is a bare spine, that is the honest picture.
   ============================================================ */

/* ============================================================
   A-13  Trunk before leaves
   ============================================================ */
function icsIsTrunk(p){ return p.backbone === true || p.importance === 'core'; }
function icsUi(){ const u = S._tree = S._tree || {}; u.outlineMode = u.outlineMode || 'all'; u.unfold = u.unfold || {}; return u; }
/* A trunk page must stay reachable, so a page that is not itself trunk but sits above one is kept as a lighter
   connector; a naive filter would leave the tree in pieces. */
function icsTrunkView(rootId){
  const keep = new Set([rootId]);
  const mark = id => { let cur = treeNode(id), g = 0; while(cur && g++ < 60){ keep.add(cur.id); cur = cur.parentId ? treeNode(cur.parentId) : null; } };
  const live = id => treeChildren(id);
  const walkAll = id => live(id).forEach(k => { if(icsIsTrunk(k)) mark(k.id); walkAll(k.id); });
  walkAll(rootId);
  const build = id => {
    const page = treeNode(id), kids = live(id), shown = kids.filter(k => keep.has(k.id));
    return {page, connector: !icsIsTrunk(page) && id !== rootId, hiddenCount: kids.length - shown.length, hidden: kids.filter(k => !keep.has(k.id)), children: shown.map(k => build(k.id))};
  };
  return build(rootId);
}
function icsTrunkViewOrPrompt(rootId){
  const tree = icsTrunkView(rootId);
  const count = n => (icsIsTrunk(n.page) ? 1 : 0) + n.children.reduce((a, c) => a + count(c), 0);
  if(count(tree) === 0) return {empty: true, message: 'Nothing here is marked as the trunk yet. Mark three or four pages as Core, or as part of the trunk, and they will show up here.'};
  return {empty: false, tree};
}
function icsTrunkNodeHTML(n, depth){
  const open = S.treePrefs.outlineOpen, p = n.page, unfolded = icsUi().unfold[p.id];
  const kids = unfolded ? treeChildren(p.id) : null;
  const items = unfolded ? kids.map(k => { const found = n.children.find(c => c.page.id === k.id); return found || {page: k, connector: !icsIsTrunk(k), hiddenCount: treeChildren(k.id).length, hidden: treeChildren(k.id), children: [], leafOnly: true}; }) : n.children;
  const isOpen = open[p.id] !== false, c = treeCurrentPosition(p.id);
  return `<li class="${p.kind} ${p.status} ${n.connector ? 'is-connector' : 'is-trunk'}"><div class="tr-olrow">${items.length ? `<button class="tr-tw" data-trtw="${p.id}" aria-expanded="${isOpen}">${isOpen ? '▾' : '▸'}</button>` : '<span class="tr-tw"></span>'}
    ${treeKindMark(p)}<a href="${treeUrl(p)}">${esc(p.title)}</a>${p.status !== 'active' ? treeBadge(p) : ''}${icsIsTrunk(p) ? icsTitleMarksHTML(p) : ''}${c ? `<span class="tr-olc" style="--c:${c.confidence}">${c.confidence}%</span>` : ''}
    ${n.hiddenCount && !unfolded ? `<button class="tbtn sm" data-act="unfold" data-page="${p.id}">+${n.hiddenCount} more</button>` : ''}${unfolded && treeChildren(p.id).length ? `<button class="tbtn sm" data-act="refold" data-page="${p.id}">fold the rest</button>` : ''}</div>
    ${items.length && isOpen ? `<ul class="tr-ol">${items.map(ch => icsTrunkNodeHTML(ch, depth + 1)).join('')}</ul>` : ''}</li>`;
}
function icsTrunkOutlineHTML(roots){
  return `<div data-mode="trunk">${roots.map(r => { const v = icsTrunkViewOrPrompt(r.id);
    return v.empty ? `<div class="tr-trunk-empty"><b>${treeKindMark(r)}<a href="${treeUrl(r)}">${esc(r.title)}</a></b><p class="faint">${esc(v.message)}</p></div>` : `<ul class="tr-ol top">${icsTrunkNodeHTML(v.tree, 0)}</ul>`; }).join('')}</div>`;
}
/* the children of a page, in trunk mode: the same toggle, the same rule */
function icsKidsView(n, kids){
  const u = icsUi();
  if(u.outlineMode !== 'trunk') return {kids, hidden: 0, on: false};
  const bones = kids.filter(k => icsIsTrunk(k) || treeChildren(k.id).some(function chk(x){ return icsIsTrunk(x) || treeChildren(x.id).some(chk); }));
  if(!bones.length) return {kids, hidden: 0, on: true, none: true};
  if(u.unfold[n.id]) return {kids, hidden: 0, on: true, unfolded: true};
  return {kids: bones, hidden: kids.length - bones.length, on: true};
}
function icsBindOutlineMode(root, again){
  root.querySelectorAll('[data-act="mode"]').forEach(b => b.onclick = () => { const u = icsUi(); u.outlineMode = u.outlineMode === 'trunk' ? 'all' : 'trunk'; again(); });
  root.querySelectorAll('[data-act="unfold"]').forEach(b => b.onclick = () => { icsUi().unfold[b.dataset.page] = true; again(); });
  root.querySelectorAll('[data-act="refold"]').forEach(b => b.onclick = () => { delete icsUi().unfold[b.dataset.page]; again(); });
}

/* ============================================================
   N-01  The map
   ============================================================ */
const ICS_MAP = {ROW_H: 110, COL_W: 190, NODE_W: 150, NODE_H: 54, LEGIBLE: 250};
function icsMapSuggestedOpts(rootId){
  const n = icsDescendants(rootId).length;
  return n > ICS_MAP.LEGIBLE ? {trunkOnly: true, note: `${n} pages is too many to read at once. Showing the trunk. Turn it off if you want the thicket.`} : {trunkOnly: false, note: null};
}
function icsBuildGraph(rootId, opts){
  opts = opts || {};
  const trunkOnly = !!opts.trunkOnly, includeDormant = opts.includeDormant !== false;
  const root = treeNode(rootId); if(!root) throw new Error('no such root');
  const pruned = p => p.status === 'pruned';
  const pool = [root, ...icsDescendants(rootId)].filter(p => !pruned(p)).filter(p => includeDormant || p.status !== 'dormant').filter(p => !trunkOnly || icsIsTrunk(p) || p.id === rootId);
  const live = new Set(pool.map(p => p.id));
  const kidsOf = id => treeChildren(id).filter(k => live.has(k.id));
  const depthOf = new Map(); const walk = (id, d) => { depthOf.set(id, d); kidsOf(id).forEach(k => walk(k.id, d + 1)); }; walk(rootId, 0);
  /* a trunk-only view drops pages from the middle; whatever is left hangs from its nearest surviving ancestor */
  const parentOf = id => { let x = treeNode(id), g = 0; while(x && x.parentId && g++ < 60){ x = treeNode(x.parentId); if(x && live.has(x.id)) return x; } return null; };
  const kids2 = new Map(); pool.forEach(p => { if(p.id === rootId) return; const par = parentOf(p.id); if(par) (kids2.get(par.id) || kids2.set(par.id, []).get(par.id)).push(p); });
  kids2.forEach(l => l.sort((a, b) => a.title.localeCompare(b.title)));
  const depth2 = new Map(); const walk2 = (id, d) => { depth2.set(id, d); (kids2.get(id) || []).forEach(k => walk2(k.id, d + 1)); }; walk2(rootId, 0);
  let cursor = 0; const xOf = new Map();
  const place = id => { const ks = kids2.get(id) || []; if(!ks.length){ xOf.set(id, cursor++); return xOf.get(id); } const xs = ks.map(k => place(k.id)); const mid = (Math.min(...xs) + Math.max(...xs)) / 2; xOf.set(id, mid); return mid; };
  place(rootId);
  const grafts = [], seen = new Set();
  const nodes = pool.filter(p => depth2.has(p.id)).map(p => {
    const gs = icsGraftsOf(p.id); gs.forEach(g => { if(seen.has(g.id) || !live.has(g.fromId) || !live.has(g.toId)) return; seen.add(g.id); grafts.push(g); });
    const out = icsLinksOut(p), inn = treeBacklinks(p), linkCount = out.length + inn.length;
    return {id: p.id, title: p.title, kind: p.kind, status: p.status, importance: p.importance || null, backbone: !!p.backbone, mastery: (p.mastery && p.mastery.level) || null, depth: depth2.get(p.id), x: xOf.get(p.id) * ICS_MAP.COL_W, y: depth2.get(p.id) * ICS_MAP.ROW_H,
      island: gs.length === 0 && linkCount === 0 && kidsOf(p.id).length === 0, degree: gs.length + linkCount};
  });
  const ids = new Set(nodes.map(n => n.id)), edges = [];
  nodes.forEach(nd => { if(nd.id === rootId) return; const par = parentOf(nd.id); if(par && ids.has(par.id)) edges.push({type: 'parent', fromId: par.id, toId: nd.id, weight: icsIsTrunk(treeNode(nd.id)) ? 2 : 1}); });
  grafts.forEach(g => { if(ids.has(g.fromId) && ids.has(g.toId)) edges.push({type: 'graft', fromId: g.fromId, toId: g.toId, kind: g.type, reason: g.why, tension: g.type === 'contradicts' && !g.resolvedAt}); });
  nodes.forEach(nd => icsLinksOut(treeNode(nd.id)).forEach(l => { if(!ids.has(l.id)) return;
    if(!edges.some(e => e.type === 'graft' && ((e.fromId === nd.id && e.toId === l.id) || (e.toId === nd.id && e.fromId === l.id))) && !edges.some(e => e.type === 'link' && e.fromId === nd.id && e.toId === l.id)) edges.push({type: 'link', fromId: nd.id, toId: l.id}); }));
  const chunks = icsChunksUnderRoot(rootId);
  const b = nodes.length ? {w: Math.max(...nodes.map(n => n.x)) + ICS_MAP.NODE_W * 2, h: Math.max(...nodes.map(n => n.y)) + ICS_MAP.NODE_H * 2} : {w: ICS_MAP.NODE_W, h: ICS_MAP.NODE_H};
  return {rootId, nodes, edges, chunks, bounds: b};
}
function icsChunkBoxes(graph){
  const by = new Map(graph.nodes.map(n => [n.id, n])), pad = 18;
  return graph.chunks.map(c => { const ms = c.memberIds.map(id => by.get(id)).filter(Boolean); if(ms.length < 2) return null;
    const x0 = Math.min(...ms.map(m => m.x)), x1 = Math.max(...ms.map(m => m.x)), y0 = Math.min(...ms.map(m => m.y)), y1 = Math.max(...ms.map(m => m.y));
    return {chunkId: c.id, title: c.title, reason: c.reason, x: x0 - pad, y: y0 - pad, w: x1 - x0 + ICS_MAP.NODE_W + pad * 2, h: y1 - y0 + ICS_MAP.NODE_H + pad * 2}; }).filter(Boolean);
}
/* the diagnostic the method cares about: too few connections, too many, or about right */
function icsMapDiagnostics(graph){
  const n = graph.nodes.length || 1, grafts = graph.edges.filter(e => e.type === 'graft').length, islands = graph.nodes.filter(x => x.island), density = grafts / n;
  return {pages: graph.nodes.length, grafts, density: Number(density.toFixed(2)), relational: density < 0.3 ? 'too few' : density > 1.5 ? 'too many' : 'about right',
    islands: islands.map(i => ({id: i.id, title: i.title})), backbone: graph.nodes.filter(x => x.backbone).length, chunked: new Set(graph.chunks.flatMap(c => c.memberIds)).size, atOrAboveL4: graph.nodes.filter(x => (x.mastery || 0) >= 4).length};
}
const ICS_MAP_COLOURS = {tension: '#c0504d', contradicts: '#c0504d', supports: '#5d8a63', extends: '#4f7fa6', echoes: '#9a7bb0', raises: '#c89a3c', link: '#9aa0a6'};
function icsMapStyle(){
  return `.map-edges line,.map-edges path{fill:none}.e-parent{stroke:#8a8f98;stroke-width:1.6}.e-parent[data-weight="2"]{stroke-width:3.4;stroke:#6b7078}
    .e-link{stroke:${ICS_MAP_COLOURS.link};stroke-width:1;stroke-dasharray:2 4;opacity:.7}.e-graft{stroke-width:2.2}
    .e-graft[data-kind="supports"]{stroke:${ICS_MAP_COLOURS.supports}}.e-graft[data-kind="extends"]{stroke:${ICS_MAP_COLOURS.extends}}.e-graft[data-kind="echoes"]{stroke:${ICS_MAP_COLOURS.echoes}}.e-graft[data-kind="raises"]{stroke:${ICS_MAP_COLOURS.raises}}
    .e-graft[data-kind="contradicts"]{stroke:${ICS_MAP_COLOURS.contradicts};stroke-width:2.8}.e-graft[data-tension="true"]{stroke-width:4.4}
    .map-chunks rect{fill:rgba(120,140,160,.08);stroke:#7b8794;stroke-dasharray:6 4;stroke-width:1.2}.map-chunks text{font:600 11px sans-serif;fill:#6b7078}
    .n rect{fill:#f4efe6;stroke:#9a9288;stroke-width:1.3}.n text{font:12px sans-serif;fill:#2b2722}.n .n-meta{font-size:10px;fill:#6b645c}
    .n[data-backbone="true"] rect{stroke:#2b2722;stroke-width:3}.n[data-island="true"] rect{stroke-dasharray:4 3;stroke:#c0504d}
    [data-colour="mastery"] .n[data-mastery="1"] rect{fill:#f3d6d0}[data-colour="mastery"] .n[data-mastery="2"] rect{fill:#f3e3c4}[data-colour="mastery"] .n[data-mastery="3"] rect{fill:#e9eec6}[data-colour="mastery"] .n[data-mastery="4"] rect{fill:#cfe5cf}[data-colour="mastery"] .n[data-mastery="5"] rect{fill:#a9d3b3}[data-colour="mastery"] .n[data-mastery="u"] rect{fill:#fff;stroke-dasharray:2 2}
    [data-colour="importance"] .n[data-importance="core"] rect{fill:#cfe5cf}[data-colour="importance"] .n[data-importance="supporting"] rect{fill:#e9eec6}[data-colour="importance"] .n[data-importance="peripheral"] rect{fill:#f3e3c4}[data-colour="importance"] .n[data-importance="u"] rect{fill:#fff;stroke-dasharray:2 2}
    [data-colour="status"] .n[data-status="active"] rect{fill:#cfe5cf}[data-colour="status"] .n[data-status="stub"] rect{fill:#fff;stroke-dasharray:3 3}[data-colour="status"] .n[data-status="dormant"] rect{fill:#e4e4e4}`;
}
function icsMapSVG(graph, colour){
  const P = 40, by = new Map(graph.nodes.map(n => [n.id, n])), W = graph.bounds.w + P * 2, H = graph.bounds.h + P * 2, cx = n => n.x + ICS_MAP.NODE_W / 2, cyT = n => n.y, cyB = n => n.y + ICS_MAP.NODE_H;
  const markers = Object.keys(ICS_MAP_COLOURS).map(k => `<marker id="ar-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="${k === 'tension' ? 8 : 6}" markerHeight="${k === 'tension' ? 8 : 6}" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${ICS_MAP_COLOURS[k]}"/></marker>`).join('');
  const edge = e => { const a = by.get(e.fromId), b = by.get(e.toId); if(!a || !b) return '';
    if(e.type === 'parent') return `<line class="e-parent" data-weight="${e.weight}" x1="${cx(a)}" y1="${cyB(a)}" x2="${cx(b)}" y2="${cyT(b)}"/>`;
    const ax = cx(a), bx = cx(b), ay = a.y + ICS_MAP.NODE_H / 2, by2 = b.y + ICS_MAP.NODE_H / 2, mx = (ax + bx) / 2, my = (ay + by2) / 2 - 28 - Math.abs(ax - bx) * 0.05;
    if(e.type === 'link') return `<path class="e-link" d="M${ax},${ay} Q${mx},${my} ${bx},${by2}"/>`;
    return `<path class="e-graft" data-kind="${e.kind}" data-tension="${e.tension}" marker-end="url(#ar-${e.tension ? 'tension' : e.kind})" d="M${ax},${ay} Q${mx},${my} ${bx},${by2}"><title>${esc(a.title)} ${esc(e.kind)} ${esc(b.title)} — ${esc(e.reason || '')}</title></path>`; };
  const boxes = icsChunkBoxes(graph);
  const ord = ['parent', 'link', 'graft'];
  return `<svg class="tr-mapsvg" data-colour="${colour}" viewBox="${-P} ${-P} ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chunk map of this root"><style>${icsMapStyle()}</style><defs>${markers}</defs>
    <g class="map-chunks">${boxes.map(b => `<g data-chunk="${b.chunkId}"><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="12"/><text x="${b.x + 10}" y="${b.y - 5}">${esc(b.title)}</text><title>${esc(b.reason)}</title></g>`).join('')}</g>
    <g class="map-edges">${ord.map(t => graph.edges.filter(e => e.type === t).map(edge).join('')).join('')}</g>
    <g class="map-nodes">${graph.nodes.map(n => { const pg = treeNode(n.id);
      return `<a href="${treeUrl(pg)}"><g class="n" data-id="${n.id}" data-backbone="${n.backbone}" data-island="${n.island}" data-mastery="${n.mastery || 'u'}" data-importance="${n.importance || 'u'}" data-status="${n.status}" transform="translate(${n.x},${n.y})"><rect width="${ICS_MAP.NODE_W}" height="${ICS_MAP.NODE_H}" rx="6"/>
        <text x="8" y="21">${esc(n.title.length > 22 ? n.title.slice(0, 21) + '…' : n.title)}</text><text x="8" y="41" class="n-meta">${n.kind === 'root' ? '◉' : n.kind === 'branch' ? '◆' : '•'} ${n.mastery ? 'L' + n.mastery : 'L?'} ${n.importance ? ICS_IMPORTANCE_MARK[n.importance] : '···'}${n.backbone ? ' ▲' : ''}</text><title>${esc(n.title)}</title></g></a>`; }).join('')}</g></svg>`;
}
function icsMapRoute(root, ref){
  const roots = treeRoots();
  let rt = ref ? (treeNode(ref) || treeResolve(decodeURIComponent(ref))) : null; if(rt) rt = icsRootOf(rt);
  if(!rt) rt = roots[0];
  const ui = icsUi(); ui.map = ui.map || {};
  if(!rt){ root.innerHTML = `<div class="page tr-page">${treeNav('map')}<header class="tr-head"><h1 class="serif">Chunk map</h1></header><p class="faint">Nothing has taken root yet. The map draws a root once it has one.</p></div>`; treeBindNav(root); return; }
  const sug = icsMapSuggestedOpts(rt.id), m = ui.map[rt.id] = ui.map[rt.id] || {trunk: sug.trunkOnly, dormant: true, colour: 'mastery'};
  const g = icsBuildGraph(rt.id, {trunkOnly: m.trunk, includeDormant: m.dormant}), d = icsMapDiagnostics(g);
  root.innerHTML = `<div class="page tr-page tr-map" data-root="${rt.id}">${treeNav('map')}
    <header class="tr-head"><h1 class="serif">Chunk map — ${esc(rt.title)}</h1>
      <div class="tr-headrow tr-map-bar">${roots.length > 1 ? `<select class="sel" data-act="map-root" aria-label="Root">${roots.map(r => `<option value="${r.id}"${r.id === rt.id ? ' selected' : ''}>${esc(r.title)}</option>`).join('')}</select>` : ''}
        <label class="tr-chk"><input type="checkbox" data-act="map-trunk"${m.trunk ? ' checked' : ''}> Trunk only</label>
        <label class="tr-chk"><input type="checkbox" data-act="map-dormant"${m.dormant ? ' checked' : ''}> Include dormant</label>
        <label class="tr-chk">Colour by <select class="sel" data-act="map-colour">${[['mastery', 'Mastery level'], ['importance', 'Importance'], ['status', 'Status']].map(([k, l]) => `<option value="${k}"${m.colour === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
        <button class="tbtn" data-act="map-svg">Save as SVG</button></div></header>
    ${sug.note && m.trunk ? `<p class="tr-hint tr-warn">${esc(sug.note)}</p>` : ''}
    <p class="tr-map-diag" id="trMapDiag">${d.pages} pages · ${d.grafts} grafts · density ${d.density} (<strong>${d.relational}</strong>) · ${d.islands.length} island${d.islands.length === 1 ? '' : 's'} · ${d.backbone} backbone · ${d.pages ? Math.round(d.atOrAboveL4 / d.pages * 100) : 0}% at L4+</p>
    <div class="tr-mapwrap">${icsMapSVG(g, m.colour)}</div>
    <p class="faint tr-hint">This map is drawn from what is already recorded — children, chunks, grafts and links. Nothing here can be dragged. If it looks like a bare spine, that is the honest picture: add grafts and chunks, not positions.</p></div>`;
  treeBindNav(root);
  const again = () => icsMapRoute(root, rt.id);
  root.querySelector('[data-act="map-trunk"]').onchange = e => { m.trunk = e.target.checked; again(); };
  root.querySelector('[data-act="map-dormant"]').onchange = e => { m.dormant = e.target.checked; again(); };
  root.querySelector('[data-act="map-colour"]').onchange = e => { m.colour = e.target.value; again(); };
  const rs = root.querySelector('[data-act="map-root"]'); if(rs) rs.onchange = e => navigate('#/tree/map/' + e.target.value);
  root.querySelector('[data-act="map-svg"]').onclick = () => { const svg = root.querySelector('.tr-mapsvg'); const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n` + svg.outerHTML], {type: 'image/svg+xml'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `chunk-map-${rt.slug}.svg`; document.body.appendChild(a); a.click(); a.remove(); };
}
ICS_ROUTES.map = (root, a) => icsMapRoute(root, a);

/* ============================================================
   N-06  Prime a branch (the Aim step)
   ============================================================ */
const ICS_AIM_STAGES = [
  {key: 'resources', label: 'Resources', minutes: [5, 10], hint: 'One large block, the whole topic. What are you working from?'},
  {key: 'keywords', label: 'Keywords', minutes: [10, 20], hint: 'Collect the terms and concepts. One per line. Do not explain them.'},
  {key: 'organise', label: 'Organisation', minutes: [5, 10], hint: 'Put them under larger headings. Two to four per group.'},
  {key: 'questions', label: 'Questions', minutes: [30, 60], hint: 'What it is, why it matters, how it relates, why it matters to you. Feeling overwhelmed here is normal.'}];
function icsParseKeywords(raw){
  const seen = new Set();
  return String(raw || '').split(/\r?\n/).map(s => s.replace(/^[\s\-*•\d.)]+/, '').trim()).filter(Boolean)
    .filter(s => { const k = s.toLowerCase(); if(seen.has(k)) return false; seen.add(k); return true; }).map(text => ({text, words: text.split(/\s+/).length}));
}
function icsAnnotateExisting(kws){
  const cands = icsCandidates();
  return kws.map(k => { const ex = treeResolve(k.text), near = ex ? [] : icsSuggestForRedLink(k.text, cands, 2); return Object.assign({}, k, {existingPageId: ex ? ex.id : null, near}); });
}
function icsEmptyPlan(branchId){ return {branchId, keywords: [], groups: [], makeQuestions: true, questionKinds: ['what', 'why', 'how', 'personal']}; }
function icsPlanSignals(plan){
  const out = [], n = plan.keywords.filter(k => !k.existingPageId && k.include !== false).length;
  if(n > 40) out.push({level: 'signal', text: n + ' keywords is a lot for one branch. Prestudy is broad, but a branch of forty points will need chunking.'});
  plan.keywords.forEach(k => { if(k.words > 8) out.push({level: 'signal', text: '“' + k.text.slice(0, 40) + '…” reads like a claim, not a keyword. Points come later.'}); });
  plan.groups.forEach(g => { if(!String(g.reason || '').trim()) out.push({level: 'prompt', text: 'Group “' + g.label + '” has no reason yet. Why do these belong together?'}); });
  return out;
}
/* ONE confirmation. Bulk CREATION of stubs only.
   The Tree has no bulk actions, and that stays true: this is a deliberate, narrow exception that makes new, empty,
   Stub pages under a single explicit confirmation. It must never be stretched to bulk edit, move, status change or
   delete of pages that already exist — the limit is there to stop the software acting on your record, and adding
   confirmed blanks does not do that. */
function icsCommitPlan(plan){
  const branch = treeNode(plan.branchId);
  if(!branch || branch.kind !== 'branch') throw new Error('prime a branch, not a ' + (branch ? branch.kind : 'missing page'));
  const created = [], reused = [], questions = [], chunks = [], failed = [];
  plan.keywords.forEach(k => {
    if(k.include === false) return;
    if(k.existingPageId){ reused.push(k.existingPageId); return; }
    const r = treeSavePage({title: k.text, kind: 'point', parentId: plan.branchId, status: 'stub'});
    if(r.error) failed.push({text: k.text, why: r.error}); else created.push(r.node);
  });
  const skippedGroups = [];
  plan.groups.forEach(g => {
    const ids = (g.keywordTexts || []).map(t => { const made = created.find(p => p.title === t); if(made) return made.id; const k = plan.keywords.find(x => x.text === t); return k && k.existingPageId; }).filter(Boolean);
    if(ids.length < 2){ skippedGroups.push({g, why: 'fewer than two'}); return; }
    try { chunks.push(icsCreateChunk({title: g.label, reason: g.reason, memberIds: ids})); } catch(e){ skippedGroups.push({g, why: e.message}); }
  });
  /* red by definition, and not answered: Aim and Shoot are separate sittings */
  if(plan.makeQuestions) created.forEach(page => {
    const rel = chunks.find(c => c.memberIds.includes(page.id)), relTitle = rel ? (treeNode(rel.memberIds.find(id => id !== page.id)) || {}).title : null;
    icsScaffoldQuestions(page.title, relTitle).forEach(q => { if(!plan.questionKinds.includes(q.kind)) return; questions.push(icsSaveQuestion({pageId: page.id, kind: q.kind, text: q.text, selfMade: false})); });
  });
  return {created, reused, chunks, questions, skippedGroups, failed};
}
function icsPrimeWizard(branchId){ navigate('#/tree/prime/' + branchId); }
function icsPrimeRoute(root, ref){
  const br = ref ? (treeNode(ref) || treeResolve(decodeURIComponent(ref))) : null;
  if(!br || br.kind !== 'branch'){ root.innerHTML = `<div class="page tr-page">${treeNav('')}<header class="tr-head"><h1 class="serif">Prime a branch</h1></header><p class="faint">Priming works on a branch — not a root, and not a point. Open a branch and choose “Prime this branch”.</p></div>`; treeBindNav(root); return; }
  const ui = icsUi(); const st = ui.prime = (ui.prime && ui.prime.branchId === br.id) ? ui.prime : {branchId: br.id, stage: 0, resources: '', raw: '', plan: icsEmptyPlan(br.id)};
  const plan = st.plan, stg = ICS_AIM_STAGES;
  const head = `<header class="tr-head"><h1 class="serif">Prime “${esc(br.title)}”</h1><p class="tr-lede">Broad and shallow. You are laying the trunk, not the leaves. Depth comes in the weeks after.</p>
    <ol class="tr-prime-steps">${stg.map((s, i) => `<li${i === st.stage ? ' aria-current="step"' : ''}>${s.label} <span class="faint">${s.minutes[0]}–${s.minutes[1]} min</span></li>`).join('')}</ol></header>`;
  const sigs = () => icsPlanSignals(plan).map(s => `<li class="tr-hint tr-warn soft">${esc(s.text)}</li>`).join('');
  let body = '';
  if(st.stage === 0) body = `<div data-stage="resources"><p class="faint">${esc(stg[0].hint)} (This note stays only for this sitting.)</p><textarea class="inp" rows="6" data-field="resources" placeholder="The syllabus, a chapter list, a lecture outline…">${esc(st.resources)}</textarea></div>`;
  if(st.stage === 1) body = `<div data-stage="keywords"><label class="tr-f"><span>Paste the terms, one per line</span><textarea class="inp" rows="14" data-field="keywords">${esc(st.raw)}</textarea></label><p class="faint tr-hint">${esc(stg[1].hint)} Terms, not sentences. 20–40 is a normal topic.</p></div>`;
  if(st.stage === 2){
    const kws = plan.keywords, newN = kws.filter(k => !k.existingPageId).length;
    body = `<div data-stage="organise"><p>${kws.length} keywords · ${kws.length - newN} already in the tree</p><p class="faint">${esc(stg[2].hint)}</p>
      <ul class="tr-prime-keywords">${kws.map((k, i) => k.existingPageId ? `<li class="is-existing"><input type="checkbox" disabled> ${esc(k.text)} <a href="${treeUrl(treeNode(k.existingPageId))}">already in the tree</a></li>`
        : `<li><input type="checkbox" data-act="kw-inc" data-i="${i}"${k.include === false ? '' : ' checked'}> ${esc(k.text)}${k.near.length ? ` <span class="faint">near: ${k.near.map(n => `<a href="${treeUrl(treeNode(n.pageId))}">${esc(n.title)}</a>`).join(', ')}</span>` : ''}
          <select class="sel" data-act="kw-group" data-i="${i}"><option value="">— no group —</option>${plan.groups.map(g => `<option value="${g.id}"${k.group === g.id ? ' selected' : ''}>${esc(g.label)}</option>`).join('')}<option value="__new">+ new group…</option></select></li>`).join('')}</ul>
      ${plan.groups.map(g => `<fieldset class="tr-prime-group"><legend>${esc(g.label)}</legend><label class="tr-f"><span>Why do these belong together?</span><textarea class="inp" rows="2" data-act="grp-reason" data-g="${g.id}">${esc(g.reason || '')}</textarea></label></fieldset>`).join('')}
      <ul class="tr-signals">${sigs()}</ul></div>`;
  }
  if(st.stage === 3) body = `<div data-stage="questions"><p>${esc(stg[3].hint)}</p><p class="faint">Four questions per new point, as a starting shape — they come from a template, not from anyone who knows your course. Rewrite them: a template question is not your question.</p>
      ${[['what', 'What is it?'], ['why', 'Why is it important?'], ['how', 'How does it relate to…?'], ['personal', 'Why does it matter to me?']].map(([k, l]) => `<label class="tr-chk"><input type="checkbox" data-act="qkind" data-k="${k}"${plan.questionKinds.includes(k) ? ' checked' : ''}> ${l}</label>`).join('')}
      <label class="tr-chk"><input type="checkbox" data-act="qmake"${plan.makeQuestions ? ' checked' : ''}> Make the questions at all</label>
      <ul class="tr-signals">${sigs()}</ul>${(() => { const newPts = plan.keywords.filter(k => !k.existingPageId && k.include !== false).length, gOk = plan.groups.filter(g => String(g.reason || '').trim() && plan.keywords.filter(k => k.group === g.id && k.include !== false).length >= 2).length, qn = plan.makeQuestions ? newPts * plan.questionKinds.length : 0;
        return `<div class="tr-prime-commit"><h3>This will create, in one go:</h3><ul><li>${newPts} new <strong>Stub</strong> point${newPts === 1 ? '' : 's'} under “${esc(br.title)}”</li><li>${gOk} chunk${gOk === 1 ? '' : 's'}, each with the reason you wrote</li><li>${qn} red question${qn === 1 ? '' : 's'}</li></ul>
        <p class="faint tr-note">Nothing is answered. Stop here today — Aim and Shoot are separate sittings.</p><button class="btn primary" data-act="prime-commit"${newPts + gOk === 0 ? ' disabled' : ''}>Create all of it</button></div>`; })()}</div>`;
  root.innerHTML = `<div class="page tr-page tr-prime">${treeNav('')}${head}${body}
    <div class="row" style="gap:8px;margin-top:12px"><button class="btn ghost" data-act="prime-cancel">Cancel</button><span class="tr-grow"></span>${st.stage > 0 ? '<button class="btn" data-act="prime-back">Back</button>' : ''}${st.stage < 3 ? '<button class="btn primary" data-act="prime-next">Next</button>' : ''}</div></div>`;
  treeBindNav(root);
  const again = () => icsPrimeRoute(root, br.id), q = s => root.querySelector(s);
  const keep = () => { const r = q('[data-field="resources"]'); if(r) st.resources = r.value; const k = q('[data-field="keywords"]'); if(k) st.raw = k.value; };
  q('[data-act="prime-cancel"]').onclick = () => { ui.prime = null; navigate(treeUrl(br)); };
  const bk = q('[data-act="prime-back"]'); if(bk) bk.onclick = () => { keep(); st.stage--; again(); };
  const nx = q('[data-act="prime-next"]'); if(nx) nx.onclick = () => {
    keep();
    if(st.stage === 1){ const old = new Map(plan.keywords.map(k => [k.text.toLowerCase(), k])); plan.keywords = icsAnnotateExisting(icsParseKeywords(st.raw)).map(k => { const o = old.get(k.text.toLowerCase()); return o ? Object.assign(k, {include: o.include, group: o.group}) : k; }); if(!plan.keywords.length){ toast('Paste at least one term.'); return; } }
    st.stage++; again(); };
  root.querySelectorAll('[data-act="kw-inc"]').forEach(c => c.onchange = () => { plan.keywords[+c.dataset.i].include = c.checked; });
  root.querySelectorAll('[data-act="kw-group"]').forEach(sel => sel.onchange = async () => {
    const k = plan.keywords[+sel.dataset.i];
    if(sel.value === '__new'){ const label = await treeAsk('A few simple words for this group', ''); if(!label){ again(); return; } const g = {id: uid(), label, reason: '', keywordTexts: []}; plan.groups.push(g); k.group = g.id; again(); }
    else { k.group = sel.value || null; again(); } });
  root.querySelectorAll('[data-act="grp-reason"]').forEach(t => t.onchange = () => { plan.groups.find(g => g.id === t.dataset.g).reason = t.value; again(); });
  root.querySelectorAll('[data-act="qkind"]').forEach(c => c.onchange = () => { const k = c.dataset.k; plan.questionKinds = plan.questionKinds.filter(x => x !== k); if(c.checked) plan.questionKinds.push(k); again(); });
  const qm = q('[data-act="qmake"]'); if(qm) qm.onchange = () => { plan.makeQuestions = qm.checked; again(); };
  const cm = q('[data-act="prime-commit"]'); if(cm) cm.onclick = () => {
    plan.groups.forEach(g => { g.keywordTexts = plan.keywords.filter(k => k.group === g.id && k.include !== false).map(k => k.text); });
    const res = icsCommitPlan(plan); ui.prime = null;
    toast(`${res.created.length} stubs, ${res.chunks.length} chunks, ${res.questions.length} red questions.${res.skippedGroups.length ? ' ' + res.skippedGroups.length + ' group(s) skipped — they needed a reason or two pages.' : ''}`, 7000);
    navigate(treeUrl(br)); };
}
ICS_ROUTES.prime = (root, a) => icsPrimeRoute(root, a);

/* ============================================================
   N-07  Whole-Part-Whole teaching
   ============================================================ */
function icsBuildTeachPlan(branchId){
  const br = treeNode(branchId);
  if(!br || br.kind === 'point') throw new Error('teach a branch or a root, not a point');
  const kids = treeChildren(branchId).filter(p => p.status !== 'pruned'), rt = icsRootOf(br);
  const chunks = icsChunksUnderRoot(rt.id).filter(c => c.memberIds.some(id => kids.some(k => k.id === id)));
  let parts;
  if(chunks.length >= 2) parts = chunks.map(c => ({kind: 'chunk', id: c.id, label: c.title, reason: c.reason, members: c.memberIds.map(treeNode).filter(Boolean)}));
  else { const bones = kids.filter(icsIsTrunk); parts = (bones.length >= 2 ? bones : kids).map(p => ({kind: 'page', id: p.id, label: p.title, members: [p]})); }
  return {branchId, whole: {label: br.title, prompt: 'Before you name anything: why does this matter? What would be missing without it?'},
    parts: parts.map((p, i) => Object.assign({}, p, {order: i, prompt: p.kind === 'chunk' ? 'Teach this group. Why do these belong together, and where do they part company?' : 'Teach this. Then say what it is NOT.'})),
    close: {label: br.title, prompt: 'Now the whole again, in two or three sentences. What changed in how you see it?'}};
}
/* the order changes from one session to the next, deterministically: a fixed order would teach you the sequence, not the material */
function icsOrderParts(parts, idx){
  if(parts.length < 2) return parts;
  const n = parts.length, stride = 1 + (idx % Math.max(1, n - 1)), out = [];
  for(let i = 0; i < n; i++) out.push(parts[(i * stride + idx) % n]);
  const seen = new Set(), clean = []; [...out, ...parts].forEach(p => { if(seen.has(p.id)) return; seen.add(p.id); clean.push(p); });
  return clean;
}
const ICS_MIN_WORDS_PER_STEP = 20;
function icsMakeTeachSession(branchId, idx){
  if(idx == null) idx = icsRetrievalsFor(branchId).filter(r => r.method === 'teach').length;
  const plan = icsBuildTeachPlan(branchId), parts = icsOrderParts(plan.parts, idx);
  const steps = [Object.assign({phase: 'whole'}, plan.whole), ...parts.map(p => Object.assign({phase: 'part'}, p)), Object.assign({phase: 'close'}, plan.close)];
  let i = 0; const written = [];
  return {
    get index(){ return i; }, get total(){ return steps.length; }, current(){ return steps[i]; }, get steps(){ return steps; }, get written(){ return written; },
    submit(text){
      if(icsWords(text) < ICS_MIN_WORDS_PER_STEP) return {ok: false, message: 'Teach it properly — at least a couple of sentences, or skip this part.'};
      written.push({step: steps[i], text}); i++; return {ok: true, done: i >= steps.length};
    },
    skip(){ written.push({step: steps[i], text: null}); i++; return {ok: true, done: i >= steps.length}; },
    /* the self-check comes after, against the pages; the software does not grade */
    finish(score){
      const taught = written.filter(w => w.text);
      const body = taught.map(w => '## ' + w.step.phase.toUpperCase() + ': ' + w.step.label + '\n' + w.text).join('\n\n');
      const retrieval = icsRecordRetrieval({pageId: branchId, method: 'teach', recallText: body, score, blank: taught.length === 0});
      return {retrieval, covered: taught.length, skipped: written.length - taught.length};
    }
  };
}
function icsTeachRoute(root, ref){
  const br = ref ? (treeNode(ref) || treeResolve(decodeURIComponent(ref))) : null;
  if(!br || br.kind === 'point'){ root.innerHTML = `<div class="page tr-page">${treeNav('')}<header class="tr-head"><h1 class="serif">Teach</h1></header><p class="faint">Teaching works on a branch or a root — a point is too small to have parts.</p></div>`; treeBindNav(root); return; }
  const ui = icsUi(); let st = ui.teach && ui.teach.id === br.id ? ui.teach : null;
  if(!st){ let sess; try { sess = icsMakeTeachSession(br.id); } catch(e){ root.innerHTML = `<div class="page tr-page">${treeNav('')}<p class="faint">${esc(e.message)}</p></div>`; treeBindNav(root); return; } st = ui.teach = {id: br.id, sess, done: false, result: null}; }
  const s = st.sess, finished = s.index >= s.total;
  if(st.result){
    root.innerHTML = `<div class="page tr-page tr-teach" data-phase="finished">${treeNav('')}<header class="tr-head"><h1 class="serif">Taught.</h1></header><p>Covered ${st.result.covered} of ${s.total} steps. ${st.result.skipped} skipped.</p>
      <p class="faint">Recorded as a level 4 retrieval. Consider setting this branch’s mastery if the teaching changed your view of it.</p>
      <form class="tr-mastery-form" onsubmit="return false"><label>Level <select class="sel" name="level">${ICS_MASTERY.map(x => `<option value="${x.level}">${x.level} · ${esc(x.name)}</option>`).join('')}</select></label><label class="grow">Evidence <input class="inp" name="evidence" placeholder="What did you do that showed this?"></label><button type="button" class="btn sm" data-act="mastery-save">Record</button></form><p class="tr-err" id="trMastErr"></p>
      <div class="row" style="gap:8px;margin-top:12px"><a class="btn" href="${treeUrl(br)}">Back to the page</a></div></div>`;
    treeBindNav(root);
    root.querySelector('[data-act="mastery-save"]').onclick = () => { const f = root.querySelector('.tr-mastery-form'); try { icsSetMastery(br.id, f.level.value, f.evidence.value); ui.teach = null; navigate(treeUrl(br)); } catch(e){ root.querySelector('#trMastErr').textContent = e.message; } };
    return;
  }
  if(finished){
    const pos = treeCurrentPosition(br.id);
    root.innerHTML = `<div class="page tr-page tr-teach" data-phase="done">${treeNav('')}<header class="tr-head"><h1 class="serif">How did that go?</h1></header>
      <div class="tr-teach-review"><section><h3>What you taught</h3>${s.written.map(w => `<h4>${esc(w.step.phase)}: ${esc(w.step.label)}</h4>${w.text ? `<pre class="tr-recalled">${esc(w.text)}</pre>` : '<p class="faint">skipped</p>'}`).join('')}</section>
        <section><h3>What the pages say</h3>${pos ? `<p class="tr-stmt">${esc(pos.statement)} <span class="faint">(${pos.confidence}%)</span></p>` : ''}<div class="prose">${(br.body || '').trim() ? treeRender(br.body) : ''}</div>
          <ul>${treeChildren(br.id).map(k => { const kp = treeCurrentPosition(k.id); return `<li>${treeKindMark(k)}<a href="${treeUrl(k)}">${esc(k.title)}</a>${kp ? ` — ${esc(kp.statement)}` : ''}</li>`; }).join('')}</ul></section></div>
      <p>Covered ${s.written.filter(w => w.text).length} of ${s.total} steps. ${s.written.filter(w => !w.text).length} skipped.</p>
      <div class="row" style="gap:8px"><button class="btn" data-act="grade" data-v="0">Missed it</button><button class="btn" data-act="grade" data-v="0.5">Patchy</button><button class="btn primary" data-act="grade" data-v="1">Taught it cleanly</button></div></div>`;
    treeBindNav(root);
    root.querySelectorAll('[data-act="grade"]').forEach(b => b.onclick = () => { st.result = s.finish(+b.dataset.v); icsTeachRoute(root, br.id); });
    return;
  }
  const cur = s.current();
  root.innerHTML = `<div class="page tr-page tr-teach" data-phase="${cur.phase}">${treeNav('')}<p class="tr-teach-progress faint">Step ${s.index + 1} of ${s.total} — ${cur.phase === 'whole' ? 'the whole' : cur.phase === 'part' ? 'a part' : 'the whole again'}</p>
    <h2 class="serif">${esc(cur.label)}</h2><p class="tr-prompt">${esc(cur.prompt)}</p>
    ${cur.phase === 'part' && cur.kind === 'chunk' ? `<ul class="tr-teach-members">${cur.members.map(m => `<li>${esc(m.title)}</li>`).join('')}</ul>` : ''}
    ${cur.phase === 'whole' ? '<p class="faint tr-hint">You are teaching someone who has never heard the words. No jargon until they would ask for it.</p>' : ''}
    <textarea class="inp" rows="10" data-field="teaching" placeholder="Teach it…"></textarea><p class="tr-err" data-field="err"></p>
    <div class="row" style="gap:8px;margin-top:8px"><button class="btn primary" data-act="teach-next">Next</button><button class="btn ghost tr-quiet" data-act="teach-skip">Skip this part</button><span class="tr-grow"></span><button class="btn ghost" data-act="teach-quit">Leave — nothing is kept</button></div>
    <p class="faint tr-note">The pages are hidden until the end. This is teaching, not reading.</p></div>`;
  treeBindNav(root);
  root.querySelector('[data-act="teach-next"]').onclick = () => { const r = s.submit(root.querySelector('[data-field="teaching"]').value); if(!r.ok){ root.querySelector('[data-field="err"]').textContent = r.message; return; } icsTeachRoute(root, br.id); };
  root.querySelector('[data-act="teach-skip"]').onclick = () => { s.skip(); icsTeachRoute(root, br.id); };
  root.querySelector('[data-act="teach-quit"]').onclick = () => { ui.teach = null; navigate(treeUrl(br)); };
}
ICS_ROUTES.teach = (root, a) => icsTeachRoute(root, a);

/* ---------- the page and the outline reach these ---------- */
function icsPageActionsHTML(n){
  return `${n.kind === 'root' ? `<a class="tbtn" href="#/tree/map/${n.id}" data-act="see-map">See the chunk map</a>` : ''}`;
}
