import { blockIdFromKey, BlockId } from "./registry";
import { chunkKey, indexToLocal, localVoxelIndex, voxelToChunk, voxelToLocal, type ChunkPosition, type VoxelPosition } from "./coordinates";
import { VoxelWorld } from "./world";

export const SAVE_VERSION = 2;
export const GENERATOR_VERSION = 1;

export interface SavedBlock { readonly index: number; readonly id: BlockId }
export interface SavedChunk { readonly position: ChunkPosition; readonly blocks: readonly SavedBlock[] }
export interface WorldSaveV2 {
  readonly version: 2;
  readonly generatorVersion: number;
  readonly chunks: readonly SavedChunk[];
}
export interface LegacyVoxel {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly kind: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readInteger(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || Math.abs(value) > 1_000_000) {
    throw new TypeError(`Invalid ${name} in world save`);
  }
  return value;
}

function validateLegacy(value: unknown): LegacyVoxel[] {
  if (!Array.isArray(value)) throw new TypeError("Legacy world save must be an array");
  return value.map((entry) => {
    if (!isRecord(entry) || typeof entry.kind !== "string") throw new TypeError("Invalid legacy block");
    blockIdFromKey(entry.kind);
    return {
      x: readInteger(entry.x, "x"),
      y: readInteger(entry.y, "y"),
      z: readInteger(entry.z, "z"),
      kind: entry.kind,
    };
  });
}

export function createSaveV2(world: VoxelWorld): WorldSaveV2 {
  const chunks: SavedChunk[] = [];
  for (const [key, chunk] of world.entries()) {
    const [x, y, z] = key.split(",").map(Number);
    const blocks: SavedBlock[] = [];
    for (let index = 0; index < chunk.blocks.length; index += 1) {
      const id = chunk.blocks[index] as BlockId;
      if (id !== BlockId.Air) blocks.push({ index, id });
    }
    if (blocks.length > 0) chunks.push({ position: { x, y, z }, blocks });
  }
  return { version: SAVE_VERSION, generatorVersion: GENERATOR_VERSION, chunks };
}

export function mergeDirtyChunks(
  previous: WorldSaveV2,
  world: VoxelWorld,
  dirty: readonly ChunkPosition[],
): WorldSaveV2 {
  const chunks = new Map(previous.chunks.map((chunk) => [chunkKey(chunk.position), chunk]));
  for (const position of dirty) {
    const key = chunkKey(position);
    const chunk = world.getChunk(position);
    if (!chunk || chunk.isEmpty()) {
      chunks.delete(key);
      continue;
    }
    const blocks: SavedBlock[] = [];
    for (let index = 0; index < chunk.blocks.length; index += 1) {
      const id = chunk.blocks[index] as BlockId;
      if (id !== BlockId.Air) blocks.push({ index, id });
    }
    chunks.set(key, { position, blocks });
  }
  return { version: SAVE_VERSION, generatorVersion: previous.generatorVersion, chunks: [...chunks.values()] };
}

export function migrateLegacySave(value: unknown): WorldSaveV2 {
  const world = new VoxelWorld();
  for (const voxel of validateLegacy(value)) {
    const position: VoxelPosition = { x: voxel.x, y: voxel.y, z: voxel.z };
    world.setBlock(position, blockIdFromKey(voxel.kind));
  }
  return createSaveV2(world);
}

export function parseWorldSave(value: unknown): WorldSaveV2 {
  if (Array.isArray(value)) return migrateLegacySave(value);
  if (!isRecord(value) || value.version !== SAVE_VERSION || !Array.isArray(value.chunks)) {
    throw new TypeError("Unsupported or invalid world save");
  }
  const generatorVersion = readInteger(value.generatorVersion, "generator version");
  const seen = new Set<string>();
  const chunks: SavedChunk[] = value.chunks.map((rawChunk) => {
    if (!isRecord(rawChunk) || !isRecord(rawChunk.position) || !Array.isArray(rawChunk.blocks)) {
      throw new TypeError("Invalid chunk in world save");
    }
    const position = {
      x: readInteger(rawChunk.position.x, "chunk x"),
      y: readInteger(rawChunk.position.y, "chunk y"),
      z: readInteger(rawChunk.position.z, "chunk z"),
    };
    const key = chunkKey(position);
    if (seen.has(key)) throw new TypeError("Duplicate chunk in world save");
    seen.add(key);
    const indices = new Set<number>();
    const blocks = rawChunk.blocks.map((rawBlock) => {
      if (!isRecord(rawBlock)) throw new TypeError("Invalid block entry");
      const index = readInteger(rawBlock.index, "block index");
      const id = readInteger(rawBlock.id, "block ID");
      if (index < 0 || index >= 16 * 16 * 64 || indices.has(index) || id <= BlockId.Air || id > BlockId.Wool) {
        throw new TypeError("Invalid block entry");
      }
      indices.add(index);
      return { index, id: id as BlockId };
    });
    return { position, blocks };
  });
  return { version: SAVE_VERSION, generatorVersion, chunks };
}

export function restoreWorld(save: WorldSaveV2): VoxelWorld {
  const world = new VoxelWorld();
  for (const savedChunk of save.chunks) {
    const chunk = world.ensureChunk(savedChunk.position);
    for (const block of savedChunk.blocks) {
      chunk.set(indexToLocal(block.index), block.id);
    }
    chunk.dirty = true;
  }
  return world;
}

export function savedBlockAt(save: WorldSaveV2, position: VoxelPosition): BlockId {
  const chunkPosition = voxelToChunk(position);
  const chunk = save.chunks.find((entry) => chunkKey(entry.position) === chunkKey(chunkPosition));
  if (!chunk) return BlockId.Air;
  const index = localVoxelIndex(voxelToLocal(position));
  return chunk.blocks.find((entry) => entry.index === index)?.id ?? BlockId.Air;
}
