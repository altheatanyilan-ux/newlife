/* ============================================================
   19-ls-b-canvas.js — Learning Studio: canvas engine
   Pure mechanics: pan, zoom, drag, lasso, groups, tray, undo/redo.
   No mode-specific logic here.
   ============================================================ */

/* ---------- coordinate helpers ---------- */
function lsCanvasToWorld(vp, cx, cy){
  return { x: (cx - vp.x) / vp.zoom, y: (cy - vp.y) / vp.zoom };
}
function lsWorldToCanvas(vp, wx, wy){
  return { x: wx * vp.zoom + vp.x, y: wy * vp.zoom + vp.y };
}

/* ---------- per-board undo stack (in-memory; cleared on navigate) ---------- */
const _lsUndoStacks = {};   /* boardId → [{undo, redo}] */
const _lsUndoPointers = {}; /* boardId → index */

function lsUndoPush(boardId, undo, redo){
  if(!_lsUndoStacks[boardId])   _lsUndoStacks[boardId]   = [];
  if(!(_lsUndoPointers[boardId] >= 0)) _lsUndoPointers[boardId] = -1;
  /* trim any forward history */
  _lsUndoStacks[boardId].splice(_lsUndoPointers[boardId] + 1);
  _lsUndoStacks[boardId].push({undo, redo});
  _lsUndoPointers[boardId] = _lsUndoStacks[boardId].length - 1;
}

function lsUndoApply(boardId){
  const stack = _lsUndoStacks[boardId]; if(!stack) return false;
  const ptr = _lsUndoPointers[boardId];
  if(ptr < 0) return false;
  stack[ptr].undo();
  _lsUndoPointers[boardId]--;
  return true;
}

function lsRedoApply(boardId){
  const stack = _lsUndoStacks[boardId]; if(!stack) return false;
  const ptr = _lsUndoPointers[boardId];
  if(ptr >= stack.length - 1) return false;
  _lsUndoPointers[boardId]++;
  stack[_lsUndoPointers[boardId]].redo();
  return true;
}

function lsUndoClear(boardId){
  delete _lsUndoStacks[boardId];
  delete _lsUndoPointers[boardId];
}

/* ---------- card dimensions ---------- */
const LS_CARD_W = 160;
const LS_CARD_H = 80;

/* ---------- HTML builder: the canvas container ---------- */
function lsCanvasHTML(boardId){
  return `
<div class="ls-canvas-root" data-board="${esc(boardId)}">
  <div class="ls-canvas-inner" data-canvas-inner>
    <svg class="ls-arrows-svg" data-arrows></svg>
  </div>
  <div class="ls-tray-dock" data-tray></div>
</div>`;
}

/* ---------- chip card HTML ---------- */
function lsChipCardHTML(chip, placement, opts){
  opts = opts || {};
  const sel = opts.selected ? ' ls-card--sel' : '';
  const tls = chip.tls ? ` ls-tls--${chip.tls}` : '';
  const ghosted = opts.ghosted ? ' ls-card--ghost' : '';
  return `<div class="ls-card ls-chip${sel}${tls}${ghosted}"
    data-cid="${esc(chip.id)}" data-ctype="chip" data-pid="${esc(placement.id)}"
    style="left:${placement.x}px;top:${placement.y}px;width:${placement.w||LS_CARD_W}px;">
    <div class="ls-card-text" data-chip-text>${esc(chip.text)}</div>
  </div>`;
}

/* ---------- node card HTML (promoted chip or tree node on canvas) ---------- */
function lsNodeCardHTML(node, placement, opts){
  opts = opts || {};
  const sel = opts.selected ? ' ls-card--sel' : '';
  const ghosted = opts.ghosted ? ' ls-card--ghost' : '';
  return `<div class="ls-card ls-node${sel}${ghosted}"
    data-cid="${esc(node.id)}" data-ctype="node" data-pid="${esc(placement.id)}"
    style="left:${placement.x}px;top:${placement.y}px;width:${placement.w||LS_CARD_W}px;">
    <div class="ls-card-text">${esc(node.title || node.text || '')}</div>
  </div>`;
}

