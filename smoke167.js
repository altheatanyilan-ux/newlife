/* smoke167 — the People page stops being a database.

   Two halves. The first is the constellation: five rings become a physics
   simulation with you at the centre, and every property of a face is read off
   what you actually did — how far out is the ring you put them in, how bright
   is how recently you saw them, how warm is whether time with them leaves you
   fuller, and the thread frays when it goes cold. A face you have not met
   hangs on no thread, because there is nothing between you yet.

   The second is that logging takes three taps. It used to mean opening a
   person, finding their log and filling in a form with a date, a kind, a
   description, an energy reading and a quality — half a minute of typing for
   the fact that you had coffee, which is why it did not get done. Who, what
   kind, how it left you; the note is one line and optional.

   And a friendship read back as a shape: ninety days as a strip of days, the
   meetings as marks on a line with the gaps visible, the energy of each one
   as a line that can slope. A list tells you what happened. These tell you
   the rhythm, which is the thing a list hides. */
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
  const p = await b.newPage({viewport:{width:1340, height:960}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1700); }

  /* a small, known sky: two recent, one fading, one cold, one never met */
  const ids = await p.evaluate(() => {
    const mk = (name, circle, days, energy) => {
      const q = newPerson(name); q.circle = circle; S.people.push(q);
      if(days != null) for(let i = 0; i < 3; i++)
        S.interactions.push({id: uid(), personId: q.id, date: addDays(today(), -(days + i * 9)),
          type: 'met_in_person', description: 'saw them', mood: null, energy,
          quality: '', followUp: null, followUpDone: false});
      return q.id;
    };
    const out = {near: mk('Sarah Chen', 'core', 2, 'energized'),
      mid: mk('Tom Weir', 'close', 20, 'neutral'),
      cold: mk('Kenji Abe', 'warm', 120, 'drained'),
      far: mk('Priya Nair', 'orbit', 200, ''),
      unmet: mk('Tokyo mentor', 'aspirational', null, '')};
    S.people.forEach(x => x.lastInteraction = lastInteractionDate(x.id));
    saveNow(); return out;
  });
  const go = async () => { await p.evaluate(() => { location.hash = '#/people'; }); await p.waitForTimeout(1800); };
  await go();

  console.log('\n1. the rings are a sky');
  yes('the canvas is mounted', await p.$('#skyCv') !== null);
  const n = () => p.evaluate(() => _sky.nodes.reduce((m, x) => (m[x.id] = {
    ring: x.ring, target: Math.round(x.target), glow: +x.glow.toFixed(2),
    hue: x.hue, unmet: x.unmet, ints: x.interactions}, m), {}));
  const N = await n();
  is('everyone is on the page', Object.keys(N).length, 5);
  /* further out is a wider ring, and that is the only thing distance says */
  const order = ['near','mid','cold','far','unmet'].map(k => N[ids[k]].target);
  yes('further out is a wider ring', order.every((v, i) => !i || v > order[i-1]), order.join(' < '));

  console.log('\n2. every property is read off what you did');
  yes('somebody seen this week is bright', N[ids.near].glow >= .18, String(N[ids.near].glow));
  yes('  somebody seen last month is dimmer', N[ids.mid].glow < N[ids.near].glow);
  yes('  somebody four months gone is nearly out', N[ids.cold].glow <= .04, String(N[ids.cold].glow));
  yes('time that leaves you fuller is warm gold', N[ids.near].hue >= 36 && N[ids.near].hue <= 45,
    String(N[ids.near].hue));
  /* and time that empties you is not: it cools, and at the far end it loses
     its colour altogether rather than becoming a different warm one */
  const cold = await p.evaluate(i => { const q = _sky.nodes.find(x => x.id === i);
    return {hue: q.hue, sat: q.sat}; }, ids.cold);
  yes('  and time that empties you is drained of it', cold.sat <= 20, JSON.stringify(cold));
  yes('  which is not the same as never having been read', N[ids.far].hue !== cold.hue
    || N[ids.far].ints === 0, JSON.stringify({far: N[ids.far].hue, cold: cold.hue}));
  is('somebody you have not met hangs on no thread', N[ids.unmet].unmet, true);
  yes('  and has nothing logged against them', N[ids.unmet].ints === 0);

  console.log('\n3. the card says it in words, and offers the one-tap kindness');
  await p.evaluate(() => _sky.stop());
  const at = await p.evaluate(i => { const q = _sky.nodes.find(x => x.id === i);
    const r = _sky.cv.getBoundingClientRect();
    return {x: Math.round(r.left + q.x), y: Math.round(r.top + q.y)}; }, ids.near);
  await p.mouse.move(at.x, at.y); await p.waitForTimeout(300);
  const card = await p.evaluate(() => { const c = document.querySelector('#skyCard');
    return {hidden: c.hidden, text: c.innerText, heart: !!c.querySelector('[data-skthought]'),
      open: !!c.querySelector('[data-skopen]')}; });
  yes('the card opens', !card.hidden);
  yes('  naming them', /Sarah Chen/.test(card.text), card.text.slice(0, 40));
  for(const w of ['last seen', 'energy', 'interactions'])
    yes(`  and giving ${w}`, card.text.toLowerCase().includes(w));
  yes('  with a way to open them', card.open);
  const before = await p.evaluate(() => S.interactions.length);
  await p.click('#skyCard [data-skthought]'); await p.waitForTimeout(900);
  const th = await p.evaluate(bf => { const l = S.interactions.slice(-1)[0];
    return {added: S.interactions.length - bf, type: l.type, date: l.date}; }, before);
  is('thinking of somebody is logged like anything else', th.added, 1);
  is('  as its own kind', th.type, 'thought');
  is('  today', th.date, await p.evaluate(() => today()));

  console.log('\n4. logging takes three taps');
  await go();
  yes('there is a button that is always there', await p.$('#pplQuick') !== null);
  await p.keyboard.press('i'); await p.waitForTimeout(800);
  const ql = await p.evaluate(() => { const m = document.querySelector('#modals .modal');
    return m ? {kinds: [...m.querySelectorAll('[data-qlkind]')].map(x => x.dataset.qlkind),
      energies: [...m.querySelectorAll('[data-qlenergy]')].length,
      who: !!m.querySelector('#qlWho'), note: !!m.querySelector('#qlNote'),
      noteIsOneLine: m.querySelector('#qlNote')?.tagName,
      again: !!m.querySelector('#qlMore'), date: m.querySelector('#qlDate')?.value} : null; });
  yes('I opens it on the People page', ql !== null);
  is('  six kinds, one tap each', ql.kinds,
     ['met_in_person','call','text','email','video_call','thought']);
  yes('  the readings are one tap too', ql.energies >= 3, String(ql.energies));
  is('  the note is one line, not an essay', ql.noteIsOneLine, 'INPUT');
  is('  and it is today unless you say otherwise', ql.date, await p.evaluate(() => today()));
  yes('  with a way to save and go straight to another', ql.again);

  const n0 = await p.evaluate(() => S.interactions.length);
  await p.fill('#qlWho', 'Tom Weir');
  await p.click('[data-qlkind="call"]');
  await p.click('[data-qlenergy="energized"]');
  await p.fill('#qlNote', 'long catch-up, he asked about the move');
  await p.click('#qlSave'); await p.waitForTimeout(1200);
  const saved = await p.evaluate(z => { const l = S.interactions.slice(-1)[0];
    return {added: S.interactions.length - z, who: byId(S.people, l.personId).name,
      type: l.type, energy: l.energy, note: l.description}; }, n0);
  is('three taps and a line is a whole interaction', saved,
     {added: 1, who: 'Tom Weir', type: 'call', energy: 'energized',
      note: 'long catch-up, he asked about the move'});
  yes('  and it closes when it is done', await p.evaluate(() => !document.querySelector('#modals .modal')));

  console.log('\n5. a friendship read back as a shape');
  await p.evaluate(i => { location.hash = '#/people/' + i; }, ids.near);
  await p.waitForTimeout(1600);
  const shape = await p.evaluate(() => ({
    heat: document.querySelectorAll('.heat i').length,
    lit: document.querySelectorAll('.heat i.on').length,
    marks: document.querySelectorAll('.ptl-mark').length,
    line: !!document.querySelector('.pe-path'),
    pull: (document.querySelector('.person-pull') || {}).textContent || '',
    quick: !!document.querySelector('#ppQuick')}));
  is('ninety days is ninety squares', shape.heat, 90);
  yes('  and the days something happened are marked', shape.lit >= 1 && shape.lit < 90, String(shape.lit));
  yes('the meetings are marks on a line', shape.marks >= 3, String(shape.marks));
  yes('  and the energy of each is a line that can slope', shape.line);
  yes('the quick way in is on their page too', shape.quick);

  console.log('\n6. it costs nothing when nobody is looking at it');
  await go();
  const st = await p.evaluate(() => Animator.stats());
  is('the sky is a foreground layer', st.loops.find(l => l.id === 'sky')?.priority, 2);
  yes('  so the ambient layers stand down under it', st.foreground);
  await p.evaluate(() => { location.hash = '#/today'; }); await p.waitForTimeout(1200);
  const gone = await p.evaluate(() => Animator.stats());
  yes('and leaving the room stops it', !gone.loops.some(l => l.id === 'sky' && l.active));

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(bad ? `\nsmoke167  ${bad} FAILED` : '\nsmoke167  all good');
  process.exit(bad ? 1 : 0);
})();
