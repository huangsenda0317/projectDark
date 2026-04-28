import React from 'react';
import type { DiceEntity, EmbeddedSlot, EquipmentItem } from '../../types/game';
import { PixelButton } from '../common/PixelButton';

interface DiceEmbeddingPanelProps {
  availableDice: DiceEntity[];
  embeddedSlots: EmbeddedSlot[];
  equippedItems: EquipmentItem[];
  onEmbed: (dieId: string, slotId: string) => void;
  onUnembed: (slotId: string) => void;
  playerFaith: number;
  onConfirm: () => void;
}

const QUALITY_COLORS: Record<string, string> = {
  common: 'border-gray-300 bg-white',
  fine: 'border-blue-400 bg-blue-50',
  rare: 'border-purple-400 bg-purple-50',
  legendary: 'border-yellow-400 bg-yellow-50',
};

const SOCKET_LABELS: Record<string, string> = {
  weapon: '⚔️ 武器槽',
  armor: '🛡️ 防具槽',
  shield: '🛡️ 盾牌槽',
  accessory: '💍 饰品槽',
};

export const DiceAllocationPanel: React.FC<DiceEmbeddingPanelProps> = ({
  availableDice,
  embeddedSlots,
  equippedItems,
  onEmbed,
  onUnembed,
  playerFaith,
  onConfirm,
}) => {
  const totalFaithCost = embeddedSlots
    .filter(s => s.embeddedDie)
    .reduce((sum, s) => sum + Math.floor(s.embeddedDie!.faces / 2), 0);

  const handleDieClick = (dieId: string) => {
    // Find first empty compatible slot
    const emptySlot = embeddedSlots.find(s => !s.embeddedDie);
    if (emptySlot) {
      onEmbed(dieId, emptySlot.equipmentSlotId);
    }
  };

  const handleSlotClick = (slot: EmbeddedSlot) => {
    if (slot.embeddedDie) {
      onUnembed(slot.equipmentSlotId);
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-ceramic rounded-card p-4 border-2 border-gold/30">
      <div className="text-sm font-bold text-house-green">
        🔮 骰子嵌入阶段
        <span className="text-xs text-text-soft ml-2">
          点击骰子嵌入装备槽 · 信仰消耗 = 面数÷2
        </span>
      </div>

      {/* Available dice */}
      <div>
        <div className="text-xs font-semibold text-text-soft mb-2">
          🎲 可用骰子 ({availableDice.length})
        </div>
        {availableDice.length === 0 ? (
          <div className="text-xs text-text-soft italic">无可用骰子</div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {availableDice.map(die => {
              const faithCost = Math.floor(die.faces / 2);
              const canAfford = playerFaith >= faithCost;
              return (
                <button
                  key={die.id}
                  onClick={() => handleDieClick(die.id)}
                  disabled={!canAfford}
                  className={`
                    relative p-2 rounded-xl border-2 transition-all duration-150
                    flex flex-col items-center min-w-[60px]
                    ${QUALITY_COLORS[die.quality]}
                    ${canAfford
                      ? 'hover:border-gold hover:scale-105 cursor-pointer'
                      : 'opacity-40 cursor-not-allowed'
                    }
                  `}
                >
                  <span className="text-lg font-bold font-mono text-house-green">
                    D{die.faces}
                  </span>
                  <span className="text-[9px] text-text-soft">{die.name}</span>
                  <span className={`text-[10px] mt-1 px-1.5 rounded-full ${
                    canAfford ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                    ✝️{faithCost}
                  </span>
                  {die.affixes.map((a, i) => (
                    <span key={i} className="text-[7px] text-text-soft" title={a.effect}>
                      {a.name}
                    </span>
                  ))}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Equipment slots */}
      <div>
        <div className="text-xs font-semibold text-text-soft mb-2">
          🗡️ 装备骰槽
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {embeddedSlots.map(slot => {
            const item = equippedItems.find(e => e.slot === slot.equipmentSlotId);
            const isOccupied = !!slot.embeddedDie;
            return (
              <button
                key={slot.equipmentSlotId}
                onClick={() => handleSlotClick(slot)}
                className={`
                  p-2 rounded-card border-2 text-left transition-all duration-150
                  ${isOccupied
                    ? 'border-gold bg-gold/10 scale-105'
                    : 'border-dashed border-gray-300 bg-white/50'
                  }
                  ${isOccupied ? 'cursor-pointer hover:bg-gold/20' : ''}
                `}
                title={isOccupied ? '点击取回骰子' : '点击可用骰子嵌入'}
              >
                <div className="text-[10px] text-text-soft">
                  {SOCKET_LABELS[slot.socketType]}
                </div>
                <div className="text-xs font-bold text-house-green">
                  {item?.name || slot.equipmentSlotId}
                </div>
                {isOccupied ? (
                  <div className="mt-1 text-xs font-mono text-gold">
                    🔮 D{slot.embeddedDie!.faces} {slot.embeddedDie!.name}
                  </div>
                ) : (
                  <div className="mt-1 text-[10px] text-text-soft italic">空槽</div>
                )}
              </button>
            );
          })}
          {embeddedSlots.length === 0 && (
            <div className="col-span-3 text-xs text-text-soft italic py-2 text-center">
              未装备任何物品
            </div>
          )}
        </div>
      </div>

      {/* Faith & Confirm */}
      <div className="flex items-center justify-between bg-house-green/5 rounded-card p-3">
        <div className="text-sm">
          <span className="text-text-soft">信仰消耗: </span>
          <span className={`font-bold ${totalFaithCost > playerFaith ? 'text-danger' : 'text-house-green'}`}>
            ✝️{totalFaithCost}
          </span>
          <span className="text-text-soft ml-2">| 持有: ✝️{playerFaith}</span>
        </div>
        <PixelButton
          variant="gold"
          onClick={onConfirm}
          disabled={totalFaithCost > playerFaith}
        >
          ⚡ 确认嵌入 · 进入战斗
        </PixelButton>
      </div>
    </div>
  );
};
