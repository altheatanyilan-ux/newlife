/* ============================================================
   THE STUDY DECK — the room.
   ============================================================ */
const STUDY_VIEWS = [['decks','The decks'], ['browse','Every card'], ['stats','How it is going']];
const studyView = () => S._studyView || 'decks';

routes.study = function(root, params){
  studyState();
  if(params && params[0] === 'session'){
    /* the queue is a sitting like any other, and it is the one people most
       often do not think of as time spent */
    try { const q = S._study;
      if(q && !q.done && typeof timeAutoStart === 'function') timeAutoStart({categoryId:'study',
        feature:'study', what:'the review queue'});
      else if((!q || q.done) && typeof timeAutoStop === 'function') timeAutoStop('study');
    } catch(e){}
    root.innerHTML = `<div class="page sd-page">${studySessionHTML()}</div>`;
    bindStudySession(root); return; }
  registerPageEntry({pageName:'Study Deck', addLabel:'Make a card', defaultEntryType:'card', prefilledFields:{}, options:[
    {icon:'📌', label:'A card', desc:'Something worth having by heart.', run:()=>openRememberModal({sourceType:'manual'})},
    {icon:'📚', label:'A deck', desc:'A place to file a kind of thing.', run:()=>openDeckModal()},
    {icon:'📥', label:'A deck from an AI', desc:'Ask for one in the format, paste it back.', run:()=>openStudyImport()}]});
  const v = studyView();
  root.innerHTML = `<div class="page sd-page">
    <h1 class="serif">Study Deck</h1>
    <p class="muted sd-lede">The memory layer. Anything anywhere in the house — an insight in a journal entry, a quote off a shelf, a grammar point, a voicing — becomes a card with one press, and the card remembers where it came from. The scheduling is SM-2: a thing you got right you see later, a thing you missed you see tomorrow.</p>
    <div class="sd-views">${STUDY_VIEWS.map(([k, n]) =>
      `<button class="sd-view${v === k ? ' on' : ''}" data-sdview="${k}">${esc(n)}</button>`).join('')}</div>
    ${studyInboxHTML()}
    <div class="sd-body">${v === 'browse' ? studyBrowseHTML() : v === 'stats' ? studyStatsHTML() : studyDecksHTML()}</div>
  </div>`;
  bindStudyPage(root);
};

function studyDecksHTML(){
  const due = studyDue(null).length;
  return `<div class="sd-begin">
      <div class="sd-begin-n"><b>${due}</b> ${due === 1 ? 'card' : 'cards'} due today</div>
      ${due ? `<button class="btn primary" id="sdBegin">Begin a session</button>`
        : `<div class="faint">Nothing waiting. The next one comes round when it comes round.</div>`}
      <span class="sd-flame" title="${studyStreak()} consecutive days">🔥 ${studyStreak()}</span>
    </div>
    <div class="sd-grid">${studyTopDecks().map(d => {
      const n = studyDeckCount(d.id);
      const kids = studyDecks().filter(k => k.parentId === d.id);
      const pct = n.total ? Math.round(n.graduated / n.total * 100) : 0;
      return `<div class="sd-deck${n.due ? ' due' : ''}" style="--c:${esc(d.color)}">
        <button class="sd-gear" data-sdgear="${esc(d.id)}" title="what this deck is and how it is run">⚙</button>
        <button class="sd-deck-face" data-sddeck="${esc(d.id)}" ${n.due ? '' : 'disabled'}
          title="${n.due ? 'study this deck' : 'nothing due in here'}">
          <span class="sd-deck-e">${esc(d.emoji)}</span>
          <span class="sd-deck-n serif">${esc(d.name)}</span>
          <span class="sd-deck-c mono">${n.due} due · ${n.total} in all</span>
          <span class="sd-deck-bar"><i style="width:${pct}%"></i></span>
        </button>
        ${kids.length ? `<div class="sd-kids">${kids.map(k => { const kn = studyDeckCount(k.id);
          return `<div class="sd-kidrow">
            <button class="sd-kid" data-sddeck="${esc(k.id)}" ${kn.due ? '' : 'disabled'}>
              ${esc(k.emoji)} ${esc(k.name)} <span class="mono">${kn.due}/${kn.total}</span></button>
            <button class="sd-gear sm" data-sdgear="${esc(k.id)}" title="open this one">⚙</button>
          </div>`; }).join('')}</div>` : ''}
        <div class="sd-deck-about">${esc(d.about || '')}${studyDeckRuleSay(d)}</div>
      </div>`; }).join('')}
      <button class="sd-deck sd-newdeck" id="sdNewDeck"><span class="sd-deck-e">＋</span>
        <span class="sd-deck-n serif">A deck of your own</span></button>
      <button class="sd-deck sd-newdeck" id="sdImport"><span class="sd-deck-e">📥</span>
        <span class="sd-deck-n serif">A deck from an AI</span>
        <span class="sd-deck-c mono">ask for one, paste it back</span></button>
    </div>
    <div class="sd-stats-line mono">${studyCards().filter(c => c.status !== 'inbox').length} cards · ${
      studyCards().filter(c => studyMaturity(c) === 'mature' || c.status === 'graduated').length} matured · ${
      studyState().stats.reviews} reviews all told</div>`;
}

