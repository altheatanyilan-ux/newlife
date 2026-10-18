# Netlify + Supabase — hosting the house, and keeping one life on every device

The app is still exactly what it was: **one HTML file** that keeps its data in
the browser and works with no signal. Nothing about that changes.

- **Netlify** serves the file (so it has an `https://` address you can install on a phone).
- **Supabase** holds a private **copy** of your data, so a phone, a laptop and a tablet
  see the same life. Each device still works offline and catches up when it can.

You need: a Supabase project, a Netlify site connected to this repo, and about fifteen minutes.

## 1. Supabase

1. Create a project at supabase.com (any region near you; the free plan is enough to start).
2. **SQL editor → New query**, paste all of [`supabase/schema.sql`](../supabase/schema.sql), **Run**.
   It creates three small tables (`li_heads`, `li_parts`, `li_profile`) and one function
   (`li_commit`). Every table is private to the signed-in user by row level security, so the
   public key below can only ever reach your own rows. It is safe to run again.
3. **Project settings → API**: copy the **Project URL** and the **anon / public** key.
   (The `service_role` key is a master key — never put it anywhere in this app or in Netlify.)
4. **Authentication → Providers → Email**: leave it on. Decide about confirmation:
   - *Confirm email on* (the default) — creating the account sends a link; open it, then sign in.
   - *Off* — you are signed in the moment you create the account. Simpler for one person.
5. When **your** account exists, turn **Allow new users to sign up** off (same page), so nobody
   else can create one on your project.

## 2. Netlify

1. **Add new site → Import from Git**, pick this repo. The settings come from
   [`netlify.toml`](../netlify.toml): it runs `node build.js --dist` and publishes only `dist/`
   (the page, its service worker, the manifest, the icons — not the source or tests).
2. **Site settings → Environment variables**, add:
   - `SUPABASE_URL` — the Project URL
   - `SUPABASE_ANON_KEY` — the anon key
3. Deploy. The build bakes those two values into the page, so every device that opens the site
   is already pointed at your project. (They are public by design; the security is the row level
   security from step 1.2.)

If you would rather not use environment variables, skip step 2: **Settings → The cloud copy** on
each device accepts the URL and key by hand.

## 3. First use

1. Open the site → **Settings → The cloud copy (Supabase)** → enter an email and password →
   **Create the account**. This device's data goes up.
2. On every other device: open the site, same screen, **Sign in**. A device that already holds
   its own data is asked once which copy to keep:
   - **Use the cloud's copy here** — for a new phone or a fresh browser. The device's own data
     is first saved to a file (`before-cloud-<date>.json`), then replaced.
   - **Put them together, part by part** — anything that differs is listed and you choose.
   - **Replace the cloud with this device** — only if this device is the real one.
3. After that it is automatic: a few seconds after a change, when you come back to the app, and
   when it starts. **Exchange now** does it by hand. Not signed in, none of it runs.

### How two devices stay out of each other's way

Each part of the app (tasks, entries, scores, settings by key…) is exchanged separately.
Practising on the tablet and tidying tasks on the laptop touch different parts, so both are kept
with no question. Only a part changed in **both** places since the last exchange is put to you
(*keep this device's* / *take the other's*), with a copy of this device's side saved first. No
clocks are compared. A part is committed to Supabase in one atomic step that refuses if another
device got there first, so two devices cannot silently overwrite each other.

## 4. Encryption (optional)

**Settings → The cloud copy → Encrypt the cloud copy.** Everything is encrypted in the browser
(AES-GCM, key from your passphrase by PBKDF2) before it is sent, so Supabase holds only
ciphertext and cannot read your journals, finances or inner work.

- The passphrase is never sent or stored by anyone but you. **If you forget it, the cloud copy
  cannot be recovered** — by you, by Supabase, or by me. (Each device's own copy is not affected.)
- A new device asks for it once and can remember it on that device.
- Turning it off re-sends everything as plain text.

## 5. Things worth knowing

- **Size.** Photos, scores and recordings live inside the data, so a heavy library is a heavy
  upload the first time (it is compressed, and only changed parts are sent afterwards). The free
  Supabase plan includes about 500 MB of database; check your usage under *Project settings →
  Usage*. The app itself is a single ~40 MB file (~24 MB compressed); Netlify serves it fine, and
  the service worker keeps it after the first visit.
- **Backups.** Keep exporting one now and then (*Settings → Export backup*). The cloud copy is a
  copy, not a backup of a mistake: a deletion on one device reaches the others.
- **The address matters.** Browser storage is per address. The Netlify address is a different
  "house" from `file://…` on your laptop; the first sign-in with *Use the cloud's copy* or
  *Replace the cloud with this device* is how a life moves between them (see `DEPLOY.md`).
- **Sessions** live in each browser (not in your data, never in a backup or sync file). *Sign out*
  removes it and leaves the device its data.
- **Testing without Supabase.** `node tests/mock-supabase.js` starts a stand-in server, and
  `smoke-cloud.js` / `smoke-cloud-ui.js` exercise the whole exchange against it.

## Troubleshooting

| You see | It means |
|---|---|
| *Invalid login credentials* | wrong email/password (or the address is not confirmed yet) |
| *Could not reach Supabase* | offline or blocked; nothing is lost, it retries |
| *permission denied for table …* / *relation … does not exist* | `schema.sql` was not run (or not fully) |
| *That passphrase does not open this data* | wrong passphrase for the encrypted copy |
| A "needs your say" toast | a part changed on two devices; press *decide* |
