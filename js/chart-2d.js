/**
 * ==============================================================================
 * PROYECTO DE AULA: CÁLCULO INTEGRAL - UNIVERSIDAD SIMÓN BOLÍVAR
 * ARCHIVO: js/chart-2d.js
 * DESCRIPCIÓN: Módulo de Visualización Gráfica Bidimensional (2D) con Chart.js.
 * 
 * Funcionalidades del Módulo:
 * 1. Graficación continua de la función de potencia P(t) en el dominio temporal.
 * 2. Visualización geométrica del área bajo la curva que representa la integral definida:
 *    E = \int_a^b P(t) dt [kWh]
 * 3. Renderizado interactivo de rectángulos de partición de Riemann (Izquierda,
 *    Derecha, Punto Medio) para contrastar visualmente el error de aproximación.
 * 4. Marcadores dinámicos verticales de los límites de integración a y b mediante
 *    el plugin oficial chartjs-plugin-annotation.
 * ==============================================================================
 */

// ==============================================================================
// 1. ESTADO GLOBAL DEL SIMULADOR 2D
// ==============================================================================

let chart2D = null;           // Instancia global del objeto Chart.js
let mostrarArea = true;       // Indicador booleano para alternar el sombreado del área
let modoRiemann = 'izq';      // Estrategia visual de Riemann: 'izq' | 'der' | 'med' | 'off'
let ultimosDatos2D = null;     // Memoria caché del último evento de datos matemáticos

// ==============================================================================
// 2. INICIALIZACIÓN DEL CANVAS CON CHART.JS
// ==============================================================================

/**
 * Configura e inicializa el lienzo 2D en el elemento <canvas id="chart-2d">.
 * Implementa una gráfica mixta (Line + Bar) para representar simultáneamente
 * la curva matemática continua y los rectángulos discretos de Riemann.
 */
