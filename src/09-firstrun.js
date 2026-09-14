/* ============================================================
   THE OPENING QUESTION

   Four things about this house are matters of taste rather than of
   data, and every one of them is wrong for somebody by default:
   whether the rooms are lit or dark, whether the buttons answer when
   pressed, whether there is a sound under the work, and how much of
   the drawing is there at all. They are the four at the top of the
   Atmosphere card in Settings, asked here in the same order and with
   the same words, so that finding them again later is recognising
   them rather than searching.

   Guessing is worse than asking, and asking later is worse than
   asking first — a page that arrives in the wrong theme has already
   made its impression. So on a house nobody has answered for yet,
   this is the first thing on screen.

   Every control takes effect as you touch it. There is no Save: the
   dark option makes the room dark under the dialog, the sound options
   play and stop as you toggle them, because the only honest way to
   choose a sound is to hear it, and turning the decoration off takes
   it off the page behind. "Begin" only closes the door.

   It asks once. The flag lives in S.settings, which resetAll()
   rebuilds from the seed, so clearing all data brings the question
   back with the light theme it defaults to.
   ============================================================ */

function prefsAnswered(){ return !!(S.settings && S.settings.prefsAsked); }

function firstRunRowHTML(key, title, desc, on){
  return `<button class="fr-row${on ? ' on' : ''}" data-fr="${key}" role="switch" aria-checked="${on}">
    <span class="fr-copy"><b>${esc(title)}</b><span class="fr-desc">${esc(desc)}</span></span>
    <span class="fr-switch" aria-hidden="true"><i></i></span>
  </button>`;
}

function openFirstRun(after){
  const snd = SoundManager.state();
  const m = openModal(`<h2 class="entry-h">Before you start</h2>
    <p class="muted" style="font-size:.9rem;margin:-6px 0 16px">Four things that are a matter of taste. All of them are in Settings under <b>Atmosphere</b>, and none of them is permanent.</p>
    <div class="stack fr-stack">
      <div class="fr-themes" role="radiogroup" aria-label="Light or dark">
        ${[['light', 'Light', 'Paper. The default.'], ['dark', 'Dark', 'Ink. Easier at night.']].map(([v, n, d]) => `
          <button class="fr-theme${S.settings.theme === v ? ' on' : ''}" data-frtheme="${v}" role="radio" aria-checked="${S.settings.theme === v}">
            <span class="fr-swatch ${v}"><i></i><i></i><i></i></span>
            <b>${n}</b><span class="fr-desc">${d}</span>
          </button>`).join('')}
      </div>
      ${firstRunRowHTML('clicks', 'Interaction sounds', 'Soft chimes on a click, a low note on moving rooms, a rising pair when something is finished. Made in the browser; nothing is downloaded.', snd.soundEnabled)}
      ${firstRunRowHTML('ambient', 'Ambient background', 'A barely-audible wash of noise under the work, which ducks out of the way of every click.', snd.ambientEnabled)}
      <div class="fr-decor" role="radiogroup" aria-label="Decoration">
        <span class="fr-copy"><b>Decoration</b><span class="fr-desc">The ink painting behind the rooms, the dust in the air, the grain in the paper and the stone in the surfaces. All ornament, all of it costing something to draw.</span></span>
        <div class="decor-pick">${[['full','Full','everything, as drawn'],
          ['essential','Essential','the painting stays; the rest comes off'],
          ['plain','Plain','nothing but the writing']].map(([v, n, why]) =>
          `<button class="${decorMode() === v ? 'on' : ''}" data-frdecor="${v}" role="radio"
            aria-checked="${decorMode() === v}"><b>${n}</b><span>${esc(why)}</span></button>`).join('')}</div>
      </div>
      <div class="row" style="justify-content:flex-end;margin-top:6px">
        <button class="btn primary" id="frGo" style="padding:12px 30px;font-size:1rem">Begin</button>
      </div>
    </div>`, 'narrow');

  /* Not swept away by the navigation that init() has already queued: this
     dialog belongs to the session, not to whichever page loaded first. */
  m.dataset.keep = '1';

  /* Answered the moment it is seen, not the moment it is finished. Someone who
     closes it with Escape has still been asked, and being asked twice is worse
     than keeping whichever defaults they left alone. */
  S.settings.prefsAsked = true;
  saveNow();

  /* Closed by Begin, by the ×, or by Escape — all three land here, and only
     the first one counts, so what follows boot is never run twice. */
  let settled = false;
  const done = () => { if(settled) return; settled = true; if(after) after(); };

  /* the decoration is three choices, so it is three buttons like the theme
     rather than a switch — and like the theme it takes effect as it is
     pressed, because the only honest way to choose it is to watch it go */
  m.querySelectorAll('[data-frdecor]').forEach(b => b.onclick = () => {
    S.settings.decor = b.dataset.frdecor;
    saveNow(); applyDecor();
    m.querySelectorAll('[data-frdecor]').forEach(x => {
      const on = x.dataset.frdecor === decorMode();
      x.classList.toggle('on', on); x.setAttribute('aria-checked', on);
    });
    sound('click');
  });

  m.querySelectorAll('[data-frtheme]').forEach(b => b.onclick = () => {
    S.settings.theme = b.dataset.frtheme;
    saveNow(); applyTheme();
    m.querySelectorAll('[data-frtheme]').forEach(x => {
      const on = x.dataset.frtheme === S.settings.theme;
      x.classList.toggle('on', on); x.setAttribute('aria-checked', on);
    });
    sound('click');
  });

  m.querySelectorAll('[data-fr]').forEach(b => b.onclick = () => {
    const on = !b.classList.contains('on');
    b.classList.toggle('on', on); b.setAttribute('aria-checked', on);
    /* Toggling a sound plays it. Choosing one you cannot hear is guessing.
       Turning the decoration off takes it off the page behind the dialog, for
       the same reason: the only honest way to choose it is to see it go. */
    if(b.dataset.fr === 'ambient') SoundManager.setAmbient(on);
    else SoundManager.setSound(on);
    if(typeof syncSoundButtons === 'function') syncSoundButtons();
  });

  m.querySelector('#frGo').onclick = () => m.remove();
  /* Begin, the ×, the backdrop and Escape all end as the overlay leaving the
     page, so watch for that rather than binding each way out separately. */
  const obs = new MutationObserver(() => { if(!m.isConnected){ obs.disconnect(); done(); } });
  obs.observe(document.getElementById('modals'), {childList: true});
  return m;
}

/* Runs before the starter set and the handoff notice, and holds them until it
   is closed: a stack of toasts under a modal is a stack of toasts nobody
   reads. Everything else about boot is unchanged when there is nothing to ask. */
function maybeAskPreferences(then){
  if(prefsAnswered()){ then(); return; }
  openFirstRun(then);
}
