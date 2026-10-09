/* ============================================================
   THE PURPOSE SHEET — the room (#/purpose)

   One route, several tabs, each added by the file that owns it (strengths,
   the vision, the demons…). The first tab is the sheet itself, in three
   modes: read (the page you would pin up), the two-minute morning review
   (active recall, not passive reading), and edit (each artefact versioned).

   The course's instruction is specific: review it for two minutes every
   morning, on paper if you can. So the sheet prints, and prints alone.
   ============================================================ */

const PURPOSE_TABS = [];   // {id, label, order, render(body, rest)}
function purposeTabAdd(t){ if(!PURPOSE_TABS.some(x => x.id === t.id)) PURPOSE_TABS.push(t); PURPOSE_TABS.sort((a, b) => (a.order || 50) - (b.order || 50)); }
purposeTabAdd({id: 'sheet', label: 'The sheet', order: 10, render: (body) => purposeSheetRender(body)});

NAV_ICONS.purpose = '<svg viewBox="0 0 24 24"><path d="M12 3.2l2.3 6.6 6.7.4-5.2 4.3 1.8 6.7-5.6-3.8-5.6 3.8 1.8-6.7L3 10.2l6.7-.4z"/></svg>';
NAV_PAGES.purpose = {label: 'Purpose', short: 'Purpose', ico: NAV_ICONS.purpose, route: '#/purpose'};
if(!NAV_DEFAULT.identity.includes('purpose')) NAV_DEFAULT.identity.splice(1, 0, 'purpose');

routes.purpose = function(root, params){
  migratePurpose();
  const want = params && params[0] ? params[0] : 'sheet';
  const tab = PURPOSE_TABS.find(t => t.id === want) || PURPOSE_TABS[0];
  const p = purposeState();
  if(!p.openedAt){ p.openedAt = new Date().toISOString(); }
  root.innerHTML = `<div class="page pp-page" data-pptab="${esc(tab.id)}">
    <div class="page-head"><div class="mono">the thing everything else answers to</div><h1>Purpose</h1></div>
    <nav class="pp-tabs" aria-label="Purpose">${PURPOSE_TABS.map(t =>
      `<a href="#/purpose${t.id === 'sheet' ? '' : '/' + t.id}" class="${t.id === tab.id ? 'on' : ''}">${esc(t.label)}</a>`).join('')}</nav>
    <div class="pp-body" id="ppBody"></div></div>`;
  tab.render(root.querySelector('#ppBody'), params ? params.slice(1) : []);
};

/* ---------- the sheet ---------- */
function ppFieldHTML(k){
  const f = PURPOSE_FIELDS[k], p = purposeState(), cur = verLatest(p[k]);
  const text = cur ? cur.text : '';
  const extra = k === 'medium' && cur ? `<span class="pp-rung mono">${esc(PURPOSE_RUNGS[cur.rung || 0] || 'hunch')}</span>` : '';
  const domainCats = k === 'domain' && cur && cur.skillCategories && cur.skillCategories.length
    ? `<div class="pp-cats mono faint">${cur.skillCategories.map(esc).join(' · ')}</div>` : '';
  return `<section class="pp-art ${k === 'statement' ? 'pp-statement' : ''}">
    <div class="pp-label"><span class="sc">${esc(f.label)}</span>${extra}</div>
    ${text ? `<p class="pp-text serif">${esc(text)}</p>${domainCats}` : `<p class="pp-ask faint">${esc(f.q)}</p>`}
    ${text && typeof canonLineHTML === 'function' ? canonLineHTML('purpose', 'sheet', k) : ''}
    ${text && typeof zoneThinkBtn === 'function' ? zoneThinkBtn('purpose', 'sheet', k) : ''}
  </section>`;
}
function ppValuesHTML(){
  const ids = (S.valueOrder || []).slice(0, 10);
  if(!ids.length) return '';
  return `<section class="pp-art"><div class="pp-label"><span class="sc">Top values</span><span class="mono faint">congruence, on the course’s 0–10</span></div>
    <ol class="pp-list">${ids.map(id => { const v = byId(S.values, id); if(!v) return '';
      const snaps = (S.valueSnapshots || []).length;
      return `<li><a href="#/identity/values/${esc(v.id)}" style="color:${esc(v.color)}">${esc(v.name)}</a>${snaps ? ` <span class="mono faint">${congruenceCourse(valueCurrent(v.id))}</span>` : ''}</li>`; }).join('')}</ol></section>`;
}
function ppStrengthsHTML(){
  const xs = strengthsAll().slice(0, 5);
  if(!xs.length) return '';
  return `<section class="pp-art"><div class="pp-label"><span class="sc">Top strengths</span></div>
    <ol class="pp-list">${xs.map(s => `<li><a href="#/purpose/strengths">${esc(s.name)}</a></li>`).join('')}</ol></section>`;
}
function ppGoalsHTML(){
  const gs = (typeof perfActive === 'function' ? perfActive() : []).slice(0, 5);
  if(!gs.length) return '';
  return `<section class="pp-art"><div class="pp-label"><span class="sc">Goals in play</span></div>
    <ol class="pp-list">${gs.map(g => `<li><a href="#/today/time/goals">${esc(g.title || 'A goal')}</a>${purposeScreened(g) ? '' : ' <span class="mono faint">not yet put to the sheet</span>'}</li>`).join('')}</ol></section>`;
}
function ppDropHTML(){
  const xs = lifeArray('habitsToDrop').slice(0, 5);
  if(!xs.length) return '';
  return `<section class="pp-art"><div class="pp-label"><span class="sc">Habits to eliminate</span></div>
    <ol class="pp-list">${xs.map(h => `<li>${esc(h.habit || h.name || "")}${h.replacement ? ` <span class="mono faint">→ ${esc(h.replacement)}</span>` : ''}</li>`).join('')}</ol></section>`;
}
/* the one comparison that matters: the top three values, the top three
   strengths and the stated domain, on one line. It never computes agreement. */
