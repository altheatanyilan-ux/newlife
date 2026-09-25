/* test-sync-accuracy — Recording sync, Phase 2: how accurate the engine is.

   The engine is given what it will be given in the site — a recording and
   a score — and nothing else; its map is then checked bar by bar against
   the known answer. Everything runs in the built site in Chromium: the
   score is read by musicXmlTimeline, the audio resampled by the browser,
   the alignment done by syncAlign in its Worker (tools/sync-harness.js).

   THE CLASSICAL SET (what Repertoire is for), tools/sync-testset/:
   - ten piano pieces from ASAP, played by real pianists (MAESTRO
     competition MIDI: their timing, dynamics and pedalling), sounded on
     the Steinway B samples; the downbeats are the dataset's hand
     annotations. One Haydn movement twice: repeats taken, and skipped.
   - the opening of Haydn's "Lark" quartet on the VSCO strings, and the
     same orchestrated for strings, woodwinds and horn, with rubato.
   THE JAZZ SET: six tunes on the jazz band (tools/sync-band.js).
   Every sound is a recording of a real instrument (vendor/orchestra, CC0).

   Reported per piece: the reading of the repeats found against the one
   played; key and tuning; for every downbeat the error in ms, with the
   share within ±50, ±100 and ±200 ms (the targets: ±50 ms for jazz heads
   with drums, ±100 ms for rubato and classical); the engine's own
   per-bar confidence beside the true error; how long the analysis took.

   Run: node test-sync-accuracy.js [id ...] [--classical|--jazz] [--write] [--bars]
   --write puts the report and the per-bar log in docs/sync/ and a
   listening excerpt of every performance in docs/sync/audio/ (MP3 when an
   ffmpeg is at hand, else nothing). */
const {chromium} = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = __dirname;
const args = process.argv.slice(2), want = args.filter(a => !a.startsWith('--'));
const flag = f => args.includes(f);

const TWNBAY = {id: 'there-will-never-be-another-you', title: 'There Will Never Be Another You', key: 'Eb', form: 'AB', measures: 32,
  timeSignature: '4/4', tempo: 'Medium Up',
  chordProgression: 'A: EbM7|EbM7|Dm7b5|G7b9|Cm7|Cm7|Bbm7|Eb7|AbM7|Db7|EbM7|Cm7|F7|F7|Fm7|Bb7 ' +
    'B: EbM7|EbM7|Dm7b5|G7b9|Cm7|Cm7|Bbm7|Eb7|AbM7|Db7|EbM7|Am7b5 D7|EbM7 C7|F7 Bb7|EbM7|Fm7 Bb7'};
