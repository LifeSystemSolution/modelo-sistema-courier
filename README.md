# LifeCargo · Demo de sistema para courier y encomiendas

Demo vendible de **LifeSystem Solutions** para empresas de courier en Perú. Tiene tres partes:

| Página | Para quién | Qué muestra |
|---|---|---|
| `index.html` | Dueño del courier que evalúa el sistema | Problema, cómo funciona (capturas reales), **planes Básico / Control / Completo y "Arme su plan"**, calculadora de ahorro, accesos por rol |
| `web.html` | Clientes del courier | Web pública de la empresa ficticia **LifeCargo Express**: rastreo por código, cotizador, agencias, envíos para tiendas, botón **"Ingresar al sistema"** |
| `app.html` | Personal del courier | Sistema interno por rol, con los módulos del plan elegido |

Empresa, agencias, clientes, DNI, RUC y teléfonos son **ficticios**. Demo en vivo: https://lifesystemsolution.github.io/modelo-sistema-courier/

## Accesos por rol

| Enlace | Rol |
|---|---|
| `app.html?demo=counter` | **Counter** (Rosa, agencia Lima): recepción, envíos, llegadas, entregas en agencia, caja, clientes |
| `app.html?demo=transportista` | **Repartidor** (Jorge, Lima): ruta del día desde el celular |
| `app.html?demo=jefe` | **Jefa de operaciones** (Carla): tablero, despacho, reparto, contra entrega, avisos, reportes, ajustes |
| `app.html` | Pantalla para elegir rol |

Plan: agregar `&plan=basico`, `&plan=control` o `&plan=completo` (por defecto). Plan a medida: `&plan=custom&mods=recepcion,envios,seguimiento,tablero`. Los módulos que no están en el plan aparecen con candado y explican cómo probarlos.

## Enlaces para presentar

- Registrar un envío de ejemplo en vivo: `app.html?demo=counter#/recepcion?sim=1`
- Abrir el envío más urgente: `app.html?demo=jefe#/envios?id=primero`
- Rastrear como cliente: `web.html#rastrear`
- Botón **Simular envío** (counter y jefa): registra un envío nuevo en el counter de Lima.

## Módulos y planes

| Módulo | Básico | Control | Completo |
|---|:-:|:-:|:-:|
| Recepción y guías (tarifa en vivo, guía, etiqueta con código de barras, boleta) | ✓ | ✓ | ✓ |
| Envíos e historial (búsqueda por código, DNI, nombre o teléfono; lector de código de barras) | ✓ | ✓ | ✓ |
| Rastreo para clientes (en `web.html`) | ✓ | ✓ | ✓ |
| Llegadas a agencia (recibir carga bulto por bulto) | ✓ | ✓ | ✓ |
| Entregas en agencia (verificación de DNI) | ✓ | ✓ | ✓ |
| Caja diaria (apertura, salidas con motivo, arqueo por billetes y monedas) | ✓ | ✓ | ✓ |
| Clientes (DNI/RUC con RENIEC/SUNAT simulados) | ✓ | ✓ | ✓ |
| Manifiestos y despacho (imprimible) | | ✓ | ✓ |
| Reparto a domicilio (asignación por distrito y ruta del repartidor) | | ✓ | ✓ |
| Tablero y riesgo de retraso | | ✓ | ✓ |
| Reportes y Excel | | ✓ | ✓ |
| Cobro contra entrega y liquidación a tiendas | | | ✓ |
| Avisos por WhatsApp con plantillas | | | ✓ |

Atajos: `/` buscar, `N` nuevo envío, `Esc` cerrar, `?` ayuda.

## Lógica central

### Tarifa
`Total = (base + kg facturables × S/ por kg del tramo) × (1 + % express) + domicilio + seguro + comisión contra entrega`

- **Kg facturables:** el mayor entre el peso real y el volumétrico (`largo × ancho × alto ÷ 5000`), mínimo 1 kg, redondeado a 0.5 kg.
- **Tramo por distancia** (todo pasa por el hub de Lima): local, hasta 600 km, 600 a 1 200 km, más de 1 200 km.
- **Sobres:** tarifa plana. **Seguro:** 1% del valor declarado (mín. S/ 2). **Contra entrega:** 3% del monto (mín. S/ 3).
- **Fecha prometida:** 1 a 4 días hábiles según distancia (express: un día menos), sin domingos ni feriados de Perú; lo recibido después de las 18:00 cuenta desde el día siguiente.

### Riesgo de retraso (0 a 100)
| Factor | Peso | Cómo suma |
|---|---|---|
| Plazo | 35 | Porcentaje del plazo ya usado (curva creciente); vencido = todo el peso |
| Avance | 25 | Etapas de atraso frente a la etapa esperada por el tiempo usado |
| Detenido | 20 | Horas en el estado actual frente a lo normal para ese estado |
| Intentos | 12 | 1 intento fallido = 60%, 2 o más = 100% |
| Ruta | 8 | Según los km de la ruta |

Riesgo **alto** desde 60, **medio** desde 40. Un envío vencido siempre es riesgo alto. Un envío para recojo ya cumplió su plazo al llegar a la agencia de destino. Los pesos se editan en **Ajustes**, con vista previa en vivo.

### Ganancia estimada (Reportes)
`Ingresos − costo de línea (S/ por kg cada 100 km) − reparto (S/ por entrega) − comisión de tarjeta − gastos fijos por día`. Los costos de referencia se cambian en Ajustes.

## Qué está simulado

Envío de boletas a SUNAT, consulta RENIEC/SUNAT, mensajes de WhatsApp, firma del cliente en pantalla y transferencias de liquidación. Se avisa en cada pantalla.

## Datos de ejemplo

- 30 días de operación (40 a 52 envíos por día hábil, menos sábados, domingos y feriados), 6 agencias, 42 clientes frecuentes, 13 usuarios, camiones con incidencias de carretera ocasionales.
- **Hoy empieza en 0:** nada se recibió, entregó ni cobró hoy. Lo que llega hoy está en camino y el reparto del día está programado.
- Generador con semilla fija: los datos son iguales en cada carga y las fechas se calculan desde hoy.
- Se guardan en `localStorage` (`lifecargo-datos`) con versión de esquema; se regeneran si cambia el esquema o el día. **Ajustes → Reiniciar datos de ejemplo** los vuelve a cargar.

## Estructura

```
index.html      Planes (landing)          css/landing.css  js/landing.js
web.html        Web pública del courier   css/web.css      js/web.js
app.html        Sistema interno           css/app.css
css/base.css    Marca, modo oscuro, botones
js/icons.js     Íconos e ilustraciones SVG
js/motor.js     Agencias, días hábiles, tarifa, riesgo
js/planes.js    Planes y módulos
js/seed.js      Datos de ejemplo
js/store.js     localStorage con versión de esquema
js/ui.js        Formatos, plurales, panel, modal, gráficos, CSV
js/envios.js recepcion.js agencia.js caja.js clientes.js reparto.js manifiestos.js tablero.js reportes.js extras.js ajustes.js
js/app.js       Arranque: plan, rol, router por hash, tema, atajos
img/capturas/   Capturas reales (Chrome headless, 1440×900)
```

## Ver en local

```
python -m http.server 8772
```

Abrir http://localhost:8772/. Cada vez que cambies un CSS o JS, sube el número `?v=N` en `index.html`, `web.html` y `app.html` para que el navegador y GitHub Pages no sirvan la versión vieja.

---
Desarrollado por LifeSystem Solutions · WhatsApp 957 111 471
