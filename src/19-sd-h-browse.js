/* ============================================================
   THE STUDY DECK — Browse: Anki's search syntax, the sidebar, columns,
   bulk actions.
   ============================================================ */

/* ---------- search ---------- */
function sdTokenize(q){
  const out = []; let i = 0;
  while(i < q.length){
    const ch = q[i];
    if(/\s/.test(ch)){ i++; continue; }
    if(ch === '(' || ch === ')'){ out.push(ch); i++; continue; }
    let neg = false; if(ch === '-' && q[i + 1] && !/\s/.test(q[i + 1])){ neg = true; i++; }
    let tok = '';
    if(q[i] === '"'){ i++; while(i < q.length && q[i] !== '"'){ if(q[i] === '\\' && q[i + 1]){ tok += q[i + 1]; i += 2; continue; } tok += q[i++]; } i++; }
    else { while(i < q.length && !/[\s()]/.test(q[i])){ if(q[i] === '"'){ i++; while(i < q.length && q[i] !== '"') tok += q[i++]; i++; continue; } tok += q[i++]; } }
    out.push({neg, tok});
  }
  return out;
}
function sdParseSearch(q){
  const toks = sdTokenize(q || ''); let p = 0;
  const parseOr = () => { let l = parseAnd(); while(toks[p] && toks[p].tok && toks[p].tok.toLowerCase() === 'or' && !toks[p].neg){ p++; const r = parseAnd(); l = {or: [l, r]}; } return l; };
  const parseAnd = () => { const parts = []; while(p < toks.length && toks[p] !== ')' && !(toks[p].tok && toks[p].tok.toLowerCase() === 'or' && !toks[p].neg)){
      if(toks[p] === '('){ p++; const e = parseOr(); if(toks[p] === ')') p++; parts.push(e); }
      else if(toks[p].tok && toks[p].tok.toLowerCase() === 'and'){ p++; }
      else { parts.push({term: toks[p].tok, neg: toks[p].neg}); p++; } }
    return parts.length === 1 ? parts[0] : {and: parts}; };
  return parseOr();
}
const sdGlob = (s, flags) => new RegExp('^' + s.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/_/g, '.') + '$', flags || 'i');
const sdNoComb = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
function sdMatchTerm(term, c, n, nt){
  const t = term.term; const lc = t.toLowerCase();
  const colon = t.indexOf(':');
  const key = colon > 0 ? t.slice(0, colon).toLowerCase() : null, val = colon > 0 ? t.slice(colon + 1) : null;
  const today = sdToday();
  let r;
  if(key === 'deck'){ const d = SD.decks.get(c.odid || c.deckId), d2 = SD.decks.get(c.deckId); const re = sdGlob(val);
    r = [d, d2].some(x => x && (re.test(x.name) || x.name.toLowerCase().startsWith(val.toLowerCase().replace(/\*$/, '') + '::'))) || (val === 'filtered' && d2 && d2.isFiltered); }
  else if(key === 'tag'){ if(val === 'none') r = !n.tags.length; else if(val.startsWith('re:')){ const re = new RegExp(val.slice(3), 'i'); r = n.tags.some(x => re.test(x)); }
    else { const re = sdGlob(val); r = n.tags.some(x => re.test(x) || x.toLowerCase().startsWith(val.toLowerCase() + '::')); } }
  else if(key === 'note') r = sdGlob(val).test(nt.name);
  else if(key === 'card') r = /^\d+$/.test(val) ? c.ord === +val - 1 : sdGlob(val).test(nt.kind === 'standard' ? (nt.templates[c.ord] || {}).name || '' : '');
  else if(key === 'is'){ const v = val.toLowerCase();
    r = v === 'new' ? c.type === 0 : v === 'learn' ? (c.type === 1 || c.type === 3) : v === 'review' ? (c.type === 2 || c.type === 3) : v === 'due' ? ((c.queue === 2 || c.queue === 3) && c.due <= today) || (c.queue === 1 && c.due <= sdNowSec() + 1200)
      : v === 'suspended' ? c.queue === -1 : v === 'buried' ? (c.queue === -2 || c.queue === -3) : v === 'buried-manually' ? c.queue === -3 : v === 'buried-sibling' ? c.queue === -2
      : v === 'marked' ? n.tags.includes('marked') : v === 'leech' ? n.tags.includes('leech') : v === 'suspended' ? c.queue === -1 : false; }
  else if(key === 'flag') r = (c.flags & 7) === +val;
  else if(key === 'nid') r = String(val).split(',').map(Number).includes(n.id);
  else if(key === 'cid') r = String(val).split(',').map(Number).includes(c.id);
  else if(key === 'mid') r = n.noteTypeId === +val;
  else if(key === 'prop'){ const m = val.match(/^(\w+)(<=|>=|!=|=|<|>)(-?[\d.]+)$/); if(!m) r = false; else {
      const [, f, op, x] = m, num = +x;
      const v = f === 'ivl' ? c.ivl : f === 'due' ? (c.type === 2 ? c.due - today : null) : f === 'reps' ? c.reps : f === 'lapses' ? c.lapses : f === 'ease' ? (c.factor || 0) / 1000
        : f === 's' ? (c.memory ? c.memory.s : null) : f === 'd' ? (c.memory ? c.memory.d : null) : f === 'r' ? sdRetrievability(c) : f === 'pos' ? (c.type === 0 ? c.due : null) : null;
      r = v != null && ({'<': v < num, '>': v > num, '<=': v <= num, '>=': v >= num, '=': v === num, '!=': v !== num})[op]; } }
  else if(key === 'rated' || key === 'introduced'){ const [days, ease] = val.split(':').map(Number); const since = sdDayToDate(today - (days || 1) + 1).getTime();
    const revs = SD.revlog.filter(x => x.cardId === c.id && x.ease > 0);
    r = key === 'rated' ? revs.some(x => x.id >= since && (!ease || x.ease === ease)) : revs.length > 0 && revs[0].id >= since; }
  else if(key === 'added') r = (n.created || n.id) >= sdDayToDate(today - (+val || 1) + 1).getTime();
  else if(key === 'edited') r = (n.mod || 0) >= sdDayToDate(today - (+val || 1) + 1).getTime();
  else if(key === 'dupe'){ const [mid, ...rest] = val.split(','); r = n.noteTypeId === +mid && sdStripHTML(n.fields[0]).toLowerCase() === rest.join(',').toLowerCase(); }
  else if(key === 're'){ const re = new RegExp(val, 'i'); r = n.fields.some(f => re.test(f)); }
  else if(key === 'nc'){ const x = sdNoComb(val).toLowerCase(); r = n.fields.some(f => sdNoComb(sdStripHTML(f)).toLowerCase().includes(x)); }
  else if(key === 'w'){ const re = new RegExp('\\b' + val.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '\\w*') + '\\b', 'i'); r = n.fields.some(f => re.test(sdStripHTML(f))); }
  else if(key && nt.fields.some(f => sdGlob(key).test(f.name))){
    const idx = nt.fields.map((f, i) => sdGlob(key).test(f.name) ? i : -1).filter(i => i > -1);
    r = idx.some(i => { const v = sdStripHTML(n.fields[i] || ''); if(val.startsWith('re:')) return new RegExp(val.slice(3), 'i').test(v); return val === '' ? v === '' : sdGlob(val).test(v); }); }
  else { const needle = lc.includes('*') || lc.includes('_') ? null : lc; const re = needle ? null : new RegExp(lc.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/_/g, '.'), 'i');
    r = n.fields.some(f => { const v = sdStripHTML(f).toLowerCase(); return needle ? v.includes(needle) : re.test(v); }) || (needle && n.tags.some(x => x.toLowerCase() === needle)); }
  return term.neg ? !r : r;
}
function sdEval(node, c, n, nt){
  if(!node) return true;
  if(node.or) return node.or.some(x => sdEval(x, c, n, nt));
  if(node.and) return node.and.every(x => sdEval(x, c, n, nt));
  return sdMatchTerm(node, c, n, nt);
}
function sdSearchCards(q){
  const tree = q && q.trim() ? sdParseSearch(q) : null, out = [];
  SD.cards.forEach(c => { const n = SD.notes.get(c.noteId); if(!n) return; const nt = SD.noteTypes.get(n.noteTypeId); if(!nt) return; try { if(sdEval(tree, c, n, nt)) out.push(c.id); } catch(e){} });
  return out;
}

