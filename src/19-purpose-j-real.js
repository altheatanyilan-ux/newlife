/* ============================================================
   MAKING IT REAL — goals, skills, habits and small bets (#/purpose/real)

   The course's game plan has eight parts. Fear, programming and hours are
   elsewhere. This is the other four, and its organising idea is screening:
   every goal, skill, habit and bet is put to the sheet and either survives
   or is dropped. Breadth first, because the filter only works if there is
   something to filter; and nothing is blocked — a goal that hits none of the
   sheet is asked the course's question, not given an error, and keeping it is
   always possible and always recorded with a reason.
   ============================================================ */

purposeTabAdd({id: 'real', label: 'Making it real', order: 50, render: (body) => realRender(body)});
const REAL_TABS = [['goals', 'Goals'], ['skills', 'Skills'], ['habits', 'Habits'], ['bets', 'Small bets']];
function realRender(body){
  const p = purposeState();
  const tab = REAL_TABS.some(t => t[0] === p.realTab) ? p.realTab : 'goals';
  body.innerHTML = `<div class="rl-wrap"><div class="dm-sub" role="tablist">${REAL_TABS.map(([k, n]) => `<button role="tab" class="${k === tab ? 'on' : ''}" data-rltab="${k}">${n}</button>`).join('')}</div><div id="rlBody"></div></div>`;
  body.querySelectorAll('[data-rltab]').forEach(b => b.onclick = () => { p.realTab = b.dataset.rltab; saveNow(); rerender(); });
  const host = body.querySelector('#rlBody');
  ({goals: realGoals, skills: realSkills, habits: realHabits, bets: realBets})[tab](host);
}

