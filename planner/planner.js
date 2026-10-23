import { DAYS, CARDS } from '../js/data.js';
import { ACTIVITIES, ACT_CARDS } from '../js/activities.js';
const ALLC = { ...CARDS, ...ACT_CARDS };
import * as store from './store.js';
import * as weather from '../js/weather.js';
import { buildDay, MODES, DEFAULT_MODE, BASE, MEAL_OPTIONS, DAY_RULES, resolveMeals, toStr, toMin } from './engine.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const data = { items: [], bookings: [], shopping: [], meta: [] };
const dayById = (id) => DAYS.find((d) => d.id === id);
const ICONS = { swim: '🏊', nap: '😴', meal: '🍽️', show: '🎭', travel: '🚗', activity: '🎨', outing: '🌳', fixed: '🏨', added: '⭐' };
let knockNote = '';

function londonDate() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return p.year + '-' + p.month + '-' + p.day;
}
function todayDay() {
  const d = londonDate();
  if (d <= DAYS[0].date) return DAYS[0];
  if (d >= DAYS[DAYS.length - 1].date) return DAYS[DAYS.length - 1];
  return DAYS.find((x) => x.date === d) || DAYS[0];
}

// ---- day settings, synced through meta/plan-<day> ----
const parse = (s, f) => { try { return s ? JSON.parse(s) : f; } catch (e) { return f; } };
function getPlan(dayId) {
  const m = data.meta.find((x) => x.id === 'plan-' + dayId) || {};
  return { meals: parse(m.meals, null), swims: parse(m.swims, {}), overrides: parse(m.overrides, {}) };
}
const mealsOf = (dayId, plan = getPlan(dayId)) => resolveMeals(dayId, { meals: plan.meals });
function savePlan(dayId, plan) {
  const row = { meals: JSON.stringify(plan.meals), swims: JSON.stringify(plan.swims), overrides: JSON.stringify(plan.overrides) };
  store.set('meta', 'plan-' + dayId, { ...row, order: 1 });
  const i = data.meta.findIndex((x) => x.id === 'plan-' + dayId);
  if (i >= 0) data.meta[i] = { ...data.meta[i], ...row }; else data.meta.push({ id: 'plan-' + dayId, ...row });
}
const compute = (dayId, plan = getPlan(dayId)) => buildDay({ dayId, meals: plan.meals, swims: plan.swims, overrides: plan.overrides, items: data.items.filter((i) => i.day === dayId) });

