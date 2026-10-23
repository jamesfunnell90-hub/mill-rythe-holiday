// Planner rebuild engine. Pure and deterministic: no DOM, no network, no AI.
// Principle: fixed items are never moved, shortened or deleted. The engine only places the toddler's nap
// and the meals into the gaps between them, and flags clashes it cannot solve in plain words.
// Times are minutes since midnight internally; 'HH:MM' strings at the edges.

export const toMin = (t) => { const [h, m] = String(t || '').split(':').map(Number); return Number.isFinite(h) ? h * 60 + (m || 0) : null; };
export const toStr = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

export const MODES = {
  1: { label: 'Big lunch out + lodge supper', lunch: 'out', dinner: 'lodge' },
  2: { label: 'Lodge lunch + nice dinner out', lunch: 'lodge', dinner: 'out' },
  3: { label: 'Eat on site', lunch: 'lodge', dinner: 'site' },
  4: { label: 'All at the lodge', lunch: 'lodge', dinner: 'lodge' }
};
export const DEFAULT_MODE = { sat: 3, sun: 1, mon: 3, tue: 2, wed: 1 };

// The agreed day shape as timed anchors. swim blocks include 20 min to arrive and change before, and 20 after.
// fixed: true means the engine never moves it. toggle: a swim that can be switched off.
export const BASE = {
  sat: [
    { id: 'checkin', t: '16:00', dur: 30, title: 'Check in (16:00 to 18:00)', kind: 'fixed', card: 'park' },
    { id: 'drive-sat', t: '12:30', dur: 90, title: 'Drive down and supermarket collection', kind: 'travel', note: 'Half term traffic and the storm. Lunch en route.' }
  ],
  sun: [{ id: 'swim-sun', t: '09:00', dur: 75, title: 'Swim', kind: 'swim', toggle: true, card: 'pool' }, { id: 'emsworth', t: '10:45', dur: 45, title: 'Emsworth harbour stroll', kind: 'outing', card: 'emsworth' }],
  mon: [{ id: 'craft-mon', t: '10:15', dur: 45, title: 'Craft session', kind: 'activity', card: 'crafts', note: 'Book it first.' }, { id: 'swim-mon', t: '12:00', dur: 75, title: 'Swim', kind: 'swim', toggle: true, card: 'pool' }],
  tue: [{ id: 'staunton', t: '10:00', dur: 105, title: 'Staunton Farm', kind: 'outing', card: 'staunton' }, { id: 'swim-tue', t: '14:30', dur: 75, title: 'Swim', kind: 'swim', toggle: true, card: 'pool' }],
  wed: [{ id: 'checkout', t: '09:00', dur: 60, title: 'Pack and check out by 10:00', kind: 'fixed', card: 'park' }, { id: 'railway', t: '10:15', dur: 60, title: 'Seafront railway, beach or donkeys', kind: 'outing', card: 'railway' }, { id: 'drive-home', t: '13:00', dur: 120, title: 'Drive home', kind: 'travel', note: 'In the nap. Alternative: Marwell Zoo on the way home.' }]
};
export const DAY_RULES = { sat: { lunch: false }, sun: {}, mon: {}, tue: {}, wed: { dinner: false } };
const NAP_DURS = [90, 80, 70, 60];
const SWIM_PRE = 20, SWIM_POST = 20, NAP_DUR = 90, NAP_FROM = 12 * 60, NAP_TO = 15 * 60, BEDTIME = 19 * 60 + 30;
const MEAL_DUR = { out: 75, lodge: 40, site: 40 };

const overlap = (a, b) => a.start < b.end && b.start < a.end;
const step = 15;

