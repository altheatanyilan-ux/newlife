# Brand Strategy — the Step 1 report

This is an investigation only. **No code has been changed. The build waits for
your approval.**

## 1. The Content Studio room (`#/content`)

- **Files:** `src/18-content-data.js` (model), `-page.js` (route, view
  switch), `-views.js`, `-detail.js`, `-bind.js`, `-vault.js`, `-bridges.js`,
  `-studio.js` (the bar it adds to the Writing Studio desk) and
  `src/19-content-seed.js`.
- **The UI:**
  - four views: **Pipeline** (Idea → Seed → Outline → Draft → Refining →
    Ready → Published → Archived), **Library** (the shelf), **Calendar**
    and **Stats**;
  - a piece detail panel with the stage, type, destination, themes,
    the "trail" of what the piece grew out of, linked entries, quotes from the
    vault, the pre-publish checks, the scheduled and published dates and the
    URL;
  - "Catch an idea" and "Start a piece".
- **The data:**
  - **A piece is not a separate record.** It *is* the Writing Studio project
    (an `S.entries` row of `type:'writing'`). The Content fields hang off it
    under `extra.content`: `stage, stageAt, subtitle, type, dest, themes[],
    trail[], linked[], quotes[], checks{}, scheduled, publishedOn, url,
    pinned, order, raw, focusMinutes`.
  - The room-level state is `S.content` (`themes[], prefs, dismissedPrompts`)
    and `S.contentVault` (`quotes[]`, the book-quote vault).
- **Entry fields it uses:** `id, type, title, createdAt, extra.status` (read
  to derive a stage), `extra.target.dest` and `extra.content.*`.

## 2. The Writing Studio

- **Files:** `src/18-writing.js` (the route, `newWriting`, the compost heap,
  the migration), `src/18-writingstudio.js` (the Scrivener-style desk:
  binder, corkboard, outliner, snapshots) and `src/18-ws-readability.js`.
- **How a piece is stored:** yes, it is an entry in the unified model:
  `S.entries` with `type:'writing'`. Its fields:
  - `title`, `body` (the legacy body), `tags`, `links`;
  - `extra: {kind, status, premise, target:{dest, wordTarget, deadline},
    pinned[], outline[], beats[], comments[], versions[], scratchpad,
    publication:{status, where, when, notes}, binder…}`.
- **Status and stage:** `extra.status` is one of Outlining, Drafting,
  Polished or Published. `extra.publication.status` is separate.
- **Tags:** the entry's `tags` plus the #hashtags in its title and body.
- **Account or platform:** only `extra.target.dest` (free text) and Content's
  `extra.content.dest` (Personal blog, Substack, Twitter, LinkedIn, Medium,
  Private, Several). There is no account model.
- **How a piece is opened:** the deep link `#/writing/<id>` goes to
  `renderWritingDesk(root, id)`. `#/writing` alone redirects to
  `#/content/shelf`.
- **A creation function that can be called without modifying it: yes.**
  `newWriting()` in `src/18-writing.js` pushes a new `type:'writing'` entry
  and returns it. The Content room already calls it through
  `contentNewPiece()`. So **"Start in Writing Studio" can be built:**
  `const e = newWriting(); e.title = <brief angle>; navigate('#/writing/' +
  e.id)`. The slot stores `e.id`. Nothing is written into the piece beyond
  what `newWriting()` itself sets, plus the title.

## 3. The unified entry model

- **The row:** one `S.entries` row per entry, persisted in the `entries`
  store (`'id, type, occurredAt, createdAt'`). The common shape is:
  ```
  {id, type, title, body, occurredAt, createdAt, media[],
   links:{stages, substages, threads, values, visions, skills, projects, people},
   people[], places[], emotions[], tags[], confidence, extra:{…type-specific…}}
  ```
- **How one entry belongs to several rooms:**
  - a room shows every entry of the types it cares about;
  - `links.*` puts an entry in front of the stages, values, visions, skills,
    projects and people it names;
  - hashtags (`entryTags`) gather entries across rooms at `#/tag/<tag>`.
  - Example: a `type:'quote'` entry is shown in the Journals (the quotes
    journal), on its tag pages and in Today's snippets.
- **Dexie version:** **v17** (the last change added the Songwriting voice
  memos store).

## 4. How rooms are registered, routed and rendered

- **Routing:** `routes.<name> = (root, params) => {…}`. The hash router
  (`#/<name>/<params…>`) calls it with the page element.
- **Registration:** the sidebar is `NAV_DEFAULT` in `src/19-nav.js` (zones,
  icons and labels). `registerPageEntry({...})` gives a page its
  "+ add" menu.
