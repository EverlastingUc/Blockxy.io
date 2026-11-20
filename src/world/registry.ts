export const CHUNK_WIDTH = 16;
export const CHUNK_DEPTH = 16;
export const CHUNK_HEIGHT = 64;

export enum BlockId {
  Air = 0,
  Grass = 1,
  Dirt = 2,
  Stone = 3,
  Cobblestone = 4,
  Bedrock = 5,
  Sand = 6,
  Sandstone = 7,
  OakLog = 8,
  OakPlanks = 9,
  Leaves = 10,
  Bricks = 11,
  Glass = 12,
  Water = 13,
  CoalOre = 14,
  IronOre = 15,
  GoldOre = 16,
  DiamondOre = 17,
  Snow = 18,
  Ice = 19,
  Wool = 20,
}

export type RenderLayer = "opaque" | "cutout" | "translucent";
export type BlockFace = "right" | "left" | "top" | "bottom" | "front" | "back";

export interface BlockDefinition {
  readonly id: BlockId;
  readonly key: string;
  readonly label: string;
  readonly category: string;
  readonly texture: Readonly<Record<BlockFace, string>>;
  readonly renderLayer: RenderLayer;
  readonly transparent: boolean;
  readonly collidable: boolean;
  readonly hardness: number;
  readonly opacity?: number;
}

const cube = (texture: string): Readonly<Record<BlockFace, string>> => ({
  right: `${texture}_0`,
  left: `${texture}_1`,
  top: `${texture}_2`,
  bottom: `${texture}_3`,
  front: `${texture}_4`,
  back: `${texture}_5`,
});

const definitions: readonly BlockDefinition[] = [
  { id: BlockId.Grass, key: "grass", label: "Grass Block", category: "Nature", texture: { right: "grass_0", left: "grass_1", top: "grass_2", bottom: "grass_3", front: "grass_4", back: "grass_5" }, renderLayer: "opaque", transparent: false, collidable: true, hardness: 0.6 },
  { id: BlockId.Dirt, key: "dirt", label: "Dirt", category: "Nature", texture: cube("dirt"), renderLayer: "opaque", transparent: false, collidable: true, hardness: 0.5 },
  { id: BlockId.Stone, key: "stone", label: "Stone", category: "Stone", texture: cube("stone"), renderLayer: "opaque", transparent: false, collidable: true, hardness: 1.5 },
  { id: BlockId.Cobblestone, key: "cobblestone", label: "Cobblestone", category: "Stone", texture: cube("cobblestone"), renderLayer: "opaque", transparent: false, collidable: true, hardness: 2 },
  { id: BlockId.Bedrock, key: "bedrock", label: "Bedrock", category: "Stone", texture: cube("bedrock"), renderLayer: "opaque", transparent: false, collidable: true, hardness: -1 },
  { id: BlockId.Sand, key: "sand", label: "Sand", category: "Nature", texture: cube("sand"), renderLayer: "opaque", transparent: false, collidable: true, hardness: 0.5 },
  { id: BlockId.Sandstone, key: "sandstone", label: "Sandstone", category: "Stone", texture: cube("sandstone"), renderLayer: "opaque", transparent: false, collidable: true, hardness: 0.8 },
  { id: BlockId.OakLog, key: "oak_log", label: "Oak Log", category: "Wood", texture: { right: "oak_log_0", left: "oak_log_1", top: "oak_log_2", bottom: "oak_log_3", front: "oak_log_4", back: "oak_log_5" }, renderLayer: "opaque", transparent: false, collidable: true, hardness: 2 },
  { id: BlockId.OakPlanks, key: "oak_planks", label: "Oak Planks", category: "Wood", texture: cube("oak_planks"), renderLayer: "opaque", transparent: false, collidable: true, hardness: 2 },
  { id: BlockId.Leaves, key: "leaves", label: "Oak Leaves", category: "Nature", texture: cube("leaves"), renderLayer: "cutout", transparent: true, collidable: true, hardness: 0.2 },
  { id: BlockId.Bricks, key: "bricks", label: "Bricks", category: "Building", texture: cube("bricks"), renderLayer: "opaque", transparent: false, collidable: true, hardness: 2 },
  { id: BlockId.Glass, key: "glass", label: "Glass", category: "Building", texture: cube("glass"), renderLayer: "translucent", transparent: true, collidable: true, hardness: 0.3, opacity: 0.42 },
  { id: BlockId.Water, key: "water", label: "Water", category: "Nature", texture: cube("water"), renderLayer: "translucent", transparent: true, collidable: false, hardness: 100, opacity: 0.72 },
  { id: BlockId.CoalOre, key: "coal_ore", label: "Coal Ore", category: "Ores", texture: cube("coal_ore"), renderLayer: "opaque", transparent: false, collidable: true, hardness: 3 },
  { id: BlockId.IronOre, key: "iron_ore", label: "Iron Ore", category: "Ores", texture: cube("iron_ore"), renderLayer: "opaque", transparent: false, collidable: true, hardness: 3 },
  { id: BlockId.GoldOre, key: "gold_ore", label: "Gold Ore", category: "Ores", texture: cube("gold_ore"), renderLayer: "opaque", transparent: false, collidable: true, hardness: 3 },
  { id: BlockId.DiamondOre, key: "diamond_ore", label: "Diamond Ore", category: "Ores", texture: cube("diamond_ore"), renderLayer: "opaque", transparent: false, collidable: true, hardness: 3 },
  { id: BlockId.Snow, key: "snow", label: "Snow", category: "Nature", texture: cube("snow"), renderLayer: "opaque", transparent: false, collidable: true, hardness: 0.2 },
  { id: BlockId.Ice, key: "ice", label: "Ice", category: "Nature", texture: cube("ice"), renderLayer: "translucent", transparent: true, collidable: true, hardness: 0.5, opacity: 1 },
  { id: BlockId.Wool, key: "wool", label: "Wool", category: "Building", texture: cube("wool"), renderLayer: "opaque", transparent: false, collidable: true, hardness: 0.8 },
];

export const BLOCK_REGISTRY: ReadonlyMap<BlockId, BlockDefinition> = new Map(
  definitions.map((definition): [BlockId, BlockDefinition] => [definition.id, Object.freeze(definition)]),
);

export const BLOCKS: readonly BlockDefinition[] = definitions;

export function getBlockDefinition(id: number): BlockDefinition {
  if (!Number.isInteger(id) || id <= BlockId.Air || id > BlockId.Wool) {
    throw new RangeError(`Unknown block ID: ${id}`);
  }
  const definition = BLOCK_REGISTRY.get(id as BlockId);
  if (!definition) throw new RangeError(`Unknown block ID: ${id}`);
  return definition;
}

export function blockIdFromKey(key: string): BlockId {
  const definition = definitions.find((entry) => entry.key === key);
  if (!definition) throw new RangeError(`Unknown block key: ${key}`);
  return definition.id;
}
