import { create } from 'zustand';
import type { Enemy, DiceEntity, EquipmentItem, DamageResult, EmbeddedSlot } from '../types/game';
import { buildEmbeddedFormula, calculateDamage, formatFormula } from '../services/diceDamageService';
import { getWeapon } from '../data/weapons';
import { getRandomEnemy } from '../data/enemies';
import { useGameStore } from './useGameStore';

interface CombatState {
  phase: 'embedding' | 'combat' | 'ended';
  // Embedding
  availableDice: DiceEntity[];
  embeddedSlots: EmbeddedSlot[];
  equippedItems: EquipmentItem[];
  // Combat
  enemies: Enemy[];
  combatLog: string[];
  victory: boolean;
  lastDamageResult: DamageResult | null;
  // Actions
  startCombat: (floor: number) => void;
  embedDie: (dieId: string, slotId: string) => void;
  unembedDie: (slotId: string) => void;
  confirmEmbedding: () => void;
  playerAttack: (enemyIndex: number) => void;
  playerDefend: () => void;
  playerSkill: () => void;
  playerUseItem: (itemId: string) => void;
  enemyAct: () => void;
  addCombatLog: (msg: string) => void;
  resetCombat: () => void;
}

/** Build embedded slots from equipped items */
function buildSlots(equipped: EquipmentItem[]): EmbeddedSlot[] {
  return equipped
    .filter(e => e.socketType)
    .map(e => ({
      equipmentSlotId: e.slot,
      socketType: e.socketType!,
      embeddedDie: null,
    }));
}

