# The purpose layer — what was added, where it lives, and the rules it keeps

This is the companion to [INNER-LIFE.md](INNER-LIFE.md) for the layer built from the *Inner Life — Purpose-Aligned Enhancement Specification*: sixteen modules that add a purpose to the inward half of the house, and the discipline of working towards it. It says what each part is, where to find it, which rule it follows, and where the build departs from the specification.

Everything here is local. The only thing that can reach the network is the optional model connection that was already there, and the rules for what it may and may not see are at the end.

## The rules the whole layer keeps

These are the specification's, and they are tested (`smoke298`–`smoke302`).

- **Four kinds of thing.** Words (versioned, never overwritten), readings (derived, never stored), positions (add-only, frozen by the persistence guard) and marks of practice (counted, never judged).
- **Derived, not stored.** The alignment readings, the muse reading, the journey description, zone-of-genius minutes and the happiness split are computed from records. The only things stored are the person's overrides and notes.
- **A suggestion states its rule.** Every flag, panel and prompt says what raised it, in the same sentence.
- **Nothing is overdue if nothing happened.** A retreat or a review is offered only if its period had substance — the review flows' own test, reused verbatim.
- **No composite figure.** There is no single alignment number anywhere: not in the interface, the stored record or any export. The six readings are shown side by side on purpose.
- **No gamified counters.** The two strict imprint counters (ninety days for the purpose, thirty for the values) are strict because consecutiveness is the mechanism. They cannot be corrected by hand, they record their restarts, and they carry no badge, no celebration and no freeze.
- **Every new duty has three exits** — later, not today, off — and a Settings override (Settings → Duties lists every duty, its window and its rule).
- **Copy.** No new screen uses *score, grade, failure, behind, overdue* or *should have*; the resistance log contains no evaluative language even when empty; a reassurance is given once.

## Where things are

| Where | What |
|---|---|
| `#/purpose` | **The sheet** (Module 1): five artefacts — statement, genius, impact, domain, medium — each a dated version list. Read, edit and a two-minute morning review (active recall, then one rotating question). The imprint counter, the triangulation line, the screening report, printing (one page, no chrome), earlier wordings. Keys: **P** opens it; **R** starts the review when you are on it. |
| `#/purpose/genius` | **The workbench** (Module 2): the four-zone inventory, the Big Leap worksheet, the flow-clue list, fear as compass, three people admired. |
| `#/purpose/converge` | **Convergence** (Module 3): a read-only report of what keeps coming up. |
| `#/values` | **Values 2.0** (Module 4): the strip at the head of the page (thirty-day imprint, negative values, rebuild the compass), the eight-pass construction wizard, the gap question under any rating below ninety, a missing point that can become a goal. |
| `#/purpose/strengths` | **Signature strengths** (Module 5): ranked, with a versioned gloss and shadow, links to skills and values, an expression reading, the shadow worksheet. |
| `#/purpose/demons` | **Inner demons** (Module 6): beliefs (extraction wizard, challenge protocol, resurfacing ladder, promotion to the Knowledge Tree), fears (safety, or a compass bearing), the resistance log, and where it came from. |
| The Theatre, `#/today` | **Programming** (Module 7): affirmation, contemplation and purpose visualisation, as manual practices and as steps in the guided session's recipes; the chief aim reads the statement. |
| `#/purpose/vision` | **Vision, restored** (Module 8): create, edit, archive, complete; the sixty-minute guided hour; *Look at it*. |
| `#/purpose/real` | **Making it real** (Module 9): the goal funnel, purpose skills, habits with an elimination track, small bets. |
| Clock, Today, Review | **Zone-of-genius hours and happy minutes** (Module 10). |
| Review | **The muse** (Module 11) and **the lenses** (Module 15): Needs, Alignment, The Spiral. |
| The sacred space | **Finitude** (Module 12): the fifth stillness practice, in two forms; and the phone-free nature retreat. |
| `#/retreat` | **Retreats** (Module 13). |
| `#/purpose/zone` | **The contemplation zone** (Module 14). |
| `#/purpose/sheets` | **Printable sheets**: every question the layer asks (Appendix A). |

