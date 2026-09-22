/* smoke217 — the advice that belongs to no exercise, attached to all of them

   A catalogue tells you what to practise. The how — slow down when it is not
   improving, metronome on two and four, everything in every key, sing what
   you play, make a mess before you make music — is in the same books, spread
   across forewords, principle lists and postludes, belonging to no chapter
   and therefore to no exercise. Which is exactly how a student practises for
   a year without ever meeting it.

   So forty-eight of them are attached to all ninety-one, and the claims
   below are about the three ways that goes wrong.

   IT BECOMES FURNITURE. A panel that says the same four things forever is a
   panel nobody reads after the second week. So the hand is dealt from the
   day: the same exercise on the same day is the same four tips, and tomorrow
   is four different ones. Both halves matter — a hand that changed on every
   re-render would be unreadable, and one that never changed would be
   invisible. There are claims for each.

   THE SPECIFIC CROWDS OUT THE GENERAL. Seven of the forty-eight are about
   voicings. If matching tips take every slot, a voicing exercise never once
   shows "practise with a metronome", which is the most repeated instruction
   in all three books. So at most half the hand is specific, and there is a
   claim that a general tip always gets in.

   THE ATTRIBUTION GOES MISSING. The room's whole claim on somebody's time is
   that it relays teaching rather than inventing advice, and a claim you
   cannot check is not a claim. Every tip carries its book, its chapter and
   its page, and there are claims that all forty-eight do and that the page
   prints them.

   WHAT IS NOT CLAIMED. That the advice is correct — it is Siskind's,
   Levine's, Mantooth's and Peckham's, and this suite is in no position to
   second-guess it. What is claimed is that it is all here, that it says
   whose it is, and that it arrives where practice actually happens.
 */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n)
  : no(n, `\n         got  ${JSON.stringify(a)}\n         want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1500, height:1100}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));
  const clean = () => p.evaluate(() => {
    const j = jazzState(); j.tips = {favs:[], open:false}; j.progress = {};
    const pl = jazzPlanState(); pl.stages = {}; pl.sessions = []; pl.listens = {}; pl.session = null;
    saveNow();
  });
  const shut = () => p.evaluate(() => document.querySelectorAll('.overlay,.panel-overlay,#panel').forEach(n => n.remove()));
  await clean();

  /* ------------------------------------------------------------------ */
  console.log('\n1. the library itself');
  const lib = await p.evaluate(() => {
    const T = UNIVERSAL_PRACTICE_TIPS;
    const cats = JAZZ_TIP_CATEGORIES.map(c => c[0]);
    return {
      n: T.length,
      ids: T.length === new Set(T.map(t => t.id)).size,
      shaped: T.filter(t => !t.id || !t.title || !t.tip || !t.icon || !t.source || !t.sourceDetail
        || !t.category || !Array.isArray(t.appliesTo) || !t.appliesTo.length).map(t => t.id),
      strayCat: T.filter(t => !cats.includes(t.category)).map(t => t.id),
      books: [...new Set(T.map(t => t.source))].sort(),
      short: T.filter(t => t.tip.length < 60).map(t => t.id),
      numbered: T.every((t, i) => t.id === 'UPT-' + String(i + 1).padStart(2, '0')),
    };
  });
  is('forty-eight of them', lib.n, 48);
  yes('  each with its own id, in order', lib.ids && lib.numbered);
  is('  every field on every one', lib.shaped, []);
  is('  and every one filed under a real heading', lib.strayCat, []);
  is('  out of the books the exercises come from', lib.books,
     ['Levine','Mantooth','Peckham','Siskind Book 1','Siskind Book 2','Siskind Book 3','Siskind Books 1-3']);
  is('  none of them a fragment', lib.short, []);
  is('  and thirteen headings to read them under', await p.evaluate(() => JAZZ_TIP_CATEGORIES.length), 13);

  console.log('\n1b. every kind of exercise in the room knows what it is');
  is('no generator type without tags', await p.evaluate(() => {
    const kinds = [...new Set(Object.values(jazzBook()).map(e => e.kind))];
    return kinds.filter(k => !JAZZ_TIP_TAGS[k]); }), []);
  is('  and every tag a tip asks for is one a tip could be given', await p.evaluate(() => {
    const given = new Set(); Object.values(JAZZ_TIP_TAGS).forEach(v => v.forEach(t => given.add(t)));
    given.add('all'); given.add('vocal');   /* the room is a piano room; those two are for the list */
    return [...new Set(UNIVERSAL_PRACTICE_TIPS.flatMap(t => t.appliesTo))].filter(t => !given.has(t)); }), []);

  /* ------------------------------------------------------------------ */
  console.log('\n2. the hand is dealt from the day, not from a coin');
  const deal = await p.evaluate(() => {
    const ex = jazzExercise('2.1');
    const a = jazzTipsFor(ex, '2026-03-01').map(t => t.id);
    const again = jazzTipsFor(ex, '2026-03-01').map(t => t.id);
    const tomorrow = jazzTipsFor(ex, '2026-03-02').map(t => t.id);
    const other = jazzTipsFor(jazzExercise('1.1'), '2026-03-01').map(t => t.id);
    return {a, again, tomorrow, other};
  });
  is('the same exercise on the same day deals the same hand', deal.again, deal.a);
  yes('  a different day deals a different one', JSON.stringify(deal.tomorrow) !== JSON.stringify(deal.a),
      JSON.stringify(deal.a));
  yes('  and a different exercise on the same day too', JSON.stringify(deal.other) !== JSON.stringify(deal.a));

  const spread = await p.evaluate(() => {
    const ex = jazzExercise('2.1'), sizes = {}, seen = {}, dups = [];
    const d0 = Date.parse('2026-01-01');
    for(let i = 0; i < 300; i++){
      const day = new Date(d0 + i * 86400000).toISOString().slice(0, 10);
      const ids = jazzTipsFor(ex, day).map(t => t.id);
      sizes[ids.length] = (sizes[ids.length] || 0) + 1;
      if(new Set(ids).size !== ids.length) dups.push(day);
      ids.forEach(x => seen[x] = 1);
    }
    return {sizes, dups: dups.length, distinct: Object.keys(seen).length};
  });
  is('never fewer than three, never more than five', Object.keys(spread.sizes).sort(), ['3','4','5']);
  yes('  and it really does use all three counts',
      Object.values(spread.sizes).every(n => n > 30), JSON.stringify(spread.sizes));
  is('  never the same tip twice in one hand', spread.dups, 0);
  /* That one cannot fail on the shipped forty-eight, because no tip is
     tagged both `all` and a piano tag, so nothing is ever in both piles to
     be taken twice. A tip written that way tomorrow would be, and the guard
     that stops it is worth proving — so one is added, the hand is dealt, and
     it is taken out again. */
  is('  nor if a tip is written into both piles at once', await p.evaluate(() => {
    const both = {id:'UPT-TEST', icon:'🧪', title:'In both piles', tip:'x'.repeat(80),
      source:'Design Doc', sourceDetail:'a test', category:'tempo', appliesTo:['all','voicings']};
    UNIVERSAL_PRACTICE_TIPS.push(both);
    const ex = jazzExercise('2.1'); const dups = [];
    const d0 = Date.parse('2026-01-01');
    for(let i = 0; i < 120; i++){
      const day = new Date(d0 + i * 86400000).toISOString().slice(0, 10);
      const ids = jazzTipsFor(ex, day).map(t => t.id);
      if(new Set(ids).size !== ids.length) dups.push(day);
    }
    UNIVERSAL_PRACTICE_TIPS.pop();
    return dups.length; }), 0);
  yes('  over a year one exercise sees most of the library', spread.distinct >= 35, String(spread.distinct));

  /* ------------------------------------------------------------------ */
  console.log('\n3. what the exercise is decides what it is told');
  const match = await p.evaluate(() => {
    const out = {};
    const check = (id, tag) => {
      const ex = jazzExercise(id);
      const days = [];
      const d0 = Date.parse('2026-01-01');
      for(let i = 0; i < 60; i++) days.push(new Date(d0 + i * 86400000).toISOString().slice(0, 10));
      const hands = days.map(d => jazzTipsFor(ex, d));
      return {
        tags: jazzTipTags(ex),
        firstAlwaysMatches: hands.every(h => h[0].appliesTo.some(a => jazzTipTags(ex).includes(a))),
        alwaysAGeneralOne: hands.every(h => h.some(t => t.appliesTo.includes('all'))),
        neverOffTopic: hands.every(h => h.every(t =>
          t.appliesTo.includes('all') || t.appliesTo.some(a => jazzTipTags(ex).includes(a)))),
        wants: tag,
      };
    };
    out.voicing = check('2.1', 'voicings');
    out.lick = check('6.1', 'licks');
    return out;
  });
  is('a ii-V-I is voicing work', match.voicing.tags, ['voicings','comping']);
  yes('  and the first thing it says is always about that', match.voicing.firstAlwaysMatches);
  yes('  but a general one always gets in as well', match.voicing.alwaysAGeneralOne);
  yes('  and nothing off-topic ever appears', match.voicing.neverOffTopic);
  yes('a lick page is told about licks', match.lick.tags.includes('licks'), JSON.stringify(match.lick.tags));
  yes('  with the same two rules holding', match.lick.firstAlwaysMatches && match.lick.alwaysAGeneralOne);

  console.log('\n3b. the two tips for singers never turn up in a piano room');
  is('not on any exercise, ever', await p.evaluate(() => {
    const vocal = UNIVERSAL_PRACTICE_TIPS.filter(t => t.appliesTo.length === 1 && t.appliesTo[0] === 'vocal').map(t => t.id);
    const d0 = Date.parse('2026-01-01');
    const hit = [];
    Object.keys(jazzBook()).slice(0, 25).forEach(id => {
      for(let i = 0; i < 8; i++){
        const day = new Date(d0 + i * 86400000).toISOString().slice(0, 10);
        jazzTipsFor(jazzExercise(id), day).forEach(t => { if(vocal.includes(t.id)) hit.push(id + '/' + t.id); });
      }
    });
    return hit; }), []);
  is('  nor as the tip of the day', await p.evaluate(() => {
    const d0 = Date.parse('2026-01-01'); const hit = [];
    for(let i = 0; i < 200; i++){
      const day = new Date(d0 + i * 86400000).toISOString().slice(0, 10);
      const t = jazzTipOfDay(day);
      if(t.appliesTo.length === 1 && t.appliesTo[0] === 'vocal') hit.push(day);
    }
    return hit; }), []);
  is('  but both are in the full list', await p.evaluate(() =>
    jazzTipsByCategory().find(g => g.cat === 'vocal')?.tips.length), 2);

  /* ------------------------------------------------------------------ */
  console.log('\n4. on the exercise page');
  await p.evaluate(() => { location.hash = '#/jazz/2.1'; }); await p.waitForTimeout(2200);
  const page = await p.evaluate(() => {
    const d = document.querySelector('.jz-tips');
    const rows = [...document.querySelectorAll('.jz-tips .jz-tip')];
    return {there: !!d, shut: d ? !d.open : null, n: rows.length,
      cited: rows.every(r => /\bp\.?\s?\d|pp\.|Principle|Postlude|Unit|Chapter|assignment/i.test(r.querySelector('.jz-tipsrc')?.textContent || '')),
      titled: rows.every(r => (r.querySelector('.jz-tiphead b')?.textContent || '').length > 3),
      stars: document.querySelectorAll('.jz-tips [data-jzstar]').length,
      all: !!document.querySelector('#jzAllTips')};
  });
  yes('the section is there', page.there);
  yes('  shut, so it does not push the buttons off the screen', page.shut);
  yes('  with between three and five in it', page.n >= 3 && page.n <= 5, String(page.n));
  yes('  every one saying whose it is and where', page.cited);
  yes('  every one with a title', page.titled);
  is('  and a star on each', page.stars, page.n);
  yes('  and a way through to all of them', page.all);

  console.log('\n4b. the page shows what the day dealt, not something else');
  is('the same ids the picker chose', await p.evaluate(() => {
    const shown = [...document.querySelectorAll('.jz-tips .jz-tip')].map(n => n.dataset.jztip);
    const want = jazzTipsFor(jazzExercise('2.1')).map(t => t.id);
    return [shown.join(','), want.join(',')];
  }).then(r => r[0] === r[1]), true);

  console.log('\n4c. starring one does not redraw the page');
  const star = await p.evaluate(async () => {
    const before = document.querySelector('.jz-tips .jz-tip');
    const id = before.dataset.jztip;
    const svg = !!document.querySelector('#jzScore svg');
    document.querySelector(`[data-jzstar="${id}"]`).click();
    await new Promise(r => setTimeout(r, 150));
    const after = document.querySelector('.jz-tips .jz-tip');
    return {id, saved: jazzTipFavs(), same: before === after,
      mark: document.querySelector(`[data-jzstar="${id}"]`).textContent.trim(),
      scoreStillThere: svg ? !!document.querySelector('#jzScore svg') : 'no score to keep'};
  });
  is('it is written down', star.saved, [star.id]);
  is('  the star fills in', star.mark, '★');
  yes('  the very same node is still on the page', star.same);
  yes('  and the engraving was not thrown away and drawn again', star.scoreStillThere !== false);

  console.log('\n4d. a starred tip comes round more often');
  const weight = await p.evaluate(() => {
    const ex = jazzExercise('2.1');
    const d0 = Date.parse('2026-01-01');
    const days = []; for(let i = 0; i < 200; i++) days.push(new Date(d0 + i * 86400000).toISOString().slice(0, 10));
    const count = id => days.filter(d => jazzTipsFor(ex, d).some(t => t.id === id)).length;
    const pick = UNIVERSAL_PRACTICE_TIPS.find(t => t.appliesTo.includes('all')).id;
    const j = jazzState();
    j.tips.favs = [];            const without = count(pick);
    j.tips.favs = [pick];        const withIt = count(pick);
    j.tips.favs = []; saveNow();
    return {pick, without, withIt};
  });
  yes('starred, it turns up more', weight.withIt > weight.without,
      `${weight.pick}: ${weight.without} days → ${weight.withIt}`);
  yes('  and it is still not guaranteed every day', weight.withIt < 200, String(weight.withIt));
  await p.evaluate(() => { const j = jazzState(); j.tips.favs = []; saveNow(); });

  /* ------------------------------------------------------------------ */
  console.log('\n5. all forty-eight, when you want them');
  await p.evaluate(() => openJazzTips()); await p.waitForTimeout(700);
  const panel = await p.evaluate(() => ({
    tips: document.querySelectorAll('#panel .jz-tip').length,
    groups: document.querySelectorAll('#panel .vp-sec .sc').length,
    chips: document.querySelectorAll('#panel [data-jzcat]').length,
    fullCite: [...document.querySelectorAll('#panel .jz-tipsrc')].some(n => /Jazz Piano Fundamentals|The Jazz Theory Book|Voicings for Jazz Keyboard/.test(n.textContent)),
  }));
  is('every one of them', panel.tips, 48);
  is('  grouped under the thirteen headings', panel.groups, 13);
  is('  with a way to narrow to one', panel.chips, 14);
  yes('  and the full title of the book on each', panel.fullCite);

  console.log('\n5b. narrowing it');
  await p.evaluate(() => document.querySelector('#panel [data-jzcat="metronome"]').click());
  await p.waitForTimeout(400);
  is('only that heading', await p.evaluate(() => ({
    groups: document.querySelectorAll('#panel .vp-sec .sc').length,
    tips: document.querySelectorAll('#panel .jz-tip').length})), {groups:1, tips:3});
  await p.evaluate(() => document.querySelector('#panel [data-jzcat="all"]').click());
  await p.waitForTimeout(400);

  console.log('\n5c. and down to the ones you starred');
  await p.evaluate(() => { document.querySelector('#panel [data-jzstar="UPT-04"]').click();
    document.querySelector('#panel [data-jzstar="UPT-29"]').click(); });
  await p.waitForTimeout(300);
  is('the count keeps up without a redraw', await p.evaluate(() =>
    document.querySelector('#panel .jz-favcount')?.textContent), '2');
  await p.evaluate(() => { const c = document.querySelector('#jzFavOnly'); c.checked = true; c.onchange(); });
  await p.waitForTimeout(400);
  is('  and only those two are left', await p.evaluate(() =>
    [...document.querySelectorAll('#panel .jz-tip')].map(n => n.dataset.jztip).sort()), ['UPT-04','UPT-29']);
  await shut();

  /* ------------------------------------------------------------------ */
  console.log('\n6. one at the top of the day’s plan');
  await p.evaluate(() => { jazzStartStage('1', 'standard'); saveNow(); location.hash = '#/jazz/plan'; });
  await p.waitForTimeout(1600);
  const plan = await p.evaluate(() => {
    const box = document.querySelector('.jz-today-tip');
    return {there: !!box, id: box?.dataset.jztip, want: jazzTipOfDay().id,
      titled: (box?.querySelector('b.serif')?.textContent || '').length > 3,
      cited: /p\.|pp\.|Principle|Postlude|Unit|Chapter|assignment/i.test(box?.querySelector('.jz-tipsrc')?.textContent || ''),
      starrable: !!box?.querySelector('[data-jzstar]'),
      toAll: !!document.querySelector('#jzAllTips')};
  });
  yes('the plan opens with one', plan.there);
  is('  and it is the day’s', plan.id, plan.want);
  yes('  with its title and its source', plan.titled && plan.cited);
  yes('  a star on it, and a way to the rest', plan.starrable && plan.toAll);
  is('  everybody gets the same one all day', await p.evaluate(() =>
    [jazzTipOfDay('2026-07-04').id, jazzTipOfDay('2026-07-04').id]).then(r => r[0] === r[1]), true);
  yes('  and a different one tomorrow', await p.evaluate(() =>
    jazzTipOfDay('2026-07-04').id !== jazzTipOfDay('2026-07-05').id));

  /* ------------------------------------------------------------------ */
  console.log('\n7. where a tip points at something this room does');
  const goes = await p.evaluate(() => {
    const withGo = UNIVERSAL_PRACTICE_TIPS.filter(t => t.goes);
    return {n: withGo.length, ids: withGo.map(t => t.id),
      allReal: withGo.every(t => ['#/jazz/cards','#/jazz/plan'].includes(t.goes)),
      planShown: !!jazzTipGoes(jazzTip('UPT-45')),
      cardsShown: !!jazzTipGoes(jazzTip('UPT-13'))};
  });
  yes('there are some', goes.n >= 3, JSON.stringify(goes.ids));
  yes('  and every one of them points somewhere that exists', goes.allReal);
  yes('  the four-part session points at the plan, now a stage is running', goes.planShown);
  yes('  and the random-key tip at the flashcards', goes.cardsShown);

  console.log('\n7b. and it is not offered when there is nothing to reach');
  is('with no stage started, the plan link is withheld', await p.evaluate(() => {
    const pl = jazzPlanState(); const keep = pl.stages; pl.stages = {};
    const shown = !!jazzTipGoes(jazzTip('UPT-45'));
    const cards = !!jazzTipGoes(jazzTip('UPT-13'));
    pl.stages = keep; saveNow();
    return [shown, cards]; }), [false, true]);

  console.log('\n7c. pressing one goes there');
  /* Which tips today's hand happens to hold is the day's business, and a
     claim that waits for the right day is a claim that does not run. So the
     card is built and bound exactly as a page builds one, and pressed. */
  await p.evaluate(() => { location.hash = '#/jazz/2.7'; }); await p.waitForTimeout(1800);
  const jumped = await p.evaluate(async () => {
    const host = document.createElement('div');
    host.innerHTML = jazzTipHTML(jazzTip('UPT-13'));
    document.querySelector('.jz-page').appendChild(host);
    bindJazzTips(host);
    const go = host.querySelector('[data-jzgo]');
    if(!go) return ['no door was drawn', '#/jazz/cards'];
    const want = go.dataset.jzgo;
    go.click(); await new Promise(r => setTimeout(r, 900));
    return [location.hash, want];
  });
  is('it lands where it said', jumped[0], jumped[1]);

  /* ------------------------------------------------------------------ */
  console.log('\n8. starring survives the night');
  await p.evaluate(() => { const j = jazzState(); j.tips.favs = ['UPT-04','UPT-11']; j.tips.open = true; saveNow(); });
  await p.reload(); await p.waitForTimeout(2400);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  is('both stars are still on', await p.evaluate(() => jazzTipFavs().sort()), ['UPT-04','UPT-11']);
  await p.evaluate(() => { location.hash = '#/jazz/2.1'; }); await p.waitForTimeout(2000);
  is('  and the section opens the way it was left', await p.evaluate(() =>
    !!document.querySelector('.jz-tips')?.open), true);
  /* and the other half of that: shutting it has to be written down, or it
     opens the way it was left exactly once */
  is('  shutting it is remembered too', await p.evaluate(async () => {
    const d = document.querySelector('.jz-tips');
    d.open = false; d.dispatchEvent(new Event('toggle'));
    await new Promise(r => setTimeout(r, 120));
    const shut = jazzTipState().open;
    d.open = true; d.dispatchEvent(new Event('toggle'));
    await new Promise(r => setTimeout(r, 120));
    return [shut, jazzTipState().open]; }), [false, true]);

  console.log('\n8b. a star on a tip that no longer exists is forgotten');
  is('the made-up one is dropped, the real ones kept', await p.evaluate(() => {
    const j = jazzState(); j.tips.favs = ['UPT-04','UPT-99','nonsense'];
    return jazzTipFavs().sort(); }), ['UPT-04']);

  console.log('\n— errors —');
  is('no page errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
