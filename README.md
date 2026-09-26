# Life Instrument

A single-file personal website: a structured container for a life examined and a life deliberately created.

The governing metaphor is a house still being built. Each section is a room; a unified entry model is the hallway that lets one entry live in many rooms at once.

## Running it

Open `index.html` in a browser. That is the whole deployment; no server is needed.

- The only external dependency at runtime is Google Fonts (EB Garamond, Nunito Sans, Noto Serif SC, Lora, IBM Plex Mono). Without a network connection the site falls back to system serif and sans faces.

## Building it

`index.html` is generated from the parts in `src/` by `build.js`:

```
npm install     # installs dexie; optional, see below
npm run build   # writes index.html
```

If `dexie` is installed, the build inlines its UMD bundle so the database layer runs on real Dexie. If it is not, `src/06-db.js` falls back to a small built-in class with the same API subset over raw IndexedDB. Either way the output is one self-contained file.

`npm start` serves the folder on port 8080, which is what you want if you are testing the service worker — a `file://` page cannot register one.

The parts in `src/` are concatenated **alphabetically** into a single `<script>`, so function declarations are visible across files but a top-level `const` is not readable before the file that declares it. `src/02-css-sections.html` holds the stylesheet and must be edited before its closing `</style>`; the build asserts nothing has strayed past it. `src/20-modal-init.js` carries the script's closing tag, so `node --check` on that one file always complains.

## Installing it

`manifest.webmanifest` and `sw.js` sit beside `index.html`, so the house can be installed to a home screen and opened without a network — everything it needs is already in the one file. `.github/workflows/pages.yml` builds and publishes it to GitHub Pages on every push to the default branch. Data belongs to the origin it was written on: moving between `file://`, a local server and the published site means exporting a backup and importing it on the other side.

## Data

All data lives in an IndexedDB database named `lifeinstrument-db`, declared in `src/06-db.js` with one object store per data structure. Two lists in that file decide where a new piece of state lives: `ARRAY_STORES` (`stages`, `threads`, `tensions`, `values`, `valueSnapshots`, `visions`, `skills`, `projects`, `nods`, `ideas`, `habits`, `entries`, `tasks`, `people`, `events`, `interactions`, `accounts`, `txns`, `budgets`, `finGoals`, `chapters`, `turns`, `threadsN`, `mediaQueue`, `mediaLists`, `mediaRecs`, `compost`, `incomeStreams`, `spendCategories` and a few more) for the collections, and `META_KEYS` (`settings`, `planning`, `content`, `rehearsal`, `stillness`, `position`, `dailyRhythm`, `reviews`, `reviewEntries`, `finance`, `plans` and the rest) for the single objects that live in `meta`. State registered in neither list is not saved. Photos are resized on upload and stored inline as base64. On first load the app migrates any data found under the old `localStorage` key or the interim single-blob database, then removes the old copy.

Three small preferences stay in `localStorage`: `soundEnabled`, `ambientEnabled`, and `lastBackupDate`.

### Backups

Settings has **Export backup**, which downloads `backup-YYYY-MM-DD.json` in the shape `{ version: 1, exportedAt, data: { <store>: [rows] } }`, and **Import backup**, which validates the file, asks for confirmation, then clears every store and reloads from the file. Older whole-state exports are accepted too. If the last export was more than 14 days ago, a banner at the top of each page reminds you.

To restore your data on a new device: open this website in the same browser, go to Settings, click Import Backup, and select your exported .json file.

## Rooms

The sidebar opens with the two rooms you are in every day — **Today** and **Planning** — unlabelled and not foldable. Below them, two zones grouped by what each is for:

- **Create** — what you are making: Content Studio, Projects, Repertoire, Jazz Studio, Songwriting Studio, Japanese Studio
- **Identity** — who you are, and have been: the Identity room (People, Values, Skill Tree and Finance as four tabs), the Lived Record, the Knowledge Tree, the Study Deck

Settings sits in the buttons at the top right; the Import Station is a section inside it. Zones collapse, the sidebar collapses to icons, and both states persist. On narrow screens a bottom bar shows the most-used rooms and a More button opens the full grouped menu. Pages can be moved between zones by drag-and-drop in Settings.

Four rooms no longer have a door of their own, because they stopped being separate places — the **Timeline**, the **Library** and the **Review** are views of the Lived Record, and the **writing desk** is reached from a piece in the Content Studio. Their addresses all still answer, because a great deal links to them. The **Compass** was retired the same way: the charts it held now open as the Lived Record's Review tab, next to the writing about them, and `#/compass` redirects there.

