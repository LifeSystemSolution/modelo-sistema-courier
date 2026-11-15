// Sustituto local de firebase-firestore (modo DEMO).
import { Timestamp, listDocs, newId, readDoc, writeDoc } from "./store.js";

export { Timestamp };

const SERVER_TS = { __sentinel: "serverTimestamp" };
export function serverTimestamp() { return SERVER_TS; }
export function arrayUnion(...items) { return { __sentinel: "arrayUnion", items }; }

export function getFirestore() { return { type: "firestore" }; }
export function collection(_db, name) { return { type: "collection", name }; }
export function doc(_db, name, id) { return { type: "doc", col: name, id, path: `${name}/${id}` }; }
export function where(field, op, value) { return { kind: "where", field, op, value }; }
export function limit(n) { return { kind: "limit", n }; }
export function query(ref, ...constraints) { return { type: "query", name: ref.name, constraints }; }

function snapshotOf(id, data) {
  return { id, exists: () => data !== undefined, data: () => data, get: (f) => data?.[f] };
}

function matches(data, c) {
  const v = data[c.field];
  switch (c.op) {
    case "==": return v === c.value;
    case "!=": return v !== c.value;
    case "<": return v < c.value;
    case "<=": return v <= c.value;
    case ">": return v > c.value;
    case ">=": return v >= c.value;
    case "in": return c.value.includes(v);
    case "array-contains": return Array.isArray(v) && v.includes(c.value);
    default: return false;
  }
}

export async function getDocs(ref) {
  const constraints = ref.constraints || [];
  let rows = listDocs(ref.name).filter(({ data }) => constraints.filter((c) => c.kind === "where").every((c) => matches(data, c)));
  const lim = constraints.find((c) => c.kind === "limit");
  if (lim) rows = rows.slice(0, lim.n);
  const docs = rows.map(({ id, data }) => snapshotOf(id, data));
  return { docs, empty: docs.length === 0, size: docs.length, forEach: (fn) => docs.forEach(fn) };
}

export async function getDoc(ref) { return snapshotOf(ref.id, readDoc(ref.col, ref.id)); }

function resolve(value, previous) {
  if (value === SERVER_TS || value?.__sentinel === "serverTimestamp") return Timestamp.now();
  if (value?.__sentinel === "arrayUnion") {
    const base = Array.isArray(previous) ? [...previous] : [];
    value.items.forEach((item) => base.push(item));
    return base;
  }
  return value;
}
function applyFields(target, fields) {
  Object.entries(fields).forEach(([k, v]) => { target[k] = resolve(v, target[k]); });
  return target;
}

export async function addDoc(colRef, data) {
  const id = newId();
  writeDoc(colRef.name, id, applyFields({}, data));
  return doc(null, colRef.name, id);
}
export async function setDoc(ref, data, options = {}) {
  const base = options.merge ? (readDoc(ref.col, ref.id) || {}) : {};
  writeDoc(ref.col, ref.id, applyFields(base, data));
}
export async function updateDoc(ref, data) {
  const current = readDoc(ref.col, ref.id);
  if (current === undefined) throw new Error("not-found");
  writeDoc(ref.col, ref.id, applyFields(current, data));
}
export function writeBatch() {
  const ops = [];
  return {
    set(ref, data, options) { ops.push(() => setDoc(ref, data, options)); return this; },
    update(ref, data) { ops.push(() => updateDoc(ref, data)); return this; },
    async commit() { for (const op of ops) await op(); }
  };
}
