import { BlockId, getBlockDefinition } from "./registry";
import { Chunk } from "./chunk";
import { chunkKey, voxelToChunk, voxelToLocal, type ChunkPosition, type VoxelPosition } from "./coordinates";
import { CHUNK_DEPTH, CHUNK_HEIGHT, CHUNK_WIDTH } from "./registry";

export interface BlockChange {
  readonly position: VoxelPosition;
  readonly previous: BlockId;
  readonly current: BlockId;
}

export class VoxelWorld {
  private readonly chunks = new Map<string, Chunk>();
  private readonly dirtyChunks = new Set<string>();

  getChunk(position: ChunkPosition): Chunk | undefined {
    return this.chunks.get(chunkKey(position));
  }

  ensureChunk(position: ChunkPosition): Chunk {
    const key = chunkKey(position);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk();
      this.chunks.set(key, chunk);
      this.dirtyChunks.add(key);
    }
    return chunk;
  }

  getBlock(position: VoxelPosition): BlockId {
    const chunkPosition = voxelToChunk(position);
    return this.getChunk(chunkPosition)?.get(voxelToLocal(position)) ?? BlockId.Air;
  }

  setBlock(position: VoxelPosition, id: BlockId): BlockChange {
    if (id !== BlockId.Air) getBlockDefinition(id);
    const chunkPosition = voxelToChunk(position);
    const local = voxelToLocal(position);
    const previous = this.getBlock(position);
    if (previous === id) return { position, previous, current: id };

    this.ensureChunk(chunkPosition).set(local, id);
    this.dirtyChunks.add(chunkKey(chunkPosition));

    const neighbours: ChunkPosition[] = [];
    if (local.x === 0) neighbours.push({ ...chunkPosition, x: chunkPosition.x - 1 });
    if (local.x === CHUNK_WIDTH - 1) neighbours.push({ ...chunkPosition, x: chunkPosition.x + 1 });
    if (local.y === 0) neighbours.push({ ...chunkPosition, y: chunkPosition.y - 1 });
    if (local.y === CHUNK_HEIGHT - 1) neighbours.push({ ...chunkPosition, y: chunkPosition.y + 1 });
    if (local.z === 0) neighbours.push({ ...chunkPosition, z: chunkPosition.z - 1 });
    if (local.z === CHUNK_DEPTH - 1) neighbours.push({ ...chunkPosition, z: chunkPosition.z + 1 });

    for (const neighbour of neighbours) {
      const key = chunkKey(neighbour);
      if (this.chunks.has(key)) this.dirtyChunks.add(key);
    }

    return { position, previous, current: id };
  }

  deleteChunk(position: ChunkPosition): boolean {
    const key = chunkKey(position);
    this.dirtyChunks.delete(key);
    return this.chunks.delete(key);
  }

  entries(): IterableIterator<[string, Chunk]> {
    return this.chunks.entries();
  }

  consumeDirtyChunks(): ChunkPosition[] {
    const positions = [...this.dirtyChunks].map((key) => {
      const [x, y, z] = key.split(",").map(Number);
      return { x, y, z };
    });
    this.dirtyChunks.clear();
    return positions;
  }

  get loadedChunkCount(): number {
    return this.chunks.size;
  }

  clear(): void {
    this.chunks.clear();
    this.dirtyChunks.clear();
  }
}