/* ---------- 9a. the goal funnel ---------- */
function funnelState(){
  const p = purposeState();
  if(!p.funnel) p.funnel = {year: new Date().getFullYear() + 1, stage: 'brainstorm', items: [], goalIds: []};
  return p.funnel;
}
/* the top twenty per cent: the ceiling of the count over five, floor three, ceiling ten */
const funnelCut = n => Math.min(n, Math.max(3, Math.min(10, Math.ceil(n / 5))));
/* start with high values that have low congruence: a sort, not advice */
function goalValueGap(g){
  const ids = ((g.screen && g.screen.valueIds) || []).filter(id => (S.valueOrder || []).includes(id));
  if(!ids.length) return -1e9;
  const top = ids.slice().sort((a, b) => S.valueOrder.indexOf(a) - S.valueOrder.indexOf(b))[0];
  const gp = typeof valueGaps === 'function' ? valueGaps().find(x => x.id === top) : null;
  return gp ? gp.gap : 0;
}
function realGoals(host){
  const f = funnelState();
  const goals = () => f.goalIds.map(id => perfGoals().find(g => g.id === id)).filter(Boolean);
  const stages = [['brainstorm', 'Brainstorm'], ['prioritise', 'Prioritise'], ['screen', 'Screen'], ['concretise', 'Concretise']];
  host.innerHTML = `<p class="faint dm-lede">Write at least thirty goals for next year. Then keep the top fifth — you are really supposed to accomplish about a fifth of them, and the rest are not important enough. Put each through the sheet and the top ten values; if it hits none, ask why you are still making it. Be specific rather than “improve by ten per cent”. Review daily, update quarterly, write a new list from scratch each year.</p>
    <div class="dm-sub">${stages.map(([k, n]) => `<button class="${f.stage === k ? 'on' : ''}" data-fst="${k}">${n}</button>`).join('')}</div>
    <div id="fnBody"></div>`;
  host.querySelectorAll('[data-fst]').forEach(b => b.onclick = () => { f.stage = b.dataset.fst; saveNow(); rerender(); });
  const box = host.querySelector('#fnBody');
  if(f.stage === 'brainstorm'){
    box.innerHTML = `<div class="row" style="gap:8px"><input class="inp" id="fnAdd" placeholder="a goal for next year — specific" style="flex:1"><button class="btn" id="fnAddGo">add</button></div>
      <p class="mono faint" style="margin:8px 0">${f.items.length} written${f.items.length >= 30 ? '' : ` — the course’s target is thirty or more; breadth first, because the filter only works if there is something to filter`}</p>
      <ol class="fn-list">${f.items.map((it, i) => `<li>${esc(it.text)} <button class="del-x inline" data-fndel="${i}">×</button></li>`).join('')}</ol>`;
    const add = () => { const i = box.querySelector('#fnAdd'); const t = i.value.trim(); if(!t) return; f.items.push({id: uid(), text: t}); saveNow(); rerender(); setTimeout(() => { const n = document.querySelector('#fnAdd'); if(n) n.focus(); }, 30); };
    box.querySelector('#fnAddGo').onclick = add; box.querySelector('#fnAdd').onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); add(); } };
    box.querySelectorAll('[data-fndel]').forEach(b => b.onclick = () => { f.items.splice(+b.dataset.fndel, 1); saveNow(); rerender(); });
  } else if(f.stage === 'prioritise'){
    const k = funnelCut(f.items.length);
    box.innerHTML = f.items.length ? `<p class="faint">You wrote ${f.items.length}, so the line falls at ${k}. It is a line, not a cut — the others stay.</p>
      <ol class="fn-list">${f.items.map((it, i) => `<li class="${i === k ? 'fn-after' : ''}">${i === k ? '<div class="fn-line mono">— the top fifth ends here —</div>' : ''}${esc(it.text)}
        <span class="fn-mv"><button class="tbtn" data-fnup="${i}" ${i ? '' : 'disabled'}>▲</button><button class="tbtn" data-fndn="${i}" ${i < f.items.length - 1 ? '' : 'disabled'}>▼</button></span></li>`).join('')}</ol>
      <div class="row"><button class="btn primary" id="fnTake">Take the top ${k} to be screened</button></div>` : '<div class="empty">Write the list first.</div>';
    box.querySelectorAll('[data-fnup]').forEach(b => b.onclick = () => { const i = +b.dataset.fnup; [f.items[i - 1], f.items[i]] = [f.items[i], f.items[i - 1]]; saveNow(); rerender(); });
    box.querySelectorAll('[data-fndn]').forEach(b => b.onclick = () => { const i = +b.dataset.fndn; [f.items[i + 1], f.items[i]] = [f.items[i], f.items[i + 1]]; saveNow(); rerender(); });
    const t = box.querySelector('#fnTake'); if(t) t.onclick = () => {
      /* survivors become ordinary performance goals; nothing is a new goal type */
      f.items.slice(0, k).forEach(it => { if(f.goalIds.some(id => (perfGoals().find(g => g.id === id) || {}).funnelItem === it.id)) return;
        const g = perfNormalize({level: 'year', title: it.text}); g.funnelItem = it.id; g.fromFunnel = f.year; g.screen = {statement: false, genius: false, impact: false, domain: false, medium: false, valueIds: [], keptUnscreenedReason: null}; g.obstacles = []; g.firstStepVisualisedAt = null;
        perfGoals().push(g); f.goalIds.push(g.id); });
      f.stage = 'screen'; saveNow(); rerender(); };
  } else if(f.stage === 'screen'){
    const gs = goals().sort((a, b) => goalValueGap(b) - goalValueGap(a));
    box.innerHTML = gs.length ? `<p class="faint">Sorted so that goals tied to your highest values with the lowest congruence come first — the course’s “start with high values that have low congruence”. Goals with no value link sort last.</p>
      ${gs.map(g => { const sc = g.screen; const none = !PURPOSE_KEYS.some(k => sc[k]) && !(sc.valueIds || []).length;
        return `<article class="fn-goal" data-gid="${g.id}"><b class="serif">${esc(g.title)}</b>
          <div class="row" style="gap:6px;flex-wrap:wrap;margin:6px 0">${PURPOSE_KEYS.map(k => `<label class="chip ${sc[k] ? 'on' : ''}"><input type="checkbox" data-fsc="${g.id}|${k}" ${sc[k] ? 'checked' : ''} hidden>${esc(PURPOSE_FIELDS[k].short)}</label>`).join('')}</div>
          <div class="deps">${(S.valueOrder || []).map(id => byId(S.values, id)).filter(Boolean).map(v => `<button class="chip ${(sc.valueIds || []).includes(v.id) ? 'on' : ''}" style="--c:${esc(v.color)}" data-fsv="${g.id}|${v.id}">${esc(v.name)}</button>`).join('')}</div>
          ${none ? `<div class="fn-ask"><i>This hits none of the sheet. Why are you still making it?</i><input class="inp" data-fskeep="${g.id}" placeholder="because… (kept with this reason — it is not blocked)" value="${esc(sc.keptUnscreenedReason || '')}"></div>` : ''}
        </article>`; }).join('')}
      <div class="row"><button class="btn primary" id="fnNext">On to the obstacles</button></div>` : '<div class="empty">Take the top of the list from Prioritise first.</div>';
    box.querySelectorAll('[data-fsc]').forEach(c => c.onchange = () => { const [id, k] = c.dataset.fsc.split('|'); const g = goals().find(x => x.id === id); g.screen[k] = c.checked; saveNow(); rerender(); });
    box.querySelectorAll('label.chip').forEach(l => l.onclick = e => { if(e.target.tagName !== 'INPUT'){ const i = l.querySelector('input'); i.checked = !i.checked; i.dispatchEvent(new Event('change')); e.preventDefault(); } });
    box.querySelectorAll('[data-fsv]').forEach(b => b.onclick = () => { const [id, vid] = b.dataset.fsv.split('|'); const g = goals().find(x => x.id === id); const a = g.screen.valueIds = g.screen.valueIds || []; const i = a.indexOf(vid); if(i >= 0) a.splice(i, 1); else a.push(vid); saveNow(); rerender(); });
    box.querySelectorAll('[data-fskeep]').forEach(i => i.onchange = () => { const g = goals().find(x => x.id === i.dataset.fskeep); g.screen.keptUnscreenedReason = i.value.trim() || null; saveNow(); });
    const nx = box.querySelector('#fnNext'); if(nx) nx.onclick = () => { f.stage = 'concretise'; saveNow(); rerender(); };
  } else {
    const gs = goals();
    box.innerHTML = gs.length ? gs.map(g => `<article class="fn-goal" data-gid="${g.id}"><b class="serif">${esc(g.title)}</b>
        ${(g.obstacles || []).map((o, oi) => `<div class="fn-obs"><div class="mono faint">obstacle</div> ${esc(o.text)}
          ${(o.actions || []).map((a, ai) => `<div class="fn-act">→ ${esc(a.text)} ${a.taskId ? '<span class="mono faint">a task</span>' : `<button class="btn sm ghost" data-fntask="${g.id}|${oi}|${ai}">make this a task</button>`}</div>`).join('')}
          <div class="row" style="gap:6px;margin-top:4px"><input class="inp" data-fnact="${g.id}|${oi}" placeholder="a specific action — five books, three people to interview, the thing to cancel" style="flex:1"><button class="btn sm" data-fnactgo="${g.id}|${oi}">add</button></div></div>`).join('')}
        <div class="row" style="gap:6px;margin-top:6px"><input class="inp" data-fnobs="${g.id}" placeholder="a major obstacle" style="flex:1"><button class="btn sm" data-fnobsgo="${g.id}">add obstacle</button>
          <button class="btn sm ghost" data-fnvis="${g.id}">${g.firstStepVisualisedAt ? 'visualise the first step again' : 'five minutes: the first step'}</button></div></article>`).join('')
      : '<div class="empty">Nothing to concretise yet.</div>';
    const goalOf = id => gs.find(x => x.id === id);
    box.querySelectorAll('[data-fnobsgo]').forEach(b => b.onclick = () => { const g = goalOf(b.dataset.fnobsgo); const t = box.querySelector(`[data-fnobs="${g.id}"]`).value.trim(); if(!t) return; (g.obstacles = g.obstacles || []).push({text: t, actions: []}); saveNow(); rerender(); });
    box.querySelectorAll('[data-fnactgo]').forEach(b => b.onclick = () => { const [id, oi] = b.dataset.fnactgo.split('|'); const g = goalOf(id); const t = box.querySelector(`[data-fnact="${id}|${oi}"]`).value.trim(); if(!t) return; g.obstacles[+oi].actions.push({text: t, taskId: null}); saveNow(); rerender(); });
    box.querySelectorAll('[data-fntask]').forEach(b => b.onclick = () => { const [id, oi, ai] = b.dataset.fntask.split('|'); const g = goalOf(id); const a = g.obstacles[+oi].actions[+ai];
      const t = newPlanTask(a.text, ''); S.tasks.push(t); a.taskId = t.id; saveNow(); toast('Made a task.'); rerender(); });
    box.querySelectorAll('[data-fnvis]').forEach(b => b.onclick = () => { const g = goalOf(b.dataset.fnvis); g.firstStepVisualisedAt = new Date().toISOString(); saveNow();
      ppVisualiseRun({kind: 'goal', id: g.id, text: g.title}, 'month', 5); });
  }
}

