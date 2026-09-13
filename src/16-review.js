/* ============================================================
   THE REVIEW — reading the period before writing about it

   A review here is not a blank page headed "how was your week". It gathers
   what the house already knows about the days in question — how you slept,
   what you kept, what you practised, who you saw, what came in — shows it to
   you section by section, and puts a text box under each one. You read your
   own data first, and then you write. That order is the whole design.

   What it gathered is snapshotted into the review at the moment it is made,
   so the record does not quietly change afterwards when you edit a habit or
   delete an entry. A review is a photograph, not a live query.

   Any of the reflections can be sent to the Lived Record as a journal entry
   of whatever kind fits. It then has two homes and one text: editing either
   updates both, and deleting the journal entry leaves the writing where it
   was written.
   ============================================================ */
const REVIEW_PERIODS = [
  ['day',     'A day'],
  ['week',    'A week'],
  ['biweek',  'A fortnight'],
  ['month',   'A month'],
  ['quarter', 'A quarter'],
  ['half',    'Half a year'],
  ['year',    'A year'],
  ['custom',  'Any stretch you like'],
];
/* the sections of a digest, in the order they are read */
const REVIEW_SECTIONS = [
  ['sleep',    'Sleep and waking',   '#7f916a'],
  ['energy',   'Energy and mood',    '#b08968'],
  ['habits',   'Habits',             '#c9a84c'],
  ['tasks',    'Work and attention', '#a0727e'],
  ['skills',   'Skills',             '#5f8d49'],
  ['projects', 'Projects',           '#b4462f'],
  ['values',   'Values',             '#8f7bb0'],
  ['people',   'People',             '#4b7d9c'],
  ['record',   'What you wrote',     '#6b5e53'],
  ['reading',  'What you read',      '#8a7263'],
  ['practice', 'Practice',           '#7fae63'],
  ['money',    'Money',              '#5f9a49'],
];
const REVIEW_JOURNAL_KINDS = ['reflection','gratitude','question','synchronicity','manifestation'];

function migrateReviews(){
  const r = S.reviewEntries = Array.isArray(S.reviewEntries) ? S.reviewEntries : [];
  S.reviewPrefs = S.reviewPrefs || {period:'week', nudges:true};
  return r;
}
const reviewEntries = () => migrateReviews();

/* ---------- the period ---------- */
function reviewRange(kind, anchor){
  const T = anchor || today();
  const d = parseDay(T);
  const iso = x => isoDay(x);
  const back = n => addDays(T, -n);
  if(kind === 'day') return {from:T, to:T};
  if(kind === 'week'){ /* the seven days ending today, which is what a week feels like */
    return {from: back(6), to: T}; }
  if(kind === 'biweek') return {from: back(13), to: T};
  if(kind === 'month'){ const s = new Date(d.getFullYear(), d.getMonth(), 1);
    const e = new Date(d.getFullYear(), d.getMonth() + 1, 0); return {from: iso(s), to: iso(e) > T ? T : iso(e)}; }
  if(kind === 'quarter'){ const q = Math.floor(d.getMonth() / 3);
    const s = new Date(d.getFullYear(), q * 3, 1), e = new Date(d.getFullYear(), q * 3 + 3, 0);
    return {from: iso(s), to: iso(e) > T ? T : iso(e)}; }
  if(kind === 'half'){ const h = d.getMonth() < 6 ? 0 : 6;
    const s = new Date(d.getFullYear(), h, 1), e = new Date(d.getFullYear(), h + 6, 0);
    return {from: iso(s), to: iso(e) > T ? T : iso(e)}; }
  if(kind === 'year'){ const s = new Date(d.getFullYear(), 0, 1);
    return {from: iso(s), to: T}; }
  return {from: back(6), to: T};
}
function reviewLabel(kind, from, to){
  if(kind === 'day') return fmtDate(from, 'med');
  if(kind === 'month') return fmtDate(from, 'med').replace(/^\d+\s/, '').replace(/,?\s*\d{4}$/, '') + ' ' + from.slice(0, 4);
  if(kind === 'quarter') return `Q${Math.floor(parseDay(from).getMonth() / 3) + 1} ${from.slice(0, 4)}`;
  if(kind === 'year') return from.slice(0, 4);
  return `${fmtDate(from, 'short')} – ${fmtDate(to, 'short')}`;
}
const reviewDays = (from, to) => { const out = []; let d = from;
  while(d <= to && out.length < 400){ out.push(d); d = addDays(d, 1); } return out; };

