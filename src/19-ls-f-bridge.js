/* ============================================================
   19-ls-f-bridge.js — Learning Studio: the bridge to the Knowledge Tree (N-05)

   The two rooms already shared two vocabularies: the five graft kinds, each
   with a required reason, and Core / Supporting / Peripheral. So the bridge
   mostly carries records across. What it does not do is carry them by itself:

     - a board brings in its branch's points only when you tick them;
     - a chip becomes a page only when you confirm its title, kind and home;
     - an arrow becomes a graft only when both its ends are pages and it has a
       reason;
     - a group becomes a chunk only with the reason you wrote.

   Each crossing leaves a back-reference, so a second click finds the first
   result instead of making another (the Tree has no delete). Also here: groups
   can be made in Sort mode (N-05a), the Ask panel's links counter counts what a
   question reaches (N-05b), sessions are recorded (N-05c), and the Studio's
   records go out with the Tree's export (N-05e).
   ============================================================ */

const LS_IMPORTANCE_TO_TLS = {core: 'green', supporting: 'amber', peripheral: 'red'};
const LS_TLS_TO_IMPORTANCE = {green: 'core', amber: 'supporting', red: 'peripheral'};
const LS_MAX_CHIP_WORDS = 12;

/* the Tree page a card on the board stands for, if any */
function lsCardPageId(cardId){
  const c = lsChipById(cardId);
  if(c) return c.sourcePageId || c.promotedToNodeId || null;
  return treeNode(cardId) ? cardId : null;
}

/* ============ 1. Tree → Studio: bring in the branch's points ============ */
function lsBridgePreviewImport(boardId, branchId){
  lsEnsure();
  const have = new Set((S.lsChips || []).filter(c => c.boardId === boardId).map(c => c.sourcePageId).filter(Boolean));
  return treeChildren(branchId).filter(p => p.status !== 'pruned' && !have.has(p.id))
    .map(p => ({pageId: p.id, text: p.title, importance: p.importance || null, long: icsWords(p.title) > LS_MAX_CHIP_WORDS}));
}
function lsBridgeImport(boardId, branchId, pageIds){
  lsEnsure();
  const picked = new Set(pageIds || []), made = [];
  const placed = lsBoardPlacements(boardId).length;
  lsBridgePreviewImport(boardId, branchId).forEach(cand => {
    if(!picked.has(cand.pageId)) return;
    const i = placed + made.length;
    const chip = lsChipNew(boardId, cand.text, {sourcePageId: cand.pageId, tls: LS_IMPORTANCE_TO_TLS[cand.importance] || null});
    if(!chip) return;
    lsPlaceCard(boardId, chip.id, 'chip', 80 + (i % 5) * 210, 80 + Math.floor(i / 5) * 90);
    made.push(chip);
  });
  save(); return made;
}
function lsBridgeImportDialog(board, after){
  const list = lsBridgePreviewImport(board.id, board.branchId), branch = treeNode(board.branchId);
  const m = openModal(`<h2 class="serif">Bring in ${list.length} point${list.length === 1 ? '' : 's'} from “${esc(branch ? branch.title : '')}”?</h2>
    <p class="faint">Chips are copies to work with. Editing a chip does not change the Tree page.</p>
    ${list.length ? `<ul class="ls-import-list">${list.map(c => `<li><label><input type="checkbox" value="${c.pageId}" checked> ${esc(c.text)}${c.long ? ' <span class="ls-warn faint">long for a chip</span>' : ''}</label></li>`).join('')}</ul>` : '<p class="faint">Every live point of this branch is already on the board.</p>'}
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:10px"><button class="btn ghost" data-act="cancel">Cancel</button>${list.length ? '<button class="btn primary" data-act="import-confirm">Bring in the ticked</button>' : ''}</div>`, 'narrow');
  m.querySelector('[data-act="cancel"]').onclick = () => m.remove();
  const ok = m.querySelector('[data-act="import-confirm"]');
  if(ok) ok.onclick = () => { const ids = [...m.querySelectorAll('input:checked')].map(i => i.value); const made = lsBridgeImport(board.id, board.branchId, ids); m.remove(); toast(`${made.length} chip${made.length === 1 ? '' : 's'} brought in.`); after && after(); };
}

