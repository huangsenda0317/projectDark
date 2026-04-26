import { create } from 'zustand';
import type { Enemy, CombatAction, DamageResult, ATBUnit, Weapon } from '../types/game';
import { calculateDamage, applyStatBonuses } from '../services/diceDamageService';
import { getWeapon, calculateSpeed, getGaugeFillRate } from '../data/weapons';
import { getRandomEnemy } from '../data/enemies';
import { useGameStore } from './useGameStore';

// Tick interval in ms
const TICK_MS = 100;

interface CombatState {
  // ATB units (player + enemies)
  units: ATBUnit[];
  playerUnit: ATBUnit | null;
  // Actions available to player
  actions: CombatAction[];
  selectedAction: CombatAction | null;
  // Combat log
  combatLog: string[];
  // State
  combatEnded: boolean;
  victory: boolean;
  paused: boolean;
  lastDamageResult: DamageResult | null;
  // Current equipped weapon
  currentWeapon: Weapon | null;
  // Equipment modal open
  equipModalOpen: boolean;

  // Actions
  startCombat: (floor: number) => void;
  tick: () => void;
  selectAction: (action: CombatAction | null) => void;
  executeAction: (action: CombatAction, targetIndex?: number) => void;
  enemyAutoAct: (unitId: string) => void;
  switchWeapon: (weapon: Weapon) => void;
  openEquipModal: () => void;
  closeEquipModal: () => void;
  addCombatLog: (msg: string) => void;
  resetCombat: () => void;
}

function createPlayerUnit(agi: number, weapon: Weapon): ATBUnit {
  const speed = calculateSpeed(weapon.baseSpeed, agi);
  return {
    id: 'player',
    name: '信仰者',
    gauge: 0,
    speed: getGaugeFillRate(speed),
    isPlayer: true,
    isActing: false,
    extraCooldown: 0,
  };
}

function createEnemyUnit(enemy: Enemy, index: number): ATBUnit {
  return {
    id: `enemy-${index}`,
    name: enemy.name,
    gauge: 0,
    speed: getGaugeFillRate(enemy.speed),
    isPlayer: false,
    isActing: false,
    extraCooldown: 0,
    enemyRef: enemy,
  };
}

function getAvailableActions(weapon: Weapon | null): CombatAction[] {
  if (!weapon) return [];

  const actions: CombatAction[] = [
    // Normal attack with current weapon
    {
      id: 'act_normal_attack',
      name: `${weapon.name}攻击`,
      type: 'attack',
      cardType: 'attack',
      description: '使用当前武器进行普通攻击',
      formula: weapon.formula,
      color: '#c82014',
    },
    // Skills
    {
      id: 'act_skill_judgment',
      name: '神判之刃',
      type: 'skill',
      cardType: 'attack',
      description: '借用棋盘骰子之力的一击',
      formula: { diceCount: 2, diceFaces: 6, flatBonus: 0, critChance: 5, variance: 2 },
      color: '#cba258',
      usesBoardDice: true,
      extraCooldown: 0.5,
    },
    {
      id: 'act_skill_heretic_flame',
      name: '异端火焰',
      type: 'skill',
      cardType: 'heretic',
      description: '禁忌的火焰，高波动',
      formula: { diceCount: 3, diceFaces: 13, flatBonus: 5, critChance: 8, variance: 4 },
      faithCost: 2,
      color: '#7c3aed',
      extraCooldown: 1.0,
    },
    {
      id: 'act_skill_priest_bless',
      name: '修士祝祷',
      type: 'skill',
      cardType: 'faith',
      description: '稳定低波动的神圣打击',
      formula: { diceCount: 1, diceFaces: 6, flatBonus: 8, critChance: 3, variance: 1 },
      faithCost: 1,
      color: '#cba258',
      extraCooldown: 0.3,
    },
    {
      id: 'act_skill_lucky_pray',
      name: '幸运祈祷',
      type: 'skill',
      cardType: 'faith',
      description: '若本层骰子点数和>15，回复5HP',
      heal: 5,
      color: '#cba258',
      extraCooldown: 0.2,
    },
    {
      id: 'act_skill_fortune_flip',
      name: '命运翻转',
      type: 'defend',
      cardType: 'defense',
      description: '将本层已用骰子点数总和转化为护甲',
      color: '#2b7de9',
      extraCooldown: 0.2,
    },
    // Defend
    {
      id: 'act_defend_block',
      name: '格挡',
      type: 'defend',
      cardType: 'defense',
      description: '获得 5 点护甲',
      block: 5,
      color: '#2b7de9',
      extraCooldown: 0.1,
    },
    // Item
    {
      id: 'act_item_heal',
      name: '使用圣水',
      type: 'item',
      cardType: 'miracle',
      description: '回复 15 HP',
      heal: 15,
      color: '#ffffff',
      consumable: true,
    },
    // Flee
    {
      id: 'act_flee',
      name: '逃跑',
      type: 'flee',
      cardType: 'curse',
      description: '离开战斗，失去 5 HP',
      color: '#666666',
    },
  ];

  return actions;
}

