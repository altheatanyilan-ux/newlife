/* smoke-analysis-export — the file for an AI: presence, the day's statement, the export, what was not touched */
const {chromium} = require('playwright');
const path = require('path'), fs = require('fs');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const yes = (n, c, g='') => { if(c) console.log('  ok   ' + n); else { bad++; console.log('  FAIL ' + n + '  — ' + JSON.stringify(g)); } };
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const errs = [];
  const ctx = await b.newContext({viewport: {width: 1300, height: 950}, acceptDownloads: true});
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  const q = (f, a) => p.evaluate(f, a);
  const clean = () => q(() => { document.querySelectorAll('.toast, #toasts > *').forEach(t => t.remove()); });
  await q(() => { S.settings.rescueGate = 'off'; S.accountability = undefined; saveNow(); });

  /* presence */
  await q(() => { presenceBeat(); presenceBeat(); });
  const pr = await q(() => { const a = rkState(), d = isoDay(new Date()); return {since: a.presenceSince === d, n: (a.presence[d] || []).length, day: presenceDay(d)}; });
  yes('opening the house is recorded as a sitting, whether or not the keeper is on', pr.since && pr.n === 1 && pr.day && pr.day.first, pr);
  await q(() => { const a = rkState(), T = today(), y1 = addDays(T, -1), y2 = addDays(T, -2);
    a.presenceSince = y2; a.presence[y1] = [{s: y1 + 'T08:40', e: y1 + 'T09:30', act: 40}, {s: y1 + 'T23:20', e: y1 + 'T23:50', act: 25}]; a.presence[y2] = [{s: y2 + 'T10:05', e: y2 + 'T10:35', act: 20}];
    a.presence[addDays(T, -1)].push({s: y1 + 'T23:55', e: y1 + 'T23:59', act: 3});
    daySetWake(y1, '08:30'); rhythmDay(y1).sleepTime = '00:40'; rhythmDay(y2).sleepTime = '23:30'; daySetWake(T, '09:00'); daySetWake(y2, '09:50');
    S.entries.push({id: uid(), type: 'reflection', title: 'Bad day', body: 'I drifted and scrolled instead of finishing the report.', occurredAt: y1, createdAt: new Date(y1 + 'T23:41:00').toISOString(), emotions: ['Restless'], tags: [], extra: {}, links: {}});
    (S.wins = S.wins || []).push({id: uid(), createdAt: new Date(addDays(T, -40) + 'T10:00:00').toISOString(), text: 'old win'});
    saveNow(); });
  const pd = await q(() => presenceDay(addDays(today(), -1)));
  yes('a day knows first open, last seen, active minutes and the late ones', pd.first === '08:40' && pd.last === '23:59' && pd.activeMin === 68 && pd.lateMin >= 34, pd);

  /* the day's line */
  await q(() => rkSayToday()); await p.waitForTimeout(300);
  await q(() => { const c = document.querySelector('#rkSay'); c.querySelector('[data-rk=ok]').click(); });
  yes('the day’s line needs words', await q(() => !S.entries.some(e => e.extra && e.extra.statement)));
  await q(() => { const c = document.querySelector('#rkSay'); c.querySelector('[data-rk=t]').value = 'Got the report outline done, then lost an hour to my phone.'; c.querySelector('input[name=rkDil]').checked = false; c.querySelector('input[name=rkDil][value="3"]').checked = true; c.querySelector('[data-rk=mood]').value = 'Restless'; c.querySelector('[data-rk=avoid]').value = 'emailing the landlord'; c.querySelector('[data-rk=ok]').click(); });
  await p.waitForTimeout(400);
  const st = await q(() => S.entries.find(e => e.extra && e.extra.statement));
  yes('it is kept as a reflection with diligence, feeling and what was avoided', st && st.extra.diligence === 3 && st.emotions[0] === 'Restless' && st.extra.avoided === 'emailing the landlord' && st.type === 'reflection', st);

  /* the data */
  const D = await q(() => { const T = today(); return axBuild(addDays(T, -2), T, {}); });
  const dy = D.days[1], d0 = D.days[2];
  yes('the days carry sleep, wake and presence', dy.woke === '08:30' && dy.bedtime_that_night === '00:40' && dy.hours_slept_that_night === 8.3 && dy.house_first_opened === '08:40' && dy.minutes_active === 68, dy);
  yes('and the plan, the closing and the writing that were missing say so', dy.planned_the_day === false && !dy.evening_review_closed_at && dy.wrote_entries >= 1 && d0.wrote_daily_statement && d0.diligence_self_rating === 3);
  yes('the summary computes the facts (bedtime median, late days, statements)', D.summary.median_bedtime && D.summary.days_active_30m_past_cutoff_or_before_6am >= 1 && D.summary.days_with_written_statement === 1, D.summary);
  yes('areas list what was not touched, with how long ago', D.areas.some(a => a.status === 'NOT TOUCHED in range' && a.last_activity) && D.areas.some(a => a.status === 'never used') && D.areas.some(a => a.status === 'touched'), D.areas.slice(0, 4));
  const md = await q(() => { const T = today(); return axMarkdown(axBuild(addDays(T, -2), T, {text: true}), {brief: true}); });
  yes('the Markdown has the brief, the summary, each day, the writing and the untouched table', /what I'd like from you/.test(md) && /## 1\. Summary/.test(md) && /### \d{4}-\d\d-\d\d/.test(md) && /I drifted and scrolled/.test(md) && /NOT TOUCHED|never used/.test(md) && /No plan was written/.test(md), md.slice(0, 200));
  const md2 = await q(() => { const T = today(); return axMarkdown(axBuild(addDays(T, -2), T, {text: false}), {brief: false}); });
  yes('text can be left out, and so can the brief', !/I drifted and scrolled/.test(md2) && !/what I'd like from you/.test(md2));

  /* the night log joins */
  await q(() => { const a = rkState(), y1 = addDays(today(), -1); a.nights[y1] = {first: '23:05', last: '00:40', asked: 3, need: [{at: '23:05', what: 'send the invoice', cost: 'paid late', mins: 20}], answers: [{at: '23:50', q: 'Why are you still on the laptop?', a: 'avoiding the report'}], relapses: [], sleeping: false, snooze: 0, debrief: {what: 'scrolling', need: 'no', fix: 'laptop shut at eleven'}}; });
  const md3 = await q(() => { const T = today(); return axMarkdown(axBuild(addDays(T, -2), T, {}), {}); });
  yes('the night watch’s questions and answers are in the file', /Why are you still on the laptop\?/.test(md3) && /avoiding the report/.test(md3) && /laptop shut at eleven/.test(md3));

  /* the dialog and the download */
  await q(() => { location.hash = '#/accountability'; }); await p.waitForTimeout(900); await clean();
  await q(() => document.querySelector('#rkAx').click()); await p.waitForTimeout(300);
  yes('the dialog offers the stretches', await q(() => document.querySelectorAll('[data-axp]').length === 8 && /week|day/.test(document.querySelector('#axInfo').textContent)));
  await q(() => document.querySelector('[data-axp="7"]').click());
  const [dl] = await Promise.all([p.waitForEvent('download'), q(() => document.querySelector('#axGo').click())]);
  const file = await dl.path(), txt = fs.readFileSync(file, 'utf8');
  yes('Download saves a .md named for the dates', /^life-record-\d{4}-\d\d-\d\d_to_\d{4}-\d\d-\d\d\.md$/.test(dl.suggestedFilename()) && /Life-tracking export/.test(txt) && /Median bedtime/.test(txt), dl.suggestedFilename());
  await q(() => { document.querySelector('#axFmt').value = 'json'; document.querySelector('#axFmt').onchange({target: document.querySelector('#axFmt')}); });
  const [dj] = await Promise.all([p.waitForEvent('download'), q(() => document.querySelector('#axGo').click())]);
  const j = JSON.parse(fs.readFileSync(await dj.path(), 'utf8'));
  yes('JSON has the same facts', /\.json$/.test(dj.suggestedFilename()) && j.days.length === 7 && j.summary && Array.isArray(j.areas) && j.record_keeper, Object.keys(j));
  await q(() => document.querySelector('.modal .close').click());
  await go_settings(p, q);
  console.log(errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'no page errors'); if(errs.length) bad++;
  await b.close(); console.log(bad ? 'FAILED ' + bad : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
async function go_settings(p, q){
  await q(() => { location.hash = '#/settings'; }); await p.waitForTimeout(900);
  const ok = await q(() => !!document.querySelector('#sRkAx') && !!document.querySelector('#sRkSay'));
  console.log(ok ? '  ok   Settings has both buttons' : '  FAIL Settings has both buttons'); if(!ok) process.exitCode = 1;
}
