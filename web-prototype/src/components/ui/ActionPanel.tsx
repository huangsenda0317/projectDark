import React from 'react';
import type { CombatAction } from '../../types/game';
import { formatFormula } from '../../services/diceDamageService';

interface ActionButtonProps {
  action: CombatAction;
  isSelected: boolean;
  canAfford: boolean;
  onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ action, isSelected, canAfford, onClick }) => {
  const typeLabels: Record<string, string> = {
    attack: '⚔️ 普攻',
    skill: '✨ 技能',
    item: '🧪 道具',
    defend: '🛡️ 防御',
    flee: '🏃 逃跑',
  };

  return (
    <button
      onClick={onClick}
      disabled={!canAfford}
      className={`
        relative flex flex-col items-start p-3 rounded-card border-2 text-left
        transition-all duration-150 min-w-[130px] max-w-[170px]
        ${isSelected ? 'scale-105 border-gold shadow-lg bg-gold-lightest' : 'border-black/15 bg-white hover:border-black/40'}
        ${!canAfford ? 'opacity-40 cursor-not-allowed' : ''}
      `}
    >
      {/* Type label */}
      <div className="text-[10px] font-semibold text-text-soft mb-1">
        {typeLabels[action.type] || action.type}
      </div>

      {/* Name */}
      <div className="text-sm font-bold text-house-green leading-tight">{action.name}</div>

      {/* Description */}
      <div className="text-[10px] text-text-soft mt-1 leading-snug">{action.description}</div>

      {/* Formula display */}
      {action.formula && (
        <div className="mt-1 text-[10px] font-mono bg-black/5 px-1.5 py-0.5 rounded">
          {formatFormula(action.formula)}
        </div>
      )}

      {/* Badges */}
      <div className="flex gap-1 mt-1.5 flex-wrap">
        {action.block && (
          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">🛡️{action.block}</span>
        )}
        {action.heal && (
          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">❤️{action.heal}</span>
        )}
        {action.faithCost && (
          <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">✝️-{action.faithCost}</span>
        )}
        {action.extraCooldown && action.extraCooldown > 0 && (
          <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">⏱️+{action.extraCooldown}s</span>
        )}
      </div>
    </button>
  );
};

interface ActionPanelProps {
  actions: CombatAction[];
  selectedAction: CombatAction | null;
  onSelectAction: (action: CombatAction | null) => void;
  onExecuteAction: (action: CombatAction, targetIndex?: number) => void;
  playerFaith: number;
  enemyCount: number;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  actions,
  selectedAction,
  onSelectAction,
  onExecuteAction,
  playerFaith,
  enemyCount,
}) => {
  const handleActionClick = (action: CombatAction) => {
    if (selectedAction?.id === action.id) {
      onSelectAction(null);
    } else {
      onSelectAction(action);
    }
  };

  const canAfford = (action: CombatAction) => {
    if (action.faithCost && action.faithCost > playerFaith) return false;
    return true;
  };

  // Group actions by type
  const grouped = actions.reduce((acc, action) => {
    if (!acc[action.type]) acc[action.type] = [];
    acc[action.type].push(action);
    return acc;
  }, {} as Record<string, CombatAction[]>);

  const typeOrder = ['attack', 'skill', 'defend', 'item', 'flee'];

  return (
    <div className="flex flex-col gap-3 bg-ceramic rounded-card p-4 border-2 border-gold/30">
      <div className="text-sm font-bold text-house-green">⚡ 选择行动</div>

      {/* Selected action confirmation */}
      {selectedAction && (
        <div className="bg-white border border-gold rounded-card p-2 flex items-center justify-between">
          <span className="text-sm font-bold">{selectedAction.name}</span>
          <div className="flex gap-2">
            {selectedAction.type === 'attack' || selectedAction.type === 'skill' ? (
              enemyCount > 1 ? (
                <span className="text-xs text-gold animate-pulse">点击敌人确认目标</span>
              ) : (
                <button
                  onClick={() => onExecuteAction(selectedAction, 0)}
                  className="px-4 py-1.5 bg-accent-green text-white rounded-pill text-sm font-semibold hover:bg-starbucks-green transition"
                >
                  执行
                </button>
              )
            ) : (
              <button
                onClick={() => onExecuteAction(selectedAction)}
                className="px-4 py-1.5 bg-accent-green text-white rounded-pill text-sm font-semibold hover:bg-starbucks-green transition"
              >
                执行
              </button>
            )}
            <button
              onClick={() => onSelectAction(null)}
              className="px-3 py-1.5 bg-ceramic text-text-soft rounded-pill text-sm hover:bg-ceramic/80 transition"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Action grid */}
      <div className="flex flex-col gap-2">
        {typeOrder.map(type => {
          const group = grouped[type];
          if (!group || group.length === 0) return null;
          return (
            <div key={type} className="flex gap-2 flex-wrap">
              {group.map(action => (
                <ActionButton
                  key={action.id}
                  action={action}
                  isSelected={selectedAction?.id === action.id}
                  canAfford={canAfford(action)}
                  onClick={() => handleActionClick(action)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
