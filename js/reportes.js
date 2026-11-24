/* Reportes: envíos, ingresos, cumplimiento y ganancia estimada (con su fórmula), exportables a Excel */
(function () {
  const LC = (window.LC = window.LC || {});
  const U = LC.ui, esc = U.esc, icon = LC.icon, M = LC.motor;
  const db = () => LC.store.db;
  const DIA = 864e5;

  function costos(envs) {
    const C = db().ajustes.costos;
    let linea = 0, reparto = 0, comision = 0;
    envs.forEach(e => {
      const T = LC.store.tarifa(e);
      const kg = T.kg || 0.5;
      linea += T.km ? kg * (T.km / 100) * C.lineaKg100 : kg * C.localKg;
      if (e.tipoEntrega === 'domicilio') reparto += C.repartoEntrega;
      if (e.pago.medio === 'Tarjeta') comision += e.tarifa * C.comisionTarjeta / 100;
    });
    const dias = new Set(envs.map(e => M.diaISO(e.creado))).size;
    const fijos = dias * C.fijoDia;
    return { linea, reparto, comision, fijos, dias, total: linea + reparto + comision + fijos };
  }

  function render(el, params) {
    let rango = params.get('r') || '30';
    function pintar() {
      const h0 = U.inicioDia();
      const desde = rango === 'hoy' ? h0 : h0 - Number(rango) * DIA;
      const envs = db().envios.filter(e => e.creado >= desde);
      const cumplidos = db().envios.filter(e => { const c = M.cumplido(e); return c && c >= desde; });
      const aTiempo = cumplidos.filter(e => M.cumplido(e) <= e.promesa).length;
      const ingresos = envs.reduce((s, e) => s + e.tarifa, 0);
      const fallidos = db().envios.reduce((s, e) => s + e.eventos.filter(x => x.t >= desde && x.nota.startsWith('Intento fallido')).length, 0);
      const C = costos(envs);
      const ganancia = ingresos - C.total;
      const chips = [['hoy', 'Hoy'], ['7', '7 días'], ['30', '30 días']].map(r => '<button class="chip' + (r[0] === rango ? ' on' : '') + '" data-r="' + r[0] + '">' + r[1] + '</button>').join('');
      const cab = '<div class="barra-f"><div class="chips">' + chips + '</div><button class="btn btn-line" data-csv' + (envs.length ? '' : ' disabled') + '>' + icon('download') + 'Exportar a Excel</button></div>';
      if (!envs.length) {
        el.innerHTML = cab + U.vacio('chart', rango === 'hoy' ? 'Hoy todavía no hay envíos' : 'No hay envíos en este rango', rango === 'hoy' ? 'El día empieza en cero. Registra un envío o usa "Simular envío" arriba y vuelve aquí.' : '', '<button class="btn btn-line" data-r="7">Ver los últimos 7 días</button>');
        enlazar();
        return;
      }
      // Por día
      const nd = rango === 'hoy' ? 1 : Number(rango);
      const porDia = [];
      for (let i = nd - 1; i >= 0; i--) { const d0 = h0 - i * DIA; const n = envs.filter(e => e.creado >= d0 && e.creado < d0 + DIA).length; porDia.push({ l: rango === '30' ? (i % 3 === 0 ? String(new Date(d0).getDate()) : '') : U.fechaDia(d0).split(' ').slice(0, 2).join(' '), v: n, marca: !M.esHabil(d0) }); }
      const porDest = M.AGENCIAS.map(a => ({ l: a.ciudad, v: Math.round(envs.filter(e => e.destino === a.id).reduce((s, e) => s + e.tarifa, 0)), fmt: U.soles(envs.filter(e => e.destino === a.id).reduce((s, e) => s + e.tarifa, 0), 0) })).sort((a, b) => b.v - a.v);
      const porHora = [];
      for (let h = 8; h <= 20; h++) porHora.push({ l: h + 'h', v: envs.filter(e => new Date(e.creado).getHours() === h).length });
      const rutas = {};
      cumplidos.forEach(e => { const k = M.agencia(e.origen).ciudad + ' → ' + M.agencia(e.destino).ciudad; rutas[k] = rutas[k] || { n: 0, ok: 0 }; rutas[k].n++; if (M.cumplido(e) <= e.promesa) rutas[k].ok++; });
      const peores = Object.entries(rutas).filter(([, v]) => v.n >= 5).map(([k, v]) => ({ k, pct: Math.round(v.ok / v.n * 100), n: v.n })).sort((a, b) => a.pct - b.pct).slice(0, 5);
      const medios = {};
      envs.forEach(e => { medios[e.pago.medio] = (medios[e.pago.medio] || 0) + e.tarifa; });
      const pct = cumplidos.length ? Math.round(aTiempo / cumplidos.length * 100) : 0;
      const T = db().ajustes.costos;

      el.innerHTML = cab +
        '<div class="kpis"><div class="kpi"><span>Envíos</span><b class="num">' + U.num(envs.length) + '</b><small>' + (nd > 1 ? Math.round(envs.length / nd) + ' por día en promedio' : 'hoy') + '</small></div>' +
        '<div class="kpi"><span>Ingresos</span><b class="num">' + U.soles(ingresos, 0) + '</b><small>ticket promedio ' + U.soles(ingresos / envs.length) + '</small></div>' +
        '<div class="kpi"><span>Cumplieron el plazo</span><b class="num">' + (cumplidos.length ? pct + '%' : '—') + '</b><small>' + aTiempo + ' de ' + U.plural(cumplidos.length, 'envío') + '</small></div>' +
        '<div class="kpi"><span>Intentos fallidos</span><b class="num">' + fallidos + '</b><small>en entregas a domicilio</small></div></div>' +
        '<section class="sec caja caja-p ganancia"><div class="sec-h"><h2>Ganancia estimada: ' + U.soles(ganancia, 0) + '</h2><p>' + (ingresos ? Math.round(ganancia / ingresos * 100) : 0) + '% de los ingresos</p></div>' +
        '<p class="formula">Ingresos ' + U.soles(ingresos, 0) + ' − costo de línea ' + U.soles(C.linea, 0) + ' − reparto ' + U.soles(C.reparto, 0) + ' − comisión de tarjeta ' + U.soles(C.comision, 0) + ' − gastos fijos ' + U.soles(C.fijos, 0) + '</p>' +
        '<ul class="supuestos"><li>Costo de línea: S/ ' + T.lineaKg100.toFixed(2) + ' por kg cada 100 km (local: S/ ' + T.localKg.toFixed(2) + ' por kg).</li><li>Reparto: S/ ' + T.repartoEntrega.toFixed(2) + ' por entrega a domicilio.</li><li>Comisión de tarjeta: ' + T.comisionTarjeta + '%.</li><li>Gastos fijos: ' + U.soles(T.fijoDia, 0) + ' por día con operación (' + U.plural(C.dias, 'día') + '). Se cambian en Ajustes.</li></ul></section>' +
        '<div class="grid2 sec"><section class="caja caja-p"><div class="sec-h"><h2>Envíos por día</h2><p>' + (rango === '30' ? 'Domingos y feriados más claros' : '') + '</p></div>' + U.barras(porDia, { alto: 150 }) + '</section>' +
        '<section class="caja caja-p"><div class="sec-h"><h2>Ingresos por destino</h2></div>' + U.barras(porDest, { horizontal: true }) + '</section>' +
        '<section class="caja caja-p"><div class="sec-h"><h2>Hora de recepción</h2><p>Para decidir turnos en counter</p></div>' + U.barras(porHora, { alto: 130 }) + '</section>' +
        '<section class="caja caja-p"><div class="sec-h"><h2>Rutas con menos cumplimiento</h2></div>' + (peores.length ? '<ul class="peores">' + peores.map(p => '<li><span>' + esc(p.k) + '</span><b class="num">' + p.pct + '%</b><small>' + U.plural(p.n, 'envío') + '</small></li>').join('') + '</ul>' : '<p class="muted">Aún no hay suficientes envíos cerrados en el rango.</p>') +
        '<h3 class="sub-h">Cobros por medio de pago</h3><ul class="peores">' + Object.entries(medios).sort((a, b) => b[1] - a[1]).map(([k, v]) => '<li><span>' + esc(k) + '</span><b class="num">' + U.soles(v, 0) + '</b><small>' + Math.round(v / ingresos * 100) + '%</small></li>').join('') + '</ul></section></div>';
      enlazar();
      el.querySelector('[data-csv]').onclick = () => {
        U.csv('lifecargo-envios-' + (rango === 'hoy' ? 'hoy' : rango + 'dias'), [['Código', 'Fecha', 'Origen', 'Destino', 'Servicio', 'Entrega', 'Remitente', 'Destinatario', 'Bultos', 'Kg facturables', 'Tarifa (S/)', 'Medio de pago', 'Estado', 'Fecha prometida', 'Cumplió plazo']]
          .concat(envs.map(e => { const c = M.cumplido(e); return [e.id, new Date(e.creado).toLocaleString('es-PE'), M.agencia(e.origen).ciudad, M.agencia(e.destino).ciudad, e.servicio, e.tipoEntrega, e.remitente.nombre, e.destinatario.nombre, e.bultos.length, String(LC.store.tarifa(e).kg).replace('.', ','), String(e.tarifa.toFixed(2)).replace('.', ','), e.pago.medio, U.ESTADOS[e.estado].txt, new Date(e.promesa).toLocaleDateString('es-PE'), c ? (c <= e.promesa ? 'Sí' : 'No') : 'En proceso']; })));
        U.toast('Descargaste ' + U.plural(envs.length, 'envío') + ' en Excel (CSV)');
      };
    }
    function enlazar() { el.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { rango = b.dataset.r; pintar(); }); }
    pintar();
  }

  LC.vistas.reportes = { titulo: 'Reportes', icono: 'chart', modulo: 'reportes', render };
})();