/* ============ 2. Studio → Tree: a chip becomes a page ============ */
function lsBridgeProposePromotion(boardId, chipId){
  const chip = lsChipById(chipId); if(!chip) throw new Error('no such chip');
  if(chip.sourcePageId) return {already: true, pageId: chip.sourcePageId, message: 'This chip came from the Tree.'};
  if(chip.promotedToNodeId) return {already: true, pageId: chip.promotedToNodeId, message: 'Already promoted.'};
  const board = lsBoardById(boardId), near = typeof icsNearMatches === 'function' ? icsNearMatches(chip.text) : [], exact = treeResolve(chip.text);
  return {already: false, proposed: {title: chip.text, kind: 'point', home: board && board.branchId || null, importance: LS_TLS_TO_IMPORTANCE[chip.tls] || null},
    nearMatch: exact ? [{pageId: exact.id, title: exact.title}] : near, warnings: icsWords(chip.text) > LS_MAX_CHIP_WORDS ? ['That is long for a single claim. Split it, or shorten the title.'] : []};
}
function lsBridgeConfirmPromotion(boardId, chipId, o){
  const chip = lsChipById(chipId); if(!chip) throw new Error('no such chip');
  const had = chip.sourcePageId || chip.promotedToNodeId; if(had) return treeNode(had);
  const r = treeSavePage({title: o.title, kind: o.kind || 'point', parentId: o.homeId || null, status: 'stub', importance: o.importance || null});
  if(r.error) throw new Error(r.error);
  lsChipPromote(chip.id, r.node.id);
  return r.node;
}
function lsBridgePromoteDialog(boardId, chipId, after){
  const prop = lsBridgeProposePromotion(boardId, chipId);
  if(prop.already){ toast(prop.message); const n = treeNode(prop.pageId); if(n) navigate(treeUrl(n)); return; }
  const m = openModal(`<h2 class="serif">Make this a page?</h2><p class="faint">It will be a Stub, so priming through the Studio does not inflate the active pages.</p>
    <label class="tr-f"><span>Title</span><input class="inp" id="lpT" value="${esc(prop.proposed.title)}"></label>
    <div class="tr-frow"><label class="tr-f"><span>Kind</span><select class="sel" id="lpK"><option value="point" selected>Point</option><option value="branch">Branch</option></select></label>
      <label class="tr-f grow"><span>Home in the tree</span><select class="sel" id="lpH"></select></label></div>
    ${prop.nearMatch.length ? `<p class="ls-nearmatch">Already in the tree? ${prop.nearMatch.map(x => `<a href="${treeUrl(treeNode(x.pageId))}">${esc(x.title)}</a>`).join(', ')}</p>` : ''}
    ${prop.warnings.map(w => `<p class="faint">${esc(w)}</p>`).join('')}<p class="tr-err" id="lpE"></p>
    <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" id="lpNo">Cancel</button><button class="btn primary" id="lpOk" data-act="promote-confirm">Make the page</button></div>`, 'narrow');
  const fill = () => { const k = m.querySelector('#lpK').value; m.querySelector('#lpH').innerHTML = '<option value="">choose…</option>' + treeParentOptions(null, k).map(([id, l]) => `<option value="${id}"${id === prop.proposed.home ? ' selected' : ''}>${esc(l)}</option>`).join(''); };
  fill(); m.querySelector('#lpK').onchange = fill;
  m.querySelector('#lpNo').onclick = () => m.remove();
  m.querySelector('#lpOk').onclick = () => { try { const n = lsBridgeConfirmPromotion(boardId, chipId, {title: m.querySelector('#lpT').value, kind: m.querySelector('#lpK').value, homeId: m.querySelector('#lpH').value || null, importance: prop.proposed.importance}); m.remove(); toast(`“${n.title}” is a page now.`); after && after(n); } catch(e){ m.querySelector('#lpE').textContent = e.message; } };
}

