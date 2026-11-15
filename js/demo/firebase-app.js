// Sustituto local de firebase-app (modo DEMO).
export function initializeApp(config = {}, name = "[DEFAULT]") { return { name, options: config }; }
export async function deleteApp() { /* nada que liberar */ }
