# The Content Studio and Brand Strategy

A long explanation of two linked rooms, written from the code (`src/18-content-*.js`, `src/18-writing.js`, `src/18-writingstudio.js`, `src/19-content-seed.js`, and the places elsewhere that call them). It treats them **separately**, as asked: **Part A** is the **Content Studio** (`#/content`) — the *mother page*, where every piece of writing lives and moves from a thought to a published thing; **Part B** is **Brand Strategy** (`#/content/brand`) — a view *inside* the Content Studio for anyone running one or more public accounts, which plans and judges posts but never writes them. **Part C** describes exactly where the two meet; **Part D** lists the edges and oddities worth knowing; **Part E** says where things are.

Rules that hold across both (stated in the file headers and enforced in the code):

- **No second writing tool.** A "piece" *is* a Writing Studio project: one record, `type:'writing'` in `S.entries`. The Content Studio adds its own fields under `extra.content`; nothing is copied, so nothing can drift.
- **Brand never writes to a piece.** A Brand slot keeps a piece's id and *reads* its title and status. The only thing Brand ever does to the Writing Studio is call its own `newWriting()` and set the title.
- **Rule-based, local, no model.** Every count, ordering and warning is a readable rule. The only network-facing thing near these rooms is the optional link-preview feature in the Library, which is not part of either.
- **Nothing is deleted by accident.** Brand "retires" rather than deletes; pieces are deleted through the undo toast; a theme in use cannot be deleted without confirming how many pieces will lose it.

---

# Part A — The Content Studio (`#/content`)

## A1. What it is

*The pipeline from a thought to a published thing.* It answers four questions: **what have I caught?** (ideas and seeds), **where is each piece?** (an eight-stage pipeline), **what is going out when?** (a calendar), and **what is the shape of my output?** (numbers). It is deliberately *management, not craft*: "the writing itself happens in the Writing Studio, and the button that goes there is the most prominent thing in the panel."

Addresses: `#/content` (the saved view), `#/content/pipeline`, `/calendar`, `/shelf` (also `/library`), `/stats`, and `#/content/brand/...` (Part B). The old `#/writing` redirects to `#/content/shelf`; `#/writing/<id>` is still the **desk** for one piece and `#/writing/compost` is the compost heap. Deep addresses set the view for that visit only and do not overwrite your saved default.

## A2. A piece, and what is stored

A piece is a Writing Studio entry (`type:'writing'`). The Content Studio keeps its own fields in `extra.content` (created and repaired by `pieceContent(e)` every time one is read):

| Field | Meaning |
|---|---|
| `stage` | one of eight (below); a piece written before this room existed gets the stage its Writing Studio status already implies (Outlining→outline, Drafting→draft, Polished→ready, Published→published) rather than being dumped at Idea |
| `stageAt` | when it last changed stage (used for "how long a piece waits") |
| `subtitle`, `type`, `dest` | kind (essay, newsletter, thread, short story, poem, reflection, guide, note) and destination (personal blog, Substack, Twitter, LinkedIn, Medium, private, several places) |
| `themes[]` | ids from your theme vocabulary |
| `trail[]` | "what sparked it": steps with a kind (journal entry, something that happened, something read, a quote, a value, a skill, a project, a compost fragment, a shower thought, a conversation, other), a description and a date |
| `linked[]` | "drawn from your own life": references to Journal / Library / Timeline entries, shown as links, which also drive the *used in …* back-references |
| `quotes[]` | quotes pinned to the piece, each with its source, author, location, why you caught it, and — for the vault — whether it is a paraphrase |
| `scheduled`, `publishedOn`, `url` | planned date, date it went out, the published address |
| `checks{}` | the five "before it goes out" ticks |
| `pinned`, `order` | pinned to the top of its column; manual order inside it |
| `raw` | a seed's raw thought (it also becomes the piece's scratchpad) |
| `focusMinutes` | time the Planning timer logged against it |
| `accountId` | the Brand account it is for (Part C) |

The word count is **counted off the binder** (`wsProjectWords`), never stored, so the Content Studio and the Writing Studio always report one number. The word target is `extra.target.wordTarget`. A piece's *last edited* time is the latest of its stage change and any binder document's update.

## A3. The eight stages

