/* ============================================================
   HABITS — checking in, the detail panel, and the wiring
   ============================================================ */

/* ---------- the check-in ----------
   Two different questions, because the two kinds of habit are two different
   things. A building habit asks how it went and what it left you with. A
   breaking one asks a three-way question — clean, resisted, slipped — because
   an urge that came and did not win is the most informative day of the three
   and has nowhere else to be recorded. */
function openHabitCheckIn(id, day = today()){
  const h = habDefaults(byId(S.habits, id)); if(!h) return;
  const br = habIsBreaking(h);
  const cur = habEntry(h, day) || {};
  let status = cur.status || (br ? 'clean' : 'completed');
  const opts = br ? [['clean','○  Clean day — no urges'], ['resisted','🛡  Resisted an urge'], ['slipped','↯  Slipped']]
    : [['completed','✓  Completed'], ['partial','◐  Partial'], ['skipped','·  Skipped']];

  const body = () => `
    <div class="hb-ci-status">${opts.map(([k, n]) =>
      `<button type="button" class="hb-cis${status === k ? ' on' : ''}" data-cis="${k}">${esc(n)}</button>`).join('')}</div>
    ${!br ? `
      <div class="grid c2" style="gap:10px">
        <div class="field"><label>How long</label><div class="row" style="gap:6px;align-items:baseline">
          <input class="inp mono" id="ciDur" type="number" min="0" max="600" style="width:88px"
            value="${cur.minutes || h.durationTarget || ''}"><span class="mono faint">min</span></div></div>
      </div>
      <div class="field"><label>Mood after</label><div class="feeling" id="ciMood">${[1,2,3,4,5].map(n =>
        `<button type="button" data-cim="${n}" class="${(cur.mood || 0) === n ? 'on' : ''}">${n}</button>`).join('')}</div></div>
      <div class="field"><label>Energy after</label><div class="feeling" id="ciEn">${[1,2,3,4,5].map(n =>
        `<button type="button" data-cie="${n}" class="${(cur.energy || 0) === n ? 'on' : ''}">${n}</button>`).join('')}</div></div>`
    : `
      <div id="ciResist" ${status === 'resisted' ? '' : 'hidden'}>
        <div class="field"><label>How strong was it</label><div class="feeling" id="ciInt">${[1,2,3,4,5].map(n =>
          `<button type="button" data-cii="${n}" class="${(cur.intensity || 0) === n ? 'on' : ''}">${n}</button>`).join('')}</div></div>
        ${h.triggers.length ? `<div class="field"><label>What set it off</label>
          <select class="sel" id="ciTrig"><option value="">not one of the mapped ones</option>
          ${h.triggers.map(t => `<option value="${t.id}" ${cur.triggerId === t.id ? 'selected' : ''}>${esc(t.description || 'a trigger')}</option>`).join('')}</select></div>` : ''}
      </div>
      <div id="ciSlip" ${status === 'slipped' ? '' : 'hidden'}>
        <div class="hb-gentle">${esc(HAB_QUOTES.slip[1])} <cite>${esc(HAB_QUOTES.slip[0])}</cite></div>
      </div>`}
    <div class="field"><label>${br ? 'What happened, and what you did' : 'Anything worth saying'}${h.prompt ? ` — ${esc(h.prompt)}` : ''}</label>
      <textarea class="ta" id="ciNote" style="min-height:64px" placeholder="${br ? 'Felt the pull after a stressful hour. Put the phone in the drawer.' : 'optional'}">${esc(cur.note || '')}</textarea></div>`;

  const m = openModal(`<h2>${esc(h.icon || (br ? '🛡' : '✓'))} ${esc(h.name)}</h2>
    <p class="muted" style="font-size:.86rem">${esc(fmtDate(day, 'full') || fmtDate(day, 'med'))}</p>
    <div class="stack" id="ciBody">${body()}</div>
    <div class="row between" style="margin-top:16px">
      ${habEntry(h, day) ? '<button class="btn sm ghost" id="ciClear">clear this day</button>' : '<span></span>'}
      <button class="btn primary" id="ciSave">Save check-in</button></div>`, 'narrow');

  const bind = () => {
    m.querySelectorAll('[data-cis]').forEach(b => b.onclick = () => {
      status = b.dataset.cis;
      m.querySelectorAll('[data-cis]').forEach(x => x.classList.toggle('on', x === b));
      const r = m.querySelector('#ciResist'), s = m.querySelector('#ciSlip');
      if(r) r.hidden = status !== 'resisted';
      if(s) s.hidden = status !== 'slipped';
    });
    ['cim','cie','cii'].forEach(k => m.querySelectorAll(`[data-${k}]`).forEach(b => b.onclick = () =>
      b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b))));
  };
  bind();

  if(m.querySelector('#ciClear')) m.querySelector('#ciClear').onclick = () => {
    habClearEntry(h, day); m.remove(); sound('click'); rerenderPlanBody(); };

  m.querySelector('#ciSave').onclick = () => {
    const pick = k => +m.querySelector(`[data-${k}].on`)?.dataset[k] || 0;
    const before = habStreak(h).cur;
    const patch = {status, note: m.querySelector('#ciNote').value.trim()};
    if(!br){ patch.minutes = +m.querySelector('#ciDur')?.value || 0;
      patch.mood = pick('cim'); patch.energy = pick('cie'); }
    else { patch.intensity = pick('cii'); patch.triggerId = m.querySelector('#ciTrig')?.value || '';
      if(status !== 'clean') h.urgeLog.unshift({id:uid(), date:day, intensity:patch.intensity,
        outcome: status === 'slipped' ? 'slipped' : 'resisted', strategy:'', note:patch.note}); }
    habSetEntry(h, day, patch);
    m.remove();
    /* a slip is not punished: the counter resets quietly and the house says
       something kind rather than nothing */
    if(br && status === 'slipped'){ sound('click'); toast('Begin again. The spiral always begins again.'); }
    else {
      sound('success');
      const after = habStreak(h).cur;
      const hit = h.milestones.find(x => x.days > before && x.days <= after);
      if(hit) habCelebrate(h, hit); 
    }
    rerenderPlanBody();
  };
}
/* seven, twenty-one, thirty, sixty, ninety, a year — each one named for the
   reason it is a threshold at all */