/* A deck that runs by its own rules says so on its face. An override you
   cannot see from the shelf is an override you forget you set, and then the
   deck that stopped giving you new cards is a mystery rather than a decision. */
function studyDeckRuleSay(d){
  const st = studyState();
  const said = [];
  if(d.newPerDay != null && d.newPerDay !== st.settings.newPerDay)
    said.push(d.newPerDay === 0 ? 'no new cards' : `${d.newPerDay} new a day`);
  if(d.reviewsPerDay != null && d.reviewsPerDay !== st.settings.reviewsPerDay)
    said.push(`${d.reviewsPerDay} reviews a day`);
  if(d.graduateAt != null && d.graduateAt !== st.settings.graduateAt)
    said.push(`graduates past ${d.graduateAt}d`);
  if(d.order && d.order !== st.settings.order)
    said.push((STUDY_ORDERS.find(o => o[0] === d.order) || [,''])[1].toLowerCase());
  return said.length ? `<span class="sd-deck-rule mono">${esc(said.join(' · '))}</span>` : '';
}

/* Cards the house suggested. They wait here until they are looked at, because
   a system that quietly adds work to tomorrow is one you stop trusting. */
function studyInboxHTML(){
  const box = studyInbox();
  if(!box.length) return '';
  return `<div class="sd-inbox">
    <div class="row between" style="align-items:baseline">
      <span class="k">📥 ${box.length} suggested ${box.length === 1 ? 'card' : 'cards'}</span>
      <button class="pl-mini" id="sdAcceptAll">take them all</button></div>
    <p class="muted" style="font-size:.82rem">Made from what you did elsewhere. Nothing enters the rotation until you say so.</p>
    <div class="stack" style="gap:6px;margin-top:8px">${box.slice(0, 8).map(c => `
      <div class="sd-inrow" data-sdin="${esc(c.id)}">
        <span class="sd-in-deck mono">${esc((studyDeck(c.deckId) || {emoji:'▫'}).emoji)}</span>
        <span class="sd-in-body">
          <span class="sd-in-f">${esc((c.front || '').slice(0, 120))}</span>
          <span class="sd-in-b mono">${esc((c.back || '').slice(0, 90))}</span></span>
        <span class="row" style="gap:4px">
          <button class="tbtn" data-sdaccept="${esc(c.id)}">keep</button>
          <button class="tbtn" data-sdedit="${esc(c.id)}">edit</button>
          <button class="del-x inline" data-sddismiss="${esc(c.id)}" title="not this one">×</button></span>
      </div>`).join('')}
      ${box.length > 8 ? `<div class="faint mono" style="font-size:.72rem">…and ${box.length - 8} more</div>` : ''}</div>
  </div>`;
}

