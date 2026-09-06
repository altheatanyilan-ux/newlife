/* ============================================================
   CHARTS — small SVG helpers
   ============================================================ */
function sparkline(vals, {w=200,h=40,color='var(--terra)',min,max,fill=true,dots=false,labels}={}){
  const v = vals.map(x => x==null ? null : +x); const present = v.filter(x=>x!=null);
  if(!present.length) return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><line x1="0" y1="${h/2}" x2="${w}" y2="${h/2}" stroke="var(--line-2)" stroke-dasharray="2 3"/></svg>`;
  const lo = min ?? Math.min(...present), hi = max ?? Math.max(...present); const rng = (hi-lo)||1;
  const pts = v.map((x,i) => x==null ? null : [ (i/(Math.max(v.length-1,1)))*w, h-4-((x-lo)/rng)*(h-8) ]);
  let d=''; let started=false;
  pts.forEach(p => { if(!p){ started=false; return; } d += (started?'L':'M') + p[0].toFixed(1)+','+p[1].toFixed(1)+' '; started=true; });
  const area = fill && pts.filter(Boolean).length>1 ? `<path d="${d} L${pts.filter(Boolean).slice(-1)[0][0].toFixed(1)},${h} L${pts.filter(Boolean)[0][0].toFixed(1)},${h} Z" fill="${color}" opacity=".08"/>` : '';
  const ds = dots ? pts.map((p,i) => p ? `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.5" fill="${color}" data-i="${i}" ${labels?`><title>${esc(labels[i])}</title></circle`:'/'}>` : '').join('') : '';
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" style="overflow:visible">${area}<path d="${d}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>${ds}</svg>`;
}
function multiSpark(series, {w=300,h=70,min=1,max=5}={}){
  const rng = (max-min)||1;
  const lines = series.map(({vals,color}) => { const pts = vals.map((x,i)=> x==null?null:[(i/Math.max(vals.length-1,1))*w, h-4-((x-min)/rng)*(h-8)]); let d='',st=false; pts.forEach(p=>{ if(!p){st=false;return;} d+=(st?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)+' '; st=true; }); return `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.5" opacity=".85" stroke-linejoin="round"/>`; }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none">${lines}</svg>`;
}
function radar(axes, series, {size=300}={}){
  // axes: [{name,color}], series: [{vals:[0-100], color, dashed, fill}]
  const c = size/2, r = size/2 - 58, n = axes.length;
  const pt = (i,v) => { const a = -Math.PI/2 + i*2*Math.PI/n; return [c + Math.cos(a)*r*v/100, c + Math.sin(a)*r*v/100]; };
  let g = '';
  [25,50,75,100].forEach(l => { g += `<polygon points="${axes.map((_,i)=>pt(i,l).map(x=>x.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="var(--line-2)" stroke-width="${l===100?1:.6}"/>`; });
  axes.forEach((a,i) => { const [x,y] = pt(i,100); const [lx,ly] = pt(i,124); g += `<line x1="${c}" y1="${c}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)"/><text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" style="fill:${a.color};font-family:var(--serif);font-size:10.5px;letter-spacing:.02em">${esc(a.short||a.name)}</text>`; });
  series.forEach(s => { const pts = s.vals.map((v,i)=>pt(i,v??0).map(x=>x.toFixed(1)).join(',')).join(' '); g += `<polygon class="radar-poly" points="${pts}" fill="${s.fill===false?'none':s.color}" fill-opacity="${s.dashed?.06:.18}" stroke="${s.color}" stroke-width="${s.dashed?1.2:2}" ${s.dashed?'stroke-dasharray="4 4"':''} stroke-linejoin="round" style="transition:all .6s var(--ease)"/>`; });
  return `<svg viewBox="0 0 ${size} ${size}" width="100%" style="max-width:${size}px;display:block;margin:0 auto;overflow:visible">${g}</svg>`;
}
function ringSVG(pct, {size=64, color='var(--sage)', stroke=6, label=''}={}){
  const r = (size-stroke)/2, C = 2*Math.PI*r, off = C*(1-clamp(pct,0,1));
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="${stroke}"/><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 ${size/2} ${size/2})" style="transition:stroke-dashoffset .7s var(--ease)"/>${label?`<text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle" style="fill:var(--text);font-size:${size/4.5}px;font-family:var(--serif)">${esc(label)}</text>`:''}</svg>`;
}
function heatGrid(days, weeks, getLevel, cls='heat'){
  // days: array of iso days ending today (oldest first), 7 rows x weeks cols, column-major
  let out=''; const start = parseDay(days[0]).getDay(); for(let i=0;i<start;i++) out += `<i style="opacity:0"></i>`;
  days.forEach(d => { out += `<i class="${getLevel(d)}" title="${d}"></i>`; });
  return `<div class="${cls}" style="grid-template-columns:repeat(${weeks},1fr)">${out}</div>`;
}
const lastDays = n => Array.from({length:n},(_,i)=>addDays(today(), -(n-1-i)));

