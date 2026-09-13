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

- **Create** — what you are making: Content Studio, Projects, Finance, Skill Tree
- **Identity** — who you are, and have been: Values, Lived Record, People

Settings sits in the buttons at the top right; the Import Station is a section inside it. Zones collapse, the sidebar collapses to icons, and both states persist. On narrow screens a bottom bar shows the most-used rooms and a More button opens the full grouped menu. Pages can be moved between zones by drag-and-drop in Settings.

Four rooms no longer have a door of their own, because they stopped being separate places — the **Timeline**, the **Library** and the **Review** are views of the Lived Record, and the **writing desk** is reached from a piece in the Content Studio. Their addresses all still answer, because a great deal links to them. The **Compass** was retired the same way: the charts it held now open as the Lived Record's Review tab, next to the writing about them, and `#/compass` redirects there.

| Route | Room |
|---|---|
| `#/today` | The whole day, bracketed by its two ends — *I woke up at* under the date (blank until you fill it in), *I went to sleep at* at the foot. Between them, in order: the focus timer, the plan made last night, today's tasks, the check-in, the Morning Theatre, stillness and divination, habits, and any review whose cycle closes tonight. Every section folds and remembers whether it was open; a sticky index at the top jumps to any of them |
| `#/planning` | Where work is moved rather than reflected on. Folders and lists in the sidebar, five views over whichever is selected — Matrix (Eisenhower, and the default), List, Calendar, Board, Timeline — milestones on a dated timeline above every one of them, subtasks on the row itself, drag to reorder anywhere, and Habits and Statistics as rooms beside Tasks. A **milestone is also a lens**: a task can name the date it is being done towards, pressing that date on the strip narrows every view to its work (pressing it again lets go), and opening the milestone lists that work with what is left of it |
| `#/journals` | The **Lived Record**, in four views: `entries` (synchronicity, manifestation, reflections, gratitude, dreams, quotes, open questions, divination, intuition, sealed letters and decisions), `timeline` (life stages on a spine, felt-time toggle, thread ribbons, tensions), `library` (books, films, series, albums, talks — status, rating, passages, and prompts that ask what a work changed rather than what it scored) and `review` (the charts the Compass used to hold, and the periodic reviews under them) |
| `#/content` | The **Content Studio**: pieces from seed to published, in four views — Pipeline (columns you can widen by dragging), Calendar, Shelf and Numbers. A piece opens onto the writing desk, with source hashtags pulling the entries that carry them in beside the page |
| `#/projects` | Ideation mode — sparks and open questions, two columns of equal width — and Tracking mode with three views: cards, a kanban board, and a Gantt of phases. Each project has phases with task checklists, resources, linked skills, notes, nod heatmaps, income streams and an idea inbox. Future Projects sit in the inventory beside the live ones |
| `#/skills` | What you are practising now, milestones inside a window you choose, then the living tree: a sakura, grown rather than drawn — the skills are points of light in the canopy and the wood finds its own way to them, so the branching is what the growth did rather than an arc divided by the number of categories. In grass with orchids growing at its foot. Every living twig is fully leaved whatever level it is on; progress is the blossom, from a single bud to a covered twig at mastery. Customisable levels (labels, descriptions, criteria as checkboxes, typed resources, estimated time), multi-target milestones on a timeline, atrophy, cross-mappings. A skill can also be broken into **abilities** — reading and speaking, technique and repertoire — each with a rubric of its own, because they do not move together; the skill's reading is then their average, the one furthest behind is named, and the blossom on the tree follows the roll-up |
| `#/values` | Four figures, one table that is priority, congruence, gap and trend at once, and the radar over time. Each value carries a tagline and opens onto what you embody, what a hundred-percent day looks like, what moves you and what counterfeits it, with the evidence feed at the top |
| `#/people` | A relationship garden: concentric circles you can drag faces between, a contact cadence per person and who has drifted past it, interactions logged by kind, birthdays and follow-ups, and everything you have written about them |
| `#/finance` | Not a ledger: the ways you make money (each active or passive, with the arithmetic that kind deserves — effective rate, hours to target and the ceiling those hours impose, or yield on capital, payback and money per upkeep hour), substreams under a stream, the gap against a life-cost scenario, what share of the life keeps running when you stop, runway, and life-cost scenarios as columns you can compare side by side |
| `#/tag/:name` | Every entry carrying one hashtag |
| `#/stage/:id` | Stage detail: versioned narrative, sub-stages (each printed on its own uploaded images), formative events, retrospective values, soundtrack, artifacts, letters |
| `#/settings` | Theme, ambient sound, felt time, landing page, sidebar zones, the Import Station, export/import/clear |

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

## Keyboard

- `N` new entry (browsers reserve `⌘N` / `Ctrl+N` for a new window, so the app uses the bare key when you are not typing)
- `⌘K` / `Ctrl+K` or `/` omni-search
- `←` `→` previous / next stage on a stage page; move along the spine on the Timeline
- `1` … `4` switch view inside a room that has views — the Lived Record's journals, timeline, library and review; the Content Studio's pipeline, calendar, shelf and numbers
- `Esc` close the speed dial, search, panels and modals

Going back returns you to the exact place on the page you left, not the top of it.

Deleting anything happens immediately with a five-second **Undo** in the toast; there is no confirmation dialog. Detail panels open on the right: drag their left edge to resize (the width is remembered), press ⤢ to widen one for focus, double-click the edge to reset.

Everything that looks like text is inline-editable. Click it, type, click away. There are no save buttons.
