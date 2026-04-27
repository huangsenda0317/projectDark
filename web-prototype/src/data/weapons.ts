import type { Weapon } from '../types/game';

/** Weapon definitions with dice slot requirements */
export const WEAPONS: Weapon[] = [
  {
    id: 'wpn_dagger',
    name: '匕首',
    formula: { diceCount: 2, diceFaces: 4, flatBonus: 1, critChance: 8, variance: 1 },
    diceRequirement: { type: 'any', diceCost: 1, label: '任意骰子' },
    weight: 1,
    description: '门槛最低，灵活填充任意骰子',
    set: 'shadow',
  },
  {
    id: 'wpn_shortsword',
    name: '短剑',
    formula: { diceCount: 2, diceFaces: 4, flatBonus: 1, critChance: 5, variance: 1 },
    diceRequirement: { type: 'threshold', value: 3, diceCost: 1, label: '≥3' },
    weight: 2,
    description: '低门槛，均衡之选',
    set: 'mixed',
  },
  {
    id: 'wpn_longsword',
    name: '长剑',
    formula: { diceCount: 2, diceFaces: 6, flatBonus: 3, critChance: 5, variance: 2 },
    diceRequirement: { type: 'threshold', value: 4, diceCost: 1, label: '≥4' },
    weight: 3,
    description: '中门槛，标准伤害',
    set: 'knight',
  },
  {
    id: 'wpn_warhammer',
    name: '骑士重锤',
    formula: { diceCount: 3, diceFaces: 8, flatBonus: 5, critChance: 8, variance: 3 },
    diceRequirement: { type: 'threshold', value: 5, diceCost: 1, label: '≥5' },
    weight: 8,
    description: '高门槛，高伤害高波动',
    set: 'knight',
  },
  {
    id: 'wpn_heretic_staff',
    name: '异端法杖',
    formula: { diceCount: 3, diceFaces: 13, flatBonus: 5, critChance: 8, variance: 4 },
    diceRequirement: { type: 'parity', value: 'odd', diceCost: 1, label: '奇数点' },
    weight: 3,
    description: '需奇数骰子，极端波动，赌徒之选',
    set: 'heretic',
  },
  {
    id: 'wpn_priest_focus',
    name: '修士法器',
    formula: { diceCount: 1, diceFaces: 6, flatBonus: 8, critChance: 3, variance: 1 },
    diceRequirement: { type: 'any', diceCost: 1, label: '任意骰子' },
    weight: 2,
    description: '无门槛，稳定低波动',
    set: 'friar',
  },
];

/** Get a weapon by ID */
export function getWeapon(id: string): Weapon | undefined {
  return WEAPONS.find(w => w.id === id);
}

/** Calculate battle dice pool size from agility */
export function getBattleDiceCount(agi: number, isLightLoad: boolean): number {
  let count = 3; // base
  count += Math.min(2, Math.floor(agi / 8)); // AGI bonus, max +2
  if (isLightLoad) count += 1;
  return count;
}

/** Check if a dice value meets a dice requirement */
export function meetsRequirement(value: number, req: { type: string; value?: number | string }): boolean {
  switch (req.type) {
    case 'any':
      return true;
    case 'threshold':
      return value >= (req.value as number);
    case 'parity':
      if (req.value === 'odd') return value % 2 === 1;
      if (req.value === 'even') return value % 2 === 0;
      return false;
    case 'pair':
      return true; // pair needs two dice, handled separately
    case 'straight':
      return true; // straight needs three dice, handled separately
    case 'sum':
      return true; // sum checked across multiple dice
    default:
      return false;
  }
}
