/* ============================================================
   RIGHT NOW — the one thing, for this stretch of time

   A plan that says "finish these by Friday" asks a promise the future may
   not let you keep. What can be promised is attention: *for this stretch, the
   only thing I give myself to is this.* So the plan here is stretches of
   time, each with a single focus — a week, a fortnight, a month, planned as far
   ahead as you like — and nothing about whether the work will be done.

   Where it comes from. Two places, one answer:
     the focus plan   dated stretches you set here, any length, any distance
                      ahead (S.focusPlan.periods): {from, to, [fromTime, toTime],
                      focus, why, notNow[]}
     the week's stages the stages of a week plan (weekly plan → "the week in
                      stages"), when a stage has a focus
   Where two stretches cover today the shorter wins (the more specific);
   a dated stretch beats a week's stage. What is "right now" is read each time,
   never stored.

   How it reminds. A slim strip at the top of every page says it ("right now ·
   the Ravel · until Fri 25 Oct · stage 2 of 3"); the first open of each day (and
   whenever a new stretch begins) a short card says it back and asks you to say it
   to yourself; Today has it large, with what can wait; and while the house is
   open, now and then, one quiet line leans in. Each of those can be turned
   down in Settings → Right now.
   ============================================================ */
const FP_COLORS = ['#b08968', '#7f916a', '#a0727e', '#6b7d9c', '#d4a44c', '#8a6f9e', '#c47832', '#4a8f8a'];
let _fpCollapsed = false, _fpLastWhisper = Date.now(), _fpMomentShown = false;
function fpState(){
  const f = S.focusPlan = S.focusPlan && typeof S.focusPlan === 'object' ? S.focusPlan : {};
  f.periods = Array.isArray(f.periods) ? f.periods : [];
  f.ack = typeof f.ack === 'string' ? f.ack : '';
  f.prefs = Object.assign({strip: true, moment: 'daily', remind: 45}, f.prefs && typeof f.prefs === 'object' ? f.prefs : {});
  f.periods.forEach(p => { p.id = p.id || uid(); p.focus = String(p.focus || ''); p.why = String(p.why || ''); p.notNow = Array.isArray(p.notNow) ? p.notNow : []; p.fromTime = p.fromTime || ''; p.toTime = p.toTime || ''; });
  return f;
}
const fpColorOf = id => FP_COLORS[[...String(id)].reduce((n, c) => n + c.charCodeAt(0), 0) % FP_COLORS.length];
const fpHM = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const fpSpan = p => Math.round((Date.parse(p.to) - Date.parse(p.from)) / 864e5) + 1;
const fpOn = (p, day, hm) => !!p.from && !!p.to && p.from <= day && day <= p.to && (!p.fromTime || !p.toTime || (hm >= p.fromTime && hm < p.toTime));
function fpUntil(p){
  const T = today(), w = p.fromTime && p.toTime ? ` · ${p.fromTime}–${p.toTime}` : '';
  const when = p.to === T ? 'until tonight' : p.to === addDays(T, 1) ? 'until tomorrow' : 'until ' + fmtDate(p.to, 'short');
  return when + w;
}
/* what the stretch is, wherever it came from */
function fpNow(){
  const T = today(), hm = fpHM(), f = fpState();
  const act = f.periods.filter(p => p.focus.trim() && fpOn(p, T, hm)).sort((a, b) => fpSpan(a) - fpSpan(b) || b.from.localeCompare(a.from));
  if(act[0]){ const p = act[0], all = f.periods.filter(x => x.focus.trim()).sort((a, b) => a.from.localeCompare(b.from)), k = all.indexOf(p);
    return {id: 'p:' + p.id, source: 'plan', focus: p.focus.trim(), why: p.why, notNow: p.notNow, from: p.from, to: p.to, fromTime: p.fromTime, toTime: p.toTime, color: fpColorOf(p.id), until: fpUntil(p), ref: p}; }
  try {
    const wp = weekPlanSeen(weekStart(T)), st = typeof weekPeriodOn === 'function' ? weekPeriodOn(wp, T) : null;
    const said = st && ((st.focus || '').trim() || (st.name || '').trim());
    if(st && said){ const per = typeof weekPeriods === 'function' ? weekPeriods(wp) : [], k = per.indexOf(st);
      return {id: 's:' + (st.id || st.from), source: 'stage', focus: (st.focus || '').trim() || (st.name || '').trim(), why: '', notNow: [], from: st.from, to: st.to, color: fpColorOf(st.id || st.from), until: 'until ' + (st.to === T ? 'tonight' : fmtDate(st.to, 'short')) + (per.length > 1 && k >= 0 ? ` · stage ${k + 1} of ${per.length}` : ''), ref: st}; }
  } catch(e){}
  return null;
}
/* the next stretch that begins after today */
function fpNext(){
  const T = today(), c = [];
  fpState().periods.filter(p => p.focus.trim() && p.from > T).forEach(p => c.push({from: p.from, focus: p.focus.trim()}));
  try { const wp = weekPlanSeen(weekStart(T)); (typeof weekPeriods === 'function' ? weekPeriods(wp) : []).filter(x => x.from > T && ((x.focus || '').trim() || (x.name || '').trim())).forEach(x => c.push({from: x.from, focus: (x.focus || '').trim() || x.name})); } catch(e){}
  c.sort((a, b) => a.from.localeCompare(b.from)); return c[0] || null;
}

