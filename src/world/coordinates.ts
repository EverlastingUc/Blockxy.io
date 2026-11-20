import { CHUNK_DEPTH, CHUNK_HEIGHT, CHUNK_WIDTH } from "./registry";

export interface VoxelPosition { readonly x: number; readonly y: number; readonly z: number }
export interface ChunkPosition { readonly x: number; readonly y: number; readonly z: number }
export interface LocalPosition { readonly x: number; readonly y: number; readonly z: number }

function assertInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value)) throw new RangeError(`${name} must be a safe integer`);
}

function floorDiv(value: number, divisor: number): number {
  return Math.floor(value / divisor);
}

function positiveMod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

export function voxelToChunk(position: VoxelPosition): ChunkPosition {
  assertInteger(position.x, "x"); assertInteger(position.y, "y"); assertInteger(position.z, "z");
  return {
    x: floorDiv(position.x, CHUNK_WIDTH),
    y: floorDiv(position.y, CHUNK_HEIGHT),
    z: floorDiv(position.z, CHUNK_DEPTH),
  };
}

export function voxelToLocal(position: VoxelPosition): LocalPosition {
  assertInteger(position.x, "x"); assertInteger(position.y, "y"); assertInteger(position.z, "z");
  return {
    x: positiveMod(position.x, CHUNK_WIDTH),
    y: positiveMod(position.y, CHUNK_HEIGHT),
    z: positiveMod(position.z, CHUNK_DEPTH),
  };
}

export function chunkKey(position: ChunkPosition): string {
  assertInteger(position.x, "chunk x"); assertInteger(position.y, "chunk y"); assertInteger(position.z, "chunk z");
  return `${position.x},${position.y},${position.z}`;
}

export function localVoxelIndex(position: LocalPosition): number {
  const { x, y, z } = position;
  if (![x, y, z].every(Number.isInteger) || x < 0 || x >= CHUNK_WIDTH || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_DEPTH) {
    throw new RangeError("Local voxel coordinates are outside the chunk");
  }
  return x + CHUNK_WIDTH * (z + CHUNK_DEPTH * y);
}

export function indexToLocal(index: number): LocalPosition {
  const volume = CHUNK_WIDTH * CHUNK_DEPTH * CHUNK_HEIGHT;
  if (!Number.isInteger(index) || index < 0 || index >= volume) throw new RangeError("Voxel index is outside the chunk");
  const y = Math.floor(index / (CHUNK_WIDTH * CHUNK_DEPTH));
  const remainder = index % (CHUNK_WIDTH * CHUNK_DEPTH);
  const z = Math.floor(remainder / CHUNK_WIDTH);
  return { x: remainder % CHUNK_WIDTH, y, z };
}

export function chunkOrigin(position: ChunkPosition): VoxelPosition {
  return { x: position.x * CHUNK_WIDTH, y: position.y * CHUNK_HEIGHT, z: position.z * CHUNK_DEPTH };
}
