/* ============================================================
   THE STUDY DECK — options, custom study and filtered decks, the card's
   own history, shortcuts, and the small things around a review: the
   scratchpad, looking a word up in your own collection, a gamepad.
   And the doors the rest of the house knocks on: "Remember this", the
   line on Today, the week's review.
   ============================================================ */

/* ---------- deck options ---------- */
function sdOptionsDialog(deckId){
  const d = SD.decks.get(deckId); if(!d) return;
  if(d.isFiltered){ sdFilteredDialog(deckId); return; }
  const p = sdPreset(d.presetId);
  const presets = [...SD.presets.values()];
  const users = pid => sdDecks().filter(x => x.presetId === pid && !x.isFiltered).length;
  const num = (k, label, step, hint) => `<label class="sx-opt"><span>${label}${hint ? `<small>${hint}</small>` : ''}</span><input class="inp" type="number" step="${step || 1}" data-po="${k}" value="${p[k]}"></label>`;
  const steps = (k, label) => `<label class="sx-opt"><span>${label}<small>minutes, e.g. 1 10 (1440 = a day)</small></span><input class="inp" data-pos="${k}" value="${(p[k] || []).join(' ')}"></label>`;
  const sel = (k, label, opts) => `<label class="sx-opt"><span>${label}</span><select class="sel" data-po="${k}">${opts.map(([v, n]) => `<option value="${v}"${String(p[k]) === String(v) ? ' selected' : ''}>${n}</option>`).join('')}</select></label>`;
  const chk = (k, label, hint) => `<label class="sx-opt chk"><input type="checkbox" data-poc="${k}"${p[k] ? ' checked' : ''}><span>${label}${hint ? `<small>${hint}</small>` : ''}</span></label>`;
  openModal(`<h2 class="serif">Options · ${esc(d.name)}</h2>
    <div class="sx-row"><label>Preset <select class="sel" id="sxPreset">${presets.map(x => `<option value="${x.id}"${x.id === p.id ? ' selected' : ''}>${esc(x.name)} (${users(x.id)})</option>`).join('')}</select></label>
      <button class="tbtn" id="sxPresetNew">New</button><button class="tbtn" id="sxPresetClone">Clone</button><button class="tbtn" id="sxPresetRen">Rename</button></div>
    <div class="sx-opts">
      <h3>Daily limits</h3>${num('newPerDay', 'New cards a day')}${num('revPerDay', 'Maximum reviews a day')}${chk('newIgnoreRevLimit', 'New cards ignore the review limit')}
      <h3>New cards</h3>${steps('learnSteps', 'Learning steps')}${sel('newGather', 'Gather order', [['deck', 'Deck'], ['position', 'Position'], ['random', 'Random notes']])}
        ${sel('newSort', 'Sort order', [['gather', 'As gathered'], ['template', 'Card template, then gather'], ['random', 'Random']])}
        ${num('graduatingIvl', 'Graduating interval', 1, 'days (SM-2)')}${num('easyIvl', 'Easy interval', 1, 'days (SM-2)')}
      <h3>Lapses</h3>${steps('relearnSteps', 'Relearning steps')}${num('leechThreshold', 'Leech threshold', 1, 'lapses')}
        ${sel('leechAction', 'Leech action', [['tag', 'Tag only'], ['suspend', 'Suspend the card']])}${num('minIvl', 'Minimum interval', 1, 'days')}${num('lapseNewIvl', 'New interval', 0.05, 'of the old one (SM-2)')}
      <h3>Display order</h3>${sel('newMix', 'New and reviews', [['mix', 'Mixed'], ['after', 'New after reviews'], ['before', 'New before reviews']])}
        ${sel('interdayMix', 'Learning across days', [['mix', 'With reviews'], ['after', 'After reviews'], ['before', 'Before reviews']])}
        ${sel('revSort', 'Review order', [['due', 'Due date'], ['retrievability', 'Least likely to be remembered first'], ['interval', 'Shortest interval first'], ['ease', 'Hardest first'], ['random', 'Random']])}
      <h3>Burying</h3>${chk('buryNew', 'Bury new siblings')}${chk('buryReview', 'Bury review siblings')}${chk('buryInterday', 'Bury learning siblings across days')}
      <h3>Scheduling</h3>${sel('algorithm', 'Algorithm', [['fsrs', 'FSRS'], ['sm2', 'SM-2 (legacy)']])}
        <label class="sx-opt"><span>Desired retention<small>0.70–0.99 · higher means more reviews</small></span><input class="inp" type="number" min="0.7" max="0.99" step="0.01" data-po="desiredRetention" value="${p.desiredRetention}"></label>
        <label class="sx-opt"><span>FSRS parameters<small>blank for the defaults; paste from Anki's optimiser, or optimise here</small></span><textarea class="inp" id="sxW" rows="2">${Array.isArray(p.weights) ? p.weights.join(', ') : ''}</textarea></label>
        <div class="sx-row"><button class="tbtn" id="sxOptimise">Optimise from my reviews</button><span class="faint" id="sxOptSay"></span></div>
        ${num('maxIvl', 'Maximum interval', 1, 'days')}${chk('fuzz', 'Fuzz intervals')}${chk('shortTerm', 'FSRS handles same-day steps')}${chk('rescheduleOnChange', 'Reschedule cards when retention or parameters change')}
        ${num('startingEase', 'Starting ease', 0.01, 'SM-2')}${num('easyBonus', 'Easy bonus', 0.01, 'SM-2')}${num('ivlModifier', 'Interval modifier', 0.01, 'SM-2')}${num('hardIvl', 'Hard interval', 0.01, 'SM-2')}
      <h3>Easy days</h3><div class="sx-easy">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((n, i) => `<label>${n}<select class="sel" data-easy="${i}">${[[1, 'normal'], [0.5, 'reduced'], [0, 'minimum']].map(([v, t]) => `<option value="${v}"${(p.easyDays || [])[i] == v ? ' selected' : ''}>${t}</option>`).join('')}</select></label>`).join('')}</div>
        ${chk('loadBalance', 'Load balance', 'spread reviews evenly within each card’s fuzz range')}
      <h3>Timer</h3>${chk('timer.show', 'Show the answer timer')}
        <div class="sx-row">${['warnSec', 'autoRevealSec', 'autoActionSec'].map(k => `<label class="sx-opt"><span>${{warnSec: 'Warn after', autoRevealSec: 'Show answer after', autoActionSec: 'Act after'}[k]}<small>seconds, 0 = off</small></span><input class="inp" type="number" data-pt="${k}" value="${(p.timer || {})[k] || 0}"></label>`).join('')}
        <label class="sx-opt"><span>Then</span><select class="sel" data-pt="autoAction">${[['again', 'Again'], ['good', 'Good'], ['skip', 'Skip']].map(([v, n]) => `<option value="${v}"${(p.timer || {}).autoAction === v ? ' selected' : ''}>${n}</option>`).join('')}</select></label></div>
      <h3>Audio</h3>${chk('autoplay', 'Play audio automatically')}${chk('replayQuestion', 'Replay the question with the answer')}
      <h3>This deck</h3><label class="sx-opt"><span>Description<small>markdown</small></span><textarea class="inp" id="sxDesc" rows="3">${esc(d.description || '')}</textarea></label>
        <label class="sx-opt"><span>Card zoom</span><input class="inp" type="number" step="0.1" min="0.5" max="3" id="sxZoom" value="${d.zoom || 1}"></label>
        <label class="sx-opt"><span>Accent</span><input type="color" id="sxColour" value="${d.color}"></label>
    </div>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:14px"><button class="btn ghost" id="sxOptNo">Close</button><button class="btn primary" id="sxOptOk">Save</button></div>`, 'wide');
  const $m = sel => document.querySelector('.modal ' + sel);
  const box = document.querySelector('.modal:last-of-type') || document;
  $m('#sxPreset').onchange = e => { d.presetId = +e.target.value; sdTouch('decks', d); closeModals(); sdOptionsDialog(deckId); };
  $m('#sxPresetNew').onclick = async () => { const n = await sdAsk('Name the preset', 'New preset'); if(!n) return; const np = sdPresetDefaults({id: sdId(), name: n}); SD.presets.set(np.id, np); sdTouch('presets', np); d.presetId = np.id; sdTouch('decks', d); sdOptionsDialog(deckId); };
  $m('#sxPresetClone').onclick = async () => { const n = await sdAsk('Name the copy', p.name + ' copy'); if(!n) return; const np = Object.assign(JSON.parse(JSON.stringify(p)), {id: sdId(), name: n}); SD.presets.set(np.id, np); sdTouch('presets', np); d.presetId = np.id; sdTouch('decks', d); sdOptionsDialog(deckId); };
  $m('#sxPresetRen').onclick = async () => { const n = await sdAsk('Rename the preset', p.name); if(!n) return; p.name = n; sdTouch('presets', p); sdOptionsDialog(deckId); };
  $m('#sxOptimise').onclick = async () => { const say = $m('#sxOptSay'); say.textContent = 'Reading your reviews…';
    try { const w = await sdOptimise(p, t => say.textContent = t); if(w){ $m('#sxW').value = w.map(x => +x.toFixed(4)).join(', '); say.textContent = 'Done — save to use them.'; } } catch(e){ say.textContent = e.message; } };
  $m('#sxOptNo').onclick = () => closeModals();
  $m('#sxOptOk').onclick = async () => {
    const before = JSON.stringify([p.desiredRetention, p.weights]);
    document.querySelectorAll('.modal [data-po]').forEach(i => { const k = i.dataset.po; p[k] = i.type === 'number' ? +i.value : i.value; });
    document.querySelectorAll('.modal [data-pos]').forEach(i => { p[i.dataset.pos] = i.value.split(/[\s,]+/).map(Number).filter(x => x > 0); });
    document.querySelectorAll('.modal [data-poc]').forEach(i => { const k = i.dataset.poc; if(k.includes('.')){ const [a, b] = k.split('.'); p[a] = Object.assign({}, p[a], {[b]: i.checked}); } else p[k] = i.checked; });
    document.querySelectorAll('.modal [data-pt]').forEach(i => { p.timer = Object.assign({}, p.timer, {[i.dataset.pt]: i.tagName === 'SELECT' ? i.value : +i.value}); });
    document.querySelectorAll('.modal [data-easy]').forEach(i => { p.easyDays = p.easyDays || [1, 1, 1, 1, 1, 1, 1]; p.easyDays[+i.dataset.easy] = +i.value; });
    p.desiredRetention = Math.max(0.7, Math.min(0.99, +p.desiredRetention || 0.9));
    const w = $m('#sxW').value.split(/[\s,]+/).map(Number).filter(x => isFinite(x));
    p.weights = w.length >= 17 ? w : null;
    p.mod = Date.now(); sdTouch('presets', p);
    d.description = $m('#sxDesc').value; d.zoom = +$m('#sxZoom').value || 1; d.color = $m('#sxColour').value; d.mod = Date.now(); sdTouch('decks', d);
    _sdSched.clear();
    closeModals();
    if(p.rescheduleOnChange && before !== JSON.stringify([p.desiredRetention, p.weights])){ toast('Rescheduling…'); await sdRescheduleAll(p.id); }
    toast('Saved.'); rerender();
  };
  void box;
}

