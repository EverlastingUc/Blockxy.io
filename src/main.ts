import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import "./style.css";

type BlockKind = "grass" | "dirt" | "stone" | "wood" | "sand";
type Voxel = { mesh: THREE.Mesh; kind: BlockKind };

const palette: { kind: BlockKind; color: number; label: string }[] = [
  { kind: "grass", color: 0x79a94b, label: "Grass" },
  { kind: "dirt", color: 0x96613d, label: "Dirt" },
  { kind: "stone", color: 0x858b8d, label: "Stone" },
  { kind: "wood", color: 0x9a6a3f, label: "Wood" },
  { kind: "sand", color: 0xd8c47e, label: "Sand" },
];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bc7d2);
scene.fog = new THREE.Fog(0x9bc7d2, 22, 62);
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 120);
camera.position.set(0, 3.2, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
document.querySelector("#game")!.prepend(renderer.domElement);

const controls = new PointerLockControls(camera, renderer.domElement);
controls.pointerSpeed = 0.8;
scene.add(new THREE.HemisphereLight(0xe5f6ff, 0x64724a, 2));
const sun = new THREE.DirectionalLight(0xfff1d2, 2.5);
sun.position.set(-12, 22, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const materials = new Map<BlockKind, THREE.MeshStandardMaterial>(
  palette.map((block) => [block.kind, new THREE.MeshStandardMaterial({ color: block.color, roughness: 1 })]),
);
const voxels = new Map<string, Voxel>();
const keyOf = (x: number, y: number, z: number) => `${x},${y},${z}`;

function addBlock(x: number, y: number, z: number, kind: BlockKind): void {
  const key = keyOf(x, y, z);
  if (voxels.has(key)) return;
  const mesh = new THREE.Mesh(geometry, materials.get(kind)!);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.voxelKey = key;
  scene.add(mesh);
  voxels.set(key, { mesh, kind });
}

function removeBlock(key: string): void {
  const voxel = voxels.get(key);
  if (!voxel) return;
  scene.remove(voxel.mesh);
  voxels.delete(key);
}

function makeIsland(): void {
  for (let x = -9; x <= 9; x++) {
    for (let z = -9; z <= 9; z++) {
      const distance = Math.hypot(x, z);
      if (distance > 9.5 || (distance > 8.2 && Math.sin(x * 2.1) * Math.cos(z * 1.7) > 0.25)) continue;
      const height = Math.max(0, Math.floor(2.1 - distance * 0.16 + Math.sin(x * 0.55) * Math.cos(z * 0.42) * 0.55));
      for (let y = -2; y <= height; y++) {
        const kind: BlockKind = y === height ? (height === 0 && distance > 7 ? "sand" : "grass") : y > height - 2 ? "dirt" : "stone";
        addBlock(x, y, z, kind);
      }
    }
  }
  // A few trees make the starting island readable and give players materials to build with.
  for (const [x, z] of [[-4, -3], [5, 2], [2, -6]] as const) {
    const ground = [...voxels.values()].filter((v) => v.mesh.position.x === x && v.mesh.position.z === z)
      .reduce((top, v) => Math.max(top, v.mesh.position.y), -2);
    for (let y = ground + 1; y <= ground + 4; y++) addBlock(x, y, z, "wood");
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
      for (let dy = 2; dy <= 4; dy++) {
        if (Math.abs(dx) + Math.abs(dz) + Math.abs(dy - 3) < 5) {
          const leaf = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x477d45, roughness: 1 }));
          leaf.position.set(x + dx, ground + dy, z + dz);
          leaf.castShadow = true;
          leaf.userData.decoration = true;
          scene.add(leaf);
        }
      }
    }
  }
}

makeIsland();

const raycaster = new THREE.Raycaster();
raycaster.far = 7;
let selected = 0;
let toastTimer = 0;
const toast = document.querySelector<HTMLElement>("#toast")!;
function showToast(message: string): void {
  toast.textContent = message;
  toast.style.opacity = "1";
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (toast.style.opacity = "0"), 1300);
}

function updateHotbar(): void {
  document.querySelectorAll<HTMLElement>(".slot").forEach((slot, index) => {
    slot.classList.toggle("active", index === selected);
  });
}
const hotbar = document.querySelector<HTMLElement>("#hotbar")!;
palette.forEach((block, index) => {
  const slot = document.createElement("div");
  slot.className = "slot";
  slot.innerHTML = `<small>${index + 1}</small><div class="swatch" style="background:#${block.color.toString(16)}"></div>`;
  hotbar.append(slot);
});
updateHotbar();

const welcome = document.querySelector<HTMLElement>("#welcome")!;
const pause = document.querySelector<HTMLElement>("#pause")!;
const hud = document.querySelector<HTMLElement>("#hud")!;
const crosshair = document.querySelector<HTMLElement>("#crosshair")!;
document.querySelector("#play-button")!.addEventListener("click", () => controls.lock());
document.querySelector("#resume-button")!.addEventListener("click", () => controls.lock());

controls.addEventListener("lock", () => {
  welcome.classList.add("hidden");
  pause.classList.add("hidden");
  hud.classList.remove("hidden");
  crosshair.style.display = "block";
});
controls.addEventListener("unlock", () => {
  if (welcome.classList.contains("hidden")) pause.classList.remove("hidden");
  crosshair.style.display = "none";
});

const keys = new Set<string>();
window.addEventListener("keydown", (event) => {
  keys.add(event.code);
  if (/^Digit[1-5]$/.test(event.code)) {
    selected = Number(event.code.slice(5)) - 1;
    updateHotbar();
  }
});
window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("blur", () => keys.clear());

window.addEventListener("contextmenu", (event) => event.preventDefault());
window.addEventListener("mousedown", (event) => {
  if (!controls.isLocked) return;
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = raycaster.intersectObjects(
    [...voxels.values()].map((voxel) => voxel.mesh),
    false,
  );
  const hit = hits[0];
  if (!hit || !hit.face) return;
  const key = hit.object.userData.voxelKey as string;
  if (event.button === 0) {
    const voxel = voxels.get(key);
    if (voxel && voxel.mesh.position.y > -2) {
      removeBlock(key);
      showToast("Block broken");
    }
  } else if (event.button === 2) {
    const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    const target = hit.object.position.clone().add(normal);
    const x = Math.round(target.x), y = Math.round(target.y), z = Math.round(target.z);
    const player = camera.position;
    if (Math.abs(x - player.x) < 1 && Math.abs(z - player.z) < 1 && Math.abs(y - player.y) < 2) return;
    addBlock(x, y, z, palette[selected].kind);
  }
});

const clock = new THREE.Clock();
const velocity = new THREE.Vector3();
function animate(): void {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  if (controls.isLocked) {
    const speed = (keys.has("ControlLeft") ? 10 : 5) * delta;
    if (keys.has("KeyW")) controls.moveForward(speed);
    if (keys.has("KeyS")) controls.moveForward(-speed);
    if (keys.has("KeyA")) controls.moveRight(-speed);
    if (keys.has("KeyD")) controls.moveRight(speed);
    if (keys.has("Space")) camera.position.y += speed;
    if (keys.has("ShiftLeft") || keys.has("ShiftRight")) camera.position.y -= speed;
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, -1, 24);
  }
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
});
