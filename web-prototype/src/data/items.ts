import type { Item } from '../types/game';

export const ITEMS: Item[] = [
  // Heal items
  { id: 'itm_potion', name: '治愈药水', type: 'heal', description: '恢复生命值', effect: 'heal', amount: 20, maxStack: 3, quality: 'common' },
  { id: 'itm_elixir', name: '大回复药', type: 'heal', description: '大量恢复生命值', effect: 'heal', amount: 40, maxStack: 2, quality: 'fine' },
  { id: 'itm_holy_water', name: '圣水', type: 'heal', description: '恢复HP并+1信仰', effect: 'heal_faith', amount: 15, maxStack: 3, quality: 'common' },

  // Faith items
  { id: 'itm_bead', name: '祈祷珠', type: 'special', description: '恢复信仰值', effect: 'faith', amount: 3, maxStack: 5, quality: 'common' },
  { id: 'itm_relic_dust', name: '圣物粉末', type: 'special', description: '恢复大量信仰值', effect: 'faith', amount: 6, maxStack: 3, quality: 'fine' },

  // Attack items
  { id: 'itm_smoke_bomb', name: '圣水瓶', type: 'attack', description: '对亵渎敌人造成大量伤害', effect: 'damage_holy', amount: 30, maxStack: 2, quality: 'common' },
  { id: 'itm_fire_oil', name: '火油壶', type: 'attack', description: '对所有敌人造成伤害', effect: 'damage_aoe', amount: 10, maxStack: 3, quality: 'common' },
  { id: 'itm_thunder_stone', name: '雷击石', type: 'attack', description: '对单体造成高伤害', effect: 'damage', amount: 25, maxStack: 3, quality: 'fine' },

  // Buff items
  { id: 'itm_str_scroll', name: '力量卷轴', type: 'buff', description: '本场战斗STR+5', effect: 'buff_str', amount: 5, maxStack: 2, quality: 'fine' },
  { id: 'itm_spd_scroll', name: '疾风卷轴', type: 'buff', description: '本场战斗攻速×1.3', effect: 'buff_speed', amount: 30, maxStack: 2, quality: 'fine' },
  { id: 'itm_def_scroll', name: '护盾卷轴', type: 'buff', description: '本场战斗CON+4，护甲+8', effect: 'buff_def', amount: 4, maxStack: 2, quality: 'fine' },

  // Special items
  { id: 'itm_id_scroll', name: '鉴定卷轴', type: 'special', description: '显示敌人全部属性', effect: 'reveal', amount: 0, maxStack: 2, quality: 'rare' },
  { id: 'itm_teleport', name: '传送石', type: 'special', description: '跳过当前格子（不触发事件）', effect: 'skip_cell', amount: 0, maxStack: 1, quality: 'rare' },
  { id: 'itm_purge_stone', name: '净化石', type: 'special', description: '清除2层诅咒', effect: 'purge_curse', amount: 2, maxStack: 3, quality: 'rare' },

  // Legendary items
  { id: 'itm_phoenix', name: '不死鸟之羽', type: 'special', description: '受到致命伤害时回复50%HP', effect: 'revive', amount: 50, maxStack: 1, quality: 'legendary' },
];

export function getItem(id: string): Item | undefined {
  return ITEMS.find(i => i.id === id);
}

export function getItemsByQuality(quality: string): Item[] {
  return ITEMS.filter(i => i.quality === quality);
}

export function getRandomItem(floor: number): Item {
  const quality = rollQuality(floor);
  const pool = ITEMS.filter(i => i.quality === quality);
  if (pool.length === 0) return ITEMS[Math.floor(Math.random() * ITEMS.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

function rollQuality(floor: number): string {
  if (floor <= 3) return weightedRandom({ common: 60, fine: 30, rare: 10, legendary: 0 });
  if (floor <= 6) return weightedRandom({ common: 40, fine: 35, rare: 20, legendary: 5 });
  if (floor <= 9) return weightedRandom({ common: 20, fine: 35, rare: 30, legendary: 15 });
  return weightedRandom({ common: 10, fine: 25, rare: 35, legendary: 30 });
}

function weightedRandom(weights: Record<string, number>): string {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [key, weight] of entries) {
    r -= weight;
    if (r <= 0) return key;
  }
  return entries[entries.length - 1][0];
}
