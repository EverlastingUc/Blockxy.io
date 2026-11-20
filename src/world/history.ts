import type { BlockChange, VoxelWorld } from "./world";
import { BlockId } from "./registry";
import type { VoxelPosition } from "./coordinates";

export class BlockHistory {
  private readonly changes: BlockChange[] = [];
  private cursor = 0;

  constructor(private readonly world: VoxelWorld, private readonly limit = 500) {
    if (!Number.isInteger(limit) || limit < 1) throw new RangeError("History limit must be positive");
  }

  edit(position: VoxelPosition, next: BlockId): BlockChange {
    const change = this.world.setBlock(position, next);
    if (change.previous === change.current) return change;
    this.changes.splice(this.cursor);
    this.changes.push(change);
    if (this.changes.length > this.limit) this.changes.shift();
    this.cursor = this.changes.length;
    return change;
  }

  undo(): BlockChange | undefined {
    if (this.cursor === 0) return undefined;
    const change = this.changes[--this.cursor]!;
    this.world.setBlock(change.position, change.previous);
    return change;
  }

  redo(): BlockChange | undefined {
    if (this.cursor >= this.changes.length) return undefined;
    const change = this.changes[this.cursor++]!;
    this.world.setBlock(change.position, change.current);
    return change;
  }

  get canUndo(): boolean { return this.cursor > 0; }
  get canRedo(): boolean { return this.cursor < this.changes.length; }
  get size(): number { return this.changes.length; }

  clear(): void {
    this.changes.length = 0;
    this.cursor = 0;
  }
}