// ---- knock-on effects: shopping and bookings follow the meal plan. Rows are flagged, never deleted. ----
function ensureRow(coll, id, active, fields, flagText) {
  const ex = data[coll].find((r) => r.id === id);
  if (active) {
    if (!ex) { store.set(coll, id, { ...fields, order: Date.now() }); return fields.name + ' added to ' + (coll === 'shopping' ? 'the shopping list' : 'bookings'); }
    if (ex.name !== fields.name || ex.notes !== fields.notes) { store.set(coll, id, { name: fields.name, ...(fields.notes !== undefined ? { notes: fields.notes } : {}), ...(fields.time !== undefined ? { day: fields.day, time: fields.time } : {}) }); }
  } else if (ex && !String(ex.name).includes(flagText)) {
    store.set(coll, id, { name: ex.name + ' ' + flagText }); return ex.name + ' flagged: no longer planned';
  }
  return '';
}
function reconcile(dayId, plan) {
  const d = dayById(dayId), r = compute(dayId, plan), notes = [];
  const flag = '(no longer planned: check)';
  const ent = (k) => r.entries.find((e) => e.key === k);
  const tm = (k) => (ent(k) ? toStr(ent(k).start) : '');
  const m = r.meals;
  const shop = (id, active, name) => notes.push(ensureRow('shopping', id, active, { name, aisle: 'Meal plan', done: false }, flag));
  const book = (id, active, name, notesText, time) => notes.push(ensureRow('bookings', id, active, { name, day: dayId, time, bookBy: 'Before the day', booked: false, notes: notesText }, flag));
  shop('kn-bf-' + dayId, m.breakfast === 'lodge', 'Lodge breakfast ' + d.short + ': cereal or toast, fruit, yoghurt, milk');
  shop('kn-bfk-' + dayId, m.breakfast === 'lodge' && m.splitB, 'Kids\' breakfast ' + d.short + ': toddler cereal or fruit pots, 4 year old\'s favourites');
  shop('kn-lunch-' + dayId, m.lunch === 'lodge', (m.splitL ? 'Adults\' lunch ' : 'Lodge lunch ') + d.short + ': bread, ham, cheese, fruit, yoghurts');
  shop('kn-lunchk-' + dayId, m.splitL, 'Kids\' lunch ' + d.short + ': sandwiches, fruit, yoghurt, easy finger food');
  shop('kn-supper-' + dayId, m.dinner === 'lodge', 'Lodge supper ' + d.short + ': salmon and pasta, or French stick with cheese and ham');
  shop('kn-supperk-' + dayId, m.dinner === 'lodge' && m.splitD, 'Kids\' supper ' + d.short + ': pasta, peas, fruit');
  const lunchVenue = { sat: 'Gunwharf Quays: see the Quays tab', sun: 'The Ropemaker 01243 373363', wed: 'Ferryboat Inn: ring first' }[dayId] || 'choose a venue';
  book('kn-bkbf-' + dayId, m.breakfast === 'clubhouse', 'Check clubhouse breakfast (' + d.short + ')', 'Times and prices: Unverified. Ask Guest Services 02392 460044', tm('breakfast'));
  book('kn-bklunch-' + dayId, m.lunch === 'out' && dayId !== 'sat', (m.splitL ? 'Book table: adults\' lunch out (' : 'Book table: big lunch out (') + d.short + ')', lunchVenue, tm('lunch'));
  book('kn-bklsite-' + dayId, m.lunch === 'site', 'Book on-site lunch (' + d.short + ')', 'Green Room or Missing Squirrel. Guest Services 02392 460044', tm('lunch'));
  book('kn-bkdinner-' + dayId, m.dinner === 'out', 'Book table: nice dinner out (' + d.short + ')', { tue: 'Waterside first choice: book online or 023 9246 5011' }[dayId] || 'choose a venue', tm('dinner'));
  book('kn-bksite-' + dayId, m.dinner === 'site', 'Book Green Room or Missing Squirrel (' + d.short + ')', 'Guest Services 02392 460044', tm('dinner'));
  for (const it of data.items.filter((i) => i.day === dayId && i.kind !== 'show' && i.booked)) {
    notes.push(ensureRow('bookings', 'kn-item-' + it.id, true, { name: it.name, day: dayId, time: it.time, bookBy: '', booked: true, notes: 'Added in the Planner' }, flag));
  }
  for (const b of data.bookings.filter((x) => x.id.startsWith('kn-item-') && x.day === dayId)) {
    if (!data.items.some((i) => 'kn-item-' + i.id === b.id)) notes.push(ensureRow('bookings', b.id, false, {}, flag));
  }
  const fresh = notes.filter(Boolean).filter((n) => !knockNote.includes(n));
  knockNote = [knockNote, ...fresh].filter(Boolean).join('. ');
}

// ---- views ----
function weatherHero(day) {
  const w = weather.forDay(day.date);
  const wx = w ? '<div class="hero-wx"><span class="hero-ico">' + weather.iconFor(w.code) + '</span><div class="hero-temp">' + w.hi + '°<small> / ' + w.lo + '°</small></div><div class="hero-meta"><b>' + esc(w.summary) + '</b><br>Rain up to ' + w.rain + '%' + (w.rain >= 60 ? ': rain swap day' : '') + '<br>Gusts ' + w.gust + ' mph</div></div>' : '';
  return '<section class="hero" style="padding-bottom:22px"><div class="eyebrow">Plan for the day</div><h1>' + esc(day.long) + '</h1><p>' + esc(day.theme) + '</p>' + wx + '</section>';
}

function entryRow(e, plan, i) {
  const sk = e.kind === 'show';
  const tags = [e.fixed ? '<span class="tag fx">Fixed</span>' : '', e.handSet ? '<span class="tag hand">Set by hand</span>' : '', e.booked ? '<span class="tag">Booked</span>' : '', e.optional ? '<span class="tag skip">Optional</span>' : ''].filter(Boolean).join(' ');
  const movable = /^(breakfast|lunch|dinner)(-kids)?$|^nap$/.test(e.key);
  const act = [];
  if (movable) act.push('<button class="mini" data-act="hand" data-key="' + e.key + '">Set time</button>');
  if (movable && e.handSet) act.push('<button class="mini" data-act="undo" data-key="' + e.key + '">Undo</button>');
  if (e.itemId) act.push('<button class="mini" data-act="edit-item" data-id="' + e.itemId + '">Edit</button>');
  if (sk && e.itemId) act.push('<button class="mini" data-act="toggle-go" data-id="' + e.itemId + '">Skip</button>');
  if (e.card) act.push('<a class="more" href="../#card/' + e.card + '">Details</a>');
  return '<li class="k-' + e.kind + (e.optional ? ' k-optional' : '') + '" style="--i:' + i + '"><div class="t">' + toStr(e.start) + '</div><div class="dot"><span>' + (ICONS[e.kind] || '•') + '</span></div><div class="b"><b>' + esc(e.title) + '</b> ' + tags + (e.note ? '<div class="muted">' + esc(e.note) + '</div>' : '') + (act.length ? '<div class="acts">' + act.join('') + '</div>' : '') + '</div></li>';
}