export const useCombatStore = create<CombatState>((set, get) => ({
  units: [],
  playerUnit: null,
  actions: [],
  selectedAction: null,
  combatLog: [],
  combatEnded: false,
  victory: false,
  paused: false,
  lastDamageResult: null,
  currentWeapon: null,
  equipModalOpen: false,

  startCombat: (floor) => {
    const game = useGameStore.getState();
    // Default weapon: shortsword
    const weapon = getWeapon('wpn_shortsword') || null;
    const player = createPlayerUnit(game.player.stats.agi, weapon!);

    const enemyCount = floor >= 6 ? 2 : 1;
    const enemies: Enemy[] = [];
    for (let i = 0; i < enemyCount; i++) {
      enemies.push(getRandomEnemy(floor));
    }

    const enemyUnits = enemies.map((e, i) => createEnemyUnit(e, i));

    set({
      units: [player, ...enemyUnits],
      playerUnit: player,
      actions: getAvailableActions(weapon),
      selectedAction: null,
      combatLog: [`战斗开始！遭遇 ${enemies.map(e => e.name).join('、')}！`, '所有单位开始读条...'],
      combatEnded: false,
      victory: false,
      paused: false,
      lastDamageResult: null,
      currentWeapon: weapon,
      equipModalOpen: false,
    });
  },

  tick: () => {
    const state = get();
    if (state.combatEnded || state.paused) return;

    set((s) => {
      const newUnits = s.units.map(u => {
        if (u.isActing || u.gauge >= 100) return u;
        const newGauge = Math.min(100, u.gauge + u.speed);
        const isNowFull = newGauge >= 100 && u.gauge < 100;
        return {
          ...u,
          gauge: newGauge,
          isActing: isNowFull || u.isActing,
        };
      });

      const playerUnit = newUnits.find(u => u.isPlayer) || null;
      return {
        units: newUnits,
        playerUnit,
        paused: newUnits.some(u => u.isActing && u.isPlayer),
      };
    });

    // Auto-act for enemies that filled their gauge
    const afterTick = get();
    afterTick.units.forEach(u => {
      if (!u.isPlayer && u.gauge >= 100 && !u.isActing) {
        // Small delay for enemy auto-act
        setTimeout(() => get().enemyAutoAct(u.id), 400);
      }
    });
  },

  selectAction: (action) => set({ selectedAction: action }),

  executeAction: (action, targetIndex = 0) => {
    const state = get();
    const game = useGameStore.getState();
    const playerUnit = state.units.find(u => u.isPlayer);
    if (!playerUnit || !playerUnit.isActing || state.combatEnded) return;

    if (action.faithCost && action.faithCost > game.player.faith) {
      set({ combatLog: [...state.combatLog, '信仰不足！'] });
      return;
    }

    const logs: string[] = [];
    let lastResult: DamageResult | null = null;
    let playerArmor = game.player.armor; // we track armor locally in combat
    let newEnemies = state.units
      .filter(u => !u.isPlayer && u.enemyRef)
      .map(u => ({ ...u.enemyRef! }));

    // Consume faith
    if (action.faithCost) {
      useGameStore.getState().addFaith(-action.faithCost);
    }

    switch (action.type) {
      case 'attack':
      case 'skill': {
        if (!action.formula) break;
        const target = newEnemies[targetIndex];
        if (!target) break;

        let formula = applyStatBonuses(action.formula, game.player.stats);
        const boardDice = action.usesBoardDice
          ? (game.run.diceHistory[game.run.diceHistory.length - 1] ?? 0)
          : null;

        const result = calculateDamage(formula, target.armor, {
          piercing: action.id === 'act_attack_pierce',
          boardDiceRoll: boardDice ?? null,
        });
        lastResult = result;

        target.hp -= result.damageDealt;
        target.armor = Math.max(0, target.armor - result.armorBlocked);

        const critMsg = result.isCrit ? ' 💥暴击！' : '';
        logs.push(`${action.name}${critMsg} → ${target.name} 受到 ${result.damageDealt} 点伤害！`);
        if (target.hp <= 0) {
          logs.push(`${target.name} 被击败了！`);
        }
        break;
      }

      case 'defend': {
        if (action.block) {
          playerArmor += action.block;
          logs.push(`${action.name} → 获得 ${action.block} 点护甲。`);
        }
        if (action.id === 'act_skill_fortune_flip') {
          const diceSum = game.run.diceHistory.reduce((a, b) => a + b, 0);
          playerArmor += diceSum;
          logs.push(`命运翻转！骰子和 ${diceSum} → ${diceSum} 点护甲。`);
        }
        break;
      }

      case 'item': {
        if (action.heal) {
          useGameStore.getState().heal(action.heal);
          logs.push(`${action.name} → 回复 ${action.heal} HP。`);
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
        });
        return;
      }
    }

    // Lucky Pray
    if (action.id === 'act_skill_lucky_pray') {
      const diceSum = game.run.diceHistory.reduce((a, b) => a + b, 0);
      if (diceSum > 15) {
        useGameStore.getState().heal(5);
        logs.push(`幸运祈祷生效！骰子和 ${diceSum} > 15，回复 5 HP。`);
      } else {
        logs.push(`幸运祈祷未生效。骰子和 ${diceSum}。`);
      }
    }

    const aliveEnemies = newEnemies.filter(e => e.hp > 0);
    const victory = aliveEnemies.length === 0;

    // Update units with new enemy refs and reset player gauge
    const updatedUnits = state.units.map(u => {
      if (u.isPlayer) {
        return {
          ...u,
          gauge: 0,
          isActing: false,
        };
      }
      const matchingEnemy = aliveEnemies.find(e => e.name === u.name);
      if (matchingEnemy) {
        return { ...u, enemyRef: matchingEnemy, gauge: u.isActing ? 0 : u.gauge, isActing: false };
      }
      return { ...u, gauge: u.isActing ? 0 : u.gauge, isActing: false };
    }).filter(u => u.isPlayer || (u.enemyRef && u.enemyRef.hp > 0));

    // Update player armor in game store
    useGameStore.setState(s => ({
      player: { ...s.player, armor: playerArmor },
    }));

    set({
      units: updatedUnits,
      playerUnit: updatedUnits.find(u => u.isPlayer) || null,
      selectedAction: null,
      lastDamageResult: lastResult,
      combatLog: [...state.combatLog, ...logs],
      combatEnded: victory,
      victory,
      paused: false,
    });

    if (victory) {
      const goldReward = 10 + game.run.floor * 2;
      useGameStore.getState().addGold(goldReward);
      set(s => ({
        combatLog: [...s.combatLog, `战斗胜利！获得 ${goldReward} 金币！`],
      }));
    }
  },

  enemyAutoAct: (unitId) => {
    const state = get();
    const game = useGameStore.getState();
    const unit = state.units.find(u => u.id === unitId);
    if (!unit || unit.isPlayer || !unit.enemyRef || unit.enemyRef.hp <= 0) return;

    const enemy = unit.enemyRef;
    const logs: string[] = [];
    let playerHp = game.player.hp;
    let playerArmor = game.player.armor;

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

    // Apply damage
    if (playerHp !== game.player.hp) {
      const totalDmg = game.player.hp - playerHp;
      useGameStore.getState().takeDamage(totalDmg);
    }

    // Randomize next intent
    const intents = ['attack', 'attack', 'block', 'curse'] as const;
    enemy.intent = intents[Math.floor(Math.random() * intents.length)];

    // Check defeat
    const defeated = useGameStore.getState().player.hp <= 0;

    // Reset enemy gauge
    const updatedUnits = state.units.map(u => {
      if (u.id === unitId) {
        return { ...u, gauge: 0, isActing: false };
      }
      return u;
    });

    set({
      units: updatedUnits,
      combatLog: [...state.combatLog, ...logs],
      combatEnded: defeated,
      victory: false,
      paused: false,
    });
  },

  switchWeapon: (weapon) => {
    const state = get();
    const game = useGameStore.getState();
    const playerUnit = state.units.find(u => u.isPlayer);
    if (!playerUnit) return;

    // Reduce gauge by 50%
    const newGauge = Math.floor(playerUnit.gauge * 0.5);

    const newSpeed = getGaugeFillRate(calculateSpeed(weapon.baseSpeed, game.player.stats.agi));

    const updatedUnits = state.units.map(u => {
      if (u.isPlayer) {
        return { ...u, gauge: newGauge, speed: newSpeed };
      }
      return u;
    });

    set({
      units: updatedUnits,
      currentWeapon: weapon,
      actions: getAvailableActions(weapon),
      combatLog: [...state.combatLog, `切换武器为 ${weapon.name}，读条回退 50%。`],
      equipModalOpen: false,
    });
  },

  openEquipModal: () => set({ equipModalOpen: true, paused: true }),
  closeEquipModal: () => set({ equipModalOpen: false, paused: false }),

  addCombatLog: (msg) =>
    set((state) => ({
      combatLog: [...state.combatLog, msg],
    })),

  resetCombat: () =>
    set({
      units: [],
      playerUnit: null,
      actions: [],
      selectedAction: null,
      combatLog: [],
      combatEnded: false,
      victory: false,
      paused: false,
      lastDamageResult: null,
      currentWeapon: null,
      equipModalOpen: false,
    }),
}));
