/* ============================================================
   HABIT AREA PAGES + HABIT DETAIL

   Each life-area category gets its own page, a natural home for all
   the habits that live there. The detail page is the single habit seen
   in full: streaks, heat, the complete log.
   ============================================================ */

/* ---------- studio links — one category, one studio ---------- */
const HAB_AREA_STUDIOS = {
  mind:      {label: 'Japanese Studio →', url: '#/japanese'},
  craft:     {label: 'Songwriting Studio →', url: '#/songwriting'},
  creative:  {label: 'Songwriting Studio →', url: '#/songwriting'},
  career:    {label: 'Jazz Studio →', url: '#/jazz'},
};

/* ---------- area page ---------- */
routes['habit-area'] = function(root, params){
  const cat = (params[0] || '').toLowerCase();
  if(!HAB_CATS.includes(cat)){
    root.innerHTML = `<div class="page"><div class="empty">Unknown area "${esc(cat)}".</div></div>`;
    return;
  }
  S.habitAreaNotes = S.habitAreaNotes && typeof S.habitAreaNotes === 'object' ? S.habitAreaNotes : {};

  const T = today();
  const hs = habList().filter(h => h.category === cat);
  const dueHere = hs.filter(h => habDue(h, T));
  const keptHere = dueHere.filter(h => habKept(h, T));
  const studio = HAB_AREA_STUDIOS[cat];

  /* ring summary row */
  const R = 14, C = 2 * Math.PI * R;
  const pct = dueHere.length ? keptHere.length / dueHere.length : 0;
  const ringHTML = `<svg class="hb-ring" viewBox="0 0 34 34" aria-hidden="true" style="width:34px;height:34px">
    <circle cx="17" cy="17" r="${R}" class="hb-rt"/>
    <circle cx="17" cy="17" r="${R}" class="hb-ra" style="stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:${(C*(1-pct)).toFixed(1)}"/></svg>`;

  /* recent log for each habit: last 7 days' entries with notes */
  function recentNotesHTML(h){
    const rows = lastDays(7).map(d => {
      const e = habEntry(h, d); if(!e) return '';
      const st = habStatus(h, d), ok = st && habKept(h, d);
      const label = HAB_SESSION_STATUS[st] ? HAB_SESSION_STATUS[st][1] : st || '';
      const note = e.note || '';
      if(!st && !note) return '';
      return `<div class="hba-logrow"><span class="mono faint hba-logd">${esc(fmtDate(d, 'short'))}</span>
        <span class="mono hba-logst ${ok ? 'on' : 'off'}">${esc(label)}</span>
        ${note ? `<span class="hba-lognote">${esc(note)}</span>` : ''}</div>`;
    }).filter(Boolean);
    if(!rows.length) return '';
    return `<div class="hba-log">${rows.join('')}</div>`;
  }

  /* today's habit rows for this area */
  const todayRowsHTML = dueHere.length
    ? `<div class="hba-today-rows">${dueHere.map(habTodayRowHTML).join('')}</div>`
    : `<div class="empty" style="font-size:.88rem;padding:10px 0">No habits due today in this area.</div>`;

  /* all habit cards, linking their name to the detail page */
  const cardsHTML = hs.length
    ? `<div class="hb-grid hba-cards">${hs.map(h => {
        const br = habIsBreaking(h), st = habStreak(h), c = h.color || (br ? 'var(--terra)' : 'var(--sage)');
        const kept = habKept(h, T), due = habDue(h, T);
        const state = !due ? 'off' : kept ? 'kept' : 'pending';
        return `<div class="hb-card ${state}${br ? ' breaking' : ''}" style="--c:${esc(c)}">
          <div class="hb-ctop">
            <span class="hb-face">${habFaceHTML(h, br)}</span>
            <a class="hb-name" href="#/habit-detail/${esc(h.id)}">${esc(h.name)}</a>
            <span class="hb-badge">${habKindMark(br)}</span>
          </div>
          ${h.identity ? `<div class="hb-ident">${esc(h.identity)}</div>` : ''}
          <div class="hb-streak">${habRunMark(br)}${st.cur}
            <span class="hb-sunit">${br ? 'days clean' : st.cur === 1 ? 'day' : 'days'}</span></div>
          ${recentNotesHTML(h)}
        </div>`;
      }).join('')}</div>`
    : `<div class="empty">No habits in this area yet.</div>`;

  root.innerHTML = `<div class="page hba-page">
    <div class="hba-header">
      <a class="hba-back mono" href="#/planning/habits">← Habits</a>
      <h1 class="hba-title">${esc(cat.charAt(0).toUpperCase() + cat.slice(1))}</h1>
      ${studio ? `<a class="btn sm ghost hba-studio" href="${esc(studio.url)}">${esc(studio.label)}</a>` : ''}
    </div>

    <div class="hba-summary card">
      <div class="hba-sum-ring">${ringHTML}</div>
      <div class="hba-sum-mid">
        <span class="num">${keptHere.length} / ${dueHere.length}</span>
        <span class="mono faint"> done today</span>
      </div>
      <div class="hba-sum-rt">
        <span class="mono faint">${hs.length} habit${hs.length === 1 ? '' : 's'} in this area</span>
      </div>
    </div>

    <section class="hba-sec">
      <div class="sc hba-sc">Today</div>
      ${todayRowsHTML}
    </section>

    <section class="hba-sec">
      <div class="sc hba-sc">Habits in this area</div>
      ${cardsHTML}
    </section>

    <section class="hba-sec">
      <div class="sc hba-sc">Area notes</div>
      <textarea class="inp hba-notes" id="hbaNotesTA" rows="5"
        placeholder="Reflections, intentions, what you want this area of your life to look like…">${esc(S.habitAreaNotes[cat] || '')}</textarea>
    </section>
  </div>`;

  /* bind check-in buttons (reuse habits system) */
  root.querySelectorAll('[data-hbcheck]').forEach(b => {
    b.onclick = () => { const h = byId(habList(), b.dataset.hbcheck); if(h) openHabCheckin(h); };
  });
  root.querySelectorAll('[data-hbopen]').forEach(b => {
    b.onclick = () => { const h = byId(habList(), b.dataset.hbopen); if(h && typeof openHabDetail === 'function') openHabDetail(h); };
  });

  /* area notes — debounced save */
  let _notesT;
  const ta = root.querySelector('#hbaNotesTA');
  if(ta) ta.oninput = () => { clearTimeout(_notesT); _notesT = setTimeout(() => {
    S.habitAreaNotes[cat] = ta.value; saveNow(); }, 800); };

  reveal(root);
};