/* ============ 3. Studio → Tree: an arrow becomes a graft ============ */
function lsBridgeProposeGraft(boardId, connId){
  const c = (S.lsGrafts || []).find(x => x.id === connId); if(!c) throw new Error('no such connection');
  if(c.promotedGraftId) return {already: true, graftId: c.promotedGraftId};
  const from = lsCardPageId(c.fromId), to = lsCardPageId(c.toId);
  if(!from || !to) return {already: false, blocked: true, message: 'Both ends need to be pages in the Tree first. Promote the chips, then the arrow.'};
  if(!String(c.why || '').trim()) return {already: false, blocked: true, message: 'A graft needs a reason. Write one on the arrow first.'};
  return {already: false, blocked: false, proposed: {fromId: from, toId: to, type: c.type, why: c.why}};
}
function lsBridgeConfirmGraft(boardId, connId){
  const p = lsBridgeProposeGraft(boardId, connId); if(p.already || p.blocked) return p;
  const r = treeAddGraft(p.proposed.fromId, p.proposed.toId, p.proposed.type, p.proposed.why);
  if(r.error){ /* the Tree already holds this graft: the arrow simply points at it */
    const have = S.treeGrafts.find(g => g.fromId === p.proposed.fromId && g.toId === p.proposed.toId && g.type === p.proposed.type);
    if(!have) return {already: false, blocked: true, message: r.error};
    (S.lsGrafts.find(x => x.id === connId)).promotedGraftId = have.id; save(); return {already: true, graftId: have.id};
  }
  (S.lsGrafts.find(x => x.id === connId)).promotedGraftId = r.graft.id; save();
  return {already: false, blocked: false, graft: r.graft};
}

/* ============ 4. Studio → Tree: a group becomes a chunk ============ */
function lsBridgeConfirmChunk(boardId, groupId){
  const g = lsGroupById(groupId); if(!g) throw new Error('no such group');
  if(g.promotedChunkId) return {already: true, chunkId: g.promotedChunkId};
  const memberIds = [...new Set((g.memberIds || []).map(lsCardPageId).filter(Boolean))];
  if(memberIds.length < 2) return {blocked: true, message: 'At least two of these chips need to be Tree pages first.'};
  const chunk = icsCreateChunk({title: g.label, reason: g.reason, memberIds});   /* the same gate: a reason, one root */
  g.promotedChunkId = chunk.id; save();
  return {chunk};
}

