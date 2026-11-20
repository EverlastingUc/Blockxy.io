import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import "./style.css";
import { BlockId, blockIdFromKey, getBlockDefinition } from "./world/registry";
import { VoxelWorld } from "./world/world";
import { BlockHistory } from "./world/history";
import { chunkKey, chunkOrigin, voxelToChunk, type ChunkPosition } from "./world/coordinates";
import { createSaveV2, mergeDirtyChunks, parseWorldSave, restoreWorld, type WorldSaveV2 } from "./world/save";
import { createTextureAtlas } from "./render/atlas-builder";
import { ChunkRenderManager } from "./render/chunk-renderer";

type BlockKind =
  | "grass" | "dirt" | "stone" | "cobblestone" | "bedrock"
  | "sand" | "sandstone" | "oak_log" | "oak_planks" | "leaves"
  | "bricks" | "glass" | "water" | "coal_ore" | "iron_ore"
  | "gold_ore" | "diamond_ore" | "snow" | "ice" | "wool";
type BlockDefinition = { kind: BlockKind; label: string; color: number; category: string };


const blocks: BlockDefinition[] = [
  { kind: "grass", label: "Grass Block", color: 0x70a94a, category: "Nature" },
  { kind: "dirt", label: "Dirt", color: 0x875334, category: "Nature" },
  { kind: "stone", label: "Stone", color: 0x85898a, category: "Stone" },
  { kind: "cobblestone", label: "Cobblestone", color: 0x777b7b, category: "Stone" },
  { kind: "bedrock", label: "Bedrock", color: 0x393b3b, category: "Stone" },
  { kind: "sand", label: "Sand", color: 0xd8c47e, category: "Nature" },
  { kind: "sandstone", label: "Sandstone", color: 0xc9ad70, category: "Stone" },
  { kind: "oak_log", label: "Oak Log", color: 0x916039, category: "Wood" },
  { kind: "oak_planks", label: "Oak Planks", color: 0xb58a55, category: "Wood" },
  { kind: "leaves", label: "Oak Leaves", color: 0x477d45, category: "Nature" },
  { kind: "bricks", label: "Bricks", color: 0x985b4c, category: "Building" },
  { kind: "glass", label: "Glass", color: 0xb9e5e7, category: "Building" },
  { kind: "water", label: "Water", color: 0x397fc1, category: "Nature" },
  { kind: "coal_ore", label: "Coal Ore", color: 0x777b7b, category: "Ores" },
  { kind: "iron_ore", label: "Iron Ore", color: 0x9b8d80, category: "Ores" },
  { kind: "gold_ore", label: "Gold Ore", color: 0x9b8d55, category: "Ores" },
  { kind: "diamond_ore", label: "Diamond Ore", color: 0x6b9991, category: "Ores" },
  { kind: "snow", label: "Snow Block", color: 0xe8f1f2, category: "Nature" },
  { kind: "ice", label: "Ice", color: 0x9bd5e8, category: "Nature" },
  { kind: "wool", label: "White Wool", color: 0xe4e0d5, category: "Building" },
];
const blockByKind = new Map(blocks.map((block) => [block.kind, block]));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91c7e4);
scene.fog = new THREE.Fog(0x91c7e4, 42, 115);
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 220);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.querySelector("#game")!.prepend(renderer.domElement);

const controls = new PointerLockControls(camera, renderer.domElement);
controls.pointerSpeed = 0.8;
scene.add(new THREE.HemisphereLight(0xe5f6ff, 0x65724c, 2));
const sun = new THREE.DirectionalLight(0xfff0d5, 2.4);
sun.position.set(-24, 38, 18);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

const voxelWorld = new VoxelWorld();
const blockHistory = new BlockHistory(voxelWorld);
const keyOf = (x: number, y: number, z: number) => `${x},${y},${z}`;
const pendingSaveChunks = new Map<string, ChunkPosition>();
let lastSaved: WorldSaveV2 | undefined;
let buildingWorld = true;
let renderDistance = 4;
function trackSaveChange(position: { x: number; y: number; z: number }): void {
  const chunk = voxelToChunk(position);
  pendingSaveChunks.set(chunkKey(chunk), chunk);
}
const textureCache = new Map<string, THREE.CanvasTexture>();

