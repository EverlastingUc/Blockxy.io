# Blockxy.io — Architecture

## Runtime layers

1. **Presentation (TypeScript / Three.js):** renderer, camera, input, HUD, block interaction, and scene lifecycle.
2. **World model (Rust):** deterministic world state, coordinates, generation seeds, and simulation rules. Keep rendering types out of this layer.
3. **Voxel compute (C++ → WebAssembly):** isolated, benchmark-driven algorithms such as greedy chunk meshing. Expose a narrow C ABI; keep memory ownership explicit.
4. **Platform (JavaScript / browser APIs):** storage, workers, networking, and browser integration.

## Rules

- TypeScript owns orchestration and validates data crossing module boundaries.
- Rust and C++ modules must have explicit input/output contracts and reproducible tests.
- WebAssembly is an optimization and portability boundary, not a requirement for every feature.
- Keep a working TypeScript fallback for every performance-critical WASM operation.
- Do not couple world simulation to Three.js objects.

## Planned milestones

- [x] Browser client and first interactive voxel island.
- [ ] Chunk-based world storage and rendering.
- [ ] Player collision, gravity, and terrain interaction.
- [ ] Rust world core and deterministic generation tests.
- [ ] C++ chunk meshing benchmark and WASM boundary.
- [ ] Save/load and world settings.
- [ ] Multiplayer architecture and authoritative server simulation.
