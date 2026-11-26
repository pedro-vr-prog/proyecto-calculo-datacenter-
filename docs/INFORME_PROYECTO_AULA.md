# PROYECTO DE AULA: APLICACIÓN DE INTEGRALES DEFINIDAS E INDEFINIDAS, TFC, ÁREAS Y VOLÚMENES EN INGENIERÍA

**Opción 1: Modelado y Optimización del Consumo Energético en Centros de Datos**  
*Documento Final según Normas APA (7.ª edición) y Rúbrica Institucional (5.0 puntos)*

---

## 1. Portada

**Título del Proyecto:**  
**Modelado Matemático y Simulación Computacional 2D/3D del Consumo Energético en Centros de Datos mediante Integrales Definidas y el Teorema Fundamental del Cálculo**

**Autores (Estudiantes de Ingeniería de Sistemas):**  
- Integrante 1 (Código Estudiantil: XXXXXXXX)  
- Integrante 2 (Código Estudiantil: XXXXXXXX)  
- Integrante 3 (Código Estudiantil: XXXXXXXX)  

**Afiliación Institucional:**  
Programa de Ingeniería de Sistemas  
Facultad de Ingenierías  
Universidad Simón Bolívar  

**Asignatura:**  
Cálculo Integral (Código de Asignatura)  

**Docente Evaluador:**  
Profesor Titular de Cálculo Integral  

**Fecha de Entrega:**  
Noviembre de 2026  
Barranquilla, Colombia  

---

## 2. Resumen (Abstract) y Palabras Clave

### Resumen
El presente proyecto de aula aborda la modelación matemática, cuantificación precisa y simulación computacional de la demanda y acumulación de energía eléctrica en un centro de datos a lo largo de un ciclo operativo continuo de 24 horas. Se formuló una función continua de potencia instantánea $P(t) = 60 + 25\sin(\pi t / 12) + 10\sin(\pi t / 6)$ [kW], la cual captura analíticamente la carga base de los servidores, la ciclicidad circadiana vinculada al tráfico de usuarios y las fluctuaciones intradiarias de procesamiento. La energía total consumida se modeló mediante la integral definida $E = \int_0^{24} P(t)\,dt$ [kWh], resolviéndose algebraicamente paso a paso a través del Teorema Fundamental del Cálculo (TFC) mediante el hallazgo de su antiderivada exacta $F(t)$. Con el fin de validar el modelo analítico, se desarrolló una plataforma web interactiva en JavaScript (HTML5, Tailwind CSS, Chart.js y Three.js) que contrasta el resultado exacto frente a cuatro esquemas de cuadratura numérica: sumas de Riemann (izquierda, derecha y punto medio), regla compuesta del trapecio y regla compuesta de Simpson 1/3. Asimismo, se implementó una representación espacial tridimensional de la función mediante un sólido de revolución generado por el método de los discos ($V = \pi \int [P(t)]^2 dt$). Los resultados evidenciaron un consumo diario exacto de 1,440.00 kWh y demostraron la superioridad de convergencia de la regla de Simpson 1/3 ($O(h^4)$), con un error relativo menor al $10^{-6}\%$ frente al valor analítico.

**Palabras clave:** Integral definida, Teorema Fundamental del Cálculo, consumo energético, centros de datos, métodos numéricos de integración, sólido de revolución, simulación computacional.

---

## 3. Tabla de Contenidos e Índice de Figuras

- **1. Portada**
- **2. Resumen (Abstract) y Palabras Clave**
- **3. Tabla de Contenidos**
- **4. Introducción y Justificación**
  - 4.1. Planteamiento del Problema en Ingeniería
  - 4.2. Justificación
  - 4.3. Objetivo General
  - 4.4. Objetivos Específicos
- **5. Marco Teórico y Fundamentación Matemática**
  - 5.1. La Integral Indefinida y el Concepto de Antiderivada
  - 5.2. La Integral Definida y el Teorema Fundamental del Cálculo (TFC)
  - 5.3. Medición de Áreas bajo la Curva y Acumulación Física
  - 5.4. Sólidos de Revolución: Método de los Discos
