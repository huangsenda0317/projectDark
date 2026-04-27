/** Game type definitions for Circle of Faith */

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

export interface Weapon {
  id: string;
  name: string;
  baseSpeed: number;
  formula: DamageFormula;
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

export interface CombatAction {
  id: string;
  name: string;
  type: 'attack' | 'skill' | 'item' | 'defend' | 'flee';
  description: string;
  formula?: DamageFormula;
  block?: number;
  faithCost?: number;
  faithGain?: number;
  hpCost?: number;
  heal?: number;
  color: string;
  usesBoardDice?: boolean;
  extraCooldown?: number;
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
  speed: number;
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

export interface ATBUnit {
  id: string;
  name: string;
  gauge: number;
  speed: number;
  isPlayer: boolean;
  isActing: boolean;
  extraCooldown: number;
  enemyRef?: Enemy;
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
