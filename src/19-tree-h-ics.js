/* ============================================================
   THE KNOWLEDGE TREE × iCanStudy — the foundation (A-01 … A-05).

   Amends the Tree from a record of belief into an instrument for encoding:
   pages gain an importance, a reason why it matters, a backbone flag, a
   mastery level and a collecting/processing split; there are chunks,
   questions, retrievals, mistakes and Kolb reflections; the ladder is
   configurable; and a read-only map shows what the outline cannot.

   This file holds what everything after it stands on:
     - the schema, backfilled additively and safely run twice (icsEnsure);
     - the page's earlier versions, append-only (A-04);
     - the stored weekly summaries, now shown (A-02);
     - near-match "did you mean" for red links (A-03);
     - "Open in Studio" on branch pages (A-01);
     - the gap registry and its encoding rules (A-05).

   The invariants hold throughout: no AI, no network; nothing filed, merged,
   deleted or promoted without being asked; exactly one parent per page;
   gaps are prompts and never block a save; positions and sealed predictions
   stay immutable; the Studio stays a separate room.
   ============================================================ */

const ICS_SCHEMA_VERSION = 2;
/* the fields every page may carry; absent means "not yet", never "false by default" */
const ICS_PAGE_DEFAULTS = {importance: null, whyImportant: '', backbone: false, mastery: null, collected: null, processed: null};
const ICS_IMPORTANCE = {core: 'Core', supporting: 'Supporting', peripheral: 'Peripheral'};
/* what a revision keeps: the text the user wrote and the encoding fields */
const ICS_WATCHED = ['title', 'body', 'openQuestion', 'importance', 'whyImportant', 'backbone', 'collected', 'processed'];
const ICS_DEFAULT_LADDER = [0, 1, 3, 7, 16, 50, 120, 365];

function icsToday(){ return treeToday(); }
function icsDaysBetween(a, b){ return Math.round((Date.parse(b.slice(0, 10) + 'T12:00:00') - Date.parse(a.slice(0, 10) + 'T12:00:00')) / 864e5); }
function icsDaysAgo(iso){ return iso ? Math.floor((Date.now() - Date.parse(iso)) / 864e5) : null; }
function icsWords(s){ return String(s || '').trim().split(/\s+/).filter(Boolean).length; }

/* ---------- the migration: additive, idempotent, never touches prose ---------- */
function icsEnsure(){
  const P = S.treePrefs; if(!P) return {migrated: false};
  let touched = 0;
  const from = P.icsSchema || 0;
  /* backfill the page fields that are absent; never overwrite */
  if(from < ICS_SCHEMA_VERSION){
    (S.treeNodes || []).forEach(n => {
      let ch = false;
      Object.keys(ICS_PAGE_DEFAULTS).forEach(k => { if(!(k in n)){ n[k] = ICS_PAGE_DEFAULTS[k]; ch = true; } });
      if(ch) touched++;
    });
    if(!Array.isArray(P.ladder)) P.ladder = ICS_DEFAULT_LADDER.slice();
    P.icsSchema = ICS_SCHEMA_VERSION;
    return {migrated: true, from, to: ICS_SCHEMA_VERSION, pagesTouched: touched};
  }
  if(!Array.isArray(P.ladder)) P.ladder = ICS_DEFAULT_LADDER.slice();
  return {migrated: false, from};
}

/* ---------- small tree helpers the later parts share ---------- */
function icsDescendants(id){
  const out = [], stack = [id], I = treeIndex(), seen = new Set([id]);
  while(stack.length){ (I.kids.get(stack.pop()) || []).forEach(k => { if(seen.has(k.id)) return; seen.add(k.id); out.push(k); stack.push(k.id); }); }
  return out;
}
function icsRootOf(n){ let x = n, g = 0; while(x && x.parentId && g++ < 60){ const p = treeNode(x.parentId); if(!p) break; x = p; } return x; }
function icsLinksOut(n){
  return (S.treeLinks || []).filter(l => l.fromId === n.id && l.toRoom === 'tree').map(l => treeResolve(l.toSlug)).filter(x => x && x.id !== n.id);
}
function icsGraftsOf(id){ return treeIndex().grafts.get(id) || []; }
/* the page text, with the split honoured: processed (own words) when the page has opted in, else the old body */
function icsOwnText(n){ return n.processed != null ? String(n.processed) : String(n.body || ''); }

