/* ============================================================
   INNER DEMONS — beliefs, fears and resistance (#/purpose/demons)

   Three things the course is specific about, and the house had none of:

   Limiting beliefs: disempowering negative generalisations about reality.
   The rule of thumb is to look where results are bad and ask what you would
   have to believe to produce them. They are challenged, not scored.

   Fears: two kinds — about safety, and about the cost and limitation of
   something grand. The second is a compass bearing: a purpose is supposed to
   scare you, and a fear pointing that way is a clue.

   Resistance: unwillingness to do great work. It never presents as
   resistance; it presents as a legitimate competing obligation. The response
   is to observe it, not to create resistance to the resistance.

   No tab here shows a total, a trend or a progress bar: challenging a belief
   surfaces its neighbours, and a shrinking count would be a false reading.
   Nothing in this room scolds. Beliefs and fears are never sent anywhere.
   ============================================================ */

purposeTabAdd({id: 'demons', label: 'Inner demons', order: 30, render: (body) => demonsRender(body)});

const BELIEF_PROVENANCE = [['repetition', 'repetition'], ['childhood', 'childhood'], ['society', 'society'], ['trauma', 'a traumatic event'], ['unknown', 'not sure']];
const RESISTANCE_FORMS = ['a legitimate-looking other task', 'research instead of making', 'a tool or setup I needed first', 'a person or obligation',
  'entertainment', 'planning instead of doing', 'tiredness', 'waiting for the right conditions'];
const beliefsAll = kind => lifeArray('beliefs').filter(b => !kind || b.kind === kind);
function beliefNew(o){
  const b = {id: uid(), kind: o.kind || 'belief', text: String(o.text || '').trim(), area: o.area || '', provenance: o.provenance || 'unknown',
    strength: o.strength >= 1 && o.strength <= 5 ? +o.strength : 3, fearType: o.fearType || null, pointsTo: o.pointsTo || null,
    links: {valueIds: [], skillIds: [], goalIds: [], strengthIds: [], stageIds: []}, treePageId: null, resurfaceAt: null, resurfaceRung: 0,
    challenges: [], at: new Date().toISOString(), updatedAt: new Date().toISOString()};
  if(!b.text) return null;
  lifeArray('beliefs').push(b); saveNow();
  return b;
}
const beliefLast = b => (b.challenges || []).length ? b.challenges[b.challenges.length - 1] : null;
/* strongest first, then the longest since a challenge: the strongest and the stalest rise */
function beliefsSorted(){
  const age = b => { const l = beliefLast(b); return l ? l.at : ''; };
  return beliefsAll('belief').slice().sort((a, b) => (b.strength - a.strength) || age(a).localeCompare(age(b)));
}
const beliefAgo = b => { const l = beliefLast(b); if(!l) return 'never challenged'; const d = daysBetween(l.at.slice(0, 10), today()); return d <= 0 ? 'challenged today' : `challenged ${d} day${d === 1 ? '' : 's'} ago`; };

/* ---------- the areas where results are bad: read from what the house already knows ---------- */
function beliefSeedAreas(){
  const T = today(), out = [];
  (S.valueOrder || []).forEach(id => { const v = byId(S.values, id); if(!v || !(S.valueSnapshots || []).length) return;
    const c = valueCurrent(id); if(c < 40) out.push({label: v.name, kind: 'a value', reading: `congruence ${congruenceCourse(c)} of 10`}); });
  (S.skills || []).forEach(sk => { if((typeof skillHorizon === 'function' ? skillHorizon(sk) : 'active') === 'someday') return;
    const last = typeof skillLastPracticed === 'function' ? skillLastPracticed(sk) : null;
    const gap = last ? daysBetween(last, T) : null;
    if(gap == null ? false : gap > 90) out.push({label: sk.name, kind: 'a skill', reading: `${gap} days without practice`}); });
  (S.habits || []).forEach(h => { if(h.archived || h.negative) return; const r = habRate(h, 28);
    if(r != null && r < 50) out.push({label: h.name, kind: 'a habit', reading: `kept ${r}% over four weeks`}); });
  try { planLists().forEach(l => (l.milestones || []).forEach(m => { if(m.date && m.date < T && !m.done && !['prepared', 'on-track'].includes(m.status))
    out.push({label: m.name + ' (' + l.name + ')', kind: 'a goal', reading: `its date was ${fmtDate(m.date, 'short')}`}); })); } catch(e){}
  (typeof perfActive === 'function' ? perfActive() : []).forEach(g => { if(g.endDate && g.endDate < T) out.push({label: g.title, kind: 'a goal', reading: `its end date was ${fmtDate(g.endDate, 'short')}`}); });
  return out;
}

