/* ============================================================
   5. VALUES CONGRUENCE — the compass beneath the floorboards
   ============================================================ */
routes.values = function(root){
  registerPageEntry({pageName:'Values', addLabel:'New snapshot', defaultEntryType:'snapshot', prefilledFields:{}, options:[
    {icon:'◔', label:'Congruence snapshot', desc:'Score each value 0–100 for this week.', run:()=>EntryActions.snapshot()},
    ...(S.values.length < 10 ? [{icon:'✦', label:'New value', desc:`The compass has ${S.values.length} of 10 points.`, run:()=>EntryActions.newValue()}] : [])]});
  const snaps = allSnapshotsWithRetro(); const latest = snaps.slice(-1)[0];
  const axes = S.valueOrder.map(id=>{ const v=byId(S.values,id); return {name:v.name, short:v.name.split(' ')[0], color:v.color}; });
  const gaps = valueGaps();
  const cur = latest ? avg(S.valueOrder.map(id => latest.ratings[id] ?? 0)) : null;
  const prev = snaps.length > 1 ? avg(S.valueOrder.map(id => snaps[snaps.length-2].ratings[id] ?? 0)) : null;
  const drift = (cur !== null && prev !== null) ? Math.round(cur - prev) : null;
  const age = latest ? daysSince(latest.date) : null;
  root.innerHTML = `<div class="page">
    <div class="page-head"><h1>Values</h1></div>

    ${S.valueOrder.length ? `
    <!-- 2. the four numbers worth knowing -->
    <div class="card rv" style="margin:22px 0"><div class="income-strip">
      <div><div class="k">congruence now</div><div class="num">${cur===null?'—':Math.round(cur)}</div><div class="mono">average across ${S.valueOrder.length} values</div></div>
      <div><div class="k">since last reading</div><div class="num" style="color:${drift===null?'var(--muted)':drift>2?'var(--sage)':drift<-2?'#c25b5b':'var(--muted)'}">${drift===null?'—':(drift>0?'+':'')+drift}</div><div class="mono">${drift===null?'need two readings':drift>2?'rising':drift<-2?'slipping':'steady'}</div></div>
      <div><div class="k">widest gap</div><div class="num" style="color:${gaps[0]?gaps[0].color:'var(--muted)'}">${gaps[0]?(gaps[0].gap>0?'+':'')+gaps[0].gap:'—'}</div><div class="mono">${gaps[0]?esc(gaps[0].name):''}</div></div>
      <div><div class="k">last reading</div><div class="num">${age===null?'—':age===0?'today':age+'d'}</div><div class="mono">${age===null?'never taken':age>14?'going stale':'fresh enough'}</div></div>
    </div>
    <div class="row" style="margin-top:14px;gap:8px;flex-wrap:wrap"><button class="btn sm primary" id="takeSnap">Take a snapshot</button>${gaps[0] ? `<a class="btn sm ghost" href="#/value/${gaps[0].id}">open ${esc(gaps[0].name)}</a>` : ''}</div></div>

    <!-- 3. one table that is priority, congruence, gap and trend at once -->
    <section class="section rv"><div class="row between"><span class="sc" style="margin:0">The compass</span><span class="mono">drag to re-rank · ${S.valueOrderHistory.length} re-rankings</span></div>
      <p class="muted" style="font-size:.85rem">Ranked by what you say matters. The bar is where your days actually are; the number on the right is the distance between the two.</p>
      <ul class="compass-list" id="valuesList">${S.valueOrder.map((id,i)=>{ const v = byId(S.values,id); const c = valueCurrent(id); const g = gaps.find(x=>x.id===id); const hist = snaps.map(s=>s.ratings[id]??null);
        return `<li draggable="true" data-vid="${id}" style="--c:${v.color}">
          <span class="rank">${i+1}</span>
          <span class="nm"><a href="#/value/${id}">${esc(v.name)}</a></span>
          <span class="spark">${sparkline(hist,{h:26,min:0,max:100,color:v.color})}</span>
          <span class="bar"><i style="width:${c}%"></i></span>
          <span class="pct" data-tween="${c}">0</span>
          <span class="gapn ${g.gap>12?'wide':g.gap<-12?'over':''}" title="stated priority minus lived congruence">${g.gap>0?'+':''}${g.gap}</span>
          <span class="faint grip">⋮</span></li>`; }).join('')}</ul>
      <details style="margin-top:10px"><summary><span class="mono">how the ranking has changed</span></summary><div class="body">${[...S.valueOrderHistory].reverse().map(h=>`<div class="mono" style="padding:6px 0;border-top:1px dashed var(--line)">${fmtDate(h.date,'med')} · ${h.order.map(id=>byId(S.values,id)?.name.split(' ')[0]).join(' › ')}</div>`).join('')||'<div class="faint mono" style="padding:6px 0">No re-rankings yet.</div>'}</div></details>
    </section>

    <!-- 4. the one picture: the shape, over time -->
    ${snaps.length ? `<section class="section rv"><div class="row between"><span class="sc" style="margin:0">The shape of a life</span><span class="mono">drag the slider to walk back through your readings</span></div>
      <div class="grid c2" style="align-items:start;margin-top:12px">
        <div class="card"><div id="radarBox">${radar(axes,[{vals:S.valueOrder.map(id=>latest?.ratings[id]??0),color:'var(--page-accent)'}],{size:340})}</div>
          <div class="time-slider"><input type="range" class="slider" min="0" max="${snaps.length-1}" value="${snaps.length-1}" id="timeSlider"><div class="lbl"><span>${snaps[0]?fmtDate(snaps[0].date,'med'):''}</span><span id="tsLbl">${latest?fmtDate(latest.date,'med'):''}</span><span>now</span></div><div class="quote" id="tsNote" style="font-size:.9rem;margin-top:6px;min-height:1.5em">${esc(latest?.note||'')}</div></div></div>
        <div><span class="sc">Readings</span><div id="snapHistory" style="margin-top:10px"><div class="empty">Loading…</div></div></div>
      </div></section>` : ''}

    ` : `<div class="empty rv">The compass has no points yet. Add the handful of words you would want said about how you lived — five is plenty to start.</div>`}
  </div>`;

  if(!S.valueOrder.length) return;
  const list = $('#valuesList'); let dragId = null;
  list.querySelectorAll('li').forEach(li => { li.addEventListener('dragstart', ()=>{ dragId = li.dataset.vid; li.classList.add('dragging'); }); li.addEventListener('dragend', ()=>li.classList.remove('dragging')); li.addEventListener('dragover', e=>{ e.preventDefault(); li.classList.add('over'); }); li.addEventListener('dragleave', ()=>li.classList.remove('over')); li.addEventListener('drop', e=>{ e.preventDefault(); li.classList.remove('over'); if(!dragId || dragId===li.dataset.vid) return; const o = S.valueOrder.filter(x=>x!==dragId); o.splice(o.indexOf(li.dataset.vid),0,dragId); S.valueOrderHistory.push({date:today(),order:[...S.valueOrder]}); S.valueOrder = o; saveNow(); rerender(); toast('Priorities re-ranked. The previous order is kept.'); }); });
  $('#takeSnap').onclick = () => openSnapshotModal(() => rerender());
  const ts = $('#timeSlider');
  if(ts){ renderSnapshotHistory($('#snapHistory'));
    ts.oninput = () => { const s = snaps[+ts.value]; $('#radarBox').innerHTML = radar(axes,[{vals:S.valueOrder.map(id=>s.ratings[id]??0),color:s.retro?(byId(S.stages,s.stageId)?.hue||'var(--page-accent)'):'var(--page-accent)'}],{size:340}); $('#tsLbl').textContent = fmtDate(s.date,'med'); $('#tsNote').textContent = s.note||''; };
  }
};
/* ---------- the reading: what the numbers mean, in sentences ---------- */
function deleteValue(v, node, after){
  requestDelete({label: v.name, node, after, remove: () => {
    const touched = S.entries.filter(e => (e.links?.values||[]).some(x => x.id === v.id)); const rl = snapshotLinks(touched); touched.forEach(e => e.links.values = e.links.values.filter(x => x.id !== v.id));
    const habits = S.habits.filter(h => (h.links?.values||[]).includes(v.id)); habits.forEach(h => h.links.values = h.links.values.filter(id => id !== v.id));
    const orderIdx = S.valueOrder.indexOf(v.id); S.valueOrderHistory.push({date: today(), order: [...S.valueOrder]}); S.valueOrder = S.valueOrder.filter(id => id !== v.id);
    const back = spliceOut(S.values, x => x.id === v.id);
    return () => { back(); rl(); vis.forEach(x => x.values.push(v.id)); habits.forEach(h => h.links.values.push(v.id)); S.valueOrder.splice(Math.min(orderIdx, S.valueOrder.length), 0, v.id); S.valueOrderHistory.pop(); };
  }});
}
async function lastSnapshotFromDB(){
  try { const rows = await db.valueSnapshots.toArray(); rows.sort((a,b)=>a.date<b.date?1:-1); return rows[0] || null; } catch(e){ return latestSnapshot() || null; }
}
function scoreBand(n){ return n < 40 ? 'low' : n <= 70 ? 'mid' : 'high'; }
function deltaHTML(cur, prev){ if(prev === undefined || prev === null) return '<span class="delta none">·</span>'; const d = cur - prev; if(d > 0) return `<span class="delta up">↑+${d}</span>`; if(d < 0) return `<span class="delta down">↓−${Math.abs(d)}</span>`; return '<span class="delta same">→same</span>'; }
async function openSnapshotModal(after, existing=null){
  let last = null; try { last = await lastSnapshotFromDB(); } catch(e){ last = latestSnapshot() || null; }   // the last snapshot, read from the database
  const ref = existing || last;
  const base = {};
  S.valueOrder.forEach(id => { base[id] = ref ? (ref.ratings[id] ?? 50) : 50; });
  const m = openModal(`<h2>${existing?'Edit snapshot':'Congruence snapshot'}</h2><p class="muted">${existing?`Taken ${fmtDate(existing.date,'med')}. Adjust a value to change it; notes stay editable below.`:`0–100 for each value. Not aspiration — where you actually are, this week.${last?` Sliders start where you left them on ${fmtDate(last.date,'med')}; move one and a note opens beneath it.`:''}`}</p>${existing?`<div class="field" style="margin-bottom:10px"><label>Date</label><input class="inp" type="date" id="snapDate" value="${existing.date}"></div>`:''}
    <div class="snapshot-form">${S.valueOrder.map(id=>{ const v=byId(S.values,id); return `<div class="sv-block" data-svb="${id}" style="--c:${v.color}"><div class="r"><span class="n" style="color:${v.color}">${esc(v.name)}</span><input type="range" class="slider" min="0" max="100" value="${base[id]}" data-sv="${id}" style="--c:${v.color}"><span class="mono" data-svl="${id}">${base[id]}</span></div>
      <div class="sv-note" data-svn="${id}" style="height:0" aria-hidden="true"><textarea class="ta" rows="2" data-svt="${id}" placeholder="What's driving this score today?" disabled tabindex="-1">${esc(existing?.notes?.[id]||'')}</textarea></div></div>`; }).join('')}</div>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="snapSave">${existing?'Save changes':'Take snapshot'}</button></div>`);
  if(existing) Object.keys(existing.notes||{}).forEach(id => { const note = m.querySelector(`[data-svn="${id}"]`); if(note){ note.classList.add('open'); note.style.height='auto'; note.setAttribute('aria-hidden','false'); const ta = note.querySelector('textarea'); ta.disabled=false; ta.tabIndex=0; } });
  const openNote = (note) => { if(note.classList.contains('open')) return; const ta = note.querySelector('textarea'); note.classList.add('open'); note.setAttribute('aria-hidden','false'); ta.disabled = false; ta.tabIndex = 0;
    if(reduced()){ note.style.height = 'auto'; return; }
    note.style.height = '0px'; requestAnimationFrame(() => { note.style.height = note.scrollHeight + 'px'; }); note.addEventListener('transitionend', () => { if(note.classList.contains('open')) note.style.height = 'auto'; }, {once:true}); };
  const closeNote = (note) => { if(!note.classList.contains('open')) return; const ta = note.querySelector('textarea'); ta.value = ''; ta.disabled = true; ta.tabIndex = -1; note.setAttribute('aria-hidden','true');   // collapse and discard
    note.classList.remove('open'); if(reduced()){ note.style.height = '0px'; return; } note.style.height = note.scrollHeight + 'px'; requestAnimationFrame(() => { note.style.height = '0px'; }); };
  const onMove = r => { const id = r.dataset.sv; const cur = +r.value; m.querySelector(`[data-svl="${id}"]`).innerHTML = `${cur}${cur!==base[id] ? ' ' + deltaHTML(cur, base[id]) : ''}`;
    const block = m.querySelector(`[data-svb="${id}"]`), note = m.querySelector(`[data-svn="${id}"]`); const changed = cur !== base[id];
    block.classList.toggle('changed', changed); if(changed) openNote(note); else closeNote(note); };
  m.querySelectorAll('[data-sv]').forEach(r => { r.addEventListener('input', () => onMove(r)); r.addEventListener('change', () => onMove(r)); });
  m.querySelector('#snapSave').onclick = e => {
    const ratings = {}, notes = {};
    m.querySelectorAll('[data-sv]').forEach(r => { const id = r.dataset.sv; ratings[id] = +r.value; const open = m.querySelector(`[data-svn="${id}"]`).classList.contains('open'); if(+r.value !== base[id] || (existing && open)){ const t = m.querySelector(`[data-svt="${id}"]`).value.trim(); if(t) notes[id] = t; } });
    if(existing){ Object.assign(existing, {ratings, notes, date: m.querySelector('#snapDate').value || existing.date}); } else S.valueSnapshots.push({id:uid(), date:today(), ratings, notes, note:''}); saveNow();
    ripple(e.clientX,e.clientY,'var(--terra)'); sound('success'); m.remove(); toast('Snapshot taken.'); after ? after() : rerender();
  };
}

