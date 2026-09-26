# Retired smoke suites

These suites tested the Study Deck as it was before it was rebuilt to Anki's
shape (notes, note types, FSRS, .apkg import and export). The rebuild replaced
the model they exercise (`S.study`, SM-2 by default, card families, the old
deck shelf and its written import format), so their claims no longer describe
the product. They are kept here, unchanged, as the record of what that deck
promised; the rebuilt deck is tested by `smoke240.js` (and its connections by
`smoke192.js` and `smoke201.js`).

- `smoke191.js` — the first Study Deck: SM-2, the four buttons, sessions,
  suggestions, card families, deleting a deck, cloze, the day's count.
- `smoke193-decks.js` — sections 5–10 of smoke193: the two piano decks
  retired, and a deck pasted in the old written format.
- `smoke194.js` — deck options on the old shelf: opening, removing, a deck's
  own order and graduation, sub-decks.

They are not run by the sweep.