function inicializarChart2D() {
  const canvas = document.getElementById('chart-2d');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Registro del plugin de anotaciones si está cargado desde el CDN
  if (window['chartjs-plugin-annotation']) {
    Chart.register(window['chartjs-plugin-annotation']);
  }

  chart2D = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        // Dataset 0: Curva completa P_total(t) en [0, 24] (contexto)
        {
          label: 'P_total(t) Ciclo [0, 24h]',
          data: [],
          yAxisID: 'y',
          borderColor: 'rgba(52, 211, 153, 0.20)',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderDash: [5, 4],
          pointRadius: 0,
          tension: 0.35,
          fill: false,
          order: 6
        },
        // Dataset 1: P_total(t) en [a, b] + área sombreada
        {
          label: 'P_total(t) [kW]',
          data: [],
          yAxisID: 'y',
          borderColor: '#34d399',
          backgroundColor: 'rgba(16, 185, 129, 0.14)',
          borderWidth: 2.8,
          pointRadius: 0,
          tension: 0.35,
          fill: 'origin',
          order: 2
        },
        // Dataset 2: P_TI(t) en [a, b] + área sombreada
        {
          label: 'P_TI(t) [kW]',
          data: [],
          yAxisID: 'y',
          borderColor: '#22d3ee',
          backgroundColor: 'rgba(34, 211, 238, 0.14)',
          borderWidth: 2.2,
          pointRadius: 0,
          tension: 0.35,
          fill: 'origin',
          order: 3
        },
        // Dataset 3: P_enfriamiento(t) en [a, b] + área sombreada
        {
          label: 'P_enfriamiento(t) [kW]',
          data: [],
          yAxisID: 'y',
          borderColor: '#a78bfa',
          backgroundColor: 'rgba(167, 139, 250, 0.18)',
          borderWidth: 2.2,
          pointRadius: 0,
          tension: 0.35,
          fill: 'origin',
          order: 4
        },
        // Dataset 4: Temperatura T(t) en segundo eje vertical (yTemp) + área en [a, b]
        {
          label: 'Temperatura T(t) [°C]',
          data: [],
          yAxisID: 'yTemp',
          borderColor: '#fb923c',
          backgroundColor: 'rgba(251, 146, 60, 0.10)',
          borderWidth: 2,
          borderDash: [3, 3],
          pointRadius: 0,
          tension: 0.35,
          fill: 'origin',
          order: 5
        },
        // Dataset 5: Rectángulos discretos de aproximación por Sumas de Riemann (sobre P_total)
        {
          type: 'bar',
          label: 'Aproximación de Riemann',
          data: [],
          yAxisID: 'y',
          backgroundColor: 'rgba(56, 189, 248, 0.25)',
          borderColor: 'rgba(56, 189, 248, 0.65)',
          borderWidth: 1,
          barPercentage: 1.0,
          categoryPercentage: 1.0,
          order: 1
        },
        // Dataset 6: Lecturas de Telemetría (Datos Medidos P_total)
        {
          label: 'Datos Medidos (Telemetría)',
          data: [],
          yAxisID: 'y',
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.18)',
          borderWidth: 2,
          pointRadius: 3.5,
          pointHoverRadius: 5,
          tension: 0,
          spanGaps: true,
          showLine: true,
          fill: false,
          order: 0
        },
        // Dataset 7: Escenario de Falla P_falla(t) en [t1, t2]
        {
          label: 'Con Falla P_falla(t)',
          data: [],
          yAxisID: 'y',
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.18)',
          borderWidth: 2.5,
          pointRadius: 0,
          tension: 0.15,
          fill: 'origin',
          order: 1
        },
        // Dataset 8: Escenario Mitigado / Con Solución P_sol(t) en [t1, t2]
        {
          label: 'Con Solución P_sol(t)',
          data: [],
          yAxisID: 'y',
          borderColor: '#84cc16',
          backgroundColor: 'rgba(132, 204, 22, 0.20)',
          borderWidth: 2.5,
          borderDash: [4, 2],
          pointRadius: 0,
          tension: 0.15,
          fill: 'origin',
          order: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: false // Leyenda personalizada construida en HTML semántico
        },
        tooltip: {
          backgroundColor: 'rgba(17, 17, 27, 0.95)',
          borderColor: 'rgba(52, 211, 153, 0.35)',
          borderWidth: 1,
          titleColor: '#34d399',
          bodyColor: '#e5e7eb',
          titleFont: { family: 'JetBrains Mono', size: 13, weight: 'bold' },
          bodyFont: { family: 'JetBrains Mono', size: 12 },
          padding: 12,
          callbacks: {
            title: (items) => `Tiempo t = ${parseFloat(items[0].label).toFixed(2)} h`,
            label: (item) => {
              if (item.raw === null) return null;
              const idx = item.datasetIndex;
              if (idx === 1) return ` P_total(t): ${parseFloat(item.raw).toFixed(2)} kW`;
              if (idx === 2) return ` P_TI(t): ${parseFloat(item.raw).toFixed(2)} kW`;
              if (idx === 3) return ` P_enfriamiento(t): ${parseFloat(item.raw).toFixed(2)} kW`;
              if (idx === 4) return ` Temperatura T(t): ${parseFloat(item.raw).toFixed(2)} °C`;
              if (idx === 5 && item.raw > 0) return ` Riemann (P_total): ${parseFloat(item.raw).toFixed(2)} kW`;
              if (idx === 6) return ` Telemetría P_total: ${parseFloat(item.raw).toFixed(2)} kW`;
              if (idx === 7) return ` Con Falla P_falla: ${parseFloat(item.raw).toFixed(2)} kW`;
              if (idx === 8) return ` Con Solución P_sol: ${parseFloat(item.raw).toFixed(2)} kW`;
              return null;
            },
            filter: (item) => item.raw !== null && item.raw !== 0
          }
        },
        annotation: {
          annotations: {
            lineA: {
              type: 'line',
              scaleID: 'x',
              value: '0.000',
              borderColor: '#22d3ee',
              borderWidth: 2,
              borderDash: [6, 4],
              label: {
                display: true,
                content: 'a = 0h',
                color: '#22d3ee',
                backgroundColor: 'rgba(17, 24, 39, 0.85)',
                font: { family: 'JetBrains Mono', size: 11, weight: 'bold' },
                position: 'start',
                yAdjust: 10
              }
            },
            lineB: {
              type: 'line',
              scaleID: 'x',
              value: '24.000',
              borderColor: '#f472b6',
              borderWidth: 2,
              borderDash: [6, 4],
              label: {
                display: true,
                content: 'b = 24h',
                color: '#f472b6',
                backgroundColor: 'rgba(17, 24, 39, 0.85)',
                font: { family: 'JetBrains Mono', size: 11, weight: 'bold' },
                position: 'start',
                yAdjust: 10
              }
            }
          }
        }
      },
      scales: {
        x: {
          type: 'category',
          title: {
            display: true,
            text: 'Tiempo transcurrido t (horas)',
            color: '#9ca3af',
            font: { family: 'Inter', size: 12, weight: '500' }
          },
          ticks: {
            color: '#6b7280',
            maxTicksLimit: 13,
            font: { family: 'JetBrains Mono', size: 11 },
            callback: function (val, index) {
              const label = this.getLabelForValue(val);
              const num = parseFloat(label);
              return num % 2 < 0.1 || num % 2 > 1.9 ? num.toFixed(0) + 'h' : '';
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.04)',
            drawBorder: false
          }
        },
        y: {
          position: 'left',
          title: {
            display: true,
            text: 'Potencia Eléctrica [kW]',
            color: '#9ca3af',
            font: { family: 'Inter', size: 12, weight: '500' }
          },
          ticks: {
            color: '#6b7280',
            font: { family: 'JetBrains Mono', size: 11 },
            callback: (v) => v.toFixed(0) + ' kW'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.04)',
            drawBorder: false
          },
          min: 0
        },
        yTemp: {
          position: 'right',
          title: {
            display: true,
            text: 'Temperatura T(t) [°C]',
            color: '#fb923c',
            font: { family: 'Inter', size: 12, weight: '500' }
          },
          ticks: {
            color: '#fb923c',
            font: { family: 'JetBrains Mono', size: 11 },
            callback: (v) => v.toFixed(1) + ' °C'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  });
}

