/* ============================================================
   THE ZONE OF GENIUS WORKBENCH (#/purpose/genius) — and the shadow worksheet

   The course's discovery method is not introspection in general; it is a
   specific run of worksheets whose answers converge. Four zones, the Big Leap
   worksheet, flow moments as clues, fear as a bearing, and three people
   admired. All of it produces text the entry store already holds, so the words
   are entries and the convergence engine reads them.

   Nothing here classifies on your behalf: a candidate activity is offered
   unclassified and attaches to nothing until you place it. No column ever
   reproaches its own emptiness.
   ============================================================ */

purposeTabAdd({id: 'genius', label: 'Zone of genius', order: 15, render: (body) => geniusRender(body)});

function geniusState(){
  const p = purposeState();
  if(!p.genius || typeof p.genius !== 'object') p.genius = {};
  const g = p.genius;
  if(!g.tab) g.tab = 'zones';
  if(!g.bl) g.bl = {part: 1, qi: 0, answers: {}, entryIds: {}, startedAt: '', doneAt: ''};
  return g;
}
const GN_TABS = [['zones', 'The four zones'], ['worksheet', 'The Big Leap worksheet'], ['clues', 'Flow clues'], ['fears', 'Fear as compass']];
function geniusRender(body){
  const g = geniusState(), tab = GN_TABS.some(t => t[0] === g.tab) ? g.tab : 'zones';
  body.innerHTML = `<div class="gn-wrap"><div class="dm-sub" role="tablist">${GN_TABS.map(([k, n]) => `<button role="tab" class="${k === tab ? 'on' : ''}" data-gntab="${k}">${n}</button>`).join('')}</div><div id="gnBody"></div></div>`;
  body.querySelectorAll('[data-gntab]').forEach(b => b.onclick = () => { g.tab = b.dataset.gntab; saveNow(); rerender(); });
  ({zones: gnZones, worksheet: gnWorksheet, clues: gnClues, fears: gnFears})[tab](body.querySelector('#gnBody'));
}