/* ---------- gathering ----------
   Every section returns null when there is nothing in it. An empty card is
   worse than no card: it reads as a reproach for a week you were not
   measuring anything. */
function reviewGather(from, to){
  const days = reviewDays(from, to);
  /* Some sections are worth drawing for what did NOT happen — skills you have
     and did not touch, people you meant to see. But that only reads as useful
     inside a period you were actually living in the house. Over a stretch with
     no trace of you at all, every one of them is a reproach for nothing. So:
     if nothing at all happened in these days, there is no digest. */
  {
    const touched = days.some(d => S.checkins?.[d] || S.dailyRhythm?.[d])
      || (S.entries || []).some(e => e.occurredAt >= from && e.occurredAt <= to)
      || (S.nods || []).some(n => n.date >= from && n.date <= to)
      || (S.interactions || []).some(i => i.date >= from && i.date <= to)
      || (typeof focusSessions === 'function' && focusSessions().some(x => { const d = (x.startedAt || '').slice(0, 10); return d >= from && d <= to; }))
      || (S.habits || []).some(h => !h.archived && days.some(d => habitDone(h, d)));
    if(!touched) return {};
  }
  const inRange = d => d >= from && d <= to;
  const avgOf = xs => { const v = xs.filter(x => x != null && !isNaN(x)); return v.length ? +(sum(v) / v.length).toFixed(1) : null; };
  const st = {};

  /* sleep, from the daily rhythm */
  {
    const rows = days.map(d => typeof weekShapeRow === 'function' ? weekShapeRow(d) : null).filter(r => r && (r.wake != null || r.close != null));
    if(rows.length){
      const awake = rows.map(r => r.awake).filter(x => x != null);
      const best = rows.filter(r => r.awake != null).sort((a, b) => a.awake - b.awake)[0];
      const worst = rows.filter(r => r.awake != null).sort((a, b) => b.awake - a.awake)[0];
      st.sleep = {nights: rows.length, logged: days.length,
        wake: avgOf(rows.map(r => r.wake)), sleep: avgOf(rows.map(r => r.close)),
        awake: avgOf(awake),
        shortest: best ? {date: best.d, hours: +best.awake.toFixed(1)} : null,
        longest: worst ? {date: worst.d, hours: +worst.awake.toFixed(1)} : null};
    }
  }
  /* energy and the set-point, from the check-ins */
  {
    const cs = days.map(d => S.checkins?.[d]).filter(Boolean);
    const dims = (typeof DIMS !== 'undefined' ? DIMS : []).map(dm => ({id:dm.id, name:dm.name,
      avg: avgOf(cs.map(c => c.energy?.[dm.id]))})).filter(x => x.avg != null);
    const sets = cs.map(c => c.setpoint).filter(Boolean);
    const moods = {}; cs.forEach(c => { if(c.mood) moods[c.mood] = (moods[c.mood] || 0) + 1; });
    if(dims.length || sets.length || Object.keys(moods).length)
      st.energy = {dims, setpoint: avgOf(sets), setpointName: sets.length ? hicksName(avg(sets)).split(' / ')[0] : null,
        moods, checkins: cs.length};
  }
  /* habits */
  {
    const live = (S.habits || []).filter(h => !h.archived);
    let due = 0, done = 0;
    const per = live.filter(h => !h.negative).map(h => { let d0 = 0, k0 = 0;
      days.forEach(d => { if(habitDue(h, d)){ d0++; if(habitDone(h, d)) k0++; } });
      due += d0; done += k0;
      return {name: h.name, due: d0, kept: k0, rate: d0 ? Math.round(k0 / d0 * 100) : null}; }).filter(x => x.due);
    const slips = live.filter(h => h.negative).map(h => ({name: h.name,
      slips: days.filter(d => habitDone(h, d)).length})).filter(x => x.slips);
    if(per.length || slips.length){
      const sorted = per.slice().sort((a, b) => b.rate - a.rate);
      st.habits = {rate: due ? Math.round(done / due * 100) : null, due, kept: done,
        best: sorted[0] || null, worst: sorted.length > 1 ? sorted[sorted.length - 1] : null,
        slips, tracked: per.length};
    }
  }
  /* the work: sittings, and what got finished */
  {
    const sess = typeof focusSessions === 'function' ? focusSessions().filter(s => inRange((s.startedAt || '').slice(0, 10))) : [];
    const doneTasks = (typeof allTaskRefs === 'function' ? allTaskRefs() : []).filter(r => r.done && inRange(r.task?.doneAt || ''));
    if(sess.length || doneTasks.length){
      const mins = sum(sess.map(s => +s.duration || 0));
      st.tasks = {sittings: sess.length, minutes: mins, finished: doneTasks.length,
        perDay: days.length ? +(mins / days.length).toFixed(0) : 0,
        longest: sess.length ? Math.max(...sess.map(s => +s.duration || 0)) : 0};
    }
  }
  /* skills */
  {
    const prog = (S.entries || []).filter(e => e.type === 'progress' && inRange(e.occurredAt));
    const touched = new Set(); prog.forEach(e => (e.links?.skills || []).forEach(id => touched.add(id)));
    const live = (S.skills || []).filter(s => !s.planned);
    const neglected = live.filter(s => !touched.has(s.id)).map(s => s.name);
    if(prog.length || live.length)
      st.skills = {entries: prog.length,
        hours: +(sum(prog.map(e => +e.extra?.minutes || 0)) / 60).toFixed(1),
        touched: [...touched].map(id => byId(S.skills, id)?.name).filter(Boolean),
        neglected: neglected.slice(0, 6), live: live.length};
  }
  /* projects */
  {
    const nods = (S.nods || []).filter(n => inRange(n.date));
    const active = (S.projects || []).filter(p => p.status === 'active');
    if(nods.length || active.length){
      const by = {}; nods.forEach(n => { by[n.projectId] = (by[n.projectId] || 0) + 1; });
      st.projects = {nods: nods.length,
        tended: Object.keys(by).map(id => ({name: byId(S.projects, id)?.name, n: by[id]})).filter(x => x.name)
          .sort((a, b) => b.n - a.n),
        dormant: active.filter(p => !by[p.id]).map(p => p.name).slice(0, 6), active: active.length};
    }
  }
  /* values */
  {
    const snaps = (S.valueSnapshots || []).filter(s => inRange(s.date));
    let embodied = 0, betrayed = 0;
    (S.entries || []).filter(e => inRange(e.occurredAt)).forEach(e =>
      (e.links?.values || []).forEach(v => { const pol = typeof v === 'string' ? '+' : v.pol;
        if(pol === '-') betrayed++; else embodied++; }));
    const last = snaps[snaps.length - 1] || (typeof allSnapshotsWithRetro === 'function' ? allSnapshotsWithRetro().slice(-1)[0] : null);
    if(snaps.length || embodied || betrayed){
      const gaps = last && typeof houseStats === 'function' ? (houseStats().gaps || []).slice(0, 1) : [];
      st.values = {snapshots: snaps.length, embodied, betrayed,
        average: last ? avgOf((S.valueOrder || []).map(id => last.ratings?.[id])) : null,
        widest: gaps[0] ? {name: gaps[0].name, congruence: gaps[0].congruence, rank: gaps[0].rank} : null};
    }
  }
  /* people */
  {
    const ints = (S.interactions || []).filter(i => inRange(i.date));
    const seen = new Set(ints.map(i => i.personId));
    const core = (S.people || []).filter(p => p.ring === 1 || p.ring === 'core');
    if(ints.length || core.length)
      st.people = {interactions: ints.length,
        seen: [...seen].map(id => byId(S.people, id)?.name).filter(Boolean),
        missed: core.filter(p => !seen.has(p.id)).map(p => p.name).slice(0, 6)};
  }
  /* what you wrote */
  {
    const es = (S.entries || []).filter(e => inRange(e.occurredAt));
    if(es.length){
      const by = {}; es.forEach(e => { by[e.type] = (by[e.type] || 0) + 1; });
      st.record = {total: es.length, byType: by,
        writing: typeof writingSecondsOn === 'function'
          ? Math.round(sum(days.map(d => writingSecondsOn(d))) / 60) : 0};
    }
  }
  /* what you read, and what you made of it */
  {
    const media = (S.entries || []).filter(e => e.type === 'media' && inRange(e.occurredAt));
    const quotes = (S.entries || []).filter(e => e.type === 'quote' && inRange(e.occurredAt));
    const pieces = typeof contentPieces === 'function'
      ? contentPieces().filter(e => inRange((e.extra?.content?.publishedAt || '').slice(0, 10))) : [];
    if(media.length || quotes.length || pieces.length)
      st.reading = {media: media.length, quotes: quotes.length, published: pieces.length,
        titles: media.slice(0, 5).map(e => e.title).filter(Boolean)};
  }
  /* the practices — the theatre, the stillness, the log */
  {
    const th = typeof theatreDigest === 'function' ? theatreDigest(from, to) : null;
    const still = typeof stillDigest === 'function' ? stillDigest(from, to) : null;
    const intu = typeof intuitionStats === 'function' ? intuitionStats(from, to) : null;
    if((th && th.days) || (still && still.sessions) || (intu && intu.total))
      st.practice = {theatre: th, stillness: still, intuition: intu};
  }
  /* money */
  {
    const pf = typeof portfolioTotals === 'function' ? portfolioTotals() : null;
    if(pf && pf.totalCurrentBase){
      const rw = typeof runway === 'function' ? runway() : null;
      st.money = {monthly: pf.totalCurrentBase, target: pf.totalTargetBase,
        streams: (pf.streams || []).length, passive: Math.round((pf.passiveShare || 0) * 100),
        runway: rw && rw.months !== Infinity ? +rw.months.toFixed(1) : null, covered: !!rw?.sustainable};
    }
  }
  return st;
}
const reviewHasSection = (snap, key) => !!(snap && snap[key]);