function ppTriangulationHTML(){
  const vals = (S.valueOrder || []).slice(0, 3).map(id => (byId(S.values, id) || {}).name).filter(Boolean);
  const stren = strengthsAll().slice(0, 3).map(s => s.name);
  const dom = purposeText('domain');
  if(vals.length < 3 || !dom) return '';
  return `<p class="pp-tri">Your top three values are <b>${vals.map(esc).join('</b>, <b>')}</b>${stren.length >= 3 ? `, your top three strengths <b>${stren.map(esc).join('</b>, <b>')}</b>` : ''}. The course’s claim is that the domain of your life purpose sits where those meet — your stated domain is <b>${esc(dom)}</b>.</p>`;
}
function ppImprintHTML(){
  const l = imprintLine('purpose');
  return `<div class="pp-imprint"><div><span class="sc">ninety-day purpose imprint</span>
      <div class="pp-imp-line serif">${esc(l.text)}</div>
      ${l.notes ? `<div class="mono faint">${esc(l.notes)}</div>` : ''}</div>
    <div class="pp-imp-bar" aria-hidden="true">${Array.from({length: 18}, (_, i) => `<i class="${i < Math.round(Math.min(1, l.run / l.target) * 18) ? 'on' : ''}"></i>`).join('')}</div>
    <p class="faint pp-rule">This is the one counter in the house you cannot correct by hand. A day counts if you made any one of the contacts — the morning review, an affirmation, a contemplation, a purpose visualisation — and the days have to be consecutive, because the consecutiveness is the mechanism, not the bookkeeping.</p></div>`;
}
function ppScreeningHTML(){
  const rep = purposeScreening().filter(g => g.total);
  if(!rep.length) return '';
  const unscreened = rep.reduce((n, g) => n + g.open.length, 0);
  const chip = (o, k) => `<button class="chip ${purposeRefs(o).includes(k) ? 'on' : ''}" data-ppref="${esc(o.id)}|${k}" title="put this to ${esc(k === 'values' ? 'your values' : PURPOSE_FIELDS[k].label)}">${esc(k === 'values' ? 'values' : PURPOSE_FIELDS[k].short)}</button>`;
  return `<section class="pp-screen"><div class="pp-label"><span class="sc">Put to the sheet</span></div>
    <p class="faint">${rep.map(g => `${g.screened} of ${g.total} ${esc(g.label)}`).join(' · ')}.
      ${unscreened ? 'These are not mistakes; they are the things that have not yet been put to the sheet.' : 'Everything in play names something on the sheet.'}</p>
    ${rep.filter(g => g.open.length).map(g => `<div class="pp-open"><div class="mono faint">${esc(g.label)}</div>
      ${g.open.slice(0, 12).map(i => `<div class="pp-open-row"><a href="${esc(i.go)}">${esc(i.label)}</a>
        <span class="pp-chips">${PURPOSE_KEYS.filter(purposeHas).concat(purposeHas('values') ? ['values'] : []).map(k => chip(i.o, k)).join('')}</span></div>`).join('')}
      ${g.open.length > 12 ? `<div class="mono faint">and ${g.open.length - 12} more</div>` : ''}</div>`).join('')}
  </section>`;
}
function ppFearsHTML(){
  const n = typeof fearCompass === 'function' ? fearCompass().length : 0;
  return n ? `<p class="faint pp-commit">${n} compass fear${n === 1 ? '' : 's'} \u2014 fear pointing the way a purpose is supposed to scare you. <a href="#/purpose/demons">the fear inventory</a></p>` : '';
}
function ppCommitmentsHTML(){
  const cs = S.entries.filter(e => e.type === 'letter' && e.extra && e.extra.commitment);
  if(!cs.length) return '<p class="faint pp-commit"><button class="btn sm ghost" id="ppCommit">Make a commitment</button></p>';
  const open = cs.filter(e => !e.extra.openedAt).length;
  return `<p class="faint pp-commit">${cs.length} commitment${cs.length === 1 ? '' : 's'}, ${open} open. <button class="btn sm ghost" id="ppCommit">make one</button></p>`;
}
function purposeSheetRender(body){
  const p = purposeState();
  const empty = !purposeAny();
  const mode = empty && p.mode === 'read' ? 'empty' : p.mode;
  if(mode === 'edit'){ return ppEditRender(body); }
  if(mode === 'empty'){
    body.innerHTML = `<div class="pp-empty">
      <p class="serif pp-intro">This is the page that says what everything else is for. It is written once you know — and not before.</p>
      ${PURPOSE_KEYS.map(k => `<div class="pp-q"><span class="sc">${esc(PURPOSE_FIELDS[k].label)}</span><p class="faint">${esc(PURPOSE_FIELDS[k].q)}</p></div>`).join('')}
      <div class="row" style="gap:8px;margin-top:14px">
        <button class="btn primary" id="ppBuild">build it with me</button>
        <button class="btn ghost" id="ppWrite">I know some of it — write it</button></div></div>`;
    body.querySelector('#ppBuild').onclick = () => navigate(PURPOSE_TABS.some(t => t.id === 'genius') ? '#/purpose/genius' : '#/purpose/vision');
    body.querySelector('#ppWrite').onclick = () => { p.mode = 'edit'; saveNow(); rerender(); };
    return;
  }
  body.innerHTML = `<div class="pp-sheet">
    <div class="pp-actions row" style="gap:8px;flex-wrap:wrap">
      <button class="btn primary" id="ppReview">Morning review · two minutes</button>
      <button class="btn ghost" id="ppEdit">Edit</button>
      <button class="btn ghost" id="ppPrint">Print</button></div>
    ${ppImprintHTML()}
    <div class="pp-grid">${PURPOSE_KEYS.map(ppFieldHTML).join('')}</div>
    ${ppTriangulationHTML()}
    <div class="pp-grid pp-grid2">${ppValuesHTML()}${ppStrengthsHTML()}${ppGoalsHTML()}${ppDropHTML()}</div>
    ${ppCommitmentsHTML()}
    ${ppFearsHTML()}
    ${ppScreeningHTML()}
    ${typeof ppCandidatesHTML === 'function' ? ppCandidatesHTML() : ''}
    ${ppVersionsHTML()}
  </div>`;
  const q = s => body.querySelector(s);
  q('#ppReview').onclick = () => purposeReview();
  q('#ppEdit').onclick = () => { p.mode = 'edit'; saveNow(); rerender(); };
  q('#ppPrint').onclick = () => purposePrint();
  if(q('#ppCommit')) q('#ppCommit').onclick = () => openCommitmentModal();
  body.querySelectorAll('[data-ppref]').forEach(b => b.onclick = () => {
    const [id, k] = b.dataset.ppref.split('|');
    const o = purposeScreenGroups().flatMap(g => g.items.map(i => i.o)).find(x => x.id === id);
    if(o){ purposeToggleRef(o, k); rerender(); }
  });
  body.querySelectorAll('[data-ppcdel]').forEach(b => b.onclick = () => { p.candidates = (p.candidates || []).filter(c => c.id !== b.dataset.ppcdel); saveNow(); rerender(); });
  body.querySelectorAll('details.pp-vers').forEach(d => d.ontoggle = () => { p.foldVersions = !d.open; saveNow(); });
}
function ppVersionsHTML(){
  const p = purposeState();
  const any = PURPOSE_KEYS.some(k => p[k].length > 1);
  if(!any) return '';
  return `<details class="pp-vers" ${p.foldVersions ? '' : 'open'}><summary class="mono">earlier wordings</summary>
    ${PURPOSE_KEYS.filter(k => p[k].length > 1).map(k => `<div class="pp-vgroup"><div class="sc">${esc(PURPOSE_FIELDS[k].label)}</div>
      ${p[k].slice(0, -1).reverse().map(v => `<div class="pp-v"><span class="mono faint">${esc(fmtDate(v.at.slice(0, 10), 'med'))}</span> ${esc(v.text)}</div>`).join('')}</div>`).join('')}</details>`;
}

