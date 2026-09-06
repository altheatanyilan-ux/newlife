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

All data lives in an IndexedDB database named `lifeinstrument-db`, declared in `src/06-db.js` with one object store per data structure: `meta`, `stages`, `threads`, `tensions`, `values`, `valueSnapshots`, `visions`, `skills`, `projects`, `nods`, `ideas`, `habits`, `habitLog`, `checkins`, `entries`, `tasks`, `events`, `boards`, `people`, `interactions`, `accounts`, `txns`, `budgets`, `finGoals`, `chapters`, `turns`, `threadsN`. Photos are resized on upload and stored inline as base64. On first load the app migrates any data found under the old `localStorage` key or the interim single-blob database, then removes the old copy.

Three small preferences stay in `localStorage`: `soundEnabled`, `ambientEnabled`, and `lastBackupDate`.

### Backups

Settings has **Export backup**, which downloads `backup-YYYY-MM-DD.json` in the shape `{ version: 1, exportedAt, data: { <store>: [rows] } }`, and **Import backup**, which validates the file, asks for confirmation, then clears every store and reloads from the file. Older whole-state exports are accepted too. If the last export was more than 14 days ago, a banner at the top of each page reminds you.

To restore your data on a new device: open this website in the same browser, go to Settings, click Import Backup, and select your exported .json file.

## Rooms

The sidebar groups the rooms into three zones, by what each is for rather than by feature:

- **Present** — what is happening now: Today, Rhythm, Projects
- **Becoming** — long-term growth and identity: Values, Skill Tree, Vision Canvas
- **Story** — relationships, memory and meaning: People, Timeline, Chronicle, Journals

Below a separator sit the utilities that belong to no zone: Commonplace Book, Writing, Finance. Sidebar labels are the same names the pages carry as their titles, drawn with thin line icons. Zones collapse, the sidebar collapses to icons, and both states persist. On narrow screens a bottom bar shows the five most-used rooms and a More button opens the full grouped menu. Pages can be moved between zones by drag-and-drop in Settings.

Home opens with one summary card per zone — items still planned today and habits done, the next skill milestone and how long since a congruence reading, who is overdue for contact and when you last wrote, net worth and what is left in this month's envelopes — each card opening the room where you would act on it.

| Route | Room |
|---|---|
| `#/home` | Life at a glance: today's focus, the living house diagram of rooms with health dots and flows, and long-term panels with charts |
| `#/today` | Morning first: the Morning Rehearsal, the day's intention and tasks, then the check-in, signals, on-this-day, gentle prompt and one trend line |
| `#/rhythm` | The daily command centre: a day / week / month calendar of events, timed tasks and timed habits with drag to reschedule, plus three tabs — **Plan** (a three-step ritual for tomorrow and the week ahead), **Habits** (rings, streaks and micro-loops), **Review** (guided weekly, seasonal and annual reviews, and Patterns in the record) |
| `#/rhythm/day/:date` | One day as a readable document: what was written, done, planned and felt |
| `#/people` | A relationship garden: three concentric circles (Inner, Middle, Outer, with Dunbar-ish sizes) you can drag faces between, a contact cadence per person and who has drifted past it, interactions logged by kind, birthdays and follow-ups, and everything you have written about them |
| `#/finance` | A personal financial dashboard: accounts and net worth over time, a transaction ledger with categories and recurring entries, monthly envelopes, savings goals, and a written reading of what the numbers say |
| `#/chronicle` | The story layer: **Life Chapters** you name in hindsight and write a narrative for, **Turning Points** inside them (decision, event, realisation, loss, achievement, encounter), and **Threads** that run across chapters — drawn as a narrative timeline, analysed in a Patterns view, and printable as a book |
| `#/writing` | Pieces with an intention and source hashtags; the entries carrying those tags line up beside the page and can be quoted straight in |
| `#/commonplace` | Books, films, series, albums, talks: status, rating, passages, and prompts that ask what a work changed rather than what it scored |
| `#/tag/:name` | Every entry carrying one hashtag |
| `#/timeline` | Life stages on a spine (add a stage from the dashed tile at the end of the spine), felt-time toggle, thread ribbons, tensions |
| `#/stage/:id` | Stage detail: versioned narrative, sub-stages, formative events, retrospective values, soundtrack, artifacts, letters |
| `#/vision` | The lifeline: past, present, and future eras as a horizontal timeline with a NOW marker, goals with completion and progress, life events, and a close-chapter wizard; the vision tree below it, and a **Board** tab — a pin board of images and single words for what you are aiming at |
| `#/values` | A written reading of what the numbers mean first, then four figures, one table that is priority, congruence, gap and trend at once, and the radar over time. Each value carries weekly practices; a snapshot starts from what those weeks contained |
| `#/journals` | Synchronicity, manifestation, reflections, gratitude, dreams, quotes, open questions, sealed letters and decisions |
| `#/skills` | What you are practising now, milestones inside a window you choose, then the living tree: trunk, one branch per category, a twig per skill whose leaves grow with each level, gold fruit for mastery, blossoms when a milestone is near, brown falling leaves for atrophy, sap flowing on recently practised twigs, a sun by day and a moon at night; customisable levels (labels, descriptions, criteria, typed resources, estimated time), multi-target milestones on a timeline, atrophy, cross-mappings |
| `#/projects` | Ideation mode (sparks, questions, inspirations, experiments and a brainstorm page) and Tracking mode. Tracking has three views: cards (priority, status, task ratio, target date), a kanban board with drag between status columns, and a Gantt timeline of phases; each project has phases with task checklists and quick capture, resources, linked skills and vision chapter, notes, nod heatmaps, income streams; energy-vs-output chart and idea inbox |
| `#/settings` | Theme, ambient sound, felt time, home page, export/import/clear |

