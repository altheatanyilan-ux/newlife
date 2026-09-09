/* ============================================================
   NAVIGATION — two zones (Present / Becoming) + standalone pages
   Rendered from S.settings.nav so the user can move pages between
   zones in Settings. Page content is untouched; routes are unchanged.
   ============================================================ */
/* thin line icons, 24×24, drawn in currentColor */
const NAV_ICONS = {
  /* A rose, not a ring: Values is already a needle inside a circle, and at
     24px the two would read as the same object. This one is the star alone —
     four long points to the cardinals, four short ones between, and the north
     point left open so the eye knows which way is up. */
  compass:  '<svg viewBox="0 0 24 24"><path d="M12 2.5 13.6 10.4 21.5 12 13.6 13.6 12 21.5 10.4 13.6 2.5 12 10.4 10.4Z"/><path d="m6.6 6.6 3.2 3.2M17.4 6.6l-3.2 3.2M17.4 17.4l-3.2-3.2M6.6 17.4l3.2-3.2"/><path d="M12 2.5 10.4 10.4"/></svg>',
  home:     '<svg viewBox="0 0 24 24"><path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10.5V19h11v-8.5"/><path d="M10.5 19v-4.5h3V19"/></svg>',
  today:    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></svg>',
  journals: '<svg viewBox="0 0 24 24"><path d="M12 6.5c-1.6-1.4-3.8-1.8-7-1.5v13c3.2-.3 5.4.1 7 1.5 1.6-1.4 3.8-1.8 7-1.5V5c-3.2-.3-5.4.1-7 1.5Z"/><path d="M12 6.5v13"/></svg>',
  /* the village stepping up the slope, which is what the Projects room is
     painted as — three roofs rising, each one a thing being built */
  projects: '<svg viewBox="0 0 24 24"><path d="M2.5 20.5h19"/><path d="M3 17.5v-3l3-2.4 3 2.4v3"/><path d="M9.5 17.5v-4.6l3.2-2.6 3.2 2.6v4.6"/><path d="M16.4 17.5v-6.3L19 9.2l2.3 1.9v6.4"/><path d="M6 17.5v-2.2M12.7 17.5v-2.6M19 17.5v-2.8"/></svg>',
  rituals:  '<svg viewBox="0 0 24 24"><path d="M12 3.5c1.4 2.2 4.5 4.6 4.5 8.4a4.5 4.5 0 0 1-9 0c0-1.6.6-2.9 1.4-4 .3 1 .9 1.8 1.6 2.2.6-2.6.4-4.8 1.5-6.6Z"/><path d="M7 20.5h10"/></svg>',
  values:   '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2.2 5.2-4.8 1.8 2.2-5.2z"/><path d="M12 3.5v1.5M12 19v1.5M3.5 12H5M19 12h1.5"/></svg>',
  skills:   '<svg viewBox="0 0 24 24"><path d="M12 20.5V9"/><path d="M12 13c-2.8 0-4.6-1.6-5-4 2.8-.2 4.6 1.2 5 4Z"/><path d="M12 10c.4-2.8 2.2-4.2 5-4-.4 2.4-2.2 4-5 4Z"/><path d="M12 16.5c-2.2 0-3.8-1.2-4.2-3.3 2.2-.2 3.8.9 4.2 3.3Z"/></svg>',
  vision:   '<svg viewBox="0 0 24 24"><path d="M12 21v-6"/><path d="M12 15c-3.9 0-6.5-2.3-6.5-5.4 0-1.6.8-3 2.1-3.8C8 3.6 9.8 2.5 12 2.5s4 1.1 4.4 3.3c1.3.8 2.1 2.2 2.1 3.8 0 3.1-2.6 5.4-6.5 5.4Z"/></svg>',
  timeline: '<svg viewBox="0 0 24 24"><path d="M7 3.5h10M7 20.5h10"/><path d="M8.5 3.5v2.8c0 2.3 3.5 3.6 3.5 5.7s-3.5 3.4-3.5 5.7v2.8M15.5 3.5v2.8c0 2.3-3.5 3.6-3.5 5.7s3.5 3.4 3.5 5.7v2.8"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><path d="M4 7.5h9M17 7.5h3M4 16.5h3M11 16.5h9"/><circle cx="15" cy="7.5" r="2"/><circle cx="9" cy="16.5" r="2"/></svg>',
  needs:    '<svg viewBox="0 0 24 24"><path d="M12 3.5 21 20H3Z"/><path d="M7.6 12.5h8.8M9.5 8.5h5"/></svg>',
  more:     '<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/></svg>',
  reviews:  '<svg viewBox="0 0 24 24"><path d="M12 4.5a7.5 7.5 0 1 1-7.3 9.2"/><path d="M4.5 8.2 4.7 13l4.6-1.1"/><path d="M12 8.5v4l2.8 1.6"/></svg>',
  rhythm:   '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M7.5 13h3.5v4H7.5z"/><path d="M13.5 13h3"/></svg>',
  plan:     '<svg viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="14" rx="2.5"/><path d="M3.5 10h17M8.5 3.5v4M15.5 3.5v4"/><path d="M7.5 13.5h3M7.5 16.5h6"/></svg>',
  calendar: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><circle cx="8.5" cy="13.5" r="1"/><circle cx="12" cy="13.5" r="1"/><circle cx="15.5" cy="13.5" r="1"/><circle cx="8.5" cy="16.8" r="1"/><circle cx="12" cy="16.8" r="1"/></svg>',
  writing:  '<svg viewBox="0 0 24 24"><path d="M4.5 19.5 5.7 15 16 4.7a2 2 0 0 1 2.8 2.8L8.5 17.8Z"/><path d="M14.2 6.5 17 9.3"/><path d="M4.5 21h15"/></svg>',
  people:   '<svg viewBox="0 0 24 24"><circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="16.8" cy="9.5" r="2.4"/><path d="M15 14.9c3 .2 5.5 1.9 5.5 4.6"/></svg>',
  board:    '<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="7" height="9" rx="1.5"/><rect x="13.5" y="4.5" width="7" height="5.5" rx="1.5"/><rect x="3.5" y="16" width="7" height="3.5" rx="1.5"/><rect x="13.5" y="12.5" width="7" height="7" rx="1.5"/></svg>',
  finance:  '<svg viewBox="0 0 24 24"><path d="M4 19V9M9.3 19V5.5M14.7 19v-8M20 19V7.5"/><path d="M3 21h18"/></svg>',
  commonplace:'<svg viewBox="0 0 24 24"><path d="M5 4.5h9a2.5 2.5 0 0 1 2.5 2.5v12.5H7.5A2.5 2.5 0 0 1 5 17Z"/><path d="M16.5 7H19v12.5H7.5"/><path d="M8 8.5h5.5M8 11.5h5.5"/></svg>',
  import:     '<svg viewBox="0 0 24 24"><rect x="3.5" y="13" width="17" height="7.5" rx="2"/><path d="M3.5 16h4l1.5 2h6l1.5-2h4"/><path d="M12 3.5v9M9.5 10l2.5 2.5L14.5 10"/></svg>',
};
/* labels match the h1 of the page they open; `short` is for the mobile bar only */
const NAV_PAGES = {
  today:    {label:'Today',            short:'Today',    ico:NAV_ICONS.today,    route:'#/today'},
  journals: {label:'Journals',         short:'Journal',  ico:NAV_ICONS.journals, route:'#/journals'},
  projects: {label:'Projects',         short:'Projects', ico:NAV_ICONS.projects, route:'#/projects'},
  writing:  {label:'Writing Studio',     short:'Writing', ico:NAV_ICONS.writing,  route:'#/writing'},
  people:   {label:'People',           short:'People',   ico:NAV_ICONS.people,   route:'#/people'},
  finance:  {label:'Finance',          short:'Money',    ico:NAV_ICONS.finance,  route:'#/finance'},
  commonplace:{label:'Library',        short:'Library',  ico:NAV_ICONS.commonplace, route:'#/commonplace'},
  values:   {label:'Values',           short:'Values',   ico:NAV_ICONS.values,   route:'#/values'},
  skills:   {label:'Skill Tree',       short:'Skills',   ico:NAV_ICONS.skills,   route:'#/skills'},
  timeline: {label:'Timeline',         short:'Timeline', ico:NAV_ICONS.timeline, route:'#/timeline'},
};
/* The daily rooms sit above the zones, unlabelled — you do not need a heading
   to tell you what Today is for. Writing Studio sits below everything,
   always, because it is where you go when the rest of the house is noise. */
