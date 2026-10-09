/* ============================================================
   THE ALIGNMENT LENS, AND THE SPIRAL DRAWN

   The Maslow lens asks whether needs are met. The Spiral reads which
   developmental stage behaviour suggests. Neither asks whether the life is
   pointed where the sheet says it is pointed. This does — in six readings that
   are shown side by side and NEVER averaged. There is no composite figure
   anywhere in this file, in the stored record, or in any export, and none is to
   be added: a number here is a bearing and not a mark, and the course warns
   that identifying as the person who is self-actualising becomes a new ego.

   A reading with no data is dropped, with the reason, and never drawn as zero.
   The lenses live on the Review beside "Where am I right now" and are consulted
   on retreats; nothing here is added to Today.
   ============================================================ */

const ALIGN_KEYS = ['clarity', 'congruence', 'expression', 'labour', 'projection'];
const ALIGN_META = {
  clarity: {name: 'Clarity', ask: 'Do I know what this is for?', hue: 'var(--sage)', go: '#/purpose'},
  congruence: {name: 'Congruence', ask: 'Am I living what I say matters?', hue: 'var(--terra)', go: '#/values'},
  expression: {name: 'Expression', ask: 'Am I using what I am good at?', hue: 'var(--gold)', go: '#/purpose/strengths'},
  labour: {name: 'Labour', ask: 'Am I actually building it?', hue: 'var(--rose)', go: '#/today/time'},
  projection: {name: 'Projection', ask: 'Is there something to aim at?', hue: 'var(--sage)', go: '#/purpose/vision'},
};
function alignStore(){
  const p = maslowStore();
  p.align = p.align && typeof p.align === 'object' ? p.align : {};
  if(!p.align.overrides) p.align.overrides = {};
  if(!p.spiralOv) p.spiralOv = {};
  return p;
}

/* ---------- the readings ---------- */
function alignmentRead(T = today()){
  const out = {}, drop = {};
  /* clarity: the one honest percentage, because it counts filled fields */
  if(typeof purposeState === 'function'){
    const filled = PURPOSE_KEYS.filter(k => purposeHas(k));
    if(filled.length) out.clarity = {auto: filled.length * 20, inputs: {filled: filled.map(k => PURPOSE_FIELDS[k].label), empty: PURPOSE_KEYS.filter(k => !filled.includes(k)).map(k => PURPOSE_FIELDS[k].label)},
      said: `${filled.length} of the five purpose artefacts have a current wording`, rule: 'the share of the five artefacts with a current non-empty wording, times twenty — it counts filled fields and judges nothing about a life'};
    else drop.clarity = 'the sheet has not been started';
  }
  /* congruence: the existing reading, unchanged */
  const cg = typeof mValueCongruence === 'function' ? mValueCongruence() : null;
  if(cg != null) out.congruence = {auto: Math.round(cg), inputs: {values: (S.valueOrder || []).length}, said: 'the latest real snapshot over your ranked values', rule: 'the mean congruence of the latest snapshot over the ranked values, the same figure the Maslow lens reads'};
  else drop.congruence = 'no values snapshot has been taken';
  /* expression */
  const ss = typeof strengthsLastSnapshot === 'function' ? strengthsLastSnapshot() : null;
  if(ss && Object.keys(ss.ratings).length){ const vs = Object.values(ss.ratings);
    out.expression = {auto: Math.round(sum(vs) / vs.length), inputs: {readingOn: ss.date, strengths: vs.length}, said: `the strengths reading of ${fmtDate(ss.date, 'med')}`, rule: 'the mean of the latest strengths expression reading'}; }
  else drop.expression = 'no strengths expression reading has been taken';
  /* labour: the reading the system could not produce */
  if(typeof zogAnyDesignated === 'function' && zogAnyDesignated()){
    const days = Array.from({length: 28}, (_, i) => addDays(T, -i)), target = zogTargetState().minutes;
    const mean = sum(days.map(d => zogMinutesOn(d))) / 28;
    if(target > 0) out.labour = {auto: Math.min(100, Math.round(mean / target * 100)), inputs: {meanMinutes: Math.round(mean), target, days: 28},
      said: `${Math.round(mean)} zone-of-genius minutes a day on average, against ${target}`, rule: 'mean daily zone-of-genius minutes over twenty-eight days (four whole weeks, so no weekday distorts it) against the daily commitment, capped at a hundred'};
    else drop.labour = 'no daily zone-of-genius commitment is set';
  } else drop.labour = 'no category or skill is marked as zone-of-genius work';
  /* projection: thin on purpose */
  const open = (S.visions || []).filter(v => !v.archived && v.status !== 'completed');
  const both = open.filter(v => String(v.futureMemory || '').trim() && String(v.currentReality || '').trim());
  if(open.length) out.projection = {auto: Math.min(3, both.length) * 33, inputs: {open: open.length, withBoth: both.length},
    said: `${both.length} of ${open.length} open vision${open.length === 1 ? '' : 's'} have both a written future and a current reality`, rule: 'open visions with both a written future and a current reality, capped at three, times thirty-three — one clear target beats several murky ones'};
  else drop.projection = 'no vision has been written';
  /* obstruction: a pair of counts, deliberately not inverted into a positive reading */
  let obs = null;
  const beliefs = typeof beliefsAll === 'function' ? beliefsAll('belief') : [];
  const rl = typeof resistanceLoad === 'function' ? resistanceLoad(addDays(T, -27), T) : {count: 0};
  const anyDemons = beliefs.length || (S.entries || []).some(e => e.type === 'resistance');
  if(anyDemons){
    const since = addDays(T, -90);
    const sticky = beliefs.filter(b => b.strength >= 3 && !(b.challenges || []).some(c => (c.at || '').slice(0, 10) >= since)).length;
    obs = {stickyBeliefs: sticky, resistanceLoad: rl.count};
  }
  return {out, drop, obs, at: T};
}

