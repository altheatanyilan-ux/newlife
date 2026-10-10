/* ============================================================
   THE KNOWLEDGE TREE × iCanStudy — the encoding layer (A-06, A-07, A-08, N-02).

   Importance and the reason it matters (A-06) · an inquiry panel with traffic
   lights (A-07) · the Collected / Processed split (A-08) · chunks (N-02).

   Nothing here infers a judgement for the user. Importance is null until they
   decide it; a question is red until they answer it; a page splits only when
   they ask; a chunk exists only with a reason they wrote. Each is a prompt
   or a signal, never a gate on saving.
   ============================================================ */

/* ============================================================
   A-06  Importance, why-important, backbone
   ============================================================ */
const ICS_IMPORTANCE_MARK = {core: '●●●', supporting: '●●○', peripheral: '●○○'};
const ICS_BACKBONE_SOFT_CAP = 7;

function icsSetImportance(pageId, value, why){
  if(value !== null && !ICS_IMPORTANCE[value]) throw new Error('bad importance: ' + value);
  const n = treeNode(pageId); if(!n) throw new Error('no such page');
  const draft = {id: pageId, importance: value};
  if(typeof why === 'string') draft.whyImportant = why;
  const r = treeSavePage(draft); if(r.error) throw new Error(r.error);
  return r.node;
}
function icsSetWhy(pageId, text){ const r = treeSavePage({id: pageId, whyImportant: String(text || '')}); if(r.error) throw new Error(r.error); return r.node; }
/* core with no reason: prompted, never blocked */
function icsImportanceNeedsReason(n){ return n.importance === 'core' && !String(n.whyImportant || '').trim(); }
function icsSetBackbone(pageId, on){ const r = treeSavePage({id: pageId, backbone: !!on}); if(r.error) throw new Error(r.error); return r.node; }
function icsBackboneSignal(rootId){
  const bones = icsDescendants(rootId).filter(d => d.backbone && d.status !== 'pruned');
  if(!bones.length) return {level: 'prompt', text: 'No backbone marked. Which few pages carry this question?'};
  if(bones.length > ICS_BACKBONE_SOFT_CAP) return {level: 'signal', text: bones.length + ' pages are marked as backbone. A trunk that wide is a thicket. Which are the major ideas?'};
  return null;
}
function icsImportanceDistribution(){
  const d = {core: 0, supporting: 0, peripheral: 0, undecided: 0};
  (S.treeNodes || []).forEach(p => { if(p.status === 'pruned') return; d[p.importance || 'undecided']++; });
  return d;
}
function icsImportanceMarkHTML(n){
  return n.importance ? `<span class="tr-importance" data-v="${n.importance}" title="${ICS_IMPORTANCE[n.importance]}">${ICS_IMPORTANCE_MARK[n.importance]}</span>`
    : `<span class="tr-importance undecided" title="Importance not decided">···</span>`;
}
function icsTitleMarksHTML(n){ return `${icsImportanceMarkHTML(n)}${n.backbone ? '<span class="tr-backbone" title="Part of the trunk">▲</span>' : ''}`; }
function icsKidMarksHTML(k){
  const ch = icsChunksOf(k.id).map(c => c.title);
  return `${icsImportanceMarkHTML(k)}${k.backbone ? '<span class="tr-backbone" title="Part of the trunk">▲</span>' : ''}${ch.length ? `<span class="tr-chunktags faint" title="in a chunk">${esc(ch.join(' · '))}</span>` : ''}`;
}
function icsWhyHTML(n){
  const opt = [['core', 'Core'], ['supporting', 'Supporting'], ['peripheral', 'Peripheral'], ['', 'Not decided']];
  return `<section class="tr-why" id="trWhy"><div class="tr-sechead"><h3>Why is this important?</h3></div>
    <div class="tr-imp-pick" role="radiogroup" aria-label="Importance">${opt.map(([v, l]) => { const on = (n.importance || '') === v;
      return `<button type="button" role="radio" aria-checked="${on}" class="tbtn sm${on ? ' on' : ''}" data-act="imp" data-v="${v}">${l}</button>`; }).join('')}</div>
    <label class="tr-chk tr-bonebox"><input type="checkbox" data-act="backbone"${n.backbone ? ' checked' : ''}> Part of the trunk of this root</label>
    ${(n.whyImportant || '').trim() ? `<div class="tr-why-text">${treeRender(n.whyImportant)}</div>` : '<p class="faint tr-why-text">Not yet asked.</p>'}
    <button type="button" class="tbtn sm" data-act="why-edit">${(n.whyImportant || '').trim() ? 'Edit' : 'Say why'}</button>
    ${icsImportanceNeedsReason(n) ? '<p class="tr-hint tr-warn soft" data-show-when="core-without-reason">Marked Core with no reason given. The reason is what lets you chunk it.</p>' : ''}
  </section>`;
}
function icsBindWhy(root, n){
  root.querySelectorAll('[data-act="imp"]').forEach(b => b.onclick = () => { icsSetImportance(n.id, b.dataset.v || null); treePageRoute(root, treeNode(n.id)); });
  const bb = root.querySelector('[data-act="backbone"]'); if(bb) bb.onchange = () => { icsSetBackbone(n.id, bb.checked); treePageRoute(root, treeNode(n.id)); };
  const we = root.querySelector('[data-act="why-edit"]');
  if(we) we.onclick = () => {
    const m = openModal(`<h2 class="serif">Why is “${esc(n.title)}” important?</h2><p class="faint">What would be missing without it? Markdown and [[links]] are fine; the links are how it joins the rest.</p>
      <textarea class="inp" id="twT" rows="6">${esc(n.whyImportant || '')}</textarea><div class="row" style="justify-content:flex-end;gap:8px;margin-top:10px"><button class="btn ghost" id="twNo">Cancel</button><button class="btn primary" id="twOk">Save</button></div>`, 'narrow');
    treeAutocomplete(m.querySelector('#twT')); setTimeout(() => m.querySelector('#twT').focus(), 30);
    m.querySelector('#twNo').onclick = () => m.remove();
    m.querySelector('#twOk').onclick = () => { icsSetWhy(n.id, m.querySelector('#twT').value); m.remove(); treePageRoute(root, treeNode(n.id)); };
  };
}