/* ---------- group frame HTML ---------- */
function lsGroupFrameHTML(group, placements){
  /* bounding box of member placements */
  const members = placements.filter(p => group.memberIds.includes(p.cardId));
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  if(!members.length) return '';
  members.forEach(p => {
    x1 = Math.min(x1, p.x - 12);
    y1 = Math.min(y1, p.y - 28);
    x2 = Math.max(x2, p.x + (p.w || LS_CARD_W) + 12);
    y2 = Math.max(y2, p.y + (p.h || LS_CARD_H) + 12);
  });
  const col = group.color ? `border-color:${group.color};` : '';
  return `<div class="ls-group-frame" data-gid="${esc(group.id)}"
    style="left:${x1}px;top:${y1}px;width:${x2-x1}px;height:${y2-y1}px;${col}">
    <span class="ls-group-label" data-group-label>${esc(group.label)}</span>
  </div>`;
}

/* ---------- render all cards on a board ---------- */
function lsRenderCards(root, boardId, viewport, selectedIds){
  const inner = root.querySelector('[data-canvas-inner]'); if(!inner) return;
  selectedIds = selectedIds || new Set();
  const placements = lsBoardPlacements(boardId);
  const groups     = lsBoardGroups(boardId);

  /* virtual render: skip cards far outside viewport */
  const vw = root.offsetWidth, vh = root.offsetHeight;
  const margin = 300;
  const visible = placements.filter(p => {
    const cx = p.x * viewport.zoom + viewport.x;
    const cy = p.y * viewport.zoom + viewport.y;
    return cx > -margin && cx < vw + margin && cy > -margin && cy < vh + margin;
  });

  let html = '';
  /* group frames first (behind cards) */
  groups.forEach(g => { html += lsGroupFrameHTML(g, placements); });

  /* cards */
  visible.forEach(p => {
    if(p.cardType === 'chip'){
      const chip = lsChipById(p.cardId); if(!chip || chip.inTray) return;
      html += lsChipCardHTML(chip, p, {selected: selectedIds.has(p.id)});
    } else {
      const node = (S.treeNodes||[]).find(n => n.id === p.cardId); if(!node) return;
      html += lsNodeCardHTML(node, p, {selected: selectedIds.has(p.id)});
    }
  });

  inner.innerHTML = html;
  inner.style.transform = `translate(${viewport.x}px,${viewport.y}px) scale(${viewport.zoom})`;
  inner.style.transformOrigin = '0 0';
  lsDrawArrows(root, boardId, viewport);
}

/* ---------- SVG arrow overlay ---------- */
function lsDrawArrows(root, boardId, viewport){
  const svg = root.querySelector('[data-arrows]'); if(!svg) return;
  const placements = lsBoardPlacements(boardId);
  const board = lsBoardById(boardId); if(!board) return;

  function placementOf(cardId, cardType){
    return placements.find(p => p.boardId === boardId && p.cardId === cardId && p.cardType === cardType) || null;
  }

  const lines = [];
  /* lsGrafts (chip-to-chip) */
  (S.lsGrafts||[]).filter(g => {
    const fromChip = lsChipById(g.fromId);
    const toChip   = lsChipById(g.toId);
    return fromChip && toChip && fromChip.boardId === boardId && toChip.boardId === boardId;
  }).forEach(g => {
    const fp = placementOf(g.fromId, 'chip');
    const tp = placementOf(g.toId,   'chip');
    if(!fp || !tp) return;
    lines.push({from: fp, to: tp, type: g.type});
  });
  /* treeGrafts where both nodes are on this board */
  (S.treeGrafts||[]).forEach(g => {
    const fp = placementOf(g.fromId, 'node');
    const tp = placementOf(g.toId,   'node');
    if(!fp || !tp) return;
    lines.push({from: fp, to: tp, type: g.type});
  });

  const zoom = viewport.zoom;
  const arrowColor = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || '#888';

  svg.setAttribute('width',  root.offsetWidth);
  svg.setAttribute('height', root.offsetHeight);

  svg.innerHTML = lines.map(({from: f, to: t, type}) => {
    const fx = (f.x + (f.w||LS_CARD_W)/2) * zoom + viewport.x;
    const fy = (f.y + (f.h||LS_CARD_H)/2) * zoom + viewport.y;
    const tx = (t.x + (t.w||LS_CARD_W)/2) * zoom + viewport.x;
    const ty = (t.y + (t.h||LS_CARD_H)/2) * zoom + viewport.y;
    const stroke = type === 'contradicts' ? 'var(--rose,#c87070)' : arrowColor;
    const dash   = type === 'echoes'      ? '4 3' : '';
    return `<line x1="${fx.toFixed(1)}" y1="${fy.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}"
      stroke="${stroke}" stroke-width="1.5" ${dash ? `stroke-dasharray="${dash}"` : ''}
      marker-end="url(#lsArrow)"/>`;
  }).join('') + `<defs><marker id="lsArrow" markerWidth="6" markerHeight="6"
    refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="${arrowColor}"/></marker></defs>`;
}