const JAZZ = [
  {id: 'autumn-leaves', title: 'Autumn Leaves', note: 'medium swing in G minor (the chart is in E minor: +3), a turnaround vamp for an intro, a tag ending',
    plan: {seed: 11, bpm: 132, choruses: 5, heads: 1, style: 'swing', transpose: 3, cents: 8, intro: {type: 'vamp', bars: 4, times: 2},
      ending: {type: 'tag', tagBars: 4, tagTimes: 2, seconds: 4}, applause: true, horns: ['trumpet', 'tenor-sax']}},
  {id: 'there-will-never-be-another-you', title: 'There Will Never Be Another You', tune: TWNBAY, note: 'medium up, two bars of drums first, a held last chord',
    plan: {seed: 23, bpm: 184, choruses: 5, heads: 1, style: 'swing', transpose: 0, cents: -12, intro: {type: 'drums', bars: 2}, ending: {type: 'fermata', seconds: 4}}},
  {id: 'au-privave', title: 'Au Privave', note: 'bebop blues at 210, the head twice at each end',
    plan: {seed: 37, bpm: 210, choruses: 10, heads: 2, style: 'swing', swing: 0.6, intro: {type: 'none'}, ending: {type: 'fermata', seconds: 3}, applause: true, horns: ['trumpet', 'tenor-sax']}},
  {id: 'billies-bounce', title: "Billie's Bounce", note: 'blues at 190 (the database chart, 13 bars), heads twice, a bar of drums first, 20 cents sharp',
    plan: {seed: 41, bpm: 190, choruses: 9, heads: 2, style: 'swing', cents: 20, intro: {type: 'drums', bars: 1}, ending: {type: 'fermata', seconds: 3}}},
  {id: 'my-funny-valentine', title: 'My Funny Valentine', note: 'ballad: a free piano intro, a rubato head, a chorus in time with brushes, a rubato head out; a whole tone down, 30 cents sharp',
    plan: {seed: 53, bpm: 64, choruses: 3, heads: 1, style: 'ballad', rubato: ['first', 'last'], transpose: -2, cents: 30, intro: {type: 'rubato', seconds: 9},
      ending: {type: 'fermata', seconds: 6}, applause: true}},
  {id: 'so-what', title: 'So What', note: 'modal: sixteen bars of one chord; a free intro; fades out part way through the last chorus; 42 cents sharp',
    plan: {seed: 67, bpm: 136, choruses: 5, heads: 1, style: 'swing', cents: 42, twoFeel: true, intro: {type: 'rubato', seconds: 10}, ending: {type: 'fade', cutAt: 0.7}}},
].map(c => Object.assign({kind: 'jazz'}, c));

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'sync-testset', 'manifest.json'), 'utf8'));
const CLASSICAL = manifest.cases.flatMap(c => c.kind !== 'ensemble' ? [c] : [
  Object.assign({}, c, {id: c.id + '-quartet', title: c.title + ' — string quartet', tests: 'strings, rubato at phrase ends, a first violin that leads',
    plan: {seed: 71, bpm: 112, ensemble: 'quartet', phrase: 4, rubato: 1}}),
  Object.assign({}, c, {id: c.id + '-orchestra', title: c.title + ' — orchestrated', tests: 'the same music doubled by woodwinds and horn, basses an octave down, slower and freer',
    plan: {seed: 83, bpm: 96, ensemble: 'orchestra', phrase: 4, rubato: 1.4, cents: -9}})]);

let cases = (flag('--jazz') ? [] : CLASSICAL).concat(flag('--classical') ? [] : JAZZ);
if(want.length) cases = cases.filter(c => want.includes(c.id));

function serve(){
  const types = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.mp3': 'audio/mpeg', '.mxl': 'application/octet-stream',
    '.musicxml': 'application/xml', '.mid': 'audio/midi', '.txt': 'text/plain'};
  const srv = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if(!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()){ res.writeHead(404); res.end(); return; }
    res.writeHead(200, {'Content-Type': types[path.extname(p)] || 'application/octet-stream'});
    fs.createReadStream(p).pipe(res);
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv)));
}
const fmt = x => x == null ? '—' : String(x);

