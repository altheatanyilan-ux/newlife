/* ============================================================
   THE MUSE — inspiration as infrastructure

   The course's argument: results come from inspiration, not hours, and
   inspiration is a necessity that needs scheduled infrastructure — nature,
   travel, breaks, a peer group, the books that reinspire. The house reads
   consumption well and inspiration not at all. This reads it.

   It is a reading and not a score: five inputs, each traceable to something
   done, and an input with no data is dropped rather than counted as zero (the
   rule the Maslow tiers already follow). It lives on the Review, where you
   consult it; it does not greet you.
   ============================================================ */

function museState(){
  const m = S.museState = S.museState && typeof S.museState === 'object' ? S.museState : {};
  if(m.lastReadingAt === undefined) m.lastReadingAt = '';
  if(m.override === undefined) m.override = null;
  if(m.overrideNote === undefined) m.overrideNote = '';
  if(m.raisedAt === undefined) m.raisedAt = '';
  if(m.dismissedAt === undefined) m.dismissedAt = '';
  return m;
}

/* ---------- the cadence records ---------- */
const BREAK_KINDS = {
  nature: {name: 'a nature retreat', every: 14, ask: 'a phone-free stretch outdoors', rule: 'every fortnight'},
  travel: {name: 'travel', every: 182, ask: 'somewhere you do not usually go', rule: 'twice a year'},
  'three-day': {name: 'a three-day break', every: 90, ask: 'three days off, properly', rule: 'every ninety days'},
  long: {name: 'a long break', every: 182, ask: 'one to two weeks off', rule: 'twice a year'},
};
const breaksAll = () => (S.breaks = Array.isArray(S.breaks) ? S.breaks : []);
function breakAdd({kind, startAt, endAt, place = '', note = '', entryIds = []}){
  if(!BREAK_KINDS[kind]) return null;
  const s = startAt || today();
  const b = {id: uid(), kind, date: s, startAt: s, endAt: endAt || s, place: String(place || '').trim(), note: String(note || '').trim(), entryIds: entryIds.slice(), minutes: 0};
  breaksAll().push(b); saveNow(); return b;
}
const breakLast = kind => breaksAll().filter(b => b.kind === kind).sort((a, b) => (b.startAt || '').localeCompare(a.startAt || ''))[0] || null;
/* a duty is due when the last record of its kind is older than its window; with
   no record at all it is due once, because someone turned it on to be asked */
function breakDue(kind, T = today()){
  const last = breakLast(kind);
  return !last || daysBetween(last.endAt || last.startAt, T) >= BREAK_KINDS[kind].every;
}
Object.keys(BREAK_KINDS).forEach(kind => {
  if(typeof registerDuty !== 'function') return;
  const k = BREAK_KINDS[kind];
  registerDuty({id: 'break_' + kind, label: `${k.name[0].toUpperCase() + k.name.slice(1)} (${k.rule})`, anchor: '[data-duty-id="break_' + kind + '"]', route: '#/journals/review',
    windowDef: {type: 'anytime'}, recurrence: {type: 'daily-conditional', check: T => breakDue(kind, T)},
    skipDone: true, notify: false, defaultOn: false, doneCheck: T => !breakDue(kind, T),
    rule: `the last record is more than ${k.every} days old, or there is none`});
});