/* ============================================================
   METRICS — vividness, values, signals
   ============================================================ */
function entriesLinked(kind, id){ return S.entries.filter(e => (e.links?.[kind]||[]).some(x => (typeof x==='string'?x:x.id)===id)); }
function vividness(v){
  const leaves = entriesLinked('visions', v.id);
  const volume = clamp(leaves.length/12, 0, 1);
  const recency = leaves.length ? clamp(Math.max(...leaves.map(e => Math.pow(.5, daysSince(e.occurredAt?.slice(0,10).match(/^\d{4}-\d{2}-\d{2}$/)? e.occurredAt.slice(0,10) : e.createdAt.slice(0,10))/30))), 0, 1) : 0;
  const spec = [v.targetDate, v.location, v.money, v.nextAction].filter(x => String(x||'').trim()).length/4;
  const sens = Object.values(v.sensory||{}).filter(x => String(x||'').trim()).length/6;
  const evidence = clamp(((v.evidence||[]).length + leaves.reduce((n,e)=>n+(e.media?.length||0),0))/4, 0, 1);
  const feeling = v.feeling ? clamp((v.feeling-1)/4, 0, 1) : 0;
  const tension = ((String(v.currentReality||'').trim() ? .5 : 0) + ((String(v.futureMemory||'').trim() || sens>0) ? .5 : 0));
  const parts = {volume:volume*20, recency:recency*20, specificity:spec*15, sensory:sens*15, evidence:evidence*10, resonance:feeling*10, tension:tension*10};
  const score = Math.round(sum(Object.values(parts)));
  const lastTended = leaves.length ? Math.min(...leaves.map(e => daysSince(e.createdAt.slice(0,10)))) : daysSince(v.createdAt);
  return {score, parts, lastTended, leaves};
}
function visionState(score){ return score<=15?'bare':score<=30?'budding':score<=50?'leafing':score<=70?'canopy':score<=85?'flowering':'fruiting'; }
function structuralTension(v){ const cr = String(v.currentReality||'').length, vis = String(v.futureMemory||'').length + sum(Object.values(v.sensory||{}).map(s=>String(s||'').length)); if(!cr || !vis) return 0; return Math.round(Math.min(100, (Math.min(cr,600)/600*50 + Math.min(vis,1200)/1200*50)) * (1 - CONF.indexOf(v.confidence)/8)); }
function latestSnapshot(){ return [...S.valueSnapshots].sort((a,b)=>a.date<b.date?1:-1)[0]; }
function valueCurrent(id){ const s = latestSnapshot(); return s ? (s.ratings[id] ?? 0) : 0; }
function valueGaps(){ const n = S.valueOrder.length; return S.valueOrder.map((id,i) => { const v = byId(S.values,id); const priorityPct = 100 - (i/(n-1))*100; return {id, name:v.name, color:v.color, rank:i+1, congruence:valueCurrent(id), gap:Math.round(priorityPct - valueCurrent(id))}; }).sort((a,b)=>b.gap-a.gap); }
function allSnapshotsWithRetro(){
  const retro = S.stages.filter(s => s.retroValues && Object.keys(s.retroValues).length).map(s => { const y = parseInt((s.years||'').match(/\d{4}/)?.[0]||'2000'); const y2 = parseInt((s.years||'').match(/–(\d{4})/)?.[1]||y+2); return {id:'retro-'+s.id, date:`${Math.round((y+y2)/2)}-06-15`, ratings:s.retroValues, note:`Retrospective — ${s.char} ${s.name}`, retro:true, stageId:s.id}; });
  return [...retro, ...S.valueSnapshots].sort((a,b)=>a.date<b.date?-1:1);
}
function skillLastPracticed(sk){ const es = entriesLinked('skills', sk.id); return es.length ? es.map(e=>e.createdAt.slice(0,10)).sort().slice(-1)[0] : null; }
function skillStreak(sk){ const days = new Set(entriesLinked('skills', sk.id).map(e=>e.createdAt.slice(0,10))); let best=0, cur=0, d=today(); while(days.has(d)){cur++; d=addDays(d,-1);} const sorted=[...days].sort(); let run=0; for(let i=0;i<sorted.length;i++){ run = (i>0 && daysBetween(sorted[i-1],sorted[i])===1) ? run+1 : 1; best=Math.max(best,run);} return {cur,best}; }
function skillHours(sk){ return entriesLinked('skills', sk.id).reduce((n,e)=>n+((+e.extra?.duration||0)/60),0); }
function projectNods(p){ return S.nods.filter(n=>n.projectId===p.id).sort((a,b)=>a.date<b.date?1:-1); }
function habitDue(h, day){ const dow = parseDay(day).getDay(); if(h.negative||h.archived) return false; if(h.freq.type==='daily') return true; if(h.freq.type==='days') return h.freq.days.includes(dow); return true; }
function habitDone(h, day){ return S.habitLog[day]?.[h.id]; }
function habitStreak(h){ let cur=0, d=today(); if(!habitDone(h,d)) d = addDays(d,-1); while(true){ if(habitDone(h,d)) cur++; else if(habitDue(h,d) || h.freq.type!=='days') break; d = addDays(d,-1); if(cur>400) break; } let best=cur; let run=0; lastDays(365).forEach(x => { if(habitDone(h,x)){ run++; best=Math.max(best,run);} else if(habitDue(h,x)) run=0; }); return {cur,best}; }
function habitWeekRates(h, weeks=4){ const out=[]; for(let w=weeks-1; w>=0; w--){ const days = Array.from({length:7},(_,i)=>addDays(today(), -(w*7+ (6-i)))); const due = h.freq.type==='perWeek' ? h.freq.count : h.freq.type==='perMonth' ? Math.max(1,Math.round(h.freq.count/4)) : days.filter(d=>habitDue(h,d)).length; const done = days.filter(d=>habitDone(h,d)).length; out.push({done, due:Math.max(due,1)}); } return out; }
function energyBalance(week=true){ const days = week ? lastDays(7) : [today()]; const out = {}; DIMS.forEach(d => out[d.id] = {exp:0, rec:0}); days.forEach(day => S.habits.forEach(h => { if(habitDone(h,day) && !h.negative) out[h.dimension][h.kind==='recovery'?'rec':'exp']++; })); return out; }
/* one honest number for a day: the four energy dimensions and the emotional
   set-point, each normalised, averaged over whatever was actually logged. */