/* ---------- rendering one section of a digest ---------- */
function reviewSectionHTML(key, d){
  const line = (label, val) => val === '' || val == null ? '' : `<div class="rv-stat"><span class="mono">${esc(label)}</span><b>${esc(String(val))}</b></div>`;
  const names = xs => (xs || []).slice(0, 5).join(', ') + ((xs || []).length > 5 ? ` and ${xs.length - 5} more` : '');
  const clock = h => h == null ? null : (typeof wkClock === 'function' ? wkClock(h) : h + 'h');
  if(key === 'sleep') return [
    line('woke, on average', clock(d.wake)),
    line('slept, on average', clock(d.sleep)),
    line('awake each day', d.awake != null ? d.awake.toFixed(1) + ' hours' : null),
    line('longest day', d.longest ? `${d.longest.hours}h on ${fmtDate(d.longest.date, 'short')}` : null),
    line('shortest', d.shortest ? `${d.shortest.hours}h on ${fmtDate(d.shortest.date, 'short')}` : null),
    line('nights recorded', `${d.nights} of ${d.logged}`)].join('');
  if(key === 'energy') return [
    ...d.dims.map(x => line(x.name.toLowerCase(), x.avg + ' of 5')),
    line('set-point', d.setpoint != null ? `${d.setpoint} — ${d.setpointName}` : null),
    line('most often', Object.keys(d.moods).sort((a, b) => d.moods[b] - d.moods[a])[0] || null),
    line('days checked in', d.checkins)].join('');
  if(key === 'habits') return [
    line('kept', d.rate != null ? `${d.rate}% — ${d.kept} of ${d.due}` : null),
    line('strongest', d.best ? `${d.best.name} · ${d.best.rate}%` : null),
    line('weakest', d.worst ? `${d.worst.name} · ${d.worst.rate}%` : null),
    ...(d.slips || []).map(s => line('slipped on', `${s.name} · ${s.slips} time${s.slips === 1 ? '' : 's'}`))].join('');
  if(key === 'tasks') return [
    line('sittings', d.sittings),
    line('time at the clock', typeof fmtEst === 'function' ? fmtEst(d.minutes) : d.minutes + 'm'),
    line('a day', d.perDay + ' minutes'),
    line('longest sitting', typeof fmtEst === 'function' ? fmtEst(d.longest) : d.longest + 'm'),
    line('tasks finished', d.finished)].join('');
  if(key === 'skills') return [
    line('practice logged', d.entries + (d.hours ? ` · ${d.hours} hours` : '')),
    line('worked on', d.touched.length ? names(d.touched) : 'nothing'),
    line('untouched', d.neglected.length ? names(d.neglected) : null)].join('');
  if(key === 'projects') return [
    line('nods', d.nods),
    line('tended', d.tended.length ? d.tended.slice(0, 4).map(x => `${x.name} (${x.n})`).join(', ') : 'none'),
    line('gone quiet', d.dormant.length ? names(d.dormant) : null)].join('');
  if(key === 'values') return [
    line('congruence', d.average != null ? d.average + '%' : null),
    line('readings taken', d.snapshots || null),
    line('lived up to', d.embodied || null),
    line('gone against', d.betrayed || null),
    line('widest gap', d.widest ? `${d.widest.name} — ranked #${d.widest.rank}, ${d.widest.congruence}%` : null)].join('');
  if(key === 'people') return [
    line('times you saw someone', d.interactions),
    line('who', d.seen.length ? names(d.seen) : 'nobody logged'),
    line('not seen', d.missed.length ? names(d.missed) : null)].join('');
  if(key === 'record'){
    const kinds = Object.entries(d.byType).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([t, n]) => `${n} ${typeName(t).toLowerCase()}`).join(', ');
    return [line('entries', d.total), line('what kind', kinds),
      line('time writing', d.writing ? d.writing + ' minutes' : null)].join('');
  }
  if(key === 'reading') return [
    line('read or watched', d.media || null),
    line('quotes kept', d.quotes || null),
    line('pieces published', d.published || null),
    line('titles', d.titles.length ? names(d.titles) : null)].join('');
  if(key === 'practice'){
    const t = d.theatre, s = d.stillness, i = d.intuition;
    return [
      t && t.days ? line('theatre', `${t.days} day${t.days === 1 ? '' : 's'}${t.scenes ? ` · ${t.scenes} scene${t.scenes === 1 ? '' : 's'}` : ''}${t.scripts ? ` · ${t.scripts} script${t.scripts === 1 ? '' : 's'}` : ''}`) : '',
      t && t.vividness ? line('scenes felt', `${t.vividness}/5 vivid, ${t.intensity}/5 strong`) : '',
      s && s.sessions ? line('sat still', `${s.minutes} minutes across ${s.sessions} sitting${s.sessions === 1 ? '' : 's'}`) : '',
      s && s.depth ? line('how deep', `${s.depth}/5`) : '',
      i && i.total ? line('hunches logged', `${i.total}${i.rate != null ? ` · ${i.rate}% right of ${i.judged} checked` : ''}`) : '',
      i && i.bestChannel ? line('strongest channel', i.bestChannel) : ''].join('');
  }
  if(key === 'money') return [
    line('coming in', typeof money === 'function' ? money(d.monthly) + ' a month' : d.monthly),
    line('of target', d.target ? Math.round(d.monthly / d.target * 100) + '%' : null),
    line('passive', d.passive + '%'),
    line('streams', d.streams),
    line('standing', d.covered ? 'covered' : d.runway != null ? `${d.runway} months of runway` : null)].join('');
  return '';
}

