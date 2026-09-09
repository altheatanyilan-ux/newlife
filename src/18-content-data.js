/* ============================================================
   CONTENT — the pipeline from a thought to a published thing.

   On not building a second writing tool
   -------------------------------------
   The spec is emphatic that the piece's body, outline and notes must be
   the same data the Writing Studio reads, not copies of it, and that
   there must be one source of truth. The strongest way to honour that
   is not to keep a `writingProjectId` pointing at a project — it is for
   the piece to BE the project.

   A Writing Studio project is already an entry of type 'writing' in
   S.entries, carrying a Scrivener binder, an outline, a scratchpad and
   a publication record. So a piece is one of those, with the pipeline's
   own fields kept under extra.content. Nothing is copied and nothing
   can drift: the word count is counted off the binder, the notes are
   the scratchpad, "open in the Writing Studio" is a link to the entry
   this room is already showing. Every piece written before today
   becomes a piece here automatically, with its stage read off the
   status it already had.
   ============================================================ */

const CONTENT_STAGES = [
  {id:'idea',      name:'Idea',      icon:'○', color:'#7f916a', tint:.15, ws:'Outlining', hint:'a thought that will not leave'},
  {id:'seed',      name:'Seed',      icon:'◍', color:'#a0727e', tint:.15, ws:'Outlining', hint:'worth keeping, not yet shaped'},
  {id:'outline',   name:'Outline',   icon:'◇', color:'#d4a44c', tint:.15, ws:'Outlining', hint:'the bones are down'},
  {id:'draft',     name:'Draft',     icon:'◈', color:'#c9a84c', tint:.15, ws:'Drafting',  hint:'being written'},
  {id:'refining',  name:'Refining',  icon:'◆', color:'#b08968', tint:.15, ws:'Drafting',  hint:'being made better'},
  {id:'ready',     name:'Ready',     icon:'●', color:'#7f916a', tint:.25, ws:'Polished',  hint:'finished, waiting to go out'},
  {id:'published', name:'Published', icon:'▣', color:'#6b5e53', tint:.15, ws:'Published', hint:'out in the world'},
  {id:'archived',  name:'Archived',  icon:'▢', color:'#a89f94', tint:.10, ws:'Polished',  hint:'put away, not thrown away'},
];
const contentStage = id => CONTENT_STAGES.find(s => s.id === id) || CONTENT_STAGES[0];
const CONTENT_STAGE_IDS = CONTENT_STAGES.map(s => s.id);
const CONTENT_ACTIVE_STAGES = ['outline','draft','refining'];

const CONTENT_TYPES = [
  ['essay','Essay'], ['newsletter','Newsletter'], ['thread','Thread'], ['short_story','Short story'],
  ['poem','Poem'], ['reflection','Reflection'], ['guide','Guide'], ['note','Note'],
];
const CONTENT_DESTS = [
  ['personal_blog','Personal blog'], ['substack','Substack'], ['twitter','Twitter'], ['linkedin','LinkedIn'],
  ['medium','Medium'], ['private','Private'], ['multiple','Several places'],
];
const contentTypeName = k => (CONTENT_TYPES.find(t => t[0] === k) || ['', k])[1];
const contentDestName = k => (CONTENT_DESTS.find(t => t[0] === k) || ['', k])[1];

const CONTENT_TRAIL_KINDS = {
  journal_entry:   ['✍', 'a journal entry'],
  timeline_event:  ['◷', 'something that happened'],
  library_media:   ['▤', 'something read or watched'],
  library_quote:   ['❝', 'a quote from the Library'],
  book_vault_quote:['❞', 'a quote from the vault'],
  value_entry:     ['◈', 'a value'],
  skill_milestone: ['⋔', 'a skill'],
  project_update:  ['▲', 'a project'],
  compost:         ['◍', 'a fragment from the compost heap'],
  shower_thought:  ['○', 'a thought out of nowhere'],
  reading:         ['▤', 'reading'],
  conversation:    ['◑', 'a conversation'],
  other:           ['·', 'something else'],
};
const CONTENT_CHECKS = [
  ['proofread', 'Read through one last time'],
  ['titled',    'Title and subtitle settled'],
  ['dest',      'Destination confirmed'],
  ['dated',     'A date set for it'],
  ['url',       'The published address written down'],
];