const NAV_TOP = ['compass','today','journals'];
const NAV_PINNED = ['writing'];
const NAV_DEFAULT = {
  becoming:  ['values','skills','projects','finance','commonplace'],
  story:     ['people','timeline'],
  standalone:[],
};
const NAV_ZONES = [
  {id:'becoming', label:'Becoming', hint:'long-term growth, identity',       accent:'var(--ment)'},
  {id:'story',    label:'Story',    hint:'relationships, memory, meaning',   accent:'var(--rose)'},
];
const NAV_ZONE_IDS = [...NAV_ZONES.map(z => z.id), 'standalone'];
/* reachable by route, but never a sidebar entry: the Import Station is
   reached from inside Settings, not from a room of its own */
const NAV_UNLISTED = ['import'];
/* pages that are placed by hand and must never be swept into a zone */
const NAV_FIXED = new Set([...NAV_TOP, ...NAV_PINNED, ...NAV_UNLISTED]);
const MOBILE_PRIMARY = ['today','journals','projects','values','skills'];
function navConfig(){
  if(!S.settings.nav) S.settings.nav = JSON.parse(JSON.stringify(NAV_DEFAULT));
  const n = S.settings.nav;
  /* A nav saved under an older shape carries zones and pages that no longer
     exist. Rebuild it against the current one rather than trying to patch it:
     the arrangement is a preference, not data anybody would mourn. */
  const known = new Set(Object.keys(NAV_PAGES));
  const legacy = Object.keys(n).some(z => !NAV_ZONE_IDS.includes(z));
  if(legacy){ const keep = {}; NAV_ZONE_IDS.forEach(z => keep[z] = []);
    Object.entries(n).forEach(([z, list]) => { if(!Array.isArray(list)) return;
      const target = NAV_ZONE_IDS.includes(z) ? z : 'standalone';
      list.forEach(k => { if(known.has(k) && !NAV_FIXED.has(k)) keep[target].push(k); }); });
    NAV_ZONE_IDS.forEach(z => n[z] = keep[z]);
    Object.keys(n).forEach(z => { if(!NAV_ZONE_IDS.includes(z)) delete n[z]; });
  }
  NAV_ZONE_IDS.forEach(z => { if(!Array.isArray(n[z])) n[z] = [...(NAV_DEFAULT[z] || [])]; });
  /* drop anything unknown or hand-placed, and de-duplicate across zones */
  const seen = new Set();
  NAV_ZONE_IDS.forEach(z => { n[z] = n[z].filter(k => known.has(k) && !NAV_FIXED.has(k) && !seen.has(k) && seen.add(k)); });
  /* a page nobody placed still has to be reachable */
  Object.keys(NAV_PAGES).forEach(k => { if(!NAV_FIXED.has(k) && !seen.has(k)){ n.standalone.push(k); seen.add(k); } });
  return n;
}
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch(e){ return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} };
function activePageKey(){ const {name} = parseHash(); return {stage:'timeline', value:'values', home:'compass', rhythm:'today', lifetape:'today'}[name] || name; }
function navLink(key, zoneAccent){ const p = NAV_PAGES[key]; return `<a href="${p.route}" data-page="${key}" data-tip="${esc(p.label)}" style="--z:${zoneAccent||'var(--terra)'}"><span class="ico">${p.ico}</span><span class="lbl">${esc(p.label)}</span></a>`; }
function renderNav(){
  const n = navConfig(); const collapsedZones = lsGet('navZoneCollapsed', {}); const sbCollapsed = lsGet('sidebarCollapsed', false);
  document.documentElement.classList.toggle('sb-collapsed', !!sbCollapsed);
  const sb = $('#sidebar');
  sb.innerHTML = `<div class="brand"><a href="#/compass" class="mark" data-tip="Compass" title="Compass">生</a><a href="#/compass" class="name">Life Instrument</a><button class="sb-toggle" id="sbToggle" title="${sbCollapsed?'Expand sidebar':'Collapse sidebar'}">${sbCollapsed?'»':'«'}</button></div>
    <nav class="nav" id="nav">
      <div class="nav-top">${NAV_TOP.filter(k => NAV_PAGES[k]).map(k => navLink(k, 'var(--terra)')).join('')}</div>
      ${NAV_ZONES.map(z => `<div class="zone ${collapsedZones[z.id]?'collapsed':''}" data-zone="${z.id}" style="--z:${z.accent}"><button class="zone-h" data-zoneh="${z.id}" title="${esc(z.hint)}"><span class="zone-lbl">${esc(z.label)}</span><span class="zone-chev">›</span></button><div class="zone-pages">${n[z.id].map(k => navLink(k, z.accent)).join('')}</div></div>`).join('')}
      ${n.standalone.length ? `<div class="nav-sep"></div>${n.standalone.map(k => navLink(k, 'var(--terra)')).join('')}` : ''}
    </nav>
    <nav class="nav nav-foot">
      ${NAV_PINNED.filter(k => NAV_PAGES[k]).map(k => navLink(k, 'var(--terra)')).join('')}
      <a href="#/settings" data-page="settings" data-tip="Settings" style="--z:var(--terra)"><span class="ico">${NAV_ICONS.settings}</span><span class="lbl">Settings</span></a>
    </nav>`;
  sb.querySelector('#sbToggle').onclick = () => { lsSet('sidebarCollapsed', !lsGet('sidebarCollapsed', false)); renderNav(); };
  sb.querySelectorAll('[data-zoneh]').forEach(b => b.onclick = () => { const c = lsGet('navZoneCollapsed', {}); c[b.dataset.zoneh] = !c[b.dataset.zoneh]; lsSet('navZoneCollapsed', c); renderNav(); });
  // mobile bottom bar
  let mb = $('#mobileNav'); if(!mb){ mb = el('<nav class="mobile-nav" id="mobileNav"></nav>'); document.body.appendChild(mb); }
  mb.innerHTML = MOBILE_PRIMARY.map(k => { const p = NAV_PAGES[k]; return `<a href="${p.route}" data-page="${k}"><span class="ico">${p.ico}</span><span class="lbl">${esc(p.short||p.label)}</span></a>`; }).join('') + `<button id="mobileMore" data-page="more"><span class="ico">${NAV_ICONS.more}</span><span class="lbl">More</span></button>`;
  mb.querySelector('#mobileMore').onclick = openNavOverlay;
  markActiveNav();
}
function markActiveNav(){ const key = activePageKey(); $$('#sidebar a[data-page], #mobileNav a[data-page]').forEach(a => a.classList.toggle('active', a.dataset.page === key)); }
function openNavOverlay(){
  const n = navConfig(); const key = activePageKey();
  const ov = el(`<div class="nav-overlay" id="navOverlay"><button class="close" aria-label="close">×</button><div class="nav-overlay-inner">
    ${NAV_TOP.filter(k => NAV_PAGES[k]).map(k => `<a href="${NAV_PAGES[k].route}" class="ov-link ${key===k?'active':''}" style="--z:var(--terra)"><span class="ico">${NAV_PAGES[k].ico}</span>${esc(NAV_PAGES[k].label)}</a>`).join('')}
    ${NAV_ZONES.map(z => `<div class="ov-zone" style="--z:${z.accent}"><div class="ov-zone-h">${esc(z.label)} <span class="mono">${esc(z.hint)}</span></div>${n[z.id].map(k => `<a href="${NAV_PAGES[k].route}" class="ov-link ${key===k?'active':''}"><span class="ico">${NAV_PAGES[k].ico}</span>${esc(NAV_PAGES[k].label)}</a>`).join('')}</div>`).join('')}
    <div class="ov-zone" style="--z:var(--terra)"><div class="ov-zone-h">Always</div>${[...n.standalone, ...NAV_PINNED].filter(k => NAV_PAGES[k]).map(k => `<a href="${NAV_PAGES[k].route}" class="ov-link ${key===k?'active':''}"><span class="ico">${NAV_PAGES[k].ico}</span>${esc(NAV_PAGES[k].label)}</a>`).join('')}<a href="#/settings" class="ov-link ${key==='settings'?'active':''}"><span class="ico">${NAV_ICONS.settings}</span>Settings</a></div>
  </div></div>`);
  document.body.appendChild(ov); ov.querySelector('.close').onclick = () => ov.remove(); ov.querySelectorAll('a').forEach(a => a.addEventListener('click', () => ov.remove()));
}
NAV_PAGES.compass = {label:'Compass', short:'Compass', ico:NAV_ICONS.compass, route:'#/compass'};
NAV_PAGES.import = {label:'Import Station', short:'Import', ico:NAV_ICONS.import, route:'#/import'};   // reachable, but lives inside Settings now

