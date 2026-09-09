/* ============================================================
   CONTENT — the bridges from the rest of the house.

   The pipeline is only worth having if things get onto it without
   being retyped. So the rooms that hold raw material offer a way over:
   a journal entry that has grown long enough to be about something, a
   book that changed you, a formative event with something installed in
   it. One button, one seed, the source linked both ways.

   The prompt is deliberately quiet and permanently dismissible. A
   suggestion you cannot turn off is not a suggestion.
   ============================================================ */

/* the journal types that are ever about something at length. Gratitude
   and quick notes are not invitations to write an essay. */
const CT_BRIDGE_TYPES = ['reflection','synchronicity','manifestation','question','dream','lifeevent','memory'];
const CT_BRIDGE_MIN_WORDS = 50;

function ctPromptDismissed(id){ return contentState().dismissedPrompts.includes(id); }
function ctDismissPrompt(id){ const c = contentState(); if(!c.dismissedPrompts.includes(id)) c.dismissedPrompts.push(id); saveNow(); }
/* an entry already made into something never asks again */
function ctAlreadyUsed(sourceId){ return contentReferencing_any(sourceId).length > 0; }
function contentReferencing_any(sourceId){
  return contentPieces().filter(e => (e.extra.content.linked || []).some(l => l.sourceId === sourceId));
}

/* An entry already made into something shows what it became, and never
   asks again. Otherwise it asks once, quietly, and takes no for an answer. */
function ctBridgeHTML(sourceId, line, {sourceType, raw = '', spark = '', title = ''}){
  const back = contentReferencing_any(sourceId);
  if(back.length) return `<div class="ct-bridge used mono">used in ${back.map(e =>
    `<a href="#/content" data-ctgo="${e.id}">${esc(e.title || 'an untitled piece')}</a>`).join(', ')}</div>`;
  if(!line || ctPromptDismissed(sourceId)) return '';
  return `<div class="ct-bridge" data-ctbridge="${sourceId}"
      data-ctsrc="${esc(sourceType)}" data-ctraw="${esc(raw)}" data-ctspark="${esc(spark)}" data-cttitle="${esc(title)}">
    <span class="lora">${esc(line)}</span>
    <button class="btn sm ghost" data-ctseed="${sourceId}">✍ add as a seed</button>
    <button class="ct-bx" data-ctdismiss="${sourceId}" title="not this one">×</button></div>`;
}

/* --- Journals --- */
function ctJournalBridge(e){
  const ask = CT_BRIDGE_TYPES.includes(e.type)
    && wordCount(e.body) >= CT_BRIDGE_MIN_WORDS
    && contentState().prefs.journalPrompts;
  return ctBridgeHTML(e.id, ask ? 'This feels like something worth writing about.' : '',
    {sourceType:'journal_entry', raw:e.body.slice(0, 600), title:e.title || '',
     spark:`Promoted from ${typeName(e.type).toLowerCase()}${e.occurredAt ? ' dated ' + fmtDate(e.occurredAt, 'med') : ''}`});
}
/* --- the Library --- */
function ctMediaBridge(e){
  const x = e.extra || {};
  const ask = ['changed','lives'].includes(x.resonanceLevel) && contentState().prefs.libraryPrompts;
  return ctBridgeHTML(e.id, ask ? 'This changed you. Is there an essay in that?' : '',
    {sourceType:'library_media', raw:(x.installed || x.oneLineCapture || '').slice(0, 600),
     title:'', spark:`Sparked by ${e.title}${x.creator ? ', ' + x.creator : ''}`});
}
/* --- the Timeline --- */
function ctFormativeBridge(e){
  const inst = (e.extra?.installed || '').trim();
  const ask = (!!inst || wordCount(e.body) >= CT_BRIDGE_MIN_WORDS) && contentState().prefs.journalPrompts;
  return ctBridgeHTML(e.id, ask ? 'There is writing in this one.' : '',
    {sourceType:'timeline_event', raw:(inst || e.body).slice(0, 600), title:'',
     spark:`Emerged from ${e.title || 'a formative event'}`});
}

/* one delegated handler for every bridge on the site */
document.addEventListener('click', ev => {
  const dis = ev.target.closest('[data-ctdismiss]');
  if(dis){ ev.preventDefault(); ev.stopPropagation();
    ctDismissPrompt(dis.dataset.ctdismiss);
    dis.closest('.ct-bridge')?.remove(); sound('click'); return; }
  const go = ev.target.closest('[data-ctgo]');
  if(go){ ev.preventDefault(); navigate('#/content');
    setTimeout(() => openPieceDetail(go.dataset.ctgo), 320); return; }
  const seed = ev.target.closest('[data-ctseed]');
  if(!seed) return;
  ev.preventDefault(); ev.stopPropagation();
  const box = seed.closest('.ct-bridge'); if(!box) return;
  const entry = byId(S.entries, box.dataset.ctbridge);
  openContentCapture({
    raw: box.dataset.ctraw, title: box.dataset.cttitle, spark: box.dataset.ctspark,
    trailType: box.dataset.ctsrc,
    linked: entry ? {sourceType:box.dataset.ctsrc, sourceId:entry.id,
      title: entry.title || (entry.body || '').slice(0, 60) || typeName(entry.type)} : null,
  });
}, true);

/* ---------- the global add modal ----------
   "Catch an idea" belongs beside Task and Memory, not only on this page. */
if(typeof EntryActions === 'object' && EntryActions)
  EntryActions.contentIdea = () => openContentCapture();
