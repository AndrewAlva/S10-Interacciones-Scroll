import './style.css';
import * as THREE from 'three';
console.log("02-Scroll-Sin-Pagina. 01-Demo.");

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
  posicion: 0,    // NUESTRO propio "scrollY": la suma de todos los deltaY
  direccion: 0    // 1 abajo · -1 arriba · 0 quieto
};

let progress = 0;       // la posición normalizada: de 0 a 1
let lerpProgress = 0;   // el mismo progreso, suavizado
let energia = 0;        // cuánto "empuja" el gesto ahora mismo; se apaga sola (extensión 2)

let rotation = {
  y: 0
};

// En el ejercicio 01 el navegador nos daba el máximo (lo que desborda la página).
// Aquí no hay página: el máximo lo decidimos nosotros. ¿Cuánto hay que scrollear para dar una vuelta?
const MAX = 3000;

const COF = 0.08;              // Coefficient of friction: qué tan rápido llega el progreso suavizado
const ROTATION_TOTAL = 360;    // Una vuelta completa en Y de 0 a MAX
const APAGADO = 0.92;          // Cada frame la energía se queda con el 92 %: vuelve sola a 0 (extensión 2)

const COLOR_ABAJO = "#ff6a3d";
const COLOR_ARRIBA = "#3d8bff";
const COLOR_QUIETO = "#f4efe6";
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

const hemiLight = new THREE.HemisphereLight("#ffe6d9", "#1f1410", 1.2);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight("#ffffff", 2.4);
keyLight.position.set(3, 4, 6);
scene.add(keyLight);

// Objeto héroe: el mismo del ejercicio 01, fijo al centro
const hero = new THREE.Group();
scene.add(hero);

const cuerpo = new THREE.Mesh(
  new THREE.BoxGeometry(2, 2, 2),
  new THREE.MeshStandardMaterial({ color: "#ff6a3d", roughness: 0.4, flatShading: true })
);
hero.add(cuerpo);

// La marca cambia de color con la dirección del gesto (extensión 1)
const materialMarca = new THREE.MeshStandardMaterial({ color: COLOR_QUIETO, roughness: 0.5 });
const marca = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.2), materialMarca);
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
});
// -------------------------------------------------------------------------






// Gesto: contar (solo en el evento) ---------------------------------------------------------------
// No hay scroll que leer: la página no se mueve. Pero el gesto sí llega, en el evento wheel.
document.addEventListener("wheel", (event) => {
  // Nota: en Firefox con mouse de rueda deltaY puede llegar en líneas (event.deltaMode === 1).
  // Para esta demo lo usamos directo; para convertir a píxeles, multiplica por 16.
  wheelData.deltaY = event.deltaY;

  // Contar: sumamos cada cambio. Esta variable hace el trabajo que antes hacía window.scrollY.
  wheelData.posicion += wheelData.deltaY;
  wheelData.posicion = clamp(wheelData.posicion, 0, MAX);   // los bordes de una página que no existe

  // Normalizar: igual que en el ejercicio 01
  progress = map(wheelData.posicion, 0, MAX, 0, 1);

  wheelData.direccion = Math.sign(wheelData.deltaY);   // extensión 1
  energia += Math.abs(wheelData.deltaY);               // extensión 2: el gesto carga energía
});

function calculateLerpProgress() {
  lerpProgress += (progress - lerpProgress) * COF;

  deltaContainerY.innerText = Math.round(wheelData.deltaY);
  posicionContainer.innerText = Math.round(wheelData.posicion);
  maximoContainer.innerText = MAX;
  progressContainer.innerText = lerpProgress.toFixed(2);
}
// -------------------------------------------------------------------------






// Map: del progreso suavizado a rotación y barra (igual que en el ejercicio 01) ---------------------------------------------------------------
function updateHero() {
  rotation.y = map(lerpProgress, 0, 1, 0, ROTATION_TOTAL);
  hero.rotation.y = THREE.MathUtils.degToRad(rotation.y);
  hero.rotation.x = THREE.MathUtils.degToRad(20);   // inclinación fija para que se lea el volumen

  rotationContainerY.innerText = Math.round(rotation.y);
}

function updateBarra() {
  barraRelleno.style.transform = `scaleX(${lerpProgress})`;
  barraPorcentaje.innerText = `${Math.round(map(lerpProgress, 0, 1, 0, 100))}%`;
}
// -------------------------------------------------------------------------






// Extensiones: dirección y energía ---------------------------------------------------------------
function updateDireccion() {
  // Extensión 1 · la marca dice hacia dónde va el gesto
  const color = wheelData.direccion > 0 ? COLOR_ABAJO : wheelData.direccion < 0 ? COLOR_ARRIBA : COLOR_QUIETO;
  materialMarca.color.set(color);
  direccionContainer.innerText = wheelData.direccion > 0 ? "↓ abajo" : wheelData.direccion < 0 ? "↑ arriba" : "—";

  // Si no llega ningún gesto, la dirección vuelve a "quieto" poco a poco
  if (energia < 1) wheelData.direccion = 0;
}

function updateEnergia() {
  // Extensión 2 · la energía se apaga sola: cada frame se queda con un porcentaje de lo que tenía
  energia *= APAGADO;

  // Y se nota en la escala: más gesto ahora mismo = el objeto crece un poco
  const escala = map(clamp(energia, 0, 600), 0, 600, 1, 1.25);
  hero.scale.setScalar(escala);
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
