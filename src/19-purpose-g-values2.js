/* ============================================================
   VALUES 2.0 — the construction and maintenance pipeline

   The values room is the best-built room in the inward half and implements
   roughly the last third of what the course prescribes. What it lacked was
   how a compass gets made and kept: the elimination passes down to ten, the
   personal definition, the values that work against you and the exercise
   that releases them, and the thirty-day imprinting discipline with its
   restart rule. Rank, colour, the four questions, versioning, the snapshots
   and the solar system are untouched.

   Starting the rebuild never destroys the current list. The new one is
   assembled alongside, and committed in the last step as one ranking-history
   row rather than ten.
   ============================================================ */

/* the course's own master list is a static document; no network call is permitted */
const MASTER_VALUES = {
  'Character': ['Integrity', 'Honesty', 'Courage', 'Authenticity', 'Humility', 'Discipline', 'Responsibility', 'Perseverance', 'Self-respect', 'Fairness', 'Dignity', 'Reliability', 'Accountability', 'Resilience'],
  'Relationships': ['Love', 'Family', 'Friendship', 'Loyalty', 'Intimacy', 'Trust', 'Belonging', 'Compassion', 'Kindness', 'Respect', 'Generosity', 'Forgiveness', 'Community', 'Partnership'],
  'Growth': ['Wisdom', 'Learning', 'Curiosity', 'Mastery', 'Growth', 'Insight', 'Self-knowledge', 'Excellence', 'Competence', 'Depth', 'Clarity', 'Understanding', 'Improvement', 'Knowledge'],
  'Creation': ['Creativity', 'Beauty', 'Craft', 'Originality', 'Expression', 'Imagination', 'Artistry', 'Innovation', 'Vision', 'Play', 'Wonder', 'Elegance', 'Making', 'Inspiration'],
  'Contribution': ['Service', 'Contribution', 'Legacy', 'Impact', 'Teaching', 'Stewardship', 'Justice', 'Leadership', 'Mentorship', 'Making a difference', 'Helping', 'Peace', 'Sustainability', 'Empowering others'],
  'Freedom and adventure': ['Freedom', 'Independence', 'Adventure', 'Autonomy', 'Exploration', 'Spontaneity', 'Openness', 'Flexibility', 'Travel', 'Risk', 'Challenge', 'Boldness', 'Solitude', 'Space'],
  'Wellbeing': ['Health', 'Vitality', 'Calm', 'Balance', 'Rest', 'Simplicity', 'Peace of mind', 'Joy', 'Contentment', 'Gratitude', 'Presence', 'Serenity', 'Fun', 'Nature'],
  'Spirit': ['Faith', 'Spirituality', 'Awe', 'Meaning', 'Purpose', 'Transcendence', 'Reverence', 'Connection', 'Stillness', 'Surrender', 'Hope', 'Devotion', 'Unity', 'Truth'],
  'Achievement': ['Success', 'Recognition', 'Wealth', 'Security', 'Ambition', 'Status', 'Influence', 'Efficiency', 'Productivity', 'Financial independence', 'Winning', 'Power', 'Abundance', 'Stability'],
};
function masterValuesSeed(){
  const have = lifeArray('masterValues');
  Object.entries(MASTER_VALUES).forEach(([family, names]) => names.forEach(n => {
    if(!have.some(m => m.name === n && !m.userAdded)) have.push({id: 'mv-' + n.toLowerCase().replace(/[^a-z]+/g, '-'), name: n, family, userAdded: false});
  }));
}
const masterValuesAll = () => { masterValuesSeed(); return lifeArray('masterValues'); };

/* ---------- the thirty-day imprint ---------- */
function valuesImprintDone(){
  const adv = imprintAdvance('values');
  if(adv.changed){ practiceLogAdd('valuesreview', {minutes: 5}); if(adv.restarted) toast('The thirty days have to be consecutive, so this is day one again.', 6000); }
  saveNow();
}
/* each season the course says to refresh the list and redo the thirty days. That
   is a restart by design, not by a missed day, and the two are told apart. */