/* ---------- making one ---------- */
function openReviewFlow(kind, range){
  migrateReviews();
  let period = kind || S.reviewPrefs.period || 'week';
  let {from, to} = range || reviewRange(period);
  if(!range && !kind) { const r = reviewRange(period); from = r.from; to = r.to; }
  /* Step one only asks when it has not already been answered by a shortcut. */
  if(!range) return openReviewPeriod(period, (k, f, t) => openReviewDigest(k, f, t));
  openReviewDigest(period, from, to);
}
function openReviewPeriod(period, next){
  const m = openModal(`<h2>What are you looking back over?</h2>
    <div class="stack" style="gap:6px">${REVIEW_PERIODS.map(([k, n]) => {
      const r = reviewRange(k);
      return `<button class="choice" data-rp="${k}"><span class="ico">${k === 'custom' ? '⋯' : '◷'}</span>
        <span><b>${esc(n)}</b><div class="d">${k === 'custom' ? 'pick the two ends yourself' : esc(reviewLabel(k, r.from, r.to))}</div></span></button>`;
    }).join('')}</div>
    <div id="rvCustom" hidden style="margin-top:12px">
      <div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-end">
        <div class="field" style="flex:1;min-width:130px"><label>from</label><input type="date" class="inp" id="rvFrom" value="${esc(addDays(today(), -30))}"></div>
        <div class="field" style="flex:1;min-width:130px"><label>to</label><input type="date" class="inp" id="rvTo" value="${esc(today())}"></div>
        <button class="btn primary" id="rvGo">gather it</button></div></div>`, 'narrow');
  m.querySelectorAll('[data-rp]').forEach(b => b.onclick = () => {
    const k = b.dataset.rp;
    if(k === 'custom'){ m.querySelector('#rvCustom').hidden = false;
      m.querySelector('#rvGo').onclick = () => { const f = m.querySelector('#rvFrom').value, t = m.querySelector('#rvTo').value;
        if(!f || !t || f > t){ toast('The two ends are the wrong way round.'); return; }
        m.remove(); next('custom', f, t); };
      return; }
    const r = reviewRange(k); m.remove(); next(k, r.from, r.to);
  });
}
/* Step two: what the house knows, section by section, with somewhere to write
   under each. Sections with nothing in them are not drawn — an empty card is
   a reproach for a week you were not measuring anything. */
