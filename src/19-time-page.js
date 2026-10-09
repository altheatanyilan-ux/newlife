/* ============================================================
   WHERE THE TIME WENT — the room.

   Three views of the same rows. The day is a bar from midnight to midnight
   with the tracked stretches coloured in, because the thing you want to see
   first is not a total but a shape: where the gaps are, how late the evening
   started, how much of the afternoon is simply missing. The week is seven of
   those bars stacked, which turns "I keep meaning to practise" into a picture
   of the four days you did not. The reports are for the question the other
   two cannot answer — how much of this month went on one particular thing.

   The untracked hours are drawn rather than hidden. A dashboard that shows
   only what you logged always says you had a productive day; the empty parts
   of the bar are the honest half of the picture.
   ============================================================ */
function timeUi(){
  return S._time = S._time || {view:'day', day:null, span:30, cat:null, tag:null, link:null};
}
const timeDay = () => { const u = timeUi(); return u.day || today(); };

routes.time = function(root, params){
  timeState();
  const u = timeViewState();
  const want = params && params[0];
  /* the older addresses name a period: they open the overview on it */
  if(['day', 'week'].includes(want)){ u.view = 'overview'; u.unit = want; u.narrow = null; }
  else if(want === 'reports'){ u.view = 'overview'; u.unit = 'month'; }
  else if(want === 'categories') u.view = 'categories';
  else if(want === 'goals') u.view = 'goals';
  else if(want === 'overview') u.view = 'overview';
  if(!['overview', 'categories', 'goals'].includes(u.view)) u.view = 'overview';
  registerPageEntry({pageName:'Time tracking', addLabel:'Log a sitting', defaultEntryType:'time',
    prefilledFields:{}, options:[
      {icon:'⏱', label:'Start the clock', desc:'Now, for whatever you are about to do.',
        run:()=>openTimeStartModal()},
      {icon:'✎', label:'A sitting, after the fact', desc:'Two hours of reading you forgot to time.',
        run:()=>openTimeEntryModal(null, timeDay())}]});
  try { timeProcessWins(); } catch(e){ console.warn('process wins were not worked out', e); }
  root.innerHTML = `<div class="page tm-page">
    <div class="tm-head">
      <h1 class="serif">Time tracking</h1>
      <span class="grow"></span>
      <span class="tabs sm">${[['overview','Overview'],['goals','Intentions & goals'],['categories','Categories']].map(([k, n]) =>
        `<button class="tab${u.view === k ? ' on' : ''}" data-tmview="${k}">${n}</button>`).join('')}</span>
    </div>
    ${u.view === 'categories' ? timeCategoriesHTML() : u.view === 'goals' ? timeGoalsHTML() : timeOverviewHTML()}
  </div>`;
  bindTimePage(root);
  if(u.view === 'overview') bindTimeOverview(root);
  if(u.view === 'goals') bindTimeGoals(root);
};

/* ---------- the day ---------- */
function timeDayHTML(o = {}){
  const day = o.day || timeDay(), narrow = o.narrow || null;
  const rows = timeOnDay(day).filter(e => timeNarrowMatch(e, narrow)).sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
  const mins = sum(rows.map(e => timeMinutes(e)));
  const by = timeByCategory(rows);
  /* Last night's sleep, and separately the part of it that fell inside this
     calendar day. The first is the number anybody wants; the second is what
     the untracked line has to subtract to mean the waking hours. */
  const night = timeSleepNight(day);
  const asleep = timeSleepInDay(day);
  return `${o.embedded ? '' : `<div class="tm-bar-h">
      <button class="tbtn" data-tmday="-1">‹ day before</button>
      <span class="mono">${esc(fmtDate(day, 'med'))}</span>
      <button class="tbtn" data-tmday="1" ${day >= today() ? 'disabled' : ''}>day after ›</button>
      <span class="grow"></span>
      <span class="mono">${timeSaid(mins)} tracked</span>
      <button class="btn sm primary" id="tmAdd">+ a sitting</button>
    </div>`}
    ${timeStripHTML(timeOnCalendarDay(day).filter(e => timeNarrowMatch(e, narrow)), day)}
    ${!narrow && typeof pbdPlanVsActualHTML === 'function' ? pbdPlanVsActualHTML(day) : ''}
    ${rows.length ? `<div class="tm-list">${rows.map(timeRowHTML).join('')}</div>`
      : `<div class="empty">Nothing tracked on this day. Start the clock in the corner, or write
        down a sitting you did not time.</div>`}
    ${by.length || (!narrow && (asleep || night)) ? `<div class="tm-sum">${timeSumHTML(by, narrow ? 0 : 1440, narrow ? null : day)}</div>` : ''}`;
}
/* Midnight to midnight, in proportion. A sitting that runs past midnight is
   clipped to the day it is being drawn for rather than allowed to run off the
   end, because the hours after midnight belong to the next bar. */