function habCelebrate(h, m){
  const q = m.days === 21 ? HAB_QUOTES.m21 : m.days === 60 ? HAB_QUOTES.m60 : null;
  toast(`${m.label} — ${m.days} days of ${h.name}.${q ? ` ${q[1]}` : ''}`, 6000);
  sound('success');
}

/* ---------- the detail panel ---------- */
function openHabitPanel(id){
  const h = habDefaults(byId(S.habits, id)); if(!h) return;
  const p = openPanel(habPanelHTML(h), 'plan-detail habit-detail');
  bindHabitPanel(p, h);
  return p;
}
function habRedraw(h){ const p = openPanel(habPanelHTML(h), 'plan-detail habit-detail'); bindHabitPanel(p, h); rerenderPlanBody(); }

function habPanelHTML(h){
  const br = habIsBreaking(h), st = habStreak(h), t = habTrend(h);
  const c = h.color || (br ? 'var(--terra)' : 'var(--sage)');
  const path = `habits.#${h.id}`;
  const sec = (title, inner, open = false) => `<details class="pd-sec hb-psec"${open ? ' open' : ''}>
    <summary><span class="k mono">${esc(title)}</span></summary><div class="hb-pbody">${inner}</div></details>`;
  const log = lastDays(120).map(d => ({d, e: habEntry(h, d)})).filter(x => x.e);
  return `<div class="pd hb-panel" style="--c:${esc(c)}">
    <div class="hb-phead">
      <span class="hb-pface">${esc(h.icon || (br ? '🔓' : '🌱'))}</span>
      <div style="min-width:0;flex:1">
        <input class="inp pd-title" id="hpName" value="${esc(h.name)}">
        <div class="mono hb-psub">${br ? '🔓 breaking' : '🌱 building'} · ${esc(h.category)} ·
          ${esc(DIMS.find(d => d.id === h.dimension)?.name || '')} · ${h.kind === 'recovery' ? 'recovery' : 'expenditure'}</div>
      </div>
      <div class="hb-pstreak">${br ? '🛡' : '🔥'} ${st.cur}</div>
    </div>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin:10px 0">
      <button class="btn sm primary" id="hpCheck">Check in</button>
      <button class="btn sm ghost" id="hpEdit">Edit fields</button>
      <button class="btn sm ghost" id="hpArchive">${h.archived ? 'Restore' : 'Archive'}</button>
      <button class="btn sm ghost danger" id="hpDel">Delete</button>
    </div>

    ${sec('why', `
      <div class="hb-ident big">${ed(`${path}.identity`, {ph:'I am someone who…'})}</div>
      <div class="hb-coach">${esc(HAB_QUOTES.identity[1])} <cite>${esc(HAB_QUOTES.identity[0])}</cite></div>
      <div class="field"><label>Why this matters</label>${ed(`${path}.why`, {multi:true, ph:'the reason underneath the reason'})}</div>
      <div class="field"><label>What it looks like fully lived</label>${ed(`${path}.vision`, {multi:true, ph:'see the room, the hour, the light'})}</div>
      <div class="field"><label>What is lost by not doing it</label>${ed(`${path}.inaction`, {multi:true, ph:'plainly'})}</div>
      <div class="field"><label>Seeing yourself do it</label>${ed(`${path}.rehearsal`, {multi:true, ph:'You are on the mat. The room is quiet. Your breath slows.'})}
        <div class="hb-coach sm">Your nervous system cannot tell the difference between a vividly imagined experience and a real one. <cite>Maltz</cite></div></div>`, true)}

    ${sec('when, and what sets it off', `
      <div class="grid c2" style="gap:10px">
        <div><div class="k mono">how often</div><div class="hb-freq">${esc(habitFreqLabel(h))}</div></div>
        <div><div class="k mono">time of day</div><div>${esc(h.timeOfDay || 'anytime')}${h.specificTime ? ` · ${esc(h.specificTime)}` : ''}</div></div>
      </div>
      <div class="field"><label>The cue</label>${ed(`${path}.cue`, {ph:'After I pour the coffee…'})}</div>
      <div class="field"><label>The set-up</label>${ed(`${path}.environment`, {ph:'At the desk, phone in another room, timer set'})}</div>
      ${!br ? `<div class="grid c2" style="gap:10px">
        <div class="field"><label>Before</label>${ed(`${path}.preRitual`, {ph:'light the candle, close the door'})}</div>
        <div class="field"><label>After</label>${ed(`${path}.postRitual`, {ph:'one sentence about what came'})}</div></div>
        ${h.stackAfter && byId(S.habits, h.stackAfter) ? `<div class="hb-stack mono">→ ${esc(byId(S.habits, h.stackAfter).name)} → <b>${esc(h.name)}</b> →</div>` : ''}` : ''}`)}

    ${sec('how it is going', `
      <div class="hb-mini big">${lastDays(90).map(d => { const s = habStatus(h, d);
        const cls = br ? (s === 'slipped' ? 'slip' : s === 'resisted' ? 'resist' : s === 'clean' ? 'on' : '')
          : (s === 'completed' ? 'on' : s === 'partial' ? 'half' : habDue(h, d) ? '' : 'off');
        return `<i class="${cls}" title="${esc(fmtDate(d, 'short'))}"></i>`; }).join('')}</div>
      <div class="hb-facts mono"><span>now ${st.cur}</span><span>best ${st.best}</span>
        <span>${habRate(h, 7) ?? '—'}% · 7d</span><span>${habRate(h, 30) ?? '—'}% · 30d</span><span>${habRate(h, 90) ?? '—'}% · 90d</span>
        <span class="hb-htrend ${t.dir}">${t.dir === 'up' ? 'improving ↑' : t.dir === 'down' ? 'slipping ↓' : 'steady →'}</span></div>
      <div class="hb-msrow">${h.milestones.map(m => `<span class="hb-ms${m.reached ? ' on' : ''}" title="${m.reached ? 'reached ' + esc(fmtDate((m.reachedAt||'').slice(0,10),'med')) : `${Math.max(0, m.days - st.cur)} days away`}">${m.days}</span>`).join('')}</div>
      ${!br && h.progression.length ? `<div class="k mono" style="margin-top:10px">the plan</div>
        <div class="hb-prog">${h.progression.map((x, i) => `<div class="hb-progrow">
          <span class="mono">week ${x.week}</span>${ed(`${path}.progression.${i}.target`, {ph:'what it is by then'})}
          <button class="del-x inline" data-hpprogdel="${i}">×</button></div>`).join('')}</div>` : ''}
      ${!br ? `<button class="tbtn" id="hpProgAdd">+ a week to the plan</button>` : ''}`, true)}

    ${br ? sec('instead of it', `
      <div class="field"><label>What I do instead</label>${ed(`${path}.replacement`, {multi:true, ph:'pick up the book on the desk'})}</div>
      <div class="hb-coach">${esc(HAB_QUOTES.replace[1])} <cite>${esc(HAB_QUOTES.replace[0])}</cite></div>
      <div class="field"><label>I am no longer someone who…</label>${ed(`${path}.reframe`, {multi:true, ph:'…numbs with a feed. I am someone who sits with the quiet.'})}</div>
      <div class="field"><label>What it costs me</label>${ed(`${path}.harm`, {multi:true, ph:'hours, attention, sleep, self-respect — plainly'})}</div>
      <div class="field hb-protocol"><label>When the urge hits</label>${ed(`${path}.protocol`, {multi:true, ph:'1) Name it aloud. 2) Five breaths. 3) Phone in the drawer. 4) Open the book.'})}</div>`, true)
      + sec('what sets it off', `
      <div class="hb-trigs">${h.triggers.map((tr, i) => `<div class="hb-trig">
        <div class="row" style="gap:8px;align-items:center">
          <select class="sel sm" data-hptrigtype="${tr.id}">${HAB_TRIGGER_KINDS.map(k =>
            `<option value="${k}" ${tr.type === k ? 'selected' : ''}>${k}</option>`).join('')}</select>
          <span class="hb-tint" title="how strongly it pulls">${[1,2,3,4,5].map(n =>
            `<button class="${tr.intensity >= n ? 'on' : ''}" data-hptrigint="${tr.id}:${n}"></button>`).join('')}</span>
          <button class="del-x inline" data-hptrigdel="${tr.id}">×</button></div>
        ${ed(`${path}.triggers.${i}.description`, {ph:'when I feel… / after… / whenever…'})}
        <div class="hb-tstrat">${ed(`${path}.triggers.${i}.strategy`, {ph:'and what I do about it'})}</div>
      </div>`).join('') || '<div class="pk-empty">Nothing mapped yet. Naming the trigger is most of the work.</div>'}</div>
      <button class="tbtn" id="hpTrigAdd">+ trigger</button>`)
      + sec('the urges that did not win', `
      ${h.urgeLog.length ? `<div class="hb-urges">${h.urgeLog.slice(0, 30).map(u => `<div class="hb-urge ${esc(u.outcome)}">
        <span class="mono">${esc(fmtDate(u.date, 'short'))}</span>
        <span class="hb-uout">${u.outcome === 'slipped' ? '↯ slipped' : '🛡 resisted'}${u.intensity ? ` · ${u.intensity}/5` : ''}</span>
        <span class="hb-unote">${esc(u.note || '')}</span></div>`).join('')}</div>`
        : '<div class="pk-empty">Nothing logged. Every resisted urge belongs here — it is the evidence the new self-image is forming.</div>'}`)
    : sec('the two sizes of it', `
      <div class="field"><label>On the worst day</label>${ed(`${path}.min`, {ph:'sit on the mat for two minutes'})}
        <div class="faint" style="font-size:.76rem">Small enough that missing it would be a decision, not an accident.</div></div>
      <div class="field"><label>On a good one</label>${ed(`${path}.ideal`, {ph:'thirty minutes'})}</div>
      <div class="grid c2" style="gap:10px">
        <div class="field"><label>Best ever</label><div class="row" style="gap:6px">${ed(`${path}.personalBest.value`, {cls:'mono', ph:'—'})}
          ${ed(`${path}.personalBest.unit`, {cls:'mono', ph:'minutes'})}</div></div>
        <div class="field"><label>Target each time</label><div class="row" style="gap:6px;align-items:baseline">${ed(`${path}.durationTarget`, {cls:'mono', ph:'0'})}<span class="mono faint">min</span></div></div>
      </div>`)}

    ${sec('what keeps it going', `
      <div class="field"><label>What follows it</label>${ed(`${path}.reward`, {ph:'fifteen minutes of reading'})}</div>
      <div class="grid c2" style="gap:10px">
        <div class="field"><label>Who knows</label><select class="sel" id="hpAcc">${['self','partner','public'].map(k =>
          `<option value="${k}" ${h.accountability === k ? 'selected' : ''}>${k === 'self' ? 'just me' : k === 'partner' ? 'one other person' : 'out loud'}</option>`).join('')}</select></div>
        <div class="field"><label>How hard it is</label><div class="feeling">${[1,2,3,4,5].map(n =>
          `<button data-hpdiff="${n}" class="${h.difficulty === n ? 'on' : ''}">${n}</button>`).join('')}</div></div>
      </div>`)}

    ${sec('what it is for', `
      <div class="field"><label>Values</label><div class="deps">${S.values.map(v =>
        `<span class="chip click${(h.links.values || []).includes(v.id) ? ' on' : ''}" style="--c:${v.color}" data-hplk="values:${v.id}">${esc(v.name)}</span>`).join('')}</div></div>
      ${!br ? `<div class="field"><label>Skills</label><div class="deps">${S.skills.map(v =>
        `<span class="chip click${(h.links.skills || []).includes(v.id) ? ' on' : ''}" style="--c:var(--ment)" data-hplk="skills:${v.id}">${esc(v.name)}</span>`).join('')}</div></div>` : ''}
      <div class="field"><label>Projects</label><div class="deps">${S.projects.map(v =>
        `<span class="chip click${(h.links.projects || []).includes(v.id) ? ' on' : ''}" style="--c:var(--terra)" data-hplk="projects:${v.id}">${esc(v.name)}</span>`).join('')}</div></div>`)}

    ${sec('every check-in', log.length ? `<div class="hb-log">${log.map(({d, e}) => {
        const s = e.status || (e.level === 'min' ? 'partial' : 'completed');
        const [ic, name] = HAB_SESSION_STATUS[s] || ['·', s];
        return `<div class="hb-lrow ${esc(s)}"><span class="mono">${esc(fmtDate(d, 'short'))}</span>
          <span class="hb-lstat">${ic} ${esc(name)}</span>
          <span class="mono faint">${e.minutes ? e.minutes + 'm' : ''}${e.mood ? ` · mood ${e.mood}` : ''}${e.energy ? ` · energy ${e.energy}` : ''}</span>
          ${e.note ? `<span class="hb-lnote">${esc(e.note)}</span>` : ''}</div>`; }).join('')}</div>`
      : '<div class="pk-empty">Nothing logged yet.</div>')}
  </div>`;
}

