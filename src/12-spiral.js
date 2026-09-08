/* ============================================================
   THE SPIRAL — a directional instrument, not a diagnosis.

   A centre of gravity sits between two stages. This room holds
   the two named ends of that movement and the concrete patterns
   on each side: what is being released, and what is being taken
   on. Every indicator is written by the person doing the moving —
   the stages come with the model, the evidence does not.
   ============================================================ */
const SPIRAL_DIRECTIONS = ['releasing', 'embodying'];
/* the two scales run in opposite directions, and saying so is half the point */
const SPIRAL_SCALE = {
  releasing: ["I've mostly let this go", 'rarely', 'sometimes', 'often', 'This still runs me'],
  embodying: ['Not yet part of me', 'a beginning', 'sometimes', 'often', 'This is becoming natural'],
};
const SPIRAL_SEED = {
  releasing: [
    ['Measuring my worth by what I produce', 4],
    ['Treating relationships as networking opportunities', 2],
    ["Skipping rest because I haven't earned it", 3],
    ['Optimising everything, including things that should just be experienced', 4],
  ],
  embodying: [
    ['Asking what someone needs before asking what I need from them', 2],
    ['Sitting with uncomfortable emotions instead of fixing them', 1],
    ['Choosing one deep conversation over three efficient ones', 2],
    ['Questioning whether the career ladder matters as much as I assumed', 3],
  ],
  trace: ['red', 'work — competitive instinct when threatened', 'Flares up in high-stakes situations'],
};

function migrateSpiral(){
  const keys = SPIRAL.map(s => s[0]);
  const sp = S.spiral = Object.assign({currentPair:{releasing:'orange', embodying:'green'}, traces:[], indicators:[], history:[]}, S.spiral || {});
  sp.currentPair = sp.currentPair || {};
  if(!keys.includes(sp.currentPair.releasing)) sp.currentPair.releasing = 'orange';
  if(!keys.includes(sp.currentPair.embodying)) sp.currentPair.embodying = 'green';
  sp.traces = Array.isArray(sp.traces) ? sp.traces : [];
  sp.traces.forEach(t => { t.id = t.id || uid(); t.stage = keys.includes(t.stage) ? t.stage : 'red'; t.domain = t.domain || ''; t.note = t.note || ''; });
  sp.indicators = Array.isArray(sp.indicators) ? sp.indicators : [];
  sp.indicators.forEach((x, i) => {
    x.id = x.id || uid();
    x.direction = SPIRAL_DIRECTIONS.includes(x.direction) ? x.direction : 'releasing';
    x.stage = keys.includes(x.stage) ? x.stage : sp.currentPair[x.direction];
    x.text = x.text || ''; x.note = x.note || '';
    x.strength = clamp(Math.round(+x.strength || 0), 0, 5);
    x.lastChecked = x.lastChecked || '';
    x.order = typeof x.order === 'number' ? x.order : i;
  });
  sp.history = Array.isArray(sp.history) ? sp.history : [];
}
function spiralPair(){ migrateSpiral(); return S.spiral.currentPair; }
function spiralIndicators(dir){
  return S.spiral.indicators.filter(x => x.direction === dir).sort((a,b) => a.order - b.order);
}
/* How far into the higher stage: the embodying side, averaged, as a fraction.
   The releasing side is deliberately not in this number — letting go of the
   old stage is not the same achievement as living the new one, and averaging
   them together would let one flatter the other. */
function spiralProgress(){
  const emb = spiralIndicators('embodying').filter(x => x.strength > 0);
  if(!emb.length) return null;
  return avg(emb.map(x => x.strength)) / 5;
}
function spiralReadingLine(){
  const pair = spiralPair();
  const embName = spiralMeta(pair.embodying)?.[1] || pair.embodying;
  const p = spiralProgress();
  if(p == null) return 'Nothing rated yet. Name a few patterns on each side and the movement becomes measurable.';
  const emb = spiralIndicators('embodying').filter(x => x.strength > 0).sort((a,b) => b.strength - a.strength);
  const rel = spiralIndicators('releasing').filter(x => x.strength > 0).sort((a,b) => b.strength - a.strength);
  const bits = [`You're about ${Math.round(p*100)}% into ${embName}.`];
  if(emb[0] && emb[0].strength >= 3) bits.push(`The strongest signal: ${lowerFirst(emb[0].text)}.`);
  else if(emb[0]) bits.push(`Nothing on the ${embName} side has taken hold yet — the nearest is ${lowerFirst(emb[0].text)}.`);
  if(rel[0] && rel[0].strength >= 4) bits.push(`The strongest hold: ${lowerFirst(rel[0].text)}.`);
  if(!rel.length) bits.push('Nothing is rated on the releasing side, so this reading only knows half of the movement.');
  return bits.join(' ');
}
const lowerFirst = t => { const s = String(t || '').trim(); return s ? s[0].toLowerCase() + s.slice(1).replace(/\.$/, '') : s; };

