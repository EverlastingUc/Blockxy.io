import * as THREE from "three";
import { chunkOrigin, chunkKey, voxelToChunk, type ChunkPosition } from "../world/coordinates";
import { CHUNK_DEPTH, CHUNK_HEIGHT, CHUNK_WIDTH } from "../world/registry";
import type { VoxelWorld } from "../world/world";
import type { TextureAtlasLayout } from "./atlas";
import { createMeshingExecutor, type MeshingExecutor, type PaddedChunk, PADDED_CHUNK_DEPTH, PADDED_CHUNK_HEIGHT, PADDED_CHUNK_WIDTH } from "./mesher-client";
import type { ChunkMesh, MeshBuffers } from "./mesher";
import { ChunkStreamer } from "../world/streaming";

const paddedIndex = (x: number, y: number, z: number): number =>
  x + PADDED_CHUNK_WIDTH * (z + PADDED_CHUNK_DEPTH * y);

/** Copies a chunk plus its one-voxel border from the world model for seam-free meshing. */
export function createPaddedChunk(world: VoxelWorld, position: ChunkPosition): PaddedChunk {
  const origin = chunkOrigin(position);
  const blocks = new Uint16Array(PADDED_CHUNK_WIDTH * PADDED_CHUNK_DEPTH * PADDED_CHUNK_HEIGHT);
  for (let y = -1; y <= CHUNK_HEIGHT; y += 1) {
    for (let z = -1; z <= CHUNK_DEPTH; z += 1) {
      for (let x = -1; x <= CHUNK_WIDTH; x += 1) {
        blocks[paddedIndex(x + 1, y + 1, z + 1)] =
          world.getBlock({ x: origin.x + x, y: origin.y + y, z: origin.z + z });
      }
    }
  }
  return blocks;
}

function geometryFromBuffers(buffers: MeshBuffers): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(buffers.positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(buffers.normals, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(buffers.uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(buffers.indices, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

const LAYERS = ["opaque", "cutout", "translucent"] as const;
type RenderedChunk = { readonly group: THREE.Group; readonly revision: number };

/**
 * Owns only Three.js chunk visuals. VoxelWorld remains the source of truth and
 * can be tested or saved without constructing a renderer.
 */
export class ChunkRenderManager {
  private readonly streamer = new ChunkStreamer();
  private readonly rendered = new Map<string, RenderedChunk>();
  private readonly materials: Record<(typeof LAYERS)[number], THREE.MeshStandardMaterial>;
  private readonly executor: MeshingExecutor;
  private disposed = false;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly world: VoxelWorld,
    private readonly atlasTexture: THREE.Texture,
    private readonly atlasLayout: TextureAtlasLayout,
    executor: MeshingExecutor = createMeshingExecutor(),
  ) {
    this.executor = executor;
    this.materials = {
      opaque: new THREE.MeshStandardMaterial({ map: atlasTexture, roughness: 1 }),
      cutout: new THREE.MeshStandardMaterial({ map: atlasTexture, roughness: 1, alphaTest: 0.35 }),
      translucent: new THREE.MeshStandardMaterial({
        map: atlasTexture, roughness: 0.25, transparent: true, opacity: 0.78, depthWrite: false,
      }),
    };
  }

  /** Reconciles visible chunk visuals around the player's current voxel position. */
  updateAroundPlayer(position: THREE.Vector3, renderDistance: number): void {
    if (this.disposed) return;
    const center = voxelToChunk({
      x: Math.floor(position.x),
      y: Math.floor(position.y),
      z: Math.floor(position.z),
    });
    const changes = this.streamer.reconcile(center, renderDistance, 1);
    for (const chunkPosition of changes.unload) this.remove(chunkPosition);
    for (const chunkPosition of changes.load) {
      if (this.world.getChunk(chunkPosition)) void this.rebuild(chunkPosition);
    }
    this.rebuildDirty();
  }

  /** Rebuilds only dirty chunks currently inside render distance. */
  rebuildDirty(): void {
    if (this.disposed) return;
    for (const position of this.world.consumeDirtyChunks()) {
      if (this.rendered.has(chunkKey(position))) void this.rebuild(position);
    }
  }

  async rebuild(position: ChunkPosition): Promise<void> {
    if (this.disposed || !this.world.getChunk(position)) return;
    const key = chunkKey(position);
    const revision = this.world.getChunk(position)!.revision;
    const padded = createPaddedChunk(this.world, position);
    const origin = chunkOrigin(position);
    const mesh = await this.executor.build(padded, this.atlasLayout, (x, y, z) =>
      this.world.getBlock({ x: origin.x + x, y: origin.y + y, z: origin.z + z }),
    );
    if (this.disposed || !this.world.getChunk(position) || this.world.getChunk(position)!.revision !== revision) {
      if (!this.disposed && this.world.getChunk(position)) void this.rebuild(position);
      return;
    }
    this.removeRendered(key);
    const group = this.createGroup(mesh);
    group.position.set(origin.x, origin.y, origin.z);
    group.userData.chunkPosition = position;
    this.scene.add(group);
    this.rendered.set(key, { group, revision });
  }

  private createGroup(mesh: ChunkMesh): THREE.Group {
    const group = new THREE.Group();
    for (const layer of LAYERS) {
      const buffers = mesh[layer];
      if (buffers.faceCount === 0) continue;
      const object = new THREE.Mesh(geometryFromBuffers(buffers), this.materials[layer]);
      object.castShadow = layer !== "translucent";
      object.receiveShadow = true;
      object.userData.renderLayer = layer;
      group.add(object);
    }
    return group;
  }

  private remove(position: ChunkPosition): void {
    this.removeRendered(chunkKey(position));
  }

  private removeRendered(key: string): void {
    const rendered = this.rendered.get(key);
    if (!rendered) return;
    this.scene.remove(rendered.group);
    rendered.group.traverse((object) => {
      if (object instanceof THREE.Mesh) object.geometry.dispose();
    });
    this.rendered.delete(key);
  }

  get renderedChunkCount(): number {
    return this.rendered.size;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const key of this.rendered.keys()) this.removeRendered(key);
    this.executor.dispose();
    for (const material of Object.values(this.materials)) material.dispose();
    this.atlasTexture.dispose();
    this.streamer.clear();
  }
}

/** Useful for tests and diagnostics; confirms the expected padded buffer contract. */
export function isPaddedChunk(value: Uint16Array): value is PaddedChunk {
  return value.length === PADDED_CHUNK_WIDTH * PADDED_CHUNK_DEPTH * PADDED_CHUNK_HEIGHT;
}