function openReviewDigest(period, from, to, existing){
  const snap = existing ? existing.stats : reviewGather(from, to);
  const label = existing ? existing.label : reviewLabel(period, from, to);
  const have = REVIEW_SECTIONS.filter(([k]) => reviewHasSection(snap, k));
  const said = {};
  (existing?.reflections || []).forEach(r => { said[r.key] = r; });
  const m = openModal(`<div class="rv-flow">
    <div class="rv-flow-head">
      <h2>${esc(label)}</h2>
      <div class="mono faint">${esc(fmtDate(from, 'med'))} to ${esc(fmtDate(to, 'med'))} · ${reviewDays(from, to).length} day${reviewDays(from, to).length === 1 ? '' : 's'}${
        have.length ? ` · ${have.length} thing${have.length === 1 ? '' : 's'} the house noticed` : ''}</div>
    </div>
    ${have.length ? '' : '<div class="empty">There is nothing recorded in those days. Pick a stretch you were keeping notes in.</div>'}
    <div class="rv-sections">${have.map(([k, name, col]) => `
      <section class="rv-card" style="--c:${col}">
        <h3>${esc(name)}</h3>
        <div class="rv-stats">${reviewSectionHTML(k, snap[k])}</div>
        <textarea class="inp rv-say" data-rvsay="${k}" rows="2"
          placeholder="Anything to say about that?">${esc(said[k]?.body || '')}</textarea>
        <label class="rv-post"><input type="checkbox" data-rvpost="${k}" ${said[k]?.journalId ? 'checked disabled' : ''}>
          <span>${said[k]?.journalId ? 'kept in the Lived Record' : 'keep this in the Lived Record as'}</span>
          ${said[k]?.journalId ? '' : `<select class="inp sm" data-rvkind="${k}">${REVIEW_JOURNAL_KINDS.map(t =>
            `<option value="${t}">${esc(typeName(t).toLowerCase())}</option>`).join('')}</select>`}</label>
      </section>`).join('')}
      <section class="rv-card overall" style="--c:var(--terra,#b4462f)">
        <h3>Looking at all of it together</h3>
        <textarea class="inp rv-say" id="rvOverall" rows="4"
          placeholder="Not a summary of the numbers — what the period was actually like.">${esc(existing?.overall || '')}</textarea>
        <label class="rv-post"><input type="checkbox" id="rvOverallPost" ${existing?.overallJournalId ? 'checked disabled' : ''}>
          <span>${existing?.overallJournalId ? 'kept in the Lived Record' : 'keep this in the Lived Record as'}</span>
          ${existing?.overallJournalId ? '' : `<select class="inp sm" id="rvOverallKind">${REVIEW_JOURNAL_KINDS.map(t =>
            `<option value="${t}">${esc(typeName(t).toLowerCase())}</option>`).join('')}</select>`}</label>
      </section>
    </div>
    <div class="row" style="justify-content:flex-end;margin-top:16px;gap:8px">
      <button class="btn primary" id="rvSave">${existing ? 'Save the changes' : 'Keep this review'}</button></div>
  </div>`, 'wide');
  m.querySelector('#rvSave').onclick = () => {
    const rec = existing || {id:uid(), period, from, to, label, stats:snap,
      reflections:[], overall:'', overallJournalId:null, createdAt:new Date().toISOString()};
    rec.updatedAt = new Date().toISOString();
    /* per-section reflections */
    have.forEach(([k, name]) => {
      const body = m.querySelector(`[data-rvsay="${k}"]`).value.trim();
      let r = rec.reflections.find(x => x.key === k);
      if(!body && !r) return;
      if(!r){ r = {id:uid(), key:k, body:'', journalId:null, journalType:null}; rec.reflections.push(r); }
      r.body = body;
      const post = m.querySelector(`[data-rvpost="${k}"]`);
      if(post && post.checked && !r.journalId && body)
        reviewCrossPost(rec, r, m.querySelector(`[data-rvkind="${k}"]`)?.value || 'reflection', name);
      else if(r.journalId) reviewSyncJournal(r);
    });
    rec.overall = m.querySelector('#rvOverall').value.trim();
    const op = m.querySelector('#rvOverallPost');
    if(op && op.checked && !rec.overallJournalId && rec.overall){
      const e = reviewMakeEntry(rec, rec.overall, m.querySelector('#rvOverallKind')?.value || 'reflection', 'the whole of it');
      rec.overallJournalId = e.id;
    } else if(rec.overallJournalId){
      const e = byId(S.entries, rec.overallJournalId); if(e) e.body = rec.overall;
    }
    if(!existing) reviewEntries().unshift(rec);
    S.reviewPrefs.period = period;
    saveNow(); sound('success');
    toast(existing ? 'The review is updated.' : 'The review is kept, with the numbers as they were.');
    m.remove(); rerender();
  };
}
/* ---------- the two-home system ---------- */
function reviewMakeEntry(rec, body, type, about){
  const e = {id:uid(), type: type || 'reflection',
    title: `${rec.label} — ${about}`, body,
    occurredAt: rec.to, createdAt:new Date().toISOString(), media:[],
    links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[]},
    people:[], places:[], emotions:[], tags:['review', rec.label], confidence:'',
    extra:{fromReview:rec.id}};
  S.entries.push(e);
  return e;
}
function reviewCrossPost(rec, refl, type, name){
  const e = reviewMakeEntry(rec, refl.body, type, (name || '').toLowerCase());
  refl.journalId = e.id; refl.journalType = e.type;
  return e;
}
/* the two copies are one text: whichever end is edited, the other follows */
function reviewSyncJournal(refl){
  if(!refl.journalId) return;
  const e = byId(S.entries, refl.journalId);
  if(!e){ refl.journalId = null; refl.journalType = null; return; }   /* the entry was deleted; the writing stays */
  e.body = refl.body;
}
/* and back the other way, when the journal entry is the one that was edited */
function reviewSyncFromJournal(entryId){
  const e = byId(S.entries, entryId); if(!e?.extra?.fromReview) return;
  const rec = reviewEntries().find(r => r.id === e.extra.fromReview); if(!rec) return;
  if(rec.overallJournalId === entryId){ rec.overall = e.body; return; }
  const r = rec.reflections.find(x => x.journalId === entryId);
  if(r) r.body = e.body;
}
const reviewOf = id => reviewEntries().find(r => r.id === id) || null;
function deleteReview(rec, node, after){
  requestDelete({label: rec.label, node, after, remove: () => spliceOut(reviewEntries(), x => x.id === rec.id)});
}

