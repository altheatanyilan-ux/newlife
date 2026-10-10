/* ============================================================
   THE KNOWLEDGE TREE × iCanStudy — the retrieval layer
   (A-09, A-10, A-11, A-12, N-03, N-04).

   Review used to ask "Do you still hold this?" with the page on screen. That
   is recognition. Now the page is kept out of the document until you have
   written what you can remember; then it is shown beside what you wrote, you
   grade the recall, and only after that comes the belief question. The
   ladder is yours to set, and moves on how well you recalled, not on what you
   asserted. Mastery, challenge questions and mistakes give the review
   something to aim at.

   What was written before is not touched: a retrieval is written once, at the
   grade, and never again; an abandoned review leaves nothing.
   ============================================================ */

/* ============================================================
   A-10  The ladder
   ============================================================ */
const ICS_OLD_LADDER = [3, 14, 61, 183, 365];
const ICS_SAME_DAY_GAP_HOURS = 4;
const ICS_SUCCESS_THRESHOLD = 0.5;
function icsLadder(){ const l = S.treePrefs && S.treePrefs.ladder; return Array.isArray(l) && l.length >= 2 ? l : ICS_DEFAULT_LADDER; }
function icsValidateLadder(a){
  if(!Array.isArray(a) || a.length < 2) return 'at least two rungs';
  if(!a.every(n => Number.isInteger(n) && n >= 0)) return 'whole days, zero or more';
  for(let i = 1; i < a.length; i++) if(a[i] <= a[i - 1]) return 'each rung must be longer than the last';
  if(a[a.length - 1] > 3650) return 'ten years is long enough';
  return null;
}
/* a bad ladder is refused and the old one is kept; the answer is the reason, or null */
function icsSetLadder(a){ const e = icsValidateLadder(a); if(e) return e; S.treePrefs.ladder = a.slice(); save(); return null; }
function icsClampRung(i){ return Math.max(0, Math.min(icsLadder().length - 1, i)); }
/* a new page is first asked after about three days, as before; the same-day and next-day rungs are for pages just reviewed */
function icsInitialRung(){ const l = icsLadder(); const i = l.findIndex(d => d >= 3); return i < 0 ? l.length - 1 : i; }
function icsScheduleFrom(rung, from){ const i = icsClampRung(rung); return {rung: i, dueDate: treeAddDays(from || treeToday(), icsLadder()[i])}; }
function icsReviewRow(pageId){ treeScheduleReview(pageId); return S.treeReviews.find(r => r.nodeId === pageId); }
function icsGetRung(pageId){ const r = S.treeReviews.find(x => x.nodeId === pageId); return r ? r.step : null; }
function icsSetRung(pageId, i){ const r = icsReviewRow(pageId), s = icsScheduleFrom(i); r.step = s.rung; r.dueAt = s.dueDate; save(); return s; }
/* the old ladder's rungs map to the nearest new one; due dates are NOT recomputed, so nothing floods on upgrade */
function icsMigrateLadder(){
  const P = S.treePrefs; if(!P || P.ladderMigrated) return false;
  const l = icsLadder();
  (S.treeReviews || []).forEach(r => {
    const d = ICS_OLD_LADDER[r.step]; if(d == null) return;
    let best = 0, diff = Infinity; l.forEach((x, i) => { const df = Math.abs(x - d); if(df < diff){ diff = df; best = i; } });
    r.step = best;
  });
  P.ladderMigrated = true; return true;
}
/* due: not pruned, the date has come, and a same-day rung waits a few hours */
function icsIsDue(r, now){
  now = now || new Date();
  const n = treeNode(r.nodeId); if(!n || n.status === 'pruned') return false;
  if(!r.dueAt || r.dueAt > now.toISOString().slice(0, 10)) return false;
  if(icsLadder()[r.step] === 0 && r.lastReviewedAt && (now - Date.parse(r.lastReviewedAt)) / 36e5 < ICS_SAME_DAY_GAP_HOURS) return false;
  return true;
}
/* success is a recall that worked, not a belief asserted */
function icsScheduleOutcome(pageId, score){
  const r = icsReviewRow(pageId), before = r.step;
  const after = score >= 1 ? before + 1 : score >= ICS_SUCCESS_THRESHOLD ? before : 0;
  const s = icsScheduleFrom(after);
  r.step = s.rung; r.dueAt = s.dueDate; r.lastReviewedAt = treeNow();
  return {before, after: s.rung, dueDate: s.dueDate};
}
function icsApplyBeliefAnswer(pageId, answer, retrieval){
  const r = icsReviewRow(pageId);
  r.history.push({date: treeNow(), verdict: answer});
  if(answer === 'hold'){ /* the recall was the evidence; no second advance */ }
  else if(answer === 'doubt'){ const s = icsScheduleFrom(0); r.step = s.rung; r.dueAt = s.dueDate; }
  else if(answer === 'revise'){ const ok = retrieval && retrieval.score >= ICS_SUCCESS_THRESHOLD; const s = icsScheduleFrom(r.step + (ok ? 1 : 0)); r.step = s.rung; r.dueAt = s.dueDate; }
  else throw new Error('unknown belief answer: ' + answer);
  r.lastReviewedAt = treeNow(); treeTouch(pageId); save();
  return {rung: r.step, dueDate: r.dueAt};
}
function icsRungLine(pageId){
  const r = S.treeReviews.find(x => x.nodeId === pageId); if(!r) return '';
  const l = icsLadder(), d = l[r.step];
  return `Rung ${r.step + 1} of ${l.length} — ${r.dueAt <= treeToday() ? 'due now' : `back in ${icsDaysBetween(treeToday(), r.dueAt)} day${icsDaysBetween(treeToday(), r.dueAt) === 1 ? '' : 's'}, on ${fmtDate(r.dueAt, 'med')}`} (this rung is ${d} day${d === 1 ? '' : 's'}).`;
}
function icsLadderSettingsHTML(){
  return `<details class="tr-ladder" id="trLadder"><summary>How often things come back</summary>
    <p class="faint tr-hint">Days after a review before it returns. Each rung must be longer than the last. Review just as you start to forget.</p>
    <input class="inp" type="text" id="trLadIn" value="${icsLadder().join(', ')}" aria-label="Ladder in days">
    <div class="row" style="gap:6px;margin-top:6px"><button class="tbtn sm" id="trLadSave">Save</button><button class="tbtn sm" id="trLadDef">Use the default</button></div>
    <p class="tr-err" id="trLadErr" role="alert"></p>
    <p class="faint tr-note">Changing this does not move anything already scheduled. New intervals apply from the next review.</p></details>`;
}
function icsBindLadder(root){
  const sv = root.querySelector('#trLadSave'); if(!sv) return;
  const show = e => { root.querySelector('#trLadErr').textContent = e || ''; };
  sv.onclick = () => { const a = root.querySelector('#trLadIn').value.split(/[\s,]+/).filter(Boolean).map(Number); const e = icsSetLadder(a); show(e); if(!e) toast('Saved. New intervals apply from the next review.'); };
  root.querySelector('#trLadDef').onclick = () => { icsSetLadder(ICS_DEFAULT_LADDER); root.querySelector('#trLadIn').value = ICS_DEFAULT_LADDER.join(', '); show(''); toast('The default ladder.'); };
}

