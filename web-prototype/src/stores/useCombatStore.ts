import { create } from 'zustand';
import type { Enemy, DiceSlot, DamageResult, Weapon, BattleDice } from '../types/game';
import { calculateDamage, applyStatBonuses } from '../services/diceDamageService';
import { getWeapon, getBattleDiceCount, meetsRequirement } from '../data/weapons';
import { getRandomEnemy } from '../data/enemies';
import { useGameStore } from './useGameStore';

interface CombatState {
  // Dice pool
  battleDice: BattleDice[];
  maxDice: number;
  rerollsLeft: number;
  selectedDieIndex: number | null;
  // Dice slots (weapon + basic actions + set skills)
  diceSlots: DiceSlot[];
  allocations: Record<string, number[]>; // slot ID → allocated die indices
  // Enemies
  enemies: Enemy[];
  // Combat state
  combatLog: string[];
  combatEnded: boolean;
  victory: boolean;
  lastDamageResult: DamageResult | null;
  currentWeapon: Weapon | null;
  turnPhase: 'roll' | 'allocate' | 'execute';

  // Actions
  startCombat: (floor: number) => void;
  rollDice: () => void;
  selectDie: (index: number) => void;
  allocateDie: (slotId: string) => void;
  unallocateDie: (slotId: string) => void;
  rerollUnallocated: () => void;
  commitTurn: () => void;
  enemyAct: () => void;
  addCombatLog: (msg: string) => void;
  resetCombat: () => void;
}

/** Build available dice slots based on equipped weapon and set bonuses */
function buildDiceSlots(weapon: Weapon | null): DiceSlot[] {
  const slots: DiceSlot[] = [];

  // Weapon attack slot
  if (weapon) {
    slots.push({
      id: 'slot_weapon',
      name: `${weapon.name}攻击`,
      type: 'attack',
      diceRequirement: weapon.diceRequirement,
      formula: weapon.formula,
      color: '#c82014',
      description: weapon.description,
    });
  }

  // Basic defend slot
  slots.push({
    id: 'slot_defend',
    name: '格挡',
    type: 'defend',
    diceRequirement: { type: 'any', diceCost: 1, label: '任意骰子' },
    block: 5,
    color: '#2b7de9',
    description: '获得 5 点护甲',
  });

  // Board-dice-linked skills
  slots.push({
    id: 'slot_judgment',
    name: '神判之刃',
    type: 'skill',
    diceRequirement: { type: 'any', diceCost: 1, label: '任意骰子' },
    formula: { diceCount: 2, diceFaces: 6, flatBonus: 0, critChance: 5, variance: 2 },
    usesBoardDice: true,
    color: '#cba258',
    description: '借用棋盘骰子之力的一击',
  });

  slots.push({
    id: 'slot_heretic_flame',
    name: '异端火焰',
    type: 'skill',
    diceRequirement: { type: 'parity', value: 'odd', diceCost: 1, label: '奇数点' },
    formula: { diceCount: 3, diceFaces: 13, flatBonus: 5, critChance: 8, variance: 4 },
    faithCost: 2,
    color: '#7c3aed',
    description: '禁忌的火焰，高波动',
  });

  slots.push({
    id: 'slot_priest_bless',
    name: '修士祝祷',
    type: 'skill',
    diceRequirement: { type: 'any', diceCost: 1, label: '任意骰子' },
    formula: { diceCount: 1, diceFaces: 6, flatBonus: 8, critChance: 3, variance: 1 },
    faithCost: 1,
    color: '#cba258',
    description: '稳定低波动的神圣打击',
  });

  // Lucky Pray
  slots.push({
    id: 'slot_lucky_pray',
    name: '幸运祈祷',
    type: 'skill',
    diceRequirement: { type: 'any', diceCost: 1, label: '任意骰子' },
    heal: 5,
    color: '#cba258',
    description: '若本层骰子点数和>15，回复5HP',
  });

  // Fortune Flip (board dice → armor)
  slots.push({
    id: 'slot_fortune_flip',
    name: '命运翻转',
    type: 'defend',
    diceRequirement: { type: 'any', diceCost: 1, label: '任意骰子' },
    color: '#2b7de9',
    description: '将本层已用骰子点数总和转化为护甲',
  });

  // Item slot
  slots.push({
    id: 'slot_item_heal',
    name: '使用圣水',
    type: 'item',
    diceRequirement: { type: 'any', diceCost: 1, label: '任意骰子' },
    heal: 15,
    color: '#ffffff',
    description: '回复 15 HP',
  });

  // Flee slot
  slots.push({
    id: 'slot_flee',
    name: '逃跑',
    type: 'flee',
    diceRequirement: { type: 'any', diceCost: 1, label: '任意骰子' },
    color: '#666666',
    description: '离开战斗，失去 5 HP',
  });

  return slots;
}

