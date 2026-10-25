/* ============================================================
   RIGHT NOW — what has my attention, for this stretch of time

   A plan that says "finish these by Friday" asks a promise the future may
   not let you keep. What can be promised is attention: *for this stretch, this
   is what I give myself to.* So the plan here is stretches of time — a few hours
   on one afternoon, a week, a season, planned as far ahead as you like — and
   nothing about whether the work will be finished.

   A stretch is not one task. Real stretches are not that tidy:

     the main things    one, or two or three that matter EQUALLY (never ranked)
     also needed        smaller things that are urgent anyway and have to be
                        done in the stretch without being what it is for,
                        each with an optional "by", and each can be ticked off
     can wait           what is deliberately not getting attention meanwhile
     why I am           the reason for committing to it — said to yourself
     committing

   and it runs from a date AND a time to a date AND a time ("Sat 25 Oct 14:00
   to Sat 25 Oct 17:00", or a day-long or season-long stretch with no times).
   Several stretches can be on at once (a season, and an afternoon inside it);
   the shortest is what is "right now", and the wider ones are said beneath it.
   The stages of a week plan count as stretches too.

   Where it comes from: S.focusPlan.periods
     {id, from, fromTime?, to, toTime?, mains:[{id,text}], urgent:[{id,text,by?,done?}],
      why, notNow[]}      (focus = the mains joined, kept for older readers)
   What is "right now" is read each time, never stored.

   How it reminds: a slim strip at the top of every page; a large card on Today;
   a card that says it back on the first open of each day (and when a new stretch
   begins); a quiet line now and then. Each can be turned down in Settings.
   ============================================================ */
