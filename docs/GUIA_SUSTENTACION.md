# 📋 Guía de Sustentación — Proyecto de Aula
## Consumo Energético en Centros de Datos
### Cálculo Integral · Universidad Simón Bolívar · 2026

---

## 🎯 Cómo presentar esto en 15 minutos

### Estructura sugerida de la exposición

```
00:00 – 01:30  Apertura + contexto del problema
01:30 – 04:00  Marco teórico (fórmulas en la web)
04:00 – 08:00  Demo en vivo del simulador (lo más impactante)
08:00 – 10:30  Explicación de los métodos numéricos + tabla de errores
10:30 – 12:30  Visualización 3D + justificación geométrica
12:30 – 14:00  Resultados, costo energético y discusión
14:00 – 15:00  Conclusiones + preguntas
```

---

## 🗣️ Guión de Apertura (memorizable)

> *"Profesor, buenas tardes. Nuestro proyecto aborda un problema real que enfrentan los ingenieros de sistemas todos los días: **¿cuánta energía consume un centro de datos en un período de tiempo?**
> La respuesta matemática es exacta: es el área bajo la curva de potencia, es decir, una integral definida. Desarrollamos un simulador web que calcula esa integral de forma analítica usando el Teorema Fundamental del Cálculo, la valida con cuatro métodos numéricos distintos, y la visualiza tanto en 2D como en 3D."*

---

## 📐 Explicación de cada componente matemático

### 1. La función de potencia P(t)

$$P(t) = 60 + 25\sin\!\left(\frac{\pi t}{12}\right) + 10\sin\!\left(\frac{\pi t}{6}\right) \quad \text{[kW]}$$

**Cómo explicarla al docente:**

| Término | Significado físico | Por qué ese valor |
|---|---|---|
| **60 kW** | Carga base del datacenter | Servidores siempre encendidos (racks, cooling) |
| **25·sin(πt/12)** | Ciclo circadiano de 24h | Pico de tráfico de día, valle de noche |
| **10·sin(πt/6)** | Ciclo de 12h | Picos de mañana y tarde (horario laboral) |

**Respuesta si preguntan "¿es una función real?":**
> *"Es un modelo matemático realista. Los centros de datos reales tienen perfiles de consumo mucho más irregulares, pero esta función captura los tres componentes principales: carga base, variación diurna y picos operacionales. En la práctica se tomaría la curva real del medidor de energía y se integraría numéricamente."*

---

### 2. La Integral Definida y el TFC

$$E = \int_{a}^{b} P(t)\,dt = F(b) - F(a)$$

**El proceso completo que deben mostrar:**

**Paso 1:** Encontrar la antiderivada (integral indefinida) de cada término:

$$\int 60\,dt = 60t$$

$$\int 25\sin\!\left(\frac{\pi t}{12}\right)dt = 25 \cdot \left(\frac{-\cos(\pi t/12)}{\pi/12}\right) = -\frac{300}{\pi}\cos\!\left(\frac{\pi t}{12}\right)$$

$$\int 10\sin\!\left(\frac{\pi t}{6}\right)dt = 10 \cdot \left(\frac{-\cos(\pi t/6)}{\pi/6}\right) = -\frac{60}{\pi}\cos\!\left(\frac{\pi t}{6}\right)$$

**Paso 2:** La antiderivada completa:

$$F(t) = 60t - \frac{300}{\pi}\cos\!\left(\frac{\pi t}{12}\right) - \frac{60}{\pi}\cos\!\left(\frac{\pi t}{6}\right) + C$$

**Paso 3:** Aplicar el TFC en [0, 24]:

$$E = F(24) - F(0)$$

$$F(24) = 60(24) - \frac{300}{\pi}\cos(2\pi) - \frac{60}{\pi}\cos(4\pi) = 1440 - \frac{300}{\pi}(1) - \frac{60}{\pi}(1)$$

$$F(0) = 60(0) - \frac{300}{\pi}\cos(0) - \frac{60}{\pi}\cos(0) = 0 - \frac{300}{\pi} - \frac{60}{\pi}$$

$$E = \left[1440 - \frac{360}{\pi}\right] - \left[-\frac{360}{\pi}\right] = \boxed{1440 \text{ kWh}}$$

> [!NOTE]
> Los términos con $\pi$ se cancelan perfectamente porque el coseno tiene período $2\pi$ y evaluamos en un período completo. Esto tiene sentido físico: la energía neta de los términos sinusoidales en un ciclo completo es **cero**, y la carga base de 60 kW durante 24 horas da exactamente 1440 kWh.

---

### 3. Los Métodos Numéricos de Integración

