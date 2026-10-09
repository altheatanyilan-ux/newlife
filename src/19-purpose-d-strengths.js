/* ============================================================
   SIGNATURE STRENGTHS — the register (#/purpose/strengths)

   A strength is not a skill. A skill has levels, criteria, an atrophy curve;
   it is something you build. A strength is something you have, which you
   either express or leave unused. Modelling one as a skill would put a level
   on something that has none, which is the thing the Skill Tree is careful
   never to do.

   So this is a ranked list, each with a gloss and a shadow kept as versions,
   an expression reading taken on its own dated snapshots, and links — to
   skills, to values — which are what make it more than a list.

   The course's own survey lives on a third-party site. This register takes a
   manual list or a pasted block and parses nothing automatically beyond
   splitting on blank lines, and it says so: adding a network call to save one
   paste would break the one promise the house makes.
   ============================================================ */

purposeTabAdd({id: 'strengths', label: 'Strengths', order: 20, render: (body) => strengthsRender(body)});

function strengthParsePaste(text){
  return String(text || '').split(/\n\s*\n/).map(b => b.trim()).filter(Boolean).map(b => {
    const lines = b.split('\n').map(l => l.trim()).filter(Boolean);
    let name = lines[0].replace(/^[\d.\-\u2022*)\s]+/, '').trim(), rest = lines.slice(1).join(' ');
    if(!rest){ const m = /^(.{2,60}?)\s*[:\u2013\u2014-]\s+(.+)$/.exec(name); if(m){ name = m[1]; rest = m[2]; } }
    return {name: name.slice(0, 80), surveyText: rest};
  }).filter(x => x.name);
}
function strengthsLastSnapshot(){ const xs = lifeArray('strengthSnapshots'); return xs.length ? xs[xs.length - 1] : null; }
function strengthCardHTML(s, i, total){
  const links = strengthLinkCount(s);
  const gloss = verLatest(s.gloss), shadow = verLatest(s.shadow);
  const snap = strengthsLastSnapshot();
  const expr = snap && snap.ratings[s.id] != null ? snap.ratings[s.id] : null;
  const skillsAll = S.skills || [];
  const chips = (arr, ids, kind) => arr.map(o => `<button class="chip ${ids.includes(o.id) ? 'on' : ''}" data-stlink="${s.id}|${kind}|${o.id}">${esc(o.name)}</button>`).join('');
  return `<article class="st-card" draggable="true" data-stid="${s.id}">
    <header class="st-head"><span class="st-rank mono">${i + 1}</span>
      <h3 class="serif">${esc(s.name)}</h3>
      <span class="st-move"><button class="tbtn" data-stup="${s.id}" ${i === 0 ? 'disabled' : ''} title="up">▲</button>
        <button class="tbtn" data-stdown="${s.id}" ${i === total - 1 ? 'disabled' : ''} title="down">▼</button>
        <button class="del-x inline" data-stdel="${s.id}" title="take this one off the list">×</button></span></header>
    ${s.surveyText ? `<details class="st-survey"><summary class="mono faint">what the survey said</summary><p>${esc(s.surveyText)}</p></details>` : ''}
    <div class="st-field"><label class="sc">What it means to me</label>
      <p class="st-text">${gloss ? esc(gloss.text) : '<span class="faint">Not yet written — your own words, after the gut check: is this authentic, or did it get chosen out of obligation?</span>'}</p>
      <div class="row" style="gap:6px"><button class="btn sm ghost" data-stedit="${s.id}|gloss">${gloss ? 'write a new version' : 'write'}</button>
        ${s.gloss.length > 1 ? `<span class="mono faint">${s.gloss.length - 1} earlier</span>` : ''}</div></div>
    <div class="st-field"><label class="sc">The shadow — the backside of this, and where it has cost me</label>
      <p class="st-text">${shadow ? esc(shadow.text) : '<span class="faint">Every strength has one. An extrovert may be poor at being alone.</span>'}</p>
      <div class="row" style="gap:6px"><button class="btn sm ghost" data-stedit="${s.id}|shadow">${shadow ? 'write a new version' : 'write'}</button>
        ${s.shadow.length > 1 ? `<span class="mono faint">${s.shadow.length - 1} earlier</span>` : ''}</div></div>
    <div class="st-links">
      <div class="mono faint">${links.any ? `expressed in ${links.skills} of your skills in play and ${links.zone} of your genius-zone activities` : 'nothing in the house currently points at this one'}</div>
      ${skillsAll.length ? `<details><summary class="mono faint">link to skills</summary><div class="deps">${chips(skillsAll.filter(x => (typeof skillHorizon === 'function' ? skillHorizon(x) : 'active') !== 'someday'), s.links.skillIds, 'skillIds')}</div></details>` : ''}
      ${(S.valueOrder || []).length ? `<details><summary class="mono faint">link to values</summary><div class="deps">${chips((S.valueOrder || []).map(id => byId(S.values, id)).filter(Boolean), s.links.valueIds, 'valueIds')}</div></details>` : ''}
    </div>
    ${expr != null ? `<div class="mono faint">expressed at ${expr} in the last reading (${esc(fmtDate(snap.date, 'med'))})</div>` : ''}
  </article>`;
}
function strengthsMorningHTML(){
  const xs = strengthsAll(); if(!xs.length) return '';
  const T = today();
  const day = Math.floor(parseDay(T).getTime() / 86400000);
  const s = xs[day % Math.min(xs.length, 5)];
  const qi = strengthCloser(s, T);
  const done = s.lastReviewedAt && s.lastReviewedAt.slice(0, 10) === T;
  return `<section class="st-morning"><div class="sc">this morning’s strength</div>
    <h3 class="serif">${esc(s.name)}</h3>
    <p class="serif st-q">${esc(PURPOSE_CLOSERS[qi])}</p>
    ${qi === 0 && verLatest(s.gloss) ? `<details><summary class="mono faint">check against what you wrote</summary><p>${esc(verLatest(s.gloss).text)}</p></details>` : ''}
    ${done ? '<div class="mono faint">looked at today</div>' : `<textarea class="ta" id="stAns" rows="2" placeholder="A line is enough."></textarea>
      <div class="row" style="gap:8px;margin-top:6px"><button class="btn sm primary" id="stAnsGo">done</button>
        ${qi === 2 ? '<button class="btn sm ghost" id="stAnsInt">make this today’s intention</button>' : ''}</div>`}
  </section>`;
}
function strengthsRender(body){
  const xs = strengthsAll();
  const retake = strengthsRetakeDue();
  body.innerHTML = `<div class="st-wrap">
    <p class="faint st-lede">The deepest satisfaction comes from building and using your signature strengths, not from correcting weaknesses. The question to ask is how much of your life and work is aligned with them. Read the labels, do a gut check on whether each is authentic, and discard anything chosen out of obligation rather than because it is true of you.</p>
    ${retake ? '<div class="st-retake mono">It has been a year since the ranking was last set. The course says to retake it — the old list is kept.<button class="btn sm" id="stRetake">retake</button></div>' : ''}
    ${strengthsMorningHTML()}
    ${xs.length ? `<div class="st-list" id="stList">${xs.map((s, i) => strengthCardHTML(s, i, xs.length)).join('')}</div>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn sm" id="stAdd">add one</button>
        <button class="btn sm ghost" id="stPaste">paste a list</button>
        <button class="btn sm ghost" id="stRead">take a reading</button></div>
      ${ppStrengthHistoryHTML()}`
    : `<div class="st-empty">
        <p class="faint">Five strengths, ranked. No samples are prefilled, because the course warns specifically against picking the ones that sound good.</p>
        <div class="pp-grid">${[1, 2, 3, 4, 5].map(n => `<div class="pp-q"><span class="sc">strength ${n}</span></div>`).join('')}</div>
        <textarea class="ta" id="stPasteBox" rows="6" placeholder="Paste the list — a blank line between each strength; the first line is its name, any lines after it are the description. Nothing is parsed beyond that."></textarea>
        <div class="row" style="gap:8px;margin-top:8px"><button class="btn primary" id="stPasteGo">add these</button>
          <button class="btn ghost" id="stAdd">add one by hand</button></div></div>`}
  </div>`;
  strengthsBind(body);
}
function ppStrengthHistoryHTML(){
  const h = lifeArray('strengthRankHistory');
  if(h.length < 2) return '';
  return `<details class="pp-vers"><summary class="mono">how the ranking has changed</summary>
    ${h.slice().reverse().slice(0, 30).map(r => `<div class="pp-v"><span class="mono faint">${esc(fmtDate(r.at.slice(0, 10), 'med'))}</span> ${esc(r.reason || '')}
      <div class="mono faint">${(r.names || []).map((n, i) => (i + 1) + '. ' + esc(n)).join(' · ')}</div></div>`).join('')}</details>`;
}
function strengthsBind(body){
  const re = () => { saveNow(); rerender(); };
  const q = s => body.querySelector(s);
  if(q('#stAdd')) q('#stAdd').onclick = () => {
    const m = openModal(`<h2>A strength</h2><div class="field"><label>Its name</label><input class="inp" id="stN" autofocus></div>
      <div class="field"><label>What the survey said about it (optional)</label><textarea class="ta" id="stD" rows="3"></textarea></div>
      <div class="row" style="justify-content:flex-end"><button class="btn primary" id="stGo">Add</button></div>`, 'narrow');
    m.querySelector('#stGo').onclick = () => { if(strengthNew({name: m.querySelector('#stN').value, surveyText: m.querySelector('#stD').value})){ m.remove(); re(); } };
  };
  const pasteGo = (text, retake) => {
    const items = strengthParsePaste(text); if(!items.length) return;
    if(retake){
      const old = strengthsAll().slice();
      const next = items.map(it => { const hit = old.find(o => o.name.toLowerCase() === it.name.toLowerCase());
        if(hit){ if(it.surveyText) hit.surveyText = it.surveyText; return hit; }
        return {id: uid(), name: it.name, surveyText: it.surveyText, gloss: [], shadow: [], links: {skillIds: [], valueIds: [], zoneItemIds: [], beliefIds: []}, at: new Date().toISOString(), lastReviewedAt: '', source: 'survey'}; });
      S.strengths = next; strengthRankLog('annual retake');
    } else items.forEach(it => strengthNew({name: it.name, surveyText: it.surveyText, source: 'survey'}));
    re();
  };
  if(q('#stPasteGo')) q('#stPasteGo').onclick = () => pasteGo(q('#stPasteBox').value, false);
  const pasteModal = retake => { const m = openModal(`<h2>${retake ? 'Retake the list' : 'Paste a list'}</h2>
      <p class="faint">A blank line between strengths. First line: the name. Any lines after: the description. ${retake ? 'Names that match one you have keep their wording; the old ranking stays in the history.' : ''}</p>
      <textarea class="ta" id="stPB" rows="9"></textarea>
      <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn primary" id="stGo">Use this list</button></div>`);
    m.querySelector('#stGo').onclick = () => { const t = m.querySelector('#stPB').value; m.remove(); pasteGo(t, retake); }; };
  if(q('#stPaste')) q('#stPaste').onclick = () => pasteModal(false);
  if(q('#stRetake')) q('#stRetake').onclick = () => pasteModal(true);
  body.querySelectorAll('[data-stup]').forEach(b => b.onclick = () => { const i = strengthsAll().findIndex(s => s.id === b.dataset.stup); strengthMove(b.dataset.stup, i - 1); rerender(); });
  body.querySelectorAll('[data-stdown]').forEach(b => b.onclick = () => { const i = strengthsAll().findIndex(s => s.id === b.dataset.stdown); strengthMove(b.dataset.stdown, i + 1); rerender(); });
  body.querySelectorAll('[data-stdel]').forEach(b => b.onclick = () => { const s = byId(strengthsAll(), b.dataset.stdel); if(!s) return;
    requestDelete({label: s.name, node: b.closest('.st-card'), remove: () => { const back = spliceOut(S.strengths, x => x.id === s.id); strengthRankLog('took ' + s.name + ' off the list'); return back; }, after: () => rerender()}); });
  body.querySelectorAll('[data-stedit]').forEach(b => b.onclick = () => {
    const [id, field] = b.dataset.stedit.split('|'); const s = byId(strengthsAll(), id); if(!s) return;
    const m = openModal(`<h2>${esc(s.name)} — ${field === 'gloss' ? 'what it means to me' : 'the shadow'}</h2>
      <textarea class="ta" id="stT" rows="5" autofocus>${esc(verText(s[field]))}</textarea>
      <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn primary" id="stGo">Save</button></div>`);
    m.querySelector('#stGo').onclick = () => { verSave(s[field], m.querySelector('#stT').value, {force: true}); m.remove(); re(); }; });
  body.querySelectorAll('[data-stlink]').forEach(b => b.onclick = () => {
    const [id, kind, oid] = b.dataset.stlink.split('|'); const s = byId(strengthsAll(), id); if(!s) return;
    const a = s.links[kind] = s.links[kind] || []; const i = a.indexOf(oid); if(i >= 0) a.splice(i, 1); else a.push(oid); re(); });
  /* drag to rank */
  let dragId = null;
  body.querySelectorAll('.st-card').forEach(c => {
    c.addEventListener('dragstart', e => { dragId = c.dataset.stid; try { e.dataTransfer.setData('text/plain', dragId); } catch(_){} });
    c.addEventListener('dragover', e => { e.preventDefault(); });
    c.addEventListener('drop', e => { e.preventDefault(); if(!dragId || dragId === c.dataset.stid) return;
      const to = strengthsAll().findIndex(s => s.id === c.dataset.stid); strengthMove(dragId, to); dragId = null; rerender(); });
  });
  /* the morning card */
  const xs = strengthsAll();
  const day = Math.floor(parseDay(today()).getTime() / 86400000);
  const s = xs.length ? xs[day % Math.min(xs.length, 5)] : null;
  const fin = intention => { const t = q('#stAns').value.trim();
    if(t.split(/\s+/).length > 12) lifeEntryNew({type: 'reflection', title: `${s.name} — ${PURPOSE_CLOSERS[strengthCloser(s)]}`, body: t, tags: ['strengths']});
    if(intention){ if(!t){ toast('Write the line first.'); return; } checkin().intention = t; toast('That is today’s intention.'); }
    s.lastReviewedAt = new Date().toISOString(); re(); };
  if(q('#stAnsGo')) q('#stAnsGo').onclick = () => fin(false);
  if(q('#stAnsInt')) q('#stAnsInt').onclick = () => fin(true);
  if(q('#stRead')) q('#stRead').onclick = () => strengthsReading(re);
}
/* a reading of how much of life and work currently expresses each one. Sliders
   start where the last reading left them, because a figure invented from
   memory drifts. */