/* ---------- 2a. the four zones ---------- */
const GN_ZONES = [
  ['incompetence', 'Incompetence', 'What you are not good at. It should be outsourced or dropped.'],
  ['competence', 'Competence', 'You are no better at it than anyone else, and it is not worth investing in.'],
  ['excellence', 'Excellence', 'Where you are rewarded. It is dangerously easy to get stuck here: you feel competent and people pay you well for it — which is exactly what makes it a trap.'],
  ['genius', 'Genius', 'What very few people reach. Very few people can name this early, and it is usually the last column to fill.'],
];
const zoneInv = () => lifeArray('zoneItems');
function zoneInvAdd(name, zone, links = {}){
  name = String(name || '').trim(); if(!name || !GN_ZONES.some(z => z[0] === zone)) return null;
  const it = {id: uid(), name, zone, note: '', links: Object.assign({skillId: '', valueId: '', personId: '', listId: '', categoryId: ''}, links), at: new Date().toISOString(), updatedAt: new Date().toISOString()};
  zoneInv().push(it); saveNow(); return it;
}
/* offered, never attached: skills in play, habits, lists, clock categories with time */
function zoneCandidates(){
  const have = new Set(zoneInv().map(i => i.name.toLowerCase()));
  const out = [];
  const add = (name, kind, links) => { if(name && !have.has(name.toLowerCase()) && !out.some(o => o.name.toLowerCase() === name.toLowerCase())) out.push({name, kind, links}); };
  (S.skills || []).filter(s => (typeof skillHorizon === 'function' ? skillHorizon(s) : 'active') !== 'someday').forEach(s => add(s.name, 'skill', {skillId: s.id}));
  (S.habits || []).filter(h => !h.archived && !h.negative).forEach(h => add(h.name, 'habit', {}));
  (typeof planLists === 'function' ? planLists() : []).filter(l => l && l.name).forEach(l => add(l.name, 'list', {listId: l.id}));
  const since = addDays(today(), -90);
  (typeof timeAllCategories === 'function' ? timeAllCategories() : []).forEach(c => { if((S.timeEntries || []).some(e => e.categoryId === c.id && e.endTime && timeDayOf(e.startTime) >= since)) add(c.name, 'clock', {categoryId: c.id}); });
  return out;
}
/* hours this month by zone, read from the clock; a sitting matching two items is split evenly, and it says so */
function zoneHoursThisMonth(){
  const from = today().slice(0, 7) + '-01', by = {incompetence: 0, competence: 0, excellence: 0, genius: 0}; let split = 0;
  const items = zoneInv();
  (S.timeEntries || []).forEach(e => {
    if(!e.endTime || timeDayOf(e.startTime) < from) return;
    const cat = typeof timeCategory === 'function' && e.categoryId ? timeCategory(e.categoryId) : null;
    const hit = items.filter(it => (e.linkedType === 'skill' && it.links.skillId && it.links.skillId === e.linkedId) || (it.links.categoryId && it.links.categoryId === e.categoryId) || (cat && it.name.toLowerCase() === cat.name.toLowerCase()));
    if(!hit.length) return;
    if(hit.length > 1) split++;
    const m = timeMinutes(e) / hit.length; hit.forEach(it => by[it.zone] += m);
  });
  Object.keys(by).forEach(k => by[k] = Math.round(by[k] / 6) / 10);
  return {by, split};
}
function zoneIncompetentInWeek(){
  const since = addDays(today(), -30);
  return zoneInv().filter(it => it.zone === 'incompetence' && (S.timeEntries || []).some(e => e.endTime && timeDayOf(e.startTime) >= since &&
    ((e.linkedType === 'skill' && it.links.skillId && it.links.skillId === e.linkedId) || (it.links.categoryId && it.links.categoryId === e.categoryId) ||
     (e.categoryId && timeCategory(e.categoryId) && timeCategory(e.categoryId).name.toLowerCase() === it.name.toLowerCase()))));
}
function gnZones(host){
  const inv = zoneInv(), cands = zoneCandidates(), h = zoneHoursThisMonth(), inc = zoneIncompetentInWeek();
  const total = Object.values(h.by).reduce((a, b) => a + b, 0);
  const p = purposeState();
  const trap = h.by.excellence >= 3 * Math.max(h.by.genius, .01) && total >= 10 && h.by.excellence > 0;
  let trapLine = '';
  if(trap && (p.zoneTrapMonth !== today().slice(0, 7) || p.zoneTrapOn === today())){ p.zoneTrapMonth = today().slice(0, 7); p.zoneTrapOn = today();
    trapLine = `<p class="serif gn-trap">Most of your recorded hours this month are in the zone where you are rewarded rather than the zone you named: ${h.by.excellence} against ${h.by.genius}.</p><p class="faint mono" style="font-size:.74rem">the rule: excellence hours at least three times genius hours, with ten hours recorded in all; said once a month.</p>`; }
  const adm = (S.people || []).filter(x => x.admired);
  host.innerHTML = `<p class="faint dm-lede">Every activity in a life sits in one of four zones. The point is not the taxonomy but two questions it makes answerable: what is in the incompetence zone and still in my week, and what is in the excellence zone that is quietly keeping me comfortable.</p>
    <div class="gn-cols">${GN_ZONES.map(([k, n, def]) => { const xs = inv.filter(i => i.zone === k);
      return `<section class="gn-col ${k}"><b class="serif">${n}</b><p class="faint gn-def">${def}</p>
        ${xs.map(i => `<div class="gn-item" data-gnid="${i.id}"><span>${esc(i.name)}</span><span class="gn-acts"><select class="sel" data-gnmove="${i.id}" title="move">${GN_ZONES.map(([z, zn]) => `<option value="${z}"${z === i.zone ? ' selected' : ''}>${zn}</option>`).join('')}</select><button class="del-x inline" data-gndel="${i.id}" title="remove">×</button></span></div>`).join('') || (k === 'genius' ? '<p class="faint">Nothing yet — and that is ordinary.</p>' : '<p class="faint">—</p>')}
        <div class="row" style="gap:6px"><input class="inp" data-gnadd="${k}" placeholder="add an activity…"></div></section>`; }).join('')}</div>
    ${cands.length ? `<section class="section"><span class="sc">Offered from what the house already knows</span><p class="faint" style="font-size:.8rem">Nothing is classified until you say where it goes.</p>
      <div class="deps">${cands.slice(0, 40).map((c, i) => `<button class="chip" data-gncand="${i}" title="${esc(c.kind)}">${esc(c.name)}</button>`).join('')}</div><div id="gnPick"></div></section>` : ''}
    <section class="section"><span class="sc">Two readings</span>
      <p>Hours this month against what you have placed: ${GN_ZONES.map(([k, n]) => `${n.toLowerCase()} <b>${h.by[k]}</b>`).join(' · ')}.</p>
      <p class="faint mono" style="font-size:.76rem">read from the clock, against activities you have placed${h.split ? `; ${h.split} sitting${h.split === 1 ? '' : 's'} matched more than one activity and ${h.split === 1 ? 'was' : 'were'} split evenly` : ''}</p>
      <p>Incompetence-zone activities with any time recorded in the last thirty days: <b>${inc.length}</b>${inc.length ? ' — ' + inc.map(i => esc(i.name)).join(', ') : ''}.</p>${trapLine}</section>
    <section class="section"><span class="sc">Three people you admire</span>
      <p class="faint" style="font-size:.82rem">Name them, then research them: what exactly do you admire, what was their creative genius and in what way, what made them passionate. They join the constellation as people you have not met — a dashed outline with no thread, which is the honest picture.</p>
      ${adm.map(a => `<article class="gn-adm" data-admid="${a.id}"><b class="serif">${esc(a.name)}</b>
        ${[['adm', 'What exactly do I admire?'], ['genius', 'What was their creative genius, and in what way?'], ['passion', 'What made them passionate?']].map(([k, q]) => `<div class="field"><label>${q}</label><textarea class="ta" rows="2" data-admk="${a.id}|${k}">${esc((a.admired || {})[k] || '')}</textarea></div>`).join('')}</article>`).join('')}
      ${adm.length < 3 ? '<div class="row" style="gap:6px"><input class="inp" id="gnAdm" placeholder="someone you most admire"><button class="btn" id="gnAdmGo">Add</button></div>' : ''}</section>`;
  const q = s => host.querySelector(s);
  host.querySelectorAll('[data-gnadd]').forEach(i => i.onkeydown = e => { if(e.key === 'Enter' && i.value.trim()){ zoneInvAdd(i.value, i.dataset.gnadd); rerender(); } });
  host.querySelectorAll('[data-gnmove]').forEach(s => s.onchange = () => { const it = byId(zoneInv(), s.dataset.gnmove); if(it){ it.zone = s.value; it.updatedAt = new Date().toISOString(); saveNow(); rerender(); } });
  host.querySelectorAll('[data-gndel]').forEach(b => b.onclick = () => { const it = byId(zoneInv(), b.dataset.gndel); if(it) requestDelete({label: it.name, node: b.closest('.gn-item'), remove: () => spliceOut(S.zoneItems, x => x.id === it.id), after: () => rerender()}); });
  host.querySelectorAll('[data-gncand]').forEach(b => b.onclick = () => { const c = cands[+b.dataset.gncand]; const pk = q('#gnPick');
    pk.innerHTML = `<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px"><b>${esc(c.name)}</b> →${GN_ZONES.map(([k, n]) => `<button class="btn sm" data-gnplace="${k}">${n}</button>`).join('')}<button class="btn sm ghost" data-gnplace="">not now</button></div>`;
    pk.querySelectorAll('[data-gnplace]').forEach(z => z.onclick = () => { if(z.dataset.gnplace) zoneInvAdd(c.name, z.dataset.gnplace, c.links); rerender(); }); });
  host.querySelectorAll('[data-admk]').forEach(t => t.onchange = () => { const [id, k] = t.dataset.admk.split('|'); const a = byId(S.people, id); if(a){ a.admired = Object.assign({}, a.admired, {[k]: t.value.trim()}); saveNow(); } });
  if(q('#gnAdmGo')) q('#gnAdmGo').onclick = () => { const n = q('#gnAdm').value.trim(); if(!n) return; const a = newPerson(n); a.circle = 'aspirational'; a.status = 'notyetmet'; a.relationship = 'other'; a.admired = {adm: '', genius: '', passion: ''}; S.people.push(a); saveNow(); rerender(); };
}