/* ---------- the reading ---------- */
const MUSE_INPUTS = ['nature', 'reinspiring', 'novelty', 'peer', 'creative'];
const MUSE_NAMES = {nature: 'Nature contact', reinspiring: 'Reinspiring intake', novelty: 'Novelty', peer: 'Peer contact', creative: 'Creative output'};
function museReinspiringWorks(){ return (typeof mediaEntries === 'function' ? mediaEntries() : []).filter(e => mediaX(e).reinspiring === true); }
const museTouched = (e, since) => { const x = mediaX(e); return [x.finishedAt, x.startedAt].concat(Array.isArray(x.rereads) ? x.rereads : []).some(d => d && d >= since); };
const musePeers = () => (S.people || []).filter(p => p.roles && (p.roles.peer || p.roles.mentor));
function museInputs(T = today()){
  const out = {};
  /* nature: outdoors tagging is by hand; nothing is inferred */
  const dates = [];
  ((S.stillness && S.stillness.sessions) || []).forEach(x => { if(x.outdoors) dates.push(x.date); });
  (S.timeEntries || []).forEach(e => { if(e.outdoors && e.endTime) dates.push(timeDayOf(e.startTime)); });
  breaksAll().filter(b => b.kind === 'nature').forEach(b => dates.push(b.endAt || b.startAt));
  const nd = dates.filter(Boolean).sort().slice(-1)[0];
  if(nd){ const d = Math.max(0, daysBetween(nd, T)); out.nature = {value: d <= 2 ? 100 : d >= 21 ? 0 : Math.round(100 * (21 - d) / 19),
    said: `${d === 0 ? 'today' : d + ' day' + (d === 1 ? '' : 's') + ' ago'} you were last outdoors on purpose`, rule: 'a hundred within two days of the last outdoors sitting or nature retreat, falling to nothing by day twenty-one', days: d}; }
  /* reinspiring */
  const works = museReinspiringWorks();
  if(works.length){ const since = addDays(T, -30), n = works.filter(e => museTouched(e, since)).length;
    out.reinspiring = {value: Math.min(3, n) * 33, said: `${n} of the ${works.length} work${works.length === 1 ? '' : 's'} you marked as reinspiring touched in the last thirty days`,
      rule: 'the works marked reinspiring that were opened, logged or reread in thirty days, capped at three, times thirty-three', n}; }
  /* novelty: binary on purpose */
  const bs = breaksAll();
  if(bs.length){ const recent = bs.filter(b => b.kind !== 'nature' && (b.endAt || b.startAt) >= addDays(T, -90));
    out.novelty = {value: recent.length ? 100 : 0, said: recent.length ? `a ${BREAK_KINDS[recent[0].kind].name} record in the last ninety days` : 'no travel or break record in ninety days',
      rule: 'any travel, long break or three-day break in ninety days: a hundred if there is one, nothing if not — quarterly, not continuous', days: (() => { const l = bs.filter(b => b.kind !== 'nature').sort((a, b) => (b.endAt || b.startAt).localeCompare(a.endAt || a.startAt))[0]; return l ? daysBetween(l.endAt || l.startAt, T) : null; })()}; }
  /* peer contact */
  const peers = musePeers();
  if(peers.length){ const lasts = peers.map(p => lastInteractionDate(p.id)).filter(Boolean).sort();
    const d = lasts.length ? daysBetween(lasts[lasts.length - 1], T) : null;
    out.peer = {value: d == null ? 0 : Math.round(100 * (1 - Math.min(d, 30) / 30)), said: d == null ? 'no contact logged yet with the people you marked as peers or mentors' : `${d} day${d === 1 ? '' : 's'} since you last spoke with a peer or mentor`,
      rule: 'days since the last logged contact with someone marked peer group or mentor, against a thirty-day cadence', days: d}; }
  /* creative output: the Maslow aesthetic-tier reading, reused */
  const cr = typeof mNodRate === 'function' ? mNodRate(p => !(p.income && (p.income.current || p.income.target)), 14) : null;
  if(cr != null) out.creative = {value: Math.round(cr), said: 'nods on projects that earn nothing, in the last fourteen days', rule: 'the creating reading of the beauty tier, taken over fourteen days'};
  return out;
}
function museRead(T = today()){
  const ins = museInputs(T), keys = MUSE_INPUTS.filter(k => ins[k]);
  const auto = keys.length ? Math.round(sum(keys.map(k => ins[k].value)) / keys.length) : null;
  const m = museState(), ov = m.override != null ? m.override : null;
  const lowest = keys.length ? keys.slice().sort((a, b) => ins[a].value - ins[b].value || MUSE_INPUTS.indexOf(a) - MUSE_INPUTS.indexOf(b))[0] : null;
  return {inputs: ins, keys, auto, override: ov, value: ov != null ? ov : auto, lowest};
}

