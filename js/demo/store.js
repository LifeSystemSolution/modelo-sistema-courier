// Modo DEMO: reemplaza Firebase por una base de datos local (localStorage) con datos ficticios.
// Cada visitante trabaja con su propia copia; nada se envía a ningún servidor.

const DB_KEY = "lifecargo.demo.db.v2";
const SESSION_KEY = "lifecargo.demo.session.v1";

export class Timestamp {
  constructor(seconds, nanoseconds = 0) { this.seconds = seconds; this.nanoseconds = nanoseconds; }
  static now() { return Timestamp.fromMillis(Date.now()); }
  static fromDate(date) { return Timestamp.fromMillis(date.getTime()); }
  static fromMillis(ms) { return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6); }
  toMillis() { return this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6); }
  toDate() { return new Date(this.toMillis()); }
}

// ---- serialización ----
function encode(value) {
  if (value instanceof Timestamp) return { __ts: value.toMillis() };
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)]));
  return value;
}
function decode(value) {
  if (Array.isArray(value)) return value.map(decode);
  if (value && typeof value === "object") {
    if ("__ts" in value) return Timestamp.fromMillis(value.__ts);
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, decode(v)]));
  }
  return value;
}

// ---- datos de ejemplo ----
const DAY = 86400000;
function seed() {
  const now = Date.now();
  const t = (daysAgo, hours = 9) => ({ __ts: now - daysAgo * DAY - (24 - hours) * 3600000 + 12 * 3600000 });
  const EMPRESA = "LIFECARGO";
  const almacenes = {
    alm_lima: { nombre: "Almacén Central Lima", ciudad: "Lima", direccion: "Av. Industrial 1200, Ate", estado: "ACTIVO", empresaId: EMPRESA },
    alm_aqp: { nombre: "Almacén Arequipa", ciudad: "Arequipa", direccion: "Av. Ejército 850", estado: "ACTIVO", empresaId: EMPRESA },
    alm_tru: { nombre: "Almacén Trujillo", ciudad: "Trujillo", direccion: "Av. América Norte 410", estado: "ACTIVO", empresaId: EMPRESA },
    alm_cus: { nombre: "Almacén Cusco", ciudad: "Cusco", direccion: "Av. La Cultura 2100", estado: "ACTIVO", empresaId: EMPRESA }
  };
  const base = { empresaId: EMPRESA, empresa: "LifeCargo Express S.A.C.", estado: "ACTIVO", fechaCreacion: t(30) };
  const usuarios = {
    adm00001: { ...base, nombres: "Lucía", apellidoPaterno: "Fernández", apellidoMaterno: "Ríos", dni: "40000001", telefono: "900000001", correo: "admin@lifecargo.demo", email: "admin@lifecargo.demo", rol: "SUPER_ADMIN", almacenId: null, almacen_id: null, uid: "adm00001" },
    ope00001: { ...base, nombres: "Carlos", apellidoPaterno: "Mendoza", apellidoMaterno: "Paz", dni: "40000002", telefono: "900000002", correo: "operador@lifecargo.demo", email: "operador@lifecargo.demo", rol: "OPERADOR", almacenId: "alm_lima", almacen_id: "alm_lima", almacenNombre: "Almacén Central Lima", uid: "ope00001" },
    tra00001: { ...base, nombres: "Jorge", apellidoPaterno: "Quispe", apellidoMaterno: "Torres", dni: "40000003", telefono: "900000003", correo: "transportista@lifecargo.demo", email: "transportista@lifecargo.demo", rol: "TRANSPORTISTA", almacenId: null, almacen_id: null, uid: "tra00001" }
  };
  const persona = (id, nombres, ap, am, dni, tel, dir) => [id, { tipoCliente: "natural", nombres, apellidoPaterno: ap, apellidoMaterno: am, nombreCompleto: `${nombres} ${ap} ${am}`, dni, telefono: tel, correo: "", direccion: dir, user_id: "adm00001", almacenId: "alm_lima", almacen_id: "alm_lima", fecha_registro: t(20) }];
  const empresa = (id, razon, ruc, tel, dir) => [id, { tipoCliente: "empresa", razonSocial: razon, nombreBusqueda: razon, ruc, telefono: tel, correo: "", direccion: dir, user_id: "adm00001", almacenId: "alm_lima", almacen_id: "alm_lima", fecha_registro: t(18) }];
  const clientes = Object.fromEntries([
    persona("c1", "María", "Gonzales", "Vega", "70000011", "911000001", "Jr. Las Flores 120, Lima"),
    persona("c2", "Pedro", "Salazar", "Huamán", "70000012", "911000002", "Av. Los Pinos 455, Lima"),
    persona("c3", "Rosa", "Campos", "Díaz", "70000013", "911000003", "Calle Lima 89, Arequipa"),
    empresa("c4", "Comercial Andina Demo S.A.C.", "20100000001", "911000004", "Av. Argentina 3000, Lima"),
    empresa("c5", "Distribuidora Norte Demo E.I.R.L.", "20100000002", "911000005", "Av. España 777, Trujillo"),
    empresa("c6", "Textiles del Sur Demo S.R.L.", "20100000003", "911000006", "Av. Dolores 250, Arequipa")
  ]);
  const flujo = ["recibido", "almacen_origen", "en_ruta", "almacen_destino", "pendiente_entrega", "entregado", "entrega_confirmada"];
  const dest = [["Ana", "López", "Soto"], ["Luis", "Ramos", "Vera"], ["Elena", "Cruz", "Ponce"], ["Diego", "Flores", "León"], ["Sofía", "Rojas", "Mejía"], ["Raúl", "Castro", "Núñez"]];
  const plan = [
    ["c1", "alm_lima", "alm_aqp", 6, 0, "Caja con documentos", 35],
    ["c4", "alm_lima", "alm_tru", 6, 6, "Mercadería - 3 cajas", 120],
    ["c2", "alm_lima", "alm_cus", 5, 2, "Encomienda personal", 45],
    ["c5", "alm_tru", "alm_lima", 5, 5, "Repuestos de maquinaria", 210],
    ["c6", "alm_aqp", "alm_lima", 4, 3, "Rollos de tela", 180],
    ["c3", "alm_aqp", "alm_cus", 3, 4, "Paquete pequeño", 25],
    ["c4", "alm_lima", "alm_aqp", 2, 2, "Electrodomésticos", 260],
    ["c1", "alm_lima", "alm_tru", 1, 1, "Sobre con contratos", 18],
    ["c5", "alm_tru", "alm_aqp", 1, 0, "Cajas de producto", 95],
    ["c2", "alm_lima", "alm_cus", 0, 0, "Equipaje", 60],
    ["c6", "alm_aqp", "alm_tru", 0, 1, "Muestras textiles", 40]
  ];
  const envios = {};
  plan.forEach(([cid, o, d, daysAgo, paso, descripcion, precio], i) => {
    const c = clientes[cid];
    const [n, ap, am] = dest[i % dest.length];
    const historial = flujo.slice(0, paso + 1).map((estado, k) => ({ usuario: k < 2 ? "Carlos Mendoza Paz (OPERADOR)" : "Jorge Quispe Torres (TRANSPORTISTA)", user_id: k < 2 ? "ope00001" : "tra00001", fecha: t(Math.max(daysAgo - k * 0.5, 0), 9 + k), hora: `${String(9 + k).padStart(2, "0")}:15:00`, estadoAnterior: k ? flujo[k - 1] : null, estadoNuevo: estado, estado, observacion: k ? "" : "Registro inicial del envío" }));
    const nombreCliente = c.tipoCliente === "empresa" ? c.razonSocial : c.nombreCompleto;
    envios[`e${i + 1}`] = {
      codigo: `LC-DEMO-${String(1001 + i)}`, cliente_id: cid, cliente_nombre: nombreCliente, cliente_tipo: c.tipoCliente, cliente_documento: c.dni || c.ruc, cliente_telefono: c.telefono,
      destinatario: { nombres: n, apellidoPaterno: ap, apellidoMaterno: am, nombreCompleto: `${n} ${ap} ${am}`, telefono: `92200000${i % 10}`, direccion: `Dirección de ejemplo ${i + 1}, ${almacenes[d].ciudad}` },
      descripcion, cantidad_paquetes: (i % 3) + 1, precio, peso: 2 + i, observaciones: "",
      almacen_origen_id: o, almacen_origen_nombre: almacenes[o].nombre, almacen_destino_id: d, almacen_destino_nombre: almacenes[d].nombre,
      origen: almacenes[o].nombre, destino: almacenes[d].nombre, ciudad: almacenes[d].ciudad,
      transportistaNombre: "Jorge Quispe Torres", transportistaId: "tra00001",
      fecha_ingreso: t(daysAgo), fecha_envio: t(daysAgo), fecha_estimada_llegada: t(daysAgo - 3), fecha: t(daysAgo),
      user_id: "adm00001", estado: flujo[paso], anulado: false, creadoPor: "Lucía Fernández Ríos (SUPER_ADMIN)", creadoEn: t(daysAgo), historial
    };
  });
  return {
    collections: {
      empresas: { [EMPRESA]: { nombre: "LifeCargo Express S.A.C.", ruc: "20000000000", estado: "ACTIVO" } },
      configuracion: { superAdmin: { uid: "adm00001" } },
      almacenes, usuarios, clientes, envios
    },
    accounts: {
      "admin@lifecargo.demo": { uid: "adm00001", password: "demo123" },
      "operador@lifecargo.demo": { uid: "ope00001", password: "demo123" },
      "transportista@lifecargo.demo": { uid: "tra00001", password: "demo123" }
    }
  };
}

