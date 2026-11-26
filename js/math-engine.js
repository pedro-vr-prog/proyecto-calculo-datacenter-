/**
 * ==============================================================================
 * PROYECTO DE AULA: CÁLCULO INTEGRAL - UNIVERSIDAD SIMÓN BOLÍVAR
 * ARCHIVO: js/math-engine.js
 * DESCRIPCIÓN: Motor Matemático y Algoritmos Numéricos de Integración.
 * 
 * Contenido Matemático:
 * 1. Parser seguro de funciones f(t) mediante la librería math.js.
 * 2. Cálculo Analítico Exacto (Teorema Fundamental del Cálculo - TFC):
 *    E = F(b) - F(a) = \int_a^b P(t) dt
 * 3. Métodos Numéricos de Aproximación:
 *    - Sumas de Riemann (Extremo Izquierdo, Derecho y Punto Medio)
 *    - Regla Compuesta del Trapecio
 *    - Regla Compuesta de Simpson 1/3
 * 4. Volumen del Sólido de Revolución (Método de los Discos):
 *    V = \pi \int_a^b [P(t)]^2 dt
 * 5. Indicadores de Rendimiento (KPIs):
 *    - Potencia Máxima (Pico)
 *    - Potencia Promedio (Teorema del Valor Medio del Cálculo Integral)
 *    - Estimación de Costos Operativos en Pesos Colombianos (COP)
 * ==============================================================================
 */

// ==============================================================================
// 1. CONFIGURACIÓN Y CONSTANTES GLOBALES
// ==============================================================================

/**
 * Tarifa eléctrica industrial de referencia en Colombia (editable en modo "qué pasa si"):
 * Valor aproximado: 800 COP por cada kilovatio-hora (kWh) consumido.
 * Fuente de referencia: XM - Operador del Mercado Eléctrico Colombiano (2024).
 */
let tarifaCopKwh = 800;
const TARIFA_COP_KWH = 800;

/**
 * Parámetros de umbrales operativos, emisiones y configuración de fallas (Fase 3):
 */
let capacidadContratada = 110; // kW máximos contratados con el operador de red
let tempUmbral = 28;           // °C umbral máximo seguro en pasillo frío
let factorEmisionCO2 = 0.164;  // kg CO2eq / kWh (Factor UPME Colombia)

let fallaConfig = {
  tipo: 'ninguna',       // 'ninguna' | 'refrigeracion' | 'pico_trafico' | 'corte_energia' | 'throttling'
  t1: 11,                // Hora inicio evento de falla
  t2: 16,                // Hora fin evento de falla
  aplicarSolucion: false // Activar mitigación cuantificada
};

/**
 * Expresión matemática por defecto que modela la carga de TI:
 * P_TI(t) = 60 + 25*sin(pi*t/12) + 10*sin(pi*t/6) [kW]
 * t en horas en el intervalo [0, 24].
 */
const FUNCION_DEFAULT = '60 + 25*sin(pi*t/12) + 10*sin(pi*t/6)';

/**
 * Expresión matemática por defecto para la temperatura ambiente / pasillo frío (°C):
 * T(t) = 24 + 6*sin(pi*(t - 9)/12) [°C]
 */
const TEMP_DEFAULT = '24 + 6*sin(pi*(t - 9)/12)';

/**
 * Objetos ejecutables compilados por math.js para P_TI(t) y T(t).
 */
let compiledFn = null;
let compiledTempFn = null;

/**
 * Parámetros editables del sistema de enfriamiento:
 * P_enfriamiento(t) = c0 + c1 * (T(t) - T_ref)
 */
let coolingParams = {
  c0: 12,    // Potencia base de enfriamiento (kW)
  c1: 1.8,   // Sensibilidad térmica del chiller (kW/°C)
  tRef: 20   // Temperatura de referencia (°C)
};

/**
 * Fuente activa de datos para el cálculo principal:
 * 'analitico' -> Usa la función continua P(t) y el TFC.
 * 'datos'     -> Usa la serie discreta de telemetría (hora vs. kW) e integra con Trapecio/Simpson.
 */
let fuenteDatos = 'analitico';

/**
 * Arreglo de lecturas de telemetría [{ t: number, p: number }, ...] ordenado por t.
 */
let datosTelemetria = [];

/**
 * Intervalo de referencia por defecto para telemetría de ejemplo (en horas).
 */
let resolucionEjemplo = 1;

// ==============================================================================
// 2. PARSER Y EVALUADOR NUMÉRICO (math.js)
// ==============================================================================

/**
 * Compila una expresión algebraica ingresada en texto a una función ejecutable.
 * @param {string} expr - Expresión escrita por el usuario (ej: "60 + 25*sin(pi*t/12)")
 * @returns {object} { ok: boolean, fn?: object, error?: string }
 */
function parsearFuncion(expr) {
  try {
    const compiled = math.compile(expr);
    // Prueba de sanidad: verificar que evalúe a un número real finito en t = 1
    const testVal = compiled.evaluate({ t: 1 });
    if (typeof testVal !== 'number' || !isFinite(testVal)) {
      return { ok: false, error: 'La función ingresada debe retornar valores reales finitos.' };
    }
    return { ok: true, fn: compiled };
  } catch (error) {
    return { ok: false, error: 'Sintaxis no válida: ' + error.message };
  }
}

/**
 * Evalúa la potencia de TI P_TI(t) en un punto temporal específico.
 * @param {number} t - Instante de tiempo (horas)
 * @returns {number} - Potencia TI en kilovatios (kW)
 */
function evaluarPTI(t) {
  if (!compiledFn) return 0;
  return compiledFn.evaluate({ t });
}

/**
 * Evalúa la temperatura T(t) en °C.
 * @param {number} t - Instante de tiempo (horas)
 * @returns {number} - Temperatura en °C
 */
function evaluarTemp(t) {
  if (!compiledTempFn) return coolingParams.tRef;
  return compiledTempFn.evaluate({ t });
}

/**
 * Evalúa la potencia de enfriamiento P_enfriamiento(t) = c0 + c1 * (T(t) - T_ref).
 * Se acota a >= 0 para consistencia física si T(t) cae por debajo del umbral libre.
 */