function makeTexture(kind: BlockKind, face: number): THREE.CanvasTexture {
  const cacheKey = `${kind}:${face}`;
  const cached = textureCache.get(cacheKey);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 16;
  const ctx = canvas.getContext("2d")!;
  const base = blockByKind.get(kind)!.color;
  const hex = (n: number) => `#${n.toString(16).padStart(6, "0")}`;
  const shade = (color: number, amount: number) => {
    const r = Math.max(0, Math.min(255, ((color >> 16) & 255) + amount));
    const g = Math.max(0, Math.min(255, ((color >> 8) & 255) + amount));
    const b = Math.max(0, Math.min(255, (color & 255) + amount));
    return (r << 16) | (g << 8) | b;
  };
  ctx.fillStyle = hex(base);
  ctx.fillRect(0, 0, 16, 16);
  let seed = kind.split("").reduce((a, c) => a + c.charCodeAt(0), 17) + face * 101;
  const random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const speckles = (count: number, spread = 24) => {
    for (let i = 0; i < count; i++) {
      const v = random() > 0.5 ? spread : -spread;
      ctx.fillStyle = hex(shade(base, v));
      ctx.fillRect(Math.floor(random() * 16), Math.floor(random() * 16), 1 + Math.floor(random() * 2), 1 + Math.floor(random() * 2));
    }
  };

  if (kind === "grass" && face !== 2) {
    ctx.fillStyle = "#795033"; ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = "#8a5b38"; ctx.fillRect(0, 4, 16, 12);
    speckles(22, 15);
    ctx.fillStyle = "#70a94a";
    for (let x = 0; x < 16; x++) ctx.fillRect(x, 0, 1, 2 + Math.floor(random() * 3));
    speckles(10, 17);
  } else if (kind === "grass") {
    speckles(42, 22);
  } else if (kind === "dirt" || kind === "sand" || kind === "snow" || kind === "wool") {
    speckles(kind === "sand" ? 35 : 28, 18);
  } else if (kind === "stone" || kind === "bedrock" || kind === "cobblestone") {
    speckles(42, 30);
    if (kind === "cobblestone") {
      ctx.strokeStyle = "#505656"; ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, 7, 7); ctx.strokeRect(8.5, 0.5, 7, 7);
      ctx.strokeRect(4.5, 8.5, 7, 7); ctx.strokeRect(-3.5, 8.5, 7, 7);
    }
    if (kind === "bedrock") { ctx.fillStyle = "#242626"; for (let i = 0; i < 20; i++) ctx.fillRect(Math.floor(random()*16),Math.floor(random()*16),2,1); }
  } else if (kind === "oak_log") {
    if (face === 2 || face === 3) {
      ctx.fillStyle = "#c39a62"; ctx.fillRect(0,0,16,16);
      ctx.strokeStyle = "#80512f"; ctx.lineWidth = 1;
      ctx.strokeRect(2,2,12,12); ctx.strokeRect(5,5,6,6);
      ctx.fillStyle = "#e0bb7d"; ctx.fillRect(7,7,2,2);
    } else {
      ctx.fillStyle = "#80512f"; ctx.fillRect(0,0,16,16);
      for (let x=2; x<16; x+=4) { ctx.fillStyle = x%2 ? "#a87543" : "#694329"; ctx.fillRect(x,0,2,16); }
      speckles(10,12);
    }
  } else if (kind === "oak_planks") {
    ctx.strokeStyle = "#795536"; ctx.lineWidth = 1;
    [0,5,10,15].forEach(y => { ctx.beginPath();ctx.moveTo(0,y+.5);ctx.lineTo(16,y+.5);ctx.stroke(); });
    speckles(12,13);
  } else if (kind === "leaves") {
    speckles(65, 28);
    ctx.fillStyle = "#294f2c";
    for (let i=0;i<18;i++) if(random()>.45) ctx.fillRect(Math.floor(random()*16),Math.floor(random()*16),1,1);
  } else if (kind === "bricks") {
    ctx.fillStyle = "#d0b49b"; ctx.fillRect(0,0,16,16);
    ctx.fillStyle = "#985b4c";
    for(let y=1;y<16;y+=5){ctx.fillRect(0,y,16,4);ctx.clearRect(y%2?0:4,y,1,4);for(let x=(y%2?0:4);x<16;x+=8)ctx.clearRect(x,y,1,4);}
    ctx.fillStyle="#985b4c";for(let y=0;y<16;y+=5)ctx.fillRect(0,y,16,1);
  } else if (kind === "glass" || kind === "ice") {
    ctx.fillStyle = kind === "glass" ? "#a9dce2" : "#9bd5e8";
    ctx.fillRect(0,0,16,16); ctx.fillStyle = "#e8ffff";
    ctx.fillRect(1,1,2,14);ctx.fillRect(1,1,14,2);
    ctx.fillStyle = "#77b7d0";ctx.fillRect(13,3,2,12);ctx.fillRect(3,13,12,2);
  } else if (kind === "water") {
    ctx.fillStyle="#397fc1";ctx.fillRect(0,0,16,16);ctx.fillStyle="#68b5e0";
    for(let y=2;y<16;y+=5)for(let x=(y%2?1:4);x<16;x+=7)ctx.fillRect(x,y,3,1);
  } else if (kind.endsWith("_ore")) {
    speckles(28,20);
    const ore = kind === "coal_ore" ? "#292d2e" : kind === "iron_ore" ? "#d4b49b" : kind === "gold_ore" ? "#f3cb38" : "#4de5df";
    for(let i=0;i<13;i++){ctx.fillStyle=ore;const x=Math.floor(random()*14),y=Math.floor(random()*14);ctx.fillRect(x,y,2,2);}
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapNearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

const atlasTiles = blocks.flatMap((block) =>
  Array.from({ length: 6 }, (_, face) => ({
    key: `${block.kind}_${face}`,
    source: makeTexture(block.kind, face).image as HTMLCanvasElement,
  })),
);
const textureAtlas = createTextureAtlas(atlasTiles);
const chunkRenderer = new ChunkRenderManager(scene, voxelWorld, textureAtlas.texture, textureAtlas.layout);

function addBlock(x: number, y: number, z: number, kind: BlockKind, recordHistory = false): void {
  const position = { x, y, z };
  if (voxelWorld.getBlock(position) !== BlockId.Air) return;
  const id = blockIdFromKey(kind);
  if (recordHistory) {
    blockHistory.edit(position, id);
    trackSaveChange(position);
  } else {
    voxelWorld.setBlock(position, id);
  }
  if (!buildingWorld) chunkRenderer.rebuildDirty();
}
function removeBlock(key: string): void {
  const [x, y, z] = key.split(",").map(Number);
  const position = { x, y, z };
  if (voxelWorld.getBlock(position) === BlockId.Air) return;
  blockHistory.edit(position, BlockId.Air);
  trackSaveChange(position);
  chunkRenderer.rebuildDirty();
}

function buildStartingWorld(): void {
  for (let x=-12;x<=12;x++) for(let z=-12;z<=12;z++) {
    const d=Math.hypot(x,z);
    if(d>12.4) continue;
    const top=Math.max(0,Math.floor(2.4-d*.13+Math.sin(x*.42)*Math.cos(z*.37)*.65));
    for(let y=-3;y<=top;y++) {
      const kind:BlockKind=y===top?(d>9?"sand":"grass"):y>top-2?"dirt":"stone";
      addBlock(x,y,z,kind);
    }
  }
  for(const [x,z] of [[-5,-4],[6,3],[2,-8]] as const) {
    let top = -4;
    for (let y = 24; y >= -64; y -= 1) {
      if (voxelWorld.getBlock({ x, y, z }) !== BlockId.Air) { top = y; break; }
    }
    for(let y=top+1;y<=top+5;y++)addBlock(x,y,z,"oak_log");
    for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=3;dy<=5;dy++){
      if(Math.abs(dx)+Math.abs(dz)+Math.abs(dy-4)<5)addBlock(x+dx,top+dy,z+dz,"leaves");
    }
  }
}
buildStartingWorld();
buildingWorld = false;
chunkRenderer.updateAroundPlayer(camera.position, renderDistance);