/* ---------- the prescription: only on the course's own condition ---------- */
function museSetpointFlatter(T = today()){
  const a = typeof mSetpointScore === 'function' ? mSetpointScore(30) : null, b = typeof mSetpointScore === 'function' ? mSetpointScore(90) : null;
  return a != null && b != null && a < b ? {a: Math.round(a), b: Math.round(b)} : null;
}
function museTrigger(T = today()){
  const r = museRead(T); if(r.value == null || r.value >= 40) return null;
  const flat = museSetpointFlatter(T); if(!flat) return null;
  return {read: r, flat};
}
/* the panel is raised at most once in seven days; it stays up for its window */
function museFeedPanel(T = today()){
  const tr = museTrigger(T); if(!tr) return null;
  const m = museState();
  if(m.raisedAt && daysBetween(m.raisedAt, T) < 7){
    if(m.dismissedAt && m.dismissedAt >= m.raisedAt) return null;
  } else { m.raisedAt = T; m.dismissedAt = ''; }
  const low = tr.read.lowest, i = tr.read.inputs[low];
  let text = '', go = null;
  if(low === 'nature'){ text = `It has been ${i.days} days since you were outside with nothing to do. The course’s claim is that the response to natural scenes is biological rather than sentimental.`; go = ['a nature retreat', () => { location.hash = '#/today/stillness'; }]; }
  else if(low === 'reinspiring'){
    let ws = museReinspiringWorks().filter(e => !museTouched(e, addDays(T, -30))).slice(0, 3);
    if(!ws.length && typeof mediaEntries === 'function') ws = mediaEntries().filter(e => { const x = mediaX(e); return x.resonanceLevel === 'lives' && x.finishedAt && daysSince(x.finishedAt) > 365; }).slice(0, 3);
    text = ws.length ? `Go back to ${ws.map(e => '“' + e.title + '”').join(', ')}. The reread is useless in the abstract and exact in the concrete.` : 'Nothing is marked reinspiring yet. Mark the works that restart the fire when you return to them, and this can name them.';
    go = ['open the Library', () => { location.hash = '#/journals/library'; }];
  }
  else if(low === 'novelty'){ text = `${i.days != null ? 'It has been ' + i.days + ' days since' : 'You have not recorded'} you went anywhere new. The course’s cadence is a three-day break every ninety days.`; go = ['record a break', () => museBreakDialog('three-day')]; }
  else if(low === 'peer'){ const ps = musePeers().map(p => `${p.name} (${lastInteractionDate(p.id) ? daysSince(lastInteractionDate(p.id)) + ' days' : 'not yet'})`);
    text = `Your peers and mentors: ${ps.join(', ')}. The course puts a peer group, met on a schedule, among the things that keep the muse fed.`; go = ['open People', () => { location.hash = '#/people'; }]; }
  else { text = 'It has been a fortnight with nothing made that earns nothing. The creating reading is the lowest of the five.'; go = ['open Projects', () => { location.hash = '#/today'; }]; }
  return {low, name: MUSE_NAMES[low], text, go, read: tr.read, flat: tr.flat, raisedAt: m.raisedAt};
}
function museDismiss(){ const m = museState(); m.dismissedAt = today(); saveNow(); }
function pqMuse(T){
  const p = museFeedPanel(T); if(!p) return [];
  return [{id: 'muse:' + p.raisedAt, source: 'new', category: 'flag', rank: PQ_RANK.flag, period: 'week',
    msg: 'Feed your muse. ' + p.text, rule: `the muse reading is ${p.read.value}, under forty, and the thirty-day set-point (${p.flat.a}) is under its ninety-day mean (${p.flat.b}); raised at most once a week`,
    go: p.go}];
}