/* ---------- evidence: entries tagged to a stage, with a polarity ---------- */
function spiralTag(e){ const t = e.extra?.spiral; return t && t.stage ? t : null; }
function spiralEvidence(stage, polarity){
  return S.entries.filter(e => { const t = spiralTag(e); return t && t.stage === stage && (!polarity || t.polarity === polarity); })
    .sort((a,b) => String(b.occurredAt||b.createdAt).localeCompare(String(a.occurredAt||a.createdAt)));
}

/* ---------- pieces ---------- */
function spiralStageSelect(dir, value){
  return `<select class="sel spi-sel" data-spistage="${dir}">${SPIRAL.map(([k, name, gloss]) =>
    `<option value="${k}" ${value===k?'selected':''}>${esc(name)} — ${esc(gloss)}</option>`).join('')}</select>`;
}
function spiralPairHTML(){
  const pair = spiralPair();
  const [rk, rName, rGloss, rCol] = spiralMeta(pair.releasing);
  const [ek, eName, eGloss, eCol] = spiralMeta(pair.embodying);
  const same = rk === ek;
  return `<section class="section rv spi-pair" style="--rel:${rCol};--emb:${eCol}">
    <div class="spi-pair-grid">
      <div class="spi-end rel">
        <div class="spi-end-k mono">releasing</div>
        <div class="spi-end-n serif">${esc(rName)}</div>
        <div class="spi-end-g">${esc(rGloss)}</div>
      </div>
      <div class="spi-arrow" aria-hidden="true"><span class="spi-arrow-line"></span><span class="spi-arrow-head">▶</span></div>
      <div class="spi-end emb">
        <div class="spi-end-k mono">embodying</div>
        <div class="spi-end-n serif">${esc(eName)}</div>
        <div class="spi-end-g">${esc(eGloss)}</div>
      </div>
    </div>
    ${same ? `<p class="spi-warn">Both ends are the same stage. A direction needs somewhere to leave and somewhere to arrive.</p>` : ''}
    <details class="spi-change"><summary class="mono">change the pair</summary><div class="body">
      <div class="grid c2" style="gap:10px">
        <div class="field"><label>Releasing — moving away from</label>${spiralStageSelect('releasing', pair.releasing)}</div>
        <div class="field"><label>Embodying — moving toward</label>${spiralStageSelect('embodying', pair.embodying)}</div>
      </div>
      <p class="faint" style="font-size:.78rem;margin:8px 0 0">They do not have to be adjacent. Blue to Green is a real movement, so is Red to Yellow.</p>
    </div></details>
    ${spiralTracesHTML()}
  </section>`;
}
function spiralTracesHTML(){
  const tr = S.spiral.traces;
  return `<details class="spi-traces" ${tr.length && S._spiTraces ? 'open' : ''}><summary class="mono">traces of other stages${tr.length ? ` · ${tr.length}` : ''}</summary>
    <div class="body">
      <p class="faint" style="font-size:.8rem;margin:0 0 8px">No one lives at one altitude. Where does another stage still show up, and in what part of life?</p>
      ${tr.map((t, i) => { const m = spiralMeta(t.stage) || SPIRAL[2];
        return `<div class="evidence-item spi-trace" style="--c:${m[3]}">
          <select class="sel spi-sel sm" data-spitracestage="${t.id}">${SPIRAL.map(([k,name]) => `<option value="${k}" ${t.stage===k?'selected':''}>${esc(name)}</option>`).join('')}</select>
          <span style="flex:1">${ed(`spiral.traces.${i}.domain`, {ph:'in what part of life — work, family, money…'})}</span>
          <span style="flex:1">${ed(`spiral.traces.${i}.note`, {ph:'when it shows up'})}</span>
          <button class="tbtn" data-spitracedel="${t.id}">×</button>
        </div>`; }).join('')}
      <button class="btn sm ghost" id="spiTraceAdd" style="margin-top:6px">＋ a trace</button>
    </div></details>`;
}
function spiralProgressHTML(){
  const pair = spiralPair();
  const [, rName, , rCol] = spiralMeta(pair.releasing);
  const [, eName, , eCol] = spiralMeta(pair.embodying);
  const p = spiralProgress();
  return `<section class="section rv spi-progress" style="--rel:${rCol};--emb:${eCol}">
    <div class="row between" style="align-items:baseline"><span class="sc" style="margin:0">Where the centre of gravity sits</span>
      <span class="mono faint">${p == null ? 'not yet measurable' : `${Math.round(p*100)}% into ${esc(eName)}`}</span></div>
    <div class="spi-track">
      <span class="spi-track-end left mono">${esc(rName)}</span>
      <span class="spi-track-bar">${p == null ? '' : `<i class="spi-marker" style="left:${clamp(p*100, 1, 99)}%"></i>`}</span>
      <span class="spi-track-end right mono">${esc(eName)}</span>
    </div>
    <p class="spi-reading">${esc(spiralReadingLine())}</p>
    ${typeof spiralReading === 'function' ? (() => { const r = spiralReading(); const m = spiralMeta(r.primary);
      return r.primary ? `<p class="spi-crosscheck">Read off your behaviour rather than your intention, the instrument currently resonates most with <b style="color:${m[3]}">${esc(m[1])}</b>. <a href="#/compass">See the full resonance →</a></p>` : ''; })() : ''}
  </section>`;
}
function spiralDotsHTML(x){
  const scale = SPIRAL_SCALE[x.direction];
  return `<span class="spi-dots" role="group" aria-label="strength">${[1,2,3,4,5].map(n =>
    `<button class="${x.strength >= n ? 'on' : ''}" data-spistr="${x.id}:${n}" title="${esc(scale[n-1])}" aria-label="${esc(scale[n-1])}"></button>`).join('')}</span>`;
}
function spiralIndicatorHTML(x, i){
  const idx = S.spiral.indicators.indexOf(x);
  const scale = SPIRAL_SCALE[x.direction];
  const arrived = x.direction === 'embodying' && x.strength === 5;
  const receded = x.direction === 'releasing' && x.strength === 1;
  const age = x.lastChecked ? daysSince(x.lastChecked.slice(0,10)) : Infinity;
  return `<article class="spi-ind ${arrived ? 'arrived' : ''} ${receded ? 'receded' : ''}" draggable="true" data-spiind="${x.id}">
    <div class="spi-ind-top">
      <span class="spi-ind-text">${ed(`spiral.indicators.${idx}.text`, {ph:'a specific behaviour or pattern'})}</span>
      <button class="tbtn spi-x" data-spidel="${x.id}" title="remove">×</button>
    </div>
    <div class="spi-ind-scale">
      ${spiralDotsHTML(x)}
      <span class="spi-ind-word">${x.strength ? esc(scale[x.strength-1]) : 'not rated'}</span>
      <span class="spi-ind-when mono">${x.lastChecked ? esc(relDays(age)) : ''}</span>
    </div>
    <div class="field spi-ind-note">${ed(`spiral.indicators.${idx}.note`, {multi:true, ph:'when this shows up, what sets it off, what you notice'})}</div>
  </article>`;
}
function spiralColumnHTML(dir){
  const pair = spiralPair();
  const stage = pair[dir];
  const [, name, gloss, col] = spiralMeta(stage);
  const list = spiralIndicators(dir);
  const scale = SPIRAL_SCALE[dir];
  return `<div class="spi-col ${dir}" style="--c:${col}" data-spicol="${dir}">
    <div class="spi-col-h">
      <span class="mono">${dir}</span>
      <b class="serif">${esc(name)}</b>
      <span class="faint">${esc(gloss)}</span>
    </div>
    <p class="spi-col-scale mono">1 · ${esc(scale[0])} → 5 · ${esc(scale[4])}</p>
    ${list.length ? list.map(spiralIndicatorHTML).join('')
      : `<div class="empty">${dir === 'releasing'
          ? 'Nothing named yet. What does the stage you are leaving actually make you do — on a Tuesday, not in theory?'
          : 'Nothing named yet. What would somebody living the next stage do this week that you would not?'}</div>`}
    <button class="btn sm ghost spi-add" data-spiadd="${dir}">＋ indicator</button>
  </div>`;
}
function spiralEvidenceHTML(){
  const pair = spiralPair();
  const rows = [[pair.embodying, 'embodying', '+'], [pair.releasing, 'releasing', '−']];
  const any = rows.some(([st, pol]) => spiralEvidence(st, pol).length);
  return `<section class="section rv"><div class="row between" style="align-items:center">
      <span class="sc" style="margin:0">Evidence</span>
      <button class="btn sm ghost" id="spiTagEntry">＋ tag an entry</button></div>
    <p class="muted" style="font-size:.85rem;margin:4px 0 0">Entries from anywhere in the instrument, marked as evidence of one stage or the other. A pattern you claim and a pattern you can point at are different things.</p>
    ${any ? rows.map(([st, pol, sign]) => { const es = spiralEvidence(st, pol); if(!es.length) return '';
      const m = spiralMeta(st);
      return `<div class="spi-ev-group" style="--c:${m[3]}">
        <div class="spi-ev-h mono"><span class="spi-sign ${pol}">${sign}</span> ${esc(pol)} · ${esc(m[1])} <span class="faint">${es.length}</span></div>
        ${es.slice(0, 8).map(e => `<div class="spi-ev" data-spievopen="${e.id}">
          <span class="mono">${esc(fmtDate((e.occurredAt||e.createdAt||'').slice(0,10), 'short'))}</span>
          <span class="spi-ev-t">${esc(e.title || (e.body||'').slice(0,70) || e.type)}</span>
          <button class="tbtn" data-spievdel="${e.id}" title="untag">×</button>
        </div>`).join('')}
        ${es.length > 8 ? `<div class="faint mono" style="font-size:.66rem">and ${es.length-8} more</div>` : ''}
      </div>`; }).join('')
      : '<div class="empty" style="margin-top:10px">Nothing tagged yet.</div>'}
  </section>`;
}
function spiralHistoryHTML(){
  const h = S.spiral.history;
  const W = 100, H = 46;
  const pts = h.map((r, i) => [h.length === 1 ? 50 : (i/(h.length-1))*W, H - (r.progressPosition||0)*H]);
  return `<section class="section rv"><div class="row between" style="align-items:center">
      <span class="sc" style="margin:0">Check-ins</span>
      <button class="btn sm primary" id="spiCheckin">Log a check-in</button></div>
    <p class="muted" style="font-size:.85rem;margin:4px 0 0">A month is about the shortest interval at which this moves. Each check-in freezes every strength, so the line below is history and not a re-reading of today.</p>
    ${h.length ? `<div class="spi-hist">
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="spi-hist-svg">
        ${pts.length > 1 ? `<polyline points="${pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="var(--emb,var(--page-accent))" stroke-width="1.2" vector-effect="non-scaling-stroke"/>` : ''}
        ${pts.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="1.6" fill="var(--emb,var(--page-accent))" vector-effect="non-scaling-stroke"/>`).join('')}
      </svg>
      <div class="stack" style="gap:6px;margin-top:10px">${[...h].reverse().map((r, ri) => { const i = h.length-1-ri;
        return `<div class="spi-hist-row"><span class="mono">${esc(fmtDate(String(r.timestamp).slice(0,10), 'med'))}</span>
          <span class="mono">${Math.round((r.progressPosition||0)*100)}% into ${esc(spiralMeta(r.embodyingStage)?.[1] || r.embodyingStage)}</span>
          <span class="spi-hist-note">${ed(`spiral.history.${i}.note`, {ph:'what shifted, what is still holding'})}</span>
          <button class="tbtn" data-spihistdel="${i}">×</button></div>`; }).join('')}</div>
    </div>` : '<div class="empty" style="margin-top:10px">No check-ins yet.</div>'}
  </section>`;
}

routes.spiral = function(root){
  migrateSpiral();
  const pair = spiralPair();
  const [, , , rCol] = spiralMeta(pair.releasing);
  const [, , , eCol] = spiralMeta(pair.embodying);
  registerPageEntry({pageName:'Spiral', addLabel:'Add an indicator', defaultEntryType:'reflection', prefilledFields:{}, options:[
    {icon:'◇', label:'Embodying indicator', desc:'Something the next stage would have you do.', run:()=>addSpiralIndicator('embodying')},
    {icon:'◈', label:'Releasing indicator', desc:'A pattern belonging to the stage you are leaving.', run:()=>addSpiralIndicator('releasing')}]});
  const empty = !S.spiral.indicators.length;
  root.innerHTML = `<div class="page spiral-page" style="--rel:${rCol};--emb:${eCol}">
    <div class="page-head row between"><div><h1>Spiral</h1></div>${vmToggleHTML('spiral')}</div>
    <p class="muted" style="font-size:.88rem;max-width:640px;margin-top:-6px">A centre of gravity sits between two stages. This is the movement between them, written in behaviour you can actually check.</p>

    ${spiralPairHTML()}
    ${spiralProgressHTML()}

    <section class="section rv">
      <div class="spi-cols">
        ${spiralColumnHTML('releasing')}
        ${spiralColumnHTML('embodying')}
      </div>
      ${empty ? `<div class="row" style="justify-content:center;margin-top:14px"><button class="btn sm ghost" id="spiSeed">start from the Orange → Green example</button></div>
        <p class="faint center" style="font-size:.76rem;margin-top:6px">Eight patterns to react to rather than a blank page. Every one is editable, and none of it is a claim about you.</p>` : ''}
    </section>

    ${spiralEvidenceHTML()}
    ${spiralHistoryHTML()}
  </div>`;

  bindVmToggle(root, 'spiral');
  const btn = root.querySelector('[data-vmkey]'); if(btn) btn.addEventListener('click', () => setTimeout(rerender, 0));

  root.querySelectorAll('[data-spistage]').forEach(s => s.onchange = () => {
    S.spiral.currentPair[s.dataset.spistage] = s.value;
    /* the indicators belong to the stage they were written about, so moving
       the pair re-points the ones that were following it */
    S.spiral.indicators.forEach(x => { if(x.direction === s.dataset.spistage) x.stage = s.value; });
    saveNow(); sound('click'); rerender();
  });
  root.querySelectorAll('[data-spitracestage]').forEach(s => s.onchange = () => {
    const t = byId(S.spiral.traces, s.dataset.spitracestage); if(t){ t.stage = s.value; saveNow(); rerender(); } });
  $('#spiTraceAdd') && ($('#spiTraceAdd').onclick = () => {
    S._spiTraces = true; S.spiral.traces.push({id:uid(), stage:'red', domain:'', note:''}); saveNow(); rerender();
    setTimeout(() => { const n = document.querySelectorAll('.spi-trace .ed'); n.length && beginEdit(n[n.length-2]); }, 60); });
  root.querySelectorAll('[data-spitracedel]').forEach(b => b.onclick = () => {
    const t = byId(S.spiral.traces, b.dataset.spitracedel);
    requestDelete({label:t.domain || 'this trace', node:b.closest('.spi-trace'), remove:() => spliceOut(S.spiral.traces, x => x.id === t.id)}); });

  root.querySelectorAll('[data-spiadd]').forEach(b => b.onclick = () => addSpiralIndicator(b.dataset.spiadd));
  root.querySelectorAll('[data-spidel]').forEach(b => b.onclick = () => {
    const x = byId(S.spiral.indicators, b.dataset.spidel);
    requestDelete({label:x.text || 'this indicator', node:b.closest('.spi-ind'), remove:() => spliceOut(S.spiral.indicators, y => y.id === x.id)}); });
  root.querySelectorAll('[data-spistr]').forEach(b => b.onclick = () => {
    const [id, n] = b.dataset.spistr.split(':');
    const x = byId(S.spiral.indicators, id); if(!x) return;
    x.strength = x.strength === +n ? 0 : +n;          // clicking the current value clears it
    x.lastChecked = new Date().toISOString();
    saveNow(); sound('click'); rerender(); });

  $('#spiSeed') && ($('#spiSeed').onclick = () => seedSpiral());
  $('#spiTagEntry') && ($('#spiTagEntry').onclick = () => openSpiralTagPicker());
  root.querySelectorAll('[data-spievopen]').forEach(r => r.onclick = ev => {
    if(ev.target.closest('[data-spievdel]')) return;
    const e = byId(S.entries, r.dataset.spievopen); if(e && typeof openEntryModal === 'function') openEntryModal({edit:e}); });
  root.querySelectorAll('[data-spievdel]').forEach(b => b.onclick = ev => { ev.stopPropagation();
    const e = byId(S.entries, b.dataset.spievdel); if(!e) return;
    requestDelete({label:`the spiral tag on “${e.title || 'this entry'}”`, node:b.closest('.spi-ev'),
      remove:() => { const was = e.extra.spiral; delete e.extra.spiral; return () => { e.extra.spiral = was; }; }}); });

  $('#spiCheckin') && ($('#spiCheckin').onclick = () => openSpiralCheckin());
  root.querySelectorAll('[data-spihistdel]').forEach(b => b.onclick = () => {
    const i = +b.dataset.spihistdel; const r = S.spiral.history[i];
    requestDelete({label:`the check-in from ${fmtDate(String(r.timestamp).slice(0,10),'med')}`, node:b.closest('.spi-hist-row'),
      remove:() => { const g = S.spiral.history.splice(i,1)[0]; return () => S.spiral.history.splice(i,0,g); }}); });

  bindSpiralDrag(root);
  reveal(root);
};

function addSpiralIndicator(dir){
  migrateSpiral();
  const order = Math.max(-1, ...S.spiral.indicators.filter(x => x.direction === dir).map(x => x.order)) + 1;
  const x = {id:uid(), stage:S.spiral.currentPair[dir], direction:dir, text:'', strength:0, lastChecked:'', note:'', order};
  S.spiral.indicators.push(x); saveNow(); sound('click'); rerender();
  setTimeout(() => { const n = document.querySelector(`[data-spiind="${x.id}"] .spi-ind-text .ed`); n && beginEdit(n); }, 60);
}
/* Offered, never applied on its own: the seed is somebody else's Orange, and
   this room only works if the words in it are the user's own. */
function seedSpiral(){
  migrateSpiral();
  S.spiral.currentPair = {releasing:'orange', embodying:'green'};
  SPIRAL_DIRECTIONS.forEach(dir => SPIRAL_SEED[dir].forEach(([text, strength], i) => {
    S.spiral.indicators.push({id:uid(), stage:S.spiral.currentPair[dir], direction:dir, text, strength,
      lastChecked:new Date().toISOString(), note:'', order:i});
  }));
  const [st, domain, note] = SPIRAL_SEED.trace;
  S.spiral.traces.push({id:uid(), stage:st, domain, note});
  saveNow(); sound('success'); toast('Eight patterns to argue with. Rewrite anything that is not yours.', 6000); rerender();
}
function openSpiralTagPicker(){
  const pair = spiralPair();
  const recent = [...S.entries].sort((a,b) => String(b.occurredAt||b.createdAt).localeCompare(String(a.occurredAt||a.createdAt))).slice(0, 60);
  if(!recent.length){ toast('Nothing written yet to tag.'); return; }
  let stage = pair.embodying, polarity = 'embodying';
  const m = openModal(`<h2>Tag an entry as evidence</h2>
    <p class="muted" style="font-size:.86rem">Which stage does this entry show, and is it the pattern arriving or the pattern still running?</p>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px">
      <select class="sel" id="spiTagStage" style="width:auto">${SPIRAL.map(([k,n,g]) => `<option value="${k}" ${k===stage?'selected':''}>${esc(n)} — ${esc(g)}</option>`).join('')}</select>
      <div class="chip-row" id="spiTagPol">${[['embodying','(+) embodying'],['releasing','(−) releasing']].map(([k,l]) =>
        `<button class="chip click ${k===polarity?'on':''}" data-pol="${k}">${l}</button>`).join('')}</div>
    </div>
    <div class="stack" style="gap:4px;max-height:46vh;overflow:auto">${recent.map(e => `<button class="choice" data-spipick="${e.id}">
      <span class="ico">${esc((e.type||'·').slice(0,1).toUpperCase())}</span>
      <span><b>${esc(e.title || (e.body||'').slice(0,60) || e.type)}</b><div class="d mono">${esc(fmtDate((e.occurredAt||e.createdAt||'').slice(0,10),'med'))} · ${esc(e.type)}${spiralTag(e) ? ` · already tagged ${esc(spiralTag(e).stage)}` : ''}</div></span></button>`).join('')}</div>`);
  m.querySelector('#spiTagStage').onchange = e => { stage = e.target.value; };
  m.querySelectorAll('#spiTagPol [data-pol]').forEach(b => b.onclick = () => {
    polarity = b.dataset.pol; m.querySelectorAll('#spiTagPol [data-pol]').forEach(x => x.classList.toggle('on', x === b)); });
  m.querySelectorAll('[data-spipick]').forEach(b => b.onclick = () => {
    const e = byId(S.entries, b.dataset.spipick); if(!e) return;
    e.extra = e.extra || {}; e.extra.spiral = {stage, polarity};
    saveNow(); m.remove(); sound('success'); rerender(); });
}
function openSpiralCheckin(){
  migrateSpiral();
  const pair = spiralPair();
  const p = spiralProgress();
  const m = openModal(`<h2>Spiral check-in</h2>
    <p class="muted" style="font-size:.86rem">This freezes every indicator strength as it stands now, so the history below stays a record rather than a re-reading.</p>
    <div class="card" style="margin:10px 0"><div class="row between"><span class="mono">position</span><b class="serif">${p == null ? 'not measurable' : `${Math.round(p*100)}% into ${esc(spiralMeta(pair.embodying)?.[1])}`}</b></div>
      <div class="row between"><span class="mono">indicators rated</span><span class="mono">${S.spiral.indicators.filter(x => x.strength > 0).length} of ${S.spiral.indicators.length}</span></div></div>
    <div class="field"><label>What shifted this month? What is still holding?</label><textarea class="ta" id="spiNote" placeholder="Optional, and the most useful part."></textarea></div>
    <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary" id="spiSave">Log it</button></div>`, 'narrow');
  m.querySelector('#spiSave').onclick = () => {
    S.spiral.history.push({timestamp:new Date().toISOString(), releasingStage:pair.releasing, embodyingStage:pair.embodying,
      indicators:S.spiral.indicators.map(x => ({id:x.id, text:x.text, direction:x.direction, strength:x.strength})),
      progressPosition: p == null ? 0 : +p.toFixed(3), note:m.querySelector('#spiNote').value.trim()});
    saveNow(); m.remove(); sound('chime'); toast('Check-in logged.'); rerender();
  };
}
/* drag to reorder, within a column only — an indicator belongs to its side */
function bindSpiralDrag(root){
  let drag = null;
  root.querySelectorAll('[data-spiind]').forEach(node => {
    node.addEventListener('dragstart', ev => { if(ev.target.closest('.ed')){ ev.preventDefault(); return; }
      drag = node.dataset.spiind; node.classList.add('dragging'); ev.dataTransfer.effectAllowed = 'move'; });
    node.addEventListener('dragend', () => { node.classList.remove('dragging'); drag = null;
      root.querySelectorAll('.spi-ind.over').forEach(n => n.classList.remove('over')); });
    node.addEventListener('dragover', ev => { ev.preventDefault(); if(drag && drag !== node.dataset.spiind) node.classList.add('over'); });
    node.addEventListener('dragleave', () => node.classList.remove('over'));
    node.addEventListener('drop', ev => { ev.preventDefault(); node.classList.remove('over');
      const a = byId(S.spiral.indicators, drag), b = byId(S.spiral.indicators, node.dataset.spiind);
      if(!a || !b || a === b || a.direction !== b.direction) return;
      const list = spiralIndicators(a.direction);
      const from = list.indexOf(a), to = list.indexOf(b);
      list.splice(to, 0, list.splice(from, 1)[0]);
      list.forEach((x, i) => x.order = i);
      saveNow(); rerender(); });
  });
}
