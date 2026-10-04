/* ============================================================
   NUDGES — one active nudge at a time.

   nudgeQueue(T) returns an array of nudge objects, ordered so
   the caller shows queue[0] and badges on queue.length-1.
   Each entry: { id, msg, why, action, actionLabel,
                 canSnoozePermanent }

   Dismissal is persisted in S.nudgeDismiss so it survives
   reloads. Three levels:
     snooze      – hide for 30 minutes
     not today   – hide for the rest of today
     permanent   – never show again (user sets in settings too)
   ============================================================ */

function nudgeQueue(T){
  const nd = S.nudgeDismiss || {};
  const sett = S.settings || {};
  const nowMs = Date.now();
  const nowStr = (function(){ const d=new Date(); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); })();
  const out = [];
  const disabled = sett.nudgeDisabled || {};

  const suppressed = id => {
    if(disabled[id]) return true;
    const d = nd[id]; if(!d) return false;
    if(d.permanent) return true;
    if(d.until && new Date(d.until) > new Date()) return true;
    return false;
  };

  /* 4. close-day: after wind-down time, evening flow not done */
  if(!suppressed('close-day')){
    const sleepAt = sett.sleepPromptAt || '22:00';
    if(sleepAt && nowStr >= sleepAt){
      const c = typeof checkin === 'function' ? checkin(T) : null;
      if(!(c && c.eveningFlowAt)){
        const gaps = ['evening review'];
        const tmRow = typeof dayPlan === 'function' ? dayPlan(addDays(T, 1)) : null;
        if(tmRow && !tmRow.why && !tmRow.intentions?.some(Boolean)) gaps.push('tomorrow not planned');
        out.push({id:'close-day',
          msg: 'Time to wind down — ' + gaps.join(', ') + '.',
          why: `It is past ${sleepAt}`,
          action: () => { if(typeof flowEvening === 'function') flowEvening(); },
          actionLabel: 'Start evening flow',
          canSnoozePermanent: false});
      }
    }
  }

  /* 1. clock-idle: timer not running during waking hours, last sitting > N mins ago */
  if(!suppressed('clock-idle')){
    const nudgeMins = sett.trackingNudgeMinutes != null ? +sett.trackingNudgeMinutes : 45;
    const wakeStr = sett.wakeTime || '07:00';
    const sleepStr = sett.sleepPromptAt || '22:00';
    if(nudgeMins > 0 && !document.hidden && nowStr >= wakeStr && nowStr < sleepStr){
      const timerRunning = typeof FocusTimer !== 'undefined' && FocusTimer.state().running;
      if(!timerRunning){
        const sessions = typeof focusSessions === 'function' ? focusSessions() : [];
        const lastEnd = sessions.filter(s => s.endedAt).map(s => s.endedAt).sort().pop();
        const minsAgo = lastEnd ? Math.round((nowMs - new Date(lastEnd).getTime()) / 60000) : Infinity;
        if(minsAgo >= nudgeMins){
          const sinceStr = minsAgo === Infinity ? 'no sittings yet today' : `${minsAgo}m since the last one`;
          out.push({id:'clock-idle',
            msg: 'Nothing being tracked right now.',
            why: sinceStr,
            action: () => { if(typeof navigate === 'function') navigate('#/today/time'); else location.hash = '#/today/time'; },
            actionLabel: 'Start sitting',
            canSnoozePermanent: false});
        }
      }
    }
  }

  /* 3. wake-unlogged: 1h after wake time and no wake entry logged */
  if(!suppressed('wake-unlogged')){
    const wakeStr = sett.wakeTime || '07:00';
    const [wh, wm] = wakeStr.split(':').map(Number);
    const nowMin = parseInt(nowStr.slice(0,2))*60 + parseInt(nowStr.slice(3));
    if(nowMin >= wh*60 + wm + 60){
      const c = typeof checkin === 'function' ? checkin(T) : null;
      if(!(c && c.wakeAt)){
        out.push({id:'wake-unlogged',
          msg: 'Wake time not yet recorded.',
          why: `Over an hour past ${wakeStr}`,
          action: () => { if(typeof openMorningGreeting === 'function') openMorningGreeting(); },
          actionLabel: 'Log wake',
          canSnoozePermanent: true});
      }
    }
  }

  return out;
}

function nudgeSnooze(id){
  const nd = S.nudgeDismiss = S.nudgeDismiss || {};
  nd[id] = {until: new Date(Date.now() + 30*60*1000).toISOString(), permanent: false};
  saveNow();
}
function nudgeNotToday(id){
  const nd = S.nudgeDismiss = S.nudgeDismiss || {};
  /* hide until the start of tomorrow */
  const tom = parseDay ? parseDay(addDays(today(), 1)) : new Date(new Date().setHours(24,0,0,0));
  nd[id] = {until: tom.toISOString(), permanent: false};
  saveNow();
}
function nudgePermDismiss(id){
  const nd = S.nudgeDismiss = S.nudgeDismiss || {};
  nd[id] = {until: null, permanent: true};
  saveNow();
}
