import type { CombatAction, DamageFormula, Card } from '../types/game';

/** Starter combat actions - each with an Elona-style dice formula */
export const COMBAT_ACTIONS: CombatAction[] = [
  // ─── Basic Attacks ───
  {
    id: 'act_attack_shortsword',
    name: '短剑攻击',
    type: 'attack',
    cardType: 'attack',
    cost: 1,
    description: '轻便快速的斩击',
    formula: { diceCount: 2, diceFaces: 4, flatBonus: 1, critChance: 5, variance: 1 },
    color: '#c82014',
  },
  {
    id: 'act_attack_longsword',
    name: '长剑攻击',
    type: 'attack',
    cardType: 'attack',
    cost: 1,
    description: '均衡的斩击',
    formula: { diceCount: 2, diceFaces: 6, flatBonus: 3, critChance: 5, variance: 2 },
    color: '#c82014',
  },
  {
    id: 'act_attack_heavy',
    name: '重锤猛击',
    type: 'attack',
    cardType: 'attack',
    cost: 2,
    description: '沉重但高波动的打击',
    formula: { diceCount: 3, diceFaces: 8, flatBonus: 5, critChance: 8, variance: 3 },
    color: '#c82014',
  },
  {
    id: 'act_attack_pierce',
    name: '穿透刺击',
    type: 'attack',
    cardType: 'attack',
    cost: 1,
    description: '无视护甲的精准一击',
    formula: { diceCount: 1, diceFaces: 6, flatBonus: 2, critChance: 10, variance: 1 },
    color: '#c82014',
  },

  // ─── Skills ───
  {
    id: 'act_skill_judgment',
    name: '神判之刃',
    type: 'skill',
    cardType: 'attack',
    cost: 2,
    description: '借用棋盘骰子之力的一击，Z值=最后棋盘骰子点数',
    formula: { diceCount: 2, diceFaces: 6, flatBonus: 0, critChance: 5, variance: 2 },
    color: '#cba258',
    usesBoardDice: true,
  },
  {
    id: 'act_skill_heretic_flame',
    name: '异端火焰',
    type: 'skill',
    cardType: 'heretic',
    cost: 1,
    description: '禁忌的火焰，高波动',
    formula: { diceCount: 3, diceFaces: 13, flatBonus: 5, critChance: 8, variance: 4 },
    faithCost: 2,
    color: '#7c3aed',
  },
  {
    id: 'act_skill_priest_bless',
    name: '修士祝祷',
    type: 'skill',
    cardType: 'faith',
    cost: 1,
    description: '稳定低波动的神圣打击',
    formula: { diceCount: 1, diceFaces: 6, flatBonus: 8, critChance: 3, variance: 1 },
    faithCost: 1,
    color: '#cba258',
  },
  {
    id: 'act_skill_lucky_pray',
    name: '幸运祈祷',
    type: 'skill',
    cardType: 'faith',
    cost: 1,
    description: '若本层骰子点数和>15，回复5HP',
    heal: 5,
    color: '#cba258',
  },
  {
    id: 'act_skill_fortune_flip',
    name: '命运翻转',
    type: 'skill',
    cardType: 'defense',
    cost: 1,
    description: '将本层已用骰子点数总和转化为护甲',
    color: '#2b7de9',
  },

  // ─── Defense ───
  {
    id: 'act_defend_block',
    name: '格挡',
    type: 'defend',
    cardType: 'defense',
    cost: 1,
    description: '获得 5 点护甲',
    block: 5,
    color: '#2b7de9',
  },
  {
    id: 'act_defend_shield',
    name: '圣盾',
    type: 'defend',
    cardType: 'defense',
    cost: 2,
    description: '获得 10 点护甲',
    block: 10,
    color: '#2b7de9',
  },

  // ─── Items / Consumables ───
  {
    id: 'act_item_heal',
    name: '使用圣水',
    type: 'item',
    cardType: 'miracle',
    cost: 1,
    description: '回复 15 HP',
    heal: 15,
    color: '#ffffff',
    consumable: true,
  },

  // ─── Flee ───
  {
    id: 'act_flee',
    name: '逃跑',
    type: 'flee',
    cardType: 'curse',
    cost: 1,
    description: '离开战斗，失去 5 HP',
    color: '#666666',
  },
];

/** Get available actions for player (simplified - all actions always available in Elona system) */
export function getAvailableActions(): CombatAction[] {
  return COMBAT_ACTIONS;
}

/** ─── Legacy Card data for deck/rewards (kept for interlude/village systems) ─── */
export const CARDS: Card[] = [
  { id: 'atk_strike', name: '打击', type: 'attack', cost: 1, description: '造成 6 点伤害', damage: 6, color: '#c82014' },
  { id: 'atk_heavy', name: '重击', type: 'attack', cost: 2, description: '造成 14 点伤害', damage: 14, color: '#c82014' },
  { id: 'def_block', name: '格挡', type: 'defense', cost: 1, description: '获得 5 点护甲', block: 5, color: '#2b7de9' },
  { id: 'def_shield', name: '圣盾', type: 'defense', cost: 2, description: '获得 10 点护甲', block: 10, color: '#2b7de9' },
  { id: 'faith_pray', name: '祈祷', type: 'faith', cost: 1, description: '获得 3 信仰值', faithGain: 3, color: '#cba258' },
  { id: 'faith_bless', name: '祝福', type: 'faith', cost: 1, description: '下一张卡费用-1', color: '#cba258' },
  { id: 'heretic_flame', name: '异端之火', type: 'heretic', cost: 1, description: '造成 8 点伤害，失去 1 信仰', damage: 8, faithCost: 1, color: '#7c3aed' },
  { id: 'curse_pain', name: '痛苦', type: 'curse', cost: 1, description: '无法打出。每回合受到 2 点伤害。', color: '#333333' },
  { id: 'miracle_heal', name: '圣疗', type: 'miracle', cost: 1, description: '回复 15 HP。使用后消失。', color: '#ffffff' },
];

export const STARTER_DECK: Card[] = [
  CARDS.find(c => c.id === 'atk_strike')!,
  CARDS.find(c => c.id === 'atk_strike')!,
  CARDS.find(c => c.id === 'def_block')!,
  CARDS.find(c => c.id === 'def_block')!,
  CARDS.find(c => c.id === 'faith_pray')!,
];