const FP_COLORS = ['#b08968', '#7f916a', '#a0727e', '#6b7d9c', '#d4a44c', '#8a6f9e', '#c47832', '#4a8f8a'];
let _fpCollapsed = false, _fpLastWhisper = Date.now(), _fpMomentShown = false;
const fpJoin = (a, sep = ' and ') => a.length < 2 ? (a[0] || '') : a.length === 2 ? a[0] + sep + a[1] : a.slice(0, -1).join(', ') + ',' + sep + a[a.length - 1];
function fpFix(p){
  p.id = p.id || uid();
  if(!Array.isArray(p.mains)) p.mains = String(p.focus || '').trim() ? [{id: uid(), text: String(p.focus).trim()}] : [];
  p.mains = p.mains.map(m => ({id: m.id || uid(), text: String(m.text || '').trim()})).filter(m => m.text).slice(0, 4);
  p.urgent = (Array.isArray(p.urgent) ? p.urgent : []).map(u => ({id: u.id || uid(), text: String(u.text || '').trim(), by: u.by || '', done: !!u.done})).filter(u => u.text);
  p.focus = p.mains.map(m => m.text).join(' · ');
  p.why = String(p.why || ''); p.notNow = Array.isArray(p.notNow) ? p.notNow : []; p.fromTime = p.fromTime || ''; p.toTime = p.toTime || '';
  return p;
}
function fpState(){
  const f = S.focusPlan = S.focusPlan && typeof S.focusPlan === 'object' ? S.focusPlan : {};
  f.periods = Array.isArray(f.periods) ? f.periods : [];
  f.ack = typeof f.ack === 'string' ? f.ack : '';
  f.prefs = Object.assign({strip: true, moment: 'daily', remind: 45}, f.prefs && typeof f.prefs === 'object' ? f.prefs : {});
  f.periods.forEach(fpFix);
  return f;
}
const fpColorOf = id => FP_COLORS[[...String(id)].reduce((n, c) => n + c.charCodeAt(0), 0) % FP_COLORS.length];
const fpHM = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const fpStartMs = p => Date.parse(`${p.from}T${p.fromTime || '00:00'}:00`), fpEndMs = p => Date.parse(`${p.to}T${p.toTime || '23:59'}:59`);
const fpSpan = p => Math.max(1, Math.round((fpEndMs(p) - fpStartMs(p)) / 60000));
/* on now: it has begun (a date, and the time if there is one) and has not ended */
function fpOn(p, day, hm){
  if(!p.from || !p.to || !p.mains.length) return false;
  const begun = p.from < day || (p.from === day && (!p.fromTime || hm >= p.fromTime));
  const over = p.to < day || (p.to === day && !!p.toTime && hm >= p.toTime);
  return begun && !over;
}
function fpWhen(p){
  const T = today(), d = x => x === T ? 'today' : x === addDays(T, 1) ? 'tomorrow' : fmtDate(x, 'short'), tm = t => t ? ' ' + t : '';
  return p.from === p.to && p.fromTime && p.toTime ? `${d(p.from)} ${p.fromTime}–${p.toTime}` : `${d(p.from)}${tm(p.fromTime)} → ${d(p.to)}${tm(p.toTime)}`;
}
function fpUntil(p){
  const T = today(), when = p.to === T ? (p.toTime ? 'until ' + p.toTime : 'until tonight') : p.to === addDays(T, 1) ? 'until tomorrow' + (p.toTime ? ' ' + p.toTime : '') : 'until ' + fmtDate(p.to, 'short') + (p.toTime ? ' ' + p.toTime : '');
  return when;
}
/* what the stretch is, wherever it came from; the wider stretches it sits inside are listed under it */
function fpNow(){
  const T = today(), hm = fpHM(), f = fpState();
  const act = f.periods.filter(p => fpOn(p, T, hm)).sort((a, b) => fpSpan(a) - fpSpan(b) || b.from.localeCompare(a.from));
  const view = p => ({id: 'p:' + p.id, source: 'plan', mains: p.mains.map(m => m.text), focus: p.mains.map(m => m.text).join(' · '), say: fpJoin(p.mains.map(m => m.text)), urgent: p.urgent, why: p.why, notNow: p.notNow, from: p.from, to: p.to, fromTime: p.fromTime, toTime: p.toTime, color: fpColorOf(p.id), until: fpUntil(p), ref: p});
  if(act[0]){ const v = view(act[0]); v.wider = act.slice(1).map(x => ({mains: x.mains.map(m => m.text), until: fpUntil(x)})); return v; }
  try {
    const wp = weekPlanSeen(weekStart(T)), st = typeof weekPeriodOn === 'function' ? weekPeriodOn(wp, T) : null;
    const said = st && ((st.focus || '').trim() || (st.name || '').trim());
    if(st && said){ const per = typeof weekPeriods === 'function' ? weekPeriods(wp) : [], k = per.indexOf(st), text = (st.focus || '').trim() || (st.name || '').trim();
      return {id: 's:' + (st.id || st.from), source: 'stage', mains: [text], focus: text, say: text, urgent: [], why: '', notNow: [], from: st.from, to: st.to, color: fpColorOf(st.id || st.from), until: 'until ' + (st.to === T ? 'tonight' : fmtDate(st.to, 'short')) + (per.length > 1 && k >= 0 ? ` · stage ${k + 1} of ${per.length}` : ''), ref: st, wider: []}; }
  } catch(e){}
  return null;
}
/* the next stretch that begins after now */
function fpNext(){
  const T = today(), hm = fpHM(), c = [];
  fpState().periods.filter(p => p.mains.length && (p.from > T || (p.from === T && p.fromTime && p.fromTime > hm))).forEach(p => c.push({from: p.from, t: p.fromTime || '', focus: fpJoin(p.mains.map(m => m.text))}));
  try { const wp = weekPlanSeen(weekStart(T)); (typeof weekPeriods === 'function' ? weekPeriods(wp) : []).filter(x => x.from > T && ((x.focus || '').trim() || (x.name || '').trim())).forEach(x => c.push({from: x.from, t: '', focus: (x.focus || '').trim() || x.name})); } catch(e){}
  c.sort((a, b) => (a.from + a.t).localeCompare(b.from + b.t)); return c[0] || null;
}
const fpOpenUrgent = n => (n.urgent || []).filter(u => !u.done);
const fpNextSay = nx => `${fmtDate(nx.from, 'short')}${nx.t ? ' ' + nx.t : ''}`;

