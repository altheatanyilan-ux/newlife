/* ============================================================
   GUIDED REVIEWS — the flows that keep the system alive
   Five rituals at five cadences. Each is a sequence of steps,
   every step pre-filled with what the instrument already knows,
   so the work is noticing rather than remembering.
   ============================================================ */
function guidedFlow(title, steps, onDone){
  let i = 0; const m = openModal('', 'wide');
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
    m.querySelector('.close').onclick = () => m.remove();
    const body = m.querySelector('#flowBody');
    st.bind && st.bind(body, m);
    body.querySelectorAll('[data-flowgo]').forEach(b => b.onclick = () => { const go = b.dataset.flowgo; m.remove(); navigate(go); });
    body.querySelectorAll('[data-flowquick]').forEach(b => b.onclick = () => openEntryModal({type:b.dataset.flowquick, after:()=>{}}));
    m.querySelector('#fwBack') && (m.querySelector('#fwBack').onclick = () => { i--; draw(); });
    m.querySelector('#fwNext').onclick = () => { st.next && st.next(body); if(i === steps.length-1){ m.remove(); onDone && onDone(); return; } i++; draw(); };
    attachDictationIn(m);
  };
  draw();
  return m;
}
const REVIEW_LOG = () => (S.reviews = S.reviews || {});
function reviewDone(key){ REVIEW_LOG()[key] = today(); saveNow(); sound('success'); rerender(); }
const reviewAge = key => daysSince(REVIEW_LOG()[key]);

