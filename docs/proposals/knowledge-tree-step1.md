# Knowledge Tree — the pre-build report

This covers what the spec asks for "before writing any code". **Nothing has
been built. The schema change waits for your approval.**

## 1. How the house works

- **The build.** `build.js` concatenates `src/` alphabetically into one
  `<script>`. Function declarations are visible across files, but a
  top-level `const` is not readable before its file.
  - The CSS lives in `src/02-css-sections.html`.
  - Big assets are embedded as `<script type="text/plain">` blocks.
  - Dexie is inlined if installed. Otherwise the MiniDexie fallback is used.
- **Rooms and routing.** A room is `routes.<name> = (root, params) => …`,
  called by the hash router for `#/<name>/<params>`. The sidebar
  (`src/19-nav.js`) has two zones:
  - **Create:** content, projects, finance, skills, score, jazz, songwriting
    and japanese;
  - **Identity:** values, journals, people and study.
  `registerPageEntry` gives a page its "+ add" menu.
- **The shared entry model.** `S.entries` holds typed entries: `journal`,
  `quote`, `media` (the Library), `writing` (the Writing Studio) and others.
  The common fields are `{id, type, title, body, occurredAt, createdAt, tags,
  links:{stages, substages, threads, values, visions, skills, projects,
  people}, extra}`.
  - One entry appears in several rooms through its type, its `links`, and
    the #hashtags gathered at `#/tag/<tag>`.
  - **The three rooms the Tree links to:**
    - the Library, `#/commonplace`: `media` entries whose `extra.status` is
      want, progress, finished, abandoned or reexperiencing;
    - the Journal, `#/journals`: `journal` entries;
    - the Writing Studio, `#/writing/<id>`: `writing` entries.
- **Styling.** Each room's CSS is scoped by a page class, with colours from
  the theme tokens. It uses serif headings (EB Garamond, Lora) and Nunito
  Sans for the body.
- **The database layer** (`src/06-db.js`):
  - everything lives in memory in `S`;
  - `persist()` writes back only the stores whose JSON changed, rewriting a
    dirty store whole (clear, then `bulkPut`);
  - only the names in `META_KEYS` and `ARRAY_STORES` are saved, and
    `build.js` refuses to build a state key that nothing saves;
  - ids are strings from `uid()`;
  - the current schema is **v17**;
  - there is a whole-database JSON export and import (Settings), which walks
    exactly those lists.

## 2. What the fallback database supports (MiniDexie)

| Level | Methods |
|---|---|
| **Database** | `version(n).stores(schema)`, `open()`, `transaction('r' \| 'rw', tables, fn)`, `delete()`, `tables` |
| **Table** | `get`, `put`, `bulkPut`, `delete`, `bulkDelete`, `clear`, `toArray`, `count` |
| **Index queries** | only `where(index).equals(v).toArray()` |

**Not supported:**
- **`++id` (auto-increment)** and **`&` (unique) indexes.** The fallback
  hands every index string straight to `createIndex(name, name)`, so an
  index spelled `&slug` would be an invalid key path and **fail to open the
  database**.
- `add`, `update` and `modify`;
- compound indexes;
- `between`, `anyOf`, `orderBy`, `filter` and `each`;
- `upgrade()` callbacks.

**So the schema drops `++` and `&`.** The ids are `uid()` strings.
Uniqueness of slugs and aliases is enforced in code: an in-memory map is
checked before every save, and a clash is refused with a message. No
fallback methods need adding.

## 3. Conflicts with the spec, and the alternatives

1. **`reviews` is already taken.** `S.reviews` is a meta key (the Reviews
   room). A store called `reviews` would collide in the state and in the
   backup. **Every Tree store is prefixed `tree`.**
2. **`links` is ambiguous.** Every entry already has a `links` field. The
   store is `treeLinks`.
3. **Enforcing add-only.** A store is rewritten whole when it is dirty, so
   "add-only" can't rely on the database. It is enforced in three places:
   - **No edit or delete functions exist** for positions and predictions.
     The only writers are `treeAddPosition` and `treeSealPrediction`.
   - **Loaded rows are frozen.** Rows are `Object.freeze`d on load and on
     creation, so a stray assignment does nothing (or throws, in strict
     code).
   - **`persist()` guards the store.** Before writing `treePositions` or
     `treePredictions`, it checks that every row previously written is
     still present and byte-identical. If not, the write of that store is
     refused, the in-memory copy is restored from the last written version,
     and you are told.
   - The one permitted change is **resolving a prediction**: `resolvedAt` and
     `outcome` may go from empty to set, once. The guard allows exactly that
     transition.
   - A full backup restore replaces everything, as it does for every room.
     That is a restore, not an edit.