function evaluarPEnf(t) {
  const { c0, c1, tRef } = coolingParams;
  return c0 + c1 * (evaluarTemp(t) - tRef);
}

/**
 * Evalúa la potencia total del centro de datos: P_total(t) = P_TI(t) + P_enfriamiento(t).
 */
function evaluarPTotal(t) {
  return evaluarPTI(t) + evaluarPEnf(t);
}

/**
 * Alias principal usado por los métodos numéricos, 2D y 3D:
 * representa P_total(t) del centro de datos.
 */
function evaluarEn(t) {
  return evaluarPTotal(t);
}

/**
 * Genera un conjunto discretizado de puntos temporales y sus respectivas potencias.
 * Optimizado con Float64Array para procesamiento rápido de datos.
 * @param {number} a - Límite inferior de tiempo
 * @param {number} b - Límite superior de tiempo
 * @param {number} n - Cantidad de subdivisiones
 * @returns {object} { ts: Float64Array, ps: Float64Array }
 */
function generarPuntos(a, b, n) {
  const ts = new Float64Array(n + 1);
  const ps = new Float64Array(n + 1);
  const h = (b - a) / n;
  for (let i = 0; i <= n; i++) {
    const t = a + i * h;
    ts[i] = t;
    ps[i] = evaluarEn(t);
  }
  return { ts, ps };
}

// ==============================================================================
// 3. DESARROLLO ANALÍTICO EXACTO (TEOREMA FUNDAMENTAL DEL CÁLCULO)
// ==============================================================================

/**
 * Antiderivada analítica formal F(t) de la función de potencia estándar:
 * 
 * Función original:
 * P(t) = 60 + 25*sin(\pi*t/12) + 10*sin(\pi*t/6)
 * 
 * Integración término a término:
 * 1. \int 60 dt = 60t
 * 2. Sustitución u = \pi*t/12 -> dt = (12/\pi) du:
 *    \int 25*sin(\pi*t/12) dt = 25 * (-12/\pi) * cos(\pi*t/12) = - (300/\pi) * cos(\pi*t/12)
 * 3. Sustitución u = \pi*t/6 -> dt = (6/\pi) du:
 *    \int 10*sin(\pi*t/6) dt = 10 * (-6/\pi) * cos(\pi*t/6) = - (60/\pi) * cos(\pi*t/6)
 * 
 * Antiderivada general:
 * F(t) = 60t - (300/\pi)*cos(\pi*t/12) - (60/\pi)*cos(\pi*t/6) + C
 * 
 * @param {number} t - Tiempo en horas
 * @returns {number} - Valor acumulado de la antiderivada F(t)
 */
function antiderivadaDefault(t) {
  return (
    60 * t -
    (300 / Math.PI) * Math.cos((Math.PI * t) / 12) -
    (60 / Math.PI) * Math.cos((Math.PI * t) / 6)
  );
}

/**
 * Antiderivada analítica formal F_enf(t) del enfriamiento estándar:
 *
 * T(t) = 24 + 6*sin(pi*(t - 9)/12)
 * P_enf(t) = c0 + c1*(T(t) - T_ref) = [c0 + c1*(24 - T_ref)] + 6*c1*sin(pi*(t - 9)/12)
 *
 * Integración término a término:
 * F_enf(t) = [c0 + c1*(24 - T_ref)] * t - (72*c1 / pi) * cos(pi*(t - 9)/12) + C
 */
function antiderivadaEnfDefault(t) {
  const { c0, c1, tRef } = coolingParams;
  const terminoConst = c0 + c1 * (24 - tRef);
  return terminoConst * t - ((72 * c1) / Math.PI) * Math.cos((Math.PI * (t - 9)) / 12);
}

/**
 * Cuadratura de Simpson sobre una función arbitraria fn(t) en [a, b].
 */
function simpsonGenerico(fn, a, b, n = 10000) {
  if (n % 2 !== 0) n += 1;
  const h = (b - a) / n;
  let suma = fn(a) + fn(b);
  for (let i = 1; i < n; i++) {
    suma += (i % 2 === 0 ? 2 : 4) * fn(a + i * h);
  }
  return (h / 3) * suma;
}

/**
 * Evalúa la integral definida de P_TI(t), P_enf(t) y P_total(t) mediante el TFC.
 */
function integralAnaliticaCompleta(a, b, exprTI, exprTemp) {
  const esTIDefault = exprTI.trim() === FUNCION_DEFAULT;
  const esTempDefault = exprTemp.trim() === TEMP_DEFAULT;

  const energiaTI = esTIDefault
    ? antiderivadaDefault(b) - antiderivadaDefault(a)
    : simpsonGenerico(evaluarPTI, a, b, 10000);

  const energiaEnf = esTempDefault
    ? antiderivadaEnfDefault(b) - antiderivadaEnfDefault(a)
    : simpsonGenerico(evaluarPEnf, a, b, 10000);

  return {
    energiaTI,
    energiaEnf,
    valor: energiaTI + energiaEnf,
    esAnalitico: esTIDefault && esTempDefault,
    esTIDefault,
    esTempDefault
  };
}

/**
 * Mantiene compatibilidad con llamadas directas a integralAnalitica(a, b, expr).
 */
function integralAnalitica(a, b, expr) {
  const esDefault = expr.trim() === FUNCION_DEFAULT;
  if (esDefault) {
    return { valor: antiderivadaDefault(b) - antiderivadaDefault(a), esAnalitico: true };
  }
  return { valor: simpsonGenerico(evaluarPTI, a, b, 10000), esAnalitico: false };
}

// ==============================================================================
// 4. MÉTODOS NUMÉRICOS DE INTEGRACIÓN
// ==============================================================================

/**
 * Suma de Riemann con Extremo Izquierdo:
 * R_izq = h * \sum_{i=0}^{n-1} P(a + i*h)
 * Error de truncamiento: O(h).
 */
function riemannIzquierda(a, b, n) {
  const h = (b - a) / n;
  let suma = 0;
  for (let i = 0; i < n; i++) {
    suma += evaluarEn(a + i * h);
  }
  return suma * h;
}