/* ---------- 1. the morning practice ---------- */
function flowMorning(){
  const T = today(); const c = checkin(T);
  guidedFlow('Morning practice', [
    {title:'Sit quietly. Close your eyes.', hint:'Thirty minutes, in the order Maltz taught it. Nothing here needs typing yet.',
     body: () => `<blockquote class="rehearsal-epigraph">${esc((S.rehearsal.script || '').slice(0, 400) || 'Your self-image script is not written yet. Write it on Today and this step will read it back to you.')}<cite>the self-image script</cite></blockquote>
       <div class="row" style="margin-top:10px"><button class="btn sm ghost" data-flowgo="#/today">open the Morning Theatre</button></div>`},
    {title:'Visualise for fifteen to twenty minutes.', hint:'See yourself acting, feeling and being as you want to be. Sensory detail is the whole technique — your nervous system cannot tell a vividly imagined experience from a real one.',
     body: () => { const v = S.visions.filter(x => !x.archived && x.confidence !== 'lived')[0];
       return v ? `<div class="card"><b class="serif">${esc(v.name)}</b>${v.sensory?.see?`<div class="quote" style="margin-top:6px">${esc(v.sensory.see)}</div>`:''}${v.sensory?.firstHour?`<div class="faint" style="font-size:.84rem;margin-top:6px">${esc(v.sensory.firstHour)}</div>`:''}</div>
         <div class="row" style="margin-top:10px"><button class="btn sm ghost" data-flowquick="visualization">log what you saw</button></div>` : '<div class="empty">No vision to rehearse yet. Plant one on the Vision Tree.</div>'; }},
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
function flowEvening(){
  const T = today(); const c = checkin(T); const r = dayReview(T);
  guidedFlow('Evening review', [
    {title:'The rings, before the day closes.', hint:'Anything unfilled? Fill it, or let it stand as a miss — both are honest.',
     body: () => habitRingRow(T), bind: b => bindHabitRings(b)},
    {title:'What the day actually held.', hint:'Does this reflect the day you intended, or the day that happened to you?',
     body: () => { const items = tapeFilter(tapeItems(T, T));
       const tally = {}; items.forEach(x => { const s = tapeKind(x.kind)[0]; tally[s] = (tally[s]||0)+1; });
       return `<div class="rev-summary">${items.length ? `<b>${items.length}</b> things landed on today — ${Object.entries(tally).sort((a,b)=>b[1]-a[1]).map(([s,n])=>`${n} ${s.toLowerCase()}`).join(', ')}.` : 'Nothing logged today. That is also a reading.'}</div>
         <div class="row" style="margin-top:10px"><button class="btn sm ghost" data-flowgo="#/rhythm/tape">open the day in the Life Tape</button></div>`; }},
    {title:'Tonight, in four dimensions.', hint:'Where the energy actually ended up.',
     body: () => `<div class="energy-row">${DIMS.map(x => `<div class="energy-dim" style="--c:${x.c}"><div class="lbl"><span>${x.name}</span></div><div class="feeling">${[1,2,3,4,5].map(n=>`<button data-fwen="${x.id}:${n}" class="${(c.energy?.[x.id]||0)===n?'on':''}">${n}</button>`).join('')}</div></div>`).join('')}</div>`,
     bind: b => b.querySelectorAll('[data-fwen]').forEach(btn => btn.onclick = () => { const [id,n] = btn.dataset.fwen.split(':'); c.energy = c.energy || {}; c.energy[id] = +n; saveNow();
       b.querySelectorAll(`[data-fwen^="${id}:"]`).forEach(x => x.classList.toggle('on', x === btn)); })},
    {title:'And the set-point — where did it land?', hint:`This morning you were ${c.setpoint ? hicksName(c.setpoint).split(' / ')[0] : 'not on the scale yet'}.`,
     body: () => `<div class="energy-faces">${[1,2,3,4,5].map(n=>`<button class="ef ${r.energy===n?'on':''}" data-fwef="${n}" title="${['drained','low','level','good','full'][n-1]}">${n}</button>`).join('')}</div>`,
     bind: b => b.querySelectorAll('[data-fwef]').forEach(btn => btn.onclick = () => { r.energy = +btn.dataset.fwef; saveNow(); b.querySelectorAll('[data-fwef]').forEach(x => x.classList.toggle('on', x === btn)); })},
    {title:'One line.', hint:'One thing you learned, noticed, or are grateful for. It saves as a reflection.',
     body: () => `<textarea class="ta" id="fwLine" placeholder="Today I noticed…">${esc(r.note || '')}</textarea>`,
     next: b => { const v = b.querySelector('#fwLine').value.trim(); r.note = v; if(!c.sentence && v) c.sentence = v.split('\n')[0].slice(0,160);
       if(v) S.entries.push({id:uid(), type:'reflection', title:'', body:v, occurredAt:T, createdAt:new Date().toISOString(), media:[],
         links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[]}, people:[], places:[], emotions:[], tags:[], confidence:'', extra:{}});
       r.closedAt = new Date().toTimeString().slice(0,5); saveNow(); }},
    {title:"Tomorrow's intention.", hint:'Set it now, while today is still in the room.',
     body: () => { const p = dayPlan(addDays(T,1)); return `<input class="inp serif-lg" id="fwTom" value="${esc(p.intentions?.[0] || '')}" placeholder="Tomorrow I give my attention to…">`; },
     next: b => { const p = dayPlan(addDays(T,1)); p.intentions = p.intentions || ['','','']; p.intentions[0] = b.querySelector('#fwTom').value.trim(); saveNow(); }},
  ], () => { reviewDone('lastEvening'); toast('Day closed.'); });
}

/* ---------- 3. the weekly review ---------- */
function flowWeekly(){
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
    {title:'Current reality, on the tension that carries most.', hint:"Fritz's pivotal technique: describe where you actually are, describe where you want to be, choose the result, and let the structure pull.",
     body: () => { const v = S.visions.filter(x => !x.archived && x.confidence !== 'lived').map(x => ({x, t: typeof structuralTension === 'function' ? structuralTension(x) : 0})).sort((a,b)=>b.t-a.t)[0];
       if(!v) return '<div class="empty">No open visions yet.</div>';
       return `<div class="card"><b class="serif">${esc(v.x.name)}</b><div class="faint" style="font-size:.84rem;margin-top:4px">current reality, as last written</div><div class="quote">${esc(v.x.currentReality || 'not yet described')}</div>
         <textarea class="ta" id="fwCr" style="margin-top:8px" placeholder="And where it actually stands now…"></textarea></div>`;
       },
     next: b => { const ta = b.querySelector('#fwCr'); if(!ta || !ta.value.trim()) return;
       const v = S.visions.filter(x => !x.archived && x.confidence !== 'lived').map(x => ({x, t: typeof structuralTension === 'function' ? structuralTension(x) : 0})).sort((a,b)=>b.t-a.t)[0];
       if(!v) return; v.x.currentRealityHistory = v.x.currentRealityHistory || [];
       if(v.x.currentReality) v.x.currentRealityHistory.push({date:today(), text:v.x.currentReality});
       v.x.currentReality = ta.value.trim(); saveNow(); }},
    {title:'Water one vision.', hint:'Even a small leaf. A vision nobody touches is a wish.',
     body: () => { const v = S.visions.filter(x => !x.archived).map(x => ({x, n:(x.evidence||[]).length})).sort((a,b)=>a.n-b.n)[0];
       return v ? `<div class="row" style="gap:8px;flex-wrap:wrap"><span>Most neglected: <b>${esc(v.x.name)}</b></span><button class="btn sm ghost" data-flowgo="#/vision/${v.x.id}">open it</button></div>
         <input class="inp" id="fwLeaf" placeholder="one piece of evidence, however small" style="margin-top:8px">` : '<div class="empty">No visions yet.</div>'; },
     next: b => { const inp = b.querySelector('#fwLeaf'); if(!inp || !inp.value.trim()) return;
       const v = S.visions.filter(x => !x.archived).map(x => ({x, n:(x.evidence||[]).length})).sort((a,b)=>a.n-b.n)[0];
       if(v){ v.x.evidence = v.x.evidence || []; v.x.evidence.push({date:today(), text:inp.value.trim()}); saveNow(); } }},
    {title:'One synchronicity, gratitude, or reflection.',
     body: () => `<div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn sm ghost" data-flowquick="synchronicity">＋ synchronicity</button><button class="btn sm ghost" data-flowquick="gratitude">＋ gratitude</button><button class="btn sm ghost" data-flowquick="reflection">＋ reflection</button></div>`},
    {title:"Next week's one intention.",
     body: () => `<textarea class="ta" id="fwWk" placeholder="One sentence. It is the first thing you will see on Monday.">${esc(S.reviews.nextWeekFocus || '')}</textarea>`,
     next: b => { S.reviews.nextWeekFocus = b.querySelector('#fwWk').value.trim(); saveNow(); }},
  ], () => { reviewDone('lastWeekly'); toast('Week reviewed.'); });
}

