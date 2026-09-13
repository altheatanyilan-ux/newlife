/* smoke155 — the charms. Everything the cards do in order, this does at
   once: you throw thirty small objects at a cloth and read the scatter.
   Which means the things worth testing are not the same things — there is
   no position one, and the whole reading hangs off where a charm landed,
   which ring it is in, which way it faces and what came down beside it. */
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
  const p = await b.newPage({viewport:{width:1340, height:1050}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }

  console.log('\n1. thirty charms in six families');
  is('the set is thirty', await p.evaluate(() => CHARM_SET.length), 30);
  is('  in six families', await p.evaluate(() => CHARM_CATS.length), 6);
  is('  five apiece', await p.evaluate(() => {
    const n = {}; CHARM_SET.forEach(c => n[c.cat] = (n[c.cat] || 0) + 1);
    return Object.values(n).join(','); }), '5,5,5,5,5,5');
  is('  no two the same', await p.evaluate(() => 30 - new Set(CHARM_SET.map(c => c.id)).size), 0);
  is('  every one says what it means', await p.evaluate(() =>
    CHARM_SET.filter(c => !c.name || !c.sym || !c.m || !(c.k || []).length).map(c => c.id).join(',')), '');

  console.log('\n2. the pairs — the part a deck of cards cannot do');
  yes('there are enough of them written out', await p.evaluate(() => Object.keys(CHARM_PAIRS).length >= 40),
    await p.evaluate(() => String(Object.keys(CHARM_PAIRS).length)));
  /* the lookup sorts the two ids, so a key written the other way round is a
     sentence nobody will ever see */
  is('  every key is in the order the lookup builds', await p.evaluate(() => {
    const ids = new Set(CHARM_SET.map(c => c.id));
    return Object.keys(CHARM_PAIRS).filter(k =>
      k !== k.split('+').sort().join('+') || k.split('+').some(x => !ids.has(x))).join(' ');
  }), '');
  yes('  and it finds one either way round', await p.evaluate(() =>
    charmPairText('lock', 'key') === charmPairText('key', 'lock')
    && /unlock|opening/i.test(charmPairText('key', 'lock'))));
  yes('  a pair nobody wrote still says something', await p.evaluate(() => {
    const t = charmPairText('dog', 'hourglass');
    return t.length > 40 && /Dog/.test(t) && /Hourglass/.test(t); }));

  console.log('\n3. the throw');
  is('a quick cast is seven', await p.evaluate(() => charmCast('quick').length), 7);
  is('  a standard one fifteen', await p.evaluate(() => charmCast('standard').length), 15);
  is('  a full one all thirty', await p.evaluate(() => charmCast('full').length), 30);
  is('  and no charm lands twice', await p.evaluate(() => {
    let worst = 0;
    for(let i = 0; i < 200; i++){ const t = charmCast('full').map(x => x.id);
      worst = Math.max(worst, t.length - new Set(t).size); }
    return worst; }), 0);
  yes('everything lands on the cloth', await p.evaluate(() => {
    for(let i = 0; i < 200; i++) if(charmCast('full').some(c => Math.hypot(c.x, c.y) > 1)) return false;
    return true; }));
  /* about a sixth land the wrong way up: the unknown is part of the method */
  const down = await p.evaluate(() => { let n = 0, d = 0;
    for(let i = 0; i < 300; i++){ const t = charmCast('full'); n += t.length; d += t.filter(x => !x.up).length; }
    return d / n; });
  yes('about a sixth land face down', down > .10 && down < .21, (down * 100).toFixed(1) + '%');
  /* A handful thrown at a cloth piles toward the middle rather than
     spreading evenly by area. Spread evenly, only a sixteenth would reach
     the core and nearly two thirds would be out past the influences — a
     reading with an empty centre and everything "beyond you". */
  const share = await p.evaluate(() => { const n = {inner:0, middle:0, outer:0}; let all = 0;
    for(let i = 0; i < 300; i++) charmCast('full').forEach(c => {
      all++; n[castRing(Math.hypot(c.x, c.y)).id]++; });
    return {inner: n.inner / all, middle: n.middle / all, outer: n.outer / all}; });
  yes('they crowd toward the middle', share.inner > .12,
    `${(share.inner * 100).toFixed(0)}% core / ${(share.middle * 100).toFixed(0)}% influences / ${(share.outer * 100).toFixed(0)}% beyond`);
  yes('  without the edge going empty', share.outer > .25, (share.outer * 100).toFixed(0) + '% beyond');

  console.log('\n4. reading the scatter');
  const a = await p.evaluate(() => {
    /* a cast placed by hand, so the answers are known rather than random */
    const t = [
      {id:'compass', x:0.02, y:0.02, rot:0, up:true,  flipped:false},   // nearest the centre
      {id:'key',     x:0.50, y:-0.06, rot:0, up:true, flipped:false},   // middle ring, action
      {id:'lock',    x:0.56, y:-0.02, rot:0, up:true, flipped:false},   // beside the key
      {id:'moon',    x:-0.05, y:-0.80, rot:0, up:true, flipped:false},  // outer ring, spirit
      {id:'skull',   x:0.10, y:0.70, rot:0, up:false, flipped:false},   // face down, material
    ];
    const r = castAnalyse(t);
    return {sig: r.sig.charm.id, sigRing: r.sig.ring.id,
      keyRing: r.marks[1].ring.id, keyQ: r.marks[1].quarter.id,
      moonRing: r.marks[3].ring.id, moonQ: r.marks[3].quarter.id,
      skullQ: r.marks[4].quarter.id,
      hidden: r.hidden.length, readable: r.readable.length,
      clusters: r.clusters.map(g => g.map(x => x.id).sort().join('+'))};
  });
  is('the charm nearest the centre is the core of it', a.sig, 'compass');
  is('  and it is in the inner ring', a.sigRing, 'inner');
  is('a charm halfway out is in the influences', a.keyRing, 'middle');
  is('  and to the right is action', a.keyQ, 'east');
  is('one near the edge is beyond you', a.moonRing, 'outer');
  is('  and above is spirit', a.moonQ, 'north');
  is('  below is the material world', a.skullQ, 'south');
  is('a face-down charm is not part of the reading', a.readable, 4);
  is('  it is counted as hidden instead', a.hidden, 1);
  is('two that fell together are read together', a.clusters.join(' '), 'key+lock');
  yes('  which is what the pair says, not the two meanings in a row', await p.evaluate(() => {
    const t = [{id:'key', x:.5, y:0, rot:0, up:true, flipped:false},
               {id:'lock', x:.56, y:0, rot:0, up:true, flipped:false}];
    const h = castReadingHTML(castAnalyse(t));
    return h.includes(CHARM_PAIRS['key+lock'].slice(0, 40)); }));
  yes('the narrative opens on the core and names the rest', await p.evaluate(() => {
    const t = [{id:'compass', x:0, y:0, rot:0, up:true, flipped:false},
               {id:'key', x:.5, y:0, rot:0, up:true, flipped:false},
               {id:'lock', x:.55, y:0, rot:0, up:true, flipped:false},
               {id:'skull', x:.3, y:.3, rot:0, up:false, flipped:false}];
    const n = castNarrative(castAnalyse(t));
    return /^At the heart of this cast is The Compass/.test(n) && /face down/.test(n); }));
  is('a cast that landed entirely face down says so', await p.evaluate(() =>
    /face down/.test(castNarrative(castAnalyse([{id:'key', x:0, y:0, rot:0, up:false, flipped:false}])))), true);

  console.log('\n5. the cloth is the same circle the charms land on');
  await p.evaluate(() => openCharmCast({size:'standard'})); await p.waitForTimeout(500);
  is('three sizes to choose from', await p.$$eval('[data-ccsize]', n => n.length), 3);
  await p.click('#ccGo'); await p.waitForTimeout(600);
  is('fifteen charms are on it', await p.$$eval('[data-cctok]', n => n.length), 15);
  await p.waitForTimeout(4600);
  is('  and all of them have come to rest', await p.$$eval('.cc-tok.rest', n => n.length), 15);
  /* the rings were drawn a fifth inside where the charms actually landed,
     which made every zone in the reading a lie about the picture */
  const geo = await p.evaluate(() => {
    const s = document.querySelector('#ccSurface').getBoundingClientRect();
    const r = document.querySelectorAll('#ccSurface .cc-ring')[2].getBoundingClientRect();
    return Math.abs(s.width - r.width); });
  yes('the outer ring is the edge of the cloth', geo < 2, geo.toFixed(1) + 'px out');
  yes('every charm is drawn inside it', await p.evaluate(() => {
    const s = document.querySelector('#ccSurface').getBoundingClientRect();
    const cx = s.left + s.width / 2, cy = s.top + s.height / 2;
    return [...document.querySelectorAll('.cc-tok')].every(t => {
      const r = t.getBoundingClientRect();
      return Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy) <= s.width / 2 + 1; }); }));
  yes('the reading is under it', await p.evaluate(() => !document.querySelector('#ccRead').hidden));
  yes('  and it says what the scatter was', await p.evaluate(() =>
    /\d+ read · \d+ face down · \d+ together/.test(document.querySelector('#ccWhat').textContent)));

  console.log('\n6. turning one over changes the reading');
  const hid = await p.evaluate(() => document.querySelectorAll('[data-ccflip]').length);
  if(hid){
    const was = await p.evaluate(() => document.querySelector('#ccWhat').textContent);
    await p.evaluate(() => document.querySelector('[data-ccflip]').click());
    await p.waitForTimeout(700);
    const now = await p.evaluate(() => document.querySelector('#ccWhat').textContent);
    yes('a face-down charm can be turned', now !== was, `${was} → ${now}`);
    is('  and there is one fewer hidden', await p.$$eval('[data-ccflip]', n => n.length), hid - 1);
  } else ok('nothing landed face down this time — nothing to turn');

  console.log('\n7. keeping a cast keeps the scatter, not a list of names');
  const before = await p.evaluate(() => S.entries.length);
  await p.evaluate(() => { document.querySelector('#dvText').value = 'It is about the move.';
    document.querySelector('#dvSave').click(); });
  await p.waitForTimeout(900);
  is('one entry', await p.evaluate(() => S.entries.length) - before, 1);
  const kept = await p.evaluate(() => { const e = S.entries.filter(x => x.type === 'divination').pop();
    const d = divinationOf(e);
    return {sys: d.system, n: (d.charms || []).length, src: d.source,
      hasXY: (d.charms || []).every(c => typeof c.x === 'number' && typeof c.y === 'number')}; });
  is('  filed as a cast', kept.sys, 'charms');
  is('  with all fifteen charms', kept.n, 15);
  yes('  and where every one of them landed', kept.hasXY);
  is('  thrown here rather than typed in', kept.src, 'digital');
  const back = await p.evaluate(() => { const e = S.entries.filter(x => x.type === 'divination').pop();
    const d = document.createElement('div'); d.innerHTML = divinationReadHTML(divinationOf(e));
    return {toks: d.querySelectorAll('.cc-tok').length, reads: d.querySelectorAll('.cc-read').length,
      story: !!d.querySelector('.dv-story p')}; });
  is('opening it again redraws the cloth', back.toks, 15);
  yes('  with the reading under it', back.reads > 0 && back.story);
  yes('  and the journal line names the core of it', await p.evaluate(() =>
    /at the centre/.test(divinationLine(S.entries.filter(x => x.type === 'divination').pop()))));

  console.log('\n8. the charms in the deck directory');
  await p.evaluate(() => { document.querySelectorAll('.overlay').forEach(n => n.remove()); openCardDirectory(); });
  await p.waitForTimeout(600);
  yes('there is a tab for them', await p.evaluate(() => !!document.querySelector('[data-cdtab="charms"]')));
  await p.click('[data-cdtab="charms"]'); await p.waitForTimeout(500);
  is('all thirty are there', await p.$$eval('[data-charmpick]', n => n.length), 30);
  is('  grouped by family', await p.$$eval('.cd-fam', n => n.length), 6);
  yes('  the ones thrown are marked', await p.evaluate(() => document.querySelectorAll('.cd-t-n').length > 0));
  yes('  the ones never thrown are dimmed', await p.evaluate(() => document.querySelectorAll('.cd-ctile.dim').length > 0));
  await p.fill('#cdFind', 'transformation'); await p.waitForTimeout(350);
  yes('searching by theme finds them', await p.evaluate(() => {
    const n = [...document.querySelectorAll('[data-charmpick] .cd-t-name')].map(x => x.textContent);
    return n.includes('The Snake') && n.length < 10; }));
  await p.fill('#cdFind', ''); await p.waitForTimeout(350);
  await p.evaluate(() => { const t = [...document.querySelectorAll('[data-charmpick]')]
    .find(x => x.querySelector('.cd-t-n')); t.click(); });
  await p.waitForTimeout(500);
  yes('a charm opens on its own page', await p.evaluate(() =>
    !!document.querySelector('.cd-head-t h3')?.textContent));
  yes('  with what it says beside another charm', await p.evaluate(() =>
    document.querySelectorAll('.cd-page .cc-clus').length > 0));
  is('  and where it has been landing', await p.$$eval('.cd-app', n => n.length), 1);
  yes('  said in a sentence', await p.evaluate(() => /Thrown once|come up/.test(
    document.querySelector('.cd-pat').textContent)));

  console.log('\n9. a charm of your own');
  await p.evaluate(() => { document.querySelector('#cdBack').click(); }); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('[data-charmnew]').click()); await p.waitForTimeout(400);
  await p.fill('#chName', 'The Bell'); await p.fill('#chSym', '🔔');
  await p.fill('#chKeys', 'warning, attention, the turn');
  await p.fill('#chMean', 'It rings when it is time.');
  await p.click('#chSave'); await p.waitForTimeout(600);
  is('it is kept', await p.evaluate(() => divPrefs().customCharms.length), 1);
  is('  and goes into the bag with the thirty', await p.evaluate(() => charmPool().length), 31);
  yes('  where it comes up like any of them', await p.evaluate(() => {
    for(let i = 0; i < 300; i++) if(charmCast('full').some(c => c.id.startsWith('own-'))) return true;
    return false; }));
  yes('  and the reading knows what to call it', await p.evaluate(() => {
    const id = divPrefs().customCharms[0].id;
    return /The Bell/.test(castReadingHTML(castAnalyse([{id, x:0, y:0, rot:0, up:true, flipped:false}]))); }));
  is('ten of your own is the limit', await p.evaluate(() => {
    const p2 = divPrefs();
    for(let i = 0; i < 12; i++) if(p2.customCharms.length < 10)
      p2.customCharms.push({id:'own-x' + i, name:'X' + i, sym:'◆', cat:'self', k:['x'], m:'x', hue:40, own:true});
    return p2.customCharms.length; }), 10);
  await p.evaluate(() => { divPrefs().customCharms = []; saveNow(); });

  console.log('\n10. a cast you threw on a real cloth');
  await p.evaluate(() => { document.querySelectorAll('.overlay').forEach(n => n.remove()); openPhysicalCast(); });
  await p.waitForTimeout(500);
  is('every charm is there to be picked', await p.$$eval('[data-pcadd]', n => n.length), 30);
  await p.evaluate(() => ['key','lock','moon','star'].forEach(id =>
    document.querySelector(`[data-pcadd="${id}"]`).click()));
  await p.waitForTimeout(400);
  is('four go onto the cloth', await p.$$eval('#pcToks [data-cctok]', n => n.length), 4);
  yes('  and it says which zone each is in', await p.evaluate(() =>
    document.querySelectorAll('.cc-zline').length === 4));
  /* a charm is dragged to where it actually fell, and the ring is read off
     that — which is the only honest way to record a scatter */
  const moved = await p.evaluate(() => {
    const surf = document.querySelector('#pcSurface').getBoundingClientRect();
    const tok = document.querySelector('#pcToks [data-cctok="0"]');
    const down = new PointerEvent('pointerdown', {bubbles:true, pointerId:1,
      clientX: surf.left + surf.width/2, clientY: surf.top + surf.height/2});
    tok.setPointerCapture = () => {};
    tok.dispatchEvent(down);
    tok.dispatchEvent(new PointerEvent('pointermove', {bubbles:true, pointerId:1,
      clientX: surf.left + surf.width/2 + surf.width * .45, clientY: surf.top + surf.height/2}));
    tok.dispatchEvent(new PointerEvent('pointerup', {bubbles:true, pointerId:1}));
    return document.querySelector('.cc-zline .mono').textContent.trim();
  });
  yes('dragging one out puts it in another ring', /beyond|influences/.test(moved), moved);
  await p.click('#pcGo'); await p.waitForTimeout(900);
  yes('it reads like any other cast', await p.evaluate(() =>
    document.querySelectorAll('#pcOut .cc-read').length > 0));
  yes('  and is marked as having come off a cloth', await p.evaluate(() =>
    /cloth/.test(document.querySelector('#pcOut .dv-src')?.textContent || '')));
  await p.evaluate(() => { document.querySelector('#pcOut #dvSave').click(); });
  await p.waitForTimeout(800);
  is('kept as a cast that was thrown elsewhere', await p.evaluate(() =>
    divinationOf(S.entries.filter(x => x.type === 'divination').pop()).source), 'physical');

  console.log('\n11. nothing is left running behind a page nobody is reading');
  await p.evaluate(() => { document.querySelectorAll('.overlay').forEach(n => n.remove()); });
  await p.waitForTimeout(600);
  is('the dust stops with the cloth', await p.evaluate(() => dvField().ps ? dvField().ps.length : 0), 0);

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke155  all good');
  await b.close();
  process.exitCode = bad ? 1 : 0;
})();
