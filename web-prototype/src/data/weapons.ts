import type { Weapon } from '../types/game';

/** Weapon definitions with base speed and damage formulas */
export const WEAPONS: Weapon[] = [
  {
    id: 'wpn_dagger',
    name: '匕首',
    baseSpeed: 120,
    formula: { diceCount: 1, diceFaces: 4, flatBonus: 1, critChance: 8, variance: 1 },
    weight: 1,
    description: '极快，低伤害',
    set: 'shadow',
  },
  {
    id: 'wpn_shortsword',
    name: '短剑',
    baseSpeed: 100,
    formula: { diceCount: 2, diceFaces: 4, flatBonus: 1, critChance: 5, variance: 1 },
    weight: 2,
    description: '快速，均衡',
    set: 'mixed',
  },
  {
    id: 'wpn_longsword',
    name: '长剑',
    baseSpeed: 80,
    formula: { diceCount: 2, diceFaces: 6, flatBonus: 3, critChance: 5, variance: 2 },
    weight: 3,
    description: '中速，标准',
    set: 'knight',
  },
  {
    id: 'wpn_warhammer',
    name: '骑士重锤',
    baseSpeed: 50,
    formula: { diceCount: 3, diceFaces: 8, flatBonus: 5, critChance: 8, variance: 3 },
    weight: 8,
    description: '慢速，高伤害高波动',
    set: 'knight',
  },
  {
    id: 'wpn_heretic_staff',
    name: '异端法杖',
    baseSpeed: 60,
    formula: { diceCount: 3, diceFaces: 13, flatBonus: 5, critChance: 8, variance: 4 },
    weight: 3,
    description: '较慢，极端波动，赌徒之选',
    set: 'heretic',
  },
  {
    id: 'wpn_priest_focus',
    name: '修士法器',
    baseSpeed: 90,
    formula: { diceCount: 1, diceFaces: 6, flatBonus: 8, critChance: 3, variance: 1 },
    weight: 2,
    description: '较快，稳定低波动',
    set: 'friar',
  },
];

/** Get a weapon by ID */
export function getWeapon(id: string): Weapon | undefined {
  return WEAPONS.find(w => w.id === id);
}

/** Calculate actual attack speed with agility bonus */
export function calculateSpeed(baseSpeed: number, agi: number): number {
  return Math.floor(baseSpeed * (1 + agi * 0.02));
}

/** Calculate gauge fill rate (points per 100ms tick) */
export function getGaugeFillRate(speed: number): number {
  // Speed 100 = 1.0s read time = 10 points per 100ms tick to fill 100 in 1s
  return speed / 10;
}