// ---- almacenamiento ----
let memory = null;
export function loadDb() {
  if (memory) return memory;
  try { memory = JSON.parse(localStorage.getItem(DB_KEY) || "null"); } catch { memory = null; }
  if (!memory || !memory.collections) { memory = seed(); saveDb(); }
  return memory;
}
export function saveDb() { try { localStorage.setItem(DB_KEY, JSON.stringify(memory)); } catch { /* sin almacenamiento: queda en memoria */ } }
export function resetDemo() {
  try { localStorage.removeItem(DB_KEY); localStorage.removeItem(SESSION_KEY); } catch { /* ignorar */ }
  memory = null;
}
export function getSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; } }
export function setSession(user) { try { user ? localStorage.setItem(SESSION_KEY, JSON.stringify(user)) : localStorage.removeItem(SESSION_KEY); } catch { /* ignorar */ } }

export function readDoc(col, id) {
  const raw = loadDb().collections[col]?.[id];
  return raw === undefined ? undefined : decode(structuredClone(raw));
}
export function writeDoc(col, id, data) {
  const db = loadDb();
  db.collections[col] ||= {};
  db.collections[col][id] = encode(data);
  saveDb();
}
export function listDocs(col) {
  return Object.entries(loadDb().collections[col] || {}).map(([id, raw]) => ({ id, data: decode(structuredClone(raw)) }));
}
export function newId() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }

window.resetDemo = () => { resetDemo(); window.location.href = "index.html"; };
