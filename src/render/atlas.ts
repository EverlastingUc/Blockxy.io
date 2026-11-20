import type { BlockDefinition, BlockFace } from "../world/registry";

export interface AtlasTile {
  readonly u0: number;
  readonly v0: number;
  readonly u1: number;
  readonly v1: number;
}

export type TextureAtlasLayout = ReadonlyMap<string, AtlasTile>;

export function textureForFace(block: BlockDefinition, face: BlockFace): string {
  return block.texture[face];
}

export function atlasUv(tile: AtlasTile): readonly [number, number, number, number] {
  return [tile.u0, tile.v1, tile.u1, tile.v1, tile.u1, tile.v0, tile.u0, tile.v0];
}
