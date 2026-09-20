/* ============================================================
   THE UNWRITTEN RULES.

   A note pinned at bar 60 is about bar 60. But a good part of what you write
   on a score is not about that bar at all — "the inner voice carries the line
   here, so bring the thumb out" is a thing that is true in every piece with
   an inner voice, and you will rediscover it, from scratch, in the next one.
   That is not annotation. That is the thing a teacher would have told you
   once and you would have spent five years learning to hear.

   So a pin can say it is a rule rather than a note, and rules live in one
   place across every score.

   WHY THE SAME RULE IS ONE ROW AND NOT FIVE. The point is not to collect
   sentences; it is to notice that you have now written the same sentence in
   four different pieces, because THAT is the evidence it is real. So marking
   a pin as a rule looks for one you already have that says the same thing,
   and if it finds one it adds this bar as another place you met it. A rule
   met in four pieces and a rule met once are not the same kind of thing, and
   a library that cannot tell them apart is a list.

   WHAT "ASSESSED" MEANS HERE, AND WHAT IT REFUSES TO MEAN. Nothing in this
   room can hear you play, so nothing in it can grade your musicianship, and
   anything that pretended to would be a number you would learn to game. What
   it can do is hold two things side by side: what you say you can do with a
   rule, and what the record says about how often you have actually met it.
   Where those disagree it says so — a rule you called automatic in March and
   have not met since is the honest definition of something you have
   forgotten, and a rule you have met in five pieces and still call "noticed"
   is the thing to work on next. The standing is always yours to set. The
   disagreement is the room's to point out.
   ============================================================ */

/* Four degrees of knowing something, in the order they actually happen. The
   gap that matters is the last one: being able to do a thing when you are
   thinking about it is not the same as it being there when you are not. */
const RULE_STANDING = [
  ['noticed',    'Noticed',    'you can see it is true when it is pointed out'],
  ['understood', 'Understood', 'you can explain why, and spot it yourself'],
  ['doing',      'Doing',      'you do it when you remember to'],
  ['automatic',  'Automatic',  'it is there when you are not thinking about it']];
const ruleStandingName = k => (RULE_STANDING.find(v => v[0] === k) || RULE_STANDING[0])[1];
const ruleStandingAt = k => Math.max(0, RULE_STANDING.findIndex(v => v[0] === k));
/* The families a rule falls into. Kept short on purpose: a taxonomy with
   thirty branches is one nobody files anything under. */
const RULE_FAMILIES = [
  ['sound',    'Sound',            'tone, touch, pedal, balance between the hands'],
  ['line',     'Line and phrase',  'where a phrase goes and what carries it'],
  ['time',     'Time',             'rubato, placement, what may stretch and what may not'],
  ['harmony',  'Harmony',          'what to bring out because of what it is doing'],
  ['hands',    'The hands',        'fingering, leaps, redistribution, what to practise apart'],
  ['form',     'Form',             'how a section relates to the ones around it'],
  ['practice', 'How to practise',  'what has actually worked, as against what you were told'],
  ['nerves',   'Playing for people','what holds up under somebody listening and what does not']];
const ruleFamilyName = k => (RULE_FAMILIES.find(v => v[0] === k) || [,'Unfiled'])[1];

/* Its own corner of the state. Not inside a score, because the whole point is
   that a rule outlives the piece it was noticed in. */
function musicianship(){
  const m = S.musicianship = S.musicianship || {};
  m.rules = Array.isArray(m.rules) ? m.rules : [];
  m.rules.forEach(scoreRuleDefaults);
  return m;
}
const scoreRules = () => musicianship().rules;
const scoreRuleById = id => byId(scoreRules(), id);
function scoreRuleDefaults(r){
  r.id = r.id || uid();
  r.text = String(r.text || '').trim() || 'A rule';
  r.why = r.why || '';
  r.family = RULE_FAMILIES.some(v => v[0] === r.family) ? r.family : 'sound';
  r.standing = RULE_STANDING.some(v => v[0] === r.standing) ? r.standing : 'noticed';
  /* Every place you have met it. A source is a score and a bar, kept with the
     title beside the id so a rule still reads right after the score it came
     from has been taken off the shelf. */
  r.sources = Array.isArray(r.sources) ? r.sources : [];
  r.sources.forEach(s => { s.id = s.id || uid(); s.at = s.at || new Date().toISOString(); });
  /* Every time you have said where it stands, so the room can say when that
     was and whether anything has happened since. */
  r.checks = Array.isArray(r.checks) ? r.checks : [];
  r.createdAt = r.createdAt || new Date().toISOString();
  return r;
}