const raycaster=new THREE.Raycaster();
raycaster.far=8;
const hotbarIndices=[0,1,2,3,4,5,6,7,8];
let selectedSlot=0;
let selected=hotbarIndices[selectedSlot];
let creativeMode=true;
let inventoryOpen=false;
let toastTimer=0;
const toast=document.querySelector<HTMLElement>("#toast")!;
const perfOverlay=document.querySelector<HTMLElement>("#perf-overlay")!;
let perfFrames=0;
let perfElapsed=0;
function updatePerformance(delta:number):void{
  if(perfOverlay.classList.contains("hidden"))return;
  perfFrames+=1;
  perfElapsed+=delta;
  if(perfElapsed<0.5)return;
  const fps=Math.round(perfFrames/perfElapsed);
  let blockCount=0;
  for(const [,chunk] of voxelWorld.entries()){
    for(const id of chunk.blocks)if(id!==BlockId.Air)blockCount+=1;
  }
  perfOverlay.textContent=[
    `FPS       ${fps}`,
    `BLOCKS    ${blockCount.toLocaleString()}`,
    `CHUNKS    ${chunkRenderer.renderedChunkCount} rendered / ${voxelWorld.loadedChunkCount} stored`,
    `DISTANCE  ${renderDistance} chunks`,
  ].join("\n");
  perfFrames=0;
  perfElapsed=0;
}
function showToast(message:string):void{
  toast.textContent=message;toast.style.opacity="1";
  window.clearTimeout(toastTimer);
  toastTimer=window.setTimeout(()=>toast.style.opacity="0",1400);
}