/* ============================================================
   A-07  The inquiry panel: questions with traffic lights
   ============================================================ */
const ICS_QUESTION_KINDS = {
  what: {label: 'What is it?', short: 'What', stem: t => `What is ${t}, and what is it not?`},
  why: {label: 'Why is it important?', short: 'Why important', stem: t => `Why does ${t} matter? What would be missing without it?`},
  how: {label: 'How does it relate to…?', short: 'How related', stem: t => `How does ${t} relate to `},
  personal: {label: 'Why does it matter to me?', short: 'Personal', stem: t => `Where have I already met ${t}, and what did I get wrong about it then?`},
  challenge: {label: 'Challenge question', short: 'Challenge', stem: () => ''}
};
const ICS_MIN_ANSWER_WORDS = 15;
function icsQuestionTitles(md){ return treeParseLinks(md).filter(l => l.room === 'tree').map(l => l.target); }
/* the pages the question and its answer reach, through the same resolver as page text */
function icsQuestionReach(q){
  const ids = new Set();
  icsQuestionTitles((q.text || '') + '\n' + (q.answer || '')).forEach(t => { const p = treeResolve(t); if(p) ids.add(p.id); });
  return [...ids];
}
function icsQualityScore(q){ return (q.linkedPageIds || []).filter(id => id !== q.pageId).length; }
function icsDeriveStatus(q){
  const a = String(q.answer || '').trim(); if(!a) return 'red';
  return icsQualityScore(q) > 0 && icsWords(a) >= ICS_MIN_ANSWER_WORDS ? 'green' : 'amber';
}
function icsSaveQuestion(input){
  const text = String(input.text || '').trim();
  if(!text) throw new Error('a question needs text');
  if(!ICS_QUESTION_KINDS[input.kind]) throw new Error('bad kind: ' + input.kind);
  if(!Array.isArray(S.treeQuestions)) S.treeQuestions = [];
  const old = input.id ? S.treeQuestions.find(x => x.id === input.id) : null;
  const q = Object.assign({id: uid(), createdAt: treeNow(), answeredAt: null, answerNotBefore: null, selfMade: true, retiredAt: null}, old || {}, {
    pageId: input.pageId || (old && old.pageId), kind: input.kind, text, answer: String(input.answer != null ? input.answer : (old ? old.answer : '') || '')});
  if(input.answerNotBefore !== undefined) q.answerNotBefore = input.answerNotBefore;
  if(input.selfMade !== undefined) q.selfMade = !!input.selfMade;
  q.linkedPageIds = icsQuestionReach(q);
  q.status = icsDeriveStatus(q);
  if(q.status !== 'red' && !q.answeredAt) q.answeredAt = treeNow();
  if(q.status === 'red') q.answeredAt = null;
  if(old) Object.assign(old, q); else S.treeQuestions.push(q);
  const page = treeNode(q.pageId); if(page){ treeRebuildLinks(page); treeDirty(); }
  save();
  return old || q;
}
/* retired, not deleted: the Tree has no delete */
function icsRetireQuestion(id){ const q = (S.treeQuestions || []).find(x => x.id === id); if(!q) return; q.retiredAt = treeNow(); const page = treeNode(q.pageId); if(page){ treeRebuildLinks(page); treeDirty(); } save(); }
function icsQuestionsFor(pageId, withRetired){
  const order = {red: 0, amber: 1, green: 2};
  return (S.treeQuestions || []).filter(q => q.pageId === pageId && (withRetired || !q.retiredAt))
    .sort((a, b) => order[a.status] - order[b.status] || (a.createdAt < b.createdAt ? -1 : 1));
}
function icsTrafficLights(pageId){
  const qs = icsQuestionsFor(pageId);
  return {red: qs.filter(q => q.status === 'red').length, amber: qs.filter(q => q.status === 'amber').length, green: qs.filter(q => q.status === 'green').length, bestQuality: qs.reduce((m, q) => Math.max(m, icsQualityScore(q)), 0)};
}
/* templates, not AI: the user edits them into real questions */
function icsScaffoldQuestions(title, related){
  return [
    {kind: 'what', text: ICS_QUESTION_KINDS.what.stem(title)},
    {kind: 'why', text: ICS_QUESTION_KINDS.why.stem(title)},
    {kind: 'how', text: `How does ${title} relate to ${related ? '[[' + related + ']]' : 'something else I already hold'}, and where do they differ?`},
    {kind: 'personal', text: ICS_QUESTION_KINDS.personal.stem(title)}];
}
/* what the question text and the answer say, read for the page's links */
function icsLinkSource(n){
  const qs = (S.treeQuestions || []).filter(q => q.pageId === n.id && !q.retiredAt).map(q => (q.text || '') + '\n' + (q.answer || '')).join('\n');
  return [n.body, n.openQuestion, n.whyImportant, n.collected, n.processed, qs].map(x => x || '').join('\n');
}
function icsInquiryHTML(n){
  const qs = icsQuestionsFor(n.id), L = icsTrafficLights(n.id);
  return `<section class="tr-question tr-inquiry"><span class="tr-lbl">What would change my mind?</span>${(n.openQuestion || '').trim() ? `<div>${treeRender(n.openQuestion)}</div>` : '<p class="faint">Not yet asked.</p>'}
    <div class="tr-qhead"><span class="tr-lbl">Questions</span><span class="tr-lights" aria-label="${L.red} red, ${L.amber} amber, ${L.green} green"><i class="light red">${L.red}</i><i class="light amber">${L.amber}</i><i class="light green">${L.green}</i></span></div>
    ${qs.length ? `<ul class="tr-questions">${qs.map(q => `<li data-status="${q.status}" data-q="${q.id}"><span class="light ${q.status}" title="${{red: 'Unanswered', amber: 'Answered, not yet connected', green: 'Answered and integrated'}[q.status]}"></span>
      <span class="tr-qkind">${ICS_QUESTION_KINDS[q.kind].short}</span><div class="tr-qtext">${treeRender(q.text)}</div>
      <p class="faint tr-quality" title="Distinct pages this question reaches">reaches ${icsQualityScore(q)} page${icsQualityScore(q) === 1 ? '' : 's'}${q.answerNotBefore && q.answerNotBefore > treeToday() ? ` · answer from ${esc(q.answerNotBefore)}` : ''}</p>
      ${q.answer ? `<details><summary>Answer</summary><div class="prose">${treeRender(q.answer)}</div></details>` : ''}
      <span class="tr-qbtns"><button type="button" class="tbtn sm" data-act="q-answer" data-q="${q.id}">${q.answer ? 'Revise answer' : 'Answer'}</button><button type="button" class="tbtn sm" data-act="q-edit" data-q="${q.id}">Edit</button><button type="button" class="tbtn sm" data-act="q-drop" data-q="${q.id}">Let it go</button></span></li>`).join('')}</ul>` : '<p class="faint">No questions yet.</p>'}
    <div class="tr-q-add">${['what', 'why', 'how', 'personal'].map(k => `<button type="button" class="tbtn sm" data-act="q-new" data-kind="${k}">+ ${ICS_QUESTION_KINDS[k].short}</button>`).join('')}<button type="button" class="tbtn sm" data-act="q-scaffold">Suggest four questions</button></div>
    <p class="faint tr-hint">Green means answered <em>and</em> connected to another page. Don’t ask questions you already know the answer to.</p></section>`;
}
function icsQuestionDialog(n, o, after){
  o = o || {};
  const m = openModal(`<h2 class="serif">${o.answerOnly ? 'Answer' : o.id ? 'Edit the question' : 'A question about ' + esc(n.title)}</h2>
    ${o.answerOnly ? `<div class="tr-was">${treeRender(o.text)}</div>` : `<label class="tr-f"><span>${esc(ICS_QUESTION_KINDS[o.kind].label)}</span><textarea class="inp" id="tqT" rows="3">${esc(o.text || '')}</textarea></label>`}
    <label class="tr-f"><span>Answer <small>from memory first; a [[link]] to another page is what connects it</small></span><textarea class="inp" id="tqA" rows="5">${esc(o.answer || '')}</textarea></label>
    <p class="faint tr-hint" id="tqS"></p><p class="tr-err" id="tqErr"></p>
    <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" id="tqNo">Cancel</button><button class="btn primary" id="tqOk">Save</button></div>`, 'narrow');
  const $m = id => m.querySelector(id), T = $m('#tqT'), A = $m('#tqA');
  if(T) treeAutocomplete(T); treeAutocomplete(A);
  const live = () => { const q = {pageId: n.id, text: T ? T.value : o.text, answer: A.value}; q.linkedPageIds = icsQuestionReach(q);
    $m('#tqS').textContent = icsDeriveStatus(q) === 'red' ? 'Unanswered — it stays red.' : icsDeriveStatus(q) === 'green' ? `Green: answered and reaching ${icsQualityScore(q)} other page(s).` : 'Amber: answered, but it reaches no other page, or it is short.'; };
  A.oninput = live; if(T) T.oninput = live; live(); setTimeout(() => (o.answerOnly ? A : T).focus(), 30);
  $m('#tqNo').onclick = () => m.remove();
  $m('#tqOk').onclick = () => { try { icsSaveQuestion({id: o.id, pageId: n.id, kind: o.kind, text: T ? T.value : o.text, answer: A.value}); m.remove(); after && after(); } catch(e){ $m('#tqErr').textContent = e.message; } };
}
function icsBindInquiry(root, n){
  const again = () => treePageRoute(root, treeNode(n.id));
  root.querySelectorAll('[data-act="q-new"]').forEach(b => b.onclick = () => icsQuestionDialog(n, {kind: b.dataset.kind, text: ICS_QUESTION_KINDS[b.dataset.kind].stem(n.title)}, again));
  root.querySelectorAll('[data-act="q-answer"],[data-act="q-edit"]').forEach(b => b.onclick = () => { const q = S.treeQuestions.find(x => x.id === b.dataset.q); if(q) icsQuestionDialog(n, Object.assign({}, q, {answerOnly: b.dataset.act === 'q-answer'}), again); });
  root.querySelectorAll('[data-act="q-drop"]').forEach(b => b.onclick = () => confirmDlg('Let this question go? It is retired, not deleted.', () => { icsRetireQuestion(b.dataset.q); again(); }));
  const sc = root.querySelector('[data-act="q-scaffold"]');
  if(sc) sc.onclick = () => {
    const sib = treeNode(n.parentId), rel = (icsGraftsOf(n.id).map(g => treeNode(g.fromId === n.id ? g.toId : g.fromId)).filter(Boolean)[0] || sib || {}).title;
    const go = () => { icsScaffoldQuestions(n.title, rel).forEach(q => icsSaveQuestion({pageId: n.id, kind: q.kind, text: q.text, selfMade: false})); again(); };
    if(icsQuestionsFor(n.id).length) confirmDlg('This page already has questions. Add the four suggestions as well? They arrive red and editable.', go); else go();
  };
}

