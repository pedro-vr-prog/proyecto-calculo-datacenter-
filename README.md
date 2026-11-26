# ⚡ Modelado y Optimización del Consumo Energético en Centros de Datos
### Proyecto de Aula: Cálculo Integral — Universidad Simón Bolívar (2026)

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/es/docs/Web/HTML)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![math.js](https://img.shields.io/badge/Math.js-2E7D32?style=for-the-badge&logo=math&logoColor=white)](https://mathjs.org/)
[![KaTeX](https://img.shields.io/badge/KaTeX-005B94?style=for-the-badge&logo=KaTeX&logoColor=white)](https://katex.org/)

---

## 📌 Descripción General

Este proyecto de aula corresponde a la **Opción 1: Modelado y Optimización del Consumo Energético en Centros de Datos** del programa de **Ingeniería de Sistemas** de la **Universidad Simón Bolívar**. 

La aplicación modela analíticamente la potencia eléctrica instantánea $P(t)$ (en kilovatios) de un centro de datos a lo largo de un ciclo operativo de 24 horas y calcula con rigor matemático la **energía acumulada** $E$ (en kilovatios-hora) mediante el **Teorema Fundamental del Cálculo (TFC)**:

$$E = \int_a^b P(t)\,dt \quad \text{[kWh]}$$

Además, integra validación computacional cruzada frente a **métodos numéricos de aproximación** y un **entorno tridimensional interactivo (3D)** que genera el **sólido de revolución** correspondiente por el método de los discos ($V = \pi \int_a^b [P(t)]^2 dt$).

---

## 🚀 Características Principales

1. **Rigor Matemático Analítico (TFC):**
   - Deducción paso a paso de la antiderivada exacta $F(t)$.
   - Evaluación en límites personalizables $[a, b]$.
   - Modelo base con balance circadiano perfecto: $1,440.00\text{ kWh}$ en 24 horas.

2. **Validación Numérica con 5 Métodos de Integración:**
   - Suma de Riemann con Extremo Izquierdo ($O(h)$).
   - Suma de Riemann con Extremo Derecho ($O(h)$).
   - Suma de Riemann con Punto Medio ($O(h^2)$).
   - Regla Compuesta del Trapecio ($O(h^2)$).
   - Regla Compuesta de Simpson 1/3 ($O(h^4)$).
   - Tabla interactiva con cálculo en tiempo real de **error absoluto** y **error relativo porcentual**.

3. **Simulador Gráfico Bidimensional (2D con Chart.js):**
   - Curva continua de potencia $P(t)$.
   - Sombreado dinámico del área bajo la curva que representa la integral definida.
   - Particiones discretas de rectángulos de Riemann (Izquierda, Derecha, Punto Medio u Off).
   - Marcadores visuales de los límites $a$ y $b$ con anotaciones automáticas.

4. **Simulador Tridimensional Interactivo (3D con Three.js):**
   - Construcción del sólido de revolución por el método de discos rotando $P(t)$ sobre el eje de tiempo.
   - Malla sólida con propiedades de iluminación PBR y malla superpuesta (Wireframe) para apreciar la discretización.
   - Control de ángulo de revolución (barrido de $30^\circ$ a $360^\circ$).
   - Rotación continua automatizada y controles orbitales de cámara (zoom, paneo y rotación libre).
   - Indicador volumétrico calculado: $V = \pi \int_a^b [P(t)]^2 dt$.

5. **Panel de Control Flexible:**
   - Parser matemático seguro con `math.js` (soporta funciones trigonométricas, constantes $\pi, e$, polinomios y raíces).
   - Presets configurados (Bicircadiana, Circadiana Simple, Alta Carga, Polinomial).
   - Sliders interactivos sincronizados con inputs numéricos.
   - Indicadores de rendimiento (KPIs): Potencia pico, Potencia promedio (Teorema del Valor Medio Integral) y Costo estimado en pesos colombianos ($COP).

6. **Estándares Académicos Rigurosos:**
   - Estructurado al 100% bajo la rúbrica institucional (5.0 puntos).
   - Documento final formateado según normas **APA 7.ª edición** con sangría francesa de 1.27 cm.

---

## 📂 Estructura del Repositorio

El proyecto se encuentra totalmente modularizado y listo para ser alojado en cualquier servidor o en **GitHub Pages**:

```plaintext
proyecto-calculo/
│
├── index.html                      # Estructura principal y maquetación semántica
├── README.md                       # Documentación principal del repositorio (este archivo)
├── .gitignore                      # Exclusiones de archivos del sistema y temporales
│
├── css/
│   └── styles.css                  # Estilos personalizados, efectos glow, scrollbar y APA 7
│
├── js/
│   ├── math-engine.js              # Parser math.js, integrales analíticas, TFC y métodos numéricos
│   ├── chart-2d.js                 # Renderizado bidimensional continuo y rectángulos de Riemann
│   ├── three-3d.js                 # Visualización 3D del sólido de revolución con Three.js
│   └── main.js                     # Controlador principal de UI, sliders, KPIs y eventos
│
└── docs/
    ├── INFORME_PROYECTO_AULA.md    # Informe formal completo con normas APA 7.ª edición
    └── GUIA_SUSTENTACION.md        # Guión de exposición oral de 15 min y banco de preguntas
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Justificación Técnica |
|---|---|---|
| **Estructura** | HTML5 Semántico | Accesibilidad, SEO y arquitectura modular por secciones APA 7. |
| **Estilos** | Tailwind CSS (CDN) + CSS3 | Diseño responsivo moderno, paleta de modo oscuro y microinteracciones. |
| **Matemática Simbólica** | Math.js | Parser seguro en entorno aislado (sin uso de `eval()`), evaluador numérico de alto rendimiento. |
| **Notación Matemática** | KaTeX | Renderizado ultra rápido de ecuaciones en formato tipográfico $\LaTeX$. |
| **Visualización 2D** | Chart.js v4 + Annotation Plugin | Gráficos mixtos (Line + Bar), curvas de Bézier suaves y sombreado de integrales. |
| **Visualización 3D** | Three.js (r128) + OrbitControls | Renderizado WebGL acelerado por hardware para sólidos de revolución volumétricos. |

---

## 📐 Fundamentación Matemática

### 1. Función Generatriz de Potencia
$$P(t) = 60 + 25\sin\left(\frac{\pi t}{12}\right) + 10\sin\left(\frac{\pi t}{6}\right) \quad [\text{kW}], \quad t \in [0, 24]$$

### 2. Antiderivada General
$$F(t) = \int P(t)\,dt = 60t - \frac{300}{\pi}\cos\left(\frac{\pi t}{12}\right) - \frac{60}{\pi}\cos\left(\frac{\pi t}{6}\right) + C$$

### 3. Evaluación Exacta (TFC) en $[0, 24]$
$$E = F(24) - F(0) = \left(1440 - \frac{360}{\pi}\right) - \left(-\frac{360}{\pi}\right) = \mathbf{1440.00\text{ kWh}}$$

### 4. Sólido de Revolución (Método de los Discos)
$$V = \pi \int_a^b [P(t)]^2 dt \quad [\text{u}^3]$$

### 5. Potencia Promedio (Teorema del Valor Medio Integral)
$$\bar{P} = \frac{1}{b - a} \int_a^b P(t)\,dt = \frac{1440\text{ kWh}}{24\text{ h}} = \mathbf{60.00\text{ kW}}$$

---

## 💻 ¿Cómo Ejecutar el Proyecto?

No requiere instalar entornos complejos (Node.js, Webpack, etc.) ya que todas las dependencias cargan de forma asíncrona mediante CDNs optimizados:

### Opción 1: Apertura Directa en Navegador
1. Clona o descarga este repositorio:
   ```bash
   git clone https://github.com/tu-usuario/proyecto-calculo-datacenter.git
   ```
2. Entra a la carpeta del proyecto:
   ```bash
   cd proyecto-calculo-datacenter
   ```
3. Haz doble clic sobre el archivo `index.html` (o haz clic derecho y selecciona *Abrir con Google Chrome / Microsoft Edge / Firefox*).

### Opción 2: Con Live Server (VS Code)
1. Abre la carpeta del proyecto en **Visual Studio Code**.
2. Con la extensión **Live Server** instalada, haz clic derecho sobre `index.html` y selecciona **Open with Live Server**.
3. Se abrirá automáticamente en `http://127.0.0.1:5500`.

### Opción 3: Despliegue en GitHub Pages
1. Sube el proyecto a tu repositorio de GitHub.
2. Ve a **Settings** -> **Pages**.
3. En **Source**, selecciona la rama `main` y la carpeta `/ (root)`.
4. ¡Tu proyecto quedará publicado en la web en cuestión de segundos!

---

## 👥 Equipo de Trabajo

Proyecto realizado por estudiantes de **Ingeniería de Sistemas** de la **Universidad Simón Bolívar**:
- **Estudiante 1** — Modelado Analítico y Antiderivadas
- **Estudiante 2** — Algoritmos Numéricos de Integración y Chart.js
- **Estudiante 3** — Modelado Tridimensional WebGL con Three.js y UI/UX

---

## 📄 Licencia y Uso Académico

Este proyecto fue desarrollado exclusivamente con fines pedagógicos y académicos para la asignatura de **Cálculo Integral**. Todos los contenidos teóricos y algoritmos pueden ser utilizados y adaptados citando debidamente la fuente según normas APA 7.