/* ---------- 2b. the Big Leap worksheet ---------- */
const BIGLEAP = {
  1: {title: 'Part one', qs: [
    'What do I love to do so much that I can do it for long stretches without getting tired or bored?',
    'What work do I do that does not seem like work?',
    'What would I do if I did not have to account for how I spend my time?',
    'What is my unique ability that, fully realised and put to work, would provide enormous benefit?']},
  2: {title: 'Part two', qs: [
    'I am at my best when I am…',
    'When I am at my best, the exact thing I am doing is…',
    'When I am doing that, the thing I love most about it is…']},
};
const BL_FRAMING = ['Set aside a comfortable chunk of time, in a quiet place.', 'For this exercise, silence the negative thoughts and fears.', 'Allow yourself to dream, without practical worries about money, family or know-how.'];
function blAnswers(part, qi){ const a = geniusState().bl.answers; const k = part + '.' + qi; if(!Array.isArray(a[k])) a[k] = ['']; return a[k]; }
function blFile(){
  const bl = geniusState().bl;
  [1, 2].forEach(part => {
    const answers = BIGLEAP[part].qs.map((q, i) => ({q, answers: blAnswers(part, i).filter(t => t.trim())}));
    if(!answers.some(a => a.answers.length)) return;
    const body = answers.map(a => `${a.q}\n${a.answers.map(t => '— ' + t).join('\n')}`).join('\n\n');
    let e = bl.entryIds[part] ? byId(S.entries, bl.entryIds[part]) : null;
    if(e){ e.body = body; e.extra.answers = answers; }
    else { e = lifeEntryNew({type: 'reflection', title: 'The Big Leap worksheet — ' + BIGLEAP[part].title.toLowerCase(), body, tags: ['bigleap'], extra: {worksheet: 'bigleap', part, answers}}); bl.entryIds[part] = e.id; }
  });
  saveNow();
}
function gnWorksheet(host){
  const bl = geniusState().bl, started = !!bl.startedAt;
  const nAns = Object.values(bl.answers).reduce((n, a) => n + a.filter(t => t.trim()).length, 0);
  host.innerHTML = `<p class="faint dm-lede">Find a quiet place, set aside a comfortable chunk of time, and force the mind to really think. List many answers to each question before settling on one — breadth over tidiness. Nothing is required. It resumes where you left it.</p>
    <div class="row" style="gap:8px"><button class="btn primary" id="blGo">${started && !bl.doneAt ? 'Resume where you left off' : bl.doneAt ? 'Open it again' : 'Begin'}</button>
      ${bl.doneAt ? '<button class="btn" id="blSee">The two answer sets</button>' : ''}</div>
    <p class="mono faint">${nAns ? nAns + ' answer' + (nAns === 1 ? '' : 's') + ' so far' : 'nothing written yet'}</p>`;
  host.querySelector('#blGo').onclick = () => blRun(); const see = host.querySelector('#blSee'); if(see) see.onclick = () => blEnd();
}
function blRun(){
  const bl = geniusState().bl, all = [];
  [1, 2].forEach(part => BIGLEAP[part].qs.forEach((q, i) => all.push({part, i, q})));
  const start = () => {
    bl.startedAt = bl.startedAt || new Date().toISOString();
    const steps = all.map(({part, i, q}) => ({title: BIGLEAP[part].title + ' · question ' + (i + 1) + ' of ' + BIGLEAP[part].qs.length, hint: esc(q),
      body: () => { const a = blAnswers(part, i); return `<div id="blBox">${a.map((t, k) => `<textarea class="ta bl-a" rows="2" data-blk="${k}" placeholder="${k ? 'another answer…' : 'an answer…'}">${esc(t)}</textarea>`).join('')}</div>
        <div class="row between"><button class="btn sm ghost" id="blMore">add another answer</button><span class="mono faint" id="blN">${a.filter(x => x.trim()).length} answer${a.filter(x => x.trim()).length === 1 ? '' : 's'}</span></div>`; },
      bind: b => {
        const a = blAnswers(part, i); bl.part = part; bl.qi = i; saveNow();
        const wire = () => b.querySelectorAll('.bl-a').forEach(t => t.oninput = () => { a[+t.dataset.blk] = t.value; b.querySelector('#blN').textContent = a.filter(x => x.trim()).length + ' answers'; saveNow(); });
        wire();
        b.querySelector('#blMore').onclick = () => { a.push(''); const t = document.createElement('textarea'); t.className = 'ta bl-a'; t.rows = 2; t.dataset.blk = a.length - 1; t.placeholder = 'another answer…'; b.querySelector('#blBox').appendChild(t); wire(); t.focus(); };
      },
      next: () => { blFile(); }}));
    const at = Math.max(0, all.findIndex(x => x.part === (bl.part || 1) && x.i === (bl.qi || 0)));
    ppFlow('The Big Leap worksheet', steps, () => { bl.doneAt = new Date().toISOString(); blFile(); blEnd(); }, {finish: 'Finish', startAt: at});
  };
  if(typeof ceremonyVeil === 'function' && !bl.startedAt) ceremonyVeil(BL_FRAMING, start, {label: 'the worksheet'}); else start();
}
/* the two answer sets the course says reveal the zone of genius */
function blEnd(){
  const a = blAnswers(1, 3).filter(t => t.trim()), b = blAnswers(2, 1).filter(t => t.trim());
  const m = openModal(`<h2>What the worksheet reveals</h2>
    <p class="faint">The zone of genius is especially revealed by two of the answers: your unique ability (part one, question four) and the exact thing you are doing when you are at your best (part two, question two).</p>
    <div class="grid c2" style="gap:12px;align-items:start"><div><div class="mono faint">unique ability</div>${a.map(t => `<p class="serif">${esc(t)}</p>`).join('') || '<p class="faint">nothing written</p>'}</div>
      <div><div class="mono faint">what I am doing at my best</div>${b.map(t => `<p class="serif">${esc(t)}</p>`).join('') || '<p class="faint">nothing written</p>'}</div></div>
    <div class="row" style="gap:8px;justify-content:flex-end"><button class="btn ghost" id="blX">Close</button><button class="btn primary" id="blDraft">Draft a zone-of-genius sentence</button></div>`, 'wide');
  m.querySelector('#blX').onclick = () => { m.remove(); rerender(); };
  m.querySelector('#blDraft').onclick = () => {
    const cur = purposeText('genius');
    m.querySelector('.modal').innerHTML = `<h2>A candidate for the sheet</h2><p class="faint">Written as a new version of the genius artefact — ${cur ? 'the current wording is kept' : 'there is nothing there yet'}. It is offered, not attached: nothing changes until you keep it.</p>
      <textarea class="ta serif-lg" id="blS" rows="3" placeholder="my zone of genius is…"></textarea>
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn primary" id="blK">Keep it as a new version</button></div>`;
    m.querySelector('#blK').onclick = () => { const t = m.querySelector('#blS').value.trim(); if(!t){ toast('Write the sentence first.'); return; } purposeSave('genius', t, {force: true}); m.remove(); sound('success'); toast('On the sheet, as a new version.'); rerender(); };
  };
}