/* ---------- snapshot history: trend chart + newest-first timeline ---------- */
function trendChartSVG(snaps, {w=720, h=220}={}){
  if(snaps.length < 2) return `<div class="empty">Two snapshots make a trend. Take another next week.</div>`;
  const padL = 34, padR = 12, padT = 12, padB = 26; const t0 = parseDay(snaps[0].date).getTime(), t1 = parseDay(snaps.slice(-1)[0].date).getTime(); const span = Math.max(t1 - t0, DAY);
  const X = d => padL + ((parseDay(d).getTime() - t0)/span)*(w - padL - padR); const Y = v => padT + (1 - v/100)*(h - padT - padB);
  let g = ''; [0,25,50,75,100].forEach(v => { g += `<line x1="${padL}" x2="${w-padR}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="var(--line)"/><text x="${padL-6}" y="${(Y(v)+3).toFixed(1)}" text-anchor="end">${v}</text>`; });
  const lastX = X(snaps.slice(-1)[0].date); let prevX = -Infinity; const MIN = 78;
  snaps.forEach((s,i) => { const x = X(s.date); const isLast = i === snaps.length-1; if(!isLast && (x - prevX < MIN || lastX - x < MIN)) return; prevX = x; g += `<text x="${x.toFixed(1)}" y="${h-8}" text-anchor="${i===0?'start':isLast?'end':'middle'}">${fmtDate(s.date,'short')}${i===0||isLast?' '+s.date.slice(0,4):''}</text>`; });
  S.valueOrder.forEach(id => { const v = byId(S.values,id); const pts = snaps.filter(s => s.ratings[id] != null).map(s => [X(s.date), Y(s.ratings[id]), s]); if(!pts.length) return;
    g += `<polyline class="trend-line" data-v="${id}" points="${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="none" stroke="${v.color}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`;
    g += pts.map(p => `<circle class="trend-dot" data-v="${id}" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="${v.color}"><title>${esc(v.name)} · ${fmtDate(p[2].date,'med')} · ${p[2].ratings[id]}</title></circle>`).join(''); });
  return `<svg class="trend" viewBox="0 0 ${w} ${h}" width="100%" style="display:block;overflow:visible">${g}</svg>`;
}
async function renderSnapshotHistory(container){
  let rows = []; try { rows = await db.valueSnapshots.toArray(); } catch(e){ rows = S.valueSnapshots; }   // read from the database on mount
  const asc = [...rows].sort((a,b)=>a.date<b.date?-1:1); const desc = [...asc].reverse();
  const prevOf = s => { const i = asc.indexOf(s); return i > 0 ? asc[i-1] : null; };
  container.innerHTML = `<div class="card" style="padding:18px 20px"><div class="row between" style="margin-bottom:8px"><span class="sc" style="margin:0">Trend — every value over time</span><div class="legend" id="trendLegend">${S.valueOrder.map(id=>{ const v=byId(S.values,id); return `<span style="--c:${v.color};cursor:pointer" data-tl="${id}">${esc(v.name.split(' ')[0])}</span>`; }).join('')}</div></div>${trendChartSVG(asc)}</div>
    <div class="snap-list" id="snapList">${desc.length ? desc.map(s => { const prev = prevOf(s); const n = s.notes ? Object.keys(s.notes).length : 0; return `<div class="snap-row" data-snap="${s.id}">
      <div class="snap-head"><span class="snap-date"><b class="serif">${fmtDate(s.date,'med')}</b><span class="mono">${relDays(daysSince(s.date))}${n?` · ${n} note${n>1?'s':''}`:''}${s.note?' · note':''}</span></span>
        <span class="row" style="gap:6px;justify-content:flex-end"><button class="del-x inline" data-snapdel="${s.id}" title="delete snapshot">×</button><span class="mono snap-chev">›</span></span></div>
      <div class="snap-detail"><div class="snap-detail-inner"><div class="row" style="justify-content:flex-end"><button class="tbtn" data-snapedit="${s.id}">edit this snapshot</button></div>${S.valueOrder.map(id=>{ const v=byId(S.values,id); const sc = s.ratings[id] ?? 0; const note = s.notes?.[id]; return `<div class="snap-val"><span style="color:${v.color}">${esc(v.name)}</span><div class="bar" style="--c:${v.color}"><i style="width:${sc}%"></i></div><span class="mono">${sc}</span>${deltaHTML(sc, prev?.ratings[id])}${note?`<div class="snap-note">“${esc(note)}”</div>`:''}</div>`; }).join('')}${s.note?`<div class="quote" style="margin-top:10px">${esc(s.note)}</div>`:''}</div></div>
    </div>`; }).join('') : '<div class="empty">No snapshots yet. Take the first one.</div>'}</div>`;
  container.querySelectorAll('.snap-head').forEach(h => h.onclick = e => { if(e.target.closest('.del-x')) return; h.parentElement.classList.toggle('open'); });
  container.querySelectorAll('[data-snapedit]').forEach(b => b.onclick = e => { e.stopPropagation(); openSnapshotModal(() => rerender(), byId(S.valueSnapshots, b.dataset.snapedit)); });
  container.querySelectorAll('[data-snapdel]').forEach(b => b.onclick = e => { e.stopPropagation(); const snap = byId(S.valueSnapshots, b.dataset.snapdel); if(!snap) return; requestDelete({label: `Snapshot ${fmtDate(snap.date,'med')}`, node: b.closest('.snap-row'), remove: () => spliceOut(S.valueSnapshots, x => x.id === snap.id)}); });
  container.querySelectorAll('[data-tl]').forEach(l => { l.onmouseenter = () => { container.querySelectorAll('.trend-line,.trend-dot').forEach(x => x.style.opacity = x.dataset.v === l.dataset.tl ? '1' : '.12'); }; l.onmouseleave = () => container.querySelectorAll('.trend-line,.trend-dot').forEach(x => x.style.opacity = ''); });
}
routes.value = function(root, params){
  const v = byId(S.values, params[0]); if(!v){ navigate('#/values'); return; }
  registerPageEntry({pageName:'Values', addLabel:`Evidence for ${v.name}`, defaultEntryType:'reflection', prefilledFields:{links:{values:[{id:v.id,pol:'+'}]}}, options:[{label:'Evidence', run:(pre)=>openEntryModal({type:'reflection', allowedTypes:['reflection','memory','gratitude'], heading:`Evidence for ${v.name}`, links:pre.links, openLinks:true})}]});
  const snaps = allSnapshotsWithRetro(); const es = sortEntries(S.entries.filter(e=>(e.links?.values||[]).some(x=>x.id===v.id)));
  const rank = S.valueOrder.indexOf(v.id)+1; const cur = valueCurrent(v.id);
  const F = (k, q, hint) => { const hist = v.fields[k]||[]; const latest = hist.slice(-1)[0]; return `<div class="value-field rv"><div class="q">${q}</div><div class="faint" style="font-size:.8rem;margin-bottom:8px">${hint}</div><div class="prose serif-lg">${latest?md(latest.text):'<span class="empty">Not yet written.</span>'}</div><div class="row" style="margin-top:8px"><button class="btn sm ghost" data-vf="${k}">${latest?'write a new version':'write'}</button>${hist.length>1?`<details style="border:none;flex:1"><summary><span class="mono">${hist.length-1} earlier versions</span></summary><div class="body versions">${hist.slice(0,-1).map((h,i)=>`<div class="v"><div class="mono">${fmtDate(h.date,'med')}</div>${md(h.text)}<button class="del-x" data-vfdel="${k}:${i}" title="delete this version">×</button></div>`).reverse().join('')}</div></details>`:latest?`<span class="mono">${fmtDate(latest.date,'med')}</span>`:''}</div></div>`; };
  root.innerHTML = `<div class="page narrow">
    <div class="page-head" style="margin-top:20px"><div class="mono">value · ranked #${rank} of ${S.valueOrder.length}</div><h1 style="color:${v.color}">${ed(`values.#${v.id}.name`)}</h1><div class="row" style="margin-top:12px"><div class="bar" style="flex:1;--c:${v.color}"><i style="width:${cur}%"></i></div><span class="num" data-tween="${cur}" data-suffix="%">0</span></div></div>
    <div class="card rv">${sparkline(snaps.map(s=>s.ratings[v.id]??null),{h:60,min:0,max:100,color:v.color,dots:true,labels:snaps.map(s=>`${fmtDate(s.date,'med')}: ${s.ratings[v.id]??'–'}${s.note?' — '+s.note:''}`)})}<div class="row between mono"><span>${snaps[0]?fmtDate(snaps[0].date,'med'):''}</span><span>congruence over a lifetime</span><span>now</span></div></div>
    ${F('embody','How would I know if I embody this value?','Observable, behavioural indicators. Not aspirations — evidence.')}
    ${F('hundred','What takes me to 100%?','What does full congruence actually look like, day to day?')}
    ${F('motivation','How do I increase my positive motivation for this value?','Strategies, reminders, environments, people.')}
    ${F('counterfeit','What counterfeits this value?','The cheap imitation that feels like the value but isn\'t. This field prevents self-deception.')}
    <section class="section rv"><div class="row between"><span class="sc">Evidence feed</span><span class="row"><button class="btn sm" data-pol="+">+ embodied</button><button class="btn sm" data-pol="-">− betrayed</button></span></div>
      ${es.map(e=>{ const pol = e.links.values.find(x=>x.id===v.id)?.pol||'+'; return `<div style="display:grid;grid-template-columns:28px 1fr;gap:8px"><span class="serif" style="font-size:1.5rem;color:${pol==='+'?'var(--sage)':'var(--rose)'};padding-top:14px">${pol==='+'?'+':'−'}</span>${entryCard(e)}</div>`; }).join('')||'<div class="empty">No entries tagged to this value yet.</div>'}</section>
    ${moreSection(`<div class="row" style="gap:20px"><div class="field"><label>Colour</label><input type="color" id="valColor" value="${v.color}" style="width:40px;height:28px;border:none;background:none;padding:0;cursor:pointer"></div></div>
      <div class="danger-zone"><span>A compass point, not a tag. Deleting it unlinks entries and habits from it.</span><button class="btn sm ghost danger" id="delValue">Delete this value</button></div>`, 'More about this value')}
  </div>`;
  root.querySelectorAll('[data-vfdel]').forEach(b => b.onclick = () => { const [k,i] = b.dataset.vfdel.split(':'); const h = v.fields[k][+i]; requestDelete({label: `Version from ${fmtDate(h.date,'med')}`, node: b.closest('.v'), remove: () => spliceOut(v.fields[k], x => x === h)}); });
  $('#delValue').onclick = () => deleteValue(v, null, () => navigate('#/values'));
  $('#valColor').onchange = e => { v.color = e.target.value; saveNow(); rerender(); };
  root.querySelectorAll('[data-vf]').forEach(b => b.onclick = () => { const k = b.dataset.vf; const latest = (v.fields[k]||[]).slice(-1)[0]; const m = openModal(`<h2>A new version</h2><textarea class="ta" id="vfText" style="min-height:160px">${esc(latest?.text||'')}</textarea><p class="faint" style="font-size:.78rem">The previous version is kept. Growth in self-understanding stays visible.</p><div class="row" style="justify-content:flex-end"><button class="btn primary" id="vfSave">Keep</button></div>`); m.querySelector('#vfSave').onclick = () => { const t = m.querySelector('#vfText').value.trim(); if(!t) return; v.fields[k] = v.fields[k]||[]; v.fields[k].push({date:today(),text:t}); saveNow(); m.remove(); rerender(); sound('save'); }; });
  root.querySelectorAll('[data-pol]').forEach(b => b.onclick = () => openEntryModal({type:'reflection', links:{values:[{id:v.id,pol:b.dataset.pol}]}}));

};

/* ============================================================
   PRACTICES — the small weekly behaviours under each value.
   A congruence score you invent from memory drifts. These are
   things you either did or did not do, and they give the score
   something to stand on: the snapshot arrives pre-filled with
   what you last said, and you adjust from there.
   ============================================================ */
function isoWeek(d = today()){ const x = parseDay(d); const day = (x.getDay()+6)%7; x.setDate(x.getDate()-day+3); const first = new Date(x.getFullYear(),0,4); const n = 1 + Math.round(((x - first)/DAY - 3 + ((first.getDay()+6)%7))/7); return `${x.getFullYear()}-W${pad(n)}`; }