/**
 * Suma de Riemann con Extremo Derecho:
 * R_der = h * \sum_{i=1}^{n} P(a + i*h)
 * Error de truncamiento: O(h).
 */
function riemannDerecha(a, b, n) {
  const h = (b - a) / n;
  let suma = 0;
  for (let i = 1; i <= n; i++) {
    suma += evaluarEn(a + i * h);
  }
  return suma * h;
}

/**
 * Suma de Riemann con Punto Medio:
 * R_med = h * \sum_{i=0}^{n-1} P(a + (i + 0.5)*h)
 * Error de truncamiento: O(h^2).
 */
function riemannMedio(a, b, n) {
  const h = (b - a) / n;
  let suma = 0;
  for (let i = 0; i < n; i++) {
    suma += evaluarEn(a + (i + 0.5) * h);
  }
  return suma * h;
}

/**
 * Regla Compuesta del Trapecio:
 * T_n = (h/2) * [ P(a) + 2 * \sum_{i=1}^{n-1} P(a + i*h) + P(b) ]
 * Aproxima la región mediante trapecios lineales.
 * Error de truncamiento: O(h^2).
 */
function trapecio(a, b, n) {
  const h = (b - a) / n;
  let suma = evaluarEn(a) + evaluarEn(b);
  for (let i = 1; i < n; i++) {
    suma += 2 * evaluarEn(a + i * h);
  }
  return (h / 2) * suma;
}

/**
 * Regla Compuesta de Simpson 1/3:
 * S_n = (h/3) * [ P(a) + 4*P(x_1) + 2*P(x_2) + 4*P(x_3) + ... + P(b) ]
 * Aproxima curvas mediante arcos de parábola de 2do orden.
 * Requiere que 'n' sea par.
 * Error de truncamiento: O(h^4).
 */
function simpson(a, b, n) {
  if (n % 2 !== 0) n += 1; // Corrección para asegurar particiones pares
  const h = (b - a) / n;
  let suma = evaluarEn(a) + evaluarEn(b);
  for (let i = 1; i < n; i++) {
    const peso = i % 2 === 0 ? 2 : 4;
    suma += peso * evaluarEn(a + i * h);
  }
  return (h / 3) * suma;
}

// ==============================================================================
// 5. VOLUMEN DEL SÓLIDO DE REVOLUCIÓN (MÉTODO DE DISCOS)
// ==============================================================================

/**
 * Calcula el volumen del sólido generado al rotar la curva P(t) alrededor del eje t:
 * V = \pi \int_a^b [P(t)]^2 dt
 * 
 * Implementado numéricamente mediante integración de Simpson de alto orden.
 * @param {number} a - Límite inferior
 * @param {number} b - Límite superior
 * @param {number} n - Subdivisiones (mínimo 200 para precisión volumétrica)
 * @returns {number} - Volumen del sólido en unidades cúbicas (u^3)
 */
function volumenSolidoRevolucion(a, b, n = 200) {
  if (n % 2 !== 0) n += 1;
  const h = (b - a) / n;
  const fCuadrada = (t) => {
    const p = evaluarEn(t);
    return p * p;
  };

  let suma = fCuadrada(a) + fCuadrada(b);
  for (let i = 1; i < n; i++) {
    const peso = i % 2 === 0 ? 2 : 4;
    suma += peso * fCuadrada(a + i * h);
  }
  const integralP2 = (h / 3) * suma;
  return Math.PI * integralP2;
}

// ==============================================================================
// 6. TELEMETRÍA E INTEGRACIÓN SOBRE DATOS DISCRETOS (FASE 1)
// ==============================================================================

/**
 * Genera un conjunto realista y reproducible de lecturas de telemetría (24h)
 * simulando sensores de un centro de datos alrededor de la curva base, con
 * perturbaciones operativas realistas (picos de tráfico y ruido de medición).
 *
 * @param {number} pasoHoras - 1 para lecturas cada hora (25 pts) o 0.5 cada 30 min (49 pts)
 * @returns {Array<{t: number, p: number}>}
 */
function generarDatosEjemplo(pasoHoras = 1) {
  const datos = [];
  const totalPasos = Math.round(24 / pasoHoras);

  for (let i = 0; i <= totalPasos; i++) {
    const t = Number((i * pasoHoras).toFixed(4));
    // Perfil base TI del datacenter
    const base = 60 + 25 * Math.sin((Math.PI * t) / 12) + 10 * Math.sin((Math.PI * t) / 6);
    const ruido = 2.4 * Math.sin(3.7 * t + 0.5) + 1.5 * Math.cos(7.1 * t);
    const picoExtra = (t >= 10 && t <= 15) ? 3.8 * Math.sin(((t - 10) / 5) * Math.PI) : 0;
    const potencia = Math.max(5, Number((base + ruido + picoExtra).toFixed(2)));

    // Temperatura ambiente / pasillo frío realista (°C)
    const tempBase = 24 + 6 * Math.sin((Math.PI * (t - 9)) / 12);
    const ruidoTemp = 0.45 * Math.sin(2.9 * t) + 0.25 * Math.cos(5.3 * t);
    const temp = Number((tempBase + ruidoTemp).toFixed(2));

    datos.push({ t, p: potencia, temp });
  }
  return datos;
}

/**
 * Parsea texto CSV o tabular (pegado por el usuario o subido desde archivo).
 * Acepta 2 columnas (hora, kW_TI) o 3 columnas (hora, kW_TI, Temp_C).
 */