/* ---------- filtered decks and custom study ---------- */
function sdFilteredDialog(existingId){
  const d = existingId ? SD.decks.get(existingId) : null;
  const f = d ? d.filter : {search: 'is:due', limit: 100, order: 'random', reschedule: true};
  const orders = [['oldest', 'Oldest seen first'], ['random', 'Random'], ['ivlAsc', 'Increasing intervals'], ['ivlDesc', 'Decreasing intervals'], ['lapses', 'Most lapses'],
    ['added', 'Order added'], ['due', 'Order due'], ['addedDesc', 'Latest added first'], ['retrievability', 'Least likely to be remembered'], ['overdue', 'Relative overdueness']];
  openModal(`<h2 class="serif">${d ? 'Filtered deck · ' + esc(d.name) : 'A filtered deck'}</h2>
    <label class="sx-opt"><span>Name</span><input class="inp" id="fdName" value="${esc(d ? d.name : 'Filtered Deck ' + (sdDecks().filter(x => x.isFiltered).length + 1))}"></label>
    <label class="sx-opt"><span>Search<small>the Browse syntax — deck:"Japanese" is:due, tag:verbs, prop:ivl>=30…</small></span><input class="inp" id="fdSearch" value="${esc(f.search)}"></label>
    <div class="sx-row"><label class="sx-opt"><span>Limit</span><input class="inp" type="number" id="fdLimit" value="${f.limit}"></label>
      <label class="sx-opt"><span>Order</span><select class="sel" id="fdOrder">${orders.map(([v, n]) => `<option value="${v}"${f.order === v ? ' selected' : ''}>${n}</option>`).join('')}</select></label></div>
    <label class="sx-opt chk"><input type="checkbox" id="fdResched"${f.reschedule ? ' checked' : ''}><span>Reschedule cards by my answers here<small>off: a preview that leaves their schedule alone</small></span></label>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:14px"><button class="btn ghost" onclick="closeModals()">Cancel</button><button class="btn primary" id="fdOk">${d ? 'Rebuild' : 'Build'}</button></div>`, 'narrow');
  document.getElementById('fdOk').onclick = () => {
    const name = document.getElementById('fdName').value.trim() || 'Filtered Deck';
    const filter = {search: document.getElementById('fdSearch').value, limit: Math.max(1, +document.getElementById('fdLimit').value || 100),
      order: document.getElementById('fdOrder').value, reschedule: document.getElementById('fdResched').checked, previewAgain: 60, previewHard: 600, previewGood: 0};
    let deck = d;
    if(!deck){ deck = sdEnsureDeck(name, {isFiltered: true, filter}); }
    else { deck.filter = Object.assign(deck.filter, filter); if(deck.name !== name) sdRenameDeck(deck.id, name); sdTouch('decks', deck); }
    const n = sdRebuildFiltered(deck.id);
    closeModals();
    if(!n){ toast('No cards matched that search (suspended, buried and already-filtered cards are left out).'); }
    navigate('#/study/deck/' + deck.id);
  };
}
function sdEmptyFiltered(id){
  let n = 0; SD.cards.forEach(c => { if(c.deckId === id && c.odid){ c.deckId = c.odid; c.due = c.odue || c.due; c.odid = 0; c.odue = 0; if(c.queue === 4) c.queue = sdNaturalQueue(c); sdTouch('cards', c); n++; } });
  return n;
}
function sdRebuildFiltered(id){
  const d = SD.decks.get(id); if(!d || !d.isFiltered) return 0;
  sdEmptyFiltered(id);
  let cards = sdSearchCards(d.filter.search).map(i => SD.cards.get(i)).filter(c => c && c.queue >= 0 && !c.odid && !(SD.decks.get(c.deckId) || {}).isFiltered);
  const t = sdToday(), o = d.filter.order;
  const sorts = {oldest: (a, b) => (a.lastReview || 0) - (b.lastReview || 0), random: () => Math.random() - 0.5, ivlAsc: (a, b) => a.ivl - b.ivl, ivlDesc: (a, b) => b.ivl - a.ivl,
    lapses: (a, b) => b.lapses - a.lapses, added: (a, b) => a.noteId - b.noteId, addedDesc: (a, b) => b.noteId - a.noteId, due: (a, b) => (a.type === 2 ? a.due : 1e9) - (b.type === 2 ? b.due : 1e9),
    retrievability: (a, b) => (sdRetrievability(a) ?? 1) - (sdRetrievability(b) ?? 1),
    overdue: (a, b) => ((b.type === 2 ? (t - b.due) / Math.max(1, b.ivl) : -1) - (a.type === 2 ? (t - a.due) / Math.max(1, a.ivl) : -1))};
  cards.sort(sorts[o] || sorts.random);
  cards = cards.slice(0, d.filter.limit);
  cards.forEach(c => { c.odid = c.deckId; c.odue = c.due; c.deckId = id;
    /* in a filtered deck everything is due now */
    if(c.type === 2){ c.due = Math.min(c.due, t); } sdTouch('cards', c); });
  return cards.length;
}
function sdCustomStudyDialog(deckId){
  const d = SD.decks.get(deckId); if(!d) return;
  const opts = [['moreNew', 'Study more new cards today'], ['moreRev', 'Allow more reviews today'], ['forgot', 'Review cards I forgot in the last days'],
    ['ahead', 'Review ahead'], ['preview', 'Preview new cards'], ['tag', 'Study by card state or tag']];
  openModal(`<h2 class="serif">Custom study · ${esc(sdDeckLeaf(d.name))}</h2>
    <div class="sx-cs">${opts.map(([k, n], i) => `<label><input type="radio" name="cs" value="${k}"${i === 0 ? ' checked' : ''}> ${n}</label>`).join('')}</div>
    <label class="sx-opt"><span id="csLabel">How many more</span><input class="inp" type="number" id="csN" value="10"></label>
    <label class="sx-opt" id="csTagRow" hidden><span>Tag or search</span><input class="inp" id="csTag" placeholder="tag:grammar  or  is:new"></label>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:14px"><button class="btn ghost" onclick="closeModals()">Cancel</button><button class="btn primary" id="csOk">OK</button></div>`, 'narrow');
  const lab = {moreNew: 'How many more new cards', moreRev: 'How many more reviews', forgot: 'Forgotten in the last how many days', ahead: 'How many days ahead', preview: 'Added in the last how many days', tag: 'How many cards'};
  document.querySelectorAll('input[name=cs]').forEach(r => r.onchange = () => { document.getElementById('csLabel').textContent = lab[r.value]; document.getElementById('csTagRow').hidden = r.value !== 'tag'; });
  document.getElementById('csOk').onclick = () => {
    const k = document.querySelector('input[name=cs]:checked').value, n = Math.max(1, +document.getElementById('csN').value || 10);
    const p = sdDeckPreset(deckId);
    if(k === 'moreNew' || k === 'moreRev'){
      /* a limit raised for today only is a copy of the preset for today */
      const tp = Object.assign(JSON.parse(JSON.stringify(p)), {id: sdId(), name: p.name + ' (today)', todayOf: p.id, day: sdToday()});
      if(k === 'moreNew') tp.newPerDay += n; else tp.revPerDay += n;
      SD.presets.set(tp.id, tp); sdTouch('presets', tp); d.presetId = tp.id; d.restorePreset = p.todayOf || p.id; d.restoreDay = sdToday(); sdTouch('decks', d);
      closeModals(); navigate('#/study/review/' + deckId); return;
    }
    const q = `deck:"${d.name}"`;
    const search = k === 'forgot' ? `${q} rated:${n}:1` : k === 'ahead' ? `${q} prop:due<=${n} -is:due is:review` : k === 'preview' ? `${q} is:new added:${n}` : `${q} ${document.getElementById('csTag').value || 'is:due'}`;
    let fd = sdDeckByName('Custom Study Session');
    if(fd && !fd.isFiltered) fd = null;
    if(!fd) fd = sdEnsureDeck('Custom Study Session', {isFiltered: true, filter: {search, limit: k === 'tag' ? n : 9999, order: 'random', reschedule: k !== 'preview' && k !== 'ahead' ? true : k === 'ahead'}});
    else { fd.filter = Object.assign(fd.filter, {search, limit: k === 'tag' ? n : 9999, reschedule: k !== 'preview'}); sdTouch('decks', fd); }
    const got = sdRebuildFiltered(fd.id);
    closeModals();
    if(!got) toast('No cards matched.'); else navigate('#/study/review/' + fd.id);
  };
}
/* a limit raised for one day goes back to the deck's own preset the next */
function sdRestoreTodayPresets(){
  const t = sdToday();
  SD.decks.forEach(d => { if(d.restorePreset && d.restoreDay !== t){ d.presetId = d.restorePreset; delete d.restorePreset; delete d.restoreDay; sdTouch('decks', d); } });
}