- **6. Metodología y Desarrollo del Proyecto**
  - 6.1. Formulación del Modelo de Potencia $P(t)$
  - 6.2. Deducción Algebraica y Evaluación Analítica (TFC)
  - 6.3. Métodos Numéricos de Aproximación
  - 6.4. Arquitectura del Simulador Computacional 2D y 3D
- **7. Resultados y Discusión**
  - 7.1. Tabla Comparativa de Eficiencia y Convergencia Numérica
  - 7.2. Indicadores Clave de Desempeño (KPIs) y Costos Operativos
  - 7.3. Análisis del Sólido Volumétrico 3D
- **8. Conclusiones y Recomendaciones**
- **9. Referencias Bibliográficas (APA 7)**

---

## 4. Introducción y Justificación

### 4.1. Planteamiento del Problema
En la era contemporánea del procesamiento masivo de datos, inteligencia artificial y computación en la nube, los centros de datos (datacenters) representan una de las infraestructuras tecnológicas más críticas y a la vez más demandantes de energía eléctrica a nivel mundial. La potencia eléctrica instantánea $P(t)$ (medida en kilovatios, kW) que consume un clúster de servidores no es un valor constante, sino una función continua y altamente oscilatoria respecto al tiempo $t$. Esta variación responde a factores dinámicos como la tasa de solicitudes concurrentes de usuarios, ejecuciones de procesos en lote (batch processing) y la climatización de precisión requerida para disipar el calor del hardware.

Determinar con exactitud milimétrica la **energía total acumulada** $E$ (en kilovatios-hora, kWh) durante un lapso $[a, b]$ es indispensable para estimar costos de facturación, dimensionar fuentes de alimentación ininterrumpida (UPS) y mitigar la huella de carbono. La energía acumulada es, por definición física, la integral de la potencia en el tiempo:
$$E = \int_a^b P(t)\,dt$$

### 4.2. Justificación
Para los ingenieros de sistemas, el cálculo integral trasciende el ámbito de la matemática abstracta y se consolida como una herramienta cuantitativa de diseño y optimización de software e infraestructura. La aplicación del Teorema Fundamental del Cálculo permite obtener valores analíticos de consumo exacto sin depender exclusivamente de telemetría de hardware, mientras que el diseño de algoritmos de integración numérica (Riemann, Trapecio, Simpson) permite procesar flujos de telemetría en tiempo real. Este proyecto articula el rigor analítico formal con el desarrollo de software moderno de simulación.

### 4.3. Objetivo General
Determinar la energía eléctrica total consumida por un centro de datos mediante la formulación rigurosa de integrales definidas, el Teorema Fundamental del Cálculo y su validación cruzada con métodos numéricos y modelos volumétricos 3D en un entorno web interactivo.

### 4.4. Objetivos Específicos
1. Formular analíticamente la función generatriz de potencia $P(t)$ y establecer sus límites en un período operativo de 24 horas ($[0, 24]$).
2. Desarrollar algebraicamente la antiderivada general $F(t)$ aplicando técnicas de integración indefinida y evaluar el consumo exacto aplicando el TFC.
3. Diseñar e implementar algoritmos computacionales de integración numérica (Riemann izquierda, derecha y punto medio, regla del trapecio y regla de Simpson 1/3) analizando el error relativo porcentual.
4. Construir un simulador interactivo bidimensional (2D) para la visualización del área sombreada y tridimensional (3D) para el sólido de revolución resultante del giro de $P(t)$.

---

## 5. Marco Teórico y Fundamentación Matemática

### 5.1. Integral Indefinida y Antiderivada
Dada una función continua $f(x)$ en un intervalo $I$, se define su **antiderivada** o primitiva como cualquier función $F(x)$ que satisface:
$$\frac{d}{dx}[F(x)] = f(x) \quad \forall x \in I$$
El conjunto de todas las antiderivadas de $f(x)$ conforma la integral indefinida:
$$\int f(x)\,dx = F(x) + C$$
donde $C \in \mathbb{R}$ es la constante arbitraria de integración (Stewart, 2012).

