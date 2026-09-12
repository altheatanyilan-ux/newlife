/* ============================================================
   11. GLOBAL ADD ENTRY MODAL
   ============================================================ */
function openEntryModal({type='reflection', links={}, entryId=null, after=null, title='', occurredAt='', allowedTypes=null, heading='', openLinks=false, focusPeople=false}={}){
  const existing = entryId ? byId(S.entries, entryId) : null;
  const e = existing ? JSON.parse(JSON.stringify(existing)) : {id:uid(),type,title,body:'',occurredAt:occurredAt||today(),createdAt:new Date().toISOString(),media:[],links:Object.assign({stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[]}, links),people:[],places:[],emotions:[],tags:[],confidence:'',extra:{}};
  const types = (allowedTypes && !existing) ? ENTRY_TYPES.filter(([t]) => allowedTypes.includes(t)) : ENTRY_TYPES;
  /* Writing something down is not filing a record. Every kind of entry opens
     on a painting of its own, in the same brush the rooms are drawn with, so a
     dream and a decision do not arrive looking identical. */
  const m = openModal(`<div class="entry-ink" id="entryInk">${typeof entryInkSVG === 'function' ? entryInkSVG(e.type) : ''}</div>
    <h2 class="entry-h">${existing?'Edit entry':esc(heading || 'New '+typeName(e.type).toLowerCase())}</h2>
    <div class="typerow" id="typeRow" ${types.length<=1?'hidden':''}>${types.map(([t,n,i])=>`<button class="${e.type===t?'on':''}" data-t="${t}">${i} ${n}</button>`).join('')}</div>
    <div class="stack">
      <input class="inp serif-lg" id="eTitle" placeholder="Title (optional)" value="${esc(e.title)}">
      <textarea class="ta" id="eBody" placeholder="Body — markdown welcome. **bold**, *italic*, > quote, - list" style="min-height:120px">${esc(e.body)}</textarea>
      <div id="extraFields"></div>
      <!-- Who was there is part of a memory, not an afterthought filed under
           "connect this entry" — a formative event without its people is half
           the record. It sits in the body of every entry now, and the label
           says what the question means for this kind of entry. -->
      <div class="field people-field" id="peopleField"><label id="peopleLabel">${esc(peopleLabel(e.type))}</label>
        <input class="inp mono people-filter" id="ePplFilter" placeholder="find a name…" ${(S.people||[]).length > 8 ? '' : 'hidden'}>
        <div class="deps people-deps" id="peopleChips">${(S.people||[]).map(p=>`<span class="chip click" style="--c:${(CIRCLES[p.circle]||CIRCLES.outer)[4]}" data-lk="people" data-id="${p.id}" data-pname="${esc(p.name.toLowerCase())}">${(CIRCLES[p.circle]||CIRCLES.outer)[0]} ${esc(p.name)}</span>`).join('')}<button type="button" class="chip click" id="eNewPerson" style="--c:var(--page-accent)">＋ someone new</button></div>
        <div class="faint" style="font-size:.74rem" id="peopleHint"></div></div>
      <div class="field" id="tagField" ${TAGGABLE.includes(e.type)?'':'hidden'}><label>Hashtags — one thread through many entries</label><input class="inp mono" id="eTags" value="${esc((e.tags||[]).map(t=>'#'+t).join(' '))}" placeholder="#kyoto #jazz #beginnings" list="tagList"><datalist id="tagList">${allTags().map(([t,n])=>`<option value="#${esc(t)}">${n}</option>`).join('')}</datalist><div class="faint" style="font-size:.74rem">Typing #something in the body works too.</div></div>
      <div class="field"><label>Occurred at</label><div class="dp-field"><input class="inp" id="eWhen" data-dp value="${esc(e.occurredAt)}" placeholder="2024-09-14 · or “Summer 2019” · or “age 15”">${dpButtonHTML('eWhen')}</div><div class="faint" style="font-size:.74rem">Exact dates sort precisely; approximate ones sort by year. Memories can be logged today about decades ago.</div></div>
      <div class="field"><label>Media</label><div class="dropzone" id="eDrop">drop images here, or click to choose</div><input type="file" id="eFile" accept="image/*" multiple hidden><div class="thumbs" id="eThumbs"></div></div>
      <details ${(openLinks || Object.values(e.links).some(a=>a.length))?'open':''}><summary><span class="sc">Connect this entry</span><span class="mono" id="linkCount"></span></summary><div class="body stack" style="gap:12px">
        <div class="field"><label>Stages</label><div class="deps">${S.stages.map(s=>`<span class="chip click" style="--c:${s.hue}" data-lk="stages" data-id="${s.id}">${s.char} ${esc(s.name)}</span>`).join('')}</div></div>
        <div class="field" id="subField"><label>Sub-stages</label><div class="deps" id="subChips"></div></div>
        <div class="field"><label>Threads</label><div class="deps">${S.threads.map(t=>`<span class="chip click" style="--c:${t.color}" data-lk="threads" data-id="${t.id}">${esc(t.name)}</span>`).join('')}</div></div>
        <div class="field"><label>Values — click to link, click again to flip polarity, third click to unlink</label><div class="deps">${S.valueOrder.map(id=>{ const v=byId(S.values,id); return `<span class="chip click" style="--c:${v.color}" data-lk="values" data-id="${v.id}"><span class="pol"></span>${esc(v.name)}</span>`; }).join('')}</div></div>
        <div class="field"><label>Skills</label><div class="deps">${S.skills.map(s=>`<span class="chip click" style="--c:var(--ment)" data-lk="skills" data-id="${s.id}">${esc(s.name)}</span>`).join('')}</div></div>
        <div class="field"><label>Projects</label><div class="deps">${S.projects.map(p=>`<span class="chip click" style="--c:var(--terra)" data-lk="projects" data-id="${p.id}">${esc(p.name)}</span>`).join('')}</div></div>
        <div class="grid c2" style="gap:8px"><div class="field"><label>Places</label><input class="inp" id="ePlaces" value="${esc(e.places.join(', '))}" list="placeList"><datalist id="placeList">${(S.places||[]).map(p=>`<option value="${esc(p)}">`).join('')}</datalist></div><div class="field"><label>Emotions</label><input class="inp" id="eEmo" value="${esc(e.emotions.join(', '))}"></div></div>
        <div class="field"><label>Confidence (for future-facing entries)</label><div class="ladder">${CONF.map(c=>`<button data-conf="${c}" class="${e.confidence===c?'on':''}">${c}</button>`).join('')}</div></div>
      </div></details>
      <!-- Fleshing something out ends here, so the switch that says it is done
           sits beside Save rather than in a settings drawer somewhere. It fails
           safe: forget to untick and you are reminded again, which is the right
           direction for a thing whose whole purpose is not being forgotten. -->
      <label class="unf-toggle${unfinishedFlag(e)?' on':''}" id="eUnfWrap"><input type="checkbox" id="eUnfinished" ${unfinishedFlag(e)?'checked':''}>
        <span>Still unfinished — keep it at the bottom of Today</span></label>
      <div class="row between"><span class="faint" style="font-size:.78rem" id="linkNudge"></span><button class="btn primary" id="eSave" style="padding:12px 28px;font-size:1rem">${existing?'Save changes':'Save entry'}</button></div>
    </div>`, 'wide');
  const x = () => e.extra;
  /* type-specific fields. Anything with data-x saves itself on the way out;
     the pickers below write straight into extra so a click is a save. */
  const MOOD_SCALE = [['heavy','heavy'],['low','low'],['level','level'],['light','light'],['luminous','luminous']];
  const BODY_PROMPTS = {
    gratitude:'What am I grateful for?',
    reflection:'Thinking on paper. Nobody is reading this but you, later.',
    dream:'What happened, before it fades. Present tense helps.',
    question:'Put the question in the title. This is the room around it.',
    synchronicity:'What happened, as plainly as you can put it.',
  };
  const renderExtra = () => { const t = e.type; const box = m.querySelector('#extraFields');
    const f = (k,label,ph,multi) => `<div class="field"><label>${label}</label>${multi?`<textarea class="ta" data-x="${k}" style="min-height:60px" placeholder="${esc(ph)}">${esc(x()[k]||'')}</textarea>`:`<input class="inp" data-x="${k}" value="${esc(x()[k]||'')}" placeholder="${esc(ph)}">`}</div>`;
    const pick = (k,label,opts,hint) => `<div class="field"><label>${label}</label>${hint?`<div class="faint" style="font-size:.76rem;margin-bottom:5px">${esc(hint)}</div>`:''}<div class="chip-row">${opts.map(o => { const [v,l] = Array.isArray(o)?o:[o,o];
      return `<button type="button" class="chip click ${x()[k]===v?'on':''}" data-xset="${esc(k)}" data-xval="${esc(v)}">${esc(l)}</button>`; }).join('')}</div></div>`;
    const picks = (k,label,opts,hint) => `<div class="field"><label>${label}</label>${hint?`<div class="faint" style="font-size:.76rem;margin-bottom:5px">${esc(hint)}</div>`:''}<div class="chip-row">${opts.map(v =>
      `<button type="button" class="chip click ${(x()[k]||[]).includes(v)?'on':''}" data-xmulti="${esc(k)}" data-xval="${esc(v)}">${esc(v)}</button>`).join('')}</div></div>`;
    let html = '';
    if(t==='reflection') html = pick('mood','How you were when you wrote it', MOOD_SCALE, 'Not the subject of the reflection — the state you were in.')
      + f('trigger','What prompted this','a conversation, a book, a memory, nothing in particular')
      + pick('depth','How deep did you go', [['surface','surface'],['sitting','sitting with it'],['breakthrough','breakthrough']]);
    if(t==='gratitude') html = f('gratWhy','Why does this matter to me? (required)','“My health” becomes “I could run with my dog this morning without pain.”',true)
      + pick('novelty','New, or ongoing', [['new','something new'],['ongoing','something ongoing']], 'Over time this shows whether the practice is deepening or running on autopilot.')
      + `<div class="faint" style="font-size:.78rem">Tag whoever contributed, just below — gratitude becomes relational.</div>`;
    if(t==='synchronicity') html = f('preceded','What preceded it','What were you thinking about, doing, asking?',true) + f('read','What I read into it','',true)
      + pick('conf','How convinced are you', [['noise','noise'],['curious','curious'],['significant','significant'],['unmistakable','unmistakable']])
      + `<label class="toggle ${x().revisit?'on':''}" id="xRevisit"><span class="sw"></span><span>revisit later — resurface this in Today's prompts</span></label>`;
    if(t==='manifestation') html = `<div class="field"><label>Status</label><select class="sel" data-x="status">${['held','evidence appearing','arrived','released'].map(s=>`<option ${x().status===s?'selected':''}>${s}</option>`).join('')}</select></div>`
      + `<div class="field"><label>Where you were when you set it</label><div class="faint" style="font-size:.76rem;margin-bottom:4px">Abraham's point: an intention set from alignment behaves differently from one set from desperation.</div>
         <input class="rng" type="range" min="1" max="22" data-x="setpointAt" value="${x().setpointAt || checkin().setpoint || 11}" style="width:100%"><div class="mono" id="xSpName">${esc(hicksName(x().setpointAt || checkin().setpoint || 11))}</div></div>`
      + f('resistance','Resistance notes','What doubts or fears arrived after you set it?',true)
      + `<div class="field"><label>Evidence log</label><textarea class="ta" data-xlist="evidence" style="min-height:60px" placeholder="one piece of evidence per line">${esc((x().evidence||[]).map(v=>v.text).join('\n'))}</textarea></div>`;
    if(t==='dream') html = `<div class="field"><label>Vividness</label><div class="feeling">${[1,2,3,4,5].map(n=>`<button data-vivid="${n}" class="${x().vivid===n?'on':''}">${n}</button>`).join('')}</div></div>`
      + picks('tone','Emotional tone', ['anxious','joyful','surreal','mundane','prophetic','nightmare','lucid'])
      + `<label class="toggle ${x().recurring?'on':''}" id="xRec"><span class="sw"></span><span>recurring — links to earlier occurrences</span></label>`
      + f('symbols_','Symbols / motifs','comma-separated: water, flying, teeth, a particular room')
      + f('waking','Waking interpretation','What you think it meant, written now. Kept as versions if you revise it.',true)
      + `<div class="faint" style="font-size:.76rem">Captured ${esc(x().capturedAt || new Date().toTimeString().slice(0,5))} — the closer to waking, the truer the record.</div>`;
    if(t==='quote') html = f('author','Author / speaker','') + f('source','Source','book, film, a person') + f('link','Saved link (optional)','https://…') + f('page','Page / timestamp / location','')
      + f('why','Why this caught me (required)','A quote without this is a bookmark, not knowledge.',true)
      + pick('category','What kind of words', [['wisdom','wisdom'],['craft','craft'],['beauty','beauty'],['provocation','provocation'],['comfort','comfort'],['challenge','challenge']]);
    if(t==='question') html = f('why','Why I am asking','What prompted this question?',true)
      + pick('status','Status', [['open','open'],['evolving','evolving'],['settled','settled'],['dissolved','dissolved']], 'Some questions dissolve rather than resolve — the framing was wrong.')
      + `<div class="faint" style="font-size:.8rem">Put the question itself in the title. Answers accumulate over time, from the journal.</div>`;
    if(t==='progress'||t==='nod') html = f('duration','Duration (minutes)','45') + f('resources','Resources used','');
    if(t==='memory') html = f('installed','What this installed in me','The belief, fear, pattern, or capability this event left behind.',true);
    if(t==='letter') html = pick('direction','Direction', [['future','to my future self'],['past','to my past self'],['frompast','from my past self, to now']])
      + `<div class="faint" style="font-size:.8rem">A letter to next year sits at next year's date. To seal one properly — hidden until its day — use “Seal a letter” from the Letters journal.</div>`;
    box.innerHTML = html;
    if(t==='dream'){ x().symbols_ = (x().symbols||[]).join(', '); const si = box.querySelector('[data-x=symbols_]'); if(si) si.value = x().symbols_;
      x().capturedAt = x().capturedAt || new Date().toTimeString().slice(0,5); }
    const bp = BODY_PROMPTS[t]; const bodyEl = m.querySelector('#eBody'); if(bodyEl) bodyEl.placeholder = bp || 'Body — markdown welcome. **bold**, *italic*, > quote, - list';
    box.querySelector('#xRevisit')?.addEventListener('click', function(){ this.classList.toggle('on'); });
    box.querySelector('#xRec')?.addEventListener('click', function(){ this.classList.toggle('on'); });
    box.querySelectorAll('[data-vivid]').forEach(b => b.onclick = () => { x().vivid = +b.dataset.vivid; box.querySelectorAll('[data-vivid]').forEach(y=>y.classList.toggle('on', y===b)); });
    box.querySelectorAll('[data-xset]').forEach(b => b.onclick = () => { const k = b.dataset.xset, v = b.dataset.xval;
      x()[k] = x()[k] === v ? '' : v; box.querySelectorAll(`[data-xset="${k}"]`).forEach(y => y.classList.toggle('on', y.dataset.xval === x()[k])); });
    box.querySelectorAll('[data-xmulti]').forEach(b => b.onclick = () => { const k = b.dataset.xmulti, v = b.dataset.xval;
      const arr = x()[k] = Array.isArray(x()[k]) ? x()[k] : [];
      x()[k] = arr.includes(v) ? arr.filter(y=>y!==v) : [...arr, v]; b.classList.toggle('on'); });
    const sp = box.querySelector('[data-x=setpointAt]');
    if(sp) sp.oninput = () => { const n = box.querySelector('#xSpName'); if(n) n.textContent = hicksName(+sp.value); };
  };
  renderExtra();
  /* the painting changes with the kind — it is the fastest way to see that the
     click landed, and it re-draws itself rather than cutting */
  const paintInk = () => { const box = m.querySelector('#entryInk'); if(!box || typeof entryInkSVG !== 'function') return;
    box.classList.remove('drawn'); box.innerHTML = entryInkSVG(e.type);
    requestAnimationFrame(() => box.classList.add('drawn')); };
  paintInk();
  m.querySelectorAll('#typeRow button').forEach(b => b.onclick = () => { e.type = b.dataset.t; m.querySelectorAll('#typeRow button').forEach(y=>y.classList.toggle('on', y===b)); if(e.type==='nod'){ m.remove(); openNodModal(); return; } renderExtra(); paintInk(); m.querySelector('#tagField').hidden = !TAGGABLE.includes(e.type); relabelPeople(); });
  /* the question the field is asking depends on what is being written */
  const relabelPeople = () => { const l = m.querySelector('#peopleLabel'); if(l) l.textContent = peopleLabel(e.type); };
  const pplFilter = m.querySelector('#ePplFilter');
  if(pplFilter) pplFilter.oninput = () => { const q = pplFilter.value.trim().toLowerCase();
    m.querySelectorAll('#peopleChips [data-pname]').forEach(c => {
      c.hidden = !!q && !c.dataset.pname.includes(q) && !c.classList.contains('on'); }); };
  const npBtn = m.querySelector('#eNewPerson');
  if(npBtn) npBtn.onclick = () => {
    const name = prompt('Who?'); if(!name || !name.trim()) return;
    const p = newPerson(name.trim()); S.people.push(p); saveNow();
    e.links.people = e.links.people || []; e.links.people.push(p.id);
    const chips = m.querySelector('#peopleChips');
    chips.insertAdjacentHTML('afterbegin', `<span class="chip click on" style="--c:${(CIRCLES[p.circle]||CIRCLES.outer)[4]}" data-lk="people" data-id="${p.id}" data-pname="${esc(p.name.toLowerCase())}">${(CIRCLES[p.circle]||CIRCLES.outer)[0]} ${esc(p.name)}</span>`);
    bindLk(chips.firstElementChild);
  };
  const syncChips = () => { m.querySelectorAll('[data-lk]').forEach(c => { const k = c.dataset.lk, id = c.dataset.id; const arr = e.links[k]; const hit = arr.find(v => (typeof v==='string'?v:v.id)===id); c.classList.toggle('on', !!hit); if(k==='values') c.querySelector('.pol').textContent = hit ? hit.pol : ''; }); const n = Object.values(e.links).reduce((a,b)=>a+b.length,0); m.querySelector('#linkCount').textContent = n ? `${n} linked` : '';
    const np = e.links.people.length; const ph_ = m.querySelector('#peopleHint');
    if(ph_) ph_.textContent = np ? `${np} tagged — they will show on this entry, and it will show on theirs`
      : ((S.people||[]).length ? 'Nobody tagged yet.' : 'No one in People yet — “＋ someone new” adds them here.'); m.querySelector('#linkNudge').textContent = n ? '' : 'Consider linking this to a stage, a value, or a vision — that is how the house connects.'; const subs = e.links.stages.flatMap(sid => (byId(S.stages,sid)?.substages||[]).map(ss=>({...ss, hue:byId(S.stages,sid).hue}))); m.querySelector('#subField').style.display = subs.length?'':'none'; m.querySelector('#subChips').innerHTML = subs.map(ss=>`<span class="chip click ${e.links.substages.includes(ss.id)?'on':''}" style="--c:${ss.hue}" data-sub="${ss.id}">${esc(ss.name)}</span>`).join(''); m.querySelectorAll('[data-sub]').forEach(c => c.onclick = () => { const id = c.dataset.sub; e.links.substages = e.links.substages.includes(id) ? e.links.substages.filter(y=>y!==id) : [...e.links.substages,id]; syncChips(); }); };
  const bindLk = c => { c.onclick = () => { const k = c.dataset.lk, id = c.dataset.id; const arr = e.links[k]; if(k==='values'){ const i = arr.findIndex(v=>v.id===id); if(i<0) arr.push({id,pol:'+'}); else if(arr[i].pol==='+') arr[i].pol='−'; else arr.splice(i,1); } else { const i = arr.indexOf(id); if(i<0) arr.push(id); else arr.splice(i,1); } syncChips(); }; };
  m.querySelectorAll('[data-lk]').forEach(bindLk);
  syncChips();
  /* opened from "who was there": put the reader in front of the question */
  if(focusPeople) requestAnimationFrame(() => {
    const f = m.querySelector('#peopleField');
    if(f){ f.scrollIntoView({block:'center', behavior:'smooth'}); f.classList.add('flash'); }
    m.querySelector('#ePplFilter')?.focus({preventScroll:true});
  });
  m.querySelectorAll('[data-conf]').forEach(b => b.onclick = () => { e.confidence = e.confidence===b.dataset.conf ? '' : b.dataset.conf; m.querySelectorAll('[data-conf]').forEach(y=>y.classList.toggle('on', y.dataset.conf===e.confidence)); });
  const thumbs = m.querySelector('#eThumbs'); const drawThumbs = () => { thumbs.innerHTML = e.media.map(md_=>`<div style="display:flex;flex-direction:column;gap:4px;width:120px"><img src="${md_.src}" style="width:120px;height:80px"><input class="inp" style="padding:3px 6px;font-size:.7rem" placeholder="caption" value="${esc(md_.caption)}" data-cap="${md_.id}"><input class="inp" style="padding:3px 6px;font-size:.7rem" placeholder="people" value="${esc((md_.people||[]).join(', '))}" data-ppl="${md_.id}"><button class="tbtn" data-rm="${md_.id}">remove</button></div>`).join(''); thumbs.querySelectorAll('[data-cap]').forEach(i=>i.oninput=()=>byId(e.media,i.dataset.cap).caption=i.value); thumbs.querySelectorAll('[data-ppl]').forEach(i=>i.oninput=()=>byId(e.media,i.dataset.ppl).people=i.value.split(',').map(s=>s.trim()).filter(Boolean)); thumbs.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{ e.media = e.media.filter(y=>y.id!==b.dataset.rm); drawThumbs(); }); }; drawThumbs();
  const dz = m.querySelector('#eDrop'); dz.onclick = () => m.querySelector('#eFile').click(); m.querySelector('#eFile').onchange = ev => readImages(ev.target.files, img => { e.media.push(img); drawThumbs(); }); dz.ondragover = ev => { ev.preventDefault(); dz.classList.add('over'); }; dz.ondragleave = () => dz.classList.remove('over'); dz.ondrop = ev => { ev.preventDefault(); dz.classList.remove('over'); readImages(ev.dataTransfer.files, img => { e.media.push(img); drawThumbs(); }); };
  const unfBox = m.querySelector('#eUnfinished');
  if(unfBox) unfBox.onchange = () => m.querySelector('#eUnfWrap').classList.toggle('on', unfBox.checked);

  m.querySelector('#eSave').onclick = ev => {
    e.title = m.querySelector('#eTitle').value.trim(); e.body = m.querySelector('#eBody').value; e.occurredAt = m.querySelector('#eWhen').value.trim() || today();
    if(!e.title && !e.body){ toast('Write something first — even one line.'); return; }
    if(e.type==='quote' && !m.querySelector('[data-x=why]')?.value.trim()){ toast('“Why this caught me” is required for a quote.'); return; }
    e.tags = normTags((m.querySelector('#eTags')?.value || '').split(/[\s,]+/));
    m.querySelectorAll('[data-x]').forEach(i => e.extra[i.dataset.x] = i.value);
    /* the readings that deepen are versioned, not overwritten */
    [['read','readHistory'],['waking','wakingHistory']].forEach(([k, hk]) => { const prev = existing?.extra?.[k];
      if(prev && e.extra[k] && prev !== e.extra[k]) e.extra[hk] = [...(existing.extra[hk]||[]), {date:today(), text:prev}]; });
    if(e.extra.setpointAt) e.extra.setpointAt = +e.extra.setpointAt;
    /* the switch is the only thing that clears this: saving an edit does not
       decide on your behalf that a thought is now finished */
    if(m.querySelector('#eUnfinished')?.checked){
      e.extra.unfinished = true; e.extra.dumpedAt = e.extra.dumpedAt || e.createdAt || new Date().toISOString();
    } else delete e.extra.unfinished;
    m.querySelectorAll('[data-xlist]').forEach(i => { const old = e.extra[i.dataset.xlist]||[]; e.extra[i.dataset.xlist] = i.value.split('\n').map(s=>s.trim()).filter(Boolean).map(t => old.find(o=>o.text===t) || {date:today(),text:t}); });
    if(e.type==='synchronicity') e.extra.revisit = !!m.querySelector('#xRevisit')?.classList.contains('on');
    if(e.type==='dream'){ e.extra.recurring = !!m.querySelector('#xRec')?.classList.contains('on'); e.extra.symbols = (e.extra.symbols_||'').split(',').map(s=>s.trim()).filter(Boolean); delete e.extra.symbols_; }
    if(e.type==='question') e.extra.answers = e.extra.answers||[];
    const split = id => m.querySelector(id).value.split(',').map(s=>s.trim()).filter(Boolean);
    e.places = split('#ePlaces'); e.emotions = split('#eEmo'); e.people = (e.links.people||[]).map(id => byId(S.people,id)?.name).filter(Boolean);
    S.places = [...new Set([...(S.places||[]), ...e.places])];
    if(existing) Object.assign(existing, e); else S.entries.push(e);
    saveNow();
    /* the ripple takes its colour from whatever the entry is tagged to; every
       lookup is optional because an entry may carry no links at all */
    const L = e.links || {};
    const primary = L.values?.[0] ? byId(S.values, L.values[0].id)?.color
                  : L.stages?.[0] ? byId(S.stages, L.stages[0])?.hue
                  : 'var(--terra)';
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
  const m = openModal(`<input id="palQ" placeholder="Search entries, values, skills, projects, habits, sections…" autofocus><div class="results" id="palRes"></div>`, 'palette');
  const q = m.querySelector('#palQ'), res = m.querySelector('#palRes'); let sel = 0, items = [];
  const sections = [['Compass','#/compass'],['Today','#/today'],['Timeline','#/journals/timeline'],['Threads & Tensions','#/journals/timeline/threads'],['Values','#/values'],['Journals','#/journals'],['Skill Tree','#/skills'],['Creative Projects','#/projects'],['Settings','#/settings']];
  const run = () => { const s = q.value.trim().toLowerCase(); const hit = t => !s || String(t).toLowerCase().includes(s); items = [];
    const grp = (name, arr) => { if(arr.length){ items.push({grp:name}); arr.slice(0,8).forEach(x=>items.push(x)); } };
    grp('Add', SPEED_DIAL.flatMap(it => it.actions ? it.actions.map(([l,fn]) => ({t:`${it.icon} ${it.zone} — ${l}`, m:'add', run:fn, key:it.zone+' '+l+' '+it.label})) : [{t:`${it.icon} ${it.label}`, m:'add', run:it.run, key:it.zone+' '+it.label}]).filter(x=>hit(x.key)));
    grp('Sections', sections.filter(([n])=>hit(n)).map(([n,go])=>({t:n,go,m:''})));
    grp('Stages', S.stages.filter(x=>hit(x.name+' '+x.char+' '+x.tagline)).map(x=>({t:`${x.char} ${x.name}`,go:'#/stage/'+x.id,m:x.years})));
    grp('Values', S.values.filter(x=>hit(x.name)).map(x=>({t:x.name,go:'#/value/'+x.id,m:valueCurrent(x.id)+'%'})));
    grp('Skills', S.skills.filter(x=>hit(x.name)).map(x=>({t:x.name,go:'#/skills/'+x.id,m:'lvl '+x.currentLevel+' of '+skillLevelCount(x)})));
    grp('Projects', S.projects.filter(x=>hit(x.name+' '+(x.description||''))).map(x=>({t:x.name,go:'#/projects/'+x.id,m:x.status})));
    grp('Threads', S.threads.filter(x=>hit(x.name)).map(x=>({t:x.name,go:'#/journals/timeline/threads',m:x.status})));
    grp('Habits', S.habits.filter(x=>!x.archived&&hit(x.name)).map(x=>({t:x.name,go:'#/rituals',m:x.dimension})));
    /* A writing project is a Content piece, and #/journals/writing is not a
       journal — send it to the desk it is written on, and say where in the
       pipeline it sits rather than calling it an entry. */
    if(s) grp('Entries', sortEntries(S.entries.filter(x => !letterIsSealed(x)).filter(x=>hit(x.title+' '+x.body))).map(x=> x.type === 'writing'
      ? {t:x.title||'Untitled piece', go:'#/writing/'+x.id,
         m:(typeof contentStage === 'function' && x.extra?.content ? contentStage(x.extra.content.stage).name + ' · ' : '') + 'piece'}
      : {t:x.title||x.body.slice(0,80),go:'#/journals/'+x.type,m:typeName(x.type)+' · '+fmtDate(x.occurredAt,'med'),entry:x.id}));
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
  const tick = () => { const on = ['compass','skills'].includes(currentRoute); ctx.clearRect(0,0,c.width,c.height); if(on){ ctx.fillStyle = S.settings.theme==='dark' ? 'rgba(232,224,212,.05)' : 'rgba(120,90,60,.06)'; ps.forEach(p => { p.a += .01; p.x += p.vx + Math.sin(p.a)*.1; p.y += p.vy; if(p.y < -5){ p.y = innerHeight+5; p.x = Math.random()*innerWidth; } if(p.x<-5) p.x = innerWidth+5; if(p.x>innerWidth+5) p.x=-5; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); }); } requestAnimationFrame(tick); }; requestAnimationFrame(tick); }
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
  $('#btnSearch').onclick = openSearch; $('#btnKeys').onclick = openShortcuts; $('#btnSettings').onclick = () => navigate('#/settings'); $('#fab').onclick = e => { e.stopPropagation(); toggleSpeedDial(); };
  renderNav();
  if(navigator.platform.toUpperCase().indexOf('MAC')<0){ $$('kbd').forEach(k => k.textContent = k.textContent.replace('⌘','Ctrl+')); }
  if(!location.hash) location.hash = '#/' + homeRoute();
  markNavDirection(); renderRoute(); startDust(); updateBackButton();
  window.addEventListener('beforeunload', () => { if(saving || savePending) saveNow(); });
  if(S.settings.firstOpen === today() && !S._welcomed){ S._welcomed = true; setTimeout(()=>toast('Welcome home. Every piece of text here is editable — click it. The placeholder life is yours to overwrite.', 7000), 800); }
  registerServiceWorker();
  setTimeout(() => { try { maybeOfferHandoff(); } catch(e){ console.warn('handoff notice skipped', e); }
    try { maybeOfferStarter(); } catch(e){ console.warn('starter set skipped', e); }
    try { migratePlanning(); planSeedIfEmpty(); } catch(e){ console.warn('planning seed skipped', e); }
    try { migrateContent(); contentSeedIfEmpty(); } catch(e){ console.warn('content seed skipped', e); } }, 1200);
}
document.readyState==='loading' ? document.addEventListener('DOMContentLoaded', init) : init();
</script>
</body>
</html>
