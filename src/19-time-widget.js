/* ============================================================
   THE CLOCK ITSELF.

   A pill in the corner, on every page, because the moment you have to go
   somewhere to start a timer is the moment you stop starting it. Idle it is
   one line; running it is the count, what you are doing, and the way to stop.

   Like the focus dock, it is hung on the document once at boot and never
   rebuilt — a redraw of the page underneath must not be able to stop the
   clock or eat a half-typed description.

   Two ways in, because there are two moods. Press the pill and it starts
   immediately with no label, for when you just want the clock running and
   will say what it was afterwards. Press the arrow and it opens the form, for
   when you already know.
   ============================================================ */
let _timeTick = null;

function mountTimeDock(){
  if(document.getElementById('timeDock')) return;
  const dock = el('<div id="timeDock" class="tdock" aria-live="polite"></div>');
  document.body.appendChild(dock);
  /* a timer left running overnight, found on the way in rather than policed
     by a clock that cannot fire while the tab is shut */
  try { const ran = closeRunawayTimer();
    if(ran) toast('A timer had been left running. It was closed at six hours.');
  } catch(e){}
  paintTimeDock();
  try { timeWatchFocus(); } catch(e){ console.warn('the focus timer is not being followed', e); }
  if(_timeTick) clearInterval(_timeTick);
  /* the face only; anything that changes what the pill says repaints it */
  _timeTick = setInterval(timeDockFace, 1000);
}
/* just the digits, which is all that changes between one second and the next */
function timeDockFace(){
  const e = timeRunning();
  if(!e) return;
  $$('#timeDock .td-clock').forEach(n => n.textContent = timeClockSaid(e));
}
function paintTimeDock(){
  const dock = document.getElementById('timeDock');
  if(!dock) return;
  timeState();
  if(!timeSettings().widget){ dock.innerHTML = ''; dock.hidden = true; return; }
  dock.hidden = false;
  const e = timeRunning();
  dock.classList.toggle('running', !!e);
  dock.innerHTML = e ? timeDockRunningHTML(e) : timeDockIdleHTML();
  bindTimeDock(dock);
}
function timeDockIdleHTML(){
  const mins = timeMinutesOn(today());
  return `<div class="td-pill">
    <button class="td-go" id="tdQuick" title="start the clock now, and say what it was afterwards">
      ⏱ Start tracking</button>
    ${mins ? `<button class="td-today mono" id="tdOpen" title="where today went">${timeSaid(mins)}</button>` : ''}
    <button class="td-more" id="tdForm" title="say what it is first" aria-label="start with details">▴</button>
  </div>`;
}
function timeDockRunningHTML(e){
  const c = timeCategory(e.categoryId);
  return `<div class="td-card" style="--c:${esc(c.color)}">
    <div class="td-row">
      <i class="td-dot" aria-hidden="true"></i>
      <span class="td-clock mono">${esc(timeClockSaid(e))}</span>
      <span class="td-what">${esc(e.what || 'untitled')}</span>
    </div>
    ${e.linkedLabel || e.categoryId ? `<div class="td-sub mono">${esc(c.emoji)} ${esc(c.name)}${
      e.linkedLabel ? ` · ${esc(e.linkedLabel)}` : ''}</div>` : ''}
    <div class="td-row td-tools">
      <button class="btn sm" id="tdStop">◼ Stop</button>
      <button class="tbtn" id="tdNote" title="a note on the sitting, timestamped">+ note</button>
      <button class="tbtn" id="tdEdit" title="what this is">✎</button>
      <span class="grow"></span>
      <button class="tbtn" id="tdOpen" title="where today went">today</button>
    </div>
  </div>`;
}
function bindTimeDock(dock){
  const on = (sel, fn) => { const n = dock.querySelector(sel); if(n) n.onclick = fn; };
  on('#tdQuick', () => { startTimer({what:''}); sound('click'); paintTimeDock(); });
  on('#tdForm', () => openTimeStartModal());
  on('#tdStop', () => { const e = stopTimer(); sound('success');
    /* a sitting too short to be one was thrown away rather than written, and
       a stop button that appears to do nothing is worse than a wrong record */
    if(e && e.dropped) toast('Under a minute \u2014 not written down.');
    else if(e) toast(`${timeSaid(timeMinutes(e))} on ${e.what || 'that'}.`);
    paintTimeDock(); if(location.hash.startsWith('#/time')) rerender(); });
  on('#tdNote', () => openTimeNoteModal());
  on('#tdEdit', () => { const e = timeRunning(); if(e) openTimeEntryModal(e.id); });
  on('#tdOpen', () => navigate('#/time'));
}