function timeStripHTML(rows, day){
  const seg = e => {
    const a = new Date(e.startTime);
    const from = Math.max(0, a.getHours() * 60 + a.getMinutes());
    const to = Math.min(1440, from + timeMinutes(e));
    return {from, to, e};
  };
  const parts = rows.map(seg).filter(s => s.to > s.from);
  const marks = [0, 6, 12, 18, 24];
  /* drawn first and underneath: sleep is the ground the day sits on, and a
     sitting that overlaps it — a nap logged by hand, a bedtime typed wrong —
     should be the thing you can see, not the thing hidden behind it */
  const said = timeSleepSaidOn(day);
  return `<div class="tm-strip" role="img" aria-label="the day, midnight to midnight">
    ${timeSleepBlocks(day).map(b =>
      `<i class="tm-seg tm-sleepseg" style="left:${(b.from / 14.4).toFixed(2)}%;width:${
        ((b.to - b.from) / 14.4).toFixed(2)}%" title="asleep${said ? ` \u2014 ${esc(said)}` : ''}"></i>`).join('')}
    ${parts.map(({from, to, e}) => { const c = timeCategory(e.categoryId);
      return `<i class="tm-seg" data-tmgo="${esc(e.id)}" style="left:${(from / 14.4).toFixed(2)}%;width:${
        ((to - from) / 14.4).toFixed(2)}%;--c:${esc(c.color)}"
        title="${esc(c.emoji)} ${esc(e.what || c.name)} · ${esc(timeClockOf(e.startTime))}–${
        e.endTime ? esc(timeClockOf(e.endTime)) : 'now'}"></i>`; }).join('')}
  </div>
  <div class="tm-ticks mono">${marks.map(h =>
    `<span style="left:${(h / 24 * 100).toFixed(2)}%">${h === 24 ? '24' : String(h).padStart(2, '0')}</span>`).join('')}</div>`;
}
/* the reading on a stretch, once it is over: said once, in the words of what
   it was; nothing is asked of a stretch that was never read except a quiet
   offer, and a skipped one is simply left */
function timeVerdictHTML(e){
  if(!e.endTime || e.kind === undefined) return '';
  const kindTag = e.kind !== 'work' ? `<span class="tm-kind mono sm">${esc(TIME_KIND_NAMES[e.kind] || e.kind)}${e.overrun ? ' · ran over' : ''}</span> ` : '';
  if(e.verdict) return `<div class="tm-verdict sm">${kindTag}<span class="tm-v tm-v-${esc(e.verdict)}">${esc(TIME_VERDICT_WORDS[e.verdict])}</span></div>`;
  if(!e.focusSit) return kindTag ? `<div class="tm-verdict sm">${kindTag}</div>` : '';
  return `<div class="tm-verdict sm">${kindTag}<span class="faint">${esc(TIME_VERDICT_ASK[e.kind] || TIME_VERDICT_ASK.work)}</span>
    ${TIME_VERDICTS.map(v => `<button type="button" class="chip tf-chip" data-tmverdict="${esc(e.id)}|${v}">${esc(TIME_VERDICT_WORDS[v])}</button>`).join('')}</div>`;
}
function timeRowHTML(e){
  const c = timeCategory(e.categoryId);
  return `<div class="tm-row" style="--c:${esc(c.color)}" data-tmrow="${esc(e.id)}">
    <span class="tm-emoji" aria-hidden="true">${esc(c.emoji)}</span>
    <div class="tm-body">
      <div class="tm-what">${esc(e.what || c.name)}${
        e.linkedLabel ? ` <span class="faint">· ${esc(e.linkedLabel)}</span>` : ''}</div>
      <div class="mono faint sm">${esc(timeClockOf(e.startTime))}–${
        e.endTime ? esc(timeClockOf(e.endTime)) : '…'}${
        e.tags.length ? ` · ${esc(e.tags.join(', '))}` : ''}${
        e.source === 'auto' ? ' · started by the room' : ''}</div>
      ${e.notes.length ? `<div class="tm-notes">${e.notes.map(n =>
        `<span class="mono sm">${esc(timeClockOf(n.at))}</span> ${esc(n.text)}`).join('<br>')}</div>` : ''}
      ${timeVerdictHTML(e)}
      ${timeWrittenHTML(e)}
    </div>
    <span class="mono tm-mins">${e.endTime ? timeSaid(timeMinutes(e)) : 'running'}</span>
    ${timeWritePickHTML(e.id)}
    <button class="tbtn" data-tmedit="${esc(e.id)}" title="change it">✎</button>
  </div>`;
}
function timeByCategory(rows){
  const by = {};
  rows.forEach(e => { const k = e.categoryId || '';
    by[k] = (by[k] || 0) + timeMinutes(e); });
  return Object.keys(by).map(k => ({cat: timeCategory(k || null), minutes: by[k]}))
    .sort((a, b) => b.minutes - a.minutes);
}
/* The bars, and the hours nobody accounted for beside them. The untracked
   line is the point: without it every day looks full. */
function timeSumHTML(by, whole, day){
  /* Sleep is a bar like the others, and it is not tracked time: it is read
     off the wake and bed times on Today. Counting it makes the untracked
     line mean what it says — the waking hours nobody accounted for — rather
     than counting eight hours of being asleep as time you lost.

     The number on the row is LAST NIGHT, from the bedtime you wrote to the
     waking you wrote; the number the untracked line subtracts is the part of
     that which fell inside this calendar day. Those differ by however much
     of the night was before midnight, and adding the two fragments of two
     different nights together — which is what this did — gives a figure that
     belongs to no night at all. */
  const night = day ? timeSleepNight(day) : null;
  const inDay = day ? timeSleepInDay(day) : 0;
  const asleep = night ? night.minutes : 0;
  const top = Math.max(1, asleep, ...by.map(b => b.minutes));
  const tracked = sum(by.map(b => b.minutes));
  const clock = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.round(m) % 60).padStart(2, '0')}`;
  const said = night ? `${clock(night.from)} \u2192 ${clock(night.to)}` : (day ? timeSleepSaidOn(day) : '');
  return `${by.map(b => `<div class="tm-sumrow" style="--c:${esc(b.cat.color)}">
      <span class="tm-sumn">${esc(b.cat.emoji)} ${esc(b.cat.name)}</span>
      <span class="tm-sumbar"><i style="width:${(100 * b.minutes / top).toFixed(1)}%"></i></span>
      <span class="mono">${timeSaid(b.minutes)}</span>
    </div>`).join('')}
    ${asleep ? `<div class="tm-sumrow tm-sleeprow" style="--c:${esc(TIME_SLEEP_CAT.color)}">
      <span class="tm-sumn">${TIME_SLEEP_CAT.emoji} ${esc(TIME_SLEEP_CAT.name)}
        <a class="faint sm" href="#/today" title="wake and bed times are written on Today">last night, ${
          said ? esc(said) : 'from Today'}</a></span>
      <span class="tm-sumbar"><i style="width:${(100 * asleep / top).toFixed(1)}%"></i></span>
      <span class="mono">${timeSaid(asleep)}</span>
    </div>` : day && !timeSleepKnown(day) ? `<div class="tm-sumrow faint tm-sleeprow">
      <span class="tm-sumn">${TIME_SLEEP_CAT.emoji} Sleep
        <a class="faint sm" href="#/today">no wake or bed time written down for this day</a></span>
      <span class="tm-sumbar"></span><span class="mono">\u2014</span>
    </div>` : ''}
    ${whole ? `<div class="tm-sumrow faint">
      <span class="tm-sumn">untracked${inDay ? ', awake' : ''}${
        inDay && night && inDay !== night.minutes
          ? `<em class="faint sm" style="display:block;font-style:normal">${timeSaid(inDay)} of the night fell inside today</em>` : ''}</span>
      <span class="tm-sumbar"></span>
      <span class="mono">~${timeSaid(Math.max(0, whole - tracked - inDay))}</span>
    </div>` : ''}`;
}

