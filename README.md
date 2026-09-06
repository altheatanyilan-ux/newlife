# Life Instrument

A single-file personal website: a structured container for a life examined and a life deliberately created.

The governing metaphor is a house still being built. Each section is a room; a unified entry model is the hallway that lets one entry live in many rooms at once.

## Running it

Open `index.html` in a browser. That is the whole deployment. There is no build step and no server.

- All data lives in `localStorage` under the key `lifeinstrument.v1`. Images are stored inline as base64.
- The only external dependency is Google Fonts (EB Garamond, Nunito Sans, Noto Serif SC, Lora, IBM Plex Mono). Without a network connection the site falls back to system serif and sans faces.
- Export and import the full data store as JSON from Settings.

## Rooms

| Route | Room |
|---|---|
| `#/today` | Daily check-in, Morning Theatre, signals, on-this-day, gentle prompt, 30-day charts |
| `#/timeline` | Eight life stages on a spine, felt-time toggle, thread ribbons, tensions |
| `#/stage/:id` | Stage detail: versioned narrative, sub-stages, formative events, retrospective values, soundtrack, artifacts, letters |
| `#/vision` | Vision Tree with vividness scoring, withering, per-vision detail panel, fruit ceremony |
| `#/values` | Priority ranking, radar with life-long time slider, weather strip, gap analysis, values-to-visions matrix |
| `#/journals` | Commonplace Book: synchronicity, manifestation, reflections, gratitude, dreams, quotes, open questions |
| `#/skills` | Radial skill graph, user-defined rubrics, atrophy, cross-mappings |
| `#/projects` | Project cards with nod heatmaps, energy-vs-output chart, income streams, idea inbox |
| `#/rituals` | Habit rings, four-dimension energy balance, 90-day calendars, guided daily/weekly/seasonal/annual reviews |
| `#/map` | System Map: how the rooms feed each other, coded by attention cadence |
| `#/settings` | Theme, ambient sound, felt time, home page, export/import/clear |

## Keyboard

- `⌘N` / `Ctrl+N` new entry
- `⌘K` / `Ctrl+K` omni-search
- `←` `→` move along the timeline
- `Esc` close panels and modals

Everything that looks like text is inline-editable. Click it, type, click away. There are no save buttons.
