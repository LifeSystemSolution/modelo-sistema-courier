export const ROLES = Object.freeze({
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  OPERADOR: "OPERADOR",
  TRANSPORTISTA: "TRANSPORTISTA"
});

export const ESTADOS_USUARIO = Object.freeze({ ACTIVO: "ACTIVO", INACTIVO: "INACTIVO" });
export const EMPRESA_INICIAL = Object.freeze({ id: "LIFECARGO", nombre: "LifeCargo Express S.A.C.", ruc: "20000000000" });

export function normalizeRole(role = "") {
  const value = String(role).trim().toUpperCase().replace(/[\s-]+/g, "_");
  const legacy = { ADMINISTRADOR: ROLES.ADMIN, ADMIN: ROLES.ADMIN, OPERADOR_ALMACEN: ROLES.OPERADOR, OPERADOR: ROLES.OPERADOR, TRANSPORTISTA: ROLES.TRANSPORTISTA, SUPER_ADMIN: ROLES.SUPER_ADMIN };
  return legacy[value] || value;
}

export function normalizeEstado(estado = "") {
  const value = String(estado || ESTADOS_USUARIO.ACTIVO).trim().toUpperCase();
  return value === "INACTIVO" || value === "INACTIVE" ? ESTADOS_USUARIO.INACTIVO : ESTADOS_USUARIO.ACTIVO;
}
