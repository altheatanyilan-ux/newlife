/* ============================================================
   THE CHARMS

   Older than the cards by a long way: a handful of small objects thrown
   onto a cloth, and the pattern they make is the reading. African bone
   throwing, European cleromancy, Romani fortune-telling — all the same
   gesture, which is to hand the arrangement over to physics and then take
   seriously what physics did.

   It is not tarot with different pictures. Tarot is sequential: card one
   answers question one. A cast is spatial and all at once — nothing is
   in a position, everything is somewhere, and three things make the
   meaning:

     what landed         the charm's own symbol
     where it landed     which ring, which quarter of the cloth
     what it landed by   two charms together say what neither says alone

   The thirty here are the symbols that turn up across most traditions,
   in six families of five. A person can add their own, which is what
   everyone who does this actually does.
   ============================================================ */

const CHARM_CATS = [
  {id:'self',    name:'Self',          hint:'identity, agency, the inner world', c:'#c99a3e'},
  {id:'bonds',   name:'Bonds',         hint:'love, connection, other people',    c:'#b5607a'},
  {id:'ground',  name:'Ground',        hint:'money, home, body, work',           c:'#7f916a'},
  {id:'journey', name:'Journey',       hint:'movement, time, change',            c:'#b4462f'},
  {id:'spirit',  name:'Spirit',        hint:'wisdom, mystery, the inner life',   c:'#7b79ad'},
  {id:'shadow',  name:'Shadow',        hint:'obstacles, boundaries, endings',    c:'#8b8880'},
];