4. **"What links here" without a full scan.** `treeLinks` rows are kept
   (rebuilt from the body on save, as the spec says), and an in-memory
   `toSlug → fromIds` index is built from them on load and updated on save.
   Backlinks are a map lookup.
5. **Shortcut keys.** The site's single-key shortcuts ignore modifier keys
   (`?` for the key card, `Z` for focus, and the per-room keys). Quick
   capture proposes **Alt+K** (read by `ev.code`, so it works on a Mac,
   where Alt changes the character). It is ignored inside text fields.
6. **"Feeds:" in the Writing Studio.** Showing it on the writing desk would
   mean editing Writing Studio files. The desk already renders the Content
   room's piece bar (`18-content-studio.js`), so "Feeds:" goes into that bar
   instead, and no Writing Studio file changes. The Library and Journal
   views get the line directly.
7. **SHA-256.** `crypto.subtle` is used where it exists. `file://` counts as
   a secure context in current Chrome and Firefox, but not everywhere. The
   documented fallback is a small pure-JS SHA-256 in the same file. It gives
   the identical digest, which the tests check against `crypto.subtle`.
8. **Backups.** The Tree stores join `ARRAY_STORES`, so the existing
   whole-database export and import includes them automatically. A
   Tree-only JSON export and import is added as well. Export records
   `S.settings.lastExportAt`, which drives the gentle warning after 30 days.
   It is recorded for the whole-database export too, a one-line addition in
   Settings.

## 4. The file names

They sort after `06-db.js`, among the `19-*` rooms, and after `19-time-*`.

| File | Contents |
|---|---|
| `src/19-tree-a-model.js` | Defaults, slugs, aliases, the uniqueness checks, the add-only writers, the backlink index, the migration |
| `src/19-tree-b-wiki.js` | `[[links]]` parsing (plus `library:`, `journal:`, `writing:`), rendering blue and red links, the `[[` autocomplete |
| `src/19-tree-c-page.js` | `routes.tree`: the node page, the outline, the rules (a parent is required, the 15-children warning), revising a position |
| `src/19-tree-d-rooms.js` | Leaves, the "Feeds:" hooks, the inbox and quick capture, the Library prompt, Journal suggestions, cross-room search |
| `src/19-tree-e-reason.js` | Grafts (a reason is required), the tensions page, the gap detector |
| `src/19-tree-f-tend.js` | The daily tend card, spaced resurfacing, "a year ago…", the confidence timeline (SVG) |
| `src/19-tree-g-proof.js` | Experiments (an exact binomial in log space), sealed predictions (SHA-256), calibration and Brier scores, the weekly summary, the Tree export |

**The nav:** `tree` joins the **Identity** zone, after journals ("who you are,
and have been" fits an inquiry).

## 5. The schema change: v17 → v18

```js
// src/06-db.js — added to DB_SCHEMA (existing stores untouched)
treeNodes:       'id, slug, kind, parentId, status, updatedAt, lastTendedAt', // slug unique IN CODE
treeAliases:     'id, alias, nodeId',          // alias unique in code
treeLinks:       'id, fromId, toSlug, toRoom', // rebuilt from the body on save
treeGrafts:      'id, fromId, toId, type',     // why: required
treePositions:   'id, nodeId, date',           // ADD-ONLY (guarded)
treeLeaves:      'id, nodeId, entryId, room',  // a reference only; the entry stays in its room
treeInbox:       'id, createdAt',
treeReviews:     'id, nodeId, dueAt',
treePredictions: 'id, nodeId, createdAt, resolvedAt',   // ADD-ONLY except the one resolution
treeExperiments: 'id, nodeId, date',

db.version(18).stores(DB_SCHEMA);  // … v18 knowledge tree (new stores only; nothing existing changes)
// + the ten names appended to ARRAY_STORES
```

**The migration.**
- Both Dexie and MiniDexie create the ten missing stores at v18. No existing
  store's key or indexes change, and no existing row is read or rewritten.
- `migrate()` only makes sure the ten arrays exist on `S` (empty on first
  run). It seeds nothing, so there is no auto-generated content.
- **Tests:**
  - load a populated v17 database with Dexie and with MiniDexie, then check
    that entry, task and score counts and a JSON checksum of every existing
    store are identical after the upgrade;
  - import an old backup without the Tree stores: it restores, and the Tree
    is empty;
  - run from `file://`, and with `npm start` for the service worker.

**If Score Study (its v18) is approved first,** this becomes v19. The two
proposals don't touch each other's stores.

---

**Waiting for approval**, in particular on:
1. the `tree` prefix on every store;
2. the add-only guard in `persist()`;
3. Alt+K for quick capture;
4. "Feeds:" through the Content piece bar rather than a Writing Studio edit.
