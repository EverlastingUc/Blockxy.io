# Blockxy.io

**Blockxy.io** is a browser-based voxel sandbox built with TypeScript, Three.js, and WebAssembly modules.

## Current build

The first playable foundation includes:
- A procedurally shaped voxel island with trees.
- First-person mouse look and WASD movement.
- Block breaking and placement.
- A five-block hotbar.
- Responsive HUD and pause/resume flow.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Use **WASD** to move, **mouse** to look, **Space / Shift** to fly up and down, **left click** to break, **right click** to place, and **1–5** to select a block. Press **Esc** to pause.

## Technology direction

- **TypeScript + Three.js:** browser client, rendering, input, UI, and world presentation.
- **Rust:** deterministic world simulation and world-generation systems, compiled to WebAssembly when the core API stabilizes.
- **C++ / WebAssembly:** performance-critical voxel algorithms (for example, chunk meshing), introduced behind a small typed interface and benchmarked against the TypeScript baseline.
- **JavaScript:** browser platform integration and tooling where plain JS is the simplest fit.

Rust and C++ are planned engine modules; they are not falsely represented as integrated in this initial browser build.

## Development status

This is the initial playable prototype. Chunk streaming, collision/physics, persistence, multiplayer, inventory, crafting, and production WebAssembly integration are not implemented yet.