export const useCombatStore = create<CombatState>((set, get) => ({
  phase: 'embedding',
  availableDice: [],
  embeddedSlots: [],
  equippedItems: [],
  enemies: [],
  combatLog: [],
  victory: false,
  lastDamageResult: null,

  startCombat: (floor) => {
    const game = useGameStore.getState();
    const equipped = game.equipped;
    const diceBox = [...game.diceBox];

    const enemyCount = floor >= 6 ? 2 : 1;
    const enemies: Enemy[] = [];
    for (let i = 0; i < enemyCount; i++) {
      enemies.push(getRandomEnemy(floor));
    }

    const slots = buildSlots(equipped);

    set({
      phase: 'embedding',
      availableDice: diceBox,
      embeddedSlots: slots,
      equippedItems: equipped,
      enemies,
      combatLog: [
        `⚔️ 战斗开始！遭遇 ${enemies.map(e => e.name).join('、')}！`,
        `🎲 战前嵌入阶段：将骰子嵌入装备骰槽`,
      ],
      victory: false,
      lastDamageResult: null,
    });
  },

  embedDie: (dieId, slotId) => {
    const state = get();
    if (state.phase !== 'embedding') return;

    const die = state.availableDice.find(d => d.id === dieId);
    if (!die) return;

    const slot = state.embeddedSlots.find(s => s.equipmentSlotId === slotId);
    if (!slot) return;
    if (slot.embeddedDie) {
      get().addCombatLog(`⚠️ ${slotId} 已有骰子嵌入，请先取下`);
      return;
    }

    // Faith cost = floor(faces / 2)
    const faithCost = Math.floor(die.faces / 2);
    const game = useGameStore.getState();
    if (faithCost > 0 && !game.consumeFaith(faithCost)) {
      get().addCombatLog(`❌ 信仰不足！需要 ${faithCost} 点信仰`);
      return;
    }

    const newSlots = state.embeddedSlots.map(s =>
      s.equipmentSlotId === slotId ? { ...s, embeddedDie: die } : s
    );
    const newDice = state.availableDice.filter(d => d.id !== dieId);

    // Check for duplicate embed (half cost)
    const halfCostMsg = faithCost > 0
      ? `消耗 ${faithCost} 信仰` + (state.embeddedSlots.find(s => s.equipmentSlotId === slotId)?.embeddedDie ? '（半价）' : '')
      : '';

    set({
      availableDice: newDice,
      embeddedSlots: newSlots,
    });

    get().addCombatLog(
      `🔮 ${die.name}(D${die.faces}) → 嵌入 ${slotId} ${faithCost > 0 ? halfCostMsg : ''}`
    );
  },

  unembedDie: (slotId) => {
    const state = get();
    if (state.phase !== 'embedding') return;

    const slot = state.embeddedSlots.find(s => s.equipmentSlotId === slotId);
    if (!slot || !slot.embeddedDie) return;

    const newSlots = state.embeddedSlots.map(s =>
      s.equipmentSlotId === slotId ? { ...s, embeddedDie: null } : s
    );
    const newDice = [...state.availableDice, slot.embeddedDie];

    set({
      availableDice: newDice,
      embeddedSlots: newSlots,
    });

    get().addCombatLog(`↩️ 从 ${slotId} 取回 ${slot.embeddedDie.name}`);
  },

  confirmEmbedding: () => {
    const state = get();
    if (state.phase !== 'embedding') return;

    // Check at least weapon has a die embedded
    const weaponSlot = state.embeddedSlots.find(s => s.socketType === 'weapon' && s.embeddedDie);
    const hasEmbedded = state.embeddedSlots.some(s => s.embeddedDie);

    set({ phase: 'combat' });

    if (hasEmbedded) {
      if (weaponSlot) {
        const die = weaponSlot.embeddedDie!;
        const weaponName = state.equippedItems.find(e => e.slot === weaponSlot.equipmentSlotId)?.name || '武器';
        const formulaStr = `1d${die.faces}+${weaponSlot.socketType === 'weapon' ? '武器加值' : ''}`;
        get().addCombatLog(`⚡ 确认嵌入！${weaponName} 激活公式 ${formulaStr}`);
      } else {
        get().addCombatLog('⚡ 确认嵌入！进入战斗阶段');
      }
    } else {
      get().addCombatLog('⚡ 跳过嵌入，进入战斗阶段（仅基础属性）');
    }
  },

  playerAttack: (enemyIndex) => {
    const state = get();
    if (state.phase !== 'combat') return;

    const enemy = state.enemies[enemyIndex];
    if (!enemy || enemy.hp <= 0) {
      get().addCombatLog('目标已死亡');
      return;
    }

    const game = useGameStore.getState();

    // Find weapon slot with embedded die
    const weaponSlot = state.embeddedSlots.find(s => s.socketType === 'weapon' && s.embeddedDie);

    if (!weaponSlot) {
      // Bare hands: 1d4 + STR bonus
      const baseFormula = { diceCount: 1, diceFaces: 4, flatBonus: Math.floor(game.player.stats.str / 5), critChance: 0, variance: 0 };
      const result = calculateDamage(baseFormula, enemy.armor);
      enemy.hp -= result.damageDealt;
      enemy.armor = Math.max(0, enemy.armor - result.armorBlocked);

      set({ lastDamageResult: result });
      get().addCombatLog(`👊 徒手攻击 → ${enemy.name} 受到 ${result.damageDealt} 点伤害！${result.isCrit ? '💥暴击！' : ''}`);
    } else {
      const die = weaponSlot.embeddedDie!;
      const weaponItem = state.equippedItems.find(e => e.slot === weaponSlot.equipmentSlotId);
      const weapon = weaponItem?.baseFormula && weaponItem?.diceSocket
        ? { id: weaponItem.id, name: weaponItem.name, baseFormula: weaponItem.baseFormula, diceSocket: weaponItem.diceSocket, weight: weaponItem.weight, description: weaponItem.description, set: weaponItem.set }
        : getWeapon('wpn_shortsword')!;

      const formula = buildEmbeddedFormula(weapon, die, game.player.stats);

      // Apply embed affix bonuses
      for (const affix of die.affixes) {
        if (affix.type === 'embed') {
          if (affix.id === 'sharp') formula.critChance += 5;
          if (affix.id === 'burning') formula.flatBonus += Math.floor(die.faces * 0.5);
        }
      }

      const result = calculateDamage(formula, enemy.armor);
      enemy.hp -= result.damageDealt;
      enemy.armor = Math.max(0, enemy.armor - result.armorBlocked);

      // Lifesteal
      for (const affix of die.affixes) {
        if (affix.id === 'lifesteal') {
          const healAmt = Math.floor(result.damageDealt * 0.1);
          if (healAmt > 0) {
            useGameStore.getState().heal(healAmt);
            get().addCombatLog(`🩸 吸血恢复 ${healAmt} HP`);
          }
        }
      }

      set({ lastDamageResult: result });
      get().addCombatLog(
        `⚔️ ${weapon.name}(${formatFormula(formula)}) → ${enemy.name} 受到 ${result.damageDealt} 点伤害！${result.isCrit ? '💥暴击！' : ''}`
      );

      if (enemy.hp <= 0) {
        get().addCombatLog(`${enemy.name} 被击败了！`);
      }
    }

    // Check victory
    const aliveEnemies = state.enemies.filter(e => e.hp > 0);
    if (aliveEnemies.length === 0) {
      const goldReward = 10 + game.run.floor * 2;
      useGameStore.getState().addGold(goldReward);
      get().addCombatLog(`🏆 战斗胜利！获得 ${goldReward} 金币！`);
      set({ phase: 'ended', victory: true });
    } else {
      set({ enemies: state.enemies.map(e => ({ ...e })) });
      // Enemy turn
      setTimeout(() => get().enemyAct(), 600);
    }
  },

  playerDefend: () => {
    const state = get();
    if (state.phase !== 'combat') return;

    let shield = 3; // base shield

    // Add shield from armor embedded dice
    for (const slot of state.embeddedSlots) {
      if ((slot.socketType === 'armor' || slot.socketType === 'shield') && slot.embeddedDie) {
        const die = slot.embeddedDie;
        const multiplier = slot.socketType === 'shield' ? 2 : 1;
        shield += die.faces * multiplier;

        // Tough affix
        for (const affix of die.affixes) {
          if (affix.id === 'tough') shield += 2;
        }
      }
    }

    useGameStore.setState(s => ({
      player: { ...s.player, armor: s.player.armor + shield },
    }));

    get().addCombatLog(`🛡️ 防御！获得 ${shield} 点护甲`);
  },

  playerSkill: () => {
    const state = get();
    if (state.phase !== 'combat') return;

    const game = useGameStore.getState();
    const weaponSlot = state.embeddedSlots.find(s => s.socketType === 'weapon' && s.embeddedDie);
    const dieFaces = weaponSlot?.embeddedDie?.faces || 6;

    // Generic skill: 神判之刃 — uses board dice history
    const lastBoardDice = game.run.diceHistory[game.run.diceHistory.length - 1] || 0;
    const formula = {
      diceCount: 2,
      diceFaces: dieFaces,
      flatBonus: lastBoardDice + Math.floor(game.player.stats.fai / 3),
      critChance: 10,
      variance: 2,
    };

    const target = state.enemies.find(e => e.hp > 0);
    if (!target) return;

    const result = calculateDamage(formula, target.armor, { boardDiceRoll: lastBoardDice });
    target.hp -= result.damageDealt;
    target.armor = Math.max(0, target.armor - result.armorBlocked);

    set({ lastDamageResult: result });
    get().addCombatLog(
      `✨ 神判之刃(${formatFormula(formula)}) → ${target.name} 受到 ${result.damageDealt} 点伤害！${result.isCrit ? '💥暴击！' : ''}`
    );
  },

  playerUseItem: (itemId) => {
    const state = get();
    if (state.phase !== 'combat') return;

    const game = useGameStore.getState();
    const item = game.items.find(i => i.id === itemId);
    if (!item) {
      get().addCombatLog('❌ 道具不存在');
      return;
    }

    useGameStore.getState().useItem(itemId);

    if (item.type === 'heal') {
      useGameStore.getState().heal(item.amount);
      get().addCombatLog(`🧪 使用 ${item.name} → 回复 ${item.amount} HP`);
    } else if (item.type === 'attack') {
      const target = state.enemies.find(e => e.hp > 0);
      if (target) {
        target.hp -= item.amount;
        get().addCombatLog(`💣 使用 ${item.name} → ${target.name} 受到 ${item.amount} 点伤害`);
      }
    } else if (item.type === 'buff') {
      get().addCombatLog(`✨ 使用 ${item.name} → ${item.effect}`);
    } else {
      get().addCombatLog(`📜 使用 ${item.name}`);
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

      // Random next intent
      const intents = ['attack', 'attack', 'block', 'curse'] as const;
      enemy.intent = intents[Math.floor(Math.random() * intents.length)];
    }

    if (playerHp !== game.player.hp) {
      const dmgTaken = game.player.hp - playerHp;
      useGameStore.getState().takeDamage(dmgTaken);
    }

    useGameStore.setState(s => ({
      player: { ...s.player, armor: playerArmor },
    }));

    const defeated = useGameStore.getState().player.hp <= 0;
    if (defeated) {
      logs.push('💀 你被击败了...');
    }

    set(s => ({
      combatLog: [...s.combatLog, ...logs],
      phase: defeated ? 'ended' : 'combat',
      victory: false,
    }));
  },

  addCombatLog: (msg) =>
    set((state) => ({
      combatLog: [...state.combatLog, msg],
    })),

  resetCombat: () =>
    set({
      phase: 'embedding',
      availableDice: [],
      embeddedSlots: [],
      equippedItems: [],
      enemies: [],
      combatLog: [],
      victory: false,
      lastDamageResult: null,
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
