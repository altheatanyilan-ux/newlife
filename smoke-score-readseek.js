/* smoke-score-readseek — in read mode, with the music playing, turn to another page and press a bar:
   the music goes to that bar (it used to carry on from the page it had been on). */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const yes = (n, c, g='') => { if(c) console.log('  ok   ' + n); else { bad++; console.log('  FAIL ' + n + '  — ' + JSON.stringify(g)); } };
const BARS = k => [...Array(k)].map((_, i) => `<measure number="${i + 1}">${i === 0 ? `<attributes><divisions>2</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><direction><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>60</per-minute></metronome></direction-type><sound tempo="60"/></direction>` : ''}
  ${['C', 'D', 'E', 'F'].map(s => `<note><pitch><step>${s}</step><octave>5</octave></pitch><duration>2</duration><voice>1</voice><type>quarter</type></note>`).join('')}</measure>`).join('');
const PIECE = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>Long Read</work-title></work><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${BARS(120)}</part></score-partwise>`;
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required']});
  const errs = [];
  const p = await (await b.newContext({viewport: {width: 1000, height: 800}})).newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  const rec = await p.evaluate(async xml => { const r = await takeScoreFile(new File([xml], 'Long Read.musicxml')); return r && r.id; }, PIECE);
  await p.evaluate(id => { scoreUi().focus = null; location.hash = '#/score/' + id; }, rec); await p.waitForTimeout(5000);
  await p.evaluate(() => setScoreReading(true)); await p.waitForTimeout(4500);
  const pages = await p.evaluate(() => document.querySelectorAll('#scCanvas svg').length);
  yes('the piece runs over several pages', pages >= 2, pages);
  await p.evaluate(() => { const g = document.querySelector('[data-plxgo]'); (document.querySelector('#scStrip [data-plxgo]') || document.querySelector('[data-plxgo]')).click(); });
  await p.waitForTimeout(1500);
  yes('it plays', await p.evaluate(() => !!(_plxNow && _plxNow.player && _plxNow.player.running)));
  await p.evaluate(() => scoreTurn(1, scoreById(scoreUi().id))); await p.waitForTimeout(700);
  const at = await p.evaluate(() => scoreView().at);
  yes('turned to another page', at >= 1, at);
  const t = await p.evaluate(() => { const g = _plxNow._geo(); const bars = [...g.values()].filter(v => v.shown);
    const bar = bars[Math.min(2, bars.length - 1)]; const host = document.getElementById('scStage'), r = host.getBoundingClientRect();
    return {k: bar.k, x: r.left + host.clientLeft - host.scrollLeft + bar.x + bar.w / 2, y: r.top + host.clientTop - host.scrollTop + bar.y + bar.h / 2, nShown: bars.length}; });
  /* a press in the middle third of the stage is neither a turn nor a pin */
  await p.mouse.click(t.x, t.y); await p.waitForTimeout(600);
  const now = await p.evaluate(() => { const q = _plxNow.player.position(); const pm = _plxNow.player.perfAt(q); return {k: pm.k, page: scoreView().at}; });
  yes('the press on a bar of this page took the music there', now.k >= t.k && now.k <= t.k + 1, {t, now});
  yes('and the page stayed on the one pressed', now.page === at, {now, at});
  yes('no page errors', !errs.length, errs);
  await b.close(); process.exit(bad ? 1 : 0);
})();
