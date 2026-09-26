/* ============================================================
   A WORK'S LINK, SHOWN AS WHAT IT IS — the Library's previews.

   A Spotify address is not a string you want to look at; it is an album,
   with a cover, a title and whoever made it. Paste one — into "Log a work",
   or into a link of a work already on the shelf — and it is recognised
   (which service, what kind of thing: an album, a track, an episode, a
   video, a book), and shown as a card with its cover.

   Where the cover and the title come from. The address itself says a good
   deal (the service, the kind, often the title in its last words), and
   that much is worked out here, with nothing fetched. For the rest the
   page asks the service once, at the moment the link is pasted, through
   the service's own public preview address (oEmbed, or the open catalogue
   of Open Library and Wikipedia) — never a third party in between, no
   account, nothing sent but the address itself. What comes back is kept
   with the work, the cover as a small picture of its own, so the card is
   whole offline and nothing is asked again unless you press ↻. A service
   that will not answer a page (Apple Music, IMDb, Goodreads, Bandcamp) is
   still a card: its name, its colour, the kind, the title from the
   address, and a cover you can paste in yourself.

   A player, where the service offers one, is opened only when you press
   ▶ — the service's page is not loaded before that.
   ============================================================ */

/* the services, in the order they are tried: host test, then what the path says */
const MEDIA_SERVICES = [
  {id: 'spotify', name: 'Spotify', color: '#1db954', host: /(^|\.)spotify\.com$/, parse(u){
    const m = /^\/(?:intl-[a-z-]+\/)?(album|track|playlist|artist|episode|show)\/([A-Za-z0-9]+)/.exec(u.pathname); if(!m) return null;
    const [, type, id] = m;
    return {type, id, kind: type === 'episode' || type === 'show' ? 'podcast' : 'album',
      embed: `https://open.spotify.com/embed/${type}/${id}`, embedH: type === 'track' || type === 'episode' ? 152 : 352,
      oembed: `https://open.spotify.com/oembed?url=${encodeURIComponent(`https://open.spotify.com/${type}/${id}`)}`}; }},
  {id: 'applemusic', name: 'Apple Music', color: '#fa2d48', host: /^music\.apple\.com$/, parse(u){
    const m = /^\/([a-z]{2})\/(album|playlist|song|music-video|artist)\/([^/]+)\/([^/?]+)/.exec(u.pathname); if(!m) return null;
    const [, cc, type, slug, id] = m;
    return {type, id, kind: 'album', title: mediaSlugTitle(slug),
      embed: type === 'artist' ? null : `https://embed.music.apple.com/${cc}/${type}/${slug}/${id}${u.search}`, embedH: type === 'song' ? 175 : 450}; }},
  {id: 'applepodcasts', name: 'Apple Podcasts', color: '#9933cc', host: /^podcasts\.apple\.com$/, parse(u){
    const m = /^\/([a-z]{2})\/podcast\/([^/]+)\/(id\d+)/.exec(u.pathname); if(!m) return null;
    return {type: u.searchParams.get('i') ? 'episode' : 'show', id: m[3], kind: 'podcast', title: mediaSlugTitle(m[2]),
      embed: `https://embed.podcasts.apple.com/${m[1]}/podcast/${m[2]}/${m[3]}${u.search}`, embedH: u.searchParams.get('i') ? 175 : 450}; }},
  {id: 'youtube', name: 'YouTube', color: '#ff0033', host: /(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/, parse(u){
    let id = null;
    if(/youtu\.be$/.test(u.hostname)) id = u.pathname.slice(1).split('/')[0];
    else if(u.pathname === '/watch') id = u.searchParams.get('v');
    else { const m = /^\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{6,})/.exec(u.pathname); if(m) id = m[1]; }
    const list = u.searchParams.get('list');
    const music = /^music\./.test(u.hostname);
    if(!id && list) return {type: 'playlist', id: list, kind: music ? 'album' : null,
      embed: `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(list)}`, embedH: 'video'};
    if(!id || !/^[A-Za-z0-9_-]{6,}$/.test(id)) return null;
    return {type: 'video', id, kind: music ? 'album' : null, thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      embed: `https://www.youtube-nocookie.com/embed/${id}`, embedH: 'video',
      oembed: `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent('https://www.youtube.com/watch?v=' + id)}`}; }},
  {id: 'vimeo', name: 'Vimeo', color: '#1ab7ea', host: /(^|\.)vimeo\.com$/, parse(u){
    const m = /^\/(?:video\/)?(\d{5,})/.exec(u.pathname); if(!m) return null;
    return {type: 'video', id: m[1], kind: null, embed: `https://player.vimeo.com/video/${m[1]}`, embedH: 'video',
      oembed: `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${m[1]}`)}`}; }},
  {id: 'soundcloud', name: 'SoundCloud', color: '#ff5500', host: /(^|\.)soundcloud\.com$/, parse(u){
    const parts = u.pathname.split('/').filter(Boolean); if(parts.length < 2) return null;
    const clean = `https://soundcloud.com/${parts.join('/')}`;
    return {type: parts[1] === 'sets' ? 'playlist' : 'track', id: parts.join('/'), kind: parts[1] === 'sets' ? 'album' : 'album',
      title: mediaSlugTitle(parts[parts.length - 1]), author: mediaSlugTitle(parts[0]),
      embed: `https://w.soundcloud.com/player/?url=${encodeURIComponent(clean)}&visual=true`, embedH: 300,
      oembed: `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(clean)}`}; }},
  {id: 'bandcamp', name: 'Bandcamp', color: '#1da0c3', host: /\.bandcamp\.com$/, parse(u){
    const m = /^\/(album|track)\/([^/?]+)/.exec(u.pathname); if(!m) return null;
    return {type: m[1], id: m[2], kind: 'album', title: mediaSlugTitle(m[2]), author: mediaSlugTitle(u.hostname.split('.')[0])}; }},
  {id: 'tidal', name: 'TIDAL', color: '#33c2c2', host: /(^|\.)tidal\.com$/, parse(u){
    const m = /\/(album|track|playlist)\/([A-Za-z0-9-]+)/.exec(u.pathname); if(!m) return null;
    return {type: m[1], id: m[2], kind: 'album', embed: `https://embed.tidal.com/${m[1]}s/${m[2]}`, embedH: m[1] === 'track' ? 120 : 400}; }},
  {id: 'deezer', name: 'Deezer', color: '#a238ff', host: /(^|\.)deezer\.com$/, parse(u){
    const m = /\/(album|track|playlist|episode|show)\/(\d+)/.exec(u.pathname); if(!m) return null;
    return {type: m[1], id: m[2], kind: m[1] === 'episode' || m[1] === 'show' ? 'podcast' : 'album',
      embed: `https://widget.deezer.com/widget/auto/${m[1]}/${m[2]}`, embedH: m[1] === 'track' ? 150 : 300}; }},
  {id: 'openlibrary', name: 'Open Library', color: '#e1a800', host: /(^|\.)openlibrary\.org$/, parse(u){
    const m = /^\/(works|books)\/(OL\d+[WM])(?:\/([^/?]+))?/.exec(u.pathname); if(!m) return null;
    return {type: m[1] === 'works' ? 'work' : 'edition', id: m[2], kind: 'book', title: m[3] ? mediaSlugTitle(m[3]) : '',
      api: `https://openlibrary.org/${m[1]}/${m[2]}.json`}; }},
  {id: 'goodreads', name: 'Goodreads', color: '#8a6a3e', host: /(^|\.)goodreads\.com$/, parse(u){
    const m = /^\/book\/show\/\d+[-.]([^/?]+)/.exec(u.pathname); if(!m) return null;
    return {type: 'book', id: m[1], kind: 'book', title: mediaSlugTitle(m[1])}; }},
  {id: 'wikipedia', name: 'Wikipedia', color: '#6d6d6d', host: /(^|\.)wikipedia\.org$/, parse(u){
    const m = /^\/wiki\/([^?#]+)/.exec(u.pathname); if(!m) return null;
    const lang = u.hostname.split('.')[0], title = decodeURIComponent(m[1]);
    return {type: 'article', id: title, kind: null, title: title.replace(/_/g, ' '),
      api: `https://${lang === 'www' || lang === 'm' ? 'en' : lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`}; }},
  {id: 'imdb', name: 'IMDb', color: '#d9a600', host: /(^|\.)imdb\.com$/, parse(u){
    const m = /^\/title\/(tt\d+)/.exec(u.pathname); if(!m) return null;
    return {type: 'title', id: m[1], kind: 'film'}; }},
  {id: 'letterboxd', name: 'Letterboxd', color: '#40bcf4', host: /(^|\.)letterboxd\.com$/, parse(u){
    const m = /^\/film\/([^/?]+)/.exec(u.pathname); if(!m) return null;
    return {type: 'film', id: m[1], kind: 'film', title: mediaSlugTitle(m[1])}; }},
  {id: 'steam', name: 'Steam', color: '#4c6b8a', host: /^store\.steampowered\.com$/, parse(u){
    const m = /^\/app\/(\d+)(?:\/([^/?]+))?/.exec(u.pathname); if(!m) return null;
    return {type: 'game', id: m[1], kind: 'game', title: m[2] ? mediaSlugTitle(m[2]) : '',
      thumb: `https://cdn.cloudflare.steamstatic.com/steam/apps/${m[1]}/header.jpg`}; }},
];
/* "kind-of-blue" → "Kind of Blue"; "Kind_of_Blue" → "Kind of Blue" */
function mediaSlugTitle(slug){
  let s = ''; try { s = decodeURIComponent(String(slug || '')); } catch(e){ s = String(slug || ''); }
  s = s.replace(/\.[a-z0-9]{2,4}$/i, '').replace(/[-_+]+/g, ' ').replace(/\s+/g, ' ').trim();
  if(!s || /^\d+$/.test(s)) return '';
  const small = /^(a|an|the|of|and|or|in|on|at|to|for|by|with|de|la|le|el|y|et|und|der|die|das)$/i;
  return s.split(' ').map((w, i) => i && small.test(w) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
/** What an address is, worked out from the address alone (nothing fetched). */
function mediaRecognise(url){
  const href = typeof linkHrefOf === 'function' ? linkHrefOf(url) : url;
  if(!href || !/^https?:/i.test(href)) return null;
  let u; try { u = new URL(href); } catch(e){ return null; }
  const host = u.hostname.replace(/^www\./, '');
  for(const s of MEDIA_SERVICES){
    if(!s.host.test(host)) continue;
    const r = s.parse(u);
    if(r) return Object.assign({service: s.id, name: s.name, color: s.color, href}, r);
  }
  /* anything else: where it is, and a title from the last words of its path */
  const last = u.pathname.split('/').filter(Boolean).pop() || '';
  return {service: 'web', name: host, color: '#8a8d8f', href, type: 'page', id: href, kind: null, title: mediaSlugTitle(last)};
}
const MEDIA_TYPE_WORD = {album: 'album', track: 'track', playlist: 'playlist', artist: 'artist', episode: 'episode', show: 'podcast',
  song: 'song', 'music-video': 'music video', video: 'video', work: 'book', edition: 'book', book: 'book', article: 'article',
  title: 'film', film: 'film', game: 'game', page: 'page'};

/* ---------- asking the service, once ---------- */
async function mediaFetchJSON(url, ms = 8000){
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const t = ctl ? setTimeout(() => ctl.abort(), ms) : 0;
  try {
    const res = await fetch(url, {mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer', signal: ctl ? ctl.signal : undefined});
    if(!res.ok) return null;
    return await res.json();
  } catch(e){ return null; } finally { clearTimeout(t); }
}
/* The cover, kept as a small picture of its own (at most 360 px, JPEG), so
   the card is whole offline. A service whose images a page may not read
   keeps the address instead: shown when there is a connection. */
async function mediaCoverKeep(src){
  if(!src) return null;
  try {
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const t = ctl ? setTimeout(() => ctl.abort(), 8000) : 0;
    const res = await fetch(src, {mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer', signal: ctl ? ctl.signal : undefined});
    clearTimeout(t);
    if(!res.ok) throw new Error('no cover');
    const blob = await res.blob();
    const bmp = await createImageBitmap(blob);
    const k = Math.min(1, 360 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(bmp.width * k)); c.height = Math.max(1, Math.round(bmp.height * k));
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return {cover: c.toDataURL('image/jpeg', 0.84), local: true, w: c.width, h: c.height};
  } catch(e){ return {cover: src, local: false}; }
}
/** Everything the card needs for an address: what the address says, and
 *  what the service answers. Resolves to a preview object (never throws). */
async function mediaPreviewFetch(url){
  const r = mediaRecognise(url); if(!r) return null;
  const p = {service: r.service, name: r.name, color: r.color, type: r.type, kind: r.kind || null, title: r.title || '', author: r.author || '',
    year: '', embed: r.embed || null, embedH: r.embedH || null, from: 'address', href: r.href, fetchedAt: new Date().toISOString()};
  let thumb = r.thumb || null;
  if(r.oembed){ const j = await mediaFetchJSON(r.oembed);
    if(j){ p.title = j.title || p.title; p.author = j.author_name || p.author; thumb = j.thumbnail_url || thumb; p.from = 'service';
      /* Spotify writes "Kind of Blue" and gives the artist nowhere else but
         in the embed's own markup: taken from there when it is there */
      if(!p.author && j.html){ const m = /title="[^"]*?by ([^"]+)"/i.exec(j.html); if(m) p.author = m[1]; } } }
  if(r.service === 'openlibrary' && r.api){ const j = await mediaFetchJSON(r.api);
    if(j){ p.title = j.title || p.title; p.from = 'service';
      if(j.first_publish_date) p.year = (/\d{4}/.exec(j.first_publish_date) || [''])[0];
      if(Array.isArray(j.covers) && j.covers[0] > 0) thumb = `https://covers.openlibrary.org/b/id/${j.covers[0]}-L.jpg`;
      const a = (j.authors || [])[0]; const key = a && (a.author ? a.author.key : a.key);
      if(key){ const aj = await mediaFetchJSON(`https://openlibrary.org${key}.json`); if(aj && aj.name) p.author = aj.name; } } }
  if(r.service === 'wikipedia' && r.api){ const j = await mediaFetchJSON(r.api);
    if(j){ p.title = j.title || p.title; p.author = j.description || ''; p.from = 'service';
      thumb = (j.originalimage || j.thumbnail || {}).source || thumb; } }
  if(thumb){ const c = await mediaCoverKeep(thumb); if(c){ p.cover = c.cover; p.coverLocal = c.local; } }
  return p;
}

/* ---------- the card ---------- */
function mediaServiceMark(p, size = 'sm'){
  return `<span class="mp-svc mp-${size}" style="--svc:${esc(p.color || '#8a8d8f')}"><i></i>${esc(p.name || '')}${p.type && MEDIA_TYPE_WORD[p.type] ? ` · ${esc(MEDIA_TYPE_WORD[p.type])}` : ''}</span>`;
}
/* the cover, or — with none — the service's colour under the kind's mark */
function mediaCoverHTML(p, kind, cls = ''){
  const k = (typeof MEDIA_KINDS !== 'undefined' && MEDIA_KINDS[kind]) || ['▤', '', '#8a8d8f'];
  if(p && p.cover) return `<span class="mp-cover ${cls}" style="--svc:${esc(p.color || k[2])}"><img src="${esc(p.cover)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()"><b>${k[0]}</b></span>`;
  return `<span class="mp-cover mp-none ${cls}" style="--svc:${esc((p && p.color) || k[2])}"><b>${k[0]}</b></span>`;
}
/** The first link of a work that has a preview — what the shelf shows. */
function mediaPreviewOf(e){
  const urls = (e.extra && Array.isArray(e.extra.urls)) ? e.extra.urls : [];
  const withCover = urls.find(u => u.preview && u.preview.cover);
  return (withCover || urls.find(u => u.preview) || {}).preview || null;
}
/* One link as a card, in the work's panel: cover, what it is, the title and
   who made it, and the doors — open it, play it here, ask again, change it. */
function mediaLinkCardHTML(e, u, i){
  const p = u.preview || mediaRecognise(u.url) || {};
  const href = linkHrefOf(u.url), x = e.extra || {};
  const title = p.title || u.label || (u.url ? linkLabel(u.url, 60) : '');
  const meta = MEDIA_LINK_KINDS[mediaLinkKind(u.kind)];
  return `<div class="mp-card${u.preview ? '' : ' mp-bare'}" data-lrow="${i}" data-mpcard="${esc(u.id)}" style="--svc:${esc(p.color || '#8a8d8f')}">
    ${mediaCoverHTML(u.preview, x.kind, 'mp-cover-lg')}
    <span class="mp-info">
      ${mediaServiceMark(p)}
      <b class="mp-title serif">${esc(title)}</b>
      ${p.author ? `<span class="mp-author">${esc(p.author)}</span>` : ''}
      <span class="mp-doors">
        ${href ? `<a class="tbtn" href="${esc(href)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">↗ open</a>` : ''}
        ${p.embed ? `<button class="tbtn" data-mpplay="${esc(u.id)}" title="play it here — ${esc(p.name)}'s player, loaded only now">▶ play here</button>` : ''}
        <button class="tbtn" data-mpfetch="${esc(u.id)}" title="${u.preview && u.preview.from === 'service' ? 'ask ' + esc(p.name) + ' again' : 'ask ' + esc(p.name || 'the service') + ' for the cover and title'}">↻</button>
        <button class="tbtn" data-mpcover="${esc(u.id)}" title="use a picture of your own for the cover">🖼</button>
        <span class="status-pill" style="font-size:.6rem" title="${esc(meta[1])}">${meta[0]} ${esc(meta[1])}</span>
      </span>
    </span>
    <span class="res-edit mp-edit"><span class="ed-wrap">${ed(`entries.#${e.id}.extra.urls.${i}.label`, {ph: 'what it is', cls: 'mono'})}</span><span class="ed-wrap">${ed(`entries.#${e.id}.extra.urls.${i}.url`, {ph: 'https://…', cls: 'mono', hook: `mediaurl:${e.id}|${u.id}`})}</span><select class="sel" data-lkind="${i}" style="width:auto;padding:1px 6px;font-size:.66rem;padding-right:22px">${Object.entries(MEDIA_LINK_KINDS).map(([kk, v]) => `<option value="${kk}" ${mediaLinkKind(u.kind) === kk ? 'selected' : ''}>${v[0]} ${v[1]}</option>`).join('')}</select><button class="del-x inline" data-ldel="${i}" title="remove">×</button></span>
    <div class="mp-player" data-mpplayer="${esc(u.id)}" hidden></div>
  </div>`;
}
/* a link is shown as a card once it is an address of a service the page
   knows (an album, a video, a book…); any other page stays a row — its name
   and where it goes — because nothing more about it can be learnt from here */
const mediaKnownService = url => { const r = url && mediaRecognise(url); return !!(r && r.service !== 'web'); };
const mediaLinkIsCard = u => !!(u && (u.preview || mediaKnownService(u.url)));

/* the player, built only when asked for */
function mediaPlayerOpen(host, p){
  if(!host || !p || !p.embed) return;
  if(!host.hidden){ host.hidden = true; host.innerHTML = ''; return; }
  const video = p.embedH === 'video';
  host.hidden = false;
  host.innerHTML = `<iframe src="${esc(p.embed)}" title="${esc((p.name || '') + ' player')}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"
    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowfullscreen
    style="${video ? 'aspect-ratio:16/9;height:auto' : `height:${+p.embedH || 352}px`}"></iframe>`;
}

/* Ask for one link's preview and keep it. Quiet on failure: the card built
   from the address stays, and says so. */
const _mpAsking = new Set();
async function mediaPreviewRefresh(e, u, after){
  if(!e || !u || !u.url || _mpAsking.has(u.id) || !mediaKnownService(u.url)) return false;
  _mpAsking.add(u.id);
  document.querySelectorAll(`[data-mpcard="${CSS.escape(u.id)}"]`).forEach(n => n.classList.add('mp-asking'));
  try {
    const p = await mediaPreviewFetch(u.url);
    if(!p) return false;
    /* a cover of your own is yours: a refresh does not take it away */
    if(u.preview && u.preview.coverOwn){ p.cover = u.preview.cover; p.coverLocal = true; p.coverOwn = true; }
    u.preview = p;
    const x = mediaX(e);
    /* the work's own blanks filled from it — never over what you wrote */
    if((!e.title || /^https?:\/\//i.test(e.title)) && p.title) e.title = p.title;
    if(!x.creator && p.author && p.service !== 'wikipedia') x.creator = p.author;
    if(!x.year && p.year) x.year = p.year;
    saveNow();
    if(after) after(p);
    return true;
  } finally { _mpAsking.delete(u.id); document.querySelectorAll(`[data-mpcard="${CSS.escape(u.id)}"]`).forEach(n => n.classList.remove('mp-asking')); }
}
/* a new address typed into a link: a new preview */
hooks.mediaurl = (arg) => {
  const [eid, uid0] = String(arg || '').split('|');
  const e = byId(S.entries, eid); if(!e) return;
  const u = mediaUrls(e).find(x => x.id === uid0); if(!u) return;
  if(u.preview && u.preview.href === (linkHrefOf(u.url) || u.url)) return;
  u.preview = null; saveNow();
  if(!mediaKnownService(u.url)){ if(document.querySelector('.media-panel')) openMediaPanel(e.id); return; }
  mediaPreviewRefresh(e, u, () => { if(typeof reopenPanel === 'function' && document.querySelector('#panel.media-panel, .media-panel')) openMediaPanel(e.id); });
};
/* a cover of your own: a picture file, kept small */
function mediaPickCover(e, u, after){
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = async () => {
    const f = inp.files && inp.files[0]; if(!f) return;
    try {
      const bmp = await createImageBitmap(f);
      const k = Math.min(1, 360 / Math.max(bmp.width, bmp.height));
      const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      const rec = mediaRecognise(u.url) || {};
      u.preview = Object.assign({service: rec.service, name: rec.name, color: rec.color, type: rec.type, title: rec.title || '', author: rec.author || '',
        embed: rec.embed || null, embedH: rec.embedH || null, from: 'address', fetchedAt: new Date().toISOString()}, u.preview || {},
        {cover: c.toDataURL('image/jpeg', 0.86), coverLocal: true, coverOwn: true});
      saveNow(); if(after) after();
    } catch(err){ toast('That picture could not be read.'); }
  };
  inp.click();
}
/* the doors on the cards of an open panel */
function mediaBindCards(root, e, after){
  $$('[data-mpplay]', root).forEach(b => b.onclick = ev => { ev.stopPropagation();
    const u = mediaUrls(e).find(x => x.id === b.dataset.mpplay); if(!u) return;
    const p = u.preview || mediaRecognise(u.url);
    mediaPlayerOpen(root.querySelector(`[data-mpplayer="${CSS.escape(u.id)}"]`), p);
    b.classList.toggle('on', !root.querySelector(`[data-mpplayer="${CSS.escape(u.id)}"]`).hidden); });
  $$('[data-mpfetch]', root).forEach(b => b.onclick = async ev => { ev.stopPropagation();
    const u = mediaUrls(e).find(x => x.id === b.dataset.mpfetch); if(!u) return;
    const ok = await mediaPreviewRefresh(e, u, after);
    const p = u.preview;
    if(ok && p && p.from !== 'service') toast(`${p.name} would not answer — the card is from the address. 🖼 puts a cover on it.`); });
  $$('[data-mpcover]', root).forEach(b => b.onclick = ev => { ev.stopPropagation();
    const u = mediaUrls(e).find(x => x.id === b.dataset.mpcover); if(u) mediaPickCover(e, u, after); });
}

/* ---------- in "Log a work": the link, recognised as it is pasted ---------- */
function mediaLogLinkWatch(m, getKindPicked, setKind){
  const url = m.querySelector('#mUrl'), box = m.querySelector('#mPreview');
  const title = m.querySelector('#mTitle'), creator = m.querySelector('#mCreator'), year = m.querySelector('#mYear');
  if(!url || !box) return {get: () => null};
  let current = null, seq = 0, typed = {title: !!title.value, creator: false, year: false};
  title.addEventListener('input', () => { typed.title = !!title.value.trim(); });
  creator.addEventListener('input', () => { typed.creator = !!creator.value.trim(); });
  year.addEventListener('input', () => { typed.year = !!year.value.trim(); });
  /* an address pasted into the title belongs in the link */
  title.addEventListener('paste', ev => {
    const txt = (ev.clipboardData && ev.clipboardData.getData('text') || '').trim();
    if(/^https?:\/\/\S+$/i.test(txt) && !url.value.trim()){ ev.preventDefault(); url.value = txt; typed.title = false; look(); }
  });
  const fill = p => {
    if(!typed.title && p.title) title.value = p.title;
    if(!typed.creator && p.author && p.service !== 'wikipedia') creator.value = p.author;
    if(!typed.year && p.year) year.value = p.year;
    if(p.kind && !getKindPicked()) setKind(p.kind);
  };
  const draw = (p, asking) => {
    box.hidden = false;
    box.innerHTML = `<div class="mp-card mp-log${asking ? ' mp-asking' : ''}" style="--svc:${esc(p.color)}">
      ${mediaCoverHTML(p, p.kind || 'album', 'mp-cover-lg')}
      <span class="mp-info">${mediaServiceMark(p)}
        <b class="mp-title serif">${esc(p.title || 'Untitled')}</b>
        ${p.author ? `<span class="mp-author">${esc(p.author)}</span>` : ''}
        <span class="mp-note faint">${asking ? `asking ${esc(p.name)} for the cover…` : p.from === 'service' ? `from ${esc(p.name)} · kept with the work, whole offline`
          : `${esc(p.name)} did not answer — this is what the address says; 🖼 on the card adds a cover`}</span></span></div>`;
  };
  const look = async () => {
    const v = url.value.trim(), my = ++seq;
    const r = v && mediaRecognise(v);
    if(!r || r.service === 'web'){ current = null; box.hidden = true; box.innerHTML = ''; return; }
    const quick = {service: r.service, name: r.name, color: r.color, type: r.type, kind: r.kind, title: r.title || '', author: r.author || '',
      embed: r.embed || null, embedH: r.embedH || null, from: 'address', href: r.href, pending: true};
    current = quick; fill(quick); draw(quick, true);
    const p = await mediaPreviewFetch(v);
    if(my !== seq) return;
    if(p){ current = p; fill(p); draw(p, false); }
    else { quick.pending = false; draw(quick, false); }
  };
  let t = 0;
  url.addEventListener('input', () => { clearTimeout(t); t = setTimeout(look, 450); });
  url.addEventListener('paste', () => { clearTimeout(t); t = setTimeout(look, 30); });
  if(url.value.trim()) look();
  return {get: () => current};
}