/* ============ the Check panel's "to the Tree" section ============ */
function lsBridgeSectionHTML(boardId){
  lsEnsure();
  const chips = (S.lsChips || []).filter(c => c.boardId === boardId && !c.inTray && !c.sourcePageId);
  const conns = (S.lsGrafts || []).filter(g => (lsChipById(g.fromId) && lsChipById(g.fromId).boardId === boardId) || (lsChipById(g.toId) && lsChipById(g.toId).boardId === boardId));
  const groups = lsBoardGroups(boardId);
  if(!chips.length && !conns.length && !groups.length) return '';
  const nm = id => { const c = lsChipById(id); return esc(c ? c.text.slice(0, 28) : (treeNode(id) ? treeNode(id).title.slice(0, 28) : '?')); };
  return `<div class="ls-bridge"><hr class="faint"><div class="ls-panel-card-label">To the Tree</div><p class="muted" style="font-size:.76rem">Nothing crosses by itself. Each of these asks first.</p>
    ${chips.length ? `<div class="ls-bridge-chips">${chips.map(c => `<div class="row ls-bridge-row" style="gap:6px"><span style="flex:1;font-size:.8rem">${esc(c.text.slice(0, 40))}</span>${c.promotedToNodeId ? `<a class="faint" href="${treeNode(c.promotedToNodeId) ? treeUrl(treeNode(c.promotedToNodeId)) : '#'}">in the Tree</a>` : `<button class="btn ghost sm" data-act="promote-chip" data-chip="${c.id}">Send to the Tree…</button>`}</div>`).join('')}</div>` : ''}
    ${conns.length ? `<div class="ls-bridge-conns">${conns.map(g => `<div class="row ls-bridge-row" style="gap:6px"><span style="flex:1;font-size:.78rem">${nm(g.fromId)} <i>${esc(g.type)}</i> ${nm(g.toId)}</span>${g.promotedGraftId ? '<span class="faint">a graft</span>' : `<button class="btn ghost sm" data-act="promote-graft" data-conn="${g.id}">Make this a graft</button>`}</div>`).join('')}</div>` : ''}
    ${groups.length ? `<div class="ls-bridge-groups">${groups.map(g => `<div class="row ls-bridge-row" style="gap:6px"><span style="flex:1;font-size:.8rem">${esc(g.label || 'Group')}</span>${g.promotedChunkId ? '<span class="faint">a chunk</span>' : `<button class="btn ghost sm" data-act="promote-chunk" data-group="${g.id}">Make this a chunk</button>`}</div>`).join('')}</div>` : ''}</div>`;
}
function lsBridgeBind(panelEl, boardId, refresh){
  panelEl.querySelectorAll('[data-act="promote-chip"]').forEach(b => b.onclick = () => lsBridgePromoteDialog(boardId, b.dataset.chip, () => refresh && refresh()));
  panelEl.querySelectorAll('[data-act="promote-graft"]').forEach(b => b.onclick = () => {
    const r = lsBridgeConfirmGraft(boardId, b.dataset.conn);
    if(r.blocked) toast(r.message, 5000); else toast(r.already ? 'Already a graft.' : 'A graft in the Tree, with its reason.');
    refresh && refresh(); });
  panelEl.querySelectorAll('[data-act="promote-chunk"]').forEach(b => b.onclick = () => {
    try { const r = lsBridgeConfirmChunk(boardId, b.dataset.group); if(r.blocked) toast(r.message, 5000); else toast(r.already ? 'Already a chunk.' : 'A chunk in the Tree, with its reason.'); } catch(e){ toast(e.message, 6000); }
    refresh && refresh(); });
}