/* ---------- the forms ---------- */
function timeCategoryPickHTML(id, sel){
  return `<select class="sel" id="${sel}"><option value="">— no category —</option>${
    timeCategories().map(c => `<option value="${esc(c.id)}" ${c.id === id ? 'selected' : ''}>${
      esc(c.emoji)} ${esc(c.name)}</option>`).join('')}</select>`;
}
function openTimeStartModal(){
  timeState();
  const m = openModal(`<h2>⏱ What are you doing?</h2>
    <label class="pd-q"><span class="k">the thing</span>
      <input class="inp" id="tsWhat" autofocus placeholder="the coda, slowly"></label>
    <label class="pd-q" style="margin-top:10px"><span class="k">category</span>
      ${timeCategoryPickHTML(timeSettings().defaultCategory, 'tsCat')}</label>
    <label class="pd-q" style="margin-top:10px"><span class="k">tags</span>
      <input class="inp" id="tsTags" placeholder="classical, slow practice"></label>
    <div class="row" style="justify-content:flex-end;margin-top:14px">
      <button class="btn primary" id="tsGo">▶ Start</button></div>`, 'narrow');
  m.querySelector('#tsGo').onclick = () => {
    startTimer({what: m.querySelector('#tsWhat').value.trim(),
      categoryId: m.querySelector('#tsCat').value || null,
      tags: timeTagsOf(m.querySelector('#tsTags').value)});
    m.remove(); sound('success'); paintTimeDock();
    if(location.hash.startsWith('#/time')) rerender();
  };
  return m;
}
const timeTagsOf = s => String(s || '').split(',').map(v => v.trim()).filter(Boolean);
function openTimeNoteModal(){
  const e = timeRunning();
  if(!e){ toast('Nothing is running.'); return null; }
  const m = openModal(`<h2>A note on this sitting</h2>
    <label class="pd-q"><span class="k">what happened</span>
      <textarea class="inp" rows="3" id="tnText" autofocus placeholder="moved to the coda"></textarea></label>
    <div class="row" style="justify-content:flex-end;margin-top:14px">
      <button class="btn primary" id="tnSave">Save</button></div>`, 'narrow');
  m.querySelector('#tnSave').onclick = () => {
    noteOnTimer(m.querySelector('#tnText').value);
    m.remove(); sound('success'); toast('Noted.');
    if(location.hash.startsWith('#/time')) rerender();
  };
  return m;
}
/* One form for correcting an entry and for writing one down afterwards, since
   they ask for exactly the same things. A running entry has no end yet, so
   the end field is left out rather than shown empty and ignored. */
