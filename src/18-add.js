/* ============================================================
   ADD — two tiers, two code paths.
   Tier 1: the contextual per-page Add. Each page registers a
           PageEntryConfig; the button only reads it.
   Tier 2: the universal FAB speed dial. Every entry type in the
           app, grouped by zone. The power-user escape hatch.
   ============================================================ */

/* ---------- context registration ---------- */
const PageEntryConfig = {
  current: null,
  register(cfg){ this.current = cfg; return cfg; },
  clear(){ this.current = null; },
};
function registerPageEntry(cfg){ return PageEntryConfig.register(cfg); }

/* ---------- named entry actions (referenced by page configs and by the FAB) ---------- */
const journalTypes = () => S.journals.map(j => j.type);
const EntryActions = {
  quickNote:      (pre={}) => openEntryModal({type:'reflection', allowedTypes:['reflection'], heading:'Quick note', ...pre}),
  taskReminder:   ()       => openReminderModal(),
  dailyIntention: ()       => focusIntention(),
  journalEntry:   (pre={}) => openEntryModal({type: pre.journalType || S._journal || 'reflection', allowedTypes: journalTypes(), heading:'New journal entry', links: pre.links}),
  memory:         (pre={}) => openEntryModal({type:'memory', allowedTypes:['memory','artifact','letter'], heading:'New memory', links: pre.links}),
  libraryQuote:   (pre={}) => openEntryModal({type:'quote', allowedTypes:['quote'], heading:'New quote or saved link', links: pre.links}),
  snapshot:       ()       => openSnapshotModal(),
  newValue:       ()       => newValueDialog(),
  newSkill:       ()       => newSkillDialog(),
  skillProgress:  (pre={}) => openEntryModal({type:'progress', allowedTypes:['progress'], heading:'Add a level to a skill — log practice', links: pre.links, openLinks:true}),
  newVision:      (pre={}) => newVisionDialog(pre),
  lifeEvent:      (pre={}) => openLifeEventModal(pre.era || presentEra()?.id),
  newProject:     ()       => createProject(),
  newHabit:       ()       => openHabitModal(),
};

/* ---------- Tier 1: contextual Add (inline, top of the page content) ---------- */
function mountContextAdd(main){
  $('#ctxAdd')?.remove();
  const cfg = PageEntryConfig.current; if(!cfg) return;
  const page = main.querySelector('.page'); if(!page) return;
  const bar = el(`<div class="ctx-add" id="ctxAdd"><button class="btn primary" id="ctxAddBtn" aria-label="${esc(cfg.addLabel)}">＋ ${esc(cfg.addLabel)}</button>${cfg.hint ? `<span class="hint">${esc(cfg.hint)}</span>` : ''}</div>`);
  page.insertBefore(bar, page.firstChild);
  bar.querySelector('#ctxAddBtn').onclick = () => runContextAdd(cfg);
}
function runContextAdd(cfg){
  const opts = (cfg.options || []).slice(0, 3);
  if(opts.length <= 1){ const run = opts[0]?.run || (() => openEntryModal({type: cfg.defaultEntryType, allowedTypes:[cfg.defaultEntryType], ...(cfg.prefilledFields||{})})); run(cfg.prefilledFields || {}); return; }
  const m = openModal(`<h2>${esc(cfg.addLabel)}</h2><div class="stack" style="gap:8px">${opts.map((o,i) => `<button class="choice" data-i="${i}"><span class="ico">${o.icon||'＋'}</span><span><b>${esc(o.label)}</b>${o.desc?`<div class="d">${esc(o.desc)}</div>`:''}</span></button>`).join('')}</div>`, 'narrow');
  m.querySelectorAll('.choice').forEach(b => b.onclick = () => { m.remove(); opts[+b.dataset.i].run(cfg.prefilledFields || {}); });
}