function viewDay(day) {
  const plan = getPlan(day.id), r = compute(day.id, plan);
  const M = mealsOf(day.id, plan), rl = DAY_RULES[day.id] || {};
  const row = (letter, title, on) => '<div class="card mealcard"><div class="mealhead"><b>' + title + '</b>' + (on === false ? '' : '<label class="splitsw"><span>Split kids and adults</span><input type="checkbox" class="toggle" data-act="split" data-letter="' + letter + '"' + (M['split' + letter.toUpperCase()] ? ' checked' : '') + '></label>') + '</div>' +
    (on === false ? '<p class="muted" style="margin:6px 0 0">' + (letter === 'b' ? 'Breakfast at home before you leave.' : 'No dinner here: you are on the road home.') + '</p>' : '<div class="seg3">' + MEAL_OPTIONS[letter].map(([v, l]) => '<button data-act="meal" data-letter="' + letter + '" data-val="' + v + '" class="' + (M[letter] === v ? 'on' : '') + '">' + l + '</button>').join('') + '</div>') + '</div>';
  const presets = '<div class="chips2">' + [1, 2, 3, 4].map((n) => '<button class="chip" data-act="preset" data-n="' + n + '">' + esc(MODES[n].label) + '</button>').join('') + '</div>';
  const modes = '<h2 style="margin-top:6px">Meals</h2>' + row('b', 'Breakfast', rl.breakfast === false ? false : undefined) + row('l', 'Lunch') + row('d', 'Dinner', rl.dinner === false ? false : undefined) + '<p class="muted tiny" style="margin:6px 0 2px">Quick presets for lunch and dinner:</p>' + presets;
  const swimsDef = (BASE[day.id] || []).filter((a) => a.toggle);
  const swimSw = swimsDef.length ? '<div class="card"><h3 style="margin-top:0">Swims</h3>' + swimsDef.map((s) => '<label class="sw"><span><b>Swim at ' + s.t + '</b><br><span class="muted tiny">Booked. Arrive ' + toStr(toMin(s.t) - 20) + '. 20 minutes to change before and after.</span></span><input type="checkbox" class="toggle" data-act="swim" data-id="' + s.id + '"' + (plan.swims[s.id] === false ? '' : ' checked') + '></label>').join('') + '</div>' : '';
  const warns = r.warnings.map((w) => '<li class="' + w.level + '">' + esc(w.text) + '</li>').concat(r.reminders.map((t) => '<li class="rem">' + esc(t) + '</li>')).join('');
  const skipped = data.items.filter((i) => i.day === day.id && i.kind === 'show' && !i.go);
  const wet = (weather.forDay(day.date)?.rain ?? 0) >= 60;
  const ideas = (win) => ACTIVITIES.filter((a) => a.kid4 === 'yes' && a.toddler !== 'no' && a.min <= win && (a.where === 'site' || a.min + 60 <= win) && !(wet && a.indoor === 'outdoor') && !a.id.startsWith('g-cinema') && a.id !== 'pool').sort((a, b) => (a.toddler === 'yes' ? 0 : 1) - (b.toddler === 'yes' ? 0 : 1) || b.min - a.min).slice(0, 5);
  const freeHtml = r.free.length ? '<h2>Free time</h2><p class="muted tiny" style="margin-top:-4px">' + (wet ? 'Rain likely, so outdoor ideas are hidden. ' : '') + 'Ideas that fit the gap. Off-site ideas leave room for the drive. Full list: Things to do in the Holiday app.</p>' + r.free.map((f) => { const win = f.end - f.start; return '<div class="card free"><b>' + toStr(f.start) + ' to ' + toStr(f.end) + '</b> <span class="muted">' + win + ' min free</span><div class="chips">' + ideas(win).map((a) => '<button data-act="suggest" data-card="' + a.id + '" data-t="' + toStr(f.start) + '" data-win="' + win + '">+ ' + esc(ALLC[a.id].name) + ' <small>' + a.min + (a.max !== a.min ? ' to ' + a.max : '') + ' min</small></button>').join('') + '<button data-act="add-item" data-t="' + toStr(f.start) + '">+ Add your own</button></div></div>'; }).join('') : '';
  const strip = '<nav class="days">' + DAYS.map((d) => '<a href="#' + d.id + '"' + (d.id === day.id ? ' class="on"' : '') + '>' + d.short + '</a>').join('') + '</nav>';
  return strip + weatherHero(day) +
    modes + swimSw +
    (warns ? '<ul class="warns">' + warns + '</ul>' : '') +
    (knockNote ? '<p class="knock">Updated: ' + esc(knockNote) + '.</p>' : '') +
    '<h2>Timeline</h2><ul class="timeline">' + r.entries.map((e, i) => entryRow(e, plan, i)).join('') + '</ul>' +
    '<button class="btn" data-act="add-item" data-day="' + day.id + '">Add an activity</button>' +
    (skipped.length ? '<h2>Skipped shows</h2>' + skipped.map((s) => '<div class="card"><b>' + esc(s.name) + '</b> <span class="muted">' + esc(s.time) + '</span> <button class="mini" data-act="toggle-go" data-id="' + s.id + '">Go</button></div>').join('') : '') +
    freeHtml;
}

