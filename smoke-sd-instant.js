/* smoke-sd-instant — Study: a dropped deck imports at once; review has two answers */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const yes = (n, c, g='') => { if(c) console.log('  ok   ' + n); else { bad++; console.log('  FAIL ' + n + '  — ' + JSON.stringify(g)); } };
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport: {width: 1300, height: 950}})).newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  const q = (f, a) => p.evaluate(f, a);
  await q(() => { S.settings.rescueGate = 'off'; S.study = {}; document.querySelectorAll('.overlay').forEach(n => n.remove()); location.hash = '#/study'; }); await p.waitForTimeout(1500);
  /* a deck to export, then to drop */
  const made = await q(async () => {
    const dk = sdEnsureDeck('Dropme'), nt = [...SD.noteTypes.values()].find(t => t.kind === 'standard') || [...SD.noteTypes.values()][0];
    const n = sdNewNote(nt.id, ['la mer', 'the sea'], []); sdAddNote(n, dk.id);
    const blob = await sdExportApkg([dk.id], true);
    window.__apkg = new File([blob], 'dropme.apkg');
    sdDeleteNotes([n.id]);
    window.__one = n.id;
    return {deck: dk.id, notes: SD.notes.size, size: blob.size};
  });
  yes('a deck exists and was written out as an .apkg', made.size > 1000, made);
  await q(() => { const o = sdImportPrefs(); o.deckPrefix = 'Fresh'; sdTouch('misc', o); });
  const before = await q(() => [SD.notes.size, SD.cards.size, sdDecks().map(d => d.name).filter(n => /^Fresh/.test(n)).length]);
  /* drop it on the page — nothing else is pressed */
  await q(() => { const dt = new DataTransfer(); dt.items.add(window.__apkg); document.dispatchEvent(new DragEvent('dragenter', {dataTransfer: dt, bubbles: true})); document.dispatchEvent(new DragEvent('drop', {dataTransfer: dt, bubbles: true, cancelable: true})); });
  await p.waitForTimeout(400);
  yes('a progress panel appears with no Import button anywhere', await q(() => !!document.getElementById('sdIng') && !document.querySelector('#imGo')));
  await p.waitForTimeout(5000);
  const after = await q(() => ({n: SD.notes.size, c: SD.cards.size, fresh: sdDecks().map(d => d.name).filter(n => /^Fresh/.test(n)), panel: (document.getElementById('sdIng') || {textContent: ''}).textContent}));
  yes('the notes and cards are in, inside the prefix, the moment it is dropped', after.n > before[0] && after.c > before[1] && after.fresh.length >= 1, after);
  yes('and the panel says what happened', /dropme\.apkg/.test(after.panel) && /notes added/.test(after.panel), after.panel);
  yes('a file that is not a deck is turned away, nothing imported', await q(async () => { const n0 = SD.notes.size; const dt = new DataTransfer(); dt.items.add(new File(['x'], 'photo.png')); document.dispatchEvent(new DragEvent('drop', {dataTransfer: dt, bubbles: true, cancelable: true})); await new Promise(r => setTimeout(r, 300)); return SD.notes.size === n0; }));
  /* the Import page: choosing files imports too */
  await q(() => { location.hash = '#/study/import'; }); await p.waitForTimeout(900);
  yes('the Import page is a drop zone with settings, not a form', await q(() => !!document.querySelector('#imDrop') && !!document.querySelector('#imFile').multiple && !!document.querySelector('#imOpts') && !document.querySelector('#imGo')));
  await q(() => { const sel = document.querySelector('#imPrefix'); sel.value = 'Second'; sel.dispatchEvent(new Event('change')); });
  yes('the settings are remembered for the next drop', await q(() => sdImportPrefs().deckPrefix === 'Second'));

  /* two answers */
  await q(() => { document.getElementById('sdIng') && document.getElementById('sdIng').remove(); const dk = sdDecks().find(d => d.name === 'Fresh::Dropme'); location.hash = '#/study/review/' + dk.id; }); await p.waitForTimeout(1500);
  await p.keyboard.press('Space'); await p.waitForTimeout(500);
  const bar = await q(() => [...document.querySelectorAll('.sx-ans')].map(b => b.querySelector('.nm').textContent + '|' + b.querySelector('kbd').textContent));
  yes('after the answer there are three buttons, named for how it went, each with its interval and key', bar.length === 3 && /Didn’t get it\|?/.test(bar[0]) && /Barely/.test(bar[1]) && /Got it/.test(bar[2]) && await q(() => [...document.querySelectorAll('.sx-ans')].every(b => b.querySelector('.ivl').textContent && b.querySelector('.sub'))), bar);
  const n0 = await q(() => SD.revlog.length);
  await p.keyboard.press('2'); await p.waitForTimeout(700);
  const mid = await q(() => ({n: SD.revlog.length, ease: SD.revlog[SD.revlog.length - 1].ease, toast: (document.querySelector('.sx-undo') || {textContent: ''}).textContent}));
  yes('2 is "barely" (scheduled as Hard) and says what happens next', mid.n === n0 + 1 && mid.ease === 2 && /Barely/.test(mid.toast) && /a bit later/.test(mid.toast), mid);
  await p.keyboard.press('Control+z'); await p.waitForTimeout(600); await p.keyboard.press('Space'); await p.waitForTimeout(400);
  await p.keyboard.press('3'); await p.waitForTimeout(700);
  const last = await q(() => ({ease: SD.revlog[SD.revlog.length - 1].ease}));
  yes('3 is "got it" (Good)', last.ease === 3, last);
  await p.keyboard.press('Control+z'); await p.waitForTimeout(600); await p.keyboard.press('Space'); await p.waitForTimeout(400);
  await p.keyboard.press('4'); await p.waitForTimeout(700);
  yes('4 no longer exists as a choice: it counts as "got it"', await q(() => SD.revlog[SD.revlog.length - 1].ease === 3));
  await q(() => { const st = sdSettings(); st.fourButtons = true; sdTouch('misc', st); });
  yes('four buttons are still there if switched on from the … menu', await q(() => { sdSettings().fourButtons = true; return !sdThree(); }));
  console.log(errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'no page errors'); if(errs.length) bad++;
  await b.close(); console.log(bad ? 'FAILED ' + bad : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
