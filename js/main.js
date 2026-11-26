/**
 * ==============================================================================
 * PROYECTO DE AULA: CÁLCULO INTEGRAL - UNIVERSIDAD SIMÓN BOLÍVAR
 * ARCHIVO: js/main.js
 * DESCRIPCIÓN: Controlador principal de la interfaz de usuario (UI Controller).
 * 
 * Responsabilidades:
 * 1. Inicialización de componentes al cargar el documento (DOM).
 * 2. Sincronización bidireccional entre sliders de rango e inputs numéricos.
 * 3. Selección y carga de funciones preconfiguradas (presets).
 * 4. Actualización reactiva de las tarjetas de KPIs y la tabla analítica de errores.
 * 5. Navegación fluida (IntersectionObserver para sección activa y menú móvil).
 * ==============================================================================
 */

// ==============================================================================
// 1. FORMATEO NUMÉRICO Y CONTROL DE ERRORES
// ==============================================================================

/**
 * Formatea un número según la convención regional colombiana (separador de miles con punto).
 * @param {number} n - Valor numérico
 * @param {number} decimals - Cantidad de cifras decimales
 * @returns {string} - Cadena formateada (ej: 1.440,00)
 */
function formatNum(n, decimals = 2) {
  if (typeof n !== 'number' || isNaN(n)) return '—';
  return n.toLocaleString('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Calcula el error absoluto y relativo porcentual respecto al valor de referencia.
 * @param {number} aproximado - Valor calculado por el método numérico
 * @param {number} referencia - Valor exacto obtenido por el TFC
 * @returns {object} { abs: number, pct: number }
 */
function calcularError(aproximado, referencia) {
  const abs = Math.abs(aproximado - referencia);
  const pct = referencia !== 0 ? (abs / Math.abs(referencia)) * 100 : 0;
  return { abs, pct };
}

/**
 * Determina el color del texto según la tolerancia del error porcentual.
 * @param {number} pct - Error porcentual
 * @returns {string} - Clase de color Tailwind CSS
 */
function colorError(pct) {
  if (pct < 0.001) return 'text-energy-400'; // Excelente convergencia
  if (pct < 0.05)  return 'text-cyan-400';   // Muy buena precisión
  if (pct < 0.5)   return 'text-yellow-400'; // Aceptable
  return 'text-red-400';                    // Requiere incrementar n
}

// ==============================================================================
// 2. ACTUALIZACIÓN DEL DOM (TABLA Y TARJETAS KPIs)
// ==============================================================================

/**
 * Llena dinámicamente la tabla comparativa de métodos numéricos en la sección de Resultados.
 * @param {Array} resultados - Lista de métodos con sus nombres y valores calculados
 * @param {number} referencia - Valor analítico del TFC
 * @param {number} n - Subdivisiones empleadas
 */
function actualizarTablaResultados(resultados, referencia, n) {
  const tbody = document.getElementById('results-table');
  if (!tbody) return;

  const tfcItem = resultados[0];
  const etiquetaTFC = tfcItem.esAnalitico
    ? 'TFC — Antiderivada analítica exacta'
    : 'TFC — Simpson n=10,000 (referencia)';

  let html = `
    <tr class="border-b border-white/5 bg-energy-500/5">
      <td class="px-6 py-4 font-semibold text-energy-400 flex items-center gap-2">
        <span>⚡</span> ${etiquetaTFC}
      </td>
      <td class="px-6 py-4 text-right font-mono text-white font-bold">${formatNum(referencia, 4)} kWh</td>
      <td class="px-6 py-4 text-right font-mono text-energy-400">0.0000</td>
      <td class="px-6 py-4 text-right font-mono text-energy-400">0.000000%</td>
      <td class="px-6 py-4 text-right font-mono text-gray-400">Continuo (∞)</td>
    </tr>
  `;

  // Filas para los métodos numéricos aproximados
  resultados.slice(1).forEach((metodo) => {
    const { abs, pct } = calcularError(metodo.valor, referencia);
    const claseColor = colorError(pct);

    html += `
      <tr class="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
        <td class="px-6 py-4 font-medium ${metodo.color}">${metodo.nombre}</td>
        <td class="px-6 py-4 text-right font-mono text-gray-200">${formatNum(metodo.valor, 4)} kWh</td>
        <td class="px-6 py-4 text-right font-mono ${claseColor}">${formatNum(abs, 4)}</td>
        <td class="px-6 py-4 text-right font-mono ${claseColor}">${pct.toFixed(6)}%</td>
        <td class="px-6 py-4 text-right font-mono text-gray-400">${n}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * Actualiza las tarjetas de indicadores principales (KPIs) de consumo y costo.
 * @param {number} energiaTotal - Energía total en kWh
 * @param {object} kpis - { potenciaPico, potenciaMedia, costoCOP, volumen3D }
 */
function actualizarTarjetasKPIs(energiaTotal, kpis, fuente = 'analitico') {
  const kpiEnergy = document.getElementById('kpi-energy');
  const kpiEnergySub = document.getElementById('kpi-energy-sub');
  const kpiPeak = document.getElementById('kpi-peak');
  const kpiAvg = document.getElementById('kpi-avg');
  const kpiCost = document.getElementById('kpi-cost');

  // Nuevos KPIs térmicos / PUE (Fase 2)
  const kpiTI = document.getElementById('kpi-energy-ti');
  const kpiEnf = document.getElementById('kpi-energy-enf');
  const kpiPue = document.getElementById('kpi-pue');
  const kpiAvgSub = document.getElementById('kpi-avg-sub');

  if (kpiEnergy) kpiEnergy.textContent = formatNum(energiaTotal, 2) + ' kWh';
  if (kpiEnergySub) {
    kpiEnergySub.textContent = fuente === 'datos' ? 'E_total datos (Simpson)' : 'E_total = E_TI + E_enf';
  }
  if (kpiPeak) kpiPeak.textContent = formatNum(kpis.potenciaPico, 1) + ' kW';
  if (kpiAvg) kpiAvg.textContent = formatNum(kpis.potenciaMedia, 2) + ' kW';
  if (kpiAvgSub) {
    kpiAvgSub.textContent = `TI: ${formatNum(kpis.potenciaMediaTI, 1)} kW | Enf: ${formatNum(kpis.potenciaMediaEnf, 1)} kW`;
  }
  if (kpiCost) kpiCost.textContent = '$' + formatNum(kpis.costoCOP, 0) + ' COP';

  if (kpiTI) kpiTI.textContent = formatNum(kpis.energiaTI, 2) + ' kWh';
  if (kpiEnf) kpiEnf.textContent = formatNum(kpis.energiaEnf, 2) + ' kWh';
  if (kpiPue) kpiPue.textContent = kpis.pue.toFixed(3);
}

// ==============================================================================
// 2B. CONTROLADORES DE TELEMETRÍA Y FORMULA KATEX (FASE 1)
// ==============================================================================

/**
 * Cambia la fuente activa de datos entre 'analitico' y 'datos'.
 */
function setFuenteDatos(fuente) {
  fuenteDatos = fuente;
  const btnAnalitico = document.getElementById('btn-fuente-analitico');
  const btnDatos = document.getElementById('btn-fuente-datos');

  if (btnAnalitico && btnDatos) {
    if (fuente === 'analitico') {
      btnAnalitico.className = 'flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-energy-500/20 text-energy-400 border border-energy-500/40 transition-all';
      btnDatos.className = 'flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-surface-900 text-gray-400 border border-white/10 hover:text-white transition-all';
    } else {
      btnDatos.className = 'flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/40 transition-all';
      btnAnalitico.className = 'flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-surface-900 text-gray-400 border border-white/10 hover:text-white transition-all';
    }
  }

  if (fuente === 'datos' && (!datosTelemetria || datosTelemetria.length < 2)) {
    cargarEjemploTelemetria(resolucionEjemplo);
    return;
  }

  calcularTodo();
}

/**
 * Carga el conjunto de datos de ejemplo según la resolución elegida (1h o 0.5h).
 */
function cargarEjemploTelemetria(paso = 1) {
  resolucionEjemplo = paso;
  datosTelemetria = generarDatosEjemplo(paso);
  ocultarErrorTelemetria();

  const btn1h = document.getElementById('btn-res-1h');
  const btn30m = document.getElementById('btn-res-30m');
  if (btn1h && btn30m) {
    btn1h.className = paso === 1
      ? 'px-3 py-1.5 rounded-lg text-xs font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30'
      : 'px-3 py-1.5 rounded-lg text-xs font-mono bg-white/5 text-gray-400 border border-white/10 hover:text-white';
    btn30m.className = paso === 0.5
      ? 'px-3 py-1.5 rounded-lg text-xs font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30'
      : 'px-3 py-1.5 rounded-lg text-xs font-mono bg-white/5 text-gray-400 border border-white/10 hover:text-white';
  }

  // Sincronizar también el textarea con una vista previa CSV
  const textarea = document.getElementById('textarea-csv');
  if (textarea) {
    textarea.value = 'hora,kw\n' + datosTelemetria.map((d) => `${d.t},${d.p}`).join('\n');
  }

  mostrarEstadoTelemetria(`Cargadas ${datosTelemetria.length} lecturas de ejemplo (cada ${paso === 1 ? '1 hora' : '30 min'}).`);
  calcularTodo();
}

/**
 * Alterna la visibilidad del panel para pegar datos propios.
 */
function togglePanelPegarDatos() {
  const panel = document.getElementById('panel-pegar-csv');
  if (panel) panel.classList.toggle('hidden');
}

/**
 * Lee y valida los datos pegados por el usuario en el textarea.
 */
function aplicarDatosPegados() {
  const textarea = document.getElementById('textarea-csv');
  if (!textarea) return;
  const res = parsearTextoCSV(textarea.value);
  if (!res.ok) {
    mostrarErrorTelemetria(res.error);
    return;
  }
  datosTelemetria = res.datos;
  ocultarErrorTelemetria();
  mostrarEstadoTelemetria(`Se cargaron ${datosTelemetria.length} lecturas propias correctamente.`);
  setFuenteDatos('datos');
}

/**
 * Procesa un archivo CSV o TXT subido por el usuario.
 */
function manejarArchivoCSV(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const contenido = e.target.result;
    const res = parsearTextoCSV(contenido);
    if (!res.ok) {
      mostrarErrorTelemetria(`Error en "${file.name}": ${res.error}`);
      return;
    }
    datosTelemetria = res.datos;
    const textarea = document.getElementById('textarea-csv');
    if (textarea) {
      textarea.value = 'hora,kw\n' + datosTelemetria.map((d) => `${d.t},${d.p}`).join('\n');
    }
    ocultarErrorTelemetria();
    mostrarEstadoTelemetria(`Archivo "${file.name}" cargado (${datosTelemetria.length} lecturas).`);
    setFuenteDatos('datos');
  };
  reader.onerror = () => {
    mostrarErrorTelemetria('No se pudo leer el archivo seleccionado.');
  };
  reader.readAsText(file);
}

function mostrarErrorTelemetria(msg) {
  const el = document.getElementById('telemetria-error');
  const okEl = document.getElementById('telemetria-status');
  if (okEl) okEl.classList.add('hidden');
  if (el) {
    el.textContent = '⚠ ' + msg;
    el.classList.remove('hidden');
  }
}

function ocultarErrorTelemetria() {
  const el = document.getElementById('telemetria-error');
  if (el) el.classList.add('hidden');
}

function mostrarEstadoTelemetria(msg) {
  const okEl = document.getElementById('telemetria-status');
  if (okEl) {
    okEl.textContent = '✓ ' + msg;
    okEl.classList.remove('hidden');
  }
}

/**
 * Renderiza la expresión formal de la integral con límites [a, b] usando KaTeX.
 */
function renderizarIntegralKatex(info) {
  const cont = document.getElementById('integral-katex');
  if (!cont) return;

  const { a, b, fuente, energiaAnalitica, energiaTI, energiaEnf, energiaDatosTrap, energiaDatosSimp } = info;
  const aStr = Number(a).toString();
  const bStr = Number(b).toString();

  let latex = '';
  if (fuente === 'datos') {
    latex = `E_{\\text{total}} = \\int_{${aStr}}^{${bStr}} \\left[P_{\\text{TI,med}}(t) + P_{\\text{enf}}(t)\\right]dt \\approx ${energiaDatosSimp.toFixed(2)}\\text{ kWh} \\;(\\text{Simpson}) \\;\\Big|\\; ${energiaDatosTrap.toFixed(2)}\\text{ kWh} \\;(\\text{Trapecio})`;
  } else {
    latex = `E_{\\text{total}} = \\int_{${aStr}}^{${bStr}} \\left[P_{\\text{TI}}(t) + P_{\\text{enf}}(t)\\right]dt = ${energiaTI.toFixed(2)} + ${energiaEnf.toFixed(2)} = ${energiaAnalitica.toFixed(2)}\\text{ kWh}`;
  }

  if (typeof katex !== 'undefined') {
    katex.render(latex, cont, { displayMode: true, throwOnError: false });
  } else {
    cont.textContent = `E_total = ∫[${aStr}, ${bStr}] [P_TI(t) + P_enf(t)] dt ≈ ${(fuente === 'datos' ? energiaDatosSimp : energiaAnalitica).toFixed(2)} kWh`;
  }
}

/**
 * Renderiza paso a paso la antiderivada analítica F(t) y la evaluación del TFC en [a, b].
 */
function renderizarAntiderivadaPasoAPaso(info) {
  const cont = document.getElementById('antiderivada-pasos-katex');
  if (!cont || typeof katex === 'undefined') return;

  const { a, b, coolingParams: cp, tfcComp } = info;
  const { c0, c1, tRef } = cp;
  const aStr = Number(a).toString();
  const bStr = Number(b).toString();

  const terminoConstEnf = c0 + c1 * (24 - tRef);
  const coefCosEnf = 72 * c1;
  const coefSenoEnf = 6 * c1;

  let latex = '';
  if (tfcComp.esAnalitico) {
    const fTIa = antiderivadaDefault(a);
    const fTIb = antiderivadaDefault(b);
    const fEnfa = antiderivadaEnfDefault(a);
    const fEnfb = antiderivadaEnfDefault(b);
    const fTotA = fTIa + fEnfa;
    const fTotB = fTIb + fEnfb;

    latex = `
    \\begin{aligned}
      &\\textbf{1. Modelo térmico y de enfriamiento:} \\\\
      &P_{\\text{enf}}(t) = ${c0.toFixed(2)} + ${c1.toFixed(2)}\\left(24 + 6\\sin\\!\\left(\\frac{\\pi(t-9)}{12}\\right) - ${tRef.toFixed(1)}\\right)
      = ${terminoConstEnf.toFixed(2)} + ${coefSenoEnf.toFixed(2)}\\sin\\!\\left(\\frac{\\pi(t-9)}{12}\\right) \\\\[6pt]
      &\\textbf{2. Antiderivada de carga TI:} \\\\
      &F_{\\text{TI}}(t) = \\int P_{\\text{TI}}(t)\\,dt = 60t - \\frac{300}{\\pi}\\cos\\!\\left(\\frac{\\pi t}{12}\\right) - \\frac{60}{\\pi}\\cos\\!\\left(\\frac{\\pi t}{6}\\right) \\\\[6pt]
      &\\textbf{3. Antiderivada de enfriamiento:} \\\\
      &F_{\\text{enf}}(t) = \\int P_{\\text{enf}}(t)\\,dt = ${terminoConstEnf.toFixed(2)}t - \\frac{${coefCosEnf.toFixed(2)}}{\\pi}\\cos\\!\\left(\\frac{\\pi(t-9)}{12}\\right) \\\\[6pt]
      &\\textbf{4. Evaluación TFC en } [${aStr}, ${bStr}]: \\\\
      &E_{\\text{TI}} = F_{\\text{TI}}(${bStr}) - F_{\\text{TI}}(${aStr}) = ${fTIb.toFixed(2)} - (${fTIa.toFixed(2)}) = ${tfcComp.energiaTI.toFixed(2)}\\text{ kWh} \\\\
      &E_{\\text{enf}} = F_{\\text{enf}}(${bStr}) - F_{\\text{enf}}(${aStr}) = ${fEnfb.toFixed(2)} - (${fEnfa.toFixed(2)}) = ${tfcComp.energiaEnf.toFixed(2)}\\text{ kWh} \\\\
      &E_{\\text{total}} = F_{\\text{total}}(${bStr}) - F_{\\text{total}}(${aStr}) = ${fTotB.toFixed(2)} - (${fTotA.toFixed(2)}) = \\mathbf{${tfcComp.valor.toFixed(2)}\\text{ kWh}}
    \\end{aligned}
    `;
  } else {
    latex = `
    \\begin{aligned}
      &\\textbf{Evaluación sobre expresión personalizada en } [${aStr}, ${bStr}]: \\\\
      &P_{\\text{enf}}(t) = ${c0.toFixed(2)} + ${c1.toFixed(2)}\\,(T(t) - ${tRef.toFixed(1)}) \\\\
      &E_{\\text{TI}} = \\int_{${aStr}}^{${bStr}} P_{\\text{TI}}(t)\\,dt \\approx ${tfcComp.energiaTI.toFixed(2)}\\text{ kWh} \\\\
      &E_{\\text{enf}} = \\int_{${aStr}}^{${bStr}} P_{\\text{enf}}(t)\\,dt \\approx ${tfcComp.energiaEnf.toFixed(2)}\\text{ kWh} \\\\
      &E_{\\text{total}} = E_{\\text{TI}} + E_{\\text{enf}} \\approx \\mathbf{${tfcComp.valor.toFixed(2)}\\text{ kWh}}
    \\end{aligned}
    `;
  }

  katex.render(latex, cont, { displayMode: true, throwOnError: false });
}

/**
 * Actualiza el panel de comparación entre el Modelo Analítico y los Datos Medidos.
 */
function actualizarComparacionModeloDatos(info) {
  const { energiaModelo, energiaDatosTrap, energiaDatosSimp, ajuste } = info;
  const elMod = document.getElementById('comp-energia-modelo');
  const elTrap = document.getElementById('comp-energia-trap');
  const elSimp = document.getElementById('comp-energia-simp');
  const elErr = document.getElementById('comp-error-energia');
  const elRmse = document.getElementById('comp-rmse');
  const elMae = document.getElementById('comp-mae');
  const elR2 = document.getElementById('comp-r2');

  if (elMod) elMod.textContent = formatNum(energiaModelo, 2) + ' kWh';
  if (elTrap) elTrap.textContent = formatNum(energiaDatosTrap, 2) + ' kWh';
  if (elSimp) elSimp.textContent = formatNum(energiaDatosSimp, 2) + ' kWh';

  if (elErr) {
    const diff = Math.abs(energiaDatosSimp - energiaModelo);
    const pct = energiaModelo !== 0 ? (diff / Math.abs(energiaModelo)) * 100 : 0;
    elErr.textContent = `${formatNum(diff, 2)} kWh (${pct.toFixed(2)}%)`;
  }

  if (elRmse) elRmse.textContent = formatNum(ajuste.rmse, 2) + ' kW';
  if (elMae) elMae.textContent = formatNum(ajuste.mae, 2) + ' kW';
  if (elR2) elR2.textContent = ajuste.r2.toFixed(4);
}

/**
 * Llena la tabla de lecturas de telemetría comparando cada punto medido vs. el modelo analítico.
 */
function renderizarTablaTelemetria(datos, a, b) {
  const tbody = document.getElementById('tabla-telemetria');
  const countEl = document.getElementById('telemetria-count');
  if (!tbody) return;

  if (countEl) countEl.textContent = `${datos.length} lecturas`;

  let html = '';
  datos.forEach((pt) => {
    const enIntervalo = pt.t >= a - 1e-9 && pt.t <= b + 1e-9;
    const pTI = pt.pTI !== undefined ? pt.pTI : pt.p;
    const temp = pt.temp !== undefined ? pt.temp : evaluarTemp(pt.t);
    const pEnf = pt.pEnf !== undefined ? pt.pEnf : evaluarPEnf(pt.t);
    const pModTI = evaluarPTI(pt.t);
    const diff = Math.abs(pTI - pModTI);
    const rowCls = enIntervalo ? 'bg-amber-500/5 text-gray-200' : 'text-gray-500 opacity-60';

    html += `
      <tr class="border-b border-white/5 ${rowCls}">
        <td class="px-4 py-2 font-mono text-xs">${pt.t.toFixed(2)} h ${enIntervalo ? '<span class="text-amber-400">●</span>' : ''}</td>
        <td class="px-4 py-2 text-right font-mono text-xs text-amber-300">${pTI.toFixed(2)} kW</td>
        <td class="px-4 py-2 text-right font-mono text-xs text-orange-400">${temp.toFixed(1)} °C</td>
        <td class="px-4 py-2 text-right font-mono text-xs text-violet-300">${pEnf.toFixed(2)} kW</td>
        <td class="px-4 py-2 text-right font-mono text-xs text-energy-400">${pModTI.toFixed(2)} kW</td>
        <td class="px-4 py-2 text-right font-mono text-xs">${diff.toFixed(2)} kW</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * Aplica un intervalo rápido [a, b] (útil para ver errores en intervalos parciales).
 */
function setIntervaloRapido(aVal, bVal) {
  const sa = document.getElementById('slider-a');
  const ia = document.getElementById('input-a');
  const sb = document.getElementById('slider-b');
  const ib = document.getElementById('input-b');
  if (sa && ia) { sa.value = aVal; ia.value = aVal; }
  if (sb && ib) { sb.value = bVal; ib.value = bVal; }
  calcularTodo();
}

// ==============================================================================
// 3. SINCRONIZACIÓN DE CONTROLES DEL PANEL
// ==============================================================================

/** Sincroniza slider de rango hacia input numérico */
function syncInput(sliderId, inputId) {
  const slider = document.getElementById(sliderId);
  const input = document.getElementById(inputId);
  if (slider && input) input.value = slider.value;
}

/** Sincroniza input numérico hacia slider de rango */
function syncSlider(inputId, sliderId) {
  const input = document.getElementById(inputId);
  const slider = document.getElementById(sliderId);
  if (input && slider) slider.value = input.value;
}

/**
 * Carga una función modelo predefinida y activa la validación en tiempo real.
 * @param {string} expr - Expresión algebraica de potencia
 */
function setPreset(expr) {
  const inputFunc = document.getElementById('input-funcion');
  if (inputFunc) {
    inputFunc.value = expr;
    validarFuncionEnTiempoReal();
  }
}

/** Carga una función predefinida de temperatura T(t) */
function setTempPreset(expr) {
  const inputTemp = document.getElementById('input-temp');
  if (inputTemp) {
    inputTemp.value = expr;
    validarTempEnTiempoReal();
  }
}

function mostrarErrorTemp(mensaje) {
  const errEl = document.getElementById('temp-error');
  const statusEl = document.getElementById('temp-status');
  if (errEl) {
    errEl.textContent = '⚠ ' + mensaje;
    errEl.classList.remove('hidden');
  }
  if (statusEl) {
    statusEl.textContent = '✗';
    statusEl.className = 'flex-shrink-0 w-10 h-12 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 text-xl font-bold';
  }
}

function ocultarErrorTemp() {
  const errEl = document.getElementById('temp-error');
  const statusEl = document.getElementById('temp-status');
  if (errEl) errEl.classList.add('hidden');
  if (statusEl) {
    statusEl.textContent = '✓';
    statusEl.className = 'flex-shrink-0 w-10 h-12 flex items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 text-xl font-bold';
  }
}

let debounceTempTimer = null;
function validarTempEnTiempoReal() {
  clearTimeout(debounceTempTimer);
  debounceTempTimer = setTimeout(() => {
    const inputTemp = document.getElementById('input-temp');
    if (!inputTemp) return;
    const expr = inputTemp.value.trim();
    if (!expr) return;
    const parseResult = parsearFuncion(expr);
    if (parseResult.ok) {
      ocultarErrorTemp();
    } else {
      mostrarErrorTemp(parseResult.error);
    }
  }, 350);
}

/** Notifica visualmente un error de sintaxis en el campo de la función */
function mostrarErrorFuncion(mensaje) {
  const errEl = document.getElementById('funcion-error');
  const statusEl = document.getElementById('funcion-status');
  if (errEl) {
    errEl.textContent = '⚠ ' + mensaje;
    errEl.classList.remove('hidden');
  }
  if (statusEl) {
    statusEl.textContent = '✗';
    statusEl.className = 'flex-shrink-0 w-10 h-12 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 text-xl font-bold';
  }
}

/** Restablece el estado de validación positiva */
function ocultarErrorFuncion() {
  const errEl = document.getElementById('funcion-error');
  const statusEl = document.getElementById('funcion-status');
  if (errEl) errEl.classList.add('hidden');
  if (statusEl) {
    statusEl.textContent = '✓';
    statusEl.className = 'flex-shrink-0 w-10 h-12 flex items-center justify-center rounded-xl bg-energy-500/10 text-energy-400 text-xl font-bold';
  }
}

/**
 * Validación con retardo (debounce) para no saturar la CPU mientras se teclea.
 */
let debounceTimer = null;
function validarFuncionEnTiempoReal() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const inputFunc = document.getElementById('input-funcion');
    if (!inputFunc) return;
    const expr = inputFunc.value.trim();
    if (!expr) return;
    const parseResult = parsearFuncion(expr);
    if (parseResult.ok) {
      ocultarErrorFuncion();
    } else {
      mostrarErrorFuncion(parseResult.error);
    }
  }, 350);
}

// ==============================================================================
// 4. INTERACTIVIDAD DE NAVEGACIÓN Y MENÚ
// ==============================================================================

/**
 * Configura la respuesta al menú hamburguesa en dispositivos móviles.
 */
function configurarMenuMovil() {
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const iconOpen = document.getElementById('menu-icon-open');
  const iconClose = document.getElementById('menu-icon-close');

  if (!menuToggle || !mobileMenu) return;

  menuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    if (iconOpen) iconOpen.classList.toggle('hidden');
    if (iconClose) iconClose.classList.toggle('hidden');
  });

  mobileMenu.querySelectorAll('a').forEach((enlace) => {
    enlace.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      if (iconOpen) iconOpen.classList.remove('hidden');
      if (iconClose) iconClose.classList.add('hidden');
    });
  });
}