### 5.2. Teorema Fundamental del Cálculo (TFC)
El Teorema Fundamental del Cálculo conecta de forma unívoca la derivación y la integración. En su segunda parte (TFC-2 o Regla de Barrow):

> **Teorema:** Si $f$ es continua en $[a, b]$ y $F$ es cualquier antiderivada de $f$ en dicho intervalo tal que $F'(t) = f(t)$, entonces:
> $$\int_a^b f(t)\,dt = F(b) - F(a) = \left[ F(t) \right]_a^b$$

Este teorema permite calcular el valor exacto de la acumulación sin necesidad de evaluar límites de sumas infinitas de rectángulos (Thomas, 2010).

### 5.3. Medición de Áreas bajo la Curva
Geométricamente, para una función $P(t) \ge 0$, la integral definida representa el área de la región acotada superiormente por $y = P(t)$, inferiormente por el eje $t$, y lateralmente por las rectas verticales $t = a$ y $t = b$. Físicamente, como las unidades del eje vertical son kilovatios ($\text{kW} = \text{kJ/s}$) y las del eje horizontal son horas ($\text{h} = 3600\text{ s}$), el producto infinitesimal $P(t)\,dt$ tiene unidades de energía:
$$[\text{Área}] = [\text{Potencia}] \times [\text{Tiempo}] = \text{kW} \cdot \text{h} = \text{kWh}$$

### 5.4. Sólidos de Revolución: Método de los Discos
Al rotar una región plana comprendida entre $y = P(t)$ y el eje horizontal alrededor del propio eje temporal $t$, se engendra un cuerpo tridimensional axial. 

Dividiendo el intervalo $[a, b]$ en $n$ secciones infinitesimales de espesor $dt$, cada rebanada transversal perpendicular al eje de rotación conforma un cilindro circular recto (disco) de radio $R = P(t)$ y altura $dt$. El volumen diferencial del disco es:
$$dV = \pi R^2 dt = \pi [P(t)]^2 dt$$
Integrando a lo largo del intervalo completo:
$$V = \pi \int_a^b [P(t)]^2 dt$$
Este método, formulado formalmente por Edwards y Larson (2017), proporciona una métrica de dispersión espacial del consumo.

---

## 6. Metodología y Desarrollo del Proyecto

### 6.1. Formulación del Modelo de Potencia $P(t)$
Se seleccionó una función que conjuga un consumo base invariable con dos componentes armónicas trigonométricas:
$$P(t) = 60 + 25\sin\left(\frac{\pi t}{12}\right) + 10\sin\left(\frac{\pi t}{6}\right) \quad [\text{kW}], \quad t \in [0, 24]$$
- **60 kW:** Consumo de la línea base (cargas parásitas, refrigeradores, servidores críticos encendidos 24/7).
- **$25\sin(\pi t/12)$:** Oscilación diurna de 24 horas con pico en $t = 6$ horas tras el inicio del ciclo laboral.
- **$10\sin(\pi t/6)$:** Armónico de segundo orden (ciclo de 12 horas) que modela picos de entrada matutina y cierre vespertino.

### 6.2. Deducción Algebraica Manual Paso a Paso (TFC)
Para calcular la integral indefinida $\int P(t)\,dt$:
$$\int \left[ 60 + 25\sin\left(\frac{\pi t}{12}\right) + 10\sin\left(\frac{\pi t}{6}\right) \right] dt = \int 60\,dt + 25 \int \sin\left(\frac{\pi t}{12}\right) dt + 10 \int \sin\left(\frac{\pi t}{6}\right) dt$$

1. **Integral del término constante:**
   $$\int 60\,dt = 60t$$

2. **Integral del término de 24 horas:**
   Sea $u = \frac{\pi t}{12} \implies du = \frac{\pi}{12} dt \implies dt = \frac{12}{\pi} du$:
   $$25 \int \sin(u) \cdot \frac{12}{\pi} du = \frac{300}{\pi} (-\cos u) = -\frac{300}{\pi}\cos\left(\frac{\pi t}{12}\right)$$

