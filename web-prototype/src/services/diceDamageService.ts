/** Elona-style dice damage calculation — updated for embedding system (GDD v0.3) */

import type { DamageFormula, DamageResult, Stats, Weapon, DiceEntity } from '../types/game';

function rollDie(faces: number): number {
  return Math.floor(Math.random() * faces) + 1;
}

/**
 * Build the final damage formula from a weapon + embedded die + player stats.
 * GDD section 9.4: XdY+Z(C)[±R] where Y = embedded die faces.
 */
export function buildEmbeddedFormula(
  weapon: Weapon,
  embeddedDie: DiceEntity,
  stats: Stats
): DamageFormula {
  const socket = weapon.diceSocket;
  return {
    diceCount: weapon.baseFormula.diceCount + Math.min(2, Math.floor(stats.fai / 5)),
    diceFaces: embeddedDie.faces * socket.faceMultiplier,
    flatBonus: socket.flatBonus + Math.floor(stats.str / 5),
    critChance: weapon.baseFormula.critChance + socket.critBonus + Math.floor(stats.agi / 10),
    variance: weapon.baseFormula.variance + socket.varianceBonus,
  };
}

/**
 * Apply stat bonuses to a generic formula (kept for backwards compat and non-weapon skills).
 */
export function applyStatBonuses(formula: DamageFormula, stats: Stats): DamageFormula {
  return {
    diceCount: formula.diceCount + Math.min(2, Math.floor(stats.fai / 5)),
    diceFaces: formula.diceFaces + Math.floor(stats.int / 5),
    flatBonus: formula.flatBonus + Math.floor(stats.str / 5),
    critChance: formula.critChance + Math.floor(stats.agi / 10),
    variance: formula.variance,
  };
}

/**
 * Calculate damage using the Elona formula: XdY+Z(C)[+-R]
 */
export function calculateDamage(
  formula: DamageFormula,
  targetArmor: number,
  options: {
    piercing?: boolean;
    boardDiceRoll?: number | null;
  } = {}
): DamageResult {
  const { piercing = false, boardDiceRoll = null } = options;

  // Step 1: Roll dice
  let diceSum = 0;
  const rolls: number[] = [];
  for (let i = 0; i < formula.diceCount; i++) {
    const r = rollDie(formula.diceFaces);
    rolls.push(r);
    diceSum += r;
  }

  // Step 2: Add flat bonus
  let flat = formula.flatBonus;
  if (boardDiceRoll !== null) {
    flat += boardDiceRoll;
  }
  const rawDamage = diceSum + flat;

  // Step 3: Crit check
  const critRoll = Math.floor(Math.random() * 100) + 1;
  const isCrit = critRoll <= formula.critChance;
  const critMultiplier = isCrit ? 2 : 1;
  const afterCrit = rawDamage * critMultiplier;

  // Step 4: Variance
  const varianceRoll = Math.floor(Math.random() * (formula.variance * 2 + 1)) - formula.variance;
  const finalDamage = Math.max(0, afterCrit + varianceRoll);

  // Step 5: Armor
  const armorBlocked = piercing ? 0 : Math.min(targetArmor, finalDamage);
  const damageDealt = finalDamage - armorBlocked;

  // Build breakdown string
  const rollStr = rolls.join('+');
  const critStr = isCrit ? ' (暴击! ×2)' : '';
  const varStr = varianceRoll !== 0 ? `${varianceRoll > 0 ? '+' : ''}${varianceRoll}` : '';
  const armorStr = armorBlocked > 0 ? ` - 护甲${armorBlocked}` : '';
  const boardStr = boardDiceRoll !== null ? `(+棋盘骰子${boardDiceRoll})` : '';

  const breakdown = `${formula.diceCount}d${formula.diceFaces}=(${rollStr})=${diceSum}+${flat}${boardStr}${critStr}${varStr}${armorStr} = ${damageDealt}点伤害`;

  return {
    rawDamage,
    isCrit,
    critMultiplier,
    finalDamage,
    armorBlocked,
    damageDealt: Math.max(0, damageDealt),
    breakdown,
  };
}

export function formatFormula(f: DamageFormula): string {
  return `${f.diceCount}d${f.diceFaces}+${f.flatBonus}(${f.critChance}%)[±${f.variance}]`;
}

export function parseFormula(shorthand: string): DamageFormula | null {
  const match = shorthand.match(/(\d+)d(\d+)\+(-?\d+)\((\d+)\)\[(-?\d+),(-?\d+)\]/);
  if (!match) return null;
  return {
    diceCount: parseInt(match[1]),
    diceFaces: parseInt(match[2]),
    flatBonus: parseInt(match[3]),
    critChance: parseInt(match[4]),
    variance: Math.max(Math.abs(parseInt(match[5])), Math.abs(parseInt(match[6]))),
  };
}
