/* ============================================================
   THE KNOWLEDGE TREE — links.

   [[Title]] and [[Title|what to show]] to another page: blue if it exists
   (aliases resolve), red if it does not — a red link opens a new stub with
   the title filled in. [[library:Title]], [[journal:YYYY-MM-DD]] and
   [[writing:Title]] reach into the other rooms without copying anything.

   Typing [[ in any Tree text box opens a list of titles and aliases, so a
   page is found rather than made twice.
   ============================================================ */

function treeFindEntry(room, target){
  const t = String(target || '').trim().toLowerCase();
  if(room === 'library') return (S.entries || []).filter(e => e.type === 'media' && (e.title || '').trim().toLowerCase() === t)[0] || null;
  if(room === 'writing') return (S.entries || []).filter(e => e.type === 'writing' && (e.title || '').trim().toLowerCase() === t)[0] || null;
  return null;
}
function treeJournalOn(date){
  const J = treeJournalTypes();
  return (S.entries || []).filter(e => J.has(e.type) && String(e.occurredAt || e.createdAt || '').slice(0, 10) === date);
}
/* the HTML for one link */
function treeLinkHTML(l){
  if(l.room === 'tree'){
    const n = treeResolve(l.target);
    return n ? `<a class="tr-link" href="${treeUrl(n)}" title="${esc(n.title)}">${esc(l.display)}</a>`
      : `<a class="tr-link red" href="#" data-trnew="${esc(l.target)}" title="No page yet — click to start one">${esc(l.display)}</a>`;
  }
  if(l.room === 'journal'){
    const ok = /^\d{4}-\d{2}-\d{2}$/.test(l.target) && treeJournalOn(l.target).length;
    return `<a class="tr-link room journal${ok ? '' : ' red'}" href="#" data-trjournal="${esc(l.target)}" title="The journal on ${esc(l.target)}">${esc(l.display)}</a>`;
  }
  const e = treeFindEntry(l.room, l.target);
  if(!e) return `<span class="tr-link room ${l.room} red" title="Nothing in the ${l.room === 'library' ? 'Library' : 'Writing Studio'} by that title">${esc(l.display)}</span>`;
  return l.room === 'library' ? `<a class="tr-link room library" href="#/journals/library" data-trmedia="${e.id}">${esc(l.display)}</a>`
    : `<a class="tr-link room writing" href="#/writing/${e.id}">${esc(l.display)}</a>`;
}
/* the body: markdown, then the links */
function treeRender(text){
  const src = String(text || '');
  const parts = [], keys = [];
  /* links out first, so the markdown does not touch them; placeholders back in after */
  const held = src.replace(TREE_LINK_RE, m => { const l = treeParseLinks(m)[0]; keys.push(treeLinkHTML(l)); return `\u0001${keys.length - 1}\u0002`; });
  let html = typeof md === 'function' ? md(held) : esc(held).replace(/\n/g, '<br>');
  html = html.replace(/\u0001(\d+)\u0002/g, (_, i) => keys[+i]);
  void parts;
  return html;
}
function treeBindLinks(root){
  root.querySelectorAll('[data-trnew]').forEach(a => a.onclick = ev => { ev.preventDefault(); treeNewPageDialog({title: a.dataset.trnew, fromId: (root.dataset && root.dataset.trfrom) || null}); });
  root.querySelectorAll('[data-trmedia]').forEach(a => a.onclick = ev => { ev.preventDefault(); navigate('#/journals/library'); setTimeout(() => { if(typeof openMediaPanel === 'function') openMediaPanel(a.dataset.trmedia); }, 150); });
  root.querySelectorAll('[data-trjournal]').forEach(a => a.onclick = ev => { ev.preventDefault(); treeJournalDay(a.dataset.trjournal); });
}
function treeJournalDay(date){
  const list = treeJournalOn(date);
  openModal(`<h2 class="serif">The journal, ${esc(date)}</h2>${list.length ? list.map(e => typeof entryCard === 'function' ? entryCard(e, {tools: false}) : `<p>${esc(e.title || '')}</p>`).join('') : '<p class="faint">Nothing written that day.</p>'}`);
}

