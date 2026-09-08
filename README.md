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

## Data

All data lives in an IndexedDB database named `lifeinstrument-db`, declared in `src/06-db.js` with one object store per data structure: `meta`, `stages`, `threads`, `tensions`, `values`, `valueSnapshots`, `visions`, `skills`, `projects`, `nods`, `ideas`, `habits`, `habitLog`, `checkins`, `entries`, `tasks`, `events`, `people`, `interactions`, `accounts`, `txns`, `budgets`, `finGoals`, `chapters`, `turns`, `threadsN`. Photos are resized on upload and stored inline as base64. On first load the app migrates any data found under the old `localStorage` key or the interim single-blob database, then removes the old copy.

Three small preferences stay in `localStorage`: `soundEnabled`, `ambientEnabled`, and `lastBackupDate`.

### Backups

Settings has **Export backup**, which downloads `backup-YYYY-MM-DD.json` in the shape `{ version: 1, exportedAt, data: { <store>: [rows] } }`, and **Import backup**, which validates the file, asks for confirmation, then clears every store and reloads from the file. Older whole-state exports are accepted too. If the last export was more than 14 days ago, a banner at the top of each page reminds you.

To restore your data on a new device: open this website in the same browser, go to Settings, click Import Backup, and select your exported .json file.

## Rooms

The sidebar opens with the three rooms you are in daily — **Compass**, **Today**, **Journals** — and groups the rest by what each is for rather than by feature:

- **Becoming** — long-term growth and identity: Values, Skill Tree, Projects, Finance, The Library
- **Story** — relationships and memory: People, Timeline

At the foot, always present, sit **The Writing Studio** and **Settings**. The Import Station has no room of its own; it is a section inside Settings. Sidebar labels are the same names the pages carry as their titles, drawn with thin line icons. Zones collapse, the sidebar collapses to icons, and both states persist. On narrow screens a bottom bar shows the five most-used rooms and a More button opens the full grouped menu. Pages can be moved between zones by drag-and-drop in Settings.

The Compass opens with one summary card per zone — items still planned today and habits done, the next skill milestone and how long since a congruence reading, who is overdue for contact and when you last wrote, net worth and what is left in this month's envelopes — each card opening the room where you would act on it.

| Route | Room |
|---|---|
| `#/compass` | Life at a glance: the week's shape (when each day opened and closed, and how the hours between split into claimed and wasted), the twelve-week habit trend, the Life Position check-in (Maslow pyramid and stage resonance), the living house diagram of rooms with health dots, flows and the need each one feeds, and long-term panels with charts |
| `#/today` | The whole day, bracketed by its two ends — *I woke up at* under the date, *I went to sleep at* at the foot, both editable. Between them, every section folds and remembers whether it was open: the plan made last night, tasks, the check-in, the Morning Theatre, the habit checklist with **＋ add habit**, and any review whose cycle closes tonight. The three morning steps are ticks in the headers of the sections they belong to, each printing its own timestamp on that line. A sticky index at the top jumps to any of them |
| `#/people` | A relationship garden: three concentric circles (Inner, Middle, Outer, with Dunbar-ish sizes) you can drag faces between, a contact cadence per person and who has drifted past it, interactions logged by kind, birthdays and follow-ups, and everything you have written about them |
| `#/finance` | Not a ledger: the ways you make money (each active or passive, with the arithmetic that kind deserves — effective rate, hours to target and the ceiling those hours impose, or yield on capital, payback and money per upkeep hour), the gap against a life-cost scenario, what share of the life keeps running when you stop, runway, and life-cost scenarios as columns you can compare side by side |
| `#/writing` | Pieces with an intention and source hashtags; the entries carrying those tags line up beside the page and can be quoted straight in |
| `#/commonplace` | Books, films, series, albums, talks: status, rating, passages, and prompts that ask what a work changed rather than what it scored |
| `#/tag/:name` | Every entry carrying one hashtag |
| `#/timeline` | Life stages on a spine (add a stage from the dashed tile at the end of the spine), felt-time toggle, thread ribbons, tensions |
| `#/stage/:id` | Stage detail: versioned narrative, sub-stages (each printed on its own uploaded images), formative events, retrospective values, soundtrack, artifacts, letters |
| `#/values` | Four figures, one table that is priority, congruence, gap and trend at once, and the radar over time. Each value opens onto what you embody, what a hundred-percent day looks like, what moves you and what counterfeits it, with the evidence feed underneath |
| `#/journals` | Synchronicity, manifestation, reflections, gratitude, dreams, quotes, open questions, sealed letters and decisions |
| `#/skills` | What you are practising now, milestones inside a window you choose, then the living tree: trunk, one branch per category, a twig per skill. Every living twig is fully leaved, whatever level it is on — leaves are the fact that the thing exists at all. Progress is the blossom: how many flowers open on a twig and how big they are, from nothing at level zero to covered at mastery, with a flower still breathing where a milestone is close. Gold fruit for mastery, brown falling leaves for atrophy, sap flowing on recently practised twigs, a sun by day and a moon at night; customisable levels (labels, descriptions, criteria, typed resources, estimated time), multi-target milestones on a timeline, atrophy, cross-mappings |
| `#/projects` | Ideation mode — sparks and open questions, two columns of equal width — and Tracking mode. Tracking has three views: cards (priority, status, task ratio, target date), a kanban board with drag between status columns, and a Gantt timeline of phases; each project has phases with task checklists and quick capture, resources, linked skills, notes, nod heatmaps, income streams, and an idea inbox |
| `#/settings` | Theme, ambient sound, felt time, landing page, sidebar zones, the Import Station, export/import/clear |