/* ---------- edit ---------- */
function ppEditRender(body){
  const p = purposeState();
  const skillCats = [...new Set((S.skills || []).map(s => s.category || s.cat).filter(Boolean))];
  body.innerHTML = `<div class="pp-edit">
    <div class="row" style="gap:8px"><button class="btn ghost" id="ppDone">← back to the sheet</button></div>
    ${PURPOSE_KEYS.map(k => { const f = PURPOSE_FIELDS[k], cur = verLatest(p[k]);
      return `<section class="pp-editf" data-ppk="${k}">
        <label class="sc">${esc(f.label)}</label>
        <p class="faint pp-help">${esc(f.help)}</p>
        <textarea class="ta" rows="${k === 'statement' ? 2 : 3}" placeholder="${esc(f.example ? 'e.g. ' + f.example : f.q)}">${esc(cur ? cur.text : '')}</textarea>
        ${k === 'statement' ? '<div class="pp-count mono faint" data-ppcount></div><div class="pp-flags faint" data-ppflags></div>' : ''}
        ${k === 'domain' ? `<div class="pp-catpick"><span class="mono faint">serves these Skill Tree categories</span> ${skillCats.length
            ? skillCats.map(c => `<button class="chip ${((cur && cur.skillCategories) || []).includes(c) ? 'on' : ''}" data-ppcat="${esc(c)}">${esc(c)}</button>`).join('')
            : '<span class="faint">no skill categories yet</span>'}</div>` : ''}
        ${k === 'medium' ? `<div class="ladder pp-ladder">${PURPOSE_RUNGS.map((r, i) =>
            `<button data-pprung="${i}" class="${((cur && cur.rung) || 0) === i ? 'on' : ''}">${esc(r)}</button>`).join('')}</div>` : ''}
        <div class="row" style="gap:8px;margin-top:6px"><button class="btn sm primary" data-ppsave="${k}">Save</button>
          <button class="btn sm ghost" data-ppver="${k}" title="keep the old wording as an earlier version even for a small edit">save as a new version</button>
          ${p[k].length > 1 ? `<span class="mono faint">${p[k].length - 1} earlier</span>` : ''}</div>
        ${p[k].length > 1 ? `<details class="pp-vers"><summary class="mono">earlier wordings</summary>${p[k].slice(0, -1).map((v, i) => `<div class="pp-v">
          <span class="mono faint">${esc(fmtDate(v.at.slice(0, 10), 'med'))}</span> ${esc(v.text)}
          <button class="del-x inline" data-ppdel="${k}|${i}" title="delete this earlier wording">×</button></div>`).join('')}</details>` : ''}
      </section>`; }).join('')}
  </div>`;
  const q = s => body.querySelector(s);
  q('#ppDone').onclick = () => { p.mode = 'read'; saveNow(); rerender(); };
  const stateOf = k => ({text: body.querySelector(`[data-ppk="${k}"] textarea`).value, cats: [...body.querySelectorAll(`[data-ppk="${k}"] [data-ppcat].on`)].map(b => b.dataset.ppcat),
    rung: (body.querySelector('.pp-ladder button.on') || {dataset: {pprung: 0}}).dataset.pprung});
  body.querySelectorAll('[data-ppcat]').forEach(b => b.onclick = () => b.classList.toggle('on'));
  body.querySelectorAll('[data-pprung]').forEach(b => b.onclick = () => { body.querySelectorAll('[data-pprung]').forEach(x => x.classList.toggle('on', x === b)); });
  const upd = () => { const t = body.querySelector('[data-ppk="statement"] textarea').value, n = purposeWords(t), fl = purposeVagueIn(t);
    body.querySelector('[data-ppcount]').textContent = n ? `${n} word${n === 1 ? '' : 's'} · ${n <= 15 ? 'under fifteen is the guidance' : `${n - 15} over the guidance`}` : '';
    body.querySelector('[data-ppflags]').innerHTML = fl.map(([w, why]) => `<span class="pp-flag" title="${esc(why)}">${esc(w)}</span>`).join(' ') + (fl.length ? ` <span class="mono">${fl.length} soft flag${fl.length === 1 ? '' : 's'} — hover for the reason; nothing blocks saving</span>` : ''); };
  body.querySelector('[data-ppk="statement"] textarea').addEventListener('input', upd); upd();
  const save = (k, force) => {
    const s = stateOf(k);
    const extra = k === 'domain' ? {skillCategories: s.cats} : k === 'medium' ? {rung: +s.rung} : null;
    const how = purposeSave(k, s.text, {force, extra});
    if(how === 'same' && extra){ const cur = verLatest(p[k]); if(cur){ Object.assign(cur, extra); saveNow(); } }
    toast(how === 'version' ? 'Saved. The earlier wording is kept.' : how === 'corrected' ? 'Saved as a correction — no new version for a small edit.' : how === 'first' ? 'Written.' : 'Saved.');
    rerender();
  };
  body.querySelectorAll('[data-ppsave]').forEach(b => b.onclick = () => save(b.dataset.ppsave, false));
  body.querySelectorAll('[data-ppver]').forEach(b => b.onclick = () => save(b.dataset.ppver, true));
  body.querySelectorAll('[data-ppdel]').forEach(b => b.onclick = () => {
    const [k, i] = b.dataset.ppdel.split('|'); const back = p[k].splice(+i, 1); saveNow(); rerender();
    toast('Earlier wording deleted.', 7000, {label: 'undo', fn: () => { p[k].splice(+i, 0, ...back); saveNow(); rerender(); }});
  });
}

