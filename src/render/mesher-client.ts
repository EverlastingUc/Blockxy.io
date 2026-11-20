import { buildChunkMesh, type ChunkMesh } from "./mesher";
import type { AtlasTile, TextureAtlasLayout } from "./atlas";
import type { BlockId } from "../world/registry";

export const PADDED_CHUNK_WIDTH = 18;
export const PADDED_CHUNK_DEPTH = 18;
export const PADDED_CHUNK_HEIGHT = 66;

export type PaddedChunk = Uint16Array;

interface WorkerRequest {
  readonly id: number;
  readonly blocks: PaddedChunk;
  readonly atlas: readonly (readonly [string, AtlasTile])[];
}

interface WorkerResponse {
  readonly id: number;
  readonly mesh: ChunkMesh;
}

interface WorkerLike {
  postMessage(message: WorkerRequest, transfer?: Transferable[]): void;
  addEventListener(type: "message", listener: (event: MessageEvent<WorkerResponse>) => void): void;
  terminate(): void;
}

export class MeshingExecutor {
  private nextId = 1;
  private readonly pending = new Map<number, (mesh: ChunkMesh) => void>();

  constructor(private readonly worker?: WorkerLike) {
    this.worker?.addEventListener("message", (event) => {
      const resolve = this.pending.get(event.data.id);
      if (!resolve) return;
      this.pending.delete(event.data.id);
      resolve(event.data.mesh);
    });
  }

  build(
    blocks: PaddedChunk,
    atlas: TextureAtlasLayout,
    fallbackSample: (x: number, y: number, z: number) => BlockId,
  ): Promise<ChunkMesh> {
    if (!this.worker) return Promise.resolve(buildChunkMesh(fallbackSample, atlas));
    const id = this.nextId++;
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      const transferable = blocks.slice();
      this.worker!.postMessage({ id, blocks: transferable, atlas: [...atlas] }, [transferable.buffer]);
    });
  }

  dispose(): void {
    this.worker?.terminate();
    this.pending.clear();
  }
}

export function createMeshingExecutor(): MeshingExecutor {
  if (typeof Worker === "undefined") return new MeshingExecutor();
  const worker = new Worker(new URL("./mesher.worker.ts", import.meta.url), { type: "module" });
  return new MeshingExecutor(worker);
}