function dayState(day){
  const c = S.checkins[day]; if(!c) return null;
  const parts = [];
  const en = DIMS.map(d => c.energy?.[d.id]).filter(v => v > 0);
  if(en.length) parts.push(avg(en.map(v => (v-1)/4*100)));
  if(c.setpoint) parts.push((c.setpoint-1)/21*100);
  return parts.length ? Math.round(avg(parts)) : null;
}
function stateBlurb(trend){
  const vals = trend.filter(v => v !== null); if(vals.length < 2) return 'not enough evenings logged yet';
  const half = Math.ceil(vals.length/2); const a = avg(vals.slice(0,half)), b = avg(vals.slice(half));
  const d = b - a; const now = Math.round(vals.slice(-1)[0]);
  const dir = d > 6 ? 'rising' : d < -6 ? 'sinking' : 'level';
  return `now ${now}/100 · ${dir} over ${vals.length} logged days`;
}
function rehearsalDoneToday(){ return S.rehearsal.days.includes(today()); }
function rehearsalStreak(){ let n=0, d=today(); if(!S.rehearsal.days.includes(d)) d=addDays(d,-1); while(S.rehearsal.days.includes(d)){n++; d=addDays(d,-1);} return n; }
function signals(){
  const out = [];
  const vs = S.visions.filter(v=>v.confidence!=='lived').map(v=>({v, ...vividness(v)}));
  if(vs.length){ const neg = [...vs].sort((a,b)=>a.score-b.score || b.lastTended-a.lastTended)[0]; out.push({k:'Most neglected vision', v:neg.v.name, d:`vividness ${neg.score} · last tended ${relDays(neg.lastTended)}`, go:'#/vision/'+neg.v.id}); }
  const gaps = valueGaps(); if(gaps.length) out.push({k:'Biggest values gap', v:gaps[0].name, d:`ranked #${gaps[0].rank}, congruence ${gaps[0].congruence}%`, go:'#/value/'+gaps[0].id});
  const st = vs.map(x=>({v:x.v, t:structuralTension(x.v)})).filter(x=>x.t>0).sort((a,b)=>b.t-a.t).slice(0,3);
  if(st.length) out.push({k:'Structural tension', v:st.map(x=>x.v.name).join(' · '), d:'greatest vision / reality discrepancy — the most creative energy available', go:'#/vision/'+st[0].v.id});
  const sk = S.skills.filter(s=>!s.planned).map(s=>({s, d:skillLastPracticed(s)})).sort((a,b)=>daysSince(b.d)-daysSince(a.d))[0];
  if(sk) out.push({k:'Longest-untouched skill', v:sk.s.name, d:`last practiced ${relDays(daysSince(sk.d))}`, go:'#/skills/'+sk.s.id});
  const pr = S.projects.filter(p=>p.status==='active').map(p=>({p, last:projectNods(p)[0]?.date})).sort((a,b)=>daysSince(b.last)-daysSince(a.last))[0];
  if(pr) out.push({k:'Coldest project', v:pr.p.name, d:`last nod ${relDays(daysSince(pr.last))}`, go:'#/projects/'+pr.p.id});
  const y = S.checkins[addDays(today(),-1)]; out.push({k:"Yesterday's intention", v:y?.intention || '—', d:y?.intention ? 'did you give it attention?' : 'no intention was set yesterday', go:'#/today'});
  const bal = energyBalance(true); const imb = DIMS.map(d=>({d, diff:bal[d.id].exp - bal[d.id].rec, ...bal[d.id]})).sort((a,b)=>Math.abs(b.diff)-Math.abs(a.diff))[0];
  if(imb) out.push({k:'Oscillation check', v:`${imb.d.name}: ${imb.diff>0?'overtraining':imb.diff<0?'undertraining':'balanced'}`, d:`${imb.exp} expenditure · ${imb.rec} recovery this week`, go:'#/rituals'});
  return out;
}
function onThisDay(){ const d = parseDay(today()); const md_ = x => { const dd = parseDay(x); return {m:dd.getMonth(), d:dd.getDate(), y:dd.getFullYear()}; }; return S.entries.filter(e => /^\d{4}-\d{2}-\d{2}/.test(e.occurredAt||'') && (()=>{ const o = md_(e.occurredAt.slice(0,10)); if(o.y >= d.getFullYear()) return false; const a = new Date(d.getFullYear(), o.m, o.d); return Math.abs((a - d)/DAY) <= 3; })()).sort((a,b)=>occurredSort(b)-occurredSort(a)); }
function gentlePrompt(){
  const ps = [];
  const sync = S.entries.filter(e=>e.type==='synchronicity').sort((a,b)=>b.createdAt<a.createdAt?-1:1);
  const syncDays = sync.length ? daysSince(sync[0].createdAt.slice(0,10)) : 999;
  if(syncDays > 21) ps.push(`Your Synchronicity journal has been quiet for ${Math.round(syncDays/7)} weeks — noticed anything strange lately?`);
  const g = valueGaps()[0]; if(g) ps.push(`Your ${g.name} value is at ${g.congruence}%. What would 5% more ${g.name.toLowerCase()} look like this week?`);
  S.visions.filter(v=>v.confidence!=='lived').forEach(v => { const {lastTended} = vividness(v); if(lastTended > 40) ps.push(`You haven't tended <em>${esc(v.name)}</em> in ${lastTended} days. Is it resting, or have you let it go?`); });
  const otd = onThisDay()[0]; if(otd) ps.push(`Last year on this day, you wrote: <em>“${esc((otd.body||otd.title).slice(0,120))}…”</em> Does it still feel true?`);
  const sps = lastDays(14).map(d=>S.checkins[d]?.setpoint).filter(Boolean); if(sps.length>5){ const m = avg(sps); if(m<15) ps.push(`Your emotional set-point has been around <em>${hicksName(m).split(' / ')[0]}</em> for two weeks. Abraham says: you can't jump to Joy, but can you reach for <em>${hicksName(m+2).split(' / ')[0]}</em> today?`); }
  const revisit = S.entries.filter(e=>e.type==='synchronicity' && e.extra?.revisit); if(revisit.length) ps.push(`A synchronicity you flagged to revisit: <em>${esc(revisit[Math.floor(Math.random()*revisit.length)].title)}</em>. Does it make more sense now?`);
  const q = S.entries.filter(e=>e.type==='question' && !(e.extra?.answers||[]).length); if(q.length) ps.push(`An open question you're living with: <em>${esc(q[Math.floor(Math.random()*q.length)].title)}</em>`);
  const generic = ["What are you afraid to want?","What did you learn this week that surprised you?","What is one thing you're avoiding?","What self-image are you acting out today — and is it the one you chose?","Maltz says: <em>“If you can remember, worry, or tie your shoe, you can succeed.”</em> What are you worrying about that could be redirected into positive visualization?","Fritz asks: What result do you want to create? And what is the current reality? Hold both. The tension will resolve.","Loehr asks: which energy dimension did you not renew today?","Leonard asks: where is your plateau right now, and can you love it?","Which value did today's choices actually serve?"];
  const pool = ps.length ? ps.concat(generic.slice(0,2)) : generic;
  const idx = (parseInt(today().replace(/-/g,''),10) + (S._promptShift||0)) % pool.length;
  return pool[idx];
}

