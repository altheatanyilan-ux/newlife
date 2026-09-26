/* ============================================================
   BRAND STRATEGY — the model. A view inside the Content Studio.

   A commonplace book and a strategy book for each account you run. Its job
   is to make the decisions across many posts deliberate; the posts
   themselves are written in the Writing Studio, which this never writes to.

   THE FRAME is S.brand (a meta key): the accounts, each with its charter,
   voice and visual, and three to five pillars whose targets add to 100%.

   EVERY NOTE IS AN ENTRY in the house's own model: type 'brand', its fields
   under extra.brand. A quote is a type 'quote' entry with extra.brand added,
   so it also shows in the quotes journal, on tag pages and on Today.

   THE FILING RULE: every note has a scope (one or more accounts, or
   studio-wide), a kind (from the fixed list below) and an anchor (the
   charter, pillar, plan or decision it serves; a capture may anchor to its
   account or to the studio). A note missing any of the three is in the
   Inbox, and the Inbox has a count on every page.

   THE BOUNDARY: a slot keeps the id of a Writing Studio entry and reads its
   title and status to show them. Nothing here writes to a writing entry;
   "Start in Writing Studio" calls the Studio's own newWriting() and sets
   only the title. A deleted piece shows as missing, and can be unlinked.
   ============================================================ */

const BRAND_GROUPS = ['Capture', 'Strategy', 'Planning', 'Judgment', 'Holding'];
/* The kinds, in one object: to add one later, add a row. f = its own fields. */
const BRAND_KINDS = {
  quote:      {g: 'Capture',  n: 'Quote',           ic: '“', capture: true, f: [['text', 'The quote', 'area'], ['author', 'Author'], ['source', 'Source']]},
  observation:{g: 'Capture',  n: 'Observation',     ic: '◌', capture: true, f: [['text', 'What you noticed', 'area']]},
  idea:       {g: 'Capture',  n: 'Idea',            ic: '✦', capture: true, f: [['text', 'The idea', 'area']]},
  swipe:      {g: 'Capture',  n: 'Reference',       ic: '⎘', capture: true, f: [['link', 'Link or where it is'], ['text', 'What it is', 'area'], ['why', 'Why it works', 'area']]},
  competitor: {g: 'Capture',  n: 'Competitor note', ic: '⚑', capture: true, f: [['competitorAccount', 'Their account'], ['text', 'What they do', 'area'], ['take', 'What I take', 'area'], ['avoid', 'What I avoid', 'area']]},
  charter:    {g: 'Strategy', n: 'Charter statement', ic: '§', f: [['text', 'The statement', 'area']]},
  voiceRule:  {g: 'Strategy', n: 'Voice rule',      ic: '♪', f: [['text', 'The rule', 'area']]},
  pillarNote: {g: 'Strategy', n: 'Pillar',          ic: '▥', f: [['text', 'What this pillar is for', 'area']]},
  hypothesis: {g: 'Strategy', n: 'Hypothesis',      ic: '?', f: [['statement', 'If … then …', 'area']]},
  horizon:    {g: 'Planning', n: 'Horizon plan',    ic: '◷', f: [['theme', 'Theme'], ['objective', 'Objective', 'area']]},
  slot:       {g: 'Planning', n: 'Slot',            ic: '▣', f: []},
  brief:      {g: 'Planning', n: 'Brief',           ic: '✎', f: [['angle', 'Angle'], ['purpose', 'Purpose', 'area'], ['audience', 'Target audience']]},
  decision:   {g: 'Judgment', n: 'Decision',        ic: '⚖', f: []},
  review:     {g: 'Judgment', n: 'Review',          ic: '↺', f: []},
  question:   {g: 'Judgment', n: 'Open question',   ic: '⁇', f: [['text', 'The question', 'area']]},
  metric:     {g: 'Judgment', n: 'Metric note',     ic: '#', f: []},
  parked:     {g: 'Holding',  n: 'Parking lot',     ic: '⋯', capture: true, f: [['text', 'What is parked', 'area']]},
};
const BRAND_LEVELS = {season: 'Season', '90': '90 days', '30': '30 days', week: 'Week'};
const BRAND_LEVEL_ORDER = ['season', '90', '30', 'week'];
const BRAND_SLOT_STATUS = {planned: 'Planned', linked: 'Linked', published: 'Published', reviewed: 'Reviewed'};
const BRAND_TONES = [['formalCasual', 'Formal', 'Casual'], ['seriousPlayful', 'Serious', 'Playful'], ['reservedBold', 'Reserved', 'Bold']];
const BRAND_PILLAR_COLOURS = ['#7f916a', '#b08968', '#6b7f8e', '#a0727e', '#c9a96e', '#8a7f9e'];

