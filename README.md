# Blockxy.io

**Blockxy.io** is a browser-based voxel building sandbox built with TypeScript and Three.js.

## Current playable build

- First-person creative voxel world with a generated starter island and trees.
- Creative flight, with a prototype Survival mode enabled using **G**.
- Twenty block types with generated 16×16 textures and six directional texture tiles per block.
- Nine-slot hotbar, number-key selection, and mouse-wheel switching.
- Block inventory opened with **E**.
- Left click breaks blocks; right click places the selected block.
- **Ctrl+S** saves and **Ctrl+L** loads the world. Saves use version 2 chunk data; older v1 local saves are migrated on load.
- **Ctrl+Z / Ctrl+Y** undo and redo single-block edits.
- **F3** toggles the performance overlay.

## Voxel engine

The live scene now uses the TypeScript voxel world and chunk renderer:

- World data is stored as numeric block IDs in 16×16×64 chunks, independently of Three.js.
- Exposed-face meshing removes internal block faces and samples neighbour borders.
- A runtime texture atlas packs the existing face-specific textures.
- Chunk visuals are streamed around the player and rebuilt when active chunks become dirty.
- Meshing runs through a Web Worker when available, with a main-thread fallback.
- Chunk save v2 serializes numeric IDs and merges changed chunks; legacy v1 saves are migrated.
- The F3 overlay reports FPS, stored block count, rendered/stored chunks, and configured render distance.

The repository also contains bounded selection, fill, replace, copy, paste, and grouped undo/redo logic. Those selection operations are tested but are not yet exposed through in-game selection controls.

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
| Ctrl + Z | Undo last block edit |
| Ctrl + Y | Redo last block edit |
| F3 | Toggle performance overlay |
| Esc | Pause / release mouse |

## Verification

GitHub Actions runs:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

A deterministic mesher benchmark is available with:

```bash
npm run benchmark
```

Automated CI checks validate the code and unit tests. Manual browser gameplay regression testing and representative performance measurements are still required before calling the engine migration complete.

## Technology direction

- **TypeScript + Three.js:** browser client, world orchestration, rendering, input, and UI.
- **Web Workers:** background chunk meshing with a tested main-thread fallback.
- **Rust / WebAssembly:** planned for deterministic world generation and simulation after the TypeScript world API stabilizes.
- **C++ / WebAssembly:** only for performance-critical algorithms if benchmarks demonstrate a measurable benefit.

Rust, C++, and WASM are not yet integrated. Public multiplayer, cloud saves, advanced Survival mechanics, and creator publishing remain future milestones.

See [GAME_ROADMAP.md](./GAME_ROADMAP.md) for the master implementation plan.
