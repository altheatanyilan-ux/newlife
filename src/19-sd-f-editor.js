/* ============================================================
   THE STUDY DECK — adding and editing notes; note types and their
   templates; Image Occlusion.

   The editor is quiet: the fields down the left, the card as it will look
   on the right, a slim toolbar that appears on the field you are in. Paste
   an image and it is stored; drop a sound and it is stored; record your
   own voice into a field. Ctrl/⌘+Shift+C makes a cloze (with Alt/Option,
   the same number again). "->" becomes "→" as you type (and whatever other
   shortcuts you add). A pinned field keeps its text for the next note. The
   first field (or any you choose) is checked against the rest of the
   collection so a card is not made twice.
   ============================================================ */

function sdEditorRoute(root, o){
  const s = sdSettings();
  const editing = o.mode === 'edit' ? SD.notes.get(o.noteId) : null;
  if(o.mode === 'edit' && !editing){ root.innerHTML = `<div class="page sx-page">${sdNav('')}<p>That note is gone.</p></div>`; return; }
  const ed = S._sdEd = (S._sdEd && S._sdEd.mode === o.mode && S._sdEd.noteId === o.noteId) ? S._sdEd : {mode: o.mode, noteId: o.noteId,
    noteTypeId: editing ? editing.noteTypeId : (s.lastNoteType && SD.noteTypes.has(s.lastNoteType) ? s.lastNoteType : sdNoteTypeByName('Basic').id),
    deckId: o.deckId || (editing ? (sdCardsOf(editing.id)[0] || {}).deckId : null) || s.lastAddDeck || [...SD.decks.keys()][0],
    fields: editing ? editing.fields.slice() : null, tags: editing ? editing.tags.slice() : (s.lastTags || []).slice(), previewOrd: 0, previewBack: false, source: {}};
  const nt = SD.noteTypes.get(ed.noteTypeId) || sdNoteTypeByName('Basic');
  if(!ed.fields){ ed.fields = nt.fields.map(f => f.pinned || f.sticky ? ((s.pinned || {})[nt.id + ':' + f.ord] || '') : ''); }
  while(ed.fields.length < nt.fields.length) ed.fields.push('');
  const decks = sdDecks().filter(d => !d.isFiltered);
  root.innerHTML = `<div class="page sx-page sx-editor">
    ${sdNav(o.mode === 'add' ? 'add' : '')}
    <div class="sx-edtop">
      <label>Type <select class="sel" id="edType" ${editing ? 'disabled title="Change the note type from Browse"' : ''}>${[...SD.noteTypes.values()].map(t => `<option value="${t.id}"${t.id === nt.id ? ' selected' : ''}>${esc(t.name)}</option>`).join('')}</select></label>
      ${editing ? '' : `<label>Deck <select class="sel" id="edDeck">${decks.map(d => `<option value="${d.id}"${d.id === ed.deckId ? ' selected' : ''}>${esc(d.name)}</option>`).join('')}</select></label>`}
      <a class="tbtn" href="#/study/types/${nt.id}">Cards &amp; fields…</a>
      ${nt.kind === 'io' ? `<button class="tbtn" id="edIo">Draw masks…</button>` : ''}
      <label class="sx-chk"><input type="checkbox" id="edMd"${s.markdown ? ' checked' : ''}> markdown</label>
    </div>
    <div class="sx-edgrid">
      <div class="sx-fields">
        <div class="sx-tb" id="edTb" role="toolbar" aria-label="Formatting">
          ${[['bold', 'B', 'Bold (Ctrl+B)'], ['italic', 'I', 'Italic (Ctrl+I)'], ['underline', 'U', 'Underline (Ctrl+U)'], ['subscript', 'x₂', 'Subscript'], ['superscript', 'x²', 'Superscript'],
            ['insertUnorderedList', '•', 'List'], ['insertOrderedList', '1.', 'Numbered list'], ['link', '🔗', 'Link'], ['code', '{ }', 'Code block'], ['table', '▦', 'Table'],
            ['hilite', '▮', 'Highlight'], ['colour', 'A', 'Text colour'], ['cloze', '[…]', 'Cloze (Ctrl+Shift+C)'], ['mathInline', '∑', 'Maths \\( \\)'], ['image', '🖼', 'Image'], ['record', '●', 'Record audio'], ['html', '</>', 'HTML source'], ['clear', '⌫', 'Clear formatting']]
            .map(([c, t, h]) => `<button type="button" class="tbtn" data-edcmd="${c}" title="${h}" aria-label="${h}">${t}</button>`).join('')}
          <input type="color" id="edColour" value="#a0493b" hidden><input type="file" id="edFile" accept="image/*,audio/*" hidden>
        </div>
        ${nt.fields.map((f, i) => `<div class="sx-field" data-edfield="${i}">
          <div class="sx-flabel"><span>${esc(f.name)}</span>
            <button class="tbtn sx-pin${f.pinned || f.sticky ? ' on' : ''}" data-edpin="${i}" title="Keep this field for the next note" aria-pressed="${!!(f.pinned || f.sticky)}">📌</button></div>
          <div class="sx-fedit" contenteditable="true" data-edi="${i}" dir="${f.rtl ? 'rtl' : 'auto'}" style="${f.font ? `font-family:${esc(f.font)};` : ''}${f.size ? `font-size:${f.size}px` : ''}">${sdSanitize(ed.fields[i] || '', false)}</div>
          <textarea class="sx-fsrc inp" data-edsrc="${i}" hidden></textarea>
        </div>`).join('')}
        <div class="sx-field"><div class="sx-flabel"><span>Tags</span></div>
          <div class="sx-tags" id="edTags">${ed.tags.map(t => `<span class="sx-tag" style="--tc:${sdTagColour(t)}">${esc(t)}<button data-edtagx="${esc(t)}" aria-label="Remove ${esc(t)}">×</button></span>`).join('')}
            <input id="edTagIn" placeholder="add a tag (a::b for inside)" list="edTagList" autocomplete="off"><datalist id="edTagList">${[...sdAllTags().keys()].slice(0, 400).map(t => `<option value="${esc(t)}">`).join('')}</datalist></div></div>
        <div class="sx-dupe" id="edDupe"></div>
        <div class="sx-edbtns">${editing ? `<button class="btn primary" id="edSave">Save</button><button class="btn ghost" id="edBack">Back</button>
          <button class="btn ghost" id="edDelete">Delete note</button>` : `<button class="btn primary" id="edAdd">Add <kbd>Ctrl+Enter</kbd></button>`}
          <span class="faint" id="edSaid"></span></div>
      </div>
      <div class="sx-preview">
        <div class="sx-prevtop"><select class="sel" id="edOrd"></select><button class="tbtn" id="edFlip">Front / back</button></div>
        <iframe class="sx-card sx-prevcard" id="edPrev" sandbox="allow-scripts" title="Preview"></iframe>
      </div>
    </div>
  </div>`;
  const $ = q => root.querySelector(q);
  const fieldsEls = [...root.querySelectorAll('[data-edi]')];
  const read = () => fieldsEls.forEach(el => { const i = +el.dataset.edi, src = root.querySelector(`[data-edsrc="${i}"]`);
    ed.fields[i] = sdEdFixImages(!src.hidden ? src.value : (s.markdown ? sdMdToHtml(el.innerHTML) : el.innerHTML).replace(/^<br>$/, '')); });
  /* stored images are file names; in the editor they are shown from the database */
  fieldsEls.forEach(el => el.querySelectorAll('img').forEach(async img => { const n = img.getAttribute('src'); if(!n || /^(blob:|data:|https?:)/.test(n)) return;
    const u = await sdMediaUrl(decodeURIComponent(n)); if(u){ img.dataset.sdsrc = n; img.src = u; } }));
  let last = fieldsEls[0];
  fieldsEls.forEach(el => {
    el.addEventListener('focus', () => { last = el; $('#edTb').style.setProperty('--y', el.offsetTop + 'px'); });
    el.addEventListener('input', () => { read(); sdEdPreviewSoon(root, ed); sdEdDupe(root, ed); });
    el.addEventListener('keydown', e => sdEdKeys(e, el, root, ed));
    el.addEventListener('paste', e => sdEdPaste(e, el, root, ed));
    el.addEventListener('drop', e => sdEdDrop(e, el, root, ed));
    sdEdImgResize(el, () => { read(); sdEdPreviewSoon(root, ed); });
  });
  root.querySelectorAll('[data-edcmd]').forEach(b => b.onmousedown = e => { e.preventDefault(); sdEdCmd(b.dataset.edcmd, last, root, ed); read(); sdEdPreviewSoon(root, ed); });
  root.querySelectorAll('[data-edpin]').forEach(b => b.onclick = () => { const f = nt.fields[+b.dataset.edpin]; f.pinned = !f.pinned; f.sticky = f.pinned; sdTouch('noteTypes', nt); b.classList.toggle('on', f.pinned); b.setAttribute('aria-pressed', f.pinned); });
  const ty = $('#edType'); if(ty) ty.onchange = () => { read(); const nnt = SD.noteTypes.get(+ty.value); ed.noteTypeId = nnt.id; ed.fields = nnt.fields.map((f, i) => ed.fields[i] || ''); s.lastNoteType = nnt.id; sdTouch('misc', s); sdEditorRoute(root, o); };
  const dk = $('#edDeck'); if(dk) dk.onchange = () => { ed.deckId = +dk.value; s.lastAddDeck = ed.deckId; sdTouch('misc', s); };
  const io = $('#edIo'); if(io) io.onclick = () => sdIoEditor(editing ? editing.id : null);
  $('#edMd').onchange = e => { s.markdown = e.target.checked; sdTouch('misc', s); };
  const tagIn = $('#edTagIn');
  const addTag = () => { const v = tagIn.value.split(/[\s,]+/).map(sdNormTag).filter(Boolean); if(!v.length) return; v.forEach(t => { if(!ed.tags.includes(t)) ed.tags.push(t); }); tagIn.value = ''; read(); sdEditorRoute(root, o); setTimeout(() => { const n = root.querySelector('#edTagIn'); if(n) n.focus(); }, 0); };
  tagIn.onkeydown = e => { if(e.key === 'Enter' || e.key === ' ' || e.key === ','){ e.preventDefault(); addTag(); } else if(e.key === 'Backspace' && !tagIn.value && ed.tags.length){ ed.tags.pop(); read(); sdEditorRoute(root, o); } };
  tagIn.onchange = addTag;
  root.querySelectorAll('[data-edtagx]').forEach(b => b.onclick = () => { ed.tags = ed.tags.filter(t => t !== b.dataset.edtagx); read(); sdEditorRoute(root, o); });
  $('#edFlip').onclick = () => { ed.previewBack = !ed.previewBack; sdEdPreview(root, ed); };
  $('#edOrd').onchange = e => { ed.previewOrd = +e.target.value; sdEdPreview(root, ed); };
  const save = () => {
    read();
    if(!sdStripHTML(ed.fields[0]) && !/<img/i.test(ed.fields[0])){ toast(`${nt.fields[0].name} is empty.`); return false; }
    if(editing){
      editing.fields = ed.fields.slice(); editing.tags = ed.tags.slice(); sdSaveNote(editing);
    } else {
      const n = sdNewNote(nt.id, ed.fields, ed.tags, {extra: Object.assign({}, ed.source)});
      const made = sdAddNote(n, ed.deckId);
      if(!made.length){ SD.notes.delete(n.id); sdDrop('notes', n.id); toast(nt.kind === 'cloze' ? 'A cloze note needs at least one {{c1::…}}.' : 'That note would make no cards — its front is empty.'); return false; }
      /* pinned fields stay; the rest clear */
      s.pinned = s.pinned || {}; nt.fields.forEach((f, i) => { if(f.pinned || f.sticky) s.pinned[nt.id + ':' + i] = ed.fields[i]; });
      s.lastTags = ed.tags.slice(); s.lastAddDeck = ed.deckId; s.lastNoteType = nt.id; sdTouch('misc', s);
      ed.fields = nt.fields.map((f, i) => f.pinned || f.sticky ? ed.fields[i] : '');
      sdSummarise();
    }
    return true;
  };
  const add = $('#edAdd'); if(add) add.onclick = () => { if(save()){ sdEditorRoute(root, o); const said = root.querySelector('#edSaid'); if(said){ said.textContent = 'Added.'; said.classList.add('flash'); } root.querySelector('[data-edi]').focus(); } };
  const sv = $('#edSave'); if(sv) sv.onclick = () => { if(save()){ toast('Saved.'); const back = S._sdReturn; S._sdReturn = null; S._sdEd = null; navigate(back || '#/study/browse'); } };
  const bk = $('#edBack'); if(bk) bk.onclick = () => { const back = S._sdReturn; S._sdReturn = null; S._sdEd = null; navigate(back || '#/study/browse'); };
  const del = $('#edDelete'); if(del) del.onclick = () => { const undo = sdDeleteNotes([editing.id]); S._sdEd = null; navigate(S._sdReturn || '#/study/browse'); sdUndoToast('Note deleted', undo); };
  root.addEventListener('keydown', e => { if((e.ctrlKey || e.metaKey) && e.key === 'Enter'){ e.preventDefault(); (add || sv).click(); } });
  sdEdPreview(root, ed); sdEdDupe(root, ed);
  if(!editing) setTimeout(() => { const first = fieldsEls.find((el, i) => !(nt.fields[i].pinned || nt.fields[i].sticky)) || fieldsEls[0]; first.focus(); }, 0);
}
function sdTagColour(t){ const m = sdTagMeta().colours; let x = t; while(x){ if(m[x]) return m[x]; const i = x.lastIndexOf('::'); if(i < 0) break; x = x.slice(0, i); } return 'var(--line-2)'; }

