/* ============================================================
   9. RITUALS, HABITS & ENERGY MANAGEMENT — the maintenance loop
   ============================================================ */
const TOD = ['morning','afternoon','evening','anytime'];
function habitFreqLabel(h){ const f = h.freq; if(f.type==='daily') return 'daily'; if(f.type==='days') return f.days.map(d=>DOW[d].slice(0,3)).join(' '); if(f.type==='perWeek') return `${f.count}× / week`; if(f.type==='perMonth') return `${f.count}× / month`; return ''; }
function markHabit(h, level, note=''){ const T = today(); S.habitLog[T] = S.habitLog[T]||{}; if(level) S.habitLog[T][h.id] = {level, note}; else delete S.habitLog[T][h.id]; saveNow(); }
routes.rituals = function(root, params){
  registerPageEntry({pageName:'Habits', addLabel:'New habit', defaultEntryType:'habit', prefilledFields:{}, options:[{label:'New habit', run:()=>EntryActions.newHabit()}]});
  const T = today();
  const active = S.habits.filter(h=>!h.archived && !h.negative).sort((a,b)=>TOD.indexOf(a.timeOfDay)-TOD.indexOf(b.timeOfDay) || a.order-b.order);
  const dueToday = active.filter(h=>habitDue(h,T)); const bal = energyBalance(false); const wk = energyBalance(true);
  root.innerHTML = `<div class="page">
    <div class="page-head"><h1>Habits</h1><div class="sub">Positive energy rituals, not willpower. Sprints and recovery across four dimensions. Missing a day is part of the path.</div></div>
    <div id="ritBody"></div></div>`;
  const body = $('#ritBody');
  body.innerHTML = `
    <div class="card rv"><div class="row between"><h3>Today</h3><span class="mono">${dueToday.filter(h=>habitDone(h,T)).length} of ${dueToday.length} rings full</span></div>
      <div class="rings-today">${dueToday.map(h => { const d = habitDone(h,T); const pct = d ? (d.level==='min'?.5:1) : 0; const dim = DIMS.find(x=>x.id===h.dimension); const st = habitStreak(h); return `<div class="ring-h" data-hring="${h.id}" title="click: ideal · shift-click: minimum">${h.stackAfter?'<span class="chainline"></span>':''}${ringSVG(pct,{color:dim.c,label:d?(d.level==='min'?'½':'✓'):''})}<div class="n">${esc(h.name)}</div><div class="s">${h.timeOfDay} · ${st.cur?st.cur+'d':''}</div></div>`; }).join('')}</div>
      <div class="row between" style="margin-top:14px;flex-wrap:wrap;gap:20px">
        <div><div class="mono" style="margin-bottom:6px">energy balance today · expenditure / recovery</div><div class="balance">${DIMS.map(d=>`<div style="--c:${d.c}"><b>${bal[d.id].exp}/${bal[d.id].rec}</b>${d.name}</div>`).join('')}</div></div>
        <div><div class="mono" style="margin-bottom:6px">oscillation this week</div><div class="stack" style="gap:4px;font-size:.8rem">${DIMS.map(d=>{ const x=wk[d.id]; const diff=x.exp-x.rec; return `<div style="color:${d.c}">${d.name}: <span style="color:var(--text)">${diff>1?'overtraining':diff<-1?'undertraining':'balanced'}</span> <span class="mono">${x.exp} exp · ${x.rec} rec</span></div>`; }).join('')}</div><div class="faint" style="font-size:.75rem;margin-top:6px;max-width:300px">“Most of us are undertrained physically and spiritually and overtrained mentally and emotionally.”</div></div>
        <div><div class="mono" style="margin-bottom:6px">negative habits · days since</div>${S.habits.filter(h=>h.negative&&!h.archived).map(h=>`<div class="row"><span class="since" data-tween="${daysSince(S.negLast?.[h.id])===Infinity?0:daysSince(S.negLast?.[h.id])}">0</span><span>${esc(h.name)}</span><button class="btn sm ghost" data-relapse="${h.id}">it happened</button></div>`).join('')||'<span class="faint">none</span>'}</div>
      </div></div>
    ${DIMS.map(d => { const hs = S.habits.filter(h=>h.dimension===d.id && !h.archived).sort((a,b)=>a.order-b.order); return `<details open class="rv" style="margin-top:18px;--c:${d.c}"><summary class="dim-head" style="border:none"><span class="sw"></span><h3>${d.name}</h3><span class="mono">${hs.length} habits</span></summary><div class="body" id="dim-${d.id}">
      ${hs.map(h => { const st = habitStreak(h); const rates = habitWeekRates(h); const days = lastDays(91); const counts = {}; return `<div class="habit" draggable="true" data-hid="${h.id}">
        <div>${h.negative?`<div class="since" style="font-size:1.1rem">${daysSince(S.negLast?.[h.id])===Infinity?'–':daysSince(S.negLast?.[h.id])}d</div>`:ringSVG(habitDone(h,T)?(habitDone(h,T).level==='min'?.5:1):0,{size:44,stroke:5,color:d.c})}</div>
        <div><div class="nm">${esc(h.name)} ${h.negative?'<span class="status-pill">avoid</span>':''} ${h.kind==='recovery'?'<span class="status-pill">recovery</span>':'<span class="status-pill">expenditure</span>'}</div><div class="sub">${habitFreqLabel(h)} · ${h.timeOfDay}${h.stackAfter?` · after “${esc(byId(S.habits,h.stackAfter)?.name||'')}”`:''}${h.min?` · min: ${esc(h.min)}`:''}${h.ideal?` · ideal: ${esc(h.ideal)}`:''}</div><div class="row" style="margin-top:4px;gap:4px">${(h.links.values||[]).map(id=>{const v=byId(S.values,id);return v?`<span class="chip" style="font-size:.62rem">${esc(v.name.split(' ')[0])}</span>`:''}).join('')}${(h.links.visions||[]).map(id=>{const v=byId(S.visions,id);return v?`<span class="chip" style="font-size:.62rem">🌿 ${esc(v.name)}</span>`:''}).join('')}${(h.links.skills||[]).map(id=>{const v=byId(S.skills,id);return v?`<span class="chip" style="font-size:.62rem">🛠 ${esc(v.name)}</span>`:''}).join('')}</div></div>
        <div>${h.negative?'':`<div class="cal90">${days.map(x=>{ const l = habitDone(h,x); return `<i class="${l?(l.level==='min'?'min':'full'):''} ${x>T?'future':''}" title="${x}${l?.note?' — '+esc(l.note):''}"></i>`; }).join('')}</div>`}</div>
        <div>${h.negative?'':`<div class="trend">${rates.map(r=>`<span title="${r.done}/${r.due}"><i style="--w:${clamp(r.done/r.due,0,1)*100}%;--c:${d.c}"></i></span>`).join('')}</div><div class="mono" style="margin-top:4px">${rates.map(r=>`${r.done}/${r.due}`).join(' · ')}</div><div class="mono">streak ${st.cur}d · best ${st.best}d</div>`}</div>
        <div class="row" style="gap:2px"><button class="tbtn" data-hedit="${h.id}">edit</button><button class="tbtn" data-harch="${h.id}">archive</button></div>
      </div>`; }).join('')||'<div class="empty">No habits in this dimension yet.</div>'}</div></details>`; }).join('')}
    ${S.habits.some(h=>h.archived)?`<details class="rv" style="margin-top:18px"><summary><span class="sc">Archived</span></summary><div class="body">${S.habits.filter(h=>h.archived).map(h=>`<div class="row between archived-row" style="padding:6px 0"><span class="muted">${esc(h.name)}</span><span class="row"><button class="btn sm ghost" data-hedit="${h.id}">edit</button><button class="btn sm ghost" data-hun="${h.id}">restore</button></span></div>`).join('')}</div></details>`:''}`;
  reveal(body); tweenAll(body);
  body.querySelectorAll('[data-hring]').forEach(r => r.onclick = e => { const h = byId(S.habits,r.dataset.hring); const cur = habitDone(h,T); const level = e.shiftKey ? (cur?.level==='min'?null:'min') : (cur?.level==='full'?null:'full'); if(level && h.prompt){ const m = openModal(`<h2>${esc(h.prompt)}</h2><input class="inp" id="hNote" placeholder="one line, optional"><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="hNoteSave">Done</button></div>`,'narrow'); const fin = () => { markHabit(h, level, m.querySelector('#hNote').value); m.remove(); sound('success'); r.classList.add('bloom'); setTimeout(rerender, 400); }; m.querySelector('#hNoteSave').onclick = fin; m.querySelector('#hNote').onkeydown = ev => { if(ev.key==='Enter') fin(); }; setTimeout(()=>m.querySelector('#hNote').focus(),50); } else { markHabit(h, level); if(level){ sound('success'); r.classList.add('bloom'); } setTimeout(rerender, level?400:0); } });
  body.querySelectorAll('[data-relapse]').forEach(b => b.onclick = () => { S.negLast = S.negLast||{}; S.negLast[b.dataset.relapse] = T; saveNow(); rerender(); toast('Reset, without punishment. The master stays on the mat.'); });
  body.querySelectorAll('[data-hedit]').forEach(b => b.onclick = () => openHabitModal(b.dataset.hedit));
  body.querySelectorAll('[data-harch]').forEach(b => b.onclick = () => { byId(S.habits,b.dataset.harch).archived = true; saveNow(); rerender(); });
  body.querySelectorAll('[data-hun]').forEach(b => b.onclick = () => { byId(S.habits,b.dataset.hun).archived = false; saveNow(); rerender(); });
  body.querySelectorAll('[data-hedit]').forEach(b => b.onclick = () => openHabitModal(b.dataset.hedit));
  let drag = null; body.querySelectorAll('.habit').forEach(hb => { hb.addEventListener('dragstart', ()=>{ drag = hb.dataset.hid; hb.classList.add('dragging'); }); hb.addEventListener('dragend', ()=>hb.classList.remove('dragging')); hb.addEventListener('dragover', e=>e.preventDefault()); hb.addEventListener('drop', e => { e.preventDefault(); if(!drag||drag===hb.dataset.hid) return; const a = byId(S.habits,drag), b = byId(S.habits,hb.dataset.hid); if(a.dimension!==b.dimension) return; const list = S.habits.filter(h=>h.dimension===a.dimension).sort((x,y)=>x.order-y.order).map(h=>h.id); list.splice(list.indexOf(a.id),1); list.splice(list.indexOf(b.id),0,a.id); list.forEach((id,i)=>byId(S.habits,id).order=i); saveNow(); rerender(); }); });
};
function openHabitModal(id){
  const h = id ? byId(S.habits,id) : {id:uid(),name:'',freq:{type:'daily',days:[],count:3},timeOfDay:'morning',dimension:'physical',kind:'expenditure',links:{values:[],visions:[],skills:[]},min:'',ideal:'',prompt:'',negative:false,archived:false,stackAfter:null,order:S.habits.length};
  const m = openModal(`<h2>${id?'Edit habit':'A new habit'}</h2><div class="stack">
    <div class="field"><label>Name</label><input class="inp" id="hName" value="${esc(h.name)}"></div>
    <div class="grid c2" style="gap:10px"><div class="field"><label>Frequency</label><select class="sel" id="hFreq"><option value="daily" ${h.freq.type==='daily'?'selected':''}>daily</option><option value="days" ${h.freq.type==='days'?'selected':''}>specific days</option><option value="perWeek" ${h.freq.type==='perWeek'?'selected':''}>× per week</option><option value="perMonth" ${h.freq.type==='perMonth'?'selected':''}>× per month</option></select></div><div class="field"><label>Time of day</label><select class="sel" id="hTod">${TOD.map(t=>`<option ${h.timeOfDay===t?'selected':''}>${t}</option>`).join('')}</select></div></div>
    <div class="row" id="hDays">${DOW.map((d,i)=>`<button class="btn sm ${h.freq.days.includes(i)?'primary':''}" data-day="${i}">${d.slice(0,3)}</button>`).join('')}</div>
    <div class="row" id="hCount"><span class="mono">how many times</span><input class="inp" type="number" min="1" max="31" id="hCountN" value="${h.freq.count||3}" style="width:80px"></div>
    <div class="grid c2" style="gap:10px"><div class="field"><label>Energy dimension</label><select class="sel" id="hDim">${DIMS.map(d=>`<option value="${d.id}" ${h.dimension===d.id?'selected':''}>${d.name}</option>`).join('')}</select></div><div class="field"><label>Kind</label><select class="sel" id="hKind"><option value="expenditure" ${h.kind==='expenditure'?'selected':''}>expenditure (stress / growth)</option><option value="recovery" ${h.kind==='recovery'?'selected':''}>recovery (renewal)</option></select></div></div>
    <div class="grid c2" style="gap:10px"><div class="field"><label>Minimum version</label><input class="inp" id="hMin" value="${esc(h.min)}" placeholder="1 pushup"></div><div class="field"><label>Ideal version</label><input class="inp" id="hIdeal" value="${esc(h.ideal)}" placeholder="30-minute workout"></div></div>
    <div class="field"><label>Stack after</label><select class="sel" id="hStack"><option value="">—</option>${S.habits.filter(x=>x.id!==h.id&&!x.archived).map(x=>`<option value="${x.id}" ${h.stackAfter===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>
    <div class="field"><label>Micro-journal prompt (optional)</label><input class="inp" id="hPrompt" value="${esc(h.prompt)}" placeholder="How was the run?"></div>
    <label class="toggle ${h.negative?'on':''}" id="hNeg"><span class="sw"></span><span>negative habit — track as “days since”</span></label>
    <div class="field"><label>Linked values</label><div class="deps">${S.values.map(v=>`<span class="chip click ${h.links.values.includes(v.id)?'on':''}" style="--c:${v.color}" data-lv="${v.id}">${esc(v.name.split(' ')[0])}</span>`).join('')}</div></div>
    <div class="field"><label>Linked visions</label><div class="deps">${S.visions.map(v=>`<span class="chip click ${h.links.visions.includes(v.id)?'on':''}" style="--c:var(--sage)" data-lvi="${v.id}">${esc(v.name)}</span>`).join('')}</div></div>
    <div class="field"><label>Linked skills</label><div class="deps">${S.skills.map(v=>`<span class="chip click ${h.links.skills.includes(v.id)?'on':''}" style="--c:var(--ment)" data-lsk="${v.id}">${esc(v.name)}</span>`).join('')}</div></div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="hSave">${id?'Save':'Add habit'}</button></div>
    ${id?moreSection(`<div class="danger-zone"><span>Archiving keeps the history. Deleting removes ${Object.values(S.habitLog).filter(l=>l[id]).length} logged days.</span><button class="btn sm ghost danger" id="hDelete">Delete this habit</button></div>`):''}</div>`);
  if(id) m.querySelector('#hDelete').onclick = () => { m.remove(); requestDelete({label: h.name, remove: () => { const logs = []; Object.entries(S.habitLog).forEach(([day, l]) => { if(l[h.id]){ logs.push([day, l[h.id]]); delete l[h.id]; } }); const neg = S.negLast?.[h.id]; if(S.negLast) delete S.negLast[h.id]; const stacked = S.habits.filter(x => x.stackAfter === h.id); stacked.forEach(x => x.stackAfter = null); const back = spliceOut(S.habits, x => x.id === h.id); return () => { back(); logs.forEach(([day, v]) => { S.habitLog[day] = S.habitLog[day] || {}; S.habitLog[day][h.id] = v; }); if(neg){ S.negLast = S.negLast || {}; S.negLast[h.id] = neg; } stacked.forEach(x => x.stackAfter = h.id); }; }}); };
  const upd = () => { const t = m.querySelector('#hFreq').value; m.querySelector('#hDays').style.display = t==='days'?'':'none'; m.querySelector('#hCount').style.display = (t==='perWeek'||t==='perMonth')?'':'none'; }; upd(); m.querySelector('#hFreq').onchange = upd;
  m.querySelectorAll('[data-day]').forEach(b => b.onclick = () => b.classList.toggle('primary'));
  m.querySelector('#hNeg').onclick = function(){ this.classList.toggle('on'); };
  m.querySelectorAll('[data-lv],[data-lvi],[data-lsk]').forEach(c => c.onclick = () => c.classList.toggle('on'));
  m.querySelector('#hSave').onclick = () => { h.name = m.querySelector('#hName').value.trim(); if(!h.name) return; h.freq = {type:m.querySelector('#hFreq').value, days:[...m.querySelectorAll('[data-day].primary')].map(b=>+b.dataset.day), count:+m.querySelector('#hCountN').value||1}; h.timeOfDay = m.querySelector('#hTod').value; h.dimension = m.querySelector('#hDim').value; h.kind = m.querySelector('#hKind').value; h.min = m.querySelector('#hMin').value; h.ideal = m.querySelector('#hIdeal').value; h.stackAfter = m.querySelector('#hStack').value||null; h.prompt = m.querySelector('#hPrompt').value; h.negative = m.querySelector('#hNeg').classList.contains('on'); h.links = {values:[...m.querySelectorAll('[data-lv].on')].map(c=>c.dataset.lv), visions:[...m.querySelectorAll('[data-lvi].on')].map(c=>c.dataset.lvi), skills:[...m.querySelectorAll('[data-lsk].on')].map(c=>c.dataset.lsk)}; if(!id) S.habits.push(h); saveNow(); m.remove(); rerender(); sound('save'); };
}
routes.reviews = function(root){
  registerPageEntry({pageName:'Reviews', addLabel:'Start a review', defaultEntryType:'reflection', prefilledFields:{}, options:[
    {icon:'◷', label:'Weekly review', desc:'Fifteen minutes, once a week.', run:()=>{ location.hash = '#/reviews'; setTimeout(()=>document.querySelector('#rWeekly')?.scrollIntoView({block:'center',behavior:'smooth'}),200); }},
    {icon:'✎', label:'Note from a review', desc:'Something the review turned up.', run:()=>EntryActions.quickNote()}]});
  root.innerHTML = `<div class="page">
    <div class="page-head"><h1>Reviews</h1><div class="sub">The rhythm above the daily one: a week, a season, a year. Each is a short set of questions and a date stamp, not a report.</div></div>
    <div id="revBody"></div></div>`;
  renderReviews($('#revBody'));
};
function renderReviews(body){
  const gaps = valueGaps(); const g0 = gaps[0]; const vs = S.visions.filter(v=>v.confidence!=='lived'); const st = vs.map(v=>({v,t:structuralTension(v)})).sort((a,b)=>b.t-a.t)[0];
  const cold = S.projects.filter(p=>p.status==='active').sort((a,b)=>daysSince(projectNods(b)[0]?.date)-daysSince(projectNods(a)[0]?.date))[0];
  const neglected = vs.map(v=>({v,...vividness(v)})).sort((a,b)=>a.score-b.score)[0];
  const revisit = S.entries.filter(e=>e.type==='synchronicity'&&e.extra?.revisit);
  const atro = S.skills.filter(s=>!s.planned && daysSince(skillLastPracticed(s))>90);
  const step = (t,d,act='') => `<div class="step"><div><div class="t">${t}</div><div class="d">${d}</div>${act?`<div class="act row">${act}</div>`:''}</div></div>`;
  body.innerHTML = `<div class="grid c2" style="align-items:start">
    <div class="card rv"><h3>Daily Morning Practice</h3><div class="mono">30 minutes · Maltz + Hill + Hicks · last: ${rehearsalDoneToday()?'today':rehearsalStreak()?'yesterday':'—'}</div><div class="flow">
      ${step('Sit quietly. Close your eyes.','Review your Self-Image Script in the Morning Rehearsal.','<button class="btn sm" data-go="#/today">open the Theatre</button>')}
      ${step('Visualize for 15–20 minutes.','See yourself acting, feeling, being as you want to be. Sensory details. “Your nervous system will take care of the rest in time — if you continue to practice.”','<button class="btn sm ghost" data-quick="visualization">log what you saw</button>')}
      ${step('Read your Definite Chief Aim aloud.','With emotion. Twice daily.',`<span class="quote" style="font-size:.9rem">${esc((S.rehearsal.aim||'').slice(0,160))}…</span>`)}
      ${step('Log your emotional set-point.','Where on the Hicks scale are you, honestly?','<button class="btn sm ghost" data-go="#/today">set-point slider</button>')}
      ${step("Set today's one intention.",'One thing to give attention to.')}
      ${step('Mark the 21-day tracker.','Consistency, quietly.','<button class="btn sm primary" id="rMark">mark practice done</button>')}
    </div></div>
    <div class="card rv"><h3>Weekly Review</h3><div class="mono">15 minutes · last ${relDays(daysSince(S.reviews.lastWeekly))}</div><div class="flow">
      ${step('Log a values congruence snapshot.','Sliders pre-filled with last week\'s values.','<button class="btn sm" id="rSnap">log snapshot</button>')}
      ${step('Review your four-dimensional energy balance.','Which dimension did you overtrain? Which did you undertrain?','<button class="btn sm ghost" data-go="#/rituals">oscillation check</button>')}
      ${step('Add at least one nod to an active project.',cold?`Coldest: <b>${esc(cold.name)}</b>, last nod ${relDays(daysSince(projectNods(cold)[0]?.date))}.`:'','<button class="btn sm ghost" data-nod="1">+ nod</button>')}
      ${step('Water one vision.',neglected?`Most neglected: <b>${esc(neglected.v.name)}</b> (vividness ${neglected.score}). Even a small leaf.`:'',neglected?`<button class="btn sm ghost" data-leaf="${neglected.v.id}">+ leaf</button>`:'')}
      ${step('Update current reality on your top structural tension.',st?`<b>${esc(st.v.name)}</b> carries the most energy. Describe where you are; describe where you want to be; formally choose the result; move on.`:'',st?`<button class="btn sm ghost" data-go="#/vision/${st.v.id}">open vision</button>`:'')}
      ${step('Note one synchronicity, gratitude, or reflection.','','<button class="btn sm ghost" data-quick="synchronicity">+ synchronicity</button><button class="btn sm ghost" data-quick="gratitude">+ gratitude</button>')}
      ${step("Set next week's one intention.",'','<button class="btn sm ghost" data-go="#/today">intention</button>')}
      ${step('Review.',g0?`Your biggest values gap this week was <b>${esc(g0.name)}</b> (${g0.gap>0?'+':''}${g0.gap}). One thing you could do about it: <span class="ed" data-path="reviews.weeklyNote" data-multi="0" data-md="0" data-ph="___" data-hook="">${esc(S.reviews.weeklyNote||'')||'<span class="ph">___</span>'}</span>`:'','<button class="btn sm primary" id="rWeekly">mark weekly review done</button>')}
    </div></div>
    <div class="card rv"><h3>Seasonal / Quarterly Review</h3><div class="mono">30 minutes · last ${relDays(daysSince(S.reviews.lastSeasonal))}</div><div class="flow">
      ${step('Re-rank value priorities.','Drag to reorder. The previous ranking is kept.','<button class="btn sm ghost" data-go="#/values">values</button>')}
      ${step('Update vision confidence rungs.','hunch → exploring → plan → committed → in motion → lived','<button class="btn sm ghost" data-go="#/vision">vision tree</button>')}
      ${step('Re-read one past stage narrative.','Does it still feel true? If not, rewrite it — the old version is kept.',S.stages.length ? `<button class="btn sm ghost" data-go="#/stage/${S.stages[Math.floor(Math.random()*S.stages.length)].id}">a random stage</button>` : '')}
      ${step('Revisit flagged synchronicities.',revisit.length?`${revisit.length} flagged: ${revisit.map(e=>'<em>'+esc(e.title)+'</em>').join(', ')}. Do any make more sense now?`:'None flagged.','<button class="btn sm ghost" data-go="#/journals/synchronicity">synchronicities</button>')}
      ${step('Review skill atrophy.',atro.length?`Atrophying: ${atro.map(s=>'<b>'+esc(s.name)+'</b>').join(', ')}. Worth reviving, or worth surrendering?`:'Nothing atrophying.','<button class="btn sm ghost" data-go="#/skills">skill tree</button>')}
      ${step('Review the project energy chart.','Any projects to pause or promote?','<button class="btn sm ghost" data-go="#/projects">energy vs. output</button>')}
      ${step('Update tension sliders.','','<button class="btn sm ghost" data-go="#/timeline/threads">tensions</button><button class="btn sm primary" id="rSeasonal">mark seasonal review done</button>')}
    </div></div>
    <div class="card rv"><h3>Annual Rite</h3><div class="mono">1–2 hours · last ${relDays(daysSince(S.reviews.lastAnnual))}</div><div class="flow">
      ${step("Write the year's narrative.",'A reflection tagged to the relevant stage.','<button class="btn sm ghost" data-quick="reflection">+ reflection</button>')}
      ${step('Mint the year into the Timeline.','Create or update sub-stage entries.','<button class="btn sm ghost" data-go="#/stage/s7">current stage</button>')}
      ${step("Re-read last year's Future Memories.",'Which visions came closer? Which drifted? Compare with current-reality assessments.','<button class="btn sm ghost" data-go="#/vision">vision tree</button>')}
      ${step('Watch the Values radar from January to December.','What shifted?','<button class="btn sm ghost" data-go="#/values">time slider</button>')}
      ${step("Review the year's emotional set-point trend.",'Did you climb the scale? Where are you stuck?','<button class="btn sm ghost" data-go="#/today">set-point history</button>')}
      ${step('Review your self-image script.','Who did you become this year? How is that different from who you were at the start?','<button class="btn sm ghost" data-go="#/today">Morning Rehearsal</button>')}
      ${step('Set three visions for the coming year.','','<button class="btn sm ghost" data-go="#/vision">+ vision</button>')}
      ${step("Write a letter to next year's self.",'Dated one year forward.','<button class="btn sm ghost" data-letter="1">+ letter</button><button class="btn sm primary" id="rAnnual">mark annual rite done</button>')}
    </div></div></div>`;
  reveal(body);
  $('#rMark').onclick = () => { if(!S.rehearsal.days.includes(today())){ S.rehearsal.days.push(today()); S.rehearsal.cycleStart = S.rehearsal.cycleStart||today(); saveNow(); sound('chime'); } toast('Marked.'); rerender(); };
  $('#rSnap').onclick = () => openSnapshotModal(()=>rerender());
  $('#rWeekly').onclick = () => { S.reviews.lastWeekly = today(); saveNow(); toast('Weekly review done. See you next week.'); rerender(); };
  $('#rSeasonal').onclick = () => { S.reviews.lastSeasonal = today(); saveNow(); toast('Seasonal review done.'); rerender(); };
  $('#rAnnual').onclick = () => { S.reviews.lastAnnual = today(); saveNow(); toast('The annual rite is complete.'); rerender(); };
  body.querySelectorAll('[data-quick]').forEach(b => b.onclick = () => openEntryModal({type:b.dataset.quick}));
  body.querySelectorAll('[data-nod]').forEach(b => b.onclick = () => openNodModal());
  body.querySelectorAll('[data-leaf]').forEach(b => b.onclick = () => openEntryModal({type:'progress', links:{visions:[b.dataset.leaf]}}));
  body.querySelectorAll('[data-letter]').forEach(b => b.onclick = () => openEntryModal({type:'letter', title:'To myself, one year from now', occurredAt:addDays(today(),365)}));
}
