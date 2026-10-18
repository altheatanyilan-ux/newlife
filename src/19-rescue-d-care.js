/* ============================================================
   READY THE ROOM — environmental engineering for a good think

   A hard hour of thinking goes better in a room that is not quietly arguing
   with you: a full bottle within reach, the bin out, a clear rectangle of desk,
   the phone somewhere it has to be fetched, the air moving. None of that is
   news. The trouble with a reminder is that the brain learns it: the same
   sentence in the same place is ticked off without being done.

   So this never says the same thing twice running. There are about twenty things,
   each with a dozen ways of being asked — a sensory one, a curious one, a tiny one,
   a timed one, a kind one — dealt like a shuffled pack (every wording is used
   before any is repeated). Which three are offered is chosen by how long it has
   been since each was last done, the hour, and a rule that no two share an area.
   Each is an invitation with one short reason, not a command, and never a score.

   During a long page, now and then, one small body-care line leans in at the edge
   (water, eyes, shoulders, air). Nothing blocks. Nothing is required.
   ============================================================ */

/* [id, area, short name, {pre, mid, hours (how stale before it counts as due), at (hours of the day it suits)}, [variants: [text, why, quest-seconds]]] */
const RESCUE_CARE = [
  ['water', 'drink', 'water', {pre: 1, mid: 1, hours: 3}, [
    ['Fill the water bottle and put it where your hand already falls.', 'Thirst shows up as fog long before it shows up as thirst.'],
    ['Go and fill the bottle. The walk to the tap is the first free reset of this hour.', ''],
    ['A full glass within arm’s reach, before the first thought.', 'Then there is no reason to stand up halfway through one.'],
    ['Fill it to the very top this time.', 'So the next trip to the tap is not a way of leaving.'],
    ['Refill the water — can you do it before the kettle would have boiled?', '', 60],
    ['Cold water, full bottle. Your head is mostly that.', ''],
    ['Water first. It is the cheapest clarity on offer.', ''],
    ['Bring water you can reach without getting up.', 'A small thing, and the kind that decides whether you stay.'],
    ['Pour a glass for the person who will be sitting here in an hour.', 'You. Thirsty, a little deeper in.'],
    ['Take a few sips now, before you have anything to think about.', ''],
    ['Fill the bottle and set it on the side you reach with.', ''],
    ['Put a glass of water down before you sit, like a promise to yourself.', ''],
    ['Is the bottle full? If you are not sure, it is not.', '']]],
  ['trash', 'room', 'rubbish', {pre: 1, hours: 40}, [
    ['Take the trash out and let the room exhale.', ''],
    ['Find the piece of rubbish that has been here longest, and end its stay.', ''],
    ['Bin run: tissues, wrappers, receipts. Bag them and take the bag out of the room.', 'It is the leaving that clears it, not the moving about.'],
    ['If the bin is more than half full, empty it now.', 'You will not do it mid-thought, and you will notice it every time.'],
    ['Take out whatever has a smell, a crumb or a wrapper.', ''],
    ['Five things to the bin, counted aloud. Go.', '', 60],
    ['Remove one thing nobody is using from this room — out of the room, not onto another surface.', ''],
    ['Walk the bag to the outside bin, and take one slow breath of outdoors on the way back.', ''],
    ['Rubbish out. It is the smallest big reset there is.', ''],
    ['Look around for anything that is rubbish and has simply been tolerated. Evict it.', ''],
    ['Carry out the bin even if it is only half full. A half-empty bin is a to-do you carry around.', ''],
    ['A trash sweep: one lap of the room, one bag, nothing negotiated.', '', 90]]],
  ['surface', 'room', 'the desk', {pre: 1, hours: 30}, [
    ['Clear the desk to what this hour needs, and rehome the rest for now.', 'A temporary home counts.'],
    ['Wipe down the surface you will think on, one pass of a cloth.', ''],
    ['Ninety seconds: rehome only what is within arm’s reach.', 'A short timer keeps this from becoming a cleaning day.', 90],
    ['Put away the cups and plates.', 'Dishes are loud even when they are silent.'],
    ['What is the oldest object on the desk? Take it home to where it lives.', ''],
    ['Leave one thing on the desk besides the laptop — the one you will need.', ''],
    ['Make a clean rectangle big enough for a notebook and your elbows.', ''],
    ['Look at the desk the way a stranger would. Move the first thing they would notice.', ''],
    ['A clear surface is a decision you only have to make once.', 'Make it now.'],
    ['Everything on the desk either earns its place for this hour or goes elsewhere.', 'The elsewhere can be the floor, for now.'],
    ['Take the mug, the plate, the pen that does not work. Three things off the desk.', ''],
    ['Start from an empty desk and put back only what you reach for.', '']]],
  ['air', 'air', 'air', {pre: 1, mid: 1, hours: 4}, [
    ['Open the window for the length of one song.', ''],
    ['Crack a window, even for three minutes.', 'Still air makes thoughts heavy.'],
    ['Walk to the window and look at the farthest thing you can see for twenty seconds. Then open it a hand’s width.', '', 30],
    ['Let the room breathe: door or window, three minutes.', ''],
    ['Is it too warm in here? A cooler room is a calmer one.', ''],
    ['Open something — a window, a door, a curtain — and feel the difference.', ''],
    ['Fresh air first, then thoughts.', ''],
    ['Move the air: open a window, switch on the fan, or step outside for a minute.', ''],
    ['Take three breaths at an open window or door.', '', 25],
    ['The room has been breathing your air for a while. Give it some new.', ''],
    ['A window open for ten minutes costs almost nothing and changes the whole room.', '']]],
  ['light', 'light', 'light', {pre: 1, hours: 8}, [
    ['Switch to the softer light: lamp on, ceiling off. If it is day, open the curtains.', ''],
    ['Light from the side is kinder than light from above. Move the lamp.', ''],
    ['Set the screen brightness to match the room, not to outshine it.', 'Your eyes do a quiet amount of work here.'],
    ['If it is day, move toward the window. If it is night, switch on only the light you need.', ''],
    ['Warm light for thinking, bright light for doing. Which is this?', ''],
    ['Put the light where the page is, not where your face is.', ''],
    ['Is there a glare on the screen? Turn the screen or the lamp until it is gone.', ''],
    ['In the evening, dim the room a notch. The head follows the light down.', '', 0, 'night'],
    ['Open the curtains all the way. Light is free, and it is on your side.', '']]],
  ['phone', 'attention', 'the phone', {pre: 1, hours: 6}, [
    ['Put the phone in another room — or at least face down across the room.', 'Fetching it should cost you a decision.'],
    ['Do-not-disturb on, phone where you would have to stand up to touch it.', ''],
    ['Silence everything that can ping. You can check all of it in one go afterwards.', ''],
    ['The phone goes in a drawer for the length of this page. It will still be there.', ''],
    ['Notifications off for an hour. The world queues politely.', ''],
    ['Turn the phone face down, then turn it into the next room.', ''],
    ['Imagine it buzzing in an hour. Now take away its chance to.', ''],
    ['Plug the phone in somewhere across the room, screen down. It has a nice spot over there.', ''],
    ['If someone truly needs you, they will ring. Everything else can queue.', ''],
    ['Turn it off for the length of one page. You are allowed.', '']]],
  ['tabs', 'attention', 'the screen', {pre: 1, hours: 6}, [
    ['Close every tab you are not using for this. They live on in history.', ''],
    ['Quit the chat apps for the length of this page.', ''],
    ['One window only: this one.', ''],
    ['Close the three tabs you have been “about to” read.', 'Bookmark them if it hurts.'],
    ['Put the screen in the state you would want to find it in if you were tired.', ''],
    ['Archive the tabs: if it matters, it will be in your history.', ''],
    ['Hide the dock, hide the desktop, hide the noise.', '']]],
  ['seat', 'body', 'the chair', {pre: 1, mid: 1, hours: 5}, [
    ['Both feet on the floor, screen at eye height, shoulders dropped — check them in that order.', ''],
    ['Set the chair so your elbows rest at about a right angle.', ''],
    ['Prop the laptop up so you look straight at it, not down. A pile of books will do.', ''],
    ['If you have sat all day, stand for the first ten minutes.', ''],
    ['Slide your hips to the back of the chair and let it hold you.', ''],
    ['Sit like someone with a lot of time. Back supported, jaw loose.', ''],
    ['Lift the screen, drop the shoulders, uncross the legs.', ''],
    ['Is the chair right? A cushion behind the lower back is a ten-second fix.', ''],
    ['Check your feet: flat on the floor, or on a book if they do not reach.', '']]],
  ['fuel', 'drink', 'food', {pre: 1, mid: 1, hours: 4}, [
    ['When did you last eat? If the answer is “hm”, fix that first.', ''],
    ['A banana, some nuts, anything that is not sugar alone.', ''],
    ['Hungry thoughts sound just like deadline thoughts. Feed the hungry one first.', ''],
    ['Make tea — and notice the hour. Late caffeine borrows from tonight’s sleep.', '', 0, 'night'],
    ['Something warm to hold while you think?', ''],
    ['A small snack within reach, so you do not have to leave in the middle.', ''],
    ['Something to eat before you start, so your brain is not borrowing against the meal.', ''],
    ['Check the kitchen: has the last meal been a while? Eat something real.', ''],
    ['A piece of fruit and a few nuts is a perfectly good meal for a page.', ''],
    ['Eat a little now so the thinking is not done on an empty tank.', '']]],
  ['move', 'body', 'moving', {pre: 1, mid: 1, hours: 2}, [
    ['Roll your shoulders back ten times, slowly.', ''],
    ['Stand, reach for the ceiling, fold and touch the floor. Once.', ''],
    ['Walk once round the room at a slightly slower pace than usual.', ''],
    ['Shake out your hands for ten seconds.', 'They have been holding a lot.', 15],
    ['Splash cold water on your face, or press a cool cloth to your eyes.', ''],
    ['Stretch your neck both ways and let your jaw hang loose.', ''],
    ['Stand up and sit down again, slowly, as if you had just arrived.', ''],
    ['Two minutes on your feet before the sitting. It makes the sitting longer.', ''],
    ['Walk to the farthest room and back, slowly, noticing nothing in particular.', '', 60],
    ['Stand and shake out your legs like you are about to run, then do not.', '', 20]]],
  ['loo', 'body', 'the bathroom', {pre: 1, mid: 1, hours: 3}, [
    ['Bathroom now, so nothing interrupts the good bit later.', ''],
    ['Wash your hands and face — a small fresh start.', ''],
    ['Go now, while it is optional.', ''],
    ['Five minutes of nothing is hard to hold if you need the bathroom. Go first.', ''],
    ['A quick wash, a glass of water on the way back.', ''],
    ['Go while you are still thinking about nothing in particular.', ''],
    ['Bathroom break, then a clean start.', ''],
    ['Take one minute to go, and look out of a different window on the way.', '']]],
  ['paper', 'tools', 'pen & paper', {pre: 1, hours: 24}, [
    ['Put a pen and some paper within reach anyway.', 'Some thoughts come out better by hand.'],
    ['Open the notebook to a blank page, even if you end up using the screen.', ''],
    ['A pen on the desk, the lid already off.', ''],
    ['A pen that works, a page that is blank, within arm’s reach.', ''],
    ['If you end up wanting to draw an arrow, you will want paper. Put some nearby.', ''],
    ['Keep a scrap of paper beside you for the thoughts that are not for this page.', ''],
    ['Open the notebook, uncap the pen, and leave them both there.', '']]],
  ['sound', 'sound', 'sound', {pre: 1, hours: 8}, [
    ['Choose your sound before you start: silence, rain, or one long instrumental track. Not a playlist.', ''],
    ['Headphones charged and on, the volume lower than you think.', ''],
    ['Is the room too quiet or too busy? Fix whichever it is.', ''],
    ['Decide the noise, so the noise does not decide you.', ''],
    ['Is it quiet enough? If not, door shut, or a steady sound on.', ''],
    ['Pick a track with no words, or choose silence on purpose.', ''],
    ['Turn off anything that talks: the radio, the telly, the video you have “playing in the background”.', '']]],
  ['warmth', 'comfort', 'warmth', {pre: 1, hours: 8}, [
    ['Add a layer or take one off. Being slightly cold quietly steals focus.', ''],
    ['Socks and a blanket, if it is evening. Comfort is part of the plan.', '', 0, 'night'],
    ['Check your hands and feet. If either is cold, deal with that first.', ''],
    ['Change into something you could think in all night.', ''],
    ['Is the room a degree too cold or too warm? Fix it, then forget it.', ''],
    ['A jumper within reach is cheaper than being cold.', ''],
    ['Warm hands, warm feet, a calm head.', '']]],
  ['line', 'time', 'a finish line', {pre: 1, hours: 12}, [
    ['Decide when you will stop — the time, not the feeling. Say it aloud.', ''],
    ['Set a timer for forty minutes so the page is allowed to end.', ''],
    ['When will this page be over? Pick the time and write it on the first box.', ''],
    ['Name the end of the hour before it starts. Say it: “I stop at…”.', ''],
    ['A page with an edge feels lighter. When does this one end?', ''],
    ['Pick the time you will leave off, and put one thing after it you are looking forward to.', ''],
    ['Set a gentle alarm for the end. The page is allowed to finish.', '']]],
  ['power', 'tools', 'power', {pre: 1, hours: 24}, [
    ['Plug the laptop in so you are not hunting a charger in the middle of a thought.', ''],
    ['Check the battery, and the charger, and the headphones.', ''],
    ['Laptop plugged in, headphones charged, phone somewhere that is not this desk.', ''],
    ['Locate the charger now, in the calm, not in the middle of a thought.', ''],
    ['A battery that dies halfway through a page is a small tragedy. Plug it in.', ''],
    ['Power first: laptop, then anything else that has to last the hour.', '']]],
  ['eyes', 'body', 'your eyes', {mid: 1, hours: 1.2}, [
    ['Look at the farthest thing you can see for twenty seconds.', '', 20],
    ['Close your eyes for the length of three slow breaths.', '', 20],
    ['Blink slowly ten times. Screens make us forget.', ''],
    ['Look out of the window for twenty seconds. Focus on a far leaf, a far roof, a far cloud.', '', 20],
    ['Cover your eyes with your palms for a slow count of ten.', '', 15],
    ['Let your eyes rest on something green, if there is anything green.', '']]],
  ['breath', 'body', 'breath', {pre: 1, mid: 1, hours: 2}, [
    ['Three slow breaths, out longer than in.', '', 30],
    ['Breathe out as if fogging a window. Then once more.', '', 20],
    ['One long breath in through the nose, a slow count of six out.', '', 20],
    ['Breathe in for four, hold for four, out for six. Three times.', '', 40],
    ['Put a hand on your belly and let it rise on the in-breath.', '', 25],
    ['Let the next three breaths be slower than you think they need to be.', '', 30]]],
  ['mind', 'attention', 'a clear head', {pre: 1, hours: 12}, [
    ['If there is a small chore nagging you, do it now or write it on the page. Not both.', ''],
    ['Is there one thing you keep “just remembering”? Get it onto paper before you start.', ''],
    ['Tell someone you will be offline for an hour, if you need to.', ''],
    ['Write down the one thing you keep almost forgetting. Now it is somebody else’s problem: the paper’s.', ''],
    ['Is there a message you owe? Send a two-word reply, or write it on the page.', ''],
    ['Take the nagging thing and give it a time: “tomorrow at ten”. Then let it go.', '']]],
];

