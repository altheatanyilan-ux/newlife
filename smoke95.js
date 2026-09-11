/* smoke95 — a picker wherever a date or a time is asked */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('/home/user/newlife/index.html');
let bad = 0;
const ok  = (n, extra='') => console.log(`  ok   ${n}${extra?'  — '+extra:''}`);
const no  = (n, got='')   => { bad++; console.log(`  FAIL ${n}${got!==''?'  — '+got:''}`); };
const is  = (n, a, b)     => a === b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n, c, got='')=> c ? ok(n) : no(n, got);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1440, height:900}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  /* the webfont link cannot be reached from a file:// page in this sandbox */
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1400);

  console.log('\n1. the Occurred at field on a new journal entry');
  await p.evaluate(() => { location.hash = '#/journals'; });
  await p.waitForTimeout(500);
  await p.evaluate(() => openEntryModal({type:'reflection'}));
  await p.waitForTimeout(400);
  yes('the field is still free text, so “Summer 2019” still goes in',
      await p.$eval('#eWhen', i => i.type) === 'text');
  yes('it carries a calendar button', !!(await p.$('[data-dpfor="eWhen"]')));
  yes('no calendar is up before you ask for one', !(await p.$('.dp-pop')));
  await p.click('[data-dpfor="eWhen"]');
  await p.waitForTimeout(250);
  yes('touching the button opens the calendar', !!(await p.$('.dp-pop')));
  const dayCount = await p.$$eval('.dp-pop [data-dpd]', n => n.length);
  yes('with a month of days in it', dayCount >= 28 && dayCount <= 31, String(dayCount));
  const pick = await p.$$eval('.dp-pop [data-dpd]', n => n[14].dataset.dpd);
  await p.click(`.dp-pop [data-dpd="${pick}"]`);
  await p.waitForTimeout(250);
  is('choosing a day writes it into the field', await p.$eval('#eWhen', i => i.value), pick);
  yes('and the calendar closes behind it', !(await p.$('.dp-pop')));
  const saved = await p.evaluate(async pickv => {
    document.querySelector('#eTitle').value = 'picker probe';
    document.querySelector('#eBody').value = 'x';
    document.querySelector('#eSave').click();
    await new Promise(r => setTimeout(r, 400));
    const e = S.entries.find(x => x.title === 'picker probe');
    return e ? e.occurredAt : null;
  }, pick);
  is('and the entry is filed under that day', saved, pick);
  await p.evaluate(() => { const i = S.entries.findIndex(x => x.title==='picker probe'); if(i>=0) S.entries.splice(i,1); saveNow(); });

  console.log('\n1b. and the same button on the keyboard');
  await p.evaluate(() => { closeModals(); openEntryModal({type:'reflection'}); });
  await p.waitForTimeout(400);
  await p.focus('[data-dpfor="eWhen"]');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(250);
  yes('Tab to the button and press Enter and the calendar opens', !!(await p.$('.dp-pop')));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(150);
  yes('Escape closes it without closing the entry behind it',
      !(await p.$('.dp-pop')) && !!(await p.$('#eWhen')));
  await p.evaluate(() => closeModals());

  console.log('\n2. typed prose still reaches the field untouched');
  await p.evaluate(() => { closeModals(); openEntryModal({type:'memory'}); });
  await p.waitForTimeout(400);
  await p.click('#eWhen');
  await p.$eval('#eWhen', i => { i.value = ''; });
  await p.type('#eWhen', 'Summer 2019');
  await p.waitForTimeout(150);
  yes('clicking into the field does not open a calendar over it', !(await p.$('.dp-pop')));
  is('and the fuzzy date is exactly what was typed', await p.$eval('#eWhen', i => i.value), 'Summer 2019');
  await p.evaluate(() => closeModals());

  console.log('\n3. the clock on Today, where a waking hour is asked');
  await p.evaluate(() => { location.hash = '#/today'; });
  await p.waitForTimeout(800);
  const woke = await p.$('#wokeAt');
  if(!woke) no('Today has a place to set the waking hour', '#wokeAt not on the page');
  else {
    await woke.click();
    await p.waitForTimeout(400);
    yes('it opens a modal with a time field', !!(await p.$('#clkV')));
    yes('no clock is up until the field is touched', !(await p.$('.tp-pop')));
    await p.click('#clkV');
    await p.waitForTimeout(300);
    const up = !!(await p.$('.tp-pop'));
    yes('touching the field opens the clock', up);
    if(up){
      const hrs  = await p.$$eval('.tp-pop [data-tph]', n => n.length);
      const mins = await p.$$eval('.tp-pop [data-tpm]', n => n.length);
      yes('24 hours down one column and the five-minute marks down the other',
          hrs === 24 && mins >= 12, `${hrs} hours, ${mins} minutes`);
      yes('it sits above the modal it belongs to',
          await p.evaluate(() => { const z = n => +getComputedStyle(n).zIndex || 0;
            return z(document.querySelector('.tp-pop')) > z(document.querySelector('.overlay')); }));
      await p.click('.tp-pop [data-tph="7"]');
      await p.waitForTimeout(150);
      await p.click('.tp-pop [data-tpm="30"]');
      await p.waitForTimeout(200);
      is('choosing 07 then 30 sets 07:30', await p.$eval('#clkV', i => i.value), '07:30');
      is('and the clock says so in the words people use',
         await p.$eval('.tp-pop .tp-val', n => n.textContent), '7:30 am');
      await p.click('.tp-pop [data-tpnow]');
      await p.waitForTimeout(200);
      const nowV = await p.$eval('#clkV', i => i.value);
      const realNow = await p.evaluate(() => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; });
      is('“now” puts the hour you are actually in', nowV, realNow);
      await p.keyboard.press('Escape');
      await p.waitForTimeout(200);
      yes('Escape puts the clock away and leaves the modal standing',
          !!(await p.$('.overlay')) && !(await p.$('.tp-pop')));
    }
    await p.evaluate(() => closeModals());
  }

  console.log('\n4. a planning task’s due time');
  const tid = await p.evaluate(() => {
    const t = {id: uid(), text: 'picker probe task', done: false, day: today(),
      createdAt: new Date().toISOString(), tags: [], subtasks: []};
    planTaskDefaults(t); S.tasks.push(t); saveNow(); return t.id;
  });
  await p.evaluate(id => openPlanTask(id), tid);
  await p.waitForTimeout(600);
  const dueTime = await p.$('#pdTime');
  if(!dueTime) no('a task’s due time opens a clock', '#pdTime not found');
  else {
    await dueTime.click();
    await p.waitForTimeout(300);
    yes('a task’s due time opens a clock', !!(await p.$('.tp-pop')));
    await p.click('.tp-pop [data-tph="9"]');
    await p.waitForTimeout(150);
    await p.click('.tp-pop [data-tpm="15"]');
    await p.waitForTimeout(300);
    is('and what it chooses is saved on the task',
       await p.evaluate(id => byId(S.tasks, id).dueTime, tid), '09:15');
    await p.keyboard.press('Escape');
  }
  const dueDay = await p.$('#pdDay');
  if(dueDay){
    await dueDay.click();
    await p.waitForTimeout(300);
    yes('and the due date beside it still opens the calendar', !!(await p.$('.dp-pop')));
    await p.keyboard.press('Escape');
  } else no('and the due date beside it still opens the calendar', '#pdDay not found');
  await p.evaluate(id => { const i = S.tasks.findIndex(t => t.id === id);
    if(i >= 0) S.tasks.splice(i, 1); saveNow(); closePanel(); }, tid);
  await p.waitForTimeout(400);

  console.log('\n5. inline date fields carry the calendar');
  const pid = await p.evaluate(() => {
    if(S.people[0]) return S.people[0].id;
    const x = newPerson('Picker Probe'); S.people.push(x); saveNow(); return x.id;
  });
  await p.evaluate(id => { location.hash = '#/people/' + id; }, pid);
  await p.waitForTimeout(800);
  const bday = await p.$('.ed.ed-date[data-path$=".birthday"]');
  if(!bday) no('a birthday is an inline field that knows it holds a date', 'no .ed-date found');
  else {
    ok('a birthday is an inline field that knows it holds a date');
    yes('it wears a small calendar even before you touch it', !!(await bday.$('.dp-btn')));
    await bday.scrollIntoViewIfNeeded();
    await bday.click();
    await p.waitForTimeout(350);
    yes('clicking it opens the calendar with the field', !!(await p.$('.dp-pop')));
    const d2 = await p.$$eval('.dp-pop [data-dpd]', n => n[9].dataset.dpd);
    await p.click(`.dp-pop [data-dpd="${d2}"]`);
    await p.waitForTimeout(200);
    yes('the field survives the click into the calendar',
        await p.evaluate(() => !!document.querySelector('.ed.ed-date.editing input')));
    await p.click('h1');
    await p.waitForTimeout(500);
    is('and the day it chose is what gets saved',
       await p.evaluate(pid => byId(S.people, pid).birthday, pid), d2);
    yes('the small calendar is still there after the edit closes',
        await p.evaluate(() => !!document.querySelector('.ed.ed-date .dp-btn')));
  }

  console.log('\n6. and nothing in the source still asks for a day without offering one');
  const src = require('fs').readFileSync('/home/user/newlife/index.html', 'utf8');
  /* an inline field whose placeholder is a literal ISO date is a day field, and
     every one of them has to say so, or it renders as a bare text box again */
  const inline = [...src.matchAll(/ed\(`?[^`)]*`?\s*,\s*\{[^}]*ph:'(?:YYYY-MM-DD|date)'[^}]*\}/g)].map(m => m[0]);
  const bare = inline.filter(x => !/date:true/.test(x));
  is(`all ${inline.length} inline day fields carry the calendar`, bare.length, 0);
  bare.forEach(x => console.log('       ' + x.slice(0, 110)));
  /* the same for the two fuzzy text fields: a calendar button, keyed to the field */
  ['eWhen', 'pmDate'].forEach(id => {
    const has = new RegExp(`id="${id}"[^>]*\\sdata-dp[\\s>]`).test(src) && src.includes(`dpButtonHTML('${id}')`);
    yes(`#${id} takes prose and still offers a calendar`, has);
  });
  const stray = await p.evaluate(() => [...document.querySelectorAll('input')]
    .map(i => (i.getAttribute('type') || 'text').toLowerCase())
    .filter(t => ['datetime-local', 'month', 'week'].includes(t)));
  is('no half-supported temporal input types are left in the markup', stray.join(','), '');

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke95  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
