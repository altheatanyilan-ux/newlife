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
    ['Take a few sips now, before you have anything to think about.', '']]],
  ['trash', 'room', 'rubbish', {pre: 1, hours: 40}, [
    ['Take the trash out and let the room exhale.', ''],
    ['Find the piece of rubbish that has been here longest, and end its stay.', ''],
    ['Bin run: tissues, wrappers, receipts. Bag them and take the bag out of the room.', 'It is the leaving that clears it, not the moving about.'],
    ['If the bin is more than half full, empty it now.', 'You will not do it mid-thought, and you will notice it every time.'],
    ['Take out whatever has a smell, a crumb or a wrapper.', ''],
    ['Five things to the bin, counted aloud. Go.', '', 60],
    ['Remove one thing nobody is using from this room — out of the room, not onto another surface.', ''],
    ['Walk the bag to the outside bin, and take one slow breath of outdoors on the way back.', ''],
    ['Rubbish out. It is the smallest big reset there is.', '']]],
  ['surface', 'room', 'the desk', {pre: 1, hours: 30}, [
    ['Clear the desk to what this hour needs, and rehome the rest for now.', 'A temporary home counts.'],
    ['Wipe down the surface you will think on, one pass of a cloth.', ''],
    ['Ninety seconds: rehome only what is within arm’s reach.', 'A short timer keeps this from becoming a cleaning day.', 90],
    ['Put away the cups and plates.', 'Dishes are loud even when they are silent.'],
    ['What is the oldest object on the desk? Take it home to where it lives.', ''],
    ['Leave one thing on the desk besides the laptop — the one you will need.', ''],
    ['Make a clean rectangle big enough for a notebook and your elbows.', ''],
    ['Look at the desk the way a stranger would. Move the first thing they would notice.', ''],
    ['A clear surface is a decision you only have to make once.', 'Make it now.']]],
  ['air', 'air', 'air', {pre: 1, mid: 1, hours: 4}, [
    ['Open the window for the length of one song.', ''],
    ['Crack a window, even for three minutes.', 'Still air makes thoughts heavy.'],
    ['Walk to the window and look at the farthest thing you can see for twenty seconds. Then open it a hand’s width.', '', 30],
    ['Let the room breathe: door or window, three minutes.', ''],
    ['Is it too warm in here? A cooler room is a calmer one.', ''],
    ['Open something — a window, a door, a curtain — and feel the difference.', ''],
    ['Fresh air first, then thoughts.', '']]],
  ['light', 'light', 'light', {pre: 1, hours: 8}, [
    ['Switch to the softer light: lamp on, ceiling off. If it is day, open the curtains.', ''],
    ['Light from the side is kinder than light from above. Move the lamp.', ''],
    ['Set the screen brightness to match the room, not to outshine it.', 'Your eyes do a quiet amount of work here.'],
    ['If it is day, move toward the window. If it is night, switch on only the light you need.', ''],
    ['Warm light for thinking, bright light for doing. Which is this?', '']]],
  ['phone', 'attention', 'the phone', {pre: 1, hours: 6}, [
    ['Put the phone in another room — or at least face down across the room.', 'Fetching it should cost you a decision.'],
    ['Do-not-disturb on, phone where you would have to stand up to touch it.', ''],
    ['Silence everything that can ping. You can check all of it in one go afterwards.', ''],
    ['The phone goes in a drawer for the length of this page. It will still be there.', ''],
    ['Notifications off for an hour. The world queues politely.', ''],
    ['Turn the phone face down, then turn it into the next room.', '']]],
  ['tabs', 'attention', 'the screen', {pre: 1, hours: 6}, [
    ['Close every tab you are not using for this. They live on in history.', ''],
    ['Quit the chat apps for the length of this page.', ''],
    ['One window only: this one.', ''],
    ['Close the three tabs you have been “about to” read.', 'Bookmark them if it hurts.']]],
  ['seat', 'body', 'the chair', {pre: 1, mid: 1, hours: 5}, [
    ['Both feet on the floor, screen at eye height, shoulders dropped — check them in that order.', ''],
    ['Set the chair so your elbows rest at about a right angle.', ''],
    ['Prop the laptop up so you look straight at it, not down. A pile of books will do.', ''],
    ['If you have sat all day, stand for the first ten minutes.', ''],
    ['Slide your hips to the back of the chair and let it hold you.', '']]],
  ['fuel', 'drink', 'food', {pre: 1, mid: 1, hours: 4}, [
    ['When did you last eat? If the answer is “hm”, fix that first.', ''],
    ['A banana, some nuts, anything that is not sugar alone.', ''],
    ['Hungry thoughts sound just like deadline thoughts. Feed the hungry one first.', ''],
    ['Make tea — and notice the hour. Late caffeine borrows from tonight’s sleep.', '', 0, 'night'],
    ['Something warm to hold while you think?', ''],
    ['A small snack within reach, so you do not have to leave in the middle.', '']]],
  ['move', 'body', 'moving', {pre: 1, mid: 1, hours: 2}, [
    ['Roll your shoulders back ten times, slowly.', ''],
    ['Stand, reach for the ceiling, fold and touch the floor. Once.', ''],
    ['Walk once round the room at a slightly slower pace than usual.', ''],
    ['Shake out your hands for ten seconds.', 'They have been holding a lot.', 15],
    ['Splash cold water on your face, or press a cool cloth to your eyes.', ''],
    ['Stretch your neck both ways and let your jaw hang loose.', ''],
    ['Stand up and sit down again, slowly, as if you had just arrived.', '']]],
  ['loo', 'body', 'the bathroom', {pre: 1, mid: 1, hours: 3}, [
    ['Bathroom now, so nothing interrupts the good bit later.', ''],
    ['Wash your hands and face — a small fresh start.', ''],
    ['Go now, while it is optional.', '']]],
  ['paper', 'tools', 'pen & paper', {pre: 1, hours: 24}, [
    ['Put a pen and some paper within reach anyway.', 'Some thoughts come out better by hand.'],
    ['Open the notebook to a blank page, even if you end up using the screen.', ''],
    ['A pen on the desk, the lid already off.', '']]],
  ['sound', 'sound', 'sound', {pre: 1, hours: 8}, [
    ['Choose your sound before you start: silence, rain, or one long instrumental track. Not a playlist.', ''],
    ['Headphones charged and on, the volume lower than you think.', ''],
    ['Is the room too quiet or too busy? Fix whichever it is.', ''],
    ['Decide the noise, so the noise does not decide you.', '']]],
  ['warmth', 'comfort', 'warmth', {pre: 1, hours: 8}, [
    ['Add a layer or take one off. Being slightly cold quietly steals focus.', ''],
    ['Socks and a blanket, if it is evening. Comfort is part of the plan.', '', 0, 'night'],
    ['Check your hands and feet. If either is cold, deal with that first.', ''],
    ['Change into something you could think in all night.', '']]],
  ['line', 'time', 'a finish line', {pre: 1, hours: 12}, [
    ['Decide when you will stop — the time, not the feeling. Say it aloud.', ''],
    ['Set a timer for forty minutes so the page is allowed to end.', ''],
    ['When will this page be over? Pick the time and write it on the first box.', '']]],
  ['power', 'tools', 'power', {pre: 1, hours: 24}, [
    ['Plug the laptop in so you are not hunting a charger in the middle of a thought.', ''],
    ['Check the battery, and the charger, and the headphones.', '']]],
  ['eyes', 'body', 'your eyes', {mid: 1, hours: 1.2}, [
    ['Look at the farthest thing you can see for twenty seconds.', '', 20],
    ['Close your eyes for the length of three slow breaths.', '', 20],
    ['Blink slowly ten times. Screens make us forget.', '']]],
  ['breath', 'body', 'breath', {pre: 1, mid: 1, hours: 2}, [
    ['Three slow breaths, out longer than in.', '', 30],
    ['Breathe out as if fogging a window. Then once more.', '', 20],
    ['One long breath in through the nose, a slow count of six out.', '', 20]]],
  ['mind', 'attention', 'a clear head', {pre: 1, hours: 12}, [
    ['If there is a small chore nagging you, do it now or write it on the page. Not both.', ''],
    ['Is there one thing you keep “just remembering”? Get it onto paper before you start.', ''],
    ['Tell someone you will be offline for an hour, if you need to.', '']]],
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
    const m = c.mine[Math.floor(Math.random() * mineN)]; picks[picks.length - 1] = {id: 'mine:' + m.id, idx: 0, area: 'mine', name: 'mine', text: m.text, why: '', quest: 0, mine: true};
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

