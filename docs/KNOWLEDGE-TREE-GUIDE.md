# The Knowledge Tree and the Learning Studio — a first-time guide, with what they cannot do

This is written for someone who has never opened either room. It says what you see, what each button does, what to do first, and — as plainly as it can — **what does not work, or does not exist**. Everything here was checked against the code and by driving the real pages with a mouse and keyboard; where something is missing, it says "there is no…" rather than hoping you will find it.

If you want the full rules and the data underneath, the companion is [`KNOWLEDGE-TREE.md`](KNOWLEDGE-TREE.md). This guide is the one to read first.

---

## 0. Read this first: there are two rooms, and "keywords" live in the second

| Room | Where | What it is | Does it have keywords you can drag? |
|---|---|---|---|
| **Knowledge Tree** | sidebar → *Knowledge Tree* (`#/tree`) | A wiki of *pages* arranged as a tree (root → branch → point). Each page can hold a position and how sure you are. | **No.** There are no keywords, no tags and nothing to drag. Pages are text, arranged by "home", not by position on a screen. |
| **Learning Studio** | sidebar → *Learning Studio* (`#/studio`) | A free-form board for one branch. You scatter short **keywords** (called **chips**) on it, question them, tag them, connect them and test yourself from memory. | **Yes** — chips are the keywords. They can be dragged. |

So if you made keywords and could not drag them, you were in the Learning Studio.

**A fix made while writing this guide.** Until now, dragging a chip did nothing: the board redrew every card the instant you pressed on one, which cancelled the drag (the browser reported `setPointerCapture … InvalidStateError`). Dragging works now — one chip or many, with undo/redo and it stays put after a reload. Three more things were repaired in the same pass: connection **arrows were never drawn** (they were wiped the moment they were created); **Space + drag** did not pan; and pressing **`/`** or **`N`** on a board also opened the house's search or add-menu on top of the board's own quick-add. All four are covered by `smoke-ls-canvas.js`. The rest of the limits below are still true.

---

# Part A — The Knowledge Tree (`#/tree`)

## A1. What it is, in a minute

Think of a personal encyclopedia where every entry also records **what you currently believe about it and how sure you are**, and where changing your mind is kept on the record instead of overwritten. The shape is a tree:

- A **root** is one of the great questions ("How does memory work?"). It has no parent.
- A **branch** sits under a root or another branch ("Encoding").
- A **point** is a single claim ("Deep processing beats shallow processing"). It sits under a branch (or a root, or another point).

Nothing is decided for you: the Tree *offers* links, *suggests* what to tend and *counts* what is missing. It never files, merges or deletes anything on its own. It uses no AI; everything is local rules.

## A2. The screen

Along the top of every Tree page is one row of links: **Home · Outline · Inbox · Search · Tensions · Gaps · Proof**, and a **＋ New page** button. (The contextual **＋ Add** button at the top of the page offers *New page* and *Quick capture (Alt+K)*.)

- **Home** — "Today's tending" card (one small thing the Tree asks of you), a "This week" strip, the outline of your tree, and tiles: *in the inbox, open tensions, gaps, sealed predictions, due to resurface*. Export / Import are here.
- **Outline** — the whole tree as a folding list. *Open all*, *Fold all*, *show pruned*.
- **Inbox** — thoughts you captured and haven't placed yet.
- **Search** — across the Tree, Library, Journal and Writing, with filters (room, branch, status, dates).
- **Tensions** — contradictions you have drawn and not yet resolved.
- **Gaps** — what the Tree is missing (counted live).
- **Proof** — sealed predictions, calibration, experiments.

## A3. First steps (do this once, in order)

1. Open **Knowledge Tree**. It says *"Plant a root"*. Click **Plant the first root** (or **＋ New page**).
2. Type a **title** (a question: *How memory works*). While you type, **"Already in the tree: …"** shows near-matches so you don't make a page twice. Leave **Kind** as *Root*. Press **Create**.
3. On that page press **＋ Branch here**; title it *Encoding*. Create.
4. On *Encoding* press **＋ Point here**; title it *Deep processing beats shallow*. Create.
5. On that point press **State a position**, write what you hold, set **How sure (0–100)**, **Add position**.
6. Click **Edit** on any page to write its text, and fill in **What would change my mind?**