| Stage | Icon | Writing-Studio status it implies | Meaning |
|---|---|---|---|
| Idea | ○ | Outlining | a thought that will not leave |
| Seed | ◍ | Outlining | worth keeping, not yet shaped |
| Outline | ◇ | Outlining | the bones are down |
| Draft | ◈ | Drafting | being written |
| Refining | ◆ | Drafting | being made better |
| Ready | ● | Polished | finished, waiting to go out |
| Published | ▣ | Published | out in the world |
| Archived | ▢ | Polished | put away, not thrown away |

**Two statuses, one truth.** The Writing Studio keeps four statuses; this room keeps eight. *Moving a stage sets the status it implies; moving the status only moves the stage when the stage does not already sit inside that status*, so the finer distinction is never thrown away by a coarser control. `migrateContent()` (run on every visit to the room) reconciles any status the Writing Studio changed while Content was closed. Moving a piece to Published stamps `publishedOn` with today if empty.

Rule-of-thumb flags used across the room: **stale** = a piece in outline/draft/refining untouched for **more than 30 days**; **soon** = scheduled within the next 7 days and not published; **overdue** = scheduled before today and neither published nor archived; **"still germinating, or ready to be planted?"** = an Idea more than 14 days old.

## A4. The four views

### Pipeline (key `1`)
Eight columns, each with a real width (default 248 px, min 150, max 620; drag a column's right edge, double-click to reset, arrow keys when focused; widths are remembered) and the board scrolls sideways rather than squeezing. A card shows: title (or the first 60 characters of the raw thought), a raw-thought preview for ideas/seeds, a progress bar when there is a word target, kind chip, word count (`w/t`), destination, up to two themes (+n), "edited N days ago", and the scheduled date (red if overdue). Interactions: click opens the **piece panel** (after a 190 ms pause so a double-click can win); **double-click** goes straight to the desk (`#/writing/<id>`); **right-click** opens a menu (details, desk, move to…, pin, duplicate, archive, delete); **drag a card between columns** to change its stage — where it lands inside the column becomes its order ("dropping is both *what stage* and *how urgent*"); pinned cards sort first. A **＋** on each column starts a piece there (the Idea column opens the capture box).

Above the board, **"closest to done"** shows up to three pieces by this rule (`contentWhatsNext`): first any **Ready** piece; then a **Refining** piece with ≥ 80% of its target words; then any other Refining piece; then a **Draft** edited in the last 3 days. Within a tier, most recently edited first. Nothing else qualifies.

### Calendar (key `2`)
A month or week grid borrowed from the Planning page's shell. A piece sits on its **scheduled** day, or — once published — its **publishedOn** day. **Drag a piece onto a day** to reschedule it (or to change its publish date if it is already out). **＋** on a day creates a seed scheduled for that day. A side panel, **"what to send out next"**, repeats the closest-to-done list (five). If any Brand accounts exist there is an **account filter** bar (All accounts / one account) that filters by each piece's `accountId`.

### Shelf (key `3`)
Every piece, as a grid or a list, with filters you can combine: **stage**, **kind**, **where it goes**, **theme**, **length band** (< 500, 500–1500, 1500–3000, 3000+ words), and **drawn from life** (yes/no — whether it has linked entries); sorted by last edited, stage, kind, word count, planned date or title; plus a text search over title, subtitle, raw thought, tags, theme names and the first 4,000 characters of the body.

### Numbers (key `4`)
- *Where everything is sitting* — a bar per stage and a plain-words reading of the bottleneck (`ctBottleneck`): ≥ 6 ideas and ≤ 1 draft → "the gap is between catching and starting"; ≥ 4 underway and none finished → "between writing and letting go"; ≥ 3 ready → "they are only waiting on you".
- *How long a piece waits, by stage* — average days since the stage changed, for seed/outline/draft/refining/ready.
- *Published, by week* — a 26-week sparkline of pieces published, with totals altogether / this month / this year.
- *Words that made it out* — published words, the average piece, total ever written.
- *What you make* and *where it goes* — counts by kind and by destination.
- *What you write about* — a bar per theme, including a line naming **themes with nothing in them** ("the point of this list").
- *Days you touched something* — a streak, your best, and a 26-week heat grid of days when any piece or binder document was edited.
- *What your writing keeps reaching for* — the threads, values and works that turn up across many pieces (`crossPollinationHTML`).
- *Left alone too long* — the stale pieces, oldest first.

## A5. Catching things: ideas and seeds

**Catch an idea** (`N` or `I` on the page; the global "+" menu; or "→ Content" on a compost fragment): a box for the raw thought, an optional working title, *what sparked it* and theme chips. **Ctrl/⌘+Enter** keeps it. It creates a piece at stage **Idea** with the raw thought as its scratchpad and the spark as the first trail step; a toast says "Caught." The board is redrawn before the sound and toast, "a thought that has been caught should appear even if the sound or the toast cannot".

**Give it a shape** (on an Idea): title, kind, destination, themes → "Plant it" moves it to **Seed** and opens its panel.

**Bridges from the rest of the house** (`18-content-bridges.js`) make raw material arrive without retyping, each offering **✍ add as a seed** quietly and permanently dismissibly ("a suggestion you cannot turn off is not a suggestion"; two settings turn the journal and library prompts off altogether):

- a **Journal** entry of type reflection, synchronicity, manifestation, question, dream, life event or memory with **≥ 50 words** — "This feels like something worth writing about." (gratitude and quick notes are not invitations to write an essay);
- a **Library** work whose resonance is *changed me* or *lives in me* — "This changed you. Is there an essay in that?";
- a **Timeline** formative event with something *installed* in it, or ≥ 50 words — "There is writing in this one."

The seed carries the source linked both ways; the entry then shows **"used in *that piece*"** instead of the prompt.

## A6. The piece panel (management, not craft)

Opening a card shows a panel with: title and subtitle; the **stage button** (a chooser with each stage's hint); **Open in the Writing Studio →** (the most prominent control); pin; kind, destination, **brand account** (only if accounts exist), planned date, words wanted; a live words-written line with a bar; **the project it serves** (stored on the entry's own project links, where every other room records one, so the project's page lists the piece without being told about Content; it nudges: "a piece that serves a project gets finished more often than one that serves nothing"); themes; tags; **what sparked it**; **drawn from your own life** (the linker lists Journal / Library / Timeline entries); **quotes pinned to it** (the browser, below); **before it goes out** (once Ready or Published): five ticks — *Read through one last time, Title and subtitle settled, Destination confirmed, A date set for it, The published address written down* — and a link field. **Every box ticked and an address written ⇒ it is Published automatically** ("It is out of your hands now"). Then the draft so far (first 500 characters), the outline (first 12 points), the notes, **work booked for it** (Planning tasks linked to the piece; **＋** books "Write: <title>" in Planning's inbox with the piece's planned date) with total focused hours, and meta (started, last touched, moved to…). Buttons: *give it a shape*, *send to the compost heap* (the raw thought or the first 400 characters, "it can rot down and come back"), *duplicate* (as "… (again)", copying trail and quotes), *archive*, *delete* (with the undo toast).

## A7. Themes

A **fixed vocabulary** rather than free tags, "which is the whole point of them: they only show a pattern if they stay the same from piece to piece". Twelve are seeded (Identity, Creativity, Mastery, Freedom, Japan, Career & Craft, Consciousness, Relationships, Money & Independence, Discipline, Reading & Learning, Storytelling), each with a colour and one line. The **Themes** manager lets you add, rename, recolour, describe and — when nothing uses it — delete; deleting a theme in use tells you how many pieces will lose it. Themes can be linked to values and threads (fields exist: `linkedValueIds`, `linkedThreadIds`).

## A8. Quotes, the Book Vault, and the research drawer

- **Find a quote** (from a piece's panel): two tabs. **The vault** — passages ranked against the piece's theme words and tags; **Your Library** — every quote you kept in a media entry plus each work's *what it installed in me* note (labelled "your words").
- **The Book Vault** (`18-content-vault.js`) is deliberately honest: it holds two kinds of row. A **quotation** is a passage quoted as written; a **paraphrase** is the book's idea in plain words, drawn *without* quotation marks and labelled "the idea, in summary — not a quotation", and the label travels with the pin and into the draft ("— paraphrase of …"). The file explains why: the specification supplied twenty-five passages verbatim and asked for the rest "in the same pattern"; inventing sentences inside quotation marks under a living author's name is something it will not do. Twelve vault themes: identity, mindset, visualization, creativity, mastery, vision, resilience, consciousness, focus, success, relationships, habits.
- In the **Writing Studio's research drawer** two extra shelves appear for the open piece — *from your Library, by theme* and *from the vault* — with **pull into the draft →** (inserts a blockquote with its citation at the cursor) and **pin to the piece**; a context **bar above the desk** shows the piece's kind, stage (changeable without leaving), words, destination and date, with *Back to Content →*.
- The drawer also gathers, as before, entries that share a hashtag or linked value/thread/skill/project with the piece, a search over everything, the compost heap, and the **✂** button (on every entry card in the house) that sends something to a piece.

## A9. The Writing Studio (the desk the pipeline serves)

Not the subject of this document, but the mother page's other half: a project holds a **binder** (folders and documents, each with text, synopsis, notes, status and snapshots); the same tree is read four ways — **editor**, **corkboard** (synopsis cards), **outliner** (metadata columns) and **manuscript** (every descendant stitched into one editable draft). Also: snapshots with diffs, **compile** (choose documents, separator, titles, synopses), collections, a typewriter mode, type settings (Garamond / Lora / Nunito Sans / Plex Mono), a three-panel layout (research drawer · desk · structure board with outline, threads and connections), a streak, and keys (view codes, `N` new document, `⇧N` new folder, `[` `]` fold the panes, `W` typewriter, `C` snapshot, `X` compile, `R` read mode). Pieces are exported as Markdown or other formats from the desk. The **compost heap** (`S.compost`) holds fragments with no home; a fragment can be assigned to a piece or promoted to a seed.

## A10. How the Content Studio connects

| With | How |
|---|---|
| **Journals, Library, Timeline** | bridges → seeds; "drawn from your life" links; "used in …" back-references on the entries |
| **Writing Studio** | a piece *is* a writing entry; the stage/status bridge; the context bar; two drawer shelves |
| **Planning** | *Book it* creates a task linked to the piece; focus minutes logged against the task roll up to the piece |
| **Projects (lists)** | a piece names the project it serves, on its own links |
| **Time tracking** | writing sessions are timed; the Writing Studio streak and history |
| **Knowledge Tree** | `[[writing:Title]]` links a Tree page to a piece; a piece shows "Feeds: …" if it is a leaf of Tree pages |
| **Brand Strategy** | the account field on a piece; the account filter on the calendar; slots link to pieces by id (Part C) |
| **Weekly review** | the "what you read, and what you made of it" block counts pieces published in the period (fixed — see D1) |
| **The house** | a one-line status in the navigation ("12 pieces · 3 out", or "N finished and waiting to go out"); the desk in the main room opens the Shelf |
| **Tutorial** | eight starter pieces spread over the pipeline with real word counts, an inspiration trail, pinned vault quotes and a journal link — deletable like the rest of the starter set; never added on top of writing you already did (it skips if you have more than two pieces) |

---

# Part B — Brand Strategy (`#/content/brand`)

## B1. What it is

*A commonplace book and a strategy book for each account you run.* An **account** is one presence — a handle on one or more platforms — with its own charter, voice and pillars. Brand's job is to make the decisions **across** many posts deliberate: what the account is for, how it sounds, what it posts about and in what proportion, what is planned, and what you decided and later learned. The posts themselves are written in the Writing Studio; Brand holds the **intent** (a brief) and the **calendar** (a slot), never the words.

It is reached from the Content Studio's header (◈ Brand) and has its own tab bar: **Dashboard · Notebook · Inbox (n) · Plans · Calendar · Judgment · Profile · Side by side · Studio-wide**, an account switcher, **＋ Account**, **＋ Capture**, and **Export / Import Brand Strategy**. With no accounts, it asks you to add the first.

## B2. What is stored

- **The frame — `S.brand`** (a meta row): `{v, accounts[], prefs{account, notebook filters, calMonth}}`. Each account: `{id, name, handle, platforms[], status ('active'|'paused'|'retired'), charter{purpose, audience, promise, positioning, never[]}, voice{tone{formalCasual, seriousPlayful, reservedBold: 1–5}, lexiconUse[], lexiconAvoid[], signatureMoves[], visual{colours[], type, imagery}, perPlatform{}}, pillars[{id, name, purpose, targetPct, color}]}`. (An account has no delete; "retired" hides it.)
- **Every note is an entry** in the house's own model: `type:'brand'`, its fields under `extra.brand`. **A quote is a `type:'quote'` entry** with `extra.brand` added, so it *also* appears in your quotes journal, on tag pages and on Today. Text-like fields live where the house expects them (title, body; a quote's author/source in `extra`), the rest in `extra.brand`.
- **Piece links travel as ids.** `migrateBrand()` is idempotent and only fills defaults.

## B3. The filing rule — scope, kind, anchor

> Every note has a **scope** (one or more accounts, or Studio-wide), a **kind** (from a fixed list) and an **anchor** (the charter, pillar, plan or decision it serves; a capture may anchor to its account or to the studio). **A note missing any of the three is in the Inbox**, and the Inbox has a count on every page.

**Kinds** — sixteen, in five groups (adding one is "add a row" to `BRAND_KINDS`):

| Group | Kinds |
|---|---|
| **Capture** | Quote · Observation · Idea · Reference (a link, what it is, why it works) · Competitor note (their account, what they do, what I take, what I avoid) |
| **Strategy** | Charter statement · Voice rule · Pillar note · Hypothesis ("if … then …") |
| **Planning** | Horizon plan · Slot · Brief |
| **Judgment** | Decision · Review · Open question · Metric note |
| **Holding** | Parking lot |

**Anchors** allowed: any note may anchor to a **charter**, a **pillar**, a **plan** or a **decision**; only *capture* kinds (and the parking lot) may also anchor to **the account** or **the studio**. `brandMissing(e)` reports exactly which of kind / scope / anchor is missing, **including an anchor that points at something that no longer exists**. The **Inbox** (`/inbox`) lists unfiled notes with three selects (kind, scope, anchor) and a *File* button; it refuses to file until all three are set ("Still missing: …"). Saving a note that is incomplete says "Kept — it waits in the inbox until it has …".

**Retiring** a note (or a plan, slot) marks it `retired`; the notebook hides retired notes unless you tick "retired too". Nothing is deleted by default.

## B4. Accounts: charter, voice, pillars

The **Profile** tab edits one account (changes save as you leave a field):

- **The account** — name, handle, platforms (comma separated), status.
- **Charter** — *Purpose* (why this account exists), *Audience*, *Promise* (what they get, every time), *Positioning* (what it is, against what else), and **Never** (one per line — "these become the publish checklist").
- **Voice & visual** — three tone sliders you set by hand (Formal–Casual, Serious–Playful, Reserved–Bold, 1–5); words to use and avoid; signature moves; *per platform* ("platform: what changes"); colours (hex, shown as swatches), type, imagery.
- **Pillars** — **three to five**, each a name, a purpose and a **target percentage; the targets must add to 100%**. They are edited as a set and validated on the whole when you press *Save pillars* (messages: "three to five pillars; this one has N", "every pillar needs a name", "the pillar targets add to N%; they must add to 100%"). A running total turns red until it reaches 100.

**Side by side** (the matrix) puts every *active* account in a table — purpose, audience, promise, positioning, the three tone dot-scales, pillars with their shares, platforms, never lists — so "you can see they are actually different." Beneath it, **"Where they blur"** names any two accounts that are **within one step of each other on every tone slider**, or that **share a pillar of the same name**.

## B5. The notebook, captures and tags

**Capture** (`＋ Capture`, or the global "+" menu) opens a form whose fields depend on the kind (for example a Reference asks for link, what it is, why it works), a tags field, and the three filing fields. The **Notebook** lists every note, newest first (up to 400), filtered by search words (over every field), scope, kind, pillar, tag, and "retired too". A quote filed here is also an ordinary Quote entry, as described. The Dashboard's "Lately in the notebook" shows the last five captures for the account.

## B6. Plans: season → 90 days → 30 days → week

Plans nest. **＋ Season / 90 days / 30 days / Week plan** creates a plan anchored to the account's charter (or to its parent plan when made from one) with a default length (**91, 90, 30 or 7 days**) starting today (or at the parent's start). A plan page edits: theme, start and end, objective, the **hypotheses it tests** (checkboxes over the account's hypotheses, with *＋ Hypothesis*), a **target pillar mix** (blank uses each pillar's own target), the **pillar mix** panel, its **slots**, and its **review**.

**Pillar mix** (`brandMix`) — for each pillar: *target* (the plan's override or the pillar's target), *planned* (slots on this plan and the plans under it), *published* (slots with status Published or Reviewed), and *actual* % = that pillar's share **of the published slots** (so with no published slots every actual is 0). It draws target and actual bars and carries an accessible table.

The **Plans** tab lists the whole tree for the account. The **Dashboard** shows "this 30 days": the 30-day plan that covers today.

## B7. Slots and briefs

A **slot** is a planned post: a **date**, an **account**, a **platform**, a **pillar**, an optional **plan**, and a status of its **own** — **Planned → Linked → Published → Reviewed** — which is Brand's and never the Writing Studio's. The status select in the dialog is disabled; it moves only by action:

- **Link a piece…** (pick from your Writing Studio pieces) or **Start in Writing Studio** (calls the Studio's `newWriting()`, sets only the title — the brief's angle, else the slot title — and links it): a Planned slot becomes **Linked**. **Unlink** returns a Linked slot to Planned. If the linked piece was deleted, the slot says "piece missing" and can be unlinked.
- A slot's **brief** is the intent, with no body: *angle, purpose, target audience, pillar, the hypothesis it tests, and ticked notes that bear on it* (any capture note for the account).
- **Mark published** is gated by a checklist: the account's **voice rules** (every non-retired Voice rule note scoped to it) plus every line of its **Never** list; "tick each by hand". Until every item is ticked it says "N items on the checklist not ticked yet". Then it asks for a published-on date and platform and sets **Published**. (The never-list ids include the line's text; editing a line un-ticks it.)
- Once published, **＋ Metric note** (numbers you read off the platform and type in — "Nothing is fetched") and **Mark reviewed**.