function valuesImprintSeasonal(){
  const i = imprintState('values');
  i.run = 0; i.lastDay = ''; i.startedOn = ''; i.seasonalResets = (i.seasonalResets || 0) + 1;
  practiceLogAdd('imprint-seasonal', {subjectRef: 'values'});
  saveNow();
}
function valuesReview(){
  const ids = (S.valueOrder || []).filter(id => byId(S.values, id));
  if(!ids.length){ toast('There are no values to review yet.'); return; }
  let i = 0, shown = false;
  const m = openModal('<div class="pp-rev" id="vrBox"></div>', 'wide plain');
  const draw = () => {
    const box = m.querySelector('#vrBox');
    if(i >= ids.length){
      valuesImprintDone();
      box.innerHTML = `<p class="serif pp-rev-text">Done.</p><div class="mono faint">${esc(imprintLine('values').text)}</div>
        <div class="row" style="justify-content:center"><button class="btn primary" id="vrClose">close</button></div>`;
      box.querySelector('#vrClose').onclick = () => { m.remove(); rerender(); }; return;
    }
    const v = byId(S.values, ids[i]);
    const def = verText((v.fields || {}).definition) || v.tagline || '';
    box.innerHTML = `<div class="mono faint">${i + 1} of ${ids.length}</div>
      <h2 class="serif" style="color:${esc(v.color)};font-size:2rem;margin:0">${esc(v.name)}</h2>
      <p class="pp-rev-text serif ${shown ? '' : 'blur'}">${def ? esc(def) : '<span class="faint">no definition written yet</span>'}</p>
      <p class="faint">${shown ? '' : 'Say what it means to you first. Then check.'}</p>
      <div class="row" style="gap:8px;justify-content:center">${shown ? '<button class="btn primary" id="vrNext">next</button>' : '<button class="btn primary" id="vrShow">reveal</button>'}<button class="btn sm ghost" id="vrX">close</button></div>`;
    const s = box.querySelector('#vrShow'); if(s) s.onclick = () => { shown = true; draw(); };
    const n = box.querySelector('#vrNext'); if(n) n.onclick = () => { i++; shown = false; draw(); };
    box.querySelector('#vrX').onclick = () => m.remove();
  };
  draw();
}

/* ---------- toxic values and the release exercise ---------- */
const negValues = () => lifeArray('negativeValues');
function negValueNew(name){
  name = String(name || '').trim(); if(!name) return null;
  const n = {id: uid(), name, theme: '', earliestIncident: '', whatItProtected: '', releases: [], at: new Date().toISOString(), updatedAt: new Date().toISOString()};
  negValues().push(n); saveNow(); return n;
}
function negValueRelease(id){
  const n = byId(negValues(), id); if(!n) return;
  const d = {theme: n.theme, incident: n.earliestIncident, protected: n.whatItProtected, shifted: ''};
  const run = () => ppFlow('A release', [
    {title: n.name, hint: 'Anything you are doing where <i>not</i> doing it makes you feel something bad will happen is a sign of trauma — and it does not have to be stereotypically traumatic.<br><span class="faint">This exercise reaches for early material and is not therapy; the course itself says therapy may be the best value for serious work.</span>',
     body: () => `<p class="serif" style="font-size:1.2rem">Hold this one in mind: <b>${esc(n.name)}</b>.</p>`},
    {title: 'What is the common theme?', hint: 'Across the places this shows up — what do they share?',
     body: () => `<textarea class="ta" rows="4" id="rlT">${esc(d.theme)}</textarea>`, next: b => { d.theme = b.querySelector('#rlT').value; }},
    {title: 'Which one was established earliest?', hint: 'Trace it back to the earliest incident you can find. You do not have to go further than you want to.',
     body: () => `<textarea class="ta" rows="4" id="rlI">${esc(d.incident)}</textarea>`, next: b => { d.incident = b.querySelector('#rlI').value; }},
    {title: 'What was it protecting?', hint: 'The mind built a defence mechanism. It was useful then. It is self-sabotaging now.',
     body: () => `<textarea class="ta" rows="4" id="rlP">${esc(d.protected)}</textarea>`, next: b => { d.protected = b.querySelector('#rlP').value; }},
    {title: 'Release it.', hint: 'Thank it for what it did. Let it go. Then: what shifted, if anything. A release is a session, not a cure — the course says to redo it every season.',
     body: () => `<textarea class="ta" rows="4" id="rlS" placeholder="Leave it empty if nothing did.">${esc(d.shifted)}</textarea>`, next: b => { d.shifted = b.querySelector('#rlS').value; }},
  ], () => {
    n.theme = d.theme.trim(); n.earliestIncident = d.incident.trim(); n.whatItProtected = d.protected.trim(); n.updatedAt = new Date().toISOString();
    const e = lifeEntryNew({type: 'reflection', title: 'A release — ' + n.name, body: [d.theme && 'Theme: ' + d.theme, d.incident && 'Earliest: ' + d.incident, d.protected && 'It was protecting: ' + d.protected, d.shifted && 'What shifted: ' + d.shifted].filter(Boolean).join('\n\n'), tags: ['release']});
    (n.releases = n.releases || []).push({id: uid(), at: new Date().toISOString(), whatShifted: d.shifted.trim(), entryId: e.id});
    saveNow(); sound('success'); toast('Kept. A release is a session, not a cure.'); rerender();
  }, {finish: 'Done'});
  if(typeof ceremonyVeil === 'function') ceremonyVeil(['Sit as you are.', 'Nothing here has to be solved.', 'Take as long as it takes.'], run, {label: 'a release'}); else run();
}

