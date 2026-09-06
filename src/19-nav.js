/* ============================================================
   NAVIGATION — two zones (Present / Becoming) + standalone pages
   Rendered from S.settings.nav so the user can move pages between
   zones in Settings. Page content is untouched; routes are unchanged.
   ============================================================ */
const NAV_PAGES = {
  today:    {label:'Today',       ico:'🏠', route:'#/today'},
  journals: {label:'Journal',     ico:'📖', route:'#/journals'},
  projects: {label:'Projects',    ico:'🎨', route:'#/projects'},
  rituals:  {label:'Rituals',     ico:'✨', route:'#/rituals'},
  values:   {label:'Compass',     ico:'🧭', route:'#/values'},
  skills:   {label:'Skill Tree',  ico:'🛠', route:'#/skills'},
  vision:   {label:'Vision Tree', ico:'🌳', route:'#/vision'},
  timeline: {label:'Memory',      ico:'⏳', route:'#/timeline'},
  library:  {label:'Library',     ico:'📚', route:'#/journals/quote'},
  map:      {label:'System Map',  ico:'🗺', route:'#/map'},
};
const NAV_DEFAULT = { present:['today','journals','projects','rituals'], becoming:['values','skills','vision','timeline'], standalone:['library','map'] };
const NAV_ZONES = [ {id:'present', label:'Present', hint:'short-term, daily use', accent:'var(--sage)'}, {id:'becoming', label:'Becoming', hint:'identity, growth', accent:'var(--ment)'} ];
const MOBILE_PRIMARY = ['today','journals','values','skills','vision'];
function navConfig(){ if(!S.settings.nav) S.settings.nav = JSON.parse(JSON.stringify(NAV_DEFAULT)); const n = S.settings.nav; const placed = new Set([...n.present, ...n.becoming, ...n.standalone]); Object.keys(NAV_PAGES).forEach(k => { if(k !== 'home' && !placed.has(k)) n.standalone.push(k); }); ['present','becoming','standalone'].forEach(z => n[z] = n[z].filter(k => NAV_PAGES[k] && k !== 'home')); return n; }
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch(e){ return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} };
function activePageKey(){ const {name, params} = parseHash(); if(name === 'journals' && params[0] === 'quote') return 'library'; return {stage:'timeline', value:'values', home:'home'}[name] || name; }
function navLink(key, zoneAccent){ const p = NAV_PAGES[key]; return `<a href="${p.route}" data-page="${key}" data-tip="${esc(p.label)}" style="--z:${zoneAccent||'var(--terra)'}"><span class="ico">${p.ico}</span><span class="lbl">${esc(p.label)}</span></a>`; }
function renderNav(){
  const n = navConfig(); const collapsedZones = lsGet('navZoneCollapsed', {}); const sbCollapsed = lsGet('sidebarCollapsed', false);
  document.documentElement.classList.toggle('sb-collapsed', !!sbCollapsed);
  const sb = $('#sidebar');
  sb.innerHTML = `<div class="brand"><a href="#/home" class="mark" data-tip="Home" title="Home">生</a><a href="#/home" class="name">Life Instrument</a><button class="sb-toggle" id="sbToggle" title="${sbCollapsed?'Expand sidebar':'Collapse sidebar'}">${sbCollapsed?'»':'«'}</button></div>
    <nav class="nav" id="nav">
      ${navLink('home','var(--terra)').replace('data-page="home"','data-page="home"')}
      ${NAV_ZONES.map(z => `<div class="zone ${collapsedZones[z.id]?'collapsed':''}" data-zone="${z.id}" style="--z:${z.accent}"><button class="zone-h" data-zoneh="${z.id}" title="${esc(z.hint)}"><span class="zone-lbl">${esc(z.label)}</span><span class="zone-chev">›</span></button><div class="zone-pages">${n[z.id].map(k => navLink(k, z.accent)).join('')}</div></div>`).join('')}
      <div class="nav-sep"></div>
      ${n.standalone.map(k => navLink(k, 'var(--terra)')).join('')}
    </nav>
    <nav class="nav settings-link"><a href="#/settings" data-page="settings" data-tip="Settings" style="--z:var(--terra)"><span class="ico">⚙</span><span class="lbl">Settings</span></a></nav>`;
  sb.querySelector('#sbToggle').onclick = () => { lsSet('sidebarCollapsed', !lsGet('sidebarCollapsed', false)); renderNav(); };
  sb.querySelectorAll('[data-zoneh]').forEach(b => b.onclick = () => { const c = lsGet('navZoneCollapsed', {}); c[b.dataset.zoneh] = !c[b.dataset.zoneh]; lsSet('navZoneCollapsed', c); renderNav(); });
  // mobile bottom bar
  let mb = $('#mobileNav'); if(!mb){ mb = el('<nav class="mobile-nav" id="mobileNav"></nav>'); document.body.appendChild(mb); }
  mb.innerHTML = MOBILE_PRIMARY.map(k => { const p = NAV_PAGES[k]; return `<a href="${p.route}" data-page="${k}"><span class="ico">${p.ico}</span><span class="lbl">${esc(p.label)}</span></a>`; }).join('') + `<button id="mobileMore" data-page="more"><span class="ico">⋯</span><span class="lbl">More</span></button>`;
  mb.querySelector('#mobileMore').onclick = openNavOverlay;
  markActiveNav();
}
function markActiveNav(){ const key = activePageKey(); $$('#sidebar a[data-page], #mobileNav a[data-page]').forEach(a => a.classList.toggle('active', a.dataset.page === key)); }
function openNavOverlay(){
  const n = navConfig(); const key = activePageKey();
  const ov = el(`<div class="nav-overlay" id="navOverlay"><button class="close" aria-label="close">×</button><div class="nav-overlay-inner">
    <a href="#/home" class="ov-link ${key==='home'?'active':''}" style="--z:var(--terra)"><span class="ico">${NAV_PAGES.home?.ico||'⌂'}</span>Home</a>
    ${NAV_ZONES.map(z => `<div class="ov-zone" style="--z:${z.accent}"><div class="ov-zone-h">${esc(z.label)} <span class="mono">${esc(z.hint)}</span></div>${n[z.id].map(k => `<a href="${NAV_PAGES[k].route}" class="ov-link ${key===k?'active':''}"><span class="ico">${NAV_PAGES[k].ico}</span>${esc(NAV_PAGES[k].label)}</a>`).join('')}</div>`).join('')}
    <div class="ov-zone" style="--z:var(--terra)"><div class="ov-zone-h">Always</div>${n.standalone.map(k => `<a href="${NAV_PAGES[k].route}" class="ov-link ${key===k?'active':''}"><span class="ico">${NAV_PAGES[k].ico}</span>${esc(NAV_PAGES[k].label)}</a>`).join('')}<a href="#/settings" class="ov-link ${key==='settings'?'active':''}"><span class="ico">⚙</span>Settings</a></div>
  </div></div>`);
  document.body.appendChild(ov); ov.querySelector('.close').onclick = () => ov.remove(); ov.querySelectorAll('a').forEach(a => a.addEventListener('click', () => ov.remove()));
}
NAV_PAGES.home = {label:'Home', ico:'⌂', route:'#/home'};