/* ---------- matching ----------
   Two sentences are the same rule when they say the same thing, which is not
   the same as being the same string. Compared on their words with the small
   ones dropped, so "bring the thumb out" and "Bring out the thumb." are one
   rule and not two. */
const RULE_STOP = new Set(['the','a','an','and','or','but','of','to','in','on','at','it','is',
  'be','that','this','with','for','so','you','your','when','then','not','do','does','out','up']);
function ruleWords(text){
  return String(text || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/).filter(w => w.length > 2 && !RULE_STOP.has(w));
}
/* How alike two sentences are: the share of their words they have in common,
   measured against the shorter of the two so that one sentence being longer
   than the other does not by itself make them different rules. */
function ruleLikeness(a, b){
  const x = new Set(ruleWords(a)), y = new Set(ruleWords(b));
  if(!x.size || !y.size) return 0;
  let both = 0;
  x.forEach(w => { if(y.has(w)) both++; });
  return both / Math.min(x.size, y.size);
}
const RULE_SAME = 0.7;
function ruleLike(text, except){
  let best = null, score = 0;
  scoreRules().forEach(r => {
    if(except && r.id === except) return;
    const v = ruleLikeness(text, r.text);
    if(v > score){ score = v; best = r; }
  });
  return score >= RULE_SAME ? {rule: best, likeness: score} : null;
}

/* ---------- writing one down ----------
   Either a new rule or another sighting of one you already have. Which of
   those it was is returned, because the room should say so: "you have written
   this before, in the Chopin" is the whole point of the feature. */
function noteScoreRule(fields){
  const f = fields || {};
  const text = String(f.text || '').trim();
  if(!text) return null;
  const hit = ruleLike(text);
  const src = f.scoreId ? {id: uid(), scoreId: f.scoreId, title: f.title || '',
    measure: Math.max(1, +f.measure || 1), pinId: f.pinId || null,
    at: new Date().toISOString()} : null;
  if(hit){
    const r = hit.rule;
    /* the same bar of the same piece is not a second sighting */
    const seen = src && r.sources.some(s => s.scoreId === src.scoreId && s.measure === src.measure);
    if(src && !seen) r.sources.push(src);
    if(f.family) r.family = f.family;
    return {rule: r, again: true, fresh: !seen, likeness: hit.likeness};
  }
  const r = scoreRuleDefaults({text, family: f.family, why: f.why || '',
    sources: src ? [src] : []});
  scoreRules().push(r);
  return {rule: r, again: false, fresh: true, likeness: 1};
}
function removeScoreRule(id){
  const gone = spliceOut(scoreRules(), r => r.id === id);
  saveNow();
  return gone;
}
/* Saying where it stands. Kept as a trail rather than a field, because "when
   did I last look at this" is the question the summary is built on. */
function checkScoreRule(id, standing){
  const r = scoreRuleById(id); if(!r) return null;
  if(!RULE_STANDING.some(v => v[0] === standing)) return null;
  r.standing = standing;
  r.checks.push({at: new Date().toISOString(), standing});
  if(r.checks.length > 40) r.checks.splice(0, r.checks.length - 40);
  saveNow();
  return r;
}

/* ---------- what the record says, as against what you say ----------
   The two are deliberately not averaged into one number. A rule you have met
   in five pieces and still call noticed, and a rule you called automatic and
   have not met in a year, are opposite problems, and a single score would
   hide both of them under "medium". */
