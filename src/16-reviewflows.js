/* ============================================================
   GUIDED REVIEWS — the flows that keep the system alive
   Seven rituals, from the morning to the year. Each is a sequence
   of steps,
   every step pre-filled with what the instrument already knows,
   so the work is noticing rather than remembering.
   ============================================================ */
function guidedFlow(title, steps, onDone, opts = {}){
  /* `flow` names this review so it can be reopened at the same step after the
     user steps out of it to write an entry; `startAt` is where to reopen. */
  let i = clamp(opts.startAt | 0, 0, steps.length - 1);
  const m = openModal('', 'wide');
  const draw = () => {
    const st = steps[i];
    m.querySelector('.modal').innerHTML = `<button class="close">×</button>
      <div class="mono">${esc(title)} · step ${i+1} of ${steps.length}</div>
      <h2 style="margin:4px 0 6px">${esc(st.title)}</h2>
      ${st.hint ? `<p class="muted" style="font-size:.88rem;margin:0 0 12px">${st.hint}</p>` : ''}
      <div class="flow-body" id="flowBody">${typeof st.body === 'function' ? (st.body() || '') : (st.body || '')}</div>
      <div class="flow-dots">${steps.map((_,k) => `<i class="${k===i?'on':k<i?'past':''}"></i>`).join('')}</div>
      <div class="row between" style="margin-top:14px">
        <span class="row" style="gap:6px">${i ? '<button class="btn sm ghost" id="fwBack">back</button>' : ''}</span>
        <button class="btn primary" id="fwNext">${i === steps.length-1 ? 'Close the review' : 'Next'}</button></div>`;
    /* closing the review on purpose means it is not waiting to be resumed */
    m.querySelector('.close').onclick = () => { clearReviewReturn(); m.remove(); };
    const body = m.querySelector('#flowBody');
    /* Steps that embed page HTML (the Life Tape views, mostly) bring `.rv`
       reveal wrappers with them. Those sit at opacity 0 until something adds
       `.in`, and only rerender() does that — scoped to #main, never a modal.
       Without this the first step of every periodic review draws blank. */
    body.querySelectorAll('.rv').forEach(n => n.classList.add('in'));
    st.bind && st.bind(body, m);
    body.querySelectorAll('[data-flowgo]').forEach(b => b.onclick = () => { const go = b.dataset.flowgo; m.remove(); navigate(go); });
    body.querySelectorAll('[data-flowquick]').forEach(b => b.onclick = () => openEntryModal({type:b.dataset.flowquick, after:()=>{}}));
    m.querySelector('#fwBack') && (m.querySelector('#fwBack').onclick = () => { i--; draw(); });
    m.querySelector('#fwNext').onclick = () => { st.next && st.next(body); if(i === steps.length-1){ m.remove(); clearReviewReturn(); onDone && onDone(); return; } i++; draw(); };
    /* anything in this step that leaves the review records where to come back to */
    body.querySelectorAll('[data-capreturn]').forEach(b => b.addEventListener('click', () => {
      if(opts.flow) stashReviewReturn({flow: opts.flow, step: i, scroll: m.scrollTop || 0});
    }, true));
    attachDictationIn(m);
    if(opts.scroll) requestAnimationFrame(() => { m.scrollTop = opts.scroll; });
  };
  draw();
  m.addEventListener('mousedown', ev => { if(ev.target === m) clearReviewReturn(); });   // dismissed on the backdrop
  return m;
}
const REVIEW_LOG = () => (S.reviews = S.reviews || {});
function reviewDone(key){ REVIEW_LOG()[key] = today();
  /* record which period this answered, not just that it happened today */
  if(typeof markCycleAnswered === 'function') markCycleAnswered(key);
  saveNow(); sound('success'); rerender(); }
const reviewAge = key => daysSince(REVIEW_LOG()[key]);