/* ---------- a card's own history ---------- */
function sdCardInfo(cardId){
  const c = SD.cards.get(cardId); if(!c) return;
  const n = SD.notes.get(c.noteId), nt = SD.noteTypes.get(n.noteTypeId), d = SD.decks.get(c.deckId);
  const revs = SD.revlog.filter(r => r.cardId === c.id);
  const fmtD = ms => new Date(ms).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'});
  const type = ['New', 'Learning', 'Review', 'Relearning'][c.type], r = sdRetrievability(c);
  const ttype = ['Learn', 'Review', 'Relearn', 'Filtered', 'Manual', 'Rescheduled'];
  const ivlS = v => v < 0 ? sdSpan(-v) : v ? sdSpan(v * 86400) : '';
  openModal(`<h2 class="serif">Card info</h2>
    <dl class="sx-info">
      <dt>Added</dt><dd>${fmtD(n.created || n.id)}</dd>
      <dt>First review</dt><dd>${revs.length ? fmtD(revs[0].id) : '—'}</dd><dt>Latest review</dt><dd>${revs.length ? fmtD(revs[revs.length - 1].id) : '—'}</dd>
      <dt>Due</dt><dd>${c.type === 0 ? 'new #' + c.due : c.queue === 1 ? new Date(c.due * 1000).toLocaleString() : sdDayISO(c.due)}${c.queue < 0 ? ' (' + {'-1': 'suspended', '-2': 'buried', '-3': 'buried'}[c.queue] + ')' : ''}</dd>
      <dt>Interval</dt><dd>${c.ivl ? sdSpan(c.ivl * 86400) : '—'}</dd>
      ${c.memory ? `<dt>Stability</dt><dd>${c.memory.s.toFixed(2)} days</dd><dt>Difficulty</dt><dd>${(c.memory.d / 10 * 100).toFixed(0)}%</dd><dt>Retrievability</dt><dd>${r != null ? (r * 100).toFixed(1) + '%' : '—'}</dd>` : `<dt>Ease</dt><dd>${c.factor ? (c.factor / 10).toFixed(0) + '%' : '—'}</dd>`}
      <dt>Reviews</dt><dd>${c.reps}</dd><dt>Lapses</dt><dd>${c.lapses}</dd>
      <dt>Average time</dt><dd>${revs.length ? (revs.reduce((a, x) => a + x.time, 0) / revs.length / 1000).toFixed(1) + 's' : '—'}</dd>
      <dt>Total time</dt><dd>${revs.length ? Math.round(revs.reduce((a, x) => a + x.time, 0) / 1000) + 's' : '—'}</dd>
      <dt>Card type</dt><dd>${esc(nt.kind === 'standard' ? (nt.templates[c.ord] || {}).name || '' : 'Cloze ' + (c.ord + 1))} · ${type}</dd>
      <dt>Note type</dt><dd>${esc(nt.name)}</dd><dt>Deck</dt><dd>${esc(d ? d.name : '')}</dd>
      <dt>Card ID · Note ID</dt><dd class="mono">${c.id} · ${n.id}</dd>
      ${n.extra && n.extra.sourceGo ? `<dt>From</dt><dd><a href="${esc(n.extra.sourceGo)}" onclick="closeModals()">${esc(n.extra.sourceLabel || 'its source')}</a></dd>` : ''}
    </dl>
    <table class="sx-rtable"><thead><tr><th>Date</th><th>Type</th><th>Rating</th><th>Interval</th><th>${c.memory ? 'Stability' : 'Ease'}</th><th>Time</th></tr></thead>
    <tbody>${revs.slice().reverse().map(x => `<tr><td>${new Date(x.id).toLocaleString(undefined, {dateStyle: 'medium', timeStyle: 'short'})}</td><td>${ttype[x.type] || ''}</td>
      <td class="r${x.ease}">${['Manual', 'Again', 'Hard', 'Good', 'Easy'][x.ease] || ''}</td><td>${ivlS(x.ivl)}</td><td>${x.s != null ? (+x.s).toFixed(1) + 'd' : x.factor ? (x.factor / 10).toFixed(0) + '%' : ''}</td><td>${(x.time / 1000).toFixed(1)}s</td></tr>`).join('') || '<tr><td colspan="6" class="faint">No reviews yet.</td></tr>'}</tbody></table>`, 'wide');
}

