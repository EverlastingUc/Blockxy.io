import { describe, expect, it } from "vitest";
import { BlockId } from "../world/registry";
import { VoxelWorld } from "../world/world";
import { createPaddedChunk, isPaddedChunk } from "./chunk-renderer";

const paddedIndex = (x: number, y: number, z: number): number => x + 18 * (z + 18 * y);

describe("chunk renderer data bridge", () => {
  it("copies the chunk and all six neighbour borders into the worker buffer", () => {
    const world = new VoxelWorld();
    world.setBlock({ x: 0, y: 0, z: 0 }, BlockId.Stone);
    world.setBlock({ x: 15, y: 0, z: 0 }, BlockId.Dirt);
    world.setBlock({ x: 16, y: 0, z: 0 }, BlockId.Glass);
    world.setBlock({ x: -1, y: 0, z: 0 }, BlockId.Sand);
    world.setBlock({ x: 0, y: 64, z: 0 }, BlockId.Water);
    world.setBlock({ x: 0, y: -1, z: 0 }, BlockId.Snow);
    world.setBlock({ x: 0, y: 0, z: 16 }, BlockId.OakLog);
    world.setBlock({ x: 0, y: 0, z: -1 }, BlockId.Leaves);

    const padded = createPaddedChunk(world, { x: 0, y: 0, z: 0 });
    expect(isPaddedChunk(padded)).toBe(true);
    expect(padded[paddedIndex(1, 1, 1)]).toBe(BlockId.Stone);
    expect(padded[paddedIndex(16, 1, 1)]).toBe(BlockId.Dirt);
    expect(padded[paddedIndex(17, 1, 1)]).toBe(BlockId.Glass);
    expect(padded[paddedIndex(0, 1, 1)]).toBe(BlockId.Sand);
    expect(padded[paddedIndex(1, 65, 1)]).toBe(BlockId.Water);
    expect(padded[paddedIndex(1, 0, 1)]).toBe(BlockId.Snow);
    expect(padded[paddedIndex(1, 1, 17)]).toBe(BlockId.OakLog);
    expect(padded[paddedIndex(1, 1, 0)]).toBe(BlockId.Leaves);
  });

  it("keeps empty neighbour samples as air", () => {
    const padded = createPaddedChunk(new VoxelWorld(), { x: -2, y: 0, z: 3 });
    expect(isPaddedChunk(padded)).toBe(true);
    expect(padded.every((id) => id === BlockId.Air)).toBe(true);
  });

  it("rejects buffers with a mismatched worker contract length", () => {
    expect(isPaddedChunk(new Uint16Array(12))).toBe(false);
  });
});
