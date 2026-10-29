import './style.css';
import * as THREE from 'three';
console.log("02-A-Flote. 01-Demo.");

// Obtener referencias a los elementos del DOM ---------------------------------------------------------------
const deltaContainerY = document.getElementById("delta-y");
const deltaModeContainer = document.getElementById("delta-mode");
const pixelesContainer = document.getElementById("pixeles");
const velocidadContainer = document.getElementById("velocidad");
const direccionContainer = document.getElementById("direccion");
const alturaContainer = document.getElementById("altura");

const lienzo = document.getElementById("lienzo");
// -------------------------------------------------------------------------






// Definición de variables y constantes ---------------------------------------------------------------
let wheelData = {
  deltaY: 0,     // el último deltaY que llegó, ya en píxeles
  deltaMode: 0,  // la unidad en que llegó: 0 píxeles · 1 líneas · 2 páginas
  frame: 0       // lo que se acumuló desde el último frame: lo llena el evento, lo vacía el loop
};

let gesto = {
  pixeles: 0,    // todo lo que se ha scrolleado, con signo: abajo suma, arriba resta
  velocidad: 0,  // píxeles por segundo, suavizada
  direccion: 0   // 1 abajo · -1 arriba · 0 quieto
};

let globo = {
  altura: 2,     // metros sobre el suelo
  velocidad: 0   // metros por segundo: positivo sube, negativo baja
};

const GRAVEDAD = 6;         // metros por segundo², siempre hacia abajo
                            // La gravedad real es 9.8 m/s². Usamos 6 para que caiga como globo, no como piedra:
                            // cada segundo el globo pierde 6 m/s de velocidad, y desde el techo (2.6 m)
                            // llega al suelo en menos de un segundo si nadie lo empuja (t = √(2·2.6 / 6) ≈ 0.93 s).
                            // Más alto = cae más rápido y hay que scrollear más fuerte; más bajo = flota casi solo.
const EMPUJE = 0.014;       // metros por segundo que gana el globo por cada píxel de scroll hacia abajo
const VELOCIDAD_MAX = 6;    // tope de subida: que un trackpad rápido no lo dispare
const TECHO = 2.6;          // altura máxima sobre el suelo (que no salga del cuadro)
const COF = 0.15;           // suavizado de la velocidad del gesto

const SUELO_Y = -2.6;       // dónde está el suelo en la escena
const RADIO = 0.6;
const AZUL = "#3d8bff";
const ROJO = "#ff4d3d";
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
camera.position.z = 9;

const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // tope en 2: pantallas retina sin castigar el rendimiento
renderer.setSize(window.innerWidth, window.innerHeight);

const hemiLight = new THREE.HemisphereLight("#dfe9ff", "#14101c", 1.3);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight("#ffffff", 2.2);
keyLight.position.set(3, 4, 6);
scene.add(keyLight);

// El globo: un grupo que sube y baja como una sola pieza
const grupoGlobo = new THREE.Group();
grupoGlobo.position.x = 1.8;   // a la derecha, para dejar espacio al texto
scene.add(grupoGlobo);

const materialGlobo = new THREE.MeshStandardMaterial({ color: AZUL, roughness: 0.35 });

const cuerpo = new THREE.Mesh(new THREE.SphereGeometry(RADIO, 32, 24), materialGlobo);
cuerpo.scale.y = 1.15;   // un poco alargado: se lee como globo, no como pelota
grupoGlobo.add(cuerpo);

const nudo = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.16, 12), materialGlobo);
nudo.position.y = -RADIO * 1.15 - 0.04;
nudo.rotation.x = Math.PI;
grupoGlobo.add(nudo);

const hilo = new THREE.Mesh(
  new THREE.CylinderGeometry(0.008, 0.008, 1.2, 6),
  new THREE.MeshStandardMaterial({ color: "#f4efe6" })
);
hilo.position.y = -RADIO * 1.15 - 0.7;
grupoGlobo.add(hilo);

// El suelo: una línea delgada
const suelo = new THREE.Mesh(
  new THREE.BoxGeometry(6, 0.02, 0.02),
  new THREE.MeshStandardMaterial({ color: "#5b5b66" })
);
suelo.position.set(1.8, SUELO_Y, 0);
scene.add(suelo);