/* ---------- the strip, on every page ---------- */
function focusStripMount(main){
  document.querySelectorAll('.fp-strip').forEach(n => n.remove());
  const f = fpState(); if(!f.prefs.strip || !main) return;
  if(typeof pageFocusOn === 'function' && pageFocusOn()) return;
  const now = fpNow(); if(!now) return;
  if(main.querySelector('.fp-hero')) return;     /* Today says it large already */
  const el = document.createElement('div'); el.className = 'fp-strip' + (_fpCollapsed ? ' small' : ''); el.setAttribute('role', 'status'); el.style.setProperty('--c', now.color);
  el.innerHTML = _fpCollapsed
    ? `<button class="fp-pill" data-fp="expand" title="right now: ${esc(now.focus)}">◎ <span>${esc(now.focus.length > 34 ? now.focus.slice(0, 33) + '…' : now.focus)}</span></button>`
    : `<button class="fp-strip-b" data-fp="open" title="right now — open the focus plan"><span class="fp-k mono">right now</span><b class="fp-t serif">${esc(now.focus)}</b><span class="fp-u mono">${esc(now.until)}</span></button><button class="fp-x" data-fp="collapse" aria-label="make this small" title="make this small">–</button>`;
  main.prepend(el);
  el.onclick = ev => { const b = ev.target.closest('[data-fp]'); if(!b) return;
    if(b.dataset.fp === 'open') fpPlanOpen(); else if(b.dataset.fp === 'collapse'){ _fpCollapsed = true; focusStripMount(main); } else { _fpCollapsed = false; focusStripMount(main); } };
  fpMomentLater();
}

/* ---------- the card that says it back ---------- */
function fpMomentLater(){
  if(_fpMomentShown) return; _fpMomentShown = true;
  let tries = 0;
  const go = () => {
    const f = fpState(), now = fpNow(); if(!now || f.prefs.moment === 'off' || isLateNight() || document.hidden) return;
    const key = now.id + (f.prefs.moment === 'daily' ? '|' + today() : '');
    if(f.ack === key || (f.prefs.moment === 'change' && f.ack.split('|')[0] === now.id)) return;
    /* the house has other things to say first: the morning card, a first visit, a dialog already open */
    if(document.querySelector('#modals .overlay, #frGo, .morning-card') && tries++ < 6){ setTimeout(go, 6000); return; }
    fpMoment(now);
  };
  setTimeout(go, 4500);
}
function fpMoment(now){
  const f = fpState(), nx = fpNext();
  f.ack = now.id + '|' + today(); saveNow();
  const m = openModal(`<div data-nobubbles><p class="mono faint" style="margin:0">right now</p>
    <h2 class="serif fp-big" style="--c:${esc(now.color)}">${esc(now.focus)}</h2>
    <p class="muted" style="margin:0 0 10px">${esc(now.until)}</p>
    ${now.why ? `<p class="serif" style="font-style:italic;margin:0 0 10px">${esc(now.why)}</p>` : ''}
    ${now.notNow && now.notNow.length ? `<div class="fp-wait"><span class="mono faint">for now, this can wait</span><ul>${now.notNow.map(x => `<li><s>${esc(x)}</s></li>`).join('')}</ul></div>` : ''}
    <p class="fp-say">Say it to yourself: <b>“${esc(now.until.replace(/^until /, 'Until '))}, I am only doing ${esc(now.focus)}.”</b></p>
    ${nx ? `<p class="faint sm">Then, from ${esc(fmtDate(nx.from, 'short'))}: ${esc(nx.focus)}.</p>` : ''}
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn ghost" id="fpChange">Change it</button><button class="btn primary" id="fpOk">Yes — only this</button></div></div>`, 'narrow');
  m.querySelector('#fpOk').onclick = () => { m.remove(); sound('success'); };
  m.querySelector('#fpChange').onclick = () => { m.remove(); fpPlanOpen(); };
}

