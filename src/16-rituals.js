/* ============================================================
   HABIT MECHANICS, GUIDED REVIEWS, PATTERNS
   The pages that used these live in Rhythm now; these are the
   pieces they are built from.
   ============================================================ */
const TOD = ['morning','afternoon','evening','anytime'];
function habitFreqLabel(h){ const f = h.freq; if(f.type==='daily') return 'daily'; if(f.type==='days') return f.days.map(d=>DOW[d].slice(0,3)).join(' '); if(f.type==='perWeek') return `${f.count}× / week`; if(f.type==='perMonth') return `${f.count}× / month`; return ''; }
function markHabit(h, level, note=''){ const T = today(); S.habitLog[T] = S.habitLog[T]||{}; if(level) S.habitLog[T][h.id] = {level, note}; else delete S.habitLog[T][h.id]; saveNow(); }
/* ---------- the habit form ----------
   Building a habit and breaking one are not the same task, and the form used
   to pretend they were: one set of fields with a "negative habit" switch
   hidden at the bottom, after you had already filled in a minimum version, an
   ideal version, a time of day and what to stack it after — none of which
   means anything for something you are trying to stop.

   So the first question is which kind, each said in a line, and the rest of
   the form follows from the answer.

   Building asks: how often, when, the smallest version that still counts, the
   version you are aiming at, what it comes after.

   Breaking asks: one standard rather than two versions — the line, so you know
   whether today was a slip; what sets it off; what you do instead, which is
   the actual mechanism rather than willpower; and what it costs you, to read
   when you are deciding. It has no frequency, because a thing you are not
   doing is not due on Tuesday. */
