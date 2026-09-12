/* smoke114 — a piece can be part of a project, and the project knows it */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('/home/user/newlife/index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1500, height:1100}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  await p.evaluate(() => { location.hash = '#/content'; }); await p.waitForTimeout(1800);

  const pieceId = await p.evaluate(() => contentPieces()[0]?.id);
  const projId  = await p.evaluate(() => S.projects[0].id);
  const projName = await p.evaluate(i => byId(S.projects, i).name, projId);
  const pieceName = await p.evaluate(i => byId(S.entries, i).title, pieceId);
  yes('there is a piece and a project to join', !!pieceId && !!projId);

  console.log('\n1. the piece panel asks which project it is part of');
  await p.evaluate(i => openPieceDetail(i), pieceId); await p.waitForTimeout(1000);
  yes('the picker is there', !!(await p.$('#pcProject')));
  yes('  with a way to belong to none', await p.evaluate(() =>
    document.querySelector('#pcProject option').value === ''));
  yes('  and every project on it', await p.evaluate(() =>
    document.querySelectorAll('#pcProject option').length === S.projects.length + 1));
  is('  nothing chosen to begin with', await p.evaluate(() => document.querySelector('#pcProject').value), '');

  console.log('\n2. choosing one files the piece under it');
  await p.selectOption('#pcProject', projId);
  await p.waitForTimeout(1000);
  is('written on the entry’s own project links',
     await p.evaluate(i => (byId(S.entries, i).links.projects || []).join(','), pieceId), projId);
  yes('  which is what every other room reads', await p.evaluate(i =>
    entriesLinked('projects', i).some(e => e.type === 'writing'), projId));

  console.log('\n3. the project lists it as a piece, not as an anonymous entry');
  await p.evaluate(() => closePanel());
  await p.evaluate(() => { location.hash = '#/projects'; }); await p.waitForTimeout(1600);
  await p.evaluate(i => openProjectPanel(i), projId); await p.waitForTimeout(1200);
  const row = await p.evaluate(() => { const n = document.querySelector('[data-pjpiece]');
    return n ? {id: n.dataset.pjpiece, text: n.textContent.replace(/\s+/g, ' ').trim()} : null; });
  yes('there is a Pieces section', await p.evaluate(() => /Pieces/.test(document.querySelector('#panel').textContent)));
  yes('  with the piece in it', row && row.id === pieceId, JSON.stringify(row));
  yes('  named', row.text.includes(pieceName), row.text);
  yes('  and saying what state it is in', /idea|outline|draft|ready|published|Idea|Outline|Draft|Ready|Published/.test(row.text), row.text);

  console.log('\n3b. clicking it opens the piece');
  await p.click('[data-pjpiece]');
  await p.waitForTimeout(1200);
  yes('the piece panel opened', !!(await p.$('#pcProject')));
  is('  and it is the right piece', await p.evaluate(() => document.querySelector('#pcTitle').value), pieceName);
  is('  still filed under the project', await p.evaluate(() => document.querySelector('#pcProject').value), projId);

  console.log('\n4. it can be taken out again');
  await p.selectOption('#pcProject', '');
  await p.waitForTimeout(1000);
  is('the link is gone', await p.evaluate(i => (byId(S.entries, i).links.projects || []).length, pieceId), 0);
  await p.evaluate(() => closePanel());
  await p.evaluate(() => { location.hash = '#/projects'; }); await p.waitForTimeout(1500);
  await p.evaluate(i => openProjectPanel(i), projId); await p.waitForTimeout(1100);
  yes('and the project no longer lists it', !(await p.$('[data-pjpiece]')));

  console.log('\n5. it survives a reload');
  await p.evaluate(([pi, pj]) => { pieceSetProject(byId(S.entries, pi), pj); }, [pieceId, projId]);
  await p.evaluate(() => flushSave());
  await p.reload(); await p.waitForTimeout(2600);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  is('still part of the project',
     await p.evaluate(i => (byId(S.entries, i).links.projects || []).join(','), pieceId), projId);

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke114  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
