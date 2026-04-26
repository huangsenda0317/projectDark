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

export type CardType = 'attack' | 'defense' | 'faith' | 'heretic' | 'curse' | 'miracle' | 'equipment';

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

export interface Stats {
  str: number;
  agi: number;
  int: number;
  con: number;
  fai: number;
}

/** Elona-style dice damage formula: XdY+Z(C)[+-R] */
export interface DamageFormula {
  diceCount: number;
  diceFaces: number;
  flatBonus: number;
  critChance: number;
  variance: number;
}

/** Weapon data for ATB combat */
export interface Weapon {
  id: string;
  name: string;
  /** Base attack speed (higher = faster) */
  baseSpeed: number;
  /** Damage formula for normal attacks */
  formula: DamageFormula;
  weight: number;
  description: string;
  /** Equipment set this weapon belongs to */
  set: EquipmentSet;
}

export interface Cell {
  id: number;
  type: CellType;
  index: number;
  triggered: boolean;
  sanctified: boolean;
  corrupted: boolean;
}

/** Combat Action - available when ATB gauge is full */
export interface CombatAction {
  id: string;
  name: string;
  type: 'attack' | 'skill' | 'item' | 'defend' | 'flee';
  cardType: CardType;
  /** AP cost removed in ATB system - actions consume gauge instead */
  description: string;
  formula?: DamageFormula;
  block?: number;
  faithCost?: number;
  faithGain?: number;
  hpCost?: number;
  heal?: number;
  color: string;
  consumable?: boolean;
  usesBoardDice?: boolean;
  /** Extra cooldown in seconds added after action */
  extraCooldown?: number;
}

/** Legacy Card type for deck/rewards/interlude */
export interface Card {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  description: string;
  damage?: number;
  block?: number;
  faithCost?: number;
  faithGain?: number;
  color: string;
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  armor: number;
  /** Enemy attack speed */
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

export interface Relic {
  id: string;
  name: string;
  description: string;
  effect: string;
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

export interface InterludeReward {
  cards: Card[];
  equipment: EquipmentItem[];
  relics: Relic[];
}

/** ATB gauge unit for real-time combat */
export interface ATBUnit {
  id: string;
  name: string;
  /** Current gauge progress 0-100 */
  gauge: number;
  /** Speed at which gauge fills (points per tick) */
  speed: number;
  isPlayer: boolean;
  /** True when gauge is full and waiting for action selection */
  isActing: boolean;
  /** Extra cooldown to apply after action (for skills) */
  extraCooldown: number;
  /** Reference to enemy data (if not player) */
  enemyRef?: Enemy;
}

/** Result of a dice damage roll */
export interface DamageResult {
  rawDamage: number;
  isCrit: boolean;
  critMultiplier: number;
  finalDamage: number;
  armorBlocked: number;
  damageDealt: number;
  breakdown: string;
}
