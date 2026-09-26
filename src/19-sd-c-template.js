/* ============================================================
   THE STUDY DECK — templates, and showing a card safely.

   Anki's template language, as its authors write it:
     {{Field}}                       the field
     {{FrontSide}}                   the question, on the answer side
     {{#Field}}…{{/Field}}           only if the field has something in it
     {{^Field}}…{{/Field}}           only if it has not
     {{text:Field}}                  the field without its HTML
     {{hint:Field}}                  a link that reveals it
     {{type:Field}}                  type the answer; the back compares it
     {{cloze:Text}}                  c1…cN; {{c1::answer::hint}}
     {{type:cloze:Text}}             type the cloze answer
     {{cloze-only:Text}}             just the answer(s) of this card's cloze
     {{Tags}} {{Deck}} {{Subdeck}} {{Card}} {{Type}}
     [sound:file.mp3]                a play button (and autoplay)
     \( … \) and \[ … \]             maths, drawn offline by KaTeX
     {{image-occlusion:Occlusion}}   the masks of an Image Occlusion note
   Filters chain right to left, as in Anki (text:hint:Field).

   SAFETY. A shared deck is somebody else's HTML, CSS and sometimes
   JavaScript. It is shown in a sandboxed iframe with no same-origin and a
   strict Content Security Policy; field HTML is sanitised (no scripts, no
   event handlers, no javascript: URLs); the template's own <script> runs
   only if you have switched JavaScript on for that note type — and even
   then inside the sandbox, never in the page. Media is served as blob:
   URLs made from what is stored in the database.
   ============================================================ */

/* ---------- sanitising ---------- */
const SD_SAFE_TAGS = new Set(['a', 'abbr', 'b', 'big', 'blockquote', 'br', 'center', 'code', 'col', 'colgroup', 'dd', 'del', 'details', 'div', 'dl', 'dt',
  'em', 'figcaption', 'figure', 'font', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'ins', 'kbd', 'li', 'mark', 'ol', 'p', 'pre', 'q', 'rb', 'rp', 'rt',
  'ruby', 's', 'samp', 'small', 'span', 'strike', 'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'tt', 'u', 'ul',
  'var', 'audio', 'video', 'source', 'svg', 'path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line', 'g', 'text', 'tspan', 'defs', 'use',
  'math', 'mi', 'mo', 'mn', 'mrow', 'msup', 'msub', 'mfrac', 'msqrt', 'mtext', 'section', 'article', 'header', 'footer', 'label', 'input', 'style']);