/* the snapshot on check-in, exactly as the Maslow lens does */
function alignmentSnapshot(){
  const r = alignmentRead(), st = alignStore();
  const auto = {}, inputs = {}, override = {}, notes = {};
  ALIGN_KEYS.forEach(k => { auto[k] = r.out[k] ? r.out[k].auto : null; if(r.out[k]) inputs[k] = r.out[k].inputs;
    const o = st.align.overrides[k]; if(o && o.score != null) override[k] = o.score; if(o && o.note) notes[k] = o.note; });
  lifeArray('alignmentChecks').push({id: uid(), at: new Date().toISOString(), auto, obstruction: r.obs || null, override, notes, inputs});
}
const alignmentHistory = k => lifeArray('alignmentChecks').slice(-12).map(c => c.auto && c.auto[k] != null ? c.auto[k] : null);

/* ---------- the idle line: once a month, only when true ---------- */
function alignmentIdleLine(r){
  const c = r.out.congruence, e = r.out.expression, l = r.out.labour;
  if(!c || !e || !l || !(c.auto > 60 && e.auto > 60 && l.auto < 30)) return '';
  const st = alignStore(), month = today().slice(0, 7);
  if(st.align.idleMonth === month && st.align.idleOn !== today()) return '';
  st.align.idleMonth = month; st.align.idleOn = today();
  return `<p class="al-idle serif">This looks like a well-aligned period in which little was built. The course’s position is that ninety per cent of a purpose is work that nobody sees.</p>`;
}

/* ---------- the three lenses on the Review ---------- */
const LENS_TABS = [['needs', 'Needs'], ['alignment', 'Alignment'], ['spiral', 'The Spiral']];
function lensesHTML(){
  const tab = LENS_TABS.some(t => t[0] === S._lensTab) ? S._lensTab : 'needs';
  const head = `<div class="lens-tabs" role="tablist" aria-label="lenses">${LENS_TABS.map(([k, n]) => `<button role="tab" class="${k === tab ? 'on' : ''}" data-lens="${k}">${n}</button>`).join('')}</div>`;
  return head + (tab === 'needs' ? (typeof positionHTML === 'function' ? positionHTML() : '') : tab === 'alignment' ? alignmentHTML() : spiralHTML());
}
function bindLenses(root, redraw){
  root.querySelectorAll('[data-lens]').forEach(b => b.onclick = () => { S._lensTab = b.dataset.lens; redraw(); });
  const al = root.querySelector('.align-lens'); if(al) bindAlignment(al, redraw);
  const sp = root.querySelector('.spiral-lens'); if(sp) bindSpiral(sp, redraw);
}

