/* ============================================================
   THE STUDY DECK — the scheduler.

   Two algorithms, chosen per preset, as in Anki:

   FSRS (the default). A card has a memory: stability (how many days until
   the chance of recalling it falls to 90%) and difficulty. Every answer
   updates both, and the next interval is the day the chance of recall falls
   to the retention you asked for. ts-fsrs — the reference implementation,
   inlined — does the arithmetic, including the learning and relearning
   steps; this file turns its answers into Anki's card fields and back.

   SM-2 (legacy, for decks that want it). Anki's own version: learning
   steps, a graduating and an easy interval, an ease factor that moves 15%
   down on Hard, 20% on Again, 15% up on Easy, the hard interval, the easy
   bonus, the interval modifier, the new interval after a lapse.

   THE QUEUE, in Anki's order: learning cards due today (within the
   learn-ahead limit), then learning cards across days, then reviews, then
   new cards — mixed in as the preset says. Limits are per deck and a
   parent's limit caps its children, as in Anki v3. Siblings of an answered
   card are buried till tomorrow if the preset says so; suspended and buried
   cards are skipped; a card lapsing its eighth time (or whatever the preset
   says) is a leech — tagged, and suspended if that is the choice.
   ============================================================ */

/* ---------- the library ---------- */
let _sdLibs = null;
function sdLibs(){
  if(_sdLibs) return _sdLibs;
  const tag = document.getElementById('sdLibSrc');
  _sdLibs = tag && tag.textContent.trim() ? JSON.parse(tag.textContent.replace(/<\\\//g, '</')) : {};
  return _sdLibs;
}
let _sdFsrsLib = null;
function sdFsrsLib(){
  if(_sdFsrsLib) return _sdFsrsLib;
  if(typeof FSRS !== 'undefined' && FSRS.fsrs) return (_sdFsrsLib = FSRS);
  const src = sdLibs().fsrs;
  if(!src) return null;
  /* a UMD bundle, run as a function so its global lands on a local object */
  const mod = {exports: {}};
  new Function('module', 'exports', src)(mod, mod.exports);
  _sdFsrsLib = mod.exports && mod.exports.fsrs ? mod.exports : (typeof FSRS !== 'undefined' ? FSRS : null);
  return _sdFsrsLib;
}
const _sdSched = new Map();
function sdFsrsFor(preset){
  const L = sdFsrsLib(); if(!L) return null;
  const key = JSON.stringify([preset.desiredRetention, preset.maxIvl, preset.weights, preset.fuzz, preset.shortTerm, preset.learnSteps, preset.relearnSteps]);
  if(_sdSched.has(key)) return _sdSched.get(key);
  const steps = a => (a || []).map(m => m >= 1440 && m % 1440 === 0 ? `${m / 1440}d` : m >= 60 && m % 60 === 0 ? `${m / 60}h` : `${m}m`);
  const params = L.generatorParameters({request_retention: preset.desiredRetention, maximum_interval: preset.maxIvl,
    enable_fuzz: preset.fuzz, enable_short_term: preset.shortTerm !== false,
    learning_steps: steps(preset.learnSteps), relearning_steps: steps(preset.relearnSteps),
    w: Array.isArray(preset.weights) && preset.weights.length >= 17 ? preset.weights : undefined});
  const f = L.fsrs(params);
  _sdSched.set(key, f);
  return f;
}

/* ---------- a card, as ts-fsrs sees it, and back ---------- */
function sdDueDate(c){
  if(c.type === 0) return new Date();
  if(c.queue === 1 || (c.type === 1 || c.type === 3) && c.due > 1e8) return new Date(c.due * 1000);
  return sdDayToDate(c.due);
}
function sdToFsrs(c){
  const L = sdFsrsLib();
  const last = c.lastReview ? new Date(c.lastReview) : null;
  return {due: sdDueDate(c), stability: c.memory ? c.memory.s : 0, difficulty: c.memory ? c.memory.d : 0,
    elapsed_days: last ? Math.max(0, Math.round((Date.now() - last.getTime()) / 864e5)) : 0,
    scheduled_days: c.ivl || 0, learning_steps: c.step || 0, reps: c.reps || 0, lapses: c.lapses || 0,
    state: c.type === 0 ? L.State.New : c.type === 1 ? L.State.Learning : c.type === 2 ? L.State.Review : L.State.Relearning,
    last_review: last || undefined};
}
function sdFromFsrs(c, f, now){
  const L = sdFsrsLib();
  const st = f.state;
  const out = Object.assign({}, c);
  out.memory = {s: +f.stability.toFixed(4), d: +f.difficulty.toFixed(4)};
  out.reps = f.reps; out.lapses = f.lapses; out.step = f.learning_steps || 0;
  out.lastReview = now.getTime();
  const dueMs = new Date(f.due).getTime();
  if(st === L.State.Review){
    out.type = 2; out.queue = 2;
    out.ivl = Math.max(1, f.scheduled_days || Math.round((dueMs - now.getTime()) / 864e5));
    out.due = sdToday() + out.ivl;
  } else {
    out.type = st === L.State.Relearning ? 3 : 1;
    const days = sdDayOfMs(dueMs) - sdToday();
    if(days >= 1){ out.queue = 3; out.due = sdToday() + days; }
    else { out.queue = 1; out.due = Math.floor(dueMs / 1000); }
    out.ivl = f.scheduled_days || 0;
  }
  out.factor = Math.round(1300 + (10 - f.difficulty) * 170);   /* an ease for the browser's Ease column */
  return out;
}

/* ---------- SM-2, Anki's way ---------- */
function sdSm2(c, rating, preset, now){
  const out = Object.assign({}, c), nowSec = Math.floor(now.getTime() / 1000);
  const toLearn = (steps, idx) => {
    const mins = steps[Math.min(idx, steps.length - 1)] || 1;
    const t = nowSec + Math.round(mins * 60);
    if(mins >= 1440){ out.queue = 3; out.due = sdToday() + Math.round(mins / 1440); } else { out.queue = 1; out.due = t; }
    out.step = idx;
  };
  const graduate = ivl => { out.type = 2; out.queue = 2; out.ivl = Math.max(preset.minIvl || 1, Math.min(preset.maxIvl, Math.round(ivl))); out.due = sdToday() + out.ivl; out.step = 0; };
  out.reps = (c.reps || 0) + 1; out.lastReview = now.getTime();
  if(c.type === 0 || c.type === 1 || c.type === 3){
    const relearn = c.type === 3, steps = relearn ? preset.relearnSteps : preset.learnSteps;
    if(c.type === 0){ out.type = 1; out.factor = Math.round(preset.startingEase * 1000); out.step = 0; }
    const idx = c.type === 0 ? 0 : (c.step || 0);
    if(rating === 1){ toLearn(steps, 0); }
    else if(rating === 2){
      /* Hard repeats the step (on the first step, halfway between it and the next) */
      const a = steps[idx] || 1, b = steps[idx + 1];
      const mins = idx === 0 && b ? (a + b) / 2 : a * (idx === 0 ? 1.5 : 1);
      if(steps.length){ out.queue = 1; out.due = nowSec + Math.round(mins * 60); out.step = idx; } else graduate(relearn ? Math.max(1, c.ivl) : preset.graduatingIvl);
    } else if(rating === 3){
      if(idx + 1 < steps.length) toLearn(steps, idx + 1);
      else graduate(relearn ? Math.max(preset.minIvl, Math.round((c.ivl || 1))) : preset.graduatingIvl);
    } else graduate(relearn ? Math.max(preset.minIvl, (c.ivl || 1) + 1) : preset.easyIvl);
    return out;
  }
  /* a review */
  const elapsed = Math.max(0, sdToday() - (c.due - (c.ivl || 0)));
  const ease = (c.factor || 2500) / 1000, ivl = c.ivl || 1, late = Math.max(0, sdToday() - c.due);
  const fuzz = x => { if(!preset.fuzz || x < 2.5) return Math.round(x); const r = x < 7 ? 1 : x < 30 ? Math.max(2, x * 0.15) : Math.max(4, x * 0.05); return Math.round(x - r + Math.random() * 2 * r); };
  if(rating === 1){
    out.lapses = (c.lapses || 0) + 1; out.factor = Math.max(1300, (c.factor || 2500) - 200);
    out.ivl = Math.max(preset.minIvl || 1, Math.round(ivl * (preset.lapseNewIvl || 0)));
    if(preset.relearnSteps.length){ out.type = 3; toLearn(preset.relearnSteps, 0); } else { out.type = 2; out.queue = 2; out.due = sdToday() + out.ivl; }
    return out;
  }
  let next;
  const hardIvl = Math.max(ivl + 1, ivl * preset.hardIvl * preset.ivlModifier);
  if(rating === 2){ next = hardIvl; out.factor = Math.max(1300, (c.factor || 2500) - 150); }
  else if(rating === 3){ next = Math.max(hardIvl + 1, (ivl + late / 2) * ease * preset.ivlModifier); }
  else { next = Math.max(hardIvl + 2, (ivl + late) * ease * preset.easyBonus * preset.ivlModifier); out.factor = (c.factor || 2500) + 150; }
  void elapsed;
  out.ivl = Math.max(1, Math.min(preset.maxIvl, fuzz(next)));
  out.type = 2; out.queue = 2; out.due = sdToday() + out.ivl;
  return out;
}

/* ---------- what each button would do ---------- */
function sdPreviewAll(c){
  const preset = sdDeckPreset(c.odid || c.deckId), now = new Date();
  const res = {};
  if(preset.algorithm === 'fsrs' && sdFsrsLib()){
    const f = sdFsrsFor(preset), rec = f.repeat(sdToFsrs(c), now), L = sdFsrsLib();
    [1, 2, 3, 4].forEach(r => { const g = [null, L.Rating.Again, L.Rating.Hard, L.Rating.Good, L.Rating.Easy][r]; res[r] = sdFromFsrs(c, rec[g].card, now); });
  } else [1, 2, 3, 4].forEach(r => res[r] = sdSm2(c, r, preset, now));
  return res;
}
/* "10m", "1d", "3.2mo" — how long until it comes back */
function sdIvlText(c, next){
  let secs;
  if(next.queue === 1) secs = next.due - sdNowSec();
  else secs = (next.due - sdToday()) * 86400;
  return sdSpan(secs);
}
function sdSpan(secs){
  secs = Math.max(0, secs);
  if(secs < 60) return '<1m';
  if(secs < 3600) return Math.round(secs / 60) + 'm';
  if(secs < 86400) return (secs / 3600).toFixed(secs < 36000 ? 1 : 0).replace(/\.0$/, '') + 'h';
  const d = secs / 86400;
  if(d < 30) return Math.round(d) + 'd';
  if(d < 365) return (d / 30).toFixed(1).replace(/\.0$/, '') + 'mo';
  return (d / 365).toFixed(1).replace(/\.0$/, '') + 'y';
}

/* ---------- answering ---------- */
const SD_UNDO = [];
async function sdAnswer(cardId, rating, ms){
  const c = SD.cards.get(cardId); if(!c) return null;
  const before = JSON.parse(JSON.stringify(c));
  const preset = sdDeckPreset(c.odid || c.deckId), now = new Date();
  const deck = SD.decks.get(c.deckId);
  let next;
  /* a filtered deck that does not reschedule is a preview: the card goes back unchanged */
  if(deck && deck.isFiltered && !deck.filter.reschedule){
    next = Object.assign({}, c);
    const back = rating === 1 ? deck.filter.previewAgain : rating === 2 ? deck.filter.previewHard : rating === 3 ? deck.filter.previewGood : 0;
    if(back > 0){ next.queue = 4; next.due = sdNowSec() + back; }
    else { next.deckId = c.odid; next.due = c.odue; next.odid = 0; next.odue = 0; next.queue = c.type === 0 ? 0 : c.type === 2 ? 2 : c.queue; }
  } else {
    next = sdPreviewAll(c)[rating];
    if(c.type === 2 && rating === 1) next.lapses = (c.lapses || 0) + (preset.algorithm === 'fsrs' ? 0 : 0);
    /* a card answered in a rescheduling filtered deck goes home */
    if(deck && deck.isFiltered){ next.deckId = c.odid || c.deckId; next.odid = 0; next.odue = 0; }
  }
  next.mod = Date.now();
  const type = c.type === 0 || c.type === 1 ? 0 : c.type === 3 ? 2 : deck && deck.isFiltered ? 3 : 1;
  const lastIvl = c.type === 2 ? c.ivl : c.queue === 1 ? -Math.max(0, c.due - sdNowSec()) : 0;
  const ivl = next.queue === 1 ? -Math.max(60, next.due - sdNowSec()) : next.ivl;
  Object.assign(c, next);
  /* leeches: a lapse that reaches the threshold, then every half of it again */
  let leech = false;
  if(before.type === 2 && rating === 1){
    const th = preset.leechThreshold || 8;
    if(c.lapses >= th && (c.lapses - th) % Math.max(1, Math.ceil(th / 2)) === 0){
      leech = true;
      const n = SD.notes.get(c.noteId);
      if(n && !n.tags.includes('leech')){ n.tags.push('leech'); sdTouch('notes', n); }
      if(preset.leechAction === 'suspend') c.queue = -1;
    }
  }
  sdTouch('cards', c);
  const buried = sdBurySiblings(c, preset);
  const log = await sdRevlogAdd({id: sdId(), cardId: c.id, ease: rating, ivl, lastIvl, factor: c.memory ? Math.round(c.memory.d * 1000) : c.factor, time: Math.min(60000, Math.max(0, Math.round(ms || 0))), type,
    s: c.memory ? c.memory.s : null, d: c.memory ? c.memory.d : null});
  SD_UNDO.push({kind: 'answer', card: before, buried, logId: log.id, rating});
  if(SD_UNDO.length > 50) SD_UNDO.shift();
  sdSettings().lastDeck = c.deckId;
  sdSummarise();
  return {card: c, leech, buried};
}
function sdBurySiblings(c, preset){
  const out = [];
  if(!preset.buryNew && !preset.buryReview && !preset.buryInterday) return out;
  sdCardsOf(c.noteId).forEach(s => {
    if(s.id === c.id) return;
    const ok = (s.queue === 0 && preset.buryNew) || (s.queue === 2 && s.due <= sdToday() && preset.buryReview) || (s.queue === 3 && preset.buryInterday);
    if(ok){ out.push({id: s.id, queue: s.queue}); s.queue = -2; sdTouch('cards', s); }
  });
  return out;
}
/* Undo takes back the last answer (or action): the card as it was, the
   siblings unburied, the review removed from the log — the one place the
   log is ever shortened, and only for the answer just given. */
async function sdUndo(){
  const u = SD_UNDO.pop(); if(!u) return null;
  if(u.kind === 'answer'){
    const c = SD.cards.get(u.card.id); if(c){ Object.keys(c).forEach(k => delete c[k]); Object.assign(c, u.card); sdTouch('cards', c); }
    u.buried.forEach(b => { const s = SD.cards.get(b.id); if(s){ s.queue = b.queue; sdTouch('cards', s); } });
    const i = SD.revlog.findIndex(r => r.id === u.logId); if(i > -1) SD.revlog.splice(i, 1);
    try { await db.sdRevlog.delete(u.logId); } catch(e){}
    return u;
  }
  if(u.kind === 'cards'){ u.before.forEach(b => { const c = SD.cards.get(b.id); if(c){ Object.keys(c).forEach(k => delete c[k]); Object.assign(c, b); sdTouch('cards', c); } }); return u; }
  if(u.kind === 'fn'){ u.fn(); return u; }
  return u;
}
function sdPushUndo(label, cards, fn){ SD_UNDO.push(fn ? {kind: 'fn', label, fn} : {kind: 'cards', label, before: cards.map(c => JSON.parse(JSON.stringify(c)))}); }

/* ---------- actions on cards ---------- */
function sdSetQueue(ids, queue, label){
  const cards = ids.map(i => SD.cards.get(i)).filter(Boolean);
  sdPushUndo(label || 'change', cards);
  cards.forEach(c => { c.queue = queue === 'restore' ? sdNaturalQueue(c) : queue; c.mod = Date.now(); sdTouch('cards', c); });
  sdChanged('cards');
}
function sdNaturalQueue(c){ return c.type === 0 ? 0 : c.type === 2 ? 2 : (c.due > 1e8 ? 1 : 3); }
function sdSuspend(ids){ const all = ids.map(i => SD.cards.get(i)).filter(Boolean); const on = all.some(c => c.queue !== -1); sdSetQueue(ids, on ? -1 : 'restore', on ? 'suspend' : 'unsuspend'); return on; }
function sdBury(ids){ sdSetQueue(ids, -3, 'bury'); }
function sdUnburyDeck(deckId){
  const ids = deckId ? sdDeckAndBelow(deckId) : null;
  const cards = [...SD.cards.values()].filter(c => (c.queue === -2 || c.queue === -3) && (!ids || ids.includes(c.deckId)));
  sdSetQueue(cards.map(c => c.id), 'restore', 'unbury');
  return cards.length;
}
/* buried cards come back with the new day */
function sdDailyUnbury(){
  const s = sdSettings(), t = sdToday();
  if(s.lastUnbury === t) return;
  SD.cards.forEach(c => { if(c.queue === -2 || c.queue === -3){ c.queue = sdNaturalQueue(c); sdTouch('cards', c); } });
  s.lastUnbury = t; sdTouch('misc', s);
}
function sdFlag(ids, n){ const cards = ids.map(i => SD.cards.get(i)).filter(Boolean); sdPushUndo('flag', cards);
  const off = cards.every(c => (c.flags & 7) === n); cards.forEach(c => { c.flags = (c.flags & ~7) | (off ? 0 : n); sdTouch('cards', c); }); sdChanged('cards'); }
/* forget: back to new, at the end of the new queue; logged as manual */
async function sdForget(ids, resetCounts){
  const cards = ids.map(i => SD.cards.get(i)).filter(Boolean); sdPushUndo('forget', cards);
  const s = sdSettings();
  for(const c of cards){
    const was = c.ivl; c.type = 0; c.queue = 0; c.due = s.nextPos++; c.ivl = 0; c.factor = 0; c.memory = null; c.step = 0; c.left = 0;
    if(resetCounts){ c.reps = 0; c.lapses = 0; }
    c.mod = Date.now(); sdTouch('cards', c);
    await sdRevlogAdd({id: sdId(), cardId: c.id, ease: 0, ivl: 0, lastIvl: was, factor: 0, time: 0, type: 4});
  }
  sdTouch('misc', s); sdChanged('cards');
}
/* set due date: "0" today, "3" in three days, "3-7" a random day in a range, "5!" also sets the interval */
async function sdSetDue(ids, spec){
  const m = String(spec).trim().match(/^(\d+)(?:-(\d+))?(!)?$/); if(!m) return false;
  const a = +m[1], b = m[2] != null ? +m[2] : a, setIvl = !!m[3];
  const cards = ids.map(i => SD.cards.get(i)).filter(Boolean); sdPushUndo('set due date', cards);
  for(const c of cards){
    const days = a + Math.floor(Math.random() * (b - a + 1));
    const was = c.ivl;
    if(c.type !== 2){ c.type = 2; c.ivl = Math.max(1, days); }
    if(setIvl) c.ivl = Math.max(1, days);
    c.queue = 2; c.due = sdToday() + days; c.mod = Date.now(); sdTouch('cards', c);
    await sdRevlogAdd({id: sdId(), cardId: c.id, ease: 0, ivl: c.ivl, lastIvl: was, factor: c.factor, time: 0, type: 4});
  }
  sdChanged('cards'); return true;
}
function sdReposition(ids, start, step, shift){
  const cards = ids.map(i => SD.cards.get(i)).filter(c => c && c.type === 0).sort((a, b) => a.due - b.due);
  sdPushUndo('reposition', cards);
  if(shift){ const end = start + cards.length * step; SD.cards.forEach(c => { if(c.type === 0 && c.due >= start && !cards.includes(c)){ c.due += end - start; sdTouch('cards', c); } }); }
  cards.forEach((c, i) => { c.due = start + i * step; sdTouch('cards', c); });
  const s = sdSettings(); s.nextPos = Math.max(s.nextPos, start + cards.length * step + 1); sdTouch('misc', s);
  sdChanged('cards');
}

/* ---------- counts and the queue ---------- */
/* what was already done today in a deck (answers of new cards, and reviews), for the limits */
function sdDoneToday(){
  const s = sdSettings(), start = sdDayToDate(sdToday()).getTime();
  const out = new Map();
  for(let i = SD.revlog.length - 1; i >= 0; i--){
    const r = SD.revlog[i]; if(r.id < start) break;
    if(r.ease === 0) continue;
    const c = SD.cards.get(r.cardId); if(!c) continue;
    const d = c.odid || c.deckId, o = out.get(d) || {newN: 0, rev: 0, seen: new Set()};
    if(!o.seen.has(r.cardId)){ o.seen.add(r.cardId); if(r.type === 0 && r.lastIvl === 0 && sdFirstLearnToday(r)) o.newN++; else if(r.type === 1 || r.type === 3) o.rev++; }
    out.set(d, o);
  }
  void s;
  return out;
}
function sdFirstLearnToday(r){ /* the card's first review ever is its introduction */
  for(const x of SD.revlog){ if(x.cardId === r.cardId && x.ease > 0) return x.id === r.id; }
  return false;
}
function sdLimitsFor(deckId, done){
  /* a deck's own limit, less what it did today, capped by every parent's */
  const chain = [];
  let d = SD.decks.get(deckId);
  while(d){ chain.push(d); const p = sdDeckParentName(d.name); d = p ? sdDeckByName(p) : null; }
  let newL = Infinity, revL = Infinity;
  chain.forEach(x => {
    if(x.isFiltered) return;
    const p = sdPreset(x.presetId), below = sdDeckAndBelow(x.id);
    let dn = 0, dr = 0; below.forEach(i => { const o = done.get(i); if(o){ dn += o.newN; dr += o.rev; } });
    newL = Math.min(newL, Math.max(0, p.newPerDay - dn)); revL = Math.min(revL, Math.max(0, p.revPerDay - dr));
  });
  return {newL, revL};
}
function sdCounts(deckId){
  const ids = deckId ? new Set(sdDeckAndBelow(deckId)) : null;
  const t = sdToday(), now = sdNowSec(), s = sdSettings(), ahead = now + s.learnAheadMin * 60;
  let newN = 0, learn = 0, rev = 0;
  SD.cards.forEach(c => {
    if(ids && !ids.has(c.deckId)) return;
    if(c.queue === 0) newN++;
    else if(c.queue === 1 && c.due <= ahead) learn++;
    else if((c.queue === 3 || c.queue === 4 && c.due <= ahead) && (c.queue === 4 || c.due <= t)) learn++;
    else if(c.queue === 2 && c.due <= t) rev++;
  });
  if(deckId){
    const lim = sdLimitsFor(deckId, sdDoneToday());
    const p = sdDeckPreset(deckId), d = SD.decks.get(deckId);
    if(!(d && d.isFiltered)){ rev = Math.min(rev, lim.revL); newN = Math.min(newN, p.newIgnoreRevLimit ? lim.newL : Math.min(lim.newL, Math.max(0, lim.revL - rev) + lim.newL)); }
  }
  return {newN, learn, rev};
}
/* the next card to show, in Anki's order */
function sdNextCard(deckId, skip){
  const ids = new Set(sdDeckAndBelow(deckId)), t = sdToday(), now = sdNowSec(), s = sdSettings(), ahead = now + s.learnAheadMin * 60;
  const deck = SD.decks.get(deckId), p = sdDeckPreset(deckId);
  const pool = []; SD.cards.forEach(c => { if(ids.has(c.deckId) && !(skip && skip.has(c.id))) pool.push(c); });
  const learnNow = pool.filter(c => (c.queue === 1 || c.queue === 4) && c.due <= now).sort((a, b) => a.due - b.due);
  if(learnNow.length) return learnNow[0];
  const counts = sdCounts(deckId);
  const inter = pool.filter(c => c.queue === 3 && c.due <= t);
  const revs = pool.filter(c => c.queue === 2 && c.due <= t);
  const news = pool.filter(c => c.queue === 0);
  const retr = c => { const L = sdFsrsLib(); if(!L || !c.memory || !c.lastReview) return 1; const el = (Date.now() - c.lastReview) / 864e5; return L.forgetting_curve(sdPresetWeights(p), el, c.memory.s); };
  const revSorted = deck && deck.isFiltered ? revs : revs.slice().sort(
    p.revSort === 'retrievability' ? (a, b) => retr(a) - retr(b)
    : p.revSort === 'random' ? () => Math.random() - 0.5
    : p.revSort === 'interval' ? (a, b) => a.ivl - b.ivl
    : p.revSort === 'ease' ? (a, b) => (a.factor || 0) - (b.factor || 0)
    : (a, b) => a.due - b.due || a.id - b.id);
  const newSorted = news.slice().sort(p.newSort === 'random' ? () => Math.random() - 0.5
    : p.newSort === 'template' ? (a, b) => a.ord - b.ord || a.due - b.due : (a, b) => a.due - b.due || a.ord - b.ord);
  const pickRev = () => (inter.length && (p.interdayMix !== 'after' || !revSorted.length)) ? inter.sort((a, b) => a.due - b.due)[0] : revSorted[0];
  const haveRev = counts.rev > 0 && (revSorted.length || inter.length), haveNew = counts.newN > 0 && newSorted.length;
  if(!haveRev && inter.length) return inter[0];
  if(haveRev && haveNew){
    if(p.newMix === 'before') return newSorted[0];
    if(p.newMix === 'after') return pickRev();
    /* mixed: new cards spread evenly through the reviews */
    const every = Math.max(1, Math.round((counts.rev + counts.learn) / Math.max(1, counts.newN)));
    SD._mixN = (SD._mixN || 0) + 1;
    return SD._mixN % (every + 1) === 0 ? newSorted[0] : pickRev();
  }
  if(haveRev) return pickRev();
  if(haveNew) return newSorted[0];
  /* nothing due now; a learning card later today, if within reach */
  const later = pool.filter(c => c.queue === 1 && c.due <= ahead).sort((a, b) => a.due - b.due);
  return later[0] || null;
}
function sdPresetWeights(p){ const L = sdFsrsLib(); return Array.isArray(p.weights) && p.weights.length >= 17 ? p.weights : (L ? L.default_w : []); }
/* the chance of recalling it now (FSRS), or null */
function sdRetrievability(c){
  const L = sdFsrsLib(); if(!L || !c.memory || !c.lastReview) return null;
  const p = sdDeckPreset(c.odid || c.deckId);
  return L.forgetting_curve(sdPresetWeights(p), Math.max(0, (Date.now() - c.lastReview) / 864e5), c.memory.s);
}
/* when the learning cards of today come back, for the congratulations */
function sdNextLearnDue(deckId){
  const ids = new Set(sdDeckAndBelow(deckId)); let best = null;
  SD.cards.forEach(c => { if(ids.has(c.deckId) && c.queue === 1 && (!best || c.due < best)) best = c.due; });
  return best;
}
/* tomorrow's work, for the congratulations and the forecast */
function sdForecast(deckId, days){
  const ids = deckId ? new Set(sdDeckAndBelow(deckId)) : null, t = sdToday(), out = new Array(days).fill(0);
  SD.cards.forEach(c => { if(ids && !ids.has(c.deckId)) return; if(c.queue === 2 || c.queue === 3){ const k = Math.max(0, c.due - t); if(k < days) out[k]++; } });
  return out;
}

/* ---------- rebuilding memory from history (after an import, or a change of parameters) ---------- */
async function sdRebuildMemory(cardIds, presetFilter){
  const L = sdFsrsLib(); if(!L) return 0;
  const want = cardIds ? new Set(cardIds) : null;
  const byCard = new Map();
  SD.revlog.forEach(r => { if(r.ease > 0 && (!want || want.has(r.cardId))) (byCard.get(r.cardId) || byCard.set(r.cardId, []).get(r.cardId)).push(r); });
  let n = 0;
  for(const [cid, list] of byCard){
    const c = SD.cards.get(cid); if(!c || c.type === 0) continue;
    const p = sdDeckPreset(c.odid || c.deckId); if(presetFilter && p.id !== presetFilter) continue;
    const f = sdFsrsFor(p);
    let card = L.createEmptyCard(new Date(list[0].id));
    for(const r of list){ try { card = f.next(card, new Date(r.id), r.ease).card; } catch(e){ break; } }
    c.memory = {s: +card.stability.toFixed(4), d: +card.difficulty.toFixed(4)};
    c.lastReview = c.lastReview || list[list.length - 1].id;
    sdTouch('cards', c); n++;
    if(n % 2000 === 0) await new Promise(r => setTimeout(r, 0));
  }
  return n;
}