| Route | Room |
|---|---|
| `#/today` | The whole day, bracketed by its two ends — *I woke up at* under the date (blank until you fill it in), *I went to sleep at* at the foot. Between them, in order: the focus timer, the plan made last night, today's tasks, the check-in, the Morning Theatre, stillness and divination, habits, and any review whose cycle closes tonight. Every section folds and remembers whether it was open; a sticky index at the top jumps to any of them |
| `#/planning` | Where work is moved rather than reflected on. Folders and lists in the sidebar, five views over whichever is selected — Matrix (Eisenhower, and the default), List, Calendar, Board, Timeline — milestones on a dated timeline above every one of them, subtasks on the row itself, drag to reorder anywhere, and Habits and Statistics as rooms beside Tasks. A **milestone is also a lens**: a task can name the date it is being done towards, pressing that date on the strip narrows every view to its work (pressing it again lets go), and opening the milestone lists that work with what is left of it |
| `#/journals` | The **Lived Record**, in four views: `entries` (synchronicity, manifestation, reflections, gratitude, dreams, quotes, open questions, divination, intuition, sealed letters and decisions), `timeline` (life stages on a spine, felt-time toggle, thread ribbons, tensions), `library` (books, films, series, albums, talks — status, rating, passages, and prompts that ask what a work changed rather than what it scored) and `review` (the charts the Compass used to hold, and the periodic reviews under them) |
| `#/content` | The **Content Studio**: pieces from seed to published, in four views — Pipeline (columns you can widen by dragging), Calendar, Shelf and Numbers. A piece opens onto the writing desk, with source hashtags pulling the entries that carry them in beside the page |
| `#/content/brand` | **Brand Strategy**, a view of the Content Studio: a commonplace book and strategy book for each account you run. Accounts carry a charter (purpose, audience, promise, positioning, a *never* list), a voice (three hand-set tone sliders, words to use and avoid, signature moves, visual notes) and three to five pillars whose targets add to 100%. Every note is an entry with a scope, a kind and an anchor, or it waits in the Inbox; plans nest season → 90 days → 30 days → week, with slots (Planned → Linked → Published → Reviewed) that link to Writing Studio pieces by id and never write to them. Decisions, hypotheses and fixed-prompt reviews; a side-by-side matrix of accounts; export and import of Brand alone |
| `#/projects` | Ideation mode — sparks and open questions, two columns of equal width — and Tracking mode with three views: cards, a kanban board, and a Gantt of phases. Each project has phases with task checklists, resources, linked skills, notes, nod heatmaps, income streams and an idea inbox. Future Projects sit in the inventory beside the live ones. **A project is also a Planning list**: the list has the project's own id and sits in the Projects folder, its sections are the phases, and the phase tasks are ordinary Planning tasks — one task, shown in both places, with do dates, reminders and time categories. Renaming either renames both; any list can be made a project from its settings. The move from the old shape kept a copy of every project first and left the old task arrays untouched |
| `#/skills` | What you are practising now, milestones inside a window you choose, then the living tree: a sakura, grown rather than drawn — the skills are points of light in the canopy and the wood finds its own way to them, so the branching is what the growth did rather than an arc divided by the number of categories. In grass with orchids growing at its foot. Every living twig is fully leaved whatever level it is on; progress is the blossom, from a single bud to a covered twig at mastery. Customisable levels (labels, descriptions, criteria as checkboxes, typed resources, estimated time), multi-target milestones on a timeline, atrophy, cross-mappings. A skill can also be broken into **abilities** — reading and speaking, technique and repertoire — each with a rubric of its own, because they do not move together; the skill's reading is then their average, the one furthest behind is named, and the blossom on the tree follows the roll-up |
| `#/values` | Four figures, one table that is priority, congruence, gap and trend at once, and the radar over time. Each value carries a tagline and opens onto what you embody, what a hundred-percent day looks like, what moves you and what counterfeits it, with the evidence feed at the top |
| `#/identity` | **Identity**: People, Values, the Skill Tree and Finance as four tabs of one room, one drawn at a time and each exactly the room it was. The old addresses (`#/people/<id>`, `#/values`, `#/value/<id>`, `#/skills/<id>`, `#/finance`) still answer and open the right tab, without leaving a step in the history |
| `#/people` | A relationship garden: concentric circles you can drag faces between, a contact cadence per person and who has drifted past it, interactions logged by kind, birthdays and follow-ups, and everything you have written about them |
| `#/finance` | Not a ledger: the ways you make money (each active or passive, with the arithmetic that kind deserves — effective rate, hours to target and the ceiling those hours impose, or yield on capital, payback and money per upkeep hour), substreams under a stream, the gap against a life-cost scenario, what share of the life keeps running when you stop, runway, and life-cost scenarios as columns you can compare side by side |
| `#/tag/:name` | Every entry carrying one hashtag |
| `#/stage/:id` | Stage detail: versioned narrative, sub-stages (each printed on its own uploaded images), formative events, retrospective values, soundtrack, artifacts, letters |
| `#/settings` | Theme, ambient sound, felt time, landing page, sidebar zones, the Import Station, export/import/clear |
| `#/study` | The **Study Deck**, built to Anki's shape so a deck can go back and forth: notes and note types (Basic, reversed, optional reversed, type-in, Cloze, Image Occlusion), cards per template, nested decks with option presets, and an add-only review log. FSRS schedules by default (the reference ts-fsrs, inlined), with SM-2 on request; the queue follows Anki's order and limits. Cards are drawn in a sandboxed frame, and a note type's own JavaScript is off unless you turn it on. `add`, `browse` (Anki's search syntax, bulk edits, find and replace), `stats` (every graph with its numbers, true retention), `import` (.apkg and .colpkg from any Anki version, CSV, JSON) and `tools` (postpone, advance, flatten, load balance, easy days, a break, siblings, rescheduling, an FSRS optimiser fitted to your reviews, a simulator) — every tool previews its effect and can be undone |
| `#/score` | **Repertoire**: your scores, engraved from MusicXML, with sections, pins, a metronome, a player that can leave your part out, and **Study** — the harmony, cadences and form of the piece, worked out here from its notes. See *Score Study* below |
| `#/tree` | The **Knowledge Tree**: a personal wiki for a lifelong inquiry. Every page has one home (root → branch → point), a position held at a stated confidence, and the question that would change your mind. See *Knowledge Tree* below |