(async () => {
  cp.execFileSync('node', ['build.js'], {cwd: ROOT, stdio: 'ignore'});
  const srv = await serve(), port = srv.address().port;
  const exe = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
  const browser = await chromium.launch({executablePath: exe});
  const page = await (await browser.newContext({serviceWorkers: 'block'})).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction(() => typeof syncAlign === 'function', null, {timeout: 60000});
  for(const f of ['tools/sync-band.js', 'tools/midi-read.js', 'tools/sync-harness.js']) await page.addScriptTag({url: `http://127.0.0.1:${port}/${f}`});
  const t0 = Date.now();
  if(process.env.SYNC_OPTS) await page.evaluate(o => { syncHarness.engineOpts = o; }, JSON.parse(process.env.SYNC_OPTS));
  const nInst = await page.evaluate(() => syncHarness.loadBank());
  console.log(`${nInst} instruments decoded in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
  const results = [];
  for(const c of cases){
    const spec = Object.assign({}, c, {excerpt: flag('--write') ? 40 : 0});
    let r;
    try { r = await page.evaluate(x => syncHarness.run(x), spec); }
    catch(e){ console.log(`${c.title}\n  FAILED: ${e.message.split('\n')[0]}\n`); results.push({id: c.id, title: c.title, failed: e.message}); continue; }
    results.push(r);
    const E = r.errors, S = r.structure;
    console.log(`${r.title}  [${r.kind}]`);
    if(r.tests) console.log(`  ${r.tests}`);
    console.log(`  audio ${r.audioSeconds}s · engine ${(r.engineMs / 1000).toFixed(1)}s in ${r.inWorker ? 'a Worker' : 'the page'} · ${r.key.ok ? 'key and tuning right' : 'KEY/TUNING WRONG'} (${r.key.transposition >= 0 ? '+' : ''}${r.key.transposition}, ${r.key.cents}¢)`);
    console.log(`  structure: ${S.reading}${S.reading === S.expected ? '' : ` — played: ${S.expected}`}; ${S.order}${r.truthInfo ? ` · truth: ${r.truthInfo}` : ''}`);
    if(r.diagnostics.musicSpan) console.log(`  heard the music from ${r.diagnostics.musicSpan.start.toFixed(1)} to ${r.diagnostics.musicSpan.end.toFixed(1)} s; tempo taken as ♩=${r.diagnostics.bpm.toFixed(1)}`);
    if(S.stages) console.log(`  by stage (median / within 100 ms): coarse ${S.stages.coarse.median} ms / ${S.stages.coarse.within100}% · fine ${S.stages.fine.median} ms / ${S.stages.fine.within100}% · after onset snapping ${S.stages.final.median} ms / ${S.stages.final.within100}%`);
    console.log(`  downbeats: ${E.matched}/${E.n} found · median ${fmt(E.median)} ms · 90% ${fmt(E.p90)} ms · worst ${fmt(E.max)} ms`);
    console.log(`  within ±50 ms ${fmt(E.within50)}% · ±100 ms ${fmt(E.within100)}% · ±200 ms ${fmt(E.within200)}% · target ${fmt(E.withinTarget)}%`);
    console.log(`  confidence ${r.confidence.overall}: ${r.confidence.sure} bars ≥0.6 (mean error ${fmt(r.confidence.sureMeanErr)} ms), ${r.confidence.unsure} below (mean error ${fmt(r.confidence.unsureMeanErr)} ms)\n`);
    if(flag('--bars')) r.rows.forEach(x => console.log(`    ${x.bar}${x.type ? ' ' + x.type : ''}: truth ${x.truth.toFixed(3)} est ${x.est == null ? '—' : x.est.toFixed(3)} err ${fmt(x.err)} conf ${x.confidence}${x.interpolated ? ' interp' : ''}`));
    if(r._audio && flag('--write')){
      const dir = path.join(ROOT, 'docs', 'sync', 'audio'); fs.mkdirSync(dir, {recursive: true});
      const wav = path.join(dir, r.id + '.wav'); fs.writeFileSync(wav, Buffer.from(r._audio, 'base64'));
      let ff = null; try { ff = cp.execSync('python3 -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())"', {stdio: ['ignore', 'pipe', 'ignore']}).toString().trim(); } catch(e){}
      try { cp.execFileSync(ff || 'ffmpeg', ['-v', 'error', '-y', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '112k', wav.replace(/\.wav$/, '.mp3')]); fs.unlinkSync(wav); } catch(e){ fs.unlinkSync(wav); }
    }
    delete r._audio;
  }
  if(errs.length) console.log('page errors: ' + errs.join(' | '));
  if(flag('--write')){
    const dir = path.join(ROOT, 'docs', 'sync'); fs.mkdirSync(dir, {recursive: true});
    fs.writeFileSync(path.join(dir, 'phase2-accuracy.json'), JSON.stringify({run: new Date().toISOString(), results}, null, 1));
    console.log('written: docs/sync/phase2-accuracy.json' + (fs.existsSync(path.join(dir, 'audio')) ? ' and docs/sync/audio/' : ''));
  }
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
