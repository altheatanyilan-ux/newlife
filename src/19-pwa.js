/* ============================================================
   INSTALLING THE HOUSE

   Hosted, this becomes an app you can put on a phone's home
   screen: its own icon, no browser chrome, and every page
   available with the phone in aeroplane mode.

   Opened from disk it stays exactly what it was. A file:// page
   cannot register a service worker at all, and asking anyway
   throws into the console on every load, so nothing here runs
   unless the app is being served over http.

   The one thing that does not travel: a browser keeps its
   database per origin, and file:// and https://…  are two
   different origins. The data does not follow the app across.
   That is what the handoff notice below is for — it fires once,
   on a hosted copy that opened to an empty house, and points at
   the import button rather than letting someone furnish the
   place twice and lose a year of entries finding out.
   ============================================================ */

const PWA_OK = location.protocol === 'http:' || location.protocol === 'https:';

function registerServiceWorker(){
  if(!PWA_OK || !('serviceWorker' in navigator)) return;
  /* Registering is deferred past first paint so it never competes with the
     page appearing — but it cannot simply wait for the load event, because
     init() opens the database first and by the time it awaits its way back
     here that event has usually already fired. Waiting for it then is waiting
     for something that will not happen twice. */
  const start = async () => {
    let reg;
    try { reg = await navigator.serviceWorker.register('sw.js', {scope: './'}); }
    catch(e){ console.warn('offline support unavailable', e); return; }

    /* A worker already waiting means a newer build is sitting on disk from a
       previous visit; one that arrives now means the update landed while the
       page was open. Both end in the same offer. */
    if(reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing; if(!w) return;
      w.addEventListener('statechange', () => {
        /* no controller means this is the first install, not an update: there
           is nothing to reload for, the page is already the new version */
        if(w.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(w);
      });
    });

    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if(reloading) return; reloading = true; location.reload();
    });
  };
  if(document.readyState === 'complete') setTimeout(start, 0);
  else addEventListener('load', start, {once: true});
}

function offerUpdate(worker){
  toast('A newer version of the house is ready.', 20000,
    {label: 'reload', fn: () => worker.postMessage({type: 'SKIP_WAITING'})});
}

/* ---------- coming across from the local copy ---------- */
function maybeOfferHandoff(){
  if(!PWA_OK) return;                       // the file on disk is what you are coming *from*
  if(lsGet('handoffSeen', false)) return;
  lsSet('handoffSeen', true);
  if(!houseIsEmpty()) return;               // there is already a life in here; nothing to warn about
  toast('This is a fresh copy — your browser keeps its data per address, so nothing came across from the file on your computer. Export a backup there, then import it here.',
    22000, {label: 'go to Settings', fn: () => navigate('#/settings')});
}