/* ---------- tray (chips not yet placed, marked inTray) ---------- */
function lsTrayHTML(boardId){
  lsEnsure();
  const chips = S.lsChips.filter(c => c.boardId === boardId && c.inTray);
  if(!chips.length) return `<div class="ls-tray-empty muted">Tray empty</div>`;
  return chips.map(c =>
    `<div class="ls-tray-item" data-tray-chip="${esc(c.id)}">${esc(c.text)}</div>`
  ).join('');
}

/* ---------- fit to content ---------- */
function lsFitToContent(root, boardId){
  const placements = lsBoardPlacements(boardId).filter(p => {
    const c = lsChipById(p.cardId);
    return !c || !c.inTray;
  });
  if(!placements.length) return;
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  placements.forEach(p => {
    x1 = Math.min(x1, p.x);
    y1 = Math.min(y1, p.y);
    x2 = Math.max(x2, p.x + (p.w || LS_CARD_W));
    y2 = Math.max(y2, p.y + (p.h || LS_CARD_H));
  });
  const pw = root.offsetWidth  || 800;
  const ph = root.offsetHeight || 600;
  const ww = x2 - x1 + 80, wh = y2 - y1 + 80;
  const zoom = Math.min(1.2, Math.max(0.2, Math.min(pw / ww, ph / wh)));
  const vp = { x: (pw - ww * zoom) / 2 - x1 * zoom, y: (ph - wh * zoom) / 2 - y1 * zoom, zoom };
  lsBoardSetViewport(boardId, vp);
  return vp;
}

/* ---------- tidy: align, distribute, space out ---------- */
function lsAlign(placementIds, axis){
  lsEnsure();
  const ps = S.lsPlacements.filter(p => placementIds.includes(p.id)); if(ps.length < 2) return;
  if(axis === 'x'){ const avg = ps.reduce((s,p) => s + p.x, 0) / ps.length; ps.forEach(p => p.x = avg); }
  else            { const avg = ps.reduce((s,p) => s + p.y, 0) / ps.length; ps.forEach(p => p.y = avg); }
  save();
}

function lsDistribute(placementIds, axis){
  lsEnsure();
  const ps = [...S.lsPlacements.filter(p => placementIds.includes(p.id))];
  if(ps.length < 3) return;
  if(axis === 'x'){
    ps.sort((a,b) => a.x - b.x);
    const gap = (ps[ps.length-1].x - ps[0].x) / (ps.length - 1);
    ps.forEach((p,i) => p.x = ps[0].x + i * gap);
  } else {
    ps.sort((a,b) => a.y - b.y);
    const gap = (ps[ps.length-1].y - ps[0].y) / (ps.length - 1);
    ps.forEach((p,i) => p.y = ps[0].y + i * gap);
  }
  save();
}

function lsSpaceOut(boardId, gap){
  gap = gap || 24;
  const ps = [...lsBoardPlacements(boardId)].filter(p => { const c = lsChipById(p.cardId); return !c || !c.inTray; });
  ps.sort((a,b) => a.y === b.y ? a.x - b.x : a.y - b.y);
  /* simple gravity-based push: columns of 5 */
  const cols = 5;
  ps.forEach((p, i) => {
    p.x = (i % cols) * (LS_CARD_W + gap);
    p.y = Math.floor(i / cols) * (LS_CARD_H + gap);
  });
  save();
}

