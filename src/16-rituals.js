/* ============================================================
   HABIT MECHANICS, GUIDED REVIEWS, PATTERNS
   The pages that used these live in Rhythm now; these are the
   pieces they are built from.
   ============================================================ */
const TOD = ['morning','afternoon','evening','anytime'];
function habitFreqLabel(h){ const f = h.freq; if(f.type==='daily') return 'daily'; if(f.type==='days') return f.days.map(d=>DOW[d].slice(0,3)).join(' '); if(f.type==='perWeek') return `${f.count}× / week`; if(f.type==='perMonth') return `${f.count}× / month`; return ''; }
function markHabit(h, level, note=''){ const T = today(); S.habitLog[T] = S.habitLog[T]||{}; if(level) S.habitLog[T][h.id] = {level, note}; else delete S.habitLog[T][h.id]; saveNow(); }
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
function renderReviews(body){
  const gaps = valueGaps(); const g0 = gaps[0]; const vs = S.visions.filter(v=>v.confidence!=='lived'); const st = vs.map(v=>({v,t:structuralTension(v)})).sort((a,b)=>b.t-a.t)[0];
  const cold = S.projects.filter(p=>p.status==='active').sort((a,b)=>daysSince(projectNods(b)[0]?.date)-daysSince(projectNods(a)[0]?.date))[0];
  const neglected = vs.map(v=>({v,...vividness(v)})).sort((a,b)=>a.score-b.score)[0];
  const revisit = S.entries.filter(e=>e.type==='synchronicity'&&e.extra?.revisit);
  const atro = S.skills.filter(s=>!s.planned && daysSince(skillLastPracticed(s))>90);
  const step = (t,d,act='') => `<div class="step"><div><div class="t">${t}</div><div class="d">${d}</div>${act?`<div class="act row">${act}</div>`:''}</div></div>`;
  body.innerHTML = `<div class="grid c2" style="align-items:start">
    <div class="card rv"><h3>Daily Morning Practice</h3><div class="mono">30 minutes · Maltz + Hill + Hicks · last: ${rehearsalDoneToday()?'today':rehearsalStreak()?'yesterday':'—'}</div><div class="flow">
      ${step('Sit quietly. Close your eyes.','Review your Self-Image Script in the Morning Rehearsal.','<button class="btn sm" data-go="#/today">open the Rehearsal</button>')}
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

/* ---------- Patterns: what the record says, with or without Claude ---------- */
function renderPatterns(body){
  const days = S._patDays || 90;
  const cached = S._patReport && S._patReport.days === days ? S._patReport : null;
  const p = gatherPatterns({days});
  const local = localPatternReport(p);
  body.innerHTML = `
    <div class="row between rv" style="margin:6px 0 16px;flex-wrap:wrap;gap:10px">
      <div class="row">${[30,90,180,365].map(d=>`<button class="btn sm ${days===d?'primary':'ghost'}" data-patd="${d}">${d===365?'a year':d+' days'}</button>`).join('')}</div>
      <div class="row">${aiReady()
        ? `<button class="btn primary" id="patAsk">${cached && cached.mode==='claude' ? 'Ask again' : 'Ask Claude to read it'}</button>`
        : `<a class="btn sm ghost" href="#/settings">connect Claude for a written reflection →</a>`}</div>
    </div>

    ${cached && cached.mode === 'claude' ? `<section class="reading-card rv" style="margin-bottom:22px">
        <div class="row between"><div class="sc">Claude, reading ${days === 365 ? 'the year' : `the last ${days} days`}</div><span class="mono">${esc(cached.at||'')}</span></div>
        <div class="reading-body prose">${md(cached.text)}</div>
        <div class="faint" style="font-size:.74rem;margin-top:12px">Written from the statistics below, which were computed in your browser. Your entries are sent to the Anthropic API only when you press the button.</div>
      </section>` : ''}

    <section class="reading-card rv" style="margin-bottom:22px">
      <div class="sc">What is simply true</div>
      <div class="reading-body">${local.map(l => `<p>${mdInline(l)}</p>`).join('')}</div>
      <div class="faint" style="font-size:.74rem;margin-top:12px">Computed here, from your own data. No key needed, nothing leaves the page.</div>
    </section>

    <div class="grid c2 section rv" style="align-items:start">
      <div class="card"><span class="sc">Values, reading by reading</span>
        ${p.valueTrends.length ? `<div class="stack" style="gap:10px;margin-top:12px">${p.valueTrends.map(v=>`<div class="row between"><span style="flex:1">${esc(v.name)}</span>${sparkline(v.series,{h:26,min:0,max:100,color:v.run<0?'#c25b5b':v.run>0?'var(--sage)':'var(--muted)'})}<span class="mono" style="min-width:5.5em;text-align:right">${v.latest ?? '—'}${v.run ? ` · ${v.run>0?'+':''}${v.run} in a row` : ''}</span></div>`).join('')}</div>` : '<div class="empty">Take a few congruence snapshots and the lines appear.</div>'}
      </div>
      <div class="card"><span class="sc">Where the words go</span>
        ${p.topWords.length ? `<div class="tag-cloud" style="margin-top:12px">${p.topWords.map(([w,n])=>`<span class="tag" style="--n:${Math.min(n,5)}">${esc(w)}<span class="n">${n}</span></span>`).join('')}</div>` : '<div class="empty">Write a few entries first.</div>'}
        ${p.tags.length ? `<div class="sc" style="margin-top:16px">Hashtags</div><div class="tag-cloud" style="margin-top:8px">${p.tags.map(([t,n])=>`<a class="tag" href="#/tag/${encodeURIComponent(t)}" style="--n:${Math.min(n,5)}">#${esc(t)}<span class="n">${n}</span></a>`).join('')}</div>` : ''}
      </div>
      <div class="card"><span class="sc">The week, by day</span>
        <div class="stack" style="gap:6px;margin-top:12px">${p.byWeekday.map(w=>`<div class="row between"><span class="mono" style="min-width:5.5em">${w.day.slice(0,3)}</span><span class="bar" style="flex:1;--c:var(--page-accent)"><i style="width:${w.avg||0}%"></i></span><span class="mono" style="min-width:4em;text-align:right">${w.avg===null?'—':w.avg}</span></div>`).join('')}</div>
        <div class="faint" style="font-size:.74rem;margin-top:8px">Average overall state on each weekday, across the window.</div>
      </div>
      <div class="card"><span class="sc">Going quiet</span>
        ${p.skillsCold.length || p.habitRates.some(h=>h.recent<40) ? `<div class="stack" style="gap:6px;margin-top:12px">
          ${p.skillsCold.map(s=>`<div class="row between"><span>${esc(s.name)}</span><span class="mono" style="color:#c9a05a">${s.days}d untouched</span></div>`).join('')}
          ${p.habitRates.filter(h=>h.recent<40).map(h=>`<div class="row between"><span>${esc(h.name)}</span><span class="mono">${h.recent}% this week</span></div>`).join('')}</div>`
        : '<div class="empty">Nothing is drifting. Unusual and worth noticing.</div>'}
      </div>
    </div>`;
  reveal(body);
  body.querySelectorAll('[data-patd]').forEach(b => b.onclick = () => { S._patDays = +b.dataset.patd; rerender(); });
  const ask = body.querySelector('#patAsk');
  if(ask) ask.onclick = async () => {
    ask.disabled = true; const was = ask.textContent; ask.textContent = 'reading…';
    try {
      const r = await generatePatternReport({days});
      if(r.mode === 'claude'){ S._patReport = {days, mode:'claude', text:r.text, at:`${fmtDate(today(),'med')}`}; sound('success'); rerender(); }
      else { toast('No key set — showing the local reading only.'); }
    } catch(e){ toast(e.message || 'Claude could not be reached.'); }
    finally { ask.disabled = false; ask.textContent = was; }
  };
}
/* the local report uses **bold**; render just that much inline */
function mdInline(s){ return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
