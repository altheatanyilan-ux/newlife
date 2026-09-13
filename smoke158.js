/* smoke158 — consulting the book. The coins are objects that go up and come
   down one at a time; the stalks are the older method and do not have the
   same distribution, which is the whole reason anybody uses them; the
   hexagram builds from the bottom because that is the direction a hexagram
   grows; and the sixty-four are looked up in the square the book is looked
   up in. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);
const near = (n,a,b,tol,g='') => Math.abs(a-b) <= tol ? ok(n, g) : no(n, `${a} is not within ${tol} of ${b}`);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1340, height:1050}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  /* the button re-enables when a toss has finished resolving */
  const ready = async () => { for(let k = 0; k < 120; k++){
    if(await p.evaluate(() => { const x = document.querySelector('#icToss'); return !!x && !x.disabled; })) return true;
    await p.waitForTimeout(200); } return false; };

  console.log('\n1. the eight trigrams, written out once');
  is('all eight are there', await p.evaluate(() => Object.keys(TRIGRAM_FULL).length), 8);
  is('  each with its sound, its character and what it is', await p.evaluate(() =>
    Object.values(TRIGRAM_FULL).filter(t => !t.pin || !t.cn || !t.en || !t.attr || !t.img).length), 0);
  is('  and there is only one copy of them', await p.evaluate(() => typeof TRIGRAMS), 'undefined');
  /* ☰ ☱ ☲ ☳ ☴ ☵ ☶ ☷ are in almost no font this app loads and came out as
     dotted boxes, so a trigram is drawn rather than typed */
  yes('a trigram is drawn, not set in a font', await p.evaluate(() =>
    /<svg/.test(trigramGlyph('101', 14)) && !/☲/.test(trigramGlyph('101', 14))));
  is('  and it draws the lines it actually has', await p.evaluate(() => {
    const g = trigramGlyph('101', 14);            /* Lí: solid, broken, solid */
    return (g.match(/<rect/g) || []).length; }), 4);
  is('  where a solid trigram has three', await p.evaluate(() =>
    (trigramGlyph('111', 14).match(/<rect/g) || []).length), 3);

  console.log('\n2. the two methods do not agree, and should not');
  const coin = await p.evaluate(() => { const n = {6:0,7:0,8:0,9:0};
    for(let i = 0; i < 120000; i++) n[ichingTossCoins().total]++;
    return Object.fromEntries(Object.entries(n).map(([k, v]) => [k, v / 1200])); });
  near('three coins: old yin is an eighth', coin[6], 12.5, .5, coin[6].toFixed(2) + '%');
  near('  young yang three eighths', coin[7], 37.5, .7, coin[7].toFixed(2) + '%');
  near('  young yin three eighths', coin[8], 37.5, .7, coin[8].toFixed(2) + '%');
  near('  old yang an eighth', coin[9], 12.5, .5, coin[9].toFixed(2) + '%');
  const yar = await p.evaluate(() => { const n = {6:0,7:0,8:0,9:0};
    for(let i = 0; i < 120000; i++) n[ichingTossYarrow().total]++;
    return Object.fromEntries(Object.entries(n).map(([k, v]) => [k, v / 1200])); });
  /* the classical figures: 1/16, 5/16, 7/16, 3/16. A division drawn
     uniformly across the whole bundle gets none of them right. */
  near('fifty stalks: old yin a sixteenth', yar[6], 6.25, .4, yar[6].toFixed(2) + '%');
  near('  young yang five sixteenths', yar[7], 31.25, .7, yar[7].toFixed(2) + '%');
  near('  young yin seven sixteenths', yar[8], 43.75, .7, yar[8].toFixed(2) + '%');
  near('  old yang three sixteenths', yar[9], 18.75, .6, yar[9].toFixed(2) + '%');
  yes('so a moving yang is likelier than a moving yin under the stalks', yar[9] > yar[6] * 2.4,
    `${yar[9].toFixed(1)}% vs ${yar[6].toFixed(1)}%`);
  yes('  where under the coins they are the same', Math.abs(coin[9] - coin[6]) < 1);
  is('a total always makes a line', await p.evaluate(() =>
    [6,7,8,9].map(t => ichingLineOf(t).v + (ichingLineOf(t).moving ? 'm' : '')).join(' ')), '0m 1 0 1m');

  console.log('\n3. the coins are objects with two sides');
  await p.evaluate(() => openIChing()); await p.waitForTimeout(500);
  is('two methods are offered', await p.$$eval('[data-icmethod]', n => n.length), 2);
  await p.click('#icGo'); await p.waitForTimeout(600);
  yes('a moment to settle comes first', await p.evaluate(() => !!document.querySelector('.ic-veil')));
  yes('  with ink moving behind it', await p.evaluate(() => !!document.querySelector('.ic-wash path')));
  await p.evaluate(() => document.querySelector('.dv-veil .dv-skip').click());
  await p.waitForTimeout(600);
  is('three coins', await p.$$eval('.ic-coin', n => n.length), 3);
  is('  each with two faces', await p.evaluate(() =>
    document.querySelector('.ic-coin').querySelectorAll('.ic-face').length), 2);
  yes('  a round coin with a square hole', await p.evaluate(() =>
    !!document.querySelector('.ic-coin .ic-c-hole') && !!document.querySelector('.ic-coin .ic-c-body')));
  yes('  and a shadow under it, which is what makes it an object', await p.evaluate(() =>
    !!document.querySelector('.ic-coin-sh')));
  is('six empty places wait to be filled', await p.$$eval('#icFigWrap .ic-row.empty', n => n.length), 6);

  console.log('\n4. the hexagram builds from the bottom');
  await p.evaluate(() => document.querySelector('#icToss').click());
  yes('one toss makes one line', await ready() && await p.$$eval('.ic-row:not(.empty)', n => n.length) === 1);
  is('  and it is the bottom one', await p.evaluate(() =>
    document.querySelector('.ic-row:not(.empty)').dataset.row), '0');
  yes('  the total is shown, and what kind of line it is', await p.evaluate(() =>
    /= [6789]/.test(document.querySelector('#icTotal').textContent)
    && /yin|yang/.test(document.querySelector('#icTotal').textContent)));
  is('  five places left', await p.$$eval('#icFigWrap .ic-row.empty', n => n.length), 5);
  for(let i = 0; i < 5; i++){
    if(!await ready()){ no('the cast stalled at line ' + (i + 2)); break; }
    await p.evaluate(() => document.querySelector('#icToss').click());
  }
  /* the toss carries a real arc now — rise, hang, fall and two small
     bounces — so a cast takes about two and a half seconds a line */
  for(let k = 0; k < 140; k++){
    if(await p.evaluate(() => !!document.querySelector('#dvSave'))) break;
    await p.waitForTimeout(250);
  }
  const fin = await p.evaluate(() => ({
    lines: document.querySelectorAll('#icFigWrap .ic-one:first-child .ic-row:not(.empty)').length
      || document.querySelectorAll('#icFigWrap .ic-row:not(.empty)').length,
    name: (document.querySelector('.ic-hnm')?.textContent || '').trim(),
    cn: (document.querySelector('.ic-hcn')?.textContent || '').trim(),
    num: (document.querySelector('.ic-hnum')?.textContent || '').trim(),
    tri: !!document.querySelector('.ic-htri .ic-tg'),
    divider: document.querySelectorAll('.ic-one:first-child .ic-div, .ic-fig .ic-div').length,
    labels: document.querySelectorAll('.ic-trilab').length,
    notes: !!document.querySelector('.ic-trinotes'),
    read: !document.querySelector('#icRead').hidden,
    marks: [...document.querySelectorAll('.ic-mk')].filter(x => x.textContent.trim() === '×').length,
    movingRows: document.querySelectorAll('.ic-row.moving').length,
  }));
  is('six tosses make six lines', fin.lines, 6);
  yes('  the hexagram is named', fin.name.length > 2, fin.name);
  yes('  in its own characters as well', fin.cn.length > 0, fin.cn);
  yes('  and numbered', /hexagram \d+/.test(fin.num), fin.num);
  yes('  the two trigrams are named beside it', fin.tri && fin.labels >= 2);
  yes('  and divided from each other in the figure', fin.divider >= 1);
  is('  every changing line is marked with an ×', fin.marks, fin.movingRows);
  yes('a note explains the two trigrams', fin.notes);
  yes('the reading follows', fin.read);

  console.log('\n5. what it is becoming');
  const rel = await p.evaluate(() => ({
    pair: document.querySelectorAll('#icFigWrap .ic-one').length,
    arrow: !!document.querySelector('.ic-arrow'),
    movement: (document.querySelector('.ic-moving .dv-cr-t')?.textContent || ''),
  }));
  if(rel.pair === 2){
    yes('a second hexagram stands beside the first', rel.arrow);
    yes('  and the movement between them is said, not only drawn',
      /moves from .+ toward /.test(rel.movement), rel.movement.slice(0, 80));
  } else ok('nothing was moving in this cast, so there is no second hexagram');
  /* whichever way that cast fell, the sentence itself has to work */
  yes('the movement reads for any two hexagrams', await p.evaluate(() => {
    const t = ichingMovementText(ICHING[10], ICHING[4], [4]);
    return /moves from/.test(t) && /Line 5 is the one in motion/.test(t) && t.length > 120; }));
  yes('  and names several lines when several are moving', await p.evaluate(() =>
    /Lines 1, 3 and 6 are in motion/.test(ichingMovementText(ICHING[0], ICHING[1], [0, 2, 5]))));

  console.log('\n6. keeping it keeps how it was asked');
  const before = await p.evaluate(() => S.entries.length);
  await p.evaluate(() => { document.querySelector('#dvText').value = 'the small departs';
    document.querySelector('#dvSave').click(); });
  await p.waitForTimeout(900);
  is('one entry', await p.evaluate(() => S.entries.length) - before, 1);
  const kept = await p.evaluate(() => { const e = S.entries.filter(x => x.type === 'divination').pop();
    const d = divinationOf(e);
    return {sys: d.system, method: d.method, tosses: (d.tosses || []).length,
      lines: (d.lines || []).length, totals: (d.lines || []).every(l => typeof l.total === 'number')}; });
  is('  filed as an I Ching reading', kept.sys, 'iching');
  is('  by the coins', kept.method, 'coins');
  is('  with all six tosses', kept.tosses, 6);
  is('  and the six lines', kept.lines, 6);
  yes('  each remembering what it was thrown as', kept.totals);

  console.log('\n7. the stalks, end to end');
  await p.evaluate(() => { document.querySelectorAll('.overlay').forEach(n => n.remove()); openIChing(); });
  await p.waitForTimeout(500);
  await p.click('[data-icmethod="yarrow"]'); await p.waitForTimeout(200);
  is('the method is remembered', await p.evaluate(() => divPrefs().castMethod), 'yarrow');
  await p.click('#icGo'); await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('.dv-veil .dv-skip').click());
  await p.waitForTimeout(500);
  is('forty-nine stalks', await p.$$eval('.ic-yar-bundle i', n => n.length), 49);
  yes('  and one set aside', await p.evaluate(() => !!document.querySelector('.ic-yar-set')));
  is('  the button asks for a division, not a toss', await p.evaluate(() =>
    document.querySelector('#icToss').textContent.trim()), 'divide the stalks');
  await p.evaluate(() => document.querySelector('#icToss').click());
  await p.waitForTimeout(900);
  yes('it says what it is doing while it does it', await p.evaluate(() =>
    /division/.test(document.querySelector('#icYarSay').textContent)));
  yes('  and the counted-out stalks go', await p.evaluate(() =>
    document.querySelectorAll('.ic-yar-bundle i.gone').length > 0));
  yes('one division makes one line', await ready() && await p.evaluate(() =>
    document.querySelectorAll('#icFigWrap .ic-row:not(.empty)').length === 1));
  for(let i = 0; i < 5; i++){
    if(!await ready()){ no('the stalks stalled at line ' + (i + 2)); break; }
    await p.evaluate(() => document.querySelector('#icToss').click());
  }
  /* the reading arrives a beat after the sixth line lands, not with it */
  /* the toss carries a real arc now — rise, hang, fall and two small
     bounces — so a cast takes about two and a half seconds a line */
  for(let k = 0; k < 140; k++){
    if(await p.evaluate(() => !!document.querySelector('#dvSave'))) break;
    await p.waitForTimeout(250);
  }
  is('six divisions make a hexagram', await p.evaluate(() =>
    document.querySelectorAll('#icFigWrap .ic-one:first-child .ic-row:not(.empty)').length
      || document.querySelectorAll('#icFigWrap .ic-row:not(.empty)').length), 6);
  await p.evaluate(() => { document.querySelector('#dvSave')?.click(); });
  await p.waitForTimeout(900);
  is('  and it is kept as a stalk reading', await p.evaluate(() =>
    divinationOf(S.entries.filter(x => x.type === 'divination').pop()).method), 'yarrow');

  console.log('\n8. the sixty-four in the square the book uses');
  /* two random casts are under no obligation to throw any particular
     hexagram, so one is put on the record to have a history to look at */
  await p.evaluate(() => divinationSave({system:'iching', question:'And now?', title:'11. Peace',
    lines:[1,1,1,0,0,0].map((v, i) => ({v, moving: i === 4, total: i === 4 ? 6 : (v ? 7 : 8)})),
    hexagram:{i:11, n:'Peace', c:'泰 Tài'}, relating:{i:5, n:'Waiting', c:'需 Xū'},
    method:'yarrow', reading:'the small departs'}));
  await p.evaluate(() => { document.querySelectorAll('.overlay').forEach(n => n.remove()); openCardDirectory(); });
  await p.waitForTimeout(600);
  yes('there is a tab for them', await p.evaluate(() => !!document.querySelector('[data-cdtab="iching"]')));
  await p.click('[data-cdtab="iching"]'); await p.waitForTimeout(500);
  is('all sixty-four are in the square', await p.$$eval('[data-hexpick]', n => n.length), 64);
  is('  each exactly once', await p.evaluate(() => {
    const got = [...document.querySelectorAll('[data-hexpick]')].map(x => +x.dataset.hexpick).sort((a, b) => a - b);
    return got.filter((n, i) => n !== i + 1).length; }), 0);
  /* rows are the lower trigram and columns the upper — the other way round
     is a perfectly good table that matches no reference anybody owns */
  is('  Heaven under Heaven is the first', await p.evaluate(() =>
    ICHING.find(h => h.b === '111' + '111').i), 1);
  is('  Heaven under Earth is Peace', await p.evaluate(() =>
    ICHING.find(h => h.b === '111' + '000').i), 11);
  is('  and Earth under Heaven is Standstill', await p.evaluate(() =>
    ICHING.find(h => h.b === '000' + '111').i), 12);
  is('  the ones you have cast are marked', await p.$$eval('.cd-hexcell.seen', n => n.length) > 0, true);
  await p.evaluate(() => document.querySelector('[data-hexpick="11"]').click());
  await p.waitForTimeout(500);
  yes('a hexagram opens on its own page', await p.evaluate(() =>
    /Peace/.test(document.querySelector('.ic-page .ic-hnm')?.textContent || '')));
  is('  with all six of its lines written out', await p.$$eval('.ic-page .ic-lineread', n => n.length), 6);
  yes('  its judgment and its image', await p.evaluate(() =>
    document.querySelectorAll('.ic-page .ic-quote').length >= 2));
  yes('  and the two trigrams explained', await p.evaluate(() =>
    !!document.querySelector('.ic-page .ic-trinotes')));
  yes('  said in a sentence when you have cast it', await p.evaluate(() =>
    /come up/.test(document.querySelector('.ic-page .cd-pat')?.textContent || '')));
  await p.evaluate(() => document.querySelector('#cdBack').click()); await p.waitForTimeout(300);
  await p.fill('#cdFind', 'peace'); await p.waitForTimeout(350);
  yes('searching finds one by name', await p.evaluate(() =>
    /Peace/.test(document.querySelector('.cd-hexrow b')?.textContent || '')));

  console.log('\n9. nothing keeps running once it is over');
  await p.evaluate(() => { document.querySelectorAll('.overlay').forEach(n => n.remove()); });
  await p.waitForTimeout(600);
  is('the dust stops with the cast', await p.evaluate(() => dvField().ps ? dvField().ps.length : 0), 0);

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke158  all good');
  await b.close();
  process.exitCode = bad ? 1 : 0;
})();