/**
 * Resalta el enlace activo en el menú de navegación al desplazarse por la página.
 */
function configurarResaltadoScroll() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            const href = link.getAttribute('href');
            link.classList.toggle('active', href === `#${id}`);
          });
        }
      });
    },
    {
      rootMargin: '-20% 0px -75% 0px'
    }
  );

  sections.forEach((s) => observer.observe(s));
}

/**
 * Aplica animación de aparición a elementos con la clase .card-fade.
 */
function configurarAnimacionesEntrada() {
  const cards = document.querySelectorAll('.card-fade');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  cards.forEach((c) => observer.observe(c));
}

// ==============================================================================
// 4B. CONTROLADORES DE ESCENARIOS DE FALLA Y SOLUCIONES (FASE 3)
// ==============================================================================

/**
 * Selecciona un escenario de falla y recalcula el sistema.
 */
function setTipoFalla(tipo) {
  fallaConfig.tipo = tipo;
  const tipos = ['ninguna', 'refrigeracion', 'pico_trafico', 'corte_energia', 'throttling'];
  tipos.forEach((t) => {
    const btn = document.getElementById(`btn-falla-${t}`);
    if (!btn) return;
    if (t === tipo) {
      btn.className = t === 'ninguna'
        ? 'px-3 py-2 rounded-xl text-xs font-semibold bg-energy-500/20 text-energy-400 border border-energy-500/40 transition-all'
        : 'px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/40 transition-all';
    } else {
      btn.className = 'px-3 py-2 rounded-xl text-xs font-semibold bg-surface-900 text-gray-400 border border-white/10 hover:text-white transition-all';
    }
  });
  calcularTodo();
}