/* ---------- 4. the seasonal review ---------- */
function flowSeasonal(){
  guidedFlow('Seasonal review', [
    {title:'Ninety days, at once.', hint:'Dry spells, surges, the weeks you cannot remember. Look before you interpret.',
     body: () => { const t = tapeState(); t.mode = 'total'; return tapeYearHTML(new Date().getFullYear()); }},
    {title:'Re-rank what matters.', hint:'The order changes. The previous ranking is kept.',
     body: () => `<div class="row"><button class="btn sm ghost" data-flowgo="#/values">open the compass</button></div>`},
    {title:'Update the confidence rungs.', hint:'hunch → exploring → plan → committed → in motion → lived',
     body: () => `<div class="stack" style="gap:4px">${S.visions.filter(v=>!v.archived).slice(0,8).map(v=>`<div class="row between"><span>${esc(v.name)}</span><span class="mono">${esc(v.confidence||'hunch')}</span></div>`).join('')||'<div class="empty">No visions yet.</div>'}</div>
       <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-flowgo="#/vision">open the tree</button></div>`},
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
     body: () => `<div class="row"><button class="btn sm ghost" data-flowgo="#/timeline">open the Timeline</button></div>`},
    {title:"Re-read last year's future memories.", hint:'Which came closer? Which drifted, and did you choose that?',
     body: () => { const vs = S.visions.filter(v => v.futureMemory).slice(0,3);
       return vs.length ? vs.map(v=>`<div class="card" style="margin-bottom:8px"><b class="serif">${esc(v.name)}</b><div class="quote" style="margin-top:4px">${esc(v.futureMemory.slice(0,220))}</div><div class="mono" style="margin-top:4px">${esc(v.confidence||'')}${v.currentReality?` · now: ${esc(v.currentReality.slice(0,80))}`:''}</div></div>`).join('') : '<div class="empty">No future memories written yet.</div>'; }},
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
    {title:'Three visions for the coming year.',
     body: () => `<div class="row"><button class="btn sm ghost" data-flowgo="#/vision">open the tree</button></div>`},
    {title:"A letter to next year's self.", hint:'Sealed until this date, next year.',
     body: () => `<div class="row"><button class="btn sm primary" id="fwLetter">seal a letter</button></div>`,
     bind: b => b.querySelector('#fwLetter').onclick = () => { if(typeof openLetterModal === 'function') openLetterModal(); }},
  ], () => { reviewDone('lastAnnual'); toast('The rite is complete.'); });
}

