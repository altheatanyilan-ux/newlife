/* ============================================================
   TAKE IT WITH YOU

   Everything here is made in the browser and handed over as a download: no
   server, no account, nothing sent anywhere. CSV for the time entries, the
   tasks and the habits, so they open in any spreadsheet; ICS for the planned
   blocks and the dated tasks, so they sit in any calendar; and a print view
   of the week, which is the week on one sheet of paper.

   Times in the calendar file are written as local, floating times — the hour
   you planned is the hour that shows, wherever the calendar is opened.
   ============================================================ */

function exportDownload(name, text, mime){
  const blob = new Blob([text], {type: mime + ';charset=utf-8'});
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return blob.size;
}
const csvCell = v => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csvText = (head, rows) => [head].concat(rows).map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
const exTitle = t => t.title || t.text || '';

function exportTimeCSV(){
  const rows = (S.timeEntries || []).filter(e => e.endTime).sort((a, b) => String(a.startTime).localeCompare(String(b.startTime))).map(e => {
    const c = timeCategory(e.categoryId);
    return [e.id, e.startTime, e.endTime, Math.round(timeMinutes(e) * 10) / 10, timeLivingDay(e.startTime), c.name, timeCatKind(e.categoryId) || '', e.what, e.kind, e.verdict || '',
      e.linkedType || '', e.linkedLabel || '', e.habitId ? ((byId(S.habits || [], e.habitId) || {}).name || '') : '', (e.tags || []).join(' '), (e.notes || []).map(n => n.text).join(' | ')]; });
  return csvText(['id', 'start', 'end', 'minutes', 'living_day', 'category', 'category_kind', 'what', 'kind', 'reading', 'linked_type', 'linked_label', 'habit', 'tags', 'notes'], rows);
}
function exportTasksCSV(){
  const rows = (S.tasks || []).map(t => {
    const l = typeof planList === 'function' ? planList(t.listId) : null;
    return [t.id, exTitle(t), l ? l.name : '', t.done ? 'yes' : 'no', t.doneAt ? String(t.doneAt).slice(0, 10) : '', t.day || '', t.doDay || '', t.doEnd || '', pbdEstOf(t) || '', t.focusTime || '',
      t.priority || '', (t.tags || []).join(' '), t.timeCategory ? timeCategory(t.timeCategory).name : '', (t.createdAt || '').slice(0, 10)]; });
  return csvText(['id', 'title', 'list', 'done', 'done_on', 'due', 'do_from', 'do_to', 'estimate_min', 'focus_min', 'priority', 'tags', 'time_category', 'created'], rows);
}
function exportHabitsCSV(){
  const rows = [];
  Object.keys(S.habitLog || {}).sort().forEach(d => Object.keys(S.habitLog[d] || {}).forEach(id => {
    const h = byId(S.habits || [], id), x = S.habitLog[d][id] || {};
    rows.push([h ? h.name : id, d, x.level || '', x.status || '', x.note || '', x.fromClock ? 'yes' : '']); }));
  return csvText(['habit', 'date', 'level', 'status', 'note', 'counted_by_the_clock'], rows);
}

/* ---------- the calendar file ---------- */
const icsEsc = s => String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const icsFold = line => { const out = []; let s = line; while(s.length > 74){ out.push(s.slice(0, 74)); s = ' ' + s.slice(74); } out.push(s); return out.join('\r\n'); };
const icsDate = d => d.replace(/-/g, '');
const icsLocal = (d, min) => `${icsDate(d)}T${pad2(Math.floor(min / 60) % 24)}${pad2(min % 60)}00`;
function exportICSText(){
  const out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Life Instrument//planned time//EN', 'CALSCALE:GREGORIAN'];
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const ev = (uid_, summary, lines, desc) => { out.push('BEGIN:VEVENT', `UID:${uid_}@lifeinstrument`, `DTSTAMP:${stamp}`); lines.forEach(l => out.push(l)); out.push(icsFold('SUMMARY:' + icsEsc(summary))); if(desc) out.push(icsFold('DESCRIPTION:' + icsEsc(desc))); out.push('END:VEVENT'); };
  (S.timeBlocks || []).filter(b => b.date && b.start).forEach(b => {
    const a = pbdMin(b.start), len = +b.durationMin || 30;
    ev('block-' + b.id, pbdBlockLabel(b), [`DTSTART:${icsLocal(b.date, a)}`, `DTEND:${icsLocal(b.date, a + len)}`], b.kind === 'task' ? 'a planned block' : b.kind); });
  (S.tasks || []).filter(t => !t.done).forEach(t => {
    if(t.doDay){ ev('do-' + t.id, exTitle(t), [`DTSTART;VALUE=DATE:${icsDate(t.doDay)}`, `DTEND;VALUE=DATE:${icsDate(addDays(t.doEnd && t.doEnd > t.doDay ? t.doEnd : t.doDay, 1))}`], 'to do'); }
    if(t.day){ ev('due-' + t.id, 'Due: ' + exTitle(t), [`DTSTART;VALUE=DATE:${icsDate(t.day)}`, `DTEND;VALUE=DATE:${icsDate(addDays(t.day, 1))}`], 'due'); } });
  out.push('END:VCALENDAR');
  return out.join('\r\n') + '\r\n';
}
function exportRun(kind){
  const n = {time: ['time-entries.csv', exportTimeCSV, 'text/csv'], tasks: ['tasks.csv', exportTasksCSV, 'text/csv'], habits: ['habits.csv', exportHabitsCSV, 'text/csv'], ics: ['planned-time.ics', exportICSText, 'text/calendar']}[kind];
  if(!n) return 0; const text = n[1](); exportDownload(`${today()}-${n[0]}`, text, n[2]); return text.length;
}