/* ---------- 2c. the flow-clue list ---------- */
const flowClues = () => lifeArray('flowClues');
const FC_CHAL = [['below', 'below my skill'], ['at', 'at my skill'], ['above', 'above my skill']];
function flowClueQuick(){
  const m = openModal(`<h2>A moment of flow</h2><p class="faint">One line is enough. The rest can be filled in later.</p>
    <input class="inp" id="fcA" placeholder="what were you doing?" autofocus>
    <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn primary" id="fcGo">Keep it</button></div>`, 'narrow');
  const go = () => { const a = m.querySelector('#fcA').value.trim(); if(!a){ toast('A word is enough.'); return; }
    flowClues().push({id: uid(), activity: a, whatWasHappening: '', whatILoved: '', challenge: '', at: new Date().toISOString(), occurredAt: today(), entryId: null}); saveNow(); m.remove(); sound('click'); toast('Kept. It can be finished later.'); if(location.hash.startsWith('#/purpose/genius')) rerender(); };
  m.querySelector('#fcGo').onclick = go; m.querySelector('#fcA').onkeydown = e => { if(e.key === 'Enter') go(); };
}
document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('[data-flowclue]'); if(b){ ev.preventDefault(); flowClueQuick(); } }, true);
const flowClueButtonHTML = () => '<button type="button" class="btn sm ghost" data-flowclue="1" title="a moment you lost track of time">a moment of flow?</button>';
function flowClueFinish(c){
  const m = openModal(`<h2>${esc(c.activity)}</h2>
    <div class="field"><label>What exactly was happening?</label><textarea class="ta" id="fcW" rows="3">${esc(c.whatWasHappening)}</textarea></div>
    <div class="field"><label>What did you love about it?</label><textarea class="ta" id="fcL" rows="2">${esc(c.whatILoved)}</textarea></div>
    <div class="field"><label>Challenge against your skill</label><div class="row" style="gap:6px">${FC_CHAL.map(([k, n]) => `<button class="chip${c.challenge === k ? ' on' : ''}" data-fcc="${k}">${n}</button>`).join('')}</div></div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="fcSave">Keep</button></div>`, 'narrow');
  let ch = c.challenge;
  m.querySelectorAll('[data-fcc]').forEach(b => b.onclick = () => { ch = ch === b.dataset.fcc ? '' : b.dataset.fcc; m.querySelectorAll('[data-fcc]').forEach(x => x.classList.toggle('on', x.dataset.fcc === ch)); });
  m.querySelector('#fcSave').onclick = () => {
    c.whatWasHappening = m.querySelector('#fcW').value.trim(); c.whatILoved = m.querySelector('#fcL').value.trim(); c.challenge = ch;
    if(c.whatWasHappening || c.whatILoved){ const body = [c.whatWasHappening, c.whatILoved && 'What I loved: ' + c.whatILoved].filter(Boolean).join('\n\n');
      let e = c.entryId ? byId(S.entries, c.entryId) : null;
      if(e){ e.body = body; e.title = c.activity; } else { e = lifeEntryNew({type: 'reflection', title: c.activity, body, occurredAt: c.occurredAt, tags: ['flow'], extra: {source: 'flowclue'}}); c.entryId = e.id; } }
    saveNow(); m.remove(); rerender();
  };
}
/* the two rollups, by the convergence engine's own tokens, counted by distinct clues */
function flowRollup(field){
  const rows = flowClues().map(c => new Set(convTokens(c[field] || ''))).filter(s => s.size);
  const count = {}; rows.forEach(s => s.forEach(w => { count[w] = (count[w] || 0) + 1; }));
  const bi = {}; flowClues().forEach(c => { const t = convTokens(c[field] || ''), seen = new Set(); for(let i = 0; i + 1 < t.length; i++){ const p = t[i] + ' ' + t[i + 1]; if(!seen.has(p)){ seen.add(p); bi[p] = (bi[p] || 0) + 1; } } });
  const pool = Object.entries(bi).filter(([, n]) => n >= 2).concat(Object.entries(count).filter(([w, n]) => n >= 2 && w.length > 3));
  return pool.sort((a, b) => b[1] - a[1] || b[0].length - a[0].length).slice(0, 3);
}
function gnClues(host){
  const cs = flowClues().slice().sort((a, b) => (b.at || '').localeCompare(a.at || '')), a = flowRollup('activity'), l = flowRollup('whatILoved');
  host.innerHTML = `<p class="faint dm-lede">Moments of flow are the most reliable clues to passion there are, and the course insists they not be dismissed as incidental. List them exhaustively — the course’s own list was built over weeks, not in one sitting. One line now; the rest later.</p>
    <div class="row" style="gap:8px"><button class="btn primary" id="fcNew">A moment of flow</button></div>
    ${cs.length >= 4 ? `<section class="section"><span class="sc">What recurs</span>
      <p>Activities: ${a.length ? a.map(([p, n]) => `<b>${esc(p)}</b> <span class="mono faint">${n} clues</span>`).join(' · ') : '<span class="faint">no phrase recurs yet</span>'}</p>
      <p>What you loved: ${l.length ? l.map(([p, n]) => `<b>${esc(p)}</b> <span class="mono faint">${n} clues</span>`).join(' · ') : '<span class="faint">no phrase recurs yet</span>'}</p></section>` : ''}
    <div class="dm-list">${cs.map(c => `<article class="dm-row"><div class="dm-main"><p class="serif dm-text">${esc(c.activity)}</p>
      <div class="mono faint">${esc(fmtDate(c.occurredAt, 'med'))}${c.challenge ? ' · ' + esc((FC_CHAL.find(x => x[0] === c.challenge) || [, ''])[1]) : ''}${c.whatILoved ? ' · loved: ' + esc(c.whatILoved.slice(0, 60)) : ''}</div></div>
      <div class="dm-side"><button class="btn sm ghost" data-fcfin="${c.id}">${c.whatWasHappening || c.whatILoved ? 'edit' : 'finish'}</button></div></article>`).join('') || '<div class="empty">No moments of flow written down yet.</div>'}</div>`;
  host.querySelector('#fcNew').onclick = flowClueQuick;
  host.querySelectorAll('[data-fcfin]').forEach(b => b.onclick = () => flowClueFinish(byId(flowClues(), b.dataset.fcfin)));
}

