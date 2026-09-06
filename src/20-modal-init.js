/* ============================================================
   11. GLOBAL ADD ENTRY MODAL
   ============================================================ */
function openEntryModal({type='reflection', links={}, entryId=null, after=null, title='', occurredAt='', allowedTypes=null, heading='', openLinks=false}={}){
  const existing = entryId ? byId(S.entries, entryId) : null;
  const e = existing ? JSON.parse(JSON.stringify(existing)) : {id:uid(),type,title,body:'',occurredAt:occurredAt||today(),createdAt:new Date().toISOString(),media:[],links:Object.assign({stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[]}, links),people:[],places:[],emotions:[],tags:[],confidence:'',extra:{}};
  const types = (allowedTypes && !existing) ? ENTRY_TYPES.filter(([t]) => allowedTypes.includes(t)) : ENTRY_TYPES;
  const m = openModal(`<h2>${existing?'Edit entry':esc(heading || 'New '+typeName(e.type).toLowerCase())}</h2>
    <div class="typerow" id="typeRow" ${types.length<=1?'hidden':''}>${types.map(([t,n,i])=>`<button class="${e.type===t?'on':''}" data-t="${t}">${i} ${n}</button>`).join('')}</div>
    <div class="stack">
      <input class="inp serif-lg" id="eTitle" placeholder="Title (optional)" value="${esc(e.title)}">
      <textarea class="ta" id="eBody" placeholder="Body — markdown welcome. **bold**, *italic*, > quote, - list" style="min-height:120px">${esc(e.body)}</textarea>
      <div id="extraFields"></div>
      <div class="field" id="tagField" ${TAGGABLE.includes(e.type)?'':'hidden'}><label>Hashtags — one thread through many entries</label><input class="inp mono" id="eTags" value="${esc((e.tags||[]).map(t=>'#'+t).join(' '))}" placeholder="#kyoto #jazz #beginnings" list="tagList"><datalist id="tagList">${allTags().map(([t,n])=>`<option value="#${esc(t)}">${n}</option>`).join('')}</datalist><div class="faint" style="font-size:.74rem">Typing #something in the body works too.</div></div>
      <div class="field"><label>Occurred at</label><input class="inp" id="eWhen" value="${esc(e.occurredAt)}" placeholder="2024-09-14 · or “Summer 2019” · or “age 15”"><div class="faint" style="font-size:.74rem">Exact dates sort precisely; approximate ones sort by year. Memories can be logged today about decades ago.</div></div>
      <div class="field"><label>Media</label><div class="dropzone" id="eDrop">drop images here, or click to choose</div><input type="file" id="eFile" accept="image/*" multiple hidden><div class="thumbs" id="eThumbs"></div></div>
      <details ${(openLinks || Object.values(e.links).some(a=>a.length))?'open':''}><summary><span class="sc">Connect this entry</span><span class="mono" id="linkCount"></span></summary><div class="body stack" style="gap:12px">
        <div class="field"><label>Stages</label><div class="deps">${S.stages.map(s=>`<span class="chip click" style="--c:${s.hue}" data-lk="stages" data-id="${s.id}">${s.char} ${esc(s.name)}</span>`).join('')}</div></div>
        <div class="field" id="subField"><label>Sub-stages</label><div class="deps" id="subChips"></div></div>
        <div class="field"><label>Threads</label><div class="deps">${S.threads.map(t=>`<span class="chip click" style="--c:${t.color}" data-lk="threads" data-id="${t.id}">${esc(t.name)}</span>`).join('')}</div></div>
        <div class="field"><label>Values — click to link, click again to flip polarity, third click to unlink</label><div class="deps">${S.valueOrder.map(id=>{ const v=byId(S.values,id); return `<span class="chip click" style="--c:${v.color}" data-lk="values" data-id="${v.id}"><span class="pol"></span>${esc(v.name)}</span>`; }).join('')}</div></div>
        <div class="field"><label>Visions</label><div class="deps">${S.visions.map(v=>`<span class="chip click" style="--c:var(--sage)" data-lk="visions" data-id="${v.id}">🌿 ${esc(v.name)}</span>`).join('')}</div></div>
        <div class="field"><label>Skills</label><div class="deps">${S.skills.map(s=>`<span class="chip click" style="--c:var(--ment)" data-lk="skills" data-id="${s.id}">${esc(s.name)}</span>`).join('')}</div></div>
        <div class="field"><label>Projects</label><div class="deps">${S.projects.map(p=>`<span class="chip click" style="--c:var(--terra)" data-lk="projects" data-id="${p.id}">${esc(p.name)}</span>`).join('')}</div></div>
        <div class="grid c2" style="gap:8px"><div class="field" style="grid-column:1/-1"><label>People — tag anyone this involves</label><div class="deps" id="peopleChips">${(S.people||[]).map(p=>`<span class="chip click" style="--c:${PERSON_TIERS[p.tier][4]}" data-lk="people" data-id="${p.id}">${PERSON_TIERS[p.tier][0]} ${esc(p.name)}</span>`).join('')}<button type="button" class="chip click" id="eNewPerson" style="--c:var(--page-accent)">＋ someone new</button></div></div><div class="field"><label>Places</label><input class="inp" id="ePlaces" value="${esc(e.places.join(', '))}" list="placeList"><datalist id="placeList">${(S.places||[]).map(p=>`<option value="${esc(p)}">`).join('')}</datalist></div><div class="field"><label>Emotions</label><input class="inp" id="eEmo" value="${esc(e.emotions.join(', '))}"></div></div>
        <div class="field"><label>Confidence (for future-facing entries)</label><div class="ladder">${CONF.map(c=>`<button data-conf="${c}" class="${e.confidence===c?'on':''}">${c}</button>`).join('')}</div></div>
      </div></details>
      <div class="row between"><span class="faint" style="font-size:.78rem" id="linkNudge"></span><button class="btn primary" id="eSave" style="padding:12px 28px;font-size:1rem">${existing?'Save changes':'Save entry'}</button></div>
    </div>`, 'wide');
  const x = () => e.extra;
  const renderExtra = () => { const t = e.type; const box = m.querySelector('#extraFields'); const f = (k,label,ph,multi) => `<div class="field"><label>${label}</label>${multi?`<textarea class="ta" data-x="${k}" style="min-height:60px" placeholder="${esc(ph)}">${esc(x()[k]||'')}</textarea>`:`<input class="inp" data-x="${k}" value="${esc(x()[k]||'')}" placeholder="${esc(ph)}">`}</div>`;
    let html = '';
    if(t==='synchronicity') html = f('preceded','What preceded it','What were you thinking about, doing, asking?',true) + f('read','What I read into it','',true) + `<label class="toggle ${x().revisit?'on':''}" id="xRevisit"><span class="sw"></span><span>revisit later — resurface this in Today's prompts</span></label>`;
    if(t==='manifestation') html = `<div class="field"><label>Status</label><select class="sel" data-x="status">${['held','evidence appearing','arrived','released'].map(s=>`<option ${x().status===s?'selected':''}>${s}</option>`).join('')}</select></div>` + `<div class="field"><label>Evidence log</label><textarea class="ta" data-xlist="evidence" style="min-height:60px" placeholder="one piece of evidence per line">${esc((x().evidence||[]).map(v=>v.text).join('\n'))}</textarea></div>`;
    if(t==='dream') html = `<div class="field"><label>Vividness</label><div class="feeling">${[1,2,3,4,5].map(n=>`<button data-vivid="${n}" class="${x().vivid===n?'on':''}">${n}</button>`).join('')}</div></div><label class="toggle ${x().recurring?'on':''}" id="xRec"><span class="sw"></span><span>recurring</span></label>` + f('symbols_','Symbols / motifs','comma-separated');
    if(t==='quote') html = f('author','Author','') + f('source','Source','book, film, a person') + f('link','Saved link (optional)','https://…') + f('page','Page / location','') + f('why','Why this caught me (required)','',true);
    if(t==='question') html = `<div class="faint" style="font-size:.8rem">Put the question in the title. Answers accumulate over time from the journal view.</div>`;
    if(t==='progress'||t==='nod') html = f('duration','Duration (minutes)','45') + f('resources','Resources used','');
    if(t==='memory') html = f('installed','What this installed in me','The belief, fear, pattern, or capability this event left behind.',true);
    if(t==='letter') html = `<div class="faint" style="font-size:.8rem">A letter to a past self, a future self, or from one of them to now. Date it accordingly — a letter to next year sits at next year's date.</div>`;
    box.innerHTML = html;
    if(t==='dream') x().symbols_ = (x().symbols||[]).join(', '), box.querySelector('[data-x=symbols_]') && (box.querySelector('[data-x=symbols_]').value = x().symbols_);
    box.querySelector('#xRevisit')?.addEventListener('click', function(){ this.classList.toggle('on'); });
    box.querySelector('#xRec')?.addEventListener('click', function(){ this.classList.toggle('on'); });
    box.querySelectorAll('[data-vivid]').forEach(b => b.onclick = () => { x().vivid = +b.dataset.vivid; box.querySelectorAll('[data-vivid]').forEach(y=>y.classList.toggle('on', y===b)); });
  };
  renderExtra();
  m.querySelectorAll('#typeRow button').forEach(b => b.onclick = () => { e.type = b.dataset.t; m.querySelectorAll('#typeRow button').forEach(y=>y.classList.toggle('on', y===b)); if(e.type==='nod'){ m.remove(); openNodModal(); return; } renderExtra(); m.querySelector('#tagField').hidden = !TAGGABLE.includes(e.type); });
  const npBtn = m.querySelector('#eNewPerson');
  if(npBtn) npBtn.onclick = () => {
    const name = prompt('Who?'); if(!name || !name.trim()) return;
    const p = newPerson(name.trim()); S.people.push(p); saveNow();
    e.links.people = e.links.people || []; e.links.people.push(p.id);
    const chips = m.querySelector('#peopleChips');
    chips.insertAdjacentHTML('afterbegin', `<span class="chip click on" style="--c:${PERSON_TIERS[p.tier][4]}" data-lk="people" data-id="${p.id}">${PERSON_TIERS[p.tier][0]} ${esc(p.name)}</span>`);
    bindLk(chips.firstElementChild);
  };
  const syncChips = () => { m.querySelectorAll('[data-lk]').forEach(c => { const k = c.dataset.lk, id = c.dataset.id; const arr = e.links[k]; const hit = arr.find(v => (typeof v==='string'?v:v.id)===id); c.classList.toggle('on', !!hit); if(k==='values') c.querySelector('.pol').textContent = hit ? hit.pol : ''; }); const n = Object.values(e.links).reduce((a,b)=>a+b.length,0); m.querySelector('#linkCount').textContent = n ? `${n} linked` : ''; m.querySelector('#linkNudge').textContent = n ? '' : 'Consider linking this to a stage, a value, or a vision — that is how the house connects.'; const subs = e.links.stages.flatMap(sid => (byId(S.stages,sid)?.substages||[]).map(ss=>({...ss, hue:byId(S.stages,sid).hue}))); m.querySelector('#subField').style.display = subs.length?'':'none'; m.querySelector('#subChips').innerHTML = subs.map(ss=>`<span class="chip click ${e.links.substages.includes(ss.id)?'on':''}" style="--c:${ss.hue}" data-sub="${ss.id}">${esc(ss.name)}</span>`).join(''); m.querySelectorAll('[data-sub]').forEach(c => c.onclick = () => { const id = c.dataset.sub; e.links.substages = e.links.substages.includes(id) ? e.links.substages.filter(y=>y!==id) : [...e.links.substages,id]; syncChips(); }); };
  const bindLk = c => { c.onclick = () => { const k = c.dataset.lk, id = c.dataset.id; const arr = e.links[k]; if(k==='values'){ const i = arr.findIndex(v=>v.id===id); if(i<0) arr.push({id,pol:'+'}); else if(arr[i].pol==='+') arr[i].pol='−'; else arr.splice(i,1); } else { const i = arr.indexOf(id); if(i<0) arr.push(id); else arr.splice(i,1); } syncChips(); }; };
  m.querySelectorAll('[data-lk]').forEach(bindLk);
  syncChips();
  m.querySelectorAll('[data-conf]').forEach(b => b.onclick = () => { e.confidence = e.confidence===b.dataset.conf ? '' : b.dataset.conf; m.querySelectorAll('[data-conf]').forEach(y=>y.classList.toggle('on', y.dataset.conf===e.confidence)); });
  const thumbs = m.querySelector('#eThumbs'); const drawThumbs = () => { thumbs.innerHTML = e.media.map(md_=>`<div style="display:flex;flex-direction:column;gap:4px;width:120px"><img src="${md_.src}" style="width:120px;height:80px"><input class="inp" style="padding:3px 6px;font-size:.7rem" placeholder="caption" value="${esc(md_.caption)}" data-cap="${md_.id}"><input class="inp" style="padding:3px 6px;font-size:.7rem" placeholder="people" value="${esc((md_.people||[]).join(', '))}" data-ppl="${md_.id}"><button class="tbtn" data-rm="${md_.id}">remove</button></div>`).join(''); thumbs.querySelectorAll('[data-cap]').forEach(i=>i.oninput=()=>byId(e.media,i.dataset.cap).caption=i.value); thumbs.querySelectorAll('[data-ppl]').forEach(i=>i.oninput=()=>byId(e.media,i.dataset.ppl).people=i.value.split(',').map(s=>s.trim()).filter(Boolean)); thumbs.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{ e.media = e.media.filter(y=>y.id!==b.dataset.rm); drawThumbs(); }); }; drawThumbs();
  const dz = m.querySelector('#eDrop'); dz.onclick = () => m.querySelector('#eFile').click(); m.querySelector('#eFile').onchange = ev => readImages(ev.target.files, img => { e.media.push(img); drawThumbs(); }); dz.ondragover = ev => { ev.preventDefault(); dz.classList.add('over'); }; dz.ondragleave = () => dz.classList.remove('over'); dz.ondrop = ev => { ev.preventDefault(); dz.classList.remove('over'); readImages(ev.dataTransfer.files, img => { e.media.push(img); drawThumbs(); }); };
  m.querySelector('#eSave').onclick = ev => {
    e.title = m.querySelector('#eTitle').value.trim(); e.body = m.querySelector('#eBody').value; e.occurredAt = m.querySelector('#eWhen').value.trim() || today();
    if(!e.title && !e.body){ toast('Write something first — even one line.'); return; }
    if(e.type==='quote' && !m.querySelector('[data-x=why]')?.value.trim()){ toast('“Why this caught me” is required for a quote.'); return; }
    e.tags = normTags((m.querySelector('#eTags')?.value || '').split(/[\s,]+/));
    m.querySelectorAll('[data-x]').forEach(i => e.extra[i.dataset.x] = i.value);
    m.querySelectorAll('[data-xlist]').forEach(i => { const old = e.extra[i.dataset.xlist]||[]; e.extra[i.dataset.xlist] = i.value.split('\n').map(s=>s.trim()).filter(Boolean).map(t => old.find(o=>o.text===t) || {date:today(),text:t}); });
    if(e.type==='synchronicity') e.extra.revisit = !!m.querySelector('#xRevisit')?.classList.contains('on');
    if(e.type==='dream'){ e.extra.recurring = !!m.querySelector('#xRec')?.classList.contains('on'); e.extra.symbols = (e.extra.symbols_||'').split(',').map(s=>s.trim()).filter(Boolean); delete e.extra.symbols_; }
    if(e.type==='question') e.extra.answers = e.extra.answers||[];
    const split = id => m.querySelector(id).value.split(',').map(s=>s.trim()).filter(Boolean);
    e.places = split('#ePlaces'); e.emotions = split('#eEmo'); e.people = (e.links.people||[]).map(id => byId(S.people,id)?.name).filter(Boolean);
    S.places = [...new Set([...(S.places||[]), ...e.places])];
    if(existing) Object.assign(existing, e); else S.entries.push(e);
    saveNow();
    const primary = e.links.values[0] ? byId(S.values,e.links.values[0].id)?.color : e.links.stages[0] ? byId(S.stages,e.links.stages[0])?.hue : e.links.visions[0] ? 'var(--sage)' : 'var(--terra)';
    ripple(ev.clientX, ev.clientY, primary); sound('success'); m.remove();
    toast(existing ? 'Entry updated.' : `${typeName(e.type)} saved${Object.values(e.links).some(a=>a.length)?' and connected.':'.'}`);
    if(after) after(); else rerender();
  };
  setTimeout(()=>m.querySelector(e.title?'#eBody':'#eTitle').focus(), 60);
}

