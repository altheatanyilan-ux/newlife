/* ============================================================
   19-ls-e-page.js — Learning Studio: route, sidebar entry, integrations
   Route: #/studio  (sub-route: #/studio/<boardId>)
   ============================================================ */

/* ---------- mode bar ---------- */
const LS_MODES = [
  {id:'harvest', label:'Harvest', key:'1', hint:'Add keywords and phrases from your source'},
  {id:'sort',    label:'Sort',    key:'2', hint:'Drag chips into named groups'},
  {id:'ask',     label:'Ask',     key:'3', hint:'Write questions on each chip'},
  {id:'shoot',   label:'Shoot',   key:'4', hint:'Answer questions from memory or source'},
  {id:'chunk',   label:'Chunk',   key:'5', hint:'Tag chips by importance (red/amber/green)'},
  {id:'relate',  label:'Relate',  key:'6', hint:'Draw arrows between connected ideas'},
  {id:'recall',  label:'Recall',  key:'7', hint:'Hide the board and rebuild from memory'},
  {id:'check',   label:'Check',   key:'8', hint:'Send to Study Deck, schedule tending'},
];

function lsModeBarHTML(boardId, currentMode){
  return `<div class="ls-modebar" data-modebar>
    ${LS_MODES.map(m => {
      const active = m.id === currentMode;
      return `<button class="ls-mode-btn${active ? ' active' : ''}" data-mode="${esc(m.id)}"
        title="${esc(m.hint)}">${m.key} ${esc(m.label)}</button>`;
    }).join('')}
  </div>`;
}

/* ---------- branch picker for new board ---------- */
function lsBranchPickerHTML(){
  lsEnsure();
  const branches = (S.treeNodes||[]).filter(n => n.kind === 'branch' && n.status !== 'pruned');
  if(!branches.length) return `<p class="muted">No branches in your Knowledge Tree yet. <a href="#/tree">Open Tree →</a></p>`;
  return `<div class="ls-branch-picker">
    <p class="muted" style="margin-bottom:10px">Choose a branch to open in the Studio:</p>
    ${branches.map(b => `<button class="btn ghost ls-pick-branch" data-bid="${esc(b.id)}">${esc(b.title)}</button>`).join('')}
    <hr class="faint" style="margin:12px 0">
    ${(() => { const d = (S.lsBoards||[]).filter(b => !b.branchId); return d.length ? `<p class="muted" style="margin-bottom:6px">Boards without a branch:</p>${d.map((b, i) => `<a class="btn ghost" href="#/studio/${esc(b.id)}">${esc(b.name || 'Untitled')} · ${esc(String(b.createdAt||'').slice(0,10))}${(S.lsChips||[]).filter(c => c.boardId === b.id).length ? ' · ' + (S.lsChips||[]).filter(c => c.boardId === b.id).length + ' chips' : ''}</a>`).join(' ')}<br>` : ''; })()}
    <button class="btn ghost ls-pick-branch" data-bid="__new__">+ Start without a branch</button>
  </div>`;
}

/* ---------- studio page header ---------- */
function lsHeaderHTML(board){
  const branchTitle = board
    ? (S.treeNodes||[]).find(n => n.id === board.branchId)?.title || 'Studio'
    : 'Studio';
  const scaffoldLabel = (typeof LS_SCAFFOLD_LABELS !== 'undefined')
    ? LS_SCAFFOLD_LABELS[board?.scaffoldLevel || 'assist']
    : (board?.scaffoldLevel || 'assist');
  return `<div class="ls-header">
    <span class="ls-header-title">${esc(branchTitle)}</span>
    <div class="ls-header-actions">
      ${board && board.branchId ? '<button class="btn sm ghost" data-ls-action="import-branch" title="Bring in this branch\'s points as chips, with your say-so">Bring in the branch\'s points</button>' : ''}
      <button class="btn sm ghost" data-ls-action="scaffold-level" title="Scaffold level: ${esc(scaffoldLabel)} — click to cycle">◈ ${esc(scaffoldLabel)}</button>
      <button class="btn sm ghost" data-ls-action="end-session" title="Reflect on this session (Kolb)">End session</button>
      <button class="btn sm ghost" data-ls-action="snapshot" title="Save layout snapshot">Snapshot</button>
      <button class="btn sm ghost" data-ls-action="fit"      title="Fit all cards (0)">Fit</button>
      <button class="btn sm ghost" data-ls-action="spaceout" title="Auto-arrange">Arrange</button>
    </div>
  </div>`;
}