/* ---------- the strip, on every page ---------- */
function focusStripMount(main){
  document.querySelectorAll('.fp-strip').forEach(n => n.remove());
  const f = fpState(); if(!f.prefs.strip || !main) return;
  if(typeof pageFocusOn === 'function' && pageFocusOn()) return;
  const now = fpNow(); if(!now) return;
  if(main.querySelector('.fp-hero')) return;     /* Today says it large already */
  const open = fpOpenUrgent(now).length, el = document.createElement('div'); el.className = 'fp-strip' + (_fpCollapsed ? ' small' : ''); el.setAttribute('role', 'status'); el.style.setProperty('--c', now.color);
  el.innerHTML = _fpCollapsed
    ? `<button class="fp-pill" data-fp="expand" title="right now: ${esc(now.focus)}">◎ <span>${esc(now.focus.length > 34 ? now.focus.slice(0, 33) + '…' : now.focus)}</span></button>`
    : `<button class="fp-strip-b" data-fp="open" title="right now — open the focus plan"><span class="fp-k mono">right now</span><b class="fp-t serif">${esc(now.mains.length > 1 ? now.mains.join('  ·  ') : now.focus)}</b>${open ? `<span class="fp-side mono" title="smaller things that are urgent too">+${open} on the side</span>` : ''}<span class="fp-u mono">${esc(now.until)}</span></button><button class="fp-x" data-fp="collapse" aria-label="make this small" title="make this small">–</button>`;
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
  const f = fpState(), nx = fpNext(), open = fpOpenUrgent(now);
  f.ack = now.id + '|' + today(); saveNow();
  const m = openModal(`<div data-nobubbles><p class="mono faint" style="margin:0">right now</p>
    <h2 class="serif fp-big" style="--c:${esc(now.color)}">${now.mains.length > 1 ? now.mains.map(x => `<span class="fp-eq">${esc(x)}</span>`).join('<i class="fp-plus">and</i>') : esc(now.focus)}</h2>
    <p class="muted" style="margin:0 0 10px">${esc(now.until)}${now.mains.length > 1 ? ' · equally important' : ''}</p>
    ${now.why ? `<p class="serif" style="font-style:italic;margin:0 0 10px"><span class="mono faint" style="font-style:normal">why I am committing to this</span><br>${esc(now.why)}</p>` : ''}
    ${open.length ? `<div class="fp-side-l"><span class="mono faint">also needed, though smaller</span><ul>${open.map(u => `<li>${esc(u.text)}${u.by ? ` <em class="mono">by ${esc(fmtDate(u.by, 'short'))}</em>` : ''}</li>`).join('')}</ul></div>` : ''}
    ${now.notNow && now.notNow.length ? `<div class="fp-wait"><span class="mono faint">for now, this can wait</span><ul>${now.notNow.map(x => `<li><s>${esc(x)}</s></li>`).join('')}</ul></div>` : ''}
    <p class="fp-say">Say it to yourself: <b>“${esc(now.until.replace(/^until /, 'Until '))}, what has my attention is ${esc(now.say)}.”</b></p>
    ${nx ? `<p class="faint sm">Then, from ${esc(fpNextSay(nx))}: ${esc(nx.focus)}.</p>` : ''}
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn ghost" id="fpChange">Change it</button><button class="btn primary" id="fpOk">Yes — this</button></div></div>`, 'narrow');
  m.querySelector('#fpOk').onclick = () => { m.remove(); sound('success'); };
  m.querySelector('#fpChange').onclick = () => { m.remove(); fpPlanOpen(); };
}

/* ---------- a quiet line, now and then ---------- */
function fpTick(){
  const f = fpState(), mins = +f.prefs.remind || 0; if(!mins || document.hidden || isLateNight()) return;
  if(Date.now() - _fpLastWhisper < mins * 60000) return;
  if(document.querySelector('#modals .overlay')) return;
  const now = fpNow(); if(!now) return;
  _fpLastWhisper = Date.now(); toast(`Right now: ${now.say}.`, 6500);
}
setInterval(fpTick, 60000);
document.addEventListener('visibilitychange', () => { if(!document.hidden && Date.now() - _fpLastWhisper > 25 * 60000){ setTimeout(fpTick, 1200); } });

