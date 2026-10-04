/* ============================================================
   19-ls-a-model.js — Learning Studio: data layer
   iCanStudy-style spatial canvas for the Knowledge Tree.
   Pipeline: Harvest → Sort → Ask → Shoot → Chunk → Relate → Recall → Check
   Governing rule: remove mechanical friction; preserve cognitive effort.
   ============================================================ */

/* ---------- defaults & ensure ---------- */
function lsEnsure(){
  if(!Array.isArray(S.lsBoards))    S.lsBoards    = [];
  if(!Array.isArray(S.lsChips))     S.lsChips     = [];
  if(!Array.isArray(S.lsGrafts))    S.lsGrafts    = [];
  if(!Array.isArray(S.lsPlacements))S.lsPlacements= [];
  if(!Array.isArray(S.lsGroups))    S.lsGroups    = [];
  if(!Array.isArray(S.lsSnapshots)) S.lsSnapshots = [];
  if(!Array.isArray(S.lsQuestions)) S.lsQuestions = [];
  if(!Array.isArray(S.lsRecalls))   S.lsRecalls   = [];
  if(!Array.isArray(S.lsSessions))  S.lsSessions  = [];
  if(!S.lsPrefs || typeof S.lsPrefs !== 'object') S.lsPrefs = {};
  const p = S.lsPrefs;
  if(!p.scaffoldLevel)        p.scaffoldLevel     = 'assist';
  if(p.preflight === undefined) p.preflight       = false;
  if(!p.fuzzyStrictness)      p.fuzzyStrictness   = 0.75;
  if(!p.timerAutoStart)       p.timerAutoStart    = true;
}

function migrateLS(){
  lsEnsure();
}

/* ---------- boards ---------- */
function lsBoardFor(branchId){
  lsEnsure();
  let b = S.lsBoards.find(x => x.branchId === branchId && x.isHome);
  if(!b){
    b = { id: uid(), branchId, name: '', isHome: true,
          mode: 'harvest',
          viewport: {x: 0, y: 0, zoom: 1},
          scaffoldLevel: S.lsPrefs.scaffoldLevel || 'assist',
          layoutSnapshotId: null, archivedAt: null,
          createdAt: new Date().toISOString() };
    S.lsBoards.push(b);
    save();
  }
  return b;
}

function lsBoardById(id){ lsEnsure(); return S.lsBoards.find(b => b.id === id) || null; }

function lsBoardSetMode(boardId, mode){
  const b = lsBoardById(boardId); if(!b) return;
  b.mode = mode; save();
}

function lsBoardSetViewport(boardId, vp){
  const b = lsBoardById(boardId); if(!b) return;
  Object.assign(b.viewport, vp); save();
}

/* ---------- chips ---------- */
function lsChipNew(boardId, text, extra){
  lsEnsure();
  const board = lsBoardById(boardId); if(!board) return null;
  const chip = Object.assign({
    id: uid(), boardId, text: text || '',
    branchId: board.branchId,
    sourceRef: null,
    tls: null,
    reasons: [],
    inTray: false,
    promotedToNodeId: null,
    createdAt: new Date().toISOString()
  }, extra || {});
  S.lsChips.push(chip);
  save();
  return chip;
}

function lsChipById(id){ lsEnsure(); return S.lsChips.find(c => c.id === id) || null; }

function lsChipUpdate(id, fields){
  const c = lsChipById(id); if(!c) return;
  Object.assign(c, fields); save();
}

function lsChipDelete(id){
  lsEnsure();
  const restore = spliceOut(S.lsChips, c => c.id === id);
  spliceOut(S.lsPlacements, p => p.cardId === id && p.cardType === 'chip');
  spliceOut(S.lsQuestions, q => q.cardId === id && q.cardType === 'chip');
  save();
  return restore;
}

function lsChipPromote(chipId, nodeId){
  const c = lsChipById(chipId); if(!c) return;
  c.promotedToNodeId = nodeId;
  /* migrate any lsGrafts that reference this chip to treeGrafts */
  (S.lsGrafts || []).filter(g => g.fromId === chipId || g.toId === chipId).forEach(g => {
    const fromNode = g.fromId === chipId ? nodeId : (lsChipById(g.fromId)?.promotedToNodeId || null);
    const toNode   = g.toId   === chipId ? nodeId : (lsChipById(g.toId)?.promotedToNodeId   || null);
    if(fromNode && toNode && typeof treeAddGraft === 'function'){
      treeAddGraft(fromNode, toNode, g.type || 'extends', g.why || '');
      spliceOut(S.lsGrafts, x => x.id === g.id);
    }
  });
  save();
}

