/* Clientes (remitentes frecuentes) y seguimiento por código */
(function () {
  const LC = (window.LC = window.LC || {});
  const U = LC.ui, esc = U.esc, icon = LC.icon, M = LC.motor;
  const db = () => LC.store.db;
  const DIA = 864e5;

  function resumen(c) {
    const desde = Date.now() - 30 * DIA;
    const env = db().envios.filter(e => e.remitente.clienteId === c.id);
    const mes = env.filter(e => e.creado >= desde);
    return { env, mes, gasto: mes.reduce((s, e) => s + e.tarifa, 0), ultimo: env.reduce((m, e) => Math.max(m, e.creado), 0) };
  }

  function detalle(id) {
    const c = LC.store.cliente(id);
    const r = resumen(c);
    const html = '<div class="panel-h"><div style="flex:1;min-width:0"><span class="sub">' + (c.tipo === 'empresa' ? 'Empresa' + (c.tienda ? ' · tienda online' : '') : 'Persona') + ' · cliente desde ' + U.fecha(c.desde) + '</span><h2>' + esc(c.nombre) + '</h2></div><button class="btn btn-ghost btn-icon" data-close aria-label="Cerrar">' + icon('x') + '</button></div>' +
      '<div class="panel-c"><div class="dato-grid"><div class="dato"><span>' + (c.tipo === 'empresa' ? 'RUC' : 'DNI') + '</span><b class="num">' + esc(c.doc) + '</b></div><div class="dato"><span>Celular</span><b class="num">' + esc(c.tel) + '</b></div>' +
      '<div class="dato"><span>Envíos en 30 días</span><b class="num">' + r.mes.length + '</b></div><div class="dato"><span>Gastó en 30 días</span><b class="num">' + U.soles(r.gasto) + '</b></div></div>' +
      '<section class="bloque"><h3>Últimos envíos</h3><div class="lista-env mini">' + (r.env.length ? r.env.slice().sort((a, b) => b.creado - a.creado).slice(0, 12).map(e => '<button class="mini-env" data-id="' + e.id + '"><b class="num">' + e.id + '</b><span>' + esc(M.agencia(e.destino).ciudad) + ' · ' + esc(U.nombreCorto(e.destinatario.nombre)) + '</span>' + U.estado(e, true) + '</button>').join('') : '<p class="muted">Sin envíos todavía.</p>') + '</div></section></div>' +
      (LC.puede('recepcion') ? '<div class="panel-f"><a class="btn btn-primary" href="#/recepcion?doc=' + c.doc + '" data-close>' + icon('plus') + 'Nuevo envío de este cliente</a></div>' : '');
    const p = U.panel(html);
    p.querySelectorAll('[data-id]').forEach(b => b.onclick = () => LC.envios.detalle(b.dataset.id));
  }

  function render(el, params) {
    let q = params.get('q') || '', tipo = '';
    el.innerHTML = '<div class="barra-f"><label class="buscar">' + icon('search') + '<input type="search" data-buscar placeholder="Nombre, DNI, RUC o celular" value="' + esc(q) + '" aria-label="Buscar clientes"><kbd>/</kbd></label>' +
      '<div class="chips"><button class="chip on" data-t="">Todos</button><button class="chip" data-t="empresa">Empresas</button><button class="chip" data-t="persona">Personas</button></div>' +
      '<button class="btn btn-primary" data-nuevo>' + icon('plus') + 'Nuevo cliente</button></div><p class="muted ayuda">Datos ficticios de ejemplo.</p><div id="lista"></div>';
    const lista = el.querySelector('#lista');
    function pintar() {
      const qq = LC.envios.norm(q);
      let rows = db().clientes.filter(c => (!tipo || c.tipo === tipo) && (!qq || LC.envios.norm(c.nombre + ' ' + c.doc + ' ' + c.tel).includes(qq))).map(c => Object.assign({ c }, resumen(c)));
      rows.sort((a, b) => b.gasto - a.gasto);
      if (!rows.length) { lista.innerHTML = U.vacio('users', 'No encontramos a "' + q + '"', 'Puedes registrarlo como cliente nuevo con su DNI o RUC.', '<button class="btn btn-primary" data-nuevo2>' + icon('plus') + 'Nuevo cliente</button>'); const b = lista.querySelector('[data-nuevo2]'); if (b) b.onclick = nuevo; return; }
      lista.innerHTML = '<div class="tabla-wrap"><table class="tabla tabla-cli"><thead><tr><th>Cliente</th><th>Documento</th><th>Agencia</th><th class="r">Envíos 30 d</th><th class="r">Gasto 30 d</th><th>Último envío</th></tr></thead><tbody>' +
        rows.map(x => '<tr data-id="' + x.c.id + '" tabindex="0"><td><b>' + esc(x.c.nombre) + '</b>' + (x.c.tienda ? ' <span class="tag">Tienda online</span>' : '') + '</td><td class="num">' + esc(x.c.doc) + '</td><td>' + esc(M.agencia(x.c.agencia).ciudad) + '</td><td class="r num">' + x.mes.length + '</td><td class="r num">' + U.soles(x.gasto) + '</td><td>' + (x.ultimo ? U.cuando(x.ultimo) : '—') + '</td></tr>').join('') + '</tbody></table></div>';
      lista.querySelectorAll('tr[data-id]').forEach(tr => { tr.onclick = () => detalle(tr.dataset.id); tr.onkeydown = e => { if (e.key === 'Enter') detalle(tr.dataset.id); }; });
    }
    async function nuevo() {
      const r = await U.modal('Nuevo cliente', '<label class="campo">DNI o RUC<input name="doc" inputmode="numeric" maxlength="11" required></label><p class="muted">Consultamos RENIEC o SUNAT (simulado) para completar el nombre.</p><label class="campo">Celular<input name="tel" inputmode="tel" maxlength="9" required></label>', [['cancelar', 'Cancelar', 'btn-line'], ['ok', 'Guardar cliente', 'btn-primary']]);
      if (r.v !== 'ok') return;
      const doc = String(r.data.get('doc') || '').trim(), tel = String(r.data.get('tel') || '').trim();
      if (!/^(\d{8}|\d{11})$/.test(doc)) { U.toast('El DNI tiene 8 dígitos y el RUC 11. Revisa el número.', 'error'); return; }
      if (!/^9\d{8}$/.test(tel)) { U.toast('El celular debe tener 9 dígitos y empezar con 9.', 'error'); return; }
      if (db().clientes.some(c => c.doc === doc)) { U.toast('Ese documento ya está registrado.', 'error'); return; }
      const c = { id: 'C' + (db().clientes.length + 1), tipo: doc.length === 11 ? 'empresa' : 'persona', nombre: doc.length === 11 ? 'Comercial Demo ' + doc.slice(-3) + ' S.A.C.' : ['Gladys Ticona Mamani', 'Óscar Salazar Vega', 'Roxana Cruz Espinoza'][Number(doc.slice(-1)) % 3], doc, tel, agencia: LC.sesion.agencia || 'LIM', desde: Date.now() };
      db().clientes.push(c);
      LC.store.log('Registró cliente', c.nombre);
      LC.store.save();
      U.toast(c.nombre + ' registrado');
      q = ''; el.querySelector('[data-buscar]').value = ''; pintar(); detalle(c.id);
    }
    el.querySelector('[data-nuevo]').onclick = nuevo;
    el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tipo = b.dataset.t; el.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('on', x === b)); pintar(); });
    const inp = el.querySelector('[data-buscar]');
    let t;
    inp.oninput = () => { clearTimeout(t); t = setTimeout(() => { q = inp.value; pintar(); }, 150); };
    pintar();
  }

  /* ===== Seguimiento: misma tarjeta que ve el cliente en la web ===== */
  function tarjeta(e) {
    const pasos = [['recibido', 'Recibido'], ['en_ruta', 'En camino'], ['en_destino', e.tipoEntrega === 'agencia' ? 'Listo para recoger' : 'En agencia destino'], ['en_reparto', 'En reparto'], ['entregado', 'Entregado']].filter(p => e.tipoEntrega === 'domicilio' || p[0] !== 'en_reparto');
    const idx = pasos.findIndex(p => p[0] === e.estado);
    const ult = e.eventos[e.eventos.length - 1];
    const cump = M.cumplido(e);
    return '<article class="track"><header><div><span class="muted">Envío</span><h3 class="num">' + e.id + '</h3></div><div class="track-r">' + esc(M.agencia(e.origen).ciudad) + icon('arrowR') + '<b>' + esc(M.agencia(e.destino).ciudad) + '</b></div></header>' +
      '<ol class="track-pasos">' + pasos.map((p, i) => '<li class="' + (i < idx ? 'hecho' : i === idx ? 'actual' : '') + '"><span>' + (i <= idx ? icon('check') : '') + '</span><b>' + p[1] + '</b></li>').join('') + '</ol>' +
      '<p class="track-msg">' + (e.estado === 'entregado' ? 'Entregado el ' + U.fechaDia(e.entregado) + ' a las ' + U.hora(e.entregado) + '.' : cump ? 'Ya puede recogerse en la agencia ' + esc(M.agencia(e.destino).nombre) + ' con DNI.' : 'Llega el <b>' + U.fechaDia(e.promesa) + '</b>' + (e.tipoEntrega === 'domicilio' ? ', entrega hasta las 19:00.' : ', listo para recoger.')) + '</p>' +
      '<p class="muted">Último movimiento: ' + esc(ult.nota) + ' · ' + U.cuando(ult.t) + '</p>' +
      '<ul class="track-ev">' + e.eventos.slice().reverse().map(x => '<li><time>' + U.cuando(x.t) + '</time><span>' + esc(x.nota.replace(/ · DNI verificado/, '')) + '</span></li>').join('') + '</ul></article>';
  }

  function renderSeg(el, params) {
    const ej = db().envios.filter(e => e.estado === 'en_ruta').slice(0, 1).concat(db().envios.filter(e => e.estado === 'entregado').slice(0, 1));
    el.innerHTML = '<form class="seg-form"><label class="buscar">' + icon('search') + '<input data-buscar name="cod" placeholder="Código del envío, ej.: ' + ej[0].id + '" value="' + esc(params.get('cod') || '') + '" aria-label="Código del envío"></label><button class="btn btn-primary">Rastrear</button></form>' +
      '<p class="muted ayuda">Es lo mismo que ve tu cliente en la web. Prueba con ' + ej.map(e => '<a href="#/seguimiento?cod=' + e.id + '">' + e.id + '</a>').join(' o ') + '.</p><div id="res"></div>';
    const f = el.querySelector('form');
    function buscar(cod) {
      cod = String(cod || '').trim().toUpperCase();
      if (!cod) return;
      if (/^\d+$/.test(cod)) cod = 'LC-' + cod;
      const e = LC.store.envio(cod);
      el.querySelector('#res').innerHTML = e ? tarjeta(e) : U.vacio('search', 'No encontramos ' + cod, 'Revisa el código en la guía. Tiene la forma LC- y seis números.');
    }
    f.onsubmit = ev => { ev.preventDefault(); buscar(f.cod.value); };
    if (params.get('cod')) buscar(params.get('cod'));
  }

  LC.seguimiento = { tarjeta };
  LC.vistas.clientes = { titulo: 'Clientes', icono: 'users', modulo: 'clientes', render };
  LC.vistas.seguimiento = { titulo: 'Rastrear un envío', menu: 'Rastrear', icono: 'search', modulo: 'seguimiento', render: renderSeg };
})();
