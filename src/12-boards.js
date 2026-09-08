/* ============================================================
   IMAGERY — pictures belong to the thing, not to a board.

   A board was a separate room you had to go and visit, and it
   answered a question nobody asks ("where are my pins?"). What
   people actually want is for the record itself to look like
   the thing it is about. So every record can carry images, and
   the first of them becomes the ground its own card is printed
   on — visible in the list, before anything is opened.
   ============================================================ */

/* Every record type that can carry imagery, where its records live, and the
   field they keep pictures in. An entry has always had `media`; the rest keep
   `images`. Naming the field here is what lets one set of controls serve both. */
const IMG_OWNERS = {
  project: {list: () => S.projects, field: 'images', path: 'projects'},
  skill:   {list: () => S.skills,   field: 'images', path: 'skills'},
  value:   {list: () => S.values,   field: 'images', path: 'values'},
  person:  {list: () => S.people,   field: 'images', path: 'people'},
  entry:   {list: () => S.entries,  field: 'media',  path: 'entries'},
};
function imgOwner(kind, id){ const o = IMG_OWNERS[kind]; return o ? byId(o.list(), id) : null; }
/* which field a record keeps its pictures in — found by looking for the record
   rather than being told, so callers that only hold the object still work */
function imgField(rec){
  if(!rec) return 'images';
  for(const o of Object.values(IMG_OWNERS)) if(o.list().includes(rec)) return o.field;
  return Array.isArray(rec.media) && !Array.isArray(rec.images) ? 'media' : 'images';
}
function recImages(rec, kind){
  if(!rec) return [];
  const f = kind && IMG_OWNERS[kind] ? IMG_OWNERS[kind].field : imgField(rec);
  if(!Array.isArray(rec[f])) rec[f] = [];
  return rec[f];
}

/* ---------- the one-time fold-in ----------
   Boards are gone, but what was pinned to them is not: every image on a
   record's old board becomes an image on the record itself, in order. Words
   and goal cards had no home on a card, so they are dropped rather than
   silently turned into something they were not. */
function migrateBoards(){
  if(!Array.isArray(S.boards) || !S.boards.length){ S.boards = []; return; }
  S.boards.forEach(b => {
    const [kind, id] = String(b.id || '').split(':');
    const rec = id ? imgOwner(kind, id) : null;
    if(!rec) return;
    const have = new Set(recImages(rec).map(x => x.src));
    (b.items || []).forEach(it => {
      const src = typeof it.src === 'string' ? it.src : '';
      if(it.kind !== 'image' || !src || have.has(src)) return;
      recImages(rec).push({id: it.id || uid(), src, caption: it.caption || ''});
      have.add(src);
    });
  });
  S.boards = [];
}

/* ---------- the backdrop ----------
   Behind the card, not in it: the first image at low opacity under a scrim
   that keeps every word on top of it readable in either theme. */
function imageBackdropHTML(rec){
  const imgs = recImages(rec);
  if(!imgs.length) return '';
  return `<div class="rec-plate" aria-hidden="true">
    <div class="rec-plate-img" style="background-image:url(&quot;${esc(imgs[0].src)}&quot;)"></div>
    <div class="rec-plate-wash"></div>
  </div>`;
}
const hasImages = rec => recImages(rec).length > 0;

/* ---------- the control ----------
   One button and a hidden input, wherever a record is being edited. */
function imageAddHTML(kind, id, {label = null} = {}){
  const rec = imgOwner(kind, id); const n = recImages(rec, kind).length;
  return `<span class="rec-img-tools">
    <button class="btn sm ghost" data-imgadd="${kind}:${id}">${label || (n ? `▣ images · ${n}` : '▣ add an image')}</button>
    ${n ? `<button class="btn sm ghost" data-imgman="${kind}:${id}">arrange</button>` : ''}
    <input type="file" accept="image/*" multiple hidden data-imgfile="${kind}:${id}">
  </span>`;
}
/* the strip that lets you caption, reorder and remove what is there */
function imageStripHTML(kind, id){
  const rec = imgOwner(kind, id); const imgs = recImages(rec, kind);
  if(!imgs.length) return '';
  const path = IMG_OWNERS[kind].path, field = IMG_OWNERS[kind].field;
  return `<div class="rec-img-strip" data-imgstrip="${kind}:${id}">
    ${imgs.map((it, i) => `<figure class="rec-img ${i === 0 ? 'lead' : ''}" draggable="true" data-imgid="${it.id}">
      <img src="${esc(it.src)}" alt="${esc(it.caption || '')}" loading="lazy" data-imglb="${it.id}">
      <figcaption>${ed(`${path}.#${id}.${field}.${i}.caption`, {ph:'a word about it'})}</figcaption>
      <button class="rec-img-x" data-imgdel="${kind}:${id}:${it.id}" title="remove">×</button>
      ${i === 0 ? '<span class="rec-img-lead mono">the ground</span>' : ''}
    </figure>`).join('')}
  </div>
  <p class="faint" style="font-size:.76rem;margin:6px 0 0">The first image is the one the card is printed on. Drag to reorder.</p>`;
}