/* ============ N-05a  Sort mode: groups with a label and a reason ============ */
function lsSortPanelHTML(boardId, selectedCardIds){
  lsEnsure();
  const groups = lsBoardGroups(boardId), chips = (S.lsChips || []).filter(c => c.boardId === boardId && !c.inTray);
  const grouped = new Set(groups.flatMap(g => g.memberIds || []));
  const sel = selectedCardIds || [];
  return `<div class="ls-sort-panel"><div class="ls-panel-card-label">Sort into groups</div>
    <p class="muted" style="font-size:.78rem">Select chips on the board, give the group a name and the reason they belong together. Two to four is a good size.</p>
    <div class="ls-sort-new"><div class="muted" style="font-size:.78rem">${sel.length} selected</div>
      <input class="inp" data-sort-label placeholder="A few simple words" style="width:100%;margin:4px 0">
      <textarea class="ta" data-sort-reason rows="2" placeholder="Why do these belong together? (required)" style="width:100%"></textarea>
      <button class="btn primary sm" data-sort-make style="margin-top:6px">Make the group</button><p class="tr-err" data-sort-err></p></div>
    <div class="ls-sort-groups">${groups.map(g => { const n = (g.memberIds || []).length; return `<div class="ls-sort-group" data-gid="${g.id}"><div class="row" style="gap:6px"><b style="flex:1">${esc(g.label || 'Group')}</b><span class="faint">${n}</span></div>
      <textarea class="ta" data-sort-greason="${g.id}" rows="2" placeholder="reason…" style="width:100%;font-size:.78rem">${esc(g.reason || '')}</textarea>
      ${n > LS_SIGNAL_OVERLOAD_GROUP ? `<p class="muted" style="font-size:.74rem">${n} members. Two to four holds best; try splitting it.</p>` : ''}
      <div class="row" style="gap:6px"><button class="btn ghost sm" data-sort-add="${g.id}">Add selected</button><button class="btn ghost sm" data-sort-drop="${g.id}">Take selected out</button></div></div>`; }).join('') || '<p class="muted">No groups yet.</p>'}</div>
    <p class="muted" style="font-size:.76rem">${chips.filter(c => !grouped.has(c.id)).length} chip(s) not in a group.</p></div>`;
}
function bindSortPanel(panelEl, boardId, canvasApi){
  const selCards = () => (canvasApi && canvasApi.getSelected ? canvasApi.getSelected() : []).map(pid => S.lsPlacements.find(p => p.id === pid)).filter(Boolean).map(p => p.cardId);
  const setGroupIds = (gid, ids) => { ids.forEach(cid => { const p = lsPlacementFor(boardId, cid, lsChipById(cid) ? 'chip' : 'node'); if(p) p.groupId = gid; }); };
  function paint(){
    const keepLabel = panelEl.querySelector('[data-sort-label]'), keepReason = panelEl.querySelector('[data-sort-reason]');
    const l = keepLabel ? keepLabel.value : '', r = keepReason ? keepReason.value : '';
    panelEl.innerHTML = lsSortPanelHTML(boardId, selCards());
    panelEl.querySelector('[data-sort-label]').value = l; panelEl.querySelector('[data-sort-reason]').value = r;
    bind();
  }
  function bind(){
    panelEl.querySelector('[data-sort-make]').onclick = () => {
      const label = panelEl.querySelector('[data-sort-label]').value.trim(), reason = panelEl.querySelector('[data-sort-reason]').value.trim(), ids = selCards();
      const err = !label ? 'Give the group a name.' : !reason ? 'A group needs its reason: why do these belong together?' : !ids.length ? 'Select the chips to put in it.' : '';
      if(err){ panelEl.querySelector('[data-sort-err]').textContent = err; return; }
      const g = lsGroupNew(boardId, label, {memberIds: ids.slice(), reason}); setGroupIds(g.id, ids); save();
      panelEl.querySelector('[data-sort-label]').value = ''; panelEl.querySelector('[data-sort-reason]').value = '';
      canvasApi && canvasApi.repaint(); paint();
    };
    panelEl.querySelectorAll('[data-sort-greason]').forEach(t => t.onchange = () => { const g = lsGroupById(t.dataset.sortGreason); if(g){ g.reason = t.value.trim(); save(); } });
    panelEl.querySelectorAll('[data-sort-add]').forEach(b => b.onclick = () => { const g = lsGroupById(b.dataset.sortAdd), ids = selCards(); ids.forEach(id => lsGroupAddMember(g.id, id)); setGroupIds(g.id, ids); save(); canvasApi && canvasApi.repaint(); paint(); });
    panelEl.querySelectorAll('[data-sort-drop]').forEach(b => b.onclick = () => { const g = lsGroupById(b.dataset.sortDrop), ids = selCards(); ids.forEach(id => lsGroupRemoveMember(g.id, id)); setGroupIds(null, ids); save(); canvasApi && canvasApi.repaint(); paint(); });
  }
  paint();
  return {refresh: paint, destroy(){}};
}

/* ============ N-05b  what a question reaches ============ */
function lsQuestionReach(q){
  const ids = new Set();
  treeParseLinks((q.text || '') + '\n' + (q.answer || '')).filter(l => l.room === 'tree').forEach(l => { const p = treeResolve(l.target); if(p && p.id !== q.cardId) ids.add(p.id); });
  return [...ids];
}