// input: { dayId, mode, swims:{id:bool}, items:[App 1 items for the day], overrides:{lunch,dinner,nap:{t,loc?}}, napLoc? }
export function buildDay({ dayId, mode, swims = {}, items = [], overrides = {} }) {
  const rules = DAY_RULES[dayId] || {};
  const m = MODES[mode] || MODES[DEFAULT_MODE[dayId]];
  const warnings = [], reminders = [];
  const fixed = [], soft = [];

  // 1. fixed anchors
  for (const a of BASE[dayId] || []) {
    if (a.toggle && swims[a.id] === false) { reminders.push('Swim at ' + a.t + ' is switched off. Cancel it on the activity booking site or with Guest Services: this app never cancels anything.'); continue; }
    const s = toMin(a.t);
    const isSwim = a.kind === 'swim';
    fixed.push({ key: a.id, start: s - (isSwim ? SWIM_PRE : 0), end: s + a.dur + (isSwim ? SWIM_POST : 0), title: a.title + (isSwim ? ' (arrive ' + toStr(s - SWIM_PRE) + ')' : ''), kind: a.kind, fixed: true, note: a.note || '', card: a.card, shown: s });
  }
  for (const i of items) {
    const s = toMin(i.time); if (s === null) continue;
    const dur = Number(i.dur) || 45;
    if (i.kind === 'show') { if (i.go) fixed.push({ key: 'item:' + i.id, itemId: i.id, start: s, end: s + dur, title: i.name, kind: 'show', fixed: true, note: [i.place, dur + ' min'].filter(Boolean).join(', '), shown: s }); }
    else if (i.booked) fixed.push({ key: 'item:' + i.id, itemId: i.id, start: s, end: s + dur, title: i.name, kind: 'added', fixed: true, note: [i.place, dur + ' min', i.notes].filter(Boolean).join(', '), shown: s, booked: true });
    else soft.push({ key: 'item:' + i.id, itemId: i.id, start: s, end: s + dur, title: i.name, kind: 'added', fixed: false, note: [i.place, dur + ' min', i.notes].filter(Boolean).join(', '), shown: s });
  }
  const travel = fixed.filter((f) => f.kind === 'travel');
  const hard = fixed.filter((f) => f.kind !== 'travel');
  const placed = [];

  // clashes between fixed items: never resolved by moving, only flagged
  for (let a = 0; a < fixed.length; a++) for (let b = a + 1; b < fixed.length; b++) {
    if (overlap(fixed[a], fixed[b])) warnings.push({ level: 'clash', text: fixed[a].title + ' (' + toStr(fixed[a].shown ?? fixed[a].start) + ') overlaps ' + fixed[b].title + ' (' + toStr(fixed[b].shown ?? fixed[b].start) + '). Fixed items are never moved: change one by hand.' });
  }

  const blocked = (blk, extra = []) => hard.concat(extra).some((f) => overlap(blk, f));
  const softHits = (blk) => soft.filter((f) => overlap(blk, f)).length;
  const insideTravel = (blk) => travel.some((t) => blk.start >= t.start && blk.end <= t.end);

  // 2. lunch and nap, searched together
  const hasLunch = rules.lunch !== false;
  const lunchType = m.lunch;
  const lunchDur = MEAL_DUR[lunchType];
  const lunchPref = lunchType === 'out' ? 11 * 60 + 45 : 12 * 60 + 15;
  const napPref = lunchType === 'out' ? lunchPref + lunchDur : 13 * 60;
  const lunchPin = overrides.lunch && toMin(overrides.lunch.t) !== null ? toMin(overrides.lunch.t) : null;
  const napPin = overrides.nap && toMin(overrides.nap.t) !== null ? toMin(overrides.nap.t) : null;

  let lunch = null, nap = null, best = Infinity;
  const lunchStarts = !hasLunch ? [null] : lunchPin !== null ? [lunchPin] : range(10 * 60 + 30, 13 * 60 + 30);
  const consider = (L, N) => {
    const car = insideTravel(N);
    let cost = 0;
    if (L) { cost += 2 * Math.abs(L.start - lunchPref); if (N.start < L.end) cost += 60; else if (N.start - L.end > 30) cost += (N.start - L.end - 30) * 0.5; cost += 40 * softHits(L); }
    cost += Math.abs(N.start - napPref) * 0.5 + 40 * softHits(N) - (car ? 40 : 0) + (NAP_DUR - (N.end - N.start)) * 1.5;
    if (cost < best) { best = cost; lunch = L; nap = N; }
  };
  for (const ls of lunchStarts) {
    const L = ls === null ? null : { start: ls, end: ls + lunchDur };
    if (L && lunchPin === null && blocked(L)) continue;
    for (const nd of napPin !== null ? [NAP_DUR] : NAP_DURS) {
      for (const ns of napPin !== null ? [napPin] : range(NAP_FROM, NAP_TO - nd, 5)) {
        const N = { start: ns, end: ns + nd };
        if (napPin === null && blocked(N)) continue;
        if (L && overlap(L, N)) continue;
        consider(L, N);
      }
    }
  }
  if (!nap && hasLunch) {
    // no nap fits anywhere: still place lunch in the best free gap, then flag the nap
    for (const ls of lunchStarts) { const L = { start: ls, end: ls + lunchDur }; if (lunchPin === null && blocked(L)) continue; const cost = Math.abs(L.start - lunchPref) + 40 * softHits(L); if (cost < best) { best = cost; lunch = L; } }
  }
  if (nap && nap.end - nap.start < NAP_DUR) warnings.push({ level: 'warn', text: 'The nap is squeezed to ' + (nap.end - nap.start) + ' minutes between the fixed items.' });
  if (!nap) warnings.push({ level: 'clash', text: 'The toddler\'s main nap cannot happen anywhere between 12:00 and 15:00: no gap of even an hour is free of fixed items. Move or switch off one of them.' });
  if (hasLunch && !lunch && lunchPin === null) warnings.push({ level: 'clash', text: 'There is no gap for lunch that avoids the fixed items. Set lunch by hand.' });

  if (hasLunch && lunch) {
    placed.push({ key: 'lunch', start: lunch.start, end: lunch.end, title: lunchType === 'out' ? 'Big lunch out' : 'Lodge lunch', kind: 'meal', fixed: false, handSet: lunchPin !== null, meal: lunchType, note: lunchType === 'out' ? 'Venue not chosen. See the Wednesday and Sunday cards.' : '' });
  }
  let napLoc = null;
  if (nap) {
    napLoc = (overrides.nap && overrides.nap.loc) || (insideTravel(nap) ? 'Car' : lunchType === 'out' && hasLunch ? 'Car' : dayId === 'sat' ? 'Car' : 'Lodge');
    placed.push({ key: 'nap', start: nap.start, end: nap.end, title: 'Toddler nap: ' + napLoc, kind: 'nap', fixed: false, handSet: napPin !== null || !!(overrides.nap && overrides.nap.loc), loc: napLoc, note: napLoc === 'Car' && insideTravel(nap) ? 'Car nap: the drive falls in the nap window.' : 'Main nap, about 90 minutes.' });
    if (lunch && lunchType === 'out') warnings.push({ level: 'info', text: 'Lunch is out: the toddler sleeps in the ' + (napLoc === 'Pushchair' ? 'pushchair' : 'car or pushchair') + ' afterwards.' });
  }

  // 3. dinner
  const dinnerType = m.dinner;
  if (rules.dinner !== false) {
    const dDur = MEAL_DUR[dinnerType], lead = dinnerType === 'out' ? 30 : 0;
    const dPin = overrides.dinner && toMin(overrides.dinner.t) !== null ? toMin(overrides.dinner.t) : null;
    const prefStart = dinnerType === 'lodge' ? 16 * 60 + 45 : 17 * 60;
    let dinner = null, db = Infinity;
    for (const s of dPin !== null ? [dPin] : range(15 * 60 + 30, 18 * 60 + 15)) {
      const blk = { start: s - lead, end: s + dDur };
      if (dPin === null && (blocked(blk, placed.filter((p) => p.key !== 'dinner')) )) continue;
      if (dPin === null && blk.end > BEDTIME - 15) continue;
      const cost = Math.abs(s - prefStart) + 40 * softHits(blk);
      if (cost < db) { db = cost; dinner = { start: s, end: s + dDur, lead }; }
    }
    const label = { out: 'Nice dinner out', site: 'Dinner on site (Green Room)', lodge: 'Light lodge supper' }[dinnerType];
    if (dinner) {
      placed.push({ key: 'dinner', start: dinner.start, end: dinner.end, title: label, kind: 'meal', fixed: false, handSet: dPin !== null, meal: dinnerType, note: dinnerType === 'out' ? 'Leave the park about ' + toStr(dinner.start - 30) + '. Home for the 19:30 bedtime.' : dinnerType === 'site' ? 'Before the shows.' : '' });
      if (dinnerType === 'out' && dinner.start < 16 * 60 + 30 && dPin === null) warnings.push({ level: 'warn', text: 'Dinner out is early (' + toStr(dinner.start) + ') so it finishes before the first show. Skip a show for a later sitting.' });
      if (dinner.end > BEDTIME) warnings.push({ level: 'clash', text: 'Dinner runs past the 19:30 bedtime.' });
    } else warnings.push({ level: 'clash', text: 'There is no gap for dinner that avoids the fixed items and protects the 19:30 bedtime. Set it by hand or skip a show.' });
  }

  // 4. other warnings
  const lunchP = placed.find((p) => p.key === 'lunch');
  for (const f of fixed.filter((x) => x.kind === 'swim')) {
    if (lunchP && lunchType === 'out' && f.start > lunchP.end && f.start - lunchP.end < 60) warnings.push({ level: 'warn', text: 'Swim at ' + toStr(f.shown) + ' is tight after lunch out (arrive ' + toStr(f.start) + ').' });
  }
  for (const f of fixed) if (f.end > BEDTIME && f.kind !== 'travel') warnings.push({ level: 'warn', text: f.title + ' ends after the 19:30 bedtime.' });

  // 5. assemble the timeline
  const entries = [...fixed, ...soft, ...placed].map((e) => ({ ...e, start: e.shown ?? e.start, end: e.end, blockStart: e.start }));
  if (dayId === 'mon') entries.push({ key: 'nap-optional', start: 9 * 60, end: 10 * 60, title: 'Optional toddler nap', kind: 'nap', fixed: false, optional: true, note: 'Optional, 09:00 to 10:00.' });
  entries.sort((a, b) => a.start - b.start || (a.fixed === b.fixed ? 0 : a.fixed ? -1 : 1));

  // free windows of 45 minutes or more between 09:00 and 17:00 (suggestions are Gate 4)
  const busy = entries.filter((e) => !e.optional).map((e) => ({ s: e.blockStart ?? e.start, e: e.end })).sort((a, b) => a.s - b.s);
  const free = []; let cur = 9 * 60;
  for (const b of busy) { if (b.s - cur >= 45 && cur < 17 * 60) free.push({ start: cur, end: Math.min(b.s, 17 * 60) }); cur = Math.max(cur, b.e); }
  if (17 * 60 - cur >= 45) free.push({ start: cur, end: 17 * 60 });

  return { entries, free, warnings, reminders, meals: { lunch: hasLunch ? lunchType : null, dinner: rules.dinner === false ? null : dinnerType }, napLoc, fixedKeys: fixed.map((f) => f.key) };
}

function range(a, b, st = step) { const r = []; for (let x = a; x <= b; x += st) r.push(x); return r; }
