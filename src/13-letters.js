/* ============================================================
   SEALED LETTERS, DECISIONS, AND THE YEARS BEHIND TODAY
   Three small systems that all turn on the same idea: the person
   who wrote something is not the person who reads it back.
   ============================================================ */

/* ---------- 1. letters to a future self ---------- */
function letterIsSealed(e){ const u = e.extra?.sealedUntil; return !!u && u > today(); }
function sealedLetters(){ return S.entries.filter(e => e.type === 'letter' && e.extra?.sealedUntil).sort((a,b) => (a.extra.sealedUntil||'').localeCompare(b.extra.sealedUntil||'')); }
function lettersOpeningNow(){ return S.entries.filter(e => e.type === 'letter' && e.extra?.sealedUntil && e.extra.sealedUntil <= today() && !e.extra.openedAt); }
function openSealedLetter(id){
  const e = byId(S.entries, id); if(!e) return;
  if(letterIsSealed(e)){ toast(`Sealed until ${fmtDate(e.extra.sealedUntil,'med')}. That was the point.`); return; }
  if(!e.extra.openedAt){ e.extra.openedAt = today(); saveNow(); }
  const wroteAgo = daysBetween((e.createdAt||'').slice(0,10), today());
  openPanel(`<div class="mono">a letter you sealed${wroteAgo ? ` ${relDays(wroteAgo)}` : ''}</div>
    <h2>${esc(e.title || 'To myself')}</h2>
    <div class="mono" style="margin:6px 0 18px">written ${fmtDate((e.createdAt||'').slice(0,10),'med')} · opened ${fmtDate(e.extra.openedAt,'med')}</div>
    <div class="letter-open prose serif-lg">${md(e.body)}</div>
    ${tagChips(e)}
    <div class="vp-sec"><span class="sc">Reading it now</span><div class="faint" style="font-size:.8rem;margin-bottom:6px">What did the person who wrote this get right, and what did they not know yet?</div>${ed(`entries.#${e.id}.extra.reply`, {multi:true, mdr:true, cls:'prose', ph:'Answer them.'})}</div>
    <div class="row" style="margin-top:18px"><button class="btn sm ghost" id="lWriteBack">Seal a new one</button></div>`, 'letter-panel');
  const b = document.querySelector('#lWriteBack'); if(b) b.onclick = () => openLetterModal();
  sound('open');
}
function openLetterModal(){
  const opts = [[90,'in three months'],[180,'in six months'],[365,'in a year'],[730,'in two years'],[1825,'in five years']];
  const m = openModal(`<h2>A letter to your future self</h2>
    <p class="muted" style="font-size:.88rem">It will be sealed until the date you choose — hidden from this page, from search, and from every list. When the day comes it surfaces on Today.</p>
    <div class="stack">
      <input class="inp serif-lg" id="lTitle" placeholder="Title (optional)">
      <textarea class="ta" id="lBody" placeholder="Write to whoever you will be. Tell them what today feels like, what you are afraid of, and what you hope they have stopped worrying about." style="min-height:200px"></textarea>
      <div class="field"><label>Open it</label><div class="row" style="gap:6px;flex-wrap:wrap">${opts.map(([d,l])=>`<button type="button" class="btn sm ghost" data-lwhen="${d}">${l}</button>`).join('')}</div>
        <input class="inp" type="date" id="lDate" value="${addDays(today(),365)}" style="margin-top:8px;max-width:14em"></div>
      <div class="row between"><span class="faint" style="font-size:.78rem" id="lHint">Opens ${fmtDate(addDays(today(),365),'med')}.</span><button class="btn primary" id="lSave">Seal it</button></div>
    </div>`, 'wide');
  const dateI = m.querySelector('#lDate'), hint = m.querySelector('#lHint');
  const setHint = () => { const d = dateI.value; hint.textContent = d > today() ? `Opens ${fmtDate(d,'med')} — ${daysBetween(today(), d)} days from now.` : 'That date is not in the future; it will open immediately.'; };
  m.querySelectorAll('[data-lwhen]').forEach(b => b.onclick = () => { dateI.value = addDays(today(), +b.dataset.lwhen); setHint(); });
  dateI.onchange = setHint;
  attachDictationIn(m);
  m.querySelector('#lSave').onclick = () => {
    const body = m.querySelector('#lBody').value.trim(); if(!body){ toast('Write something to them first.'); return; }
    const e = {id:uid(), type:'letter', title:m.querySelector('#lTitle').value.trim(), body, occurredAt:today(), createdAt:new Date().toISOString(),
      media:[], links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[]}, people:[], places:[], emotions:[], tags:[], confidence:'',
      extra:{sealedUntil:dateI.value || addDays(today(),365), openedAt:'', reply:''}};
    S.entries.push(e); saveNow(); m.remove(); sound('success');
    toast(`Sealed until ${fmtDate(e.extra.sealedUntil,'med')}. You will not see it again until then.`);
    rerender();
  };
  setTimeout(()=>m.querySelector('#lBody').focus(), 60);
}
function sealedLettersHTML(){
  const sealed = sealedLetters().filter(letterIsSealed);
  const ready = lettersOpeningNow();
  const opened = S.entries.filter(e => e.type === 'letter' && e.extra?.openedAt).sort((a,b)=>(b.extra.openedAt||'').localeCompare(a.extra.openedAt||''));
  return `<div class="row between"><span class="sc" style="margin:0">Letters to yourself</span><button class="btn sm primary" id="newLetter">＋ Seal a letter</button></div>
    <p class="muted" style="font-size:.85rem">A sealed letter is hidden everywhere until its date. Your past self gets to speak once, without being edited by hindsight.</p>
    ${ready.length ? `<div class="card ready-letter" style="margin-top:12px">${ready.map(e=>`<div class="row between"><span><b class="serif">${esc(e.title||'A letter from you')}</b><div class="mono">sealed ${fmtDate((e.createdAt||'').slice(0,10),'med')} · ready since ${fmtDate(e.extra.sealedUntil,'med')}</div></span><button class="btn sm primary" data-lopen="${e.id}">Open it</button></div>`).join('')}</div>` : ''}
    ${sealed.length ? `<div class="stack" style="gap:6px;margin-top:12px">${sealed.map(e=>`<div class="sealed-row"><span class="wax">✉</span><span style="flex:1"><b>${esc(e.title||'Sealed letter')}</b><div class="mono">written ${fmtDate((e.createdAt||'').slice(0,10),'med')}</div></span><span class="mono">opens ${fmtDate(e.extra.sealedUntil,'med')} · ${daysBetween(today(), e.extra.sealedUntil)}d</span></div>`).join('')}</div>` : ''}
    ${opened.length ? `<details style="margin-top:12px"><summary><span class="mono">${opened.length} already opened</span></summary><div class="body stack" style="gap:6px">${opened.map(e=>`<div class="row between"><button class="linkish" data-lopen="${e.id}">${esc(e.title||'A letter')}</button><span class="mono">opened ${fmtDate(e.extra.openedAt,'med')}</span></div>`).join('')}</div></details>` : ''}
    ${!sealed.length && !ready.length && !opened.length ? '<div class="empty">Nothing sealed yet.</div>' : ''}`;
}
function bindSealedLetters(root){
  const b = root.querySelector('#newLetter'); if(b) b.onclick = () => openLetterModal();
  root.querySelectorAll('[data-lopen]').forEach(x => x.onclick = () => openSealedLetter(x.dataset.lopen));
}

/* ---------- 2. the decision journal ---------- */
const DECISION_FIELDS = [
  ['situation','The situation','What was actually in front of you, in plain terms.'],
  ['options','Options I considered','List them, including the one you rejected fastest.'],
  ['chosen','What I chose',''],
  ['reasoning','Why — my reasoning at the time','The real reasons, not the presentable ones. This is the whole point.'],
  ['expected','What I expect to happen','Be specific enough to be wrong.'],
  ['worry','What would make this a mistake','The signal you would need to see to change your mind.'],
];
const DECISION_OUTCOME = [
  ['outcome','What actually happened',''],
  ['right','What I got right',''],
  ['wrong','What I did not see',''],
  ['lesson','What I would tell myself','One sentence you would carry into the next decision.'],
];
function decisions(){ return S.entries.filter(e => e.type === 'decision'); }
function decisionsDue(){ const T = today(); return decisions().filter(e => !e.extra?.reviewedAt && e.extra?.reviewOn && e.extra.reviewOn <= T); }
function openDecisionModal(){
  const m = openModal(`<h2>A decision worth remembering</h2>
    <p class="muted" style="font-size:.88rem">Written now, read later. The gap between why you thought something and what actually happened is where self-knowledge lives — but only if you write the reasoning down before you know the answer.</p>
    <div class="stack">
      <input class="inp serif-lg" id="dTitle" placeholder="The decision, in a few words" autofocus>
      ${DECISION_FIELDS.map(([k,l,h])=>`<div class="field"><label>${l}</label>${h?`<div class="faint" style="font-size:.78rem;margin-bottom:4px">${h}</div>`:''}<textarea class="ta" data-df="${k}" style="min-height:${k==='chosen'?60:84}px"></textarea></div>`).join('')}
      <div class="grid c2" style="gap:10px">
        <div class="field"><label>How sure am I?</label><select class="sel" id="dConf">${['a coin flip','leaning','fairly sure','confident','certain'].map(c=>`<option ${c==='leaning'?'selected':''}>${c}</option>`).join('')}</select></div>
        <div class="field"><label>Come back to it on</label><input class="inp" type="date" id="dReview" value="${addDays(today(),180)}"></div>
      </div>
      <div class="row" style="justify-content:flex-end"><button class="btn primary" id="dSave">Log the decision</button></div>
    </div>`, 'wide');
  attachDictationIn(m);
  m.querySelector('#dSave').onclick = () => {
    const title = m.querySelector('#dTitle').value.trim(); if(!title){ toast('Name the decision first.'); return; }
    const extra = {reviewOn:m.querySelector('#dReview').value, reviewedAt:'', confidence:m.querySelector('#dConf').value};
    m.querySelectorAll('[data-df]').forEach(t => extra[t.dataset.df] = t.value.trim());
    const e = {id:uid(), type:'decision', title, body:extra.reasoning || '', occurredAt:today(), createdAt:new Date().toISOString(), media:[],
      links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[]}, people:[], places:[], emotions:[], tags:[], confidence:'', extra};
    S.entries.push(e); saveNow(); m.remove(); sound('success'); toast(`Logged. It comes back to you on ${fmtDate(extra.reviewOn,'med')}.`); rerender();
  };
}
function openDecisionPanel(id){
  const e = byId(S.entries, id); if(!e) return; const x = e.extra || {};
  const age = daysBetween((e.createdAt||'').slice(0,10), today());
  const settled = !!x.reviewedAt;
  const p = openPanel(`<div class="mono">decision · ${age ? `${age} days ago` : 'today'}${x.confidence ? ` · you were ${esc(x.confidence)}` : ''}</div>
    <h2>${ed(`entries.#${e.id}.title`)}</h2>
    <div class="dec-then"><div class="sc">What you thought at the time</div>
      ${DECISION_FIELDS.map(([k,l]) => x[k] ? `<div class="dec-field"><div class="k">${l}</div><div class="prose">${md(x[k])}</div></div>` : '').join('') || '<div class="empty">Nothing was written down.</div>'}</div>
    <div class="vp-sec"><div class="row between"><span class="sc">Looking back</span><span class="mono">${settled ? `reviewed ${fmtDate(x.reviewedAt,'med')}` : x.reviewOn ? `due ${fmtDate(x.reviewOn,'med')}` : ''}</span></div>
      <p class="faint" style="font-size:.8rem">Do not reread the reasoning above and then write what you wish you had thought. Answer honestly; the value is in the gap.</p>
      ${DECISION_OUTCOME.map(([k,l,h]) => `<div class="field" style="margin-top:10px"><label>${l}</label>${h?`<div class="faint" style="font-size:.76rem;margin-bottom:4px">${h}</div>`:''}${ed(`entries.#${e.id}.extra.${k}`, {multi:true, mdr:true, cls:'prose', ph:'…'})}</div>`).join('')}
      <div class="row" style="margin-top:14px;gap:8px"><span class="mono">verdict</span><select class="sel" style="width:auto" id="dVerdict">${['','right for the reasons I thought','right for other reasons','wrong, and I can see why','wrong, and I still would have chosen it','too early to say'].map(v=>`<option ${x.verdict===v?'selected':''}>${v||'—'}</option>`).join('')}</select>
        <button class="btn sm ${settled?'ghost':'primary'}" id="dDone">${settled ? 'reviewed' : 'mark reviewed'}</button></div></div>
    <div class="vp-sec"><span class="sc">Come back again on</span><div class="row">${ed(`entries.#${e.id}.extra.reviewOn`, {ph:'YYYY-MM-DD', cls:'mono'})}</div></div>
    ${moreSection(`<div class="danger-zone"><span>This deletes the decision and everything written about it.</span><button class="btn sm ghost danger" id="dDel">Delete this decision</button></div>`)}`, 'decision-panel');
  p.querySelector('#dVerdict').onchange = ev => { x.verdict = ev.target.value; saveNow(); };
  p.querySelector('#dDone').onclick = () => { x.reviewedAt = x.reviewedAt ? '' : today(); saveNow(); sound(x.reviewedAt ? 'success' : 'click'); rerender(); openDecisionPanel(id); };
  p.querySelector('#dDel').onclick = () => requestDelete({label:e.title||'this decision', remove:()=>spliceOut(S.entries, y=>y.id===e.id), after:()=>{ closePanel(); rerender(); }});
}

/* ---------- 3. this day, in the years behind it ---------- */
/* the old version looked at one calendar day; this one widens the window
   when the day itself is empty, and says how long ago each thing was. */
function onThisDayRich({window: w = 3} = {}){
  const T = today(); const d = parseDay(T); const md_ = x => { const dd = parseDay(x); return {m:dd.getMonth(), day:dd.getDate(), y:dd.getFullYear()}; };
  const dated = S.entries.filter(e => /^\d{4}-\d{2}-\d{2}/.test(e.occurredAt||'') && !letterIsSealed(e));
  const withDist = dated.map(e => {
    const o = md_(e.occurredAt.slice(0,10)); if(o.y >= d.getFullYear()) return null;
    const anniv = new Date(d.getFullYear(), o.m, o.day);
    const off = Math.round((anniv - d) / DAY);
    return Math.abs(off) <= w ? {e, off, yearsAgo: d.getFullYear() - o.y} : null;
  }).filter(Boolean);
  const exact = withDist.filter(x => x.off === 0);
  const near = withDist.filter(x => x.off !== 0).sort((a,b) => Math.abs(a.off) - Math.abs(b.off));
  const items = (exact.length ? exact : near).sort((a,b) => a.yearsAgo - b.yearsAgo);
  const years = [...new Set(withDist.map(x => x.yearsAgo))].sort((a,b)=>a-b);
  return {items, exact: exact.length, near: near.length, years};
}
function onThisDayHTML(){
  const r = onThisDayRich(); const T = today();
  const stage = S.stages.find(s => (s.years||'').match(/(\d{4})/) && !s.notyet);
  if(!r.items.length) return `<div class="empty">Nothing from this day in earlier years — yet. Everything you write today becomes someone's anniversary.</div>`;
  return `<div class="otd-rich">
    ${r.items.slice(0,4).map(({e, off, yearsAgo}) => `<article class="otd-card" data-otd="${e.id}">
      <div class="otd-years"><b>${yearsAgo}</b><span>${yearsAgo === 1 ? 'year' : 'years'} ago</span></div>
      <div class="otd-body">
        <div class="mono">${typeIcon(e.type)} ${esc(fmtDate(e.occurredAt,'med'))}${off ? ` · ${Math.abs(off)}d ${off < 0 ? 'earlier' : 'later'} in the year` : ''}</div>
        ${e.title ? `<div class="otd-title">${esc(e.title)}</div>` : ''}
        <div class="otd-text">${esc((e.body||'').slice(0,240))}${(e.body||'').length > 240 ? '…' : ''}</div>
        ${entryTags(e).length ? tagChips(e) : ''}
      </div></article>`).join('')}
    ${r.items.length > 4 ? `<button class="btn sm ghost" id="otdMore">${r.items.length - 4} more from around this day</button>` : ''}
  </div>`;
}
function bindOnThisDay(root){
  root.querySelectorAll('[data-otd]').forEach(c => c.onclick = () => openEntryModal({entryId: c.dataset.otd}));
  const more = root.querySelector('#otdMore');
  if(more) more.onclick = () => {
    const r = onThisDayRich({window: 7});
    const m = openModal(`<h2>Around this day</h2><p class="muted" style="font-size:.86rem">Everything within a week of today's date, in earlier years.</p><div class="stack" style="gap:0;max-height:60vh;overflow:auto">${r.items.map(({e,yearsAgo}) => `<div class="otd-list-row"><span class="mono">${yearsAgo}y</span>${entryCard(e, {tools:false})}</div>`).join('')}</div>`, 'wide');
    m.querySelectorAll('.entry').forEach(x => x.style.cursor = 'default');
  };
}

/* the decisions pane inside Journals */
function decisionListHTML(){
  const all = decisions().sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));
  const due = decisionsDue(); const open_ = all.filter(e => !e.extra?.reviewedAt && !due.includes(e)); const done = all.filter(e => e.extra?.reviewedAt);
  const row = (e, tag) => { const x = e.extra||{}; const age = daysBetween((e.createdAt||'').slice(0,10), today());
    return `<button class="dec-row" data-dopen="${e.id}">
      <span class="dec-when mono">${age === 0 ? 'today' : `${age}d ago`}</span>
      <span class="dec-name"><b>${esc(e.title)}</b>${x.chosen?`<span class="dec-chose">chose: ${esc(x.chosen.slice(0,90))}</span>`:''}</span>
      <span class="mono dec-conf">${esc(x.confidence||'')}</span>
      <span class="mono dec-tag">${tag}</span></button>`; };
  return `<div class="row between"><span class="sc" style="margin:0">Decision journal</span><button class="btn sm primary" id="newDecision">＋ Log a decision</button></div>
    <p class="muted" style="font-size:.85rem">Write the reasoning while you still do not know the answer. Months later, grade it. The distance between the two is the only reliable way to learn how you think.</p>
    ${due.length ? `<div class="card ready-letter" style="margin-top:12px"><div class="sc">Ready to look back at</div><div class="stack" style="gap:2px;margin-top:8px">${due.map(e=>row(e,'review due')).join('')}</div></div>` : ''}
    ${open_.length ? `<div class="stack" style="gap:2px;margin-top:12px">${open_.map(e=>row(e, e.extra?.reviewOn ? `back on ${fmtDate(e.extra.reviewOn,'short')}` : 'open')).join('')}</div>` : ''}
    ${done.length ? `<details style="margin-top:12px"><summary><span class="mono">${done.length} reviewed</span></summary><div class="body stack" style="gap:2px">${done.map(e=>row(e, esc(e.extra.verdict || 'reviewed'))).join('')}</div></details>` : ''}
    ${!all.length ? '<div class="empty">No decisions logged. The next real one — a job, a move, a person — is worth four minutes now.</div>' : ''}`;
}
function bindDecisionList(root){
  const b = root.querySelector('#newDecision'); if(b) b.onclick = () => openDecisionModal();
  root.querySelectorAll('[data-dopen]').forEach(x => x.onclick = () => openDecisionPanel(x.dataset.dopen));
}