/* ---------- the strip at the head of the values page ---------- */
function valuesPurposeBarHTML(){
  const imp = imprintLine('values'), neg = negValues();
  return `<section class="section rv vp-bar">
    ${typeof ppTriangulationHTML === 'function' ? ppTriangulationHTML() : ''}
    <div class="vp-imp"><div><span class="sc">thirty-day imprint</span> <b class="serif">${esc(imp.text)}</b>${imp.notes ? ` <span class="mono faint">${esc(imp.notes)}</span>` : ''}
        <div class="faint" style="font-size:.76rem">Five minutes a day on the list, thirty days in a row; a missed day restarts it, and nothing here can correct it by hand. A restart each season is by design and is kept apart from a missed day.</div></div>
      <div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn sm primary" id="vpReview" ${(S.valueOrder || []).length ? '' : 'disabled'}>Five-minute review</button>
        <button class="btn sm ghost" id="vpSeason" title="a new season: refresh the list and begin the thirty days again">new season</button>
        <button class="btn sm ghost" id="vpRebuild">Rebuild the compass</button></div></div>
    <details class="vp-neg" ${neg.length ? 'open' : ''}><summary><span class="sc">Values working against you</span> <span class="mono faint">never ranked</span></summary>
      <p class="faint" style="font-size:.84rem">Information, not alarm. Naming one is the first move; the release is a session you can repeat each season.</p>
      ${neg.length ? neg.map(n => `<div class="vp-negrow"><b>${esc(n.name)}</b>${n.theme ? ` <span class="faint">— ${esc(n.theme.slice(0, 80))}</span>` : ''}
        <span class="mono faint">${(n.releases || []).length ? `${n.releases.length} release${n.releases.length === 1 ? '' : 's'}, last ${esc(fmtDate(n.releases[n.releases.length - 1].at.slice(0, 10), 'short'))}` : 'not yet released'}</span>
        <button class="btn sm" data-vprel="${n.id}">release</button><button class="del-x inline" data-vpnegdel="${n.id}" title="take it off the list">×</button></div>`).join('') : ''}
      <div class="row" style="gap:6px;margin-top:6px"><input class="inp" id="vpNegName" placeholder="a value that works against you" style="flex:1"><button class="btn sm" id="vpNegAdd">add</button></div>
    </details></section>`;
}
function bindValuesPurposeBar(root){
  const q = s => root.querySelector(s);
  if(q('#vpReview')) q('#vpReview').onclick = () => valuesReview();
  if(q('#vpSeason')) q('#vpSeason').onclick = () => { const m = openModal(`<h2>A new season</h2><p class="muted">Refresh the list and begin the thirty days again. This is recorded as a reset by design, not as a missed day.</p>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="vsGo">Begin again</button></div>`, 'narrow'); m.querySelector('#vsGo').onclick = () => { valuesImprintSeasonal(); m.remove(); rerender(); }; };
  if(q('#vpRebuild')) q('#vpRebuild').onclick = () => valuesBuilder();
  const add = () => { const i = q('#vpNegName'); if(negValueNew(i.value)){ rerender(); } };
  if(q('#vpNegAdd')) q('#vpNegAdd').onclick = add;
  if(q('#vpNegName')) q('#vpNegName').onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); add(); } };
  root.querySelectorAll('[data-vprel]').forEach(b => b.onclick = () => negValueRelease(b.dataset.vprel));
  root.querySelectorAll('[data-vpnegdel]').forEach(b => b.onclick = () => { const n = byId(negValues(), b.dataset.vpnegdel); if(!n) return;
    requestDelete({label: n.name, node: b.closest('.vp-negrow'), remove: () => spliceOut(S.negativeValues, x => x.id === n.id), after: () => rerender()}); });
}

