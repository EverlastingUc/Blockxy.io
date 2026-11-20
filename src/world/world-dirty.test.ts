import { describe, expect, it } from "vitest";
import { VoxelWorld } from "./world";
import { BlockId } from "./registry";

describe("VoxelWorld dirty tracking", () => {
  it("marks only the edited chunk for an interior edit", () => {
    const world = new VoxelWorld();
    world.ensureChunk({ x: 0, y: 0, z: 0 });
    world.consumeDirtyChunks();
    world.setBlock({ x: 4, y: 4, z: 4 }, BlockId.Stone);
    expect(world.consumeDirtyChunks()).toEqual([{ x: 0, y: 0, z: 0 }]);
  });

  it("marks an already-loaded neighbour when an edge block changes", () => {
    const world = new VoxelWorld();
    world.ensureChunk({ x: 0, y: 0, z: 0 });
    world.ensureChunk({ x: 1, y: 0, z: 0 });
    world.consumeDirtyChunks();
    world.setBlock({ x: 15, y: 4, z: 4 }, BlockId.Stone);
    expect(world.consumeDirtyChunks()).toEqual([
      { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
    ]);
  });

  it("does not mark unloaded neighbours", () => {
    const world = new VoxelWorld();
    world.ensureChunk({ x: 0, y: 0, z: 0 });
    world.consumeDirtyChunks();
    world.setBlock({ x: 0, y: 0, z: 0 }, BlockId.Stone);
    expect(world.consumeDirtyChunks()).toHaveLength(1);
  });
});
