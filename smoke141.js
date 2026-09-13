/* smoke141 — the Morning Theatre's six practices: a vision board you can pin
   to, a scene you walk into, scripting, structural tension, thanks given in
   advance, and the focus wheel for the day you believe none of it */
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
  const p = await b.newPage({viewport:{width:1400, height:1200}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const today_ = async () => { await p.evaluate(() => { if(location.hash === '#/today') rerender(); else location.hash = '#/today'; });
    await p.waitForTimeout(1500);
    await p.evaluate(() => { document.querySelectorAll('.toast').forEach(n => n.remove());
      const d = document.querySelector('#t-theatre'); if(d) d.open = true;
      document.querySelectorAll('[data-th]').forEach(x => { x.open = true; }); });
    await p.waitForTimeout(300); };
  await today_();

  console.log('\n1. the room holds eight practices, in an order you set');
  const secs = await p.$$eval('[data-th]', n => n.map(x => x.dataset.th));
  is('all eight are there', secs.length, 8);
  yes('  the three old ones are kept, not replaced',
      ['script','winning','aim'].every(k => secs.includes(k)), secs.join(','));
  yes('  and the six new ones are with them',
      ['board','scene','scripting','tension','thanks'].every(k => secs.includes(k)), secs.join(','));
  /* the order is remembered, so a person can practise in their own sequence */
  await p.evaluate(() => { const r = theatre(); r.prefs.order = ['thanks', ...r.prefs.order.filter(k => k !== 'thanks')]; saveNow(); });
  await today_();
  is('the order is the one that was saved', (await p.$$eval('[data-th]', n => n.map(x => x.dataset.th)))[0], 'thanks');
  await p.evaluate(() => { const r = theatre(); r.prefs.order = TH_SECTIONS.map(s => s[0]); saveNow(); });
  await today_();

  console.log('\n2. the vision board');
  await p.evaluate(() => { theatre().board.items = []; saveNow(); });
  await today_();
  yes('it starts empty and says so', await p.evaluate(() =>
    /Nothing on the board yet/.test(document.querySelector('[data-th="board"]')?.textContent || '')));
  await p.evaluate(() => document.querySelector('#vbAddBtn').click()); await p.waitForTimeout(400);
  is('  adding offers four kinds of thing', await p.$$eval('[data-vbk]', n => n.length), 4);
  await p.evaluate(() => document.querySelector('[data-vbk="affirmation"]').click()); await p.waitForTimeout(400);
  await p.evaluate(() => { document.querySelector('#vbText').value = 'I write every morning before the house wakes.';
    document.querySelector('#vbArea').value = 'being';
    document.querySelector('[data-feel="certain"]').click();
    document.querySelector('#vbSave').click(); });
  await p.waitForTimeout(1200);
  const item = await p.evaluate(() => theatre().board.items[0]);
  is('  an affirmation lands on the board', item.type, 'affirmation');
  is('  with the area it belongs to', item.area, 'being');
  is('  and how it feels to look at', item.feeling, 'certain');
  await today_();
  is('  it is drawn as a card', await p.$$eval('.vb-card', n => n.length), 1);
  yes('  with the affirmation styling', await p.evaluate(() => !!document.querySelector('.vb-card.affirmation .vb-affirm')));
  /* anything anywhere can be pinned, without going through the board */
  await p.evaluate(() => pinToVisionBoard({type:'quote', text:'A place can do most of its work from a distance.', source:'a notebook'}, 'Quote'));
  await today_();
  is('  and something can be pinned from anywhere', await p.$$eval('.vb-card', n => n.length), 2);
  yes('  the newest is first', await p.evaluate(() => /a notebook/.test(document.querySelector('.vb-card').textContent)));
  /* shuffle rewrites the order rather than faking it in the drawing */
  await p.evaluate(() => { const r = theatre();
    for(let i = 0; i < 6; i++) r.board.items.push({id:uid(), type:'description', text:'x' + i, area:'general', order: 100 + i});
    saveNow(); });
  await today_();
  /* read the order the moment before pressing it, or the extra cards added
     above would make any two readings differ and the check would never bite */
  const before = await p.evaluate(() => vbSorted().map(x => x.id).join(','));
  await p.evaluate(() => document.querySelector('#vbShuffle').click()); await p.waitForTimeout(900);
  const after = await p.evaluate(() => vbSorted().map(x => x.id).join(','));
  yes('shuffling actually reorders the board', before !== after);
  is('  and the order is written down, not redrawn each time',
     await p.evaluate(() => theatre().board.items.every(x => typeof x.order === 'number')), true);
  /* focus mode shows them one at a time */
  await today_();
  await p.evaluate(() => document.querySelector('#vbFocusBtn').click()); await p.waitForTimeout(500);
  yes('focus mode shows one at a time', await p.evaluate(() => !!document.querySelector('.vb-slide')));
  is('  and counts them', await p.evaluate(() => /1 of \d/.test(document.querySelector('#vbCount').textContent)), true);
  await p.evaluate(() => closeModals());

  console.log('\n3. a scene, entered');
  await today_();
  await p.evaluate(() => document.querySelector('#scNew').click()); await p.waitForTimeout(500);
  is('the flow starts at step one of five', await p.evaluate(() => document.querySelector('#scStep').textContent), '1 of 5');
  yes('  and there is no back button on the first', await p.evaluate(() => document.querySelector('#scBack').hidden));
  await p.evaluate(() => { document.querySelector('[data-f="location"]').value = 'A kitchen in Kyoto';
    document.querySelector('[data-f="location"]').dispatchEvent(new Event('input'));
    document.querySelector('[data-set="timeOfDay"][data-val="evening"]').click(); });
  await p.waitForTimeout(300);
  for(let i = 0; i < 3; i++){ await p.evaluate(() => document.querySelector('#scNext').click()); await p.waitForTimeout(300); }
  yes('the fourth step asks how vivid it was', await p.evaluate(() => !!document.querySelector('[data-rate="vivid"]')));
  await p.evaluate(() => { document.querySelector('[data-rate="vivid"][data-n="5"]').click(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => { document.querySelector('[data-rate="intensity"][data-n="4"]').click(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('#scNext').click()); await p.waitForTimeout(300);
  yes('the last step tells you to get out again',
      await p.evaluate(() => /get out/.test(document.querySelector('#scBody').textContent)));
  await p.evaluate(() => document.querySelector('#scNext').click()); await p.waitForTimeout(1200);
  const sc = await p.evaluate(() => theatre().scenes[0]);
  is('the scene is kept', sc.location, 'A kitchen in Kyoto');
  is('  with the hour of it', sc.timeOfDay, 'evening');
  is('  and how it landed', `${sc.vivid}/${sc.intensity}`, '5/4');
  await today_();
  yes('  and it is listed to be revisited', await p.evaluate(() =>
    /A kitchen in Kyoto/.test(document.querySelector('[data-th="scene"]').textContent)));
  /* revisiting reopens the same scene rather than starting a new one */
  const nBefore = await p.evaluate(() => theatre().scenes.length);
  await p.evaluate(() => document.querySelector('[data-scene]').click()); await p.waitForTimeout(500);
  is('  revisiting starts from what was there', await p.evaluate(() => document.querySelector('[data-f="location"]').value), 'A kitchen in Kyoto');
  for(let i = 0; i < 5; i++){ await p.evaluate(() => document.querySelector('#scNext')?.click()); await p.waitForTimeout(250); }
  await p.waitForTimeout(800);
  is('  and deepens it rather than making a second one', await p.evaluate(() => theatre().scenes.length), nBefore);

  console.log('\n4. scripting, which is also a journal entry');
  await today_();
  const entriesBefore = await p.evaluate(() => S.entries.length);
  await p.evaluate(() => { document.querySelector('#scrCat').value = 'this_week';
    const t = document.querySelector('#scrBody'); t.value = 'The week has already gone the way I would have chosen. On Tuesday the piece was finished.';
    t.dispatchEvent(new Event('input')); });
  await p.waitForTimeout(300);
  yes('the word count follows what is typed', await p.evaluate(() =>
    /\d+ words/.test(document.querySelector('#scrCount').textContent)),
    await p.evaluate(() => document.querySelector('#scrCount').textContent));
  await p.evaluate(() => document.querySelector('#scrSave').click()); await p.waitForTimeout(1200);
  const scr = await p.evaluate(() => theatre().scripts[0]);
  is('the script is kept', scr.cat, 'this_week');
  yes('  with its length counted', scr.words > 10, String(scr.words));
  is('  and it is a journal entry too', await p.evaluate(() => S.entries.length), entriesBefore + 1);
  is('  filed under Manifestation', await p.evaluate(() => S.entries[S.entries.length - 1].type), 'manifestation');

  console.log('\n5. structural tension');
  await today_();
  const pid = await p.evaluate(() => thProjects()[0]?.id);
  yes('there is a project to hold it against', !!pid);
  await p.evaluate(i => { const sel = document.querySelector('#stProj'); sel.value = i; sel.dispatchEvent(new Event('change')); }, pid);
  await p.waitForTimeout(1200);
  await p.evaluate(() => { document.querySelector('#t-theatre').open = true;
    document.querySelectorAll('[data-th]').forEach(x => { x.open = true; }); });
  await p.evaluate(() => { document.querySelector('#stVision').value = 'It is finished and people are reading it.';
    document.querySelector('#stReality').value = 'Two chapters, both rough.'; });
  await p.evaluate(() => document.querySelector('#stChoose').click()); await p.waitForTimeout(1200);
  const ten = await p.evaluate(() => theatre().tension[0]);
  is('both halves are recorded', ten.vision, 'It is finished and people are reading it.');
  is('  including where you actually are', ten.reality, 'Two chapters, both rough.');
  is('  and that the result was chosen', ten.chose, true);
  is('  the vision is written back to the project it belongs to',
     await p.evaluate(i => byId(S.projects, i).description, pid), 'It is finished and people are reading it.');
  await today_();
  yes('  and the button says so afterwards', await p.evaluate(() =>
    /chosen today/.test(document.querySelector('#stChoose')?.textContent || '')));
  /* the gap between the columns is the point, so it is actually drawn */
  yes('  the gap between the two columns is drawn', await p.evaluate(() => !!document.querySelector('.st-gap i')));

  console.log('\n6. thanks, in advance');
  await today_();
  const eB = await p.evaluate(() => S.entries.length);
  await p.evaluate(() => { const ins = document.querySelectorAll('[data-thanks]');
    ins[0].value = 'I am grateful for the quiet flat with the window over the street.';
    ins[1].value = 'I am grateful for work that pays for itself.';
    document.querySelector('#thSave').click(); });
  await p.waitForTimeout(1200);
  const th = await p.evaluate(() => theatre().thanks[0]);
  is('the lines are kept', th.lines.length, 2);
  is('  empty ones are not', th.lines.filter(Boolean).length, 2);
  is('  and it is a gratitude entry too', await p.evaluate(() => S.entries[S.entries.length - 1].type), 'gratitude');
  is('  marked as being for what has not arrived', await p.evaluate(() => S.entries[S.entries.length - 1].extra.anticipatory), true);
  is('  which is not the same as the entries count going untouched', await p.evaluate(() => S.entries.length), eB + 1);
  await today_();
  yes('  and today shows what was given', await p.evaluate(() =>
    /quiet flat/.test(document.querySelector('[data-th="thanks"]').textContent)));

  console.log('\n7. the focus wheel, for the day you believe none of it');
  yes('it is not in the practice list — it is a door at the foot',
      await p.evaluate(() => !document.querySelector('[data-th="wheel"]') && !!document.querySelector('#thWheel')));
  await p.evaluate(() => document.querySelector('#thWheel').click()); await p.waitForTimeout(500);
  yes('opening it draws a wheel', await p.evaluate(() => !!document.querySelector('.fw-svg')));
  is('  with somewhere for five thoughts', await p.$$eval('[data-s]', n => n.length), 5);
  await p.evaluate(() => document.querySelector('#fwMore').click()); await p.waitForTimeout(300);
  is('  and room for more', await p.$$eval('[data-s]', n => n.length), 6);
  await p.evaluate(() => {
    document.querySelector('[data-w="topic"]').value = 'It will never pay for itself.';
    document.querySelector('[data-w="topic"]').dispatchEvent(new Event('input'));
    document.querySelector('[data-w="belief"]').value = 'There is enough, and it is on its way.';
    document.querySelector('[data-w="belief"]').dispatchEvent(new Event('input'));
    document.querySelectorAll('[data-s]').forEach((el, i) => { if(i < 3){ el.value = 'A thought ' + (i + 1); el.dispatchEvent(new Event('input')); } });
  });
  await p.waitForTimeout(700);
  await p.evaluate(() => document.querySelector('#fwSave').click()); await p.waitForTimeout(1200);
  const w = await p.evaluate(() => theatre().wheels[0]);
  is('the wheel is kept', w.statements.length, 3);
  is('  with the belief at its middle', w.belief, 'There is enough, and it is on its way.');
  is('  and it becomes a reflection in the Lived Record',
     await p.evaluate(() => S.entries[S.entries.length - 1].type), 'reflection');

  console.log('\n8. any practice counts towards the 21 days');
  is('the day is marked without pressing anything', await p.evaluate(() => theatreDoneToday()), true);
  is('  and the old question answers the same way', await p.evaluate(() => rehearsalDoneToday()), true);
  const dig = await p.evaluate(() => theatreDigest(addDays(today(), -7), today()));
  yes('the Review can ask how the practice went',
      dig.scenes >= 1 && dig.scripts >= 1 && dig.tension >= 1 && dig.thanks >= 1 && dig.wheels >= 1, JSON.stringify(dig));
  yes('  including how vivid the scenes were', dig.vividness >= 1 && dig.vividness <= 5, String(dig.vividness));

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke141  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
