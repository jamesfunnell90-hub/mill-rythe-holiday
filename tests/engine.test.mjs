import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDay, MODES, BASE, DEFAULT_MODE, toMin, toStr } from '../planner/engine.js';
import { SEED, DAYS } from '../js/data.js';

const DAY_IDS = DAYS.map((d) => d.id);
const showsFor = (day) => SEED.items.filter((i) => i.day === day);
const swimsOf = (day) => (BASE[day] || []).filter((a) => a.toggle).map((a) => a.id);
const combos = (ids) => ids.reduce((acc, id) => acc.flatMap((c) => [{ ...c, [id]: true }, { ...c, [id]: false }]), [{}]);
const hardOverlap = (a, b) => (a.blockStart ?? a.start) < b.end && (b.blockStart ?? b.start) < a.end;

test('every day x every meal mode x swims on/off: no overlaps, fixed unmoved, nap held or flagged', () => {
  let runs = 0;
  for (const day of DAY_IDS) for (const mode of [1, 2, 3, 4]) for (const swims of combos(swimsOf(day))) {
    runs++;
    const items = showsFor(day);
    const r = buildDay({ dayId: day, mode, swims, items });
    const label = day + ' mode ' + mode + ' ' + JSON.stringify(swims);
    // fixed items appear exactly as defined
    const expectedFixed = (BASE[day] || []).filter((a) => !(a.toggle && swims[a.id] === false)).map((a) => a.id)
      .concat(items.filter((i) => i.kind === 'show' && i.go).map((i) => 'item:' + i.id));
    for (const k of expectedFixed) assert.ok(r.entries.find((e) => e.key === k), label + ': fixed item ' + k + ' missing');
    // fixed items match their definition: never moved or shortened
    for (const a of BASE[day] || []) { const e = r.entries.find((x) => x.key === a.id); if (!e) continue; assert.equal(toStr(e.start), a.t, label + ' ' + a.id + ' moved'); assert.equal(e.end - (a.toggle ? 20 : 0) - toMin(a.t), a.dur, label + ' ' + a.id + ' resized'); }
    // placed meals and nap never overlap a non-travel fixed item
    const hard = r.entries.filter((e) => e.fixed && e.kind !== 'travel');
    for (const p of r.entries.filter((e) => !e.fixed && ['meal', 'nap'].includes(e.kind) && !e.optional)) for (const f of hard) assert.ok(!hardOverlap(p, f), label + ': ' + p.title + ' overlaps ' + f.title);
    // meals and nap do not overlap each other
    const mv = r.entries.filter((e) => !e.fixed && ['meal', 'nap'].includes(e.kind) && !e.optional);
    for (let a = 0; a < mv.length; a++) for (let b = a + 1; b < mv.length; b++) assert.ok(!hardOverlap(mv[a], mv[b]), label + ': ' + mv[a].title + ' overlaps ' + mv[b].title);
    // nap held or a clash warning
    const nap = r.entries.find((e) => e.key === 'nap');
    assert.ok(nap || r.warnings.some((w) => /nap cannot happen/.test(w.text)), label + ': nap neither held nor flagged');
    if (nap) { assert.ok(nap.start >= 12 * 60 && nap.end <= 15 * 60, label + ': nap outside 12:00 to 15:00'); assert.ok(['Lodge', 'Pushchair', 'Car'].includes(nap.loc)); }
    // no unexplained clashes among fixed items
    // Clashes between fixed items must not exist by default. The only clashes allowed are honest placement failures
    // (no gap for lunch or dinner, nap cannot happen): flagged in words, never solved by moving a fixed item.
    const clashes = r.warnings.filter((w) => w.level === 'clash');
    for (const w of clashes) assert.match(w.text, /no gap for|cannot happen anywhere|\) overlaps /, label + ': ' + w.text);
    assert.ok(!clashes.some((w) => /\) overlaps /.test(w.text)), label + ': default fixed items overlap: ' + JSON.stringify(clashes));
    if (!nap) assert.ok(clashes.some((w) => /nap cannot happen/.test(w.text)));
    if (!r.entries.find((e) => e.key === 'dinner') && r.meals.dinner) assert.ok(clashes.some((w) => /dinner/.test(w.text)), label + ': dinner missing without a flag');
    if (!r.entries.find((e) => e.key === 'lunch') && r.meals.lunch) assert.ok(clashes.some((w) => /lunch/.test(w.text)), label + ': lunch missing without a flag');
    // bedtime protected: dinner ends before 19:30
    const dinner = r.entries.find((e) => e.key === 'dinner'); if (dinner) assert.ok(dinner.end <= 19 * 60 + 30, label + ': dinner past bedtime');
  }
  assert.equal(runs, 32); // sat 4 + sun 8 + mon 8 + tue 8 + wed 4
});