- **Styling:** CSS lives in `src/02-css-sections.html`, scoped by a page or
  room class, with colours from the theme tokens (`--ink`, `--faint`,
  `--accent` and so on).
- **Persistence:**
  - state lives in `S` and is saved by `saveNow()`;
  - only the keys in `META_KEYS` or `ARRAY_STORES` are written;
  - `build.js` refuses to build a state key that nothing saves.

## 5. The proposed data model

This extends the entry model. **There are no new tables and no Dexie
version bump.**

### Accounts: one new meta key, `S.brand`

```js
S.brand = {
  v: 1,
  accounts: [{ id, name, handle, platforms: [], status: 'active' | 'paused' | 'retired',
    charter: { purpose, audience, promise, positioning, never: [] },
    voice:   { tone: { formalCasual: 3, seriousPlayful: 3, reservedBold: 3 },
               lexiconUse: [], lexiconAvoid: [], signatureMoves: [],
               visual: { colours: ['#…'], type: '', imagery: '' },
               perPlatform: { <platform>: '…' } },
    pillars: [{ id, name, purpose, targetPct }] }],   // 3–5; totals validated to 100
  kinds: { … },          // the fixed kind list, in one config object (extensible later)
  prefs: { account: null, view: 'dashboard' }
}
```

**Why a meta key rather than entries.** An account and its charter, voice
and pillars are configuration: the frame every note is filed against, not a
note. The Content room keeps its themes the same way (`S.content`). The
charter statements and voice rules you *write down* are still entries (see
below). The profile holds the current settings.

### Every note is an entry: `type:'brand'`, with its fields under `extra.brand`

```js
{ type: 'brand', title, body, tags, links, …,
  extra: { brand: {
    kind: 'quote' | 'observation' | 'idea' | 'swipe' | 'competitor'
        | 'charter' | 'voiceRule' | 'pillarNote' | 'hypothesis'
        | 'horizon' | 'slot' | 'brief'
        | 'decision' | 'review' | 'question' | 'metric'
        | 'parked',
    scope:  ['<accountId>', …] | ['studio'],        // filing rule 1
    anchor: { kind: 'charter' | 'pillar' | 'plan' | 'decision' | 'account' | 'studio', id },   // filing rule 3
    retired: false,                                 // "Retired" is a status, never a deletion
    …the kind's own fields…
}}}
```

A Quote is the exception. It is a **`type:'quote'`** entry (`extra.author`,
`extra.source`, which the house already understands) with `extra.brand` added.
That way it shows in the quotes journal, on tag pages and in the Today
snippets, as the spec wants ("a Quote can also appear in other rooms").

### The kinds' own fields
| Kind | Fields |
|---|---|
| horizon | `level: 'season' \| '90' \| '30' \| 'week'`, `parentId`, `start`, `end`, `theme`, `objective`, `hypothesisIds[]`, `targetMix: {pillarId: pct}`, `reviewId` |
| slot | `date`, `accountId`, `platform`, `pillarId`, `planId`, `status: 'planned' \| 'linked' \| 'published' \| 'reviewed'`, **`pieceId`**, `checklist: {ruleId: true}`, `publishedOn`, `publishedPlatform`, `metricIds[]` |
| brief | `forId` (a slot or an idea), `angle`, `pillarId`, `purpose`, `audience`, `hypothesisId`, `refs[]` (entry ids). **No body text.** |
| decision | `question`, `options: [{text, pros, cons}]`, `choice`, `rationale`, `changeMyMind`, `reviewOn`, `outcome` |
| hypothesis | `statement`, `status: 'open' \| 'confirmed' \| 'revised' \| 'abandoned'`, `planIds[]` |
| review | `level: 'week' \| '30' \| '90'`, `planId`, `answers: {promptId: text}` |
| metric | `date`, `numbers: [{label, value}]`, `slotId` |
| swipe / competitor | `link`, `why` / `competitorAccount`, `take`, `avoid` |

### How a slot links to a Writing Studio piece

`slot.pieceId` holds the id of an existing `type:'writing'` entry. Only the
slot is written; the piece is not touched.

- **Showing it:** the slot reads `title` and `extra.status` (read-only) and
  links to `#/writing/<pieceId>`.
- **A deleted piece:** the lookup finds nothing, and the slot shows "piece
  missing" with a button to unlink.
- **Slot status is separate:** it is Brand Strategy's own and never follows
  or drives the Writing Studio's status or Content's stage.

