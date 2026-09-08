/* ============================================================
   NEEDS — Maslow as a diagnostic layer, not an ornament.

   The seven levels are read off the rest of the instrument, held
   in their structural order, and reported as prose. The point of
   the hierarchy is the claim underneath it: a thin foundation
   constrains everything built on top of it, so the weakest level
   speaks first and says so.
   ============================================================ */

/* the tiny figure that sits on the baseline inside a sentence */
function ledgerSpark(vals, color = 'var(--page-accent)'){
  const v = vals.filter(x => x != null);
  if(v.length < 2) return '';
  const lo = Math.min(...v), hi = Math.max(...v), rng = (hi - lo) || 1;
  const W = 48, H = 14;
  const pts = vals.map((x, i) => x == null ? null : `${((i/(vals.length-1))*W).toFixed(1)},${(H-2 - ((x-lo)/rng)*(H-4)).toFixed(1)}`).filter(Boolean);
  return `<svg class="lg-spark" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" opacity=".8" vector-effect="non-scaling-stroke"/></svg>`;
}
const lgNum = t => `<b class="lg-n">${t}</b>`;

/* ---------- the sentences ----------
   Each level writes its own paragraph out of live data, and drops any clause
   whose data is missing. A stanza with nothing to say returns nothing, rather
   than a sentence full of dashes. */
