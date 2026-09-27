# The Life Instrument — a guide to every room

This is the user's guide. The [README](../README.md) is for building and maintaining the site; this document is for *living in it*: what each area is for, how to use it day to day, and how the rooms feed one another.

It is long because the house is large. You do not need to read it in order. Start with **Part I**, then read the chapter for whichever room you are about to use. **Part VI** has suggested daily, weekly and yearly rhythms, a map of how the rooms connect, a keyboard reference, a glossary and answers to common questions.

---

## Contents

**Part I — Before you begin**
1. [What this is, and what it is not](#1-what-this-is-and-what-it-is-not)
2. [Your data: where it lives and how to keep it safe](#2-your-data-where-it-lives-and-how-to-keep-it-safe)
3. [Getting around](#3-getting-around)
4. [Your first hour: a setup path](#4-your-first-hour-a-setup-path)

**Part II — Today: the room for every day**
5. [The head of the page](#5-the-head-of-the-page)
6. [Execution — doing the day](#6-execution--doing-the-day)
7. [Looking inward — attending to yourself](#7-looking-inward--attending-to-yourself)
8. [Tasks — the planner](#8-tasks--the-planner)
9. [Habits](#9-habits)
10. [Review — the numbers, the reviews and the days](#10-review--the-numbers-the-reviews-and-the-days)
11. [Time tracking](#11-time-tracking)

**Part III — Create: what you are making**
12. [Content Studio and the Writing Studio](#12-content-studio-and-the-writing-studio)
13. [Brand Strategy](#13-brand-strategy)
14. [Projects](#14-projects)
15. [Repertoire (and Score Study)](#15-repertoire-and-score-study)
16. [Jazz Studio](#16-jazz-studio)
17. [Songwriting Studio](#17-songwriting-studio)
18. [Japanese Studio](#18-japanese-studio)

**Part IV — Identity: who you are, and have been**
19. [The Identity room: People, Values, Skill Tree, Finance](#19-the-identity-room-people-values-skill-tree-finance)
20. [The Lived Record: Journals, Timeline, Library](#20-the-lived-record-journals-timeline-library)
21. [Knowledge Tree](#21-knowledge-tree)
22. [Study Deck](#22-study-deck)

**Part V — Settings and tools**
23. [Settings](#23-settings)
24. [The Import Station](#24-the-import-station)

**Part VI — Putting it together**
25. [How the rooms feed each other](#25-how-the-rooms-feed-each-other)
26. [Rhythms: a day, a week, a month, a year](#26-rhythms-a-day-a-week-a-month-a-year)
27. [Keyboard reference](#27-keyboard-reference)
28. [Glossary](#28-glossary)
29. [Questions and troubleshooting](#29-questions-and-troubleshooting)

---

# Part I — Before you begin

## 1. What this is, and what it is not

The Life Instrument is a private, single-file website for **examining a life and deliberately building one**. It is organised like a house still being built: each area is a *room*, and a single shared record — an **entry** — is the hallway that lets one piece of writing live in several rooms at once. A reflection about a friend, tagged with that friend and with a value it touched, appears in your Journals, on that person's page and in that value's evidence feed, without being copied anywhere.

It has three kinds of room:

- **Today** is where you spend most of your time: the plan for the day, the focus timer, tasks, habits, the morning practice, the evening review, and time tracking. It is deliberately the landing page.
- **Create** holds what you are making: writing and content, projects, piano repertoire, jazz, songwriting, and Japanese.
- **Identity** holds who you are and have been: the people in your life, your values, your skills, your money, your life's record (journals, timeline, library), a personal wiki (the Knowledge Tree) and a spaced-repetition deck (the Study Deck).

**What it is not.**

- *Not a cloud service.* There is no account, no server and no sync company. Everything is stored in your browser, on your device (see §2).
- *Not a scoreboard.* Most rooms record *what happened* and then show it back honestly — including the gaps. Nothing is designed to make you feel productive; the untracked hours, the missed habits and the stale friendships are drawn, not hidden.
- *Not a writer of your content.* Every suggestion in the house — the day's practice plan, the chord labels on a score, the melody generator, the Morning Theatre's session — comes from rules written in the code, and says why. Nothing is generated about your life behind your back. (There is one optional exception you have to switch on yourself: see *Voice & Claude* in §23.)

**Two ideas that run through every room.**

1. **One record, many rooms.** A task in a project *is* a task in Planning and on Today. A piece in the Content Studio *is* its Writing Studio document. A quote in the Library *is* a Quote in your Journals. When you change something in one place, it has changed everywhere.
2. **Add-only where it matters.** Some records are readings taken at a moment — a mood, a position in the Knowledge Tree, a decision in Score Study, a review in the Study Deck. Those are kept as they were; you revise by *adding* a new version, and the old one stays on the record. Words you wrote (a typo in a journal entry) can always be corrected.

---

## 2. Your data: where it lives and how to keep it safe

**Where it lives.** In your browser's own database (IndexedDB), under the address you opened the site from. Nothing is uploaded. The only thing the site fetches from the internet is its fonts (Google Fonts); without a connection it simply falls back to system fonts. The pianos, orchestra, tarot art, curricula and all the rest are inside the one file.

> **Important.** A browser keeps a separate database for each *address*. The same site opened from a file on disk, from `localhost`, and from the published web address are three different houses. To move between them, export a backup from one and import it into the other.

**Backups** (Settings → *Data & backups*):

- **💾 Export backup** downloads `backup-YYYY-MM-DD.json` — everything, including the Study Deck and Knowledge Tree. It does *not* include audio recordings (your practice takes and the recordings you sync to scores): those are private copies that stay on the device.
- **Import backup** replaces what is in the house with the file (it asks first). It is a *restore*, not a merge.
- If you have not exported for 14 days, a quiet banner reminds you. Make exporting a weekly habit — it is the only copy of your life that exists outside this browser.

**The same life on two machines** (Settings → *Data & backups*). There is no account, so the site cannot carry data between devices itself. Instead:

1. On each machine, choose a folder you *already* sync (iCloud Drive, Dropbox, Google Drive, Syncthing, even a USB stick) with **Choose the folder**, and give the machine a name.
2. Press **Exchange now** on one machine, let your sync service carry the file, then press it on the other.
3. The exchange is per *store*: practising on the tablet and tidying tasks on the laptop are not in conflict and both are kept. Only a store changed on *both* sides since the last exchange is a real conflict, and you are asked which to keep. A backup is written beside the sync file before anything is applied.

Browsers without folder access can use **Merge a sync file by hand…** and **write this machine's file out**.

**Deleting.** Deleting anything happens immediately, with a five-second **Undo** in the toast at the bottom of the screen. There are no "are you sure?" dialogs — the undo is the safety net. **Clear all data** (Settings) is the one exception and asks first.

**Installing.** Served from the web, the site can be installed to a phone or desktop home screen and then works fully offline.

---

## 3. Getting around

### The sidebar

- **Today** sits alone at the top.
- **Create** — Content Studio, Projects, Repertoire, Jazz Studio, Songwriting Studio, Japanese Studio.
- **Identity** — Identity (People, Values, Skill Tree, Finance), Lived Record, Knowledge Tree, Study Deck.

Zones fold, the whole sidebar collapses to icons (the « button), and both are remembered. You can drag rooms between zones in **Settings → Navigation zones**. On a phone, a bottom bar holds the most-used rooms and **More** opens the full menu.

Some rooms you may remember as separate pages now live *inside* others: **Planning**, **Habits**, the **Review** (formerly the Compass) and **Time tracking** are views of Today; the **Timeline** and the **Library** are views of the Lived Record; **People**, **Values**, the **Skill Tree** and **Finance** are tabs of Identity; the **Writing Studio** opens from a piece in the Content Studio. All their old addresses still work.

### The top bar (top right)

| Button | What it does |
|---|---|
| **search** (`/` or `⌘K`/`Ctrl+K`) | Searches everything: entries, values, skills, projects, habits, people, pages. |
| **⛶** (`Z`) | **Focus mode**: this page full screen, with nothing else on the glass. On Today's Execution view and in Tasks, focus mode becomes a *desk*: the stopwatch, today's tasks and the notes for each sitting. `Esc` brings everything back. |
| **?** | The keyboard card for the room you are in. |
| **🔕 / 🔔** | Interaction sounds on or off (a synthesised singing bowl — clicks, completions, deletions). |
| **🌊** | Ambient sound: brown/pink/white noise, rain, ocean, fireplace, café, forest, library, a slow generative piano, a music box. |
| **☀ / ☾** | Light or dark. |
| **⚙** | Settings. |

### The ＋ button (bottom right, or press `N`)

On most pages ＋ first offers what makes sense *there* (on a journal, a new entry of that type; in Projects, a project). The full **speed dial** lets you add anything from anywhere — a task, a quick note, an unfinished thought, a journal entry, a memory, a quote or saved link, a values snapshot, a skill (guided or quick), a person (guided), a Library entry (guided), an income stream (guided), a Timeline chapter (guided), a project, a content idea. Type to filter the list, `Enter` for the first match.

### Editing: there are no save buttons

- **Everything that looks like text is editable in place.** Click it, type, click away. A small "saved" pulse confirms it.
- **Living view and Workshop view.** Detail pages (a skill, a Library work, a person) open in *Living view*, which hides every field you have not filled, so a record reads as a record rather than a form. Press the **◉ living / ⚙ workshop** button (on a skill or a Library work, `E` does the same) to see every field with its prompt, ready to fill.
- **The Additional box.** Every kind of record — every journal type, a Library work, a person, a skill, a project, a habit, a task, a value, a Timeline chapter — has a box called **Additional** for anything that has no box of its own. It is also where a spreadsheet import puts columns that match no field, under the column's name.
- **Speak and tidy.** Long text fields carry **🎙 speak** (the browser's own dictation — no audio is kept, only the text) and **✧ tidy** (removes filler words, restores punctuation and paragraphs; done locally).
- **Detail panels** open on the right. Drag their left edge to resize (remembered), press ⤢ to widen, double-click the edge to reset.
- **Back** returns you to the exact scroll position you left.

### Hashtags, links and pictures

- Type `#something` in any entry's body (or the Hashtags field). `#/tag/something` gathers everything carrying it, and the Content Studio's writing desk uses tags to pull source material beside the page.
- The **Connect this entry** fold on every entry links it to stages, sub-stages, threads, values (with polarity: a click links it as *embodied*, a second click flips it to *betrayed*, a third unlinks), skills, projects and people. Those links are what make the entry appear in the other rooms.
- Any project, skill, value, person, entry or Timeline sub-stage can carry **images**; the first becomes the background its card is printed on. Drag to reorder.

### Worked examples

If the house is new, it may contain **worked examples**: records titled "Example · …" and tagged `#example`, at least one in every room, showing what a well-used room looks like. Read them, then remove them all at once in **Settings → Worked examples → Take them out**. Nothing you wrote is touched. (The separate **starter set** — skills, projects and values drafted from things you said — is removed the same way under *Starter set*.)

---

## 4. Your first hour: a setup path

You can start anywhere, but this order gives each room something to work with.

1. **Settings → Atmosphere.** Light or dark, sounds, and the ambient bed. **Day & sleep → The day turns over at**: the hour after which a late night still counts as "today" (default 4 AM).
2. **Identity → Values.** Name the values you want to live by (up to ten) and rank them. Take one **congruence snapshot** (0–100 per value: how well did you live it this week?). Everything that asks "is my life lined up with what I say matters?" reads these.
3. **Identity → People.** Add the five to fifteen people who matter most. Put each in a circle (Core, Close, Warm, Orbit, Aspirational) and give the ones you want to stay close to a contact cadence (weekly, monthly…).
4. **Identity → Skill Tree.** Add the skills you are building. Mark two or three *In focus*; the rest *Active*, *Up next*, *Future* or *Resting*.
5. **Projects.** Add what you are actually building. Each project automatically becomes a list in the planner.
6. **Today → Tasks.** Put tomorrow's work into lists, give it do-dates and estimates.
7. **Today → Habits.** Add two or three habits — no more to begin with.
8. **The Lived Record → Timeline.** Sketch the chapters of your life so far (years, a one-character name, a line). Memories you write later land on them.
9. **Tonight, on Today:** press **◑ Plan tomorrow**. Tomorrow morning the day will open already decided.

After a week, open **Today → Review** and do your first **weekly review** (§10). That is the moment the house starts to pay you back.

---

# Part II — Today: the room for every day

Today is the page the house is built around, and the one it opens on. Across the top is a switch between six **views**:

| View | What it is for |
|---|---|
| **Execution** | Doing the day: the plan, the focus timer, today's tasks and habits, and planning tomorrow before you sleep. |
| **Looking inward** | Attending to yourself: the check-in, the Morning Theatre, your pinned passages, your sacred space (stillness, divination, the house) and unfinished thoughts. |
| **Tasks** | The full planner — every list, the matrix, the calendar. |
| **Habits** | Every habit: the dashboard, today's check-in, the analytics. |
| **Review** | The numbers about your life, the periodic reviews, and every day you have lived in the house. |
| **Time tracking** | Where the hours actually went. |

The house remembers which view you were last in. Each view has an address of its own (`#/today/tasks`, `#/today/habits`, `#/today/review`, `#/today/time`), so a link can open it directly. Under the switch, a small **index** jumps to each section of the view you are in; every section folds, and whether it is open is remembered.

**Why Today matters to every other room.** Today is where the rest of the house comes to you, so you do not have to go and check on it:

- a task you gave a *do date* in any project list appears here on that day, and the minutes you time on it flow back to the project as a **nod** and, if it is linked, to a skill's hours;
- a **letter** you sealed a year ago, a **decision** whose review date has come, a **reminder**, a Library **quote** or a **reading** you pinned, **Study Deck** cards that are due, the **Knowledge Tree**'s tending card, and a **skill milestone** within a month — all surface here;
- what you write here travels outward: the check-in feeds the Review's charts and the Days archive; the Morning Theatre writes manifestation and gratitude entries into the Lived Record and structural tension back onto a project; an unfinished thought is already a journal entry; a stillness session can hand its insight to the intuition log.

In other words: the other rooms are where things are *kept*; Today is where they *meet you*.

## 5. The head of the page

Above both day views:

- **The date**, the season and the moon. After midnight but before your day-boundary hour (4 AM by default), it says *"still Tuesday"* — the night belongs to the day you were living.
- **"Yesterday you set out to…"** — last night's intention, if you set one.
- **I woke up at —.** Press it and set the time. It is never filled in automatically: opening your phone is not waking up. The wake and sleep times feed the sleep chart in the Review.
- **☾ record a dream / NONE.** Dreams fade within minutes, so the place to catch one is here, beside the hour you woke. *None* is a real answer ("I don't remember dreaming") and keeps the dream calendar honest about which nights were asked about.
- **Reminders** whose day has come (see §8).
- **A letter from you has come due** — a sealed letter (§20) reaching its opening date appears here, whichever view you are in.
- **⏱ where today went** — once anything has been timed today, a one-line summary appears; press it for the day's timeline.
- At the very foot of the page: **I went to sleep at —**. Late at night a *Ready to close the day?* card offers **I am going to bed now**, which files your bedtime against the right day.

## 6. Execution — doing the day

**Today's plan.** What you decided last night (see *Before you sleep*): the why, three intentions, the first move, and the risk ("in the way"). If this week has a plan, its theme, goals (with how much of each goal's work is done) and the win you are after are shown here every day, so a Sunday goal is still answerable on Wednesday.

**Focus.** The focus timer and the record of today's sittings.

- The clock itself lives in the **foot of the sidebar** (and floats as a small circle on every page when it is running) so it follows you between rooms.
- **Start a sitting** by dragging a task onto the clock, or by pressing a task's estimate (the "45m" chip beside any task, anywhere in the house) — that starts a countdown of that length on that task.
- Choose **countdown** or **stopwatch** before you start; they answer different questions and the choice locks while the clock runs.
- **Pausing is a break.** A break asks what it is for; while a sitting runs, a second field asks what you are actually doing. Both are written down *while it happens* — multi-line notes for each sitting and each break.
- **Finishing the task** (ticking it here, in any list, or in the timer) ends the sitting, records the minutes against the task and sets off a small celebration. Minutes accumulate against the estimate ("13m of 15m").
- The **ledger** under the clock lists today's sittings: when, how long, on what, what you did, and every break with its note.

**Today's tasks.** Everything due today, done-on today, or carried over.

- The count reads *"2 of 5 done"*, with **bonus** tasks (things you added beyond the plan) counted beside it, never in it.
- Filter by list with the chips across the top.
- Each task shows **›** (break it into steps), **✎** (rename), its estimate (press to start a sitting), **✦ / ✧** (compulsory or bonus — press to switch), **not today** (moves the do-date off today without touching the deadline), **×** (delete, with undo).
- The quick-add line accepts the planner's full grammar (§8). **pull in ↓** brings in work from your lists; **all of it →** opens the planner.
- **Carried over** — work that was due, or planned for, an earlier day and is still open. **Bring to today** moves the day you mean to *do* it; the deadline stays where it was, because a thing owed on Monday is still late.
- The tick in the section's header is the "tasks reviewed" step of your morning, with its time stamped.

**Study and Tree cards.** If the Study Deck has cards due, a line offers *five minutes* of them (not the whole queue — that is how study habits die). If the Knowledge Tree has a tending card for today, it appears too.

**Today's habits.** The rings for today's habits, the **account** of any you have not said anything about ("Nothing said about 2 of them — say what happened →"), **＋ add habit**, **archived**, and **the whole grid →** (the Habits view).

**Skill milestones within 30 days** — if a skill has a milestone coming up, it is listed here.

**Time spent writing** — on a day you wrote entries, the *actual* minutes spent writing them (time away from the form is not counted).

**Before you sleep.** The day after this one is decided here, the night before:

- **◑ Plan tomorrow** — a short guided plan: the three that matter, one thing to protect, when your energy will be high and when it will drop, one obstacle with an *if — then*, the first move, and one thing from today to let go of. Every field saves as you type. Tomorrow morning it appears as *Today's plan*.
- **🗓 Plan the week / next week** (highlighted on Sunday evening) — the week's theme, goals, and the work each goal gathers, with the milestones coming up beside it.
- **☾ Evening review** — the guided close of the day (§10).
- **Review chips** — on the last day of a week, month, quarter, half-year or year, a button for that review appears here. A cycle you ignore stays listed until you do it or dismiss it ("not tonight" is remembered for that period only).

## 7. Looking inward — attending to yourself

**Daily check-in.** Its tick is the first step of your morning.

- **Today's intention** — one thing to give attention to (prefilled if you planned the day last night).
- **Mood right now** — Open, Tender, Charged, Settled or Flat.
- **How is today going?** — one honest sentence, or as many as it takes.
- **Energy in four dimensions** — Physical, Emotional, Mental, Spiritual, each 1–5.
- **Emotional set-point** — where you are on Abraham Hicks' 22-step emotional guidance scale (1 Fear/Despair … 11 Disappointment … 22 Joy/Freedom/Love).

These readings feed the Review's energy and set-point charts and the Days archive. A reading is a reading: the words can be edited later, the numbers are kept as you gave them.

**Morning Theatre.** A practice of rehearsing the future you are building — drawn from Maltz (*Psycho-Cybernetics*), Hill (*Think and Grow Rich*), Hicks and Fritz (structural tension). It opens with one question: **How are you feeling about your visions right now?** — 🔥 On fire, 🌫 Foggy, 😤 Resistant, 🙏 Grateful, ✨ Inspired — and how long you have: **5, 15 or 30 minutes**. From that it assembles a session of two to four practices, one to a screen, about one of your projects (a rotation makes sure every project gets its mornings, not just the favourite). The practices:

| Practice | What it asks of you |
|---|---|
| **Self-image script** (Maltz) | Rewrite, in the present tense, the person who already lives this. |
| **Winning feeling** (Maltz) | Recall a real success and feel it now, in the body. |
| **Vision board** | Look at the images you have pinned to the project — anything in the house can be pinned. |
| **The scene** | Walk into one concrete moment of the future, step by step, through the senses. |
| **Scripting** | Write the day as though it has already happened. |
| **Structural tension** (Fritz) | Hold the vision and the honest present side by side; the tension is written back onto the project. |
| **Gratitude line** | Give thanks for what has not arrived yet. |
| **Focus wheel** | For the days you do not believe any of it: find the nearest thought that feels better. |
| **Definite chief aim** (Hill) | Read your aim aloud — it closes every session. |

What you write cross-posts into the Lived Record (as manifestation or gratitude entries). **⚙ Manual mode** lets you choose the practices yourself. A **21-day tracker** counts the practice across a cycle (*Mark today's practice*, *Begin a new 21-day cycle*), and **Feeling resistance?** offers a softer way in.

**Pinned.** Some things you write are records; some are *messages* you need to hear again — a reading that named what you were avoiding, a quote that keeps being about your life, a reflection you have not yet acted on. Press 📌 on any entry (in any room) and it gathers here, to be reread each morning. Unpin when it has done its work.

**My sacred space.** The receptive half of the practice, drawn as a house you walk through. Two views: **the house** and the plain controls (**what to do here** explains it).

- **The sanctuary** (upstairs): the **cushion** opens stillness; **your quiet room** is the sanctuary you build once and return to; the **table** holds the four divination systems — **Tarot**, **I Ching**, **Oracle cards** and **Charm casting**.
- **The main room**: the **shelf** (your Library), the **card box** (Study Deck), the **desk** (the writing shelf of the Content Studio), **the band** (your projects), the **medicine cupboard** (Values), the **crystals** (charm casting), the **bar** (the Drink Naming Ceremony — draw a card and its keywords decide a drink, which you name and keep on a menu; the one purely playful thing in the house), the **nook** (reflections), and synchronicities.
- **The garden**: herbs (Japanese Studio), the fire (letters), a chest (the Timeline's artefacts), the tree (Skill Tree).
- **The roof**: the sky (Values), the stars (People), a telescope (manifestations), the plans (the planner).

The house fills as your record fills: books on the shelf are books you logged; the candles burn to how recently you sat; the cushion keeps the mark of being sat on; a three-day streak grows a vine with a leaf for each day.

- **Stillness** has four practices, each with a length, a streak and a depth reading: **Meditation** (a timer and a breathing circle, nothing else), **Breathwork** (four counted patterns, drawn as they run), **Body scan** (Maltz's four mental pictures, walked through slowly) and **Sanctuary**. Every session ends by asking what you noticed in the body and anything that arrived — which can go straight to the intuition log.
- **Divination** is a mirror, not a fortune: it deals a symbol and asks what you make of it, and keeps your answer.
  - **Tarot** — the 1909 Rider–Waite–Smith deck in its printed colours. A reading is a small ceremony: settle, shuffle, choose from a fan of backs, turn. Twenty spreads in five groups (a card before breakfast; three-card frames; five-to-seven; the long classical layouts such as the Celtic Cross and the twelve houses; occasions), each laid out in its own shape, with a sentence for each position. You can design your own spreads. Reversals can be switched off.
  - **I Ching** — three coins or fifty yarrow stalks; the hexagram is built line by line with its changing lines, and the reading gives the Judgment, the Image and the lines at length.
  - **Charms** — thirty small symbols thrown onto a round cloth. Nothing is in a position: what matters is the ring each landed in, the quarter it faces, and what fell beside it (sixty pairings are written out). Face-down charms are read only if you turn them. Add up to ten charms of your own.
  - **Oracle cards** — a single card and its line.
  - **A reading on paper** — type in a reading you did with a real deck ("3 cups", "knight of swords") or drag charms to where they actually fell; it gets the same reading, marked as from paper.
  - **The directory** — all 78 cards, 30 charms and 64 hexagrams with everything they mean *and* every time each has come up for you: in which spread, which way up, what you asked and what you wrote afterwards.
  - A kept reading is an entry in the **Divination** journal.
- **The intuition log** — record a hunch *before* your conscious mind tidies it: its channel (a feeling, an image, a voice, a body sense…) and strength, and what would confirm or deny it. Come back later and mark what happened (it only counts as a miss if you could tell). Over time you learn your own hit rate, by channel and by the state you were in.

**Decisions ready to grade** — decisions from the decision journal (§20) whose review date has arrived.

**Unfinished.** **＋ dump a thought** captures a rough line in one keystroke when there is no time to write properly. It is a real entry from the first keystroke — searchable, backed up — carrying a flag that says it is not finished. The list stays at the bottom of this view, oldest first, until *you* call each one finished; nothing expires it. The count rides in the index at the top so you can see it from anywhere.

## 8. Tasks — the planner

The planner is where work is *moved*. It has a sidebar of where work lives and a workspace you can read three ways.

**The sidebar.**

- **Smart lists:** **Today** (due today, and anything late), **Tomorrow**, **Next 7 days**, **All tasks** (every open task, whatever list it is in), **Completed** (the last thirty days).
- **Folders and lists.** Group lists into folders (＋ folder, ＋ in a folder for a new list). The **Projects** folder holds one list per project (§14).
- **Tags** — every `#tag` in use, with counts.
- **⚟ Filter** — narrow by list, tag, priority, dates or steps.
- **Inbox** — everything written down and not yet placed. Empty it into lists regularly.
- **🛒 Shopping list** — things to buy, kept out of the Inbox and the dated views. "milk, eggs, bread" is three things. Ticking puts an item in the basket; clearing the basket throws the bought things away. Any task can also be ticked *on the shopping list* from its panel and stay in its own list.
- **🔔 Reminders** — things to be reminded of at a day and, if it matters, a time. From *show it from* days before (one by default) a reminder sits at the top of Today and floats over every page until you tick it; at its time the browser can ring once (if you allowed notifications). Any task can be made a reminder from its panel.

**Three views** (keys `1`, `2`, `3`):

- **⊞ Matrix** (the default) — the Eisenhower matrix: *Urgent & important → do first*, *Important → schedule*, *Urgent → delegate*, *Neither → let go*. Drag tasks between quadrants. Unplaced tasks wait in a tray beside it. The matrix answers "does this deserve today at all?"
- **☰ List** — what is next, in order; drag to reorder.
- **▦ Calendar** — when. Drag a task to a day.

**Milestones** run along a dated strip above every view. A task can name the milestone it is working towards. **Pressing a milestone narrows every view to its work** (press again to let go); opening it lists that work and what is left.

**Adding a task — the quick-add grammar.** Type a sentence; the planner reads it and shows back what it understood before you commit:

| Write | Means |
|---|---|
| `tomorrow`, `friday`, `next week`, `15 Jan`, `2026-01-15` | the due date |
| `at 2pm`, `at 14:30` | the time |
| `!high` `!med` `!low` (or `!3` `!2` `!1`) | priority |
| `#work` | a tag |
| `^Work` or `^"Deep Work"` | the list |
| `~45m`, `~2h` | the estimate |
| `*daily`, `*weekly`, `*weekdays`, `*every 2 weeks` | a repeat |
| `/ anything after a slash` | the description (not parsed) |

Example: `Prepare contract review tomorrow at 2pm #work !high ^Work ~2h`.

**A task, opened** (click it). Everything saves as you change it:

- **Title** and a **done** tick; **priority** (four dots: none, low, medium, high).
- **Due** (with an optional time) — the day it is *owed*. **Do on** — the day you mean to *sit down with it*, usually earlier; this is what puts it on Today. **Starts** — for things that cannot begin before a date. A task can have neither date, either, or both.
- **List** and **section**, **shopping** and **reminder** switches (with *show it from*), **time category** (which part of life the minutes belong to in Time tracking), **milestone**.
- **Tags**, **how long** (the estimate, which the timer counts down), **notes** (markdown), **Additional**, **subtasks** (each can be timed and ticked on its own; finishing a step does not close the task), **repeat**, and the record of sittings on it.

**Keys** (when not typing): `N` add a task, `1`/`2`/`3` switch view, `T` today, `E` open the first task, `F` go to the focus timer, `S` the statistics (in Review), `?` all of them.

## 9. Habits

Habits here are **energy rituals, not willpower**. There are two kinds, and they are treated differently:

- **Building** — a behaviour you are making automatic (after Loehr & Schwartz: a precise behaviour at a precise time, fuelled by something you care about, which after 30–60 days stops costing anything).
- **Breaking** — a habit you are outgrowing (after Maltz: you do not tear it off, you become someone it no longer fits). A breaking habit is tracked as a *replacement*, a map of what sets it off, and a log of the times the urge came and did not win.

**Three views:**

- **▦ Dashboard** — every habit as a card; filter by building/breaking, category and energy dimension; the day's balance across Physical, Emotional, Mental and Spiritual at the top.
- **◉ Today** — only what is due, grouped by when in the day it belongs.
- **◫ Analytics** — ninety days of heat, a health score per habit, the milestones reached and the longest runs.

**Checking in.** Tap a habit to mark it kept. If you did not keep one, say so — **Ran out of time, Too tired, Forgot, Chose something else, Not where I could, Unwell** — with an optional note. A missed day with a reason is information; an unexplained gap is just a gap. Today's Execution view lists the habits you have not said anything about yet.

**A habit's page** (click its card). Every field is multi-line:

- *Why* — **Why this matters**, **What it looks like fully lived**, **What is lost by not doing it**, **Seeing yourself do it**, and the **identity** line ("I am someone who…" / "I am no longer someone who…").
- *When, and what sets it off* — **The cue**, **The set-up** (the environment), **Before** and **After** (the rituals around it), frequency, time of day, stacking after another habit, and optionally a time-tracking category with minutes a day.
- *How it is going* — **On the worst day** (the minimum version), **On a good one** (the ideal), **Best ever** (a personal best with a unit), **Target each time**, **What follows it** (the reward), **Who knows** (self, partner, public), **How hard it is** (1–5).
- For a breaking habit: **What I do instead**, **What it costs me**, **When the urge hits** (your protocol), a map of **triggers** (emotional, situational, social, temporal, environmental, each with intensity and a strategy) and an **urge log**.
- Links to **Values**, **Skills** and **Projects**, and the **Additional** box.

**Milestones**: first week (7), the Maltz threshold (21), one month (30), Loehr's acquisition point (60), a quarter (90), a year (365). Each is marked when reached.

**Retiring a habit.** Once a habit has held for **21 days** running, it can be **retired**: it has become automatic and no longer needs a daily tick. It is kept, with the run it retired on, and can be tracked again at any time. **Archive** is for habits you have stopped altogether.

## 10. Review — the numbers, the reviews and the days

The Review brings together what used to be three rooms: the Compass charts, the planner's statistics and the written reviews. It is where you *look at* your life rather than live it.

**Sleep, and the shape of the waking day.** One bar per day, midnight to midnight, dark where you were asleep. The waking gap is filled with the time blocks you logged (commute, meals…), so what is left — the part of the day you actually had — is visible. **Hours made use of** comes from the time you tracked.

**Where am I right now?** Two developmental lenses, both *read from data you already logged* rather than a quiz:

- **Maslow's seven levels** (Physiological, Safety & Security, Love & Belonging, Esteem, Cognitive, Aesthetic, Self-actualization, Self-transcendence), each scored from live readings — sleep and physical habits, runway, contact with people, skill practice and writing, media resonance and reflection, creative work and awe. Missing data is left out rather than counted as zero. The thinnest level is the one to act on, and each points at the room where you would act. You can override a level; the gap between what the numbers say and what you feel is worth recording.
- **The Spiral lens** — eight stages, each given a resonance strength from your behaviour.
- **Log a check-in** jumps to the check-in.

**The long view** — nine readings, over months rather than days: the ten values (radar), congruence over a lifetime, energy and set-point over 30 days, habits over 12 weeks (heat grid), skills (hours in 30 days), projects (nods this week), the record (entries), people within their cadence, and money (current against target). Each links to its room.

**Tasks and focus** — finished today, kept to the date, overdue now, from writing it to doing it (how long tasks wait), focus today, intervals, the day scored, where the focus went, ninety days of focus, and breakdowns by priority, list and tag.

**Reviews.** A review here is not a blank page headed "how was your week". Each is a guided sequence of steps, each step already filled with what the house knows about the period, so you read before you write. **＋ a review** starts one for *yesterday*, *this week* or *this month*; the rest arrive on their own as chips on Today when a cycle closes.

| Review | What it walks you through |
|---|---|
| **Morning** | Sit quietly; visualise for fifteen to twenty minutes; read your Definite Chief Aim aloud; place yourself on the scale; mark the practice. |
| **Evening (daily)** | The rings before the day closes; tonight in four dimensions; where the set-point landed; what actually got done; anything else from today; plan tomorrow. |
| **Weekly** | What you kept and are keeping; the week in Japanese; the week at the score; where the hours went; **the week, in shape** (the Life Tape, below); the habits; a congruence snapshot; which dimension got the week; the week against the lists you made; anything else. |
| **Monthly** | The month at once; the milestones you named; the habits across the month; what the month was made of; energy and mood over thirty days. |
| **Quarterly** | Ninety days at once; re-rank what matters; re-read one past stage — does it still feel true?; revisit flagged synchronicities; what is going quiet; the five closest people; the money, honestly. |
| **Half-year** | Six months on the tape, and the same questions at a longer range. |
| **Annual** | The year, all of it; mint the year into the Timeline; the compass January to December; who did you become this year?; the constellation a year on; the year in money; three things the coming year is for. |

**The Life Tape** appears inside the reviews: everything you actually lived — entries, nods, interactions, habits, time — assembled by date without being logged twice, at six zooms (a day you can read, a week, a month, a quarter, a half, a year). The **‹ › arrows** move to the previous and next period; press a day to read it in full, then go back to the week.

Every review ends with **anything else worth capturing?** — a link for each kind of entry. Adding one keeps the review open behind it.

**The Days.** Below the reviews, every day you put something into, grouped by month, each with a one-line summary ("1/1 done · 1h 15m focused · 0/2 kept · 2 written"). Open a day to read it whole: the intention, the check-in, the tasks, the habits, the sittings, what you wrote. Words can be corrected; readings are kept as given.

## 11. Time tracking

One clock for the whole house, so an hour is timed once and shows up everywhere it matters.

- **The pill** in the corner of every page: press it to start immediately with no label (say what it was afterwards), or press the arrow to start with a description and category. It survives page changes and redraws.
- **＋ Start the clock** and **＋ A sitting, after the fact** ("two hours of reading you forgot to time").
- **Rooms start it for you**: stillness, the Study Deck queue, writing sessions, practice at the score, the focus timer. Two rules: nothing starts a second clock if one is running (the hour counts once), and nothing stops a clock it did not start.
- **Day** — a bar from midnight to midnight with the tracked stretches coloured and the untracked hours drawn, not hidden. **Week** — seven of those bars stacked. **Reports** — how much of a period went on one thing. **Categories** — the parts of life your time is sorted into (each task can carry one; see §8).
- **What it feeds**: time on a project writes a **nod** into that project; time on a skill adds hours to it; time with a person is recorded in your history with them. Correcting an entry later corrects these too, rather than adding more.
- Settings → *The clock*: whether walking into a room starts the clock, whether the corner timer shows, the default category, how minutes are read out (exact times are always kept underneath).

---

# Part III — Create: what you are making

## 12. Content Studio and the Writing Studio

The Content Studio is where a thought becomes a published thing. The Writing Studio is where the actual writing happens. They are **one record**: a piece in the Content Studio *is* its Writing Studio project, so nothing is copied and nothing can drift — the word count is counted off the draft, the notes are the draft's scratchpad, and "open in the Writing Studio" is a link to the same entry.

### 12.1 The pipeline

Every piece sits at one stage:

| Stage | Meaning |
|---|---|
| **Idea** | a thought that will not leave |
| **Seed** | worth keeping, not yet shaped |
| **Outline** | the bones are down |
| **Draft** | being written |
| **Refining** | being made better |
| **Ready** | finished, waiting to go out |
| **Published** | out in the world |
| **Archived** | put away, not thrown away |

**Four views** (keys `1`–`4`):

- **▥ Pipeline** — a column per stage; drag a card to move it on. Widen columns by dragging their edges.
- **▦ Calendar** — what is scheduled to go out, and when.
- **▤ Shelf** — everything, filterable by stage, kind (essay, newsletter, thread, short story, poem, reflection, guide, note), where it goes (blog, Substack, Twitter, LinkedIn, Medium, private, several), theme, length, and whether it is *drawn from life*. The **Compost Heap** is reached from here.
- **◫ Numbers** — output over time, words, how long pieces take to move through the stages.

**＋ Catch an idea** (`N`) is one line and a keystroke; **＋ Start a piece** makes a fuller record. **themes** edits the vocabulary this room thinks in (Identity, Creativity, Mastery, Freedom, Japan… — your own).

**A piece, opened** (click a card). This panel is management, not craft; the biggest button in it — **open it and write** (`W`) — takes you to the Writing Studio. It holds: the stage; the kind and destination; **the project it serves**; **themes**; **tags**; **what sparked it**; the steps to publication (a checklist including the published URL); **drawn from your own life** (the journal entries, Library works and Timeline events it came from — ＋ links more); **quotes pinned to it** (＋ finds one in your Library or the Book Vault); **Book it in Planning** (makes a "Write: …" task linked to the piece, in your Inbox); **Compost** (puts a fragment of it on the heap to rot down and come back); **Duplicate**.

### 12.2 The Writing Studio

Open a piece to reach the desk. Three columns:

- **Left — the binder and the research drawer** (fold with **◧ drawer**).
- **Middle — the page.**
- **Right — the Structure Board** (fold it too).

**The binder** is a tree of folders and documents, each with its own text, synopsis, notes, status and snapshots, so a long piece can be restructured. Read it four ways (`1`–`4`): **✎ Editor** (one document), **▤ Corkboard** (synopsis cards you rearrange), **☰ Outliner** (the metadata in columns), **▦ Manuscript** (every document stitched into one continuous draft you can still edit in place).

**The Structure Board** has three tabs:

- **Outline** — the sections of the piece; press one to jump to (or create) its heading in the text.
- **Threads & Arguments** — the logic of the piece before the prose: a sequence of claims or **beats**, each able to cite **evidence** from what you have pinned in the drawer.
- **Connections** — what the piece draws on: its **linked dimensions** (stages, threads, values, skills, projects) with an editor to change them, and other pieces that share its tags or dimensions.

**Tools on the page:**

- **Aa** — typeface, size and leading for the desk, kept for everything you open.
- **R** (or `⌥R` mid-sentence) — **Readability**: sentences a reader will slow down on are coloured (after Hemingway). Nothing is corrected for you.
- **Progressive summarisation** (after Tiago Forte): select a passage and press `⌥⇧1` *worth keeping*, `⌥⇧2` *the core of it*, `⌥⇧3` *the line I'd quote* (`⌥⇧0` takes the marks off). The marks are `==`, `===`, `====` around the text, so they survive anywhere. **Distil** shows only the passages at or above a layer — a long draft reduced to its best lines.
- **W** — typewriter scrolling (the line you are on stays in the middle).
- **C** — take a snapshot of the document (restore or compare later).
- **X** — compile and export the manuscript as Markdown, plain text or HTML.
- `N` new document, `⇧N` new folder, `[` `]` fold the drawer and the board.
- A bar at the top says where the piece is in the Content pipeline, so you can move it on without leaving the desk.

### 12.3 Using your journals, Library and life while you write

This is where the whole house pays off. Everything you have written anywhere can be brought beside the page. There are five ways in, from the most automatic to the most deliberate.

**1. Let the drawer find it — tags and dimensions.** The research drawer's shelf **from your tags & dimensions** automatically gathers every entry that shares a hashtag with the piece, or is linked to the same value, thread, skill or project. So:

- give the piece its **tags** (in its Content panel, e.g. `#discipline #japan`) and its **linked dimensions** (Structure Board → Connections — e.g. the value *Mastery*, the thread *Learning to be seen*);
- and every reflection, memory, dream, decision, gratitude or quote you ever tagged `#discipline`, or linked to *Mastery*, appears in the drawer, newest first.

This is why tagging and linking entries as you write them (the *Connect this entry* fold, §3) matters: it is what makes them findable by your future writing.

**2. Search everything from the drawer.** The drawer's search box looks through every entry's title and body, every Library work (its one-line capture and creator), every quote you have kept in the Library, and the compost heap — by keyword, `#tag` or type. Results appear right there with a **pin** button.

**3. Send things to a piece from wherever you are — the ✂ button.** Every entry card in the house, and every Library work, carries **✂**. Press it while reading an old journal entry, a quote or a book, and choose which piece it belongs to (or **＋ new project**, or *Unassigned — the Compost Heap*), with an optional note ("use as the opening anecdote"). It is pinned to that piece's drawer, waiting for you.

**4. The Library and the Book Vault, by theme.** Two further shelves in the drawer gather by the piece's **themes** rather than its tags:

- **from your Library, by theme** — works whose notes match the piece's themes, the ones that *changed* you or *live in* you first, with **quote what it installed →** and each kept quote with **pull into the draft →** and **pin to the piece**;
- **from the vault** — the Book Vault's passages indexed by theme. Quotations are pulled in with their citation; paraphrases are always labelled *paraphrase of …* inside the draft, so a summary can never later be mistaken for something an author wrote.

**5. The bridges from the other rooms.** A long reflection, memory, synchronicity, manifestation, question, dream or life event (fifty words or more), a Library work that *changed you*, or a Timeline event with something *installed* in it, quietly offers **✍ add as a seed** — "This feels like something worth writing about." One press makes a Seed in the pipeline, with the source linked both ways; the entry then shows **used in *that piece*** instead. The prompt can be dismissed forever per entry, and turned off in the Content settings.

**Putting material into the draft.** In the drawer, everything under **pinned to this project** has **insert →**, which drops it into the page at the cursor as a blockquote with an attribution — for example:

```
> I kept the medals in a shoebox. They were never for me.
> [From: Memory, 3 Mar 2019]
```

You can also **drag** any drawer item onto the page. Pinned items can carry a note, can be unpinned, and can be cited as evidence on a beat in the Structure Board. Below them, **you might not have considered** suggests entries that share tags with what you have already pinned — the quiet connection you had forgotten you wrote.

**The Compost Heap.** Fragments that do not have a home yet: a line, an image, a phrase. Anything can be composted (from a piece's panel, from ✂, or typed on the heap), tagged, and later assigned to a piece — where it shows in that piece's drawer — or promoted to a seed.

> **A worked example.** You have been journalling for a year. In March you wrote a reflection about quitting swimming (tagged `#discipline`, linked to the value *Mastery*); in June a memory of your coach; in September a quote from a book on practice, kept in the Library. You catch an idea — *"The plateau is the practice"* — and give it the tag `#discipline` and the value *Mastery*. Open it in the Writing Studio: all three are already in the drawer. Pin them, sketch three beats on the Structure Board citing them as evidence, then **insert →** the memory as your opening. The piece links back to all three; each of them now says *used in "The plateau is the practice"*.

### 12.4 How the Content Studio connects

- **Journals, Library, Timeline** → seeds and drawer material (above).
- **Projects** → a piece can name *the project it serves*; its writing time counts as nods on that project.
- **Planning** → *Book it in Planning* schedules the writing as a task; the task opens the piece.
- **Time tracking** → writing sessions are timed.
- **Brand Strategy** → plans slots and links them to pieces (next chapter).
- **Knowledge Tree** → `[[writing:Title]]` links a Tree page to a piece.
- **The house** → the desk in the main room opens the Shelf.

## 13. Brand Strategy

A view of the Content Studio (`#/content/brand`) for anyone running one or more public accounts. Its job is to make the decisions *across* many posts deliberate; the posts themselves are still written in the Writing Studio, which Brand never writes to.

**Accounts.** One profile per account: name, handle, platforms, status; a **charter** (purpose, audience, promise, positioning, and a *never* list); a **voice and visual** (three tone sliders you set by hand, words to use and avoid, signature moves, colours, type, imagery, what changes per platform); and **three to five pillars** whose target shares must add to 100%. The **matrix** puts every active account side by side, so you can see they are actually different.

**The notebook.** Every note is an entry with three things: a **scope** (one or more accounts, or studio-wide), a **kind** (quote, observation, idea, hypothesis, voice rule, open question, metric…) and an **anchor** (the charter, pillar, plan or decision it serves). A note missing any of the three waits in the **Inbox**, whose count shows on every Brand page. A quote filed here is an ordinary Quote entry too — it appears in your quotes journal, on tag pages and on Today.

**Plans** nest: **season → 90 days → 30 days → week**. A 30-day plan has a theme, an objective, the hypotheses it tests, a target pillar mix, its **slots** on a calendar, and a review when it ends; its *actual* mix is counted from the slots marked Published.

**Slots** are planned posts: a date, an account, a platform, a pillar, and Brand's own status — **Planned → Linked → Published → Reviewed**. A slot's **brief** holds the intent (angle, purpose, audience, the hypothesis it tests) but no body. **Start in Writing Studio** creates the piece; a slot links to a piece by id and reads its title and status. Before a slot can be marked Published, the account's voice rules and *never* list are shown as a checklist to tick by hand.

**Judgment.** **Decisions** (the question, options with pros and cons, the choice, why, what would change your mind, a date to look again, and later what happened) wait in *Due for review* until an outcome is written. **Hypotheses** run through plans and slots to a **review** (fixed prompts at a week, 30 days and 90 days) where each is confirmed, revised or abandoned. **Metric notes** are numbers you type in, with a date.

**Views:** the dashboard for the account in hand, the notebook, the inbox, plans, one plan, the calendar, decisions, the account profile, the matrix, and the studio-wide view. **Export / Import Brand Strategy** moves just this part.

## 14. Projects

Projects are the gardens you tend — concrete work with an end.

**Two modes:**

- **◌ Ideation** — before anything is a project: **sparks** (something that struck you) and **questions** (something you do not know), in two equal columns. A spark can later become a project.
- **◉ Tracking** — the work already under way, in three views: **▦ Cards**, **▥ Board** (kanban by status) and **▬ Timeline** (a Gantt of phases).

**Status:** future, not started, in progress, on hold, completed, archived, abandoned. The **inventory** counts each. **＋ Future project** keeps a project you intend but have not started, the counterpart of a Future skill.

**A project's page:** name, description, tags, start and target dates, a link, **phases & tasks**, **resources**, **develops skills** (links to the Skill Tree), **notes**, **activity over twelve weeks** (a heatmap of nods), an **income stream** (model, current and target monthly income, milestones), images, and **Additional**.

**Nods.** A nod is the atomic unit of creative work: *"I showed up and did this."* One line, a duration (15 min … a full day), your energy afterwards (drained → energized), and optionally a link or image. Press **+ nod** on a project; time tracked against a project also writes a nod automatically. The Review's *Projects* card counts nods per week; Maslow's creative levels read them.

**A project is also a Planning list.** Every project has a list of the same name in the planner's **Projects** folder; its **phases are the list's sections**, and its tasks are ordinary tasks — with do dates, reminders, estimates, time categories, the matrix and Today. There is one task, shown in both places. Renaming either renames both, and any planner list can be made a project from its settings.

**How Projects connect:** tasks (Planning and Today), nods (from time tracking and the focus timer), skills it develops (the Skill Tree shows *linked projects — am I practising what I claim to build?*), an income stream (Finance), the Morning Theatre (the visions you rehearse are your projects; structural tension is written back here), content pieces that serve it, journal entries linked to it, and images for its vision board.

## 15. Repertoire (and Score Study)

The Repertoire room is a practice companion for pieces of music you are learning, not a notation editor. The score is engraved from a **MusicXML** file you bring (`.musicxml`, `.xml` or compressed `.mxl` — exported from MuseScore, Sibelius, Finale, Dorico, or downloaded); everything you add sits on top of it and is anchored to **bar numbers**, so it survives transposing, zooming and reflowing.

### 15.1 The shelf

**＋ Add a score**, then set its **period** (Baroque, Classical, Romantic, 20th century), title and composer. The inventory groups your pieces; each card shows its bars, how many sections are solid and its size. **The unwritten rules** (below) live here too.

### 15.2 A score, open

The toolbar, left to right:

- **← the shelf**, the title (press to edit title, composer, period), **◈ study** (Score Study, §15.6), **⎙ print** (with or without your markings).
- **one part** / the parts bar — show or hide staves and parts.
- **bars/line − +** and **fit**, **size − +**, **bar #** (jump to a bar).
- **▸ more** — the **metronome** (scheduled on the audio clock so it never drifts; its own volume and switch), **key ♭ / ♯ / as written** (transpose the whole score; chord symbols, note names and degrees move with it), **over the notes** overlays — *Note names*, *Scale degrees*, *Chords* (the harmony under each beat, worked out from the notes; faint where unsure), *Beat counts*, *Fingerings* (with it on, press a note to set one) — the **partner cue** and **engraving** options.
- **⛶ read** — **read mode**: the score and nothing else, page by page, for a tablet on the music stand. Choose how many lines fit; the **partner cue** strip (show or hide) gives you a small view of the other part's current bars while you read your own.
- **＋ a section**.

**The player** (every score in the house can be played — the grand piano is a real sampled Yamaha C5, violin and cello are real solo instruments, and orchestral scores use real sections):

- **⏮ ▶ Play ⏹** (`Space`), **♩ =** tempo, **tempo %** (a ritardando stays a ritardando), **count-in** (none, 1 or 2 bars), **🔁 loop** (`L`) and **set loop…** (tap the first bar, then the last), **click** (off, beats, downbeats), **volume**, and **⋯** for swing, accents and which parts you hear. The bar being played is lit and a playhead runs through it.
- **🎹 Practise with it ▸** — **ensemble play-along** for duets, sonatas, concertos and two-piano works. Give each part a role: **Mine** (shown, heard only as a quiet guide if at all), **Partner** (hidden and heard — what someone else would play), **Show & Play**, **Silent**. The guide can fade loop by loop. Per-section tempos (with rit./accel. ramps), how long to hold fermatas, **tap to lead**, and — with a MIDI keyboard — *wait for me*. Kept with the piece, so a two-piano work opens again as "I'm Piano I".

### 15.3 Sections, pins and the notebook

The side panel has four tabs:

- **📝 Sections** — a measure range worth practising on its own ("A — the question, bars 1–4"). Each has a **target tempo** and the **comfortable tempo** you can hold today ("♩=88 of 96 · 8 to go"), a **status** (Not started → Working → Solid), notes, **jump to it**, **practise this** (loops it at its tempo and logs a sitting), and a **custom** tempo of its own while the music is in it. The gap closing between comfortable and target tempo is the evidence slow practice is working.
- **📓 Notebook** — what the practice log adds up to: tempo over time per section, and how your sittings are spread across sections (the one you have been quietly avoiding for a month shows).
- **🎧 Recordings** — below.
- **Time today** — minutes at this score today.

**Pins (📌)** are notes on a bar: "the leap — look at the C before you play the A." They sit on the engraving where you cannot avoid reading them. A pin can also be marked **also one of the unwritten rules**.

**The unwritten rules.** Some notes are not about a bar but about music — "the inner voice carries the line here, so bring the thumb out." Mark a pin as a rule and it joins a library of rules across every score; writing the same rule in another piece adds that bar as another place you met it. You set your own standing on each rule (noticed → automatic); the room points out where your claim and your record disagree.

### 15.4 Recordings: the score following a real performance

Add a recording of the piece — your own, or a pianist you are learning from — from your own files. The alignment engine (it runs in the background, on this device) works out where every bar falls, however free the tempo, and the score then **follows the recording**, the bar being played lit on the page. With a synced recording you can also play back the **performance memory**: the score's own notes (or just one part, with the others silent) at *that performer's* timing and dynamics — rubato included — at any tempo.

**● Record a performance** records you at the piano (microphone or MIDI) and keeps your timing and dynamics as the piece's performance memory.

Recordings are private practice copies: kept in this browser, never uploaded, never put in a backup, never carried to a second machine. The sync *map* (bar times, no sound) can be exported and imported as JSON.

### 15.5 How Repertoire connects

- Minutes practised at a score are added as hours to a skill whose name includes *piano*, *music* or *keyboard* — so name your piano skill accordingly.
- Practice time runs through the one clock (Time tracking).
- The **weekly review** has a step *the week at the score*.
- **Play to compose** in the Jazz Studio can save what you played here as a score.
- **Score Study** can make a section into a Repertoire section, open a journal entry about it, or capture an insight to the Knowledge Tree.

### 15.6 Score Study

Press **◈ study** on a score to see its harmony, cadences and form, worked out here from the notes, by rules — nothing is sent anywhere. The side panel becomes the Study panel, and an analysis layer is drawn on the engraving: Roman numerals under each bar (coloured by function — tonic, pre-dominant, dominant — and faded where unsure), key changes, cadence flags, phrase brackets, phrase arches, your notes on the notes, and an optional reduction.

**Tabs:** *Overview* (keys, harmonic rhythm, a bar check, settings, versions), *Chords*, *Cadences*, *Form*, *Write-ups*, *Tension*, *Takes*, *Notes*, *Layers*, *Compare* and the *Log* of decisions.

**How to use it:**

1. **Analyse** proposes keys, chords (with inversions, applied dominants, Neapolitan and augmented sixths, the cadential 6/4), cadences (PAC, IAC, HC, deceptive, evaded, plagal…), phrases and periods, a tension curve, and galant schemata (Prinner, Romanesca, Monte, Fonte…).
2. **Nothing is taken as settled.** Each label is *proposed* until you accept, relabel or reject it. A filter shows only the labels it is unsure of. Every choice you make goes into the **decision log**, add-only, with your reason if you give one.
3. **Write-ups** — for each section, a draft in five blocks (harmony, cadences, form, tension, what it suggests for playing), generated from your confirmed analysis. Accept, edit or write your own; each save is a new version.
4. **Notes on the notes** — select noteheads and write what to do (voicing, timing, dynamics, pedal, fingering…), with no length limit. Short notes print above the staff; long ones become pins.
5. **Takes** — *Tap along* while you play or listen; your tempo curve is drawn over the tension curve, with plain statements about where you slow down and whether it is at the cadences.
6. From a section: **Practise this section**, **Reflect** (a journal entry about it), **To the Tree** (a Knowledge Tree capture).

The README's *Score Study* section describes the analysis methods in full.

## 16. Jazz Studio

A roadmap, not a shelf. The unit of work here is the **pattern in a key** — twelve of everything — because nobody "learns" a ii–V–I: you play it until your hands go there in every key without being asked. The curriculum is Jerry Siskind's three *Jazz Piano Fundamentals* books, extended with material from Levine, Berklee, Mantooth, Dobbins, Stoloff, Weir and others, every exercise citing its source and page.

### 16.1 Getting started

Choose a **pace**: **Relaxed** (15 minutes a day, about 28 days a stage), **Standard** (30 minutes, about 14 days — Siskind's own benchmark) or **Intensive** (45 minutes, about 9 days). Then choose a **track** — **Full curriculum** or **Fast track** (the eight to ten core exercises per stage you need to be ready for the next) — and **Piano** or **🎤 Voice**.

### 16.2 The roadmap

Thirteen stages, **P0** (intervals and the 12×12 matrix) through **Stage 12** (upper structures and beyond), each with a **why this stage**, a mindset passage and golden tips. Every exercise is tagged by what it is — 🎼 notation, ⏱️ drill, 📖 reading, 🎹 improvising — and by tier: **ESSENTIAL** / **CORE** (the Siskind curriculum), **ENRICHMENT** (the other books, worksheets, listening). Each shows **0/12** — how many keys you own. Sort *by tier* or *curriculum order*.

### 16.3 An exercise

- The pattern **engraved in any of the twelve keys**, on a grand staff, with its source.
- **The band.** Every exercise with notation gets a rhythm section generated from its chords: **bass** (roots, two-feel, walking), **drums** (swing, ballad brushes, bossa, straight eighths, off), **comping** when you are not the pianist (Charleston, reverse, mixed, in Type A/B voicings), swing amount, tempo, choruses.
- **Key cycling** without stopping: this key, round the cycle of fourths, down in whole steps (Siskind's Set A then Set B), up in half steps, random, or *only the keys not yet yours*. The page turns to the next key a bar early under a large **NEXT: B♭**.
- **Reading, taken away a step at a time**: full notation → chord symbols → key name → nothing. The furthest you have reached is kept.
- **Play it** (with a microphone or MIDI keyboard) — live feedback under the staff (notes marked green/amber/red/grey, a timing lane, *wait for me*, *play along*), and after each attempt your accuracy, timing, the bars with most errors and **Loop the tricky bit**. Three clean attempts in a key at standard strictness mark that key as yours.
- Golden tips (forty-eight, each with its book and page, rotating daily), recommended tunes, and the sittings logged on it.

### 16.4 Today's practice

The **📋 Today's practice** tab answers the only question a self-learner has — *what should I practise today?* — the way a teacher would: four to six things, not the whole stage. Rotation (nothing two days running; the less comfortable, the sooner it returns), three or four keys a session round the cycle of fourths, balance (one harmony/voicing, one coordination/rhythm, one improvising, and on the full curriculum one enrichment item), a warm-up and cool-down tune, all within the minutes you have. Start the **session** and it is logged as you go; the **overview** says whether you are on pace for the stage's fourteen-day cycle and when you look ready for the next. Nothing ever moves you on by itself.

### 16.5 The other tabs

| Tab | What it is for |
|---|---|
| **🎯 Flashcards** | Cold recall: a pattern, a random key, no score. Play it, turn the card, say whether you had it. Three clean answers mark a key; a miss takes one back. **Band mode** calls the key out loud, counts a reaction window, and the band comes in on the downbeat whether you are ready or not (the window shortens as you improve). **Lead-sheet cards**: symbol recognition, progression reading in time, and form identification. |
| **📊 What you have practised** | The record: keys owned, sittings, time. |
| **📚 Tune library** | 917 Real Book tunes, searchable and filterable. Each tune page is a chart you can play along with: loop bars (tap a start and end bar, or tap an analysed ii–V–I to loop exactly it), climb the tempo each repeat, move the key round the cycle, tap a chord for its scales and six voicings, record takes. **Play the tune** plays it as a performance — head, N choruses, head out — with the melody shown or hidden, trading fours, and optionally a **generated soloist** (piano, sax or another instrument) improvising by chord-scale rules; *show the solo* lists the rule behind every note. |
| **🎵 Repertoire** | The tunes you are learning, and how well. |
| **🔎 Harmonic analysis** | Search tunes by harmonic feature, compare them, see the statistics. |
| **🥁 Play-along** | The curriculum's own progressions with the band. |
| **🎧 Listening** | 36 guided tracks and 35 comping masters. Siskind's rule: listen twenty times before moving on; the count is kept. |
| **🎙️ Record** | The drone recorder, the sing-then-play recorder, self-transcription and comparisons. Takes are private and have a **Delete take**. |
| **🎹 Piano input** | Set up a MIDI keyboard or a microphone (an acoustic piano works). All audio is analysed on this device. |
| **✎ Play to compose** | Play, with a click or free tempo; it becomes a clean score (beat, grid, swing, hands split, key and spelling, chord symbols, pedal). Correct notes by hand, export MusicXML/.mxl/MIDI, **save to Repertoire**, or keep it as an exercise the Play-it strip checks you on. |
| **🎼 Ear and reading** | An aural test (hear a phrase, play it back), sight-reading, and *play what you sing*. |
| **📓 Journal** | Practice reflections. |
| **👂 Audiation** | Gordon's audiation ladder and where each stage sits on it. |
| **🧘 Mindset** | "The Space" before a session; practice time and play time told apart. |
| **🎼 Improvisation** | 36 Siskind improvisation exercises, 12 vocal ones and reference cards. |
| **📋 Units** | Siskind's 36 unit assignment pages — what to do each day, for how long, in what order — tickable. |
| **🏆 Practice tips** | All forty-eight golden tips; star your favourites. |
| **ℹ️ About v3** | Where the curriculum comes from. |

**The Voice track** turns the same curriculum toward singing: comping on, *give me my starting note*, a guide melody that fades, and a vocal range you set once, so a key that would take a pattern out of your range is flagged before you sing it.

**How the Jazz Studio connects:** its practice sessions are timed by the one clock; *Play to compose* saves into Repertoire; the Chord-Scale Map is shared with the Songwriting Studio; everything the house plays uses the same grand piano and instruments.

## 17. Songwriting Studio

For writing original songs, words and music, as someone who plays the piano and sings. It is a curriculum and a workshop; production happens in a DAW — this room is everything before that. Every suggestion comes from rules you can read, and nothing is sent anywhere.

**Before the first song** it asks two things: your **vocal range** (lowest and highest comfortable notes — *hear them* to check) so the tools can warn when a melody goes out of it, and **when you write** (morning, midday, evening, whenever).

**Today** (the landing page) offers the next step: a ring for your 42 days of object writing (Pattison's six weeks), the next exercise, and your songs in progress.

**The Path** — eleven stages of exercises (131 in all, each paraphrased from the book it cites: Pattison, Stolpe, Kachulis, Hooktheory), drawn as rooms that light up as you finish them, and a **capstone** song:

| # | Stage | The promise |
|---|---|---|
| 0 | Opening the Studio | Prove the loop exists — write a song in an hour, badly. |
| 1 | The Senses | Train your senses to generate raw material on demand. |
| 2 | Home Base | Hear chord colours and feel the pull of home; build grooves that move. |
| 3 | Words in Time | Hear the rhythm inside language. |
| 4 | Melody I: Rhythm | Shape melodies in time before pitch. |
| 5 | Rhyme & Metaphor | Rhyme as a precision tool, metaphor as a discovery engine. |
| 6 | Melody II: Notes | Chord tones, stability, motive development. |
| 7 | Structure & Motion | Make structure serve emotion. |
| 8 | Harmony II: Progressions | Progressions, cadences, reharmonisation. |
| 9 | The Story | Songs that develop — every verse earns the chorus. |
| 10 | Melody III: Colours | Pentatonic, blues and modal colours; play against the bass. |

Each exercise has a purpose, instructions, fields for what you make, a self-check, and often a link to the tool it needs.

**The Studio** — thirteen tools:

| Tool | For |
|---|---|
| 🖊 Object Writing Desk | Timed sense-bound writing (all seven senses), a hard stop, the 42-day ring. |
| 🎹 Chord Lab | Progressions in five key colours, played in fifty-odd grooves. |
| 🥁 Groove Maker | A rhythmic idea on a step grid, and how it repeats. |
| 🗺 Chord-Scale Map | Which notes each chord allows — improvise, then write. |
| 🎶 Melody Sketcher | Scale degrees over chords, developed by hand: repeat, sequence, invert. |
| 🎲 Melody Generator | An emotion turned into rules turned into six melodies; *Explain this melody* shows the rule behind each note. Same seed, same melody. |
| 📝 Lyric Sheet & Structure Lab | Stress, motion, stability, power positions, contrast, show/tell, point of view, tense, clichés. |
| 🔤 Rhyme Workbench | Five rhyme types, consonant families, worksheets. |
| 💥 Metaphor Lab | Collisions, identity, keys, linking qualities. |
| 🎨 Colour a Word | One melody note, many chords: hear the word change. |
| 📋 Song Desk | A song's brief, plot, boxes and sections; Stolpe's Ten Steps; the Rewrite Room checklist; versions. |
| 🃏 Writer's-Block Deck | Stuck? Draw a technique card. |
| ⏱ Metronome | A click and tap tempo. |

**The Seedbank** keeps anything a tool makes — a line, a progression, a melody, a title — to be picked up later. **Songs** is your songbook (drafts and finished, with a print view). **The Listening Room** is for studying songs you admire.

**How it connects:** object writing is the same senses-first habit as the journal; a seed is a song's compost heap; the Chord-Scale Map is shared with the Jazz Studio; a voice memo stays on this device only.

## 18. Japanese Studio

One room around one question: not *do I know more Japanese?* but *can I say it, now, without the sentence assembling itself in my head first?* Five tabs, which are five different sittings, and one pipeline:

> a grammar point is drilled until it is mechanical → used to say something true about your life → that becomes an **island** → the island is pushed to speed on a shrinking clock → translation keeps the structure honest → every mistake lands in one **notebook**, which feeds the grammar drills and the Study Deck.

**🎙 4/3/2.** One talk, three times, on a shrinking clock (four minutes, then three, then two). The content is fixed on purpose: what improves is the machinery. The room records you (kept on this device) and, where the browser can, transcribes — and the transcript is a *second opinion*, not a record: you correct it, and the gap between what you meant and what a machine heard is your pronunciation diagnostic. Without a microphone it is still a clock, a topic and a box. **Scenarios** (situations to rehearse — *open*, *ran it*) and **Shadowing** takes live on this tab too.

**🏝 Islands.** A monologue you know by heart that you can stand on while the rest of a sentence assembles itself; thirty of them and you can talk about your life at speed. Each island keeps **the English draft forever** (what you originally meant), the Japanese in **both registers** (polite and casual — an island is not finished without both), and **the vocabulary that belongs to the topic**, with the share you can actually produce.

**📖 Translation.** Take an authentic Japanese text; put it into English; **wait a day** (the second pass is locked until then); rebuild the Japanese from your English without looking; then compare, side by side, and name what changed yourself. It shows the places your Japanese is translated English.

**📐 Grammar.** Three drills: **A** your own rule chart (formation notes, examples, what confuses you); **B** fast mechanical transformation, from prompts you wrote; **C** the bridge — use the pattern to say something true about yourself, which goes straight into an island or a 4/3/2 sitting.

**📕 Notebook.** One book of errors, fed by all four rooms. It never supplies the right answer — the correction comes from you, a tutor or a native text — and it counts patterns rather than interpreting them ("five conditionals this month").

**How it connects:** minutes practised here are added to a skill whose name includes *Japanese* (or 日本語) and tick a habit whose name includes *Japanese* or *language* — so name them that way. Mistakes can become Study Deck cards. The **weekly review** has a step *the week in Japanese*. The garden herbs in the house open this room.

---

# Part IV — Identity: who you are, and have been

## 19. The Identity room: People, Values, Skill Tree, Finance

Four tabs of one room. Each tab is exactly the room it always was; the last one you opened is remembered.

### 19.1 People — a relationship garden, not a CRM

The point is not to manage anyone. It is to remember what people told you, notice when you have drifted, and be deliberate about the handful of people a life is made of.

**Five views:**

- **◎ Circles** — a living constellation. You are at the centre; each person is a node on a thread. *How far out* is the circle you put them in (Core, Close, Warm, Orbit, Aspirational); *how big* is how much of your writing they are in; *how bright* is how recently you saw them; *how warm* is whether time with them leaves you fuller or emptier; the thread frays when it goes cold; a dashed ring is someone you have not met yet. Drag faces between circles. Each circle shows its count against its natural size (about 5 core, 15 close, 30 warm, 80 orbit) and how many are in touch.
- **▤ List** — everyone, sortable.
- **◷ Log** — every interaction, over time.
- **▬ Life stages** — who was present in which chapter of your life (from the Timeline).
- **◈ Audit** — a periodic relational health check: people placed by how much you invest against what the relationship gives back — *protect these*, *taken for granted?*, *where resentment builds*, *let drift*.

**Logging in five seconds.** **＋ Log an interaction**: who, what kind (met in person, call, video call, message, email, social, other), how it left you (energy), and one optional line. That is all. The friendship then reads back as a *shape*: ninety days as a strip, the energy of each meeting as a line.

**A person's page:** name, relationship (extend the list with *＋ name another…*), status (active, dormant, lost, estranged, deceased, not yet met), circle and a desired **contact cadence** (weekly, biweekly, monthly, quarterly, yearly — anyone past theirs surfaces as overdue). Then the deeper questions, each **versioned** (write a new version and the old ones stay underneath): **What this person installed in me**, **The gift**, **The wound**; and **What I become around this person**. The life stages they were present in, the threads they activate, the values they embody, a standing **energy reading** (energised, neutral, drained). **Remember**: interests, life updates ("what they told you"), notes, important dates, birthday, phone and email. **Gift ideas** and a **gifts log** (given and received). Every entry that mentions them, their interaction history, and **Additional**.

**Rituals** at the top of the page: **☺ reach out to someone**, **♡ gratitude for someone**, **◎ ring review** (walk the circles and move anyone who has moved).

**How People connect:** tag someone in any journal entry (the *People* field is in the body of every entry, and its question changes with the kind of entry — "who was there", "who to thank for this") and it becomes a logged interaction and appears on their page. Time tracked "with" a person counts too. Birthdays within 30 days and overdue cadences appear in the Review's *People, within cadence* card; the quarterly review asks about *the five closest*; the annual review shows *the constellation, a year on*. Maslow's *Love & Belonging* reads contact recency.

### 19.2 Values — the compass beneath the floorboards

**The solar system.** You are the sun; each value is a planet, and every property is a fact rather than decoration: *distance* is the priority you gave it; *speed* is how recently there is evidence for it; *brightness* is congruence at the last reading; *size* is how much evidence there is; *saturation* is how much of that evidence is embodied rather than betrayed; its *trail* shows which way congruence is moving; a *dashed orbit* means nothing you are building serves it — a blind spot.

**The table and the figures.** Congruence now, since the last reading, the widest gap, the last reading; one table that is priority, congruence, gap and trend at once; the radar over time; and **how the ranking has changed** over the years.

**＋ Congruence snapshot** — score each value 0–100 for this week: how well did you actually live it? Snapshots are what every "is my life aligned?" chart reads. The weekly review asks for one.

**A value's page:** name and tagline, then four questions, each versioned:

1. **How would I know if I embody this value?** — observable, behavioural evidence, not aspiration.
2. **What takes me to 100%?** — what full congruence looks like day to day.
3. **How do I increase my positive motivation for this value?** — strategies, reminders, environments, people.
4. **What counterfeits this value?** — the cheap imitation that feels like the value but is not.

Then the **evidence feed** — every entry linked to this value, marked *embodied* (+) or *betrayed* (−) — practices, and **Additional**.

**How Values connect:** any entry can be linked to a value with a polarity (in *Connect this entry*: click once for embodied, twice for betrayed). Habits, people ("values embodied") and projects link to values. The quarterly review asks you to **re-rank what matters**; the annual shows the compass January to December. The medicine cupboard in the house and the sky on its roof open this room.

### 19.3 Skill Tree — the architecture of becoming

**The page:**

- **In focus now** — the two or three skills you are actually practising, each with **log practice**.
- **Milestones ahead** — a timeline of upcoming skill milestones over 30 days, 60, 90, 180 or a year.
- **The tree** — a sakura grown (not drawn) toward your skills, which are points of light in its canopy; progress is blossom, from a bud to a covered twig at mastery. The same skills always grow the same tree; adding one grows a branch.
- **Inventory** — by **horizon**: **◉ In focus** (the handful you are practising now), **○ Active** (kept warm, not the priority), **↗ Up next** (starting within weeks or months, with a *start by* date), **◌ Future** (written down so it stops taking up room in your head), **⏸ Resting** (deliberately set down, not neglected). *In play* shows focus and active together.

**＋ Log practice**, **＋ Reached a level**, **＋ Set a milestone** at the top.

**A skill's page:** name, category (Musical, Artistic, Income, Language, Intellectual, Social, Spirituality, or your own), horizon, priority (P1–P4), **Why this one?** (one line for the day you have forgotten), last practised, streak, and an **archetype** reading of your pattern (the Dabbler, the Obsessive…). Then:

- **Levels** — your own ladder: labels, descriptions, **criteria as checkboxes**, typed resources, estimated time, target dates.
- **Abilities** — break a skill into parts that do not move together (reading and speaking; technique and repertoire), each with its own rubric; the skill reads as their average and names the one furthest behind.
- **Milestones** with multiple targets on a timeline; images; prerequisites; **cross-mappings** (linked projects — *am I practising what I claim to build?* — and the values it serves); the **progress log** (progress entries); tasks in Planning; **Additional**.

**How Skills connect:** hours arrive from the one clock (time linked to the skill), from practice at a score (a skill named *piano/music/keyboard*), and from the Japanese Studio (a skill named *Japanese*). Projects list the skills they develop. Habits link to skills. Milestones within 30 days appear on Today. The tree in the garden of the house opens here.

### 19.4 Finance — not a ledger

You have a phone app for what you spend. This page has three jobs: **building the ways you make money**, **working out how much would actually be enough for the life you want**, and **naming the gap between them** as a tension worth acting on.

- **Money, in your own words** — what money is for, to you.
- **Income streams** — each **⟳ active** (money bought with your hours) or **◇ passive** (money from something already built), with current and target per month, hours per week, currency, sub-parts, milestones, *what this stream is for*, **📈 log this month** (actual revenue), and **🎨 link to a project**. The arithmetic suits the kind: effective hourly rate, hours to target and the ceiling those hours impose for active streams; yield on capital, payback and money per upkeep hour for passive ones. Totals: current and target monthly, number of streams, diversification, passive share, hours per week. **＋ future stream** for a way of earning you intend to build.
- **The life you want to fund** — **life-cost scenarios**, each a whole possible life priced by category (housing, food, transport, health, learning, creative, relationships, experiences, savings & investment, giving, miscellaneous) with line items, in its own currency. Compare scenarios side by side; **set as target**.
- **The gap — structural tension, made visible** — the target life's monthly cost beyond current income. **→ update the Definite Chief Aim with this number** carries it into the Morning Theatre.
- **Per-stream contribution**, an **hours reality check**, **active and passive**, and **runway**.

**How Finance connects:** a project's income stream is a stream here; the Morning Theatre's chief aim can carry the gap; the Review's *Money* card, Maslow's *Safety* level (runway and the gap), the quarterly review (*the money, honestly*) and the annual review (*the year in money*) read it.

## 20. The Lived Record: Journals, Timeline, Library

The record of a life, in three views (keys `1`, `2`, `3`).

### 20.1 Journals

A journal per kind of entry, listed down the left with counts. **＋ new journal type** adds your own; **manage journals…** shows, hides and reorders them. Every journal page has **On this day** (what you wrote on this date in earlier years, and 🎲 for a random past entry), a search over title and body, a date range, a tag filter and a filter by stage, thread, value, skill or project.

**Writing an entry** (`N`, or the ＋ on a journal). Every entry has a title, a body (markdown), its type's own questions, **Additional**, **People** (the question changes with the type), **Hashtags**, **Occurred at** (a date, or fuzzy — "Summer 2019", "age 15" — so memories can be logged today about decades ago), images, and **Connect this entry** (stages, sub-stages, threads, values with polarity, skills, projects, places, emotions, and a confidence ladder for future-facing entries: hunch → exploring → plan → committed → in motion → lived). How long you actually spent writing it is recorded (time away from the form is not counted). The painting across the top changes with the type.

**The kinds of entry, and what each asks:**

| Type | For | Its own questions |
|---|---|---|
| **Reflection** | thinking on paper | how you were when you wrote it (heavy → luminous), what prompted this, how deep you went (surface, sitting with it, breakthrough) |
| **Gratitude** | appreciation that means something | **Why does this matter to me?** (required — "my health" becomes "I could run with my dog this morning without pain"), new or ongoing, and who to thank |
| **Dream** | caught on waking | vividness 1–5, emotional tone (anxious, joyful, surreal, mundane, prophetic, nightmare, lucid), recurring, symbols, a waking interpretation (kept as versions). The Dreams journal has a **dream calendar** and a **dictionary** of your recurring symbols. |
| **Synchronicity** | meaningful coincidence | what preceded it, what I read into it (versioned), how convinced you are (noise → unmistakable), *revisit later* (flagged ones come back in the quarterly review) |
| **Manifestation** | an intention set | status (held, evidence appearing, arrived, released), where you were on the emotional scale when you set it, resistance notes, an evidence log |
| **Question** | a question you are living with | why you are asking, status (open, evolving, settled, **dissolved** — the framing was wrong). Put the question in the title; answers accumulate. |
| **Quote** | words worth keeping | which work it is from (linking it to the Library), author, source, a saved link, page, **why this caught me** (required), what kind of words (wisdom, craft, beauty, provocation, comfort, challenge) |
| **Memory** / **Life event** | the past, for the Timeline | what this installed in me (the belief, fear, pattern or capability it left behind) |
| **Letter** | across time | direction (to my future self, to my past self, from my past self). **Sealed letters** are hidden everywhere until their date, then arrive on Today with room to answer the person who wrote them. |
| **Decision** | a choice worth remembering | the situation, options considered, what I chose, **why — my reasoning at the time** (the real reasons), what I expect, what would make it a mistake, how sure (a coin flip → certain), and a date to come back. On that date it appears on Today to be graded: what actually happened, what I got right, what I did not see, what I would tell myself. |
| **Progress** | a step forward in a skill | duration, resources used |
| **Divination** | a kept reading (§7) | the cards, the question, what you made of it |
| **Intuition** | a hunch to check later (§7) | channel, strength, what would confirm it, and later what happened |
| **Visualization**, **Artifact**, **From the bar**, **Nod**, **Uncategorized** | the Morning Theatre's scenes, objects that mattered, named drinks, quick project nods, anything else | — |

Every entry card carries the same row of actions: **edit**; **✂** save it to a Writing Studio piece (§12.3); **▣** add it to the vision board (Morning Theatre); **📌** keep it on Today to reread; **◆** make a Study Deck card of it (you will be asked for it again in a week, then a month); **×** delete (with undo).

### 20.2 Timeline

**The museum of the past.** Your life as **stages** (chapters) on a spine — each a tile with a single character, a name, a tagline and its years. Hover to bring one forward; click to walk in. Under the stages run **threads** — recurring motifs through many stages, thickening where they had many entries and thinning where they went quiet — and the **Threads & Tensions** tab tends them. Toggle **clock time / felt time**: in felt time, dense stages stretch and thin ones compress. `←` `→` step through stages.

**A stage's page:** its character, name, tagline and years; **The story I tell about this stage** (versioned — *The story I used to tell* keeps the earlier ones, because your interpretation of an era is supposed to change); **sub-stages** (each with its own description and images); the threads present; a **retrospective values reading** (how you lived each value then); the formative events and memories that happened in it; its soundtrack, artefacts and letters to and from that self; **Additional**.

**＋ New memory** logs a memory; its *occurred at* date (even a fuzzy one) places it in the right stage.

### 20.3 Library

Media as a theory base for lived experience — not a rating site. Every work is asked what it *did to you*, not whether it was good.

**＋ Log a work** — paste a link (Spotify, Apple Music, Apple Podcasts, YouTube, Vimeo, SoundCloud, Bandcamp, TIDAL, Deezer, Open Library, Goodreads, Wikipedia, IMDb, Letterboxd, Steam…) and it is recognised and shown as a card with its cover (fetched once from the service's own public preview, then kept so it works offline). Or type a title.

**Kinds**: book, film, documentary, podcast, article, series, album, lecture, exhibition, game. **Three tabs**: **The Shelf** (finished this year, in progress, wanted, *lives in me*; what you keep coming back to; the **influence map**), **Chronology**, and **Queue & Lists** (what to get to, your own lists, and **received recommendations** — who recommended what, and why).

**A work's page:** kind and status (want, in progress, finished, abandoned, re-experiencing); creator, year, started and finished; **where to find it** (links shown as previews, with ▶ to play inside the page); **resonance** — *Passed through me*, *Stayed with me*, *Changed me*, *Lives in me*; a **one-line capture** ("force the distillation"); **What it installed in me**; **Quotes & marginalia** (the line, where, and — required — what it caught in you; each becomes a Quote entry too); linked dimensions; **the conversation** (anything else, in prose); **Would I recommend this?** (yes, conditionally, no — and who should read or watch it, and when); hashtags; **Additional**.

### 20.4 How the Lived Record connects

This is the most connected room in the house, because entries are the hallway every room shares:

- **Into writing** — tagged and linked entries fill the Writing Studio's research drawer; long entries offer *add as a seed*; ✂ sends any entry to a piece (§12.3).
- **Into People and Values** — tagging someone logs an interaction; linking a value adds evidence (embodied or betrayed).
- **Into the Timeline** — memories and life events land in the stage their date falls in, as its formative events.
- **Into the Morning Theatre** — ▣ puts any entry on the vision board; 📌 keeps it among the passages you reread each morning.
- **Into Today** — pinned entries, letters that come due, decisions to grade, flagged synchronicities, unfinished thoughts.
- **Into the Knowledge Tree** — saving an entry looks for Tree page titles in what you wrote and *offers* to link them; finishing a Library work asks what point you took from it and where it belongs; `[[journal:2025-03-01]]` and `[[library:Title]]` link Tree pages back.
- **Into the Study Deck** — ◆ on any entry makes a card of it; or select any passage anywhere and press `Ctrl/⌘+Shift+R` (**Remember this**).
- **Into the reviews** — every review reads the entries dated in its period; the Days archive shows what you wrote each day.
- **From the Library into Content** — a work that *changed you* asks whether there is an essay in it; its quotes and "what it installed" can be pulled straight into a draft.

## 21. Knowledge Tree

A personal wiki for a lifelong inquiry — what you think about the questions that matter to you, and how sure you are.

**Shape.** Every page has one home: a **root** (one of the great questions), a **branch** under it, a **point** under that. A point cannot be saved without a parent.

**Positions.** A page holds a **position** at a stated confidence (0–100) and **the question that would change your mind**. Positions are add-only: **Revise position** adds a new one; the old stays on the record, drawn as a line of how sure you have been over time.

**Links.** `[[Title]]` links a page (blue if it exists, red if not — a red link makes a stub); `[[Title|shown as]]`; `[[library:Title]]` a Library work; `[[journal:2025-03-01]]` that day's entries; `[[writing:Title]]` a piece. Typing `[[` offers matching titles and aliases. Renaming keeps the old title as an alias.

**Grafts** join two pages with a kind and a required reason: *supports*, *contradicts*, *extends*, *echoes* (the same shape somewhere else), *raises*. Open contradictions are listed under **Tensions** until resolved. **Gaps** lists red links, points with no evidence ("leaves"), branches with no position, positions with no open question, and branches where every graft agrees.

**Getting things in.** **Quick capture** with `Alt+K` from any room drops a thought into the Tree's inbox, to be made a page, added to one, or let go. Journal entries and finished Library works offer links (never attached without your say). Score Study sends insights here.

**Tending.** One card a day (it also appears on Today): a page due to resurface ("do you still hold this?" — *still hold*, *revise* or *doubt*, on a ladder of 3 days, 2 weeks, 2 months, 6 months, a year), else the oldest capture, else the branch left untended longest. Now and then, beside what you hold now, it shows what you held a year ago.

**Proof.** **Experiments** record trials, hits and the chance rate, and give the hit rate and the exact binomial p-value. **Sealed predictions** are fingerprinted when saved and resolved true or false once; **calibration** shows your Brier score and how often you were right at each level of confidence.

Export and import the Tree on its own from its home page (an import only adds what is missing). The README's *Knowledge Tree* section has the full link and key reference.

## 22. Study Deck

Spaced repetition, built to Anki's own model so a deck made in Anki arrives and behaves exactly as its maker meant, and can go back again.

- **Decks** nest (`Parent::Child`) and each has a preset of options (daily limits, learning steps, **FSRS** scheduling by default or SM-2, burying, leeches, the timer). **Filtered decks** borrow cards for custom study and give them back.
- **Note types**: Basic, Basic (and reversed), optional reversed, type-in, **Cloze** (`Ctrl/⌘+Shift+C`), and **Image Occlusion**. The editor shows the card as it will look; paste images, drop or record sound; fields can be pinned for the next note; duplicates are caught.
- **Reviewing**: `Space`/`Enter` to show the answer, then `1` Again, `2` Hard, `3` Good, `4` Easy — each button shows the interval it would give. `Ctrl/⌘+Z` undo, `-` bury, `@` suspend, `*` mark, `E` edit, `I` card info, `F` focus. On touch, swipe left for Again, right for Good, up for Easy, down for Hard.
- **Browse** with Anki's search syntax, bulk edits and find-and-replace; **Stats** with every graph and its numbers (true retention included); **Import** `.apkg` and `.colpkg` from any Anki version, CSV or JSON; **Tools** to postpone, advance, load-balance, take a break, reschedule and fit FSRS to your own reviews — each previews its effect and can be undone. The review log is add-only.

**How it connects:** **Remember this** (`Ctrl/⌘+Shift+R`) anywhere in the house makes a card from the text you have selected, filed in a deck named for the room it came from. Japanese notebook errors go **to the deck** as production cards. Today shows how many cards are due and offers five minutes of them; the weekly review reports the week's reviews; the card box in the house opens here.

---

# Part V — Settings and tools

## 23. Settings

Open with **⚙** (top right). The cards, top to bottom:

- **Atmosphere** — dark or light; whether buttons answer with sound; **Felt time** (the Timeline's default mode); and the ambient bed (off, brown, pink or white noise, rain, ocean, fireplace, café, forest, library, slow piano, music box) with its volume.
- **The clock** — whether walking into a room starts the one clock; whether the timer shows in the corner; the category an unlabelled timer falls into; how minutes are read out; whether a sitting on a project becomes a nod; whether time with a person counts as time with them; the time categories.
- **Day & sleep** — **the day turns over at** (the hour after which a late night still belongs to the day you were living; 4 AM by default).
- **The keyboard** — every shortcut, by room.
- **Navigation zones** — drag rooms between *Create*, *Identity* and *Always*; **reset to default**.
- **Import station** — opens it (§24).
- **Starter set** — **Add it** / **Take it out** (a first draft of skills, projects and values; removing it touches nothing you wrote).
- **Worked examples** — **Add them** / **Take them out**.
- **Data & backups** — **💾 Export backup**, **Import backup**, **ⓘ How to restore**, **Clear all data**; **the same life on two machines** (§2).
- **About** — credits and licences, and **Voice & Claude**.

**Voice & Claude (optional).** Dictation always uses the browser's own recogniser, and nothing is recorded. *Tidy*, the **pattern report** ("Patterns in the record": entry cadence, recurring words and tags, values that have risen or fallen several readings running, state by weekday, skills going cold, habits under 40%, the people who recur) and the Import Station all work **locally by default**, from rules and real statistics. If — and only if — you paste your own Anthropic API key here, those three can use a language model instead, and only for the material you send them. The key is kept in this browser only and never written into a backup. A Claude Pro/Max or ChatGPT subscription cannot be used for this; API access is separate and pay-as-you-go. You never need a key to use the house.

## 24. The Import Station

For bringing in writing that already exists somewhere else — old notebooks, notes-app dumps, pages of a diary.

1. **Paste** text, open a **📂 file** (`.txt`, `.md`), or **🎙 dictate**.
2. **⚡ Process** splits it into pieces (by `---` dividers, headings, blank-line gaps or bullet lists) and makes a card for each, with a first guess at where it belongs: a journal entry (and which type — reflection, gratitude, dream, memory, synchronicity…), a skill, a person, a project, a Library entry, a task, a habit, an income stream or a Timeline chapter.
3. On each card, correct the destination, the title, the date and the body, fill that room's own fields, and **×** discard anything you do not want.
4. **Commit** files every kept card into its room.

A **spreadsheet importer** — one tab per destination, columns matched to each room's own fields, anything unmatched landing in the record's **Additional** box — is being added to this station.

---

# Part VI — Putting it together

## 25. How the rooms feed each other

The house is designed so that you record something **once**, in the place it naturally belongs, and it then shows up everywhere it matters. Five mechanisms do nearly all of the work. Understanding them is the difference between using fifteen separate tools and using one instrument.

### 25.1 The five mechanisms

1. **Entries are the hallway.** A journal entry, a quote, a kept reading, a memory, a decision, a Library work, a piece of writing — all are *entries* in one shared record. That is why one entry can sit in your Journals, on a person's page, in a value's evidence, in a stage of the Timeline and in a writing project's research drawer at the same time.
2. **Links and tags are the doors.** *Connect this entry* (stages, threads, values with polarity, skills, projects, people) and `#hashtags` are what let one room find another's material. A minute spent linking an entry when you write it is what lets your future self — and your future essays — find it.
3. **One clock.** Time is tracked once. A sitting on a task becomes minutes on the task, a nod on its project, hours on its skill and a stretch on the day's bar; time with a person becomes time with them.
4. **Today is where things meet you.** Rooms *keep* things; Today *brings them to you* on the day they matter — do-dates, reminders, due letters and decisions, pinned passages, due cards, milestones, the Tree's tending card.
5. **The reviews are the reading room.** Every review, from the evening one to the annual one, reads the same records for its period, so looking back never means re-entering anything.

### 25.2 The connection map

| When you… | …it also appears in / feeds |
|---|---|
| write a journal entry and tag a person | that person's page and interaction history; their cadence resets |
| link an entry to a value (+ or −) | the value's evidence feed; its size and saturation in the solar system |
| link an entry to a skill or project | the skill's progress log; the project's page; the Writing Studio drawer of any piece sharing the link |
| add `#tags` to an entry | `#/tag/…`; the research drawer of every piece with that tag; *you might not have considered* |
| date a memory, even fuzzily | the Timeline stage that date falls in |
| write fifty words in a reflection | an offer to make it a Content seed |
| press ✂ on any entry or work | a writing project's research drawer, or the Compost Heap |
| press ▣ / 📌 / ◆ on any entry | the vision board / Today's pinned passages / the Study Deck |
| keep a quote in a Library work | the Quotes journal; the drawer's Library shelf; can be pinned to a piece |
| mark a Library work *changed me* | an offer to write about it; the Library-by-theme drawer ranks it first |
| finish a Library work | a Knowledge Tree prompt: what point did you take, and where does it belong? |
| give a task a do date | Today, on that day; its project's list; the week plan's goal progress |
| time anything | Time tracking; nods on projects; hours on skills; time with people; the Review's *hours made use of* |
| practise at a score / in Japanese | hours on a *piano/music* or *Japanese* skill; a *Japanese/language* habit ticked |
| seal a letter or log a decision | Today, on its date |
| set a skill milestone | Today, within 30 days of it |
| take a values snapshot | the Review's long view; Maslow; the solar system's brightness |
| do the morning check-in | the Review's energy and set-point charts; the Days archive |
| practise the Morning Theatre | manifestation and gratitude entries; structural tension on a project |
| sit in stillness | a streak and depth reading; an insight can go to the intuition log |
| make a Tree page | `[[journal:…]]`, `[[library:…]]`, `[[writing:…]]` links back; journal saves offer it |
| select any text, `Ctrl/⌘+Shift+R` | a Study Deck card from that room |
| log Japanese errors | the notebook → grammar drills and Study Deck cards |
| play in Play to compose | a Repertoire score, or a Jazz exercise that checks you |
| set a project's income stream | Finance; the gap; the Definite Chief Aim |

### 25.3 Workflows that span several rooms

**From a journal to a published essay** — see §12.3 for the full walkthrough. In short: tag and link entries as you write them → catch the idea in the Content Studio → give the piece the same tags and dimensions → the research drawer fills itself → pin, cite as beats, insert with attribution → move the piece through the pipeline → *Book it in Planning* so the writing gets a do-date → publish, and every source says *used in* that piece.

**A book that changes you.** Log it in the Library (paste its Goodreads or Open Library link) → keep quotes as you read, each with *why it caught me* (they appear in your Quotes journal and can be pinned to Today) → on finishing, set its resonance and write *what it installed in me* → answer the Knowledge Tree's prompt (which position did it move?) → press ◆ on the line you want to remember for years → if it *changed you*, accept the offer to seed an essay, where its quotes wait in the drawer.

**A project, from spark to income.** A spark in *Ideation* → make it a project; its list appears in the planner's Projects folder → give it phases (they become the list's sections) and tasks with do-dates and estimates → each morning, the day's work is on Today; drag it to the clock → every sitting writes a nod and adds hours to the skills it develops → link its income stream in Finance; watch the gap close → it is one of the visions the Morning Theatre rotates through, and structural tension is written back onto it → the weekly review shows the week against the lists you made.

**Learning a piece of music.** Add the score → mark sections with target tempos → *practise this* each section; the gap between comfortable and target tempo is your progress → pins at the bars that catch you; mark the general lessons as unwritten rules → your piano skill collects the hours → sync a great recording and let the score follow it; play back its performance memory to hear the phrasing → ◈ study: confirm the harmony and form, and *Reflect* on a section in a journal entry, or send the insight *To the Tree* → the weekly review's *week at the score*.

**Keeping a friendship alive.** Tag them when they appear in your writing (the interaction logs itself) → give them a cadence; when they drift past it they surface in the Review → **☺ reach out** or log a quick interaction → write gratitude with them tagged (*who to thank*) → the quarterly review asks about your five closest; the annual shows the constellation a year on.

**A hard decision.** Log it in the decision journal with your real reasoning and what would make it a mistake → optionally, a Knowledge Tree **sealed prediction** with a confidence → on its review date it appears on Today → grade it honestly → the prediction's outcome feeds your calibration.

**Learning Japanese.** Grammar drill C (say something true about yourself) → it becomes an island in both registers, with its vocabulary → push the island to speed in a 4/3/2 sitting → mistakes go to the notebook → corrected mistakes go to the Study Deck, due on Today → minutes count on your Japanese skill and tick your language habit → *the week in Japanese* in the weekly review.

**Living your values.** Name and rank them → answer the four questions → link entries to them as evidence, embodied or betrayed → link habits and projects to them (a value nothing serves shows a dashed orbit) → a weekly snapshot → the quarterly review asks you to re-rank.

**An inner practice.** Morning: the check-in, then a Morning Theatre session about one of your projects → pinned passages to reread → sit in stillness; anything that arrives goes to the intuition log with what would confirm it → a divination reading kept as an entry, pinned if it said something you needed → weeks later, mark the intuitions' outcomes and read your hit rate by channel.

**Content for a public account.** Brand Strategy: the account's charter, voice and pillars → a 30-day plan with hypotheses → slots on the calendar → *Start in Writing Studio* → the drawer brings your journals and Library to the draft → the voice checklist before *Published* → the 30-day review confirms or revises the hypotheses.

### 25.4 Small habits that make the connections work

- **Tag consistently.** Pick a small vocabulary (`#discipline`, `#japan`, `#family`) and reuse it; `#/tag/…` and the Writing Studio both depend on it.
- **Open *Connect this entry* when an entry matters.** Linking a value, a person or a project takes seconds and is what carries the entry into the other rooms.
- **Name skills plainly.** A skill whose name includes *piano* or *music* collects score practice; *Japanese* collects Japanese practice.
- **Give tasks do-dates, not just deadlines.** The do-date is what puts work on Today.
- **Time things with the one clock** rather than keeping separate notes of how long you spent.
- **Use Additional** for anything a record has no box for, rather than bending another field.

## 26. Rhythms: a day, a week, a month, a year

A suggestion, not a rule — take what helps.

**Each morning (10–20 minutes).** *I woke up at* → a dream, or *none* → **Looking inward**: the check-in, a Morning Theatre session, your pinned passages → **Execution**: read today's plan, tick *tasks reviewed*, start the first sitting.

**During the day.** Work from Today's list; drag tasks onto the clock; note what each sitting and break is for. Capture with `N` (a task, a quick note), **＋ dump a thought** for half-formed ones, `Alt+K` for an idea for the Knowledge Tree, `Ctrl/⌘+Shift+R` for something to remember. Log interactions as they happen.

**Each evening (10 minutes).** Say what happened with each habit → **☾ Evening review** → **◑ Plan tomorrow** → *I am going to bed now*.

**Each week (Sunday, 30–45 minutes).** The **weekly review** (it includes a values snapshot) → **🗓 Plan next week** → empty the planner's **Inbox** → ring review in People → **💾 Export a backup**.

**Each month.** The **monthly review**; check skill milestones; log each income stream's month in Finance; look at the Library's queue.

**Each quarter.** The **quarterly review**: re-rank your values, re-read a past Timeline stage, revisit flagged synchronicities, the five closest, the money honestly.

**Each year.** The **annual review**: mint the year into the Timeline as a chapter, the compass across the year, who you became, the constellation a year on, the year in money, and three things the coming year is for.

## 27. Keyboard reference

Nothing fires while you are typing into a field.

**Anywhere**

| Key | Does |
|---|---|
| `?` | the keyboard card for this room |
| `/` or `⌘K` / `Ctrl+K` | search everything |
| `N` | make something new (the ＋ speed dial) |
| `Z` | focus mode — this page full screen |
| `Esc` | close what is open; leave focus mode |
| `E` | on a skill or a Library work: switch Living / Workshop view |
| `Alt+K` | quick capture to the Knowledge Tree |
| `Ctrl/⌘+Shift+R` | Remember this — a Study Deck card from the selected text |

**Today → Tasks:** `1` Matrix, `2` List, `3` Calendar; `N` add a task; `T` today; `E` open the first task; `F` the focus timer; `S` statistics.

**Lived Record:** `1` Journals, `2` Timeline, `3` Library; `N` new entry in this journal; `←` `→` step through Timeline stages.

**Content Studio:** `1`–`4` Pipeline, Calendar, Shelf, Numbers; `N` catch an idea; `W` open the piece and write.

**Writing Studio:** `1`–`4` Editor, Corkboard, Outliner, Manuscript; `N` new document; `⇧N` new folder; `[` `]` fold the drawer / the board; `W` typewriter scrolling; `R` readability; `C` snapshot; `X` compile and export; mid-sentence: `⌥R` readability, `⌥⇧1` / `⌥⇧2` / `⌥⇧3` mark a passage, `⌥⇧0` unmark.

**Repertoire:** `Space` play/stop; `L` loop.

**Study Deck:** `Space`/`Enter` show and Good; `1`–`4` Again/Hard/Good/Easy; `Ctrl/⌘+Z` undo; `-` bury; `@` suspend; `*` mark; `E` edit; `I` card info; `F` focus.

**Knowledge Tree text boxes:** `[[` opens the page list; `↑` `↓` move; `Enter`/`Tab` complete; `Ctrl/⌘+Enter` keep a capture.

## 28. Glossary

| Term | Meaning |
|---|---|
| **Additional** | the box on every record for anything that has no box of its own |
| **Bonus task** | a task added beyond the day's plan, counted beside the plan, never in it |
| **Cadence** | how often you want to be in touch with someone; past it, they surface as overdue |
| **Congruence** | how well you lived a value in a period, 0–100, from a snapshot |
| **Do date / due date** | when you mean to sit down with a task / when it is owed |
| **Drawer** | the Writing Studio's research drawer, which brings your entries, Library and fragments beside the page |
| **Entry** | the shared record every journal type, quote, reading, memory, decision, work and piece is built on |
| **Felt time** | the Timeline mode in which dense stages stretch and thin ones compress |
| **Graft** | a reasoned link between two Knowledge Tree pages (supports, contradicts, extends, echoes, raises) |
| **Island** | a memorised Japanese monologue on one topic, in both registers |
| **Living / Workshop view** | a detail page showing only what is filled / every field with its prompt |
| **Milestone** | a dated target in the planner that tasks can work towards (and that narrows every view when pressed); or a target level by a date on a skill |
| **Nod** | "I showed up and did this" — the smallest unit of work on a project |
| **Pin** | 📌 on an entry: keep it on Today to reread; 📌 on a score: a note at a bar |
| **Position** | what you hold on a Knowledge Tree page, at a stated confidence; revised by adding a new one |
| **Resonance** | what a Library work did to you: passed through, stayed with, changed, lives in |
| **Section** | a range of bars in a score with its own target and comfortable tempo |
| **Seed** | the second stage of the Content pipeline; also what *add as a seed* makes from an entry |
| **Set-point** | where you are on the 22-step emotional guidance scale |
| **Sitting** | one timed stretch of work on something, with its breaks |
| **Stage** | a chapter of your life on the Timeline; or a level of the Jazz or Songwriting curriculum |
| **Structural tension** | the gap between the vision and the honest present, held on purpose |
| **Thread** | a recurring motif running through several Timeline stages |
| **Unwritten rule** | a lesson from one score marked as true of music in general, collected across every score |

## 29. Questions and troubleshooting

**I opened the site and it is empty — where did everything go?** You are probably at a different address from usual (a file on disk versus the published site, or a different browser). Each keeps its own data. Open the address you normally use, or import your latest backup here.

**Is anything sent to the internet?** No, apart from fonts, a Library link's preview (fetched once from that service when you paste it) and — only if you added an API key yourself — the text you choose to tidy or analyse. Recordings, practice takes and microphone audio never leave the device.

**How do I get my data to a new computer?** Export a backup on the old one, import it on the new one — or set up *the same life on two machines* (§2).

**I deleted something by mistake.** Press **Undo** in the toast within five seconds. After that, your last backup is the way back.

**Can I rename or reorganise the sidebar?** Rooms can be moved between zones in Settings → Navigation zones.

**Why can't I edit an old mood reading or a Knowledge Tree position?** Readings taken at a time are kept as they were, so the record stays honest. Words can be edited; for positions, add a revised one — the history is the point.

**A field I need is missing.** Use the **Additional** box on that record.

**The sounds are distracting.** Turn off interaction sounds (🔕) and the ambient bed (🌊); the metronome and the score player have their own switches and are unaffected.

**Where are the old Planning, Compass, Time, Habits, People, Values, Skills and Finance pages?** Planning, Habits, the Compass (now Review) and Time tracking are views of Today; People, Values, Skills and Finance are tabs of Identity. Their old addresses still work.

**Where do the worked examples come from, and how do I remove them?** They were written to show what each room is for, and are all titled "Example ·" and tagged `#example`. Settings → Worked examples → **Take them out** removes every one and touches nothing you wrote.