const hotbar=document.querySelector<HTMLElement>("#hotbar")!;
const inventory=document.querySelector<HTMLElement>("#inventory")!;
const inventoryGrid=document.querySelector<HTMLElement>("#inventory-grid")!;
const inventoryFilters=document.querySelector<HTMLElement>("#inventory-filters")!;
let activeCategory="All";
const selectedName=document.querySelector<HTMLElement>("#selected-name")!;
const modeLabel=document.querySelector<HTMLElement>("#mode-label")!;
const slotElements:HTMLElement[]=[];
function selectBlock(index:number):void{
  selected=(index+blocks.length)%blocks.length;
  hotbarIndices[selectedSlot]=selected;
  updateSelectedDisplay();
  document.querySelectorAll<HTMLElement>(".inventory-item").forEach(item=>item.classList.toggle("chosen",item.dataset.kind===blocks[selected].kind));
}
function chooseHotbarSlot(slot:number):void{
  selectedSlot=(slot+9)%9;
  selected=hotbarIndices[selectedSlot];
  updateSelectedDisplay();
}
for(let i=0;i<9;i++){
  const slot=document.createElement("div");
  slot.className="slot";
  slot.innerHTML=`<small>${i+1}</small><div class="slot-texture"></div>`;
  slot.title=blocks[i].label;
  slotElements.push(slot);hotbar.append(slot);
}
function buildInventory():void{
  inventoryFilters.innerHTML="";
  const categories=["All",...new Set(blocks.map(block=>block.category))];
  categories.forEach(category=>{
    const filter=document.createElement("button");
    filter.className="inventory-filter"+(activeCategory===category?" selected":"");
    filter.textContent=category;
    filter.addEventListener("click",()=>{activeCategory=category;buildInventory();});
    inventoryFilters.append(filter);
  });
  inventoryGrid.innerHTML="";
  blocks.forEach((block,index)=>{
    if(activeCategory!=="All"&&block.category!==activeCategory)return;
    const item=document.createElement("button");
    item.className="inventory-item";
    item.dataset.kind=block.kind;
    item.innerHTML=`<span class="inventory-swatch"></span><span>${block.label}</span>`;
    const preview=makeTexture(block.kind,2).image as HTMLCanvasElement;
    item.querySelector<HTMLElement>(".inventory-swatch")!.style.backgroundImage="url("+preview.toDataURL()+")";
    item.addEventListener("click",()=>{selectBlock(index);closeInventory();});
    inventoryGrid.append(item);
  });
}
function syncHotbarTextures():void{
  slotElements.forEach((slot,i)=>{
    const block=blocks[hotbarIndices[i]];
    const swatch=slot.querySelector<HTMLElement>(".slot-texture")!;
    const preview=makeTexture(block.kind,2).image as HTMLCanvasElement;
    swatch.style.backgroundImage="url("+preview.toDataURL()+")";
    slot.title=block.label;
  });
}
function openInventory():void{
  inventoryOpen=true;inventory.classList.remove("hidden");
  controls.unlock();buildInventory();selectBlock(selected);
}
function closeInventory():void{
  inventoryOpen=false;inventory.classList.add("hidden");
  if(welcome.classList.contains("hidden")&&pause.classList.contains("hidden"))controls.lock();
}
updateSelectedDisplay();

const welcome=document.querySelector<HTMLElement>("#welcome")!;
const pause=document.querySelector<HTMLElement>("#pause")!;
const hud=document.querySelector<HTMLElement>("#hud")!;
const crosshair=document.querySelector<HTMLElement>("#crosshair")!;
document.querySelector("#play-button")!.addEventListener("click",()=>controls.lock());
document.querySelector("#resume-button")!.addEventListener("click",()=>controls.lock());
document.querySelector("#inventory-close")!.addEventListener("click",closeInventory);
controls.addEventListener("lock",()=>{
  welcome.classList.add("hidden");pause.classList.add("hidden");
  hud.classList.remove("hidden");crosshair.style.display="block";
});
controls.addEventListener("unlock",()=>{
  if(inventoryOpen)return;
  if(welcome.classList.contains("hidden"))pause.classList.remove("hidden");
  crosshair.style.display="none";
});

