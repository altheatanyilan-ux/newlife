/* ============================================================
   THE THREE TIERS — core, enrichment, and the fast track through them.

   Every exercise is one of three things:

     core         the Siskind curriculum's own numbered exercises, its
                  coordination exercises (the .9xx numbers) and its first
                  improvising (IMP-B1-*), and Stage 0's foundations.
     enrichment   what the other books and the v3 document added — Levine,
                  Berklee, Mantooth, Dobbins, Stoloff, Weir, Peckham and the
                  document's own entries — and every worksheet, listening
                  assignment, song-form analysis and "write it in these keys".
     fast-track   the eight to ten core exercises per stage a student must
                  have to be ready for the next one: the first playable
                  exercise of each subsection (where each new idea arrives),
                  at least one coordination exercise and at least one
                  improvising one, never a worksheet, a listening or a page
                  of pure theory.

   Where a main-line stage has fewer than eight playable core exercises
   (Stage 4 is mostly Levine, Stage 5 has no Siskind at all, Stage 11 is
   mostly Berklee), its own playable exercises are promoted to core in the
   document's order, the room's originals first, until it has eight — so
   the fast track never has a hole in it.

   Every tier can be corrected: JAZZ_TIER_OVERRIDES for a correction that
   ships, S.jazz.tierOverrides for one of your own.
   ============================================================ */

const JAZZ_TIERS = [
  {id: 'fast-track', badge: '🔴', label: 'ESSENTIAL', said: 'Must-do: the minimum path to the next stage'},
  {id: 'core', badge: '🔵', label: 'CORE', said: 'Recommended: the curriculum itself'},
  {id: 'enrichment', badge: '⚪', label: 'ENRICHMENT', said: 'Optional: the other books, worksheets and listening'}];
const jazzTierInfo = t => JAZZ_TIERS.find(x => x.id === t) || JAZZ_TIERS[2];
/* the brief's type names, from the v3 tags */
const JAZZ_TIER_TYPE = {NOTATION: 'NOTATION', DRILL: 'DRILL', THEORY: 'THEORY', IMPROV: 'CREATIVE',
  LISTEN: 'LISTENING', WORKSHEET: 'WORKSHEET'};
const JAZZ_TIER_MINUTES = {NOTATION: 18, DRILL: 12, THEORY: 10, LISTENING: 8, CREATIVE: 10, WORKSHEET: 18};
const JAZZ_TIER_ENRICH_BOOKS = ['Levine', 'Mantooth', 'Berklee Harmony', 'Dobbins', 'Stoloff', 'Weir',
  'Peckham', 'Gemini Research', 'Curriculum v3', 'Barry Harris'];
