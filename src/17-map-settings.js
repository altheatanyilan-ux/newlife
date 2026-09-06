/* ============================================================
   10. SYSTEM MAP — the control room
   ============================================================ */
function mapNodes(){
  const T = today(); const topV = S.visions.filter(v=>v.confidence!=='lived').map(v=>({v,...vividness(v)})).sort((a,b)=>b.score-a.score)[0];
  const due = S.habits.filter(h=>!h.archived&&!h.negative&&habitDue(h,T)); const doneH = due.filter(h=>habitDone(h,T)).length;
  const dot = (ok, warn) => ok ? {c:'var(--sage)',t:'✓'} : warn ? {c:'var(--gold)',t:'!'} : null;
  return [
    {id:'theatre',t:'Morning Theatre',c:'daily',x:120,y:120,go:'#/today',desc:'Daily self-image rehearsal. Who you rehearse becoming shapes which visions feel achievable.',status:dot(theatreDoneToday(), !theatreDoneToday())},
    {id:'today',t:'Today',c:'daily',x:120,y:300,go:'#/today',desc:'The daily entry point. Surfaces signals from every room.',status:dot(!!S.checkins[T]?.mood, !S.checkins[T]?.mood)},
    {id:'rituals',t:'Rituals & Habits',c:'daily',x:120,y:480,go:'#/rituals',desc:`The maintenance engine for everything above. ${doneH}/${due.length} rings full today.`,status:dot(due.length&&doneH===due.length, doneH<due.length)},
    {id:'vision',t:'Vision Tree',c:'weekly',x:470,y:120,go:'#/vision',desc:'Ask. Vividness measures Given. Resistance identifies what blocks Allowing.',status:topV?dot(topV.lastTended<=30, topV.lastTended>30):null},
    {id:'values',t:'Values',c:'weekly',x:470,y:300,go:'#/values',desc:'Priority vs. congruence. Unserved values are blind spots.',status:dot(daysSince(latestSnapshot()?.date)<=7, daysSince(latestSnapshot()?.date)>7)},
    {id:'skills',t:'Skill Tree',c:'monthly',x:470,y:480,go:'#/skills',desc:'Career capital. Rubrics reviewed seasonally; practice logged as it happens.',status:dot(!S.skills.some(s=>!s.planned&&daysSince(skillLastPracticed(s))>90), S.skills.some(s=>!s.planned&&daysSince(skillLastPracticed(s))>90))},
    {id:'projects',t:'Creative Projects',c:'daily',x:820,y:120,go:'#/projects',desc:'Nods daily; income streams advance financial visions.',status:dot(S.nods.some(n=>n.date===T), !S.nods.some(n=>n.date===T))},
    {id:'journals',t:'Journals',c:'daily',x:820,y:300,go:'#/journals',desc:'Entries cross-link to every other section. The connective tissue.',status:null},
    {id:'timeline',t:'Timeline & Threads',c:'archival',x:820,y:480,go:'#/timeline',desc:'The museum of the past. Formative events, versioned narratives, threads that run through everything.',status:null},
    {id:'annual',t:'Annual Rite · Letters · Artifacts',c:'archival',x:470,y:640,go:'#/rituals/reviews',desc:'The deepest archival layer. Tended once a year, or when the moment asks.',status:dot(daysSince(S.reviews.lastAnnual)<365, daysSince(S.reviews.lastAnnual)>=365)},
  ];
}
const MAP_EDGES = [
  ['theatre','vision','Who you rehearse becoming shapes which visions feel achievable — the self-image required by each vision is closed in the Theatre.'],
  ['vision','skills','Visions require skills; skills serve visions. Hover a vision to see which skills are load-bearing.',true],
  ['vision','values','Visions serve values; values no vision serves are structural blind spots.',true],
  ['timeline','values','Retrospective values readings from each stage populate the Values radar across a whole life.'],
  ['timeline','vision','Formative events and self-image patterns inform what you now want to create.'],
  ['projects','skills','Projects exercise skills; skills enable projects.',true],
  ['projects','vision','Income streams advance financial visions; nods grow leaves.'],
  ['journals','vision','Entries cross-link to every section — a tagged entry is a leaf, a value reading, a practice log.'],
  ['journals','timeline','Memories tagged to stages become formative events.'],
  ['rituals','today','Rituals are the maintenance engine; Today is where the rings are filled.'],
  ['today','vision','Signals surface the most neglected vision and the greatest structural tension.'],
  ['today','values','The biggest values gap is a daily signal.'],
  ['rituals','vision','Weekly review waters one vision.'],
  ['rituals','values','Weekly review logs a congruence snapshot.'],
  ['annual','timeline','The annual rite mints the year into the Timeline.'],
];
routes.map = function(root){
  const nodes = mapNodes(); const N = {}; nodes.forEach(n=>N[n.id]=n); const W=940, H=740, w=200, h=64;
  const style = {daily:{fill:'color-mix(in srgb,var(--terra) 30%,var(--surface))',stroke:'var(--terra)',dash:'',op:1,sc:1}, weekly:{fill:'color-mix(in srgb,var(--terra) 14%,var(--surface))',stroke:'var(--terra)',dash:'',op:1,sc:.92}, monthly:{fill:'var(--surface)',stroke:'var(--muted)',dash:'6 4',op:.9,sc:.86}, archival:{fill:'var(--surface)',stroke:'var(--line-2)',dash:'',op:.55,sc:.8}};
  const edge = ([a,b,label,bi],i) => { const A=N[a], B=N[b]; const dx=B.x-A.x, dy=B.y-A.y; const ax = A.x + (Math.abs(dx)>Math.abs(dy) ? Math.sign(dx)*w/2*style[A.c].sc : 0), ay = A.y + (Math.abs(dx)>Math.abs(dy) ? 0 : Math.sign(dy)*h/2*style[A.c].sc); const bx = B.x - (Math.abs(dx)>Math.abs(dy) ? Math.sign(dx)*w/2*style[B.c].sc : 0), by = B.y - (Math.abs(dx)>Math.abs(dy) ? 0 : Math.sign(dy)*h/2*style[B.c].sc); const mx=(ax+bx)/2, my=(ay+by)/2; const d = Math.abs(dx)>Math.abs(dy) ? `M${ax},${ay} C${mx},${ay} ${mx},${by} ${bx},${by}` : `M${ax},${ay} C${ax},${my} ${bx},${my} ${bx},${by}`; return `<path class="medge" d="${d}" data-a="${a}" data-b="${b}" data-i="${i}" marker-end="url(#ma)" ${bi?'marker-start="url(#mb)"':''}/>`; };
  root.innerHTML = `<div class="page">
    <div class="page-head row between"><div><h1>System Map</h1><div class="sub">How the rooms feed each other, and which need tending today. Click a room to walk in.</div></div><label class="toggle ${S.settings.home==='map'?'on':''}" id="homeToggle"><span class="sw"></span><span>open here on launch</span></label></div>
    <div class="map-wrap" id="mapWrap"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet"><defs><marker id="ma" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--line-2)"/></marker><marker id="mb" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M10,0 L0,5 L10,10 z" fill="var(--line-2)"/></marker></defs>
      ${MAP_EDGES.map(edge).join('')}
      ${nodes.map(n => { const s = style[n.c]; const ww = w*s.sc, hh = h*s.sc; return `<g class="mnode ${n.c}" data-node="${n.id}" data-go="${n.go}" transform="translate(${n.x},${n.y})" style="opacity:${s.op}"><rect x="${-ww/2}" y="${-hh/2}" width="${ww}" height="${hh}" rx="12" fill="${s.fill}" stroke="${s.stroke}" stroke-width="1.5" ${s.dash?`stroke-dasharray="${s.dash}"`:''}/><text class="t" text-anchor="middle" y="-2" style="font-size:${(15*s.sc).toFixed(1)}px">${esc(n.t)}</text><text class="c" text-anchor="middle" y="16">${n.c}</text>${n.status?`<circle cx="${ww/2-10}" cy="${-hh/2+10}" r="5" fill="${n.status.c}"/>`:''}</g>`; }).join('')}
    </svg><div class="mtip" id="mtip"></div></div>
    <div class="map-legend"><span><i class="d"></i> daily — solid, glowing, pulsing</span><span><i class="w"></i> weekly — solid, smaller</span><span><i class="m"></i> monthly / seasonal — outlined, dashed</span><span><i class="a"></i> as-needed / archival — faded, smallest</span><span>● green: tended · ● amber: needs attention</span></div>
  </div>`;
  const wrap = $('#mapWrap'), tip = $('#mtip'); const showTip = (e,html) => { tip.innerHTML = html; tip.style.display='block'; const r = wrap.getBoundingClientRect(); tip.style.left = Math.min(e.clientX-r.left+14, r.width-300)+'px'; tip.style.top = (e.clientY-r.top+14)+'px'; };
  wrap.querySelectorAll('.mnode').forEach(n => { n.onmouseenter = e => { wrap.classList.add('hov'); n.classList.add('hot'); wrap.querySelectorAll('.medge').forEach(ed_ => { if(ed_.dataset.a===n.dataset.node||ed_.dataset.b===n.dataset.node){ ed_.classList.add('hot'); wrap.querySelector(`[data-node="${ed_.dataset.a}"]`).classList.add('hot'); wrap.querySelector(`[data-node="${ed_.dataset.b}"]`).classList.add('hot'); } }); const nd = N[n.dataset.node]; showTip(e, `<b class="serif">${esc(nd.t)}</b><br>${esc(nd.desc)}<br><span class="mono">click to open</span>`); }; n.onmousemove = e => showTip(e, tip.innerHTML); n.onmouseleave = () => { wrap.classList.remove('hov'); wrap.querySelectorAll('.hot').forEach(x=>x.classList.remove('hot')); tip.style.display='none'; }; });
  wrap.querySelectorAll('.medge').forEach(ed_ => { ed_.onmouseenter = e => { ed_.classList.add('hot'); showTip(e, `<span class="mono">${esc(N[ed_.dataset.a].t)} → ${esc(N[ed_.dataset.b].t)}</span><br>${esc(MAP_EDGES[+ed_.dataset.i][2])}`); }; ed_.onmousemove = e => showTip(e, tip.innerHTML); ed_.onmouseleave = () => { ed_.classList.remove('hot'); tip.style.display='none'; }; ed_.onclick = () => navigate(N[ed_.dataset.b].go); });
  $('#homeToggle').onclick = function(){ S.settings.home = S.settings.home==='map' ? 'home' : 'map'; saveNow(); this.classList.toggle('on', S.settings.home==='map'); };
};

