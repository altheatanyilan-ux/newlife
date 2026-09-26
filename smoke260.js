/* smoke260 — a link in the Library shown as what it is.

   The claims.

   RECOGNISED. A pasted address is read for what it is — the service, the
   kind of thing (an album, a track, an episode, a video, a book, a film, a
   game) — from the address alone: Spotify, Apple Music, Apple Podcasts,
   YouTube, Vimeo, SoundCloud, Bandcamp, TIDAL, Deezer, Open Library,
   Goodreads, Wikipedia, IMDb, Letterboxd, Steam, and any other page by
   its host and the last words of its path.

   PASTED INTO "LOG A WORK". A Spotify album link becomes a card with its
   cover before the work is saved: the title filled in, the kind set to
   Album (unless you chose one), the service asked once. Saved, the cover is
   kept with the work as a picture of its own, so the shelf shows it — and
   still shows it offline.

   IN THE WORK. Its link is a card: the cover, the service and kind, the
   title, open ↗, ▶ play here (the service's player, loaded only when
   pressed), ↻ ask again, 🖼 a cover of your own.

   A SERVICE THAT WILL NOT ANSWER is still a card, from what the address
   says, and says so; an ordinary page (an essay, a shop) stays the row it
   was, and nothing is asked about it; Apple Music is never asked (it does not answer a
   page), its title read from the address. A link from before previews
   existed is looked up the first time its work is opened.

   HOW IT COULD BE WRONG AND STILL PASS. The services are not reached from
   here: their answers are stood in for inside the browser (page.route),
   in the shape each documents. Whether Spotify answers a page from your
   machine is the one thing this cannot see.

   Run: NODE_PATH=node_modules node smoke260.js */
const {chromium} = require('playwright');
const path = require('path'), zlib = require('zlib');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