## Page themes

Every room shares one design language but carries its own personality. The config lives in `src/04-page-themes.js` (`PAGE_THEMES`): an accent colour (one for dark, one for light), the ink colour used on top of it, a two-stop gradient, a mood line, a Han glyph for the header banner, and a motion profile (`calm`, `energetic`, `crisp`, `snappy`, defined in `MOTION_PROFILES`).

| Room | Accent | Gradient | Motion |
|---|---|---|---|
| Today | warm coral | coral → peach | snappy |
| Journals | warm amber | amber → rose | calm |
| Projects | slate blue | slate → sky | crisp |
| Writing | parchment | sand → oat | calm |
| The Library | mulberry | plum → rose | calm |
| People | dusty rose | rose → clay | calm |
| Finance | moss | moss → sage | crisp |
| Values | soft purple | lavender → mauve | calm |
| Skill Tree | emerald | emerald → teal | energetic (springy) |
| Timeline | dusty gold | gold → sepia | calm |
| Compass | cool gray | gray → blue-gray | calm |

On every route change `applyPageTheme()` sets `--page-accent`, `--page-accent-ink`, `--page-gradient-start`, `--page-gradient-end`, `--page-motion-speed`, `--page-ease` and `--page-glyph` on the root element. Shared components (buttons, inputs, chips, toggles, tabs, bars, sliders, the FAB, toasts, selection) read those variables, so they adapt without per-page CSS. The `.page-head` becomes a gradient banner with the room's glyph and mood line, the ambient background gradient crossfades between two layers in 350 ms, and the two large blobs take the page's gradient colours.

## Sound

Two synthesised layers, nothing downloaded. Both are off by default and remembered in `localStorage` (`soundEnabled`, `ambientEnabled`, `ambientKind`, `ambientVolume`). The `AudioContext` is created lazily inside the first user gesture.

**Interaction sounds** are all one instrument: a singing bowl, in a range of sizes. Two things make a bowl a bowl rather than a bell, and both are modelled rather than sampled — its overtones are not whole multiples of the fundamental (roughly 1 : 2.75 : 5.18 : 8.16 : 11.9, the modes of a thin metal shell), and each of those modes is really a pair split a few cents apart, so the note breathes in and out a couple of times a second as the two halves drift past each other. A small bowl tapped with a padded mallet is a click; a lower, softer one is navigation; a full bowl struck properly and left to ring is a completion; a bowl struck and stopped with a palm on the rim is a deletion; a bowl *rubbed* rather than struck — so the note swells in instead of starting — opens a panel. Everything goes through a synthesised stone room.

