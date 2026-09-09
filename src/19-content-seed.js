/* ============================================================
   CONTENT — the room, already furnished.

   Eight pieces spread across the pipeline, because a Kanban board with
   nothing on it teaches nobody what it is for. They carry real word
   counts (the binder is written into, not faked, so wsProjectWords
   agrees with the progress bars), inspiration trails, pinned vault
   quotes and one journal link — the whole shape of the thing, small.
   All of it ordinary and all of it deletable, like the rest of the
   starter set.
   ============================================================ */
const CONTENT_SEEDED = 'starter';

/* filler that reads like prose so the word counts are honest and the
   previews are not lorem ipsum. The point is the count, not the text. */
function ctSeedProse(words){
  const pool = ('It kept coming back and I could not put it down again so I wrote until the shape of it ' +
    'showed itself and then I wrote past that too because the shape was not the point the point was what ' +
    'stayed underneath it the whole time and would not move however long I looked at it ').trim().split(' ');
  const out = [];
  /* paragraph breaks are inserted between words rather than as words, so the
     count the binder reports is exactly the count asked for */
  for(let i = 0; i < words; i++) out.push(i && i % 34 === 0 ? '\n\n' + pool[i % pool.length] : pool[i % pool.length]);
  return out.join(' ').replace(/ \n\n/g, '\n\n');
}