/* a 120×120 cover, blue into gold, made here */
function png(w, h){
  const crc = b => { let c, t = []; for(let n = 0; n < 256; n++){ c = n; for(let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    let x = 0xffffffff; for(const v of b) x = t[(x ^ v) & 0xff] ^ (x >>> 8); return (x ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for(let y = 0; y < h; y++){ raw[y * (w * 3 + 1)] = 0; for(let x = 0; x < w; x++){ const o = y * (w * 3 + 1) + 1 + x * 3, t = (x + y) / (w + h);
    raw[o] = Math.round(30 + 190 * t); raw[o + 1] = Math.round(60 + 120 * t); raw[o + 2] = Math.round(140 - 100 * t); } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const COVER = png(120, 120);
const CORS = {'access-control-allow-origin': '*'};
const SPOTIFY = 'https://open.spotify.com/album/1weenld61qoidwYuZ1GESA?si=x';

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const ctx = await b.newContext({viewport: {width: 1280, height: 900}});
  const asked = [];
  await ctx.route(/open\.spotify\.com\/oembed/, r => { asked.push('spotify'); r.fulfill({status: 200, headers: CORS, contentType: 'application/json',
    body: JSON.stringify({type: 'rich', title: 'Kind of Blue', provider_name: 'Spotify', thumbnail_url: 'https://i.scdn.co/image/ab67616d0000b273kindofblue',
      html: '<iframe title="Spotify Embed: Kind of Blue" src="https://open.spotify.com/embed/album/1weenld61qoidwYuZ1GESA"></iframe>'})}); });
  await ctx.route(/i\.scdn\.co\/image/, r => { asked.push('cover'); r.fulfill({status: 200, headers: CORS, contentType: 'image/png', body: COVER}); });
  await ctx.route(/open\.spotify\.com\/embed/, r => { asked.push('player'); r.fulfill({status: 200, contentType: 'text/html', body: '<body style="background:#121212;color:#fff">player</body>'}); });
  await ctx.route(/youtube\.com\/oembed|i\.ytimg\.com/, r => { asked.push('youtube'); r.abort(); });
  await ctx.route(/apple\.com/, r => { asked.push('apple'); r.abort(); });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }

  console.log('\n1. recognised, from the address alone');
  const R = await p.evaluate(() => [
    'https://open.spotify.com/album/1weenld61qoidwYuZ1GESA', 'https://open.spotify.com/intl-de/track/4u7EnebtmKWzUH433cf5Qv', 'https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5',
    'https://music.apple.com/us/album/kind-of-blue/268443092', 'https://podcasts.apple.com/gb/podcast/in-our-time/id73330895',
    'https://www.youtube.com/watch?v=vmDDOFXSgAs', 'https://youtu.be/vmDDOFXSgAs', 'https://vimeo.com/76979871', 'https://soundcloud.com/forss/flickermood',
    'https://nilsfrahm.bandcamp.com/album/all-melody', 'https://tidal.com/browse/album/77646170', 'https://www.deezer.com/en/album/302127',
    'https://openlibrary.org/works/OL45804W/Fantastic_Mr_Fox', 'https://www.goodreads.com/book/show/5107.The_Catcher_in_the_Rye', 'https://en.wikipedia.org/wiki/Kind_of_Blue',
    'https://www.imdb.com/title/tt0111161/', 'https://letterboxd.com/film/in-the-mood-for-love/', 'https://store.steampowered.com/app/1145360/Hades/',
    'https://www.newyorker.com/magazine/2021/03/01/the-quiet-power-of-the-bach-cello-suites'
  ].map(u => { const r = mediaRecognise(u); return [r.service, r.type, r.kind || '-', r.title || '']; }));
  is('each service and kind', R.map(r => r.slice(0, 3).join(' ')), ['spotify album album', 'spotify track album', 'spotify episode podcast',
    'applemusic album album', 'applepodcasts show podcast', 'youtube video -', 'youtube video -', 'vimeo video -', 'soundcloud track album',
    'bandcamp album album', 'tidal album album', 'deezer album album', 'openlibrary work book', 'goodreads book book', 'wikipedia article -',
    'imdb title film', 'letterboxd film film', 'steam game game', 'web page -']);
  is('  and a title where the address carries one', [R[3][3], R[9][3], R[13][3], R[16][3], R[17][3], R[18][3]],
    ['Kind of Blue', 'All Melody', 'The Catcher in the Rye', 'In the Mood for Love', 'Hades', 'The Quiet Power of the Bach Cello Suites']);
  is('  nothing was asked of anyone for that', asked, []);

  console.log('\n2. pasted into "Log a work"');
  await p.evaluate(() => { location.hash = '#/journals/library'; }); await p.waitForTimeout(1200);
  await p.evaluate(() => openMediaModal({})); await p.waitForTimeout(300);
  await p.fill('#mUrl', SPOTIFY); await p.waitForTimeout(1500);
  const L = await p.evaluate(() => { const box = document.getElementById('mPreview');
    return {shown: !box.hidden, title: (box.querySelector('.mp-title') || {}).textContent, svc: (box.querySelector('.mp-svc') || {}).textContent,
      img: !!box.querySelector('.mp-cover img'), note: (box.querySelector('.mp-note') || {}).textContent,
      input: document.getElementById('mTitle').value, kind: (document.querySelector('[data-mk].on') || {}).dataset.mk}; });
  yes('the card, before anything is saved: the cover, "Kind of Blue", Spotify · album', L.shown && L.title === 'Kind of Blue' && /spotify · album/i.test(L.svc) && L.img, L);
  yes('  the title filled in, the kind set to Album', L.input === 'Kind of Blue' && L.kind === 'album', L);
  yes('  and it says where it came from and that it is kept', /from Spotify/.test(L.note) && /offline/.test(L.note), L.note);
  await p.screenshot({path: path.join(process.env.SHOTS || require('os').tmpdir(), 'smoke260-log.png')}).catch(() => {});
  await p.fill('#mCreator', 'Miles Davis');
  await p.click('#mSave'); await p.waitForTimeout(1200);
  const W = await p.evaluate(() => { const e = S.entries.filter(x => x.type === 'media').pop(); const u = e.extra.urls[0];
    return {id: e.id, title: e.title, creator: e.extra.creator, kind: e.extra.kind, svc: u.preview && u.preview.service,
      local: u.preview && u.preview.coverLocal, data: !!(u.preview && /^data:image\/jpeg/.test(u.preview.cover)), embed: u.preview && u.preview.embed}; });
  yes('saved with its preview: the cover kept as a picture of its own', W.svc === 'spotify' && W.local && W.data && W.creator === 'Miles Davis' && W.kind === 'album', W);
  is('  Spotify asked once for the words and once for the cover', asked.filter(a => a === 'spotify' || a === 'cover'), ['spotify', 'cover']);

  console.log('\n3. in the work');
  const C = await p.evaluate(() => { const c = document.querySelector('#panel .mp-card, .media-panel .mp-card'); if(!c) return null;
    return {title: c.querySelector('.mp-title').textContent, img: !!c.querySelector('.mp-cover img'), doors: [...c.querySelectorAll('.mp-doors .tbtn')].map(x => x.textContent.trim())}; });
  yes('its link is a card: the cover, the title, open, play here, ask again, a cover of your own',
    C && C.title === 'Kind of Blue' && C.img && ['↗ open', '▶ play here', '↻', '🖼'].every(d => C.doors.includes(d)), C);
  yes('  the player is not loaded until asked for', !asked.includes('player') && !(await p.$('.mp-player iframe')));
  await p.click('[data-mpplay]'); await p.waitForTimeout(900);
  const F = await p.evaluate(() => { const f = document.querySelector('.mp-player iframe'); return f ? {src: f.src, h: f.getBoundingClientRect().height} : null; });
  yes('  ▶ opens Spotify\'s own player for that album, in the panel', F && /open\.spotify\.com\/embed\/album\/1weenld61qoidwYuZ1GESA/.test(F.src) && F.h > 300, F);
  await p.screenshot({path: path.join(process.env.SHOTS || require('os').tmpdir(), 'smoke260-panel.png')}).catch(() => {});
  await p.click('[data-mpplay]'); await p.waitForTimeout(200);
  yes('  pressed again, it goes', !(await p.$('.mp-player iframe')));
  await p.evaluate(() => closePanel()); await p.waitForTimeout(300);
  await p.evaluate(() => rerender()); await p.waitForTimeout(600);
  const SH = await p.evaluate(id => { const w = document.querySelector(`.work[data-mopen="${id}"]`); return w ? {cover: w.classList.contains('has-cover'), img: !!w.querySelector('.work-art img'), svc: (w.querySelector('.work-svc') || {}).textContent} : null; }, W.id);
  yes('on the shelf, the cover in place of the spine, and the service under the maker', SH && SH.cover && SH.img && /spotify/i.test(SH.svc), SH);
  await p.screenshot({path: path.join(process.env.SHOTS || require('os').tmpdir(), 'smoke260-shelf.png')}).catch(() => {});

  console.log('\n4. a service that will not answer');
  await p.evaluate(() => openMediaModal({})); await p.waitForTimeout(300);
  await p.fill('#mUrl', 'https://www.youtube.com/watch?v=vmDDOFXSgAs'); await p.waitForTimeout(1600);
  const Y = await p.evaluate(() => { const box = document.getElementById('mPreview');
    return {shown: !box.hidden, svc: (box.querySelector('.mp-svc') || {}).textContent, note: (box.querySelector('.mp-note') || {}).textContent, img: !!box.querySelector('.mp-cover img')}; });
  yes('YouTube not answering: still a card, from the address, and it says so', Y.shown && /youtube · video/i.test(Y.svc) && /did not answer/.test(Y.note) && !Y.img, Y);
  await p.fill('#mTitle', 'Bach, Cello Suite No. 1'); await p.click('#mSave'); await p.waitForTimeout(900);
  await p.evaluate(() => closePanel());
  await p.evaluate(() => openMediaModal({})); await p.waitForTimeout(300);
  const before = asked.length;
  await p.fill('#mUrl', 'https://music.apple.com/us/album/kind-of-blue-legacy-edition/268443092'); await p.waitForTimeout(1200);
  const A = await p.evaluate(() => ({title: document.getElementById('mTitle').value, svc: (document.querySelector('#mPreview .mp-svc') || {}).textContent}));
  yes('Apple Music: its title read from the address, and Apple never asked', A.title === 'Kind of Blue Legacy Edition' && /apple music · album/i.test(A.svc) && !asked.slice(before).includes('apple'), [A, asked.slice(before)]);
  await p.evaluate(() => document.querySelector('.modal-bg, .modal') && document.querySelectorAll('.modal-bg').forEach(m => m.remove()));

  const ART = await p.evaluate(async () => { const e = S.entries.filter(x => x.type === 'media').pop();
    e.extra.urls.push({id: uid(), label: 'the essay', url: 'https://www.newyorker.com/magazine/2021/03/01/the-quiet-power', kind: 'about'}); saveNow();
    openMediaPanel(e.id); await new Promise(r => setTimeout(r, 700));
    const rows = [...document.querySelectorAll('#panel .res-row')].map(r => r.textContent), cards = document.querySelectorAll('#panel .mp-card').length;
    const u = e.extra.urls[e.extra.urls.length - 1]; closePanel();
    return {row: rows.some(t => /the essay/.test(t)), cards, asked: !!(u.preview || u.previewTried)}; });
  yes('an ordinary page (an essay) stays a row — its name and where it goes — and nothing is asked about it', ART.row && ART.cards === 1 && !ART.asked, ART);

  console.log('\n5. a link from before');
  const old = await p.evaluate(() => { const e = {id: uid(), type: 'media', title: 'Sketches of Spain', body: '', occurredAt: today(), createdAt: new Date().toISOString(), media: [],
      links: {stages: [], substages: [], threads: [], values: [], visions: [], skills: [], projects: []}, people: [], places: [], emotions: [], tags: [], confidence: '',
      extra: {kind: 'album', creator: 'Miles Davis', year: '', status: 'finished', resonanceLevel: null, quotes: [], urls: [{id: uid(), label: '', url: 'https://open.spotify.com/album/5MNlAlT3mwd9h6VMSlmyAx', kind: 'work'}],
        startedAt: '', finishedAt: '', oneLineCapture: '', installed: '', recommend: '', recommendWho: ''}};
    S.entries.push(e); saveNow(); return e.id; });
  const n0 = asked.filter(a => a === 'spotify').length;
  await p.evaluate(id => openMediaPanel(id), old); await p.waitForTimeout(1500);
  const O = await p.evaluate(id => { const u = byId(S.entries, id).extra.urls[0]; return {pv: !!u.preview, tried: !!u.previewTried, title: byId(S.entries, id).title}; }, old);
  yes('opened for the first time, its link is looked up — and the title you gave it is kept', O.pv && O.tried && O.title === 'Sketches of Spain', O);
  await p.evaluate(() => closePanel()); await p.evaluate(id => openMediaPanel(id), old); await p.waitForTimeout(800);
  is('  and not again the next time', asked.filter(a => a === 'spotify').length - n0, 1);
  await p.evaluate(() => closePanel());

  console.log('\n6. offline');
  await p.evaluate(() => flushSave && flushSave());
  await ctx.setOffline(true);
  await p.reload(); await p.waitForTimeout(2200);
  await p.evaluate(() => { location.hash = '#/journals/library'; }); await p.waitForTimeout(1200);
  const OFF = await p.evaluate(id => { const img = document.querySelector(`.work[data-mopen="${id}"] .work-art img`); return img ? {data: /^data:/.test(img.src), loaded: img.complete && img.naturalWidth > 0} : null; }, W.id);
  yes('with no connection at all, the shelf still shows the cover — kept across the reload', OFF && OFF.data && OFF.loaded, OFF);
  await ctx.setOffline(false);

  is('no page errors', errs, []);
  console.log(`\n${bad ? bad + ' FAILED' : 'all good'}`);
  await b.close(); process.exit(bad ? 1 : 0);
})();