/* ---------- main route ---------- */
routes.studio = function(root, params){
  lsEnsure();

  /* params[0] may be a boardId */
  const targetBoardId = params && params[0];
  let board = targetBoardId ? lsBoardById(targetBoardId) : null;

  /* if no board yet: show branch picker */
  if(!board && !targetBoardId){
    root.innerHTML = `<div class="page narrow">
      <h2 class="ls-page-title">Learning Studio</h2>
      ${lsBranchPickerHTML()}
    </div>`;
    root.querySelectorAll('.ls-pick-branch').forEach(btn => {
      btn.onclick = () => {
        const bid = btn.dataset.bid;
        if(bid === '__new__'){
          /* create a detached board (no branchId) */
          const b = { id: uid(), branchId: null, name: 'Untitled', isHome: false,
            mode: 'harvest', viewport:{x:0,y:0,zoom:1},
            scaffoldLevel: S.lsPrefs.scaffoldLevel || 'assist',
            layoutSnapshotId: null, archivedAt: null,
            createdAt: new Date().toISOString() };
          S.lsBoards.push(b); save();
          navigate('#/studio/' + b.id);
        } else {
          const b = lsBoardFor(bid);
          navigate('#/studio/' + b.id);
        }
      };
    });
    return;
  }

  /* if boardId given but not found: redirect to picker */
  if(!board){
    navigate('#/studio'); return;
  }

  /* --- render the studio page --- */
  root.innerHTML = `
    <div class="ls-page" data-ls-page>
      ${lsHeaderHTML(board)}
      ${lsModeBarHTML(board.id, board.mode)}
      <div data-signal-bar></div>
      <div class="ls-content-area">
        ${lsCanvasHTML(board.id)}
        <div class="ls-side-panel" data-mode-panel></div>
      </div>
    </div>`;

  const canvasRoot = root.querySelector('.ls-canvas-root');

  let panelApi = null;
  let relateBinding = null;

  const canvasApi = bindCanvas(canvasRoot, board.id, {
    onSelectionChange(ids){
      const panelEl = root.querySelector('[data-mode-panel]');
      if(panelEl) lsOnSelectionChange(panelEl, board.id, board.mode, ids, canvasApi, panelApi);
    }
  });

  function destroyRelate(){
    if(relateBinding){ relateBinding.destroy(); relateBinding = null; }
    canvasRoot.classList.remove('ls-relate-active');
  }

  function mountPanel(mode){
    panelApi?.destroy?.();
    destroyRelate();
    const panelEl = root.querySelector('[data-mode-panel]');
    if(!panelEl) return;
    panelApi = lsMountModePanel(panelEl, board.id, mode, canvasApi);
    if(mode === 'relate'){
      canvasRoot.classList.add('ls-relate-active');
      relateBinding = bindRelateMode(canvasRoot, board.id, panelEl, canvasApi, () => {
        canvasApi.repaint();
      });
    }
  }

  function switchMode(modeId){
    lsBoardSetMode(board.id, modeId);
    if(typeof lsBridgeMode === 'function') lsBridgeMode(board.id, modeId);
    board = lsBoardById(board.id);
    const bar = root.querySelector('[data-modebar]');
    if(bar){ bar.outerHTML = lsModeBarHTML(board.id, modeId); rebindModebar(); }
    mountPanel(modeId);
    if(typeof lsRefreshSignalBar === 'function') lsRefreshSignalBar(root, board.id, canvasApi);
  }

  function rebindModebar(){
    root.querySelector('[data-modebar]')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-mode]'); if(!btn) return;
      switchMode(btn.dataset.mode);
    });
  }
  rebindModebar();

  /* mount initial mode panel */
  mountPanel(board.mode);

  /* initial signal bar */
  if(typeof lsRefreshSignalBar === 'function') lsRefreshSignalBar(root, board.id, canvasApi);

  /* header actions */
  root.querySelector('[data-ls-action="scaffold-level"]').onclick = () => {
    const next = lsScaffoldLevelNext(board.scaffoldLevel || 'assist');
    board.scaffoldLevel = next;
    save();
    const hdr = root.querySelector('.ls-header');
    if(hdr){ hdr.outerHTML = lsHeaderHTML(board); rebindHeader(); }
    if(typeof lsRefreshSignalBar === 'function') lsRefreshSignalBar(root, board.id, canvasApi);
  };

  function rebindHeader(){
    root.querySelector('[data-ls-action="scaffold-level"]').onclick = () => {
      const next = lsScaffoldLevelNext(board.scaffoldLevel || 'assist');
      board.scaffoldLevel = next;
      save();
      const hdr = root.querySelector('.ls-header');
      if(hdr){ hdr.outerHTML = lsHeaderHTML(board); rebindHeader(); }
      if(typeof lsRefreshSignalBar === 'function') lsRefreshSignalBar(root, board.id, canvasApi);
    };
    root.querySelector('[data-ls-action="snapshot"]').onclick = () => {
      lsSnapshotCommit(board.id);
      toast('Layout snapshot saved.');
    };
    root.querySelector('[data-ls-action="fit"]').onclick = () => {
      const vp = lsFitToContent(canvasRoot, board.id);
      if(vp) canvasApi.repaint();
    };
    root.querySelector('[data-ls-action="spaceout"]').onclick = () => {
      lsSpaceOut(board.id);
      canvasApi.repaint();
    };
  }

  root.querySelector('[data-ls-action="snapshot"]').onclick = () => {
    lsSnapshotCommit(board.id);
    toast('Layout snapshot saved.');
  };
  root.querySelector('[data-ls-action="fit"]').onclick = () => {
    const vp = lsFitToContent(canvasRoot, board.id);
    if(vp) canvasApi.repaint();
  };
  root.querySelector('[data-ls-action="spaceout"]').onclick = () => {
    lsSpaceOut(board.id);
    canvasApi.repaint();
  };

  /* mode keyboard shortcuts 1-8 */
  const modeKeys = {};
  LS_MODES.forEach(m => { modeKeys[m.key] = m.id; });

  function onPageKey(e){
    if(isTyping()) return;
    const modeId = modeKeys[e.key];
    if(modeId) switchMode(modeId);
  }
  document.addEventListener('keydown', onPageKey);

  /* the clock: a room asking for it goes through timeAutoStart, which starts it only if nothing else is running */
  if(S.lsPrefs.timerAutoStart && typeof timeAutoStart === 'function'){
    const branchTitle = board.branchId
      ? (S.treeNodes||[]).find(n => n.id === board.branchId)?.title || 'Studio'
      : 'Studio';
    try { timeAutoStart({categoryId: 'study', feature: 'learningStudio', what: 'Studio: ' + branchTitle}); } catch(e){}
  }
  /* a session is recorded, and the board's bridge to the Tree is wired */
  const bridge = typeof lsBridgeOnEnter === 'function' ? lsBridgeOnEnter(root, board, canvasApi, () => switchMode(board.mode)) : null;

  /* cleanup on navigate away */
  root._lsCleanup = () => {
    document.removeEventListener('keydown', onPageKey);
    if(bridge && bridge.leave) bridge.leave();
    try { if(typeof timeAutoStop === 'function') timeAutoStop('learningStudio'); } catch(e){}
    destroyRelate();
    canvasApi.destroy();
  };
  /* the page-level hook is on the element the renderer looks for, as well as on the root */
  const pageEl = root.querySelector('[data-ls-page]'); if(pageEl) pageEl._lsCleanup = root._lsCleanup;
};