/* ---------- render ---------- */
function demonsRender(body){
  const tab = ['beliefs', 'fears', 'resistance', 'origins'].includes(S._demTab) ? S._demTab : 'beliefs';
  body.innerHTML = `<div class="dm-wrap">
    <div class="dm-sub" role="tablist">${[['beliefs', 'Limiting beliefs'], ['fears', 'Fears'], ['resistance', 'Resistance'], ['origins', 'Where it came from']].map(([k, n]) =>
      `<button role="tab" class="${k === tab ? 'on' : ''}" data-dmtab="${k}">${n}</button>`).join('')}</div>
    <div id="dmBody"></div></div>`;
  body.querySelectorAll('[data-dmtab]').forEach(b => b.onclick = () => { S._demTab = b.dataset.dmtab; rerender(); });
  const host = body.querySelector('#dmBody');
  (tab === 'beliefs' ? demonsBeliefs : tab === 'fears' ? demonsFears : tab === 'origins' ? demonsOrigins : demonsResistance)(host);
}
const dmDots = n => `<span class="dm-dots" title="how strongly it grips: ${n} of 5">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;

/* ---------- beliefs ---------- */
function demonsBeliefs(host){
  const xs = beliefsSorted();
  host.innerHTML = `<p class="faint dm-lede">Limiting beliefs are disempowering generalisations about reality — dream killers that can stop you discovering a purpose at all. They are created by repetition, by childhood impressionability, by society, and by traumatic events, which imprint deeply because the mind remembers anything emotional very well. The rule of thumb: <b>wherever your results are bad, there is a belief</b>. It is a rule of thumb, not a diagnosis.</p>
    <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn primary" id="dmExtract">Find one — where are results bad?</button>
      <button class="btn ghost" id="dmWrite">write one I already know</button></div>
    ${xs.length ? `<div class="dm-list">${xs.map(b => `<article class="dm-row" data-bid="${b.id}">
        <div class="dm-main"><p class="serif dm-text">${esc(b.text)}</p>
          <div class="mono faint">${b.area ? esc(b.area) + ' · ' : ''}${esc((BELIEF_PROVENANCE.find(p => p[0] === b.provenance) || [, 'not sure'])[1])} · ${esc(beliefAgo(b))}${b.treePageId ? ' · <a href="#/tree">in the Knowledge Tree</a>' : b.resurfaceAt ? ' · checked again ' + esc(fmtDate(b.resurfaceAt, 'short')) : ''}</div></div>
        <div class="dm-side">${dmDots(b.strength)}
          <button class="btn sm" data-dmchal="${b.id}">Challenge</button>
          <button class="btn sm ghost" data-dmwheel="${b.id}" title="launch a focus wheel on this belief">focus wheel</button>
          ${typeof zoneThinkBtn === 'function' ? zoneThinkBtn('belief', b.id, 'text') : ''}
          <button class="btn sm ghost" data-dmtree="${b.id}" ${b.treePageId ? 'disabled' : ''}>to the Tree</button>
          <button class="del-x inline" data-dmdel="${b.id}" title="remove this one">×</button></div>
      </article>`).join('')}</div>` : '<div class="empty">Nothing here yet. This is a list of things being worked on, not a count to bring down.</div>'}`;
  const q = s => host.querySelector(s);
  q('#dmExtract').onclick = () => beliefWizard();
  q('#dmWrite').onclick = () => beliefWriteDirect('belief');
  host.querySelectorAll('[data-dmchal]').forEach(b => b.onclick = () => beliefChallenge(b.dataset.dmchal));
  host.querySelectorAll('[data-dmwheel]').forEach(b => b.onclick = () => { const x = byId(beliefsAll(), b.dataset.dmwheel); if(x && typeof openFocusWheel === 'function') openFocusWheel(); });
  host.querySelectorAll('[data-dmtree]').forEach(b => b.onclick = () => beliefPromote(b.dataset.dmtree));
  host.querySelectorAll('[data-dmdel]').forEach(b => b.onclick = () => { const x = byId(beliefsAll(), b.dataset.dmdel); if(!x) return;
    requestDelete({label: x.text.slice(0, 40), node: b.closest('.dm-row'), remove: () => spliceOut(S.beliefs, y => y.id === x.id), after: () => rerender()}); });
}
function beliefWriteDirect(kind, prefill){
  const m = openModal(`<h2>${kind === 'fear' ? 'A fear' : 'A belief'}</h2>
    <div class="field"><label>${kind === 'fear' ? 'The fear, in your own words' : 'The belief, as a flat sentence — “I believe…” or “I cannot…”'}</label><textarea class="ta" id="bwT" rows="2" autofocus>${esc(prefill || '')}</textarea></div>
    <div class="field"><label>The area of life it damages</label><input class="inp" id="bwA"></div>
    ${kind === 'belief' ? `<div class="field"><label>Where did it come from?</label><select class="sel" id="bwP">${BELIEF_PROVENANCE.map(([k, n]) => `<option value="${k}" ${k === 'unknown' ? 'selected' : ''}>${n}</option>`).join('')}</select></div>` : ''}
    <div class="field"><label>How strongly does it grip, 1–5</label><div class="sc-rate" id="bwS">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-n="${n}" class="${n <= 3 ? 'on' : ''}">●</button>`).join('')}</div></div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="bwGo">Add</button></div>`, 'narrow');
  let s = 3; m.querySelectorAll('#bwS button').forEach(b => b.onclick = () => { s = +b.dataset.n; m.querySelectorAll('#bwS button').forEach(x => x.classList.toggle('on', +x.dataset.n <= s)); });
  m.querySelector('#bwGo').onclick = () => { const b = beliefNew({kind, text: m.querySelector('#bwT').value, area: m.querySelector('#bwA').value.trim(), provenance: kind === 'belief' ? m.querySelector('#bwP').value : 'unknown', strength: s});
    if(!b){ toast('Write the sentence first.'); return; } m.remove(); sound('click'); rerender(); };
}
/* the course's actual method: three screens. Areas of bad results, offered from
   live readings and none preselected; what you would have to believe; and the
   flat sentence. */