/* ---------- the piece ---------- */
function contentState(){
  if(!S.content) S.content = {};
  const c = S.content;
  c.themes = Array.isArray(c.themes) ? c.themes : [];
  c.prefs = Object.assign({view:'pipeline', libraryMode:'grid', sort:'edited',
    journalPrompts:true, libraryPrompts:true, lastPiece:null}, c.prefs || {});
  c.dismissedPrompts = Array.isArray(c.dismissedPrompts) ? c.dismissedPrompts : [];
  return c;
}
/* Content fields hang off the writing entry the piece already is. */
function pieceContent(e){
  const x = e.extra = e.extra || {};
  const c = x.content = x.content || {};
  if(!CONTENT_STAGE_IDS.includes(c.stage)){
    /* a piece written before this room existed gets the stage its Writing
       Studio status already implies, rather than being dumped back at Idea */
    const back = {Outlining:'outline', Drafting:'draft', Polished:'ready', Published:'published'};
    c.stage = back[x.status] || 'idea';
  }
  c.stageAt   = c.stageAt || e.createdAt || new Date().toISOString();
  c.subtitle  = c.subtitle || '';
  c.type      = CONTENT_TYPES.some(t => t[0] === c.type) ? c.type : 'essay';
  c.dest      = CONTENT_DESTS.some(t => t[0] === c.dest) ? c.dest : (x.target?.dest ? 'personal_blog' : 'private');
  c.themes    = Array.isArray(c.themes) ? c.themes : [];
  c.trail     = Array.isArray(c.trail) ? c.trail : [];
  c.linked    = Array.isArray(c.linked) ? c.linked : [];
  c.quotes    = Array.isArray(c.quotes) ? c.quotes : [];
  c.checks    = c.checks || {};
  c.scheduled = c.scheduled || '';
  c.publishedOn = c.publishedOn || '';
  c.url       = c.url || '';
  c.pinned    = !!c.pinned;
  c.order     = c.order == null ? Date.now() : c.order;
  c.raw       = c.raw || '';                       // a seed's raw thought
  c.focusMinutes = +c.focusMinutes || 0;           // time the Planning timer logged against it
  return c;
}
function contentPieces(){ return (S.entries || []).filter(e => e.type === 'writing').map(e => { pieceContent(e); return e; }); }
function contentPiece(id){ const e = byId(S.entries, id); return e && e.type === 'writing' ? (pieceContent(e), e) : null; }
function contentByStage(stage){ return contentPieces().filter(e => e.extra.content.stage === stage); }

/* The word count is the binder's, counted rather than stored, so it cannot
   disagree with what is actually written. wsProjectWords already does this
   for the Writing Studio; using it means both rooms report one number. */
function pieceWords(e){
  if(typeof wsProjectWords === 'function') { try { return wsProjectWords(e); } catch(err){} }
  return (e.body || '').trim().split(/\s+/).filter(Boolean).length;
}
function pieceTarget(e){ return +e.extra?.target?.wordTarget || 0; }
function pieceBody(e){
  if(typeof wsFlatDocs === 'function' && e.extra?.binder){
    const docs = wsFlatDocs(e.extra.binder).filter(n => (n.body || '').trim());
    if(docs.length) return docs.map(n => n.body).join('\n\n');
  }
  return e.body || '';
}
function pieceEditedAt(e){
  let t = e.extra?.content?.stageAt || e.createdAt || '';
  if(e.extra?.binder && typeof wsFlatDocs === 'function')
    wsFlatDocs(e.extra.binder).forEach(n => { if((n.updatedAt || '') > t) t = n.updatedAt; });
  return t;
}
/* untouched for a month in a stage that is supposed to be moving */
function pieceStale(e){
  const c = e.extra.content;
  if(!CONTENT_ACTIVE_STAGES.includes(c.stage)) return false;
  return daysSince((pieceEditedAt(e) || '').slice(0, 10)) > 30;
}
function pieceSoon(e){
  const c = e.extra.content;
  if(!c.scheduled || c.stage === 'published') return false;
  const d = daysBetween(today(), c.scheduled);
  return d >= 0 && d <= 7;
}
function pieceOverdue(e){
  const c = e.extra.content;
  return !!c.scheduled && c.scheduled < today() && c.stage !== 'published' && c.stage !== 'archived';
}

/* The Writing Studio keeps four statuses and this room keeps eight. Moving a
   stage sets the status it implies; moving the status only moves the stage
   when the stage does not already sit inside that status, so the finer
   distinction is never thrown away by a coarser control. */
function pieceSetStage(e, stage){
  const c = pieceContent(e);
  if(!CONTENT_STAGE_IDS.includes(stage) || c.stage === stage) return;
  c.stage = stage; c.stageAt = new Date().toISOString();
  e.extra.status = contentStage(stage).ws;
  if(stage === 'published' && !c.publishedOn) c.publishedOn = today();
  saveNow();
}
function pieceSyncFromStudio(e){
  const c = pieceContent(e);
  const want = e.extra.status;
  if(contentStage(c.stage).ws === want) return;
  const first = CONTENT_STAGES.find(s => s.ws === want);
  if(first){ c.stage = first.id; c.stageAt = new Date().toISOString(); }
}

/* ---------- themes ---------- */
function contentTheme(id){ return contentState().themes.find(t => t.id === id || t.name.toLowerCase() === String(id).toLowerCase()) || null; }
function contentThemeName(id){ return contentTheme(id)?.name || id; }
function contentThemeColor(id){ return contentTheme(id)?.color || 'var(--faint)'; }
function contentEnsureTheme(name){
  const c = contentState(); const found = contentTheme(name); if(found) return found;
  const t = {id:uid(), name:String(name).trim(), color:PLAN_COLORS[c.themes.length % PLAN_COLORS.length],
    description:'', linkedValueIds:[], linkedThreadIds:[]};
  c.themes.push(t); return t;
}