/* ---------- the toolbar ---------- */
function sdEdCmd(cmd, el, root, ed){
  if(!el) return; el.focus();
  const exec = (c, v) => document.execCommand(c, false, v);
  if(['bold', 'italic', 'underline', 'subscript', 'superscript', 'insertUnorderedList', 'insertOrderedList'].includes(cmd)) exec(cmd);
  else if(cmd === 'clear') exec('removeFormat');
  else if(cmd === 'link'){ const u = prompt('Link to'); if(u && /^(https?:|mailto:|#)/.test(u)) exec('createLink', u); }
  else if(cmd === 'hilite') exec('hiliteColor', '#fff2a8');
  else if(cmd === 'colour'){ const c = root.querySelector('#edColour'); c.onchange = () => { el.focus(); exec('foreColor', c.value); }; c.click(); }
  else if(cmd === 'code'){ const sel = String(getSelection()); exec('insertHTML', `<pre><code>${sdEsc(sel || 'code')}</code></pre>`); sdHighlightCode(el); }
  else if(cmd === 'table'){ const r = +prompt('Rows', '2') || 2, c = +prompt('Columns', '2') || 2;
    exec('insertHTML', `<table class="sx-t">${Array.from({length: r}, () => `<tr>${Array.from({length: c}, () => '<td>&nbsp;</td>').join('')}</tr>`).join('')}</table>`); }
  else if(cmd === 'cloze') sdEdCloze(el, ed, false);
  else if(cmd === 'mathInline'){ const sel = String(getSelection()); exec('insertText', `\\(${sel || 'x^2'}\\)`); }
  else if(cmd === 'image'){ const f = root.querySelector('#edFile'); f.onchange = async () => { const file = f.files[0]; if(file) await sdEdInsertFile(file, el); f.value = ''; }; f.click(); }
  else if(cmd === 'record') sdEdRecord(el);
  else if(cmd === 'html'){
    const i = +el.dataset.edi, src = root.querySelector(`[data-edsrc="${i}"]`);
    if(src.hidden){ src.value = el.innerHTML; src.hidden = false; el.hidden = true; src.focus(); src.oninput = () => { ed.fields[i] = src.value; sdEdPreviewSoon(root, ed); }; }
    else { el.innerHTML = sdSanitize(src.value, false); src.hidden = true; el.hidden = false; el.focus(); }
  }
}
/* a cloze around the selection: the next number, or (with Alt) the same one again */
function sdEdCloze(el, ed, same){
  const all = ed.fields.join(' ');
  let max = 0; all.replace(/\{\{c(\d+)::/g, (m, n) => { max = Math.max(max, +n); });
  const n = same ? Math.max(1, max) : max + 1;
  const sel = getSelection(); const txt = String(sel);
  document.execCommand('insertText', false, `{{c${n}::${txt || '…'}}}`);
}
function sdEdKeys(e, el, root, ed){
  if((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')){ e.preventDefault(); sdEdCloze(el, ed, e.altKey); return; }
  if(e.key === 'Tab' && el.closest('td')){ return; }
  /* symbol shortcuts: typed pairs become their symbol when the next key is a space */
  if(e.key === ' '){
    const sel = getSelection(); if(!sel.rangeCount) return;
    const r = sel.getRangeAt(0), node = r.startContainer; if(node.nodeType !== 3) return;
    const before = node.textContent.slice(0, r.startOffset);
    const syms = sdSettings().symbols || {};
    for(const [k, v] of Object.entries(syms)){
      if(before.endsWith(k)){ e.preventDefault(); node.textContent = before.slice(0, -k.length) + v + ' ' + node.textContent.slice(r.startOffset);
        const nr = document.createRange(); nr.setStart(node, before.length - k.length + v.length + 1); nr.collapse(true); sel.removeAllRanges(); sel.addRange(nr); return; }
    }
  }
}
async function sdEdPaste(e, el, root, ed){
  const items = [...(e.clipboardData && e.clipboardData.items || [])];
  const img = items.find(i => i.type.startsWith('image/'));
  if(img){ e.preventDefault(); await sdEdInsertFile(img.getAsFile(), el); return; }
  const html = e.clipboardData && e.clipboardData.getData('text/html');
  if(html){ e.preventDefault(); document.execCommand('insertHTML', false, sdSanitize(html.replace(/<meta[^>]*>/g, ''), false)); }
}
async function sdEdDrop(e, el){
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if(!f) return; e.preventDefault(); await sdEdInsertFile(f, el);
}
async function sdEdInsertFile(file, el){
  const ext = (file.name && file.name.split('.').pop()) || (file.type.split('/')[1] || 'bin');
  const name = file.name && !/^image\.(png|jpe?g)$/i.test(file.name) ? file.name.replace(/[^\w.\-]/g, '_') : sdMediaName(ext);
  await sdMediaPut(name, file);
  el.focus();
  if(file.type.startsWith('audio/')) document.execCommand('insertText', false, `[sound:${name}]`);
  else { const u = await sdMediaUrl(name); document.execCommand('insertHTML', false, `<img src="${u}" data-sdsrc="${name}">`); }
}
/* images show from blob: URLs while editing; they are saved as their file name */
function sdEdFixImages(html){ return String(html || '').replace(/<img([^>]*?)src="blob:[^"]*"([^>]*?)data-sdsrc="([^"]+)"([^>]*)>/g, '<img$1src="$3"$2$4>'); }
function sdEdRecord(el){
  if(!navigator.mediaDevices || typeof MediaRecorder === 'undefined'){ toast('This browser cannot record.'); return; }
  navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
    const rec = new MediaRecorder(stream), chunks = [];
    rec.ondataavailable = e => chunks.push(e.data);
    rec.onstop = async () => { stream.getTracks().forEach(t => t.stop()); const blob = new Blob(chunks, {type: rec.mimeType || 'audio/webm'});
      const name = sdMediaName(/ogg/.test(blob.type) ? 'ogg' : /mp4/.test(blob.type) ? 'm4a' : 'webm'); await sdMediaPut(name, blob);
      el.focus(); document.execCommand('insertText', false, `[sound:${name}]`); };
    rec.start();
    const m = openModal(`<h2 class="serif">Recording…</h2><p class="faint">Speak, then stop.</p><button class="btn primary" id="edRecStop">Stop</button>`, 'narrow');
    document.getElementById('edRecStop').onclick = () => { rec.stop(); closeModals(); }; void m;
  }).catch(() => toast('The microphone was not allowed.'));
}
/* drag an image's corner to resize it */
function sdEdImgResize(el, done){
  el.addEventListener('pointerdown', e => {
    const img = e.target.closest && e.target.closest('img'); if(!img) return;
    const r = img.getBoundingClientRect(); if(e.clientX < r.right - 16 || e.clientY < r.bottom - 16) return;
    e.preventDefault(); const x0 = e.clientX, w0 = r.width;
    const mv = ev => { img.style.width = Math.max(24, w0 + ev.clientX - x0) + 'px'; img.style.height = 'auto'; };
    const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); done(); };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  });
}
/* markdown typed into a field, turned into HTML when it is kept */
function sdMdToHtml(h){
  const t = h.replace(/<br\s*\/?>/g, '\n').replace(/<\/?div>/g, '\n');
  if(!/[*_`#]|^\s*[-*] /m.test(sdStripHTML(t))) return h;
  return t.replace(/```([\s\S]*?)```/g, (m, c) => `<pre><code>${c}</code></pre>`).replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>').replace(/^#{1,3} (.+)$/gm, '<b>$1</b>')
    .replace(/(^|\n)[-*] (.+)/g, '$1<li>$2</li>').replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, '<ul>$1</ul>').replace(/\n/g, '<br>');
}
/* a small offline highlighter for code blocks: keywords, strings, comments, numbers */
function sdHighlightCode(root){
  root.querySelectorAll('pre code:not([data-hl])').forEach(c => {
    const src = c.textContent;
    const kw = /\b(function|return|const|let|var|if|else|for|while|class|def|import|from|export|new|true|false|null|None|self|this|async|await|in|of|print|public|private|static|void|int|string)\b/g;
    let h = sdEsc(src).replace(/(\/\/[^\n]*|#[^\n]*)/g, '<i class="c">$1</i>').replace(/(&quot;[^&]*?&quot;|'[^'\n]*')/g, '<i class="s">$1</i>')
      .replace(kw, '<i class="k">$1</i>').replace(/\b(\d+(\.\d+)?)\b/g, '<i class="n">$1</i>');
    c.innerHTML = h; c.dataset.hl = '1';
  });
}

/* ---------- the live preview ---------- */
function sdEdPreviewSoon(root, ed){ clearTimeout(ed._pv); ed._pv = setTimeout(() => sdEdPreview(root, ed), 180); }
async function sdEdPreview(root, ed){
  const f = root.querySelector('#edPrev'); if(!f) return;
  const nt = SD.noteTypes.get(ed.noteTypeId);
  const note = {id: -1, noteTypeId: nt.id, fields: ed.fields.map(sdEdFixImages), tags: ed.tags};
  let ords = nt.kind === 'standard' ? nt.templates.map(t => t.ord).filter(o => sdTemplateNonEmpty(nt.templates[o].qfmt, note, nt, nt.templates[o]))
    : nt.kind === 'cloze' ? sdClozeNumbers(note, nt).map(n => n - 1) : sdIoNumbers(note).map(n => n - 1);
  if(!ords.length) ords = [0];
  const sel = root.querySelector('#edOrd');
  if(sel) sel.innerHTML = ords.map(o => `<option value="${o}"${o === ed.previewOrd ? ' selected' : ''}>${nt.kind === 'standard' ? esc(nt.templates[o].name) : 'Card ' + (o + 1)}</option>`).join('');
  if(!ords.includes(ed.previewOrd)) ed.previewOrd = ords[0];
  const fake = {id: -1, noteId: -1, deckId: ed.deckId, ord: ed.previewOrd, flags: 0};
  SD.notes.set(-1, note);
  const r = sdRenderCard(fake, {typed: ''});
  SD.notes.delete(-1);
  const html = await sdResolveMedia(ed.previewBack ? r.a : r.q);
  f.srcdoc = sdCardDoc(ed.previewBack ? 'a' : 'q', html, r.css, {js: false, pad: '18px 14px', scale: 0.85});
}
/* the same note twice is a note too many */
function sdEdDupe(root, ed){
  const box = root.querySelector('#edDupe'); if(!box) return;
  const s = sdSettings(), fi = s.dupeField || 0, scope = s.dupeScope || 'type';
  const v = sdStripHTML(ed.fields[fi] || '').toLowerCase(); if(!v){ box.innerHTML = ''; return; }
  const hits = [...SD.notes.values()].filter(n => n.id !== ed.noteId && (scope === 'all' || n.noteTypeId === ed.noteTypeId) && sdStripHTML(n.fields[fi] || '').toLowerCase() === v);
  box.innerHTML = hits.length ? `<span>Already in the collection${hits.length > 1 ? ` (${hits.length})` : ''}:</span> <a href="#/study/browse/${encodeURIComponent('dupe:' + ed.noteTypeId + ',' + sdStripHTML(ed.fields[fi]))}">show</a>
    <select class="sel sm" id="edDupeF">${(SD.noteTypes.get(ed.noteTypeId).fields).map((f, i) => `<option value="${i}"${i === fi ? ' selected' : ''}>check ${esc(f.name)}</option>`).join('')}</select>
    <select class="sel sm" id="edDupeS"><option value="type"${scope === 'type' ? ' selected' : ''}>this note type</option><option value="all"${scope === 'all' ? ' selected' : ''}>every note type</option></select>` : '';
  const a = box.querySelector('#edDupeF'), b = box.querySelector('#edDupeS');
  if(a) a.onchange = () => { s.dupeField = +a.value; sdTouch('misc', s); sdEdDupe(root, ed); };
  if(b) b.onchange = () => { s.dupeScope = b.value; sdTouch('misc', s); sdEdDupe(root, ed); };
}

/* ---------- note types: fields, templates, CSS ---------- */
function sdNoteTypesRoute(root, params){
  const id = params[0] ? +params[0] : null, nt = id ? SD.noteTypes.get(id) : null;
  if(!nt){
    const count = t => [...SD.notes.values()].filter(n => n.noteTypeId === t.id).length;
    root.innerHTML = `<div class="page sx-page">${sdNav('')}<h1 class="serif">Note types</h1>
      <div class="sx-list">${[...SD.noteTypes.values()].map(t => `<a class="sx-li" href="#/study/types/${t.id}"><b>${esc(t.name)}</b><span>${t.kind === 'cloze' ? 'cloze' : t.kind === 'io' ? 'image occlusion' : t.templates.length + ' card type' + (t.templates.length === 1 ? '' : 's')} · ${count(t)} notes</span></a>`).join('')}</div>
      <div class="sx-actions"><button class="btn" id="ntNew">New note type</button><button class="btn ghost" id="ntEmpty">Empty cards…</button></div></div>`;
    root.querySelector('#ntNew').onclick = async () => {
      const base = [...SD.noteTypes.values()];
      const name = await sdAsk('A name for it', 'My note type', 'It starts as a copy of Basic; change its fields and cards after.');
      if(!name) return;
      const src = sdNoteTypeByName('Basic') || base[0];
      const n = sdNoteTypeDefaults(Object.assign(JSON.parse(JSON.stringify(src)), {id: sdId(), name, ankiId: null}));
      SD.noteTypes.set(n.id, n); sdTouch('noteTypes', n); navigate('#/study/types/' + n.id);
    };
    root.querySelector('#ntEmpty').onclick = () => {
      const e = sdEmptyCards();
      openModal(`<h2 class="serif">Empty cards</h2><p>${e.length ? `${e.length} cards now render with nothing on the front.` : 'None — every card has something on its front.'}</p>
        ${e.length ? `<button class="btn primary" id="ecDel">Delete them</button>` : ''}`, 'narrow');
      const b = document.getElementById('ecDel'); if(b) b.onclick = () => { e.forEach(c => { SD.cards.delete(c.id); sdUnindexCard(c); sdDrop('cards', c.id); }); closeModals(); toast(`${e.length} deleted.`); };
    };
    return;
  }
  const ui = S._sdNt = S._sdNt && S._sdNt.id === id ? S._sdNt : {id, tpl: 0, side: 'qfmt'};
  const tpl = nt.templates[ui.tpl] || nt.templates[0];
  root.innerHTML = `<div class="page sx-page sx-nt">${sdNav('')}
    <div class="sx-crumbs"><a href="#/study/types">Note types</a> <span>›</span> ${esc(nt.name)}</div>
    <h1 class="serif">${esc(nt.name)}</h1>
    <div class="sx-ntgrid">
      <section><h3>Fields</h3>
        <ol class="sx-fl">${nt.fields.map((f, i) => `<li><input class="inp sm" data-ntfn="${i}" value="${esc(f.name)}">
          <button class="tbtn" data-ntfup="${i}" ${i ? '' : 'disabled'} aria-label="Move up">↑</button><button class="tbtn" data-ntfdel="${i}" ${nt.fields.length > 1 ? '' : 'disabled'} aria-label="Delete">×</button>
          <label class="sx-chk"><input type="radio" name="sortf" data-ntsort="${i}"${nt.sortField === i ? ' checked' : ''}> sort by</label>
          <label class="sx-chk"><input type="checkbox" data-ntrtl="${i}"${f.rtl ? ' checked' : ''}> RTL</label></li>`).join('')}</ol>
        <button class="tbtn" id="ntFAdd">+ field</button>
        <h3>Options</h3>
        <label class="sx-chk"><input type="checkbox" id="ntJs"${nt.jsEnabled ? ' checked' : ''}> Let this note type's templates run JavaScript <small class="faint">(inside the sandbox; off unless you trust the deck)</small></label>
        <p><button class="tbtn" id="ntRen">Rename</button> <button class="tbtn" id="ntDel">Delete note type</button></p>
      </section>
      <section><h3>Cards</h3>
        ${nt.kind === 'standard' ? `<div class="sx-row"><select class="sel" id="ntTpl">${nt.templates.map((t, i) => `<option value="${i}"${i === ui.tpl ? ' selected' : ''}>${esc(t.name)}</option>`).join('')}</select>
          <button class="tbtn" id="ntTAdd">+ card type</button><button class="tbtn" id="ntTRen">Rename</button><button class="tbtn" id="ntTDel" ${nt.templates.length > 1 ? '' : 'disabled'}>Delete</button>
          <label>Deck override <select class="sel" id="ntTDeck"><option value="">none</option>${sdDecks().filter(d => !d.isFiltered).map(d => `<option value="${d.id}"${tpl.deckOverride === d.id ? ' selected' : ''}>${esc(d.name)}</option>`).join('')}</select></label></div>` : ''}
        <div class="sx-seg">${[['qfmt', 'Front'], ['afmt', 'Back'], ['css', 'Styling'], ['bqfmt', 'Browser front'], ['bafmt', 'Browser back']].map(([k, n]) => `<button class="${ui.side === k ? 'on' : ''}" data-ntside="${k}">${n}</button>`).join('')}</div>
        <textarea class="inp sx-code" id="ntSrc" spellcheck="false">${esc(ui.side === 'css' ? nt.css : tpl[ui.side] || '')}</textarea>
        <iframe class="sx-card sx-prevcard" id="ntPrev" sandbox="allow-scripts" title="Preview"></iframe>
      </section>
    </div></div>`;
  const $ = q => root.querySelector(q);
  const save = () => { nt.mod = Date.now(); sdTouch('noteTypes', nt); };
  const renamedField = (old, nw) => { nt.templates.forEach(t => ['qfmt', 'afmt', 'bqfmt', 'bafmt'].forEach(k => { t[k] = (t[k] || '').replace(new RegExp(`\\{\\{([^}]*?:)?${old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}`, 'g'), (m, pre) => `{{${pre || ''}${nw}}}`); })); };
  root.querySelectorAll('[data-ntfn]').forEach(i => i.onchange = () => { const f = nt.fields[+i.dataset.ntfn], v = i.value.trim().replace(/[:{}"#^/]/g, ''); if(!v || nt.fields.some(x => x !== f && x.name === v)){ i.value = f.name; return; } renamedField(f.name, v); f.name = v; save(); });
  root.querySelectorAll('[data-ntfup]').forEach(b => b.onclick = () => { const i = +b.dataset.ntfup; sdMoveField(nt, i, i - 1); save(); rerender(); });
  root.querySelectorAll('[data-ntfdel]').forEach(b => b.onclick = () => { const i = +b.dataset.ntfdel; if(!confirm(`Delete the field “${nt.fields[i].name}” from every note of this type?`)) return; sdDeleteField(nt, i); save(); rerender(); });
  root.querySelectorAll('[data-ntsort]').forEach(b => b.onchange = () => { nt.sortField = +b.dataset.ntsort; save(); });
  root.querySelectorAll('[data-ntrtl]').forEach(b => b.onchange = () => { nt.fields[+b.dataset.ntrtl].rtl = b.checked; save(); });
  $('#ntFAdd').onclick = async () => { const n = await sdAsk('Field name', 'Field ' + (nt.fields.length + 1)); if(!n) return; nt.fields.push({name: n, ord: nt.fields.length, sticky: false, rtl: false, font: '', size: 0});
    SD.notes.forEach(x => { if(x.noteTypeId === nt.id){ x.fields.push(''); sdTouch('notes', x); } }); save(); rerender(); };
  $('#ntJs').onchange = e => { nt.jsEnabled = e.target.checked; save(); };
  $('#ntRen').onclick = async () => { const n = await sdAsk('Rename', nt.name); if(n){ nt.name = n; save(); rerender(); } };
  $('#ntDel').onclick = () => { const n = [...SD.notes.values()].filter(x => x.noteTypeId === nt.id);
    if(!confirm(`Delete “${nt.name}”${n.length ? ` and its ${n.length} notes` : ''}?`)) return; sdDeleteNotes(n.map(x => x.id)); SD.noteTypes.delete(nt.id); sdDrop('noteTypes', nt.id); navigate('#/study/types'); };
  root.querySelectorAll('[data-ntside]').forEach(b => b.onclick = () => { ui.side = b.dataset.ntside; rerender(); });
  const tp = $('#ntTpl'); if(tp) tp.onchange = () => { ui.tpl = +tp.value; rerender(); };
  const ta = $('#ntTAdd'); if(ta) ta.onclick = () => { nt.templates.push({name: 'Card ' + (nt.templates.length + 1), ord: nt.templates.length, qfmt: `{{${nt.fields[1] ? nt.fields[1].name : nt.fields[0].name}}}`, afmt: `{{FrontSide}}\n\n<hr id=answer>\n\n{{${nt.fields[0].name}}}`, bqfmt: '', bafmt: '', deckOverride: null});
    save(); SD.notes.forEach(n => { if(n.noteTypeId === nt.id) sdGenerateCards(n); }); ui.tpl = nt.templates.length - 1; rerender(); };
  const tr = $('#ntTRen'); if(tr) tr.onclick = async () => { const n = await sdAsk('Rename the card type', tpl.name); if(n){ tpl.name = n; save(); rerender(); } };
  const td = $('#ntTDel'); if(td) td.onclick = () => { const cards = [...SD.cards.values()].filter(c => SD.notes.get(c.noteId) && SD.notes.get(c.noteId).noteTypeId === nt.id && c.ord === tpl.ord);
    if(!confirm(`Delete this card type and its ${cards.length} cards?`)) return; cards.forEach(c => { SD.cards.delete(c.id); sdUnindexCard(c); sdDrop('cards', c.id); });
    nt.templates.splice(ui.tpl, 1); nt.templates.forEach((t, i) => { const was = t.ord; t.ord = i; if(was !== i) SD.cards.forEach(c => { const n = SD.notes.get(c.noteId); if(n && n.noteTypeId === nt.id && c.ord === was){ c.ord = i; sdTouch('cards', c); } }); });
    ui.tpl = 0; save(); rerender(); };
  const tdk = $('#ntTDeck'); if(tdk) tdk.onchange = () => { tpl.deckOverride = tdk.value ? +tdk.value : null; save(); };
  const src = $('#ntSrc');
  src.oninput = () => { if(ui.side === 'css') nt.css = src.value; else tpl[ui.side] = src.value; save(); sdNtPreviewSoon(root, nt, ui); };
  sdNtPreview(root, nt, ui);
}
function sdMoveField(nt, i, j){
  if(j < 0 || j >= nt.fields.length) return;
  const [f] = nt.fields.splice(i, 1); nt.fields.splice(j, 0, f); nt.fields.forEach((x, k) => x.ord = k);
  SD.notes.forEach(n => { if(n.noteTypeId === nt.id){ const [v] = n.fields.splice(i, 1); n.fields.splice(j, 0, v); sdTouch('notes', n); } });
  if(nt.sortField === i) nt.sortField = j; else if(nt.sortField === j) nt.sortField = i;
}
function sdDeleteField(nt, i){
  nt.fields.splice(i, 1); nt.fields.forEach((x, k) => x.ord = k);
  SD.notes.forEach(n => { if(n.noteTypeId === nt.id){ n.fields.splice(i, 1); sdTouch('notes', n); } });
  if(nt.sortField >= nt.fields.length) nt.sortField = 0;
}
function sdNtPreviewSoon(root, nt, ui){ clearTimeout(ui._pv); ui._pv = setTimeout(() => sdNtPreview(root, nt, ui), 200); }
async function sdNtPreview(root, nt, ui){
  const f = root.querySelector('#ntPrev'); if(!f) return;
  const sample = [...SD.notes.values()].find(n => n.noteTypeId === nt.id) || {id: -1, noteTypeId: nt.id, fields: nt.fields.map(x => `(${x.name})`), tags: []};
  const fake = {id: -1, noteId: sample.id, deckId: [...SD.decks.keys()][0], ord: nt.kind === 'standard' ? ui.tpl : 0, flags: 0};
  const had = SD.notes.has(sample.id); if(!had) SD.notes.set(sample.id, sample);
  const r = sdRenderCard(fake, {browser: ui.side === 'bqfmt' || ui.side === 'bafmt'});
  if(!had) SD.notes.delete(sample.id);
  const back = ui.side === 'afmt' || ui.side === 'bafmt';
  f.srcdoc = sdCardDoc(back ? 'a' : 'q', await sdResolveMedia(back ? r.a : r.q), r.css, {pad: '16px', scale: 0.85});
}

/* ---------- Image Occlusion: draw the masks ---------- */
async function sdIoEditor(noteId){
  const editing = noteId ? SD.notes.get(noteId) : null;
  const nt = sdNoteTypeByName('Image Occlusion');
  let imgName = editing ? ((editing.fields[1] || '').match(/src="([^"]+)"/) || [])[1] : null;
  let shapes = editing ? sdIoShapes(editing) : [];
  let mode = 'rect', oi = shapes.some(s => s.oi);
  openModal(`<h2 class="serif">Image Occlusion</h2>
    <div class="sx-row"><input type="file" id="ioFile" accept="image/*"><div class="sx-seg">${['rect', 'ellipse'].map(m => `<button data-iomode="${m}" class="${m === mode ? 'on' : ''}">${m === 'rect' ? 'Rectangle' : 'Ellipse'}</button>`).join('')}</div>
      <label class="sx-chk"><input type="checkbox" id="ioOi"${oi ? ' checked' : ''}> hide one, guess one</label><button class="tbtn" id="ioUndo">Undo mask</button><button class="tbtn" id="ioGroup">Group selected</button></div>
    <div class="sx-io" id="ioStage"><p class="faint">Choose an image, then drag over what should be hidden. Each mask is a card; group masks to hide them together.</p></div>
    <label class="sx-opt"><span>Header</span><input class="inp" id="ioHead" value="${esc(editing ? editing.fields[2] || '' : '')}"></label>
    <label class="sx-opt"><span>Back extra</span><input class="inp" id="ioExtra" value="${esc(editing ? editing.fields[3] || '' : '')}"></label>
    <label class="sx-opt"><span>Deck</span><select class="sel" id="ioDeck">${sdDecks().filter(d => !d.isFiltered).map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select></label>
    <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" onclick="closeModals()">Cancel</button><button class="btn primary" id="ioOk">${editing ? 'Save' : 'Add'}</button></div>`, 'wide');
  const stage = document.getElementById('ioStage');
  let selected = new Set();
  const draw = async () => {
    if(!imgName) return;
    const u = await sdMediaUrl(imgName);
    stage.innerHTML = `<div class="sx-iobox"><img src="${u}" draggable="false">${shapes.map((s, i) => `<div class="m${s.kind === 'ellipse' ? ' e' : ''}${selected.has(i) ? ' sel' : ''}" data-ioi="${i}" style="left:${s.left * 100}%;top:${s.top * 100}%;width:${s.width * 100}%;height:${s.height * 100}%"><span>${s.n}</span></div>`).join('')}</div>`;
    const box = stage.querySelector('.sx-iobox');
    box.querySelectorAll('[data-ioi]').forEach(m => m.onpointerdown = e => { e.stopPropagation(); const i = +m.dataset.ioi; selected.has(i) ? selected.delete(i) : selected.add(i); draw(); });
    box.onpointerdown = e => {
      const r = box.getBoundingClientRect(), x0 = (e.clientX - r.left) / r.width, y0 = (e.clientY - r.top) / r.height;
      const ghost = document.createElement('div'); ghost.className = 'm ghost' + (mode === 'ellipse' ? ' e' : ''); box.appendChild(ghost);
      const mv = ev => { const x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
        Object.assign(ghost.style, {left: Math.min(x, x0) * 100 + '%', top: Math.min(y, y0) * 100 + '%', width: Math.abs(x - x0) * 100 + '%', height: Math.abs(y - y0) * 100 + '%'}); };
      const up = ev => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up);
        const x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
        if(Math.abs(x - x0) > 0.01 && Math.abs(y - y0) > 0.01){ const n = Math.max(0, ...shapes.map(s => s.n)) + 1;
          shapes.push({n, kind: mode, left: +Math.min(x, x0).toFixed(4), top: +Math.min(y, y0).toFixed(4), width: +Math.abs(x - x0).toFixed(4), height: +Math.abs(y - y0).toFixed(4)}); }
        draw(); };
      addEventListener('pointermove', mv); addEventListener('pointerup', up);
    };
  };
  document.getElementById('ioFile').onchange = async e => { const f = e.target.files[0]; if(!f) return; imgName = sdMediaName((f.name.split('.').pop() || 'png')); await sdMediaPut(imgName, f); shapes = []; draw(); };
  document.querySelectorAll('[data-iomode]').forEach(b => b.onclick = () => { mode = b.dataset.iomode; document.querySelectorAll('[data-iomode]').forEach(x => x.classList.toggle('on', x === b)); });
  document.getElementById('ioUndo').onclick = () => { shapes.pop(); draw(); };
  document.getElementById('ioGroup').onclick = () => { const l = [...selected]; if(l.length < 2) return; const n = shapes[l[0]].n; l.forEach(i => shapes[i].n = n); selected.clear(); draw(); };
  document.getElementById('ioOk').onclick = () => {
    if(!imgName || !shapes.length){ toast('An image and at least one mask.'); return; }
    const oneOnly = document.getElementById('ioOi').checked;
    const occl = shapes.map(s => `{{c${s.n}::image-occlusion:${s.kind}:left=${s.left}:top=${s.top}:width=${s.width}:height=${s.height}${oneOnly ? ':oi=1' : ''}}}`).join('<br>');
    const fields = [occl, `<img src="${imgName}">`, document.getElementById('ioHead').value, document.getElementById('ioExtra').value, ''];
    if(editing){ editing.fields = fields; sdSaveNote(editing); }
    else sdAddNote(sdNewNote(nt.id, fields, []), +document.getElementById('ioDeck').value);
    closeModals(); toast(editing ? 'Saved.' : `Added ${new Set(shapes.map(s => s.n)).size} cards.`);
  };
  draw();
}