function ledgerProse(key){
  const T = today(); const c = S.checkins?.[T] || {}; const bits = [];
  const week = lastDays(7);

  if(key === 'body'){
    const r = typeof rhythmDay === 'function' ? rhythmDay() : null;
    const sl = r && r.computed.totalAwakeMinutes != null ? 1440 - r.computed.totalAwakeMinutes : null;
    if(sl != null) bits.push(`You slept ${lgNum(fmtDur(sl))} last night.`);
    const pe = week.map(d => S.checkins?.[d]?.energy?.physical ?? null);
    const pea = avgDefined(pe.map(x => x == null ? null : x));
    if(pea != null) bits.push(`Your body has been around ${lgNum(pea.toFixed(1) + '/5')} this week ${ledgerSpark(pe, 'var(--phys)')}`.trim() + (bits.length ? '' : ''));
    const ph = S.habits.filter(h => !h.archived && !h.negative && h.dimension === 'physical');
    if(ph.length){ const due = ph.filter(h => habitDue(h, T)), done = due.filter(h => habitDone(h, T));
      bits.push(`and you have hit ${lgNum(`${done.length} of ${due.length}`)} physical habit${due.length===1?'':'s'} today.`); }
  }

  if(key === 'safety'){
    if(typeof runway === 'function' && S.finance?.scenarios?.length && (incomeStreamList().length || S.finance.savings)){
      const rw = runway(), sc = activeScenario(), b = monthlyBurn();
      bits.push(`Your runway is ${lgNum(rw.sustainable ? 'open-ended' : `${rw.months.toFixed(1)} months`)}.`);
      bits.push(`The gap is ${lgNum(b <= 0 ? `covered, +${money(-b)}` : `${money(b)}/mo`)} against your ${esc(sc.name)} scenario.`);
      const {passiveShare} = portfolioTotals();
      if(passiveShare > 0) bits.push(`${lgNum(Math.round(passiveShare*100) + '%')} of it does not need your hours.`);
    }
    const ratio = typeof rhythmDay === 'function' ? rhythmDay().computed.ratio : null;
    if(ratio != null) bits.push(`You used ${lgNum(ratio + '%')} of today's claimed hours intentionally.`);
  }

  if(key === 'belonging'){
    const inner = S.people.filter(p => ['core','close'].includes(p.circle));
    if(inner.length){
      const since = addDays(T, -30);
      const n = (S.interactions||[]).filter(i => i.date >= since && inner.some(p => p.id === i.personId)).length;
      bits.push(`You have had ${lgNum(n)} interaction${n===1?'':'s'} with your inner circle this month.`);
      const stale = inner.map(p => ({p, last:(S.interactions||[]).filter(i => i.personId === p.id).map(i => i.date).sort().slice(-1)[0]}))
        .sort((a,b) => String(a.last||'').localeCompare(String(b.last||'')))[0];
      if(stale && stale.last) bits.push(`You have not reached out to ${lgNum(esc(stale.p.name))} in ${lgNum(daysSince(stale.last) + ' days')}.`);
      else if(stale) bits.push(`${lgNum(esc(stale.p.name))} has no interaction logged at all.`);
    }
    const rr = mHabitRate(h => !!h.relational);
    if(rr != null) bits.push(`Relational rituals: ${lgNum(rr + '%')} this week.`);
  }

  if(key === 'esteem'){
    const live = S.skills.filter(s => !s.archived && s.horizon !== 'someday');
    if(live.length){
      const since = addDays(T, -30);
      const practised = live.filter(s => { const l = skillLastPracticed(s); return l && l >= since; });
      const top = practised.map(s => ({s, l:skillLastPracticed(s)})).sort((a,b) => String(b.l).localeCompare(String(a.l)))[0];
      bits.push(`You have practised ${lgNum(practised.length)} skill${practised.length===1?'':'s'} this month${top ? ` (most recent: ${lgNum(esc(top.s.name))})` : ''}.`);
    }
    const alive = S.projects.filter(p => !['archived','abandoned','completed'].includes(p.status));
    if(alive.length){
      const coldest = alive.map(p => ({p, d: daysSince((S.nods||[]).filter(n => n.projectId === p.id).map(n => n.date).sort().slice(-1)[0])}))
        .sort((a,b) => b.d - a.d)[0];
      bits.push(`${lgNum(alive.length)} project${alive.length===1?' is':'s are'} alive${coldest && coldest.d > 7 ? `; the coldest is ${lgNum(esc(coldest.p.name))}` : ''}.`);
    }
    if(S.wsDaily && Object.keys(S.wsDaily).length){
      const w = sum(week.map(d => typeof wsWrittenOn === 'function' ? wsWrittenOn(d) : 0));
      const sess = week.filter(d => (typeof wsWrittenOn === 'function' ? wsWrittenOn(d) : 0) > 0).length;
      if(w) bits.push(`You wrote ${lgNum(w.toLocaleString())} words this week across ${lgNum(sess)} session${sess===1?'':'s'}.`);
    }
  }

  if(key === 'mind'){
    const since = addDays(T, -30);
    const ms = (typeof mediaEntries === 'function' ? mediaEntries() : []).filter(e => (e.occurredAt||e.createdAt||'').slice(0,10) >= since);
    if(ms.length){
      const best = ms.find(e => ['lives','changed'].includes(e.extra?.resonanceLevel));
      bits.push(`You took in ${lgNum(ms.length)} work${ms.length===1?'':'s'} this month${best ? `; ${lgNum(esc(best.title))} ${best.extra.resonanceLevel === 'lives' ? 'is still living in you' : 'changed something'}` : ''}.`);
    }
    const js = S.entries.filter(e => ['reflection','question','synchronicity'].includes(e.type) && (e.occurredAt||e.createdAt||'').slice(0,10) >= addDays(T,-7));
    if(js.length) bits.push(`You wrote ${lgNum(js.length)} journal entr${js.length===1?'y':'ies'} this week.`);
    const me = week.map(d => S.checkins?.[d]?.energy?.mental ?? null);
    if(c.energy?.mental) bits.push(`Mental energy: ${lgNum(c.energy.mental + '/5')} today ${ledgerSpark(me, 'var(--ment)')}`);
  }

  if(key === 'beauty'){
    const since = addDays(T, -30);
    const creative = S.projects.filter(p => !(p.income?.current || p.income?.target) && !['archived','abandoned'].includes(p.status));
    if(creative.length){
      const n = (S.nods||[]).filter(x => x.date >= since && creative.some(p => p.id === x.projectId)).length;
      bits.push(`Your creative projects have been ${lgNum(n >= 8 ? 'busy' : n >= 3 ? 'ticking over' : n ? 'quiet' : 'silent')} — ${lgNum(n)} nod${n===1?'':'s'} this month.`);
    }
    const art = (typeof mediaEntries === 'function' ? mediaEntries() : []).filter(e =>
      ['film','album','exhibition','documentary'].includes(e.extra?.kind) && (e.occurredAt||e.createdAt||'').slice(0,10) >= since);
    if(art.length) bits.push(`You saw or heard ${lgNum(art.length)} thing${art.length===1?'':'s'} made to be beautiful.`);
    const awe = mValueCongruence(['awe','creativ','beauty']);
    if(awe != null) bits.push(`Awe and creativity sit at ${lgNum(Math.round(awe) + '%')} congruence.`);
  }

  if(key === 'becoming'){
    const vv = mVisionVividness();
    const nv = S.visions.filter(v => !v.archived && v.confidence !== 'lived').length;
    if(vv != null) bits.push(`Your visions average ${lgNum(Math.round(vv))} vividness across ${lgNum(nv)} live branch${nv===1?'':'es'}.`);
    if(S.rehearsal?.cycleStart){
      const day = clamp(daysBetween(S.rehearsal.cycleStart, T) + 1, 1, 21);
      bits.push(`You are on day ${lgNum(day + ' of 21')} in the Morning Theatre (${(S.rehearsal.days||[]).includes(T) ? 'practised today' : 'not yet today'}).`);
    }
    const cg = mValueCongruence();
    if(cg != null){ const worst = valueGaps()[0];
      bits.push(`Overall values alignment: ${lgNum(Math.round(cg) + '%')}${worst ? ` — biggest gap: ${lgNum(esc(worst.name))}` : ''}.`); }
    const sps = week.map(d => S.checkins?.[d]?.setpoint ?? null);
    if(c.setpoint) bits.push(`Set-point: ${lgNum(esc(hicksName(c.setpoint).split(' / ')[0]))} ${ledgerSpark(sps, 'var(--rose)')}`);
  }

  return bits.join(' ').trim();
}

