/* smoke263 — every kind of record has an Additional box.

   The claims.

   A PLACE FOR WHAT HAS NO BOX. Every journal entry type, a Library work,
   a person, a skill, a project, a habit, a task, a value and a timeline
   chapter has a box called "Additional". What is typed there is kept on
   the record (entries under extra.additional, the rest as .additional),
   and an entry's read-out shows it.

   Run: NODE_PATH=node_modules node smoke263.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport: {width: 1280, height: 900}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const closeAll = () => p.evaluate(() => { try { closeModals(); } catch(e){} try { closePanel({keep: true}); } catch(e){} });
  /* type into the Additional inline editor in `root` and blur it */
  const typeAdd = async (root, text) => {
    const sel = `${root} .add-sec .ed`;
    const n = await p.$(sel); if(!n) return false;
    await n.scrollIntoViewIfNeeded(); await n.click(); await p.waitForTimeout(100);
    await p.keyboard.type(text); await p.evaluate(() => document.activeElement && document.activeElement.blur()); await p.waitForTimeout(200);
    return true;
  };

  console.log('\n1. the journal');
  await p.evaluate(() => openEntryModal({type: 'dream'})); await p.waitForTimeout(300);
  yes('the entry dialog has an Additional box', !!(await p.$('.modal [data-x="additional"]')));
  await p.fill('#eTitle', 'Salt house'); await p.fill('#eBody', 'A house made of salt.');
  await p.fill('.modal [data-x="additional"]', 'Colour: pale green');
  await p.click('#eSave'); await p.waitForTimeout(400);
  const E = await p.evaluate(() => { const e = S.entries.find(x => x.title === 'Salt house'); return e && {add: e.extra.additional, id: e.id}; });
  is('  it is kept on the entry', E && E.add, 'Colour: pale green');
  const R = await p.evaluate(id => entryExtraHTML(byId(S.entries, id)), E.id);
  yes('  and the read-out shows it', /add-read/.test(R) && /pale green/.test(R), R.slice(0, 200));
  await closeAll();
  const types = await p.evaluate(() => ENTRY_TYPES.map(t => t[0]));
  const all = [];
  for(const t of types){ await p.evaluate(t => openEntryModal({type: t}), t); await p.waitForTimeout(80);
    if(!(await p.$('.modal [data-x="additional"]'))) all.push(t); await closeAll(); }
  yes(`  on every type (${types.length})`, !all.length, all);

  console.log('\n2. the Library, and the rooms');
  const ids = await p.evaluate(() => {
    const w = {id: uid(), type: 'media', title: 'The Waves', body: '', occurredAt: today(), createdAt: new Date().toISOString(), media: [],
      links: {stages: [], substages: [], threads: [], values: [], visions: [], skills: [], projects: [], people: []}, people: [], places: [], emotions: [], tags: [], extra: {kind: 'book', status: 'finished'}};
    S.entries.push(w);
    if(!S.people.length) S.people.push({id: uid(), name: 'Ada', circle: 'inner', relationship: 'friend'});
    if(!S.skills.length) S.skills.push({id: uid(), name: 'Drawing', category: 'craft'});
    if(!S.projects.length) S.projects.push({id: uid(), name: 'A garden', status: 'active'});
    saveNow();
    return {w: w.id, person: S.people[0].id, skill: S.skills[0].id, project: S.projects[0].id, value: S.valueOrder[0] || (S.values[0] || {}).id, stage: (S.stages[0] || {}).id};
  });
  await p.evaluate(() => { vmSet('media', 'wv'); vmSet('skill', 'wv'); });
  await p.evaluate(id => openMediaPanel(id), ids.w); await p.waitForTimeout(300);
  yes('a Library work', await typeAdd('#panel', 'Read on the train'), 'no box');
  is('  kept on the work', await p.evaluate(id => byId(S.entries, id).extra.additional, ids.w), 'Read on the train');
  await closeAll();
  const room = async (name, hash, get, text) => {
    await p.evaluate(h => { location.hash = h; }, hash); await p.waitForTimeout(700);
    const did = await typeAdd('body', text);
    const v = await p.evaluate(get);
    yes(`${name}`, did && v === text, [did, v]);
  };
  await room('a person', `#/people/${ids.person}`, `byId(S.people, '${ids.person}').additional`, 'Met at the lake');
  await room('a skill', `#/skills/${ids.skill}`, `byId(S.skills, '${ids.skill}').additional`, 'Charcoal first');
  await room('a project', `#/projects/${ids.project}`, `byId(S.projects, '${ids.project}').additional`, 'South-facing');
  if(ids.value) await room('a value', `#/value/${ids.value}`, `byId(S.values, '${ids.value}').additional`, 'Since school');
  if(ids.stage) await room('a timeline chapter', `#/stage/${ids.stage}`, `byId(S.stages, '${ids.stage}').additional`, 'The flat on Hill St');

  console.log('\n3. Planning');
  const tid = await p.evaluate(() => { const t = newPlanTask('Buy seeds', '', {listId: 'inbox'}); S.tasks.push(t); saveNow(); openPlanTask(t.id); return t.id; });
  await p.waitForTimeout(300);
  yes('a task has the box', !!(await p.$('#pdAdd')));
  await p.fill('#pdAdd', 'Heirloom only'); await p.waitForTimeout(700);
  is('  kept on the task', await p.evaluate(id => planTaskById(id).additional, tid), 'Heirloom only');
  await closeAll();
  const hid = await p.evaluate(() => { const h = S.habits && S.habits[0]; if(!h) return null; openHabitPanel(h.id); return h.id; });
  if(hid){ await p.waitForTimeout(300);
    await p.evaluate(() => document.querySelectorAll('#panel details').forEach(d => d.open = true));
    yes('a habit', await typeAdd('#panel', 'Before coffee'), 'no box');
    is('  kept on the habit', await p.evaluate(id => byId(S.habits, id).additional, hid), 'Before coffee');
  } else no('a habit', 'no habit to open');

  is('no page errors', errs, []);
  console.log(`\n${bad ? bad + ' FAILED' : 'all good'}`);
  await b.close(); process.exit(bad ? 1 : 0);
})();