/* ---------- the frame ---------- */
function brandState(){
  S.brand = S.brand || {};
  const b = S.brand;
  b.v = b.v || 1;
  b.accounts = Array.isArray(b.accounts) ? b.accounts : [];
  b.prefs = Object.assign({account: null, notebook: {q: '', kind: '', pillar: '', tag: '', scope: ''}, calMonth: null}, b.prefs || {});
  b.accounts.forEach(brandAccountDefaults);
  return b;
}
function brandAccountDefaults(a){
  a.platforms = a.platforms || []; a.status = a.status || 'active';
  a.charter = Object.assign({purpose: '', audience: '', promise: '', positioning: '', never: []}, a.charter || {});
  a.voice = Object.assign({tone: {}, lexiconUse: [], lexiconAvoid: [], signatureMoves: [], visual: {}, perPlatform: {}}, a.voice || {});
  a.voice.tone = Object.assign({formalCasual: 3, seriousPlayful: 3, reservedBold: 3}, a.voice.tone);
  a.voice.visual = Object.assign({colours: [], type: '', imagery: ''}, a.voice.visual);
  a.pillars = Array.isArray(a.pillars) ? a.pillars : [];
  a.pillars.forEach((p, i) => { p.id = p.id || uid(); p.targetPct = +p.targetPct || 0; p.color = p.color || BRAND_PILLAR_COLOURS[i % BRAND_PILLAR_COLOURS.length]; });
  return a;
}
/* idempotent: fills defaults on the frame, and only on entries already carrying extra.brand */
function migrateBrand(){
  brandState();
  (S.entries || []).forEach(e => { if(e.extra && e.extra.brand) brandFieldDefaults(e); });
}
function brandFieldDefaults(e){
  const b = e.extra.brand;
  b.scope = Array.isArray(b.scope) ? b.scope : [];
  if(b.anchor === undefined) b.anchor = null;
  b.retired = !!b.retired;
  if(b.kind === 'slot'){ b.status = b.status || 'planned'; b.checklist = b.checklist || {}; b.metricIds = b.metricIds || []; }
  if(b.kind === 'horizon'){ b.hypothesisIds = b.hypothesisIds || []; b.targetMix = b.targetMix || {}; }
  if(b.kind === 'hypothesis') b.status = b.status || 'open';
  if(b.kind === 'decision'){ b.options = b.options || []; }
  if(b.kind === 'review') b.answers = b.answers || {};
  if(b.kind === 'metric') b.numbers = b.numbers || [];
  if(b.kind === 'brief') b.refs = b.refs || [];
  return e;
}
function brandAccount(id){ return brandState().accounts.find(a => a.id === id) || null; }
function brandActiveAccounts(){ return brandState().accounts.filter(a => a.status !== 'retired'); }
function brandPillar(id){ for(const a of brandState().accounts){ const p = a.pillars.find(x => x.id === id); if(p) return Object.assign({accountId: a.id}, p); } return null; }
function brandNewAccount(name){
  const a = brandAccountDefaults({id: uid(), name: String(name || 'New account').trim(), handle: '', platforms: [], status: 'active', createdAt: new Date().toISOString()});
  brandState().accounts.push(a); brandState().prefs.account = a.id; save(); return a;
}
function brandPillarTotal(a){ return a.pillars.reduce((s, p) => s + (+p.targetPct || 0), 0); }
function brandValidatePillars(pillars){
  if(pillars.length < 3 || pillars.length > 5) return `An account has three to five pillars; this one has ${pillars.length}.`;
  if(pillars.some(p => !String(p.name || '').trim())) return 'Every pillar needs a name.';
  const t = pillars.reduce((s, p) => s + (+p.targetPct || 0), 0);
  if(Math.round(t) !== 100) return `The pillar targets add to ${t}%; they must add to 100%.`;
  return null;
}