/* ============================================================
   A-08  The split page: Collected and Processed
   ============================================================ */
const ICS_WORD_BUDGET_PROCESSED = 150;
const ICS_PROCESSING_PROMPTS = ['Why is this important?', 'How can I use this?', 'How can I apply it?'];
function icsIsSplit(n){ return n.collected != null || n.processed != null; }
function icsCountWords(md){ return icsWords(String(md || '').replace(/\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g, (_, a, b) => b || a)); }
/* explicit, user-initiated; what is already written is raw until processed */
function icsEnableSplit(pageId){
  const n = treeNode(pageId); if(!n || icsIsSplit(n)) return n;
  const r = treeSavePage({id: pageId, collected: n.body || '', processed: '', body: ''}); return r.node;
}
function icsDisableSplit(pageId){
  const n = treeNode(pageId); if(!n || !icsIsSplit(n)) return n;
  const parts = [n.processed, n.collected].map(s => String(s || '').trim()).filter(Boolean);
  const r = treeSavePage({id: pageId, body: parts.join('\n\n---\n\n'), collected: null, processed: null}); return r.node;
}
function icsBodySignals(n){
  const out = []; if(!icsIsSplit(n)) return out;
  const pw = icsCountWords(n.processed), cw = icsCountWords(n.collected);
  if(cw > 0 && pw === 0) out.push({level: 'prompt', text: 'Collected but not processed. Say it in your own words, as briefly as you can.'});
  if(pw > ICS_WORD_BUDGET_PROCESSED) out.push({level: 'signal', text: `${pw} words processed, against a budget of ${ICS_WORD_BUDGET_PROCESSED}. Fewer words, more links.`});
  if(pw > 0 && cw > 0 && pw > cw) out.push({level: 'signal', text: 'Processed is longer than collected. Processing compresses; it does not paraphrase.'});
  return out;
}
function icsBodyHTML(n){
  const bar = `<p class="tr-splitbar"><button type="button" class="tbtn sm" data-act="split-toggle">${icsIsSplit(n) ? 'Put Collected and Processed back together' : 'Split this page into Collected and Processed'}</button></p>`;
  if(!icsIsSplit(n)) return `<article class="tr-body prose">${(n.body || '').trim() ? treeRender(n.body) : '<p class="faint">Nothing written here yet.</p>'}</article>${bar}`;
  const pw = icsCountWords(n.processed), sig = icsBodySignals(n);
  return `<section class="tr-body tr-split"><div class="tr-body-processed"><h3>Processed <span class="faint">your words</span></h3>
      <div class="prose">${(n.processed || '').trim() ? treeRender(n.processed) : '<p class="faint">Nothing processed yet.</p>'}</div>
      <p class="faint tr-wordcount">${pw} / ${ICS_WORD_BUDGET_PROCESSED} words</p>
      <ul class="tr-prompts faint">${ICS_PROCESSING_PROMPTS.map(x => `<li>${x}</li>`).join('')}</ul>
      ${sig.map(x => `<p class="tr-hint tr-warn soft">${esc(x.text)}</p>`).join('')}</div>
    <div class="tr-body-collected"><h3>Collected <span class="faint">raw, from the source</span></h3>
      <div class="prose">${(n.collected || '').trim() ? treeRender(n.collected) : '<p class="faint">Nothing collected.</p>'}</div>
      <p class="faint tr-hint">Keywords and quotes. Don’t write prose here.</p></div></section>${bar}`;
}
function icsEditTextHTML(n){
  const hint = '<small>markdown; [[Page]], [[Page|shown as]], [[library:Title]], [[journal:2025-03-01]], [[writing:Title]]</small>';
  if(!icsIsSplit(n)) return `<label class="tr-f"><span>Text ${hint}</span><textarea class="inp tr-ta" id="teBody" rows="14">${esc(n.body || '')}</textarea></label>`;
  return `<label class="tr-f"><span>Processed <small>your own words, under ${ICS_WORD_BUDGET_PROCESSED}; ${'[[links]]'} are how it joins the rest</small></span><textarea class="inp tr-ta" id="teProc" rows="8">${esc(n.processed || '')}</textarea></label>
    <label class="tr-f"><span>Collected ${hint}</span><textarea class="inp tr-ta" id="teCol" rows="8">${esc(n.collected || '')}</textarea></label>`;
}
function icsEditDraft(root, n){
  const $e = id => root.querySelector(id);
  return icsIsSplit(n) ? {collected: $e('#teCol').value, processed: $e('#teProc').value} : {body: $e('#teBody').value};
}
function icsBindEditText(root, n){ ['#teBody', '#teCol', '#teProc'].forEach(id => { const el = root.querySelector(id); if(el) treeAutocomplete(el); }); }
function icsBindSplit(root, n){
  const b = root.querySelector('[data-act="split-toggle"]'); if(!b) return;
  b.onclick = () => {
    if(icsIsSplit(n)) confirmDlg('Put the two sides back together, Processed first, with a rule between? The split version is kept as an earlier version.', () => { icsDisableSplit(n.id); treePageRoute(root, treeNode(n.id)); });
    else confirmDlg('Everything written here now moves to Collected, and Processed starts empty. The earlier version is kept.', () => { icsEnableSplit(n.id); toast('Split. The earlier version is kept.'); treePageRoute(root, treeNode(n.id)); });
  };
}