/* ============================================================
   13. SETTINGS
   ============================================================ */
routes.settings = function(root){
  root.innerHTML = `<div class="page narrow settings"><div class="page-head"><h1>Settings</h1><div class="sub">The house remembers.</div></div>
    <div class="card rv"><h3>Atmosphere</h3>
      <div class="opt"><div><b>Theme</b><div class="d">Dark: rich soil and old leather. Light: warm paper.</div></div><label class="toggle ${S.settings.theme==='light'?'on':''}" id="sTheme"><span>dark</span><span class="sw"></span><span>light</span></label></div>
      <div class="opt"><div><b>Interaction sounds 🔔</b><div class="d">Soft chimes on clicks, a low note on navigation, a rising pair when something is completed. Synthesised in the browser; nothing is downloaded.</div></div><label class="toggle ${SoundManager.state().soundEnabled?'on':''}" id="sSound"><span class="sw"></span></label></div>
      <div class="opt"><div><b>Ambient background 🌊</b><div class="d">A barely-audible brown-noise wash, low-passed at 200 Hz. Ducks briefly under each click. Off by default.</div></div><label class="toggle ${SoundManager.state().ambientEnabled?'on':''}" id="sAmbient"><span class="sw"></span></label></div>
      <div class="opt"><div><b>Felt time</b><div class="d">Default timeline mode: stretch dense stages, compress thin ones.</div></div><label class="toggle ${S.settings.feltTime?'on':''}" id="sFelt"><span>clock</span><span class="sw"></span><span>felt</span></label></div>
      <div class="opt"><div><b>Landing page</b><div class="d">Where the site opens.</div></div><select class="sel" style="width:auto" id="sHome">${[['home','Home dashboard'],['today','Today'],['map','System Map']].map(([v,l])=>`<option value="${v}" ${(S.settings.home||'home')===v?'selected':''}>${l}</option>`).join('')}</select></div>
    </div>
    <div class="card rv"><h3>Navigation zones</h3><p class="muted" style="font-size:.85rem">Drag pages between Present, Becoming, and Always. The sidebar and the mobile menu follow.</p>${zoneEditorHTML()}
    </div>
    <div class="card rv"><h3>Data &amp; backups</h3><p class="muted" style="font-size:.85rem" id="storageLine">Everything lives in this browser, in an IndexedDB database. Measuring…</p><div class="bar" style="--c:var(--sage);margin-bottom:12px"><i id="storageBar" style="width:0%"></i></div>
      <div class="row"><button class="btn primary" id="sExport">💾 Export backup</button><button class="btn" id="sImport">Import backup</button><input type="file" id="sFile" accept=".json,application/json" hidden><button class="btn ghost" id="sRestoreInfo" title="${esc(RECOVERY_TEXT)}">ⓘ How to restore</button></div>
      <p class="muted" style="font-size:.85rem;margin-top:12px" id="lastBackupLine"></p>
      <div class="opt"><div><b>Photo size on upload</b><div class="d">Long edge in pixels. Larger keeps more detail and uses more space.</div></div><select class="sel" style="width:auto" id="sPhotoMax">${[1200,1600,2400,4000].map(n=>`<option value="${n}" ${(S.settings.photoMax||1600)===n?'selected':''}>${n}px${n===1600?' (default)':''}</option>`).join('')}</select></div>
      <div class="opt"><div><b>Clear all data</b><div class="d">Erases everything in this browser and restores the placeholder content. Export first.</div></div><button class="btn danger" id="sClear">Clear all data</button></div>
    </div>
    <div class="card rv"><h3>About</h3><div class="prose muted" style="font-size:.9rem">
      <p>Life Instrument is a house you are still building. Each section is a room. Some rooms look backward; some look forward; some hold tools; some hold artifacts. The hallway connecting them is a single data model that lets one entry live in many rooms at once.</p>
      <p>It is not a productivity app. Its job is to make the motifs of a life visible — recurring patterns, drifting values, dreams gaining or losing specificity — so you can interpret the past honestly and pull the future closer deliberately.</p>
      <p>It draws on Maltz (self-image and mental rehearsal), Fritz (structural tension), Hicks (the emotional guidance scale), Hill (auto-suggestion), Loehr &amp; Schwartz (four-dimensional energy and oscillation), Leonard (mastery and the plateau), and Newport (career capital). The Philosophical Integration is structural, not decorative: every mechanic embodies a teaching.</p>
      <p class="mono">keyboard: ⌘N new entry · ⌘K search · ← → timeline · Esc close</p>
    </div></div></div>`;
  storageInfo().then(i => { const line = $('#storageLine'); if(!line) return; const mode = usingRealDexie ? 'an IndexedDB database (Dexie)' : 'an IndexedDB database'; if(i && i.quota){ line.textContent = `Everything lives in this browser, in ${mode}. Using ${fmtBytes(i.usage)} of about ${fmtBytes(i.quota)} available to this site.`; $('#storageBar').style.width = Math.max(1, i.usage/i.quota*100).toFixed(1)+'%'; } else { line.textContent = `Everything lives in this browser, in ${mode}.`; } });
  $('#sPhotoMax').onchange = e => { S.settings.photoMax = +e.target.value; saveNow(); };
  $('#sTheme').onclick = function(){ S.settings.theme = S.settings.theme==='dark'?'light':'dark'; saveNow(); applyTheme(); this.classList.toggle('on', S.settings.theme==='light'); };
  $('#sSound').onclick = function(){ SoundManager.toggleSound(); this.classList.toggle('on', SoundManager.state().soundEnabled); };
  $('#sAmbient').onclick = function(){ SoundManager.toggleAmbient(); this.classList.toggle('on', SoundManager.state().ambientEnabled); };
  $('#sFelt').onclick = function(){ S.settings.feltTime = !S.settings.feltTime; saveNow(); this.classList.toggle('on', S.settings.feltTime); };
  $('#sHome').onchange = e => { S.settings.home = e.target.value; saveNow(); };
  bindZoneEditor($('#zoneEditor').parentElement);
  const lb = daysSinceBackup(); $('#lastBackupLine').textContent = lb === null ? 'No backup exported yet from this browser.' : `Last backup: ${lb === 0 ? 'today' : lb + ' days ago'}.`;
  $('#sExport').onclick = () => exportToJSON().then(() => { toast('Backup exported.'); rerender(); });
  $('#sRestoreInfo').onclick = showRecoveryInfo;
  $('#sImport').onclick = () => $('#sFile').click();
  $('#sFile').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if(!f) return; const r = new FileReader(); r.onload = () => { let obj; try { obj = normaliseBackup(JSON.parse(r.result)); } catch(err){ toast('That file could not be read as JSON.'); return; } const problem = validateBackup(obj); if(problem){ toast(problem, 6000); return; } const counts = ['entries','stages','visions','habits'].map(k => `${obj.data[k].length} ${k}`).join(' · '); confirmDlg(`This will overwrite all current data. Are you sure?<br><span class="mono">backup from ${esc((obj.exportedAt||'').slice(0,10) || 'unknown date')} · ${counts}</span>`, async () => { try { await importBackup(obj); applyTheme(); toast('Backup imported. The house has been refurnished.'); rerender(); } catch(err){ console.error(err); toast('Import failed: ' + err.message, 6000); } }); }; r.readAsText(f); };
  $('#sClear').onclick = () => confirmDlg('This erases everything in this browser and re-seeds the placeholder content. Export first if in doubt.', async ()=>{ await resetAll(); applyTheme(); toast('Cleared. Seed content restored.'); navigate('#/today'); rerender(); });
};