/* the openings, closings and quiet lines: varied for the same reason */
const RESCUE_CARE_HEADS = ['Before you think —', 'Make the room do some of the work', 'Three small kindnesses to the room', 'Engineer the next hour',
  'A few things the room could do for you', 'Set the stage', 'Ready the room', 'Small things that make the page easier', 'Before the first box'];
const RESCUE_CARE_DONE = ['The room is ready.', 'That is enough. The page is yours.', 'Good — the room is on your side now.', 'Done. Now think.', 'The room has stopped arguing.', 'Ready when you are.'];
const RESCUE_CARE_LATER = ['not this one', 'later', 'skip', 'another', 'not now'];

/* ---------- the pack: a shuffled bag per item, so no wording repeats until all have been used ---------- */
function rescueCareState(){
  const s = S.settings = S.settings || {}; const c = s.rescueCare = s.rescueCare || {};
  c.done = c.done && typeof c.done === 'object' ? c.done : {}; c.bag = c.bag && typeof c.bag === 'object' ? c.bag : {};
  c.shown = c.shown && typeof c.shown === 'object' ? c.shown : {}; c.mine = Array.isArray(c.mine) ? c.mine : []; c.lastHead = +c.lastHead >= 0 ? +c.lastHead : -1;
  c.doneLine = +c.doneLine >= 0 ? +c.doneLine : -1;
  return c;
}
const rescueCareItem = id => { const r = RESCUE_CARE.find(x => x[0] === id); return r ? {id: r[0], area: r[1], name: r[2], cfg: r[3], variants: r[4]} : null; };
/* the next wording for an item, from its bag; the bag is refilled in a new random order when empty */
function rescueCareVariant(id, avoidIndex){
  const it = rescueCareItem(id); if(!it) return null;
  const c = rescueCareState(); let bag = c.bag[id];
  if(!Array.isArray(bag) || !bag.length){
    bag = it.variants.map((_, i) => i).sort(() => Math.random() - .5);
    /* the first of a new bag is never the last one used */
    if(bag.length > 1 && bag[bag.length - 1] === c.shown[id + ':v']) bag.unshift(bag.pop());
  }
  let i = bag.pop(); if(i === avoidIndex && bag.length){ const j = bag.pop(); bag.push(i); i = j; }
  c.bag[id] = bag; c.shown[id] = new Date().toISOString(); c.shown[id + ':v'] = i;
  const v = it.variants[i];
  return {id, idx: i, area: it.area, name: it.name, text: v[0], why: v[1] || '', quest: v[2] || 0, night: v[3] === 'night'};
}
const rescueHoursSince = iso => iso ? (Date.now() - Date.parse(iso)) / 36e5 : 1e4;
function rescueCareDayPeriod(){ const h = new Date().getHours(); return h >= 21 || h < 5 ? 'night' : 'day'; }
/* which items to offer: the stalest first, one to an area, the hour in mind, with a little luck */
function rescueCarePick(n, mode, exclude){
  const c = rescueCareState(), per = rescueCareDayPeriod();
  const flag = mode === 'mid' ? 'mid' : 'pre';
  let pool = RESCUE_CARE.map(r => ({id: r[0], area: r[1], cfg: r[3]})).filter(x => x.cfg[flag] && !(exclude || []).includes(x.id));
  const mineN = c.mine.length;
  const scored = pool.map(x => {
    const h = rescueHoursSince(c.done[x.id]), shownH = rescueHoursSince(c.shown[x.id]);
    let sc = Math.min(h / Math.max(x.cfg.hours, .5), 6) * 2 + Math.random() * 2.2;
    if(shownH < 2 && mode !== 'mid') sc -= 2;       /* offered a moment ago: give another a turn */
    if(x.id === 'water' && h > 3) sc += 4;
    if(x.id === 'fuel' && per === 'night') sc -= 1.5;
    return Object.assign({sc}, x);
  }).sort((a, b) => b.sc - a.sc);
  const out = [], areas = new Set();
  for(const x of scored){ if(out.length >= n) break; if(areas.has(x.area)) continue; out.push(x); areas.add(x.area); }
  const picks = out.map(x => rescueCareVariant(x.id)).filter(Boolean);
  /* one of the person's own, now and then, in place of the last */
  if(mode !== 'mid' && mineN && picks.length && Math.random() < .4){
    const pool2 = c.mine.filter(x => !x.always); if(!pool2.length) return picks; const m = pool2[Math.floor(Math.random() * pool2.length)]; picks[picks.length - 1] = {id: 'mine:' + m.id, idx: 0, area: 'mine', name: 'mine', text: m.text, why: '', quest: 0, mine: true};
  }
  return picks;
}
function rescueCareMark(id, sheet){
  const c = rescueCareState(); c.done[id] = new Date().toISOString();
  if(sheet && !sheet._virtual){ sheet.ready = sheet.ready || []; sheet.ready.push({id, at: c.done[id]}); rescueTouch(sheet); }
  else { /* no page exists until you write: what was readied waits, and goes onto the page when it is made */
    if(_rs && sheet && sheet._virtual){ _rs.readyLog = _rs.readyLog || []; _rs.readyLog.push({id, at: c.done[id]}); }
    saveNow(); }
}

