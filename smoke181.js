/* smoke181 — the things you keep needing to hear, kept where you will see them.

   "For the divination tool sessions that I can keep, add a feature where I can
   pin them to today's page — cause some of them contain message that I know I
   need to hear — so I want to see them every day. same for records of quotes
   and reflections etc." And then: put it where the vision board is, under the
   Morning Theatre of Today's looking-inward view.

   The thing that makes this one mechanism rather than three: a kept divination
   reading IS an entry — S.entries, type 'divination' — and so is a quote, and
   so is a reflection. So the pin is a flag on an entry, and the control lives
   in entryCard(), which is what draws an entry everywhere in the house. Pin it
   from the Lived Record, from a person's page, from the timeline, from the
   review: same button, because it is the same function drawing it.

   A flag on the entry rather than a list of pinned ids kept elsewhere. A list
   would need sweeping every time an entry is deleted, and that sweep is what
   gets forgotten until somebody's Today page is trying to draw an entry that
   no longer exists — so section 6 deletes a pinned entry and checks the panel
   simply stops mentioning it.

   Two traps, both in placement rather than in pinning:

   The theatre's sections can be dragged into your own order, and that order is
   remembered. The code that made a newly-added section appear for someone who
   already had an order pushed it onto the END — which for a section whose
   whole point is to sit beside the vision board is the wrong place, and would
   have been invisible from this side of the feature because a fresh house gets
   the right order anyway. Section 4 saves an order from before Pinned existed
   and reloads.

   And the vision board's own button in entryCard was a 📌 reading "pin to the
   vision board". Two pins on one row meaning two different places is not
   tellable, so the board's is its own glyph now; section 5 holds them apart. */
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
  const errs = [];
  const ctx = await b.newContext({viewport:{width:1400, height:1100}});
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2000); }

  /* the looking-inward view is where the theatre lives */
  const inward = async () => { await p.evaluate(() => { setTodayView('in');
    if(location.hash === '#/today') rerender(); else location.hash = '#/today'; });
    await p.waitForTimeout(1400);
    await p.evaluate(() => { const t = document.querySelector('#t-theatre'); if(t) t.open = true; });
    await p.waitForTimeout(400); };
  const panel = () => p.evaluate(() => {
    const sec = document.querySelector('[data-th="pins"]');
    if(!sec) return null;
    return {titles: [...sec.querySelectorAll('.entry .title, .entry .body')].map(n => n.textContent.trim().slice(0, 40)),
      cards: sec.querySelectorAll('.entry').length,
      note: sec.querySelector('summary .mono')?.textContent.trim(),
      empty: !!sec.querySelector('.empty')};
  });

  console.log('\n1. every entry, wherever it is read, can be kept');
  const seeded = await p.evaluate(() => {
    const mk = (type, title, body) => { const e = {id:uid(), type, title, body, occurredAt:today(),
      createdAt:new Date().toISOString(), media:[], links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[]},
      people:[], places:[], emotions:[], tags:[], confidence:'', extra:{}};
      S.entries.push(e); return e.id; };
    const ids = {quote: mk('quote', 'Seneca', 'smoke181 we suffer more in imagination than in reality'),
      reflection: mk('reflection', 'smoke181 the thing I keep not doing', 'It is the same thing every week.')};
    saveNow(); return ids;
  });
  await p.evaluate(() => { location.hash = '#/journals/quote'; }); await p.waitForTimeout(1500);
  const onPage = await p.evaluate(() => ({cards: document.querySelectorAll('.entry').length,
    pins: document.querySelectorAll('.entry [data-pin]').length}));
  yes('the Lived Record draws the entries', onPage.cards > 0, JSON.stringify(onPage));
  is('  and every one of them has a pin', onPage.pins, onPage.cards);

  await p.evaluate(id => document.querySelector(`.entry[data-entry="${id}"] [data-pin]`).click(), seeded.quote);
  await p.waitForTimeout(900);
  const afterPin = await p.evaluate(id => { const e = byId(S.entries, id);
    return {pinned: !!e.pinned, at: (e.pinnedAt || '').slice(0, 4), n: pinnedEntries().length}; }, seeded.quote);
  yes('  pressing it pins the entry', afterPin.pinned);
  yes('  and writes down when', /^\d{4}$/.test(afterPin.at), afterPin.at);
  is('  so it is one of the pinned', afterPin.n, 1);

  console.log('\n2. and they gather on Today, in the Morning Theatre');
  await inward();
  const one = await panel();
  yes('there is a Pinned section', !!one, 'no section');
  is('  holding the one that was pinned', one && one.cards, 1);
  yes('  which is the quote', (one?.titles || []).join(' ').includes('Seneca'), JSON.stringify(one?.titles));
  yes('  and it says how many there are to reread', /1 to reread/.test(one?.note || ''), one?.note);

  console.log('\n3. it sits beside the vision board, which is where it was asked for');
  const order = await p.evaluate(() => [...document.querySelectorAll('.th-sec')].map(n => n.dataset.th));
  const iP = order.indexOf('pins'), iB = order.indexOf('board');
  yes('both are in the theatre', iP >= 0 && iB >= 0, order.join(' '));
  is('  with Pinned immediately before the board', iB - iP, 1);

  console.log('\n4. a house that set its own order before Pinned existed still gets it there');
  /* the trap: appending a new section puts it at the bottom, which for this
     one is not where it belongs — and a fresh house would never show it */
  await p.evaluate(() => {
    theatre().prefs.order = ['board','script','winning','scene','scripting','tension','thanks','aim'];
    saveNow();
  });
  await p.evaluate(() => flushSave());
  await p.reload(); await p.waitForTimeout(2600);
  const saved = await p.evaluate(() => theatre().prefs.order);
  yes('Pinned was added to the remembered order', saved.includes('pins'), saved.join(' '));
  is('  right before the board, not at the end',
     saved.indexOf('board') - saved.indexOf('pins'), 1);
  is('  and the order they had chosen is otherwise untouched',
     saved.filter(k => k !== 'pins'), ['board','script','winning','scene','scripting','tension','thanks','aim']);

  console.log('\n5. the board\'s own button and the pin are tellable apart');
  await p.evaluate(() => { location.hash = '#/journals/quote'; }); await p.waitForTimeout(1500);
  const glyphs = await p.evaluate(id => { const c = document.querySelector(`.entry[data-entry="${id}"]`);
    return {vb: c.querySelector('[data-vbpin]')?.textContent.trim(),
      pin: c.querySelector('[data-pin]')?.textContent.trim(),
      vbTitle: c.querySelector('[data-vbpin]')?.title,
      pinTitle: c.querySelector('[data-pin]')?.title}; }, seeded.quote);
  yes('a quote offers both', glyphs.vb && glyphs.pin, JSON.stringify(glyphs));
  yes('  and they do not wear the same face', glyphs.vb !== glyphs.pin, JSON.stringify(glyphs));
  yes('  each saying where it puts things',
      /vision board/.test(glyphs.vbTitle || '') && /Today/.test(glyphs.pinTitle || ''), JSON.stringify(glyphs));

  console.log('\n6. unpinning, and deleting, both simply stop it being there');
  await p.evaluate(id => document.querySelector(`.entry[data-entry="${id}"] [data-pin]`).click(), seeded.quote);
  await p.waitForTimeout(900);
  const off = await p.evaluate(id => { const e = byId(S.entries, id);
    return {pinned: !!e.pinned, at: e.pinnedAt === undefined, n: pinnedEntries().length}; }, seeded.quote);
  yes('pressing the lit pin takes it off', !off.pinned);
  yes('  and forgets when it went on', off.at);
  is('  leaving nothing pinned', off.n, 0);
  await inward();
  const emptied = await panel();
  yes('  so the section says so rather than showing a hole', emptied.empty && emptied.cards === 0,
      JSON.stringify(emptied));

  /* a pin is a flag on the entry, so a deleted entry cannot be left behind */
  await p.evaluate(id => { setEntryPinned(id, true); }, seeded.reflection);
  await inward();
  is('a second pinned entry shows', (await panel()).cards, 1);
  await p.evaluate(id => { spliceOut(S.entries, x => x.id === id); saveNow(); }, seeded.reflection);
  await inward();
  const gone = await panel();
  is('  and deleting it leaves nothing dangling', gone.cards, 0);
  yes('  with no error raised drawing the page', !errs.length, errs.join(' | '));

  console.log('\n7. a reading can be kept and pinned in the same breath');
  /* the paper-reading route, because it is the one ceremony with no animation
     to wait out — and it uses the same keep box as every other one */
  await p.evaluate(() => { location.hash = '#/divination'; }); await p.waitForTimeout(1400);
  await p.evaluate(() => openPhysicalReading()); await p.waitForTimeout(900);
  await p.evaluate(() => { const b = document.querySelector('[data-dvspread="daily"]'); if(b) b.click(); });
  await p.waitForTimeout(600);
  await p.fill('#phQ', 'smoke181 what do I need to hear');
  await p.fill('[data-phin="0"]', 'The Tower'); await p.waitForTimeout(500);
  await p.click('#phGo'); await p.waitForTimeout(1200);
  const box = await p.evaluate(() => ({keep: !!document.querySelector('#dvSave'),
    pin: !!document.querySelector('#dvPin'), revisit: !!document.querySelector('#dvRevisit')}));
  yes('the keep box offers to pin it', box.keep && box.pin, JSON.stringify(box));
  yes('  beside the older "come back to this one", not instead of it', box.revisit);
  await p.check('#dvPin');
  await p.fill('#dvText', 'smoke181 it is the thing I have been avoiding');
  await p.click('#dvSave'); await p.waitForTimeout(1300);
  const kept = await p.evaluate(() => { const e = pinnedEntries()[0];
    return e ? {type: e.type, pinned: !!e.pinned, body: (e.body||'').slice(0, 20), n: pinnedEntries().length} : null; });
  is('  keeping it pins the reading', kept && kept.type, 'divination');
  is('  and it is the only thing pinned', kept && kept.n, 1);
  await inward();
  const withReading = await panel();
  is('  so Today holds the reading', withReading.cards, 1);

  console.log('\n8. and the theatre it lives in is still there tomorrow');
  /* Found while testing section 4, which could not pass for a reason that had
     nothing to do with pinning: migrate() carried a clause reading

         if(S.rehearsal && !S.rehearsal){ S.rehearsal = S.rehearsal; } delete S.rehearsal;

     — a rename migration whose two sides had been collapsed onto one name by
     some past search-and-replace. The condition can never be true, so all that
     survived of it was an unconditional delete, running on every boot. The
     entire Morning Theatre was thrown away and reseeded empty every time the
     page was opened: the self-image script, the winning feeling, the chief aim,
     the vision board, every scene, every scripting, the thanks, and the 21-day
     tracker. Nothing in the app said so, because an empty theatre looks exactly
     like a theatre you have not used yet. */
  await p.evaluate(() => { const r = theatre();
    r.script = 'smoke181 I am the person who finishes things';
    r.winning = 'smoke181 the afternoon it went right';
    r.aim = 'smoke181 by June I will have shipped it';
    r.board.items.push({id:uid(), type:'quote', text:'smoke181 on the board',
      source:'', createdAt:new Date().toISOString()});
    r.scenes.push({id:uid(), date:today(), timeOfDay:'morning', vivid:5, intensity:5});
    r.scripts.push({id:uid(), date:today(), cat:'today', body:'smoke181 a script', words:3});
    r.thanks.push({id:uid(), date:today(), lines:['smoke181 thanks']});
    r.days.push(today());
    saveNow(); });
  await p.evaluate(() => flushSave());
  const before = await p.evaluate(() => { const r = theatre();
    return {script:r.script, winning:r.winning, aim:r.aim, board:r.board.items.length,
      scenes:r.scenes.length, scripts:r.scripts.length, thanks:r.thanks.length, days:r.days.length}; });
  await p.reload(); await p.waitForTimeout(2800);
  const after = await p.evaluate(() => { const r = theatre();
    return {script:r.script, winning:r.winning, aim:r.aim, board:r.board.items.length,
      scenes:r.scenes.length, scripts:r.scripts.length, thanks:r.thanks.length, days:r.days.length}; });
  is('everything written into the theatre survives a reload', after, before);
  yes('  the chief aim in particular, which is meant to be read every day',
      after.aim === 'smoke181 by June I will have shipped it', after.aim);
  yes('  and the 21-day tracker still knows which days were kept', after.days === 1, String(after.days));

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(`\nsmoke181  ${bad ? bad + ' FAILED' : 'all good'}`);
  process.exit(bad ? 1 : 0);
})();
