/* Three small things a person notices before anything else: the icon in the
   bookmark bar, whether two rooms look the same in the sidebar, and whether
   the clock opens anywhere near the time it actually is. */
const { chromium } = require('playwright');
let fails = 0;
const ok = (n, cond, detail) => { console.log((cond ? '  ok   ' : '  FAIL ') + n + (cond ? '' : '  — ' + detail)); if(!cond) fails++; };

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1400,height:1000});
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(3000);
  const clean = () => page.evaluate(() => document.querySelectorAll('.toast').forEach(n => n.remove()));

  console.log('\n1. the bookmark mark');
  const icons = await page.evaluate(() => [...document.querySelectorAll('link[rel*="icon"]')]
    .map(l => ({rel:l.rel, type:l.type || ''})));
  ok('an SVG favicon is declared', icons.some(l => l.rel === 'icon' && /svg/.test(l.type)), JSON.stringify(icons));
  ok('and a PNG for iOS, which will not take an SVG', icons.some(l => /apple/.test(l.rel)), JSON.stringify(icons));
  /* drawn as paths, not text: a favicon renders outside the page and cannot
     reach the CJK webfont, so as text it would be tofu wherever no CJK font
     is installed */
  const svg = await page.evaluate(async () => {
    try { return await (await fetch(document.querySelector('link[rel="icon"]').href)).text(); } catch(e){ return ''; } });
  ok('the data URI is a real SVG document', /^<svg[\s>]/.test(svg.trim()), svg.slice(0, 60));
  ok('生 is five drawn strokes, not a text node',
     (svg.match(/<path/g) || []).length === 5 && !/<text/.test(svg), `${(svg.match(/<path/g)||[]).length} paths, text:${/<text/.test(svg)}`);
  ok('on a seal, so it reads on a light or a dark tab bar', /<rect/.test(svg) && /#b08968/i.test(svg), svg.slice(0, 90));
  const paints = await page.evaluate(() => Promise.all(
    [...document.querySelectorAll('link[rel*="icon"]')].map(l => new Promise(res => {
      const i = new Image(); i.onload = () => res(i.naturalWidth > 0); i.onerror = () => res(false); i.src = l.href; }))));
  ok('both actually decode and paint', paints.every(Boolean), JSON.stringify(paints));
  ok('a theme colour for each scheme',
     await page.evaluate(() => document.querySelectorAll('meta[name="theme-color"]').length === 2), 'no');

  console.log('\n2. Content and the Writing Studio do not look alike');
  const shapes = await page.evaluate(() => {
    const strip = s => s.replace(/\s+/g, ' ').trim();
    return {content: strip(NAV_ICONS.content), writing: strip(NAV_ICONS.writing)};
  });
  ok('their icons are different drawings', shapes.content !== shapes.writing, 'identical');
  ok('the Writing Studio keeps the pen', /M4\.5 19\.5/.test(shapes.writing), shapes.writing.slice(0, 50));
  ok('Content is the pipeline it is — three marks, open to filled',
     (shapes.content.match(/<circle/g) || []).length === 3 && !/19\.5 5\.7/.test(shapes.content), shapes.content.slice(0, 70));
  await page.evaluate(() => { location.hash = '#/compass'; rerender(); }); await page.waitForTimeout(900);
  /* The Writing Studio stopped being a sidebar room, so the two can no longer
     be compared there. What still matters is that the icon Content shows in
     the sidebar is the pipeline and not the pen. */
  const rendered = await page.evaluate(() => {
    const svg = document.querySelector('[data-page="content"] .ico svg');
    return svg ? {circles: svg.querySelectorAll('circle').length, paths: svg.querySelectorAll('path').length,
      pen: /M4\.5 19\.5/.test(svg.innerHTML)} : null;
  });
  ok('and Content renders the pipeline in the sidebar, not a pen',
     rendered && rendered.circles === 3 && !rendered.pen, JSON.stringify(rendered));

  console.log('\n3. the clock opens at the time it is');
  await page.evaluate(() => { location.hash = '#/today'; rerender(); }); await page.waitForTimeout(1100); await clean();
  const nowHM = await page.evaluate(() => nowHM());
  await page.evaluate(() => { const r = rhythmDay(today()); r.sleepTime = ''; saveNow(); rerender(); });
  await page.waitForTimeout(700); await clean();
  await page.click('#sleptAt'); await page.waitForTimeout(500);
  const slept = await page.evaluate(() => document.querySelector('#clkV')?.value);
  ok('"I went to sleep at", never set, starts at now', slept === nowHM, `${slept} vs ${nowHM}`);
  ok('and not at midnight, which is what an empty time field does', slept !== '00:00' && slept !== '', slept);
  await page.evaluate(() => closeModals()); await page.waitForTimeout(300);
  await page.click('#wokeAt'); await page.waitForTimeout(500);
  ok('"I woke up at" still shows the time already recorded',
     /^\d{2}:\d{2}$/.test(await page.evaluate(() => document.querySelector('#clkV')?.value || '')), 'empty');
  await page.evaluate(() => closeModals()); await page.waitForTimeout(300);

  /* the seeded value is only where the picker begins — nothing is recorded
     until Set, or the app would invent a bedtime for every day you looked at */
  await page.evaluate(() => { const r = rhythmDay(today()); r.sleepTime = ''; saveNow(); });
  await page.click('#sleptAt'); await page.waitForTimeout(400);
  await page.evaluate(() => closeModals()); await page.waitForTimeout(400);
  ok('opening it and walking away records nothing',
     await page.evaluate(() => !rhythmDay(today()).sleepTime), 'a time was invented');

  console.log('\nconsole:', errors.length ? errors.slice(0, 5) : 'clean');
  if(errors.length) fails += errors.length;
  console.log(fails ? `\n${fails} FAILED` : '\nall good');
  await browser.close(); process.exit(fails ? 1 : 0);
})();
