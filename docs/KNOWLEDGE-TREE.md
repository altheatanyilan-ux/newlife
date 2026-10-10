# The Knowledge Tree

A long explanation of the Knowledge Tree (`#/tree`), written from the code (`src/19-tree-a-model.js` … `src/19-tree-g-proof.js`, and the places elsewhere in the house that call it). It says what the room is for, exactly what is stored, how every rule works, what gets in and how, what it will and will not do on its own, and the places where the code differs from the older descriptions. Its companion, the **Learning Studio** (`#/studio`), is covered briefly in §14; for a plain first-time walkthrough of both rooms, with their limits, read [KNOWLEDGE-TREE-GUIDE.md](KNOWLEDGE-TREE-GUIDE.md).

The one-sentence version: **a personal wiki for a lifelong inquiry, in which every claim you hold carries how sure you are, the reasons are required, and your changes of mind are kept on the record.** The software chooses what to put in front of you; you decide what to conclude.

Contents: 1 Purpose · 2 Vocabulary · 3 What is stored · 4 Pages · 5 Links · 6 Positions · 7 Leaves · 8 Grafts, tensions, gaps · 9 Getting things in · 10 Tending · 11 Proof · 12 Search, export, outline · 13 How it connects · 14 The Learning Studio · 15 Rules at a glance · 16 Things worth knowing · 17 Where things are.

---

## 1. Purpose, and what it deliberately is not

Most note systems store *what you wrote*. The Tree stores *what you hold and how firmly*, and keeps the history of that. Its design commitments (stated in the file headers and enforced in code):

- **One home per page.** Every page sits in a tree: a **root** (one of the great questions), a **branch** under it, a **point** under that. A point cannot be saved without a parent.
- **Links are for getting about; grafts are for reasoning.** `[[Title]]` is navigation. A **graft** joins two pages with a *kind* and a *required reason*, and it is grafts that gaps and tensions are computed from.
- **The room keeps references, not copies.** Library, Journal and Writing entries stay where they are; the Tree points at them ("leaves").
- **Changes of mind are append-only.** A position, once saved, cannot be edited or deleted — only superseded. Sealed predictions likewise. This is enforced by a guard in the persistence layer, not by good manners.
- **Nothing is decided for you.** The Tree *offers* links, *suggests* a thing to tend, and *counts* gaps. It never attaches, merges, prunes or resolves anything by itself.
- **Everything is local and rule-based.** No model is involved anywhere in the Tree. (The optional "Ask Claude" feature elsewhere in the house is separate and needs your own API key.)

## 2. Vocabulary

| Word | Meaning |
|---|---|
| **Page** (node) | One entry in the tree: title, kind, status, text, a "what would change my mind?" question |
| **Root / Branch / Point** | The three kinds. Root = no parent. Branch = under a root or branch. Point = a leaf-level claim, under anything |
| **Status** | `stub` (started), `active`, `dormant` (resting), `pruned` (set aside — never deleted) |
| **Position** | A statement you currently hold + confidence 0–100 + the date. Add-only |
| **Leaf** | A reference from a page to a Library, Journal or Writing entry |
| **Graft** | A typed, reasoned connection between two pages: *supports, contradicts, extends, echoes, raises* |
| **Tension** | A `contradicts` graft that is still open |
| **Gap** | Something the tree is missing, counted live |
| **Alias** | An alternative name that resolves to a page (an old title after a rename, or one you add) |
| **Red link** | A `[[link]]` to a page that does not exist yet |
| **Resurfacing** | The spaced re-asking "do you still hold this?" |
| **Tending** | The one small daily action the Tree puts in front of you |
| **Sealed prediction** | A prediction fingerprinted with SHA-256, resolved once |
| **Experiment** | Trials, hits, the chance rate, and the exact binomial p-value |

## 3. What is stored

Ten stores (`TREE_STORES`), each a normal array on the state object `S`, saved like the other stores; the database schema indexes `treeNodes` by `id, slug, kind, parentId, status, updatedAt, lastTendedAt`.

