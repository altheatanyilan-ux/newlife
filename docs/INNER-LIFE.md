# The inward half of the house — a complete account

Reflections, journals, manifestation, the Morning Theatre, stillness and divination, values, the skill tree, people, the timeline, the library, the Knowledge Tree, and the reviews that read them all back. This is written from the code as it stands, not from memory of what was intended: every rule, number and threshold below is one the program actually applies. Where the code and an older document (`docs/GUIDE.md`) disagree, or where something described is no longer drawn, it is marked **Check** and collected in the last part.

It is a companion to `docs/GUIDE.md`, which says what each room is for. This says what each one *does* — including the quiet mechanisms you would only find by reading the source: what is counted, what is deliberately left out, what is versioned, what is frozen, what is guessed from a name, and what happens to the thing you just wrote after you press save.

---

## Contents

1. How the inward half hangs together
2. A day, lived inward
3. The Morning Theatre
4. Sacred space: stillness, the house, divination, the intuition log
5. The Lived Record: journals
6. The Timeline
7. The Library
8. Values
9. The Skill Tree
10. People
11. The Knowledge Tree and the Learning Studio
12. Reflection: the reviews, the Review page, and the lenses
13. When the house speaks: duties and prompts
14. How it all connects: what an action does elsewhere
15. What is local, what is optional, what is never sent
16. Things that do not match, and things worth knowing
17. Where to find things

---

## 1. How the inward half hangs together

**One hallway: the entry.** Almost everything you write is an *entry* (`S.entries`) with a kind, a title, a body, an `occurredAt` date, a `links` object (stages, sub-stages, threads, values with a polarity, skills, projects, people) and a bag of kind-specific fields (`extra`). A scripted morning, a kept tarot reading, a gratitude line given in advance, a focus wheel, a stillness insight sent to the intuition log, a dream, a decision — all of them are entries, so all of them are found by search, by the Days archive, by the reviews, by *On this day*, by the Timeline and by the evidence feed of any value they are linked to. Nothing in this half keeps a private copy of your words that the rest of the house cannot see.

**Four kinds of thing, kept differently.** The house is careful about which of these a thing is, and it is worth knowing because it decides whether you can change it later:

| Kind | What it is | Can you edit it afterwards? |
|---|---|---|
| **Words** | an entry's text, a day's intention and sentence, a stage's story | yes — and several are *versioned* so the earlier wording survives |
| **Readings** | a set-point, a congruence snapshot, a Maslow check-in, a mood on a past day, a stillness depth | the number is kept as you gave it; the Days archive deliberately shows readings read-only |
| **Positions** | the Knowledge Tree's stated belief and confidence | add-only: revising adds a new one; the old stays and is drawn as a line over time (a frozen store, restored by a guard if anything tries to change it) |
| **Marks of practice** | the 21-day tracker, stillness sessions, intuition outcomes | tracker days can be toggled by hand; sessions are records |

**Derived, not stored.** Most of what looks like a score is worked out when you look at it from what you did: the planets of the values solar system, the glow of a person, the bloom of a skill, the candles in the house, the Maslow tiers. They are never stored as numbers you could drift from. Where a reading *is* stored (a snapshot, a set-point), it is because it can only have come from you.

**Readings, not scores.** A number here is a bearing, not a mark. Several screens say so in words ("a record, not a scoreboard"; "an unticked milestone is information, not a failure"; "a step that always reads *nothing happened* is a step people learn to press past" — so those steps are simply not drawn when empty). The Time, intention and goal readings added later follow the same rule.

**No decision is made for you.** The Knowledge Tree *offers* links and never attaches them. Finishing a thought is only ever done by you. A review that is not done is not "overdue" if nothing happened in its period. A suggestion states its rule.

**Local.** Everything lives in this browser. The few optional exceptions (an Anthropic key you may paste in Settings, and link previews in the Library) are listed exactly in part 15.

---

## 2. A day, lived inward

The Today page has two halves of a day — **Execution** (doing it) and **Looking inward** (attending to it) — plus four rooms (Tasks, Habits, Review, Time tracking) that moved onto it. The two halves are separate views on purpose: reaching the check-in used to mean scrolling past the task list, which is being asked to reflect while looking at the work. Which half you were last in is remembered.

### 2.1 Waking

**"I woke up at …"** sits under the date. It is *never* written just because you opened the page: the old behaviour (opening the page counted as waking) wrote the time you first looked at your phone as your wake time before you could correct it. Now the line stays empty until you answer it — by pressing it, by the morning greeting, or on the Review's week-shape chart. A wake time you give is written to both the check-in (`wakeAt`) and the day's rhythm record (`wakeTime`) so the two cannot drift apart; there is one reading of "when did the day start" (the rhythm record, else the check-in, else the Settings default).

**Next to it, "record a dream".** A dream is gone within minutes of waking, so it is asked for here and not three pages into a journal. **"none"** is a real answer about a night (it is kept, and the dream calendar can then tell a blank night from a night nobody asked about). If you later remember one, the button reads *no dream remembered* and pressing it undoes the mark.

**The morning card** (first open of the day). One tarot card to begin the day, before the bedtime question: you choose one of six questions (*What do I most need to know today? What energy should I bring? Where should my attention go? What is asking to be let go of? What will help me most? What is today trying to teach me?*) or write your own; it is held while the cards are shuffled under a short dark "arrival" (*Take a breath. Let the night settle. Hold your question in your mind.*); the card is turned with a one-line meaning, up to four themes, and the long reading folded beneath; there is a box for *what it says to you this morning* and a tick to pin it to Today. **Keep it** files it as a Divination entry (spread "the morning card"); *begin the day without keeping it* does not file it (it was drawn either way). It appears once a day, and:

- the first-ever visit is not a "morning" (that day is marked asked, so a new house does not open on two dialogs);
- it waits until the first-run questions are answered, and never opens on top of another dialog (it waits for your next visit to Today);
- it is skipped late at night (past the day boundary but before bed);
- "not today" still counts as the day's ask; "stop asking each morning" turns it off until Settings › Atmosphere turns it back on;
- *taking it elsewhere* (the ⤓ button) writes the card, what it means and the life around it as a Markdown file for another reader — see part 4.

**The morning greeting.** After a night away (five hours or more since the page was last seen, and the effective day has turned over, and you have not already given a wake time, and it is not still "late night") a small two-question dialog asks *what time did you go to bed* and *what time did you wake*. The bedtime is filed against **yesterday** — the night belongs to the day that ended — and the waking against today. Dismissing it is an answer; it does not ask again that day. The card, if due, comes first and the greeting after it.

**The day boundary.** The day turns over at a configurable hour (`dayBoundaryHour`, default 4 a.m.). Between midnight and that hour the page says *still Tuesday* with a moon mark, and the bottom of the page offers "Ready to close the day?" — **I am going to bed now** files the bedtime against the day you have been living; **start a new day** (for an all-nighter, or a day closed early) closes the day by hand and is remembered, "because the person is the authority on when their day ended".

### 2.2 The daily check-in

Three things, all editable in place:

- **Today's intention** — one thing to give attention to. If you planned the day the night before ("Plan tomorrow"), it arrives prefilled and says *set last night*.
- **How is today going?** — as long as you like; it is a multi-line box on purpose ("the days that need more than a sentence are the ones worth having written down").
- **Emotional set-point** — a slider on Abraham Hicks' 22-step guidance scale (1 Fear/Grief/Despair/Powerlessness → 11 Disappointment → 22 Joy/Appreciation/Empowerment/Freedom/Love). The handle *sits* at 14 when you have not set one, but nothing is stored until you move and release it — until then the line reads *place yourself on the scale*.

The mood shapes (open, tender, charged, settled, flat) and the four energy dimensions were taken out of the check-in by request. What earlier days recorded in them is kept, and the Days archive and the Review still read it; the Maslow "body energy" and "mind energy" inputs, which depended on the energy dimensions, simply drop out (see part 12) when nothing new is being written.

The section opens by default only when you have not yet set an intention or a set-point and it is not late night; it folds itself away past midnight ("something you did fifteen hours ago"). **What is folded open or shut is remembered per section, not per day.**

### 2.3 The three ticks

In the headers of **Daily check-in**, **Morning Theatre** and **Today's tasks** there is a small tick box with the time you ticked it, and — if you gave a wake time — how long after waking (`+ 47m`). They are a quiet morning flow, not a checklist that scolds. Ticking *Morning Theatre* also marks today on the 21-day tracker (and starts the cycle if there is none); unticking it does not remove the day.

### 2.4 Pinned, unfinished, decisions, letters

Four things appear in or around the inward half because they are about *you later*:

- **Letters from yourself that have come due**, above both halves ("A letter from you has come due"), until you open them.
- **Decisions ready to grade** — decisions whose review date has arrived.
- **Pinned** — entries you marked 📌, drawn in the Morning Theatre's opening screen.
- **Unfinished** — the half-written things, last on the page, oldest first (part 5.9).

### 2.5 Evening and "before you sleep"

*Before you sleep* is the foot of the execution half: **Plan tomorrow** (the board and the three intentions), **Plan the week** (primary on Sunday evenings after 17:00), the **Evening review** and any review chips that are due (part 12.1). "A day decided the night before starts already moving." Tomorrow's three intentions, once named, are what prefill tomorrow's check-in.

### 2.6 What the header cycles through

The faint line under the date cycles every six seconds, in the dark theme only, through: the season and the moon's day (*Autumn · day 11 of the lunar cycle*), a greeting by the hour (the small hours / good morning / good afternoon / good evening / late, and still up), the moon's name, and — if you gave one — the name of your set-point rung.

---

## 3. The Morning Theatre

A practice of rehearsing the future you are building, drawn from Maltz (*Psycho-Cybernetics*), Hill (*Think and Grow Rich*), Hicks, Wattles and Fritz. It lives under Today → Looking inward.

### 3.1 Two ways in

- **Guided** (default): it asks one question you can answer without knowing what any practice is — *How are you feeling about your visions right now?* — and then how long you have, and assembles the session. **The five answers** are 🔥 On fire, 🌫 Foggy, 😤 Resistant, 🙏 Grateful, ✨ Inspired; **the three lengths** are 5, 15 or 30 minutes.
- **Manual** (⚙ *Manual mode*): the nine practices as an accordion you can drag into your own order. The order is remembered. A practice added later is inserted *next to the one it was designed beside* (before the one it comes before), not dumped at the bottom — and not at the top if you dragged its neighbour to the top.

### 3.2 What the guided session builds

A mood picks an ordered recipe; the length decides how many of its steps fit:

| Feeling | 5 min | 15 min | 30 min |
|---|---|---|---|
| 🔥 On fire — *channel it into something vivid while it is here* | a scene | scene, scripting | scene, scripting, structural tension, aim, vision board |
| 🌫 Foggy — *find out what you want and where you actually are* | structural tension | tension, self-image script | tension, script, winning feeling |
| 😤 Resistant — *do not push; find the nearest thing that feels better* | the focus wheel | wheel, thanks in advance | wheel, thanks, winning feeling |
| 🙏 Grateful — *amplify what is already flowing* | thanks in advance | thanks, scene | thanks, scene, scripting |
| ✨ Inspired — *write it down boldly before the inspiration goes* | scripting | scripting, scene | scripting, scene, vision board |

**The chief aim is always there.** If a recipe does not already contain the Definite Chief Aim, it is appended at the end — so a 5-minute session is really two steps. (The one place it is not last is the thirty-minute *on fire* recipe, which deliberately places a short vision-board browse after it as a fade-out; the rule that holds everywhere is "one chief aim, never none and never two".) Each step carries an "about N min" label (5-min: 4 and 1; 15-min: 7, 5, 3; 30-min: 12, 8, 5, 3, 2) — a guide, not a countdown.

Each step *is* the manual panel, drawn one per screen with its summary hidden and the details forced open. A scene built in a session is the same scene, saved the same way.

**Leaving early** (*leave — what you wrote is kept*) keeps whatever the practices wrote, because each saves itself as you go. It does **not** log the session and does not tick the tracker for the *session* — though any individual practice you completed (a scene filed, a script kept, thanks given) has already marked the day itself.

### 3.3 Which vision it is about — and an important caveat

The session picks "today's focus": one vision for a 5-minute session, two otherwise, from a **rotation queue** so every vision gets its mornings over a week or two rather than only the favourite. A vision is eligible if it is not archived, its confidence is not *lived* and its status is not *completed*. Its score is