/* ---------- habit detail page ---------- */
routes['habit-detail'] = function(root, params){
  const id = params[0] || '';
  const h = habDefaults((S.habits || []).find(x => x.id === id));
  if(!h){
    root.innerHTML = `<div class="page"><div class="empty">Habit not found.</div></div>`;
    return;
  }
  const br = habIsBreaking(h), st = habStreak(h);
  const c = h.color || (br ? 'var(--terra)' : 'var(--sage)');
  const T = today();

  /* full log: all days that have an entry, newest first */
  const allEntryDays = Object.keys(S.habitLog || {})
    .filter(d => S.habitLog[d]?.[id])
    .sort((a, b) => b < a ? -1 : 1)
    .slice(0, 120);

  const logRowsHTML = allEntryDays.length
    ? allEntryDays.map(d => {
        const e = S.habitLog[d][id];
        const st2 = habStatus(h, d), ok = st2 && habKept(h, d);
        const label = HAB_SESSION_STATUS[st2] ? HAB_SESSION_STATUS[st2][1] : st2 || '';
        return `<div class="hbd-logrow">
          <span class="mono hbd-logd">${esc(fmtDate(d, 'med'))}</span>
          <span class="mono hbd-logst ${ok ? 'on' : 'miss'}">${esc(label)}</span>
          ${e.note ? `<div class="hbd-lognote">${esc(e.note)}</div>` : ''}
        </div>`;
      }).join('')
    : '<div class="empty">No log entries yet.</div>';

  /* milestones row */
  const msHTML = (h.milestones || []).map(m =>
    `<div class="hbd-ms ${m.reached ? 'reached' : ''}">
      <span class="hbd-ms-ico">${m.reached ? '✦' : '◦'}</span>
      <span class="hbd-ms-n">${esc(m.label)}</span>
      <span class="mono faint">${m.days}d${m.reached && m.reachedAt ? ` · reached ${esc(fmtDate(m.reachedAt.slice(0,10), 'med'))}` : ''}</span>
    </div>`
  ).join('');

  root.innerHTML = `<div class="page hbd-page">
    <div class="hbd-header">
      <a class="hba-back mono" href="#/habit-area/${esc(h.category)}">← ${esc(h.category.charAt(0).toUpperCase() + h.category.slice(1))}</a>
    </div>

    <div class="hbd-hero card" style="--c:${esc(c)}">
      <div class="hbd-face">${habFaceHTML(h, br)}</div>
      <div class="hbd-title">
        <h1 class="hbd-name">${esc(h.name)}</h1>
        <div class="hbd-cat mono faint">${esc(h.category)} · ${habKindMark(br, br ? 'breaking' : 'building')} ${br ? 'breaking' : 'building'}</div>
      </div>
      <div class="hbd-streaks">
        <div class="hbd-run">${habRunMark(br)}<span class="hbd-big">${st.cur}</span>
          <span class="mono faint">now</span></div>
        <div class="hbd-run">${habRunMark(br)}<span class="hbd-big">${st.best}</span>
          <span class="mono faint">best</span></div>
      </div>
    </div>

    ${h.identity ? `<div class="hbd-ident card serif">"${esc(h.identity)}"</div>` : ''}

    <section class="hba-sec">
      <div class="sc hba-sc">Ninety days</div>
      ${heatGrid(lastDays(91), 13, d => {
        const s = habStatus(h, d);
        if(!habDue(h, d)) return '';
        return s && habKept(h, d) ? 'l3' : s === 'partial' ? 'l2' : s ? 'l1' : '';
      }, 'heat hb-heat hbd-heat')}
      <div class="ph-legend mono" style="margin-top:4px"><span>missed</span><i class="l1"></i><i class="l2"></i><i class="l3"></i><span>done</span></div>
    </section>

    ${msHTML ? `<section class="hba-sec"><div class="sc hba-sc">Milestones</div><div class="hbd-ms-list">${msHTML}</div></section>` : ''}

    <section class="hba-sec">
      <div class="sc hba-sc">Log</div>
      <div class="hbd-log">${logRowsHTML}</div>
    </section>
  </div>`;

  reveal(root);
};
