import { describe, expect, it } from "vitest";
import { VoxelWorld } from "./world";
import { BlockId } from "./registry";

describe("VoxelWorld", () => {
  it("reads missing blocks as air and edits across chunk boundaries", () => {
    const world = new VoxelWorld();
    expect(world.getBlock({ x: 16, y: 5, z: 0 })).toBe(BlockId.Air);
    world.setBlock({ x: 16, y: 5, z: 0 }, BlockId.DiamondOre);
    expect(world.getBlock({ x: 16, y: 5, z: 0 })).toBe(BlockId.DiamondOre);
    expect(world.loadedChunkCount).toBe(1);
  });

  it("keeps negative world coordinates in the correct chunk", () => {
    const world = new VoxelWorld();
    world.setBlock({ x: -1, y: 0, z: -1 }, BlockId.Grass);
    expect(world.getBlock({ x: -1, y: 0, z: -1 })).toBe(BlockId.Grass);
    expect(world.getBlock({ x: 15, y: 0, z: 15 })).toBe(BlockId.Air);
  });
});
