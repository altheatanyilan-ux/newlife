/* ============================================================
   ONE LEDGER FOR SKILL PRACTICE

   The house kept two disagreeing counts of practice. The skill page and the
   tree read progress entries in the Lived Record; the clock and the Japanese
   Studio added to a separate field read only by the prompt queue. For a
   system whose measure of the ten-thousand-hour commitment is deliberate
   practice, two counts is one too many.

   Progress entries are the single source of truth. When a sitting on a skill
   closes, a progress entry is OFFERED, prefilled, with one tick to confirm
   (automatic only if the setting is turned on, and the trade-off is stated:
   automatic means the tree warms from tracked time; manual means it warms
   only from time you called practice).

   The old field is migrated by an explicit step with a confirmation: one
   summary entry per skill for the hours that never became an entry, so
   nothing is lost and nothing is counted twice. Then the old field is
   retired from every read path.
   ============================================================ */

const ledgerUnified = () => !!(S.settings && S.settings.ledgerUnified);
const ledgerAuto = () => !!(S.settings && S.settings.skillProgressAuto);
function ledgerProgressFor(e){
  const sk = byId(S.skills || [], e.linkedId);
  const mins = Math.round(timeMinutes(e));
  const day = (typeof timeLivingDay === 'function' ? timeLivingDay(e.startTime) : null) || today();
  const en = lifeEntryNew({type: 'progress', title: e.what || (sk ? sk.name : 'Practice'), body: '', occurredAt: day, tags: [], links: {skills: [e.linkedId]}, extra: {duration: mins, fromTime: e.id}});
  e.progressEntryId = en.id;
  return en;
}
/* called when a sitting closes (timeAfterSave) */
function timeOfferProgress(e){
  if(!e || !e.endTime || e.linkedType !== 'skill' || !e.linkedId || !byId(S.skills || [], e.linkedId)) return;
  const existing = e.progressEntryId ? byId(S.entries, e.progressEntryId) : null;
  if(existing){   /* written once and thereafter corrected, like a nod */
    existing.extra.duration = Math.round(timeMinutes(e));
    existing.occurredAt = (typeof timeLivingDay === 'function' ? timeLivingDay(e.startTime) : null) || existing.occurredAt;
    return;
  }
  if(e.progressOffered) return;
  /* only the sitting that has just ended is offered; an old one edited later is not */
  if(Date.now() - Date.parse(e.endTime) > 20 * 60 * 1000) { e.progressOffered = true; return; }
  e.progressOffered = true;
  const sk = byId(S.skills, e.linkedId), mins = Math.round(timeMinutes(e));
  if(ledgerAuto()){ ledgerProgressFor(e); saveNow(); return; }
  toast(`Log ${mins} min as practice on ${esc(sk.name)}?`, 9000, {label: 'log it', fn: () => { if(!e.progressEntryId){ ledgerProgressFor(e); saveNow(); sound('success'); toast('Logged as practice.'); } }});
}
/* ---------- the migration: explicit, confirmed, reported ---------- */
function ledgerMigrationPlan(){
  return (S.skills || []).map(sk => {
    const legacy = +sk.hours || 0, held = typeof skillHours === 'function' ? skillHours(sk) : 0;
    const residual = Math.round((legacy - held) * 100) / 100;
    return {sk, legacy, held, residual};
  }).filter(x => x.residual > 0.05);
}
function ledgerMigrate(){
  const plan = ledgerMigrationPlan(); let n = 0, hours = 0;
  plan.forEach(({sk, residual}) => {
    lifeEntryNew({type: 'progress', title: 'recovered from tracked time', body: `${residual} hours that were tracked on ${sk.name} and never written as practice.`,
      occurredAt: sk.lastPracticed || today(), tags: ['recovered'], links: {skills: [sk.id]}, extra: {duration: Math.round(residual * 60), recovered: true}});
    n++; hours += residual;
  });
  S.settings.ledgerUnified = true;
  saveNow();
  return {skills: n, hours: Math.round(hours * 10) / 10};
}
function ledgerStripHTML(){
  if(ledgerUnified()) return '';
  const plan = ledgerMigrationPlan();
  return `<section class="section rv lg-strip"><span class="sc">Two counts of practice</span>
    <p class="faint">Practice is counted in two places: progress entries (which the tree and this page read) and a separate tally the clock keeps. They can disagree. ${plan.length ? `${plan.length} skill${plan.length === 1 ? ' has' : 's have'} tracked time that was never written as practice — ${Math.round(sum(plan.map(x => x.residual)) * 10) / 10} hours in all.` : 'Nothing is out of step right now.'}</p>
    <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm primary" id="lgGo">Unify them…</button>
      <label class="row faint" style="gap:6px;align-items:center;font-size:.8rem"><input type="checkbox" id="lgAuto" ${ledgerAuto() ? 'checked' : ''}> log tracked skill time as practice automatically <span title="automatic means the tree warms from tracked time; manual means it warms only from time you called practice">(what does that change?)</span></label></div></section>`;
}
function ledgerStripBind(root){
  const go = root.querySelector('#lgGo'), auto = root.querySelector('#lgAuto');
  if(auto) auto.onchange = () => { S.settings.skillProgressAuto = auto.checked; saveNow(); };
  if(go) go.onclick = () => {
    const plan = ledgerMigrationPlan();
    const m = openModal(`<h2>One count of practice</h2>
      <p class="muted">Progress entries become the single source of truth. For each skill below, one summary entry is written for the hours that never became an entry, dated the day it was last practised, titled “recovered from tracked time”. Nothing is lost and nothing is counted twice. Then the separate tally is no longer read anywhere.</p>
      ${plan.length ? plan.map(x => `<div class="row between mono" style="padding:3px 0"><span>${esc(x.sk.name)}</span><span>${x.residual} h · ${esc(x.sk.lastPracticed || 'today')}</span></div>`).join('') : '<p class="faint">Nothing to recover; the old tally will simply be retired.</p>'}
      <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn ghost" id="lgNo">Not now</button><button class="btn primary" id="lgYes">Do it</button></div>`);
    m.querySelector('#lgNo').onclick = () => m.remove();
    m.querySelector('#lgYes').onclick = () => { const r = ledgerMigrate(); m.remove(); sound('success'); toast(`Done: ${r.skills} skill${r.skills === 1 ? '' : 's'}, ${r.hours} hours recovered.`, 6000); rerender(); };
  };
}