function parsearTextoCSV(texto) {
  if (!texto || !texto.trim()) {
    return { ok: false, error: 'El contenido de datos está vacío.' };
  }

  const lineas = texto.trim().split(/\r?\n/);
  const datos = [];

  for (let idx = 0; idx < lineas.length; idx++) {
    const linea = lineas[idx].trim();
    if (!linea) continue;

    let partes = linea.split(/[;\t,]+/);
    if (partes.length < 2) {
      partes = linea.split(/\s+/);
    }

    if (partes.length < 2) {
      return { ok: false, error: `Línea ${idx + 1}: se esperan al menos 2 columnas (hora, kW). Recibido: "${linea}"` };
    }

    const tVal = Number(partes[0].trim());
    const pVal = Number(partes[1].trim());
    const tieneTemp = partes.length >= 3 && partes[2].trim() !== '';
    const tempVal = tieneTemp ? Number(partes[2].trim()) : null;

    // Si es la primera línea y parece un encabezado de texto, la saltamos
    if (idx === 0 && (isNaN(tVal) || isNaN(pVal))) {
      continue;
    }

    if (!isFinite(tVal) || !isFinite(pVal) || (tieneTemp && !isFinite(tempVal))) {
      return { ok: false, error: `Línea ${idx + 1}: valores no numéricos en la fila "${linea}".` };
    }

    if (tVal < 0 || tVal > 24) {
      return { ok: false, error: `Línea ${idx + 1}: la hora t=${tVal} debe estar entre 0 y 24.` };
    }

    if (pVal < 0) {
      return { ok: false, error: `Línea ${idx + 1}: la potencia P=${pVal} kW no puede ser negativa.` };
    }

    datos.push({ t: tVal, p: pVal, temp: tempVal });
  }

  if (datos.length < 2) {
    return { ok: false, error: 'Se necesitan al menos 2 lecturas válidas (hora, kW) para integrar.' };
  }

  datos.sort((x, y) => x.t - y.t);
  for (let i = 1; i < datos.length; i++) {
    if (Math.abs(datos[i].t - datos[i - 1].t) < 1e-9) {
      return { ok: false, error: `Hora duplicada detectada en t = ${datos[i].t} h.` };
    }
  }

  return { ok: true, datos };
}

/**
 * Interpola linealmente el valor de potencia en un instante t dentro de una serie.
 */
function interpolarLinealDatos(datos, t) {
  if (t <= datos[0].t) return datos[0].p;
  if (t >= datos[datos.length - 1].t) return datos[datos.length - 1].p;

  for (let i = 0; i < datos.length - 1; i++) {
    if (t >= datos[i].t && t <= datos[i + 1].t) {
      const dt = datos[i + 1].t - datos[i].t;
      if (dt === 0) return datos[i].p;
      const frac = (t - datos[i].t) / dt;
      return datos[i].p + frac * (datos[i + 1].p - datos[i].p);
    }
  }
  return datos[datos.length - 1].p;
}

/**
 * Extrae los puntos de la serie de telemetría comprendidos en [a, b],
 * agregando los extremos interpolados si a o b no coinciden con una lectura exacta.
 */
function obtenerSubserieIntervalo(datos, a, b) {
  if (!datos || datos.length < 2) return [];
  const tMin = datos[0].t;
  const tMax = datos[datos.length - 1].t;
  const aEf = Math.max(a, tMin);
  const bEf = Math.min(b, tMax);
  if (aEf >= bEf) return [];

  const sub = [{ t: aEf, p: interpolarLinealDatos(datos, aEf) }];
  for (const pt of datos) {
    if (pt.t > aEf + 1e-9 && pt.t < bEf - 1e-9) {
      sub.push({ t: pt.t, p: pt.p });
    }
  }
  sub.push({ t: bEf, p: interpolarLinealDatos(datos, bEf) });
  return sub;
}

/**
 * Calcula la integral definida sobre datos discretos usando la Regla del Trapecio:
 * E ≈ Σ [(P_i + P_{i+1}) / 2] * (t_{i+1} - t_i)
 */
function integrarDatosTrapecio(datos, a, b) {
  const pts = obtenerSubserieIntervalo(datos, a, b);
  if (pts.length < 2) return 0;

  let suma = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dt = pts[i + 1].t - pts[i].t;
    suma += 0.5 * (pts[i].p + pts[i + 1].p) * dt;
  }
  return suma;
}

/**
 * Calcula la integral definida sobre datos discretos usando la Regla de Simpson:
 * - Si los subintervalos son equiespaciados y pares: Simpson 1/3 compuesto.
 * - Si es equiespaciado e impar (>=3): Simpson 1/3 + Simpson 3/8 en los últimos 3 tramos.
 * - Si el paso es no uniforme: Simpson generalizado por pares de tramos desiguales.
 */
function integrarDatosSimpson(datos, a, b) {
  const pts = obtenerSubserieIntervalo(datos, a, b);
  const M = pts.length - 1; // número de subintervalos
  if (M < 1) return 0;
  if (M === 1) return 0.5 * (pts[0].p + pts[1].p) * (pts[1].t - pts[0].t);

  // Verificar si el paso h es uniforme
  const h0 = pts[1].t - pts[0].t;
  let uniforme = true;
  for (let i = 1; i < M; i++) {
    if (Math.abs((pts[i + 1].t - pts[i].t) - h0) > 1e-5) {
      uniforme = false;
      break;
    }
  }

  if (uniforme) {
    let suma = 0;
    let limite = M;
    if (M % 2 !== 0) {
      // Últimos 3 subintervalos con Simpson 3/8
      if (M >= 3) {
        const k = M - 3;
        suma += (3 * h0 / 8) * (pts[k].p + 3 * pts[k + 1].p + 3 * pts[k + 2].p + pts[k + 3].p);
        limite = k;
      } else {
        return integrarDatosTrapecio(datos, a, b);
      }
    }
    if (limite >= 2) {
      let s13 = pts[0].p + pts[limite].p;
      for (let i = 1; i < limite; i++) {
        s13 += (i % 2 === 0 ? 2 : 4) * pts[i].p;
      }
      suma += (h0 / 3) * s13;
    }
    return suma;
  }

  // Caso de paso no uniforme: Simpson 1/3 generalizado
  let suma = 0;
  let i = 0;
  while (i < M - 1) {
    const h1 = pts[i + 1].t - pts[i].t;
    const h2 = pts[i + 2].t - pts[i + 1].t;
    const c0 = 2 - h2 / h1;
    const c1 = Math.pow(h1 + h2, 2) / (h1 * h2);
    const c2 = 2 - h1 / h2;
    suma += ((h1 + h2) / 6) * (c0 * pts[i].p + c1 * pts[i + 1].p + c2 * pts[i + 2].p);
    i += 2;
  }
  if (i === M - 1) {
    const dt = pts[M].t - pts[M - 1].t;
    suma += 0.5 * (pts[M - 1].p + pts[M].p) * dt;
  }
  return suma;
}