function render() {
  const route = (location.hash || '#today').slice(1);
  const day = dayById(route) || todayDay();
  const v = $('#view'), y = scrollY;
  v.innerHTML = viewDay(day);
  scrollTo(0, y);
  const s = $('#status');
  s.textContent = store.mode === 'shared' ? (navigator.onLine ? 'Shared' : 'Offline: syncs later') : 'Local only';
  s.className = 'status ' + (store.mode === 'shared' && navigator.onLine ? 'ok' : 'warn');
}

// ---- forms ----
function openForm(title, fields, values, onSave, onDelete) {
  const dlg = $('#dlg');
  dlg.innerHTML = '<form method="dialog"><h2>' + esc(title) + '</h2>' + fields.map((f) => {
    const v = values[f.n] ?? '';
    if (f.type === 'check') return '<label class="chk"><input type="checkbox" name="' + f.n + '"' + (v ? ' checked' : '') + '> ' + esc(f.l) + '</label>';
    if (f.type === 'select') return '<label>' + esc(f.l) + '<select name="' + f.n + '">' + f.opts.map(([val, lab]) => '<option value="' + esc(val) + '"' + (val === v ? ' selected' : '') + '>' + esc(lab) + '</option>').join('') + '</select></label>';
    return '<label>' + esc(f.l) + '<input name="' + f.n + '" type="' + (f.type || 'text') + '" value="' + esc(v) + '"' + (f.req ? ' required' : '') + (f.type === 'number' ? ' min="5" step="5"' : '') + '></label>';
  }).join('') + '<div class="row"><button value="cancel" class="btn ghost" formnovalidate>Cancel</button>' + (onDelete ? '<button type="button" class="btn del" id="dlgdel">Delete</button>' : '') + '<button value="ok" class="btn">Save</button></div></form>';
  const form = dlg.querySelector('form');
  form.addEventListener('submit', (ev) => {
    if (ev.submitter && ev.submitter.value !== 'ok') return;
    const out = {}; fields.forEach((f) => { const el = form.elements[f.n]; out[f.n] = f.type === 'check' ? el.checked : f.type === 'number' ? (el.value ? +el.value : 0) : el.value.trim(); });
    onSave(out);
  });
  if (onDelete) dlg.querySelector('#dlgdel').addEventListener('click', () => { if (confirm('Delete this?')) { onDelete(); dlg.close(); } });
  dlg.showModal();
}
const dayOpts = DAYS.map((d) => [d.id, d.short]);
const itemFields = [{ n: 'name', l: 'Name', req: true }, { n: 'day', l: 'Day', type: 'select', opts: dayOpts }, { n: 'time', l: 'Start time', type: 'time', req: true }, { n: 'dur', l: 'Duration (minutes)', type: 'number' }, { n: 'place', l: 'Place (on site, an address or a Maps link)' }, { n: 'who', l: 'Who is it for', type: 'select', opts: [['Whole family', 'Whole family'], ['4 year old', '4 year old'], ['Toddler', 'Toddler']] }, { n: 'booked', l: 'Booked', type: 'check' }, { n: 'cost', l: 'Cost (optional)' }, { n: 'notes', l: 'Notes' }];

