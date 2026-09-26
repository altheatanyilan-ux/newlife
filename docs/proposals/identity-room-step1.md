# The Identity room (People, Values, Skill Tree, Finance) — the Step 1 report

This is an investigation only. **No code has been changed. The build waits for
your approval.** The constraints as given: don't change the Writing Studio,
Planning or the Content Studio, except to update references to the four old
rooms, and prefer the lowest-risk approach (a container).

## 1. The four rooms today

### Files and routes
| Room | Files (lines) | Routes |
|---|---|---|
| **People** | `12-people.js` (571), `12-people-sky.js` (539, the constellation), `12-people-quick.js` (205, the quick log) | `#/people`, `#/people/<id>` |
| **Values** | `12-values.js` (252), `12-values-solar.js` (690, the solar system) | `#/values`, `#/value/<id>` |
| **Skill Tree** | `14-skills.js` (1240), `14-skillgrow.js` (383, the growth engine) | `#/skills`, `#/skills/<id>` |
| **Finance** | `16-finance.js` (603) | `#/finance` |

### Nav and CSS
| Room | Nav zone | CSS prefixes (in `02-css-sections.html`) |
|---|---|---|
| **People** | Identity | `int-`, `rt-`, `quiet-`, **`sk-`** and `sky-` (the constellation), `pe-`, `ptl-`, `ql-` |
| **Values** | Identity | `vf-`, `snap-`, `ts-`, `st-`, `solar-` |
| **Skill Tree** | **Create** | **`sk-`**, `lvl-`, `ms-` |
| **Finance** | **Create** | `stream-`, `sub-`, and the shared `del-` |

### Stores and state
| Room | Stores | Meta keys | Session state |
|---|---|---|---|
| **People** | `people` (`'id, tier'`), `interactions` (`'id, personId, date'`) | none | `S._ppl*` |
| **Values** | `values` (`'id'`), `valueSnapshots` (`'id, date'`) | `valueOrder`, `valueOrderHistory` | none |
| **Skill Tree** | `skills` (`'id, cat'`) | none | `S._sk*`, `S._open*` |
| **Finance** | `accounts`, `txns`, `budgets`, `finGoals`, `streams`, `incomeStreams`, `spendCategories` | `finance` (including `scenarios`) | `S._fin*` |

**The nav today.** Only People and Values are in the Identity zone. Skill Tree
and Finance sit in **Create**.

**Row counts.** These are your data and can't be read from the code. The
migration step below records them before and after, per store, and
refuses to go on if any differ.

## 2. How entries attach to them

- `ENTRY_LINK_KEYS = ['stages', 'substages', 'threads', 'values', 'visions',
  'skills', 'projects', 'people']`. Any entry can point at values, skills and
  people through `links.values`, `links.skills` and `links.people`.
- **Finance has no entry links.** Projects feed it through their income
  (`'proj:' + id` streams).
- `interactions` belong to people (`personId`). `valueSnapshots` belong to
  values. Skills carry abilities, levels and milestones, and projects
  reference skills (`linkedSkills`).

## 3. References elsewhere, which must keep working

| Route | Linked from |
|---|---|
| `#/people` | `09-position`, `10-timeline`, `16-creationflows`, `16-house`, `16-lifetape`, `16-reviewflows`, `16-rhythm`, `19-nav` |
| `#/values` | `09-position`, `16-house`, `16-reviewflows`, `16-rhythm`, **`18-content-detail`**, `19-nav`, `19-study-capture`, `20-modal-init` |
| `#/value/<id>` | `08-charts-metrics`, `15-projects`, `18-add`, `20-modal-init` |
| `#/skills` | `08-charts-metrics`, `09-position`, `09-today`, `15-projects`, `16-creationflows`, `16-house`, `16-rhythm`, `18-add`, **`18-content-detail`**, `19-nav`, `20-modal-init` |
| `#/finance` | `09-position`, `16-creationflows`, `16-reviewflows`, `19-nav` |

**Other dependencies:**
- **Code that checks the route name:**
  - `12-people-quick.js:126` (`parseHash().name === 'people'`);
  - `19-shortcuts.js:116` (the `i` key on People).
- **The house** (`16-house.js`, `HOUSE_LEVEL` and `HOUSE_EDGES` in
  `19-nav.js`) places each of the four rooms on a floor.
