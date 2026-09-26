# Lists as projects — the Step 1 report

This is an investigation only. **No code has been changed. The build waits for
your approval.**

## 1. How Planning stores lists today

- **Where:** the lists live in `S.planning` (the meta key `planning`):
  `lists[]`, `folders[]` and `prefs`.
- **A list:** `{id, name, color, folderId, sortOrder, defaultView,
  kanbanColumns[], sections[], milestones[], isDefault, createdAt}`.
  `inbox` is a fixed list.
- **Tasks:** these are rows in the `tasks` store (`S.tasks`, keyed
  `'id, day, done'`). Each belongs to a list by `listId` and a section by
  `sectionId`. They also carry `day` (due), `doDay`, `dueTime`, `priority`,
  `timeCategory`, `links`, subtasks, notes, `done` and `doneAt`.
- **A list's views:** list, board (its own kanban columns), matrix and
  calendar. It also has milestones and a filter.

## 2. Everything in the Projects room (`#/projects`, `src/15-projects.js`)

- **The record:** `S.projects` (the `projects` store, `'id, status'`):
  - `{id, name, description, tags[], status, priority, startDate, targetDate,
    phases[], resources, income, linkedSkills[], linkedVisionEra, notes,
    link, images}`;
  - `status` is one of future, idea, active, paused, completed, archived or
    abandoned;
  - `priority` is P1 to P4;
  - `phases` are `{id, name, startDate, endDate, tasks[]}`, and **the tasks
    live inside the project**, not in `S.tasks`. `projectTasks(p)` flattens
    them.
- **Nods:** `S.nods` (`'id, projectId, date'`). A "nod" is a tiny sign of
  progress, with a quick "+ nod" button and a heat grid on each card.
- **Ideation mode:** `S.ideas` (sparks and open questions), rendered by
  `renderIdeation`.
- **The views:**
  - Cards, Board (kanban by status, with drag to move) and Timeline (a Gantt
    of phases);
  - the inventory (search, status, priority, shape, sort);
  - the project panel (phases and tasks, nods, resources, income, linked
    skills, the vision era, images, link);
  - the income strip (monthly income across projects and how diversified it
    is).
- **Deep link:** `#/projects/<id>` opens the panel.

## 3. Where projects are referenced

These are counts of `S.projects`, `projectId`, `links.projects` or
`#/projects` per file.

| File | Refs | What it does with them |
|---|---|---|
| `16-theatre.js` | 27 | Rehearsals "serve" a project (a `projectId` picker), and write `links.projects` on entries |
| `15-projects.js` | 21 | The room itself |
| `16-finance.js` | 8 | Project income as streams (`'proj:' + id`) |
| `18-content-detail.js` | 7 | A piece can link to projects |
| `18-writing.js` | 6 | **Writing Studio:** `links.projects` on a writing entry, and cross-pollination |
| `08-charts-metrics.js` | 6 | Stats and snippets |
| `19-starter.js` | 5 | Seeded projects |
| `19-nav.js` | 5 | The nav entry (Create zone), the house level, the dashboard card (active projects, nods, income, open tasks) |
| `16-rhythm.js` | 5 | The daily rhythm suggests project work (`#/projects/<id>`) |
| `04-core.js` | 4 | `links.projects` in the entry model, `projectTaskRatio` |
| `20-modal-init.js`, `16-review.js`, `16-divination.js`, `09-position.js` | 3 each | Link pickers and review prompts |
| `18-writingstudio.js` | 2 | **Writing Studio:** links |
| `17-tasks.js` | 2 | **Project tasks already appear in Planning's task lists**, as `kind:'project'` rows keyed to `'projects'` |
| `19-time-bridges.js`, `17-habits-bind.js`, `16-reviewflows.js`, `16-lifetape.js`, `16-intuition.js`, `14-skills.js`, `06-db.js` | 2 each | Links, time bridges, migrations |
| `18-import.js`, `18-content-vault.js`, `17-planning-*.js`, `17-map-settings.js`, `16-house.js`, `16-divination-*.js`, `13-journals.js`, `12-boards.js`, `04-scenes.js` | 1 each | Link pickers and small reads |

**The entry model.** Every entry has `links.projects: [projectId]`. Nods,
rehearsals, finance streams and time entries point at a project by its id.
**Any change must keep project ids resolving.**

## 4. The proposed model: a project *is* a list, keeping its id

The Content room already took this approach with the Writing Studio: its
piece *is* the Writing Studio project. The same applies here.

### The list, with a `project` block

```js
// in S.planning.lists
{ id: <the project's own id>, name, color, folderId: <the "Projects" folder>, sortOrder,
  defaultView: 'board', kanbanColumns, milestones,
  sections: [{id: <phase id>, name, startDate, endDate}],       // the phases, as sections
  project: { status, priority, description, tags, startDate, targetDate,
             resources, income, linkedSkills, linkedVisionEra, notes, link, images } }
```

