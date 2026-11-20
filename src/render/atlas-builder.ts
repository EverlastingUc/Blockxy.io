import * as THREE from "three";
import type { AtlasTile, TextureAtlasLayout } from "./atlas";

export interface AtlasTileSource {
  readonly key: string;
  readonly source: CanvasImageSource;
}

export interface BuiltTextureAtlas {
  readonly texture: THREE.CanvasTexture;
  readonly layout: TextureAtlasLayout;
  readonly width: number;
  readonly height: number;
}

export interface AtlasLayoutOptions {
  readonly tileSize?: number;
  readonly gutter?: number;
  readonly columns?: number;
}

export function buildAtlasLayout(
  keys: readonly string[],
  options: AtlasLayoutOptions = {},
): { readonly layout: TextureAtlasLayout; readonly width: number; readonly height: number } {
  const tileSize = options.tileSize ?? 16;
  const gutter = options.gutter ?? 1;
  const columns = options.columns ?? 12;
  if (!Number.isInteger(tileSize) || tileSize < 1 || !Number.isInteger(gutter) || gutter < 0 ||
      !Number.isInteger(columns) || columns < 1) {
    throw new RangeError("Atlas dimensions must be positive integers");
  }
  if (new Set(keys).size !== keys.length) throw new TypeError("Atlas tile keys must be unique");
  const cellSize = tileSize + gutter * 2;
  const rows = Math.max(1, Math.ceil(keys.length / columns));
  const width = columns * cellSize;
  const height = rows * cellSize;
  const layout = new Map<string, AtlasTile>();
  keys.forEach((key, index) => {
    const x = (index % columns) * cellSize + gutter;
    const y = Math.floor(index / columns) * cellSize + gutter;
    layout.set(key, {
      u0: x / width,
      v0: y / height,
      u1: (x + tileSize) / width,
      v1: (y + tileSize) / height,
    });
  });
  return { layout, width, height };
}

/** Packs face textures into one nearest-filtered atlas with a one-pixel edge gutter. */
export function createTextureAtlas(
  tiles: readonly AtlasTileSource[],
  options: AtlasLayoutOptions = {},
): BuiltTextureAtlas {
  const tileSize = options.tileSize ?? 16;
  const gutter = options.gutter ?? 1;
  const columns = options.columns ?? 12;
  const { layout, width, height } = buildAtlasLayout(
    tiles.map((tile) => tile.key),
    { tileSize, gutter, columns },
  );
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the texture atlas canvas");

  tiles.forEach(({ key, source }) => {
    const tile = layout.get(key)!;
    const x = Math.round(tile.u0 * width);
    const y = Math.round(tile.v0 * height);
    context.drawImage(source, x, y, tileSize, tileSize);
    if (gutter > 0) {
      const sourceWidth = (source as HTMLImageElement).naturalWidth || (source as HTMLCanvasElement).width || tileSize;
      const sourceHeight = (source as HTMLImageElement).naturalHeight || (source as HTMLCanvasElement).height || tileSize;
      context.drawImage(source, 0, 0, sourceWidth, 1, x, y - gutter, tileSize, gutter);
      context.drawImage(source, 0, sourceHeight - 1, sourceWidth, 1, x, y + tileSize, tileSize, gutter);
      context.drawImage(source, 0, 0, 1, sourceHeight, x - gutter, y, gutter, tileSize);
      context.drawImage(source, sourceWidth - 1, 0, 1, sourceHeight, x + tileSize, y, gutter, tileSize);
      context.drawImage(source, 0, 0, 1, 1, x - gutter, y - gutter, gutter, gutter);
      context.drawImage(source, sourceWidth - 1, 0, 1, 1, x + tileSize, y - gutter, gutter, gutter);
      context.drawImage(source, 0, sourceHeight - 1, 1, 1, x - gutter, y + tileSize, gutter, gutter);
      context.drawImage(source, sourceWidth - 1, sourceHeight - 1, 1, 1, x + tileSize, y + tileSize, gutter, gutter);
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return { texture, layout, width, height };
}
