/* ============================================================
   BRAND STRATEGY — accounts.

   One profile per account: who it is (name, handle, platforms, status),
   its charter (purpose, audience, promise, positioning, and the "never"
   list), its voice and visual (three tone sliders set by hand, the words to
   use and avoid, signature moves, colours, type, imagery, and what changes
   per platform), and its pillars — three to five, whose targets must add to
   100%. The differentiation matrix puts every active account side by side.
   ============================================================ */

const brandLines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
function brandProfileHTML(a){
  const t = brandPillarTotal(a);
  const toneRow = ([k, lo, hi]) => `<div class="brand-tone"><span>${lo}</span><input type="range" min="1" max="5" step="1" data-btone="${k}" value="${a.voice.tone[k]}" aria-label="${lo} to ${hi}"><span>${hi}</span><b data-btonev="${k}">${a.voice.tone[k]}</b></div>`;
  return `<div class="brand-profile" data-bacc="${a.id}">
    <section class="brand-card"><h3>The account</h3>
      <div class="brand-grid2">
        <label class="brand-f"><span>Name</span><input class="inp" data-bf="name" value="${esc(a.name)}"></label>
        <label class="brand-f"><span>Handle</span><input class="inp" data-bf="handle" value="${esc(a.handle || '')}" placeholder="@…"></label>
        <label class="brand-f"><span>Platforms <small>comma separated</small></span><input class="inp" data-bf="platforms" value="${esc(a.platforms.join(', '))}"></label>
        <label class="brand-f"><span>Status</span><select class="sel" data-bf="status">${['active', 'paused', 'retired'].map(s => `<option${a.status === s ? ' selected' : ''}>${s}</option>`).join('')}</select></label>
      </div></section>
    <section class="brand-card"><h3>Charter</h3>
      ${[['purpose', 'Purpose — why this account exists'], ['audience', 'Audience — who it is for'], ['promise', 'Promise — what they get, every time'], ['positioning', 'Positioning — what it is, against what else']].map(([k, l]) =>
        `<label class="brand-f"><span>${l}</span><textarea class="inp" rows="2" data-bc="${k}">${esc(a.charter[k] || '')}</textarea></label>`).join('')}
      <label class="brand-f"><span>Never <small>one per line — these become the publish checklist</small></span><textarea class="inp" rows="3" data-bc="never">${esc(a.charter.never.join('\n'))}</textarea></label></section>
    <section class="brand-card"><h3>Voice &amp; visual</h3>
      ${BRAND_TONES.map(toneRow).join('')}
      <div class="brand-grid2">
        <label class="brand-f"><span>Words to use <small>one per line</small></span><textarea class="inp" rows="3" data-bv="lexiconUse">${esc(a.voice.lexiconUse.join('\n'))}</textarea></label>
        <label class="brand-f"><span>Words to avoid</span><textarea class="inp" rows="3" data-bv="lexiconAvoid">${esc(a.voice.lexiconAvoid.join('\n'))}</textarea></label>
        <label class="brand-f"><span>Signature moves</span><textarea class="inp" rows="3" data-bv="signatureMoves">${esc(a.voice.signatureMoves.join('\n'))}</textarea></label>
        <label class="brand-f"><span>Per platform <small>platform: what changes</small></span><textarea class="inp" rows="3" data-bv="perPlatform">${esc(Object.entries(a.voice.perPlatform).map(([k, v]) => `${k}: ${v}`).join('\n'))}</textarea></label>
      </div>
      <div class="brand-grid2">
        <label class="brand-f"><span>Colours <small>hex, comma separated</small></span><input class="inp mono" data-bvis="colours" value="${esc(a.voice.visual.colours.join(', '))}"></label>
        <div class="brand-swatches">${a.voice.visual.colours.filter(c => /^#[0-9a-f]{3,8}$/i.test(c)).map(c => `<i style="background:${c}" title="${esc(c)}"></i>`).join('')}</div>
        <label class="brand-f"><span>Type</span><input class="inp" data-bvis="type" value="${esc(a.voice.visual.type)}"></label>
        <label class="brand-f"><span>Imagery</span><input class="inp" data-bvis="imagery" value="${esc(a.voice.visual.imagery)}"></label>
      </div></section>
    <section class="brand-card"><h3>Pillars <span class="brand-total ${Math.round(t) === 100 ? 'ok' : 'bad'}">${t}%</span></h3>
      <p class="faint">Three to five. Their targets must add to 100%.</p>
      <div class="brand-pillars" id="bPillars">${a.pillars.map((p, i) => `<div class="brand-pillar" data-bpi="${i}"><i style="background:${p.color}"></i>
        <input class="inp" data-bp="name" value="${esc(p.name)}" placeholder="name"><input class="inp" data-bp="purpose" value="${esc(p.purpose || '')}" placeholder="what it is for">
        <input class="inp brand-pct" type="number" min="0" max="100" data-bp="targetPct" value="${p.targetPct}"><span>%</span><button class="tbtn sm" data-bpdel="${i}" aria-label="Remove pillar">×</button></div>`).join('')}</div>
      <div class="row" style="gap:8px"><button class="tbtn" id="bPAdd"${a.pillars.length >= 5 ? ' disabled' : ''}>＋ Pillar</button><button class="btn sm primary" id="bPSave">Save pillars</button><span class="brand-err" id="bPErr" role="alert"></span></div></section>
  </div>`;
}
function brandBindProfile(root, a, again){
  const box = root.querySelector('.brand-profile'); if(!box) return;
  const commit = () => { a.updatedAt = new Date().toISOString(); save(); };
  box.querySelectorAll('[data-bf]').forEach(i => i.onchange = () => { const k = i.dataset.bf;
    a[k] = k === 'platforms' ? i.value.split(',').map(x => x.trim()).filter(Boolean) : i.value.trim(); commit(); if(k === 'name' || k === 'status') again(); });
  box.querySelectorAll('[data-bc]').forEach(i => i.onchange = () => { const k = i.dataset.bc; a.charter[k] = k === 'never' ? brandLines(i.value) : i.value.trim(); commit(); });
  box.querySelectorAll('[data-btone]').forEach(i => i.oninput = () => { a.voice.tone[i.dataset.btone] = +i.value; box.querySelector(`[data-btonev="${i.dataset.btone}"]`).textContent = i.value; commit(); });
  box.querySelectorAll('[data-bv]').forEach(i => i.onchange = () => { const k = i.dataset.bv;
    if(k === 'perPlatform'){ const o = {}; brandLines(i.value).forEach(l => { const j = l.indexOf(':'); if(j > 0) o[l.slice(0, j).trim()] = l.slice(j + 1).trim(); }); a.voice.perPlatform = o; }
    else a.voice[k] = brandLines(i.value); commit(); });
  box.querySelectorAll('[data-bvis]').forEach(i => i.onchange = () => { const k = i.dataset.bvis;
    a.voice.visual[k] = k === 'colours' ? i.value.split(',').map(x => x.trim()).filter(Boolean) : i.value.trim(); commit(); if(k === 'colours') again(); });
  /* pillars are edited as a set and saved together, so the 100% rule is checked on the whole */
  const draft = a.pillars.map(p => Object.assign({}, p));
  const read = () => box.querySelectorAll('[data-bpi]').forEach(row => { const p = draft[+row.dataset.bpi]; row.querySelectorAll('[data-bp]').forEach(i => p[i.dataset.bp] = i.dataset.bp === 'targetPct' ? +i.value : i.value.trim()); });
  const repaint = () => { const el = box.querySelector('#bPillars');
    el.innerHTML = draft.map((p, i) => `<div class="brand-pillar" data-bpi="${i}"><i style="background:${p.color}"></i><input class="inp" data-bp="name" value="${esc(p.name)}" placeholder="name"><input class="inp" data-bp="purpose" value="${esc(p.purpose || '')}" placeholder="what it is for"><input class="inp brand-pct" type="number" min="0" max="100" data-bp="targetPct" value="${p.targetPct}"><span>%</span><button class="tbtn sm" data-bpdel="${i}" aria-label="Remove pillar">×</button></div>`).join('');
    bindDel(); box.querySelector('#bPAdd').disabled = draft.length >= 5;
    const t = draft.reduce((s, p) => s + (+p.targetPct || 0), 0), tot = box.querySelector('.brand-total'); tot.textContent = t + '%'; tot.className = 'brand-total ' + (Math.round(t) === 100 ? 'ok' : 'bad'); };
  const bindDel = () => { box.querySelectorAll('[data-bpdel]').forEach(b => b.onclick = () => { read(); draft.splice(+b.dataset.bpdel, 1); repaint(); });
    box.querySelectorAll('[data-bp="targetPct"]').forEach(i => i.oninput = () => { read(); const t = draft.reduce((s, p) => s + (+p.targetPct || 0), 0), tot = box.querySelector('.brand-total'); tot.textContent = t + '%'; tot.className = 'brand-total ' + (Math.round(t) === 100 ? 'ok' : 'bad'); }); };
  bindDel();
  box.querySelector('#bPAdd').onclick = () => { read(); if(draft.length >= 5) return; draft.push({id: uid(), name: '', purpose: '', targetPct: 0, color: BRAND_PILLAR_COLOURS[draft.length % BRAND_PILLAR_COLOURS.length]}); repaint(); };
  box.querySelector('#bPSave').onclick = () => { read(); const err = brandValidatePillars(draft); const out = box.querySelector('#bPErr');
    if(err){ out.textContent = err; return; } a.pillars = draft.map(p => Object.assign({}, p)); commit(); out.textContent = ''; toast('Pillars saved.'); again(); };
}