function contentSeedIfEmpty(){
  const c = contentState();
  if(c.seeded) return;
  /* never on top of writing the person already did */
  if((S.entries || []).filter(e => e.type === 'writing').length > 2){ c.seeded = CONTENT_SEEDED; saveNow(); return; }
  migrateContent();
  const T = today(), th = n => (contentTheme(n) || {}).id;
  const vault = (S.contentVault?.quotes) || [];
  const byBook = t => vault.filter(q => q.bookTitle === t);

  const make = ({title, sub, stage, type, dest, themes, target, words, sched, pubOn, url,
                 trail = [], quoteBooks = [], quoteN = 0, raw = '', outline = [], notes = '', pinned, ago = 0}) => {
    const e = contentNewPiece({title, stage, type, dest, themes: themes.map(th).filter(Boolean), raw});
    const c2 = e.extra.content;
    e.createdAt = new Date(Date.parse(addDays(T, -Math.max(ago, 3)) + 'T10:00:00')).toISOString();
    if(target) e.extra.target = Object.assign(e.extra.target || {}, {wordTarget:target});
    if(sub) c2.subtitle = sub;
    if(sched) c2.scheduled = sched;
    if(pubOn) c2.publishedOn = pubOn;
    if(url){ c2.url = url; c2.checks = {proofread:true, titled:true, dest:true, dated:true, url:true}; }
    if(notes) e.extra.scratchpad = notes;
    if(outline.length) e.extra.outline = outline.map(t => ({id:uid(), text:t}));
    if(pinned) c2.pinned = true;
    c2.stageAt = new Date(Date.parse(addDays(T, -ago) + 'T10:00:00')).toISOString();
    /* the words go into the binder, so the count is counted rather than claimed */
    if(words){
      const binder = wsBinder(e), doc = wsFlatDocs(binder)[0];
      if(doc){ doc.body = ctSeedProse(words);
        doc.updatedAt = new Date(Date.parse(addDays(T, -ago) + 'T18:00:00')).toISOString(); }
    }
    trail.forEach(([kind, text]) => pieceAddTrail(e, kind, text));
    quoteBooks.forEach(book => byBook(book).slice(0, quoteN).forEach(q =>
      c2.quotes.push({id:uid(), text:q.text, source:q.bookTitle, author:q.author,
        pageOrLocation:q.pageOrChapter, whyCaught:'', sourceType:'book_vault_quote', sourceId:q.id,
        paraphrase:!!q.paraphrase, addedAt:new Date().toISOString()})));
    return e;
  };

  make({title:"The Self-Image You Didn't Choose", stage:'draft', type:'essay', dest:'substack',
    themes:['Identity','Consciousness'], target:2500, words:800, ago:4,
    sub:'On inheriting a picture of yourself and calling it the truth',
    trail:[['reading', 'Sparked by reading Psycho-Cybernetics, chapter two'],
           ['timeline_event', 'Connected to the 独·Solitude stage']],
    quoteBooks:['Psycho-Cybernetics'], quoteN:2, pinned:true});

  make({title:'What Tokyo Taught Me Before I Got There', stage:'seed', type:'essay', dest:'personal_blog',
    themes:['Japan','Freedom'], target:2000, ago:9,
    raw:'A place can do most of its work on you from a distance. Years of it. What is that, exactly — a plan, or a hiding place?',
    trail:[['timeline_event', 'Emerged from the 未·Not Yet stage narrative']]});

  make({title:'The Reading–Writing Bridge: How Books Become Essays', stage:'outline', type:'guide', dest:'substack',
    themes:['Reading & Learning','Creativity'], target:3000, words:450, ago:6,
    outline:['The problem: a hundred highlights and nothing written',
             'Why the note is not the idea',
             'Three passes: catch, connect, commit',
             'What to do with the quote that will not fit',
             'A worked example, start to finish'],
    trail:[['reading', 'Every book I finished this year and did not write about']],
    quoteBooks:['The Path of Least Resistance','The Science of Getting Rich'], quoteN:2});

  make({title:'Why I Track My Values (And What I Found)', stage:'idea', type:'reflection', dest:'personal_blog',
    themes:['Identity','Discipline'], ago:14,
    raw:'Two years of congruence scores. The surprise was not the gap — it was which value had the gap.',
    trail:[['journal_entry', 'Promoted from a reflection a fortnight ago']]});

  make({title:'Structural Tension: The Creative Force Nobody Talks About', stage:'refining', type:'essay',
    dest:'substack', themes:['Creativity','Mastery'], target:2500, words:2100, ago:2,
    sub:'Hold the vision and the truth at once, and something has to give',
    trail:[['reading', 'Robert Fritz, read twice, understood on the second pass'],
           ['conversation', 'An argument about whether goals are useful']],
    quoteBooks:['The Path of Least Resistance'], quoteN:4});

  make({title:'Thread: Learning to Be Seen', stage:'ready', type:'thread', dest:'twitter',
    themes:['Identity','Relationships'], target:280, words:280, ago:1,
    sched:addDays(T, ((8 - parseDay(T).getDay()) % 7) || 7),
    trail:[['shower_thought', 'Occurred to me halfway through saying no to something']]});

  make({title:'The Plateau Is the Practice', stage:'draft', type:'newsletter', dest:'substack',
    themes:['Mastery','Discipline'], target:1800, words:1200, ago:5,
    trail:[['reading', 'Leonard on the plateau, and Loehr on recovery, in the same week']],
    quoteBooks:['Mastery','The Power of Full Engagement'], quoteN:1});

  make({title:'My Financial Architect Blueprint', stage:'idea', type:'guide', dest:'personal_blog',
    themes:['Money & Independence','Career & Craft'], ago:11,
    raw:'The gap analysis said the number out loud. Writing it down for someone else would make me check my arithmetic.',
    trail:[['other', 'Sparked by the Finance page gap analysis']]});

  /* one already out in the world, so the statistics have something to stand on */
  make({title:'On Keeping a Commonplace Book', stage:'published', type:'essay', dest:'personal_blog',
    themes:['Reading & Learning','Storytelling'], target:1400, words:1460, ago:38,
    pubOn:addDays(T, -38), url:'https://example.com/on-keeping-a-commonplace-book',
    trail:[['reading', 'A footnote about Montaigne that took over an afternoon']]});

  /* the first piece links to a real journal entry if there is one to link to */
  const first = contentPieces().find(e => e.title.startsWith('The Self-Image'));
  const journal = (S.entries || []).find(e => e.type === 'reflection' && e.title);
  if(first && journal) pieceLink(first, 'journal_entry', journal.id, journal.title);

  c.seeded = CONTENT_SEEDED;
  saveNow();
}