/* ---------- notes ---------- */
function brandEntries(){ return (S.entries || []).filter(e => e.extra && e.extra.brand); }
function brandOf(e){ return e && e.extra && e.extra.brand; }
function brandNew(kind, fields, meta){
  const isQuote = kind === 'quote';
  const now = new Date().toISOString();
  const e = {id: uid(), type: isQuote ? 'quote' : 'brand', title: '', body: '', occurredAt: today(), createdAt: now, media: [],
    links: {stages: [], substages: [], threads: [], values: [], visions: [], skills: [], projects: [], people: []}, people: [], places: [], emotions: [], tags: [], confidence: '',
    extra: {brand: Object.assign({kind, scope: [], anchor: null, retired: false}, meta || {})}};
  brandSetFields(e, fields || {});
  brandFieldDefaults(e);
  S.entries.push(e); save();
  return e;
}
/* the text-like fields live where the house expects them: the title, the body, and for a quote extra.author/source */
function brandSetFields(e, f){
  const b = e.extra.brand;
  Object.entries(f).forEach(([k, v]) => {
    if(k === 'title') e.title = v;
    else if(k === 'text') e.body = v;
    else if(e.type === 'quote' && (k === 'author' || k === 'source')) e.extra[k] = v;
    else if(k === 'tags') e.tags = normTags(v);
    else b[k] = v;
  });
  if(!e.title){ const t = f.statement || f.angle || f.theme || f.question || String(e.body || '').split('\n')[0]; e.title = String(t || '').slice(0, 90); }
  e.updatedAt = new Date().toISOString();
}
function brandGet(e, k){
  if(k === 'text') return e.body || '';
  if(k === 'title') return e.title || '';
  if(e.type === 'quote' && (k === 'author' || k === 'source')) return (e.extra || {})[k] || '';
  return brandOf(e)[k];
}
function brandKindName(e){ const k = BRAND_KINDS[brandOf(e).kind]; return k ? k.n : 'Unfiled'; }
function brandLabel(e){ return e.title || String(e.body || '').slice(0, 80) || BRAND_KINDS[brandOf(e).kind]?.n || 'untitled'; }

/* ---------- the filing rule ---------- */
function brandMissing(e){
  const b = brandOf(e), out = [];
  if(!b.kind || !BRAND_KINDS[b.kind]) out.push('kind');
  if(!b.scope || !b.scope.length) out.push('scope');
  if(!b.anchor || !b.anchor.kind) out.push('anchor');
  else if(!brandAnchorAllowed(b.kind, b.anchor.kind)) out.push('anchor');
  else if(!brandAnchorExists(b.anchor)) out.push('anchor');
  return out;
}
function brandFiled(e){ return !brandMissing(e).length; }
function brandInbox(){ return brandEntries().filter(e => !brandOf(e).retired && !brandFiled(e)); }
function brandAnchorAllowed(kind, ak){
  const cap = BRAND_KINDS[kind] && BRAND_KINDS[kind].capture;
  return ['charter', 'pillar', 'plan', 'decision'].includes(ak) || (cap && (ak === 'studio' || ak === 'account'));
}
function brandAnchorExists(a){
  if(a.kind === 'studio') return true;
  if(a.kind === 'account' || a.kind === 'charter') return !!brandAccount(a.id);
  if(a.kind === 'pillar') return !!brandPillar(a.id);
  const t = byId(S.entries, a.id); if(!t || !brandOf(t)) return false;
  return a.kind === 'plan' ? brandOf(t).kind === 'horizon' : brandOf(t).kind === 'decision';
}
/* every anchor a note in this scope could hang on */
function brandAnchorOptions(kind, scope){
  const out = [], cap = BRAND_KINDS[kind] && BRAND_KINDS[kind].capture;
  const accs = (scope || []).includes('studio') || !(scope || []).length ? brandState().accounts : (scope || []).map(brandAccount).filter(Boolean);
  if(cap) out.push(['studio:', 'Studio-wide']);
  accs.forEach(a => {
    if(cap) out.push([`account:${a.id}`, `${a.name} — the account`]);
    out.push([`charter:${a.id}`, `${a.name} — charter`]);
    a.pillars.forEach(p => out.push([`pillar:${p.id}`, `${a.name} — pillar: ${p.name}`]));
  });
  brandEntries().filter(e => !brandOf(e).retired && ['horizon', 'decision'].includes(brandOf(e).kind) && (!(scope || []).length || brandOf(e).scope.some(s => scope.includes(s) || s === 'studio')))
    .forEach(e => out.push([`${brandOf(e).kind === 'horizon' ? 'plan' : 'decision'}:${e.id}`, `${brandOf(e).kind === 'horizon' ? 'Plan' : 'Decision'}: ${brandLabel(e)}`]));
  return out;
}
function brandAnchorName(a){
  if(!a || !a.kind) return 'no anchor';
  if(a.kind === 'studio') return 'Studio-wide';
  if(a.kind === 'account'){ const x = brandAccount(a.id); return x ? x.name : 'a missing account'; }
  if(a.kind === 'charter'){ const x = brandAccount(a.id); return x ? `${x.name}'s charter` : 'a missing charter'; }
  if(a.kind === 'pillar'){ const p = brandPillar(a.id); return p ? `pillar: ${p.name}` : 'a missing pillar'; }
  const t = byId(S.entries, a.id); return t ? `${a.kind === 'plan' ? 'plan' : 'decision'}: ${brandLabel(t)}` : `a missing ${a.kind}`;
}
function brandParseAnchor(v){ if(!v) return null; const i = v.indexOf(':'); const kind = v.slice(0, i), id = v.slice(i + 1); return {kind, id: kind === 'studio' ? null : id}; }
function brandAnchorKey(a){ return a ? `${a.kind}:${a.id || ''}` : ''; }
function brandScopeName(scope){ return (scope || []).map(s => s === 'studio' ? 'Studio-wide' : (brandAccount(s) || {}).name || 'a missing account').join(', ') || 'no scope'; }

