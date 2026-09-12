/* ============================================================
   HABITS — the three ways of looking at them

   Dashboard: every habit as a card, filterable, with the day's balance
     across the four dimensions at the top.
   Today: only what is due, grouped by when in the day it belongs, one
     column, nothing else on screen.
   Analytics: ninety days of heat, a health score per habit, the energy
     quadrant, the milestones reached and the longest runs.
   ============================================================ */

const HAB_VIEWS = [['dashboard','▦','Dashboard'], ['today','◉','Today'], ['analytics','◫','Analytics']];
function habView(){ const v = S._habView || planState().prefs.habitView || 'dashboard';
  return HAB_VIEWS.some(x => x[0] === v) ? v : 'dashboard'; }
function habSetView(v){ S._habView = v; planState().prefs.habitView = v; saveNow(); rerenderPlanBody(); }

function habFilter(){ return S._habFilter = S._habFilter || {type:'all', cat:'', dim:'', value:''}; }
function habFiltered(){
  const f = habFilter();
  return habList().filter(h =>
    (f.type === 'all' || habType(h) === f.type) &&
    (!f.cat || h.category === f.cat) &&
    (!f.dim || h.dimension === f.dim) &&
    (!f.value || (h.links.values || []).includes(f.value)));
}

/* ---------- the shell ---------- */
function habRoomHTML(){
  const v = habView();
  return `<div class="hb-room">
    <div class="row between hb-head">
      <div class="hb-views">${HAB_VIEWS.map(([k, ic, n]) =>
        `<button class="${v === k ? 'on' : ''}" data-hbview="${k}">${ic} <span>${n}</span></button>`).join('')}</div>
      <button class="btn sm primary" id="hbNew">＋ habit</button>
    </div>
    ${v === 'today' ? habTodayHTML() : v === 'analytics' ? habAnalyticsHTML() : habDashboardHTML()}
  </div>`;
}

/* ---------- the strip that opens the dashboard ---------- */
function habSummaryHTML(){
  const T = today(), all = habList();
  const due = habDueOn(T), kept = due.filter(h => habKept(h, T));
  const b = all.filter(h => !habIsBreaking(h)).length, k = all.length - b;
  const best = all.map(h => ({h, s: habStreak(h)})).sort((a, c) => c.s.cur - a.s.cur)[0];
  const bal = habEnergyBalance(T), over = habOvertrained(T);
  const pct = due.length ? kept.length / due.length : 0;
  const R = 15, C = 2 * Math.PI * R;
  return `<div class="hb-strip card">
    <div class="hb-s1"><div class="k">active</div><div class="num">${all.length}</div>
      <div class="mono faint">${b} building · ${k} breaking</div></div>
    <div class="hb-s1"><div class="k">today</div>
      <div class="row" style="gap:8px;align-items:center">
        <svg class="hb-ring" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="${R}" class="hb-rt"/>
          <circle cx="20" cy="20" r="${R}" class="hb-ra" style="stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:${(C * (1 - pct)).toFixed(1)}"/></svg>
        <div class="num">${kept.length} / ${due.length}</div></div></div>
    <div class="hb-s1"><div class="k">longest run</div>
      <div class="num">${best?.s.cur ? `🔥 ${best.s.cur}` : '—'}</div>
      <div class="mono faint">${best?.s.cur ? esc(best.h.name) : 'nothing running yet'}</div></div>
    <div class="hb-s1 hb-bal"><div class="k">energy today</div>
      <div class="hb-dots">${DIMS.map(x => { const v = bal[x.id];
        const state = !v.exp && !v.rec ? 'none' : (v.exp && !v.rec) ? 'over' : 'ok';
        return `<span class="hb-dot ${state}" style="--c:${x.c}" title="${esc(x.name)} — ${v.exp} spending, ${v.rec} renewing">${x.name[0]}</span>`; }).join('')}</div>
      ${over.length ? `<div class="hb-warn">${esc(over.join(' and '))} ${over.length === 1 ? 'is' : 'are'} all expenditure today. Where is the recovery?</div>` : ''}</div>
  </div>`;
}