/* ---------- a stanza ---------- */
function ledgerStanzaHTML(m, {flag = ''} = {}){
  const prose = ledgerProse(m.key);
  const s = m.effectiveScore;
  const weight = s == null ? '' : s > 80 ? 'whisper' : s < 40 ? 'speaks' : '';
  const hue = m.level <= 2 ? 'var(--gold)' : m.level <= 4 ? 'var(--page-accent)' : m.level <= 6 ? 'var(--sage)' : 'var(--ment)';
  const dash = s == null ? 0 : s;
  return `<article class="lg-stanza ${weight}" style="--c:${hue}" data-ledger="${m.key}">
    <div class="lg-h">
      <span class="lg-pie" aria-hidden="true"><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="var(--line-2)" stroke-width="3"/>
        <circle cx="10" cy="10" r="8" fill="none" stroke="${hue}" stroke-width="3" stroke-dasharray="${(dash/100*50.3).toFixed(1)} 50.3" transform="rotate(-90 10 10)" stroke-linecap="round"/></svg></span>
      <span class="lg-name">${esc(m.short)}</span>
      ${flag ? `<span class="lg-flag">${esc(flag)}</span>` : ''}
      <span class="lg-score mono">${s == null ? '—' : s}${m.override != null ? ' ↕' : ''}</span>
    </div>
    <div class="lg-body">${prose || `<span class="lg-none">No data yet. ${esc(m.ask)} <a href="${m.go}">Start here →</a></span>`}</div>
  </article>`;
}

/* The weakest level first, and named as such — that ordering is the whole
   argument. Everything after it runs in Maslow's own order. */
function ledgerStanzasHTML({limit = 0, title = 'The life ledger', hint = '', showEmpty = false, link = true} = {}){
  const levels = maslowScores();
  /* A level with nothing feeding it is still a level. In the full ledger it
     keeps its place and says what would fill it; in the short one on Today it
     stands aside for a level that has something to report. */
  const withProse = showEmpty ? levels : levels.filter(m => ledgerProse(m.key) || m.effectiveScore != null);
  if(!withProse.length) return '';
  const scored = withProse.filter(m => m.effectiveScore != null);
  const weakest = scored.length ? scored.reduce((a,b) => b.effectiveScore < a.effectiveScore ? b : a) : null;
  const rest = withProse.filter(m => m !== weakest);
  const showAll = !!S._ledgerAll || !limit;
  const shown = showAll ? rest : rest.slice(0, Math.max(0, limit - 1));
  const hidden = rest.length - shown.length;
  return `<section class="section rv life-ledger" id="lifeLedger"><a id="t-ledger"></a>
    <div class="row between" style="align-items:baseline"><span class="sc lg-title" style="margin:0">${esc(title)}</span>
      ${link ? '<a class="mono faint" href="#/needs" style="text-decoration:none">all seven levels →</a>' : ''}</div>
    ${hint ? `<p class="muted" style="font-size:.85rem;margin:4px 0 0">${esc(hint)}</p>` : ''}
    ${weakest ? ledgerStanzaHTML(weakest, {flag:'this is where your foundation is thinnest'}) : ''}
    ${shown.map(m => ledgerStanzaHTML(m)).join('')}
    ${hidden > 0 ? `<button class="btn sm ghost" id="ledgerAll" style="margin-top:8px">Read all seven levels…</button>` : ''}
    ${showAll && limit ? `<button class="btn sm ghost" id="ledgerAll" style="margin-top:8px">show fewer</button>` : ''}
  </section>`;
}
function bindLedger(root){
  const box = root.querySelector('#lifeLedger'); if(!box) return;
  const b = box.querySelector('#ledgerAll');
  if(b) b.onclick = () => { S._ledgerAll = !S._ledgerAll; rerender(); };
  box.querySelectorAll('[data-ledger]').forEach(st => st.addEventListener('click', ev => {
    if(ev.target.closest('a, button')) return;
    const m = maslowMeta(st.dataset.ledger); if(m) navigate(m.go);
  }));
}