/* ---------- placements ---------- */
function lsPlaceCard(boardId, cardId, cardType, x, y, extra){
  lsEnsure();
  const existing = S.lsPlacements.find(p => p.boardId === boardId && p.cardId === cardId && p.cardType === cardType);
  if(existing){
    existing.x = x; existing.y = y;
    if(extra) Object.assign(existing, extra);
    existing.updatedAt = new Date().toISOString();
    save(); return existing;
  }
  const p = Object.assign({ id: uid(), boardId, cardId, cardType,
    x, y, w: null, h: null,
    stackId: null, groupId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString() }, extra || {});
  S.lsPlacements.push(p);
  save(); return p;
}

function lsMoveCard(placementId, x, y){
  lsEnsure();
  const p = S.lsPlacements.find(x => x.id === placementId); if(!p) return;
  p.x = x; p.y = y; p.updatedAt = new Date().toISOString(); save();
}

function lsMoveCards(ids, dx, dy){
  lsEnsure();
  const ts = new Date().toISOString();
  S.lsPlacements.filter(p => ids.includes(p.id)).forEach(p => {
    p.x += dx; p.y += dy; p.updatedAt = ts;
  });
  save();
}

function lsPlacementFor(boardId, cardId, cardType){
  lsEnsure();
  return S.lsPlacements.find(p => p.boardId === boardId && p.cardId === cardId && p.cardType === cardType) || null;
}

function lsBoardPlacements(boardId){
  lsEnsure();
  return S.lsPlacements.filter(p => p.boardId === boardId);
}

/* ---------- groups ---------- */
function lsGroupNew(boardId, label, extra){
  lsEnsure();
  const g = Object.assign({ id: uid(), boardId, label: label || '',
    memberIds: [], reason: '', color: null, parentGroupId: null,
    createdAt: new Date().toISOString() }, extra || {});
  S.lsGroups.push(g);
  save(); return g;
}

function lsGroupById(id){ lsEnsure(); return S.lsGroups.find(g => g.id === id) || null; }

function lsGroupAddMember(groupId, cardId){
  const g = lsGroupById(groupId); if(!g) return;
  if(!g.memberIds.includes(cardId)) g.memberIds.push(cardId);
  save();
}

function lsGroupRemoveMember(groupId, cardId){
  const g = lsGroupById(groupId); if(!g) return;
  g.memberIds = g.memberIds.filter(id => id !== cardId);
  save();
}

function lsGroupDelete(groupId){
  lsEnsure();
  const g = lsGroupById(groupId); if(!g) return;
  /* clear groupId from placements */
  S.lsPlacements.filter(p => p.groupId === groupId).forEach(p => p.groupId = null);
  const restore = spliceOut(S.lsGroups, x => x.id === groupId);
  save();
  return restore;
}

function lsBoardGroups(boardId){
  lsEnsure();
  return S.lsGroups.filter(g => g.boardId === boardId);
}

/* ---------- chip-level grafts (pre-promotion) ---------- */
function lsGraftNew(fromId, toId, type, why){
  lsEnsure();
  const g = { id: uid(), fromId, toId,
    type: type || 'extends', why: why || '',
    createdAt: new Date().toISOString() };
  S.lsGrafts.push(g);
  save(); return g;
}

function lsGraftDelete(id){
  lsEnsure();
  const restore = spliceOut(S.lsGrafts, g => g.id === id);
  save(); return restore;
}

/* ---------- questions ---------- */
function lsQuestionNew(cardId, cardType, kind, text){
  lsEnsure();
  const q = { id: uid(), cardId, cardType,
    kind: kind || 'what', text: text || '',
    tls: null, answer: '', answeredAt: null,
    linkedCardIds: [], lockedUntil: null,
    createdAt: new Date().toISOString() };
  S.lsQuestions.push(q);
  save(); return q;
}

function lsQuestionUpdate(id, fields){
  lsEnsure();
  const q = S.lsQuestions.find(x => x.id === id); if(!q) return;
  Object.assign(q, fields); save();
}

