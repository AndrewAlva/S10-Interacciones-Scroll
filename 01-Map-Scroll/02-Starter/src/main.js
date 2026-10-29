import './style.css';
import * as THREE from 'three';
console.log("01-Map-Scroll. 02-Starter.");

/*
  EJERCICIO 01 · MAP SCROLL (individual · se entrega en clase)

  Piso (mínimo para entregar):
    TODO 1 · En el evento scroll, calcula cuánto desborda la página y normaliza el scroll de 0 a 1.
    TODO 2 · Con map(), el progreso rota tu objeto 3D (fijo al centro) en Y.
    TODO 3 · Con map(), el progreso llena la barra HTML/CSS y escribe su porcentaje.

  Extensión 1 · TODO 4 · Suaviza el progreso con COF: el giro tiene inercia en vez de seguir el scroll en seco.
  Extensión 2 · TODO 5 · Progreso por sección: un tramo del scroll mueve otro eje u otra propiedad.

  60 fps: la barra se escala con transform (no con width) y pixelRatio tiene tope en 2 (ya está).
*/

// Obtener referencias a los elementos del DOM ---------------------------------------------------------------
const scrollContainerY = document.getElementById("scroll-y");
const scrollContainerMax = document.getElementById("scroll-max");
const progressContainer = document.getElementById("progreso");
const rotationContainerY = document.getElementById("rotation-y");
const rotationContainerX = document.getElementById("rotation-x");

const barraRelleno = document.getElementById("barra-relleno");
const barraPorcentaje = document.getElementById("barra-porcentaje");

const lienzo = document.getElementById("lienzo");
// -------------------------------------------------------------------------






// Definición de variables y constantes ---------------------------------------------------------------
let scrollData = {
  y: 0,     // cuántos píxeles ha bajado la página (window.scrollY)
  max: 0    // cuántos píxeles PUEDE bajar: lo que desborda
};

let progress = 0;       // el scroll normalizado: 0 arriba, 1 hasta abajo
let lerpProgress = 0;   // el mismo progreso, suavizado (extensión 1)

let rotation = {
  x: 0,
  y: 0
};

const COF = 0.08; // Coefficient of friction: qué tan rápido llega el progreso suavizado

// TODO 2 · ¿Cuántos grados gira tu objeto a lo largo de toda la página? ¿Media vuelta, una, tres?
const ROTATION_TOTAL = 0;

// TODO 5 · Para la extensión 2: decide tú este rango
const TILT_LIMIT = 0;   // grados de inclinación en X en el tramo que elijas
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

// Objeto héroe: fijo al centro de la ventana. Todo lo que agregues con hero.add() gira junto.
const hero = new THREE.Group();
scene.add(hero);

// Puedes reemplazar este placeholder por tu propio objeto hecho con primitivas.
// Ojo: si es muy simétrico (una esfera lisa), no se va a notar que gira.
const placeholder = new THREE.Mesh(
  new THREE.BoxGeometry(2, 2, 2),
  new THREE.MeshStandardMaterial({ color: "#9a9a9a", roughness: 0.5, flatShading: true })
);
hero.add(placeholder);

const marca = new THREE.Mesh(
  new THREE.BoxGeometry(0.7, 0.7, 0.2),
  new THREE.MeshStandardMaterial({ color: "#f2f2f2", roughness: 0.5 })
);
marca.position.z = 1.05;
hero.add(marca);

// Canvas responsivo: cámara y renderer siguen el tamaño de la ventana
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  calculateProgress();   // al cambiar el alto de la ventana, cambia lo que desborda
});
// -------------------------------------------------------------------------






// Scroll: leer y normalizar (solo en el evento) ---------------------------------------------------------------
function calculateProgress() {
  // TODO 1 · Lo que desborda: el alto total de la página MENOS lo que ya se ve.
  //   scrollData.max = document.documentElement.scrollHeight - ...
  //
  //   Luego normaliza con map(): scrollData.y va de 0 a scrollData.max → progress de 0 a 1.
  //   Pásalo por clamp(progress, 0, 1): en algunos navegadores el scroll "rebota" más allá del borde.
}

document.addEventListener("scroll", () => {
  scrollData.y = window.scrollY;

  calculateProgress();
});

calculateProgress();   // por si la página carga ya scrolleada

function calculateLerpProgress() {
  // TODO 4 · Extensión 1: en cada frame, recorre una fracción (COF) de lo que falta.
  //   lerpProgress += (progress - lerpProgress) * COF;
  //   Mientras no lo hagas, el progreso pasa directo:
  lerpProgress = progress;

  scrollContainerY.innerText = Math.round(scrollData.y);
  scrollContainerMax.innerText = Math.round(scrollData.max);
  progressContainer.innerText = lerpProgress.toFixed(2);
}
// -------------------------------------------------------------------------






// Map: del progreso a rotación y barra ---------------------------------------------------------------
function updateHero() {
  // TODO 2 · Con map(), convierte lerpProgress (de 0 a 1) a grados (de 0 a ROTATION_TOTAL) → rotation.y
  //   Luego aplícalo a hero.rotation.y (Three.js usa radianes: THREE.MathUtils.degToRad()).

  // TODO 5 · Extensión 2: progreso por sección. Por ejemplo, solo en la segunda mitad:
  //   const tramo = clamp(map(lerpProgress, 0.5, 1, 0, 1), 0, 1);   // 0 antes de la mitad, 1 al final
  //   y ese tramo, con otro map(), mueve rotation.x de 0 a TILT_LIMIT (u otra propiedad: escala, posición...).

  rotationContainerY.innerText = Math.round(rotation.y); // Math.round evita mostrar "-0"
  rotationContainerX.innerText = Math.round(rotation.x);
}

function updateBarra() {
  // TODO 3 · Llena la barra con el progreso:
  //   - barraRelleno.style.transform = `scaleX(...)`   (scaleX va de 0 a 1: ¿necesitas map() aquí?)
  //   - barraPorcentaje.innerText = ... con map() de 0 a 100, redondeado y con "%"
  //   Usa transform, no width: transform no recalcula el layout de la página.
}
// -------------------------------------------------------------------------






// Loop de animación ---------------------------------------------------------------
function animate() {
  calculateLerpProgress();
  updateHero();
  updateBarra();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
// -------------------------------------------------------------------------
