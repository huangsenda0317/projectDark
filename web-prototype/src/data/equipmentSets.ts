import type { EquipmentItem, EquipmentSet, EquipmentSlot } from '../types/game';

interface SetBonus {
  pieces: number;
  description: string;
}

export interface EquipmentSetData {
  id: EquipmentSet;
  name: string;
  description: string;
  totalWeight: number;
  bonuses: SetBonus[];
}

export const EQUIPMENT_SETS: Record<string, EquipmentSetData> = {
  knight: {
    id: 'knight',
    name: '骑士套装',
    description: '沉重铁甲，神圣加持，庄严而不可撼动',
    totalWeight: 22,
    bonuses: [
      { pieces: 2, description: '每回合自动获得 4 点护甲' },
      { pieces: 4, description: '解锁「神圣冲锋」：消耗 5 信仰，对所有敌人造成(力量×3)伤害' },
      { pieces: 6, description: '受到致命伤害时 1 次免死，保留 1HP（每场战斗 1 次）' },
    ],
  },
  friar: {
    id: 'friar',
    name: '修士袍装',
    description: '轻薄布衣，信仰刺绣，每一针都是祈祷',
    totalWeight: 6,
    bonuses: [
      { pieces: 2, description: '信仰值每满 5 点，自动回复 3HP' },
      { pieces: 4, description: '解锁「神谕降临」：消耗 8 信仰，随机施加 3 个祝福状态并抽 2 张牌' },
      { pieces: 6, description: '每次获得信仰值时，额外获得 1 点（永久被动）' },
    ],
  },
  heretic: {
    id: 'heretic',
    name: '异端装束',
    description: '破碎的符文皮甲，禁忌的紫色火焰渗透每一条缝隙',
    totalWeight: 10,
    bonuses: [
      { pieces: 2, description: '信仰值越低，法术伤害越高（最多+80%）' },
      { pieces: 4, description: '解锁「禁断仪式」：消耗 3 信仰（或等量 HP），召唤异端火焰持续灼烧敌人' },
      { pieces: 6, description: '每次打出异端牌，额外造成 2 点穿透伤害' },
    ],
  },
  shadow: {
    id: 'shadow',
    name: '暗影盗贼套',
    description: '不存在于教会记录中的装备，来自某个更古老的秘密',
    totalWeight: 8,
    bonuses: [
      { pieces: 2, description: '闪避率+15%' },
      { pieces: 4, description: '解锁「消影步」：本回合所有攻击无法被格挡，消耗 3AP' },
      { pieces: 6, description: '战斗开始时随机窃取敌人 1 个正面状态' },
    ],
  },
  alchemist: {
    id: 'alchemist',
    name: '炼金术士套',
    description: '奇异的药瓶、符文手套、蒸馏护目镜——实验室的延伸',
    totalWeight: 12,
    bonuses: [
      { pieces: 2, description: '每层开始随机获得 1 个消耗品' },
      { pieces: 4, description: '解锁「实验爆炸」：将手中 1 张消耗品转化为对所有敌人的伤害' },
      { pieces: 6, description: '消耗品效果翻倍' },
    ],
  },
};

export const EQUIPMENT_ITEMS: EquipmentItem[] = [
  // Knight set
  { id: 'knight_helm', name: '骑士头盔', slot: 'helmet', set: 'knight', weight: 3, stats: { str: 2, con: 1 }, description: '沉重的铁制头盔，刻有圣徽' },
  { id: 'knight_chest', name: '骑士胸甲', slot: 'chest', set: 'knight', weight: 6, stats: { str: 3, con: 2 }, description: '覆盖全身的板甲，神圣加持' },
  { id: 'knight_weapon', name: '骑士长剑', slot: 'weapon', set: 'knight', weight: 4, stats: { str: 3 }, description: '双手长剑，锋刃闪着寒光' },
  { id: 'knight_shield', name: '骑士盾', slot: 'offhand', set: 'knight', weight: 5, stats: { con: 2, str: 1 }, description: '巨大的塔盾，可抵挡重击' },
  { id: 'knight_boots', name: '骑士靴', slot: 'boots', set: 'knight', weight: 2, stats: { str: 1, con: 1 }, description: '铁靴，踏入战场时铿锵作响' },
  { id: 'knight_cloak', name: '骑士披风', slot: 'cloak', set: 'knight', weight: 2, stats: { fai: 1, str: 1 }, description: '白色披风，象征纯洁信仰' },

  // Friar set
  { id: 'friar_hood', name: '修士头巾', slot: 'helmet', set: 'friar', weight: 1, stats: { fai: 2, int: 1 }, description: '简单的布质头巾，绣有祈祷文' },
  { id: 'friar_robe', name: '修士长袍', slot: 'chest', set: 'friar', weight: 2, stats: { fai: 3, int: 1 }, description: '轻薄布衣，每一针都是祈祷' },
  { id: 'friar_staff', name: '祈祷杖', slot: 'weapon', set: 'friar', weight: 1, stats: { int: 2, fai: 1 }, description: '木质手杖，顶端镶嵌圣石' },

  // Shadow set
  { id: 'shadow_mask', name: '影面罩', slot: 'helmet', set: 'shadow', weight: 1, stats: { agi: 2 }, description: '遮住面容的黑色面罩' },
  { id: 'shadow_dagger', name: '影之刃', slot: 'weapon', set: 'shadow', weight: 1, stats: { agi: 3 }, description: '轻巧的短刃，适合隐匿刺杀' },

  // Heretic set
  { id: 'heretic_glove', name: '符文手套', slot: 'wrist', set: 'heretic', weight: 1, stats: { int: 2, fai: -1 }, description: '刻有禁忌符文的手套' },

  // Alchemist set
  { id: 'alchemist_goggle', name: '蒸馏护目镜', slot: 'helmet', set: 'alchemist', weight: 1, stats: { int: 2 }, description: '炼金术士的标志性装备' },
];

export function getEquipmentBySet(setId: EquipmentSet): EquipmentItem[] {
  return EQUIPMENT_ITEMS.filter(e => e.set === setId);
}

export function getSetBonusCounts(equipped: EquipmentItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of equipped) {
    counts[item.set] = (counts[item.set] || 0) + 1;
  }
  return counts;
}