**The Inbox** is derived, not stored: any `brand` entry missing a scope, a
kind or an anchor. The dashboard shows its count, and a triage view files
them with three quick pickers.

## 6. Overlap and conflict risks, and how they're avoided

- **No second editor.** Brand has no body editor, draft field, version
  history or writing pipeline. A brief is intent only, and "Start in Writing
  Studio" hands over to the existing desk.
- **No writes to pieces.** Brand never writes to a `type:'writing'` entry. It
  reads the `S.entries` rows directly and does **not** go through
  `contentPieces()`, because that helper fills in the Content defaults on
  every piece it touches. The link lives on the slot.
- **Two "published"s.**
  - Content has a Published stage and pre-publish checks, and the Writing
    Studio has a Published status. The slot's own Published is a third.
  - They are kept apart on purpose: a piece can be published on one account
    and planned on another.
  - The slot shows the piece's own status beside its status, read-only, so a
    mismatch is visible but never "fixed" automatically.
- **Themes and pillars.** Content's themes (house-wide) and Brand's pillars
  (per account) are different things. They are not merged.
- **"Catch an idea".** In Content, it creates a *writing entry* at the Seed
  stage. A Brand Idea is a note (`type:'brand'`, kind `idea`). It becomes a
  piece only when you press "Start in Writing Studio" on it.
- **Naming.**
  - Everything is prefixed `brand`: functions `brand*`, CSS `.brand-*`, the
    route `#/content/brand/...`, the meta key `brand` and the entry type
    `brand`.
  - It avoids `draft`, `piece`, `editor` and `version`. (Content already has
    a stage called `draft` and helpers named `piece*`.)
- **The name "Commonplace".** The Library room used to be called the
  Commonplace Book (the route is still `#/commonplace`). The spec's
  "Commonplace browser" is shown inside Brand as **"Notebook"**, so the two
  aren't confused.
- **No Writing Studio files are modified.** No hook is needed: `newWriting()`
  and the `#/writing/<id>` route already exist.

## 7. The new files

All of them sort after `18-content-bind.js` and before
`18-content-bridges.js`. They only reference other files' functions at run
time, so the order is safe.

| File | Contents |
|---|---|
| `src/18-content-brand-a-model.js` | `S.brand` defaults, the kinds config, the filing rule, the Inbox, the migration |
| `src/18-content-brand-b-accounts.js` | Account profile, charter, voice and visual, pillars, the differentiation matrix |
| `src/18-content-brand-c-plans.js` | Horizons, slots, briefs, the pillar mix (target against actual), the slot calendar, the piece link |
| `src/18-content-brand-d-judgment.js` | Decisions, due for review, the hypothesis loop, review templates, metric notes |
| `src/18-content-brand-e-views.js` | Account switcher, dashboard, the Notebook browser (filters and search), the studio-wide view, triage |

**Changed:**
- `src/18-content-page.js` gains a fifth view, **Brand**, in its switcher.
- `src/06-db.js` gains `'brand'` in `META_KEYS`.
- The CSS goes in `02-css-sections.html`.

**Not touched:** `18-writing.js`, `18-writingstudio.js`, `18-ws-readability.js`
and `18-content-studio.js` (the bridge onto the desk).

## 8. The migration plan

- **No schema change.**
  - The new entries go in the existing `entries` store.
  - `S.brand` is one more meta row, so there is no Dexie version bump.
  - Nothing existing is rewritten.
- **`migrateBrand()`:**
  - It runs on entering the room and is idempotent.
  - It creates `S.brand` if missing (`v:1`) and fills missing fields on
    accounts and pillars.
  - It fills in `extra.brand` defaults **only on entries that already have
    `extra.brand`**. It never touches another entry.
  - A later schema change bumps `S.brand.v` and migrates forward with defaults
    only.
- **Backup:**
  - The site's JSON export and import already carries `S.entries` and every
    meta key, so Brand data is in every backup automatically.
  - A Brand-only JSON export is added as well. It contains the brand entries
    plus `S.brand`, and piece links as ids only, never Writing Studio
    content.
- **Tested against a populated database** (the seeded house plus the Writing
  Studio pieces):
  - the entries count and the JSON of every `type:'writing'` entry are
    identical before and after;
  - open, edit and save a piece in the desk;
  - run with Dexie and with MiniDexie;
  - `file://`;
  - zero network requests besides Google Fonts.

---

**Waiting for approval**, in particular on:
1. `S.brand` as a meta key for the accounts, with every note an entry;
2. Quotes as `type:'quote'`, so they surface in other rooms;
3. the name "Notebook" instead of "Commonplace".