/* ---------- Tier 2: universal FAB speed dial (separate path) ---------- */
const SPEED_DIAL = [
  {zone:'Today',    icon:'📅', label:'Today — Quick note / Task', actions:[['Quick note', ()=>EntryActions.quickNote()], ['Task', ()=>EntryActions.taskReminder()]]},
  {zone:'Journal',  icon:'📓', label:'Journal entry',        run: ()=>EntryActions.journalEntry()},
  {zone:'Memory',   icon:'💭', label:'Memory',               run: ()=>EntryActions.memory()},
  {zone:'Library',  icon:'📚', label:'Library quote',        run: ()=>EntryActions.libraryQuote()},
  {zone:'Compass',  icon:'🧭', label:'Congruence snapshot',  run: ()=>EntryActions.snapshot()},
  {zone:'Skills',   icon:'🌳', label:'Skill node',           run: ()=>EntryActions.newSkill()},
  {zone:'Vision',   icon:'🔮', label:'Vision goal',          run: ()=>EntryActions.newVision()},
  {zone:'Lifeline', icon:'◆', label:'Life event',            run: ()=>EntryActions.lifeEvent()},
  {zone:'Projects', icon:'📋', label:'Project',              run: ()=>EntryActions.newProject()},
];
function buildSpeedDial(){
  const dial = $('#speedDial'); if(!dial) return;
  dial.innerHTML = `<div class="sd-filter-wrap"><input class="sd-filter" id="sdFilter" placeholder="Type to filter… e.g. journal" autocomplete="off" aria-label="filter entry types"></div>` + SPEED_DIAL.map((it,i) => `<div class="sd-item" style="--i:${i}"><span class="sd-ico">${it.icon}</span>${it.actions ? `<span class="sd-lbl">${esc(it.zone)} —</span>${it.actions.map(([l],j)=>`<button class="sd-act" data-i="${i}" data-j="${j}">${esc(l)}</button>`).join('<span class="sd-sep">/</span>')}` : `<button class="sd-act sd-main" data-i="${i}">${esc(it.label)}</button>`}</div>`).join('');
  dial.querySelectorAll('.sd-act').forEach(b => b.onclick = () => { const it = SPEED_DIAL[+b.dataset.i]; closeSpeedDial(); (it.actions ? it.actions[+b.dataset.j][1] : it.run)(); });
  const f = dial.querySelector('#sdFilter');
  const applyFilter = () => { const q = f.value.trim().toLowerCase(); let n = 0; dial.querySelectorAll('.sd-item').forEach(it => { const show = !q || it.textContent.toLowerCase().includes(q); it.hidden = !show; if(show) n++; }); dial.querySelector('.sd-empty')?.remove(); if(!n) dial.insertAdjacentHTML('beforeend', '<div class="sd-item sd-empty"><span class="sd-lbl">nothing matches</span></div>'); };
  f.addEventListener('input', applyFilter);
  f.addEventListener('keydown', e => { e.stopPropagation(); if(e.key === 'Escape'){ closeSpeedDial(); $('#fab').focus(); } if(e.key === 'Enter'){ const first = dial.querySelector('.sd-item:not([hidden]) .sd-act'); first?.click(); } });
}
function openSpeedDial({focusFilter=false}={}){ const d = $('#speedDial'); if(!d) return; buildSpeedDial(); d.hidden = false; $('#fab').classList.add('open'); $('#fab').setAttribute('aria-expanded','true'); if(focusFilter) setTimeout(() => d.querySelector('#sdFilter')?.focus(), 30); }
function toggleSpeedDialWithFilter(){ $('#speedDial')?.hidden ? openSpeedDial({focusFilter:true}) : closeSpeedDial(); }
function closeSpeedDial(){ const d = $('#speedDial'); if(!d || d.hidden) return; d.hidden = true; d.innerHTML = ''; $('#fab').classList.remove('open'); $('#fab').setAttribute('aria-expanded','false'); }
function toggleSpeedDial(){ $('#speedDial')?.hidden ? openSpeedDial() : closeSpeedDial(); }
document.addEventListener('click', e => { if(!e.target.closest('#fabWrap')) closeSpeedDial(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape' && !$('#speedDial')?.hidden) closeSpeedDial(); });

/* ---------- small helpers used by actions ---------- */
function focusIntention(){
  const go = () => { const n = document.querySelector('.ed[data-path$=".intention"]'); if(!n) return; const det = n.closest('details'); if(det) det.open = true; n.scrollIntoView({block:'center', behavior:'smooth'}); setTimeout(() => beginEdit(n), 250); };
  if(currentRoute === 'today') go(); else { navigate('#/today'); setTimeout(go, 450); }
}
function openReminderModal(){
  const m = openModal(`<h2>Task reminder</h2><p class="muted" style="margin-top:-8px">A small thing to surface on Today. Not a task manager — a nudge.</p><div class="stack"><input class="inp serif-lg" id="rmText" placeholder="What needs doing?"><div class="field"><label>Surface on</label><input class="inp" type="date" id="rmDate" value="${today()}"></div><div class="row" style="justify-content:flex-end"><button class="btn primary" id="rmSave">Set reminder</button></div></div>`, 'narrow');
  const fin = () => { const t = m.querySelector('#rmText').value.trim(); if(!t) return; S.reminders = S.reminders || []; S.reminders.push({id:uid(), text:t, date:m.querySelector('#rmDate').value || today(), done:false, createdAt:today()}); saveNow(); m.remove(); sound('success'); toast('Reminder set.'); if(currentRoute === 'today') rerender(); };
  m.querySelector('#rmSave').onclick = fin; m.querySelector('#rmText').onkeydown = e => { if(e.key === 'Enter') fin(); }; setTimeout(() => m.querySelector('#rmText').focus(), 50);
}
function newValueDialog(){
  if(S.values.length >= 10){ toast('The compass holds ten values. Rename one instead of adding an eleventh.'); return; }
  const m = openModal(`<h2>A new value</h2><div class="stack"><div class="field"><label>Name</label><input class="inp" id="nvName" placeholder="e.g. Generosity"></div><div class="field"><label>Colour</label><input type="color" id="nvColor" value="#b08968" style="width:48px;height:32px;border:none;background:none;padding:0"></div><div class="row" style="justify-content:flex-end"><button class="btn primary" id="nvSave">Add value</button></div></div>`, 'narrow');
  m.querySelector('#nvSave').onclick = () => { const name = m.querySelector('#nvName').value.trim(); if(!name) return; const v = {id:'v-'+uid(), name, color:m.querySelector('#nvColor').value, fields:{embody:[],hundred:[],motivation:[],counterfeit:[]}}; S.values.push(v); S.valueOrderHistory.push({date:today(), order:[...S.valueOrder]}); S.valueOrder.push(v.id); saveNow(); m.remove(); rerender(); navigate('#/value/'+v.id); };
}
function newVisionDialog(pre={}){
  const m = openModal(`<h2>A new branch</h2><div class="stack"><div class="field"><label>Name</label><input class="inp" id="vnName" placeholder="What do you want to create?"></div><div class="field"><label>Era</label><select class="sel" id="vnEra">${erasList().map(e=>`<option value="${e.id}" ${pre.era===e.id?'selected':''}>${esc(e.name)}${e.subtitle?' — '+esc(e.subtitle):''}</option>`).join('')}</select></div><div class="field"><label>Forks from (optional)</label><select class="sel" id="vnParent"><option value="">the trunk</option>${S.visions.map(v=>`<option value="${v.id}">${esc(v.name)}</option>`).join('')}</select></div></div><div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn primary" id="vnSave">Plant it</button></div>`,'narrow');
  m.querySelector('#vnSave').onclick = () => { const name = m.querySelector('#vnName').value.trim(); if(!name) return; const v = {id:uid(),name,era:m.querySelector('#vnEra').value,parentId:m.querySelector('#vnParent').value||null,status:'pending',phase:'in-progress',progress:0,startedAt:today(),completedAt:'',successCriteria:'',reflection:'',archived:false,confidence:'hunch',nextAction:'',sensory:{see:'',hear:'',smell:'',firstHour:'',who:'',noLonger:''},futureMemory:'',futureMemoryHistory:[],costs:'',currentReality:'',currentRealityHistory:[],resistance:[],preSkills:[],selfImage:'',values:[],obituary:'',evidence:[],feeling:0,targetDate:'',location:'',money:'',createdAt:today()}; S.visions.push(v); saveNow(); m.remove(); if(currentRoute !== 'vision') navigate('#/vision'); else rerender(); setTimeout(() => openVisionPanel(v.id), currentRoute==='vision' ? 0 : 400); };
  setTimeout(() => m.querySelector('#vnName').focus(), 50);
}
function newSkillDialog(){
  const m = openModal(`<h2>A new skill</h2><div class="stack"><div class="field"><label>Name</label><input class="inp" id="skName"></div><div class="field"><label>Category</label><select class="sel" id="skCat">${SKILL_CATS.map(c=>`<option>${c}</option>`).join('')}</select></div><label class="toggle" id="skPlanned"><span class="sw"></span><span>planned — a bud, not yet begun</span></label></div><div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn primary" id="skSave">Add</button></div>`,'narrow');
  let planned=false; m.querySelector('#skPlanned').onclick = function(){ planned=!planned; this.classList.toggle('on',planned); };
  m.querySelector('#skSave').onclick = () => { const name = m.querySelector('#skName').value.trim(); if(!name) return; const s = {id:uid(),name,cat:m.querySelector('#skCat').value,levels:[{number:1,label:'Beginner',description:'',criteria:[],resources:[],estimatedTime:'',targetDate:null},{number:2,label:'Competent',description:'',criteria:[],resources:[],estimatedTime:'',targetDate:null},{number:3,label:'Proficient',description:'',criteria:[],resources:[],estimatedTime:'',targetDate:null}],currentLevel:planned?0:1,milestones:[],prereqs:[],planned}; S.skills.push(s); saveNow(); m.remove(); if(currentRoute !== 'skills') navigate('#/skills'); else rerender(); setTimeout(() => openSkillPanel(s.id), currentRoute==='skills' ? 0 : 400); };
  setTimeout(() => m.querySelector('#skName').focus(), 50);
}