/* ---------- 1. the morning practice ---------- */
function flowMorning(){
  const T = today(); const c = checkin(T);
  guidedFlow('Morning practice', [
    {title:'Sit quietly. Close your eyes.', hint:'Thirty minutes, in the order Maltz taught it. Nothing here needs typing yet.',
     body: () => `<blockquote class="rehearsal-epigraph">${esc((S.rehearsal.script || '').slice(0, 400) || 'Your self-image script is not written yet. Write it on Today and this step will read it back to you.')}<cite>the self-image script</cite></blockquote>
       <div class="row" style="margin-top:10px"><button class="btn sm ghost" data-flowgo="#/today">open the Morning Theatre</button></div>`},
    {title:'Visualise for fifteen to twenty minutes.', hint:'See yourself acting, feeling and being as you want to be. Sensory detail is the whole technique — your nervous system cannot tell a vividly imagined experience from a real one.',
     body: () => `<div class="card"><div class="quote">${esc((S.rehearsal.winning || '').slice(0, 300) || 'The winning feeling is not written yet. Today has the field.')}</div></div>
       <div class="row" style="margin-top:10px"><button class="btn sm ghost" data-flowquick="visualization">log what you saw</button></div>`},
    {title:'Read your Definite Chief Aim aloud.', hint:'With emotion, twice a day. Hill was specific about the emotion.',
     body: () => `<div class="intention-card serif-lg">${esc(S.rehearsal.aim || 'Not written yet — Today has the field, and Finance can draft the number for you.')}</div>`},
    {title:'Where are you on the scale?', hint:'Honestly, not aspirationally. You cannot leap the scale; you can only reach for the rung above.',
     body: () => `<input class="rng" type="range" min="1" max="22" value="${c.setpoint || 11}" id="fwSp" style="width:100%">
       <div class="row between"><span id="fwSpName" class="serif">${esc(hicksName(c.setpoint || 11))}</span><span class="mono" id="fwSpNum">${c.setpoint || 11}</span></div>`,
     bind: b => { const r = b.querySelector('#fwSp'); r.oninput = () => { b.querySelector('#fwSpName').textContent = hicksName(+r.value); b.querySelector('#fwSpNum').textContent = r.value; }; },
     next: b => { c.setpoint = +b.querySelector('#fwSp').value; saveNow(); }},
    {title: "Today's one intention.", hint:'One thing to give attention to. Not a list.',
     body: () => `<input class="inp serif-lg" id="fwInt" value="${esc(c.intention || '')}" placeholder="Today I give my attention to…">`,
     next: b => { c.intention = b.querySelector('#fwInt').value.trim(); saveNow(); }},
    {title:'Mark the practice.', hint:'Consistency, quietly. The tracker is the only scoreboard here.',
     body: () => { const done = (S.rehearsal.days || []).includes(T);
       return `<div class="rev-summary">${done ? 'Marked for today already.' : 'This marks today on the twenty-one-day tracker.'}${(S.rehearsal.days||[]).length?` <span class="mono">${S.rehearsal.days.length} days logged</span>`:''}</div>`; },
     next: () => { S.rehearsal.days = S.rehearsal.days || []; if(!S.rehearsal.days.includes(T)){ S.rehearsal.days.push(T); S.rehearsal.cycleStart = S.rehearsal.cycleStart || T; } }},
  ], () => { reviewDone('lastMorning'); toast('The practice is marked.'); });
}