/* ---------- the card on the Review ---------- */
function museCardHTML(){
  const r = museRead();
  if(!r.keys.length) return `<section class="section rv muse-card"><span class="sc">The muse</span>
    <p class="faint">Nothing to read yet. This reads five things: time outdoors, the works you mark as reinspiring, a break or trip, contact with a peer or mentor, and what you make that earns nothing. Mark a work in the Library, a person in People, or record a break, and it will draw.</p>
    <div class="row"><button class="btn sm" data-musebreak="three-day">Record a break</button></div></section>`;
  const sel = S._museSel && r.inputs[S._museSel] ? S._museSel : null;
  const p = museFeedPanel();
  const hue = 'var(--sage)';
  return `<section class="section rv muse-card"><div class="row between" style="align-items:baseline;flex-wrap:wrap;gap:8px">
      <span class="sc" style="margin:0">The muse <span class="mono faint" style="text-transform:none;letter-spacing:0">· a reading, not a mark</span></span>
      <span class="mono faint">${r.override != null ? `you say ${r.override}; the data says ${r.auto}` : `${r.keys.length} of 5 inputs have data`}</span></div>
    <div class="muse-bars">${MUSE_INPUTS.map(k => { const i = r.inputs[k];
      return `<button class="muse-row${S._museSel === k ? ' on' : ''}" data-musesel="${k}"${i ? '' : ' disabled'}><span class="n">${MUSE_NAMES[k]}</span>
        <span class="muse-bar"><i style="width:${i ? i.value : 0}%;--c:${hue}"></i></span><span class="mono v">${i ? i.value : 'no data'}</span></button>`; }).join('')}
      <div class="muse-row total"><span class="n"><b>Overall</b></span><span class="muse-bar"><i style="width:${r.value ?? 0}%;--c:${hue}"></i></span><span class="mono v"><b>${r.value ?? '—'}</b></span></div></div>
    ${sel ? `<div class="mas-detail"><b class="serif">${MUSE_NAMES[sel]}</b> <span class="mono">${r.inputs[sel].value}</span>
      <p>${esc(r.inputs[sel].said)}.</p><p class="faint" style="font-size:.8rem">The rule: ${esc(r.inputs[sel].rule)}.</p></div>` : '<p class="faint" style="font-size:.8rem">Tap an input to see what fed it and the rule it follows.</p>'}
    <div class="field" style="margin-top:8px"><label>How it actually feels ${r.auto != null ? `<span class="mono faint" style="text-transform:none;letter-spacing:0">· the data says ${r.auto}</span>` : ''}</label>
      <input type="range" class="slider" min="0" max="100" id="museOv" value="${r.value ?? 50}" style="--c:${hue}">
      <div class="row between mono"><span class="faint">0</span><span id="museOvV">${r.value ?? 50}</span><span class="faint">100</span></div></div>
    <textarea class="ta" id="museNote" rows="2" placeholder="Why does this feel different from what the numbers say?">${esc(museState().overrideNote)}</textarea>
    <div class="row" style="gap:8px;margin-top:8px"><button class="btn sm" data-musebreak="three-day">Record a break</button>
      ${r.override != null ? '<button class="btn sm ghost" id="museClear">use the data’s number</button>' : ''}</div>
    ${p ? `<div class="muse-feed"><b class="serif">Feed your muse</b> <span class="mono faint">· lowest input: ${esc(p.name)}</span><p>${esc(p.text)}</p>
      <div class="row" style="gap:8px"><button class="btn sm primary" id="museGo">${esc(p.go[0])}</button><button class="btn sm ghost" id="museLater">not this week</button></div>
      <p class="faint mono" style="font-size:.74rem">Raised because the reading is under forty and your thirty-day set-point (${p.flat.a}) is under its ninety-day mean (${p.flat.b}). It comes at most once a week.</p></div>` : ''}
    </section>`;
}
function bindMuseCard(box){
  box.querySelectorAll('[data-musesel]').forEach(b => b.onclick = () => { S._museSel = S._museSel === b.dataset.musesel ? null : b.dataset.musesel; rerender(); });
  const m = museState();
  const ov = box.querySelector('#museOv');
  if(ov){ ov.oninput = () => { box.querySelector('#museOvV').textContent = ov.value; }; ov.onchange = () => { m.override = +ov.value; m.lastReadingAt = today(); saveNow(); rerender(); }; }
  const nt = box.querySelector('#museNote'); if(nt) nt.onchange = () => { m.overrideNote = nt.value.trim(); saveNow(); };
  const cl = box.querySelector('#museClear'); if(cl) cl.onclick = () => { m.override = null; saveNow(); rerender(); };
  box.querySelectorAll('[data-musebreak]').forEach(b => b.onclick = () => museBreakDialog(b.dataset.musebreak));
  const go = box.querySelector('#museGo'); if(go) go.onclick = () => { const p = museFeedPanel(); if(p) p.go[1](); };
  const lt = box.querySelector('#museLater'); if(lt) lt.onclick = () => { museDismiss(); sound('click'); rerender(); };
}