/* ============================================================
   A-04  The page's earlier versions. Append-only, like positions.
   ============================================================ */
function icsNorm(v){ return v == null || v === false ? '' : v; }
function icsSnapshot(n){
  const fields = {};
  ICS_WATCHED.forEach(k => { if(k !== 'body') fields[k] = n[k] == null ? null : n[k]; });
  return {text: n.body == null ? '' : String(n.body), fields};
}
function icsRevisionsFor(pageId){
  return (S.treePageRevisions || []).filter(r => r.pageId === pageId).sort((a, b) => a.savedAt < b.savedAt ? 1 : a.savedAt > b.savedAt ? -1 : (b.seq || 0) - (a.seq || 0));
}
function icsLatestRevision(pageId){ return icsRevisionsFor(pageId)[0] || null; }
/* called inside treeSavePage with the page as it is now (old) and as it is about to be (next):
   a revision is kept only when a watched field is really changing */
function icsRecordRevision(old, next){
  if(!old || !old.id) return null;
  if(next && !ICS_WATCHED.some(k => icsNorm(old[k]) !== icsNorm(next[k]))) return null;
  const snap = icsSnapshot(old), last = icsLatestRevision(old.id);
  if(last && last.text === snap.text && JSON.stringify(last.fields) === JSON.stringify(snap.fields)) return null;
  if(!Array.isArray(S.treePageRevisions)) S.treePageRevisions = [];
  const rev = Object.freeze({id: uid(), pageId: old.id, savedAt: treeNow(), seq: S.treePageRevisions.length, text: snap.text, fields: snap.fields});
  S.treePageRevisions.push(rev);
  return rev;
}
/* restoring is a new save: the present is archived first, nothing is rewound */
function icsRestoreRevision(revId){
  const rev = (S.treePageRevisions || []).find(r => r.id === revId); if(!rev) return {error: 'That version is not there.'};
  const n = treeNode(rev.pageId); if(!n) return {error: 'The page is gone.'};
  const draft = {id: n.id, body: rev.text};
  Object.keys(rev.fields).forEach(k => { if(k !== 'title') draft[k] = rev.fields[k]; });
  return treeSavePage(draft);
}
/* a word-level diff, worked out when it is shown and never stored */
function icsWordDiff(a, b){
  const A = String(a || '').split(/(\s+)/).filter(x => x !== ''), B = String(b || '').split(/(\s+)/).filter(x => x !== '');
  if(A.length > 1800 || B.length > 1800) return null;
  const n = A.length, m = B.length, L = Array.from({length: n + 1}, () => new Uint16Array(m + 1));
  for(let i = n - 1; i >= 0; i--) for(let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = []; let i = 0, j = 0;
  while(i < n && j < m){ if(A[i] === B[j]){ out.push({t: '=', v: A[i]}); i++; j++; } else if(L[i + 1][j] >= L[i][j + 1]){ out.push({t: '-', v: A[i++]}); } else { out.push({t: '+', v: B[j++]}); } }
  while(i < n) out.push({t: '-', v: A[i++]}); while(j < m) out.push({t: '+', v: B[j++]});
  return out;
}
function icsDiffHTML(a, b){
  const d = icsWordDiff(a, b); if(!d) return '<p class="faint">Too long to compare word by word; use View.</p>';
  return `<p class="tr-diff">${d.map(x => x.t === '=' ? esc(x.v) : x.t === '-' ? `<del>${esc(x.v)}</del>` : `<ins>${esc(x.v)}</ins>`).join('')}</p>`;
}
function icsRevWords(rev, now){ const a = icsWords(rev.text), b = icsWords(now); return `${b - a >= 0 ? '+' : '−'}${Math.abs(b - a)} words since`; }
function icsHistoryHTML(n){
  const revs = icsRevisionsFor(n.id);
  return `<details class="tr-history" id="trHistory"><summary>Earlier versions (<span data-count>${revs.length}</span>)</summary>
    ${revs.length ? `<ol class="tr-history-list">${revs.map(r => `<li><time datetime="${esc(r.savedAt)}">${esc(fmtDate(r.savedAt.slice(0, 10), 'med'))}, ${esc(r.savedAt.slice(11, 16))}</time> <span class="faint">${esc(icsRevWords(r, n.body))}</span>
      <button class="tbtn sm" data-act="rev-view" data-rev="${r.id}">View</button><button class="tbtn sm" data-act="rev-diff" data-rev="${r.id}">Compare with now</button><button class="tbtn sm" data-act="rev-restore" data-rev="${r.id}">Restore as a new save</button></li>`).join('')}</ol>` : '<p class="faint">Nothing earlier yet. A version is kept each time the page text changes.</p>'}
    <p class="faint tr-note">Earlier versions are kept, never edited and never deleted — like positions. History starts from the day this was switched on.</p></details>`;
}
function icsBindHistory(root, n){
  root.querySelectorAll('[data-act^="rev-"]').forEach(b => b.onclick = () => {
    const rev = (S.treePageRevisions || []).find(r => r.id === b.dataset.rev); if(!rev) return;
    if(b.dataset.act === 'rev-view'){ openModal(`<h2 class="serif">${esc(n.title)}, ${esc(fmtDate(rev.savedAt.slice(0, 10), 'med'))}</h2><div class="prose">${treeRender(rev.text) || '<p class="faint">(empty)</p>'}</div>`); return; }
    if(b.dataset.act === 'rev-diff'){ openModal(`<h2 class="serif">Then and now</h2><p class="faint">Struck-through words were there then; underlined words are there now.</p>${icsDiffHTML(rev.text, n.body)}`); return; }
    confirmDlg('Restore this version as a new save? What the page says now is kept as a version first, and nothing is removed.', () => { const r = icsRestoreRevision(rev.id); if(r.error) toast(r.error); else { toast('Restored as a new save.'); rerender(); } });
  });
}

/* ============================================================
   A-02  The weekly summaries that were stored and never shown.
   ============================================================ */
function icsIsoWeekKey(d){
  d = d || new Date();
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const ys = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return t.getUTCFullYear() + '-W' + String(Math.ceil(((t - ys) / 864e5 + 1) / 7)).padStart(2, '0');
}
function icsStoredWeeks(){
  const raw = (S.treePrefs && Array.isArray(S.treePrefs.summaries)) ? S.treePrefs.summaries : [];
  const out = [];
  raw.forEach(w => {
    try {
      if(!w || typeof w !== 'object') return;
      let key = typeof w.weekKey === 'string' ? w.weekKey : null;
      if(!key && typeof w.week === 'string' && /^\d{4}-\d{2}-\d{2}/.test(w.week)) key = icsIsoWeekKey(new Date(w.week.slice(0, 10) + 'T12:00:00'));
      if(!key || !/^\d{4}-W\d{2}$/.test(key)) return;
      out.push(Object.assign({}, w, {weekKey: key}));
    } catch(e){ /* a malformed week is simply absent */ }
  });
  return out;
}
function icsRecentSummaries(n){ return icsStoredWeeks().sort((a, b) => a.weekKey < b.weekKey ? 1 : -1).slice(0, n || 8); }
function icsWithDeltas(weeks){
  return weeks.map((w, i) => {
    const prev = weeks[i + 1];
    const delta = k => prev && typeof w[k] === 'number' && typeof prev[k] === 'number' ? w[k] - prev[k] : null;
    return Object.assign({}, w, {deltas: {pagesTended: delta('pagesTended'), positionsSet: delta('positionsSet'), gapsOpen: delta('gapsOpen')}});
  });
}
function icsWeeksHistoryHTML(){
  const rows = icsWithDeltas(icsRecentSummaries(8));
  const cell = v => typeof v === 'number' ? v : '—', dl = v => v == null ? '—' : v > 0 ? '+' + v : v < 0 ? '−' + Math.abs(v) : '0';
  return `<details class="tr-weeks-history" id="trWeeksHist"><summary>Past weeks (${rows.length})</summary>
    ${rows.length ? `<table class="tr-wtable"><thead><tr><th>Week</th><th>Tended</th><th>Positions</th><th>Gaps open</th><th>Change in gaps</th><th>New pages</th></tr></thead><tbody>
      ${rows.map(w => `<tr><td>${esc(w.weekKey)}</td><td>${cell(w.pagesTended)}</td><td>${cell(w.positionsSet)}</td><td>${cell(w.gapsOpen)}</td><td>${dl(w.deltas.gapsOpen)}</td><td>${cell(w.newPages)}</td></tr>`).join('')}</tbody></table>`
      : '<p class="faint">No past weeks are recorded yet.</p>'}
    <p class="faint tr-note">Weeks before this was shown may be blank. They were recorded, not displayed. A dash is an honest blank, not a zero.</p></details>`;
}

/* ============================================================
   A-03  "Did you mean": near matches for a red link.
   ============================================================ */
function icsEditDistance(a, b, max){
  max = max == null ? 2 : max;
  a = String(a).toLowerCase(); b = String(b).toLowerCase();
  if(a === b) return 0;
  if(Math.abs(a.length - b.length) > max) return max + 1;
  let prev2 = [], prev = [], cur = [];
  for(let j = 0; j <= b.length; j++) prev[j] = j;
  for(let i = 1; i <= a.length; i++){
    cur = [i]; let rowMin = i;
    for(let j = 1; j <= b.length; j++){
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if(i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur[j] = v; if(v < rowMin) rowMin = v;
    }
    if(rowMin > max) return max + 1;
    prev2 = prev; prev = cur;
  }
  return prev[b.length];
}
function icsSimilarity(a, b){
  const grams = s => { const t = String(s).toLowerCase().replace(/\s+/g, ' ').trim(), g = new Set(); for(let i = 0; i < t.length - 1; i++) g.add(t.slice(i, i + 2)); return g; };
  const A = grams(a), B = grams(b); if(!A.size || !B.size) return 0;
  let hits = 0; A.forEach(g => { if(B.has(g)) hits++; });
  return 2 * hits / (A.size + B.size);
}
function icsSuggestForRedLink(target, cands, limit){
  const out = [];
  cands.forEach(c => {
    const d = icsEditDistance(target, c.title, 2), s = icsSimilarity(target, c.title);
    if(d <= 2 || s >= 0.8) out.push(Object.assign({}, c, {distance: d, similarity: s, rank: d * 100 - Math.round(s * 100)}));
  });
  out.sort((x, y) => x.rank - y.rank || x.title.localeCompare(y.title));
  return out.slice(0, limit || 3);
}
function icsCandidates(){
  const out = [];
  S.treeNodes.forEach(n => { if(n.status !== 'pruned') out.push({pageId: n.id, title: n.title, isAlias: false}); });
  S.treeAliases.forEach(a => { const n = treeNode(a.nodeId); if(n && n.status !== 'pruned') out.push({pageId: n.id, title: a.title || a.alias, isAlias: true}); });
  return out;
}
/* the suggestions for one red link, never more than one page per suggestion */
function icsNearMatches(target){
  const seen = new Set();
  return icsSuggestForRedLink(target, icsCandidates(), 6).filter(s => { if(seen.has(s.pageId)) return false; seen.add(s.pageId); return true; }).slice(0, 3);
}
/* accepting adds an alias to the matched page; the text that has the typo is never touched */
function icsAcceptSuggestion(pageId, alias){ return treeAddAlias(pageId, alias); }
function icsRedHintHTML(target){
  const s = icsNearMatches(target);
  return s.length ? `<button type="button" class="tr-redhint" data-trhint="${esc(target)}" aria-expanded="false" aria-label="Suggestions for ${esc(target)}">?</button>` : '';
}
function icsOpenHint(target, after){
  const s = icsNearMatches(target); if(!s.length) return;
  const m = openModal(`<h2 class="serif">No page called “${esc(target)}”</h2><p>Did you mean:</p>
    <ul class="tr-hintlist">${s.map(x => `<li><b>${esc(x.title)}</b> <button class="btn sm" data-act="alias" data-page="${x.pageId}">Add “${esc(target)}” as an alias of ${esc(treeNode(x.pageId).title)}</button></li>`).join('')}</ul>
    <p><button class="btn sm ghost" data-act="create">No — make a new page called ${esc(target)}</button> <button class="btn sm ghost" data-act="dismiss">Leave it red</button></p>`, 'narrow');
  m.querySelectorAll('[data-act="alias"]').forEach(b => b.onclick = () => { const e = icsAcceptSuggestion(b.dataset.page, target); m.remove(); if(e) toast(e); else toast('Added as an alias. The link now reaches that page.'); (after || rerender)(); });
  m.querySelector('[data-act="create"]').onclick = () => { m.remove(); treeNewPageDialog({title: target}); };
  m.querySelector('[data-act="dismiss"]').onclick = () => m.remove();
}

/* ============================================================
   A-01  Open in Studio: the branch's board, made only when asked.
   ============================================================ */
function icsCanOpenInStudio(n){ return !!n && n.kind === 'branch' && n.status !== 'pruned'; }
function icsOpenInStudio(pageId){
  const n = treeNode(pageId); if(!icsCanOpenInStudio(n)) return false;
  if(typeof lsEnsure === 'function') lsEnsure();
  const have = (S.lsBoards || []).find(b => b.branchId === pageId && b.isHome);
  if(have){ navigate('#/studio/' + have.id); return true; }
  confirmDlg(`There is no Studio board for “${esc(n.title)}” yet. Make one? It starts empty, and nothing on the Tree changes.`, () => { const b = lsBoardFor(pageId); navigate('#/studio/' + b.id); });
  return true;
}
function icsOpenBtnHTML(n){
  return icsCanOpenInStudio(n) ? `<button class="tbtn" id="trStudio" data-act="open-in-studio" data-page="${n.id}">Open in Studio</button>` : '';
}

/* ============================================================
   A-05  Gaps: a registry, so the next amendment adds a rule and not a branch.
   A rule says what it found and how to think about it; it never blocks a save.
   ============================================================ */
const ICS_GAP_RULES = [];
function icsRegisterGapRule(rule){ ICS_GAP_RULES.push(rule); }
const ICS_WORD_BUDGET = 150, ICS_QUESTION_STALE_DAYS = 14, ICS_MAX_UNCHUNKED = 4;
icsRegisterGapRule({type: 'no-why-important', label: 'No reason why it matters',
  hint: 'Ask: why is this important? The answer is what lets you chunk it.',
  test(n){ if(!('whyImportant' in n)) return false; if(n.status === 'pruned' || n.status === 'stub') return false; return !String(n.whyImportant || '').trim(); }});
icsRegisterGapRule({type: 'island', label: 'Island — nothing connects to it',
  hint: 'A page with no grafts and no links in or out is an isolated island. Ask how it relates to something you already hold.',
  test(n){ if(n.status === 'pruned' || n.status === 'stub') return false; return icsGraftsOf(n.id).length === 0 && icsLinksOut(n).length === 0 && treeBacklinks(n).length === 0; }});
icsRegisterGapRule({type: 'unchunked-children', label: 'Too many loose children',
  hint: 'More than four loose children. Group them two to four at a time, and say why each group belongs together.',
  test(n){
    if(n.kind === 'point') return false;
    const kids = treeChildren(n.id).filter(k => k.status !== 'pruned'); if(kids.length <= ICS_MAX_UNCHUNKED) return false;
    const chunked = new Set((S.treeChunks || []).flatMap(c => c.memberIds || []));
    return kids.filter(k => !chunked.has(k.id)).length > ICS_MAX_UNCHUNKED;
  }});
icsRegisterGapRule({type: 'no-backbone', label: 'Root with no backbone',
  hint: 'Nothing here is marked as the trunk. Which three or four pages carry the whole question?',
  test(n){ if(n.kind !== 'root' || n.status === 'pruned') return false; const d = icsDescendants(n.id); if(d.length < 5) return false; return !d.some(x => x.backbone === true); }});
icsRegisterGapRule({type: 'stale-question', label: 'Question left red',
  hint: 'A question has been red for over a fortnight. Answer it or let it go.',
  test(n){ return (S.treeQuestions || []).some(q => q.pageId === n.id && q.status === 'red' && icsDaysAgo(q.createdAt) > ICS_QUESTION_STALE_DAYS); }});
icsRegisterGapRule({type: 'mastery-stalled', label: 'Stuck at a low level',
  hint: 'A month at level 1 or 2 means isolated knowledge. Ask how it relates to two other things.',
  test(n){ const m = n.mastery; if(!m || !m.level || m.level > 2) return false; const last = (m.history || [])[(m.history || []).length - 1]; return !!last && icsDaysAgo(last.date) > 30; }});
icsRegisterGapRule({type: 'wordy', label: 'Too many words, too few links',
  hint: 'Long prose with no links is collecting, not processing. Cut it down and point it at other pages.',
  test(n){ if(n.processed == null) return false; return icsWords(n.processed) > ICS_WORD_BUDGET && icsLinksOut(n).length === 0; }});
icsRegisterGapRule({type: 'never-retrieved', label: 'Never retrieved',
  hint: 'You have written this but never once recalled it from memory.',
  test(n){ if(n.kind !== 'point' || n.status === 'pruned' || n.status === 'stub') return false; return !(S.treeRetrievals || []).some(r => r.pageId === n.id); }});
/* one pass over the pages; a rule that throws is skipped and the rest still run */
function icsCollectGaps(){
  const out = [];
  S.treeNodes.forEach(n => {
    ICS_GAP_RULES.forEach(rule => {
      let hit = false; try { hit = !!rule.test(n); } catch(e){ hit = false; }
      if(hit) out.push({pageId: n.id, title: n.title, type: rule.type, label: rule.label, hint: rule.hint});
    });
  });
  return out;
}
function icsGapCountsByType(g){ g = g || icsCollectGaps(); return g.reduce((a, x) => (a[x.type] = (a[x.type] || 0) + 1, a), {}); }
/* the encoding gaps grouped by type, for the Gaps page */
function icsGapGroups(){
  const all = icsCollectGaps(), by = {};
  all.forEach(g => (by[g.type] = by[g.type] || []).push(g));
  return ICS_GAP_RULES.filter(r => by[r.type]).map(r => ({type: r.type, label: r.label, hint: r.hint, items: by[r.type]}));
}
function icsHasGap(pageId, type){ return icsCollectGaps().some(g => g.pageId === pageId && g.type === type); }

/* ============================================================
   The page: the pieces that sit in it, drawn by the page route
   ============================================================ */
function icsPageAfterTextHTML(n){ return icsHistoryHTML(n); }
function icsBindPage(root, n){
  icsBindHistory(root, n);
  const b = root.querySelector('[data-act="open-in-studio"]'); if(b) b.onclick = () => icsOpenInStudio(n.id);
  if(typeof icsBindPageMore === 'function') icsBindPageMore(root, n);
}