/* ---------- the invitation, on a blank page ---------- */
function rescueReadyOn(){ return (S.settings || {}).rescueReady !== false; }
function rescueReadyHead(){ const c = rescueCareState(); let i = Math.floor(Math.random() * RESCUE_CARE_HEADS.length); if(i === c.lastHead) i = (i + 1) % RESCUE_CARE_HEADS.length; c.lastHead = i; return RESCUE_CARE_HEADS[i]; }
function rescueReadyShow(root, force){
  if(!_rs) return;
  const s = _rs.sheet, stage = root.querySelector('#rsStage'); if(!stage) return;
  root.querySelectorAll('.rs-ready').forEach(n => n.remove());
  if(!force && (!rescueReadyOn() || rescueLive(s).length || (s.readyDismissed))) { if(rescueLive(s).length && (s.ready || []).length) rescueReadyPill(root); return; }
  const picks = rescueCarePick(3, 'pre');
  const d = document.createElement('div'); d.className = 'rs-ready'; d.setAttribute('role', 'region'); d.setAttribute('aria-label', 'ready the room');
  _rs.ready = {picks, done: new Set()};
  d.innerHTML = `<div class="rs-ready-h"><span class="serif">${esc(rescueReadyHead())}</span><button class="rs-ready-x" aria-label="put this away" title="put this away">×</button></div>
    <ul class="rs-ready-l">${picks.map((p, i) => rescueReadyItemHTML(p, i)).join('')}</ul>
    <div class="rs-ready-f"><button class="tbtn" data-rd="mine" title="add something of your own to the pack">+ one of my own</button><span class="grow"></span><button class="btn sm" data-rd="go">${esc(['Begin', 'Enough — begin', 'Start the page', 'On to the page'][Math.floor(Math.random() * 4)])}</button></div>`;
  stage.parentNode.appendChild(d);
  rescueReadyBind(root, d);
}
function rescueReadyItemHTML(p, i){
  return `<li class="rs-ready-i" data-ri2="${i}"><button class="rs-tick" data-rd="tick" aria-label="done" title="done"></button>
    <div class="rs-ready-t"><span>${esc(p.text)}</span>${p.why ? `<em>${esc(p.why)}</em>` : ''}${p.quest ? `<button class="tbtn rs-quest" data-rd="quest" data-sec="${p.quest}">start ${p.quest}s</button>` : ''}</div>
    <button class="rs-swap" data-rd="swap" aria-label="another one" title="another one">↻</button></li>`;
}
function rescueReadyBind(root, d){
  const s = _rs.sheet;
  const finish = () => {
    d.classList.add('ready'); const c = rescueCareState();
    let i = Math.floor(Math.random() * RESCUE_CARE_DONE.length); if(i === c.doneLine) i = (i + 1) % RESCUE_CARE_DONE.length; c.doneLine = i;
    const f = d.querySelector('.rs-ready-f'); const b = d.querySelector('[data-rd="go"]'); if(b) b.textContent = 'Begin';
    d.querySelector('.rs-ready-h .serif').textContent = RESCUE_CARE_DONE[i]; save();
  };
  d.addEventListener('click', ev => {
    const b = ev.target.closest('[data-rd]'); if(!b) return; const act = b.dataset.rd, li = b.closest('.rs-ready-i'), i = li ? +li.dataset.ri2 : -1;
    if(act === 'tick'){
      const p = _rs.ready.picks[i]; if(!p) return; const on = !li.classList.contains('on'); li.classList.toggle('on', on);
      if(on){ _rs.ready.done.add(i); if(!p.mine) rescueCareMark(p.id, s); else { const m = rescueCareState(); m.done[p.id] = new Date().toISOString(); save(); } sound('click'); } else _rs.ready.done.delete(i);
      if(_rs.ready.done.size === _rs.ready.picks.length) finish();
    } else if(act === 'swap'){
      const p = _rs.ready.picks[i], others = _rs.ready.picks.filter((_, j) => j !== i), areas = new Set(others.map(x => x.area));
      /* another thing, from an area the other two are not already covering */
      const used = RESCUE_CARE.filter(r => areas.has(r[1]) || r[0] === p.id || others.some(x => x.id === r[0])).map(r => r[0]);
      const alt = rescueCarePick(1, 'pre', used)[0]; if(!alt) return; _rs.ready.picks[i] = alt;
      li.outerHTML = rescueReadyItemHTML(alt, i); sound('click');
    } else if(act === 'quest'){
      const sec = +b.dataset.sec; let left = sec; b.disabled = true; b.textContent = left + 's';
      const t = setInterval(() => { left--; if(!d.isConnected){ clearInterval(t); return; } b.textContent = left > 0 ? left + 's' : 'time — done?'; if(left <= 0){ clearInterval(t); b.disabled = false; b.onclick = () => { li.querySelector('.rs-tick').click(); b.remove(); }; } }, 1000);
      if(_rs) _rs.timers.push(t);
    } else if(act === 'go'){ s.readyDismissed = true; d.remove(); if(_rs.ready && _rs.ready.done.size) rescueReadyPill(root); const f = root.querySelector('#rsCanvas'); if(f) f.focus(); rescueTouch(s); }
    else if(act === 'mine') rescueReadyMine(d);
  });
  d.querySelector('.rs-ready-x').onclick = () => { s.readyDismissed = true; d.remove(); rescueTouch(s); };
}
/* once the writing has begun, the invitation folds to a small mark of what was done */
function rescueReadyPill(root){
  if(!_rs) return; const s = _rs.sheet, n = (s.ready || []).length; root.querySelectorAll('.rs-ready-pill').forEach(x => x.remove());
  if(!n) return;
  const p = document.createElement('button'); p.className = 'rs-ready-pill'; p.title = 'ready the room again'; p.textContent = `room · ${n} thing${n === 1 ? '' : 's'} done`;
  p.onclick = () => rescueReadyShow(root, true); root.querySelector('#rsStage').parentNode.appendChild(p);
}
function rescueReadyMine(d){
  const c = rescueCareState();
  const m = openModal(`<h2>One of my own</h2><p class="muted sm">Something only you would think to do before a hard hour. It joins the pack and turns up now and then in place of one of the others.</p>
    <input class="inp" id="rcOwn" placeholder="e.g. put on the green lamp, text Mira that I’m offline" maxlength="120">
    ${c.mine.length ? `<div class="rs-bt-l">${c.mine.map(x => `<div class="rs-bt"><span>${esc(x.text)}</span><button class="tbtn danger" data-rmx="${esc(x.id)}">remove</button></div>`).join('')}</div>` : ''}
    <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary" id="rcAdd">Add</button></div>`, 'narrow');
  m.querySelector('#rcAdd').onclick = () => { const t = m.querySelector('#rcOwn').value.trim(); if(!t) return; c.mine.push({id: uid(), text: t}); save(); m.remove(); toast('Added to the pack.'); };
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