const CHARM_SET = [
  /* — self — */
  {id:'mirror', name:'The Mirror', sym:'🪞', cat:'self', hue:45,
   k:['self-reflection','truth','identity','seeing clearly'],
   m:'The Mirror asks you to look honestly at yourself. Whatever question you brought, the answer begins with self-awareness. What are you avoiding seeing?'},
  {id:'eye', name:'The Eye', sym:'👁', cat:'self', hue:280,
   k:['awareness','insight','perception','vigilance'],
   m:'The Eye is heightened awareness. Something is asking to be seen — a truth, an opening, or a pattern you have been walking past. Pay attention to what is already in front of you.'},
  {id:'hand', name:'The Hand', sym:'✋', cat:'self', hue:30,
   k:['action','agency','craft','giving','receiving'],
   m:'The Hand is what you do — your agency, your craft, your ability to shape the thing in front of you. Are you reaching for what you want, or holding back?'},
  {id:'flame', name:'The Flame', sym:'🕯', cat:'self', hue:15,
   k:['passion','illumination','spirit','transformation','desire'],
   m:'The Flame is your own fire: passion, desire, the spark that moves you. Is it burning, or has something put it out? This charm asks what lights you.'},
  {id:'mask', name:'The Mask', sym:'🎭', cat:'self', hue:260,
   k:['persona','performance','protection','the hidden self'],
   m:'The Mask is the face you show and the gap between that face and the one underneath. Where are you performing instead of being?'},

  /* — bonds — */
  {id:'heart', name:'The Heart', sym:'❤️', cat:'bonds', hue:350,
   k:['love','emotion','compassion','relationship','care'],
   m:'The Heart speaks to love in every form it takes — romantic, familial, the love you owe yourself, plain compassion. What is your heart asking for?'},
  {id:'ring', name:'The Ring', sym:'💍', cat:'bonds', hue:45,
   k:['commitment','partnership','cycles','promise','bond'],
   m:'The Ring is a binding thing. It can mean marriage, but it means any deep covenant — with a person, with a path, or with yourself.'},
  {id:'dog', name:'The Dog', sym:'🐕', cat:'bonds', hue:30,
   k:['loyalty','friendship','trust','protection','company'],
   m:'The Dog is the loyal companion. This charm asks about your allies: who has your back, and who do you stand by when it is inconvenient?'},
  {id:'bridge', name:'The Bridge', sym:'🌉', cat:'bonds', hue:170,
   k:['connection','transition','reconciliation','crossing'],
   m:'The Bridge joins what is apart. A reconciliation, a crossing between phases, or the plain need to build a connection where there is not one yet.'},
  {id:'thread', name:'The Thread', sym:'🧵', cat:'bonds', hue:340,
   k:['connection','fate','weaving','continuity','fragility'],
   m:'The Thread is the invisible line between things — the red thread of fate, the through-line of a life. What is being woven, and by whom?'},

  /* — ground — */
  {id:'coin', name:'The Coin', sym:'🪙', cat:'ground', hue:50,
   k:['money','resources','value','exchange','enough'],
   m:'The Coin is your relationship with material things. Not only money: value, exchange, and what you have decided counts as enough.'},
  {id:'key', name:'The Key', sym:'🗝', cat:'ground', hue:45,
   k:['opportunity','access','solution','secrets','unlocking'],
   m:'The Key opens what has been shut. There is a way in, a solution exists, or something kept is ready to be told. What door have you been standing in front of?'},
  {id:'house', name:'The House', sym:'🏠', cat:'ground', hue:25,
   k:['home','security','foundation','belonging','roots'],
   m:'The House is where you are safe — the building, and also the inner version of it. Where do you belong, and what are you building on?'},
  {id:'tree', name:'The Tree', sym:'🌳', cat:'ground', hue:120,
   k:['growth','roots','family','health','life force'],
   m:'The Tree is slow rooted growth: health, lineage, the organic business of becoming. Trees do not hurry, and neither should whatever this touches.'},
  {id:'hammer', name:'The Hammer', sym:'🔨', cat:'ground', hue:20,
   k:['work','building','effort','making','force'],
   m:'The Hammer is building by effort. Labour, craft, and the willingness to strike while it is hot. What are you actually constructing?'},

  /* — journey — */
  {id:'arrow', name:'The Arrow', sym:'➳', cat:'journey', hue:0,
   k:['direction','focus','intention','forward motion'],
   m:'The Arrow flies straight at a thing. Where are you aimed? Is the direction chosen, or are you drifting? It also means speed: something is moving.'},
  {id:'compass', name:'The Compass', sym:'🧭', cat:'journey', hue:190,
   k:['guidance','navigation','the path','finding the way'],
   m:'The Compass points at your own north. When it turns up, trust the instrument you already have. You know the way even when the road is not visible.'},
  {id:'hourglass', name:'The Hourglass', sym:'⏳', cat:'journey', hue:40,
   k:['time','patience','urgency','cycles','impermanence'],
   m:'The Hourglass is about time — too much of it or not enough. Are you rushing what wants waiting, or waiting on what wants moving? Timing is part of this question.'},
  {id:'snake', name:'The Snake', sym:'🐍', cat:'journey', hue:100,
   k:['transformation','shedding','wisdom','rebirth','healing'],
   m:'The Snake sheds its skin in order to grow. Something is ready to be shed — an old self, an outgrown pattern, a belief that no longer fits. It is uncomfortable and it is how renewal works.'},
  {id:'door', name:'The Door', sym:'🚪', cat:'journey', hue:25,
   k:['threshold','opportunity','choice','a new chapter','leaving'],
   m:'The Door is a threshold, and you are at one. It may be a way in or a way out. The charm does not say whether to walk through it — only that it is there.'},

  /* — spirit — */
  {id:'star', name:'The Star', sym:'✦', cat:'spirit', hue:50,
   k:['hope','aspiration','guidance','destiny','inspiration'],
   m:'The Star is the light you steer by when everything else has gone dark: the highest thing you want, the purpose underneath the plan. What star are you navigating by?'},
  {id:'moon', name:'The Moon', sym:'🌙', cat:'spirit', hue:220,
   k:['intuition','cycles','the unconscious','mystery'],
   m:'The Moon lights what is hidden. Dreams, intuition, the underneath of the mind, and the turning of natural cycles. What do you know that you do not know you know?'},
  {id:'sun', name:'The Sun', sym:'☀️', cat:'spirit', hue:45,
   k:['clarity','success','vitality','joy','consciousness'],
   m:'The Sun brings warmth and clear sight. Whatever it falls on is lit and brought fully into the open. Success, plain gladness, and seeing straight.'},
  {id:'book', name:'The Book', sym:'📖', cat:'spirit', hue:30,
   k:['knowledge','learning','secrets','study','wisdom'],
   m:'The Book is what you have learned and what you still have to. It can mean information held back that will come out through study, or simply through waiting.'},
  {id:'crystal', name:'The Crystal', sym:'💎', cat:'spirit', hue:200,
   k:['clarity','purity','amplification','truth','precious'],
   m:'The Crystal amplifies whatever is beside it. It brings clarity and it brings intensity — whatever you are feeling, it makes more so. It asks what you actually hold precious.'},

  /* — shadow — */
  {id:'lock', name:'The Lock', sym:'🔒', cat:'shadow', hue:0,
   k:['blockage','protection','secrets','boundaries','closed'],
   m:'The Lock is something shut. It may be a boundary you need or an obstacle you do not. Is this lock keeping you safe, or keeping you from the thing?'},
  {id:'skull', name:'The Skull', sym:'💀', cat:'shadow', hue:0,
   k:['endings','transformation','mortality','truth','release'],
   m:'The Skull is not death. It is the honest admission of what has ended or must. Something has run its course; this charm asks you to name it out loud and let it go.'},
  {id:'shield', name:'The Shield', sym:'🛡', cat:'shadow', hue:210,
   k:['protection','defence','resilience','boundaries','strength'],
   m:'The Shield defends. You may need to hold something — your energy, your work, a line. Or it may be saying you are over-defended, behind a wall that used to help and now only limits.'},
  {id:'crossroads', name:'The Crossroads', sym:'✖', cat:'shadow', hue:0,
   k:['choice','a decision','sacrifice','divergence'],
   m:'The Crossroads is a decision. Two roads go different ways and you cannot walk both. The charm does not choose; it insists that you do, and knowingly.'},
  {id:'dice', name:'The Dice', sym:'🎲', cat:'shadow', hue:140,
   k:['chance','risk','fate','luck','the unknown'],
   m:'The Dice are the part of this that is not up to you. Not everything is in your hands. Are you willing to throw, and can you live with any face it lands on?'},
];