## Module by module

### 1. The sheet
Statement, genius, impact, domain, medium. Each is a version list; a typo is a correction and a reworded statement is a new version (the stage-story rule: fewer than 85% of the distinct words surviving, or the length changing by more than a fifth). The statement shows a live word count against fifteen and a soft list of vague words, each with its reason; nothing blocks saving. The screening report counts the goals, visions, bets, habits and in-focus skills that reference an artefact and lists those that do not — *these are not mistakes; they are the things that have not yet been put to the sheet*. The empty sheet is five labelled questions and one button, *build it with me*, which goes to the workbench.

The **ninety-day imprint** advances on any one of four contacts in a day (the morning review, an affirmation, a contemplation, a purpose visualisation). Four contacts do not count as four. A missed day restarts it, the restart is recorded, and the best run stays visible: *restarted twice, best run forty-one days*.

### 2. The workbench
**Zones.** One list of activities in four zones, each column carrying the course's definition (excellence is named as the trap). Candidates are offered from skills, habits, lists and clock categories with recorded time — unclassified; nothing is attached until you place it. Two readings, as counts with their rule: hours this month against what you placed (a sitting matching two activities is split evenly, and says so), and how many incompetence-zone activities have time in the last thirty days. If excellence hours are at least three times genius hours with ten recorded, one line says so, once a month.
**Worksheet.** Four questions and three sentence completions, one per screen, many answers each, nothing required. It opens on the course's framing in the dark arrival, resumes at the question you left, and files one Reflection per part. It ends by showing part one question four beside part two question two and offering to draft a genius sentence — as a **new version** of the genius artefact.
**Flow clues.** One field to capture (also from the evening review and the Theatre), completed later; two rollups of recurring phrases.
**Fear as compass.** A short flow: which directions are you afraid of, and is each about safety or about the cost of something grand. Only the second kind is a bearing, and only those are counted on the sheet.
**Three people admired.** Person records, circle *aspirational*, status *not yet met*, with three research fields.

### 3. Convergence
Counts recurring phrases across what you have written about yourself and never writes to an entry. The corpus is reflections, questions and their answers, contemplations, gratitude, synchronicities, manifestations, visualisations, letters, memories, life events, value definitions, strengths glosses, vision future memories and the sheet's wordings. Divination, progress and nods, and quotes are left out by default, each with a toggle and a reason. **Sealed letters and commitments are never read.** Phrases of two to five words are normalised (lower-cased, stop words dropped, crude suffix stripping), counted by **distinct entries** (so a phrase nine times in one entry does not outrank one in three), merged when near-duplicate using the Learning Studio's own edit-distance matcher, and ranked by entries, then kinds spanned, then days spanned. A **candidate** needs at least four entries, three kinds and a hundred and eighty days — the rule is printed beside the heading. *The obvious thing* sets the top candidates against skills, habits, clock categories with hours and Library works that changed you. Below thirty qualifying entries it explains itself and shows nothing. It is consulted in the seasonal and annual retreats, and it raises no prompt or duty.

### 4. Values 2.0
The eight-pass construction wizard (brainstorm, master list, toxic values, narrow, define in fifteen to twenty words) is resumable and commits as **one** ranking-history row. The gap question: any rating below ninety asks *why a seven and not a ten* with the real arithmetic in the prompt, stores the missing points beside the snapshot, and can turn one into a thirty-day goal with the value already linked. The **negative-value release** is a five-screen session that files a Reflection and appends an add-only release row. The **thirty-day imprint** is the same strict counter at thirty; a season is a *seasonal reset* by design, recorded separately from a missed day.

