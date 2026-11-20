import { describe, expect, it } from "vitest";
import { BlockHistory } from "./history";
import { VoxelWorld } from "./world";
import { BlockId } from "./registry";

describe("block edit history", () => {
  it("undoes and redoes edits", () => {
    const world = new VoxelWorld();
    const history = new BlockHistory(world);
    const position = { x: 1, y: 2, z: 3 };
    history.edit(position, BlockId.Stone);
    history.edit(position, BlockId.Glass);
    expect(world.getBlock(position)).toBe(BlockId.Glass);
    history.undo();
    expect(world.getBlock(position)).toBe(BlockId.Stone);
    history.redo();
    expect(world.getBlock(position)).toBe(BlockId.Glass);
  });

  it("drops redo history after a new edit", () => {
    const world = new VoxelWorld();
    const history = new BlockHistory(world);
    const position = { x: 0, y: 0, z: 0 };
    history.edit(position, BlockId.Stone);
    history.undo();
    history.edit(position, BlockId.Dirt);
    expect(history.canRedo).toBe(false);
    expect(history.size).toBe(1);
  });

  it("enforces the history limit", () => {
    const world = new VoxelWorld();
    const history = new BlockHistory(world, 2);
    history.edit({ x: 0, y: 0, z: 0 }, BlockId.Stone);
    history.edit({ x: 1, y: 0, z: 0 }, BlockId.Stone);
    history.edit({ x: 2, y: 0, z: 0 }, BlockId.Stone);
    expect(history.size).toBe(2);
  });
});
