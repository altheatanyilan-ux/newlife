/* ============================================================
   THE WEEK, AS WRITTEN

   The weekly review opens on what you actually wrote down for the week — its
   theme, its goals with the work put under each, the wins you said would count
   (with the evidence you gathered), the threats, the stages, the threads — and
   asks one small question of each: did it happen? The numbers (habits, hours,
   study, the tape) are still there for anyone who wants them, behind a switch
   in the first step; they are not the review.

   What you say is kept with the week (S.reviews.weekNotes[monday]), not on the
   plan, so reviewing a week never makes a plan for it. A goal that did not
   finish can be carried: it is written into next week's goals with only the
   work still open.
   ============================================================ */
let _ww = null;     /* {wk}: which week the step is looking at */
const WW_VERDICTS = [['done', 'it happened'], ['partly', 'partly'], ['no', 'not really']];
const wwDefaultWeek = () => { const T = today(); return parseDay(T).getDay() === 1 ? addDays(weekStart(T), -7) : weekStart(T); };
function wwNotes(wk, make){
  const r = S.reviews = S.reviews || {};
  if(!r.weekNotes || typeof r.weekNotes !== 'object'){ if(!make) return {notes: {}, verdicts: {}, carried: {}, keep: '', change: ''}; r.weekNotes = {}; }
  let n = r.weekNotes[wk];
  if(!n){ if(!make) return {notes: {}, verdicts: {}, carried: {}, keep: '', change: ''}; n = r.weekNotes[wk] = {}; }
  n.notes = n.notes || {}; n.verdicts = n.verdicts || {}; n.carried = n.carried || {}; n.keep = n.keep || ''; n.change = n.change || '';
  return n;
}
const wwWrote = p => !!(p && (((p.theme || '').trim()) || weekGoalsNamed(p).length || weekWins(p).length || weekRisks(p).length
  || weekPeriods(p).length || weekThreads(p).length || Object.values(p.aims || {}).some(v => (v || '').trim()) || (p.stake || '').trim()));