### 5. Strengths
Ranked by drag with every re-ranking recorded; a versioned gloss and shadow; counts (not percentages) of the skills and zone activities that express each; a morning card that asks one of three questions, chosen reproducibly. The annual retake duty exists only when the newest ranking is a year old. The shadow worksheet asks four questions; the last — is there a belief underneath — hands a belief to the register with the strength linked.

### 6. Inner demons
Beliefs are **challenged, not scored**; there is no total and no trend, because a shrinking count would be a false reading. The extraction wizard seeds bad-result areas from live readings and preselects none. A completed challenge appends an immutable row; a reframe can become an affirmation in one action; a belief can be promoted to a Knowledge Tree position with its confidence prefilled. The resurfacing ladder borrows the Tree's (3, 14, 61, 183, 365 days). The resistance log is one field, completable later, and scolds nothing. Beliefs, fears, mementos and resistance are **never sent to the model**.

### 7. Programming
Affirmation (five minutes, a short managed set, no count on the screen), contemplation (frames an open Question and can add the result as a tentative answer), and purpose visualisation (by horizon). Leaving early keeps what was written and records the minutes actually sat. The guided session's recipes gain the new steps; every session still ends on exactly one chief aim, now a reading of the statement.

### 8. Vision
A vision is created, edited, archived and completed from the interface. The **guided hour** has three movements (dream, specify, compress), with an advisory timer, a single large field for the dream, fourteen questions one to a screen, and the future memory beside an honest current reality at the end. A fear-shaped phrase in the dream offers the fear inventory once per session. The hour resumes where you left it and files a Reflection. *Look at it* shows up to five cards at random, one at a time, large — a picture the vision carries, or a **horizon card**: a line of its future memory as type.

### 9. Making it real
The goal funnel (thirty or more, the top twenty per cent with its arithmetic shown, each screened against the sheet; a goal that hits nothing can be kept, with the reason recorded), obstacles with specific actions that become tasks in one click, the purpose-skill generator (creates only what you tick), habits ranked with an elimination track that insists on a replacement but saves anyway, and **small bets**: a hypothesis, the artefacts it tests, a planned end capped at sixty-two days with a soft warning, a weekly log, and an add-only verdict among four non-evaluative options. *This is mine* offers a vision, a domain skill and a niche candidate.

### 10. Hours
A clock category or skill may be marked as zone-of-genius work; a single sitting can be set by hand either way, and the source is shown. Today shows one line — the day's minutes against the daily commitment (sixty by default) — on days with recorded time, and nothing otherwise. The streak is forgiving (a day not yet worked is a day still going) and the one counter that can be corrected by hand. Closing a sitting offers a three-tap feeling reading; skipping it leaves the sitting **unclassified, not neutral**. The happiness panel does not draw below five classified sittings, states what share of tracked minutes it covers, and draws the four-cell comparison only when every cell has thirty minutes.

### 11. The muse
A reading from five inputs, each traceable: nature contact, reinspiring intake, novelty, peer contact, creative output. An input with no data is dropped, never zero. It lives on the Review with the same override and note as the Maslow tiers. *Feed your muse* is raised only when the reading is under forty **and** the thirty-day set-point is under its own ninety-day mean, at most once a week, and names the lowest input — with the actual works or people where there are some. Four cadence duties (nature retreat, travel, a three-day break, a long break) are **off by default**. A Library work can be flagged *reinspiring* independently of its resonance; a person can be a mentor, an accountability partner or a peer, with a note each. The phone-free nature retreat is two buttons — *I'm going*, then *I'm back* — and one question afterwards.

### 12. Finitude and detachment
The fifth stillness practice has two forms (urgency, with one question; grounding, with none), files a Memento kept out of the journals sidebar and out of On this day, and has an on-by-default duty in the before-sleep window. The **grasping reading** — *how would it be if this did not arrive* — is asked on a manifestation, never scored, trended or shown on Today, and appears in exactly two places: a third or fourth answer offers one line and a focus wheel or a grounding sitting, and the quarterly retreat lists the intentions set from need. A **commitment** is a sealed letter with a type and three fields. The annual rite asks the authenticity question as a free field with no scale.