/* ---------- dashboard ---------- */
function habDashboardHTML(){
  const f = habFilter(), hs = habFiltered();
  const cats = [...new Set(habList().map(h => h.category))];
  return `${habSummaryHTML()}
    <div class="hb-filters">
      ${[['all','Everything'],['building','🌱 Building'],['breaking','🔓 Breaking']].map(([k, n]) =>
        `<button class="chip click${f.type === k ? ' on' : ''}" data-hbf="type:${k}">${n}</button>`).join('')}
      <span class="hb-fsep"></span>
      ${cats.map(c => `<button class="chip click${f.cat === c ? ' on' : ''}" data-hbf="cat:${c}">${esc(c)}</button>`).join('')}
      <span class="hb-fsep"></span>
      ${DIMS.map(d => `<button class="chip click${f.dim === d.id ? ' on' : ''}" style="--c:${d.c}" data-hbf="dim:${d.id}">${esc(d.name)}</button>`).join('')}
      ${(f.type !== 'all' || f.cat || f.dim || f.value) ? '<button class="tbtn" data-hbf="clear:">clear</button>' : ''}
    </div>
    ${hs.length ? `<div class="hb-grid">${hs.map(habCardHTML).join('')}</div>`
      : `<div class="empty">Nothing here yet. ${habList().length ? 'Nothing matches those filters.' : 'A habit is a ritual, not a rule — start with one you could keep on your worst day.'}</div>`}
    ${habList({archived:true}).length ? `<details class="hb-arch"><summary><span class="sc">Archived</span>
      <span class="mono faint">${habList({archived:true}).length}</span></summary>
      <div class="hb-archlist">${habList({archived:true}).map(h => `<div class="row between hb-archrow">
        <span>${esc(h.icon || '◍')} ${esc(h.name)}</span>
        <button class="tbtn" data-hbrestore="${h.id}">restore</button></div>`).join('')}</div></details>` : ''}`;
}

function habCardHTML(h){
  const T = today(), br = habIsBreaking(h), st = habStreak(h), r = habRate(h, 30);
  const kept = habKept(h, T), due = habDue(h, T), t = habTrend(h);
  const c = h.color || (br ? 'var(--terra)' : 'var(--sage)');
  const state = !due ? 'off' : kept ? 'kept' : 'pending';
  return `<div class="hb-card ${state}${br ? ' breaking' : ''}" data-hbcard="${h.id}" style="--c:${esc(c)}">
    <div class="hb-ctop">
      <span class="hb-face">${esc(h.icon || (br ? '🔓' : '🌱'))}</span>
      <button class="hb-name" data-hbopen="${h.id}">${esc(h.name)}</button>
      <span class="hb-badge">${br ? '🔓' : '🌱'}</span>
      ${t.dir === 'down' ? '<span class="hb-decline" title="kept less often than a fortnight ago"></span>' : ''}
    </div>
    ${h.identity ? `<div class="hb-ident">${esc(h.identity)}</div>` : ''}
    <div class="hb-streak">${br ? `🛡 ${st.cur}` : `🔥 ${st.cur}`}
      <span class="hb-sunit">${br ? 'days clean' : st.cur === 1 ? 'day' : 'days'}</span></div>
    <div class="hb-mini">${lastDays(30).map(d => {
      const s = habStatus(h, d);
      const cls = br ? (s === 'slipped' ? 'slip' : s === 'resisted' ? 'resist' : s === 'clean' ? 'on' : '')
        : (s === 'completed' ? 'on' : s === 'partial' ? 'half' : habDue(h, d) ? '' : 'off');
      return `<i class="${cls}" title="${esc(fmtDate(d, 'short'))}${s ? ' — ' + HAB_SESSION_STATUS[s][1] : ''}"></i>`; }).join('')}</div>
    <div class="hb-meta mono">
      <span>${!due ? 'not due today' : kept ? '✅ done today' : 'due today'}</span>
      <span class="hb-dim">${esc(DIMS.find(d => d.id === h.dimension)?.name || '')} · ${h.kind === 'recovery' ? 'recovery' : 'expenditure'}</span>
    </div>
    ${(h.links.values || []).length ? `<div class="hb-vals">${(h.links.values || []).map(id =>
      byId(S.values, id)).filter(Boolean).map(v => `<span class="hb-val" style="--c:${v.color}">${esc(v.name)}</span>`).join('')}</div>` : ''}
    ${r != null ? `<div class="hb-rate mono">${r}% over thirty days${t.dir !== 'stable' ? ` · ${t.dir === 'up' ? 'improving ↑' : 'slipping ↓'}` : ''}</div>` : ''}
    ${due && !kept ? `<button class="btn sm hb-checkin" data-hbcheck="${h.id}">Check in</button>` : ''}
  </div>`;
}