/* ============================================================
   12. OMNI-SEARCH (⌘K)
   ============================================================ */
function openSearch(){
  const m = openModal(`<input id="palQ" placeholder="Search entries, visions, values, skills, projects, habits, sections…" autofocus><div class="results" id="palRes"></div>`, 'palette');
  const q = m.querySelector('#palQ'), res = m.querySelector('#palRes'); let sel = 0, items = [];
  const sections = [['Home','#/home'],['Today','#/today'],['Timeline','#/timeline'],['Threads & Tensions','#/timeline/threads'],['Vision Tree','#/vision'],['Values','#/values'],['Journals','#/journals'],['Skill Tree','#/skills'],['Creative Projects','#/projects'],['Rituals & Habits','#/rituals'],['Guided Reviews','#/rituals/reviews'],['Settings','#/settings']];
  const run = () => { const s = q.value.trim().toLowerCase(); const hit = t => !s || String(t).toLowerCase().includes(s); items = [];
    const grp = (name, arr) => { if(arr.length){ items.push({grp:name}); arr.slice(0,8).forEach(x=>items.push(x)); } };
    grp('Add', SPEED_DIAL.flatMap(it => it.actions ? it.actions.map(([l,fn]) => ({t:`${it.icon} ${it.zone} — ${l}`, m:'add', run:fn, key:it.zone+' '+l+' '+it.label})) : [{t:`${it.icon} ${it.label}`, m:'add', run:it.run, key:it.zone+' '+it.label}]).filter(x=>hit(x.key)));
    grp('Sections', sections.filter(([n])=>hit(n)).map(([n,go])=>({t:n,go,m:''})));
    grp('Stages', S.stages.filter(x=>hit(x.name+' '+x.char+' '+x.tagline)).map(x=>({t:`${x.char} ${x.name}`,go:'#/stage/'+x.id,m:x.years})));
    grp('Visions', S.visions.filter(x=>hit(x.name)).map(x=>({t:x.name,go:'#/vision/'+x.id,m:x.confidence})));
    grp('Values', S.values.filter(x=>hit(x.name)).map(x=>({t:x.name,go:'#/value/'+x.id,m:valueCurrent(x.id)+'%'})));
    grp('Skills', S.skills.filter(x=>hit(x.name)).map(x=>({t:x.name,go:'#/skills/'+x.id,m:'lvl '+x.currentLevel+' of '+skillLevelCount(x)})));
    grp('Projects', S.projects.filter(x=>hit(x.name+' '+(x.description||''))).map(x=>({t:x.name,go:'#/projects/'+x.id,m:x.status})));
    grp('Threads', S.threads.filter(x=>hit(x.name)).map(x=>({t:x.name,go:'#/timeline/threads',m:x.status})));
    grp('Habits', S.habits.filter(x=>!x.archived&&hit(x.name)).map(x=>({t:x.name,go:'#/rituals',m:x.dimension})));
    if(s) grp('Entries', sortEntries(S.entries.filter(x => !letterIsSealed(x)).filter(x=>hit(x.title+' '+x.body))).map(x=>({t:x.title||x.body.slice(0,80),go:'#/journals/'+x.type,m:typeName(x.type)+' · '+fmtDate(x.occurredAt,'med'),entry:x.id})));
    sel = 0; draw(); };
  const draw = () => { let i=0; res.innerHTML = items.map(x => x.grp ? `<div class="grp">${x.grp}</div>` : `<div class="res ${i===sel?'sel':''}" data-i="${i++}"><span class="t">${esc(x.t)}</span><span class="m">${esc(x.m)}</span></div>`).join('') || '<div class="empty" style="padding:18px 22px">Nothing found.</div>'; res.querySelectorAll('.res').forEach(r => r.onclick = () => go(+r.dataset.i)); res.querySelector('.res.sel')?.scrollIntoView({block:'nearest'}); };
  const go = i => { const list = items.filter(x=>!x.grp); const x = list[i]; if(!x) return; m.remove(); if(x.run){ x.run(); return; } if(x.entry){ navigate(x.go); setTimeout(()=>{ const n = document.querySelector(`[data-entry="${x.entry}"]`); if(n){ n.scrollIntoView({block:'center'}); n.style.background='color-mix(in srgb,var(--terra) 12%,transparent)'; setTimeout(()=>n.style.background='',1600); } },350); } else navigate(x.go); };
  q.oninput = run; q.onkeydown = ev => { const n = items.filter(x=>!x.grp).length; if(ev.key==='ArrowDown'){ sel = Math.min(n-1, sel+1); draw(); ev.preventDefault(); } if(ev.key==='ArrowUp'){ sel = Math.max(0, sel-1); draw(); ev.preventDefault(); } if(ev.key==='Enter') go(sel); };
  run(); setTimeout(()=>q.focus(), 30);
}

