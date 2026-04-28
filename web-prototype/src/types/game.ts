/** Game type definitions for 骰境：信仰轮回 / Dice Realms: Circle of Faith — Dice Embedding Combat */

export type SceneType = 'board' | 'combat' | 'village' | 'interlude' | 'gameover';

export type CellType =
  | 'combat'
  | 'elite'
  | 'shop'
  | 'prayer'
  | 'treasure'
  | 'event'
  | 'trap'
  | 'boss'
  | 'sanctified'
  | 'void'
  | 'start';

export type DamageType = 'physical' | 'magical' | 'piercing';

export type EquipmentSlot =
  | 'helmet' | 'chest' | 'wrist' | 'leg' | 'weapon' | 'offhand'
  | 'ring1' | 'ring2' | 'necklace' | 'cloak' | 'belt' | 'boots';

export type EquipmentSet = 'knight' | 'friar' | 'heretic' | 'shadow' | 'alchemist' | 'mixed';

export type FaithTag =
  | 'crusader'
  | 'heretic'
  | 'martyr'
  | 'skeptic'
  | 'devout'
  | 'generousChief';

export type EnemyIntent = 'attack' | 'block' | 'summon' | 'curse' | 'buff';

export type ItemType = 'heal' | 'attack' | 'buff' | 'special';

export type RewardType = 'item' | 'equipment' | 'gold' | 'restore' | 'relic' | 'dice';

export type Quality = 'common' | 'fine' | 'rare' | 'legendary';

// ─── Dice Entity System (GDD v0.3) ──────────────────────────

export type DiceQuality = 'common' | 'fine' | 'rare' | 'legendary';

export type DiceFaceCount = 4 | 6 | 8 | 10 | 12 | 20 | 100;

export type DiceAffixType = 'throw' | 'embed' | 'universal';

export interface DiceAffix {
  id: string;
  name: string;
  type: DiceAffixType;
  effect: string;
  quality: DiceQuality;
}

/** A collectible dice entity — the core item of the game */
export interface DiceEntity {
  id: string;
  name: string;
  quality: DiceQuality;
  faces: DiceFaceCount;
  affixes: DiceAffix[];
  canMove: boolean; // D100 cannot be used for movement
}

// ─── Dice Socket (Equipment embedding) ──────────────────────

export type SocketType = 'weapon' | 'armor' | 'shield' | 'accessory';

/** How an equipment's dice socket modifies the embedded die's formula */
export interface DiceSocket {
  type: SocketType;
  /** Multiplier for the embedded die's face count in the damage formula Y */
  faceMultiplier: number;
  /** Additional flat bonus from the socket */
  flatBonus: number;
  /** Additional crit from the socket */
  critBonus: number;
  /** Variance from the socket */
  varianceBonus: number;
}

// ─── Stats & Formulas ───────────────────────────────────────

export interface Stats {
  str: number;
  agi: number;
  int: number;
  con: number;
  fai: number;
}

export interface DamageFormula {
  diceCount: number;
  diceFaces: number;
  flatBonus: number;
  critChance: number;
  variance: number;
}

// ─── Weapons (updated for embedding) ────────────────────────

export interface Weapon {
  id: string;
  name: string;
  /** Base damage formula (diceCount, flatBonus, critChance, variance).
   *  diceFaces is determined by the embedded die. */
  baseFormula: DamageFormula;
  diceSocket: DiceSocket;
  weight: number;
  description: string;
  set: EquipmentSet;
}

// ─── Items, Relics, Equipment ───────────────────────────────

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  effect: string;
  amount: number;
  maxStack: number;
  quality: Quality;
}

export interface Relic {
  id: string;
  name: string;
  description: string;
  effect: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  slot: EquipmentSlot;
  set: EquipmentSet;
  weight: number;
  stats: Partial<Stats>;
  description: string;
  /** Socket type determines embedding behavior */
  socketType?: SocketType;
  /** Base formula for weapon-type equipment */
  baseFormula?: DamageFormula;
  /** Dice socket for modifier bonuses */
  diceSocket?: DiceSocket;
}

// ─── Board & Cells ──────────────────────────────────────────

export interface Cell {
  id: number;
  type: CellType;
  index: number;
  triggered: boolean;
  sanctified: boolean;
  corrupted: boolean;
}

// ─── Rewards ────────────────────────────────────────────────

export interface RewardOption {
  id: string;
  type: RewardType;
  label: string;
  icon: string;
  item?: Item;
  equipment?: EquipmentItem;
  relic?: Relic;
  gold?: number;
  dice?: DiceEntity;
  restore?: { hp?: number; faith?: number; curse?: number };
}

// ─── Enemies (intent system preserved) ──────────────────────

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  armor: number;
  intent: EnemyIntent;
  intentValue: number;
  damage: number;
  sprite: string;
}

// ─── Events ─────────────────────────────────────────────────

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  optionA: { label: string; effect: string };
  optionB: { label: string; effect: string };
}

// ─── Player & Run State ─────────────────────────────────────

export interface PlayerState {
  hp: number;
  maxHp: number;
  armor: number;
  stats: Stats;
  faith: number;
  maxFaith: number;
  gold: number;
  curseLevel: number;
  encumbrance: number;
  maxEncumbrance: number;
  faithTags: FaithTag[];
}

export interface RunProgress {
  floor: number;
  maxFloor: number;
  diceHistory: number[];
  totalFloorsCleared: number;
}

// ─── Village Meta ───────────────────────────────────────────

export interface VillageMeta {
  level: number;
  name: string;
  population: number;
  taxPerRun: number;
  faithReserve: number;
  buildings: Building[];
  villagers: Villager[];
  storedItems: EquipmentItem[];
}

export interface Building {
  id: string;
  name: string;
  unlocked: boolean;
  built: boolean;
  costGold: number;
  costFaith: number;
  costResources: number;
  effect: string;
}

export interface Villager {
  id: string;
  name: string;
  profession: string;
  recruited: boolean;
  recruitFaith: number;
  specialty: string;
}

// ─── Combat Embedding State ─────────────────────────────────

/** Tracks which die is embedded in which equipment slot during combat */
export interface EmbeddedSlot {
  equipmentSlotId: string;
  socketType: SocketType;
  embeddedDie: DiceEntity | null;
}

// ─── Damage Result ──────────────────────────────────────────

export interface DamageResult {
  rawDamage: number;
  isCrit: boolean;
  critMultiplier: number;
  finalDamage: number;
  armorBlocked: number;
  damageDealt: number;
  breakdown: string;
}
