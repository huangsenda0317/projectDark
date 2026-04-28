import type { Weapon } from '../types/game';

/** Weapon definitions with dice sockets for embedding (GDD v0.3) */
export const WEAPONS: Weapon[] = [
  {
    id: 'wpn_dagger',
    name: '暗影匕首',
    baseFormula: { diceCount: 2, diceFaces: 4, flatBonus: 1, critChance: 10, variance: 1 },
    diceSocket: { type: 'weapon', faceMultiplier: 1, flatBonus: 1, critBonus: 0, varianceBonus: 0 },
    weight: 1,
    description: '高暴击，灵活轻便',
    set: 'shadow',
  },
  {
    id: 'wpn_shortsword',
    name: '短剑',
    baseFormula: { diceCount: 1, diceFaces: 6, flatBonus: 2, critChance: 5, variance: 1 },
    diceSocket: { type: 'weapon', faceMultiplier: 1, flatBonus: 2, critBonus: 0, varianceBonus: 0 },
    weight: 2,
    description: '均衡之选',
    set: 'mixed',
  },
  {
    id: 'wpn_longsword',
    name: '长剑',
    baseFormula: { diceCount: 1, diceFaces: 6, flatBonus: 3, critChance: 5, variance: 2 },
    diceSocket: { type: 'weapon', faceMultiplier: 1, flatBonus: 3, critBonus: 0, varianceBonus: 0 },
    weight: 3,
    description: '标准伤害，嵌入骰子释放公式',
    set: 'knight',
  },
  {
    id: 'wpn_warhammer',
    name: '骑士重锤',
    baseFormula: { diceCount: 2, diceFaces: 6, flatBonus: 5, critChance: 8, variance: 3 },
    diceSocket: { type: 'weapon', faceMultiplier: 1, flatBonus: 5, critBonus: 0, varianceBonus: 0 },
    weight: 8,
    description: '双骰重击，嵌入高面骰威力巨大',
    set: 'knight',
  },
  {
    id: 'wpn_heretic_staff',
    name: '异端法杖',
    baseFormula: { diceCount: 3, diceFaces: 6, flatBonus: 5, critChance: 8, variance: 4 },
    diceSocket: { type: 'weapon', faceMultiplier: 1, flatBonus: 5, critBonus: 0, varianceBonus: 0 },
    weight: 3,
    description: '三骰极端波动，赌徒之选',
    set: 'heretic',
  },
  {
    id: 'wpn_priest_focus',
    name: '修士法器',
    baseFormula: { diceCount: 1, diceFaces: 6, flatBonus: 8, critChance: 3, variance: 1 },
    diceSocket: { type: 'weapon', faceMultiplier: 1, flatBonus: 8, critBonus: 0, varianceBonus: 0 },
    weight: 2,
    description: '稳定低波动，神圣打击',
    set: 'friar',
  },
];

/** Get a weapon by ID */
export function getWeapon(id: string): Weapon | undefined {
  return WEAPONS.find(w => w.id === id);
}
