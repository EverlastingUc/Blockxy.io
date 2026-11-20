import { describe, expect, it } from "vitest";
import { createSaveV2, mergeDirtyChunks, migrateLegacySave, parseWorldSave, restoreWorld } from "./save";
import { BlockId } from "./registry";
import { VoxelWorld } from "./world";

describe("versioned world saves", () => {
  it("round-trips chunk data using numeric block IDs", () => {
    const world = new VoxelWorld();
    world.setBlock({ x: -1, y: 3, z: 17 }, BlockId.GoldOre);
    const save = parseWorldSave(createSaveV2(world));
    expect(restoreWorld(save).getBlock({ x: -1, y: 3, z: 17 })).toBe(BlockId.GoldOre);
  });

  it("migrates legacy kind-string arrays", () => {
    const save = migrateLegacySave([{ x: 2, y: 1, z: -3, kind: "diamond_ore" }]);
    expect(save.version).toBe(2);
    expect(restoreWorld(save).getBlock({ x: 2, y: 1, z: -3 })).toBe(BlockId.DiamondOre);
  });

  it("rejects invalid IDs, duplicate chunks, and malformed imports", () => {
    expect(() => parseWorldSave({ version: 2, generatorVersion: 1, chunks: [{ position: { x: 0, y: 0, z: 0 }, blocks: [{ index: 0, id: 999 }] }] })).toThrow();
    expect(() => parseWorldSave([{ x: 0, y: 0, z: 0, kind: "invalid" }])).toThrow();
  });

  it("merges only dirty chunk updates and removes emptied chunks", () => {
    const world = new VoxelWorld();
    world.setBlock({ x: 0, y: 0, z: 0 }, BlockId.Stone);
    const first = createSaveV2(world);
    world.setBlock({ x: 0, y: 0, z: 0 }, BlockId.Air);
    const next = mergeDirtyChunks(first, world, [{ x: 0, y: 0, z: 0 }]);
    expect(next.chunks).toHaveLength(0);
  });
});
