/* ============================================================
   FURIGANA FROM THE READING YOU TYPED.

   There was a reading generator here for a while — a kanji table, a word
   list, okurigana matching — and it went, because a reading you type is a
   reading you have thought about and thinking about it is most of the point.

   But once you HAVE typed the reading of a whole phrase, putting it over the
   right characters is not a language problem at all. It is an alignment
   problem, and alignment is exact where generation is a guess.

   組み合わせる and くみあわせる. The kana in the phrase are anchors: み and
   わせる must appear in the reading, in that order, spelled the same way.
   Find them, and what falls between them belongs to the kanji between them.
   く over 組, あ over 合, and the kana left alone. Nothing had to be looked
   up, and nothing was guessed.

   IT REFUSES RATHER THAN GUESSES. If the anchors are not there in order —
   the reading is of something else, or has a typo, or the phrase is all
   kanji with no kana to hold on to — there is no alignment, and the room
   shows the reading beside the phrase the way it always did rather than
   spreading it over the characters arbitrarily. Furigana in the wrong place
   is worse than furigana in a line underneath, because you will read it.

   AND A RUN OF KANJI IS ONE GROUP. 経営 with けいえい over it: nothing in
   the reading says where けい stops and えい starts, so it goes over both
   characters together. That is what a printed edition does with a word whose
   reading cannot be split, and it is honest about what is known.
   ============================================================ */

const JA_RUBY_KANJI = /[一-鿿々〆ヶ]/;
/* Katakana and hiragana compare as one thing here: a phrase written in
   katakana may perfectly well have its reading typed in hiragana, and a long
   vowel mark belongs to both. */
const jaKanaFold = s => String(s || '')
  .replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60))
  .replace(/\s+/g, '');

/* The phrase cut into runs of kanji and runs of everything else. */
function jaRubyTokens(text){
  const out = [];
  [...String(text || '')].forEach(ch => {
    const kanji = JA_RUBY_KANJI.test(ch);
    const last = out[out.length - 1];
    if(last && last.kanji === kanji) last.text += ch;
    else out.push({kanji, text: ch});
  });
  return out;
}

/* The alignment. Returns one piece per run, each with the slice of the
   reading that belongs to it, or null where the reading cannot be made to
   fit — which is the answer often enough to be worth returning honestly. */
function jaAlign(surface, reading){
  const text = String(surface || '');
  const say = String(reading || '');
  if(!text || !say) return null;
  const tokens = jaRubyTokens(text);
  if(!tokens.some(t => t.kanji)) return null;      /* nothing to write over */
  const fold = jaKanaFold(say);
  const out = [];
  let at = 0;                                      /* how far into the reading */
  for(let i = 0; i < tokens.length; i++){
    const tok = tokens[i];
    if(!tok.kanji){
      const want = jaKanaFold(tok.text);
      /* punctuation and the like are not in the reading and are simply passed */
      if(!want){ out.push({text: tok.text, reading: ''}); continue; }
      if(!fold.startsWith(want, at)) return null;
      out.push({text: tok.text, reading: ''});
      at += want.length;
      continue;
    }
    const next = tokens.slice(i + 1).find(t => !t.kanji && jaKanaFold(t.text));
    if(!next){
      /* the last thing in the phrase is kanji: it takes the rest */
      if(at >= fold.length) return null;           /* no reading left for it */
      out.push({text: tok.text, reading: say.slice(at)});
      at = fold.length;
      continue;
    }
    /* the next kana run is the far wall; at least one kana must fall inside */
    const wall = jaKanaFold(next.text);
    const stop = fold.indexOf(wall, at + 1);
    if(stop < 0) return null;
    out.push({text: tok.text, reading: say.slice(at, stop)});
    at = stop;
  }
  if(at !== fold.length) return null;              /* reading left over */
  if(out.some(p => p.text && JA_RUBY_KANJI.test(p.text) && !p.reading)) return null;
  return out;
}
const jaRubyFits = (surface, reading) => !!jaAlign(surface, reading);
/* The phrase with the reading set over the kanji. Where it will not align,
   the phrase comes back plain and the reading stays on its own line — said
   by the caller, not smuggled in here. */
function jaRubyHTML(surface, reading){
  const parts = jaAlign(surface, reading);
  if(!parts) return esc(String(surface || ''));
  return parts.map(p => p.reading
    ? `<ruby>${esc(p.text)}<rt>${esc(p.reading)}</rt></ruby>`
    : esc(p.text)).join('');
}