// ==============================================================================
// 3. ACTUALIZACIÓN DINÁMICA DE CURVAS Y PARTICIONES
// ==============================================================================

/**
 * Regenera los conjuntos de datos del gráfico al recibir nuevos cálculos.
 * @param {object} datos - Objeto de datos proveniente del motor matemático
 */
function actualizarGrafico(datos) {
  if (!chart2D) return;
  ultimosDatos2D = datos;
  const { a, b, n, fuente, datosTelemetria: telemetria } = datos;
  const esModoDatos = fuente === 'datos' && Array.isArray(telemetria) && telemetria.length >= 2;

  // 1. Muestreo de alta resolución en el intervalo total [0, 24]
  const N_TOTAL = 300;
  const hTotal = 24 / N_TOTAL;
  const labels = [];
  const ptsCompleto = [];
  const ptsTotal = [];
  const ptsTI = [];
  const ptsEnf = [];
  const ptsTemp = [];
  const ptsRiemann = [];
  const ptsMedidos = new Array(N_TOTAL + 1).fill(null);

  for (let i = 0; i <= N_TOTAL; i++) {
    const t = i * hTotal;
    const pTI = evaluarPTI(t);
    const pEnf = evaluarPEnf(t);
    const pTotal = pTI + pEnf;
    const temp = evaluarTemp(t);

    labels.push(t.toFixed(3));
    ptsCompleto.push(pTotal);

    const enRango = t >= a - 1e-9 && t <= b + 1e-9;

    if (esModoDatos && typeof interpolarLinealDatos === 'function') {
      // En modo datos, las áreas sombreadas principales siguen las series medidas interpoladas
      const pTIData = interpolarLinealDatos(telemetria.map((d) => ({ t: d.t, p: d.pTI })), t);
      const pEnfData = interpolarLinealDatos(telemetria.map((d) => ({ t: d.t, p: d.pEnf })), t);
      const tData = interpolarLinealDatos(telemetria.map((d) => ({ t: d.t, p: d.temp })), t);
      ptsTotal.push(enRango ? pTIData + pEnfData : null);
      ptsTI.push(enRango ? pTIData : null);
      ptsEnf.push(enRango ? pEnfData : null);
      ptsTemp.push(enRango ? tData : null);
    } else {
      ptsTotal.push(enRango ? pTotal : null);
      ptsTI.push(enRango ? pTI : null);
      ptsEnf.push(enRango ? pEnf : null);
      ptsTemp.push(enRango ? temp : null);
    }

    ptsRiemann.push(null);
  }

  // Mapear puntos discretos de telemetría (P_total medida) sobre el eje de tiempo
  if (Array.isArray(telemetria) && telemetria.length > 0) {
    for (const pt of telemetria) {
      const idx = Math.min(N_TOTAL, Math.max(0, Math.round(pt.t / hTotal)));
      ptsMedidos[idx] = pt.pTotal !== undefined ? pt.pTotal : pt.p;
    }
  }

  // 2. Mapeo de rectángulos de Riemann según el modo seleccionado (en modo analítico)
  if (!esModoDatos && modoRiemann !== 'off') {
    const nVisibles = Math.min(n, 150);
    const hSub = (b - a) / nVisibles;

    for (let i = 0; i < nVisibles; i++) {
      let tMuestreo;
      if (modoRiemann === 'izq') {
        tMuestreo = a + i * hSub;
      } else if (modoRiemann === 'der') {
        tMuestreo = a + (i + 1) * hSub;
      } else {
        tMuestreo = a + (i + 0.5) * hSub;
      }

      const alturaRectangulo = evaluarPTotal(tMuestreo);
      const tInicio = a + i * hSub;
      const tFin = tInicio + hSub;

      const idxInicio = Math.max(0, Math.round(tInicio / hTotal));
      const idxFin = Math.min(N_TOTAL, Math.round(tFin / hTotal));

      for (let j = idxInicio; j < idxFin; j++) {
        ptsRiemann[j] = alturaRectangulo;
      }
    }
  }

  // Alternar relleno (área sombreada) en las curvas según mostrarArea
  const modoFill = mostrarArea ? 'origin' : false;
  chart2D.data.datasets[1].fill = modoFill;
  chart2D.data.datasets[2].fill = modoFill;
  chart2D.data.datasets[3].fill = modoFill;
  chart2D.data.datasets[4].fill = modoFill;
  chart2D.data.datasets[7].fill = modoFill;
  chart2D.data.datasets[8].fill = modoFill;

  // Curvas de Falla y Solución en [t1, t2] (Fase 3)
  const ptsFalla = new Array(N_TOTAL + 1).fill(null);
  const ptsSolucion = new Array(N_TOTAL + 1).fill(null);
  const cfgFalla = datos.fallaConfig;
  if (cfgFalla && cfgFalla.tipo !== 'ninguna' && cfgFalla.t1 < cfgFalla.t2) {
    for (let i = 0; i <= N_TOTAL; i++) {
      const t = i * hTotal;
      if (t >= cfgFalla.t1 - 1e-9 && t <= cfgFalla.t2 + 1e-9) {
        if (typeof evaluarConFalla === 'function') {
          ptsFalla[i] = evaluarConFalla(t, cfgFalla).pTotal;
        }
        if (cfgFalla.aplicarSolucion && typeof evaluarConSolucion === 'function') {
          ptsSolucion[i] = evaluarConSolucion(t, cfgFalla).pTotal;
        }
      }
    }
  }

  // Estilo visual de puntos de telemetría
  chart2D.data.datasets[6].showLine = esModoDatos;

  // 3. Asignación a los datasets de Chart.js
  chart2D.data.labels = labels;
  chart2D.data.datasets[0].data = ptsCompleto;
  chart2D.data.datasets[1].data = ptsTotal;
  chart2D.data.datasets[2].data = ptsTI;
  chart2D.data.datasets[3].data = ptsEnf;
  chart2D.data.datasets[4].data = ptsTemp;
  chart2D.data.datasets[5].data = ptsRiemann;
  chart2D.data.datasets[6].data = ptsMedidos;
  chart2D.data.datasets[7].data = ptsFalla;
  chart2D.data.datasets[8].data = ptsSolucion;

  // 4. Actualización de las líneas de anotación a y b
  const annotations = chart2D.options.plugins.annotation.annotations;
  if (annotations) {
    annotations.lineA.value = a.toFixed(3);
    annotations.lineA.label.content = `a = ${a}h`;
    annotations.lineB.value = b.toFixed(3);
    annotations.lineB.label.content = `b = ${b}h`;
  }

  chart2D.update('active');
}