/* ---------- 9b. purpose skills: a generator, not a store ---------- */
function domainSkillCats(){ const d = verLatest(purposeState().domain); return (d && d.skillCategories) || []; }
const skillInPlay = s => ['focus', 'active'].includes(typeof skillHorizon === 'function' ? skillHorizon(s) : 'active');
function domainSkillCount(){
  const cats = domainSkillCats(); const play = (S.skills || []).filter(skillInPlay);
  const n = play.filter(s => s.servesDomain || cats.includes(s.cat)).length;
  return {n, of: play.length};
}
function realSkills(host){
  const d = purposeState();
  const draft = d.skillDraft = d.skillDraft || {items: []};
  const c = domainSkillCount();
  host.innerHTML = `<p class="faint dm-lede">Which skills must you master to ace this life purpose? Aim for ten. For each, three tangible ways to develop it — ideally things you can do daily. They are important and not urgent, which is precisely why they get dropped.</p>
    <p class="mono faint">${c.n} of your ${c.of} skills in play serve the domain${domainSkillCats().length ? '' : ' (set the skill categories on the sheet’s domain to count them)'} — a count, not a score; four or five in focus is a working number.</p>
    ${draft.items.map((it, i) => `<article class="fn-goal"><div class="row between"><b class="serif">${esc(it.name)}</b><button class="del-x inline" data-sdel="${i}">×</button></div>
      ${[0, 1, 2].map(k => `<input class="inp" data-sway="${i}|${k}" placeholder="a tangible way to develop it ${k + 1}" value="${esc((it.ways || [])[k] || '')}" style="margin-top:4px">`).join('')}</article>`).join('')}
    <div class="row" style="gap:8px;margin:10px 0"><input class="inp" id="skAdd" placeholder="a skill I must master" style="flex:1"><button class="btn" id="skAddGo">add</button>
      <span class="mono faint">${draft.items.length} of ten</span></div>
    ${draft.items.length ? '<button class="btn primary" id="skOffer">Offer these to the Skill Tree</button>' : ''}`;
  const q = s => host.querySelector(s);
  const add = () => { const t = q('#skAdd').value.trim(); if(!t) return; draft.items.push({name: t, ways: ['', '', '']}); saveNow(); rerender(); };
  q('#skAddGo').onclick = add; q('#skAdd').onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); add(); } };
  host.querySelectorAll('[data-sdel]').forEach(b => b.onclick = () => { draft.items.splice(+b.dataset.sdel, 1); saveNow(); rerender(); });
  host.querySelectorAll('[data-sway]').forEach(i => i.onchange = () => { const [a, k] = i.dataset.sway.split('|'); draft.items[+a].ways[+k] = i.value.trim(); saveNow(); });
  if(q('#skOffer')) q('#skOffer').onclick = () => {
    const cats = domainSkillCats(), cat = cats[0] || (typeof SKILL_CATS !== 'undefined' ? SKILL_CATS[0] : 'Craft');
    const why = purposeText('statement') || purposeText('domain');
    const m = openModal(`<h2>Offered, not created</h2><p class="faint">Tick the ones you want in the Skill Tree. Category: ${esc(cat)}${why ? '; why: “' + esc(why.slice(0, 80)) + '”' : ''}. The three ways go in as resources on level one.</p>
      ${draft.items.map((it, i) => `<label class="row" style="gap:8px;padding:5px 0"><input type="checkbox" data-sof="${i}" ${(S.skills || []).some(s => s.name.toLowerCase() === it.name.toLowerCase()) ? '' : 'checked'}> <span>${esc(it.name)}${(S.skills || []).some(s => s.name.toLowerCase() === it.name.toLowerCase()) ? ' <span class="mono faint">already in the tree</span>' : ''}</span></label>`).join('')}
      <div class="row" style="justify-content:flex-end"><button class="btn primary" id="sofGo">Create the ticked ones</button></div>`);
    m.querySelector('#sofGo').onclick = () => { let n = 0;
      m.querySelectorAll('[data-sof]:checked').forEach(c => { const it = draft.items[+c.dataset.sof]; if(!it) return;
        const s = {id: uid(), name: it.name, cat, horizon: 'active', priority: 'P3', why, startBy: '', tags: [],
          levels: [{number: 1, label: 'Beginner', description: '', criteria: [], resources: (it.ways || []).filter(Boolean).map(w => ({type: 'practice', title: w, url: ''})), estimatedTime: '', targetDate: null},
            {number: 2, label: 'Competent', description: '', criteria: [], resources: [], estimatedTime: '', targetDate: null}, {number: 3, label: 'Proficient', description: '', criteria: [], resources: [], estimatedTime: '', targetDate: null}],
          currentLevel: 1, milestones: [], prereqs: [], planned: false, servesDomain: true, purposeRef: ['domain']};
        S.skills.push(s); n++; });
      draft.items = draft.items.filter((it, i) => !m.querySelector(`[data-sof="${i}"]`)?.checked);
      saveNow(); m.remove(); sound('success'); toast(`${n} skill${n === 1 ? '' : 's'} in the Skill Tree.`); rerender(); };
  };
}