/* ---------- the week on a sheet ---------- */
function printWeekHTML(anchor){
  const days = timeDaysIn(weekStart(anchor || today()), addDays(weekStart(anchor || today()), 6)), wp = (() => { try { return weekPlan(weekStart(anchor || today())); } catch(e){ return {outcomes: []}; } })();
  const col = d => {
    const pl = (S.plans || {})[d] || {}, blocks = (S.timeBlocks || []).filter(b => b.date === d).sort((a, b) => pbdMin(a.start) - pbdMin(b.start));
    const dated = (S.tasks || []).filter(t => !t.done && ((t.doDay && taskDoCovers(t, d)) || t.day === d));
    const habs = (S.habits || []).filter(h => !h.archived && !habIsBreaking(h) && habDue(h, d));
    const top = pbdTopTwoTasks(pl);
    return `<div class="pw-day"><div class="pw-dh"><b>${esc(fmtDate(d, 'short'))}</b></div>
      ${(pl.intentions || []).filter(x => (x || '').trim()).map(x => `<div class="pw-int">\u25c7 ${esc(x)}</div>`).join('')}
      ${blocks.map(b => `<div class="pw-b"><span class="mono">${esc(b.start)}</span> ${esc(pbdBlockLabel(b))}</div>`).join('')}
      ${dated.map(t => `<div class="pw-t">${top.includes(t.id) ? '\u2605 ' : '\u25a1 '}${esc(exTitle(t))}${t.day === d ? ' <i>(due)</i>' : ''}</div>`).join('')}
      ${habs.slice(0, 8).map(h => `<div class="pw-h">\u25cb ${esc(h.name)}${h.at != null && h.at !== '' ? ` <span class="mono">${esc(pbdHM(+h.at * 60))}</span>` : ''}</div>`).join('')}</div>`; };
  return `<div class="pw-head"><h1 class="serif">${esc(fmtDate(days[0], 'med'))} \u2013 ${esc(fmtDate(days[6], 'med'))}</h1>
    ${wp.theme ? `<div class="pw-theme">${esc(wp.theme)}</div>` : ''}
    ${(wp.outcomes || []).length ? `<div class="pw-goals">${(wp.outcomes || []).map(o => `<span>\u25a1 ${esc(o.text || '')}</span>`).join('')}</div>` : ''}</div>
    <div class="pw-grid">${days.map(col).join('')}</div>`;
}
function printWeek(anchor){
  document.getElementById('printWeek')?.remove();
  const el = document.createElement('div'); el.id = 'printWeek'; el.innerHTML = `<div class="pw-bar"><button class="btn primary" id="pwGo">Print</button><button class="btn ghost" id="pwClose">Close</button></div>${printWeekHTML(anchor)}`;
  document.body.appendChild(el); document.body.classList.add('pw-on');
  const close = () => { el.remove(); document.body.classList.remove('pw-on'); };
  el.querySelector('#pwClose').onclick = close; el.querySelector('#pwGo').onclick = () => window.print();
  window.addEventListener('afterprint', close, {once: true});
}

/* ---------- Settings ---------- */
function exportSettingsHTML(){
  return `<div class="card rv"><h3>Take it with you</h3>
    <p class="muted" style="font-size:.85rem">Made here, in the browser, and handed over as a download; nothing leaves this device. CSV opens in any spreadsheet; the calendar file holds your planned blocks and every task with a do-date or a due date.</p>
    <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn" data-exp="time">Time entries (CSV)</button><button class="btn" data-exp="tasks">Tasks (CSV)</button><button class="btn" data-exp="habits">Habits (CSV)</button>
      <button class="btn" data-exp="ics">Planned blocks and dated tasks (ICS)</button><button class="btn ghost" id="expPrint">Print the week</button></div></div>`;
}
function exportSettingsBind(root){
  (root || document).querySelectorAll('[data-exp]').forEach(b => b.onclick = () => { exportRun(b.dataset.exp); toast('Downloaded.'); });
  const p = (root || document).querySelector('#expPrint'); if(p) p.onclick = () => printWeek();
}