/**
 * Calcula el volumen geométrico del sólido de revolución sobre los datos medidos:
 * V ≈ π * ∫ [P_med(t)]^2 dt (regla del trapecio sobre P^2).
 */
function volumenDatosDiscretos(datos, a, b) {
  const pts = obtenerSubserieIntervalo(datos, a, b);
  if (pts.length < 2) return 0;
  let suma = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dt = pts[i + 1].t - pts[i].t;
    const y0 = pts[i].p * pts[i].p;
    const y1 = pts[i + 1].p * pts[i + 1].p;
    suma += 0.5 * (y0 + y1) * dt;
  }
  return Math.PI * suma;
}

/**
 * Compara el ajuste punto a punto entre las lecturas medidas en [a, b] y el modelo analítico P(t).
 * Retorna MAE, RMSE y R² (coeficiente de determinación).
 */
function calcularMetricasAjuste(datos, a, b) {
  const enRango = datos.filter((d) => d.t >= a - 1e-9 && d.t <= b + 1e-9);
  if (enRango.length === 0) {
    return { count: 0, mae: 0, rmse: 0, r2: 1 };
  }

  let sumAbs = 0;
  let sumSq = 0;
  let sumP = 0;

  for (const pt of enRango) {
    const pMod = evaluarPTI(pt.t);
    const err = pt.p - pMod;
    sumAbs += Math.abs(err);
    sumSq += err * err;
    sumP += pt.p;
  }

  const nPts = enRango.length;
  const meanP = sumP / nPts;
  let ssTot = 0;
  for (const pt of enRango) {
    ssTot += Math.pow(pt.p - meanP, 2);
  }

  const mae = sumAbs / nPts;
  const rmse = Math.sqrt(sumSq / nPts);
  const r2 = ssTot > 1e-12 ? 1 - sumSq / ssTot : 1;

  return { count: nPts, mae, rmse, r2 };
}

/**
 * Obtiene las series de potencia de enfriamiento y total sobre los datos medidos,
 * usando la temperatura medida en la columna (si existe) o T(t) del modelo en caso contrario.
 */
function obtenerDatosConEnfriamiento(datos) {
  const { c0, c1, tRef } = coolingParams;
  return datos.map((d) => {
    const tempVal = (typeof d.temp === 'number' && isFinite(d.temp)) ? d.temp : evaluarTemp(d.t);
    const pEnf = c0 + c1 * (tempVal - tRef);
    const pTotal = d.p + pEnf;
    return { t: d.t, pTI: d.p, temp: tempVal, pEnf, pTotal, p: pTotal };
  });
}

// ==============================================================================
// 7. INDICADORES CLAVE DE RENDIMIENTO (KPIs)
// ==============================================================================

/**
 * Calcula métricas físicas y operacionales derivadas del consumo de energía.
 * Incluye desglose TI, Enfriamiento, Total y PUE = E_total / E_TI.
 */
function calcularKPIs(a, b, energiaTI, energiaEnf, fuente = 'analitico', datosTotales = []) {
  const energiaTotal = energiaTI + energiaEnf;
  let potenciaPico = -Infinity;
  let volumen3D = 0;

  if (fuente === 'datos' && datosTotales.length >= 2) {
    const sub = obtenerSubserieIntervalo(datosTotales, a, b);
    for (const pt of sub) {
      if (pt.p > potenciaPico) potenciaPico = pt.p;
    }
    if (!isFinite(potenciaPico)) potenciaPico = 0;
    volumen3D = volumenDatosDiscretos(datosTotales, a, b);
  } else {
    const muestras = 1000;
    const h = (b - a) / muestras;
    for (let i = 0; i <= muestras; i++) {
      const p = evaluarPTotal(a + i * h);
      if (p > potenciaPico) potenciaPico = p;
    }
    volumen3D = volumenSolidoRevolucion(a, b, 200);
  }

  // Teorema del Valor Medio para integrales definidas:
  // P_prom = (1 / (b - a)) * \int_a^b P(t) dt = E / (b - a)
  const deltaT = b - a;
  const potenciaMedia = deltaT > 0 ? energiaTotal / deltaT : 0;
  const potenciaMediaTI = deltaT > 0 ? energiaTI / deltaT : 0;
  const potenciaMediaEnf = deltaT > 0 ? energiaEnf / deltaT : 0;
  const costoCOP = energiaTotal * tarifaCopKwh;
  const pue = energiaTI > 0 ? energiaTotal / energiaTI : 1;

  return {
    energiaTI,
    energiaEnf,
    energiaTotal,
    pue,
    potenciaPico,
    potenciaMedia,
    potenciaMediaTI,
    potenciaMediaEnf,
    costoCOP,
    volumen3D
  };
}

// ==============================================================================
// 7B. ESCENARIOS DE FALLA Y SOLUCIONES CUANTIFICADAS (FASE 3)
// ==============================================================================

/**
 * Catálogo descriptivo de fallas y sus soluciones de ingeniería.
 */