/* ---------- the essentials, and the invitation on a blank page ----------
   Some things are worth checking every single time. Those are the essentials: ALL of them
   are on the card, each time, and which they are is yours to set. What changes is how
   each one is put — a fresh wording and a fresh angle every time, from its shuffled pack.
   Under them, "and maybe", a couple of optional extras that rotate by how long they
   have gone undone. */
const RESCUE_CARE_CORE = ['water', 'trash', 'surface', 'phone', 'air', 'light', 'loo', 'seat', 'power'];
const rescueCareCoreIds = () => { const c = rescueCareState(); return Array.isArray(c.core) ? c.core.filter(id => rescueCareItem(id)) : RESCUE_CARE_CORE.slice(); };
const RESCUE_CARE_ORDER = ['drink', 'room', 'air', 'light', 'attention', 'body', 'comfort', 'sound', 'tools', 'time', 'mine'];
function rescueReadyOn(){ return (S.settings || {}).rescueReady !== false; }
function rescueReadyHead(){ const c = rescueCareState(); let i = Math.floor(Math.random() * RESCUE_CARE_HEADS.length); if(i === c.lastHead) i = (i + 1) % RESCUE_CARE_HEADS.length; c.lastHead = i; return RESCUE_CARE_HEADS[i]; }
/* the essentials in a sensible walk-round order, each with the next wording from its pack; the person's own "every time" items join them */
function rescueReadyEssentials(){
  const ids = rescueCareCoreIds().sort((a, b) => RESCUE_CARE_ORDER.indexOf(rescueCareItem(a).area) - RESCUE_CARE_ORDER.indexOf(rescueCareItem(b).area));
  const out = ids.map(id => Object.assign(rescueCareVariant(id), {core: true}));
  rescueCareState().mine.filter(m => m.always).forEach(m => out.push({id: 'mine:' + m.id, idx: 0, area: 'mine', name: 'mine', text: m.text, why: '', quest: 0, mine: true, core: true}));
  return out;
}
function rescueReadyShow(root, force){
  if(!_rs) return;
  const s = _rs.sheet, stage = root.querySelector('#rsStage'); if(!stage) return;
  root.querySelectorAll('.rs-ready').forEach(n => n.remove());
  if(!force && (!rescueReadyOn() || rescueLive(s).length || (s.readyDismissed))) { if(rescueLive(s).length && (s.ready || []).length) rescueReadyPill(root); return; }
  const core = rescueReadyEssentials();
  const extra = rescueCarePick(2, 'pre', rescueCareCoreIds());
  const picks = core.concat(extra.map(x => Object.assign(x, {core: false})));
  const d = document.createElement('div'); d.className = 'rs-ready'; d.setAttribute('role', 'region'); d.setAttribute('aria-label', 'ready the room');
  _rs.ready = {picks, done: new Set()};
  const li = (p, i) => rescueReadyItemHTML(p, i);
  d.innerHTML = `<div class="rs-ready-h"><span class="serif">${esc(rescueReadyHead())}</span><span class="rs-ready-n mono faint" id="rdN"></span><button class="rs-ready-x" aria-label="put this away" title="put this away">×</button></div>
    <div class="rs-ready-scroll">
      ${core.length ? `<div class="rs-ready-sec"><span class="mono faint">every time</span></div>
      <ul class="rs-ready-l">${picks.map((p, i) => p.core ? li(p, i) : '').join('')}</ul>` : ''}
      ${extra.length ? `<div class="rs-ready-sec"><span class="mono faint">and, maybe</span></div><ul class="rs-ready-l">${picks.map((p, i) => p.core ? '' : li(p, i)).join('')}</ul>` : ''}
    </div>
    <div class="rs-ready-f"><button class="tbtn" data-rd="mine" title="add something of your own to the pack">+ one of my own</button><button class="tbtn" data-rd="essentials" title="choose what is checked every time">my essentials…</button><span class="grow"></span><button class="tbtn" data-rd="all" title="everything above is already true">already all done</button><button class="btn sm" data-rd="go">${esc(['Begin', 'Enough — begin', 'Start the page', 'On to the page'][Math.floor(Math.random() * 4)])}</button></div>`;
  stage.parentNode.appendChild(d);
  rescueReadyBind(root, d);
  rescueReadyCount(d);
}
/* how long ago, if it was done recently enough that it may well still be true */
function rescueReadyRecent(p){
  const id = p.id, at = (rescueCareState().done || {})[id]; if(!at) return '';
  const it = rescueCareItem(id.replace(/^mine:.*/, '')), lim = it ? Math.max(it.cfg.hours / 2, .5) : 1, h = rescueHoursSince(at);
  if(h > lim) return '';
  const m = Math.round(h * 60); return m < 2 ? 'ticked a moment ago' : m < 90 ? `ticked ${m} min ago` : `ticked ${Math.round(h)}h ago`;
}
function rescueReadyItemHTML(p, i){
  const rec = rescueReadyRecent(p);
  return `<li class="rs-ready-i${p.core ? ' core' : ''}" data-ri2="${i}"><button class="rs-tick" data-rd="tick" aria-label="done" title="done"></button>
    <div class="rs-ready-t"><span>${esc(p.text)}</span>${p.why ? `<em>${esc(p.why)}</em>` : ''}${rec ? `<em class="rs-rec">${esc(rec)}</em>` : ''}${p.quest ? `<button class="tbtn rs-quest" data-rd="quest" data-sec="${p.quest}">start ${p.quest}s</button>` : ''}</div>
    <button class="rs-swap" data-rd="swap" aria-label="${p.core ? 'say it another way' : 'another one'}" title="${p.core ? 'say it another way' : 'another one'}">↻</button></li>`;
}
function rescueReadyCount(d){
  const picks = _rs.ready.picks, coreN = picks.filter(p => p.core).length, doneCore = [..._rs.ready.done].filter(i => picks[i] && picks[i].core).length;
  const n = d.querySelector('#rdN'); if(n) n.textContent = coreN ? `${doneCore} of ${coreN}` : '';
  return {coreN, doneCore};
}
function rescueReadyBind(root, d){
  const s = _rs.sheet;
  const finish = () => {
    d.classList.add('ready'); const c = rescueCareState();
    let i = Math.floor(Math.random() * RESCUE_CARE_DONE.length); if(i === c.doneLine) i = (i + 1) % RESCUE_CARE_DONE.length; c.doneLine = i;
    const b = d.querySelector('[data-rd="go"]'); if(b) b.textContent = 'Begin';
    d.querySelector('.rs-ready-h .serif').textContent = RESCUE_CARE_DONE[i]; save();
  };
  const tick = (li, on) => {
    const i = +li.dataset.ri2, p = _rs.ready.picks[i]; if(!p) return; li.classList.toggle('on', on);
    if(on){ _rs.ready.done.add(i); if(!p.mine) rescueCareMark(p.id, s); else { rescueCareState().done[p.id] = new Date().toISOString(); save(); } } else _rs.ready.done.delete(i);
    const c = rescueReadyCount(d); if(c.coreN && c.doneCore === c.coreN) finish(); else d.classList.remove('ready');
  };
  d.addEventListener('click', ev => {
    const b = ev.target.closest('[data-rd]'); if(!b) return; const act = b.dataset.rd, li = b.closest('.rs-ready-i'), i = li ? +li.dataset.ri2 : -1;
    if(act === 'tick'){ tick(li, !li.classList.contains('on')); sound('click'); }
    else if(act === 'all'){ d.querySelectorAll('.rs-ready-i.core').forEach(l => { if(!l.classList.contains('on')) tick(l, true); }); sound('click'); }
    else if(act === 'swap'){
      const p = _rs.ready.picks[i]; if(!p) return;
      let alt = null;
      if(p.core && !p.mine){
        /* the same thing, said another way */
        alt = Object.assign(rescueCareVariant(p.id, p.idx), {core: true});
      } else if(!p.core){
        /* another optional thing, not one already on the card */
        const used = _rs.ready.picks.map(x => x.id).concat(rescueCareCoreIds());
        alt = rescueCarePick(1, 'pre', used)[0]; if(alt) alt.core = false;
      }
      if(!alt) return; _rs.ready.picks[i] = alt; _rs.ready.done.delete(i);
      li.outerHTML = rescueReadyItemHTML(alt, i); rescueReadyCount(d); sound('click');
    } else if(act === 'quest'){
      const sec = +b.dataset.sec; let left = sec; b.disabled = true; b.textContent = left + 's';
      const t = setInterval(() => { left--; if(!d.isConnected){ clearInterval(t); return; } b.textContent = left > 0 ? left + 's' : 'time — done?'; if(left <= 0){ clearInterval(t); b.disabled = false; b.onclick = () => { li.querySelector('.rs-tick').click(); b.remove(); }; } }, 1000);
      if(_rs) _rs.timers.push(t);
    } else if(act === 'go'){ s.readyDismissed = true; d.remove(); if(_rs.ready && _rs.ready.done.size) rescueReadyPill(root); const f = root.querySelector('#rsCanvas'); if(f) f.focus(); rescueTouch(s); }
    else if(act === 'mine') rescueReadyMine(d);
    else if(act === 'essentials') rescueEssentialsDialog(root);
  });
  d.querySelector('.rs-ready-x').onclick = () => { s.readyDismissed = true; d.remove(); rescueTouch(s); };
}
/* which things are checked every time */
function rescueEssentialsDialog(root){
  const c = rescueCareState(), on = new Set(rescueCareCoreIds());
  const byArea = {}; RESCUE_CARE.filter(r => r[3].pre).forEach(r => { (byArea[r[1]] = byArea[r[1]] || []).push(r); });
  const m = openModal(`<h2>My essentials</h2>
    <p class="muted" style="font-size:.88rem">What is checked <b>every</b> time, all of it, on every page. Everything else turns up now and then as an optional extra. Whatever you choose, each one is worded differently each time.</p>
    <div class="rs-ess">${RESCUE_CARE_ORDER.filter(a => byArea[a]).map(a => `<div class="rs-ess-g"><span class="mono faint">${esc(a)}</span>${byArea[a].map(r => `<label class="rs-ess-r"><input type="checkbox" data-ess="${r[0]}" ${on.has(r[0]) ? 'checked' : ''}><span>${esc(r[2])}</span><em class="faint">${esc(r[4][0][0])}</em></label>`).join('')}</div>`).join('')}</div>
    <div class="row" style="justify-content:space-between;gap:8px;margin-top:12px"><button class="tbtn" id="essReset">back to the usual</button><button class="btn primary" id="essOk">Keep this</button></div>`, 'wide');
  m.querySelector('#essReset').onclick = () => { m.querySelectorAll('[data-ess]').forEach(x => { x.checked = RESCUE_CARE_CORE.includes(x.dataset.ess); }); };
  m.querySelector('#essOk').onclick = () => { c.core = [...m.querySelectorAll('[data-ess]:checked')].map(x => x.dataset.ess); save(); m.remove(); if(root && _rs) rescueReadyShow(root, true); };
}
/* once the writing has begun, the invitation folds to a small mark of what was done */
function rescueReadyPill(root){
  if(!_rs) return; const s = _rs.sheet, n = (s.ready || []).length; root.querySelectorAll('.rs-ready-pill').forEach(x => x.remove());
  if(!n) return;
  const p = document.createElement('button'); p.className = 'rs-ready-pill'; p.title = 'ready the room again'; p.textContent = `room · ${n} thing${n === 1 ? '' : 's'} done`;
  p.onclick = () => rescueReadyShow(root, true); root.querySelector('#rsStage').parentNode.appendChild(p);
}
function rescueReadyMine(d){
  const root = document.querySelector('[data-rs-page]');
  const c = rescueCareState();
  const m = openModal(`<h2>One of my own</h2><p class="muted sm">Something only you would think to do before a hard hour. It joins the pack and turns up now and then in place of one of the others.</p>
    <input class="inp" id="rcOwn" placeholder="e.g. put on the green lamp, text Mira that I’m offline" maxlength="120">
    <label class="row" style="gap:8px;margin-top:8px"><input type="checkbox" id="rcAlways"> <span class="faint sm">check this every time (otherwise it turns up now and then)</span></label>
    ${c.mine.length ? `<div class="rs-bt-l">${c.mine.map(x => `<div class="rs-bt"><span>${esc(x.text)}</span><button class="tbtn danger" data-rmx="${esc(x.id)}">remove</button></div>`).join('')}</div>` : ''}
    <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary" id="rcAdd">Add</button></div>`, 'narrow');
  m.querySelector('#rcAdd').onclick = () => { const t = m.querySelector('#rcOwn').value.trim(); if(!t) return; c.mine.push({id: uid(), text: t, always: m.querySelector('#rcAlways').checked}); save(); m.remove(); toast('Added to the pack.'); if(root && _rs) rescueReadyShow(root, true); };
  m.querySelectorAll('[data-rmx]').forEach(b => b.onclick = () => { c.mine = c.mine.filter(x => x.id !== b.dataset.rmx); save(); b.closest('.rs-bt').remove(); });
}

