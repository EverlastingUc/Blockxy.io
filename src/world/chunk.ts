import { BlockId, CHUNK_DEPTH, CHUNK_HEIGHT, CHUNK_WIDTH } from "./registry";
import { indexToLocal, localVoxelIndex, type LocalPosition } from "./coordinates";

export const CHUNK_VOLUME = CHUNK_WIDTH * CHUNK_DEPTH * CHUNK_HEIGHT;

export class Chunk {
  readonly blocks = new Uint16Array(CHUNK_VOLUME);
  revision = 0;
  dirty = true;

  get(position: LocalPosition): BlockId {
    return this.blocks[localVoxelIndex(position)] as BlockId;
  }

  set(position: LocalPosition, id: BlockId): BlockId {
    const index = localVoxelIndex(position);
    const previous = this.blocks[index] as BlockId;
    if (previous !== id) {
      this.blocks[index] = id;
      this.revision += 1;
      this.dirty = true;
    }
    return previous;
  }

  isEmpty(): boolean {
    return this.blocks.every((id) => id === BlockId.Air);
  }

  forEachOccupied(visitor: (position: LocalPosition, id: BlockId) => void): void {
    for (let index = 0; index < this.blocks.length; index += 1) {
      const id = this.blocks[index] as BlockId;
      if (id !== BlockId.Air) visitor(indexToLocal(index), id);
    }
  }

  clone(): Chunk {
    const copy = new Chunk();
    copy.blocks.set(this.blocks);
    copy.revision = this.revision;
    copy.dirty = this.dirty;
    return copy;
  }
}
