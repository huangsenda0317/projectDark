import React from 'react';
import type { RewardOption } from '../../types/game';
import { useGameStore } from '../../stores/useGameStore';

interface RewardModalProps {
  rewards: RewardOption[];
  onClose: (reward: RewardOption) => void;
}

const QUALITY_COLORS: Record<string, string> = {
  common: 'border-gray-300',
  fine: 'border-blue-400',
  rare: 'border-purple-400',
  legendary: 'border-yellow-400',
};

export const RewardModal: React.FC<RewardModalProps> = ({ rewards, onClose }) => {
  const game = useGameStore();

  const handlePick = (reward: RewardOption) => {
    switch (reward.type) {
      case 'item':
        if (reward.item) game.addItem(reward.item);
        break;
      case 'equipment':
        if (reward.equipment) game.addToBackpack(reward.equipment);
        break;
      case 'gold':
        if (reward.gold) game.addGold(reward.gold);
        break;
      case 'dice':
        if (reward.dice) game.addDice(reward.dice);
        break;
      case 'restore':
        if (reward.restore) {
          if (reward.restore.hp) game.heal(reward.restore.hp);
          if (reward.restore.faith) game.addFaith(reward.restore.faith);
          if (reward.restore.curse) game.addCurse(-reward.restore.curse);
        }
        break;
      case 'relic':
        if (reward.relic) game.addRelic(reward.relic);
        break;
    }
    onClose(reward);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-parchment scroll-paper p-6 rounded-card max-w-lg w-full">
        <h2 className="text-xl font-bold text-house-green font-gothic text-center mb-2">战斗奖励</h2>
        <p className="text-sm text-text-soft text-center mb-4">从以下三选一</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {rewards.map((reward) => (
            <button
              key={reward.id}
              onClick={() => handlePick(reward)}
              className={`bg-white border-2 rounded-card p-4 text-center hover:border-gold hover:shadow-lg transition-all hover:-translate-y-1 ${
                reward.type === 'dice' && reward.dice
                  ? QUALITY_COLORS[reward.dice.quality]
                  : 'border-house-green/20'
              }`}
            >
              <div className="text-4xl mb-2">{reward.icon}</div>
              <div className="text-sm font-bold text-house-green leading-tight">{reward.label}</div>
              <div className="text-xs text-text-soft mt-1">
                {reward.type === 'item' && reward.item && reward.item.description}
                {reward.type === 'equipment' && reward.equipment && reward.equipment.description}
                {reward.type === 'gold' && '即时获得'}
                {reward.type === 'dice' && reward.dice && (
                  <>
                    <div>D{reward.dice.faces} · {reward.dice.affixes.length} 词条</div>
                    {reward.dice.affixes.map((a, i) => (
                      <div key={i} className="text-[9px]">{a.name}: {a.effect}</div>
                    ))}
                  </>
                )}
                {reward.type === 'restore' && '即时恢复'}
                {reward.type === 'relic' && reward.relic && reward.relic.description}
              </div>
              {reward.type === 'equipment' && reward.equipment && (
                <div className="text-xs text-text-soft mt-1">
                  重量: {reward.equipment.weight}kg
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
