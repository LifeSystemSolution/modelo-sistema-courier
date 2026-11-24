/* Almacenamiento en localStorage con versión de esquema.
   Si cambia SCHEMA o es otro día, se regeneran los datos de ejemplo: hoy siempre empieza en 0. */
(function () {
  const LC = (window.LC = window.LC || {});
  const KEY = 'lifecargo-datos';
  const SCHEMA = 3;

  const store = {
    db: null,
    SCHEMA,
    KEY,
    init() {
      let raw = null;
      try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) { raw = null; }
      if (!raw || raw.schema !== SCHEMA || raw.seedDay !== LC.motor.diaISO(Date.now())) {
        raw = LC.seed();
        raw.schema = SCHEMA;
        raw.seedDay = LC.motor.diaISO(Date.now());
        this.db = raw;
        this.save();
      } else {
        this.db = raw;
      }
      return this.db;
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.db)); }
      catch (e) { if (LC.ui) LC.ui.toast('No se pudo guardar en este navegador. Libera espacio o prueba con otro navegador.', 'error'); }
    },
    reset() {
      try { localStorage.removeItem(KEY); } catch (e) { /* sin almacenamiento */ }
      return this.init();
    },
    nextId(tipo) {
      const c = this.db.contadores;
      c[tipo] = (c[tipo] || 0) + 1;
      return c[tipo];
    },
    log(accion, detalle) {
      const u = LC.sesion ? LC.sesion.nombre : 'Sistema';
      this.db.historial.unshift({ t: Date.now(), usuario: u, accion, detalle: detalle || '' });
      if (this.db.historial.length > 300) this.db.historial.length = 300;
    },
    persona(id) { return this.db.personas.find(p => p.id === id); },
    cliente(id) { return this.db.clientes.find(c => c.id === id); },
    envio(id) { return this.db.envios.find(e => e.id === id); },
    manifiesto(id) { return this.db.manifiestos.find(m => m.id === id); },
    riesgo(e) { return LC.motor.riesgo(e, this.db.ajustes.pesos); },
    tarifa(e) { return LC.motor.tarifa(e, this.db.ajustes.tarifa); }
  };

  LC.store = store;
})();