/* ---------- shortcuts, all remappable ---------- */
const SD_DEFAULT_KEYS = {' ': 'show', 'Enter': 'show', '1': 'rate1', '2': 'rate2', '3': 'rate3', '4': 'rate4', 'Ctrl+z': 'undo', 'Meta+z': 'undo',
  'Ctrl+1': 'flag1', 'Ctrl+2': 'flag2', 'Ctrl+3': 'flag3', 'Ctrl+4': 'flag4', 'Ctrl+5': 'flag5', 'Ctrl+6': 'flag6', 'Ctrl+7': 'flag7', 'Ctrl+0': 'flag0',
  'Meta+1': 'flag1', 'Meta+2': 'flag2', 'Meta+3': 'flag3', 'Meta+4': 'flag4', 'Meta+5': 'flag5', 'Meta+6': 'flag6', 'Meta+7': 'flag7',
  '*': 'mark', '-': 'bury', '@': 'suspend', '!': 'suspend', 'e': 'edit', 'i': 'info', 'r': 'replay', 'f': 'focus', 'w': 'scratch', '?': 'help'};
const SD_ACTION_NAMES = {show: 'Show answer / Good', rate1: 'Again', rate2: 'Hard', rate3: 'Good', rate4: 'Easy', undo: 'Undo', mark: 'Mark note', bury: 'Bury',
  suspend: 'Suspend', edit: 'Edit', info: 'Card info', replay: 'Replay audio', focus: 'Focus mode', scratch: 'Scratchpad', help: 'This sheet',
  flag0: 'Remove flag', flag1: 'Flag 1', flag2: 'Flag 2', flag3: 'Flag 3', flag4: 'Flag 4', flag5: 'Flag 5', flag6: 'Flag 6', flag7: 'Flag 7'};
