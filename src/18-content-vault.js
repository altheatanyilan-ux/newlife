/* ============================================================
   THE BOOK VAULT — passages worth having to hand while writing,
   indexed by theme, pinnable to a piece.

   On what is in here
   ------------------
   The specification supplied twenty-five passages verbatim and then
   said "continue the same pattern for the remaining books". Inventing
   sentences and printing them inside quotation marks under a living
   author's name is not something this file will do: a fabricated quote
   that ends up in a published essay is the writer's problem, not the
   app's. So the vault holds two kinds of row. A quotation is a passage
   quoted as written. A paraphrase (paraphrase:true) is the book's idea
   in plain words, and is drawn and labelled as a summary — never in
   quotation marks, never presentable as something the author said. The
   panel says which is which every time it draws one, and the pin
   carries the label with it.
   ============================================================ */

const VAULT_THEMES = ['identity','mindset','visualization','creativity','mastery','vision',
  'resilience','consciousness','focus','success','relationships','habits'];

/* q(text, book, author, where, themes)  — quoted as written
   p(text, …)                            — the idea, in summary */
function contentVaultSeed(){
  const rows = [];
  const add = (paraphrase, text, bookTitle, author, pageOrChapter, themes) =>
    rows.push({id:uid(), text, bookTitle, author, pageOrChapter, themes, paraphrase, addedAt:new Date().toISOString()});
  const q = (...a) => add(false, ...a);
  const p = (...a) => add(true, ...a);

  /* --- supplied verbatim by the specification --- */
  q('The self-image is the key to human personality and human behavior. Change the self-image and you change the personality and the behavior.',
    'Psycho-Cybernetics', 'Maxwell Maltz', 'Ch. 1', ['identity','mindset']);
  q("Your nervous system cannot tell the difference between an imagined experience and a 'real' experience.",
    'Psycho-Cybernetics', 'Maxwell Maltz', 'Ch. 3', ['visualization','mindset']);
  q('Within you right now is the power to do things you never dreamed possible.',
    'Psycho-Cybernetics', 'Maxwell Maltz', '', ['success','identity']);
  q('You act, and feel, not according to what things are really like, but according to the image your mind holds of what they are like.',
    'Psycho-Cybernetics', 'Maxwell Maltz', 'Ch. 2', ['identity','consciousness']);
  q('Close your eyes and see yourself on a mental motion picture screen… pay attention to small details.',
    'Psycho-Cybernetics', 'Maxwell Maltz', 'Ch. 3', ['visualization','focus']);

  q('Structure determines behavior. If you want to change behavior, change the underlying structure.',
    'The Path of Least Resistance', 'Robert Fritz', '', ['mastery','habits']);
  q('Hold the vision of what you want to create AND an accurate picture of current reality. The discrepancy generates energy.',
    'The Path of Least Resistance', 'Robert Fritz', '', ['vision','creativity']);
  q('The creative process has three stages: germination, assimilation, and completion.',
    'The Path of Least Resistance', 'Robert Fritz', '', ['creativity','mastery']);
  q('You do not solve problems; you create results.',
    'The Path of Least Resistance', 'Robert Fritz', '', ['creativity','mindset']);
  q('The path of least resistance is always determined by the underlying structure.',
    'The Path of Least Resistance', 'Robert Fritz', '', ['habits','consciousness']);

  q('Whatever the mind can conceive and believe, it can achieve.',
    'Think and Grow Rich', 'Napoleon Hill', '', ['mindset','success']);
  q('The starting point of all achievement is desire.',
    'Think and Grow Rich', 'Napoleon Hill', '', ['vision','success']);
  q('Every adversity, every failure, every heartache carries with it the seed of an equal or greater benefit.',
    'Think and Grow Rich', 'Napoleon Hill', '', ['resilience','mindset']);
  q('The majority of men meet with failure because of their lack of persistence in creating new plans to take the place of those which fail.',
    'Think and Grow Rich', 'Napoleon Hill', '', ['mastery','resilience']);
  q('Set your mind on a definite goal and observe how quickly the world stands aside to let you pass.',
    'Think and Grow Rich', 'Napoleon Hill', '', ['focus','success']);

  q('Every thought vibrates, every thought radiates a signal, and every thought attracts a matching signal back.',
    'Ask and It Is Given', 'Esther & Jerry Hicks', '', ['consciousness','mindset']);
  q('You cannot have a happy ending to an unhappy journey.',
    'Ask and It Is Given', 'Esther & Jerry Hicks', '', ['mindset','habits']);
  q('A belief is only a thought you continue to think.',
    'Ask and It Is Given', 'Esther & Jerry Hicks', '', ['identity','consciousness']);
  q('You are the only one who creates your reality.',
    'Ask and It Is Given', 'Esther & Jerry Hicks', '', ['vision','consciousness']);
  q("The standard of success in life isn't the things. It's the amount of joy you feel.",
    'Ask and It Is Given', 'Esther & Jerry Hicks', '', ['success','consciousness']);

  q('Energy, not time, is the fundamental currency of high performance.',
    'The Power of Full Engagement', 'Loehr & Schwartz', '', ['focus','habits']);
  q('The key to sustained high performance is the skillful management of energy across four dimensions.',
    'The Power of Full Engagement', 'Loehr & Schwartz', '', ['mastery','habits']);
  q('The opposite of a positive ritual is not a negative ritual, it is the absence of any ritual.',
    'The Power of Full Engagement', 'Loehr & Schwartz', '', ['habits','mastery']);
  q('To build capacity in any dimension, we must push beyond our normal limits and then recover.',
    'The Power of Full Engagement', 'Loehr & Schwartz', '', ['resilience','mastery']);
  q('Full engagement requires drawing on four separate but related sources of energy: physical, emotional, mental and spiritual.',
    'The Power of Full Engagement', 'Loehr & Schwartz', '', ['focus','consciousness']);

  /* --- the remaining books --- */
  q('Mastery is not really a goal or a destination but rather a process, a journey.',
    'Mastery', 'George Leonard', 'Introduction', ['mastery','identity']);
  q('To love the plateau is to love the eternal now.',
    'Mastery', 'George Leonard', 'The Master and the Plateau', ['mastery','habits']);
  p('Progress in any skill comes in brief spurts followed by a decline to a plateau slightly higher than the last one. Most of the journey is spent on the plateau, and the person who cannot stay there does not get anywhere.',
    'Mastery', 'George Leonard', 'The Master and the Plateau', ['mastery','resilience','habits']);
  p('The master practises primarily for the sake of the practice itself, not for the reward waiting on the other side of it.',
    'Mastery', 'George Leonard', '', ['mastery','focus']);
  p('There are three reliable ways to fall off the path: the dabbler who loves the honeymoon, the obsessive who cannot bear the plateau, and the hacker who settles the moment it is good enough.',
    'Mastery', 'George Leonard', 'Part One', ['mastery','habits','identity']);

  q('The craftsman mindset focuses on what you can offer the world, the passion mindset focuses instead on what the world can offer you.',
    "So Good They Can't Ignore You", 'Cal Newport', 'Rule #2', ['mastery','identity']);
  q("Be so good they can't ignore you.",
    "So Good They Can't Ignore You", 'Cal Newport', 'quoting Steve Martin', ['mastery','success']);
  p('Rare and valuable skills are career capital, and they are what you trade for work worth doing. You have to have something to offer before you can ask for anything.',
    "So Good They Can't Ignore You", 'Cal Newport', 'Rule #2', ['mastery','success','identity']);
  p('"Follow your passion" is bad advice: passion tends to arrive after you have become excellent at something valuable, not before.',
    "So Good They Can't Ignore You", 'Cal Newport', 'Rule #1', ['mastery','vision','identity']);
  p('Control over your working life is the thing worth buying with career capital, and it is dangerous to reach for it before you have earned it.',
    "So Good They Can't Ignore You", 'Cal Newport', 'Rule #3', ['success','mastery']);

  q('Creative visualization is the technique of using your imagination to create what you want in your life.',
    'Creative Visualization', 'Shakti Gawain', 'Ch. 1', ['visualization','creativity']);
  p('Imagining a clear picture of what you want, holding it often and gently, and letting yourself feel that it is already so, is the whole of the practice.',
    'Creative Visualization', 'Shakti Gawain', 'Ch. 2', ['visualization','vision']);
  p('Relaxation comes first. A quiet body and an unhurried mind are the conditions any of this works in.',
    'Creative Visualization', 'Shakti Gawain', 'Ch. 3', ['focus','consciousness']);
  p('Hold the picture lightly. Wanting a thing desperately broadcasts the lack of it, not the having of it.',
    'Creative Visualization', 'Shakti Gawain', '', ['mindset','consciousness']);

  p('Thoughts are a real force, and the ones you return to most often are the ones that shape what you notice and what you do.',
    'Mind Power into the 21st Century', 'John Kehoe', '', ['mindset','consciousness']);
  p('The subconscious does not argue. It accepts what it is given repeatedly and goes to work on it.',
    'Mind Power into the 21st Century', 'John Kehoe', '', ['habits','identity']);
  p('Seeding: plant a clear image of what you want in a relaxed mind, briefly and often, and let attention do the rest.',
    'Mind Power into the 21st Century', 'John Kehoe', '', ['visualization','focus']);

  p('Like attracts like in the world of thought: the mood you hold habitually gathers more of itself.',
    'Thought Vibration', 'William Walker Atkinson', 'Ch. 1', ['mindset','consciousness']);
  p('Fear is a thought habit, and it can be replaced by a better one through deliberate repetition.',
    'Thought Vibration', 'William Walker Atkinson', '', ['resilience','habits']);
  p('We become what we think ourselves into being; character is thought, hardened by repetition.',
    'Thought Vibration', 'William Walker Atkinson', '', ['identity','habits']);

  q('There is a thinking stuff from which all things are made, and which, in its original state, permeates, penetrates, and fills the interspaces of the universe.',
    'The Science of Getting Rich', 'Wallace D. Wattles', 'Ch. 4', ['consciousness','vision']);
  q('A thought, in this substance, produces the thing that is imaged by the thought.',
    'The Science of Getting Rich', 'Wallace D. Wattles', 'Ch. 4', ['visualization','creativity']);
  q('You must get rid of the thought of competition. You are to create, not to compete for what is already created.',
    'The Science of Getting Rich', 'Wallace D. Wattles', 'Ch. 5', ['creativity','success']);
  q('By thought, the thing you want is brought to you; by action you receive it.',
    'The Science of Getting Rich', 'Wallace D. Wattles', 'Ch. 9', ['success','habits']);
  p('Gratitude keeps the mind on the abundance rather than the lack, and a mind on lack cannot form a clear picture of anything else.',
    'The Science of Getting Rich', 'Wallace D. Wattles', 'Ch. 7', ['mindset','consciousness']);

  return rows;
}

