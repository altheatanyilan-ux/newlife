/* ============================================================
   PLANNING — the shopping list.

   Everything that needs buying, in one place, behind its own button on the
   top line. It is deliberately not one of the lists: a list is a place work
   lives and gets sorted, and "milk" is not work to be prioritised in a
   matrix or dated in a calendar. So a thing to buy is a task with `shop`
   set, kept out of the Inbox and the dated views, and gathered here.

   Two ways onto it: write it here ("milk, eggs, bread" is three things), or
   open any task and tick "on the shopping list" — the drill bits for the
   kitchen shelves stay in the Kitchen list as well, and say where they came
   from here. Ticking a thing off puts it in the basket; clearing the basket
   throws the bought things away.

   A list you made before this existed, called Shopping or Groceries, is
   offered once to be moved in — never moved behind your back.
   ============================================================ */

const planShopItems = () => planOwnTasks().filter(t => t.shop && !t.done)
  .sort((a, b) => (a.order || 0) - (b.order || 0));
const planShopBasket = () => planOwnTasks().filter(t => t.shop && t.done)
  .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
const planShopCount = () => planOwnTasks().filter(t => t.shop && !t.done).length;

/* "milk, eggs; bread" or one to a line: each is a thing to buy */
function planShopSplit(text){
  return String(text || '').split(/[\n,;]+/).map(x => x.trim()).filter(Boolean);
}
function planAddShopItems(text){
  const made = planShopSplit(text).map((item, i) => {
    const t = newPlanTask(item, '', {listId: 'inbox', shop: true});
    t.order = Date.now() + i;
    return t;
  });
  if(!made.length) return [];
  S.tasks = S.tasks || [];
  S.tasks.push(...made);
  saveNow();
  return made;
}
function planSetShop(t, on){
  t.shop = !!on; t.updatedAt = new Date().toISOString();
  saveNow();
  return t.shop;
}
/* a list from before there was a shopping list, by its name */
const PLAN_SHOP_NAMES = /^\s*(shopping(\s+list)?|groceries|grocery(\s+list)?|to\s*buy|things\s+to\s+buy|buy)\s*$/i;
function planShopLikeLists(){
  return planLists().filter(l => l.id !== 'inbox' && PLAN_SHOP_NAMES.test(l.name || '')
    && planOwnTasks().some(t => t.listId === l.id));
}
/* its things onto the shopping list (after what is already there, in their
   own order), and the list itself gone (it is empty) */