/* ---------- Home dashboard: one summary card per zone, counts read from the database on mount ---------- */
routes.home = function(root){
  const T = today(); const n = navConfig();
  root.innerHTML = `<div class="page narrow"><div class="page-head"><h1>${fmtDate(T)}</h1><div class="sub">The porch. One card per zone; walk into whichever room needs you.</div></div><div class="stack" id="homeCards"><div class="empty">Reading the house…</div></div></div>`;
  (async () => {
    let entries=[], nods=[], projects=[], snaps=[], skills=[], visions=[], habits=[], habitLog=[], checkins=[], reminders=[];
    try { [entries, nods, projects, snaps, skills, visions, habits, habitLog, checkins, reminders] = await Promise.all(['entries','nods','projects','valueSnapshots','skills','visions','habits','habitLog','checkins','reminders'].map(t => db[t].toArray())); } catch(e){ entries=S.entries; nods=S.nods; projects=S.projects; snaps=S.valueSnapshots; skills=S.skills; visions=S.visions; habits=S.habits; habitLog=Object.entries(S.habitLog).map(([day,log])=>({day,log})); checkins=Object.entries(S.checkins).map(([day,v])=>({day,...v})); reminders=S.reminders||[]; }
    const todayEntries = entries.filter(e => (e.createdAt||'').slice(0,10) === T).length + nods.filter(x => x.date === T).length;
    const active = projects.filter(p => p.status === 'active').length;
    const due = habits.filter(h => !h.archived && !h.negative && habitDue(h, T)); const todayLog = habitLog.find(r => r.day === T)?.log || {}; const done = due.filter(h => todayLog[h.id]).length;
    const checked = checkins.some(c => c.day === T && c.mood); const dueRem = reminders.filter(r => !r.done && r.date <= T).length;
    const lastSnap = [...snaps].sort((a,b)=>a.date<b.date?1:-1)[0]; const snapDays = lastSnap ? daysSince(lastSnap.date) : null;
    const dueSkills = skills.filter(s => s.targetDate && daysBetween(T, s.targetDate) <= 30 && daysBetween(T, s.targetDate) >= 0 && s.level < s.target);
    const wither = visions.filter(v => v.confidence !== 'lived' && vividness(v).lastTended > 60).length;
    const memories = entries.filter(e => e.type === 'memory').length; const quotes = entries.filter(e => e.type === 'quote').length;
    const card = (z, lines, links) => `<div class="card home-card rv" style="--z:${z.accent}"><div class="row between"><h3 style="margin:0">${esc(z.label)}</h3><span class="mono">${esc(z.hint)}</span></div><div class="home-lines">${lines.map(l=>`<div>${l}</div>`).join('')}</div><div class="row" style="margin-top:12px">${links.map(k=>`<a class="chip click on" style="--c:${z.accent}" href="${NAV_PAGES[k].route}">${NAV_PAGES[k].ico} ${esc(NAV_PAGES[k].label)}</a>`).join('')}</div></div>`;
    $('#homeCards').innerHTML =
      card(NAV_ZONES[0], [`<b>${todayEntries}</b> item${todayEntries===1?'':'s'} logged today · <b>${active}</b> active project${active===1?'':'s'}`, `${checked?'Checked in':'<span style="color:var(--gold)">Not yet checked in</span>'} · habit rings <b>${done}/${due.length}</b>${dueRem?` · <b>${dueRem}</b> reminder${dueRem===1?'':'s'} waiting`:''}`], n.present) +
      card(NAV_ZONES[1], [`Last snapshot <b>${snapDays===null?'never':snapDays===0?'today':snapDays+' days ago'}</b> · <b>${dueSkills.length}</b> skill milestone${dueSkills.length===1?'':'s'} due within 30 days`, `<b>${visions.filter(v=>v.confidence!=='lived').length}</b> visions growing${wither?`, <span style="color:var(--gold)">${wither} withering</span>`:''} · <b>${memories}</b> memories kept`], n.becoming) +
      card({label:'Always', hint:'reference', accent:'var(--terra)'}, [`<b>${quotes}</b> quotes in the library · the system map shows what needs tending`], n.standalone);
    reveal($('#homeCards')); $$('#homeCards .rv').forEach(x => x.classList.add('in'));
  })();
};

