/**
 * ==============================================================================
 * PROYECTO DE AULA: CÁLCULO INTEGRAL - UNIVERSIDAD SIMÓN BOLÍVAR
 * ARCHIVO: js/three-3d.js
 * DESCRIPCIÓN: Módulo de Visualización Tridimensional (3D) con Three.js.
 * 
 * Fundamentación Matemática:
 * Implementación del Sólido de Revolución mediante el Método de los Discos.
 * Al rotar la curva continua y = P(t) alrededor del eje temporal t en el intervalo [a, b],
 * se genera un cuerpo tridimensional cuyo volumen se define como:
 * 
 * V = \pi \int_a^b [P(t)]^2 dt
 * 
 * Interpretación en Ingeniería:
 * Aunque físicamente el volumen resultante tiene dimensiones de [kW^2 * h] (o unidades
 * cúbicas u^3) y no de energía directa [kWh], sirve como una herramienta de
 * geometrización y análisis espacial: las secciones transversales más anchas
 * corresponden a los momentos de mayor esfuerzo y estrés térmico del centro de datos.
 * ==============================================================================
 */

// ==============================================================================
// 1. ESTADO GLOBAL DEL VISOR THREE.JS
// ==============================================================================

let scene3D = null;
let camera3D = null;
let renderer3D = null;
let controls3D = null;

let meshSolido = null;       // Malla de superficie sólida del cuerpo de revolución
let meshWireframe = null;    // Malla en alambre para visualizar las particiones
let ejeTemporal = null;      // Cilindro central representativo del eje de rotación

let autoRotar = true;        // Bandera de rotación automática
let verWireframe = true;     // Bandera de visibilidad del mallado de alambre
let anguloRevolucion = 360;  // Ángulo de barrido en grados (hasta 360°)

let ultimosDatos3D = null;   // Caché de puntos P(t) recibidos

// ==============================================================================
// 2. INICIALIZACIÓN DE LA ESCENA, CÁMARA Y RENDERER
// ==============================================================================

/**
 * Inicializa el contexto WebGL, luces y controles orbitales de Three.js.
 */
function inicializarThree3D() {
  const container = document.getElementById('container-3d');
  if (!container) return;

  // Limpiar el contenedor si tiene elementos previos (como el placeholder)
  const placeholder = document.getElementById('placeholder-3d');
  if (placeholder) placeholder.remove();

  const width = container.clientWidth;
  const height = container.clientHeight || 450;

  // 1. Escena con niebla atmosférica oscura acorde a la paleta
  scene3D = new THREE.Scene();
  scene3D.background = new THREE.Color(0x0e0e1a);
  scene3D.fog = new THREE.FogExp2(0x0e0e1a, 0.015);

  // 2. Cámara de perspectiva
  camera3D = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera3D.position.set(22, 14, 26);

  // 3. Renderer WebGL con antialiasing
  renderer3D = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer3D.setSize(width, height);
  renderer3D.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer3D.shadowMap.enabled = true;
  renderer3D.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer3D.domElement);

  // 4. Controles orbitales para navegación interactiva (mouse y táctil)
  controls3D = new THREE.OrbitControls(camera3D, renderer3D.domElement);
  controls3D.enableDamping = true;
  controls3D.dampingFactor = 0.05;
  controls3D.maxDistance = 80;
  controls3D.minDistance = 6;
  controls3D.target.set(0, 0, 0);

  // 5. Sistema de Iluminación
  // Luz ambiental para visibilidad básica
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
  scene3D.add(ambientLight);

  // Luz direccional principal con matiz verde esmeralda
  const dirLight1 = new THREE.DirectionalLight(0x34d399, 1.2);
  dirLight1.position.set(20, 30, 20);
  scene3D.add(dirLight1);

  // Luz direccional de contraste con matiz cian
  const dirLight2 = new THREE.DirectionalLight(0x06b6d4, 0.8);
  dirLight2.position.set(-20, -10, -20);
  scene3D.add(dirLight2);

  // Luz puntual central de acento
  const pointLight = new THREE.PointLight(0xa7f3d0, 1.5, 50);
  pointLight.position.set(0, 0, 0);
  scene3D.add(pointLight);

  // 6. Cuadrícula de referencia espacial en el plano base
  const gridHelper = new THREE.GridHelper(40, 20, 0x059669, 0x1e293b);
  gridHelper.position.y = -10;
  scene3D.add(gridHelper);

  // 7. Observador de redimensionamiento
  window.addEventListener('resize', onVentanaRedimensionada);

  // Iniciar bucle de animación
  animarEscena();
}