function sdSanitize(html, allowScript){
  if(!html) return '';
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const walk = node => {
    [...node.childNodes].forEach(ch => {
      if(ch.nodeType === 8){ ch.remove(); return; }
      if(ch.nodeType !== 1) return;
      const tag = ch.tagName.toLowerCase();
      if(tag === 'script'){ if(!allowScript) ch.remove(); return; }
      if(!SD_SAFE_TAGS.has(tag)){
        if(['iframe', 'object', 'embed', 'form', 'base', 'meta', 'link'].includes(tag)){ ch.remove(); return; }
        /* unknown tags keep their content */
        const frag = doc.createDocumentFragment(); while(ch.firstChild) frag.appendChild(ch.firstChild); ch.replaceWith(frag); walk(node); return;
      }
      [...ch.attributes].forEach(a => {
        const n = a.name.toLowerCase(), v = a.value;
        if(n.startsWith('on') && !allowScript) ch.removeAttribute(a.name);
        else if((n === 'href' || n === 'src' || n === 'xlink:href' || n === 'action') && /^\s*(javascript|vbscript|data:text\/html)/i.test(v)) ch.removeAttribute(a.name);
        else if(n === 'style' && /expression\s*\(|url\s*\(\s*['"]?\s*javascript/i.test(v)) ch.removeAttribute(a.name);
      });
      walk(ch);
    });
  };
  walk(doc.body);
  return doc.body.innerHTML;
}
const sdEsc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------- the template language ---------- */
function sdTemplateNonEmpty(qfmt, note, nt, tpl){
  const html = sdRenderTemplate(qfmt, note, nt, {ord: tpl.ord, side: 'q', probe: true});
  return sdStripHTML(html.replace(/<img[^>]*>/gi, 'IMG')).replace(/\[sound:[^\]]+\]/g, 'S').trim().length > 0;
}
function sdClozeNumbers(note, nt){
  const nums = new Set();
  const fieldsUsed = new Set();
  (nt || SD.noteTypes.get(note.noteTypeId)).templates.forEach(t => [t.qfmt, t.afmt].forEach(f => { (f || '').replace(/\{\{(?:[^}:]*:)*cloze:([^}]+)\}\}/g, (m, name) => fieldsUsed.add(name.trim())); }));
  const map = sdFieldMap(note);
  fieldsUsed.forEach(name => { (map[name] || '').replace(/\{\{c(\d+)::/g, (m, n) => nums.add(+n)); });
  return [...nums].filter(n => n > 0).sort((a, b) => a - b);
}
function sdIoNumbers(note){
  const nums = new Set();
  String(note.fields[0] || '').replace(/\{\{c(\d+)::image-occlusion:/g, (m, n) => nums.add(+n));
  return [...nums].sort((a, b) => a - b);
}
/* one pass of the language. ctx: {ord, side ('q'|'a'), front (the rendered question), card, deck, typed} */
function sdRenderTemplate(fmt, note, nt, ctx){
  nt = nt || SD.noteTypes.get(note.noteTypeId);
  const fields = sdFieldMap(note);
  const nonEmpty = name => {
    if(name === 'Tags') return (note.tags || []).length > 0;
    const v = fields[name]; return v != null && sdStripHTML(v).trim() !== '' || /<img/i.test(v || '');
  };
  /* sections first, innermost out */
  let s = String(fmt || '');
  for(let guard = 0; guard < 50; guard++){
    const m = s.match(/\{\{([#^])\s*([^}]+?)\s*\}\}([\s\S]*?)\{\{\/\s*\2\s*\}\}/);
    if(!m) break;
    const [all, kind, name, inner] = m;
    const has = nonEmpty(name.replace(/^.*:/, ''));
    s = s.replace(all, (kind === '#' ? has : !has) ? inner : '');
  }
  const card = ctx.card, deck = card ? SD.decks.get(card.odid || card.deckId) : null;
  return s.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (all, expr) => {
    const parts = expr.split(':').map(x => x.trim());
    let name = parts.pop();
    const filters = parts;
    if(name === 'FrontSide') return ctx.side === 'a' ? (ctx.front || '') : '';
    let val;
    if(name === 'Tags') val = sdEsc((note.tags || []).join(' '));
    else if(name === 'Deck') val = sdEsc(deck ? deck.name : '');
    else if(name === 'Subdeck') val = sdEsc(deck ? sdDeckLeaf(deck.name) : '');
    else if(name === 'Card') val = sdEsc(nt.kind === 'standard' ? (nt.templates[ctx.ord] || {}).name || '' : nt.templates[0].name);
    else if(name === 'Type') val = sdEsc(nt.name);
    else if(name === 'CardFlag') val = card ? 'flag' + (card.flags & 7) : '';
    else if(fields[name] != null) val = fields[name];
    else if(/^(tts|tts-voices)/.test(filters[0] || '')) val = '';
    else return ctx.probe ? '' : `<span class="sd-unknown">{{${sdEsc(expr)}}}</span>`;
    /* filters, from the one nearest the field outwards */
    for(let i = filters.length - 1; i >= 0; i--){
      const f = filters[i];
      if(f === 'text') val = sdEsc(sdStripHTML(val));
      else if(f === 'hint') val = sdStripHTML(val) ? `<a class="hint" href="#" data-sdhint>Show ${sdEsc(name)}</a><div class="sd-hint-body" hidden>${val}</div>` : '';
      else if(f === 'cloze') val = sdCloze(val, ctx.ord + 1, ctx.side);
      else if(f === 'cloze-only') val = sdClozeOnly(val, ctx.ord + 1);
      else if(f === 'type'){
        if(filters[i - 1] === 'cloze' || filters.includes('cloze')){ /* type:cloze */ }
        const want = filters.includes('cloze') ? sdStripHTML(sdClozeOnly(fields[name] || '', ctx.ord + 1)) : sdStripHTML(val);
        if(ctx.probe) val = ''; else if(ctx.side === 'q') val = `<input class="sd-typein" id="typeans" data-sdtype autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Type the answer">`;
        else val = sdTypeDiff(ctx.typed == null ? '' : ctx.typed, want);
        if(filters.includes('cloze')) { i = -1; }
      }
      else if(f === 'kanji') val = String(val).replace(/(\S+?)\[[^\]]+\]/g, '$1');
      else if(f === 'kana') val = String(val).replace(/\S+?\[([^\]]+)\]/g, '$1');
      else if(f === 'furigana') val = String(val).replace(/ ?([^ >]+?)\[([^\]]+)\]/g, '<ruby><rb>$1</rb><rt>$2</rt></ruby>');
      else if(f === 'image-occlusion') val = sdIoRender(note, ctx.ord + 1, ctx.side);
      else if(/^tts/.test(f)) val = '';   /* speech voices are not part of this deck */
    }
    return val;
  });
}
/* {{c1::answer::hint}}: this card's deletion is a blank (or the answer, on
   the back); the others show their text */
function sdCloze(text, n, side){
  const re = /\{\{c(\d+)::([\s\S]*?)(?:::([\s\S]*?))?\}\}/g;
  let found = false;
  const out = String(text || '').replace(re, (m, num, ans, hint) => {
    if(+num !== n) return ans;
    found = true;
    if(side === 'q') return `<span class="cloze" data-cloze="${sdEsc(sdStripHTML(ans))}" data-ordinal="${num}">[${hint ? sdEsc(hint) : '…'}]</span>`;
    return `<span class="cloze" data-ordinal="${num}">${ans}</span>`;
  });
  /* nested clozes: one more pass for anything left inside */
  return found || !re.test(out) ? out.replace(/\{\{c\d+::([\s\S]*?)(?:::[\s\S]*?)?\}\}/g, '$1') : out;
}
function sdClozeOnly(text, n){
  const out = []; String(text || '').replace(/\{\{c(\d+)::([\s\S]*?)(?:::([\s\S]*?))?\}\}/g, (m, num, ans) => { if(+num === n) out.push(ans); });
  return out.join(', ');
}
/* the type-in comparison, character by character, Anki's classes */
function sdTypeNorm(s){
  const st = sdSettings();
  let x = String(s || '').trim();
  if(st.typeIgnoreCase) x = x.toLowerCase();
  if(st.typeIgnoreAccents) x = x.normalize('NFD').replace(/[̀-ͯ]/g, '');
  if(st.typeIgnorePunct) x = x.replace(/[.,;:!?'"()\-–—]/g, '');
  return x;
}
function sdTypeDiff(typed, want){
  const a = sdTypeNorm(typed), b = sdTypeNorm(want);
  /* a number close enough is amber, not red */
  const na = parseFloat(a.replace(',', '.')), nb = parseFloat(b.replace(',', '.'));
  if(a && b && isFinite(na) && isFinite(nb) && /^[\s\d.,+-]+$/.test(a + b) && na !== nb){
    const tol = sdSettings().numericTolerance || 0;
    if(Math.abs(na - nb) <= Math.abs(nb) * tol) return `<code id="typeans"><span class="typeClose">${sdEsc(typed)}</span><br><span id="typearrow">&darr;</span><br><span class="typeGood">${sdEsc(want)}</span></code>`;
  }
  if(!a) return `<code id="typeans"><span class="typeMissed">${sdEsc(want)}</span></code>`;
  if(a === b) return `<code id="typeans"><span class="typeGood">${sdEsc(typed)}</span></code>`;
  /* longest-common-subsequence alignment */
  const A = [...a], B = [...b], m = A.length, n = B.length;
  const L = Array.from({length: m + 1}, () => new Int32Array(n + 1));
  for(let i = m - 1; i >= 0; i--) for(let j = n - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  let i = 0, j = 0, top = '', bot = '', k = 0;
  const span = (cls, ch, d) => `<span class="${cls}" style="--i:${d}">${sdEsc(ch)}</span>`;
  while(i < m || j < n){
    if(i < m && j < n && A[i] === B[j]){ top += span('typeGood', A[i], k); bot += span('typeGood', B[j], k); i++; j++; }
    else if(j < n && (i >= m || L[i][j + 1] >= L[i + 1][j])){ top += span('typeMissed', '-', k); bot += span('typeMissed', B[j], k); j++; }
    else { top += span('typeBad', A[i], k); i++; }
    k++;
  }
  return `<code id="typeans">${top}<br><span id="typearrow">&darr;</span><br>${bot}</code>`;
}

/* ---------- maths, offline ---------- */
let _sdKatex = null;
function sdKatex(){
  if(_sdKatex !== null) return _sdKatex;
  const src = sdLibs().katex;
  if(!src){ _sdKatex = false; return false; }
  try { const mod = {exports: {}}; new Function('module', 'exports', 'define', src)(mod, mod.exports, undefined); _sdKatex = mod.exports && mod.exports.renderToString ? mod.exports : (typeof katex !== 'undefined' ? katex : false); }
  catch(e){ console.warn('KaTeX failed to load', e); _sdKatex = false; }
  return _sdKatex;
}
function sdMath(html){
  if(!/\\\(|\\\[/.test(html)) return html;
  const K = sdKatex(); if(!K) return html;
  const un = s => s.replace(/<br\s*\/?>/gi, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
  return html.replace(/\\\[([\s\S]+?)\\\]/g, (m, x) => { try { return K.renderToString(un(x), {displayMode: true, throwOnError: false}); } catch(e){ return m; } })
    .replace(/\\\(([\s\S]+?)\\\)/g, (m, x) => { try { return K.renderToString(un(x), {displayMode: false, throwOnError: false}); } catch(e){ return m; } });
}

/* ---------- a card's two sides ---------- */
function sdRenderCard(c, opts){
  const note = SD.notes.get(c.noteId); if(!note) return {q: '', a: '', css: '', sounds: {q: [], a: []}};
  const nt = SD.noteTypes.get(note.noteTypeId);
  const tpl = nt.kind === 'standard' ? (nt.templates[c.ord] || nt.templates[0]) : nt.templates[0];
  const browser = opts && opts.browser;
  const qfmt = browser && tpl.bqfmt ? tpl.bqfmt : tpl.qfmt, afmt = browser && tpl.bafmt ? tpl.bafmt : tpl.afmt;
  const js = !!nt.jsEnabled;
  let q = sdRenderTemplate(qfmt, note, nt, {ord: c.ord, side: 'q', card: c});
  let a = sdRenderTemplate(afmt, note, nt, {ord: c.ord, side: 'a', front: q, card: c, typed: opts && opts.typed});
  const soundsOf = h => { const l = []; h.replace(/\[sound:([^\]]+)\]/g, (m, f) => l.push(f)); return l; };
  const qs = soundsOf(q), as = soundsOf(a).filter(f => !qs.includes(f) || !/\{\{FrontSide\}\}/.test(afmt));
  const soundBtn = (m, f) => `<button class="sd-play" data-sdsound="${sdEsc(f)}" aria-label="Play ${sdEsc(f)}">▶</button>`;
  q = sdMath(sdSanitize(q, js)).replace(/\[sound:([^\]]+)\]/g, soundBtn);
  a = sdMath(sdSanitize(a, js)).replace(/\[sound:([^\]]+)\]/g, soundBtn);
  return {q, a, css: nt.css || '', js, sounds: {q: qs, a: as}, nt, note};
}

/* ---------- the sandbox ----------
   A card is a whole small document: the note type's CSS, the site's fonts,
   KaTeX's stylesheet, and the side being shown. It talks to the page only by
   postMessage — a hint opened, a sound asked for, a field edited in place,
   the typed answer, a tag clicked. */
function sdCardDoc(side, html, css, opts){
  const o = opts || {};
  const dark = o.dark ? ' nightMode night_mode' : '';
  const k = sdLibs().katexCss || '';
  /* the page's own bridge runs by its nonce; the card's scripts only if its
     note type has JavaScript switched on — and then still inside the
     sandbox, in an origin of its own, with no way into the page */
  const nonce = 'sd' + Math.random().toString(36).slice(2, 12);
  const csp = `default-src 'none'; img-src blob: data:; media-src blob: data:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src data: https://fonts.gstatic.com; script-src ${o.js ? "'unsafe-inline'" : `'nonce-${nonce}'`};`;
  const bridge = `<script nonce="${nonce}">
(function(){
  var post = function(m){ parent.postMessage(Object.assign({sdCard: ${o.token || 0}}, m), '*'); };
  document.addEventListener('click', function(e){
    var h = e.target.closest('[data-sdhint]'); if(h){ e.preventDefault(); var b = h.nextElementSibling; if(b){ b.hidden = false; b.classList.add('sd-open'); } h.remove(); post({type: 'height', h: document.documentElement.scrollHeight}); return; }
    var s = e.target.closest('[data-sdsound]'); if(s){ post({type: 'sound', file: s.getAttribute('data-sdsound')}); return; }
    var t = e.target.closest('[data-sdtag]'); if(t){ post({type: 'tag', tag: t.getAttribute('data-sdtag')}); return; }
    var f = e.target.closest('[data-sdfield]'); if(f && (e.ctrlKey || e.metaKey)){ e.preventDefault(); f.contentEditable = 'true'; f.focus(); f.classList.add('sd-editing'); }
  });
  document.addEventListener('focusout', function(e){ var f = e.target.closest && e.target.closest('[data-sdfield]'); if(f && f.isContentEditable){ f.contentEditable = 'false'; f.classList.remove('sd-editing'); post({type: 'field', name: f.getAttribute('data-sdfield'), html: f.innerHTML}); } });
  document.addEventListener('keydown', function(e){
    var ti = document.getElementById('typeans');
    if(e.target === ti && e.key === 'Enter'){ e.preventDefault(); post({type: 'typed', value: ti.value, submit: true}); return; }
    if(e.target && (e.target.isContentEditable || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')){ if(e.key === 'Escape') e.target.blur(); return; }
    post({type: 'key', key: e.key, code: e.code, ctrl: e.ctrlKey, meta: e.metaKey, shift: e.shiftKey, alt: e.altKey});
    if([' ', 'Enter'].indexOf(e.key) > -1) e.preventDefault();
  });
  document.addEventListener('input', function(e){ if(e.target.id === 'typeans') post({type: 'typed', value: e.target.value}); });
  document.addEventListener('mouseup', function(){ var s = String(getSelection() || '').trim(); if(s && s.length < 60) post({type: 'select', text: s}); });
  var ro = new ResizeObserver(function(){ post({type: 'height', h: document.documentElement.scrollHeight}); });
  window.addEventListener('load', function(){ ro.observe(document.body); post({type: 'height', h: document.documentElement.scrollHeight}); var ti = document.getElementById('typeans'); if(ti && ti.tagName === 'INPUT') ti.focus(); });
  window.addEventListener('message', function(e){ var m = e.data || {}; if(m.sdFocusType){ var ti = document.getElementById('typeans'); if(ti && ti.focus) ti.focus(); } });
})();
<\/script>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Noto+Serif+SC:wght@400;600&family=Nunito+Sans:wght@400;600&family=IBM+Plex+Mono&display=swap">
<style>${k}</style>
<style>
:root{--sd-ink:${o.ink || '#2b2622'};--sd-accent:${o.accent || '#3f6f8f'}}
html,body{margin:0;padding:0;background:transparent;color:var(--sd-ink)}
body{padding:${o.pad || '28px 22px'};font-size:${Math.round((o.scale || 1) * 100)}%;overflow-wrap:anywhere}
img{max-width:100%;height:auto}
hr#answer{border:0;border-top:1px solid color-mix(in srgb,currentColor 18%,transparent);margin:1.2em auto;width:72%}
.cloze{transition:background-color .35s ease-out}
.sd-reveal .cloze{animation:sdPulse .6s ease-out}
@keyframes sdPulse{0%{background:color-mix(in srgb,var(--sd-accent) 28%,transparent)}100%{background:transparent}}
.sd-hint-body.sd-open{animation:sdOpen .25s ease-out}
@keyframes sdOpen{from{opacity:0;transform:translateY(-4px)}}
a.hint{color:var(--sd-accent);font-size:.8em}
input.sd-typein{font:inherit;font-size:.9em;padding:.35em .6em;border:1px solid color-mix(in srgb,currentColor 25%,transparent);border-radius:6px;background:transparent;color:inherit;width:min(100%,22em);margin-top:.6em;text-align:center}
code#typeans{font-family:"IBM Plex Mono",monospace;font-size:.85em;display:inline-block;margin-top:.5em}
.typeGood{color:#4f7a43;background:rgba(95,138,80,.12)}.typeBad{color:#a0493b;text-decoration:line-through}.typeMissed{color:#7a6a2f;background:rgba(201,169,76,.22)}.typeClose{color:#a8741e;background:rgba(201,169,76,.22)}
code#typeans span{animation:sdType .3s ease-out both;animation-delay:calc(var(--i,0) * 18ms)}
@keyframes sdType{from{opacity:0}}
.sd-play{border:1px solid color-mix(in srgb,currentColor 25%,transparent);background:transparent;color:inherit;border-radius:50%;width:2em;height:2em;cursor:pointer;font-size:.7em;vertical-align:middle;margin:0 .2em}
.sd-editing{outline:2px dashed var(--sd-accent);outline-offset:3px}
.sd-unknown{color:#a0493b;font-size:.7em;font-family:monospace}
.sd-io{position:relative;display:inline-block;max-width:100%}.sd-io img{display:block}
.sd-io .m{position:absolute;background:#ffeba2;border:1px solid #212121;border-radius:2px}
.sd-io .m.q{background:#ff8e8e}.sd-io .m.e{border-radius:50%}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>
<style>${css}</style>
</head><body class="card${dark}${o.reveal ? ' sd-reveal' : ''}"><div class="card${dark}" id="qa">${html}</div>${bridge}${o.js ? '' : ''}</body></html>`;
}
/* media paths in a card become blob: URLs, looked up in the database */
async function sdResolveMedia(html){
  const names = new Set();
  html.replace(/\ssrc=["']([^"':]+?)["']/gi, (m, f) => names.add(decodeURIComponent(f)));
  if(!names.size) return html;
  const urls = {};
  for(const n of names){ const u = await sdMediaUrl(n); if(u) urls[n] = u; }
  return html.replace(/(\ssrc=["'])([^"':]+?)(["'])/gi, (m, a, f, z) => urls[decodeURIComponent(f)] ? a + urls[decodeURIComponent(f)] + z : m);
}
const _sdMediaUrls = new Map();
async function sdMediaUrl(name){
  if(_sdMediaUrls.has(name)) return _sdMediaUrls.get(name);
  try {
    const rows = await db.sdMedia.where('filename').equals(name).toArray();
    const r = rows[0]; if(!r || !r.blob) return null;
    const u = URL.createObjectURL(r.blob); _sdMediaUrls.set(name, u); return u;
  } catch(e){ return null; }
}
async function sdMediaPut(filename, blob){
  const rows = await db.sdMedia.where('filename').equals(filename).toArray();
  const id = rows[0] ? rows[0].id : sdId();
  await db.sdMedia.put({id, filename, blob, mime: blob.type || '', size: blob.size});
  const old = _sdMediaUrls.get(filename); if(old){ URL.revokeObjectURL(old); _sdMediaUrls.delete(filename); }
  return filename;
}
/* a unique name for pasted or recorded media, like Anki's */
function sdMediaName(ext){ return `paste-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.${ext || 'png'}`; }

/* mark each field's rendered text so Ctrl/Cmd+click can edit it in place */
function sdMarkFields(fmt, nt){
  let s = String(fmt || '');
  nt.fields.forEach(f => {
    const re = new RegExp(`\\{\\{(${f.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\}\\}`, 'g');
    s = s.replace(re, `<span data-sdfield="${sdEsc(f.name)}">{{$1}}</span>`);
  });
  return s;
}

/* ---------- Image Occlusion ----------
   The Occlusion field holds the masks, one per line, as Anki writes them:
   {{c1::image-occlusion:rect:left=.1:top=.2:width=.3:height=.1:oi=1}}
   (fractions of the image). "oi=1" is hide-one-guess-one; the default is
   hide-all-guess-one. */
function sdIoShapes(note){
  const out = [];
  String(note.fields[0] || '').replace(/\{\{c(\d+)::image-occlusion:(rect|ellipse|polygon):([^}]*)\}\}/g, (m, n, kind, rest) => {
    const p = {}; rest.split(':').forEach(kv => { const [k, v] = kv.split('='); if(k) p[k] = v; });
    out.push({n: +n, kind, left: +p.left || 0, top: +p.top || 0, width: +p.width || 0, height: +p.height || 0, points: p.points || '', oi: p.oi === '1'});
  });
  return out;
}
function sdIoRender(note, n, side){
  const img = note.fields[1] || '';
  const shapes = sdIoShapes(note);
  const masks = shapes.map(sh => {
    const mine = sh.n === n;
    if(side === 'a' && mine) return '';
    if(!mine && sh.oi) return '';
    if(!mine && side === 'a') return sh.oi ? '' : `<div class="m${sh.kind === 'ellipse' ? ' e' : ''}" style="left:${sh.left * 100}%;top:${sh.top * 100}%;width:${sh.width * 100}%;height:${sh.height * 100}%"></div>`;
    return `<div class="m${mine ? ' q' : ''}${sh.kind === 'ellipse' ? ' e' : ''}" style="left:${sh.left * 100}%;top:${sh.top * 100}%;width:${sh.width * 100}%;height:${sh.height * 100}%"></div>`;
  }).join('');
  return `<div class="sd-io">${img}${masks}</div>`;
}