/* ---------- the week ---------- */
function timeWeekHTML(o = {}){
  const narrow = o.narrow || null;
  const end = timeDay();
  const days = o.days || Array.from({length:7}, (_, i) => {
    const d = parseDay(end); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10) === '' ? end : timeDayOf(d.toISOString());
  });
  const rows = days.map(d => ({day: d, entries: timeOnDay(d).filter(e => timeNarrowMatch(e, narrow))}));
  const all = rows.flatMap(r => r.entries);
  const mins = sum(all.map(e => timeMinutes(e)));
  const by = timeByCategory(all);
  /* averaged over the nights you actually wrote down rather than over seven,
     because dividing by seven turns three recorded nights into a figure that
     says you sleep three hours */
  const slept = days.reduce((a, d) => { const m = timeSleepMinutes(d);
    return m ? {mins: a.mins + m, nights: a.nights + 1} : a; }, {mins:0, nights:0});
  return `${o.embedded ? '' : `<div class="tm-bar-h">
      <button class="tbtn" data-tmday="-7">‹ week before</button>
      <span class="mono">${esc(fmtDate(days[0], 'med'))} – ${esc(fmtDate(days[6], 'med'))}</span>
      <button class="tbtn" data-tmday="7" ${end >= today() ? 'disabled' : ''}>week after ›</button>
      <span class="grow"></span>
      <span class="mono">${timeSaid(mins)} in the week</span>
    </div>`}
    <div class="tm-week">${rows.map(r => `<div class="tm-wday">
      <button class="tbtn mono tm-wname" data-tmpick="${esc(r.day)}">${esc(fmtDate(r.day, 'short'))}</button>
      <div class="tm-wstrip">${timeStripHTML(r.entries, r.day)}</div>
      <span class="mono faint">${r.entries.length ? timeSaid(sum(r.entries.map(timeMinutes))) : '—'}</span>
    </div>`).join('')}</div>
    ${by.length ? `<div class="tm-sum">${timeSumHTML(by, 0)}
      <p class="faint sm">${timeSaid(mins / days.length)} a day on average${
        by[0] ? `, most of it on ${esc(by[0].cat.name.toLowerCase())}` : ''}.${slept.nights
          ? ` ${TIME_SLEEP_CAT.emoji} ${timeSaid(slept.mins / slept.nights)} asleep a night across ${
            slept.nights} night${slept.nights === 1 ? '' : 's'} you wrote down.` : ''}</p></div>`
      : '<div class="empty">Nothing tracked this week.</div>'}`;
}