function contentVault(){
  if(!S.contentVault) S.contentVault = {quotes:[]};
  const v = S.contentVault;
  if(!Array.isArray(v.quotes)) v.quotes = [];
  if(!v.seeded){ v.quotes = contentVaultSeed().concat(v.quotes); v.seeded = true; }
  return v;
}
/* the index is derived rather than stored — a stored index is one more
   thing that can disagree with the quotes it is supposed to describe */
function vaultThemesIndex(){
  const idx = {};
  contentVault().quotes.forEach(q => (q.themes || []).forEach(t => (idx[t] = idx[t] || []).push(q.id)));
  return idx;
}
function vaultBooks(){
  const m = new Map();
  contentVault().quotes.forEach(q => { if(!m.has(q.bookTitle)) m.set(q.bookTitle, {title:q.bookTitle, author:q.author, n:0}); m.get(q.bookTitle).n++; });
  return Array.from(m.values());
}
/* a piece's themes are the user's own names ("Identity", "Japan"); the
   vault's are lowercase tags. Match on the word, not on the id. */
function pieceVaultTerms(e){
  const names = (e.extra.content.themes || []).map(id => contentThemeName(id).toLowerCase());
  const tags = (e.tags || []).map(t => t.toLowerCase());
  return names.concat(tags).flatMap(n => n.split(/[^a-z]+/).filter(w => w.length > 3));
}
function vaultRanked(e, q = ''){
  const terms = pieceVaultTerms(e), needle = q.toLowerCase();
  return contentVault().quotes.map(x => {
    const hay = (x.themes || []).join(' ').toLowerCase();
    const score = terms.reduce((a, t) => a + (hay.includes(t) || (x.text + ' ' + x.bookTitle).toLowerCase().includes(t) ? 1 : 0), 0);
    return {x, score};
  }).filter(({x}) => !needle || `${x.text} ${x.bookTitle} ${x.author} ${(x.themes || []).join(' ')}`.toLowerCase().includes(needle))
    .sort((a, b) => b.score - a.score || a.x.bookTitle.localeCompare(b.x.bookTitle));
}

