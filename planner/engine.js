// Planner rebuild engine. Pure and deterministic: no DOM, no network, no AI.
// Principle: fixed items are never moved, shortened or deleted. The engine only places the toddler's nap
// and the meals into the gaps between them, and flags clashes it cannot solve in plain words.
// Times are minutes since midnight internally; 'HH:MM' strings at the edges.

export const toMin = (t) => { const [h, m] = String(t || '').split(':').map(Number); return Number.isFinite(h) ? h * 60 + (m || 0) : null; };
export const toStr = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

// Quick presets for lunch and dinner. Breakfast and the kids/adults splits are set separately.
export const MODES = {
  1: { label: 'Big lunch out + lodge supper', l: 'out', d: 'lodge' },
  2: { label: 'Lodge lunch + nice dinner out', l: 'lodge', d: 'out' },
  3: { label: 'Eat on site', l: 'lodge', d: 'site' },
  4: { label: 'All at the lodge', l: 'lodge', d: 'lodge' }
};
export const DEFAULT_MODE = { sat: 3, sun: 1, mon: 3, tue: 2, wed: 1 };

// Meal choices. b: breakfast. l: lunch. d: dinner. A split meal gives the children their own meal at the lodge.
export const MEAL_OPTIONS = {
  b: [['lodge', 'At the lodge'], ['clubhouse', 'Clubhouse (on site)'], ['out', 'Out']],
  l: [['lodge', 'At the lodge'], ['site', 'On site'], ['out', 'Out']],
  d: [['lodge', 'At the lodge'], ['site', 'On site (Green Room)'], ['out', 'Out']]
};
export const DEFAULT_MEALS = {
  sat: { b: 'home', l: 'out', d: 'site' },
  sun: { b: 'lodge', l: 'out', d: 'lodge' },
  mon: { b: 'lodge', l: 'lodge', d: 'site', splitL: true },
  tue: { b: 'lodge', l: 'lodge', d: 'out' },
  wed: { b: 'lodge', l: 'out', d: null }
};
export function resolveMeals(dayId, { meals, mode } = {}) {
  const base = { splitB: false, splitL: false, splitD: false, ...DEFAULT_MEALS[dayId] };
  if (meals) return { ...base, ...meals };
  if (mode) return { ...base, l: MODES[mode].l, d: DEFAULT_MEALS[dayId].d === null ? null : MODES[mode].d, splitL: false };
  return base;
}

// The agreed day shape as timed anchors. Swim blocks include 20 min to arrive and change before, and 20 after.
// toggle: a swim that can be switched off. allowMeal: a meal can happen during it (you eat there).
// napOk: the toddler can nap in the pushchair during it.
export const BASE = {
  sat: [
    { id: 'gunwharf', t: '11:00', dur: 180, title: 'Meet friends at Gunwharf Quays', kind: 'outing', allowMeal: true, napOk: true, card: 'gunwharf', note: 'Planned 11:00 to about 14:00, could run to 14:30.' },
    { id: 'drive-lodge', t: '14:00', dur: 45, title: 'Drive to the lodge', kind: 'travel', note: 'About 30 to 45 minutes. Unverified.' },
    { id: 'checkin', t: '14:45', dur: 30, title: 'Check in (opens 14:30)', kind: 'fixed', card: 'lodge' }
  ],
  sun: [{ id: 'swim-sun', t: '09:00', dur: 75, title: 'Swim', kind: 'swim', toggle: true, card: 'pool' }, { id: 'emsworth', t: '10:45', dur: 45, title: 'Emsworth harbour stroll', kind: 'outing', napOk: true, card: 'emsworth' }],
  mon: [{ id: 'craft-mon', t: '10:15', dur: 45, title: 'Craft session', kind: 'activity', card: 'crafts', note: 'Book it first.' }, { id: 'swim-mon', t: '12:00', dur: 75, title: 'Swim', kind: 'swim', toggle: true, card: 'pool' }],
  tue: [{ id: 'staunton', t: '10:00', dur: 105, title: 'Staunton Farm', kind: 'outing', napOk: true, card: 'staunton' }, { id: 'swim-tue', t: '14:30', dur: 75, title: 'Swim', kind: 'swim', toggle: true, card: 'pool' }],
  wed: [{ id: 'checkout', t: '09:00', dur: 60, title: 'Pack and check out by 10:00', kind: 'fixed', card: 'lodge' }, { id: 'railway', t: '10:15', dur: 60, title: 'Seafront railway, beach or donkeys', kind: 'outing', napOk: true, card: 'railway' }, { id: 'drive-home', t: '13:00', dur: 120, title: 'Drive home', kind: 'travel', note: 'In the nap. Alternative: Marwell Zoo on the way home.' }]
};
export const DAY_RULES = { sat: { breakfast: false }, sun: {}, mon: {}, tue: {}, wed: { dinner: false } };
const NAP_DURS = [90, 80, 70, 60];
const SWIM_PRE = 20, SWIM_POST = 20, NAP_DUR = 90, NAP_FROM = 12 * 60, NAP_TO = 15 * 60, BEDTIME = 19 * 60 + 30;
const DUR = { b: { lodge: 40, clubhouse: 60, out: 60, kids: 25 }, l: { lodge: 40, out: 75, site: 60, kids: 30 }, d: { lodge: 40, site: 40, out: 75, kids: 30 } };
const overlap = (a, b) => a.start < b.end && b.start < a.end;
function range(a, b, st = 15) { const r = []; for (let x = a; x <= b; x += st) r.push(x); return r; }