**Atmosphere** is chosen from the 🌊 button or in Settings: brown noise, rain with drops on the glass, ocean as a slow filter swell, a slow generative piano, or a music box. The two musical beds improvise over a drifting pentatonic and never repeat a phrase. Interaction sounds duck the bed briefly.

## Backgrounds

Every room has an ink landscape in the ambient layer, built from the vocabulary of the old shan shui (山水) painters: peaks that are shoulders and saddles rather than triangles, hemp-fibre texture strokes (皴) raked down the shaded face, mist that is simply the ink running out at the foot of the mountain, and the empty space (留白) doing as much work as the marks. Pines, bamboo, a plum branch in blossom, a pavilion with upswept eaves, a thatched hut, a plank bridge, one boat with one figure in it, a line of geese, a vertical inscription in the empty half of the picture, and a red seal in the corner.

Every kind of entry opens on a painting of its own, too — a band across the top of the add-entry modal, drawn with the same brush, sealed with its own character: the moon and mist for a dream, a boat pushed out for a letter, a figure at a fork for a decision, a plum branch in flower for gratitude. Each room gets its own composition: a hut under pines for the Compass, a boat on the river at first light for Today, rain over bamboo for Journals, the scholar's table for the Library, a pavilion by the water with the poem unwritten for Writing, a village stepping up the slope for Projects, sun and moon on the same arc for Habits, a still lake with the mountain in it twice for Reviews, one pine on a bare rock for Values (松柏 — what integrity looks like in this tradition), the grove for the Skill Tree, ridge behind ridge for the Timeline, the elegant gathering for People, terraced fields for Finance. They are drawn in each page's own accent at low opacity, with a soft vignette so text stays readable.

Pages about one record — a project, a skill, a stage, a value, a person, a media entry, a piece of writing — get a landscape generated from that record's id instead: how many ridges, where the summit falls, whether there is a boat on the water or a moon over it. No two look alike, and each looks the same every time you open it.

## Voice and Claude

Every long field carries two buttons. **Speak** uses the browser's own speech recogniser (Chrome, Edge, Safari): no audio is recorded, stored or uploaded — the browser returns text and the text is all that exists. **Tidy** cleans up what is written.

Tidy and the pattern report work in two modes. Without a key everything runs locally: fillers removed, spoken punctuation converted, sentences and paragraphs restored, and a report built from statistics computed in the page. Paste an **Anthropic API key** in Settings and both get a language model instead.

A Claude Pro or Max subscription — or a ChatGPT one — cannot be used for this. Consumer subscriptions do not issue API credentials; API access is a separate, pay-as-you-go product. The key is kept only in this browser's `localStorage` and is never written into a backup file.

**Patterns in the record** always shows the true numbers first: entry cadence, recurring words and hashtags, values that have fallen or risen several readings in a row, overall state by half-period and by weekday, skills going cold, habits under 40%, and the people who recur. With a key, Claude is asked to interpret exactly those numbers and nothing else.

## Letters, decisions and people

- **Sealed letters** (Journals → Letters): write to a future self and seal it until a date. It is hidden from cards, lists and search until then, and surfaces on Today when it comes due, with room to answer the person who wrote it.
- **Decision journal** (Journals → Decisions): the situation, the options, the real reasoning, what you expect and what would make it a mistake — then a review date that returns on Today, with what actually happened and a verdict.
- **People**: tag anyone in an entry and the People room fills itself — every mention becomes a logged interaction, and anyone you have not been in touch with inside their cadence surfaces as overdue. Relationship types are a list you extend: pick **＋ name another…** in any relationship dropdown and whatever you type is added, kept, and available everywhere from then on.

## Imagery