/* ---------- Today, large ---------- */
function fpTodayHTML(){
  const now = fpNow(), nx = fpNext();
  if(!now) return `<section class="fp-hero empty rv"><span class="mono faint">right now</span><h2 class="serif faint">Nothing is set for what has your attention now.</h2>
    <p class="muted" style="margin:0 0 10px;max-width:62ch">Not what must be finished — what you give your attention to for a stretch, planned as far ahead as you like: a few hours, a week, a season.</p>
    <button class="btn primary" data-fpplan>Set one →</button></section>`;
  const open = (now.urgent || []).filter(u => !u.done), done = (now.urgent || []).filter(u => u.done), T = today();
  return `<section class="fp-hero rv" style="--c:${esc(now.color)}"><span class="mono faint">right now${now.mains.length > 1 ? ' · equally important' : ''}</span>
    <div class="fp-mains${now.mains.length > 1 ? ' many' : ''}">${now.mains.map(x => `<h2 class="serif fp-big">${esc(x)}</h2>`).join('')}</div>
    <p class="mono fp-hero-u">${esc(now.until)}${now.source === 'stage' ? ' · from the week’s stages' : ''}</p>
    ${now.why ? `<p class="fp-why"><span class="mono faint">why I am committing to this</span><span class="serif">${esc(now.why)}</span></p>` : ''}
    ${(now.urgent || []).length ? `<div class="fp-side-l"><span class="mono faint">also needed, though smaller — urgent anyway</span><ul>${open.map(u => `<li><button class="fp-tick" data-fpurg="${esc(now.ref.id)}|${esc(u.id)}" aria-label="done" title="done"></button><span>${esc(u.text)}</span>${u.by ? `<em class="mono${u.by < T ? ' late' : ''}">by ${esc(u.by === T ? 'today' : fmtDate(u.by, 'short'))}</em>` : ''}</li>`).join('')}${done.map(u => `<li class="done"><button class="fp-tick on" data-fpurg="${esc(now.ref.id)}|${esc(u.id)}" aria-label="not done" title="not done">✓</button><span>${esc(u.text)}</span></li>`).join('')}</ul></div>` : ''}
    ${now.notNow && now.notNow.length ? `<div class="fp-wait"><span class="mono faint">for now, this can wait</span><ul>${now.notNow.map(x => `<li><s>${esc(x)}</s></li>`).join('')}</ul></div>` : ''}
    ${(now.wider || []).length ? `<p class="faint sm fp-wider">Inside a wider stretch: ${now.wider.map(w => `${esc(fpJoin(w.mains))} <span class="mono">${esc(w.until)}</span>`).join(' · ')}</p>` : ''}
    <div class="row fp-hero-f"><button class="btn sm" data-fpplan>plan ahead</button>${now.source === 'plan' ? '<button class="btn sm ghost" data-fpedit>change this</button>' : ''}${nx ? `<span class="faint sm">then, from ${esc(fpNextSay(nx))}: ${esc(nx.focus)}</span>` : ''}</div></section>`;
}
function bindFpToday(root){
  root.querySelectorAll('[data-fpplan]').forEach(b => b.onclick = () => fpPlanOpen());
  root.querySelectorAll('[data-fpedit]').forEach(b => b.onclick = () => { const n = fpNow(); fpPlanOpen(n && n.source === 'plan' ? {edit: n.ref.id} : {}); });
  root.querySelectorAll('[data-fpurg]').forEach(b => b.onclick = () => { const [pid, uid2] = b.dataset.fpurg.split('|'), p = fpState().periods.find(x => x.id === pid), u = p && p.urgent.find(x => x.id === uid2); if(!u) return;
    u.done = !u.done; saveNow(); sound(u.done ? 'success' : 'click'); const y = scrollY; rerender(); window.scrollTo(0, y); });
}

/* ---------- the plan ahead ---------- */
const fpMidnight = d => `${d}T00:00:00`;
function fpOverlaps(p){ return fpState().periods.filter(x => x.id !== p.id && x.mains.length && fpStartMs(x) < fpEndMs(p) && fpStartMs(p) < fpEndMs(x)); }
const fpDraftOf = (p, T) => p ? {id: p.id, mains: p.mains.map(m => m.text), urgent: p.urgent.map(u => ({text: u.text, by: u.by, done: u.done})), from: p.from, fromTime: p.fromTime, to: p.to, toTime: p.toTime, why: p.why, notNow: p.notNow.join('\n')}
  : {id: '', mains: [''], urgent: [], from: T, fromTime: '', to: addDays(T, 6), toTime: '', why: '', notNow: ''};