function sdShortcuts(){ const m = sdMisc('shortcuts', () => ({map: {}})); return Object.assign({}, SD_DEFAULT_KEYS, m.map); }
function sdComboOf(k){
  const key = k.key && k.key.length === 1 ? (k.ctrl || k.meta ? k.key.toLowerCase() : k.key) : k.key;
  return (k.ctrl ? 'Ctrl+' : '') + (k.meta ? 'Meta+' : '') + (k.alt ? 'Alt+' : '') + key;
}
function sdShortcutSheet(){
  const map = sdShortcuts(), byAct = {};
  Object.entries(map).forEach(([k, a]) => { if(a) (byAct[a] = byAct[a] || []).push(k); });
  const clash = Object.entries(map).length !== new Set(Object.keys(map)).size;
  openModal(`<h2 class="serif">Keys</h2><p class="faint">Click a key to change it, then press the new one. ${clash ? 'Some keys do two things — the last one wins.' : ''}</p>
    <table class="sx-keys">${Object.keys(SD_ACTION_NAMES).map(a => `<tr><td>${SD_ACTION_NAMES[a]}</td><td>${(byAct[a] || []).map(k => `<kbd>${esc(k === ' ' ? 'Space' : k)}</kbd>`).join(' ')}</td>
      <td><button class="tbtn" data-sxremap="${a}">change</button></td></tr>`).join('')}</table>
    <p class="faint">Swipes on touch: left Again, right Good, up Easy, down Hard.</p>
    <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" id="sxKeysReset">Reset all</button><button class="btn" onclick="closeModals()">Done</button></div>`, 'narrow');
  document.querySelectorAll('[data-sxremap]').forEach(b => b.onclick = () => {
    b.textContent = 'press a key…';
    const on = e => { e.preventDefault(); removeEventListener('keydown', on, true);
      if(['Control', 'Meta', 'Shift', 'Alt'].includes(e.key)){ addEventListener('keydown', on, true); return; }
      const combo = sdComboOf({key: e.key, ctrl: e.ctrlKey, meta: e.metaKey, alt: e.altKey});
      const m = sdMisc('shortcuts', () => ({map: {}}));
      const cur = sdShortcuts();
      if(cur[combo] && cur[combo] !== b.dataset.sxremap && !confirm(`${combo} already does “${SD_ACTION_NAMES[cur[combo]]}”. Use it for this instead?`)){ sdShortcutSheet(); return; }
      Object.keys(cur).forEach(k => { if(cur[k] === b.dataset.sxremap && SD_DEFAULT_KEYS[k] === b.dataset.sxremap) m.map[k] = null; });
      m.map[combo] = b.dataset.sxremap; sdTouch('misc', m); closeModals(); sdShortcutSheet(); };
    addEventListener('keydown', on, true);
  });
  document.getElementById('sxKeysReset').onclick = () => { const m = sdMisc('shortcuts', () => ({map: {}})); m.map = {}; sdTouch('misc', m); closeModals(); sdShortcutSheet(); };
}