function bindHabitPanel(p, h){
  const path = `habits.#${h.id}`;
  p.querySelector('#hpName').oninput = debounce(function(){ h.name = this.value; saveNow(); rerenderPlanBody(); }, 350);
  p.querySelector('#hpCheck').onclick = () => openHabitCheckIn(h.id);
  p.querySelector('#hpEdit').onclick = () => openHabitModal(h.id);
  p.querySelector('#hpArchive').onclick = () => { h.archived = !h.archived; saveNow(); sound('click');
    toast(h.archived ? 'Archived. The history is kept.' : 'Back among the living.'); closePanel(); rerenderPlanBody(); };
  p.querySelector('#hpDel').onclick = () => { const days = Object.values(S.habitLog).filter(l => l[h.id]).length;
    closePanel();
    requestDelete({label: `${h.name}${days ? ` and ${days} logged day${days === 1 ? '' : 's'}` : ''}`,
      remove: () => { const logs = [];
        Object.entries(S.habitLog).forEach(([d, l]) => { if(l[h.id]){ logs.push([d, l[h.id]]); delete l[h.id]; } });
        const stacked = (S.habits || []).filter(x => x.stackAfter === h.id); stacked.forEach(x => x.stackAfter = null);
        const back = spliceOut(S.habits, x => x.id === h.id);
        return () => { back(); logs.forEach(([d, v]) => { S.habitLog[d] = S.habitLog[d] || {}; S.habitLog[d][h.id] = v; });
          stacked.forEach(x => x.stackAfter = h.id); }; },
      after: rerenderPlanBody}); };
  p.querySelector('#hpAcc').onchange = function(){ h.accountability = this.value; saveNow(); };
  p.querySelectorAll('[data-hpdiff]').forEach(b => b.onclick = () => { h.difficulty = +b.dataset.hpdiff;
    b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); saveNow(); });
  p.querySelectorAll('[data-hplk]').forEach(c => c.onclick = () => {
    const [k, id] = c.dataset.hplk.split(':');
    const arr = h.links[k] = h.links[k] || [];
    const i = arr.indexOf(id); if(i < 0) arr.push(id); else arr.splice(i, 1);
    c.classList.toggle('on', i < 0); saveNow(); });
  const pa = p.querySelector('#hpProgAdd'); if(pa) pa.onclick = () => {
    h.progression.push({week: (h.progression[h.progression.length - 1]?.week || 0) + 1, target:''}); saveNow(); habRedraw(h); };
  p.querySelectorAll('[data-hpprogdel]').forEach(b => b.onclick = () => { h.progression.splice(+b.dataset.hpprogdel, 1); saveNow(); habRedraw(h); });
  const ta = p.querySelector('#hpTrigAdd'); if(ta) ta.onclick = () => {
    h.triggers.push({id:uid(), type:'emotional', description:'', intensity:3, strategy:''}); saveNow(); habRedraw(h); };
  p.querySelectorAll('[data-hptrigdel]').forEach(b => b.onclick = () => { spliceOut(h.triggers, x => x.id === b.dataset.hptrigdel); saveNow(); habRedraw(h); });
  p.querySelectorAll('[data-hptrigtype]').forEach(s => s.onchange = () => {
    const t = h.triggers.find(x => x.id === s.dataset.hptrigtype); if(t){ t.type = s.value; saveNow(); } });
  p.querySelectorAll('[data-hptrigint]').forEach(b => b.onclick = () => {
    const [id, n] = b.dataset.hptrigint.split(':');
    const t = h.triggers.find(x => x.id === id); if(!t) return;
    t.intensity = +n; saveNow(); habRedraw(h); });
}