const charmById = id => CHARM_SET.find(c => c.id === id) || charmCustom(id);
const charmCustom = id => (divPrefs().customCharms || []).find(c => c.id === id) || null;
/* the pool a cast is drawn from: the thirty, plus whatever has been added */
const charmPool = () => CHARM_SET.concat(divPrefs().customCharms || []);
const charmCatOf = c => CHARM_CATS.find(x => x.id === (c && c.cat)) || CHARM_CATS[5];

/* ============================================================
   THE CLOTH

   Three rings and four quarters — the layout most traditions converge on,
   because it answers the two questions a scatter raises: how close to the
   middle of it are you, and which way is it facing.
   ============================================================ */
const CAST_RINGS = [
  {id:'inner',  name:'The core',       max:.25,
   m:'You, and the heart of the matter. What lands here speaks directly to you and to the middle of what you asked.'},
  {id:'middle', name:'The influences', max:.60,
   m:'What shapes the situation without being it: people, circumstances, beliefs, habits. What surrounds you and acts on you.'},
  {id:'outer',  name:'The beyond',     max:1,
   m:'What is outside you — the wider world, what is coming toward you or going away from you, the part you do not get a vote on.'},
];
/* Angles are measured the way a screen measures them: zero to the right,
   increasing clockwise, because that is what atan2 gives once y is flipped. */