/* ---------- rebuild the compass: eight passes, resumable ----------
   Brainstorm freely; work through the master list so nothing important is
   forgotten; name the toxic ones; narrow to ten; define each; rate; ask the
   gap question; release the negatives. The discriminating question is shown
   at the pass that needs it. */
const VB_DEFAULT = () => ({step: 0, brainstorm: '', picks: [], toxic: [], ten: [], defs: {}, ratings: {}, missing: {}, startedAt: new Date().toISOString()});
function valuesBuild(){ const p = purposeState(); if(!p.valuesBuild) p.valuesBuild = null; return p.valuesBuild; }
function valuesBuilder(){
  const p = purposeState();
  if(!p.valuesBuild){ p.valuesBuild = VB_DEFAULT(); saveNow(); }
  const bd = p.valuesBuild;
  const resume = bd.step > 0 || bd.brainstorm || bd.picks.length;
  const WORDS = t => purposeWords(t);
  const names = () => [...new Set(bd.picks)];
  const steps = [
    {title: 'Brainstorm, freely.', hint: 'Anything that feels like what you would want said about how you lived. Words, one to a line or separated by commas — no filtering yet.',
     body: () => `<textarea class="ta" rows="7" id="vbB" placeholder="e.g. wisdom, a place of my own, being useful, not being afraid">${esc(bd.brainstorm)}</textarea>`,
     next: b => { bd.brainstorm = b.querySelector('#vbB').value; bd.brainstorm.split(/[\n,;]+/).map(x => x.trim()).filter(x => x && x.length < 40 && !bd.picks.includes(x)).forEach(x => bd.picks.push(x)); }},
    {title: 'The master list.', hint: 'Go through it so nothing important is forgotten. <b>Which of these would be most meaningful and would make me most fulfilled to embody</b> — not which sound nice, and not which I wish I had.',
     body: () => `${masterFamiliesHTML(bd)}<div class="row" style="gap:6px;margin-top:8px"><input class="inp" id="vbAdd" placeholder="add one of your own" style="flex:1"><button class="btn sm" id="vbAddGo">add</button></div>`,
     bind: b => bindMasterFamilies(b, bd)},
    {title: 'Which of these are working against you?', hint: 'The toxic pass. Values you hold that are quietly costing you — they are kept apart, never ranked, and can be released later.',
     body: () => `<textarea class="ta" rows="5" id="vbT" placeholder="one to a line">${esc(bd.toxic.join('\n'))}</textarea>`,
     next: b => { bd.toxic = b.querySelector('#vbT').value.split('\n').map(x => x.trim()).filter(Boolean); }},
    {title: 'Narrow it to ten.', hint: 'Honing down to the most essential is the work. The compass holds ten as guidance — an eleventh is not blocked, only questioned. Order is rank.',
     body: () => { if(!bd.ten.length) bd.ten = names().slice(0, 10);
       return `<div class="mono faint" id="vbCount"></div><div id="vbTen"></div><div class="mono faint" style="margin-top:8px">left on the list: ${names().filter(x => !bd.ten.includes(x)).map(esc).join(', ') || 'nothing'}</div>
         <div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap" id="vbRest">${names().filter(x => !bd.ten.includes(x)).map(x => `<button class="chip" data-vbadd="${esc(x)}">+ ${esc(x)}</button>`).join('')}</div>`; },
     bind: b => bindNarrow(b, bd)},
    {title: 'Define each.', hint: 'In fifteen to twenty words, in your own terms. And what it would look like tangibly, and how you would know you embody it.',
     body: () => bd.ten.map((n, i) => { const d = bd.defs[n] || {};
       return `<div class="vb-def"><b class="serif">${esc(n)}</b>
         <textarea class="ta" rows="2" data-vbd="${i}|def" placeholder="What exactly does this mean to me? (15–20 words)">${esc(d.def || '')}</textarea><div class="mono faint" data-vbwc="${i}"></div>
         <textarea class="ta" rows="2" data-vbd="${i}|tan" placeholder="What would it look like tangibly?">${esc(d.tan || '')}</textarea>
         <textarea class="ta" rows="2" data-vbd="${i}|know" placeholder="How would I know if I embody this value?">${esc(d.know || '')}</textarea></div>`; }).join(''),
     bind: b => { const upd = () => b.querySelectorAll('[data-vbwc]').forEach(c => { const t = b.querySelector(`[data-vbd="${c.dataset.vbwc}|def"]`).value; const n = WORDS(t); c.textContent = n ? `${n} words` : ''; });
       b.querySelectorAll('[data-vbd]').forEach(t => t.oninput = upd); upd(); },
     next: b => { b.querySelectorAll('[data-vbd]').forEach(t => { const [i, k] = t.dataset.vbd.split('|'); const n = bd.ten[+i]; (bd.defs[n] = bd.defs[n] || {})[k] = t.value; }); }},
    {title: 'Rate your congruence.', hint: 'Where you actually are this week, 0–100. Not aspiration.',
     body: () => bd.ten.map((n, i) => { const cur = existingValueByName(n); const v = bd.ratings[n] != null ? bd.ratings[n] : (cur ? valueCurrent(cur.id) || 50 : 50);
       return `<div class="row between" style="gap:10px;padding:5px 0"><span style="min-width:10em">${esc(n)}</span><input type="range" class="slider" min="0" max="100" value="${v}" data-vbr="${i}"><span class="mono" data-vbrl="${i}">${v}</span></div>`; }).join(''),
     bind: b => b.querySelectorAll('[data-vbr]').forEach(r => r.oninput = () => { b.querySelector(`[data-vbrl="${r.dataset.vbr}"]`).textContent = r.value; }),
     next: b => { b.querySelectorAll('[data-vbr]').forEach(r => { bd.ratings[bd.ten[+r.dataset.vbr]] = +r.value; }); }},
    {title: 'Why is it not a ten?', hint: 'Only for those below ninety. What exactly would take it to ten? Specific and tangible — the thing that gets you there may not be the obvious one. One per line.',
     body: () => { const low = bd.ten.filter(n => (bd.ratings[n] != null ? bd.ratings[n] : 50) < 90);
       return low.length ? low.map(n => `<div class="field"><label>${esc(n)} <span class="mono faint">from ${congruenceCourse(bd.ratings[n] != null ? bd.ratings[n] : 50)} to 10</span></label><textarea class="ta" rows="2" data-vbm="${esc(n)}">${esc(bd.missing[n] || '')}</textarea></div>`).join('') : '<p class="faint">Everything is at ninety or above.</p>'; },
     next: b => { b.querySelectorAll('[data-vbm]').forEach(t => { bd.missing[t.dataset.vbm] = t.value; }); }},
    {title: 'Release, and commit.', hint: 'Release the toxic ones now if you want to — or later, from the values page. Committing replaces the compass; it is one ranking-history row, and nothing else is removed from your record.',
     body: () => `${bd.toxic.length ? `<div class="mono faint">to the “working against you” list: ${bd.toxic.map(esc).join(', ')}</div>` : ''}
       <div class="vb-leave">${(S.valueOrder || []).map(id => byId(S.values, id)).filter(v => v && !bd.ten.some(n => n.toLowerCase() === v.name.toLowerCase())).map(v => `<div class="mono faint">leaves the compass: ${esc(v.name)}</div>`).join('')}</div>
       <p class="faint">Your ten, in order: <b>${bd.ten.map(esc).join(' · ')}</b></p>`}];
  const m = ppFlow('Rebuild the compass', steps, () => { valuesBuildCommit(bd); }, {finish: 'Commit the new compass', startAt: resume ? bd.step : 0,
    onStep: i => { bd.step = i; saveNow(); }});
  return m;
}
function existingValueByName(n){ return (S.values || []).find(v => v.name.toLowerCase() === String(n).toLowerCase()) || null; }
function masterFamiliesHTML(bd){
  const lists = masterValuesAll();
  const fams = [...new Set(lists.map(m => m.family))];
  return fams.map(f => `<details ${bd.picks.some(n => lists.some(m => m.family === f && m.name === n)) ? 'open' : ''}><summary class="mono">${esc(f)}</summary><div class="deps">${lists.filter(m => m.family === f).map(m =>
    `<button class="chip ${bd.picks.includes(m.name) ? 'on' : ''}" data-vbm="${esc(m.name)}" data-fam="${esc(f)}">${esc(m.name)}</button>`).join('')}</div></details>`).join('')
    + `<details ${bd.picks.some(n => !lists.some(m => m.name === n)) ? 'open' : ''}><summary class="mono">yours</summary><div class="deps" id="vbMine">${bd.picks.filter(n => !lists.some(m => m.name === n)).map(n => `<button class="chip on" data-vbm="${esc(n)}">${esc(n)}</button>`).join('')}</div></details>`;
}
function bindMasterFamilies(b, bd){
  const tog = c => { const n = c.dataset.vbm; const i = bd.picks.indexOf(n); if(i >= 0){ bd.picks.splice(i, 1); c.classList.remove('on'); } else { bd.picks.push(n); c.classList.add('on'); } };
  b.querySelectorAll('[data-vbm]').forEach(c => c.onclick = () => tog(c));
  const add = () => { const inp = b.querySelector('#vbAdd'); const n = inp.value.trim(); if(!n) return; inp.value = '';
    if(!masterValuesAll().some(m => m.name === n)) masterValuesAll().push({id: uid(), name: n, family: 'yours', userAdded: true});
    if(!bd.picks.includes(n)) bd.picks.push(n);
    const chip = el(`<button class="chip on" data-vbm="${esc(n)}">${esc(n)}</button>`); chip.onclick = () => tog(chip); (b.querySelector('#vbMine') || b).appendChild(chip); saveNow(); };
  b.querySelector('#vbAddGo').onclick = add; b.querySelector('#vbAdd').onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); add(); } };
}
function bindNarrow(b, bd){
  const draw = () => {
    b.querySelector('#vbCount').textContent = `the compass has ${bd.ten.length} of ten points${bd.ten.length > 10 ? ' — honing down to the most essential is the work' : ''}`;
    b.querySelector('#vbTen').innerHTML = bd.ten.map((n, i) => `<div class="vb-ten"><span class="mono">${i + 1}</span><b>${esc(n)}</b>
      <button class="tbtn" data-vbup="${i}" ${i ? '' : 'disabled'}>▲</button><button class="tbtn" data-vbdn="${i}" ${i < bd.ten.length - 1 ? '' : 'disabled'}>▼</button><button class="del-x inline" data-vbout="${i}">×</button></div>`).join('');
    b.querySelectorAll('[data-vbup]').forEach(x => x.onclick = () => { const i = +x.dataset.vbup; [bd.ten[i - 1], bd.ten[i]] = [bd.ten[i], bd.ten[i - 1]]; draw(); });
    b.querySelectorAll('[data-vbdn]').forEach(x => x.onclick = () => { const i = +x.dataset.vbdn; [bd.ten[i + 1], bd.ten[i]] = [bd.ten[i], bd.ten[i + 1]]; draw(); });
    b.querySelectorAll('[data-vbout]').forEach(x => x.onclick = () => { bd.ten.splice(+x.dataset.vbout, 1); draw(); b.querySelector('#vbRest').innerHTML = names2().filter(n => !bd.ten.includes(n)).map(n => `<button class="chip" data-vbadd="${esc(n)}">+ ${esc(n)}</button>`).join(''); bindAdds(); });
  };
  const names2 = () => [...new Set(bd.picks)];
  const bindAdds = () => b.querySelectorAll('[data-vbadd]').forEach(x => x.onclick = () => { bd.ten.push(x.dataset.vbadd); x.remove(); draw(); });
  draw(); bindAdds();
}
/* The last pass: one ranking-history row, however many values moved. A name
   that matches an existing value keeps that value (its colour, its entries,
   its four questions); a new one is made; one that is not in the ten leaves
   the compass, with its entries kept and simply unlinked. */