/* ---------- the browser ---------- */
const SD_COLS = {sort: 'Sort field', question: 'Question', answer: 'Answer', card: 'Card', note: 'Note type', deck: 'Deck', due: 'Due', ivl: 'Interval', ease: 'Ease',
  difficulty: 'Difficulty', stability: 'Stability', retrievability: 'Retrievability', reps: 'Reviews', lapses: 'Lapses', tags: 'Tags', created: 'Created', modified: 'Edited',
  avgTime: 'Average time', totalTime: 'Total time', firstReview: 'First review'};
function sdBrowseState(){ return S._sdB = S._sdB || {q: 'deck:current', mode: 'cards', sel: new Set(), sort: 'sort', desc: false, cols: ['sort', 'card', 'deck', 'due', 'ivl', 'tags'], page: 0}; }
function sdBrowserRoute(root, params){
  const b = sdBrowseState();
  if(params && params[0]) b.q = decodeURIComponent(params[0]);
  if(b.q === 'deck:current'){ const l = SD.decks.get(sdSettings().lastDeck); b.q = l ? `deck:"${l.name}"` : ''; }
  const ids = sdSearchCards(b.q);
  const cards = ids.map(i => SD.cards.get(i));
  let rows = b.mode === 'notes' ? [...new Map(cards.map(c => [c.noteId, c])).values()] : cards;
  const revBy = new Map(); SD.revlog.forEach(r => { if(r.ease > 0) (revBy.get(r.cardId) || revBy.set(r.cardId, []).get(r.cardId)).push(r); });
  const val = (c, k) => { const n = SD.notes.get(c.noteId), nt = SD.noteTypes.get(n.noteTypeId), rv = revBy.get(c.id) || [];
    switch(k){ case 'sort': return n.sfld || sdSortField(n); case 'question': return sdStripHTML(sdRenderCard(c, {browser: true}).q); case 'answer': return sdStripHTML(sdRenderCard(c, {browser: true}).a).replace(sdStripHTML(sdRenderCard(c, {browser: true}).q), '').trim();
      case 'card': return nt.kind === 'standard' ? (nt.templates[c.ord] || {}).name || '' : 'Cloze ' + (c.ord + 1); case 'note': return nt.name; case 'deck': return (SD.decks.get(c.deckId) || {}).name || '';
      case 'due': return c.type === 0 ? 1e9 + c.due : c.queue === 1 ? sdDayOfMs(c.due * 1000) : c.due; case 'ivl': return c.ivl; case 'ease': return c.factor; case 'difficulty': return c.memory ? c.memory.d : -1;
      case 'stability': return c.memory ? c.memory.s : -1; case 'retrievability': return sdRetrievability(c) ?? -1; case 'reps': return c.reps; case 'lapses': return c.lapses; case 'tags': return n.tags.join(' ');
      case 'created': return n.created || n.id; case 'modified': return n.mod || 0; case 'avgTime': return rv.length ? rv.reduce((a, r) => a + r.time, 0) / rv.length : 0;
      case 'totalTime': return rv.reduce((a, r) => a + r.time, 0); case 'firstReview': return rv.length ? rv[0].id : 0; } return ''; };
  const show = (c, k) => { const v = val(c, k);
    if(k === 'due') return c.queue < 0 ? `<span class="faint">(${c.queue === -1 ? 'suspended' : 'buried'})</span>` : c.type === 0 ? `new #${c.due}` : sdDayISO(c.queue === 1 ? sdDayOfMs(c.due * 1000) : c.due);
    if(k === 'ivl') return v ? sdSpan(v * 86400) : ''; if(k === 'ease') return v ? (v / 10).toFixed(0) + '%' : ''; if(k === 'difficulty') return v >= 0 ? (v * 10).toFixed(0) + '%' : '';
    if(k === 'stability') return v >= 0 ? v.toFixed(1) + 'd' : ''; if(k === 'retrievability') return v >= 0 ? (v * 100).toFixed(0) + '%' : '';
    if(k === 'created' || k === 'modified' || k === 'firstReview') return v ? new Date(v).toLocaleDateString() : ''; if(k === 'avgTime' || k === 'totalTime') return v ? (v / 1000).toFixed(1) + 's' : '';
    if(k === 'tags') return String(v).split(' ').filter(Boolean).map(t => `<span class="sx-tag sm" style="--tc:${sdTagColour(t)}">${esc(t)}</span>`).join(' ');
    return sdHighlight(esc(String(v).slice(0, 120)), b.q); };
  rows.sort((x, y) => { const a = val(x, b.sort), z = val(y, b.sort); const r = typeof a === 'number' && typeof z === 'number' ? a - z : String(a).localeCompare(String(z), undefined, {numeric: true}); return b.desc ? -r : r; });
  const PAGE = 300, total = rows.length; b.page = Math.min(b.page, Math.floor(total / PAGE));
  const view = rows.slice(b.page * PAGE, b.page * PAGE + PAGE);
  const saved = sdMisc('savedSearches', () => ({list: []})).list;
  const flags = sdMisc('flags');
  const tagTree = sdTagTree();
  root.innerHTML = `<div class="page sx-page sx-browse">${sdNav('browse')}
    <div class="sx-bgrid">
      <aside class="sx-side">
        <h4>Saved</h4>${saved.map((s, i) => `<a data-sxq="${esc(s.q)}">${esc(s.name)}</a><button class="tbtn sm" data-sxsdel="${i}">×</button>`).join('')}<button class="tbtn sm" id="brSave">save this search</button>
        <h4>Today</h4><a data-sxq="rated:1">Reviewed today</a><a data-sxq="added:1">Added today</a><a data-sxq="rated:1:1">Again today</a>
        <h4>State</h4>${['new', 'learn', 'review', 'due', 'suspended', 'buried', 'marked', 'leech'].map(s => `<a data-sxq="is:${s}">${s}</a>`).join('')}
        <h4>Flags</h4>${flags.names.map((n, i) => `<a data-sxq="flag:${i + 1}"><i class="sx-flag" style="background:${flags.colours[i]}"></i>${esc(n)}</a>`).join('')}
        <h4>Decks</h4>${sdDecks().map(d => `<a data-sxq='deck:"${esc(d.name)}"' style="padding-left:${(d.name.split('::').length - 1) * 12 + 6}px">${esc(sdDeckLeaf(d.name))}</a>`).join('')}
        <h4>Note types</h4>${[...SD.noteTypes.values()].map(t => `<a data-sxq='note:"${esc(t.name)}"'>${esc(t.name)}</a>`).join('')}
        <h4>Tags</h4><div class="sx-tagtree">${sdTagTreeHTML(tagTree, '')}</div>
      </aside>
      <main>
        <div class="sx-bbar"><input class="inp" id="brQ" value="${esc(b.q)}" placeholder="search — deck:x tag:y is:due prop:ivl>=30 &quot;exact phrase&quot; -not (a or b)" aria-label="Search">
          <div class="sx-seg"><button class="${b.mode === 'cards' ? 'on' : ''}" data-brmode="cards">Cards</button><button class="${b.mode === 'notes' ? 'on' : ''}" data-brmode="notes">Notes</button></div>
          <button class="tbtn" id="brCols">Columns</button></div>
        <div class="sx-bcount"><span>${total} ${b.mode}${b.sel.size ? ` · ${b.sel.size} selected` : ''}</span>
          <span class="sx-bulk">${b.sel.size ? [['deck', 'Change deck'], ['tagadd', 'Add tags'], ['tagdel', 'Remove tags'], ['suspend', 'Suspend'], ['flag', 'Flag'], ['forget', 'Forget'], ['due', 'Set due date'],
            ['repos', 'Reposition'], ['find', 'Find & replace'], ['copyf', 'Copy fields'], ['ntype', 'Change note type'], ['filtered', 'Filtered deck'], ['export', 'Export'], ['delete', 'Delete']].map(([k, n]) => `<button class="tbtn sm" data-brbulk="${k}">${n}</button>`).join('') : ''}</span></div>
        <div class="sx-table-wrap"><table class="sx-table"><thead><tr><th><input type="checkbox" id="brAll" aria-label="Select all"></th>${b.cols.map(k => `<th data-brsort="${k}" class="${b.sort === k ? (b.desc ? 'desc' : 'asc') : ''}">${SD_COLS[k]}</th>`).join('')}</tr></thead>
          <tbody>${view.map(c => `<tr data-brrow="${b.mode === 'notes' ? c.noteId : c.id}" class="${b.sel.has(b.mode === 'notes' ? c.noteId : c.id) ? 'sel' : ''}${c.queue === -1 ? ' susp' : ''}${c.flags & 7 ? ' flag' + (c.flags & 7) : ''}">
            <td><input type="checkbox"${b.sel.has(b.mode === 'notes' ? c.noteId : c.id) ? ' checked' : ''} aria-label="Select"></td>${b.cols.map(k => `<td>${show(c, k)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        ${total > PAGE ? `<div class="sx-pager"><button class="tbtn" data-brpage="-1" ${b.page ? '' : 'disabled'}>‹</button><span>${b.page * PAGE + 1}–${Math.min(total, (b.page + 1) * PAGE)} of ${total}</span><button class="tbtn" data-brpage="1" ${(b.page + 1) * PAGE < total ? '' : 'disabled'}>›</button></div>` : ''}
      </main>
      <aside class="sx-bprev" id="brPrev"></aside>
    </div></div>`;
  const rer = () => sdBrowserRoute(root, []);
  const q = root.querySelector('#brQ');
  q.onkeydown = e => { if(e.key === 'Enter'){ b.q = q.value; b.sel.clear(); b.page = 0; rer(); } };
  root.querySelectorAll('[data-sxq]').forEach(a => a.onclick = e => { e.preventDefault(); b.q = e.altKey || e.shiftKey ? `${b.q} ${a.dataset.sxq}` : a.dataset.sxq; b.sel.clear(); b.page = 0; rer(); });
  root.querySelectorAll('[data-sxsdel]').forEach(x => x.onclick = () => { const s = sdMisc('savedSearches'); s.list.splice(+x.dataset.sxsdel, 1); sdTouch('misc', s); rer(); });
  root.querySelector('#brSave').onclick = async () => { const n = await sdAsk('Name this search', b.q.slice(0, 30)); if(!n) return; const s = sdMisc('savedSearches', () => ({list: []})); s.list.push({name: n, q: b.q}); sdTouch('misc', s); rer(); };
  root.querySelectorAll('[data-brmode]').forEach(x => x.onclick = () => { b.mode = x.dataset.brmode; b.sel.clear(); rer(); });
  root.querySelectorAll('[data-brsort]').forEach(x => x.onclick = () => { if(b.sort === x.dataset.brsort) b.desc = !b.desc; else { b.sort = x.dataset.brsort; b.desc = false; } rer(); });
  root.querySelectorAll('[data-brpage]').forEach(x => x.onclick = () => { b.page += +x.dataset.brpage; rer(); });
  root.querySelector('#brAll').onchange = e => { view.forEach(c => { const id = b.mode === 'notes' ? c.noteId : c.id; e.target.checked ? b.sel.add(id) : b.sel.delete(id); }); rer(); };
  let lastClick = null;
  root.querySelectorAll('[data-brrow]').forEach(tr => tr.onclick = e => {
    const id = +tr.dataset.brrow;
    if(e.target.type === 'checkbox'){ e.target.checked ? b.sel.add(id) : b.sel.delete(id); tr.classList.toggle('sel', e.target.checked); return; }
    if(e.shiftKey && lastClick != null){ const all = [...root.querySelectorAll('[data-brrow]')].map(x => +x.dataset.brrow); const a = all.indexOf(lastClick), z = all.indexOf(id); all.slice(Math.min(a, z), Math.max(a, z) + 1).forEach(x => b.sel.add(x)); rer(); return; }
    if(e.metaKey || e.ctrlKey){ b.sel.has(id) ? b.sel.delete(id) : b.sel.add(id); rer(); return; }
    lastClick = id; root.querySelectorAll('.sx-table tr.cur').forEach(x => x.classList.remove('cur')); tr.classList.add('cur');
    sdBrowsePreview(root, b.mode === 'notes' ? sdCardsOf(id)[0] : SD.cards.get(id));
  });
  root.querySelectorAll('[data-brrow]').forEach(tr => tr.ondblclick = () => { const c = b.mode === 'notes' ? sdCardsOf(+tr.dataset.brrow)[0] : SD.cards.get(+tr.dataset.brrow); if(c){ S._sdReturn = location.hash; navigate('#/study/edit/' + c.noteId); } });
  root.querySelector('#brCols').onclick = e => sdMenu(e.currentTarget, Object.keys(SD_COLS).map(k => [(b.cols.includes(k) ? '✓ ' : '   ') + SD_COLS[k], () => { b.cols = b.cols.includes(k) ? b.cols.filter(x => x !== k) : b.cols.concat(k); rer(); }]));
  root.querySelectorAll('[data-brbulk]').forEach(x => x.onclick = () => sdBulk(x.dataset.brbulk, b, rer));
  root.querySelectorAll('[data-sxtagc]').forEach(x => x.onclick = e => { e.stopPropagation(); const tm = sdTagMeta(); const inp = document.createElement('input'); inp.type = 'color'; inp.value = tm.colours[x.dataset.sxtagc] || '#8a6a5e';
    inp.onchange = () => { tm.colours[x.dataset.sxtagc] = inp.value; sdTouch('misc', tm); rer(); }; inp.click(); });
  root.querySelectorAll('[data-sxtagdrag]').forEach(el => { el.draggable = true;
    el.ondragstart = e => e.dataTransfer.setData('text/sdtag', el.dataset.sxtagdrag);
    el.ondragover = e => e.preventDefault();
    el.ondrop = e => { e.preventDefault(); const from = e.dataTransfer.getData('text/sdtag'), to = el.dataset.sxtagdrag; if(!from || from === to || to.startsWith(from + '::')) return;
      sdRenameTag(from, to + '::' + from.split('::').pop()); rer(); }; });
}
function sdHighlight(html, q){
  const words = sdTokenize(q || '').filter(t => t.tok && !t.neg && !t.tok.includes(':') && t.tok.length > 1).map(t => t.tok.replace(/\*/g, ''));
  if(!words.length) return html;
  const re = new RegExp('(' + words.map(w => w.replace(/[.+^${}()|[\]\\?*]/g, '\\$&')).join('|') + ')', 'gi');
  return html.replace(re, '<mark>$1</mark>');
}
function sdTagTree(){
  const root = {}; sdAllTags().forEach((n, t) => { let node = root; t.split('::').forEach(p => { node[p] = node[p] || {}; node = node[p]; }); });
  return root;
}
function sdTagTreeHTML(tree, pre){
  const tm = sdTagMeta();
  return Object.keys(tree).sort().map(k => { const full = pre ? pre + '::' + k : k, kids = Object.keys(tree[k]).length, open = !tm.collapsed[full];
    return `<div class="sx-tt"><span data-sxtagdrag="${esc(full)}">${kids ? `<button class="tbtn sm" data-sxttw="${esc(full)}">${open ? '▾' : '▸'}</button>` : ''}<i class="sx-tdot" data-sxtagc="${esc(full)}" style="background:${sdTagColour(full)}" title="colour"></i><a data-sxq="tag:${esc(full)}">${esc(k)}</a></span>
      ${kids && open ? `<div class="sx-ttk">${sdTagTreeHTML(tree[k], full)}</div>` : ''}</div>`; }).join('');
}
function sdRenameTag(from, to){
  const lf = from.toLowerCase();
  SD.notes.forEach(n => { let ch = false; n.tags = n.tags.map(t => { const l = t.toLowerCase(); if(l === lf || l.startsWith(lf + '::')){ ch = true; return to + t.slice(from.length); } return t; }); if(ch){ n.mod = Date.now(); sdTouch('notes', n); } });
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-sxttw]'); if(!b) return; const tm = sdTagMeta(); tm.collapsed[b.dataset.sxttw] = !tm.collapsed[b.dataset.sxttw]; sdTouch('misc', tm); if(location.hash.startsWith('#/study/browse')) rerender(); });
async function sdBrowsePreview(root, c){
  const box = root.querySelector('#brPrev'); if(!box || !c) return;
  const n = SD.notes.get(c.noteId), nt = SD.noteTypes.get(n.noteTypeId);
  box.innerHTML = `<div class="sx-prevtop"><b>${esc(nt.name)}</b><button class="tbtn sm" id="bpEdit">Edit</button><button class="tbtn sm" id="bpInfo">Info</button><button class="tbtn sm" id="bpFlip">Flip</button></div>
    <iframe class="sx-card sx-prevcard" sandbox="allow-scripts" id="bpCard" title="Preview"></iframe>
    ${n.extra && n.extra.sourceGo ? `<a class="faint" href="${esc(n.extra.sourceGo)}">Open source: ${esc(n.extra.sourceLabel || 'where it came from')}</a>` : ''}`;
  let back = false;
  const draw = async () => { const r = sdRenderCard(c); box.querySelector('#bpCard').srcdoc = sdCardDoc(back ? 'a' : 'q', await sdResolveMedia(back ? r.a : r.q), r.css, {pad: '14px', scale: 0.8}); };
  box.querySelector('#bpEdit').onclick = () => { S._sdReturn = location.hash; navigate('#/study/edit/' + n.id); };
  box.querySelector('#bpInfo').onclick = () => sdCardInfo(c.id);
  box.querySelector('#bpFlip').onclick = () => { back = !back; draw(); };
  draw();
}
async function sdBulk(kind, b, rer){
  const cardIds = b.mode === 'notes' ? [...b.sel].flatMap(nid => sdCardsOf(nid).map(c => c.id)) : [...b.sel];
  const noteIds = [...new Set(cardIds.map(i => SD.cards.get(i)).filter(Boolean).map(c => c.noteId))];
  if(kind === 'deck'){ const decks = sdDecks().filter(d => !d.isFiltered); const v = await sdPick('Move to which deck?', decks.map(d => [d.id, d.name])); if(v == null) return;
    const cards = cardIds.map(i => SD.cards.get(i)); sdPushUndo('change deck', cards); cards.forEach(c => { if(c.odid) c.odid = +v; else c.deckId = +v; sdTouch('cards', c); }); }
  else if(kind === 'tagadd' || kind === 'tagdel'){ const v = await sdAsk(kind === 'tagadd' ? 'Tags to add' : 'Tags to remove', ''); if(!v) return; const tags = v.split(/\s+/).map(sdNormTag).filter(Boolean);
    noteIds.forEach(id => { const n = SD.notes.get(id); n.tags = kind === 'tagadd' ? [...new Set(n.tags.concat(tags))] : n.tags.filter(t => !tags.some(x => x.toLowerCase() === t.toLowerCase())); n.mod = Date.now(); sdTouch('notes', n); }); }
  else if(kind === 'suspend') sdSuspend(cardIds);
  else if(kind === 'flag'){ const f = sdMisc('flags'); const v = await sdPick('Flag', [[0, 'No flag']].concat(f.names.map((n, i) => [i + 1, n]))); if(v != null) sdFlag(cardIds, +v); }
  else if(kind === 'forget'){ if(confirm(`Reset ${cardIds.length} cards to new?`)) await sdForget(cardIds, confirm('Also reset their review and lapse counts?')); }
  else if(kind === 'due'){ const v = await sdAsk('Due in how many days?', '0', '0 = today; 3-7 = a random day in that range; add ! to also set the interval (e.g. 30!)'); if(v != null && !(await sdSetDue(cardIds, v))) toast('That is not a day count.'); }
  else if(kind === 'repos'){ const v = await sdAsk('Start position', '0', 'new cards only; they are placed in their current order'); if(v != null) sdReposition(cardIds, +v || 0, 1, confirm('Shift the other new cards along?')); }
  else if(kind === 'find') sdFindReplace(noteIds, rer);
  else if(kind === 'copyf') sdBatchCopy(noteIds, rer);
  else if(kind === 'ntype') sdChangeNoteType(noteIds, rer);
  else if(kind === 'filtered'){ const name = await sdAsk('A name for the filtered deck', 'From the browser'); if(!name) return;
    const d = sdEnsureDeck(name, {isFiltered: true, filter: {search: 'cid:' + cardIds.join(','), limit: cardIds.length, order: 'added', reschedule: true}}); const n = sdRebuildFiltered(d.id); toast(`${n} cards in ${name}.`); }
  else if(kind === 'export'){ const blob = new Blob([sdExportJson(null)], {type: 'application/json'}); void blob; sdExportSelection(noteIds); return; }
  else if(kind === 'delete'){ const undo = sdDeleteNotes(noteIds); b.sel.clear(); rer(); sdUndoToast(`${noteIds.length} notes deleted`, () => { undo(); rer(); }); return; }
  sdChanged('cards'); rer();
}
function sdPick(title, options){
  return new Promise(res => { openModal(`<h2 class="serif">${esc(title)}</h2><select class="sel" id="sxPick" size="${Math.min(12, options.length)}">${options.map(([v, n], i) => `<option value="${v}"${i === 0 ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn ghost" id="sxPickNo">Cancel</button><button class="btn primary" id="sxPickOk">OK</button></div>`, 'narrow');
    const s = document.getElementById('sxPick'); s.focus();
    document.getElementById('sxPickOk').onclick = () => { closeModals(); res(s.value); }; document.getElementById('sxPickNo').onclick = () => { closeModals(); res(null); };
    s.ondblclick = () => { closeModals(); res(s.value); }; });
}
function sdFindReplace(noteIds, rer){
  const fields = [...new Set(noteIds.flatMap(id => { const n = SD.notes.get(id); return SD.noteTypes.get(n.noteTypeId).fields.map(f => f.name); }))];
  openModal(`<h2 class="serif">Find and replace</h2><label class="sx-opt"><span>Find</span><input class="inp" id="frF"></label><label class="sx-opt"><span>Replace with</span><input class="inp" id="frR"></label>
    <label class="sx-opt"><span>In</span><select class="sel" id="frIn"><option value="">every field</option><option value="__tags">tags</option>${fields.map(f => `<option>${esc(f)}</option>`).join('')}</select></label>
    <label class="sx-chk"><input type="checkbox" id="frRe"> regular expression</label><label class="sx-chk"><input type="checkbox" id="frCase"> match case</label>
    <div class="faint" id="frPrev"></div><div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" onclick="closeModals()">Cancel</button><button class="btn primary" id="frOk">Replace</button></div>`, 'narrow');
  const run = apply => { const f = document.getElementById('frF').value, r = document.getElementById('frR').value, where = document.getElementById('frIn').value;
    let re; try { re = new RegExp(document.getElementById('frRe').checked ? f : f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), document.getElementById('frCase').checked ? 'g' : 'gi'); } catch(e){ return -1; }
    let n = 0; const before = [];
    noteIds.forEach(id => { const note = SD.notes.get(id), nt = SD.noteTypes.get(note.noteTypeId);
      if(where === '__tags'){ const t = note.tags.map(x => x.replace(re, r)); if(t.join() !== note.tags.join()){ n++; if(apply){ before.push(JSON.parse(JSON.stringify(note))); note.tags = t; sdTouch('notes', note); } } return; }
      const nf = note.fields.map((v, i) => !where || nt.fields[i].name === where ? v.replace(re, r) : v);
      if(nf.join('\x1f') !== note.fields.join('\x1f')){ n++; if(apply){ before.push(JSON.parse(JSON.stringify(note))); note.fields = nf; sdSaveNote(note); } } });
    if(apply) sdPushUndo('find and replace', [], () => before.forEach(bn => { SD.notes.set(bn.id, bn); sdTouch('notes', bn); }));
    return n; };
  document.getElementById('frF').oninput = () => { const n = run(false); document.getElementById('frPrev').textContent = n < 0 ? 'That is not a valid expression.' : `${n} notes would change.`; };
  document.getElementById('frOk').onclick = () => { const n = run(true); closeModals(); toast(`${n} notes changed.`); rer(); };
}
/* copy or transform one field into another, with a preview */
function sdBatchCopy(noteIds, rer){
  const nts = [...new Set(noteIds.map(id => SD.notes.get(id).noteTypeId))];
  if(nts.length !== 1){ toast('Choose notes of one note type.'); return; }
  const nt = SD.noteTypes.get(nts[0]); const opts = nt.fields.map((f, i) => `<option value="${i}">${esc(f.name)}</option>`).join('');
  openModal(`<h2 class="serif">Copy between fields</h2><div class="sx-row"><label>From <select class="sel" id="bcF">${opts}</select></label><label>To <select class="sel" id="bcT">${opts}</select></label></div>
    <label class="sx-opt"><span>How</span><select class="sel" id="bcHow"><option value="replace">replace what is there</option><option value="append">append</option><option value="prepend">prepend</option><option value="regex">transform with a regular expression</option></select></label>
    <div class="sx-row"><input class="inp" id="bcRe" placeholder="pattern"><input class="inp" id="bcTo" placeholder="replacement ($1…)"></div>
    <div class="sx-bcprev" id="bcPrev"></div><div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" onclick="closeModals()">Cancel</button><button class="btn primary" id="bcOk">Apply to ${noteIds.length}</button></div>`, 'narrow');
  const $ = i => document.getElementById(i);
  $('bcT').value = Math.min(1, nt.fields.length - 1);
  const calc = n => { const f = +$('bcF').value, t = +$('bcT').value, src = n.fields[f] || '', how = $('bcHow').value;
    let v = src; if(how === 'regex'){ try { v = src.replace(new RegExp($('bcRe').value, 'g'), $('bcTo').value); } catch(e){ v = src; } }
    return how === 'append' ? (n.fields[t] || '') + v : how === 'prepend' ? v + (n.fields[t] || '') : v; };
  const prev = () => { $('bcPrev').innerHTML = noteIds.slice(0, 3).map(id => { const n = SD.notes.get(id); return `<div><span class="faint">${esc(sdStripHTML(n.fields[+$('bcT').value] || '').slice(0, 40)) || '(empty)'}</span> → ${esc(sdStripHTML(calc(n)).slice(0, 60))}</div>`; }).join(''); };
  ['bcF', 'bcT', 'bcHow', 'bcRe', 'bcTo'].forEach(i => $(i).oninput = prev); prev();
  $('bcOk').onclick = () => { const before = noteIds.map(id => JSON.parse(JSON.stringify(SD.notes.get(id))));
    noteIds.forEach(id => { const n = SD.notes.get(id); n.fields[+$('bcT').value] = calc(n); sdSaveNote(n); });
    sdPushUndo('copy fields', [], () => before.forEach(bn => { SD.notes.set(bn.id, bn); sdTouch('notes', bn); }));
    closeModals(); toast('Done.'); rer(); };
}
function sdChangeNoteType(noteIds, rer){
  const from = SD.noteTypes.get(SD.notes.get(noteIds[0]).noteTypeId);
  if(noteIds.some(id => SD.notes.get(id).noteTypeId !== from.id)){ toast('Choose notes of one note type.'); return; }
  const types = [...SD.noteTypes.values()];
  openModal(`<h2 class="serif">Change note type</h2><label class="sx-opt"><span>To</span><select class="sel" id="cnT">${types.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></label><div id="cnMap"></div>
    <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" onclick="closeModals()">Cancel</button><button class="btn primary" id="cnOk">Change ${noteIds.length}</button></div>`, 'narrow');
  const draw = () => { const to = SD.noteTypes.get(+document.getElementById('cnT').value);
    document.getElementById('cnMap').innerHTML = to.fields.map((f, i) => `<label class="sx-opt"><span>${esc(f.name)} ←</span><select class="sel" data-cnm="${i}"><option value="">(nothing)</option>${from.fields.map((g, k) => `<option value="${k}"${k === i ? ' selected' : ''}>${esc(g.name)}</option>`).join('')}</select></label>`).join(''); };
  document.getElementById('cnT').onchange = draw; draw();
  document.getElementById('cnOk').onclick = () => { const to = SD.noteTypes.get(+document.getElementById('cnT').value), map = [...document.querySelectorAll('[data-cnm]')].map(s => s.value === '' ? null : +s.value);
    noteIds.forEach(id => { const n = SD.notes.get(id); n.fields = map.map(k => k == null ? '' : n.fields[k] || ''); n.noteTypeId = to.id;
      const want = new Set(sdWantedOrds(n)); sdCardsOf(n.id).forEach(c => { if(!want.has(c.ord)){ SD.cards.delete(c.id); sdUnindexCard(c); sdDrop('cards', c.id); } }); sdSaveNote(n); });
    closeModals(); toast('Changed.'); rer(); };
}
function sdExportSelection(noteIds){
  const nset = new Set(noteIds), cards = [...SD.cards.values()].filter(c => nset.has(c.noteId)), cids = new Set(cards.map(c => c.id));
  const json = JSON.stringify({studyDeck: 2, exportedAt: new Date().toISOString(), noteTypes: [...new Set(noteIds.map(i => SD.notes.get(i).noteTypeId))].map(i => SD.noteTypes.get(i)),
    decks: [...new Set(cards.map(c => c.deckId))].map(i => SD.decks.get(i)), presets: [...SD.presets.values()], notes: noteIds.map(i => SD.notes.get(i)), cards, revlog: SD.revlog.filter(r => cids.has(r.cardId))});
  sdDownload(new Blob([json], {type: 'application/json'}), 'study-selection.json');
}
