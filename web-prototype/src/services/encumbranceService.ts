import type { EquipmentItem } from '../types/game';

export function calculateMaxEncumbrance(str: number): number {
  return 10 + str * 2;
}

export function getEncumbranceState(
  current: number,
  max: number
): 'light' | 'normal' | 'heavy' | 'overburdened' {
  if (current <= max * 0.5) return 'light';
  if (current <= max * 0.8) return 'normal';
  if (current <= max) return 'heavy';
  return 'overburdened';
}

export function getEncumbranceEffects(state: ReturnType<typeof getEncumbranceState>) {
  switch (state) {
    case 'light':
      return { label: '轻装', color: '#22c55e', bonus: '闪避率+10%，骰子结果+1（每层1次）' };
    case 'normal':
      return { label: '正常', color: '#eab308', bonus: '无额外效果' };
    case 'heavy':
      return { label: '超重', color: '#f97316', bonus: '战斗先手概率-20%' };
    case 'overburdened':
      return { label: '严重超重', color: '#c82014', bonus: '每格-2HP，战斗AP-1' };
  }
}

export function calculateTotalWeight(
  equipped: EquipmentItem[],
  backpack: EquipmentItem[]
): number {
  return [
    ...equipped,
    ...backpack,
  ].reduce((sum, item) => sum + item.weight, 0);
}
