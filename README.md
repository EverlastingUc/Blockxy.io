# Blockxy.io

**Blockxy.io** is a browser-based voxel building sandbox built with TypeScript and Three.js.

## Current creative build

- First-person 3D voxel world with a procedurally generated floating island and trees.
- Creative mode is enabled by default: unlimited block placement and free flight.
- Twenty block types with generated 16×16 pixel-art textures, including grass, dirt, stone, cobblestone, bedrock, sand, sandstone, oak log, planks, leaves, bricks, glass, water, ores, snow, ice, and wool.
- Nine-slot hotbar with direct number selection and mouse-wheel switching.
- Block inventory opened with **E**. Selecting an inventory block equips it in the currently selected hotbar slot.
- Break blocks with left click and place blocks with right click.
- Save the world with **Ctrl+S** and load it with **Ctrl+L**. The current world is also saved automatically when leaving the page, using browser local storage.
- Survival prototype can be toggled with **G**; it enables gravity and jumping.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Controls

| Input | Action |
|---|---|
| WASD | Move |
| Mouse | Look around |
| Space / Shift | Fly up / down in Creative |
| Left click | Break block |
| Right click | Place selected block |
| 1–9 | Select hotbar slot |
| Mouse wheel | Cycle hotbar slots |
| E | Open / close block inventory |
| G | Toggle Creative / Survival |
| Ctrl + S | Save world |
| Ctrl + L | Load saved world |
| Esc | Pause / release mouse |

## Technology direction

- **TypeScript + Three.js:** browser client, rendering, input, UI, voxel presentation.
- **Rust:** planned deterministic world simulation and world-generation systems, compiled to WebAssembly after the core API stabilizes.
- **C++ / WebAssembly:** planned performance-critical voxel algorithms such as chunk meshing, behind a typed interface and benchmarked against TypeScript.

Rust and C++ are not yet integrated into the browser runtime. The current voxel renderer still uses one mesh per block; chunk meshing, large-world streaming, multiplayer, advanced physics, and production WASM integration remain future engineering milestones.

## Voxel engine groundwork (not yet wired into the live scene)

The repository now contains an isolated TypeScript foundation under `src/world` and `src/render`:

- Stable numeric IDs and central material metadata for the original 20 blocks.
- 16×16×64 chunk storage, integer coordinate conversion, and dirty-neighbour tracking.
- Exposed-face mesh generation with atlas UV input and boundary sampling.
- Render-distance chunk selection and a worker-capable meshing executor with a synchronous fallback.
- Version 2 chunk-save conversion, legacy v1 array migration, import validation, and block edit history.
- Vitest suites for the world core and a deterministic mesher benchmark.

**Important:** These are engine modules and tests, not a completed game migration. The current playable scene still uses its original per-block Three.js meshes and v1 local-storage save path. The next task is to integrate the modules into the live scene and verify that all existing controls and textures remain intact.

Run the checks with:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run benchmark
```