/* ============================================================
   A-11  Mastery, 1 to 5
   ============================================================ */
const ICS_MASTERY = [
  {level: 1, name: 'Facts', desc: 'I can recall isolated facts and details.', tests: ['Flashcards on facts', 'Cover-copy-check']},
  {level: 2, name: 'Isolated concepts', desc: 'I can explain single concepts and solve simple problems.', tests: ['Flashcards that explain a concept', 'Teach one concept', 'Process maps']},
  {level: 3, name: 'Relationships', desc: 'I can relate concepts and compare them, but not yet to the big picture.', tests: ['Teach how two concepts relate', 'Compare and contrast', 'Relationship questions', 'Mind maps']},
  {level: 4, name: 'Integrated', desc: 'Heavily connected. The details sit in the big picture and it feels simpler than it did.', tests: ['Chunkmaps with groups and emphasis', 'Justify relative importance', 'Whole-Part-Whole reteaching', 'How changing context changes importance']},
  {level: 5, name: 'Novel', desc: 'I can create knowledge that was not there before.', tests: ['Beyond ordinary study']}];
const ICS_AIM_LEVEL = 4;
function icsSetMastery(pageId, level, evidence){
  const n = Number(level);
  if(!Number.isInteger(n) || n < 1 || n > 5) throw new Error('mastery must be 1 to 5');
  if(!String(evidence || '').trim()) throw new Error('name the evidence: what did you do that showed this?');
  const page = treeNode(pageId); if(!page) throw new Error('no such page');
  const old = page.mastery || {level: null, history: []};
  const entry = Object.freeze({date: treeToday(), level: n, evidence: String(evidence).trim()});
  const m = {level: n, history: Object.freeze([...(old.history || []), entry])};
  const r = treeSavePage({id: pageId, mastery: m}); if(r.error) throw new Error(r.error);
  return r.node.mastery;
}
function icsEvidenceSuggestions(pageId){ return icsRetrievalsFor(pageId).slice(0, 3).map(r => `${r.date}: ${r.method} scored ${Math.round(r.score * 100)}%`); }
function icsMasteryDistribution(){
  const d = {unassessed: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
  (S.treeNodes || []).forEach(p => { if(p.status === 'pruned') return; d[(p.mastery && p.mastery.level) || 'unassessed']++; });
  return d;
}
function icsIsStalled(n, days){ const m = n.mastery; if(!m || !m.level || m.level > 2) return false; const last = (m.history || [])[(m.history || []).length - 1]; return !!last && icsDaysBetween(last.date, treeToday()) > (days || 30); }
function icsShareAtAim(){
  const live = (S.treeNodes || []).filter(p => p.status !== 'pruned' && p.status !== 'stub'); if(!live.length) return 0;
  return live.filter(p => p.mastery && p.mastery.level >= ICS_AIM_LEVEL).length / live.length;
}
function icsMasteryPillHTML(n){
  const l = n.mastery && n.mastery.level;
  return l ? `<span class="tr-mastery" data-level="${l}" title="${esc(ICS_MASTERY[l - 1].name)}">L${l}</span>` : `<span class="tr-mastery unassessed" title="Mastery not yet assessed">L?</span>`;
}
function icsMasteryHTML(n){
  const m = n.mastery, hist = (m && m.history) || [], sug = icsEvidenceSuggestions(n.id);
  return `<section class="tr-mastery-block" id="trMastery"><div class="tr-sechead"><h3>How well do I know this?</h3><span class="faint">${esc(icsRungLine(n.id))}</span></div>
    <ol class="tr-mastery-ladder">${ICS_MASTERY.map(x => `<li data-level="${x.level}"${m && m.level === x.level ? ' aria-current="true"' : ''}><b>${esc(x.name)}</b> — ${esc(x.desc)}${x.level === ICS_AIM_LEVEL ? ' <span class="faint">aim for this</span>' : ''}</li>`).join('')}</ol>
    <form class="tr-mastery-form" data-act="mastery-set" onsubmit="return false"><label>Level <select class="sel" name="level">${ICS_MASTERY.map(x => `<option value="${x.level}"${m && m.level === x.level ? ' selected' : ''}>${x.level} · ${esc(x.name)}</option>`).join('')}</select></label>
      <label class="grow">Evidence <input class="inp" name="evidence" list="trMasteryEv" placeholder="What did you do that showed this?"></label>
      <datalist id="trMasteryEv">${sug.map(s => `<option value="${esc(s)}">`).join('')}</datalist><button type="button" class="btn sm" data-act="mastery-save">Record</button></form>
    <p class="tr-err" id="trMastErr"></p>
    ${hist.length ? `<details class="tr-earlier"><summary>Earlier assessments (${hist.length})</summary><ul>${hist.slice().reverse().map(h => `<li>${esc(fmtDate(h.date, 'med'))} — L${h.level} — “${esc(h.evidence)}”</li>`).join('')}</ul></details>` : ''}
    ${icsIsStalled(n) ? '<p class="tr-hint tr-warn soft">A month at this level. Ask how it relates to two other things.</p>' : ''}</section>`;
}
function icsBindMastery(root, n){
  const b = root.querySelector('[data-act="mastery-save"]'); if(!b) return;
  b.onclick = () => { const f = root.querySelector('[data-act="mastery-set"]'); try { icsSetMastery(n.id, f.level.value, f.evidence.value); treePageRoute(root, treeNode(n.id)); } catch(e){ root.querySelector('#trMastErr').textContent = e.message; } };
}

/* ============================================================
   A-09  Recall-first review
   ============================================================ */
const ICS_METHODS = [
  {key: 'free-recall', label: 'Brain dump from memory', level: 2, prompt: 'Write everything you can remember about this. Don’t look.'},
  {key: 'flashcard', label: 'Bare facts', level: 1, prompt: 'State the facts and definitions, from memory.'},
  {key: 'mindmap-dump', label: 'Mind-map dump', level: 3, prompt: 'Sketch this as a map in words: nodes, and the arrows between them. Groups, not a list.'},
  {key: 'relational-question', label: 'Relational question', level: 3, prompt: 'How does this relate to two other things you hold? Where do they differ?'},
  {key: 'teach', label: 'Teach it', level: 4, prompt: 'Teach this to someone who has never heard of it. Explain why it matters BEFORE you name it.'},
  {key: 'evaluative', label: 'Evaluative question', level: 4, prompt: 'Which part of this matters most, and why? What would change that ranking?'}];
const ICS_MIN_RECALL_WORDS = 5;
function icsMethodByKey(k){ return ICS_METHODS.find(m => m.key === k); }
function icsRetrievalsFor(pageId){
  /* newest first; two in the same instant keep the order they were written in */
  return (S.treeRetrievals || []).map((r, i) => [r, i]).filter(x => x[0].pageId === pageId)
    .sort((a, b) => { const x = a[0].at || a[0].date, y = b[0].at || b[0].date; return x < y ? 1 : x > y ? -1 : b[1] - a[1]; }).map(x => x[0]);
}
/* interleaving by method of generation: deterministic, never the same method twice running, aimed at the page's level */
function icsChooseMethod(page){
  const rs = icsRetrievalsFor(page.id), recent = rs.slice(0, 2).map(r => r.method);
  const target = (page.mastery && page.mastery.level) || 1;
  const wanted = ICS_METHODS.filter(m => m.level >= target && m.level <= target + 1);
  const base = wanted.length ? wanted : ICS_METHODS;
  const pool = base.filter(m => !recent.includes(m.key));
  if(pool.length) return pool[rs.length % pool.length];
  return base.find(m => m.key !== recent[0]) || ICS_METHODS.find(m => m.key !== recent[0]) || ICS_METHODS[0];
}
function icsRecallIsSubstantive(t){ return icsWords(t) >= ICS_MIN_RECALL_WORDS; }
/* written once, at the grade: nothing before it, nothing after */
function icsRecordRetrieval(o){
  const page = treeNode(o.pageId); if(!page) throw new Error('no such page');
  const m = icsMethodByKey(o.method); if(!m) throw new Error('unknown method: ' + o.method);
  if(!o.blank && !icsRecallIsSubstantive(o.recallText)) throw new Error('recall attempt too short; use blank:true for "nothing"');
  const s = o.blank ? 0 : Math.max(0, Math.min(1, Number(o.score)));
  const out = icsScheduleOutcome(o.pageId, s);
  const rec = Object.freeze({id: uid(), pageId: o.pageId, date: treeToday(), at: treeNow(), method: o.method, recallText: o.blank ? '' : String(o.recallText), score: s, levelTested: m.level, rungBefore: out.before, rungAfter: out.after});
  if(!Array.isArray(S.treeRetrievals)) S.treeRetrievals = [];
  S.treeRetrievals.push(rec);
  const rv = S.treeReviews.find(x => x.nodeId === o.pageId); if(rv) rv.history.push({date: treeNow(), verdict: 'retrieval', score: s, method: o.method});
  treeTouch(o.pageId); treeDirty(); save();
  return rec;
}
function icsRetention(windowDays){
  const cutoff = new Date(Date.now() - (windowDays || 7) * 864e5).toISOString().slice(0, 10);
  const by = {};
  (S.treeRetrievals || []).filter(r => r.date >= cutoff).forEach(r => (by[r.levelTested] = by[r.levelTested] || []).push(r.score));
  const out = {}; Object.entries(by).forEach(([l, a]) => out[l] = {n: a.length, mean: a.reduce((x, y) => x + y, 0) / a.length});
  return out;
}
/* the review as a small state machine; the page's content only exists in reveal and after */
function icsMakeReviewSession(pageId, opts){
  opts = opts || {};
  const page = treeNode(pageId), method = (opts.method && icsMethodByKey(opts.method)) || icsChooseMethod(page);
  let step = 'prime', recallText = '', blank = false, retrieval = null;
  return {
    get step(){ return step; }, get method(){ return method; },
    primeView(){ return {title: page.title, kind: page.kind, breadcrumb: treeAncestors(page).map(a => a.title), methodLabel: method.label, prompt: method.prompt}; },
    begin(){ step = 'recall'; },
    submitRecall(text, isBlank){
      if(step !== 'recall') throw new Error('out of order');
      if(!isBlank && !icsRecallIsSubstantive(text)) return {ok: false, message: 'Write a little more, or say you remember nothing.'};
      recallText = isBlank ? '' : text; blank = !!isBlank; step = 'reveal'; return {ok: true, blank: !!isBlank};
    },
    revealView(){ if(step !== 'reveal' && step !== 'belief') throw new Error('nothing is revealed before a recall attempt'); return {page: treeNode(pageId), recallText, position: treeCurrentPosition(pageId)}; },
    grade(v){
      if(step !== 'reveal') throw new Error('out of order');
      retrieval = icsRecordRetrieval({pageId, method: method.key, recallText, score: v, blank});
      step = treeCurrentPosition(pageId) ? 'belief' : 'done';
      if(opts.mistakeId) icsResolveByRetest(opts.mistakeId, retrieval);
      return retrieval;
    },
    get retrieval(){ return retrieval; },
    beliefView(){ return {position: treeCurrentPosition(pageId)}; },
    finish(answer){ if(step !== 'belief') throw new Error('out of order'); step = 'done'; return icsApplyBeliefAnswer(pageId, answer, retrieval); }
  };
}
function icsReviewDialog(n, after, opts){
  const S0 = icsMakeReviewSession(n.id, opts), root = openModal('<div class="tr-review"></div>', 'wide');
  const box = root.querySelector('.tr-review'); const $m = id => box.querySelector(id);
  const close = () => { root.remove(); after && after(S0.retrieval); };
  const show = html => { box.innerHTML = html; };
  const prime = () => { const v = S0.primeView();
    show(`<div class="tr-review-step" data-step="prime"><nav class="tr-crumbs faint">${v.breadcrumb.map(esc).join(' › ')}</nav><h2 class="serif">${esc(v.title)}</h2>
      <p class="tr-method">Method this time: <strong>${esc(v.methodLabel)}</strong></p><p class="tr-prompt">${esc(v.prompt)}</p>
      <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" data-act="review-quit">Not now</button><button class="btn primary" data-act="review-begin">Start — no looking</button></div></div>`);
    $m('[data-act="review-quit"]').onclick = () => root.remove(); $m('[data-act="review-begin"]').onclick = () => { S0.begin(); recall(); }; };
  const recall = () => {
    show(`<div class="tr-review-step" data-step="recall"><p class="tr-prompt">${esc(S0.primeView().prompt)}</p>
      <textarea class="inp" data-field="recall" rows="12" placeholder="Everything you can remember…"></textarea><p class="tr-err" data-field="err"></p>
      <div class="row" style="justify-content:space-between;gap:8px"><button class="btn ghost tr-quiet" data-act="review-blank">I remember nothing</button><button class="btn primary" data-act="review-submit">Done — show me the page</button></div></div>`);
    const ta = $m('[data-field="recall"]'); setTimeout(() => ta.focus(), 30);
    $m('[data-act="review-submit"]').onclick = () => { const r = S0.submitRecall(ta.value, false); if(!r.ok){ $m('[data-field="err"]').textContent = r.message; return; } reveal(); };
    $m('[data-act="review-blank"]').onclick = () => { S0.submitRecall('', true); reveal(); }; };
  const reveal = () => { const v = S0.revealView(), pg = v.page;
    show(`<div class="tr-review-step" data-step="reveal"><div class="tr-review-cols"><section><h3>What you wrote</h3>${v.recallText ? `<pre class="tr-recalled">${esc(v.recallText)}</pre>` : '<p class="faint">Nothing — and that is information too.</p>'}</section>
      <section><h3>What the page says</h3>${v.position ? `<p class="tr-stmt">${esc(v.position.statement)} <span class="faint">(${v.position.confidence}%)</span></p>` : ''}
        <div class="prose">${icsIsSplit(pg) ? treeRender(pg.processed || pg.collected || '') : ((pg.body || '').trim() ? treeRender(pg.body) : '<p class="faint">Nothing written.</p>')}</div>
        ${(pg.whyImportant || '').trim() ? `<h4>Why it matters</h4><div class="prose">${treeRender(pg.whyImportant)}</div>` : ''}</section></div>
      <h3>How did that go?</h3><div class="row" style="gap:8px"><button class="btn" data-act="grade" data-v="0">Missed it</button><button class="btn" data-act="grade" data-v="0.5">Patchy</button><button class="btn primary" data-act="grade" data-v="1">Had it</button></div>
      <p class="faint tr-hint">Grade the recall, not the page. Patchy is the commonest honest answer.</p></div>`);
    box.querySelectorAll('[data-act="grade"]').forEach(b => b.onclick = () => { const rec = S0.grade(+b.dataset.v); if(S0.step === 'belief') belief(rec); else done(rec); }); };
  const belief = rec => { const v = S0.beliefView();
    show(`<div class="tr-review-step" data-step="belief"><p class="faint">${rec.rungBefore === rec.rungAfter ? 'It holds its rung.' : rec.rungAfter > rec.rungBefore ? 'It moves out a rung.' : 'It goes back to the start.'}</p>
      <h3>Do you still hold this?</h3><blockquote class="tr-was">${esc(v.position.statement)} <span class="faint">(${v.position.confidence}%)</span></blockquote>
      <div class="row" style="gap:8px"><button class="btn primary" data-act="belief" data-v="hold">Still hold it</button><button class="btn" data-act="belief" data-v="doubt">I doubt it now</button><button class="btn" data-act="belief" data-v="revise">Revise the position</button></div></div>`);
    box.querySelectorAll('[data-act="belief"]').forEach(b => b.onclick = () => {
      if(b.dataset.v === 'revise'){ treeReviseDialog(treeNode(n.id), () => { S0.finish('revise'); done(rec); }); return; }
      S0.finish(b.dataset.v); done(rec); }); };
  const done = rec => {
    const info = icsRungLine(n.id), missed = rec && rec.score === 0;
    show(`<div class="tr-review-step" data-step="done"><h3>Kept.</h3><p class="faint">${esc(info)}</p>
      ${missed ? '<p>Something went wrong here. Log what, so the re-test can come at it from another angle.</p>' : ''}
      <div class="row" style="justify-content:flex-end;gap:8px">${missed ? '<button class="btn" data-act="log-mistake">Log a mistake</button>' : ''}<button class="btn primary" data-act="review-close">Close</button></div></div>`);
    $m('[data-act="review-close"]').onclick = close;
    const lm = $m('[data-act="log-mistake"]'); if(lm) lm.onclick = () => icsMistakeDialog(treeNode(n.id), {methodUsed: rec.method}, () => {});
  };
  root.querySelector('.close') && root.querySelector('.close').addEventListener('click', () => { after && after(S0.retrieval); });
  prime();
}

/* ============================================================
   A-12  Today's tending: a registry of rules, one card at a time
   The three that were there keep their order; the new ones fill the gaps
   between the inbox and the fallback.
   ============================================================ */
const ICS_TEND_RULES = [];
function icsRegisterTendingRule(r){ ICS_TEND_RULES.push(r); ICS_TEND_RULES.sort((a, b) => a.priority - b.priority); }
function icsTendSkipped(rule, id){ const k = S.treePrefs.tendSkip || {}; return (k[rule + ':' + id] || '') >= treeToday(); }
function icsTendSkip(rule, id){ S.treePrefs.tendSkip = S.treePrefs.tendSkip || {}; S.treePrefs.tendSkip[rule + ':' + id] = treeAddDays(treeToday(), 1); save(); }
icsRegisterTendingRule({key: 'due-to-resurface', priority: 10, find(){ const due = treeDueReviews()[0]; const n = due && treeNode(due.nodeId); return n ? {kind: 'review', node: n, review: due} : null; }});
icsRegisterTendingRule({key: 'challenge-due', priority: 12, find(){
  const q = icsDueChallenges().find(x => treeNode(x.pageId) && !icsTendSkipped('challenge-due', x.id)); return q ? {kind: 'challenge', node: treeNode(q.pageId), question: q} : null; }});
icsRegisterTendingRule({key: 'mistake-retest', priority: 14, find(){
  const m = icsDueRetests().find(x => treeNode(x.pageId) && !icsTendSkipped('mistake-retest', x.id)); return m ? {kind: 'retest', node: treeNode(m.pageId), mistake: m} : null; }});
icsRegisterTendingRule({key: 'oldest-inbox', priority: 20, find(){ const i = S.treeInbox.slice().sort((a, b) => a.createdAt < b.createdAt ? -1 : 1)[0]; return i ? {kind: 'inbox', item: i} : null; }});
icsRegisterTendingRule({key: 'red-question', priority: 40, find(){
  const q = (S.treeQuestions || []).filter(x => !x.retiredAt && x.status === 'red' && x.kind !== 'challenge' && icsDaysAgo(x.createdAt) > 14 && treeNode(x.pageId) && !icsTendSkipped('red-question', x.id)).sort((a, b) => a.createdAt < b.createdAt ? -1 : 1)[0];
  return q ? {kind: 'question', node: treeNode(q.pageId), question: q} : null; }});
icsRegisterTendingRule({key: 'chunk-without-reason', priority: 45, find(){
  const c = icsLiveChunks().find(x => !String(x.reason || '').trim() && !icsTendSkipped('chunk-without-reason', x.id)); return c ? {kind: 'chunk', chunk: c} : null; }});
icsRegisterTendingRule({key: 'unprimed-branch', priority: 50, find(){
  const b = S.treeNodes.find(p => p.kind === 'branch' && p.status === 'active' && !treeChildren(p.id).length && !icsQuestionsFor(p.id).length && !icsTendSkipped('unprimed-branch', p.id));
  return b ? {kind: 'prime', node: b} : null; }});
/* the old fallback, now including points; dormant pages are still skipped (they still resurface on the ladder) */
icsRegisterTendingRule({key: 'left-longest', priority: 90, find(){
  const live = S.treeNodes.filter(n => n.status !== 'pruned' && n.status !== 'dormant')
    .sort((a, b) => String(a.lastTendedAt || '').localeCompare(String(b.lastTendedAt || '')) || String(a.createdAt).localeCompare(String(b.createdAt)));
  return live[0] ? {kind: 'branch', node: live[0]} : null; }});
function icsTodaysTending(){
  for(const rule of ICS_TEND_RULES){ let c = null; try { c = rule.find(); } catch(e){ c = null; } if(c) return Object.assign({}, c, {rule: rule.key}); }
  return null;
}
function icsTendingPressure(){ const o = {}; ICS_TEND_RULES.forEach(r => { try { o[r.key] = r.find() ? 1 : 0; } catch(e){ o[r.key] = 0; } }); return o; }

/* ============================================================
   N-03  Challenge questions
   ============================================================ */
const ICS_CHALLENGE_ANSWER_GAP = 14, ICS_CHALLENGE_CREATE_AFTER = 14;
const ICS_CHALLENGE_STEMS = ['Which of these matters most, and why? What would change that ranking?', 'How would this change if [context] were different?', 'Where do {A} and {B} agree, and where exactly do they part company?', 'What is the strongest argument against the position on this page?', 'If you could keep only one of these, which, and what would you lose?'];
function icsIsLocked(q, on){ on = on || treeToday(); return q.kind === 'challenge' && !!q.answerNotBefore && q.answerNotBefore > on && !q.answeredAt; }
function icsCreateChallenge(o){
  const t = String(o.text || '').trim(); if(!t) throw new Error('a challenge question needs text');
  const due = o.answerNotBefore || treeAddDays(treeToday(), ICS_CHALLENGE_ANSWER_GAP);
  if(icsDaysBetween(treeToday(), due) < 1) throw new Error('a challenge question cannot be answered the same day it is written. Set a date at least a day out.');
  return icsSaveQuestion({pageId: o.pageId, kind: 'challenge', text: t, answerNotBefore: due, selfMade: o.selfMade !== false});
}
/* the guard lives in the model, not only in the form */
function icsAnswerChallenge(id, text){
  const q = (S.treeQuestions || []).find(x => x.id === id); if(!q) throw new Error('no such question');
  if(icsIsLocked(q)) throw new Error('this question is sealed until ' + q.answerNotBefore);
  return icsSaveQuestion({id, pageId: q.pageId, kind: 'challenge', text: q.text, answer: String(text || '')});
}
function icsDueChallenges(on){ on = on || treeToday(); return (S.treeQuestions || []).filter(q => q.kind === 'challenge' && !q.retiredAt && q.status === 'red' && q.answerNotBefore && q.answerNotBefore <= on).sort((a, b) => a.answerNotBefore < b.answerNotBefore ? -1 : 1); }
function icsFirstLearnedAt(n){
  const d = []; if(n.createdAt) d.push(n.createdAt.slice(0, 10));
  const m = n.mastery && (n.mastery.history || [])[0]; if(m) d.push(m.date);
  const p = treePositionsOf(n.id)[0]; if(p && p.date) d.push(p.date.slice(0, 10));
  return d.sort()[0] || null;
}
function icsRipeForChallenge(on){
  on = on || treeToday();
  return S.treeNodes.filter(p => {
    if(p.status !== 'active') return false;
    const first = icsFirstLearnedAt(p); if(!first || icsDaysBetween(first, on) < ICS_CHALLENGE_CREATE_AFTER) return false;
    return !(S.treeQuestions || []).some(q => q.pageId === p.id && q.kind === 'challenge' && !q.retiredAt);
  });
}
function icsChallengeCounts(){
  const qs = (S.treeQuestions || []).filter(q => q.kind === 'challenge' && !q.retiredAt), t = treeToday();
  return {sealed: qs.filter(q => icsIsLocked(q, t)).length, ready: qs.filter(q => !q.answeredAt && !icsIsLocked(q, t)).length, answered: qs.filter(q => !!q.answeredAt).length};
}
function icsChallengesHTML(n){
  const cs = (S.treeQuestions || []).filter(q => q.pageId === n.id && q.kind === 'challenge' && !q.retiredAt).sort((a, b) => a.createdAt < b.createdAt ? -1 : 1);
  return `<div class="tr-challenges"><div class="tr-qhead"><span class="tr-lbl">Challenge questions</span></div>
    ${cs.map(q => { const locked = icsIsLocked(q);
      return `<article class="tr-challenge" data-locked="${locked}" data-q="${q.id}"><div class="tr-qtext">${treeRender(q.text)}</div>
        <p class="faint">${q.selfMade ? 'Written by me' : 'A premade question'} · written ${esc(fmtDate(q.createdAt.slice(0, 10), 'med'))}</p>
        ${q.answeredAt ? `<details><summary>Answered ${esc(fmtDate(q.answeredAt.slice(0, 10), 'med'))}</summary><div class="prose">${treeRender(q.answer)}</div></details><span class="light ${q.status}"></span>`
          : locked ? `<p class="tr-sealed">Sealed until ${esc(fmtDate(q.answerNotBefore, 'med'))} — ${icsDaysBetween(treeToday(), q.answerNotBefore)} days.</p><textarea class="inp" disabled placeholder="You cannot answer this yet. That is the point."></textarea>`
          : `<p class="tr-ready">Ready to answer.</p><textarea class="inp" data-field="answer" rows="4"></textarea><button type="button" class="tbtn sm" data-act="challenge-answer" data-q="${q.id}">Save the answer</button>`}</article>`; }).join('') || '<p class="faint">None yet.</p>'}
    <details class="tr-challenge-new"><summary>Write a challenge question</summary>
      <ul class="tr-stems">${ICS_CHALLENGE_STEMS.map(s => `<li><button type="button" class="tbtn sm" data-act="stem" data-stem="${esc(s)}">${esc(s)}</button></li>`).join('')}</ul>
      <textarea class="inp" data-field="ctext" rows="3" placeholder="Make it hard. Don’t ask what you already know."></textarea>
      <label>Answer no earlier than <input class="inp" type="date" data-field="cdate" value="${treeAddDays(treeToday(), ICS_CHALLENGE_ANSWER_GAP)}"></label>
      <label class="tr-chk"><input type="checkbox" data-field="cself" checked> I wrote this one</label>
      <button type="button" class="tbtn" data-act="challenge-create">Seal it</button><p class="tr-err" data-field="cerr"></p></details></div>`;
}
function icsBindChallenges(root, n){
  const again = () => treePageRoute(root, treeNode(n.id));
  root.querySelectorAll('[data-act="stem"]').forEach(b => b.onclick = () => { root.querySelector('[data-field="ctext"]').value = b.dataset.stem; });
  const mk = root.querySelector('[data-act="challenge-create"]');
  if(mk) mk.onclick = () => { try { icsCreateChallenge({pageId: n.id, text: root.querySelector('[data-field="ctext"]').value, answerNotBefore: root.querySelector('[data-field="cdate"]').value, selfMade: root.querySelector('[data-field="cself"]').checked}); again(); } catch(e){ root.querySelector('[data-field="cerr"]').textContent = e.message; } };
  root.querySelectorAll('[data-act="challenge-answer"]').forEach(b => b.onclick = () => { const art = b.closest('.tr-challenge'); try { icsAnswerChallenge(b.dataset.q, art.querySelector('[data-field="answer"]').value); again(); } catch(e){ toast(e.message); } });
}

/* ============================================================
   N-04  The mistake log
   ============================================================ */
const ICS_MISTAKE_TYPES = {misunderstood: 'I misunderstood the question', working: 'My working was missing or sloppy', fundamental: 'A gap in fundamental understanding', method: 'Right answer, but not by the best method'};
const ICS_RETEST_DAYS = 3, ICS_REPEAT_WINDOW = 90;
function icsLogMistake(o){
  if(!ICS_MISTAKE_TYPES[o.type]) throw new Error('unknown mistake type: ' + o.type);
  if(!String(o.question || '').trim()) throw new Error('what was the question?');
  if(!String(o.prevention || '').trim()) throw new Error('how will you ensure it never happens again?');
  if(!treeNode(o.pageId)) throw new Error('no such page');
  const m = {id: uid(), pageId: o.pageId, question: String(o.question).trim(), type: o.type, why: String(o.why || '').trim(), prevention: String(o.prevention).trim(), methodUsed: o.methodUsed || null,
    createdAt: treeNow(), retestDue: treeAddDays(treeToday(), ICS_RETEST_DAYS), resolvedAt: null};
  if(!Array.isArray(S.treeMistakes)) S.treeMistakes = [];
  S.treeMistakes.push(m); save(); return m;
}
function icsOpenMistakes(pageId){ return (S.treeMistakes || []).filter(m => !m.resolvedAt && (!pageId || m.pageId === pageId)); }
function icsDueRetests(on){ on = on || treeToday(); return icsOpenMistakes().filter(m => m.retestDue && m.retestDue <= on).sort((a, b) => a.retestDue < b.retestDue ? -1 : 1); }
/* a new angle: neither the method that produced the mistake nor the last one used */
function icsMethodForRetest(m){
  const page = treeNode(m.pageId), banned = new Set([m.methodUsed, (icsRetrievalsFor(m.pageId)[0] || {}).method]);
  const target = (page && page.mastery && page.mastery.level) || 1;
  return ICS_METHODS.filter(x => !banned.has(x.key) && x.level >= target)[0] || ICS_METHODS.find(x => !banned.has(x.key)) || ICS_METHODS[0];
}
/* only a clean recall resolves it; patchy pushes the re-test out and leaves it open */
function icsResolveByRetest(id, retrieval){
  const m = (S.treeMistakes || []).find(x => x.id === id); if(!m) throw new Error('no such mistake');
  if(!retrieval || retrieval.score < 1){ m.retestDue = treeAddDays(treeToday(), ICS_RETEST_DAYS); save(); return {resolved: false, mistake: m}; }
  m.resolvedAt = treeToday(); save(); return {resolved: true, mistake: m};
}
function icsRepeatedPatterns(on){
  on = on || treeToday(); const by = new Map();
  (S.treeMistakes || []).filter(m => icsDaysBetween((m.createdAt || m.retestDue || on).slice(0, 10), on) < ICS_REPEAT_WINDOW).forEach(m => { const k = m.pageId + '|' + m.type; by.set(k, (by.get(k) || 0) + 1); });
  return [...by.entries()].filter(([, c]) => c >= 2).map(([k, c]) => { const [pageId, type] = k.split('|'); return {pageId, type, count: c, note: `Same kind of mistake ${c} times on this page. That is a gap, not carelessness.`}; });
}
function icsMistakeDialog(n, o, after){
  o = o || {};
  const m = openModal(`<h2 class="serif">What went wrong?</h2><p class="faint">${esc(n.title)}</p>
    <label class="tr-f"><span>What was the question?</span><textarea class="inp" name="question" rows="2"></textarea></label>
    <fieldset class="tr-f"><legend>What kind of mistake?</legend>${Object.entries(ICS_MISTAKE_TYPES).map(([k, v], i) => `<label class="tr-chk"><input type="radio" name="type" value="${k}"${i === 2 ? ' checked' : ''}> ${v}</label>`).join('')}</fieldset>
    <label class="tr-f"><span>Why did it happen?</span><textarea class="inp" name="why" rows="2"></textarea></label>
    <label class="tr-f"><span>How will you ensure it never happens again? <small>required</small></span><textarea class="inp" name="prevention" rows="2"></textarea></label>
    <p class="tr-err" id="tmErr"></p><div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" id="tmNo">Cancel</button><button class="btn primary" id="tmOk">Log it — re-test in ${ICS_RETEST_DAYS} days</button></div>`, 'narrow');
  const f = id => m.querySelector(`[name=${id}]`);
  m.querySelector('#tmNo').onclick = () => m.remove();
  m.querySelector('#tmOk').onclick = () => { try { icsLogMistake({pageId: n.id, question: f('question').value, type: m.querySelector('[name=type]:checked').value, why: f('why').value, prevention: f('prevention').value, methodUsed: o.methodUsed || null}); m.remove(); toast('Logged. It will come back for a re-test.'); after && after(); } catch(e){ m.querySelector('#tmErr').textContent = e.message; } };
}
function icsMistakesHTML(n){
  const ms = (S.treeMistakes || []).filter(m => m.pageId === n.id); if(!ms.length) return '';
  return `<section class="tr-sec tr-mistakes"><div class="tr-sechead"><h2>Mistakes</h2><span class="faint">${icsOpenMistakes(n.id).length} open</span></div>
    <ul>${ms.map(m => `<li class="${m.resolvedAt ? 'resolved' : 'open'}"><b>${esc(m.question)}</b> <span class="faint">${esc(ICS_MISTAKE_TYPES[m.type])}</span>${m.resolvedAt ? ` <i>resolved ${esc(fmtDate(m.resolvedAt, 'med'))}</i>` : ` <i>re-test ${esc(fmtDate(m.retestDue, 'med'))}</i>`}<br><span class="faint">Next time: ${esc(m.prevention)}</span></li>`).join('')}</ul></section>`;
}

/* ============================================================
   Tree Home, Proof and the page, where all of this is shown
   ============================================================ */
function icsHomeTilesHTML(){
  const d = icsMasteryDistribution(), tot = Object.values(d).reduce((a, b) => a + b, 0);
  return `<a class="tr-tile" href="#/tree/mastery"><b>${Math.round(icsShareAtAim() * 100)}%</b><span>at level 4 or above</span><span class="tr-spark faint" aria-label="${[1, 2, 3, 4, 5].map(l => l + ':' + d[l]).join(' ')} unassessed:${d.unassessed}">${[1, 2, 3, 4, 5].map(l => `<i style="height:${tot ? Math.max(2, Math.round(d[l] / tot * 28)) : 2}px"></i>`).join('')}<i class="un" style="height:${tot ? Math.max(2, Math.round(d.unassessed / tot * 28)) : 2}px"></i></span></a>`;
}
function icsMasteryRoute(root){
  const d = icsMasteryDistribution();
  root.innerHTML = `<div class="page tr-page">${treeNav('')}<header class="tr-head"><h1 class="serif">Mastery</h1><p class="tr-lede">How well each page is known, as you assessed it — not how sure you are that it is true. Level 4 is the one to aim for.</p></header>
    <section class="tr-sec"><div class="tr-sechead"><h2>Across the tree</h2><span class="faint">${Math.round(icsShareAtAim() * 100)}% of live pages at level 4 or above</span></div>
      <ul class="tr-gaplist">${[['unassessed', 'Not yet assessed'], ...ICS_MASTERY.map(x => [x.level, `Level ${x.level} · ${x.name}`])].map(([k, l]) => `<li><b>${d[k]}</b> ${esc(l)}</li>`).join('')}</ul></section>
    ${ICS_MASTERY.map(x => ({x, pages: S.treeNodes.filter(p => p.status !== 'pruned' && p.mastery && p.mastery.level === x.level)})).filter(g => g.pages.length).reverse().map(g => `<section class="tr-sec"><div class="tr-sechead"><h2>Level ${g.x.level} · ${esc(g.x.name)}</h2></div><ul class="tr-gaplist">${g.pages.map(p => `<li>${treeKindMark(p)}<a href="${treeUrl(p)}">${esc(p.title)}</a></li>`).join('')}</ul></section>`).join('')}</div>`;
  treeBindNav(root);
}
function icsProofExtraHTML(){
  const c = icsChallengeCounts(), ripe = icsRipeForChallenge(), ms = (S.treeMistakes || []).slice().sort((a, b) => a.createdAt < b.createdAt ? 1 : -1), rep = icsRepeatedPatterns();
  const R = icsRetention(7), keys = Object.keys(R);
  return `<section class="tr-sec" id="trChallenges"><div class="tr-sechead"><h2>Challenge questions</h2><span class="faint">${c.sealed} sealed · ${c.ready} ready to answer · ${c.answered} answered</span></div>
      ${ripe.length ? `<details class="tr-earlier"><summary>Ripe for a challenge question (${ripe.length})</summary><p class="faint">First learned a fortnight or more ago, with none written. Write one now; answer it a fortnight later.</p><ul class="tr-gaplist">${ripe.slice(0, 40).map(p => `<li>${treeKindMark(p)}<a href="${treeUrl(p)}">${esc(p.title)}</a></li>`).join('')}</ul></details>` : '<p class="faint">Nothing is ripe just now.</p>'}</section>
    <section class="tr-sec" id="trMistakeLog"><div class="tr-sechead"><h2>Mistakes</h2><span class="faint">${icsOpenMistakes().length} open · ${ms.length - icsOpenMistakes().length} resolved</span></div>
      ${rep.map(r => `<p class="tr-hint tr-warn">${esc(r.note)} <a href="${treeUrl(treeNode(r.pageId))}">${esc(treeNode(r.pageId).title)}</a></p>`).join('')}
      ${ms.length ? `<ul class="tr-gaplist">${ms.map(m => { const p = treeNode(m.pageId); return `<li class="${m.resolvedAt ? 'resolved' : 'open'}"><a href="${p ? treeUrl(p) : '#'}">${esc(p ? p.title : '')}</a> — ${esc(m.question)} <span class="faint">${esc(ICS_MISTAKE_TYPES[m.type])}${m.resolvedAt ? ' · resolved' : ' · re-test ' + esc(m.retestDue)}</span></li>`; }).join('')}</ul>` : '<p class="faint">None logged.</p>'}
      <p class="faint tr-note">Nothing here is deleted. A resolved mistake stays on the record, because the pattern is the useful part.</p></section>
    <section class="tr-sec"><div class="tr-sechead"><h2>Retention, this week</h2><span class="faint">recall scored at each level</span></div>${keys.length ? `<ul class="tr-gaplist">${keys.map(k => `<li>Level ${k}: ${Math.round(R[k].mean * 100)}% over ${R[k].n} recall${R[k].n === 1 ? '' : 's'}</li>`).join('')}</ul>` : '<p class="faint">No recalls this week.</p>'}</section>`;
}

/* the tending card, redrawn for every kind of thing it can ask */
function treeTendItem(){ return icsTodaysTending(); }
function treeTendCardHTML(){
  const t = treeTendItem();
  if(!t) return `<div class="tr-tendcard quiet"><span class="tr-lbl">Today's tending</span><p>${S.treeNodes.length ? 'Nothing is asking for you today. The tree can rest.' : 'Plant a root, and the tree will start asking for a little each day.'}</p></div>`;
  const head = (lbl, n) => `<span class="tr-lbl">${lbl}</span>${n ? `<h2 class="serif"><a href="${treeUrl(n)}">${esc(n.title)}</a></h2>` : ''}`;
  if(t.kind === 'review'){ const m = icsChooseMethod(t.node);
    return `<div class="tr-tendcard" data-trtend="review" data-n="${t.node.id}">${head('Resurfacing · ' + esc(TREE_KINDS[t.node.kind]), t.node)}
      <p>Recall it before you look: <b>${esc(m.label)}</b>.</p><p class="faint">${esc(icsRungLine(t.node.id))}</p>
      <div class="row tr-tendbtns"><button class="btn sm primary" data-tv="start">Start — no looking</button></div></div>`; }
  if(t.kind === 'challenge') return `<div class="tr-tendcard" data-trtend="challenge" data-n="${t.node.id}" data-q="${t.question.id}">${head('A challenge question is ready to answer', t.node)}<div class="tr-stmt">${treeRender(t.question.text)}</div>
      <div class="row tr-tendbtns"><button class="btn sm primary" data-tv="open">Answer it</button><button class="btn sm ghost" data-tv="skip">Not now</button></div></div>`;
  if(t.kind === 'retest'){ const m = icsMethodForRetest(t.mistake);
    return `<div class="tr-tendcard" data-trtend="retest" data-n="${t.node.id}" data-mis="${t.mistake.id}">${head('Re-test a mistake, from a new angle', t.node)}<blockquote class="tr-was">${esc(t.mistake.question)}</blockquote>
      <p class="faint">Last time: ${esc(ICS_MISTAKE_TYPES[t.mistake.type])}. You said you would: ${esc(t.mistake.prevention)}</p><p class="tr-method">This time, by a different route: <strong>${esc(m.label)}</strong></p>
      <div class="row tr-tendbtns"><button class="btn sm primary" data-tv="start">Start</button><button class="btn sm ghost" data-tv="skip">Not now</button></div></div>`; }
  if(t.kind === 'inbox') return `<div class="tr-tendcard" data-trtend="inbox" data-i="${t.item.id}"><span class="tr-lbl">From the inbox</span>
      <p class="tr-stmt">${esc(t.item.text)}</p><p>Give it a home.</p>
      <div class="row tr-tendbtns"><button class="btn sm primary" data-tv="page">Make it a page</button><button class="btn sm" data-tv="attach">Add to a page</button><button class="btn sm ghost" data-tv="drop">Let it go</button></div></div>`;
  if(t.kind === 'question') return `<div class="tr-tendcard" data-trtend="question" data-n="${t.node.id}" data-q="${t.question.id}">${head('A question has been red for a fortnight', t.node)}<div class="tr-stmt">${treeRender(t.question.text)}</div>
      <div class="row tr-tendbtns"><button class="btn sm primary" data-tv="open">Answer it</button><button class="btn sm ghost" data-tv="skip">Not now</button></div></div>`;
  if(t.kind === 'chunk') return `<div class="tr-tendcard" data-trtend="chunk" data-c="${t.chunk.id}"><span class="tr-lbl">Why do these belong together?</span><h2 class="serif">${esc(t.chunk.title)}</h2>
      <div class="row tr-tendbtns"><button class="btn sm primary" data-tv="open">Say why</button><button class="btn sm ghost" data-tv="skip">Not now</button></div></div>`;
  if(t.kind === 'prime') return `<div class="tr-tendcard" data-trtend="prime" data-n="${t.node.id}">${head('This branch is bare. Prime it.', t.node)}<p class="faint">Broad and shallow first: collect the keywords and ask the questions. Depth comes later.</p>
      <div class="row tr-tendbtns"><button class="btn sm primary" data-tv="prime">Prime this branch</button><button class="btn sm ghost" data-tv="skip">Not now</button></div></div>`;
  const n = t.node, days = n.lastTendedAt ? Math.floor((Date.now() - Date.parse(n.lastTendedAt)) / 864e5) : null;
  return `<div class="tr-tendcard" data-trtend="branch" data-n="${n.id}"><span class="tr-lbl">Left longest · ${days == null ? 'never tended' : `${days} days`}</span>
    <h2 class="serif"><a href="${treeUrl(n)}">${esc(n.title)}</a></h2><p>One small thing for it: a line, a leaf, or where you stand.</p>
    <div class="row tr-tendbtns"><button class="btn sm primary" data-tv="line">Write a line</button><button class="btn sm" data-tv="leaf">Attach a leaf</button><button class="btn sm" data-tv="position">${treeCurrentPosition(n.id) ? 'Revise position' : 'State a position'}</button></div></div>`;
}
function treeBindTend(root){
  const card = root.querySelector('[data-trtend]'); if(!card) return;
  const kind = card.dataset.trtend, again = () => { const box = root.querySelector('#trTend'); if(box){ box.innerHTML = treeTendCardHTML(); treeBindTend(root); } else rerender(); };
  const done = msg => { toast(msg || 'Tended.'); again(); };
  card.querySelectorAll('[data-tv]').forEach(b => b.onclick = async () => {
    const v = b.dataset.tv;
    if(kind === 'review'){ const n = treeNode(card.dataset.n); return icsReviewDialog(n, rec => { if(rec) toast(icsRungLine(n.id)); again(); }); }
    if(kind === 'retest'){ const n = treeNode(card.dataset.n), mis = S.treeMistakes.find(m => m.id === card.dataset.mis);
      if(v === 'skip'){ icsTendSkip('mistake-retest', mis.id); return again(); }
      return icsReviewDialog(n, () => again(), {method: icsMethodForRetest(mis).key, mistakeId: mis.id}); }
    if(kind === 'challenge' || kind === 'question'){ const n = treeNode(card.dataset.n), q = S.treeQuestions.find(x => x.id === card.dataset.q);
      if(v === 'skip'){ icsTendSkip(kind === 'challenge' ? 'challenge-due' : 'red-question', q.id); return again(); }
      return icsQuestionDialog(n, Object.assign({}, q, {answerOnly: true}), again); }
    if(kind === 'chunk'){ const c = S.treeChunks.find(x => x.id === card.dataset.c);
      if(v === 'skip'){ icsTendSkip('chunk-without-reason', c.id); return again(); }
      const n = treeNode(c.memberIds[0]); return icsChunkDialog(n, c, again); }
    if(kind === 'prime'){ const n = treeNode(card.dataset.n);
      if(v === 'skip'){ icsTendSkip('unprimed-branch', n.id); return again(); }
      if(typeof icsPrimeWizard === 'function') return icsPrimeWizard(n.id, again); navigate(treeUrl(n)); return; }
    if(kind === 'inbox'){ const x = S.treeInbox.find(i => i.id === card.dataset.i); if(!x) return again();
      if(v === 'drop'){ treeInboxDone(x.id); return done('Let go.'); }
      if(v === 'page') return treeNewPageDialog({title: x.text.length <= 80 ? x.text : '', kind: 'point', after: n => { if(x.text.length > 80) treeSavePage({id: n.id, body: x.text}); treeInboxDone(x.id); treeTouch(n.id); done('A new page.'); }});
      const id = await treePickPage('Which page does this belong to?'); if(!id) return;
      const n = treeNode(id); treeSavePage(Object.assign(treeAppendDraft(n, x.text), {lastTendedAt: treeNow()})); treeInboxDone(x.id); return done(`Added to ${n.title}.`); }
    const n = treeNode(card.dataset.n);
    if(v === 'line'){ const t = await treeAsk(`A line for ${n.title}`, ''); if(!t) return; treeSavePage(Object.assign(treeAppendDraft(n, t), {lastTendedAt: treeNow()})); return done(); }
    if(v === 'leaf') return treeLeafDialog(n, () => { treeTouch(n.id); done(); });
    return treeReviseDialog(n, () => done());
  });
}
/* the compact card for Today */
function treeTodayHTML(){
  if(!Array.isArray(S.treeNodes) || !S.treeNodes.length) return '';
  const t = treeTendItem(); if(!t) return '';
  const k = t.kind, nm = t.node ? esc(t.node.title) : '';
  const what = k === 'review' ? `resurfacing: <b>${nm}</b>` : k === 'inbox' ? `from the inbox: ${esc(t.item.text.slice(0, 70))}${t.item.text.length > 70 ? '…' : ''}`
    : k === 'challenge' ? `a challenge question is ready: <b>${nm}</b>` : k === 'retest' ? `re-test a mistake: <b>${nm}</b>` : k === 'question' ? `a red question: <b>${nm}</b>`
    : k === 'chunk' ? `a chunk needs its reason: <b>${esc(t.chunk.title)}</b>` : k === 'prime' ? `a bare branch to prime: <b>${nm}</b>` : `left longest: <b>${nm}</b>`;
  return `<div class="tr-today" data-duty-id="knowledge_tree_tend"><span class="tr-lbl">Knowledge Tree</span><span class="tr-todayw">${what}</span><a class="btn sm ghost" href="#/tree">tend it</a></div>`;
}

/* ---------- the page binds what this layer drew ---------- */
function icsBindPageRetrieve(root, n){ icsBindMastery(root, n); icsBindChallenges(root, n); }

ICS_ROUTES.mastery = root => icsMasteryRoute(root);
