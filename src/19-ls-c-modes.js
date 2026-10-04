/* ============================================================
   19-ls-c-modes.js — Learning Studio: mode-specific UI panels
   Handles Ask, Shoot, Relate, Chunk (TLS only), Check overlays.
   Canvas mechanics live in 19-ls-b-canvas.js.
   ============================================================ */

/* ---------- Ask mode ---------- */

const LS_Q_KINDS = [
  {id:'what',       label:'What',      hint:'What is this?'},
  {id:'why',        label:'Why',       hint:'Why does it matter?'},
  {id:'how',        label:'How',       hint:'How does it relate to other ideas?'},
  {id:'personal',   label:'Personal',  hint:'What does this mean to you personally?'},
];

function lsAskPanelHTML(boardId, cardId, cardType){
  if(!cardId) return `<div class="ls-panel-empty muted">Select a chip to write questions.</div>`;
  lsEnsure();
  const questions = S.lsQuestions.filter(q => q.cardId === cardId && q.cardType === cardType);
  const chip = cardType === 'chip' ? lsChipById(cardId) : (S.treeNodes||[]).find(n => n.id === cardId);
  const label = chip ? (chip.text || chip.title || '') : cardId;

  return `<div class="ls-ask-panel" data-ask-card="${esc(cardId)}" data-ask-type="${esc(cardType)}">
    <div class="ls-panel-card-label">${esc(label.slice(0,80))}</div>
    <div class="ls-ask-tls-row">
      <span class="muted" style="font-size:.78rem">Importance:</span>
      ${['red','amber','green'].map(t => {
        const active = chip?.tls === t;
        return `<button class="ls-tls-btn${active ? ' active' : ''}" data-tls="${t}" title="${t}"
          style="color:var(${t==='red'?'--rose':t==='amber'?'--gold':'--sage'})">●</button>`;
      }).join('')}
      ${chip?.tls ? `<button class="ls-tls-btn" data-tls="" title="Clear">○</button>` : ''}
    </div>
    <div class="ls-ask-questions">
      ${LS_Q_KINDS.map(k => {
        const qs = questions.filter(q => q.kind === k.id);
        return `<div class="ls-ask-kind" data-kind="${esc(k.id)}">
          <div class="ls-ask-kind-head row" style="gap:6px;align-items:center">
            <span class="sc" style="font-size:.7rem;flex:1">${esc(k.label)}</span>
            <button class="ls-ask-add btn ghost sm" data-addkind="${esc(k.id)}" title="${esc(k.hint)}">+</button>
          </div>
          ${qs.map(q => lsQuestionRowHTML(q)).join('')}
        </div>`;
      }).join('')}
    </div>
    <div class="ls-ask-reach muted" style="font-size:.78rem;margin-top:8px">
      ${questions.length} question${questions.length!==1?'s':''} ·
      ${questions.reduce((s,q) => s + (q.linkedCardIds?.length||0), 0)} links
    </div>
  </div>`;
}

function lsQuestionRowHTML(q){
  const tls = q.tls ? ` ls-tls--${q.tls}` : '';
  const ans = q.answer ? `<div class="ls-q-answer muted">${esc(q.answer.slice(0,120))}</div>` : '';
  return `<div class="ls-q-row${tls}" data-qid="${esc(q.id)}">
    <div class="ls-q-text">${esc(q.text)}</div>
    ${ans}
    ${!q.answeredAt ? `<button class="btn ghost sm ls-q-answer-btn" data-qid="${esc(q.id)}">Answer</button>` : ''}
  </div>`;
}

