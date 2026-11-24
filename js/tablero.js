/* Tablero de la jefa de operaciones: lo urgente primero */
(function () {
  const LC = (window.LC = window.LC || {});
  const U = LC.ui, esc = U.esc, icon = LC.icon, M = LC.motor;
  const db = () => LC.store.db;

  function render(el) {
    const abiertos = db().envios.filter(e => e.estado !== 'entregado').map(e => ({ e, r: LC.store.riesgo(e) }));
    const enRiesgo = abiertos.filter(x => x.r.nivel === 'alto' || x.r.nivel === 'medio').sort((a, b) => b.r.puntaje - a.r.puntaje);
    const vencidos = abiertos.filter(x => x.r.vencido);
    const recoger = abiertos.filter(x => x.r.nivel === 'listo');
    const viejos = recoger.filter(x => Date.now() - M.cumplido(x.e) > 5 * 864e5);
    const h0 = U.inicioDia();
    const hoy = db().envios.filter(e => e.creado >= h0);
    const entregHoy = db().envios.filter(e => e.entregado >= h0);
    const venceHoy = abiertos.filter(x => x.r.nivel !== 'listo' && U.esHoy(x.e.promesa));

    const top = enRiesgo.slice(0, 8);
    const carga = M.AGENCIAS.map(a => ({ l: a.ciudad, v: abiertos.filter(x => x.e.destino === a.id && x.r.nivel !== 'listo').length }));
    const mans = db().manifiestos.filter(m => m.estado === 'en_ruta');
    const alertas = [];
    db().manifiestos.filter(m => m.incidencia && m.estado === 'en_ruta').forEach(m => alertas.push(['mal', 'Camión ' + M.agencia(m.origen).ciudad + ' → ' + M.agencia(m.destino).ciudad + ': ' + m.incidencia, m.id]));
    if (viejos.length) alertas.push(['', U.plural(viejos.length, 'envío lleva', 'envíos llevan') + ' más de 5 días sin recoger. Conviene llamar al destinatario.', null]);
    const ayer = db().cajas.filter(c => c.fecha === M.diaISO(h0 - 864e5));
    ayer.filter(c => c.contado !== c.esperado).forEach(c => alertas.push(['', 'La caja de ' + M.agencia(c.agencia).ciudad + ' cerró ayer con ' + (c.contado < c.esperado ? 'faltante' : 'sobrante') + ' de ' + U.soles(Math.abs(c.contado - c.esperado)) + '.', null]));
    const porLiq = db().envios.filter(e => e.ce && !e.ce.liquidado);
    if (LC.tieneModulo('contraentrega') && porLiq.length) alertas.push(['', U.soles(porLiq.reduce((s, e) => s + e.contraEntrega, 0)) + ' cobrados contra entrega esperan liquidarse a ' + U.plural(new Set(porLiq.map(e => e.remitente.clienteId)).size, 'tienda') + '.', 'ce']);

    el.innerHTML = '<div class="kpis"><div class="kpi' + (enRiesgo.filter(x => x.r.nivel === 'alto').length ? ' kpi-mal' : '') + '"><span>En riesgo de retraso</span><b class="num">' + enRiesgo.length + '</b><small>' + U.plural(enRiesgo.filter(x => x.r.nivel === 'alto').length, 'alto') + ' · ' + U.plural(enRiesgo.filter(x => x.r.nivel === 'medio').length, 'medio') + '</small></div>' +
      '<div class="kpi"><span>Vencidos</span><b class="num">' + vencidos.length + '</b><small>' + (vencidos.length ? 'pasaron su fecha prometida' : 'ninguno fuera de plazo') + '</small></div>' +
      '<div class="kpi"><span>Vencen hoy</span><b class="num">' + venceHoy.length + '</b><small>de ' + U.plural(abiertos.length - recoger.length, 'envío') + ' en proceso</small></div>' +
      '<div class="kpi"><span>Hoy</span><b class="num">' + hoy.length + '</b><small>' + U.plural(hoy.length, 'recibido') + ' · ' + U.plural(entregHoy.length, 'entregado') + '</small></div></div>' +
      '<div class="tab-grid"><section class="caja caja-p"><div class="sec-h"><h2>Atender primero</h2><a href="#/envios?f=riesgo">Ver todos</a></div>' +
      (top.length ? '<ul class="urg">' + top.map(x => { const f = x.r.factores.slice().sort((a, b) => b.pts - a.pts)[0]; return '<li><button data-id="' + x.e.id + '"><span class="urg-p num">' + x.r.puntaje + '</span><span class="urg-t"><b class="num">' + x.e.id + '</b> · ' + esc(M.agencia(x.e.origen).ciudad) + ' → ' + esc(M.agencia(x.e.destino).ciudad) + '<small>' + esc(f.etiqueta + ': ' + f.motivo) + '</small></span>' + U.riesgo(x.r) + '</button></li>'; }).join('') + '</ul>'
        : U.vacio('check', 'Nada en riesgo ahora', 'Todos los envíos van dentro de su plazo.')) + '</section>' +
      '<div class="tab-lado"><section class="caja caja-p"><div class="sec-h"><h2>Alertas</h2></div>' + (alertas.length ? '<div class="alertas">' + alertas.map(a => '<p class="alerta ' + a[0] + '">' + icon('alert') + '<span>' + esc(a[1]) + '</span>' + (a[2] === 'ce' ? '<a class="btn btn-sm btn-line" href="#/contraentrega">Liquidar</a>' : a[2] ? '<a class="btn btn-sm btn-line" href="#/manifiestos">Ver</a>' : '') + '</p>').join('') + '</div>' : '<p class="muted">Sin alertas.</p>') + '</section>' +
      '<section class="caja caja-p"><div class="sec-h"><h2>En proceso por destino</h2></div>' + U.barras(carga, { horizontal: true }) + '</section></div></div>' +
      '<section class="sec"><div class="sec-h"><h2>Camiones en carretera</h2><a href="#/manifiestos">Despacho</a></div>' + (mans.length ? '<div class="lista-man">' + mans.slice(0, 6).map(LC.manifiestos.filaMan).join('') + '</div>' : U.vacio('truck', 'Sin camiones en carretera', '')) + '</section>';
    el.querySelectorAll('[data-id]').forEach(b => b.onclick = () => LC.envios.detalle(b.dataset.id));
    el.querySelectorAll('[data-man]').forEach(b => b.onclick = () => LC.ir('manifiestos'));
  }

  LC.vistas.tablero = { titulo: 'Tablero de hoy', menu: 'Tablero', icono: 'home', modulo: 'tablero', render };
})();
