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
3. ~~No picture of the tree.~~ **Changed (Part D):** a root now has a read-only **chunk map**. Still no canvas and nothing on it can be dragged; the Learning Studio is where you place things by hand.
4. **No delete.** A page can only be set to *Pruned*. A mistaken page stays until you prune it; there is no way to erase one (except the worked-example pages, which the Settings tutorial removes in one click).
5. **One parent per page, one position per moment.** No page lives in two places; no page can have two current positions.
6. **Saved positions and sealed predictions are permanent.** By design. Experiments have no edit button either (and are not locked, so they can only be removed through the tutorial strip or by clearing data).
7. **No undo button — but earlier versions are kept.** **Changed (Part D):** each time a page's text or its encoding fields change, the previous version is kept (*Earlier versions* under the text) and can be restored *as a new save*. Nothing is rewound or deleted.
8. **No bulk actions.** No multi-select, no "move these five", no merge-two-pages.
9. **Links match exact titles — but a typo gets a suggestion.** **Changed (Part D):** `[[Encodng]]` is still red (and still a gap), but a small **?** offers "Did you mean *Encoding*?" and adds the typo as an alias if you say yes. The page text is never rewritten. Library, Journal and Writing links still match by exact title (case-insensitive) or date.
10. **Renaming doesn't rewrite other pages' text.** Old links keep working only because the old name is kept as an alias.
11. **"Left longest" now includes points.** **Changed (Part D):** it is the last thing the tending card falls back on. A *Dormant* page is still skipped as "left longest" but still resurfaces; only *Pruned* stops that.
12. **The weekly summary is computed when you open Tree Home**, not when the site opens. **Changed (Part D):** the saved past weeks are now shown (*Past weeks*, folded, under *This week* and on the Review page).
13. **Revising now advances the ladder** (when the recall was at least patchy). **Changed (Part D).** The ladder itself is also editable.
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
- **A board starts empty** — on purpose. **Changed (Part D):** a header button, **Bring in the branch's points**, lists the branch's live points with tick-boxes; only the ticked ones become chips.
- **"+ Start without a branch" makes a new untitled board each time.** **Changed (Part D):** boards without a branch are now listed on this screen, so they can be found again. Prefer a real branch.
- **Changed (Part D):** a branch page now has an **Open in Studio** button (and the same in its ⋯ menu). If the branch has no board yet it asks before making one.

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
1. ~~Make groups.~~ **Changed (Part D):** in **Sort** mode, select chips, name the group and give the reason they belong together (required); the group gets a frame on the board.
2. ~~Promote a chip to a page.~~ **Changed (Part D):** *Send to the Tree…* (on a chip's right-click menu, and in **Check** mode) makes a **Stub** page after you confirm its title, kind and home. An arrow becomes a Tree graft only by *Make this a graft* — when both its ends are pages and it has a reason — and a group becomes a chunk only by *Make this a chunk*. Nothing crosses by itself.
3. ~~Import from the Tree.~~ **Changed (Part D):** see *Bring in the branch's points* above.
4. **A source panel / attach a passage** to a chip.
5. **Rename boards** — there are no board names. (Boards without a branch are now listed on the start screen.)
6. **Drag chips into or out of the tray**; **drag arrows**; **resize chips**; **change a chip's colour**; **select, edit or delete an arrow**.
7. **Counterfactual drag** ("what if" zone), **a snapshot viewer/comparer**, **pre-flight card** (setting exists, no screen). (**Changed (Part D):** sessions are now recorded, the clock starts through the house's time tracker, and the weekly strip appears on the Tree's Review page.)
8. **Align / Distribute** (functions exist; no buttons). **Arrange** is the only tidy tool.

**Things that run but don't do what their name says:**
9. ~~Shuffle does nothing.~~ **Changed (Part D):** Shuffle now really scatters the cards, and *Restore* puts them back.
10. ~~Skip doesn't skip.~~ **Changed (Part D):** a skipped question goes to the back of the line.
11. **Teach** records an attempt without checking anything.
12. ~~The "links" counter never changes.~~ **Changed (Part D):** it counts the distinct Tree pages a question and its answer reach through `[[links]]`.
13. **Zoom level isn't saved**; **undo is lost when you leave the board**; the context-menu *Delete* can't be undone.

**Hard limits of the design:**
14. **No touch support was designed in** (no pinch, no long-press; double-click to create may not work on a phone).
15. **Recall matching is spelling-based**, not meaning-based: "car" will not match "automobile".
16. **Questions and answers use browser pop-up prompts**, so they are plain single-line text and not part of the board's look.
17. **Everything is local** to this device unless you use the full Export/backup.

---

## Part C — How the two rooms relate

The Studio is the Tree's "spatial companion": a board belongs to a Tree *branch* and shares the Study Deck and Today. Since Part D they are joined by a bridge that **carries things across only when you say so**: a board can bring in its branch's points; a chip can be sent to the Tree as a stub page; an arrow can be made a graft (with its reason); a group can be made a chunk (with its reason). Each leaves a back-reference, so doing it twice finds the first result and makes nothing new. Editing a chip never changes the page it came from. And the Tree's Export now carries the Studio's boards under a key of their own.

*Where the code is:* Tree — `src/19-tree-a-model.js … 19-tree-g-proof.js`; Studio — `src/19-ls-a-model.js` (data), `19-ls-b-canvas.js` (the board), `19-ls-c-modes.js` (Ask, Shoot, Relate, Chunk, Check, signals), `19-ls-d-recall.js` (Recall), `19-ls-e-page.js` (route, header, mode bar). Test for the board: `smoke-ls-canvas.js`.


---

# Part D — The iCanStudy layer (added)

Everything below was added to turn the Tree from a record of what you believe into an instrument for *encoding* — the method taught by iCanStudy: decide what is important and why, group by reason, ask questions, recall before you look, space and vary the reviews, teach, and look back. The specification it was built from is in the repository history (`Knowledge Tree × iCanStudy — Amendment and Addition Specification`). The rules it keeps throughout: **no AI and no network; nothing is filed, merged or promoted for you; no delete; positions and sealed predictions stay permanent; one parent per page; gaps are prompts and never block a save; nothing on the Tree can be dragged.**

## D1. On every page

- **Why is this important?** Pick *Core / Supporting / Peripheral* (or *Not decided*, which is stored as nothing and shown differently from Peripheral), tick *Part of the trunk of this root*, and write the reason (markdown and `[[links]]` allowed). Marking Core with no reason prompts you; it still saves.
- **How well do I know this?** A level from 1 to 5 with the evidence for it (required). Levels: Facts · Isolated concepts · Relationships · Integrated (*aim for this*) · Novel. Each assessment is added to a history that cannot be edited. Mastery is never worked out from your confidence: they are different things.
- **Collected / Processed.** *Split this page…* (under the text) moves what is written to **Collected** and leaves **Processed** for your own compressed words (150 is the budget — a signal, never a block). Rejoin whenever you like.
- **Questions** (under *What would change my mind?*, which is unchanged): what / why / how related / personal, each red until answered, **amber** once answered, **green** only when the answer is at least 15 words *and* reaches another page by a `[[link]]`. *Suggest four questions* adds four red, editable ones from a template. *Let it go* retires a question (kept, hidden).
- **Challenge questions**: write a hard question now and **seal** it; it cannot be answered until the date you set (at least a day on; two weeks is the suggestion). The seal is enforced in the data layer, not only the form.
- **Chunks** (above *Beneath it*): *Group pages…* — a name, a **required reason**, two or more pages under the same root (two to four is the guide). A page may sit in several chunks and still has one parent; across two roots you are told to use a graft.
- **Earlier versions**: every change to the text or the encoding fields keeps the version before it. *View*, *Compare with now* (word by word), *Restore as a new save*.
- **Mistakes** (⋯ → *Log a mistake*; offered after a review you missed): the question, the kind (misunderstood · working · fundamental gap · right answer by a worse method), why, and **how it will never happen again** (required). It comes back in three days, by a *different* retrieval method.
- Title row: the importance mark, the mastery pill (L1–L5, or L? if not assessed), a trunk mark.
- **Open in Studio** (branches), **See the chunk map** (roots), ⋯ → *Prime this branch*, *Teach it*.

## D2. Reviewing

Opening a page still doesn't count as tending. A review (the tending card, or ⋯ → *Review it now*) is now four steps, and the page is **not in the document** during the first two:

1. **Prime** — only the title and the method for this time (it changes each time and is aimed at the page's level).
2. **Recall** — write everything you can remember. Under five words is turned back; **I remember nothing** is always one click and scores zero.
3. **Reveal** — what you wrote beside what the page says; grade it: *Missed it · Patchy · Had it*. **Only here is a record written** (a review abandoned before this leaves nothing).
4. **Belief** — the old "Do you still hold this?" (skipped for a page with no position).

The ladder moves on the recall: *Had it* one rung out, *Patchy* holds and reschedules, *Missed it* back to the start; *I doubt it now* back to the start; *Revise* moves out one rung when the recall was at least patchy; *Still hold* never moves it twice. The default ladder is **0, 1, 3, 7, 16, 50, 120, 365 days**, editable on Tree Home (*How often things come back*); a bad ladder is refused and the old one kept. A new page is first asked after about three days, as before. A same-day rung waits four hours. Pages on the old ladder keep their due dates and are moved to the nearest new rung once.

**Today's tending** is still one card. The order: a page due for review; a challenge question whose date has come; a mistake to re-test; the oldest inbox item; a question red for a fortnight; a chunk with no reason; a bare branch to prime; and, last, the page left longest (now including points).

## D3. Looking at it

- **Tree Home**: *Past weeks* (folded), the ladder editor, the Mastery tile (share at level 4+ and a bar of the levels), and the Gaps tile with its breakdown on hover.
- **Gaps** now includes *How well it is encoded*: no reason it matters · island (no graft, link or child) · too many loose children · root with no trunk · question left red · stuck at a low level · long prose with no links · never retrieved · a chunk with no reason. Stubs are left out of the first, second and eighth so priming a branch with fifty stubs doesn't raise fifty gaps.
- **Outline → Trunk only** (also on a page's *Beneath it*): shows only the trunk-marked and Core pages, keeping the pages above them as pale connectors and counting what it hides (*+6 more* opens them in place).
- **Map** (nav, or a root's *See the chunk map*): a read-only SVG of one root — parents, grafts (arrows, with an unresolved *contradicts* the most prominent), faint `[[link]]` ties, chunks as labelled boxes, trunk pages heavy, islands dashed-red, colour by mastery / importance / status. A line reports pages, grafts, density (*too few / about right / too many*), islands, trunk and the share at L4+. Above 250 pages it opens on the trunk. *Save as SVG* exports it.
- **Review** (nav): the week's retrievals and how many *methods* (breadth, not volume), what you recalled by level, mastery, questions, mistakes, gaps, the Studio's weekly strip, and the **Kolb form** (experience · reflection · abstraction · experiment) — saved reflections are written to the Journal and kept, not edited. After 17 days it also asks you to look at the learning system itself.
- **How the learning is going** (from Mastery or Review): retention at *about a week* by the level tested (only recalls 5–10 days after the previous one for that page; a cell under 8 observations says *too few to say*), twelve weeks of sparklines, whether encoding is carrying more of the load or you're filling a leaky bucket, and decay slopes. Everything is worked out from your retrievals when you open it; nothing is stored.

## D4. Building a branch, and teaching it

- **Prime this branch** (⋯ on a branch, or the tending card for a bare one): Resources → Keywords (paste one per line; bullets and numbers are stripped; duplicates removed; ones already in the tree are flagged, near matches linked) → Organise (tick, group, give each group its reason) → Questions. The last screen says exactly what it will create — *N* stub points, *M* chunks, *Q* red questions — and **one** confirmation makes them. A group without a reason is skipped and reported. Nothing is answered. This is the only bulk action on the Tree, it only *adds blank stubs*, and there is still no bulk edit, move, status change or delete.
- **Teach it** (⋯ on a root or branch): the **whole** (why does this matter, before any terminology), each **part** (your chunks, else the trunk children, else the children — in an order that changes each session), then the **whole** again. The pages are hidden until the end; a step needs 20 words or a skip. Finishing records one level-4 *teach* retrieval. It does not grade you; you do, against the pages, and may then record a mastery level.

## D5. What is still not there

- No bulk edit, move, status change or delete (priming only *creates* stubs).
- No images or files on pages.
- No dragging on the Tree; the map is drawn by rule and has no saved layout.
- No meaning-based matching in the Studio's Fog recall (it says so now); the Tree's review is self-graded for exactly that reason.
- No sync: one browser, one device, unless you export and import by hand.
- Zoom is still not saved in the Studio, and there is no snapshot viewer there.

*Where the code is:* `src/19-tree-h-ics.js` (schema, versions, weeks, "did you mean", gaps), `19-tree-i-ics-encode.js` (importance, questions, split page, chunks), `19-tree-j-ics-retrieve.js` (ladder, mastery, recall-first review, tending, challenges, mistakes), `19-tree-k-ics-visual.js` (trunk, map, priming, teaching), `19-tree-l-ics-reflect.js` (review, Kolb, metrics), `19-ls-f-bridge.js` (the Studio bridge). Tests: `smoke-tree-ics.js` and `smoke-ls-canvas.js`.
