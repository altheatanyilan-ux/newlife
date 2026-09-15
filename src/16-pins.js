/* ============================================================
   PINNED — the things you know you need to hear again.

   Some of what gets written down is a record: it happened, it is filed, you
   will find it when you go looking. And some of it is a message. A reading
   that said the thing you had been avoiding, a quote that keeps turning out
   to be about your life, a reflection you wrote once and have not managed to
   act on yet. Those are not for the archive. They are for every morning.

   So an entry can be pinned, and pinned entries gather in the Morning
   Theatre, beside the vision board — which is the same idea in pictures.

   Every one of these is an entry in S.entries: a kept divination reading is
   an entry of type `divination`, a quote is an entry of type `quote`, a
   reflection is an entry of type `reflection`. That is why this is one
   mechanism and not three, and why the control can live in entryCard(),
   which is what draws an entry everywhere in the house.

   The pin is a flag on the entry rather than a list of ids kept somewhere
   else. A list would have to be swept every time an entry is deleted, and
   the sweep is the kind of thing that gets forgotten until somebody's Today
   page is trying to draw an entry that is not there any more.
   ============================================================ */

function entryPinned(id){ const e = byId(S.entries, id); return !!(e && e.pinned); }
function pinnedEntries(){
  return (S.entries || []).filter(e => e && e.pinned)
    /* most recently pinned first: a thing you pinned this morning is the
       thing you pinned it for */
    .sort((a, b) => String(b.pinnedAt || '').localeCompare(String(a.pinnedAt || '')));
}
function setEntryPinned(id, on){
  const e = byId(S.entries, id); if(!e) return null;
  if(on){ e.pinned = true; e.pinnedAt = new Date().toISOString(); }
  else { delete e.pinned; delete e.pinnedAt; }
  saveNow();
  return e;
}
function togglePinEntry(id){
  const e = byId(S.entries, id); if(!e) return null;
  const on = !e.pinned;
  setEntryPinned(id, on);
  sound(on ? 'success' : 'click');
  toast(on ? 'Pinned to Today.' : 'Unpinned.');
  return e;
}

/* ---------- the panel, inside the Morning Theatre ----------
   It is drawn by entryCard(), the same as anywhere else, which is the whole
   point: a pinned reading looks like the reading, a pinned quote looks like
   the quote, and the 📌 that put it here is the 📌 that takes it away. */
function pinsPanelHTML(){
  const items = pinnedEntries();
  const n = items.length;
  return `<details class="th-sec th-pins" data-th="pins" open>
    <summary><span class="th-name">Pinned</span>
      <span class="mono faint">${n ? `${n} to reread` : 'nothing pinned'}</span>
      ${n ? '<i class="th-tick">✓</i>' : ''}</summary>
    <div class="th-body">
      ${n
        ? `<p class="th-quote">The ones you keep needing to hear. Read them before the day starts talking.</p>
           <div class="th-pinned">${items.map(e => entryCard(e)).join('')}</div>`
        : `<div class="empty">Nothing pinned yet. Anywhere an entry is read — a kept reading,
             a quote, a reflection — the 📌 beside it keeps a copy here, for the ones you know
             you need to hear again rather than merely to have written down.</div>`}
    </div></details>`;
}