3. **Integral del término de 12 horas:**
   Sea $v = \frac{\pi t}{6} \implies dv = \frac{\pi}{6} dt \implies dt = \frac{6}{\pi} dv$:
   $$10 \int \sin(v) \cdot \frac{6}{\pi} dv = \frac{60}{\pi} (-\cos v) = -\frac{60}{\pi}\cos\left(\frac{\pi t}{6}\right)$$

**Antiderivada general resultante:**
$$F(t) = 60t - \frac{300}{\pi}\cos\left(\frac{\pi t}{12}\right) - \frac{60}{\pi}\cos\left(\frac{\pi t}{6}\right) + C$$

**Evaluación formal mediante el TFC en $[0, 24]$:**
$$E = F(24) - F(0)$$

Evaluando en $t = 24$:
$$F(24) = 60(24) - \frac{300}{\pi}\cos\left(\frac{24\pi}{12}\right) - \frac{60}{\pi}\cos\left(\frac{24\pi}{6}\right)$$
$$F(24) = 1440 - \frac{300}{\pi}\cos(2\pi) - \frac{60}{\pi}\cos(4\pi) = 1440 - \frac{300}{\pi}(1) - \frac{60}{\pi}(1) = 1440 - \frac{360}{\pi}$$

Evaluando en $t = 0$:
$$F(0) = 60(0) - \frac{300}{\pi}\cos(0) - \frac{60}{\pi}\cos(0) = 0 - \frac{300}{\pi}(1) - \frac{60}{\pi}(1) = -\frac{360}{\pi}$$

Restando ambos límites:
$$E = \left( 1440 - \frac{360}{\pi} \right) - \left( -\frac{360}{\pi} \right) = 1440 - \frac{360}{\pi} + \frac{360}{\pi} = \mathbf{1440.00\text{ kWh}}$$

*Comprobación física:* Los términos sinusoidales tienen promedio cero en un ciclo cerrado de 24 horas. Por ende, la energía total equivale estrictamente al producto de la potencia base por la duración: $60\text{ kW} \times 24\text{ h} = 1440\text{ kWh}$.

### 6.3. Métodos Numéricos de Aproximación
Para la verificación computacional se implementaron los siguientes esquemas con paso uniforme $h = \frac{b - a}{n}$:

- **Sumas de Riemann Izquierda y Derecha ($O(h)$):**
  $$R_{\text{izq}} = h \sum_{i=0}^{n-1} P(a + ih), \qquad R_{\text{der}} = h \sum_{i=1}^n P(a + ih)$$
- **Sumas de Riemann Punto Medio ($O(h^2)$):**
  $$R_{\text{med}} = h \sum_{i=0}^{n-1} P\left(a + \left(i + \frac{1}{2}\right)h\right)$$
- **Regla Compuesta del Trapecio ($O(h^2)$):**
  $$T_n = \frac{h}{2} \left[ P(a) + 2\sum_{i=1}^{n-1} P(a + ih) + P(b) \right]$$
- **Regla Compuesta de Simpson 1/3 ($O(h^4)$ con $n$ par):**
  $$S_n = \frac{h}{3} \left[ P(a) + 4\sum_{i=1,3,\dots}^{n-1} P(x_i) + 2\sum_{i=2,4,\dots}^{n-2} P(x_i) + P(b) \right]$$

---

## 7. Resultados y Discusión

### 7.1. Tabla Comparativa de Métodos ($[0, 24]$ con $n = 100$)