/* ---------- 2. the evening review ---------- */
function flowEvening(opts = {}){
  const T = today(); const c = checkin(T); const r = dayReview(T); const TOM = addDays(T, 1);
  guidedFlow('Evening review', [
    {title:'The rings, before the day closes.', hint:'Anything unfilled? Fill it, or let it stand as a miss — both are honest.',
     body: () => habitRingRow(T), bind: b => bindHabitRings(b)},
    {title:'Tonight, in four dimensions.', hint:'Where the energy actually ended up.',
     body: () => `<div class="energy-row">${DIMS.map(x => `<div class="energy-dim" style="--c:${x.c}"><div class="lbl"><span>${x.name}</span></div><div class="feeling">${[1,2,3,4,5].map(n=>`<button data-fwen="${x.id}:${n}" class="${(c.energy?.[x.id]||0)===n?'on':''}">${n}</button>`).join('')}</div></div>`).join('')}</div>`,
     bind: b => b.querySelectorAll('[data-fwen]').forEach(btn => btn.onclick = () => { const [id,n] = btn.dataset.fwen.split(':'); c.energy = c.energy || {}; c.energy[id] = +n; saveNow();
       b.querySelectorAll(`[data-fwen^="${id}:"]`).forEach(x => x.classList.toggle('on', x === btn)); })},
    {title:'And the set-point — where did it land?', hint:`This morning you were ${c.setpoint ? hicksName(c.setpoint).split(' / ')[0] : 'not on the scale yet'}.`,
     body: () => `<div class="energy-faces">${[1,2,3,4,5].map(n=>`<button class="ef ${r.energy===n?'on':''}" data-fwef="${n}" title="${['drained','low','level','good','full'][n-1]}">${n}</button>`).join('')}</div>`,
     bind: b => b.querySelectorAll('[data-fwef]').forEach(btn => btn.onclick = () => { r.energy = +btn.dataset.fwef; saveNow(); b.querySelectorAll('[data-fwef]').forEach(x => x.classList.toggle('on', x === btn)); })},
    {title:'What actually got done.', hint:'The list you made this morning, against the day you had.',
     body: () => tasksReviewHTML(T, T)},
    {title:'Anything else from today?', hint:'Before the day closes — anything that happened and has not been written down anywhere.',
     body: () => captureStepHTML(T, T), bind: b => bindCaptureStep(b, T, T)},
    {title:'Plan tomorrow.', hint:'While today is still in the room, and you can still judge it honestly. Everything here saves as you type.',
     body: () => planStepHTML(TOM), bind: b => bindPlanStep(b, TOM),
     next: () => { const p = dayPlan(TOM); p.planned = true;
       const first = (p.intentions || []).filter(Boolean)[0];
       if(first && typeof checkin === 'function' && !checkin(TOM).intention) checkin(TOM).intention = first;
       saveNow(); }},
  /* The "One line." step is gone by request. It wrote three things: the
     day's note, the day's one-sentence summary, and a reflection entry. A
     reflection can still be written at any hour from Journals or ⌘N, which
     is where every other entry is made; the day's note and summary now have
     no writer, and the two places that show them simply stay quiet.
     Marking the day closed was the one thing only this step did, so that
     moves here — finishing the review is what closes the day. */
  ], () => { const rv = dayReview(T); rv.closedAt = rv.closedAt || new Date().toTimeString().slice(0,5);
    saveNow(); reviewDone('lastEvening'); toast('Day closed.'); },
    {flow:'evening', startAt: opts.startAt, scroll: opts.scroll});
}

/* ---------- 3. the weekly review ---------- */
function flowWeekly(opts = {}){
  const T = today(); const days = planDaysFrom(T);
  guidedFlow('Weekly review', [
    {title:'The week, in shape.', hint:'Which days were full? Which were quiet? Is there a pattern you did not choose?',
     body: () => tapeWeekHTML(T)},
    {title:'The habits held, or they did not.',
     body: () => { const list = S.habits.filter(h => !h.archived && !h.negative);
       const due = sum(days.map(d => list.filter(h => habitDue(h,d)).length));
       const done = sum(days.map(d => list.filter(h => habitDue(h,d) && habitDone(h,d)).length));
       return `<div class="rev-summary">${due ? `<b>${Math.round(done/due*100)}%</b> of what was due — ${done} of ${due}.` : 'No habits were due this week.'}</div>${habitOscillationHTML(7)}`; }},
    {title:'A congruence snapshot.', hint:'Sliders pre-filled with last week — move only what actually moved.',
     body: () => `<div class="row"><button class="btn sm primary" id="fwSnap">log a snapshot</button></div>`,
     bind: b => b.querySelector('#fwSnap').onclick = () => openSnapshotModal(() => {})},
    {title:'Which dimension did you overtrain?', hint:'And which one went unpaid this week?',
     body: () => { const bal = energyBalance(true);
       return `<div class="stack" style="gap:6px">${DIMS.map(d => { const b2 = bal[d.id] || {exp:0,rec:0}; const t = b2.exp + b2.rec;
         return `<div class="row between"><span style="color:${d.c};min-width:6em">${d.name}</span><span class="bar" style="flex:1;--c:${d.c}"><i style="width:${Math.min(100,t*12)}%"></i></span><span class="mono">${t} logged</span></div>`; }).join('')}</div>`; }},
    {title:'The week against the lists you made.', hint:'Seven days of intentions, against seven days of evidence.',
     body: () => tasksReviewHTML(days[0], days[6])},
    {title:'Anything else from this week?', hint:'Anything that happened and never got written down. Add it here and the review stays where it is.',
     body: () => captureStepHTML(days[0], days[6]), bind: b => bindCaptureStep(b, days[0], days[6])},
    {title:"Next week's one intention.",
     body: () => `<textarea class="ta" id="fwWk" placeholder="One sentence. It is the first thing you will see on Monday.">${esc(S.reviews.nextWeekFocus || '')}</textarea>`,
     next: b => { S.reviews.nextWeekFocus = b.querySelector('#fwWk').value.trim(); saveNow(); }},
  ], () => { reviewDone('lastWeekly'); toast('Week reviewed.'); }, {flow:'weekly', startAt: opts.startAt, scroll: opts.scroll});
}