/* ---------- reading it ---------- */
function wwReflectHTML(n, key, ph){
  const v = n.verdicts[key] || '';
  return `<div class="ww-ref"><span class="ww-v">${WW_VERDICTS.map(([id, t]) => `<button class="chip sm${v === id ? ' on' : ''}" data-wwv="${esc(key)}|${id}">${esc(t)}</button>`).join('')}</span>
    <input class="inp sm ww-note" data-wwn="${esc(key)}" value="${esc(n.notes[key] || '')}" placeholder="${esc(ph)}" maxlength="400"></div>`;
}
function weekWrittenHTML(wk){
  const p = weekPlanSeen(wk), n = wwNotes(wk, false), end = addDays(wk, 6), T = today();
  const label = wk === weekStart(T) ? 'this week' : wk === addDays(weekStart(T), -7) ? 'last week' : 'the week of ' + fmtDate(wk, 'short');
  const bar = `<div class="ww-bar"><button class="tbtn" data-wwwk="${addDays(wk, -7)}">‹ earlier</button><b class="serif">${esc(label)}</b><span class="mono faint">${esc(fmtDate(wk, 'short'))} – ${esc(fmtDate(end, 'short'))}</span>
    ${wk < weekStart(T) ? `<button class="tbtn" data-wwwk="${addDays(wk, 7)}">later ›</button>` : ''}</div>`;
  if(!wwWrote(p)) return `${bar}<div class="ww-none"><p class="serif">Nothing was written down for this week.</p><p class="muted sm">No goals, no wins, no threads. You can still say how it went on the next step${wk >= weekStart(T) ? ', or write the plan now' : ''}.</p>
    <button class="btn sm" data-wwplan="${esc(wk)}">Write the plan for this week</button></div>`;
  const goals = weekGoalsNamed(p), wins = weekWins(p), risks = weekRisks(p), pers = weekPeriods(p), thr = weekThreads(p);
  const lists = typeof planLists === 'function' ? planLists() : [], aims = lists.filter(l => ((p.aims || {})[l.id] || '').trim());
  const sec = (t, html) => html ? `<section class="ww-sec"><span class="sc">${esc(t)}</span>${html}</section>` : '';
  const goalHTML = goals.map(o => {
    const refs = (o.taskIds || []).map(id => findTaskRef(id)).filter(Boolean);
    const where = o.linkType === 'list' ? (planList(o.linkId) || {}).name : o.linkType === 'project' ? ((S.projects || []).find(x => x.id === o.linkId) || {}).name : '';
    const open = refs.filter(r => !r.done).length, carried = n.carried[o.id];
    return `<div class="ww-goal"><div class="ww-t serif">${esc(o.text)}${where ? ` <span class="mono faint">· ${esc(where)}</span>` : ''}</div>
      ${refs.length ? `<ul class="ww-work">${refs.map(r => `<li class="${r.done ? 'done' : ''}"><button class="ww-tick" data-wwt="${esc(r.id)}" aria-label="${r.done ? 'not done' : 'done'}">${r.done ? '✓' : ''}</button><span>${esc(r.text)}</span></li>`).join('')}</ul>` : '<p class="faint sm" style="margin:2px 0">Nothing was put under it.</p>'}
      ${wwReflectHTML(n, 'g:' + o.id, 'what happened with this?')}
      <div class="ww-carry">${n.proofed && n.proofed['g:' + o.id] ? '<span class="mono faint">kept as proof ✓</span>' : `<button class="tbtn" data-wwproof="g:${esc(o.id)}">keep as proof ✺</button>`}${carried ? '<span class="mono faint">carried to next week ✓</span>' : `<button class="tbtn" data-wwcarry="${esc(o.id)}">carry it to next week${open ? ` (${open} open)` : ''} →</button>`}</div></div>`;
  }).join('');
  const winHTML = wins.map(w => `<div class="ww-goal"><div class="ww-t serif">${esc(w.text)}</div>${w.why ? `<p class="faint sm" style="margin:0">${esc(w.why)}</p>` : ''}
      ${(w.evidence || []).length ? `<div class="wk-ev">${w.evidence.map(ev => `<span class="wk-ev-b" title="${esc(fmtDate(ev.at, 'med'))}"><span class="wk-ev-t">${esc(ev.text)}</span></span>`).join('')}</div>` : '<p class="faint sm" style="margin:2px 0">No evidence was added.</p>'}
      ${wwReflectHTML(n, 'w:' + (w.id || w.text), 'did this week turn out to be a win in this way?')}
      <div class="ww-carry">${n.proofed && n.proofed['w:' + (w.id || w.text)] ? '<span class="mono faint">kept as proof ✓</span>' : `<button class="tbtn" data-wwproof="w:${esc(w.id || w.text)}">keep as proof ✺</button>`}</div></div>`).join('');
  const riskHTML = risks.map(r => `<div class="ww-goal"><div class="ww-t">${esc(r.text)}</div>${r.prevent ? `<p class="faint sm" style="margin:0">You planned: ${esc(r.prevent)}</p>` : ''}
      <div class="ww-ref"><input class="inp sm ww-note" data-wwn="r:${esc(r.id || r.text)}" value="${esc(n.notes['r:' + (r.id || r.text)] || '')}" placeholder="did it come? did the plan hold?" maxlength="400"></div></div>`).join('');
  return bar + (p.theme && p.theme.trim() ? `<p class="ww-theme serif">“${esc(p.theme.trim())}”</p>` : '')
    + (p.stake && p.stake.trim() ? `<p class="muted sm" style="margin:0 0 6px"><b>What was at stake:</b> ${esc(p.stake.trim())}</p>` : '')
    + sec('The goals', goalHTML) + sec('A win would be', winHTML) + sec('What could take it away', riskHTML)
    + sec('In stages', pers.length ? `<div class="stack" style="gap:4px">${pers.map(x => `<div class="row" style="gap:8px;align-items:baseline"><b class="mono" style="min-width:74px;font-size:.78rem">${esc(wpSpan(x))}</b><span>${x.name ? `<b>${esc(x.name)}</b>${x.focus ? ' — ' : ''}` : ''}${esc(x.focus || '')}</span></div>`).join('')}</div>` : '')
    + sec('Threads', thr.length ? `<div class="stack" style="gap:4px">${thr.map(t => `<div class="row" style="gap:8px;align-items:baseline;flex-wrap:wrap"><span>${esc(t.text)} <span class="mono faint">· ${esc(WEEK_THREAD_KIND[t.kind])}</span></span><span class="ww-days">${t.days.slice().sort().map(d => `<i class="${(t.done || {})[d] ? 'on' : ''}">${esc(wpDayShort(d))}</i>`).join('')}</span></div>`).join('')}</div>` : '')
    + sec('In each part of a life', aims.length ? `<div class="stack" style="gap:3px">${aims.map(l => `<div class="row" style="gap:8px"><b style="color:${esc(l.color)};min-width:110px">${esc(l.name)}</b><span>${esc(p.aims[l.id])}</span></div>`).join('')}</div>` : '');
}

/* ---------- carrying a goal on ---------- */
function weekCarryGoal(wk, o){
  const next = addDays(wk, 7), np = weekPlan(next);
  const open = (o.taskIds || []).filter(id => { const r = findTaskRef(id); return r && !r.done; });
  if(np.outcomes.some(x => (x.text || '').trim().toLowerCase() === o.text.trim().toLowerCase())) return false;
  const slot = np.outcomes.find(x => !(x.text || '').trim());
  const g = {id: uid(), text: o.text, linkType: o.linkType || '', linkId: o.linkId || null, taskIds: open};
  if(slot) Object.assign(slot, g, {id: slot.id || g.id}); else np.outcomes.push(g);
  saveNow(); return true;
}

