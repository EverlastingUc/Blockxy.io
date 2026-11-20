import { describe, expect, it } from "vitest";
import { buildChunkMesh } from "./mesher";
import { BlockId, CHUNK_HEIGHT, CHUNK_WIDTH, CHUNK_DEPTH } from "../world/registry";
import type { TextureAtlasLayout } from "./atlas";

const atlas: TextureAtlasLayout = new Map([
  "grass_top", "grass_side", "dirt", "stone", "glass", "water", "oak_log_end", "oak_log_side",
  "cobblestone", "bedrock", "sand", "sandstone", "oak_planks", "leaves", "bricks",
  "coal_ore", "iron_ore", "gold_ore", "diamond_ore", "snow", "ice", "wool",
].map((name, index) => [name, { u0: index / 32, v0: 0, u1: (index + 1) / 32, v1: 1 }]));

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
    expect(mesh.translucent.faceCount).toBe(6);
  });

  it("accepts neighbour samples beyond the chunk edge", () => {
    const mesh = buildChunkMesh((x, y, z) => {
      if (x === CHUNK_WIDTH - 1 && y === 0 && z === 0) return BlockId.Stone;
      if (x === CHUNK_WIDTH && y === 0 && z === 0) return BlockId.Stone;
      return BlockId.Air;
    }, atlas);
    expect(mesh.opaque.faceCount).toBe(10);
    expect(CHUNK_HEIGHT).toBe(64);
    expect(CHUNK_DEPTH).toBe(16);
  });
});