function bindAskPanel(panelEl, boardId, canvasApi){
  if(!panelEl) return;

  function refresh(cardId, cardType){
    panelEl.innerHTML = lsAskPanelHTML(boardId, cardId, cardType);
    rebind();
  }

  function rebind(){
    /* TLS buttons */
    panelEl.querySelectorAll('[data-tls]').forEach(btn => {
      btn.onclick = () => {
        const card = panelEl.querySelector('[data-ask-card]');
        if(!card) return;
        const chipId = card.dataset.askCard;
        const cardType = card.dataset.askType;
        const tls = btn.dataset.tls || null;
        if(cardType === 'chip') lsChipUpdate(chipId, {tls});
        save();
        canvasApi && canvasApi.repaint();
        refresh(chipId, cardType);
      };
    });

    /* add question buttons */
    panelEl.querySelectorAll('[data-addkind]').forEach(btn => {
      btn.onclick = () => {
        const card = panelEl.querySelector('[data-ask-card]');
        if(!card) return;
        const chipId = card.dataset.askCard;
        const cardType = card.dataset.askType;
        const kind = btn.dataset.addkind;
        const text = prompt(`${LS_Q_KINDS.find(k=>k.id===kind)?.hint || 'Question'}:`);
        if(!text) return;
        lsQuestionNew(chipId, cardType, kind, text.trim());
        refresh(chipId, cardType);
      };
    });

    /* answer buttons */
    panelEl.querySelectorAll('.ls-q-answer-btn').forEach(btn => {
      btn.onclick = () => {
        const qid = btn.dataset.qid;
        const q = S.lsQuestions.find(x => x.id === qid); if(!q) return;
        const answer = prompt('Answer:'); if(!answer) return;
        lsQuestionUpdate(qid, {answer: answer.trim(), answeredAt: new Date().toISOString()});
        const card = panelEl.querySelector('[data-ask-card]');
        if(card) refresh(card.dataset.askCard, card.dataset.askType);
      };
    });
  }

  rebind();
  return { refresh };
}

/* ---------- Shoot mode ---------- */

function lsShootPanelHTML(boardId, cardId, cardType){
  if(!cardId) return `<div class="ls-panel-empty muted">Select a chip to answer its questions.</div>`;
  lsEnsure();
  const questions = S.lsQuestions.filter(q => q.cardId === cardId && q.cardType === cardType && !q.answeredAt);
  const chip = cardType === 'chip' ? lsChipById(cardId) : (S.treeNodes||[]).find(n => n.id === cardId);
  const label = chip ? (chip.text || chip.title || '') : cardId;
  const source = chip?.sourceRef?.passage ? chip.sourceRef.passage : null;

  if(!questions.length) return `<div class="ls-panel-empty muted">No open questions on "${esc(label.slice(0,40))}". Switch to Ask mode to add some.</div>`;

  const q = questions[0];
  return `<div class="ls-shoot-panel" data-shoot-card="${esc(cardId)}" data-shoot-type="${esc(cardType)}" data-shoot-qid="${esc(q.id)}">
    <div class="ls-panel-card-label">${esc(label.slice(0,80))}</div>
    <div class="ls-shoot-progress muted" style="font-size:.78rem">${questions.length} question${questions.length!==1?'s':''} to answer</div>
    <div class="ls-shoot-q">${esc(q.text)}</div>
    <textarea class="ta ls-shoot-answer" placeholder="Answer from memory first…" rows="4"></textarea>
    <div class="ls-shoot-actions row" style="gap:8px;margin-top:8px">
      <button class="btn primary sm" data-shoot-submit>Submit</button>
      ${questions.length > 1 ? `<button class="btn ghost sm" data-shoot-skip>Skip</button>` : ''}
    </div>
    ${source ? `<details class="ls-shoot-source" style="margin-top:12px">
      <summary class="muted" style="font-size:.78rem;cursor:pointer">Show source passage</summary>
      <div class="ls-shoot-passage">${esc(source)}</div>
    </details>` : ''}
  </div>`;
}

function bindShootPanel(panelEl, boardId, canvasApi){
  if(!panelEl) return;

  function refresh(cardId, cardType){
    panelEl.innerHTML = lsShootPanelHTML(boardId, cardId, cardType);
    rebind();
  }

  function rebind(){
    const el = panelEl.querySelector('[data-shoot-card]'); if(!el) return;
    const cardId = el.dataset.shootCard;
    const cardType = el.dataset.shootType;
    const qid = el.dataset.shootQid;

    const submitBtn = panelEl.querySelector('[data-shoot-submit]');
    const skipBtn   = panelEl.querySelector('[data-shoot-skip]');
    const ta = panelEl.querySelector('.ls-shoot-answer');

    if(submitBtn) submitBtn.onclick = () => {
      const answer = ta?.value.trim() || '';
      if(!answer){ ta && ta.focus(); return; }
      lsQuestionUpdate(qid, {answer, answeredAt: new Date().toISOString()});
      refresh(cardId, cardType);
    };

    if(skipBtn) skipBtn.onclick = () => {
      /* rotate to next question */
      const questions = S.lsQuestions.filter(q => q.cardId === cardId && q.cardType === cardType && !q.answeredAt && q.id !== qid);
      if(questions.length) refresh(cardId, cardType);
    };
  }

  rebind();
  return { refresh };
}