function beliefWizard(){
  const seeds = beliefSeedAreas();
  const picked = new Set(); let custom = '';
  const answers = {}, sentences = {}, strengths = {}, provs = {};
  const areas = () => [...picked].map(i => seeds[i].label).concat(custom.trim() ? [custom.trim()] : []);
  ppFlow('Finding a belief', [
    {title: 'Where are you getting bad results?', hint: 'This is a rule of thumb, not a diagnosis — bad results are where limiting beliefs live. These come from your own readings; none is chosen for you.',
     body: () => `${seeds.length ? `<div class="dm-seeds">${seeds.map((s, i) => `<label class="dm-seed"><input type="checkbox" data-seed="${i}"> <span><b>${esc(s.label)}</b> <span class="mono faint">${esc(s.kind)} · ${esc(s.reading)}</span></span></label>`).join('')}</div>` : '<p class="faint">Nothing in your readings stands out. Name an area yourself.</p>'}
       <div class="field"><label>Or name an area yourself</label><input class="inp" id="bwCustom" placeholder="e.g. money, finishing things, being seen"></div>`,
     bind: b => { b.querySelectorAll('[data-seed]').forEach(c => c.onchange = () => { c.checked ? picked.add(+c.dataset.seed) : picked.delete(+c.dataset.seed); }); },
     next: b => { custom = b.querySelector('#bwCustom').value; if(!areas().length){ toast('Pick or name at least one area.'); return false; } }},
    {title: 'What would you have to believe?', hint: 'For each area: what would you have to believe about reality to produce this result?',
     body: () => areas().map((a, i) => `<div class="field"><label>${esc(a)}</label><textarea class="ta" rows="2" data-bwb="${i}" placeholder="To get this, I would have to believe…">${esc(answers[a] || '')}</textarea></div>`).join(''),
     next: b => { b.querySelectorAll('[data-bwb]').forEach(t => { answers[areas()[+t.dataset.bwb]] = t.value; }); }},
    {title: 'Write each as a flat sentence.', hint: 'Beginning “I believe” or “I cannot”. How strongly it grips, and where it may have come from, if you can tell.',
     body: () => areas().map((a, i) => `<div class="dm-wz"><div class="mono faint">${esc(a)}</div>
        <textarea class="ta" rows="2" data-bws="${i}">${esc(sentences[a] || (answers[a] ? 'I believe ' + answers[a].replace(/^i (would )?(have to )?believe\s*/i, '') : 'I believe '))}</textarea>
        <div class="row" style="gap:10px;margin-top:4px"><label class="mono faint">grip <select class="sel" data-bwg="${i}">${[1, 2, 3, 4, 5].map(n => `<option ${n === (strengths[a] || 3) ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <label class="mono faint">from <select class="sel" data-bwp="${i}">${BELIEF_PROVENANCE.map(([k, n]) => `<option value="${k}" ${k === (provs[a] || 'unknown') ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div></div>`).join(''),
     next: b => { b.querySelectorAll('[data-bws]').forEach(t => { const a = areas()[+t.dataset.bws]; sentences[a] = t.value; strengths[a] = +b.querySelector(`[data-bwg="${t.dataset.bws}"]`).value; provs[a] = b.querySelector(`[data-bwp="${t.dataset.bws}"]`).value; }); }},
  ], () => {
    let n = 0; areas().forEach(a => { const t = (sentences[a] || '').trim(); if(t.length > 'I believe '.length + 1 && beliefNew({text: t, area: a, strength: strengths[a], provenance: provs[a]})) n++; });
    if(n){ sound('success'); toast(`${n} belief${n === 1 ? '' : 's'} added. Challenge them when you are ready — there is no hurry.`); }
    rerender();
  }, {finish: 'Add them'});
}

/* ---------- the challenge protocol: five moves, each run kept ---------- */
function beliefChallenge(id){
  const b = byId(beliefsAll(), id); if(!b) return;
  const d = {evidenceFor: '', evidenceAgainst: '', whoToldMe: '', didTheyTurnOutWell: '', areTheyAnExpert: '', reframe: '', strengthAfter: 0, affirm: false, resurface: true};
  const lines = t => String(t || '').split('\n').map(x => x.trim()).filter(Boolean);
  ppFlow('Challenging a belief', [
    {title: 'What makes it look true?', hint: `“${esc(b.text)}”<br>The selective mind cherry-picks the negative and leaves out the positive, so this list will come easily. That is expected.`,
     body: () => `<textarea class="ta" rows="6" id="chF" placeholder="One per line">${esc(d.evidenceFor)}</textarea>`, next: x => { d.evidenceFor = x.querySelector('#chF').value; }},
    {title: 'What makes it look false?', hint: 'At least one is asked for, not enforced. The asymmetry between the two lists is itself the finding.',
     body: () => `<textarea class="ta" rows="6" id="chA" placeholder="One per line">${esc(d.evidenceAgainst)}</textarea>`, next: x => { d.evidenceAgainst = x.querySelector('#chA').value; }},
    {title: 'Where did it come from?', hint: 'Three separate questions. The second is the one the course leans on hardest.',
     body: () => `<div class="field"><label>Who told you this?</label><input class="inp" id="chW" value="${esc(d.whoToldMe)}"></div>
       <div class="field"><label>Did their life turn out well?</label><input class="inp" id="chT" value="${esc(d.didTheyTurnOutWell)}"></div>
       <div class="field"><label>Are they an expert in this?</label><input class="inp" id="chE" value="${esc(d.areTheyAnExpert)}"></div>`,
     next: x => { d.whoToldMe = x.querySelector('#chW').value; d.didTheyTurnOutWell = x.querySelector('#chT').value; d.areTheyAnExpert = x.querySelector('#chE').value; }},
    {title: 'A more positive form — still honest.', hint: 'Be careful that the reframe is not merely a denial. The course separates focusing on what you want to create from denying reality.',
     body: () => `<textarea class="ta" rows="3" id="chR" placeholder="Written as something you could say and half-believe">${esc(d.reframe)}</textarea>`, next: x => { d.reframe = x.querySelector('#chR').value; }},
    {title: 'Install it.', hint: 'A belief challenged once usually loosens rather than leaves, which is why it can come back for a check. So: how strongly does it grip now?',
     body: () => `<div class="field"><label>How strongly does it still grip, 1–5</label><div class="sc-rate" id="chS">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-n="${n}" class="${n <= d.strengthAfter ? 'on' : ''}">●</button>`).join('')}</div>
         <div class="mono faint">Leave it unanswered if you would rather not say; the grip then stays as it was and the row records that it was not asked again.</div></div>
       <label class="row" style="gap:8px;align-items:center"><input type="checkbox" id="chAff" ${d.affirm ? 'checked' : ''} ${d.reframe.trim() ? '' : 'disabled'}> <span>make the reframe an affirmation line</span></label>
       <label class="row" style="gap:8px;align-items:center"><input type="checkbox" id="chRes" ${d.resurface ? 'checked' : ''}> <span>ask me again, on the same ladder as the Knowledge Tree (3, 14, 61, 183, 365 days)</span></label>`,
     bind: x => x.querySelectorAll('#chS button').forEach(bt => bt.onclick = () => { d.strengthAfter = +bt.dataset.n; x.querySelectorAll('#chS button').forEach(y => y.classList.toggle('on', +y.dataset.n <= d.strengthAfter)); }),
     next: x => { d.affirm = x.querySelector('#chAff').checked; d.resurface = x.querySelector('#chRes').checked; }},
  ], () => {
    const row = {id: uid(), at: new Date().toISOString(), evidenceFor: lines(d.evidenceFor), evidenceAgainst: lines(d.evidenceAgainst),
      whoToldMe: d.whoToldMe.trim(), didTheyTurnOutWell: d.didTheyTurnOutWell.trim(), areTheyAnExpert: d.areTheyAnExpert.trim(),
      reframe: d.reframe.trim(), strengthBefore: b.strength, strengthAfter: d.strengthAfter || null, reAsked: !!d.strengthAfter, entryId: null, affirmationId: null};
    if(d.affirm && row.reframe){ const a = affirmationNew(row.reframe, 'reframe', b.id); if(a) row.affirmationId = a.id; }
    const e = lifeEntryNew({type: 'belief', title: 'Challenged: ' + b.text.slice(0, 60),
      body: [`${b.text}`, '', 'For:', ...row.evidenceFor.map(x => '· ' + x), '', 'Against:', ...row.evidenceAgainst.map(x => '· ' + x), '',
        `Who told me: ${row.whoToldMe || '—'}. Did their life turn out well: ${row.didTheyTurnOutWell || '—'}. An expert: ${row.areTheyAnExpert || '—'}.`, '', row.reframe ? 'Reframe: ' + row.reframe : ''].join('\n'),
      tags: ['belief'], extra: {beliefId: b.id, challengeId: row.id, reframe: row.reframe}});
    row.entryId = e.id;
    (b.challenges = b.challenges || []).push(row);
    if(d.strengthAfter) b.strength = d.strengthAfter;
    if(d.resurface && !b.treePageId){ b.resurfaceRung = 0; b.resurfaceAt = addDays(today(), TREE_REVIEW_DAYS[0]); }
    b.updatedAt = new Date().toISOString(); saveNow(); sound('success'); toast('Kept. It usually loosens rather than leaves — it may come back for a check.', 5000); rerender();
  }, {finish: 'Keep this challenge'});
}
/* the check: still holds / loosened / challenge again. It mirrors the Tree's
   hold, doubt and revise, so the two feel like one mechanism. */
function beliefDue(T){ T = T || today(); return beliefsAll('belief').filter(b => b.resurfaceAt && b.resurfaceAt <= T && !b.treePageId); }
function beliefCheck(b, verdict){
  if(verdict === 'hold') b.resurfaceRung = Math.min(TREE_REVIEW_DAYS.length - 1, (b.resurfaceRung || 0) + 1);
  else if(verdict === 'loosened') b.resurfaceRung = 0;
  b.resurfaceAt = addDays(today(), TREE_REVIEW_DAYS[b.resurfaceRung || 0]);
  b.updatedAt = new Date().toISOString(); saveNow();
  if(verdict === 'again'){ beliefChallenge(b.id); return; }
  rerender();
}
function pqPurpose(T){
  const out = [];
  beliefDue(T).forEach(b => out.push({id: 'belief:' + b.id, source: 'new', category: 'flag', rank: PQ_RANK.flag, period: 'day', msg: `Do you still hold “${b.text.slice(0, 70)}”?`,
    rule: `you set a check on this for ${fmtDate(b.resurfaceAt, 'short')}`,
    acts: [['still holds', () => beliefCheck(b, 'hold')], ['loosened', () => beliefCheck(b, 'loosened')], ['challenge again', () => beliefCheck(b, 'again')]]}));
  return out;
}

/* ---------- to the Knowledge Tree: a position about the self ---------- */
function beliefPromote(id){
  const b = byId(beliefsAll(), id); if(!b || b.treePageId) return;
  const roots = typeof treeRoots === 'function' ? treeRoots() : [];
  if(!roots.length){ toast('Plant a root in the Knowledge Tree first — a belief needs somewhere to stand.'); return; }
  const m = openModal(`<h2>Move to the Knowledge Tree</h2>
    <p class="faint">The Tree then owns the checking, with the same ladder. Its confidence starts at ${b.strength * 20}, the grip times twenty. The register keeps a link, and the Tree keeps owning propositions about the world — this one is about you, so it stays marked as such.</p>
    <div class="field"><label>Under which root</label><select class="sel" id="bpRoot">${roots.map(r => `<option value="${r.id}">${esc(r.title)}</option>`).join('')}</select></div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="bpGo">Move it</button></div>`, 'narrow');
  m.querySelector('#bpGo').onclick = () => {
    const last = beliefLast(b);
    const res = treeSavePage({title: 'Belief: ' + b.text.slice(0, 70), kind: 'point', parentId: m.querySelector('#bpRoot').value, body: b.text,
      openQuestion: last && last.evidenceAgainst.length ? 'What would change my mind: ' + last.evidenceAgainst.join('; ') : 'What would change my mind about this?'});
    if(res.error){ toast(res.error); return; }
    treeAddPosition(res.node.id, b.text, b.strength * 20);
    b.treePageId = res.node.id; b.resurfaceAt = null; saveNow(); m.remove(); sound('success'); toast('Moved. The Tree owns the checking now.'); rerender();
  };
}

/* ---------- fears ---------- */
function demonsFears(host){
  const xs = beliefsAll('fear');
  host.innerHTML = `<p class="faint dm-lede">Two kinds. A fear about safety. And a fear about the cost and limitation of something grand — the second is a compass bearing: your purpose is supposed to scare you, and a fear pointing that way is a clue to go there. Most modern fear is not physical but of failure, rejection and embarrassment. The technique: feel it and go into it; get excited about it; do not label it bad.</p>
    <div class="row"><button class="btn primary" id="dmFear">Add a fear</button></div>
    ${xs.length ? `<div class="dm-list">${xs.map(f => { const v = f.pointsTo && f.pointsTo.visionId ? byId(S.visions, f.pointsTo.visionId) : null;
      return `<article class="dm-row"><div class="dm-main"><p class="serif dm-text">${esc(f.text)}</p>
        <div class="mono faint">${f.fearType === 'grand' ? 'a compass fear — the cost and limitation of something grand' : f.fearType === 'safety' ? 'about safety' : 'not sorted yet'}${v ? ` · points at <a href="#/purpose/vision/${esc(v.id)}">${esc(v.name)}</a>` : ''}${f.pointsTo && f.pointsTo.domainText ? ' · ' + esc(f.pointsTo.domainText) : ''}</div></div>
        <div class="dm-side">${dmDots(f.strength)}<button class="btn sm" data-dmgo="${f.id}">go into it</button>
          <button class="del-x inline" data-dmdel="${f.id}" title="remove this one">×</button></div></article>`; }).join('')}</div>`
      : '<div class="empty">No fears written down yet.</div>'}`;
  host.querySelector('#dmFear').onclick = () => fearAdd();
  host.querySelectorAll('[data-dmdel]').forEach(b => b.onclick = () => { const x = byId(beliefsAll(), b.dataset.dmdel); if(!x) return;
    requestDelete({label: x.text.slice(0, 40), node: b.closest('.dm-row'), remove: () => spliceOut(S.beliefs, y => y.id === x.id), after: () => rerender()}); });
  host.querySelectorAll('[data-dmgo]').forEach(b => b.onclick = () => fearGoInto(b.dataset.dmgo));
}
function fearAdd(prefill){
  const visions = (S.visions || []).filter(v => !v.archived && v.status !== 'completed');
  const m = openModal(`<h2>A fear</h2>
    <div class="field"><label>The fear, in your own words</label><textarea class="ta" id="faT" rows="2" autofocus>${esc(prefill || '')}</textarea></div>
    <div class="field"><label>Which kind?</label><div class="row" style="gap:6px;flex-wrap:wrap"><button class="chip on" data-fatype="safety">about safety</button><button class="chip" data-fatype="grand">about the cost and limitation of something grand</button></div></div>
    <div class="field" id="faPts" hidden><label>What does it point at?</label><select class="sel" id="faV"><option value="">— a domain, written below —</option>${visions.map(v => `<option value="${v.id}">${esc(v.name)}</option>`).join('')}</select>
      <input class="inp" id="faD" placeholder="or the place it points" style="margin-top:6px"></div>
    <div class="field"><label>How strongly does it grip, 1–5</label><div class="sc-rate" id="faS">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-n="${n}" class="${n <= 3 ? 'on' : ''}">●</button>`).join('')}</div></div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="faGo">Add</button></div>`, 'narrow');
  let type = 'safety', s = 3;
  m.querySelectorAll('[data-fatype]').forEach(c => c.onclick = () => { type = c.dataset.fatype; m.querySelectorAll('[data-fatype]').forEach(x => x.classList.toggle('on', x === c)); m.querySelector('#faPts').hidden = type !== 'grand'; });
  m.querySelectorAll('#faS button').forEach(b => b.onclick = () => { s = +b.dataset.n; m.querySelectorAll('#faS button').forEach(x => x.classList.toggle('on', +x.dataset.n <= s)); });
  m.querySelector('#faGo').onclick = () => {
    const pt = type === 'grand' ? {visionId: m.querySelector('#faV').value || null, purposeArtefact: null, domainText: m.querySelector('#faD').value.trim()} : null;
    if(!beliefNew({kind: 'fear', text: m.querySelector('#faT').value, fearType: type, strength: s, pointsTo: pt})){ toast('Write the fear first.'); return; }
    m.remove(); sound('click'); rerender();
  };
}
function fearGoInto(id){
  const f = byId(beliefsAll(), id); if(!f) return;
  const m = openModal(`<h2>Go into it</h2><p class="muted">“${esc(f.text)}”</p>
    <p class="faint">Feel it, and go into it. If you decided not to label it as bad — what would be exciting about this?</p>
    <textarea class="ta" id="giT" rows="5" autofocus></textarea>
    <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn primary" id="giGo">Keep it</button></div>`);
  m.querySelector('#giGo').onclick = () => { const t = m.querySelector('#giT').value.trim(); if(!t){ toast('Write a line first.'); return; }
    lifeEntryNew({type: 'reflection', title: 'Going into a fear', body: `“${f.text}”\n\n${t}`, tags: ['fear']}); saveNow(); m.remove(); sound('success'); toast('Filed as a reflection.'); };
}
const fearCompass = () => beliefsAll('fear').filter(f => f.fearType === 'grand');

/* ---------- resistance: the fastest capture in the module ---------- */
function demonsResistance(host){
  const es = S.entries.filter(e => e.type === 'resistance').sort((a, b) => (b.occurredAt || '').localeCompare(a.occurredAt || '')).slice(0, 30);
  host.innerHTML = `<p class="faint dm-lede">Resistance never presents as resistance. It presents as a legitimate competing obligation — the right computer first, taxes to file, planning the book now and writing it on a retreat. The problem does not go away on the retreat, because the problem is the resistance. The response is to observe it and feel into it, and not to create resistance to the resistance. This log is for noticing, not for judging.</p>
    <section class="dm-cap"><div class="field"><label>What did you avoid?</label>
        <input class="inp" id="rsA" list="rsAList" placeholder="free text, or pick"><datalist id="rsAList">${resistanceTargets().map(t => `<option value="${esc(t)}">`).join('')}</datalist></div>
      <div class="grid c2" style="gap:10px"><div class="field"><label>What form did it take?</label><select class="sel" id="rsF"><option value="">—</option>${RESISTANCE_FORMS.map(f => `<option>${esc(f)}</option>`).join('')}</select></div>
        <div class="field"><label>What was it protecting? (later is fine)</label><input class="inp" id="rsP"></div></div>
      <div class="field"><label>The smallest next action</label><input class="inp" id="rsN" placeholder="one line"></div>
      <div class="faint" style="font-size:.78rem">If you genuinely do not know how, the answer is more research. If you do know, it is procrastination — the course’s test.</div>
      <div class="row" style="gap:8px;margin-top:8px"><button class="btn primary" id="rsGo">Log it</button><button class="btn ghost" id="rsTask">log it and make the action a task</button></div></section>
    ${es.length ? `<div class="dm-list">${es.map(e => `<article class="dm-row"><div class="dm-main"><p class="serif dm-text">${esc(e.extra.avoided || e.title || '')}</p>
        <div class="mono faint">${esc(fmtDate((e.occurredAt || '').slice(0, 10), 'med'))}${e.extra.form ? ' · ' + esc(e.extra.form) : ''}${e.extra.protecting ? ' · protecting: ' + esc(e.extra.protecting) : ''}</div>
        ${e.extra.smallestAction ? `<div class="faint">next: ${esc(e.extra.smallestAction)}</div>` : ''}</div>
        <div class="dm-side"><button class="btn sm ghost" data-rsfill="${e.id}">add to it</button></div></article>`).join('')}</div>` : ''}`;
  const q = s => host.querySelector(s);
  const log = makeTask => {
    const avoided = q('#rsA').value.trim(); if(!avoided){ toast('What did you avoid? A word is enough.'); return; }
    const act = q('#rsN').value.trim(); let taskId = null;
    if(makeTask && act){ const t = newPlanTask(act, ''); S.tasks.push(t); taskId = t.id; }
    lifeEntryNew({type: 'resistance', title: avoided.slice(0, 70), body: '', tags: ['resistance'], extra: {avoided, form: q('#rsF').value, protecting: q('#rsP').value.trim(), smallestAction: act, taskId}});
    saveNow(); sound('click'); if(taskId) toast('Made a task.'); rerender();
  };
  q('#rsGo').onclick = () => log(false); q('#rsTask').onclick = () => log(true);
  q('#rsA').onkeydown = e => { if(e.key === 'Enter') log(false); };
  host.querySelectorAll('[data-rsfill]').forEach(b => b.onclick = () => { const e = byId(S.entries, b.dataset.rsfill); if(!e) return;
    const m = openModal(`<h2>${esc(e.extra.avoided || 'Resistance')}</h2>
      <div class="field"><label>What was it protecting?</label><input class="inp" id="rfP" value="${esc(e.extra.protecting || '')}"></div>
      <div class="field"><label>The smallest next action</label><input class="inp" id="rfN" value="${esc(e.extra.smallestAction || '')}"></div>
      <div class="row" style="justify-content:flex-end"><button class="btn primary" id="rfGo">Save</button></div>`, 'narrow');
    m.querySelector('#rfGo').onclick = () => { e.extra.protecting = m.querySelector('#rfP').value.trim(); e.extra.smallestAction = m.querySelector('#rfN').value.trim(); saveNow(); m.remove(); rerender(); }; });
}
function resistanceTargets(){
  const out = [];
  (S.skills || []).forEach(s => out.push(s.name));
  (typeof perfActive === 'function' ? perfActive() : []).forEach(g => out.push(g.title));
  (S.bets || []).forEach(b => b.hypothesis && out.push(b.hypothesis));
  (S.tasks || []).filter(t => !t.done).slice(0, 12).forEach(t => out.push(t.text));
  return [...new Set(out.filter(Boolean))].slice(0, 60);
}
/* the one derived reading: the count in the period, and the most frequent form.
   Shown in the weekly review and nowhere else; never compared, never trended. */
function resistanceLoad(from, to){
  const es = S.entries.filter(e => e.type === 'resistance' && (e.occurredAt || '').slice(0, 10) >= from && (e.occurredAt || '').slice(0, 10) <= to);
  const forms = {}; es.forEach(e => { if(e.extra && e.extra.form) forms[e.extra.form] = (forms[e.extra.form] || 0) + 1; });
  const top = Object.entries(forms).sort((a, b) => b[1] - a[1])[0];
  return {count: es.length, form: top ? top[0] : '', entries: es};
}
function resistanceWeekStep(from, to){
  const r = resistanceLoad(from, to); if(!r.count) return [];
  return [{title: 'What you avoided this week.', hint: 'The count of what you noticed, and the form it most often took. A reading, not a grade — and not something to resist.',
    body: () => `<p class="serif">${r.count} thing${r.count === 1 ? '' : 's'} noticed${r.form ? `; most often as <b>${esc(r.form)}</b>` : ''}.</p>
      ${r.entries.slice(0, 6).map(e => `<div class="rev-summary">${esc(e.extra.avoided || e.title)}${e.extra.smallestAction ? ` <span class="faint">— next: ${esc(e.extra.smallestAction)}</span>` : ''}</div>`).join('')}`}];
}
/* daily clearing: one optional capture, offered only when the day has been written about */
function beliefClearingStep(T){
  const c = checkin(T);
  if(!(c.sentence || '').trim() && !(dayReview(T).note || '').trim()) return [];
  return [{title: 'Is there a limiting belief under today?', hint: 'Optional. The point is capture, not processing — it lands in the register unchallenged.',
    body: () => '<textarea class="ta" id="dcB" rows="2" placeholder="I believe… (leave it empty if there is none)"></textarea>',
    next: b => { const t = b.querySelector('#dcB').value.trim(); if(t.length > 3){ beliefNew({text: t, area: 'noticed on ' + fmtDate(T, 'short')}); toast('In the register.'); } }}];
}

/* ---------- where it came from: every “what this installed in me” answer, in one place ----------
   Pure assembly over data the house already collects on memories and life
   events, on Library works, and on people. Read-only; it is the richest
   provenance a belief could have, and it feeds the register. */
const INSTALLED_KINDS = [['belief', 'a belief', /\b(believ|think that|thought that|that i (am|was|can|cannot|could|should)|must|never|always|only if|worth|deserv|enough)\b/i],
  ['fear', 'a fear', /\b(afraid|fear|scared|terrif|anxious|anxiety|dread|panic|worr)/i],
  ['pattern', 'a pattern', /\b(pattern|tend to|tendency|habit|keep doing|again and again|reflex|default|automatic|cycle)\b/i],
  ['capability', 'a capability', /\b(learn|able to|ability|capab|skill|knack|taught me|how to|confiden|strength|resilien|can )/i]];
function installedAll(){
  const out = [];
  (S.entries || []).forEach(e => { const t = ((e.extra || {}).installed || '').trim(); if(!t) return;
    out.push({text: t, source: e.title || typeName(e.type), kind: e.type === 'media' ? 'a work in the Library' : e.type === 'lifeevent' ? 'a life event' : e.type === 'memory' ? 'a memory' : typeName(e.type), go: e.type === 'media' ? '#/journals/library' : '#/journals/' + e.type, date: (e.occurredAt || '').slice(0, 10)}); });
  (S.people || []).forEach(p => { const raw = p.installed; const t = (Array.isArray(raw) ? ((raw[raw.length - 1] || {}).text || '') : String(raw || '')).trim(); if(t) out.push({text: t, source: p.name, kind: 'a person', go: '#/identity/people', date: ''}); });
  return out;
}
const installedClass = t => (INSTALLED_KINDS.find(k => k[2].test(t)) || ['other', 'not named as one of these'])[0];
function demonsOrigins(host){
  const all = installedAll();
  if(!all.length){ host.innerHTML = '<p class="faint dm-lede">Memories, life events, Library works and people each ask what they installed in you — the belief, fear, pattern or capability they left behind. Nothing has been written there yet. When it is, it gathers here.</p><div class="empty">Nothing yet.</div>'; return; }
  const groups = {}; all.forEach(x => (groups[installedClass(x.text)] = groups[installedClass(x.text)] || []).push(x));
  const order = [...INSTALLED_KINDS.map(k => [k[0], k[1]]), ['other', 'not named as one of these']];
  host.innerHTML = `<p class="faint dm-lede">Every “what this installed in me” answer you have written, from memories, life events, Library works and people, grouped by whether it named a belief, a fear, a pattern or a capability (the grouping is read from your wording and is only a guess). Read-only — but any of them can go to the register.</p>
    ${order.filter(([k]) => groups[k]).map(([k, name]) => `<h3 class="serif" style="margin:16px 0 6px">${esc(name)} <span class="mono faint">${groups[k].length}</span></h3>
      ${groups[k].map((x, i) => `<article class="dm-row"><div class="dm-main"><p class="dm-text">${esc(x.text)}</p><div class="mono faint">${esc(x.kind)} · <a href="${esc(x.go)}">${esc(x.source)}</a>${x.date ? ' · ' + esc(fmtDate(x.date, 'short')) : ''}</div></div>
        <div class="dm-side">${k === 'belief' || k === 'fear' ? `<button class="btn sm ghost" data-orreg="${k}|${esc(k + i)}">to the register</button>` : ''}</div></article>`).join('')}`).join('')}`;
  host.querySelectorAll('[data-orreg]').forEach(b => b.onclick = () => { const [k, key] = b.dataset.orreg.split('|'); const idx = +key.slice(k.length); const x = groups[k][idx]; if(!x) return;
    if(k === 'fear') fearAdd(x.text); else beliefWriteDirect('belief', x.text); });
}
