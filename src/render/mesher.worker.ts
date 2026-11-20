import { buildChunkMesh, type ChunkMesh } from "./mesher";
import type { AtlasTile } from "./atlas";

export interface MeshWorkerRequest {
  readonly id: number;
  readonly blocks: Uint16Array;
  readonly atlas: readonly (readonly [string, AtlasTile])[];
}

export interface MeshWorkerResponse {
  readonly id: number;
  readonly mesh: ChunkMesh;
}

const workerScope = self as unknown as {
  addEventListener(type: "message", listener: (event: MessageEvent<MeshWorkerRequest>) => void): void;
  postMessage(message: MeshWorkerResponse, transfer: Transferable[]): void;
};

workerScope.addEventListener("message", (event) => {
  const { id, blocks, atlas } = event.data;
  const width = 18;
  const depth = 18;
  const height = 66;
  if (blocks.length !== width * depth * height) return;

  const mesh = buildChunkMesh((x, y, z) => {
    const px = x + 1;
    const py = y + 1;
    const pz = z + 1;
    return blocks[px + width * (pz + depth * py)] as import("../world/registry").BlockId;
  }, new Map(atlas));

  const transfer: Transferable[] = [];
  for (const layer of ["opaque", "cutout", "translucent"] as const) {
    transfer.push(
      mesh[layer].positions.buffer,
      mesh[layer].normals.buffer,
      mesh[layer].uvs.buffer,
      mesh[layer].indices.buffer,
    );
  }
  workerScope.postMessage({ id, mesh }, transfer);
});