/* ---------- [[ autocomplete ---------- */
function treeSuggestTitles(q, limit){
  const s = treeSlug(q), out = [];
  const score = (name, slug) => { if(!q) return 1; if(slug === s) return 100; if(slug.startsWith(s)) return 50; if(slug.includes(s)) return 20;
    const words = s.split('-'); return words.every(w => slug.includes(w)) ? 10 : 0; };
  S.treeNodes.forEach(n => { const v = score(n.title, n.slug); if(v) out.push({v, title: n.title, node: n, alias: null}); });
  S.treeAliases.forEach(a => { const n = treeNode(a.nodeId); if(!n) return; const v = score(a.title || a.alias, a.alias); if(v) out.push({v: v - 1, title: a.title || a.alias, node: n, alias: true}); });
  const seen = new Set();
  return out.sort((a, b) => b.v - a.v || a.title.localeCompare(b.title)).filter(x => { const k = x.node.id + (x.alias ? ':' + x.title : ''); if(seen.has(k)) return false; seen.add(k); return true; }).slice(0, limit || 8);
}
function treeAutocomplete(ta){
  if(!ta || ta.dataset.trac) return; ta.dataset.trac = '1';
  let box = null, items = [], at = 0, start = -1;
  const close = () => { if(box){ box.remove(); box = null; } start = -1; };
  const place = () => {
    const r = ta.getBoundingClientRect();
    box.style.left = Math.min(innerWidth - 300, r.left + 8) + 'px';
    box.style.top = Math.min(innerHeight - 260, r.bottom - 4) + 'px';
  };
  const paint = () => {
    box.innerHTML = items.length ? items.map((x, i) => `<button type="button" class="${i === at ? 'on' : ''}" data-i="${i}"><b>${esc(x.title)}</b>${x.alias ? ` <span class="faint">→ ${esc(x.node.title)}</span>` : ''}<span class="faint"> ${TREE_KINDS[x.node.kind] || ''}</span></button>`).join('')
      : `<div class="faint">No page yet — keep typing, and close with ]] to make a red link.</div>`;
    box.querySelectorAll('button').forEach(b => b.onmousedown = ev => { ev.preventDefault(); pick(+b.dataset.i); });
  };
  const pick = i => {
    const x = items[i]; if(!x) return;
    const v = ta.value, end = ta.selectionStart;
    const title = x.alias ? x.node.title : x.title;
    ta.value = v.slice(0, start) + '[[' + title + ']]' + v.slice(end);
    const pos = start + title.length + 4; ta.setSelectionRange(pos, pos); ta.dispatchEvent(new Event('input')); close(); ta.focus();
  };
  ta.addEventListener('input', () => {
    const v = ta.value, pos = ta.selectionStart;
    const before = v.slice(0, pos), open = before.lastIndexOf('[['), shut = before.lastIndexOf(']]');
    if(open < 0 || shut > open || /\n/.test(before.slice(open))){ close(); return; }
    const q = before.slice(open + 2);
    if(/^(library|journal|writing):/i.test(q) || q.includes('|')){ close(); return; }
    start = open; items = treeSuggestTitles(q, 8); at = 0;
    if(!box){ box = document.createElement('div'); box.className = 'tr-ac'; box.setAttribute('role', 'listbox'); document.body.appendChild(box); }
    place(); paint();
  });
  ta.addEventListener('keydown', ev => {
    if(!box) return;
    if(ev.key === 'ArrowDown'){ ev.preventDefault(); at = Math.min(items.length - 1, at + 1); paint(); }
    else if(ev.key === 'ArrowUp'){ ev.preventDefault(); at = Math.max(0, at - 1); paint(); }
    else if((ev.key === 'Enter' || ev.key === 'Tab') && items.length){ ev.preventDefault(); pick(at); }
    else if(ev.key === 'Escape'){ ev.stopPropagation(); close(); }
  });
  ta.addEventListener('blur', () => setTimeout(close, 150));
}