/* ---------- 9c. purpose habits and the elimination track ---------- */
function realHabits(host){
  const hs = (S.habits || []).filter(h => !h.archived && !h.negative);
  const ranked = hs.filter(h => h.directnessRank).sort((a, b) => a.directnessRank - b.directnessRank);
  const rest = hs.filter(h => !h.directnessRank);
  const drops = lifeArray('habitsToDrop');
  const installing = hs.filter(h => h.installing);
  host.innerHTML = `<p class="faint dm-lede">List the habits that most directly promote the purpose, in order. Some habits are essential but not directly related — make the distinction and bias towards the direct ones. Position one habit at a time; within a year you will have several.</p>
    <ol class="fn-list">${ranked.map((h, i) => `<li><b>${esc(h.name)}</b> ${h.installing ? '<span class="chip on">installing</span>' : `<button class="btn sm ghost" data-hinst="${h.id}">install this one</button>`}
      <span class="fn-mv"><button class="tbtn" data-hup="${h.id}" ${i ? '' : 'disabled'}>▲</button><button class="tbtn" data-hdn="${h.id}" ${i < ranked.length - 1 ? '' : 'disabled'}>▼</button><button class="del-x inline" data-hout="${h.id}">×</button></span></li>`).join('') || '<li class="faint">No habit ranked yet.</li>'}</ol>
    ${installing.length > 1 ? '<p class="faint">The course’s rule: position one habit at a time — within a year you will have several. (It does not stop you.)</p>' : ''}
    ${rest.length && ranked.length < 10 ? `<div class="field"><label>Add one by how directly it promotes the purpose</label><select class="sel" id="hrAdd"><option value="">choose a habit…</option>${rest.map(h => `<option value="${h.id}">${esc(h.name)}</option>`).join('')}</select></div>` : ''}
    <h3 class="serif" style="margin-top:22px">The elimination track</h3>
    <p class="faint">A bad habit cannot simply be deleted; it has to be displaced by one that fills the same ecological niche. The course’s example: checking notifications, which seeks stimulation, replaced by checking your own notes to see whether a new insight has come up.</p>
    ${drops.map(x => `<article class="fn-goal"><div class="row between"><b class="serif">${esc(x.habit)}</b><button class="del-x inline" data-xdel="${x.id}">×</button></div>
      <div class="mono faint">what it gives: ${esc(x.whatItGives || '—')}${x.startAt ? ' · from ' + esc(fmtDate(x.startAt, 'short')) : ''}</div>
      ${x.replacement ? `<div>replaced by: <b>${esc(x.replacement)}</b></div>` : '<div class="faint">The course’s claim is that a bad habit cannot simply be deleted — it has to be displaced.</div>'}
      <div class="row" style="gap:6px"><input class="inp" data-xnote="${x.id}" placeholder="a note on how it is going" style="flex:1"><button class="btn sm ghost" data-xnotego="${x.id}">log</button></div>
      ${(x.log || []).slice(-3).map(l => `<div class="mono faint">${esc(fmtDate(l.at.slice(0, 10), 'short'))} — ${esc(l.note)}</div>`).join('')}</article>`).join('')}
    <details><summary class="btn sm">Add one to stop</summary><div class="stack" style="margin-top:8px">
      <input class="inp" id="xH" placeholder="the habit to stop (e.g. checking notifications)">
      <input class="inp" id="xG" placeholder="what it gives you — stimulation, comfort, escape">
      <input class="inp" id="xR" placeholder="the replacement that fills the same niche (e.g. checking my own notes for a new insight)">
      <input class="inp" id="xS" type="date" value="${today()}"><button class="btn primary" id="xAdd">Add</button></div></details>`;
  const q = s => host.querySelector(s), byIdH = id => (S.habits || []).find(h => h.id === id);
  const renumber = () => { ranked.forEach((h, i) => h.directnessRank = i + 1); };
  host.querySelectorAll('[data-hup]').forEach(b => b.onclick = () => { const i = ranked.findIndex(h => h.id === b.dataset.hup); [ranked[i - 1], ranked[i]] = [ranked[i], ranked[i - 1]]; renumber(); saveNow(); rerender(); });
  host.querySelectorAll('[data-hdn]').forEach(b => b.onclick = () => { const i = ranked.findIndex(h => h.id === b.dataset.hdn); [ranked[i + 1], ranked[i]] = [ranked[i], ranked[i + 1]]; renumber(); saveNow(); rerender(); });
  host.querySelectorAll('[data-hout]').forEach(b => b.onclick = () => { const h = byIdH(b.dataset.hout); h.directnessRank = null; h.installing = false; ranked.splice(ranked.indexOf(h), 1); renumber(); saveNow(); rerender(); });
  host.querySelectorAll('[data-hinst]').forEach(b => b.onclick = () => { byIdH(b.dataset.hinst).installing = true; saveNow(); rerender(); });
  if(q('#hrAdd')) q('#hrAdd').onchange = () => { const h = byIdH(q('#hrAdd').value); if(h){ h.directnessRank = ranked.length + 1; saveNow(); rerender(); } };
  if(q('#xAdd')) q('#xAdd').onclick = () => { const h = q('#xH').value.trim(); if(!h){ toast('Name the habit first.'); return; }
    drops.push({id: uid(), habit: h, whatItGives: q('#xG').value.trim(), replacement: q('#xR').value.trim(), startAt: q('#xS').value, log: [], at: new Date().toISOString()}); saveNow(); rerender(); };
  host.querySelectorAll('[data-xdel]').forEach(b => b.onclick = () => { const x = drops.find(y => y.id === b.dataset.xdel); requestDelete({label: x.habit, node: b.closest('.fn-goal'), remove: () => spliceOut(S.habitsToDrop, y => y.id === x.id), after: () => rerender()}); });
  host.querySelectorAll('[data-xnotego]').forEach(b => b.onclick = () => { const x = drops.find(y => y.id === b.dataset.xnotego); const t = host.querySelector(`[data-xnote="${x.id}"]`).value.trim(); if(!t) return; (x.log = x.log || []).push({at: new Date().toISOString(), note: t}); saveNow(); rerender(); });
}