/**
 * Ajusta la perspectiva y tamaño del lienzo cuando cambia el viewport.
 */
function onVentanaRedimensionada() {
  const container = document.getElementById('container-3d');
  if (!container || !renderer3D || !camera3D) return;
  const w = container.clientWidth;
  const h = container.clientHeight || 450;
  camera3D.aspect = w / h;
  camera3D.updateProjectionMatrix();
  renderer3D.setSize(w, h);
}

// ==============================================================================
// 3. CONSTRUCCIÓN GEOMÉTRICA DEL SÓLIDO DE REVOLUCIÓN
// ==============================================================================

/**
 * Construye la geometría tridimensional rotando el perfil de potencia P(t).
 * Utiliza THREE.LatheGeometry para generar la rotación axial alrededor del eje Y.
 * 
 * @param {object} datos - Datos del motor matemático (a, b, evaluarEn, kpis)
 */
function generarSolidoRevolucion(datos) {
  if (!scene3D) return;
  ultimosDatos3D = datos;
  const { a, b, kpis } = datos;

  // 1. Remover geometrías previas para evitar fugas de memoria GPU
  if (meshSolido) {
    scene3D.remove(meshSolido);
    meshSolido.geometry.dispose();
    meshSolido.material.dispose();
    meshSolido = null;
  }
  if (meshWireframe) {
    scene3D.remove(meshWireframe);
    meshWireframe.geometry.dispose();
    meshWireframe.material.dispose();
    meshWireframe = null;
  }
  if (ejeTemporal) {
    scene3D.remove(ejeTemporal);
    ejeTemporal.geometry.dispose();
    ejeTemporal.material.dispose();
    ejeTemporal = null;
  }

  // 2. Muestreo del perfil generatriz 2D: Vector2(radio, altura)
  // El tiempo t se mapea a la altura Y (centrado en el origen).
  // La potencia P(t) se mapea al radio X de la sección transversal.
  const N_SEGMENTOS_ALTURA = 90;
  const puntosPerfil = [];

  // Factores de escalado para que el sólido luzca armónico en pantalla
  const escalaRadio = 0.09;    // Transforma kW (ej: 60 kW) a unidades Three.js (~5.4 unidades)
  const escalaAltura = 0.8;    // Ajusta la longitud total del intervalo [a, b]

  const centroTemporal = (a + b) / 2;
  const dt = (b - a) / N_SEGMENTOS_ALTURA;

  for (let i = 0; i <= N_SEGMENTOS_ALTURA; i++) {
    const t = a + i * dt;
    const potencia = evaluarEn(t);
    const radio = Math.max(0.15, potencia * escalaRadio);
    const alturaY = (t - centroTemporal) * escalaAltura;
    puntosPerfil.push(new THREE.Vector2(radio, alturaY));
  }

  // 3. Crear Geometría de Torno (LatheGeometry)
  // phiLength define el ángulo de rotación (2*pi para revolución completa)
  const phiRadianes = (anguloRevolucion / 360) * Math.PI * 2;
  const segmentosRadiales = 48; // Discretización circular de cada disco
  const latheGeometry = new THREE.LatheGeometry(
    puntosPerfil,
    segmentosRadiales,
    0,
    phiRadianes
  );

  // 4. Material de superficie sólida con propiedades físicas realistas
  const materialSolido = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    roughness: 0.3,
    metalness: 0.25,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide
  });

  meshSolido = new THREE.Mesh(latheGeometry, materialSolido);
  scene3D.add(meshSolido);

  // 5. Malla de estructura de alambre (Wireframe) superpuesta
  const materialWireframe = new THREE.MeshBasicMaterial({
    color: 0x6ee7b7,
    wireframe: true,
    transparent: true,
    opacity: verWireframe ? 0.28 : 0.0
  });

  meshWireframe = new THREE.Mesh(latheGeometry, materialWireframe);
  scene3D.add(meshWireframe);

  // 6. Eje de rotación temporal (representación del eje t como cilindro luminiscente)
  const longitudEje = (b - a) * escalaAltura + 4;
  const ejeGeo = new THREE.CylinderGeometry(0.08, 0.08, longitudEje, 16);
  const ejeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  ejeTemporal = new THREE.Mesh(ejeGeo, ejeMat);
  scene3D.add(ejeTemporal);

  // 7. Actualizar el indicador de volumen en la UI
  const volumenCalculado = kpis ? kpis.volumen3D : volumenSolidoRevolucion(a, b, 200);
  const kpiVolumen = document.getElementById('kpi-volumen-3d');
  if (kpiVolumen) {
    kpiVolumen.textContent = formatNum(volumenCalculado, 2) + ' u³';
  }
}