| Store | Rows |
|---|---|
| `treeNodes` | `{id, title, slug, kind, parentId, status, body, openQuestion, createdAt, updatedAt, lastTendedAt, prunedAt?}` |
| `treeAliases` | `{id, alias (a slug), title, nodeId, createdAt}` |
| `treeLinks` | `{id, fromId, toSlug, toRoom ('tree'/'library'/'journal'/'writing'), text}` — **rebuilt from the page's body on every save** |
| `treeGrafts` | `{id, fromId, toId, type, why, createdAt, resolvedAt, resolution}` |
| `treePositions` | **add-only, frozen** `{id, nodeId, date, statement, confidence}` |
| `treeLeaves` | `{id, nodeId, entryId, room, note, createdAt}` |
| `treeInbox` | `{id, createdAt, text}` |
| `treeReviews` | `{id, nodeId, step, dueAt, history[{date, verdict}]}` — one per page |
| `treePredictions` | **add-only, frozen** `{id, nodeId, createdAt, statement, confidence, resolveBy, hash, algo, via, resolvedAt, outcome, resolutionNote?}` |
| `treeExperiments` | `{id, nodeId, date, trials, hits, chanceRate, method, notes, createdAt}` |

Plus `S.treePrefs`: `{dismissed[] (journal suggestions you declined), lastSummary, lastYearAgo, lastExportAt, outlineOpen{}, showPruned, alwaysYearAgo, redSnapshot, summaries[]}`.

`treeEnsure()` (called from the global `migrate()`) makes every store an array, re-freezes the add-only rows, and sets default prefs. The in-memory **index** (`treeIndex()`: slug → node, id → node, alias → node, children, backlinks, leaves, grafts) is built lazily and invalidated by `treeDirty()` after any change.

**The guard.** Before every write, `persist()` calls `treeGuard(rows, lastWritten)`. For `treePositions` and `treePredictions` it compares every row that was previously written with the row now: if one **changed or disappeared**, it is **put back** (as a frozen copy) and a toast says *"A position or sealed prediction cannot be changed or removed once saved. It has been put back."* Two exceptions, both deliberate: a row seeded by the tutorial ("worked example") may be removed (it was never yours), and a prediction's *resolution* — and only that (from empty, to `true`/`false`, `resolvedAt` and a note) — is allowed once (`treeIsResolution`).

## 4. Pages

### 4.1 Making one

`#/tree` → **＋ New page**, or a red link, or a point-here button on any page, or a tending action. The dialog asks for a **title**, a **kind** and a **home** (the parent picker lists only valid parents: a point may sit under a branch, a root or another point; a branch under a root or branch; the first page of an empty tree is offered as a root), plus optional **first lines**. As you type the title, it shows **"Already in the tree: …"** with up to four near-matches so you find the page rather than making it twice; if the title already resolves to a page, it simply opens that page.

`treeSavePage` validates before saving (`treeValidate`):

- a page needs a title;
- a branch or point needs a parent; a page cannot be its own parent; the parent must exist; a parent that is the page's own descendant is refused ("the tree would loop");
- **the slug must be free**: slugs and aliases are unique *in code* (the fallback database cannot hold a unique index), so the in-memory maps are checked before every save. A message says the title is already a page, or another page's old name.

Slugs are the title lower-cased, accents removed, apostrophes dropped, anything not a letter or digit turned to `-`, trimmed, ≤ 80 characters (`untitled` if nothing is left).

Side effects of saving a new page: if it has a body, its status becomes `active` (otherwise `stub`); **its review ladder starts** (§10.2); and if its parent now holds **more than fifteen points**, a toast says it "may want a branch or two."

### 4.2 Renaming, aliases, status

**Renaming keeps the old title as an alias**: the old slug is recorded in `treeAliases`, so every link to the old name still resolves (and the old URL `#/tree/p/<old-slug>` redirects to the new one). If you later rename back, the alias becomes a name again. **Add an alias** (page menu ⋯) is for deliberate alternative names, and is checked for uniqueness too.