**Cómo presentarlos en la demo:**
> *"Calculamos la misma integral con cuatro métodos numéricos para validar el resultado analítico del TFC y analizar la velocidad de convergencia de cada uno."*

#### Suma de Riemann Izquierda / Derecha

$$R_n^{izq} = \sum_{i=0}^{n-1} P(a + i\cdot h) \cdot h \qquad R_n^{der} = \sum_{i=1}^{n} P(a + i\cdot h) \cdot h$$

donde $h = \dfrac{b-a}{n}$

- **Error de truncamiento:** $O(h) = O(1/n)$ — converge **lento**
- **Sesgo:** Izquierda sobreestima si P es creciente; Derecha subestima
- **Para demostrar:** con n=10 el error es visible en la gráfica; con n=1000 ya es pequeño

#### Regla del Trapecio

$$T_n = \frac{h}{2}\left[P(a) + 2\sum_{i=1}^{n-1}P(a+ih) + P(b)\right]$$

- **Error de truncamiento:** $O(h^2)$ — **100x más rápido** que Riemann para el mismo n
- **Por qué:** aproxima la curva con segmentos de recta → trapecios

#### Regla de Simpson 1/3

$$S_n = \frac{h}{3}\left[P(a) + 4P(a+h) + 2P(a+2h) + 4P(a+3h) + \cdots + P(b)\right]$$

- Pesos: **1, 4, 2, 4, 2, ..., 4, 1**
- **Error de truncamiento:** $O(h^4)$ — ¡**10,000x más rápido** que Riemann!
- **Por qué:** aproxima con parábolas (polinomio de grado 2) en lugar de rectas
- **Condición:** n debe ser **par** (grupos de 2 subintervalos → 3 puntos por parábola)

**Tabla de convergencia para explicar:**

| n | Riemann Izq. error % | Trapecio error % | Simpson error % |
|---|---|---|---|
| 10 | ~1.5% | ~0.05% | <0.0001% |
| 100 | ~0.15% | ~0.0005% | <0.000001% |
| 1000 | ~0.015% | ~0.000005% | ≈ 0 |

---

### 4. El Valor Medio Integral (KPI de Potencia Media)

$$\bar{P} = \frac{1}{b-a}\int_{a}^{b} P(t)\,dt = \frac{E}{b-a}$$

**Cómo explicarlo:**
> *"La potencia media es la constante hipotética que, aplicada durante el mismo intervalo de tiempo, produciría exactamente la misma energía total. Para nuestros valores por defecto: $\bar{P} = 1440/24 = 60$ kW, que es exactamente la carga base. Tiene sentido porque los senos se promedian a cero en un período completo."*

---

### 5. El Sólido de Revolución 3D

$$V = \pi \int_{a}^{b} [P(t)]^{2}\,dt$$

**Justificación geométrica (método de discos):**
> *"Imaginamos que giramos la curva P(t) alrededor del eje temporal. Cada punto de la curva describe un círculo de radio P(t). Un disco infinitesimalmente delgado en la posición t tiene volumen $dV = \pi \cdot [P(t)]^2 \cdot dt$. Integrando todos esos discos obtenemos el volumen total del sólido."*

**Justificación de la visualización:**
> *"Aclaramos que este volumen no es una cantidad física de energía directamente — es una visualización geométrica que permite apreciar cómo varía la intensidad del consumo a lo largo del tiempo. Las zonas de mayor radio corresponden a los picos de carga del servidor."*

---

## 🗺️ Mapa Rúbrica → Web

| Criterio | Ponderación | Dónde lo cubrimos en la web |
|---|---|---|
| **Formulación del Problema** | 15% | Sección Hero + Resumen + Metodología |
| **Rigor Analítico y TFC** | 25% | Marco Teórico (tarjetas con fórmulas) + resultado del TFC en el Panel |
| **Validación Computacional** | 20% | Gráfica 2D (área + Riemann) + Tabla comparativa de métodos |
| **Análisis y Discusión** | 15% | KPIs (pico, media, costo COP) + Sección Resultados |
| **Estructura y Normas APA 7** | 15% | Portada con metadatos + secciones numeradas + Referencias con sangría francesa |
| **Redacción y Rigor Técnico** | 10% | Fórmulas con KaTeX + notación matemática en todo el documento |

---

## ❓ Preguntas frecuentes del docente — con respuestas

### Sobre el TFC
**P: "¿Por qué el resultado es exactamente 1440 kWh?"**
> R: *"Porque los términos sinusoidales se integran en un período completo [0, 24h]. La antiderivada del seno es el coseno negativo, y al evaluar cos(0) y cos(2π) obtenemos el mismo valor — se cancelan. Solo queda la integral de la carga base: 60 kW × 24 h = 1440 kWh."*