/* ---------- a quiet line, now and then ---------- */
function fpTick(){
  const f = fpState(), mins = +f.prefs.remind || 0; if(!mins || document.hidden || isLateNight()) return;
  if(Date.now() - _fpLastWhisper < mins * 60000) return;
  if(document.querySelector('#modals .overlay')) return;
  const now = fpNow(); if(!now) return;
  _fpLastWhisper = Date.now(); toast(`Right now: only ${now.focus}.`, 6500);
}
setInterval(fpTick, 60000);
document.addEventListener('visibilitychange', () => { if(!document.hidden && Date.now() - _fpLastWhisper > 25 * 60000){ setTimeout(fpTick, 1200); } });

/* ---------- Today, large ---------- */
function fpTodayHTML(){
  const now = fpNow(), nx = fpNext();
  if(!now) return `<section class="fp-hero empty rv"><span class="mono faint">right now</span><h2 class="serif faint">No single focus is set for now.</h2>
    <p class="muted" style="margin:0 0 10px;max-width:60ch">Not what must be finished — the one thing to give your attention to for a stretch, planned as far ahead as you like.</p>
    <button class="btn primary" data-fpplan>Set one →</button></section>`;
  return `<section class="fp-hero rv" style="--c:${esc(now.color)}"><span class="mono faint">right now</span>
    <h2 class="serif fp-big">${esc(now.focus)}</h2>
    <p class="mono fp-hero-u">${esc(now.until)}${now.source === 'stage' ? ' · from the week’s stages' : ''}</p>
    ${now.why ? `<p class="serif fp-why">${esc(now.why)}</p>` : ''}
    ${now.notNow && now.notNow.length ? `<div class="fp-wait"><span class="mono faint">for now, this can wait</span><ul>${now.notNow.map(x => `<li><s>${esc(x)}</s></li>`).join('')}</ul></div>` : ''}
    <div class="row fp-hero-f"><button class="btn sm" data-fpplan>plan ahead</button>${now.source === 'plan' ? '<button class="btn sm ghost" data-fpedit>change this</button>' : ''}${nx ? `<span class="faint sm">then, from ${esc(fmtDate(nx.from, 'short'))}: ${esc(nx.focus)}</span>` : ''}</div></section>`;
}
function bindFpToday(root){
  root.querySelectorAll('[data-fpplan]').forEach(b => b.onclick = () => fpPlanOpen());
  root.querySelectorAll('[data-fpedit]').forEach(b => b.onclick = () => { const n = fpNow(); fpPlanOpen(n && n.source === 'plan' ? {edit: n.ref.id} : {}); });
}

