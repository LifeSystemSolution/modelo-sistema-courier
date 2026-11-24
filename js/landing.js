/* Página de planes: widget del puntaje (mismo motor del sistema), planes, "arma tu plan", calculadora y accesos */
(function () {
  const LC = (window.LC = window.LC || {});
  const U = LC.ui, esc = U.esc, icon = LC.icon, M = LC.motor, P = LC.planes;
  const WA = P.WHATSAPP;
  const wa = txt => 'https://wa.me/' + WA + '?text=' + encodeURIComponent(txt);
  const logo = '<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="var(--brand)"/><path d="M8 9.5v12.5h7" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M24.5 11.5a6 6 0 1 0 0 9" stroke="#fff" stroke-width="2.8" stroke-linecap="round" fill="none"/></svg><span class="logo-t oscuro">Life<b>Cargo</b></span>';

  function tema(t) {
    try { if (t) localStorage.setItem('lifecargo-tema', t); } catch (e) { /* */ }
    let v = 'light';
    try { v = localStorage.getItem('lifecargo-tema') || 'light'; } catch (e) { /* */ }
    document.documentElement.dataset.theme = v;
    const b = document.getElementById('btn-tema');
    b.innerHTML = icon(v === 'dark' ? 'sun' : 'moon');
    b.setAttribute('aria-label', v === 'dark' ? 'Usar modo claro' : 'Usar modo oscuro');
  }

  /* ===== Widget: el mismo cálculo de riesgo que usa el sistema ===== */
  function widget() {
    const el = document.getElementById('widget');
    const s = { destino: 'CUS', estado: 'en_ruta', usado: 70, horas: 30, intentos: 0 };
    el.innerHTML = '<div class="w-h"><h2>Pruebe el puntaje</h2><p class="muted">Un envío Lima → destino. Mueva los valores.</p></div>' +
      '<div class="w-c"><label class="campo">Destino<select data-w="destino">' + M.AGENCIAS.map(a => '<option value="' + a.id + '"' + (a.id === s.destino ? ' selected' : '') + '>' + esc(a.ciudad) + '</option>').join('') + '</select></label>' +
      '<label class="campo">Dónde está<select data-w="estado"><option value="recibido">En agencia de origen</option><option value="en_ruta" selected>En camino</option><option value="en_destino">En agencia de destino</option><option value="en_reparto">En reparto</option></select></label>' +
      '<label class="campo">Plazo usado <output data-o="usado">70%</output><input type="range" min="0" max="140" step="5" value="70" data-w="usado"></label>' +
      '<label class="campo">Horas en ese estado <output data-o="horas">30 h</output><input type="range" min="0" max="96" step="2" value="30" data-w="horas"></label>' +
      '<div class="campo"><span>Intentos fallidos</span><div class="seg3" role="radiogroup" aria-label="Intentos fallidos">' + [0, 1, 2].map(n => '<button type="button" data-int="' + n + '">' + n + '</button>').join('') + '</div></div></div>' +
      '<div class="w-res" data-res></div>';
    function pintar() {
      const ahora = Date.now();
      const dias = M.diasTransito('LIM', s.destino, 'estandar');
      const total = dias * 864e5;
      const creado = ahora - total * s.usado / 100;
      const e = { origen: 'LIM', destino: s.destino, creado, promesa: creado + total, estado: s.estado, tipoEntrega: 'domicilio', intentos: s.intentos, eventos: [{ t: creado }, { t: ahora - s.horas * 36e5 }] };
      const r = M.riesgo(e);
      el.querySelector('[data-res]').innerHTML = U.medidor(r);
      el.querySelector('[data-o=usado]').textContent = s.usado + '%';
      el.querySelector('[data-o=horas]').textContent = s.horas + ' h';
      el.querySelectorAll('[data-int]').forEach(b => { b.classList.toggle('on', Number(b.dataset.int) === s.intentos); b.setAttribute('aria-pressed', Number(b.dataset.int) === s.intentos); });
    }
    el.querySelectorAll('[data-w]').forEach(i => i.oninput = () => { s[i.dataset.w] = i.type === 'range' ? Number(i.value) : i.value; pintar(); });
    el.querySelectorAll('[data-int]').forEach(b => b.onclick = () => { s.intentos = Number(b.dataset.int); pintar(); });
    pintar();
  }

  /* ===== Planes ===== */
  function planes() {
    const el = document.getElementById('planes-lista');
    const orden = ['basico', 'control', 'completo'];
    el.innerHTML = orden.map((k, i) => {
      const p = P.PLANES[k];
      const nuevos = i === 0 ? p.mods : p.mods.filter(m => !P.PLANES[orden[i - 1]].mods.includes(m));
      return '<article class="l-plan' + (k === 'control' ? ' l-plan-dest' : '') + '"><h3>' + esc(p.nombre) + '</h3><p class="l-plan-para">' + esc(p.para) + '</p>' +
        '<ul>' + (i ? '<li class="mas">' + icon('check') + 'Todo lo del plan ' + esc(P.PLANES[orden[i - 1]].nombre) + '</li>' : '') + nuevos.map(m => '<li>' + icon('check') + '<span><b>' + esc(P.MODULOS[m].nombre) + '</b><small>' + esc(P.MODULOS[m].desc) + '</small></span></li>').join('') + '</ul>' +
        '<div class="l-plan-acc"><a class="btn ' + (k === 'control' ? 'btn-primary' : 'btn-dark') + '" href="app.html?plan=' + k + '">Probar ' + esc(p.nombre) + '</a><a class="btn btn-ghost" target="_blank" rel="noopener" href="' + wa('Hola, quiero cotizar el sistema LifeCargo plan ' + p.nombre + ' para mi courier.') + '">Cotizar</a></div></article>';
    }).join('');

    const arma = document.getElementById('arma');
    const sel = new Set(P.PLANES.basico.mods);
    arma.innerHTML = '<div class="l-arma-h"><h3>Arme su plan</h3><p class="muted">Marque solo los módulos que necesita. Los tres primeros vienen siempre.</p></div><div class="l-mods">' +
      Object.keys(P.MODULOS).map(m => '<label class="l-mod' + (P.MODULOS[m].fijo ? ' fijo' : '') + '"><input type="checkbox" value="' + m + '"' + (sel.has(m) ? ' checked' : '') + (P.MODULOS[m].fijo ? ' disabled' : '') + '><span><b>' + esc(P.MODULOS[m].nombre) + '</b><small>' + esc(P.MODULOS[m].desc) + '</small></span></label>').join('') +
      '</div><div class="l-arma-f"><span data-n class="num"></span><a class="btn btn-primary" data-probar>Probar mi plan</a><a class="btn btn-line" data-wa target="_blank" rel="noopener">' + icon('whatsapp') + 'Cotizar este plan</a></div>';
    function act() {
      const mods = [...arma.querySelectorAll('input:checked')].map(i => i.value);
      arma.querySelector('[data-n]').textContent = U.plural(mods.length, 'módulo') + ' elegidos';
      arma.querySelector('[data-probar]').href = 'app.html?plan=custom&mods=' + mods.join(',');
      arma.querySelector('[data-wa]').href = wa('Hola, quiero cotizar el sistema LifeCargo con estos módulos: ' + mods.map(m => P.MODULOS[m].nombre).join(', ') + '.');
    }
    arma.querySelectorAll('input').forEach(i => i.onchange = act);
    act();
  }

  /* ===== Calculadora de ahorro (estimación) ===== */
  function calc() {
    const el = document.getElementById('calc');
    const res = document.getElementById('calc-res');
    const C = [['envios', 'Envíos por día', 40, 1, 2000, 1, ''], ['pct', 'De cada 100, cuántos llaman a preguntar', 30, 0, 100, 1, '%'], ['min', 'Minutos por llamada (buscar y responder)', 4, 1, 20, 1, 'min'], ['hora', 'Costo de una hora de counter', 9, 1, 60, 0.5, 'S/'], ['red', 'Llamadas que se evitan con rastreo y avisos', 60, 0, 90, 5, '%']];
    el.innerHTML = C.map(c => '<label class="campo">' + c[1] + '<span class="l-in"><input type="number" min="' + c[3] + '" max="' + c[4] + '" step="' + c[5] + '" value="' + c[2] + '" data-c="' + c[0] + '" inputmode="decimal"><em>' + c[6] + '</em></span></label>').join('');
    function pintar() {
      const v = {};
      el.querySelectorAll('[data-c]').forEach(i => { v[i.dataset.c] = Math.max(0, Number(i.value) || 0); });
      const llamadasMes = v.envios * 26 * v.pct / 100;
      const horasMes = llamadasMes * v.min / 60;
      const ahorroH = horasMes * v.red / 100;
      const ahorroS = ahorroH * v.hora;
      res.innerHTML = '<p class="muted">Estimación mensual (26 días hábiles)</p><p class="l-big num">' + U.num(Math.round(ahorroH)) + ' h</p><p>de counter libres al mes, que equivalen a unos <b class="num">' + U.soles(ahorroS, 0) + '</b>.</p>' +
        '<p class="formula">' + U.num(v.envios) + ' envíos × 26 días × ' + v.pct + '% llaman × ' + v.min + ' min ÷ 60 = ' + U.num(Math.round(horasMes)) + ' h en llamadas; × ' + v.red + '% evitadas = ' + U.num(Math.round(ahorroH)) + ' h × S/ ' + v.hora + '</p>' +
        '<p class="muted l-sup">Supuestos: lo dice usted. El porcentaje de llamadas evitadas depende de que sus clientes usen el rastreo y reciban avisos; 60% es un punto de partida, no una promesa.</p>';
    }
    el.querySelectorAll('[data-c]').forEach(i => i.oninput = pintar);
    pintar();
  }

  /* ===== Probar por rol ===== */
  function probar() {
    const sel = document.getElementById('plan-sel');
    const roles = document.getElementById('roles');
    let plan = 'completo';
    const R = [
      ['counter', 'Counter', 'Rosa recibe un envío, imprime la guía y entrega en agencia con DNI.', 'agencia', 'recepcion?sim=1'],
      ['transportista', 'Repartidor', 'Jorge sale a reparto y marca cada entrega desde el celular.', 'moto', 'ruta'],
      ['jefe', 'Jefa de operaciones', 'Carla ve el riesgo de retraso, despacha camiones y revisa reportes.', 'camion', 'tablero']
    ];
    sel.innerHTML = ['basico', 'control', 'completo'].map(k => '<button type="button" data-p="' + k + '">Plan ' + P.PLANES[k].nombre + '</button>').join('');
    function pintar() {
      sel.querySelectorAll('[data-p]').forEach(b => { b.classList.toggle('on', b.dataset.p === plan); b.setAttribute('aria-pressed', b.dataset.p === plan); });
      roles.innerHTML = R.map(r => {
        const bloq = r[0] === 'transportista' && !P.PLANES[plan].mods.includes('reparto');
        return bloq ? '<div class="l-rol bloq">' + LC.illus(r[3], 56) + '<span><b>' + r[1] + '</b><small>Este rol viene desde el plan Control.</small></span></div>'
          : '<a class="l-rol" href="app.html?plan=' + plan + '&demo=' + r[0] + '#/' + r[4] + '">' + LC.illus(r[3], 56) + '<span><b>' + r[1] + '</b><small>' + r[2] + '</small></span>' + icon('arrowR') + '</a>';
      }).join('');
    }
    sel.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { plan = b.dataset.p; pintar(); });
    pintar();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('l-logo').innerHTML = logo;
    tema();
    document.getElementById('btn-tema').onclick = () => tema(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    document.getElementById('wa-cierre').href = wa('Hola, vi el demo de LifeCargo y quiero verlo con los datos de mi courier.');
    widget(); planes(); calc(); probar();
  });
})();