The **Calendar** tab shows the month's slots (all of the account's, coloured by pillar and shaped by status) with the same list below.

## B8. Judgment

- **Decisions** — the question; the options weighed (each with *for* and *against*); the choice; why; **what would change my mind**; a **date to look again** (default 30 days out); the scope/anchor; and later the **outcome**. Decisions whose look-again date has passed and that have no outcome wait in **Due for review** (on the dashboard and as a tile that turns warning-coloured).
- **Hypotheses** — "If … then …", with status **open / confirmed / revised / abandoned**. The *loop* is shown on each: hypothesis → the plans that test it → the slots whose briefs name it → the review where it was settled.
- **Reviews** — fixed prompts, written from a plan's page or as a week review. **Week**: what went out, what landed and what did not, what you learned about the audience, what you will do differently. **30 days**: did the objective happen (evidence), target against actual mix and why the gap, what the hypothesis showed, keep/stop/start, which posts cost most and whether worth it. **90 days (and season)**: is the charter still true, which pillar earned its place, what surprised you, did the voice hold or drift, what the next ninety days are for. A review also lets you set each tested hypothesis to confirmed / revised / abandoned.
- **Open questions** — what the account has not yet answered for itself; filed to the account's charter by default; added with **＋ Open question** (or "An open question" from the "+" menu).
- **Metric notes** — dated numbers attached to a slot.