/* ---------- today ---------- */
function habTodayHTML(){
  const T = today(), due = habDueOn(T);
  const kept = due.filter(h => habKept(h, T)), open = due.filter(h => !habKept(h, T));
  if(!due.length) return `<div class="hb-focus"><div class="empty hb-quiet">Nothing due today. Recovery is part of the oscillation.</div></div>`;
  const groups = [...TOD.filter(t => open.some(h => (h.timeOfDay || 'anytime') === t)), ]
    .map(t => [t, open.filter(h => (h.timeOfDay || 'anytime') === t)]);
  const loose = open.filter(h => !TOD.includes(h.timeOfDay || 'anytime'));
  if(loose.length) groups.push(['anytime', loose]);
  return `<div class="hb-focus">
    ${open.length ? groups.map(([t, hs]) => `<div class="hb-tgroup">
      <div class="hb-tlabel mono">${esc(t)}</div>
      ${hs.map(habTodayRowHTML).join('')}</div>`).join('')
      : `<div class="empty hb-quiet">Every ritual honoured. The day's structure holds.</div>`}
    ${kept.length ? `<div class="hb-tgroup done"><div class="hb-tlabel mono">kept</div>
      ${kept.map(habTodayRowHTML).join('')}</div>` : ''}
    <div class="hb-quote">“${esc(HAB_QUOTES.ritual[1])}” <cite>${esc(HAB_QUOTES.ritual[0])}</cite></div>
  </div>`;
}
function habTodayRowHTML(h){
  const T = today(), br = habIsBreaking(h), kept = habKept(h, T), st = habStreak(h);
  const c = h.color || (br ? 'var(--terra)' : 'var(--sage)');
  return `<div class="hb-trow${kept ? ' kept' : ''}" style="--c:${esc(c)}">
    <button class="pt-box" data-hbcheck="${h.id}" role="checkbox" aria-checked="${kept}"
      style="--pc:${esc(c)}" title="${kept ? 'change the check-in' : 'check in'}">
      <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.2" class="pt-ring"/>
        <path d="M5.6 10.3 L8.7 13.3 L14.4 6.9" class="pt-tick"/></svg></button>
    <div class="hb-tmid">
      <button class="hb-tname" data-hbopen="${h.id}">${esc(h.icon || '')} ${esc(h.name)}</button>
      ${h.identity ? `<div class="hb-tident">${esc(h.identity)}</div>` : ''}
      ${h.cue ? `<div class="hb-tcue mono">after: ${esc(h.cue)}</div>` : ''}
    </div>
    <div class="hb-tright">
      <span class="mono hb-tstreak">${br ? '🛡' : '🔥'} ${st.cur}</span>
      ${h.durationTarget ? `<span class="mono hb-tdur">${h.durationTarget} min</span>` : ''}
    </div></div>`;
}

/* ---------- analytics ---------- */
function habAnalyticsHTML(){
  const hs = habList();
  if(!hs.length) return '<div class="empty">Nothing to read yet.</div>';
  const bal = habEnergyBalance();
  const reached = habMilestonesReached();
  const runs = hs.map(h => ({h, s:habStreak(h)}));
  return `<div class="hb-an">
    <div class="hb-quote top">“${esc(HAB_QUOTES.plateau[1])}” <cite>${esc(HAB_QUOTES.plateau[0])}</cite></div>

    <section class="hb-asec"><div class="row between"><span class="sc" style="margin:0">Ninety days</span>
      <span class="mono faint">how much of each day's ritual was kept</span></div>
      ${heatGrid(lastDays(91), 13, d => {
        const due = hs.filter(h => habDue(h, d)); if(!due.length) return '';
        const f = due.filter(h => habKept(h, d)).length / due.length;
        return f >= 1 ? 'l3' : f >= .6 ? 'l2' : f > 0 ? 'l1' : '';
      }, 'heat hb-heat')}
      <div class="ph-legend mono"><span>none</span><i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><span>all of them</span></div>
    </section>

    <section class="hb-asec"><span class="sc">Each one, and how it is holding</span>
      <div class="hb-health">${hs.map(h => { const sc = habHealth(h), t = habTrend(h), st = habStreak(h);
        return `<div class="hb-hrow" style="--c:${esc(h.color || (habIsBreaking(h) ? 'var(--terra)' : 'var(--sage)'))}">
          <span class="hb-hname">${esc(h.icon || '◍')} ${esc(h.name)}
            <span class="hb-badge sm">${habIsBreaking(h) ? '🔓' : '🌱'}</span></span>
          <span class="hb-hscore mono" title="completion, consistency and direction">${sc == null ? '—' : sc}</span>
          <span class="hb-mini sm">${lastDays(30).map(d => { const s = habStatus(h, d);
            const cls = s === 'slipped' ? 'slip' : (s && habKept(h, d)) ? 'on' : habDue(h, d) ? '' : 'off';
            return `<i class="${cls}"></i>`; }).join('')}</span>
          <span class="mono hb-htrend ${t.dir}">${t.dir === 'up' ? '↑ improving' : t.dir === 'down' ? '↓ slipping' : '→ steady'}</span>
          <span class="mono faint">${st.cur} / ${st.best}</span></div>`; }).join('')}</div>
    </section>

    <section class="hb-asec"><span class="sc">The four dimensions, spent and renewed</span>
      <div class="hb-quad">${DIMS.map(x => { const v = bal[x.id];
        const over = v.exp >= 2 && v.rec === 0;
        const tot = Math.max(1, v.exp + v.rec);
        return `<div class="hb-q${over ? ' over' : ''}" style="--c:${x.c}">
          <div class="hb-qname">${esc(x.name)}</div>
          <div class="hb-qbars">
            <div class="hb-qb"><span class="k">spending</span><div class="bar"><i style="width:${v.exp / tot * 100}%"></i></div><span class="mono">${v.exp}</span></div>
            <div class="hb-qb rec"><span class="k">renewing</span><div class="bar"><i style="width:${v.rec / tot * 100}%"></i></div><span class="mono">${v.rec}</span></div>
          </div>
          ${over ? '<div class="hb-warn">all spending, no renewal</div>' : ''}</div>`; }).join('')}</div>
      <div class="hb-quote">“${esc(HAB_QUOTES.oscillate[1])}” <cite>${esc(HAB_QUOTES.oscillate[0])}</cite></div>
    </section>

    <section class="hb-asec"><span class="sc">Milestones reached</span>
      ${reached.length ? `<div class="hb-mtimeline">${reached.slice(0, 24).map(({habit, m}) => `<div class="hb-mrow">
        <span class="mono hb-mdate">${esc(fmtDate((m.reachedAt || '').slice(0,10), 'med'))}</span>
        <span class="hb-mwhat"><b>${esc(habit.name)}</b> — ${esc(m.label)}<span class="mono faint"> · ${m.days} days</span></span></div>`).join('')}</div>`
        : '<div class="pk-empty">None yet. The first is seven days away from the day you start.</div>'}
    </section>

    <section class="hb-asec"><span class="sc">The longest runs</span>
      <div class="grid c2" style="gap:18px;align-items:start">
        <div><div class="k mono">all time</div>${runs.slice().sort((a,b)=>b.s.best-a.s.best).slice(0,5)
          .map(({h,s}) => `<div class="row between hb-runrow"><span>${esc(h.icon||'◍')} ${esc(h.name)}</span><span class="mono">${s.best}</span></div>`).join('') || '<div class="pk-empty">nothing yet</div>'}</div>
        <div><div class="k mono">running now</div>${runs.slice().sort((a,b)=>b.s.cur-a.s.cur).filter(x=>x.s.cur).slice(0,5)
          .map(({h,s}) => `<div class="row between hb-runrow"><span>${esc(h.icon||'◍')} ${esc(h.name)}</span><span class="mono">${s.cur}</span></div>`).join('') || '<div class="pk-empty">nothing running</div>'}</div>
      </div>
    </section>
  </div>`;
}