/* ---------- one binder for all of it ---------- */
function bindRecImages(root, after){
  const redraw = after || rerender;
  const parse = v => { const i = v.indexOf(':'); return [v.slice(0, i), v.slice(i + 1)]; };

  $$('[data-imgadd]', root).forEach(b => b.onclick = ev => { ev.stopPropagation();
    root.querySelector(`[data-imgfile="${CSS.escape(b.dataset.imgadd)}"]`)?.click(); });

  $$('[data-imgfile]', root).forEach(inp => inp.onchange = ev => {
    const [kind, id] = parse(inp.dataset.imgfile);
    /* FileList is live: resetting the input to allow re-picking the same file
       empties the very list just read from it. Copy first, then reset. */
    const files = Array.from(ev.target.files || []); ev.target.value = '';
    if(!files.length) return;
    const rec = imgOwner(kind, id); if(!rec) return;
    /* readImages yields a photo record, not a string — reading it as a src is
       how every uploaded image used to arrive as "[object Object]" */
    readImages(files, photo => { recImages(rec, kind).push(Object.assign({}, photo, {id: photo.id || uid(), caption: photo.caption || ''}));
      saveNow(); sound('success'); redraw(); });
  });

  $$('[data-imgman]', root).forEach(b => b.onclick = ev => { ev.stopPropagation();
    const [kind, id] = parse(b.dataset.imgman); openImagePanel(kind, id); });

  $$('[data-imgdel]', root).forEach(b => b.onclick = ev => { ev.stopPropagation();
    const s = b.dataset.imgdel; const i = s.indexOf(':'), j = s.lastIndexOf(':');
    const kind = s.slice(0, i), id = s.slice(i + 1, j), imgId = s.slice(j + 1);
    const rec = imgOwner(kind, id); if(!rec) return;
    const it = recImages(rec, kind).find(x => x.id === imgId); if(!it) return;
    requestDelete({label: it.caption || 'this image', node: b.closest('.rec-img'),
      remove: () => spliceOut(recImages(rec, kind), x => x.id === imgId), after: redraw}); });

  $$('[data-imglb]', root).forEach(img => img.onclick = ev => { ev.stopPropagation(); lightbox(img.src, img.alt); });

  /* drag to reorder — which image leads decides what the card looks like */
  let drag = null;
  $$('.rec-img', root).forEach(fig => {
    fig.addEventListener('dragstart', ev => { if(ev.target.closest('.ed')){ ev.preventDefault(); return; }
      drag = fig.dataset.imgid; fig.classList.add('dragging'); ev.dataTransfer.effectAllowed = 'move'; });
    fig.addEventListener('dragend', () => { fig.classList.remove('dragging'); drag = null;
      $$('.rec-img.over', root).forEach(x => x.classList.remove('over')); });
    fig.addEventListener('dragover', ev => { ev.preventDefault(); if(drag && drag !== fig.dataset.imgid) fig.classList.add('over'); });
    fig.addEventListener('dragleave', () => fig.classList.remove('over'));
    fig.addEventListener('drop', ev => { ev.preventDefault(); fig.classList.remove('over');
      if(!drag || drag === fig.dataset.imgid) return;
      const [kind, id] = parse(fig.closest('[data-imgstrip]').dataset.imgstrip);
      const arr = recImages(imgOwner(kind, id), kind);
      const from = arr.findIndex(x => x.id === drag), to = arr.findIndex(x => x.id === fig.dataset.imgid);
      if(from < 0 || to < 0) return;
      arr.splice(to, 0, arr.splice(from, 1)[0]); saveNow(); redraw(); });
  });
}

/* a panel for arranging what a record carries, when the strip is not on screen */
function openImagePanel(kind, id){
  const rec = imgOwner(kind, id); if(!rec) return;
  const p = openPanel(`<div class="mono">images</div><h2>${esc(rec.name || 'This record')}</h2>
    <p class="muted" style="font-size:.86rem">What this looks like. The first one becomes the ground its card is printed on.</p>
    <div class="row" style="gap:8px;margin:12px 0">${imageAddHTML(kind, id, {label:'▣ add an image'})}</div>
    ${imageStripHTML(kind, id) || '<div class="empty">Nothing here yet.</div>'}`, 'img-panel');
  const redraw = () => { const y = p.scrollTop; openImagePanel(kind, id); const np = $('#panel'); if(np) np.scrollTop = y; };
  bindRecImages(p, redraw);
}
