export const ESTADOS_ENVIO = [
  { key: "recibido", label: "Recibido" },
  { key: "almacen_origen", label: "Almacén Origen" },
  { key: "en_ruta", label: "En Ruta" },
  { key: "almacen_destino", label: "Llegó Almacén Destino" },
  { key: "pendiente_entrega", label: "Pendiente de Entrega" },
  { key: "entregado", label: "Entregado" },
  { key: "entrega_confirmada", label: "Entrega Confirmada" },
  { key: "anulado", label: "Anulado" }
];

export const ROLES = {
  ADMIN: "administrador",
  OPERADOR_ALMACEN: "operador_almacen",
  TRANSPORTISTA: "transportista"
};

export function estadoLabel(key) {
  return ESTADOS_ENVIO.find((estado) => estado.key === key)?.label || key || "Sin estado";
}

export function siguienteEstado(actual) {
  const index = ESTADOS_ENVIO.findIndex((estado) => estado.key === actual);
  if (index < 0 || index >= ESTADOS_ENVIO.length - 2) return null;
  return ESTADOS_ENVIO[index + 1].key;
}

export function normalizarTexto(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function clienteDisplay(cliente = {}) {
  return cliente.tipoCliente === "empresa"
    ? (cliente.razonSocial || cliente.nombreBusqueda || cliente.nombre || "Empresa sin nombre")
    : (cliente.nombreCompleto || cliente.nombre || "Cliente sin nombre");
}

export function clienteSearchText(cliente = {}) {
  return normalizarTexto([
    clienteDisplay(cliente),
    cliente.nombres,
    cliente.apellidoPaterno,
    cliente.apellidoMaterno,
    cliente.razonSocial,
    cliente.nombreBusqueda,
    cliente.dni,
    cliente.ruc,
    cliente.telefono,
    cliente.correo,
    cliente.direccion
  ].filter(Boolean).join(" "));
}

export function envioSearchText(envio = {}) {
  return normalizarTexto([
    envio.codigo,
    envio.cliente_nombre,
    envio.cliente_tipo,
    envio.cliente_documento,
    envio.cliente_telefono,
    envio.destinatario?.nombreCompleto,
    envio.destinatario?.telefono,
    envio.destinatario?.direccion,
    envio.descripcion,
    envio.origen,
    envio.destino,
    envio.ciudad,
    envio.almacen_origen_nombre,
    envio.almacen_destino_nombre,
    envio.transportistaNombre,
    envio.transportistaId
  ].filter(Boolean).join(" "));
}

export function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatoFecha(value) {
  const date = toDate(value);
  if (!date) return "-";
  return date.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
}

export function fechaInput(value) {
  const date = toDate(value);
  return date ? date.toISOString().slice(0, 10) : "";
}

export function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}