/* ---------- 2d. fear as compass ---------- */
function gnFears(host){
  const fs = beliefsAll('fear'), grand = fs.filter(f => f.fearType === 'grand'), safe = fs.filter(f => f.fearType === 'safety');
  host.innerHTML = `<p class="faint dm-lede">The zone of genius is something you grow into: it is big and scary. A fear pointing in that direction is a clue to go there. This runs once at the start and is revisited each season. For each direction you are afraid of, one question — is it a fear about safety, or a fear about the cost and limitation of something grand? Only the second is a bearing.</p>
    <div class="row" style="gap:8px"><button class="btn primary" id="fcFlow">Run the fear compass</button><a class="btn ghost" href="#/purpose/demons">the fear inventory</a></div>
    <p>${grand.length} compass fear${grand.length === 1 ? '' : 's'} (counted on the sheet) · ${safe.length} about safety (recorded, not counted)${fs.length - grand.length - safe.length ? ` · ${fs.length - grand.length - safe.length} not sorted yet` : ''}.</p>
    ${grand.map(f => `<p class="serif">“${esc(f.text)}”</p>`).join('')}`;
  host.querySelector('#fcFlow').onclick = fearCompassFlow;
}
function fearCompassFlow(){
  let lines = [], types = {};
  ppFlow('The fear compass', [
    {title: 'Which directions are you afraid of?', hint: 'One per line — the places a bigger life points that you are afraid to go.', body: () => '<textarea class="ta" id="fcdT" rows="7" placeholder="one fear per line…"></textarea>',
     next: b => { lines = b.querySelector('#fcdT').value.split(/\n+/).map(x => x.trim()).filter(Boolean); }},
    {title: 'Safety, or something grand?', hint: 'A fear about safety is a fear about safety. A fear about the cost and limitation of something grand is a bearing.',
     body: () => lines.length ? lines.map((t, i) => `<div class="row between" style="gap:8px;padding:5px 0"><span class="serif">${esc(t)}</span><span class="row" style="gap:5px"><button class="chip" data-fct="${i}|safety">about safety</button><button class="chip" data-fct="${i}|grand">the cost of something grand</button></span></div>`).join('') : '<p class="faint">Nothing was written.</p>',
     bind: b => b.querySelectorAll('[data-fct]').forEach(x => x.onclick = () => { const [i, t] = x.dataset.fct.split('|'); types[i] = t; b.querySelectorAll(`[data-fct^="${i}|"]`).forEach(y => y.classList.toggle('on', y === x)); }),
     next: () => { lines.forEach((t, i) => { if(types[i]) beliefNew({kind: 'fear', text: t, fearType: types[i], strength: 3, pointsTo: types[i] === 'grand' ? {visionId: null, purposeArtefact: 'genius', domainText: ''} : null}); }); saveNow(); }},
  ], () => { toast('Filed in the fear inventory.'); rerender(); }, {finish: 'Done'});
}

