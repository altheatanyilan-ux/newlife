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

All data lives in an IndexedDB database named `lifeinstrument-db`, declared in `src/06-db.js` with one object store per data structure: `meta`, `stages`, `threads`, `tensions`, `values`, `valueSnapshots`, `visions`, `skills`, `projects`, `nods`, `ideas`, `habits`, `habitLog`, `checkins`, `entries`. Photos are resized on upload and stored inline as base64. On first load the app migrates any data found under the old `localStorage` key or the interim single-blob database, then removes the old copy.

Three small preferences stay in `localStorage`: `soundEnabled`, `ambientEnabled`, and `lastBackupDate`.

### Backups

Settings has **Export backup**, which downloads `backup-YYYY-MM-DD.json` in the shape `{ version: 1, exportedAt, data: { <store>: [rows] } }`, and **Import backup**, which validates the file, asks for confirmation, then clears every store and reloads from the file. Older whole-state exports are accepted too. If the last export was more than 14 days ago, a banner at the top of each page reminds you.

To restore your data on a new device: open this website in the same browser, go to Settings, click Import Backup, and select your exported .json file.

## Rooms

The sidebar groups the rooms into two zones by time horizon: **Present** (Today, Plan, Projects, Habits) and **Becoming** (Values, Skill Tree, Vision Canvas, Timeline), with Journals, Commonplace Book, Writing and Reviews always available below a separator. Sidebar labels are the same names the pages carry as their titles, drawn with thin line icons. Zones collapse, the sidebar collapses to icons, and both states persist. On narrow screens a bottom bar shows the five most-used rooms and a More button opens the full grouped menu. Pages can be moved between zones by drag-and-drop in Settings.

| Route | Room |
|---|---|
| `#/home` | Life at a glance: today's focus, the living house diagram of rooms with health dots and flows, and long-term panels with charts |
| `#/today` | Daily check-in, Morning Theatre, signals, on-this-day, gentle prompt, 30-day charts |
| `#/plan` | The week as seven drop targets, a carried-over strip and an unscheduled shelf; drag a task to a day or pull existing project work onto one |
| `#/writing` | Pieces with an intention and source hashtags; the entries carrying those tags line up beside the page and can be quoted straight in |
| `#/commonplace` | Books, films, series, albums, talks: status, rating, passages, and prompts that ask what a work changed rather than what it scored |
| `#/reviews` | Guided weekly, seasonal and annual reviews |
| `#/tag/:name` | Every entry carrying one hashtag |
| `#/timeline` | Life stages on a spine (add a stage from the dashed tile at the end of the spine), felt-time toggle, thread ribbons, tensions |
| `#/stage/:id` | Stage detail: versioned narrative, sub-stages, formative events, retrospective values, soundtrack, artifacts, letters |
| `#/vision` | The lifeline: past, present, and future eras as a horizontal timeline with a NOW marker, goals with completion and progress, life events, and a close-chapter wizard; the vision tree below it |
| `#/values` | A written reading of what the numbers mean first, then four figures, one table that is priority, congruence, gap and trend at once, and the radar over time |
| `#/journals` | Commonplace Book: synchronicity, manifestation, reflections, gratitude, dreams, quotes, open questions |
| `#/skills` | The living tree: trunk, one branch per category, a twig per skill whose leaves grow with each level, gold fruit for mastery, blossoms when a milestone is near, brown falling leaves for atrophy, sap flowing on recently practised twigs, a sun by day and a moon at night; customisable levels (labels, descriptions, criteria, typed resources, estimated time), multi-target milestones on a timeline, atrophy, cross-mappings |
| `#/projects` | Ideation mode (sparks, questions, inspirations, experiments and a brainstorm page) and Tracking mode. Tracking has three views: cards (priority, status, task ratio, target date), a kanban board with drag between status columns, and a Gantt timeline of phases; each project has phases with task checklists and quick capture, resources, linked skills and vision chapter, notes, nod heatmaps, income streams; energy-vs-output chart and idea inbox |
| `#/rituals` | Habit rings, four-dimension energy balance, 90-day calendars |
| `#/settings` | Theme, ambient sound, felt time, home page, export/import/clear |

## Page themes

Every room shares one design language but carries its own personality. The config lives in `src/04-page-themes.js` (`PAGE_THEMES`): an accent colour (one for dark, one for light), the ink colour used on top of it, a two-stop gradient, a mood line, a Han glyph for the header banner, and a motion profile (`calm`, `energetic`, `crisp`, `snappy`, defined in `MOTION_PROFILES`).

| Room | Accent | Gradient | Motion |
|---|---|---|---|
| Today | warm coral | coral → peach | snappy |
| Journals | warm amber | amber → rose | calm |
| Projects | slate blue | slate → sky | crisp |
| Habits | sea teal | teal → sage | calm |
| Plan | terracotta | clay → sand | crisp |
| Writing | parchment | sand → oat | calm |
| Commonplace Book | mulberry | plum → rose | calm |
| Reviews | sea green | teal → sage | calm |
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

## Hashtags

Substantive entries carry hashtags: type `#something` in the body, or use the field in the entry form. `#/tag/:name` gathers everything carrying one, and the Writing room uses them to pull source material beside the page.

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