/* ---------- the hub ---------- */
const REVIEW_FLOWS = [
  ['lastMorning',  'Morning practice',  '30 minutes', 'Maltz, Hill and Hicks, in the order they work: script, visualise, aim, set-point, intention, mark.', flowMorning],
  ['lastEvening',  'Evening review',    '5 minutes',  'Close the day honestly: the rings, what actually happened, the energy it ended on, one line.', flowEvening],
  ['lastWeekly',   'Weekly review',     '15 minutes', "The week's shape, the habits, a congruence snapshot, current reality on the tension that carries most.", flowWeekly],
  ['lastSeasonal', 'Seasonal review',   '30 minutes', 'Ninety days at once: values re-ranked, confidence rungs, what is going quiet, the five closest, the money.', flowSeasonal],
  ['lastAnnual',   'Annual rite',       '1–2 hours',  'The whole year on one screen, then the narrative, the letter, and three visions for the next one.', flowAnnual],
];
function renderReviewsHub(box){
  const T = today();
  box.innerHTML = `<p class="muted" style="font-size:.88rem;max-width:640px">Five rituals at five cadences. Each one is pre-filled with what the instrument already knows, so the work is noticing rather than remembering.</p>
    <div class="review-cards">${REVIEW_FLOWS.map(([key, name, len, desc]) => { const age = reviewAge(key);
      const due = key === 'lastMorning' ? age >= 1 : key === 'lastEvening' ? age >= 1 : key === 'lastWeekly' ? age >= 7 : key === 'lastSeasonal' ? age >= 90 : age >= 365;
      return `<div class="review-card ${due?'due':''}" data-flow="${key}">
        <div class="row between"><b class="serif" style="font-size:1.1rem">${esc(name)}</b><span class="mono">${esc(len)}</span></div>
        <p class="muted" style="font-size:.85rem;margin:6px 0 10px">${esc(desc)}</p>
        <div class="row between"><span class="mono">${age === Infinity ? 'never done' : `last ${relDays(age)}`}</span><button class="btn sm ${due?'primary':'ghost'}" data-flowstart="${key}">${age === Infinity ? 'Begin' : due ? 'Begin — due' : 'Begin'}</button></div>
      </div>`; }).join('')}</div>
    <div class="hab-stats" style="margin-top:18px"><div class="sc">The twenty-one day tracker</div>
      <div class="row" style="gap:3px;flex-wrap:wrap;margin-top:8px">${Array.from({length:21}, (_,i) => { const d = addDays(S.rehearsal.cycleStart || T, i);
        const on = (S.rehearsal.days||[]).includes(d); return `<i class="tk-dot ${on?'on':''}" title="${esc(fmtDate(d,'med'))}"></i>`; }).join('')}</div>
      <div class="faint" style="font-size:.78rem;margin-top:6px">${(S.rehearsal.days||[]).length} mornings logged${S.rehearsal.cycleStart?` since ${fmtDate(S.rehearsal.cycleStart,'med')}`:''}.</div></div>`;
  box.querySelectorAll('[data-flowstart]').forEach(b => b.onclick = () => {
    const fn = (REVIEW_FLOWS.find(f => f[0] === b.dataset.flowstart) || [])[4]; if(fn) fn();
  });
  reveal(box);
}