function fpPlanHTML(st){
  const f = fpState(), T = today(), days = st.weeks * 7, end = addDays(st.start, days - 1), pct = d => Math.max(0, Math.min(100, (Math.round((Date.parse(d) - Date.parse(st.start)) / 864e5) / days) * 100));
  const inWin = (a, b) => b >= st.start && a <= end;
  const bar = (p, cls, go, label, tip) => { const a = p.from < st.start ? st.start : p.from, z = p.to > end ? end : p.to, l = pct(a), w = Math.max(1.2, pct(addDays(z, 1)) - l);
    return `<div class="fp-row ${cls}"><div class="fp-bar${w < 14 ? ' narrow' : ''}" ${go} style="left:${l}%;width:${w}%;--c:${esc(p._c || fpColorOf(p.id || p.from))}" title="${esc(tip)}"><span>${esc(label)}</span></div></div>`; };
  const plan = f.periods.filter(p => p.mains.length && inWin(p.from, p.to)).sort((a, b) => fpStartMs(a) - fpStartMs(b));
  const stages = []; try { Object.keys(S.weekPlans || {}).forEach(wk => { const wp = weekPlanSeen(wk); (typeof weekPeriods === 'function' ? weekPeriods(wp) : []).forEach(x => { if(((x.focus || '').trim() || (x.name || '').trim()) && inWin(x.from, x.to)) stages.push(Object.assign({}, x, {_wk: wk, _c: '#9aa3ad'})); }); }); } catch(e){}
  stages.sort((a, b) => a.from.localeCompare(b.from));
  const ticks = []; for(let i = 0; i < st.weeks; i++){ const d = addDays(st.start, i * 7); if(st.weeks <= 14 || i % 4 === 0) ticks.push(`<span style="left:${(i / st.weeks) * 100}%">${esc(fmtDate(d, 'short'))}</span>`); }
  const v = st.draft, e = v.id ? f.periods.find(x => x.id === v.id) : null;
  const probe = {id: v.id, from: v.from, fromTime: v.fromTime, to: v.to, toTime: v.toTime}, overlap = v.from && v.to && v.to >= v.from ? fpOverlaps(probe) : [];
  const inRow = (cls, val, ph) => `<div class="fp-in"><input class="inp ${cls}" value="${esc(val)}" maxlength="140" placeholder="${esc(ph)}"><button class="wn-x" data-fprm="${cls}" aria-label="take this out" title="take this out">×</button></div>`;
  return `<h2 class="serif" style="margin:0">Right now — what has my attention, planned ahead</h2>
    <p class="muted" style="font-size:.9rem;margin:4px 0 12px">Not what has to be finished. For each stretch of time — a few hours or a whole season — what you give your attention to: <b>one main thing, or two or three that matter equally</b>, and the <b>smaller things that are urgent anyway</b>. Where stretches overlap, the shortest is what is “right now”.</p>
    <div class="fp-tl"><div class="row between" style="margin-bottom:6px"><span class="row" style="gap:6px"><button class="tbtn" data-fpshift="-4">‹ earlier</button><button class="tbtn" data-fpshift="0">this week</button><button class="tbtn" data-fpshift="4">later ›</button></span>
      <span class="row" style="gap:6px">${[8, 12, 26, 52].map(n => `<button class="chip sm${st.weeks === n ? ' on' : ''}" data-fpweeks="${n}">${n === 52 ? 'a year' : n === 26 ? '6 months' : n + ' weeks'}</button>`).join('')}</span></div>
      <div class="fp-ticks">${ticks.join('')}</div>
      <div class="fp-rows"><i class="fp-today" style="left:${pct(T)}%"></i>${plan.map(p => bar(p, 'plan' + (p.id === v.id ? ' on' : ''), `data-fpbar="${esc(p.id)}"`, p.mains.map(m => m.text).join(' · ') + (p.urgent.some(u => !u.done) ? ` +${p.urgent.filter(u => !u.done).length}` : ''), `${p.mains.map(m => m.text).join(' · ')} — ${fpWhen(p)}`)).join('') || '<div class="fp-empty">No stretch planned in this window — add one below.</div>'}
        ${stages.length ? `<div class="fp-sep mono faint">from the week plans</div>${stages.map(p => bar(p, 'stage', `data-fpstage="${esc(p._wk)}"`, (p.focus || p.name || '').trim(), `${(p.focus || p.name || '').trim()} — ${fmtDate(p.from, 'short')} – ${fmtDate(p.to, 'short')}`)).join('')}` : ''}</div></div>
    <div class="fp-form"><h3 class="serif" style="margin:12px 0 6px">${e ? 'Change this stretch' : 'A new stretch'}</h3>
      <div class="fp-f"><span>The main thing <i class="faint">— or two or three, if they matter equally</i></span><div id="fpMains">${v.mains.map((t, i) => inRow('fp-main', t, i ? 'another thing that matters just as much' : 'e.g. the Ravel — nothing else').replace('class="inp fp-main"', `class="inp fp-main" ${i === 0 ? 'id="fpFocus"' : ''}`)).join('')}</div>
        ${v.mains.length < 3 ? '<button class="tbtn" id="fpAddMain">＋ another equally important thing</button>' : ''}</div>
      <div class="fp-f"><span>Also needed, though less important <i class="faint">— small things that are urgent anyway</i></span><div id="fpUrgs">${v.urgent.map((u, i) => `<div class="fp-in fp-urg"><input class="inp fp-urg-t" value="${esc(u.text)}" maxlength="140" placeholder="e.g. reply to the landlord"><label class="fp-by"><span class="faint">by</span><input class="inp fp-urg-by" type="date" value="${esc(u.by || '')}"></label><button class="wn-x" data-fprmu="${i}" aria-label="take this out" title="take this out">×</button></div>`).join('')}</div>
        <button class="tbtn" id="fpAddUrg">＋ a small urgent thing</button></div>
      <div class="fp-presets"><span class="mono faint">dates</span>${[['today', 'td'], ['this week', 'tw'], ['next week', 'nw'], ['next 2 weeks', 'n2'], ['this month', 'tm'], ['next month', 'nm']].map(([t, k]) => `<button class="chip sm" data-fppre="${k}">${t}</button>`).join('')}</div>
      <div class="fp-dates"><div class="fp-dt"><span class="mono faint">starts</span><input class="inp" type="date" id="fpFrom" value="${esc(v.from)}"><input class="inp" type="time" id="fpFt" value="${esc(v.fromTime)}" aria-label="start time (optional)" title="start time — leave empty for the whole day"></div>
        <div class="fp-dt"><span class="mono faint">ends</span><input class="inp" type="date" id="fpTo" value="${esc(v.to)}"><input class="inp" type="time" id="fpTt" value="${esc(v.toTime)}" aria-label="end time (optional)" title="end time — leave empty for the end of the day"></div></div>
      <p class="faint sm" style="margin:2px 0 6px">Times are optional: leave them empty for whole days (a few hours on one afternoon: the same date twice, with a start and an end time).</p>
      <label class="fp-f"><span>Why I am committing to this</span><textarea class="ta" id="fpWhy" style="min-height:60px" maxlength="400" placeholder="what it is for, and why I am choosing it over everything else for this stretch">${esc(v.why)}</textarea></label>
      <label class="fp-f"><span>What can wait meanwhile <i class="faint">(one per line, optional)</i></span><textarea class="ta" id="fpNot" style="min-height:50px" placeholder="the things I will not give my attention to in this stretch">${esc(v.notNow)}</textarea></label>
      <p class="faint sm" id="fpOv">${overlap.length ? 'This overlaps ' + overlap.map(x => '“' + esc(x.focus) + '”').join(', ') + ' — they stay on together; the shortest stretch is the one “right now”, the wider one is said beneath it.' : ''}</p>
      <div class="row" style="gap:8px;justify-content:flex-end;flex-wrap:wrap">${e ? '<button class="btn sm ghost danger" id="fpDel">delete</button><button class="btn sm ghost" id="fpNew">a new one instead</button>' : ''}<button class="btn primary" id="fpSave">${e ? 'Save changes' : 'Add this stretch'}</button></div></div>`;
}
function fpPlanOpen(opts = {}){
  const T = today(), st = {weeks: 12, start: weekStart(T), draft: null};
  const open = id => { const p = id ? fpState().periods.find(x => x.id === id) : null; st.draft = fpDraftOf(p, T); if(p) st.start = weekStart(p.from) < st.start || p.from > addDays(st.start, st.weeks * 7 - 1) ? weekStart(p.from) : st.start; };
  open(opts.edit || '');
  const m = openModal('<div data-nobubbles id="fpWrap"></div>', 'wide');
  const wrap = m.querySelector('#fpWrap');
  const read = () => { const q = s => wrap.querySelector(s); if(!q('#fpFrom')) return;
    st.draft = Object.assign(st.draft, {mains: [...wrap.querySelectorAll('.fp-main')].map(i => i.value), urgent: [...wrap.querySelectorAll('.fp-urg')].map((r, k) => ({text: r.querySelector('.fp-urg-t').value, by: r.querySelector('.fp-urg-by').value, done: !!(st.draft.urgent[k] && st.draft.urgent[k].done)})),
      from: q('#fpFrom').value, fromTime: q('#fpFt').value, to: q('#fpTo').value, toTime: q('#fpTt').value, why: q('#fpWhy').value, notNow: q('#fpNot').value}); };
  const draw = () => { wrap.innerHTML = fpPlanHTML(st); wire(); };
  const refresh = () => { try { rerender(); } catch(e){} };
  const wire = () => {
    wrap.querySelectorAll('[data-fpshift]').forEach(b => b.onclick = () => { read(); const k = +b.dataset.fpshift; st.start = k ? addDays(st.start, k * 7) : weekStart(today()); draw(); });
    wrap.querySelectorAll('[data-fpweeks]').forEach(b => b.onclick = () => { read(); st.weeks = +b.dataset.fpweeks; draw(); });
    wrap.querySelectorAll('[data-fpbar]').forEach(b => b.onclick = () => { open(b.dataset.fpbar); draw(); wrap.querySelector('.fp-form').scrollIntoView({block: 'nearest', behavior: 'smooth'}); });
    wrap.querySelectorAll('[data-fpstage]').forEach(b => b.onclick = () => { m.remove(); openWeeklyPlan(b.dataset.fpstage); });
    const am = wrap.querySelector('#fpAddMain'); if(am) am.onclick = () => { read(); st.draft.mains.push(''); draw(); const i = wrap.querySelectorAll('.fp-main'); i[i.length - 1].focus(); };
    wrap.querySelectorAll('[data-fprm="fp-main"]').forEach((b, k) => b.onclick = () => { read(); if(st.draft.mains.length > 1) st.draft.mains.splice(k, 1); else st.draft.mains = ['']; draw(); });
    const au = wrap.querySelector('#fpAddUrg'); if(au) au.onclick = () => { read(); st.draft.urgent.push({text: '', by: '', done: false}); draw(); const i = wrap.querySelectorAll('.fp-urg-t'); i[i.length - 1].focus(); };
    wrap.querySelectorAll('[data-fprmu]').forEach(b => b.onclick = () => { read(); st.draft.urgent.splice(+b.dataset.fprmu, 1); draw(); });
    wrap.querySelectorAll('[data-fppre]').forEach(b => b.onclick = () => { read(); const wk = weekStart(T), k = b.dataset.fppre; let a, z;
      if(k === 'td'){ a = T; z = T; } else if(k === 'tw'){ a = T; z = addDays(wk, 6); } else if(k === 'nw'){ a = addDays(wk, 7); z = addDays(wk, 13); } else if(k === 'n2'){ a = addDays(wk, 7); z = addDays(wk, 20); }
      else { const d = parseDay(T), n = k === 'tm' ? d : new Date(d.getFullYear(), d.getMonth() + 1, 1), y = n.getFullYear(), mo = String(n.getMonth() + 1).padStart(2, '0'); a = k === 'tm' ? T : `${y}-${mo}-01`; z = `${y}-${mo}-${String(new Date(y, n.getMonth() + 1, 0).getDate()).padStart(2, '0')}`; }
      st.draft.from = a; st.draft.to = z; draw(); });
    const nw = wrap.querySelector('#fpNew'); if(nw) nw.onclick = () => { open(''); draw(); };
    const del = wrap.querySelector('#fpDel'); if(del) del.onclick = () => { const f = fpState(), back = spliceOut(f.periods, x => x.id === st.draft.id); open(''); saveNow(); draw(); refresh(); toast('Taken out.', 6000, {label: 'undo', fn: () => { back(); saveNow(); refresh(); }}); };
    const ov = () => { read(); const v = st.draft, o = v.from && v.to && v.to >= v.from ? fpOverlaps({id: v.id, from: v.from, fromTime: v.fromTime, to: v.to, toTime: v.toTime}) : [];
      wrap.querySelector('#fpOv').innerHTML = o.length ? 'This overlaps ' + o.map(x => '“' + esc(x.focus) + '”').join(', ') + ' — they stay on together; the shortest stretch is the one “right now”, the wider one is said beneath it.' : ''; };
    ['#fpFrom', '#fpTo', '#fpFt', '#fpTt'].forEach(s => { const i = wrap.querySelector(s); if(i) i.onchange = ov; });
    wrap.querySelector('#fpSave').onclick = () => {
      read(); const v = st.draft, mains = v.mains.map(x => x.trim()).filter(Boolean);
      if(!mains.length){ toast('Name the main thing.'); (wrap.querySelector('.fp-main') || {focus(){}}).focus(); return; }
      if(!v.from || !v.to || v.to < v.from){ toast('The last day has to be on or after the first.'); return; }
      if(v.from === v.to && v.fromTime && v.toTime && v.toTime <= v.fromTime){ toast('The end time has to be after the start time.'); return; }
      const f = fpState(), rec = f.periods.find(x => x.id === v.id) || (() => { const r = {id: uid()}; f.periods.push(r); return r; })();
      const prevU = new Map((rec.urgent || []).map(u => [u.text, u]));
      Object.assign(rec, {from: v.from, to: v.to, fromTime: v.fromTime, toTime: v.toTime, why: v.why.trim(), notNow: v.notNow.split('\n').map(x => x.trim()).filter(Boolean),
        mains: mains.map((t, i) => ({id: ((rec.mains || [])[i] || {}).id || uid(), text: t})),
        urgent: v.urgent.filter(u => u.text.trim()).map(u => ({id: (prevU.get(u.text.trim()) || {}).id || uid(), text: u.text.trim(), by: u.by || '', done: !!u.done}))});
      fpFix(rec); f.ack = ''; saveNow(); sound('success'); open(''); st.start = weekStart(v.from) < st.start || v.from > addDays(st.start, st.weeks * 7 - 1) ? weekStart(v.from) : st.start; draw(); refresh();
      toast(`Set: ${fpJoin(mains)}.`, 3500); };
  };
  draw();
}
const fpSettingsHTML = () => { const p = fpState().prefs;
  return `<div class="card rv" id="fpCard"><h3>Right now — what has my attention</h3>
    <p class="muted" style="font-size:.85rem;margin:0 0 6px">The main thing (or two or three that matter equally) for the stretch you are in, with the smaller urgent things beside it — from the focus plan and the week’s stages. Planned in Today → <i>Right now</i>, or from the strip.</p>
    <div class="opt"><div><b>The strip</b><div class="d">A slim line at the top of every page: right now · the main thing(s) · +n on the side · until when.</div></div><label class="toggle ${p.strip ? 'on' : ''}" id="sFpStrip"><span class="sw"></span></label></div>
    <div class="opt"><div><b>A card that says it back</b><div class="d">On the first open of each day, or only when a new stretch begins — a short card that asks you to say it to yourself.</div></div>
      <select class="sel" style="width:auto" id="sFpMoment">${[['daily', 'every day'], ['change', 'when a stretch begins'], ['off', 'never']].map(([v, t]) => `<option value="${v}" ${p.moment === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
    <div class="opt"><div><b>A quiet line now and then</b><div class="d">While the house is open, one short line — <i>Right now: …</i> — leans in at the edge. Not at night.</div></div>
      <select class="sel" style="width:auto" id="sFpRemind">${[[0, 'never'], [25, 'every 25 min'], [45, 'every 45 min'], [90, 'every 90 min']].map(([v, t]) => `<option value="${v}" ${+p.remind === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div></div>`; };
function bindFpSettings(root){
  const r = root || document, f = fpState();
  const s = r.querySelector('#sFpStrip'); if(s) s.onclick = () => { f.prefs.strip = !f.prefs.strip; s.classList.toggle('on', f.prefs.strip); saveNow(); };
  const m = r.querySelector('#sFpMoment'); if(m) m.onchange = () => { f.prefs.moment = m.value; saveNow(); };
  const q = r.querySelector('#sFpRemind'); if(q) q.onchange = () => { f.prefs.remind = +q.value; saveNow(); };
}
