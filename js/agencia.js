/* Agencia: llegadas de carga y entregas en counter */
(function () {
  const LC = (window.LC = window.LC || {});
  const U = LC.ui, esc = U.esc, icon = LC.icon, M = LC.motor;
  const db = () => LC.store.db;

  /* ===== Llegadas ===== */
  function enCaminoAMi(ag) { return db().envios.filter(e => e.estado === 'en_ruta' && e.destino === ag); }

  function renderLlegadas(el) {
    const ag = LC.sesion.agencia;
    const envs = enCaminoAMi(ag);
    // Agrupar por manifiesto (o "sin manifiesto" en el plan Básico)
    const grupos = {};
    envs.forEach(e => { const k = e.manifiesto || 'suelto-' + e.origen; (grupos[k] = grupos[k] || []).push(e); });
    const keys = Object.keys(grupos).sort((a, b) => grupos[a][0].eventos.at(-1).t - grupos[b][0].eventos.at(-1).t);
    if (!keys.length) { el.innerHTML = U.vacio('truck', 'No hay carga en camino a ' + M.agencia(ag).ciudad, 'Cuando un camión salga hacia esta agencia, aparecerá aquí para recibirlo.'); return; }
    el.innerHTML = '<p class="muted ayuda">Cuando llegue el camión, marca lo que bajó. Lo que no marques sigue figurando en camino y se avisa a la jefa de operaciones.</p>' +
      keys.map(k => {
        const lista = grupos[k];
        const m = lista[0].manifiesto ? LC.store.manifiesto(lista[0].manifiesto) : null;
        const sal = lista[0].eventos.find(x => x.estado === 'en_ruta');
        const esperado = sal.t + M.horasTransito(lista[0].origen, ag) * 36e5;
        const cond = m ? LC.store.persona(m.conductor) : null;
        return '<section class="caja llegada" data-k="' + k + '"><header class="lleg-h">' + LC.illus('camion', 52) + '<div><h2>' + (m ? 'Manifiesto ' + esc(m.id) : 'Envíos sueltos') + ' · desde ' + esc(M.agencia(lista[0].origen).ciudad) + '</h2>' +
          '<p class="muted">' + U.plural(lista.length, 'envío') + ' · salió ' + U.cuando(sal.t) + ' · llegada estimada ' + U.cuando(esperado) + (cond ? ' · ' + esc(cond.nombre) + ', ' + esc(m.vehiculo) : '') + '</p>' +
          (m && m.incidencia ? '<p class="alerta mal">' + icon('alert') + '<span>' + esc(m.incidencia) + '</span></p>' : '') + '</div></header>' +
          '<ul class="check-list">' + lista.map(e => '<li><label><input type="checkbox" value="' + e.id + '" checked><span class="num"><b>' + e.id + '</b></span><span>' + esc(e.destinatario.nombre) + '</span><span class="muted">' + U.plural(e.bultos.length, 'bulto') + ' · ' + (e.tipoEntrega === 'domicilio' ? 'a domicilio' : 'recojo') + '</span></label></li>').join('') + '</ul>' +
          '<div class="lleg-f"><span class="muted" data-cuenta></span><button class="btn btn-primary" data-recibir>' + icon('check') + 'Recibir en agencia</button></div></section>';
      }).join('');
    el.querySelectorAll('.llegada').forEach(sec => {
      const cuenta = () => { const n = sec.querySelectorAll('input:checked').length; sec.querySelector('[data-cuenta]').textContent = n + ' de ' + sec.querySelectorAll('input').length + ' marcados'; sec.querySelector('[data-recibir]').disabled = !n; };
      sec.querySelectorAll('input').forEach(i => i.onchange = cuenta);
      cuenta();
      sec.querySelector('[data-recibir]').onclick = () => {
        const ids = [...sec.querySelectorAll('input:checked')].map(i => i.value);
        const faltan = sec.querySelectorAll('input:not(:checked)').length;
        ids.forEach(id => { const e = LC.store.envio(id); LC.envios.avanzar(e, 'en_destino', 'Llegó a la agencia ' + M.agencia(e.destino).nombre); });
        const m = LC.store.manifiesto(LC.store.envio(ids[0]).manifiesto);
        if (m && !faltan) { m.estado = 'llegado'; m.llegada = Date.now(); }
        if (m && faltan) m.incidencia = 'Faltaron ' + U.plural(faltan, 'envío') + ' al recibir en ' + M.agencia(ag).ciudad;
        LC.store.log('Recibió carga', U.plural(ids.length, 'envío') + (m ? ' del manifiesto ' + m.id : '') + (faltan ? ' · faltaron ' + faltan : ''));
        LC.store.save();
        U.toast(U.plural(ids.length, 'envío recibido', 'envíos recibidos') + ' en ' + M.agencia(ag).ciudad + (faltan ? '. ' + U.plural(faltan, 'faltante') + ' reportados' : ''), faltan ? 'info' : 'ok');
        LC.refrescar();
      };
    });
  }

  /* ===== Entregas en agencia ===== */
  function renderEntregas(el, params) {
    const ag = LC.sesion.agencia;
    let q = params.get('q') || '';
    el.innerHTML = '<div class="barra-f"><label class="buscar">' + icon('search') + '<input type="search" data-buscar placeholder="DNI, nombre o código del envío" value="' + esc(q) + '" aria-label="Buscar envío por recoger"><kbd>/</kbd></label></div><div id="lista"></div>';
    const lista = el.querySelector('#lista');
    function pintar() {
      const qq = LC.envios.norm(q);
      let rows = db().envios.filter(e => e.estado === 'en_destino' && e.destino === ag && e.tipoEntrega === 'agencia');
      if (qq) rows = rows.filter(e => LC.envios.norm(e.id + ' ' + e.destinatario.nombre + ' ' + e.destinatario.doc + ' ' + e.destinatario.tel).includes(qq));
      rows.sort((a, b) => M.cumplido(a) - M.cumplido(b));
      if (!rows.length) { lista.innerHTML = U.vacio('store', q ? 'Nadie con "' + q + '" tiene envíos por recoger' : 'No hay envíos por recoger', q ? 'Pide el código del envío o el DNI con el que se registró.' : 'Los envíos que lleguen para recojo aparecerán aquí.'); return; }
      lista.innerHTML = '<p class="muted ayuda">' + U.plural(rows.length, 'envío') + ' esperando en la agencia ' + esc(M.agencia(ag).nombre) + '. Los de más días van primero.</p><div class="ent-grid">' + rows.map(e => {
        const dias = Math.floor((Date.now() - M.cumplido(e)) / 864e5);
        return '<article class="ent"><div class="ent-h"><b class="num">' + e.id + '</b>' + (dias >= 5 ? '<span class="tag tag-red">' + icon('clock') + U.plural(dias, 'día') + ' en agencia</span>' : '<span class="tag">' + (dias ? U.plural(dias, 'día') : 'Llegó hoy') + '</span>') + '</div>' +
          '<p class="ent-n">' + esc(e.destinatario.nombre) + '</p><p class="muted">DNI ' + esc(e.destinatario.doc) + ' · de ' + esc(U.nombreCorto(e.remitente.nombre)) + ', ' + esc(M.agencia(e.origen).ciudad) + '</p>' +
          '<p class="muted">' + U.plural(e.bultos.length, 'bulto') + ' · ' + esc(e.contenido) + '</p>' +
          (e.contraEntrega && !e.ce ? '<p class="ent-ce">' + icon('cash') + 'Cobrar ' + U.soles(e.contraEntrega) + '</p>' : '') +
          '<div class="fila"><button class="btn btn-primary" data-ent="' + e.id + '">' + icon('check') + 'Entregar</button><button class="btn btn-ghost" data-ver="' + e.id + '">Ver</button></div></article>';
      }).join('') + '</div>';
      lista.querySelectorAll('[data-ent]').forEach(b => b.onclick = async () => { const e = LC.store.envio(b.dataset.ent); if (await LC.envios.pedirEntrega(e)) { U.toast(e.id + ' entregado a ' + U.nombreCorto(e.destinatario.nombre)); LC.refrescar(); } });
      lista.querySelectorAll('[data-ver]').forEach(b => b.onclick = () => LC.envios.detalle(b.dataset.ver));
    }
    const inp = el.querySelector('[data-buscar]');
    let t;
    inp.oninput = () => { clearTimeout(t); t = setTimeout(() => { q = inp.value; pintar(); }, 150); };
    pintar();
  }

  LC.vistas.llegadas = { titulo: 'Llegadas a la agencia', menu: 'Llegadas', icono: 'truck', modulo: 'llegadas', badge: () => enCaminoAMi(LC.sesion.agencia).length, render: renderLlegadas };
  LC.vistas.entregas = { titulo: 'Por recoger en agencia', menu: 'Entregas', corto: 'Entregar', icono: 'store', modulo: 'entregas', badge: () => db().envios.filter(e => e.estado === 'en_destino' && e.destino === LC.sesion.agencia && e.tipoEntrega === 'agencia').length, render: renderEntregas };
})();
