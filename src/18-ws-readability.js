/* ============================================================
   THE WRITING STUDIO — reading your own draft

   Two overlays, one mechanism. A textarea cannot colour its own text,
   so a mirror div sits behind it carrying the same face, size, leading
   and padding, and the textarea above it is given a transparent
   foreground and a visible caret. The two scroll together. Everything
   here is measurement and regular expressions: nothing is sent
   anywhere, nothing is corrected automatically, and the draft in the
   textarea is never rewritten by the overlay.

   Readability is Hemingway's idea: show the writer which sentences are
   doing too much work. Progressive summarization is Tiago Forte's:
   mark what matters in three passes so a long draft can be distilled
   to the lines worth keeping. The marks live in the text itself, as
   two, three or four equals signs, so they survive a reload and read
   as something deliberate rather than as corruption.
   ============================================================ */

const WS_LAYER_MARKS = ['', '==', '===', '===='];   // index = layer
const WS_LAYER_NAMES = ['none', 'worth keeping', 'the core of it', "the line I'd quote"];

function wsRead(){ S.wsRead = S.wsRead || {}; const r = S.wsRead;
  if(typeof r.on !== 'boolean') r.on = false;
  if(typeof r.marks !== 'boolean') r.marks = true;
  if(typeof r.distil !== 'number') r.distil = 0;      // 0 = off, else the minimum layer shown
  return r; }