// Canvas responsivo: cámara y renderer siguen el tamaño de la ventana
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
// -------------------------------------------------------------------------






// Gesto: leer (solo en el evento) ---------------------------------------------------------------
document.addEventListener("wheel", (event) => {
  // Primero la unidad: deltaMode ANTES que deltaY
  wheelData.deltaMode = event.deltaMode;
  const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;

  // Ya en píxeles. Positivo = scroll hacia abajo · negativo = scroll hacia arriba
  wheelData.deltaY = event.deltaY * factor;

  // Solo sumamos: el loop decide qué hacer con lo que se juntó en este frame
  wheelData.frame += wheelData.deltaY;
});
// -------------------------------------------------------------------------






// Datos del gesto: medir una vez por frame ---------------------------------------------------------------
function calculateGesto(dt) {
  const d = wheelData.frame;
  wheelData.frame = 0;   // el siguiente frame empieza en 0

  gesto.pixeles += d;                                   // cuánto, con signo
  const velocidadCruda = dt > 0 ? Math.abs(d) / dt : 0;   // píxeles por segundo en este frame
  gesto.velocidad += (velocidadCruda - gesto.velocidad) * COF;   // suavizada: la cruda parpadea
  gesto.direccion = Math.sign(d);                       // 1, -1 o 0

  deltaContainerY.innerText = Math.round(wheelData.deltaY);
  deltaModeContainer.innerText = wheelData.deltaMode;
  pixelesContainer.innerText = Math.round(gesto.pixeles);
  velocidadContainer.innerText = Math.round(gesto.velocidad);
  direccionContainer.innerText = gesto.direccion > 0 ? "↓ abajo" : gesto.direccion < 0 ? "↑ arriba" : "—";

  return d;
}
// -------------------------------------------------------------------------






// Física: gravedad contra el gesto ---------------------------------------------------------------
function updateGlobo(d, dt) {
  // Solo el scroll hacia abajo empuja (d positivo). En un trackpad con scroll natural
  // eso es mover los dedos hacia ARRIBA: el gesto y el globo van en la misma dirección.
  // Hacia arriba (d negativo), Math.max lo deja en 0.
  const empuje = Math.max(0, d) * EMPUJE;
  globo.velocidad = Math.min(globo.velocidad + empuje, VELOCIDAD_MAX);

  // La gravedad siempre resta. Multiplicar por dt: lo mismo a 60 que a 120 Hz.
  globo.velocidad -= GRAVEDAD * dt;
  globo.altura += globo.velocidad * dt;

  // Límites: el suelo y el techo frenan al globo
  if (globo.altura <= 0) {
    globo.altura = 0;
    globo.velocidad = Math.max(globo.velocidad, 0);
  }
  if (globo.altura >= TECHO) {
    globo.altura = TECHO;
    globo.velocidad = Math.min(globo.velocidad, 0);
  }

  // A la escena: altura sobre el suelo → posición en Y
  grupoGlobo.position.y = SUELO_Y + RADIO * 1.15 + 1.35 + globo.altura;

  // Un poco de vida: se inclina según qué tan rápido sube o baja
  grupoGlobo.rotation.z = THREE.MathUtils.degToRad(map(globo.velocidad, -VELOCIDAD_MAX, VELOCIDAD_MAX, -8, 8));

  // Azul mientras flota, rojo en el suelo
  const enElSuelo = globo.altura <= 0;
  materialGlobo.color.set(enElSuelo ? ROJO : AZUL);

  alturaContainer.innerText = globo.altura.toFixed(2);
}
// -------------------------------------------------------------------------






// Loop de animación ---------------------------------------------------------------
const timer = new THREE.Timer();   // mide el tiempo entre frames (reemplaza al viejo THREE.Clock)

function animate(timestamp) {
  // Delta time: segundos desde el frame anterior. Tope de 1/30 por si la pestaña estuvo dormida.
  timer.update(timestamp);
  const dt = Math.min(timer.getDelta(), 1 / 30);

  const d = calculateGesto(dt);
  updateGlobo(d, dt);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
// -------------------------------------------------------------------------