function strengthsReading(after){
  const last = strengthsLastSnapshot();
  const xs = strengthsAll();
  const m = openModal(`<h2>How much of your life and work expresses each?</h2>
    <p class="muted">0–100. Where you actually are this week.${last ? ` Sliders start where you left them on ${esc(fmtDate(last.date, 'med'))}.` : ''}</p>
    ${xs.map(s => { const v = last && last.ratings[s.id] != null ? last.ratings[s.id] : 50;
      return `<div class="row between" style="gap:10px;padding:5px 0"><span style="min-width:9em">${esc(s.name)}</span>
        <input type="range" min="0" max="100" value="${v}" data-strd="${s.id}" class="slider"><span class="mono" data-strl="${s.id}">${v}</span></div>`; }).join('')}
    <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary" id="strGo">Keep this reading</button></div>`);
  m.querySelectorAll('[data-strd]').forEach(r => r.oninput = () => { m.querySelector(`[data-strl="${r.dataset.strd}"]`).textContent = r.value; });
  m.querySelector('#strGo').onclick = () => { const ratings = {}; m.querySelectorAll('[data-strd]').forEach(r => ratings[r.dataset.strd] = +r.value);
    lifeArray('strengthSnapshots').push({id: uid(), date: today(), ratings, note: ''}); saveNow(); m.remove(); sound('success'); if(after) after(); };
}