/* store old renderRoute so we can call cleanup before navigation */
(function(){
  const _origRender = renderRoute;
  if(_origRender && !_origRender._lsPatched){
    const patched = function(name, params, el){
      /* cleanup any prior studio page */
      const prev = document.querySelector('[data-ls-page]');
      if(prev && typeof prev._lsCleanup === 'function') prev._lsCleanup();
      return _origRender.call(this, name, params, el);
    };
    patched._lsPatched = true;
    /* only patch if renderRoute is writable */
    try { renderRoute = patched; } catch(e){}
  }
})();

/* ---------- sidebar nav entry ---------- */
(function(){
  /* inject "Learning Studio" into the nav after Knowledge Tree */
  const _origNavHTML = typeof navHTML === 'function' ? navHTML : null;
  /* We extend the sidebar by hooking into nav rendering rather than
     modifying 19-nav.js directly — keeps the patch reversible. */
  if(typeof registerNavItem === 'function'){
    registerNavItem({id:'studio', label:'Learning Studio', icon:'◈', order:910,
      href:'#/studio', match: h => h.startsWith('#/studio')});
  }
})();

/* ---------- "Open in Studio" button on Tree branch pages ---------- */
function lsOpenInStudioBtn(nodeId){
  const b = (S.lsBoards||[]).find(x => x.branchId === nodeId && x.isHome);
  const href = b ? '#/studio/' + b.id : null;
  return `<button class="btn sm ghost ls-open-studio" data-nodeid="${esc(nodeId)}"
    onclick="const b=lsBoardFor('${esc(nodeId)}');navigate('#/studio/'+b.id)">
    ◈ Studio</button>`;
}

/* ---------- Today strip integration (Today page calls lsTodayHTML) ---------- */
/* lsTodayHTML() is defined in 19-ls-a-model.js — nothing to add here */

/* ---------- Alt+K tray extension ---------- */
(function(){
  /* 19-tree-d-rooms.js binds Alt+K to treeQuickCapture().
     We extend it: when on a studio board, send to that board's tray instead. */
  const _origCapture = typeof treeQuickCapture === 'function' ? treeQuickCapture : null;
  if(!_origCapture) return;
  const handler = function(e){
    if(e.altKey && (e.key === 'k' || e.key === 'K')){
      const hash = location.hash;
      const m = hash.match(/^#\/studio\/([^/]+)/);
      if(m){
        e.preventDefault(); e.stopPropagation();
        const boardId = m[1];
        const text = prompt('Capture to Studio tray:'); if(!text) return;
        const chip = lsChipNew(boardId, text.trim()); if(!chip) return;
        chip.inTray = true; save();
        const tray = document.querySelector('[data-tray]'); if(tray) tray.innerHTML = lsTrayHTML(boardId);
        toast('Added to Studio tray.');
        return;
      }
    }
  };
  document.addEventListener('keydown', handler, true);
})();

/* ---------- registerPageEntry ---------- */
if(typeof registerPageEntry === 'function'){
  registerPageEntry({
    id: 'learningStudio',
    room: 'studio',
    label: 'New chip',
    action(){ navigate('#/studio'); }
  });
}
