import type { Relic } from '../types/game';

export const RELICS: Relic[] = [
  { id: 'rel_saint_bone', name: '圣徒遗骨', description: '每进入战斗回复 5HP', effect: 'combat_heal_5' },
  { id: 'rel_heretic_log', name: '异端日志', description: '异端道具效果+50%', effect: 'heretic_boost' },
  { id: 'rel_dice_charm', name: '骰盘护符', description: '每局可重投骰子 1 次', effect: 'reroll_dice' },
  { id: 'rel_confession', name: '忏悔室钥匙', description: '商店额外一个免费选项', effect: 'shop_bonus' },
  { id: 'rel_martyr_blood', name: '殉道者之血', description: 'HP<15%时所有攻击伤害+50%（每场1次）', effect: 'low_hp_boost' },
  { id: 'rel_god_silence', name: '神明的沉默', description: '无法使用信仰技能，但攻击伤害+3', effect: 'no_faith_boost' },
  { id: 'rel_wheel_fragment', name: '命运之轮碎片', description: '投骰后可+1或-1（每层1次）', effect: 'modify_dice' },
  { id: 'rel_wildcard', name: '百搭徽章', description: '未触发任何套装时所有属性+2', effect: 'mixed_bonus' },
  { id: 'rel_chief_seal', name: '村长印章', description: 'Run 结束额外获 10 金币', effect: 'run_gold_bonus' },
];

export function getRelic(id: string): Relic | undefined {
  return RELICS.find(r => r.id === id);
}

export function getRandomRelic(): Relic {
  return RELICS[Math.floor(Math.random() * RELICS.length)];
}