/* ============================================================
   N-02  Chunks: a name, a reason, two or more pages under one root
   ============================================================ */
const ICS_CHUNK_MIN = 2, ICS_CHUNK_MAX = 4;
function icsValidateChunk(o){
  const t = String(o.title || '').trim(), r = String(o.reason || '').trim(), ids = [...new Set(o.memberIds || [])];
  if(!t) return {error: 'a chunk needs a name'};
  if(!r) return {error: 'a chunk needs a reason: why do these belong together?'};
  if(ids.length < ICS_CHUNK_MIN) return {error: 'a chunk needs at least two members'};
  const nodes = ids.map(treeNode); if(nodes.some(x => !x)) return {error: 'every member must be a page in the tree'};
  const roots = new Set(nodes.map(x => icsRootOf(x).id));
  if(roots.size > 1) return {error: 'these pages are under different roots. Use a graft to relate them across questions.'};
  return {title: t, reason: r, memberIds: ids, rootId: [...roots][0]};
}
function icsCreateChunk(o){
  const v = icsValidateChunk(o); if(v.error) throw new Error(v.error);
  if(!Array.isArray(S.treeChunks)) S.treeChunks = [];
  const c = {id: uid(), title: v.title, reason: v.reason, memberIds: v.memberIds, rootId: v.rootId, createdAt: treeNow(), retiredAt: null};
  S.treeChunks.push(c); save(); return c;
}
function icsUpdateChunk(id, patch){
  const c = (S.treeChunks || []).find(x => x.id === id); if(!c) throw new Error('no such chunk');
  const v = icsValidateChunk(Object.assign({}, c, patch)); if(v.error) throw new Error(v.error);
  Object.assign(c, {title: v.title, reason: v.reason, memberIds: v.memberIds, rootId: v.rootId}); save(); return c;
}
function icsRetireChunk(id){ const c = (S.treeChunks || []).find(x => x.id === id); if(c){ c.retiredAt = treeNow(); save(); } }
function icsLiveChunks(){ return (S.treeChunks || []).filter(c => !c.retiredAt); }
function icsChunksOf(pageId){ return icsLiveChunks().filter(c => (c.memberIds || []).includes(pageId)); }
function icsChunksUnderRoot(rootId){ return icsLiveChunks().filter(c => c.rootId === rootId); }
function icsChunkSignals(c){
  const out = [];
  if(c.memberIds.length > ICS_CHUNK_MAX) out.push({level: 'signal', text: `${c.memberIds.length} members. Two to four is the guideline — consider subgroups.`});
  if(String(c.title).trim().split(/\s+/).length > 4) out.push({level: 'signal', text: 'A long label usually means the group is not yet clear. Refine it to simple, intuitive words.'});
  return out;
}
function icsSubgroupsOf(c){
  return icsChunksUnderRoot(c.rootId).filter(x => x.id !== c.id && x.memberIds.length < c.memberIds.length && x.memberIds.every(id => c.memberIds.includes(id)));
}
/* membership is never parentage: nothing here is read by the breadcrumb, the outline or a move */
function icsAssertChunkIsNotAParent(pageId){
  const n = treeNode(pageId); if(!n) return true;
  if(n.kind !== 'root' && !n.parentId) throw new Error('chunk membership must not supply a parent');
  return true;
}
function icsChunksHTML(n, kids){
  const kidIds = new Set(kids.map(k => k.id));
  const mine = icsChunksUnderRoot(icsRootOf(n).id).filter(c => c.memberIds.some(id => kidIds.has(id)));
  const sits = icsChunksOf(n.id);
  if(!mine.length && kids.length < 2 && !sits.length) return '';
  return `<section class="tr-sec tr-chunks"><div class="tr-sechead"><h2>Chunks</h2><span class="faint">how the pages beneath it group, and why</span><span class="tr-grow"></span>${kids.length >= 2 ? '<button type="button" class="tbtn" data-act="chunk-start">Group pages…</button>' : ''}</div>
    ${mine.map(c => `<article class="tr-chunk"><h3>${esc(c.title)}</h3><p class="tr-chunk-reason">${esc(c.reason)}</p>
      <ul>${c.memberIds.map(id => { const m = treeNode(id); return m ? `<li>${treeKindMark(m)}<a href="${treeUrl(m)}">${esc(m.title)}</a></li>` : ''; }).join('')}</ul>
      ${icsChunkSignals(c).map(x => `<p class="tr-hint tr-warn soft">${esc(x.text)}</p>`).join('')}
      <button type="button" class="tbtn sm" data-act="chunk-edit" data-chunk="${c.id}">Edit</button></article>`).join('')}
    ${sits.length ? `<p class="faint tr-sits">This page sits in: ${sits.map(c => `<span title="${esc(c.reason)}">${esc(c.title)}</span>`).join(' · ')}</p>` : ''}
  </section>`;
}
function icsChunkDialog(n, chunk, after){
  const pool = chunk ? S.treeNodes.filter(x => icsRootOf(x).id === chunk.rootId && x.id !== icsRootOf(x).id && x.status !== 'pruned') : [].concat(treeChildren(n.id), icsDescendants(n.id).filter(d => d.parentId !== n.id));
  const picked = new Set(chunk ? chunk.memberIds : []);
  const m = openModal(`<h2 class="serif">${chunk ? 'Edit the chunk' : 'Group these'}</h2>
    <p class="faint">A chunk is a claim, not a label: the reason is what makes it one. Two to four pages is the guideline. A page can sit in several chunks; none of them becomes its parent.</p>
    <label class="tr-f"><span>Name <small>a few simple words</small></span><input class="inp" id="tcT" value="${esc(chunk ? chunk.title : '')}" autocomplete="off"></label>
    <label class="tr-f"><span>Why do these belong together? <small>required</small></span><textarea class="inp" id="tcR" rows="3" placeholder="The reason is the chunk. Without it this is just a list.">${esc(chunk ? chunk.reason : '')}</textarea></label>
    <div class="tr-chunkpick" id="tcL">${pool.map(x => `<label class="tr-chk"><input type="checkbox" value="${x.id}"${picked.has(x.id) ? ' checked' : ''}> ${treeKindMark(x)} ${esc(x.title)}</label>`).join('') || '<p class="faint">Nothing to group yet.</p>'}</div>
    <p class="faint" id="tcS"></p><p class="tr-err" id="tcErr"></p>
    <div class="row" style="justify-content:space-between;gap:8px">${chunk ? '<button class="btn ghost" id="tcRetire">Retire this chunk</button>' : '<span></span>'}<span class="row" style="gap:8px"><button class="btn ghost" id="tcNo">Cancel</button><button class="btn primary" id="tcOk">${chunk ? 'Save' : 'Make the chunk'}</button></span></div>`, 'narrow');
  const $m = id => m.querySelector(id), ids = () => [...m.querySelectorAll('#tcL input:checked')].map(i => i.value);
  const sig = () => { $m('#tcS').textContent = icsChunkSignals({title: $m('#tcT').value, memberIds: ids()}).map(x => x.text).join(' '); };
  m.querySelectorAll('#tcL input').forEach(i => i.onchange = sig); $m('#tcT').oninput = sig; sig();
  $m('#tcNo').onclick = () => m.remove();
  const r = $m('#tcRetire'); if(r) r.onclick = () => confirmDlg('Retire this chunk? It is hidden, not deleted, and its pages are untouched.', () => { icsRetireChunk(chunk.id); m.remove(); after && after(); });
  $m('#tcOk').onclick = () => { try { const o = {title: $m('#tcT').value, reason: $m('#tcR').value, memberIds: ids()}; if(chunk) icsUpdateChunk(chunk.id, o); else icsCreateChunk(o); m.remove(); after && after(); } catch(e){ $m('#tcErr').textContent = e.message; } };
  setTimeout(() => $m('#tcT').focus(), 30);
}
function icsBindChunks(root, n){
  const again = () => treePageRoute(root, treeNode(n.id));
  const st = root.querySelector('[data-act="chunk-start"]'); if(st) st.onclick = () => icsChunkDialog(n, null, again);
  root.querySelectorAll('[data-act="chunk-edit"]').forEach(b => b.onclick = () => icsChunkDialog(n, S.treeChunks.find(c => c.id === b.dataset.chunk), again));
}

/* ---------- the rules this layer adds to the gap registry ---------- */
icsRegisterGapRule({type: 'chunk-no-reason', label: 'A chunk with no reason',
  hint: 'A group with no reason is only a list. Say why these belong together.',
  test(n){ return icsChunksOf(n.id).some(c => !String(c.reason || '').trim()); }});

/* ---------- the page binds all of it ---------- */
function icsBindPageMore(root, n){
  icsBindWhy(root, n); icsBindInquiry(root, n); icsBindSplit(root, n); icsBindChunks(root, n);
}