const CAST_QUARTERS = [
  {id:'north', name:'Spirit',    from:225, to:315, label:'Spirit',
   m:'the spiritual and the aspirational — meaning, wisdom, and whatever you are reaching toward'},
  {id:'east',  name:'Action',    from:315, to:45,  label:'Action',
   m:'what is approaching and what is to be done — beginnings, movement, the next thing'},
  {id:'south', name:'Material',  from:45,  to:135, label:'Material',
   m:'the physical and the practical — the body, work, money, what can actually be touched'},
  {id:'west',  name:'Intuition', from:135, to:225, label:'Intuition',
   m:'what is behind you and what you sense without proof — memory, undercurrent, the thing you already suspect'},
];
const castRing = d => CAST_RINGS.find(r => d <= r.max) || CAST_RINGS[2];
function castQuarter(deg){
  const a = ((deg % 360) + 360) % 360;
  if(a >= 225 && a < 315) return CAST_QUARTERS[0];
  if(a >= 315 || a < 45)  return CAST_QUARTERS[1];
  if(a >= 45  && a < 135) return CAST_QUARTERS[2];
  return CAST_QUARTERS[3];
}

/* ============================================================
   WHAT TWO CHARMS SAY THAT NEITHER SAYS ALONE

   This is the part of charm casting that has no equivalent in a deck of
   cards, and it is the reason people who do this keep doing it: the Key
   beside the Lock is not the Key plus the Lock. Written out for the
   pairings that actually carry something; anything else falls through to
   a plainer sentence built from the two sets of keywords, which is
   honest about being a lesser reading.

   Keys are the two ids in alphabetical order, joined by a plus.
   ============================================================ */