/* ---------- 4. the seasonal review ---------- */
function flowSeasonal(){
  guidedFlow('Quarterly review', [
    {title:'Ninety days, at once.', hint:'Dry spells, surges, the weeks you cannot remember. Look before you interpret.',
     body: () => { const t = tapeState(); t.mode = 'total'; return tapeYearHTML(new Date().getFullYear()); }},
    {title:'Re-rank what matters.', hint:'The order changes. The previous ranking is kept.',
     body: () => `<div class="row"><button class="btn sm ghost" data-flowgo="#/values">open the compass</button></div>`},
    {title:'Re-read one past stage. Does it still feel true?',
     body: () => { const s = S.stages.filter(x=>!x.notyet && x.narrative)[Math.floor(Math.random()*Math.max(1,S.stages.filter(x=>!x.notyet && x.narrative).length))];
       return s ? `<div class="card"><b class="serif">${esc(s.char||'')} ${esc(s.name)}</b><div class="quote" style="margin-top:6px">${esc((s.narrative||'').slice(0,320))}…</div><div class="row" style="margin-top:8px"><button class="btn sm ghost" data-flowgo="#/stage/${s.id}">open it</button></div></div>` : '<div class="empty">No stage narratives written yet.</div>'; }},
    {title:'Revisit the flagged synchronicities.', hint:'They often only make sense from here.',
     body: () => { const f = S.entries.filter(e => e.type === 'synchronicity' && e.extra?.revisit);
       return f.length ? f.slice(0,4).map(e=>entryCard(e)).join('') : '<div class="empty">None flagged.</div>'; }},
    {title:'What is going quiet?', hint:'Skills untouched for three months, and habits below half.',
     body: () => { const atro = S.skills.filter(s => !s.planned && typeof skillLastPracticed === 'function' && daysSince(skillLastPracticed(s)) > 90);
       const cold = S.habits.filter(h => !h.archived && !h.negative).map(h => ({h, r:habitWeekRates(h,4)})).filter(o => sum(o.r.map(x=>x.done)) / Math.max(1,sum(o.r.map(x=>x.due))) < .5);
       return `${atro.length?`<div class="rev-summary">Atrophying: ${atro.map(s=>`<b>${esc(s.name)}</b>`).join(', ')}.</div>`:''}
         ${cold.length?`<div class="rev-summary">Below half: ${cold.map(o=>`<b>${esc(o.h.name)}</b>`).join(', ')}.</div>`:''}
         ${!atro.length&&!cold.length?'<div class="empty">Nothing drifting. Unusual, and worth noticing.</div>':''}`; }},
    {title:'The five closest.', hint:'Update the energy readings. Who has moved without you deciding it?',
     body: () => `<div class="row"><button class="btn sm ghost" data-flowgo="#/people">open the constellation</button></div>`},
    {title:'The money, honestly.', hint:'Update the stream figures and see what the runway says now.',
     body: () => { if(typeof portfolioTotals !== 'function') return '';
       const {totalCurrentBase, streams} = portfolioTotals(); const rw = typeof runway === 'function' ? runway() : null;
       return `<div class="rev-summary">${money(totalCurrentBase)}/mo across ${streams.length} stream${streams.length===1?'':'s'}${rw ? (rw.sustainable ? ` · sustainable, +${money(rw.surplus)}/mo` : ` · ${Math.round(rw.months)} months of runway`) : ''}.</div>
         <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-flowgo="#/finance">open Finance</button></div>`; }},
  ], () => { reviewDone('lastSeasonal'); toast('Season reviewed.'); });
}