/* ============================================================
   Ambient dust (canvas views only), shortcuts, init
   ============================================================ */
function startDust(){ const c = $('#dust'); if(!c || reduced()) return; const ctx = c.getContext('2d'); let ps = []; const resize = () => { c.width = innerWidth; c.height = innerHeight; }; resize(); window.addEventListener('resize', resize); for(let i=0;i<40;i++) ps.push({x:Math.random()*innerWidth, y:Math.random()*innerHeight, r:.6+Math.random()*1.6, vx:(Math.random()-.5)*.15, vy:-.05-Math.random()*.12, a:Math.random()*Math.PI*2});
  const tick = () => { const on = ['vision','home','skills'].includes(currentRoute); ctx.clearRect(0,0,c.width,c.height); if(on){ ctx.fillStyle = S.settings.theme==='dark' ? 'rgba(232,224,212,.05)' : 'rgba(120,90,60,.06)'; ps.forEach(p => { p.a += .01; p.x += p.vx + Math.sin(p.a)*.1; p.y += p.vy; if(p.y < -5){ p.y = innerHeight+5; p.x = Math.random()*innerWidth; } if(p.x<-5) p.x = innerWidth+5; if(p.x>innerWidth+5) p.x=-5; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); }); } requestAnimationFrame(tick); }; requestAnimationFrame(tick); }