- **A list with a `project` block is a project.** A list without one is an
  ordinary list, and "Make this a project" adds the block.
- **The phase tasks become ordinary Planning tasks:** each is an `S.tasks` row
  with `listId: <project id>` and `sectionId: <phase id>`, keeping its own
  id, text, done, due date and do date. They then get everything Planning
  tasks have: the matrix, reminders, time categories, the stopwatch, Today.
- **Nods and ideas stay** in `S.nods` and `S.ideas`, unchanged, because they
  are keyed by project id and the id doesn't change.
- **Every reference keeps resolving,** because the list id equals the old
  project id: `links.projects`, nods, rehearsals, finance `'proj:'+id`, time
  entries. A small accessor replaces the direct `S.projects` reads:
  - `projectsAll()` returns the lists with a `project` block, in the old
    shape (`{id, name, status, phases, …}`);
  - `projectById(id)` does the same for one.
  The 30-odd call sites switch to those. `projectTasks(p)` reads `S.tasks`
  by `listId`.
- **The room's features become list views:**
  - **Board (kanban by status):** a "Projects" folder view.
  - **Cards and Timeline:** views on that folder.
  - **The panel:** the list's detail sheet, adding the project fields,
    nods, income and linked skills.
  - **Ideation:** a tab in the same folder view.
- **The Projects room is retired from the nav.** `#/projects` and
  `#/projects/<id>` redirect to `#/planning/folder/projects` and
  `#/planning/list/<id>`, so bookmarks and every internal link keep working.

## 5. The migration plan

It is non-destructive and runs once, idempotently.

1. **Snapshot first:** write a local backup of `S.projects` and `S.tasks` to
   the `meta` store (`projectsPremigration`) before anything moves.
2. **Create the folder:** a "Projects" folder (`id:'projects'`).
3. **For each project not yet marked `movedTo`:**
   - create the list with the same id;
   - map the phases to sections and the fields into the `project` block;
   - push each phase task into `S.tasks` (on an id collision, give it a new
     id and record the mapping);
   - mark the project `p.movedTo = p.id` and `p.movedAt`.
4. **Keep the `S.projects` rows as they are,** marked moved. Nothing is
   deleted. Clearing the old rows is a separate step, only after you confirm
   everything reads right.
5. **No Dexie schema change:** lists live in meta, tasks in `tasks`, and the
   `projects` store stays declared. There is no version bump.
6. **Tests against a populated database:**
   - every project id resolves as a list;
   - every phase task is in `S.tasks` exactly once;
   - task and done counts match `projectTaskRatio` before and after;
   - nods, rehearsals, finance streams and `links.projects` resolve;
   - run with Dexie and with MiniDexie.

## 6. Risks, and decisions for you

- **Planning's size.** It gets bigger: projects' dates, phases and the Gantt
  become Planning views. The alternative is to keep a slimmer "Projects"
  page as a *view* of the project lists, with the same data but the old room
  layout. I recommend that alternative, because it keeps the page you know
  and removes only the duplicated storage.
- **Project tasks appear once, not twice.** They already appear in Planning
  as read-only `kind:'project'` rows. After the move they are normal tasks,
  so they can be edited, dragged and reminded there.
- **The Writing Studio** (`18-writing.js`, `18-writingstudio.js`) references
  projects only through `links.projects` and `S.projects` reads.
  - Switching those reads to `projectsAll()` means editing Writing Studio
    files: two lines, read-only lookups.
  - If Writing Studio files must stay untouched, `S.projects` can instead be
    kept as a live mirror, rewritten from the lists on save. That is more
    moving parts. Tell me which.

## 7. The files

| File | Contents |
|---|---|
| `src/17-planning-projects.js` (new; sorts after `17-planning-parse.js`) | The `project` block, `projectsAll`, `projectById`, the migration, "make this a project", the folder views (board by status, cards, timeline), the panel additions |
| `src/15-projects.js` | Reduced to the redirects and the nod and ideation pieces reused by the views, or kept as the slim view (see section 6) |
| `src/06-db.js` | `projectTasks` reads `S.tasks`; the migration is called from `migrate()` |
| The call sites in section 3 | Direct reads of `S.projects` become `projectsAll()`. Writes (theatre, finance) go through `projectById` |
| `src/19-nav.js` | `projects` leaves the Create zone; the route redirect |

---

**Waiting for approval**, in particular on:
1. same-id lists with a `project` block;
2. a slim Projects view, or everything inside Planning;
3. whether the two Writing Studio lookups may change, or a mirror is kept.
