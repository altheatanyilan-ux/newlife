/* ============================================================
   LOGGING SOMETHING IN FIVE SECONDS, AND THE SHAPE OF A FRIENDSHIP

   Logging an interaction used to mean opening a person, finding their log,
   and filling in a form with a date, a kind, a description, an energy reading
   and a quality. Half a minute of typing for the fact that you had coffee.
   So it did not get done, and a page whose whole value is the record was kept
   by a record nobody kept.

   This is the same data behind a door you can get through in three taps: who,
   what kind, how it left you. The note is one line and optional — if there is
   more to say, the person's own page is still there and still takes it.

   And the second half: a friendship read back as a shape rather than a list.
   Ninety days as a strip of days, the energy of each meeting as a line, the
   meetings themselves as marks along a timeline. A list tells you what
   happened; these tell you the rhythm, which is the thing you actually want
   to know and the thing a list hides.
   ============================================================ */

/* The six kinds, in the order a hand reaches for them, and one of them is new:
   thinking of somebody is a way of keeping them, and the record should be
   able to say so. */
const QUICK_KINDS = [
  ['met_in_person', '◍', 'met'],
  ['call',          '☎', 'called'],
  ['text',          '✎', 'wrote'],
  ['email',         '✉', 'emailed'],
  ['video_call',    '▣', 'saw'],
  ['thought',       '♡', 'thought of'],
];

function openQuickLog(personId, opts){
  const o = opts || {};
  const people = [...(S.people || [])].sort((a, b) =>
    (b.lastInteraction || '').localeCompare(a.lastInteraction || '') || a.name.localeCompare(b.name));
  if(!people.length){ toast('Nobody here yet. Add a person first.'); return; }
  const kind = S._qlKind || 'met_in_person';
  const energy = S._qlEnergy || '';

  const m = openModal(`<h2 class="entry-h">Quick log</h2>
    <p class="muted" style="font-size:.86rem;margin:-6px 0 14px">Three taps. Anything longer belongs on their page.</p>
    <div class="stack ql">
      <div class="field"><label for="qlWho">Who</label>
        <input class="inp" id="qlWho" list="qlList" autocomplete="off" placeholder="start typing a name"
          value="${personId ? esc((byId(S.people, personId) || {}).name || '') : ''}">
        <datalist id="qlList">${people.map(p => `<option value="${esc(p.name)}"></option>`).join('')}</datalist>
      </div>
      <div class="field"><label>What</label>
        <div class="ql-kinds" role="radiogroup" aria-label="kind">${QUICK_KINDS.map(([k, ic, say]) =>
          `<button class="${kind === k ? 'on' : ''}" data-qlkind="${k}" role="radio" aria-checked="${kind === k}">
            <span class="ql-ic">${ic}</span><span>${say}</span></button>`).join('')}</div>
      </div>
      <div class="field"><label>And it left you</label>
        <div class="resonance-scale" id="qlEnergy">${Object.entries(ENERGY_READINGS).map(([k, x]) =>
          `<button style="--c:${x[2]}" class="${energy === k ? 'on' : ''}" data-qlenergy="${k}">${x[0]} ${x[1]}</button>`).join('')}
          <button class="${energy === '' ? 'on' : ''}" data-qlenergy="">· not saying</button></div>
      </div>
      <div class="field"><label for="qlNote">One line, if there is one</label>
        <input class="inp" id="qlNote" autocomplete="off" placeholder="coffee, and she asked about the move">
      </div>
      <div class="row between ql-foot">
        <label class="mono ql-when">when <input class="inp mono" type="date" id="qlDate" value="${today()}" max="${today()}"></label>
        <span class="row" style="gap:8px">
          <button class="btn ghost" id="qlMore" title="save this one and open another">save · another</button>
          <button class="btn primary" id="qlSave">Save</button></span>
      </div>
    </div>`, 'narrow');

  const who = m.querySelector('#qlWho');
  setTimeout(() => { personId ? m.querySelector('#qlNote').focus() : who.focus(); }, 60);

  m.querySelectorAll('[data-qlkind]').forEach(b => b.onclick = () => {
    S._qlKind = b.dataset.qlkind;
    m.querySelectorAll('[data-qlkind]').forEach(x => {
      const on = x.dataset.qlkind === S._qlKind;
      x.classList.toggle('on', on); x.setAttribute('aria-checked', on);
    });
    sound('click');
  });
  m.querySelectorAll('[data-qlenergy]').forEach(b => b.onclick = () => {
    S._qlEnergy = b.dataset.qlenergy;
    m.querySelectorAll('[data-qlenergy]').forEach(x => x.classList.toggle('on', x.dataset.qlenergy === S._qlEnergy));
    sound('click');
  });

  /* the name is matched loosely, because nobody types a full name to log a
     coffee: an unambiguous prefix is enough, and an unknown one offers to
     become a new person rather than failing */
  function resolve(){
    const q = who.value.trim().toLowerCase(); if(!q) return null;
    const exact = S.people.find(p => p.name.toLowerCase() === q
      || (p.nickname || '').toLowerCase() === q);
    if(exact) return exact;
    const hits = S.people.filter(p => `${p.name} ${p.nickname || ''}`.toLowerCase().includes(q));
    return hits.length === 1 ? hits[0] : null;
  }
  function save(again){
    let p = resolve();
    if(!p){
      const nm = who.value.trim();
      if(!nm){ who.focus(); toast('Who was it?'); return; }
      if(!confirm(`No one here is called "${nm}". Add them?`)){ who.focus(); return; }
      p = newPerson(nm); S.people.push(p);
    }
    const k = S._qlKind || 'met_in_person';
    const date = m.querySelector('#qlDate').value || today();
    const note = m.querySelector('#qlNote').value.trim();
    S.interactions.push({id: uid(), personId: p.id, date, type: k,
      description: note || (QUICK_KINDS.find(x => x[0] === k) || [])[2] || 'Saw them.',
      mood: null, energy: S._qlEnergy || '', quality: '', followUp: null, followUpDone: false});
    p.lastInteraction = lastInteractionDate(p.id);
    saveNow(); sound('success');
    /* the constellation answers straight away: the face brightens, the thread
       refreshes, and a few motes come off it. That is the whole reward, and
       it is the reason this gets done at all. */
    if(typeof _sky !== 'undefined' && _sky){ _sky.light(p.id); skyBurstAt(p.id); }
    toast(`${esc(p.nickname || p.name.split(' ')[0])} — logged.`);
    if(again){
      /* the energy stays, because a run of catching-up is usually one mood */
      who.value = ''; m.querySelector('#qlNote').value = '';
      who.focus();
      return;
    }
    m.remove();
    if(parseHash().name === 'people' || (typeof identityTabNow === 'function' && identityTabNow() === 'people')) rerender();
  }
  m.querySelector('#qlSave').onclick = () => save(false);
  m.querySelector('#qlMore').onclick = () => save(true);
  m.addEventListener('keydown', e => {
    if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); save(e.metaKey || e.ctrlKey); }
  });
  return m;
}