function alignmentHTML(){
  const r = alignmentRead(), st = alignStore(), sel = S._alSel;
  const eff = k => { const o = st.align.overrides[k]; return o && o.score != null ? o.score : r.out[k].auto; };
  const dropped = ALIGN_KEYS.filter(k => !r.out[k]);
  const detail = sel && ALIGN_META[sel] && r.out[sel] ? (() => { const m = ALIGN_META[sel], x = r.out[sel], o = st.align.overrides[sel] || {};
    return `<div class="mas-detail"><div class="row between" style="align-items:baseline"><b class="serif" style="color:${m.hue}">${m.name}</b><button class="tbtn" id="alClose">close</button></div>
      <p class="mas-ask">${esc(m.ask)}</p><p>${esc(x.said)}.</p><p class="faint" style="font-size:.8rem">The rule: ${esc(x.rule)}.</p>
      ${lensOverrideHTML({id: 'al', auto: x.auto, value: eff(sel), hue: m.hue, note: o.note, hasOverride: o.score != null, go: m.go})}</div>`; })() : '';
  return `<section class="section rv align-lens">
    <div class="row between" style="align-items:baseline;flex-wrap:wrap;gap:8px"><span class="sc lg" style="margin:0">Is the life pointed where the sheet says?</span>
      <span class="row" style="gap:8px"><button class="btn sm primary" id="alLog">Take a reading</button></span></div>
    <p class="faint" style="font-size:.82rem">Six readings, side by side. They are never added up into one figure, on purpose: a number here is a bearing and not a mark.</p>
    <div class="al-grid">${ALIGN_KEYS.map(k => { const m = ALIGN_META[k], x = r.out[k];
      if(!x) return `<div class="al-card dropped"><div class="al-name">${m.name}</div><div class="faint">${esc(r.drop[k] || 'no data')} — left out rather than drawn as nothing.</div></div>`;
      const ov = (st.align.overrides[k] || {}).score;
      return `<button class="al-card${sel === k ? ' on' : ''}" data-alsel="${k}" style="--c:${m.hue}"><div class="al-name">${m.name}</div>
        <div class="al-num mono">${eff(k)}${ov != null ? `<small> you say · data ${x.auto}</small>` : ''}</div>
        <div class="al-bar"><i style="width:${eff(k)}%"></i></div><div class="faint al-q">${esc(m.ask)}</div>
        ${sparkline(alignmentHistory(k), {h: 18, min: 0, max: 100, color: 'currentColor'})}</button>`; }).join('')}
      ${r.obs ? `<div class="al-card obs"><div class="al-name">Obstruction</div>
        <div class="al-pair"><div><b class="mono">${r.obs.stickyBeliefs}</b><span class="faint"> sticky belief${r.obs.stickyBeliefs === 1 ? '' : 's'}</span></div><div><b class="mono">${r.obs.resistanceLoad}</b><span class="faint"> thing${r.obs.resistanceLoad === 1 ? '' : 's'} avoided, last four weeks</span></div></div>
        <div class="faint al-q">What is in the way. Two counts, not a score — and not turned into a positive reading, because a reading that rises when you are honest would punish honesty. A sticky belief is one gripping at strength three or more with no challenge in ninety days.</div></div>`
        : `<div class="al-card dropped"><div class="al-name">Obstruction</div><div class="faint">nothing has been written in the inner-demons registers — left out rather than drawn as nothing.</div></div>`}</div>
    ${detail}
    ${alignmentIdleLine(r)}
    ${dropped.length === ALIGN_KEYS.length ? '<p class="faint">Nothing here has data yet. Write the sheet, take a values snapshot, and the readings will begin.</p>' : ''}
  </section>`;
}
function bindAlignment(sec, redraw){
  const st = alignStore();
  sec.querySelectorAll('[data-alsel]').forEach(b => b.onclick = () => { S._alSel = S._alSel === b.dataset.alsel ? null : b.dataset.alsel; redraw(); });
  const cl = sec.querySelector('#alClose'); if(cl) cl.onclick = () => { S._alSel = null; redraw(); };
  const k = S._alSel;
  if(k) lensOverrideBind(sec, 'al', null, patch => { st.align.overrides[k] = Object.assign({}, st.align.overrides[k], patch); }, () => { if(st.align.overrides[k]) delete st.align.overrides[k].score; }, redraw);
  const lg = sec.querySelector('#alLog'); if(lg) lg.onclick = () => { alignmentSnapshot(); saveNow(); sound('success'); toast('Reading kept.'); redraw(); };
}