**Status** is changed from the ⋯ menu (*Mark stub / active / dormant / pruned*). **Pruning is a status, not a deletion**: the page, its history and everything pointing at it are kept; it is hidden from the outline (unless "show pruned"), from tending and from review; `prunedAt` is recorded and counts in the weekly summary. A `dormant` page is skipped when the daily card picks a branch to tend, but still resurfaces on its ladder (only `pruned` pages are excluded from reviews).

### 4.3 What a page shows (`#/tree/p/<slug>`)

From the top: **breadcrumb** (the path from its root) → title with kind mark (◉ root, ◆ branch, • point), status badge, "also known as…" → **the position now** (a confidence badge, the statement, "held since…", "position N"), the **confidence-over-time chart**, a **"a year ago…"** note when it applies, and the earlier positions folded under a disclosure → the **text** (markdown, with `[[links]]` drawn) → **"What would change my mind?"** (the page's `openQuestion`) → **Beneath it** (children, each with status and current confidence; a warning if more than fifteen points) → **Leaves** → **Grafts** → **Evidence** (experiments and sealed predictions on this page) → **What links here** (backlinks, from the links table, never from scanning bodies).

Editing is inline (Title, Kind, Home, Status, Text with `[[` autocomplete, and the question). Saving rebuilds this page's links.

## 5. Links

`19-tree-b-wiki.js`. In any Tree text, `[[Title]]` and `[[Title|shown as]]` link to a page — **blue if it exists** (aliases resolve), **red if it does not**; clicking a red link opens a new-page dialog with that title filled in. Three room prefixes reach into the other rooms **without copying anything**:

- `[[library:Title]]` — a Library work with exactly that title (case-insensitive); opens the Library and its panel;
- `[[journal:2025-03-01]]` — the journal entries of that day, shown in a dialog (red if none);
- `[[writing:Title]]` — a Writing Studio piece by title.

Typing `[[` in any Tree text box opens a **title picker** (arrows, Enter/Tab to pick, Esc to close) that searches titles *and* aliases; choosing an alias inserts the page's real title. The ranking is exact slug (100) > prefix (50) > substring (20) > all words present (10), aliases ranked just below. A link to a library/journal/writing target is not autocompleted.

Rendering: the body is markdown (`md()`), after the links have been lifted out so the markdown cannot damage them, then put back as HTML.

**Backlinks** come from `treeLinks`, which is rebuilt from the page body (and its question) on every save: one row per distinct (room, target) the page mentions. A page's backlinks include links to any of its aliases.

## 6. Positions: what you hold, and how sure you are

A page can hold a **position**: a statement (what you hold now) and a **confidence 0–100** (the slider). **Revise position** (or **State a position**) adds a new row; the dialog quotes the previous statement and says *"Saved positions are never edited or removed; a change of mind is a new one, and the old stays on the record."* Adding a position marks the page tended and, if it was a stub, active.

- **Current position** = the latest by date. **Earlier positions** are listed under a disclosure.
- **The confidence chart** (two or more positions): a **step line**, not a slope — "a position is held flat until the next one replaces it" — over time from the first position to now, with the 0/50/100 grid and a hover title on each dot.
- **"A year ago you believed…"** (`treeYearAgoHTML`): on a page with ≥ 2 positions, if there is a position dated **330 days or more ago** that differs from now in statement or confidence, the page can show it with the change in confidence ("Now: 85% (+15)"). To avoid nagging it appears on **about one day in four** per page (a stable hash of today's date and the page id mod 4), unless the pref `alwaysYearAgo` is set. It says "A year" or "N years" by how long ago.
- The **"What would change my mind?"** question is separate from positions; the Gaps page flags a position with no question.

## 7. Leaves: where a page rests on evidence

A **leaf** points from a page to an entry in the Library (a media work), the Journal (any journal-type entry) or the Writing Studio. **＋ Attach** opens a searchable picker (filter by room), with an optional "why it belongs" note. Only those three kinds of entry can be leaves (the function returns *"Only Library, Journal and Writing entries can be leaves."* otherwise); duplicates are ignored. Detach removes the pointer only. If the entry is later deleted from its room, the leaf shows "(the entry is gone from its room)".

The other direction is shown in the entry's own room: a **"Feeds: …"** line (`treeFeedsHTML`) appears under Journal entries, Library works and Content Studio projects that are leaves of pages.

A **point** with no leaf draws *"Citation needed: nothing in the Library, Journal or Writing is attached yet."*

## 8. Grafts, tensions and gaps — the reasoning layer

### 8.1 Grafts

From a page's ⋯ menu (**Graft to another page**) or the Grafts section: choose a *kind*, search for the other page, and write the **reason (required)**:

| Kind | Meaning |
|---|---|
| **supports** | gives reason to believe |
| **contradicts** | pulls against |
| **extends** | carries further |
| **echoes** | rhymes with, from elsewhere |
| **raises** | opens the question of |

Refused: no kind, no reason ("without one it is only a link"), a graft to itself, a missing page, or an exact duplicate (same from, to and kind). Both pages are marked tended. A graft is shown on **both** pages, grouped by kind, phrased from the page's own side ("this *extends* X" / "Y *extends* this") with its reason. A graft can be removed (with a confirmation — "Its reason goes with it").

### 8.2 Tensions (`#/tree/tensions`)

Every `contradicts` graft **not yet resolved**. Nothing is stored separately; it is derived. Each shows the two pages, the reason, and **Mark resolved…**, which asks *how* it was resolved (required) and stamps `resolvedAt` and `resolution`. Resolved ones fold under "Resolved (n)". The page's lede: *"Not failures — the places where the thinking is still alive."*

### 8.3 Gaps (`#/tree/gaps`)

Counted live by `treeGaps()`, over non-pruned pages:

1. **Red links** — `[[names]]` used somewhere in the tree that have no page; each lists where it is used and is a click away from being made.
2. **Citation needed** — *points* with no leaf.
3. **Branches with no position.**
4. **Positions with no open question** — any page that has a position but an empty "what would change my mind?" ("held, with nothing named that would change them").
5. **One-sided branches** — a branch where, anywhere in it *or its descendants*, at least one graft **supports** and none **contradicts**.

The total ("N things worth an hour") is also the *gaps* tile on the Tree home.

## 9. Getting things in

- **Quick capture — `Alt+K`** from any room (read from the key's *code*, so it works on a Mac where Alt changes the character; ignored inside a text field). A box takes a thought, a question, a claim to check; **Ctrl/⌘+Enter** keeps it. It lands in the **inbox** (`#/tree/inbox`), waiting for a home. On a Learning Studio board, Alt+K is routed to that board's tray instead.
- **Inbox actions** (also available as the day's tending card): **Make it a page** (the text becomes the title if ≤ 80 characters, else it becomes the body of a new point), **Add to a page** (appended to the end of an existing page's body, picked from a searchable list), **Let it go**.
- **Finishing a Library work** (status → finished) asks *"What point did you take from this, and where does it belong?"* — pick a page and the work becomes a leaf, with your sentence added to that page as `<point> — [[library:Title]]`; or leave the page unchosen and the thought goes to the inbox; or **Skip**.
- **Saving a Journal entry** (400 ms later) checks the entry's text against page titles and aliases (matching whole words, ≥ 4 letters, not pruned) and **offers** up to five: a floating card *"Knowledge Tree — this entry mentions…"* with **Attach as a leaf** / **Not this** (a refusal is remembered per entry and page, so it isn't offered again). Nothing is attached unless you accept. The card goes away on its own after 30 seconds.
- **Other rooms that drop things in the inbox**: Score Study (an insight from a passage, with the bars and a link back), the Purpose layer's *Programming* work (when you choose "send to the Tree"), and the Inner Demons register's belief worksheet (see §13).
- **Search** (`#/tree/search`) reaches every room — see §12.

## 10. Tending

### 10.1 The daily card

One card a day, one small thing, chosen in this order (`treeTendItem`):

1. **A page due to resurface** — "Do you still hold this?" (or, if no position yet, "Do you hold one now?").
2. **The oldest capture in the inbox** — *make it a page / add it to a page / let it go*.
3. **The root or branch left untended longest** (never-tended first; `dormant` and `pruned` and points excluded) — "One small thing for it: a line, a leaf, or where you stand." — *Write a line* (appended to its text), *Attach a leaf*, or *State / Revise position*.

"Opening a page is not tending it; only an action is" (`treeTouch` is called by adding a position, a leaf, a graft, a line, an answer to a resurfacing, or saving an edit with `lastTendedAt`). When nothing is asking, the card says *"Nothing is asking for you today. The tree can rest."* — and with an empty tree: *"Plant a root, and the tree will start asking for a little each day."*

The card also appears in compact form on **Today** (`treeTodayHTML`: "Knowledge Tree — resurfacing: **X** · tend it") and is registered as the **duty** `knowledge_tree_tend` (daily-conditional; the duty exists only on days when `treeTendItem()` is non-empty and clears when you have done it; on by default, without notification).

### 10.2 The resurfacing ladder

Every page gets a review record when it is created. The rungs are **3 days, 14 days, 61 days, 183 days, 365 days** (`TREE_REVIEW_DAYS`). On a due page you answer:

- **Still hold** → the page moves one rung out (capped at the last rung); "it will come back in N days".
- **Doubt** → back to the first rung ("it will come back soon").
- **Revise** → opens the revise-position dialog; if you save a new position, the rung **stays where it is** (it does not advance or reset).

Every answer is appended to that review's `history` with a date and verdict. `treeDueReviews()` is every review whose due date is today or earlier, for a non-pruned page, oldest due first. A page's ⋯ menu has **Review it now** to answer outside the schedule.

### 10.3 The week

Opening the Tree home computes a small **"This week"** panel (`treeWeekSummary`): **new pages**, **red links that turned blue**, **positions revised**, **branches pruned**, **open tensions**. It works from a weekly *snapshot of the red links* (kept in prefs, refreshed when it is more than 7 days old; the last 104 weeks of summaries are retained). *(See §16 for a note on when this is computed.)*

## 11. Proof: what paper cannot do

`#/tree/proof` and the **Evidence** section on a page.

### 11.1 Experiments

Record a number of **trials**, **hits** and the **chance rate** (0–1; 0.25 for one in four), a **date**, a **method (required — "targets, blinding, who judged, how chance was set")** and notes. The room shows the **hit rate against chance**, the number of **misses**, the expected count, and the **exact one-sided binomial p-value**: *"If only chance were at work, k or more hits in n would happen with probability p."* The tail is summed in log space (log-factorials kept as a running table), so large trial counts do not overflow; p < 0.01 is highlighted. The method and the misses are always shown with the rate, "because a hit rate without its misses is how people fool themselves." A preview updates as you type the numbers.

### 11.2 Sealed predictions

A **statement that can turn out true or false**, a **confidence**, and an optional "**known by**" date. When saved it is **fingerprinted with SHA-256** over a canonical string `["life-instrument/prediction/v1", pageId, createdAt, statement, confidence, resolveBy]`. The browser's `crypto.subtle` is used where available; otherwise a built-in FIPS-180-4 implementation gives the same digest (the tests compare them). The row is frozen and cannot be changed. Later you mark it **came true** / **did not** (with an optional note) — **once**; a second resolution is refused ("its outcome cannot change"). **Check the seal** recomputes the hash and tells you whether anything has changed since it was saved.

### 11.3 Calibration

From resolved predictions: the **Brier score** (mean squared difference between stated probability and outcome; 0 is perfect; always saying 50% scores 0.25), how many you were **right on** (counting ≥ 50% as a "yes"), and a **calibration plot** — for each 10-point confidence bin, the average you *said* against how often it *came true* (dot size grows with the number in the bin), against the diagonal of perfect calibration.

## 12. Search, outline, export

- **Outline** (`#/tree/outline`): the whole tree as a table of contents with fold/unfold per node, *Open all* / *Fold all*, *show pruned*, and the count of pages and roots. The fold state is remembered (`outlineOpen`).
- **Search** (`#/tree/search`): words in any order, filtered by **room** (the Tree, Library, Journal, Writing), **branch** (any non-point page; pages under it, or entries attached as leaves under it), **status** (Tree pages only), and **date range**. It searches title, body, question, current position statement and aliases for Tree pages, and title/body for entries. Up to 300 results, newest first, with highlighted snippets.
- **Export / import** (Tree home): `treeExport()` downloads `knowledge-tree-<date>.json` containing all ten stores (`kind: "life-instrument-knowledge-tree"`, version 1). **Import only adds what is missing**: any row whose id is already present is left exactly as it is ("a page you have changed since keeps your version"); a page whose slug is not free is skipped; add-only rows are added frozen. The home shows a nudge when the tree has **never been exported or the last export is more than 30 days old** (taking the more recent of the Tree's own export date and the whole-app backup date).

## 13. How the Tree connects to the rest of the house

| From | To the Tree |
|---|---|
| **Quick capture, Alt+K** (any room) | the inbox |
| **Library** — finishing a work | one question → leaf + a line on the page, or the inbox |
| **Journal** — saving an entry | offers to attach as a leaf where a page title or alias appears |
| **Journal / Library / Content Studio** entry cards | show a "Feeds: …" line for the pages they are leaves of |
| **Score Study** (Repertoire analysis) | "send to the Tree" puts an insight in the inbox with bars and a link back |
| **Purpose layer — Inner Demons** | a belief worksheet can be *promoted* to a Tree point under a root you choose, titled "Belief: …", with a position whose confidence is the belief's strength × 20 |
| **Purpose layer — Programming** | a question/answer can be sent to the inbox |
| **Today** | the compact tending line; the `knowledge_tree_tend` duty |
| **Learning Studio** | boards hang from branches; arrows between promoted chips *are* Tree grafts |
| **Backup / export** | the ten stores are part of the app's backup; the Tree can also be exported alone |
| **Tutorial** | Settings → Worked examples adds a root, a branch, two points with positions, a graft, an inbox capture and an experiment, all titled "Example · …" and removable in one click (the only time the guard lets add-only rows go) |

The Tree is intentionally **not** in the weekly/monthly review flows as a step of its own; its card on Today is how it asks for attention.

## 14. The Learning Studio (the Tree's spatial companion)

`#/studio`, `src/19-ls-*.js`. A canvas for turning **one Tree branch** into long-term memory along an iCanStudy-style pipeline — **Harvest → Sort → Ask → Shoot → Chunk → Relate → Recall → Check** — governed by one rule: *remove mechanical friction; preserve cognitive effort*. There is **no "Open in Studio" button on branch pages** — you reach a board from the Studio's own screen (`#/studio`) and pick a branch there. Cards on a board are lightweight **chips** (the "keywords"), and arrows between chips are kept in the Studio's own store (`lsGrafts`); they do **not** become Tree grafts automatically, and chips are not promoted to Tree pages by any button. Snapshots of the layout and recall attempts are add-only (the same kind of guard). Nothing in the Studio changes how the Tree itself works. **The full first-time explanation, including everything the Studio cannot do, is in [KNOWLEDGE-TREE-GUIDE.md](KNOWLEDGE-TREE-GUIDE.md)** (an earlier description in `docs/INNER-LIFE.md` §11.2 overstates the Studio in places).

## 15. Rules at a glance

- Reviews: **3 / 14 / 61 / 183 / 365 days**; hold → out one rung, doubt → back to 3 days, revise → same rung.
- A page's points: warn above **15**.
- Year-ago note: positions ≥ **330 days** old and different; shown ~**1 day in 4** per page.
- Gaps: red links, point with no leaf, branch with no position, position with no question, branch with supports-but-no-contradicts.
- Daily card order: due review → oldest inbox item → branch left longest.
- Tutorial rows are the only add-only rows a guard allows to disappear.
- Prediction resolution: once, true/false, nothing else mutable.
- Journal suggestions: whole-word match, name/alias ≥ 4 letters, ≤ 5 offered, declines remembered.
- Export nag: never, or **> 30 days**.
- Experiment p-value: exact, one-sided binomial tail.
- Brier: mean (confidence/100 − outcome)²; 0.25 is "always 50%".

## 16. Things worth knowing (including where the code and older descriptions differ)

1. **The weekly summary is computed when you open the Tree home, not when the site opens.** `treeWeekSummary()` is called only from the home route. `docs/INNER-LIFE.md` (and an older description) say "when the site is opened and kept"; the *kept* summaries (`treePrefs.summaries`, up to 104) are written but **nothing draws them yet**; only the current week is shown.
2. **Dormant is soft.** A dormant page isn't offered as the "left longest" branch, but it still resurfaces on its ladder. Only `pruned` stops resurfacing.
3. **Points are only tended through the ladder.** The "left longest" card chooses among roots and branches, never points; a point comes back only via its review schedule (or you open it).
4. **A revision does not advance the ladder.** "Revise" keeps the rung; only "still hold" advances and "doubt" resets.
5. **Positions and predictions can't be corrected.** A typo in a saved position is fixed by adding a corrected one (the earlier stays folded under it). There is deliberately no "edit".
6. **Experiments are not add-only.** They have no edit function in the UI but they are not guarded; they can be removed through the tutorial strip or by clearing data.
7. **Grafts are removable; resolved tensions stay.** Removing a `contradicts` graft deletes the tension with it (with a confirmation). Resolution never deletes anything.
8. **Aliases are slugs.** An alias is stored as a slug with the display title beside it; uniqueness is by slug, so two titles differing only in punctuation or case are the same name.
9. **Link rebuilds happen on save.** Links are rebuilt from a page's body and question when that page is saved; renaming a *target* page does not touch the sources, which is why the old title is kept as an alias (so the sources' links still resolve).
10. **Library/journal/writing links are by exact title (case-insensitive) or date.** They don't fuzzy-match; a typo gives a red (greyed) link.
11. **The "year ago" note and "one-sided branch" gap are suggestions, not conclusions.** Neither alters anything.
12. **Everything here is device-local.** No part of the Tree is sent anywhere. Export it yourself — the home nudges you after 30 days.

## 17. Where things are

| You want… | Look in |
|---|---|
| Model, stores, guard, ladder, export/import | `src/19-tree-a-model.js` |
| Links, rendering, `[[` autocomplete | `src/19-tree-b-wiki.js` |
| The room, a page, edit form, dialogs, outline | `src/19-tree-c-page.js` |
| Home, quick capture, inbox, Library prompt, Journal suggestions, search | `src/19-tree-d-rooms.js` |
| Grafts, tensions, gaps | `src/19-tree-e-reason.js` |
| Tending card, year-ago, confidence chart, week summary | `src/19-tree-f-tend.js` |
| Experiments, SHA-256, predictions, calibration, Proof page | `src/19-tree-g-proof.js` |
| Learning Studio | `src/19-ls-a-model.js` … `19-ls-e-page.js` |
| Today line / duty | `src/09-today.js`, `src/16-duties.js` |
| Persistence hooks | `src/06-db.js` (schema, `ARRAY_STORES`, `treeGuard` call), `src/04-core.js` (`migrate`) |

*Companion docs:* `docs/GUIDE.md` (all areas), `docs/INNER-LIFE.md` (the inward rooms), `docs/PURPOSE.md` (the Purpose layer), `docs/STUDIOS.md` (Jazz and Songwriting).
