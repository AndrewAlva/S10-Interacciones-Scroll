import './style.css';
import * as THREE from 'three';
console.log("02-Scroll-Sin-Pagina. 02-Starter.");

/*
  EJERCICIO 02 · SCROLL SIN PÁGINA (individual · se entrega en clase)

  Es tu ejercicio 01, pero aquí la página NO desborda: window.scrollY siempre vale 0.
  El gesto sí llega, en el evento wheel. Tu trabajo: contarlo tú.

  Piso (mínimo para entregar):
    TODO 1 · En el evento wheel, suma cada deltaY en wheelData.posicion: tu propio "scrollY".
    TODO 2 · Decide MAX, limita la posición con clamp() y normalízala de 0 a 1 con map().
    TODO 3 · Con map(), el progreso rota tu objeto y llena la barra (copia lo que hiciste en el ejercicio 01).

  Extensión 1 · TODO 4 · Dirección: con Math.sign(deltaY), la marca cambia de color hacia abajo y hacia arriba.
  Extensión 2 · TODO 5 · Energía: cada gesto la carga, cada frame se apaga sola, y se nota en la escala.
  Extensión 3 · Para quien va muy adelante: la carpeta 03-A-Flote (gravedad contra el gesto).

  60 fps: el evento solo cuenta; el loop dibuja. La barra con transform y pixelRatio con tope en 2 (ya está).
*/

// Obtener referencias a los elementos del DOM ---------------------------------------------------------------
const deltaContainerY = document.getElementById("delta-y");
const posicionContainer = document.getElementById("posicion");
const maximoContainer = document.getElementById("maximo");
const progressContainer = document.getElementById("progreso");
const direccionContainer = document.getElementById("direccion");
const rotationContainerY = document.getElementById("rotation-y");

const barraRelleno = document.getElementById("barra-relleno");
const barraPorcentaje = document.getElementById("barra-porcentaje");

const lienzo = document.getElementById("lienzo");
// -------------------------------------------------------------------------






// Definición de variables y constantes ---------------------------------------------------------------
let wheelData = {
  deltaY: 0,      // el último cambio que llegó: positivo abajo, negativo arriba
  posicion: 0,    // TU propio "scrollY": la suma de todos los deltaY
  direccion: 0    // 1 abajo · -1 arriba · 0 quieto (extensión 1)
};

let progress = 0;       // la posición normalizada: de 0 a 1
let lerpProgress = 0;   // el mismo progreso, suavizado
let energia = 0;        // cuánto "empuja" el gesto ahora mismo; se apaga sola (extensión 2)

let rotation = {
  y: 0
};

// TODO 2 · En el ejercicio 01 el navegador te daba el máximo (lo que desbordaba la página).
//   Aquí no hay página: tú decides. ¿Cuántos píxeles de gesto para recorrer de 0 a 1? (prueba con 3000)
const MAX = 0;

const COF = 0.08;              // Coefficient of friction: qué tan rápido llega el progreso suavizado
const ROTATION_TOTAL = 360;    // Una vuelta completa en Y de 0 a MAX
const APAGADO = 0.92;          // Extensión 2: cada frame la energía se queda con el 92 % de lo que tenía

// TODO 4 · Tus colores para la dirección
const COLOR_ABAJO = "#9a9a9a";
const COLOR_ARRIBA = "#9a9a9a";
const COLOR_QUIETO = "#f2f2f2";
// -------------------------------------------------------------------------






// Funciones de utilidad ---------------------------------------------------------------
// map(): convierte un valor de un rango a otro
function map(valor, inMin, inMax, outMin, outMax) {
  const t = (valor - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

// clamp(): mantiene un valor entre un mínimo y un máximo
function clamp(valor, min, max) {
  return Math.min(max, Math.max(min, valor));
}
// -------------------------------------------------------------------------






// Escena 3D ---------------------------------------------------------------
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 12;   // un poco más lejos: el objeto queda al centro sin tapar el texto

const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // tope en 2: pantallas retina sin castigar el rendimiento
renderer.setSize(window.innerWidth, window.innerHeight);

const hemiLight = new THREE.HemisphereLight("#ffffff", "#333333", 1.2);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight("#ffffff", 2.4);
keyLight.position.set(3, 4, 6);
scene.add(keyLight);

// Objeto héroe: puedes usar el mismo de tu ejercicio 01. Todo lo que agregues con hero.add() gira junto.
const hero = new THREE.Group();
hero.rotation.x = THREE.MathUtils.degToRad(20);   // inclinación fija para que se lea el volumen
scene.add(hero);

const placeholder = new THREE.Mesh(
  new THREE.BoxGeometry(2, 2, 2),
  new THREE.MeshStandardMaterial({ color: "#9a9a9a", roughness: 0.5, flatShading: true })
);
hero.add(placeholder);

// La marca: la que cambia de color con la dirección (extensión 1)
const materialMarca = new THREE.MeshStandardMaterial({ color: COLOR_QUIETO, roughness: 0.5 });
const marca = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.2), materialMarca);
marca.position.z = 1.05;
hero.add(marca);