/* ---------- every card ---------- */
function studyFilter(){ return S._sdFilter = S._sdFilter || {deck:'', type:'', status:'', q:''}; }
function studyFiltered(){
  const f = studyFilter(), q = (f.q || '').toLowerCase();
  return studyCards().filter(c => {
    if(c.status === 'inbox') return false;
    if(f.deck && !studyDeckIds(f.deck).includes(c.deckId)) return false;
    if(f.type && c.type !== f.type) return false;
    if(f.status && c.status !== f.status) return false;
    if(q && !`${c.front} ${c.back} ${c.tags.join(' ')}`.toLowerCase().includes(q)) return false;
    return true;
  }).sort((a, b) => (a.due || '').localeCompare(b.due || ''));
}
function studyBrowseHTML(){
  const f = studyFilter();
  const rows = studyFiltered();
  const pick = (id, val, opts, blank) => `<select class="sel sm" id="${id}"><option value="">${blank}</option>${
    opts.map(([v, n]) => `<option value="${v}" ${val === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
  /* a family is shown as one thing, with its deeper cards folded under the
     card they came from */
  const seen = new Set();
  return `<div class="pn-toolbar">
      ${pick('sdfDeck', f.deck, studyDecks().map(d => [d.id, `${d.emoji} ${d.name}`]), 'every deck')}
      ${pick('sdfType', f.type, STUDY_TYPES.map(t => [t[0], t[1]]), 'every kind')}
      ${pick('sdfStatus', f.status, [['active','In rotation'],['suspended','Paused'],['graduated','Mastered']], 'every state')}
      <input class="inp sm pn-search" id="sdfQ" placeholder="front, back, tag" value="${esc(f.q || '')}">
      <span class="grow"></span>
      <span class="mono faint">${rows.length} of ${studyCards().filter(c => c.status !== 'inbox').length}</span>
      <button class="btn sm primary" id="sdAdd">＋ card</button>
    </div>
    ${rows.length ? `<div class="stack" style="gap:6px">${rows.map(c => {
      if(c.familyId && seen.has(c.familyId) && c.familyRole !== 'recall') return '';
      const fam = c.familyId ? studyFamily(c.id).filter(x => x.id !== c.id) : [];
      if(c.familyId) seen.add(c.familyId);
      return studyRowHTML(c) + (fam.length ? `<div class="sd-famrows">${fam.map(studyRowHTML).join('')}</div>` : '');
    }).join('')}</div>` : `<div class="empty">Nothing matches. Widen the filter, or press 📌 on something.</div>`}`;
}
function studyRowHTML(c){
  const d = studyDeck(c.deckId);
  const role = STUDY_ROLES.find(r => r[0] === c.familyRole);
  const last = c.history.length ? c.history[c.history.length - 1] : null;
  return `<div class="sd-row sd-${esc(c.status)}" data-sdrow="${esc(c.id)}">
    <div class="sd-row-top">
      <span class="sd-row-f serif">${esc((c.front || '').replace(/\s+/g, ' ').slice(0, 110))}</span>
      <span class="sd-row-d mono" style="--c:${esc(d ? d.color : 'var(--line)')}">${esc(d ? d.emoji + ' ' + d.name : 'unfiled')}</span>
    </div>
    <div class="sd-row-meta mono">
      ${c.status === 'graduated' ? 'mastered' : c.status === 'suspended' ? 'paused'
        : `due ${esc(c.due === today() ? 'today' : fmtDate(c.due, 'short'))}`}
      · ${esc(studySaid(c.interval))} · ease ${c.ease.toFixed(2)}
      · ${c.history.length} review${c.history.length === 1 ? '' : 's'}${last ? ` · last ${esc(fmtDate((last.date || '').slice(0, 10), 'short'))}` : ''}
      ${role ? ` · <span class="sd-role">${esc(role[1].toLowerCase())}</span>` : ''}
      ${c.sourceLabel ? ` · ${esc(c.sourceLabel)}` : ''}
    </div>
    <div class="sd-row-tools">
      <button class="tbtn" data-sdedit="${esc(c.id)}">edit</button>
      <button class="tbtn" data-sdpause="${esc(c.id)}">${c.status === 'suspended' ? 'resume' : 'pause'}</button>
      ${c.status === 'graduated' ? `<button class="tbtn" data-sdungrad="${esc(c.id)}">bring it back</button>` : ''}
      ${!c.familyId || c.familyRole === 'recall' ? `<button class="tbtn" data-sddeepen="${esc(c.id)}" title="add an application and a compare card">＋ deeper</button>` : ''}
      ${c.sourceGo ? `<a class="tbtn" href="${esc(c.sourceGo)}">source</a>` : ''}
      <button class="del-x inline" data-sddel="${esc(c.id)}" title="delete this card">×</button>
    </div>
  </div>`;
}

/* ---------- how it is going ---------- */
function studyStatsHTML(){
  const st = studyState();
  const buckets = {};
  STUDY_MATURITY.forEach(([k]) => buckets[k] = 0);
  studyCards().filter(c => c.status !== 'inbox').forEach(c => buckets[studyMaturity(c)]++);
  const total = sum(Object.values(buckets)) || 1;
  const days = Array.from({length:90}, (_, i) => addDays(today(), i - 89));
  const most = Math.max(1, ...days.map(d => +st.stats.perDay[d] || 0));
  return `<div class="grid c2" style="gap:16px">
    <div class="card no-tilt">
      <div class="k">The streak</div>
      <div class="sd-bigflame">🔥 <b>${studyStreak()}</b><small>day${studyStreak() === 1 ? '' : 's'} running</small></div>
      <div class="mono faint">longest ${st.stats.longest || 0} · ${st.stats.reviews || 0} reviews all told</div>
    </div>
    <div class="card no-tilt">
      <div class="k">Where the cards are</div>
      <div class="sd-bars">${STUDY_MATURITY.map(([k, name, col]) => `
        <div class="sd-bar-row"><span class="sd-bar-n">${esc(name)}</span>
          <span class="bar" style="--c:${col}"><i style="width:${Math.round(buckets[k] / total * 100)}%"></i></span>
          <span class="mono">${buckets[k]}</span></div>`).join('')}</div>
      <p class="muted" style="font-size:.78rem;margin-top:8px">A card is mature once it is on a month's cycle, and it graduates out of the queue past ${st.settings.graduateAt} days — unless the deck it is in says otherwise. Graduating is not mastery; it is the point at which a daily list is the wrong place for it.</p>
    </div>
    <div class="card no-tilt span2">
      <div class="k">Ninety days</div>
      <div class="sd-heat">${days.map(d => { const n = +st.stats.perDay[d] || 0;
        const lvl = !n ? 0 : n < most * 0.25 ? 1 : n < most * 0.6 ? 2 : 3;
        return `<i class="sd-hd l${lvl}" title="${esc(fmtDate(d, 'med'))}${n ? ` — ${n} reviewed` : ' — nothing'}"></i>`; }).join('')}</div>
    </div>
    <div class="card no-tilt span2">
      <div class="k">How it is set up</div>
      <p class="muted" style="font-size:.78rem">What every deck does unless it says otherwise. A deck of its own mind is set from its own ⚙.</p>
      <div class="sd-settings">
        <label class="pd-q"><span class="k">new cards a day</span><input class="inp mono" type="number" id="sdSetNew" min="0" max="200" value="${st.settings.newPerDay}"></label>
        <label class="pd-q"><span class="k">reviews a day</span><input class="inp mono" type="number" id="sdSetRev" min="0" max="999" value="${st.settings.reviewsPerDay}"></label>
        <label class="pd-q"><span class="k">graduates past</span><input class="inp mono" type="number" id="sdSetGrad" min="30" max="3650" value="${st.settings.graduateAt}"> days</label>
        <label class="pd-q"><span class="k">a gap is</span><select class="sel" id="sdSetCloze">
          <option value="type" ${st.settings.clozeInput === 'type' ? 'selected' : ''}>typed</option>
          <option value="multiple_choice" ${st.settings.clozeInput === 'multiple_choice' ? 'selected' : ''}>chosen</option></select></label>
        <label class="pd-q"><span class="k">order</span><select class="sel" id="sdSetOrder">
          ${STUDY_ORDERS.map(([v, n]) =>
            `<option value="${v}" ${st.settings.order === v ? 'selected' : ''}>${esc(n.toLowerCase())}</option>`).join('')}</select></label>
        <label class="pd-q"><span class="k">show what each grade would do</span>
          <input type="checkbox" id="sdSetPrev" ${st.settings.showPreview ? 'checked' : ''}></label>
      </div>
    </div>
  </div>`;
}

function bindStudyPage(root){
  const st = studyState();
  const redraw = () => { saveNow(); rerender(); };
  $$('[data-sdview]', root).forEach(b => b.onclick = () => { S._studyView = b.dataset.sdview; sound('click'); rerender(); });
  const begin = root.querySelector('#sdBegin'); if(begin) begin.onclick = () => startStudySession(null);
  $$('[data-sddeck]', root).forEach(b => b.onclick = () => startStudySession(b.dataset.sddeck));
  const nd = root.querySelector('#sdNewDeck'); if(nd) nd.onclick = () => openDeckModal();
  const im = root.querySelector('#sdImport'); if(im) im.onclick = () => openStudyImport();
  $$('[data-sdgear]', root).forEach(b => b.onclick = ev => { ev.stopPropagation();
    openDeckModal(studyDeck(b.dataset.sdgear)); });
  const add = root.querySelector('#sdAdd'); if(add) add.onclick = () => openRememberModal({sourceType:'manual'});

  /* the inbox */
  $$('[data-sdaccept]', root).forEach(b => b.onclick = () => { acceptStudyCard(b.dataset.sdaccept); sound('success'); rerender(); });
  $$('[data-sddismiss]', root).forEach(b => b.onclick = () => { dismissStudyCard(b.dataset.sddismiss); sound('click'); rerender(); });
  const all = root.querySelector('#sdAcceptAll');
  if(all) all.onclick = () => { studyInbox().forEach(c => acceptStudyCard(c.id)); sound('success'); rerender(); };

  /* the browse filters */
  const f = studyFilter();
  [['#sdfDeck','deck'], ['#sdfType','type'], ['#sdfStatus','status']].forEach(([sel, key]) => {
    const n = root.querySelector(sel); if(n) n.onchange = () => { f[key] = n.value; rerender(); }; });
  const q = root.querySelector('#sdfQ');
  if(q) q.oninput = debounce(() => { f.q = q.value; const at = q.selectionStart; rerender();
    const again = document.querySelector('#sdfQ'); if(again){ again.focus(); try { again.setSelectionRange(at, at); } catch(e){} } }, 260);

  $$('[data-sdedit]', root).forEach(b => b.onclick = () => openCardEditor(b.dataset.sdedit));
  $$('[data-sdpause]', root).forEach(b => b.onclick = () => { const c = studyCard(b.dataset.sdpause); if(!c) return;
    c.status = c.status === 'suspended' ? 'active' : 'suspended'; sound('click'); redraw(); });
  $$('[data-sdungrad]', root).forEach(b => b.onclick = () => { const c = studyCard(b.dataset.sdungrad); if(!c) return;
    /* it comes back at the beginning of the long end rather than at zero:
       you did know it once, and pretending otherwise wastes a month */
    c.status = 'active'; c.interval = 21; c.due = addDays(today(), 1); sound('click'); redraw(); });
  $$('[data-sddeepen]', root).forEach(b => b.onclick = () => { const made = studyDeepen(b.dataset.sddeepen);
    if(made){ sound('success'); toast('Two deeper cards, waiting for you to finish their fronts.'); rerender(); } });
  $$('[data-sddel]', root).forEach(b => b.onclick = () => { const c = studyCard(b.dataset.sddel); if(!c) return;
    requestDelete({label: (c.front || 'this card').slice(0, 40), node: b.closest('.sd-row'), after: rerender,
      remove: () => spliceOut(st.cards, x => x.id === c.id)}); });

  /* the settings */
  const num = (sel, key, lo, hi) => { const n = root.querySelector(sel);
    if(n) n.onchange = () => { st.settings[key] = clamp(+n.value || 0, lo, hi); saveNow(); }; };
  num('#sdSetNew', 'newPerDay', 0, 200);
  num('#sdSetRev', 'reviewsPerDay', 0, 999);
  num('#sdSetGrad', 'graduateAt', 30, 3650);
  const cz = root.querySelector('#sdSetCloze'); if(cz) cz.onchange = () => { st.settings.clozeInput = cz.value; saveNow(); };
  const or = root.querySelector('#sdSetOrder'); if(or) or.onchange = () => { st.settings.order = or.value; saveNow(); };
  const pv = root.querySelector('#sdSetPrev'); if(pv) pv.onchange = () => { st.settings.showPreview = pv.checked; saveNow(); };
}

function openCardEditor(id){
  const c = studyCard(id); if(!c) return null;
  const m = openModal(`<h2>The card</h2>
    <label class="pd-q"><span class="k">front</span><textarea class="inp sd-ta" id="ceFront" rows="4">${esc(c.front)}</textarea></label>
    <label class="pd-q" style="margin-top:8px"><span class="k">back</span><textarea class="inp sd-ta" id="ceBack" rows="4">${esc(c.back)}</textarea></label>
    ${c.type === 'cloze' ? `<label class="pd-q" style="margin-top:8px"><span class="k">the answer in the gap</span>
      <input class="inp" id="ceCloze" value="${esc(c.clozeAnswer || '')}" placeholder="what belongs in {{ }}"></label>
      <label class="pd-q" style="margin-top:8px"><span class="k">or four to choose from</span>
      <input class="inp mono" id="ceOpts" value="${esc((c.clozeOptions || []).join(' '))}" placeholder="に へ で を"></label>` : ''}
    ${c.type === 'action' ? `<label class="pd-q" style="margin-top:8px"><span class="k">what to show afterwards</span>
      <textarea class="inp" id="ceRef" rows="3" placeholder="the voicing spelled out, the fingering, the answer you can check against">${esc(c.reference || '')}</textarea></label>` : ''}
    <div class="grid c2" style="gap:10px;margin-top:10px">
      <label class="pd-q"><span class="k">deck</span><select class="sel" id="ceDeck">${studyDecks().map(d =>
        `<option value="${esc(d.id)}" ${c.deckId === d.id ? 'selected' : ''}>${esc(d.emoji)} ${esc(d.name)}</option>`).join('')}</select></label>
      <label class="pd-q"><span class="k">kind</span><select class="sel" id="ceType">${STUDY_TYPES.map(([v, n]) =>
        `<option value="${v}" ${c.type === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
    </div>
    <label class="pd-q" style="margin-top:10px"><span class="k">tags</span>
      <input class="inp mono" id="ceTags" value="${esc(c.tags.join(' '))}"></label>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="ceSave">Save</button></div>`, 'narrow sd-modal');
  m.querySelector('#ceSave').onclick = () => {
    c.front = m.querySelector('#ceFront').value;
    c.back = m.querySelector('#ceBack').value;
    c.deckId = m.querySelector('#ceDeck').value;
    c.type = m.querySelector('#ceType').value;
    c.tags = m.querySelector('#ceTags').value.split(/[\s,]+/).map(x => x.replace(/^#/, '')).filter(Boolean);
    const cz = m.querySelector('#ceCloze'); if(cz) c.clozeAnswer = cz.value.trim() || null;
    const op = m.querySelector('#ceOpts');
    if(op){ const list = op.value.split(/[\s,]+/).filter(Boolean); c.clozeOptions = list.length ? list : null; }
    const rf = m.querySelector('#ceRef'); if(rf) c.reference = rf.value.trim() || null;
    /* editing a suggestion is accepting it — you would not have edited it
       otherwise, and asking twice is a click nobody wants */
    if(c.status === 'inbox'){ c.status = 'active'; c.due = today(); }
    saveNow(); m.remove(); sound('click'); rerender();
  };
  return m;
}
/* ---------- a deck, and everything you can decide about one ----------
   The four scheduling questions are per-deck and blank by default, and blank
   means "whatever the room says". That is the whole trick: a deck of two
   hundred kanji and a deck of eleven mental models want completely different
   daily limits, and asking you to set both before either works would be a
   form to fill in rather than a choice to make. So the placeholders show what
   the room currently does, and you override the one deck that needs it. */
function openDeckModal(existing){
  const st = studyState();
  const d = existing || {id:uid(), name:'', emoji:'\u{1F4D7}', color:STUDY_DECK_COLORS[0][0],
    about:'', parentId:null, isDefault:false, newPerDay:null, reviewsPerDay:null,
    graduateAt:null, order:null};
  const n = existing ? studyDeckCount(d.id) : {total:0, due:0};
  const kids = existing ? studyDecks().filter(k => k.parentId === d.id) : [];
  const m = openModal(`<h2>${existing ? esc(d.emoji + ' ' + d.name) : 'A deck of your own'}</h2>
    <div class="grid c2" style="gap:10px">
      <label class="pd-q"><span class="k">name</span><input class="inp serif-lg" id="dkName" value="${esc(d.name)}" autofocus placeholder="Law School \u00b7 Recipes"></label>
      <label class="pd-q"><span class="k">a mark for it</span><input class="inp" id="dkEmoji" value="${esc(d.emoji)}" maxlength="4"></label>
    </div>
    <label class="pd-q" style="margin-top:10px"><span class="k">what goes in it</span>
      <input class="inp" id="dkAbout" value="${esc(d.about)}" placeholder="one line"></label>
    <div class="pd-q" style="margin-top:10px"><span class="k">its colour</span>
      <div class="sd-swatches">${STUDY_DECK_COLORS.map(([c, name]) =>
        `<button class="sd-swatch${d.color === c ? ' on' : ''}" data-dkcol="${c}" style="--c:${c}"
          title="${esc(name)}" aria-label="${esc(name)}"></button>`).join('')}</div></div>
    <!-- a shelf two deep and no deeper: a deck already holding sub-decks
         cannot be filed inside a third, because nothing below that level would
         be counted, studied or found again -->
    <label class="pd-q" style="margin-top:10px"><span class="k">inside</span>
      <select class="sel" id="dkParent" ${kids.length ? 'disabled' : ''}>
        <option value="">\u2014 on its own \u2014</option>
        ${studyTopDecks().filter(x => x.id !== d.id).map(x => `<option value="${esc(x.id)}" ${d.parentId === x.id ? 'selected' : ''}>${esc(x.emoji)} ${esc(x.name)}</option>`).join('')}</select>
      ${kids.length ? `<span class="faint mono" style="font-size:.7rem">it holds ${kids.length} sub-deck${kids.length === 1 ? '' : 's'}, so it stays at the top</span>` : ''}</label>

    <details class="sd-imp-fold" style="margin-top:14px">
      <summary><span class="sc">how this deck is run</span></summary>
      <div class="sd-imp-body">
        <p class="muted" style="font-size:.8rem">Leave any of them blank and the deck follows the room. A deck of two hundred kanji and a deck of eleven mental models want different days.</p>
        <div class="sd-settings">
          ${STUDY_DECK_RULES.map(([k, label, lo, hi]) => `
            <label class="pd-q"><span class="k">${esc(label)}</span>
              <input class="inp mono" type="number" id="dk_${k}" min="${lo}" max="${hi}"
                value="${d[k] == null ? '' : d[k]}" placeholder="${st.settings[k]}"></label>`).join('')}
          <label class="pd-q"><span class="k">order</span><select class="sel" id="dkOrder">
            <option value="">as the room does</option>
            ${STUDY_ORDERS.map(([v, name]) =>
              `<option value="${v}" ${d.order === v ? 'selected' : ''}>${esc(name.toLowerCase())}</option>`).join('')}</select></label>
        </div>
      </div>
    </details>

    ${existing ? `<div class="sd-deck-foot mono">${n.total} card${n.total === 1 ? '' : 's'} in it${
      d.isDefault ? ' \u00b7 one the room came with' : ''}</div>` : ''}
    <div class="row" style="justify-content:flex-end;margin-top:14px;gap:8px">
      ${existing ? `<button class="btn sm ghost danger" id="dkDel">Throw it away</button><span class="grow"></span>` : ''}
      <button class="btn primary" id="dkSave">${existing ? 'Save' : 'Make it'}</button></div>`, 'narrow sd-modal');

  let color = d.color;
  $$('[data-dkcol]', m).forEach(b => b.onclick = () => { color = b.dataset.dkcol;
    $$('[data-dkcol]', m).forEach(x => x.classList.toggle('on', x === b)); });

  m.querySelector('#dkSave').onclick = () => {
    const name = m.querySelector('#dkName').value.trim();
    if(!name){ m.querySelector('#dkName').focus(); return; }
    /* an empty box is not zero: zero new cards a day is a real instruction and
       has to stay tellable from "you never said" */
    const num = k => { const v = m.querySelector('#dk_' + k).value.trim(); return v === '' ? null : +v; };
    Object.assign(d, {name, emoji: m.querySelector('#dkEmoji').value.trim() || '\u{1F4D7}', color,
      about: m.querySelector('#dkAbout').value.trim(),
      parentId: kids.length ? null : (m.querySelector('#dkParent').value || null),
      order: m.querySelector('#dkOrder').value || null});
    STUDY_DECK_RULES.forEach(([k, , lo, hi]) => { const v = num(k); d[k] = v == null ? null : clamp(v, lo, hi); });
    if(!existing) st.decks.push(studyDeckDefaults(d));
    saveNow(); m.remove(); sound('success'); rerender();
  };
  const del = m.querySelector('#dkDel');
  if(del) del.onclick = () => { m.remove(); openDeckRemoveModal(d.id); };
  return m;
}

/* Throwing a deck away asks the one question that matters, which is not "are
   you sure" \u2014 it is what happens to the cards. Moving them is the default and
   the destination is named out loud; deleting them with the deck is possible
   and has to be chosen. "Are you sure" teaches you to press yes without
   reading; naming the consequence does not. */
function openDeckRemoveModal(id){
  const st = studyState();
  const d = studyDeck(id); if(!d) return null;
  const ids = studyDeckIds(id);
  const kids = studyDecks().filter(k => k.parentId === id);
  const held = st.cards.filter(c => ids.includes(c.deckId)).length;
  const rest = studyDecks().filter(x => !ids.includes(x.id));
  if(!rest.length){
    toast('That is the only deck you have, and a card has to be filed somewhere.');
    return null;
  }
  const m = openModal(`<h2>Throw away ${esc(d.emoji + ' ' + d.name)}?</h2>
    <p class="muted" style="font-size:.86rem">${kids.length
      ? `The ${kids.length} deck${kids.length === 1 ? '' : 's'} inside it go too \u2014 ${esc(kids.map(k => k.name).join(', '))}. `
      : ''}${held ? `${held} card${held === 1 ? ' is' : 's are'} filed in ${kids.length ? 'them' : 'it'}.`
        : 'There is nothing in it.'}</p>
    ${held ? `<label class="pd-q" style="margin-top:10px"><span class="k">where the cards go</span>
      <select class="sel" id="dkMove">${rest.map(x =>
        `<option value="${esc(x.id)}" ${x.id === studyHomeId(rest) ? 'selected' : ''}>${esc(x.emoji)} ${esc(x.name)}</option>`).join('')}</select></label>
    <label class="sd-family" style="margin-top:10px"><input type="checkbox" id="dkBurn">
      <span>Delete the cards as well<em>they do not come back \u2014 use this only for a deck you never meant to make</em></span></label>` : ''}
    ${d.isDefault ? `<p class="muted" style="font-size:.78rem;margin-top:10px">This is one of the decks the room came with. It stays gone: it is remembered as retired rather than handed back to you on the next load.</p>` : ''}
    <div class="row" style="justify-content:flex-end;margin-top:14px;gap:8px">
      <button class="btn sm ghost" id="dkNo">Keep it</button>
      <button class="btn primary danger" id="dkYes">Throw it away</button></div>`, 'narrow sd-modal');
  m.querySelector('#dkNo').onclick = () => m.remove();
  m.querySelector('#dkYes').onclick = () => {
    const move = m.querySelector('#dkMove');
    const burn = m.querySelector('#dkBurn');
    const to = move ? move.value : null;
    const res = removeStudyDeck(id, {moveTo: to, deleteCards: burn ? burn.checked : false});
    m.remove();
    if(!res.ok){ toast(`It stays: ${res.why}.`); return; }
    sound('click');
    toast(res.deleted ? `Gone, with ${res.deleted} card${res.deleted === 1 ? '' : 's'}.`
      : res.moved ? `Gone. ${res.moved} card${res.moved === 1 ? '' : 's'} moved to ${studyDeckName(to || studyHomeId())}.`
      : 'Gone.');
    rerender();
  };
  return m;
}

/* ---------- what the rest of the house sees ----------
   A queue nobody can see is a queue nobody clears, so the day says how many
   are waiting. It says nothing at all when the room has never been opened —
   a page offering to study a deck you have never made is noise. */
function studyTodayHTML(T){
  if(!S.study || !Array.isArray(S.study.cards) || !S.study.cards.length) return '';
  const due = studyDue(null).length;
  const box = studyInbox().length;
  const streak = studyStreak();
  if(!due && !box) return `<div class="sd-today quiet">
    <span class="mono">Nothing to review today${streak ? ` · 🔥 ${streak}` : ''}</span>
    <a class="btn sm ghost" href="#/study">the decks</a></div>`;
  return `<div class="sd-today">
    <span class="sd-today-n"><b>${due}</b> ${due === 1 ? 'card' : 'cards'} to review${
      box ? ` · ${box} suggested` : ''}</span>
    ${streak ? `<span class="mono sd-today-s">🔥 ${streak}</span>` : ''}
    <span class="grow"></span>
    ${due ? `<button class="btn sm primary" id="sdFive">five minutes</button>` : ''}
    <a class="btn sm ghost" href="#/study">the decks</a>
  </div>`;
}
/* Five minutes is about ten cards, at the speed anybody actually answers
   them. It is a different button from "begin a session" because the whole
   difficulty with a review queue is the days you do not have an hour. */
function startShortStudy(){
  const q = studyQueue(null).slice(0, 10);
  if(!q.length){ toast('Nothing due.'); return false; }
  S._study = {queue:q.map(c => c.id), at:0, shown:false, deckId:null,
    started:Date.now(), tally:{again:0, hard:0, good:0, easy:0}, done:null, typed:''};
  navigate('#/study/session');
  return true;
}
/* what the weekly review wants to know about the cards */
function studyReviewLines(from, to){
  if(!S.study || !Array.isArray(S.study.cards)) return [];
  const st = studyState();
  const n = sum(Object.keys(st.stats.perDay).filter(d => d >= from && d <= to).map(d => +st.stats.perDay[d] || 0));
  const out = [];
  if(n) out.push(`${n} cards reviewed.`);
  const made = st.cards.filter(c => (c.createdAt || '').slice(0, 10) >= from && (c.createdAt || '').slice(0, 10) <= to).length;
  if(made) out.push(`${made} new ${made === 1 ? 'card' : 'cards'} kept.`);
  const grad = st.cards.filter(c => c.status === 'graduated').length;
  if(grad) out.push(`${grad} mastered and out of the queue.`);
  const streak = studyStreak();
  if(streak >= 3) out.push(`A ${streak}-day streak.`);
  /* the useful warning is not "you are behind", it is which deck is running
     away from you — a backlog is always one deck long before it is four */
  const behind = studyTopDecks().map(d => ({d, n: studyDeckCount(d.id).due}))
    .filter(x => x.n >= 20).sort((a, b) => b.n - a.n)[0];
  if(behind) out.push(`${behind.d.name} has ${behind.n} waiting — that one is getting away.`);
  return out;
}