/* ---------- the two-minute morning review: active recall ---------- */
function ppClosing(){
  const T = today();
  const pool = [];
  (S.valueOrder || []).slice(0, 3).forEach(id => { const v = byId(S.values, id); if(v) pool.push({kind: 'value', name: v.name, id: v.id}); });
  strengthsAll().slice(0, 3).forEach(s => pool.push({kind: 'strength', name: s.name, id: s.id}));
  if(!pool.length) return null;
  const day = Math.floor(parseDay(T).getTime() / 86400000);
  const subject = pool[day % pool.length];
  return {subject, qi: (day + subject.name.length) % PURPOSE_CLOSERS.length};
}
function purposeReview(){
  const p = purposeState();
  const steps = PURPOSE_KEYS.filter(purposeHas);
  if(!steps.length){ toast('Write something on the sheet first — there is nothing to recall yet.'); return; }
  const closing = ppClosing();
  let i = 0, revealed = false;
  const m = openModal('<div class="pp-rev" id="ppRev"></div>', 'wide plain');
  const draw = () => {
    const box = m.querySelector('#ppRev');
    if(i < steps.length){
      const k = steps[i], f = PURPOSE_FIELDS[k];
      box.innerHTML = `<div class="mono faint">${i + 1} of ${steps.length}${closing ? ' + a closing question' : ''}</div>
        <div class="sc">${esc(f.label)}</div>
        <p class="pp-rev-text serif ${revealed ? '' : 'blur'}">${esc(purposeText(k))}</p>
        <p class="faint">${revealed ? '' : 'Say it, or think it, first. Then check.'}</p>
        <div class="row" style="gap:8px;justify-content:center">${revealed
          ? '<button class="btn primary" id="ppNext">next</button>' : '<button class="btn primary" id="ppReveal">reveal</button>'}
          <button class="btn sm ghost" id="ppRevX">close</button></div>`;
      const rv = box.querySelector('#ppReveal'); if(rv) rv.onclick = () => { revealed = true; draw(); };
      const nx = box.querySelector('#ppNext'); if(nx) nx.onclick = () => { i++; revealed = false; draw(); };
    } else if(closing && i === steps.length){
      const subj = closing.subject, qtext = PURPOSE_CLOSERS[closing.qi];
      box.innerHTML = `<div class="mono faint">closing question · ${esc(subj.kind)}: ${esc(subj.name)}</div>
        <div class="sc">${esc(subj.name)}</div>
        <p class="serif pp-rev-text">${esc(qtext)}</p>
        <textarea class="ta" id="ppAns" rows="3" placeholder="A line is enough."></textarea>
        <div class="row" style="gap:8px;justify-content:center;margin-top:8px">
          <button class="btn primary" id="ppFin">done</button>
          <button class="btn ghost" id="ppSkip">skip it</button>
          ${closing.qi === 2 ? '<button class="btn ghost" id="ppInt">make this today’s intention</button>' : ''}</div>`;
      const finish = (text, skipped) => {
        if(text && text.trim().split(/\s+/).length > 12)
          lifeEntryNew({type: 'reflection', title: `${subj.name} — ${qtext}`, body: text.trim(), tags: ['purpose-review'],
            links: subj.kind === 'value' ? {values: [{id: subj.id, polarity: 1}]} : {}});
        purposeReviewDone(skipped);
        i++; draw();
      };
      box.querySelector('#ppFin').onclick = () => finish(box.querySelector('#ppAns').value, false);
      box.querySelector('#ppSkip').onclick = () => finish('', true);
      const it = box.querySelector('#ppInt'); if(it) it.onclick = () => {
        const t = box.querySelector('#ppAns').value.trim(); if(!t){ toast('Write the line first.'); return; }
        checkin().intention = t; toast('That is today’s intention.'); finish(t, false); };
    } else {
      if(!closing && !m._done){ m._done = true; purposeReviewDone(false); }
      box.innerHTML = `<p class="serif pp-rev-text">Done.</p>
        <div class="mono faint">${esc(imprintLine('purpose').text)}</div>
        <div class="row" style="justify-content:center;margin-top:10px"><button class="btn primary" id="ppClose">close</button></div>`;
      box.querySelector('#ppClose').onclick = () => { m.remove(); rerender(); };
    }
    const x = box.querySelector('#ppRevX'); if(x) x.onclick = () => { m.remove(); };
  };
  draw();
}
function purposeReviewDone(skipped){
  const p = purposeState();
  if(p.reviewedAt && p.reviewedAt.slice(0, 10) === today()){ saveNow(); return; }
  p.reviewedAt = new Date().toISOString();
  purposeContact('purposereview', {minutes: 2, subjectRef: skipped ? 'skipped' : ''});
  sound('success');
}

