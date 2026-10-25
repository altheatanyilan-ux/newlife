/* smoke-recordkeeper — the record keeper: owed records, closed rooms, borrows, the night watch, the morning after */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const yes = (n, c, g='') => { if(c) console.log('  ok   ' + n); else { bad++; console.log('  FAIL ' + n + '  — ' + JSON.stringify(g)); } };
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const errs = [];
  const ctx = await b.newContext({viewport: {width: 1300, height: 950}});
  await ctx.addInitScript(() => {
    const R = Date; let off = 0;
    class FD extends R { constructor(...a){ if(a.length) super(...a); else super(R.now() + off); } static now(){ return R.now() + off; } }
    window.Date = FD;
    window.__clock = (dayShift, hm) => { const n = new R(), [h, m] = hm.split(':').map(Number), t = new R(n.getFullYear(), n.getMonth(), n.getDate() + dayShift, h, m, 0); off = t.getTime() - R.now(); };
    window.__rkForce = true; window.__rkNoWait = true;
  });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  const q = (f, a) => p.evaluate(f, a);
  const clean = () => q(() => { document.querySelectorAll('.toast, #toasts > *').forEach(t => t.remove()); document.querySelectorAll('#modals .overlay').forEach(t => t.remove()); });
  const go = async h => { await q(x => { location.hash = '#/today'; }); await p.waitForTimeout(250); await q(x => { location.hash = x; }, h); await p.waitForTimeout(900); };
  await q(() => { S.settings.rescueGate = 'off'; S.settings.rescueCarry = false; S.settings.sleepTime = '23:00'; S.accountability = undefined; S.entries = S.entries.filter(e => e.occurredAt !== today()); saveNow(); __clock(0, '13:00'); });
  await go('#/songwriting');
  yes('off: nothing is owed and nothing is shut', !(await p.$('.rk-lock')) && !(await p.$('.rk-strip')));

  await q(() => { const a = rkState(); a.mode = 'strict'; a.since = today(); delete S.dailyRhythm[today()]; delete S.plans[today()]; saveNow(); });
  await go('#/songwriting');
  const g1 = await q(() => ({lock: !!document.querySelector('.rk-lock'), forms: document.querySelectorAll('.rk-q').length, owed: rkOwed().map(r => r.id)}));
  yes('strict at 13:00 with nothing written: the room is shut and says what is owed', g1.lock && g1.owed.includes('wake') && g1.owed.includes('plan') && g1.forms >= 2, g1);
  await go('#/today');
  yes('Today stays open, with the strip', !(await q(() => !!document.querySelector('.rk-lock'))) && !!(await p.$('.rk-strip')));
  yes('the sidebar door is marked shut', await q(() => !!document.querySelector('#sidebar a[data-page="songwriting"].rk-shut')));

  await go('#/songwriting');
  await q(() => { document.querySelector('.rk-q [data-rk=t]').value = '08:15'; document.querySelector('.rk-q [data-rk=ok]').click(); });
  await p.waitForTimeout(900);
  const w = await q(() => dayWakeHM(today()));
  yes('writing the wake time puts it on the day', w === '08:15', w);
  await q(() => { document.querySelector('.rk-q [data-rk=ok]').click(); }); await p.waitForTimeout(300);
  yes('an empty plan is refused', await q(() => !!document.querySelector('.rk-lock') && !rkPlanned(today())));
  await q(() => { const c = document.querySelector('.rk-q'); c.querySelector('[data-rk=i0]').value = 'Finish the bridge'; c.querySelector('[data-rk=i1]').value = 'Call the bank'; c.querySelector('[data-rk=fm]').value = 'open the lyrics'; c.querySelector('[data-rk=ok]').click(); });
  await p.waitForTimeout(1100);
  yes('once everything is written the room opens', !(await p.$('.rk-lock')) && await q(() => rkPlanned(today()) && dayPlan(today()).firstMove === 'open the lyrics'));

  await q(() => __clock(0, '20:30')); await go('#/songwriting');
  yes('at 20:30 one line about today is owed and shuts the room again', await q(() => !!document.querySelector('.rk-lock') && rkOwed().map(r => r.id).join() === 'trace'), await q(() => ({o: rkOwed().map(r => r.id), l: !!document.querySelector('.rk-lock'), t: today(), n: new Date().toString(), e: S.entries.filter(e => e.occurredAt === today()).length})));
  await q(() => { const c = document.querySelector('.rk-q'); c.querySelector('[data-rk=t]').value = 'Wrote two verses and sorted the bank thing'; c.querySelector('[data-rk=ok]').click(); });
  await p.waitForTimeout(1100);
  yes('writing it opens the room and leaves a reflection entry', !(await p.$('.rk-lock')) && await q(() => S.entries.some(e => e.title === 'Day so far' && e.occurredAt === today())));

  /* borrow */
  await q(() => { __clock(0, '13:00'); delete S.dailyRhythm[today()].wakeTime; const c = S.checkins && S.checkins[today()]; if(c) delete c.wakeAt; saveNow(); }); await go('#/songwriting');
  yes('with the wake time gone the room is shut again', await q(() => !!document.querySelector('.rk-lock')));
  await q(() => { document.querySelector('.rk-borrow').open = true; });
  yes('borrowing needs a real sentence', await q(() => document.querySelector('#rkLend').disabled));
  await p.fill('#rkWhy', 'The publisher needs the lyrics sheet by one o’clock'); await p.waitForTimeout(150);
  await q(() => document.querySelector('#rkLend').click()); await p.waitForTimeout(900);
  yes('a borrow opens the room, is counted and is on the record', !(await p.$('.rk-lock')) && await q(() => rkState().borrowLog.length === 1 && rkBorrowsLeft() === 2 && rkPassActive()));

  /* the night watch */
  await q(() => { rkState().pass = 0; dayWakeHM(today()) || daySetWake(today(), '08:00'); __clock(0, '23:10'); saveNow(); }); await go('#/today'); await clean();
  await q(() => rkTick()); await p.waitForTimeout(500);
  yes('at 23:10 the house asks what you are doing', await q(() => /What are you doing/.test(document.querySelector('#modals .modal').textContent)));
  await q(() => document.querySelector('#rkB').click()); await p.waitForTimeout(200);
  await q(() => document.querySelector('#rkGo').click());
  yes('"it has to be done" needs the what and the cost', await q(() => !!document.querySelector('#modals #rkGo')));
  await q(() => { document.querySelector('#rkW').value = 'send the invoice'; document.querySelector('#rkX').value = 'the client pays a week late'; document.querySelector('#rkGo').click(); }); await p.waitForTimeout(400);
  const n1 = await q(() => { const n = rkNight(rkNightDay()); return {need: n.need.length, asked: n.asked, snooze: n.snooze > Date.now()}; });
  yes('the claim is written down and the watch waits', n1.need === 1 && n1.asked === 1 && n1.snooze, n1);
  await clean(); await q(() => rkTick()); await p.waitForTimeout(300);
  yes('while it waits there is no second question', !(await p.$('#modals .modal')));
  await q(() => { rkNight(rkNightDay()).snooze = 0; __clock(0, '23:50'); rkTick(); }); await p.waitForTimeout(500);
  const ex = await q(() => ({txt: (document.querySelector('.rk-q-h') || {}).textContent, stay: document.querySelector('#rkStay') && document.querySelector('#rkStay').disabled, said: /send the invoice/.test(document.querySelector('#modals .modal').textContent)}));
  yes('the second time it is a harder question, and quotes what you said had to be done', RK_Q(ex.txt) && ex.stay && ex.said, ex);
  await p.fill('#rkAns', 'I am putting off the thing I do not want to do'); await q(() => document.querySelector('#rkStay').click()); await p.waitForTimeout(300);
  yes('"still here" only after answering, and the answer is kept', await q(() => rkNight(rkNightDay()).answers.length === 1 && rkNight(rkNightDay()).snooze > Date.now()));

  await clean(); await q(() => __clock(1, '00:40')); await go('#/songwriting');
  yes('after midnight strict shuts the rooms whatever is written', await q(() => !!document.querySelector('.rk-lock') && /shut until morning/.test(document.querySelector('.rk-lock h1').textContent)));
  await q(() => document.querySelector('#rkToBed').click()); await p.waitForTimeout(300);
  await p.fill('#rkFirst', 'open the score'); await q(() => document.querySelector('#rkNight').click()); await p.waitForTimeout(500);
  const sl = await q(() => ({screen: !!document.getElementById('rkSleep'), bed: dayBedHM(rkNightDay()), first: ((S.plans[addDays(rkNightDay(), 1)] || {}).firstMove)}));
  yes('going to bed records the time, the first move, and darkens the screen', sl.screen && /^\d\d:\d\d$/.test(sl.bed) && sl.first === 'open the score', sl);
  await q(() => { rkNight(rkNightDay()).last = '00:40'; saveNow(); });

  /* morning after */
  await q(() => { document.getElementById('rkSleep') && document.getElementById('rkSleep').remove(); __clock(1, '09:00'); }); await go('#/songwriting');
  const m1 = await q(() => ({lock: !!document.querySelector('.rk-lock'), owed: rkOwed().map(r => r.id)}));
  yes('next morning the late night is owed on the record and shuts the room', m1.lock && m1.owed.includes('late'), m1);
  await q(() => { const c = [...document.querySelectorAll('.rk-q')].find(x => /Last night/.test(x.textContent)); c.querySelector('[data-rk=ok]').click(); });
  yes('it needs all three answers', await q(() => !rkNight(addDays(today(), -1)).debrief));
  await q(() => { const c = [...document.querySelectorAll('.rk-q')].find(x => /Last night/.test(x.textContent)); c.querySelector('[data-rk=what]').value = 'invoice then scrolling'; c.querySelector('input[name=rkNeed][value=no]').checked = true; c.querySelector('[data-rk=fix]').value = 'laptop shut at eleven'; c.querySelector('[data-rk=ok]').click(); });
  await p.waitForTimeout(800);
  yes('answered, the night is accounted for', await q(() => { const d = rkNight(addDays(today(), -1)).debrief; return !!d && d.need === 'no' && !rkOwed().some(r => r.id === 'late'); }));

  /* ledger and settings */
  await go('#/accountability');
  yes('the ledger shows the night, the borrow and the days', await q(() => { const t = document.querySelector('#main').textContent; return /invoice then scrolling/.test(t) && /publisher needs the lyrics/.test(t) && document.querySelectorAll('.rk-day').length === 14; }));
  await go('#/settings');
  yes('Settings has the card with the dials and the rooms', await q(() => !!document.querySelector('#rkCard #sRkMode') && document.querySelectorAll('[data-rkroom]').length === RK_ROOMS.length));
  await q(() => { rkState().borrowLog = []; delete S.plans[today()]; __clock(1, '13:00'); saveNow(); });
  await q(() => { const m = document.querySelector('#sRkMode'); m.value = 'off'; m.onchange(); }); await p.waitForTimeout(400);
  yes('easing off with something owed asks why', await q(() => /Easing off/.test((document.querySelector('#modals .modal') || {textContent: ''}).textContent) && rkState().mode === 'strict'));
  /* "nothing in particular" goes straight to the hard question; coming back after goodnight costs a sentence */
  await clean(); await q(() => { rkState().mode = 'gentle'; __clock(2, '01:10'); const n = rkNight(rkNightDay(), true); n.snooze = 0; n.asked = 0; n.sleeping = false; rkTick(); }); await p.waitForTimeout(400);
  await q(() => document.querySelector('#rkC').click()); await p.waitForTimeout(300);
  yes('"Nothing in particular" is met with the hard question', await q(() => !!document.querySelector('.rk-q-h') && /\?$/.test(document.querySelector('.rk-q-h').textContent.trim())));
  await clean(); await q(() => { const n = rkNight(rkNightDay()); n.sleeping = true; rkSleepScreen(); });
  await q(() => document.querySelector('#rkBack').click()); await p.waitForTimeout(200);
  await q(() => document.querySelector('#rkBO').click());
  yes('coming back after goodnight needs a sentence', await q(() => !!document.getElementById('rkSleep') && rkNight(rkNightDay()).relapses.length === 0));
  await q(() => { document.querySelector('#rkBW').value = 'forgot to attach the file to the email'; document.querySelector('#rkBO').click(); });
  yes('and is written down', await q(() => !document.getElementById('rkSleep') && rkNight(rkNightDay()).relapses.length === 1));
  console.log(errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'no page errors'); if(errs.length) bad++;
  await b.close(); console.log(bad ? 'FAILED ' + bad : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
function RK_Q(t){ return !!t && /\?$/.test(t.trim()); }
