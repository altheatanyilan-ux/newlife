/* ============================================================
   13. SETTINGS
   ============================================================ */
routes.settings = function(root){
  root.innerHTML = `<div class="page narrow settings"><div class="page-head"><h1>Settings</h1></div>
    <div class="card rv"><h3>Atmosphere</h3>
      <div class="opt"><div><b>Theme</b><div class="d">Dark: rich soil and old leather. Light: warm paper.</div></div><label class="toggle ${S.settings.theme==='light'?'on':''}" id="sTheme"><span>dark</span><span class="sw"></span><span>light</span></label></div>
      <div class="opt"><div><b>Interaction sounds 🔔</b><div class="d">Soft chimes on clicks, a low note on navigation, a rising pair when something is completed. Synthesised in the browser; nothing is downloaded.</div></div><label class="toggle ${SoundManager.state().soundEnabled?'on':''}" id="sSound"><span class="sw"></span></label></div>
      <div class="opt"><div><b>Ambient background 🌊</b><div class="d">A barely-audible brown-noise wash, low-passed at 200 Hz. Ducks briefly under each click. Off by default.</div></div><label class="toggle ${SoundManager.state().ambientEnabled?'on':''}" id="sAmbient"><span class="sw"></span></label></div>
      <div class="opt"><div><b>Felt time</b><div class="d">Default timeline mode: stretch dense stages, compress thin ones.</div></div><label class="toggle ${S.settings.feltTime?'on':''}" id="sFelt"><span>clock</span><span class="sw"></span><span>felt</span></label></div>
      <div class="opt"><div><b>Landing page</b><div class="d">Where the site opens.</div></div><select class="sel" style="width:auto" id="sHome">${[['compass','Compass'],['today','Today']].map(([v,l])=>`<option value="${v}" ${(S.settings.home||'compass')===v?'selected':''}>${l}</option>`).join('')}</select></div>
    </div>
    <div class="card rv"><h3>Navigation zones</h3><p class="muted" style="font-size:.85rem">Drag pages between Becoming, Story and Always. Compass, Today and Journals sit above the zones, and the Writing Studio below them; those four stay where they are.</p>${zoneEditorHTML()}
    </div>

    <div class="card rv"><h3>Import station</h3>
      <p class="muted" style="font-size:.85rem">Paste anything — a note, a voice memo transcript, a list — and it is read apart into entries, tasks, skills, projects and habits, each one shown to you before it is kept. It used to be its own room; it is a thing you do occasionally, so it lives here.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap"><a class="btn primary" href="#/import">Open the import station →</a></div>
    </div>
    <div class="card rv"><h3>Starter set</h3>
      <p class="muted" style="font-size:.85rem">A first draft of the house — goals, skills, projects, a compass, threads and open questions, written from the vision board you described rather than invented. It is stamped, so it comes out cleanly and takes nothing you have written with it. Where knowing your history would have been required, it leaves an empty room instead of a story.</p>
      <div class="opt"><div><b id="starterState"></b><div class="d" id="starterHint"></div></div>
        <span class="row" style="gap:8px"><button class="btn" id="sStarterAdd">Add it</button><button class="btn ghost danger" id="sStarterDel">Take it out</button></span></div>
    </div>
    <div class="card rv"><h3>Data &amp; backups</h3><p class="muted" style="font-size:.85rem" id="storageLine">Everything lives in this browser, in an IndexedDB database. Measuring…</p><div class="bar" style="--c:var(--sage);margin-bottom:12px"><i id="storageBar" style="width:0%"></i></div>
      <div class="row"><button class="btn primary" id="sExport">💾 Export backup</button><button class="btn" id="sImport">Import backup</button><input type="file" id="sFile" accept=".json,application/json" hidden><button class="btn ghost" id="sRestoreInfo" title="${esc(RECOVERY_TEXT)}">ⓘ How to restore</button></div>
      <p class="muted" style="font-size:.85rem;margin-top:12px" id="lastBackupLine"></p>
      <div class="opt"><div><b>Photo size on upload</b><div class="d">Long edge in pixels. Larger keeps more detail and uses more space.</div></div><select class="sel" style="width:auto" id="sPhotoMax">${[1200,1600,2400,4000].map(n=>`<option value="${n}" ${(S.settings.photoMax||1600)===n?'selected':''}>${n}px${n===1600?' (default)':''}</option>`).join('')}</select></div>
      <div class="opt"><div><b>Clear all data</b><div class="d">Erases everything in this browser and restores the placeholder content. Export first.</div></div><button class="btn danger" id="sClear">Clear all data</button></div>
    </div>
    <div class="card rv"><h3>About</h3><div class="prose muted" style="font-size:.9rem">
      <p>Life Instrument is a house you are still building. Each section is a room. Some rooms look backward; some look forward; some hold tools; some hold artifacts. The hallway connecting them is a single data model that lets one entry live in many rooms at once.</p>
      <p>It is not a productivity app. Its job is to make the motifs of a life visible — recurring patterns, drifting values, dreams gaining or losing specificity — so you can interpret the past honestly and pull the future closer deliberately.</p>
      <p>It draws on Maltz (self-image and mental rehearsal), Fritz (structural tension), Hicks (the emotional guidance scale), Hill (auto-suggestion), Loehr &amp; Schwartz (four-dimensional energy and oscillation), Leonard (mastery and the plateau), and Newport (career capital). The Philosophical Integration is structural, not decorative: every mechanic embodies a teaching.</p>
      <div class="field" style="margin:18px 0"><label>Voice &amp; Claude</label>
        <p class="muted" style="font-size:.85rem;margin:2px 0 10px">Dictation uses your browser's own speech recogniser — ${dictationSupported() ? 'available here' : '<b>not available in this browser</b> (Chrome, Edge and Safari have one)'}. Nothing is recorded or uploaded; you speak, text appears.</p>
        <p class="muted" style="font-size:.85rem;margin:0 0 10px">Tidying dictation and the pattern report work without a key, using rules and statistics computed in this page. Paste an <b>Anthropic API key</b> and both get a real language model instead. A Claude Pro or Max subscription cannot be used here — consumer subscriptions do not issue API credentials, and API usage is billed separately.</p>
        <div class="row" style="gap:8px"><input class="inp mono" id="aiKey" type="password" placeholder="sk-ant-…" value="${esc(aiKey())}" autocomplete="off" style="flex:1"><button class="btn sm" id="aiSave">Save</button>${aiKey()?'<button class="btn sm ghost" id="aiClear">Remove</button>':''}</div>
        <div class="faint" style="font-size:.74rem;margin-top:6px">Stored only in this browser's localStorage. It is never written into a backup file. <span id="aiState">${aiReady()?'Connected.':'Not connected — local mode.'}</span></div>
        <div class="row" style="margin-top:8px"><button class="btn sm ghost" id="aiTest">Test the connection</button><button class="btn sm ghost" id="openPatterns">Open the pattern report →</button></div>
      </div>
      <div class="field" style="margin:18px 0"><label>Atmosphere</label><div id="ambSettings">${ambientMenuHTML()}</div></div>
      <p class="mono">keyboard: N new entry · ⌘K or / search · ← → previous / next stage (Timeline) · Esc close</p>
    </div></div></div>`;
  storageInfo().then(i => { const line = $('#storageLine'); if(!line) return; const mode = usingRealDexie ? 'an IndexedDB database (Dexie)' : 'an IndexedDB database'; if(i && i.quota){ line.textContent = `Everything lives in this browser, in ${mode}. Using ${fmtBytes(i.usage)} of about ${fmtBytes(i.quota)} available to this site.`; $('#storageBar').style.width = Math.max(1, i.usage/i.quota*100).toFixed(1)+'%'; } else { line.textContent = `Everything lives in this browser, in ${mode}.`; } });
  $('#sPhotoMax').onchange = e => { S.settings.photoMax = +e.target.value; saveNow(); };
  /* the starter set: how much of it is still here, and the two buttons */
  (() => {
    const n = starterCount();
    $('#starterState').textContent = n ? `${n} record${n===1?'':'s'} from the starter set are still here` : 'The starter set is not in this house';
    $('#starterHint').textContent = n ? 'Anything you have edited keeps your edits — but “take it out” removes it along with the rest.'
      : 'Adding it will not touch anything you have written.';
    $('#sStarterAdd').disabled = !!n;
    $('#sStarterDel').disabled = !n;
    $('#sStarterAdd').onclick = () => { applyStarter(); sound('success'); toast('Added. Every piece of it is editable, and this button becomes “take it out”.', 6000); rerender(); };
    $('#sStarterDel').onclick = () => { const c = starterCount();
      requestDelete({label:`the starter set (${c} record${c===1?'':'s'})`, remove:() => {
        const snap = JSON.parse(JSON.stringify({stages:S.stages, values:S.values, valueOrder:S.valueOrder, visions:S.visions, skills:S.skills, projects:S.projects, threads:S.threads, entries:S.entries, ideas:S.ideas}));
        removeStarter();
        return () => { Object.assign(S, snap); saveNow(); };
      }, after:() => { S.settings.starterDeclined = true; saveNow(); rerender(); }}); };
  })();

  if($('#ambSettings')) bindAmbientMenu($('#ambSettings'));
  if($('#aiSave')) $('#aiSave').onclick = () => { setAiKey($('#aiKey').value); toast(aiReady() ? 'Key saved in this browser.' : 'Key removed.'); rerender(); };
  if($('#aiClear')) $('#aiClear').onclick = () => { setAiKey(''); $('#aiKey').value = ''; toast('Key removed. Local mode.'); rerender(); };
  if($('#openPatterns')) $('#openPatterns').onclick = () => {
    const p = openPanel(`<div class="mono">patterns</div><h2>Patterns in the record</h2><div id="patBody"></div>`, 'patterns-panel');
    renderPatterns(p.querySelector('#patBody'));
  };
  if($('#aiTest')) $('#aiTest').onclick = async () => {
    const st = $('#aiState'); if(!aiReady()){ st.textContent = 'No key set — local mode works without one.'; return; }
    st.textContent = 'checking…';
    try { const r = await askClaude('Reply with exactly: ok', 'ping', {maxTokens:10}); st.textContent = r ? 'Connected. Claude answered.' : 'Connected, but the answer was empty.'; sound('success'); }
    catch(e){ st.textContent = e.message; sound('error'); }
  };  $('#sTheme').onclick = function(){ S.settings.theme = S.settings.theme==='dark'?'light':'dark'; saveNow(); applyTheme(); this.classList.toggle('on', S.settings.theme==='light'); };
  $('#sSound').onclick = function(){ SoundManager.toggleSound(); this.classList.toggle('on', SoundManager.state().soundEnabled); };
  $('#sAmbient').onclick = function(){ SoundManager.toggleAmbient(); this.classList.toggle('on', SoundManager.state().ambientEnabled); };
  $('#sFelt').onclick = function(){ S.settings.feltTime = !S.settings.feltTime; saveNow(); this.classList.toggle('on', S.settings.feltTime); };
  $('#sHome').onchange = e => { S.settings.home = e.target.value; saveNow(); };
  bindZoneEditor($('#zoneEditor').parentElement);
  const lb = daysSinceBackup(); $('#lastBackupLine').textContent = lb === null ? 'No backup exported yet from this browser.' : `Last backup: ${lb === 0 ? 'today' : lb + ' days ago'}.`;
  $('#sExport').onclick = () => exportToJSON().then(() => { toast('Backup exported.'); rerender(); });
  $('#sRestoreInfo').onclick = showRecoveryInfo;
  $('#sImport').onclick = () => $('#sFile').click();
  $('#sFile').onchange = e => { const f = e.target.files[0]; setTimeout(() => { e.target.value = ''; }, 0); if(!f) return; const r = new FileReader(); r.onload = () => { let obj; try { obj = normaliseBackup(JSON.parse(r.result)); } catch(err){ toast('That file could not be read as JSON.'); return; } const problem = validateBackup(obj); if(problem){ toast(problem, 6000); return; } const counts = ['entries','stages','visions','habits'].map(k => `${obj.data[k].length} ${k}`).join(' · '); confirmDlg(`This will overwrite all current data. Are you sure?<br><span class="mono">backup from ${esc((obj.exportedAt||'').slice(0,10) || 'unknown date')} · ${counts}</span>`, async () => { try { await importBackup(obj); applyTheme(); toast('Backup imported. The house has been refurnished.'); rerender(); } catch(err){ console.error(err); toast('Import failed: ' + err.message, 6000); } }); }; r.readAsText(f); };
  $('#sClear').onclick = () => confirmDlg('This erases everything in this browser and re-seeds the placeholder content. Export first if in doubt.', async ()=>{ await resetAll(); applyTheme(); toast('Cleared. Seed content restored.'); navigate('#/today'); rerender(); });
};