## Knowledge Tree

A wiki that grows as a tree. Every page has one parent — a **root** (one of the great questions), a **branch** under it, a **point** under that — and a point cannot be saved without one. Links in the text are for getting about; **grafts** are for reasoning. Library, Journal and Writing entries are never copied in: the Tree keeps references to them, and each shows a *Feeds:* line in its own room.

**Links**

| Write | Goes to |
|---|---|
| `[[Title]]` | a page — blue if it exists (old titles and aliases resolve), red if not; a red link starts a new stub with the title filled in |
| `[[Title\|shown as]]` | the same page, with other words on it |
| `[[library:Title]]` | a work in the Library |
| `[[journal:2025-03-01]]` | what the Journal holds for that day |
| `[[writing:Title]]` | a piece in the Writing Studio |

Typing `[[` offers matching titles and aliases, so a page is found before it is made twice. Renaming a page keeps the old title as an alias. *What links here* is read from the links table, which is rebuilt from a page's text each time it is saved.

**Grafts** join two pages with a kind and a reason (the reason is required): *supports*, *contradicts*, *extends*, *echoes* (the same shape somewhere else), *raises* (opens a question). Open contradictions are listed under **Tensions**, where each can be marked resolved with a note on how. **Gaps** lists red links, points with no leaf (citation needed), branches with no position, positions with no open question, and branches where every graft agrees.

**Add-only records.** A position (what you hold, and how sure, 0–100) is never edited: *Revise position* adds a new one and the old stays on the record, drawn with the rest as a line of confidence over time. A **sealed prediction** is hashed with SHA-256 when it is saved (crypto.subtle where the browser has it, otherwise a built-in implementation that gives the same digest) and cannot change afterwards; it is resolved true or false once. Both are enforced in code: the rows are frozen, there is no function that edits or deletes them, and the save refuses to rewrite or drop one and puts it back.

**Tending.** One card a day: a page due to resurface (3 days, 2 weeks, 2 months, 6 months, a year — *still hold*, *revise* or *doubt*), else the oldest capture in the inbox, else the branch left untended longest. Now and then a page shows what you believed a year ago beside what you hold now. **Experiments** record trials, hits and the chance rate, and show the hit rate, the misses and the exact one-sided binomial p-value. **Proof** shows calibration: the Brier score and how often you were right at each level of confidence. Each week's growth (new pages, red links turned blue, revised positions, pruned branches, open tensions) is worked out when the site opens.

**Backup.** The whole-database export carries every Tree store; the Tree can also be exported and imported on its own (an import adds what is missing and never overwrites). The Tree's home warns gently when the last export is more than thirty days old.

**Keys.** `Alt+K` anywhere (outside a text field): quick capture into the Tree's inbox. `Ctrl/⌘+Enter` keeps the capture. In a Tree text box, `[[` opens the page list; `↑ ↓` move, `Enter` or `Tab` completes, `Esc` closes.

## Score Study

Study is a mode of a score in Repertoire, not a room of its own: open a score and press **◈ study** in its head. The panel beside the score replaces the section list while it is on, and a layer is drawn on the engraving itself — Roman numerals under each system, the key where it changes, cadence flags above, phrase brackets, and your notes on the notes. Everything is worked out in the browser, from rules; nothing is sent anywhere and no model is involved.

**What it reads.** Partwise MusicXML, the same file the score was engraved from. It checks first that every voice fills every bar, and lists the bars where one does not.

**Automatic, then proposed, then yours.** *Analyse* runs the first pass in a Web Worker (falling back to the page if the browser has none):