/* ---------- the Spiral, drawn ---------- */
function spiralHTML(){
  const st = alignStore(), res = spiralResonance(), rd = spiralReading(res), sel = S._spSel && spiralMeta(S._spSel) ? S._spSel : null;
  const eff = k => st.spiralOv[k] && st.spiralOv[k].score != null ? st.spiralOv[k].score : res[k];
  const rows = SPIRAL.map(([k, name, tag, hue]) => `<button class="sp-row${sel === k ? ' on' : ''}" data-spsel="${k}" style="--c:${hue}"><span class="sp-n"><i style="background:${hue}"></i>${esc(name)} <span class="faint">${esc(tag)}</span></span>
      <span class="sp-bar"><i style="width:${eff(k)}%"></i></span><span class="mono sp-v">${eff(k)}</span></button>`).join('');
  const detail = sel ? (() => { const m = spiralMeta(sel), sig = SPIRAL_LAST[sel] || [], labels = SPIRAL_LABELS[sel] || [], o = st.spiralOv[sel] || {};
    return `<div class="mas-detail"><div class="row between" style="align-items:baseline"><b class="serif" style="color:${m[3]}">${esc(m[1])} · ${esc(m[2])}</b><button class="tbtn" id="spClose">close</button></div>
      <p class="mas-ask">${esc(m[4])}</p>
      <p class="faint" style="font-size:.8rem">What was read to make this ${res[sel]}: each line below is one input, and a line with no data is left out of the average, not counted as nought.</p>
      <ul class="sp-in">${labels.map((l, i) => `<li><span class="mono">${sig[i] == null ? 'no data' : Math.round(sig[i])}</span> ${esc(l)}</li>`).join('')}</ul>
      ${lensOverrideHTML({id: 'sp', auto: res[sel], value: eff(sel), hue: m[3], note: o.note, hasOverride: o.score != null})}</div>`; })() : '';
  const saved = maslowStore().spiral || {};
  return `<section class="section rv spiral-lens">
    <div class="row between" style="align-items:baseline;flex-wrap:wrap;gap:8px"><span class="sc lg" style="margin:0">The Spiral</span><span class="mono faint">all eight, none crowned</span></div>
    <p class="faint" style="font-size:.84rem">These are descriptions of behaviour over thirty days, not a level you have reached, and the stages are not a ladder to rush.</p>
    <p class="serif">${esc(rd.line)}</p>
    <div class="sp-list">${rows}</div>
    <p class="faint mono" style="font-size:.76rem">Read from: the Maslow scores, how recently the people in your rings were seen, how often certain word families appear in your entries over the last thirty days (the words are listed under each stage), and how densely your entries are linked. Tap a stage to see its exact inputs.</p>
    ${detail}
    <div class="field" style="margin-top:12px"><label>Where does it feel like you are? <span class="faint" style="text-transform:none;letter-spacing:0">— yours to name, whatever the reading says</span></label>
      <div class="row" style="gap:6px;flex-wrap:wrap">${SPIRAL.map(([k, name, , hue]) => `<button class="chip${saved.confirmed === k ? ' on' : ''}" style="--c:${hue}" data-spconf="${k}">${esc(name)}</button>`).join('')}</div>
      <textarea class="ta" id="spNote" rows="2" placeholder="Why — what makes it feel that way?">${esc(saved.note || '')}</textarea></div>
  </section>`;
}
function bindSpiral(sec, redraw){
  const st = alignStore();
  sec.querySelectorAll('[data-spsel]').forEach(b => b.onclick = () => { S._spSel = S._spSel === b.dataset.spsel ? null : b.dataset.spsel; redraw(); });
  const cl = sec.querySelector('#spClose'); if(cl) cl.onclick = () => { S._spSel = null; redraw(); };
  const k = S._spSel;
  if(k) lensOverrideBind(sec, 'sp', null, patch => { st.spiralOv[k] = Object.assign({}, st.spiralOv[k], patch); }, () => { if(st.spiralOv[k]) delete st.spiralOv[k].score; }, redraw);
  sec.querySelectorAll('[data-spconf]').forEach(b => b.onclick = () => { const p = maslowStore(); p.spiral = Object.assign({}, p.spiral, {confirmed: p.spiral && p.spiral.confirmed === b.dataset.spconf ? null : b.dataset.spconf}); saveNow(); redraw(); });
  const nt = sec.querySelector('#spNote'); if(nt) nt.onchange = () => { const p = maslowStore(); p.spiral = Object.assign({}, p.spiral, {note: nt.value.trim()}); saveNow(); };
}
