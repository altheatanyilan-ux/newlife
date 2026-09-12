/* smoke124 — a piece of content serves a project, said plainly and both ways */
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
  const p = await b.newPage({viewport:{width:1500, height:1300}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  await p.evaluate(() => { location.hash = '#/content'; rerender(); }); await p.waitForTimeout(1500);

  const eid = await p.evaluate(() => S.entries.find(e => e.extra?.content)?.id);
  const prid = await p.evaluate(() => S.projects[0].id);
  const prname = await p.evaluate(i => byId(S.projects, i).name, prid);
  const open = async () => { await p.evaluate(i => openPieceDetail(i), eid); await p.waitForTimeout(1000); };

  console.log('\n1. the project has a section of its own, not a nameless dropdown');
  await open();
  yes('there is a section for it', !!(await p.$('#pcProjSec')));
  is('  with a heading that says what it is',
     await p.evaluate(() => document.querySelector('#pcProjSec .k').textContent.trim()),
     'the project it serves');
  yes('  and it sits among the other relationships, not in the quick fields',
      await p.evaluate(() => {
        const sec = document.querySelector('#pcProjSec');
        return sec.classList.contains('pd-sec') && !sec.closest('.pd-quick');
      }));
  yes('  the selector is inside it', await p.evaluate(() =>
    !!document.querySelector('#pcProjSec #pcProject')));
  yes('  and it offers every project', await p.evaluate(n =>
    document.querySelectorAll('#pcProject option').length === n + 1, await p.evaluate(() => S.projects.length)));
  yes('  saying so when nothing is chosen', await p.evaluate(() =>
    /Not part of anything bigger/.test(document.querySelector('#pcProjSec').textContent)));

  console.log('\n2. choosing one files the piece, and opens a way through');
  await p.selectOption('#pcProject', prid); await p.waitForTimeout(1200);
  is('the piece is filed under it',
     await p.evaluate(i => (byId(S.entries, i).links.projects || [])[0], eid), prid);
  const link = await p.$('#pcProjSec .pcd-projlink');
  yes('a link to the project appears with the choice', !!link);
  yes('  named after it', /↗ open/.test(await p.evaluate(() =>
    document.querySelector('.pcd-projlink').textContent)) &&
    (await p.evaluate(() => document.querySelector('.pcd-projlink').textContent)).includes(prname), prname);
  is('  pointing at that project',
     await p.evaluate(() => document.querySelector('.pcd-projlink').getAttribute('href')), '#/projects/' + prid);
  yes('  and the empty note is gone', await p.evaluate(() =>
    !/Not part of anything bigger/.test(document.querySelector('#pcProjSec').textContent)));

  console.log('\n3. it holds, and the project knows about the piece');
  await p.evaluate(() => flushSave());
  await p.reload(); await p.waitForTimeout(2800);
  is('the filing survives a reload',
     await p.evaluate(i => (byId(S.entries, i).links.projects || [])[0], eid), prid);
  await p.evaluate(i => openPieceDetail(i), eid); await p.waitForTimeout(1100);
  is('  and the panel still shows it',
     await p.evaluate(() => document.querySelector('#pcProject').value), prid);
  /* the whole point of writing it on the entry's own links: the project's
     page finds the piece without knowing anything about Content */
  await p.evaluate(() => closePanel()); await p.waitForTimeout(400);
  await p.evaluate(i => { location.hash = '#/projects/' + i; rerender(); }, prid);
  await p.waitForTimeout(1600);
  const title = await p.evaluate(i => byId(S.entries, i).title, eid);
  yes('the project page mentions the piece',
      await p.evaluate(t => document.body.textContent.includes(t), title), title);

  console.log('\n4. it can be taken back out again');
  await p.evaluate(() => { location.hash = '#/content'; rerender(); }); await p.waitForTimeout(1300);
  await p.evaluate(i => openPieceDetail(i), eid); await p.waitForTimeout(1000);
  await p.selectOption('#pcProject', ''); await p.waitForTimeout(1200);
  is('nothing is filed', await p.evaluate(i => (byId(S.entries, i).links.projects || []).length, eid), 0);
  yes('  the link is gone with it', !(await p.$('#pcProjSec .pcd-projlink')));
  yes('  and the section says so again', await p.evaluate(() =>
    /Not part of anything bigger/.test(document.querySelector('#pcProjSec').textContent)));

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke124  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
