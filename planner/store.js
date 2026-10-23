// Planner data layer. Independent of App 1's store so App 1 cannot be broken from here.
// Shares the same Firestore project and collections; day settings live in `meta` docs named plan-<day>.
import { FIREBASE_CONFIG } from '../js/firebase-config.js';
import { SEED } from '../js/data.js';

const COLLS = ['shopping', 'bookings', 'items', 'meta'];
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const subs = {}, cache = {};
let fs = null, db = null;
export let mode = 'local';

const lsKey = (c) => 'mrh:' + c;
const readLocal = (c) => { try { return JSON.parse(localStorage.getItem(lsKey(c)) || '[]'); } catch (e) { return []; } };
const writeLocal = (c, rows) => { try { localStorage.setItem(lsKey(c), JSON.stringify(rows)); } catch (e) { /* blocked */ } };
const emit = (c, rows) => { cache[c] = rows; (subs[c] || []).forEach((cb) => cb(rows)); };
const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

export function subscribe(c, cb) {
  (subs[c] = subs[c] || []).push(cb);
  if (mode === 'local') cb(readLocal(c).sort(byOrder)); else if (cache[c]) cb(cache[c]);
}

export async function init() {
  if (!FIREBASE_CONFIG || /[?&]local=1/.test(location.search)) { try { if (!localStorage.getItem('mrh:seeded1')) { Object.keys(SEED).forEach((c) => writeLocal(c, SEED[c])); localStorage.setItem('mrh:seeded1', '1'); } } catch (e) { /* ignore */ } return; }
  try {
    const app = await import(SDK + 'firebase-app.js');
    const auth = await import(SDK + 'firebase-auth.js');
    fs = await import(SDK + 'firebase-firestore.js');
    const a = app.initializeApp(FIREBASE_CONFIG);
    db = fs.initializeFirestore(a, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) });
    try { await auth.signInAnonymously(auth.getAuth(a)); } catch (e) { console.warn('anon auth failed (offline?)', e); }
    mode = 'shared';
    COLLS.forEach((c) => fs.onSnapshot(fs.collection(db, c), (snap) => emit(c, snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byOrder)), (err) => console.warn(c, err)));
  } catch (e) { console.warn('Firebase unavailable, local mode', e); mode = 'local'; }
}

// upsert: create or merge fields at a known id (used for day settings and knock-on rows)
export function set(c, id, data) {
  if (mode === 'shared') { fs.setDoc(fs.doc(db, c, id), data, { merge: true }); return; }
  const rows = readLocal(c); const i = rows.findIndex((r) => r.id === id);
  if (i >= 0) rows[i] = { ...rows[i], ...data }; else rows.push({ id, order: Date.now(), ...data });
  writeLocal(c, rows); emit(c, rows.sort(byOrder));
}
export function add(c, data) { const id = 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); set(c, id, { order: Date.now(), ...data }); return id; }
export function remove(c, id) {
  if (mode === 'shared') { fs.deleteDoc(fs.doc(db, c, id)); return; }
  const rows = readLocal(c).filter((r) => r.id !== id); writeLocal(c, rows); emit(c, rows.sort(byOrder));
}
window.addEventListener('storage', (e) => { if (mode === 'local' && e.key && e.key.startsWith('mrh:') && COLLS.includes(e.key.slice(4))) emit(e.key.slice(4), readLocal(e.key.slice(4)).sort(byOrder)); });
