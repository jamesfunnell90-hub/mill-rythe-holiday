import { FIREBASE_CONFIG } from './firebase-config.js';
import { SEED } from './data.js';

const COLLS = ['shopping', 'packing', 'bookings', 'items'];
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const subs = {};
let fs = null;
let db = null;
export let mode = 'local'; // 'local' or 'shared'

const lsKey = (c) => 'mrh:' + c;
const readLocal = (c) => { try { return JSON.parse(localStorage.getItem(lsKey(c)) || '[]'); } catch (e) { return []; } };
const writeLocal = (c, rows) => { try { localStorage.setItem(lsKey(c), JSON.stringify(rows)); } catch (e) { /* storage blocked */ } };
const cache = {};
const emit = (c, rows) => { cache[c] = rows; (subs[c] || []).forEach((cb) => cb(rows)); };
const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

export function subscribe(c, cb) {
  (subs[c] = subs[c] || []).push(cb);
  if (mode === 'local') cb(readLocal(c).sort(byOrder));
  else if (cache[c]) cb(cache[c]);
}

function seedLocal() {
  try {
    if (localStorage.getItem('mrh:seeded1')) return;
    COLLS.forEach((c) => writeLocal(c, SEED[c]));
    localStorage.setItem('mrh:seeded1', '1');
  } catch (e) { /* ignore */ }
}

export async function init() {
  if (!FIREBASE_CONFIG) { seedLocal(); return; }
  try {
    const app = await import(SDK + 'firebase-app.js');
    const auth = await import(SDK + 'firebase-auth.js');
    fs = await import(SDK + 'firebase-firestore.js');
    const a = app.initializeApp(FIREBASE_CONFIG);
    db = fs.initializeFirestore(a, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) });
    try { await auth.signInAnonymously(auth.getAuth(a)); } catch (e) { console.warn('anon auth failed (offline?)', e); }
    mode = 'shared';
    COLLS.forEach((c) => {
      fs.onSnapshot(fs.collection(db, c), (snap) => emit(c, snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byOrder)), (err) => console.warn(c, err));
    });
    seedShared();
  } catch (e) {
    console.warn('Firebase unavailable, using local mode', e);
    mode = 'local';
    seedLocal();
  }
}

async function seedShared() {
  try {
    const ref = fs.doc(db, 'meta', 'seed1');
    const snap = await fs.getDoc(ref);
    if (snap.exists()) return;
    for (const c of COLLS) for (const row of SEED[c]) { const { id, ...rest } = row; await fs.setDoc(fs.doc(db, c, id), rest); }
    await fs.setDoc(ref, { at: Date.now() });
  } catch (e) { console.warn('seed skipped', e); }
}

export function add(c, data) {
  const id = 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const row = { order: Date.now(), ...data };
  if (mode === 'shared') { fs.setDoc(fs.doc(db, c, id), row); return; }
  const rows = readLocal(c); rows.push({ id, ...row }); writeLocal(c, rows); emit(c, rows.sort(byOrder));
}
export function update(c, id, patch) {
  if (mode === 'shared') { fs.updateDoc(fs.doc(db, c, id), patch); return; }
  const rows = readLocal(c).map((r) => (r.id === id ? { ...r, ...patch } : r)); writeLocal(c, rows); emit(c, rows.sort(byOrder));
}
export function remove(c, id) {
  if (mode === 'shared') { fs.deleteDoc(fs.doc(db, c, id)); return; }
  const rows = readLocal(c).filter((r) => r.id !== id); writeLocal(c, rows); emit(c, rows.sort(byOrder));
}

window.addEventListener('storage', (e) => {
  if (mode === 'local' && e.key && e.key.startsWith('mrh:') && COLLS.includes(e.key.slice(4))) emit(e.key.slice(4), readLocal(e.key.slice(4)).sort(byOrder));
});