/* ---------- 5. the annual rite ---------- */
function flowAnnual(){
  const year = new Date().getFullYear();
  guidedFlow('Annual rite', [
    {title:'The year, all of it.', hint:'Toggle the modes. What do you see that you did not live through consciously?',
     body: () => tapeYearHTML(year)},
    {title:"Write the year's narrative.", hint:'It saves as a reflection you can tag to the stage it belongs to.',
     body: () => `<div class="row"><button class="btn sm primary" data-flowquick="reflection">write it</button></div>`},
    {title:'Mint the year into the Timeline.', hint:'A sub-stage for what this year was.',
     body: () => `<div class="row"><button class="btn sm ghost" data-flowgo="#/journals/timeline">open the Timeline</button></div>`},
    {title:"Re-read what you wrote a year ago.", hint:'Which came closer? Which drifted, and did you choose that?',
     body: () => { const y = addDays(today(), -365);
       const es = S.entries.filter(e => { const d = (e.occurredAt||e.createdAt||'').slice(0,10); return d >= addDays(y,-14) && d <= addDays(y,14) && (e.body||'').length > 60; }).slice(0,3);
       return es.length ? es.map(e=>`<div class="card" style="margin-bottom:8px"><b class="serif">${esc(e.title||e.type)}</b><div class="quote" style="margin-top:4px">${esc((e.body||'').slice(0,220))}</div><div class="mono" style="margin-top:4px">${esc(fmtDate((e.occurredAt||e.createdAt||'').slice(0,10),'med'))}</div></div>`).join('') : '<div class="empty">Nothing written around this time last year.</div>'; }},
    {title:'The compass, January to December.',
     body: () => `<div class="row"><button class="btn sm ghost" data-flowgo="#/values">open the radar</button></div>`},
    {title:"The year's set-point trend.", hint:'Did you climb the scale, or hold?',
     body: () => { const sps = Object.entries(S.checkins||{}).filter(([d,c]) => d.startsWith(String(year)) && c.setpoint).sort((a,b)=>a[0].localeCompare(b[0])).map(([,c])=>c.setpoint);
       return sps.length > 2 ? `${sparkline(sps, {h:44, color:'var(--gold)', min:1, max:22})}<div class="mono">from ${hicksName(sps[0]).split(' / ')[0]} to ${hicksName(sps[sps.length-1]).split(' / ')[0]} · average ${avg(sps).toFixed(1)}/22</div>` : '<div class="empty">Not enough set-point readings this year to draw a line.</div>'; }},
    {title:'Who did you become this year?', hint:'Read the self-image script back, and rewrite it if it has gone out of date.',
     body: () => `<blockquote class="rehearsal-epigraph">${esc((S.rehearsal.script||'').slice(0,320) || 'Not written yet.')}</blockquote><div class="row" style="margin-top:8px"><button class="btn sm ghost" data-flowgo="#/today">open the Theatre</button></div>`},
    {title:'The constellation, a year on.', hint:'Who entered, who left, and who moved ring without either of you saying so?',
     body: () => { const core = (S.people||[]).filter(p => ['core','close'].includes(p.circle));
       return `<div class="row" style="gap:6px;flex-wrap:wrap">${core.map(p=>`<span class="chip on">${esc(p.name)}</span>`).join('') || '<span class="faint">No one in the inner rings yet.</span>'}</div>
         <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-flowgo="#/people">open it</button></div>`; }},
    {title:'The year in money.',
     body: () => { if(typeof portfolioTotals !== 'function') return '';
       const {totalCurrentBase, totalTargetBase} = portfolioTotals();
       return `<div class="rev-summary">${money(totalCurrentBase)}/mo now, against a target of ${money(totalTargetBase)}/mo.</div><div class="row" style="margin-top:8px"><button class="btn sm ghost" data-flowgo="#/finance">open Finance</button></div>`; }},
    {title:'Three things the coming year is for.',
     body: () => `<textarea class="ta serif-lg" id="fwYear" placeholder="Three lines. Not resolutions — the shape you want the year to have.">${esc(S.reviews.nextYearFocus || '')}</textarea>`,
     next: b => { S.reviews.nextYearFocus = b.querySelector('#fwYear').value.trim(); saveNow(); }},
    {title:"A letter to next year's self.", hint:'Sealed until this date, next year.',
     body: () => `<div class="row"><button class="btn sm primary" id="fwLetter">seal a letter</button></div>`,
     bind: b => b.querySelector('#fwLetter').onclick = () => { if(typeof openLetterModal === 'function') openLetterModal(); }},
  ], () => { reviewDone('lastAnnual'); toast('The rite is complete.'); });
}