/* ---------- the steps ---------- */
function weekWrittenStep(){
  _ww = {wk: wwDefaultWeek()};
  return {title: 'What you wrote down for the week.', hint: 'Read it as you wrote it. For each thing, say whether it happened — a word, or a line.',
    body: () => `<div id="wwBody">${weekWrittenHTML(_ww.wk)}</div>
      <label class="ww-numbers"><input type="checkbox" id="wwNum" ${(S.settings || {}).weeklyNumbers ? 'checked' : ''}> <span class="faint sm">include the numbers in my weekly review (habits, hours, study, the tape…)</span></label>`,
    bind: (b, m) => {
      const draw = () => { b.querySelector('#wwBody').innerHTML = weekWrittenHTML(_ww.wk); wire(); };
      const wire = () => {
        const body = b.querySelector('#wwBody');
        body.querySelectorAll('[data-wwwk]').forEach(x => x.onclick = () => { _ww.wk = x.dataset.wwwk; draw(); });
        body.querySelectorAll('[data-wwplan]').forEach(x => x.onclick = () => { m.remove(); openWeeklyPlan(x.dataset.wwplan); });
        body.querySelectorAll('[data-wwv]').forEach(x => x.onclick = () => { const [key, v] = x.dataset.wwv.split('|'), n = wwNotes(_ww.wk, true);
          n.verdicts[key] = n.verdicts[key] === v ? '' : v; save(); x.parentNode.querySelectorAll('[data-wwv]').forEach(c => c.classList.toggle('on', c === x && !!n.verdicts[key])); sound('click'); });
        body.querySelectorAll('[data-wwn]').forEach(x => x.oninput = () => { const n = wwNotes(_ww.wk, true); n.notes[x.dataset.wwn] = x.value; save(); });
        body.querySelectorAll('[data-wwt]').forEach(x => x.onclick = () => { const r = findTaskRef(x.dataset.wwt); if(!r) return; setTaskDone(r.id, !r.done); draw(); });
        body.querySelectorAll('[data-wwproof]').forEach(x => x.onclick = () => {
          const key = x.dataset.wwproof, pl = weekPlanSeen(_ww.wk), n = wwNotes(_ww.wk, true), gid = key.slice(2);
          const g = key[0] === 'g' ? (pl.outcomes || []).find(o => o.id === gid) : weekWins(pl).find(w => (w.id || w.text) === gid);
          if(!g) return; const done = key[0] === 'g' ? (g.taskIds || []).map(id => findTaskRef(id)).filter(r => r && r.done).map(r => r.text) : [];
          const ev = key[0] === 'w' ? (g.evidence || []).map(e => e.text) : [];
          const e = proofKeep({title: g.text, body: [done.length ? 'Done: ' + done.join('; ') : '', ev.length ? 'Evidence: ' + ev.join('; ') : '', n.notes[key] || ''].filter(Boolean).join('\n'), day: addDays(_ww.wk, 6) > today() ? today() : addDays(_ww.wk, 6), source: 'weekly review'});
          if(e){ n.proofed = n.proofed || {}; n.proofed[key] = e.id; save(); toast('Kept as proof.', 3000); sound('success'); draw(); } });
        body.querySelectorAll('[data-wwcarry]').forEach(x => x.onclick = () => {
          const o = (weekPlanSeen(_ww.wk).outcomes || []).find(g => g.id === x.dataset.wwcarry); if(!o) return;
          const made = weekCarryGoal(_ww.wk, o), n = wwNotes(_ww.wk, true); n.carried[o.id] = true; save();
          toast(made ? 'Carried into next week’s goals, with only the work still open.' : 'It is already one of next week’s goals.', 3500); draw(); });
      };
      wire();
      const cb = b.querySelector('#wwNum'); if(cb) cb.onchange = () => { S.settings.weeklyNumbers = cb.checked; saveNow(); m.remove(); flowWeekly(); };
    }};
}
function weekReflectStep(){
  return {title: 'In your own words.', hint: 'Not a score — a sentence or two each. These stay with the week, and show up when you read it back.',
    body: () => { const n = wwNotes(_ww ? _ww.wk : wwDefaultWeek(), false);
      return `<div class="stack" style="gap:12px"><label class="pd-q"><span class="k">What I would keep from this week</span><textarea class="ta" id="wwKeep" style="min-height:72px" placeholder="what worked, what I am glad I did, what I want more of">${esc(n.keep)}</textarea></label>
        <label class="pd-q"><span class="k">What I would change</span><textarea class="ta" id="wwChange" style="min-height:72px" placeholder="what got in the way, what I would do differently next time">${esc(n.change)}</textarea></label></div>`; },
    bind: b => { const wk = _ww ? _ww.wk : wwDefaultWeek();
      const w = (id, k) => { const el = b.querySelector(id); if(el) el.oninput = () => { wwNotes(wk, true)[k] = el.value; save(); }; };
      w('#wwKeep', 'keep'); w('#wwChange', 'change'); },
    next: b => { const wk = _ww ? _ww.wk : wwDefaultWeek(), k = b.querySelector('#wwKeep'), c = b.querySelector('#wwChange');
      if(k && c && (k.value.trim() || c.value.trim() || wwNotes(wk, false).keep || wwNotes(wk, false).change)){ const n = wwNotes(wk, true); n.keep = k.value.trim(); n.change = c.value.trim(); saveNow(); } }};
}
