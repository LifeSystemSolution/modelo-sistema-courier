/* Arranque: plan (?plan=), rol (?demo=counter|transportista|jefe), navegación por hash, tema y atajos */
(function () {
  const LC = (window.LC = window.LC || {});
  LC.vistas = LC.vistas || {};
  const esc = LC.ui.esc, icon = LC.icon;

  const ROLES = {
    counter: { persona: 'P1', etiqueta: 'Counter', desc: 'Rosa, de la agencia Lima: recibe envíos, entrega en counter y cuadra su caja.', ill: 'agencia', nav: ['recepcion', 'envios', 'llegadas', 'entregas', 'caja', 'clientes', 'seguimiento'], inicio: 'recepcion' },
    transportista: { persona: 'P3', etiqueta: 'Repartidor', desc: 'Jorge, repartidor en Lima: ve su ruta del día y marca cada entrega desde el celular.', ill: 'moto', nav: ['ruta', 'seguimiento'], inicio: 'ruta', requiere: 'reparto' },
    jefe: { persona: 'P2', etiqueta: 'Jefa de operaciones', desc: 'Carla: envíos en riesgo, despacho de camiones, reportes y reglas de tarifa.', ill: 'camion', nav: ['tablero', 'envios', 'manifiestos', 'reparto', 'contraentrega', 'avisos', 'clientes', 'reportes', 'ajustes', 'seguimiento'], inicio: 'tablero' }
  };
  LC.ROLES = ROLES;
  LC.plan = LC.planes.planActual();

  const modDe = v => (LC.vistas[v] && LC.vistas[v].modulo) || null;
  const habilitada = v => { const m = modDe(v); return !m || LC.plan.mods.includes(m); };
  LC.tieneModulo = m => LC.plan.mods.includes(m);
  const puede = v => LC.sesion && ROLES[LC.sesion.rol].nav.includes(v);
  LC.puede = v => puede(v) && habilitada(v);

  function tema(t) {
    try { if (t) localStorage.setItem('lifecargo-tema', t); } catch (e) { /* sin almacenamiento */ }
    let v = 'light';
    try { v = localStorage.getItem('lifecargo-tema') || 'light'; } catch (e) { /* claro por defecto */ }
    document.documentElement.dataset.theme = v;
    const b = document.getElementById('btn-tema');
    if (b) { b.innerHTML = icon(v === 'dark' ? 'sun' : 'moon'); b.setAttribute('aria-label', v === 'dark' ? 'Usar modo claro' : 'Usar modo oscuro'); }
  }

  function rolInicial() {
    const q = new URLSearchParams(location.search).get('demo');
    if (q && ROLES[q]) { try { sessionStorage.setItem('lifecargo-rol', q); } catch (e) { /* */ } return q; }
    try { return sessionStorage.getItem('lifecargo-rol'); } catch (e) { return null; }
  }
  const rolDisponible = rol => !ROLES[rol].requiere || LC.tieneModulo(ROLES[rol].requiere);

  function iniciarSesion(rol) {
    const p = LC.store.persona(ROLES[rol].persona);
    LC.sesion = { rol, personaId: p.id, nombre: p.nombre, cargo: p.cargo, agencia: p.agencia, persona: p };
    document.body.dataset.rol = rol;
  }

  function itemNav(v, tab) {
    const def = LC.vistas[v];
    if (!def) return '';
    const bloq = !habilitada(v);
    const badge = !bloq && def.badge ? def.badge() : 0;
    const txt = tab ? (def.corto || def.menu || def.titulo) : (def.menu || def.titulo);
    return '<a href="#/' + v + '" data-v="' + v + '"' + (bloq ? ' class="bloq" title="Disponible en el plan ' + esc(LC.planes.planDe(def.modulo).nombre) + '"' : '') + '>' + icon(def.icono) + '<span>' + esc(txt) + '</span>' +
      (bloq ? icon('lock', 'ic-lock') : badge ? '<em class="num">' + badge + '</em>' : '') + '</a>';
  }

  function pintarNav() {
    const r = ROLES[LC.sesion.rol];
    document.getElementById('nav').innerHTML = r.nav.map(v => itemNav(v)).join('');
    const prim = r.nav.filter(habilitada).slice(0, r.nav.length <= 3 ? 3 : 4);
    const tb = document.getElementById('tabbar');
    tb.innerHTML = prim.map(v => itemNav(v, true)).join('') + (r.nav.length > prim.length ? '<button type="button" id="tab-mas">' + icon('menu') + '<span>Más</span></button>' : '');
    const mas = document.getElementById('tab-mas');
    if (mas) mas.onclick = abrirMas;
    const u = LC.sesion;
    document.getElementById('side-user').innerHTML = LC.ui.avatar(u.nombre) + '<div><b>' + esc(LC.ui.nombreCorto(u.nombre)) + '</b><span>' + esc(u.cargo) + '</span></div>';
    document.getElementById('btn-sim').hidden = u.rol === 'transportista';
    const plan = document.getElementById('plan-pill');
    plan.innerHTML = icon('box') + '<span>Plan ' + esc(LC.plan.nombre) + '</span>';
  }

  function abrirMas() {
    const r = ROLES[LC.sesion.rol];
    const p = LC.ui.panel('<div class="panel-h"><h2>Menú</h2><button class="btn btn-ghost btn-icon" data-close aria-label="Cerrar">' + icon('x') + '</button></div><div class="panel-c mas-menu">' +
      r.nav.map(v => { const d = LC.vistas[v]; return '<a href="#/' + v + '" data-close>' + icon(d.icono) + esc(d.menu || d.titulo) + (habilitada(v) ? '' : icon('lock', 'ic-lock')) + '</a>'; }).join('') +
      '<hr><a href="#" data-cambiar data-close>' + icon('swap') + 'Cambiar de rol</a><a href="web.html">' + icon('globe') + 'Ver la web de la empresa</a><a href="index.html#planes">' + icon('box') + 'Ver los planes</a></div>');
    p.querySelector('[data-cambiar]').onclick = e => { e.preventDefault(); salir(); };
  }

  function ruta() {
    const h = location.hash.replace(/^#\/?/, '');
    const [v, qs] = h.split('?');
    return { vista: v, params: new URLSearchParams(qs || '') };
  }
  LC.ir = (v, params) => { location.hash = '#/' + v + (params ? '?' + new URLSearchParams(params) : ''); };

  /* Vista de módulo no incluido en el plan: explica qué hace y cómo probarlo */
  function renderBloqueada(el, v) {
    const def = LC.vistas[v];
    const mod = LC.planes.MODULOS[def.modulo];
    const plan = LC.planes.planDe(def.modulo);
    const claveP = Object.keys(LC.planes.PLANES).find(k => LC.planes.PLANES[k] === plan);
    const msg = encodeURIComponent('Hola, quiero cotizar el sistema LifeCargo con el módulo "' + mod.nombre + '".');
    el.innerHTML = '<div class="bloqueo">' + icon('lock') + '<h2>' + esc(mod.nombre) + ' no está en tu plan</h2><p>' + esc(mod.desc) + '</p><p class="muted">Viene desde el plan <b>' + esc(plan.nombre) + '</b>. Puedes probarlo ahora sin perder nada.</p>' +
      '<div class="fila"><a class="btn btn-primary" href="app.html?plan=' + claveP + '&demo=' + LC.sesion.rol + '#/' + v + '">Probar con plan ' + esc(plan.nombre) + '</a>' +
      '<a class="btn btn-line" target="_blank" rel="noopener" href="https://wa.me/' + LC.planes.WHATSAPP + '?text=' + msg + '">' + icon('whatsapp') + 'Cotizar por WhatsApp</a></div></div>';
  }

  function render() {
    if (!LC.sesion) return;
    LC.ui.cerrarPanel();
    let { vista, params } = ruta();
    const r = ROLES[LC.sesion.rol];
    if (!puede(vista)) { vista = r.nav.find(v => v === r.inicio && habilitada(v)) || r.nav.find(habilitada); history.replaceState(null, '', '#/' + vista); }
    const def = LC.vistas[vista];
    document.getElementById('titulo').textContent = def.titulo;
    document.title = def.titulo + ' · LifeCargo';
    document.querySelectorAll('#nav a, #tabbar a').forEach(a => a.classList.toggle('on', a.dataset.v === vista));
    // Nodo nuevo en cada render: así no se acumulan los eventos de la vista anterior
    const viejo = document.getElementById('vista');
    const el = viejo.cloneNode(false);
    viejo.replaceWith(el);
    el.className = 'vista v-' + vista;
    if (!habilitada(vista)) renderBloqueada(el, vista); else def.render(el, params);
    document.getElementById('main').scrollTop = 0;
    window.scrollTo(0, 0);
  }
  LC.refrescar = () => { pintarNav(); render(); };
  LC.refrescarNav = () => { pintarNav(); const { vista } = ruta(); document.querySelectorAll('#nav a, #tabbar a').forEach(a => a.classList.toggle('on', a.dataset.v === vista)); };

  function salir() {
    try { sessionStorage.removeItem('lifecargo-rol'); } catch (e) { /* */ }
    LC.sesion = null;
    history.replaceState(null, '', location.pathname);
    mostrarSelector();
  }

  function logo(claro) {
    return '<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="var(--brand)"/><path d="M8 9.5v12.5h7" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M24.5 11.5a6 6 0 1 0 0 9" stroke="#fff" stroke-width="2.8" stroke-linecap="round" fill="none"/></svg><span class="logo-t' + (claro ? ' oscuro' : '') + '">Life<b>Cargo</b></span>';
  }
  LC.logo = logo;

  function mostrarSelector() {
    document.body.classList.add('en-selector');
    const s = document.getElementById('selector');
    s.hidden = false;
    const db = LC.store.db;
    const card = rol => {
      const R = ROLES[rol];
      if (!rolDisponible(rol)) {
        const p = LC.planes.planDe(R.requiere);
        return '<div class="rol rol-bloq">' + LC.illus(R.ill, 56) + '<span><b>' + esc(R.etiqueta) + '</b><span>' + esc(R.desc) + '</span><span class="rol-nota">' + icon('lock') + 'Disponible desde el plan ' + esc(p.nombre) + '</span></span></div>';
      }
      return '<button class="rol" data-rol="' + rol + '">' + LC.illus(R.ill, 56) + '<span><b>' + esc(R.etiqueta) + '</b><span>' + esc(R.desc) + '</span></span>' + icon('arrowR') + '</button>';
    };
    s.innerHTML = '<div class="sel-box"><a class="marca" href="web.html" aria-label="Ir a la web de LifeCargo">' + logo(true) + '</a>' +
      '<h1>¿Con qué rol quieres entrar?</h1><p class="sel-sub">Sistema interno de <b>' + esc(db.empresa.razon) + '</b>, con ' + LC.motor.AGENCIAS.length + ' agencias y ' + LC.ui.num(db.envios.length) + ' envíos de los últimos 30 días. Estás probando el <b>plan ' + esc(LC.plan.nombre) + '</b>.</p>' +
      '<div class="roles">' + Object.keys(ROLES).map(card).join('') + '</div>' +
      '<p class="sel-nota">' + icon('alert') + 'Demo con datos ficticios: SUNAT, RENIEC y los mensajes de WhatsApp son simulados.</p>' +
      '<p class="sel-links"><a href="web.html">' + icon('arrowL') + 'Volver a la web</a><a href="index.html#planes">Ver los planes</a></p></div>';
    s.querySelectorAll('[data-rol]').forEach(b => b.onclick = () => {
      try { sessionStorage.setItem('lifecargo-rol', b.dataset.rol); } catch (e) { /* */ }
      history.replaceState(null, '', location.pathname + '?demo=' + b.dataset.rol);
      entrar(b.dataset.rol);
    });
  }

  function entrar(rol) {
    if (!rolDisponible(rol)) { mostrarSelector(); return; }
    iniciarSesion(rol);
    document.getElementById('selector').hidden = true;
    document.body.classList.remove('en-selector');
    pintarNav();
    if (!location.hash) { const r = ROLES[rol]; location.hash = '#/' + (habilitada(r.inicio) ? r.inicio : r.nav.find(habilitada)); } else render();
  }

  function atajos(e) {
    if (!LC.sesion || e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) { if (e.key === 'Escape') e.target.blur(); return; }
    if (e.key === 'Escape') { LC.ui.cerrarPanel(); return; }
    if (e.key === '/') { const s = document.querySelector('#vista [data-buscar]'); if (s) { e.preventDefault(); s.focus(); } }
    if ((e.key === 'n' || e.key === 'N') && LC.puede('recepcion')) { e.preventDefault(); LC.ir('recepcion'); }
    if (e.key === '?') { e.preventDefault(); ayudaAtajos(); }
  }
  function ayudaAtajos() {
    LC.ui.modal('Atajos de teclado', '<dl class="atajos"><dt><kbd>/</kbd></dt><dd>Buscar en la pantalla</dd><dt><kbd>N</kbd></dt><dd>Nuevo envío (counter)</dd><dt><kbd>Esc</kbd></dt><dd>Cerrar el detalle</dd><dt><kbd>?</kbd></dt><dd>Ver esta ayuda</dd></dl><p class="muted">También puedes usar un lector de código de barras en cualquier buscador: lee el código de la guía.</p>', [['ok', 'Entendido', 'btn-dark']]);
  }

  function init() {
    tema();
    LC.store.init();
    document.getElementById('side-logo').innerHTML = logo();
    document.getElementById('btn-tema').onclick = () => tema(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    document.getElementById('btn-salir').onclick = salir;
    document.getElementById('btn-atajos').onclick = ayudaAtajos;
    document.getElementById('btn-sim').onclick = () => {
      const e = LC.envios.simular();
      LC.ui.toast('Nuevo envío ' + e.id + ' de ' + LC.ui.nombreCorto(e.remitente.nombre) + ' a ' + LC.motor.agencia(e.destino).ciudad, 'info');
      LC.refrescar();
    };
    window.addEventListener('hashchange', render);
    document.addEventListener('keydown', atajos);
    const rol = rolInicial();
    if (rol && ROLES[rol] && rolDisponible(rol)) entrar(rol); else mostrarSelector();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
