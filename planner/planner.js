import { DAYS, CARDS } from '../js/data.js';
import * as store from './store.js';
import * as weather from '../js/weather.js';
import { buildDay, MODES, DEFAULT_MODE, BASE, toStr, toMin } from './engine.js';

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
  return { mode: Number(m.mode) || DEFAULT_MODE[dayId], swims: parse(m.swims, {}), overrides: parse(m.overrides, {}) };
}
function savePlan(dayId, plan) {
  store.set('meta', 'plan-' + dayId, { mode: plan.mode, swims: JSON.stringify(plan.swims), overrides: JSON.stringify(plan.overrides), order: 1 });
  const i = data.meta.findIndex((x) => x.id === 'plan-' + dayId);
  const row = { id: 'plan-' + dayId, mode: plan.mode, swims: JSON.stringify(plan.swims), overrides: JSON.stringify(plan.overrides) };
  if (i >= 0) data.meta[i] = { ...data.meta[i], ...row }; else data.meta.push(row);
}
const compute = (dayId, plan = getPlan(dayId)) => buildDay({ dayId, mode: plan.mode, swims: plan.swims, overrides: plan.overrides, items: data.items.filter((i) => i.day === dayId) });

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
  const L = r.meals.lunch, Dn = r.meals.dinner;
  notes.push(ensureRow('shopping', 'kn-lunch-' + dayId, L === 'lodge', { name: 'Lodge lunch ' + d.short + ': bread, ham, cheese, fruit, yoghurts', aisle: 'Meal plan', done: false }, flag));
  notes.push(ensureRow('shopping', 'kn-supper-' + dayId, Dn === 'lodge', { name: 'Lodge supper ' + d.short + ': salmon and pasta, or French stick with cheese and ham', aisle: 'Meal plan', done: false }, flag));
  const lunchVenue = { sun: 'The Ropemaker 01243 373363', wed: 'Ferryboat Inn: ring first' }[dayId] || 'choose a venue';
  const dinnerVenue = { tue: 'Waterside first choice: book online or 023 9246 5011' }[dayId] || 'choose a venue';
  notes.push(ensureRow('bookings', 'kn-bklunch-' + dayId, L === 'out', { name: 'Book table: big lunch out (' + d.short + ')', day: dayId, time: ent('lunch') ? toStr(ent('lunch').start) : '', bookBy: 'Before the day', booked: false, notes: lunchVenue }, flag));
  notes.push(ensureRow('bookings', 'kn-bkdinner-' + dayId, Dn === 'out', { name: 'Book table: nice dinner out (' + d.short + ')', day: dayId, time: ent('dinner') ? toStr(ent('dinner').start) : '', bookBy: 'Before the day', booked: false, notes: dinnerVenue }, flag));
  notes.push(ensureRow('bookings', 'kn-bksite-' + dayId, Dn === 'site', { name: 'Book Green Room or Missing Squirrel (' + d.short + ')', day: dayId, time: ent('dinner') ? toStr(ent('dinner').start) : '', bookBy: 'Before the day', booked: false, notes: 'Guest Services 02392 460044' }, flag));
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
  const movable = ['lunch', 'dinner', 'nap'].includes(e.key);
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
  const modes = '<div class="modes">' + [1, 2, 3, 4].map((n) => '<button data-act="mode" data-n="' + n + '" class="' + (plan.mode === n ? 'on' : '') + '">' + n + '. ' + esc(MODES[n].label.split(' + ')[0]) + '<small>' + esc(MODES[n].label.split(' + ')[1] || (n === 3 ? 'Green Room or Missing Squirrel' : 'Lodge lunch and supper')) + '</small></button>').join('') + '</div>';
  const swimsDef = (BASE[day.id] || []).filter((a) => a.toggle);
  const swimSw = swimsDef.length ? '<div class="card"><h3 style="margin-top:0">Swims</h3>' + swimsDef.map((s) => '<label class="sw"><span><b>Swim at ' + s.t + '</b><br><span class="muted tiny">Booked. Arrive ' + toStr(toMin(s.t) - 20) + '. 20 minutes to change before and after.</span></span><input type="checkbox" class="toggle" data-act="swim" data-id="' + s.id + '"' + (plan.swims[s.id] === false ? '' : ' checked') + '></label>').join('') + '</div>' : '';
  const warns = r.warnings.map((w) => '<li class="' + w.level + '">' + esc(w.text) + '</li>').concat(r.reminders.map((t) => '<li class="rem">' + esc(t) + '</li>')).join('');
  const skipped = data.items.filter((i) => i.day === day.id && i.kind === 'show' && !i.go);
  const freeHtml = r.free.length ? '<h2>Free time</h2>' + r.free.map((f) => '<div class="card free"><b>' + toStr(f.start) + ' to ' + toStr(f.end) + '</b> <span class="muted">free</span><div class="chips">' + Object.values(day.alts || {}).flat().filter((v, i, a) => a.indexOf(v) === i && CARDS[v]).slice(0, 4).map((id) => '<button data-act="suggest" data-card="' + id + '" data-t="' + toStr(f.start) + '">+ ' + esc(CARDS[id].name) + '</button>').join('') + '<button data-act="add-item" data-t="' + toStr(f.start) + '">+ Add your own</button></div></div>').join('') : '';
  const strip = '<nav class="days">' + DAYS.map((d) => '<a href="#' + d.id + '"' + (d.id === day.id ? ' class="on"' : '') + '>' + d.short + '</a>').join('') + '</nav>';
  return strip + weatherHero(day) +
    '<h2 style="margin-top:6px">Meals</h2>' + modes + swimSw +
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
  if (act === 'mode') { const p = getPlan(day.id); p.mode = +el.dataset.n; savePlan(day.id, p); afterChange(day.id, p); }
  else if (act === 'hand') {
    const p = getPlan(day.id), k = el.dataset.key, r = compute(day.id, p), e = r.entries.find((x) => x.key === k);
    const fields = [{ n: 't', l: 'Start time', type: 'time', req: true }]; if (k === 'nap') fields.push({ n: 'loc', l: 'Nap location', type: 'select', opts: [['Lodge', 'Lodge'], ['Pushchair', 'Pushchair'], ['Car', 'Car']] });
    openForm('Set by hand', fields, { t: toStr(e.start), loc: e.loc || 'Lodge' }, (v) => { p.overrides[k] = k === 'nap' ? { t: v.t, loc: v.loc } : { t: v.t }; savePlan(day.id, p); afterChange(day.id, p); });
  }
  else if (act === 'undo') { const p = getPlan(day.id); delete p.overrides[el.dataset.key]; savePlan(day.id, p); afterChange(day.id, p); }
  else if (act === 'swim') { const p = getPlan(day.id); p.swims[el.dataset.id] = el.checked; savePlan(day.id, p); afterChange(day.id, p); }
  else if (act === 'toggle-go') { const it = data.items.find((x) => x.id === el.dataset.id); store.set('items', it.id, { go: !it.go }); it.go = !it.go; afterChange(it.day); }
  else if (act === 'add-item') openForm('Add an activity', itemFields, { day: el.dataset.day || day.id, time: el.dataset.t || '', dur: 45, place: 'On site', who: 'Whole family' }, (v) => { store.add('items', { ...v, kind: 'added', go: true }); afterChange(v.day); });
  else if (act === 'suggest') { const c = CARDS[el.dataset.card]; openForm('Add to day', itemFields, { name: c.name, day: day.id, time: el.dataset.t, dur: 60, place: c.place === 'Mill Rythe Coastal Village, Havant Road, Hayling Island PO11 0PB' ? 'On site' : c.place, who: 'Whole family', notes: '' }, (v) => { store.add('items', { ...v, kind: 'added', go: true }); afterChange(v.day); }); }
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
