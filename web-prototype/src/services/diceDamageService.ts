/** Elona-style dice damage calculation service */

import type { DamageFormula, DamageResult, Stats } from '../types/game';

/**
 * Roll a single die with `faces` sides.
 */
function rollDie(faces: number): number {
  return Math.floor(Math.random() * faces) + 1;
}

/**
 * Apply stat bonuses to a base formula.
 *
 * | Stat | Effect |
 * |------|--------|
 * | STR (每5点) | flatBonus Z +1 |
 * | INT (每5点) | diceFaces Y +1 |
 * | AGI (每10点) | critChance C +1% |
 * | FAI (每3点) | diceCount X +1 (max +3) |
 */
export function applyStatBonuses(formula: DamageFormula, stats: Stats): DamageFormula {
  return {
    diceCount: formula.diceCount + Math.min(3, Math.floor(stats.fai / 3)),
    diceFaces: formula.diceFaces + Math.floor(stats.int / 5),
    flatBonus: formula.flatBonus + Math.floor(stats.str / 5),
    critChance: formula.critChance + Math.floor(stats.agi / 10),
    variance: formula.variance,
  };
}

/**
 * Calculate damage using the Elona formula: XdY+Z(C)[+-R]
 *
 * Steps:
 * 1. Roll X dice of Y faces, sum them
 * 2. Add flat bonus Z
 * 3. Crit check: roll 1-100, if <= C then damage * 2
 * 4. Apply variance [-R, +R]
 * 5. Subtract target armor
 * 6. Clamp to minimum 0 (or 1 if piercing)
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

  // Step 2: Add flat bonus (including board dice if linked)
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
  const critStr = isCrit ? ` (暴击! ×2)` : '';
  const varStr = varianceRoll !== 0 ? `${varianceRoll > 0 ? '+' : ''}${varianceRoll}` : '';
  const armorStr = armorBlocked > 0 ? ` - 护甲${armorBlocked}` : '';
  const boardStr = boardDiceRoll !== null ? `(+棋盘骰子${boardDiceRoll})` : '';

  const breakdown = `${formula.diceCount}d${formula.diceFaces}=(${rollStr})=${diceSum}${flat > 0 ? `+${flat}${boardStr}` : ''}${critStr}${varStr}${armorStr} = ${damageDealt}点伤害`;

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

/**
 * Format a DamageFormula into human-readable string.
 */
export function formatFormula(f: DamageFormula): string {
  return `${f.diceCount}d${f.diceFaces}+${f.flatBonus}(${f.critChance}%)[±${f.variance}]`;
}

/**
 * Create a formula from a shorthand string like "2d6+3(5)[-2,2]"
 * (Optional utility for future data-driven loading)
 */
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
