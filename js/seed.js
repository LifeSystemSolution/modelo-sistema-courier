/* Datos de ejemplo: 30 días de operación de una empresa de courier ficticia.
   Generador con semilla fija: los datos son iguales en cada carga; las fechas se calculan desde hoy.
   Nada se crea, entrega ni cobra hoy: lo que caería hoy queda pendiente. */
(function () {
  const LC = (window.LC = window.LC || {});

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const NOMBRES_F = ['Rosa', 'María', 'Lucía', 'Ana', 'Carmen', 'Milagros', 'Yesenia', 'Katherine', 'Flor', 'Gladys', 'Patricia', 'Sofía', 'Valeria', 'Diana', 'Elizabeth', 'Juana', 'Roxana', 'Fiorella', 'Nataly', 'Mercedes'];
  const NOMBRES_M = ['Jorge', 'Luis', 'Carlos', 'José', 'Miguel', 'Juan', 'Víctor', 'Edwin', 'Wilmer', 'Kevin', 'Diego', 'Renzo', 'Óscar', 'Raúl', 'César', 'Alberto', 'Percy', 'Julio', 'Fernando', 'Hugo'];
  const APELLIDOS = ['Quispe', 'Huamán', 'Mamani', 'Flores', 'Rojas', 'Sánchez', 'García', 'Chávez', 'Torres', 'Ramírez', 'Mendoza', 'Vargas', 'Castillo', 'Ccori', 'Condori', 'Paredes', 'Vega', 'Apaza', 'Zapata', 'Ríos', 'Salazar', 'Gutiérrez', 'Cárdenas', 'Poma', 'Espinoza', 'Ticona', 'Villanueva', 'Cruz', 'Huanca', 'Ramos'];
  const DISTRITOS = {
    LIM: ['Miraflores', 'San Juan de Lurigancho', 'Los Olivos', 'Santiago de Surco', 'San Miguel', 'Comas', 'Ate', 'La Molina', 'Jesús María', 'Villa El Salvador', 'Chorrillos', 'Breña', 'San Martín de Porres', 'Lince'],
    ARE: ['Cayma', 'Yanahuara', 'Cerro Colorado', 'José Luis Bustamante y Rivero', 'Paucarpata'],
    TRU: ['Víctor Larco Herrera', 'La Esperanza', 'El Porvenir', 'Trujillo Cercado'],
    PIU: ['Castilla', 'Veintiséis de Octubre', 'Piura Cercado'],
    CUS: ['Wanchaq', 'San Sebastián', 'San Jerónimo', 'Santiago'],
    HYO: ['El Tambo', 'Chilca', 'Huancayo Cercado']
  };
  const CALLES = ['Jr. Los Pinos', 'Av. Los Álamos', 'Calle Las Begonias', 'Jr. Huáscar', 'Av. Grau', 'Psje. San Martín', 'Jr. Ayacucho', 'Av. Primavera', 'Calle Los Cedros', 'Jr. Bolognesi', 'Av. Brasil', 'Calle Lima'];
  const CONTENIDO_P = ['Ropa (3 prendas)', 'Zapatillas', 'Libros', 'Regalo de cumpleaños', 'Celular y accesorios', 'Repuestos de moto', 'Herramientas', 'Productos de belleza', 'Juguetes', 'Encomienda familiar (víveres)', 'Laptop usada', 'Útiles escolares'];
  const MOTIVOS_FALLA = ['No había nadie en el domicilio', 'Dirección incompleta, se llamó sin respuesta', 'El cliente pidió reprogramar', 'Zona sin acceso por obras'];
  const MOTIVOS_DEMORA = ['Carretera bloqueada por huaico, unidad detenida', 'Falla mecánica de la unidad, se trasbordó la carga', 'Sin espacio en la unidad, sale en el siguiente viaje', 'Retención en control de carretera'];

  function seed() {
    const rnd = mulberry32(20261124);
    const r = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const pick = arr => arr[Math.floor(rnd() * arr.length)];
    const peso = pares => { const tot = pares.reduce((s, p) => s + p[1], 0); let x = rnd() * tot; for (const p of pares) { if ((x -= p[1]) <= 0) return p[0]; } return pares[0][0]; };
    const M = LC.motor;

    const hoy0 = new Date(); hoy0.setHours(0, 0, 0, 0);
    const CORTE = hoy0.getTime();
    const DIA = 864e5;

    const nombre = () => { const f = rnd() < 0.5; return (f ? pick(NOMBRES_F) : pick(NOMBRES_M)) + ' ' + pick(APELLIDOS) + ' ' + pick(APELLIDOS); };
    const dni = () => String(r(40000000, 79999999));
    const tel = () => '9000' + String(r(10000, 99999));
    const direccion = ag => pick(CALLES) + ' ' + r(100, 1890) + ', ' + pick(DISTRITOS[ag]);

    const personas = [
      { id: 'P1', nombre: 'Rosa Quispe Huamán', cargo: 'Counter · Agencia Lima', rol: 'counter', agencia: 'LIM', demo: 'counter' },
      { id: 'P2', nombre: 'Carla Mendoza Ríos', cargo: 'Jefa de operaciones', rol: 'jefe', agencia: 'LIM', demo: 'jefe' },
      { id: 'P3', nombre: 'Jorge Huamán Ccori', cargo: 'Repartidor · Lima', rol: 'reparto', agencia: 'LIM', vehiculo: 'Moto con caja · placa demo 1234-LC', demo: 'transportista' },
      { id: 'P4', nombre: 'Luis Ramírez Soto', cargo: 'Repartidor · Lima', rol: 'reparto', agencia: 'LIM', vehiculo: 'Furgoneta · placa demo LC-4521' },
      { id: 'P5', nombre: 'Wilmer Castillo Zapata', cargo: 'Conductor · ruta Norte', rol: 'conductor', agencia: 'LIM', vehiculo: 'Camión 8 t · placa demo LC-8801', ruta: ['TRU', 'PIU'] },
      { id: 'P6', nombre: 'Edwin Flores Apaza', cargo: 'Conductor · ruta Sur', rol: 'conductor', agencia: 'LIM', vehiculo: 'Camión 10 t · placa demo LC-9902', ruta: ['ARE', 'CUS'] },
      { id: 'P7', nombre: 'Hugo Vargas Rojas', cargo: 'Conductor · ruta Centro', rol: 'conductor', agencia: 'LIM', vehiculo: 'Camión 5 t · placa demo LC-5503', ruta: ['HYO'] },
      { id: 'P8', nombre: 'Sofía Cárdenas Vega', cargo: 'Counter · Agencia Lima', rol: 'counter', agencia: 'LIM' },
      { id: 'P9', nombre: 'Miguel Torres Chávez', cargo: 'Counter · Agencia Arequipa', rol: 'counter', agencia: 'ARE' },
      { id: 'P10', nombre: 'Lucía Paredes Vega', cargo: 'Counter · Agencia Trujillo', rol: 'counter', agencia: 'TRU' },
      { id: 'P11', nombre: 'Kevin Mamani Condori', cargo: 'Counter · Agencia Cusco', rol: 'counter', agencia: 'CUS' },
      { id: 'P12', nombre: 'Ana Sánchez Ruiz', cargo: 'Counter · Agencia Piura', rol: 'counter', agencia: 'PIU' },
      { id: 'P13', nombre: 'Diego Rojas Poma', cargo: 'Counter · Agencia Huancayo', rol: 'counter', agencia: 'HYO' }
    ];
    const counterDe = ag => { const c = personas.filter(p => p.rol === 'counter' && p.agencia === ag); return c[Math.floor(rnd() * c.length)]; };
    const conductorDe = (o, d) => { const dest = o === 'LIM' ? d : o; return personas.find(p => p.ruta && p.ruta.includes(dest)) || personas[4]; };

    const EMPRESAS = [
      ['Moda Gamarra Andina E.I.R.L.', 'tienda', 'LIM'], ['TecnoStore Perú S.A.C.', 'tienda', 'LIM'], ['Cosméticos Brillo Natural E.I.R.L.', 'tienda', 'LIM'],
      ['Juguetería Arcoíris E.I.R.L.', 'tienda', 'LIM'], ['Repuestos El Volante S.A.C.', 'empresa', 'LIM'], ['Librería Pluma Fina S.R.L.', 'empresa', 'LIM'],
      ['Ferretería El Tornillo E.I.R.L.', 'empresa', 'TRU'], ['Café de Altura Cusqueño S.A.C.', 'empresa', 'CUS'], ['Textiles Alpaca Sur S.R.L.', 'empresa', 'ARE'],
      ['Estudio Contable Ramírez y Asociados S.C.', 'empresa', 'LIM'], ['Agroexport Valle Norte S.A.C.', 'empresa', 'PIU'], ['Farmacia Santa Clara S.A.C.', 'empresa', 'HYO']
    ];
    const clientes = [];
    EMPRESAS.forEach((e, i) => clientes.push({ id: 'C' + (i + 1), tipo: 'empresa', nombre: e[0], doc: '20' + r(600000000, 619999999), tel: tel(), agencia: e[2], tienda: e[1] === 'tienda', correo: 'envios@ejemplo-' + (i + 1) + '.pe', desde: CORTE - r(60, 400) * DIA }));
    for (let i = 0; i < 30; i++) {
      const ag = peso([['LIM', 60], ['ARE', 9], ['TRU', 9], ['PIU', 7], ['CUS', 8], ['HYO', 7]]);
      clientes.push({ id: 'C' + (clientes.length + 1), tipo: 'persona', nombre: nombre(), doc: dni(), tel: tel(), agencia: ag, desde: CORTE - r(10, 500) * DIA });
    }

    const envios = [];
    const manifiestos = {};
    let nro = 104200;
    const DESTINOS_LIMA = [['ARE', 20], ['TRU', 19], ['PIU', 14], ['CUS', 15], ['HYO', 16], ['LIM', 16]];

    function hora(dia, h, m) { const d = new Date(dia); d.setHours(h, m || 0, 0, 0); return d.getTime(); }
    function siguienteHabil(t, h, m) { const d = new Date(t); do { d.setDate(d.getDate() + 1); } while (!M.esHabil(d)); d.setHours(h, m || 0, 0, 0); return d.getTime(); }

    for (let dAgo = 30; dAgo >= 1; dAgo--) {
      const dia = new Date(CORTE - dAgo * DIA);
      const dow = dia.getDay();
      const feriado = M.FERIADOS.includes(M.diaISO(dia));
      let n = dow === 0 ? r(6, 10) : dow === 6 ? r(24, 30) : r(40, 52);
      if (feriado) n = r(5, 9);
      for (let k = 0; k < n; k++) {
        const origen = peso([['LIM', 55], ['ARE', 10], ['TRU', 10], ['PIU', 7], ['CUS', 9], ['HYO', 9]]);
        const destino = origen === 'LIM' ? peso(DESTINOS_LIMA) : peso([['LIM', 62], ['ARE', 8], ['TRU', 8], ['PIU', 6], ['CUS', 8], ['HYO', 8]].filter(p => p[0] !== origen));
        const hh = peso([[9, 12], [10, 14], [11, 14], [12, 10], [13, 8], [14, 9], [15, 10], [16, 11], [17, 12], [18, 9], [19, 5]]);
        const creado = hora(dia, hh, r(0, 59));
        // Remitente: 62% clientes frecuentes
        let rem;
        if (rnd() < 0.62) {
          const cands = clientes.filter(c => c.agencia === origen);
          const c = cands.length ? pick(cands) : pick(clientes);
          rem = { clienteId: c.id, nombre: c.nombre, doc: c.doc, tel: c.tel, tipo: c.tipo };
        } else {
          rem = { clienteId: null, nombre: nombre(), doc: dni(), tel: tel(), tipo: 'persona' };
        }
        const cli = rem.clienteId ? clientes.find(c => c.id === rem.clienteId) : null;
        const esTienda = cli && cli.tienda;
        const domicilio = rnd() < (destino === 'LIM' ? 0.72 : 0.42) || (esTienda && rnd() < 0.5);
        const esSobre = !esTienda && rnd() < (cli && cli.tipo === 'empresa' ? 0.45 : 0.14);
        const bultos = [];
        const nb = esSobre ? 1 : peso([[1, 80], [2, 15], [3, 5]]);
        for (let b = 0; b < nb; b++) {
          if (esSobre) bultos.push({ tipo: 'sobre', peso: 0.2, l: 0, a: 0, h: 0 });
          else {
            const p = Math.round(Math.min(28, Math.exp(rnd() * 2.6 - 0.3)) * 10) / 10;
            const lado = Math.round(15 + Math.cbrt(p) * 12 + r(0, 10));
            bultos.push({ tipo: 'paquete', peso: Math.max(0.3, p), l: lado, a: Math.round(lado * 0.7), h: Math.round(lado * (0.4 + rnd() * 0.4)) });
          }
        }
        const servicio = rnd() < 0.18 ? 'express' : 'estandar';
        const contenido = esSobre ? 'Documentos' : esTienda ? pick(['Pedido web: ropa', 'Pedido web: accesorios', 'Pedido web: cosméticos', 'Pedido web: juguetes', 'Pedido web: audífonos']) : cli && cli.tipo === 'empresa' ? pick(['Repuestos', 'Mercadería', 'Libros', 'Herramientas', 'Café en grano', 'Muestras', 'Insumos']) : pick(CONTENIDO_P);
        const valorDeclarado = esSobre ? 0 : rnd() < 0.35 ? r(1, 12) * 50 : 0;
        const contraEntrega = esTienda && rnd() < 0.72 ? r(4, 70) * 5 : 0;
        const dest = { nombre: nombre(), doc: dni(), tel: tel(), dir: domicilio ? direccion(destino) : '' };
        const counter = counterDe(origen);
        const e = {
          id: 'LC-' + (++nro), creado, origen, destino, remitente: rem, destinatario: dest,
          tipoEntrega: domicilio ? 'domicilio' : 'agencia', servicio, bultos, contenido, valorDeclarado, contraEntrega,
          counter: counter.id, intentos: 0, eventos: []
        };
        e.tarifa = M.tarifa(e).total;
        e.promesa = M.promesa(creado, origen, destino, servicio);
        const medio = cli && cli.tipo === 'empresa' ? peso([['Transferencia', 60], ['Yape', 15], ['Tarjeta', 25]]) : peso([['Efectivo', 44], ['Yape', 32], ['Plin', 9], ['Tarjeta', 15]]);
        e.pago = { medio, t: creado, por: counter.id, monto: e.tarifa };

        // Línea de tiempo simulada
        const ev = [];
        const add = (t, estado, lugar, quien, nota) => ev.push({ t, estado, lugar, por: quien || null, nota: nota || '' });
        add(creado, 'recibido', origen, counter.id, 'Recibido en agencia ' + M.agencia(origen).nombre);
        let llegada;
        const demora = rnd() < 0.075;
        if (origen === destino) {
          // Local: se clasifica en el turno de noche del mismo día
          const t = new Date(creado);
          if (t.getHours() >= 19) { t.setDate(t.getDate() + 1); t.setHours(6, r(0, 40), 0, 0); } else t.setHours(21, r(0, 50), 0, 0);
          llegada = t.getTime() + (demora ? DIA : 0);
          add(llegada, 'en_destino', destino, null, 'Clasificado en almacén ' + M.agencia(destino).ciudad + ' para su entrega');
        } else {
          let salida = new Date(creado);
          if (salida.getHours() >= 18) salida.setDate(salida.getDate() + 1);
          salida.setHours(20, r(0, 45), 0, 0);
          let nota = '';
          if (demora && rnd() < 0.35) { salida = new Date(salida.getTime() + DIA); nota = MOTIVOS_DEMORA[2]; }
          const mKey = M.diaISO(salida) + '-' + origen + '-' + destino;
          const cond = conductorDe(origen, destino);
          if (!manifiestos[mKey]) manifiestos[mKey] = { id: 'M-' + mKey.replace(/-/g, '').slice(2), origen, destino, salida: salida.getTime(), conductor: cond.id, vehiculo: cond.vehiculo, envios: [], demoraH: rnd() < 0.07 ? r(24, 54) : 0 };
          const man = manifiestos[mKey];
          man.envios.push(e.id);
          e.manifiesto = man.id;
          add(salida.getTime(), 'en_ruta', origen, cond.id, 'Salió en el manifiesto ' + man.id + (nota ? ' · ' + nota : ''));
          let arr = salida.getTime() + M.horasTransito(origen, destino) * 36e5;
          if (man.demoraH) { arr += man.demoraH * 36e5; man.incidencia = man.incidencia || pick(MOTIVOS_DEMORA.slice(0, 2).concat(MOTIVOS_DEMORA[3])); }
          const a = new Date(arr);
          if (a.getHours() < 7) a.setHours(7, r(20, 50), 0, 0);
          if (a.getHours() >= 21) { a.setDate(a.getDate() + 1); a.setHours(7, r(20, 50), 0, 0); }
          llegada = a.getTime();
          man.llegada = Math.max(man.llegada || 0, llegada);
          add(llegada, 'en_destino', destino, counterDe(destino).id, 'Llegó a la agencia ' + M.agencia(destino).nombre + (man.incidencia ? ' · ' + man.incidencia : ''));
        }
        // Entrega
        if (domicilio) {
          let intento = new Date(llegada).getHours() < 8 && M.esHabil(llegada) ? hora(llegada, 9, r(0, 30)) : siguienteHabil(llegada, 9, r(0, 30));
          const rep = destino === 'LIM' ? (rnd() < 0.68 ? 'P3' : 'P4') : null;
          for (let i = 0; i < 3; i++) {
            add(intento, 'en_reparto', destino, rep, 'Salió a reparto');
            const fin = intento + r(1, 8) * 36e5 + r(0, 59) * 6e4;
            if (rnd() < (i === 0 ? 0.08 : 0.3) && i < 2) {
              e.intentos++;
              add(fin, 'en_destino', destino, rep, 'Intento fallido: ' + pick(MOTIVOS_FALLA));
              intento = siguienteHabil(fin, 9, r(0, 30));
            } else {
              add(fin, 'entregado', destino, rep, 'Entregado a ' + dest.nombre.split(' ').slice(0, 2).join(' ') + ' · DNI verificado');
              break;
            }
          }
          e.repartidor = rep;
        } else {
          const espera = peso([[0, 34], [1, 30], [2, 16], [3, 9], [4, 5], [8, 6]]);
          let t = llegada + espera * DIA;
          const dd = new Date(t);
          if (espera === 0) { if (dd.getHours() < 10) dd.setHours(10 + r(0, 8), r(0, 59)); else dd.setHours(Math.min(19, dd.getHours() + r(1, 4)), r(0, 59)); }
          else dd.setHours(r(9, 19), r(0, 59));
          if (!M.esHabil(dd)) dd.setDate(dd.getDate() + 1);
          add(dd.getTime(), 'entregado', destino, counterDe(destino).id, 'Recogido en agencia por ' + dest.nombre.split(' ').slice(0, 2).join(' ') + ' · DNI verificado');
        }
        // Corte: solo lo ocurrido antes de hoy
        e.eventos = ev.filter(x => x.t < CORTE).sort((a, b) => a.t - b.t);
        const ult = e.eventos[e.eventos.length - 1];
        e.estado = ult.estado;
        e.intentos = e.eventos.filter(x => x.nota.startsWith('Intento fallido')).length;
        if (e.estado === 'entregado') {
          e.entregado = ult.t;
          if (e.contraEntrega) e.ce = { cobrado: ult.t, medio: peso([['Efectivo', 55], ['Yape', 35], ['Plin', 10]]), por: ult.por };
        }
        if (e.estado !== 'en_reparto' && e.estado !== 'entregado' && e.repartidor && e.tipoEntrega === 'domicilio' && e.estado !== 'en_destino') delete e.repartidor;
        envios.push(e);
      }
    }

    // Reparto de hoy en Lima: pendientes a domicilio en la agencia Lima, asignados pero aún sin salir
    envios.filter(e => e.estado === 'en_destino' && e.destino === 'LIM' && e.tipoEntrega === 'domicilio').forEach((e, i) => { e.repartidor = i % 5 === 4 ? 'P4' : 'P3'; e.programado = M.diaISO(CORTE); });
    envios.filter(e => e.estado === 'en_destino' && e.destino !== 'LIM').forEach(e => { delete e.repartidor; });

    // Manifiestos: estado según lo ocurrido antes de hoy
    const mans = Object.values(manifiestos).map(m => {
      m.estado = m.salida >= CORTE ? 'preparando' : (m.llegada && m.llegada < CORTE ? 'llegado' : 'en_ruta');
      if (m.estado === 'preparando') {
        // Aún no sale: sus envíos vuelven a estar en agencia de origen
        m.envios.forEach(id => { const e = envios.find(x => x.id === id); if (e) delete e.manifiesto; });
        return null;
      }
      if (m.estado === 'en_ruta') delete m.llegada;
      return m;
    }).filter(Boolean).sort((a, b) => b.salida - a.salida);

    // Liquidaciones de contra entrega: cada viernes se liquida lo cobrado hasta el jueves
    const vie = new Date(CORTE - DIA); while (vie.getDay() !== 5) vie.setDate(vie.getDate() - 1);
    const ultimaLiq = vie.getTime();
    envios.forEach(e => { if (e.ce && e.ce.cobrado < ultimaLiq) { e.ce.liquidado = ultimaLiq + 11 * 36e5; } });

    // Cierres de caja de la agencia Lima
    const cajas = [];
    for (let dAgo = 30; dAgo >= 1; dAgo--) {
      const dia = CORTE - dAgo * DIA;
      const cob = envios.filter(e => e.origen === 'LIM' && e.pago.medio === 'Efectivo' && e.pago.t >= dia && e.pago.t < dia + DIA);
      const ceEf = envios.filter(e => e.ce && e.destino === 'LIM' && e.ce.medio === 'Efectivo' && e.ce.cobrado >= dia && e.ce.cobrado < dia + DIA);
      const esperado = 200 + cob.reduce((s, e) => s + e.tarifa, 0) + ceEf.reduce((s, e) => s + e.contraEntrega, 0);
      if (!cob.length) continue;
      const dif = rnd() < 0.8 ? 0 : (rnd() < 0.5 ? -1 : 1) * r(1, 6);
      cajas.push({ fecha: M.diaISO(dia), agencia: 'LIM', fondo: 200, abre: dia + 8.5 * 36e5, cierra: dia + 20 * 36e5, esperado: Math.round(esperado * 10) / 10, contado: Math.round((esperado + dif) * 10) / 10, por: 'P1' });
    }

    const historial = [
      { t: CORTE - 9 * DIA + 10 * 36e5, usuario: 'Carla Mendoza Ríos', accion: 'Cambió la tarifa por kg', detalle: 'Tramo 600 a 1 200 km: de S/ 1.30 a S/ 1.40' },
      { t: CORTE - 16 * DIA + 15 * 36e5, usuario: 'Carla Mendoza Ríos', accion: 'Ajustó los pesos del riesgo', detalle: 'Detenido: de 15 a 20 puntos' },
      { t: CORTE - 22 * DIA + 9 * 36e5, usuario: 'Carla Mendoza Ríos', accion: 'Creó el usuario', detalle: 'Sofía Cárdenas Vega · Counter Lima' }
    ];

    return {
      empresa: { razon: 'LifeCargo Express S.A.C. (ficticia)', nombre: 'LifeCargo Express', ruc: '20000000000', direccion: 'Av. Nicolás Ayllón 4250, Ate, Lima (referencial)', whatsapp: '51957111471', horario: 'Lunes a sábado 8:30 a 20:00 · domingos 9:00 a 13:00' },
      ajustes: {
        tarifa: Object.assign({}, M.TARIFA_BASE),
        pesos: Object.assign({}, M.PESOS_BASE),
        costos: { lineaKg100: 0.1, localKg: 0.3, repartoEntrega: 4.5, comisionTarjeta: 3.5, fijoDia: 520 },
        plantillas: {
          recibido: 'Hola {destinatario}, {remitente} te envió un paquete con LifeCargo. Código {codigo}. Llega el {promesa}.',
          en_destino: 'Hola {destinatario}, tu envío {codigo} ya está en nuestra agencia {agencia}.',
          en_reparto: 'Hola {destinatario}, tu envío {codigo} salió a reparto hoy. Ten tu DNI a la mano.',
          entregado: 'Tu envío {codigo} fue entregado. Gracias por confiar en LifeCargo.'
        }
      },
      personas, clientes, envios, manifiestos: mans, cajas, historial,
      cajaHoy: null,
      avisos: [],
      contadores: { envio: nro, manifiesto: 0 }
    };
  }

  LC.seed = seed;
})();