/* ---------- history: one line per level ---------- */
function needsHistoryHTML(){
  const p = maslowStore();
  const h = p.history.filter(x => Array.isArray(x.levels)).slice(-36);
  if(h.length < 2) return `<div class="empty" style="margin-top:10px">${h.length ? 'One check-in logged. A second one makes a line.' : 'No check-ins yet — the button above freezes today’s seven scores so they can be compared later.'}</div>`;
  const W = 320, H = 130, pad = 4;
  const x = i => (i/(h.length-1)) * W;
  const y = v => H - pad - (v/100) * (H - pad*2);
  return `<div class="needs-hist">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="needs-hist-svg">
      ${[0,50,100].map(v => `<line x1="0" y1="${y(v).toFixed(1)}" x2="${W}" y2="${y(v).toFixed(1)}" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".6"/>`).join('')}
      ${MASLOW.map(m => {
        const col = m.level <= 2 ? 'var(--gold)' : m.level <= 4 ? 'var(--page-accent)' : m.level <= 6 ? 'var(--sage)' : 'var(--ment)';
        const pts = h.map((r, i) => { const v = (r.levels.find(l => l.key === m.key)||{}).effectiveScore; return v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`; }).filter(Boolean);
        return pts.length > 1 ? `<polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="1.4" vector-effect="non-scaling-stroke" opacity=".8"><title>${esc(m.name)}</title></polyline>` : '';
      }).join('')}
    </svg>
    <div class="needs-hist-key">${MASLOW.map(m => { const col = m.level <= 2 ? 'var(--gold)' : m.level <= 4 ? 'var(--page-accent)' : m.level <= 6 ? 'var(--sage)' : 'var(--ment)';
      return `<span><i style="background:${col}"></i>${esc(m.short)}</span>`; }).join('')}</div>
    <div class="row between mono faint" style="font-size:.6rem"><span>${esc(fmtDate(String(h[0].timestamp).slice(0,10),'short'))}</span><span>${esc(fmtDate(String(h[h.length-1].timestamp).slice(0,10),'short'))}</span></div>
  </div>`;
}

/* ---------- a diagnostic card, on hover or focus ---------- */
function needsDiagnosticHTML(m){
  const known = Object.entries(m.inputs).filter(([, v]) => v != null);
  return `<div class="needs-diag" data-diag="${m.key}">
    <div class="nd-h"><b class="serif">${esc(m.name)}</b><span class="mono">${m.effectiveScore == null ? 'no data' : m.effectiveScore}</span></div>
    <div class="nd-inputs">${known.length ? known.map(([k, v]) => `<span>${esc(k)} <b class="mono">${Math.round(v)}</b></span>`).join('')
      : '<span class="faint">Nothing feeding this level yet.</span>'}</div>
    ${m.override != null ? `<div class="nd-ov mono">auto ${m.autoScore == null ? '—' : m.autoScore} → you ${m.override}</div>` : ''}
    ${m.note ? `<div class="nd-note">${esc(m.note)}</div>` : ''}
    <p class="nd-ask">${esc(m.ask)}</p>
    <a class="nd-go mono" href="${m.go}">→ go deeper</a>
  </div>`;
}

routes.needs = function(root){
  const levels = maslowScores();
  const scored = levels.filter(m => m.effectiveScore != null);
  const weakest = scored.length ? scored.reduce((a,b) => b.effectiveScore < a.effectiveScore ? b : a) : null;
  const sel = S._mTier ? levels.find(l => l.key === S._mTier) : null;
  const p = maslowStore();
  const last = p.history[p.history.length-1];
  registerPageEntry({pageName:'Needs', addLabel:'Log a check-in', defaultEntryType:'reflection', prefilledFields:{}, options:[
    {icon:'🔺', label:'Needs check-in', desc:'Freeze all seven scores as they stand.', run:()=>logNeedsCheckin()}]});
  root.innerHTML = `<div class="page needs-page">
    <div class="page-head"><h1>Needs</h1></div>
    <p class="muted" style="font-size:.88rem;max-width:640px;margin-top:-6px">Seven levels, read off everything else you log, held in their structural order. Deficit at a lower level constrains what can be built above it — so this page is arranged to make a thin foundation impossible to miss.</p>

    <div class="needs-grid">
      <div class="needs-pyr">
        ${maslowPyramidSVG(levels)}
        <p class="faint center" style="font-size:.76rem;margin-top:6px">${weakest ? `${esc(weakest.short)} is pulsing because it is the thinnest. Tap any tier.` : 'Tap any tier to see what feeds it.'}</p>
      </div>
      <div class="needs-side">
        ${levels.map(needsDiagnosticHTML).join('')}
      </div>
    </div>

    ${sel ? `<div class="mas-detail">
      <div class="row between" style="align-items:baseline">
        <b class="serif">${esc(sel.name)}</b>
        <button class="tbtn" id="mClose">close</button>
      </div>
      <p class="mas-ask">${esc(sel.ask)}</p>
      <div class="mas-inputs">${Object.entries(sel.inputs).filter(([,v])=>v!=null)
        .map(([k,v]) => `<span class="chip">${esc(k)} <b class="mono">${Math.round(v)}</b></span>`).join('') || '<span class="faint">Nothing logged for this level yet.</span>'}</div>
      <div class="field" style="margin-top:10px"><label>How it actually feels ${sel.autoScore != null ? `<span class="mono faint" style="text-transform:none;letter-spacing:0">· the data says ${sel.autoScore}</span>` : ''}</label>
        <input type="range" class="slider ov-slider" min="0" max="100" id="mOverride" value="${sel.effectiveScore ?? 50}" style="--c:var(--page-accent);${sel.autoScore != null ? `--tick:${sel.autoScore}%` : ''}">
        <div class="row between mono"><span class="faint">0</span><span id="mOverrideV">${sel.effectiveScore ?? 50}</span><span class="faint">100</span></div>
        ${sel.override != null && sel.autoScore != null ? `<div class="mono faint" style="margin-top:4px">Auto: ${sel.autoScore} → You: ${sel.override}</div>` : ''}
      </div>
      <textarea class="ta" id="mNote" rows="2" placeholder="Why does this feel different from what the numbers say?">${esc(sel.note)}</textarea>
      <div class="row" style="gap:8px;margin-top:8px">
        <a class="btn sm ghost" href="${sel.go}">→ go deeper</a>
        ${sel.override != null ? `<button class="btn sm ghost" id="mClearOv">use the data's number</button>` : ''}
      </div>
    </div>` : ''}

    ${ledgerStanzasHTML({title:'The life ledger', showEmpty:true, link:false, hint:'The same seven levels, said in sentences rather than numbers. Click a stanza to go where its data lives.'})}

    <section class="section rv"><div class="row between" style="align-items:center">
        <span class="sc" style="margin:0">Check-ins</span>
        <span class="row" style="gap:8px;align-items:baseline"><span class="mono faint">${last ? `last ${esc(fmtDate(String(last.timestamp).slice(0,10),'med'))}` : 'never'}</span>
        <button class="btn sm primary" id="needsLog">Log a check-in</button></span></div>
      ${needsHistoryHTML()}
    </section>
  </div>`;

  const redraw = () => rerender();
  root.querySelectorAll('[data-mtier]').forEach(g => g.onclick = () => {
    S._mTier = S._mTier === g.dataset.mtier ? null : g.dataset.mtier; redraw(); });
  root.querySelectorAll('[data-diag]').forEach(d => d.addEventListener('click', ev => {
    if(ev.target.closest('a')) return; S._mTier = d.dataset.diag; redraw(); }));

  const ov = root.querySelector('#mOverride');
  if(ov){ const key = S._mTier;
    ov.oninput = () => { root.querySelector('#mOverrideV').textContent = ov.value; };
    ov.onchange = () => { p.overrides[key] = Object.assign({}, p.overrides[key], {score:+ov.value}); saveNow(); redraw(); }; }
  const nt = root.querySelector('#mNote');
  if(nt) nt.onchange = () => { const key = S._mTier; p.overrides[key] = Object.assign({}, p.overrides[key], {note:nt.value.trim()}); saveNow(); };
  root.querySelector('#mClearOv') && (root.querySelector('#mClearOv').onclick = () => {
    const key = S._mTier; if(p.overrides[key]) delete p.overrides[key].score; saveNow(); redraw(); });
  root.querySelector('#mClose') && (root.querySelector('#mClose').onclick = () => { S._mTier = null; redraw(); });
  root.querySelector('#needsLog').onclick = () => logNeedsCheckin();
  bindLedger(root);
  reveal(root);
};