/**
 * Activa o desactiva la simulación de la solución de mitigación en la gráfica y alertas.
 */
function toggleSolucionFalla() {
  fallaConfig.aplicarSolucion = !fallaConfig.aplicarSolucion;
  const btn = document.getElementById('btn-aplicar-solucion');
  if (btn) {
    if (fallaConfig.aplicarSolucion) {
      btn.textContent = '✅ Solución Aplicada (Ver en 2D)';
      btn.className = 'w-full sm:w-auto px-4 py-2 rounded-xl bg-lime-500/20 text-lime-300 border border-lime-500/40 text-xs font-bold transition-all';
    } else {
      btn.textContent = '🛠 Simular Solución en Gráfica 2D';
      btn.className = 'w-full sm:w-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-lime-500/15 text-gray-200 hover:text-lime-300 border border-white/15 text-xs font-bold transition-all';
    }
  }
  calcularTodo();
}

/**
 * Actualiza el panel de fallas, alertas, integral ΔE en KaTeX y tarjeta de solución.
 */
function renderizarPanelFalla(analisis) {
  const descEl = document.getElementById('falla-descripcion');
  const alertaBox = document.getElementById('falla-alertas');
  const katexEl = document.getElementById('falla-delta-katex');
  const elDelta = document.getElementById('falla-delta-e');
  const elCosto = document.getElementById('falla-costo-extra');
  const solCard = document.getElementById('tarjeta-solucion');
  const solTitulo = document.getElementById('solucion-titulo');
  const solDesc = document.getElementById('solucion-desc');
  const solAntes = document.getElementById('solucion-antes');
  const solDespues = document.getElementById('solucion-despues');
  const solAhorroKwh = document.getElementById('solucion-ahorro-kwh');
  const solAhorroCop = document.getElementById('solucion-ahorro-cop');
  const solAhorroCo2 = document.getElementById('solucion-ahorro-co2');

  if (descEl) descEl.textContent = analisis.info.descFalla;

  // Renderizar alertas de capacidad contratada y temperatura umbral
  if (alertaBox) {
    const msgs = [];
    if (analisis.alertas.excedeCapacidad) {
      msgs.push(`⚠ ALERTA POTENCIA: Pico ${analisis.alertas.picoP.toFixed(1)} kW supera la capacidad contratada (${capacidadContratada} kW) durante ${analisis.alertas.horasSobreCap.toFixed(1)} h.`);
    }
    if (analisis.alertas.excedeTemp) {
      msgs.push(`🌡 ALERTA TÉRMICA: Temperatura máxima ${analisis.alertas.picoT.toFixed(1)} °C supera el umbral (${tempUmbral} °C) durante ${analisis.alertas.horasSobreTemp.toFixed(1)} h.`);
    }

    if (msgs.length > 0) {
      alertaBox.innerHTML = msgs.map((m) => `<p>${m}</p>`).join('');
      alertaBox.className = 'p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono space-y-1';
    } else {
      alertaBox.innerHTML = `<p>✓ Sistema dentro de umbrales seguros: Pico ${analisis.alertas.picoP.toFixed(1)} kW (≤ ${capacidadContratada} kW) | Temp máx ${analisis.alertas.picoT.toFixed(1)} °C (≤ ${tempUmbral} °C).</p>`;
      alertaBox.className = 'p-4 rounded-xl bg-energy-500/10 border border-energy-500/25 text-energy-300 text-xs font-mono';
    }
  }

  if (!analisis.activo) {
    if (elDelta) elDelta.textContent = '0,00 kWh';
    if (elCosto) elCosto.textContent = '$0 COP';
    if (katexEl && typeof katex !== 'undefined') {
      katex.render('\\Delta E = \\int_{t_1}^{t_2} \\left(P_{\\text{falla}}(t) - P_{\\text{base}}(t)\\right)dt = 0.00\\text{ kWh}', katexEl, { displayMode: true, throwOnError: false });
    }
    if (solCard) solCard.classList.add('opacity-60');
    if (solTitulo) solTitulo.textContent = analisis.info.solucionTitulo;
    if (solDesc) solDesc.textContent = analisis.info.solucionDesc;
    if (solAntes) solAntes.textContent = '— kWh';
    if (solDespues) solDespues.textContent = '— kWh';
    if (solAhorroKwh) solAhorroKwh.textContent = '0,00 kWh';
    if (solAhorroCop) solAhorroCop.textContent = '$0 COP';
    if (solAhorroCo2) solAhorroCo2.textContent = '0,00 kg CO₂';
    return;
  }

  if (solCard) solCard.classList.remove('opacity-60');

  const signo = analisis.deltaE >= 0 ? '+' : '';
  if (elDelta) {
    elDelta.textContent = `${signo}${formatNum(analisis.deltaE, 2)} kWh`;
    elDelta.className = analisis.deltaE >= 0
      ? 'text-xl font-black text-red-400 font-mono mt-1'
      : 'text-xl font-black text-amber-400 font-mono mt-1';
  }
  if (elCosto) {
    elCosto.textContent = `${analisis.costoExtraCOP >= 0 ? '+' : '-'}$${formatNum(Math.abs(analisis.costoExtraCOP), 0)} COP`;
  }

  if (katexEl && typeof katex !== 'undefined') {
    const latex = `\\Delta E = \\int_{${analisis.t1}}^{${analisis.t2}} \\left(P_{\\text{falla}}(t) - P_{\\text{base}}(t)\\right)dt = ${analisis.energiaFallaEvento.toFixed(2)} - ${analisis.energiaBaseEvento.toFixed(2)} = ${signo}${analisis.deltaE.toFixed(2)}\\text{ kWh}`;
    katex.render(latex, katexEl, { displayMode: true, throwOnError: false });
  }

  if (solTitulo) solTitulo.textContent = analisis.info.solucionTitulo;
  if (solDesc) solDesc.textContent = analisis.info.solucionDesc;
  if (solAntes) solAntes.textContent = `${formatNum(analisis.energiaFallaEvento, 2)} kWh`;
  if (solDespues) solDespues.textContent = `${formatNum(analisis.energiaSolEvento, 2)} kWh`;
  if (solAhorroKwh) solAhorroKwh.textContent = `${formatNum(analisis.ahorroKwh, 2)} kWh`;
  if (solAhorroCop) solAhorroCop.textContent = `$${formatNum(analisis.ahorroCOP, 0)} COP`;
  if (solAhorroCo2) solAhorroCo2.textContent = `${formatNum(analisis.ahorroCO2, 2)} kg CO₂`;
}

