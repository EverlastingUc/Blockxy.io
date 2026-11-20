import { chunkKey, type ChunkPosition } from "./coordinates";

export interface StreamChanges {
  readonly load: readonly ChunkPosition[];
  readonly unload: readonly ChunkPosition[];
}

export function desiredChunkPositions(center: ChunkPosition, renderDistance: number, verticalRadius = 0): ChunkPosition[] {
  if (!Number.isInteger(renderDistance) || renderDistance < 1 || renderDistance > 32) {
    throw new RangeError("Render distance must be an integer between 1 and 32");
  }
  if (!Number.isInteger(verticalRadius) || verticalRadius < 0 || verticalRadius > 4) {
    throw new RangeError("Vertical radius must be an integer between 0 and 4");
  }
  const positions: ChunkPosition[] = [];
  for (let y = center.y - verticalRadius; y <= center.y + verticalRadius; y += 1) {
    for (let z = -renderDistance; z <= renderDistance; z += 1) {
      for (let x = -renderDistance; x <= renderDistance; x += 1) {
        if (x * x + z * z > renderDistance * renderDistance) continue;
        positions.push({ x: center.x + x, y, z: center.z + z });
      }
    }
  }
  return positions;
}

export class ChunkStreamer {
  private readonly active = new Map<string, ChunkPosition>();

  reconcile(center: ChunkPosition, renderDistance: number, verticalRadius = 0): StreamChanges {
    const desired = new Map(desiredChunkPositions(center, renderDistance, verticalRadius).map((position) => [chunkKey(position), position]));
    const load: ChunkPosition[] = [];
    const unload: ChunkPosition[] = [];

    for (const [key, position] of desired) {
      if (!this.active.has(key)) load.push(position);
    }
    for (const [key, position] of this.active) {
      if (!desired.has(key)) unload.push(position);
    }

    for (const position of load) this.active.set(chunkKey(position), position);
    for (const position of unload) this.active.delete(chunkKey(position));
    return { load, unload };
  }

  get loadedCount(): number {
    return this.active.size;
  }

  clear(): ChunkPosition[] {
    const positions = [...this.active.values()];
    this.active.clear();
    return positions;
  }
}
