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

interface PendingMesh {
  readonly resolve: (mesh: ChunkMesh) => void;
  readonly fallback: () => ChunkMesh;
}

interface WorkerLike {
  postMessage(message: WorkerRequest, transfer?: Transferable[]): void;
  addEventListener(type: "message", listener: (event: MessageEvent<WorkerResponse>) => void): void;
  addEventListener(type: "error", listener: (event: ErrorEvent) => void): void;
  terminate(): void;
}

export class MeshingExecutor {
  private nextId = 1;
  private readonly pending = new Map<number, PendingMesh>();
  private activeWorker?: WorkerLike;

  constructor(worker?: WorkerLike) {
    this.activeWorker = worker;
    this.activeWorker?.addEventListener("message", (event) => {
      const pending = this.pending.get(event.data.id);
      if (!pending) return;
      this.pending.delete(event.data.id);
      pending.resolve(event.data.mesh);
    });
    this.activeWorker?.addEventListener("error", () => {
      this.activeWorker?.terminate();
      this.activeWorker = undefined;
      for (const [id, pending] of this.pending) {
        this.pending.delete(id);
        pending.resolve(pending.fallback());
      }
    });
  }

  build(
    blocks: PaddedChunk,
    atlas: TextureAtlasLayout,
    fallbackSample: (x: number, y: number, z: number) => BlockId,
  ): Promise<ChunkMesh> {
    const fallback = (): ChunkMesh => buildChunkMesh(fallbackSample, atlas);
    if (!this.activeWorker) return Promise.resolve(fallback());

    const id = this.nextId++;
    return new Promise((resolve) => {
      this.pending.set(id, { resolve, fallback });
      const transferable = blocks.slice();
      try {
        this.activeWorker?.postMessage({ id, blocks: transferable, atlas: [...atlas] }, [transferable.buffer]);
      } catch {
        this.pending.delete(id);
        resolve(fallback());
      }
    });
  }

  dispose(): void {
    this.activeWorker?.terminate();
    this.activeWorker = undefined;
    for (const pending of this.pending.values()) pending.resolve(pending.fallback());
    this.pending.clear();
  }
}

export function createMeshingExecutor(): MeshingExecutor {
  if (typeof Worker === "undefined") return new MeshingExecutor();
  try {
    const worker = new Worker(new URL("./mesher.worker.ts", import.meta.url), { type: "module" });
    return new MeshingExecutor(worker);
  } catch {
    return new MeshingExecutor();
  }
}