const HABIT_KINDS = [
  ['positive', 'Building', 'Something to do more of. Kept on a rhythm, and it counts as done.'],
  ['negative', 'Breaking', 'Something to do less of, or not at all. Counted as days since, not as days done.'],
];
function habitDefaults(){
  return {id:uid(), name:'', freq:{type:'daily',days:[],count:3}, timeOfDay:'morning',
    dimension:'physical', kind:'expenditure', links:{values:[],skills:[]},
    min:'', ideal:'', prompt:'', negative:false, archived:false, stackAfter:null,
    relational:'', standard:'', trigger:'', instead:'', cost:'', order:S.habits.length};
}
function openHabitModal(id){
  const h = id ? byId(S.habits, id) : habitDefaults();
  if(h.relational === undefined) h.relational = '';
  ['standard','trigger','instead','cost'].forEach(k => { if(h[k] === undefined) h[k] = ''; });
  /* the choice steers the form, so it is held here and the body redrawn on it */
  let neg = !!h.negative;

  const kindRow = () => `<div class="hk-row" id="hKindRow">${HABIT_KINDS.map(([k, name, line]) =>
    `<button type="button" class="hk-card${(k === 'negative') === neg ? ' on' : ''}" data-hkind="${k}">
      <span class="hk-name">${esc(name)}</span><span class="hk-line">${esc(line)}</span></button>`).join('')}</div>`;

  const building = () => `
    <div class="grid c2" style="gap:10px">
      <div class="field"><label>Frequency</label><select class="sel" id="hFreq">
        <option value="daily" ${h.freq.type==='daily'?'selected':''}>daily</option>
        <option value="days" ${h.freq.type==='days'?'selected':''}>specific days</option>
        <option value="perWeek" ${h.freq.type==='perWeek'?'selected':''}>× per week</option>
        <option value="perMonth" ${h.freq.type==='perMonth'?'selected':''}>× per month</option></select></div>
      <div class="field"><label>Time of day</label><select class="sel" id="hTod">${TOD.map(t=>`<option ${h.timeOfDay===t?'selected':''}>${t}</option>`).join('')}</select></div>
    </div>
    <div class="row" id="hDays">${DOW.map((d,i)=>`<button class="btn sm ${h.freq.days.includes(i)?'primary':''}" data-day="${i}">${d.slice(0,3)}</button>`).join('')}</div>
    <div class="row" id="hCount"><span class="mono">how many times</span><input class="inp" type="number" min="1" max="31" id="hCountN" value="${h.freq.count||3}" style="width:80px"></div>
    <div class="grid c2" style="gap:10px">
      <div class="field"><label>Energy dimension</label><select class="sel" id="hDim">${DIMS.map(d=>`<option value="${d.id}" ${h.dimension===d.id?'selected':''}>${d.name}</option>`).join('')}</select></div>
      <div class="field"><label>Kind</label><select class="sel" id="hKind">
        <option value="expenditure" ${h.kind==='expenditure'?'selected':''}>expenditure (stress / growth)</option>
        <option value="recovery" ${h.kind==='recovery'?'selected':''}>recovery (renewal)</option></select></div>
    </div>
    <div class="grid c2" style="gap:10px">
      <div class="field"><label>Minimum version</label><input class="inp" id="hMin" value="${esc(h.min)}" placeholder="1 pushup"></div>
      <div class="field"><label>Ideal version</label><input class="inp" id="hIdeal" value="${esc(h.ideal)}" placeholder="30-minute workout"></div>
    </div>
    <div class="field"><label>Stack after</label><select class="sel" id="hStack"><option value="">—</option>${S.habits.filter(x=>x.id!==h.id&&!x.archived&&!x.negative).map(x=>`<option value="${x.id}" ${h.stackAfter===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>
    <div class="grid c2" style="gap:10px">
      <div class="field"><label>The cue</label><input class="inp" id="hCue" value="${esc(h.cue || '')}" placeholder="After I pour the coffee…">
        <div class="faint" style="font-size:.74rem">A ritual hangs off something that already happens.</div></div>
      <div class="field"><label>The set-up</label><input class="inp" id="hEnv" value="${esc(h.environment || '')}" placeholder="desk, phone in another room"></div>
    </div>
    <div class="field"><label>Micro-journal prompt (optional)</label><input class="inp" id="hPrompt" value="${esc(h.prompt)}" placeholder="How was the run?"></div>
    <div class="field"><label>Relational ritual (optional)</label><select class="sel" id="hRelational"><option value="">not relational</option>
      <option value="reachout" ${h.relational==='reachout'?'selected':''}>reach out to one person</option>
      <option value="gratitude" ${h.relational==='gratitude'?'selected':''}>gratitude for a person</option>
      <option value="ringreview" ${h.relational==='ringreview'?'selected':''}>ring review — open the constellation</option></select></div>`;

  const breaking = () => `
    <div class="field"><label>The standard</label>
      <input class="inp" id="hStandard" value="${esc(h.standard)}" placeholder="no scrolling after ten">
      <div class="faint" style="font-size:.76rem;margin-top:4px">One line, specific enough that you always know whether today counted as a slip. Not a minimum and an ideal — a habit you are breaking has one line, and you are on one side of it or the other.</div></div>
    <div class="field"><label>What sets it off</label>
      <input class="inp" id="hTrigger" value="${esc(h.trigger)}" placeholder="tired, alone, phone within reach">
      <div class="faint" style="font-size:.76rem;margin-top:4px">The state or the situation it follows. Naming it is most of the work.</div></div>
    <div class="field"><label>What I do instead</label>
      <input class="inp" id="hInstead" value="${esc(h.instead)}" placeholder="put the phone in the other room and read">
      <div class="faint" style="font-size:.76rem;margin-top:4px">A habit is easier to replace than to delete.</div></div>
    <div class="field"><label>What it costs me</label>
      <textarea class="ta" id="hCost" style="min-height:56px" placeholder="what it actually takes, written plainly">${esc(h.cost)}</textarea>
      <div class="faint" style="font-size:.76rem;margin-top:4px">Written now, to be read at the moment you are deciding.</div></div>
    <div class="field"><label>When the urge hits</label>
      <textarea class="ta" id="hProtocol" style="min-height:56px" placeholder="1) Name it aloud. 2) Five breaths. 3) Phone in the drawer. 4) Open the book.">${esc(h.protocol || '')}</textarea>
      <div class="faint" style="font-size:.76rem;margin-top:4px">Written now, in the calm, because the moment you need it is the moment you cannot write it.</div></div>
    <div class="field"><label>Energy dimension</label><select class="sel" id="hDim">${DIMS.map(d=>`<option value="${d.id}" ${h.dimension===d.id?'selected':''}>${d.name}</option>`).join('')}</select></div>
    <div class="field"><label>Micro-journal prompt (optional)</label><input class="inp" id="hPrompt" value="${esc(h.prompt)}" placeholder="What was going on just before?"></div>`;

  const m = openModal(`<h2>${id?'Edit habit':'A new habit'}</h2><div class="stack">
    <div class="field"><label>Which kind is this?</label>${kindRow()}</div>
    <div class="field"><label>Name</label><input class="inp" id="hName" value="${esc(h.name)}"></div>
    <!-- Maltz's point, asked at the moment of creation rather than buried in a
         panel: a habit that does not follow from who you take yourself to be
         is a rule, and rules are kept with willpower until the willpower runs
         out. Optional, because forcing it would make it glib. -->
    <div class="field"><label>${neg ? 'I am no longer someone who…' : 'I am someone who…'}</label>
      <input class="inp" id="hIdentity" value="${esc(h.identity || '')}"
        placeholder="${neg ? 'numbs with a feed. I am someone who sits with the quiet.' : 'begins each day in stillness.'}">
      <div class="hb-coach sm">${esc(HAB_QUOTES.identity[1])} <cite>${esc(HAB_QUOTES.identity[0])}</cite></div></div>
    <div class="grid c2" style="gap:10px">
      <div class="field"><label>Area of life</label><select class="sel" id="hCat">${HAB_CATS.map(c =>
        `<option value="${c}" ${(h.category || 'health') === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="field"><label>Why it matters</label><input class="inp" id="hWhy" value="${esc(h.why || '')}" placeholder="the reason under the reason"></div>
    </div>
    <div id="hBody" class="stack">${neg ? breaking() : building()}</div>
    <div class="field"><label>Linked values</label><div class="deps">${S.values.map(v=>`<span class="chip click ${h.links.values.includes(v.id)?'on':''}" style="--c:${v.color}" data-lv="${v.id}">${esc(v.name.split(' ')[0])}</span>`).join('')}</div></div>
    <div class="field" id="hSkillField"><label>Linked skills</label><div class="deps">${S.skills.map(v=>`<span class="chip click ${h.links.skills.includes(v.id)?'on':''}" style="--c:var(--ment)" data-lsk="${v.id}">${esc(v.name)}</span>`).join('')}</div></div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="hSave">${id?'Save':'Add habit'}</button></div>
    ${id?moreSection(`<div class="danger-zone"><span>Archiving keeps the history. Deleting removes ${Object.values(S.habitLog).filter(l=>l[id]).length} logged days.</span><button class="btn sm ghost danger" id="hDelete">Delete this habit</button></div>`):''}</div>`);

  if(id) m.querySelector('#hDelete').onclick = () => { m.remove(); requestDelete({label: h.name, remove: () => { const logs = []; Object.entries(S.habitLog).forEach(([day, l]) => { if(l[h.id]){ logs.push([day, l[h.id]]); delete l[h.id]; } }); const negL = S.negLast?.[h.id]; if(S.negLast) delete S.negLast[h.id]; const stacked = S.habits.filter(x => x.stackAfter === h.id); stacked.forEach(x => x.stackAfter = null); const back = spliceOut(S.habits, x => x.id === h.id); return () => { back(); logs.forEach(([day, v]) => { S.habitLog[day] = S.habitLog[day] || {}; S.habitLog[day][h.id] = v; }); if(negL){ S.negLast = S.negLast || {}; S.negLast[h.id] = negL; } stacked.forEach(x => x.stackAfter = h.id); }; }}); };

  /* the frequency rows only make sense for two of the four frequencies */
  const updFreq = () => { const f = m.querySelector('#hFreq'); if(!f) return;
    const t = f.value;
    m.querySelector('#hDays').style.display = t==='days' ? '' : 'none';
    m.querySelector('#hCount').style.display = (t==='perWeek'||t==='perMonth') ? '' : 'none'; };
  /* whatever has been typed survives switching kind: the name and the linked
     chips live outside the body, and the fields inside it are read back into
     the habit before it is redrawn */
  const readBody = () => {
    const g = sel => m.querySelector(sel)?.value;
    if(neg){ h.standard = g('#hStandard') ?? h.standard; h.trigger = g('#hTrigger') ?? h.trigger;
      h.instead = g('#hInstead') ?? h.instead; h.cost = g('#hCost') ?? h.cost; }
    else { h.min = g('#hMin') ?? h.min; h.ideal = g('#hIdeal') ?? h.ideal;
      h.timeOfDay = g('#hTod') ?? h.timeOfDay; h.kind = g('#hKind') ?? h.kind;
      h.stackAfter = (g('#hStack') || null); h.relational = g('#hRelational') ?? h.relational;
      const ft = g('#hFreq'); if(ft) h.freq = {type: ft,
        days: [...m.querySelectorAll('[data-day].primary')].map(b => +b.dataset.day),
        count: +g('#hCountN') || 1}; }
    h.dimension = g('#hDim') ?? h.dimension;
    h.prompt = g('#hPrompt') ?? h.prompt;
    if(neg) h.protocol = g('#hProtocol') ?? h.protocol;
    else { h.cue = g('#hCue') ?? h.cue; h.environment = g('#hEnv') ?? h.environment; }
  };
  const bindBody = () => {
    const f = m.querySelector('#hFreq'); if(f){ updFreq(); f.onchange = updFreq; }
    m.querySelectorAll('[data-day]').forEach(b => b.onclick = () => b.classList.toggle('primary'));
  };
  bindBody();
  /* a skill is something you are getting better at; nothing about stopping is */
  const updSkills = () => { const f = m.querySelector('#hSkillField'); if(f) f.hidden = neg; };
  updSkills();

  m.querySelectorAll('[data-hkind]').forEach(b => b.onclick = () => {
    const want = b.dataset.hkind === 'negative';
    if(want === neg) return;
    readBody();
    neg = want;
    m.querySelectorAll('[data-hkind]').forEach(x => x.classList.toggle('on', x === b));
    m.querySelector('#hBody').innerHTML = neg ? breaking() : building();
    /* the identity line reads the other way round for a habit you are
       outgrowing, so its label and prompt change with the choice */
    const il = m.querySelector('#hIdentity');
    if(il){ il.previousElementSibling; const lab = il.closest('.field').querySelector('label');
      lab.textContent = neg ? 'I am no longer someone who…' : 'I am someone who…';
      il.placeholder = neg ? 'numbs with a feed. I am someone who sits with the quiet.' : 'begins each day in stillness.'; }
    bindBody(); updSkills();
  });

  m.querySelectorAll('[data-lv],[data-lsk]').forEach(c => c.onclick = () => c.classList.toggle('on'));
  m.querySelector('#hSave').onclick = () => {
    h.name = m.querySelector('#hName').value.trim(); if(!h.name) return;
    readBody();
    h.identity = m.querySelector('#hIdentity').value.trim();
    h.category = m.querySelector('#hCat').value;
    h.why = m.querySelector('#hWhy').value.trim();
    h.negative = neg;
    habDefaults(h);
    /* a habit you are breaking is never "due", so it keeps a frequency only so
       that nothing downstream has to guard against its absence */
    if(neg){ h.freq = {type:'daily', days:[], count:1}; h.stackAfter = null; h.relational = ''; }
    h.links = {values: [...m.querySelectorAll('[data-lv].on')].map(c => c.dataset.lv),
               skills: neg ? [] : [...m.querySelectorAll('[data-lsk].on')].map(c => c.dataset.lsk)};
    if(!id) S.habits.push(h);
    saveNow(); m.remove(); rerender(); sound('save');
  };
}
/* The guided review flows now live in reviewflows.js — step-by-step rather
   than a wall of cards, and reachable from Rhythm's Reviews tab. */

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
