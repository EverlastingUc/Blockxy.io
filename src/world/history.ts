import type { BlockChange, VoxelWorld } from "./world";
import { BlockId } from "./registry";
import type { VoxelPosition } from "./coordinates";

export interface BlockEdit {
  readonly position: VoxelPosition;
  readonly next: BlockId;
}

export class BlockHistory {
  private readonly changes: BlockChange[][] = [];
  private cursor = 0;

  constructor(private readonly world: VoxelWorld, private readonly limit = 500) {
    if (!Number.isInteger(limit) || limit < 1) throw new RangeError("History limit must be positive");
  }

  edit(position: VoxelPosition, next: BlockId): BlockChange {
    const change = this.world.setBlock(position, next);
    if (change.previous !== change.current) this.record([change]);
    return change;
  }

  /** Applies a logical operation as one undo/redo step (e.g. fill or paste). */
  editBatch(edits: readonly BlockEdit[]): BlockChange[] {
    const changes: BlockChange[] = [];
    for (const edit of edits) {
      const change = this.world.setBlock(edit.position, edit.next);
      if (change.previous !== change.current) changes.push(change);
    }
    if (changes.length > 0) this.record(changes);
    return changes;
  }

  private record(group: BlockChange[]): void {
    this.changes.splice(this.cursor);
    this.changes.push(group);
    if (this.changes.length > this.limit) this.changes.shift();
    this.cursor = this.changes.length;
  }

  undo(): BlockChange | undefined {
    if (this.cursor === 0) return undefined;
    const group = this.changes[--this.cursor]!;
    for (let index = group.length - 1; index >= 0; index -= 1) {
      const change = group[index]!;
      this.world.setBlock(change.position, change.previous);
    }
    return group[0];
  }

  redo(): BlockChange | undefined {
    if (this.cursor >= this.changes.length) return undefined;
    const group = this.changes[this.cursor++]!;
    for (const change of group) this.world.setBlock(change.position, change.current);
    return group[0];
  }

  get canUndo(): boolean { return this.cursor > 0; }
  get canRedo(): boolean { return this.cursor < this.changes.length; }
  get size(): number { return this.changes.length; }

  clear(): void {
    this.changes.length = 0;
    this.cursor = 0;
  }
}
