import { describe, expect, it } from "vitest";
import { buildChunkMesh } from "./mesher";
import { BlockId, CHUNK_HEIGHT, CHUNK_WIDTH, CHUNK_DEPTH } from "../world/registry";
import type { TextureAtlasLayout } from "./atlas";

const atlas: TextureAtlasLayout = new Map(
  ["grass", "dirt", "stone", "cobblestone", "bedrock", "sand", "sandstone", "oak_log", "oak_planks", "leaves", "bricks", "glass", "water", "coal_ore", "iron_ore", "gold_ore", "diamond_ore", "snow", "ice", "wool"]
    .flatMap((name) => Array.from({ length: 6 }, (_, face) => `${name}_${face}`))
    .map((name, index) => [name, { u0: index / 120, v0: 0, u1: (index + 1) / 120, v1: 1 }] as const),
);

function sampleWith(blocks: ReadonlyMap<string, BlockId>) {
  return (x: number, y: number, z: number): BlockId => blocks.get(`${x},${y},${z}`) ?? BlockId.Air;
}

describe("exposed-face mesher", () => {
  it("emits six faces for an isolated voxel", () => {
    const mesh = buildChunkMesh(sampleWith(new Map([["0,0,0", BlockId.Stone]])), atlas);
    expect(mesh.opaque.faceCount).toBe(6);
    expect(mesh.opaque.positions).toHaveLength(72);
    expect(mesh.opaque.indices).toHaveLength(36);
  });

  it("culls the shared face between adjacent opaque blocks", () => {
    const mesh = buildChunkMesh(sampleWith(new Map([
      ["0,0,0", BlockId.Stone], ["1,0,0", BlockId.Dirt],
    ])), atlas);
    expect(mesh.opaque.faceCount).toBe(10);
  });

  it("keeps the opaque face visible beside a transparent block", () => {
    const mesh = buildChunkMesh(sampleWith(new Map([
      ["0,0,0", BlockId.Stone], ["1,0,0", BlockId.Glass],
    ])), atlas);
    expect(mesh.opaque.faceCount).toBe(6);
    expect(mesh.translucent.faceCount).toBe(5);
  });

  it("preserves glass, water, and ice opacity in vertex alpha", () => {
    const glass = buildChunkMesh(sampleWith(new Map([["0,0,0", BlockId.Glass]])), atlas);
    const water = buildChunkMesh(sampleWith(new Map([["0,0,0", BlockId.Water]])), atlas);
    const ice = buildChunkMesh(sampleWith(new Map([["0,0,0", BlockId.Ice]])), atlas);
    expect(glass.translucent.colors[3]).toBeCloseTo(0.42);
    expect(water.translucent.colors[3]).toBeCloseTo(0.72);
    expect(ice.translucent.colors[3]).toBe(1);
  });

  it("accepts neighbour samples beyond the chunk edge", () => {
    const mesh = buildChunkMesh((x, y, z) => {
      if (x === CHUNK_WIDTH - 1 && y === 0 && z === 0) return BlockId.Stone;
      if (x === CHUNK_WIDTH && y === 0 && z === 0) return BlockId.Stone;
      return BlockId.Air;
    }, atlas);
    expect(mesh.opaque.faceCount).toBe(5);
    expect(CHUNK_HEIGHT).toBe(64);
    expect(CHUNK_DEPTH).toBe(16);
  });
});