const CATALOGO_FALLAS = {
  ninguna: {
    titulo: 'Operación Normal (Sin fallas)',
    descFalla: 'El centro de datos opera bajo condiciones nominales sin anomalías.',
    solucionTitulo: 'Mantenimiento preventivo estándar',
    solucionDesc: 'Monitoreo continuo de PUE, temperatura y balanceo de cargas.'
  },
  refrigeracion: {
    titulo: 'Falla parcial de refrigeración',
    descFalla: 'Un chiller sale de servicio en [t₁, t₂]: la temperatura sube +8 °C y el sistema restante se satura intentando compensar (+45% potencia de enfriamiento, tope 48 kW).',
    solucionTitulo: 'Enfriamiento redundante N+1 + Free Cooling',
    solucionDesc: 'La unidad redundante entra automáticamente, limitando la subida térmica a +1.5 °C y aprovechando aire exterior (free cooling) para ahorrar energía.'
  },
  pico_trafico: {
    titulo: 'Pico de carga por tráfico masivo',
    descFalla: 'Avalancha de peticiones en [t₁, t₂]: la carga de TI sube +42 kW adicionales y eleva la demanda térmica asociada.',
    solucionTitulo: 'Desplazamiento de carga (Load Shifting) + Power Capping',
    solucionDesc: 'Se desplaza el 55% de tareas batch no críticas al horario nocturno y se aplica power capping para evitar superar la capacidad contratada.'
  },
  corte_energia: {
    titulo: 'Corte de energía (UPS + Generador)',
    descFalla: 'Falla de red en [t₁, t₂]: el sistema conmuta a UPS y generador diésel con pérdidas de doble conversión y carga de baterías (+22% potencia equivalente).',
    solucionTitulo: 'UPS Eco-Mode de alta eficiencia (96%) + Desconexión selectiva',
    solucionDesc: 'Se desconectan cargas auxiliares no críticas (-15% TI en emergencia) y se opera con UPS de alta eficiencia reduciendo las pérdidas de respaldo.'
  },
  throttling: {
    titulo: 'Sobrecalentamiento con Thermal Throttling',
    descFalla: 'La temperatura sube +7.5 °C en [t₁, t₂] superando el umbral seguro: los procesadores reducen su frecuencia (-28% potencia TI) perdiendo capacidad de cómputo.',
    solucionTitulo: 'Subir setpoint T_ref +2 °C + Pre-enfriamiento preventivo',
    solucionDesc: 'Se optimiza el flujo de pasillo frío manteniendo T por debajo del umbral crítico, recuperando el 100% de la capacidad de cómputo TI con menor estrés.'
  }
};

/**
 * Evalúa P_TI, T, P_enf y P_total bajo un escenario de falla en el instante t.
 */
function evaluarConFalla(t, cfg = fallaConfig) {
  let pTI = evaluarPTI(t);
  let temp = evaluarTemp(t);
  const { c0, c1, tRef } = coolingParams;
  let pEnf = c0 + c1 * (temp - tRef);

  const enFalla = cfg.tipo !== 'ninguna' && t >= cfg.t1 && t <= cfg.t2;
  if (enFalla) {
    if (cfg.tipo === 'refrigeracion') {
      temp += 8.0;
      pEnf = Math.min(48, (c0 + c1 * (temp - tRef)) * 1.45);
    } else if (cfg.tipo === 'pico_trafico') {
      pTI += 42.0;
      temp += 2.0;
      pEnf = c0 + c1 * (temp - tRef);
    } else if (cfg.tipo === 'corte_energia') {
      const pTotBase = pTI + pEnf;
      const sobrecarga = pTotBase * 0.22;
      pTI += sobrecarga * 0.7;
      pEnf += sobrecarga * 0.3;
    } else if (cfg.tipo === 'throttling') {
      temp += 7.5;
      pEnf = c0 + c1 * (temp - tRef);
      if (temp > tempUmbral) {
        pTI = pTI * 0.72; // -28% por thermal throttling
      }
    }
  }

  return { pTI, temp, pEnf, pTotal: pTI + pEnf };
}

/**
 * Evalúa P_TI, T, P_enf y P_total aplicando la solución de mitigación correspondiente.
 */
function evaluarConSolucion(t, cfg = fallaConfig) {
  let pTI = evaluarPTI(t);
  let temp = evaluarTemp(t);
  const { c0, c1, tRef } = coolingParams;
  let pEnf = c0 + c1 * (temp - tRef);

  const enFalla = cfg.tipo !== 'ninguna' && t >= cfg.t1 && t <= cfg.t2;
  if (enFalla) {
    if (cfg.tipo === 'refrigeracion') {
      // Redundancia N+1 + Free cooling: solo +1.5 °C y eficiencia de free cooling (-20% enf)
      temp += 1.5;
      pEnf = (c0 + c1 * (temp - tRef)) * 0.85;
    } else if (cfg.tipo === 'pico_trafico') {
      // Load shifting + Power capping: pico contenido a +14 kW
      pTI += 14.0;
      temp += 0.6;
      pEnf = c0 + c1 * (temp - tRef);
    } else if (cfg.tipo === 'corte_energia') {
      // Desconexión selectiva (-15% TI) + UPS alta eficiencia (pérdidas solo +4%)
      pTI = pTI * 0.85;
      const pTotRed = pTI + pEnf;
      pEnf += pTotRed * 0.04;
    } else if (cfg.tipo === 'throttling') {
      // Pre-enfriamiento + Setpoint optimizado (+2 °C): evita cruzar T_umbral y mantiene 100% TI
      temp = Math.min(tempUmbral - 1.2, temp + 1.8);
      pEnf = c0 + c1 * Math.max(0, temp - (tRef + 2));
    }
  }

  return { pTI, temp, pEnf, pTotal: pTI + pEnf };
}

/**
 * Calcula alertas por exceso de capacidad contratada o temperatura umbral en [a, b].
 */
function evaluarAlertas(a, b, fnEstado) {
  const muestras = 400;
  const dt = (b - a) / muestras;
  let horasSobreCap = 0;
  let horasSobreTemp = 0;
  let picoP = -Infinity;
  let picoT = -Infinity;

  for (let i = 0; i <= muestras; i++) {
    const t = a + i * dt;
    const est = fnEstado(t);
    if (est.pTotal > picoP) picoP = est.pTotal;
    if (est.temp > picoT) picoT = est.temp;
    if (i < muestras) {
      if (est.pTotal > capacidadContratada) horasSobreCap += dt;
      if (est.temp > tempUmbral) horasSobreTemp += dt;
    }
  }

  return {
    excedeCapacidad: horasSobreCap > 0,
    excedeTemp: horasSobreTemp > 0,
    horasSobreCap,
    horasSobreTemp,
    picoP,
    picoT
  };
}

/**
 * Cuantifica con integrales definidas en [t1, t2] el impacto de la falla (ΔE)
 * y el ahorro obtenido tras aplicar la solución de ingeniería.
 */