/* ---------- the scratchpad: a sheet to write on, cleared each card ---------- */
function sdScratchpad(root){
  const wrap = root.querySelector('#sxCardWrap'); if(!wrap) return;
  let cv = wrap.querySelector('.sx-scratch');
  if(cv){ cv.remove(); return; }
  cv = document.createElement('canvas'); cv.className = 'sx-scratch';
  const r = wrap.getBoundingClientRect(); cv.width = r.width * devicePixelRatio; cv.height = r.height * devicePixelRatio;
  wrap.appendChild(cv);
  const g = cv.getContext('2d'); g.scale(devicePixelRatio, devicePixelRatio); g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = getComputedStyle(document.body).color; g.lineWidth = 2.4;
  let down = false;
  const at = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  cv.onpointerdown = e => { down = true; cv.setPointerCapture(e.pointerId); g.beginPath(); g.moveTo(...at(e)); };
  cv.onpointermove = e => { if(!down) return; g.lineWidth = e.pressure ? 1 + e.pressure * 3 : 2.4; g.lineTo(...at(e)); g.stroke(); };
  cv.onpointerup = () => { down = false; };
  cv.ondblclick = () => g.clearRect(0, 0, cv.width, cv.height);
  const ui = sdUi(), id = ui.cardId;
  const watch = setInterval(() => { if(sdUi().cardId !== id || !cv.isConnected){ cv.remove(); clearInterval(watch); } }, 300);
}

/* ---------- your own collection as a dictionary ---------- */
function sdLookup(term, root){
  const t = term.trim(); if(t.length < 2) return;
  const lc = t.toLowerCase(), cur = SD.cards.get(sdUi().cardId);
  const hits = [...SD.notes.values()].filter(n => (!cur || n.id !== cur.noteId) && n.fields.some(f => sdStripHTML(f).toLowerCase().includes(lc))).slice(0, 6);
  document.querySelectorAll('.sx-look').forEach(x => x.remove());
  if(!hits.length) return;
  const p = document.createElement('div'); p.className = 'sx-look';
  p.innerHTML = `<div class="faint">“${esc(t)}” elsewhere in your cards</div>${hits.map(n => `<a href="#/study/browse/${encodeURIComponent('nid:' + n.id)}">${esc(sdStripHTML(n.fields[0]).slice(0, 60))}<span>${esc(sdStripHTML(n.fields[1] || '').slice(0, 60))}</span></a>`).join('')}`;
  (root.querySelector('#sxStage') || document.body).appendChild(p);
  setTimeout(() => document.addEventListener('click', function off(){ p.remove(); document.removeEventListener('click', off); }), 0);
}

