# S10-Interacciones-Scroll
Sesión 03 del Bloque 2. Diseño de Interacciones: Técnicas esenciales con Scroll.

**Bloque 2 · Sesión 03 · Diseño de Interacciones: scroll y gesto.**
Interacción y Renderizado Web Avanzado (CC325-21) · CENTRO · Jueves 29 de octubre de 2026.

La misma función `map()` de las sesiones del mouse ([S08](https://github.com/AndrewAlva/S08-Interacciones-Mouse) y [S09](https://github.com/AndrewAlva/S09-Practica-Mouse)), ahora con otro input: el scroll. Dos usos, un ejercicio para cada uno. Cada ejercicio trae una **demo** (un resultado posible, como referencia) y un **starter** (el punto de partida donde trabajas tú).

---

## Contenido

- [Antes de empezar](#antes-de-empezar)
- [Cómo usar el repositorio](#cómo-usar-el-repositorio)
- [Estructura](#estructura)
- [Overview de la clase](#overview-de-la-clase)
- [Si algo no funciona](#si-algo-no-funciona)
- [Referencias](#referencias)

---

## Antes de empezar

Necesitas:

- **Node.js 20.19 o más nuevo** (o 22.12+). Revisa tu versión con `node -v`. Lo pide Vite, la herramienta que corre cada ejercicio.
- **npm** (viene con Node).
- **Git** para clonar el repositorio. Si no lo tienes configurado, usa **Code → Download ZIP** en GitHub.
- Un editor: **VS Code** o **Cursor**.
- **Un mouse con rueda o un trackpad.** El ejercicio 02 se siente distinto con cada uno: si puedes, prueba con los dos.

---

## Cómo usar el repositorio

### 1 · Clona una sola vez

El repositorio ya tiene todos los ejercicios. Lo clonas una vez al inicio de la clase y no necesitas volver a actualizarlo.

```bash
git clone https://github.com/AndrewAlva/S10-Interacciones-Scroll
```

Abre la carpeta `S10-Interacciones-Scroll` en VS Code.

### 2 · Dos terminales: demo y starter

Cada ejercicio se trabaja con **dos terminales abiertas al mismo tiempo**: una corre la demo (tu referencia) y otra corre el starter (donde programas).

**Primer ejercicio.** Abre dos terminales nuevas en VS Code (*Terminal → New Terminal*); arrancan en la raíz del repositorio:

```bash
# Terminal 1 · Demo
cd 01-Map-Scroll/01-Demo
npm install
npm run dev        # → http://localhost:5173
```

```bash
# Terminal 2 · Starter
cd 01-Map-Scroll/02-Starter
npm install
npm run dev        # → http://localhost:5174
```

**Ejercicio 02.** Usa las mismas dos terminales. Detén el servidor anterior con `Ctrl + C` y entra a la carpeta nueva:

```bash
# Terminal 1 · Demo
cd ../../02-Scroll-Sin-Pagina/01-Demo
npm install
npm run dev
```

```bash
# Terminal 2 · Starter
cd ../../02-Scroll-Sin-Pagina/02-Starter
npm install
npm run dev
```

Cada `../` sube un nivel: el primero te saca de `01-Demo/` (o `02-Starter/`), el segundo de `01-Map-Scroll/`. Así quedas en la raíz y entras al siguiente.

> **Ojo con los puertos.** Si no detienes los servidores anteriores, Vite manda los nuevos a otro puerto (`:5175`, `:5176`…) y es fácil abrir la pestaña equivocada. Siempre `Ctrl + C` antes de cambiar de ejercicio.

---

## Estructura

```
S10-Interacciones-Scroll/
├── 01-Map-Scroll/
│   ├── 01-Demo/
│   └── 02-Starter/
├── 02-Scroll-Sin-Pagina/
│   ├── 01-Demo/
│   └── 02-Starter/
└── 03-A-Flote/          ← extra, para quien va adelante
    ├── 01-Demo/
    └── 02-Starter/
```

Cada carpeta `01-Demo/` o `02-Starter/` es un proyecto de Vite independiente, con su propio `package.json`, `index.html` y `src/`. Por eso `npm install` se corre en cada una.

En cada starter, abre `src/main.js`: arriba hay un bloque que lista el **piso** y las **extensiones** del ejercicio, y en el código hay comentarios `TODO` justo donde tienes que decidir algo.

---

## Overview de la clase

La cadena es la misma de las sesiones del mouse; solo cambia de dónde sale el número:

```
leer el input  →  normalizar  →  mapear  →  suavizar  →  dibujar
```

### Dos usos del scroll

| | Uso 1 · algo desborda | Uso 2 · nada desborda |
|---|---|---|
| **Qué pasa** | La página (o un contenedor) es más alta que la ventana | La página no se puede mover |
| **Evento** | `scroll` | `wheel` |
| **Qué lees** | La **posición**: `window.scrollY` | El **gesto**: `event.deltaY` |
| **Normalizas** | De 0 a lo que desborda → de 0 a 1 | Lo cuentas tú: sumas cada `deltaY` → de 0 a 1 |
| **Ejercicio** | 01 · Map scroll | 02 · Scroll sin página (+ extra: A flote) |

### Uso 1 · La posición

Lo que desborda es el alto total de la página **menos** lo que ya se ve. Si no lo restas, la barra nunca llega a 100 %.

```js
document.addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress = map(window.scrollY, 0, max, 0, 1);   // 0 arriba, 1 hasta abajo
});
```

Si lo que desborda es un contenedor (un `<div>` con `overflow-y: auto`), el evento se escucha en ese contenedor y se usan `scrollTop`, `scrollHeight` y `clientHeight` del elemento.

### Uso 2 · El gesto

`wheel` llega aunque nada se mueva. Primero la unidad (`deltaMode`), después el número (`deltaY`):

```js
document.addEventListener("wheel", (event) => {
  // 0 = píxeles · 1 = líneas · 2 = páginas
  const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
  wheelData.frame += event.deltaY * factor;   // positivo = abajo · negativo = arriba
});
```

**Delta** (Δ) significa "cuánto cambió". El evento solo suma; el loop, una vez por frame, toma lo que se juntó, lo mide contra el tiempo (`dt`) y lo vacía. Así salen los tres datos del gesto:

- **Píxeles:** la suma, con signo.
- **Velocidad:** `Math.abs(d) / dt`, suavizada con `COF` porque la cruda parpadea.
- **Dirección:** `Math.sign(d)` → `1`, `-1` o `0`.

---

### 01 · Map scroll · *individual · se entrega en clase*

*Un objeto 3D que gira con el scroll y una barra que dice cuánto llevas.*

La página desborda; el objeto está fijo al centro de la ventana. El progreso del scroll (de 0 a 1) gira el objeto y llena una barra hecha en HTML y CSS.

**Repasa:** `map()` y la escena de Three.js (02 de S09).

| | |
|---|---|
| **Piso** | Escucha `scroll`, calcula lo que desborda y normaliza el progreso de 0 a 1. Con `map()`, el progreso rota tu objeto en Y y llena la barra con su porcentaje. |
| **Extensión 1** | Suaviza el progreso con `COF`: el giro tiene inercia en vez de seguir el scroll en seco. |
| **Extensión 2** | Progreso por sección: un tramo del scroll mueve otro eje u otra propiedad (la demo inclina el objeto en la segunda mitad). |
| **60 FPS** | La barra con `transform: scaleX()`, no con `width`. `pixelRatio` con tope en 2 (ya está). |
| **Preguntas de refuerzo** | ¿Cuál es tu rango de entrada y cuál tu rango de salida? ¿Qué cambió respecto a tu ejercicio con mouse, y qué no? ¿Por qué una vuelta completa y no media, o tres? |

**Necesitas:** variables, funciones, `map()` y la escena base de Three.js (ya viene armada).

---

### 02 · Scroll sin página · *individual · se entrega en clase*

*El mismo giro del ejercicio 01, pero aquí nada desborda.*

Es tu ejercicio 01 con una sola diferencia: la página no se puede mover, así que `window.scrollY` siempre vale 0. El gesto sí llega, en el evento `wheel`. Tu trabajo es **contarlo**: sumar cada `deltaY` en una variable que hace el trabajo de `scrollY`, con bordes que decides tú. Con eso calculas el mismo progreso de 0 a 1 y reusas tu `map()` del objeto y de la barra.

```js
document.addEventListener("wheel", (event) => {
  wheelData.posicion += event.deltaY;                       // contar el gesto
  wheelData.posicion = clamp(wheelData.posicion, 0, MAX);   // los bordes de una página que no existe
  progress = map(wheelData.posicion, 0, MAX, 0, 1);         // ¡el mismo progreso del ejercicio 01!
});
```

**Repasa:** tu ejercicio 01: el progreso, el giro y la barra se quedan igual.

| | |
|---|---|
| **Piso** | Escucha `wheel` y suma cada `deltaY` en `wheelData.posicion`. Decide `MAX`, limita con `clamp()` y normaliza de 0 a 1. Con `map()`, el progreso gira tu objeto y llena la barra. |
| **Extensión 1** | Dirección: con `Math.sign(deltaY)`, la marca del objeto cambia de color hacia abajo y hacia arriba. |
| **Extensión 2** | Energía: cada gesto la carga, cada frame se apaga sola (`energia *= 0.92`) y se nota en la escala del objeto. |
| **Extensión 3** | La carpeta `03-A-Flote`: la gravedad contra el gesto. |
| **60 FPS** | El evento solo cuenta; el loop dibuja. La barra con `transform`, `pixelRatio` con tope en 2 (ya está). |
| **Preguntas de refuerzo** | ¿Qué diferencia hay entre tu `posicion` y `window.scrollY`? ¿Por qué escogiste ese `MAX`: qué pasa si es 300, o 30 000? ¿Qué cambió de tu código del ejercicio 01, y qué no? |

**Necesitas:** tu ejercicio 01, `map()`, `clamp()` y la escena base de Three.js (ya viene armada).

> **Nota sobre `deltaMode`.** En Firefox con mouse de rueda, `deltaY` puede llegar en líneas (`deltaMode === 1`) en lugar de píxeles. Para este ejercicio puedes usarlo directo; para convertir, multiplícalo por 16.

---

### Extra · A flote · *para quien termina el ejercicio 02*

*Un globo cae sin parar. Solo el scroll hacia abajo lo mantiene en el aire.*

Como en el ejercicio 02, nada desborda. Ahora el gesto no mueve un progreso: empuja al globo contra la gravedad. En un trackpad con scroll natural, el scroll hacia abajo es mover los dedos hacia **arriba**: el gesto y el globo van en la misma dirección.

**La gravedad** de la demo es de 6 m/s² (la real es 9.8). Cada segundo, el globo pierde 6 m/s de velocidad: desde el techo llega al suelo en menos de un segundo si nadie lo empuja. Es un número de diseño: más alto, cae más rápido y hay que scrollear más fuerte; más bajo, flota casi solo. Azul mientras flota, rojo cuando toca el suelo. No hay pantalla de fin: lo que importa es cómo se siente el gesto.

**Repasa:** delta time (Bloque 1) y "leer en el evento, animar en el loop" (S08).

| | |
|---|---|
| **Piso** | Escucha `wheel` y convierte con `deltaMode`. La gravedad baja al globo (× `dt`) y solo el scroll hacia abajo (`deltaY` positivo) lo empuja. Azul mientras flota, rojo en el suelo. |
| **Extensión 1** | Muestra los tres datos del gesto: píxeles con signo, velocidad suavizada y dirección. |
| **Extensión 2** | Que la dirección contraria también diga algo: el scroll hacia arriba lo hunde, o la fatiga hace que el mismo gesto empuje menos con el tiempo. |
| **60 FPS** | Un solo `requestAnimationFrame`; la física multiplicada por `dt`, igual a 60 que a 120 Hz. |
| **Preguntas de refuerzo** | ¿Por qué el scroll hacia abajo sube el globo y cómo lo detectas en el código? Con un mouse de rueda, ¿el gesto se siente igual que con los dedos en el trackpad? ¿Cómo calibraste para que se sienta igual con rueda que con trackpad? |

**Necesitas:** variables, funciones, `map()`, delta time y la escena base de Three.js (ya viene armada).

---

### Para todos los ejercicios

- **Bitácora de IA:** en el README de tu repositorio, qué le consultaste a la IA, qué aceptaste y qué descartaste, y por qué.
- **60 fps en el equipo más lento del grupo.** Compruébalo en Chrome: *DevTools → Rendering → Frame rendering stats*.
- **Preguntas de refuerzo:** al cierre de cada ejercicio, algunas personas responden en voz alta las de su pieza.

---

## Si algo no funciona

| Síntoma | Qué revisar |
|---|---|
| `npm install` falla | Tu versión de Node: `node -v`. Necesitas 20.19+ o 22.12+. |
| `cd: no such file or directory` | Dónde estás parado: `pwd` (Mac / Linux) o `cd` sin argumentos (Windows). Si abriste una terminal nueva, arranca en la raíz del repositorio: ahí va sin `../../`. |
| La página abre en otro puerto | Quedó un servidor corriendo. `Ctrl + C` en las terminales anteriores. |
| Los cambios no aparecen | Revisa que estés editando el `02-Starter` y viendo su puerto (`:5174`), no el de la demo. |
| La barra nunca llega a 100 % | Al alto de la página le falta restar `window.innerHeight`. |
| El objeto gira, pero el progreso pasa de 1 | Pasa el progreso por `clamp(progress, 0, 1)`: en algunos navegadores el scroll rebota más allá del borde. |
| El evento `scroll` nunca llega | Nada desborda. Revisa que la página (o tu contenedor) sea más alta que la ventana. |
| La posición no pasa de 0 | `MAX` sigue en `0`: `clamp()` no deja que la posición crezca. |
| El progreso dice `NaN` | `MAX` vale `0` y `map()` divide entre 0. Dale un valor (prueba con 3000). |
| Scrolleo y no pasa nada | Revisa que estés sumando en el evento `wheel`, no en `scroll`: aquí la página no se mueve y `scroll` nunca llega. |
| El globo no sube | `GRAVEDAD` y `EMPUJE` siguen en `0`, o estás empujando con el scroll hacia arriba (`deltaY` negativo). |
| El globo sube distinto con rueda y con trackpad | Es normal: la rueda manda pocos eventos grandes y el trackpad muchos chicos. Calibra `EMPUJE` probando con los dos. |
| En Firefox el globo apenas se mueve | Firefox puede mandar la rueda en líneas (`deltaMode` 1). Convierte a píxeles antes de usar `deltaY`. |
| La velocidad dice `NaN` | En el primer frame `dt` vale `0`: dividir entre 0 da `NaN`. Revisa que `dt` sea mayor que 0 antes de dividir. |
| Nada se mueve | Revisa que tus rangos no sigan en `0` y que la función esté llamada dentro de `animate()`. |
| Abrir el `index.html` con doble clic no funciona | Es normal: los módulos de JavaScript necesitan un servidor. Usa `npm run dev`. |

---

## Referencias

- [S09 · Práctica con Mouse](https://github.com/AndrewAlva/S09-Practica-Mouse) · la sesión anterior.
- [Evento `scroll` · MDN](https://developer.mozilla.org/es/docs/Web/API/Document/scroll_event)
- [Evento `wheel` · MDN](https://developer.mozilla.org/es/docs/Web/API/Element/wheel_event)
- [`WheelEvent.deltaMode` · MDN (inglés)](https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode)
- [`requestAnimationFrame` · MDN](https://developer.mozilla.org/es/docs/Web/API/Window/requestAnimationFrame)
- [`transform` · MDN](https://developer.mozilla.org/es/docs/Web/CSS/transform)
- [Three.js · documentación](https://threejs.org/docs/)
- [Vite · Guía](https://vite.dev/guide/)

Dudas: salvaradoh@centro.edu.mx · lunes a viernes, 10:00–20:00.