const LABEL = {
  b: { lodge: 'Breakfast at the lodge', clubhouse: 'Breakfast at the clubhouse (on site)', out: 'Breakfast out' },
  l: { lodge: 'Lodge lunch', out: 'Big lunch out', site: 'Lunch on site' },
  d: { lodge: 'Light lodge supper', site: 'Dinner on site (Green Room)', out: 'Nice dinner out' }
};
const WHERE = { lodge: 'at the lodge', clubhouse: 'at the clubhouse', site: 'on site', out: 'out' };
const NAME = { b: 'breakfast', l: 'lunch', d: 'dinner' };

// input: { dayId, mode?, meals?, swims:{id:bool}, items:[App 1 items for the day], overrides:{breakfast,lunch,dinner,...-kids,nap:{t,loc?}} }
export function buildDay({ dayId, mode, meals, swims = {}, items = [], overrides = {} }) {
  const rules = DAY_RULES[dayId] || {};
  const M = resolveMeals(dayId, { meals, mode });
  const warnings = [], reminders = [];
  const fixed = [], soft = [];

  // 1. fixed anchors
  for (const a of BASE[dayId] || []) {
    if (a.toggle && swims[a.id] === false) { reminders.push('Swim at ' + a.t + ' is switched off. Cancel it on the activity booking site or with Guest Services: this app never cancels anything.'); continue; }
    const s = toMin(a.t), isSwim = a.kind === 'swim';
    fixed.push({ key: a.id, start: s - (isSwim ? SWIM_PRE : 0), end: s + a.dur + (isSwim ? SWIM_POST : 0), title: a.title + (isSwim ? ' (arrive ' + toStr(s - SWIM_PRE) + ')' : ''), kind: a.kind, fixed: true, note: a.note || '', card: a.card, shown: s, allowMeal: !!a.allowMeal, napOk: !!a.napOk });
  }
  for (const i of items) {
    const s = toMin(i.time); if (s === null) continue;
    const dur = Number(i.dur) || 45;
    const note = [i.place, dur + ' min', i.who && i.who !== 'Whole family' ? 'for the ' + i.who : '', i.notes].filter(Boolean).join(', ');
    if (i.kind === 'show') { if (i.go) fixed.push({ key: 'item:' + i.id, itemId: i.id, start: s, end: s + dur, title: i.name, kind: 'show', fixed: true, note: [i.place, dur + ' min'].filter(Boolean).join(', '), shown: s }); }
    else if (i.booked) fixed.push({ key: 'item:' + i.id, itemId: i.id, start: s, end: s + dur, title: i.name, kind: 'added', fixed: true, note, shown: s, booked: true });
    else soft.push({ key: 'item:' + i.id, itemId: i.id, start: s, end: s + dur, title: i.name, kind: 'added', fixed: false, note, shown: s });
  }
  const travel = fixed.filter((f) => f.kind === 'travel');
  const hard = fixed.filter((f) => f.kind !== 'travel');
  const placed = [];

  for (let a = 0; a < fixed.length; a++) for (let b = a + 1; b < fixed.length; b++) {
    if (overlap(fixed[a], fixed[b])) warnings.push({ level: 'clash', text: fixed[a].title + ' (' + toStr(fixed[a].shown ?? fixed[a].start) + ') overlaps ' + fixed[b].title + ' (' + toStr(fixed[b].shown ?? fixed[b].start) + '). Fixed items are never moved: change one by hand.' });
  }

  const blockedMeal = (blk) => hard.some((f) => !f.allowMeal && overlap(blk, f));
  const blockedNap = (blk) => hard.some((f) => !f.napOk && overlap(blk, f));
  const softHits = (blk) => soft.filter((f) => overlap(blk, f)).length;
  const insideTravel = (blk) => travel.some((t) => blk.start >= t.start && blk.end <= t.end);
  const inNapOk = (blk) => hard.some((f) => f.napOk && overlap(blk, f));
  const pin = (k) => (overrides[k] && toMin(overrides[k].t) !== null ? toMin(overrides[k].t) : null);
  const mealEntry = (key, kind, title, blk, extra = {}) => ({ key, start: blk.start, end: blk.end, title, kind: 'meal', fixed: false, handSet: pin(key) !== null, meal: kind, note: '', ...extra });

  // 2. lunch and nap, searched together so the nap is protected and lunch fits around swims and outings
  const lunchOn = !!M.l && rules.lunch !== false;
  const split = lunchOn && !!M.splitL;
  const lType = M.l, aDur = lunchOn ? DUR.l[lType] : 0, kDur = DUR.l.kids;
  const aPref = split ? 13 * 60 + 30 : lType === 'out' ? (dayId === 'sat' ? 12 * 60 + 30 : 11 * 60 + 45) : 12 * 60 + 15;
  const kPref = 11 * 60 + 15;
  const napPref = split ? 14 * 60 : lType === 'out' ? aPref + aDur : dayId === 'sat' ? 13 * 60 + 45 : 13 * 60;
  const aPin = pin('lunch'), kPin = pin('lunch-kids'), nPin = pin('nap');
  let A = null, K = null, nap = null, best = Infinity;
  const aStarts = !lunchOn ? [null] : aPin !== null ? [aPin] : range(10 * 60 + 30, 14 * 60 + 30);
  const kStarts = !split ? [null] : kPin !== null ? [kPin] : range(10 * 60 + 30, 13 * 60, 5);
  const consider = (a, k, n) => {
    let cost = 0;
    if (a) {
      cost += (split ? 1 : 2) * Math.abs(a.start - aPref) + 40 * softHits(a);
      if (!split) { if (n.start < a.end) cost += 60; else if (n.start - a.end > 30) cost += (n.start - a.end - 30) * 0.5; } else if (overlap(a, n)) cost -= 10;
    }
    if (k) { cost += 2 * Math.abs(k.start - kPref) + 40 * softHits(k); if (n.start < k.end) cost += 60; else if (n.start - k.end > 45) cost += (n.start - k.end - 45) * 0.3; }
    cost += Math.abs(n.start - napPref) * 0.5 + 40 * softHits(n) - (insideTravel(n) ? 40 : 0) + (NAP_DUR - (n.end - n.start)) * 1.5;
    if (cost < best) { best = cost; A = a; K = k; nap = n; }
  };
  for (const as of aStarts) {
    const a = as === null ? null : { start: as, end: as + aDur };
    if (a && aPin === null && blockedMeal(a)) continue;
    for (const ks of kStarts) {
      const k = ks === null ? null : { start: ks, end: ks + kDur };
      if (k && kPin === null && blockedMeal(k)) continue;
      if (a && k && overlap(a, k)) continue;
      for (const nd of nPin !== null ? [NAP_DUR] : NAP_DURS) {
        for (const ns of nPin !== null ? [nPin] : range(NAP_FROM, NAP_TO - nd, 5)) {
          const n = { start: ns, end: ns + nd };
          if (nPin === null && blockedNap(n)) continue;
          if (k && overlap(k, n)) continue;
          if (a && !split && overlap(a, n)) continue;
          consider(a, k, n);
        }
      }
    }
  }
  if (!nap) {
    // no nap fits anywhere: still place lunch where there is a gap, then flag the nap
    best = Infinity;
    for (const as of aStarts) { if (as === null) continue; const a = { start: as, end: as + aDur }; if (aPin === null && blockedMeal(a)) continue; const c = Math.abs(a.start - aPref) + 40 * softHits(a); if (c < best) { best = c; A = a; } }
    if (split) { best = Infinity; for (const ks of kStarts) { const k = { start: ks, end: ks + kDur }; if (kPin === null && blockedMeal(k)) continue; const c = Math.abs(k.start - kPref); if (c < best) { best = c; K = k; } } }
    warnings.push({ level: 'clash', text: 'The toddler\'s main nap cannot happen anywhere between 12:00 and 15:00: no gap of even an hour is free of fixed items. Move or switch off one of them.' });
  }
  if (nap && nap.end - nap.start < NAP_DUR) warnings.push({ level: 'warn', text: 'The nap is squeezed to ' + (nap.end - nap.start) + ' minutes between the fixed items.' });
  if (lunchOn && !A) warnings.push({ level: 'clash', text: 'There is no gap for ' + (split ? 'the adults\' lunch' : 'lunch') + ' that avoids the fixed items. Set it by hand.' });
  if (split && !K) warnings.push({ level: 'clash', text: 'There is no gap for the kids\' lunch that avoids the fixed items. Set it by hand.' });
  if (K) placed.push(mealEntry('lunch-kids', 'lodge', 'Kids\' lunch (lodge)', K, { note: 'Before the swim and the nap.', kids: true }));
  if (A) placed.push(mealEntry('lunch', lType, split ? 'Adults\' lunch: ' + WHERE[lType] : LABEL.l[lType], A, { note: split ? 'Adults and the 4 year old.' : lType === 'out' && dayId === 'sat' ? 'At Gunwharf Quays: see the Quays tab.' : lType === 'out' ? 'Venue not chosen. See the Sunday and Wednesday cards.' : '' }));
  let napLoc = null;
  if (nap) {
    const overlapsAdults = !!(A && split && overlap(A, nap));
    napLoc = (overrides.nap && overrides.nap.loc) || (insideTravel(nap) ? 'Car' : inNapOk(nap) ? 'Pushchair' : overlapsAdults && lType !== 'lodge' ? 'Pushchair' : lType === 'out' && lunchOn && !split ? 'Car' : 'Lodge');
    placed.push({ key: 'nap', start: nap.start, end: nap.end, title: 'Toddler nap: ' + napLoc, kind: 'nap', fixed: false, handSet: nPin !== null || !!(overrides.nap && overrides.nap.loc), loc: napLoc, note: napLoc === 'Car' && insideTravel(nap) ? 'Car nap: the drive falls in the nap window.' : 'Main nap, about 90 minutes.' });
    if (overlapsAdults) warnings.push({ level: 'info', text: napLoc === 'Lodge' ? 'The adults\' lunch is during the nap. Someone eats at the lodge near the sleeping toddler, or the nap moves to the pushchair.' : 'The adults\' lunch is during the nap, so the toddler sleeps in the ' + napLoc.toLowerCase() + ' while you eat.' });
    else if (A && lType === 'out' && !split) warnings.push({ level: 'info', text: 'Lunch is out: the toddler sleeps in the car or pushchair afterwards.' });
  }

  // 3. breakfast and dinner: same placement, independent of the nap
  const place = (letter, kids) => {
    const key = NAME[letter] + (kids ? '-kids' : '');
    const type = M[letter]; if (!type) return;
    if (letter === 'b' && (rules.breakfast === false || type === 'home')) return;
    if (letter === 'd' && rules.dinner === false) return;
    const dur = kids ? DUR[letter].kids : DUR[letter][type];
    const lead = letter === 'd' && type === 'out' && !kids ? 30 : 0;
    const pref = letter === 'b' ? (kids ? 7 * 60 + 30 : 8 * 60) : (kids || type === 'lodge' ? 16 * 60 + 45 : 17 * 60);
    const from = letter === 'b' ? 7 * 60 : 15 * 60 + 30, to = letter === 'b' ? 9 * 60 + 30 : 18 * 60 + 15;
    const p = pin(key);
    let best = null, bc = Infinity;
    for (const s of p !== null ? [p] : range(from, to)) {
      const blk = { start: s - lead, end: s + dur };
      if (p === null && blockedMeal(blk)) continue;
      if (letter === 'd' && p === null && blk.end > BEDTIME - 15) continue;
      const c = Math.abs(s - pref) + 40 * softHits(blk);
      if (c < bc) { bc = c; best = { start: s, end: s + dur }; }
    }
    if (!best) { warnings.push({ level: 'clash', text: 'There is no gap for ' + (kids ? 'the kids\' ' : '') + NAME[letter] + ' that avoids the fixed items' + (letter === 'd' ? ' and protects the 19:30 bedtime' : '') + '. Set it by hand' + (letter === 'd' ? ' or skip a show' : '') + '.' }); return; }
    const isSplit = !!M['split' + letter.toUpperCase()];
    const title = kids ? 'Kids\' ' + NAME[letter] + ' (lodge)' : isSplit ? 'Adults\' ' + NAME[letter] + ': ' + WHERE[type] : LABEL[letter][type];
    placed.push(mealEntry(key, kids ? 'lodge' : type, title, best, { kids, note: letter === 'd' && type === 'out' && !kids ? 'Leave the park about ' + toStr(best.start - 30) + '. Home for the 19:30 bedtime.' : letter === 'd' && type === 'site' && !kids ? 'Before the shows.' : letter === 'b' && type === 'clubhouse' && !kids ? 'Clubhouse breakfast times: Unverified. Ask Guest Services.' : '' }));
    if (letter === 'd' && !kids && best.end > BEDTIME) warnings.push({ level: 'clash', text: 'Dinner runs past the 19:30 bedtime.' });
    if (letter === 'd' && !kids && type === 'out' && best.start < 16 * 60 + 30 && p === null) warnings.push({ level: 'warn', text: 'Dinner out is early (' + toStr(best.start) + ') so it finishes before the first show. Skip a show for a later sitting.' });
  };
  place('b', false); if (M.splitB && M.b && M.b !== 'home') place('b', true);
  place('d', false); if (M.splitD && M.d) place('d', true);

  // 4. other warnings
  const lunchP = placed.find((p) => p.key === 'lunch');
  for (const f of fixed.filter((x) => x.kind === 'swim')) {
    if (lunchP && lType === 'out' && f.start > lunchP.end && f.start - lunchP.end < 60) warnings.push({ level: 'warn', text: 'Swim at ' + toStr(f.shown) + ' is tight after lunch out (arrive ' + toStr(f.start) + ').' });
  }
  for (const f of fixed) if (f.end > BEDTIME && f.kind !== 'travel') warnings.push({ level: 'warn', text: f.title + ' ends after the 19:30 bedtime.' });

  // 5. assemble the timeline
  const entries = [...fixed, ...soft, ...placed].map((e) => ({ ...e, start: e.shown ?? e.start, end: e.end, blockStart: e.start }));
  if (dayId === 'mon') entries.push({ key: 'nap-optional', start: 9 * 60, end: 10 * 60, title: 'Optional toddler nap', kind: 'nap', fixed: false, optional: true, note: 'Optional, 09:00 to 10:00.' });
  entries.sort((a, b) => a.start - b.start || (a.fixed === b.fixed ? 0 : a.fixed ? -1 : 1));

  const busy = entries.filter((e) => !e.optional).map((e) => ({ s: e.blockStart ?? e.start, e: e.end })).sort((a, b) => a.s - b.s);
  const free = []; let cur = 9 * 60;
  for (const b of busy) { if (b.s - cur >= 45 && cur < 17 * 60) free.push({ start: cur, end: Math.min(b.s, 17 * 60) }); cur = Math.max(cur, b.e); }
  if (17 * 60 - cur >= 45) free.push({ start: cur, end: 17 * 60 });

  return { entries, free, warnings, reminders, meals: { breakfast: rules.breakfast === false || M.b === 'home' ? null : M.b, lunch: lunchOn ? M.l : null, dinner: rules.dinner === false ? null : M.d, splitB: !!M.splitB, splitL: split, splitD: !!M.splitD }, napLoc, fixedKeys: fixed.map((f) => f.key) };
}
