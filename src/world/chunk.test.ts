import { describe, expect, it } from "vitest";
import { Chunk } from "./chunk";
import { BlockId } from "./registry";

describe("Chunk", () => {
  it("stores numeric block IDs and tracks revisions", () => {
    const chunk = new Chunk();
    expect(chunk.get({ x: 2, y: 3, z: 4 })).toBe(BlockId.Air);
    chunk.set({ x: 2, y: 3, z: 4 }, BlockId.Stone);
    expect(chunk.get({ x: 2, y: 3, z: 4 })).toBe(BlockId.Stone);
    expect(chunk.revision).toBe(1);
    chunk.set({ x: 2, y: 3, z: 4 }, BlockId.Stone);
    expect(chunk.revision).toBe(1);
  });

  it("clones storage without sharing the backing array", () => {
    const chunk = new Chunk();
    chunk.set({ x: 0, y: 0, z: 0 }, BlockId.Grass);
    const clone = chunk.clone();
    clone.set({ x: 0, y: 0, z: 0 }, BlockId.Dirt);
    expect(chunk.get({ x: 0, y: 0, z: 0 })).toBe(BlockId.Grass);
  });
});