// ==============================================================================
// 4. BUCLE DE RENDERIZADO Y ANIMACIÓN
// ==============================================================================

/**
 * Función recursiva que ejecuta el ciclo de animación por cada cuadro (FPS).
 */
function animarEscena() {
  requestAnimationFrame(animarEscena);

  // Rotación suave del sólido si la bandera está activa
  if (autoRotar && meshSolido) {
    meshSolido.rotation.y += 0.006;
    if (meshWireframe) meshWireframe.rotation.y += 0.006;
  }

  // Actualizar amortiguación de la cámara interactiva
  if (controls3D) controls3D.update();

  if (renderer3D && scene3D && camera3D) {
    renderer3D.render(scene3D, camera3D);
  }
}

// ==============================================================================
// 5. CONTROLES DE INTERFAZ DEL MÓDULO 3D
// ==============================================================================

/**
 * Alterna el giro continuo del sólido sobre su eje.
 */
function toggleAutoRotar() {
  autoRotar = !autoRotar;
  const btn = document.getElementById('btn-3d-rotar');
  if (btn) {
    btn.textContent = autoRotar ? '⏸ Pausar Giro' : '▶ Reanudar Giro';
    btn.classList.toggle('text-energy-400', autoRotar);
  }
}

/**
 * Alterna la visibilidad de los discos y triángulos de la malla de alambre.
 */
function toggleWireframe() {
  verWireframe = !verWireframe;
  if (meshWireframe) {
    meshWireframe.material.opacity = verWireframe ? 0.28 : 0.0;
  }
  const btn = document.getElementById('btn-3d-wireframe');
  if (btn) {
    btn.textContent = verWireframe ? '🕸 Malla ON' : '🕸 Malla OFF';
    btn.classList.toggle('text-energy-400', verWireframe);
  }
}

/**
 * Modifica el ángulo de barrido de la revolución (simulación del giro de la curva).
 * @param {number} grados - Ángulo entre 30 y 360 grados
 */
function cambiarAnguloRevolucion(grados) {
  anguloRevolucion = parseFloat(grados);
  const label = document.getElementById('label-3d-angulo');
  if (label) label.textContent = `${anguloRevolucion}°`;
  if (ultimosDatos3D) {
    generarSolidoRevolucion(ultimosDatos3D);
  }
}

/**
 * Restaura la posición inicial de la cámara para centrar la perspectiva.
 */
function resetCamara3D() {
  if (camera3D && controls3D) {
    camera3D.position.set(22, 14, 26);
    controls3D.target.set(0, 0, 0);
    controls3D.update();
  }
}

// ==============================================================================
// 6. ESCUCHA DE EVENTOS DEL MOTOR MATEMÁTICO
// ==============================================================================

window.addEventListener('datosListos', (evento) => {
  if (!scene3D) {
    inicializarThree3D();
  }
  generarSolidoRevolucion(evento.detail);
});