/* ---------- a gamepad, if one is plugged in and allowed ---------- */
function sdGamepad(root){
  if(!sdSettings().gamepad || !navigator.getGamepads) return;
  const was = {};
  const map = {0: 'show', 1: 'rate1', 2: 'rate2', 3: 'rate4', 12: 'undo', 5: 'rate3', 4: 'rate1'};
  const tick = () => {
    if(!root.isConnected) return;
    const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
    pads.forEach(pd => pd.buttons.forEach((b, i) => { if(b.pressed && !was[i] && map[i]) sdReviewKey(root, map[i]); was[i] = b.pressed; }));
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ============================================================
   The doors the rest of the house knocks on.
   ============================================================ */
/* the deck a thing from a room belongs in, made if it is not there */
const SD_SOURCE_DECK = {journal: 'Mindsets & Principles', library: 'Mindsets & Principles', theatre: 'Mindsets & Principles', value: 'Mindsets & Principles',
  grammar: 'Japanese::Grammar', vocab: 'Japanese::Vocabulary', error_log: 'Japanese::Corrections', tarot: 'Divination Study', iching: 'Divination Study', charm: 'Divination Study', manual: 'Default'};
function studySourceDeckName(t){ return SD_SOURCE_DECK[t] || 'Default'; }
/* a card from anywhere: a front, a back, where it came from. Kept whether or
   not the deck has been opened yet — the note waits in S until it has. */
function addStudyCard(fields){
  const f = Object.assign({}, fields);
  if(!SD.loaded){ (S.sdPending = S.sdPending || []).push(f); if(typeof saveNow === 'function') saveNow(); sdLoad().then(sdTakePending); return {pending: true}; }
  const cloze = f.type === 'cloze' && f.clozeAnswer;
  const nt = sdNoteTypeByName(cloze ? 'Cloze' : 'Basic');
  const text = cloze ? (/_{2,}/.test(f.front) ? f.front.replace(/_{2,}/, `{{c1::${f.clozeAnswer}}}`) : `${f.front} {{c1::${f.clozeAnswer}}}`) : (f.front || '');
  const deck = f.deckId && SD.decks.get(f.deckId) ? SD.decks.get(f.deckId) : sdEnsureDeck(f.deckName || studySourceDeckName(f.sourceType));
  const tags = (f.tags || []).map(sdNormTag).filter(Boolean); if(f.status === 'inbox') tags.push('inbox');
  const n = sdNewNote(nt.id, [text, f.back || ''], tags, {extra: {sourceType: f.sourceType || null, sourceId: f.sourceId || null, sourceLabel: f.sourceLabel || null, sourceGo: f.sourceGo || null, reference: f.reference || null}});
  const cards = sdAddNote(n, deck.id);
  /* a suggestion waits, suspended, until it is accepted */
  if(f.status === 'inbox') cards.forEach(c => { c.queue = -1; sdTouch('cards', c); });
  sdSummarise();
  return {id: n.id, noteId: n.id, cards, note: n};
}
function sdTakePending(){
  const l = S.sdPending || []; if(!l.length) return;
  S.sdPending = []; l.forEach(f => addStudyCard(f)); if(typeof saveNow === 'function') saveNow();
}
function suggestStudyCard(fields){
  if(SD.loaded){
    const same = [...SD.notes.values()].find(n => n.tags.includes('inbox') && sdStripHTML(n.fields[0]) === sdStripHTML(fields.front || ''));
    if(same) return {id: same.id, note: same};
  }
  return addStudyCard(Object.assign({status: 'inbox'}, fields));
}
function studyInboxNotes(){ return SD.loaded ? [...SD.notes.values()].filter(n => n.tags.includes('inbox')) : []; }
function sdAcceptInbox(noteId){ const n = SD.notes.get(noteId); if(!n) return; n.tags = n.tags.filter(t => t !== 'inbox'); sdSaveNote(n); sdCardsOf(noteId).forEach(c => { if(c.queue === -1){ c.queue = sdNaturalQueue(c); sdTouch('cards', c); } }); }
function rememberBtnHTML(sourceType, sourceId, label){
  return `<button class="tbtn sx-remember" data-sxremember="${esc(sourceType)}|${esc(sourceId || '')}|${esc(label || '')}" title="Make a card of this (Ctrl/⌘+Shift+R)">✦ remember</button>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-sxremember]'); if(!b) return;
  const [sourceType, sourceId, label] = b.dataset.sxremember.split('|');
  openRememberModal({sourceType, sourceId, sourceLabel: label, front: studySelection() || label || ''});
});
/* The older buttons across the house (the ◆ on entries, values, tarot cards…)
   carry data-sdpin and what to fill the card with. One delegated listener,
   because they appear in a dozen rooms and half of them redraw on their own.
   What is selected beats what the button guessed. */
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-sdpin]'); if(!b) return;
  ev.preventDefault(); ev.stopPropagation();
  const [sourceType, sourceId] = b.dataset.sdpin.split('|');
  const picked = studySelection();
  openRememberModal({sourceType, sourceId: sourceId || null, front: picked || b.dataset.sdfront || '', back: picked ? '' : (b.dataset.sdback || ''),
    sourceLabel: b.dataset.sdsay || '', sourceGo: location.hash});
}, true);
function studySelection(){
  try { const sel = window.getSelection(); if(!sel || sel.isCollapsed) return ''; const n = sel.anchorNode;
    if(n && n.parentElement && n.parentElement.closest('input, textarea, .ed.editing')) return ''; return String(sel).trim(); } catch(e){ return ''; }
}
const STUDY_PAGE_SOURCE = {journals: 'journal', commonplace: 'library', values: 'value', japanese: 'vocab', today: 'theatre'};
document.addEventListener('keydown', ev => {
  if(!(ev.key === 'R' || ev.key === 'r') || !ev.shiftKey || !(ev.metaKey || ev.ctrlKey)) return;
  if(typeof S === 'undefined' || !S) return;
  ev.preventDefault();
  const where = (typeof parseHash === 'function' ? parseHash().name : '') || '';
  openRememberModal({sourceType: STUDY_PAGE_SOURCE[where] || 'manual', front: studySelection(), back: '', sourceGo: location.hash});
});
async function openRememberModal(pre){
  const p = pre || {};
  await sdLoad();
  const deckName = studySourceDeckName(p.sourceType);
  openModal(`<h2 class="serif">Remember this</h2>
    <label class="sx-opt"><span>Front</span><textarea class="inp" id="rmFront" rows="2">${esc(p.front || '')}</textarea></label>
    <label class="sx-opt"><span>Back</span><textarea class="inp" id="rmBack" rows="2">${esc(p.back || '')}</textarea></label>
    <label class="sx-opt"><span>Deck</span><select class="sel" id="rmDeck">${sdDecks().filter(d => !d.isFiltered).map(d => `<option value="${d.id}"${d.name === deckName ? ' selected' : ''}>${esc(d.name)}</option>`).join('')}
      ${sdDeckByName(deckName) ? '' : `<option value="new:${esc(deckName)}" selected>${esc(deckName)} (new)</option>`}</select></label>
    <p class="faint">Use {{c1::…}} in the front for a cloze.</p>
    <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" onclick="closeModals()">Cancel</button><button class="btn primary" id="rmOk">Keep it</button></div>`, 'narrow');
  document.getElementById('rmFront').focus();
  document.getElementById('rmOk').onclick = () => {
    const front = document.getElementById('rmFront').value.trim(); if(!front){ toast('The front needs something.'); return; }
    const dv = document.getElementById('rmDeck').value;
    const deck = dv.startsWith('new:') ? sdEnsureDeck(dv.slice(4)) : SD.decks.get(+dv);
    const back = document.getElementById('rmBack').value.trim();
    if(/\{\{c\d+::/.test(front)){ const nt = sdNoteTypeByName('Cloze'); sdAddNote(sdNewNote(nt.id, [front, back], [], {extra: {sourceType: p.sourceType, sourceId: p.sourceId, sourceLabel: p.sourceLabel, sourceGo: p.sourceGo || location.hash}}), deck.id); }
    else addStudyCard({front, back, deckId: deck.id, sourceType: p.sourceType, sourceId: p.sourceId, sourceLabel: p.sourceLabel, sourceGo: p.sourceGo || location.hash});
    closeModals(); toast('Kept — it will come round in the Study Deck.');
  };
}
/* the line on Today */
function studyTodayHTML(){
  const due = SD.loaded ? sdDueCount() : (S.sdSummary ? S.sdSummary.due : 0);
  const box = SD.loaded ? studyInboxNotes().length : 0;
  if(!SD.loaded && !S.sdSummary) { sdLoad().then(() => { sdSummarise(); }); return ''; }
  if(!due && !box) return `<div class="sd-today quiet"><span class="mono">Nothing to review today</span><a class="btn sm ghost" href="#/study">the decks</a></div>`;
  return `<div class="sd-today"><span class="sd-today-n"><b>${due}</b> ${due === 1 ? 'card' : 'cards'} to review${box ? ` · ${box} suggested` : ''}</span>
    <span class="grow"></span>${due ? `<button class="btn sm primary" id="sdFive" onclick="startShortStudy()">five minutes</button>` : ''}<a class="btn sm ghost" href="#/study">the decks</a></div>`;
}
/* five minutes: the deck with the most due, straight into review */
async function startShortStudy(){
  await sdLoad();
  const best = sdDecks().filter(d => !d.isFiltered && !d.name.includes('::')).map(d => ({d, n: sdCounts(d.id).rev + sdCounts(d.id).learn})).sort((a, b) => b.n - a.n)[0];
  if(!best || !best.n){ toast('Nothing is due.'); return; }
  navigate('#/study/review/' + best.d.id);
}
/* for the week's review */
function studyReviewLines(from, to){
  if(!SD.loaded) return [];
  const a = Date.parse(from + 'T00:00:00'), z = Date.parse(to + 'T23:59:59');
  const rev = SD.revlog.filter(r => r.ease > 0 && r.id >= a && r.id <= z);
  const out = [];
  if(rev.length) out.push(`${rev.length} cards reviewed, ${Math.round(rev.filter(r => r.ease > 1).length / rev.length * 100)}% remembered.`);
  const made = [...SD.notes.values()].filter(n => (n.created || n.id) >= a && (n.created || n.id) <= z).length;
  if(made) out.push(`${made} new ${made === 1 ? 'note' : 'notes'} added.`);
  const behind = sdDecks().filter(d => !d.isFiltered && !d.name.includes('::')).map(d => ({d, n: sdCounts(d.id).rev})).filter(x => x.n >= 30).sort((x, y) => y.n - x.n)[0];
  if(behind) out.push(`${behind.d.name} has ${behind.n} waiting — that one is getting away.`);
  return out;
}
/* the old name some rooms still use for the deck's state: the blob as it
   was, kept after the move and marked so */
function studyState(){ if(!S.study) S.study = {cards: [], decks: []}; return S.study; }