### 13. Retreats
Five kinds, each a guided flow that writes a record of which steps were done. Leaving partway is normal and the interface never calls it abandoned. A retreat and its review never ask the same question twice: a shared step registry shows the review a retreat's answer, read-only, with a link. A retreat is offered only for a period with substance, and nothing calls it overdue. Weekly, monthly, seasonal and annual raise one duty each, on by default; the nature retreat is off.

### 14. The zone and the observer voice
A flag on any entry plus the artefact it is about. Capture from the Unfinished field (one optional select), Alt+Z, and a *think about this* button on each canonical artefact. Processing is one at a time with three dispositions — promote (the editor opens with the zone text beside it, and the item keeps a link to the version it produced), keep (noting that it was considered), let go (the flag clears; nothing is deleted). The third-person toggle changes the form's questions — never the user's text — and defaults on for the zone only. Each artefact shows *last refined on D, from N zone items*; an artefact edited directly records that, as information and not a block.

### 15. The lenses
Six readings, shown side by side: clarity, congruence, expression, labour, projection, and obstruction (a pair of counts, deliberately not turned into a positive reading). Each is tappable for its inputs and rule and takes the same override and note as the Maslow tiers. A reading with no data is dropped with its reason. The aligned-but-idle line appears at most once a month and only when its three conditions hold. The **Spiral** is drawn with all eight stages, every input named — including the word families it reads from your entries — and an override. Nothing is added to Today.

### 16. Integrity fixes
Dead duty routes repaired; the energy step relabelled; the structural-tension empty state names only targets that exist; the tracker and the Lived Record agree when thanks is given twice; the installed-belief view collects memories, life events, works and people; Maslow facets are tagged rather than guessed; the practice ledger is unified, by explicit confirmed migration.

## The journey, as a description
`journeyState()` reads *searching, testing, committing* or *mastering* from the record, with its rule stated, on the Review beside the alignment readings. It is never shown as a rank, it only decides which optional prompts are worth drawing, and it can be overridden with a note. While you are searching, the zone-of-genius streak is not mentioned; when mastering, the annual retreat asks one question — *is this still the purpose, or is it finished.*

## What the model never sees
The optional model connection is used as before, with local fallbacks. **Belief, fear, memento and resistance entries and sealed letters are excluded** from the pattern report and from the period reading, and Settings says so. The convergence engine, every alignment reading and the muse run in the page and never leave it. Printing is the browser's own.

## Where the build departs from the specification
- **File names.** The new source files are `19-purpose-*.js`, not `20-`/`21-`: the build concatenates in alphabetical order and `20-modal-init.js` must stay last.
- **Restart dates.** The imprint counters hold their run, best run and restart count, and each restart or seasonal reset is also a row in the add-only practice log (`imprint-restart`, `imprint-seasonal`), rather than arrays of dates in the meta key.
- **Missing points.** Snapshots keep numeric ratings; the named missing points sit beside them in `missingPoints`.
- **Zone-of-genius flag.** Derived live from the category or skill (with a per-sitting override) rather than stored on each sitting; the streak is derived too, with a day map for hand corrections.
- **Convergence store.** The store holds the ignore list and the toggles; the index itself is rebuilt on demand in chunks (invalidated when the corpus changes by more than two per cent) instead of being updated on every save.
- **Vision board.** The board had been retired, its pictures having become images on the records. Visions now carry images, and *Look at it* is the board's focus mode, with horizon cards. There are no separate board cards to link.
- **Promoting to a belief or a stage story** opens the page with the zone text beside it and records the link, rather than editing in place.
- **Settings → Duties** lists every duty in the house, not only the new ones.
- **Navigation.** *Purpose* and *Retreat* sit in the Identity zone.