- **Keys** — Krumhansl–Schmuckler correlation per bar against a profile you choose (Krumhansl–Kessler, Temperley, Aarden–Essen, Bellman–Budge), smoothed with a Viterbi pass whose modulation penalty you set. Each key span says how sure it is, gives the runner-up, and warns when the runner-up is the dominant — the classic confusion.
- **Chords** — template matching on the pitch classes sounding in each harmonic window, spelled from the key; Roman numerals with inversions, applied dominants and leading-tone chords (V/x, vii°/x), the Neapolitan, the Italian, French and German sixths, the cadential 6/4 and mixture. Every label carries a confidence and the next-best reading. Non-chord tones are named where the line makes it clear (passing, neighbour, suspension, appoggiatura, incomplete neighbour).
- **Cadences** — PAC, IAC, HC, deceptive, evaded, abandoned and plagal, with a broad or a strict (Caplin) definition, each placed at a level (motive, phrase, theme, section) and flagged when it has a cadence's shape but sits inside a phrase.
- **Form** — once you accept cadences, phrases are seeded between them; two phrases that begin alike, the first ending on a half cadence and the second on an authentic one, are proposed as antecedent and consequent of a period. Sections nest; the timeline shows each phrase as tonic, pre-dominant and dominant zones, and a gap between two bars is a click to split or join.
- **Tension** — an approximation of Lerdahl's tonal pitch space: distance from the tonic, from the previous chord, surface dissonance and melodic attraction, with weights you can change. Arrivals are weighted by cadence level.
- **Schemata** — Prinner, Romanesca, Monte, Fonte, Do–Re–Mi, Meyer, Quiescenza and the rest, found from the bass and melody scale degrees. Where chords stop being functional, the Neo-Riemannian path (P, L, R, N, S) between triads is described instead.

Nothing the machine proposes is taken as settled. Each chord, key, cadence, unit and schema is *proposed* until you accept, relabel or reject it; *Accept all* is there, and so is a filter that shows only the labels it is unsure of.

**Your decisions are recorded, add-only.** Every time you choose between readings or override the machine, a row goes into the decision log — what the readings were, what you chose, and why if you say. Those rows, the write-ups, and any interpretation you *save* can never be changed or removed: they are frozen when written and the save puts them back if anything tries. Editing a saved interpretation starts a new version with the old one as its parent; the version menu moves between them.

**Write-ups.** For each section, a proposed write-up in five blocks — harmony, cadences, form, tension, and what it suggests for playing — generated from the confirmed analysis by rules and templates, the same text every time for the same analysis. Accept it, edit it, or write your own; each is a new version, and none is ever cut short. *Practise this section* makes it a Repertoire section with its bars; *Reflect* opens a journal entry about it; *To the Tree* captures the insight into the Knowledge Tree's inbox.

**Notes on the notes.** Select one or more noteheads (Notes tab, *Select notes on the score*, shift-click for more) and write what to do — voicing, timing, dynamics, articulation, pedal, colour, fingering, breath or bowing — with the hand, how much it matters, and why. A note is anchored to the notes themselves (part, staff, voice, bar, position in the bar, pitches), not to a place on the screen, so it stays on its notehead through zooming, a narrower window and reading mode's reflow. **There is no length limit.** A note up to twelve words (the threshold is yours) is written inline above the staff, or below it for the left hand; a longer one is a pin whose popover holds every word. Several notes get a bracket. Rules also propose notes — lean into the bass at a deceptive cadence, take time at the main arrival, hold a half cadence open, weight an appoggiatura — each with its reason, to accept, edit or reject.

**Takes.** *Tap along* while you play or listen: one tap a beat. The tempo curve is drawn over the tension curve on one bar axis, with cadences and phrase boundaries through both, and the facts are stated plainly — your median tempo, your biggest slowings and whether they fall at phrase-level cadences, how you pace phrase ends against the middles, and how alike your takes are at each phrase end.

