import './style.css';
import * as THREE from 'three';
console.log("02-A-Flote. 02-Starter.");

/*
  EJERCICIO 02 · A FLOTE (individual · se entrega en clase)

  Piso (mínimo para entregar):
    TODO 1 · En el evento wheel, convierte deltaY a píxeles con deltaMode y súmalo en wheelData.frame.
    TODO 2 · Física: la gravedad baja al globo (× dt) y SOLO el scroll hacia abajo (delta positivo) lo empuja.
    TODO 3 · Azul mientras flota, rojo cuando toca el suelo.

  Extensión 1 · TODO 4 · Muestra los tres datos del gesto: píxeles con signo, velocidad suavizada y dirección.
  Extensión 2 · TODO 5 · Que la dirección contraria también diga algo: el scroll hacia arriba lo hunde,
                        o la fatiga hace que el mismo gesto empuje menos con el tiempo.

  60 fps: un solo requestAnimationFrame, la física con dt y pixelRatio con tope en 2 (ya está).
*/

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

// TODO 2 · Decide la sensación del globo. Empieza con estos números y ajústalos probando con rueda Y con trackpad:
const GRAVEDAD = 0;         // metros por segundo², siempre hacia abajo (prueba con 6)
                            // La gravedad real es 9.8 m/s². ¿Tu globo debe caer como piedra o como pluma?
                            // Con 6, cada segundo pierde 6 m/s de velocidad: más alto = cae más rápido
                            // y hay que scrollear más fuerte; más bajo = flota casi solo.
const EMPUJE = 0;           // metros por segundo que gana por cada píxel de scroll hacia abajo (prueba con 0.014)
const VELOCIDAD_MAX = 6;    // tope de subida: que un trackpad rápido no lo dispare
const TECHO = 2.6;          // altura máxima sobre el suelo (que no salga del cuadro)
const COF = 0.15;           // suavizado de la velocidad del gesto (extensión 1)

const SUELO_Y = -2.6;       // dónde está el suelo en la escena
const RADIO = 0.6;

// TODO 3 · Tus dos colores
const COLOR_FLOTA = "#9a9a9a";
const COLOR_SUELO = "#9a9a9a";
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

const hemiLight = new THREE.HemisphereLight("#ffffff", "#333333", 1.3);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight("#ffffff", 2.2);
keyLight.position.set(3, 4, 6);
scene.add(keyLight);

// El globo: un grupo que sube y baja como una sola pieza.
// Puedes reemplazarlo por tu propio objeto: lo que agregues con grupoGlobo.add() se mueve junto.
const grupoGlobo = new THREE.Group();
grupoGlobo.position.x = 1.8;   // a la derecha, para dejar espacio al texto
scene.add(grupoGlobo);

const materialGlobo = new THREE.MeshStandardMaterial({ color: COLOR_FLOTA, roughness: 0.35 });

const cuerpo = new THREE.Mesh(new THREE.SphereGeometry(RADIO, 32, 24), materialGlobo);
cuerpo.scale.y = 1.15;
grupoGlobo.add(cuerpo);

const hilo = new THREE.Mesh(
  new THREE.CylinderGeometry(0.008, 0.008, 1.2, 6),
  new THREE.MeshStandardMaterial({ color: "#f2f2f2" })
);
hilo.position.y = -RADIO * 1.15 - 0.7;
grupoGlobo.add(hilo);

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
  // TODO 1 · Primero la unidad: lee event.deltaMode ANTES que event.deltaY.
  //   - Guárdalo en wheelData.deltaMode.
  //   - Calcula un factor para convertir a píxeles:
  //       deltaMode 0 = píxeles → factor 1 · 1 = líneas → factor 16 · 2 = páginas → factor window.innerHeight
  //   - wheelData.deltaY = event.deltaY * factor;     (positivo = abajo · negativo = arriba)
  //   - Solo suma: wheelData.frame += wheelData.deltaY;
});
// -------------------------------------------------------------------------






// Datos del gesto: medir una vez por frame ---------------------------------------------------------------
function calculateGesto(dt) {
  const d = wheelData.frame;
  wheelData.frame = 0;   // el siguiente frame empieza en 0

  // TODO 4 · Extensión 1: los tres datos del gesto
  //   gesto.pixeles   → súmale d (con signo)
  //   gesto.velocidad → la cruda es Math.abs(d) / dt (ojo: en el primer frame dt vale 0);
  //                     suavízala con COF, como el puntero de la S08
  //   gesto.direccion → Math.sign(d)

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
  // TODO 2 · Empuje: solo cuando d es POSITIVO (scroll hacia abajo = dedos hacia arriba en trackpad).
  //   Pista: Math.max(0, d) vale d si es positivo, y 0 si es negativo.
  //   globo.velocidad += ... * EMPUJE   (y que no pase de VELOCIDAD_MAX)

  // TODO 2 · Gravedad: siempre resta. Multiplica por dt para que se sienta igual a 60 que a 120 Hz.
  //   globo.velocidad -= ...
  //   globo.altura += globo.velocidad * dt;

  // TODO 5 · Extensión 2: ¿y el scroll hacia arriba? ¿Lo hunde? ¿Y si el empuje se cansa con el tiempo?

  // Límites: el suelo y el techo frenan al globo (ya está)
  if (globo.altura <= 0) {
    globo.altura = 0;
    globo.velocidad = Math.max(globo.velocidad, 0);
  }
  if (globo.altura >= TECHO) {
    globo.altura = TECHO;
    globo.velocidad = Math.min(globo.velocidad, 0);
  }

  // A la escena: altura sobre el suelo → posición en Y (ya está)
  grupoGlobo.position.y = SUELO_Y + RADIO * 1.15 + 1.35 + globo.altura;

  // TODO 3 · Cambia de color: COLOR_SUELO si está en el suelo (altura 0), COLOR_FLOTA si no.
  //   materialGlobo.color.set(...)

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
