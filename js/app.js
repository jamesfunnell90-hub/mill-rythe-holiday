import { DAYS, CARDS, ESSENTIALS, SLOT_DEFAULT, PARK, MET_OFFICE, BOOKING_SITE, CHECKED } from './data.js';
import * as store from './store.js';
import * as weather from './weather.js';
import { GW, SHOPS, FOOD, CAT_LABELS, search as gwSearch, categoriesFor } from './gunwharf.js';
const ICONS = { swim: '🏊', nap: '😴', meal: '🍽️', show: '🎭', travel: '🚗', activity: '🎨', outing: '🌳', fixed: '🏨', added: '⭐' };

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const data = { shopping: [], packing: [], bookings: [], items: [], briefs: [] };
const dayById = (id) => DAYS.find((d) => d.id === id);

// ---- dates (always Europe/London) ----
const londonParts = () => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { date: p.year + '-' + p.month + '-' + p.day, time: (p.hour === '24' ? '00' : p.hour) + ':' + p.minute };
};
function todayDay() {
  const { date } = londonParts();
  if (date <= DAYS[0].date) return DAYS[0];
  if (date >= DAYS[DAYS.length - 1].date) return DAYS[DAYS.length - 1];
  return DAYS.find((d) => d.date === date) || DAYS[0];
}
const fmtTime = (ms) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' }).format(new Date(ms));