## Page themes

Every room shares one design language but carries its own personality. The config lives in `src/04-page-themes.js` (`PAGE_THEMES`): an accent colour (one for dark, one for light), the ink colour used on top of it, a two-stop gradient, a mood line, a Han glyph for the header banner, and a motion profile (`calm`, `energetic`, `crisp`, `snappy`, defined in `MOTION_PROFILES`).

| Room | Accent | Gradient | Motion |
|---|---|---|---|
| Today | warm coral | coral → peach | snappy |
| Journals | warm amber | amber → rose | calm |
| Projects | slate blue | slate → sky | crisp |
| Rhythm | sea teal | teal → sage | calm |
| Writing | parchment | sand → oat | calm |
| Commonplace Book | mulberry | plum → rose | calm |
| People | dusty rose | rose → clay | calm |
| Finance | moss | moss → sage | crisp |
| Chronicle | linen | linen → parchment | calm |
| Values | soft purple | lavender → mauve | calm |
| Skill Tree | emerald | emerald → teal | energetic (springy) |
| Vision Canvas | deep indigo | indigo → violet | calm (floats, parallax) |
| Timeline | dusty gold | gold → sepia | calm |
| Home | cool gray | gray → blue-gray | calm |

On every route change `applyPageTheme()` sets `--page-accent`, `--page-accent-ink`, `--page-gradient-start`, `--page-gradient-end`, `--page-motion-speed`, `--page-ease` and `--page-glyph` on the root element. Shared components (buttons, inputs, chips, toggles, tabs, bars, sliders, the FAB, toasts, selection) read those variables, so they adapt without per-page CSS. The `.page-head` becomes a gradient banner with the room's glyph and mood line, the ambient background gradient crossfades between two layers in 350 ms, and the two large blobs take the page's gradient colours.

## Sound

Two synthesised layers, nothing downloaded. Both are off by default and remembered in `localStorage` (`soundEnabled`, `ambientEnabled`, `ambientKind`, `ambientVolume`). The `AudioContext` is created lazily inside the first user gesture.

**Interaction sounds** are struck objects rather than beeps: a fingertip on wood for a click, moving air for navigation, a small inharmonic bell for a completion, a closed knock for a deletion, a drawer for opening a panel. Everything runs through a short synthesised room so nothing sounds bare.

**Atmosphere** is chosen from the 🌊 button or in Settings: brown noise, rain with drops on the glass, ocean as a slow filter swell, a slow generative piano, or a music box. The two musical beds improvise over a drifting pentatonic and never repeat a phrase. Interaction sounds duck the bed briefly.

