/** Game type definitions for Circle of Faith — Dice Allocation Combat */

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

export type RewardType = 'item' | 'equipment' | 'gold' | 'restore' | 'relic';

export type Quality = 'common' | 'fine' | 'rare' | 'legendary';

/** Dice requirement types for equipment slots */
export type DiceRequirementType = 'any' | 'threshold' | 'parity' | 'pair' | 'straight' | 'sum';

export interface DiceRequirement {
  type: DiceRequirementType;
  /** For threshold: minimum value. For parity: 'odd' | 'even'. For sum: target value. */
  value?: number | string;
  /** How many dice this slot consumes */
  diceCost: number;
  /** Human-readable label for UI */
  label: string;
}

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

/** A weapon has dice requirements to be activated in combat */
export interface Weapon {
  id: string;
  name: string;
  formula: DamageFormula;
  diceRequirement: DiceRequirement;
  weight: number;
  description: string;
  set: EquipmentSet;
}

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

export interface Cell {
  id: number;
  type: CellType;
  index: number;
  triggered: boolean;
  sanctified: boolean;
  corrupted: boolean;
}

/** A dice-activated slot in combat — can be an equipment piece or a basic action */
export interface DiceSlot {
  id: string;
  name: string;
  type: 'attack' | 'skill' | 'item' | 'defend' | 'flee';
  diceRequirement: DiceRequirement;
  formula?: DamageFormula;
  block?: number;
  faithCost?: number;
  heal?: number;
  color: string;
  usesBoardDice?: boolean;
  description: string;
}

/** Represents a rolled battle die */
export interface BattleDice {
  index: number;
  value: number;
  allocated: boolean;
  allocatedTo?: string; // slot ID
}

export interface RewardOption {
  id: string;
  type: RewardType;
  label: string;
  icon: string;
  item?: Item;
  equipment?: EquipmentItem;
  relic?: Relic;
  gold?: number;
  restore?: { hp?: number; faith?: number; curse?: number; };
}

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

export interface EquipmentItem {
  id: string;
  name: string;
  slot: EquipmentSlot;
  set: EquipmentSet;
  weight: number;
  stats: Partial<Stats>;
  description: string;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  optionA: { label: string; effect: string };
  optionB: { label: string; effect: string };
}

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

export interface DamageResult {
  rawDamage: number;
  isCrit: boolean;
  critMultiplier: number;
  finalDamage: number;
  armorBlocked: number;
  damageDealt: number;
  breakdown: string;
}