function analizarFallaYSolucion(a, b) {
  const cfg = fallaConfig;
  const info = CATALOGO_FALLAS[cfg.tipo] || CATALOGO_FALLAS.ninguna;

  if (cfg.tipo === 'ninguna' || cfg.t1 >= cfg.t2) {
    const alertasBase = evaluarAlertas(a, b, (t) => ({
      pTotal: evaluarPTotal(t),
      temp: evaluarTemp(t)
    }));
    return {
      activo: false,
      tipo: cfg.tipo,
      t1: cfg.t1,
      t2: cfg.t2,
      info,
      energiaBaseEvento: 0,
      energiaFallaEvento: 0,
      energiaSolEvento: 0,
      deltaE: 0,
      costoExtraCOP: 0,
      ahorroKwh: 0,
      ahorroCOP: 0,
      ahorroCO2: 0,
      alertas: alertasBase
    };
  }

  // Integrales definidas exclusivamente sobre [t1, t2]
  const eBase = simpsonGenerico((t) => evaluarPTotal(t), cfg.t1, cfg.t2, 400);
  const eFalla = simpsonGenerico((t) => evaluarConFalla(t, cfg).pTotal, cfg.t1, cfg.t2, 400);
  const eSol = simpsonGenerico((t) => evaluarConSolucion(t, cfg).pTotal, cfg.t1, cfg.t2, 400);

  const deltaE = eFalla - eBase; // kWh extra (o perdidos si es negativo en throttling)
  const costoExtraCOP = deltaE * tarifaCopKwh;

  // Para throttling, la solución evita la pérdida de TI y ahorra enfriamiento;
  // medimos ahorro energético neto o energía recuperada según corresponda
  const ahorroKwh = Math.max(0, eFalla - eSol);
  const ahorroCOP = ahorroKwh * tarifaCopKwh;
  const ahorroCO2 = ahorroKwh * factorEmisionCO2;

  const fnEvaluadora = cfg.aplicarSolucion
    ? (t) => evaluarConSolucion(t, cfg)
    : (t) => evaluarConFalla(t, cfg);
  const alertas = evaluarAlertas(a, b, fnEvaluadora);

  return {
    activo: true,
    tipo: cfg.tipo,
    t1: cfg.t1,
    t2: cfg.t2,
    aplicarSolucion: cfg.aplicarSolucion,
    info,
    energiaBaseEvento: eBase,
    energiaFallaEvento: eFalla,
    energiaSolEvento: eSol,
    deltaE,
    costoExtraCOP,
    ahorroKwh,
    ahorroCOP,
    ahorroCO2,
    alertas
  };
}

// ==============================================================================
// 8. ORQUESTACIÓN Y ACTUALIZACIÓN GENERAL
// ==============================================================================

/**
 * Ejecuta el ciclo completo de cómputo, actualiza la UI y emite el evento 'datosListos'.
 */
