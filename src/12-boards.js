/* ============================================================
   BOARDS — the sensory half of a vision.
   The Vision Canvas holds what you can argue about; a board holds
   what you can only feel. Any record can have one: a value, a
   skill, a project, a goal, a chapter, a person — and there is a
   main board that belongs to no one thing.
   ============================================================ */
function boardId(kind, id){ return id ? `${kind}:${id}` : kind; }
function getBoard(key){
  S.boards = Array.isArray(S.boards) ? S.boards : [];
  let b = S.boards.find(x => x.id === key);
  if(!b){ b = {id:key, items:[], note:''}; S.boards.push(b); }
  b.items = Array.isArray(b.items) ? b.items : [];
  return b;
}
function boardCount(key){ return (S.boards||[]).find(x => x.id === key)?.items.length || 0; }
const PIN_SPANS = [['s','small'],['m','medium'],['l','large'],['w','wide']];
function boardHTML(key, {title = 'Board', hint = '', compact = false} = {}){
  const b = getBoard(key);
  return `<div class="board-wrap" data-board="${esc(key)}">
    <div class="row between"><span class="sc" style="margin:0">${esc(title)}</span><span class="mono">${b.items.length} pinned</span></div>
    ${hint ? `<p class="muted" style="font-size:.85rem;margin:4px 0 0">${esc(hint)}</p>` : ''}
    <div class="row" style="gap:8px;margin:12px 0">
      <button class="btn sm primary" data-bupload="${esc(key)}">＋ Upload images</button>
      <button class="btn sm ghost" data-blink="${esc(key)}">＋ From a link</button>
      <button class="btn sm ghost" data-bword="${esc(key)}">＋ A word</button>
      <input type="file" accept="image/*" multiple hidden data-bfile="${esc(key)}">
    </div>
    <div class="board ${compact ? 'compact' : ''}" data-bgrid="${esc(key)}">
      ${b.items.length ? b.items.map((it,i) => `<figure class="pin sp-${it.span || 'm'} ${it.kind === 'word' ? 'word' : ''}" draggable="true" data-pin="${it.id}" style="--rot:${((it.id.charCodeAt(0) % 5) - 2) * .55}deg">
          ${it.kind === 'word'
            ? `<div class="pin-word">${esc(it.caption || '')}</div>`
            : `<img src="${esc(it.src)}" alt="${esc(it.caption || '')}" loading="lazy" data-blb="${it.id}">`}
          <figcaption>${ed(`boards.#${key}.items.${i}.caption`, {ph:'a word about it'})}</figcaption>
          <div class="pin-ctl">
            <button class="pin-btn" data-bspan="${it.id}" title="change size">⤢</button>
            <button class="pin-btn" data-bdel="${it.id}" title="remove">×</button>
          </div>
        </figure>`).join('')
        : `<div class="empty board-empty">Nothing pinned yet. Photographs, a room, a face, a colour, a single word — whatever makes the thing feel real before you can argue for it.</div>`}
    </div>
    <div class="field" style="margin-top:14px"><label>What this board is about</label>${ed(`boards.#${key}.note`, {multi:true, ph:'One or two lines, for the day the images stop speaking for themselves.'})}</div>
  </div>`;
}
function bindBoard(root, after){
  const redraw = after || rerender;
  $$('[data-bupload]', root).forEach(b => b.onclick = () => root.querySelector(`[data-bfile="${CSS.escape(b.dataset.bupload)}"]`)?.click());
  $$('[data-bfile]', root).forEach(inp => inp.onchange = e => {
    const key = inp.dataset.bfile, files = e.target.files; e.target.value = '';
    if(!files?.length) return;
    readImages(files, src => { getBoard(key).items.push({id:uid(), kind:'image', src, caption:'', span:'m'}); saveNow(); sound('success'); redraw(); });
  });
  $$('[data-blink]', root).forEach(b => b.onclick = () => {
    const key = b.dataset.blink;
    const m = openModal(`<h2>Pin from a link</h2><div class="stack"><div class="field"><label>Image address</label><input class="inp mono" id="bUrl" placeholder="https://…/photograph.jpg" autofocus></div><div class="field"><label>Caption</label><input class="inp" id="bCap" placeholder="optional"></div><p class="faint" style="font-size:.76rem">Linked images are fetched from wherever they live, so they can disappear if that page does. Uploading keeps a copy in your own database.</p></div><div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn primary" id="bAdd">Pin it</button></div>`, 'narrow');
    const go = () => { const u = m.querySelector('#bUrl').value.trim(); if(!u) return; getBoard(key).items.push({id:uid(), kind:'image', src:u, caption:m.querySelector('#bCap').value.trim(), span:'m'}); saveNow(); m.remove(); sound('success'); redraw(); };
    m.querySelector('#bAdd').onclick = go; m.querySelector('#bUrl').onkeydown = e => { if(e.key === 'Enter') go(); };
  });
  $$('[data-bword]', root).forEach(b => b.onclick = () => {
    const key = b.dataset.bword;
    const m = openModal(`<h2>Pin a word</h2><input class="inp serif-lg" id="bWord" placeholder="quiet · eleven seats · rain" autofocus><div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn primary" id="bwAdd">Pin it</button></div>`, 'narrow');
    const go = () => { const w = m.querySelector('#bWord').value.trim(); if(!w) return; getBoard(key).items.push({id:uid(), kind:'word', src:'', caption:w, span:'s'}); saveNow(); m.remove(); sound('success'); redraw(); };
    m.querySelector('#bwAdd').onclick = go; m.querySelector('#bWord').onkeydown = e => { if(e.key === 'Enter') go(); };
  });
  $$('[data-bspan]', root).forEach(b => b.onclick = e => { e.stopPropagation();
    const key = b.closest('[data-board]').dataset.board, it = getBoard(key).items.find(x => x.id === b.dataset.bspan);
    const order = PIN_SPANS.map(s => s[0]); it.span = order[(order.indexOf(it.span || 'm') + 1) % order.length]; saveNow(); redraw(); });
  $$('[data-bdel]', root).forEach(b => b.onclick = e => { e.stopPropagation();
    const key = b.closest('[data-board]').dataset.board, bd = getBoard(key), it = bd.items.find(x => x.id === b.dataset.bdel);
    requestDelete({label: it.caption || 'this pin', node: b.closest('.pin'), remove: () => spliceOut(bd.items, x => x.id === it.id), after: redraw}); });
  $$('[data-blb]', root).forEach(img => img.onclick = () => lightbox(img.src, img.alt));
  // drag to rearrange
  let drag = null;
  $$('.pin', root).forEach(pin => {
    pin.addEventListener('dragstart', ev => { if(ev.target.closest('.ed')){ ev.preventDefault(); return; } drag = pin.dataset.pin; pin.classList.add('dragging'); ev.dataTransfer.effectAllowed = 'move'; });
    pin.addEventListener('dragend', () => { pin.classList.remove('dragging'); drag = null; $$('.pin.over', root).forEach(p => p.classList.remove('over')); });
    pin.addEventListener('dragover', ev => { ev.preventDefault(); if(drag && drag !== pin.dataset.pin) pin.classList.add('over'); });
    pin.addEventListener('dragleave', () => pin.classList.remove('over'));
    pin.addEventListener('drop', ev => { ev.preventDefault(); pin.classList.remove('over'); if(!drag || drag === pin.dataset.pin) return;
      const key = pin.closest('[data-board]').dataset.board, items = getBoard(key).items;
      const from = items.findIndex(x => x.id === drag), to = items.findIndex(x => x.id === pin.dataset.pin);
      if(from < 0 || to < 0) return; items.splice(to, 0, items.splice(from, 1)[0]); saveNow(); redraw(); });
  });
}
/* a small strip for panels: shows what is pinned and opens the full board */
function boardStrip(key, label){
  const b = getBoard(key); const n = b.items.length;
  return `<div class="vp-sec"><div class="row between"><span class="sc">${esc(label || 'Board')}</span><button class="btn sm ghost" data-bopen="${esc(key)}">${n ? 'open the board' : 'start a board'}</button></div>
    ${n ? `<div class="board-strip">${b.items.slice(0,8).map(it => it.kind === 'word' ? `<span class="strip-word">${esc(it.caption)}</span>` : `<img src="${esc(it.src)}" alt="${esc(it.caption||'')}" loading="lazy">`).join('')}${n > 8 ? `<span class="strip-more">+${n-8}</span>` : ''}</div>`
      : `<p class="faint" style="font-size:.8rem;margin:6px 0 0">The written half is above. This is the half you can only feel — pin images, a colour, a single word.</p>`}</div>`;
}
function bindBoardStrip(root, titleFor){
  $$('[data-bopen]', root).forEach(b => b.onclick = () => openBoardPanel(b.dataset.bopen, titleFor ? titleFor(b.dataset.bopen) : 'Board'));
}
function openBoardPanel(key, title){
  const p = openPanel(`<div class="mono">board</div><h2>${esc(title || 'Board')}</h2>${boardHTML(key, {title:'Pinned', hint:'Drag to rearrange. Click a pin to see it large, ⤢ to resize it.'})}`, 'board-panel');
  const redraw = () => { const scroll = p.scrollTop; openBoardPanel(key, title); const np = $('#panel'); if(np) np.scrollTop = scroll; };
  bindBoard(p, redraw);
}
/* ---------- the standalone board room ---------- */
routes.board = function(root, params){
  const key = params[0] ? decodeURIComponent(params[0]) : 'main';
  const named = boardTitle(key);
  registerPageEntry({pageName:'Board', addLabel:'Pin an image', defaultEntryType:'board', prefilledFields:{}, options:[
    {icon:'▣', label:'Upload images', desc:'From this device, kept in your own database.', run:()=>document.querySelector(`[data-bupload="${CSS.escape(key)}"]`)?.click()},
    {icon:'🔗', label:'From a link', desc:'Anything already on the web.', run:()=>document.querySelector(`[data-blink="${CSS.escape(key)}"]`)?.click()},
    {icon:'✎', label:'A word', desc:'Sometimes one word does more than a photograph.', run:()=>document.querySelector(`[data-bword="${CSS.escape(key)}"]`)?.click()}]});
  const others = (S.boards||[]).filter(b => b.items.length && b.id !== key);
  root.innerHTML = `<div class="page">
    <div class="page-head"><h1>${esc(named)}</h1><div class="sub">The Vision Canvas is what you can argue for. This is what you can only feel — and research is fairly clear that looking at it changes what you do.</div></div>
    ${boardHTML(key, {title:'Pinned', hint:'Drag to rearrange. Click a pin to see it large, ⤢ to cycle its size.'})}
    ${others.length ? `<section class="section rv"><span class="sc">Other boards</span><div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px">${others.map(b => `<a class="chip click" href="#/board/${encodeURIComponent(b.id)}">${esc(boardTitle(b.id))} <span class="mono">${b.items.length}</span></a>`).join('')}</div></section>` : ''}
  </div>`;
  bindBoard(root);
};
function boardTitle(key){
  if(key === 'main') return 'The Board';
  const [kind, id] = key.split(':');
  const name = {value:() => byId(S.values,id)?.name, skill:() => byId(S.skills,id)?.name, project:() => byId(S.projects,id)?.name,
    vision:() => byId(S.visions,id)?.name, era:() => byId(S.visionEras,id)?.name, stage:() => byId(S.stages,id)?.name,
    person:() => byId(S.people,id)?.name}[kind];
  const n = name ? name() : null;
  return n ? `${n} — board` : 'Board';
}