/* Shortcuts. Browsers reserve ⌘N / Ctrl+N (new window) and cannot be overridden, so
   the app uses single keys when you are not typing: N new entry, / search, ← → stages, Esc close. */
function isTyping(){ const a = document.activeElement; return !!a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable); }
document.addEventListener('keydown', e => {
  const mod = e.metaKey || e.ctrlKey;
  if(mod && e.key.toLowerCase()==='k'){ e.preventDefault(); openSearch(); return; }
  if(mod && e.key.toLowerCase()==='n'){ e.preventDefault(); toggleSpeedDialWithFilter(); return; } // honoured where the browser allows it (installed app)
  if(e.key==='Escape'){
    const a = document.activeElement; if(a?.closest?.('.ed')){ a.blur(); return; }
    if($('#speedDial') && !$('#speedDial').hidden){ closeSpeedDial(); return; }
    if($('#navOverlay')){ $('#navOverlay').remove(); return; }
    if(a && /^(INPUT|TEXTAREA)$/.test(a.tagName) && !a.closest('.modal,.overlay,.side-panel,.palette')){ a.blur(); return; }
    closeModals(); return;
  }
  if(mod || e.altKey || isTyping() || $('#modals .overlay') || $('#panel')) return;
  if(e.key==='n' || e.key==='N'){ e.preventDefault(); toggleSpeedDialWithFilter(); }
  else if(e.key==='/'){ e.preventDefault(); openSearch(); }
  else if(e.key==='ArrowLeft' || e.key==='ArrowRight'){ if(typeof stepTimeline === 'function' && stepTimeline(e.key==='ArrowRight' ? 1 : -1)) e.preventDefault(); }
});
async function init(){
  await load(); applyTheme();
  try { navigator.storage?.persist?.(); } catch(e){}
  $('#btnTheme').onclick = () => { S.settings.theme = S.settings.theme==='dark'?'light':'dark'; saveNow(); applyTheme(); };
  $('#btnSound').onclick = () => SoundManager.toggleSound(); $('#btnAmbient').onclick = () => openAmbientMenu(); syncSoundButtons();
  $('#btnSearch').onclick = openSearch; $('#fab').onclick = e => { e.stopPropagation(); toggleSpeedDial(); };
  renderNav();
  if(navigator.platform.toUpperCase().indexOf('MAC')<0){ $$('kbd').forEach(k => k.textContent = k.textContent.replace('⌘','Ctrl+')); }
  if(!location.hash) location.hash = '#/' + homeRoute();
  markNavDirection(); renderRoute(); startDust(); updateBackButton();
  window.addEventListener('beforeunload', () => { if(saving || savePending) saveNow(); });
  if(S.settings.firstOpen === today() && !S._welcomed){ S._welcomed = true; setTimeout(()=>toast('Welcome home. Every piece of text here is editable — click it. The placeholder life is yours to overwrite.', 7000), 800); }
}
document.readyState==='loading' ? document.addEventListener('DOMContentLoaded', init) : init();
</script>
</body>
</html>