/* ---------- snapshots (add-only, frozen) ---------- */
function lsSnapshotCommit(boardId){
  lsEnsure();
  const placements = JSON.parse(JSON.stringify(S.lsPlacements.filter(p => p.boardId === boardId)));
  const groups     = JSON.parse(JSON.stringify(S.lsGroups.filter(g => g.boardId === boardId)));
  const snap = Object.freeze({ id: uid(), boardId, placements, groups,
    createdAt: new Date().toISOString() });
  S.lsSnapshots.push(snap);
  const b = lsBoardById(boardId); if(b){ b.layoutSnapshotId = snap.id; }
  saveNow(); return snap;
}

/* persist() guard: add-only — prevent deletion or mutation of frozen snapshot rows */
function lsSnapshotGuard(rows, lastWritten){
  if(!lastWritten.lsSnapshots) return;
  const prev = JSON.parse(lastWritten.lsSnapshots);
  const curr = rows.lsSnapshots;
  prev.forEach(old => {
    const live = curr.find(r => r.id === old.id);
    if(!live){ curr.push(old); return; }
    if(JSON.stringify(live) !== JSON.stringify(old)){
      const idx = curr.indexOf(live); if(idx !== -1) curr[idx] = old;
    }
  });
}

/* ---------- recalls (add-only, frozen) ---------- */
function lsRecallSave(data){
  lsEnsure();
  const r = Object.freeze(Object.assign({ id: uid(), createdAt: new Date().toISOString() }, data));
  S.lsRecalls.push(r);
  saveNow(); return r;
}

function lsRecallGuard(rows, lastWritten){
  if(!lastWritten.lsRecalls) return;
  const prev = JSON.parse(lastWritten.lsRecalls);
  const curr = rows.lsRecalls;
  prev.forEach(old => {
    const live = curr.find(r => r.id === old.id);
    if(!live){ curr.push(old); return; }
    if(JSON.stringify(live) !== JSON.stringify(old)){
      const idx = curr.indexOf(live); if(idx !== -1) curr[idx] = old;
    }
  });
}

/* ---------- sessions ---------- */
function lsSessionStart(branchId, boardId, preflight){
  lsEnsure();
  const sess = { id: uid(), branchId, boardId,
    startedAt: new Date().toISOString(), endedAt: null,
    modeTimeline: [], clockEntryId: null,
    outcomes: { chips:0, groups:0, questions:0, grafts:0, recallResults:0, deckCards:0, tasks:0 },
    preflight: preflight || null, kolbNote: '',
    createdAt: new Date().toISOString() };
  S.lsSessions.push(sess);
  save(); return sess;
}

function lsSessionEnd(id, outcomes){
  lsEnsure();
  const s = S.lsSessions.find(x => x.id === id); if(!s) return;
  s.endedAt = new Date().toISOString();
  if(outcomes) Object.assign(s.outcomes, outcomes);
  save();
}

/* ---------- Today strip ---------- */
function lsTodayHTML(){
  lsEnsure();
  /* due recalls: boards that have a snapshot but no recall in the last 3 days */
  const cutoff = new Date(Date.now() - 3 * 86400000).toISOString();
  const boardsWithSnap = [...new Set(S.lsSnapshots.map(s => s.boardId))];
  const recentRecallBoards = new Set(S.lsRecalls.filter(r => r.createdAt > cutoff).map(r => r.boardId));
  const due = boardsWithSnap.filter(id => !recentRecallBoards.has(id));

  /* pending captures: chips in any tray */
  const trayCount = S.lsChips.filter(c => c.inTray).length;

  if(!due.length && !trayCount) return '';

  const parts = [];
  if(due.length){
    const b = lsBoardById(due[0]);
    const branchTitle = b ? (S.treeNodes || []).find(n => n.id === b.branchId)?.title || 'a board' : 'a board';
    parts.push(`<a class="ls-today-link" href="#/studio/${due[0]}">Recall due: ${esc(branchTitle)}</a>`);
  }
  if(trayCount){
    parts.push(`<span class="ls-today-chip">${trayCount} chip${trayCount > 1 ? 's' : ''} in tray</span>`);
  }

  return `<div class="ls-today-strip" data-duty-id="ls_recall">${parts.join(' · ')}</div>`;
}