function bindTimePage(root){
  const u = timeUi();
  $$('[data-tmview]', root).forEach(b => b.onclick = () => navigate(`#/time/${b.dataset.tmview}`));
  $$('[data-tmday]', root).forEach(b => b.onclick = () => {
    const d = parseDay(timeDay()); d.setDate(d.getDate() + (+b.dataset.tmday));
    const next = timeDayOf(d.toISOString());
    u.day = next > today() ? today() : next;
    saveNow(); rerender();
  });
  $$('[data-tmpick]', root).forEach(b => b.onclick = () => {
    u.day = b.dataset.tmpick; u.unit = 'day'; u.view = 'overview'; saveNow(); navigate('#/time/day'); });
  $$('[data-tmedit]', root).forEach(b => b.onclick = ev => { ev.stopPropagation();
    openTimeEntryModal(b.dataset.tmedit); });
  $$('[data-tmgo]', root).forEach(b => b.onclick = () => openTimeEntryModal(b.dataset.tmgo));
  $$('[data-tmverdict]', root).forEach(b => b.onclick = ev => { ev.stopPropagation();
    const [id, v] = b.dataset.tmverdict.split('|'); if(timeSetVerdict(id, v)){ sound('click'); rerender(); } });
  bindTimeWrite(root);
  const add = root.querySelector('#tmAdd');
  if(add) add.onclick = () => openTimeEntryModal(null, timeDay());
  bindTimeCategories(root);
}