/* ---------- the measurements ---------- */
const WS_SYLL_SKIP = /(?:[^laeiouy]es|ed|[^laeiouy]e)$/;
function syllables(word){
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if(!w) return 0;
  if(w.length <= 3) return 1;
  const t = w.replace(WS_SYLL_SKIP, '').replace(/^y/, '');
  return (t.match(/[aeiouy]{1,2}/g) || ['x']).length;
}
/* "was written", "have been taken", "is being carried" */
const WS_PASSIVE = /\b(?:am|is|are|was|were|be|been|being)\s+(?:\w+ly\s+)?(\w+(?:ed|en|wn|rn|ne|ung|ought|aught))\b/gi;
const WS_ADVERB  = /\b\w{4,}ly\b/gi;
/* phrases with a shorter form. The replacement is only ever suggested. */
const WS_WORDY = [
  ['in order to', 'to'], ['at this point in time', 'now'], ['at the present time', 'now'],
  ['due to the fact that', 'because'], ['in the event that', 'if'], ['for the purpose of', 'to'],
  ['a large number of', 'many'], ['the majority of', 'most'], ['in spite of the fact that', 'although'],
  ['with regard to', 'about'], ['in terms of', 'in'], ['it is important to note that', ''],
  ['there is no doubt but that', 'doubtless'], ['on a daily basis', 'daily'],
  ['has the ability to', 'can'], ['is able to', 'can'], ['in the near future', 'soon'],
  ['prior to', 'before'], ['subsequent to', 'after'], ['utilize', 'use'], ['utilized', 'used'],
  ['a number of', 'some'], ['whether or not', 'whether'], ['each and every', 'every'],
];
/* split on sentence ends, keeping the offsets so the overlay can mark them */
function wsSentences(text){
  const out = []; const re = /[^.!?\n]+[.!?]*[\s\n]*/g; let m;
  while((m = re.exec(text))){ if(!m[0].trim()) continue;
    out.push({start:m.index, end:m.index + m[0].length, text:m[0]}); }
  return out;
}
/* takes the sentence's text, not the {start,end,text} record around it */
function wsSentenceGrade(text){
  const words = (String(text).match(/[A-Za-z][A-Za-z'-]*/g) || []);
  if(!words.length) return {words:0, hard:0};
  const syl = words.reduce((a, w) => a + syllables(w), 0);
  /* Flesch-Kincaid for a single sentence: length dominates, which is
     exactly the signal Hemingway is showing */
  const grade = .39 * words.length + 11.8 * (syl / words.length) - 15.59;
  return {words: words.length, syl, grade};
}
function wsReadStats(text){
  const clean = wsStripMarks(text);
  const sents = wsSentences(clean).filter(s => s.text.trim().length > 1);
  const words = (clean.match(/[A-Za-z][A-Za-z'-]*/g) || []);
  const syl = words.reduce((a, w) => a + syllables(w), 0);
  const paras = clean.split(/\n{2,}/).filter(p => p.trim());
  const hard = sents.filter(s => wsSentenceGrade(s.text).words > 25).length;
  const dense = sents.filter(s => { const n = wsSentenceGrade(s.text).words; return n >= 20 && n <= 25; }).length;
  const passive = (clean.match(WS_PASSIVE) || []).length;
  const adverbs = (clean.match(WS_ADVERB) || []).length;
  const wordy = WS_WORDY.filter(([p]) => new RegExp('\\b' + p + '\\b', 'i').test(clean)).length;
  const grade = words.length && sents.length
    ? .39 * (words.length / sents.length) + 11.8 * (syl / words.length) - 15.59 : 0;
  return {words:words.length, sentences:sents.length, paragraphs:paras.length,
    avgSentence: sents.length ? words.length / sents.length : 0,
    avgParagraph: paras.length ? words.length / paras.length : 0,
    grade: Math.max(1, grade), minutes: words.length / 238,
    hard, dense, passive, adverbs, wordy};
}

/* ---------- the mirror ---------- */
/* Marks are stripped before measuring and put back before painting, so
   the equals signs never count as words and never split a sentence. */
function wsStripMarks(text){ return String(text || '').replace(/={2,4}/g, ''); }
function wsMarkLayer(run){ return WS_LAYER_MARKS.indexOf(run) || 0; }

function wsOverlayHTML(text, {readability, marks}){
  let html = esc(String(text || ''));
  /* the summarization layers first — longest run of equals signs wins */
  if(marks){
    html = html.replace(/====([\s\S]+?)====/g, (m, t) => `<mark class="wsl3">${t}</mark>`)
               .replace(/===([\s\S]+?)===/g,  (m, t) => `<mark class="wsl2">${t}</mark>`)
               .replace(/==([\s\S]+?)==/g,    (m, t) => `<mark class="wsl1">${t}</mark>`);
  }
  if(readability){
    /* sentence-level flags are painted on the plain runs only, so a
       highlight and a hard sentence can overlap without fighting */
    html = html.replace(/(^|<\/mark>)([^<]+)/g, (m, lead, chunk) => lead + wsFlagChunk(chunk));
  }
  return html + '\n\n';   // a trailing line keeps the mirror as tall as the box
}
function wsFlagChunk(chunk){
  let out = '';
  wsSentences(chunk).forEach(s => {
    const g = wsSentenceGrade(s.text);
    let inner = wsFlagWords(s.text);
    if(g.words > 25) inner = `<span class="wsr-hard">${inner}</span>`;
    else if(g.words >= 20) inner = `<span class="wsr-dense">${inner}</span>`;
    out += inner;
  });
  return out || chunk;
}
/* the word-level flags run on already-escaped text, so they must not
   look inside the tags the sentence pass may have added */
function wsFlagWords(t){
  return t.replace(WS_PASSIVE, m => `<span class="wsr-passive">${m}</span>`)
          .replace(WS_ADVERB, m => `<span class="wsr-adverb">${m}</span>`)
          .replace(new RegExp('\\b(' + WS_WORDY.map(w => w[0]).join('|') + ')\\b', 'gi'),
            m => `<span class="wsr-wordy" title="try: ${esc((WS_WORDY.find(w => w[0].toLowerCase() === m.toLowerCase()) || ['', ''])[1] || 'cutting it')}">${m}</span>`);
}

/* ---------- applying a layer to the selection ---------- */
function wsApplyLayer(ta, layer){
  if(!ta) return;
  const a = ta.selectionStart, b = ta.selectionEnd;
  if(layer){
    if(a === b) return toast('Select the passage first.');
    const bare = ta.value.slice(a, b).replace(/={2,4}/g, '');   // never nest one mark inside another
    const mark = WS_LAYER_MARKS[layer];
    ta.value = ta.value.slice(0, a) + mark + bare + mark + ta.value.slice(b);
    ta.setSelectionRange(a, a + mark.length * 2 + bare.length);
  } else {
    /* Clearing works on whatever the selection touches, not only on what
       it strictly contains: selecting the words of a marked passage and
       pressing ⌘⇧0 must take its delimiters off, and they sit outside
       the selection. With no selection, the run under the caret goes. */
    const runs = [];
    const re = /(={2,4})([\s\S]{0,8000}?)\1/g; let m;
    while((m = re.exec(ta.value))) runs.push({from:m.index, to:m.index + m[0].length});
    const hit = runs.filter(r => r.from <= b && a <= r.to);
    if(!hit.length) return;
    let out = ta.value, shift = 0;
    hit.forEach(r => { const piece = out.slice(r.from - shift, r.to - shift);
      const stripped = piece.replace(/^={2,4}|={2,4}$/g, '');
      out = out.slice(0, r.from - shift) + stripped + out.slice(r.to - shift);
      shift += piece.length - stripped.length; });
    ta.value = out;
    ta.setSelectionRange(Math.max(0, a - 2), Math.max(0, a - 2));
  }
  ta.dispatchEvent(new Event('input'));
  sound('click');
}
/* what survives a distillation pass */
function wsDistilled(text, minLayer){
  const out = [];
  const re = /(={2,4})([\s\S]+?)\1/g; let m;
  while((m = re.exec(text))){
    const layer = m[1].length - 1;
    if(layer >= minLayer) out.push({layer, text:m[2].replace(/={2,4}/g, '').trim()});
  }
  return out;
}
function wsDistilHTML(proj){
  const r = wsRead(); const d = wsFind(proj.extra.binder, proj.extra.openDoc);
  const rows = d ? wsDistilled(d.body, r.distil) : [];
  const words = rows.reduce((a, x) => a + wordCount(x.text), 0);
  const whole = d ? wordCount(wsStripMarks(d.body)) : 0;
  return `<div class="ws-distil">
    <div class="row between" style="align-items:baseline;margin-bottom:10px">
      <span class="k mono">${esc(WS_LAYER_NAMES[r.distil] || 'everything marked')} and above</span>
      <span class="mono faint">${words.toLocaleString()} of ${whole.toLocaleString()} words — ${whole ? Math.round(words / whole * 100) : 0}%</span></div>
    <div class="row" style="gap:5px;margin-bottom:12px">${[1,2,3].map(l =>
      `<button class="pf-chip${r.distil === l ? ' on' : ''}" data-wsdistil="${l}">${esc(WS_LAYER_NAMES[l])}</button>`).join('')}
      <button class="pf-chip" data-wsdistil="0">back to the draft</button></div>
    ${rows.length ? rows.map(x => `<p class="wsd-row wsl${x.layer}">${esc(x.text)}</p>`).join('')
      : `<div class="pk-empty lora">Nothing marked at this layer yet. Select a passage and press ⌘⇧1.</div>`}
  </div>`;
}

/* ---------- the stats panel ---------- */
function wsReadPanelHTML(proj){
  const d = wsFind(proj.extra.binder, proj.extra.openDoc);
  if(!d || d.type === 'folder') return '';
  const s = wsReadStats(d.body);
  if(!s.words) return '<div class="pk-empty">Nothing written yet to read.</div>';
  const pct = n => s.sentences ? Math.round(n / s.sentences * 100) : 0;
  const row = (label, value, note = '', cls = '') =>
    `<div class="wsr-row ${cls}"><span>${esc(label)}</span><b class="mono">${esc(String(value))}</b>
      ${note ? `<i class="mono">${esc(note)}</i>` : ''}</div>`;
  const gradeNote = s.grade <= 8 ? 'plain enough for anyone'
    : s.grade <= 12 ? 'demands some attention' : 'heavy going';
  return `<div class="ws-readpanel">
    ${row('reading grade', s.grade.toFixed(1), gradeNote, s.grade > 12 ? 'warn' : '')}
    ${row('reading time', `${Math.max(1, Math.round(s.minutes))} min`, `${s.words.toLocaleString()} words`)}
    ${row('sentences', s.sentences, `${s.avgSentence.toFixed(1)} words each`)}
    ${row('paragraphs', s.paragraphs, `${Math.round(s.avgParagraph)} words each`)}
    <hr class="wsr-hr">
    ${row('very hard to read', s.hard, `${pct(s.hard)}% of sentences`, s.hard ? 'flag hard' : '')}
    ${row('hard to read', s.dense, `${pct(s.dense)}%`, s.dense ? 'flag dense' : '')}
    ${row('passive voice', s.passive, '', s.passive ? 'flag passive' : '')}
    ${row('adverbs', s.adverbs, 'not errors — signals', s.adverbs ? 'flag adverb' : '')}
    ${row('phrases with a shorter form', s.wordy, '', s.wordy ? 'flag wordy' : '')}
    <div class="faint lora" style="font-size:.78rem;margin-top:10px">Nothing here is corrected for you. It only says where the reader will slow down.</div>
  </div>`;
}

/* ---------- wiring ---------- */
function wsPaintOn(){ const r = wsRead(); return r.on || r.marks; }

/* The mirror only works while it agrees with the textarea about every
   pixel of layout. It inherits the same face, size, leading and box, and
   is repainted on the same debounce the body save already runs on — a
   repaint per keystroke would fight the caret on a long draft. */
function bindWsPaint(root, proj, redraw){
  const ta = root.querySelector('#wBody'), mirror = root.querySelector('#wMirror');
  if(!ta || !mirror) return;
  const paint = () => { const r = wsRead();
    mirror.innerHTML = wsOverlayHTML(ta.value, {readability:r.on, marks:r.marks}); };
  /* while a sentence is being typed its flags would flicker, so the paint
     waits for the pause — the spec's "fades gently, re-evaluates on blur" */
  const repaint = debounce(paint, 420);
  ta.addEventListener('input', () => { mirror.classList.add('settling'); repaint(); });
  ta.addEventListener('blur', () => { paint(); mirror.classList.remove('settling'); });
  const settle = debounce(() => mirror.classList.remove('settling'), 460);
  ta.addEventListener('input', settle);
  ta.addEventListener('scroll', () => { mirror.scrollTop = ta.scrollTop; });
}
function bindWsReadControls(root, proj, redraw){
  const r = wsRead();
  const btn = (id, fn) => { const b = root.querySelector(id); if(b) b.onclick = () => { fn(); saveNow(); sound('click'); redraw(); }; };
  btn('#wsReadBtn',   () => { r.on = !r.on; if(r.on) r.distil = 0; });
  btn('#wsMarkBtn',   () => { r.marks = !r.marks; });
  btn('#wsDistilBtn', () => { r.distil = r.distil ? 0 : 1; });
  $$('[data-wsdistil]', root).forEach(b => b.onclick = () => {
    r.distil = +b.dataset.wsdistil; saveNow(); sound('click'); redraw(); });
}

/* ⌘⇧R for readability, ⌘⇧1–3 to mark, ⌘⇧0 to clear */
document.addEventListener('keydown', ev => {
  if(!(ev.metaKey || ev.ctrlKey) || !ev.shiftKey) return;
  if(parseHash().name !== 'writing') return;
  const k = ev.key.toLowerCase();
  const r = wsRead();
  if(k === 'r'){ ev.preventDefault(); r.on = !r.on; if(r.on) r.distil = 0; saveNow(); sound('click'); rerender(); return; }
  if(!'0123'.includes(k)) return;
  const ta = document.querySelector('#wBody'); if(!ta) return;
  ev.preventDefault();
  wsApplyLayer(ta, +k);
  if(!r.marks){ r.marks = true; saveNow(); rerender(); }
});
