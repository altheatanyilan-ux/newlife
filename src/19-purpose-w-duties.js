/* ============================================================
   SETTINGS — the duties, each with its window and its rule

   A duty is never ticked: its completion is read from the record it is about,
   and every one states the rule that raised it. Each has the three exits in
   the prompt queue (later, not today, off), and this is the Settings override
   — turned on or off here, with the window it sits in beside it. The ones that
   belong to a practice a person has not adopted are off until they say so.
   ============================================================ */
function dutiesSettingsHTML(){
  const all = typeof _allDuties === 'function' ? _allDuties() : [];
  if(!all.length) return '';
  const on = d => { const ds = (S.dutySettings || {})[d.id] || {}; return ds.on !== undefined ? ds.on : !!d.defaultOn; };
  const win = d => { try { const w = dutyWindowFor(d.id, today()); return w ? w.whyLabel || (w.start + '–' + w.end) : (d.recurrence && d.recurrence.type === 'event-driven' ? 'when it is pending' : 'when it comes round'); } catch(e){ return ''; } };
  return `<div class="card rv" id="dutiesCard"><h3>Duties</h3>
    <p class="muted" style="font-size:.85rem">Each duty is read from the record it is about and is never ticked by hand. These are all of them, with the window each sits in and the rule that raises it. The same three ways out (later, not today, off) are on every one when it appears.</p>
    ${all.map(d => `<div class="opt"><div><b>${esc(d.label || d.id)}</b><div class="d">${esc(win(d))}${d.rule ? ' · ' + esc(d.rule) : ''}</div></div>
      <label class="toggle ${on(d) ? 'on' : ''}" data-dutytog="${esc(d.id)}" title="${on(d) ? 'on' : 'off'}"><span class="sw"></span></label></div>`).join('')}</div>`;
}
function dutiesSettingsBind(root){
  (root || document).querySelectorAll('[data-dutytog]').forEach(t => t.onclick = () => {
    const id = t.dataset.dutytog, d = _allDuties().find(x => x.id === id); if(!d) return;
    S.dutySettings = S.dutySettings || {}; const ds = S.dutySettings[id] = S.dutySettings[id] || {};
    const cur = ds.on !== undefined ? ds.on : !!d.defaultOn; ds.on = !cur; saveNow(); t.classList.toggle('on', ds.on); t.title = ds.on ? 'on' : 'off';
  });
}
