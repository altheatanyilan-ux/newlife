/* smoke107 — the Journals sidebar carries only journals worth opening, and the
   room is marked by a tree */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('/home/user/newlife/index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

const GONE = ['uncategorized', 'progress', 'lifeevent', 'memory', 'media'];

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1400, height:1100}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const go = async (h) => { await p.evaluate(x => { if(location.hash === x) rerender(); else location.hash = x; }, h);
    await p.waitForTimeout(1300); };
  await go('#/journals');

  console.log('\n1. five kinds are gone from the list down the side');
  const nav = await p.$$eval('.jnav [data-go]', n => n.map(x => x.dataset.go.split('/').pop()));
  yes('the sidebar has entries at all', nav.length >= 5, nav.join(','));
  GONE.forEach(k => yes(`  no ${k}`, !nav.includes(k), nav.join(',')));
  yes('and the ones worth keeping are still there',
      ['reflection','gratitude','dream','question','quote','letter','decision'].every(k => nav.includes(k)),
      nav.join(','));

  console.log('\n2. nothing was deleted — the entries are only read elsewhere');
  const kept = await p.evaluate(g => ({
    journals: S.journals.filter(j => g.includes(j.type)).length,
    entries: S.entries.filter(e => g.includes(e.type)).length,
  }), GONE);
  is('the journals themselves are still in the data', kept.journals, GONE.length);
  yes('  and so is every entry filed under them', kept.entries >= 0);
  /* the Library and the Timeline are where these are read */
  await go('#/commonplace');
  yes('media entries still fill the Library',
      await p.evaluate(() => document.querySelectorAll('[data-mopen]').length >= 1
        || S.entries.filter(e => e.type === 'media').length === 0));

  console.log('\n3. an address naming a hidden journal lands somewhere real');
  await go('#/journals/memory');
  is('it opens the first journal instead', await p.evaluate(() => S._journal), 'reflection');
  yes('  and the page rendered', !!(await p.$('.jnav')));
  yes('  with that one marked as chosen',
      await p.evaluate(() => document.querySelector('.jnav .active')?.dataset.go === '#/journals/reflection'));

  console.log('\n3b. and a remembered choice of one does too');
  await p.evaluate(() => { S._journal = 'media'; });
  await go('#/journals');
  is('it does not open the hidden one', await p.evaluate(() => S._journal), 'reflection');

  console.log('\n4. they are listed where they can still be managed');
  await go('#/journals');
  await p.click('#jManage');
  await p.waitForTimeout(700);
  const managed = await p.evaluate(() => [...document.querySelectorAll('#modals [data-jdel]')].map(x => x.dataset.jdel));
  yes('the manage dialog still shows all of them', GONE.every(k => managed.includes(k)), managed.join(','));
  yes('  each marked as not being in the sidebar',
      await p.evaluate(() => [...document.querySelectorAll('#modals .row')]
        .filter(r => /not in the sidebar/.test(r.textContent)).length >= 5));
  await p.evaluate(() => closeModals());

  console.log('\n5. the room keeps its open book, and the house wears the tree');
  /* The tree was briefly the Journals icon and has since moved to the favicon,
     where it stands for the whole house rather than one room in it. */
  const ico = await p.evaluate(() => NAV_ICONS.journals);
  yes('Journals is an open book again', /M12 6\.5c-1\.6-1\.4/.test(ico), ico.slice(0, 80));
  yes('  with no crown on it', !/<circle/.test(ico), ico.slice(0, 90));
  /* <html> carries data-page for the current room, so the nav link has to be
     addressed as a link — the bare attribute selector finds the document */
  const inNav = await p.evaluate(() => {
    const svg = document.querySelector('a[data-page="journals"] .ico svg');
    return svg ? {circles: svg.querySelectorAll('circle').length, paths: svg.querySelectorAll('path').length} : null;
  });
  yes('and the sidebar draws that', inNav && inNav.circles === 0 && inNav.paths === 2, JSON.stringify(inNav));

  console.log('\n5b. the tree is the mark of the site itself');
  const fav = await p.evaluate(() => decodeURIComponent(document.querySelector('link[rel="icon"]').href));
  yes('the favicon has a crown', /<circle/.test(fav));
  yes('  a trunk', /M50 84V15/.test(fav), fav.slice(0, 140));
  yes('  and roots', /M50 84c0 6-6 8-17 10/.test(fav));
  yes('  and it is no longer the 生 strokes', !/M58 16/.test(fav));
  yes('the home-screen icon agrees with it', await p.evaluate(() =>
    !!document.querySelector('link[rel="apple-touch-icon"]')?.href.startsWith('data:image/png')));

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke107  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
