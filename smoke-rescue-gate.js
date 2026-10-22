/* smoke-rescue-gate — the one thing, before the rescue page */
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
  const q = s => p.evaluate(s);
  await q(() => { const t = commitQuickTask('send the grant report', {listId: 'inbox'}); t.day = addDays(today(), -3); saveNow(); });
  const open = async () => { await q(() => { location.hash = '#/today'; }); await p.waitForTimeout(500); await q(() => { location.hash = '#/rescue/new'; }); await p.waitForTimeout(1300); };

  console.log('\n1. the gate stands in front of the page');
  await open();
  yes('it is up, and the page is locked behind it', await q(() => !!document.querySelector('.rs-gate') && document.querySelector('[data-rs-page]').classList.contains('gated')));
  yes('the oldest late thing is already chosen', await q(() => /send the grant report/.test(document.querySelector('.rg-c.on') ? document.querySelector('.rg-c.on').textContent : '') && /3 days late/.test(document.body.textContent)));
  yes('the ready-the-room card waits behind it', !(await p.$('.rs-ready')));

  console.log('\n2. pick, shrink, sprint');
  await p.click('#rgGo'); await p.waitForTimeout(300);
  yes('it asks for the first move', await q(() => !!document.querySelector('#rgStep') && document.querySelectorAll('[data-ex]').length >= 10));
  await p.click('#rgBegin'); yes('an empty move is refused', await q(() => !!document.querySelector('#rgStep')));
  await p.click('[data-st="0"]'); await p.click('[data-m="2"]'); await p.click('[data-ex="after"]');
  yes('an expected excuse is answered in advance', await q(() => /Before the page, not after it/.test(document.querySelector('#rgExBack').textContent)));
  await p.click('#rgBegin'); await p.waitForTimeout(6600);
  const sp = await q(() => { const g = _rs.sheet.gate; return {status: g.status, clock: (document.querySelector('#rgClock') || {}).textContent, mins: g.sprint && g.sprint.mins, real: !_rs.sheet._virtual, excuseN: (S.settings.rescueExcuseN || {}).after}; });
  yes('5-4-3-2-1, then a two-minute clock', sp.status === 'sprint' && /^0[12]:/.test(sp.clock) && sp.mins === 2 && sp.real && sp.excuseN === 1, sp);
  await p.fill('#rgPark', 'email Sam about lunch'); await p.press('#rgPark', 'Enter');
  yes('a nagging thought is parked, not followed', await q(() => _rs.sheet.gate.parked.length === 1 && /1 parked/.test(document.querySelector('#rgParkN').textContent)));
  await p.click('#rgStuck'); await p.click('[data-k="big"]'); await p.fill('#rgS', 'type only the title'); await p.click('#rgOk');
  yes('stuck is a way through: the move is halved and the clock goes on', await q(() => document.querySelector('.rg-step').textContent === 'type only the title' && _rs.sheet.gate.stuck.length === 1 && _rs.sheet.gate.status === 'sprint'));
  await p.click('#rgDid'); await p.waitForTimeout(300);
  yes('done counts as a start, and asks if it is finished', await q(() => _rs.sheet.gate.status === 'started' && !!document.querySelector('[data-a="page"]')));
  await p.click('[data-a="page"]'); await p.waitForTimeout(600);
  const after = await q(() => ({gate: !!document.querySelector('.rs-gate'), tether: (document.querySelector('.rs-tether') || {}).textContent || '', boxes: rescueLive(_rs.sheet).map(b => b.text), cap: !!_rs.sheet.gate.capEndsAt, ready: !!document.querySelector('.rs-ready'), locked: document.querySelector('[data-rs-page]').classList.contains('gated')}));
  yes('the page opens, with what was parked on it', !after.gate && !after.locked && after.boxes.includes('email Sam about lunch'), after);
  yes('a strip keeps the thing in view, and a time-box is running', /Started/.test(after.tether) && after.cap, after);

  console.log('\n3. the time-box rings');
  await q(() => { _rs.sheet.gate.capEndsAt = new Date(Date.now() - 1000).toISOString(); }); await p.waitForTimeout(1500);
  yes('“enough page”', await q(() => /Enough page/.test((document.querySelector('.rs-gate') || {}).textContent || '')));
  await p.click('#rgMore'); await p.waitForTimeout(200);
  yes('ten more minutes the first time, free', await q(() => !document.querySelector('.rs-gate') && _rs.sheet.gate.ext === 1));

  console.log('\n4. “not now” is a promise');
  await open();
  await p.click('#rgNot'); await p.waitForTimeout(300);
  const d0 = await q(() => ({disabled: document.querySelector('#rgOk').disabled, nrem: S.tasks.filter(t => t.remind).length}));
  yes('there is a breath before it can be accepted', d0.disabled, d0);
  await q(() => { document.querySelector('#rgDo').value = 'open the report and type the title'; });
  await p.waitForTimeout(10800);
  await p.click('#rgOk'); yes('and a cost is required', await q(() => !!document.querySelector('.rs-gate')));
  await p.fill('#rgCost', 'the funder waits another week and trust slips'); await p.click('#rgOk'); await p.waitForTimeout(400);
  const dd = await q(() => ({gate: !!document.querySelector('.rs-gate'), st: _rs.sheet.gate.status, rem: S.tasks.filter(t => t.remind && /Promised/.test(t.text)).length, tether: (document.querySelector('.rs-tether') || {}).textContent || ''}));
  yes('a reminder is made, and the strip says what was promised', !dd.gate && dd.st === 'deferred' && dd.rem === 1 && /Promised/.test(dd.tether), dd);

  console.log('\n5. landing asks again');
  await q(() => { const g = _rs.sheet.gate; g.deferrals = []; g.status = 'open'; });
  const land = await q(() => { const h = rescueGateLandHTML(_rs.sheet); return /not started/.test(h) && /rgLDay/.test(h); });
  yes('a thing not begun needs an hour before the page is put down', land);

  await q(() => { _rs.sheet.gate.status = 'open'; rescueGateShut(document); rescueLand(document); }); await p.waitForTimeout(300);
  yes('the landing form holds an hour for it', !!(await p.$('#rgLand')) && (await p.inputValue('#rlNext')) !== undefined);
  await p.click('#rlGo'); await p.waitForTimeout(400);
  yes('landing with an hour promises it', await q(() => { const x = rescueSheets().filter(s => rescueGateOf(s)).slice(-1)[0]; return x && x.landing && x.gate.status === 'deferred' && x.gate.deferrals.slice(-1)[0].atLanding; }));

  console.log('\n6. the settings');
  await q(() => { S.settings.rescueGate = 'off'; S.settings.rescueCarry = false; saveNow(); });
  await open();
  yes('with the gate off, the page just opens', !(await p.$('.rs-gate')));
  await q(() => { S.settings.rescueGate = 'hard'; saveNow(); location.hash = '#/settings'; }); await p.waitForTimeout(900);
  yes('the settings card is there', !!(await p.$('#sGate')) && !!(await p.$('#sGateCap')));
  yes('no page errors', !errs.length, errs);
  await b.close(); process.exit(bad ? 1 : 0);
})();