function planMoveListToShop(listId){
  const l = planList(listId); if(!l || l.id === 'inbox' || l.projectId) return 0;
  const moved = planOwnTasks().filter(t => t.listId === listId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const base = Date.now();
  moved.forEach((t, i) => { t.shop = true; t.listId = 'inbox'; t.sectionId = null; t.order = base + i;
    t.updatedAt = new Date().toISOString(); });
  const p = planState();
  p.lists = p.lists.filter(x => x.id !== listId);
  saveNow();
  return moved.length;
}
/* the count on the top line's button, redrawn in place when only the body is */
function planShopBadge(){
  const btn = document.querySelector('.pl-shopbtn'); if(!btn) return;
  const n = planShopCount(), b = btn.querySelector('.pl-n');
  if(!n){ if(b) b.remove(); }
  else if(b) b.textContent = n;
  else btn.insertAdjacentHTML('beforeend', `<span class="pl-n mono">${n}</span>`);
  btn.title = `everything that needs buying${n ? ` · ${n} to buy` : ''}`;
}
function planShopText(){
  return planShopItems().map(t => `☐ ${t.text}`).join('\n');
}

function planShopHTML(items){
  /* in the order they were written down, whatever the page's sort says */
  items = items.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const basket = planShopBasket();
  const offer = planShopLikeLists()[0];
  const row = (t, done) => `<div class="pshop-row${done ? ' done' : ''}" data-pshoprow="${esc(t.id)}">
      <button class="pt-box${done ? ' on' : ''}" data-pshopdone="${esc(t.id)}" role="checkbox" aria-checked="${done}"
        aria-label="${done ? 'back on the list' : 'bought'}: ${esc(t.text)}"><svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8.2" class="pt-ring"/><path d="M5.6 10.3 L8.7 13.3 L14.4 6.9" class="pt-tick"/></svg></button>
      <button class="pshop-t" data-pshopopen="${esc(t.id)}" title="open it">${esc(t.text)}</button>
      ${t.listId !== 'inbox' ? `<span class="pt-list" style="--c:${planListColor(t.listId)}" title="also in this list">${esc(planListName(t.listId))}</span>` : ''}
      ${t.day ? `<span class="mono faint pshop-day" title="needed by">${esc(fmtDate(t.day, 'short'))}</span>` : ''}
      <button class="del-x inline" data-pshopdel="${esc(t.id)}" aria-label="take ${esc(t.text)} off the list">×</button>
    </div>`;
  return `<div class="pshop">
    <div class="pshop-add">
      <input class="inp" id="pshopIn" autocomplete="off" aria-label="something to buy"
        placeholder="something to buy — “milk, eggs, bread” adds three">
      <button class="btn sm primary" id="pshopAdd">Add</button>
    </div>
    ${offer ? `<div class="pshop-offer">
      <span>Your list <b>${esc(offer.name)}</b> looks like shopping — ${planOwnTasks().filter(t => t.listId === offer.id && !t.done).length} to buy in it.</span>
      <button class="btn sm" data-pshopmove="${esc(offer.id)}">Move it here</button></div>` : ''}
    ${items.length ? `<div class="pshop-list" data-ptgroup="shop">${items.map(t => row(t, false)).join('')}</div>`
      : `<div class="empty sm pshop-empty">Nothing to buy. Write it here when you notice you are out of it.</div>`}
    ${items.length ? `<div class="pshop-tools">
      <button class="tbtn" id="pshopCopy" title="the list as text, to send to whoever is going">📋 copy the list</button></div>` : ''}
    ${basket.length ? `<div class="pshop-basket">
      <div class="pshop-bh"><span class="sc">In the basket</span><span class="mono faint">${basket.length}</span>
        <span class="grow"></span><button class="tbtn" id="pshopClear" title="throw the bought things away">clear the basket</button></div>
      ${basket.map(t => row(t, true)).join('')}</div>` : ''}
    <p class="faint sm pshop-hint">Any task can go on here too: open it and tick “on the shopping list”. It stays in its own list as well.</p>
  </div>`;
}

function bindPlanShop(root){
  const box = root.querySelector('.pshop'); if(!box) return;
  const input = box.querySelector('#pshopIn');
  const add = () => {
    const made = planAddShopItems(input.value);
    if(!made.length){ input.focus(); return; }
    sound('click');
    S._pshopFocus = true;
    rerender();
  };
  box.querySelector('#pshopAdd').onclick = add;
  input.onkeydown = ev => { if(ev.key === 'Enter' && !ev.shiftKey){ ev.preventDefault(); add(); } };
  /* after adding, the line is ready for the next thing */
  if(S._pshopFocus){ S._pshopFocus = false; setTimeout(() => input.focus(), 0); }
  $$('[data-pshopdone]', box).forEach(b => b.onclick = () => {
    const t = planTaskById(b.dataset.pshopdone); if(!t) return;
    planSetDone(t, !t.done); sound(t.done ? 'success' : 'click'); rerender(); });
  $$('[data-pshopopen]', box).forEach(b => b.onclick = () => openPlanTask(b.dataset.pshopopen));
  $$('[data-pshopdel]', box).forEach(b => b.onclick = () => {
    const t = planTaskById(b.dataset.pshopdel); if(!t) return;
    /* flagged from a real list, it only comes off the shopping list; written
       here, it was only ever a thing to buy, so it goes */
    if(t.listId !== 'inbox') planSetShop(t, false);
    else { S.tasks = S.tasks.filter(x => x.id !== t.id); saveNow(); }
    sound('click'); rerender(); });
  const clear = box.querySelector('#pshopClear');
  if(clear) clear.onclick = () => {
    const bought = planShopBasket();
    bought.filter(t => t.listId !== 'inbox').forEach(t => { t.shop = false; });
    const gone = new Set(bought.filter(t => t.listId === 'inbox').map(t => t.id));
    S.tasks = S.tasks.filter(t => !gone.has(t.id));
    saveNow(); sound('click'); toast(`${bought.length} bought thing${bought.length === 1 ? '' : 's'} cleared.`); rerender(); };
  const copy = box.querySelector('#pshopCopy');
  if(copy) copy.onclick = async () => {
    const txt = planShopText();
    try { await navigator.clipboard.writeText(txt); toast('The list is copied.'); } catch(e){ toast(esc(txt).replace(/\n/g, '<br>'), 8000); } };
  $$('[data-pshopmove]', box).forEach(b => b.onclick = () => {
    const l = planList(b.dataset.pshopmove); if(!l) return;
    const n = planMoveListToShop(l.id);
    sound('success'); toast(`${n} thing${n === 1 ? '' : 's'} moved from “${esc(l.name)}”; the list is gone.`); rerender(); });
}
