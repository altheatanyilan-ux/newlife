# Putting the house on a phone

The app is one HTML file with its data in the browser's own database. That is
why it works with no server — and also why the address it is opened from
matters more than it looks like it should.

## Read this first: the data does not travel

A browser keeps its storage **per origin**. `file:///Users/you/index.html` and
`https://you.github.io/newlife/` are two different origins, so they get two
different databases. Opening the hosted copy does not show you the entries you
made in the local one, and never will.

Nothing is lost — the local copy still has everything — but you have to carry
it across yourself, once:

1. Open the **local file**, go to Settings → **Export backup**. You get a
   `backup-YYYY-MM-DD.json`.
2. Open the **hosted** copy, go to Settings → **Import backup**, pick that file.
3. From then on, treat the hosted copy as the real one.

The hosted app says this to you the first time it opens to an empty house, so
it is hard to get wrong by accident. It is still worth keeping the export: a
backup is the only copy of your data that exists outside one browser.

## Hosting it

### GitHub Pages

Free, and the repo is already here. **Pages from a private repo requires a paid
GitHub plan** — on a free plan the repo has to be public. Publishing the repo
publishes the *code*, never your data (that lives only in your browser) and
never your Anthropic key (it is typed in and stored locally, not committed).

1. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push to `main`. `.github/workflows/pages.yml` rebuilds `index.html` from
   `src/` and publishes it.
3. The site lands at `https://<user>.github.io/<repo>/`.

### Cloudflare Pages or Netlify

Free, and both deploy from a **private** GitHub repo. Point either at this repo
with:

- **Build command:** `node build.js`
- **Output directory:** `.` (the repo root — `index.html` is built in place)

## Installing it on a phone

Once it is on an `https://` address:

- **iOS** — open it in Safari, Share → **Add to Home Screen**.
- **Android** — open it in Chrome, menu → **Install app** / **Add to Home
  screen**.

You get the 生 icon, no browser chrome, and the whole app works offline. It is
worth doing on the laptop too: it takes your data off the `file://` origin,
where browser storage is at its most fragile.

## How updates reach an installed app

`sw.js` holds a copy of the app for offline use. Serving a stale copy forever is
the classic way this goes wrong, so:

- The document is fetched **network-first** (with a short timeout). Online, you
  always get the current build; offline, you get the cached one.
- `build.js` stamps a hash of `index.html` into `sw.js`. Changed bytes in that
  file are the only signal a browser uses to fetch a new worker, so this is what
  makes a deploy actually arrive.
- When a new build lands while the app is open, it **offers** a reload rather
  than swapping underneath you.

If you ever edit `sw.js` by hand, keep the `const BUILD = '…';` line — `build.js`
fails loudly if it cannot find it.

## Working on it locally

`node build.js` then open `index.html` from disk, exactly as before. Service
workers cannot register on `file://` at all, so none of the above runs there and
the local copy behaves the way it always has.

To exercise the hosted behaviour locally you need a real server — any static one
will do:

```sh
node build.js && npx serve -l 8099 .
# then open http://localhost:8099/
```

`localhost` counts as a secure origin, so the worker, the manifest and offline
mode all work there.
