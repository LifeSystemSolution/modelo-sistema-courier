// Sustituto local de firebase-auth (modo DEMO).
import { getSession, loadDb, newId, saveDb, setSession } from "./store.js";

const instances = new Map();
const listeners = new Set();

export function getAuth(app = { name: "[DEFAULT]" }) {
  if (!instances.has(app.name)) {
    const primary = app.name === "[DEFAULT]";
    instances.set(app.name, { primary, currentUser: primary ? getSession() : null });
  }
  return instances.get(app.name);
}

function setUser(auth, user) {
  auth.currentUser = user;
  if (auth.primary) { setSession(user); listeners.forEach(({ a, cb }) => a === auth && cb(user)); }
}

export async function signInWithEmailAndPassword(auth, email, password) {
  const account = loadDb().accounts[String(email).trim().toLowerCase()];
  if (!account || account.password !== password) throw Object.assign(new Error("auth/invalid-credential"), { code: "auth/invalid-credential" });
  const user = { uid: account.uid, email: String(email).trim().toLowerCase() };
  setUser(auth, user);
  return { user };
}

export async function createUserWithEmailAndPassword(auth, email, password) {
  const db = loadDb();
  const key = String(email).trim().toLowerCase();
  if (db.accounts[key]) throw Object.assign(new Error("auth/email-already-in-use"), { code: "auth/email-already-in-use" });
  const uid = `usr${newId()}`;
  db.accounts[key] = { uid, password };
  saveDb();
  const user = { uid, email: key };
  setUser(auth, user);
  return { user };
}

export async function signOut(auth) { setUser(auth, null); }

export function onAuthStateChanged(auth, cb) {
  const entry = { a: auth, cb };
  listeners.add(entry);
  setTimeout(() => cb(auth.currentUser), 0);
  return () => listeners.delete(entry);
}