## Backgrounds

Every room has a drawn scene in the ambient layer — a house and hills for Home, a low sun for Today, rain on a window for Journals, a stack of books and a lamp for the Commonplace Book, a desk at night for Writing, lanterns and a shopfront for Projects, a bamboo grove for the Skill Tree, mountains and a moon for the Vision Canvas, receding hills for the Timeline. They are drawn in each page's own accent and gradient at low opacity, with a soft vignette so text stays readable.

Pages about one record — a project, a skill, a stage, a value, a media entry, a piece of writing — get an emblem generated from that record's id instead, so no two look alike and each looks the same every time you open it.

## Voice and Claude

Every long field carries two buttons. **Speak** uses the browser's own speech recogniser (Chrome, Edge, Safari): no audio is recorded, stored or uploaded — the browser returns text and the text is all that exists. **Tidy** cleans up what is written.

Tidy and the pattern report work in two modes. Without a key everything runs locally: fillers removed, spoken punctuation converted, sentences and paragraphs restored, and a report built from statistics computed in the page. Paste an **Anthropic API key** in Settings and both get a language model instead.

A Claude Pro or Max subscription — or a ChatGPT one — cannot be used for this. Consumer subscriptions do not issue API credentials; API access is a separate, pay-as-you-go product. The key is kept only in this browser's `localStorage` and is never written into a backup file.

**Patterns in the record** (Rhythm → Review → Patterns) always shows the true numbers first: entry cadence, recurring words and hashtags, values that have fallen or risen several readings in a row, overall state by half-period and by weekday, skills going cold, habits under 40%, and the people who recur. With a key, Claude is asked to interpret exactly those numbers and nothing else.

## Letters, decisions and people

- **Sealed letters** (Journals → Letters): write to a future self and seal it until a date. It is hidden from cards, lists and search until then, and surfaces on Today when it comes due, with room to answer the person who wrote it.
- **Decision journal** (Journals → Decisions): the situation, the options, the real reasoning, what you expect and what would make it a mistake — then a review date that returns on Today, with what actually happened and a verdict.
- **People**: tag anyone in an entry and the People room fills itself — every mention becomes a logged interaction, and anyone you have not been in touch with inside their cadence surfaces as overdue.

## Hashtags

Substantive entries carry hashtags: type `#something` in the body, or use the field in the entry form. `#/tag/:name` gathers everything carrying one, and the Writing room uses them to pull source material beside the page.

## The Chronicle

Journal keeps your days and Timeline keeps your moments; neither answers what the shape of a life is. The Chronicle holds three levels:

- **Chapters** — a stretch of life you can name in hindsight, with dates, a one-line theme, a colour, and a narrative written from where you stand now.
- **Turning points** — only the moments after which something was different, typed as decision, event, realisation, loss, achievement or encounter, each with what happened, how it changed the trajectory and what it taught you.
- **Threads** — themes that run across chapters, drawn as curved lines connecting the moments that carry them.

Any memory, life event, reflection or decision can be promoted straight into it with the **→ turning point** button on its card: it files itself into the chapter its date falls in and links back to the entry. The **Patterns** tab shows which kinds of moment your story is made of — a life told mostly as events that happened to you reads differently from one told as decisions — and **Print the book** sets the whole record as a printable volume.

## Starting empty

The house opens unfurnished. Nothing is seeded except the journal categories and three neutral chapters on the Vision Canvas, so every stage, value, skill, project and habit is yours from the first one.

## Keyboard

- `N` new entry (browsers reserve `⌘N` / `Ctrl+N` for a new window, so the app uses the bare key when you are not typing)
- `⌘K` / `Ctrl+K` or `/` omni-search
- `←` `→` previous / next stage on a stage page; move along the spine on the Timeline
- `Esc` close the speed dial, search, panels and modals

Going back returns you to the exact place on the page you left, not the top of it.

Deleting anything happens immediately with a five-second **Undo** in the toast; there is no confirmation dialog. Detail panels open on the right: drag their left edge to resize (the width is remembered), press ⤢ to widen one for focus, double-click the edge to reset.

Everything that looks like text is inline-editable. Click it, type, click away. There are no save buttons.
