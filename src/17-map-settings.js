/* ============================================================
   13. SETTINGS
   ============================================================ */
routes.settings = function(root){
  root.innerHTML = `<div class="page narrow settings"><div class="page-head"><h1>Settings</h1><div class="sub">The house remembers.</div></div>
    <div class="card rv"><h3>Atmosphere</h3>
      <div class="opt"><div><b>Theme</b><div class="d">Dark: rich soil and old leather. Light: warm paper.</div></div><label class="toggle ${S.settings.theme==='light'?'on':''}" id="sTheme"><span>dark</span><span class="sw"></span><span>light</span></label></div>
      <div class="opt"><div><b>Interaction sounds 🔔</b><div class="d">Soft chimes on clicks, a low note on navigation, a rising pair when something is completed. Synthesised in the browser; nothing is downloaded.</div></div><label class="toggle ${SoundManager.state().soundEnabled?'on':''}" id="sSound"><span class="sw"></span></label></div>
      <div class="opt"><div><b>Ambient background 🌊</b><div class="d">A barely-audible brown-noise wash, low-passed at 200 Hz. Ducks briefly under each click. Off by default.</div></div><label class="toggle ${SoundManager.state().ambientEnabled?'on':''}" id="sAmbient"><span class="sw"></span></label></div>
      <div class="opt"><div><b>Felt time</b><div class="d">Default timeline mode: stretch dense stages, compress thin ones.</div></div><label class="toggle ${S.settings.feltTime?'on':''}" id="sFelt"><span>clock</span><span class="sw"></span><span>felt</span></label></div>
      <div class="opt"><div><b>Landing page</b><div class="d">Where the site opens.</div></div><select class="sel" style="width:auto" id="sHome">${[['home','Home'],['today','Today']].map(([v,l])=>`<option value="${v}" ${(S.settings.home||'home')===v?'selected':''}>${l}</option>`).join('')}</select></div>
    </div>
    <div class="card rv"><h3>Navigation zones</h3><p class="muted" style="font-size:.85rem">Drag pages between Present, Becoming, and Always. The sidebar and the mobile menu follow.</p>${zoneEditorHTML()}
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
      <div class="field" style="margin:18px 0"><label>Atmosphere</label><div id="ambSettings">${ambientMenuHTML()}</div></div>
      <p class="mono">keyboard: N new entry · ⌘K or / search · ← → previous / next stage (Timeline) · Esc close</p>
    </div></div></div>`;
  storageInfo().then(i => { const line = $('#storageLine'); if(!line) return; const mode = usingRealDexie ? 'an IndexedDB database (Dexie)' : 'an IndexedDB database'; if(i && i.quota){ line.textContent = `Everything lives in this browser, in ${mode}. Using ${fmtBytes(i.usage)} of about ${fmtBytes(i.quota)} available to this site.`; $('#storageBar').style.width = Math.max(1, i.usage/i.quota*100).toFixed(1)+'%'; } else { line.textContent = `Everything lives in this browser, in ${mode}.`; } });
  $('#sPhotoMax').onchange = e => { S.settings.photoMax = +e.target.value; saveNow(); };

  if($('#ambSettings')) bindAmbientMenu($('#ambSettings'));  $('#sTheme').onclick = function(){ S.settings.theme = S.settings.theme==='dark'?'light':'dark'; saveNow(); applyTheme(); this.classList.toggle('on', S.settings.theme==='light'); };
  $('#sSound').onclick = function(){ SoundManager.toggleSound(); this.classList.toggle('on', SoundManager.state().soundEnabled); };
  $('#sAmbient').onclick = function(){ SoundManager.toggleAmbient(); this.classList.toggle('on', SoundManager.state().ambientEnabled); };
  $('#sFelt').onclick = function(){ S.settings.feltTime = !S.settings.feltTime; saveNow(); this.classList.toggle('on', S.settings.feltTime); };
  $('#sHome').onchange = e => { S.settings.home = e.target.value; saveNow(); };
  bindZoneEditor($('#zoneEditor').parentElement);
  const lb = daysSinceBackup(); $('#lastBackupLine').textContent = lb === null ? 'No backup exported yet from this browser.' : `Last backup: ${lb === 0 ? 'today' : lb + ' days ago'}.`;
  $('#sExport').onclick = () => exportToJSON().then(() => { toast('Backup exported.'); rerender(); });
  $('#sRestoreInfo').onclick = showRecoveryInfo;
  $('#sImport').onclick = () => $('#sFile').click();
  $('#sFile').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if(!f) return; const r = new FileReader(); r.onload = () => { let obj; try { obj = normaliseBackup(JSON.parse(r.result)); } catch(err){ toast('That file could not be read as JSON.'); return; } const problem = validateBackup(obj); if(problem){ toast(problem, 6000); return; } const counts = ['entries','stages','visions','habits'].map(k => `${obj.data[k].length} ${k}`).join(' · '); confirmDlg(`This will overwrite all current data. Are you sure?<br><span class="mono">backup from ${esc((obj.exportedAt||'').slice(0,10) || 'unknown date')} · ${counts}</span>`, async () => { try { await importBackup(obj); applyTheme(); toast('Backup imported. The house has been refurnished.'); rerender(); } catch(err){ console.error(err); toast('Import failed: ' + err.message, 6000); } }); }; r.readAsText(f); };
  $('#sClear').onclick = () => confirmDlg('This erases everything in this browser and re-seeds the placeholder content. Export first if in doubt.', async ()=>{ await resetAll(); applyTheme(); toast('Cleared. Seed content restored.'); navigate('#/today'); rerender(); });
};