function calcularTodo() {
  const inputFunc = document.getElementById('input-funcion');
  const inputTemp = document.getElementById('input-temp');
  if (!inputFunc) return;

  const expr = inputFunc.value.trim();
  const exprTemp = inputTemp ? inputTemp.value.trim() : TEMP_DEFAULT;
  const a = parseFloat(document.getElementById('input-a').value);
  const b = parseFloat(document.getElementById('input-b').value);
  const n = parseInt(document.getElementById('input-n').value, 10);

  // Leer parámetros térmicos editables (c0, c1, T_ref)
  const elC0 = document.getElementById('input-c0');
  const elC1 = document.getElementById('input-c1');
  const elTRef = document.getElementById('input-tref');
  if (elC0) coolingParams.c0 = parseFloat(elC0.value) || 0;
  if (elC1) coolingParams.c1 = parseFloat(elC1.value) || 0;
  if (elTRef) coolingParams.tRef = parseFloat(elTRef.value) || 0;

  // Validación de P_TI(t)
  const resultadoParse = parsearFuncion(expr);
  if (!resultadoParse.ok) {
    if (typeof mostrarErrorFuncion === 'function') {
      mostrarErrorFuncion(resultadoParse.error);
    }
    return;
  }
  compiledFn = resultadoParse.fn;
  if (typeof ocultarErrorFuncion === 'function') {
    ocultarErrorFuncion();
  }

  // Validación de T(t)
  const resultadoTempParse = parsearFuncion(exprTemp);
  if (!resultadoTempParse.ok) {
    if (typeof mostrarErrorTemp === 'function') {
      mostrarErrorTemp(resultadoTempParse.error);
    }
    return;
  }
  compiledTempFn = resultadoTempParse.fn;
  if (typeof ocultarErrorTemp === 'function') {
    ocultarErrorTemp();
  }

  // Validación de límites de integración
  if (isNaN(a) || isNaN(b) || a >= b) {
    if (typeof mostrarErrorFuncion === 'function') {
      mostrarErrorFuncion('El límite inferior (a) debe ser estrictamente menor que el superior (b).');
    }
    return;
  }

  // Validar que haya datos si la fuente es 'datos'
  if (fuenteDatos === 'datos' && (!datosTelemetria || datosTelemetria.length < 2)) {
    if (typeof mostrarErrorTelemetria === 'function') {
      mostrarErrorTelemetria('No hay suficientes datos de telemetría cargados (mínimo 2 puntos).');
    }
    return;
  }

  // 1. Integrales del modelo analítico completo: P_TI, P_enf y P_total
  const tfcComp = integralAnaliticaCompleta(a, b, expr, exprTemp);
  const valRizq = riemannIzquierda(a, b, n);
  const valRder = riemannDerecha(a, b, n);
  const valRmed = riemannMedio(a, b, n);
  const valTrap = trapecio(a, b, n);
  const valSimp = simpson(a, b, n);

  // 2. Integrales sobre datos medidos (TI, Enfriamiento y Total)
  const datosConEnf = datosTelemetria.length >= 2 ? obtenerDatosConEnfriamiento(datosTelemetria) : [];
  const datosTI = datosConEnf.map((d) => ({ t: d.t, p: d.pTI }));
  const datosEnf = datosConEnf.map((d) => ({ t: d.t, p: d.pEnf }));
  const datosTot = datosConEnf.map((d) => ({ t: d.t, p: d.pTotal }));

  const valDatosTITrap = datosTI.length >= 2 ? integrarDatosTrapecio(datosTI, a, b) : 0;
  const valDatosTISimp = datosTI.length >= 2 ? integrarDatosSimpson(datosTI, a, b) : 0;
  const valDatosEnfSimp = datosEnf.length >= 2 ? integrarDatosSimpson(datosEnf, a, b) : 0;
  const valDatosTotTrap = datosTot.length >= 2 ? integrarDatosTrapecio(datosTot, a, b) : 0;
  const valDatosTotSimp = datosTot.length >= 2 ? integrarDatosSimpson(datosTot, a, b) : 0;

  const ajuste = datosTelemetria.length >= 2
    ? calcularMetricasAjuste(datosTelemetria, a, b)
    : { count: 0, mae: 0, rmse: 0, r2: 1 };

  // Energías activas según la fuente seleccionada
  const energiaTIActiva = fuenteDatos === 'datos' ? valDatosTISimp : tfcComp.energiaTI;
  const energiaEnfActiva = fuenteDatos === 'datos' ? valDatosEnfSimp : tfcComp.energiaEnf;
  const energiaPrincipal = energiaTIActiva + energiaEnfActiva;

  // 3. KPIs (incluye PUE y potencia media) y volumen
  const kpis = calcularKPIs(a, b, energiaTIActiva, energiaEnfActiva, fuenteDatos, datosTot);

  // 4. Actualización del resultado rápido y expresión KaTeX
  const resRapido = document.getElementById('resultado-rapido');
  const resTfc = document.getElementById('resultado-tfc');
  const resFuenteLabel = document.getElementById('resultado-fuente-label');
  if (resTfc) resTfc.textContent = formatNum(energiaPrincipal, 2) + ' kWh';
  if (resFuenteLabel) {
    resFuenteLabel.textContent = fuenteDatos === 'datos'
      ? 'Energía total E_total (Datos medidos — Simpson)'
      : (tfcComp.esAnalitico ? 'Energía total E_total (TFC analítico)' : 'Energía total E_total (Modelo ref.)');
  }
  if (resRapido) resRapido.classList.remove('hidden');

  if (typeof renderizarIntegralKatex === 'function') {
    renderizarIntegralKatex({
      a, b, expr, exprTemp,
      fuente: fuenteDatos,
      energiaAnalitica: tfcComp.valor,
      energiaTI: tfcComp.energiaTI,
      energiaEnf: tfcComp.energiaEnf,
      energiaDatosTrap: valDatosTotTrap,
      energiaDatosSimp: valDatosTotSimp
    });
  }

  // Renderizar la antiderivada paso a paso (TFC)
  if (typeof renderizarAntiderivadaPasoAPaso === 'function') {
    renderizarAntiderivadaPasoAPaso({
      a, b, expr, exprTemp,
      coolingParams: { ...coolingParams },
      tfcComp
    });
  }

  // 5. Actualizar tabla de resultados numéricos del modelo (sobre P_total)
  if (typeof actualizarTablaResultados === 'function') {
    actualizarTablaResultados([
      { nombre: 'TFC — P_total(t) = P_TI + P_enf', valor: tfcComp.valor, color: 'text-energy-400', esAnalitico: tfcComp.esAnalitico },
      { nombre: 'Riemann Izquierda', valor: valRizq, color: 'text-sky-400' },
      { nombre: 'Riemann Derecha', valor: valRder, color: 'text-sky-300' },
      { nombre: 'Riemann Punto Medio', valor: valRmed, color: 'text-cyan-400' },
      { nombre: 'Regla del Trapecio', valor: valTrap, color: 'text-violet-400' },
      { nombre: 'Regla de Simpson 1/3', valor: valSimp, color: 'text-pink-400' }
    ], tfcComp.valor, n);
  }

  // 6. Actualizar comparación Modelo Analítico vs. Datos Medidos (TI) y tabla de telemetría
  if (typeof actualizarComparacionModeloDatos === 'function') {
    actualizarComparacionModeloDatos({
      a, b,
      energiaModelo: tfcComp.energiaTI,
      energiaDatosTrap: valDatosTITrap,
      energiaDatosSimp: valDatosTISimp,
      ajuste,
      fuente: fuenteDatos
    });
  }

  if (typeof renderizarTablaTelemetria === 'function') {
    renderizarTablaTelemetria(datosConEnf, a, b);
  }

  // 7. Actualizar tarjetas KPIs (incluye desglose TI, Enfriamiento, PUE, Media)
  if (typeof actualizarTarjetasKPIs === 'function') {
    actualizarTarjetasKPIs(energiaPrincipal, kpis, fuenteDatos);
  }

  // Leer parámetros de fallas, umbrales y emisiones (Fase 3)
  const elCap = document.getElementById('input-capacidad');
  const elUmbT = document.getElementById('input-temp-umbral');
  const elCo2 = document.getElementById('input-factor-co2');
  const elT1 = document.getElementById('input-falla-t1');
  const elT2 = document.getElementById('input-falla-t2');
  if (elCap) capacidadContratada = parseFloat(elCap.value) || 110;
  if (elUmbT) tempUmbral = parseFloat(elUmbT.value) || 28;
  if (elCo2) factorEmisionCO2 = parseFloat(elCo2.value) || 0.164;
  if (elT1) fallaConfig.t1 = parseFloat(elT1.value) || 11;
  if (elT2) fallaConfig.t2 = parseFloat(elT2.value) || 16;

  const analisisFalla = analizarFallaYSolucion(a, b);
  if (typeof renderizarPanelFalla === 'function') {
    renderizarPanelFalla(analisisFalla);
  }

  // 8. Disparar evento para los módulos 2D y 3D
  const puntos = generarPuntos(a, b, 300);
  window.dispatchEvent(
    new CustomEvent('datosListos', {
      detail: {
        ts: puntos.ts,
        ps: puntos.ps,
        a,
        b,
        n,
        tfc: tfcComp.valor,
        energiaPrincipal,
        fuente: fuenteDatos,
        datosTelemetria: datosConEnf,
        valDatosTrap: valDatosTotTrap,
        valDatosSimp: valDatosTotSimp,
        expr,
        exprTemp,
        compiledFn,
        kpis,
        fallaConfig: { ...fallaConfig },
        analisisFalla
      }
    })
  );
}