/* "Retired" is a status: nothing is deleted by default */
function brandRetire(e, on){ brandOf(e).retired = on !== false; e.updatedAt = new Date().toISOString(); save(); }

/* ---------- the notes of one kind, for an account ---------- */
function brandOfKind(kind, accountId){
  return brandEntries().filter(e => { const b = brandOf(e); return b.kind === kind && !b.retired && (!accountId || b.scope.includes(accountId) || b.scope.includes('studio') || b.accountId === accountId); });
}
function brandScopedTo(e, accountId){ const b = brandOf(e); return !accountId || b.scope.includes(accountId) || b.scope.includes('studio'); }

/* ---------- pieces: read, never written ---------- */
function brandPiece(id){ const e = id ? byId(S.entries, id) : null; return e && e.type === 'writing' ? e : null; }
function brandPieces(){ return (S.entries || []).filter(e => e.type === 'writing').sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))); }
function brandPieceStatus(p){ return p ? ((p.extra && p.extra.status) || '') : ''; }

/* ---------- export and import of Brand alone ---------- */
function brandExport(){
  const entries = brandEntries().map(e => JSON.parse(JSON.stringify(e)));
  /* piece links travel as ids; no Writing Studio content goes with them */
  const payload = {kind: 'life-instrument-brand', version: 1, exportedAt: new Date().toISOString(), brand: JSON.parse(JSON.stringify(brandState())), entries};
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `brand-strategy-${today()}.json`; document.body.appendChild(a); a.click(); a.remove();
  return payload;
}
/* adds what is missing, keeps what is here */
function brandImport(obj){
  if(!obj || obj.kind !== 'life-instrument-brand') return {error: 'That file is not a Brand Strategy export.'};
  const st = brandState(); let accounts = 0, entries = 0, kept = 0;
  (obj.brand && obj.brand.accounts || []).forEach(a => { if(st.accounts.some(x => x.id === a.id)){ kept++; return; } st.accounts.push(brandAccountDefaults(a)); accounts++; });
  (obj.entries || []).forEach(e => { if(!e || !e.id || !e.extra || !e.extra.brand) return; if(byId(S.entries, e.id)){ kept++; return; }
    if(e.type !== 'brand' && e.type !== 'quote') return; S.entries.push(brandFieldDefaults(e)); entries++; });
  save(); return {accounts, entries, kept};
}