/* ---------- side by side ---------- */
function brandMatrixHTML(){
  const accs = brandActiveAccounts();
  if(accs.length < 1) return '<p class="faint">No active accounts yet.</p>';
  const dots = v => `<span class="brand-dots">${[1, 2, 3, 4, 5].map(i => `<i class="${i === v ? 'on' : ''}"></i>`).join('')}</span>`;
  const row = (label, f) => `<tr><th>${label}</th>${accs.map(a => `<td>${f(a)}</td>`).join('')}</tr>`;
  return `<div class="brand-tablewrap"><table class="brand-matrix"><thead><tr><th></th>${accs.map(a => `<th><a href="#/content/brand/account/${a.id}">${esc(a.name)}</a><span class="faint">${esc(a.handle || '')}</span></th>`).join('')}</tr></thead><tbody>
    ${row('Purpose', a => esc(a.charter.purpose) || '<span class="faint">—</span>')}
    ${row('Audience', a => esc(a.charter.audience) || '<span class="faint">—</span>')}
    ${row('Promise', a => esc(a.charter.promise) || '<span class="faint">—</span>')}
    ${row('Positioning', a => esc(a.charter.positioning) || '<span class="faint">—</span>')}
    ${BRAND_TONES.map(([k, lo, hi]) => row(`${lo} – ${hi}`, a => dots(a.voice.tone[k]))).join('')}
    ${row('Pillars', a => a.pillars.map(p => `<div class="brand-pchip"><i style="background:${p.color}"></i>${esc(p.name)} <span class="faint">${p.targetPct}%</span></div>`).join('') || '<span class="faint">—</span>')}
    ${row('Platforms', a => esc(a.platforms.join(', ')) || '<span class="faint">—</span>')}
    ${row('Never', a => a.charter.never.map(esc).join('<br>') || '<span class="faint">—</span>')}
  </tbody></table></div>
  ${accs.length > 1 ? brandOverlapHTML(accs) : ''}`;
}
/* where two accounts sound alike: the same tone within a step on every slider, or pillars of the same name */
function brandOverlapHTML(accs){
  const notes = [];
  for(let i = 0; i < accs.length; i++) for(let j = i + 1; j < accs.length; j++){
    const a = accs[i], b = accs[j];
    if(BRAND_TONES.every(([k]) => Math.abs(a.voice.tone[k] - b.voice.tone[k]) <= 1)) notes.push(`${esc(a.name)} and ${esc(b.name)} are within one step of each other on every tone slider.`);
    const same = a.pillars.filter(p => b.pillars.some(q => q.name.trim().toLowerCase() === p.name.trim().toLowerCase() && p.name.trim()));
    if(same.length) notes.push(`${esc(a.name)} and ${esc(b.name)} share ${same.length === 1 ? 'a pillar' : 'pillars'}: ${same.map(p => esc(p.name)).join(', ')}.`);
  }
  return notes.length ? `<div class="brand-overlap"><b>Where they blur</b>${notes.map(n => `<p>${n}</p>`).join('')}</div>` : '';
}
