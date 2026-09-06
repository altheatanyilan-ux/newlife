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

The sidebar groups the rooms into two zones by time horizon: **Present** (Today, Journal, Projects, Rituals) and **Becoming** (Compass, Skill Tree, Vision Tree, Memory), with Library always available below a separator. Zones collapse, the sidebar collapses to icons, and both states persist. On narrow screens a bottom bar shows the five most-used rooms and a More button opens the full grouped menu. Pages can be moved between zones by drag-and-drop in Settings.

| Route | Room |
|---|---|
| `#/home` | Life at a glance: today's focus, the living house diagram of rooms with health dots and flows, and long-term panels with charts |
| `#/today` | Daily check-in, Morning Theatre, signals, on-this-day, gentle prompt, 30-day charts |
| `#/timeline` | Eight life stages on a spine, felt-time toggle, thread ribbons, tensions |
| `#/stage/:id` | Stage detail: versioned narrative, sub-stages, formative events, retrospective values, soundtrack, artifacts, letters |
| `#/vision` | Vision Tree with vividness scoring, withering, per-vision detail panel, fruit ceremony |
| `#/values` | Priority ranking, radar with life-long time slider, weather strip, gap analysis, values-to-visions matrix |
| `#/journals` | Commonplace Book: synchronicity, manifestation, reflections, gratitude, dreams, quotes, open questions |
| `#/skills` | Radial skill graph, user-defined rubrics, atrophy, cross-mappings |
| `#/projects` | Project cards with nod heatmaps, energy-vs-output chart, income streams, idea inbox |
| `#/rituals` | Habit rings, four-dimension energy balance, 90-day calendars, guided daily/weekly/seasonal/annual reviews |
| `#/settings` | Theme, ambient sound, felt time, home page, export/import/clear |

## Sound

Two synthesised layers, nothing downloaded. Both are off by default and remembered in `localStorage` (`soundEnabled`, `ambientEnabled`).

- 🔔 Interaction sounds: a two-note chime on clicks (528 → 660 Hz), a 432 Hz note on navigation, a rising 440 → 880 Hz pair when a habit, entry, or practice is completed, a 220 Hz note on destructive actions, and a 396 Hz swell when a panel or modal opens.
- 🌊 Ambient: a brown-noise wash generated in an AudioWorklet (ScriptProcessor fallback), low-passed at 200 Hz at gain 0.03. It ducks to 0.015 under each interaction sound and recovers over 0.8 s.

The AudioContext is created lazily inside the first user gesture and reused. `useSoundManager()` returns the manager: `play(kind)`, `toggleSound()`, `toggleAmbient()`, `state()`, `subscribe(fn)`.

## Keyboard

- `⌘N` / `Ctrl+N` new entry
- `⌘K` / `Ctrl+K` omni-search
- `←` `→` move along the timeline
- `Esc` close panels and modals

Everything that looks like text is inline-editable. Click it, type, click away. There are no save buttons.
