import { describe, expect, it } from "vitest";
import { chunkKey, indexToLocal, localVoxelIndex, voxelToChunk, voxelToLocal } from "./coordinates";

describe("voxel coordinates", () => {
  it("maps positive coordinates to chunks and local positions", () => {
    expect(voxelToChunk({ x: 17, y: 64, z: 31 })).toEqual({ x: 1, y: 1, z: 1 });
    expect(voxelToLocal({ x: 17, y: 64, z: 31 })).toEqual({ x: 1, y: 0, z: 15 });
  });

  it("handles negative coordinates using floor division", () => {
    expect(voxelToChunk({ x: -1, y: -1, z: -16 })).toEqual({ x: -1, y: -1, z: -1 });
    expect(voxelToLocal({ x: -1, y: -1, z: -16 })).toEqual({ x: 15, y: 63, z: 0 });
  });

  it("round-trips every valid local index", () => {
    for (const index of [0, 15, 16, 255, 256, 4095, 16383]) {
      expect(localVoxelIndex(indexToLocal(index))).toBe(index);
    }
  });

  it("creates stable chunk keys", () => {
    expect(chunkKey({ x: -2, y: 0, z: 3 })).toBe("-2,0,3");
  });
});