function openTimeEntryModal(id, day){
  timeState();
  const e = id ? byId(S.timeEntries, id) : null;
  const running = e && !e.endTime;
  const on = e ? timeDayOf(e.startTime) : (day || today());
  const m = openModal(`<h2>${e ? (running ? 'What is running' : 'That sitting') : '+ A sitting'}</h2>
    <label class="pd-q"><span class="k">the thing</span>
      <input class="inp" id="teWhat" autofocus value="${esc(e ? e.what : '')}" placeholder="read the Jazz Piano Book"></label>
    <div class="row" style="gap:10px;margin-top:10px">
      <label class="pd-q" style="flex:1"><span class="k">day</span>
        <input class="inp mono" type="date" id="teDay" value="${esc(on)}"></label>
      <label class="pd-q" style="flex:1"><span class="k">from</span>
        <input class="inp mono" type="time" id="teFrom" value="${esc(e ? timeClockOf(e.startTime) : '')}"></label>
      ${running ? '' : `<label class="pd-q" style="flex:1"><span class="k">to</span>
        <input class="inp mono" type="time" id="teTo" value="${esc(e && e.endTime ? timeClockOf(e.endTime) : '')}"></label>`}
    </div>
    ${running ? '' : `<label class="pd-q" style="margin-top:4px"><span class="k">or just how long, in minutes</span>
      <input class="inp mono" type="number" id="teMins" min="0" max="1440" placeholder="120"></label>`}
    <label class="pd-q" style="margin-top:10px"><span class="k">category</span>
      ${timeCategoryPickHTML(e ? e.categoryId : timeSettings().defaultCategory, 'teCat')}</label>
    <label class="pd-q" style="margin-top:10px"><span class="k">tags</span>
      <input class="inp" id="teTags" value="${esc(e ? e.tags.join(', ') : '')}" placeholder="jazz, theory"></label>
    <!-- There were two more fields here, "hang it on" and "which", offering to
         attach the sitting to a project, a person, a score. They are gone
         from the form: the entries that genuinely want a link get it from
         the room that started them, and asking by hand for every sitting was
         two selects nobody filled in. Whatever an entry already carries is
         still carried, credited and shown. -->
    <div class="row" style="justify-content:flex-end;margin-top:14px;gap:8px">
      ${e ? `<button class="btn sm ghost danger" id="teDel">Delete</button><span class="grow"></span>` : ''}
      <button class="btn primary" id="teSave">Save</button></div>`, 'narrow');
  m.querySelector('#teSave').onclick = () => {
    const dayV = m.querySelector('#teDay').value || today();
    const from = m.querySelector('#teFrom').value;
    const toEl = m.querySelector('#teTo'), minsEl = m.querySelector('#teMins');
    /* the link is left exactly as it was: a sitting the score room started
       knows which piece it was, and nothing here should quietly forget it */
    const common = {what: m.querySelector('#teWhat').value.trim(),
      categoryId: m.querySelector('#teCat').value || null,
      tags: timeTagsOf(m.querySelector('#teTags').value)};
    if(e){
      Object.assign(e, common);
      if(from) e.startTime = timeAtOn(dayV, from);
      if(toEl && toEl.value) e.endTime = timeAtOn(dayV, toEl.value);
      else if(minsEl && +minsEl.value > 0) e.endTime = new Date(Date.parse(e.startTime) + (+minsEl.value) * 60000).toISOString();
      /* an end before its start is a night that ran past midnight */
      if(e.endTime && Date.parse(e.endTime) < Date.parse(e.startTime))
        e.endTime = new Date(Date.parse(e.endTime) + 864e5).toISOString();
      timeAfterSave(e);
      saveNow();
    } else {
      const made = logTime(Object.assign({}, common, {
        startTime: from ? timeAtOn(dayV, from) : timeAtOn(dayV, '09:00'),
        endTime: toEl && toEl.value ? timeAtOn(dayV, toEl.value) : null,
        minutes: minsEl ? +minsEl.value || 0 : 0}));
      /* written by hand or not, under a minute is not a sitting */
      if(!made){ toast('That is under a minute, so it was not written down.', 4500); return; }
    }
    m.remove(); sound('success'); paintTimeDock(); rerender();
  };
  const del = m.querySelector('#teDel');
  if(del) del.onclick = () => { removeTimeEntry(e.id); m.remove(); sound('click');
    paintTimeDock(); rerender(); };
  return m;
}

