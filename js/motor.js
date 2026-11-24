/* Motor del rubro: agencias, días hábiles, tarifa y riesgo de retraso.
   Lo usan el sistema (app.html), la web pública (web.html) y la página de planes (index.html). */
(function () {
  const LC = (window.LC = window.LC || {});

  /* Agencias de la empresa ficticia. km = distancia por carretera desde Lima (hub). */
  const AGENCIAS = [
    { id: 'LIM', ciudad: 'Lima', nombre: 'Lima · Ate', dir: 'Av. Nicolás Ayllón 4250, Ate (referencial)', km: 0 },
    { id: 'HYO', ciudad: 'Huancayo', nombre: 'Huancayo', dir: 'Av. Ferrocarril 1180, El Tambo (referencial)', km: 300 },
    { id: 'TRU', ciudad: 'Trujillo', nombre: 'Trujillo', dir: 'Av. América Norte 1350 (referencial)', km: 560 },
    { id: 'PIU', ciudad: 'Piura', nombre: 'Piura', dir: 'Av. Sánchez Cerro 820 (referencial)', km: 980 },
    { id: 'ARE', ciudad: 'Arequipa', nombre: 'Arequipa', dir: 'Av. Parra 410, Cercado (referencial)', km: 1010 },
    { id: 'CUS', ciudad: 'Cusco', nombre: 'Cusco', dir: 'Av. de la Cultura 1620, Wanchaq (referencial)', km: 1100 }
  ];
  const agencia = id => AGENCIAS.find(a => a.id === id);

  /* Distancia entre agencias: todo pasa por el hub de Lima. */
  function km(o, d) {
    if (o === d) return 0;
    return agencia(o).km + agencia(d).km;
  }

  /* Feriados nacionales de Perú (2026–2027). */
  const FERIADOS = [
    '2026-01-01', '2026-04-02', '2026-04-03', '2026-05-01', '2026-06-07', '2026-06-29', '2026-07-23', '2026-07-28', '2026-07-29',
    '2026-08-06', '2026-08-30', '2026-10-08', '2026-11-01', '2026-12-08', '2026-12-09', '2026-12-25',
    '2027-01-01', '2027-03-25', '2027-03-26', '2027-05-01', '2027-06-07', '2027-06-29', '2027-07-23', '2027-07-28', '2027-07-29',
    '2027-08-06', '2027-08-30', '2027-10-08', '2027-11-01', '2027-12-08', '2027-12-09', '2027-12-25'
  ];
  const pad = n => String(n).padStart(2, '0');
  const diaISO = d => { d = new Date(d); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const esHabil = d => { d = new Date(d); return d.getDay() !== 0 && !FERIADOS.includes(diaISO(d)); };
  function sumarHabiles(t, dias) {
    const d = new Date(t);
    let n = 0;
    while (n < dias) { d.setDate(d.getDate() + 1); if (esHabil(d)) n++; }
    return d;
  }

  /* Días hábiles prometidos según distancia y servicio. */
  function diasTransito(o, d, servicio) {
    const k = km(o, d);
    let dias = k === 0 ? 1 : k <= 600 ? 2 : k <= 1200 ? 3 : 4;
    if (servicio === 'express') dias = Math.max(1, dias - 1);
    return dias;
  }
  /* Fecha y hora prometida: fin del día hábil (19:00). Lo recibido después de las 18:00 cuenta desde el día siguiente. */
  function promesa(creado, o, d, servicio) {
    const c = new Date(creado);
    if (c.getHours() >= 18) c.setDate(c.getDate() + 1);
    const p = sumarHabiles(c, diasTransito(o, d, servicio));
    p.setHours(19, 0, 0, 0);
    return p.getTime();
  }

  const TARIFA_BASE = {
    baseLocal: 8, baseNacional: 12,
    kgLocal: 0.8, kgCorta: 0.9, kgMedia: 1.4, kgLarga: 1.9,
    sobreLocal: 10, sobreNacional: 15,
    expressPct: 40, domicilio: 6,
    seguroPct: 1, seguroMin: 2,
    cePct: 3, ceMin: 3,
    divisorVol: 5000
  };

  const r1 = n => Math.round(n * 10) / 10;
  const r2 = n => Math.round(n * 100) / 100;

  function pesoFacturable(b, divisor) {
    if (b.tipo === 'sobre') return 0;
    const vol = (Number(b.l) || 0) * (Number(b.a) || 0) * (Number(b.h) || 0) / (divisor || 5000);
    return Math.max(1, Math.ceil(Math.max(Number(b.peso) || 0, vol) * 2) / 2);
  }

  /* Tarifa con desglose: cada línea dice de dónde sale el monto. */
  function tarifa(e, T) {
    T = Object.assign({}, TARIFA_BASE, T || {});
    const k = km(e.origen, e.destino);
    const local = k === 0;
    const precioKg = local ? T.kgLocal : k <= 600 ? T.kgCorta : k <= 1200 ? T.kgMedia : T.kgLarga;
    const tramo = local ? 'Local (misma ciudad)' : k <= 600 ? 'Hasta 600 km' : k <= 1200 ? '600 a 1 200 km' : 'Más de 1 200 km';
    const lineas = [];
    let sub = 0;
    let kgTotal = 0;
    (e.bultos || []).forEach((b, i) => {
      const n = (e.bultos.length > 1 ? 'Bulto ' + (i + 1) + ': ' : '');
      if (b.tipo === 'sobre') {
        const p = local ? T.sobreLocal : T.sobreNacional;
        lineas.push({ c: n + 'Sobre (tarifa plana)', f: local ? 'Local' : 'Nacional', m: p });
        sub += p;
      } else {
        const kg = pesoFacturable(b, T.divisorVol);
        const vol = (Number(b.l) || 0) * (Number(b.a) || 0) * (Number(b.h) || 0) / T.divisorVol;
        kgTotal += kg;
        const base = local ? T.baseLocal : T.baseNacional;
        const m = base + kg * precioKg;
        const motivoKg = vol > (Number(b.peso) || 0) ? 'por volumen ' + r1(vol) + ' kg' : 'peso real';
        lineas.push({ c: n + 'Paquete ' + kg + ' kg (' + motivoKg + ')', f: 'S/ ' + base + ' + ' + kg + ' kg × S/ ' + precioKg.toFixed(2), m: r2(m) });
        sub += m;
      }
    });
    if (e.servicio === 'express') { const m = sub * T.expressPct / 100; lineas.push({ c: 'Servicio express', f: '+' + T.expressPct + '% del flete', m: r2(m) }); sub += m; }
    if (e.tipoEntrega === 'domicilio') { lineas.push({ c: 'Entrega a domicilio', f: 'monto fijo', m: T.domicilio }); sub += T.domicilio; }
    const valor = Number(e.valorDeclarado) || 0;
    if (valor > 0) { const m = Math.max(T.seguroMin, valor * T.seguroPct / 100); lineas.push({ c: 'Seguro', f: T.seguroPct + '% de S/ ' + valor + ' (mín. S/ ' + T.seguroMin + ')', m: r2(m) }); sub += m; }
    const ce = Number(e.contraEntrega) || 0;
    if (ce > 0) { const m = Math.max(T.ceMin, ce * T.cePct / 100); lineas.push({ c: 'Cobro contra entrega', f: T.cePct + '% de S/ ' + ce + ' (mín. S/ ' + T.ceMin + ')', m: r2(m) }); sub += m; }
    const total = Math.round(sub * 10) / 10;
    return { lineas, total, kg: kgTotal, km: k, tramo, precioKg, dias: diasTransito(e.origen, e.destino, e.servicio) };
  }

  /* ===== Riesgo de retraso (0–100) =====
     Cada factor aporta de 0 a su peso. Los pesos se editan en Ajustes. */
  const PESOS_BASE = { plazo: 35, avance: 25, detenido: 20, intentos: 12, ruta: 8 };
  const FACTORES = [
    { clave: 'plazo', etiqueta: 'Plazo' },
    { clave: 'avance', etiqueta: 'Avance' },
    { clave: 'detenido', etiqueta: 'Detenido' },
    { clave: 'intentos', etiqueta: 'Intentos' },
    { clave: 'ruta', etiqueta: 'Ruta' }
  ];
  const ETAPAS = ['recibido', 'en_ruta', 'en_destino', 'en_reparto', 'entregado'];
  /* Horas normales en cada estado antes de considerarse detenido. */
  const NORMAL_H = { recibido: 26, en_ruta: 0, en_destino: 30, en_reparto: 10 };
  const UMBRAL = { alto: 60, medio: 40 };

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  function horasTransito(o, d) { const k = km(o, d); return k === 0 ? 10 : Math.round(k / 45 + 6); }
  function fmtH(h) { h = Math.round(h); return h < 48 ? h + ' h' : Math.round(h / 24) + ' días'; }

  /* Momento en que se cumplió la promesa: para recojo, al quedar disponible en la agencia destino; a domicilio, al entregarse. */
  function cumplido(e) {
    if (e.tipoEntrega === 'agencia') { const ev = e.eventos.find(x => x.estado === 'en_destino'); return ev ? ev.t : null; }
    return e.estado === 'entregado' ? e.entregado : null;
  }

  function riesgo(e, pesos, ahora) {
    const P = Object.assign({}, PESOS_BASE, pesos || {});
    ahora = ahora || Date.now();
    if (e.tipoEntrega === 'agencia' && (e.estado === 'en_destino' || e.estado === 'entregado')) {
      const dias = Math.floor((ahora - cumplido(e)) / 864e5);
      return { puntaje: 0, nivel: 'listo', vencido: false, factores: FACTORES.map(f => ({ clave: f.clave, etiqueta: f.etiqueta, pts: 0, peso: P[f.clave], motivo: f.clave === 'plazo' ? 'Disponible en agencia' + (dias > 0 ? ' hace ' + dias + (dias === 1 ? ' día' : ' días') : ' desde hoy') : '—' })) };
    }
    const total = Math.max(1, e.promesa - e.creado);
    const usado = (ahora - e.creado) / total;
    const fr = [];

    // 1. Plazo: cuánto del tiempo prometido ya se consumió
    let pPlazo;
    let mPlazo;
    if (ahora > e.promesa) { pPlazo = P.plazo; mPlazo = 'Venció hace ' + fmtH((ahora - e.promesa) / 36e5); }
    else {
      pPlazo = Math.round(P.plazo * Math.pow(clamp(usado, 0, 1), 1.6));
      mPlazo = 'Usó el ' + Math.round(clamp(usado, 0, 1) * 100) + '% del plazo · quedan ' + fmtH((e.promesa - ahora) / 36e5);
    }
    fr.push({ clave: 'plazo', pts: pPlazo, peso: P.plazo, motivo: mPlazo });

    // 2. Avance: etapa en la que debería estar según el tiempo usado
    const idx = Math.max(0, ETAPAS.indexOf(e.estado === 'observado' ? 'en_destino' : e.estado));
    const esperado = clamp(usado, 0, 1.2) * 3.2;
    const atraso = Math.max(0, esperado - idx);
    const pAv = Math.round(P.avance * clamp(atraso / 2, 0, 1));
    fr.push({ clave: 'avance', pts: pAv, peso: P.avance, motivo: atraso < 0.5 ? 'Va en la etapa esperada' : 'Debería ir ' + (atraso >= 1.5 ? 'dos etapas' : 'una etapa') + ' más adelante' });

    // 3. Detenido: horas en el estado actual frente a lo normal
    const ult = e.eventos[e.eventos.length - 1];
    const enEstado = (ahora - ult.t) / 36e5;
    const normal = e.estado === 'en_ruta' ? horasTransito(e.origen, e.destino) : (NORMAL_H[e.estado] || 24);
    const ratio = enEstado / normal;
    const pDet = Math.round(P.detenido * clamp((ratio - 1) / 1.5, 0, 1));
    fr.push({ clave: 'detenido', pts: pDet, peso: P.detenido, motivo: fmtH(enEstado) + ' en este estado (normal: hasta ' + fmtH(normal) + ')' });

    // 4. Intentos de entrega fallidos
    const it = e.intentos || 0;
    const pInt = it === 0 ? 0 : it === 1 ? Math.round(P.intentos * 0.6) : P.intentos;
    fr.push({ clave: 'intentos', pts: pInt, peso: P.intentos, motivo: it === 0 ? 'Sin intentos fallidos' : it + (it === 1 ? ' intento fallido' : ' intentos fallidos') });

    // 5. Ruta: destinos lejanos o de sierra tienen más imprevistos
    const k = km(e.origen, e.destino);
    const pRuta = Math.round(P.ruta * (k > 1200 ? 1 : k > 900 ? 0.75 : k > 500 ? 0.4 : 0));
    fr.push({ clave: 'ruta', pts: pRuta, peso: P.ruta, motivo: k === 0 ? 'Entrega local' : k.toLocaleString('es-PE') + ' km por carretera' });

    const factores = FACTORES.map(f => Object.assign({ etiqueta: f.etiqueta }, fr.find(x => x.clave === f.clave)));
    const puntaje = clamp(factores.reduce((s, f) => s + f.pts, 0), 0, 100);
    // Un envío que ya pasó su fecha prometida siempre se trata como riesgo alto
    const vencido = ahora > e.promesa;
    const nivel = vencido || puntaje >= UMBRAL.alto ? 'alto' : puntaje >= UMBRAL.medio ? 'medio' : 'bajo';
    return { puntaje, nivel, factores, vencido };
  }

  LC.motor = { AGENCIAS, agencia, km, FERIADOS, esHabil, sumarHabiles, diasTransito, promesa, TARIFA_BASE, tarifa, pesoFacturable, PESOS_BASE, FACTORES, ETAPAS, UMBRAL, riesgo, cumplido, horasTransito, diaISO };
})();