/* ---------- the list ---------- */
function reviewCardHTML(rec){
  const s = rec.stats || {};
  const bits = [
    s.habits?.rate != null ? `${s.habits.rate}% of habits` : '',
    s.sleep?.awake != null ? `${s.sleep.awake}h awake` : '',
    s.tasks?.minutes ? `${typeof fmtEst === 'function' ? fmtEst(s.tasks.minutes) : s.tasks.minutes + 'm'} at the clock` : '',
    s.projects?.nods ? `${s.projects.nods} nods` : '',
    s.record?.total ? `${s.record.total} entries` : '',
  ].filter(Boolean).slice(0, 4).join('  ·  ');
  const said = rec.overall || (rec.reflections || []).find(r => r.body)?.body || '';
  const kind = (REVIEW_PERIODS.find(p => p[0] === rec.period) || [,rec.period])[1];
  return `<details class="rv-entry" data-rvid="${rec.id}">
    <summary><span class="rv-kind mono">${esc(kind)}</span><b class="serif">${esc(rec.label)}</b>
      <span class="mono faint">${esc(fmtDate((rec.createdAt || '').slice(0, 10), 'short'))}</span></summary>
    <div class="rv-body">
      ${bits ? `<div class="mono faint rv-strip">${esc(bits)}</div>` : ''}
      ${said ? `<p class="rv-said">${esc(said.slice(0, 400))}${said.length > 400 ? '…' : ''}</p>` : ''}
      ${(rec.reflections || []).filter(r => r.body).map(r => {
        const name = (REVIEW_SECTIONS.find(x => x[0] === r.key) || [,r.key])[1];
        return `<div class="rv-refl"><span class="mono">${esc(name)}</span><p>${esc(r.body)}</p>
          ${r.journalId ? `<button class="rv-link mono" data-rvopen="${r.journalId}">also in the Lived Record →</button>` : ''}</div>`;
      }).join('')}
      <div class="row" style="gap:8px;margin-top:10px">
        <button class="btn sm" data-rvedit="${rec.id}">open it again</button>
        <button class="btn sm ghost" data-rvdel="${rec.id}">delete</button></div>
    </div></details>`;
}
function reviewNudge(){
  if(!S.reviewPrefs?.nudges) return '';
  const weekly = reviewEntries().filter(r => r.period === 'week');
  if(weekly.length < 2) return '';
  const last = weekly[0];
  const gap = daysSince((last.createdAt || '').slice(0, 10));
  if(gap < 10) return '';
  return `<p class="rv-nudge">It has been ${gap} days since the last weekly review.</p>`;
}
function reviewListHTML(){
  migrateReviews();
  const f = S._rvFilter || 'all';
  let list = reviewEntries().slice();
  if(f !== 'all') list = list.filter(r => r.period === f);
  const kinds = [...new Set(reviewEntries().map(r => r.period))];
  return `<section class="section rv rv-list">
    <div class="row between" style="align-items:baseline;flex-wrap:wrap;gap:8px">
      <span class="sc" style="margin:0">Reviews</span>
      <span class="mono faint">${reviewEntries().length || 'none'} kept</span></div>
    ${reviewNudge()}
    <div class="row" style="gap:6px;flex-wrap:wrap;margin:10px 0">
      <button class="btn sm primary" id="rvNew">＋ a review</button>
      <span class="mono faint" style="align-self:center">or look back over</span>
      ${[['day','yesterday'], ['week','this week'], ['month','this month']].map(([k, n]) =>
        `<button class="btn sm ghost" data-rvquick="${k}">${n}</button>`).join('')}
    </div>
    ${kinds.length > 1 ? `<div class="row" style="gap:5px;flex-wrap:wrap;margin-bottom:8px">
      <button class="chip ${f === 'all' ? 'on' : ''}" data-rvfilter="all">all</button>
      ${kinds.map(k => `<button class="chip ${f === k ? 'on' : ''}" data-rvfilter="${k}">${
        esc((REVIEW_PERIODS.find(p => p[0] === k) || [,k])[1].toLowerCase())}</button>`).join('')}</div>` : ''}
    ${list.length ? list.map(reviewCardHTML).join('')
      : `<div class="empty">No reviews yet. A review gathers what the house already knows about a stretch of days and shows it to you before it asks you anything.</div>`}
  </section>`;
}
function bindReviewList(root){
  const q = x => root.querySelector(x);
  if(q('#rvNew')) q('#rvNew').onclick = () => openReviewFlow();
  root.querySelectorAll('[data-rvquick]').forEach(b => b.onclick = () => {
    const k = b.dataset.rvquick;
    const r = k === 'day' ? {from: addDays(today(), -1), to: addDays(today(), -1)} : reviewRange(k);
    openReviewDigest(k, r.from, r.to);
  });
  root.querySelectorAll('[data-rvfilter]').forEach(b => b.onclick = () => { S._rvFilter = b.dataset.rvfilter; rerender(); });
  root.querySelectorAll('[data-rvedit]').forEach(b => b.onclick = ev => { ev.preventDefault();
    const rec = reviewOf(b.dataset.rvedit); if(rec) openReviewDigest(rec.period, rec.from, rec.to, rec); });
  root.querySelectorAll('[data-rvdel]').forEach(b => b.onclick = ev => { ev.preventDefault();
    const rec = reviewOf(b.dataset.rvdel); if(rec) deleteReview(rec, b.closest('.rv-entry'), () => rerender()); });
  root.querySelectorAll('[data-rvopen]').forEach(b => b.onclick = ev => { ev.preventDefault();
    const e = byId(S.entries, b.dataset.rvopen); if(!e) return;
    navigate('#/journals/' + e.type);
    setTimeout(() => { const n = document.querySelector(`[data-entry="${e.id}"]`);
      if(n){ n.scrollIntoView({block:'center'}); n.classList.add('flash'); setTimeout(() => n.classList.remove('flash'), 1600); } }, 400);
  });
}
