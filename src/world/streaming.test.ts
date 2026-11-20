import { describe, expect, it } from "vitest";
import { ChunkStreamer, desiredChunkPositions } from "./streaming";

describe("chunk streaming", () => {
  it("creates a circular horizontal render area", () => {
    const positions = desiredChunkPositions({ x: 0, y: 0, z: 0 }, 2);
    expect(positions).toHaveLength(13);
    expect(positions).not.toContainEqual({ x: 2, y: 0, z: 2 });
  });

  it("loads and unloads only chunks crossing the render boundary", () => {
    const streamer = new ChunkStreamer();
    const first = streamer.reconcile({ x: 0, y: 0, z: 0 }, 1);
    expect(first.load.length).toBe(5);
    expect(first.unload).toHaveLength(0);
    const second = streamer.reconcile({ x: 1, y: 0, z: 0 }, 1);
    expect(second.load.length).toBeGreaterThan(0);
    expect(second.unload.length).toBeGreaterThan(0);
    expect(streamer.loadedCount).toBe(5);
  });

  it("supports vertical chunk radius", () => {
    expect(desiredChunkPositions({ x: 0, y: 0, z: 0 }, 1, 1)).toHaveLength(15);
  });
});