/* ---------- during a long page: one small body-care line, now and then ---------- */
function rescueCareNudgesOn(){ return (S.settings || {}).rescueCareNudges !== false; }
function rescueCareLater(root, ms){ if(!_rs) return; _rs.timers.push(setTimeout(() => rescueCareNudge(root), ms)); }
function rescueCareNudge(root){
  if(!_rs) return;
  if(!rescueCareNudgesOn() || document.hidden || _rs.sheet.landing){ rescueCareLater(root, 10 * 60000); return; }
  const picks = rescueCarePick(1, 'mid'); const p = picks[0]; if(!p){ rescueCareLater(root, 10 * 60000); return; }
  const box = root.querySelector('#rsWhisper'); if(!box) return;
  /* the lean-in lines and this one share the corner; this one waits if a line is showing */
  if(box.classList.contains('on')){ rescueCareLater(root, 90000); return; }
  box.innerHTML = `<span class="rs-w care">${esc(p.text)}</span><button class="rs-wx" data-cd="done" aria-label="done" title="done">✓</button><button class="rs-wx" data-cd="no" aria-label="not now" title="not now">×</button>`;
  box.classList.add('on');
  const hide = () => box.classList.remove('on');
  box.querySelector('[data-cd="done"]').onclick = () => { rescueCareMark(p.id, _rs.sheet); hide(); sound('click'); };
  box.querySelector('[data-cd="no"]').onclick = hide;
  _rs.timers.push(setTimeout(hide, 20000));
  rescueCareLater(root, (30 + Math.random() * 14) * 60000);
}