/* ---------- print: one page, no chrome ---------- */
function purposePrint(){
  const p = purposeState();
  const old = document.getElementById('ppPrintOnly'); if(old) old.remove();
  const vals = (S.valueOrder || []).slice(0, 10).map(id => byId(S.values, id)).filter(Boolean);
  const box = document.createElement('div'); box.id = 'ppPrintOnly';
  box.innerHTML = `<div class="ppp"><h1>${esc(purposeText('statement') || 'My purpose')}</h1>
    ${['genius', 'impact', 'domain', 'medium'].filter(purposeHas).map(k => `<p><b>${esc(PURPOSE_FIELDS[k].label)}.</b> ${esc(purposeText(k))}</p>`).join('')}
    ${vals.length ? `<p><b>Values.</b> ${vals.map((v, i) => `${i + 1}. ${esc(v.name)}`).join(' · ')}</p>` : ''}
    ${strengthsAll().length ? `<p><b>Strengths.</b> ${strengthsAll().slice(0, 5).map((s, i) => `${i + 1}. ${esc(s.name)}`).join(' · ')}</p>` : ''}
    ${(typeof perfActive === 'function' ? perfActive() : []).length ? `<p><b>Goals.</b> ${perfActive().slice(0, 5).map((g, i) => `${i + 1}. ${esc(g.title)}`).join(' · ')}</p>` : ''}
    <p class="ppp-foot">${esc(fmtDate(today(), 'med'))}</p></div>`;
  document.body.appendChild(box);
  document.body.classList.add('pp-printing');
  p.printedAt = new Date().toISOString(); saveNow();
  const clean = () => { document.body.classList.remove('pp-printing'); box.remove(); window.removeEventListener('afterprint', clean); };
  window.addEventListener('afterprint', clean);
  try { window.print(); } catch(e){ clean(); }
  setTimeout(() => { if(!document.body.classList.contains('pp-printing')) return; }, 0);
}

/* ---------- keys: P opens the sheet, R opens the review ---------- */
document.addEventListener('keydown', ev => {
  if(ev.metaKey || ev.ctrlKey || ev.altKey || ev.shiftKey) return;
  if(typeof isTyping === 'function' && isTyping()) return;
  if(document.querySelector('#modals .overlay, #panel')) return;
  const here = parseHash().name;
  if(['writing', 'content', 'score', 'jazz', 'songwriting', 'japanese'].includes(here)) return;
  if(ev.code === 'KeyP'){ ev.preventDefault(); const p = purposeState(); p.mode = 'read'; navigate('#/purpose'); }
  else if(ev.code === 'KeyR' && here === 'purpose'){ ev.preventDefault(); purposeReview(); }
});