const JAZZ_TIER_MAIN = ['P0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const JAZZ_FAST_MIN = 8, JAZZ_FAST_MAX = 10;

/* corrections that ship with the room, id → tier. Empty until one is needed:
   the rules below are the whole of the classification. */
const JAZZ_TIER_OVERRIDES = {};

const jazzIsCoordination = ex => !!ex && /\.9\d\d/.test(ex.id) && ex.type === 'DRILL';
const jazzIsCreative = ex => !!ex && (ex.type === 'IMPROV' || /^IMP-/.test(ex.id));
/* something you do at the piano: a score, a drill or improvising — a theory
   page with a score to play is not "purely theoretical" */
const jazzIsPlayable = ex => !!ex && (['NOTATION', 'DRILL', 'IMPROV'].includes(ex.type)
  || (ex.type === 'THEORY' && jazzHasScore(ex)));
const JAZZ_TIER_ENRICH_NAME = /song[- ]form|form analysis|analy[sz]e the form|written analysis|write (it |them |each |the )?.*in (all|the specified|specified|\d+) keys/i;

/* the rule, before the top-up and the overrides */
function jazzTierBase(ex){
  if(!ex) return 'enrichment';
  const book = (ex.ref && ex.ref.book) || '';
  if(ex.type === 'WORKSHEET' || ex.type === 'LISTEN') return 'enrichment';
  if(JAZZ_TIER_ENRICH_NAME.test(ex.name || '')) return 'enrichment';
  if(ex.isV3) return 'enrichment';
  if(/^Siskind/.test(book) || /^IMP-/.test(ex.id) || /\.9\d\d/.test(ex.id) || book === 'Design Doc') return 'core';
  return 'enrichment';
}

/* ---------- subsections ----------
   The layout has no letters, so they are read from what the material is: a
   new subsection starts where its kind changes — the old stage its number
   comes from (2.x, 3.x, 4.x), the coordination exercises, the first
   improvising, the worksheets. Named 2A, 2B… in the document's order. */
function jazzTierFamily(ex){
  if(!ex) return null;
  if(/^IMP-/.test(ex.id) || ex.type === 'IMPROV') return 'improv';
  if(ex.type === 'WORKSHEET') return 'worksheet';
  if(ex.type === 'LISTEN') return 'listen';
  if(jazzIsCoordination(ex)) return 'coord';
  const label = (ex.v3 && ex.v3.label) || ex.id;
  const m = /^(P0|V\d|DT|BH|\d+[A-D]?)[.\-]/.exec(String(label));
  return m ? m[1] : null;
}
let _jazzTierCache = null;
const jazzTierReset = () => { _jazzTierCache = null; };
function jazzTierTable(){
  if(_jazzTierCache && _jazzTierCache.book === _jazzBook) return _jazzTierCache;
  const stages = jazzStages();
  const tier = {}, subsection = {}, subsOf = {};
  stages.forEach(s => {
    const n = s.id === 'P0' ? '0' : /^\d+$/.test(String(s.id)) ? String(s.id) : String(s.id) + '-';
    let letter = -1, fam = undefined;
    const groups = [];
    s.subs.forEach(id => {
      const ex = jazzExercise(id); if(!ex) return;
      const f = jazzTierFamily(ex);
      if(letter < 0 || (f !== null && f !== fam)){ letter++; fam = f === null ? fam : f; groups.push([]); }
      subsection[id] = n + String.fromCharCode(65 + Math.min(letter, 25));
      groups[groups.length - 1].push(id);
      tier[id] = jazzTierBase(ex);
    });
    subsOf[s.id] = groups;
  });
  /* the top-up: a main-line stage short of playable core borrows its own
     playable exercises, originals first, in the document's order */
  JAZZ_TIER_MAIN.forEach(sid => {
    const s = stages.find(x => String(x.id) === sid); if(!s) return;
    const playable = s.subs.filter(id => jazzIsPlayable(jazzExercise(id)));
    let have = playable.filter(id => tier[id] === 'core').length;
    const promote = playable.filter(id => tier[id] !== 'core' && !jazzExercise(id).isV3)
      .concat(playable.filter(id => tier[id] !== 'core' && jazzExercise(id).isV3));
    for(const id of promote){ if(have >= JAZZ_FAST_MIN) break; tier[id] = 'core'; have++; }
  });
  /* the shipped corrections, before the fast track is chosen from core */
  Object.keys(JAZZ_TIER_OVERRIDES).forEach(id => { if(tier[id]) tier[id] = JAZZ_TIER_OVERRIDES[id]; });
  /* the fast track, per main-line stage */
  JAZZ_TIER_MAIN.forEach(sid => {
    const s = stages.find(x => String(x.id) === sid); if(!s) return;
    const core = s.subs.filter(id => tier[id] === 'core' || tier[id] === 'fast-track');
    const ok = core.filter(id => jazzIsPlayable(jazzExercise(id)));
    const pick = [];
    const take = id => { if(id && !pick.includes(id)) pick.push(id); };
    take(ok.find(id => jazzIsCoordination(jazzExercise(id))));
    take(ok.find(id => jazzIsCreative(jazzExercise(id))));
    (subsOf[s.id] || []).forEach(g => take(g.find(id => ok.includes(id))));
    ok.forEach(id => { if(pick.length < JAZZ_FAST_MIN) take(id); });
    /* in the document's order, and no more than ten — the leads keep their
       place over the fill, and the two guarantees are never dropped */
    const must = pick.slice(0, 2);
    const kept = ok.filter(id => pick.includes(id));
    while(kept.length > JAZZ_FAST_MAX){
      const drop = kept.slice().reverse().find(id => !must.includes(id));
      kept.splice(kept.indexOf(drop), 1);
    }
    kept.forEach(id => { tier[id] = 'fast-track'; });
  });
  _jazzTierCache = {book: _jazzBook, tier, subsection, subsOf};
  return _jazzTierCache;
}
function jazzTierOverrides(){
  const j = jazzState();
  j.tierOverrides = j.tierOverrides && typeof j.tierOverrides === 'object' ? j.tierOverrides : {};
  return j.tierOverrides;
}
/** the tier an exercise is on, yours if you have set one */
function jazzTierOf(id){
  const mine = jazzTierOverrides()[id];
  if(mine && JAZZ_TIERS.some(t => t.id === mine)) return mine;
  return jazzTierTable().tier[id] || 'enrichment';
}
function jazzSetTier(id, tier){
  const o = jazzTierOverrides();
  if(!tier || tier === jazzTierTable().tier[id]) delete o[id]; else o[id] = tier;
  saveNow();
}
const jazzTierIsCore = t => t === 'core' || t === 'fast-track';
const jazzSubsectionOf = id => jazzTierTable().subsection[id] || null;

/* ---------- the data model the brief asks for ---------- */
function jazzTierSource(ex){
  const r = ex.ref || {};
  const book = r.book || '';
  const ch = String(r.chapter || '');
  const unit = /Unit\s*(\d+)/i.exec(ch), chap = /(?:Chapter|Ch\.?)\s*(\d+)/i.exec(ch);
  const sis = /^Siskind Book (\d)/.exec(book);
  if(sis) return `siskind-b${sis[1]}${unit ? '-u' + unit[1] : ''}`;
  const slug = book.toLowerCase().replace(/ harmony$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'room';
  return slug + (chap ? '-ch' + chap[1] : unit ? '-u' + unit[1] : '');
}
function jazzExerciseRecord(ex){
  if(typeof ex === 'string') ex = jazzExercise(ex);
  if(!ex) return null;
  const type = JAZZ_TIER_TYPE[ex.type] || 'NOTATION';
  const keysRequired = jazzIsSingle(ex.id) || !jazzHasScore(ex) && ['THEORY', 'LISTENING', 'WORKSHEET'].includes(type) ? 0 : 12;
  const T = jazzTierTable();
  const sub = T.subsection[ex.id] || null;
  /* what comes first: the core before it in its subsection, else the end of
     the one before it */
  const stage = jazzStage(ex.stage);
  const order = stage ? stage.subs : [];
  const at = order.indexOf(ex.id);
  const coreBefore = order.slice(0, Math.max(0, at)).filter(id => jazzTierIsCore(jazzTierOf(id)));
  const sameSub = coreBefore.filter(id => T.subsection[id] === sub);
  /* the first core of a stage stands on the previous stage's essentials */
  const mainAt = JAZZ_TIER_MAIN.indexOf(String(ex.stage));
  const prevStage = mainAt > 0 ? jazzStage(JAZZ_TIER_MAIN[mainAt - 1]) : null;
  const prevFast = prevStage ? prevStage.subs.filter(id => jazzTierOf(id) === 'fast-track') : [];
  const prerequisiteIds = (sameSub.length ? sameSub : coreBefore.length ? coreBefore : prevFast).slice(-2);
  return {
    id: ex.id,
    stageId: ex.stage === 'P0' ? 0 : /^\d+$/.test(String(ex.stage)) ? +ex.stage : String(ex.stage),
    subsection: sub,
    title: ex.name,
    type,
    tier: jazzTierOf(ex.id),
    source: jazzTierSource(ex),
    isOriginalCurriculum: !ex.isV3,
    keysRequired,
    estimatedMinutes: type === 'NOTATION' && !keysRequired ? 15 : JAZZ_TIER_MINUTES[type] || 15,
    prerequisiteIds,
    description: (ex.v3 && ex.v3.description) || ex.why || String(ex.theory || '').split(/\n+/)[0] || '',
    practiceTips: ex.tip || ex.practiceStrategy || ''};
}

/**
 * The brief's classifier: an array of exercises (records or ids) back with
 * `tier` filled in from the rules, the top-up and the overrides.
 */
function classifyExercises(exercises){
  return (exercises || []).map(e => {
    const id = typeof e === 'string' ? e : e && e.id;
    if(!id || !jazzExercise(id)) return typeof e === 'object' ? Object.assign({}, e, {tier: 'enrichment'}) : null;
    return Object.assign({}, typeof e === 'object' ? e : jazzExerciseRecord(id), {tier: jazzTierOf(id)});
  }).filter(Boolean);
}
/**
 * A stage's exercises of one tier, in the curriculum's order. 'core'
 * includes the fast-track ones, which are core by definition.
 */
function getExercisesByTier(stageId, tier){
  const sid = String(stageId) === '0' ? 'P0' : String(stageId);
  const s = jazzStage(sid);
  if(!s) return [];
  return s.subs.filter(id => { const t = jazzTierOf(id);
    return tier === 'core' ? jazzTierIsCore(t) : t === tier; }).map(jazzExerciseRecord);
}
/* a stage's exercises in the order the brief asks the list to show:
   fast-track, then core, then enrichment, the curriculum's order within each */
function jazzTierSorted(ids){
  const rank = {'fast-track': 0, core: 1, enrichment: 2};
  return ids.map((id, i) => [id, i]).sort((a, b) =>
    (rank[jazzTierOf(a[0])] - rank[jazzTierOf(b[0])]) || (a[1] - b[1])).map(x => x[0]);
}

/* ---------- the track ----------
   Full curriculum, or the fast track: only the essential exercises, the
   stage in about half the time. Switching hides nothing permanently. */
const jazzTrack = () => jazzState().settings.track === 'fast-track' ? 'fast-track' : 'full';
function jazzSetTrack(t){ jazzState().settings.track = t === 'fast-track' ? 'fast-track' : 'full'; saveNow(); }
/* mastered: every key marked (or, for a single-mark item, done) */
const jazzMastered = id => jazzExGot(id) >= jazzExUnits(id);
function jazzFastProgress(sid){
  const s = jazzStage(sid); if(!s) return {done: 0, of: 0};
  const ids = s.subs.filter(id => jazzTierOf(id) === 'fast-track');
  return {done: ids.filter(jazzMastered).length, of: ids.length, ids};
}
function jazzCoreProgress(sid){
  const s = jazzStage(sid); if(!s) return {done: 0, of: 0};
  const ids = s.subs.filter(id => jazzTierIsCore(jazzTierOf(id)));
  return {done: ids.filter(jazzMastered).length, of: ids.length, ids};
}
/* the badge */
function jazzTierBadgeHTML(id, compact){
  const t = jazzTierInfo(jazzTierOf(id));
  const mine = !!jazzTierOverrides()[id];
  return `<span class="jz-tier jz-tier-${t.id}" title="${esc(t.said)}${mine ? ' — set by you' : ''}">${t.badge}${
    compact ? '' : ' '}<b>${esc(t.label)}</b>${mine ? '<i>✎</i>' : ''}</span>`;
}
