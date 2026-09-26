/* ============================================================
   THE KNOWLEDGE TREE — the model.

   A personal wiki for a lifelong inquiry. Every page has one home in the
   tree (a root, a branch under it, a point under that). Links in the text
   are for getting about; grafts, each with a type and a reason, are what
   reasoning rests on. Library, Journal and Writing entries stay in their own
   rooms: the Tree keeps references to them and nothing else.

   Two kinds of record are add-only, and that is enforced here rather than
   hoped for:
   - positions (what you held, and how sure you were), and
   - sealed predictions (only their resolution may be filled in, once).
   There are no functions that edit or delete them; the rows are frozen in
   memory; and persist() calls treeGuard, which refuses to write a store in
   which a row once written has changed or gone, and puts it back.

   Slugs and aliases are unique in code: the fallback database cannot open a
   unique index, so the in-memory maps are checked before every save.
   ============================================================ */

const TREE_STORES = ['treeNodes', 'treeAliases', 'treeLinks', 'treeGrafts', 'treePositions', 'treeLeaves', 'treeInbox', 'treeReviews', 'treePredictions', 'treeExperiments'];
const TREE_KINDS = {root: 'Root', branch: 'Branch', point: 'Point'};
const TREE_STATUS = {stub: 'Stub', active: 'Active', dormant: 'Dormant', pruned: 'Pruned'};
const TREE_GRAFTS = {supports: 'supports', contradicts: 'contradicts', extends: 'extends', echoes: 'echoes', raises: 'raises'};
const TREE_GRAFT_BLURB = {supports: 'gives reason to believe', contradicts: 'pulls against', extends: 'carries further', echoes: 'rhymes with, from elsewhere', raises: 'opens the question of'};
const TREE_ADD_ONLY = ['treePositions', 'treePredictions'];
const TREE = {idx: null, ver: 0};

/* every Tree store exists on S as an array, and the add-only rows are frozen */
function treeEnsure(){
  TREE_STORES.forEach(k => { if(!Array.isArray(S[k])) S[k] = []; });
  TREE_ADD_ONLY.forEach(k => { S[k] = S[k].map(r => Object.isFrozen(r) ? r : Object.freeze(Object.assign({}, r))); });
  S.treePrefs = Object.assign({dismissed: [], lastSummary: null, lastYearAgo: null, lastExportAt: null, outlineOpen: {}}, S.treePrefs || {});
  TREE.idx = null;
}
function treeNow(){ return new Date().toISOString(); }
function treeToday(){ return typeof today === 'function' ? today() : new Date().toISOString().slice(0, 10); }