- **Smoke tests:** 35 of them open one of these routes directly.
- **Content Studio:** `18-content-detail.js` is the only file in a protected
  room that references the four. It only builds `#/values` and `#/skills`
  links, which the redirect in the proposal keeps working **without editing
  it.**

## 4. Shared code and conflicts

- **`sk-` is used by two rooms.** It's the People constellation (`sky-`,
  `sk-`) and the Skill Tree (`sk-`). Today they never share a page. In a
  container they still don't, provided only one tab renders at a time. The
  proposal renders one tab at a time, so no CSS rename is needed. A
  side-by-side overview would need renaming first.
- **Global selectors.** Each room renders into `root` and binds with
  `$('#id')` and `$$(...)`, which are document-wide. That is safe while one
  room is on the page at a time. It's another reason for one tab at a time.
- **`registerPageEntry`.** Each room sets the page's "+ add" menu. A tab calls
  its room's renderer, which sets its own menu, so this keeps working.
- **`rerender()`** re-runs the current route. With `#/identity/<tab>` it
  re-runs the container, which re-renders the active tab. It keeps working.
- **Focus mode, the house and the stats** read `activePageKey()`, which will
  report `identity`. The house and nav stats keep the four keys internally,
  so their text stays the same.

## 5. Name collisions with "identity"

- **The nav zone is already called `identity`** (`NAV_ZONES`, `navConfig()`
  keys, `data-zone="identity"`, and the localStorage `navZoneCollapsed`).
  A page key `identity` would share a word with the zone. They are different
  namespaces in code, but confusing in the zone editor and in the user's
  saved nav layout.
- **Habits have `h.identity`** ("I am someone who…"). It's a field, not a
  route, so there is no clash.
- **The vault theme `identity`** and **the Self charm category** are plain
  words, so there is no clash.
- **The proposal:** route `#/identity`, page key **`identityRoom`** in
  `NAV_PAGES` (so no key equals the zone id), and the label "Identity". The
  zone keeps its id. Once the four are merged, the zone holds Identity,
  Journals and Study.

## 6. The proposed structure: a container

- `routes.identity = (root, params)`:
  - it draws a slim tab strip (People · Values · Skill Tree · Finance) and
    below it a sub-root;
  - it calls the **unchanged** `routes.people`, `routes.values` /
    `routes.value`, `routes.skills` or `routes.finance` with the remaining
    params;
  - the last tab is remembered in `S.settings.identityTab`.
- **The old routes stay registered** and each redirects:
  - `#/people/<id>` → `#/identity/people/<id>`;
  - `#/value/<id>` → `#/identity/values/<id>`;
  - `#/skills/<id>` → `#/identity/skills/<id>`;
  - `#/finance` → `#/identity/finance`.
  Every link in section 3 keeps working with **no edits** to those files,
  including the Content Studio.
- **The two route-name checks** (`12-people-quick.js`, `19-shortcuts.js`)
  change to also accept `identity` with the tab `people`. These are the only
  edits to the rooms' own files.
- **Nav:**
  - `people`, `values`, `skills` and `finance` leave `NAV_DEFAULT`.
  - `identityRoom` joins the Identity zone first.
  - `navConfig()` already drops unknown keys and inserts new ones into their
    default zone. A saved layout that pinned one of the four gets
    `identityRoom` in its place.
- **Stores:** no change. The container moves no data.

## 7. The migration plan

- **No schema change and no data migration.** No store or meta key is
  renamed or rewritten, and there is no Dexie version bump.
- **One `navConfig` step:** it replaces the four keys with `identityRoom` in
  a user's saved layout. It runs once, is idempotent, and only affects
  localStorage.
- **Verification:**
  - store row counts before and after are identical;
  - every route in section 3 lands on the right tab and item;
  - the 35 smoke tests pass with their old URLs, through the redirects;
  - the `i` key and the quick log still work;
  - the house and nav stats are unchanged;
  - run with Dexie and with MiniDexie, and from `file://`.
- **The files:** a new `src/19-identity.js` (the container, the tabs and the
  redirects), plus small edits in `19-nav.js`, `12-people-quick.js` and
  `19-shortcuts.js`.

---

**Waiting for approval**, in particular on:
1. the container (four tabs, one rendered at a time) with redirects;
2. the page key `identityRoom`;
3. Skill Tree and Finance moving from Create into the Identity zone.
