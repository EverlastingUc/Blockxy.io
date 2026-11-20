import { BlockId } from "./registry";
import { Chunk } from "./chunk";
import { chunkKey, voxelToChunk, voxelToLocal, type ChunkPosition, type VoxelPosition } from "./coordinates";

export interface BlockChange {
  readonly position: VoxelPosition;
  readonly previous: BlockId;
  readonly current: BlockId;
}

export class VoxelWorld {
  private readonly chunks = new Map<string, Chunk>();

  getChunk(position: ChunkPosition): Chunk | undefined {
    return this.chunks.get(chunkKey(position));
  }

  ensureChunk(position: ChunkPosition): Chunk {
    const key = chunkKey(position);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk();
      this.chunks.set(key, chunk);
    }
    return chunk;
  }

  getBlock(position: VoxelPosition): BlockId {
    const chunkPosition = voxelToChunk(position);
    return this.getChunk(chunkPosition)?.get(voxelToLocal(position)) ?? BlockId.Air;
  }

  setBlock(position: VoxelPosition, id: BlockId): BlockChange {
    const previous = this.getBlock(position);
    if (previous === id) return { position, previous, current: id };
    this.ensureChunk(voxelToChunk(position)).set(voxelToLocal(position), id);
    return { position, previous, current: id };
  }

  deleteChunk(position: ChunkPosition): boolean {
    return this.chunks.delete(chunkKey(position));
  }

  entries(): IterableIterator<[string, Chunk]> {
    return this.chunks.entries();
  }

  get loadedChunkCount(): number {
    return this.chunks.size;
  }

  clear(): void {
    this.chunks.clear();
  }
}