function logNeedsCheckin(){
  const p = maslowStore();
  const levels = maslowScores().map(m => ({key:m.key, level:m.level, name:m.name,
    autoScore:m.autoScore, override:m.override, effectiveScore:m.effectiveScore, note:m.note, inputs:m.inputs}));
  const read = typeof spiralReading === 'function' ? spiralReading() : null;
  p.history.push(Object.assign({timestamp:new Date().toISOString(), levels},
    read ? {resonance:read.resonance, primaryStage:read.primary, emergingStage:read.emerging, userConfirmed:read.confirmed, userNote:read.note} : {}));
  saveNow(); sound('success'); toast(`Seven levels frozen for ${fmtDate(today(),'med')}.`);
  if(currentRoute) rerender();
}

/* ---------- what a thin foundation is allowed to say elsewhere ----------
   A vision resting on a level scoring under 40 gets one line, on the vision,
   naming the constraint. It is a note, not a veto. */
const VALUE_LEVEL_HINTS = {
  safety:    ['secur','money','financ','stabil','safe','independ'],
  belonging: ['connect','love','family','communit','belong','friend'],
  esteem:    ['master','craft','recogni','respect','achiev','excellen'],
  mind:      ['learn','curios','knowledge','understand','truth'],
  beauty:    ['beauty','awe','creativ','art','wonder'],
  body:      ['health','vital','energy','body','rest'],
};
function visionFoundationNote(v){
  const scores = {}; maslowScores().forEach(m => scores[m.key] = m.effectiveScore);
  const names = (v.values || []).map(id => byId(S.values, id)?.name || '').join(' ').toLowerCase();
  const text = `${v.name} ${v.futureMemory || ''}`.toLowerCase();
  for(const [key, words] of Object.entries(VALUE_LEVEL_HINTS)){
    if(scores[key] == null || scores[key] >= 40) continue;
    if(words.some(w => names.includes(w)) || words.some(w => text.includes(w))){
      const m = maslowMeta(key);
      return `This vision asks for ${m.name.toLowerCase()}, which is your weakest foundation right now (${scores[key]}).`;
    }
  }
  return '';
}