/* ---------- slugs ---------- */
function treeSlug(title){
  return String(title || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/['’]/g, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'untitled';
}

/* ---------- the index: slugs, aliases, children, backlinks ---------- */
function treeIndex(){
  if(TREE.idx) return TREE.idx;
  const bySlug = new Map(), byId = new Map(), alias = new Map(), kids = new Map(), back = new Map(), leaves = new Map(), grafts = new Map();
  S.treeNodes.forEach(n => { bySlug.set(n.slug, n); byId.set(n.id, n); });
  S.treeAliases.forEach(a => { if(byId.has(a.nodeId)) alias.set(a.alias, a.nodeId); });
  S.treeNodes.forEach(n => { if(n.parentId){ (kids.get(n.parentId) || kids.set(n.parentId, []).get(n.parentId)).push(n); } });
  kids.forEach(l => l.sort((a, b) => a.title.localeCompare(b.title)));
  /* backlinks from the links table, never from the bodies: toSlug → fromIds */
  S.treeLinks.forEach(l => { if(l.toRoom !== 'tree') return; (back.get(l.toSlug) || back.set(l.toSlug, new Set()).get(l.toSlug)).add(l.fromId); });
  S.treeLeaves.forEach(l => { (leaves.get(l.entryId) || leaves.set(l.entryId, []).get(l.entryId)).push(l); });
  S.treeGrafts.forEach(g => { [g.fromId, g.toId].forEach(id => (grafts.get(id) || grafts.set(id, []).get(id)).push(g)); });
  return (TREE.idx = {bySlug, byId, alias, kids, back, leaves, grafts});
}
function treeDirty(){ TREE.idx = null; TREE.ver++; }
function treeNode(id){ return treeIndex().byId.get(id) || null; }
/* a title, a slug or an alias, to the page it names */
function treeResolve(ref){
  const I = treeIndex(), s = treeSlug(ref);
  if(I.bySlug.has(s)) return I.bySlug.get(s);
  const a = I.alias.get(s); return a ? I.byId.get(a) || null : null;
}
function treeChildren(id){ return (treeIndex().kids.get(id) || []).filter(n => n.status !== 'pruned' || S.treePrefs.showPruned); }
function treeRoots(){ return S.treeNodes.filter(n => !n.parentId).sort((a, b) => a.title.localeCompare(b.title)); }
function treeAncestors(n){ const out = []; let x = n, guard = 0; while(x && x.parentId && guard++ < 50){ x = treeNode(x.parentId); if(x) out.unshift(x); } return out; }
function treeBacklinks(n){
  const I = treeIndex(), from = new Set();
  [n.slug, ...S.treeAliases.filter(a => a.nodeId === n.id).map(a => a.alias)].forEach(s => (I.back.get(s) || []).forEach(id => from.add(id)));
  from.delete(n.id);
  return [...from].map(id => I.byId.get(id)).filter(Boolean);
}
function treeUrl(n){ return '#/tree/p/' + encodeURIComponent(n.slug); }

/* ---------- pages ---------- */
/* is this slug free for this page? (a page's own old aliases do not count against it) */
function treeSlugFree(slug, forId){
  const I = treeIndex();
  const n = I.bySlug.get(slug); if(n && n.id !== forId) return false;
  const a = I.alias.get(slug); if(a && a !== forId) return false;
  return true;
}
function treeValidate(n){
  if(!String(n.title || '').trim()) return 'A page needs a title.';
  if(n.kind !== 'root' && !n.parentId) return 'A ' + (n.kind === 'point' ? 'point' : 'branch') + ' needs a home — choose its parent.';
  if(n.parentId && n.parentId === n.id) return 'A page cannot be its own parent.';
  if(n.parentId){ let x = treeNode(n.parentId), guard = 0; while(x && guard++ < 60){ if(x.id === n.id) return 'That parent sits under this page; the tree would loop.'; x = x.parentId ? treeNode(x.parentId) : null; } }
  if(n.parentId && !treeNode(n.parentId)) return 'That parent is not in the tree.';
  if(!treeSlugFree(treeSlug(n.title), n.id)) return `“${n.title}” is already a page (or another page's old name). Open that one instead, or choose another title.`;
  return null;
}
/* create or change a page. Renaming leaves the old title as an alias. */
function treeSavePage(draft){
  treeEnsure();
  const old = draft.id ? treeNode(draft.id) : null;
  const n = Object.assign({}, old || {id: uid(), createdAt: treeNow(), status: 'stub', kind: 'point', body: '', openQuestion: '', lastTendedAt: null}, draft);
  n.title = String(n.title || '').trim();
  const err = treeValidate(n); if(err) return {error: err};
  const slug = treeSlug(n.title);
  if(old && old.slug !== slug){
    /* the old name keeps working, as a redirect */
    if(!S.treeAliases.some(a => a.alias === old.slug)) S.treeAliases.push({id: uid(), alias: old.slug, title: old.title, nodeId: n.id, createdAt: treeNow()});
    /* and if the new name had been this page's own alias, it is a name again, not a redirect */
    S.treeAliases = S.treeAliases.filter(a => !(a.alias === slug && a.nodeId === n.id));
  }
  n.slug = slug; n.updatedAt = treeNow();
  if(!old && n.status === 'stub' && (n.body || '').trim()) n.status = 'active';
  if(old) Object.assign(old, n); else S.treeNodes.push(n);
  treeRebuildLinks(old || n);
  treeDirty();
  if(!old) treeScheduleReview(n.id);
  let warn = null;
  const parent = n.parentId ? treeNode(n.parentId) : null;
  if(parent && treeChildren(parent.id).filter(k => k.kind === 'point').length > 15) warn = `“${parent.title}” now holds more than 15 points. It may want a branch or two.`;
  save();
  return {node: old || n, warn};
}
function treeAddAlias(nodeId, title){
  const a = treeSlug(title); if(!a) return 'An alias needs some letters.';
  if(!treeSlugFree(a, nodeId)) return `“${title}” already names a page.`;
  if(S.treeAliases.some(x => x.alias === a && x.nodeId === nodeId)) return null;
  S.treeAliases.push({id: uid(), alias: a, title, nodeId, createdAt: treeNow()}); treeDirty(); save(); return null;
}
/* pruning is a status, not a deletion: the page and everything that points at it keep */
function treeSetStatus(id, status){ const n = treeNode(id); if(!n || !TREE_STATUS[status]) return; n.status = status; n.updatedAt = treeNow(); if(status === 'pruned') n.prunedAt = treeNow(); treeDirty(); save(); }
function treeTouch(id){ const n = treeNode(id); if(!n) return; n.lastTendedAt = treeNow(); save(); }

/* ---------- positions: ADD-ONLY ---------- */
function treePositionsOf(id){ return S.treePositions.filter(p => p.nodeId === id).sort((a, b) => a.date < b.date ? -1 : 1); }
function treeCurrentPosition(id){ const l = treePositionsOf(id); return l[l.length - 1] || null; }
function treeAddPosition(nodeId, statement, confidence){
  const st = String(statement || '').trim(); if(!st) return {error: 'A position needs a statement.'};
  const c = Math.max(0, Math.min(100, Math.round(+confidence)));
  if(!Number.isFinite(c)) return {error: 'Confidence is a number from 0 to 100.'};
  const row = Object.freeze({id: uid(), nodeId, date: treeNow(), statement: st, confidence: c});
  S.treePositions.push(row);
  const n = treeNode(nodeId); if(n){ n.lastTendedAt = treeNow(); if(n.status === 'stub') n.status = 'active'; }
  treeDirty(); save();
  return {position: row};
}

/* ---------- the guard, called by persist() before anything is written ---------- */
function treeGuard(rows, lastWritten){
  let broke = 0;
  TREE_ADD_ONLY.forEach(k => {
    if(!lastWritten[k]) return;
    let prev; try { prev = JSON.parse(lastWritten[k]); } catch(e){ return; }
    const cur = new Map((rows[k] || []).map(r => [r.id, r]));
    const fixed = (rows[k] || []).slice();
    prev.forEach(old => {
      const now = cur.get(old.id);
      if(now && JSON.stringify(now) === JSON.stringify(old)) return;
      if(now && k === 'treePredictions' && treeIsResolution(old, now)) return;
      broke++;
      const frozen = Object.freeze(Object.assign({}, old));
      const i = fixed.findIndex(r => r.id === old.id);
      if(i > -1) fixed[i] = frozen; else fixed.push(frozen);
    });
    if(fixed.length !== (rows[k] || []).length || broke){ S[k] = fixed; rows[k] = fixed; }
  });
  if(broke){ console.warn(`Knowledge Tree: ${broke} add-only record(s) were changed or removed; they have been put back.`);
    if(typeof toast === 'function') toast('A position or sealed prediction cannot be changed or removed once saved. It has been put back.', 5000); }
  return broke;
}
/* the one change a sealed prediction allows: its outcome, from empty, once */
function treeIsResolution(old, now){
  if(old.resolvedAt || old.outcome != null) return false;
  if(!now.resolvedAt || (now.outcome !== true && now.outcome !== false)) return false;
  const a = Object.assign({}, old), b = Object.assign({}, now);
  delete a.resolvedAt; delete a.outcome; delete a.resolutionNote; delete b.resolvedAt; delete b.outcome; delete b.resolutionNote;
  return JSON.stringify(a) === JSON.stringify(b);
}

/* ---------- links, rebuilt from the body on every save ---------- */
const TREE_LINK_RE = /\[\[([^\[\]|]+?)(?:\|([^\[\]]+?))?\]\]/g;
function treeParseLinks(text){
  const out = []; let m; TREE_LINK_RE.lastIndex = 0;
  while((m = TREE_LINK_RE.exec(String(text || '')))){
    const raw = m[1].trim(), disp = (m[2] || '').trim();
    const pm = /^(library|journal|writing):\s*(.+)$/i.exec(raw);
    out.push(pm ? {room: pm[1].toLowerCase(), target: pm[2].trim(), display: disp || pm[2].trim(), raw: m[0]} : {room: 'tree', target: raw, display: disp || raw, raw: m[0]});
  }
  return out;
}
function treeRebuildLinks(n){
  S.treeLinks = S.treeLinks.filter(l => l.fromId !== n.id);
  const seen = new Set();
  treeParseLinks((n.body || '') + '\n' + (n.openQuestion || '')).forEach(l => {
    const toSlug = l.room === 'tree' ? treeSlug(l.target) : l.target.toLowerCase();
    const k = l.room + ':' + toSlug; if(seen.has(k)) return; seen.add(k);
    S.treeLinks.push({id: uid(), fromId: n.id, toSlug, toRoom: l.room, text: l.target});
  });
}

/* ---------- leaves: references to entries in other rooms ---------- */
function treeJournalTypes(){ return new Set(['journal', ...((S.journals || []).map(j => j.type))]); }
function treeRoomOf(e){
  if(!e) return null;
  if(e.type === 'media') return 'library';
  if(e.type === 'writing') return 'writing';
  if(treeJournalTypes().has(e.type)) return 'journal';
  return null;
}
function treeAttachLeaf(nodeId, entryId, note){
  const e = byId(S.entries, entryId), room = treeRoomOf(e);
  if(!e || !room) return 'Only Library, Journal and Writing entries can be leaves.';
  if(S.treeLeaves.some(l => l.nodeId === nodeId && l.entryId === entryId)) return null;
  S.treeLeaves.push({id: uid(), nodeId, entryId, room, note: note || '', createdAt: treeNow()});
  const n = treeNode(nodeId); if(n) n.lastTendedAt = treeNow();
  treeDirty(); save(); return null;
}
function treeDetachLeaf(leafId){ S.treeLeaves = S.treeLeaves.filter(l => l.id !== leafId); treeDirty(); save(); }
function treeLeavesOf(nodeId){ return S.treeLeaves.filter(l => l.nodeId === nodeId); }
/* the pages an entry feeds, for the line in its own room */
function treeFeedsOf(entryId){ if(!Array.isArray(S.treeLeaves)) return []; return (treeIndex().leaves.get(entryId) || []).map(l => treeNode(l.nodeId)).filter(Boolean); }
function treeFeedsHTML(entryId){
  const pages = treeFeedsOf(entryId); if(!pages.length) return '';
  return `<div class="tr-feeds"><span>Feeds:</span> ${pages.map(n => `<a href="${treeUrl(n)}">${esc(n.title)}</a>`).join(', ')}</div>`;
}

/* ---------- grafts ---------- */
function treeAddGraft(fromId, toId, type, why){
  if(!TREE_GRAFTS[type]) return {error: 'Choose what kind of graft this is.'};
  if(!String(why || '').trim()) return {error: 'A graft needs its reason — why does this bear on that?'};
  if(fromId === toId) return {error: 'A page cannot be grafted to itself.'};
  if(!treeNode(fromId) || !treeNode(toId)) return {error: 'Both pages have to exist.'};
  if(S.treeGrafts.some(g => g.fromId === fromId && g.toId === toId && g.type === type)) return {error: 'That graft is already there.'};
  const g = {id: uid(), fromId, toId, type, why: String(why).trim(), createdAt: treeNow(), resolvedAt: null, resolution: ''};
  S.treeGrafts.push(g); [fromId, toId].forEach(id => { const n = treeNode(id); if(n) n.lastTendedAt = treeNow(); });
  treeDirty(); save(); return {graft: g};
}
function treeResolveTension(id, how){
  const g = S.treeGrafts.find(x => x.id === id); if(!g) return;
  if(!String(how || '').trim()) return 'Say how it was resolved.';
  g.resolvedAt = treeNow(); g.resolution = String(how).trim(); treeDirty(); save(); return null;
}
function treeRemoveGraft(id){ S.treeGrafts = S.treeGrafts.filter(g => g.id !== id); treeDirty(); save(); }

/* ---------- the inbox ---------- */
function treeCapture(text){ const t = String(text || '').trim(); if(!t) return null; const r = {id: uid(), createdAt: treeNow(), text: t}; S.treeInbox.push(r); save(); return r; }
function treeInboxDone(id){ S.treeInbox = S.treeInbox.filter(x => x.id !== id); save(); }

/* ---------- spaced resurfacing: 3 days, 2 weeks, 2 months, 6 months, a year ---------- */
const TREE_REVIEW_DAYS = [3, 14, 61, 183, 365];
function treeAddDays(iso, d){ const x = new Date(iso + 'T12:00:00'); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); }
function treeScheduleReview(nodeId){
  if(S.treeReviews.some(r => r.nodeId === nodeId)) return;
  S.treeReviews.push({id: uid(), nodeId, step: 0, dueAt: treeAddDays(treeToday(), TREE_REVIEW_DAYS[0]), history: []});
}
function treeReviewAnswer(nodeId, verdict){
  treeScheduleReview(nodeId);
  const r = S.treeReviews.find(x => x.nodeId === nodeId);
  r.history.push({date: treeNow(), verdict});
  /* holding moves it out along the ladder; doubting brings it back to the start; revising keeps its place */
  r.step = verdict === 'hold' ? Math.min(TREE_REVIEW_DAYS.length - 1, r.step + 1) : verdict === 'doubt' ? 0 : r.step;
  r.dueAt = treeAddDays(treeToday(), TREE_REVIEW_DAYS[r.step]);
  treeTouch(nodeId); save();
  return r;
}
function treeDueReviews(){ const t = treeToday(); return S.treeReviews.filter(r => r.dueAt <= t && treeNode(r.nodeId) && treeNode(r.nodeId).status !== 'pruned').sort((a, b) => a.dueAt < b.dueAt ? -1 : 1); }

/* ---------- export and import of the Tree alone ---------- */
function treeExport(){
  const data = {}; TREE_STORES.forEach(k => data[k] = S[k]);
  const payload = {kind: 'life-instrument-knowledge-tree', version: 1, exportedAt: treeNow(), data};
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `knowledge-tree-${treeToday()}.json`; document.body.appendChild(a); a.click(); a.remove();
  S.treePrefs.lastExportAt = treeNow(); save();
  return payload;
}
/* An import adds what is missing and never overwrites what is here: a page you
   have changed since keeps your version, and add-only records are only added. */
function treeImport(obj){
  if(!obj || obj.kind !== 'life-instrument-knowledge-tree' || !obj.data) return {error: 'That file is not a Knowledge Tree export.'};
  const added = {}; let kept = 0;
  TREE_STORES.forEach(k => {
    const rows = Array.isArray(obj.data[k]) ? obj.data[k] : []; added[k] = 0;
    const have = new Set(S[k].map(r => r.id));
    rows.forEach(r => {
      if(!r || !r.id) return;
      if(have.has(r.id)){ kept++; return; }
      if(k === 'treeNodes' && !treeSlugFree(r.slug, r.id)){ kept++; return; }
      S[k].push(TREE_ADD_ONLY.includes(k) ? Object.freeze(Object.assign({}, r)) : r); added[k]++;
    });
  });
  treeDirty(); save();
  return {added, kept};
}
function treeExportAgeDays(){
  const last = [S.treePrefs && S.treePrefs.lastExportAt, (() => { try { return localStorage.getItem('lastBackupDate'); } catch(e){ return null; } })()].filter(Boolean).map(x => Date.parse(x)).filter(Number.isFinite);
  if(!last.length) return null;
  return Math.floor((Date.now() - Math.max(...last)) / 864e5);
}
