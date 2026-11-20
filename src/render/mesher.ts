import { getBlockDefinition, BlockId, type BlockFace, type RenderLayer } from "../world/registry";
import { CHUNK_DEPTH, CHUNK_HEIGHT, CHUNK_WIDTH } from "../world/registry";
import { atlasUv, textureForFace, type TextureAtlasLayout } from "./atlas";

export interface MeshBuffers {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly uvs: Float32Array;
  readonly indices: Uint32Array;
  readonly faceCount: number;
}

export type ChunkMesh = Readonly<Record<RenderLayer, MeshBuffers>>;

type Vertex = readonly [number, number, number];
interface Face {
  readonly direction: readonly [number, number, number];
  readonly normal: readonly [number, number, number];
  readonly vertices: readonly [Vertex, Vertex, Vertex, Vertex];
  readonly textureFace: BlockFace;
}

const FACES: readonly Face[] = [
  { direction: [1, 0, 0], normal: [1, 0, 0], vertices: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]], textureFace: "right" },
  { direction: [-1, 0, 0], normal: [-1, 0, 0], vertices: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]], textureFace: "left" },
  { direction: [0, 1, 0], normal: [0, 1, 0], vertices: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]], textureFace: "top" },
  { direction: [0, -1, 0], normal: [0, -1, 0], vertices: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]], textureFace: "bottom" },
  { direction: [0, 0, 1], normal: [0, 0, 1], vertices: [[1,0,1],[1,1,1],[0,1,1],[0,0,1]], textureFace: "front" },
  { direction: [0, 0, -1], normal: [0, 0, -1], vertices: [[0,0,0],[0,1,0],[1,1,0],[1,0,0]], textureFace: "back" },
];

interface LayerBuilder {
  positions: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
  faces: number;
}

function createBuilder(): LayerBuilder {
  return { positions: [], normals: [], uvs: [], indices: [], faces: 0 };
}

function visibleFace(current: BlockId, neighbour: BlockId): boolean {
  if (neighbour === BlockId.Air) return true;
  const neighbourDefinition = getBlockDefinition(neighbour);
  if (neighbourDefinition.renderLayer === "opaque") return false;
  return current !== neighbour;
}

export function buildChunkMesh(
  sample: (x: number, y: number, z: number) => BlockId,
  atlas: TextureAtlasLayout,
): ChunkMesh {
  const builders: Record<RenderLayer, LayerBuilder> = {
    opaque: createBuilder(),
    cutout: createBuilder(),
    translucent: createBuilder(),
  };

  for (let y = 0; y < CHUNK_HEIGHT; y += 1) {
    for (let z = 0; z < CHUNK_DEPTH; z += 1) {
      for (let x = 0; x < CHUNK_WIDTH; x += 1) {
        const id = sample(x, y, z);
        if (id === BlockId.Air) continue;
        const definition = getBlockDefinition(id);
        const builder = builders[definition.renderLayer];

        for (const face of FACES) {
          const neighbour = sample(
            x + face.direction[0],
            y + face.direction[1],
            z + face.direction[2],
          );
          if (!visibleFace(id, neighbour)) continue;

          const tile = atlas.get(textureForFace(definition, face.textureFace));
          if (!tile) throw new Error(`Missing atlas tile: ${textureForFace(definition, face.textureFace)}`);
          const uv = atlasUv(tile);
          const base = builder.positions.length / 3;

          for (const vertex of face.vertices) {
            builder.positions.push(x + vertex[0], y + vertex[1], z + vertex[2]);
            builder.normals.push(...face.normal);
          }
          for (const coordinate of uv) builder.uvs.push(coordinate);
          builder.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
          builder.faces += 1;
        }
      }
    }
  }

  const result = {} as Record<RenderLayer, MeshBuffers>;
  for (const layer of ["opaque", "cutout", "translucent"] as const) {
    const builder = builders[layer];
    result[layer] = {
      positions: new Float32Array(builder.positions),
      normals: new Float32Array(builder.normals),
      uvs: new Float32Array(builder.uvs),
      indices: new Uint32Array(builder.indices),
      faceCount: builder.faces,
    };
  }
  return result;
}