const rulePieces = r => new Set((r.sources || []).map(s => s.scoreId)).size;
const ruleLastMet = r => (r.sources || []).map(s => s.at).sort().slice(-1)[0] || r.createdAt;
const ruleLastCheck = r => (r.checks || []).map(c => c.at).sort().slice(-1)[0] || null;
function scoreRuleReading(r){
  const pieces = rulePieces(r);
  const met = (r.sources || []).length;
  const since = daysSince(timeDayOf(ruleLastMet(r)));
  const checked = ruleLastCheck(r);
  const sinceCheck = checked ? daysSince(timeDayOf(checked)) : null;
  const at = ruleStandingAt(r.standing);
  /* Under-claimed: it keeps turning up and you still only say you notice it.
     That is the next thing to work on, and it is the most useful row in the
     library. */
  const under = pieces >= 3 && at <= 1;
  /* Over-claimed: you called it settled and nothing has happened since. Not
     an accusation — a year is a long time, and this is what forgetting
     looks like from the outside. */
  const stale = at >= 2 && since > 180;
  /* And one that was written down once and never met again is not knowledge
     yet; it is a thing you thought once. */
  const thin = pieces <= 1 && since > 90 && at <= 1;
  return {pieces, met, since, sinceCheck, at, under, stale, thin,
    say: under ? `met in ${pieces} pieces and still only noticed`
      : stale ? `called ${ruleStandingName(r.standing).toLowerCase()}, not met in ${Math.round(since / 30)} months`
      : thin ? 'written down once and not met since'
      : pieces > 1 ? `met in ${pieces} pieces` : 'met once'};
}
/* The library as a whole, which is the closest this room comes to saying
   anything about your musicianship — and it says it in counts, not a score. */
function musicianshipReading(){
  const rules = scoreRules();
  const by = {};
  RULE_STANDING.forEach(([k]) => by[k] = 0);
  const fam = {};
  rules.forEach(r => { by[r.standing] = (by[r.standing] || 0) + 1;
    fam[r.family] = (fam[r.family] || 0) + 1; });
  const readings = rules.map(r => ({r, v: scoreRuleReading(r)}));
  return {n: rules.length, by, fam,
    pieces: new Set(rules.flatMap(r => (r.sources || []).map(s => s.scoreId))).size,
    under: readings.filter(x => x.v.under).map(x => x.r),
    stale: readings.filter(x => x.v.stale).map(x => x.r),
    thin:  readings.filter(x => x.v.thin).map(x => x.r),
    /* the only aggregate worth having: how much of what you have written
       down you can actually do without thinking about it */
    settled: by.automatic || 0};
}

/* ---------- the library ----------
   On the shelf page, under the inventory: the shelf is what you are working
   on, the inventory is what you have, and this is what you have learned from
   any of it. */