You now have a tree, a position and a question. Everything else grows from these.

## A4. A page, section by section

Top to bottom, a page shows:

1. **Breadcrumb** — the path from its root. Each step is a link.
2. **Title row** — a kind mark (◉ root, ◆ branch, • point), a **status badge** (*Stub, Active, Dormant, Pruned*), any **aliases**, and two buttons: **Edit** and **⋯**.
3. **Position** — your current statement and its confidence as a ring; "held since …"; a small chart of how sure you have been over time; a **year-ago note** when you held something different long ago; **Earlier positions** folded underneath; and **State / Revise position**.
4. **The text** — written in simple Markdown. Double-bracket links work (below).
5. **What would change my mind?** — a free text question. Empty shows "Not yet asked."
6. **Beneath it** — child pages, with their status and confidence, and **＋ Branch here / ＋ Point here**. Above 15 points under one page you get a gentle warning.
7. **Leaves** — what this page rests on, from the other rooms (see A8). A point with no leaf shows *"Citation needed"*.
8. **Grafts** — typed, reasoned connections to other pages (A9).
9. **Proof on the page** — predictions and experiments for this page (A12).
10. **What links here** — pages that link to this one.

**The ⋯ menu** holds: *Add an alias · Graft to another page · Seal a prediction · Record an experiment · Review it now · Mark stub / dormant / pruned* (whichever statuses it isn't).

### Writing: links, red links, aliases

- `[[Page title]]` links to a page; `[[Page|shown as]]` changes the words shown; `[[library:Title]]`, `[[journal:2025-03-01]]`, `[[writing:Title]]` point into those rooms. Typing `[[` in a text box offers an autocomplete list.
- A link to a page that doesn't exist is a **red link**. Click it to start that page. Red links are counted as a *gap* until the page is written.
- Renaming a page keeps its **old name working as an alias**, so links written earlier still resolve. You can add other names yourself (*⋯ → Add an alias*).
- Links are rebuilt from a page's text **each time that page is saved**.

## A5. Positions: what you hold and how sure you are

A **position** is a statement plus a number from 0 to 100 and today's date. **Revising** adds a new one; the old stays, folded under *Earlier positions*. **A saved position cannot be edited or deleted** — there is deliberately no edit button. A typo is fixed by adding a corrected position. (This is enforced by a guard in the saving code, not only by the interface: if anything tried to change one, it is put back with a message.)

## A6. Status and "pruning"

Each page is *Stub* (started), *Active*, *Dormant* (resting) or *Pruned* (set aside). **There is no delete.** Pruning is the strongest thing you can do to a page: it stops resurfacing and hides it from the outline unless you tick *show pruned*, but the page and its history remain.

## A7. Moving a page

You change a page's parent with **Edit → Home in the tree** (a drop-down listing valid parents) and its kind with **Kind**. **There is no dragging** — not in the outline, not anywhere. A page has exactly one parent. A point cannot be saved without a home; a branch must be under a root or branch.

## A8. Leaves: tying a page to your other rooms

**＋ Attach** under *Leaves* lets you pick an entry from the **Library** (finished works), **Journal** or **Writing** and attach it, with an optional note. The Tree keeps a *pointer*, not a copy: if the entry is deleted in its room, the leaf shows "the entry is gone". Detach with ×. Also:

- Finishing a Library work asks *"What point did you take from this, and where does it belong?"* (you can skip).
- Saving a Journal entry that **mentions a page's name** (whole-word, names of 4+ letters) offers *Attach as a leaf* / *Not this*. Nothing is attached unasked.

## A9. Grafts, tensions and gaps — the reasoning layer

A **graft** joins two pages, in a direction, with a **kind** and a **required reason**: *supports, contradicts, extends, echoes, raises*. Make one with **＋ Graft** (or ⋯ → *Graft to another page*): choose the kind, search for the other page, write *Why*. Each graft shows on both pages; × removes it (with a confirmation, and its reason goes with it).

- A **tension** is a `contradicts` graft that hasn't been resolved. *Tensions* lists them; **Mark resolved…** asks *how*, and keeps it under *Resolved*. Resolving never deletes.
- **Gaps** (counted live) are: red links; points with no leaf; branches with no position; positions with no "what would change my mind?"; branches where every graft *supports* and none *contradicts*. They are prompts, never errors.

## A10. Getting things in

- **Alt+K from any room** opens *Into the tree*: type a thought, **Ctrl/⌘+Enter** to keep it. It waits in the **Inbox**.
- In the Inbox each item can be made into a page (*Make it a page*), appended to an existing page (*Add to a page*), or dropped (*Let it go*).
- The Library and Journal prompts above also feed it.

## A11. Tending: how the Tree asks for attention

- **Today's tending card** (on Tree Home, and a line on Today) shows one thing, in this order: a page **due to resurface** → the **oldest inbox item** → the **branch left longest**.
- **Resurfacing** asks *"Do you still hold this?"* on a ladder of **3, 14, 61, 183, 365 days**. *Still hold* moves it one rung out; *Doubt* sends it back to 3 days; *Revise* writes a new position and keeps the rung. Opening a page does not count as tending it — only doing something does.
- *⋯ → Review it now* asks the same question whenever you like.

## A12. Proof: what paper can't do

- **Seal a prediction** — a statement, a confidence and a "resolve by" date, fingerprinted (SHA-256) so you can't quietly rewrite it. It can be resolved **once**, true or false. Sealed predictions cannot be edited or deleted.
- **Record an experiment** — trials, hits, the chance rate; the page shows the exact one-sided binomial p-value.
- **Calibration** (on *Proof*) — once predictions resolve, a Brier score and a calibration reading appear.

## A13. Finding, exporting, backing up

- **Search** — filters by room, branch, status and dates. Snippets show your raw text, so Markdown marks (`**bold**`, `[[links]]`) appear as typed.
- **Export / Import** (Tree Home) — a JSON file of the Tree's own records. Import **adds** what is missing and never overwrites what is there. The Tree has its own export, but it also travels in the ordinary full backup. Home nudges you if the last export was over 30 days ago.
- Everything is on this device; nothing is sent anywhere.

## A14. What the Knowledge Tree cannot do (verified)

1. **No dragging, anywhere.** Not pages, not outline rows, not between parents.
2. **No keywords, tags or labels.** Pages have titles, kind, status, aliases, text. Search finds words in text and titles only.
3. **No picture of the tree.** There is only an indented text outline; no map, no graph view, no canvas. (The Learning Studio is the visual one, and it is separate.)
4. **No delete.** A page can only be set to *Pruned*. A mistaken page stays until you prune it; there is no way to erase one (except the worked-example pages, which the Settings tutorial removes in one click).
5. **One parent per page, one position per moment.** No page lives in two places; no page can have two current positions.
6. **Saved positions and sealed predictions are permanent.** By design. Experiments have no edit button either (and are not locked, so they can only be removed through the tutorial strip or by clearing data).
7. **No undo.** There is no undo/redo for edits; the history that exists is *positions* and *resolved tensions*, not your page text. A page's text is simply replaced when you save; earlier versions of the *text* are not kept.
8. **No bulk actions.** No multi-select, no "move these five", no merge-two-pages.
9. **Links match exact titles.** `[[Encodng]]` is a red link; there is no fuzzy matching. Library, Journal and Writing links match by exact title (case-insensitive) or date.
10. **Renaming doesn't rewrite other pages' text.** Old links keep working only because the old name is kept as an alias.
11. **Points only come back through their review ladder.** The "left longest" card picks roots and branches, never points. A *Dormant* page is skipped as "left longest" but still resurfaces; only *Pruned* stops that.
12. **The weekly summary is computed when you open Tree Home**, not when the site opens; the saved past weeks are stored but nothing displays them yet.
13. **Revising does not advance the ladder** (only *Still hold* does).
14. **Images and files cannot be attached to pages.** Text and links only.
15. **Not shared and not synced** — one browser, one device, unless you export/import by hand.

---

# Part B — The Learning Studio (`#/studio`)

## B1. What it is meant to be

A board for **one branch of your Tree**, for turning reading into memory by an eight-step cycle: **Harvest → Sort → Ask → Shoot → Chunk → Relate → Recall → Check**. The rule it is built on is: *remove mechanical friction, keep the mental effort* — the board does the clerical work, you do the thinking.

This part describes what it actually does today. Several of the eight steps are only partly built; Section B9 says exactly which.

## B2. Getting in

1. Sidebar → **Learning Studio**.
2. You see **"Choose a branch to open in the Studio"** and a button per **branch** in your Tree, plus **+ Start without a branch**.
3. Pick one. A board is made for that branch the first time (one board per branch) and reopened after that.

**Limits right at the door:**
- **If your Tree has no branches yet, you cannot use the Studio at all.** The screen just says *"No branches in your Knowledge Tree yet. Open Tree →"* — and the *Start without a branch* button is not shown in that case. Make a root and a branch first (A3).
- The list shows **branches only** (not roots, not points).
- **A board starts empty.** Opening a branch does **not** bring in its points or text as cards; chips are separate from Tree pages.
- **"+ Start without a branch" makes a new untitled board each time and there is no list of them afterwards** — you can only get back to one by its address (or browser Back/History). Prefer a real branch.
- The Tree's branch pages do **not** have an "Open in Studio" button (the function exists in the code but nothing calls it). The only way in is the sidebar.

## B3. The screen

- **Header**: the branch's name and four buttons — **◈ Assist / Lean / Bare** (the "scaffold level", click to cycle), **Snapshot**, **Fit**, **Arrange**.
- **Mode bar**: eight buttons, **1 Harvest · 2 Sort · 3 Ask · 4 Shoot · 5 Chunk · 6 Relate · 7 Recall · 8 Check**. Press the number keys to switch.
- **Signal bar** (only at Assist/Lean): small advisory messages with **?** (why) and **×** (dismiss for today).
- **The board** (a pannable, zoomable canvas) with a **tray** docked along it, and a **side panel** on the right whose contents depend on the mode.

## B4. Making and moving keywords (chips)

A **chip** is a short card of text (160 px wide, text wraps). It is meant for a keyword or short phrase.

**Create**
- **Double-click empty board** → a text box appears there. Type. **Enter** keeps it and opens the next box below; **Tab** keeps it and opens the next beside it; **Esc** keeps it and closes. An empty box makes nothing.
- **`N`** — new chip at the centre of the view. **`/`** — a small bar: type and press **Enter** to drop the chip in the middle of the view.
- **Paste** (Ctrl/⌘+V on the board): one line opens the editor with it; **several lines** asks *"Create N chips?"* and scatters them in rows of five.
- **Alt+K** (on a board) asks for text and puts it in the **tray** rather than on the board.

**Edit** — double-click a chip, or select it and press **Enter** / **F2**, or right-click → *Edit text*. Plain text only.

**Select** — click a chip; **Shift+click** adds to the selection; **drag a lasso** on empty board (a chip is caught if its *top-left corner* is inside the box); **Ctrl/⌘+A** all.

**Move** — **drag a chip** (or a whole selection together). **Arrow keys** nudge selected chips 1 px (10 px with Shift). **Ctrl/⌘+Z** undoes and **Ctrl/⌘+Shift+Z** redoes moves and deletes **for as long as you stay on the board** (the history is cleared when you leave).

**Other**
- **Ctrl/⌘+D** duplicates the selected chips (offset by 20 px).
- **Delete / Backspace** deletes the selected chips at once (no confirmation; undoable with Ctrl/⌘+Z while you stay). Right-click → *Delete* also works but has no undo.
- Right-click a chip → **Edit text / Move to tray / Delete**.

**Get around**
- **Pan**: hold **Space** and drag empty board, or drag with the **middle mouse button**. There is no scroll-bar and no two-finger pan.
- **Zoom**: **Ctrl/⌘ + mouse wheel** (at the pointer), or **+ / −**. **Shift+0** = 100%. **`0`** = fit everything on screen (**Fit** button does the same). There is no pinch-zoom.
- **Arrange** lays every chip out in a grid of 5 columns (184 px apart), in reading order — it ignores meaning.

**What is remembered**: chips, their positions, tags and questions are saved as you go and survive a reload. **The zoom level is not saved** (position of the view is saved when you pan or Fit).

## B5. The tray

Chips marked "in tray" are held off the board. Put one there with *right-click → Move to tray* or **Alt+K**. **Click an item in the tray** to place it on the board at a fixed spot (80, 80) — not at the pointer. **You cannot drag a chip into or out of the tray** (the design said you could; it isn't built). The tray shares one strip along the board and can cover the bottom edge of it.

## B6. The eight modes, one by one

**1 Harvest** — *Add keywords and phrases from your source.* In practice this is just the plain board: double-click to make chips. **There is no source panel** and no way to attach a quote or page to a chip (the field exists in the data but nothing writes it). The "Show source passage" box in Shoot mode therefore never appears.

**2 Sort** — *Drag chips into named groups.* **There is no way to make a group.** The side panel is empty and no button, key or menu creates, names or fills a group. You can still *position* chips into clusters by hand; the Studio just doesn't know they're a cluster. (Group frames, group labels, "group has too many members" signals and group-based recall are all built but have nothing to work on.)

**3 Ask** — select a chip; the panel shows **Importance: ● ● ●** (red/amber/green) and four question kinds — **What / Why / How / Personal** — each with **+**. Pressing **+** opens a plain browser prompt for the question text. Each question has an **Answer** button (another browser prompt). Questions are listed under the chip; the answer shows as grey text (first 120 characters). A "links" counter exists but never rises.

**4 Shoot** — select a chip with open questions; the panel shows the first open question and a box *"Answer from memory first…"*; **Submit** saves it. **Skip** is shown when there is more than one question, but it simply redraws the same first question (so it doesn't skip). There's no reading cap and no source to open.

**5 Chunk** — *Tag by importance.* The panel lists every chip with **● ● ●** (Core = green, Supporting = amber, Peripheral = red) and **○** to clear. Once tagged, each row gets a **reason** box; chips with the same reason text can be highlighted ("Highlight shared reasons"). The tag also shows as a coloured edge on the chip. (This is the same tag you can set in Ask mode.)

**6 Relate** — click one chip, then another. A box asks for a **type** (1 Supports, 2 Contradicts, 3 Extends, 4 Echoes, 5 Raises — the number keys work) and a **required reason**. **Connect** draws an arrow from the first to the second (rose-coloured for *contradicts*, dashed for *echoes*). Esc cancels. **Limits:** you can't select, edit or delete an arrow once made; arrows join chip centres in straight lines and ignore what's between; and **these connections live only on the board — they do not appear in the Knowledge Tree** (they would become Tree grafts only if both chips were promoted to Tree pages, and there is no "promote" button).

**7 Recall** — *Hide the board and rebuild it from memory.* Four exercises, plus *Session summary…*:
- **Fog** (needs a Snapshot first) — a fog covers the board; you type what you remember, one per line; **Reveal & Compare** matches your lines to the chips (a line counts as a match if it is close enough in spelling, about two-thirds alike; each line matches one chip). It shows ✓ matched / ✗ missed / + extra, paints the board green/red, and offers **Save attempt**, **Missed → Study Deck**, **Add review task** (a task in your Inbox), **Try again**, **Done**.
- **Ghost** — chips are dimmed (position only / + group labels / + first letters); you type the answers; same comparison and buttons (no review-task button).
- **Shuffle** — *meant* to scatter the chips so you regroup them from memory. **It does nothing visible today** (the scatter call is broken), and its "compare" always reports every chip as a "correct group". Don't rely on it.
- **Teach** — a full-screen stepper showing one chip at a time with Prev/Next (arrow keys; Esc exits). It records a "teach" attempt (which counts as a recall for the Today reminder) but checks nothing.
- **Session summary…** — counts chips/groups/recalls and a **Kolb reflection** box. **Save to journal** writes the note into your Reflections journal — **but only if the board has a recorded session, and sessions are never recorded**, so in practice the note isn't saved to the session (the journal entry is written if you typed one).

**8 Check** — counts core/supporting/peripheral/untagged chips and answered questions; **Send green + amber to Study Deck** (puts each chip's text into the Study Deck *inbox* as a suggested card; duplicates by text are skipped), a **→ Deck** button per chip, and **Commit layout snapshot**.

**Snapshot** (header, or Check) — saves the current positions as a permanent, frozen record (it can never be edited or deleted). Fog and Ghost compare against the **latest** snapshot. A snapshot stores layout only (it needs the chips to still exist), and there is no screen to list, view or compare snapshots.

## B7. Scaffold level and signals

**Assist** (default) shows advice and highlights; **Lean** shows advice only; **Bare** is silent. Today the signals that can actually fire are: a chip longer than 12 words ("chips work best as keywords or short phrases"), and more than 25 chips that aren't in any group. The two group-based signals (a group over 4 members, a group with no reason) can't fire because groups can't be made. Dismissals last for the day.

## B8. How the Studio connects to the rest of the house

- **Today** shows a *Recall due* link for any board that has a snapshot but no recall in the last 3 days, and a count of chips waiting in a tray.
- A **duty** "Learning Studio recall" (on by default) is raised whenever you have **no recall in the last three days — even if you have no board at all**, so it can nag people who never use the Studio. You can switch it off in Settings → Duties.
- **Study Deck**: Check and the recall screens feed the Deck's inbox by *suggesting* cards; nothing is added to a deck without your acceptance.
- **Time tracking**: the Studio is *meant* to start the house clock as "Studio: <branch>" when you open a board. **It does not** — the function it calls doesn't exist, so no time is recorded. Start the clock yourself.
- **Backup**: boards, chips, placements, questions, snapshots and recalls are part of the normal full backup. **They are not in the Knowledge Tree's own Export** (that file holds only Tree pages).
- **Weekly review**: a Learning Studio strip was written but isn't shown anywhere.

## B9. What the Learning Studio cannot do (verified), in one list

**Missing features (built as data or code, but no way to use them):**
1. **Make groups** — and therefore no group frames, group signals, group-based Ghost levels or shuffle regrouping.
2. **Promote a chip to a Tree page** — so chips never become pages, and Relate arrows never become Tree grafts. (The cards for Tree pages exist in the code, but nothing puts a Tree page on a board.)
3. **Import from the Tree** — a board never starts with the branch's pages.
4. **A source panel / attach a passage** to a chip.
5. **Rename or list boards** — no board names; no list of boards other than one-per-branch; detached boards can't be found again.
6. **Drag chips into or out of the tray**; **drag arrows**; **resize chips**; **change a chip's colour**; **select, edit or delete an arrow**.
7. **Counterfactual drag** ("what if" zone), **session timer**, **session records**, **weekly-review strip**, **a snapshot viewer/comparer**, **pre-flight card** (setting exists, no screen).
8. **Align / Distribute** (functions exist; no buttons). **Arrange** is the only tidy tool.

**Things that run but don't do what their name says:**
9. **Shuffle** recall does nothing visible and always scores "all correct".
10. **Skip** in Shoot doesn't skip.
11. **Teach** records an attempt without checking anything.
12. **"Links" counter** in Ask never changes.
13. **Zoom level isn't saved**; **undo is lost when you leave the board**; the context-menu *Delete* can't be undone.

**Hard limits of the design:**
14. **No touch support was designed in** (no pinch, no long-press; double-click to create may not work on a phone).
15. **Recall matching is spelling-based**, not meaning-based: "car" will not match "automobile".
16. **Questions and answers use browser pop-up prompts**, so they are plain single-line text and not part of the board's look.
17. **Everything is local** to this device unless you use the full Export/backup.

---

## Part C — How the two rooms relate

The Studio is called the Tree's "spatial companion", but they are only loosely joined today: a board belongs to a Tree *branch* (by its id and title) and shares the Study Deck and Today. Nothing flows automatically between them: Tree pages don't appear on boards, board chips don't become Tree pages, and Relate arrows don't become grafts. If you want something in both, write it in both.

*Where the code is:* Tree — `src/19-tree-a-model.js … 19-tree-g-proof.js`; Studio — `src/19-ls-a-model.js` (data), `19-ls-b-canvas.js` (the board), `19-ls-c-modes.js` (Ask, Shoot, Relate, Chunk, Check, signals), `19-ls-d-recall.js` (Recall), `19-ls-e-page.js` (route, header, mode bar). Test for the board: `smoke-ls-canvas.js`.
