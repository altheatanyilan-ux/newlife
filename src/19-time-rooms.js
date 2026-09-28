/* ============================================================
   THE ROOMS THAT START THE CLOCK.

   Every room that already had a timer keeps its own screen — the breathing
   circle, the card queue, the focus mode over a passage — and the duration
   now runs through the one clock instead of into its own silo. That is the
   whole difference between a tracker that gets used and one that does not:
   you never have to time the same hour twice.

   Two rules hold everywhere.

   NOTHING STARTS A SECOND CLOCK. If a timer is already running when a room
   asks, the room is refused and the hour is counted once. The commonest case
   is the honest one: you started the clock by hand before sitting down, and
   then walked into the room. That is the timing you meant.

   AND NOTHING STOPS A CLOCK IT DID NOT START. A room ending only stops the
   entry it started itself — a hand-started timer is nobody else's to stop.
   ============================================================ */

/* The pomodoro, and every other sitting on a task, through the timer that
   already exists for them. Subscribed rather than wired into its innards:
   the focus timer has four ways in and one place where its state changes.
   What the subscription does — one live clock per part of a sitting, closed
   and corrected by the sitting's own record — is in 19-time-focus.js. */
function timeWatchFocus(){
  if(typeof FocusTimer === 'undefined' || !FocusTimer.subscribe) return;
  FocusTimer.subscribe(() => { try { timeFollowFocus(); } catch(e){ console.warn('the focus clock was not followed', e); } });
  /* and once now, for a sitting carried over from before a reload */
  try { timeFollowFocus(); } catch(e){}
}
/* the small helper the above needs, and the room's own way of finding a task
   is behind four different shapes of reference */
function taskById(id){
  if(typeof allTaskRefs === 'function'){
    const r = allTaskRefs().find(v => v.task && v.task.id === id);
    if(r) return r.task;
  }
  return byId(S.tasks || [], id);
}
