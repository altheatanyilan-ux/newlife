/* ============================================================
   THE IDENTITY ROOM — People, Values, the Skill Tree and Finance, as four
   tabs of one room.

   A container, and nothing more: each tab calls its room's own route,
   unchanged, into the space under the tab strip, and only one is drawn at a
   time (two of them use the same CSS prefix and document-wide selectors, so
   one at a time is also what keeps them apart). No data moves.

   The old addresses still answer. #/people/<id>, #/values, #/value/<id>,
   #/skills/<id> and #/finance each redirect to the matching tab — replacing
   the history entry rather than adding one, so Back is never caught on a
   redirect. The last tab is remembered.
   ============================================================ */

const IDENTITY_TABS = [
  {id: 'people',  label: 'People',     route: routes.people},
  {id: 'values',  label: 'Values',     route: routes.values, item: routes.value},
  {id: 'skills',  label: 'Skill Tree', route: routes.skills},
  {id: 'finance', label: 'Finance',    route: routes.finance},
];
routes.identity = function(root, params){
  const want = params && params[0];
  const tab = IDENTITY_TABS.find(t => t.id === want) || IDENTITY_TABS.find(t => t.id === (S.settings && S.settings.identityTab)) || IDENTITY_TABS[0];
  if(S.settings && S.settings.identityTab !== tab.id){ S.settings.identityTab = tab.id; save(); }
  const rest = want === tab.id ? params.slice(1) : [];
  root.innerHTML = `<nav class="id-tabs" aria-label="Identity">${IDENTITY_TABS.map(t => `<a href="#/identity/${t.id}" class="${t.id === tab.id ? 'on' : ''}" data-idtab="${t.id}">${t.label}</a>`).join('')}</nav><div class="id-sub" id="idSub"></div>`;
  const sub = root.querySelector('#idSub');
  /* a value's own page is its own route; everything else takes the rest of the address */
  const out = tab.id === 'values' && rest[0] && tab.item ? tab.item(sub, rest) : tab.route(sub, rest);
  /* a room that takes the id out of its address once it has acted on it
     (consumeHashParam) writes its old address back; keep it in the room */
  if(!/^#\/identity\//.test(location.hash)){ try { history.replaceState(history.state, '', location.pathname + location.search + '#/identity/' + tab.id); } catch(e){} }
  return out;
};
/* the old addresses, kept, each pointing at its tab */
function identityRedirect(tab){
  return (root, params) => {
    const tail = (params || []).map(encodeURIComponent).join('/');
    location.replace('#/identity/' + tab + (tail ? '/' + tail : ''));
  };
}
routes.people  = identityRedirect('people');
routes.values  = identityRedirect('values');
routes.value   = identityRedirect('values');
routes.skills  = identityRedirect('skills');
routes.finance = identityRedirect('finance');
/* which of the four is showing, for code that used to ask the route's name */
function identityTabNow(){ const {name, params} = parseHash(); return name === 'identity' ? (params[0] || (S.settings && S.settings.identityTab) || 'people') : name === 'value' ? 'values' : name; }