// ==============================================================================
// 5. INICIALIZACIÓN GLOBAL (DOMContentLoaded)
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Configurar navegación y comportamientos visuales
  configurarMenuMovil();
  configurarResaltadoScroll();
  configurarAnimacionesEntrada();

  // 2. Escuchar cambios de texto en el input de función, temperatura y archivo CSV
  const inputFunc = document.getElementById('input-funcion');
  if (inputFunc) {
    inputFunc.addEventListener('input', validarFuncionEnTiempoReal);
  }
  const inputTemp = document.getElementById('input-temp');
  if (inputTemp) {
    inputTemp.addEventListener('input', validarTempEnTiempoReal);
  }
  const inputCsv = document.getElementById('input-csv-file');
  if (inputCsv) {
    inputCsv.addEventListener('change', manejarArchivoCSV);
  }

  // 3. Precargar datos de telemetría de ejemplo (24h, cada 1h) para comparación inmediata
  if (typeof generarDatosEjemplo === 'function') {
    datosTelemetria = generarDatosEjemplo(1);
    const textarea = document.getElementById('textarea-csv');
    if (textarea) {
      textarea.value = 'hora,kw\n' + datosTelemetria.map((d) => `${d.t},${d.p}`).join('\n');
    }
  }

  // 4. Inicializar simuladores gráficos
  if (typeof inicializarChart2D === 'function') {
    inicializarChart2D();
  }
  if (typeof inicializarThree3D === 'function') {
    inicializarThree3D();
  }

  // 5. Ejecutar el primer cálculo con los datos por defecto tras la carga
  setTimeout(() => {
    if (typeof calcularTodo === 'function') {
      calcularTodo();
    }
  }, 450);
});