/* ---------- Compass: life at a glance — today's focus, the living house, long-term panels ---------- */
/* which level of the hierarchy each room mostly feeds — the annotation the
   house carries, so the map and the pyramid are reading the same building */
const HOUSE_LEVEL = {today:1, finance:2, people:3, skills:4, projects:6, commonplace:5, journals:5, writing:4, values:7, timeline:5};
const HOUSE_EDGES = [['timeline','values','retrospective readings fill the values history'],['projects','skills','projects exercise skills'],['journals','timeline','memories become formative events'],['today','values','the biggest values gap is a daily signal'],['today','journals','the day is where most entries start'],['commonplace','journals','quotes are journal entries with a source'],['finance','projects','a project that earns is an income stream'],['people','timeline','the people in a chapter are part of it']];
function houseStats(){
  const T = today(); const n = navConfig();
  const due = S.habits.filter(h=>!h.archived&&!h.negative&&habitDue(h,T)); const done = due.filter(h=>habitDone(h,T)).length;
  const last = latestSnapshot(); const snapDays = last ? daysSince(last.date) : null; const gaps = valueGaps();
  const atro = S.skills.filter(s=>!s.planned && daysSince(skillLastPracticed(s))>90).length; const hrs30 = S.skills.reduce((n,s)=>n+entriesLinked('skills',s.id).filter(e=>daysSince(e.createdAt.slice(0,10))<=30).reduce((m,e)=>m+((+e.extra?.duration||0)/60),0),0);
  const active = S.projects.filter(p=>p.status==='active'); const nods7 = S.nods.filter(x=>daysSince(x.date)<=7).length; const cold = active.filter(p=>daysSince(projectNods(p)[0]?.date)>7).length;
  const j7 = S.entries.filter(e=>daysSince(e.createdAt.slice(0,10))<=7).length; const quotes = S.entries.filter(e=>e.type==='quote').length; const memories = S.entries.filter(e=>e.type==='memory').length;
  const c = S.checkins[T]; const rem = (S.reminders||[]).filter(r=>!r.done&&r.date<=T).length;
  const stat = {
    today:    {line:`${c?.mood?'checked in':'not checked in'} · rings ${done}/${due.length}`, ok:!!c?.mood, cadence:'daily', tip:`${c?.intention?'Intention: '+c.intention:'No intention set yet'}${rem?` · ${rem} reminder${rem>1?'s':''} waiting`:''}`},
    lifetape: {line:`${done}/${due.length} rings today`, ok:due.length>0&&done===due.length, cadence:'daily', tip:`${rehearsalDoneToday()?'Morning Theatre practised':'Morning Theatre not yet practised'} · weekly review ${relDays(daysSince(S.reviews.lastWeekly))}`},
    journals: {line:`${j7} entr${j7===1?'y':'ies'} this week`, ok:j7>0, cadence:'daily', tip:`${S.entries.length} entries across ${S.journals.length} journals`},
    projects: {line:`${active.length} active · ${nods7} nods / 7d`, ok:cold===0, cadence:'daily', tip:cold?`${cold} active project${cold>1?'s':''} without a nod this week`:'every active project nodded this week'},
    values:   {line:`snapshot ${snapDays===null?'never':snapDays===0?'today':snapDays+'d ago'}`, ok:snapDays!==null&&snapDays<=7, cadence:'weekly', tip:gaps[0]?`Biggest gap: ${gaps[0].name} (${gaps[0].gap>0?'+':''}${gaps[0].gap})`:''},
    skills:   {line:`${hrs30.toFixed(0)}h / 30d${atro?` · ${atro} atrophying`:''}`, ok:atro===0, cadence:'monthly', tip:`${S.skills.filter(s=>!s.planned).length} skills held, ${S.skills.filter(s=>s.planned).length} planned${milestonesDueSoon(30).length?` · ${milestonesDueSoon(30).length} milestone${milestonesDueSoon(30).length>1?'s':''} within 30 days`:''}`},
    timeline: {line:`${memories} memories · ${S.stages.length} stages`, ok:true, cadence:'archival', tip:'The museum of the past. Formative events and the story you tell.'},
    writing:  {line:`${S.entries.filter(e=>e.type==='writing').length} pieces`, ok:true, cadence:'weekly', tip:'A room for contemplation, fed by your own hashtags.'},
    commonplace:{line:`${S.entries.filter(e=>e.type==='media').length} works logged`, ok:true, cadence:'archival', tip:'What you read, watched and listened to — and what it changed.'},
    people:   (()=>{ const od = typeof peopleNeedingAttention === 'function' ? peopleNeedingAttention() : [];
      return {line:`${(S.people||[]).length} people${od.length?` · ${od.length} overdue`:''}`, ok:!od.length, cadence:'weekly', tip:'A life is mostly other people.'}; })(),
    finance:  (()=>{ const streams = typeof incomeStreamList==='function' ? incomeStreamList() : []; const tc = sum(streams.map(s=>s.income.current||0));
      return {line: streams.length ? `${money(tc)}/mo across ${streams.length} stream${streams.length===1?'':'s'}` : 'no income streams yet', ok:true, cadence:'monthly', tip:'Building ways to make money, and what enough looks like.'}; })(),
  };
  return {stat, due, done, last, snapDays, gaps, atro, hrs30, active, nods7, j7, quotes, memories, c, rem, /* the house colours its nodes by the zone each room sits in; the daily rooms
   at the top of the sidebar belong to no zone, so they answer 'present' */
    zonesOf: k => NAV_TOP.includes(k) ? 'present' : NAV_ZONE_IDS.find(z => (n[z]||[]).includes(k)) || 'always'};
}
function houseSVG(st){
  const n = navConfig(); const keys = NAV_ZONE_IDS.flatMap(z => n[z]).filter(k => NAV_PAGES[k] && st.stat[k]);
  const W = 760, H = 460, cx = W/2, cy = H/2, R = 170; const pos = {}; const zoneColor = k => { const z = st.zonesOf(k); return z==='present' ? 'var(--sage)' : z==='becoming' ? 'var(--ment)' : z==='story' ? 'var(--rose)' : 'var(--terra)'; };
  keys.forEach((k,i) => { const a = -Math.PI/2 + i*2*Math.PI/keys.length; pos[k] = [cx + Math.cos(a)*R, cy + Math.sin(a)*R]; });
  let g = '';
  HOUSE_EDGES.forEach(([a,b,label],i) => { if(!pos[a]||!pos[b]) return; const [x1,y1]=pos[a],[x2,y2]=pos[b]; const mx=(x1+x2)/2+(cx-(x1+x2)/2)*.25, my=(y1+y2)/2+(cy-(y1+y2)/2)*.25; g += `<path class="hedge" d="M${x1},${y1} Q${mx},${my} ${x2},${y2}" data-a="${a}" data-b="${b}" data-label="${esc(label)}"/>`; });
  g += `<circle cx="${cx}" cy="${cy}" r="30" fill="var(--surface-2)" stroke="var(--terra)" stroke-width="1.2"/><text x="${cx}" y="${cy-4}" text-anchor="middle" style="font-family:var(--han);font-size:22px;fill:var(--terra)">生</text><text x="${cx}" y="${cy+14}" text-anchor="middle" style="font-family:var(--mono);font-size:8px;fill:var(--faint)">${fmtDate(today(),'short').toUpperCase()}</text>`;
  keys.forEach(k => { const [x,y] = pos[k]; const s = st.stat[k]; const p = NAV_PAGES[k]; const r = s.cadence==='daily'?34:s.cadence==='weekly'?31:27;
    g += `<g class="hnode ${s.cadence}" data-node="${k}" data-go="${p.route}" style="--zc:${zoneColor(k)}"><circle class="body" cx="${x}" cy="${y}" r="${r}" fill="color-mix(in srgb,${zoneColor(k)} ${s.cadence==='daily'?22:s.cadence==='weekly'?14:8}%,var(--surface))" stroke="${zoneColor(k)}" stroke-width="1.4" ${s.cadence==='monthly'||s.cadence==='archival'?'stroke-dasharray="4 3"':''} opacity="${s.cadence==='archival'?.7:1}"/><text x="${x}" y="${y+6}" text-anchor="middle" style="font-size:${r*.6}px">${p.ico}</text><circle cx="${x+r*.7}" cy="${y-r*.7}" r="5" fill="${s.ok?'var(--sage)':'var(--gold)'}" stroke="var(--surface)" stroke-width="1.5"/><text class="hl" x="${x}" y="${y+r+16}" text-anchor="middle">${esc(p.label)}</text><text class="hs" x="${x}" y="${y+r+28}" text-anchor="middle">${esc(s.line)}</text>${HOUSE_LEVEL[k]?`<text class="hs" x="${x}" y="${y+r+38}" text-anchor="middle" opacity=".55">L${HOUSE_LEVEL[k]} ${esc((MASLOW.find(m=>m.level===HOUSE_LEVEL[k])||{}).short||'')}</text>`:''}</g>`; });
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${g}</svg>`;
}
/* ---------- the four zone cards on the Compass ----------
   One card per navigation zone, answering the question that zone exists
   for. Each line is a live count, and each card opens the room where you
   would act on it. */
function nextReviewLine(){
  const last = S.reviews?.lastWeekly; const d = last ? daysSince(last) : null;
  if(d === null) return ['no weekly review yet', 'var(--gold)'];
  if(d >= 7) return [`weekly review due${d > 8 ? ` · ${d - 7}d late` : ''}`, 'var(--gold)'];
  return [`next review in ${7 - d} day${7 - d === 1 ? '' : 's'}`, ''];
}
function zoneSummaries(){
  const T = today(); const st = houseStats();
  const cards = [];

  const tasks = typeof tasksForDay === 'function' ? tasksForDay(T) : [];
  const openTasks = tasks.filter(t => !t.done);
  const [revLine, revC] = nextReviewLine();
  cards.push({label:'Present', hint:'what is happening now', accent:'var(--sage)', route:'#/today',
    lines:[
      [openTasks.length ? `${openTasks.length} item${openTasks.length === 1 ? '' : 's'} still planned today` : (tasks.length ? 'everything planned today is done' : 'nothing planned today'), openTasks.length ? '' : (tasks.length ? 'var(--sage)' : 'var(--faint)')],
      [st.due.length ? `${st.done} of ${st.due.length} habit${st.due.length === 1 ? '' : 's'} done` : 'no habits due today', st.due.length ? (st.done === st.due.length ? 'var(--sage)' : '') : 'var(--faint)'],
      [revLine, revC],
    ]});

  const ms = typeof milestonesWithin === 'function' ? milestonesWithin(365) : [];
  const nextMs = ms[0];
  const snaps = allSnapshotsWithRetro(); const lastSnap = snaps[snaps.length - 1];
  const snapAge = lastSnap ? daysSince(lastSnap.date) : null;
  cards.push({label:'Becoming', hint:'long-term growth, identity', accent:'var(--ment)', route:'#/skills',
    lines:[
      nextMs ? [nextMs.days < 0 ? `${esc(nextMs.skill.name)} milestone ${-nextMs.days}d overdue` : `${esc(nextMs.skill.name)} milestone in ${nextMs.days} day${nextMs.days === 1 ? '' : 's'}`, nextMs.days < 0 ? 'var(--gold)' : '']
              : ['no skill milestone dated', 'var(--faint)'],
      snapAge === null ? ['no congruence snapshot yet', 'var(--gold)'] : [`congruence read ${relDays(snapAge)}`, snapAge > 45 ? 'var(--gold)' : ''],
    ]});

  const overdue = typeof peopleNeedingAttention === 'function' ? peopleNeedingAttention() : [];
  const bdays = typeof birthdaysSoon === 'function' ? birthdaysSoon(30) : [];
  const jrn = sortEntries(S.entries.filter(e => ['journal','reflection','dream','gratitude'].includes(e.type)))[0];
  const jrnAge = jrn ? daysSince((jrn.occurredAt || jrn.createdAt || '').slice(0,10)) : null;
  cards.push({label:'Story', hint:'relationships, memory, meaning', accent:'var(--rose)', route:'#/people',
    lines:[
      overdue.length ? [`${overdue.length} ${overdue.length === 1 ? 'person is' : 'people are'} overdue for contact`, 'var(--gold)'] : ['everyone is within their cadence', 'var(--sage)'],
      jrnAge === null ? ['nothing written yet', 'var(--faint)'] : [`last journal ${relDays(jrnAge)}`, jrnAge > 7 ? 'var(--gold)' : ''],
      bdays.length ? [`${esc(bdays[0].p.name)}&#39;s birthday in ${bdays[0].days} day${bdays[0].days === 1 ? '' : 's'}`, 'var(--terra)'] : null,
    ]});

  const m = T.slice(0,7);
  if(typeof migrateFinance === 'function') migrateFinance();
  const {streams, totalCurrentBase, totalTargetBase} = typeof portfolioTotals === 'function' ? portfolioTotals() : {streams:[], totalCurrentBase:0, totalTargetBase:0};
  const annualWant = typeof activeScenario === 'function' ? scenarioAnnualTotal(activeScenario()) : 0;
  cards.push({label:'Finance', hint:'ways to make money, and what enough looks like', accent:'var(--gold)', route:'#/finance',
    lines:[
      streams.length ? [`${money(totalCurrentBase)}/mo across ${streams.length} stream${streams.length===1?'':'s'}`, ''] : ['no income streams yet', 'var(--faint)'],
      totalTargetBase ? [`${money(totalTargetBase)}/mo target`, ''] : ['no target set', 'var(--faint)'],
      annualWant ? [`covers ${Math.round(totalCurrentBase*12/annualWant*100)}% of ${money(annualWant)}/yr wanted`, totalCurrentBase*12 < annualWant ? 'var(--gold)' : 'var(--sage)'] : ['no life-cost scenario priced yet', 'var(--faint)'],
    ]});
  return cards;
}
function zoneCardsHTML(){
  return `<section class="zone-cards rv">${zoneSummaries().map(c => `<a class="zone-card" href="${c.route}" style="--z:${c.accent}">
    <div class="zc-h"><span class="zc-label">${esc(c.label)}</span><span class="zc-hint mono">${esc(c.hint)}</span></div>
    <div class="zc-lines">${c.lines.filter(Boolean).map(([t, col]) => `<div class="zc-line"${col ? ` style="color:${col}"` : ''}>${t}</div>`).join('')}</div>
    <span class="zc-go mono">open →</span></a>`).join('')}</section>`;
}
routes.compass = function(root){
  const T = today(); const st = houseStats(); const moon = moonPhase(); const c = checkin(T);
  const days30 = lastDays(30); const weeks12 = Array.from({length:12},(_,w)=>w).map(w => lastDays(84).slice(w*7, w*7+7));
  const axes = S.valueOrder.map(id=>{ const v=byId(S.values,id); return {name:v.name, short:v.name.split(' ')[0], color:v.color}; });
  const snaps = allSnapshotsWithRetro(); const avgCong = snaps.map(s => avg(S.valueOrder.map(id => s.ratings[id]).filter(x=>x!=null)));
  const habitRate = weeks12.map(days => { let due=0, done=0; days.forEach(d => S.habits.forEach(h => { if(!h.archived&&!h.negative&&habitDue(h,d)){ due++; if(habitDone(h,d)) done++; } })); return due ? Math.round(done/due*100) : null; });
  const nodsW = weeks12.map(days => S.nods.filter(x => days.includes(x.date)).length);
  const entriesW = weeks12.map(days => S.entries.filter(e => days.includes(e.createdAt.slice(0,10))).length);
  const stageCounts = S.stages.map(s => ({s, n: stageEntries(s).length})); const maxStage = Math.max(...stageCounts.map(x=>x.n),1);
  const skillHrs = S.skills.filter(s=>!s.planned).map(s=>({s,h:skillHours(s)})).sort((a,b)=>b.h-a.h).slice(0,4);
  const income = sum(S.projects.map(p=>p.income?.current||0));
  root.innerHTML = `<div class="page">
    <div class="page-head" style="margin-bottom:22px"><div><h1>${fmtDate(T)}</h1><div class="moon">${moonSVG(moon.p)} <span>${moon.name}</span><span class="mono" style="margin-left:6px">· the compass — your life at a glance</span></div></div></div>

    ${typeof weekShapeHTML === 'function' ? weekShapeHTML() : ''}

    <div class="home-hero">
      <div class="focus-card rv"><div class="row between"><span class="k mono" style="text-transform:uppercase;letter-spacing:.12em;font-size:.62rem;color:var(--terra)">Today's focus</span><a class="btn sm ghost" href="#/today">open Today →</a></div>
        <div class="intent">${ed(`checkins.${T}.intention`,{ph:'One thing to give attention to today. Click to set it.'})}</div>
        <div class="focus-row">
          <div class="mini-rings" title="habit rings">${st.due.slice(0,10).map(h=>ringSVG(habitDone(h,T)?(habitDone(h,T).level==='min'?.5:1):0,{size:26,stroke:4,color:DIMS.find(d=>d.id===h.dimension).c})).join('')}<span class="mono">${st.done}/${st.due.length}</span></div>
          <span class="mono">${c.mood?'mood '+['heavy','low','level','light','luminous'][c.mood-1]:'<span style="color:var(--gold)">not checked in</span>'}</span>
          <span class="mono">${c.setpoint?hicksName(c.setpoint).split(' / ')[0]:''}</span>
          <span class="mono">${rehearsalDoneToday()?'rehearsal ✓':'rehearsal ·'}</span>
          ${st.rem?`<span class="mono" style="color:var(--gold)">${st.rem} reminder${st.rem>1?'s':''}</span>`:''}
        </div>
      </div>
      <div class="card rv" style="padding:18px 20px"><div class="k mono" style="text-transform:uppercase;letter-spacing:.12em;font-size:.62rem">Gentle prompt</div><div class="quote" style="margin-top:8px;font-size:1.1rem;color:var(--text)">${gentlePrompt()}</div>
        <div class="k mono" style="text-transform:uppercase;letter-spacing:.12em;font-size:.62rem;margin-top:18px">Signals</div>
        <div class="stack" style="gap:6px;margin-top:6px">${signals().slice(0,4).map(s=>`<a href="${s.go}" class="row between" style="text-decoration:none;color:inherit;padding:6px 0;border-top:1px dashed var(--line);gap:12px"><span class="mono" style="flex:none">${esc(s.k)}</span><span style="text-align:right;font-size:.85rem">${esc(s.v)}</span></a>`).join('')}</div></div>
    </div>

    ${zoneCardsHTML()}

    ${typeof positionHTML === 'function' ? positionHTML() : ''}

    <section class="section rv" style="margin-top:22px"><div class="row between"><span class="sc" style="margin:0">The house</span><span class="mono">● green tended · ● amber needs you · solid rings daily, dashed seasonal · hover to see what feeds what</span></div>
      <div class="house-wrap" id="houseWrap" style="margin-top:10px">${houseSVG(st)}<div class="htip" id="htip"></div></div></section>

    <section class="section rv"><span class="sc">The long view</span>
    <div class="bento">
      <div class="card span2"><div class="k">Compass <a href="#/values">→</a></div>${radar(axes,[{vals:S.valueOrder.map(id=>st.last?.ratings[id]??0),color:'var(--terra)'}],{size:230})}<div class="sub">${st.gaps[0]?`Widest gap: <b style="color:${st.gaps[0].color}">${esc(st.gaps[0].name)}</b> — ranked #${st.gaps[0].rank}, congruence ${st.gaps[0].congruence}%`:''}</div></div>
      <div class="card span2"><div class="k">Congruence over a lifetime</div><div class="big" data-tween="${avgCong.slice(-1)[0]||0}" data-suffix="%">0</div>${sparkline(avgCong,{h:56,min:0,max:100,color:'var(--terra)'})}<div class="sub">average across ten values · ${snaps.length} readings from ${snaps[0]?fmtDate(snaps[0].date,'med'):'—'}</div></div>
      <div class="card span2"><div class="k">Energy, 30 days <a href="#/today">→</a></div>${multiSpark(DIMS.map(d=>({vals:days30.map(x=>S.checkins[x]?.energy?.[d.id]||null),color:d.c})),{h:56})}<div class="legend">${DIMS.map(d=>`<span style="--c:${d.c}">${d.name}</span>`).join('')}</div>${sparkline(days30.map(d=>S.checkins[d]?.setpoint||null),{h:34,min:1,max:22,color:'var(--rose)'})}<div class="sub">emotional set-point · avg ${avg(days30.map(d=>S.checkins[d]?.setpoint).filter(Boolean)).toFixed(1)} — ${hicksName(avg(days30.map(d=>S.checkins[d]?.setpoint).filter(Boolean))||14).split(' / ')[0]}</div></div>
      <div class="card span3"><div class="k">Habits, 12 weeks <a href="#/today">→</a></div><div class="big" data-tween="${habitRate.slice(-1)[0]||0}" data-suffix="%">0<small>this week</small></div>${sparkline(habitRate,{h:56,min:0,max:100,color:'var(--sage)'})}<div class="sub">weekly completion · best streak ${Math.max(0,...S.habits.filter(h=>!h.archived&&!h.negative).map(h=>habitStreak(h).best))} days · weekly review ${relDays(daysSince(S.reviews.lastWeekly))}</div></div>
      <div class="card span2"><div class="k">Projects <a href="#/projects">→</a></div><div class="big" data-tween="${st.nods7}">0<small>nods this week</small></div>${sparkline(nodsW,{h:44,min:0,color:'var(--terra)'})}<div class="sub">${st.active.length} active · ${fmtYen(income)}/mo across ${S.projects.filter(p=>p.income?.current>0).length} stream${S.projects.filter(p=>p.income?.current>0).length===1?'':'s'}</div></div>
      <div class="card span2"><div class="k">Skills <a href="#/skills">→</a></div><div class="big" data-tween="${st.hrs30}" data-dec="1">0<small>hours / 30d</small></div>${skillHrs.map(x=>`<div class="vbar"><span>${esc(x.s.name)}</span><div class="bar" style="--c:var(--ment)"><i style="width:${Math.min(100,x.h/Math.max(skillHrs[0].h,1)*100)}%"></i></div><span class="mono">${x.h.toFixed(0)}h</span></div>`).join('')}<div class="sub">${st.atro?`<span style="color:var(--gold)">${st.atro} atrophying</span> · `:''}${S.skills.filter(s=>s.planned).length} buds planned</div></div>
      <div class="card span2"><div class="k">Journal &amp; memory <a href="#/journals">→</a></div><div class="big" data-tween="${S.entries.length}">0<small>entries</small></div>${sparkline(entriesW,{h:40,min:0,color:'var(--rose)'})}<div class="sub">${st.j7} this week · ${st.memories} memories · ${st.quotes} quotes</div><div class="stagebars" title="entries per stage">${stageCounts.map(x=>`<i style="--c:${x.s.hue};height:${Math.max(4,x.n/maxStage*44)}px" title="${esc(x.s.name)} · ${x.n}"></i>`).join('')}</div></div>
    </div></section>
  </div>`;
  const wrap = $('#houseWrap'), tip = $('#htip'); const showTip = (e, html) => { tip.innerHTML = html; tip.style.display='block'; const r = wrap.getBoundingClientRect(); tip.style.left = Math.min(e.clientX-r.left+14, r.width-290)+'px'; tip.style.top = (e.clientY-r.top+14)+'px'; };
  wrap.querySelectorAll('.hnode').forEach(nd => { nd.onmouseenter = e => { wrap.classList.add('hov'); nd.classList.add('hot'); wrap.querySelectorAll('.hedge').forEach(ed_ => { if(ed_.dataset.a===nd.dataset.node||ed_.dataset.b===nd.dataset.node){ ed_.classList.add('hot'); wrap.querySelector(`[data-node="${ed_.dataset.a}"]`)?.classList.add('hot'); wrap.querySelector(`[data-node="${ed_.dataset.b}"]`)?.classList.add('hot'); } }); const s = st.stat[nd.dataset.node]; showTip(e, `<b class="serif">${esc(NAV_PAGES[nd.dataset.node].label)}</b> · <span class="mono">${s.cadence}</span><br>${esc(s.line)}${s.tip?'<br>'+esc(s.tip):''}<br><span class="mono">click to open</span>`); }; nd.onmousemove = e => showTip(e, tip.innerHTML); nd.onmouseleave = () => { wrap.classList.remove('hov'); wrap.querySelectorAll('.hot').forEach(x=>x.classList.remove('hot')); tip.style.display='none'; }; });
  wrap.querySelectorAll('.hedge').forEach(ed_ => { ed_.onmouseenter = e => { ed_.classList.add('hot'); showTip(e, `<span class="mono">${esc(NAV_PAGES[ed_.dataset.a].label)} ↔ ${esc(NAV_PAGES[ed_.dataset.b].label)}</span><br>${esc(ed_.dataset.label)}`); }; ed_.onmousemove = e => showTip(e, tip.innerHTML); ed_.onmouseleave = () => { ed_.classList.remove('hot'); tip.style.display='none'; }; });
  if(typeof bindPosition === 'function') bindPosition(root, () => rerender());
  if(typeof bindWeekShape === 'function') bindWeekShape(root, () => rerender());
};

/* ---------- Settings: drag-and-drop zone editor ---------- */
function zoneEditorHTML(){ const n = navConfig(); const col = (id, label, keys, accent) => `<div class="zone-col" data-zcol="${id}" style="--z:${accent}"><div class="sc" style="color:${accent}">${label}</div>${keys.map(k => `<div class="zone-item" draggable="true" data-zitem="${k}"><span class="ico">${NAV_PAGES[k].ico}</span>${esc(NAV_PAGES[k].label)}<span class="mono">⋮</span></div>`).join('')||'<div class="faint" style="font-size:.75rem;padding:6px">drop pages here</div>'}</div>`;
  return `<div class="zone-editor" id="zoneEditor">${NAV_ZONES.map(z => col(z.id, z.label, n[z.id], z.accent)).join('')}${col('standalone','Always',n.standalone,'var(--terra)')}</div><div class="row" style="margin-top:10px"><button class="btn sm ghost" id="zoneReset">reset to default</button></div>`; }
function bindZoneEditor(root){
  let dragKey = null; const n = navConfig();
  root.querySelectorAll('.zone-item').forEach(it => { it.addEventListener('dragstart', () => { dragKey = it.dataset.zitem; it.classList.add('dragging'); }); it.addEventListener('dragend', () => it.classList.remove('dragging')); });
  root.querySelectorAll('.zone-col').forEach(col => { col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('over'); }); col.addEventListener('dragleave', () => col.classList.remove('over')); col.addEventListener('drop', e => { e.preventDefault(); col.classList.remove('over'); if(!dragKey) return; NAV_ZONE_IDS.forEach(z => n[z] = n[z].filter(k => k !== dragKey)); const target = col.dataset.zcol; const after = e.target.closest('.zone-item')?.dataset.zitem; const arr = n[target]; const i = after ? arr.indexOf(after) : -1; if(i >= 0) arr.splice(i, 0, dragKey); else arr.push(dragKey); dragKey = null; saveNow(); renderNav(); rerender(); }); });
  root.querySelector('#zoneReset').onclick = () => { S.settings.nav = JSON.parse(JSON.stringify(NAV_DEFAULT)); saveNow(); renderNav(); rerender(); };
}