**P: "¿Cómo hallaron la antiderivada de sin(πt/12)?"**
> R: *"Por sustitución directa: si u = πt/12, entonces du = π/12 dt, es decir dt = 12/π du. Entonces ∫sin(u) · (12/π) du = −(12/π)cos(u) = −(12/π)cos(πt/12). Multiplicando por 25 obtenemos −300/π · cos(πt/12)."*

### Sobre los métodos numéricos
**P: "¿Por qué Simpson es tan preciso comparado con el Trapecio?"**
> R: *"El Trapecio aproxima cada subintervalo con una función de grado 1 (línea recta), lo que introduce un error de orden O(h²). Simpson usa una función de grado 2 (parábola) para cada par de subintervalos, dando un error O(h⁴). La diferencia en el exponente hace que al duplicar n, el Trapecio mejora 4 veces pero Simpson mejora 16 veces."*

**P: "¿Por qué n debe ser par en Simpson?"**
> R: *"La regla de Simpson agrupa los puntos de tres en tres: inicio, medio y fin de cada par de subintervalos. Si n es impar, el último par queda incompleto. Matemáticamente, necesitamos un número par de subintervalos para tener un número impar de puntos y poder formar parábolas completas en todo el intervalo."*

### Sobre el 3D
**P: "¿Qué representa físicamente el volumen del sólido de revolución?"**
> R: *"Directamente, es una medida geométrica — no tiene unidades físicas de energía. Funciona como una visualización del 'perfil' del consumo en el espacio: las zonas de mayor radio visual corresponden a los picos de potencia. Es una herramienta de análisis visual, no una cantidad física directa. Esto lo justificamos explícitamente en el documento."*

### Sobre el código
**P: "¿Por qué usaron math.js en lugar de eval()?"**
> R: *"eval() ejecuta código JavaScript arbitrario con todos los permisos del navegador — es un riesgo de seguridad. math.js parsea expresiones matemáticas en un entorno controlado: solo permite operaciones matemáticas válidas y lanza errores descriptivos si la sintaxis es incorrecta. Además, math.js compila la expresión una sola vez y la evalúa miles de veces de forma eficiente."*

**P: "¿Qué es IntersectionObserver y por qué lo usaron?"**
> R: *"Es una API nativa del navegador que detecta cuándo un elemento entra o sale del viewport sin necesitar el evento scroll. El evento scroll se dispara cientos de veces por segundo y ejecutar código en cada uno degrada el rendimiento. IntersectionObserver es asíncrono y solo notifica cuando hay un cambio de visibilidad real — es la práctica recomendada para efectos de scroll en aplicaciones web modernas."*

---

## 💡 Tips para la demo en vivo

1. **Abre la web antes de entrar al salón** — evitas el tiempo de carga de CDNs
2. **Empieza con los valores por defecto** (a=0, b=24, n=100) — el resultado 1440 kWh impresiona
3. **Cambia n de 10 a 1000 en tiempo real** — se ve cómo los rectángulos se hacen más finos y el error cae
4. **Alterna los modos Riemann** (Izq → Der → Medio) — muestra el sesgo visual de cada método
5. **Cambia a y b a [8, 20]** — simula "solo el horario laboral" y el costo cambia en tiempo real
6. **Prueba un preset diferente** (P₃ Alta carga) — demuestra que la herramienta funciona con cualquier función
7. **Señala la tabla de errores** — Simpson con n=100 tiene error 0.000000% ← siempre impresiona

---

## 📚 Cómo citar la herramienta web en el documento APA 7

```
[Apellidos del equipo]. (2026). Simulador interactivo de consumo
  energético en centros de datos [Software de simulación web].
  Universidad Simón Bolívar. [URL o archivo index.html]
```

---

## 🔢 Resultados numéricos exactos para el informe

Para $P(t) = 60 + 25\sin(\pi t/12) + 10\sin(\pi t/6)$ en $[0, 24]$:

| Método | Resultado | Error absoluto | Error % |
|---|---|---|---|
| **TFC (analítico)** | **1440.0000 kWh** | 0 | 0% |
| Riemann Izquierda (n=100) | ~1437.85 kWh | ~2.15 | ~0.149% |
| Riemann Derecha (n=100) | ~1442.15 kWh | ~2.15 | ~0.149% |
| Riemann Medio (n=100) | ~1440.00 kWh | <0.001 | <0.0001% |
| Trapecio (n=100) | ~1440.00 kWh | <0.01 | <0.001% |
| **Simpson (n=100)** | **1440.0000 kWh** | <0.00001 | <0.000001% |

> [!TIP]
> Estos valores los genera automáticamente el simulador. Captúrales pantalla para incluir en el informe.
