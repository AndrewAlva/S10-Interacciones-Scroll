import './style.css';
import * as THREE from 'three';
console.log("01-Map-Scroll. 01-Demo.");

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
let lerpProgress = 0;   // el mismo progreso, suavizado

let rotation = {
  x: 0,
  y: 0
};

const COF = 0.08;             // Coefficient of friction: qué tan rápido llega el progreso suavizado
const ROTATION_TOTAL = 360;   // Una vuelta completa en Y a lo largo de toda la página
const TILT_LIMIT = 40;        // Inclinación en X durante la segunda mitad del scroll (extensión 2)
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

const hemiLight = new THREE.HemisphereLight("#cfe6ff", "#10141f", 1.2);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight("#ffffff", 2.4);
keyLight.position.set(3, 4, 6);
scene.add(keyLight);

// Objeto héroe: fijo al centro de la ventana. Un grupo que gira como una sola pieza.
const hero = new THREE.Group();
scene.add(hero);

const cuerpo = new THREE.Mesh(
  new THREE.BoxGeometry(2, 2, 2),
  new THREE.MeshStandardMaterial({ color: "#3d8bff", roughness: 0.4, flatShading: true })
);
hero.add(cuerpo);

// Una marca en una cara: sin ella, un cubo que gira 90° se ve igual que antes de girar
const marca = new THREE.Mesh(
  new THREE.BoxGeometry(0.7, 0.7, 0.2),
  new THREE.MeshStandardMaterial({ color: "#f4efe6", roughness: 0.5 })
);
marca.position.z = 1.05;
hero.add(marca);

const anillo = new THREE.Mesh(
  new THREE.TorusGeometry(2.2, 0.04, 12, 120),
  new THREE.MeshStandardMaterial({ color: "#f4efe6", roughness: 0.3 })
);
anillo.rotation.x = THREE.MathUtils.degToRad(90);
hero.add(anillo);

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
  // Lo que desborda: el alto total de la página menos lo que ya se ve
  scrollData.max = document.documentElement.scrollHeight - window.innerHeight;

  // Normalizar: de 0 a scrollData.max → de 0 a 1
  progress = map(scrollData.y, 0, scrollData.max, 0, 1);
  progress = clamp(progress, 0, 1);   // en algunos navegadores el scroll "rebota" más allá del borde
}

document.addEventListener("scroll", () => {
  scrollData.y = window.scrollY;

  calculateProgress();
});

calculateProgress();   // por si la página carga ya scrolleada

function calculateLerpProgress() {
  lerpProgress += (progress - lerpProgress) * COF;

  scrollContainerY.innerText = Math.round(scrollData.y);
  scrollContainerMax.innerText = Math.round(scrollData.max);
  progressContainer.innerText = lerpProgress.toFixed(2);
}
// -------------------------------------------------------------------------






// Map: del progreso suavizado a rotación y barra ---------------------------------------------------------------
function updateHero() {
  // Piso: toda la página = una vuelta completa en Y
  rotation.y = map(lerpProgress, 0, 1, 0, ROTATION_TOTAL);

  // Extensión 2 · progreso por sección: en la segunda mitad (de 0.5 a 1) también se inclina en X
  const segundaMitad = clamp(map(lerpProgress, 0.5, 1, 0, 1), 0, 1);
  rotation.x = map(segundaMitad, 0, 1, 0, TILT_LIMIT);

  // Three.js rota en radianes; nuestros valores están en grados
  hero.rotation.y = THREE.MathUtils.degToRad(rotation.y);
  hero.rotation.x = THREE.MathUtils.degToRad(rotation.x);

  rotationContainerY.innerText = Math.round(rotation.y);
  rotationContainerX.innerText = Math.round(rotation.x);
}

function updateBarra() {
  // scaleX en vez de width: transform no recalcula el layout de la página (60 fps)
  barraRelleno.style.transform = `scaleX(${lerpProgress})`;
  barraPorcentaje.innerText = `${Math.round(map(lerpProgress, 0, 1, 0, 100))}%`;
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
