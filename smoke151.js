/* smoke151 — two small matters of width. A card waiting in the matrix's
   tray had 210 pixels to say its name in, which is four lines for anything
   but "Email Ben"; and the width one person wants is not the width another
   does, so it is dragged rather than decided. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1440, height:1000}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }

  console.log('\n1. a card waiting to be placed has room for its title');
  await p.evaluate(() => {
    ['Ask the landlord about the boiler before the inspection',
     'Draft the reply to the grant committee',
     'Book the dentist'].forEach(t => S.tasks.push(newPlanTask(t, today(), {})));
    saveNow(); location.hash = '#/planning'; rerender();
  });
  await p.waitForTimeout(1500);
  is('the page is on the matrix', await p.evaluate(() => planView()), 'eisenhower');
  const tray = await p.evaluate(() => {
    const box = document.querySelector('.pe-traybox'); if(!box) return null;
    const c = box.querySelector('.pk-card');
    return {cards: box.querySelectorAll('.pk-card').length,
      w: c ? Math.round(c.getBoundingClientRect().width) : 0,
      lines: c ? Math.round(c.querySelector('.pk-text').getBoundingClientRect().height) : 0};
  });
  yes('the tray holds the unplaced ones', tray && tray.cards >= 3, JSON.stringify(tray));
  yes('  each wider than the 210 it used to be', tray.w > 210, tray.w + 'px');
  is('  which is what the preference says', tray.w, await p.evaluate(() => peTrayWidth()));
  yes('  and a long title fits in two lines, not four', tray.lines < 46, tray.lines + 'px tall');

  console.log('\n2. the width is dragged from the card\'s own edge');
  const grip = await p.$('.pe-traybox .pk-card .pe-grip');
  yes('every tray card carries a handle', !!grip);
  is('  one apiece', await p.$$eval('.pe-traybox .pe-grip', n => n.length), tray.cards);
  yes('  that says what it is for', /drag to widen/.test(await grip.getAttribute('title') || ''));
  const box0 = await grip.boundingBox();
  await p.mouse.move(box0.x + box0.width/2, box0.y + box0.height/2);
  await p.mouse.down();
  await p.mouse.move(box0.x + box0.width/2 + 120, box0.y + box0.height/2, {steps: 8});
  const during = await p.evaluate(() => Math.round(document.querySelector('.pe-traybox .pk-card').getBoundingClientRect().width));
  yes('the cards follow the pointer as it goes', Math.abs(during - (tray.w + 120)) < 6, `${during} vs ${tray.w + 120}`);
  yes('  and the tray knows it is being sized', await p.evaluate(() =>
    document.querySelector('.pe-traybox').classList.contains('sizing')));
  await p.mouse.up(); await p.waitForTimeout(200);
  is('letting go writes it down', await p.evaluate(() => peTrayWidth()), tray.w + 120);
  yes('  and it is still there after a redraw', await p.evaluate(() => {
    rerender();
    return Math.round(document.querySelector('.pe-traybox .pk-card').getBoundingClientRect().width) === peTrayWidth();
  }));

  console.log('\n3. it is put back the way anything else here is');
  await p.evaluate(() => { document.querySelector('.pe-traybox .pe-grip')
    .dispatchEvent(new MouseEvent('dblclick', {bubbles: true})); });
  await p.waitForTimeout(200);
  is('double-clicking the handle resets it', await p.evaluate(() => peTrayWidth()), 320);
  await p.evaluate(() => { const g = document.querySelector('.pe-traybox .pe-grip'); g.focus();
    g.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true})); });
  await p.waitForTimeout(150);
  is('  and the arrows nudge it for a keyboard', await p.evaluate(() => peTrayWidth()), 344);
  is('  it will not go narrower than legible', await p.evaluate(() => { peSetTrayWidth(20); return peTrayWidth(); }), 170);
  is('  nor wider than the page', await p.evaluate(() => { peSetTrayWidth(5000); return peTrayWidth(); }), 720);
  await p.evaluate(() => { peSetTrayWidth(320); saveNow(); });

  console.log('\n4. the handle is a handle, not a way into the task');
  await p.evaluate(() => { location.hash = '#/planning'; rerender(); }); await p.waitForTimeout(1200);
  const before = await p.evaluate(() => !!document.querySelector('.panel, .modal'));
  await p.evaluate(() => document.querySelector('.pe-traybox .pe-grip').click());
  await p.waitForTimeout(500);
  is('clicking it does not open the card', await p.evaluate(() => !!document.querySelector('.panel, .modal')), before);
  /* the quadrant cards are a column and size themselves; only the tray, which
     wraps, needs telling */
  is('and the quadrants are left alone', await p.$$eval('.pe-cards .pe-grip', n => n.length), 0);

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke151  all good');
  await b.close();
  process.exitCode = bad ? 1 : 0;
})();