/* ============ N-05c  sessions are recorded ============ */
function lsBridgeSession(boardId){
  lsEnsure(); const t = Date.now();
  return (S.lsSessions || []).filter(s => s.boardId === boardId && !s.endedAt && t - Date.parse(s.startedAt) < 3 * 36e5).slice(-1)[0] || null;
}
function lsBridgeMode(boardId, mode){
  const s = lsBridgeSession(boardId); if(!s) return;
  if(!s.modeTimeline.length || s.modeTimeline[s.modeTimeline.length - 1].mode !== mode){ s.modeTimeline.push({mode, at: new Date().toISOString()}); save(); }
}
function lsBridgeOutcomes(boardId, since){
  const after = d => d && d >= since;
  return {chips: (S.lsChips || []).filter(c => c.boardId === boardId && after(c.createdAt)).length, groups: lsBoardGroups(boardId).filter(g => after(g.createdAt)).length,
    questions: (S.lsQuestions || []).filter(q => (lsChipById(q.cardId) || {}).boardId === boardId && after(q.createdAt)).length,
    grafts: (S.lsGrafts || []).filter(g => after(g.createdAt) && ((lsChipById(g.fromId) || {}).boardId === boardId)).length,
    recallResults: (S.lsRecalls || []).filter(r => r.boardId === boardId && after(r.createdAt)).length, deckCards: 0, tasks: 0};
}
function lsBridgeEndSession(boardId){
  const s = lsBridgeSession(boardId); if(!s) return null;
  /* a visit with nothing in it leaves nothing behind */
  const out = lsBridgeOutcomes(boardId, s.startedAt), made = Object.values(out).some(v => v > 0), mins = (Date.now() - Date.parse(s.startedAt)) / 6e4;
  if(!made && mins < 2){ S.lsSessions = S.lsSessions.filter(x => x.id !== s.id); save(); return null; }
  lsSessionEnd(s.id, out); return s;
}
function lsBridgeOnEnter(root, board, canvasApi, remount){
  const b = lsBoardById(board.id);
  if(!lsBridgeSession(board.id)){ const s = lsSessionStart(b.branchId, b.id, null); s.modeTimeline.push({mode: b.mode, at: s.startedAt}); save(); }
  const onClick = e => {
    const imp = e.target.closest('[data-ls-action="import-branch"]');
    if(imp){ lsBridgeImportDialog(lsBoardById(board.id), () => { canvasApi.repaint(); }); return; }
    const end = e.target.closest('[data-ls-action="end-session"]');
    if(end && typeof lsBridgeEndDialog === 'function') lsBridgeEndDialog(board.id);
  };
  root.addEventListener('click', onClick);
  return {leave(){ root.removeEventListener('click', onClick); lsBridgeEndSession(board.id); }};
}

/* ============ N-05e  Studio records go out with the Tree's export ============ */
const LS_EXPORT_STORES = ['lsBoards', 'lsChips', 'lsGrafts', 'lsPlacements', 'lsGroups', 'lsSnapshots', 'lsQuestions', 'lsRecalls', 'lsSessions'];
function lsBridgeExport(){ lsEnsure(); const o = {}; LS_EXPORT_STORES.forEach(k => o[k] = S[k]); return o; }
/* add-only: a record already here is left as it is */
function lsBridgeImportStudio(obj){
  const added = {}; if(!obj || typeof obj !== 'object') return added; lsEnsure();
  LS_EXPORT_STORES.forEach(k => {
    const have = new Set(S[k].map(r => r.id)); added[k] = 0;
    (Array.isArray(obj[k]) ? obj[k] : []).forEach(r => { if(!r || !r.id || have.has(r.id)) return; S[k].push(k === 'lsSnapshots' || k === 'lsRecalls' ? Object.freeze(Object.assign({}, r)) : r); added[k]++; });
  });
  return added;
}
