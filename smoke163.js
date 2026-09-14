/* smoke163 — the three questions at the door. Theme, interaction sounds and
   ambient background are the things about this house that are a matter of
   taste rather than of data, they sit at the top of the Atmosphere card in
   Settings, and a page that arrives in the wrong one has already made its
   impression. So they are asked first, in that order, in the same words
   Settings uses, and every one of them takes effect as it is touched — there
   is no Save, because the only honest way to choose a sound is to hear it.

   Two things are deliberately not asked. The interface sounds are on: they
   are the quietest layer in the house, and they are in Settings for anyone
   who wants them gone. The decoration is not a setting at all any more — what
   made the house slow was fixed rather than switched off, so there is one
   house and it looks like itself. Either of those reappearing here is a
   regression this file should catch. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1340, height:1000}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1400);

  console.log('\n1. a new house asks before it does anything else');
  yes('the question is on screen', await p.$('#frGo') !== null);
  const rows = await p.evaluate(() => ({
    themes: [...document.querySelectorAll('[data-frtheme]')].map(n => n.dataset.frtheme),
    keys: [...document.querySelectorAll('[data-fr]')].map(n => n.dataset.fr),
    titles: [...document.querySelectorAll('[data-fr] b')].map(n => n.textContent.trim()),
  }));
  is('light and dark, in that order', rows.themes, ['light','dark']);
  is('then the two sound switches, in the order Settings uses', rows.keys, ['clicks','ambient']);
  is('  named as Settings names them', rows.titles,
     ['Interaction sounds','Ambient background']);
  /* the decoration is not a question any more: there is one house and it
     looks like itself, so nothing here asks about it */
  is('  and the decoration is not asked about either', await p.evaluate(() =>
    [...document.querySelectorAll('[data-frdecor]')].map(n => n.dataset.frdecor)), []);
  /* the fifth Atmosphere row is deliberately not here */
  yes('and the interface sounds are not asked about',
    !rows.keys.includes('ui') && !rows.titles.some(t => /interface/i.test(t)), rows.titles.join(' / '));

  console.log('\n2. every answer lands as it is given, with no Save to press');
  await p.click('[data-frtheme="dark"]'); await p.waitForTimeout(400);
  is('choosing dark makes the room dark under the dialog',
    await p.evaluate(() => document.documentElement.dataset.theme), 'dark');
  await p.click('[data-fr="clicks"]'); await p.waitForTimeout(300);
  is('the chimes come on as they are switched on',
    await p.evaluate(() => SoundManager.state().soundEnabled), true);
  await p.click('[data-fr="ambient"]'); await p.waitForTimeout(400);
  is('so does the wash under them',
    await p.evaluate(() => SoundManager.state().ambientEnabled), true);
  /* and the painting, the paper and the leaves are simply there, for
     everybody, without a switch in front of them */
  is('the painting is on the page behind, unasked',
    await p.evaluate(() => ({
      stamped: document.documentElement.hasAttribute('data-decor'),
      ambient: getComputedStyle(document.querySelector('.ambient')).display !== 'none',
      painted: !!document.getElementById('inkMist').children.length})),
    {stamped: false, ambient: true, painted: true});

  console.log('\n3. the interface sounds are on without being asked for');
  is('on by default', await p.evaluate(() => SoundManager.state().uiEnabled), true);

  console.log('\n4. it asks once');
  await p.click('#frGo'); await p.waitForTimeout(900);
  yes('Begin closes it', await p.$('#frGo') === null);
  is('  and the house remembers being asked',
    await p.evaluate(() => S.settings.prefsAsked), true);
  await p.reload(); await p.waitForTimeout(1800);
  yes('a second visit is not asked again', await p.$('#frGo') === null);
  is('  and every answer survived it', await p.evaluate(() => ({
      theme: S.settings.theme,
      clicks: SoundManager.state().soundEnabled, amb: SoundManager.state().ambientEnabled,
      ui: SoundManager.state().uiEnabled})),
    {theme: 'dark', clicks: true, amb: true, ui: true});

  console.log('\n5. all of them are in Settings, under Atmosphere, where they were promised');
  await p.evaluate(() => { location.hash = '#/settings'; }); await p.waitForTimeout(1100);
  const card = await p.evaluate(() => {
    const h3 = [...document.querySelectorAll('#main .card h3')].find(n => n.textContent.trim() === 'Atmosphere');
    if(!h3) return null;
    const c = h3.parentElement;
    return {ids: [...c.querySelectorAll('.opt [id]')].map(n => n.id),
      uiOn: c.querySelector('#sUiSound')?.classList.contains('on')};
  });
  yes('the Atmosphere card is there', card !== null);
  for(const id of ['sTheme','sSound','sAmbient','sUiSound'])
    yes(`  it carries ${id}`, card && card.ids.includes(id), card && card.ids.join(' '));
  is('  the interface sounds read as on', card && card.uiOn, true);
  yes('  and there is no decoration row to find', card && !card.ids.includes('sDecor'),
    card && card.ids.join(' '));
  await p.click('#sUiSound'); await p.waitForTimeout(300);
  is('  and turning them off in Settings turns them off',
    await p.evaluate(() => SoundManager.state().uiEnabled), false);

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(bad ? `\nsmoke163  ${bad} FAILED` : '\nsmoke163  all good');
  process.exit(bad ? 1 : 0);
})();