## B9. The other views

- **Dashboard** — account header with the promise as a quotation (or "Write the charter"); tiles for unfiled, planned, linked, published, reviewed and decisions due; a warning line if the pillars are not set (fewer than three, or not 100%); this 30 days with its mix; coming up (next six planned/linked slots); due for review; lately in the notebook.
- **Studio-wide** — one table across accounts (status, unfiled, this month's slots, published this month, decisions due, current 30-day plan), the next two weeks everywhere, decisions due everywhere, studio-wide notes.
- **Export / Import** — `brandExport()` downloads `brand-strategy-<date>.json` (accounts and brand entries only: "piece links travel as ids; no Writing Studio text is ever exported from here"). **Import adds what is missing and keeps what is here**, counting accounts and notes added and "already here" left as they are.

## B10. How Brand connects

- **Writing Studio** — read-only, by id (title and status); plus the one `newWriting()` call.
- **Content Studio** — a Brand account can be set on a piece (`extra.content.accountId`) and filters the calendar; (see D3 for what is and is not linked).
- **Quotes journal** — brand quotes are real quote entries.
- **The "+" menu** — Capture a note, A slot, A decision, An open question.
- **Tutorial** — "The Listening Room": an account with a charter, voice, three pillars (40/35/25), a quote, an observation, an idea, a hypothesis, a voice rule and an open question.

---

# Part C — Where the two meet

1. **A piece ⇄ a slot.** The slot holds the piece's id; the piece does not hold the slot. Opening the slot's piece goes to the desk (`#/writing/<id>`).
2. **A piece ⇄ an account.** `extra.content.accountId` is chosen in the piece panel (drop-down of Brand accounts) and filters the Content calendar. A slot's `accountId` is separate (D3).
3. **The Brand link** in the Content header leads to the Brand tab bar; Brand's header leads back (‹ Content).
4. **Status vocabularies stay apart.** The Content stage (eight), the Writing Studio status (four) and the Brand slot status (four) are three separate things; the slot shows the Writing Studio status of its piece as a faint label.

---

# Part D — Things worth knowing

1. **The weekly review's "published" count was broken and is now fixed.** The review looked for `extra.content.publishedAt`, which nothing writes; the Content Studio writes `publishedOn`. Pieces published in a period were therefore never counted in "what you read, and what you made of it". It now reads `publishedOn` (`src/16-review.js`).
2. **Publishing is two independent acts.** Marking a *piece* Published (Content stage, via the five ticks + address, or by dragging) does not touch any slot; marking a *slot* Published does not touch the piece. The pillar mix counts **slots**, not pieces.
3. **`accountId` on a piece and `accountId` on a slot are separate fields.** Linking a slot to a piece does not set the piece's account, and setting a piece's account does not create or change a slot. The Content calendar filters by the piece's field.
4. **Two checklists.** A piece's "before it goes out" (five fixed ticks) and a slot's publish checklist (the account's voice rules and never list) are different lists with different data.
5. **Stage ≠ status.** A piece in Refining and one in Draft are both "Drafting" to the Writing Studio; changing the Writing Studio status moves a piece to the *first* stage of that status only if its current stage isn't already inside it.
6. **A stage move writes the status; the status doesn't always move the stage.** This is intentional (see A3).
7. **Theme words drive the vault.** Vault ranking uses the *words* of your theme names and tags (longer than three letters), not their ids.
8. **Retire, don't delete (Brand).** Accounts have no delete; notes, plans and slots are retired. Import never overwrites.
9. **Unfiled notes keep counting.** A note whose anchor points to something later retired or removed reappears in the Inbox ("anchor" missing).
10. **Metrics are typed.** Nothing is fetched from any platform; Brand has no connection to the network.
11. **Starter pieces are skipped if you have writing.** The seed only populates an empty (≤ 2 pieces) studio, and everything it makes is deletable.
12. **The vault is not a library of quotations.** Many rows are paraphrases and are labelled as such everywhere they appear.

---

# Part E — Where things are

| You want… | Look in |
|---|---|
| Stages, themes, the piece's content fields, "what's next" | `src/18-content-data.js` |
| The Content page: pipeline, capture, promote, themes | `src/18-content-page.js` |
| The piece panel, trail, checks | `src/18-content-detail.js` |
| Calendar, shelf, numbers | `src/18-content-views.js` |
| Events, keys, drag and drop, column widths | `src/18-content-bind.js` |
| Bridges from Journal / Library / Timeline | `src/18-content-bridges.js` |
| Writing-Studio traffic (context bar, drawer shelves, compost) | `src/18-content-studio.js` |
| Book vault, quote browser, life linker | `src/18-content-vault.js` |
| Starter pieces | `src/19-content-seed.js` |
| The desk (binder, corkboard, outliner, manuscript, compile) | `src/18-writing.js`, `src/18-writingstudio.js` |
| Brand model, kinds, filing rule, export/import | `src/18-content-brand-a-model.js` |
| Accounts, profile, matrix | `src/18-content-brand-b-accounts.js` |
| Plans, slots, briefs, publish checklist | `src/18-content-brand-c-plans.js` |
| Decisions, hypotheses, reviews, metrics | `src/18-content-brand-d-judgment.js` |
| Brand views and routing, notebook, inbox | `src/18-content-brand-e-views.js` |

*Companion docs:* `docs/GUIDE.md` §12–13 (the shorter user-facing chapters), `docs/INNER-LIFE.md`, `docs/STUDIOS.md`, `docs/KNOWLEDGE-TREE.md`.