const keys=new Set<string>();
const playerRadius=.3,eyeHeight=1.62;
let velocityY=0,grounded=false;
function collidesAt(position:THREE.Vector3):boolean{
  const minX=Math.floor(position.x-playerRadius+.5),maxX=Math.floor(position.x+playerRadius+.5);
  const minY=Math.floor(position.y-eyeHeight+.5),maxY=Math.floor(position.y+.1+.5);
  const minZ=Math.floor(position.z-playerRadius+.5),maxZ=Math.floor(position.z+playerRadius+.5);
  for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++)for(let z=minZ;z<=maxZ;z++){
    const id = voxelWorld.getBlock({ x, y, z });
    if(id !== BlockId.Air && getBlockDefinition(id).collidable)return true;
  }
  return false;
}
function updateMode():void{
  modeLabel.textContent=creativeMode?"CREATIVE":"SURVIVAL";
  modeLabel.classList.toggle("creative",creativeMode);
}
function updateSelectedDisplay():void{
  syncHotbarTextures();
  selectedName.textContent=blocks[selected].label;
  slotElements.forEach((slot,i)=>slot.classList.toggle("active",i===selectedSlot));
}
window.addEventListener("keydown",event=>{
  if(["Space","ArrowUp","ArrowDown"].includes(event.code))event.preventDefault();
  keys.add(event.code);
  if(event.code==="KeyE"&&!event.repeat){if(inventoryOpen)closeInventory();else if(controls.isLocked)openInventory();}
  if(event.code==="Escape"&&inventoryOpen){closeInventory();event.stopPropagation();}
  if(event.code==="KeyG"&&!event.repeat){creativeMode=!creativeMode;velocityY=0;updateMode();showToast(creativeMode?"Creative mode enabled":"Survival mode enabled");}
  if(event.code==="F3"){event.preventDefault();perfOverlay.classList.toggle("hidden");perfFrames=0;perfElapsed=0;}
  if(event.code==="BracketLeft"&&!event.repeat){renderDistance=Math.max(1,renderDistance-1);chunkRenderer.updateAroundPlayer(camera.position,renderDistance);showToast("Render distance · "+renderDistance+" chunks");}
  if(event.code==="BracketRight"&&!event.repeat){renderDistance=Math.min(12,renderDistance+1);chunkRenderer.updateAroundPlayer(camera.position,renderDistance);showToast("Render distance · "+renderDistance+" chunks");}
  if(event.code==="KeyS"&&event.ctrlKey){event.preventDefault();saveWorld();}
  if(event.code==="KeyL"&&event.ctrlKey){event.preventDefault();loadWorld();}
  if(event.code==="KeyZ"&&event.ctrlKey&&!event.repeat){event.preventDefault();const change=blockHistory.undo();if(change){trackSaveChange(change.position);chunkRenderer.rebuildDirty();showToast("Undo");}}
  if(event.code==="KeyY"&&event.ctrlKey&&!event.repeat){event.preventDefault();const change=blockHistory.redo();if(change){trackSaveChange(change.position);chunkRenderer.rebuildDirty();showToast("Redo");}}
  if(/^Digit[1-9]$/.test(event.code))chooseHotbarSlot(Number(event.code.slice(5))-1);
});
window.addEventListener("keyup",event=>keys.delete(event.code));
window.addEventListener("blur",()=>keys.clear());
window.addEventListener("wheel",event=>{
  if(!controls.isLocked)return;
  chooseHotbarSlot(selectedSlot+(event.deltaY>0?1:-1));
},{passive:true});
window.addEventListener("contextmenu",event=>event.preventDefault());