/* ---------- recording a break ---------- */
function museBreakDialog(kind){
  const m = openModal(`<h2>A break, a trip, a stretch outdoors</h2>
    <p class="faint">Just a date, a note and, if you like, a place. What you write during it can be linked here afterwards.</p>
    <div class="field"><label>Which</label><div class="row" style="gap:6px;flex-wrap:wrap">${Object.entries(BREAK_KINDS).map(([k, v]) => `<button class="chip${k === kind ? ' on' : ''}" data-bk="${k}">${esc(v.name)}</button>`).join('')}</div></div>
    <div class="grid c2"><div class="field"><label>From</label><input type="date" class="inp" id="bkFrom" value="${today()}"></div>
    <div class="field"><label>To</label><input type="date" class="inp" id="bkTo" value="${today()}"></div></div>
    <div class="field"><label>Where (optional)</label><input class="inp" id="bkPlace"></div>
    <div class="field"><label>A note (optional)</label><textarea class="ta" id="bkNote" rows="3"></textarea></div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="bkGo">Keep the record</button></div>`, 'narrow');
  m.querySelectorAll('[data-bk]').forEach(b => b.onclick = () => { kind = b.dataset.bk; m.querySelectorAll('[data-bk]').forEach(x => x.classList.toggle('on', x === b)); });
  m.querySelector('#bkGo').onclick = () => {
    const from = m.querySelector('#bkFrom').value || today(), to = m.querySelector('#bkTo').value || from;
    breakAdd({kind, startAt: from, endAt: to < from ? from : to, place: m.querySelector('#bkPlace').value, note: m.querySelector('#bkNote').value});
    m.remove(); sound('success'); toast('Recorded.'); rerender();
  };
}

/* ---------- the phone-free nature retreat (the sacred space) ----------
   No timer, no tracking, nothing in the app while it happens: the practice is
   the absence of the device. One line before, and then the screen gets out of
   the way; afterwards, one question. */
function natureRetreatCardHTML(){
  const last = breakLast('nature');
  return `<div class="nature-card"><b class="serif">The phone-free nature retreat</b>
    <p class="faint">Go outside without the device. Nothing here keeps time; there is nothing to do in the app while you are away.</p>
    <div class="row" style="gap:8px"><button class="btn sm" id="ntGo">I’m going</button><button class="btn sm primary" id="ntBack">I’m back</button>
      ${last ? `<span class="mono faint">last: ${esc(fmtDate(last.startAt, 'med'))}</span>` : ''}</div></div>`;
}
function natureGo(){
  const m = openModal('<div class="still-guide"><p class="still-card" style="text-align:center">Leave the phone. Go out.</p><div class="row" style="justify-content:center"><button class="btn sm ghost" id="ntClose">close</button></div></div>', 'wide plain');
  m.querySelector('#ntClose').onclick = () => m.remove();
}
function natureBack(){
  const lens = [[30, 'half an hour'], [60, 'an hour'], [120, 'two hours'], [240, 'half a day'], [480, 'most of a day']];
  let minutes = 60;
  const m = openModal(`<h2>You went</h2>
    <div class="field"><label>For how long</label><div class="row" style="gap:6px;flex-wrap:wrap">${lens.map(([n, l]) => `<button class="chip${n === 60 ? ' on' : ''}" data-ntl="${n}">${l}</button>`).join('')}</div></div>
    <div class="field"><label>What arrived out there?</label><textarea class="ta" id="ntWords" rows="4" placeholder="Leave it empty if nothing did. Most days nothing does."></textarea></div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="ntKeep">Keep it</button></div>`, 'narrow');
  m.querySelectorAll('[data-ntl]').forEach(b => b.onclick = () => { minutes = +b.dataset.ntl; m.querySelectorAll('[data-ntl]').forEach(x => x.classList.toggle('on', x === b)); });
  m.querySelector('#ntKeep').onclick = () => {
    const words = m.querySelector('#ntWords').value.trim(), ids = [];
    if(words){ const e = lifeEntryNew({type: 'reflection', title: 'What arrived outdoors', body: words, extra: {source: 'nature-retreat'}}); ids.push(e.id); }
    const b = breakAdd({kind: 'nature', startAt: today(), endAt: today(), note: '', entryIds: ids}); if(b) b.minutes = minutes;
    practiceLogAdd('nature-retreat', {minutes});
    if(typeof retreatStepSet === 'function') retreatStepSet('nature', 'back', {answer: words, entryId: ids[0] || null, minutes});
    saveNow(); m.remove(); sound('success'); toast('Kept.'); rerender();
  };
}
function bindNatureRetreat(root){
  const go = root.querySelector('#ntGo'), back = root.querySelector('#ntBack');
  if(go) go.onclick = natureGo;
  if(back) back.onclick = natureBack;
}

