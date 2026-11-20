import { describe, expect, it } from "vitest";
import { buildAtlasLayout } from "./atlas-builder";
import { BLOCKS, type BlockFace } from "../world/registry";

describe("texture atlas layout", () => {
  it("assigns unique normalized UV rectangles with a gutter", () => {
    const result = buildAtlasLayout(["stone_top", "grass_top", "log_end"], {
      tileSize: 16,
      gutter: 1,
      columns: 2,
    });
    expect(result.width).toBe(36);
    expect(result.height).toBe(36);
    expect(result.layout.get("stone_top")).toEqual({
      u0: 1 / 36, v0: 1 / 36, u1: 17 / 36, v1: 17 / 36,
    });
    expect(result.layout.get("log_end")?.v0).toBe(19 / 36);
  });

  it("allocates a distinct atlas tile for every face of all twenty blocks", () => {
    const faces: readonly BlockFace[] = ["right", "left", "top", "bottom", "front", "back"];
    const keys = BLOCKS.flatMap((block) => faces.map((face) => block.texture[face]));
    const result = buildAtlasLayout(keys);
    expect(keys).toHaveLength(120);
    expect(result.layout.size).toBe(120);
    for (const key of keys) expect(result.layout.has(key)).toBe(true);
  });

  it("rejects duplicate texture keys and invalid dimensions", () => {
    expect(() => buildAtlasLayout(["stone", "stone"])).toThrow(TypeError);
    expect(() => buildAtlasLayout(["stone"], { columns: 0 })).toThrow(RangeError);
    expect(() => buildAtlasLayout(["stone"], { gutter: -1 })).toThrow(RangeError);
  });

  it("returns a valid empty atlas layout", () => {
    const result = buildAtlasLayout([]);
    expect(result.layout.size).toBe(0);
    expect(result.width).toBe(216);
    expect(result.height).toBe(18);
  });
});