/* ---------- Settings ---------- */
function rescueCareSettingsHTML(){
  const a = rescueReadyOn(), b = rescueCareNudgesOn();
  return `<div class="opt"><div><b>Ready the room</b><div class="d">On a blank page, three small invitations for the room — water, the bin, the desk, the phone, the air — never worded the same way twice, chosen by what has gone longest undone. You can add your own.</div></div><label class="toggle ${a ? 'on' : ''}" id="sRescueReady"><span class="sw"></span></label></div>
    <div class="opt"><div><b>Body-care lines during a page</b><div class="d">On a long page, now and then, one small line leans in at the edge: water, eyes, shoulders, air. It goes by itself after a few seconds.</div></div><label class="toggle ${b ? 'on' : ''}" id="sRescueCare"><span class="sw"></span></label></div>`;
}
function bindRescueCareSettings(root){
  const r = root || document;
  const a = r.querySelector('#sRescueReady'); if(a) a.onclick = () => { S.settings.rescueReady = !(S.settings.rescueReady !== false); a.classList.toggle('on', S.settings.rescueReady !== false); saveNow(); };
  const b = r.querySelector('#sRescueCare'); if(b) b.onclick = () => { S.settings.rescueCareNudges = !(S.settings.rescueCareNudges !== false); b.classList.toggle('on', S.settings.rescueCareNudges !== false); saveNow(); };
}