/* ---------- the shadow worksheet (strengths) ---------- */
function shadowWorksheet(){
  const xs = typeof strengthsAll === 'function' ? strengthsAll() : [];
  if(!xs.length){ toast('List a strength first.'); return; }
  const pick = () => {
    const m = openModal(`<h2>Which strength?</h2><div class="deps">${xs.map(s => `<button class="chip" data-shs="${s.id}">${esc(s.name)}</button>`).join('')}</div>`, 'narrow');
    m.querySelectorAll('[data-shs]').forEach(b => b.onclick = () => { m.remove(); run(byId(xs, b.dataset.shs)); });
  };
  const run = s => {
    const A = {};
    const ta = (k, ph) => `<textarea class="ta" id="sh_${k}" rows="4" placeholder="${esc(ph || '')}">${esc(A[k] || '')}</textarea>`;
    const save = (k, b) => { const t = b.querySelector('#sh_' + k); if(t) A[k] = t.value.trim(); };
    ppFlow('Shadow — ' + s.name, [
      {title: 'What is the opposite face of this?', hint: 'Every strength has a backside. An extrovert may be poor at being alone.', body: () => ta('face'), next: b => save('face', b)},
      {title: 'Where, in the last season, did it cost you something?', body: () => ta('cost'), next: b => save('cost', b)},
      {title: 'What would balancing it look like?', body: () => ta('bal'), next: b => save('bal', b)},
      {title: 'Is there a limiting belief underneath it?', hint: 'If there is, it goes into the belief register with this strength linked.', body: () => ta('belief', 'a belief, in a sentence — or leave it empty'), next: b => save('belief', b)},
    ], () => {
      const body = ['The opposite face', 'The cost, this season', 'Balancing it', 'A belief underneath'].map((h, i) => A[['face', 'cost', 'bal', 'belief'][i]] ? h + ':\n' + A[['face', 'cost', 'bal', 'belief'][i]] : '').filter(Boolean).join('\n\n');
      if(body) lifeEntryNew({type: 'reflection', title: 'Shadow worksheet — ' + s.name, body, tags: ['shadow'], extra: {source: 'shadow', strengthId: s.id}, links: {}});
      if(A.face) verSave(s.shadow, A.face, {note: 'from the shadow worksheet'});
      if(A.belief){ const b = beliefNew({text: A.belief, area: 'a strength: ' + s.name, provenance: 'unknown', strength: 3}); if(b){ b.links.strengthIds = [s.id]; } toast('The belief is in the register, linked to ' + s.name + '.'); }
      saveNow(); sound('success'); rerender();
    }, {finish: 'Keep it'});
  };
  if(xs.length === 1) run(xs[0]); else pick();
}