// reconcile after the change has come back through the sync listener, so new items are visible to it
function afterChange(dayId, plan) { render(); setTimeout(() => { reconcile(dayId, plan || getPlan(dayId)); render(); }, store.mode === 'shared' ? 700 : 50); }
function currentDay() { return dayById((location.hash || '#today').slice(1)) || todayDay(); }

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]'); if (!el) return;
  const act = el.dataset.act, day = currentDay();
  if (act === 'meal') { const p = getPlan(day.id), M = mealsOf(day.id, p); p.meals = { ...M, [el.dataset.letter]: el.dataset.val }; savePlan(day.id, p); afterChange(day.id, p); }
  else if (act === 'split') { const p = getPlan(day.id), M = mealsOf(day.id, p), k = 'split' + el.dataset.letter.toUpperCase(); p.meals = { ...M, [k]: !M[k] }; savePlan(day.id, p); afterChange(day.id, p); }
  else if (act === 'preset') { const p = getPlan(day.id), M = mealsOf(day.id, p), pr = MODES[+el.dataset.n]; p.meals = { ...M, l: pr.l, d: (DAY_RULES[day.id] || {}).dinner === false ? null : pr.d }; savePlan(day.id, p); afterChange(day.id, p); }
  else if (act === 'hand') {
    const p = getPlan(day.id), k = el.dataset.key, r = compute(day.id, p), e = r.entries.find((x) => x.key === k);
    const fields = [{ n: 't', l: 'Start time', type: 'time', req: true }]; if (k === 'nap') fields.push({ n: 'loc', l: 'Nap location', type: 'select', opts: [['Lodge', 'Lodge'], ['Pushchair', 'Pushchair'], ['Car', 'Car']] });
    openForm('Set by hand', fields, { t: toStr(e.start), loc: e.loc || 'Lodge' }, (v) => { p.overrides[k] = k === 'nap' ? { t: v.t, loc: v.loc } : { t: v.t }; savePlan(day.id, p); afterChange(day.id, p); });
  }
  else if (act === 'undo') { const p = getPlan(day.id); delete p.overrides[el.dataset.key]; savePlan(day.id, p); afterChange(day.id, p); }
  else if (act === 'swim') { const p = getPlan(day.id); p.swims[el.dataset.id] = el.checked; savePlan(day.id, p); afterChange(day.id, p); }
  else if (act === 'toggle-go') { const it = data.items.find((x) => x.id === el.dataset.id); store.set('items', it.id, { go: !it.go }); it.go = !it.go; afterChange(it.day); }
  else if (act === 'add-item') openForm('Add an activity', itemFields, { day: el.dataset.day || day.id, time: el.dataset.t || '', dur: 45, place: 'On site', who: 'Whole family' }, (v) => { store.add('items', { ...v, kind: 'added', go: true }); afterChange(v.day); });
  else if (act === 'suggest') { const c = ALLC[el.dataset.card], ac = ACTIVITIES.find((x) => x.id === el.dataset.card), win = +el.dataset.win || 60; openForm('Add to day', itemFields, { name: c.name, day: day.id, time: el.dataset.t, dur: Math.max(15, Math.floor(Math.min(ac ? ac.max : 60, win) / 5) * 5), place: c.place === 'Mill Rythe Coastal Village, Havant Road, Hayling Island PO11 0PB' ? 'On site' : c.place, who: 'Whole family', notes: '' }, (v) => { store.add('items', { ...v, kind: 'added', go: true }); afterChange(v.day); }); }
  else if (act === 'edit-item') { const it = data.items.find((x) => x.id === el.dataset.id); openForm('Edit', itemFields, it, (v) => { store.set('items', it.id, v); Object.assign(it, v); afterChange(v.day); }, () => { store.remove('items', it.id); data.items = data.items.filter((x) => x.id !== it.id); afterChange(it.day); }); }
});

// ---- boot ----
let q = false;
const rerender = () => { if (q) return; q = true; requestAnimationFrame(() => { q = false; if (!$('#dlg').open) render(); }); };
window.addEventListener('hashchange', () => { knockNote = ''; scrollTo(0, 0); render(); });
window.addEventListener('online', rerender); window.addEventListener('offline', rerender);
(async function boot() {
  render();
  await store.init();
  ['items', 'bookings', 'shopping', 'meta'].forEach((c) => store.subscribe(c, (rows) => { data[c] = rows; rerender(); }));
  render();
  weather.refresh().then(rerender);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js').catch(() => {});
})();
