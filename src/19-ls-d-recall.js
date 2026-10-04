/* ============================================================
   19-ls-d-recall.js — Learning Studio: Recall modes
   Phase 3: Fog mode + Ghost mode
   Phase 5 adds: Shuffle, Counterfactual drag, Teach path
   ============================================================ */

/* ---------- fuzzy matching ---------- */

function lsLevenshtein(a, b){
  const m = a.length, n = b.length;
  const dp = [];
  for(let i = 0; i <= m; i++){
    dp[i] = [];
    for(let j = 0; j <= n; j++) dp[i][j] = i ? (j ? 0 : i) : j;
  }
  for(let i = 1; i <= m; i++){
    for(let j = 1; j <= n; j++){
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

function lsNormLevenshtein(a, b){
  a = a.toLowerCase().trim(); b = b.toLowerCase().trim();
  if(!a && !b) return 0;
  if(!a || !b) return 1;
  return lsLevenshtein(a, b) / Math.max(a.length, b.length);
}

/* Match a list of recalled texts against reference chips.
   Returns { matched:[{chip,recalled,dist}], missed:[{chip}], extra:[string] } */
function lsMatchRecall(boardId, recalledTexts, snapshotId){
  lsEnsure();
  const threshold = (S.lsPrefs && S.lsPrefs.fuzzyMatchThreshold != null)
    ? S.lsPrefs.fuzzyMatchThreshold : 0.35;

  let refChips = [];
  if(snapshotId){
    const snap = (S.lsSnapshots||[]).find(s => s.id === snapshotId);
    if(snap){
      const ids = (snap.placements||[]).filter(p => p.cardType === 'chip').map(p => p.cardId);
      refChips = ids.map(id => (S.lsChips||[]).find(c => c.id === id)).filter(Boolean);
    }
  }
  if(!refChips.length){
    refChips = (S.lsChips||[]).filter(c => c.boardId === boardId && !c.inTray);
  }

  const matched = [];
  const missed  = [];
  const used    = new Set();

  refChips.forEach(chip => {
    const text = (chip.text || '').trim();
    if(!text){ missed.push({chip}); return; }
    let bestIdx = -1, bestDist = Infinity;
    recalledTexts.forEach((rt, i) => {
      if(used.has(i) || !rt.trim()) return;
      const d = lsNormLevenshtein(text, rt);
      if(d < bestDist){ bestDist = d; bestIdx = i; }
    });
    if(bestIdx >= 0 && bestDist <= threshold){
      matched.push({chip, recalled: recalledTexts[bestIdx], dist: bestDist});
      used.add(bestIdx);
    } else {
      missed.push({chip});
    }
  });

  const extra = recalledTexts.filter((t, i) => !used.has(i) && t.trim());
  return { matched, missed, extra };
}

/* ---------- helpers ---------- */

function _lsFindCanvas(panelEl){
  return panelEl?.closest('.ls-content-area')?.querySelector('.ls-canvas-root');
}

function _lsSaveRecallAttempt(boardId, snapshotId, mode, result, recalled, startedAt){
  return lsRecallSave({
    boardId,
    snapshotId: snapshotId || null,
    mode,
    startedAt: startedAt || new Date().toISOString(),
    durationSec: startedAt
      ? Math.round((Date.now() - new Date(startedAt).getTime()) / 1000)
      : 0,
    recalledCardIds: result.matched.map(x => x.chip.id),
    missedCardIds:   result.missed.map(x => x.chip.id),
    extraCardIds:    [],
    notes:           recalled.join('\n'),
    createdAt:       new Date().toISOString(),
  });
}

function _lsPaintResult(canvasRoot, result){
  canvasRoot.querySelectorAll('.ls-card').forEach(el => {
    el.classList.remove('ls-recall-matched','ls-recall-missed');
  });
  result.matched.forEach(({chip}) => {
    canvasRoot.querySelector(`.ls-card[data-cid="${chip.id}"]`)
      ?.classList.add('ls-recall-matched');
  });
  result.missed.forEach(({chip}) => {
    canvasRoot.querySelector(`.ls-card[data-cid="${chip.id}"]`)
      ?.classList.add('ls-recall-missed');
  });
}

function _lsClearResultPaint(canvasRoot){
  canvasRoot?.querySelectorAll('.ls-card').forEach(el => {
    el.classList.remove('ls-recall-matched','ls-recall-missed');
  });
}

function _lsAddReviewTask(boardId, missCount){
  if(typeof newPlanTask !== 'function') return;
  const board = lsBoardById(boardId);
  const label = board?.name || 'Studio';
  const t = newPlanTask(
    `Review ${missCount} missed recall item${missCount !== 1 ? 's' : ''} (${label})`,
    '', {listId: 'inbox'}
  );
  if(t && Array.isArray(S.tasks)) S.tasks.push(t);
  saveNow();
}

/* ---------- Fog mode result panel ---------- */

function _lsFogResultHTML(result){
  const m = result.matched.length, mi = result.missed.length, ex = result.extra.length;
  return `<div class="ls-recall-panel">
    <div class="ls-panel-card-label">Recall result</div>
    <div class="ls-recall-counts">
      <span class="ls-recall-matched-ct">✓ ${m} matched</span>
      <span class="ls-recall-missed-ct">✗ ${mi} missed</span>
      ${ex ? `<span class="ls-recall-extra-ct">+ ${ex} extra</span>` : ''}
    </div>
    ${mi > 0 ? `<div class="ls-recall-missed-list">
      ${result.missed.map(({chip}) =>
        `<div class="ls-recall-missed-item">${esc(chip.text.slice(0,60))}</div>`
      ).join('')}
    </div>` : ''}
    ${ex > 0 ? `<div class="ls-recall-extra-list muted">
      Extra: ${result.extra.map(t => esc(t.slice(0,30))).join(', ')}
    </div>` : ''}
    <div class="ls-recall-actions">
      <button class="btn sm"       data-fog-save>Save attempt</button>
      ${mi > 0 ? `<button class="btn ghost sm" data-fog-deck>Missed → Study Deck</button>` : ''}
      ${mi > 0 ? `<button class="btn ghost sm" data-fog-task>Add review task</button>` : ''}
      <button class="btn ghost sm" data-fog-again>Try again</button>
      <button class="btn ghost sm" data-fog-done>Done</button>
    </div>
  </div>`;
}

/* ---------- Fog mode ---------- */

function bindFogMode(panelEl, boardId, opts){
  /* opts: { snapshotId, onDone(result|null) } */
  const canvasRoot = _lsFindCanvas(panelEl);
  let fogEl  = null;
  let startedAt = null;
  let saved = false;

  function start(){
    saved = false;
    startedAt = new Date().toISOString();
    /* create overlay */
    fogEl = document.createElement('div');
    fogEl.className = 'ls-fog-overlay';
    fogEl.innerHTML = `<div class="ls-fog-message">
      <div class="ls-fog-icon">◌</div>
      <p class="ls-fog-text">The board is hidden.</p>
      <p class="faint" style="font-size:.78rem;margin-top:4px">Write what you remember in the panel →</p>
    </div>`;
    if(canvasRoot){
      canvasRoot.style.position = 'relative';
      canvasRoot.appendChild(fogEl);
    }
    renderInput();
  }

  function renderInput(){
    panelEl.innerHTML = `<div class="ls-recall-panel">
      <div class="ls-panel-card-label">Fog Recall</div>
      <p class="muted" style="font-size:.82rem;line-height:1.5;margin-bottom:8px">
        Type every idea you remember, one per line. Don't look at the board.</p>
      <textarea class="ta ls-fog-ta" rows="11"
        placeholder="idea one&#10;idea two&#10;…" style="width:100%;resize:vertical"></textarea>
      <div class="ls-recall-actions">
        <button class="btn primary sm" data-fog-reveal>Reveal &amp; Compare</button>
        <button class="btn ghost sm"   data-fog-cancel>Cancel</button>
      </div>
    </div>`;
    panelEl.querySelector('.ls-fog-ta').focus();
    panelEl.querySelector('[data-fog-reveal]').onclick = reveal;
    panelEl.querySelector('[data-fog-cancel]').onclick = cancel;
  }

  function reveal(){
    const ta = panelEl.querySelector('.ls-fog-ta');
    const recalled = ta ? ta.value.split('\n').map(s => s.trim()).filter(Boolean) : [];
    if(fogEl){ fogEl.remove(); fogEl = null; }
    const result = lsMatchRecall(boardId, recalled, opts?.snapshotId || null);
    if(canvasRoot) _lsPaintResult(canvasRoot, result);

    panelEl.innerHTML = _lsFogResultHTML(result);

    panelEl.querySelector('[data-fog-save]')?.addEventListener('click', () => {
      if(saved) return;
      _lsSaveRecallAttempt(boardId, opts?.snapshotId, 'fog', result, recalled, startedAt);
      saved = true;
      toast('Recall attempt saved.');
      const btn = panelEl.querySelector('[data-fog-save]');
      if(btn){ btn.disabled = true; btn.textContent = 'Saved'; }
    });

    panelEl.querySelector('[data-fog-deck]')?.addEventListener('click', () => {
      if(typeof suggestStudyCard !== 'function') return;
      result.missed.forEach(({chip}) => {
        suggestStudyCard({front: chip.text, sourceType:'learningStudio',
          sourceId: chip.id, sourceGo: '#/studio/' + boardId});
      });
      toast(`${result.missed.length} missed card${result.missed.length!==1?'s':''} queued for Study Deck.`);
    });

    panelEl.querySelector('[data-fog-task]')?.addEventListener('click', () => {
      _lsAddReviewTask(boardId, result.missed.length);
      toast('Review task added to Inbox.');
    });

    panelEl.querySelector('[data-fog-again]')?.addEventListener('click', () => {
      if(canvasRoot) _lsClearResultPaint(canvasRoot);
      start();
    });

    panelEl.querySelector('[data-fog-done]')?.addEventListener('click', () => {
      if(canvasRoot) _lsClearResultPaint(canvasRoot);
      opts?.onDone?.(result);
    });
  }

  function cancel(){
    if(fogEl){ fogEl.remove(); fogEl = null; }
    if(canvasRoot) _lsClearResultPaint(canvasRoot);
    opts?.onDone?.(null);
  }

  start();

  return {
    destroy(){
      if(fogEl){ fogEl.remove(); fogEl = null; }
      if(canvasRoot) _lsClearResultPaint(canvasRoot);
    }
  };
}

/* ---------- Ghost mode ---------- */

function _lsApplyGhost(canvasRoot, level){
  if(!canvasRoot) return;
  canvasRoot.querySelectorAll('.ls-card').forEach(el => {
    el.classList.remove('ls-ghost-pos','ls-ghost-grp','ls-ghost-let');
    if(level === 'position') el.classList.add('ls-ghost-pos');
    if(level === 'groups')   el.classList.add('ls-ghost-grp');
    if(level === 'letters'){
      el.classList.add('ls-ghost-let');
      const txt = el.querySelector('.ls-card-text')?.textContent || '';
      el.dataset.firstLetter = txt.charAt(0).toUpperCase();
    }
  });
  canvasRoot.querySelectorAll('.ls-group-frame').forEach(el => {
    el.classList.toggle('ls-ghost-group-hide', level === 'position');
  });
}

function _lsClearGhost(canvasRoot){
  if(!canvasRoot) return;
  canvasRoot.querySelectorAll('.ls-card').forEach(el => {
    el.classList.remove('ls-ghost-pos','ls-ghost-grp','ls-ghost-let',
      'ls-recall-matched','ls-recall-missed');
    delete el.dataset.firstLetter;
  });
  canvasRoot.querySelectorAll('.ls-group-frame').forEach(el => {
    el.classList.remove('ls-ghost-group-hide');
  });
}

function bindGhostMode(panelEl, boardId, opts){
  const canvasRoot = _lsFindCanvas(panelEl);
  let level = 'groups';
  let startedAt = null;
  let saved = false;

  const LEVELS = [
    {id:'position', label:'Position only'},
    {id:'groups',   label:'+ Group labels'},
    {id:'letters',  label:'+ First letters'},
  ];

  function setLevel(l){ level = l; _lsApplyGhost(canvasRoot, level); renderPanel(); }

  function renderPanel(){
    panelEl.innerHTML = `<div class="ls-recall-panel">
      <div class="ls-panel-card-label">Ghost Recall</div>
      <p class="muted" style="font-size:.82rem;line-height:1.5;margin-bottom:8px">
        Cards are dimmed. Name each one from the scaffold.</p>
      <div class="ls-ghost-levels">
        ${LEVELS.map(l =>
          `<button class="btn ghost sm${level===l.id?' active':''}" data-level="${esc(l.id)}">${esc(l.label)}</button>`
        ).join('')}
      </div>
      <textarea class="ta ls-fog-ta" rows="9"
        placeholder="type answers, one per line…" style="width:100%;margin-top:8px;resize:vertical"></textarea>
      <div class="ls-recall-actions">
        <button class="btn primary sm" data-ghost-reveal>Reveal &amp; Compare</button>
        <button class="btn ghost sm"   data-ghost-cancel>Done</button>
      </div>
    </div>`;

    panelEl.querySelectorAll('[data-level]').forEach(btn => {
      btn.onclick = () => setLevel(btn.dataset.level);
    });

    panelEl.querySelector('[data-ghost-reveal]').onclick = () => {
      const ta  = panelEl.querySelector('.ls-fog-ta');
      const recalled = ta ? ta.value.split('\n').map(s => s.trim()).filter(Boolean) : [];
      _lsClearGhost(canvasRoot);
      const result = lsMatchRecall(boardId, recalled, opts?.snapshotId || null);
      if(canvasRoot) _lsPaintResult(canvasRoot, result);

      const m = result.matched.length, mi = result.missed.length;
      panelEl.innerHTML = `<div class="ls-recall-panel">
        <div class="ls-panel-card-label">Ghost result</div>
        <div class="ls-recall-counts">
          <span class="ls-recall-matched-ct">✓ ${m} matched</span>
          <span class="ls-recall-missed-ct">✗ ${mi} missed</span>
        </div>
        ${mi > 0 ? `<div class="ls-recall-missed-list">
          ${result.missed.map(({chip}) =>
            `<div class="ls-recall-missed-item">${esc(chip.text.slice(0,60))}</div>`
          ).join('')}
        </div>` : ''}
        <div class="ls-recall-actions">
          <button class="btn sm"       data-ghost-save>Save attempt</button>
          ${mi > 0 ? `<button class="btn ghost sm" data-ghost-deck>Missed → Study Deck</button>` : ''}
          <button class="btn ghost sm" data-ghost-again>Try again</button>
          <button class="btn ghost sm" data-ghost-done>Done</button>
        </div>
      </div>`;

      panelEl.querySelector('[data-ghost-save]')?.addEventListener('click', () => {
        if(saved) return;
        _lsSaveRecallAttempt(boardId, opts?.snapshotId, 'ghost', result, recalled, startedAt);
        saved = true;
        toast('Recall attempt saved.');
        const btn = panelEl.querySelector('[data-ghost-save]');
        if(btn){ btn.disabled = true; btn.textContent = 'Saved'; }
      });

      panelEl.querySelector('[data-ghost-deck]')?.addEventListener('click', () => {
        if(typeof suggestStudyCard !== 'function') return;
        result.missed.forEach(({chip}) => {
          suggestStudyCard({front: chip.text, sourceType:'learningStudio',
            sourceId: chip.id, sourceGo: '#/studio/' + boardId});
        });
        toast(`${mi} missed card${mi!==1?'s':''} queued for Study Deck.`);
      });

      panelEl.querySelector('[data-ghost-again]')?.addEventListener('click', () => {
        if(canvasRoot) _lsClearResultPaint(canvasRoot);
        saved = false;
        setLevel('groups');
      });

      panelEl.querySelector('[data-ghost-done]')?.addEventListener('click', () => {
        if(canvasRoot){ _lsClearGhost(canvasRoot); _lsClearResultPaint(canvasRoot); }
        opts?.onDone?.(result);
      });
    };

    panelEl.querySelector('[data-ghost-cancel]').onclick = () => {
      _lsClearGhost(canvasRoot);
      opts?.onDone?.(null);
    };
  }

  startedAt = new Date().toISOString();
  _lsApplyGhost(canvasRoot, level);
  renderPanel();

  return {
    destroy(){ _lsClearGhost(canvasRoot); }
  };
}

/* ---------- Recall panel (mounted via lsMountModePanel when mode === 'recall') ---------- */

function lsRecallPanelHTML(boardId){
  lsEnsure();
  const snaps     = (S.lsSnapshots||[]).filter(s => s.boardId === boardId);
  const lastSnap  = snaps.length ? snaps[snaps.length - 1] : null;
  const attempts  = (S.lsRecalls||[]).filter(r => r.boardId === boardId);
  const lastAttempt = attempts.length ? attempts[attempts.length - 1] : null;

  const noSnap = !lastSnap;
  const chipCount = lastSnap
    ? (lastSnap.placements||[]).filter(p => p.cardType === 'chip').length
    : (S.lsChips||[]).filter(c => c.boardId === boardId && !c.inTray).length;

  return `<div class="ls-recall-panel">
    <div class="ls-panel-card-label">Recall</div>
    <div class="muted" style="font-size:.78rem;margin-bottom:10px">
      ${lastSnap
        ? `Last snapshot: ${new Date(lastSnap.createdAt).toLocaleDateString()} · ${chipCount} chips`
        : `No snapshot yet — tap <strong>Snapshot</strong> in the header first.`
      }
      ${lastAttempt
        ? `<br>Last attempt: ${new Date(lastAttempt.createdAt).toLocaleDateString()} · ${lastAttempt.mode}`
        : ''}
    </div>

    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="ls-recall-mode-card">
        <div class="sc" style="font-size:.72rem;margin-bottom:3px">Fog</div>
        <p class="faint" style="font-size:.75rem;margin-bottom:6px;line-height:1.4">
          Board hidden — rebuild from memory</p>
        <button class="btn sm" data-start-fog${noSnap ? ' disabled' : ''}>Start Fog</button>
      </div>
      <div class="ls-recall-mode-card">
        <div class="sc" style="font-size:.72rem;margin-bottom:3px">Ghost</div>
        <p class="faint" style="font-size:.75rem;margin-bottom:6px;line-height:1.4">
          Scaffold visible — fill in the gaps</p>
        <button class="btn sm" data-start-ghost>Start Ghost</button>
      </div>
    </div>
  </div>`;
}

function bindRecallPanel(panelEl, boardId, canvasApi){
  if(!panelEl) return;
  let activeRecall = null;

  function refresh(){
    panelEl.innerHTML = lsRecallPanelHTML(boardId);
    rebind();
  }

  function rebind(){
    panelEl.querySelector('[data-start-fog]')?.addEventListener('click', () => {
      if(activeRecall){ activeRecall.destroy(); activeRecall = null; }
      const snaps = (S.lsSnapshots||[]).filter(s => s.boardId === boardId);
      const lastSnap = snaps.length ? snaps[snaps.length-1] : null;
      activeRecall = bindFogMode(panelEl, boardId, {
        snapshotId: lastSnap?.id || null,
        onDone(){ activeRecall = null; refresh(); canvasApi?.repaint?.(); }
      });
    });

    panelEl.querySelector('[data-start-ghost]')?.addEventListener('click', () => {
      if(activeRecall){ activeRecall.destroy(); activeRecall = null; }
      const snaps = (S.lsSnapshots||[]).filter(s => s.boardId === boardId);
      const lastSnap = snaps.length ? snaps[snaps.length-1] : null;
      activeRecall = bindGhostMode(panelEl, boardId, {
        snapshotId: lastSnap?.id || null,
        onDone(){ activeRecall = null; refresh(); canvasApi?.repaint?.(); }
      });
    });
  }

  refresh();

  return {
    refresh,
    destroy(){ if(activeRecall){ activeRecall.destroy(); activeRecall = null; } }
  };
}

/* ============================================================
   Phase 5 — Shuffle mode, Teach mode, session summary,
               week review strip
   ============================================================ */

/* ---------- Shuffle mode ---------- */
/* Scatter all placed chips to random positions; user regroups
   from memory; compare to latest snapshot on submit. */
function bindShuffleMode(panelEl, boardId, opts){
  const canvasRoot = _lsFindCanvas(panelEl);
  if(!canvasRoot){ panelEl.innerHTML = '<p class="muted">Canvas not found.</p>'; return {destroy(){}}; }

  const snaps = (S.lsSnapshots||[]).filter(s => s.boardId === boardId);
  const snap = opts?.snapshotId ? snaps.find(s => s.id === opts.snapshotId) : snaps[snaps.length-1];

  /* store original positions for restore */
  const origPositions = {};
  lsBoardPlacements(boardId).forEach(p => { origPositions[p.id] = {x:p.x, y:p.y}; });

  /* scatter: place chips at random positions within a wide spread */
  const placements = lsBoardPlacements(boardId);
  placements.forEach(p => {
    const nx = (Math.random() - 0.5) * 2400;
    const ny = (Math.random() - 0.5) * 1600;
    lsMoveCard(boardId, p.id, nx, ny);
  });

  /* clear group memberships temporarily */
  const origGroups = JSON.parse(JSON.stringify(lsBoardGroups(boardId)));
  lsBoardGroups(boardId).forEach(g => { g.memberIds = []; });
  save();

  const startedAt = Date.now();

  panelEl.innerHTML = `
    <div class="ls-recall-panel">
      <div class="ls-side-panel-header">Shuffle</div>
      <p class="muted" style="font-size:.8rem;margin-bottom:8px">
        Cards scattered — regroup from memory, then compare.
      </p>
      <div class="ls-recall-actions">
        <button class="btn primary" data-shuffle-compare>Compare with snapshot</button>
        <button class="btn ghost" data-shuffle-restore>Restore original layout</button>
        <button class="btn ghost" data-shuffle-done>Done (no compare)</button>
      </div>
    </div>`;

  canvasRoot.dispatchEvent(new Event('ls-repaint', {bubbles:true}));

  function restore(){
    Object.entries(origPositions).forEach(([pid, pos]) => {
      lsMoveCard(boardId, pid, pos.x, pos.y);
    });
    origGroups.forEach(g => {
      const live = lsBoardGroups(boardId).find(x => x.id === g.id);
      if(live) live.memberIds = g.memberIds;
    });
    save();
    canvasRoot.dispatchEvent(new Event('ls-repaint', {bubbles:true}));
  }

  panelEl.querySelector('[data-shuffle-compare]').onclick = () => {
    if(!snap){ toast('No snapshot to compare against.'); return; }

    /* build a regroup match: compare group membership by chip text */
    const snapChipMap = {};
    (snap.placements||[]).forEach(sp => {
      const group = (snap.groups||[]).find(g => g.memberIds?.includes(sp.cardId));
      if(sp.cardType === 'chip'){
        const chip = lsChipById(sp.cardId);
        if(chip) snapChipMap[chip.text] = group?.label || null;
      }
    });

    const currentChips = lsBoardPlacements(boardId).filter(p => p.cardType === 'chip');
    let matchCount = 0, missCount = 0;
    currentChips.forEach(p => {
      const chip = lsChipById(p.cardId);
      if(!chip) return;
      const currentGroup = lsBoardGroups(boardId).find(g => g.memberIds?.includes(p.cardId));
      const currentLabel = currentGroup?.label || null;
      const snapLabel = snapChipMap[chip.text];
      if(snapLabel !== undefined && currentLabel === snapLabel) matchCount++;
      else missCount++;
    });

    const durationSec = Math.round((Date.now() - startedAt) / 1000);
    _lsSaveRecallAttempt(boardId, snap.id, 'shuffle', {matched:[],missed:[],extra:[]}, [], new Date(Date.now() - durationSec * 1000).toISOString());

    panelEl.innerHTML = `
      <div class="ls-recall-panel">
        <div class="ls-side-panel-header">Shuffle result</div>
        <div class="ls-recall-counts" style="margin:8px 0">
          <span class="ls-recall-matched-ct">✓ ${matchCount} correct groups</span>
          <span class="ls-recall-missed-ct">✗ ${missCount} different</span>
        </div>
        <div class="ls-recall-actions">
          <button class="btn ghost" data-shuffle-restore>Restore original</button>
          <button class="btn ghost" data-done-recall>Done</button>
        </div>
      </div>`;

    panelEl.querySelector('[data-shuffle-restore]').onclick = () => { restore(); opts?.onDone?.(); };
    panelEl.querySelector('[data-done-recall]').onclick = () => opts?.onDone?.();
  };

  panelEl.querySelector('[data-shuffle-restore]').onclick = () => { restore(); opts?.onDone?.(); };
  panelEl.querySelector('[data-shuffle-done]').onclick = () => opts?.onDone?.();

  return {
    destroy(){ restore(); }
  };
}

/* ---------- Teach mode ---------- */
/* Sequential route: one chip full-screen; user narrates aloud; Esc exits. */
function bindTeachMode(panelEl, boardId, opts){
  const canvasRoot = _lsFindCanvas(panelEl);
  const placements = lsBoardPlacements(boardId);
  const chips = placements.filter(p => p.cardType === 'chip').map(p => lsChipById(p.cardId)).filter(Boolean);
  if(!chips.length){ panelEl.innerHTML = '<p class="muted">No chips on this board.</p>'; return {destroy(){}}; }

  let idx = 0;
  let overlay = null;

  function show(){
    overlay?.remove();
    const chip = chips[idx];
    overlay = document.createElement('div');
    overlay.className = 'ls-teach-overlay';
    overlay.innerHTML = `
      <div class="ls-teach-card">
        <div class="ls-teach-counter">${idx + 1} / ${chips.length}</div>
        <div class="ls-teach-text">${esc(chip.text)}</div>
        ${chip.tls ? `<div class="ls-teach-tls ls-teach-tls--${chip.tls}">
          ${chip.tls === 'green' ? 'Core' : chip.tls === 'amber' ? 'Supporting' : 'Peripheral'}
        </div>` : ''}
        <div class="ls-teach-nav">
          <button class="btn ghost" data-prev>← Prev</button>
          <button class="btn primary" data-next>${idx < chips.length - 1 ? 'Next →' : 'Finish'}</button>
        </div>
        <button class="btn ghost" style="margin-top:8px;width:100%" data-teach-exit>Exit (Esc)</button>
      </div>`;

    const wrap = canvasRoot?.parentElement || document.body;
    wrap.appendChild(overlay);

    overlay.querySelector('[data-prev]').onclick = () => { if(idx > 0){ idx--; show(); } };
    overlay.querySelector('[data-next]').onclick = () => {
      if(idx < chips.length - 1){ idx++; show(); }
      else { finish(); }
    };
    overlay.querySelector('[data-teach-exit]').onclick = finish;
  }

  function finish(){
    overlay?.remove(); overlay = null;
    _lsSaveRecallAttempt(boardId, null, 'teach', {matched:[],missed:[],extra:[]}, [], new Date().toISOString());
    panelEl.innerHTML = `<div class="ls-recall-panel">
      <div class="ls-side-panel-header">Teach — done</div>
      <p class="muted" style="font-size:.8rem">Covered ${chips.length} chips.</p>
      <div class="ls-recall-actions">
        <button class="btn ghost" data-done-teach>Done</button>
      </div>
    </div>`;
    panelEl.querySelector('[data-done-teach]').onclick = () => opts?.onDone?.();
  }

  function onKey(e){ if(e.key === 'Escape') finish(); if(e.key === 'ArrowRight') overlay?.querySelector('[data-next]')?.click(); if(e.key === 'ArrowLeft') overlay?.querySelector('[data-prev]')?.click(); }
  document.addEventListener('keydown', onKey);

  panelEl.innerHTML = `<div class="ls-recall-panel">
    <div class="ls-side-panel-header">Teach</div>
    <p class="muted" style="font-size:.8rem">Explain each chip in your own words.<br>Use arrow keys to navigate.</p>
    <div class="ls-recall-actions">
      <button class="btn primary" data-start-teach>Start presenting</button>
      <button class="btn ghost" data-teach-cancel>Cancel</button>
    </div>
  </div>`;

  panelEl.querySelector('[data-start-teach]').onclick = show;
  panelEl.querySelector('[data-teach-cancel]').onclick = () => opts?.onDone?.();

  return {
    destroy(){
      overlay?.remove();
      document.removeEventListener('keydown', onKey);
    }
  };
}

/* ---------- Updated recall panel: add Shuffle + Teach buttons ---------- */
function lsRecallPanelHTMLFull(boardId){
  lsEnsure();
  const snaps = (S.lsSnapshots||[]).filter(s => s.boardId === boardId);
  const lastSnap = snaps.length ? snaps[snaps.length - 1] : null;
  const recalls = (S.lsRecalls||[]).filter(r => r.boardId === boardId);
  const lastRecall = recalls.length ? recalls[recalls.length - 1] : null;

  return `<div class="ls-recall-panel">
    <div class="ls-side-panel-header">Recall</div>
    ${lastSnap ? `<p class="muted" style="font-size:.78rem">Snapshot: ${new Date(lastSnap.createdAt).toLocaleDateString()}</p>` : '<p class="muted">No snapshot yet — take one with Snapshot button.</p>'}
    ${lastRecall ? `<p class="muted" style="font-size:.78rem">Last recall: ${new Date(lastRecall.createdAt).toLocaleDateString()}</p>` : ''}
    <div class="ls-recall-actions" style="margin-top:10px">
      <button class="btn ghost" data-start-fog ${!lastSnap?'disabled':''}>🌫 Fog — hide and rebuild</button>
      <button class="btn ghost" data-start-ghost ${!lastSnap?'disabled':''}>👻 Ghost — positional scaffold</button>
      <button class="btn ghost" data-start-shuffle>⧉ Shuffle — regroup from memory</button>
      <button class="btn ghost" data-start-teach>🗣 Teach — present each card</button>
    </div>
    <div class="ls-recall-actions" style="margin-top:8px">
      <button class="btn sm ghost" data-open-session-summary>Session summary…</button>
    </div>
  </div>`;
}

/* Update bindRecallPanel to use the full version and add new buttons */
function bindRecallPanelFull(panelEl, boardId, canvasApi){
  lsEnsure();
  let activeRecall = null;

  function refresh(){
    panelEl.innerHTML = lsRecallPanelHTMLFull(boardId);
    rebind();
  }

  function rebind(){
    panelEl.querySelector('[data-start-fog]')?.addEventListener('click', () => {
      if(activeRecall){ activeRecall.destroy(); activeRecall = null; }
      const snaps = (S.lsSnapshots||[]).filter(s => s.boardId === boardId);
      const lastSnap = snaps.length ? snaps[snaps.length-1] : null;
      activeRecall = bindFogMode(panelEl, boardId, {
        snapshotId: lastSnap?.id || null,
        onDone(){ activeRecall = null; refresh(); canvasApi?.repaint?.(); }
      });
    });

    panelEl.querySelector('[data-start-ghost]')?.addEventListener('click', () => {
      if(activeRecall){ activeRecall.destroy(); activeRecall = null; }
      const snaps = (S.lsSnapshots||[]).filter(s => s.boardId === boardId);
      const lastSnap = snaps.length ? snaps[snaps.length-1] : null;
      activeRecall = bindGhostMode(panelEl, boardId, {
        snapshotId: lastSnap?.id || null,
        onDone(){ activeRecall = null; refresh(); canvasApi?.repaint?.(); }
      });
    });

    panelEl.querySelector('[data-start-shuffle]')?.addEventListener('click', () => {
      if(activeRecall){ activeRecall.destroy(); activeRecall = null; }
      const snaps = (S.lsSnapshots||[]).filter(s => s.boardId === boardId);
      const lastSnap = snaps.length ? snaps[snaps.length-1] : null;
      activeRecall = bindShuffleMode(panelEl, boardId, {
        snapshotId: lastSnap?.id || null,
        onDone(){ activeRecall = null; refresh(); canvasApi?.repaint?.(); }
      });
    });

    panelEl.querySelector('[data-start-teach]')?.addEventListener('click', () => {
      if(activeRecall){ activeRecall.destroy(); activeRecall = null; }
      activeRecall = bindTeachMode(panelEl, boardId, {
        onDone(){ activeRecall = null; refresh(); canvasApi?.repaint?.(); }
      });
    });

    panelEl.querySelector('[data-open-session-summary]')?.addEventListener('click', () => {
      lsOpenSessionSummary(boardId);
    });
  }

  refresh();

  return {
    refresh,
    destroy(){ if(activeRecall){ activeRecall.destroy(); activeRecall = null; } }
  };
}

/* ---------- Session summary modal ---------- */
function lsOpenSessionSummary(boardId){
  lsEnsure();
  const board = lsBoardById(boardId);
  if(!board) return;
  const branchTitle = board.branchId
    ? (S.treeNodes||[]).find(n => n.id === board.branchId)?.title || 'Studio'
    : 'Studio';

  const chipCount = (S.lsChips||[]).filter(c => c.boardId === boardId).length;
  const groupCount = (S.lsGroups||[]).filter(g => g.boardId === boardId).length;
  const recallCount = (S.lsRecalls||[]).filter(r => r.boardId === boardId).length;
  const deckCount = (S.lsChips||[]).filter(c => c.boardId === boardId && c.promotedToNodeId).length;

  const m = openModal(`
    <h2>Session Summary</h2>
    <p class="muted" style="margin-bottom:10px">${esc(branchTitle)}</p>
    <div class="ls-summary-stats">
      <div class="ls-summary-stat"><span class="ls-summary-n">${chipCount}</span><span class="ls-summary-label">chips</span></div>
      <div class="ls-summary-stat"><span class="ls-summary-n">${groupCount}</span><span class="ls-summary-label">groups</span></div>
      <div class="ls-summary-stat"><span class="ls-summary-n">${recallCount}</span><span class="ls-summary-label">recalls</span></div>
      <div class="ls-summary-stat"><span class="ls-summary-n">${deckCount}</span><span class="ls-summary-label">promoted</span></div>
    </div>
    <div class="field" style="margin-top:16px">
      <label style="font-size:.82rem;color:var(--muted)">Kolb reflection (What did you learn? How will you use it?)</label>
      <textarea class="ta" id="lsKolbNote" rows="4" placeholder="Concrete experience → Reflective observation → Abstract conceptualisation → Active experimentation…" style="margin-top:6px"></textarea>
    </div>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:14px">
      <button class="btn ghost" id="lsSumClose">Close</button>
      <button class="btn primary" id="lsSumSave">Save to journal</button>
    </div>
  `);

  const sess = (S.lsSessions||[]).filter(s => s.boardId === boardId).slice(-1)[0];
  if(sess?.kolbNote) m.querySelector('#lsKolbNote').value = sess.kolbNote;

  m.querySelector('#lsSumClose').onclick = () => m.remove();
  m.querySelector('#lsSumSave').onclick = () => {
    const note = m.querySelector('#lsKolbNote').value.trim();
    /* update session kolbNote */
    if(sess){ sess.kolbNote = note; save(); }
    /* write a journal entry */
    if(note && S.entries){
      const body = `**Learning Studio — ${branchTitle}**\n\n${note}\n\n*${chipCount} chips · ${groupCount} groups · ${recallCount} recalls*`;
      S.entries.push({
        id: uid(), type: 'reflection',
        body, occurredAt: new Date().toISOString(),
        extra: { linkedType: 'learningStudio', linkedId: boardId },
        createdAt: new Date().toISOString()
      });
      save();
      toast('Saved to Reflections journal.');
    }
    m.remove();
  };
}

/* ---------- Week review strip ---------- */
function lsWeekReviewHTML(from, to){
  lsEnsure();
  const fromD = typeof from === 'string' ? from : from?.toISOString?.()?.slice(0,10) || '';
  const toD   = typeof to   === 'string' ? to   : to  ?.toISOString?.()?.slice(0,10) || '';

  const sessions = (S.lsSessions||[]).filter(s => {
    const d = s.startedAt?.slice(0,10) || '';
    return d >= fromD && d <= toD;
  });
  const recalls = (S.lsRecalls||[]).filter(r => {
    const d = r.createdAt?.slice(0,10) || '';
    return d >= fromD && d <= toD;
  });

  if(!sessions.length && !recalls.length) return '';

  const boardIds = [...new Set(sessions.map(s => s.boardId))];
  const rows = boardIds.map(bid => {
    const b = lsBoardById(bid);
    const branchTitle = b?.branchId ? (S.treeNodes||[]).find(n => n.id === b.branchId)?.title || 'Board' : 'Board';
    const sesCount = sessions.filter(s => s.boardId === bid).length;
    const recCount = recalls.filter(r => r.boardId === bid).length;
    return `<div class="ls-wkrev-row"><a class="ls-today-link" href="#/studio/${bid}">${esc(branchTitle)}</a><span class="muted">${sesCount} session${sesCount!==1?'s':''}, ${recCount} recall${recCount!==1?'s':''}</span></div>`;
  }).join('');

  return `<div class="ls-wkrev-strip">
    <div class="ls-wkrev-title">Learning Studio</div>
    ${rows}
  </div>`;
}
