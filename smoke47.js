const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const errors=[];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    saveNow();
    location.hash='#/import';
  });
  await page.waitForTimeout(600);

  // verify Import Station page renders
  const pageInfo = await page.evaluate(() => ({
    h1: document.querySelector('h1')?.textContent,
    hasTa: !!document.querySelector('#impRaw'),
    hasProcess: !!document.querySelector('#impProcess'),
    hasDictate: !!document.querySelector('#impDictate'),
    hasUpload: !!document.querySelector('#impUpload'),
    navHasImport: !!document.querySelector('[data-page="import"]'),
  }));
  console.log('Import Station page:', JSON.stringify(pageInfo));

  // test smart split + queue rendering with multi-chunk paste
  const testPaste = `I'm so grateful for the morning light today. Woke up feeling genuinely alive.

---

I dreamed of a vast library where every book was a version of myself I hadn't become yet. The shelves went on forever.

---

I remember when I was twelve and my grandfather taught me to play chess. He never let me win on purpose. That was love.`;

  await page.evaluate((text) => {
    document.querySelector('#impRaw').value = text;
    document.querySelector('#impRaw').dispatchEvent(new Event('input'));
  }, testPaste);
  await page.waitForTimeout(200);

  // click Process
  await page.evaluate(() => document.querySelector('#impProcess').click());
  await page.waitForTimeout(500);

  const queueInfo = await page.evaluate(() => ({
    cards: document.querySelectorAll('.iq-card').length,
    types: [...document.querySelectorAll('.iq-type-sel')].map(s => s.value),
    hasBar: !!document.querySelector('.import-queue-bar'),
    keptCount: document.querySelector('.imp-kept-count')?.textContent,
  }));
  console.log('Queue after process:', JSON.stringify(queueInfo));

  // toggle discard on first card
  await page.evaluate(() => document.querySelectorAll('.iq-disc-btn')[0]?.click());
  await page.waitForTimeout(100);
  const afterDiscard = await page.evaluate(() => ({
    card0discarded: document.querySelectorAll('.iq-card')[0]?.classList.contains('iq-discarded'),
    keptCount: document.querySelector('.imp-kept-count')?.textContent,
    card0btnText: document.querySelectorAll('.iq-disc-btn')[0]?.textContent?.trim(),
  }));
  console.log('After discard card 0:', JSON.stringify(afterDiscard));

  // restore
  await page.evaluate(() => document.querySelectorAll('.iq-disc-btn')[0]?.click());
  await page.waitForTimeout(100);
  const afterRestore = await page.evaluate(() => ({
    card0restored: !document.querySelectorAll('.iq-card')[0]?.classList.contains('iq-discarded'),
  }));
  console.log('After restore card 0:', JSON.stringify(afterRestore));

  // commit all
  const beforeEntries = await page.evaluate(() => S.entries.length);
  await page.evaluate(() => document.querySelector('#impCommit')?.click());
  await page.waitForTimeout(600);
  const afterCommit = await page.evaluate(() => ({
    entriesAdded: S.entries.length,
    queueCleared: document.querySelectorAll('.iq-card').length === 0,
  }));
  console.log('After commit (before entries:', beforeEntries, '):', JSON.stringify(afterCommit));
  console.log('Entries added:', afterCommit.entriesAdded - beforeEntries);

  // verify entries are in journals
  const entryTypes = await page.evaluate(() => S.entries.map(e => e.type));
  console.log('Entry types in S.entries:', JSON.stringify(entryTypes));

  console.log('ERRORS:', errors.length); errors.forEach(e=>console.log(e));
  await browser.close();
})();