/* ---------- Library: the reinspiring flag; People: the role flags ---------- */
function mediaReinspiringHTML(e){
  const x = mediaX(e), n = (x.rereads || []).length;
  return `<div class="vp-sec"><span class="sc">Does returning to it restart the fire?</span>
    <div class="faint" style="font-size:.78rem;margin-bottom:6px">Not what it did to you once, but whether coming back to it reinspires you. The muse reading looks for these.</div>
    <div class="row" style="gap:8px;align-items:center"><label class="row" style="gap:6px;align-items:center"><input type="checkbox" id="mpReinsp"${x.reinspiring ? ' checked' : ''}> <span>reinspiring</span></label>
      ${x.reinspiring ? `<button class="btn sm ghost" id="mpReread">I went back to it today</button>` : ''}
      ${n ? `<span class="mono faint">returned to ${n} time${n === 1 ? '' : 's'}${x.rereads.length ? ', last ' + esc(fmtDate(x.rereads[x.rereads.length - 1], 'short')) : ''}</span>` : ''}</div></div>`;
}
function bindMediaReinspiring(box, e, reopen){
  const x = mediaX(e), cb = box.querySelector('#mpReinsp');
  if(cb) cb.onchange = () => { x.reinspiring = cb.checked; saveNow(); reopen && reopen(); };
  const rr = box.querySelector('#mpReread');
  if(rr) rr.onclick = () => { x.rereads = Array.isArray(x.rereads) ? x.rereads : []; if(!x.rereads.includes(today())) x.rereads.push(today()); saveNow(); sound('success'); reopen && reopen(); };
}
const PERSON_ROLES = {mentor: ['Mentor', 'what you go to them for'], accountability: ['Accountability partner', 'what you have asked them to hold you to'], peer: ['Peer group', 'which domain']};
function personRolesHTML(p){
  p.roles = p.roles && typeof p.roles === 'object' ? p.roles : {}; p.roleNotes = p.roleNotes && typeof p.roleNotes === 'object' ? p.roleNotes : {};
  return `<section class="section rv"><span class="sc">What they are to my work</span>
    <p class="faint" style="font-size:.8rem">These feed the muse reading and the alignment reading, and nothing else.</p>
    ${Object.entries(PERSON_ROLES).map(([k, [name, ask]]) => `<div class="field"><label class="row" style="gap:6px;align-items:center"><input type="checkbox" data-prole="${k}"${p.roles[k] ? ' checked' : ''}> <span>${name}</span></label>
      ${p.roles[k] ? `<input class="inp" data-pnote="${k}" placeholder="${esc(ask)}" value="${esc(p.roleNotes[k] || '')}">` : ''}</div>`).join('')}</section>`;
}
function bindPersonRoles(root, p){
  root.querySelectorAll('[data-prole]').forEach(c => c.onchange = () => { p.roles[c.dataset.prole] = c.checked; saveNow(); rerender(); });
  root.querySelectorAll('[data-pnote]').forEach(i => i.onchange = () => { p.roleNotes[i.dataset.pnote] = i.value.trim(); saveNow(); });
}
