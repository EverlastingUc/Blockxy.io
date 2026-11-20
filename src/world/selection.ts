import { BlockId } from "./registry";
import type { VoxelPosition } from "./coordinates";
import type { VoxelWorld } from "./world";
import type { BlockEdit, BlockHistory } from "./history";

export interface SelectionBounds {
  readonly min: VoxelPosition;
  readonly max: VoxelPosition;
}

export interface SelectionBlock {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly id: BlockId;
}

export interface VoxelBlueprint {
  readonly size: VoxelPosition;
  readonly blocks: readonly SelectionBlock[];
}

export interface SelectionEditResult {
  readonly changed: number;
  readonly skipped: number;
}

const DEFAULT_MAX_VOLUME = 65_536;

function assertPosition(position: VoxelPosition): void {
  if (![position.x, position.y, position.z].every(Number.isSafeInteger)) {
    throw new RangeError("Selection coordinates must be safe integers");
  }
}

export function normalizeSelection(bounds: SelectionBounds): SelectionBounds {
  assertPosition(bounds.min);
  assertPosition(bounds.max);
  return {
    min: {
      x: Math.min(bounds.min.x, bounds.max.x),
      y: Math.min(bounds.min.y, bounds.max.y),
      z: Math.min(bounds.min.z, bounds.max.z),
    },
    max: {
      x: Math.max(bounds.min.x, bounds.max.x),
      y: Math.max(bounds.min.y, bounds.max.y),
      z: Math.max(bounds.min.z, bounds.max.z),
    },
  };
}

export function selectionSize(bounds: SelectionBounds): VoxelPosition {
  const normalized = normalizeSelection(bounds);
  return {
    x: normalized.max.x - normalized.min.x + 1,
    y: normalized.max.y - normalized.min.y + 1,
    z: normalized.max.z - normalized.min.z + 1,
  };
}

function assertVolume(bounds: SelectionBounds, maxVolume: number): VoxelPosition {
  if (!Number.isSafeInteger(maxVolume) || maxVolume < 1) throw new RangeError("Maximum selection volume must be positive");
  const size = selectionSize(bounds);
  if (size.x * size.y * size.z > maxVolume) throw new RangeError("Selection is too large");
  return size;
}

export function copySelection(
  world: VoxelWorld,
  bounds: SelectionBounds,
  maxVolume = DEFAULT_MAX_VOLUME,
): VoxelBlueprint {
  const normalized = normalizeSelection(bounds);
  const size = assertVolume(normalized, maxVolume);
  const blocks: SelectionBlock[] = [];
  for (let y = 0; y < size.y; y += 1) {
    for (let z = 0; z < size.z; z += 1) {
      for (let x = 0; x < size.x; x += 1) {
        const id = world.getBlock({
          x: normalized.min.x + x,
          y: normalized.min.y + y,
          z: normalized.min.z + z,
        });
        if (id !== BlockId.Air) blocks.push({ x, y, z, id });
      }
    }
  }
  return { size, blocks };
}

export function fillSelection(
  history: BlockHistory,
  bounds: SelectionBounds,
  id: BlockId,
  maxVolume = DEFAULT_MAX_VOLUME,
): SelectionEditResult {
  const normalized = normalizeSelection(bounds);
  const size = assertVolume(normalized, maxVolume);
  const edits: BlockEdit[] = [];
  let skipped = 0;
  for (let y = 0; y < size.y; y += 1) {
    for (let z = 0; z < size.z; z += 1) {
      for (let x = 0; x < size.x; x += 1) {
        const position = {
          x: normalized.min.x + x,
          y: normalized.min.y + y,
          z: normalized.min.z + z,
        };
        edits.push({ position, next: id });
      }
    }
  }
  const changed = history.editBatch(edits).length;
  skipped = size.x * size.y * size.z - changed;
  return { changed, skipped };
}

export function replaceSelection(
  world: VoxelWorld,
  history: BlockHistory,
  bounds: SelectionBounds,
  from: BlockId,
  to: BlockId,
  maxVolume = DEFAULT_MAX_VOLUME,
): SelectionEditResult {
  const normalized = normalizeSelection(bounds);
  const size = assertVolume(normalized, maxVolume);
  const edits = [];
  let skipped = 0;
  for (let y = 0; y < size.y; y += 1) {
    for (let z = 0; z < size.z; z += 1) {
      for (let x = 0; x < size.x; x += 1) {
        const position = {
          x: normalized.min.x + x,
          y: normalized.min.y + y,
          z: normalized.min.z + z,
        };
        if (world.getBlock(position) !== from) {
          skipped += 1;
          continue;
        }
        edits.push({ position, next: to });
      }
    }
  }
  const changed = history.editBatch(edits).length;
  return { changed, skipped: skipped + edits.length - changed };
}

/** Pastes occupied blueprint voxels; empty blueprint cells never erase destination blocks. */
export function pasteSelection(
  history: BlockHistory,
  blueprint: VoxelBlueprint,
  origin: VoxelPosition,
  maxVolume = DEFAULT_MAX_VOLUME,
): SelectionEditResult {
  assertPosition(origin);
  const volume = blueprint.size.x * blueprint.size.y * blueprint.size.z;
  if (!Number.isSafeInteger(maxVolume) || maxVolume < 1 ||
      ![blueprint.size.x, blueprint.size.y, blueprint.size.z].every((value) => Number.isSafeInteger(value) && value > 0) ||
      !Number.isSafeInteger(volume) || volume > maxVolume || blueprint.blocks.length > volume) {
    throw new RangeError("Invalid or oversized blueprint");
  }
  const edits = [];
  const seen = new Set<string>();
  for (const block of blueprint.blocks) {
    if (![block.x, block.y, block.z].every(Number.isSafeInteger) ||
        block.x < 0 || block.x >= blueprint.size.x ||
        block.y < 0 || block.y >= blueprint.size.y ||
        block.z < 0 || block.z >= blueprint.size.z ||
        !Number.isInteger(block.id) || block.id <= BlockId.Air || block.id > BlockId.Wool) {
      throw new TypeError("Blueprint contains an invalid block");
    }
    const key = `${block.x},${block.y},${block.z}`;
    if (seen.has(key)) throw new TypeError("Blueprint contains duplicate block positions");
    seen.add(key);
    const position = {
      x: origin.x + block.x,
      y: origin.y + block.y,
      z: origin.z + block.z,
    };
    assertPosition(position);
    edits.push({ position, next: block.id });
  }
  const changed = history.editBatch(edits).length;
  return { changed, skipped: edits.length - changed };
}