/* ---------- where a value sits on the spiral ----------
   Not a classification of the person — a note that this particular value has
   a natural home in the model, offered where the value is being thought about. */
const SPIRAL_VALUE_HINTS = {
  purple:    ['tradition','family','belong','roots','ancestor','loyal'],
  red:       ['power','freedom','courage','autonom','strength','boldness'],
  blue:      ['disciplin','duty','integrity','order','honour','faith','responsib'],
  orange:    ['achiev','master','excellen','success','growth','ambition','independ'],
  green:     ['connect','empath','communit','compassion','authentic','equal','care'],
  yellow:    ['systems','understand','curios','truth','complexity','competence'],
  turquoise: ['wholeness','awe','sacred','unity','service','stewardship'],
};
function valueStageNote(v){
  const n = String(v?.name || '').toLowerCase(); if(!n) return '';
  const hits = Object.entries(SPIRAL_VALUE_HINTS).filter(([, ws]) => ws.some(w => n.includes(w))).map(([k]) => k);
  if(!hits.length) return '';
  const names = hits.map(k => spiralMeta(k)?.[1]).filter(Boolean);
  const pair = typeof spiralPair === 'function' ? spiralPair() : null;
  const onPath = pair && hits.some(k => k === pair.embodying || k === pair.releasing);
  return `In Spiral terms this value sits ${names.length > 1 ? `on the ${names.join('/')} boundary` : `with ${names[0]}`}${onPath ? ' — one of the two stages you are moving between' : ''}.`;
}