/* ---------- the room's own wiring ---------- */
function bindHabRoom(root){
  $$('[data-hbview]', root).forEach(b => b.onclick = () => habSetView(b.dataset.hbview));
  const nb = $('#hbNew', root); if(nb) nb.onclick = () => openHabitModal();
  $$('[data-hbf]', root).forEach(b => b.onclick = () => {
    const [k, v] = b.dataset.hbf.split(':');
    const f = habFilter();
    if(k === 'clear'){ S._habFilter = {type:'all', cat:'', dim:'', value:''}; }
    else if(k === 'type') f.type = v;
    else f[k] = f[k] === v ? '' : v;
    rerenderPlanBody(); });
  $$('[data-hbopen]', root).forEach(b => b.onclick = ev => { ev.stopPropagation(); openHabitPanel(b.dataset.hbopen); });
  $$('[data-hbcheck]', root).forEach(b => b.onclick = ev => { ev.stopPropagation(); openHabitCheckIn(b.dataset.hbcheck); });
  $$('[data-hbcard]', root).forEach(c => c.addEventListener('click', ev => {
    if(ev.target.closest('button')) return; openHabitPanel(c.dataset.hbcard); }));
  $$('[data-hbrestore]', root).forEach(b => b.onclick = () => {
    const h = byId(S.habits, b.dataset.hbrestore); if(!h) return;
    h.archived = false; saveNow(); sound('click'); rerenderPlanBody(); });
}