const CHARM_PAIRS = {
  'key+lock': 'An opening exists for exactly the thing that is closed. The solution and the problem are in the same place, which usually means you already know what to do and have not done it.',
  'heart+skull': 'Something in your emotional life is ending — not violently, naturally. A love is changing shape, or a grief is finishing its work.',
  'coin+dice': 'Money and chance in the same breath. A risk is in play; luck and effort are both required, and you should not stake what you cannot afford to lose.',
  'mask+mirror': 'The gap between who you are and who you present is the subject. This is an invitation to take the mask off — for yourself first, before anybody else.',
  'arrow+crossroads': 'You want to move and a choice is in the way. An arrow cannot fly in two directions; the decision has to come before the speed.',
  'moon+star': 'Aspiration and intuition are pointing the same way. Trust what arrives in the quiet — it agrees with what you actually want.',
  'flame+hourglass': 'What you are burning for is time-limited. The window will not stay open on its own.',
  'snake+tree': 'Slow transformation in something old — family pattern, inherited belief, the bedrock. What is shifting has deep roots and will take as long as it takes.',
  'compass+door': 'You know the way and the threshold is right there. The compass is confirming: this is the door.',
  'heart+shield': 'You are guarding your heart. The question is whether the guard is still needed — at some point the shield has to come down or nothing gets in.',
  'eye+mask': 'Someone is being seen through, or needs to be. The performance is not working as well as it was.',
  'book+eye': 'What you are looking for is written down somewhere. Research, ask, read the thing you have been meaning to read.',
  'hammer+hand': 'Straightforwardly: do the work. This is not a reading about insight, it is one about labour.',
  'coin+house': 'Money and home in the same place — rent, a move, a mortgage, the cost of being where you are.',
  'dog+heart': 'Love that is loyal rather than dramatic. A friendship carrying more weight than it is given credit for.',
  'bridge+crossroads': 'A choice between staying apart and crossing over. The bridge is built; walking it is the decision.',
  'lock+skull': 'Something closed has died behind the door. Whatever you are protecting may no longer be there.',
  'crystal+mirror': 'Truth about yourself, amplified. Clear sight that may be more than comfortable.',
  'hourglass+snake': 'A change that cannot be hurried. The shedding takes the time it takes and pushing it will only tear.',
  'star+sun': 'A good omen, plainly. Hope and clarity together — what you are hoping for is also visible.',
  'moon+skull': 'Something is ending below the surface, before you have consciously agreed to it. Listen to the dreams.',
  'door+key': 'Both halves of an opportunity have arrived at once. There is nothing left to wait for.',
  'dice+door': 'A threshold with no guarantees behind it. Walking through is a gamble, which does not mean it is the wrong move.',
  'ring+thread': 'A bond and the fate that made it. This connection has a longer history than the relationship does.',
  'mirror+shield': 'Self-protection that has become self-deception. The wall is doing something to how you see yourself.',
  'arrow+compass': 'Direction and purpose agreeing. Rare, and worth acting on while it lasts.',
  'flame+heart': 'Desire and love in the same place — which is either the best of it or the confusion at the centre of it.',
  'hammer+tree': 'Building something meant to last, or the cost to something living of what you are building.',
  'book+crystal': 'Study that clarifies. The answer is knowable; it is a matter of going and knowing it.',
  'house+tree': 'Home and family, roots in both senses. Where you are from is acting on where you live.',
  'crossroads+hourglass': 'A decision with a deadline. Not choosing will shortly become the choice.',
  'dog+shield': 'Loyalty as protection — someone is guarding you, or you are guarding them past the point of sense.',
  'eye+lock': 'You can see it and you cannot get at it. Knowing is not the same as access.',
  'coin+hand': 'Earning, exchanging, giving. Money moving because of something you do rather than something you have.',
  'mask+shield': 'Double defence. The persona and the wall are doing the same job, and it is probably too much.',
  'skull+sun': 'An ending in full daylight. Nothing hidden about it; the difficulty is accepting it, not seeing it.',
  'bridge+heart': 'Reconciliation. Someone is reachable who has not been.',
  'moon+thread': 'A connection you feel and cannot evidence. Take it seriously anyway; that is what this charm is for.',
  'skull+snake': 'A real ending, and a real renewal on the other side of it. The two are the same event.',
  'crystal+flame': 'Intensity amplified — which may be brilliance and may be burning out. Check which.',
  'compass+crossroads': 'You have the instrument and the choice at once. You know which way; the question is whether you will say so.',
  'hand+key': 'The opening exists and it needs you to act. Nothing here opens by itself.',
  'dice+hourglass': 'Chance and timing. Some of this is luck and some of it is when — neither is skill, and pretending otherwise will not help.',
  'house+lock': 'Security that has become confinement, or a home that needs its boundaries kept.',
  'arrow+door': 'Momentum toward a threshold. You are already moving; the door is where it lands.',
  'star+thread': 'Fate and aspiration braided. What you want and what keeps happening to you are the same story.',
  'book+skull': 'The end of a way of understanding something. What you knew was true is no longer sufficient.',
  'hourglass+tree': 'Growth on a longer clock than yours. Patience is not optional here.',
  'eye+mirror': 'Seeing and being seen at once. Self-knowledge arriving through someone else\'s attention.',
  'dog+door': 'Leaving, or someone leaving — and the loyalty that complicates it.',
  'bridge+lock': 'A crossing that is barred. The way over exists and something is closing it.',
  'coin+skull': 'Money and ending — a cost being counted, or something you have paid for that is finished.',
  'hammer+shield': 'Building a defence, which is work, and may be the right work or merely the busy kind.',
  'crossroads+ring': 'A commitment at a decision point. The question of whether to bind is itself the fork.',
  'flame+moon': 'Desire under the surface. Something is wanted that has not been admitted in daylight.',
  'lock+sun': 'Clarity blocked. You can nearly see it; something is in the way and it is probably yours.',
  'crystal+heart': 'Feeling, magnified, made clear. Whatever you feel about this, you feel it more than you have said.',
  'hand+thread': 'Doing your part in something larger. One pair of hands on a long weave.',
  'shield+skull': 'Defending something that has already gone. Worth checking what is actually behind the wall.',
};
const charmPairKey = (a, b) => [a, b].sort().join('+');
function charmPairText(a, b){
  const c1 = charmById(a), c2 = charmById(b);
  if(!c1 || !c2) return '';
  const w = CHARM_PAIRS[charmPairKey(a, b)];
  if(w) return w;
  /* no written pairing: say the plain thing, which is two sets of themes
     in the same place, rather than invent a meaning nobody intended */
  return `${c1.name}'s ${(c1.k[0] || '')} and ${c2.name}'s ${(c2.k[0] || '')} have come down together. `
       + `Read them as one thing: the question has ${c1.k[0]} and ${c2.k[1] || c2.k[0]} in it at the same time.`;
}