// ==============================================================================
// 4. ACCIONES DE CONTROL DE INTERFAZ 2D
// ==============================================================================

/**
 * Modifica la estrategia de partición de Riemann y actualiza los botones de la UI.
 * @param {string} modo - 'izq' | 'der' | 'med' | 'off'
 */
function setModoRiemann(modo) {
  modoRiemann = modo;
  const botones = ['izq', 'der', 'med', 'off'];
  botones.forEach((m) => {
    const btn = document.getElementById(`btn-modo-${m}`);
    if (!btn) return;
    const esUltimo = m === 'off';
    if (m === modo) {
      btn.className = `modo-riemann px-3 py-1.5 bg-sky-500/25 text-sky-400 font-semibold ${
        !esUltimo ? 'border-r border-white/10' : ''
      } transition-colors`;
    } else {
      btn.className = `modo-riemann px-3 py-1.5 bg-white/5 text-gray-400 ${
        !esUltimo ? 'border-r border-white/10' : ''
      } hover:bg-white/10 transition-colors`;
    }
  });

  if (ultimosDatos2D) {
    actualizarGrafico(ultimosDatos2D);
  }
}

/**
 * Alterna la visibilidad del área sombreada bajo la curva.
 */
function toggleArea() {
  mostrarArea = !mostrarArea;
  const btn = document.getElementById('btn-toggle-area');
  if (btn) {
    btn.textContent = mostrarArea ? '🟩 Área ON' : '⬛ Área OFF';
    btn.classList.toggle('text-energy-400', mostrarArea);
    btn.classList.toggle('text-gray-500', !mostrarArea);
  }
  if (ultimosDatos2D) {
    actualizarGrafico(ultimosDatos2D);
  }
}

// ==============================================================================
// 5. ESCUCHA DE EVENTOS DEL MOTOR MATEMÁTICO
// ==============================================================================

window.addEventListener('datosListos', (evento) => {
  actualizarGrafico(evento.detail);
});