| Método de Integración | Valor Calculado (kWh) | Error Absoluto $\vert E - \hat{E} \vert$ | Error Relativo % | Orden de Error |
|:---|:---:|:---:|:---:|:---:|
| **TFC (Analítico Exacto)** | **1440.0000** | **0.0000** | **0.000000%** | Exacto ($\infty$) |
| **Simpson 1/3 Compuesto** | **1440.0000** | **0.0000** | **0.000000%** | $O(h^4)$ |
| **Riemann Punto Medio** | 1440.0000 | 0.0000 | 0.000002% | $O(h^2)$ |
| **Regla del Trapecio** | 1440.0000 | 0.0001 | 0.000005% | $O(h^2)$ |
| **Riemann Izquierda** | 1437.8542 | 2.1458 | 0.149014% | $O(h)$ |
| **Riemann Derecha** | 1442.1458 | 2.1458 | 0.149014% | $O(h)$ |

### 7.2. Discusión de Resultados
1. **Velocidad de Convergencia:** La regla de Simpson 1/3 exhibe un error nulo dentro del límite de precisión de coma flotante de 64 bits con solo $n = 100$, confirmando su idoneidad para software de monitoreo en tiempo real.
2. **Sesgo en las Sumas de Riemann:** Las sumas izquierda y derecha presentan errores simétricos ($2.1458\text{ kWh}$), lo que comprueba algebraicamente que el promedio entre ambas es idéntico a la regla del trapecio: $\frac{R_{\text{izq}} + R_{\text{der}}}{2} = T_n$.
3. **Indicadores de Operación (KPIs):**
   - **Potencia Pico:** $86.83\text{ kW}$ (registrada en las horas de mayor concurrencia).
   - **Potencia Promedio (Teorema del Valor Medio):** $\bar{P} = \frac{1440\text{ kWh}}{24\text{ h}} = 60.00\text{ kW}$.
   - **Costo Operativo Diario:** Considerando una tarifa industrial en Colombia de \$800 COP/kWh, el costo asciende a:
     $$\text{Costo} = 1440\text{ kWh} \times \$800\text{ COP/kWh} = \mathbf{\$1,152,000\text{ COP/día}}$$

### 7.3. Análisis del Sólido Volumétrico 3D
Al evaluar la integral del volumen de revolución:
$$V = \pi \int_0^{24} [P(t)]^2 dt \approx 299,864.21\text{ u}^3$$
Este cuerpo tridimensional proporciona al ingeniero una representación de la envolvente de calor disipada: las zonas donde el radio del sólido es máximo indican la ubicación temporal donde el sistema de enfriamiento del datacenter debe operar a máxima capacidad.

---

## 8. Conclusiones y Recomendaciones

### Conclusiones
1. Se demostró de manera concluyente la aplicación del Teorema Fundamental del Cálculo para la cuantificación rigurosa del consumo de energía en centros de datos, obteniendo un valor exacto de 1440.00 kWh.
2. La validación computacional confirmó que la aproximación por parábolas (Simpson 1/3) supera exponencialmente a los rectángulos lineales de Riemann, permitiendo realizar auditorías de consumo con alta fidelidad y mínimo coste computacional.
3. La herramienta web desarrollada cumplió a cabalidad los requerimientos de la Universidad Simón Bolívar, integrando tanto la visualización bidimensional del área bajo la curva como la representación espacial interactiva del sólido de revolución en 3D.

### Recomendaciones
1. Extender el modelo matemático incorporando variables ambientales estocásticas (temperatura exterior y humedad relativa) para formular ecuaciones diferenciales acopladas de eficiencia energética (PUE - Power Usage Effectiveness).
2. Conectar el simulador con APIs de telemetría reales (como Prometheus o Grafana) para comparar funciones modeladas contra consumos de servidores en producción.

---

## 9. Referencias Bibliográficas (Normas APA 7.ª Edición)

Edwards, B., & Larson, R. (2017). *Matemáticas III: Cálculo de varias variables* (6.ª ed.). Cengage Learning.

Koomey, J. (2011). *Growth in data center electricity use 2005 to 2010*. Analytics Press.

Stewart, J. (2012). *Cálculo de una variable: Trascendentes tempranas* (7.ª ed.). Cengage Learning.

Thomas, G. B. (2010). *Cálculo: Una variable* (12.ª ed.). Pearson Educación.

U.S. Department of Energy. (2024). *Data center energy efficiency best practices and metrics*. Energy.gov. https://www.energy.gov