/* ---------- Relate mode ---------- */

const LS_GRAFT_TYPES = [
  {id:'supports',    label:'Supports',    key:'1'},
  {id:'contradicts', label:'Contradicts', key:'2'},
  {id:'extends',     label:'Extends',     key:'3'},
  {id:'echoes',      label:'Echoes',      key:'4'},
  {id:'raises',      label:'Raises',      key:'5'},
];

function lsRelatePanelHTML(fromCardId){
  if(!fromCardId) return `<div class="ls-panel-empty muted">Click a chip to start drawing a connection.</div>`;
  const chip = lsChipById(fromCardId);
  const label = chip?.text || fromCardId;
  return `<div class="ls-relate-hint">
    <div class="ls-panel-card-label" style="border-left:3px solid var(--page-accent);padding-left:8px">From: ${esc(label.slice(0,60))}</div>
    <p class="muted" style="font-size:.82rem;margin:8px 0">Now click another chip to draw the connection.</p>
    <p class="faint" style="font-size:.75rem">Press Escape to cancel.</p>
  </div>`;
}

function lsRelateConfirmPopover(fromId, fromType, toId, toType, onConfirm, onCancel){
  const fromChip = fromType === 'chip' ? lsChipById(fromId) : (S.treeNodes||[]).find(n => n.id === fromId);
  const toChip   = toType   === 'chip' ? lsChipById(toId)   : (S.treeNodes||[]).find(n => n.id === toId);
  const fromLabel = (fromChip?.text || fromChip?.title || '').slice(0,40);
  const toLabel   = (toChip?.text   || toChip?.title   || '').slice(0,40);

  const m = openModal(`
    <h3 style="font-size:.95rem;margin-bottom:12px">Connect chips</h3>
    <p class="muted" style="font-size:.82rem;margin-bottom:10px">"${esc(fromLabel)}" → "${esc(toLabel)}"</p>
    <div class="ls-relate-types" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
      ${LS_GRAFT_TYPES.map(t =>
        `<button class="btn ghost sm ls-type-btn" data-type="${esc(t.id)}">${t.key} ${esc(t.label)}</button>`
      ).join('')}
    </div>
    <div class="ls-relate-active-type muted" style="font-size:.78rem;min-height:1em;margin-bottom:8px" data-activetype></div>
    <input type="text" class="inp ls-relate-why" placeholder="Why are they connected? (required)" style="width:100%">
    <div class="row" style="gap:8px;margin-top:10px;justify-content:flex-end">
      <button class="btn ghost sm" data-cancel>Cancel</button>
      <button class="btn primary sm" data-confirm>Connect</button>
    </div>
  `, 'narrow');

  let selectedType = null;

  m.querySelectorAll('.ls-type-btn').forEach(btn => {
    btn.onclick = () => {
      m.querySelectorAll('.ls-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedType = btn.dataset.type;
      const t = LS_GRAFT_TYPES.find(x => x.id === selectedType);
      m.querySelector('[data-activetype]').textContent = t ? t.label : '';
    };
  });

  /* keyboard type shortcuts while modal is open */
  const keyHandler = e => {
    const t = LS_GRAFT_TYPES.find(x => x.key === e.key);
    if(t){ m.querySelector(`[data-type="${t.id}"]`)?.click(); }
    if(e.key === 'Enter' && selectedType) m.querySelector('[data-confirm]')?.click();
    if(e.key === 'Escape'){ m.remove(); document.removeEventListener('keydown', keyHandler); onCancel && onCancel(); }
  };
  document.addEventListener('keydown', keyHandler);

  m.querySelector('[data-cancel]').onclick = () => {
    m.remove(); document.removeEventListener('keydown', keyHandler); onCancel && onCancel();
  };

  m.querySelector('[data-confirm]').onclick = () => {
    if(!selectedType){ toast('Pick a connection type first.'); return; }
    const why = m.querySelector('.ls-relate-why').value.trim();
    if(!why){ m.querySelector('.ls-relate-why').focus(); toast('Add a reason.'); return; }
    m.remove(); document.removeEventListener('keydown', keyHandler);
    onConfirm(selectedType, why);
  };
}

function lsCreateGraft(fromId, fromType, toId, toType, graftType, why){
  /* if both are promoted tree nodes → write to treeGrafts */
  const fromNodeId = fromType === 'node' ? fromId : lsChipById(fromId)?.promotedToNodeId;
  const toNodeId   = toType   === 'node' ? toId   : lsChipById(toId)?.promotedToNodeId;

  if(fromNodeId && toNodeId && typeof treeAddGraft === 'function'){
    treeAddGraft(fromNodeId, toNodeId, graftType, why);
    return {kind:'tree'};
  }
  /* otherwise → lsGrafts (temporary, migrated on promotion) */
  const g = lsGraftNew(fromId, toId, graftType, why);
  return {kind:'ls', graft: g};
}

/* ---------- Check mode ---------- */

function lsCheckPanelHTML(boardId){
  lsEnsure();
  const chips = S.lsChips.filter(c => c.boardId === boardId && !c.inTray);
  const placed = chips.filter(c => S.lsPlacements.some(p => p.boardId === boardId && p.cardId === c.id));
  const green  = placed.filter(c => c.tls === 'green');
  const amber  = placed.filter(c => c.tls === 'amber');
  const red    = placed.filter(c => c.tls === 'red');
  const untagged = placed.filter(c => !c.tls);
  const questions = S.lsQuestions.filter(q => {
    return placed.some(c => c.id === q.cardId) || false;
  });
  const answered = questions.filter(q => q.answeredAt);

  return `<div class="ls-check-panel">
    <div class="ls-check-summary">
      <div class="ls-check-stat"><span class="ls-tls-dot" style="background:var(--sage)"></span>${green.length} core</div>
      <div class="ls-check-stat"><span class="ls-tls-dot" style="background:var(--gold,#c8a050)"></span>${amber.length} supporting</div>
      <div class="ls-check-stat"><span class="ls-tls-dot" style="background:var(--rose,#c87070)"></span>${red.length} peripheral</div>
      ${untagged.length ? `<div class="ls-check-stat muted">${untagged.length} untagged</div>` : ''}
    </div>
    <div class="ls-check-stat muted" style="margin:8px 0">${answered.length} of ${questions.length} questions answered</div>
    <hr class="faint">
    <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px">
      <button class="btn sm" data-send-deck>Send green + amber to Study Deck</button>
      <button class="btn ghost sm" data-snapshot>Commit layout snapshot</button>
    </div>
    <div class="ls-check-chips" style="margin-top:12px;display:flex;flex-direction:column;gap:4px">
      ${placed.map(c => `
        <div class="ls-check-chip-row row" style="gap:8px;align-items:center">
          <span class="ls-tls-dot" style="background:${c.tls==='green'?'var(--sage)':c.tls==='amber'?'var(--gold,#c8a050)':c.tls==='red'?'var(--rose,#c87070)':'var(--faint)'}"></span>
          <span style="flex:1;font-size:.8rem">${esc(c.text.slice(0,50))}</span>
          ${!c.promotedToNodeId && !c.inTray
            ? `<button class="btn ghost sm ls-check-deck-one" data-cid="${esc(c.id)}" title="Send to Study Deck">→ Deck</button>`
            : `<span class="faint" style="font-size:.72rem">${c.promotedToNodeId ? 'in Tree' : ''}</span>`}
        </div>`).join('')}
    </div>
  </div>`;
}

function bindCheckPanel(panelEl, boardId){
  if(!panelEl) return;

  function refresh(){ panelEl.innerHTML = lsCheckPanelHTML(boardId); rebind(); }

  function rebind(){
    panelEl.querySelector('[data-send-deck]')?.addEventListener('click', () => {
      lsEnsure();
      const chips = S.lsChips.filter(c => c.boardId === boardId && (c.tls === 'green' || c.tls === 'amber') && !c.inTray);
      let sent = 0;
      chips.forEach(c => {
        if(typeof suggestStudyCard !== 'function') return;
        suggestStudyCard({
          front: c.text,
          sourceType: 'learningStudio',
          sourceId: c.id,
          sourceGo: '#/studio/' + boardId,
        });
        sent++;
      });
      toast(`${sent} card${sent !== 1 ? 's' : ''} queued for Study Deck.`);
    });

    panelEl.querySelector('[data-snapshot]')?.addEventListener('click', () => {
      lsSnapshotCommit(boardId);
      toast('Layout snapshot saved.');
    });

    panelEl.querySelectorAll('.ls-check-deck-one').forEach(btn => {
      btn.onclick = () => {
        const chip = lsChipById(btn.dataset.cid); if(!chip) return;
        if(typeof suggestStudyCard === 'function'){
          suggestStudyCard({front: chip.text, sourceType:'learningStudio', sourceId:chip.id, sourceGo:'#/studio/'+boardId});
          toast('Added to Study Deck inbox.');
        }
      };
    });
  }

  refresh();
  return { refresh };
}

/* ---------- mode panel mount point ----------
   Called from 19-ls-e-page.js when mode changes or selection changes.
   Returns an API the page can use. */

function lsMountModePanel(panelEl, boardId, mode, canvasApi){
  panelEl.innerHTML = '';
  let api = null;

  if(mode === 'ask'){
    panelEl.innerHTML = lsAskPanelHTML(boardId, null, null);
    api = bindAskPanel(panelEl, boardId, canvasApi);
  } else if(mode === 'shoot'){
    panelEl.innerHTML = lsShootPanelHTML(boardId, null, null);
    api = bindShootPanel(panelEl, boardId, canvasApi);
  } else if(mode === 'check'){
    api = bindCheckPanel(panelEl, boardId);
  } else if(mode === 'relate'){
    panelEl.innerHTML = lsRelatePanelHTML(null);
  } else if(mode === 'chunk'){
    panelEl.innerHTML = `<div class="ls-panel-empty muted">Select chips and mark importance: <span style="color:var(--sage)">●</span> core, <span style="color:var(--gold,#c8a050)">●</span> supporting, <span style="color:var(--rose,#c87070)">●</span> peripheral. Use Ask panel (mode 3) to set TLS per chip.</div>`;
  } else {
    panelEl.innerHTML = '';
  }

  return api;
}

/* ---------- selection → panel update ---------- */
function lsOnSelectionChange(panelEl, boardId, mode, placementIds, canvasApi, panelApi){
  if(!placementIds.length){
    if(mode === 'ask')  { panelEl.innerHTML = lsAskPanelHTML(boardId, null, null); bindAskPanel(panelEl, boardId, canvasApi); }
    if(mode === 'shoot'){ panelEl.innerHTML = lsShootPanelHTML(boardId, null, null); bindShootPanel(panelEl, boardId, canvasApi); }
    return;
  }
  const pid = placementIds[0];
  const p = S.lsPlacements.find(x => x.id === pid); if(!p) return;
  if(mode === 'ask')  panelApi?.refresh?.(p.cardId, p.cardType);
  if(mode === 'shoot') panelApi?.refresh?.(p.cardId, p.cardType);
}

/* ---------- relate mode wiring (called from page) ---------- */
function bindRelateMode(canvasRoot, boardId, panelEl, canvasApi, onGraftCreated){
  let fromId = null, fromType = null;

  function reset(){
    fromId = null; fromType = null;
    panelEl.innerHTML = lsRelatePanelHTML(null);
    /* remove visual indicator */
    canvasRoot.querySelectorAll('.ls-card--relate-from').forEach(el => el.classList.remove('ls-card--relate-from'));
  }

  function onCardClick(e){
    const card = e.target.closest('.ls-card'); if(!card) return;
    e.stopPropagation();
    const cardId   = card.dataset.cid;
    const cardType = card.dataset.ctype;

    if(!fromId){
      /* first click: set source */
      fromId = cardId; fromType = cardType;
      panelEl.innerHTML = lsRelatePanelHTML(fromId);
      card.classList.add('ls-card--relate-from');
    } else {
      if(cardId === fromId){ reset(); return; }
      /* second click: open confirm popover */
      const toId = cardId, toType = cardType;
      const fId = fromId, fType = fromType;
      reset();
      lsRelateConfirmPopover(fId, fType, toId, toType,
        (graftType, why) => {
          lsCreateGraft(fId, fType, toId, toType, graftType, why);
          canvasApi.repaint();
          onGraftCreated && onGraftCreated(graftType);
          toast('Connection saved.');
        },
        () => reset()
      );
    }
  }

  const keyHandler = e => { if(e.key === 'Escape') reset(); };
  canvasRoot.addEventListener('click', onCardClick, true);
  document.addEventListener('keydown', keyHandler);

  return {
    destroy(){
      canvasRoot.removeEventListener('click', onCardClick, true);
      document.removeEventListener('keydown', keyHandler);
    }
  };
}