// Canvas responsivo: cámara y renderer siguen el tamaño de la ventana
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
// -------------------------------------------------------------------------






// Gesto: contar (solo en el evento) ---------------------------------------------------------------
// No hay scroll que leer: la página no se mueve. Pero el gesto sí llega, en el evento wheel.
document.addEventListener("wheel", (event) => {
  wheelData.deltaY = event.deltaY;
  // Nota: en Firefox con mouse de rueda deltaY puede llegar en líneas (event.deltaMode === 1).
  //   Para este ejercicio puedes usarlo directo; para convertir a píxeles, multiplícalo por 16.

  // TODO 1 · Contar: súmale wheelData.deltaY a wheelData.posicion.
  //   Esta variable va a hacer el trabajo que en el ejercicio 01 hacía window.scrollY.

  // TODO 2 · Los bordes de una página que no existe: limita la posición entre 0 y MAX con clamp().
  //   Después normaliza con map(): wheelData.posicion de 0 a MAX → progress de 0 a 1.

  // TODO 4 · Extensión 1: wheelData.direccion = Math.sign(...)
  // TODO 5 · Extensión 2: cada gesto carga energía → energia += Math.abs(...)
});

function calculateLerpProgress() {
  lerpProgress += (progress - lerpProgress) * COF;

  deltaContainerY.innerText = Math.round(wheelData.deltaY);
  posicionContainer.innerText = Math.round(wheelData.posicion);
  maximoContainer.innerText = MAX;
  progressContainer.innerText = lerpProgress.toFixed(2);
}
// -------------------------------------------------------------------------






// Map: del progreso suavizado a rotación y barra ---------------------------------------------------------------
function updateHero() {
  // TODO 3 · Lo mismo que en tu ejercicio 01:
  //   rotation.y = map(lerpProgress, 0, 1, 0, ROTATION_TOTAL);
  //   y aplícalo a hero.rotation.y en radianes (THREE.MathUtils.degToRad()).

  rotationContainerY.innerText = Math.round(rotation.y);
}

function updateBarra() {
  // TODO 3 · También igual que en el ejercicio 01: scaleX de la barra y su porcentaje con map().
}
// -------------------------------------------------------------------------






// Extensiones: dirección y energía ---------------------------------------------------------------
function updateDireccion() {
  // TODO 4 · Extensión 1: según wheelData.direccion (1, -1 o 0), cambia el color de la marca:
  //   materialMarca.color.set(...)   con COLOR_ABAJO, COLOR_ARRIBA o COLOR_QUIETO
  //   Y que vuelva a "quieto" cuando ya no hay gesto: if (energia < 1) wheelData.direccion = 0;

  direccionContainer.innerText = wheelData.direccion > 0 ? "↓ abajo" : wheelData.direccion < 0 ? "↑ arriba" : "—";
}

function updateEnergia() {
  // TODO 5 · Extensión 2: la energía se apaga sola. Cada frame, multiplícala por APAGADO.
  //   Luego mapéala a una escala: map(clamp(energia, 0, 600), 0, 600, 1, 1.25) → hero.scale.setScalar(...)
  //   ¿Qué pasa con APAGADO = 0.99? ¿Y con 0.5?
}
// -------------------------------------------------------------------------






// Loop de animación ---------------------------------------------------------------
function animate() {
  calculateLerpProgress();
  updateHero();
  updateBarra();
  updateDireccion();
  updateEnergia();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
// -------------------------------------------------------------------------