function valuesBuildCommit(bd){
  const palette = ['#7f916a', '#c9975c', '#a0727e', '#5c7c8a', '#b08968', '#8a8d8f', '#6b7f8e', '#d4a44c', '#9c6b8a', '#6f8f86'];
  const ids = [];
  bd.ten.forEach((n, i) => {
    let v = existingValueByName(n);
    if(!v){ v = {id: 'v-' + uid(), name: n, tagline: '', color: palette[i % palette.length], fields: {embody: [], hundred: [], motivation: [], counterfeit: []}, practices: []}; S.values.push(v); }
    v.fields = v.fields || {embody: [], hundred: [], motivation: [], counterfeit: []}; v.fields.definition = v.fields.definition || [];
    const d = bd.defs[n] || {};
    const put = (arr, text) => { text = (text || '').trim(); if(text && !(arr.length && arr[arr.length - 1].text === text)) arr.push({date: today(), text}); };
    if(d.def && d.def.trim()){ v.tagline = d.def.trim(); put(v.fields.definition, d.def); }
    put(v.fields.hundred = v.fields.hundred || [], d.tan); put(v.fields.embody = v.fields.embody || [], d.know);
    ids.push(v.id);
  });
  (S.valueOrder || []).filter(id => !ids.includes(id)).forEach(id => {
    S.entries.filter(e => (e.links?.values || []).some(x => x.id === id)).forEach(e => { e.links.values = e.links.values.filter(x => x.id !== id); });
    S.habits.filter(h => (h.links?.values || []).includes(id)).forEach(h => { h.links.values = h.links.values.filter(x => x !== id); });
    S.values = S.values.filter(v => v.id !== id);
  });
  S.valueOrderHistory.push({date: today(), order: [...(S.valueOrder || [])], reason: 'rebuilt the compass'});
  S.valueOrder = ids;
  /* one reading for the new list, with the missing points attached */
  const ratings = {}, missingPoints = {}, notes = {};
  bd.ten.forEach(n => { const v = existingValueByName(n); if(!v) return; ratings[v.id] = bd.ratings[n] != null ? bd.ratings[n] : 50;
    const lines = (bd.missing[n] || '').split('\n').map(x => x.trim()).filter(Boolean);
    if(lines.length && ratings[v.id] < 90) missingPoints[v.id] = lines.map(text => ({text, at: new Date().toISOString(), goalId: null})); });
  if(Object.keys(ratings).length) S.valueSnapshots.push({id: uid(), date: today(), ratings, notes, missingPoints, note: 'when the compass was rebuilt'});
  (bd.toxic || []).forEach(n => { if(!negValues().some(x => x.name.toLowerCase() === n.toLowerCase())) negValueNew(n); });
  purposeState().valuesBuild = null;
  /* a rebuilt list is a new season by design */
  valuesImprintSeasonal();
  saveNow(); sound('success'); toast('The compass is rebuilt.'); rerender();
}