/* ---------- 9d. small bets ---------- */
const BET_VERDICTS = [['mine', 'this is mine'], ['not-mine', 'this is not mine'], ['mine-wrong-medium', 'this is mine, but not as the medium I tried'], ['untested', 'the bet did not actually test the hypothesis']];
const BET_READS = [['yes', 'leaning yes'], ['no', 'leaning no'], ['unknown', 'cannot tell yet']];
const betsAll = () => lifeArray('bets');
function betNew(o){
  const start = o.startAt || today();
  const b = {id: uid(), title: o.title.trim(), hypothesis: (o.hypothesis || '').trim(), purposeRef: o.purposeRef || [], valueIds: [], strengthIds: [],
    startAt: start, plannedEndAt: o.plannedEndAt || addDays(start, 56), listId: o.listId || null, logs: [], verdicts: [], decisionId: null, nextCheck: addDays(start, 7), at: new Date().toISOString(), updatedAt: new Date().toISOString()};
  betsAll().push(b); saveNow(); return b;
}
const betVerdict = b => (b.verdicts || []).length ? b.verdicts[b.verdicts.length - 1] : null;
const betOpen = () => betsAll().filter(b => !betVerdict(b));
function realBets(host){
  const open = betOpen(), shut = betsAll().filter(b => betVerdict(b));
  host.innerHTML = `<p class="faint dm-lede">A bet is a one-to-two month project to test the water for going deeper into the purpose. It must align with the sheet. You are testing for passion, not trying to create a breakthrough — and not to be seduced by success. Its success criterion is information, not output.</p>
    <div class="row"><button class="btn primary" id="btNew">A new bet</button></div>
    ${open.map(b => { const lg = (b.logs || []).slice(-1)[0]; const over = b.plannedEndAt < today();
      return `<article class="fn-goal"><div class="row between"><b class="serif">${esc(b.title)}</b><span class="mono faint">${esc(fmtDate(b.startAt, 'short'))} → ${esc(fmtDate(b.plannedEndAt, 'short'))}</span></div>
        <p style="margin:4px 0">${esc(b.hypothesis)}</p>
        <div class="mono faint">tests: ${b.purposeRef.length ? b.purposeRef.map(k => esc(PURPOSE_FIELDS[k] ? PURPOSE_FIELDS[k].short : k)).join(', ') : 'nothing named yet — not yet put to the sheet'}${lg ? ` · last read: ${esc((BET_READS.find(r => r[0] === lg.read) || [, ''])[1])}` : ''}${over ? ' · the bet was planned to end on this date' : ''}</div>
        <div class="row" style="gap:6px;margin-top:6px"><button class="btn sm" data-betlog="${b.id}">this week’s note</button><button class="btn sm ghost" data-betclose="${b.id}">close it with a verdict</button></div></article>`; }).join('') || '<div class="empty">No bet in progress.</div>'}
    ${shut.length ? `<h3 class="serif" style="margin-top:20px">The search so far</h3><p class="faint">Closed bets stay, with their verdicts — the trail of the search, and the reasoning in it.</p>
      ${shut.map(b => { const v = betVerdict(b); return `<article class="fn-goal"><b class="serif">${esc(b.title)}</b> <span class="mono faint">${esc((BET_VERDICTS.find(x => x[0] === v.call) || [, v.call])[1])} · ${esc(fmtDate(v.at.slice(0, 10), 'short'))}</span>
        <div class="faint">${esc(b.hypothesis)}</div>${v.why ? `<div>${esc(v.why)}</div>` : ''}</article>`; }).join('')}` : ''}`;
  host.querySelector('#btNew').onclick = () => betCreate();
  host.querySelectorAll('[data-betlog]').forEach(b => b.onclick = () => betLog(b.dataset.betlog));
  host.querySelectorAll('[data-betclose]').forEach(b => b.onclick = () => betClose(b.dataset.betclose));
}
function betCreate(){
  const lists = typeof planLists === 'function' ? planLists().filter(l => !l.archivedAt) : [];
  const m = openModal(`<h2>A small bet</h2>
    <div class="field"><label>What is it?</label><input class="inp" id="btT" autofocus placeholder="e.g. six short videos on one idea"></div>
    <div class="field"><label>The passion hypothesis, in one sentence</label><input class="inp" id="btH" placeholder="I will love making these for their own sake"></div>
    <div class="field"><label>Which parts of the sheet does it test?</label><div class="deps">${PURPOSE_KEYS.filter(purposeHas).map(k => `<button class="chip" data-btref="${k}">${esc(PURPOSE_FIELDS[k].short)}</button>`).join('') || '<span class="faint">nothing is written on the sheet yet</span>'}</div></div>
    <div class="grid c2" style="gap:10px"><div class="field"><label>Starts</label><input class="inp" type="date" id="btS" value="${today()}"></div><div class="field"><label>Planned end</label><input class="inp" type="date" id="btE" value="${addDays(today(), 56)}"></div></div>
    <div class="mono faint" id="btWarn"></div>
    ${lists.length ? `<div class="field"><label>The Planning list holding the work (optional)</label><select class="sel" id="btL"><option value="">—</option>${lists.map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join('')}</select></div>` : ''}
    <label class="row" style="gap:8px"><input type="checkbox" id="btD" checked> <span>file a Decision for it, graded at the end of the bet</span></label>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="btGo">Begin the bet</button></div>`);
  const refs = new Set(); m.querySelectorAll('[data-btref]').forEach(c => c.onclick = () => { refs.has(c.dataset.btref) ? refs.delete(c.dataset.btref) : refs.add(c.dataset.btref); c.classList.toggle('on'); });
  const warn = () => { const d = daysBetween(m.querySelector('#btS').value, m.querySelector('#btE').value); m.querySelector('#btWarn').textContent = d > 62 ? `${d} days. A bet is one to two months because it is a test; a longer one becomes the thing itself. (Not blocked.)` : ''; };
  m.querySelector('#btE').onchange = warn; m.querySelector('#btS').onchange = warn;
  m.querySelector('#btGo').onclick = () => {
    const t = m.querySelector('#btT').value.trim(); if(!t){ toast('Name the bet first.'); return; }
    const b = betNew({title: t, hypothesis: m.querySelector('#btH').value, purposeRef: [...refs], startAt: m.querySelector('#btS').value, plannedEndAt: m.querySelector('#btE').value, listId: m.querySelector('#btL')?.value || null});
    if(m.querySelector('#btD').checked){
      const e = lifeEntryNew({type: 'decision', title: 'Small bet: ' + t, body: b.hypothesis, extra: {situation: 'A small bet to test the water for going deeper into the purpose.', options: '', chosen: t, reasoning: b.hypothesis,
        expected: 'I will learn whether this is mine.', worry: 'I mistake the pleasure of a success for passion.', reviewOn: b.plannedEndAt, reviewedAt: '', confidence: 'unsure', betId: b.id}});
      b.decisionId = e.id; saveNow();
    }
    m.remove(); sound('success'); rerender();
  };
}
function betLog(id){
  const b = byId(betsAll(), id); if(!b) return;
  const m = openModal(`<h2>${esc(b.title)} — this week</h2>
    <div class="field"><label>What did you make?</label><textarea class="ta" id="blM" rows="2"></textarea></div>
    <div class="field"><label>What did it feel like to make it?</label><textarea class="ta" id="blF" rows="2"></textarea></div>
    <div class="field"><label>Your current read on the hypothesis</label><div class="row" style="gap:6px">${BET_READS.map(([k, n]) => `<button class="chip" data-blr="${k}">${n}</button>`).join('')}</div>
      <div class="mono faint">“cannot tell yet” is a postponement, not an answer — it moves the next check out by a week.</div></div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="blGo">Keep it</button></div>`);
  let read = ''; m.querySelectorAll('[data-blr]').forEach(c => c.onclick = () => { read = c.dataset.blr; m.querySelectorAll('[data-blr]').forEach(x => x.classList.toggle('on', x === c)); });
  m.querySelector('#blGo').onclick = () => { if(!read){ toast('Choose a read, even “cannot tell yet”.'); return; }
    const made = m.querySelector('#blM').value.trim(), felt = m.querySelector('#blF').value.trim();
    const e = lifeEntryNew({type: 'betlog', title: b.title, body: [made && 'Made: ' + made, felt && 'It felt like: ' + felt].filter(Boolean).join('\n'), tags: ['bet'], extra: {betId: b.id, made, felt, read}});
    (b.logs = b.logs || []).push({at: new Date().toISOString(), made, felt, read, entryId: e.id});
    b.nextCheck = addDays(today(), 7); b.updatedAt = new Date().toISOString(); saveNow(); m.remove(); sound('success'); rerender(); };
}
function betClose(id){
  const b = byId(betsAll(), id); if(!b) return;
  const m = openModal(`<h2>${esc(b.title)} — the verdict</h2><p class="faint">${esc(b.hypothesis)}</p>
    <div class="stack" style="gap:6px">${BET_VERDICTS.map(([k, n]) => `<button class="btn ghost" style="text-align:left" data-bv="${k}">${n}</button>`).join('')}</div>
    <div class="field" style="margin-top:10px"><label>What did this tell you about yourself?</label><textarea class="ta" id="bvW" rows="3"></textarea></div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="bvGo">Close the bet</button></div>`);
  let call = ''; m.querySelectorAll('[data-bv]').forEach(c => c.onclick = () => { call = c.dataset.bv; m.querySelectorAll('[data-bv]').forEach(x => x.classList.toggle('on', x === c)); });
  m.querySelector('#bvGo').onclick = () => { if(!call){ toast('Choose one of the four.'); return; }
    const why = m.querySelector('#bvW').value.trim();
    const e = lifeEntryNew({type: 'reflection', title: 'What the bet showed: ' + b.title, body: why, tags: ['bet']});
    (b.verdicts = b.verdicts || []).push({id: uid(), at: new Date().toISOString(), call, why, entryId: e.id}); b.closedAt = today(); b.updatedAt = new Date().toISOString();
    saveNow(); m.remove(); sound('success');
    if(call === 'mine'){
      const m2 = openModal(`<h2>This one is yours</h2><p class="faint">Three things you might do with that — each offered, none done for you.</p>
        <div class="stack" style="gap:6px"><button class="btn ghost" id="bmV">write a vision from it</button><button class="btn ghost" id="bmS">add it to the sheet as a niche candidate</button></div>`, 'narrow');
      m2.querySelector('#bmV').onclick = () => { const v = visionNew(b.title); v.purposeRef = b.purposeRef.slice(); v.links.bets.push(b.id); saveNow(); m2.remove(); navigate('#/purpose/vision/' + v.id); };
      m2.querySelector('#bmS').onclick = () => { purposeState().niche.push({text: b.title, at: new Date().toISOString(), source: b.id}); saveNow(); m2.remove(); toast('A niche candidate, on the sheet.'); rerender(); };
    } else rerender();
  };
}
/* a bet past its planned end with no verdict: a flag, never "overdue" */
function pqBets(T){
  return betOpen().filter(b => b.plannedEndAt && b.plannedEndAt < T).map(b => ({id: 'bet:' + b.id, source: 'new', category: 'flag', rank: PQ_RANK.flag, period: 'week',
    msg: `“${b.title}” has no verdict yet.`, rule: `the bet was planned to end on ${fmtDate(b.plannedEndAt, 'short')}`, go: ['close it', () => betClose(b.id)]}));
}
function betWeekStep(){
  const open = betOpen(); if(!open.length) return [];
  return [{title: 'The small bets.', hint: 'What you made, how it felt, your read. Skipping is fine.',
    body: () => open.map(b => `<div class="rev-summary"><b>${esc(b.title)}</b> <span class="faint">${esc(b.hypothesis)}</span> <button class="btn sm ghost" data-betlogw="${b.id}">a note</button></div>`).join(''),
    bind: bx => bx.querySelectorAll('[data-betlogw]').forEach(x => x.onclick = () => betLog(x.dataset.betlogw))}];
}
