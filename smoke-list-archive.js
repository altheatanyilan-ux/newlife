/* smoke-list-archive — a finished list is archived, not deleted */
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
  const id = await q(() => { const l = planNewList('Move flat'); const a = commitQuickTask('pack the books', {listId: l.id}), c = commitQuickTask('book the van', {listId: l.id});
    S._planSel = {kind: 'list', id: l.id}; saveNow(); location.hash = '#/today/tasks'; return l.id; });
  await p.waitForTimeout(1200);
  yes('the list is in the sidebar and offers no archive while tasks are open', !!(await p.$(`[data-plsel="list:${id}"]`)) && !(await p.$('[data-plarchive]')));
  await q(() => { (S.tasks.filter(t => t.listId === planList(S._planSel.id).id)).forEach(t => planSetDone(t, true)); rerender(); }); await p.waitForTimeout(600);
  yes('all done: the header offers to archive it', !!(await p.$(`[data-plarchive="${id}"]`)));
  await p.click(`[data-plarchive="${id}"]`); await p.waitForTimeout(600);
  const st2 = await p.evaluate(id => ({arch: !!planList(id).archivedAt, kept: S.tasks.filter(t => t.listId === id).length, side: !!document.querySelector(`#plLists > [data-plsel="list:${id}"]`), archSec: /Archived/.test((document.querySelector('#plArch') || {}).textContent || ''), live: planListsLive().some(l => l.id === id), active: planListActive(planList(id))}), id);
  yes('archived: kept with its tasks, out of the sidebar, out of the live lists', st2.arch && st2.kept === 2 && !st2.side && !st2.live && !st2.active, st2);
  yes('and an Archived section holds it', st2.archSec, st2);
  await p.click('#plArchToggle').catch(() => {}); await p.waitForTimeout(300);
  await p.click(`#plArch [data-plsel="list:${id}"]`); await p.waitForTimeout(500);
  yes('opened from there it says archived, with a way back', !!(await p.$(`[data-plrestore="${id}"]`)) && /archived/.test(await q(() => document.querySelector('.pl-archtag').textContent)));
  yes('the move-to-list pickers no longer offer it', await q(id => !planListsLive().some(l => l.id === id), id));
  await p.click(`[data-plrestore="${id}"]`); await p.waitForTimeout(500);
  yes('brought back: in the sidebar again', !!(await p.$(`#plLists > [data-plsel="list:${id}"]`)) && await q(id => !planList(id).archivedAt, id));
  /* with open tasks: asks */
  const id2 = await q(() => { const l = planNewList('Garden'); commitQuickTask('mow the lawn', {listId: l.id}); saveNow(); rerender(); return l.id; }); await p.waitForTimeout(500);
  await q(id => planArchiveListFlow(id), id2); await p.waitForTimeout(300);
  yes('a list with open tasks asks what to do with them', !!(await p.$('#plaInbox')));
  await p.click('#plaInbox'); await p.waitForTimeout(400);
  yes('they go to the Inbox, the list is archived', await q(id => planList(id).archivedAt && S.tasks.find(t => t.text === 'mow the lawn').listId === 'inbox', id2));
  yes('and the edit form can archive too', await q(() => { const l = planNewList('Temp'); saveNow(); openPlanListModal(l.id); return !!document.querySelector('#plnArchive') && !!document.querySelector('#plnDel'); }));
  yes('no page errors', !errs.length, errs);
  await b.close(); process.exit(bad ? 1 : 0);
})();