/* ---------- Settings: drag-and-drop zone editor ---------- */
function zoneEditorHTML(){ const n = navConfig(); const col = (id, label, keys, accent) => `<div class="zone-col" data-zcol="${id}" style="--z:${accent}"><div class="sc" style="color:${accent}">${label}</div>${keys.map(k => `<div class="zone-item" draggable="true" data-zitem="${k}"><span class="ico">${NAV_PAGES[k].ico}</span>${esc(NAV_PAGES[k].label)}<span class="mono">⋮</span></div>`).join('')||'<div class="faint" style="font-size:.75rem;padding:6px">drop pages here</div>'}</div>`;
  return `<div class="zone-editor" id="zoneEditor">${col('present','Present',n.present,'var(--sage)')}${col('becoming','Becoming',n.becoming,'var(--ment)')}${col('standalone','Always',n.standalone,'var(--terra)')}</div><div class="row" style="margin-top:10px"><button class="btn sm ghost" id="zoneReset">reset to default</button></div>`; }
function bindZoneEditor(root){
  let dragKey = null; const n = navConfig();
  root.querySelectorAll('.zone-item').forEach(it => { it.addEventListener('dragstart', () => { dragKey = it.dataset.zitem; it.classList.add('dragging'); }); it.addEventListener('dragend', () => it.classList.remove('dragging')); });
  root.querySelectorAll('.zone-col').forEach(col => { col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('over'); }); col.addEventListener('dragleave', () => col.classList.remove('over')); col.addEventListener('drop', e => { e.preventDefault(); col.classList.remove('over'); if(!dragKey) return; ['present','becoming','standalone'].forEach(z => n[z] = n[z].filter(k => k !== dragKey)); const target = col.dataset.zcol; const after = e.target.closest('.zone-item')?.dataset.zitem; const arr = n[target]; const i = after ? arr.indexOf(after) : -1; if(i >= 0) arr.splice(i, 0, dragKey); else arr.push(dragKey); dragKey = null; saveNow(); renderNav(); rerender(); }); });
  root.querySelector('#zoneReset').onclick = () => { S.settings.nav = JSON.parse(JSON.stringify(NAV_DEFAULT)); saveNow(); renderNav(); rerender(); };
}