window.addEventListener("mousedown",event=>{
  if(!controls.isLocked||inventoryOpen)return;
  raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
  const hit=raycaster.intersectObjects(chunkRenderer.getRaycastTargets(),false)[0];
  if(!hit||!hit.face)return;
  const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
  const blockPoint=hit.point.clone().addScaledVector(normal,-0.001);
  const blockX=Math.floor(blockPoint.x+0.5);
  const blockY=Math.floor(blockPoint.y+0.5);
  const blockZ=Math.floor(blockPoint.z+0.5);
  if(event.button===0){
    removeBlock(keyOf(blockX,blockY,blockZ));
    showToast("Block removed");
  }else if(event.button===2){
    const x=blockX+Math.round(normal.x);
    const y=blockY+Math.round(normal.y);
    const z=blockZ+Math.round(normal.z);
    const player=camera.position;
    if(Math.abs(x-player.x)<.8&&Math.abs(z-player.z)<.8&&Math.abs(y-player.y)<1.8)return;
    addBlock(x,y,z,blocks[selected].kind,true);
  }
});

const SAVE_KEY_V2="blockxy.creative-world.v2";
const SAVE_KEY_V1="blockxy.creative-world.v1";
function persistWorld():void{
  const save = lastSaved
    ? mergeDirtyChunks(lastSaved, voxelWorld, [...pendingSaveChunks.values()])
    : createSaveV2(voxelWorld);
  localStorage.setItem(SAVE_KEY_V2, JSON.stringify(save));
  lastSaved = save;
  pendingSaveChunks.clear();
}
function saveWorld():void{
  try{
    persistWorld();
    const count = [...voxelWorld.entries()].reduce((total, [, chunk]) => total + chunk.blocks.filter((id) => id !== BlockId.Air).length, 0);
    showToast("World saved · "+count.toLocaleString()+" blocks");
  }catch{showToast("Save failed: browser storage is full");}
}
function loadWorld():void{
  try{
    const raw=localStorage.getItem(SAVE_KEY_V2) ?? localStorage.getItem(SAVE_KEY_V1);
    if(!raw){showToast("No saved world found");return;}
    const parsed=parseWorldSave(JSON.parse(raw));
    const restored=restoreWorld(parsed);
    voxelWorld.clear();
    for(const [key,chunk] of restored.entries()){
      const [cx,cy,cz]=key.split(",").map(Number);
      const origin=chunkOrigin({x:cx,y:cy,z:cz});
      chunk.forEachOccupied((local,id)=>voxelWorld.setBlock({
        x:origin.x+local.x,y:origin.y+local.y,z:origin.z+local.z,
      },id));
    }
    blockHistory.clear();
    pendingSaveChunks.clear();
    lastSaved=parsed;
    try{localStorage.setItem(SAVE_KEY_V2,JSON.stringify(parsed));}catch{/* Keep the migrated save in memory until storage is writable. */}
    chunkRenderer.clear();
    chunkRenderer.updateAroundPlayer(camera.position,renderDistance);
    showToast("World loaded · "+parsed.chunks.reduce((sum,chunk)=>sum+chunk.blocks.length,0).toLocaleString()+" blocks");
  }catch{showToast("Could not load this world save");}
}
window.addEventListener("pagehide",()=>{
  try{persistWorld();}catch{/* Browser storage may be unavailable. */}
});
const clock=new THREE.Clock();
function animate():void{
  requestAnimationFrame(animate);
  const frameDelta=clock.getDelta();
  const delta=Math.min(frameDelta,.05);
  if(controls.isLocked&&!inventoryOpen){
    const speed=(keys.has("ControlLeft")?13:creativeMode?8:5)*delta;
    const oldX=camera.position.x,oldZ=camera.position.z;
    if(keys.has("KeyW"))controls.moveForward(speed);
    if(keys.has("KeyS"))controls.moveForward(-speed);
    if(keys.has("KeyA"))controls.moveRight(-speed);
    if(keys.has("KeyD"))controls.moveRight(speed);
    if(creativeMode){
      if(keys.has("Space"))camera.position.y+=speed;
      if(keys.has("ShiftLeft")||keys.has("ShiftRight"))camera.position.y-=speed;
      velocityY=0;
    }else{
      if(collidesAt(camera.position)){camera.position.x=oldX;camera.position.z=oldZ;}
      if(keys.has("Space")&&grounded){velocityY=8;grounded=false;}
      velocityY-=22*delta;
      camera.position.y+=velocityY*delta;
      if(collidesAt(camera.position)){
        camera.position.y-=velocityY*delta;
        if(velocityY<0)grounded=true;
        velocityY=0;
      }else grounded=false;
    }
    camera.position.y=THREE.MathUtils.clamp(camera.position.y,-24,100);
  }
  chunkRenderer.updateAroundPlayer(camera.position,4);
  updatePerformance(frameDelta);
  renderer.render(scene,camera);
}
updateMode();
animate();
window.addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));
});