function scoreRuleFilters(){
  return S._screv = S._screv || {q:'', family:'all', standing:'all', sort:'met'};
}
function scoreRuleMatches(r, f){
  const q = (f.q || '').trim().toLowerCase();
  if(q && !`${r.text} ${r.why} ${(r.sources || []).map(s => s.title).join(' ')}`.toLowerCase().includes(q)) return false;
  if(f.family !== 'all' && r.family !== f.family) return false;
  if(f.standing !== 'all' && r.standing !== f.standing) return false;
  return true;
}
function scoreRulesHTML(){
  const all = scoreRules();
  const m = musicianshipReading();
  const f = scoreRuleFilters();
  const list = all.filter(r => scoreRuleMatches(r, f)).sort((a, b) => {
    if(f.sort === 'standing') return ruleStandingAt(a.standing) - ruleStandingAt(b.standing)
      || rulePieces(b) - rulePieces(a);
    if(f.sort === 'new') return String(b.createdAt).localeCompare(String(a.createdAt));
    if(f.sort === 'family') return a.family.localeCompare(b.family) || rulePieces(b) - rulePieces(a);
    return rulePieces(b) - rulePieces(a) || (b.sources || []).length - (a.sources || []).length;
  });
  return `<section class="section rv sc-rules" id="scRules">
    <div class="row between" style="align-items:baseline">
      <span class="sc" style="margin:0">The unwritten rules</span>
      <span class="mono">${all.length ? `${m.n} rule${m.n === 1 ? '' : 's'} · ${m.pieces} piece${m.pieces === 1 ? '' : 's'}` : ''}</span></div>
    <p class="muted" style="font-size:.85rem">What you have written on a score that was never really about that bar.
      A pin can say it is a rule rather than a note, and the same rule met in a second piece
      is the same row with another sighting on it — which is the only evidence any of this is real.</p>
    ${all.length ? `${scoreRuleSummaryHTML(m)}
    <div class="filter-bar">
      <input class="inp" id="scrq" placeholder="search the rules" value="${esc(f.q)}">
      <select class="sel" id="scrFam"><option value="all">any family</option>${RULE_FAMILIES.map(([k, n]) =>
        `<option value="${k}" ${f.family === k ? 'selected' : ''}>${esc(n)}${m.fam[k] ? ` (${m.fam[k]})` : ''}</option>`).join('')}</select>
      <select class="sel" id="scrStand"><option value="all">any standing</option>${RULE_STANDING.map(([k, n]) =>
        `<option value="${k}" ${f.standing === k ? 'selected' : ''}>${esc(n)}${m.by[k] ? ` (${m.by[k]})` : ''}</option>`).join('')}</select>
      <select class="sel" id="scrSort">${[['met','by how often met'],['standing','by standing'],
        ['family','by family'],['new','newest first']].map(([v, l]) =>
        `<option value="${v}" ${f.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      ${(f.q || f.family !== 'all' || f.standing !== 'all') ? '<button class="btn sm ghost" id="scrClear">clear</button>' : ''}
    </div>
    ${list.length ? `<div class="scr-rows">${list.map(scoreRuleRowHTML).join('')}</div>`
      : '<div class="empty sm">Nothing matches that.</div>'}`
    : `<div class="empty">Nothing here yet. Pin a note on a score, and if it is true of more than that
       bar, mark it as a rule — it will be waiting here the next time you write the same thing.</div>`}
    <div class="row" style="margin-top:10px"><button class="btn sm primary" id="scrNew">＋ a rule, without a score</button></div>
  </section>`;
}
/* The counts, and the three honest disagreements. No total, no score out of
   ten: what would be averaged are four different kinds of problem. */
function scoreRuleSummaryHTML(m){
  const top = Math.max(1, ...RULE_STANDING.map(([k]) => m.by[k] || 0));
  return `<div class="scr-sum">
    <div class="scr-bars">${RULE_STANDING.map(([k, n, hint]) => `<div class="scr-bar" data-scrstand="${k}" title="${esc(hint)}">
      <span class="mono scr-bn">${esc(n)}</span>
      <span class="scr-bb scr-s-${k}"><i style="width:${Math.round(100 * (m.by[k] || 0) / top)}%"></i></span>
      <span class="mono">${m.by[k] || 0}</span></div>`).join('')}</div>
    ${m.under.length || m.stale.length || m.thin.length ? `<ul class="scr-says">
      ${m.under.length ? `<li><b>${m.under.length}</b> keep${m.under.length === 1 ? 's' : ''} turning up and you still only say you notice ${m.under.length === 1 ? 'it' : 'them'}. That is the next thing to work on.</li>` : ''}
      ${m.stale.length ? `<li><b>${m.stale.length}</b> you called settled and have not met in half a year. That is what forgetting looks like from here — not an accusation, just the record.</li>` : ''}
      ${m.thin.length ? `<li><b>${m.thin.length}</b> written down once and never met again. Worth asking whether ${m.thin.length === 1 ? 'it was' : 'they were'} really a rule.</li>` : ''}
    </ul>` : ''}
    <p class="faint sm">Nothing here can hear you play, so nothing here grades you. It holds what you say
      beside what the record says, and points at where they disagree.</p>
  </div>`;
}
function scoreRuleRowHTML(r){
  const v = scoreRuleReading(r);
  return `<div class="scr-row scr-s-${esc(r.standing)}${v.under ? ' under' : ''}${v.stale ? ' stale' : ''}"
    data-scrrow="${esc(r.id)}">
    <button class="scr-text" data-scropen="${esc(r.id)}">
      <b>${esc(r.text)}</b>
      <span class="faint mono">${esc(ruleFamilyName(r.family))} · ${esc(v.say)}</span></button>
    <span class="scr-where mono faint">${(r.sources || []).slice(-3).map(s =>
      `<button class="scr-src" data-scrgo="${esc(s.scoreId)}|${s.measure}"
        title="${esc(s.title || 'a score')}, bar ${s.measure}">${esc((s.title || '?').slice(0, 14))} m.${s.measure}</button>`).join('')}</span>
    <select class="sel sm scr-stand" data-scrset="${esc(r.id)}">${RULE_STANDING.map(([k, n]) =>
      `<option value="${k}" ${r.standing === k ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
    <button class="del-x inline" data-scrdel="${esc(r.id)}" title="throw this rule away">×</button>
  </div>`;
}
function bindScoreRules(root){
  const f = scoreRuleFilters();
  const redraw = () => { saveNow(); rerender(); };
  const q = root.querySelector('#scrq');
  if(q) q.oninput = debounce(() => { f.q = q.value; const at = q.selectionStart; rerender();
    const again = document.getElementById('scrq');
    if(again){ again.focus(); again.setSelectionRange(at, at); } }, 220);
  const pick = (sel, key) => { const n = root.querySelector(sel); if(n)
    n.onchange = () => { f[key] = n.value; redraw(); }; };
  pick('#scrFam', 'family'); pick('#scrStand', 'standing'); pick('#scrSort', 'sort');
  const clear = root.querySelector('#scrClear');
  if(clear) clear.onclick = () => { f.q = ''; f.family = 'all'; f.standing = 'all'; redraw(); };
  $$('[data-scropen]', root).forEach(b => b.onclick = () => openRuleModal(b.dataset.scropen));
  /* the standing is set right on the row: it is the one thing you come here
     to change, and a modal for a four-way choice is three presses too many */
  $$('[data-scrset]', root).forEach(n => n.onchange = () => {
    checkScoreRule(n.dataset.scrset, n.value); sound('click'); rerender(); });
  $$('[data-scrdel]', root).forEach(b => b.onclick = () => {
    const r = scoreRuleById(b.dataset.scrdel); if(!r) return;
    requestDelete({label: r.text, node: b.closest('.scr-row'), after: rerender,
      remove: () => removeScoreRule(r.id)});
  });
  /* back to the bar it came from, in the piece it came from */
  $$('[data-scrgo]', root).forEach(b => b.onclick = () => {
    const [id, at] = b.dataset.scrgo.split('|');
    const x = scoreById(id);
    if(!x){ toast('That score is not on the shelf any more.'); return; }
    scoreUi().id = id; scoreUi().focus = null; scoreUi().goto = +at || 1;
    saveNow(); navigate('#/score/' + id);
  });
  const add = root.querySelector('#scrNew');
  if(add) add.onclick = () => openRuleModal(null);
}

/* One rule, opened. Everything about it in one place, including the list of
   places you have met it, which is the part that makes it evidence. */
function openRuleModal(id){
  musicianship();
  const r = id ? scoreRuleById(id) : null;
  const v = r ? scoreRuleReading(r) : null;
  const m = openModal(`<h2>✎ ${r ? 'A rule' : 'A rule of your own'}</h2>
    <label class="pd-q"><span class="k">the rule, in your own words</span>
      <textarea class="inp" rows="2" id="ruText" autofocus
        placeholder="The inner voice carries the line — bring the thumb out.">${esc(r ? r.text : '')}</textarea></label>
    <div class="row" style="gap:10px;margin-top:8px">
      <label class="pd-q" style="flex:1"><span class="k">family</span>
        <select class="sel" id="ruFam">${RULE_FAMILIES.map(([k, n, hint]) =>
          `<option value="${k}" ${r && r.family === k ? 'selected' : ''}>${esc(n)} — ${esc(hint)}</option>`).join('')}</select></label>
      <label class="pd-q" style="flex:0 0 13rem"><span class="k">where it stands</span>
        <select class="sel" id="ruStand">${RULE_STANDING.map(([k, n, hint]) =>
          `<option value="${k}" ${r && r.standing === k ? 'selected' : ''}>${esc(n)} — ${esc(hint)}</option>`).join('')}</select></label>
    </div>
    <label class="pd-q" style="margin-top:8px"><span class="k">why — what made you write it down</span>
      <textarea class="inp" rows="3" id="ruWhy"
        placeholder="Kept losing the alto in bars 40–48 until I played it alone.">${esc(r ? r.why : '')}</textarea></label>
    ${r ? `<div class="pd-q" style="margin-top:10px"><span class="k">where you have met it</span>
      <div class="scr-srcs">${(r.sources || []).length
        ? r.sources.slice().reverse().map(s => `<div class="scr-srcrow">
            <button class="tbtn" data-rugo="${esc(s.scoreId)}|${s.measure}">${esc(s.title || 'a score')} · bar ${s.measure}</button>
            <span class="mono faint">${esc(fmtDate(timeDayOf(s.at), 'short'))}</span>
            <button class="del-x inline" data-rusrcdel="${esc(s.id)}" title="not really a sighting">×</button>
          </div>`).join('')
        : '<span class="faint sm">Nowhere yet — this one was written here rather than on a score.</span>'}</div>
      <p class="faint sm">${esc(v.say)}${v.sinceCheck != null
        ? ` · you last said where it stands ${v.sinceCheck === 0 ? 'today' : `${v.sinceCheck} days ago`}` : ''}</p></div>` : ''}
    <div class="row" style="justify-content:flex-end;margin-top:14px;gap:8px">
      ${r ? '<button class="btn sm ghost danger" id="ruDel">Throw it away</button><span class="grow"></span>' : ''}
      <button class="btn primary" id="ruSave">Save</button></div>`, 'wide sc-modal');
  $$('[data-rugo]', m).forEach(b => b.onclick = () => {
    const [sid, at] = b.dataset.rugo.split('|');
    if(!scoreById(sid)){ toast('That score is not on the shelf any more.'); return; }
    scoreUi().id = sid; scoreUi().focus = null; scoreUi().goto = +at || 1;
    m.remove(); saveNow(); navigate('#/score/' + sid);
  });
  $$('[data-rusrcdel]', m).forEach(b => b.onclick = () => {
    spliceOut(r.sources, s => s.id === b.dataset.rusrcdel);
    saveNow(); m.remove(); openRuleModal(r.id);
  });
  const del = m.querySelector('#ruDel');
  if(del) del.onclick = () => { removeScoreRule(r.id); m.remove(); sound('click'); rerender(); };
  m.querySelector('#ruSave').onclick = () => {
    const text = m.querySelector('#ruText').value.trim();
    if(!text){ m.querySelector('#ruText').focus(); return; }
    const family = m.querySelector('#ruFam').value;
    const standing = m.querySelector('#ruStand').value;
    if(r){
      r.text = text; r.family = family; r.why = m.querySelector('#ruWhy').value;
      if(r.standing !== standing) checkScoreRule(r.id, standing);
    } else {
      const made = noteScoreRule({text, family, why: m.querySelector('#ruWhy').value});
      if(made){
        if(made.rule.standing !== standing) checkScoreRule(made.rule.id, standing);
        /* saying so rather than quietly folding it in: being told you have
           already written this, in the Chopin, is the feature */
        if(made.again) toast('You have written this before — it went on the rule you already had.');
      }
    }
    saveNow(); m.remove(); sound('success'); rerender();
  };
  return m;
}
