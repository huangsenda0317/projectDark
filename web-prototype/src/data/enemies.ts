import type { Enemy } from '../types/game';

export const ENEMIES: Enemy[] = [
  {
    id: 'goblin',
    name: '地精信徒',
    hp: 24,
    maxHp: 24,
    armor: 0,
    intent: 'attack',
    intentValue: 6,
    damage: 6,
    sprite: 'goblin',
  },
  {
    id: 'skeleton',
    name: '腐朽骷髅',
    hp: 30,
    maxHp: 30,
    armor: 4,
    intent: 'attack',
    intentValue: 8,
    damage: 8,
    sprite: 'skeleton',
  },
  {
    id: 'cultist',
    name: '异端教徒',
    hp: 28,
    maxHp: 28,
    armor: 0,
    intent: 'curse',
    intentValue: 1,
    damage: 4,
    sprite: 'cultist',
  },
  {
    id: 'knight_fallen',
    name: '堕落骑士',
    hp: 45,
    maxHp: 45,
    armor: 8,
    intent: 'attack',
    intentValue: 12,
    damage: 12,
    sprite: 'knight',
  },
  {
    id: 'boss_inquisitor',
    name: '腐败审判官',
    hp: 80,
    maxHp: 80,
    armor: 10,
    intent: 'curse',
    intentValue: 1,
    damage: 10,
    sprite: 'boss',
  },
];

export function getRandomEnemy(floor: number): Enemy {
  const pool = floor >= 3
    ? ENEMIES.filter(e => e.id !== 'boss_inquisitor')
    : ENEMIES.filter(e => e.id === 'goblin' || e.id === 'skeleton');
  const base = pool[Math.floor(Math.random() * pool.length)];
  const clone: Enemy = { ...base, hp: base.hp + floor * 2, maxHp: base.hp + floor * 2 };
  return clone;
}