/* ---------- bind: all pointer interaction on a board ---------- */
function bindCanvas(root, boardId, opts){
  opts = opts || {};
  /* onSelectionChange(ids), onModeChange() */
  lsEnsure();

  const board = lsBoardById(boardId);
  if(!board) return;

  let viewport = Object.assign({}, board.viewport);
  let selectedIds = new Set();    /* placement ids */
  let editingChipId = null;

  function vp(){ return viewport; }

  function repaint(){
    lsRenderCards(root, boardId, viewport, selectedIds);
    rebindCardEvents();
  }

  function saveViewport(){
    lsBoardSetViewport(boardId, viewport);
  }

  /* ---- inline chip editor ---- */
  function openChipEditor(wx, wy, existingChipId){
    /* remove any existing editor first */
    root.querySelectorAll('.ls-chip-editor').forEach(el => el.remove());

    const inp = document.createElement('div');
    inp.className = 'ls-chip-editor';
    inp.contentEditable = 'true';
    inp.style.position = 'absolute';
    const cx = wx * viewport.zoom + viewport.x;
    const cy = wy * viewport.zoom + viewport.y;
    inp.style.left = cx + 'px';
    inp.style.top  = cy + 'px';
    inp.style.width = (LS_CARD_W * viewport.zoom) + 'px';
    root.appendChild(inp);

    if(existingChipId){
      const c = lsChipById(existingChipId);
      if(c){
        inp.textContent = c.text;
        editingChipId = existingChipId;
        /* caret at end */
        const range = document.createRange();
        range.selectNodeContents(inp);
        range.collapse(false);
        const sel = window.getSelection();
        if(sel){ sel.removeAllRanges(); sel.addRange(range); }
      }
    }
    inp.focus();

    /* Bug 1 fix: guard against double-commit (blur fires when inp.remove() is called) */
    let committed = false;

    function commit(){
      if(committed) return;
      committed = true;
      const text = inp.textContent.trim();
      if(text){
        if(editingChipId){
          lsChipUpdate(editingChipId, {text});
        } else {
          const chip = lsChipNew(boardId, text);
          if(chip) lsPlaceCard(boardId, chip.id, 'chip', wx, wy);
        }
      }
      inp.remove();
      editingChipId = null;
      repaint();
    }

    inp.addEventListener('keydown', e => {
      /* Bug 2 fix: skip during IME composition (CJK input) */
      if(e.isComposing || e.keyCode === 229) return;
      if(e.key === 'Enter' && !e.shiftKey){
        e.preventDefault();
        const wasNew = !existingChipId;
        commit();
        if(wasNew) openChipEditor(wx, wy + LS_CARD_H + 16);
      }
      if(e.key === 'Tab'){
        e.preventDefault();
        commit();
        openChipEditor(wx + LS_CARD_W + 16, wy);
      }
      if(e.key === 'Escape'){
        e.preventDefault();
        commit();  /* Esc commits (brief D1: "commits and exits editing") */
      }
    });
    inp.addEventListener('blur', () => { commit(); });

    /* Bug 3 fix: plain-text paste only */
    inp.addEventListener('paste', e => {
      e.preventDefault();
      const plain = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, plain);
    });

    /* stop canvas pointerdown from running while editor is active */
    inp.addEventListener('pointerdown', e => { e.stopPropagation(); });
  }

  /* ---- selection ---- */
  function select(placementId, additive){
    if(!additive) selectedIds.clear();
    if(placementId) selectedIds.add(placementId);
    if(opts.onSelectionChange) opts.onSelectionChange([...selectedIds]);
    repaint();
  }

  function selectAll(ids){
    selectedIds = new Set(ids);
    if(opts.onSelectionChange) opts.onSelectionChange([...selectedIds]);
    repaint();
  }

  /* ---- card drag ---- */
  function rebindCardEvents(){
    root.querySelectorAll('.ls-card').forEach(card => {
      card.addEventListener('pointerdown', onCardPointerDown, {passive: false});
      card.addEventListener('dblclick', onCardDblClick);
    });
    root.querySelectorAll('[data-group-label]').forEach(lbl => {
      lbl.addEventListener('dblclick', onGroupLabelDblClick);
    });
  }

  function onCardDblClick(e){
    const card = e.currentTarget;
    const chipId = card.dataset.cid;
    const pid    = card.dataset.pid;
    if(card.dataset.ctype !== 'chip') return;
    e.stopPropagation();
    const p = S.lsPlacements.find(x => x.id === pid);
    if(!p) return;
    editingChipId = chipId;
    openChipEditor(p.x, p.y, chipId);
  }

  function onGroupLabelDblClick(e){
    const lbl = e.currentTarget;
    const frame = lbl.closest('[data-gid]'); if(!frame) return;
    const gid = frame.dataset.gid;
    const g = lsGroupById(gid); if(!g) return;
    e.stopPropagation();
    lbl.contentEditable = true;
    lbl.focus();
    lbl.addEventListener('blur', () => {
      lsGroupById(gid) && (lsGroupById(gid).label = lbl.textContent.trim());
      lbl.contentEditable = false;
      save(); repaint();
    }, {once: true});
    lbl.addEventListener('keydown', ev => {
      if(ev.key === 'Enter'){ ev.preventDefault(); lbl.blur(); }
      if(ev.key === 'Escape'){ lbl.contentEditable = false; repaint(); }
    });
  }

  function onCardPointerDown(e){
    if(e.button && e.button !== 0) return;
    e.stopPropagation();
    const card = e.currentTarget;
    const pid = card.dataset.pid;
    if(!e.shiftKey && !selectedIds.has(pid)) select(pid, false);
    else if(e.shiftKey) { selectedIds.add(pid); repaint(); }

    const dragging = [...selectedIds];
    const startX = e.clientX, startY = e.clientY;
    const startPositions = {};
    dragging.forEach(id => {
      const p = S.lsPlacements.find(x => x.id === id);
      if(p) startPositions[id] = {x: p.x, y: p.y};
    });

    let moved = false;
    card.setPointerCapture(e.pointerId);

    function onMove(ev){
      const dx = (ev.clientX - startX) / viewport.zoom;
      const dy = (ev.clientY - startY) / viewport.zoom;
      if(!moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) moved = true;
      dragging.forEach(id => {
        const p = S.lsPlacements.find(x => x.id === id); if(!p) return;
        p.x = (startPositions[id]?.x || 0) + dx;
        p.y = (startPositions[id]?.y || 0) + dy;
      });
      /* live repaint while dragging */
      lsRenderCards(root, boardId, viewport, selectedIds);
    }

    function onUp(){
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerup', onUp);
      card.removeEventListener('pointercancel', onUp);
      if(!moved) return;
      /* push undo */
      const snapBefore = {};
      const snapAfter  = {};
      dragging.forEach(id => {
        const p = S.lsPlacements.find(x => x.id === id); if(!p) return;
        snapBefore[id] = {...startPositions[id]};
        snapAfter[id]  = {x: p.x, y: p.y};
      });
      lsUndoPush(boardId,
        () => { dragging.forEach(id => { const p = S.lsPlacements.find(x => x.id === id); if(p && snapBefore[id]) Object.assign(p, snapBefore[id]); }); save(); repaint(); },
        () => { dragging.forEach(id => { const p = S.lsPlacements.find(x => x.id === id); if(p && snapAfter[id])  Object.assign(p, snapAfter[id]);  }); save(); repaint(); }
      );
      save();
      repaint();
    }

    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerup',   onUp);
    card.addEventListener('pointercancel', onUp);
  }

  /* ---- canvas pan + lasso ---- */
  let panning = false;
  let lasso = null;
  let panStart = null;
  let vpStart  = null;

  root.addEventListener('pointerdown', e => {
    if(e.target.closest('.ls-card') || e.target.closest('.ls-group-frame') || e.target.closest('.ls-chip-editor')) return;
    if(e.button === 1 || e.getModifierState('Space')){ /* middle button or Space: pan */
      panning = true;
      panStart = {x: e.clientX, y: e.clientY};
      vpStart  = {x: viewport.x, y: viewport.y};
      root.setPointerCapture(e.pointerId);
      return;
    }
    if(e.button !== 0) return;
    if(!e.shiftKey) selectedIds.clear();
    /* start lasso */
    const rect = root.getBoundingClientRect();
    lasso = {
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      el: document.createElement('div')
    };
    lasso.el.className = 'ls-lasso';
    root.appendChild(lasso.el);
    root.setPointerCapture(e.pointerId);
  });

  root.addEventListener('pointermove', e => {
    if(panning && panStart){
      viewport.x = vpStart.x + (e.clientX - panStart.x);
      viewport.y = vpStart.y + (e.clientY - panStart.y);
      lsRenderCards(root, boardId, viewport, selectedIds);
      return;
    }
    if(lasso){
      const rect = root.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const lx = Math.min(lasso.startX, cx);
      const ly = Math.min(lasso.startY, cy);
      const lw = Math.abs(cx - lasso.startX);
      const lh = Math.abs(cy - lasso.startY);
      Object.assign(lasso.el.style, {left:lx+'px', top:ly+'px', width:lw+'px', height:lh+'px'});
      lasso.cx = cx; lasso.cy = cy;
    }
  });

  root.addEventListener('pointerup', e => {
    if(panning){
      panning = false; panStart = null; vpStart = null;
      saveViewport(); repaint(); return;
    }
    if(lasso){
      const rect = root.getBoundingClientRect();
      const lx1 = Math.min(lasso.startX, lasso.cx || lasso.startX);
      const ly1 = Math.min(lasso.startY, lasso.cy || lasso.startY);
      const lx2 = Math.max(lasso.startX, lasso.cx || lasso.startX);
      const ly2 = Math.max(lasso.startY, lasso.cy || lasso.startY);
      /* select placements whose canvas-coords fall inside the lasso */
      if(lx2 - lx1 > 4 || ly2 - ly1 > 4){
        lsBoardPlacements(boardId).forEach(p => {
          const cx = p.x * viewport.zoom + viewport.x;
          const cy = p.y * viewport.zoom + viewport.y;
          if(cx >= lx1 && cx <= lx2 && cy >= ly1 && cy <= ly2){
            selectedIds.add(p.id);
          }
        });
        if(opts.onSelectionChange) opts.onSelectionChange([...selectedIds]);
      }
      lasso.el.remove(); lasso = null;
      repaint();
    }
  });

  root.addEventListener('pointercancel', () => {
    panning = false; panStart = null; vpStart = null;
    if(lasso){ lasso.el.remove(); lasso = null; }
  });

  /* ---- zoom: wheel ---- */
  root.addEventListener('wheel', e => {
    if(!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const rect = root.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const newZoom = Math.max(0.15, Math.min(3, viewport.zoom * factor));
    viewport.x = mx - (mx - viewport.x) * (newZoom / viewport.zoom);
    viewport.y = my - (my - viewport.y) * (newZoom / viewport.zoom);
    viewport.zoom = newZoom;
    lsRenderCards(root, boardId, viewport, selectedIds);
  }, {passive: false});

  /* ---- dblclick on empty canvas: create chip ---- */
  root.addEventListener('dblclick', e => {
    if(e.target.closest('.ls-card') || e.target.closest('.ls-group-frame')) return;
    const rect = root.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const w  = lsCanvasToWorld(viewport, cx, cy);
    openChipEditor(w.x, w.y);
  });

  /* ---- nudge selected cards by dx,dy world-units ---- */
  function nudgeSelected(dx, dy){
    if(!selectedIds.size) return;
    selectedIds.forEach(pid => {
      const p = S.lsPlacements.find(x => x.id === pid); if(!p) return;
      p.x += dx; p.y += dy; p.updatedAt = Date.now();
    });
    save(); repaint();
  }

  /* ---- quick-add bar (/) ---- */
  function openQuickAdd(){
    root.querySelectorAll('.ls-quick-add').forEach(el => el.remove());
    const bar = document.createElement('div');
    bar.className = 'ls-quick-add';
    bar.innerHTML = '<input class="ls-qa-input" type="text" placeholder="Type a chip and press Enter…" autocomplete="off">';
    root.appendChild(bar);
    const inp = bar.querySelector('.ls-qa-input');
    inp.focus();
    function placeAndClose(){
      const text = inp.value.trim();
      if(text){
        const rect = root.getBoundingClientRect();
        const w = lsCanvasToWorld(viewport, rect.width / 2, rect.height / 2);
        const chip = lsChipNew(boardId, text);
        if(chip) lsPlaceCard(boardId, chip.id, 'chip', w.x - LS_CARD_W / 2, w.y - LS_CARD_H / 2);
        repaint();
      }
      bar.remove();
    }
    inp.addEventListener('keydown', e => {
      if(e.key === 'Enter'){ e.preventDefault(); placeAndClose(); }
      if(e.key === 'Escape'){ e.preventDefault(); bar.remove(); }
      e.stopPropagation();
    });
    inp.addEventListener('blur', () => { bar.remove(); });
  }

  /* ---- keyboard shortcuts ---- */
  function onKey(e){
    if(isTyping()) return;
    /* undo / redo */
    if((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey){ e.preventDefault(); lsUndoApply(boardId); repaint(); return; }
    if((e.ctrlKey || e.metaKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))){ e.preventDefault(); lsRedoApply(boardId); repaint(); return; }
    /* fit to content */
    if(e.key === '0' && !e.ctrlKey && !e.metaKey && !e.shiftKey){
      const vp = lsFitToContent(root, boardId);
      if(vp){ viewport = vp; repaint(); }
      return;
    }
    /* 1:1 zoom reset */
    if(e.code === 'Digit0' && e.shiftKey && !e.ctrlKey && !e.metaKey){
      e.preventDefault();
      const rect = root.getBoundingClientRect();
      viewport.zoom = 1;
      viewport.x = rect.width / 2 - 200;
      viewport.y = rect.height / 2 - 100;
      repaint(); return;
    }
    /* zoom in / out via keyboard */
    if((e.key === '+' || e.key === '=') && !e.ctrlKey && !e.metaKey){
      e.preventDefault();
      const rect = root.getBoundingClientRect();
      const cx = rect.width / 2, cy = rect.height / 2;
      const newZoom = Math.min(3, viewport.zoom * 1.2);
      viewport.x = cx - (cx - viewport.x) * (newZoom / viewport.zoom);
      viewport.y = cy - (cy - viewport.y) * (newZoom / viewport.zoom);
      viewport.zoom = newZoom;
      repaint(); return;
    }
    if(e.key === '-' && !e.ctrlKey && !e.metaKey){
      e.preventDefault();
      const rect = root.getBoundingClientRect();
      const cx = rect.width / 2, cy = rect.height / 2;
      const newZoom = Math.max(0.15, viewport.zoom / 1.2);
      viewport.x = cx - (cx - viewport.x) * (newZoom / viewport.zoom);
      viewport.y = cy - (cy - viewport.y) * (newZoom / viewport.zoom);
      viewport.zoom = newZoom;
      repaint(); return;
    }
    /* new chip at viewport center */
    if((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey){
      e.preventDefault();
      const rect = root.getBoundingClientRect();
      const w = lsCanvasToWorld(viewport, rect.width / 2, rect.height / 2);
      openChipEditor(w.x - LS_CARD_W / 2, w.y - LS_CARD_H / 2);
      return;
    }
    /* quick-add bar */
    if(e.key === '/'){
      e.preventDefault();
      openQuickAdd();
      return;
    }
    /* edit selected chip in-place */
    if((e.key === 'Enter' || e.key === 'F2') && selectedIds.size === 1){
      e.preventDefault();
      const pid = [...selectedIds][0];
      const p = S.lsPlacements.find(x => x.id === pid);
      if(p && p.cardType === 'chip') openChipEditor(p.x, p.y, p.cardId);
      return;
    }
    /* select all */
    if((e.ctrlKey || e.metaKey) && e.key === 'a'){
      e.preventDefault();
      lsBoardPlacements(boardId).forEach(p => selectedIds.add(p.id));
      if(opts.onSelectionChange) opts.onSelectionChange([...selectedIds]);
      repaint(); return;
    }
    /* duplicate selected */
    if((e.ctrlKey || e.metaKey) && e.key === 'd'){
      e.preventDefault();
      if(!selectedIds.size) return;
      const newIds = [];
      selectedIds.forEach(pid => {
        const p = S.lsPlacements.find(x => x.id === pid); if(!p) return;
        if(p.cardType === 'chip'){
          const orig = lsChipById(p.cardId); if(!orig) return;
          const chip = lsChipNew(boardId, orig.text);
          if(chip){
            lsPlaceCard(boardId, chip.id, 'chip', p.x + 20, p.y + 20);
            const np = lsPlacementFor(boardId, chip.id, 'chip');
            if(np) newIds.push(np.id);
          }
        }
      });
      selectedIds.clear();
      newIds.forEach(id => selectedIds.add(id));
      if(opts.onSelectionChange) opts.onSelectionChange([...selectedIds]);
      repaint(); return;
    }
    /* nudge selected */
    if(selectedIds.size){
      const step = e.shiftKey ? 10 : 1;
      if(e.key === 'ArrowLeft') { e.preventDefault(); nudgeSelected(-step, 0); return; }
      if(e.key === 'ArrowRight'){ e.preventDefault(); nudgeSelected( step, 0); return; }
      if(e.key === 'ArrowUp')   { e.preventDefault(); nudgeSelected(0, -step); return; }
      if(e.key === 'ArrowDown') { e.preventDefault(); nudgeSelected(0,  step); return; }
    }
    /* delete selected */
    if((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size){
      e.preventDefault();
      const ids = [...selectedIds];
      const chips = ids.map(pid => {
        const p = S.lsPlacements.find(x => x.id === pid); if(!p) return null;
        return p.cardType === 'chip' ? p.cardId : null;
      }).filter(Boolean);
      selectedIds.clear();
      const restores = chips.map(id => lsChipDelete(id));
      lsUndoPush(boardId,
        () => { restores.forEach(r => typeof r === 'function' && r()); repaint(); },
        () => { chips.forEach(id => spliceOut(S.lsChips, c => c.id === id)); save(); repaint(); }
      );
      repaint();
    }
  }
  document.addEventListener('keydown', onKey);

  /* ---- canvas-level paste: multiline text → offer to create N chips ---- */
  function onPaste(e){
    if(!root.isConnected || isTyping()) return;
    e.preventDefault();
    const plain = (e.clipboardData || window.clipboardData).getData('text/plain');
    if(!plain) return;
    const lines = plain.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if(!lines.length) return;
    if(lines.length === 1){
      /* single line: open chip editor at viewport center with pre-filled text */
      const rect = root.getBoundingClientRect();
      const w = lsCanvasToWorld(viewport, rect.width / 2, rect.height / 2);
      openChipEditor(w.x - LS_CARD_W / 2, w.y - LS_CARD_H / 2);
      /* wait for editor to mount then set text */
      setTimeout(() => {
        const ed = root.querySelector('.ls-chip-editor');
        if(ed){ ed.textContent = lines[0]; ed.focus(); }
      }, 0);
    } else {
      /* multiline: confirm and scatter */
      const m = openModal(`<h3>Create ${lines.length} chips?</h3>
        <p class="muted" style="font-size:.82rem;margin:.5rem 0 1rem">One chip per line from your clipboard.</p>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn ghost" data-cancel>Cancel</button>
          <button class="btn primary" data-ok>Create ${lines.length} chips</button>
        </div>`, 'narrow');
      m.querySelector('[data-cancel]').onclick = () => m.remove();
      m.querySelector('[data-ok]').onclick = () => {
        m.remove();
        const startW = lsCanvasToWorld(viewport, 40, 40);
        lines.forEach((text, i) => {
          const col = i % 5, row = Math.floor(i / 5);
          const chip = lsChipNew(boardId, text);
          if(chip) lsPlaceCard(boardId, chip.id, 'chip',
            startW.x + col * (LS_CARD_W + 16),
            startW.y + row * (LS_CARD_H + 16));
        });
        repaint();
      };
    }
  }
  document.addEventListener('paste', onPaste);

  /* ---- tray: move chip in/out ---- */
  const trayEl = root.querySelector('[data-tray]');
  if(trayEl){
    trayEl.addEventListener('click', e => {
      const item = e.target.closest('[data-tray-chip]');
      if(!item) return;
      const chipId = item.dataset.trayChip;
      const chip = lsChipById(chipId); if(!chip) return;
      /* place at a default position and remove from tray */
      const existing = lsPlacementFor(boardId, chipId, 'chip');
      if(existing){ existing.x = 80; existing.y = 80; }
      else lsPlaceCard(boardId, chipId, 'chip', 80, 80);
      chip.inTray = false;
      save(); repaint();
      trayEl.innerHTML = lsTrayHTML(boardId);
    });
  }

  /* context menu: delete / group / promote */
  root.addEventListener('contextmenu', e => {
    const card = e.target.closest('.ls-card'); if(!card) return;
    e.preventDefault();
    const pid = card.dataset.pid;
    const chipId = card.dataset.ctype === 'chip' ? card.dataset.cid : null;
    const items = [];
    if(chipId){
      items.push({label: 'Edit text', action: () => {
        const p = S.lsPlacements.find(x => x.id === pid);
        if(p) openChipEditor(p.x, p.y, chipId);
      }});
      items.push({label: 'Move to tray', action: () => {
        lsChipUpdate(chipId, {inTray: true}); repaint(); trayEl && (trayEl.innerHTML = lsTrayHTML(boardId));
      }});
    }
    items.push({label: `Delete${selectedIds.size > 1 ? ` (${selectedIds.size})` : ''}`, action: () => {
      const ids = selectedIds.size > 1 ? [...selectedIds] : [pid];
      ids.forEach(id => {
        const p = S.lsPlacements.find(x => x.id === id); if(!p) return;
        if(p.cardType === 'chip') lsChipDelete(p.cardId);
        else spliceOut(S.lsPlacements, x => x.id === id);
      });
      selectedIds.clear(); save(); repaint();
    }});
    const menu = openModal(items.map(it => `<button class="btn ghost" data-action="${esc(it.label)}">${esc(it.label)}</button>`).join(''), 'narrow');
    menu.querySelectorAll('[data-action]').forEach(btn => {
      const it = items.find(x => x.label === btn.dataset.action);
      if(it) btn.onclick = () => { it.action(); menu.remove(); };
    });
  });

  /* initial render */
  repaint();
  trayEl && (trayEl.innerHTML = lsTrayHTML(boardId));

  return {
    repaint,
    getViewport: () => ({...viewport}),
    getSelected: () => [...selectedIds],
    selectAll,
    clearSelection: () => { selectedIds.clear(); repaint(); },
    destroy: () => { document.removeEventListener('keydown', onKey); document.removeEventListener('paste', onPaste); lsUndoClear(boardId); }
  };
}