/** Roll a single D6 */
function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export const useCombatStore = create<CombatState>((set, get) => ({
  battleDice: [],
  maxDice: 3,
  rerollsLeft: 1,
  selectedDieIndex: null,
  diceSlots: [],
  allocations: {},
  enemies: [],
  combatLog: [],
  combatEnded: false,
  victory: false,
  lastDamageResult: null,
  currentWeapon: null,
  turnPhase: 'allocate',

  startCombat: (floor) => {
    const game = useGameStore.getState();
    const weapon = getWeapon('wpn_shortsword') || null;
    const diceCount = getBattleDiceCount(game.player.stats.agi, game.player.encumbrance <= game.player.maxEncumbrance * 0.5);

    const enemyCount = floor >= 6 ? 2 : 1;
    const enemies: Enemy[] = [];
    for (let i = 0; i < enemyCount; i++) {
      enemies.push(getRandomEnemy(floor));
    }

    // Roll initial dice
    const battleDice: BattleDice[] = [];
    for (let i = 0; i < diceCount; i++) {
      battleDice.push({ index: i, value: rollD6(), allocated: false });
    }

    const slots = buildDiceSlots(weapon);

    set({
      battleDice,
      maxDice: diceCount,
      rerollsLeft: 1,
      selectedDieIndex: null,
      diceSlots: slots,
      allocations: {},
      enemies,
      combatLog: [`⚔️ 战斗开始！遭遇 ${enemies.map(e => e.name).join('、')}！`, `🎲 投出 ${battleDice.map(d => d.value).join(' ')} —— 将骰子分配到技能槽`],
      combatEnded: false,
      victory: false,
      lastDamageResult: null,
      currentWeapon: weapon,
      turnPhase: 'allocate',
    });
  },

  rollDice: () => {
    const state = get();
    const diceCount = state.maxDice;
    const battleDice: BattleDice[] = [];
    for (let i = 0; i < diceCount; i++) {
      battleDice.push({ index: i, value: rollD6(), allocated: false });
    }
    set({
      battleDice,
      rerollsLeft: 1,
      selectedDieIndex: null,
      allocations: {},
      turnPhase: 'allocate',
    });
    get().addCombatLog(`🎲 新回合！投出 ${battleDice.map(d => d.value).join(' ')}`);
  },

  selectDie: (index) => {
    const state = get();
    const die = state.battleDice[index];
    if (!die || die.allocated) return;
    set({
      selectedDieIndex: state.selectedDieIndex === index ? null : index,
    });
  },

  allocateDie: (slotId) => {
    const state = get();
    if (state.selectedDieIndex === null) return;
    if (state.turnPhase !== 'allocate') return;

    const die = state.battleDice[state.selectedDieIndex];
    if (!die || die.allocated) return;

    const slot = state.diceSlots.find(s => s.id === slotId);
    if (!slot) return;

    // Check if die meets requirement
    if (!meetsRequirement(die.value, { type: slot.diceRequirement.type, value: slot.diceRequirement.value })) {
      get().addCombatLog(`❌ ${die.value} 不满足「${slot.name}」的需求（${slot.diceRequirement.label}）`);
      return;
    }

    // Check faith cost
    if (slot.faithCost) {
      const game = useGameStore.getState();
      if (slot.faithCost > game.player.faith) {
        get().addCombatLog('❌ 信仰不足！');
        return;
      }
    }

    // Unallocate previous die from this slot if present
    const newAllocations = { ...state.allocations };
    const prev = newAllocations[slotId] || [];
    // Return previous dice to pool
    for (const prevIdx of prev) {
      state.battleDice[prevIdx].allocated = false;
      state.battleDice[prevIdx].allocatedTo = undefined;
    }
    newAllocations[slotId] = [state.selectedDieIndex];

    // Mark die as allocated
    const newDice = state.battleDice.map((d, i) => {
      if (i === state.selectedDieIndex) {
        return { ...d, allocated: true, allocatedTo: slotId };
      }
      return d;
    });

    set({
      battleDice: newDice,
      allocations: newAllocations,
      selectedDieIndex: null,
    });

    get().addCombatLog(`🎯 ${die.value} →「${slot.name}」`);
  },

  unallocateDie: (slotId) => {
    const state = get();
    const allocated = state.allocations[slotId];
    if (!allocated || allocated.length === 0) return;

    const newDice = state.battleDice.map(d => {
      if (allocated.includes(d.index)) {
        return { ...d, allocated: false, allocatedTo: undefined };
      }
      return d;
    });

    const newAllocations = { ...state.allocations };
    delete newAllocations[slotId];

    set({ battleDice: newDice, allocations: newAllocations });
    get().addCombatLog(`↩️ 收回「${state.diceSlots.find(s => s.id === slotId)?.name || slotId}」的骰子`);
  },

  rerollUnallocated: () => {
    const state = get();
    if (state.rerollsLeft <= 0) return;
    if (state.turnPhase !== 'allocate') return;

    const newDice = state.battleDice.map(d => {
      if (!d.allocated) {
        return { ...d, value: rollD6() };
      }
      return d;
    });

    set({
      battleDice: newDice,
      rerollsLeft: state.rerollsLeft - 1,
    });

    get().addCombatLog(`🔄 重投未分配骰子 → ${newDice.filter(d => !d.allocated).map(d => d.value).join(' ')}`);
  },

  commitTurn: () => {
    const state = get();
    if (state.turnPhase !== 'allocate') return;

    set({ turnPhase: 'execute' });

    // Convert unused dice to shield
    const unusedCount = state.battleDice.filter(d => !d.allocated).length;
    if (unusedCount > 0) {
      useGameStore.setState(s => ({
        player: { ...s.player, armor: s.player.armor + unusedCount },
      }));
      get().addCombatLog(`🛡️ ${unusedCount} 颗未使用骰子 → +${unusedCount} 护盾`);
    }

    // Execute allocated actions
    const logs: string[] = [];
    let lastResult: DamageResult | null = null;
    const game = useGameStore.getState();
    const enemies = state.enemies.map(e => ({ ...e }));
    let playerArmor = game.player.armor;

    for (const [slotId, dieIndices] of Object.entries(state.allocations)) {
      const slot = state.diceSlots.find(s => s.id === slotId);
      if (!slot || dieIndices.length === 0) continue;

      // Consume faith
      if (slot.faithCost) {
        useGameStore.getState().addFaith(-slot.faithCost);
      }

      switch (slot.type) {
        case 'attack':
        case 'skill': {
          if (!slot.formula) break;
          const target = enemies.find(e => e.hp > 0);
          if (!target) break;

          let formula = applyStatBonuses(slot.formula, game.player.stats);
          const boardDice = slot.usesBoardDice
            ? (game.run.diceHistory[game.run.diceHistory.length - 1] ?? 0)
            : null;

          const result = calculateDamage(formula, target.armor, {
            boardDiceRoll: boardDice ?? null,
          });
          lastResult = result;

          target.hp -= result.damageDealt;
          target.armor = Math.max(0, target.armor - result.armorBlocked);

          const critMsg = result.isCrit ? ' 💥暴击！' : '';
          logs.push(`${slot.name}${critMsg} → ${target.name} 受到 ${result.damageDealt} 点伤害！`);
          if (target.hp <= 0) {
            logs.push(`${target.name} 被击败了！`);
          }
          break;
        }

        case 'defend': {
          if (slot.block) {
            playerArmor += slot.block;
            logs.push(`${slot.name} → 获得 ${slot.block} 点护甲。`);
          }
          if (slot.id === 'slot_fortune_flip') {
            const diceSum = game.run.diceHistory.reduce((a, b) => a + b, 0);
            playerArmor += diceSum;
            logs.push(`命运翻转！骰子和 ${diceSum} → +${diceSum} 护甲。`);
          }
          break;
        }

        case 'item': {
          if (slot.heal) {
            useGameStore.getState().heal(slot.heal);
            logs.push(`${slot.name} → 回复 ${slot.heal} HP。`);
          }
          break;
        }

        case 'flee': {
          useGameStore.getState().takeDamage(5);
          logs.push('逃跑成功！受到 5 点伤害。');
          set({
            combatEnded: true,
            victory: false,
            combatLog: [...state.combatLog, ...logs],
            turnPhase: 'execute',
          });
          return;
        }
      }
    }

    // Lucky Pray check
    const luckySlot = state.allocations['slot_lucky_pray'];
    if (luckySlot && luckySlot.length > 0) {
      const diceSum = game.run.diceHistory.reduce((a, b) => a + b, 0);
      if (diceSum > 15) {
        useGameStore.getState().heal(5);
        logs.push('幸运祈祷生效！骰子和 > 15，回复 5 HP。');
      } else {
        logs.push(`幸运祈祷未生效。骰子和 ${diceSum}。`);
      }
    }

    // Update player armor
    useGameStore.setState(s => ({
      player: { ...s.player, armor: playerArmor },
    }));

    const aliveEnemies = enemies.filter(e => e.hp > 0);
    const victory = aliveEnemies.length === 0;

    if (victory) {
      const goldReward = 10 + game.run.floor * 2;
      useGameStore.getState().addGold(goldReward);
      logs.push(`🏆 战斗胜利！获得 ${goldReward} 金币！`);
    }

    set(s => ({
      enemies: aliveEnemies,
      lastDamageResult: lastResult,
      combatLog: [...s.combatLog, ...logs],
      combatEnded: victory,
      victory,
    }));

    // Enemy turn
    if (!victory) {
      setTimeout(() => get().enemyAct(), 600);
    }
  },

  enemyAct: () => {
    const state = get();
    const game = useGameStore.getState();
    const logs: string[] = [];

    let playerHp = game.player.hp;
    let playerArmor = game.player.armor;

    for (const enemy of state.enemies) {
      if (enemy.hp <= 0) continue;

      logs.push(`👁️ ${enemy.name} 意图: ${intentLabel(enemy.intent)}`);

      if (enemy.intent === 'attack') {
        const dmg = enemy.damage;
        const throughArmor = Math.max(0, dmg - playerArmor);
        playerArmor = Math.max(0, playerArmor - dmg);
        playerHp -= throughArmor;
        logs.push(`${enemy.name} 发动攻击 → 造成 ${throughArmor} 点伤害！`);
      } else if (enemy.intent === 'block') {
        enemy.armor += enemy.intentValue;
        logs.push(`${enemy.name} 进入防御 → 获得 ${enemy.intentValue} 点护甲。`);
      } else if (enemy.intent === 'curse') {
        logs.push(`${enemy.name} 施加诅咒！`);
        useGameStore.getState().addCurse(1);
      }

      // Randomize next intent (weighted toward attack)
      const intents = ['attack', 'attack', 'block', 'curse'] as const;
      enemy.intent = intents[Math.floor(Math.random() * intents.length)];
    }

    // Apply damage
    if (playerHp !== game.player.hp) {
      const dmgTaken = game.player.hp - playerHp;
      useGameStore.getState().takeDamage(dmgTaken);
    }

    // Update armor
    useGameStore.setState(s => ({
      player: { ...s.player, armor: playerArmor },
    }));

    const defeated = useGameStore.getState().player.hp <= 0;

    if (defeated) {
      logs.push('💀 你被击败了...');
    }

    set(s => ({
      combatLog: [...s.combatLog, ...logs],
      combatEnded: defeated,
      victory: false,
    }));

    // Roll new dice for next turn if still alive
    if (!defeated) {
      setTimeout(() => get().rollDice(), 400);
    }
  },

  addCombatLog: (msg) =>
    set((state) => ({
      combatLog: [...state.combatLog, msg],
    })),

  resetCombat: () =>
    set({
      battleDice: [],
      maxDice: 3,
      rerollsLeft: 1,
      selectedDieIndex: null,
      diceSlots: [],
      allocations: {},
      enemies: [],
      combatLog: [],
      combatEnded: false,
      victory: false,
      lastDamageResult: null,
      currentWeapon: null,
      turnPhase: 'allocate',
    }),
}));

function intentLabel(intent: string): string {
  const labels: Record<string, string> = {
    attack: '⚔️ 攻击',
    block: '🛡️ 防御',
    summon: '👥 召唤',
    curse: '💀 诅咒',
    buff: '✨ 强化',
  };
  return labels[intent] || intent;
}