/* ---------- quotes the user collected themselves ---------- */
function libraryQuoteRows(q = ''){
  const needle = q.toLowerCase(), out = [];
  (S.entries || []).filter(e => e.type === 'media').forEach(e => {
    const x = e.extra || {};
    (x.quotes || []).forEach(qq => { if(!(qq.text || '').trim()) return;
      out.push({id:qq.id || uid(), text:qq.text, source:e.title, author:x.creator || '',
        pageOrLocation:qq.where || '', whyCaught:qq.why || '', sourceType:'library_quote', sourceId:e.id,
        resonance:x.resonanceLevel || ''}); });
    if((x.installed || '').trim())
      out.push({id:'inst-' + e.id, text:x.installed.trim(), source:e.title, author:x.creator || '',
        pageOrLocation:'what it installed in me', whyCaught:'', sourceType:'library_note', sourceId:e.id,
        resonance:x.resonanceLevel || '', own:true});
  });
  return out.filter(r => !needle || `${r.text} ${r.source} ${r.author}`.toLowerCase().includes(needle));
}

/* ---------- the browser ---------- */
function openQuoteBrowser(e){
  S._qbTab = S._qbTab || 'vault'; S._qbQ = '';
  const m = openModal('<div id="qbHost"></div>', 'wide quote-browser');
  const draw = () => {
    const host = m.querySelector('#qbHost');
    const tab = S._qbTab, q = S._qbQ;
    const pinnedText = new Set((e.extra.content.quotes || []).map(x => x.text));
    const rows = tab === 'vault'
      ? vaultRanked(e, q).map(({x, score}) => ({
          key:x.id, text:x.text, source:x.bookTitle, author:x.author, where:x.pageOrChapter,
          why:'', themes:x.themes, score, paraphrase:x.paraphrase, sourceType:'book_vault_quote', sourceId:x.id}))
      : libraryQuoteRows(q).map(x => ({
          key:x.id, text:x.text, source:x.source, author:x.author, where:x.pageOrLocation,
          why:x.whyCaught, themes:[], score:0, paraphrase:false, own:x.own,
          sourceType:x.sourceType, sourceId:x.sourceId}));
    host.innerHTML = `<h2>Find a quote</h2>
      <div class="row" style="gap:8px;margin-bottom:10px;flex-wrap:wrap">
        ${[['vault','The vault'],['library','Your Library']].map(([k, n]) =>
          `<button class="pf-chip${tab === k ? ' on' : ''}" data-qbt="${k}">${n}</button>`).join('')}
        <input class="inp mono" id="qbQ" placeholder="search…" value="${esc(q)}" style="flex:1;min-width:160px">
      </div>
      ${tab === 'vault' && !q ? `<div class="faint mono" style="margin-bottom:8px">${vaultBooks().length} books · ranked against this piece's themes</div>` : ''}
      <div class="qb-list">${rows.length ? rows.map(r => `<div class="qb-row${pinnedText.has(r.text) ? ' pinned' : ''}${r.score ? ' hit' : ''}">
        <div class="qb-text ${r.paraphrase ? 'para' : 'serif'}">${r.paraphrase ? esc(r.text) : '“' + esc(r.text) + '”'}</div>
        <div class="qb-attr mono">${esc(r.source)}${r.author ? ' · ' + esc(r.author) : ''}${r.where ? ' · ' + esc(r.where) : ''}
          ${r.paraphrase ? '<span class="qb-para">the idea, in summary — not a quotation</span>' : ''}
          ${r.own ? '<span class="qb-own">your words</span>' : ''}</div>
        ${r.why ? `<div class="qb-why">${esc(r.why)}</div>` : ''}
        ${r.themes?.length ? `<div class="qb-themes mono">${r.themes.map(esc).join(' · ')}</div>` : ''}
        <button class="btn sm ghost qb-pin" data-qbpin="${esc(r.key)}" ${pinnedText.has(r.text) ? 'disabled' : ''}>${pinnedText.has(r.text) ? 'pinned' : 'pin to this piece'}</button>
      </div>`).join('') : '<div class="pk-empty lora">Nothing here matches.</div>'}</div>`;
    host.querySelectorAll('[data-qbt]').forEach(b => b.onclick = () => { S._qbTab = b.dataset.qbt; draw(); });
    const inp = host.querySelector('#qbQ');
    inp.oninput = debounce(() => { S._qbQ = inp.value.trim(); draw();
      requestAnimationFrame(() => { const n = m.querySelector('#qbQ'); if(n){ n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }); }, 220);
    host.querySelectorAll('[data-qbpin]').forEach(b => b.onclick = () => {
      const r = rows.find(x => String(x.key) === b.dataset.qbpin); if(!r) return;
      pieceContent(e).quotes.push({id:uid(), text:r.text, source:r.source, author:r.author,
        pageOrLocation:r.where, whyCaught:r.why, sourceType:r.sourceType, sourceId:r.sourceId,
        paraphrase:!!r.paraphrase, addedAt:new Date().toISOString()});
      if(r.sourceType !== 'book_vault_quote') pieceLink(e, r.sourceType === 'library_note' ? 'library_media' : 'library_media', r.sourceId, r.source);
      saveNow(); sound('success'); draw(); pieceRedraw(e); });
  };
  draw();
  setTimeout(() => m.querySelector('#qbQ')?.focus(), 90);
}

/* ---------- linking a piece to your own life ---------- */
const CONTENT_LINK_SOURCES = [
  ['journal_entry',  'Journals',  e => e.type !== 'writing' && e.type !== 'media' && e.type !== 'skill' && e.type !== 'project' && !e.extra?.stage],
  ['library_media',  'Library',   e => e.type === 'media'],
  ['timeline_event', 'Timeline',  e => !!e.occurredAt && e.type !== 'media' && e.type !== 'writing'],
];
function openLifeLinker(e){
  S._llTab = S._llTab || 'journal_entry'; S._llQ = '';
  const m = openModal('<div id="llHost"></div>', 'wide');
  const draw = () => {
    const host = m.querySelector('#llHost');
    const tab = S._llTab, q = (S._llQ || '').toLowerCase();
    const linked = new Set((e.extra.content.linked || []).map(l => l.sourceId));
    let rows = [];
    if(tab === 'value')  rows = (S.values || []).map(v => ({id:v.id, title:v.name, meta:'a value', type:'value_entry'}));
    else if(tab === 'skill')   rows = (S.skills || []).map(s => ({id:s.id, title:s.name, meta:'a skill', type:'skill_milestone'}));
    else if(tab === 'project') rows = (S.projects || []).map(p => ({id:p.id, title:p.title || p.name, meta:'a project', type:'project_update'}));
    else {
      const pick = CONTENT_LINK_SOURCES.find(s => s[0] === tab);
      rows = (S.entries || []).filter(x => x.id !== e.id && pick[2](x)).map(x => ({
        id:x.id, title:x.title || (x.body || '').slice(0, 70) || typeName(x.type),
        meta:`${typeName(x.type)}${x.occurredAt ? ' · ' + fmtDate(x.occurredAt, 'med') : ''}`, type:tab}));
    }
    rows = rows.filter(r => r.title && (!q || `${r.title} ${r.meta}`.toLowerCase().includes(q))).slice(0, 200);
    host.innerHTML = `<h2>Link it to your own life</h2>
      <p class="muted" style="font-size:.86rem">What in here is this piece actually made of?</p>
      <div class="row" style="gap:8px;margin-bottom:10px;flex-wrap:wrap">
        ${CONTENT_LINK_SOURCES.map(([k, n]) => `<button class="pf-chip${tab === k ? ' on' : ''}" data-llt="${k}">${n}</button>`).join('')}
        ${[['value','Values'],['skill','Skills'],['project','Projects']].map(([k, n]) =>
          `<button class="pf-chip${tab === k ? ' on' : ''}" data-llt="${k}">${n}</button>`).join('')}
        <input class="inp mono" id="llQ" placeholder="search…" value="${esc(S._llQ || '')}" style="flex:1;min-width:150px">
      </div>
      <div class="ll-list">${rows.length ? rows.map(r => `<button class="choice ll-row${linked.has(r.id) ? ' on' : ''}" data-ll="${r.id}" data-lltype="${r.type}">
        <span class="ico">${linked.has(r.id) ? '✓' : '+'}</span>
        <span><b>${esc(r.title)}</b><i class="mono">${esc(r.meta)}</i></span></button>`).join('')
        : '<div class="pk-empty lora">Nothing here yet.</div>'}</div>`;
    host.querySelectorAll('[data-llt]').forEach(b => b.onclick = () => { S._llTab = b.dataset.llt; draw(); });
    const inp = host.querySelector('#llQ');
    inp.oninput = debounce(() => { S._llQ = inp.value.trim(); draw();
      requestAnimationFrame(() => { const n = m.querySelector('#llQ'); if(n){ n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }); }, 220);
    host.querySelectorAll('[data-ll]').forEach(b => b.onclick = () => {
      const id = b.dataset.ll, c = pieceContent(e);
      const had = c.linked.findIndex(l => l.sourceId === id);
      if(had >= 0) c.linked.splice(had, 1);
      else { const r = rows.find(x => x.id === id); pieceLink(e, b.dataset.lltype, id, r?.title || ''); }
      saveNow(); sound('click'); draw(); pieceRedraw(e); });
  };
  draw();
}