**RomanText.** Every version exports as a `.rntxt` file (Tymoczko, Gotham, Cuthbert and Ariza's RomanText, the format of the When-in-Rome corpus) and any `.rntxt` imports as a new version — an expert's analysis, a teacher's, or the companion script's. *Compare* shows two versions bar by bar, with every place they disagree.

**The companion script (optional).** `tools/analyze.py` is a separate Python script you run yourself, never called by the site. Given a MusicXML file it writes a `.rntxt` and a `.csv` from AugmentedNet, a trained Roman-numeral model (set `AUGMENTEDNET` to its folder), or from music21's own chord-by-chord reading with `--rules`. Import the `.rntxt` in Compare with the origin *companion*; it arrives as a version like any other and is accepted only by you.

**Scores from a scan.** Study reads MusicXML, so a PDF or photo goes through optical music recognition first — Audiveris (desktop, mature) or homr (for photographed pages), both outside the site — and the result is imported as a score. Tick *this score came from OMR* under Compare, and Study will not analyse until every bar has been checked against the image (each marked fine or fixed), because a wrong note from the scanner becomes a wrong chord here.

**Settings** live in the Overview tab: the key profile, the modulation penalty, the cadence definition, the inline-note threshold, the note filter (hand, category, importance) and density, the tension weights, the Neo-Riemannian threshold, and whether non-chord tones are dimmed and phrase arches drawn.

**Storage and backup.** Six stores were added in schema v20 — analyses, write-ups, takes, performance notes, the decision log and OMR reviews — by a migration that adds and changes nothing else. The whole-database export carries them.

## The day

Today is the room the app is really for, and most of what has been added lately lives there.

**The focus timer** sits above the plan. Choose countdown or stopwatch before you start — the two answer different questions, and the choice locks once the clock runs. Drag a task onto it, or press a task's estimated length anywhere in the app, and the clock starts on it. The face has hour, minute and second hands. Pausing starts a break and asks what the break is for; while it runs, a second field asks what you are actually doing. Both are kept with the sitting, and the day's ledger of sittings unfolds under the clock: when, how long, on what, what you did, and every break with its note.

A task in the timer carries its own tick box, its steps and its estimate, so the work can be finished where it was done. Crossing it off there — or in any list, or in the planner — ends the sitting, writes the minutes down, sets the fireworks off with a sentence that is never quite the same one, and leaves the clock empty for the next thing. A step being timed works the same way, and finishing a step does not close the whole task. Minutes accumulate against whatever was timed, and show beside the estimate: *13m of 15m*.

When you plan tomorrow, the milestones coming up are shown beside the waiting work — how soon each is and how much of its own work is still open — because the reason a task matters this week is usually a date, and the date was on another page. Pressing one opens Planning already narrowed to it.

**Morning Theatre** is the manifestation practice, in eight parts: the self-image script, the winning feeling, a vision board you can pin anything in the app to, a scene entered step by step, scripting, structural tension against a real project, thanks given in advance, and the definite chief aim. What is written cross-posts into the Lived Record as manifestation or gratitude, and tension is written back onto the project it is about.

**Stillness** is meditation, breathwork with a breathing circle, a body scan and a built sanctuary you return to, each with a length, a streak and a depth reading. Beside it, **divination**, and an **intuition log** that records a hunch with its channel and strength, then comes back later to ask what actually happened. It only counts as a miss if you could tell.

A reading is a ceremony rather than a button: a moment to settle, a shuffle, a fan of backs to choose from — always more than the spread needs, because choosing from exactly as many as you need is not choosing — and then the turn, with the card's name arriving out of noise underneath it. Through all of it there is warm dust drifting on a canvas over the ceremony and a handful of tones synthesised on the spot — a struck bowl at the start, paper under the shuffle, a chime as you choose, weight as each card turns, a chord when the last of them is up. Both are quiet, both stop the moment the reading is over, and both have a switch; nothing plays anywhere else in the house. The cards are Pamela Colman Smith's drawings for the deck Rider published in 1909, which is what everybody means by the tarot, in the colours it was printed in; a reversed card is the card the other way up, title and all, and whether cards may land reversed at all is a switch too.

There are twenty spreads in five groups — a card before breakfast, the three-card frames, the five-to-seven, the long classical layouts, and the ones for an occasion — and each is laid out in its own shape rather than in a row, because the shape is half of what a spread means: the Celtic cross has its crossing card lying sideways across the first, the twelve houses make a ring, the Tree of Life has three pillars, and the seven centres run up a column from root to crown. Every position carries its own sentence saying what to look for there. You can also name your own positions and keep that layout with the rest.

Beside the cards, the **charms** — which are older than the cards by a few thousand years and work nothing like them. Thirty small symbols in six families go into a bag; you throw seven, fifteen or all thirty at a round cloth, and the scatter is the reading. Nothing is in a position: what matters is which ring a charm landed in (the core, the influences, the beyond), which quarter it faces (spirit, action, material, intuition), and what came down beside it — because two charms together say something neither says alone, and sixty of those pairings are written out. Whichever landed nearest the centre opens the reading, and nobody chose it. About a sixth land face down; they are not read unless you turn them, and leaving one alone is a legitimate answer. The throw is animated as a throw — gathered and shaken, out past where they are going, and back onto it — with a rattle, a whoosh and a small tink as each one finds the cloth. You can add charms of your own, up to ten, which is what everyone who does this actually does.

A reading you did with a real deck on a real table can be typed in — name the cards, loosely enough that "3 cups" and "knight of swords" both land, or open the deck and point — and it gets exactly the same reading, marked as having come off paper. A cast thrown on a real cloth can be recorded the same way, by dragging each charm to where it actually fell. And the whole deck is browsable: all seventy-eight cards, all thirty charms and all sixty-four hexagrams with everything they mean, and under that every time each one has come up for you — in which spread or which ring, in which position or which quarter, which way up, what you had asked and what you wrote afterwards. The hexagrams are laid out in the square the book is looked up in, rows by lower trigram and columns by upper. The ones you have never drawn are dimmed rather than hidden. Every one of the seventy-eight carries what it shows, one line of essence, its themes, several paragraphs each way up, questions to put to yourself, and what it means in each of the six kinds of position a spread can put it in — because the Tower in the past is not the Tower in the outcome. Under the spread, the whole reading and then a paragraph that joins the cards into one sentence, which is there to be disagreed with; the box under that is the point. The *I Ching* is consulted rather than generated. There are two ways to ask and they are not interchangeable: three coins, which is what most people use and is quick, or fifty yarrow stalks, which is older, slower, and produces a different distribution — under the stalks a moving line is rarer and a moving yang is three times likelier than a moving yin, so the readings have a different weather. Both are implemented as they actually are, to the classical sixteenths. The coins are round with a square hole, they go up, tumble, and come down one after another rather than together; the stalks divide, and the count comes off the bundle in front of you. Each line draws itself into the figure from the bottom up, which is the direction a hexagram grows, and a line already in motion is marked and breathes. When the sixth lands, the hexagram is named in its own characters and, if anything was moving, the hexagram it is becoming stands beside it with the movement between them said as well as drawn. All sixty-four carry the Judgment interpreted, the Image, two questions and all six lines — the methods exist to single lines out, and a reading that names the moving lines without saying what they say has thrown the method away. The eight trigrams are drawn rather than typed, because ☰ and its siblings are in Unicode and in almost no font, and a hexagram explained by a row of dotted boxes explains nothing. Three short oracle decks sit beside both, each with a note in its own words on how to sit with a card. A reading is filed in the Lived Record with each card's meaning read off the deck rather than copied into it, so a correction reaches the readings already filed, and a card drawn on Today stays on Today for the day it was drawn for.

## Page themes

Every room shares one design language but carries its own personality. The config lives in `src/04-page-themes.js` (`PAGE_THEMES`): an accent colour (one for dark, one for light), the ink colour used on top of it, a two-stop gradient, a mood line, a Han glyph for the header banner, and a motion profile (`calm`, `energetic`, `crisp`, `snappy`, defined in `MOTION_PROFILES`).

| Room | Accent | Gradient | Motion |
|---|---|---|---|
| Today | warm coral | coral → peach | snappy |
| Planning | slate | slate → sky | crisp |
| Lived Record | warm amber | amber → rose | calm |
| Content Studio | parchment | sand → oat | calm |
| Projects | slate blue | slate → sky | crisp |
| People | dusty rose | rose → clay | calm |
| Finance | moss | moss → sage | crisp |
| Values | soft purple | lavender → mauve | calm |
| Skill Tree | emerald | emerald → teal | energetic (springy) |

The Timeline, the Library and the Review keep the theme of the Lived Record they now live in.

On every route change `applyPageTheme()` sets `--page-accent`, `--page-accent-ink`, `--page-gradient-start`, `--page-gradient-end`, `--page-motion-speed`, `--page-ease` and `--page-glyph` on the root element. Shared components (buttons, inputs, chips, toggles, tabs, bars, sliders, the FAB, toasts, selection) read those variables, so they adapt without per-page CSS. The `.page-head` becomes a gradient banner with the room's glyph and mood line, the ambient background gradient crossfades between two layers in 350 ms, and the two large blobs take the page's gradient colours.

## Sound

Two synthesised layers, nothing downloaded. Both are off by default and remembered in `localStorage` (`soundEnabled`, `ambientEnabled`, `ambientKind`, `ambientVolume`). The `AudioContext` is created lazily inside the first user gesture.

**Interaction sounds** are all one instrument: a singing bowl, in a range of sizes. Two things make a bowl a bowl rather than a bell, and both are modelled rather than sampled — its overtones are not whole multiples of the fundamental (roughly 1 : 2.75 : 5.18 : 8.16 : 11.9, the modes of a thin metal shell), and each of those modes is really a pair split a few cents apart, so the note breathes in and out a couple of times a second as the two halves drift past each other. A small bowl tapped with a padded mallet is a click; a lower, softer one is navigation; a full bowl struck properly and left to ring is a completion; a bowl struck and stopped with a palm on the rim is a deletion; a bowl *rubbed* rather than struck — so the note swells in instead of starting — opens a panel. Everything goes through a synthesised stone room.

**Atmosphere** is chosen from the 🌊 button or in Settings: brown noise, rain with drops on the glass, ocean as a slow filter swell, a slow generative piano, or a music box. The two musical beds improvise over a drifting pentatonic and never repeat a phrase. Interaction sounds duck the bed briefly.

## Backgrounds

Every room has an ink landscape in the ambient layer, built from the vocabulary of the old shan shui (山水) painters: peaks that are shoulders and saddles rather than triangles, hemp-fibre texture strokes (皴) raked down the shaded face, mist that is simply the ink running out at the foot of the mountain, and the empty space (留白) doing as much work as the marks. Pines, bamboo, a plum branch in blossom, a pavilion with upswept eaves, a thatched hut, a plank bridge, one boat with one figure in it, a line of geese, a vertical inscription in the empty half of the picture, and a red seal in the corner.

Every kind of entry opens on a painting of its own, too — a band across the top of the add-entry modal, drawn with the same brush, sealed with its own character: the moon and mist for a dream, a boat pushed out for a letter, a figure at a fork for a decision, a plum branch in flower for gratitude. Each room gets its own composition: a hut under pines for the Review, a boat on the river at first light for Today, rain over bamboo for the Lived Record, the scholar's table for the Library, a pavilion by the water with the poem unwritten for the writing desk, a village stepping up the slope for Projects, sun and moon on the same arc for Habits, a still lake with the mountain in it twice for Reviews, one pine on a bare rock for Values (松柏 — what integrity looks like in this tradition), the grove for the Skill Tree, ridge behind ridge for the Timeline, the elegant gathering for People, terraced fields for Finance. They are drawn in each page's own accent at low opacity, with a soft vignette so text stays readable.

Pages about one record — a project, a skill, a stage, a value, a person, a media entry, a piece of writing — get a landscape generated from that record's id instead: how many ridges, where the summit falls, whether there is a boat on the water or a moon over it. No two look alike, and each looks the same every time you open it.

## Voice and Claude

Every long field carries two buttons. **Speak** uses the browser's own speech recogniser (Chrome, Edge, Safari): no audio is recorded, stored or uploaded — the browser returns text and the text is all that exists. **Tidy** cleans up what is written.

Tidy and the pattern report work in two modes. Without a key everything runs locally: fillers removed, spoken punctuation converted, sentences and paragraphs restored, and a report built from statistics computed in the page. Paste an **Anthropic API key** in Settings and both get a language model instead.

A Claude Pro or Max subscription — or a ChatGPT one — cannot be used for this. Consumer subscriptions do not issue API credentials; API access is a separate, pay-as-you-go product. The key is kept only in this browser's `localStorage` and is never written into a backup file.

**Patterns in the record** always shows the true numbers first: entry cadence, recurring words and hashtags, values that have fallen or risen several readings in a row, overall state by half-period and by weekday, skills going cold, habits under 40%, and the people who recur. With a key, Claude is asked to interpret exactly those numbers and nothing else.

## Letters, decisions and people

- **Sealed letters** (Lived Record → Letters): write to a future self and seal it until a date. It is hidden from cards, lists and search until then, and surfaces on Today when it comes due, with room to answer the person who wrote it.
- **Decision journal** (Lived Record → Decisions): the situation, the options, the real reasoning, what you expect and what would make it a mistake — then a review date that returns on Today, with what actually happened and a verdict.
- **People**: tag anyone in an entry and the People room fills itself — every mention becomes a logged interaction, and anyone you have not been in touch with inside their cadence surfaces as overdue. Relationship types are a list you extend: pick **＋ name another…** in any relationship dropdown and whatever you type is added, kept, and available everywhere from then on.

## Imagery

Pictures belong to the record, not to a separate board. Any project, skill, value, person or entry can carry images; the first of them becomes the ground its own card is printed on. The picture is genuinely visible — the scrim is heavy only where the words are and clears toward the far edge, where there are none, with a text shadow as the last guarantee of legibility on a photograph that happens to be bright exactly where a line falls. Drag to reorder; whichever image leads decides what the card looks like. Sub-stages on the Timeline work the same way. The boards that used to hold pins are gone, and everything that was pinned to one has been folded into the record it belonged to.

## Hashtags

Substantive entries carry hashtags: type `#something` in the body, or use the field in the entry form. `#/tag/:name` gathers everything carrying one, and the writing desk in the Content Studio uses them to pull source material beside the page.

## Reviews

There is no reviews hub to remember to visit. On the last day of each cycle — daily, weekly, monthly, quarterly, half-year, annual — the review appears as a small button beside the evening review at the foot of Today. Opening one gives that period's own numbers: habits kept, tasks finished, entries written, and one figure showing entries a day as bars with habit completion drawn over them. Beside it, **ask Claude** builds a reading from the entries dated inside that period and nothing else, so a weekly review cannot quietly become a reading of the whole life. A cycle that ends unanswered stays listed until it is done or dismissed; *not tonight* is remembered against that period and not the next one. A period that closed with nothing logged in it is not listed at all — there is nothing in it to read.

The daily and weekly reviews both surface what actually got finished, plainly, and both end with **is there anything else worth capturing?** — a step of its own, with a link for each kind of entry. Adding one keeps the review open behind it; if adding one ever navigates away, the review comes back at the same step. The daily review closes by planning tomorrow: the three that matter, one thing to protect, when the energy will be high and when it drops, one obstacle with an *if — then*, and one thing from today to let go of. Every field saves as it is typed.

## Maslow

A developmental frame, kept honest by being read off things already logged rather than asked about in a quiz.

**Maslow's seven levels** are read in their structural order — not a ranking, a sequence — inside the Life Position panel, which is now part of the Lived Record's Review tab. Each level's score is averaged from live readings elsewhere (sleep and physical habits, runway and the gap, contact recency, skill practice and writing, media resonance and reflection, creative nods and awe congruence). A missing input is excluded, never zeroed. The thinnest tier is the one to act on, and each level points at the room where you would act on it.


## The starter set

The house opens with a first draft in it: seven skills, four projects with real phase checklists, five values, three narrative threads, a shelf of things to get to, some open questions and a handful of sparks. It is written from things the owner actually said — the work in progress — rather than invented, and where writing it would have meant inventing a biography (life stages, people, memories, money) it leaves a named, empty room instead. **No habits and no habit log**, because a logged day is the one thing in here you cannot cleanly take back.

Every record it adds carries `seeded:'starter'`, so **Settings → Starter set → Take it out** removes all of it in one action and touches nothing you wrote yourself. It is offered only into a house that is still empty; if you have written anything, the button in Settings is the only way in. Applying it twice is a no-op — records are matched on a stable key.

## Starting empty

Underneath the starter set the house is unfurnished: nothing is seeded except the journal categories. Take the starter set out and every stage, value, skill, project and habit is yours from the first one.

Every dropdown is the app's own, not the browser's. A native `<select>` popup is drawn by the browser from the option's own colours, cannot be styled reliably, and cannot be checked; this one is a listbox like the calendar, keyboard-driven, in the page's palette.

## Editing

The writing desk sets its own type: **Aa** in the view bar opens a typeface, size and leading control, applied live to the page you are writing on and kept once for everything you open.

A field you are not editing is not a box. At rest, an input is its own text on the page; the ground and the rule appear when you go near it, and the accent lands when you are actually in it. It is the same idiom the inline editors have always used, applied to every plain field in the house, so nothing reads as a form. A select keeps its chevron at rest, because a select has to keep saying it is one.

## Credits

The tarot card meanings are normalised from Mark McElroy's *A Guide to Tarot Meanings* by way of the [corpora project](https://github.com/dariusk/corpora); everything written at length around them is this house's own. The card pictures are Pamela Colman Smith's illustrations for the deck published by Rider in 1909, in the colours they were printed in; they are in the public domain, published in 1909 with Smith dead since 1951. The scans come from the [@cometpisces/tarot-kit-images](https://www.npmjs.com/package/@cometpisces/tarot-kit-images) package, and `tools/build-tarot-art.py` cuts them down from twenty-one megabytes to the size they are actually drawn at here. The hexagrams follow the King Wen order with the Judgment and Image in the usual English renderings.

Every piano the house plays — a score played back, the Jazz Studio's play-along, chords, voicings and scales heard, the drone, the ambient slow piano — is the [Salamander Grand Piano V3](https://archive.org/details/SalamanderGrandPianoV3), a Yamaha C5 sampled by Alexander Holm and released under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). The thirty notes in `vendor/salamander/` are the subset the [Tone.js](https://github.com/Tonejs/audio) project hosts, unchanged; `tools/fetch-grand-piano.sh` fetches them again and `build.js` embeds them in `index.html`, so the piano works offline.

The Study Deck carries, inlined and parsed only when it opens: [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) (MIT) for scheduling, [sql.js](https://github.com/sql-js/sql.js) (MIT) to read and write Anki's SQLite collections, [fflate](https://github.com/101arrowz/fflate) (MIT) and [fzstd](https://github.com/101arrowz/fzstd) (MIT) for the zip and zstd around them, and [KaTeX](https://katex.org) (MIT) for maths on cards.

## Keyboard

- `N` new entry (browsers reserve `⌘N` / `Ctrl+N` for a new window, so the app uses the bare key when you are not typing)
- `⌘K` / `Ctrl+K` or `/` omni-search
- `←` `→` previous / next stage on a stage page; move along the spine on the Timeline
- `1` … `4` switch view inside a room that has views — the Lived Record's journals, timeline, library and review; the Content Studio's pipeline, calendar, shelf and numbers
- `Esc` close the speed dial, search, panels and modals

Going back returns you to the exact place on the page you left, not the top of it.

Deleting anything happens immediately with a five-second **Undo** in the toast; there is no confirmation dialog. Detail panels open on the right: drag their left edge to resize (the width is remembered), press ⤢ to widen one for focus, double-click the edge to reset.

Everything that looks like text is inline-editable. Click it, type, click away. There are no save buttons.
