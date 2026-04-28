import type { RewardOption } from '../types/game';
import { useGameStore } from '../stores/useGameStore';
import { getRandomItem } from '../data/items';
import { getRandomRelic } from '../data/relics';
import { EQUIPMENT_ITEMS } from '../data/equipmentSets';
import { generateRandomDice } from '../data/dice';

export function generateRewards(floor: number, isElite: boolean): RewardOption[] {
  const options: RewardOption[] = [];
  const game = useGameStore.getState();

  const types: string[] = isElite
    ? ['equipment', 'equipment', 'relic', 'dice', 'dice', 'item', 'gold', 'restore']
    : ['item', 'item', 'item', 'equipment', 'equipment', 'gold', 'gold', 'dice', 'restore', 'restore'];

  function pickType(): string {
    return types[Math.floor(Math.random() * types.length)];
  }

  while (options.length < 3) {
    const type = pickType();
    if (options.find(o => o.type === type) && type !== 'item') continue;

    switch (type) {
      case 'item': {
        const item = getRandomItem(floor);
        options.push({
          id: `item-${item.id}-${options.length}`,
          type: 'item',
          label: `${item.name} (+${item.amount})`,
          icon: '🧪',
          item,
        });
        break;
      }
      case 'equipment': {
        const equip = EQUIPMENT_ITEMS[Math.floor(Math.random() * EQUIPMENT_ITEMS.length)];
        options.push({
          id: `equip-${equip.id}`,
          type: 'equipment',
          label: equip.name,
          icon: '🗡️',
          equipment: equip,
        });
        break;
      }
      case 'gold': {
        const amount = 10 + Math.floor(Math.random() * floor * 5);
        options.push({
          id: 'gold-' + options.length,
          type: 'gold',
          label: `${amount} 金币`,
          icon: '💰',
          gold: amount,
        });
        break;
      }
      case 'dice': {
        const dice = generateRandomDice(floor);
        options.push({
          id: `dice-${dice.id}`,
          type: 'dice',
          label: `${dice.name} (D${dice.faces})`,
          icon: '🎲',
          dice,
        });
        break;
      }
      case 'restore': {
        const currentHp = game.player.hp;
        const maxHp = game.player.maxHp;
        if (currentHp < maxHp * 0.8 && Math.random() > 0.3) {
          const healAmt = Math.floor(maxHp * (0.2 + Math.random() * 0.2));
          options.push({
            id: 'restore-hp',
            type: 'restore',
            label: `恢复 ${healAmt} HP`,
            icon: '💚',
            restore: { hp: healAmt },
          });
        } else if (game.player.curseLevel >= 3 && Math.random() > 0.4) {
          options.push({
            id: 'restore-curse',
            type: 'restore',
            label: '清除 2~4 层诅咒',
            icon: '✨',
            restore: { curse: 2 + Math.floor(Math.random() * 3) },
          });
        } else if (game.player.faith < game.player.maxFaith * 0.5 && Math.random() > 0.4) {
          options.push({
            id: 'restore-faith',
            type: 'restore',
            label: '恢复 3~5 点信仰',
            icon: '✝️',
            restore: { faith: 3 + Math.floor(Math.random() * 3) },
          });
        } else {
          const healAmt = Math.floor(maxHp * 0.1);
          options.push({
            id: 'restore-full',
            type: 'restore',
            label: `全面休整（+${healAmt}HP+2信仰+1诅咒清除）`,
            icon: '💚',
            restore: { hp: healAmt, faith: 2, curse: 1 },
          });
        }
        break;
      }
      case 'relic': {
        if (!isElite) break;
        const relic = getRandomRelic();
        options.push({
          id: `relic-${relic.id}`,
          type: 'relic',
          label: relic.name,
          icon: '📿',
          relic,
        });
        break;
      }
    }
  }
  return options.slice(0, 3);
}
