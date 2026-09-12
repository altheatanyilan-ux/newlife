/* ============================================================
   THE SERVICE WORKER — the house, available with no signal.

   The whole application is one HTML file, so "working offline"
   means holding on to exactly that file plus its icons. What
   takes care is the opposite risk: a service worker that caches
   the document too eagerly will serve last month's build forever
   and there is no obvious way for anyone to notice.

   So the document is fetched network-first — with a short leash,
   because a phone on one bar should not hang waiting — and the
   cached copy is the fallback, not the default. Everything else,
   being immutable, is served from the cache first.

   BUILD is rewritten by build.js with a hash of index.html. That
   is what makes this file's bytes change when the app changes,
   which is the only signal the browser uses to install a new
   worker at all.
   ============================================================ */

const BUILD = '5f11c55f5dbd';                                  /* build.js rewrites this line */
const SHELL = `shell-${BUILD}`;
const FONTS = 'fonts-v1';
const NET_TIMEOUT = 3500;

/* Relative, so the same worker serves a project page at /newlife/
   and a bare domain without either one knowing about the other. */
const PRECACHE = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', ev => {
  ev.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    /* cache:'reload' so installing a new worker cannot pick the old document
       out of the browser's own HTTP cache and precache that instead */
    await Promise.all(PRECACHE.map(async url => {
      try { const res = await fetch(new Request(url, {cache: 'reload'}));
            if(res.ok) await cache.put(url, res); }
      catch(e){ /* a missing extra must not fail the whole install */ }
    }));
  })());
});

self.addEventListener('activate', ev => {
  ev.waitUntil((async () => {
    const keep = new Set([SHELL, FONTS]);
    for(const k of await caches.keys()) if(!keep.has(k)) await caches.delete(k);
    if(self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

/* The page asks for the swap; the worker never takes it unasked, because
   replacing the app under someone mid-sentence is worse than being a
   version behind for one more reload. */
self.addEventListener('message', ev => { if(ev.data && ev.data.type === 'SKIP_WAITING') self.skipWaiting(); });

const timeout = ms => new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), ms));

async function documentFirst(ev){
  const cache = await caches.open(SHELL);
  const fresh = (async () => {
    const pre = await ev.preloadResponse;
    const res = pre || await fetch(ev.request);
    if(res && res.ok) cache.put('./index.html', res.clone());
    return res;
  })();
  try { return await Promise.race([fresh, timeout(NET_TIMEOUT)]); }
  catch(e){
    /* offline, or slow enough that waiting is the wrong answer: serve what we
       have and let the request above finish filling the cache for next time */
    return (await cache.match('./index.html')) || (await cache.match('./')) || fresh;
  }
}

async function cacheFirst(req, cacheName){
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req, {ignoreVary: true});
  if(hit) return hit;
  const res = await fetch(req);
  if(res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
  return res;
}

/* Fonts change never; a stale one is fine and a missing one is not. Serve the
   cached face immediately and quietly refresh it behind the page. */
async function staleWhileRevalidate(req, cacheName){
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req, {ignoreVary: true});
  const net = fetch(req).then(res => { if(res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; })
                        .catch(() => hit);
  return hit || net;
}

self.addEventListener('fetch', ev => {
  const req = ev.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);

  if(req.mode === 'navigate'){ ev.respondWith(documentFirst(ev)); return; }

  if(url.origin === self.location.origin){
    /* the document by any other name — a reload of index.html, say */
    if(url.pathname.endsWith('/index.html')){ ev.respondWith(documentFirst(ev)); return; }
    ev.respondWith(cacheFirst(req, SHELL).catch(() => caches.match(req, {ignoreVary: true})));
    return;
  }

  if(FONT_HOSTS.includes(url.hostname)){ ev.respondWith(staleWhileRevalidate(req, FONTS)); return; }

  /* Everything else — the Anthropic API above all — goes straight to the
     network and is never written down. A cached answer to a private request
     is a copy of it sitting on disk with nobody's permission. */
});