/* ---------- the categories, which are yours ----------
   Sixteen of them ship with the app and none of them is fixed. A time tracker
   whose categories somebody else chose is one you fight with for a week and
   then stop using, because the one distinction that actually matters in your
   life is never in the list.

   Everything is edited in place, on the row: the emoji, the name and the
   colour are the three things that make a bar chart readable and they are
   three fields, not three modals. The order is the order everything is drawn
   in, so it is worth being able to put the four you really use at the top.

   Two things are deliberately different from each other. Putting a category
   away takes it out of every picker and leaves the months of entries under it
   still named — which is what you want for the thing you did last year and
   have stopped doing. Throwing it out removes it for good, and asks first
   where its entries should go, because the alternative is a year of Tuesdays
   that nothing can name. */
function timeCategoriesHTML(){
  const list = timeAllCategories();
  const st = timeSettings();
  const off = list.filter(c => c.off).length;
  return `<section class="section rv tm-cats">
    <div class="row between" style="align-items:baseline">
      <span class="sc" style="margin:0">Categories</span>
      <span class="mono faint">${list.length} · ${off ? `${off} put away` : 'all in use'}</span></div>
    <p class="muted" style="font-size:.85rem">The whole list is yours. Rename any of them, change the colour they
      are drawn in, put the ones you have stopped using away, or throw them out. Nothing here is the app’s.</p>
    <p class="muted" style="font-size:.85rem">Under each: its <b>kind</b> — investing, maintaining, restoring or drift — which the Overview adds up as shares (the
      app starts you with a guess; change it), a category it sits <b>inside</b> (its time rolls up under that one), and a
      <b>value</b> it serves when nothing more specific says so.</p>
    <div class="tm-catrows">
      <div class="tm-cathead mono">
        <span></span><span>name</span><span>colour</span><span>used</span><span>order</span><span></span><span></span></div>
      ${list.map((c, i) => {
        const used = timeCategoryUsed(c.id);
        const fed = TIME_FED_BY_ROOM[c.id];
        return `<div class="tm-catrow${c.off ? ' off' : ''}" style="--c:${esc(c.color)}" data-tmcatrow="${esc(c.id)}">
          <input class="inp tm-catemoji" data-tmcatf="emoji" data-tmcat="${esc(c.id)}"
            value="${esc(c.emoji)}" maxlength="8" aria-label="the mark for ${esc(c.name)}">
          <span class="tm-catname">
            <input class="inp" data-tmcatf="name" data-tmcat="${esc(c.id)}" value="${esc(c.name)}" maxlength="40">
            ${fed ? `<em class="faint sm">started by ${esc(fed)}</em>` : ''}</span>
          <input class="tm-catcolor" type="color" data-tmcatf="color" data-tmcat="${esc(c.id)}"
            value="${esc(/^#[0-9a-fA-F]{6}$/.test(c.color) ? c.color : '#8a8d8f')}"
            aria-label="the colour for ${esc(c.name)}">
          <span class="mono faint">${used ? `${used} sitting${used === 1 ? '' : 's'}` : '—'}</span>
          <span class="tm-catmove">
            <button class="tbtn" data-tmcatup="${esc(c.id)}" ${i ? '' : 'disabled'} title="up">↑</button>
            <button class="tbtn" data-tmcatdown="${esc(c.id)}"
              ${i === list.length - 1 ? 'disabled' : ''} title="down">↓</button></span>
          <button class="tbtn" data-tmcatoff="${esc(c.id)}"
            title="${c.off ? 'put it back in the pickers' : 'take it out of the pickers, keeping what is already filed under it'}"
            >${c.off ? 'put back' : 'put away'}</button>
          <button class="del-x inline" data-tmcatdel="${esc(c.id)}" title="throw it out for good">×</button>
          <div class="tm-catmore">
            <label class="pd-q"><span class="k">kind</span><select class="sel sm" data-tmcatf="kind" data-tmcat="${esc(c.id)}"
              title="what this time does for the life it comes out of">
              <option value="">unsorted</option>${TIME_CAT_KINDS.map(k => `<option value="${k}" ${c.kind === k ? 'selected' : ''}>${esc(TIME_CAT_KIND_WORDS[k])}</option>`).join('')}</select></label>
            <label class="pd-q"><span class="k">inside</span><select class="sel sm" data-tmcatf="parentId" data-tmcat="${esc(c.id)}">
              <option value="">— nothing —</option>${timeCatParentOptions(c.id).map(v => `<option value="${esc(v.id)}" ${c.parentId === v.id ? 'selected' : ''}>${esc(v.emoji)} ${esc(v.name)}</option>`).join('')}</select></label>
            <label class="pd-q"><span class="k">zone of genius</span><select class="sel sm" data-tmcatf="zog" data-tmcat="${esc(c.id)}"
              title="time in this category counts towards the zone-of-genius hour"><option value="">no</option><option value="yes" ${c.zog ? 'selected' : ''}>yes \u2014 this is zone-of-genius work</option></select></label>
            <label class="pd-q"><span class="k">serves</span><select class="sel sm" data-tmcatf="valueId" data-tmcat="${esc(c.id)}"
              title="when nothing else says which value a stretch serves, this does">
              <option value="">— no value —</option>${(S.values || []).map(v => `<option value="${esc(v.id)}" ${c.valueId === v.id ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select></label>
          </div>
        </div>`; }).join('')}
    </div>
    <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap">
      <button class="btn sm primary" id="tmCatAdd">＋ a category</button>
      <label class="pd-q" style="flex:0 0 16rem;margin:0"><span class="k">what a new sitting starts as</span>
        <select class="sel sm" id="tmCatDefault"><option value="">nothing — ask me</option>${
          timeCategories().map(c => `<option value="${esc(c.id)}" ${st.defaultCategory === c.id ? 'selected' : ''}
            >${esc(c.emoji)} ${esc(c.name)}</option>`).join('')}</select></label>
      <span class="grow"></span>
      <button class="btn sm ghost" id="tmCatReset">Start again from the shipped list</button>
    </div>
  </section>`;
}
function bindTimeCategories(root){
  const redraw = () => { saveNow(); rerender(); };
  /* typed rather than pressed: a name being edited must not take the caret
     away every keystroke, so the field writes straight through and the page
     is only rebuilt when the field is left */
  $$('[data-tmcatf]', root).forEach(n => {
    const write = () => { const c = timeCategory(n.dataset.tmcat);
      if(!c || !c.id) return;
      const v = n.value;
      if(n.dataset.tmcatf === 'kind') c.kind = TIME_CAT_KINDS.includes(v) ? v : null;
      else if(n.dataset.tmcatf === 'parentId') c.parentId = v && v !== c.id ? v : null;
      else if(n.dataset.tmcatf === 'valueId') c.valueId = v || null;
      else if(n.dataset.tmcatf === 'zog') c.zog = v === 'yes';
      else if(n.dataset.tmcatf === 'name') c.name = v.trim().slice(0, 40) || c.name;
      else if(n.dataset.tmcatf === 'emoji') c.emoji = v.trim().slice(0, 8) || c.emoji;
      else if(/^#[0-9a-fA-F]{3,8}$/.test(v)) c.color = v;
      saveNow(); };
    n.oninput = write;
    n.onchange = () => { write(); rerender(); };
  });
  $$('[data-tmcatup]', root).forEach(b => b.onclick = () => {
    if(timeMoveCategory(b.dataset.tmcatup, -1)) redraw(); });
  $$('[data-tmcatdown]', root).forEach(b => b.onclick = () => {
    if(timeMoveCategory(b.dataset.tmcatdown, 1)) redraw(); });
  $$('[data-tmcatoff]', root).forEach(b => b.onclick = () => {
    const c = timeCategory(b.dataset.tmcatoff); if(!c || !c.id) return;
    c.off = !c.off;
    toast(c.off ? `${c.name} is put away — what is already filed under it keeps its name.`
      : `${c.name} is back.`);
    redraw(); });
  $$('[data-tmcatdel]', root).forEach(b => b.onclick = () => openTimeCategoryDelete(b.dataset.tmcatdel));
  const add = root.querySelector('#tmCatAdd');
  if(add) add.onclick = () => { const c = timeAddCategory(); saveNow(); rerender();
    const n = document.querySelector(`[data-tmcat="${c.id}"][data-tmcatf="name"]`);
    if(n){ n.focus(); n.select(); } };
  const def = root.querySelector('#tmCatDefault');
  if(def) def.onchange = () => { timeSettings().defaultCategory = def.value || null; redraw(); };
  const reset = root.querySelector('#tmCatReset');
  if(reset) reset.onclick = () => {
    if(!confirm('Put the sixteen the app ships with back as they were? Anything you added stays, and no entry changes what it is filed under.')) return;
    timeResetCategories(); toast('Back to the shipped list.'); redraw(); };
}
/* Throwing one out asks where its past goes first, because the alternative is
   a year of entries nothing can name. */
function openTimeCategoryDelete(id){
  const c = timeCategory(id);
  if(!c || !c.id) return null;
  const used = timeCategoryUsed(id);
  const others = timeAllCategories().filter(v => v.id !== id);
  const m = openModal(`<h2>\u{1F5D1} ${esc(c.emoji)} ${esc(c.name)}</h2>
    ${used ? `<p>There ${used === 1 ? 'is' : 'are'} <b>${used}</b> sitting${used === 1 ? '' : 's'}
        filed under this. Throwing it out does not throw them away — say where they go.</p>
      <label class="pd-q"><span class="k">move them to</span>
        <select class="sel" id="tcMove"><option value="">nothing — leave them untagged</option>${
          others.map(v => `<option value="${esc(v.id)}">${esc(v.emoji)} ${esc(v.name)}</option>`).join('')}</select></label>
      <p class="faint sm">Putting it away instead keeps the name on all ${used} of them and only stops it being offered for anything new.</p>`
      : '<p>Nothing is filed under this one, so there is nothing to move.</p>'}
    <div class="row" style="justify-content:flex-end;margin-top:14px;gap:8px">
      <button class="btn sm ghost" id="tcCancel">Keep it</button>
      <button class="btn danger" id="tcGo">Throw it out</button></div>`);
  m.querySelector('#tcCancel').onclick = () => m.remove();
  m.querySelector('#tcGo').onclick = () => {
    const to = m.querySelector('#tcMove');
    const moved = timeRemoveCategory(id, to ? (to.value || null) : null);
    m.remove(); saveNow(); sound('click');
    toast(moved ? `${c.name} is gone; ${moved} sitting${moved === 1 ? '' : 's'} moved.` : `${c.name} is gone.`);
    rerender();
  };
  return m;
}
