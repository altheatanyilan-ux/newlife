/* ============================================================
   1. TODAY — the entryway
   ============================================================ */
function checkin(day=today()){ if(!S.checkins[day]) S.checkins[day] = {mood:0, sentence:'', energy:{}, setpoint:0, intention:''}; return S.checkins[day]; }
routes.today = function(root){
  registerPageEntry({pageName:'Today', addLabel:'Add to today', defaultEntryType:'reflection', prefilledFields:{}, options:[
    {icon:'✎', label:'Quick note', desc:'One honest line, kept as a reflection.', run:()=>EntryActions.quickNote()},
    {icon:'◷', label:'Task reminder', desc:'A small thing to surface on a day.', run:()=>EntryActions.taskReminder()},
    {icon:'◎', label:'Daily intention', desc:'One thing to give attention to today.', run:()=>EntryActions.dailyIntention()}]});
  const T = today(); const c = checkin(T); const moon = moonPhase(); const yday = S.checkins[addDays(T,-1)];
  const otd = onThisDay(); const cycleDay = S.theatre.cycleStart ? daysBetween(S.theatre.cycleStart, T) : 0;
  const sig = signals();
  root.innerHTML = `<div class="page narrow">
    <header class="rv" style="margin-bottom:34px">
      <div class="today-date">${fmtDate(T)}</div>
      <div class="moon">${moonSVG(moon.p)} <span>${moon.name}</span><span class="mono" style="margin-left:6px">· day ${Math.round(moon.age)} of the cycle</span></div>
    </header>

    <details class="rv" ${c.mood && c.intention ? '' : 'open'}>
      <summary><span class="sc lg">Daily check-in</span>${c.mood?`<span class="mono">logged</span>`:''}</summary>
      <div class="body stack" style="gap:22px">
        <div class="field"><label>Mood</label><div class="moods">${[1,2,3,4,5].map(m=>`<div class="mood ${c.mood===m?'on':''}" data-mood="${m}" style="--fill:${(m-1)*22+8}%" title="${['heavy','low','level','light','luminous'][m-1]}"></div>`).join('')}<span class="mono" id="moodLbl">${c.mood?['heavy','low','level','light','luminous'][c.mood-1]:''}</span></div></div>
        <div class="field"><label>In one sentence, how is today?</label>${ed(`checkins.${T}.sentence`, {ph:'One honest sentence.', cls:'serif-lg'})}</div>
        <div class="field"><label>Energy pulse — four dimensions</label><div class="energy-row">${DIMS.map(d=>`<div class="energy-dim" style="--c:${d.c}"><div class="lbl"><span>${d.name}</span><span class="mono">${c.energy?.[d.id]||'–'}/5</span></div><div class="dots">${[1,2,3,4,5].map(n=>`<i class="${(c.energy?.[d.id]||0)>=n?'on':''}" data-dim="${d.id}" data-n="${n}"></i>`).join('')}</div></div>`).join('')}</div></div>
        <div class="field setpoint"><label>Emotional set-point (Hicks' guidance scale)</label>
          <input type="range" class="slider" min="1" max="22" value="${c.setpoint||14}" id="setpoint" style="--c:var(--rose)">
          <div class="lbls"><span>1 · Fear / Despair</span><span>11 · Disappointment</span><span>22 · Joy / Freedom / Love</span></div>
          <div class="cur"><span id="spName">${c.setpoint?hicksName(c.setpoint):'<span class="faint">place yourself on the scale</span>'}</span><span class="mono" id="spNum">${c.setpoint||''}</span></div>
        </div>
        <div class="field"><label>Intention — one thing I want to give attention to today</label>${ed(`checkins.${T}.intention`, {ph:'Just one.', cls:'serif-lg'})}</div>
        ${yday?.intention?`<div class="quote">Yesterday you said: “${esc(yday.intention)}”</div>`:''}
      </div>
    </details>

    <details class="rv theatre-wrap" ${theatreDoneToday()?'':'open'} style="margin-top:8px">
      <summary><span class="sc lg">The Morning Theatre</span><span class="mono">${theatreDoneToday()?'practised today':'30 minutes'}</span></summary>
      <div class="body theatre stack" style="gap:24px">
        <p class="quote">Close your eyes for 30 minutes. See yourself on a mental motion picture screen. Pay attention to small details — sights, sounds, smells. See yourself acting, feeling, and being as you want to be. Your nervous system cannot tell the difference between a real experience and one vividly imagined. — Maltz</p>
        <div class="field"><label>Today's Self-Image Script</label>${ed('theatre.script',{multi:true,mdr:true,cls:'prose serif-lg',ph:'First person, present tense. Who you are becoming — vivid, sensory, felt as already real.'})}</div>
        <div class="field"><label>The Winning Feeling</label><div class="faint" style="font-size:.8rem;margin-bottom:4px">Recall a moment when you felt self-confident and successful. Capture that feeling. Now weld it to your vision of the future.</div>${ed('theatre.winning',{multi:true,cls:'prose',ph:'Where were you? What did your body do?'})}</div>
        <div class="field"><label>Today's Auto-Suggestion — Definite Chief Aim (Hill)</label><div class="faint" style="font-size:.8rem;margin-bottom:4px">The exact thing desired, what you'll give in return, the date, the plan. Read aloud morning and night, with emotion.</div>${ed('theatre.aim',{multi:true,cls:'prose serif-lg',ph:'By [date] I will have [exactly this]. In return I will give [this].'})}</div>
        <div class="field"><label>21-day tracker <span class="mono" style="text-transform:none;letter-spacing:0">· day ${clamp(cycleDay+1,1,21)} of 21 · ${S.theatre.days.filter(d=>d>=S.theatre.cycleStart).length} practised</span></label>
          <div class="tracker">${Array.from({length:21},(_,i)=>{ const d = addDays(S.theatre.cycleStart||T, i); return `<i class="${S.theatre.days.includes(d)?'done':''} ${d===T?'today':''}" data-td="${d}" title="${fmtDate(d,'med')}"></i>`; }).join('')}</div>
          <div class="row" style="margin-top:12px"><button class="btn sm ${theatreDoneToday()?'':'primary'}" id="markTheatre">${theatreDoneToday()?'✓ Practised today':'Mark today\'s practice'}</button><button class="btn sm ghost" id="newCycle">Begin a new 21-day cycle</button></div>
        </div>
      </div>
    </details>

    <section class="section rv"><span class="sc">Signals</span>
      <div class="signals">${sig.map(s=>`<div class="signal" data-go="${s.go}"><div class="k">${s.k}</div><div class="v">${esc(s.v)}</div><div class="d">${esc(s.d)}</div></div>`).join('')}
        <div class="signal" data-go="#/rituals"><div class="k">Days since weekly review</div><div class="v">${daysSince(S.reviews.lastWeekly)}</div><div class="d">${daysSince(S.reviews.lastWeekly)>7?'a review is due':'on rhythm'}</div></div>
        <div class="signal" data-go="#/today"><div class="k">Morning Theatre streak</div><div class="v">${theatreStreak()} days</div><div class="d">of the current 21-day cycle</div></div>
      </div>
    </section>

    <section class="section rv"><span class="sc">On this day</span>
      ${otd.length ? otd.slice(0,3).map(e=>entryCard(e)).join('') : `<div class="empty">No memories from this day yet. You're making them now.</div>`}
    </section>

    <section class="section rv"><span class="sc">A gentle prompt</span>
      <div class="prompt-card"><div class="quote" id="promptText">${gentlePrompt()}</div><div class="row" style="margin-top:14px;justify-content:space-between"><button class="btn sm ghost" id="anotherPrompt">another</button><button class="btn sm" data-quick="reflection">respond ✎</button></div></div>
    </section>

    ${(S.reminders||[]).some(r=>!r.done && r.date<=T)?`<section class="section rv"><span class="sc">Reminders</span>${(S.reminders||[]).filter(r=>!r.done && r.date<=T).sort((a,b)=>a.date<b.date?-1:1).map(r=>`<div class="row" style="padding:8px 0;border-top:1px dashed var(--line)"><label style="cursor:pointer;display:flex"><input type="checkbox" data-rm="${r.id}" title="done"></label><span class="serif" style="font-size:1.05rem;flex:1">${ed(`reminders.#${r.id}.text`,{ph:'what needs doing'})}</span><span class="mono">${r.date<T?'since '+fmtDate(r.date,'short'):'today'}</span><input type="date" class="inp" value="${r.date}" data-rmdate="${r.id}" style="width:auto;padding:2px 6px;font-size:.7rem"><button class="del-x inline" data-rmdel="${r.id}" title="delete reminder">×</button></div>`).join('')}</section>`:''}

    <section class="section rv"><span class="sc">The last thirty days</span>
      <div class="charts3">
        <div class="card"><div class="mono" style="margin-bottom:8px">mood</div>${sparkline(lastDays(30).map(d=>S.checkins[d]?.mood||null),{h:50,min:1,max:5,color:'var(--gold)',dots:true,labels:lastDays(30).map(d=>`${fmtDate(d,'short')}: ${S.checkins[d]?.sentence||'—'}`)})}</div>
        <div class="card"><div class="mono" style="margin-bottom:8px">energy — four dimensions</div>${multiSpark(DIMS.map(d=>({vals:lastDays(30).map(x=>S.checkins[x]?.energy?.[d.id]||null),color:d.c})),{h:50})}<div class="legend" style="margin-top:8px">${DIMS.map(d=>`<span style="--c:${d.c}">${d.name}</span>`).join('')}</div></div>
        <div class="card"><div class="mono" style="margin-bottom:8px">emotional set-point</div>${sparkline(lastDays(30).map(d=>S.checkins[d]?.setpoint||null),{h:50,min:1,max:22,color:'var(--rose)',dots:true,labels:lastDays(30).map(d=>`${fmtDate(d,'short')}: ${S.checkins[d]?.setpoint?hicksName(S.checkins[d].setpoint):'—'}`)})}<div class="mono" style="margin-top:6px">avg ${avg(lastDays(30).map(d=>S.checkins[d]?.setpoint).filter(Boolean)).toFixed(1)} · ${hicksName(avg(lastDays(30).map(d=>S.checkins[d]?.setpoint).filter(Boolean))||14).split(' / ')[0]}</div></div>
      </div>
    </section>
  </div>`;

  root.querySelectorAll('.mood').forEach(m => m.onclick = () => { c.mood = +m.dataset.mood; c.ts = new Date().toISOString(); saveNow(); root.querySelectorAll('.mood').forEach(x=>x.classList.toggle('on', x===m)); $('#moodLbl').textContent = ['heavy','low','level','light','luminous'][c.mood-1]; sound('save'); });
  root.querySelectorAll('.dots i').forEach(i => i.onclick = () => { c.energy = c.energy||{}; c.energy[i.dataset.dim] = +i.dataset.n; saveNow(); const dim = i.closest('.energy-dim'); dim.querySelectorAll('i').forEach(x=>x.classList.toggle('on', +x.dataset.n <= +i.dataset.n)); dim.querySelector('.lbl .mono').textContent = i.dataset.n+'/5'; });
  const sp = $('#setpoint'); sp.oninput = () => { $('#spName').textContent = hicksName(+sp.value); $('#spNum').textContent = sp.value; }; sp.onchange = () => { c.setpoint = +sp.value; saveNow(); sound('save'); };
  $('#markTheatre').onclick = () => { if(!S.theatre.days.includes(T)){ S.theatre.days.push(T); if(!S.theatre.cycleStart) S.theatre.cycleStart = T; saveNow(); sound('chime'); toast('Practice marked. The nervous system takes care of the rest, in time.'); rerender(); } };
  $('#newCycle').onclick = () => confirmDlg('Start a fresh 21-day cycle from today? Past days stay in your history.', () => { S.theatre.cycleStart = T; saveNow(); rerender(); });
  root.querySelectorAll('.tracker i').forEach(i => i.onclick = () => { const d = i.dataset.td; if(d > T) return; const idx = S.theatre.days.indexOf(d); if(idx>=0) S.theatre.days.splice(idx,1); else S.theatre.days.push(d); saveNow(); rerender(); });
  $('#anotherPrompt').onclick = () => { S._promptShift = (S._promptShift||0)+1; $('#promptText').innerHTML = gentlePrompt(); };
  root.querySelectorAll('[data-quick]').forEach(b => b.onclick = () => { const t = b.dataset.quick; if(t==='nod') openNodModal(); else openEntryModal({type:t}); });
  root.querySelectorAll('[data-rmdate]').forEach(i => { i.onchange = () => { byId(S.reminders, i.dataset.rmdate).date = i.value; saveNow(); rerender(); }; });
  root.querySelectorAll('[data-rmdel]').forEach(b => b.onclick = e => { e.stopPropagation(); const r = byId(S.reminders, b.dataset.rmdel); requestDelete({label: r.text, node: b.closest('.row'), remove: () => spliceOut(S.reminders, x => x.id === r.id)}); });
  root.querySelectorAll('[data-rm]').forEach(c => c.onchange = () => { const r = byId(S.reminders, c.dataset.rm); if(r){ r.done = true; r.doneAt = today(); saveNow(); sound('success'); setTimeout(rerender, 300); } });
};