/* ============================================================
   SHARED COMPONENTS
   ============================================================ */
function linkChips(e, {click=true}={}){
  const out = [];
  (e.links?.stages||[]).forEach(id => { const s = byId(S.stages,id); if(s) out.push(`<span class="chip on ${click?'click':''}" style="--c:${s.hue}" data-go="#/stage/${s.id}"><span class="dot"></span>${s.char} ${esc(s.name)}</span>`); });
  (e.links?.threads||[]).forEach(id => { const t = byId(S.threads,id); if(t) out.push(`<span class="chip on ${click?'click':''}" style="--c:${t.color}" data-go="#/timeline/threads"><span class="dot"></span>${esc(t.name)}</span>`); });
  (e.links?.values||[]).forEach(x => { const v = byId(S.values,x.id); if(v) out.push(`<span class="chip on ${click?'click':''}" style="--c:${v.color}" data-go="#/value/${v.id}"><span class="pol">${x.pol||'+'}</span>${esc(v.name)}</span>`); });
  (e.links?.visions||[]).forEach(id => { const v = byId(S.visions,id); if(v) out.push(`<span class="chip on ${click?'click':''}" style="--c:var(--sage)" data-go="#/vision/${v.id}">🌿 ${esc(v.name)}</span>`); });
  (e.links?.skills||[]).forEach(id => { const s = byId(S.skills,id); if(s) out.push(`<span class="chip on ${click?'click':''}" style="--c:var(--ment)" data-go="#/skills/${s.id}">🛠 ${esc(s.name)}</span>`); });
  (e.links?.projects||[]).forEach(id => { const p = byId(S.projects,id); if(p) out.push(`<span class="chip on ${click?'click':''}" style="--c:var(--terra)" data-go="#/projects/${p.id}">🎨 ${esc(p.name)}</span>`); });
  (e.people||[]).forEach(p => out.push(`<span class="chip">@ ${esc(p)}</span>`));
  (e.places||[]).forEach(p => out.push(`<span class="chip">⌖ ${esc(p)}</span>`));
  (e.emotions||[]).forEach(p => out.push(`<span class="chip">~ ${esc(p)}</span>`));
  return out.join('');
}
document.addEventListener('click', e => { const c = e.target.closest('[data-go]'); if(c && !e.target.closest('.ed')){ e.preventDefault(); closeModals(); navigate(c.dataset.go); } });
function entryExtraHTML(e){
  const x = e.extra||{}; const rows = [];
  if(e.type==='synchronicity'){ if(x.preceded) rows.push(`<div><span class="mono">what preceded it</span><br>${esc(x.preceded)}</div>`); if(x.read) rows.push(`<div><span class="mono">what I read into it</span><br>${esc(x.read)}</div>`); if(x.revisit) rows.push(`<span class="status-pill">revisit later</span>`); }
  if(e.type==='manifestation'){ rows.push(`<span class="status-pill">${esc(x.status||'held')}</span>`); (x.evidence||[]).forEach(ev => rows.push(`<div class="evidence-item"><span class="mono">${fmtDate(ev.date,'med')}</span><span>${esc(ev.text)}</span></div>`)); }
  if(e.type==='dream'){ rows.push(`<span class="status-pill">vividness ${'●'.repeat(x.vivid||0)}${'○'.repeat(5-(x.vivid||0))}</span> ${x.recurring?'<span class="status-pill">recurring</span>':''} ${(x.symbols||[]).map(s=>`<span class="chip">${esc(s)}</span>`).join(' ')}`); }
  if(e.type==='quote'){ rows.push(`<div class="mono">— ${esc(x.author||'')}${x.source?', <em>'+esc(x.source)+'</em>':''}${x.page?' · '+esc(x.page):''}${x.link?` · <a href="${esc(x.link)}" target="_blank" rel="noopener">↗ link</a>`:''}</div>`); if(x.why) rows.push(`<div><span class="mono">why this caught me</span><br>${esc(x.why)}</div>`); }
  if(e.type==='question'){ const ans = x.answers||[]; rows.push(`<div class="answer-log">${ans.length? ans.map(a=>`<div class="a"><span class="mono">${fmtDate(a.date,'med')}</span> · ${esc(a.text)}</div>`).join('') : '<div class="a faint">no answer yet — still living with it</div>'}<button class="tbtn" data-answer="${e.id}">+ add an answer</button></div>`); }
  if(e.type==='progress' && x.duration) rows.push(`<span class="status-pill">${x.duration} min</span>`);
  if(e.type==='memory' && x.installed) rows.push(`<div class="installed"><div class="k" style="font-family:var(--mono);font-size:.62rem;text-transform:uppercase;letter-spacing:.1em;color:var(--terra)">what this installed in me</div>${esc(x.installed)}</div>`);
  return rows.length ? `<div class="stack" style="gap:6px;margin-top:8px;font-size:.85rem">${rows.join('')}</div>` : '';
}
function entryCard(e, {clamp:cl=true, tools=true}={}){
  const q = e.type==='quote';
  return `<article class="entry rv" data-entry="${e.id}">
    <div class="meta"><span class="mono">${typeIcon(e.type)} ${typeName(e.type)}</span><span class="mono">${esc(fmtDate(e.occurredAt,'med'))}</span>${e.confidence?`<span class="status-pill">${esc(e.confidence)}</span>`:''}${tools?`<span class="tools"><button class="tbtn" data-edit="${e.id}">edit</button></span>`:''}</div>${tools?`<button class="del-x" data-del="${e.id}" title="delete" aria-label="delete entry">×</button>`:''}
    ${e.title?`<div class="title">${esc(e.title)}</div>`:''}
    ${e.body?`<div class="body ${cl?'clamp':''} ${q?'quote':''}">${q?'“'+esc(e.body)+'”':md(e.body)}</div>`:''}
    ${e.media?.length?`<div class="thumbs">${e.media.map(m=>`<div class="photo" style="width:88px;height:88px;cursor:zoom-in" data-lb="${m.id}"><img src="${m.src}" alt="${esc(m.caption)}"></div>`).join('')}</div>`:''}
    ${entryExtraHTML(e)}
    ${tagChips(e)}
    <div class="links">${linkChips(e)}</div>
  </article>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('.entry .body.clamp'); if(b){ b.classList.remove('clamp'); }
  const ed_ = e.target.closest('[data-edit]'); if(ed_){ openEntryModal({entryId: ed_.dataset.edit}); }
  const del = e.target.closest('[data-del]'); if(del){ e.stopPropagation(); const ent = byId(S.entries, del.dataset.del); if(ent) requestDelete({label: ent.title || typeName(ent.type), node: del.closest('.entry, .formative'), remove: () => spliceOut(S.entries, x => x.id === ent.id)}); }
  const lb = e.target.closest('[data-lb]'); if(lb){ const img = lb.querySelector('img'); lightbox(img.src, img.alt); }
  const an = e.target.closest('[data-answer]'); if(an){ const ent = byId(S.entries, an.dataset.answer); const m = openModal(`<h2>An answer, for now</h2><p class="quote">${esc(ent.title)}</p><textarea class="ta" id="ansText" placeholder="It doesn't have to be final."></textarea><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="ansSave">Add answer</button></div>`,'narrow'); m.querySelector('#ansSave').onclick = () => { const t = m.querySelector('#ansText').value.trim(); if(!t) return; ent.extra.answers = ent.extra.answers||[]; ent.extra.answers.push({date:today(), text:t}); saveNow(); m.remove(); rerender(); sound('save'); }; }
});
function sortEntries(arr){ return [...arr].sort((a,b)=>occurredSort(b)-occurredSort(a) || (b.createdAt<a.createdAt?-1:1)); }
function stageChip(s){ return `<span class="chip on click" style="--c:${s.hue}" data-go="#/stage/${s.id}"><span class="dot"></span>${s.char} ${esc(s.name)}</span>`; }