> days since it was last practised × 2 + (100 − structural tension) + 10 × (1.5 if its confidence is *committed* or higher, else 1)

with *never practised* counted as 45 days, not zero. Structural tension is 0 if the vision has no "current reality" or no written future (its future memory plus its sensory notes); otherwise `(min(currentReality,600)/600 × 50 + min(future,1200)/1200 × 50) × (1 − rung/8)`, where the confidence ladder is *hunch, exploring, plan, committed, in motion, lived* (rung 0–5). So a thin, long-unvisited, committed vision rises. You can *pick different ones* (up to 1 or 2). When a session finishes, each chosen vision records `lastMorningTheatreDate` and a count, so the rotation moves on. Step *n* of the session uses vision *n mod count*.

> **Check.** There is no longer any way in the interface to create a *vision* (the Vision page was retired), so this queue reads whatever visions already exist in your data (older installs, imports, the starter examples). For a fresh install the screen says *There are no visions on the tree yet, so this session is about the practices alone* — which works. Meanwhile the **structural tension** and **scene/script/thanks** project pickers read **projects**, and the Projects page is also gone: a project now exists as a Planning list that has been *made a project* (it gets a project record with the list's id, in the Projects folder). The empty state of the structural-tension panel still tells you to "name a project first, on the Projects page", which no longer exists. `docs/GUIDE.md` §7 says the session is "about one of your projects"; the code rotates *visions*.

### 3.4 The nine practices

**Self-image script** (Maltz). A free field, first person, present tense: *who you are becoming — vivid, sensory, felt as already real.* It is read back in the Morning practice review and in the annual rite ("Who did you become this year?"). The Performance goals' optional *persona line* is **offered** here (*+ I am someone who…*) — never added for you.

**The winning feeling** (Maltz). Recall a real success; capture the feeling and weld it to the vision. One free field, read back in the morning-practice review.

**Pinned.** Your pinned entries, so they are the first thing you reread (part 5.8).

**Vision board.** Four kinds of card — an image, a quote (with who said it), a description, an affirmation — each with a part of life (*Body, Home, Relationships, Work, Experience, Being, General*), how looking at it feels (*excited, peaceful, powerful, held, free, proud, light, certain*) and optionally what it serves. Cards reorder by drag (which rewrites their order, so what you see is where they actually are); **shuffle** deliberately re-deals the order "so the eye does not stop seeing them"; **focus mode** shows up to five at random, one at a time, large, five seconds each (or tap for the next), and finishing it marks the day. Images and quotes from anywhere in the house reach the board with ▣ (journal entry cards with a picture or a quote) — the pinned image carries its caption, a quote carries who said it.

**A scene, entered.** Five screens: *where* (place, indoors/outdoors, time of day, temperature), *what it is like to be there* (see, hear, feel on skin, smell), *you in it* (what you wear, what you are doing, who is there and in what mood, one line of dialogue), *the feeling* (how you feel; **vividness** and **felt intensity**, each 1–5), and *step out of it*. The last screen quotes Hicks: get in quickly, feel good, and get out — "do not stay so long that you start looking for it to have happened." A scene is re-openable and "grows" rather than being replaced. Vividness and intensity feed the Review's Morning Theatre digest as averages.

**Scripting.** Write the day as though it has already happened. Eight categories (*Today, This week, Body, Home, Relationships, Money, The whole life*) and an optional project. Words are counted. **Keep it** also files a **Manifestation** entry tagged *scripting* in the Lived Record, so the Review and search find it.

**Structural tension** (Fritz). Two boxes — *what you want* (as a result, not a wish) and *where you actually are* (honestly, without softening). Two buttons: **save both** and **I choose this result**. What you write is **also written back onto the project** (`description` ← the vision box, `notes` ← the reality box), so editing it here changes the project. Once saved, the next time it opens it prefills from your latest record (else from the project).

**Thanks, in advance** (Wattles). Three lines of gratitude for what has not yet arrived; **Give thanks** files a **Gratitude** entry tagged *anticipatory*. *Give thanks again* removes today's thanks *record* so you can write a fresh one — note it does not remove the journal entry the first one made.

**The focus wheel** (Hicks). For the day you do not believe any of it. *What feels bad*, *what you would rather feel*, the belief in the centre of the wheel, and a ring of up to twelve thoughts, each a little easier than the last. Saved as a **Reflection** entry tagged *focus wheel*. In a session it opens on top; close it and press next.

**Definite chief aim** (Hill). "By [date] I will have [exactly this]. In return I will give [this]." Read aloud, morning and night. A session always ends on it. Finance can *carry the gap* into it (**→ update the Definite Chief Aim with this number**).

### 3.5 The 21-day tracker

A row of 21 squares from the *cycle start*. Anything that counts as practice marks the day: a finished guided session, a scene, a script, a held tension, thanks, a wheel, finishing vision-board focus mode, adding something to the board, ticking *Morning Theatre* in the header, pressing **Mark today's practice**, or finishing the Morning practice review. **You can click any square up to today to toggle it** (a missed day can be corrected either way; future days cannot be marked). **Begin a new 21-day cycle** moves the cycle start to today — it asks first, and past days stay in the history (they are not erased; the streak counts from the days list).

The *streak* shown elsewhere (the Maslow "morning practice" input, the Review digest) counts days in the days list, not just the current cycle, and treats today-not-yet-practised as a day still going rather than a break.

### 3.6 What the Review reads from it

`theatreDigest(from, to)`: days practised, scenes, scripts (and total words), tensions held, thanks given, wheels, and the mean vividness and intensity of scenes.

---

## 4. Sacred space: stillness, the house, divination, the intuition log

The receptive half of the practice. It is the section **My sacred space** under Today → Looking inward, drawn as a house you walk through, with a second view — **what to do here** — that is the same practices as plain controls. (Which view you were in is remembered for the session.) The practices are the same in both.

### 4.1 Stillness

Four kinds, each with a length (3, 5, 10, 15, 20, 30 or 45 minutes), a streak and a "depth" reading. Your last choice of kind, length, anchor, pattern and picture is remembered.

**Meditation.** A timer and a circle that swells and settles over ten seconds (a cosine, "a restful pace to follow without being told to"), and nothing else. You choose what to hold on to: *counting the breath* (a breath counter appears), *a sensation in the body*, *whatever sound is there*, or *a word, repeated* (one soft word, written on the screen and breathing with the circle).

**Breathwork.** Four counted patterns, drawn exactly as they run, with the cue words *breathe in / hold / let it go / rest* and a count of breaths:

| Pattern | in – hold – out – rest (seconds) | Note it carries |
|---|---|---|
| Calming | 3 – 0 – 6 – 0 | Loehr: a long exhale lowers arousal |
| Box | 4 – 4 – 4 – 4 | balance and focus |
| Energising | 4 – 7 – 8 – 0 | Wattles: fill the lungs full |
| Deep rhythm | 5 – 2 – 5 – 2 | slow and even, for a long sitting |

**Body scan.** Maltz's four mental pictures, one card at a time: release the muscle groups in turn → one picture of your choice (*Legs of concrete, A loose marionette, Deflating balloons, A remembered place*) → the autogenic line (*My nerves are in perfect order…*) → *Now stop reading, and rest.* The cards advance on their own every twelve seconds, or sooner when you press *next*; then the timed rest begins.

**Sanctuary.** A quiet room you build once and come back to. Four questions: the door at the top of the stairs, the colour of the walls (soft blue, light green, warm gold, pale cream), what the window shows, and what else makes it safe. Afterwards you only re-enter it ("Climb the stairs… You left your worries at the foot of the stairs") and *build it again* clears the built flag (the old words remain as the prefill). Each visit is counted.

**Every sitting starts in the dark**, the way the cards do: a short full-screen arrival (*Sit tall, and let your shoulders drop…* for breathwork; *Lie down, or sit with your back supported…* for the scan; *Picture a door you have never opened…* for the sanctuary).

**The clock.** A sitting starts the one clock (category *meditation*, feature *stillness*) — refused if something else is already running — and the clock entry is closed when the session is saved. So stillness shows up in Time tracking as well as in its own log.

**After a sitting** you are asked, in this order: how deep it went (1–5, *restless → deep peace*), how clear (1–5, *foggy → crystalline*), anything in the body (numbness, swaying, twitches, warmth, tingling, lightness, heaviness — with Hicks' line *smile, and acknowledge them*), and *anything arrive? An image, a sentence, a knowing* — "leave it empty if nothing did. Most days nothing does." If something did, one tick sends it straight to the intuition log (kind *flash*, strength 3, state *relaxed*, source *stillness*, and the session's id so the two know each other). Ending a sitting early records the minutes you actually sat (capped at the plan).

**The streak** counts consecutive days with any minutes. A day you have not yet sat is a day still going, not a break.

**Habits it can credit.** Saving a session ticks any habit that is *linked to the stillness room* as kept for the day. For habits written before rooms could be linked, there is a name test (a name containing *medit*, *still*, *breath* or *sit*) — but only for habits that have no room links at all and whose link to the clock has not been confirmed or declined. The name test stays in place until you say it can go.

**What the Review reads:** sessions, total minutes, days sat, mean depth and clarity, and a count and minutes by kind.

### 4.2 The house

Four zones, each one drawn scene: **the main room** (down; Garden to the left, upstairs above), **the sanctuary** (upstairs; the roof above), **the garden**, **the roof**. Every object is a door into the part of the instrument it pictures — you do not press *Tarot*, you reach for the deck. The sidebar does not go anywhere; the house is another way in, not a replacement.

The house is, in the code's own words, "the most honest vision board this app could have": it starts nearly empty and fills from your record, and **nothing in it is decoration pretending to be progress**. Every property is read off something you did:

| What you see | What it is read from |
|---|---|
| the **candles'** height | the last time you sat: today 100 %, yesterday 85 %, within three days 65 %, within a week 45 %, longer (or never) 30 % |
| the **cushion's** mark; a **vine** with a leaf per day (up to nine) | having ever sat; a streak of three days or more |
| the table's four systems **glowing** | which systems you consulted *today* (until tomorrow) |
| **books on the shelf** | media entries in the Library (up to 24 drawn) |
| the **wall of coincidences** | synchronicity entries |
| the **piano's stand and the stack of sheets** | skills whose name or category looks musical (*music, piano, guitar, sing, jazz, instrument*); the stack is half their number, up to four; those in *In focus* or *Active* count as learning |
| the **card box** | the Study Deck's due count (read only — it never creates the deck) |
| the **bar's** drinks | "From the bar" entries (the Drink Naming Ceremony: draw a card and its keywords decide a drink you name and keep on a menu — the one purely playful thing in the house) |
| the **herbs'** height (garden) | the mean *current congruence* of any value whose name looks like *health, body, rigour, vital* (default half; never below .15) |
| the **Japanese** plants | sessions in the last seven days ÷ 5 |
| the **fire** (garden) | letters; the **chest**: stage artefacts; the **tree**: skills not "planned" and not in *Future* |
| the **sky** and **stars** (roof) | your values (up to eight planets) and your people (between 6 and 26 points of light) |
| the light | the hour: night before 05:00, morning to 10:00, midday to 16:00, evening to 20:00, night after |

Moving between zones is a walk (a short animation, skipped under reduced motion). The zone you stand in is remembered.

> **Check.** The shelf, wall and bar read entry *types* by name; the musical-skill test and the health-value test are **name guesses** (regular expressions), so a skill called "Cello" with category "Craft" will not put anything on the stand. They are decoration — nothing else depends on them.

### 4.3 Divination — a mirror, not a fortune

It deals a symbol and asks what *you* make of it, and keeps your answer. Every practice opens on the same full-screen moment (a few lines to arrive by, and your question) before anything is shuffled.

- **Tarot** — the 1909 Rider–Waite–Smith deck in its printed colours, 78 cards, each with a one-line summary, themes, a long reading, the questions it asks, counsel, and (in a spread) what it means *in that position*. A draw is a real shuffle without repeats (a card cannot come up twice in one draw); with reversals on, each card has a 30 % chance of arriving reversed. Reversals can be switched off. Twenty spreads in five groups (a card before breakfast; three-card frames; five-to-seven; the long classical layouts such as the Celtic Cross and the twelve houses; occasions) with a sentence for each position, and you can design your own. Randomness is the browser's `Math.random`.
- **I Ching** — three coins or fifty yarrow stalks, with the hexagram built line by line including changing lines. The two methods have different distributions and the reading **keeps which one you used** and what each toss actually was ("a reading that does not say which one it came from cannot be read back properly"): coins give old yin 1/8, young yang 3/8, young yin 3/8, old yang 1/8; yarrow gives old yin 1/16, young yang 5/16, young yin 7/16, old yang 3/16.
- **Charms** — thirty symbols thrown on a round cloth. Nothing has a position; what matters is **which ring it landed in, which quarter it faces and what fell beside it** (sixty pairings are written out; where there is no written pairing the reading says the plain thing, which is two sets of themes). Face-down charms are read only if you turn them. You may add up to ten charms of your own. A cast keeps where every charm landed because "the positions are the reading".
- **Oracle cards** — one card and its line from a deck of short instructions (e.g. *Rest. The work is not the problem. You are tired.*).
- **A reading on paper** — type in a reading you did with a real deck ("3 cups", "knight of swords") or drag charms to where they actually fell; it gets the same reading, marked as from paper.
- **The directory** — all 78 cards, 30 charms and 64 hexagrams with everything they mean *and* every time each has come up for you: in which spread, which way up, what you asked, and what you wrote afterwards.
- **Keeping a reading** files an entry of type *Divination* (tagged *divination* and the system) with the question, the cards or lines, the spread, the method, where the cards came from (dealt here or laid out on paper), and your words. A kept reading can be pinned. The table in the house shows which systems you consulted today from these entries.
- **Taking a reading elsewhere (⤓).** Beside *Keep* on every reading (and on the morning card, and on every kept reading) is a button that writes one Markdown file for another reader — a person, or an AI you want a personal reading from: the question, what came up, what it means in the deck's own words (in full or in brief), what you made of it, and a note to whoever reads it. Then as much of the life around it as you choose — *how wide* (that day, week, month or three months, counted back from the reading) and *which parts*, each showing how much it holds before you tick it: plans and intentions, tasks and milestones, how I have been (check-in lines, set-points, bedtime, evening notes), other readings and the cards that have come up more than once in three months, journal entries (off at first; each kind can be left out), what I am building toward, and habits (off at first). It is made on this device and goes only where you take it; writing a reading out does not keep it, and your choices are remembered.

### 4.4 The intuition log

Hill says the sixth sense comes slowly through application; Maltz says the capacity is trainable. Neither says how you would know whether yours works. This does: record the impression **before your conscious mind tidies it**, say what would confirm or deny it, and come back.

- **Capture ("Before it goes")**: what you sensed, its **kind** (*a hunch in the gut, a flash of insight, something a dream said, a physical sensation, simply knowing, a coincidence that meant something, something arriving whole, unease/a warning*) and **strength** (1–5, *vague → unmistakable*). Everything else is "the rest of it" and usually filled in later.
- **The rest**: the **state** you were in (*relaxed/quiet, working/busy, half asleep, stirred up, walking/moving, mid-conversation*), what set it off, whether it **can be checked**, what would confirm or deny it, and when to look (a week, a fortnight, a month, three months — default a week — or never), and optionally a project.
- **Marking what happened**: *it happened, partly, it did not, cannot tell yet, overtaken by events.* **"Cannot tell yet" is not an answer, it is a postponement** — the entry stays open and its check date moves two weeks on. An entry becomes *due* when it can be checked, has no outcome and its date has arrived.
- **What counts.** A hit is *it happened* or *partly*. A miss is *it did not*. "Cannot tell" and "overtaken" are left out of the rate entirely "because they are not misses".
- **What it learns about you** (shown in the Review for a period): how many logged, how many checked, the % right, how many are still waiting, a trend (only with six or more checked: it compares the first half of your checked run to the second; a rise of more than 12 points is *improving*, a fall of more than 12 is *slipping*, else *steady*), the **strongest channel** and **best state** (only counted when a channel has at least two checked entries), and whether the ones that came true felt *stronger, weaker or the same* at the time than your average.

---

## 5. The Lived Record: journals

The record of a life, in three views (keys `1`, `2`, `3` when you are not typing): **Journals**, **Timeline**, **Library**. This part is the first.

### 5.1 What a journal is

A journal is one *kind* of entry listed down the left with its count. Nineteen kinds exist (Uncategorized, Decision, Life event, Memory, Reflection, Synchronicity, Manifestation, Gratitude, Dream, Progress, Nod, Artifact, Letter, Quote, Question, Visualization, Divination, Intuition, From the bar). **Five are kept out of the sidebar** because their entries are read somewhere better — Memories and Life events (the Timeline), Media (the Library), Progress (written from the Skill Tree), Uncategorized (a lost-property box). They are hidden, not deleted: every entry still appears on the Timeline, in the Library, on a skill, and in search; *manage journals…* lists them. You can add your own kinds (＋ *new journal type*), rename and reorder them, and delete one — in which case you choose between moving its entries to *Uncategorized* (which is created if it does not exist) or deleting them too; either is undoable for a few seconds.

Each journal page has: **On this day** (earlier years' entries of this kind whose month and day fall within three days of today; where the day itself has entries, only those), a search over title and body, a date range (on `occurredAt`), a tag filter by stage, thread, value, skill or project, and a 🎲 *random one*. (The tag filter is a text match on the entry's links, so it matches by id.)

### 5.2 Writing an entry

`N` (or the ＋) opens it. The painting across the top changes with the kind and redraws itself when you switch, "the fastest way to see that the click landed". Fields common to all:

- **Title** (optional) and **Body** (Markdown). *You must write at least one of them* ("even one line").
- The kind's own questions (5.3).
- **Additional** — "anything else", a free box every entry and most records carry.
- **People** — tag who was there (the question changes with the kind: *who was there*, *who to thank for this*…). A filter appears once you have more than eight people; **＋ someone new** creates a person on the spot. Tagging does real work (part 10).
- **Hashtags** — only for the kinds where they make sense; one thread through many entries.
- **Occurred at** — an exact date, or a fuzzy one (*Summer 2019*, *age 15*) so a memory about decades ago can be logged today. Exact dates sort exactly; fuzzy ones sort by their best reading.
- **Media** — pictures, with captions.
- **Connect this entry** — stages, sub-stages of the linked stages, threads, **values** (click once for *embodied* **+**, again for *betrayed* **−**, a third time to unlink), skills, places, emotions, and a **confidence ladder** for future-facing entries (*hunch → exploring → plan → committed → in motion → lived*). If you link nothing, the form says "Consider linking this to a stage, a value, or a vision — that is how the house connects."
- **Still unfinished — keep it at the bottom of Today.** The switch is the *only* thing that clears the flag; saving an edit does not decide on your behalf that a thought is finished.

**The writing clock.** How long you spend writing an entry is recorded — only the time you were actually in the form; time away is not counted. Today shows a *Time spent writing* tally for a day something was written (and never a zero: "a zero here would be a reproach, and this is a record, not a scoreboard").

**After you save**: a ripple takes its colour from the first value (or stage) the entry is linked to; the Knowledge Tree is asked after 0.4 s whether any page title appears in what you wrote — it *offers* links and never attaches them; an entry that came from a review writes the change back into that review; a quote naming a work is added to the work's passages.

### 5.3 What each kind asks, and what it does quietly

- **Reflection** — how you were when you wrote it (*heavy, low, level, light, luminous* — "not the subject of the reflection, the state you were in"), what prompted it, how deep it went (*surface, sitting with it, breakthrough*). Nothing is required. Reflections are what the Review's *record* section counts, the focus wheel files, and the annual rite's "write the year's narrative" step creates.
- **Gratitude** — *Why does this matter to me?* ("My health" becomes "I could run with my dog this morning without pain."), whether it is *something new* or *something ongoing* ("over time this shows whether the practice is deepening or running on autopilot"), and who to thank. The anticipatory ones from the Theatre carry the tag *anticipatory*. **Check:** the "why" field is labelled *(required)* but the save rule only enforces it for quotes.
- **Dream** — vividness 1–5, emotional tone (*anxious, joyful, surreal, mundane, prophetic, nightmare, lucid*, several allowed), recurring, symbols (comma list → the dream dictionary), and a **waking interpretation** that is **versioned**: if you revise it on a later edit, the earlier wording is kept. The time it was captured is stamped ("the closer to waking, the truer the record"). The journal also shows **the dream calendar** and **the dream dictionary**.
- **Synchronicity** — what preceded it, *what I read into it* (**versioned** the same way), how convinced you are (*noise, curious, significant, unmistakable*), and **revisit later**. *Significant* and *unmistakable* ones get a stamp; flagged ones come back in the quarterly review.
- **Manifestation** — status (*held, evidence appearing, arrived, released*; **arrived** gets a stamp on its card), **where you were on the emotional scale when you set it** (a slider that defaults to today's set-point, else 11, with Abraham's point that "an intention set from alignment behaves differently from one set from desperation"), *resistance notes*, and an **evidence log** (one line per entry; each line keeps its original date if you re-save with the same wording).
- **Question** — the question goes in the title; *why I am asking*; status *open, evolving, settled, dissolved* ("some questions dissolve rather than resolve — the framing was wrong"). Questions never get archived. Each can collect **answers**, each *tentative, evolving or settled*; a *settled* answer moves an *open* question to *evolving* (not to settled — that is a separate button, whose toast offers a reflection *from question to answer*); *dissolve* says so in words. **Open questions come back**: every morning practice, evening review and weekly review (when any are open) has a step *Any new light on these?* that adds a tentative answer.
- **Quote** — which work it is from (a select from your Library, with ＋ for a work you have not added; the entry then becomes a passage of that work), author, source, link, page, **why this caught me (required — "a quote without this is a bookmark, not knowledge")**, and what kind of words (*wisdom, craft, beauty, provocation, comfort, challenge*).
- **Memory / Life event** — *what this installed in me*: the belief, fear, pattern or capability it left. These are the Timeline's formative events.
- **Letter** — direction (*to my future self, to my past self, from my past self*). A letter written here is a normal entry; **sealing** is a separate act (5.5).
- **Decision** — 5.6.
- **Progress / Nod** — duration (minutes) and resources. Progress entries are *the* record the skill page reads (part 9 — and see the Check there).
- **Divination / Intuition** — written by their rooms (part 4).
- **Visualization, Artifact, From the bar** — the Theatre's scenes, objects that mattered, and named drinks.

### 5.4 Every entry card

One row of actions on every entry card, anywhere it is drawn: **edit**, **✂** save it into a Writing Studio piece, **▣** onto the vision board (shown only for quotes and entries with a picture), **📌** keep it on Today, **◆** make a Study Deck card of it ("you will be asked for it again in a week, then a month"), **×** delete with a five-second undo. Long bodies are clamped; pressing one expands it. Entries linked to Tree pages show *feeds* chips.

### 5.5 Sealed letters

*Seal a letter* (from the Letters journal, or the annual rite's last step): a title, the letter, and **when it opens** — in three months, six, a year (default), two or five years, or any date. It is then hidden **everywhere**: from its journal page (shown as a sealed card — *Sealed until … — N days from now. Whatever is in here was written for someone you have not become yet.*), from search, from *On this day*, from the Timeline. When the day arrives it surfaces at the top of Today (*A letter from you has come due*) until you open it. Opening it records the date and gives you a box: *What did the person who wrote this get right, and what did they not know yet?* — the reply is kept on the letter. A date that is not in the future simply opens immediately.

### 5.6 The decision journal

Written now, read later: *the gap between why you thought something and what actually happened is where self-knowledge lives — but only if you write the reasoning down before you know the answer.* Fields: the situation, options considered ("including the one you rejected fastest"), what you chose, **why — my reasoning at the time ("the real reasons, not the presentable ones")**, what you expect ("be specific enough to be wrong"), **what would make this a mistake** ("the signal you would need to see to change your mind"), optionally the **risk worksheet**, how sure (*a coin flip, leaning, fairly sure, confident, certain*) and a date to come back (default 180 days). On that date it appears on Today (*Decisions ready to grade*) and as a review chip. Grading shows *what you thought at the time* above the empty fields: what actually happened, what you got right, what you did not see, **what you would tell yourself** (one sentence), a verdict (*right for the reasons I thought, right for other reasons, wrong and I can see why, wrong and I still would have chosen it, too early to say*), and **mark reviewed** (which can be undone). The panel warns: *do not reread the reasoning above and then write what you wish you had thought.*

### 5.7 The dream calendar and dictionary

- **Three states per night**: a dream written (≥ 1 dream entry dated that day), *no dream remembered* (the "none" button), or *not asked*. Six months at a time (← earlier steps back six), Monday first. The header says **N dreamt · M blank · X % recalled when asked** — where X is dreamt ÷ (dreamt + blank): nights nobody asked about are excluded, so it is recall *when asked*, not overall.
- Clicking a night opens its dream, lists several, or (if empty) offers *write the dream* / *no dream remembered*.
- The **dictionary** is every symbol you tagged, counted (lower-cased; the 24 most common), sized by how often; a symbol button filters the journal to every dream carrying it; a recurring-dream count sits beside it.

### 5.8 Pinned

A pin is a **flag on the entry** (`pinned`, `pinnedAt`), not a separate list — so deleting an entry never leaves a dangling pin to sweep. Pinned entries gather on the Morning Theatre's opening screen (and as a *Pinned* panel in manual mode), most recently pinned first, drawn exactly as they are anywhere else (a pinned reading looks like the reading), and the 📌 that put one there takes it away. They are "for the ones you know you need to hear again rather than merely to have written down".

### 5.9 Unfinished

*Dump it* is one field and one keystroke (⌘/Ctrl-Enter); no title, no type, no date — "every one of those is a decision, and the whole point is that there is no time to make any". It lands as a **reflection**, from the first keystroke a real entry (searchable, linkable, backed up), carrying a flag. There is no draft store and no conversion step: **finishing it only clears the flag**, and works on *any* kind of entry (a dream caught at 3 a.m.; half a decision). The list sits last on Today, **oldest first** ("the one that has waited longest is the one most likely to be forgotten"), says *waiting N days*, and nothing ever expires it. The count also rides in the index at the top of the page. *Finished* has an undo (*not yet*).

### 5.10 The Days archive

At the bottom of Today → Review. Every day you put something into, as you left it, newest month open and the others built only when opened (a year of days is hundreds of rows). A day is listed only if it has *content*: a check-in intention, sentence or set-point; a wake or bed time or a block; a habit kept; a task dated to it; an entry **created** that day (note: by creation date, not `occurredAt`); a focus or stillness session. The store having a key for a date proves nothing — anything that glances at a date leaves an empty record behind — and **future days are never listed**. Opening a day: the intention and the sentence are editable ("a typo in it is worth fixing"); **the readings are read-only** — mood, set-point, energy, woke, slept (marked *assumed* when inferred) — because "a record you can quietly improve after the fact is not a record." *Set the two ends of this day* edits wake and bed times.

---

## 6. The Timeline

The museum of the past — your life as **stages** (chapters) on a spine, with **threads** woven beneath, in the same room as the journals.

- **Stages** are tiles with a character, name, tagline and years. A stage's entries are those linked to the stage *or any of its sub-stages*.
- **Threads** are recurring motifs through many stages. Each draws as a ribbon whose thickness at each stage is the number of that thread's entries there (a little over 2 px up to 14, scaled to the busiest stage). A thread's status — *active, dormant, resolved, transmuted* — decides how its ribbon ends: an active thread continues as a dashed line beyond the last stage; the others end in a ring (a cross for *transmuted*). *Read the narrative* lists every entry on the thread grouped by stage (with an "untethered to a stage" group) and the people you have tagged to it.
- **Clock time / felt time.** Clock time gives every stage the same width; felt time weights each tile by `0.6 + 1.4 × (its entries ÷ the busiest stage's)`, so dense stages stretch and thin ones compress.
- **Tensions** (a second tab with Threads): dialectical pairs you live between — left pole, right pole, optionally tied to a thread. A slider logs a reading (0–100) with a note; the history draws the **oscillation** as a sparkline. Readings can be deleted individually.
- **A stage's page**: character, name, tagline, years; **The story I tell about this stage** — the heart of it, and **auto-versioned**: when you edit it, if the old text was not empty and either (a) fewer than 85 % of the old text's distinct words survive in the new, or (b) the length changed by more than 20 %, the **old** text is pushed into *The story I used to tell* and a toast says so ("your interpretation of an era is supposed to change"). A small edit (a typo) does not make a version; *Save version* makes one on demand. **Sub-stages** (name, description, photos, the formative events filed to them), a **retrospective values reading** (a slider per value for how you lived it *then*, drawn as a radar against now), a **soundtrack**, **letters** to and from that self, an **artefacts shelf**, and **formative events** (Memory entries filed to the stage) each with *what this installed in me* and *who was there*.
- **A twist that matters.** The retrospective values readings are turned into *synthetic snapshots* dated mid-June of the midpoint year of the stage's years (so 2008–2012 reads as 2010), flagged retro. They draw on the Values trend, the lifetime line of every value, and the solar system's trend calculation — but **never** on "congruence now", which always uses your latest real snapshot.
- A memory's `occurredAt` — even a fuzzy one — places it in the right stage.

---

## 7. The Library

Media as a theory base for lived experience — not a rating site. Every work is asked what it *did to you*, not whether it was good. A work is an entry of kind *media*, so search, hashtags and every link all just work.

- **Kinds**: book, film, documentary, podcast, article, series, album, lecture, exhibition, game. **Status**: want, in progress, finished, abandoned, re-experiencing.
- **Resonance** (instead of stars): *Passed through me, Stayed with me, Changed me, Lives in me.* (Older 1–5 ratings were folded in as 1–2 → passed, 3 → stayed, 4 → changed, 5 → lives.)
- A work also carries a one-line capture ("force the distillation"), what it **installed in me**, **quotes & marginalia** (the line, where, and — required — what it caught in you), the conversation (prose), and *would I recommend it* (yes / conditionally / no — and to whom and when).
- **Addresses.** A work's links are kept at `extra.urls` (kinds *the work itself, where to get it, written about it, the maker, notes elsewhere*) and **not** in `links`, because `links` already means the stages, values and threads a work is tied to.
- **Life stage** is derived from when you consumed it (finished date, else occurred date) against stage years, unless you linked a stage yourself.
- **Quotes are two-way.** Each non-empty quote on a work writes (and keeps in step) a Quote journal entry carrying the work's title, the creator as author, the page and your *why*; clearing the quote's text removes that entry; deleting the work takes them with it. In the other direction a quote written in the Journals that names a work is attached into the work.
- **The influence map** reads your shelf back: which values your media touches (and the *media-starved* ones), which threads keep appearing, medium balance, resonance distribution — with a gentle line if more than 60 % of what you log only *passed through* you ("consuming faster than you absorb"), and **re-experience candidates**: works that *live in you* and have been untouched for more than a year.
- **Queue & lists**: the queue holds what to get to (title, medium, one line on why it is there, the link you found it by, optionally the value it serves); *starting* an item opens the *log a work* form prefilled as *in progress* with its address, and removes it from the queue. Your own curated lists (with five suggested prompts, e.g. *Books that built my self-image*, *Films for when the world is too loud*) are each exportable as a standalone web page, "made to be given away" — with each work's author, one-line capture and a link. **Received recommendations** keep who recommended what, and why.
- **Previews.** Paste a link (Spotify, Apple Music/Podcasts, YouTube, Vimeo, SoundCloud, Bandcamp, TIDAL, Deezer, Open Library, Goodreads, Wikipedia, IMDb, Letterboxd, Steam…) and it is recognised and shown as a card. What the address itself says (service, kind, often the title) is worked out locally; for the rest the page **asks that service once, at the moment you paste**, through its own public preview address (oEmbed, or Open Library/Wikipedia) — no third party in between, no account, nothing sent but the address — and keeps the cover as a small picture so it works offline. Nothing is asked again unless you press ↻. A player (▶) is only loaded when you press it. This is the one place in the library that touches the network; see part 15.
- **Finishing a work** asks what point you took from it and where it belongs in the Knowledge Tree; a work that *changed you* asks whether there is an essay in it (Content Studio).

---

## 8. Values

*The compass beneath the floorboards.* The Identity room has four tabs — People, Values, Skill Tree, Finance — each exactly the room it always was; the last tab you opened is remembered, and the old addresses (`#/people`, `#/values`, `#/skills`, `#/finance`) redirect into it without leaving Back stuck on a redirect.

### 8.1 What is stored

Up to **ten** values (the page says *the compass has N of 10 points*). Each has a name, a colour, a one-line tagline and **four questions**, each a list of dated versions: *How would I know if I embody this value?* (observable behaviour, not aspiration), *What takes me to 100 %?*, *How do I increase my positive motivation for it?*, *What counterfeits it?* ("the cheap imitation… this field prevents self-deception"). A new version never overwrites: *write a new version* appends; earlier versions fold under *N earlier versions* and can be deleted one by one. Each question has a **◆** that makes a Study Deck card (the question on the front, what you wrote on the back — "a definition you cannot produce from nothing is a definition you have read rather than one you hold"). **The order is the ranking**: you drag to re-rank, and every re-ranking is appended to a history (so are deletions), shown as *how the ranking has changed*.

### 8.2 The congruence snapshot — what the numbers are

*Take a snapshot*: each value 0–100 for this week — "not aspiration, where you actually are". **The sliders start where the last snapshot left them**, so you are adjusting rather than inventing ("a congruence score you invent from memory drifts"). When you move a slider away from where it began, a note box opens for *what's driving this score today?*; if you move it back, the note closes and the text is discarded. A snapshot can be edited later (including its date) and deleted (undoable). **The numbers on the page are:**

- **Congruence now** — the mean of the *latest real snapshot* over your ranked values (a value added after the last snapshot reads 0 until the next one).
- **Since last reading** — the mean of the latest minus the mean of the one before (more than +2 *rising*, less than −2 *sinking*; needs two readings).
- **Widest gap** — see below.
- **Last reading** — how old it is: older than 14 days says *going stale*.

**The gap** is *stated priority minus lived congruence*: priority is derived from rank (`100 − (position ÷ (n−1)) × 100`, so the first value is 100 and the last is 0), minus the value's latest rating. A positive gap means a value you rank high is lived less than it is ranked; a gap beyond **+12** is drawn *wide*, below **−12** *over* (you live it more than you rank it). The values are listed by gap, widest first. *(With exactly one value the rank formula divides by zero; the page is meant for several.)*

### 8.3 The solar system

You are the sun; each value is a planet. **The rule the whole thing is built on: if a property cannot be read back to something you actually did, it does not go in.**

| Property | Read from |
|---|---|
| orbit (inner → outer) | rank — the radii are spread evenly in rank order, not proportional to a number |
| **speed** | recency of evidence: each entry linked to the value adds `exp(−days ÷ 30)` (a 30-day decay, *not* a window — a value touched once yesterday and one touched two months ago are not the same); angular speed is `(6 + tended × 22) × 1 ÷ √(1 + rank × 0.55)` degrees a second, where *tended* runs 0–1 relative to your most-tended value — so the most-tended turns four to five times faster than the least, and outer orbits are slower still ("Kepler's rule"); the slowest inner planet takes about a minute for a circuit |
| **size** | how much evidence there is, of either kind: radius `12 + min(entries, 50) × 0.48` (capped so one value with two hundred entries does not fill the sky) |
| **saturation** | how much of that evidence is *embodied* rather than *betrayed*: `30 + embodied ÷ evidence × 70`; **no** evidence is a neutral 50 ("an untested value sits at neutral rather than grey") |
| **brightness / aura** | the latest congruence |
| **trail** | the direction congruence is moving: the latest reading against the mean of the readings in the preceding 30 days (or the one before it): more than +4 rising, less than −4 falling, else flat; needs two readings |
| **dashed orbit** | a **blind spot** — nothing you are building serves it: no vision links it and no entry links both it and a vision |
| **a moon** | six or more pieces of evidence |
| face, ring, storm, tilt | a hash of the value's id, so it keeps its face for as long as it exists ("you learn to find Craft by looking for the banded one, the way you find Jupiter") — decoration, not data |

The system is **always drawn on a night ground**, even in the light theme (light planets on a pale page are unreadable), under reduced motion it is still (the speeds are in the tooltip), and **hovering or dragging a planet stops it** and it resumes from where it stopped (so it does not snap forward).

> **Check.** "Dashed orbit = blind spot" depends on *visions*, which can no longer be created in the interface (part 3.3). In an install with no visions every value is a blind spot.

### 8.4 Evidence

A value's **evidence feed** lists every entry linked to it, marked *embodied* or *betrayed*. The two buttons (*+ embodied*, *− betrayed*) open a reflection with the link prefilled. Each link's polarity is set when you tag the entry (click once for +, again for −, a third time to unlink). Habits, people (*values embodied*) and skills (through the polarity-tagged progress entries) also point at values; people's *values embodied* feeds the Audit.

### 8.5 What reads values

The Review's long view (radar; "congruence over a lifetime"); the weekly review's snapshot step; the quarterly "re-rank what matters"; the annual compass; Maslow tiers (esteem's *authenticity*, beauty's *awe & creativity*, becoming's *congruence*, beyond's *beyond the self* — each reads the values whose **names contain** words such as *authentic, integrity, honest / awe, creativ, beauty / service, steward, contribut, generos, sacred, unity, compassion* — a name-based guess); the house's herbs and sky; the Search palette (a value shows its current %); Library influence map; Time view (value time is split evenly across the values a habit, skill, project or list serves, and says so); the weekly values-snapshot duty (Sundays, 18:00–23:00; done if a snapshot is within seven days).

---

## 9. The Skill Tree

*The architecture of becoming.*

### 9.1 The page

- **In focus now** — the two to five skills you are actually practising, each with its level dots, last-practised, the next milestone chip (*L3 in 41 d*, or *12 d over*), and **log practice**. The empty state says: *four or five is a working number, more than that is a wish list.*
- **Milestones ahead** — over 30, 60, 90, 180 or 365 days.
- **The tree** — see 9.3.
- **Inventory** — filterable by search (name, category, why, tags), horizon, category, level band (*not started, level 1–2, 3–4, 5 and up, has a milestone, atrophying*), priority and sort (horizon, priority, level, last practised, category, name); a horizon select on every row.

### 9.2 What a skill is

A name, a category (*Musical, Artistic, Income, Language, Intellectual, Social, Spirituality*, or your own — the old names *Languages, Creative, Technical, Craft* were mapped to the new ones; *Physical* was deliberately left alone rather than mis-filed), a **horizon**, a **priority** (P1–P4, default P3), **Why this one?** ("one line, for the day you have forgotten"), and an optional **start by** date for the two horizons that have not started.

**The five horizons**: ◉ **In focus** (the handful you practise now), ○ **Active** (kept warm, not the priority), ↗ **Up next** (starting within weeks or months), ◌ **Future** (written down so it stops taking up room in your head — and marked *planned*), ⏸ **Resting** (deliberately set down, not neglected). *In play* = In focus + Active. Moving a skill to any horizon other than *Future* clears *planned* and, if it was at level 0, sets level 1.

**Levels.** Your own ladder (labels default to Beginner, Novice, Competent, Proficient, Expert, Master): each has a name, a description of "what I can do at this level", **criteria** (observable behaviours with check-boxes, and when each was met), typed resources (book, video, course, article, tool), an estimated time and a target date. Rules to know:

- **Ticking criteria does not move the level.** The level moves when *you* press a numbered node on the path — it sets that level directly, and a rise bursts light on the tree. (On an *ability*, pressing the dot you are already on steps it back by one instead, so a level can be given up as easily as it was claimed.)
- A skill needs at least one level; levels can be re-ordered by drag (the current level follows its own object).
- A skill is **locked** if one of its prerequisites is below level 2 *and* it is itself at level 0 — it draws as a grey bud and the wood is dimmed.

**Abilities.** A skill is often several things that do not move together — reading and speaking; technique and repertoire. Break it into abilities, each with its own rubric (three levels by default). The skill's own reading becomes **the mean of the abilities' progress** (level ÷ count), and the **weakest is named**: *the furthest behind is X — which is where the next hour is worth most* (only with two or more named abilities). Pressing the dot you are already on steps that ability back one. Nothing is created until you name the first ability.

**Milestones.** A level and a date. The next milestone is the earliest-dated one whose level you have not reached; *reached* is shown once your level is at or beyond it. Within 30 days they appear on Today.

**The archetype line.** One honest sentence on the skill page: a planned skill is *A bud — nothing to judge yet*; untouched 90 days is **The Dabbler?** ("enthusiasm, then a plateau, then silence — or perhaps a deliberate surrender"); a best streak of 14 or more with none now is **The Obsessive?** ("watch for burnout; oscillation is the rhythm"); level 3 or more, no target level and below the top is **The Hacker?** ("good enough, and stopped — is this the level you chose, or the one you settled for?"); otherwise *On the path. Loving the plateau.*

### 9.3 The tree

A cherry tree that is **grown, not drawn**. Each skill is a point of light (an *attractor*); the tree's wood is found by a space-colonisation growth that bends toward the lights. It is seeded from the sorted list of your skills' ids, so **the same skills always grow the same tree** and a new skill adds a branch toward it rather than redealing the whole hand. The trunk is short and the crown starts low ("a tall bare pole with a wreath on top is the other way a drawn tree gives itself away"); thickness follows what a limb carries.

What hangs on a skill's twig is what the skill is doing:

- **Leaves** — alive at all; they do not carry level ("leaves are the fact that the thing exists, so they do not carry the score").
- **Blossom** — how far it has come: the flower's openness is `ceil(progress × 5)` (a closed bud, splitting, three petals parting, five open, a double bloom) and the *number* of flowers is `round(1 + progress × 3.2)`, 1–5; none for planned or locked skills or level 0.
- **Cherries** — mastery: all levels reached (or full progress with abilities): three pairs.
- **A halo and a travelling spark of sap** — the skill is *warm*: not locked, not planned, and practised in the last seven days.
- **Wither** — if the last practice was more than 90 days ago, the wood thins and petals fall, in proportion `(days − 90) ÷ 180` up to 0.8 ("bronze for a skill going cold"). A skill never practised is not withered ("it has nothing to lose yet").
- A blossom marked **soon** if its next milestone is due within 45 days; **a red dot** at the tip if one is overdue.

### 9.4 What "practised" means — read this

> **Check — two ledgers.** The skill page and the tree measure practice from **progress entries** in the journal linked to the skill: *last practised* is the latest created date of such an entry, *streak* is consecutive days with one, *total hours* is the sum of their durations, and *atrophy* and the tree's warmth read the same. Meanwhile **time on the clock** linked to a skill adds to a separate field (`hours`, `lastPracticed`) — the Japanese Studio's sessions do too — and that field is read only by the prompt queue (*an in-focus skill with no hours in seven days*) and the Time view. So a sitting you tracked against a skill **does not warm the tree, extend the streak or add to "total hours" on the skill page** unless you also log a *progress* entry. Hours on the Compass's skill card come from the same entries. This is a mismatch with the Guide's statement that skill hours "arrive from the one clock".

### 9.5 Other connections

A skill's *serves values* section counts the values tagged on its progress entries. Skills appear in the Maslow *craft* input (the share of non-Future skills practised in the last 30 days, by entries), in the quarterly review's *what is going quiet* (untouched more than 90 days), on Today as milestones within 30 days, in habits (a linked skill), in the Time view lens, and in the house's piano stand (by name).

---

## 10. People

*A relationship garden, not a CRM.* The point is not to manage anyone, but to remember what people told you, notice when you have drifted, and be deliberate about the handful of people a life is made of.

### 10.1 A person

Name, nickname, photo, **relationship** (partner, family, close friend, friend, colleague, mentor, mentee, acquaintance, other — and anything you add with *＋ name another…*, kept lower-cased), **circle**, **status**, tags, birthday, contact details, a desired **contact cadence**, and the deeper fields (each *versioned*; writing a new version leaves the old underneath): **What this person installed in me**, **The gift**, **The wound**, **What I become around this person**. Plus the stages they were present in, the threads they activate, **values they embody**, a standing **energy reading**, *Remember* (interests, life updates, important dates, notes), gift ideas and a gifts log, every entry that mentions them, their interactions, and the history of any ring moves.

**Circles** (innermost first, each with its natural size): ◉ **Core** (about 5, "the people most central to your life right now"), ○ **Close** (15, "you see or talk to regularly — they know the real you"), ◐ **Warm** (30, "friendships with long gaps that pick up instantly"), · **Orbit** (80, "present, not intimate"), ◌ **Aspirational** ("not yet met — mentors, partners, the people your visions require"). **Status**: active, dormant, lost, estranged, deceased, not yet met.

### 10.2 Logging in five seconds

*Log* (the button, or `I`): who, what kind (*met, called, wrote, emailed, saw (video), thought of*), how it left you (*energised / neutral / drained*) and one optional line. *Thinking of somebody is a way of keeping them, and the record should be able to say so.* The full form (with quality tags *deep conversation, fun/play, support given, support received, conflict, routine, milestone, repair*) is on the person's page. Rituals at the top: **reach out** (logs a text), **gratitude for someone** (files a Gratitude entry titled *Grateful for NAME*, tagged to them), **ring review** ("Has anyone moved? Should anyone move? Who are you neglecting? Drag a face to answer.").

### 10.3 How contact is counted — the quiet part

The People room **re-normalises itself every time it is drawn**, and this has consequences:

- **Entries create people.** If an entry's *People* list carries a name that matches nobody (case-insensitively), **a new person is created** with that name. A typo in a tag makes a stranger.
- **Entries create interactions.** Each entry ↔ person link adds one light interaction (kind *other*, dated by the entry's `occurredAt`, else its creation date; described by the entry's title or first 120 characters) — once per entry per person. So writing a memory tagged to someone, even one dated decades ago, adds a past interaction; and **last contact** is simply the latest interaction of any kind.
- **Time on the clock "with" someone** creates a *met in person* interaction with the duration (a setting turns this off) and updates their last contact.
- Therefore a friend you only *write about* counts as "in touch".

**Overdue** means: the person has a desired cadence (weekly 7 days, fortnightly 14, monthly 30, quarterly 91, yearly 365) and more days have passed since their last contact than that — *never* is infinitely overdue. Overdue people appear in *Needs attention* on the People page, in the Review's *People, within cadence* ring and as a duty.

### 10.4 The constellation

You are at the centre; everyone is a node on a thread, with a small physics (a spring holding each node at its ring's distance, mutual repulsion, a slow drift so it breathes, damping so it settles). Nothing is random from render to render — **each person starts at the angle their id hashes to**, so the sky you learn is the sky you come back to. Every visual property is read off what you did:

| Property | Meaning |
|---|---|
| distance | the ring you put them in (as a fraction of the outermost: .22, .43, .63, .82, 1.0) |
| size | `8 + (interactions + 2 × entries about them) × 0.55`, capped at 26 |
| brightness | recency: under 3 days brightest; under 7, 14, 30 and 60 days progressively dimmer; older, or never, barely there |
| warmth (hue) | the *energy balance* over the last 180 days — the mean of energised +1 / neutral 0 / drained −1: above +0.34 warm gold, between −0.34 and +0.34 a neutral warm, below that cool blue, and a muted red-grey below −0.7; no energy readings at all is a neutral tone |
| thread | the same recency; it frays as it goes cold |
| dashed outline, no thread | someone you have not met (aspirational, or status *not yet met*) |
| faded | lost, estranged or deceased |

The ring chips under the sky say *Core · 4 of about 5 · 3 in touch* — where *in touch* means contact within the cadence the ring implies (core 7 days, close 14, warm 30, orbit 90).

### 10.5 The other views

*List* (everyone, sortable, filterable by ring), *Log* (every interaction over time), *Life stages* (who was present in which chapter), and the **Audit**, "a mirror, not transactional": people placed by how often you logged them in the last 90 days (across) against whether time with them tends to energise or drain (up) — quadrants *protect these, taken for granted?, where resentment builds, let drift*; **your five closest** (the most logged in 90 days — "are they the people you want to be becoming like?", after Jim Rohn); **values modelled by someone** (which Core or Close person embodies each value); and **relational blind spots** (a value no one in your Core ring models; a thread with no one tagged).

Birthdays and important dates within 30 days appear on the People page and in the Review. Follow-ups you wrote on an interaction stay open until you tick them.

---

## 11. The Knowledge Tree and the Learning Studio

### 11.1 The Knowledge Tree

A personal wiki for a lifelong inquiry — what you think about the questions that matter, and **how sure you are**.

**Shape.** Every page has one home: a **root** (one of the great questions), a **branch** under a root, a **point** under a branch. A point cannot be saved without a parent. Library, Journal and Writing entries stay in their own rooms: the Tree keeps *references* ("leaves") to them and nothing else.

**Links are for getting about; grafts are what reasoning rests on.** `[[Title]]` makes a link (blue if the page exists, red if not — a red link makes a stub); `[[Title|shown as]]`; `[[library:Title]]`, `[[journal:2025-03-01]]`, `[[writing:Title]]`. Typing `[[` offers titles and aliases. **Renaming keeps the old title as an alias.** Slugs and aliases are kept unique in code (the fallback database cannot hold a unique index, so the maps are checked before every save). A **graft** joins two pages with a kind — *supports* (gives reason to believe), *contradicts* (pulls against), *extends* (carries further), *echoes* (rhymes with, from elsewhere), *raises* (opens the question of) — and **the reason is required** ("without one it is only a link").

**Positions are add-only, and that is enforced, not hoped for.** A page holds a **position** — a statement, a confidence (0–100) and the *question that would change your mind*. *Revise position* adds a new one; the old stays and is drawn as a **step line** (a position is held flat until the next replaces it). The rows are frozen in memory, there is no function that edits or deletes one, and the persistence layer runs a guard before every write that **puts back** any record that has changed or vanished, with a toast saying so. (Only a worked example from the tutorial may be removed.) **Sealed predictions** are add-only too, except that their *resolution* may be filled in, once.

**Gaps** (what the tree is missing) are counted live, not stored: *red links* (named, never written), *citation needed* (points with no leaf from the Library, Journal or Writing), *branches with no position*, *positions with no open question* ("held, with nothing named that would change them") and *one-sided branches* (anywhere in the branch, including its descendants, a graft **supports** and none **contradicts**). **Tensions** are every *contradicts* graft still open, with a way to say how it was resolved — "not failures; the places where the thinking is still alive".

**Getting things in.** *Quick capture* (`Alt+K`) from anywhere drops a thought into the **inbox** (on a Learning Studio board it goes to that board's tray instead). Saving a Journal entry looks for Tree page titles in what you wrote and **offers**; finishing a Library work asks what point you took; Score Study sends insights here. Nothing is attached without your say.

**Tending — one card a day** (it also sits on Today as a compact line). The card is chosen in this order: **(1)** a page *due to resurface* ("do you still hold this?"), **(2)** the oldest capture in the inbox (*make it a page / add it to a page / let it go*), **(3)** the root or branch left untended longest (never-tended first). **The resurfacing ladder** is 3 days, 14 days, 61 days, 183 days, a year: *still hold* moves the page one rung out; *doubt* brings it back to the first rung; *revise* opens a new position and keeps its place. Doing the thing marks the page tended.

**A year ago.** On a page with two or more positions, if you held something different (in statement or confidence) a year or more ago — specifically, 330 days or more — it can show *a year ago you believed…* with the change in confidence. To avoid nagging it appears on **about one day in four** per page (a stable hash of the day and the page), unless you turn on *always*.

**Proof.** *Experiments* record trials, hits and the chance rate, and give your hit rate and the **exact one-sided binomial p-value** — "if only chance were at work, k or more hits in n would happen with probability p". *Sealed predictions* are fingerprinted with **SHA-256** when saved (so you can later verify the text was not altered) and resolved true or false once; **calibration** shows your **Brier score** (0 is perfect; always saying 50 % scores 0.25) and how often you were right at each level of confidence.

**The week**, computed when the Tree home is opened and kept (up to 104 weeks; only the current week is drawn): new pages, red links that turned blue, positions revised, pages pruned, open tensions.

The Tree can be exported and imported on its own from its home page; an import only adds what is missing.

### 11.2 The Learning Studio

A spatial canvas for turning one Knowledge Tree branch into long-term memory, along the iCanStudy pipeline **Harvest → Sort → Ask → Shoot → Chunk → Relate → Recall → Check**. The governing rule: **remove mechanical friction; preserve cognitive effort** — the canvas does the clerical work, you do the thinking. Boards are infinite (pan by dragging empty space, zoom with Ctrl-scroll or pinch); chips are made by double-click; modes are keys `1`–`8`.

What it does that you would not guess:

- **Snapshots are add-only.** A *snapshot* freezes the layout so Recall can compare against it; snapshots and **recall attempts are frozen records** the same way positions are, and a guard restores any that change.
- **Recall is fuzzy by design.** In *Fog* you type what you remember; each reference chip is matched to your closest typed answer by **normalised edit distance** (default tolerance 0.35 — a typo or a small difference counts, a different word does not), each typed answer used at most once; what is left over is shown as *extra*. *Ghost* gives positions as empty boxes (optionally group frames or first letters); *Shuffle* scatters the chips for you to regroup; *Teach* steps through every chip in full screen for you to narrate.
- **Scaffolding is signals, never moves.** At the *Assist* level the board says: a **group with more than four members** ("working memory holds about four items well"), **more than 25 chips in no group**, a **chip of more than 12 words**, a **group named but with no reason**. *Lean* shows the prompts without highlighting; *Bare* says nothing. Each has a ? that states its rule, and each can be dismissed for the day. **Nothing is ever moved or merged for you.**
- **Chunk** lets chips sharing a *reason* glow together ("shared reasons reveal hidden connections").
- **Relate** needs a reason for every arrow; when both chips have been **promoted** to Tree pages, the arrow *is* a Tree graft (otherwise it lives on the board until promotion).
- **Check** sends the chips you missed to the Study Deck (with a *Studio* link back to the board), can create a review task on Today, and asks for a **Kolb reflection** (*what did you learn? how will you use it?*), saved as a journal entry linked to the board.
- **Today** shows *Recall due* when a board has a snapshot and no recall in the last three days, and the count of chips waiting in the tray. A session starts the clock if auto-start is on.

---

## 12. Reflection: the reviews, the Review page, and the lenses

### 12.1 Reviews that come to you

A review is most useful the night a cycle ends, while the period is still in the room. So there is no hub of rituals to remember to visit: **on the last day of each cycle the review surfaces** as a chip beside the evening review (and, for the Time reviews, in the Time view), carrying the period's own numbers.

| Review | Closes on | Length |
|---|---|---|
| Daily | every day (it *is* the evening review) | 5 min |
| Weekly | Sunday | 15 min |
| Monthly | the last day of the month | 15 min |
| Quarterly | the last day of Mar / Jun / Sep / Dec | 30 min |
| Half-year | Jun 30 and Dec 31 | 45 min |
| Annual rite | Dec 31 | 1–2 hours |

**What is listed and what is not.** For each kind the program looks back along the calendar for up to a few of its period ends (two for daily, weekly and monthly; one for the others) and lists those that are not answered and not dismissed — **oldest first**, "because the older one is the one at risk of never happening at all". A *past* period is listed only if it **had substance** (any entry, habit kept, check-in or dated task in it): a quarter that closed while the house was empty is not a review you are behind on, and listing it "only buries the reviews that do have something in them". Tonight's own boundary is always listed. **Which period a review answered is recorded explicitly** when you press *Begin*, so a review of last week done late cannot be mistaken for one of this week done on time. *Not tonight* is remembered **for that period only** and is not carried into the next.

**The card carries numbers**: habits kept ÷ due (%), tasks done ÷ planned, entries by kind, the mean set-point of the days that had one, and a small graph (entries per day as bars, habit rate as a line).

**"Ask Claude about this day / week / …"** is **optional and does nothing without an Anthropic API key** you paste into Settings (part 15). With one, only that period's entries (each trimmed to 700 characters), the numbers and what you had planned are sent, under a strict instruction: only this period, never generalise to your whole life or character, do not invent, plain and warm, in four short parts — *what this period was actually about; what repeated; what is missing that you would expect; one question worth sitting with.* You may keep the answer as a Reflection. Without a key it shows real counts only (entries, silent days, the fullest day, habit %, tasks) and says plainly that these are counts, not a reading.

### 12.2 The guided flows — step by step

Each step is prefilled with what the house already knows, "so the work is noticing rather than remembering". Closing a review on purpose means it is not waiting to resume; stepping out of a step to write an entry remembers where to come back to.

- **Morning practice** (30 min): your self-image script read back → the winning feeling → read the aim aloud → *where are you on the scale?* (writes today's set-point) → *today's one intention* → *mark the practice* (adds today to the tracker) → open questions, each with an *any new light?* box.
- **Evening review** (5 min): the habit rings, "before the day closes" → the day's energy on a 1–5 scale of faces (*drained, low, level, good, full*) → what actually got done against the list → **planned vs actual** (when you laid out blocks: the blocks in outline, what was tracked filled in, with the difference; within 15 minutes counts as close) → *anything else from today?* (the capture step) → open questions. Finishing sets *day closed at HH:MM*. *(Check: the energy step's title says "set-point" but writes the day's 1–5 energy, not the 1–22 set-point.)* Removed by request: the one-line summary, "tonight in four dimensions" and "plan tomorrow".
- **Weekly** (15 min): the week's shape (with day-by-day drill-down — a week, a day, a month, a year — *inside* the review) → habits held (%) and their oscillation → **a congruence snapshot** (sliders prefilled; "move only what actually moved") → the week against the lists you made → open questions (only when some are open) → *then only the steps that have something to say*: the bench (Study Deck), the week in Japanese, the week at the score, **where the hours went** (the Time view for the week and its sentence) → **small gains** (what got a little better as far as the numbers can see; *nothing here is a target*) → *anything else from this week?* → *next week's one intention*. ("A step that always reads *nothing happened* is a step people learn to press past, and then press past on the week it does say something.")
- **Monthly** (15 min): the month at once → the milestones you named (*an unticked milestone is information, not a failure*) → habits across the whole month → what the month was made of (which rooms of the house got used and which stayed shut) → energy and mood over thirty days (mean set-point, mean evening energy, the moods) → *what carries into next month*.
- **Quarterly** (30 min): the ninety days at once → **re-rank what matters** (the previous ranking is kept) → **re-read one past stage, chosen at random** — does it still feel true? → the flagged synchronicities → *what is going quiet* (skills untouched over 90 days; habits below half over four weeks) → the five closest → the money, honestly.
- **Half-year** (45 min): six months side by side → what actually moved (projects finished, skills carrying a level, entries) → the compass → who moved (interactions; core and close people with nothing logged) → skills and work → the money → *what the next six months are for*.
- **Annual rite** (1–2 h): the year at once → write the year's narrative (a Reflection) → mint a sub-stage in the Timeline → **re-read what you wrote a year ago** (entries within two weeks of the same date last year) → the compass January–December → the year's set-point trend → *who did you become this year?* (your self-image script read back; rewrite it if it is out of date) → the constellation a year on → the year in money → three things the coming year is for → **a sealed letter to next year's self**.

Other optional steps added later: the **system review** every two to three weeks (a prompt-queue item), a risk worksheet on a decision, and the performance-goal reading (12.6).

### 12.3 Written reviews — a photograph, not a live query

*Review* (under Today → Review) is the other way to review any stretch — a day, week, fortnight, month, quarter, half, year or **any stretch you like**. It gathers what the house knows (sleep; energy and mood; habits; work and attention; skills; values; people; what you wrote; what you read; practice; money), shows it **section by section with a box under each** ("you read your own data first, and then you write — that order is the whole design"), and *snapshots what it gathered into the review at that moment*, so the record does not change when you later edit a habit or delete an entry. **A section with nothing in it is not drawn** ("an empty card is worse than no card: it reads as a reproach for a week you were not measuring anything"), and if *nothing at all* happened in the period there is no digest. Each reflection can be sent to the Lived Record as a reflection, gratitude, question, synchronicity or manifestation entry; **it then has two homes and one text** — editing either updates both, and deleting the journal entry leaves the writing where it was written.

### 12.4 The Review page

Under Today → Review: the date and moon; **the week's shape** (when the day opened, when it closed, the hours between split into claimed and wasted — "a day on its own says nothing; seven side by side is where a rhythm becomes visible"); **Where am I right now?** (12.5); **the long view** (nine cards: the ten values as a radar, congruence over a lifetime, energy and set-point over thirty days, habits over twelve weeks, skills' hours, hours tracked, the record, people within cadence, money against target); then the planner's statistics, the reviews, and **the days** (5.10). The **Life Tape** — "your calendar holds what you meant to do; this holds what happened" — assembles every dated entry, nod, interaction, habit and leaf onto its date without anyone logging anything twice, at six zooms (day, week, month, quarter, half, year); the review flows embed it.

### 12.5 "Where am I right now?" — the Maslow lens

**Eight tiers**, scored *from data the house already holds*, so the pyramid fills itself instead of asking you to rate yourself: **Physiological (BODY)**, **Safety & Security**, **Love & Belonging**, **Esteem**, **Cognitive (MIND)**, **Aesthetic (BEAUTY)**, **Self-actualization (BECOMING)**, **Self-transcendence (BEYOND)**. *(The code's own comment says seven; there are eight.)* A tier is **the mean of whichever of its readings have data — a reading with no data is dropped, never counted as zero** ("an empty Finance section must not read as *unsafe*"). The readings:

| Tier | Readings it averages |
|---|---|
| Body | sleep (waking minutes → a night of 7 h or more = 100); *body energy* (the old check-in energy); *movement* (habits tagged to the old *physical* dimension) |
| Safety | runway (sustainable = 100; over 12 months ≈ 90; 6–12 months 50→80; 3–6 months 25→50; under 3 months 0→25); *the gap* (monthly burn); *day claimed* (the rhythm ratio) |
| Belonging | inner circle's recency (Core + Close, 30 days: contact in the last 7 days = 100, falling to 0 by day 37; never = 0); wider circle (Warm + Orbit, 60 days); the rate of habits flagged *relational* |
| Esteem | craft (the share of your non-Future skills practised in the last 30 days — by progress entries); projects (nods per project ÷ 8); writing (days written in the last 7); *authenticity* (the congruence of values whose names contain authentic / integrity / honest) |
| Mind | learning (media in the last 30 days: min(n ÷ 4, 1) × 50 + the mean resonance depth ÷ 2); reflection (reflection, question and synchronicity entries per day × 150 %, capped at 100); *mind energy*; *learning habits* |
| Beauty | creating (nods on projects with no income); beauty taken in (films, albums, exhibitions, documentaries); *awe & creativity* (values named awe / creativ / beauty) |
| Becoming | congruence (the mean over all values); morning practice (days practised ÷ days elapsed in the 21-day cycle); set-point (the mean over 7 days of (rung − 1) ÷ 21) |
| Beyond | gratitude & awe (gratitude and synchronicity entries); *beyond the self* (values named service / steward / contribut / generos / sacred / unity / compassion); given attention (Warm + Orbit within 45 days) |

*The italic readings depend on the energy dimensions and habit dimensions that were taken out by request; for new data they are empty and so drop out of the average.*

**You can disagree with the numbers.** Tap a tier to see what fed its score, and a slider — *how it actually feels* (0–100) — with a note (*why does this feel different from what the numbers say?*) records your own reading; **the gap between what the data says and what you feel is itself worth recording**. The tier then shows your reading; *use the data's number* removes it. **Log a check-in** snapshots every tier (auto, override, effective, note and the readings behind it) into a history (sparklines of the last twelve check-ins per tier). When a tier sits under 40 the retired gentle-prompt logic would say it with a Fritz line: *structural tension needs an accurate picture of current reality*.

> **Check — the Spiral lens.** The code also computes an eight-stage *Spiral* reading (Beige, Purple, Red, Blue, Orange, Green, Yellow, Turquoise), each stage scored from your behaviour (Maslow scores, how recently the people in your rings were seen, how often words such as *family/tradition* or *discipline/duty* or *system/pattern/paradox* appear in your entries of the last 30 days, link density…), with honest handling of ties and thin data. **Nothing in the current interface draws it**; it is listed in the Guide but dormant.

### 12.6 Wins, intentions, goals

*Wins* are written once and never rewritten: a milestone marked *prepared* (with a celebration and an optional win note) and the *process wins* of the Time view (*started when the block said, estimates held, restful breaks up three weeks running, the most time in focus*). *Time intentions* (at most four), *performance goals* (one for the year, three for thirty days, three for fourteen — written the SMARTER way, read through process signals, **never hours**, with a persona line **offered** to the Morning Theatre and an optional sealed commitment letter for a thirty-day goal) are found in **Today → Time tracking → Intentions & goals**. They are described in `docs/GUIDE.md` (the Time tracking chapter).

---


---

## 13. When the house speaks: duties and prompts

Everything inward that is *meant to recur* is watched by one small system, so that the house can say "this is due" without you having to keep a list. It is worth understanding because it is the reason Today sometimes asks you something and sometimes does not.

### 13.1 Duties — a registry of recurring things

`src/16-duties.js` holds a registry of about twenty-four **duties**. A duty has a label, a **window** (when in the day it is meant to be done), a **recurrence** (daily, weekly on a day, month-end, quarterly, half-yearly, annual, or event-driven), a **completion rule**, and a default of on or off. **A duty is never ticked by you.** Its completion is *read from the record it is about*: if the thing exists, the duty is done. That is the key mechanism — there is no second checklist that could disagree with what you actually did.

| Duty | Counts as done when… |
|---|---|
| Log when you woke | today's check-in has a wake time |
| Dream log | the night's dream state is anything but *unasked* (so *None* counts as an answer) |
| Morning card | the morning card was opened today, or the card is switched off |
| Morning practice | the last morning practice is today or later |
| 21-day Theatre | today's theatre session was done (a skipped session does not count) |
| Habit rings | every habit due today is kept |
| Stillness practice | any stillness minutes were logged today |
| Study Deck | no cards are due (the duty exists only on days when some are) |
| Knowledge Tree: tend | nothing is waiting to be tended — and the duty only exists on days when something is |
| Learning Studio recall | a recall attempt in the last three days; it is shown only when there is none |
| Clock sitting | a sitting is running, or the last one ended less than the tracking-nudge interval (45 minutes) ago |
| Values snapshot | a congruence snapshot within the last seven days; the window is Sunday 18:00–23:00 |
| People attention | no one in your rings is overdue — and it only appears on days when someone is |
| Weekly / monthly / seasonal / half-year / annual review | the review for that period exists (seasonal within 92 days; half within 182; annual within 365) |
| Plan the week · Plan tomorrow | the week has goals / tomorrow has at least one intention |
| Evening review | the evening flow ran today (`eveningFlowAt` or `lastEvening`) |
| Finance log | a money entry exists for the period — a month-end duty, shown in the last four days, **off by default** |
| Sealed letters | no letter is opening now |
| Decisions due | no decision is waiting to be graded |

**Windows follow your body, not a fixed clock.** An *after-wake* duty is offset from the **median wake time of the last fourteen days**; a *before-sleep* duty from the **median bedtime** (a bedtime after midnight but before 03:00 counts as late, not early). With too little history they fall back to the wake and sleep times in Settings. *Anytime* duties run from waking to 22:30. The prompt says so in words — *"usually wake around 07:10"* — so you can see why a duty appeared when it did.

**Each duty has three ways out** (13.2) and a per-duty override in Settings (on/off, its window, whether it notifies).

**The log.** Every duty outcome is appended to an add-only `dutyLog` (duty, date, outcome, when done, whether on time). It is not shown as a score; it exists so that the week's *shape* can be read back (*did I do the things I meant to, and when?*).

### 13.2 The prompt queue — one list, with a reason on every item

Three things used to ask for attention in three different ways: duties, nudges (one banner at a time) and reminders. They are now **one ranked queue** (`16-promptqueue.js`) on Today, showing **at most five** items; the rest are a count. The ranking, most urgent first:

1. a **block** of the day's plan that is running long, about to start, or has ended unanswered (*did this happen?*);
2. a **reminder** you set that is now or late;
3. an **overdue duty**, then a **due duty**;
4. a **nudge**;
5. a **flag**;
6. a **review** that is due (later reviews rank behind earlier ones; a review whose period ends today is not nagged for the daily one);
7. a **milestone** warning.

**Every item states the rule that raised it** — *"its window 07:30–09:00 closed 40m ago"*, *"it is past 18:00 and nothing is written for tomorrow"*, *"the run is at 19 of 21 days"* — and every item has the same **three exits**:

- **Later** — thirty minutes;
- **Not today** — for the period the item belongs to (the day, or the week for weekly things; *a flag you waved away on Monday is back on Tuesday if it is still true*);
- **Off** — permanently, reversible in Settings.

The queue **reads; it does not decide.** It never changes your data.

### 13.3 The items that are not duties

Besides the registry, the queue raises a few conditions of its own (`pqMissing`, and the nudge set in `16-nudges.js`):

- **A habit two days or fewer from a milestone** (*"2 days to Reading's 21-day mark"*).
- **Tomorrow is not planned** — after 18:00, if tomorrow has no plan and no intention.
- **A milestone is overdue, or slipping** (its date has passed and it is not *on track* or *prepared*; or its remaining estimates do not fit the time left).
- **A person's name in a time entry** — if a tracked sitting from the last 36 hours contains a first name matching someone in People and no interaction with them is logged since, it asks *"Log an interaction with …?"*. *(It matches on the first word of the name, so two people sharing a first name are not told apart.)*
- **An in-focus skill with no hours for seven days** (this reads the *hours* field — see the **Check** in part 9).
- **Nudges**: *close the day* (after the sleep-prompt hour, one card listing what is still open), *clock idle* (waking hours, nothing running, the last sitting ended over the tracking interval ago), *wake unlogged* (an hour past the usual wake with no wake time).
- **Habit reminders** with a time: sent once per habit per day, as a browser notification **if you have granted permission**, and otherwise only in the queue.
- **Task reminders** (`17-planning-remind.js`): also a browser notification when permitted.

### 13.4 Small facts

- The **Jazz daily plan** and **Finance log** duties are *off* by default (a studio you do not use should not nag); every other duty is on until you switch it off. The **Study Deck** duty is on but only exists when cards are due.
- Pressing a duty's arrow takes you to the room it is about, or — for the ones that live on Today — scrolls to the place on Today, opens the folded section around it and flashes it.
- **Check.** Three duties point at addresses that are not rooms any more: *Stillness practice* → `#/stillness`, *Study Deck* → `#/studydeck`, *Learning Studio recall* → `#/learningStudio`. The router sends an unknown address to Today, so their arrows land on Today rather than in the room (the rooms are `#/house`, `#/study` and `#/studio`). See 16.4.
- Dismissals are kept in `promptState` (and, for items that came from the older systems, also written to `nudgeDismiss` and `dutyDismiss` so nothing that still reads them is left behind).

---

## 14. How it all connects: what an action does elsewhere

The inward half is not a set of separate rooms; it is one set of records seen from different doors. The links that matter:

| You do this… | …and this happens elsewhere |
|---|---|
| Write any entry and tick a **value** (with a polarity: *lived* / *tested* / *broken*), a **skill**, a **person**, a **project**, a **stage/thread** | The entry shows in that value's evidence feed, that skill's page, that person's page and the stage's page; the value's congruence moves; each person link also makes one light *interaction* (so their *last seen* moves); the Days archive and *On this day* find it |
| Tag a **person** in an entry, or log an **interaction** | The person's glow in the constellation, their "last seen", ring cadence and the *people attention* duty. Time tracked *with* a person also makes an interaction (a meeting, with its duration) unless automatic interactions are off |
| Write a **progress / nod** entry linked to a skill | The skill's hours, streak, last-practised, level, atrophy and the tree's warmth; the evening/weekly review's "what I practised" |
| Keep a **tarot / I Ching / charms** reading | A divination entry in the Lived Record (searchable, pin-able); it also appears in the weekly and period digests; *take it elsewhere* turns it into a task, a question or an intention |
| Keep a **Theatre** session's outputs | Real entries: gratitude (anticipatory), scene/script, structural-tension, focus wheel, quote, reflection — and the day is added to the **21-day** tracker and, in guided mode, the **rotation score** of whichever vision/practice was used |
| **Pin** an entry | It is shown on the Theatre's opening screen each morning, and in the *Pinned* section of Today |
| Mark a **milestone prepared** | A celebration; a **win** is written once (never rewritten); the Review page's wins; an optional win note |
| Finish an **evening review** | The day is *closed* (`closed at HH:MM`); the "week's shape" shows when it opened and closed; the *evening review* duty is done; tomorrow's plan can be set |
| Take a **Values snapshot** | A new point on the congruence-over-a-lifetime chart and the radar, and the *values snapshot* duty is done |
| Tend a **Knowledge Tree** page | The next resurfacing is scheduled up the 3/14/61/183/365-day ladder; an *echoed* link shown on resurfacing; the tending duty clears |
| Send **missed Studio chips** to the Study Deck | Cards appear in the Study Deck inbox, with a *Studio* link back to the board |
| Start a **Studio session** | The clock starts on *Study*; the session's outcomes are summarised into a Kolb reflection entry linked to the branch |
| Run a **stillness session** | Minutes logged for the *stillness* duty; the house's candles/lamps; a depth reading in the stillness record; an insight can be sent to the **intuition log** |
| Resolve an **intuition log** item | The hit-rate on the intuition shelf (outcome is yours to enter) |
| Log a **sleep / wake time** | The Time view's rhythm, the Review page's *week's shape*, the Maslow *Body* tier (sleep), and the median that shifts the duty windows |
| Add a **Library** work (media entry) | Appears in the Library; its *resonance depth* feeds the Maslow *Mind* tier and learning counts; an optional cover is fetched and kept locally |
| Seal a **letter** | It stays unreadable (the text is held) until its date; on that date it appears in the queue as *ready to open* |
| Record a **decision** | It becomes due on the date you set; the *decisions due* duty asks you to grade it; the grade feeds the decisions page's hit-rate |
| Edit a **stage's story** | The earlier wording is auto-versioned if the edit retains under 85 % of the words or changes the length by more than 20 % |

**Three structural consequences worth knowing:**

1. **Deleting an entry removes it from every view at once**, because every view is a query over `S.entries`. Records that were *photographed* (written reviews, congruence snapshots, retro snapshots, wins) are not affected — they hold their own copy.
2. **Renaming** a value, skill or person is safe: links are by id, not by name. The exceptions are the **name guesses** (part 16): rules that look for a word *in* a name.
3. **Tags (`#hashtag`) are free-form and global**: any entry anywhere can carry them, and they appear in search and the Review digests. They are not the same thing as a *thread* (a named strand of life) or a *stage* (a chapter).

---

## 15. What is local, what is optional, what is never sent

**Everything is stored in this browser**, in IndexedDB (database version 23), in separate stores so that a small edit rewrites only the store it touches. There is no account and no server of ours. A backup (Settings → Backup) is a JSON file you download; an import reads one. Nothing in your journals, values, skills, people or readings leaves the device on its own.

**What touches the network — the complete list:**

| What | When | What is sent |
|---|---|---|
| **The page itself** | Loading/updating the app | The service worker fetches the app shell *network-first with a short timeout*, and falls back to the cached copy (so it works offline). Nothing of yours. |
| **Typefaces** | Page load, online | Requests to Google Fonts for the families used by the themes. Offline, the browser substitutes its own. (This is a request *for fonts*; it carries no data of yours, though the font host sees that a request was made.) |
| **Link previews in the Library** | When you add a link for Spotify, YouTube, Vimeo or SoundCloud | An *oEmbed* request to that service for the link you pasted (no cookies, no referrer), to read a title and cover; the cover is then **kept locally** as a small JPEG so the card is whole offline. Other websites are not contacted. |
| **Claude (Anthropic API)** | **Only if you paste a key into Settings, and only when you press a button** | The text you asked it to work on (below). The key is kept in this browser's `localStorage`, **never written into a backup**. |
| **Dictation** | When you press the microphone | The browser's own speech recogniser. Depending on the browser, audio may be processed by the browser vendor's servers — that is the browser's behaviour, not the app's. |
| **Notifications** | Only if you granted permission | Local browser notifications; nothing is sent anywhere. |

**What the optional Claude key is used for — all of it, because there are only four places:**

1. **Journal period readings** (a review cycle, 12.2): *only that period's entries* (the digest the screen shows), with a system prompt that forbids generalising beyond the period, inventing events or giving unrequested advice.
2. **Patterns** (Review → Patterns): the statistics are computed in your browser first; your entries are sent *only when you press "Ask Claude to read it"*.
3. **Tidy a dictation**: the text of the field you pressed *tidy* on, with rules to preserve meaning, add no idea, and keep your voice. Without a key a local tidier does the same job crudely (removes fillers, adds punctuation, capitalises).
4. **Bulk import routing**: when you import a file of entries, Claude decides which kind each belongs to. Without a key, a local pattern-matcher routes them and *nothing is rewritten*.

Every one of these has a **local fallback** and says which one ran. Nothing runs in the background; nothing is sent on a schedule. The model used is a single constant in `src/06-ai.js`.

**Nothing inward uses Claude without being asked:** the Theatre, the divination readings, the Knowledge Tree, the Studio, values, skills and the Maslow lens are all computed or written locally.

---

## 16. Things that do not match, and things worth knowing

Collected from the **Check** notes above, with a few more. None of these is a fault in the sense of losing data; they are places where the interface, the older Guide and the code say different things. I have not changed any of them.

### 16.1 Retired things whose shadows remain

1. **Visions can no longer be created** (the Vision page was retired). The Theatre's rotation queue, the Values *blind spot* orbit and a few lists still read existing visions. In a fresh install *every value is a blind spot* and the Theatre has only the practices to rotate through (it says so).
2. **Projects page removed.** A project is now a Planning list that has been *made a project*. The Theatre's structural-tension and scene/script/thanks pickers still read project records — which exist only for those lists.
3. **The Spiral lens** (eight stages) is computed in full but nothing in the interface draws it.
4. **Mood shapes and the four energy dimensions** were removed from the daily check-in and habits by request. Old values are kept and read by the Days archive and Review; for new data the Maslow readings that depended on them (*body energy*, *movement*, *mind energy*, *learning habits*, *relational habits*) are empty and silently drop out of their tier's average.
5. **The Maslow lens has eight tiers; a code comment says seven.**

### 16.2 Where two measures of the same thing exist

6. **Two ledgers for skill practice.** The skill page and tree read **progress entries** (the Lived Record); the clock and the Japanese Studio add to a separate `hours`/`lastPracticed` field read only by the prompt queue and the Time view. A sitting tracked on a skill therefore does **not** warm the tree or move the skill's streak unless you also write a progress entry. (Part 9.)
7. **The evening review's energy step** is titled "set-point" but writes the day's 1–5 energy, not the 1–22 emotional set-point you set in the morning check-in. They are different numbers.

### 16.3 Name guesses (rules that read a word out of a name)

8. The house's **shelf, wall and bar** decide "musical skill" and "health value" by regular expression on names — decoration only.
9. **Maslow** tiers look for value names containing *authentic/integrity/honest*, *awe/creativ/beauty*, *service/steward/contribut/generos/sacred/unity/compassion*. Call your value something else and that reading drops out rather than reading zero.
10. **Time-entry → person** matching uses the first word of the person's name.
11. **Habit-to-room links** still have regex fallbacks (a habit named like "stillness" is ticked by a stillness session when no room link is set). Kept deliberately until confirmed.
12. The **Spiral** lens counts words such as *family/tradition* and *discipline/duty* in your entries. Dormant, but worth knowing it exists.

### 16.4 Labels and enforcement

13. Three duties' arrows (*Stillness*, *Study Deck*, *Learning Studio recall*) point at `#/stillness`, `#/studydeck`, `#/learningStudio`, which are not routes; the router falls back to Today. (Not changed.)
14. The gratitude **"why does this matter"** field is labelled *required* but only quotes enforce it.
15. The **Guide** (`docs/GUIDE.md`) still mentions some retired things (the vision page, the project page, the Spiral); this document supersedes it for the inward half.

### 16.5 Things worth knowing, not mismatches

- **Nothing is ever "overdue" if nothing happened.** A review is only due if its period had entries; an empty section is not drawn; a person-attention duty exists only on days someone is overdue.
- **Opening Today does not log your wake time.** Only an explicit answer (the greeting, the "I woke up at" button) does, so the Time record is never invented. A "not now" to the greeting also counts as an answer for that day.
- **The morning card is drawn at press, shown after the veil.** "Begin the day without keeping it" still means a card was drawn; it is just not recorded.
- **An unfinished thought is an entry from the first keystroke** with a flag; finishing only clears the flag. Nothing moves, and nothing expires.
- **Add-only things are protected by a guard** in the persistence layer: if code anywhere tried to alter a frozen Knowledge Tree *position*, Studio *snapshot* or *recall*, the row is put back.
- **Versioned vs overwritten.** A stage's story auto-versions; retro snapshots keep their text; an entry's text is simply overwritten (the *edit history* is not kept), so write a new entry when the wording itself matters.
- **Three clocks of "the day".** The *living day* (rolls over at the boundary hour, so 01:30 still belongs to yesterday), the *clock day*, and the *effective date* used by the duties. A "late night" badge appears when they differ; "start a new day" is yours to press.
- **Time-of-day suggestions follow the median of the last fourteen days** and so drift with you; a week of late nights moves the morning duties later.
- **Backups do not include the Claude key.** Restoring on a new device means pasting it again.

---

## 17. Where to find things

**Rooms and addresses** (the hash after `#/`):

| You want… | Go to |
|---|---|
| Today (execution) | `#/today` · inward view `#/today/in` · tasks `#/today/tasks` · habits `#/today/habits` · review `#/today/review` · time `#/today/time` |
| Goals, intentions, performance goals | `#/today/time/goals` |
| The Morning Theatre | Today → Looking inward → *Begin* (or the sanctuary floor); the 21-day tracker is on the same card |
| Journals / Lived Record | `#/journals` · Days archive, Timeline `#/journals/timeline`, Library `#/journals/library`, Review `#/journals/review` (also `#/compass`) |
| People · Values · Skill Tree · Finance | `#/identity` (tabs); old addresses `#/people`, `#/values`, `#/value/<id>`, `#/skills`, `#/finance` redirect there |
| Knowledge Tree | `#/tree` |
| Learning Studio | `#/studio` (a board: `#/studio/<boardId>`) |
| Study Deck | `#/study` |
| The house, sanctuary floor, stillness, divination | `#/house` |
| Settings (API key, backup, atmosphere, duties) | `#/settings` |

**Source files** (all under `src/`, concatenated by `node build.js` into `index.html`):

| Subject | Files |
|---|---|
| Today, morning card, greeting, unfinished, pins, parked | `09-today.js`, `09-morningcard.js`, `09-unfinished.js`, `16-pins.js`, `09-parked.js` |
| Theatre | `16-theatre.js`, `16-theatre-session.js`, `16-rituals.js`, `16-learned.js` |
| Stillness, house, intuition | `16-stillness.js`, `16-house.js`, `16-house-bar.js`, `16-intuition.js` |
| Divination | `16-divination*.js` |
| Journals, letters, dreams, decisions, days archive | `13-journals.js`, `13-letters.js`, `13-dreams.js`, `13-journals-days.js`, `16-intentions.js` |
| Timeline, life tape | `10-timeline.js`, `16-lifetape.js` |
| Library | `18-commonplace.js`, `18-media-preview.js` |
| Values | `12-values.js`, `12-values-solar.js` |
| Skills | `14-skills.js`, `14-skillgrow.js` |
| People | `12-people.js`, `12-people-sky.js`, `12-people-quick.js` |
| Knowledge Tree | `19-tree-a-model.js` … `19-tree-g-proof.js` |
| Learning Studio | `19-ls-a-model.js` … `19-ls-e-page.js` |
| Reviews | `16-review.js`, `16-reviewflows.js`, `16-reviewsdue.js`, `16-sysreview.js` |
| Duties and prompts | `16-duties.js`, `16-promptqueue.js`, `16-nudges.js` |
| The optional Claude connection, dictation | `06-ai.js` |
| Storage and migration | `06-db.js` (stores `ARRAY_STORES`, `META_KEYS`, database version 23) |

**Where a number's definition lives**, for the readings most often wondered about: congruence and gaps — `12-values.js`; Maslow and the long-view cards — `16-review.js`; rotation score and recipes — `16-theatre.js`; resurfacing ladder (`TREE_REVIEW_DAYS`) — `19-tree-a-model.js`; fuzzy recall — `19-ls-d-recall.js`; duty windows — `16-duties.js`.

---

*Written from the source as of this commit. When something here and the program disagree, the program is right and this is out of date — the part to fix is the one with the **Check** beside it.*

---

*The purpose layer added after this account was written — the sheet, the workbench, convergence, the demons registers, retreats, the lenses — is described in [PURPOSE.md](PURPOSE.md). Where the two differ, PURPOSE.md is newer.*

For the two music rooms (Jazz and Songwriting) in the same depth, see [STUDIOS.md](STUDIOS.md); for the Knowledge Tree on its own, see [KNOWLEDGE-TREE.md](KNOWLEDGE-TREE.md); for the Content Studio and Brand Strategy, see [BRAND.md](BRAND.md).