// ---- links ----
const amaps = (q, mode) => 'https://maps.apple.com/?saddr=' + PARK.lat + ',' + PARK.lon + '&daddr=' + encodeURIComponent(q) + '&dirflg=' + mode;
const dirLinks = (place) => '<a href="' + amaps(place, 'w') + '" target="_blank" rel="noopener">🚶 Walk there (Apple Maps)</a><a href="' + amaps(place, 'd') + '" target="_blank" rel="noopener">🚗 Drive there (Apple Maps)</a>';
const srcList = (src) => src && src.length ? '<p class="muted tiny">Sources, checked ' + CHECKED + ': ' + src.map(([l, u]) => '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(l) + '</a>').join(', ') + '</p>' : '<p class="muted tiny">No source: treat as unverified.</p>';
const tel = (p) => 'tel:' + p.replace(/\s/g, '');

// ---- pieces ----
function weatherBlock(day, compact) {
  const w = weather.forDay(day.date);
  const upd = weather.state.at ? 'Updated ' + fmtTime(weather.state.at) + (weather.state.stale ? ' (could not refresh, showing last good forecast)' : '') : '';
  if (!w) return '<div class="card wx"><h3>Weather</h3><p>No forecast loaded yet. <a href="' + MET_OFFICE + '" target="_blank" rel="noopener">Open the Met Office forecast</a>.</p></div>';
  const rainy = w.rain >= 60;
  let h = '<div class="card wx nb"><h3>Weather: ' + esc(w.summary) + '</h3>' +
    '<p>Rain chance up to <b>' + w.rain + '%</b>. Gusts up to <b>' + w.gust + ' mph</b>. Sunrise ' + w.sunrise + ', sunset ' + w.sunset + '.</p>' +
    (rainy ? '<p class="flag">Rain likely: use the rain swap.</p>' : '');
  if (!compact || true) h += '<div class="strip" aria-label="Hourly rain chance">' + w.hours.map((x) => '<div title="' + x.h + ':00, gusts ' + Math.round(x.gust) + ' mph"><i style="height:' + Math.max(3, x.rain * 0.4) + 'px"></i><span>' + x.rain + '</span><small>' + x.h + '</small></div>').join('') + '</div><p class="muted tiny">Bars: hourly rain chance %, 08:00 to 20:00.</p>';
  h += '<p class="muted tiny">' + esc(upd) + ' <a href="' + MET_OFFICE + '" target="_blank" rel="noopener">Met Office forecast</a></p>';
  if (weather.state.stale && !weather.state.at) h += '<p class="flag">Forecast fetch failed.</p>';
  return h + '</div>';
}

function dayEntries(day) {
  const base = day.plan.map((p) => ({ ...p, src: 'plan' }));
  const items = data.items.filter((i) => i.day === day.id).map((i) => ({ slot: 'Evening', t: i.time || '', title: i.name, kind: i.kind === 'show' ? 'show' : 'added', note: [i.place, i.dur ? i.dur + ' min' : '', i.notes].filter(Boolean).join('. '), item: i, src: 'item' }));
  const sortKey = (e) => e.t || SLOT_DEFAULT[e.slot];
  const slotOrder = ['Morning', 'Midday', 'Afternoon', 'Evening'];
  return base.concat(items).sort((a, b) => sortKey(a).localeCompare(sortKey(b)) || slotOrder.indexOf(a.slot) - slotOrder.indexOf(b.slot));
}

function timeline(day) {
  const entries = dayEntries(day);
  const { date, time } = londonParts();
  const live = day.date === date;
  const key = (e) => e.t || SLOT_DEFAULT[e.slot];
  let nowIdx = -1;
  if (live) entries.forEach((e, i) => { if (key(e) <= time) nowIdx = i; });
  const rows = entries.map((e, i) => {
    const skipped = e.item && e.item.kind === 'show' && !e.item.go;
    const tag = e.kind === 'show' ? (skipped ? 'Skip' : 'Go') : e.kind === 'added' ? (e.item.booked ? 'Booked' : 'Added') : '';
    const body = '<b>' + esc(e.title) + '</b>' + (i === nowIdx ? '<span class="nowtag">Now</span>' : '') + (tag ? ' <span class="tag ' + (skipped ? 'skip' : '') + '">' + tag + '</span>' : '') + (e.note ? '<div class="muted">' + esc(e.note) + '</div>' : '');
    const link = e.card ? '<a class="more" href="#card/' + e.card + '">Details</a>' : '';
    const edit = e.item ? '<button class="mini" data-act="edit-item" data-id="' + e.item.id + '">Edit</button>' + (e.item.kind === 'show' ? '<button class="mini" data-act="toggle-go" data-id="' + e.item.id + '">' + (e.item.go ? 'Skip' : 'Go') + '</button>' : '') : '';
    const cls = 'k-' + e.kind + (skipped ? ' skipped' : '') + (live && i < nowIdx ? ' past' : '') + (i === nowIdx ? ' now' : '');
    return '<li class="' + cls + '"><div class="t">' + (e.t ? esc(e.t) : '<span class="muted">' + e.slot.toLowerCase() + '</span>') + '</div><div class="dot"><span>' + (ICONS[e.kind] || '•') + '</span></div><div class="b">' + body + '<div class="acts">' + link + edit + '</div></div></li>';
  });
  return '<ul class="timeline">' + rows.join('') + '</ul>';
}

function briefCard(day) {
  const b = data.briefs.find((x) => x.date === day.date);
  if (!b) return '';
  return '<a class="card brief" href="morning/?d=' + esc(b.date) + '" style="display:block;text-decoration:none;color:inherit"><h3>Morning brief</h3><p style="margin:0 0 6px">' + esc(b.summary || b.text) + '</p><b class="more">Open the full brief</b><p class="muted tiny" style="margin:6px 0 0">Sent at ' + fmtTime(b.at) + '.</p></a>';
}

function nextBooking() {
  const { date, time } = londonParts();
  const list = data.bookings.filter((b) => b.booked && b.day).map((b) => ({ ...b, d: dayById(b.day) })).filter((b) => b.d)
    .filter((b) => b.d.date > date || (b.d.date === date && (b.time || '00:00') >= time))
    .sort((a, b) => a.d.date.localeCompare(b.d.date) || (a.time || '').localeCompare(b.time || ''));
  const n = list[0];
  if (!n) return '<div class="card"><h3>Next booking</h3><p class="muted">Nothing booked ahead of now.</p></div>';
  return '<div class="card"><h3>Next booking</h3><p><b>' + esc(n.name) + '</b><br>' + esc(n.d.short) + (n.time ? ' at ' + esc(n.time) : '') + (n.notes ? '<br><span class="muted">' + esc(n.notes) + '</span>' : '') + '</p></div>';
}

function cardHtml(id, full) {
  const c = CARDS[id]; if (!c) return '';
  const rows = [['Opening', c.hours], ['Cost', c.cost], ['Booking', c.booking], ['Drive from park', c.drive], ['Parking', c.parking], ['High chairs and baby change', c.fac]]
    .map(([k, v]) => '<tr><th>' + k + '</th><td>' + esc(v) + '</td></tr>').join('');
  const links = [c.link ? '<a href="#' + c.link[0] + '">' + esc(c.link[1]) + '</a>' : '', c.web ? '<a href="' + esc(c.web) + '" target="_blank" rel="noopener">Website</a>' : '', c.phone ? '<a href="' + tel(c.phone) + '">Call ' + esc(c.phone) + '</a>' : '', c.place ? dirLinks(c.place) : ''].join('');
  if (!full) return '<a class="card mini-card" href="#card/' + id + '"><b>' + esc(c.name) + '</b><div class="muted">' + esc(c.why) + '</div></a>';
  return '<div class="card"><h2>' + esc(c.name) + '</h2><p>' + esc(c.what) + '</p><p><b>Why it suits us:</b> ' + esc(c.why) + '</p><table>' + rows + '</table><div class="links">' + links + '</div>' + srcList(c.src) + '</div>';
}

function altsBlock(day) {
  const slots = Object.keys(day.alts || {});
  if (!slots.length) return '';
  return '<h2>Alternatives</h2>' + slots.map((s) => '<h3>' + esc(s) + '</h3><div class="grid">' + day.alts[s].map((id) => cardHtml(id, false)).join('') + '</div>').join('');
}

// ---- views ----
function hero(day, isToday) {
  const w = weather.forDay(day.date);
  const { date } = londonParts();
  const eyebrow = isToday ? (date < DAYS[0].date ? 'Before the trip: Saturday' : date > DAYS[DAYS.length - 1].date ? 'After the trip: Wednesday' : 'Today') : day.theme;
  const wx = w ? '<div class="hero-wx"><span class="hero-ico">' + weather.iconFor(w.code) + '</span><div class="hero-temp">' + w.hi + '°<small> / ' + w.lo + '°</small></div><div class="hero-meta"><b>' + esc(w.summary) + '</b><br>Rain up to ' + w.rain + '% · Gusts ' + w.gust + ' mph<br>Sunset ' + w.sunset + '</div></div>' : '<div class="hero-wx"><div class="hero-meta">Loading the forecast</div></div>';
  const wave = (cls) => '<svg class="' + cls + '" viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0 30 Q75 0 150 30 T300 30 T450 30 T600 30 T750 30 T900 30 T1050 30 T1200 30 V60 H0Z"/></svg>';
  return '<section class="hero"><div class="eyebrow">' + esc(eyebrow) + '</div><h1>' + esc(day.long) + '</h1><p>' + esc(isToday ? day.theme : '') + '</p>' + wx + '<div class="waves" aria-hidden="true">' + wave('w1') + wave('w2') + wave('w3') + '</div></section>';
}

function viewDay(day, isToday) {
  const strip = '<nav class="days">' + DAYS.map((d) => '<a href="#day/' + d.id + '"' + (d.id === day.id ? ' class="on"' : '') + '>' + d.short + '</a>').join('') + '</nav>';
  return (isToday ? '' : strip) + hero(day, isToday) +
    (isToday ? briefCard(day) + nextBooking() : '') + weatherBlock(day) + '<p class="muted tiny">' + esc(day.forecast) + '</p>' +
    '<h2>Plan</h2>' + timeline(day) + '<button class="btn" data-act="add-item" data-day="' + day.id + '">Add an item to this day</button>' +
    '<div class="card swap"><h3>Rain swap</h3><p>' + esc(day.rainSwap) + '</p></div>' + altsBlock(day);
}

function listView(coll, title, groupKey, choices) {
  const rows = data[coll];
  const groups = {};
  rows.forEach((r) => { (groups[r[groupKey]] = groups[r[groupKey]] || []).push(r); });
  const left = rows.filter((r) => !r.done).length;
  return '<h1>' + title + '</h1><p class="muted">' + left + ' to go of ' + rows.length + '</p><div class="prog"><i style="width:' + (rows.length ? Math.round(100 * (rows.length - left) / rows.length) : 0) + '%"></i></div>' +
    '<form class="addrow" data-form="' + coll + '"><input name="name" placeholder="Add an item" required autocomplete="off"><select name="group">' + choices.map((c) => '<option>' + esc(c) + '</option>').join('') + '</select><button class="btn">Add</button></form>' +
    Object.keys(groups).map((g) => '<h3>' + esc(g) + '</h3><ul class="checks">' + groups[g].map((r) => '<li class="' + (r.done ? 'done' : '') + '"><label><input type="checkbox" data-act="tick" data-coll="' + coll + '" data-id="' + r.id + '"' + (r.done ? ' checked' : '') + '><span>' + esc(r.name) + '</span></label><button class="mini" data-act="rename" data-coll="' + coll + '" data-id="' + r.id + '">Edit</button><button class="mini del" data-act="del" data-coll="' + coll + '" data-id="' + r.id + '" aria-label="Delete ' + esc(r.name) + '">Delete</button></li>').join('') + '</ul>').join('');
}

function viewBookings() {
  const rows = data.bookings.slice().sort((a, b) => (dayById(a.day)?.date || 'z').localeCompare(dayById(b.day)?.date || 'z') || (a.time || '').localeCompare(b.time || ''));
  return '<h1>Bookings</h1><p class="muted">Tick when booked. Nothing is booked from here: use the links, phone or the Away Resorts app. <a href="' + BOOKING_SITE + '" target="_blank" rel="noopener">Activity booking site</a></p>' +
    '<ul class="checks bk">' + rows.map((b) => '<li class="' + (b.booked ? 'done' : '') + '"><label><input type="checkbox" data-act="booked" data-id="' + b.id + '"' + (b.booked ? ' checked' : '') + '><span><b>' + esc(b.name) + '</b><br><span class="muted">' + esc(dayById(b.day)?.short || '') + (b.time ? ' ' + esc(b.time) : '') + (b.bookBy ? ' · book by ' + esc(b.bookBy) : '') + (b.notes ? ' · ' + esc(b.notes) : '') + '</span></span></label><button class="mini" data-act="edit-booking" data-id="' + b.id + '">Edit</button></li>').join('') + '</ul>' +
    '<button class="btn" data-act="add-booking">Add a booking</button>';
}

const getRef = () => { try { return localStorage.getItem('mrh:bookref') || ''; } catch (e) { return ''; } };
function refCard() {
  const r = getRef();
  return '<div class="card"><h3>Booking reference</h3>' + (r ? '<p class="big" style="letter-spacing:.06em">' + esc(r) + '</p><div class="acts"><button class="mini" data-act="copy-ref">Copy</button><button class="mini" data-act="edit-ref">Change</button></div>' : '<p style="margin:0 0 8px">Type it in once. It stays on this phone only.</p><div class="addrow"><input id="refin" placeholder="Booking reference" autocomplete="off" autocapitalize="characters"><button class="btn" data-act="save-ref">Save</button></div>') + '<p class="muted tiny" style="margin:6px 0 0">Kept on this device, never sent to the shared database, because this page is public. It is also in each morning brief message.</p></div>';
}
function viewInfo() {
  const groups = { 'On site': 'onsite', 'Food': 'food', 'Days out': 'outing' };
  return '<h1>Essentials</h1>' + refCard() + '<div class="card">' + ESSENTIALS.map((e) => '<div class="ess"><p><b>' + esc(e.h) + '</b><br>' + esc(e.t) + '</p>' + (e.phone || e.place ? '<div class="links">' + (e.phone ? '<a href="' + tel(e.phone) + '">Call ' + esc(e.phone) + '</a>' : '') + (e.place ? dirLinks(e.place) : '') + '</div>' : '') + srcList(e.src) + '</div>').join('') + '</div>' +
    '<h2>All cards</h2>' + Object.entries(groups).map(([label, type]) => '<h3>' + label + '</h3><div class="grid">' + Object.keys(CARDS).filter((k) => CARDS[k].type === type).map((k) => cardHtml(k, false)).join('') + '</div>').join('');
}


// ---- Gunwharf Quays tab ----
const gw = { set: 'all', q: '', cats: [] };
const gwItems = () => (gw.set === 'shops' ? SHOPS : gw.set === 'food' ? FOOD : SHOPS.concat(FOOD));
function gwResults() {
  const res = gwSearch(gwItems(), gw.q, gw.cats);
  const rows = res.map((i) => '<li class="gwrow"><div><b>' + esc(i.name) + '</b> <span class="tag ' + (i.kind === 'food' ? '' : 'skip') + '">' + (i.kind === 'food' ? 'Food' : 'Shop') + '</span><div class="muted tiny">' + esc(i.cats.filter((c) => CAT_LABELS[c]).slice(0, 5).map((c) => CAT_LABELS[c]).join(' · ')) + (i.note ? ' · ' + esc(i.note) : '') + '</div></div></li>').join('');
  return '<p class="muted tiny" style="margin:6px 0">' + res.length + ' of ' + gwItems().length + (gw.q || gw.cats.length ? ' match' : ' listed') + '</p>' + (rows ? '<ul class="gwlist">' + rows + '</ul>' : '<div class="card"><b>Nothing matches.</b><div class="muted">Try a simpler word, like shirt, shoes, toys or pizza, or clear the filters.</div></div>');
}
function gwChips() {
  return categoriesFor(gwItems()).slice(0, 14).map((c) => '<button class="chip' + (gw.cats.includes(c.cat) ? ' on' : '') + '" data-act="gw-cat" data-cat="' + c.cat + '">' + esc(c.label) + ' <small>' + c.n + '</small></button>').join('');
}
function viewGunwharf() {
  const seg = [['all', 'Everything'], ['shops', 'Shops (' + SHOPS.length + ')'], ['food', 'Food and drink (' + FOOD.length + ')']].map(([k, l]) => '<button class="' + (gw.set === k ? 'on' : '') + '" data-act="gw-set" data-set="' + k + '">' + l + '</button>').join('');
  return '<section class="hero" style="padding-bottom:22px"><div class="eyebrow">Saturday 24 October · meet friends 11:00</div><h1>Gunwharf Quays</h1><p>Outlet shops and places to eat, Portsmouth</p></section>' +
    '<div class="card"><p style="margin:0 0 6px"><b>Saturday ' + esc(GW.hours.replace('Saturday ', '')) + '</b></p><p class="muted tiny" style="margin:0 0 6px">' + esc(GW.parking) + '</p><div class="links">' + dirLinks(GW.address) + '<a href="tel:02392836700">Call ' + esc(GW.phone) + '</a><a href="' + GW.web + '" target="_blank" rel="noopener">Website</a></div>' +
    '<p class="muted tiny">Sources, checked ' + GW.checked + ': <a href="' + GW.srcShops[1] + '" target="_blank" rel="noopener">' + GW.srcShops[0] + '</a>, <a href="' + GW.srcFood[1] + '" target="_blank" rel="noopener">' + GW.srcFood[0] + '</a>, <a href="' + GW.hoursSrc[1] + '" target="_blank" rel="noopener">' + GW.hoursSrc[0] + '</a>, <a href="' + GW.parkingSrc[1] + '" target="_blank" rel="noopener">' + GW.parkingSrc[0] + '</a>. Categories and search words are added by this app, not by Gunwharf.</p></div>' +
    '<div class="seg">' + seg + '</div>' +
    '<input id="gwq" class="gwq" type="search" placeholder="Search: menswear, t-shirts, trainers, toys, pizza, coffee" value="' + esc(gw.q) + '" autocomplete="off" autocapitalize="off" spellcheck="false">' +
    '<div class="chips2" id="gwchips">' + gwChips() + '</div><div id="gwres">' + gwResults() + '</div>';
}

function render(anim) {
  const route = (location.hash || '#today').slice(1).split('/');
  let html = '';
  if (route[0] === 'day' && dayById(route[1])) html = viewDay(dayById(route[1]), false);
  else if (route[0] === 'card' && CARDS[route[1]]) html = '<a href="javascript:history.back()">Back</a>' + cardHtml(route[1], true);
  else if (route[0] === 'shopping') html = listView('shopping', 'Shopping list', 'aisle', ['Dairy', 'Bakery', 'Cupboard', 'Drinks', 'Fruit and veg', 'Meat and fish', 'Frozen', 'Baby', 'Household', 'Other']);
  else if (route[0] === 'packing') html = listView('packing', 'Packing list', 'group', ['Storm-proof travel', 'Swim', 'Halloween', 'Toddler sleep', 'Two kids', 'Car', 'Other']);
  else if (route[0] === 'bookings') html = viewBookings();
  else if (route[0] === 'info') html = viewInfo();
  else if (route[0] === 'gunwharf') html = viewGunwharf();
  else if (route[0] === 'days') html = '<h1>Days</h1><div class="grid">' + DAYS.map((d) => '<a class="card mini-card" href="#day/' + d.id + '"><b>' + d.long + '</b><div class="muted">' + esc(d.theme) + '</div></a>').join('') + '</div>';
  else { route[0] = 'today'; html = viewDay(todayDay(), true); }
  const keepY = window.scrollY;
  const v = $('#view'); if (anim) { v.className = 'anim'; clearTimeout(render.t); render.t = setTimeout(() => { v.className = ''; }, 1200); }
  v.innerHTML = html;
  v.querySelectorAll('.timeline li, .grid > *').forEach((el, i) => el.style.setProperty('--i', i % 12));
  window.scrollTo(0, keepY);
  document.querySelectorAll('#tabs a').forEach((a) => a.classList.toggle('on', a.dataset.tab === route[0] || (route[0] === 'day' && a.dataset.tab === 'days') || (route[0] === 'card' && a.dataset.tab === 'info')));
  const s = $('#status');
  s.textContent = store.mode === 'shared' ? (navigator.onLine ? 'Shared' : 'Offline: changes sync later') : 'Local only: not shared yet';
  s.className = 'status ' + (store.mode === 'shared' && navigator.onLine ? 'ok' : 'warn');
}

// ---- dialog form ----
function openForm(title, fields, values, onSave, onDelete) {
  const dlg = $('#dlg');
  dlg.innerHTML = '<form method="dialog"><h2>' + esc(title) + '</h2>' + fields.map((f) => {
    const v = values[f.n] ?? '';
    if (f.type === 'check') return '<label class="chk"><input type="checkbox" name="' + f.n + '"' + (v ? ' checked' : '') + '> ' + esc(f.l) + '</label>';
    if (f.type === 'select') return '<label>' + esc(f.l) + '<select name="' + f.n + '">' + f.opts.map(([val, lab]) => '<option value="' + val + '"' + (val === v ? ' selected' : '') + '>' + esc(lab) + '</option>').join('') + '</select></label>';
    return '<label>' + esc(f.l) + '<input name="' + f.n + '" type="' + (f.type || 'text') + '" value="' + esc(v) + '"' + (f.req ? ' required' : '') + '></label>';
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

document.addEventListener('input', (ev) => {
  if (ev.target.id === 'gwq') { gw.q = ev.target.value; const r = $('#gwres'); if (r) r.innerHTML = gwResults(); }
});
document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]'); if (!el) return;
  if (el.dataset.act === 'gw-set') { gw.set = el.dataset.set; gw.cats = []; render(); return; }
  if (el.dataset.act === 'gw-cat') { const c = el.dataset.cat; gw.cats = gw.cats.includes(c) ? gw.cats.filter((x) => x !== c) : gw.cats.concat(c); const r = $('#gwres'); if (r) { r.innerHTML = gwResults(); $('#gwchips').innerHTML = gwChips(); } return; }
  if (el.dataset.act === 'save-ref') { const v = ($('#refin').value || '').trim(); if (v) { try { localStorage.setItem('mrh:bookref', v); } catch (e) { /* blocked */ } render(); } return; }
  if (el.dataset.act === 'edit-ref') { try { localStorage.removeItem('mrh:bookref'); } catch (e) { /* blocked */ } render(); return; }
  if (el.dataset.act === 'copy-ref') { try { navigator.clipboard.writeText(getRef()); el.textContent = 'Copied'; } catch (e) { el.textContent = 'Select and copy'; } return; }
  const act = el.dataset.act, id = el.dataset.id, coll = el.dataset.coll;
  if (act === 'tick') store.update(coll, id, { done: el.checked });
  else if (act === 'booked') store.update('bookings', id, { booked: el.checked });
  else if (act === 'del') { if (confirm('Delete this item?')) store.remove(coll, id); }
  else if (act === 'rename') { const r = data[coll].find((x) => x.id === id); const n = prompt('Edit item', r.name); if (n && n.trim()) store.update(coll, id, { name: n.trim() }); }
  else if (act === 'toggle-go') { const r = data.items.find((x) => x.id === id); store.update('items', id, { go: !r.go }); }
  else if (act === 'add-item') openForm('Add an item', [{ n: 'name', l: 'Name', req: true }, { n: 'day', l: 'Day', type: 'select', opts: dayOpts }, { n: 'time', l: 'Time', type: 'time' }, { n: 'place', l: 'Place' }, { n: 'booked', l: 'Booked', type: 'check' }], { day: el.dataset.day }, (v) => store.add('items', { ...v, kind: 'added', go: true }));
  else if (act === 'edit-item') { const r = data.items.find((x) => x.id === id); openForm('Edit item', [{ n: 'name', l: 'Name', req: true }, { n: 'day', l: 'Day', type: 'select', opts: dayOpts }, { n: 'time', l: 'Time', type: 'time' }, { n: 'dur', l: 'Minutes', type: 'number' }, { n: 'place', l: 'Place' }, { n: 'booked', l: 'Booked', type: 'check' }, { n: 'notes', l: 'Notes' }], r, (v) => store.update('items', id, v), () => store.remove('items', id)); }
  else if (act === 'add-booking') openForm('Add a booking', [{ n: 'name', l: 'What', req: true }, { n: 'day', l: 'Day', type: 'select', opts: dayOpts }, { n: 'time', l: 'Time', type: 'time' }, { n: 'bookBy', l: 'Book by' }, { n: 'booked', l: 'Booked', type: 'check' }, { n: 'notes', l: 'Notes' }], {}, (v) => store.add('bookings', v));
  else if (act === 'edit-booking') { const r = data.bookings.find((x) => x.id === id); openForm('Edit booking', [{ n: 'name', l: 'What', req: true }, { n: 'day', l: 'Day', type: 'select', opts: dayOpts }, { n: 'time', l: 'Time', type: 'time' }, { n: 'bookBy', l: 'Book by' }, { n: 'booked', l: 'Booked', type: 'check' }, { n: 'notes', l: 'Notes' }], r, (v) => store.update('bookings', id, v), () => store.remove('bookings', id)); }
});
document.addEventListener('submit', (ev) => {
  const f = ev.target.closest('[data-form]'); if (!f) return;
  ev.preventDefault();
  const coll = f.dataset.form, name = f.elements.name.value.trim(); if (!name) return;
  store.add(coll, coll === 'shopping' ? { name, aisle: f.elements.group.value, done: false } : { name, group: f.elements.group.value, done: false });
  f.reset();
});

// ---- boot ----
let queued = false;
const rerender = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; const a = document.activeElement; if (!$('#dlg').open && !(a && (a.id === 'gwq' || a.id === 'refin'))) render(); }); };
window.addEventListener('hashchange', () => { window.scrollTo(0, 0); render(true); });
window.addEventListener('online', rerender); window.addEventListener('offline', rerender);

(async function boot() {
  render(true);
  await store.init();
  ['shopping', 'packing', 'bookings', 'items', 'briefs'].forEach((c) => store.subscribe(c, (rows) => { data[c] = rows; rerender(); }));
  render();
  const go = async () => { await weather.refresh(); rerender(); };
  go();
  setInterval(go, 30 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && (!weather.state.at || Date.now() - weather.state.at > 30 * 60 * 1000)) go(); });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch((e) => console.warn('sw', e));
})();
