/* ============================================================
   WHERE AM I RIGHT NOW — the home page's two lenses and its clock

   Three systems live here:

   · The daily rhythm — what time you woke, what time you stopped, and
     what the hours between them were spent on, block by block.
   · The Maslow lens — seven levels scored from data the instrument
     already holds, so the pyramid fills itself instead of asking you
     to rate yourself. You can override any level; the gap between what
     the numbers say and what you feel is itself worth recording.
   · The Spiral lens — eight stages, each given a resonance strength
     read off your own behaviour. A mirror, not a quiz.

   Both engines are pure functions of S. Where a source has no data the
   input is dropped from the average rather than counted as zero — an
   empty Finance section must not read as "unsafe".
   ============================================================ */

/* ---------- small helpers ---------- */
const hm2min = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(s||'')); return m ? (+m[1])*60 + (+m[2]) : null; };
const min2hm = n => `${pad(Math.floor(((n%1440)+1440)%1440/60))}:${pad(Math.round(n)%60)}`;
const isoToHM = iso => { if(!iso) return ''; const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtDur = m => { m = Math.max(0, Math.round(m)); const h = Math.floor(m/60); return h ? `${h}h${m%60 ? ' ' + (m%60) + 'm' : ''}` : `${m}m`; };
/* an average that ignores what was never measured */
function avgDefined(vals){ const v = vals.filter(x => x != null && !isNaN(x)); return v.length ? sum(v)/v.length : null; }
const pct = (n, lo, hi) => n == null ? null : clamp((n - lo) / (hi - lo) * 100, 0, 100);

/* ---------- the daily rhythm: sleep and the shape of the hours ---------- */
function rhythmDay(d = today()){
  S.dailyRhythm = S.dailyRhythm || {};
  const r = S.dailyRhythm[d] = S.dailyRhythm[d] || {};
  /* the older Today page kept these on the check-in; carry them over once so
     nothing logged before blocks existed is lost */
  const c = S.checkins?.[d];
  if(r.wakeTime  === undefined) r.wakeTime  = c?.wakeAt  ? isoToHM(c.wakeAt)  : '';
  if(r.sleepTime === undefined) r.sleepTime = c?.closeAt ? isoToHM(c.closeAt) : '';
  if(r.legacyUsed === undefined){ r.legacyUsed = +c?.hoursUsed || 0; r.legacyWasted = +c?.hoursWasted || 0; }
  if(!Array.isArray(r.blocks)) r.blocks = [];
  rhythmCompute(r);
  return r;
}
function rhythmCompute(r){
  const wake = hm2min(r.wakeTime), sleep = hm2min(r.sleepTime);
  /* a stop past midnight belongs to the same waking day */
  const stop = sleep == null ? null : (wake != null && sleep <= wake ? sleep + 1440 : sleep);
  const awake = (wake != null && stop != null) ? stop - wake : null;
  let used = 0, wasted = 0;
  r.blocks.forEach(b => {
    const mins = Math.max(0, rhythmBlockEnd(b) - hm2min(b.startTime));
    if(b.category === 'wasted') wasted += mins; else used += mins;
  });
  /* days logged before blocks existed keep their totals */
  if(!r.blocks.length){ used = (r.legacyUsed || 0) * 60; wasted = (r.legacyWasted || 0) * 60; }
  const claimed = used + wasted;
  r.computed = {
    totalAwakeMinutes: awake, intentionalMinutes: used, wastedMinutes: wasted,
    unaccountedMinutes: awake == null ? null : Math.max(0, awake - claimed),
    ratio: claimed ? Math.round(used / claimed * 100) : null,
  };
  return r.computed;
}
const rhythmBlockEnd = b => { const s = hm2min(b.startTime), e = hm2min(b.endTime); return e == null ? s : (e <= s ? e + 1440 : e); };
function rhythmTags(){ const set = new Set();
  Object.values(S.dailyRhythm || {}).forEach(r => (r.blocks||[]).forEach(b => b.tag && set.add(b.tag)));
  return [...set].slice(0, 12);
}

/* ============================================================
   THE MASLOW ENGINE
   ============================================================ */
const MASLOW = [
  {level:1, key:'body',      name:'Physiological',      short:'BODY',     ask:'Is your body getting what it needs?',                  go:'#/today'},
  {level:2, key:'safety',    name:'Safety & Security',  short:'SAFETY',   ask:'Do you feel safe — financially, physically, emotionally?', go:'#/finance'},
  {level:3, key:'belonging', name:'Love & Belonging',   short:'BELONGING',ask:'Who do you belong to? Who belongs to you?',             go:'#/people'},
  {level:4, key:'esteem',    name:'Esteem',             short:'ESTEEM',   ask:'Do you respect yourself? Does your work feel like it matters?', go:'#/skills'},
  {level:5, key:'mind',      name:'Cognitive',          short:'MIND',     ask:'Is your mind alive? Are you learning, exploring, questioning?', go:'#/commonplace'},
  {level:6, key:'beauty',    name:'Aesthetic',          short:'BEAUTY',   ask:'Is there beauty in your daily life?',                   go:'#/projects'},
  {level:7, key:'becoming',  name:'Self-Actualization', short:'BECOMING', ask:'Are you becoming who you are capable of becoming?',     go:'#/values'},
];
const maslowMeta = k => MASLOW.find(m => m.key === k) || MASLOW[0];

/* --- the individual readings each level averages --- */
function mSleepConsistency(days = 7){
  const v = lastDays(days).map(d => { const c = rhythmDay(d).computed; return c.totalAwakeMinutes == null ? null : (1440 - c.totalAwakeMinutes) >= 420 ? 100 : Math.round((1440 - c.totalAwakeMinutes) / 420 * 100); });
  return avgDefined(v);
}
function mEnergy(dim, days = 7){
  return avgDefined(lastDays(days).map(d => { const e = S.checkins?.[d]?.energy?.[dim]; return e ? pct(e, 1, 5) : null; }));
}
function mHabitRate(filter, days = 7){
  const hs = S.habits.filter(h => !h.archived && !h.negative && filter(h));
  if(!hs.length) return null;
  let due = 0, done = 0;
  lastDays(days).forEach(d => hs.forEach(h => { if(habitDue(h, d)){ due++; if(habitDone(h, d)) done++; } }));
  return due ? Math.round(done / due * 100) : null;
}
function mRunwayScore(){
  if(typeof runway !== 'function' || !S.finance?.scenarios?.length) return null;
  if(!incomeStreamList().length && !S.finance.savings) return null;
  const rw = runway();
  if(rw.sustainable) return 100;
  const mo = rw.months;
  if(!isFinite(mo)) return 100;
  return Math.round(mo > 12 ? 90 : mo > 6 ? 50 + (mo-6)/6*30 : mo > 3 ? 25 + (mo-3)/3*25 : mo/3*25);
}
function mCircleRecency(circles, days = 30){
  const people = S.people.filter(p => circles.includes(p.circle) && p.status !== 'dormant');
  if(!people.length) return null;
  return avgDefined(people.map(p => {
    const last = (S.interactions||[]).filter(i => i.personId === p.id).map(i => i.date).sort().slice(-1)[0];
    if(!last) return 0;
    const ago = daysSince(last);
    return clamp(100 - Math.max(0, ago - 7) * (100/days), 0, 100);
  }));
}
function mSkillPractice(days = 30){
  const live = S.skills.filter(s => !s.archived && s.horizon !== 'someday');
  if(!live.length) return null;
  const since = addDays(today(), -days);
  const active = live.filter(s => { const l = skillLastPracticed(s); return l && l >= since; }).length;
  return Math.round(active / live.length * 100);
}
function mNodRate(filter = () => true, days = 30){
  const ps = S.projects.filter(p => !['archived','abandoned','completed'].includes(p.status) && filter(p));
  if(!ps.length) return null;
  const since = addDays(today(), -days);
  const n = (S.nods||[]).filter(x => x.date >= since && ps.some(p => p.id === x.projectId)).length;
  return clamp(n / (ps.length * 8) * 100, 0, 100);
}
function mWritingRate(days = 7){
  if(!S.wsDaily || !Object.keys(S.wsDaily).length) return null;
  const written = lastDays(days).filter(d => (typeof wsWrittenOn === 'function' ? wsWrittenOn(d) : 0) > 0).length;
  return Math.round(written / days * 100);
}
function mMediaRate(filterKind = null, days = 30){
  const RES = {passed:35, stayed:60, changed:85, lives:100};
  const since = addDays(today(), -days);
  const ms = (typeof mediaEntries === 'function' ? mediaEntries() : []).filter(e => {
    const d = (e.occurredAt||e.createdAt||'').slice(0,10);
    if(d < since) return false;
    return !filterKind || filterKind.includes(e.extra?.kind);
  });
  if(!ms.length) return null;
  const depth = avgDefined(ms.map(e => RES[e.extra?.resonanceLevel] ?? 50));
  return Math.round(clamp(ms.length / 4, 0, 1) * 50 + (depth ?? 50) / 2);
}
function mEntryRate(types, days = 7){
  const since = addDays(today(), -days);
  const n = S.entries.filter(e => types.includes(e.type) && (e.occurredAt||e.createdAt||'').slice(0,10) >= since).length;
  return n ? clamp(n / days * 100 * 1.5, 0, 100) : (S.entries.some(e => types.includes(e.type)) ? 0 : null);
}
function mValueCongruence(names = null){
  if(typeof valueGaps !== 'function' || !S.valueOrder?.length || !latestSnapshot()) return null;
  const gaps = valueGaps();
  const picked = names ? gaps.filter(g => names.some(n => g.name.toLowerCase().includes(n))) : gaps;
  return picked.length ? avgDefined(picked.map(g => g.congruence)) : null;
}
function mRehearsalRate(days = 21){
  if(!S.rehearsal?.days?.length && !S.rehearsal?.cycleStart) return null;
  const start = S.rehearsal.cycleStart || addDays(today(), -days);
  const span = clamp(daysBetween(start, today()) + 1, 1, days);
  const hit = (S.rehearsal.days||[]).filter(d => d >= start).length;
  return Math.round(clamp(hit / span, 0, 1) * 100);
}
function mSetpointScore(days = 7){
  return avgDefined(lastDays(days).map(d => { const sp = S.checkins?.[d]?.setpoint; return sp ? pct(sp, 1, 22) : null; }));
}
/* --- the seven levels --- */
function maslowScores(){
  const store = maslowStore();
  const raw = {
    body: {
      'sleep':      mSleepConsistency(),
      'body energy':mEnergy('physical'),
      'movement':   mHabitRate(h => h.dimension === 'physical'),
    },
    safety: {
      'runway':     mRunwayScore(),
      'the gap':    (() => { if(typeof monthlyBurn !== 'function' || !S.finance?.scenarios?.length) return null;
                             if(!incomeStreamList().length) return null;
                             const b = monthlyBurn(); return b <= 0 ? 100 : clamp(100 - b / 40, 0, 100); })(),
      'day claimed':(() => { const c = rhythmDay().computed; return c.ratio; })(),
    },
    belonging: {
      'inner circle': mCircleRecency(['core','close']),
      'wider circle': mCircleRecency(['warm','orbit'], 60),
      'relational habits': mHabitRate(h => !!h.relational),
    },
    esteem: {
      'craft':    mSkillPractice(),
      'projects': mNodRate(),
      'writing':  mWritingRate(),
      'authenticity': mValueCongruence(['authentic','integrity','honest']),
    },
    mind: {
      'learning':    mMediaRate(),
      'reflection':  mEntryRate(['reflection','question','synchronicity']),
      'mind energy': mEnergy('mental'),
      'learning habits': mHabitRate(h => h.dimension === 'mental'),
    },
    beauty: {
      'creating':     mNodRate(p => !(p.income?.current || p.income?.target)),
      'beauty taken in': mMediaRate(['film','album','exhibition','documentary']),
      'awe & creativity': mValueCongruence(['awe','creativ','beauty']),
    },
    becoming: {
      'congruence':       mValueCongruence(),
      'morning practice': mRehearsalRate(),
      'set-point':        mSetpointScore(),
    },
  };
  return MASLOW.map(m => {
    const inputs = raw[m.key];
    const known = Object.entries(inputs).filter(([, v]) => v != null);
    const autoScore = known.length ? Math.round(avgDefined(known.map(([, v]) => v))) : null;
    const saved = store.overrides[m.key] || {};
    const override = typeof saved.score === 'number' ? saved.score : null;
    return {...m, inputs, autoScore, override, note: saved.note || '',
            effectiveScore: override ?? autoScore, hasData: known.length > 0};
  });
}
function maslowStore(){
  const p = S.position = S.position || {};
  p.overrides = p.overrides || {};
  p.history = Array.isArray(p.history) ? p.history : [];
  p.spiral = p.spiral || {};
  return p;
}

/* ============================================================
   THE SPIRAL ENGINE — signals read off behaviour, not a quiz
   ============================================================ */
const SPIRAL = [
  ['beige',    'Beige',    'Survival',      '#C2B280', 'Your body is in crisis mode.'],
  ['purple',   'Purple',   'Tribal',        '#7B2D8B', 'Your energy is in your tribe.'],
  ['red',      'Red',      'Power',         '#CC0000', 'You are in conquer mode.'],
  ['blue',     'Blue',     'Order',         '#003399', 'Structure is holding you together.'],
  ['orange',   'Orange',   'Achievement',   '#FF8C00', 'You are optimising everything.'],
  ['green',    'Green',    'Communitarian', '#228B22', 'You are asking what it is all for.'],
  ['yellow',   'Yellow',   'Integrative',   '#D9A400', 'You are seeing the whole board.'],
  ['turquoise','Turquoise','Holistic',      '#30D5C8', 'You are operating from something larger than yourself.'],
];
const spiralMeta = k => SPIRAL.find(s => s[0] === k);

function spiralResonance(){
  const ms = {}; maslowScores().forEach(m => ms[m.key] = m.effectiveScore);
  const inv = v => v == null ? null : 100 - v;
  const since30 = addDays(today(), -30);
  const ents30 = S.entries.filter(e => (e.occurredAt||e.createdAt||'').slice(0,10) >= since30);
  const themed = re => ents30.length ? clamp(ents30.filter(e => re.test(`${e.title} ${e.body}`)).length / Math.max(3, ents30.length*.25) * 100, 0, 100) : null;
  const linkDensity = () => { if(!ents30.length) return null;
    const rich = ents30.filter(e => LINK_KINDS.filter(k => (e.links?.[k]||[]).length).length >= 3).length;
    return clamp(rich / Math.max(2, ents30.length*.2) * 100, 0, 100); };
  const streams = typeof incomeStreamList === 'function' ? incomeStreamList().filter(s => s.income.status === 'earning') : [];

  const sig = {
    beige:     [inv(ms.body), mEnergy('physical') != null && mEnergy('physical') < 40 ? 90 : 10, ms.body != null && ms.body < 30 ? 100 : 5],
    purple:    [mCircleRecency(['core']), mHabitRate(h => !!h.relational), themed(/\bfamily|home|tradition|ritual|grandmother|grandfather|ancestor/i)],
    red:       [mNodRate(), inv(mCircleRecency(['core','close'])), themed(/\bwin|beat|prove|fight|dominate|impatien|angry|frustrat/i)],
    blue:      [mHabitRate(() => true), mValueCongruence(['disciplin','duty','integrity','order']), themed(/\bshould|discipline|routine|duty|obligation|proper/i)],
    orange:    [streams.length ? clamp(streams.length*35, 0, 100) : null, mSkillPractice(), mWritingRate(),
                themed(/\boptimi|efficien|target|goal|metric|productiv|leverage|scale/i)],
    green:     [mCircleRecency(['core','close','warm']), mValueCongruence(['connect','communit','belong','empath','compassion']),
                themed(/\bconnect|together|belong|listen|empath|community|care for/i)],
    yellow:    [linkDensity(), themed(/\bsystem|pattern|both|paradox|depends|framework|integrat|whole/i),
                ms.becoming, S.entries.length > 40 ? 70 : null],
    turquoise: [mValueCongruence(['spirit','transcend','awe','service']), themed(/\bmeaning|surrender|oneness|sacred|service|humanity|planet/i),
                ms.becoming, mSetpointScore() != null && mSetpointScore() > 75 ? 90 : null],
  };
  const out = {};
  SPIRAL.forEach(([k]) => { const v = avgDefined(sig[k]); out[k] = v == null ? 0 : Math.round(v); });
  return out;
}
function spiralReading(res = spiralResonance()){
  const ranked = SPIRAL.map(([k]) => [k, res[k]]).sort((a,b) => b[1]-a[1]);
  const [p, pv] = ranked[0], [s, sv] = ranked[1];
  const saved = maslowStore().spiral || {};
  if(!pv) return {resonance:res, primary:null, emerging:null, line:'Not enough logged yet to read a pattern. Use the instrument for a few weeks and this fills itself in.', ...saved};
  const pm = spiralMeta(p), sm = spiralMeta(s);
  /* Ties are broken by array order, which is not a finding. If the top two are
     level, say they are level rather than crowning one of them. Thin data gets
     said out loud too — a reading off six entries is a guess. */
  const thin = S.entries.length < 25;
  const tied = pv - sv <= 5;
  const line = tied
    ? `You are sitting between ${pm[1]} (${pm[2].toLowerCase()}) and ${sm[1]} (${sm[2].toLowerCase()}) — neither is clearly leading.`
    : sv > 40
      ? `Right now you are operating mostly from ${pm[1]} (${pm[2].toLowerCase()}) with ${sm[1]} pulling at you.`
      : `Right now you are operating mostly from ${pm[1]} — ${pm[4].toLowerCase()}`;
  return {resonance:res, primary: tied ? null : p, emerging: tied ? null : (sv > 40 ? s : null),
          line: line + (thin ? ' Read it lightly — there is not much logged yet.' : ''),
          tied: tied ? [p, s] : null, confirmed: saved.confirmed ?? null, note: saved.note || ''};
}

/* ============================================================
   SLEEP & TIME USE — the day as a 24-hour bar
   ============================================================ */
function timeUseHTML(d = today()){
  const r = rhythmDay(d); const c = r.computed; const T = today();
  const wake = hm2min(r.wakeTime), sleep = hm2min(r.sleepTime);
  const L = m => (m / 1440 * 100).toFixed(3) + '%';
  /* sleep is drawn as the two ends of the day, not one wrapped block */
  const sleepBlocks = [];
  if(wake != null) sleepBlocks.push([0, wake]);
  if(sleep != null) sleepBlocks.push([sleep <= (wake ?? 0) ? sleep : sleep, 1440]);
  const ratio = c.ratio;
  const ratioCls = ratio == null ? '' : ratio >= 80 ? 'good' : ratio < 50 ? 'poor' : '';
  return `<section class="section rv time-use" data-tuday="${d}">
    <div class="row between" style="align-items:baseline;flex-wrap:wrap;gap:8px">
      <span class="sc" style="margin:0">Sleep &amp; time use</span>
      <span class="row" style="gap:5px;align-items:center">
        <button class="tbtn" data-tunav="${addDays(d,-1)}" title="previous day">‹</button>
        <span class="mono faint">${d === T ? 'today' : esc(fmtDate(d,'med'))}</span>
        ${d !== T ? `<button class="tbtn" data-tunav="${T}" title="back to today">today</button>` : ''}
        <button class="tbtn" data-tunav="${addDays(d,1)}" title="next day" ${d >= T ? 'disabled' : ''}>›</button>
      </span>
    </div>

    <div class="row tu-times" style="gap:16px;flex-wrap:wrap;margin-top:8px">
      <label class="tu-time"><span>I woke up at</span><input type="time" class="inp mono" data-tuwake value="${esc(r.wakeTime)}"></label>
      <label class="tu-time"><span>I went to sleep at</span><input type="time" class="inp mono" data-tusleep value="${esc(r.sleepTime)}"></label>
    </div>

    <div class="tu-bar" data-tubar>
      ${Array.from({length:24},(_,h)=>`<i class="tu-tick${h%6===0?' major':''}" style="left:${L(h*60)}"></i>`).join('')}
      ${sleepBlocks.map(([a,b]) => `<div class="tu-sleep" style="left:${L(a)};width:${L(b-a)}" title="asleep"><span>☾</span></div>`).join('')}
      ${r.blocks.map(b => { const s = hm2min(b.startTime), e = rhythmBlockEnd(b); const w = e - s;
        return `<div class="tu-block ${b.category}" data-tublock="${b.id}" style="left:${L(s)};width:${L(w)}"
          title="${esc(b.tag || b.category)} · ${esc(b.startTime)}–${esc(b.endTime)} · ${fmtDur(w)}">
          <span class="tu-label">${esc(b.tag || '')}</span>
          <i class="tu-grip l" data-tugrip="${b.id}:start"></i><i class="tu-grip r" data-tugrip="${b.id}:end"></i>
        </div>`; }).join('')}
    </div>
    <div class="tu-axis">${[0,6,12,18,24].map(h=>`<span style="left:${L(h*60)}">${h===24?'12am':h===0?'12am':h===12?'12pm':h>12?(h-12)+'pm':h+'am'}</span>`).join('')}</div>

    <div class="row between tu-sum mono" style="margin-top:14px;flex-wrap:wrap;gap:8px">
      <span>${c.totalAwakeMinutes != null ? `Awake ${fmtDur(c.totalAwakeMinutes)}` : 'Log a wake and a sleep time to see the day whole'}
        ${c.intentionalMinutes ? ` · Used ${fmtDur(c.intentionalMinutes)}` : ''}
        ${c.wastedMinutes ? ` · Wasted ${fmtDur(c.wastedMinutes)}` : ''}
        ${c.unaccountedMinutes ? ` · Unaccounted ${fmtDur(c.unaccountedMinutes)}` : ''}</span>
      ${ratio != null ? `<span class="tu-ratio ${ratioCls}">${ratio}% intentional</span>` : ''}
    </div>
    <div class="faint tu-hint">Click any empty stretch of the bar to claim it.</div>
  </section>`;
}

function bindTimeUse(root, redraw){
  const sec = root.querySelector('.time-use'); if(!sec) return;
  const d = sec.dataset.tuday; const r = rhythmDay(d);
  const bar = sec.querySelector('[data-tubar]');
  const save = () => { rhythmCompute(r); saveNow(); };

  sec.querySelectorAll('[data-tunav]').forEach(b => b.onclick = () => {
    if(b.disabled) return; S._tuDay = b.dataset.tunav === today() ? null : b.dataset.tunav; redraw(); });
  const wt = sec.querySelector('[data-tuwake]'), st = sec.querySelector('[data-tusleep]');
  if(wt) wt.onchange = () => { r.wakeTime = wt.value; save(); redraw(); };
  if(st) st.onchange = () => { r.sleepTime = st.value; save(); redraw(); };

  const minsAt = ev => { const b = bar.getBoundingClientRect();
    return clamp(Math.round((ev.clientX - b.left) / b.width * 1440 / 15) * 15, 0, 1440); };

  /* claim an empty stretch */
  bar.onclick = ev => {
    if(ev.target.closest('.tu-block')) return;
    const start = minsAt(ev);
    const clash = r.blocks.some(b => start >= hm2min(b.startTime) && start < rhythmBlockEnd(b));
    if(clash) return;
    openTimeBlockModal(r, {startTime:min2hm(start), endTime:min2hm(Math.min(1440, start+60))}, save, redraw);
  };
  sec.querySelectorAll('[data-tublock]').forEach(el => {
    el.onclick = ev => { if(ev.target.closest('.tu-grip')) return; ev.stopPropagation();
      const b = r.blocks.find(x => x.id === el.dataset.tublock); if(b) openTimeBlockModal(r, b, save, redraw); };
    el.oncontextmenu = ev => { ev.preventDefault(); ev.stopPropagation();
      const b = r.blocks.find(x => x.id === el.dataset.tublock); if(!b) return;
      requestDelete({label: b.tag || 'this block', node: el, remove: () => spliceOut(r.blocks, x => x.id === b.id), after: () => { save(); redraw(); }}); };
  });

  /* drag either edge, snapping to the quarter hour */
  let drag = null;
  sec.querySelectorAll('[data-tugrip]').forEach(g => g.addEventListener('pointerdown', ev => {
    ev.preventDefault(); ev.stopPropagation();
    const [id, edge] = g.dataset.tugrip.split(':');
    const b = r.blocks.find(x => x.id === id); if(!b) return;
    drag = {b, edge}; try { g.setPointerCapture(ev.pointerId); } catch(e){}
    document.body.classList.add('ws-resizing');
  }));
  const move = ev => {
    if(!drag) return;
    const m = minsAt(ev); const {b, edge} = drag;
    if(edge === 'start') b.startTime = min2hm(Math.min(m, rhythmBlockEnd(b) - 15));
    else b.endTime = min2hm(Math.max(m, hm2min(b.startTime) + 15));
    const el = sec.querySelector(`[data-tublock="${b.id}"]`);
    if(el){ const s = hm2min(b.startTime), e = rhythmBlockEnd(b);
      el.style.left = (s/1440*100).toFixed(3)+'%'; el.style.width = ((e-s)/1440*100).toFixed(3)+'%'; }
  };
  const end = () => { if(!drag) return; drag = null; document.body.classList.remove('ws-resizing'); save(); redraw(); };
  sec.addEventListener('pointermove', move);
  sec.addEventListener('pointerup', end); sec.addEventListener('pointercancel', end);
}

function openTimeBlockModal(r, seed, save, redraw){
  const editing = !!seed.id;
  const tags = rhythmTags();
  const m = openModal(`<h2>${editing ? 'This stretch' : 'Claim this stretch'}</h2>
    <div class="stack">
      <div class="row" style="gap:10px;align-items:flex-end">
        <label class="tu-time"><span>from</span><input type="time" class="inp mono" id="tbFrom" value="${esc(seed.startTime)}"></label>
        <label class="tu-time"><span>to</span><input type="time" class="inp mono" id="tbTo" value="${esc(seed.endTime)}"></label>
      </div>
      <div class="row" style="gap:8px">
        <button class="btn tu-cat ${seed.category !== 'wasted' ? 'primary' : 'ghost'}" data-tbcat="intentional">Used intentionally</button>
        <button class="btn tu-cat ${seed.category === 'wasted' ? 'primary' : 'ghost'}" data-tbcat="wasted">Wasted</button>
      </div>
      <input class="inp" id="tbTag" placeholder="what it was — deep work, exercise, scrolling…" value="${esc(seed.tag||'')}">
      ${tags.length ? `<div class="row" style="gap:4px;flex-wrap:wrap">${tags.map(t=>`<span class="chip click" data-tbsug="${esc(t)}">${esc(t)}</span>`).join('')}</div>` : ''}
      <div class="row" style="justify-content:${editing?'space-between':'flex-end'}">
        ${editing ? `<button class="btn sm ghost danger" id="tbDel">Delete</button>` : ''}
        <button class="btn primary" id="tbSave">${editing ? 'Save' : 'Claim it'}</button>
      </div>
    </div>`, 'narrow');
  let cat = seed.category === 'wasted' ? 'wasted' : 'intentional';
  m.querySelectorAll('[data-tbcat]').forEach(b => b.onclick = () => { cat = b.dataset.tbcat;
    m.querySelectorAll('[data-tbcat]').forEach(x => { x.classList.toggle('primary', x === b); x.classList.toggle('ghost', x !== b); }); });
  m.querySelectorAll('[data-tbsug]').forEach(c => c.onclick = () => { m.querySelector('#tbTag').value = c.dataset.tbsug; });
  m.querySelector('#tbSave').onclick = () => {
    const from = m.querySelector('#tbFrom').value, to = m.querySelector('#tbTo').value;
    if(hm2min(from) == null || hm2min(to) == null){ toast('Both times, please.'); return; }
    const tag = m.querySelector('#tbTag').value.trim();
    if(editing){ Object.assign(seed, {startTime:from, endTime:to, category:cat, tag}); }
    else r.blocks.push({id:uid(), startTime:from, endTime:to, category:cat, tag});
    r.blocks.sort((a,b) => hm2min(a.startTime) - hm2min(b.startTime));
    save(); m.remove(); sound('click'); redraw();
  };
  m.querySelector('#tbDel') && (m.querySelector('#tbDel').onclick = () => {
    spliceOut(r.blocks, x => x.id === seed.id); save(); m.remove(); redraw(); });
}

/* The stats used to be a grid of little cards, one row per level. They are
   gone entirely: the pyramid below says the same thing in less space, and a
   grid of little cards restating it was noise. */

/* ============================================================
   THE LIFE POSITION CHECK-IN
   ============================================================ */
function maslowPyramidSVG(levels){
  const W = 400, H = 320, tier = H / 7, apex = 0.13;
  const weakest = levels.filter(m => m.effectiveScore != null)
    .reduce((a,b) => !a || b.effectiveScore < a.effectiveScore ? b : a, null);
  /* wide at the base, narrow at the apex — level 1 is drawn last, at the bottom */
  const halfAt = y => (W/2) * (1 - (1-apex) * (1 - y/H));
  return `<svg class="mas-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Maslow pyramid">
    <defs><radialGradient id="masGlow" cx="50%" cy="20%" r="60%">
      <stop offset="0%" stop-color="var(--gold)" stop-opacity=".5"/><stop offset="100%" stop-color="var(--gold)" stop-opacity="0"/></radialGradient></defs>
    ${levels.map(m => {
      const i = 7 - m.level;                       // 0 = apex row
      const yTop = i * tier, yBot = yTop + tier - 1;
      const hT = halfAt(yTop), hB = halfAt(yBot);
      const s = m.effectiveScore;
      const op = s == null ? 0 : (s/100);
      const col = m.level <= 2 ? 'var(--gold)' : m.level <= 4 ? 'var(--page-accent)' : m.level <= 6 ? 'var(--sage)' : 'var(--ment)';
      const wide = hB * 2 > 120;
      return `<g class="mas-tier ${weakest && weakest.key === m.key ? 'weak' : ''}" data-mtier="${m.key}">
        ${m.level === 7 && s > 70 ? `<ellipse cx="${W/2}" cy="${yTop+tier/2}" rx="90" ry="42" fill="url(#masGlow)"/>` : ''}
        <polygon points="${W/2-hT},${yTop} ${W/2+hT},${yTop} ${W/2+hB},${yBot} ${W/2-hB},${yBot}"
          fill="${col}" fill-opacity="${op.toFixed(3)}" stroke="var(--line-2)" stroke-width="1"/>
        ${wide ? `<text class="mas-lbl" x="${W/2}" y="${yTop+tier/2+1}">${esc(m.short)}</text>
                  <text class="mas-num" x="${W/2}" y="${yTop+tier/2+14}">${s == null ? '—' : s}${m.override != null ? ' ↕' : ''}</text>`
                : `<text class="mas-lbl out" x="${W/2+hB+8}" y="${yTop+tier/2+4}">${esc(m.short)} <tspan class="mas-num">${s == null ? '—' : s}</tspan></text>
                   <line x1="${W/2+hB+1}" y1="${yTop+tier/2}" x2="${W/2+hB+6}" y2="${yTop+tier/2}" stroke="var(--line-2)" stroke-dasharray="1 2"/>`}
      </g>`; }).join('')}
  </svg>`;
}

function spiralBarsHTML(read){
  return `<div class="spi-bars">${SPIRAL.map(([k, name, gloss, col]) => {
    const v = read.resonance[k] || 0;
    const flag = read.primary === k ? 'PRIMARY' : read.emerging === k ? 'EMERGING'
               : (read.tied || []).includes(k) ? 'LEVEL' : '';
    return `<div class="spi-row ${flag?'on':''}" data-sbar="${k}">
      <span class="spi-name">${name}</span>
      <span class="spi-track"><i style="width:${v}%;background:${col}"></i></span>
      <span class="spi-pct mono">${v}%</span>
      ${flag ? `<span class="spi-flag" style="color:${col}">${flag}</span>` : ''}
    </div>`; }).join('')}</div>`;
}

function positionHTML(){
  const p = maslowStore();
  const levels = maslowScores();
  const read = spiralReading();
  const last = p.history[p.history.length-1];
  const hist = p.history.slice(-12);
  const sel = S._mTier ? levels.find(l => l.key === S._mTier) : null;
  return `<section class="section rv position">
    <div class="row between" style="align-items:baseline;flex-wrap:wrap;gap:8px">
      <span class="sc lg" style="margin:0">Where am I right now?</span>
      <span class="row" style="gap:8px;align-items:baseline">
        <span class="mono faint">${last ? `last check-in ${esc(fmtDate(last.timestamp.slice(0,10),'med'))}` : 'never checked in'}</span>
        <button class="btn sm primary" id="posLog">Log a check-in</button>
      </span>
    </div>

    <div class="pos-grid">
      <div class="pos-pyr">
        ${maslowPyramidSVG(levels)}
        ${hist.length > 1 ? `<div class="mas-sparks">${levels.map(m => {
          const vals = hist.map(h => (h.levels.find(x => x.key === m.key)||{}).effectiveScore ?? null);
          return `<div class="mas-spark" data-mspark="${m.key}"><span class="mono">${esc(m.short)}</span>${sparkline(vals,{h:18,min:0,max:100,color:'var(--page-accent)'})}</div>`;
        }).join('')}</div>` : ''}
      </div>

      <div class="pos-spi">
        <div class="row between" style="align-items:baseline"><span class="sc" style="margin:0 0 8px">Stage resonance</span><a class="mono faint" href="#/spiral" style="text-decoration:none">the spiral room →</a></div>
        ${spiralBarsHTML(read)}
        <p class="spi-read">${esc(read.line)}</p>
        <div class="row" style="gap:6px;align-items:center;flex-wrap:wrap">
          <span class="mono faint">Does this feel right?</span>
          <button class="btn sm ${read.confirmed === true ? 'primary' : 'ghost'}" data-spiok="1">👍</button>
          <button class="btn sm ${read.confirmed === false ? 'primary' : 'ghost'}" data-spiok="0">👎</button>
        </div>
        ${read.confirmed !== null ? `<textarea class="ta" id="spiNote" rows="2" placeholder="Your own reading of it…">${esc(read.note)}</textarea>` : ''}
        ${hist.length ? `<div class="spi-timeline">${p.history.slice(-24).map(h => {
          const c = spiralMeta(h.primaryStage);
          return `<i style="background:${c?c[3]:'var(--muted)'}" title="${esc(fmtDate(h.timestamp.slice(0,10),'med'))} · ${c?c[1]:'—'}"></i>`; }).join('')}</div>` : ''}
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
        <input type="range" class="slider" min="0" max="100" id="mOverride" value="${sel.effectiveScore ?? 50}" style="--c:var(--page-accent)">
        <div class="row between mono"><span class="faint">0</span><span id="mOverrideV">${sel.effectiveScore ?? 50}</span><span class="faint">100</span></div>
      </div>
      <textarea class="ta" id="mNote" rows="2" placeholder="Why does this feel different from what the numbers say?">${esc(sel.note)}</textarea>
      <div class="row" style="gap:8px;margin-top:8px">
        <a class="btn sm ghost" href="${sel.go}">→ go deeper</a>
        ${sel.override != null ? `<button class="btn sm ghost" id="mClearOv">use the data's number</button>` : ''}
      </div>
    </div>` : '<div class="faint mas-hint">Tap any tier to see what fed its score, and to say how it actually feels.</div>'}
  </section>`;
}

function bindPosition(root, redraw){
  const sec = root.querySelector('.position'); if(!sec) return;
  const p = maslowStore();
  sec.querySelectorAll('[data-mtier]').forEach(g => g.onclick = () => {
    S._mTier = S._mTier === g.dataset.mtier ? null : g.dataset.mtier; redraw(); });
  sec.querySelectorAll('[data-mspark]').forEach(s => s.onclick = () => { S._mTier = s.dataset.mspark; redraw(); });

  const ov = sec.querySelector('#mOverride');
  if(ov){
    const key = S._mTier;
    ov.oninput = () => { sec.querySelector('#mOverrideV').textContent = ov.value; };
    ov.onchange = () => { p.overrides[key] = Object.assign({}, p.overrides[key], {score:+ov.value}); saveNow(); redraw(); };
  }
  const nt = sec.querySelector('#mNote');
  if(nt) nt.onchange = () => { const key = S._mTier;
    p.overrides[key] = Object.assign({}, p.overrides[key], {note:nt.value.trim()}); saveNow(); };
  sec.querySelector('#mClearOv') && (sec.querySelector('#mClearOv').onclick = () => {
    const key = S._mTier; if(p.overrides[key]) delete p.overrides[key].score; saveNow(); redraw(); });
  sec.querySelector('#mClose') && (sec.querySelector('#mClose').onclick = () => { S._mTier = null; redraw(); });

  sec.querySelectorAll('[data-spiok]').forEach(b => b.onclick = () => {
    p.spiral.confirmed = b.dataset.spiok === '1'; saveNow(); redraw(); });
  const sn = sec.querySelector('#spiNote');
  if(sn) sn.onchange = () => { p.spiral.note = sn.value.trim(); saveNow(); };

  sec.querySelector('#posLog') && (sec.querySelector('#posLog').onclick = () => {
    const levels = maslowScores().map(m => ({key:m.key, level:m.level, name:m.name,
      autoScore:m.autoScore, override:m.override, effectiveScore:m.effectiveScore, note:m.note, inputs:m.inputs}));
    const read = spiralReading();
    p.history.push({timestamp:new Date().toISOString(), levels,
      resonance:read.resonance, primaryStage:read.primary, emergingStage:read.emerging,
      userConfirmed: read.confirmed, userNote: read.note});
    saveNow(); sound('success'); toast(`Check-in logged for ${fmtDate(today(),'med')}.`); redraw();
  });
}

/* ============================================================
   THE WEEK'S SHAPE
   One figure, four things: when the day opened, when it closed,
   and how the hours between them split into claimed and wasted.
   A day on its own says nothing; seven of them side by side is
   where a rhythm — or its absence — becomes visible.
   ============================================================ */
const WK_LO = 4, WK_HI = 28;    /* 4am to 4am — the window a waking day can occupy */
function weekShapeDays(anchor = today(), n = 7){
  const out = []; for(let i = n - 1; i >= 0; i--) out.push(addDays(anchor, -i));
  return out;
}
function weekShapeRow(d){
  const r = rhythmDay(d); const c = r.computed;
  let wake = hm2min(r.wakeTime), close = hm2min(r.sleepTime);
  if(wake != null) wake /= 60;
  if(close != null){ close /= 60; if(wake != null && close <= wake) close += 24; }
  const used = (c.intentionalMinutes || 0) / 60, wasted = (c.wastedMinutes || 0) / 60;
  return {d, wake, close, used, wasted, ratio: c.ratio,
          empty: wake == null && close == null && !used && !wasted};
}
const wkClock = h => { const hh = Math.floor(h) % 24, mm = Math.round((h % 1) * 60);
  const ap = hh >= 12 ? 'pm' : 'am', h12 = hh % 12 || 12;
  return mm ? `${h12}:${pad(mm)}${ap}` : `${h12}${ap}`; };

function weekShapeHTML(anchor = today()){
  const days = weekShapeDays(anchor);
  const rows = days.map(weekShapeRow);
  const filled = rows.filter(r => !r.empty);
  const H = 210, W = Math.max(320, days.length * 64), padL = 34, padB = 26;
  const y = h => (H - padB) - ((h - WK_LO) / (WK_HI - WK_LO)) * (H - padB - 8);
  const colW = (W - padL) / days.length;
  const x = i => padL + (i + .5) * colW;
  const barW = Math.min(26, colW * .46);
  const ticks = [6, 9, 12, 15, 18, 21, 24];

  const bars = rows.map((r, i) => {
    if(r.empty) return '';
    const cx = x(i) - barW / 2;
    /* no clock times logged, only a split: draw it as a free column so the
       hours claimed are still visible rather than silently dropped */
    if(r.wake == null && r.close == null){
      const tot = r.used + r.wasted; if(!tot) return '';
      const top = y(WK_LO + tot);
      return `<g class="wk-bar"><rect x="${cx.toFixed(1)}" y="${top.toFixed(1)}" width="${barW.toFixed(1)}" height="${(y(WK_LO) - top).toFixed(1)}" rx="3" fill="var(--sage)" opacity=".3"/>
        <title>${esc(fmtDate(r.d,'med'))} · ${r.used.toFixed(1)}h used, ${r.wasted.toFixed(1)}h wasted · no clock times</title></g>`;
    }
    const hi = y(r.close ?? (r.wake + 16)), lo = y(r.wake ?? ((r.close ?? 22) - 16));
    const barH = Math.max(3, lo - hi);
    const awake = (r.close != null && r.wake != null) ? (r.close - r.wake) : null;
    const usedH = awake ? barH * Math.min(1, r.used / awake) : 0;
    const wastedH = awake ? barH * Math.min(1, r.wasted / awake) : 0;
    return `<g class="wk-bar" data-wkday="${r.d}">
      <rect x="${cx.toFixed(1)}" y="${hi.toFixed(1)}" width="${barW.toFixed(1)}" height="${barH.toFixed(1)}" rx="3" fill="var(--page-accent)" opacity=".15"/>
      ${usedH > .5 ? `<rect x="${cx.toFixed(1)}" y="${(lo - usedH).toFixed(1)}" width="${barW.toFixed(1)}" height="${usedH.toFixed(1)}" rx="3" fill="var(--sage)" opacity=".85"/>` : ''}
      ${wastedH > .5 ? `<rect x="${cx.toFixed(1)}" y="${(lo - usedH - wastedH).toFixed(1)}" width="${barW.toFixed(1)}" height="${wastedH.toFixed(1)}" rx="3" fill="var(--rose)" opacity=".7"/>` : ''}
      <title>${esc(fmtDate(r.d,'med'))}${r.wake!=null?` · woke ${wkClock(r.wake)}`:''}${r.close!=null?` · closed ${wkClock(r.close)}`:''}${(r.used||r.wasted)?` · ${r.used.toFixed(1)}h used, ${r.wasted.toFixed(1)}h wasted`:''}</title>
    </g>`;
  }).join('');

  const line = (key, color) => { const pts = rows.map((r, i) => r.empty || r[key] == null ? null : `${x(i).toFixed(1)},${y(r[key]).toFixed(1)}`).filter(Boolean);
    return pts.length > 1 ? `<polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" opacity=".75"/>` : ''; };
  const dots = (key, color) => rows.map((r, i) => r.empty || r[key] == null ? '' :
    `<circle cx="${x(i).toFixed(1)}" cy="${y(r[key]).toFixed(1)}" r="2.6" fill="${color}"/>`).join('');

  const avgOf = k => { const v = filled.map(r => r[k]).filter(z => z != null); return v.length ? avg(v) : null; };
  const aw = avgOf('wake'), ac = avgOf('close'), au = avgOf('used'), awa = avgOf('wasted');
  const T = today();

  return `<section class="section rv week-shape">
    <div class="row between" style="align-items:baseline;flex-wrap:wrap;gap:8px">
      <span class="sc" style="margin:0">The week's shape</span>
      <span class="mono faint">${filled.length} of ${days.length} days logged</span>
    </div>
    <p class="muted" style="font-size:.85rem;margin:4px 0 0">When the day opened, when it closed, and what the hours between them were spent on.</p>
    <div class="wk-legend row" style="gap:14px;flex-wrap:wrap;margin:10px 0 2px">
      <span class="wk-key"><i style="background:var(--gold)"></i>woke${aw!=null?` · avg ${wkClock(aw)}`:''}</span>
      <span class="wk-key"><i style="background:var(--ment)"></i>closed${ac!=null?` · avg ${wkClock(ac)}`:''}</span>
      <span class="wk-key"><i style="background:var(--sage)"></i>used well${au!=null?` · avg ${au.toFixed(1)}h`:''}</span>
      <span class="wk-key"><i style="background:var(--rose)"></i>wasted${awa!=null?` · avg ${awa.toFixed(1)}h`:''}</span>
    </div>
    ${filled.length ? `<div class="wk-scroll"><svg class="wk-svg" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="xMidYMid meet">
      ${ticks.map(h => `<g><line x1="${padL}" y1="${y(h).toFixed(1)}" x2="${W}" y2="${y(h).toFixed(1)}" stroke="var(--line)" stroke-width="1" opacity=".5"/>
        <text x="2" y="${(y(h)+3).toFixed(1)}" class="wk-tick">${wkClock(h)}</text></g>`).join('')}
      ${bars}
      ${line('wake','var(--gold)')}${dots('wake','var(--gold)')}
      ${line('close','var(--ment)')}${dots('close','var(--ment)')}
      ${rows.map((r, i) => `<text x="${x(i).toFixed(1)}" y="${H - 8}" class="wk-day ${r.d === T ? 'now' : ''}" text-anchor="middle">${DOW[parseDay(r.d).getDay()][0]}</text>`).join('')}
    </svg></div>`
      : `<div class="empty" style="margin-top:10px">Nothing logged this week yet. The two ends of each day are set on the Today page — "I woke up at" and "I went to sleep at" — and the hours between them are claimed there too.</div>`}
    <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap">
      <button class="btn sm ghost" id="wkClaim">claim today's hours</button>
      <a class="btn sm ghost" href="#/today">the day itself →</a>
    </div>
  </section>`;
}
function bindWeekShape(root, redraw){
  const box = root.querySelector('.week-shape'); if(!box) return;
  box.querySelector('#wkClaim') && (box.querySelector('#wkClaim').onclick = () => {
    const r = rhythmDay(today());
    openTimeBlockModal(r, {startTime:'09:00', endTime:'10:00'}, () => { rhythmCompute(r); saveNow(); }, redraw || rerender);
  });
  box.querySelectorAll('[data-wkday]').forEach(g => g.style.cursor = 'default');
}
