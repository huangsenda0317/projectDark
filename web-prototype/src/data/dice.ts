import type { DiceEntity, DiceAffix, DiceFaceCount, DiceQuality } from '../types/game';

// ─── Affix Pools (GDD section 6.3) ──────────────────────────

const THROW_AFFIXES: DiceAffix[] = [
  { id: 'step_mod', name: '步数修正', type: 'throw', effect: '投掷后点数 ±1（可选）', quality: 'common' },
  { id: 'first_strike', name: '先手之骰', type: 'throw', effect: '踩战斗格时先手 +1', quality: 'fine' },
  { id: 'merchant_sense', name: '商道', type: 'throw', effect: '经过商店格时自动触发 9 折', quality: 'fine' },
  { id: 'sprint', name: '疾走', type: 'throw', effect: '顺时针移动时额外 +1 步', quality: 'rare' },
  { id: 'foresight', name: '预知', type: 'throw', effect: '投掷前可预览落点格类型', quality: 'rare' },
  { id: 'cycle_step', name: '轮回步', type: 'throw', effect: '可逆时针走完一圈回到原地（不触发诅咒）', quality: 'legendary' },
];

const EMBED_AFFIXES: DiceAffix[] = [
  { id: 'sharp', name: '锋锐', type: 'embed', effect: '嵌入武器时暴击率 +5%', quality: 'common' },
  { id: 'tough', name: '坚韧', type: 'embed', effect: '嵌入防具时护甲 +2', quality: 'common' },
  { id: 'burning', name: '灼热', type: 'embed', effect: '攻击附带骰子面数×0.5 的火焰伤害', quality: 'fine' },
  { id: 'lifesteal', name: '吸血', type: 'embed', effect: '造成伤害的 10% 转为 HP', quality: 'rare' },
  { id: 'shatter', name: '碎裂', type: 'embed', effect: '暴击时目标护甲减半', quality: 'rare' },
  { id: 'divine_punish', name: '神罚', type: 'embed', effect: '对亵渎敌人伤害 ×1.5', quality: 'legendary' },
];

const UNIVERSAL_AFFIXES: DiceAffix[] = [
  { id: 'healing_light', name: '治愈之光', type: 'universal', effect: '每层开始恢复 3 HP', quality: 'common' },
  { id: 'pious', name: '虔诚', type: 'universal', effect: '信仰获取 +1', quality: 'fine' },
  { id: 'light_burden', name: '轻负', type: 'universal', effect: '负重上限 +2kg', quality: 'fine' },
  { id: 'lucky_star', name: '幸运星', type: 'universal', effect: '战斗奖励稀有选项概率 +10%', quality: 'rare' },
  { id: 'dice_magnet', name: '骰子磁铁', type: 'universal', effect: '战斗掉落额外骰子的概率 +15%', quality: 'legendary' },
];

const ALL_AFFIXES = [...THROW_AFFIXES, ...EMBED_AFFIXES, ...UNIVERSAL_AFFIXES];

// ─── Dice Names by Face Count ───────────────────────────────

const DICE_NAMES: Record<number, string> = {
  4: '小骰', 6: '方骰', 8: '八面骰', 10: '十面骰', 12: '十二面骰', 20: '天命骰', 100: '百面骰',
};

const QUALITY_NAMES: Record<DiceQuality, string> = {
  common: '普通', fine: '精良', rare: '稀有', legendary: '传说',
};

// ─── Floor-based Face Count Availability ────────────────────

function getFacePool(floor: number): DiceFaceCount[] {
  if (floor <= 3) return [4, 6, 8];
  if (floor <= 6) return [6, 8, 10, 12];
  if (floor <= 9) return [8, 10, 12, 20];
  return [10, 12, 20, 100];
}

// ─── Quality weights by floor ───────────────────────────────

function rollQuality(floor: number): DiceQuality {
  const r = Math.random() * 100;
  if (floor <= 3) {
    if (r < 70) return 'common';
    if (r < 95) return 'fine';
    return 'rare';
  } else if (floor <= 6) {
    if (r < 40) return 'common';
    if (r < 75) return 'fine';
    if (r < 95) return 'rare';
    return 'legendary';
  } else {
    if (r < 15) return 'common';
    if (r < 45) return 'fine';
    if (r < 80) return 'rare';
    return 'legendary';
  }
}

function affixCountForQuality(quality: DiceQuality): number {
  switch (quality) {
    case 'common': return 1;
    case 'fine': return 2;
    case 'rare': return 3;
    case 'legendary': return 4;
  }
}

// ─── Public API ─────────────────────────────────────────────

let diceIdCounter = 0;

export function generateRandomDice(floor: number, forceQuality?: DiceQuality): DiceEntity {
  const quality = forceQuality ?? rollQuality(floor);
  const facePool = getFacePool(floor);
  const faces = facePool[Math.floor(Math.random() * facePool.length)];
  const canMove = faces !== 100;

  // Generate affixes
  const count = affixCountForQuality(quality);
  const shuffled = [...ALL_AFFIXES].sort(() => Math.random() - 0.5);
  const affixes = shuffled.slice(0, Math.min(count, shuffled.length));

  diceIdCounter++;
  const qualityLabel = QUALITY_NAMES[quality];
  const name = `${qualityLabel}${DICE_NAMES[faces]}`;

  return {
    id: `dice_${faces}_${quality}_${diceIdCounter}`,
    name,
    quality,
    faces,
    affixes,
    canMove,
    wear: 0,
    shattered: false,
  };
}

/** Initial dice given to player at start of run — GDD v0.4.1: D4 + D6 */
export const INITIAL_PLAYER_D4: DiceEntity = {
  id: 'dice_d4_white_init',
  name: '普通小骰',
  quality: 'common',
  faces: 4,
  affixes: [],
  canMove: true,
  wear: 0,
  shattered: false,
};

export const INITIAL_PLAYER_D6: DiceEntity = {
  id: 'dice_d6_white_init',
  name: '普通方骰',
  quality: 'common',
  faces: 6,
  affixes: [{ id: 'step_mod', name: '步数修正', type: 'throw', effect: '投掷后点数 ±1（可选）', quality: 'common' }],
  canMove: true,
  wear: 0,
  shattered: false,
};

/** @deprecated Use INITIAL_PLAYER_D6 instead */
export const INITIAL_PLAYER_DICE = INITIAL_PLAYER_D6;

export const INITIAL_PLAYER_DICE_SET: DiceEntity[] = [
  { ...INITIAL_PLAYER_D4 },
  { ...INITIAL_PLAYER_D6 },
];

/** Fallback D4 die for empty dice box */
export const FALLBACK_D4: DiceEntity = {
  id: 'dice_d4_fallback',
  name: '普通小骰',
  quality: 'common',
  faces: 4,
  affixes: [],
  canMove: true,
  wear: 0,
  shattered: false,
};