/* ---------- what to publish next ----------
   Ready first; then a refining piece that has most of its words; then
   anything drafted in the last three days. Within a tier, most recent. */
function contentWhatsNext(n = 5){
  const tier = e => {
    const c = e.extra.content, w = pieceWords(e), t = pieceTarget(e);
    if(c.stage === 'ready') return 0;
    if(c.stage === 'refining' && t && w / t >= .8) return 1;
    if(c.stage === 'refining') return 2;
    if(c.stage === 'draft' && daysSince((pieceEditedAt(e) || '').slice(0, 10)) <= 3) return 3;
    return 9;
  };
  return contentPieces().filter(e => !['published','archived'].includes(e.extra.content.stage))
    .map(e => ({e, t: tier(e)})).filter(x => x.t < 9)
    .sort((a, b) => a.t - b.t || (pieceEditedAt(b.e) || '').localeCompare(pieceEditedAt(a.e) || ''))
    .slice(0, n).map(x => x.e);
}

function pieceAddTrail(e, type, description, sourceId = null){
  pieceContent(e).trail.push({id:uid(), type, sourceId, description, addedAt:new Date().toISOString()});
}
function pieceLink(e, sourceType, sourceId, title){
  const c = pieceContent(e);
  if(c.linked.some(l => l.sourceType === sourceType && l.sourceId === sourceId)) return;
  c.linked.push({id:uid(), sourceType, sourceId, title, addedAt:new Date().toISOString()});
}
/* every place a piece points at should be able to point back */
function contentReferencing(sourceType, sourceId){
  return contentPieces().filter(e => (e.extra.content.linked || [])
    .some(l => l.sourceType === sourceType && l.sourceId === sourceId));
}
function contentBackrefHTML(sourceType, sourceId){
  const used = contentReferencing(sourceType, sourceId);
  if(!used.length) return '';
  return `<div class="ct-backref mono">used in ${used.map(e =>
    `<a href="#/content">${esc(e.title || 'an untitled piece')}</a>`).join(', ')}</div>`;
}

/* ---------- making one ---------- */
function contentNewPiece({title = '', stage = 'idea', type = 'essay', dest = 'private',
                          themes = [], raw = '', trail = null, linked = null} = {}){
  const e = newWriting();                          // a Writing Studio project, which is what a piece is
  e.title = title;
  const c = pieceContent(e);
  c.stage = stage; c.stageAt = new Date().toISOString();
  c.type = type; c.dest = dest; c.themes = themes.slice(); c.raw = raw;
  e.extra.status = contentStage(stage).ws;
  if(raw) e.extra.scratchpad = raw;
  if(trail) c.trail.push(Object.assign({id:uid(), sourceId:null, addedAt:new Date().toISOString()}, trail));
  if(linked) pieceLink(e, linked.sourceType, linked.sourceId, linked.title);
  saveNow();
  return e;
}

/* ---------- migration ----------
   Runs on every visit to the room and is cheap: the work is idempotent
   and touches only writing entries, of which there are never many. */
function migrateContent(){
  const c = contentState();
  if(!c.seededThemes){
    CONTENT_SEED_THEMES.forEach(([name, color, description]) => {
      if(!contentTheme(name)) c.themes.push({id:uid(), name, color, description, linkedValueIds:[], linkedThreadIds:[]});
    });
    c.seededThemes = true;
  }
  contentVault();
  /* the Writing Studio may have moved a status while this room was closed */
  contentPieces().forEach(pieceSyncFromStudio);
  saveNow();
}
const CONTENT_SEED_THEMES = [
  ['Identity',            '#b08968', "Who I am, who I'm becoming, self-image"],
  ['Creativity',          '#a0727e', 'Making things, and what making does to the maker'],
  ['Mastery',             '#7f916a', 'The long apprenticeship, plateaus, practice'],
  ['Freedom',             '#d4a44c', 'Room to move, and what it costs'],
  ['Japan',               '#6b7f8e', 'A place, and everything it stands in for'],
  ['Career & Craft',      '#8a7f9e', 'Work worth doing and being good enough to do it'],
  ['Consciousness',       '#9e8a6b', 'Attention, awareness, the inside of a mind'],
  ['Relationships',       '#c98f7a', 'Other people, and being known by them'],
  ['Money & Independence','#6f8f7a', 'What it buys, what it demands'],
  ['Discipline',          '#8e6b6b', 'Doing it when it is dull'],
  ['Reading & Learning',  '#7a8fa0', 'Taking things in, and what survives the taking'],
  ['Storytelling',        '#a8916b', 'Shape, arc, the reason anyone keeps reading'],
];