Pictures belong to the record, not to a separate board. Any project, skill, value, person or vision can carry images; the first of them becomes the ground its own card is printed on — a wash at low opacity under a scrim heavy enough to keep every word readable on any photograph, in either theme, and visible in the list before anything is opened. Drag to reorder; whichever image leads decides what the card looks like. Sub-stages on the Timeline work the same way. The boards that used to hold pins are gone, and everything that was pinned to one has been folded into the record it belonged to.

## Hashtags

Substantive entries carry hashtags: type `#something` in the body, or use the field in the entry form. `#/tag/:name` gathers everything carrying one, and the Writing room uses them to pull source material beside the page.

## Reviews

There is no reviews hub to remember to visit. On the last day of each cycle — daily, weekly, monthly, quarterly, half-year, annual — the review appears as a small button beside the evening review at the foot of Today. Opening one gives that period's own numbers: habits kept, tasks finished, entries written, and one figure showing entries a day as bars with habit completion drawn over them. Beside it, **ask Claude** builds a reading from the entries dated inside that period and nothing else, so a weekly review cannot quietly become a reading of the whole life. A cycle that ends unanswered stays listed until it is done or dismissed; *not tonight* is remembered against that period and not the next one. A period that closed with nothing logged in it is not listed at all — there is nothing in it to read.

The daily and weekly reviews both surface what actually got finished, plainly, and both end with **is there anything else worth capturing?** — a step of its own, with a link for each kind of entry. Adding one keeps the review open behind it; if adding one ever navigates away, the review comes back at the same step. The daily review closes by planning tomorrow: the three that matter, one thing to protect, when the energy will be high and when it drops, one obstacle with an *if — then*, and one thing from today to let go of. Every field saves as it is typed.

## Maslow

A developmental frame, kept honest by being read off things already logged rather than asked about in a quiz.

**Maslow's seven levels** are read in their structural order — not a ranking, a sequence — inside the Life Position panel on the Compass. Each level's score is averaged from live readings elsewhere (sleep and physical habits, runway and the gap, contact recency, skill practice and writing, media resonance and reflection, creative nods and awe congruence). A missing input is excluded, never zeroed. The thinnest tier is the one to act on, and each level points at the room where you would act on it.


## The starter set

The house opens with a first draft in it: seven skills, four projects with real phase checklists, a five-point compass, three narrative threads, a shelf of things to get to, some open questions and a handful of sparks. It is written from things the owner actually said — the work in progress — rather than invented, and where writing it would have meant inventing a biography (life stages, people, memories, money) it leaves a named, empty room instead. **No habits and no habit log**, because a logged day is the one thing in here you cannot cleanly take back.

Every record it adds carries `seeded:'starter'`, so **Settings → Starter set → Take it out** removes all of it in one action and touches nothing you wrote yourself. It is offered only into a house that is still empty; if you have written anything, the button in Settings is the only way in. Applying it twice is a no-op — records are matched on a stable key.

## Starting empty

Underneath the starter set the house is unfurnished: nothing is seeded except the journal categories. Take the starter set out and every stage, value, skill, project and habit is yours from the first one.

## Editing

A field you are not editing is not a box. At rest, an input is its own text on the page; the ground and the rule appear when you go near it, and the accent lands when you are actually in it. It is the same idiom the inline editors have always used, applied to every plain field in the house, so nothing reads as a form. A select keeps its chevron at rest, because a select has to keep saying it is one.

## Keyboard

- `N` new entry (browsers reserve `⌘N` / `Ctrl+N` for a new window, so the app uses the bare key when you are not typing)
- `⌘K` / `Ctrl+K` or `/` omni-search
- `←` `→` previous / next stage on a stage page; move along the spine on the Timeline
- `Esc` close the speed dial, search, panels and modals

Going back returns you to the exact place on the page you left, not the top of it.

Deleting anything happens immediately with a five-second **Undo** in the toast; there is no confirmation dialog. Detail panels open on the right: drag their left edge to resize (the width is remembered), press ⤢ to widen one for focus, double-click the edge to reset.

Everything that looks like text is inline-editable. Click it, type, click away. There are no save buttons.
