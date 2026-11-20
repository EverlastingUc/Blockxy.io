import { describe, expect, it } from "vitest";
import { BlockHistory } from "./history";
import { BlockId } from "./registry";
import { copySelection, fillSelection, pasteSelection, replaceSelection } from "./selection";
import { VoxelWorld } from "./world";

describe("creative selection operations", () => {
  it("copies sparse voxel data relative to the selected origin", () => {
    const world = new VoxelWorld();
    world.setBlock({ x: -2, y: 4, z: 7 }, BlockId.Stone);
    world.setBlock({ x: -1, y: 5, z: 8 }, BlockId.Glass);
    const blueprint = copySelection(world, {
      min: { x: -2, y: 4, z: 7 },
      max: { x: -1, y: 5, z: 8 },
    });
    expect(blueprint.size).toEqual({ x: 2, y: 2, z: 2 });
    expect(blueprint.blocks).toEqual([
      { x: 0, y: 0, z: 0, id: BlockId.Stone },
      { x: 1, y: 1, z: 1, id: BlockId.Glass },
    ]);
  });

  it("fills and replaces blocks through undoable history", () => {
    const world = new VoxelWorld();
    const history = new BlockHistory(world);
    const bounds = { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 0, z: 1 } };
    expect(fillSelection(history, bounds, BlockId.Dirt)).toEqual({ changed: 4, skipped: 0 });
    expect(replaceSelection(world, history, bounds, BlockId.Dirt, BlockId.Sand)).toEqual({ changed: 4, skipped: 0 });
    expect(world.getBlock({ x: 1, y: 0, z: 1 })).toBe(BlockId.Sand);
    history.undo();
    expect(world.getBlock({ x: 1, y: 0, z: 1 })).toBe(BlockId.Dirt);
    history.redo();
    expect(world.getBlock({ x: 1, y: 0, z: 1 })).toBe(BlockId.Sand);
  });

  it("pastes copied structures at a new origin and supports undo", () => {
    const world = new VoxelWorld();
    world.setBlock({ x: 2, y: 3, z: 4 }, BlockId.OakLog);
    world.setBlock({ x: 3, y: 3, z: 4 }, BlockId.Leaves);
    const blueprint = copySelection(world, {
      min: { x: 2, y: 3, z: 4 },
      max: { x: 3, y: 3, z: 4 },
    });
    const history = new BlockHistory(world);
    expect(pasteSelection(history, blueprint, { x: 20, y: 10, z: -4 })).toEqual({ changed: 2, skipped: 0 });
    expect(world.getBlock({ x: 20, y: 10, z: -4 })).toBe(BlockId.OakLog);
    expect(world.getBlock({ x: 21, y: 10, z: -4 })).toBe(BlockId.Leaves);
    history.undo();
    expect(world.getBlock({ x: 20, y: 10, z: -4 })).toBe(BlockId.Air);
  });

  it("rejects oversized selections and malformed blueprints", () => {
    const world = new VoxelWorld();
    expect(() => copySelection(world, {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 100, y: 100, z: 100 },
    }, 100)).toThrow(RangeError);
    expect(() => pasteSelection(new BlockHistory(world), {
      size: { x: 1, y: 1, z: 1 },
      blocks: [{ x: 1, y: 0, z: 0, id: BlockId.Stone }],
    }, { x: 0, y: 0, z: 0 })).toThrow(TypeError);
  });
});