test('Tue "Big lunch out", swim off', () => {
  const r = buildDay({ dayId: 'tue', mode: 1, swims: { 'swim-tue': false }, items: showsFor('tue') });
  assert.ok(r.entries.every((e) => e.key !== 'swim-tue'));
  assert.equal(r.meals.lunch, 'out'); assert.equal(r.meals.dinner, 'lodge');
  assert.ok(r.reminders.some((m) => /cancel/i.test(m)));
  const lunch = r.entries.find((e) => e.key === 'lunch'), staunton = r.entries.find((e) => e.key === 'staunton');
  assert.ok(lunch.start >= staunton.end, 'lunch after the farm');
  assert.equal(r.entries.find((e) => e.key === 'nap').loc, 'Car');
});

test('Mon "Eat on site"', () => {
  const r = buildDay({ dayId: 'mon', mode: 3, swims: {}, items: showsFor('mon') });
  const dinner = r.entries.find((e) => e.key === 'dinner');
  assert.equal(dinner.meal, 'site'); assert.equal(toStr(dinner.start), '17:00'); assert.ok(dinner.end <= toMin('17:40'));
  assert.equal(r.meals.lunch, 'lodge');
});

test('adding a booked craft Tue 15:00 for 45 min: fixed items stay put and a clash is flagged', () => {
  const items = showsFor('tue').concat([{ id: 'x1', day: 'tue', time: '15:00', dur: 45, name: 'Craft session', place: 'On site', booked: true, kind: 'added' }]);
  const on = buildDay({ dayId: 'tue', mode: 2, swims: {}, items });
  const craft = on.entries.find((e) => e.key === 'item:x1'); assert.equal(toStr(craft.start), '15:00'); assert.equal(craft.end - craft.start, 45);
  const swim = on.entries.find((e) => e.key === 'swim-tue'); assert.equal(toStr(swim.start), '14:30');
  assert.ok(on.warnings.some((w) => w.level === 'clash' && /Craft session/.test(w.text) && /Swim/.test(w.text)));
  const off = buildDay({ dayId: 'tue', mode: 2, swims: { 'swim-tue': false }, items });
  assert.deepEqual(off.warnings.filter((w) => w.level === 'clash'), []);
  assert.ok(off.entries.find((e) => e.key === 'dinner').start >= toMin('16:00') - 30);
  assert.ok(off.entries.find((e) => e.key === 'nap'), 'nap still held');
});

test('a manual override is kept on rebuild and removing it restores the default', () => {
  const base = buildDay({ dayId: 'mon', mode: 3, items: showsFor('mon') });
  const pinned = buildDay({ dayId: 'mon', mode: 3, items: showsFor('mon'), overrides: { nap: { t: '13:45', loc: 'Pushchair' } } });
  const n = pinned.entries.find((e) => e.key === 'nap');
  assert.equal(toStr(n.start), '13:45'); assert.equal(n.loc, 'Pushchair'); assert.equal(n.handSet, true);
  const again = buildDay({ dayId: 'mon', mode: 4, items: showsFor('mon'), overrides: { nap: { t: '13:45', loc: 'Pushchair' } } });
  assert.equal(toStr(again.entries.find((e) => e.key === 'nap').start), '13:45');
  const undone = buildDay({ dayId: 'mon', mode: 3, items: showsFor('mon'), overrides: {} });
  assert.deepEqual(undone.entries.map((e) => [e.key, e.start]), base.entries.map((e) => [e.key, e.start]));
});

test('Wednesday: drive home falls in the nap window, so it is a car nap', () => {
  const r = buildDay({ dayId: 'wed', mode: 1, items: [] });
  const nap = r.entries.find((e) => e.key === 'nap');
  assert.equal(nap.loc, 'Car'); assert.match(nap.note, /Car nap/);
});

test('deterministic', () => {
  const a = buildDay({ dayId: 'sun', mode: 2, swims: { 'swim-sun': true }, items: showsFor('sun') });
  const b = buildDay({ dayId: 'sun', mode: 2, swims: { 'swim-sun': true }, items: showsFor('sun') });
  assert.deepEqual(a, b);
});

test('show skipped frees the evening; show Go anchors dinner before it', () => {
  const items = showsFor('tue'); // both skipped by default
  const r = buildDay({ dayId: 'tue', mode: 3, items });
  assert.ok(!r.entries.some((e) => e.kind === 'show' && e.fixed));
  const go = items.map((i) => ({ ...i, go: true }));
  const r2 = buildDay({ dayId: 'tue', mode: 3, items: go });
  const d = r2.entries.find((e) => e.key === 'dinner'); assert.ok(d.end <= toMin('17:40'));
});
