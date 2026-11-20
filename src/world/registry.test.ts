import { describe, expect, it } from "vitest";
import { BLOCKS, BlockId, getBlockDefinition, blockIdFromKey } from "./registry";

describe("block registry", () => {
  it("assigns stable numeric IDs to all twenty existing blocks", () => {
    expect(BLOCKS).toHaveLength(20);
    expect(blockIdFromKey("grass")).toBe(BlockId.Grass);
    expect(blockIdFromKey("wool")).toBe(BlockId.Wool);
    expect(getBlockDefinition(BlockId.OakLog).texture.top).toBe("oak_log_end");
  });

  it("defines rendering and gameplay properties centrally", () => {
    expect(getBlockDefinition(BlockId.Glass).renderLayer).toBe("translucent");
    expect(getBlockDefinition(BlockId.Water).collidable).toBe(false);
    expect(getBlockDefinition(BlockId.Bedrock).hardness).toBe(-1);
  });

  it("rejects unknown IDs and keys", () => {
    expect(() => getBlockDefinition(999)).toThrow(RangeError);
    expect(() => blockIdFromKey("unknown")).toThrow(RangeError);
  });
});