/* ---------- the plan ahead ---------- */
function fpOverlaps(p){ return fpState().periods.filter(x => x.id !== p.id && x.focus.trim() && x.from <= p.to && p.from <= x.to); }
function fpPlanHTML(st){
  const f = fpState(), T = today(), days = st.weeks * 7, end = addDays(st.start, days - 1), pct = d => Math.max(0, Math.min(100, (Math.round((Date.parse(d) - Date.parse(st.start)) / 864e5) / days) * 100));
  const inWin = (a, b) => b >= st.start && a <= end;
  const bar = (p, cls, go) => { const a = p.from < st.start ? st.start : p.from, z = p.to > end ? end : p.to, l = pct(a), w = Math.max(1.2, pct(addDays(z, 1)) - l), label = (p.focus || p.name || '').trim();
    return `<div class="fp-row ${cls}"><div class="fp-bar${w < 14 ? ' narrow' : ''}" ${go} style="left:${l}%;width:${w}%;--c:${esc(p._c || fpColorOf(p.id || p.from))}" title="${esc(label)} · ${esc(fmtDate(p.from, 'short'))} – ${esc(fmtDate(p.to, 'short'))}"><span>${esc(label)}</span></div></div>`; };
  const plan = f.periods.filter(p => p.focus.trim() && inWin(p.from, p.to)).sort((a, b) => a.from.localeCompare(b.from));
  const stages = []; try { Object.keys(S.weekPlans || {}).forEach(wk => { const wp = weekPlanSeen(wk); (typeof weekPeriods === 'function' ? weekPeriods(wp) : []).forEach(x => { if(((x.focus || '').trim() || (x.name || '').trim()) && inWin(x.from, x.to)) stages.push(Object.assign({}, x, {_wk: wk, _c: '#9aa3ad'})); }); }); } catch(e){}
  stages.sort((a, b) => a.from.localeCompare(b.from));
  const ticks = []; for(let i = 0; i < st.weeks; i++){ const d = addDays(st.start, i * 7); if(st.weeks <= 14 || i % 4 === 0) ticks.push(`<span style="left:${(i / st.weeks) * 100}%">${esc(fmtDate(d, 'short'))}</span>`); }
  const e = f.periods.find(x => x.id === st.edit) || null, v = e || {id: '', focus: '', from: st.draft && st.draft.from || T, to: st.draft && st.draft.to || addDays(T, 6), fromTime: '', toTime: '', why: '', notNow: []};
  const overlap = e ? fpOverlaps(e) : [];
  return `<h2 class="serif" style="margin:0">Right now — the one thing, planned ahead</h2>
    <p class="muted" style="font-size:.9rem;margin:4px 0 12px">Not what has to be finished. For each stretch of time, the <b>one thing</b> you will give your attention to — and let the rest wait. Plan it a week, a month or a season ahead. Where two stretches meet, the shorter one wins.</p>
    <div class="fp-tl"><div class="row between" style="margin-bottom:6px"><span class="row" style="gap:6px"><button class="tbtn" data-fpshift="-4">‹ earlier</button><button class="tbtn" data-fpshift="0">this week</button><button class="tbtn" data-fpshift="4">later ›</button></span>
      <span class="row" style="gap:6px">${[8, 12, 26, 52].map(n => `<button class="chip sm${st.weeks === n ? ' on' : ''}" data-fpweeks="${n}">${n === 52 ? 'a year' : n === 26 ? '6 months' : n + ' weeks'}</button>`).join('')}</span></div>
      <div class="fp-ticks">${ticks.join('')}</div>
      <div class="fp-rows"><i class="fp-today" style="left:${pct(T)}%"></i>${plan.map(p => bar(p, 'plan', `data-fpbar="${esc(p.id)}"`)).join('') || '<div class="fp-empty">No stretch planned in this window — add one below.</div>'}
        ${stages.length ? `<div class="fp-sep mono faint">from the week plans</div>${stages.map(p => bar(p, 'stage', `data-fpstage="${esc(p._wk)}"`)).join('')}` : ''}</div></div>
    <div class="fp-form" data-fpform="${esc(v.id)}"><h3 class="serif" style="margin:12px 0 6px">${e ? 'Change this stretch' : 'A new stretch'}</h3>
      <label class="fp-f"><span>The one thing</span><input class="inp serif-lg" id="fpFocus" maxlength="120" value="${esc(v.focus)}" placeholder="e.g. the Ravel — nothing else"></label>
      <div class="fp-presets"><span class="mono faint">dates</span>${[['this week', 'tw'], ['next week', 'nw'], ['next 2 weeks', 'n2'], ['this month', 'tm'], ['next month', 'nm']].map(([t, k]) => `<button class="chip sm" data-fppre="${k}">${t}</button>`).join('')}</div>
      <div class="fp-dates"><label><span>from</span><input class="inp" type="date" id="fpFrom" value="${esc(v.from)}"></label><label><span>to</span><input class="inp" type="date" id="fpTo" value="${esc(v.to)}"></label>
        <label><span>only between <i class="faint">(optional)</i></span><span class="row" style="gap:4px"><input class="inp" type="time" id="fpFt" value="${esc(v.fromTime)}"><input class="inp" type="time" id="fpTt" value="${esc(v.toTime)}"></span></label></div>
      <label class="fp-f"><span>Why this, in a line <i class="faint">(optional)</i></span><input class="inp" id="fpWhy" maxlength="160" value="${esc(v.why)}" placeholder="what it is for"></label>
      <label class="fp-f"><span>What can wait meanwhile <i class="faint">(one per line, optional)</i></span><textarea class="ta" id="fpNot" style="min-height:56px" placeholder="the things I will not give my attention to in this stretch">${esc(v.notNow.join('\n'))}</textarea></label>
      <p class="faint sm" id="fpOv">${overlap.length ? 'This overlaps ' + overlap.map(x => '“' + esc(x.focus) + '”').join(', ') + ' — on the days they share, the shorter stretch is the focus.' : ''}</p>
      <div class="row" style="gap:8px;justify-content:flex-end;flex-wrap:wrap">${e ? '<button class="btn sm ghost danger" id="fpDel">delete</button><button class="btn sm ghost" id="fpNew">a new one instead</button>' : ''}<button class="btn primary" id="fpSave">${e ? 'Save changes' : 'Add this stretch'}</button></div></div>`;
}
function fpPlanOpen(opts = {}){
  const st = {weeks: 12, start: weekStart(today()), edit: opts.edit || '', draft: null};
  const m = openModal('<div data-nobubbles id="fpWrap"></div>', 'wide');
  const wrap = m.querySelector('#fpWrap');
  const draw = () => { wrap.innerHTML = fpPlanHTML(st); wire(); };
  const refresh = () => { try { rerender(); } catch(e){} };
  const wire = () => {
    wrap.querySelectorAll('[data-fpshift]').forEach(b => b.onclick = () => { const k = +b.dataset.fpshift; st.start = k ? addDays(st.start, k * 7) : weekStart(today()); draw(); });
    wrap.querySelectorAll('[data-fpweeks]').forEach(b => b.onclick = () => { st.weeks = +b.dataset.fpweeks; draw(); });
    wrap.querySelectorAll('[data-fpbar]').forEach(b => b.onclick = () => { st.edit = b.dataset.fpbar; draw(); wrap.querySelector('.fp-form').scrollIntoView({block: 'nearest', behavior: 'smooth'}); });
    wrap.querySelectorAll('[data-fpstage]').forEach(b => b.onclick = () => { m.remove(); openWeeklyPlan(b.dataset.fpstage); });
    wrap.querySelectorAll('[data-fppre]').forEach(b => b.onclick = () => { const T = today(), wk = weekStart(T), k = b.dataset.fppre; let a, z;
      if(k === 'tw'){ a = T; z = addDays(wk, 6); } else if(k === 'nw'){ a = addDays(wk, 7); z = addDays(wk, 13); } else if(k === 'n2'){ a = addDays(wk, 7); z = addDays(wk, 20); }
      else if(k === 'tm'){ a = T; const d = parseDay(T); z = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()).padStart(2, '0')}`; }
      else { const d = parseDay(T), n = new Date(d.getFullYear(), d.getMonth() + 1, 1); a = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-01`; z = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate()).padStart(2, '0')}`; }
      wrap.querySelector('#fpFrom').value = a; wrap.querySelector('#fpTo').value = z; });
    const nw = wrap.querySelector('#fpNew'); if(nw) nw.onclick = () => { st.edit = ''; draw(); };
    const del = wrap.querySelector('#fpDel'); if(del) del.onclick = () => { const f = fpState(), back = spliceOut(f.periods, x => x.id === st.edit); st.edit = ''; saveNow(); draw(); refresh(); toast('Taken out.', 6000, {label: 'undo', fn: () => { back(); saveNow(); refresh(); }}); };
    const ov = () => { const a = wrap.querySelector('#fpFrom').value, z = wrap.querySelector('#fpTo').value; const o = a && z ? fpOverlaps({id: st.edit, from: a, to: z}) : [];
      wrap.querySelector('#fpOv').innerHTML = o.length ? 'This overlaps ' + o.map(x => '“' + esc(x.focus) + '”').join(', ') + ' — on the days they share, the shorter stretch is the focus.' : ''; };
    ['#fpFrom', '#fpTo'].forEach(s => { const i = wrap.querySelector(s); if(i) i.onchange = ov; });
    wrap.querySelector('#fpSave').onclick = () => {
      const focus = wrap.querySelector('#fpFocus').value.trim(), from = wrap.querySelector('#fpFrom').value, to = wrap.querySelector('#fpTo').value;
      if(!focus){ toast('Name the one thing.'); wrap.querySelector('#fpFocus').focus(); return; }
      if(!from || !to || to < from){ toast('The last day has to be on or after the first.'); return; }
      const ft = wrap.querySelector('#fpFt').value, tt = wrap.querySelector('#fpTt').value;
      if((ft && !tt) || (!ft && tt)){ toast('Give both times, or neither.'); return; }
      const f = fpState(), rec = f.periods.find(x => x.id === st.edit) || (() => { const r = {id: uid()}; f.periods.push(r); return r; })();
      Object.assign(rec, {focus, from, to, fromTime: ft, toTime: tt, why: wrap.querySelector('#fpWhy').value.trim(), notNow: wrap.querySelector('#fpNot').value.split('\n').map(x => x.trim()).filter(Boolean)});
      f.ack = ''; saveNow(); sound('success'); st.edit = ''; st.start = weekStart(from) < st.start || from > addDays(st.start, st.weeks * 7 - 1) ? weekStart(from) : st.start; draw(); refresh();
      toast(`Set: ${focus}.`, 3500); };
  };
  draw();
}
const fpSettingsHTML = () => { const p = fpState().prefs;
  return `<div class="card rv" id="fpCard"><h3>Right now — the one focus</h3>
    <p class="muted" style="font-size:.85rem;margin:0 0 6px">The single thing for the stretch you are in, from the focus plan (and the week’s stages). Planned in Today → <i>Right now</i>, or from the strip.</p>
    <div class="opt"><div><b>The strip</b><div class="d">A slim line at the top of every page: right now · the one thing · until when.</div></div><label class="toggle ${p.strip ? 'on' : ''}" id="sFpStrip"><span class="sw"></span></label></div>
    <div class="opt"><div><b>A card that says it back</b><div class="d">On the first open of each day, or only when a new stretch begins — a short card that asks you to say it to yourself.</div></div>
      <select class="sel" style="width:auto" id="sFpMoment">${[['daily', 'every day'], ['change', 'when a stretch begins'], ['off', 'never']].map(([v, t]) => `<option value="${v}" ${p.moment === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
    <div class="opt"><div><b>A quiet line now and then</b><div class="d">While the house is open, one short line — <i>Right now: only …</i> — leans in at the edge. Not at night.</div></div>
      <select class="sel" style="width:auto" id="sFpRemind">${[[0, 'never'], [25, 'every 25 min'], [45, 'every 45 min'], [90, 'every 90 min']].map(([v, t]) => `<option value="${v}" ${+p.remind === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div></div>`; };
function bindFpSettings(root){
  const r = root || document, f = fpState();
  const s = r.querySelector('#sFpStrip'); if(s) s.onclick = () => { f.prefs.strip = !f.prefs.strip; s.classList.toggle('on', f.prefs.strip); saveNow(); };
  const m = r.querySelector('#sFpMoment'); if(m) m.onchange = () => { f.prefs.moment = m.value; saveNow(); };
  const q = r.querySelector('#sFpRemind'); if(q) q.onchange = () => { f.prefs.remind = +q.value; saveNow(); };
}