/* ---------- the monthly review ---------- */
function flowMonthly(){
  const T = today(); const mk = monthKey(T); const mp = monthPlan(mk); const mr = monthReview(mk);
  const a = parseDay(T); const {from, to} = monthRange(a.getFullYear(), a.getMonth());
  const items = () => tapeFilter(tapeItems(from, to));
  guidedFlow('Monthly review', [
    {title:'The month, at once.', hint:'Before you interpret it, look at it.',
     body: () => { const t = tapeState(); t.day = T; return tapeMonthHTML(T); }},
    {title:'The milestones you named.', hint:'Tick what landed. An unticked milestone is information, not a failure.',
     body: () => { const named = mp.milestones.map((ms,i) => ({...ms, i})).filter(ms => ms.text);
       return named.length ? `<div class="stack" style="gap:4px">${named.map(ms => `<label class="pick-row ${ms.done?'on':''}"><input type="checkbox" data-mrms="${ms.i}" ${ms.done?'checked':''}><span>${esc(ms.text)}</span></label>`).join('')}</div>`
         : '<div class="empty">No milestones were set for this month. The Plan tab takes them for next month.</div>'; },
     bind: b => b.querySelectorAll('[data-mrms]').forEach(c => c.onchange = () => { mp.milestones[+c.dataset.mrms].done = c.checked; saveNow(); c.closest('.pick-row').classList.toggle('on', c.checked); })},
    {title:'The habits, across the whole month.',
     body: () => { const days = []; let d = from; while(d <= (to > T ? T : to)){ days.push(d); d = addDays(d,1); }
       const rows = S.habits.filter(h => !h.archived && !h.negative).map(h => ({h, rate: habitMonthRate(h, days)})).filter(o => o.rate !== null);
       return rows.length ? `<div class="stack" style="gap:5px">${rows.map(({h,rate}) => `<div class="row between"><span style="min-width:7em">${esc(h.name)}</span><span class="bar" style="flex:1;--c:${(DIMS.find(x=>x.id===h.dimension)||{}).c||'var(--page-accent)'}"><i style="width:${rate}%"></i></span><span class="mono">${rate}%</span></div>`).join('')}</div>${habitOscillationHTML(30)}` : '<div class="empty">No habits tracked this month.</div>'; }},
    {title:'What the month was made of.', hint:'Which rooms of the house got used, and which stayed shut?',
     body: () => { const tally = {}; items().forEach(x => { const sec = tapeKind(x.kind)[0]; tally[sec] = (tally[sec]||0)+1; });
       const list = Object.entries(tally).sort((a,b)=>b[1]-a[1]); const max = Math.max(1, ...list.map(x=>x[1]));
       const quiet = TAPE_SECTIONS.filter(sec => !tally[sec]);
       return `${list.length ? `<div class="stack" style="gap:5px">${list.map(([sec,n]) => `<div class="row between"><span style="min-width:7em">${esc(sec)}</span><span class="bar" style="flex:1;--c:var(--page-accent)"><i style="width:${Math.round(n/max*100)}%"></i></span><span class="mono">${n}</span></div>`).join('')}</div>` : '<div class="empty">Nothing logged this month.</div>'}
         ${quiet.length ? `<div class="faint" style="font-size:.8rem;margin-top:8px">Untouched: ${quiet.map(esc).join(', ')}.</div>` : ''}`; }},
    {title:'Energy and mood, over thirty days.',
     body: () => { const days = []; let d = from; while(d <= (to > T ? T : to)){ days.push(d); d = addDays(d,1); }
       const sps = days.map(d2 => S.checkins?.[d2]?.setpoint || null);
       const revs = days.map(d2 => S.reviewLog?.[d2]).filter(r => r && r.energy);
       const moods = {}; days.forEach(d2 => (S.reviewLog?.[d2]?.moods||[]).forEach(mm => moods[mm] = (moods[mm]||0)+1));
       return `${sps.filter(Boolean).length > 2 ? sparkline(sps, {h:44, color:'var(--gold)', min:1, max:22}) : ''}
         <div class="row between mono" style="margin-top:6px"><span>average set-point</span><span>${sps.filter(Boolean).length ? avg(sps.filter(Boolean)).toFixed(1) : '—'} / 22</span></div>
         <div class="row between mono"><span>average evening energy</span><span>${revs.length ? avg(revs.map(r=>r.energy)).toFixed(1) : '—'} / 5</span></div>
         ${Object.keys(moods).length ? `<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px">${Object.entries(moods).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([mm,n])=>`<span class="chip on">${esc(mm)} · ${n}</span>`).join('')}</div>` : ''}`; }},
    {title:'What carries into next month.',
     body: () => `<textarea class="ta" id="fwMr" placeholder="What this month was, and what it hands over.">${esc(mr.note || '')}</textarea>`,
     next: b => { mr.note = b.querySelector('#fwMr').value.trim(); mr.closedAt = today(); saveNow(); }},
  ], () => { reviewDone('lastMonthly'); toast('Month reviewed.'); });
}

/* ---------- the half-year review ---------- */
function halfKey(d = today()){ const a = parseDay(d); return `${a.getFullYear()}-H${a.getMonth() < 6 ? 1 : 2}`; }
function halfNote(k){ S.reviews.halfNotes = S.reviews.halfNotes || {}; if(!S.reviews.halfNotes[k]) S.reviews.halfNotes[k] = {note:'', closedAt:''}; return S.reviews.halfNotes[k]; }
function flowHalf(){
  const T = today(); const a = parseDay(T); const y = a.getFullYear(); const firstHalf = a.getMonth() < 6;
  const from = `${y}-${firstHalf?'01':'07'}-01`, to = firstHalf ? `${y}-06-30` : `${y}-12-31`;
  const hn = halfNote(halfKey(T));
  guidedFlow('Half-year review', [
    {title:'Six months, side by side.', hint:'Long enough to see a season change, short enough to remember it.',
     body: () => tapeSpanHTML(T, 6, 'half')},
    {title:'What actually moved?', hint:'Movement is evidence, not enthusiasm.',
     body: () => { const done = S.projects.filter(p => p.status === 'completed');
       const skills = S.skills.filter(x => !x.archived && (x.currentLevel||0) > 0);
       return `<div class="stack" style="gap:5px">
         <div class="row between"><span>projects finished</span><span class="mono">${done.length}</span></div>
         <div class="row between"><span>skills carrying a level</span><span class="mono">${skills.length}</span></div>
         <div class="row between"><span>entries written</span><span class="mono">${S.entries.filter(e => { const d=(e.occurredAt||e.createdAt||'').slice(0,10); return d>=from && d<=to; }).length}</span></div>
       </div>`; }},
    {title:'The compass, half a year on.', hint:'Has the order changed? Is anything going unpaid?',
     body: () => { const gaps = typeof valueGaps === 'function' ? valueGaps() : [];
       return `${gaps.length ? `<div class="stack" style="gap:5px">${gaps.slice(0,5).map(g => `<div class="row between"><span>${esc(g.name)}</span><span class="mono" style="color:${g.gap < -10 ? '#c9a05a' : 'inherit'}">${g.gap>0?'+':''}${g.gap}</span></div>`).join('')}</div>` : ''}
         <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-flowgo="#/values">open the compass</button></div>`; }},
    {title:'Who moved.', hint:'Six months is long enough for a ring to change without anyone saying so.',
     body: () => { const ints = (S.interactions||[]).filter(i => (i.date||'') >= from && (i.date||'') <= to);
       const tally = {}; ints.forEach(i => tally[i.personId] = (tally[i.personId]||0)+1);
       const rows = Object.entries(tally).sort((x,z)=>z[1]-x[1]).slice(0,6);
       const cold = (S.people||[]).filter(p => ['core','close'].includes(p.circle) && !tally[p.id]);
       return `${rows.length ? `<div class="stack" style="gap:5px">${rows.map(([pid,n]) => `<div class="row between"><span>${esc(byId(S.people,pid)?.name||'someone')}</span><span class="mono">${n} logged</span></div>`).join('')}</div>` : '<div class="empty">No interactions logged in this half.</div>'}
         ${cold.length ? `<div class="faint" style="font-size:.8rem;margin-top:8px">In your inner rings with nothing logged: ${cold.map(p=>esc(p.name)).join(', ')}.</div>` : ''}
         <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-flowgo="#/people">open the constellation</button></div>`; }},
    {title:'Skills and work, six months of it.',
     body: () => { const prog = S.entries.filter(e => e.type === 'progress' && (e.occurredAt||'') >= from && (e.occurredAt||'') <= to).length;
       const nods = (S.nods||[]).filter(n => (n.date||'') >= from && (n.date||'') <= to).length;
       const active = S.projects.filter(p => p.status === 'active').length;
       return `<div class="income-strip"><div><div class="k">practice logged</div><div class="num">${prog}</div></div>
         <div><div class="k">nods</div><div class="num">${nods}</div></div>
         <div><div class="k">projects active</div><div class="num">${active}</div></div></div>`; }},
    {title:'The money, half a year on.',
     body: () => { if(typeof portfolioTotals !== 'function') return '';
       const {totalCurrentBase, totalTargetBase, streams} = portfolioTotals(); const rw = typeof runway === 'function' ? runway() : null;
       return `<div class="rev-summary">${money(totalCurrentBase)}/mo across ${streams.length} stream${streams.length===1?'':'s'}, against ${money(totalTargetBase)}/mo at target${rw ? (rw.sustainable ? ` · sustainable, +${money(rw.surplus)}/mo` : ` · ${Math.round(rw.months)} months of runway`) : ''}.</div>
         <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-flowgo="#/finance">open Finance</button></div>`; }},
    {title:'What the next six months are for.', hint:'One paragraph. It is the thing you will read back in January or July.',
     body: () => `<textarea class="ta" id="fwHalf" style="min-height:120px" placeholder="The next six months are for…">${esc(hn.note || '')}</textarea>`,
     next: b => { hn.note = b.querySelector('#fwHalf').value.trim(); hn.closedAt = today(); saveNow(); }},
  ], () => { reviewDone('lastHalf'); toast('Half-year reviewed.'); });
}

/* ---------- the hub ---------- */
const REVIEW_FLOWS = [
  ['lastMorning',  'Morning practice',  '30 minutes', 'Maltz, Hill and Hicks, in the order they work: script, visualise, aim, set-point, intention, mark.', flowMorning],
  ['lastEvening',  'Evening review',    '5 minutes',  'Close the day honestly: the rings, what actually happened, the energy it ended on, and tomorrow.', flowEvening],
  ['lastWeekly',   'Weekly review',     '15 minutes', "The week's shape, the habits, a congruence snapshot, current reality on the tension that carries most.", flowWeekly],
  ['lastMonthly',  'Monthly review',    '15 minutes', 'The month at once: the milestones you named, the habits across thirty days, which rooms got used, and what carries over.', flowMonthly],
  ['lastSeasonal', 'Quarterly review',  '30 minutes', 'A season: values re-ranked, confidence rungs, what is going quiet, the five closest, the money.', flowSeasonal],
  ['lastHalf',     'Half-year review',  '45 minutes', 'Six months side by side: what actually moved, who moved rings, the compass, and what the next six are for.', flowHalf],
  ['lastAnnual',   'Annual rite',       '1–2 hours',  'The whole year on one screen, then the narrative, the letter, and what the next one is for.', flowAnnual],
];
const REVIEW_DUE = {lastMorning:1, lastEvening:1, lastWeekly:7, lastMonthly:30, lastSeasonal:90, lastHalf:182, lastAnnual:365};
/* The hub is gone: a review is not something you go and look for. Each one now
   surfaces on Today the night its cycle closes — see reviewsDue(). */