/* ---------- ninety days, as ninety days ----------
   A strip of squares, one per day, darker where there was more. It says in
   one glance what a reverse-chronological list cannot: that you saw them
   twice in April and not since, or that it is every other Tuesday. */
function personHeatHTML(id, days = 90){
  const by = {};
  personInteractions(id).forEach(i => { if(daysSince(i.date) <= days) by[i.date] = (by[i.date] || 0) + 1; });
  const T = today();
  const cells = [];
  for(let d = days - 1; d >= 0; d--){
    const day = addDays(T, -d), n = by[day] || 0;
    cells.push(`<i class="${n ? 'on' : ''}" style="--n:${Math.min(n, 4)}" title="${fmtDate(day, 'med')}${
      n ? ` · ${n} interaction${n === 1 ? '' : 's'}` : ''}"></i>`);
  }
  const total = Object.values(by).reduce((a, c) => a + c, 0);
  return `<div class="heat-wrap">
    <div class="row between"><span class="k mono">last ninety days</span>
      <span class="mono faint">${total} interaction${total === 1 ? '' : 's'}</span></div>
    <div class="heat">${cells.join('')}</div>
  </div>`;
}

/* ---------- the meetings, as marks on a line ----------
   Where the gaps are is the information. A list puts every entry the same
   distance from the next one, which is exactly the fact it should be showing
   you. */
function personTimelineHTML(id, days = 180){
  const ints = personInteractions(id).filter(i => daysSince(i.date) <= days).reverse();
  if(!ints.length) return '';
  const T = today();
  return `<div class="ptl-wrap">
    <div class="row between"><span class="k mono">the last six months</span>
      <span class="mono faint">hover a mark</span></div>
    <div class="ptl">
      <i class="ptl-line"></i>
      ${ints.map(i => {
        const at = 100 - (daysSince(i.date) / days) * 100;
        const t = INTERACTION_TYPES[i.type] || (i.type === 'thought' ? ['♡', 'Thought of them'] : INTERACTION_TYPES.other);
        const en = ENERGY_READINGS[i.energy];
        return `<button class="ptl-mark" style="left:${at.toFixed(2)}%;--c:${en ? en[2] : 'var(--line-2)'}"
          data-ptlint="${esc(i.id)}"
          title="${fmtDate(i.date, 'med')} · ${esc(t[1])}${i.description ? ' — ' + esc(i.description) : ''}">${t[0]}</button>`;
      }).join('')}
    </div>
    <div class="row between mono faint ptl-ends"><span>${fmtDate(addDays(T, -days), 'med')}</span><span>today</span></div>
  </div>`;
}

/* ---------- how it has been leaving you ----------
   One dot per meeting that carried a reading, in the order they happened. A
   run that slopes down is worth seeing, and it is not visible anywhere else.  */
function personEnergyLineHTML(id){
  const pts = personInteractions(id).filter(i => i.energy).reverse()
    .map(i => ({v: {energized: 1, neutral: 0, drained: -1}[i.energy] ?? 0, date: i.date}));
  if(pts.length < 2) return '';
  const W = 200, H = 54, pad = 6;
  const x = i => pad + (i / (pts.length - 1)) * (W - pad * 2);
  const y = v => H / 2 - v * (H / 2 - pad);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
  return `<div class="pe-wrap">
    <span class="k mono">how it leaves you, meeting by meeting</span>
    <svg viewBox="0 0 ${W} ${H}" class="pe-line" aria-hidden="true">
      <line x1="${pad}" y1="${H / 2}" x2="${W - pad}" y2="${H / 2}" class="pe-mid"/>
      <path d="${d}" fill="none" class="pe-path"/>
      ${pts.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="2.6"
        fill="${p.v > 0 ? ENERGY_READINGS.energized[2] : p.v < 0 ? ENERGY_READINGS.drained[2] : ENERGY_READINGS.neutral[2]}"/>`).join('')}
    </svg>
    <span class="mono faint">${pts.length} readings · ${fmtDate(pts[0].date, 'short')} to ${fmtDate(pts[pts.length - 1].date, 'short')}</span>
  </div>`;
}
