import React from 'react';
import type { DiceSlot, BattleDice } from '../../types/game';
import { formatFormula } from '../../services/diceDamageService';

interface DiceAllocationPanelProps {
  diceSlots: DiceSlot[];
  allocations: Record<string, number[]>;
  battleDice: BattleDice[];
  onAllocate: (slotId: string) => void;
  onUnallocate: (slotId: string) => void;
  playerFaith: number;
}

const SLOT_ICONS: Record<string, string> = {
  attack: '⚔️',
  skill: '✨',
  item: '🧪',
  defend: '🛡️',
  flee: '🏃',
};

const SLOT_LABELS: Record<string, string> = {
  attack: '普攻',
  skill: '技能',
  item: '道具',
  defend: '防御',
  flee: '逃跑',
};

export const DiceAllocationPanel: React.FC<DiceAllocationPanelProps> = ({
  diceSlots,
  allocations,
  battleDice,
  onAllocate,
  onUnallocate,
  playerFaith,
}) => {
  // Group slots by type
  const grouped = diceSlots.reduce((acc, slot) => {
    if (!acc[slot.type]) acc[slot.type] = [];
    acc[slot.type].push(slot);
    return acc;
  }, {} as Record<string, DiceSlot[]>);

  const typeOrder = ['attack', 'skill', 'defend', 'item', 'flee'];

  const getAllocatedDie = (slotId: string): BattleDice | null => {
    const indices = allocations[slotId];
    if (!indices || indices.length === 0) return null;
    return battleDice.find(d => d.index === indices[0]) || null;
  };

  const canAfford = (slot: DiceSlot): boolean => {
    if (slot.faithCost && slot.faithCost > playerFaith) return false;
    return true;
  };

  return (
    <div className="flex flex-col gap-3 bg-ceramic rounded-card p-4 border-2 border-gold/30">
      <div className="text-sm font-bold text-house-green">
        🎯 骰子分配槽
        <span className="text-xs text-text-soft ml-2">选中骰子后点击槽位分配</span>
      </div>

      <div className="flex flex-col gap-2">
        {typeOrder.map(type => {
          const group = grouped[type];
          if (!group || group.length === 0) return null;
          return (
            <div key={type}>
              <div className="text-xs font-semibold text-text-soft mb-1.5">
                {SLOT_ICONS[type]} {SLOT_LABELS[type]}
              </div>
              <div className="flex gap-2 flex-wrap">
                {group.map(slot => {
                  const allocatedDie = getAllocatedDie(slot.id);
                  const isAllocated = !!allocatedDie;
                  const isAffordable = canAfford(slot);

                  return (
                    <button
                      key={slot.id}
                      onClick={() => isAllocated ? onUnallocate(slot.id) : onAllocate(slot.id)}
                      disabled={!isAllocated && !isAffordable}
                      className={`
                        relative flex flex-col items-start p-3 rounded-card border-2 text-left
                        transition-all duration-150 min-w-[140px] max-w-[180px]
                        ${isAllocated
                          ? 'scale-105 border-gold shadow-lg bg-gold-lightest'
                          : 'border-black/15 bg-white hover:border-house-green/40 cursor-pointer'
                        }
                        ${!isAffordable ? 'opacity-40 cursor-not-allowed' : ''}
                      `}
                    >
                      {/* Slot type badge */}
                      <div className="text-[10px] font-semibold text-text-soft mb-1">
                        {SLOT_ICONS[slot.type]} {SLOT_LABELS[slot.type]}
                      </div>

                      {/* Name */}
                      <div className="text-sm font-bold text-house-green leading-tight">
                        {slot.name}
                      </div>

                      {/* Description */}
                      <div className="text-[10px] text-text-soft mt-0.5 leading-snug">
                        {slot.description}
                      </div>

                      {/* Dice requirement badge */}
                      <div className={`
                        mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full
                        ${isAllocated ? 'bg-gold text-white' : 'bg-house-green/10 text-house-green'}
                      `}>
                        🎲 {slot.diceRequirement.label}
                      </div>

                      {/* Allocated die value */}
                      {isAllocated && (
                        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gold text-white text-lg font-bold font-mono flex items-center justify-center shadow">
                          {allocatedDie!.value}
                        </div>
                      )}

                      {/* Formula display */}
                      {slot.formula && (
                        <div className="mt-1 text-[10px] font-mono bg-black/5 px-1.5 py-0.5 rounded w-full truncate">
                          {formatFormula(slot.formula)}
                        </div>
                      )}

                      {/* Badges */}
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {slot.block && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">🛡️+{slot.block}</span>
                        )}
                        {slot.heal && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">❤️+{slot.heal}</span>
                        )}
                        {slot.faithCost && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            playerFaith >= slot.faithCost
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            ✝️-{slot.faithCost}
                          </span>
                        )}
                        {slot.usesBoardDice && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">🎲棋盘联动</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
