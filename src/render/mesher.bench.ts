import { bench, describe } from "vitest";
import { buildChunkMesh } from "./mesher";
import { BlockId } from "../world/registry";
import type { TextureAtlasLayout } from "./atlas";

const names = [
  "grass_top", "grass_side", "dirt", "stone", "glass", "water", "oak_log_end", "oak_log_side",
  "cobblestone", "bedrock", "sand", "sandstone", "oak_planks", "leaves", "bricks",
  "coal_ore", "iron_ore", "gold_ore", "diamond_ore", "snow", "ice", "wool",
];
const atlas: TextureAtlasLayout = new Map(names.map((name, index) => [
  name,
  { u0: index / names.length, v0: 0, u1: (index + 1) / names.length, v1: 1 },
]));
const sample = (x: number, y: number, z: number): BlockId => {
  if (y < 8 && x >= 2 && x < 14 && z >= 2 && z < 14) return y === 7 ? BlockId.Grass : BlockId.Dirt;
  return BlockId.Air;
};

describe("chunk mesher benchmark", () => {
  bench("mesh a deterministic 16x64x16 terrain sample", () => {
    buildChunkMesh(sample, atlas);
  });
});
